# Adaptive child-response system

## Product position

Read-for-Xixi should not infer a single “cognitive age,” IQ, or clinical language level from a book session. A child may be quiet because of fatigue, temperament, unfamiliar people, divided attention, bilingual language choice, or lack of interest. The product should maintain a changing **interaction profile** and estimate only how much support the child needs on the next turn.

This follows a dynamic-assessment mindset: observe what a child can do with different amounts of support, then adjust. For multilingual children, comprehension and expression should be tracked separately in each language. Mixing languages is not an error.

## Interaction profile

Track independent dimensions rather than one score:

- response form: gaze, pointing, gesture, action, word, phrase, sentence, self-initiated question;
- expressive language by language: vocabulary and sentence complexity in Mandarin and English separately;
- meaning and reasoning: noticing, labeling, action, sequence, cause, emotion, perspective, prediction;
- conversation: response latency, reciprocal turns, topic maintenance, child initiation;
- engagement: wants to continue, turns away, repeats, appears tired;
- support needed: independent response, open invitation, action model, language model, no-demand narration.

These are product observations, not diagnoses.

## Per-turn controller

Each physical-book page should have four pre-generated CosyVoice branches:

1. no-demand narration;
2. response to pointing or action;
3. expansion of a short verbal response;
4. contingent follow-up for a full sentence, causal idea, emotion, or child-initiated topic.

Runtime behavior:

- no verbal response but still engaged: wait, then make a relevant comment; do not repeat the question;
- point or gesture: name the focus and add one small piece of language;
- one word or short phrase: repeat meaning and expand slightly;
- full sentence: skip basic labeling and move to cause, emotion, perspective, prediction, or personal connection;
- child initiates: follow the child for two or three turns before returning to the book;
- off-topic but engaged: follow briefly, then bridge back;
- frustration, turning away, or “all done”: shorten or move on;
- low speech-recognition confidence: do not pretend to understand and do not change the profile sharply.

Raise challenge only after two or three stable signals. Reduce support demands quickly after one clear overload signal. Long-term profile changes should be slow and parent-editable.

## MVP implementation

- Keep exactly three reading controls: replay, `宝宝回应了`, and next physical page.
- The first response click plays a short page-specific expansion; a second click moves to a more complex idea such as cause, narrative, number, color, factual knowledge, emotion, or perspective.
- Stop after two expansion turns so Mimi does not take over the conversation.
- Do not transcribe the child or display system labels about response level. The parent decides whether the child responded and whether the conversation should continue.
- Use cached tracks in the locked Mimi voice; do not wait for local CPU voice generation during reading.
- Later, with explicit consent, speech understanding may select among richer branches, but it should not grade pronunciation or claim a clinical language score.

## North-star metric

Meaningful child-initiated or child-extended conversational turns per shared-reading session. Supporting metrics include reciprocal-turn depth, interruption rate, parent overrides, gesture/action acknowledgment, and whether the system stops using labeling prompts after the child demonstrates sentence-level language.

## Sources

- ASHA, multilingual service delivery and dynamic assessment: https://www.asha.org/practice-portal/professional-issues/multilingual-service-delivery/
- ASHA, early intervention and dynamic assessment: https://www.asha.org/practice-portal/professional-issues/early-intervention/
- Harvard Center on the Developing Child, serve and return: https://developingchild.harvard.edu/key-concept/serve-and-return/
- Parent coaching, conversational turns, and language development: https://pmc.ncbi.nlm.nih.gov/articles/PMC7035517/
- Parent-focused dialogic reading intervention: https://pmc.ncbi.nlm.nih.gov/articles/PMC9406408/
