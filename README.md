# Read-for-Xixi — privacy-safe portfolio build

Read-for-Xixi is a physical-book-first reading companion for families with young children. A responsive animated character supports shared reading while the real book remains the center of attention.

This public repository is a recruiter-facing technical snapshot. It demonstrates the product architecture, responsive interface, animated companion, and adaptive session state machine without publishing private book content, family media, generated voices, transcripts, or production interaction scripts.

## What this demonstrates

- product framing for a low-screen, parent-and-child experience;
- an animated Live 2D companion built with React and SVG;
- a deterministic reading-session state machine;
- separation between private content and the public application shell;
- responsive, accessible UI design;
- a scalable architecture for page analysis, adaptive dialogue, and voice rendering.

## Run locally

```bash
npm install
npm run dev
```

## Privacy boundary

All real book pages, child or family information, recordings, generated audio, raw transcripts, user-session records, and page-specific interaction content are intentionally excluded.

## Research

The `research/` folder contains the evidence base that informed the product direction: shared reading and language development, caregiver barriers, adaptive interaction design, familiar voices, avatar feasibility, product landscape, and source references.

Raw transcripts, book-specific page maps, and user-session records are excluded from this public version.
