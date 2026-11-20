"""Check each Live2D candidate before adding it to a review round."""

from __future__ import annotations

import io
import shutil
import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree

from PIL import Image


MAX_ATTEMPTS = 3
CHECKS = ("sourceMatch", "noSpoiler", "flatStyle", "stageFit", "physicalSupport")
REVIEW_PROMPT = """Compare the original picture-book scan with the rendered Live2D SVG candidate.
Judge each check independently. Use pass when it works, suggestion for a valid alternative,
stylistic preference, or uncertainty, and blocking only for a definite material error.
Describe exactly what is wrong and what to change when blocking. sourceMatch checks the
selected subject and visible details against the scan.
noSpoiler checks that the asset and any background details only show information available
by the intended page (a book-wide background is visible from the cover). flatStyle checks the
original Mimi 平涂 art direction, with flat book-matched fills, clear silhouettes and minimal detail.
stageFit checks that a background keeps the central third clear and that a prop is readable at
small size, has enough padding, and fits in the given corner. Judge the provided images directly.
physicalSupport checks visible contact with a floor, tabletop, pot, or paw where the provided
view shows the support. Judge a gap that makes an object look accidentally floating as blocking.
Treat intended airborne actions and an occlusion that cannot be evaluated from this view appropriately.
Avoid suggestions that would introduce details not in the scan. A different good interpretation
or color choice within the palette can pass. Do not grade the reading script.
"""


def split_findings(checks):
    blocking, suggestions = [], []
    for key in CHECKS:
        finding = checks.get(key, "")
        if isinstance(finding, str):
            if finding.strip():
                blocking.append(finding.strip())  # Existing human review records are explicit corrections.
        elif finding["level"] == "blocking":
            blocking.append(finding["message"].strip() or f"Review {key} against the original scan.")
        elif finding["level"] == "suggestion" and finding["message"].strip():
            suggestions.append(finding["message"].strip())
    return blocking, suggestions


def render_svg(svg: str) -> bytes:
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Install Node.js and run pnpm install for SVG checks.")
    script = """import {Resvg} from '@resvg/resvg-js';
import fs from 'node:fs';
process.stdout.write(new Resvg(fs.readFileSync(0), {font:{loadSystemFonts:false},
fitTo:{mode:'width',value:720}}).render().asPng());"""
    run = subprocess.run([node, "--input-type=module", "-e", script],
                         input=svg.encode("utf-8"), capture_output=True, timeout=15,
                         cwd=Path(__file__).resolve().parents[1])
    if run.returncode:
        raise ValueError("SVG renderer failed; verify pnpm dependencies and SVG syntax.")
    return run.stdout


def inspect_svg(svg: str, kind: str, validate_svg=None) -> tuple[str, bytes]:
    from tempfile import TemporaryDirectory
    # New reusable exports, including scenery, always have transparent surrounds.
    if validate_svg is not None:
        svg = validate_svg(svg, kind=kind)
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    from book_package import check_svg
    with TemporaryDirectory() as folder:
        path = Path(folder) / "candidate.svg"
        path.write_text(svg)
        check_svg(path)
    png = render_svg(svg)
    with Image.open(io.BytesIO(png)) as image:
        alpha = image.convert("RGBA").getchannel("A")
        histogram = alpha.histogram()
        if histogram[0] < image.width * image.height // 12:
            raise ValueError("Keep a transparent surround; the stage supplies the base colour.")
        if sum(histogram[128:]) < image.width * image.height // 100:
            raise ValueError("The subject is invisible or too small at stage size.")
    return svg.strip() + "\n", png


def checked_asset(candidate, review, validate_svg, *, kind, previous=None):
    history = []
    for attempt in range(1, MAX_ATTEMPTS + 1):
        reused = previous is not None and attempt == 1
        svg = previous if reused else candidate(attempt, history[-1] if history else [])
        suggestions = []
        try:
            svg, png = inspect_svg(svg, kind, validate_svg)
        except ValueError as error:
            issues = [str(error)]
        else:
            issues, suggestions = review(svg, png)
        if not issues:
            return svg, {"attempts": attempt, "reused": reused, "corrections": history, "suggestions": suggestions}
        history.append(issues)
    raise ValueError(f"{kind} failed Live2D review after {MAX_ATTEMPTS} attempts: {history[-1]}")
