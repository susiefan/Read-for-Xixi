import type { InteractionObservation, LanguageCode } from "../domain/reading";

export interface EphemeralSpeechInput {
  audioRef: string;
  allowedLanguages: LanguageCode[];
  deleteAfterProcessing: true;
}

export interface ToddlerSpeechModel {
  interpret(input: EphemeralSpeechInput): Promise<InteractionObservation>;
}

/** MVP path: the caregiver confirms participation without recording the child. */
export function parentConfirmedResponse(language: LanguageCode = "mixed"): InteractionObservation {
  return {
    responseForm: "gesture",
    language,
    engagement: "continue",
    reciprocalTurns: 1,
    confidence: 1,
    source: "parent-confirmed",
  };
}

/** Future path: refuse to make a strong inference from a low-confidence result. */
export function normalizeModelObservation(observation: InteractionObservation): InteractionObservation {
  if (observation.confidence >= 0.65) return observation;

  return {
    responseForm: "quiet-attention",
    language: observation.language,
    engagement: observation.engagement,
    reciprocalTurns: observation.reciprocalTurns,
    confidence: observation.confidence,
    source: observation.source,
  };
}
