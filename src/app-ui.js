/* ===== Gembound Kingdom — screens & navigation ===== */
let CUR = "home", PAGE = null, PAGEARG = null, history_ = [];
const NAV_SIDEBAR = [
  ["home", "🏰", "Home"], ["play", "▶️", "Play"], ["map", "🗺️", "Map"], ["events", "🎪", "Events"], ["collection", "📖", "Collection"], ["profile", "👤", "Profile"],
  ["boosters", "💣", "Boosters"], ["shop", "🛒", "Shop"], ["missions", "📜", "Missions"], ["achievements", "🏆", "Achievements"], ["daily", "🎁", "Daily Rewards"],
  ["inbox", "✉️", "Inbox"], ["friends", "👥", "Friends"], ["tournament", "🥇", "Tournament"], ["modes", "⚔️", "Challenge Modes"], ["kingdom", "👑", "Kingdom Progress"], ["settings", "⚙️", "Settings"], ["help", "❓", "Help"],
];
function buildChrome() {
  $("#sidebar").innerHTML = `<div class="sb-logo">Gembound<br>Kingdom</div>` + NAV_SIDEBAR.map(([id, e, l]) => `<button data-nav="${id}"><span class="e">${e}</span><span data-i18n="${l}">${t(l)}</span></button>`).join("");
  $("#tabbar").innerHTML = [["home", "🏰", "Home"], ["map", "🗺️", "Map"], ["play", "💎", "Play"], ["boosters", "💣", "Boosters"], ["shop", "🛒", "Shop"]].map(([id, e, l]) =>
    `<button class="tab ${id === "play" ? "mid" : ""}" data-nav="${id}" aria-label="${l}"><span class="ti">${e}</span><span class="tl" data-i18n="${l}">${t(l)}</span></button>`).join("");
  document.addEventListener("click", e => {
    const n = e.target.closest("[data-nav]"); if (!n) return;
    e.preventDefault(); SND.play("click"); vibe(8, "haptic"); go(n.dataset.nav, n.dataset.arg);
  });
}
function go(id, arg) {
  if (id === "play") { startNext(); return; }
  if (id === "daily") { showDaily(); return; }
  if (CUR === "game") return;
  if (id !== "home" && id !== "map") { history_.push([PAGE || CUR, PAGEARG]); PAGE = id; PAGEARG = arg; show("page"); renderPage(); }
  else { PAGE = null; history_ = []; show(id); }
  $$("[data-nav]").forEach(b => b.classList.toggle("on", b.dataset.nav === (PAGE || CUR)));
}
function back() {
  const h = history_.pop();
  if (!h || h[0] === "home" || h[0] === "map" || !h[0]) { PAGE = null; show(h && h[0] === "map" ? "map" : "home"); }
  else { PAGE = h[0]; PAGEARG = h[1]; renderPage(); }
  $$("[data-nav]").forEach(b => b.classList.toggle("on", b.dataset.nav === (PAGE || CUR)));
}
function show(id) {
  CUR = id;
  $$(".screen").forEach(s => s.classList.toggle("on", s.id === "scr-" + id));
  $("#tabbar").classList.toggle("hide", id === "game");
  $("#topbar").classList.toggle("hide", id === "game");
  if (id === "home") renderHome();
  if (id === "map") renderMap();
  SND.setMusic(id === "game" ? "puzzle" : "menu");
  $$("[data-nav]").forEach(b => b.classList.toggle("on", b.dataset.nav === (PAGE || CUR)));
}

/* ---------------- top bar ---------------- */
function xpNeed(l) { return 100 + l * 60; }
function refreshTop() {
  lifeTick();
  const need = xpNeed(S.plevel);
  const tb = $("#topbar");
  tb.innerHTML = `<button class="me" data-nav="profile" aria-label="Profile">
    <span class="avatar" style="background:${frameCss(S.frame)}"><span class="face">${S.avatar}</span><span class="lvl">${S.plevel}</span></span>
    <span class="nm"><b>${esc(S.name)}</b><span class="xpbar"><i style="width:${Math.min(100, S.xp / need * 100)}%"></i><span>${fmt(S.xp)} / ${fmt(need)}</span></span></span></button>
    <button class="pill" data-nav="shop" aria-label="Coins ${S.coins}">${A.coinSvg()}<span class="val">${fmt(S.coins)}</span><span class="plus">+</span></button>
    <button class="pill" data-nav="shop" aria-label="Crystals ${S.crystals}">${A.crystalSvg()}<span class="val">${fmt(S.crystals)}</span><span class="plus">+</span></button>
    <button class="pill lives" id="livesPill" aria-label="Lives">${A.heartPic()}<span class="val">${unlimited() ? "∞" : S.lives}</span><span class="sub">${unlimited() ? dur(S.unlimitedUntil - Date.now()) : S.lives >= MAX_LIVES ? t("Full") : dur(nextLifeIn())}</span></button>
    <button class="gear" data-nav="settings" aria-label="${t("Settings")}">⚙️</button>`;
  $("#livesPill").onclick = () => { SND.play("click"); showLives(); };
  refreshBadges();
}
function refreshBadges() {
  const unread = S.inbox.filter(m => !m.read || (m.reward && !m.claimed)).length;
  const set = (sel, n) => $$(sel).forEach(el => { let d = $(".dot", el); if (n) { if (!d) { d = document.createElement("span"); d.className = "dot"; el.appendChild(d); } d.textContent = n === true ? "!" : n; } else if (d) d.remove(); });
  set('[data-badge="inbox"]', unread);
  set('[data-badge="daily"]', dailyStatus().can);
  ensureMissions();
  const mReady = [...S.missions.daily.map(m => missionInfo(m, D.DAILY_POOL)), ...S.missions.weekly.map(m => missionInfo(m, D.WEEKLY_POOL))].filter((x, i) => x.done && !(i < 3 ? S.missions.daily[i] : S.missions.weekly[i - 3]).claimed).length;
  set('[data-badge="missions"]', mReady);
  const achReady = Object.values(S.ach).filter(a => !a.claimed).length;
  set('[data-badge="achievements"]', achReady);
  const evReady = D.activeEvents().some(ev => !ev.tournament && D.EVENT_MILESTONES.some((M, i) => eventState(ev).pts >= M.pts && !eventState(ev).claimed.includes(i)));
  set('[data-badge="events"]', evReady);
}
function showLives() {
  lifeTick();
  const full = S.lives >= MAX_LIVES;
  const m = modal({ title: "❤️ " + t("Lives"), html: `<div class="inner" style="text-align:center"><div style="font-size:54px">${unlimited() ? "♾️" : "❤️".repeat(Math.min(S.lives, 5)) || "💔"}</div>
    <p><b>${unlimited() ? "Unlimited lives for " + dur(S.unlimitedUntil - Date.now()) : `${S.lives} / ${MAX_LIVES} lives`}</b></p>
    <p class="muted">${full ? "Your lives are full." : `Next life in <b id="lifeT">${dur(nextLifeIn())}</b>. One life returns every 30 minutes.`}</p>
    <p class="muted">You only lose a life when you fail or quit a level. Lives keep refilling while the game is closed.</p></div>`,
    buttons: full ? undefined : [{ label: `Refill 5 for 12 💎`, cls: "gold", onClick: async (api) => { if (await spend("crystals", 12, "Refill lives to 5")) { S.lives = MAX_LIVES; S.lifeTs = Date.now(); save(); refreshTop(); api.close(); toast("❤️ Lives refilled!"); } } }, { label: t("Close"), cls: "blue" }] });
  const iv = setInterval(() => { const el = $("#lifeT", m.el); if (!el || m.closed) return clearInterval(iv); el.textContent = dur(nextLifeIn()); }, 1000);
}

/* ---------------- home ---------------- */
let partsBuilt = false;
function renderHome() {
  ensureMissions();
  const lvl = Math.min(S.level, D.MAX_LEVEL);
  const R = D.REGIONS[Math.floor((lvl - 1) / D.PER_REGION)];
  const ri = D.REGIONS.indexOf(R);
  const sky = D.BACKGROUND_SKY[S.bg] || D.BACKGROUND_SKY.bg_garden;
  const el = $("#scr-home");
  const kp = kingdomPct(ri);
  const done = S.level > D.MAX_LEVEL;
  const L = D.makeLevel(lvl), dc = D.DIFF[L.difficulty];
  const evs = D.activeEvents();
  const ev = evs.find(e => !e.tournament), tour = evs.find(e => e.tournament);
  const ds = dailyStatus();
  const mDone = S.missions.daily.filter(m => !m.claimed).length;
  el.innerHTML = `${A.castleScene(sky)}<div class="particles">${Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${40 + (i * 23) % 50}%;animation-delay:${(i * 0.53) % 7}s"></i>`).join("")}</div>
  <div class="home-wrap">
    <div class="logo"><h1>Gembound<br>Kingdom</h1></div>
    <div class="home-mid">
      <div class="side">
        ${rb("inbox", "✉️", "Inbox")}${rb("daily", A.pic("ch_golden"), "Daily", ds.can ? "Ready!" : dur(nextMidnight() - Date.now()))}${rb("events", A.pic("ch_legendary"), ev.name.split(" ").slice(-1)[0], dur(ev.end - Date.now()))}${rb("tournament", "🏆", "Tournament", dur(tour.end - Date.now()))}
      </div>
      <div class="stage">
        <div class="hero">${A.portrait("prince", S.stats.streak >= 3 ? "cheer" : "happy", "hp")}${A.portrait("lumi", "happy", "hc")}${S.pet ? `<span class="pet">${itemById(S.pet).icon}</span>` : ""}</div>
      </div>
      <div class="side">
        ${rb("missions", "📜", "Missions", mDone ? mDone + " left" : "Done!")}${rb("collection", "📖", "Collection")}${rb("achievements", "🎖️", "Awards")}${rb("modes", A.pic("sp_star"), "Challenges")}
      </div>
    </div>
    <div class="homeplay">
      <button class="kstrip" data-nav="kingdom"><span class="ki">${R.icon}</span><span class="kt"><b>${R.name}</b>${bar(kp, Math.round(kp * 100) + "% restored")}</span><span class="circ">›</span></button>
      <button class="playbtn" data-nav="play"><b>${done ? "All done!" : t("Level") + " " + fmt(S.level)}</b><span style="color:${L.difficulty ? "#fff3a0" : "#fff"}">${done ? "Try Challenges" : L.boss ? "👑 Boss battle" : dc.name}</span></button>
    </div>
  </div>
  ${installBanner()}`;
  wireInstall(el);
  refreshBadges();
}
function rb(id, e, l, tm) { return `<button class="rbtn" data-nav="${id}" data-badge="${id}"><span class="ic">${e}</span><span class="lb" data-i18n="${l}">${t(l)}</span>${tm ? `<span class="tmr">${tm}</span>` : ""}</button>`; }
function nextMidnight() { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); }
function kingdomPct(ri) {
  const start = ri * D.PER_REGION + 1;
  const lv = Math.max(0, Math.min(D.PER_REGION, S.level - start));
  const tasks = (S.restore[ri] || []).filter(Boolean).length;
  return (lv / D.PER_REGION) * 0.6 + (tasks / 4) * 0.4;
}

/* ---------------- install (PWA) ---------------- */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; if (CUR === "home") renderHome(); });
function standalone() { return NATIVE || matchMedia("(display-mode: standalone)").matches || navigator.standalone; }
function installBanner() {
  if (standalone() || S.flags.installDismissed || location.protocol === "file:") return "";
  if (!deferredPrompt && !IOS && !ANDROID) return "";
  return `<div class="install card dark row" id="instB"><span style="font-size:28px">📲</span><span class="grow"><b>Install Gembound Kingdom</b><br><small>${IOS ? "Tap Share ⬆️ then “Add to Home Screen”." : deferredPrompt ? "Play full-screen and offline." : "Get the Android app."}</small></span>${IOS ? "" : `<button class="btn sm" id="instGo">${deferredPrompt ? "Install" : "Get APK"}</button>`}<button class="btn sm ghost" id="instX" aria-label="Dismiss">✕</button></div>`;
}
function wireInstall(root) {
  const go_ = $("#instGo", root), x = $("#instX", root);
  if (go_) go_.onclick = async () => { if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; renderHome(); } else location.href = APK_URL; };
  if (x) x.onclick = () => { S.flags.installDismissed = true; save(); $("#instB") && $("#instB").remove(); };
}

/* ---------------- map ---------------- */
let mapZoom = 1;
function nodePos(i) { const xs = [50, 70, 80, 70, 50, 30, 20, 30]; return { x: xs[i % 8], y: (D.PER_REGION - 1 - i) * 78 + 50 }; }
function renderMap() {
  const el = $("#scr-map");
  const regions = D.REGIONS.map((R, ri) => {
    const nodes = [];
    let d = "";
    for (let i = 0; i < D.PER_REGION; i++) {
      const n = ri * D.PER_REGION + i + 1, p = nodePos(i);
      d += (i ? " L" : "M") + p.x + " " + p.y;
      const b = S.best[n], locked = n > S.level, cur = n === S.level, boss = i === D.PER_REGION - 1;
      const diff = D.difficultyOf(i + 1);
      const tag = boss ? "" : (i + 1) === 10 ? "🎁" : (i + 1) === 12 ? "🗝️" : diff >= 2 ? "💀" : "";
      nodes.push(`<button class="node ${locked ? "locked" : ""} ${cur ? "cur" : ""} ${boss ? "boss" : ""}" style="left:${p.x}%;top:${p.y}px;${!locked && !cur && !boss && diff ? `background:radial-gradient(circle at 40% 30%,#fff,${D.DIFF[diff].color})` : ""}" data-lvl="${n}" aria-label="Level ${n}${locked ? " locked" : ""}">
        ${boss ? (locked ? "🔒" : D.BOSSES[ri].face) : locked ? "🔒" : n}${tag ? `<span class="tag">${tag}</span>` : ""}
        ${b ? `<span class="st">${[1, 2, 3].map(k => A.starSvg(b.stars >= k)).join("")}</span>` : ""}${cur ? `<span class="me-pin">${S.avatar}</span>` : ""}</button>`);
    }
    const sk = R.sky; const got = Array.from({ length: D.PER_REGION }, (_, i) => (S.best[ri * D.PER_REGION + i + 1] || {}).stars || 0).reduce((a, b) => a + b, 0);
    return `<section class="region" id="reg${ri}"><div class="rbg" style="background:linear-gradient(180deg,${sk[2]},${sk[1]} 50%,${R.ground})"></div>
      <div class="rhead"><span style="font-size:26px">${R.icon}</span><b>${ri + 1}. ${R.name}</b><small>⭐ ${got}/${D.PER_REGION * 3}</small></div>
      <div class="path"><svg class="trail" viewBox="0 0 100 ${D.PER_REGION * 78 + 20}" preserveAspectRatio="none"><path d="${d}" stroke="#fff8d8" stroke-width="5" stroke-dasharray="2 7" stroke-linecap="round" fill="none" vector-effect="non-scaling-stroke" opacity=".85"/></svg>${nodes.join("")}</div></section>`;
  });
  el.innerHTML = `<div class="page" id="mapScroll"><div class="mapzoom" id="mapZ" style="transform:scale(${mapZoom})">
    <div class="row" style="padding:0 12px 8px"><button class="btn gold sm" data-nav="modes">⚔️ ${t("Challenge Modes")}</button><button class="btn blue sm" data-nav="kingdom">👑 Restore Kingdom</button><span class="grow"></span><span class="badge" style="background:#3a2670">⭐ ${totalStars()}</span></div>
    <div style="display:flex;flex-direction:column-reverse">${regions.join("")}</div></div></div>
    <div class="mapctl"><button id="zIn" aria-label="Zoom in">＋</button><button id="zOut" aria-label="Zoom out">－</button><button id="zCur" aria-label="Go to current level">📍</button></div>`;
  $$(".node", el).forEach(b => b.onclick = () => { SND.play("click"); const n = +b.dataset.lvl; if (n > S.level) { toast("🔒 Finish level " + (n - 1) + " first"); return; } levelStart(n); });
  const zoom = z => { mapZoom = Math.max(0.6, Math.min(1.4, z)); $("#mapZ").style.transform = `scale(${mapZoom})`; };
  $("#zIn").onclick = () => zoom(mapZoom + 0.15); $("#zOut").onclick = () => zoom(mapZoom - 0.15);
  const toCur = () => { const c = $(".node.cur", el) || $$(".node:not(.locked)", el).pop(); if (c) c.scrollIntoView({ block: "center" }); };
  $("#zCur").onclick = toCur; setTimeout(toCur, 30);
  // pinch zoom
  let pd = 0; const sc = $("#mapScroll");
  sc.addEventListener("touchmove", e => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pd) zoom(mapZoom * d / pd); pd = d; e.preventDefault(); } }, { passive: false });
  sc.addEventListener("touchend", () => (pd = 0));
}

/* ---------------- level start ---------------- */
function startNext() {
  if (CUR === "game") return;
  if (S.level > D.MAX_LEVEL) { toast("🎉 You finished the campaign! Try the Challenge Modes."); go("modes"); return; }
  levelStart(S.level);
}
async function levelStart(n) {
  lifeTick();
  const L = D.makeLevel(n);
  const R = D.REGIONS[L.region];
  if (S.lives <= 0 && !unlimited()) { showLives(); return; }
  if (L.index === 1 && !S.flags.story[L.region]) { await story(L.region); S.flags.story[L.region] = 1; save(); }
  const pre = {};
  const dc = D.DIFF[L.difficulty];
  const objHTML = L.objectives.map(o => objIcon(o, L)).join("");
  const preIds = ["pre_beam", "pre_core", "pre_orb"];
  const m = modal({ title: `${t("Level")} ${n}`, html: `<div style="text-align:center;margin:-6px 0 8px"><span class="badge" style="background:${dc.color}">${dc.name}</span> <span class="badge" style="background:#3a2670">${R.icon} ${R.name}</span>${L.treasure ? ' <span class="badge" style="background:#b8801f">🗝️ Treasure stage</span>' : ""}</div>
    <div class="inner"><b>${t("Objectives")}</b><div class="row wrap" style="justify-content:center;margin:6px 0">${objHTML}</div>
    <p class="muted" style="text-align:center">${L.boss ? `Defeat <b>${L.boss.name}</b> in ${L.moves} moves! Every gem you clear hurts it; breaking obstacles hurts more.` : `${L.moves} moves`}${S.best[n] ? ` · Best: ${"⭐".repeat(S.best[n].stars)} ${fmt(S.best[n].score)}` : ""}</p>
    ${n >= 4 ? `<b>Pre-level boosters</b><div class="row" style="justify-content:center;gap:8px;margin-top:6px">${preIds.map(id => `<button class="tile-card preb" data-pre="${id}" style="width:86px" aria-pressed="false"><div class="em">${A.boostPic(id)}</div><div class="nm">${D.BOOSTERS[id].name}</div><span class="q">${S.boosters[id] || 0}</span></button>`).join("")}</div><p class="muted" style="text-align:center">Tap to add. Used only when you press Play.</p>` : ""}</div>`,
    buttons: [{ label: `▶ ${t("Play")}`, cls: "", onClick: api => { api.close(); beginLevel(L, Object.keys(pre).filter(k => pre[k])); } }] });
  $$("[data-pre]", m.el).forEach(b => b.onclick = async () => {
    const id = b.dataset.pre;
    if (!(S.boosters[id] > 0)) {
      if (await spend("coins", D.BOOSTERS[id].price, `Buy 1 ${D.BOOSTERS[id].name}`)) { S.boosters[id] = (S.boosters[id] || 0) + 1; logBooster(id, 1, "Bought"); save(); $(".q", b).textContent = S.boosters[id]; }
      return;
    }
    pre[id] = !pre[id]; b.style.borderColor = pre[id] ? "#2fb43f" : "#fff"; b.style.background = pre[id] ? "#d8ffd0" : ""; b.setAttribute("aria-pressed", pre[id]);
  });
}
function objIcon(o, L, rem) {
  let ic = "";
  if (o.t === "color") ic = A.gem(o.c);
  else if (o.t === "relic") ic = A.relic();
  else if (o.t === "score") ic = `<span class="em">⭐</span>`;
  else if (o.t === "boss") ic = `<span class="em">${L.boss ? L.boss.face : "👹"}</span>`;
    else ic = A.obstacle(o.t, o.t === "lock" ? 2 : 1, 1);
  let n = rem != null ? rem : o.n != null ? o.n : (L.obstacles || []).filter(x => x.t === o.t).length;
  if (o.t === "boss" && rem == null) n = L.boss.hp;
  const label = o.t === "color" ? E.GEMS[o.c] : o.t === "relic" ? "Relics" : o.t === "boss" ? "Boss HP" : (E.OBST[o.t] || { label: o.t }).label;
  return `<div class="obj ${rem === 0 ? "done" : ""}" data-obj="${o.t}${o.c != null ? o.c : ""}" title="${label}" aria-label="${label}: ${n} left">${ic}<span class="n">${rem === 0 ? "✔" : fmt(n)}</span></div>`;
}

/* ---------------- story ---------------- */
function story(ri, lines) {
  lines = lines || D.REGIONS[ri].story;
  return new Promise(res => {
    let i = 0;
    const m = modal({ title: `${D.REGIONS[ri].icon} ${D.REGIONS[ri].name}`, html: "", buttons: [], onClose: () => res() });
    const step = () => {
      if (i >= lines.length) { m.close(); return; }
      const [who, txt] = lines[i];
      SND.play("voice", who === "lumi" ? 1 : 0);
      m.set(`<div class="dlg"><div class="who">${A.portrait(who, /!|\?/.test(txt) && who === "lumi" ? "happy" : "")}</div><div class="say"><b>${who === "lumi" ? "Lumi" : "Prince Aurelio"}</b>${esc(txt)}</div></div><p class="muted" style="text-align:center">Chapter ${ri + 1} · ${i + 1}/${lines.length}</p>`,
        [{ label: "Skip story", cls: "ghost", onClick: () => m.close() }, { label: i === lines.length - 1 ? "Let's go!" : "Next ›", cls: "gold", onClick: () => { i++; step(); } }]);
    };
    step();
  });
}

/* ---------------- daily rewards ---------------- */
function showDaily() {
  const st = dailyStatus();
  const cur = st.can ? st.day : S.daily.day;
  const cards = D.DAILY.map((r, i) => {
    const day = i + 1; const got = st.can ? day < st.day : day <= S.daily.day;
    return `<div class="d ${got ? "got" : ""} ${st.can && day === st.day ? "today" : ""} ${day === 7 ? "big" : ""}"><small>Day ${day}</small><span class="e">${rewardIcon(r)}</span>${esc(rewardText(r))}</div>`;
  }).join("");
  const m = modal({ title: "🎁 " + t("Daily Rewards"), html: `<div class="cal">${cards}</div>
    <p class="muted" style="text-align:center">Streak: <b>${st.can ? st.streak : S.daily.streak} day(s)</b>. Rewards grow each day; Day 7 is a Golden Chest. Every 14-day streak adds a 10 💎 bonus.<br>Miss a day and you restart at Day 1.${st.reset ? "<br><b>Your streak was reset — welcome back!</b>" : ""}</p>`,
    buttons: st.can ? [{ label: t("Claim") + " Day " + st.day, cls: "gold", onClick: api => { const shown = claimDaily(); SND.play("reward"); confetti(); api.set(`<p style="text-align:center;font-size:20px"><b>Day ${st.day} reward!</b></p>${rewardHTML(shown)}<p class="muted" style="text-align:center">Come back tomorrow for Day ${st.day % 7 + 1}.</p>`, [{ label: "Collect", cls: "gold", onClick: () => { api.close(); openChests(); refreshTop(); if (CUR === "home") renderHome(); } }]); } }] : [{ label: `Next reward in ${dur(nextMidnight() - Date.now())}`, cls: "blue" }] });
}

/* ---------------- generic pages ---------------- */
function renderPage() {
  const el = $("#scr-page");
  const fn = PAGES[PAGE];
  if (!fn) { el.innerHTML = ""; return; }
  const res = fn(PAGEARG);
  el.innerHTML = `<div class="page"><div class="ph"><button class="back" aria-label="Back" id="pgBack">‹</button><h2>${res.title}</h2>${res.right || ""}</div>${res.html}</div>`;
  $("#pgBack").onclick = () => { SND.play("click"); back(); };
  res.wire && res.wire(el);
  $$("[data-tab]", el).forEach(b => b.onclick = () => { SND.play("click"); PAGEARG = b.dataset.tab; renderPage(); });
  applySettings();
  refreshBadges();
}
function tabs(list, cur) { return `<div class="tabs" role="tablist">${list.map(([id, l]) => `<button role="tab" data-tab="${id}" class="${id === cur ? "on" : ""}" aria-selected="${id === cur}">${l}</button>`).join("")}</div>`; }

const PAGES = {};
PAGES.boosters = () => {
  const inv = Object.entries(D.BOOSTERS).map(([id, b]) => `<div class="card row"><span class="bigic">${A.boostPic(id)}</span><div class="grow"><h4>${b.name} <span class="badge" style="background:#8866C8">×${S.boosters[id] || 0}</span></h4><p>${b.desc}</p><p class="muted">${b.kind === "pre" ? "Pre-level: pick it on the level start screen." : "In-level: tap it on the booster bar, then tap the board. Doesn't use a move."}</p></div><button class="btn sm gold" data-buy="${id}">${A.coinSvg().replace('class="ico"', 'class="ico" style="width:18px;height:18px"')} ${fmt(b.price)}</button></div>`).join("");
  const hist = S.boosterLog.slice(0, 20).map(h => `<div class="li"><span class="e">${A.boostPic(h.id)}</span><span class="grow"><b>${h.n > 0 ? "+" : ""}${h.n} ${D.BOOSTERS[h.id].name}</b><br><small>${esc(h.why)} · ${new Date(h.at).toLocaleString()}</small></span></div>`).join("") || `<p class="muted">No booster activity yet.</p>`;
  return { title: "💣 " + t("Boosters"), html: inv + `<h3>History</h3><div class="list">${hist}</div>`,
    wire: el => $$("[data-buy]", el).forEach(b => b.onclick = async () => { const id = b.dataset.buy; if (await spend("coins", D.BOOSTERS[id].price, `Buy 1 ${D.BOOSTERS[id].name}`)) { S.boosters[id] = (S.boosters[id] || 0) + 1; logBooster(id, 1, "Bought in shop"); save(); SND.play("coin"); renderPage(); } }) };
};
PAGES.shop = () => {
  const giftReady = Date.now() - S.gift > 4 * 3600e3;
  const cos = D.ITEMS.filter(i => i.unlock.t === "shop");
  return { title: "🛒 " + t("Shop"), html: `<div class="card dark"><p>✨ <b>No real-money purchases.</b> Everything here costs coins or crystals you earn by playing.</p></div>
    <div class="card row"><span style="font-size:40px">🎁</span><div class="grow"><h4>Free gift</h4><p>${giftReady ? "50 coins + 1 Royal Shuffle, free every 4 hours." : "Next free gift in " + dur(4 * 3600e3 - (Date.now() - S.gift))}</p></div><button class="btn sm" id="gift" ${giftReady ? "" : "disabled"}>Claim</button></div>
    <h3>Lives</h3>
    <div class="card row"><span class="bigic">${A.heartPic()}</span><div class="grow"><h4>Refill lives</h4><p>Back to 5 lives.</p></div><button class="btn sm gold" data-sh="refill">12 💎</button></div>
    <div class="card row"><span style="font-size:36px">♾️</span><div class="grow"><h4>Unlimited lives · 1 hour</h4><p>Play without losing lives.</p></div><button class="btn sm gold" data-sh="unl">25 💎</button></div>
    <h3>Chests</h3>
    ${[["wooden", 300, "coins"], ["silver", 800, "coins"], ["golden", 1600, "coins"], ["crystal", 40, "crystals"]].map(([c, p, cur]) => `<div class="card row"><span class="bigic">${A.chestPic(c)}</span><div class="grow"><h4>${D.CHESTS[c].name}</h4><p>${D.CHESTS[c].rolls} rewards · <a href="#" data-odds="${c}">drop rates</a></p></div><button class="btn sm gold" data-chest="${c}" data-p="${p}" data-cur="${cur}">${fmt(p)} ${cur === "coins" ? "🪙" : "💎"}</button></div>`).join("")}
    <h3>Exchange</h3>
    <div class="card row"><span style="font-size:36px">🪙</span><div class="grow"><h4>1,000 coins</h4><p>Swap crystals for coins.</p></div><button class="btn sm gold" data-sh="ex">10 💎</button></div>
    <h3>Cosmetics</h3>
    ${cos.map(i => `<div class="card row"><span style="font-size:36px">${i.icon}</span><div class="grow"><h4>${i.name} <span class="badge" style="background:${D.RARITY[i.rarity]}">${i.rarity}</span></h4><p>${i.desc}</p></div>${S.items[i.id] ? '<span class="badge" style="background:#2fb43f">Owned</span>' : `<button class="btn sm gold" data-cos="${i.id}">${i.unlock.p} 💎</button>`}</div>`).join("")}
    <p class="muted">Boosters are sold on the Boosters tab.</p>`,
    wire: el => {
      $("#gift", el).onclick = () => { S.gift = Date.now(); const s = grant({ coins: 50, booster: "shuffle" }, "Free gift"); SND.play("reward"); modal({ title: "🎁 Free gift", html: rewardHTML(s), buttons: [{ label: "Thanks!", cls: "gold" }] }); renderPage(); };
      $$("[data-odds]", el).forEach(a => a.onclick = e => { e.preventDefault(); showOdds(a.dataset.odds); });
      $$("[data-sh]", el).forEach(b => b.onclick = async () => {
        const k = b.dataset.sh;
        if (k === "refill") { if (S.lives >= MAX_LIVES) return toast("Lives are already full"); if (await spend("crystals", 12, "Refill lives")) { S.lives = MAX_LIVES; S.lifeTs = Date.now(); } }
        if (k === "unl" && await spend("crystals", 25, "1 hour of unlimited lives")) grant({ unlimited: 60 }, "Shop");
        if (k === "ex" && await spend("crystals", 10, "Exchange for 1,000 coins")) { S.coins += 1000; SND.play("coin"); }
        save(); refreshTop(); renderPage();
      });
      $$("[data-chest]", el).forEach(b => b.onclick = async () => { const c = b.dataset.chest; if (await spend(b.dataset.cur, +b.dataset.p, "Buy a " + D.CHESTS[c].name)) { queueChest(c); await openChests(); renderPage(); } });
      $$("[data-cos]", el).forEach(b => b.onclick = async () => { const it = itemById(b.dataset.cos); if (await spend("crystals", it.unlock.p, "Buy " + it.name)) { unlockItem(it.id); renderPage(); } });
    } };
};
PAGES.events = () => {
  const evs = D.activeEvents();
  const html = evs.map(ev => {
    const es = eventState(ev);
    if (ev.tournament) return `<div class="card" style="border-color:${ev.color}"><div class="row"><span style="font-size:40px">${ev.icon}</span><div class="grow"><h4>${ev.name}</h4><p>${ev.desc}</p><p class="muted">Ends in ${dur(ev.end - Date.now())}</p></div></div><button class="btn blue full" data-nav="tournament">Open tournament</button></div>`;
    const next = D.EVENT_MILESTONES.find(M => M.pts > es.pts);
    return `<div class="card" style="border-color:${ev.color}"><div class="evhero" style="background:linear-gradient(180deg,${ev.color},#3a2670)"><h3>${ev.name}</h3>${A.portrait("prince", "cheer")}${A.chestPic(ev.id === "dragon" ? "legendary" : ev.id === "treasurehunt" ? "open" : "golden")}</div><div class="row"><span style="font-size:40px">${ev.icon}</span><div class="grow"><h4>${ev.name}</h4><p>${ev.desc}</p><p class="muted">⏱ Ends in ${dur(ev.end - Date.now())} · Started ${new Date(ev.start).toLocaleDateString()}</p></div><b style="font-size:22px">${es.pts}</b></div>
      ${bar(next ? es.pts / next.pts : 1, next ? `${es.pts}/${next.pts} pts` : "All milestones reached!")}
      <div class="track"><div class="tbar"><i style="width:${Math.min(100, es.pts / 120 * 100)}%"></i></div>${D.EVENT_MILESTONES.map((M, i) => { const got = es.claimed.includes(i), ok = es.pts >= M.pts; return `<div class="tn ${got ? "got" : ""}" style="left:${8 + M.pts / 120 * 84}%">${rewardIcon(M.r)}<div>${M.pts}</div>${got ? '<span class="ok">✅</span>' : ok ? `<button class="btn sm" data-ms="${ev.key}|${i}">${t("Claim")}</button>` : ""}</div>`; }).join("")}</div>
      <p class="muted">Rules: points come from campaign and challenge levels played while the event is live. Leaderboard: personal only in this offline version.</p></div>`;
  }).join("");
  return { title: "🎪 " + t("Events"), html: `<div class="card dark"><p>Events run on a schedule on your device: a new 3-day event every 3 days, Weekend Adventure Fri–Sun, a monthly seasonal festival and a weekly tournament.</p></div>${html}<button class="btn gold full" data-nav="modes">⚔️ ${t("Challenge Modes")}</button>`,
    wire: el => $$("[data-ms]", el).forEach(b => b.onclick = () => { const [k, i] = b.dataset.ms.split("|"); const ev = evs.find(e => e.key === k); claimMilestone(ev, +i); }) };
};
PAGES.tournament = () => {
  const ev = D.activeEvents().find(e => e.tournament);
  const T = S.tour[ev.key] || { runs: [] };
  const runs = T.runs.slice().sort((a, b) => b.pts - a.pts).slice(0, 10);
  const total = T.runs.reduce((a, r) => a + r.pts, 0);
  const prevKeys = Object.keys(S.tour).filter(k => k !== ev.key).sort().reverse();
  const last = prevKeys.length ? S.tour[prevKeys[0]].runs.reduce((a, r) => a + r.pts, 0) : null;
  const best = Math.max(0, ...Object.values(S.tour).flatMap(x => x.runs.map(r => r.pts)));
  return { title: "🏆 " + t("Tournament"), html: `<div class="card"><h4>${ev.icon} ${ev.name}</h4><p>Every campaign win this week scores <b>stars × 10 + score ÷ 1,000</b> points. Ends in <b>${dur(ev.end - Date.now())}</b>.</p>
    <div class="grid g3"><div class="stat"><b>${total}</b><small>This week</small></div><div class="stat"><b>${last == null ? "–" : last}</b><small>Last week</small></div><div class="stat"><b>${best}</b><small>Personal best run</small></div></div>
    ${last != null ? `<p style="text-align:center"><b>${total >= last ? "▲ " + (total - last) : "▼ " + (last - total)}</b> vs last week</p>` : ""}</div>
    <h3>Your top runs this week</h3><div class="list">${runs.map((r, i) => `<div class="li"><b style="width:28px">#${i + 1}</b><span class="grow">Level ${r.level} · ${"⭐".repeat(r.stars)} · ${fmt(r.score)}</span><b>${r.pts} pts</b></div>`).join("") || '<p class="muted">Win a level to post your first score.</p>'}</div>
    <h3>History</h3><div class="list">${prevKeys.slice(0, 8).map(k => `<div class="li"><span class="grow">Week of ${k.replace("tour_", "")}</span><b>${S.tour[k].runs.reduce((a, r) => a + r.pts, 0)} pts</b></div>`).join("") || '<p class="muted">No past tournaments yet.</p>'}</div>
    <div class="card dark"><p>🔒 Online rankings against other players need a secure server, which this version doesn't have. To keep things fair, the game never shows made-up opponents — you compete with your own records.</p></div>` };
};
PAGES.collection = (cat) => {
  const cats = ["Characters", "Costumes", "Pets", "Artifacts", "Decorations", "Backgrounds", "Special"];
  cat = cat || "Characters";
  const items = D.ITEMS.filter(i => i.cat === cat);
  const owned = D.ITEMS.filter(i => S.items[i.id]).length;
  return { title: "📖 " + t("Collection"), right: `<span class="badge" style="background:#3a2670">${owned}/${D.ITEMS.length}</span>`,
    html: bar(owned / D.ITEMS.length, `${owned} / ${D.ITEMS.length} collected`) + "<br>" + tabs(cats.map(c => [c, c]), cat) +
      `<div class="grid g3 wide">${items.map(i => `<button class="tile-card ${S.items[i.id] ? "" : "locked"}" data-item="${i.id}"><div class="em">${S.items[i.id] ? i.icon : "❔"}</div><div class="nm">${S.items[i.id] ? i.name : "???"}</div><div class="rar" style="background:${D.RARITY[i.rarity]}"></div></button>`).join("")}</div>`,
    wire: el => $$("[data-item]", el).forEach(b => b.onclick = () => {
      const i = itemById(b.dataset.item), own = S.items[i.id];
      modal({ title: own ? i.icon + " " + i.name : "Locked", html: `<div class="inner" style="text-align:center"><div style="font-size:80px">${own ? i.icon : "❔"}</div><p><span class="badge" style="background:${D.RARITY[i.rarity]}">${i.rarity}</span> <span class="badge" style="background:#3a2670">${i.cat}</span></p><p>${own ? esc(i.desc) : "Keep playing to discover this collectible."}</p><p class="muted">${own ? "Collected " + new Date(own).toLocaleDateString() : "Unlock: " + ruleText(i.unlock)}</p></div>`,
        buttons: own && ["Costumes", "Pets", "Backgrounds"].includes(i.cat) ? [{ label: "Equip", cls: "gold", onClick: api => { if (i.cat === "Costumes") S.outfit = i.id; if (i.cat === "Pets") S.pet = i.id; if (i.cat === "Backgrounds") S.bg = i.id; save(); toast("Equipped " + i.name); api.close(); } }, { label: t("Close"), cls: "blue" }] : undefined });
    }) };
};
PAGES.profile = (tab) => {
  tab = tab || "stats";
  const st = S.stats;
  const playH = Math.floor(st.playtime / 3600), playM = Math.floor(st.playtime % 3600 / 60);
  let body = "";
  if (tab === "stats") body = `<div class="grid g3">${[["Player level", S.plevel], ["Campaign level", Math.min(S.level, D.MAX_LEVEL)], ["Victories", st.wins], ["Failures", st.losses], ["Best win streak", st.bestStreak], ["Total stars", totalStars()], ["Achievements", Object.keys(S.ach).length + "/" + D.ACH.length], ["Playtime", playH + "h " + playM + "m"], ["Power-ups made", st.specialsMade]].map(([k, v]) => `<div class="stat"><b>${typeof v === "number" ? fmt(v) : v}</b><small>${k}</small></div>`).join("")}</div>
    <h3>Region completion</h3>${D.REGIONS.map((R, ri) => `<div class="row" style="margin-bottom:6px"><span style="width:28px">${R.icon}</span><span style="width:130px;font-size:13px">${R.name}</span><div class="grow">${bar(Math.max(0, Math.min(D.PER_REGION, S.level - 1 - ri * D.PER_REGION)) / D.PER_REGION, Math.max(0, Math.min(D.PER_REGION, S.level - 1 - ri * D.PER_REGION)) + "/" + D.PER_REGION)}</div></div>`).join("")}`;
  if (tab === "avatar") body = `<div class="grid g4">${D.AVATARS.map(a => `<button class="tile-card" data-av="${a}" style="${a === S.avatar ? "border-color:#2fb43f" : ""}"><div class="em">${a}</div></button>`).join("")}</div>`;
  if (tab === "frame") body = `<div class="grid g3">${D.FRAMES.map(f => { const ok = ruleOK(f.unlock); return `<button class="tile-card ${ok ? "" : "locked"}" data-fr="${f.id}" ${ok ? "" : "disabled"} style="${f.id === S.frame ? "border-color:#2fb43f" : ""}"><div class="avatar" style="margin:0 auto;background:${f.css}"><span class="face">${S.avatar}</span></div><div class="nm">${f.name}</div>${ok ? "" : `<small>${ruleText(f.unlock)}</small>`}</button>`; }).join("")}</div>`;
  if (tab === "title") body = `<div class="list">${D.TITLES.map(x => { const ok = ruleOK(x.unlock); return `<button class="li" data-ti="${x.id}" ${ok ? "" : "disabled"} style="width:100%;${ok ? "" : "opacity:.5"}"><span class="e">${x.id === S.title ? "✅" : ok ? "🏷️" : "🔒"}</span><span class="grow" style="text-align:left"><b>${x.name}</b><br><small>${ruleText(x.unlock)}</small></span></button>`; }).join("")}</div>`;
  if (tab === "look") {
    const own = c => D.ITEMS.filter(i => i.cat === c && S.items[i.id]);
    const pick = (c, curId, key) => `<h4>${c}</h4><div class="grid g4">${c === "Pets" ? `<button class="tile-card" data-eq="${key}|" style="${!curId ? "border-color:#2fb43f" : ""}"><div class="em">🚫</div><div class="nm">None</div></button>` : ""}${own(c).map(i => `<button class="tile-card" data-eq="${key}|${i.id}" style="${i.id === curId ? "border-color:#2fb43f" : ""}"><div class="em">${i.icon}</div><div class="nm">${i.name}</div></button>`).join("") || '<p class="muted">None yet</p>'}</div>`;
    body = pick("Costumes", S.outfit, "outfit") + pick("Pets", S.pet, "pet") + pick("Backgrounds", S.bg, "bg") + `<p class="muted">Customization is optional — it never affects progress.</p>`;
  }
  return { title: "👤 " + t("Profile"), html: `<div class="card row"><span class="avatar" style="width:76px;height:76px;background:${frameCss(S.frame)}"><span class="face" style="font-size:44px">${S.avatar}</span><span class="lvl">${S.plevel}</span></span>
      <div class="grow"><input class="inp" id="pname" maxlength="16" value="${esc(S.name)}" aria-label="Player name" style="max-width:100%;width:100%;font-weight:700"><p class="muted">${esc((D.TITLES.find(x => x.id === S.title) || D.TITLES[0]).name)} · ID ${S.pid}</p></div></div>` +
    tabs([["stats", "Stats"], ["avatar", "Avatar"], ["frame", "Frame"], ["title", "Title"], ["look", "Outfit & home"]], tab) + `<div class="card">${body}</div>`,
    wire: el => {
      $("#pname", el).onchange = e => { const v = e.target.value.trim().replace(/[<>]/g, "").slice(0, 16); S.name = v || "Player"; save(); refreshTop(); toast("Name saved"); };
      $$("[data-av]", el).forEach(b => b.onclick = () => { S.avatar = b.dataset.av; save(); refreshTop(); renderPage(); });
      $$("[data-fr]", el).forEach(b => b.onclick = () => { S.frame = b.dataset.fr; save(); refreshTop(); renderPage(); });
      $$("[data-ti]", el).forEach(b => b.onclick = () => { S.title = b.dataset.ti; save(); renderPage(); });
      $$("[data-eq]", el).forEach(b => b.onclick = () => { const [k, v] = b.dataset.eq.split("|"); S[k] = v || null; save(); renderPage(); });
    } };
};
PAGES.achievements = (g) => {
  g = g || "Puzzle"; const st = statSnapshot();
  return { title: "🎖️ " + t("Achievements"), html: tabs([["Puzzle", "Puzzle"], ["Progression", "Progression"], ["Consistency", "Consistency"]], g) +
    D.ACH.filter(a => a.group === g).map(a => { const s = S.ach[a.id]; const v = Math.min(a.n, st[a.stat] || 0); return `<div class="card row" style="${s ? "" : "opacity:.85"}"><span style="font-size:40px;${s ? "" : "filter:grayscale(1)"}">${s ? "🏅" : "🎖️"}</span><div class="grow"><h4>${a.name}</h4><p>${a.desc}</p>${bar(v / a.n, `${fmt(v)}/${fmt(a.n)}`)}<p class="muted">Reward: ${rewardText(a.reward)}</p></div>${s && !s.claimed ? `<button class="btn sm gold" data-ach="${a.id}">${t("Claim")}</button>` : s ? "✅" : ""}</div>`; }).join(""),
    wire: el => $$("[data-ach]", el).forEach(b => b.onclick = () => { const a = D.ACH.find(x => x.id === b.dataset.ach); S.ach[a.id].claimed = true; const sh = grant(a.reward, "Achievement"); SND.play("reward"); confetti(); modal({ title: "🏅 " + a.name, html: rewardHTML(sh), buttons: [{ label: "Collect", cls: "gold" }] }); checkUnlocks(); renderPage(); }) };
};
PAGES.missions = (tab) => {
  tab = tab || "daily"; ensureMissions();
  const kind = tab === "weekly" ? "weekly" : "daily";
  const arr = kind === "daily" ? S.missions.daily : S.missions.weekly, pool = kind === "daily" ? D.DAILY_POOL : D.WEEKLY_POOL;
  const ends = kind === "daily" ? nextMidnight() : (() => { const d = new Date(weekKey() + "T00:00:00"); d.setDate(d.getDate() + 7); return d.getTime(); })();
  const body = tab === "log" ? `<div class="list">${S.missions.log.map(l => `<div class="li"><span class="e">✅</span><span class="grow"><b>${esc(l.text)}</b><br><small>${esc(l.reward)} · ${new Date(l.at).toLocaleString()}</small></span></div>`).join("") || '<p class="muted">No missions claimed yet.</p>'}</div>`
    : `<p class="muted">⏱ ${kind === "daily" ? "New missions" : "Weekly reset"} in ${dur(ends - Date.now())}. Unclaimed missions expire.</p>` + arr.map((m, i) => { const I = missionInfo(m, pool); return `<div class="card row"><span style="font-size:36px">${I.def.icon}</span><div class="grow"><h4>${esc(I.def.text)}</h4>${bar(I.prog / I.def.n, `${fmt(I.prog)}/${fmt(I.def.n)}`)}<p class="muted">Reward: ${rewardText(I.def.reward)}</p></div>${m.claimed ? "✅" : `<button class="btn sm gold" data-cm="${i}" ${I.done ? "" : "disabled"}>${t("Claim")}</button>`}</div>`; }).join("");
  return { title: "📜 " + t("Missions"), html: tabs([["daily", "Daily"], ["weekly", "Weekly"], ["log", "Reward history"]], tab) + body,
    wire: el => $$("[data-cm]", el).forEach(b => b.onclick = () => { claimMission(kind, +b.dataset.cm); renderPage(); }) };
};
PAGES.inbox = () => ({
  title: "✉️ " + t("Inbox"), right: `<button class="btn sm ghost" id="readAll">Clear read</button>`,
  html: `<div class="list">${S.inbox.map(m => `<div class="li ${m.read ? "" : "unread"}" data-msg="${m.id}"><span class="e">${{ reward: "🎁", event: "🎪", ach: "🏆", system: "📢", friend: "👥", team: "🛡️" }[m.t] || "✉️"}</span><span class="grow"><b>${esc(m.title)}</b><br><small>${esc(m.body)}</small><br><small class="muted">${new Date(m.at).toLocaleString()}</small></span>${m.reward && !m.claimed ? `<button class="btn sm gold" data-claim="${m.id}">${t("Claim")}</button>` : ""}</div>`).join("") || '<p class="muted">Your inbox is empty.</p>'}</div><p class="muted">Choose which messages you get in Settings › Notifications.</p>`,
  wire: el => {
    S.inbox.forEach(m => { if (!m.reward) m.read = true; }); save();
    $$("[data-claim]", el).forEach(b => b.onclick = () => { const m = S.inbox.find(x => x.id === b.dataset.claim); if (!m || m.claimed) return; m.claimed = true; m.read = true; const sh = grant(m.reward, "Inbox"); SND.play("reward"); modal({ title: "🎁 " + esc(m.title), html: rewardHTML(sh), buttons: [{ label: "Collect", cls: "gold" }] }); openChests(); renderPage(); });
    $("#readAll").onclick = () => { S.inbox = S.inbox.filter(m => !m.read || (m.reward && !m.claimed)); save(); renderPage(); };
  },
});
PAGES.friends = () => {
  const T = S.team;
  return { title: "👥 " + t("Friends"), html: `<div class="card dark"><p>🔒 <b>This version has no online accounts</b> (no login, by design), so there's no player search, friend requests, team chat or life sharing — those need a secure server. Everything below works on your device.</p></div>
    <div class="card"><h4>Invite friends</h4><p>Send friends a link to the game. They can play free in their browser or install it.</p><button class="btn blue" id="share">📤 Share invite link</button></div>
    <div class="card"><h4>🛡️ My team (local)</h4>${T ? `<div class="row"><span style="font-size:44px">${T.badge}</span><div class="grow"><b>${esc(T.name)}</b><p>${esc(T.desc)}</p><p class="muted">Members: ${esc(S.name)} (leader) · Created ${new Date(T.at).toLocaleDateString()}</p><p class="muted">Team contribution: ${fmt(S.stats.wins * 10 + totalStars())} pts (your wins × 10 + stars)</p></div></div><button class="btn sm red" id="leave">Leave team</button>`
      : `<p>Create a team crest to show on your profile.</p><input class="inp" id="tn" placeholder="Team name" maxlength="20" style="max-width:100%;width:100%;margin-bottom:6px"><input class="inp" id="td" placeholder="Team description" maxlength="60" style="max-width:100%;width:100%;margin-bottom:6px"><div class="row wrap" id="tb">${["🛡️", "🐉", "🦁", "🌟", "🌸", "⚓", "🔥", "❄️"].map((b, i) => `<button class="tile-card" data-b="${b}" style="width:50px;padding:4px;${i ? "" : "border-color:#2fb43f"}"><span style="font-size:26px">${b}</span></button>`).join("")}</div><br><button class="btn" id="mk">Create team</button>`}</div>
    <div class="card set"><h4>Privacy & moderation</h4><p class="muted">Saved now so they're ready if online play is added later.</p>${sw("pv_friendReq", S.settings.privacy.friendReq, "Allow friend requests")}${sw("pv_publicProfile", S.settings.privacy.publicProfile, "Show my profile publicly")}${sw("pv_chatFilter", S.settings.privacy.chatFilter, "Filter offensive chat")}</div>`,
    wire: el => {
      $("#share", el).onclick = async () => { const url = "https://jaycee055.github.io/gembound-kingdom/"; const txt = "Come restore Gembound Kingdom with me! 💎"; try { if (NATIVE && PLUG.Share) await PLUG.Share.share({ title: "Gembound Kingdom", text: txt, url }); else if (navigator.share) await navigator.share({ title: "Gembound Kingdom", text: txt, url }); else { await navigator.clipboard.writeText(url); toast("Link copied!"); } } catch (e) {} };
      let badge = "🛡️";
      $$("[data-b]", el).forEach(b => b.onclick = () => { badge = b.dataset.b; $$("[data-b]", el).forEach(x => (x.style.borderColor = "#fff")); b.style.borderColor = "#2fb43f"; });
      const mk = $("#mk", el); if (mk) mk.onclick = () => { const n = $("#tn", el).value.trim().replace(/[<>]/g, ""); if (!n) return toast("Give your team a name"); S.team = { name: n, desc: $("#td", el).value.trim().replace(/[<>]/g, "") || "A brave band of puzzlers.", badge, at: Date.now() }; save(); renderPage(); };
      const lv = $("#leave", el); if (lv) lv.onclick = async () => { if (await confirmBox("Leave team?", "Your local team will be deleted.", "Leave", true)) { S.team = null; save(); renderPage(); } };
      ["friendReq", "publicProfile", "chatFilter"].forEach(k => $("#pv_" + k, el).onchange = e => { S.settings.privacy[k] = e.target.checked; save(); });
    } };
};
PAGES.modes = () => ({
  title: "⚔️ " + t("Challenge Modes"), html: D.MODES.map(m => { const best = (S.modes.best[m.id] || [])[0]; const lock = (m.id === "daily" && S.modes.daily === todayKey()) || (m.id === "master" && S.modes.master === weekKey()); return `<div class="card row"><span style="font-size:42px">${m.icon}</span><div class="grow"><h4>${m.name}</h4><p>${m.desc}</p><p class="muted">Rewards: ${m.rewards}${best != null ? ` · Best: ${fmt(best)}` : ""}${lock ? " · ✅ reward claimed — replay for fun" : ""}</p></div><button class="btn sm" data-mode="${m.id}">${t("Play")}</button></div>`; }).join("") +
    `<h3>Personal leaderboards</h3>${D.MODES.map(m => `<div class="card"><b>${m.icon} ${m.name}</b><div class="row wrap" style="gap:6px;margin-top:4px">${(S.modes.best[m.id] || []).slice(0, 5).map((s, i) => `<span class="badge" style="background:${["#d9a13a", "#8a96b8", "#b8703f", "#6a4fb0", "#6a4fb0"][i]}">#${i + 1} ${fmt(s)}</span>`).join("") || '<span class="muted">No scores yet</span>'}</div></div>`).join("")}`,
  wire: el => $$("[data-mode]", el).forEach(b => b.onclick = () => { const m = b.dataset.mode; if (S.lives <= 0 && !unlimited() && !["endless", "limited", "survival"].includes(m)) return showLives(); beginLevel(D.makeMode(m), []); }),
});
PAGES.kingdom = (ri) => {
  ri = ri == null ? Math.min(D.REGIONS.length - 1, Math.floor((Math.min(S.level, D.MAX_LEVEL) - 1) / D.PER_REGION)) : +ri;
  const maxR = Math.min(D.REGIONS.length - 1, Math.floor((Math.min(S.level, D.MAX_LEVEL) - 1) / D.PER_REGION));
  const R = D.REGIONS[ri]; const done = S.restore[ri] || [];
  const pct = kingdomPct(ri);
  return { title: "👑 Kingdom", html: tabs(D.REGIONS.slice(0, maxR + 1).map((x, i) => [String(i), x.icon + " " + x.name]), String(ri)) +
    `<div class="card" style="padding:0;overflow:hidden;position:relative;height:200px">${A.castleScene(R.sky)}<div style="position:absolute;left:10px;bottom:10px;right:10px">${bar(pct, Math.round(pct * 100) + "% restored")}</div></div>
    <div class="card dark row"><span style="font-size:30px">⭐</span><div class="grow"><b>${S.starBank} stars to spend</b><br><small>Earn stars by winning levels. Restoration tasks + finishing the region's 20 levels restore it.</small></div></div>` +
    D.RESTORE[ri].map((tk, i) => `<div class="card row"><span style="font-size:38px;${done[i] ? "" : "filter:grayscale(.8)"}">${tk.icon}</span><div class="grow"><h4>${tk.name}</h4><p class="muted">${done[i] ? "Restored ✨" : "Costs " + tk.cost + " ⭐"}</p></div>${done[i] ? "✅" : `<button class="btn sm gold" data-rt="${i}" ${S.starBank >= tk.cost && (i === 0 || done[i - 1]) ? "" : "disabled"}>⭐ ${tk.cost}</button>`}</div>`).join("") +
    (S.restoredRegions[ri] ? `<div class="card" style="text-align:center"><b>🌟 ${R.name} is fully restored!</b></div>` : ""),
    wire: el => $$("[data-rt]", el).forEach(b => b.onclick = async () => {
      const i = +b.dataset.rt, tk = D.RESTORE[ri][i];
      if (!(await confirmBox("Restore?", `${tk.icon} ${tk.name}<br>Cost: <b>${tk.cost} ⭐</b> (you have ${S.starBank})`, "Restore"))) return;
      S.starBank -= tk.cost; (S.restore[ri] = S.restore[ri] || [])[i] = true; SND.play("reward"); confetti();
      const lines = [["aurelio", ["Look! The path is clear again.", "It's beautiful — just like the old stories!", "The flowers remember the magic.", "The Heart Crystal glows! We did it!"][i]], ["lumi", ["Purrfect work!", "Mrrrow! Shiny!", "Smells like victory… and petals.", "On to the next adventure!"][i]]];
      await story(ri, lines);
      checkRegionRestored(ri); save(); renderPage();
    }) };
};
function checkRegionRestored(ri) {
  const all = (S.restore[ri] || []).filter(Boolean).length === 4 && S.level > (ri + 1) * D.PER_REGION;
  if (all && !S.restoredRegions[ri]) { S.restoredRegions[ri] = Date.now(); S.stats.restoredRegions = Object.keys(S.restoredRegions).length; grant({ chest: "crystal", crystals: 10 }, "Region restored"); toast("🌟 " + D.REGIONS[ri].name + " restored! Crystal Chest earned."); checkUnlocks(); openChests(); }
}
PAGES.help = (tab) => {
  tab = tab || "how";
  const how = [
    ["👆", "Select pieces", "Tap a gem to select it. Tap it again to deselect."],
    ["🔄", "Swap neighbours", "Tap a neighbouring gem (or swipe) to swap. Swaps that don't make a match bounce back."],
    ["💎", "Make matches", "Line up 3+ of the same gem in a row or column. New gems fall in and can cascade."],
    ["⚡", "Create power-ups", "4 in a line → Crystal Beam (clears its line). 2×2 square → Fairy Spark (flies to an objective). L or T shape → Dragon Core (big blast). 5 in a line → Mystic Orb (clears a color). 6+ or a big cross → Celestial Star."],
    ["💥", "Combine power-ups", "Swap two power-ups together: Beam+Beam = cross, Beam+Core = 3-wide cross, Core+Core = huge blast, Orb+anything = turns a whole color into that power-up, Orb+Orb or Star+anything = clears the board."],
    ["🎯", "Complete objectives", "Objectives are shown at the top. Finish them all before you run out of moves."],
    ["🔨", "Use boosters", "Tap a booster at the bottom, then tap the board. Boosters never use a move. Pre-level boosters are chosen before you start."],
    ["⭐", "Earn stars", "Win with 30%+ moves left for ★★★, 10%+ (or 3 moves) for ★★. Spend stars on Kingdom restoration."],
    ["🗺️", "Unlock regions", "Beat the boss at level 20 of each region to open the next one. Each region brings new obstacles."],
  ];
  const ob = Object.entries(E.OBST).map(([k, o]) => `<div class="li"><span class="e" style="width:44px">${A.obstacle(k, 1, 1)}</span><span class="grow"><b>${o.label}</b><br><small>${{ stone: "Blocks a cell. Match next to it or hit it with power-ups. Can have 1–3 layers (multi-layer crystal).", vine: "Blocks a cell and grows each turn you don't damage a vine.", chest: "Two hits from adjacent matches; drops coins.", shadow: "Only power-ups and the Royal Hammer can crack it.", cage: "Locks a gem in place. Match the caged gem to break it.", lock: "Like a cage, but needs two hits.", resin: "Sticky resin holds a gem. Match it or next to it.", ice: "Frozen floor under gems; clear gems on top (1–2 layers).", portal: "Clear a gem standing on it to activate it." }[k]}</small></span></div>`).join("") +
    `<div class="li"><span class="e" style="width:44px">${A.relic()}</span><span class="grow"><b>Ancient Relic</b><br><small>Can't be matched. Clear gems beneath it so it falls to the bottom row to collect it.</small></span></div>`;
  const faq = [
    ["Do I need to pay?", "No. There are no real-money purchases. Coins and crystals are earned by playing."],
    ["Do I need an account?", "No. Progress is saved on this device. Use Settings › Account › Export backup to move it to another device."],
    ["When do I lose a life?", "Only when you fail or quit a level. One life refills every 30 minutes, even while the game is closed."],
    ["Can I play offline?", "Yes. After the first visit the game works offline (events and missions run on your device clock)."],
    ["Why can't I see other players?", "Online leaderboards and friends need a secure server. This version never invents fake opponents."],
    ["I'm stuck on a level!", "Try a pre-level booster, aim power-ups at objectives, or replay earlier levels for more stars and coins."],
  ];
  let body = "";
  if (tab === "how") body = `<div class="list">${how.map(([e, h, p]) => `<div class="li"><span class="e">${e}</span><span class="grow"><b>${h}</b><br><small>${p}</small></span></div>`).join("")}</div><button class="btn gold full" id="replayT">Replay the tutorial levels</button>`;
  if (tab === "obst") body = `<div class="list">${ob}</div>`;
  if (tab === "faq") body = faq.map(([q, a]) => `<div class="card"><h4>${q}</h4><p>${a}</p></div>`).join("");
  if (tab === "support") body = `<div class="card"><h4>Report a problem / Contact support</h4><p>Open a GitHub issue — include your device and what happened.</p><a class="btn blue" href="${ISSUES_URL}" target="_blank" rel="noopener">Open GitHub issues</a></div>
    <div class="card"><h4>Game version</h4><p>Gembound Kingdom ${VERSION}${NATIVE ? " (app)" : standalone() ? " (installed web app)" : " (web)"}</p></div>
    <div class="card"><h4>Credits</h4><p>Game design, code, illustrations, music and sound effects: original work created for Gembound Kingdom. All art is drawn in code; all audio is synthesized live. Fonts: Fredoka and Cinzel (SIL Open Font License).</p></div>
    <div class="card"><h4>Legal</h4><a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a> · <a href="privacy.html#terms" target="_blank" rel="noopener">Terms of service</a></div>`;
  return { title: "❓ " + t("Help"), html: tabs([["how", "How to play"], ["obst", "Obstacles"], ["faq", "FAQ"], ["support", "Support"]], tab) + body,
    wire: el => { const r = $("#replayT", el); if (r) r.onclick = () => { S.flags.tut = {}; save(); levelStart(1); }; } };
};
