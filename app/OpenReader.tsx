import { useEffect, useRef, useState } from "react";
import AnimatedWhiteCat from "./AnimatedWhiteCat";
import CustomReadingAvatar from "./CustomReadingAvatar";
import AvatarImporter, { useAvatarLibrary } from "./AvatarImporter";
import Live2DMimi from "./Live2DMimi";
import Live3DMimi from "./Live3DMimi";
import ReadingSceneLayer from "./ReadingSceneLayer";
import "./classicCat.css";
import { InterfaceLanguageProvider } from "./interfaceLanguage";
import { afterAudio, pageDestination, readStars, type Phase } from "./readingFlow";
import type { StoryBook } from "./types";
import "./mimi3d.css";
import "./openReader.css";

type OpenBook = StoryBook & {
  cover: string;
  preferredCompanion?: string;
  localized: Record<string, { title: string; description: string }>;
  license: { source: string; url: string; creators: string[] };
  pages: (StoryBook["pages"][number] & { image: string; narration: Record<string,string>; audioTracks?: Record<string,string> })[];
};
const copy = {
  zh: ["今天读什么？", "开始阅读", "回到书架", "设置", "我的故事星", "上一页", "下一页", "让 Mimi 回应", "重听这一页", "自动播放", "读完啦", "原书文字", "中文共读", "轮到你说一说啦", "暂停", "继续播放", "音频无法播放，请重试。", "和 Mimi 一起读", "完成"],
  en: ["What shall we read?", "Start reading", "Library", "Settings", "Story stars", "Previous", "Next", "Let Mimi respond", "Replay page", "Autoplay", "You finished!", "Original text", "Mandarin reading", "Your turn", "Pause", "Resume", "Audio could not play. Please retry.", "Read with Mimi", "Finish"],
};
function saved(key: string, fallback: string) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function save(key:string,value:string) { try { localStorage.setItem(key,value); } catch { /* Reading works without storage. */ } }

export default function OpenReader() {
  const [lang,setLang] = useState<"zh"|"en">(()=>saved("xixi-open-language","zh")==="en"?"en":"zh");
  const avatarLibrary=useAvatarLibrary();
  const [cat,setCat] = useState(()=>saved("xixi-open-cat","3d"));
  const [glasses,setGlasses] = useState<"none"|"black"|"blue">("none");
  const [books,setBooks] = useState<OpenBook[]>([]), [error,setError] = useState("");
  const [selected,setSelected] = useState(0), [reading,setReading] = useState(false), [finished,setFinished] = useState(false);
  const [page,setPage] = useState(0), [phase,setPhase] = useState<Phase>("story");
  const [speaking,setSpeaking] = useState(false), [paused,setPaused] = useState(false), [autoplay,setAutoplay] = useState(false);
  const [settings,setSettings] = useState(false), [stars,setStars] = useState(()=>readStars(saved("xixi-open-stars","0")));
  const audio = useRef<HTMLAudioElement|null>(null), generation = useRef(0);
  const context = useRef<AudioContext|null>(null), analyser = useRef<AnalyserNode|null>(null);
  const book=books[selected], spread=book?.pages[page], t=copy[lang];
  const customAvatar=avatarLibrary.avatars.find(a=>cat===`custom:${a.id}`);
  useEffect(()=>{if(cat.startsWith("custom:")&&!customAvatar){setCat("3d");save("xixi-open-cat","3d");}},[cat,customAvatar]);
  const stop=()=>{ generation.current++; if(audio.current) { audio.current.pause(); audio.current.onended=null; } audio.current=null; setSpeaking(false); setPaused(false); };
  const play=(next:Phase,index=page)=>{
    stop(); setError(""); setPhase(next);
    if(!book || next==="waiting" || next==="ready") return;
    const current=generation.current;
    const element=new Audio(book.pages[index].audioTracks?.[next] ?? `${book.audioBase}/spread-${index+1}-${next}.wav`);audio.current=element;
    try {
      context.current ??= new AudioContext(); void context.current.resume();
      const source=context.current.createMediaElementSource(element); const meter=context.current.createAnalyser();
      meter.fftSize=256;source.connect(meter);meter.connect(context.current.destination);analyser.current=meter;
    } catch { analyser.current=null; }
    element.onplay=()=>{if(current===generation.current)setSpeaking(true);};
    element.onpause=()=>{if(current===generation.current)setSpeaking(false);};
    element.onended=()=>{
      if(current!==generation.current)return;
      setSpeaking(false); const following=afterAudio(next);
      if(following==="invitation")play(following,index);else setPhase(following);
    };
    const failed=()=>{if(current===generation.current){setSpeaking(false);setError(t[16]);}};
    element.onerror=failed; void element.play().catch(failed);
  };
  useEffect(()=>{
    const abort=new AbortController();
    fetch("/library/books.json",{signal:abort.signal}).then(r=>{if(!r.ok)throw Error(String(r.status));return r.json();}).then(data=>setBooks(data.books)).catch(e=>{if(e.name!=="AbortError")setError("请先导入本地书库：python scripts/import_existing_library.py /path/to/storyspark-app");});
    return()=>abort.abort();
  },[]);
  useEffect(()=>()=>{generation.current++;audio.current?.pause();void context.current?.close();context.current=null;},[]);
  const turn=(delta:number)=>{
    stop();
    if(delta>0 && page===book.pages.length-1){setReading(false);setFinished(true);setStars(value=>{save("xixi-open-stars",String(value+1));return value+1;});return;}
    const index=pageDestination(page,delta,book.pages.length);setPage(index);play("story",index);
  };
  useEffect(()=>{
    if(!autoplay||!reading||paused||error)return;
    if(phase!=="waiting"&&phase!=="ready")return;
    const timer=window.setTimeout(()=>{if(phase==="waiting")play("response");else turn(1);},phase==="waiting"?5000:1500);
    return()=>window.clearTimeout(timer);
  },[autoplay,reading,paused,error,phase,page,selected]);
  const sample=()=>{if(!analyser.current)return null;const values=new Uint8Array(analyser.current.frequencyBinCount);analyser.current.getByteTimeDomainData(values);return Math.min(1,Math.sqrt(values.reduce((s,n)=>s+((n-128)/128)**2,0)/values.length)*5);};
  const begin=()=>{if(book.preferredCompanion){setCat(book.preferredCompanion);save("xixi-open-cat",book.preferredCompanion);}setPage(0);setReading(true);setFinished(false);play("story",0);};
  const pause=()=>{if(!audio.current)return;if(paused){void context.current?.resume();void audio.current.play().then(()=>setPaused(false)).catch(()=>setError(t[16]));}else{audio.current.pause();setPaused(true);}};
  const title=book?.localized[lang==="zh"?"zh-CN":"en"].title;
  return <InterfaceLanguageProvider language={lang==="zh"?"zh-CN":"en"}><div className="open-reader">
    <header><a href="#" onClick={e=>{e.preventDefault();stop();setReading(false);setFinished(false);}}>Read for Xixi</a><div className="header-actions"><span className="stars" aria-label={`${t[4]} ${stars}`}>★ <b>{stars}</b></span><button onClick={()=>{const value=lang==="zh"?"en":"zh";setLang(value);save("xixi-open-language",value);}}>{lang==="zh"?"English":"中文"}</button><button aria-expanded={settings} onClick={()=>setSettings(!settings)} aria-label={t[3]}>☰</button></div></header>
    {settings&&<section className="settings" aria-label={t[3]}><label>{lang==="zh"?"阅读伙伴":"Companion"}<select value={cat} onChange={e=>{setCat(e.target.value);save("xixi-open-cat",e.target.value);}}><option value="3d">Mimi · 3D</option><option value="white-2d">{lang==="zh"?"白猫 · 动画 2D":"White cat · Animated 2D"}</option><option value="2d">Mimi · 2D</option>{avatarLibrary.avatars.map(a=><option key={a.id} value={`custom:${a.id}`}>{a.name}</option>)}</select></label><label>{lang==="zh"?"眼镜":"Glasses"}<select value={glasses} onChange={e=>setGlasses(e.target.value as typeof glasses)}><option value="none">{lang==="zh"?"无眼镜":"None"}</option><option value="black">{lang==="zh"?"黑框眼镜":"Black frames"}</option><option value="blue">{lang==="zh"?"蓝色护目镜":"Blue goggles"}</option></select></label><AvatarImporter library={avatarLibrary} selectedId={customAvatar?.id} language={lang} onSelect={id=>{setCat(`custom:${id}`);save("xixi-open-cat",`custom:${id}`);}} onRemoved={()=>{setCat("3d");save("xixi-open-cat","3d");}}/></section>}
    <main>
      <section className="companion" aria-label={t[17]}>
        <div className="cat-stage">
          {customAvatar?<CustomReadingAvatar avatar={customAvatar} speaking={speaking} sampleAudio={sample} scene={reading?spread?.readingScene:undefined}/>:cat==="3d"?<Live3DMimi mood={speaking?"speaking":"resting"} speaking={speaking} glasses={glasses} scene="reading-nook" props={[]} sampleAudio={sample} readingSession={reading} readingScene={reading?spread?.readingScene:undefined}/>:cat==="white-2d"?<AnimatedWhiteCat mood={speaking?"speaking":"resting"} speaking={speaking} page={page} setting="study" glasses={glasses} sampleAudio={sample} reading={reading} scene={reading?spread?.readingScene:undefined}/>:<>{reading&&spread?.readingScene&&<ReadingSceneLayer scene={spread.readingScene} depth="behind"/>}<Live2DMimi mood={speaking?"speaking":"resting"} speaking={speaking} page={page} setting="study" glasses={glasses} catOnly={reading&&Boolean(spread?.readingScene)}/>{reading&&spread?.readingScene&&<ReadingSceneLayer scene={spread.readingScene} depth="front"/>}</>}
        </div>
      </section>
      <section className="reader-panel">
        {error&&<p role="alert">{error}</p>}
        {finished?<><p className="eyebrow">★ +1</p><h1>{t[10]}</h1><button className="primary" onClick={()=>setFinished(false)}>{t[2]}</button></>:!reading?<><p className="eyebrow">{t[17]}</p><h1>{t[0]}</h1><div className="book-grid">{books.map((item,i)=><button key={item.id} className={`book-card ${selected===i?"selected":""}`} aria-pressed={selected===i} onClick={()=>setSelected(i)}><img src={item.cover} alt=""/><strong>{item.localized[lang==="zh"?"zh-CN":"en"].title}</strong><span>{item.localized[lang==="zh"?"zh-CN":"en"].description}</span></button>)}</div><button className="primary" disabled={!book} onClick={begin}>{t[1]}</button></>:<>
          <div className="reading-heading"><button onClick={()=>{stop();setReading(false);}}>{t[2]}</button><span>{page+1} / {book.pages.length}</span></div><h1>{title}</h1>
          <img className="source-page" src={spread.image} alt={`${title} · ${spread.label}`}/>
          <p className="narration">{spread.narration["zh-CN"]}</p><details><summary>{t[11]}</summary><p className="original">{spread.story||"—"}</p></details>
          <div className="invitation"><p>{spread.invitation}</p>{(phase==="waiting"||phase==="ready")&&<small>{phase==="waiting"?t[13]:""}</small>}{(phase==="response"||phase==="ready")&&<p>{spread.response}</p>}</div>
          <nav className="page-controls" aria-label={lang==="zh"?"翻页":"Page controls"}><button disabled={page===0} onClick={()=>turn(-1)}>← {t[5]}</button><button className="primary" onClick={()=>turn(1)}>{page===book.pages.length-1?t[18]:t[6]} →</button></nav>
          <div className="play-controls"><button onClick={()=>play("story")}>{t[8]}</button><button onClick={()=>play("response")}>{t[7]}</button><button onClick={pause} disabled={!audio.current}>{paused?t[15]:t[14]}</button><label><input type="checkbox" checked={autoplay} onChange={e=>setAutoplay(e.target.checked)}/>{t[9]}</label></div>
        </>}
        {book&&<footer><span>{book.title}</span><span>{book.license.creators.join(" · ")}</span><span>{lang==="zh"?"本地书库 · 不包含公开再分发授权":"Local library · Not licensed for redistribution"}</span></footer>}
      </section>
    </main><footer className="app-footer"><a href="https://github.com/susiefan/Read-for-Xixi">Open source</a> · {lang==="zh"?"按钮翻页 · 不使用摄像头或麦克风":"Button controls · No camera or microphone"}</footer>
  </div></InterfaceLanguageProvider>;
}
