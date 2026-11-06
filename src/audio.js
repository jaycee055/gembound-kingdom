/* ===== Gembound Kingdom — original synthesized audio (no recorded assets) ===== */
(function (root) {
"use strict";
let ctx = null, master, music, sfx, voice, started = false, musicTimer = null, musicMode = null, nextT = 0, step = 0;
const vol = { master: 0.8, music: 0.5, sfx: 0.8, voice: 0.7, mute: false };
function ensure() {
  if (ctx) return ctx;
  const AC = root.AudioContext || root.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.connect(ctx.destination);
  music = ctx.createGain(); music.connect(master);
  sfx = ctx.createGain(); sfx.connect(master);
  voice = ctx.createGain(); voice.connect(master);
  apply();
  return ctx;
}
function apply() {
  if (!ctx) return;
  master.gain.value = vol.mute ? 0 : vol.master;
  music.gain.value = vol.music * 0.35;
  sfx.gain.value = vol.sfx * 0.6;
  voice.gain.value = vol.voice * 0.5;
}
function set(v) { Object.assign(vol, v); apply(); }
function unlock() { const c = ensure(); if (c && c.state === "suspended") c.resume(); started = true; }
const f = n => 440 * Math.pow(2, (n - 69) / 12);
function tone(bus, freq, t, dur, type = "sine", gain = 0.3, attack = 0.005, slideTo) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(bus, t, dur, gain = 0.3, freq = 1200, q = 0.7, type = "lowpass") {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
  const g = ctx.createGain(); g.gain.value = gain;
  s.connect(fl); fl.connect(g); g.connect(bus); s.start(t);
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
function play(name, arg = 0) {
  if (!ensure() || !started) return;
  const t = ctx.currentTime + 0.01;
  switch (name) {
    case "click": tone(sfx, 880, t, 0.06, "triangle", 0.15); break;
    case "select": tone(sfx, 660, t, 0.08, "triangle", 0.18); tone(sfx, 990, t + 0.03, 0.06, "sine", 0.1); break;
    case "swap": noise(sfx, t, 0.12, 0.15, 2500, 1, "bandpass"); break;
    case "invalid": tone(sfx, 220, t, 0.12, "square", 0.08); tone(sfx, 180, t + 0.1, 0.14, "square", 0.08); break;
    case "match": { const n = 72 + PENTA[Math.min(arg, PENTA.length - 1)]; tone(sfx, f(n), t, 0.25, "triangle", 0.25); tone(sfx, f(n + 12), t, 0.18, "sine", 0.12); break; }
    case "create": tone(sfx, f(84), t, 0.3, "sine", 0.2, 0.005, f(96)); tone(sfx, f(91), t + 0.06, 0.3, "triangle", 0.15); break;
    case "beam": tone(sfx, 300, t, 0.35, "sawtooth", 0.1, 0.005, 2400); noise(sfx, t, 0.3, 0.12, 4000, 0.5, "highpass"); break;
    case "boom": noise(sfx, t, 0.6, 0.5, 600, 0.8); tone(sfx, 120, t, 0.5, "sine", 0.4, 0.005, 40); break;
    case "orb": [0, 4, 7, 12, 16, 19, 24].forEach((k, i) => tone(sfx, f(76 + k), t + i * 0.04, 0.3, "sine", 0.12)); break;
    case "spark": tone(sfx, f(96), t, 0.2, "sine", 0.12, 0.005, f(108)); tone(sfx, f(100), t + 0.08, 0.2, "triangle", 0.1); break;
    case "crack": noise(sfx, t, 0.12, 0.25, 1800, 2, "bandpass"); break;
    case "break": noise(sfx, t, 0.25, 0.3, 900, 1.2, "bandpass"); tone(sfx, f(60), t, 0.15, "square", 0.06); break;
    case "relic": [0, 7, 12, 16].forEach((k, i) => tone(sfx, f(79 + k), t + i * 0.07, 0.4, "triangle", 0.15)); break;
    case "coin": tone(sfx, f(93), t, 0.08, "square", 0.06); tone(sfx, f(100), t + 0.07, 0.2, "square", 0.06); break;
    case "reward": [0, 4, 7, 12].forEach((k, i) => tone(sfx, f(72 + k), t + i * 0.08, 0.35, "triangle", 0.18)); break;
    case "win": [0, 4, 7, 12, 7, 12, 16, 19].forEach((k, i) => tone(sfx, f(67 + k), t + i * 0.12, 0.4, "triangle", 0.2)); [0, 4, 7].forEach(k => tone(sfx, f(55 + k), t + 0.96, 1.2, "sine", 0.12)); break;
    case "lose": [7, 5, 3, 0].forEach((k, i) => tone(sfx, f(64 + k), t + i * 0.18, 0.4, "triangle", 0.15)); break;
    case "shuffle": for (let i = 0; i < 8; i++) tone(sfx, f(70 + (i * 5) % 12), t + i * 0.04, 0.1, "triangle", 0.08); break;
    case "boss": tone(sfx, 90, t, 0.8, "sawtooth", 0.15, 0.05, 60); noise(sfx, t, 0.6, 0.15, 300); break;
    case "voice": { // cute syllable chatter for character reactions
      const base = arg === 1 ? 74 : 64;
      for (let i = 0; i < 4; i++) tone(voice, f(base + [0, 4, 2, 7][i]), t + i * 0.07, 0.08, "square", 0.08, 0.005, f(base + [2, 7, 4, 9][i]));
      break;
    }
  }
}
// gentle generative music
const SONGS = {
  menu: { bpm: 84, chords: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]] },
  puzzle: { bpm: 100, chords: [[62, 65, 69, 72], [58, 62, 65, 69], [60, 64, 67, 70], [57, 61, 64, 69]] },
};
function scheduler() {
  if (!ctx || !musicMode) return;
  const S = SONGS[musicMode], spb = 60 / S.bpm / 2;
  while (nextT < ctx.currentTime + 0.3) {
    const bar = Math.floor(step / 8) % S.chords.length, ch = S.chords[bar], k = step % 8;
    if (k === 0) { ch.forEach(n => tone(music, f(n - 12), nextT, spb * 8, "sine", 0.06, 0.4)); tone(music, f(ch[0] - 24), nextT, spb * 4, "triangle", 0.12, 0.02); }
    if (k === 4) tone(music, f(ch[0] - 24 + 7), nextT, spb * 4, "triangle", 0.09, 0.02);
    const arp = [0, 2, 1, 3, 2, 1, 3, 2][k];
    tone(music, f(ch[arp] + 12), nextT, spb * 1.6, "triangle", 0.05, 0.01);
    if (k % 2 === 0 && Math.random() < 0.3) tone(music, f(ch[(arp + 1) % 4] + 24), nextT, spb, "sine", 0.025);
    nextT += spb; step++;
  }
}
function setMusic(mode) {
  if (!ensure()) return;
  if (mode === musicMode) return;
  musicMode = mode; step = 0; nextT = ctx.currentTime + 0.1;
  if (!musicTimer) musicTimer = setInterval(scheduler, 100);
  if (!mode) { clearInterval(musicTimer); musicTimer = null; }
}
root.GKAudio = { play, set, unlock, setMusic, vol };
})(typeof window !== "undefined" ? window : globalThis);
