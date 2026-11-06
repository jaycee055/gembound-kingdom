/* ===== Gembound Kingdom — app core: state, save, economy, UI helpers ===== */
const D = window.GKData, A = window.GKArt, SND = window.GKAudio, E = window.GKEngine;
const VERSION = "1.0.0";
const APK_URL = "https://github.com/jaycee055/gembound-kingdom/releases/latest/download/GemboundKingdom.apk";
const ISSUES_URL = "https://github.com/jaycee055/gembound-kingdom/issues/new";
const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const PLUG = (window.Capacitor && window.Capacitor.Plugins) || {};
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const ANDROID = /Android/i.test(navigator.userAgent);
const REGEN_MS = 30 * 60 * 1000, MAX_LIVES = 5;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => Math.floor(n).toLocaleString("en-US");
const todayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const weekKey = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return todayKey(x); };
function t(k) { const L = D.I18N[S.settings.lang] || {}; return L[k] || k; }
function dur(ms) {
  ms = Math.max(0, ms); const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  if (d) return d + "d " + h + "h"; if (h) return h + "h " + m + "m"; return m + ":" + String(sec).padStart(2, "0");
}

/* ---------------- state ---------------- */
function freshState() {
  return {
    v: 1, created: Date.now(), pid: Math.random().toString(36).slice(2, 10).toUpperCase(),
    name: "Player", avatar: "🤴", frame: "gold", title: "novice", bg: "bg_garden", outfit: "co_explorer", pet: null,
    level: 1, best: {}, coins: 500, crystals: 15, lives: MAX_LIVES, lifeTs: Date.now(), unlimitedUntil: 0, xp: 0, plevel: 1,
    starBank: 0, restore: {}, restoredRegions: {},
    boosters: { hammer: 2, saber: 1, bomb: 1, prism: 0, shuffle: 1, moves5: 0, pre_beam: 1, pre_core: 0, pre_orb: 0 },
    boosterLog: [],
    stats: { wins: 0, losses: 0, streak: 0, bestStreak: 0, matched: 0, specialsMade: 0, specialsUsed: 0, combos: 0, cores: 0, orbs: 0, beams: 0, sparks: 0, starsMade: 0, bosses: 0, threeStars: 0, bestCascade: 0, chests: 0, playtime: 0, coinsEarned: 0, dailyClaims: 0, bestLoginStreak: 0, blocksBroken: 0, relics: 0, hardWins: 0, starsEarned: 0, eventPts: 0, tourPts: 0, treasure: 0, weeklyAll: 0, regions: 0, restoredRegions: 0 },
    ach: {}, items: {}, daily: { last: null, streak: 0, day: 0 },
    missions: { day: null, daily: [], week: null, weekly: [], log: [] },
    events: {}, inbox: [], modes: { best: {}, daily: null, master: null }, tour: {}, team: null,
    gift: 0, analytics: {},
    flags: { tut: {}, seenOb: {}, story: {}, starTip: false, installDismissed: false },
    settings: {
      lang: "en", master: 0.8, music: 0.5, sfx: 0.8, voice: 0.7, mute: false,
      quality: "auto", particles: true, bgAnim: true, shake: true, reducedFx: false,
      vibrate: true, haptic: true, confirmSpend: true, quick: false, autoPower: false, hints: true, lefty: false,
      colorblind: false, contrast: false, bigText: false, reducedMotion: false, sr: false, glyphs: false, speed: 1,
      notif: { daily: true, events: true, lives: true, friends: true, team: true, ach: true },
      privacy: { analytics: true, friendReq: true, publicProfile: false, chatFilter: true },
    },
  };
}
let S = freshState();
let MEM = null; // in-memory fallback
const SAVE_KEY = "gk_save_v1";
function checksum(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function pack() { const d = JSON.stringify(S); return JSON.stringify({ d, sum: checksum(d), at: Date.now() }); }
function unpack(raw) {
  try { const o = JSON.parse(raw); if (!o || typeof o.d !== "string" || checksum(o.d) !== o.sum) return null; const s = JSON.parse(o.d); s.__at = o.at; return s; } catch (e) { return null; }
}
function merge(base, add) { for (const k in add) { if (add[k] && typeof add[k] === "object" && !Array.isArray(add[k]) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) merge(base[k], add[k]); else base[k] = add[k]; } return base; }
let saveTimer = null, saveFails = 0;
function save(now) {
  if (!now) { clearTimeout(saveTimer); saveTimer = setTimeout(() => save(true), 300); return; }
  const raw = pack();
  MEM = raw;
  try {
    const prev = localStorage.getItem(SAVE_KEY);
    if (prev) localStorage.setItem(SAVE_KEY + "_bak", prev);
    localStorage.setItem(SAVE_KEY, raw);
    saveFails = 0;
  } catch (e) { saveFails++; if (saveFails === 1) toast("⚠️ Couldn't save to storage — progress kept in memory. Export a backup in Settings."); }
  idbPut(raw);
}
let idb = null;
function idbOpen() { return new Promise(res => { try { const r = indexedDB.open("gembound", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => { idb = r.result; res(idb); }; r.onerror = () => res(null); } catch (e) { res(null); } }); }
function idbPut(raw) { try { if (!idb) return; idb.transaction("kv", "readwrite").objectStore("kv").put(raw, "save"); } catch (e) {} }
function idbGet() { return new Promise(res => { try { if (!idb) return res(null); const q = idb.transaction("kv").objectStore("kv").get("save"); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }); }
async function load() {
  await Promise.race([idbOpen(), sleep(400)]);
  const cands = [];
  try { cands.push(unpack(localStorage.getItem(SAVE_KEY))); cands.push(unpack(localStorage.getItem(SAVE_KEY + "_bak"))); } catch (e) {}
  try { cands.push(unpack(await Promise.race([idbGet(), sleep(400).then(() => null)]))); } catch (e) {}
  const ok = cands.filter(Boolean).sort((a, b) => (b.__at || 0) - (a.__at || 0));
  if (ok.length) { const s = ok[0]; delete s.__at; S = merge(freshState(), s); }
  let primaryBad = false;
  try { primaryBad = !!localStorage.getItem(SAVE_KEY) && !unpack(localStorage.getItem(SAVE_KEY)); } catch (e) {}
  return { recovered: primaryBad && ok.length > 0, fresh: !ok.length };
}
function track(ev) { if (!S.settings.privacy.analytics) return; S.analytics[ev] = (S.analytics[ev] || 0) + 1; }

/* ---------------- lives ---------------- */
function lifeTick() {
  const now = Date.now();
  if (S.lives >= MAX_LIVES) { S.lifeTs = now; return; }
  const gain = Math.floor((now - S.lifeTs) / REGEN_MS);
  if (gain > 0) {
    const before = S.lives;
    S.lives = Math.min(MAX_LIVES, S.lives + gain); S.lifeTs += gain * REGEN_MS;
    if (S.lives >= MAX_LIVES) S.lifeTs = now;
    if (S.lives > before && S.lives === MAX_LIVES && S.settings.notif.lives) { notifyDevice("Lives are full!", "Your 5 lives are ready — come restore the kingdom."); }
    save();
  }
}
function unlimited() { return Date.now() < S.unlimitedUntil; }
function nextLifeIn() { return S.lives >= MAX_LIVES ? 0 : REGEN_MS - (Date.now() - S.lifeTs); }
function loseLife() { if (unlimited()) return; if (S.lives >= MAX_LIVES) S.lifeTs = Date.now(); S.lives = Math.max(0, S.lives - 1); save(); }
function notifyDevice(title, body) {
  try { if (!NATIVE && "Notification" in window && Notification.permission === "granted" && document.hidden) new Notification(title, { body, icon: "icons/icon-192.png" }); } catch (e) {}
}

/* ---------------- economy / rewards ---------------- */
function addCoins(n) { S.coins += n; if (n > 0) S.stats.coinsEarned += n; }
function grant(r, why) {
  // r: {coins, crystals, booster:id|[ids], boosters:{id:n}, life:n, lives:n, unlimited:min, chest:type, item:id}
  const shown = [];
  if (!r) return shown;
  if (r.coins) { addCoins(r.coins); shown.push({ ico: A.coinSvg(), n: "+" + fmt(r.coins) }); }
  if (r.crystals) { S.crystals += r.crystals; shown.push({ ico: A.crystalSvg(), n: "+" + r.crystals }); }
  const bl = r.booster ? [].concat(r.booster) : [];
  for (const b of bl) { S.boosters[b] = (S.boosters[b] || 0) + 1; logBooster(b, +1, why); shown.push({ ico: A.boostPic(b, "ico"), n: "+1" }); }
  if (r.boosters) for (const b in r.boosters) { S.boosters[b] = (S.boosters[b] || 0) + r.boosters[b]; logBooster(b, r.boosters[b], why); shown.push({ ico: A.boostPic(b, "ico"), n: "+" + r.boosters[b] }); }
  const lv = r.life || r.lives;
  if (lv) { S.lives = Math.min(MAX_LIVES + 5, S.lives + lv); shown.push({ ico: A.heartPic(), n: "+" + lv }); }
  if (r.unlimited) { S.unlimitedUntil = Math.max(Date.now(), S.unlimitedUntil) + r.unlimited * 60000; shown.push({ e: "♾️", n: r.unlimited + "m" }); }
  if (r.chest) { shown.push({ ico: A.chestPic(r.chest, "ico"), n: D.CHESTS[r.chest].name }); queueChest(r.chest); }
  if (r.item) { if (unlockItem(r.item, why)) shown.push({ e: itemById(r.item).icon, n: "New!" }); }
  save(); refreshTop();
  return shown;
}
function rewardHTML(list) { return `<div class="rewards">${list.map((x, i) => `<div class="rw" style="animation-delay:${i * 0.08}s">${x.ico || `<span class="e">${x.e}</span>`}<span>${esc(x.n)}</span></div>`).join("")}</div>`; }
function rewardText(r) {
  const p = [];
  if (r.coins) p.push(fmt(r.coins) + " coins"); if (r.crystals) p.push(r.crystals + " crystals");
  if (r.booster) [].concat(r.booster).forEach(b => p.push(D.BOOSTERS[b].name));
  if (r.chest) p.push(D.CHESTS[r.chest].name); if (r.life || r.lives) p.push((r.life || r.lives) + " lives"); if (r.unlimited) p.push(r.unlimited + " min unlimited lives");
  if (r.item) p.push(itemById(r.item).name);
  return p.join(" + ");
}
function rewardIcon(r) { if (r.chest) return A.chestPic(r.chest, "ri"); if (r.crystals) return A.crystalSvg().replace('class="ico"', 'class="ico ri"'); if (r.booster) return A.boostPic([].concat(r.booster)[0], "ri"); if (r.item) return itemById(r.item).icon; return A.coinSvg().replace('class="ico"', 'class="ico ri"'); }
function logBooster(id, n, why) { S.boosterLog.unshift({ id, n, why: why || "", at: Date.now() }); S.boosterLog.length = Math.min(S.boosterLog.length, 60); }
async function spend(cur, amount, what) {
  const have = cur === "coins" ? S.coins : S.crystals;
  const label = cur === "coins" ? `${fmt(amount)} coins` : `${amount} crystals`;
  if (have < amount) { await alertBox("Not enough " + (cur === "coins" ? "coins" : "crystals"), `${what} costs ${label}. You have ${fmt(have)}.<br><br>${cur === "coins" ? "Earn coins by winning levels, missions, events and the free gift in the Shop." : "Earn crystals from achievements, daily rewards, events and three-star wins."}`); return false; }
  const scarce = cur === "crystals" || amount >= 500;
  if (S.settings.confirmSpend || scarce) {
    const ok = await confirmBox("Confirm purchase", `${esc(what)}<br><br>Cost: <b>${label}</b><br><small>You have ${fmt(have)}. After: ${fmt(have - amount)}</small>`, "Buy");
    if (!ok) return false;
  }
  if (cur === "coins") S.coins -= amount; else S.crystals -= amount;
  track("spend_" + cur); save(); refreshTop();
  return true;
}

/* ---------------- items / unlocks ---------------- */
function itemById(id) { return D.ITEMS.find(i => i.id === id) || { icon: "❔", name: id }; }
function totalStars() { let n = 0; for (const k in S.best) n += S.best[k].stars || 0; return n; }
function regionsDone() { return Math.min(D.REGIONS.length, Math.floor((S.level - 1) / D.PER_REGION)); }
function ruleOK(u) {
  if (!u) return false;
  switch (u.t) {
    case "start": return true;
    case "region": return regionsDone() >= u.n;
    case "stars": return totalStars() >= u.n;
    case "level": return S.level > u.n;
    case "ach": return !!S.ach[u.id];
    default: return false;
  }
}
function ruleText(u) {
  switch (u.t) {
    case "start": return "Unlocked from the start";
    case "region": return `Complete ${D.REGIONS[u.n - 1].name}`;
    case "stars": return `Collect ${u.n} stars`;
    case "level": return `Pass level ${u.n}`;
    case "ach": return `Achievement: ${(D.ACH.find(a => a.id === u.id) || {}).name}`;
    case "shop": return `Buy in the Shop for ${u.p} 💎`;
    case "chest": return "Found in treasure chests";
    case "event": return "Event milestone reward";
  }
  return "";
}
function unlockItem(id, why) {
  if (S.items[id]) return false;
  S.items[id] = Date.now();
  const it = itemById(id);
  if (why !== "silent") { inbox({ t: "ach", title: "New collectible!", body: `${it.icon} ${it.name} was added to your Collection.` }); if (S.settings.notif.ach) toast(`${it.icon} New collectible: ${it.name}`); }
  return true;
}
function checkUnlocks() {
  for (const it of D.ITEMS) if (!S.items[it.id] && ruleOK(it.unlock)) unlockItem(it.id, S.created > Date.now() - 2000 ? "silent" : "");
  // achievements
  const st = statSnapshot();
  for (const a of D.ACH) if (!S.ach[a.id] && (st[a.stat] || 0) >= a.n) {
    S.ach[a.id] = { at: Date.now(), claimed: false };
    if (S.settings.notif.ach) toast(`🏆 Achievement unlocked: ${a.name}`);
    inbox({ t: "ach", title: "Achievement unlocked", body: `${a.name} — ${a.desc} Claim your reward in Achievements.` });
    SND.play("reward");
  }
}
function statSnapshot() { return Object.assign({}, S.stats, { level: S.level, regions: regionsDone(), restoredRegions: Object.keys(S.restoredRegions).length }); }

/* ---------------- chests ---------------- */
const chestQueue = [];
function queueChest(type) { chestQueue.push(type); }
function rollChest(type) {
  const C = D.CHESTS[type]; const out = {};
  const total = C.table.reduce((a, r) => a + r[2], 0);
  for (let i = 0; i < C.rolls; i++) {
    let x = Math.random() * total;
    for (const [k, v, w] of C.table) {
      if ((x -= w) <= 0) {
        if (k === "coins") out.coins = (out.coins || 0) + v;
        else if (k === "crystals") out.crystals = (out.crystals || 0) + v;
        else if (k === "life") out.lives = (out.lives || 0) + v;
        else if (k === "unlimited") out.unlimited = (out.unlimited || 0) + v;
        else if (k === "booster") { const pool = ["hammer", "saber", "bomb", "prism", "shuffle", "pre_beam", "pre_core", "pre_orb", "moves5"]; out.boosters = out.boosters || {}; for (let j = 0; j < v; j++) { const b = pool[Math.floor(Math.random() * pool.length)]; out.boosters[b] = (out.boosters[b] || 0) + 1; } }
        else if (k === "card") { const locked = D.ITEMS.filter(it => it.unlock.t === "chest" && !S.items[it.id]); if (locked.length) out.item = locked[Math.floor(Math.random() * locked.length)].id; else out.coins = (out.coins || 0) + 100; }
        break;
      }
    }
  }
  return out;
}
async function openChests() {
  while (chestQueue.length) {
    const type = chestQueue.shift(); const C = D.CHESTS[type];
    S.stats.chests++;
    const r = rollChest(type);
    await new Promise(res => {
      const m = modal({ title: C.name, html: `<div class="chestbig">${A.chestPic(type)}</div><p style="text-align:center" class="muted">Opening…</p>`, buttons: [], noClose: true });
      setTimeout(() => {
        SND.play("reward");
        const shown = grant(r, C.name);
        m.set(`<div class="chestbig open">${A.chestPic("open")}</div>${rewardHTML(shown)}<p class="muted" style="text-align:center"><a href="#" data-odds="${type}" style="color:#fff3c8">See drop rates</a></p>`, [{ label: "Collect", cls: "gold", onClick: () => { m.close(); res(); } }]);
        $("[data-odds]", m.el).onclick = e => { e.preventDefault(); showOdds(type); };
      }, S.settings.quick || S.settings.reducedMotion ? 300 : 1500);
    });
    checkUnlocks(); save();
  }
}
function showOdds(type) {
  const C = D.CHESTS[type]; const total = C.table.reduce((a, r) => a + r[2], 0);
  const names = { coins: "Coins", booster: "Booster(s)", life: "Lives", crystals: "Crystals", card: "Collection card", unlimited: "Unlimited lives (min)" };
  modal({ title: C.name, html: `<div class="inner"><p><b>${C.rolls} rewards</b> per chest. Each reward is rolled independently:</p>${C.table.map(([k, v, w]) => `<div class="row"><span class="grow">${names[k]} ×${v}</span><b>${Math.round(w / total * 100)}%</b></div>`).join("")}<p class="muted">Collection cards only drop items you don't own yet; if you own them all you get 100 coins instead. Chests are never sold for real money.</p></div>` });
}

/* ---------------- inbox ---------------- */
function inbox(msg) {
  S.inbox.unshift(Object.assign({ id: Math.random().toString(36).slice(2), at: Date.now(), read: false, claimed: false }, msg));
  S.inbox.length = Math.min(S.inbox.length, 50); save();
  refreshBadges();
}

/* ---------------- missions ---------------- */
function pickN(arr, n, seed) { const r = E.mulberry32(seed); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); }
function ensureMissions() {
  const dk = todayKey(), wk = weekKey();
  const st = S.stats;
  if (S.missions.day !== dk) {
    S.missions.day = dk;
    S.missions.daily = pickN(D.DAILY_POOL, 3, +dk.replace(/-/g, "")).map(m => ({ id: m.id, base: st[m.stat] || 0, claimed: false }));
  }
  if (S.missions.week !== wk) {
    if (S.missions.weekly.length && S.missions.weekly.every(m => m.claimed)) {} // counted when claimed
    S.missions.week = wk;
    S.missions.weekly = D.WEEKLY_POOL.map(m => ({ id: m.id, base: st[m.stat] || 0, claimed: false }));
  }
}
function missionInfo(m, pool) { const def = pool.find(x => x.id === m.id); const prog = Math.min(def.n, (S.stats[def.stat] || 0) - m.base); return { def, prog, done: prog >= def.n }; }
function claimMission(kind, idx) {
  const arr = kind === "daily" ? S.missions.daily : S.missions.weekly;
  const pool = kind === "daily" ? D.DAILY_POOL : D.WEEKLY_POOL;
  const m = arr[idx]; const I = missionInfo(m, pool);
  if (!I.done || m.claimed) return;
  m.claimed = true;
  const shown = grant(I.def.reward, "Mission");
  S.missions.log.unshift({ text: I.def.text, reward: rewardText(I.def.reward), at: Date.now() }); S.missions.log.length = Math.min(30, S.missions.log.length);
  if (kind === "weekly" && arr.every(x => x.claimed)) S.stats.weeklyAll++;
  SND.play("reward");
  modal({ title: "Mission complete!", html: rewardHTML(shown), buttons: [{ label: "Great!", cls: "gold" }] });
  checkUnlocks(); save(); openChests();
}

/* ---------------- events ---------------- */
function eventState(ev) { if (!S.events[ev.key]) S.events[ev.key] = { pts: 0, claimed: [], name: ev.name, end: ev.end }; return S.events[ev.key]; }
function awardEvents(run) {
  // run: deltas from the level just played
  let gained = 0;
  for (const ev of D.activeEvents()) {
    if (ev.tournament) continue;
    const es = eventState(ev);
    let v = run[ev.stat] || 0;
    let pts = Math.floor(v / (ev.per || 1)) * (ev.mult || 1);
    if (ev.id === "expedition" && run.wins && S.stats.streak >= 3) pts *= 2;
    if (pts > 0) { es.pts += pts; gained += pts; }
  }
  S.stats.eventPts += gained;
  return gained;
}
function claimMilestone(ev, i) {
  const es = eventState(ev); const M = D.EVENT_MILESTONES[i];
  if (es.pts < M.pts || es.claimed.includes(i)) return;
  es.claimed.push(i);
  const shown = grant(M.r, ev.name);
  SND.play("reward");
  modal({ title: ev.icon + " Milestone!", html: rewardHTML(shown), buttons: [{ label: "Collect", cls: "gold" }] });
  save(); openChests(); renderPage();
}

/* ---------------- daily reward ---------------- */
function dailyStatus() {
  const d = S.daily, tk = todayKey();
  if (d.last === tk) return { can: false, day: d.day, streak: d.streak };
  const y = new Date(); y.setDate(y.getDate() - 1);
  const cont = d.last === todayKey(y);
  const day = cont ? (d.day % 7) + 1 : 1;
  return { can: true, day, streak: cont ? d.streak + 1 : 1, reset: !!d.last && !cont };
}
function claimDaily() {
  const st = dailyStatus(); if (!st.can) return null;
  S.daily = { last: todayKey(), day: st.day, streak: st.streak };
  S.stats.dailyClaims++; S.stats.bestLoginStreak = Math.max(S.stats.bestLoginStreak, st.streak);
  S.stats.bestStreak = Math.max(S.stats.bestStreak, 0);
  const r = D.DAILY[st.day - 1];
  const shown = grant(r, "Daily reward");
  // streak milestones
  if (st.streak % 14 === 0) shown.push(...grant({ crystals: 10 }, "Streak bonus"));
  checkUnlocks(); save();
  return shown;
}

/* ---------------- UI helpers ---------------- */
function toast(msg) { const el = document.createElement("div"); el.className = "toast"; el.innerHTML = msg; $("#toast-root").appendChild(el); setTimeout(() => el.remove(), 2900); srSay(el.textContent); }
function srSay(text) { const l = $("#sr-live"); if (l) { l.textContent = ""; setTimeout(() => (l.textContent = text), 30); } }
const modalStack = [];
function modal({ title = "", html = "", buttons, onClose, noClose, cls = "" }) {
  const back = document.createElement("div"); back.className = "mback";
  back.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title.replace(/<[^>]+>/g, ""))}">${noClose ? "" : '<button class="mx" aria-label="Close">✕</button>'}<h2>${title}</h2><div class="mc">${html}</div><div class="mb"></div></div>`;
  $("#modal-root").appendChild(back);
  const api = {
    el: back,
    close(v) { if (api.closed) return; api.closed = true; back.remove(); const i = modalStack.indexOf(api); if (i >= 0) modalStack.splice(i, 1); onClose && onClose(v); },
    set(h, btns) { $(".mc", back).innerHTML = h; setBtns(btns); },
    noClose,
  };
  function setBtns(btns) {
    const mb = $(".mb", back); mb.innerHTML = "";
    (btns || []).forEach(b => { const x = document.createElement("button"); x.className = "btn " + (b.cls || ""); x.innerHTML = b.label; x.onclick = () => { SND.play("click"); if (b.onClick) b.onClick(api); else api.close(b.value); }; mb.appendChild(x); });
  }
  setBtns(buttons === undefined ? [{ label: t("Close"), cls: "blue" }] : buttons);
  if (!noClose) { $(".mx", back).onclick = () => { SND.play("click"); api.close(); }; back.addEventListener("click", e => { if (e.target === back) api.close(); }); }
  modalStack.push(api);
  setTimeout(() => { const f = $("button", back); f && f.focus({ preventScroll: true }); }, 50);
  return api;
}
function confirmBox(title, html, ok = "OK", danger) { return new Promise(res => { modal({ title, html: `<div class="inner">${html}</div>`, buttons: [{ label: "Cancel", cls: "ghost", value: false }, { label: ok, cls: danger ? "red" : "gold", value: true }], onClose: v => res(!!v) }); }); }
function alertBox(title, html) { return new Promise(res => modal({ title, html: `<div class="inner">${html}</div>`, onClose: () => res() })); }
function confetti() {
  if (S.settings.reducedMotion || !S.settings.particles) return;
  const c = document.createElement("div"); c.className = "confetti";
  const cols = ["#F4C75E", "#EF826F", "#39A879", "#8866C8", "#2859A8", "#fff"];
  for (let i = 0; i < 70; i++) { const p = document.createElement("i"); p.style.left = Math.random() * 100 + "%"; p.style.background = cols[i % 6]; p.style.animationDelay = Math.random() * 0.8 + "s"; p.style.animationDuration = 1.8 + Math.random() * 1.4 + "s"; c.appendChild(p); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 4000);
}
function vibe(ms, kind) { if (!S.settings[kind === "haptic" ? "haptic" : "vibrate"]) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
function sw(id, on, label, sub) { return `<div class="it"><label for="${id}">${label}${sub ? `<small>${sub}</small>` : ""}</label><span class="sw"><input type="checkbox" id="${id}" ${on ? "checked" : ""}><span></span></span></div>`; }
function bar(p, label) { return `<div class="bar"><i style="width:${Math.round(Math.min(1, p) * 100)}%"></i><span>${label}</span></div>`; }
function frameCss(id) { return (D.FRAMES.find(f => f.id === id) || D.FRAMES[0]).css; }

/* ---------------- settings application ---------------- */
function applySettings() {
  const st = S.settings, cl = document.documentElement.classList, app = $("#app");
  let q = st.quality;
  if (q === "auto") q = (navigator.deviceMemory && navigator.deviceMemory < 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ? "low" : "high";
  const lowFx = q === "low" || st.reducedFx;
  app.classList.toggle("anim", st.bgAnim && !st.reducedMotion && q !== "low");
  app.classList.toggle("noparticles", !st.particles || lowFx || st.reducedMotion);
  app.classList.toggle("rm", st.reducedMotion);
  app.classList.toggle("hc", st.contrast);
  app.classList.toggle("big", st.bigText);
  app.classList.toggle("cb", st.colorblind);
  app.classList.toggle("glyphs", st.glyphs || st.colorblind);
  app.classList.toggle("lefty", st.lefty);
  document.documentElement.style.setProperty("--fs", st.bigText ? "19px" : "16px");
  document.documentElement.style.setProperty("--speed", String((st.quick ? 0.55 : 1) / st.speed));
  document.documentElement.lang = st.lang === "nb" ? "nb" : st.lang;
  SND.set({ master: st.master, music: st.music, sfx: st.sfx, voice: st.voice, mute: st.mute });
  $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
}
const animMs = ms => Math.round(ms * (S.settings.quick ? 0.55 : 1) / S.settings.speed * (S.settings.reducedMotion ? 0.4 : 1));
