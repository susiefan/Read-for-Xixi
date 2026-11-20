import type { Mood } from "./types";

export type WhiteCatLook = { x: number; y: number; weight: number };
const unit = (value: number) => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;

export function whiteCatPointer(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): WhiteCatLook {
  // Match the centered square artwork inside its responsive SVG viewport.
  const size = Math.min(rect.width, rect.height);
  if (!(size > 0) || ![size, rect.left, rect.top, clientX, clientY].every(Number.isFinite)) return { x: 0, y: 0, weight: 0 };
  const faceX = rect.left + rect.width / 2;
  const faceY = rect.top + (rect.height - size) / 2 + size * 307 / 720;
  return { x: unit((clientX - faceX) / (size * 0.6)), y: unit((clientY - faceY) / (size * 0.6)), weight: 1 };
}

export function smoothWhiteCatLook(current: WhiteCatLook, target: WhiteCatLook | null, elapsedMs: number): WhiteCatLook {
  const blend = 1 - Math.exp(-Math.max(0, Math.min(100, elapsedMs || 0)) / 120);
  const next = target ?? { x: 0, y: 0, weight: 0 };
  return {
    x: current.x + (unit(next.x) - current.x) * blend,
    y: current.y + (unit(next.y) - current.y) * blend,
    weight: current.weight + (Math.max(0, unit(next.weight)) - current.weight) * blend,
  };
}

export function whiteCatPose(time: number, speaking: boolean, level: number | null, mood: Mood, reduced = false, look: WhiteCatLook = { x: 0, y: 0, weight: 0 }) {
  const t = Number.isFinite(time) ? Math.max(0, time) : 0;
  const phase = t % 4.7;
  const amplitude = level !== null && Number.isFinite(level)
    ? Math.max(0, Math.min(1, level) - 0.025)
    : 0.15 + 0.55 * Math.max(0, Math.sin(t * 14) * Math.sin(t * 6.3));
  const x = unit(look.x), y = unit(look.y), attention = Math.max(0, unit(look.weight));
  return {
    mouth: speaking ? Math.min(11, amplitude * 14) : 0,
    blink: reduced || phase <= 4.45 ? 1 : Math.max(0.06, Math.abs(phase - 4.575) / 0.125),
    head: reduced ? 0 : Math.sin(t * 0.65) * 1.1 + (mood === "curious" ? 3 : 0) * (1 - attention) + x * 3,
    headX: reduced ? 0 : x * 7,
    headY: reduced ? 0 : y * 4,
    ear: reduced ? 0 : Math.sin(t * 1.15) * 1.8,
    breath: reduced ? 0 : Math.sin(t * 1.6) * 1.4,
    tail: reduced ? 0 : Math.sin(t * 0.8) * 3,
    gazeX: x * 5,
    gaze: (mood === "listening" || mood === "happy" ? -1 : 3) * (1 - attention) + y * 5,
  };
}

export function whiteCatMouthPath(open: number) {
  const depth = Number.isFinite(open) ? Math.max(0, Math.min(11, open)) : 0;
  // Permanent upper smile stays in place; only this little lower bowl opens.
  return `M350 356 Q360 ${356 + depth * 2} 370 356Z`;
}
