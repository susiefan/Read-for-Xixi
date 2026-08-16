# Signing avatar: feasibility, safety, and MVP architecture

## Why signing is technically difficult

A sign is not just a hand trajectory. Intelligibility can depend on:

- exact handshape and finger articulation;
- palm orientation;
- location relative to body and face;
- movement path, speed, repetition, and hold;
- coordination of both hands;
- torso and head movement;
- gaze, mouth, brows, and other nonmanual markers;
- coarticulation between consecutive signs;
- regional and individual variation.

Recent reviews of signing avatars repeatedly identify movement fidelity, torso coordination, nonmanual signals, dataset limitations, and user evaluation as unresolved constraints. Small synthesis errors can change meaning or make signing hard to understand.

## Ethical requirement

A Deaf-led review of 101 sign-language AI papers found recurring problems: limited Deaf stakeholder involvement, weak linguistic grounding, unrepresentative datasets, and research agendas chosen for hearing researchers' convenience. Read-for-Xixi must not frame Deaf experts as an expensive component to automate away.

The appropriate framing is:

> Expert signers author and validate a reusable curriculum; the software makes their work affordable and adaptive at scale.

Budget expert participation as core product work, compensate it, and give contributors decision authority and attribution where desired.

## Recommended V1 implementation

### Use a two-layer character system

- **Mimi:** expressive cat personality, Chinese narration, turn-taking, story reactions.
- **Signer layer:** a clearly visible human signer or anatomically accurate human avatar in a dedicated signing window.

A cat paw cannot faithfully represent handshape. Do not let aesthetic consistency outrank linguistic clarity.

### Prefer expert-recorded clips over generative signing

For the first MVP:

- record 20–30 target signs and a small number of expert-approved combinations;
- use a fluent Deaf ASL educator;
- preserve face, upper torso, arms, and hands in frame;
- allow slow replay without frame interpolation that distorts handshape;
- pair each clip with versioned metadata;
- restrict the story generator to approved assets;
- fall back to spoken Chinese only when no validated sign sequence exists.

This is less magical than open-ended text-to-sign generation but much safer and easier to evaluate.

### Do not score toddler signs with computer vision in V1

Toddler motor approximations, occlusion, framing, lighting, and dialect variation make automated correctness judgments unreliable. Use caregiver observation:

- recognized;
- attempted;
- copied;
- used independently;
- combined spontaneously;
- too easy / too hard;
- unsure.

Do not label a child's movement “wrong” based on an unvalidated classifier.

## Evaluation gates before release

1. **Linguistic gate:** each asset approved by target-community expert(s).
2. **Comprehension gate:** fluent signers identify the target meaning without captions.
3. **Visual gate:** hands never leave frame or become occluded at critical moments.
4. **Toddler gate:** families can follow the interaction without lengthy instructions.
5. **Interaction gate:** the avatar creates child/caregiver turns rather than passive viewing.
6. **Safety gate:** no open child chat, ads, external links, manipulative rewards, or unreviewed generated content.
7. **Privacy gate:** no camera or microphone storage by default; explicit parent consent for any recording.

## Sources

- [2024 survey of sign-language production](https://www.sciencedirect.com/science/article/abs/pii/S0957417423033481)
- [2025 rapid review of avatar perception and monitoring](https://www.mdpi.com/2414-4088/9/8/82)
- [40-year systematic review of sign-language avatars](https://www.mdpi.com/2414-4088/7/10/97)
- [Deaf-led review of systemic biases in sign-language AI](https://aclanthology.org/2024.signlang-1.6.pdf)
- [Co-creation lessons from sign-language technology projects](https://arxiv.org/abs/2408.13171)
