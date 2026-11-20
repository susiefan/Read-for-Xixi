# Publication scope and credits

## Published under MIT

Read for Xixi source code, original SVG Mimi and white-cat artwork, original Three.js companion geometry, authoring/evaluation rules, schemas, tests and documentation are copyright 2026 Susie Fan. See LICENSE. The SVG cats are custom animated artwork, not Live2D Cubism models.

## Existing local library: not distributed

The current local selection uses **波西和皮普：圣诞树** and **波西和皮普：最心爱的玩具**. Only selection metadata (IDs, titles and UI descriptions) is published. Existing book text, scanned pages, story-specific scenes, narrated audio and human feedback stay in ignored public/library/ and data/local/. Their import does not grant redistribution rights. No Book Dash or newly created book is bundled.

Cubism Core, Tororo/Hijiki sample models, private reference voices, child recordings, API credentials and model weights are not bundled.

## Optional speech generation

The versioned Mimi instruction profile is included as configuration, not a reference voice recording. The optional adapter uses CosyVoice3 inference_instruct2 and a user-installed model; it is not used to import or replay the existing library.

- [CosyVoice source, Apache 2.0](https://github.com/QwenAudio/CosyVoice).
- [Official model card](https://huggingface.co/FunAudioLLM/Fun-CosyVoice3-0.5B-2512).

Follow upstream installation and model terms for your own environment. Neither model weights nor the engine's packaged prompt WAV are redistributed.

## Dependencies

React / React DOM and Three.js: MIT. Vite and TypeScript: MIT. resvg-js: MPL 2.0. Pillow: HPND. pypdfium2 / PDFium: licenses documented upstream. jsonschema: MIT. Dependency packages are installed separately; retain their own license notices when redistributing builds.

Research notes inherited from the early public prototype are background material, not product validation or permission to republish books cited in those notes.
