"""Check a local authoring draft and print an editable Markdown review sheet."""

import argparse
import json
import re
from pathlib import Path


HINT = re.compile(r"看看|看一看|瞧瞧|听听|听一听|我看到|咦|我们|一起|跟着|来学|来做|来试试|假装|指给|摸摸|敲一敲|闻一闻|你看[，。！]")
STRATEGY = re.compile(r"(?:怎样|怎么|怎么办).{0,16}(?:才不会|才能|才可以)")
SOUND_CALQUE = re.compile(r"学(?:着)?(?:门铃|闹钟|电话)(?:响|叫)(?:一声|一下)")
VISUAL_ATTRIBUTE = re.compile(
    r"(?:什么|哪[种些个])(?:颜色|形状)|说说[^。！？]{0,14}(?:颜色|形状)|"
    r"数一数|数数|有几[个只朵片颗块条辆杯张]"
)
FILLER = ("我们再看看这一页", "翻到下一页")
QUESTIONS = re.compile(r"[？?]")
MODELED_REQUEST = re.compile(r"(?:会这样问|会说|可以说|来学[^。！？]+说)[：，]?\s*“[^”]+”")
PLANTING_QUESTION = re.compile(r"(?:想|会)(?:在[^，。！？]{1,10})?种什么[呀啊呢]?[？?]")
SUSPENSE_GUESS = re.compile(r"猜[^。！？?]{0,16}(?:谁|什么|哪)[^。！？?]{0,8}[？?]")
PICTURE_CLUE = re.compile(r"露[出着]|只看见|只看到|挡住|探出|偷偷|藏在|影子|脚印")


def check(source, script):
    problems = []
    warnings = []
    expected = source["pages"]
    actual = script["pages"]
    if "pdfPageCount" in source:
        pdf_pages = [page.get("pdfPage") for page in expected + source.get("excludedPages", [])]
        if (any(type(number) is not int for number in pdf_pages)
                or sorted(pdf_pages) != list(range(1, source["pdfPageCount"] + 1))):
            problems.append(("全书", "PDF 页序记录有缺漏、重复或超出范围。"))
    for label, pages in [("原文", expected), ("脚本", actual)]:
        ids = [page["pageId"] for page in pages]
        if not ids or len(ids) != len(set(ids)):
            problems.append(("全书", f"{label}跨页 ID 为空或有重复。"))
    if source["bookId"] != script["id"] or script.get("audioBase") != f"/audio/{source['bookId']}":
        problems.append(("全书", "书籍 ID 或预留音频路径与原文记录不一致。"))
    if [page["pageId"] for page in expected] != [page["pageId"] for page in actual]:
        problems.append(("全书", "跨页有缺漏、多余项目或顺序变化。"))
    actual_by_id = {page["pageId"]: page for page in actual}
    seen_invitations = set()
    first_planting = None
    for evidence in expected:
        page_id = evidence["pageId"]
        page = actual_by_id.get(page_id, {})
        locked = evidence.get("printedEvidence")
        if not isinstance(locked, str) or locked.strip() == "NA":
            problems.append((page_id, "原文尚未锁定。"))
        elif page.get("story") != locked:
            problems.append((page_id, "旁白与锁定原文逐字比较失败。"))
        invitation = page.get("invitation")
        response = page.get("response")
        if not isinstance(invitation, str) or not invitation.strip():
            problems.append((page_id, "缺少必选邀请。"))
        else:
            if len(QUESTIONS.findall(invitation)) > 1:
                problems.append((page_id, "邀请包含多个问题。"))
            if STRATEGY.search(invitation):
                warnings.append((page_id, "复核这句是否在要求孩子解释复杂策略。"))
            if not HINT.search(invitation) and not re.match(r"^[^？?]{2,}[。！]", invitation):
                warnings.append((page_id, "请核对邀请是否已给出可见或可模仿的第一级提示。"))
            normalized = re.sub(r"[^\w]", "", invitation)
            if normalized in seen_invitations:
                problems.append((page_id, "与更早的邀请文字重复。"))
            seen_invitations.add(normalized)
            if PLANTING_QUESTION.search(invitation):
                if first_planting is None:
                    first_planting = page_id
                else:
                    warnings.append((page_id, f"较早的 {first_planting} 已经问过想种什么。这一页可以聊新出现的画面细节。"))
        if not isinstance(response, str) or not response.strip():
            problems.append((page_id, "缺少回应。"))
        elif QUESTIONS.search(MODELED_REQUEST.sub("", response)):
            warnings.append((page_id, "回应出现问号，请复核它是否在发起新的提问。"))
        if isinstance(invitation, str) and SUSPENSE_GUESS.search(invitation):
            if not PICTURE_CLUE.search(invitation) and evidence.get("visibleEvidence"):
                warnings.append((page_id, "复核当页能否给孩子一个指得出的猜测线索。已在邀请里给了具体提示的好问题可以保留。"))
            if isinstance(response, str) and re.search(r"原来是|就是(?:他|她|它|皮普|波西)", response):
                warnings.append((page_id, "核对本页是否已经揭晓。若书留到后页才揭晓，回应继续聊线索。"))
        if any(isinstance(turn, str) and "冬天的小细节" in turn for turn in (invitation, response)):
            warnings.append((page_id, "复核「冬天的小细节」是否说出了可见的具体事物。"))
        for phrase in FILLER:
            if any(isinstance(turn, str) and phrase in turn for turn in (invitation, response)):
                problems.append((page_id, f"出现禁用表达「{phrase}」。"))
        if any(isinstance(turn, str) and SOUND_CALQUE.search(turn) for turn in (invitation, response)):
            warnings.append((page_id, "复核模仿声音的口语。可以直接说「叮咚」，或顺着情节问「咦，门口有人。你猜是谁呀？」"))
    if len(actual) > 1 and not any(VISUAL_ATTRIBUTE.search(str(page.get("invitation", ""))) for page in actual):
        warnings.append((actual[0]["pageId"], "全书复核。如果画面有合适的机会，安排至少一次描述颜色、形状或数一数的邀请。"))
    return problems, warnings


def check_feedback_regressions(source, script):
    # Book-specific human feedback is private. General rules live in prompts/.
    return []


def make_report(source, script, previous, findings):
    problems, warnings = findings
    previous_pages = {page["pageId"]: page for page in previous["pages"]} if previous else {}
    if previous and previous["id"] != script["id"]:
        raise ValueError("只能比较同一本书的脚本。")
    yield f"# {script['title']}｜逐页评审"
    yield f"\n机器检查共 {len(problems)} 个阻断项、{len(warnings)} 个提醒。页码以 PDF 阅读器的页序为准。"
    if Path(source.get("sourcePdf", "")).is_absolute():
        yield f"\n[打开原始扫描 PDF](<{source['sourcePdf']}>)"
    for excluded in source.get("excludedPages", []):
        yield (f"\nPDF 第 {excluded['pdfPage']} 页另列为{excluded.get('role', excluded.get('reason', '非故事页'))}。"
               f"原文　{excluded.get('printedEvidence', '')}")
    yield "\n每页可填 `保留` 或 `重写`。写明想改的字段和原因即可。留空表示尚未评审。"
    if script.get("intro"):
        yield f"\n开场　{script['intro']}"
    if script.get("visualBackground"):
        yield f"\n背景计划　{script['visualBackground']['label']}"
    for heading, issues in [("阻断项", problems), ("需要人工查看", warnings)]:
        if issues:
            yield f"\n## {heading}\n"
            for page_id, message in issues:
                yield f"- `{page_id}`　{message}"
    evidence_by_id = {page["pageId"]: page for page in source["pages"]}
    for page in script["pages"]:
        page_id = page["pageId"]
        evidence = evidence_by_id.get(page_id, {})
        yield f"\n## {page['label']} · PDF 第 {evidence.get('pdfPage', '？')} 页\n"
        yield f"跨页 ID　`{page_id}`\n"
        for field, title in [("story", "旁白"), ("invitation", "邀请"), ("response", "回应")]:
            value = page.get(field, "")
            yield f"**{title}**　" + str(value).replace("\n", "  \n") + "\n"
        if evidence.get("visibleEvidence"):
            yield f"本页画面　{evidence['visibleEvidence']}\n"
        reference = page.get("readingReference")
        if reference:
            yield f"共读参考（{reference['time']}）　{reference['observation']}\n"
            yield f"可借鉴　{reference['adaptation']}\n"
            if reference.get("caregiverPrompt"):
                yield f"读完后可以聊　{reference['caregiverPrompt']}\n"
        if evidence.get("activityText"):
            activity = evidence["activityText"].replace("\n", "  \n")
            yield f"页底找图栏　{activity}\n"
        if page.get("visualAsset"):
            yield f"道具计划　{page['visualAsset']['label']}\n"
        if page.get("mimiAssets"):
            yield "拟复用道具　" + "、".join(page["mimiAssets"]) + "\n"
        if previous:
            earlier = previous_pages.get(page_id, {})
            changed = [field for field in ("story", "invitation", "response", "visualAsset", "mimiAssets")
                       if earlier.get(field) != page.get(field)]
            if changed:
                yield "对照上一轮　" + "、".join(changed) + "\n"
                for field, title in [("story", "旁白"), ("invitation", "邀请"), ("response", "回应")]:
                    if field in changed:
                        prior_text = str(earlier.get(field, "")).replace("\n", "  \n  ")
                        yield f"- 上一轮{title}　{prior_text}"
                yield ""
            else:
                yield "本页与上一轮一致。\n"
        yield "评审　<!-- 保留或重写，注明邀请／回应／原文核对／画面 -->\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Frozen page evidence JSON")
    parser.add_argument("draft", type=Path, help="Authored book-script JSON")
    parser.add_argument("--previous", type=Path, help="Previous draft for the same book")
    parser.add_argument("--report", type=Path, help="Write a new Markdown review sheet")
    args = parser.parse_args()
    try:
        source = json.loads(args.source.read_text(encoding="utf-8"))
        script = json.loads(args.draft.read_text(encoding="utf-8"))
        previous = json.loads(args.previous.read_text(encoding="utf-8")) if args.previous else None
        problems, warnings = check(source, script)
        warnings.extend(check_feedback_regressions(source, script))
        if args.report:
            report = "\n".join(make_report(source, script, previous, (problems, warnings))) + "\n"
            with args.report.open("x", encoding="utf-8") as output:
                output.write(report)
    except (OSError, TypeError, ValueError, KeyError) as error:
        parser.exit(2, f"评审文件错误：{error}\n")
    for severity, items in [("阻断", problems), ("提醒", warnings)]:
        for page_id, message in items:
            print(f"[{severity}] {page_id} {message}")
    print(f"{script['title']} · {len(script['pages'])} 个跨页 · {len(problems)} 个阻断项 · {len(warnings)} 个提醒")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
