"""Local viewer for scans, scripts, and Live2D drafts with versioned reviews."""

import argparse
import hashlib
import io
import json
import re
import sqlite3
from datetime import datetime, timezone
from contextlib import contextmanager
from functools import lru_cache, partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import Lock
from urllib.parse import unquote, urlsplit
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[2]
STATIC = Path(__file__).resolve().parent / "dist"
DEFAULT_DATA = ROOT / "data/local/script-evals"
SOURCE_DIRS = (ROOT / 'data/local/source-pdfs',)
PRODUCTION_DIR = ROOT / "data/local/review-production"
PASS_SCORE = 4
VERSION = re.compile(r"v([1-9][0-9]*)\.json\Z")
ASSET_FILE = re.compile(r"[a-z][a-z0-9-]{0,64}\.svg\Z")
PDF_LOCK = Lock()  # PDFium calls must be serialized across HTTP threads.


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_pdf(value, source_dirs):
    named = Path(value)
    if named.suffix.lower() != ".pdf":
        return None
    directories = [directory.resolve() for directory in source_dirs]
    if named.is_absolute():
        candidate = named.resolve()
        if candidate.parent in directories and candidate.is_file():
            return candidate
    for directory in directories:
        candidate = directory / named.name
        if candidate.is_file() and candidate.resolve().parent == directory:
            return candidate.resolve()
    return None


@lru_cache(maxsize=32)
def render_page(pdf_path, pdf_mtime, page_number):
    import pypdfium2 as pdfium

    with PDF_LOCK, pdfium.PdfDocument(pdf_path) as document:
        page = document[page_number - 1]
        try:
            bitmap = page.render(scale=2100 / max(page.get_size()))
            try:
                with io.BytesIO() as image:
                    bitmap.to_pil().convert("RGB").save(image, "JPEG", quality=92)
                    return image.getvalue()
            finally:
                bitmap.close()
        finally:
            page.close()


def review_visuals(draft_path, version_key, assets):
    if draft_path.parent.name != f"{draft_path.stem}-round":
        return None, {}, {}
    folder = draft_path.parent.resolve()
    manifest = read_json(folder / "visuals.json")

    def load_asset(spec):
        name = spec["file"]
        candidate = folder / name
        if not ASSET_FILE.fullmatch(name) or candidate.is_symlink():
            raise ValueError("Invalid SVG path in review manifest.")
        data = candidate.read_bytes()
        key = f"{version_key}/{name}"
        assets[key] = data
        return {"url": f"/visual/{key}", "sha256": hashlib.sha256(data).hexdigest(),
                "label": spec["label"], "placement": spec.get("placement"),
                "sourcePageId": spec["sourcePageId"], "reused": spec["reuseId"] is not None,
                "qualityAttempts": spec.get("quality", {}).get("attempts")}

    if "scenes" in manifest:
        stage_assets = {name: load_asset(spec) for name, spec in manifest["assets"].items()}
        scenes = {page_id: {"theme": scene["theme"], "layers": [
            {**layer, **stage_assets[layer["asset"]]} for layer in scene["layers"]
        ]} for page_id, scene in manifest["scenes"].items()}
        return None, {}, scenes
    return load_asset(manifest["background"]), {
        page_id: load_asset(spec) for page_id, spec in manifest["props"].items()
    }, {}


def revision_of(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def visual_revision_of(value):
    # URLs include review-version routing, which is not a visual change.
    def content(item):
        if isinstance(item, dict):
            return {key: content(v) for key, v in item.items() if key not in ("url", "qualityAttempts", "reused")}
        if isinstance(item, list):
            return [content(v) for v in item]
        return item
    return revision_of(content(value))


class ReviewLibrary:
    def __init__(self, root, ratings, source_dirs, production_dir=PRODUCTION_DIR):
        self.root = root
        self.ratings = ratings
        self.source_dirs = source_dirs
        self.production_dir = production_dir

    def production(self):
        queue = self.production_dir / "queue.json"
        if not queue.is_file():
            return {"books": [], "release": {"message": "当前没有绘本制作批次。"}}
        status = []
        for book in read_json(queue)["books"]:
            folder = self.production_dir / book["draft"]
            audio_status = folder / "status.json"
            parent_audio = ROOT / "data/local/books" / book["draft"] / "audio/status.json"
            if parent_audio.is_file(): audio_status = parent_audio
            audio = read_json(audio_status) if audio_status.is_file() else {}
            status.append({**book,
                           "checked": (folder / "production.json").exists(),
                           "installed": (folder / "installed.json").exists(),
                           "failed": (folder / "failure.json").exists(),
                           "audio": {key: audio[key] for key in ("status", "completedTracks", "expectedTracks") if key in audio}})
        release = self.production_dir / "release.json"
        return {"books": status, "release": read_json(release) if release.is_file() else {}}

    def drafts(self):
        books, blocked, scans, assets = [], [], {}, {}
        for source_path in sorted(self.root.glob("*/*/source.json")):
            source = read_json(source_path)
            folder = source_path.parent
            book_key = f"{folder.parent.name}/{folder.name}"
            evidence = {page["pageId"]: page for page in source["pages"]}
            versions = {path.stem: path for path in folder.glob("v*.json") if VERSION.fullmatch(path.name)}
            for path in folder.glob("v*-round/v*.json"):
                if VERSION.fullmatch(path.name) and path.parent.name == f"{path.stem}-round":
                    versions.setdefault(path.stem, path)
            if not versions:
                cover = next(iter(evidence.values()), {})
                lines = (cover.get("printedEvidence") or "").splitlines()
                title = " · ".join(lines[:2]) or Path(source.get("sourcePdf", folder.name)).stem
                issues = [page.get("visibleEvidence", "缺少扫描页") for page in evidence.values()
                          if page.get("pdfPage") is None]
                blocked.append({"title": title, "issues": issues or ["等待首轮脚本。"]})
                continue
            pdf_path = resolve_pdf(source.get("sourcePdf", ""), self.source_dirs)
            book = {"id": book_key, "batch": folder.parent.name, "versions": []}
            for version_id in sorted(versions, key=lambda name: int(name[1:])):
                path = versions[version_id]
                draft = read_json(path)
                version_key = f"{book_key}/{version_id}"
                background, props, scenes = review_visuals(path, version_key, assets)
                notes = {}
                for page_id, message in draft.get("reviewNotes", []):
                    notes.setdefault(page_id, []).append(message)
                pages = []
                for page in draft["pages"]:
                    original = evidence.get(page["pageId"], {})
                    page_number = original.get("pdfPage")
                    key = f"{version_key}/{page['pageId']}"
                    if pdf_path and type(page_number) is int and page_number > 0:
                        scans[key] = (pdf_path, page_number)
                    revision_inputs = [page, original, draft.get("visualBackground")]
                    preview = {}
                    if background:
                        preview["background"] = background
                        if page["pageId"] in props:
                            preview["prop"] = props[page["pageId"]]
                        revision_inputs.append(preview)
                    scene = scenes.get(page["pageId"])
                    if scene:
                        preview["scene"] = scene
                    revision = revision_of(revision_inputs)
                    pages.append({
                        **page, "key": key, "revision": revision, "pdfPage": page_number,
                        "hasScan": key in scans, "evidence": original.get("visibleEvidence"),
                        "activity": original.get("activityText"),
                        "reviewVisuals": preview,
                        "scriptRevision": revision_of([page.get(field) for field in ("label", "story", "invitation", "response", "narration")]),
                        "visualRevision": visual_revision_of(preview) if preview else None,
                        "legacyVisualRevision": revision_of(preview) if preview else None,
                        "scriptNotes": notes.get(page["pageId"], []),
                    })
                book["title"] = draft["title"]
                book["versions"].append({"id": version_id, "pages": pages,
                                         "background": draft.get("visualBackground")})
            books.append(book)
        return books, blocked, scans, assets

    def catalog(self):
        books, blocked, _, _ = self.drafts()
        with self.connection() as database:
            rows = database.execute("SELECT * FROM reviews").fetchall()
            split = database.execute("SELECT * FROM dimension_reviews").fetchall()
        ratings = {(row[0], row[1]): dict(score=row[2], comment=row[3], updatedAt=row[4]) for row in rows}
        dimensions = {(key, kind, revision): dict(score=score, comment=comment, updatedAt=updated)
                      for key, kind, revision, score, comment, updated in split}
        # Preserve a legacy visual grade only when its complete old preview hash
        # still matches; then alias to the content-only hash without inventing a review.
        for book in books:
            for version in book["versions"]:
                for page in version["pages"]:
                    legacy = dimensions.get((page["key"], "visual", page["legacyVisualRevision"]))
                    if legacy and (page["key"], "visual", page["visualRevision"]) not in dimensions:
                        dimensions[(page["key"], "visual", page["visualRevision"])] = {**legacy, "legacyHashVerified": True}

        def dimension_review(page_key, kind, revision):
            exact = dimensions.get((page_key, kind, revision))
            if exact is not None:
                return exact
            batch, book, version, page = page_key.split("/")
            current_version = int(version[1:])
            candidates = []
            for (old_key, old_kind, old_revision), review in dimensions.items():
                old_parts = old_key.split("/")
                if (len(old_parts) == 4 and old_kind == kind and old_revision == revision
                    and old_parts[:2] == [batch, book] and old_parts[3] == page
                    and VERSION.fullmatch(old_parts[2] + ".json") and int(old_parts[2][1:]) < current_version):
                    candidates.append((int(old_parts[2][1:]), review["updatedAt"], old_key, review))
            if not candidates:
                return None
            _, _, source_key, review = max(candidates)
            return {**review, "inheritedFrom": source_key}

        for book in books:
            for version in book["versions"]:
                for page in version["pages"]:
                    page["legacyReview"] = ratings.get((page["key"], page["revision"]))
                    page["review"] = dimension_review(page["key"], "script", page["scriptRevision"])
                    page["visualReview"] = dimension_review(page["key"], "visual", page["visualRevision"])
        return {"books": books, "blocked": blocked, "passScore": PASS_SCORE}

    @contextmanager
    def connection(self):
        self.ratings.parent.mkdir(parents=True, exist_ok=True)
        database = sqlite3.connect(str(self.ratings), timeout=10)
        try:
            with database:
                database.execute("""
                    CREATE TABLE IF NOT EXISTS reviews (
                      page_key TEXT NOT NULL, revision TEXT NOT NULL,
                      score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 7),
                      comment TEXT NOT NULL, updated_at TEXT NOT NULL,
                      PRIMARY KEY (page_key, revision)
                    )
                """)
                database.execute("""
                    CREATE TABLE IF NOT EXISTS dimension_reviews (
                      page_key TEXT NOT NULL, kind TEXT NOT NULL, revision TEXT NOT NULL,
                      score INTEGER NOT NULL, comment TEXT NOT NULL, updated_at TEXT NOT NULL,
                      PRIMARY KEY (page_key, kind, revision),
                      CHECK ((kind = 'script' AND score BETWEEN 1 AND 7)
                             OR (kind = 'visual' AND score IN (0, 1)))
                    )
                """)
                yield database
        finally:
            database.close()

    def save(self, payload):
        combined = "ratings" in payload
        ratings = payload.get("ratings") if combined else [payload]
        if not isinstance(ratings, list) or not 1 <= len(ratings) <= 2:
            raise ValueError("请选择要保存的评分。")
        books, _, _, _ = self.drafts()
        page = next((page for book in books for version in book["versions"]
                     for page in version["pages"] if page["key"] == payload.get("key")), None)
        if not page:
            raise ValueError("评审内容已更新，请刷新页面后再评分。")
        updated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
        saved = {}
        revisions = {}
        for rating in ratings:
            if not isinstance(rating, dict):
                raise ValueError("评分格式无效。")
            kind = rating.get("kind")
            if kind not in (("script", "visual") if combined else (None, "script", "visual")) or kind in saved:
                raise ValueError("评分类型无效。")
            score, comment = rating.get("score"), rating.get("comment", "")
            if kind == "visual" and (type(score) is not int or score not in (0, 1)):
                raise ValueError("请选择通过或不通过。")
            if kind != "visual" and (type(score) is not int or not 1 <= score <= 7):
                raise ValueError("请给这一页打 1–7 分。")
            if not isinstance(comment, str) or len(comment) > 4000:
                raise ValueError("评语最多 4000 字。")
            field = {None: "revision", "script": "scriptRevision", "visual": "visualRevision"}[kind]
            if not page[field] or page[field] != rating.get("revision"):
                raise ValueError("评审内容已更新，请刷新页面后再评分。")
            revisions[kind] = page[field]
            saved[kind] = {"score": score, "comment": comment.strip(), "updatedAt": updated_at}
        with self.connection() as database:
            for kind, review in saved.items():
                values = (revisions[kind], review["score"], review["comment"], updated_at)
                if kind is None:
                    database.execute("INSERT OR REPLACE INTO reviews VALUES (?, ?, ?, ?, ?)", (page["key"], *values))
                else:
                    database.execute("INSERT OR REPLACE INTO dimension_reviews VALUES (?, ?, ?, ?, ?, ?)",
                                     (page["key"], kind, *values))
            if any(kind is not None for kind in saved):
                self.archive_dimensions(database, page["key"])
        return saved if combined else next(iter(saved.values()))

    def archive_dimensions(self, database, page_key):
        batch, book, version, _ = page_key.split("/")
        folder = self.root.parent / "script-eval-feedback" / batch
        folder.mkdir(parents=True, exist_ok=True)
        rows = database.execute("""
            SELECT page_key, kind, revision, score, comment, updated_at FROM dimension_reviews
            WHERE substr(page_key, 1, ?) = ? ORDER BY page_key, kind, updated_at
        """, (len(prefix := f"{batch}/{book}/{version}/"), prefix))
        lines = [f"# {book} · {version} · 分项评审", "", "时间为纽约当地时间。", ""]
        for key, kind, revision, score, comment, updated in rows:
            label = f"脚本 {score}/7" if kind == "script" else f"Live2D {'通过' if score else '不通过'}"
            timestamp = datetime.fromisoformat(updated).astimezone(ZoneInfo("America/New_York"))
            lines.extend([f"## {key.rsplit('/', 1)[-1]} · {label}", "", timestamp.isoformat(), "",
                          f"<!-- revision: {revision} -->", ""])
            lines.extend([f"> {line}" if line else ">" for line in comment.split("\n")] if comment else ["未留文字评语。"])
            lines.append("")
        with NamedTemporaryFile(dir=folder, mode="w", encoding="utf-8", delete=False) as temporary:
            temporary.write("\n".join(lines))
        Path(temporary.name).replace(folder / f"{book}-{version}-split.md")


def feedback(catalog):
    result = {"passScore": PASS_SCORE, "pending": 0, "passed": 0,
              "belowBar": [], "passingComments": [], "visualPending": 0, "visualPassed": 0,
              "visualFailed": [], "visualPassingComments": [], "blocked": catalog["blocked"]}
    for book in catalog["books"]:
        version = book["versions"][-1]
        for page in version["pages"]:
            key_info = {"title": book["title"], "version": version["id"], "pageId": page["pageId"],
                        "pdfPage": page["pdfPage"], "key": page["key"]}
            visual = page["visualReview"]
            if page["visualRevision"]:
                if visual is None:
                    result["visualPending"] += 1
                elif visual["score"] == 0:
                    preview = page["reviewVisuals"]
                    targets = (preview["scene"]["layers"] if "scene" in preview else list(preview.values()))
                    result["visualFailed"].append({**key_info, **visual, "kind": "visual", "targets": [
                        {key: target[key] for key in ("label", "sourcePageId", "url") if key in target} for target in targets
                    ]})
                else:
                    result["visualPassed"] += 1
                    if visual["comment"]:
                        result["visualPassingComments"].append({**key_info, **visual, "kind": "visual"})
            review = page["review"]
            if review is None:
                result["pending"] += 1
                continue
            entry = {**key_info, **review}
            if review["score"] < PASS_SCORE:
                result["belowBar"].append(entry)
            else:
                result["passed"] += 1
                if review["comment"]:
                    result["passingComments"].append(entry)
    return result


class ReviewHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, library, **kwargs):
        self.library = library
        super().__init__(*args, **kwargs)

    def allowed(self):
        port = self.server.server_port
        hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}
        origin = self.headers.get("Origin")
        return self.headers.get("Host") in hosts and (not origin or origin in {f"http://{host}" for host in hosts})

    def send_bytes(self, status, body, content_type, cache="no-store"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        policy = "default-src 'none'; sandbox" if content_type == "image/svg+xml" else (
            "default-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        self.send_header("Content-Security-Policy", policy)
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, status, value):
        self.send_bytes(status, json.dumps(value, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def do_GET(self):
        if not self.allowed():
            self.send_json(403, {"error": "请从本机打开评审工具。"})
            return
        path = unquote(urlsplit(self.path).path)
        static = {"/": ("index.html", "text/html"), "/app.css": ("app.css", "text/css"),
                  "/app.js": ("app.js", "text/javascript"), "/mimi.svg": ("mimi.svg", "image/svg+xml"),
                  "/production": ("production.html", "text/html"), "/production.js": ("production.js", "text/javascript"),
                  "/open-source": ("open-source.html", "text/html"),
                  "/open-source.js": ("open-source.js", "text/javascript"),
                  "/open-source.css": ("open-source.css", "text/css")}
        try:
            if path in static:
                name, content_type = static[path]
                self.send_bytes(200, (STATIC / name).read_bytes(), content_type + "; charset=utf-8")
            elif path == "/api/catalog":
                self.send_json(200, self.library.catalog())
            elif path == "/api/feedback":
                self.send_json(200, feedback(self.library.catalog()))
            elif path == "/api/production":
                self.send_json(200, self.library.production())
            elif path == "/api/open-source":
                self.send_json(200, read_json(ROOT / "data/open-source-release.json"))
            elif path.startswith("/scan/"):
                _, _, scans, _ = self.library.drafts()
                match = scans.get(path[len("/scan/"):])
                if not match:
                    self.send_json(404, {"error": "找不到该页的原始扫描。"})
                    return
                pdf, page = match
                self.send_bytes(200, render_page(pdf, pdf.stat().st_mtime_ns, page), "image/jpeg", "private, max-age=60")
            elif path.startswith("/visual/"):
                _, _, _, assets = self.library.drafts()
                match = assets.get(path[len("/visual/"):])
                if match is None:
                    self.send_json(404, {"error": "找不到该版的 Live2D 资产。"})
                    return
                self.send_bytes(200, match, "image/svg+xml")
            else:
                self.send_json(404, {"error": "找不到这个地址。"})
        except (BrokenPipeError, ConnectionResetError):
            return  # The browser can cancel an image request when changing pages.
        except (OSError, ValueError, KeyError, IndexError, RuntimeError, sqlite3.Error) as error:
            self.log_error("%s", error)
            self.send_json(500, {"error": "读取评审数据失败。请查看本地服务日志。"})

    def do_PUT(self):
        if not self.allowed():
            self.send_json(403, {"error": "请从本机打开评审工具。"})
            return
        if self.path != "/api/review":
            self.send_json(404, {"error": "找不到这个地址。"})
            return
        try:
            size = int(self.headers.get("Content-Length", 0))
            if self.headers.get_content_type() != "application/json" or not 0 < size <= 40_000:
                raise ValueError("评审提交格式无效。")
            payload = json.loads(self.rfile.read(size))
            if not isinstance(payload, dict):
                raise ValueError("评审提交格式无效。")
            self.send_json(200, self.library.save(payload))
        except ValueError as error:
            self.send_json(400, {"error": str(error)})
        except (OSError, KeyError, sqlite3.Error) as error:
            self.log_error("%s", error)
            self.send_json(500, {"error": "保存失败，评语仍保留在输入框。"})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4327)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--ratings", type=Path)
    parser.add_argument("--production-dir", type=Path, default=PRODUCTION_DIR)
    parser.add_argument("--source-dir", type=Path, action="append", default=[])
    parser.add_argument("--feedback", action="store_true", help="Print saved grades for the latest versions")
    args = parser.parse_args()
    library = ReviewLibrary(args.data, args.ratings or args.data / "ratings.sqlite3",
                            [*args.source_dir, *SOURCE_DIRS], args.production_dir)
    if args.feedback:
        print(json.dumps(feedback(library.catalog()), ensure_ascii=False, indent=2))
        return
    try:
        import pypdfium2  # noqa: F401
    except ImportError:
        parser.exit(1, "Install requirements.txt in a Python 3.11+ virtual environment. See README.md.\n")
    with ThreadingHTTPServer(("127.0.0.1", args.port), partial(ReviewHandler, library=library)) as server:
        print(f"Local URL: http://127.0.0.1:{server.server_port}/", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
