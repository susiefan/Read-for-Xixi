# Maintainer-contributed human editorial evaluations

The project owner explicitly authorized publication of the existing evaluation set. `maintainer-feedback-v1.json` contains **207 saved rating records**: 102 script ratings, 91 visual ratings and 14 earlier overall ratings. These are real saved human reviews, not invented model grades or child-research results. Empty comments and passing grades are retained.

Only book/draft/page metadata, content hashes, saved scores and redacted reviewer comments are included. Complete book text, generated page scripts, scans, visual/audio files, real child profiles, reviewer identity and local filesystem paths are excluded. Editorial examples inside a review comment are the reviewer's feedback, not a distributed book script. Comments are not silently rewritten; limited privacy redaction is labelled.

Legacy overall grades remain `legacy-overall`; they are not relabelled as script scores. A positive visual score without a comment may reflect the UI's preselected pass saved with the page. This is noted per record and must not be presented as proof of independent visual inspection. These context-limited reviews are not a blinded benchmark; the private source pages/scripts are intentionally absent.

## What the rules learned

- Read the printed story before interpreting the illustration; keep character identity and action accurate.
- Use natural Mandarin and clear referents. Do not convert a contextual comment into a rule that all verbs need animate subjects.
- Notice the main event/strong feeling first; minor details, humour, colours and numbers remain valid when appropriate.
- Invite simple participation, first-level clues and direct imitation; don't demand a complex strategy.
- Keep the response connected to the invitation and its referent, with no repeated setup, unrelated extra question or future-page reveal.
- Use obvious page clues for suspense and save the payoff until the book reveals it.
- Match visual style/colour, scale and physical support; transparent scenery and meaningful wearable/held props are useful.
- Preserve accepted work. Passing suggestions do not enter the forced-regeneration queue.

The implemented AI judge reads `prompts/interaction-judge.md` through `scripts/llm_judge.py`. It uses 1–7 script scores and pass/fail visuals with explicit material findings. This is a rule-informed judge, not a claim of statistical calibration to these ratings. Actual parent review remains separate.

For other parents: export locally, inspect/redact the payload, then explicitly consent before the contribution helper opens a GitHub PR. Declining never blocks creation or use of their book. See `docs/photo-book-workflow.md`.
