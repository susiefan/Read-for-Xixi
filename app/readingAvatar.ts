/** Portable, data-only vector avatars. Imported JSON never becomes executable SVG/HTML. */
export const AVATAR_FORMAT = "read-for-xixi-avatar";
export const AVATAR_STORAGE_KEY = "read-for-xixi-custom-avatars-v1";
export const MAX_AVATAR_BYTES = 120_000;
export const MAX_CUSTOM_AVATARS = 6;
export const SHAPE_TAGS = ["path", "ellipse", "circle", "rect", "line", "polygon", "polyline"] as const;
export type ShapeTag = typeof SHAPE_TAGS[number];
export type AvatarShape = { tag: ShapeTag; attrs: Record<string, string | number> };
export type Point = [number, number];
export type ReadingAvatar = {
  format: typeof AVATAR_FORMAT; version: 1; id: string; name: string; description: string;
  creator: string; license: string; palette: string[];
  rig: { headPivot: Point; leftEarPivot: Point; rightEarPivot: Point };
  parts: {
    tail: AvatarShape[]; body: AvatarShape[]; head: AvatarShape[];
    leftEar: AvatarShape[]; rightEar: AvatarShape[];
    eyes: { origin: Point; shapes: AvatarShape[] }[];
    mouth: { origin: Point; closed: AvatarShape[]; open: AvatarShape[] };
    front: AvatarShape[];
  };
};
const common = ["fill", "stroke", "strokeWidth", "strokeLinecap", "strokeLinejoin", "opacity", "fillOpacity", "strokeOpacity"];
export const SHAPE_ATTRIBUTES: Record<ShapeTag, string[]> = {
  path: ["d", ...common], ellipse: ["cx", "cy", "rx", "ry", ...common],
  circle: ["cx", "cy", "r", ...common], rect: ["x", "y", "width", "height", "rx", "ry", ...common],
  line: ["x1", "y1", "x2", "y2", ...common], polygon: ["points", ...common], polyline: ["points", ...common],
};
const required: Record<ShapeTag,string[]> = {
  path:["d"], ellipse:["cx","cy","rx","ry"], circle:["cx","cy","r"],
  rect:["x","y","width","height"], line:["x1","y1","x2","y2"], polygon:["points"], polyline:["points"],
};
function fail(message: string): never { throw new Error(`Avatar: ${message}`); }
function record(value: unknown, keys: string[], label: string): Record<string,unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const obj=value as Record<string,unknown>;
  if (Object.keys(obj).some(k=>!keys.includes(k)) || keys.some(k=>!(k in obj))) fail(`${label} has missing or unsupported fields`);
  return obj;
}
function text(value: unknown, max: number, label: string) {
  if (typeof value!=="string" || !value.trim() || value.length>max || /[\u0000-\u001f]/.test(value)) fail(`invalid ${label}`);
  return value;
}
function numeric(value: unknown, min=-1440, max=2160) {
  if (typeof value!=="number" || !Number.isFinite(value) || value<min || value>max) fail("numeric value out of bounds");
  return value;
}
function point(value: unknown): Point {
  if (!Array.isArray(value) || value.length!==2) fail("pivot must be [x,y]");
  return [numeric(value[0],0,720),numeric(value[1],0,720)];
}
export function parseReadingAvatar(json: string): ReadingAvatar {
  if (new TextEncoder().encode(json).length>MAX_AVATAR_BYTES) fail("file exceeds 120 KB");
  let value: unknown;
  try { value=JSON.parse(json); } catch { fail("invalid JSON"); }
  const root=record(value,["format","version","id","name","description","creator","license","palette","rig","parts"],"root");
  if (root.format!==AVATAR_FORMAT || root.version!==1) fail("unsupported format or version");
  const id=text(root.id,48,"id");if (!/^[a-z][a-z0-9-]*$/.test(id)) fail("id must use lowercase letters, digits and hyphens");
  if (!Array.isArray(root.palette) || root.palette.length<2 || root.palette.length>16) fail("palette requires 2–16 colours");
  const palette=root.palette.map(c=>{if(typeof c!=="string" || !/^#[0-9a-fA-F]{6}$/.test(c)) fail("use six-digit hex colours");return c;});
  let count=0;
  function shapes(value: unknown, allowEmpty=true): AvatarShape[] {
    if (!Array.isArray(value) || value.length>120 || (!allowEmpty && !value.length)) fail("invalid shape list");
    return value.map(item=>{
      if (++count>500) fail("more than 500 shapes");
      const node=record(item,["tag","attrs"],"shape");
      if (!(SHAPE_TAGS as readonly unknown[]).includes(node.tag)) fail("unsupported shape tag");
      const tag=node.tag as ShapeTag;
      if (!node.attrs || typeof node.attrs!=="object" || Array.isArray(node.attrs)) fail("invalid shape attributes");
      const attrs: Record<string,string|number>={};
      for(const [key,v] of Object.entries(node.attrs)) {
        if (!SHAPE_ATTRIBUTES[tag].includes(key)) fail(`unsupported attribute ${key}`);
        if (key==="fill" || key==="stroke") {
          if(v!=="none" && !palette.includes(v as string)) fail("shape colour must be in palette"); attrs[key]=v as string;
        } else if(key==="d" || key==="points") {
          const s=text(v,12000,key);const allowed=key==="d"?/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/:/^[0-9eE+.,\s-]+$/;
          if(!allowed.test(s))fail("invalid path or points");
          const numbers=s.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
          if(!numbers.length || numbers.some(n=>!Number.isFinite(Number(n)) || Math.abs(Number(n))>2160))fail("path coordinates out of bounds");attrs[key]=s;
        } else if(key==="strokeLinecap" || key==="strokeLinejoin") {
          if(!["round","square","butt","miter","bevel"].includes(v as string))fail("invalid stroke style");attrs[key]=v as string;
        } else attrs[key]=numeric(v,key.toLowerCase().includes("opacity")?0:["r","rx","ry","width","height","strokeWidth"].includes(key)?0:-1440,key.toLowerCase().includes("opacity")?1:key==="strokeWidth"?40:2160);
      }
      if(required[tag].some(k=>!(k in attrs)))fail(`missing ${tag} geometry`);
      return {tag,attrs};
    });
  }
  const rig=record(root.rig,["headPivot","leftEarPivot","rightEarPivot"],"rig");
  const parts=record(root.parts,["tail","body","head","leftEar","rightEar","eyes","mouth","front"],"parts");
  if(!Array.isArray(parts.eyes) || parts.eyes.length!==2)fail("two eye groups are required");
  const mouth=record(parts.mouth,["origin","closed","open"],"mouth");
  return {
    format:AVATAR_FORMAT,version:1,id,name:text(root.name,48,"name"),description:text(root.description,240,"description"),
    creator:text(root.creator,80,"creator"),license:text(root.license,80,"license"),palette,
    rig:{headPivot:point(rig.headPivot),leftEarPivot:point(rig.leftEarPivot),rightEarPivot:point(rig.rightEarPivot)},
    parts:{tail:shapes(parts.tail),body:shapes(parts.body,false),head:shapes(parts.head,false),leftEar:shapes(parts.leftEar),rightEar:shapes(parts.rightEar),
      eyes:parts.eyes.map(e=>{const eye=record(e,["origin","shapes"],"eye");return {origin:point(eye.origin),shapes:shapes(eye.shapes,false)};}),
      mouth:{origin:point(mouth.origin),closed:shapes(mouth.closed,false),open:shapes(mouth.open,false)},front:shapes(parts.front,false)},
  };
}
export function addReadingAvatar(existing: ReadingAvatar[], next: ReadingAvatar): ReadingAvatar[] {
  const index=existing.findIndex(a=>a.id===next.id);
  if(index>=0)return existing.map((a,i)=>i===index?next:a);
  if(existing.length>=MAX_CUSTOM_AVATARS)fail("remove a companion before importing another (maximum 6)");
  return [...existing,next];
}
export function readAvatarLibrary(json: string | null): ReadingAvatar[] {
  if(!json || json.length>MAX_AVATAR_BYTES*MAX_CUSTOM_AVATARS)return [];
  try {const array=JSON.parse(json);if(!Array.isArray(array)||array.length>MAX_CUSTOM_AVATARS)return [];return array.reduce((all:ReadingAvatar[],a)=>addReadingAvatar(all,parseReadingAvatar(JSON.stringify(a))),[]);} catch{return [];}
}
