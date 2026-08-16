# Natural voice and parent voice cloning

## Product decision

The browser's built-in `speechSynthesis` voices are only a wiring placeholder. They are not acceptable as Read-for-Xixi's production narrator because delivery varies by device and offers little control over emotion, pacing, or conversational timing.

For the next voice-quality prototype, test these two tracks:

1. **Fastest quality benchmark: OpenAI generated speech.** Use a built-in high-quality voice and instructions for an observant, witty, non-babyish Mandarin storyteller. Custom voices exist for eligible API customers and require both a consent recording and a separate audio sample.
2. **Open-source/self-hosted benchmark: Fun-CosyVoice 3.** It supports Chinese, English, multiple Chinese accents, zero-shot cross-lingual voice cloning, emotion/speed instructions, streaming, and is Apache-2.0 licensed. It is the strongest first open-source candidate for this Chinese-first MVP.

Fish Speech should not be treated as freely open source for a commercial MVP: its current model license requires a separate commercial license.

## How much parent audio?

There are three different thresholds:

- **Technical minimum:** modern zero-shot systems can demonstrate similarity from roughly 3–15 seconds.
- **Usable product minimum:** collect at least 20–30 seconds of clean, single-speaker audio.
- **Recommended Read-for-Xixi capture:** 45–60 seconds. This gives the model more phonetic variety and lets quality checks reject noise, clipping, whispering, or an unnatural reading voice. Longer is not automatically better if the recording contains background speech, music, or changing microphone distance.

This is voice cloning/in-context voice conditioning, not traditional model training. The parent should record in a quiet room, at normal volume, in the language and emotional style the product will primarily generate. Read-for-Xixi should store the raw sample privately, require explicit consent, allow deletion, and never let one account clone another person's voice.

## MVP capture flow

1. Explain what will be generated and that only the account owner's voice may be used.
2. Record a required consent phrase separately.
3. Record a 45–60 second natural Mandarin passage with questions, statements, names, and expressive variation.
4. Run automatic checks for duration, clipping, signal-to-noise ratio, multiple speakers, and transcript match.
5. Generate three preview lines: warm narration, surprised reaction, and quiet listening prompt.
6. Parent approves or records again.
7. Encrypt the reference and provide a visible “Delete my voice” control.

## Local voice implementation notes (2026-08-15)

Read-for-Xixi evaluates reference voices with privacy-safe synthetic benchmark lines covering narration, surprise, comedic timing, pacing, and an open question. The private benchmark content is excluded from this public repository.

- **CosyVoice 3:** generated a 9.96-second, 24 kHz WAV locally. CPU inference took 18 minutes 51 seconds (about 113× real time). The evaluation uses the 0.5B official checkpoint with duplicate RL/batch/ONNX artifacts excluded from the download. The instruction explicitly requests a lively, funny young female storyteller and rejects a weak or affected baby voice.
- Model weights, isolated environments, and generated previews remain in the private workspace and are intentionally excluded from this public repository.

The selected voice is now fixed for the MVP. Every page and adaptive follow-up is pre-generated with the same model, reference clip, and delivery instruction; the browser's built-in `speechSynthesis` is not used for story playback.

## Recommendation after implementation

Use **CosyVoice 3 as the product default**. It generates each utterance as one expressive narrative performance and accepts explicit delivery instructions. It needs GPU-backed hosted inference or pre-generation for the product; real-time CPU generation is not viable on the tested Intel Mac.

The founder completed the perceptual check and selected this exact voice. Future book audio should preserve the current reference clip, instruction, model version, and generation settings.

## Sources

- OpenAI Audio API reference: https://platform.openai.com/docs/api-reference/audio/updateVoiceConsent
- FunAudioLLM CosyVoice: https://github.com/FunAudioLLM/CosyVoice
- Fish Speech current license: https://github.com/fishaudio/fish-speech/blob/main/LICENSE
