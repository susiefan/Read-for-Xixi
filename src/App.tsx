import { useMemo, useState } from "react";
import { SessionEvent, SessionStage, privateContentBoundary, transitionSession } from "./productEngine";

const stageMeta: Record<SessionStage, { label: string; detail: string }> = {
  ready: { label: "Ready", detail: "The physical book remains the primary visual surface." },
  narrating: { label: "Narrating", detail: "The companion delivers page-aligned guidance." },
  listening: { label: "Listening", detail: "The system leaves room for the child and caregiver." },
  adapting: { label: "Adapting", detail: "The next turn adjusts to demonstrated engagement." },
};

const nextEvent: Record<SessionStage, SessionEvent> = {
  ready: { type: "START" },
  narrating: { type: "NARRATION_COMPLETE" },
  listening: { type: "RESPONSE_DETECTED" },
  adapting: { type: "ADAPTATION_COMPLETE" },
};

const capabilities = [
  ["Physical-book first", "Keeps the printed page between the parent and child instead of replacing it with a digital book."],
  ["Page-aware guidance", "Maps narration and developmental opportunities to the family’s current physical spread."],
  ["Adaptive pacing", "Separates language complexity, reasoning, engagement, and conversational turn-taking signals."],
  ["Parent voice pathway", "Supports consent-based voice setup while preserving a consistent default narration experience."],
];

function Mimi({ stage }: { stage: SessionStage }) {
  return (
    <div className={`mimi stage-${stage}`} aria-label={`Animated companion is ${stage}`}>
      <svg viewBox="0 0 640 640" role="img" aria-label="Animated Read-for-Xixi cat companion">
        <defs>
          <linearGradient id="scene" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d8e2dc" /><stop offset="1" stopColor="#f2dfba" /></linearGradient>
          <linearGradient id="fur" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9c8d7e" /><stop offset="1" stopColor="#71675f" /></linearGradient>
        </defs>
        <rect width="640" height="640" rx="36" fill="url(#scene)" />
        <circle cx="520" cy="112" r="48" fill="#f1c76f" />
        <path d="M0 470 Q150 415 300 470 T640 455 V640 H0Z" fill="#8fab77" />
        <ellipse cx="320" cy="570" rx="178" ry="28" fill="#31453c" opacity=".15" />
        <g className="cat">
          <path className="tail" d="M425 464 C550 514 566 372 485 389 C440 399 454 447 506 426" fill="none" stroke="#756a61" strokeWidth="38" strokeLinecap="round" />
          <ellipse cx="320" cy="448" rx="122" ry="148" fill="url(#fur)" />
          <ellipse cx="320" cy="472" rx="64" ry="94" fill="#d7c7b4" />
          <path d="M220 250 L230 104 L310 220Z" fill="#80746a" />
          <path d="M420 250 L410 104 L330 220Z" fill="#80746a" />
          <path d="M242 210 L247 137 L291 207Z" fill="#bf8985" />
          <path d="M398 210 L393 137 L349 207Z" fill="#bf8985" />
          <ellipse cx="320" cy="284" rx="138" ry="124" fill="url(#fur)" />
          <ellipse cx="270" cy="278" rx="32" ry="43" fill="#c8dd96" />
          <ellipse cx="370" cy="278" rx="32" ry="43" fill="#c8dd96" />
          <ellipse cx="274" cy="282" rx="9" ry="27" fill="#17201b" />
          <ellipse cx="366" cy="282" rx="9" ry="27" fill="#17201b" />
          <circle cx="269" cy="271" r="5" fill="white" /><circle cx="361" cy="271" r="5" fill="white" />
          <ellipse cx="283" cy="345" rx="49" ry="35" fill="#d9c9b8" /><ellipse cx="357" cy="345" rx="49" ry="35" fill="#d9c9b8" />
          <path d="M304 327 Q320 316 336 327 L320 344Z" fill="#704b51" />
          <path className="smile" d="M320 344 Q299 366 280 354 M320 344 Q341 366 360 354" fill="none" stroke="#49383a" strokeWidth="6" strokeLinecap="round" />
          <ellipse className="mouth" cx="320" cy="370" rx="21" ry="6" fill="#422d30" />
          <path d="M270 340 L185 328 M270 355 L180 365 M370 340 L455 328 M370 355 L460 365" stroke="#eee4d8" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
      <div className="live-badge"><i /> LIVE 2D</div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState<SessionStage>("ready");
  const current = stageMeta[stage];
  const boundaryItems = useMemo(() => Object.entries(privateContentBoundary), []);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Read-for-Xixi home"><span>S</span>Read-for-Xixi</a>
        <nav><a href="#product">Product</a><a href="#architecture">Architecture</a><a href="#privacy">Privacy</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">PRODUCT + PROTOTYPE</p>
          <h1>A reading companion that keeps the <em>real book</em> in the middle.</h1>
          <p className="lede">Read-for-Xixi helps caregivers sustain responsive, developmentally rich shared reading with a low-screen animated companion.</p>
          <div className="hero-actions"><a className="primary" href="#product">Explore the product</a><span>Privacy-safe public build</span></div>
        </div>
        <div className="demo-card">
          <Mimi stage={stage} />
          <div className="state-panel">
            <div><small>SESSION ENGINE</small><strong>{current.label}</strong><p>{current.detail}</p></div>
            <button onClick={() => setStage((value) => transitionSession(value, nextEvent[value]))}>Advance state <span>→</span></button>
          </div>
        </div>
      </section>

      <section className="section" id="product">
        <div className="section-head"><p className="eyebrow">THE PRODUCT</p><h2>Designed around the relationship, not the screen.</h2></div>
        <div className="capability-grid">{capabilities.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="architecture" id="architecture">
        <div className="section-head"><p className="eyebrow">SYSTEM ARCHITECTURE</p><h2>Private content in. Adaptive session out.</h2></div>
        <div className="flow"><div><b>01</b><strong>Book preparation</strong><p>Page order and visual context</p></div><i>→</i><div><b>02</b><strong>Page map</strong><p>Plot, concepts, and pacing</p></div><i>→</i><div><b>03</b><strong>Session engine</strong><p>State and adaptation logic</p></div><i>→</i><div><b>04</b><strong>Companion</strong><p>Voice and visual reactions</p></div></div>
      </section>

      <section className="privacy" id="privacy">
        <div><p className="eyebrow">PRIVACY BY DESIGN</p><h2>The public shell contains no family or book content.</h2><p>This repository exposes product and engineering decisions while keeping real-world inputs and generated assets outside the public codebase.</p></div>
        <dl>{boundaryItems.map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{value}</dd></div>)}</dl>
      </section>

      <footer><strong>Read-for-Xixi</strong><span>Physical-book-first adaptive reading companion</span></footer>
    </main>
  );
}
