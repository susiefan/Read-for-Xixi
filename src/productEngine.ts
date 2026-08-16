export type SessionStage = "ready" | "narrating" | "listening" | "adapting";

export type SessionEvent =
  | { type: "START" }
  | { type: "NARRATION_COMPLETE" }
  | { type: "RESPONSE_DETECTED" }
  | { type: "ADAPTATION_COMPLETE" }
  | { type: "RESET" };

const transitions: Record<SessionStage, Partial<Record<SessionEvent["type"], SessionStage>>> = {
  ready: { START: "narrating" },
  narrating: { NARRATION_COMPLETE: "listening", RESET: "ready" },
  listening: { RESPONSE_DETECTED: "adapting", RESET: "ready" },
  adapting: { ADAPTATION_COMPLETE: "listening", RESET: "ready" },
};

export function transitionSession(stage: SessionStage, event: SessionEvent): SessionStage {
  return transitions[stage][event.type] ?? stage;
}

export const privateContentBoundary = {
  pageMedia: "runtime-only",
  narration: "private content service",
  voiceAssets: "private object storage",
  childProfile: "consent-gated local data",
} as const;
