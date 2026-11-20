"use client";

import { useEffect, useRef, useState } from "react";
import type { ReadingScene } from "./types";
import { publicAsset } from "./webRuntime";
import "./readingScene.css";

const palettes: Record<string, [string, string]> = {
  room: ["#fff2d5", "#caac82"],
  snow: ["#c9e8f0", "#f0f7f9"],
  baking: ["#fff0d7", "#caac82"],
  quiet: ["#f4e4d9", "#bea693"],
  party: ["#fff0c4", "#c8b0a5"],
  garden: ["#cce9ea", "#b5d595"],
  park: ["#c6e7ef", "#a9c575"],
  street: ["#fae7bc", "#c0b6a9"],
  rain: ["#b9cfd3", "#92a86e"],
  play: ["#faefbb", "#dfaa63"],
  bath: ["#d8edf0", "#b7c9c8"],
  bedroom: ["#f5dfa5", "#ab8aa4"],
  night: ["#446782", "#4e6266"],
};

/**
 * A reviewed book scene on the 720 × 720 stage. Every character draws the same scene SVGs;
 * `withAttached={false}` leaves out props positioned in the white cat's paws so a character
 * with a different body can place them itself (see GirlHeldProps) or skip them.
 */
export default function ReadingSceneLayer({ scene, depth, withAttached = true }: {
  scene: ReadingScene;
  depth: "behind" | "front";
  withAttached?: boolean;
}) {
  const [frames, setFrames] = useState(() => [{ id: 0, scene }]);
  const displayedScene = useRef(scene);
  const nextId = useRef(0);

  useEffect(() => {
    if (depth !== "behind" || scene === displayedScene.current) return;
    let cancelled = false;
    const urls = new Set(scene.layers
      .filter(layer => layer.depth === depth && (withAttached || !layer.attached))
      .map(layer => layer.url));
    void Promise.all([...urls].map(url => {
      const image = new Image();
      image.src = publicAsset(url);
      return image.decode().catch(() => undefined);
    })).then(() => {
      if (cancelled) return;
      displayedScene.current = scene;
      const id = ++nextId.current;
      // Keep in-progress fades underneath when pages change again quickly.
      setFrames(current => [...current, { id, scene }]);
    });
    return () => { cancelled = true; };
  }, [scene, depth, withAttached]);

  const visibleFrames = depth === "front" ? [{ id: 0, scene }] : frames;
  return <>{visibleFrames.map(frame => {
    const [wall, floor] = palettes[frame.scene.theme] ?? palettes.room;
    return (
      <svg key={frame.id} className={`reading-scene-layer reading-scene-${depth}${frame.id ? " is-entering" : ""}`} viewBox="0 0 720 720"
        preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={depth === "behind" ? { backgroundColor: wall } : undefined}
        onAnimationEnd={event => {
          if (event.target !== event.currentTarget || event.animationName !== "reading-scene-fade-in") return;
          setFrames(current => {
            const index = current.findIndex(item => item.id === frame.id);
            return index > 0 ? current.slice(index) : current;
          });
        }}>
        {/* The floor runs past the 720 square so tall or wide stages never show wall below it. */}
        {depth === "behind" && <rect x="-2000" y="475" width="4720" height="3000" fill={floor} />}
        {frame.scene.layers.filter(layer => layer.depth === depth && (withAttached || !layer.attached)).map((layer, index) => (
          <g key={index} className={layer.attached ? "reading-scene-attached" : undefined}>
            <g data-motion={layer.motion}>
              <image href={publicAsset(layer.url)} x={layer.x} y={layer.y} width={layer.width} height={layer.height} />
            </g>
          </g>
        ))}
      </svg>
    );
  })}</>;
}
