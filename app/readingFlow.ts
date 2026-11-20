export type Phase = "story" | "invitation" | "waiting" | "response" | "ready";
export function afterAudio(phase: Phase): Phase {
  return phase === "story" ? "invitation" : phase === "invitation" ? "waiting" : "ready";
}
export function pageDestination(current: number, delta: number, count: number) {
  return Math.max(0, Math.min(count - 1, current + delta));
}
export function readStars(value: string | null) {
  const n = Number(value); return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}
