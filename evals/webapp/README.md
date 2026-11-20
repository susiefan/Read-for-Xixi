# Local review UI

From the repository root:

```bash
source .venv/bin/activate
python scripts/import_existing_library.py /path/to/existing/storyspark-app
python evals/webapp/serve.py
```

Open http://127.0.0.1:4327/ for source scans, authored script, SVG preview and ratings. Open /open-source for requirements and release status. Use --port to choose another port.

Local data defaults to data/local/script-evals; --data, --ratings and repeated --source-dir arguments allow other locations. Reviews use per-dimension hashes. Script rating is 1–7, 4 passes; visual rating is pass/fail, preselected pass for new pages but saved only by the user's Save and Next action. Actual saved comments are archived in local Markdown; no human feedback is uploaded to Git.

Do not expose this loopback service publicly without authentication and deployment-specific review. See ../../docs/evaluation.md for regeneration behavior.
