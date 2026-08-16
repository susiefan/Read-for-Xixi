# 3D Mimi asset review

Updated: 2026-08-15

## Required production asset

Mimi needs more than an attractive mesh. The production asset must include:

- a web-appropriate GLB/glTF export;
- clean PBR textures and mobile-friendly levels of detail;
- a full body rig with seated idle, breathing, ear twitch, tail, look, listen and happy reactions;
- facial controls or morph targets for blink, jaw, lips/muzzle and emotional reactions;
- commercial redistribution rights inside the Read-for-Xixi application;
- a clear original creator and license provenance.

## User-provided CGTrader reference

The [Cartoon Cat Rigged model](https://www.cgtrader.com/3d-models/animal/mammal/cartoon-cat-rigged-d04965e3-22be-409b-a504-b91b92d2b20e) is visually close to the desired quality. As of the review date it is listed at $138 under a royalty-free license, with PBR textures, 19,786 polygons, FBX/Blend/Maya formats and a rig. The listing does not establish that it includes facial morph targets, phoneme shapes or finished animation clips. It is paid, not open source, and cannot be added to the repository unless it is purchased and its license permits this delivery method.

Before purchase, ask the seller to confirm:

1. whether the mouth, eyes, eyelids, ears and brows have controllable bones or blendshapes;
2. whether it contains idle and reaction animations or only a skeleton;
3. whether a GLB export retains the facial rig and PBR materials;
4. whether use in a consumer web application is covered while the source asset remains inaccessible to end users.

## Open-license candidates reviewed

The Sketchfab [3DAnimate CAT GLB](https://sketchfab.com/3d-models/3danimate-cat-glb-5462973cb51f42cfbd7b7e8d45d324aa) is downloadable under CC Attribution and visually more polished than the code-generated placeholder. It is very heavy for a toddler-facing web experience at roughly 678k triangles, and its facial controls and animation clips must be inspected after download. It is a candidate for visual testing, not yet an approved production asset.

The Sketchfab [Animated Cat by AnimalMesh](https://sketchfab.com/3d-models/animated-cat-3d-animal-model-c86d90e98e8e467e92c908206e1ee667) is labeled CC Attribution on the platform but its description says the free version is for personal use and commercial use requires purchase. Because those terms conflict, it should not be placed in the repository without written clarification.

The widely downloaded Sketchfab [An Animated Cat](https://sketchfab.com/3d-models/an-animated-cat-aec25699660043a29595f9572149d1e8) has unclear creator provenance in its own description. Do not use it despite the displayed CC Attribution label.

## Decision

No reviewed free asset yet satisfies all four requirements simultaneously: high visual fidelity, trustworthy redistribution rights, web performance, and facial controls suitable for lip sync. The current code-generated cat should be treated only as an interaction-controller placeholder.

Best next path:

1. test the CC-BY 3DAnimate asset locally after authenticated download and inspect its rig;
2. if facial controls are missing, purchase the CGTrader reference only after seller confirmation, or commission a web-optimized Mimi with explicit facial deliverables;
3. keep the animation controller independent of the mesh so the final asset can replace the placeholder without rewriting the reading flow.

