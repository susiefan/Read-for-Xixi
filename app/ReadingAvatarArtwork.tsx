import React,{createElement,type Ref} from "react";
import type {ReadingAvatar,AvatarShape,Point} from "./readingAvatar";
function Shapes({nodes}:{nodes:AvatarShape[]}) { return <>{nodes.map((node,i)=>createElement(node.tag,{...node.attrs,key:i}))}</>; }
const around=(p:Point,scale=1)=>`translate(${p[0]} ${p[1]}) scale(1 ${scale}) translate(${-p[0]} ${-p[1]})`;
export function AvatarArtwork({avatar,svgRef}:{avatar:ReadingAvatar;svgRef?:Ref<SVGSVGElement>}) {
  const p=avatar.parts;
  return <svg xmlns="http://www.w3.org/2000/svg" ref={svgRef} className="custom-avatar-art" viewBox="0 0 720 720" role="img" aria-label={avatar.name}>
    <title>{`${avatar.name} — ${avatar.description}`}</title>
    <g data-part="tail"><Shapes nodes={p.tail}/></g>
    <g data-part="body"><Shapes nodes={p.body}/></g>
    <g data-part="head">
      <g data-part="left-ear"><Shapes nodes={p.leftEar}/></g><g data-part="right-ear"><Shapes nodes={p.rightEar}/></g>
      <Shapes nodes={p.head}/>
      {p.eyes.map((eye,i)=><g key={i} data-part={`eye-${i}`}><Shapes nodes={eye.shapes}/></g>)}
      <g data-part="mouth-closed"><Shapes nodes={p.mouth.closed}/></g>
      <g data-part="mouth-open" opacity="0" transform={around(p.mouth.origin,.15)}><Shapes nodes={p.mouth.open}/></g>
    </g>
    <g data-part="book-and-paws"><Shapes nodes={p.front}/></g>
  </svg>;
}
