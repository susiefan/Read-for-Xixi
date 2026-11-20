# Build and deployment

The reader is a static Vite app. `pnpm build` creates dist/; host that directory on any static host. Source JSON, generated page images, SVGs and existing WAVs live under public/. No server API or embedded credentials are required for local-library playback. Import existing books with `python scripts/import_existing_library.py /path/to/storyspark-app` before building. A fresh public clone contains no book content.

`pnpm dev` and `pnpm preview` bind to loopback by default. This is a desktop/local starter, not a new deployment of the family's existing ChatGPT Site. Existing family-site content is not included in the GitHub release. Public hosting of the open demo is a separate choice.

## Local tools

- Reader: Vite port 5173 (or the printed available port).
- Review tool: `python evals/webapp/serve.py --port 4327`.
- Release dashboard: the same server's `/open-source`.
- Requirement/progress data: data/open-source-release.json.
- Update status: `python scripts/release_status.py TASK_ID active --note 'Evidence-based status'`.
- Reviews and private drafts: ignored data/local/; do not commit these.

The review server is local-only, verifies Host/Origin and serves assets through validated paths. Do not expose it publicly without adding authentication, HTTPS and deployment-specific hardening. The static reading app does not expose the evaluation write API.

## Release verification

CI installs locked Node dependencies and pinned Python dependencies, prepares examples, validates package structure and import behavior, executes regression tests, builds the static reader and scans publication scope. Release artifacts are the source tar/zip provided by GitHub without private book packages. The readable report in release/validation.json records the checks actually run; it is not a claim of browser or toddler testing.
