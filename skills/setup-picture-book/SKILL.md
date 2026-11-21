---
name: setup-picture-book
description: Turn a caregiver-supplied folder of book-page photos into a local Read for Xixi experience with page scripts, visual assets, parent evaluation and final voice tracks. Use for the complete family onboarding/book workflow, including optional explicitly consented GitHub feedback contribution. Do not use for ordinary PDF summaries or publishing a book publicly.
---

Read [the workflow reference](references/workflow.md) for commands, data boundaries and review gates. Work in the Read for Xixi repository; install its documented dependencies if necessary. Do not claim the pipeline ran merely because you wrote a script.

## Set up the family first

Ask together for information not already supplied:

1. What should the companion call the child? A nickname or “宝宝” is enough; do not require a legal name.
2. How old is the child? Use months (convert years/months precisely); age guides participation, not an assessment.
3. What reading companion would they like? Offer the **existing animated white cat** as a ready choice, then the existing 3D/classic cats or a custom animal based on their interests.

Respect answers already in the conversation. Confirm the book-photo folder and reading language if unclear. If they choose the existing white cat, reuse it without redesign or illustration generation. If they explicitly request a custom appearance, follow `create-reading-avatar` from the same skill collection (or the repo's skills/create-reading-avatar/SKILL.md), produce the data-only avatar and show how to import it. Never invent a new animal preference for the family.

Check model access and the configured local voice environment early. Reuse existing server environment/configuration rather than asking for keys every run; never print keys. Ask about an unavailable required model/voice setup before a long production run. The current authoring prompts focus on Mandarin; do not promise automatic English narration from the interface-language switch.

## Photos to a reviewable book

Use the photos as the primary source. Inspect order (natural numbered filenames or an explicit order file); ask if cover/spread order is ambiguous. Keep originals local and preserve their hashes. Read the printed text first, then interpret illustrations; transcribe exactly, keeping translation separate. A cropped/uncertain line must be flagged for parent review rather than silently invented.

Run prepare, then build with the actual available vision/authoring and visual model IDs. The authoring agent writes one mandatory invitation, one brief response and the visual plan in the book script. Separate visual prompts generate transparent flat (平涂) background/foreground assets from the same original page. Use the shared LLM rubric; record AI results as AI results. Clear defects may retry up to three times. Preferences/uncertainty are suggestions; preserve accepted dimensions and previously approved pages.

Launch the local evaluation web app and give/open its actual URL using supported app tools; do not require computer-use testing. Parents see original photo, script/translation and composed visuals together, with script 1–7 (4 passes), visual pass/fail and one Save and Next. No final voice generation while current pages are unreviewed, failing or changed since review. Record progress in the local workflow/production status.

Read saved comments and explain targeted changes. Use review_loop.py to separate failures from passing suggestions, regenerate only requested/failed dimensions and publish a new review round. Keep source-text corrections explicit. Do not call an AI judge's score a parent grade, and do not rewrite good pages just to satisfy a preferred phrasing.

## Optional contribution, then final audio

Export a text-only contribution preview: ratings, page/version metadata and redacted editorial comments. Show the actual file, destination, license and a brief content summary. Ask whether the parent wants **that exact payload** posted publicly to GitHub under MIT. This is optional and separate from making the book. No reply is not consent; declining never blocks final voice or reading. Existing explicit authorization for the exact dataset need not be requested again.

Only after explicit permission create the hash-bound approval record and run contribute_evals.py --publish. It uses an isolated repository/fork and opens a PR; never stages their working book folder. Exclude book text/scripts, photos, generated book art/audio, child profiles, recordings, identities and local paths. Record the PR URL; never claim it was submitted if upload failed.

When the parent has finished reviewing and all current script/visual reviews pass, run check-review, build the exact-text speech manifest and start final voice using the configured approved profile. Making the book already authorizes its requested final audio; do not invent another approval question after the parent has completed the agreed review. Do not silently substitute a voice. Install the finished local book and show the reading app URL. Public publication of book contents is outside this skill.
