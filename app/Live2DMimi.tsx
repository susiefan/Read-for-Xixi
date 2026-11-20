import type { GeneratedVisualAsset, MimiAsset, Mood, StoryBook } from "./types";
import { publicAsset } from "./webRuntime";

type Props = {
  mood: Mood;
  speaking: boolean;
  page: number;
  setting: StoryBook["setting"];
  mimiAssets?: MimiAsset[];
  backgroundUrl?: string;
  visualAsset?: GeneratedVisualAsset | null;
  catStyle?: "classic";
  glasses?: "none" | "black" | "blue";
  sceneryOnly?: boolean;
  /** Draw only the cat; a reviewed book scene supplies the background and props. */
  catOnly?: boolean;
};

const ASSET_POSITIONS: Record<GeneratedVisualAsset["placement"], { x: number; y: number }> = {
  "top-left": { x: 42, y: 92 },
  "top-right": { x: 528, y: 92 },
  "bottom-left": { x: 42, y: 470 },
  "bottom-right": { x: 528, y: 470 },
};

export default function Live2DMimi({
  mood,
  speaking,
  page,
  setting,
  mimiAssets = [],
  backgroundUrl,
  visualAsset,
  catStyle = "classic",
  glasses = "none",
  sceneryOnly = false,
  catOnly = false,
}: Props) {
  const isFarm = setting === "farm";
  const isStudy = setting === "study";
  const hasAsset = (asset: MimiAsset) => mimiAssets.includes(asset);

  return (
    <div
      className={`mimi-2d cat-style-${catStyle} setting-${setting} page-${page} mood-${mood} ${speaking ? "is-speaking" : ""}`}
      aria-label={sceneryOnly ? "故事背景和道具" : "Mimi animated 2D reading cat"}
    >
      <svg viewBox="0 0 720 720" preserveAspectRatio={catOnly ? "xMidYMid meet" : "xMidYMid slice"} role="img" aria-label={sceneryOnly ? "故事背景和道具" : "Mimi, an animated two-dimensional cat"}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cbd9d3" />
            <stop offset="1" stopColor="#eee0bf" />
          </linearGradient>
          <linearGradient id="fur" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#9b8d7e" />
            <stop offset="1" stopColor="#756b62" />
          </linearGradient>
          <filter id="soft-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#3f463f" floodOpacity=".2" />
          </filter>
          <clipPath id="page-asset-clip"><rect width="150" height="150" rx="28" /></clipPath>
        </defs>

        {!catOnly && <>
        {backgroundUrl ? (
          <image href={publicAsset(backgroundUrl)} width="720" height="720" preserveAspectRatio="xMidYMid slice" />
        ) : (
          <rect width="720" height="720" fill="url(#sky)" />
        )}
        {!backgroundUrl && !isStudy && <circle className="sun" cx="594" cy="130" r="58" fill="#f5c96e" opacity=".82" />}
        {!backgroundUrl && (isFarm ? (
          <g className="farm-scene">
            <path d="M0 485 Q150 430 310 485 T720 475 V720 H0Z" fill="#9fbc78" />
            <path d="M0 555 Q190 505 380 555 T720 540 V720 H0Z" fill="#789b62" opacity=".88" />
            <path d="M0 505 H720 M0 548 H720 M55 470 V585 M155 470 V585 M565 470 V585 M665 470 V585" stroke="#e7d5aa" strokeWidth="13" opacity=".9" />
          </g>
        ) : isStudy ? (
          <g className="study-scene">
            <rect y="455" width="720" height="265" fill="#c9ad83" />
            <path d="M0 560 H720 M0 640 H720" stroke="#af8e67" strokeWidth="7" opacity=".55" />
            <rect x="72" y="118" width="210" height="240" rx="10" fill="#ecdfc4" stroke="#8a7764" strokeWidth="12" />
            <path d="M177 124 V352 M78 238 H276" stroke="#8a7764" strokeWidth="8" />
            <rect x="520" y="245" width="130" height="25" rx="8" fill="#7a6d61" />
            <rect x="535" y="197" width="25" height="48" fill="#d98267" />
            <rect x="564" y="184" width="31" height="61" fill="#6e9a91" />
            <rect x="599" y="207" width="37" height="38" fill="#d6b65e" />
          </g>
        ) : (
          <>
            <path className="sea sea-back" d="M0 505 Q90 475 180 505 T360 505 T540 505 T720 505 V720 H0Z" fill="#8fb7b5" />
            <path className="sea sea-front" d="M0 550 Q90 520 180 550 T360 550 T540 550 T720 550 V720 H0Z" fill="#6f9e9e" opacity=".78" />
          </>
        ))}

        {visualAsset?.url && (() => {
          const position = ASSET_POSITIONS[visualAsset.placement];
          return (
            <g className="generated-page-asset story-prop" transform={`translate(${position.x} ${position.y})`}>
              <rect width="150" height="150" rx="28" fill="#f7f1e5" opacity=".92" />
              <image
                href={publicAsset(visualAsset.url)}
                width="150"
                height="150"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#page-asset-clip)"
              />
            </g>
          );
        })()}

        <ellipse cx="360" cy="635" rx="225" ry="42" fill="#4d544c" opacity=".15" />
        {hasAsset("beach-ball") && (
          <g className="beach-ball story-prop" transform="translate(545 488)">
            <circle r="46" fill="#f6eee0" stroke="#5d635c" strokeWidth="5" />
            <path d="M0-43 C35-18 35 18 0 43 C-35 18-35-18 0-43Z" fill="#d6745f" />
            <path d="M-43 0 C-18-35 18-35 43 0 C18 35-18 35-43 0Z" fill="#e6b64f" opacity=".8" />
            <circle r="9" fill="#f6eee0" />
          </g>
        )}
        {hasAsset("ice-cream") && (
          <g className="ice-cream story-prop" transform="translate(112 430)">
            <path d="M0 0 L34 112 L68 0Z" fill="#c99357" stroke="#765d45" strokeWidth="4" />
            <path d="M8 24 L56 88 M60 24 L15 88" stroke="#e8bc7b" strokeWidth="4" opacity=".75" />
            <circle cx="34" cy="-13" r="39" fill="#f2d6a2" stroke="#765d45" strokeWidth="4" />
            <circle cx="19" cy="-25" r="8" fill="#fff2d2" opacity=".75" />
          </g>
        )}
        {hasAsset("seagull") && (
          <g className="seagull story-prop">
            <path d="M485 190 Q530 145 566 190 Q602 145 650 190 Q607 171 566 215 Q525 171 485 190Z" fill="#f8f4e9" stroke="#59625d" strokeWidth="5" />
            <circle cx="572" cy="188" r="4" fill="#1d211d" />
            <path d="M650 190 L683 199 L650 209Z" fill="#df9b4b" />
          </g>
        )}
        {hasAsset("sandcastle") && (
          <g className="sandcastle story-prop" transform="translate(74 455)">
            <path d="M0 150 L0 56 L28 56 L28 30 L55 30 L55 56 L83 56 L83 30 L110 30 L110 56 L138 56 L138 150Z" fill="#d5a65e" stroke="#79654a" strokeWidth="5" />
            <path d="M44 150 V112 Q69 80 94 112 V150Z" fill="#8b744f" />
            <path d="M18 83 H120 M18 111 H120" stroke="#eccd8f" strokeWidth="6" opacity=".72" />
            <path d="M69 30 V-15 L113 3 L69 18Z" fill="#c65f55" stroke="#79654a" strokeWidth="4" />
          </g>
        )}
        {hasAsset("sheep") && (
          <g className="sheep story-prop" transform="translate(72 472)" stroke="#655f58" strokeWidth="5" strokeLinejoin="round">
            <path d="M16 70 C-4 46 12 20 39 28 C39 2 72-7 86 14 C105-8 137 7 132 33 C160 30 171 62 151 79 C160 106 126 124 105 107 C85 129 51 119 49 96 C25 103 4 91 16 70Z" fill="#eee6d8" />
            <ellipse cx="125" cy="72" rx="38" ry="34" fill="#9a8976" />
            <path d="M106 52 L92 34 Q119 34 126 52 M144 52 L159 34 Q132 34 125 52" fill="#d1b79b" />
            <circle cx="115" cy="67" r="4" fill="#252724" stroke="none" />
            <circle cx="137" cy="67" r="4" fill="#252724" stroke="none" />
            <path d="M121 82 Q126 87 132 82" fill="none" strokeLinecap="round" />
            <path d="M48 105 V139 M102 108 V139" fill="none" strokeLinecap="round" />
          </g>
        )}
        {hasAsset("toy-train") && (
          <g className="toy-train story-prop" transform="translate(500 485)" stroke="#615f59" strokeWidth="5" strokeLinejoin="round">
            <path d="M0 68 H105 V126 H0Z" fill="#c85f55" />
            <rect x="18" y="25" width="50" height="45" rx="5" fill="#d97560" />
            <rect x="78" y="43" width="18" height="27" fill="#d8b55b" />
            <path d="M105 81 H168 V126 H105Z" fill="#638f9c" />
            <circle cx="31" cy="129" r="18" fill="#4d514e" />
            <circle cx="82" cy="129" r="18" fill="#4d514e" />
            <circle cx="130" cy="129" r="18" fill="#4d514e" />
            <path d="M42 19 Q28 0 44-13 Q60-3 53 12 M76 12 Q67-7 84-16" fill="none" stroke="#eee8d9" strokeWidth="12" strokeLinecap="round" />
          </g>
        )}
        {hasAsset("broken-truck") && (
          <g className="broken-truck story-prop" transform="translate(64 480)" stroke="#59625d" strokeWidth="5" strokeLinejoin="round">
            <path d="M0 34 H92 V105 H0Z" fill="#789d75" />
            <path d="M92 57 H135 L160 82 V105 H92Z" fill="#93ad83" />
            <path d="M109 66 H132 L145 82 H109Z" fill="#dbe5df" />
            <circle cx="34" cy="108" r="20" fill="#414744" />
            <circle cx="129" cy="145" r="20" fill="#414744" />
            <path d="M126 113 Q136 121 131 132" fill="none" stroke="#bb665a" strokeDasharray="7 7" />
          </g>
        )}
        {hasAsset("factory-gear") && (
          <g className="factory-gear story-prop" transform="translate(527 440)" stroke="#5b625c" strokeWidth="5" strokeLinejoin="round">
            <path d="M0 151 V55 L52 82 V55 L103 82 V25 H145 V151Z" fill="#829990" />
            <rect x="20" y="104" width="28" height="47" fill="#e0b25c" />
            <rect x="65" y="104" width="28" height="47" fill="#d87966" />
            <circle cx="119" cy="112" r="28" fill="#e9dcc4" />
            <circle cx="119" cy="112" r="9" fill="#6d766e" />
            <path d="M119 73 V151 M80 112 H158" fill="none" />
          </g>
        )}
        {hasAsset("milk-bottle") && (
          <g className="milk-bottle story-prop" transform="translate(78 438)" stroke="#66706a" strokeWidth="5" strokeLinejoin="round">
            <path d="M44 6 H96 V38 Q113 58 113 83 V153 H27 V83 Q27 58 44 38Z" fill="#f3eee2" />
            <rect x="42" y="5" width="56" height="25" rx="6" fill="#7ba2aa" />
            <path d="M29 99 H111" stroke="#8fc4d0" strokeWidth="34" />
            <circle cx="139" cy="134" r="18" fill="#d7b45e" />
            <circle cx="162" cy="113" r="18" fill="#d7b45e" />
          </g>
        )}
        {hasAsset("story-book") && (
          <g className="story-book story-prop" transform="translate(510 500) rotate(7)" stroke="#5c615c" strokeWidth="5" strokeLinejoin="round">
            <path d="M0 0 Q57-14 86 12 V119 Q49 98 0 110Z" fill="#6f9992" />
            <path d="M86 12 Q119-14 174 0 V110 Q126 98 86 119Z" fill="#d9b25f" />
            <path d="M86 12 V119" fill="none" />
            <path d="M24 33 H64 M109 33 H151 M24 55 H64 M109 55 H151" stroke="#f1e8d5" strokeWidth="7" strokeLinecap="round" />
          </g>
        )}
        {hasAsset("blueberries") && (
          <g className="blueberries story-prop" transform="translate(520 470)" stroke="#555d59" strokeWidth="4">
            <path d="M0 82 Q74 142 148 82 L128 145 H20Z" fill="#e5d1a9" />
            {[28, 60, 91, 120].map((cx, index) => <circle key={cx} cx={cx} cy={75 - (index % 2) * 14} r="23" fill="#596f9e" />)}
            <path d="M26 45 L35 32 M58 32 L65 18 M92 48 L98 33 M118 31 L126 17" stroke="#6f8b64" strokeLinecap="round" />
          </g>
        )}
        {hasAsset("bee-flowers") && (
          <g className="bee-flowers story-prop" transform="translate(58 430)" stroke="#5c625c" strokeWidth="4" strokeLinecap="round">
            <path d="M35 155 Q50 94 58 50 M120 155 Q112 105 101 69" fill="none" stroke="#6f9363" strokeWidth="8" />
            <circle cx="58" cy="42" r="16" fill="#d8736a" />
            <circle cx="101" cy="61" r="16" fill="#7da2a2" />
            <path d="M58 21 L58 63 M37 42 H79 M101 40 V82 M80 61 H122" stroke="#f3dfb7" strokeWidth="12" />
            <ellipse cx="107" cy="5" rx="30" ry="20" fill="#e7b64f" />
            <path d="M92-10 V20 M105-14 V24 M118-10 V20" stroke="#4f514c" strokeWidth="7" />
            <ellipse cx="88" cy="-8" rx="19" ry="12" fill="#dbe9e6" opacity=".9" />
            <ellipse cx="126" cy="-8" rx="19" ry="12" fill="#dbe9e6" opacity=".9" />
          </g>
        )}
        {hasAsset("coin-toss") && (
          <g className="coin-toss story-prop" transform="translate(520 410)" stroke="#635e51" strokeWidth="5" strokeLinejoin="round">
            <ellipse cx="80" cy="20" rx="29" ry="42" fill="#d9b456" />
            <path d="M80-5 V45 M64 20 H96" stroke="#f1d98f" strokeWidth="6" strokeLinecap="round" />
            <path d="M6 132 Q37 88 72 126 Q48 152 11 158Z" fill="#d8b795" />
            <path d="M154 132 Q123 88 88 126 Q112 152 149 158Z" fill="#d8b795" />
            <path d="M47 84 Q80 58 113 84" fill="none" stroke="#d59a60" strokeDasharray="7 8" />
          </g>
        )}
        {hasAsset("cake") && (
          <g className="cake story-prop" transform="translate(73 465)" stroke="#665c55" strokeWidth="5" strokeLinejoin="round">
            <path d="M16 70 H150 V139 Q84 164 16 139Z" fill="#e7bd85" />
            <path d="M16 70 Q84 38 150 70 Q83 103 16 70Z" fill="#f2d7a8" />
            <path d="M23 77 Q43 103 61 82 Q82 108 103 82 Q128 104 146 78" fill="none" stroke="#d57f79" strokeWidth="15" />
            <path d="M58 45 V17 M104 45 V12" stroke="#6f8f70" strokeWidth="8" />
            <path d="M48 18 Q58-2 68 18 Q58 30 48 18 M94 13 Q104-7 114 13 Q104 25 94 13" fill="#e6ad4c" stroke="none" />
          </g>
        )}
        {hasAsset("toy-drum") && (
          <g className="toy-drum story-prop" transform="translate(58 452)" stroke="#59625d" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M16 34 Q70 9 124 34 V112 Q70 139 16 112Z" fill="#d6745f" />
            <ellipse cx="70" cy="34" rx="54" ry="24" fill="#f3ead7" />
            <path d="M17 65 Q70 89 123 65 M17 96 Q70 120 123 96" fill="none" stroke="#e6b64f" strokeWidth="8" />
            <path d="M34 54 L52 104 M69 61 L84 112 M104 54 L88 104" fill="none" stroke="#6f9e9e" strokeWidth="7" />
            <path d="M89 7 L145 72 M67 3 L133 77" fill="none" stroke="#c99357" strokeWidth="10" />
            <circle cx="145" cy="72" r="10" fill="#e6b64f" />
            <circle cx="133" cy="77" r="10" fill="#e6b64f" />
          </g>
        )}
        {hasAsset("garden-snail") && (
          <g className="garden-snail story-prop" transform="translate(526 485)" stroke="#59625d" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M12 86 Q24 56 58 60 Q86 60 105 83 Q123 101 151 96 Q145 126 111 128 H30 Q5 124 12 86Z" fill="#eee0bf" />
            <circle cx="91" cy="66" r="48" fill="#9fbc78" />
            <path d="M91 40 Q119 40 119 66 Q119 92 92 92 Q69 92 69 70 Q69 53 86 53 Q101 53 101 67" fill="none" stroke="#65795c" strokeWidth="7" />
            <path d="M28 65 L22 35 M50 62 L53 31" fill="none" />
            <circle cx="21" cy="31" r="6" fill="#e6b64f" />
            <circle cx="54" cy="27" r="6" fill="#e6b64f" />
            <path d="M29 88 Q39 96 49 88" fill="none" />
          </g>
        )}
        {hasAsset("blackbird-snail") && (
          <g className="blackbird-snail story-prop" transform="translate(48 116)" stroke="#59625d" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <ellipse cx="68" cy="62" rx="53" ry="42" fill="#555953" />
            <circle cx="111" cy="55" r="32" fill="#4b504c" />
            <path d="M23 49 L-1 29 L8 64Z" fill="#555953" />
            <path d="M43 47 Q70 23 89 54 Q70 81 43 68Z" fill="#6f746d" />
            <circle cx="118" cy="48" r="5" fill="#eee8d9" stroke="none" />
            <path d="M138 57 L164 68 L138 76Z" fill="#d6b65e" />
            <path d="M56 99 V122 M88 98 V122" fill="none" />
            <path d="M48 122 H65 M80 122 H97" fill="none" />
            <path d="M121 128 Q129 108 148 113 Q164 115 174 131 Q187 145 202 140 Q197 162 174 164 H132 Q113 159 121 128Z" fill="#eee0bf" />
            <circle cx="161" cy="121" r="28" fill="#9fbc78" />
            <path d="M160 105 Q178 105 178 122 Q178 138 161 138 Q147 138 147 124 Q147 114 157 114" fill="none" stroke="#65795c" />
            <path d="M132 115 L128 99 M145 113 L147 96" fill="none" />
          </g>
        )}
        {hasAsset("noise-makers") && (
          <g className="noise-makers story-prop" transform="translate(518 462)" stroke="#59625d" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
            <path d="M12 24 Q61 2 92 38 L126 80 L96 103 L60 61 Q41 83 20 73Z" fill="#6f9e9e" />
            <path d="M94 66 L139 91 L104 121 L78 90Z" fill="#e6b64f" />
            <path d="M20 24 Q47 17 60 31" fill="none" stroke="#eee0bf" strokeWidth="7" />
            <circle cx="45" cy="137" r="31" fill="#d6b65e" />
            <circle cx="114" cy="143" r="31" fill="#e6b64f" />
            <path d="M45 106 V78 M114 112 V84" fill="none" stroke="#c99357" strokeWidth="12" />
            <circle cx="45" cy="137" r="7" fill="#f3ead7" />
            <circle cx="114" cy="143" r="7" fill="#f3ead7" />
          </g>
        )}
        </>}
        {!sceneryOnly && <g className="cat" filter="url(#soft-shadow)">
          <path className="tail" d="M462 515 C600 565 604 410 523 421 C466 429 495 485 545 458" fill="none" stroke="#756b62" strokeWidth="43" strokeLinecap="round" />
          <ellipse className="body" cx="360" cy="500" rx="146" ry="170" fill="url(#fur)" />
          <ellipse cx="360" cy="520" rx="78" ry="111" fill="#d8c7b2" opacity=".95" />
          <ellipse className="paw paw-left" cx="285" cy="594" rx="51" ry="66" fill="#8f8275" />
          <ellipse className="paw paw-right" cx="435" cy="594" rx="51" ry="66" fill="#8f8275" />
          <g className="head">
            <path d="M246 280 L256 115 L346 226Z" fill="#81766c" />
            <path d="M474 280 L464 115 L374 226Z" fill="#81766c" />
            <path d="M270 237 L275 153 L324 225Z" fill="#c18d88" opacity=".85" />
            <path d="M450 237 L445 153 L396 225Z" fill="#c18d88" opacity=".85" />
            <ellipse cx="360" cy="316" rx="160" ry="145" fill="url(#fur)" />
            <path d="M319 190 Q360 226 401 190 L385 274 Q360 291 335 274Z" fill="#504a45" />
            <g className="eyes">
              <ellipse cx="301" cy="306" rx="38" ry="50" fill="#c4d894" />
              <ellipse cx="419" cy="306" rx="38" ry="50" fill="#c4d894" />
              <ellipse cx="306" cy="309" rx="10" ry="32" fill="#171a18" />
              <ellipse cx="414" cy="309" rx="10" ry="32" fill="#171a18" />
              <circle cx="301" cy="295" r="6" fill="white" />
              <circle cx="409" cy="295" r="6" fill="white" />
            </g>
            {glasses === "black" && (
              <g className="glasses black-glasses" fill="rgba(231,240,229,.12)" stroke="#393b38" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round">
                <rect x="249" y="268" width="103" height="81" rx="31" />
                <rect x="368" y="268" width="103" height="81" rx="31" />
                <path d="M352 294 Q360 286 368 294 M249 286 L211 275 M471 286 L509 275" fill="none" />
                <path d="M270 283 Q286 273 304 276 M389 283 Q405 273 423 276" fill="none" stroke="white" strokeWidth="4" opacity=".52" />
              </g>
            )}
            {(glasses === "blue" || hasAsset("goggles")) && (
              <g className="goggles blue-goggles">
                <rect x="263" y="274" width="78" height="60" rx="22" fill="#82c6cc" fillOpacity=".55" stroke="#3a5a5b" strokeWidth="8" />
                <rect x="379" y="274" width="78" height="60" rx="22" fill="#82c6cc" fillOpacity=".55" stroke="#3a5a5b" strokeWidth="8" />
                <path d="M341 296 Q360 286 379 296 M263 293 L220 279 M457 293 L500 279" fill="none" stroke="#3a5a5b" strokeWidth="8" />
              </g>
            )}
            <ellipse cx="319" cy="381" rx="57" ry="42" fill="#dacbb9" />
            <ellipse cx="401" cy="381" rx="57" ry="42" fill="#dacbb9" />
            <path d="M342 356 Q360 344 378 356 L360 375Z" fill="#7b4f55" />
            <path className="smile" d="M360 374 Q337 398 316 385 M360 374 Q383 398 404 385" fill="none" stroke="#49383a" strokeWidth="6" strokeLinecap="round" />
            <g className="mouth-opening">
              <path className="mouth" d="M340 390 Q360 403 380 390 Q378 411 369 417 Q360 422 351 417 Q342 411 340 390Z" fill="#4a3032" />
              <path className="tongue" d="M350 414 Q360 406 370 414 Q368 421 360 422 Q352 421 350 414Z" fill="#c77b7c" />
            </g>
            <path d="M305 373 L211 359 M306 389 L201 397 M415 373 L509 359 M414 389 L519 397" fill="none" stroke="#eee5da" strokeWidth="3" strokeLinecap="round" />
          </g>
          {hasAsset("cheek-bandage") && (
            <g className="cheek-bandage wearable-prop" transform="translate(398 344) rotate(12)" stroke="#765f55" strokeWidth="3">
              <rect width="86" height="32" rx="16" fill="#e7a98d" />
              <rect x="30" y="5" width="26" height="22" rx="5" fill="#f3d0b4" />
              <circle cx="13" cy="16" r="3" fill="#f3d0b4" stroke="none" />
              <circle cx="73" cy="16" r="3" fill="#f3d0b4" stroke="none" />
            </g>
          )}
          {hasAsset("cow-horns") && (
            <g className="cow-horns wearable-prop" fill="none" stroke="#e7d6b7" strokeWidth="22" strokeLinecap="round">
              <path d="M299 215 Q244 170 276 125 Q292 105 310 126" />
              <path d="M421 215 Q476 170 444 125 Q428 105 410 126" />
              <path d="M316 206 Q360 171 404 206" stroke="#b18c62" strokeWidth="32" />
            </g>
          )}
          {hasAsset("bear-paws") && (
            <g className="bear-paws wearable-prop" stroke="#604f46" strokeWidth="5">
              <ellipse cx="279" cy="585" rx="63" ry="72" fill="#8b654d" />
              <ellipse cx="441" cy="585" rx="63" ry="72" fill="#8b654d" />
              <ellipse cx="279" cy="604" rx="27" ry="31" fill="#d5a47f" />
              <ellipse cx="441" cy="604" rx="27" ry="31" fill="#d5a47f" />
              {[251, 275, 299].map((cx) => <circle key={`left-${cx}`} cx={cx} cy="554" r="11" fill="#d5a47f" />)}
              {[413, 437, 461].map((cx) => <circle key={`right-${cx}`} cx={cx} cy="554" r="11" fill="#d5a47f" />)}
            </g>
          )}
          {hasAsset("self-hug") && (
            <g className="self-hug wearable-prop" fill="none" stroke="#8f8275" strokeWidth="38" strokeLinecap="round">
              <path d="M274 510 Q325 554 409 579" />
              <path d="M446 510 Q395 554 311 579" />
              <ellipse cx="414" cy="581" rx="20" ry="28" fill="#8f8275" stroke="#655b52" strokeWidth="4" />
              <ellipse cx="306" cy="581" rx="20" ry="28" fill="#8f8275" stroke="#655b52" strokeWidth="4" />
            </g>
          )}
          {hasAsset("bike-helmet") && (
            <g className="bike-helmet wearable-prop" stroke="#4e615d" strokeWidth="6" strokeLinejoin="round">
              <path d="M246 243 Q249 130 360 117 Q471 130 474 243Z" fill="#6f9f98" />
              <path d="M265 215 Q360 176 455 215" fill="none" stroke="#e7c861" strokeWidth="19" />
              <path d="M261 236 H469" />
              <path d="M271 239 Q262 333 320 349 M449 239 Q458 333 400 349" fill="none" />
            </g>
          )}
          {hasAsset("hard-hat") && (
            <g className="hard-hat wearable-prop" stroke="#715d3f" strokeWidth="6" strokeLinejoin="round">
              <path d="M271 229 Q280 125 360 117 Q440 125 449 229Z" fill="#e3b64e" />
              <path d="M360 120 V220" />
              <rect x="244" y="216" width="232" height="35" rx="17" fill="#efcb69" />
            </g>
          )}
          {hasAsset("work-apron") && (
            <g className="work-apron wearable-prop" stroke="#4f635f" strokeWidth="5" strokeLinejoin="round">
              <path d="M307 426 Q360 397 413 426 L435 618 Q360 652 285 618Z" fill="#6f9d95" />
              <path d="M315 426 Q322 385 360 385 Q398 385 405 426" fill="none" strokeWidth="12" />
              <path d="M319 535 Q360 518 401 535 V588 H319Z" fill="#e7c77d" />
            </g>
          )}
          {hasAsset("toothpaste") && (
            <g className="toothpaste wearable-prop" transform="translate(420 488) rotate(-16)" stroke="#536661" strokeWidth="5" strokeLinejoin="round">
              <path d="M0 0 H70 L91 139 H-21Z" fill="#e9eee8" />
              <path d="M-21 139 H91 V161 H-21Z" fill="#6b9994" />
              <path d="M10 34 H61" stroke="#d67568" strokeWidth="17" />
              <rect x="19" y="-20" width="34" height="25" rx="5" fill="#d9b358" />
            </g>
          )}
          {hasAsset("coin-pouch") && (
            <g className="coin-pouch wearable-prop" stroke="#665646" strokeWidth="5" strokeLinejoin="round">
              <path d="M317 473 Q360 445 403 473 L421 587 Q360 625 299 587Z" fill="#c69a64" />
              <path d="M317 481 Q360 507 403 481" fill="none" strokeWidth="12" />
              <circle cx="360" cy="548" r="31" fill="#dfb653" />
              <path d="M360 527 V569 M343 548 H377" stroke="#f4d98d" strokeWidth="6" strokeLinecap="round" />
            </g>
          )}
          {hasAsset("sun-hat") && (
            <g className="sun-hat wearable-prop">
              <ellipse cx="360" cy="213" rx="140" ry="28" fill="#e6b75b" stroke="#876f45" strokeWidth="5" />
              <path d="M292 210 Q304 106 360 98 Q416 106 428 210Z" fill="#efc76e" stroke="#876f45" strokeWidth="5" />
              <path d="M295 178 Q360 198 425 178" fill="none" stroke="#bb6a58" strokeWidth="18" />
            </g>
          )}
          {/* Pages face Mimi. The audience sees the two covers and a narrow page edge. */}
          <g className="reader-book" data-pages-facing="mimi" stroke="#61547e" strokeWidth="4" strokeLinejoin="round">
            <path d="M246 493 Q303 482 360 515 Q417 482 474 493 L469 507 Q413 499 360 530 Q307 499 251 507Z" fill="#fff2d9" stroke="#d6c3a7" strokeWidth="3" />
            <path className="reader-book-cover" d="M243 502 Q301 491 360 525 L360 619 Q303 588 243 595Z" fill="#9883bd" />
            <path className="reader-book-cover" d="M360 525 Q419 491 477 502 L477 595 Q417 588 360 619Z" fill="#8771ad" />
            <path d="M360 525 V619" fill="none" stroke="#6f5a95" strokeWidth="7" />
            <path d="M257 584 Q307 583 348 606 M372 606 Q415 583 463 584" fill="none" stroke="#b29cce" strokeWidth="3" />
            <path d="M418 537 L423 548 L435 550 L426 558 L428 570 L418 564 L407 570 L410 558 L401 550 L413 548Z" fill="#e8c77c" stroke="none" />
          </g>
          <g className="book-holding-paws" fill={hasAsset("bear-paws") ? "#8b654d" : "#9b8d7e"} stroke="#75695f" strokeWidth="3">
            <ellipse cx="248" cy="550" rx="23" ry="34" transform="rotate(-13 248 550)" />
            <ellipse cx="472" cy="550" rx="23" ry="34" transform="rotate(13 472 550)" />
            <path d="M240 540 L254 544 M238 551 L253 555 M466 544 L480 540 M467 555 L482 551" fill="none" strokeLinecap="round" />
          </g>
        </g>
        }
        {hasAsset("shells") && (
          <g className="shells story-prop">
            <path d="M127 583 Q163 528 199 583Z" fill="#e7a991" stroke="#7d6e63" strokeWidth="4" />
            <path d="M145 576 L151 544 M163 577 V536 M181 576 L174 544" stroke="#a9655e" strokeWidth="4" />
          </g>
        )}
      </svg>
    </div>
  );
}
