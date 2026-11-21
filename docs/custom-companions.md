# Create a reading companion your child likes

Try the app: [storyforxixi.susiefan.com](https://storyforxixi.susiefan.com/).

## Start with an existing companion

Open Settings (☰), then choose the reading companion:

| Companion | Appearance and behaviour | Best starting point |
|---|---|---|
| Mimi · 3D | My original warm cream-coloured cat, rounded toy-like geometry, a held book, blinking, breathing and speaking motion. | The default companion; use the glasses selector for none, black frames or blue goggles. |
| White cat · Animated 2D | My original soft white cat, pink ears, gentle green eyes and lavender book. Separate eyes, pupils, ears and small speaking mouth form its vector rig. | A quieter illustrated option; selected via White cat / 白猫 · 动画 2D. |
| Mimi · 2D | My original grey/taupe illustrated cat with a smiling muzzle, reading book and reusable story props. | The classic vector look; select Mimi · 2D / 原版 2D. |
| Your imported animal | A data-only vector design made from your child's preferences; the app adds blink, breathing, subtle ear motion and speaking mouth. | Reuse the white cat, or explicitly request a different animal. |

I created the bundled Mimi, white-cat and 3D artwork myself and am releasing the artwork, rigs and code as open source under MIT. MIT is the permission I give others to use, modify and share these original works; it does not identify them as someone else's assets. The SVG companions use my own 2D animation, not the proprietary Cubism runtime. The existing hosted family app may also list older experimental/third-party companions; those are separate from the three original companions in the open-source package.

## Use the existing white cat

Choose Settings → **White cat · Animated 2D / 白猫 · 动画 2D**. The artwork and rig are already included: [WhiteCatArtwork.tsx](../app/WhiteCatArtwork.tsx), [AnimatedWhiteCat.tsx](../app/AnimatedWhiteCat.tsx), [whiteCatRig.ts](../app/whiteCatRig.ts). Use [the reuse prompt](../prompts/reading-avatar.md) to ask an assistant to select/reuse this exact character, with no redesign or new illustration.

For the separate Live2D Cubism sample, see [Tororo & Hijiki](https://www.live2d.com/en/learn/sample/tororo-hijiki/). Tororo is the white cat. This is Live2D's free sample data under its [sample terms](https://www.live2d.com/en/learn/sample/model-terms/), not my MIT/open-source artwork. The hosted app has a separate legacy Tororo option; the open-source default white cat is my own SVG rig.

## Make your own

Copy [the complete avatar prompt](../prompts/reading-avatar.md) into a coding assistant and replace the animal, colours and accessories. For example:

> My child likes elephants and mint green. Make a calm elephant reading companion, with a little lavender book facing the elephant. Return an importable `.avatar.json` using the Read for Xixi contract.

For an agent that supports Codex skills, install the folder [skills/create-reading-avatar](../skills/create-reading-avatar) in its skill directory (for Codex, copy it to `~/.codex/skills/create-reading-avatar`). Keep the included `references/` and `agents/` files together, then invoke:

```text
Use $create-reading-avatar to create a friendly elephant reading companion.
My child likes mint green, soft rounded shapes and a little reading scarf.
Return the complete avatar JSON file ready to import into Read for Xixi.
```

The skill is also distributed as a downloadable ZIP in the release. Extract it and install the `create-reading-avatar` folder; import the generated **JSON**, not the skill ZIP, into the app. No paid image-generation tool is required by the format: an assistant can draw native vector shapes directly. Any assistant/API fees depend on the tool you choose.

## Validate and import

If you have the repository:

```bash
pnpm avatar:validate my-companion.avatar.json --preview preview.svg
```

Inspect `preview.svg`, especially the face, eye centres, book direction and paw support. Then open Settings → Import companion → select the JSON. New imports appear in the companion selector. Importing a matching ID updates that same companion. The app supports up to six custom companions; select one and click Remove companion to remove it.

The avatar is stored in that browser, not uploaded. Keep your original JSON so you can restore it or use it on another device. If browser storage is unavailable the app can use the import for the current session and tells you it could not save. Changing an avatar changes its appearance; it does not re-create book scripts or voices. Accessories in imported animals are drawn into their JSON; the built-in cats' glasses settings do not modify custom artwork.

## File contract

The canonical import rules are in the skill's [self-contained format reference](../skills/create-reading-avatar/references/avatar-format.md) and [JSON Schema](../schemas/reading-avatar.schema.json). Imported content contains vector geometry and metadata only. The renderer builds allowlisted SVG elements rather than injecting arbitrary markup; scripts, event handlers, URLs, images, nested SVG markup and external resources are rejected. Maximum file size is 120 KB, with 500 total shapes.

A caregiver owns/controls the license of their newly created file. It is not automatically public or MIT merely because it was made using an open-source tool. My bundled cat artwork is explicitly MIT.
