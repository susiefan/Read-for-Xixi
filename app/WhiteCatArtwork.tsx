import { useId, type Ref } from "react";
import { whiteCatMouthPath } from "./whiteCatRig";

// Original vector illustration, not a Cubism model. Named layers have fixed pivots.
export default function WhiteCatArtwork({ glasses = "none", svgRef, label = "Mimi", reviewedScene = false }: {
  glasses?: "none" | "black" | "blue"; svgRef?: Ref<SVGSVGElement>; label?: string; reviewedScene?: boolean;
}) {
  const id = `white-cat-${useId().replace(/:/g, "")}`;
  return <svg ref={svgRef} className="white-cat-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
    <defs>
      <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="0.2" y2="1"><stop stopColor="#fffefd"/><stop offset="1" stopColor="#f0e9e6"/></linearGradient>
      <linearGradient id={`${id}-ear`} x2="0" y2="1"><stop stopColor="#f1b7bb"/><stop offset="1" stopColor="#f9d9d6"/></linearGradient>
    </defs>
    <g transform={reviewedScene ? "translate(63 107) scale(.7708333333)" : undefined}>
    <ellipse cx="366" cy="648" rx="176" ry="18" fill="#4f3c55" opacity=".13"/>
    <g fill={`url(#${id}-fur)`} stroke="#bbaaa6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <g data-rig="tail"><path d="M461 590 C562 619 588 551 566 505 C552 477 530 491 542 516 C559 555 531 575 475 559"/><path d="M549 500 Q553 507 551 514" fill="none" stroke="#fffefd" strokeWidth="9"/></g>
      <g data-rig="body">
        <path d="M281 409 C250 444 246 512 261 569 Q360 624 459 569 C476 514 468 448 439 409Z"/>
        <ellipse cx="360" cy="502" rx="70" ry="80" fill="#fffdfa" stroke="none"/>
        <ellipse cx="288" cy="617" rx="48" ry="24"/><ellipse cx="432" cy="617" rx="48" ry="24"/>
        <path d="M272 621v7 M284 623v7 M436 623v7 M448 621v7" stroke="#d5c6c1" strokeWidth="2"/>
      </g>
      <g data-rig="head">
        <g data-rig="left-ear"><path d="M222 258 Q206 207 227 156 Q234 143 246 154 L300 214Z"/><path d="M237 232 Q225 198 236 174 Q259 187 275 214Z" fill={`url(#${id}-ear)`} stroke="none"/></g>
        <g data-rig="right-ear"><path d="M420 214 L474 154 Q486 143 493 156 Q514 207 498 258Z"/><path d="M445 214 Q461 187 484 174 Q495 198 483 232Z" fill={`url(#${id}-ear)`} stroke="none"/></g>
        <path d="M235 239 Q256 209 310 205 Q321 194 334 198 L332 189 Q352 190 361 201 Q375 190 388 196 L383 205 Q439 203 475 239 C506 264 519 303 507 333 L517 338 L504 349 L511 354 C491 401 436 430 360 430 C284 430 229 401 209 354 L216 349 L203 338 L213 333 C201 303 214 264 235 239Z"/>
        <path d="M279 255 Q292 248 306 252 M414 252 Q428 248 441 255" fill="none" stroke="#d8c6bf" strokeWidth="4"/>
        <ellipse cx="264" cy="351" rx="25" ry="12" fill="#f3c6c4" stroke="none" opacity=".7"/>
        <ellipse cx="456" cy="351" rx="25" ry="12" fill="#f3c6c4" stroke="none" opacity=".7"/>
        {[298, 422].map((x, i) => <g key={x} transform={`translate(${x} 307)`}>
          <defs><clipPath id={`${id}-eye-${i}`}><ellipse rx="19" ry="25"/></clipPath></defs>
          <g data-rig={`eye-${i}`}><ellipse rx="19" ry="25" fill="#3d514f" stroke="#40504c" strokeWidth="2"/>
            <g clipPath={`url(#${id}-eye-${i})`}><g data-rig="pupil"><ellipse cy="5" rx="12" ry="17" fill="#273936" stroke="none"/><ellipse cx="-6" cy="-8" rx="5" ry="6" fill="#fffefd" stroke="none"/><circle cx="7" cy="10" r="2.5" fill="#a4b8a6" stroke="none"/></g></g>
          </g>
        </g>)}
        <ellipse cx="344" cy="352" rx="25" ry="19" fill="#fffdfa" stroke="none"/><ellipse cx="376" cy="352" rx="25" ry="19" fill="#fffdfa" stroke="none"/>
        <path data-rig="mouth" d={whiteCatMouthPath(0)} fill="#965965" stroke="none"/>
        <g data-upper-smile="permanent" fill="none" stroke="#655451" strokeWidth="3.5"><path d="M360 342v9 Q352 363 343 352 M360 351 Q368 363 377 352"/></g>
        <path d="M353 335 Q360 332 367 335 Q369 338 360 344 Q351 338 353 335Z" fill="#d89899" stroke="none"/>
        <path d="M246 335l-25-4 M246 349l-27 5 M474 335l25-4 M474 349l27 5" fill="none" stroke="#c3b3ac" strokeWidth="2.5"/>
        {glasses !== "none" && <g fill={glasses === "blue" ? "#95d9f1" : "none"} fillOpacity=".18" stroke={glasses === "blue" ? "#3b9ccd" : "#41434b"} strokeWidth={glasses === "blue" ? 9 : 5}>
          <rect x="263" y="277" width="71" height="65" rx="24"/><rect x="386" y="277" width="71" height="65" rx="24"/>
          <path d="M334 303 Q360 292 386 303 M263 299l-33-8 M457 299l33-8" fill="none"/>
        </g>}
      </g>
      {/* Audience sees covers. Spine projects toward viewer; outer edges fold back toward cat. */}
      <g data-pages-facing="cat" data-book-fold="inward">
        <path d="M245 492 Q303 498 360 531 Q417 498 475 492 L477 502 Q418 508 360 541 Q302 508 243 502Z" fill="#fff6df" stroke="#d9c9b5" strokeWidth="2"/>
        <path d="M242 502 Q303 508 360 541 V627 Q303 594 242 588Z" fill="#bba6d0" stroke="#8e789f"/>
        <path d="M360 541 Q417 508 478 502 V588 Q417 594 360 627Z" fill="#a38abb" stroke="#8e789f"/>
        <path d="M360 541v86" stroke="#806993" strokeWidth="5"/>
        <path d="M254 578 Q304 585 348 609 M372 609 Q416 585 466 578" fill="none" stroke="#d8c8e3" strokeWidth="2"/>
        <path d="M423 530l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1Z" fill="#f7dea2" stroke="none"/>
        <path d="M249 530 C219 524 216 556 236 569 Q257 582 268 562 Q277 543 249 530Z"/>
        <path d="M471 530 C501 524 504 556 484 569 Q463 582 452 562 Q443 543 471 530Z"/>
        <path d="M237 543l9 5 M233 552l9 5 M483 543l-9 5 M487 552l-9 5" stroke="#d8c8c2" strokeWidth="2"/>
      </g>
    </g>
    </g>
  </svg>;
}
