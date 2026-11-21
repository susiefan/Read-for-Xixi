# Reuse the existing white reading cat

Use the existing Read for Xixi white cat. Do not redesign, redraw or replace it, and do not generate an elephant.

Source: https://github.com/susiefan/Read-for-Xixi/blob/main/app/WhiteCatArtwork.tsx
Animation: https://github.com/susiefan/Read-for-Xixi/blob/main/app/AnimatedWhiteCat.tsx
Rig: https://github.com/susiefan/Read-for-Xixi/blob/main/app/whiteCatRig.ts

Choose Settings → White cat · Animated 2D (白猫 · 动画 2D). Keep its exact face, permanent upper smile, small lower speaking mouth, naturally blinking eyes, breathing and inward-facing book. Use the current scene and existing voice. Do not generate new artwork or voice merely to select this companion.

If I explicitly ask for a different animal or appearance, use $create-reading-avatar and the data-only contract below to create a new importable JSON. Ask what animal/colours I want only when that information is missing. The default is the existing white cat.

The separate official Live2D Cubism sample cat is Tororo (white) / Hijiki (black): https://www.live2d.com/en/learn/sample/tororo-hijiki/ . It is free sample data under Live2D's own terms, not the project’s MIT artwork or an MIT/open-source model: https://www.live2d.com/en/learn/sample/model-terms/ . The public repository's white cat is the project’s original SVG rig and needs no Cubism download.

---

## Optional custom animal prompt and file contract

Create an original animated reading companion for Read for Xixi from these preferences:

- Favourite animal/theme: [only if I explicitly requested a custom animal]
- Favourite colours: mint green and lavender
- Temperament: warm, calm and a little playful
- Optional accessory: a little reading scarf
- Display language: Chinese
- Age context: a toddler sharing a physical book with a caregiver

Return a complete downloadable `my-companion.avatar.json`, not a picture-only output or an explanation of code to write. If you can access this repository, use `skills/create-reading-avatar/SKILL.md` and its format reference. Otherwise follow the full contract below.

Make a friendly, transparent, flat-colour 2D vector character in a 720×720 stage. It should be a quiet companion beside the physical book. Keep its eyes warm, mouth small and cute, feet/paws supported and book visibly held. The audience sees the book covers; the pages angle toward the animal, as if it is reading. Keep the animal and book comfortably inside the frame. Do not add background scenery, text on pages or distracting continuous effects.

The app animates the supplied parts: blinking, breathing, subtle ears and audio-driven mouth. Do not write JS, SVG strings, HTML, image URLs, transforms, groups, shaders or animation instructions. No child photo/name/recording is needed. Changing this avatar does not change the story or voice.

Use exactly this JSON structure, replacing every shape list with the actual drawing (tail/ears may remain empty for an animal without them):

```json
{
  "format":"read-for-xixi-avatar", "version":1,
  "id":"my-reading-companion", "name":"阅读伙伴",
  "description":"一位温和的阅读伙伴，抱着一本朝向自己的书。",
  "creator":"Parent-created companion", "license":"All rights reserved",
  "palette":["#4d5660","#b2cfd2","#ffffff","#a38abb"],
  "rig":{"headPivot":[360,385],"leftEarPivot":[255,300],"rightEarPivot":[465,300]},
  "parts":{
    "tail":[], "body":[], "head":[], "leftEar":[], "rightEar":[],
    "eyes":[{"origin":[305,305],"shapes":[]},{"origin":[415,305],"shapes":[]}],
    "mouth":{"origin":[360,375],"closed":[],"open":[]},
    "front":[]
  }
}
```

Each shape is an object with only `tag` and `attrs`. Example: `{"tag":"ellipse","attrs":{"cx":360,"cy":300,"rx":100,"ry":90,"fill":"#b2cfd2"}}`.

Allowed tags/geometry: `path` with d; `ellipse` with cx,cy,rx,ry; `circle` with cx,cy,r; `rect` with x,y,width,height (optional rx,ry); `line` with x1,y1,x2,y2; `polygon` or `polyline` with points. Every tag may also use fill,stroke,strokeWidth,strokeLinecap,strokeLinejoin,opacity,fillOpacity,strokeOpacity. These camelCase names are required. No other fields or attributes.

Coordinates are absolute stage coordinates. Most of the visible character should fit x=150–570 and y=150–660. Pivots and eye/mouth origins are [x,y] between 0 and 720. Eye origins match visible eye centres. Mouth origin is the opening's upper anchor. Body, head, eyes, both mouth states and front/book/paws must be nonempty. Keep eyes and changing mouth out of the head's face drawing, so they can animate independently. Ears draw behind the head; front/book/paws draw last. A permanent upper muzzle/smile can remain on the head.

Use 2–16 six-digit hex colours; every fill/stroke is `none` or an exact palette member. Finite geometry numbers range -1440–2160, dimensions/radii nonnegative, strokeWidth 0–40, opacities 0–1. Path commands are M/m,L/l,H/h,V/v,C/c,S/s,Q/q,T/t,A/a,Z/z; paths/points strings contain only those commands (for paths), numeric coordinates, commas/spaces/signs, maximum 12000 characters. No gradients, filters, raster images, external assets, links or executable content. Maximum 120 shapes per list, 500 total, file <=120000 UTF-8 bytes. ID uses lowercase ASCII letters/digits/hyphens and starts with a letter (<=48 chars). Name <=48, description <=240, creator/license <=80; no empty metadata or control characters. Prefer strokeLinecap/strokeLinejoin round; other supported values are butt/square and miter/bevel respectively.

Use the caregiver's chosen license. If none is specified, keep `All rights reserved` for their local design; do not claim it is published under the project's MIT license. Use original art based on the requested preferences.

If a repository checkout is available, run `pnpm avatar:validate FILE --preview preview.svg`, inspect the result and fix definite errors (maximum three attempts). Otherwise check the contract and clearly say app validation was not run. Deliver the JSON and tell the parent: Settings → Import companion → choose the file → select its name. Keep a copy of the JSON; browser-data deletion removes saved imports.
