/* ===== Gembound Kingdom — original vector art ===== */
(function (root) {
"use strict";
const GEM_COL = [
  ["#ff9aa8", "#e8284a", "#7a0f2a"], // ruby
  ["#a8d4ff", "#2f6fe0", "#14285a"], // sapphire
  ["#a8f5c8", "#25b46e", "#0d5a38"], // emerald
  ["#fff3a0", "#f5b521", "#9a5a08"], // citrine
  ["#e8c8ff", "#9a4fe0", "#4a1a7a"], // amethyst
  ["#ffffff", "#c8d4ea", "#7a86a8"], // moonstone
];
const GLYPH = ["♥", "◆", "■", "★", "⬢", "●"];
// silhouettes (viewBox 0 0 100 100)
const SHAPE = [
  "M50 88 C20 66 8 50 10 33 C12 18 26 10 38 13 C44 15 48 19 50 24 C52 19 56 15 62 13 C74 10 88 18 90 33 C92 50 80 66 50 88Z", // ruby heart
  "M50 8 C62 28 82 44 82 62 C82 80 67 92 50 92 C33 92 18 80 18 62 C18 44 38 28 50 8Z", // sapphire drop
  "M30 12 H70 L88 30 V70 L70 88 H30 L12 70 V30Z", // emerald octagon
  "M50 6 L61 36 L94 37 L68 57 L77 90 L50 71 L23 90 L32 57 L6 37 L39 36Z", // citrine star
  "M50 7 L88 28 V72 L50 93 L12 72 V28Z", // amethyst hexagon
  "M50 10 A40 40 0 1 1 49.9 10Z", // moonstone round
];
const FACET = [
  "M50 30 L30 24 L22 38 L50 74 L78 38 L70 24Z",
  "M50 26 L32 58 L50 80 L68 58Z",
  "M34 26 H66 L74 34 V66 L66 74 H34 L26 66 V34Z",
  "M50 26 L57 44 L74 45 L60 55 L65 73 L50 62 L35 73 L40 55 L26 45 L43 44Z",
  "M50 24 L72 37 V63 L50 76 L28 63 V37Z",
  "M50 26 A24 24 0 1 1 49.9 26Z",
];
function defs() {
  let g = "";
  GEM_COL.forEach((c, i) => {
    g += `<radialGradient id="g${i}" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`;
    g += `<linearGradient id="f${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="${c[1]}" stop-opacity=".2"/><stop offset="1" stop-color="${c[2]}" stop-opacity=".5"/></linearGradient>`;
  });
  g += `<radialGradient id="gOrb" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#ffd8ff"/><stop offset=".6" stop-color="#9a6fff"/><stop offset="1" stop-color="#2a1a6a"/></radialGradient>`;
  g += `<radialGradient id="gCore" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff2a0"/><stop offset=".35" stop-color="#ff8a2a"/><stop offset=".8" stop-color="#c8201a"/><stop offset="1" stop-color="#5a0a0a"/></radialGradient>`;
  g += `<radialGradient id="gStar" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#F4C75E"/><stop offset="1" stop-color="#b8741a"/></radialGradient>`;
  g += `<linearGradient id="gStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8ccd8"/><stop offset="1" stop-color="#6a7088"/></linearGradient>`;
  g += `<linearGradient id="gStone3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe4ff"/><stop offset="1" stop-color="#4a6fa8"/></linearGradient>`;
  g += `<linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8864a"/><stop offset="1" stop-color="#6a3a1a"/></linearGradient>`;
  g += `<linearGradient id="gShadow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5ad8"/><stop offset=".5" stop-color="#3a1a6a"/><stop offset="1" stop-color="#14082a"/></linearGradient>`;
  g += `<linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#F4C75E"/><stop offset="1" stop-color="#a8701a"/></linearGradient>`;
  g += `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".35"/></filter>`;
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${g}</defs></svg>`;
}
function gemBody(i) {
  return `<g filter="url(#soft)"><path d="${SHAPE[i]}" fill="url(#g${i})" stroke="${GEM_COL[i][2]}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${FACET[i]}" fill="url(#f${i})" opacity=".9"/>` +
    `<ellipse cx="36" cy="28" rx="13" ry="7" fill="#fff" opacity=".7" transform="rotate(-25 36 28)"/>` +
    `<circle cx="64" cy="66" r="3" fill="#fff" opacity=".5"/></g>` +
    `<text class="glyph" x="50" y="60" text-anchor="middle" font-size="28" font-weight="900" fill="#fff" stroke="#000" stroke-width="2" paint-order="stroke">${GLYPH[i]}</text>`;
}
function gem(color, sp) {
  let body = "";
  if (color === -2) return relic();
  if (sp === "orb") {
    body = `<g filter="url(#soft)"><circle cx="50" cy="50" r="40" fill="url(#gOrb)" stroke="#2a1a6a" stroke-width="3"/>` +
      `<g class="spin"><path d="M50 14 A36 36 0 0 1 86 50" stroke="#ff6fae" stroke-width="5" fill="none" opacity=".8"/><path d="M86 50 A36 36 0 0 1 50 86" stroke="#ffd24a" stroke-width="5" fill="none" opacity=".8"/><path d="M50 86 A36 36 0 0 1 14 50" stroke="#4adf9a" stroke-width="5" fill="none" opacity=".8"/><path d="M14 50 A36 36 0 0 1 50 14" stroke="#4ab4ff" stroke-width="5" fill="none" opacity=".8"/></g>` +
      `<ellipse cx="38" cy="32" rx="12" ry="7" fill="#fff" opacity=".85" transform="rotate(-30 38 32)"/></g>`;
    return svgWrap(body, "sp-orb");
  }
  if (sp === "star") {
    body = `<g class="spin" filter="url(#soft)"><path d="M50 4 L59 36 L92 30 L66 52 L88 78 L56 68 L50 96 L44 68 L12 78 L34 52 L8 30 L41 36Z" fill="url(#gStar)" stroke="#8a5a10" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="52" r="12" fill="#fffbe0"/></g>`;
    return svgWrap(body, "sp-star");
  }
  if (sp === "core") {
    body = `<g filter="url(#soft)"><circle cx="50" cy="50" r="40" fill="url(#gCore)" stroke="#5a0a0a" stroke-width="3"/>` +
      `<path d="M50 22 C60 40 60 60 50 78 C40 60 40 40 50 22Z" fill="#2a0505" opacity=".85"/><path d="M50 30 C55 42 55 58 50 70 C45 58 45 42 50 30Z" fill="#ffe14a"/>` +
      `<ellipse cx="34" cy="30" rx="10" ry="6" fill="#fff" opacity=".6" transform="rotate(-30 34 30)"/></g>` + glow("#ff7a2a");
    return svgWrap(body, "sp-core");
  }
  const i = color >= 0 ? color : 0;
  body = gemBody(i);
  if (sp === "bh" || sp === "bv") {
    const rot = sp === "bv" ? 'transform="rotate(90 50 50)"' : "";
    body += `<g ${rot}><rect x="8" y="42" width="84" height="16" rx="8" fill="#fff" opacity=".85"/><path d="M4 50 L18 38 V62Z M96 50 L82 38 V62Z" fill="#fff"/><rect x="14" y="47" width="72" height="6" rx="3" fill="${GEM_COL[i][1]}"/></g>`;
    return svgWrap(body, "sp-beam");
  }
  if (sp === "spark") {
    body = `<g class="flap"><ellipse cx="22" cy="34" rx="18" ry="11" fill="#e8f4ff" opacity=".9" transform="rotate(-30 22 34)" stroke="#9ac8ff" stroke-width="2"/><ellipse cx="78" cy="34" rx="18" ry="11" fill="#e8f4ff" opacity=".9" transform="rotate(30 78 34)" stroke="#9ac8ff" stroke-width="2"/></g>` +
      `<g transform="translate(50 54) scale(.72) translate(-50 -50)">${gemBody(i)}</g>` +
      `<path d="M80 72 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z M18 74 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill="#fff"/>`;
    return svgWrap(body, "sp-spark");
  }
  return svgWrap(body, "");
}
function glow(c) { return ""; }
function relic() {
  return svgWrap(`<g filter="url(#soft)"><path d="M34 16 H66 L62 26 C78 34 82 52 74 68 C68 80 60 86 50 86 C40 86 32 80 26 68 C18 52 22 34 38 26Z" fill="url(#gGold)" stroke="#7a4a0a" stroke-width="3"/>` +
    `<path d="M30 46 H70" stroke="#8a5a10" stroke-width="4"/><circle cx="50" cy="60" r="8" fill="#2f6fe0" stroke="#fff" stroke-width="2"/><ellipse cx="40" cy="36" rx="7" ry="4" fill="#fff" opacity=".7"/></g>`, "relic");
}
function svgWrap(body, cls) { return `<svg viewBox="0 0 100 100" class="gsvg ${cls}">${body}</svg>`; }

function obstacle(type, hp, max) {
  switch (type) {
    case "stone": {
      const grad = hp >= 3 ? "gStone3" : "gStone";
      const cracks = (max - hp) > 0 || hp === 1 ? `<path d="M30 20 L42 42 L34 60 M64 30 L56 50 L70 72" stroke="#3a3f50" stroke-width="3" fill="none" opacity="${hp === 1 ? .9 : .4}"/>` : "";
      return svgWrap(`<g filter="url(#soft)"><rect x="6" y="8" width="88" height="84" rx="16" fill="url(#${grad})" stroke="#3a3f50" stroke-width="3"/><rect x="14" y="14" width="72" height="18" rx="9" fill="#fff" opacity=".3"/>${cracks}<text x="50" y="74" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" opacity=".85">${hp > 1 ? hp : ""}</text></g>`, "ob");
    }
    case "vine": return svgWrap(`<g filter="url(#soft)"><circle cx="50" cy="54" r="38" fill="#2f8f4f" stroke="#14502a" stroke-width="3"/><path d="M20 60 C34 30 66 30 80 60" stroke="#7fe08f" stroke-width="5" fill="none"/><path d="M30 40 C20 28 34 20 40 30Z M70 40 C80 28 66 20 60 30Z M50 22 C44 10 56 10 50 22Z M38 70 C26 74 30 86 42 78Z M62 70 C74 74 70 86 58 78Z" fill="#5fd07f" stroke="#14502a" stroke-width="2"/><circle cx="50" cy="56" r="6" fill="#ff8fc8"/></g>`, "ob vine");
    case "chest": return svgWrap(`<g filter="url(#soft)"><rect x="10" y="34" width="80" height="54" rx="8" fill="url(#gWood)" stroke="#3a1a0a" stroke-width="3"/><path d="M10 40 C10 16 90 16 90 40Z" fill="url(#gWood)" stroke="#3a1a0a" stroke-width="3" ${hp < max ? 'transform="rotate(-10 10 40)"' : ""}/><rect x="10" y="44" width="80" height="8" fill="url(#gGold)"/><rect x="42" y="44" width="16" height="22" rx="3" fill="url(#gGold)" stroke="#7a4a0a" stroke-width="2"/><circle cx="50" cy="56" r="3" fill="#3a1a0a"/></g>`, "ob");
    case "shadow": return svgWrap(`<g filter="url(#soft)" class="pulse"><path d="M50 4 L66 34 L58 92 H42 L34 34Z" fill="url(#gShadow)" stroke="#d8b8ff" stroke-width="3"/><path d="M24 40 L36 52 L32 90 H18 L14 56Z M76 40 L86 56 L82 90 H68 L64 52Z" fill="url(#gShadow)" stroke="#d8b8ff" stroke-width="3"/><path d="M50 12 L58 34 L50 80Z" fill="#c8a0ff" opacity=".5"/></g>`, "ob");
    case "cage": return svgWrap(`<g opacity=".92"><rect x="5" y="5" width="90" height="90" rx="14" fill="#bfe8ff" fill-opacity=".18" stroke="#e8f6ff" stroke-width="5"/><path d="M28 6 V94 M50 6 V94 M72 6 V94" stroke="#dff2ff" stroke-width="6"/><path d="M28 6 V94 M50 6 V94 M72 6 V94" stroke="#6ab4e8" stroke-width="2"/><rect x="5" y="44" width="90" height="10" fill="#e8f6ff" opacity=".9"/></g>`, "over");
    case "lock": return svgWrap(`<g><path d="M4 30 L96 70 M4 70 L96 30" stroke="#c8ccd8" stroke-width="9" stroke-dasharray="12 4" opacity="${hp >= 2 ? 1 : 0.0}"/><path d="M4 50 H96" stroke="#c8ccd8" stroke-width="9" stroke-dasharray="12 4"/><rect x="34" y="44" width="32" height="28" rx="6" fill="url(#gGold)" stroke="#7a4a0a" stroke-width="3"/><path d="M40 44 V36 A10 10 0 0 1 60 36 V44" stroke="#7a4a0a" stroke-width="5" fill="none"/><text x="50" y="66" text-anchor="middle" font-size="16" font-weight="900" fill="#5a2a0a">${hp}</text></g>`, "over");
    case "resin": return svgWrap(`<path d="M6 20 C6 8 94 8 94 20 V80 C94 92 80 94 76 84 C72 94 60 96 56 86 C50 96 36 94 34 84 C28 94 6 92 6 80Z" fill="#ffb02a" fill-opacity=".55" stroke="#c8701a" stroke-width="3"/><ellipse cx="30" cy="24" rx="12" ry="5" fill="#fff" opacity=".6"/>`, "over");
  }
  return "";
}
function bossArt(face) { return `<div class="boss-face">${face}</div>`; }

/* ---------- characters ---------- */
const PRINCE = `<svg viewBox="0 0 220 300" class="prince">
<defs>
<linearGradient id="cape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3fb0"/><stop offset="1" stop-color="#1a1f6a"/></linearGradient>
<linearGradient id="coat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4fc8"/><stop offset="1" stop-color="#22267a"/></linearGradient>
<radialGradient id="skin" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#ffe4cc"/><stop offset="1" stop-color="#f0b48a"/></radialGradient>
<linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5a2a"/><stop offset="1" stop-color="#5a2f14"/></linearGradient>
</defs>
<path d="M40 150 C20 220 22 270 30 300 H190 C198 270 200 220 180 150Z" fill="url(#cape)"/>
<path d="M70 160 C60 200 62 260 66 300 H154 C158 260 160 200 150 160 L110 170Z" fill="url(#coat)" stroke="#14185a" stroke-width="2"/>
<path d="M110 170 V300" stroke="#F4C75E" stroke-width="5"/>
<path d="M88 190 H132 M86 220 H134 M86 250 H134" stroke="#F4C75E" stroke-width="3" opacity=".8"/>
<path d="M44 150 C60 132 160 132 176 150 C180 170 150 176 110 172 C70 176 40 170 44 150Z" fill="#f8f4ee" stroke="#d8d0c4" stroke-width="2"/>
<path d="M52 150 c6 -6 12 -6 16 0 M78 146 c6 -6 12 -6 16 0 M126 146 c6 -6 12 -6 16 0 M152 150 c6 -6 12 -6 16 0" stroke="#d8d0c4" stroke-width="2" fill="none"/>
<path d="M98 172 L110 186 L122 172 L110 162Z" fill="#2f6fe0" stroke="#F4C75E" stroke-width="3"/>
<rect x="96" y="122" width="28" height="22" fill="url(#skin)"/>
<ellipse cx="110" cy="92" rx="44" ry="48" fill="url(#skin)"/>
<ellipse cx="66" cy="96" rx="8" ry="12" fill="#f0b48a"/><ellipse cx="154" cy="96" rx="8" ry="12" fill="#f0b48a"/>
<path d="M64 88 C56 40 92 26 116 30 C150 32 168 56 158 92 C150 70 140 62 126 58 C120 70 96 74 80 66 C74 74 70 82 64 88Z" fill="url(#hair)"/>
<path d="M80 66 C92 58 104 46 108 36 C112 50 124 58 140 60" stroke="#c88a4a" stroke-width="3" fill="none" opacity=".6"/>
<g class="blink"><ellipse cx="92" cy="96" rx="7" ry="9" fill="#fff"/><ellipse cx="128" cy="96" rx="7" ry="9" fill="#fff"/><circle cx="93" cy="97" r="5" fill="#3a6fd0"/><circle cx="129" cy="97" r="5" fill="#3a6fd0"/><circle cx="94" cy="98" r="2.4" fill="#0a1430"/><circle cx="130" cy="98" r="2.4" fill="#0a1430"/><circle cx="91" cy="94" r="1.6" fill="#fff"/><circle cx="127" cy="94" r="1.6" fill="#fff"/></g>
<path d="M82 82 Q92 76 100 82 M120 82 Q128 76 138 82" stroke="#5a2f14" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="M110 100 Q107 112 112 114" stroke="#d8906a" stroke-width="2.5" fill="none"/>
<path d="M96 122 Q110 132 126 120" stroke="#a8503a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<ellipse cx="84" cy="114" rx="7" ry="4" fill="#ff9a9a" opacity=".45"/><ellipse cx="138" cy="114" rx="7" ry="4" fill="#ff9a9a" opacity=".45"/>
<g transform="rotate(-14 110 40)"><path d="M78 44 L82 14 L96 30 L110 6 L124 30 L138 14 L142 44Z" fill="url(#gGold)" stroke="#8a5a10" stroke-width="3" stroke-linejoin="round"/><rect x="78" y="40" width="64" height="10" rx="3" fill="url(#gGold)" stroke="#8a5a10" stroke-width="2"/><circle cx="110" cy="45" r="5" fill="#9a4fe0" stroke="#fff" stroke-width="1.5"/><circle cx="90" cy="45" r="3" fill="#2f6fe0"/><circle cx="130" cy="45" r="3" fill="#e8284a"/></g>
<g class="wave"><path d="M168 176 C190 160 196 140 196 124" stroke="url(#coat)" stroke-width="22" stroke-linecap="round" fill="none"/><ellipse cx="198" cy="116" rx="13" ry="11" fill="url(#skin)"/></g>
</svg>`;
const CAT = `<svg viewBox="0 0 160 170" class="cat">
<defs><radialGradient id="fur" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8d8f0"/></radialGradient></defs>
<g class="tail"><path d="M120 140 C156 130 156 90 138 78 C150 98 140 122 112 128Z" fill="url(#fur)" stroke="#b8b8d8" stroke-width="2"/><path d="M146 92 C150 100 148 110 142 116" stroke="#8a86d8" stroke-width="5" fill="none" stroke-linecap="round"/></g>
<ellipse cx="80" cy="132" rx="42" ry="32" fill="url(#fur)" stroke="#b8b8d8" stroke-width="2"/>
<ellipse cx="62" cy="160" rx="12" ry="8" fill="#fff" stroke="#b8b8d8" stroke-width="2"/><ellipse cx="98" cy="160" rx="12" ry="8" fill="#fff" stroke="#b8b8d8" stroke-width="2"/>
<path d="M54 110 Q80 124 106 110" stroke="url(#gGold)" stroke-width="7" fill="none"/><path d="M74 116 L80 128 L86 116 L80 110Z" fill="#2f6fe0" stroke="#F4C75E" stroke-width="2"/>
<g class="head"><path d="M30 40 L28 4 L62 26Z" fill="url(#fur)" stroke="#b8b8d8" stroke-width="2"/><path d="M36 32 L35 14 L52 26Z" fill="#c8a8ff"/>
<path d="M130 40 L132 4 L98 26Z" fill="url(#fur)" stroke="#b8b8d8" stroke-width="2"/><path d="M124 32 L125 14 L108 26Z" fill="#c8a8ff"/>
<ellipse cx="80" cy="62" rx="54" ry="46" fill="url(#fur)" stroke="#b8b8d8" stroke-width="2"/>
<path d="M80 22 L88 32 L80 42 L72 32Z" fill="#2f6fe0" stroke="url(#gGold)" stroke-width="3"/>
<g class="blink"><ellipse cx="58" cy="64" rx="12" ry="14" fill="#2a2f6a"/><ellipse cx="102" cy="64" rx="12" ry="14" fill="#2a2f6a"/><circle cx="58" cy="66" r="8" fill="#5ab4ff"/><circle cx="102" cy="66" r="8" fill="#5ab4ff"/><circle cx="54" cy="59" r="4.5" fill="#fff"/><circle cx="98" cy="59" r="4.5" fill="#fff"/></g>
<path d="M76 80 L84 80 L80 85Z" fill="#ff8fb0"/><path d="M70 90 Q80 100 90 90" stroke="#5a3a5a" stroke-width="2.5" fill="#ff8fb0"/>
<ellipse cx="40" cy="82" rx="8" ry="4" fill="#ffb0c8" opacity=".6"/><ellipse cx="120" cy="82" rx="8" ry="4" fill="#ffb0c8" opacity=".6"/>
<path d="M30 74 H10 M30 80 H12 M130 74 H150 M130 80 H148" stroke="#b8b8d8" stroke-width="1.5"/></g>
</svg>`;

let SCN = 0;
function castleScene(sky) {
  const [a, b, c] = sky; const u = "s" + (++SCN);
  return (`<svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" class="scene">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>
<linearGradient id="cliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbf8f"/><stop offset="1" stop-color="#2f5f6f"/></linearGradient>
<linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff8f0"/><stop offset="1" stop-color="#d8c8e8"/></linearGradient>
<linearGradient id="roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a7fff"/><stop offset="1" stop-color="#3a2f9a"/></linearGradient>
<linearGradient id="fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f8ff"/><stop offset="1" stop-color="#8ad0ff" stop-opacity=".6"/></linearGradient></defs>
<rect width="400" height="700" fill="url(#sky)"/>
<circle cx="300" cy="150" r="90" fill="#fff" opacity=".18"/><circle cx="300" cy="150" r="50" fill="#fff" opacity=".22"/>
<g class="clouds"><ellipse cx="60" cy="120" rx="60" ry="16" fill="#fff" opacity=".55"/><ellipse cx="90" cy="110" rx="34" ry="16" fill="#fff" opacity=".55"/><ellipse cx="330" cy="230" rx="70" ry="14" fill="#fff" opacity=".45"/><ellipse cx="200" cy="70" rx="50" ry="10" fill="#fff" opacity=".4"/></g>
<path d="M0 360 L40 300 L80 330 L130 270 L170 320 L210 280 L260 330 L320 260 L370 310 L400 290 V420 H0Z" fill="#9a8fd8" opacity=".55"/>
<g class="isle"><path d="M30 250 h60 l-12 20 h-36Z" fill="#5f9f7f"/><path d="M42 270 l18 26 l18 -26Z" fill="#7a6f9f"/></g>
<path d="M150 470 C150 400 160 350 190 330 L330 330 C370 350 400 380 400 420 V560 H150Z" fill="url(#cliff)"/>
<g class="falls"><rect x="200" y="380" width="16" height="200" fill="url(#fall)"/><rect x="262" y="370" width="22" height="210" fill="url(#fall)"/><rect x="330" y="390" width="14" height="190" fill="url(#fall)"/></g>
<g transform="translate(170 190)">
 <rect x="20" y="80" width="190" height="80" fill="url(#wall)" stroke="#b8a8d8"/>
 <path d="M20 80 h190 v-10 h-190Z" fill="#e8e0f8"/>
 ${[0,1,2,3,4,5,6,7,8].map(k => `<rect x="${22 + k * 21}" y="62" width="12" height="12" fill="#f0e8ff"/>`).join("")}
 <rect x="90" y="20" width="50" height="140" fill="url(#wall)" stroke="#b8a8d8"/>
 <path d="M84 22 L115 -40 L146 22Z" fill="url(#roof)"/><path d="M115 -40 v-18" stroke="#F4C75E" stroke-width="2"/><path d="M115 -58 l14 5 -14 5Z" fill="#ef826f"/>
 <rect x="30" y="40" width="34" height="120" fill="url(#wall)" stroke="#b8a8d8"/><path d="M25 42 L47 -6 L69 42Z" fill="url(#roof)"/>
 <rect x="166" y="40" width="34" height="120" fill="url(#wall)" stroke="#b8a8d8"/><path d="M161 42 L183 -6 L205 42Z" fill="url(#roof)"/>
 <rect x="0" y="90" width="24" height="70" fill="url(#wall)" stroke="#b8a8d8"/><path d="M-4 92 L12 56 L28 92Z" fill="url(#roof)"/>
 <rect x="204" y="96" width="22" height="64" fill="url(#wall)" stroke="#b8a8d8"/><path d="M200 98 L215 64 L230 98Z" fill="url(#roof)"/>
 <g class="windows">${[[106, 50], [118, 50], [42, 70], [178, 70], [106, 90], [118, 90], [10, 110], [212, 116]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="12" rx="3.5" fill="#ffe8a0"/>`).join("")}</g>
 <path d="M103 160 v-26 a12 12 0 0 1 24 0 v26Z" fill="#8a4fe0"/><path d="M107 160 v-24 a8 8 0 0 1 16 0 v24Z" fill="#c8a0ff" class="gatepulse"/>
</g>
<path d="M0 540 C60 500 120 520 180 540 C260 500 340 520 400 500 V700 H0Z" fill="#3f9f6f"/>
<path d="M0 600 C80 570 160 590 240 600 C300 580 360 590 400 580 V700 H0Z" fill="#2f7f5f"/>
<g class="flowers">${Array.from({ length: 26 }, (_, k) => { const x = (k * 53) % 400, y = 560 + ((k * 37) % 130); const col = ["#ff8fc8", "#ffd24a", "#c8a0ff", "#fff"][k % 4]; return `<g transform="translate(${x} ${y})"><circle r="6" fill="${col}"/><circle r="2.5" fill="#ffe14a"/></g>`; }).join("")}</g>
<g class="blossom"><circle cx="20" cy="40" r="40" fill="#ff9ad0" opacity=".55"/><circle cx="60" cy="10" r="30" fill="#ffb8e0" opacity=".6"/><circle cx="380" cy="30" r="44" fill="#ff9ad0" opacity=".55"/><circle cx="350" cy="0" r="30" fill="#ffc8e8" opacity=".6"/></g>
</svg>`).replace(/id="(sky|cliff|wall|roof|fall)"/g, (m, k) => `id="${u}${k}"`).replace(/url\(#(sky|cliff|wall|roof|fall)\)/g, (m, k) => `url(#${u}${k})`);
}

const ICONS = { coin: "🪙", crystal: "💎", life: "❤️" };
function coinSvg() { return `<svg viewBox="0 0 40 40" class="ico"><circle cx="20" cy="20" r="17" fill="url(#gGold)" stroke="#8a5a10" stroke-width="2.5"/><circle cx="20" cy="20" r="11" fill="none" stroke="#fff5c8" stroke-width="2" opacity=".8"/><path d="M20 12 l2.4 5 5.4.6 -4 3.6 1.2 5.3 -5-2.8 -5 2.8 1.2-5.3 -4-3.6 5.4-.6Z" fill="#fff8d8"/></svg>`; }
function crystalSvg() { return `<svg viewBox="0 0 40 40" class="ico"><path d="M8 15 L14 7 H26 L32 15 L20 35Z" fill="#e05ad8" stroke="#7a1a7a" stroke-width="2.5" stroke-linejoin="round"/><path d="M8 15 H32 M14 7 L20 15 L26 7 M20 15 V35" stroke="#ffc8f8" stroke-width="1.5" fill="none"/></svg>`; }
function heartSvg() { return `<svg viewBox="0 0 40 40" class="ico"><path d="M20 35 C8 26 3 19 4 12 C5 6 11 3 15 4 C17 5 19 6 20 9 C21 6 23 5 25 4 C29 3 35 6 36 12 C37 19 32 26 20 35Z" fill="#ff3a5a" stroke="#8a0a2a" stroke-width="2.5"/><ellipse cx="13" cy="12" rx="4" ry="2.5" fill="#fff" opacity=".7"/></svg>`; }
function starSvg(on) { return `<svg viewBox="0 0 40 40" class="ico star ${on ? "on" : "off"}"><path d="M20 3 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1Z" fill="${on ? "url(#gGold)" : "#5a5f8a"}" stroke="${on ? "#8a5a10" : "#3a3f6a"}" stroke-width="2.5" stroke-linejoin="round"/></svg>`; }


/* ---------- painted sprites (img/*.webp) ---------- */
const pic = (n, cls = "") => `<img class="gsvg gpic ${cls}" src="img/${n}.webp" alt="" draggable="false">`;
const SPN = { bh: "sp_bh", bv: "sp_bv", core: "sp_core", orb: "sp_orb", spark: "sp_spark", star: "sp_star" };
function gemP(color, sp) {
  if (color === -2) return pic("relic", "relic");
  if (sp) return pic(SPN[sp] || "sp_star", "sp-" + sp) + (color >= 0 && sp !== "orb" && sp !== "star" ? `<span class="spc" style="background:${GEM_COL[color][1]}"></span>` : "");
  return pic("gem" + color) + `<span class="glyph">${GLYPH[color]}</span>`;
}
function obstacleP(type, hp, max) {
  const badge = n => `<span class="obhp">${n}</span>`;
  switch (type) {
    case "stone": return pic(hp === 1 && max > 1 ? "ob_stone2" : "ob_stone", hp >= 3 ? "tint3" : "") + (hp > 1 ? badge(hp) : "");
    case "chest": return pic(hp < max ? "ob_chest2" : "ob_chest");
    case "lock": return pic("ob_lock", "ovl") + (hp > 1 ? badge(hp) : "");
    case "cage": return pic("ob_cage", "ovl");
    case "resin": return pic("ob_resin", "ovl");
    case "vine": return pic("ob_vine");
    case "shadow": return pic("ob_shadow", "pulse");
    case "ice": return pic("ob_ice");
    case "portal": return pic("ob_portal");
  }
  return "";
}
const CHEST_PIC = { wooden: "ch_wooden", silver: "ch_silver", golden: "ch_golden", crystal: "ch_crystal", legendary: "ch_legendary", open: "ch_open" };
const BOOST_PIC = { hammer: "bo_hammer", saber: "bo_saber", bomb: "bo_bomb", prism: "bo_prism", shuffle: "bo_shuffle", moves5: "bo_moves5", pre_beam: "sp_bh", pre_core: "sp_core", pre_orb: "sp_orb" };
const chestPic = (t, cls = "") => pic(CHEST_PIC[t] || "ch_golden", cls);
const boostPic = (id, cls = "") => pic(BOOST_PIC[id] || "bo_hammer", cls);
const portrait = (who, mood, cls = "") => pic(who === "lumi" ? (mood === "surprised" ? "cat_surprised" : "cat_happy") : ({ worried: "pr_worried", cheer: "pr_cheer" }[mood] || "pr_happy"), cls);
const heartPic = () => pic("heart", "ico");
const ALL_PICS = ["gem0","gem1","gem2","gem3","gem4","gem5","sp_bh","sp_bv","sp_core","sp_orb","sp_spark","sp_star","ob_stone","ob_stone2","ob_cage","ob_lock","ob_resin","ob_ice","ob_vine","ob_chest","ob_chest2","ob_shadow","ob_portal","relic","pr_happy","pr_worried","pr_cheer","cat_happy","cat_surprised","heart"];
function preload() { ALL_PICS.forEach(n => { const i = new Image(); i.src = `img/${n}.webp`; }); }

root.GKArt = { defs, gem: gemP, obstacle: obstacleP, relic: () => pic("relic", "relic"), svgGem: gem, pic, chestPic, boostPic, portrait, heartPic, preload, PRINCE, CAT, castleScene, GEM_COL, coinSvg, crystalSvg, heartSvg, starSvg, bossArt };
})(typeof window !== "undefined" ? window : globalThis);
