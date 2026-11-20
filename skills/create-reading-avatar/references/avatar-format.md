# Reading avatar v1 contract

An avatar is a UTF-8 JSON file, at most **120,000 bytes**, with these exact top-level fields. No extra fields, HTML, SVG string, raster, URLs, executable code, external fonts or animation code.

```json
{
  "format": "read-for-xixi-avatar",
  "version": 1,
  "id": "my-reading-elephant",
  "name": "Ellie",
  "description": "A calm mint-coloured elephant holding a reading book.",
  "creator": "Parent-created companion",
  "license": "All rights reserved",
  "palette": ["#4d5660", "#b2cfd2", "#ffffff", "#a38abb"],
  "rig": {
    "headPivot": [360, 385],
    "leftEarPivot": [255, 300],
    "rightEarPivot": [465, 300]
  },
  "parts": {
    "tail": [],
    "body": [],
    "head": [],
    "leftEar": [],
    "rightEar": [],
    "eyes": [
      {"origin": [305, 305], "shapes": []},
      {"origin": [415, 305], "shapes": []}
    ],
    "mouth": {"origin": [360, 375], "closed": [], "open": []},
    "front": []
  }
}
```

This is the structural outline, **not an importable finished character**: body, head, each eye's shapes, closed/open mouth and front must contain drawn shapes. Tail/ears may be empty for animals without them. There must be exactly two eyes. Each list has at most 120 shapes; total at most 500. Use a modest number for a clear, editable result.

Every shape is `{"tag":"ellipse","attrs":{"cx":360,"cy":300,"rx":100,"ry":90,"fill":"#b2cfd2"}}`.

| tag | Required geometry | Optional geometry |
|---|---|---|
| path | d: SVG path string | — |
| ellipse | cx, cy, rx, ry | — |
| circle | cx, cy, r | — |
| rect | x, y, width, height | rx, ry |
| line | x1, y1, x2, y2 | — |
| polygon / polyline | points: coordinate string | — |

All tags allow `fill`, `stroke`, `strokeWidth`, `strokeLinecap`, `strokeLinejoin`, `opacity`, `fillOpacity`, `strokeOpacity`. **Use these camelCase attribute names.** No other attributes, nested children, groups, transforms, IDs, CSS, hrefs, images, scripts, filters, gradients or event handlers.

- Every geometry coordinate is absolute stage space, never relative to the eye or mouth origin. The host supplies group transforms around those origins.
- Stage is `0 0 720 720`, centre x=360. Keep the visible drawing comfortably inside; roughly x=150–570, y=150–660 works for most animals. Leave top/side space for book scenery. There is no opaque backplate.
- Coordinates must be finite and between -1440 and 2160. Path/points numeric magnitudes must be <=2160 and strings <=12000 characters. Prefer ordinary decimals rather than exponents. Path commands: M/m,L/l,H/h,V/v,C/c,S/s,Q/q,T/t,A/a,Z/z.
- Dimensions/radii are nonnegative; stroke width 0–40; opacity values 0–1. `strokeLinecap`: round, square or butt; `strokeLinejoin`: round, miter or bevel.
- Palette contains 2–16 six-digit hex colours. Every fill/stroke is `none` or an exact palette member, including white/ink colours. Flat fills keep the style quiet and legible.
- ID: lowercase ASCII letter followed by lowercase letters, digits or hyphens, maximum 48 characters. Name <=48, description <=240, creator/license <=80; strings nonempty, no control characters.
- Pivot/origin values are [x,y] numbers between 0 and 720. Eye origins are each eye's visible centre. Mouth origin is its upper anchor: opening scales downward from it. Head pivot is retained for contract compatibility; v1 animation keeps the neck still and adds a tiny whole-head breathing translation.

## Layer order

Tail → body → head group (left ear, right ear, face, two eye groups, mouth) → front/book/paws. Do not paint eyes or the changing mouth again in the head. A permanent muzzle/upper smile can remain in the head. The front is stationary so the book remains supported during gentle breathing.

## Import, ownership and animation

The app creates SVG elements from an allowlist; it never injects arbitrary SVG/HTML. It adds blinking, breathing, subtle ear movement and speaking mouth movement from **playback audio**, with no microphone or mouse following. Custom accessories are drawn into the file; built-in glasses controls do not add them to imported animals.

Imported JSON remains in browser storage, not a server. Up to six custom companions are saved; the same ID replaces its own earlier design. Export/keep the source JSON because clearing browser data removes saved imports. The built-in story, voice and reading flow stay the same.

The project’s bundled original cat art are original Read for Xixi works released under MIT. A caregiver's generated design is not automatically MIT: preserve their specified license, otherwise use `All rights reserved` for local use. Do not use a real child's identity in metadata by default.
