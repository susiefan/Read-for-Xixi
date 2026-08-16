# Confidential books

Store each family's physical-book input outside the repository. A private book package may contain:

```text
book-id/
├── source-images/          # cover and ordered physical spreads
├── transcript.txt          # optional correction layer
├── page-map.json           # reviewed multimodal analysis
└── interaction-script.json # approved narration and expansion branches
```

The application should receive short-lived object references rather than filesystem paths. Images are used for OCR and visual grounding; transcripts improve text accuracy but do not replace visual context.

`book-manifest.example.json` is entirely synthetic and contains no copyrighted text.
