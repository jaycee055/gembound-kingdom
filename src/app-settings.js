/* ===== Gembound Kingdom — settings ===== */
PAGES.settings = (sec) => {
  const s = S.settings;
  const range = (id, v, label) => `<div class="it"><label for="${id}">${label}</label><input type="range" id="${id}" min="0" max="100" value="${Math.round(v * 100)}"><b style="width:38px;text-align:right" id="${id}_v">${Math.round(v * 100)}</b></div>`;
  const btn = (id, label, cls = "blue", sub) => `<div class="it"><label>${label}${sub ? `<small>${sub}</small>` : ""}</label><button class="btn sm ${cls}" id="${id}">${label.split(" ")[0] === "Delete" ? "Delete" : "Open"}</button></div>`;
  const act = (id, label, b, cls = "blue", sub) => `<div class="it"><label>${label}${sub ? `<small>${sub}</small>` : ""}</label><button class="btn sm ${cls}" id="${id}">${b}</button></div>`;
  const html = `
  <div class="card set"><h4>👤 Account</h4>
    <div class="it"><label for="st_name">Player name</label><input class="inp" id="st_name" maxlength="16" value="${esc(S.name)}"></div>
    ${act("st_avatar", "Profile avatar " + S.avatar, "Change")}
    <div class="it"><label>Account details<small>Local player · ID ${S.pid} · since ${new Date(S.created).toLocaleDateString()}</small></label></div>
    <div class="it"><label>Account sync & sign-in<small>No login by design. Your progress lives on this device. Use backups to move it.</small></label><span class="badge" style="background:#8a86a8">Off</span></div>
    ${act("st_export", "Export backup file", "Export", "gold", "Saves all progress as a .json file")}
    ${act("st_import", "Restore from backup", "Import", "blue")}
    <input type="file" id="st_file" accept=".json,application/json" hidden>
    <div class="it"><label>Sign out<small>Not needed — there is no account to sign out of.</small></label></div>
    ${act("st_delete", "Delete all game data", "Delete", "red", "Erases your progress on this device")}
  </div>
  <div class="card set"><h4>🔊 ${t("Audio")}</h4>
    ${range("st_master", s.master, "Master volume")}${range("st_music", s.music, "Music")}${range("st_sfx", s.sfx, "Sound effects")}${range("st_voice", s.voice, "Character voices")}
    ${sw("st_mute", s.mute, "Mute all")}
  </div>
  <div class="card set"><h4>🎨 ${t("Graphics")}</h4>
    <div class="it"><label>Quality<small>Auto picks Low on slower devices</small></label><div class="seg" id="st_quality">${["auto", "low", "medium", "high"].map(q => `<button data-q="${q}" class="${s.quality === q ? "on" : ""}">${q[0].toUpperCase() + q.slice(1)}</button>`).join("")}</div></div>
    ${sw("st_particles", s.particles, "Particle effects")}${sw("st_bgAnim", s.bgAnim, "Background animations")}${sw("st_shake", s.shake, "Screen shake")}${sw("st_reducedFx", s.reducedFx, "Reduced visual effects")}
  </div>
  <div class="card set"><h4>🎮 ${t("Gameplay")}</h4>
    ${sw("st_vibrate", s.vibrate, "Vibration", "Big moments like explosions and wins")}${sw("st_haptic", s.haptic, "Haptic feedback", "Light taps on swaps and buttons")}
    ${act("st_tut", "Replay tutorial", "Replay")}
    ${sw("st_confirmSpend", s.confirmSpend, "Confirm before spending coins", "Crystal purchases always ask")}
    ${sw("st_quick", s.quick, "Quick animations")}
    ${sw("st_autoPower", s.autoPower, "One-tap power-ups", "Tap a power-up once to fire it")}
    ${sw("st_hints", s.hints, "Gameplay hints", "Shows a possible move after 6 seconds")}
    ${sw("st_lefty", s.lefty, "Left-handed layout", "Mirrors boosters and side buttons")}
  </div>
  <div class="card set"><h4>♿ ${t("Accessibility")}</h4>
    ${sw("st_colorblind", s.colorblind, "Colorblind-friendly mode", "Shifts gem colors and shows symbols")}
    ${sw("st_glyphs", s.glyphs, "Alternative shape indicators", "Symbol on every gem")}
    ${sw("st_contrast", s.contrast, "High contrast")}${sw("st_bigText", s.bigText, "Larger text")}${sw("st_reducedMotion", s.reducedMotion, "Reduced motion")}
    ${sw("st_sr", s.sr, "Screen reader announcements", "Reads matches and objectives aloud. Arrow keys + Enter also play the board.")}
    <div class="it"><label for="st_speed">Animation speed</label><input type="range" id="st_speed" min="50" max="200" step="10" value="${Math.round(s.speed * 100)}"><b style="width:38px;text-align:right" id="st_speed_v">${s.speed.toFixed(1)}×</b></div>
  </div>
  <div class="card set"><h4>🔔 ${t("Notifications")}</h4>
    ${sw("nt_daily", s.notif.daily, "Daily reward reminders")}${sw("nt_events", s.notif.events, "Event reminders")}${sw("nt_lives", s.notif.lives, "Life refill notifications")}${sw("nt_friends", s.notif.friends, "Friend activity")}${sw("nt_team", s.notif.team, "Team activity")}${sw("nt_ach", s.notif.ach, "Achievement notifications")}
    ${!NATIVE && "Notification" in window ? act("st_perm", "Device notifications", Notification.permission === "granted" ? "Allowed" : "Allow", "blue", "Shown while the game is open in the background. Push reminders need a server.") : `<div class="it"><label>Device notifications<small>Messages appear in your in-game Inbox.</small></label></div>`}
  </div>
  <div class="card set"><h4>🌐 ${t("Language")}</h4>
    <div class="it"><label for="st_lang">Language</label><select id="st_lang">${D.LANGS.map(([k, n]) => `<option value="${k}" ${s.lang === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <p class="muted">Menus and buttons are translated; some longer texts are still in English.</p>
  </div>
  <div class="card set"><h4>🔒 Privacy & Security</h4>
    <div class="it"><label>Privacy policy</label><a class="btn sm blue" href="privacy.html" target="_blank" rel="noopener">Open</a></div>
    <div class="it"><label>Terms of service</label><a class="btn sm blue" href="privacy.html#terms" target="_blank" rel="noopener">Open</a></div>
    ${sw("st_analytics", s.privacy.analytics, "On-device play statistics", "Counts kept only on this device. Nothing is ever sent anywhere.")}
    ${act("st_export2", "Export personal data", "Export", "blue")}
    ${act("st_delete2", "Delete account data", "Delete", "red")}
    <div class="it"><label>Cookies<small>This game uses no cookies or trackers.</small></label></div>
  </div>
  <div class="card set"><h4>💬 Support</h4>
    ${act("st_help", "Help center & FAQ", "Open")}
    <div class="it"><label>Report a problem / Contact support</label><a class="btn sm blue" href="${ISSUES_URL}" target="_blank" rel="noopener">Open</a></div>
    <div class="it"><label>Game version</label><b>${VERSION}</b></div>
    ${act("st_credits", "Credits", "View")}
  </div>
  <div class="card set"><h4>⚙️ General</h4>
    ${!standalone() ? act("st_install", "Install the app", IOS ? "How?" : deferredPrompt ? "Install" : (ANDROID || !IOS) ? "Android APK" : "How?", "gold") : ""}
    ${act("st_resetPrefs", "Reset preferences", "Reset", "blue")}
    ${act("st_cache", "Clear local cache", "Clear", "blue", "Removes downloaded files; progress is kept")}
    ${act("st_resetTut", "Reset tutorial", "Reset", "blue")}
    ${act("st_about", "About the game", "About", "blue")}
  </div>`;
  return { title: "⚙️ " + t("Settings"), html, wire: wireSettings };
};
function wireSettings(el) {
  const s = S.settings;
  const done = () => { save(); applySettings(); };
  $("#st_name", el).onchange = e => { S.name = e.target.value.trim().replace(/[<>]/g, "").slice(0, 16) || "Player"; save(); refreshTop(); toast("Name saved"); };
  $("#st_avatar", el).onclick = () => go("profile", "avatar");
  ["master", "music", "sfx", "voice"].forEach(k => { const r = $("#st_" + k, el); r.oninput = () => { s[k] = r.value / 100; $("#st_" + k + "_v", el).textContent = r.value; applySettings(); }; r.onchange = () => { save(); SND.play("match", 2); }; });
  const bools = ["mute", "particles", "bgAnim", "shake", "reducedFx", "vibrate", "haptic", "confirmSpend", "quick", "autoPower", "hints", "lefty", "colorblind", "glyphs", "contrast", "bigText", "reducedMotion", "sr"];
  bools.forEach(k => { const c = $("#st_" + k, el); if (c) c.onchange = () => { s[k] = c.checked; if (k === "vibrate" && c.checked) vibe(60); done(); }; });
  ["daily", "events", "lives", "friends", "team", "ach"].forEach(k => { const c = $("#nt_" + k, el); c.onchange = () => { s.notif[k] = c.checked; save(); }; });
  $("#st_analytics", el).onchange = e => { s.privacy.analytics = e.target.checked; if (!e.target.checked) S.analytics = {}; save(); };
  $$("#st_quality button", el).forEach(b => b.onclick = () => { s.quality = b.dataset.q; done(); renderPage(); });
  const sp = $("#st_speed", el); sp.oninput = () => { s.speed = sp.value / 100; $("#st_speed_v", el).textContent = s.speed.toFixed(1) + "×"; applySettings(); }; sp.onchange = save;
  $("#st_lang", el).onchange = e => { s.lang = e.target.value; done(); buildChrome(); refreshTop(); renderPage(); };
  const perm = $("#st_perm", el); if (perm) perm.onclick = async () => { try { const r = await Notification.requestPermission(); toast(r === "granted" ? "Notifications allowed" : "Notifications not allowed"); renderPage(); } catch (e) {} };
  $("#st_export", el).onclick = exportBackup; $("#st_export2", el).onclick = exportBackup;
  $("#st_import", el).onclick = () => $("#st_file", el).click();
  $("#st_file", el).onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const txt = await f.text(); const o = JSON.parse(txt);
      const data = o.game === "gembound-kingdom" ? o.state : null;
      if (!data || typeof data.level !== "number") throw new Error("bad");
      if (!(await confirmBox("Restore backup?", `This replaces your current progress (level ${S.level}) with the backup (level ${data.level}, saved ${new Date(o.at).toLocaleString()}).`, "Restore", true))) return;
      S = merge(freshState(), data); save(true); applySettings(); buildChrome(); refreshTop(); toast("✅ Backup restored"); go("home");
    } catch (err) { alertBox("Couldn't restore", "That file isn't a Gembound Kingdom backup."); }
  };
  const del = async () => {
    if (!(await confirmBox("Delete all data?", "This permanently erases your levels, stars, coins, crystals, collection and settings on this device. It can't be undone.<br><br>Tip: export a backup first.", "Delete everything", true))) return;
    if (!(await confirmBox("Are you absolutely sure?", "Last chance — everything will be reset to a brand-new game.", "Yes, delete", true))) return;
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_KEY + "_bak"); } catch (e) {}
    try { idb && idb.transaction("kv", "readwrite").objectStore("kv").delete("save"); } catch (e) {}
    S = freshState(); checkUnlocks(); save(true); applySettings(); buildChrome(); refreshTop(); toast("All data deleted"); go("home");
  };
  $("#st_delete", el).onclick = del; $("#st_delete2", el).onclick = del;
  $("#st_tut", el).onclick = () => { S.flags.tut = {}; save(); levelStart(1); };
  $("#st_help", el).onclick = () => go("help");
  $("#st_credits", el).onclick = () => go("help", "support");
  const ins = $("#st_install", el); if (ins) ins.onclick = async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; renderPage(); return; }
    if (IOS) return alertBox("Install on iPhone / iPad", "1. Open this page in <b>Safari</b>.<br>2. Tap the <b>Share</b> button ⬆️.<br>3. Choose <b>Add to Home Screen</b>.<br><br>The game then opens full-screen and works offline.");
    modal({ title: "📲 Install", html: `<div class="inner"><p><b>Android:</b> download the app (APK) and open it to install. You may need to allow installs from your browser.</p><p><b>Computer:</b> in Chrome or Edge, use the install icon in the address bar.</p></div>`, buttons: [{ label: "Download Android APK", cls: "gold", onClick: () => { location.href = APK_URL; } }, { label: t("Close"), cls: "blue" }] });
  };
  $("#st_resetPrefs", el).onclick = async () => { if (await confirmBox("Reset preferences?", "Sound, graphics, gameplay, accessibility, notification and language settings go back to default. Progress is kept.", "Reset")) { S.settings = freshState().settings; done(); buildChrome(); refreshTop(); renderPage(); } };
  $("#st_cache", el).onclick = async () => { if (!(await confirmBox("Clear cache?", "Downloaded game files are removed and fetched again next time you're online. Your progress is kept.", "Clear"))) return; try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); toast("Cache cleared"); } catch (e) { toast("Nothing to clear"); } };
  $("#st_resetTut", el).onclick = async () => { if (await confirmBox("Reset tutorial?", "Tutorial tips, new-obstacle cards and story scenes will show again.", "Reset")) { S.flags.tut = {}; S.flags.seenOb = {}; S.flags.story = {}; S.flags.starTip = false; save(); toast("Tutorial reset"); } };
  $("#st_about", el).onclick = () => modal({ title: "👑 Gembound Kingdom", html: `<div class="inner"><p>An original fantasy match-3 adventure. Help Prince Aurelio and Lumi the Gemcat restore eight regions by solving ${D.MAX_LEVEL} puzzles, defeating bosses and rebuilding the kingdom.</p><p class="muted">Version ${VERSION}. Free to play, no real-money purchases, no accounts, no ads, no tracking.</p></div>` });
}
async function exportBackup() {
  save(true);
  const data = JSON.stringify({ game: "gembound-kingdom", version: VERSION, at: Date.now(), state: S }, null, 1);
  const name = `gembound-backup-${todayKey()}.json`;
  try {
    if (NATIVE && PLUG.Filesystem) {
      const b64 = btoa(unescape(encodeURIComponent(data)));
      await PLUG.Filesystem.writeFile({ path: name, data: b64, directory: "DOCUMENTS", recursive: true });
      if (PLUG.Share) { const w = await PLUG.Filesystem.writeFile({ path: name, data: b64, directory: "CACHE" }); await PLUG.Share.share({ title: "Gembound backup", files: [w.uri] }).catch(() => {}); }
      toast("Backup saved to Documents"); return;
    }
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast("Backup downloaded");
  } catch (e) { alertBox("Export failed", "Couldn't create the backup file on this device."); }
}
