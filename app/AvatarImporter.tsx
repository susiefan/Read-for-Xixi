import {useRef,useState} from "react";
import {addReadingAvatar,AVATAR_STORAGE_KEY,MAX_AVATAR_BYTES,parseReadingAvatar,readAvatarLibrary,type ReadingAvatar} from "./readingAvatar";
import "./customAvatar.css";
function initial(){try{return readAvatarLibrary(localStorage.getItem(AVATAR_STORAGE_KEY));}catch{return [];}}
export function useAvatarLibrary(){
  const [avatars,setAvatars]=useState<ReadingAvatar[]>(initial);
  function persist(next:ReadingAvatar[]){setAvatars(next);try{localStorage.setItem(AVATAR_STORAGE_KEY,JSON.stringify(next));return true;}catch{return false;}}
  return {avatars,add:(a:ReadingAvatar)=>persist(addReadingAvatar(avatars,a)),remove:(id:string)=>persist(avatars.filter(a=>a.id!==id))};
}
export default function AvatarImporter({library,selectedId,onSelect,onRemoved,language="zh"}:{library:ReturnType<typeof useAvatarLibrary>;selectedId?:string;onSelect:(id:string)=>void;onRemoved:()=>void;language?:string}){
  const input=useRef<HTMLInputElement>(null);const [notice,setNotice]=useState("");const [failed,setFailed]=useState(false);const [loading,setLoading]=useState(false);const zh=language.startsWith("zh");
  async function importFile(file?:File){if(!file)return;setLoading(true);try{
    if(file.size>MAX_AVATAR_BYTES)throw Error(zh?"文件需要小于 120 KB":"File must be smaller than 120 KB");
    const avatar=parseReadingAvatar(await file.text());const saved=library.add(avatar);onSelect(avatar.id);setFailed(false);
    setNotice(saved?(zh?`已导入 ${avatar.name}`:`Imported ${avatar.name}`):(zh?"已导入，本次可用；浏览器无法保存":"Imported for this session; browser storage is unavailable"));
  }catch(error){setFailed(true);setNotice((zh?"无法导入：":"Cannot import: ")+(error instanceof Error?error.message:String(error)));}finally{setLoading(false);if(input.current)input.current.value="";}}
  return <div className="avatar-import-controls">
    <button type="button" disabled={loading} onClick={()=>input.current?.click()}>{loading?(zh?"正在导入…":"Importing…"):(zh?"导入伙伴":"Import companion")}</button>
    <input ref={input} type="file" accept=".json,application/json" hidden onChange={e=>void importFile(e.target.files?.[0])}/>
    {selectedId&&<button type="button" onClick={()=>{library.remove(selectedId);onRemoved();setNotice(zh?"已移除伙伴":"Companion removed");setFailed(false);}}>{zh?"移除伙伴":"Remove companion"}</button>}
    <a href="https://github.com/susiefan/Read-for-Xixi/blob/main/docs/custom-companions.md" target="_blank" rel="noreferrer">{zh?"制作自己的伙伴":"Create your companion"}</a>
    {notice&&<p className={failed?"avatar-import-error":""} role={failed?"alert":"status"}>{notice}</p>}
  </div>;
}
