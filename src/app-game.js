/* ===== Gembound Kingdom — gameplay screen ===== */
let G = null, GL = null, busy = false, sel = null, boosterMode = null, tileEls = new Map(), obEls = new Map(), TS = 44;
let hintTimer = null, runStart = null, forced = null, kbd = [0, 0], runPre = null, survivalTurns = 0, levelStartAt = 0, idleTO = null;
const BOOST_BAR = ["hammer", "saber", "bomb", "prism", "shuffle"];

function beginLevel(L, pre) {
  lifeTick();
  if (!L.mode && S.lives <= 0 && !unlimited()) { showLives(); return; }
  for (const p of pre) { S.boosters[p]--; logBooster(p, -1, "Used on level " + L.id); }
  L.startSpecials = pre.map(p => ({ pre_beam: "beam", pre_core: "core", pre_orb: "orb" }[p]));
  GL = L; runPre = pre;
  G = new E.Game(L);
  runStart = JSON.parse(JSON.stringify(G.stats));
  busy = false; sel = null; boosterMode = null; forced = null; survivalTurns = 0; levelStartAt = Date.now();
  try { localStorage.setItem("gk_inlevel", JSON.stringify({ id: L.id, mode: L.mode || null, at: Date.now() })); } catch (e) {}
  track("level_start");
  buildGame();
  show("game");
  layout();
  render(true);
  save();
  setTimeout(async () => {
    const title = L.mode ? D.MODES.find(m => m.id === L.mode).name : L.boss ? "Boss battle!" : t("Level") + " " + L.id;
    banner(title);
    if (L.boss) { SND.play("boss"); say(`${L.boss.name} appears! Clear gems to damage it!`); }
    await sleep(animMs(900));
    await obstacleIntro();
    if (L.tutorial && !S.flags.tut[L.id]) tutorial(L.tutorial);
    else if (L.id === 5 && !S.flags.tut.booster) boosterTutorial();
    armHint();
  }, 60);
}
function buildGame() {
  const R = D.REGIONS[GL.region || 0];
  const el = $("#scr-game");
  el.innerHTML = `<div class="gbg" style="background:linear-gradient(180deg,${R.sky[2]},${R.sky[1]} 55%,${R.ground})"></div>
  <div class="gwrap">
    <div class="gtop">
      <button class="gbox gpause" id="gPause" aria-label="Pause">⏸</button>
      <div class="gbox gmoves" id="gMoves" aria-live="polite"><b>0</b><small data-i18n="Moves">${t("Moves")}</small></div>
      <div class="gbox gobj" id="gObj" aria-label="${t("Objectives")}"></div>
    </div>
    <div class="gscore"><span id="gScore">0</span><div class="bar"><i id="gScoreBar"></i></div><span id="gLvl">${GL.mode ? D.MODES.find(m => m.id === GL.mode).icon : "Lv " + GL.id}</span></div>
    ${GL.boss ? `<div class="bossbar" id="gBoss">${A.bossArt(GL.boss.face)}<div class="grow"><b style="font-size:13px">${esc(GL.boss.name)}</b><div class="bar"><i></i><span></span></div></div></div>` : ""}
    <div class="boardwrap" id="gWrap"><div class="board" id="gBoard" role="grid" aria-label="Game board" tabindex="0"><div class="cells"></div><div class="tiles"></div><div class="fx"></div><div class="cursor"></div></div></div>
    <div class="gboost" id="gBoost">${BOOST_BAR.map(id => `<button data-bo="${id}" aria-label="${D.BOOSTERS[id].name}">${D.BOOSTERS[id].icon}<span class="q"></span></button>`).join("")}</div>
  </div>
  <div class="bubble" id="gBubble">${A.CAT}<div class="say"></div></div>`;
  tileEls = new Map(); obEls = new Map();
  $("#gPause").onclick = () => { SND.play("click"); pauseMenu(); };
  $$("[data-bo]").forEach(b => b.onclick = () => useBooster(b.dataset.bo));
  const board = $("#gBoard");
  board.addEventListener("pointerdown", onDown);
  board.addEventListener("pointermove", onMove);
  board.addEventListener("pointerup", onUp);
  board.addEventListener("pointercancel", () => (drag = null));
  board.addEventListener("keydown", onKey);
  applySettings();
}
function layout() {
  const wrap = $("#gWrap"); if (!wrap || !G) return;
  const w = wrap.clientWidth, h = wrap.clientHeight;
  TS = Math.floor(Math.min(w / G.w, h / G.h, 76));
  const b = $("#gBoard"); b.style.width = TS * G.w + "px"; b.style.height = TS * G.h + "px";
  document.documentElement.style.setProperty("--ts", TS + "px");
  const cells = $(".cells", b); cells.innerHTML = "";
  G.each((x, r, c) => { if (x.hole) return; const d = document.createElement("div"); d.className = "cell" + ((r + c) % 2 ? " alt" : ""); d.style.transform = `translate(${c * TS}px,${r * TS}px)`; d.dataset.rc = r + "," + c;
    // rounded outer corners
    const hole = (rr, cc) => { const y = G.cell(rr, cc); return !y || y.hole; };
    const rad = 10; d.style.borderRadius = `${hole(r - 1, c) && hole(r, c - 1) ? rad : 0}px ${hole(r - 1, c) && hole(r, c + 1) ? rad : 0}px ${hole(r + 1, c) && hole(r, c + 1) ? rad : 0}px ${hole(r + 1, c) && hole(r, c - 1) ? rad : 0}px`;
    cells.appendChild(d); });
  tileEls.forEach(el => el.style.setProperty("--mv", "0ms"));
  render(true);
}
window.addEventListener("resize", () => { if (CUR === "game") layout(); });
const pos = (r, c) => `translate(${c * TS}px,${r * TS}px)`;

function render(instant) {
  if (!G) return;
  const tl = $("#gBoard .tiles"); if (!tl) return;
  const seen = new Set();
  const mv = instant ? "0ms" : animMs(90) + "ms";
  // floor layers
  $$(".cell", $("#gBoard")).forEach(d => {
    const [r, c] = d.dataset.rc.split(",").map(Number); const f = G.cells[r][c].floor;
    d.classList.toggle("ice", !!f && f.type === "ice"); d.classList.toggle("ice2", !!f && f.type === "ice" && f.hp >= 2); d.classList.toggle("portal", !!f && f.type === "portal");
  });
  G.each((x, r, c) => {
    if (x.hole) return;
    for (const L of ["block", "over"]) {
      const k = L[0] + r + "," + c, o = x[L];
      let el = obEls.get(k);
      if (o) {
        const sig = o.type + o.hp;
        if (!el) { el = document.createElement("div"); el.className = "t " + (L === "block" ? "ob" : "ov"); el.style.transform = pos(r, c); tl.appendChild(el); obEls.set(k, el); }
        if (el.dataset.sig !== sig) { if (el.dataset.sig) { el.classList.remove("crk"); void el.offsetWidth; el.classList.add("crk"); } el.dataset.sig = sig; el.innerHTML = A.obstacle(o.type, o.hp, o.max); el.setAttribute("aria-label", E.OBST[o.type].label); }
      } else if (el) { el.classList.add("pop"); obEls.delete(k); setTimeout(() => el.remove(), 260); }
    }
    const tt = x.tile; if (!tt) return;
    seen.add(tt.id);
    let el = tileEls.get(tt.id);
    if (!el) {
      el = document.createElement("div"); el.className = "t idle"; el.dataset.id = tt.id;
      el.style.setProperty("--mv", "0ms");
      // spawn above the board
      let start = r - 1; el.style.transform = pos(tt.spawn ? start : r, c);
      tl.appendChild(el); tileEls.set(tt.id, el);
      el.style.animationDelay = ((r * 7 + c * 3) % 40) / 10 + "s";
      void el.offsetWidth;
      tt.spawn = false;
    }
    const sig = tt.color + ":" + (tt.sp || "");
    if (el.dataset.sig !== sig) {
      const wasNew = !!el.dataset.sig;
      el.dataset.sig = sig; el.dataset.c = tt.color; el.innerHTML = A.gem(tt.color, tt.sp);
      if (wasNew) { el.classList.remove("new"); void el.offsetWidth; el.classList.add("new"); }
      el.setAttribute("aria-label", (tt.color === E.RELIC ? "Relic" : tt.sp ? spName(tt.sp) : E.GEMS[tt.color]) + `, row ${r + 1}, column ${c + 1}`);
    }
    el.style.setProperty("--mv", mv);
    el.style.transform = pos(r, c);
    el.dataset.r = r; el.dataset.c2 = c;
  });
  tileEls.forEach((el, id) => { if (!seen.has(id)) { el.classList.add("pop"); tileEls.delete(id); setTimeout(() => el.remove(), animMs(240)); } });
  hud();
}
function spName(sp) { return { bh: "Crystal Beam (row)", bv: "Crystal Beam (column)", core: "Dragon Core", orb: "Mystic Orb", spark: "Fairy Spark", star: "Celestial Star" }[sp] || sp; }
let lastObj = {};
function hud() {
  if (!G) return;
  const mv = $("#gMoves b"); mv.textContent = GL.survival ? "∞" : Math.max(0, G.moves);
  $("#gMoves").classList.toggle("low", !GL.survival && G.moves <= 5 && G.state === "play");
  const objEl = $("#gObj");
  if (GL.endless) objEl.innerHTML = `<div style="text-align:center"><b style="font-size:22px">${fmt(G.score)}</b><br><small>${GL.survival ? `Shadows ${G.countOnBoard("shadow")}/12 · turn ${survivalTurns}` : "Best " + fmt((S.modes.best[GL.mode] || [0])[0])}</small></div>`;
  else {
    objEl.innerHTML = G.objectives.map(o => objIcon(o, GL, G.objRemaining(o))).join("");
    G.objectives.forEach(o => { const k = o.t + (o.c != null ? o.c : ""); const v = G.objRemaining(o); if (lastObj[k] != null && v < lastObj[k]) { const e = $(`[data-obj="${k}"]`, objEl); e && e.classList.add("bump"); } lastObj[k] = v; });
  }
  $("#gScore").textContent = fmt(G.score);
  const target = GL.endless ? Math.max(5000, ((S.modes.best[GL.mode] || [])[0] || 5000)) : 2500 + GL.moves * 400;
  $("#gScoreBar").style.width = Math.min(100, G.score / target * 100) + "%";
  if (G.boss) { const bb = $("#gBoss"); $(".bar i", bb).style.width = (G.boss.hp / G.boss.max * 100) + "%"; $(".bar span", bb).textContent = `${G.boss.hp} / ${G.boss.max}`; }
  $$("[data-bo]").forEach(b => { const n = S.boosters[b.dataset.bo] || 0; const q = $(".q", b); q.textContent = n || "+"; q.classList.toggle("buy", !n); b.classList.toggle("on", boosterMode === b.dataset.bo); });
}

/* ---------------- input ---------------- */
let drag = null;
function cellAt(e) { const r = $("#gBoard").getBoundingClientRect(); return [Math.floor((e.clientY - r.top) / TS), Math.floor((e.clientX - r.left) / TS)]; }
function onDown(e) { SND.unlock(); if (busy || !G || G.state !== "play") return; drag = { start: cellAt(e), x: e.clientX, y: e.clientY, moved: false }; $("#gBoard").setPointerCapture(e.pointerId); $("#app").classList.remove("kbd"); }
function onMove(e) {
  if (!drag || drag.moved || boosterMode) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < TS * 0.35) return;
  drag.moved = true;
  const [r, c] = drag.start; const dir = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
  clearSel(); attemptSwap([r, c], [r + dir[0], c + dir[1]]);
}
function onUp(e) { if (!drag) return; const d = drag; drag = null; if (d.moved) return; tapCell(...d.start); }
function onKey(e) {
  if (!G || busy) return;
  const k = e.key; const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k];
  $("#app").classList.add("kbd");
  if (mv) { e.preventDefault(); kbd = [Math.max(0, Math.min(G.h - 1, kbd[0] + mv[0])), Math.max(0, Math.min(G.w - 1, kbd[1] + mv[1]))]; const cur = $("#gBoard .cursor"); cur.style.transform = pos(...kbd); const tt = G.tile(...kbd); srSay(tt ? (tt.sp ? spName(tt.sp) : tt.color === E.RELIC ? "Relic" : E.GEMS[tt.color]) : "empty"); }
  if (k === "Enter" || k === " ") { e.preventDefault(); tapCell(...kbd); }
}
function clearSel() { if (sel) { const el = tileElAt(...sel); el && el.classList.remove("sel"); } sel = null; }
function tileElAt(r, c) { const tt = G.tile(r, c); return tt ? tileEls.get(tt.id) : null; }
function tapCell(r, c) {
  if (!G.cell(r, c) || G.cells[r][c].hole) return;
  if (boosterMode) { applyBooster(boosterMode, r, c); return; }
  const tt = G.tile(r, c);
  if (sel) {
    const [sr, sc] = sel;
    if (sr === r && sc === c) { if (tt && tt.sp && !forced) { clearSel(); fireSpecial(r, c); } else clearSel(); return; }
    if (Math.abs(sr - r) + Math.abs(sc - c) === 1) { const a = sel; clearSel(); attemptSwap(a, [r, c]); return; }
  }
  clearSel();
  if (!G.movable(r, c)) { if (G.cells[r][c].over || G.cells[r][c].block) { const el = obEls.get((G.cells[r][c].over ? "o" : "b") + r + "," + c); if (el) { el.classList.remove("crk"); void el.offsetWidth; el.classList.add("crk"); } } return; }
  if (tt.sp && S.settings.autoPower && !forced) { fireSpecial(r, c); return; }
  sel = [r, c]; const el = tileElAt(r, c); el && el.classList.add("sel"); SND.play("select"); vibe(6, "haptic");
}
async function fireSpecial(r, c) {
  if (busy || G.state !== "play") return;
  if (!G.tapSpecial(r, c)) return;
  busy = true; disarmHint();
  await resolveAll(); await endTurn();
}
async function attemptSwap(a, b) {
  if (busy || !G || G.state !== "play") return;
  if (!G.cell(b[0], b[1]) || G.cells[b[0]][b[1]].hole) return;
  if (forced) { const ok = (eq(a, forced.a) && eq(b, forced.b)) || (eq(a, forced.b) && eq(b, forced.a)); if (!ok) { SND.play("invalid"); vibe(20, "haptic"); return; } endTutorialStep(); }
  busy = true; disarmHint();
  const ea = tileElAt(...a), eb = tileElAt(...b);
  const res = G.trySwap(a, b);
  if (!res.ok) {
    if (res.invalid && ea && eb) {
      SND.play("invalid"); vibe(25, "haptic");
      ea.style.setProperty("--mv", animMs(120) + "ms"); eb.style.setProperty("--mv", animMs(120) + "ms");
      ea.style.transform = pos(...b); eb.style.transform = pos(...a); await sleep(animMs(140));
      ea.style.transform = pos(...a); eb.style.transform = pos(...b); await sleep(animMs(140));
    } else if (res.blocked) { SND.play("invalid"); }
    busy = false; armHint(); return;
  }
  SND.play("swap"); vibe(8, "haptic");
  if (res.combo) { const sa = tileEls.get(ea && +ea.dataset.id); if (ea) { ea.style.setProperty("--mv", animMs(140) + "ms"); ea.style.transform = pos(...b); } await sleep(animMs(150)); }
  else { render(); await sleep(animMs(140)); }
  await resolveAll();
  await endTurn();
}
const eq = (p, q) => p[0] === q[0] && p[1] === q[1];

/* ---------------- resolution ---------------- */
async function resolveAll() {
  playFx(); render();
  let guard = 0;
  while (guard++ < 120) {
    if (G.queue.length) {
      while (G.runWave()) { playFx(); render(); await sleep(animMs(240)); }
    } else if (G.resolveMatches()) {
      playFx(); render(); await sleep(animMs(200));
      while (G.runWave()) { playFx(); render(); await sleep(animMs(240)); }
    } else break;
    await settle();
  }
  // collect any relics/fill after last action
  await settle();
}
async function settle() {
  for (let k = 0; k < 60; k++) {
    let moved = false;
    while (G.gravityStep()) { moved = true; render(); await sleep(animMs(80)); }
    if (G.collectRelics()) { playFx(); render(); await sleep(animMs(220)); continue; }
    break;
  }
}
async function endTurn() {
  if (GL.survival) {
    survivalTurns++;
    if (survivalTurns % 3 === 0) { const sp = []; G.each((x, r, c) => { if (!x.hole && !x.block && !x.over && x.tile && x.tile.color >= 0 && !x.tile.sp) sp.push([r, c]); }); const n = 1 + Math.floor(survivalTurns / 15); for (let i = 0; i < n && sp.length; i++) { const [r, c] = sp.splice(Math.floor(Math.random() * sp.length), 1)[0]; G.cells[r][c].tile = null; G.cells[r][c].block = { type: "shadow", hp: 1, max: 1 }; } SND.play("boss"); }
    G.moves = 999;
  }
  if (GL.endless && GL.mode === "endless") { const bonus = Math.floor(G.score / 2500) - (G._eb || 0); if (bonus > 0) { G._eb = (G._eb || 0) + bonus; G.moves += 3 * bonus; toast(`➕ ${3 * bonus} moves!`); } }
  const st = G.endTurn();
  playFx(); render();
  if (st === "shuffled") { toast("🔀 No moves left — shuffling!"); SND.play("shuffle"); await sleep(animMs(400)); render(); }
  // a vine/boss/shuffle might create situations needing settle
  if (G.findMatches().length) { await resolveAll(); }
  busy = false;
  if (GL.survival && G.countOnBoard("shadow") >= 12) { G.state = "lost"; }
  if (GL.endless && G.moves <= 0) G.state = "lost";
  if (G.state === "won") { await victory(); return; }
  if (G.state === "lost") { await outOfMoves(); return; }
  reactions();
  armHint();
}
let lastSay = 0;
function reactions() {
  const c = G.stats.maxCascade;
  if (G.cascade >= 4 && Date.now() - lastSay > 4000) { say(["Wonderful!", "Amazing chain!", "Purrfect!", "Spectacular!"][Math.floor(Math.random() * 4)]); }
  else if (!GL.endless && G.moves === 3 && Date.now() - lastSay > 4000) say("Only 3 moves left — aim for the objectives!");
}
function say(txt) {
  const b = $("#gBubble"); if (!b) return;
  $(".say", b).textContent = txt; b.classList.add("on"); lastSay = Date.now();
  SND.play("voice", 1); srSay(txt);
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("on"), 2600);
}
function banner(txt) { const b = document.createElement("div"); b.className = "banner"; b.textContent = txt; $("#scr-game").appendChild(b); setTimeout(() => b.remove(), animMs(1500)); }

/* ---------------- effects ---------------- */
function cx(c) { return c * TS + TS / 2; } function cy(r) { return r * TS + TS / 2; }
function playFx() {
  const fx = $("#gBoard .fx"); if (!fx || !G) { G && (G.fx = []); return; }
  const parts = S.settings.particles && !S.settings.reducedFx && !S.settings.reducedMotion;
  let matched = 0, colors = new Set();
  for (const f of G.fx) {
    switch (f.type) {
      case "pop": if (!f.quiet && parts && f.color >= 0 && Math.random() < 0.7) particles(cx(f.c), cy(f.r), A.GEM_COL[f.color][1], 4); matched++; if (f.color >= 0) colors.add(f.color); break;
      case "match": SND.play("match", G.cascade); if (f.size >= 4) vibe(15, "haptic"); if (S.settings.sr) srSay(`Matched ${f.size} ${E.GEMS[f.color] || ""}`); pts(f.cells, 60 * f.size); break;
      case "create": SND.play("create"); if (G.stats.specialsMade && f.sp === "star") say("A Celestial Star! Swap it with anything!"); break;
      case "beam": { SND.play("beam"); const d = document.createElement("div"); const w = f.wide || 1; d.className = "beam" + (f.dir === "v" ? " v" : ""); if (f.dir === "h") Object.assign(d.style, { left: 0, width: G.w * TS + "px", top: (f.r - (w - 1) / 2) * TS + TS * 0.2 + "px", height: TS * (w - 0.4) + "px" }); else Object.assign(d.style, { top: 0, height: G.h * TS + "px", left: (f.c - (w - 1) / 2) * TS + TS * 0.2 + "px", width: TS * (w - 0.4) + "px" }); fx.appendChild(d); setTimeout(() => d.remove(), 500); shake(1); break; }
      case "boom": { SND.play("boom"); vibe(40); const d = document.createElement("div"); d.className = "ring"; const s = TS * (f.rad * 2 + 1); Object.assign(d.style, { left: cx(f.c) - s / 2 + "px", top: cy(f.r) - s / 2 + "px", width: s + "px", height: s + "px" }); fx.appendChild(d); setTimeout(() => d.remove(), 600); if (parts) particles(cx(f.c), cy(f.r), "#ff8a2a", 14, TS * f.rad); shake(f.rad); break; }
      case "orb": { SND.play("orb"); for (const [r, c] of f.cells.slice(0, 30)) { const d = document.createElement("div"); d.className = "bolt"; const x0 = cx(f.c), y0 = cy(f.r), x1 = cx(c), y1 = cy(r); Object.assign(d.style, { left: x0 + "px", top: y0 + "px", width: Math.hypot(x1 - x0, y1 - y0) + "px", transform: `rotate(${Math.atan2(y1 - y0, x1 - x0)}rad)` }); fx.appendChild(d); setTimeout(() => d.remove(), 500); } break; }
      case "spark": { SND.play("spark"); const d = document.createElement("div"); d.className = "fly"; d.textContent = "🧚"; d.style.transform = `translate(${cx(f.c) - 14}px,${cy(f.r) - 18}px)`; fx.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => (d.style.transform = `translate(${cx(f.tc) - 14}px,${cy(f.tr) - 18}px)`))); setTimeout(() => d.remove(), 600); break; }
      case "star": case "nova": { SND.play("orb"); SND.play("boom"); vibe([30, 40, 60]); const d = document.createElement("div"); d.className = "flash"; fx.appendChild(d); setTimeout(() => d.remove(), 700); shake(3); break; }
      case "combo": { banner({ cross: "Cross Blast!", cross3: "Mega Cross!", bigcore: "Dragon Fury!", nova: "Celestial Nova!", convert: "Orb Fusion!", spark: "Spark Strike!", triplespark: "Fairy Swarm!" }[f.name] || "Combo!"); vibe(50); break; }
      case "crack": SND.play("crack"); break;
      case "break": SND.play("break"); if (parts) particles(cx(f.c), cy(f.r), "#c8ccd8", 6); break;
      case "coins": SND.play("coin"); break;
      case "relic": SND.play("relic"); say("A relic rescued! ✨"); break;
      case "grow": say("The vines are spreading — hit them!"); break;
      case "bossCast": SND.play("boss"); shake(2); say(`${GL.boss.name} summons shields!`); $("#gBoss") && $("#gBoss").classList.add("hit"); setTimeout(() => $("#gBoss") && $("#gBoss").classList.remove("hit"), 400); break;
      case "shuffle": break;
    }
  }
  if (G.boss && matched) { const bb = $("#gBoss"); if (bb) { bb.classList.remove("hit"); void bb.offsetWidth; bb.classList.add("hit"); } }
  G.fx = [];
}
function pts(cells, n) {
  if (!cells.length) return; const fx = $("#gBoard .fx"); const [r, c] = cells[Math.floor(cells.length / 2)];
  const d = document.createElement("div"); d.className = "pts"; d.textContent = "+" + Math.round(n * (1 + Math.min(G.cascade - 1, 8) * 0.5)); d.style.left = cx(c) - 16 + "px"; d.style.top = cy(r) - 12 + "px"; fx.appendChild(d); setTimeout(() => d.remove(), 900);
}
function particles(x, y, col, n, spread) {
  const fx = $("#gBoard .fx");
  for (let i = 0; i < n; i++) { const p = document.createElement("i"); p.className = "part"; const a = Math.random() * 6.28, d = (spread || TS * 0.8) * (0.5 + Math.random() * 0.7); Object.assign(p.style, { left: x - 5 + "px", top: y - 5 + "px", background: col }); p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d + "px"); fx.appendChild(p); setTimeout(() => p.remove(), 650); }
}
function shake(n) { if (!S.settings.shake || S.settings.reducedMotion) return; const b = $("#gWrap"); b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); }

/* ---------------- hints ---------------- */
function armHint() { disarmHint(); if (!S.settings.hints || !G || G.state !== "play" || forced) return; hintTimer = setTimeout(() => { if (busy || !G) return; const h = G.hint(); if (!h) return; [h.a, h.b].forEach(p => { const el = tileElAt(...p); el && el.classList.add("hint"); }); }, 6000); }
function disarmHint() { clearTimeout(hintTimer); $$(".t.hint").forEach(e => e.classList.remove("hint")); }

/* ---------------- boosters ---------------- */
async function useBooster(id) {
  if (busy || !G || G.state !== "play" || forced) return;
  SND.play("click");
  if (!(S.boosters[id] > 0)) {
    if (await spend("coins", D.BOOSTERS[id].price, `Buy 1 ${D.BOOSTERS[id].name}`)) { S.boosters[id] = (S.boosters[id] || 0) + 1; logBooster(id, 1, "Bought in level"); save(); hud(); }
    return;
  }
  if (id === "shuffle") {
    if (S.settings.confirmSpend && S.boosters[id] === 1 && !(await confirmBox("Use Royal Shuffle?", "This is your last one.", "Use"))) return;
    consumeBooster(id); busy = true; G.fx = []; G.shuffle(); SND.play("shuffle"); tileEls.forEach(el => el.style.setProperty("--mv", animMs(300) + "ms")); render(); await sleep(animMs(350)); busy = false; armHint(); return;
  }
  boosterMode = boosterMode === id ? null : id; hud();
  if (boosterMode) toast(`${D.BOOSTERS[id].icon} ${D.BOOSTERS[id].desc} Tap the board.`);
}
function consumeBooster(id) { S.boosters[id]--; logBooster(id, -1, GL.mode ? "Used in " + GL.mode : "Used on level " + GL.id); save(); hud(); }
async function applyBooster(id, r, c) {
  if (busy) return;
  if (S.settings.confirmSpend && S.boosters[id] === 1 && !(await confirmBox("Use " + D.BOOSTERS[id].name + "?", "This is your last one.", "Use"))) { boosterMode = null; hud(); return; }
  boosterMode = null; consumeBooster(id); busy = true; disarmHint();
  ({ hammer: () => G.boosterHammer(r, c), saber: () => G.boosterLine(r, c), bomb: () => G.boosterArea(r, c), prism: () => G.boosterColor(r, c) })[id]();
  SND.play(id === "hammer" ? "break" : id === "prism" ? "orb" : "boom");
  await resolveAll();
  G.vineHit = true; // boosters don't make vines grow
  const st = G.endTurn(); playFx(); render();
  busy = false;
  if (st === "won") return victory();
  armHint();
}

/* ---------------- tutorial ---------------- */
let tutEl = null;
function tutorial(T) {
  forced = T.forced;
  const [type, msg, after] = T.tip;
  tutEl = document.createElement("div"); tutEl.className = "tut";
  const b = $("#gBoard").getBoundingClientRect(), sr = $("#scr-game").getBoundingClientRect();
  const r0 = Math.min(forced.a[0], forced.b[0]), c0 = Math.min(forced.a[1], forced.b[1]), r1 = Math.max(forced.a[0], forced.b[0]), c1 = Math.max(forced.a[1], forced.b[1]);
  const left = b.left - sr.left + c0 * TS - 4, top = b.top - sr.top + r0 * TS - 4;
  tutEl.innerHTML = `<div class="hole" style="left:${left}px;top:${top}px;width:${(c1 - c0 + 1) * TS + 8}px;height:${(r1 - r0 + 1) * TS + 8}px"></div>
    <div class="hand" style="left:${left + TS / 2}px;top:${top + TS / 2}px;--hx:${(forced.b[1] - forced.a[1]) * TS}px;--hy:${(forced.b[0] - forced.a[0]) * TS}px">👆</div>
    <div class="msg">${A.CAT}<div class="say">${esc(msg)}</div></div><button class="btn sm ghost skip">Skip tutorial</button>`;
  $("#scr-game").appendChild(tutEl);
  SND.play("voice", 1);
  $(".skip", tutEl).onclick = () => { S.flags.tut = { 1: 1, 2: 1, 3: 1, booster: 1 }; save(); endTutorialStep(true); };
  tutEl._after = after; tutEl._id = GL.id;
}
function endTutorialStep(skipped) {
  if (!tutEl) { forced = null; return; }
  const after = tutEl._after; S.flags.tut[tutEl._id] = 1; save();
  tutEl.remove(); tutEl = null; forced = null;
  if (!skipped && after) setTimeout(() => say(after), animMs(900));
}
function boosterTutorial() {
  S.flags.tut.booster = 1; if (!(S.boosters.hammer > 0)) S.boosters.hammer = 1; save(); hud();
  modal({ title: "🔨 Boosters", html: `<div class="dlg"><div class="who">${A.CAT}</div><div class="say"><b>Lumi</b>Stuck? Boosters at the bottom help! Tap the Royal Hammer, then tap any tile to smash it. Boosters never cost a move.</div></div>`, buttons: [{ label: "Got it!", cls: "gold" }] });
}
async function obstacleIntro() {
  const types = [...new Set((GL.obstacles || []).map(o => o.t))];
  if (GL.objectives.some(o => o.t === "relic")) types.push("relic");
  for (const ty of types) {
    if (S.flags.seenOb[ty]) continue;
    S.flags.seenOb[ty] = 1; save();
    const info = { cage: "Crystal Cages lock a gem in place. Match the caged gem to shatter the cage.", ice: "Frozen floors hide under gems. Clear the gems on top to melt them — some take two hits.", stone: "Stone Barriers block cells. Make matches right next to them. Some have up to 3 layers!", relic: "Ancient Relics can't be matched. Clear the gems under them so they fall to the bottom row.", chest: "Ancient Chests take two hits from matches next to them — and drop coins!", resin: "Magic Resin holds a gem. Match that gem or match right next to it.", lock: "Magical Locks are tougher cages: they need two hits.", vine: "Enchanted Vines grow every turn you don't damage one. Trim them fast!", portal: "Sealed Portals sleep under gems. Clear the gem standing on one to wake it.", shadow: "Shadow Crystals ignore normal matches. Only power-ups (or the Royal Hammer) can break them." }[ty];
    const art = ty === "relic" ? A.relic() : ty === "ice" ? '<div style="font-size:70px">🧊</div>' : ty === "portal" ? '<div style="font-size:70px">🌀</div>' : A.obstacle(ty, ty === "lock" || ty === "chest" ? 2 : 1, 2);
    await new Promise(res => modal({ title: "New obstacle!", html: `<div class="inner" style="text-align:center"><div style="width:90px;height:90px;margin:0 auto">${art}</div><h3 style="margin:6px 0">${ty === "relic" ? "Ancient Relic" : E.OBST[ty].label}</h3><p>${info}</p></div>`, buttons: [{ label: "Got it!", cls: "gold" }], onClose: res }));
  }
}

/* ---------------- pause / quit ---------------- */
function pauseMenu() {
  if (!G) return;
  const m = modal({ title: "⏸ Paused", html: `<div class="inner">${G.objectives.length ? `<b>${t("Objectives")}</b><div class="row wrap" style="justify-content:center">${G.objectives.map(o => objIcon(o, GL, G.objRemaining(o))).join("")}</div>` : ""}<div class="set">${sw("pz_music", S.settings.music > 0, "Music")}${sw("pz_sfx", S.settings.sfx > 0, "Sound effects")}${sw("pz_hints", S.settings.hints, "Hints")}</div></div>`,
    buttons: [{ label: "❓ " + t("Help"), cls: "blue", onClick: api => { api.close(); modal({ title: "How to play", html: PAGES.help("how").html.replace(/<button[^>]*replayT[^>]*>.*?<\/button>/, "") }); } }, { label: t("Quit"), cls: "red", onClick: async api => { api.close(); quitLevel(); } }, { label: "▶ " + t("Resume"), cls: "" }] });
  $("#pz_music", m.el).onchange = e => { S.settings.music = e.target.checked ? 0.5 : 0; applySettings(); save(); };
  $("#pz_sfx", m.el).onchange = e => { S.settings.sfx = e.target.checked ? 0.8 : 0; applySettings(); save(); };
  $("#pz_hints", m.el).onchange = e => { S.settings.hints = e.target.checked; save(); };
}
async function quitLevel() {
  const costsLife = !GL.mode || !["endless", "limited", "survival"].includes(GL.mode);
  const usedMove = G.movesUsed > 0;
  if (costsLife && usedMove && !unlimited()) { if (!(await confirmBox("Quit level?", "Quitting now counts as a loss and <b>costs 1 life</b> ❤️.", "Quit", true))) return; loseLife(); S.stats.losses++; S.stats.streak = 0; }
  else if (GL.endless && G.score > 0) { recordMode(); }
  finishRun(false);
  leaveGame();
}
function leaveGame() { try { localStorage.removeItem("gk_inlevel"); } catch (e) {} disarmHint(); G = null; tutEl && tutEl.remove(); tutEl = null; forced = null; CUR = "x"; refreshTop(); go(GL && !GL.mode ? "map" : "home"); }

/* ---------------- end of level ---------------- */
function runDelta() { const d = {}; for (const k in G.stats) if (typeof G.stats[k] === "number") d[k] = G.stats[k] - (runStart[k] || 0); return d; }
function finishRun(won) {
  // merge in-level stats into the profile stats
  const d = runDelta();
  for (const [k, v] of Object.entries({ matched: d.matched, specialsMade: d.specialsMade, specialsUsed: d.specialsUsed, combos: d.combos, cores: d.cores, orbs: d.orbs, beams: d.beams, sparks: d.sparks, starsMade: d.stars, relics: d.relics, blocksBroken: d.blocksBroken })) S.stats[k] += v || 0;
  S.stats.treasure += (d.relics || 0) + (d.blocksBroken || 0);
  S.stats.bestCascade = Math.max(S.stats.bestCascade, G.stats.maxCascade);
  S.stats.playtime += Math.round((Date.now() - levelStartAt) / 1000);
  const evDelta = Object.assign({}, S.stats);
  return d;
}
async function victory() {
  busy = true; disarmHint();
  SND.play("win"); banner(t("Victory"));
  await sleep(animMs(1100));
  // Royal Finale: unused moves become beams
  const left = Math.max(0, G.moves);
  if (left > 0 && !GL.endless) {
    say("Royal Finale! Leftover moves become Crystal Beams!");
    const n = S.settings.quick || S.settings.reducedMotion ? 0 : Math.min(left, 10);
    for (let i = 0; i < n; i++) { const p = G.placeRandomSpecial("beam"); if (!p) break; render(); await sleep(animMs(90)); G.hit(p[0], p[1], "power", 0); }
    G.state = "play"; await resolveAll(); G.state = "won";
    G.score += left * 500;
  }
  const stars = G.starsEarned();
  const n = GL.id;
  const first = !S.best[n];
  const prevStars = (S.best[n] || {}).stars || 0;
  let coins = (GL.coins || 30) + Math.min(left, 15) * 5 + stars * 10;
  if (!first) coins = Math.round(coins * 0.5);
  const d = finishRun(true);
  S.stats.wins++; S.stats.streak++; S.stats.bestStreak = Math.max(S.stats.bestStreak, S.stats.streak);
  if (GL.difficulty >= 2) S.stats.hardWins++;
  if (GL.boss) S.stats.bosses++;
  const newStars = Math.max(0, stars - prevStars);
  S.starBank += newStars; S.stats.starsEarned += newStars;
  if (stars === 3 && prevStars < 3) { S.stats.threeStars++; }
  const crystals = stars === 3 && prevStars < 3 ? 1 : 0;
  const rewards = { coins, crystals };
  S.best[n] = { stars: Math.max(stars, prevStars), score: Math.max(G.score, (S.best[n] || {}).score || 0) };
  const advanced = n === S.level;
  if (advanced) S.level++;
  // xp
  S.xp += 20 + stars * 10; while (S.xp >= xpNeed(S.plevel)) { S.xp -= xpNeed(S.plevel); S.plevel++; toast(`⬆️ Player level ${S.plevel}!`); }
  // chests by milestone
  if (advanced) {
    if (S.stats.wins % 5 === 0) rewards.chest = "wooden";
    if (GL.index === 10) rewards.chest = "silver";
    if (GL.boss) { rewards.chest = "legendary"; rewards.crystals += 10; }
  }
  const shown = grant(rewards, "Level " + n);
  // tournament & events
  const ev = D.activeEvents().find(e => e.tournament);
  const tp = stars * 10 + Math.floor(G.score / 1000);
  S.tour[ev.key] = S.tour[ev.key] || { runs: [] }; S.tour[ev.key].runs.push({ level: n, stars, score: Math.floor(G.score), pts: tp, at: Date.now() });
  S.stats.tourPts += tp;
  const eg = awardEvents(Object.assign({}, d, { wins: 1, starsEarned: newStars, treasure: (d.relics || 0) + (d.blocksBroken || 0) }));
  try { localStorage.removeItem("gk_inlevel"); } catch (e) {}
  checkUnlocks();
  if (GL.boss && advanced) checkRegionRestored(GL.region);
  save(true);
  confetti();
  const objDone = G.objectives.map(o => objIcon(o, GL, 0)).join("");
  const isLast = n >= D.MAX_LEVEL;
  const m = modal({ title: "🎉 " + t("Victory"), noClose: true, html: `<div class="stars3">${[1, 2, 3].map(k => A.starSvg(stars >= k)).join("")}</div>
    <div class="inner" style="text-align:center"><div style="font-size:30px;font-weight:800">${fmt(G.score)}</div><small>Score${(S.best[n].score === Math.floor(G.score) && !first) ? " · New best!" : ""}</small>
    <div class="row wrap" style="justify-content:center;margin:6px 0">${objDone}</div>
    ${left > 0 ? `<p class="muted">Royal Finale: ${left} unused moves → +${fmt(left * 500)} points</p>` : ""}
    ${rewardHTML(shown)}${eg ? `<p class="muted">🎪 +${eg} event points · 🏆 +${tp} tournament points</p>` : `<p class="muted">🏆 +${tp} tournament points</p>`}
    ${!first ? '<p class="muted">Replays pay half coins.</p>' : ""}</div>`,
    buttons: [{ label: "🗺️ " + t("Map"), cls: "blue", onClick: api => { api.close(); leaveGame(); go("map"); } }, ...(isLast ? [] : [{ label: t("Next") + " ›", cls: "", onClick: api => { api.close(); leaveGame(); setTimeout(() => levelStart(Math.min(S.level, n + 1)), 120); } }])] });
  if (!S.flags.starTip) { S.flags.starTip = true; save(); setTimeout(() => toast("⭐ Stars restore the kingdom — spend them in Kingdom Progress!"), 1200); }
  await new Promise(r => { const iv = setInterval(() => { if (m.closed) { clearInterval(iv); r(); } }, 200); });
  if (GL.boss && advanced) {
    const ri = GL.region;
    await story(ri, [["aurelio", `We defeated ${GL.boss.name}! The Heart Crystal of ${D.REGIONS[ri].name} shines again!`], ["lumi", ri < D.REGIONS.length - 1 ? `Next stop: ${D.REGIONS[ri + 1].name}! Mrrp!` : "The whole kingdom is glowing… we did it, Your Highness!"]]);
  }
  await openChests();
}
async function outOfMoves() {
  busy = true; disarmHint();
  if (GL.endless) { return modeOver(); }
  SND.play("lose");
  const remaining = G.objectives.map(o => objIcon(o, GL, G.objRemaining(o))).join("");
  const have = S.boosters.moves5 || 0;
  const choice = await new Promise(res => {
    modal({ title: t("Out of moves"), noClose: true, html: `<div class="inner" style="text-align:center"><p>So close! Still needed:</p><div class="row wrap" style="justify-content:center">${remaining}</div>
      <p class="muted">Add 5 more moves and keep going?</p></div>`,
      buttons: [{ label: "Give up", cls: "red", onClick: api => { api.close(); res("quit"); } },
        have ? { label: `Use +5 Moves (${have} left)`, cls: "gold", onClick: api => { api.close(); res("booster"); } } : { label: `+5 moves · 900 🪙`, cls: "gold", onClick: api => { api.close(); res("buy"); } }] });
  });
  if (choice === "booster") { consumeBooster("moves5"); G.addMoves(5); busy = false; hud(); armHint(); return; }
  if (choice === "buy") { if (await spend("coins", 900, "+5 moves")) { G.addMoves(5); busy = false; hud(); armHint(); return; } return outOfMoves(); }
  // failed
  loseLife(); S.stats.losses++; S.stats.streak = 0;
  finishRun(false); try { localStorage.removeItem("gk_inlevel"); } catch (e) {}
  save(true);
  modal({ title: "💔 Level failed", noClose: true, html: `<div class="dlg"><div class="who">${A.CAT}</div><div class="say"><b>Lumi</b>Don't give up! Try aiming power-ups at the objectives.</div></div>
    <div class="inner" style="text-align:center;margin-top:8px"><p>Remaining objectives:</p><div class="row wrap" style="justify-content:center">${remaining}</div><p class="muted">−1 life · ${unlimited() ? "Unlimited lives active" : `${S.lives} lives left${S.lives < MAX_LIVES ? " · next in " + dur(nextLifeIn()) : ""}`}</p></div>`,
    buttons: [{ label: "🗺️ " + t("Map"), cls: "blue", onClick: api => { api.close(); leaveGame(); } }, { label: "↻ " + t("Retry"), cls: "", onClick: api => { api.close(); const L = GL; leaveGame(); if (L.mode) beginLevel(D.makeMode(L.mode), []); else setTimeout(() => levelStart(L.id), 100); } }] });
}
function recordMode() {
  const b = S.modes.best[GL.mode] = S.modes.best[GL.mode] || [];
  b.push(Math.floor(G.score)); b.sort((x, y) => y - x); b.length = Math.min(10, b.length);
}
async function modeOver() {
  const d = finishRun(false); recordMode();
  const sc = Math.floor(G.score);
  let r = {};
  if (GL.mode === "endless") r.coins = Math.floor(sc / 5000) * 10;
  if (GL.mode === "limited") r.coins = Math.floor(sc / 400);
  if (GL.mode === "survival") r.coins = survivalTurns * 2;
  awardEvents(d);
  const shown = grant(r, D.MODES.find(m => m.id === GL.mode).name);
  try { localStorage.removeItem("gk_inlevel"); } catch (e) {}
  save(true); SND.play("win");
  const best = S.modes.best[GL.mode][0] === sc;
  modal({ title: D.MODES.find(m => m.id === GL.mode).icon + " Run complete", noClose: true, html: `<div class="inner" style="text-align:center"><div style="font-size:34px;font-weight:800">${fmt(sc)}</div><p>${best ? "🏆 New personal best!" : "Best: " + fmt(S.modes.best[GL.mode][0])}${GL.survival ? ` · survived ${survivalTurns} turns` : ""}</p>${r.coins ? rewardHTML(shown) : ""}</div>`,
    buttons: [{ label: "Done", cls: "blue", onClick: api => { api.close(); leaveGame(); go("modes"); } }, { label: "↻ Again", cls: "", onClick: api => { api.close(); const m = GL.mode; leaveGame(); beginLevel(D.makeMode(m), []); } }] });
}
// daily / treasure / master modes are objective-based: hook victory to give mode rewards
const _victory = victory;
victory = async function () {
  if (!GL.mode) return _victory();
  busy = true; SND.play("win"); banner(t("Victory")); confetti();
  const d = finishRun(true); recordMode(); S.stats.wins++;
  awardEvents(Object.assign({}, d, { wins: 1 }));
  let r = { coins: 40 };
  if (GL.mode === "daily" && S.modes.daily !== todayKey()) { S.modes.daily = todayKey(); r = { coins: 150, crystals: 5 }; }
  if (GL.mode === "treasure") r = { coins: 120, chest: "silver" };
  if (GL.mode === "master" && S.modes.master !== weekKey()) { S.modes.master = weekKey(); r = { coins: 200, crystals: 10 }; }
  const shown = grant(r, D.MODES.find(m => m.id === GL.mode).name);
  try { localStorage.removeItem("gk_inlevel"); } catch (e) {}
  checkUnlocks(); save(true);
  await sleep(animMs(900));
  modal({ title: "🎉 Challenge cleared!", noClose: true, html: `<div class="inner" style="text-align:center"><div style="font-size:30px;font-weight:800">${fmt(G.score)}</div>${rewardHTML(shown)}</div>`, buttons: [{ label: "Done", cls: "", onClick: api => { api.close(); leaveGame(); go("modes"); openChests(); } }] });
};

/* ---------------- boot ---------------- */
async function boot() {
  document.body.insertAdjacentHTML("afterbegin", A.defs());
  const st = await load();
  buildChrome();
  ensureMissions();
  checkUnlocks();
  applySettings();
  refreshTop();
  show("home");
  // recover an interrupted level
  try {
    const il = JSON.parse(localStorage.getItem("gk_inlevel") || "null");
    if (il) { localStorage.removeItem("gk_inlevel"); toast("Your last level was interrupted — no life was lost."); }
  } catch (e) {}
  if (st.recovered) toast("⚠️ Your save was damaged — restored from the backup copy.");
  if (st.fresh) {
    S.created = Date.now(); checkUnlocks();
    inbox({ t: "system", title: "Welcome to Gembound Kingdom!", body: "Here's a welcome gift to start your adventure.", reward: { coins: 200, booster: "hammer" } });
    inbox({ t: "event", title: "Events are live", body: "Check the Events screen for this week's challenges and festival." });
  }
  // event announcement once per event key
  for (const ev of D.activeEvents()) { if (!S.events[ev.key] && S.settings.notif.events && !ev.tournament) { eventState(ev); if (!st.fresh) inbox({ t: "event", title: ev.icon + " " + ev.name + " has started", body: ev.desc }); } }
  if (dailyStatus().can && S.settings.notif.daily && !st.fresh) setTimeout(() => { if (CUR === "home" && !modalStack.length) showDaily(); }, 900);
  save();
  setInterval(() => { lifeTick(); if (CUR !== "game") { const lp = $("#livesPill .sub"); if (lp) lp.textContent = unlimited() ? dur(S.unlimitedUntil - Date.now()) : S.lives >= MAX_LIVES ? t("Full") : dur(nextLifeIn()); const lv = $("#livesPill .val"); if (lv) lv.textContent = unlimited() ? "∞" : S.lives; const mt = $("#mTimer"); if (mt) mt.textContent = "⏱ " + dur(nextMidnight() - Date.now()); if (S.missions.day !== todayKey()) { ensureMissions(); if (CUR === "home") renderHome(); } } }, 1000);
  document.addEventListener("pointerdown", () => SND.unlock(), { once: false, passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { save(true); SND.setMusic(null); } else { lifeTick(); refreshTop(); SND.setMusic(CUR === "game" ? "puzzle" : "menu"); } });
  window.addEventListener("pagehide", () => save(true));
  document.addEventListener("keydown", e => { if (e.key === "Escape") { if (modalStack.length) { const m = modalStack[modalStack.length - 1]; if (!m.noClose) m.close(); } else if (CUR === "game") pauseMenu(); else if (PAGE) back(); } });
  if (NATIVE && PLUG.App) PLUG.App.addListener("backButton", () => {
    if (modalStack.length) { const m = modalStack[modalStack.length - 1]; if (!m.noClose) m.close(); return; }
    if (CUR === "game") { pauseMenu(); return; }
    if (PAGE) { back(); return; }
    if (CUR !== "home") { go("home"); return; }
    PLUG.App.exitApp();
  });
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !NATIVE && !/claude|anthropic/.test(location.hostname)) navigator.serviceWorker.register("sw.js").catch(() => {});
  window.__gk = { get S() { return S; }, get G() { return G; }, go, levelStart, beginLevel, D };
}
boot();
