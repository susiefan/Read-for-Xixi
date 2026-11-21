---
name: create-reading-avatar
description: Create a child-preference-based animal reading companion as an importable Read for Xixi avatar JSON file. Use for requests such as an elephant or dinosaur story partner, including revising its appearance. Produces a data-only animated-vector avatar, not a ChatGPT Pet, Cubism model, voice clone, or book script.
---

Use the existing white cat when that is the caregiver's choice: select `white-2d` in Settings and keep `app/WhiteCatArtwork.tsx`, `AnimatedWhiteCat.tsx` and `whiteCatRig.ts` unchanged. Do not regenerate an animal merely to select a built-in. Only when a different custom appearance is explicitly requested, create a complete `.avatar.json` file from those preferences.

Read [the avatar contract](references/avatar-format.md) before generating. The app supplies the animation; the file contains drawing data only. Use original vector shapes directly. A bitmap illustration or a description of an avatar is not the deliverable.

Use the animal/theme, favourite colours, desired temperament and optional accessories already provided. Ask only when the missing preference materially changes the result; otherwise choose calm, age-appropriate defaults. A child's name, face photo, voice recording or developmental assessment is unnecessary. Do not alter books, narration, existing companions or app code to install an avatar.

Design for a child attending to a physical book: a clear friendly silhouette, quiet flat fills, readable eyes, a small mouth and a comfortable resting pose. Keep the drawing transparent, within the 720-square stage, with eyes/head/body in separate named parts. Put ears behind the head; keep blinkable eyes separate from the face. The open mouth is a small lower opening, not a disappearing muzzle. The `front` part holds the book and paws: covers face the audience, pages angle toward the animal. Make the animal visibly support the book. The renderer adds gentle breathing, blinking and audio-driven mouth movement without cursor tracking.

Produce the JSON file directly. Check its structure against the contract; review the silhouette, relative mouth/face size, eye origins, book direction and paw contact. If working in a Read for Xixi checkout, run:

```bash
pnpm avatar:validate /path/to/companion.avatar.json --preview /path/to/preview.svg
```

Use the rendered SVG to inspect the character when rendering tools are available; do not require browser automation. Fix definite import/layout errors while preserving valid design choices. Stop after at most three correction attempts and report any remaining issue with the candidate file. Do not claim validation ran when it did not.

Deliver the file plus brief instructions: open Settings → Import companion, choose the JSON, then select its name. The app stores up to six custom companions in that browser; importing the same ID replaces that companion. Importing changes appearance, not the existing story or voice. Make clear whether file validation and visual inspection were performed. The caregiver controls the license of their newly created design; do not claim their file is publicly released just because the project itself is open source.
