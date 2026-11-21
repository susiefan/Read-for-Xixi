# Security and privacy

Do not report vulnerabilities by posting child media, full book scans, recordings, access tokens, precise locations or private review logs in public issues. Contact the repository owner privately through the contact method on the GitHub profile.

The current static reader uses button controls, local audio playback and browser localStorage for star totals and preferences. It does not request microphone/camera access, record children or send telemetry. Imported text, scans, SVGs, audio and actual human feedback default to local-only storage ignored by Git; explicitly approved, redacted editorial feedback may be donated separately. A static build made AFTER local import contains those book resources and must not be uploaded as the generic open-source distribution.

The local evaluation server binds to loopback, validates Host/Origin and restricts SVG responses. It is not an authenticated multi-user service and should not be exposed publicly as-is. User comments are written to local SQLite and Markdown.

Optional offline generation transmits explicitly supplied page images, text and prompts to the configured model API. Keys are read from the server environment, never bundled in the browser. API generation runs only through an explicit CLI command. Generated candidates are checked before they replace an accepted local package. Model weights and voice reference recordings are not distributed.

The package importer limits file paths, symlinks, duplicate members, sizes, counts and verifies hashes. Treat untrusted PDFs as untrusted input; keep PDF and image dependencies current. The current validation confirms package structure and integrity, not legal rights or semantic truth.

Custom companions are data-only JSON: the importer enforces geometry/attribute allowlists and bounded sizes, and the renderer creates SVG elements through React rather than injecting markup. Avatar JSON is stored in the current browser, not uploaded by the app. It contains no required child identity or media.

The optional evaluation contribution helper validates an allowlisted text-only payload and requires consent matching its exact SHA-256, public repository and MIT license before any upload. The maintainer-authorized dataset under evals/contributions is an explicit exception to the default private-feedback boundary. Book content and child data remain excluded.
