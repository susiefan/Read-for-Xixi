import type {
  DialogueStrategy,
  InteractionObservation,
  InteractionProfile,
} from "../domain/reading";

export interface AdaptationDecision {
  strategy: DialogueStrategy;
  shouldContinue: boolean;
  maxWords: number;
  reason: string;
}

/**
 * Deterministic guardrail around generative dialogue. It chooses the teaching
 * move; the language model only realizes that move as a grounded sentence.
 */
export function chooseAdaptation(
  profile: InteractionProfile,
  observation: InteractionObservation,
  expansionIndex: 0 | 1 | 2,
): AdaptationDecision {
  if (observation.engagement === "all-done" || observation.engagement === "turning-away") {
    return { strategy: "return-to-story", shouldContinue: false, maxWords: 14, reason: "Child is done or disengaging." };
  }

  if (expansionIndex >= 2) {
    return { strategy: "return-to-story", shouldContinue: false, maxWords: 18, reason: "Expansion cap reached." };
  }

  if (observation.confidence < 0.65 || observation.responseForm === "quiet-attention") {
    return { strategy: "no-demand-comment", shouldContinue: true, maxWords: 18, reason: "Do not infer low ability from uncertainty or silence." };
  }

  if (["point", "gesture", "pretend-action"].includes(observation.responseForm)) {
    return { strategy: "acknowledge-gesture", shouldContinue: true, maxWords: 24, reason: "Treat nonverbal participation as meaningful." };
  }

  if (["word", "phrase"].includes(observation.responseForm)) {
    return { strategy: "expand-language", shouldContinue: true, maxWords: 28, reason: "Add one useful idea above the demonstrated response." };
  }

  if (observation.responseForm === "child-initiation") {
    return { strategy: "follow-child", shouldContinue: true, maxWords: 32, reason: "Follow the child's topic briefly before bridging back." };
  }

  const canDeepen = profile.demonstratedReasoning.length > 0 || observation.responseForm === "sentence";
  return canDeepen
    ? { strategy: "deepen-reasoning", shouldContinue: true, maxWords: 34, reason: "Move to cause, emotion, sequence, perspective or prediction." }
    : { strategy: "expand-language", shouldContinue: true, maxWords: 28, reason: "Increase language complexity one step." };
}
