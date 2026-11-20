"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Mimi3DState, SceneKind } from "./mimi3dScene";
import ReadingSceneLayer from "./ReadingSceneLayer";
import { useInterfaceLanguage } from "./interfaceLanguage";
import type { ReadingScene } from "./types";

type Props = Omit<Mimi3DState, "audioLevel" | "backdrop"> & {
  sampleAudio: () => number | null;
  /** Reviewed book scene: replaces the 3D room; paw-held props are left out. */
  readingScene?: ReadingScene;
  page?: number;
};
export const sceneKinds: SceneKind[] = ["reading-nook", "kitchen", "beach", "farm", "garden", "winter", "autumn-garden"];

export function resolve3DScene(setting: string, tags: string[] = []): SceneKind {
  for (const tag of tags) {
    const key = tag.replace(/^scene:/, "");
    if (sceneKinds.includes(key as SceneKind)) return key as SceneKind;
    if (/snow|winter|雪/.test(tag)) return "winter";
    if (/garden|snail|花园|蜗牛/.test(tag)) return "garden";
  }
  return setting === "beach" || setting === "farm" ? setting : "reading-nook";
}

export default function Live3DMimi(props: Props) {
  const { t } = useInterfaceLanguage();
  const host = useRef<HTMLDivElement>(null), latest = useRef(props);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  // Commit the session lock before the next pointer event or animation frame.
  useLayoutEffect(() => { latest.current = props; }, [props]);
  useEffect(() => {
    let cancelled = false, dispose: (() => void) | undefined;
    void import("./mimi3dScene").then(({ mountMimi3D }) => {
      if (cancelled || !host.current) return;
      dispose = mountMimi3D(host.current, () => ({
        ...latest.current,
        backdrop: latest.current.readingScene ? "none" : "room",
        audioLevel: latest.current.sampleAudio(),
      }), () => setStatus("error"));
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; dispose?.(); };
  }, [attempt]);
  return (
    <div className="mimi-3d" data-reading-mode={props.readingSession ? "reading" : "browse"} role="group" aria-label={t("Mimi，抱着书、会眨眼和说话的立体小猫")}>
      {props.readingScene && <ReadingSceneLayer scene={props.readingScene} depth="behind" />}
      <div className="mimi-3d-canvas" ref={host} />
      {props.readingScene && <ReadingSceneLayer scene={props.readingScene} depth="front" withAttached={false} />}
      {status === "loading" && <span className="mimi-scene-status" role="status">{t("Mimi 马上就来…")}</span>}
      {status === "error" && <div className="mimi-scene-status" role="status"><p>{t("暂时无法显示 Mimi，仍然可以听故事。")}</p><button onClick={event => { event.stopPropagation(); setStatus("loading"); setAttempt(n => n + 1); }}>{t("重新显示 Mimi")}</button></div>}
    </div>
  );
}
