# Confidential runtime content

This directory documents the inputs used by the complete Read-for-Xixi system without committing copyrighted books or family data.

The subdirectories are intentionally protected by the repository `.gitignore`. Only these instructions and synthetic example manifests should be committed.

| Folder | Local or private-service content |
| --- | --- |
| `books/` | Book photographs, transcripts, approved page maps, and page-specific interaction scripts |
| `voices/` | Caregiver reference recordings, child-name recordings, consent records, and voice configuration |
| `child-profiles/` | Parent-approved interaction observations and language preferences |
| `generated-audio/` | CosyVoice narration, expansion tracks, and timing metadata |
| `session-recordings/` | Opt-in research recordings and session-level event data |

Use opaque identifiers in application code. Do not place a child's name, a real book title, a local absolute path, or a family recording in source files.
