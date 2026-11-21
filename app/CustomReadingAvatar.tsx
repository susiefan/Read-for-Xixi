import {useEffect,useRef} from "react";
import type {ReadingAvatar,Point} from "./readingAvatar";
import type {ReadingScene} from "./types";
import {AvatarArtwork} from "./ReadingAvatarArtwork";
import ReadingSceneLayer from "./ReadingSceneLayer";
import "./customAvatar.css";
const around=(p:Point,scale=1)=>`translate(${p[0]} ${p[1]}) scale(1 ${scale}) translate(${-p[0]} ${-p[1]})`;
export default function CustomReadingAvatar({avatar,speaking,sampleAudio,scene}:{avatar:ReadingAvatar;speaking:boolean;sampleAudio:()=>number|null;scene?:ReadingScene}) {
  const svg=useRef<SVGSVGElement>(null),latest=useRef({speaking,sampleAudio});
  useEffect(()=>{latest.current={speaking,sampleAudio};},[speaking,sampleAudio]);
  useEffect(()=>{
    const root=svg.current;if(!root)return;
    const part=(name:string)=>root.querySelector<SVGGElement>(`[data-part="${name}"]`)!;
    const eyes=[part("eye-0"),part("eye-1")],head=part("head"),body=part("body"),mouth=part("mouth-open"),closed=part("mouth-closed");
    const ears=[part("left-ear"),part("right-ear")];const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    let frame=0,last=0;
    function tick(now:number){
      frame=requestAnimationFrame(tick);if(document.hidden||now-last<32)return;last=now;
      const t=now/1000,phase=t%5.3,blink=reduced.matches?1:phase<5.05?1:Math.max(.06,Math.abs(phase-5.175)/.125);
      eyes.forEach((eye,i)=>eye.setAttribute("transform",around(avatar.parts.eyes[i].origin,blink)));
      const breath=reduced.matches?0:Math.sin(t*1.5)*1.6;
      body.setAttribute("transform",`translate(0 ${breath})`);
      // A small whole-head breath; no neck bending, pointer listener or cursor tracking.
      head.setAttribute("transform",`translate(0 ${breath*.6})`);
      ears.forEach((ear,i)=>{const p=i?avatar.rig.rightEarPivot:avatar.rig.leftEarPivot;ear.setAttribute("transform",`rotate(${reduced.matches?0:Math.sin(t*.8)*(i?-1:1)*.7} ${p[0]} ${p[1]})`);});
      const audio=latest.current.speaking?latest.current.sampleAudio():0;
      const level=audio===null ? .3+.25*Math.max(0,Math.sin(t*13)) : Number.isFinite(audio) ? Math.max(0,Math.min(1,audio)) : 0;
      const opening=latest.current.speaking?Math.min(1,level*1.8):0;
      mouth.setAttribute("opacity",opening>.035?"1":"0");mouth.setAttribute("transform",around(avatar.parts.mouth.origin,.15+opening*.85));closed.setAttribute("opacity",opening>.035?"0":"1");
    }
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[avatar]);
  return <div className="custom-reading-avatar">
    {scene&&<ReadingSceneLayer scene={scene} depth="behind"/>}
    <AvatarArtwork avatar={avatar} svgRef={svg}/>
    {scene&&<ReadingSceneLayer scene={scene} depth="front" withAttached={false}/>}
  </div>;
}
