# Evaluation

Run `python evals/webapp/serve.py` after installing root requirements.txt and importing your existing local library. No book content or real ratings are bundled.

The local viewer provides source images, generated text and SVG scenes on the left, with script score (1–7; 4 passes), visual pass/fail and comments on the right. One Save and Next action stores both dimensions. Content hashes prevent a revised page from inheriting an unrelated score; visual and script scores are independent.

`python scripts/review_loop.py` creates a regeneration plan from actual saved grades and a separate Markdown archive. Passing content stays; preferences are suggestions; pending is not failure. See ../docs/evaluation.md and ../design/book-production.md.

`check_interaction_scripts.py` provides deterministic text-lock checks plus human-review warnings; `live2d_quality.py` distinguishes material failures from suggestions. These checks are not human ratings or evidence of learning outcomes.
