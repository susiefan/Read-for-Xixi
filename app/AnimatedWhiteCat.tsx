"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import Live2DMimi from "./Live2DMimi";
import WhiteCatArtwork from "./WhiteCatArtwork";
import ReadingSceneLayer from "./ReadingSceneLayer";
import type { ReadingScene } from "./types";
import { useInterfaceLanguage } from "./interfaceLanguage";
import { smoothWhiteCatLook, whiteCatMouthPath, whiteCatPointer, whiteCatPose, type WhiteCatLook } from "./whiteCatRig";
import "./whiteCat.css";

type Props = ComponentProps<typeof Live2DMimi> & { sampleAudio: () => number | null; scene?: ReadingScene; reading?: boolean };

export default function AnimatedWhiteCat(props: Props) {
  const { t } = useInterfaceLanguage();
  const svg = useRef<SVGSVGElement>(null);
  const latest = useRef(props);
  useEffect(() => { latest.current = props; }, [props]);
  useEffect(() => {
    const root = svg.current;
    if (!root) return;
    const part = (name: string) => root.querySelector<SVGElement>(`[data-rig="${name}"]`)!;
    const head = part("head"), body = part("body"), tail = part("tail"), mouth = part("mouth");
    const ears = [part("left-ear"), part("right-ear")], eyes = [part("eye-0"), part("eye-1")];
    const pupils = root.querySelectorAll<SVGElement>('[data-rig="pupil"]');
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, previous = 0, visible = true;
    let target: WhiteCatLook | null = null;
    let look: WhiteCatLook = { x: 0, y: 0, weight: 0 };
    const resetLook = () => { target = null; };
    const followPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") { resetLook(); return; }
      target = whiteCatPointer(event.clientX, event.clientY, root.getBoundingClientRect());
    };
    // Listen across the page, not just the cat, without intercepting clicks/scrolling.
    window.addEventListener("pointermove", followPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", resetLook);
    window.addEventListener("blur", resetLook);
    window.addEventListener("resize", resetLook);
    window.addEventListener("scroll", resetLook, true);
    document.addEventListener("visibilitychange", resetLook);
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (document.hidden || !visible || now - previous < 32) return;
      look = smoothWhiteCatLook(look, latest.current.reading ? null : target, now - previous);
      previous = now;
      const p = latest.current;
      const pose = whiteCatPose(now / 1000, p.speaking, p.speaking ? p.sampleAudio() : 0, p.mood, reduced.matches, look);
      head.setAttribute("transform", `translate(${pose.headX} ${pose.breath + pose.headY}) rotate(${pose.head} 360 409)`);
      body.setAttribute("transform", `translate(0 ${pose.breath * 0.4})`);
      tail.setAttribute("transform", `rotate(${pose.tail} 472 578)`);
      ears[0].setAttribute("transform", `rotate(${pose.ear} 261 240)`);
      ears[1].setAttribute("transform", `rotate(${-pose.ear} 459 240)`);
      eyes.forEach(eye => eye.setAttribute("transform", `scale(1 ${pose.blink})`));
      pupils.forEach(pupil => pupil.setAttribute("transform", `translate(${pose.gazeX} ${pose.gaze})`));
      mouth.setAttribute("d", whiteCatMouthPath(pose.mouth));
    }
    const observer = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; }) : null;
    observer?.observe(root);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); observer?.disconnect();
      window.removeEventListener("pointermove", followPointer);
      document.documentElement.removeEventListener("pointerleave", resetLook);
      window.removeEventListener("blur", resetLook);
      window.removeEventListener("resize", resetLook);
      window.removeEventListener("scroll", resetLook, true);
      document.removeEventListener("visibilitychange", resetLook);
    };
  }, []);
  return <div className="mimi-white-2d">
    {props.scene ? <ReadingSceneLayer scene={props.scene} depth="behind" /> : <Live2DMimi {...props} sceneryOnly />}
    <WhiteCatArtwork svgRef={svg} glasses={props.glasses} reviewedScene={Boolean(props.scene)} label={t("Mimi，会眨眼和说话的动画白猫，书页朝向自己")} />
    {props.scene && <ReadingSceneLayer scene={props.scene} depth="front" />}
  </div>;
}
