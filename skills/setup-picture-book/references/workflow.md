# Workflow commands and contract

Run from the Read for Xixi checkout. All child/book data goes under ignored data/local/ or public/library/. Example values below are placeholders to replace with the caregiver's actual supplied preferences; they are not a request to create another demo book.

## Environment

Install README dependencies once. Optional generation reads OPENAI_API_KEY from the server environment and takes explicit --model / --visual-model IDs available to the parent. Local TTS uses STORYSPARK_TTS_LAB or --lab, with the already approved data/voices/mimi-instruct2.json profile. Check for an installed lab, model weights, packaged engine prompt and its Python before starting; see docs/authoring.md. No key/model is needed to prepare photos or review locally.

## Prepare and build

```bash
python scripts/photo_book_workflow.py prepare /path/to/book-photos \
  --book-id my-book --title 'My book' \
  --child-name '宝宝' --age-months 24 --character white-2d
python scripts/photo_book_workflow.py build data/local/books/my-book \
  --model ACTUAL_AVAILABLE_MODEL --visual-model ACTUAL_AVAILABLE_VISUAL_MODEL
```

Supported input: JPEG, PNG, WebP. Convert HEIC to one of these first. Each photo becomes one ordered page/spread. Natural filename order is the default; --order points to a JSON array of relative filenames when needed. Prepare writes a local PDF/preview, original-photo hashes and the supplied profile. It makes no API calls. Build first transcribes original print and concrete visible evidence, then produces page script and transparent assets, with bounded internal checks. Uncertain print is retained as a review warning.

The review round is created under data/local/script-evals/parent-books/BOOK/vN-round. New rounds increment versions; unchanged dimensions can retain their exact-hash prior parent grade with inheritedFrom provenance; changed dimensions need a new grade. Workflow status is in data/local/books/BOOK/workflow.json; the production dashboard reads the queue/status. Partial runs can resume; completed script pages are kept unless explicitly regenerated.

```bash
python evals/webapp/serve.py --port 4327
python scripts/photo_book_workflow.py status data/local/books/my-book
```

Open http://127.0.0.1:4327/ and select the book/latest version. /production shows batch progress. The translation/narration is shown separately when it differs from original print. Parents score script 1–7 and visuals pass/fail. A default positive visual selection is saved only by the parent's Save and Next; it must not be described as independent expert inspection.

## Targeted revision

```bash
python scripts/review_loop.py
python scripts/regenerate_page.py data/local/books/my-book p003 \
  --dimension script --feedback 'The parent’s actual correction' \
  --model ACTUAL_AVAILABLE_MODEL
python scripts/photo_book_workflow.py review data/local/books/my-book
```

Use visual / both only when those dimensions need revision. Printed text is locked. For an OCR correction, compare the original, explicitly correct source.json printedEvidence AND the matching book.json story, then regenerate the affected page. Publish another review round; changed scripts/translation/assets need current reviews. The CLI's check-review validates script hashes, asset hashes and every parent grade before final audio.

## Optional public evaluation contribution

```bash
python scripts/export_eval_contribution.py data/local/script-evals/ratings.sqlite3 \
  --redact-name "宝宝" --output data/local/contributions/my-feedback.json
python scripts/contribute_evals.py data/local/contributions/my-feedback.json
```

This only writes/shows a local preview. Inspect every comment for identifying material and copyrighted passages; keep editorial feedback, not copied book pages. Show it to the parent, say the destination is susiefan/Read-for-Xixi and the contribution license MIT, and ask before public upload.

After explicit permission, write a LOCAL approval JSON with approved:true, sha256 (the exact preview hash), repository:'susiefan/Read-for-Xixi', license:'MIT'. Never create it speculatively. Then:

```bash
python scripts/contribute_evals.py data/local/contributions/my-feedback.json \
  --publish --approval data/local/contributions/approval.json
```

Requires the parent's own authenticated gh CLI, Git identity and network. A changed payload hash invalidates consent. Publishing uses an isolated clone/fork and opens a PR; no book/profile/scan/audio directory is uploaded. Contribution can be declined and is never a prerequisite for audio or local use.

## Final voice and install

```bash
python scripts/photo_book_workflow.py check-review data/local/books/my-book
python scripts/photo_book_workflow.py voice data/local/books/my-book \
  --lab /path/to/tts-lab --python /path/to/tts-lab/cosy-env/bin/python
pnpm dev
```

Voice runs only for current parent-passed pages, binds the exact speech text/profile, records progress and installs the finished book in ignored public/library/. The runtime catalog omits child-profile metadata. The nickname can appear in the authored audio where it was reviewed. Do not publish that private catalog/build just because the tools are open source.

For a custom companion, prepare with `--character custom:YOUR_AVATAR_ID --avatar-file /path/to/companion.avatar.json`. The validated avatar reference is used during visual generation/judging so held/worn props fit that animal. Import that same JSON in the reader settings. Built-in white-cat selection needs no avatar file or new artwork.
