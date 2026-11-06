/* ===== Gembound Kingdom — game content ===== */
(function (root) {
"use strict";
const { mulberry32 } = root.GKEngine;

const REGIONS = [
  { name: "Emerald Gardens",   sky: ["#ffb3d9", "#b98cf0", "#5f7fe0"], ground: "#5fbf7f", accent: "#39A879", icon: "🌷", newOb: ["cage", "ice"],
    story: [["aurelio", "The palace gardens have gone grey… the Heart Crystals are fading!"], ["lumi", "Mrrp! Match the gems and the magic flows back. I'll show you!"]] },
  { name: "Sapphire Valley",   sky: ["#a8e0ff", "#6aa8f5", "#2859A8"], ground: "#4a90c8", accent: "#2859A8", icon: "💧", newOb: ["stone", "relic"],
    story: [["aurelio", "Rivers of sapphire once lit this valley. Now stone walls block them."], ["lumi", "Old relics are buried here — drop them to the bottom to rescue them!"]] },
  { name: "Golden Kingdom",    sky: ["#ffe7a3", "#f4c75e", "#e08b4f"], ground: "#d8a640", accent: "#F4C75E", icon: "👑", newOb: ["chest", "resin"],
    story: [["aurelio", "The old capital! Its treasure chests are still sealed."], ["lumi", "Sticky resin everywhere… match next to it to wash it away."]] },
  { name: "Crystal Mountains", sky: ["#e1f1ff", "#a9c8f0", "#6b7fc4"], ground: "#9ab0d8", accent: "#7fb0e8", icon: "🏔️", newOb: ["lock"],
    story: [["aurelio", "Ice and crystal for miles. The mountain locks take two hits."], ["lumi", "Brrr. Keep your paws warm and your combos warmer!"]] },
  { name: "Enchanted Forest",  sky: ["#c8f0c0", "#7fc88a", "#2f6f5a"], ground: "#3f8f5f", accent: "#39A879", icon: "🌲", newOb: ["vine"],
    story: [["aurelio", "These vines grow every turn you don't trim them."], ["lumi", "Hit a vine each move or it spreads. Snip snip!"]] },
  { name: "Moonlit Harbor",    sky: ["#3a3f8f", "#5a4fa8", "#8866C8"], ground: "#2c4a7a", accent: "#8866C8", icon: "⚓", newOb: ["portal"],
    story: [["aurelio", "The harbor portals sleep beneath the tiles."], ["lumi", "Clear the gems standing on them to wake the portals."]] },
  { name: "Dragon Highlands",  sky: ["#ffb08a", "#ef826f", "#7a2f4f"], ground: "#8f4f3f", accent: "#EF826F", icon: "🐉", newOb: ["shadow"],
    story: [["aurelio", "Shadow Crystals! Only power-ups can crack them."], ["lumi", "Save your beams and cores for those. Rawr!"]] },
  { name: "Celestial Palace",  sky: ["#1a2350", "#3a2f7a", "#8866C8"], ground: "#4f4f9f", accent: "#F4C75E", icon: "✨", newOb: [],
    story: [["aurelio", "The Celestial Palace — the last Heart Crystal is here."], ["lumi", "Everything we've learned, all at once. Let's restore the kingdom!"]] },
];
const PER_REGION = 20;
const MAX_LEVEL = REGIONS.length * PER_REGION;
const DIFF = [
  { name: "Normal", color: "#39A879", f: 1.3 },
  { name: "Challenging", color: "#2859A8", f: 1.15 },
  { name: "Hard", color: "#EF826F", f: 1.15 },
  { name: "Super Hard", color: "#8866C8", f: 1.08 },
  { name: "Legendary", color: "#F4C75E", f: 1.0 },
];
const BOSSES = [
  { name: "Thornmaw the Garden Spirit", face: "🌿", shield: "vine" },
  { name: "Ancient Crystal Guardian", face: "🗿", shield: "stone" },
  { name: "Gilded Golem", face: "🪙", shield: "stone" },
  { name: "Frozen Mountain Beast", face: "❄️", shield: "stone" },
  { name: "Enchanted Forest Spirit", face: "🍃", shield: "vine" },
  { name: "Tidewraith of the Harbor", face: "🌊", shield: "shadow" },
  { name: "Shadow Dragon", face: "🐲", shield: "shadow" },
  { name: "The Hollow Star", face: "🌑", shield: "shadow" },
];

const SHAPES = [
  ["........", "........", "........", "........", "........", "........", "........", "........"],
  [" ...... ", "........", "........", "........", "........", "........", "........", " ...... "],
  ["...  ...", "........", "........", "........", "........", "........", "........", "........"],
  ["  ....  ", " ...... ", "........", "........", "........", "........", " ...... ", "  ....  "],
  ["........", "........", "........", "...  ...", "...  ...", "........", "........", "........"],
  [".........", ".........", ".........", ".........", ".........", ".........", ".........", ".........", "........."],
  ["... ... .", "........ ", ".........", ".........", ".........", ".........", ".........", "........."].map(s => s.padEnd(9, ".")),
  [" ....... ", ".........", ".........", ".........", ".........", ".........", ".........", ".........", " ....... "],
  [".. .... .", "........ ", "........", "........", "........", "........", "........", "........"].map(s => s.slice(0, 8).padEnd(8, ".")),
];
SHAPES[6] = ["..  .  ..", ".........", ".........", ".........", ".........", ".........", ".........", "........."];
SHAPES[8] = ["........", "........", "........", "........", "........", "........", "........", "........"];

function difficultyOf(i) {
  if (i === 20) return 4;
  if (i === 10) return 3;
  if (i === 5 || i === 15) return 2;
  if ([3, 8, 13, 18].includes(i)) return 1;
  return 0;
}

// fixed tutorial boards ('.' = random)
const TUTORIAL = {
  1: { colors: 4, moves: 18, objectives: [{ t: "color", c: 0, n: 12 }],
    preset: ["........", "........", "........", "........", "...0....", "..0.0...", "........", "........"], forced: { a: [4, 3], b: [5, 3] },
    tip: ["tap", "Tap a gem, then tap the gem next to it to swap them. You can also swipe!", "Line up 3 of the same gem to match."] },
  2: { colors: 4, moves: 18, objectives: [{ t: "color", c: 1, n: 16 }],
    preset: ["........", "........", "........", "....1...", "..11.1..", "........", "........", "........"], forced: { a: [3, 4], b: [4, 4] },
    tip: ["beam", "Match 4 in a row to create a Crystal Beam!", "Swap or tap a Crystal Beam to clear a whole line."] },
  3: { colors: 4, moves: 20, objectives: [{ t: "color", c: 2, n: 18 }],
    preset: ["........", "........", "........", "........", "...hv...", "........", "........", "........"], forced: { a: [4, 3], b: [4, 4] },
    tip: ["combo", "Swap two power-ups together to combine them!", "Beam + Beam makes a giant cross. Try other pairs later: Orb, Dragon Core, Fairy Spark…"] },
};

function placeSym(rng, mask, w, h, n, ok) {
  const out = [];
  const used = new Set();
  let guard = 0;
  while (out.length < n && guard++ < 400) {
    const r = Math.floor(rng() * h), c = Math.floor(rng() * Math.ceil(w / 2));
    const c2 = w - 1 - c;
    for (const cc of c === c2 ? [c] : [c, c2]) {
      const k = r + "," + cc;
      if (used.has(k) || (mask[r] || "")[cc] === " " || !ok(r, cc)) continue;
      used.add(k); out.push([r, cc]);
    }
  }
  return out;
}

function makeLevel(n) {
  n = Math.max(1, Math.min(MAX_LEVEL, n));
  const region = Math.floor((n - 1) / PER_REGION), i = (n - 1) % PER_REGION + 1;
  const rng = mulberry32(n * 7919 + 17);
  const d = difficultyOf(i);
  const base = { id: n, region, index: i, difficulty: d, seed: n * 1013 + 7, w: 8, h: 8, colors: 5 };
  if (TUTORIAL[n]) {
    const t = TUTORIAL[n];
    return Object.assign(base, { mask: SHAPES[0], colors: t.colors, moves: t.moves, objectives: t.objectives, preset: t.preset, obstacles: [], tutorial: t, coins: 40 });
  }
  // shape
  const shapeIdx = n < 10 ? 0 : [0, 1, 2, 3, 4, 5, 6, 7, 0][Math.floor(rng() * 9)];
  const mask = SHAPES[shapeIdx];
  const h = mask.length, w = mask[0].length;
  base.mask = mask; base.w = w; base.h = h;
  base.colors = n < 8 ? 4 : (d >= 3 && region >= 3 ? 6 : 5);
  if (w === 9 && base.colors === 6) base.colors = 5;
  // obstacle pool (cumulative)
  const pool = [];
  REGIONS.slice(0, region + 1).forEach(R => R.newOb.forEach(o => pool.push(o)));
  // early garden levels gradually introduce obstacles
  let pick;
  if (n < 4) pick = [];
  else if (n < 7) pick = ["cage"];
  else if (n < 10) pick = ["ice"];
  else {
    const fresh = REGIONS[region].newOb;
    const k = Math.min(pool.length, d >= 2 ? 3 : (rng() < 0.5 ? 1 : 2));
    pick = [];
    if (i <= 4 && fresh.length) pick.push(fresh[(i - 1) % fresh.length]);
    while (pick.length < k) { const o = pool[Math.floor(rng() * pool.length)]; if (!pick.includes(o)) pick.push(o); }
  }
  const obstacles = [];
  const taken = {};
  const keyOf = (r, c) => r + "," + c;
  const layerOf = t => t === "relic" ? null : root.GKEngine.OBST[t].layer;
  const scale = 1 + region * 0.15 + d * 0.25;
  let relicN = 0, work = 0;
  const treasure = i === 12;
  if (treasure) pick = ["chest"].concat(pick.filter(x => x !== "chest").slice(0, 1));
  for (const t of pick) {
    if (t === "relic") { relicN = 2 + Math.min(2, Math.floor(region / 3) + (d >= 2 ? 1 : 0)); work += relicN * 4; continue; }
    const L = layerOf(t);
    let count = Math.round(({ cage: 6, ice: 10, stone: 6, chest: 4, resin: 6, lock: 5, vine: 3, portal: 6, shadow: 4 }[t] || 5) * scale);
    if (treasure && t === "chest") count = 10;
    count = Math.min(count, L === "floor" ? 24 : L === "block" ? (t === "vine" ? 6 : 16) : 14);
    const cells = placeSym(rng, mask, w, h, count, (r, c) => {
      const k = keyOf(r, c); const tk = taken[k] || {};
      if (L === "block") return r > 0 && !tk.block && !tk.over && !tk.floor;
      if (L === "over") return !tk.block && !tk.over;
      return !tk.block && !tk.floor;
    });
    for (const [r, c] of cells) {
      let hp = 1;
      if (t === "stone") hp = region >= 3 ? 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2);
      if (t === "ice") hp = region >= 1 && rng() < 0.4 ? 2 : 1;
      if (t === "chest" || t === "lock") hp = 2;
      obstacles.push({ t, r, c, hp });
      const k = keyOf(r, c); taken[k] = taken[k] || {}; taken[k][L] = true;
      work += hp * (t === "shadow" ? 2.6 : t === "vine" ? 2.5 : L === "floor" ? 0.55 : 0.75);
    }
  }
  const objectives = [];
  const placedTypes = [...new Set(obstacles.map(o => o.t))];
  placedTypes.forEach(t => objectives.push({ t }));
  if (relicN) objectives.push({ t: "relic", n: relicN });
  if (objectives.length < 2 || rng() < 0.35) {
    const cn = Math.round((14 + region * 2 + d * 4) * (objectives.length ? 0.8 : 1.4));
    objectives.push({ t: "color", c: Math.floor(rng() * base.colors), n: cn });
    work += cn / 4;
  }
  let moves = Math.round((12 + work * 0.62) * DIFF[d].f);
  let boss = null;
  if (i === 20) {
    const B = BOSSES[region];
    const hp = 170 + region * 9;
    boss = { name: B.name, face: B.face, shield: B.shield, hp };
    objectives.length = 0;
    objectives.push({ t: "boss" });
    moves = Math.round(24 + region * 1.5);
  }
  moves = Math.max(14, Math.min(moves, 50));
  return Object.assign(base, { obstacles, objectives, moves, boss, relicsOnStart: relicN ? 1 : 0, treasure,
    coins: 30 + d * 15 + region * 5 + (treasure ? 60 : 0) });
}

/* ---------- special modes ---------- */
function dateSeed(d = new Date()) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
const MODES = [
  { id: "endless", name: "Endless Puzzle", icon: "♾️", desc: "Start with 20 moves. Every 2,500 points adds 3 more. How far can you go?", rewards: "10 coins per 5,000 points" },
  { id: "daily", name: "Daily Challenge", icon: "📅", desc: "One shared puzzle for today. First win of the day pays 150 coins + 5 crystals.", rewards: "150 coins + 5 💎 (once a day)" },
  { id: "limited", name: "Limited-Move Challenge", icon: "⏳", desc: "Only 12 moves. Score as high as you can.", rewards: "coins = score ÷ 400" },
  { id: "treasure", name: "Treasure Hunt", icon: "🗝️", desc: "Drop 4 relics to the bottom and crack the chests.", rewards: "120 coins + a Silver Chest" },
  { id: "survival", name: "Survival Puzzle", icon: "🛡️", desc: "Endless moves, but a Shadow Crystal appears every 3 turns. Lose when 12 are on the board.", rewards: "coins = turns survived × 2" },
  { id: "master", name: "Puzzle Master", icon: "🧠", desc: "A tight, seeded puzzle with strict moves. Changes every week.", rewards: "200 coins + 10 💎 (once a week)" },
];
function makeMode(id) {
  const ds = dateSeed();
  const base = { mode: id, w: 8, h: 8, mask: SHAPES[0], colors: 5, obstacles: [] };
  switch (id) {
    case "endless": return Object.assign(base, { seed: Date.now() % 1e9, moves: 20, endless: true, objectives: [] });
    case "limited": return Object.assign(base, { seed: Date.now() % 1e9, moves: 12, endless: true, objectives: [] });
    case "survival": return Object.assign(base, { seed: Date.now() % 1e9, moves: 999, endless: true, survival: true, objectives: [] });
    case "daily": { const L = makeLevel(20 + (ds % 120)); return Object.assign(L, { mode: id, seed: ds, id: "daily", boss: null, objectives: L.objectives.filter(o => o.t !== "boss").length ? L.objectives.filter(o => o.t !== "boss") : [{ t: "color", c: 0, n: 30 }], moves: L.boss ? 26 : L.moves }); }
    case "treasure": {
      const rng = mulberry32(ds);
      const obs = placeSym(rng, SHAPES[0], 8, 8, 8, (r) => r > 0 && r < 7).map(([r, c]) => ({ t: "chest", r, c, hp: 2 }));
      return Object.assign(base, { seed: ds, moves: 26, obstacles: obs, objectives: [{ t: "relic", n: 4 }, { t: "chest" }], relicsOnStart: 2 });
    }
    case "master": {
      const wk = Math.floor(Date.now() / (7 * 864e5));
      const L = makeLevel(60 + (wk % 90));
      return Object.assign(L, { mode: id, id: "master", seed: wk * 31, boss: null, objectives: L.boss ? [{ t: "color", c: 1, n: 40 }, { t: "score", n: 20000 }] : L.objectives, moves: Math.max(14, Math.round((L.boss ? 24 : L.moves) * 0.85)) });
    }
  }
}

/* ---------- collection ---------- */
const RARITY = { common: "#9aa6b8", rare: "#2f8fe8", epic: "#8866C8", legendary: "#F4C75E" };
const ITEMS = [
  // characters
  { id: "ch_aurelio", cat: "Characters", name: "Prince Aurelio", icon: "🤴", rarity: "legendary", desc: "Royal explorer and the kingdom's last hope.", unlock: { t: "start" } },
  { id: "ch_lumi", cat: "Characters", name: "Lumi the Gemcat", icon: "🐱", rarity: "legendary", desc: "A crystal-crowned cat who can hear gems sing.", unlock: { t: "start" } },
  { id: "ch_sage", cat: "Characters", name: "Sage Orrin", icon: "🧙", rarity: "epic", desc: "Keeper of the Sapphire library.", unlock: { t: "region", n: 1 } },
  { id: "ch_mira", cat: "Characters", name: "Captain Mira", icon: "🧭", rarity: "epic", desc: "Harbor captain with a map for every tide.", unlock: { t: "region", n: 5 } },
  { id: "ch_ember", cat: "Characters", name: "Ember the Wyrmling", icon: "🐉", rarity: "legendary", desc: "A baby dragon who befriends brave puzzlers.", unlock: { t: "region", n: 6 } },
  { id: "ch_queen", cat: "Characters", name: "Queen Celesta", icon: "👸", rarity: "legendary", desc: "Aurelio's grandmother, sealed in starlight.", unlock: { t: "region", n: 8 } },
  // costumes
  { id: "co_explorer", cat: "Costumes", name: "Explorer's Coat", icon: "🧥", rarity: "common", desc: "Many pockets, all full of gems.", unlock: { t: "start" } },
  { id: "co_frost", cat: "Costumes", name: "Frostweave Cloak", icon: "🧣", rarity: "rare", desc: "Woven from mountain snow-silk.", unlock: { t: "region", n: 4 } },
  { id: "co_gold", cat: "Costumes", name: "Golden Regalia", icon: "🥻", rarity: "epic", desc: "Ceremonial robes of the Golden Kingdom.", unlock: { t: "shop", p: 120 } },
  { id: "co_star", cat: "Costumes", name: "Starlit Armor", icon: "🛡️", rarity: "legendary", desc: "Shines brighter with every three-star win.", unlock: { t: "stars", n: 300 } },
  { id: "co_pirate", cat: "Costumes", name: "Harbor Captain Hat", icon: "🎩", rarity: "rare", desc: "Salt-stained and proud.", unlock: { t: "chest" } },
  // pets
  { id: "pe_owl", cat: "Pets", name: "Moonowl", icon: "🦉", rarity: "rare", desc: "Hoots when a hint is near.", unlock: { t: "chest" } },
  { id: "pe_fox", cat: "Pets", name: "Ember Fox", icon: "🦊", rarity: "rare", desc: "Warm tail, warmer heart.", unlock: { t: "chest" } },
  { id: "pe_bunny", cat: "Pets", name: "Clover Bunny", icon: "🐇", rarity: "common", desc: "Found nibbling the Emerald Gardens.", unlock: { t: "level", n: 10 } },
  { id: "pe_turtle", cat: "Pets", name: "Tidal Turtle", icon: "🐢", rarity: "epic", desc: "Has seen a thousand tides.", unlock: { t: "shop", p: 90 } },
  { id: "pe_unicorn", cat: "Pets", name: "Prism Unicorn", icon: "🦄", rarity: "legendary", desc: "Its horn is a Mystic Orb.", unlock: { t: "ach", id: "orb_100" } },
  // artifacts
  { id: "ar_heart1", cat: "Artifacts", name: "Heart Crystal of Gardens", icon: "💚", rarity: "epic", desc: "Restored in the Emerald Gardens.", unlock: { t: "region", n: 1 } },
  { id: "ar_heart2", cat: "Artifacts", name: "Heart Crystal of Valley", icon: "💙", rarity: "epic", desc: "Restored in Sapphire Valley.", unlock: { t: "region", n: 2 } },
  { id: "ar_heart3", cat: "Artifacts", name: "Heart Crystal of Gold", icon: "💛", rarity: "epic", desc: "Restored in the Golden Kingdom.", unlock: { t: "region", n: 3 } },
  { id: "ar_heart4", cat: "Artifacts", name: "Heart Crystal of Peaks", icon: "🤍", rarity: "epic", desc: "Restored in the Crystal Mountains.", unlock: { t: "region", n: 4 } },
  { id: "ar_compass", cat: "Artifacts", name: "Wayfinder Compass", icon: "🧭", rarity: "rare", desc: "Always points to the next puzzle.", unlock: { t: "chest" } },
  { id: "ar_hourglass", cat: "Artifacts", name: "Sands of Patience", icon: "⏳", rarity: "rare", desc: "Never runs out.", unlock: { t: "chest" } },
  { id: "ar_crown", cat: "Artifacts", name: "Crown of Restoration", icon: "👑", rarity: "legendary", desc: "Awarded for restoring all eight regions.", unlock: { t: "region", n: 8 } },
  // decorations
  { id: "de_fountain", cat: "Decorations", name: "Gem Fountain", icon: "⛲", rarity: "rare", desc: "Sparkling centerpiece for the courtyard.", unlock: { t: "stars", n: 60 } },
  { id: "de_lantern", cat: "Decorations", name: "Moon Lanterns", icon: "🏮", rarity: "common", desc: "Light the harbor streets.", unlock: { t: "chest" } },
  { id: "de_statue", cat: "Decorations", name: "Hero Statue", icon: "🗽", rarity: "epic", desc: "Your likeness, in marble.", unlock: { t: "stars", n: 180 } },
  { id: "de_garden", cat: "Decorations", name: "Rose Arch", icon: "🌹", rarity: "common", desc: "Smells of victory.", unlock: { t: "shop", p: 30 } },
  { id: "de_tent", cat: "Decorations", name: "Festival Tent", icon: "🎪", rarity: "rare", desc: "Appears during seasonal festivals.", unlock: { t: "event" } },
  // backgrounds
  { id: "bg_garden", cat: "Backgrounds", name: "Garden Dawn", icon: "🌅", rarity: "common", desc: "The classic home view.", unlock: { t: "start" } },
  { id: "bg_night", cat: "Backgrounds", name: "Moonlit Night", icon: "🌙", rarity: "rare", desc: "A calm, starry home screen.", unlock: { t: "region", n: 5 } },
  { id: "bg_sunset", cat: "Backgrounds", name: "Dragon Sunset", icon: "🌄", rarity: "epic", desc: "Fiery skies over the highlands.", unlock: { t: "shop", p: 60 } },
  { id: "bg_aurora", cat: "Backgrounds", name: "Celestial Aurora", icon: "🌌", rarity: "legendary", desc: "Ribbons of starlight.", unlock: { t: "region", n: 8 } },
  // special achievements (badges)
  { id: "sp_first", cat: "Special", name: "First Spark Badge", icon: "🎖️", rarity: "common", desc: "For your very first victory.", unlock: { t: "ach", id: "first_win" } },
  { id: "sp_combo", cat: "Special", name: "Combo Crest", icon: "🏅", rarity: "rare", desc: "For becoming a Combo Master.", unlock: { t: "ach", id: "combo_50" } },
  { id: "sp_streak", cat: "Special", name: "Seven Suns Medal", icon: "☀️", rarity: "epic", desc: "Seven-day login streak.", unlock: { t: "ach", id: "streak_7" } },
];
const BACKGROUND_SKY = {
  bg_garden: ["#ffb3d9", "#b98cf0", "#5f7fe0"], bg_night: ["#1a2350", "#3a3f8f", "#6a5fb8"],
  bg_sunset: ["#ffcf8a", "#ef826f", "#7a2f4f"], bg_aurora: ["#0f1a40", "#2a6f8f", "#8866C8"],
};
const AVATARS = ["🤴", "👸", "🧙", "🧝", "🧚", "🦸", "🐱", "🦊", "🐉", "🦉", "🦄", "🐢"];
const FRAMES = [
  { id: "gold", name: "Royal Gold", css: "linear-gradient(135deg,#ffe9a8,#d9a13a,#fff0b8,#b8801f)", unlock: { t: "start" } },
  { id: "sapphire", name: "Sapphire", css: "linear-gradient(135deg,#9fd0ff,#2859A8,#bfe0ff,#14284D)", unlock: { t: "region", n: 2 } },
  { id: "emerald", name: "Emerald", css: "linear-gradient(135deg,#a6f0c8,#39A879,#d8ffe8,#1f6f4f)", unlock: { t: "stars", n: 45 } },
  { id: "amethyst", name: "Amethyst", css: "linear-gradient(135deg,#e0ccff,#8866C8,#f0e6ff,#4f2f8f)", unlock: { t: "region", n: 4 } },
  { id: "flame", name: "Dragonflame", css: "linear-gradient(135deg,#ffd0a0,#EF826F,#ffe0c0,#9f2f2f)", unlock: { t: "region", n: 7 } },
  { id: "celestial", name: "Celestial", css: "conic-gradient(#F4C75E,#8866C8,#2859A8,#39A879,#EF826F,#F4C75E)", unlock: { t: "stars", n: 400 } },
];
const TITLES = [
  { id: "novice", name: "Gem Novice", unlock: { t: "start" } },
  { id: "gardener", name: "Garden Keeper", unlock: { t: "region", n: 1 } },
  { id: "combo", name: "Combo Master", unlock: { t: "ach", id: "combo_50" } },
  { id: "explorer", name: "Kingdom Explorer", unlock: { t: "region", n: 3 } },
  { id: "dragon", name: "Dragon Friend", unlock: { t: "region", n: 7 } },
  { id: "legend", name: "Legendary Adventurer", unlock: { t: "region", n: 8 } },
];

/* ---------- kingdom restoration tasks (cost stars) ---------- */
const RESTORE = REGIONS.map((R, ri) => [
  { name: "Clear the overgrown path", icon: "🧹", cost: 2 + ri },
  { name: "Rebuild the " + ["fountain", "bridge", "treasury", "watchtower", "treehouse", "lighthouse", "dragon roost", "star gate"][ri], icon: ["⛲", "🌉", "🏦", "🗼", "🌳", "🗼", "🪺", "🌀"][ri], cost: 4 + ri * 2 },
  { name: "Plant magical flowers", icon: "🌸", cost: 3 + ri * 2 },
  { name: "Relight the Heart Crystal", icon: "💎", cost: 6 + ri * 3 },
]);

/* ---------- chests ---------- */
const CHESTS = {
  wooden:    { name: "Wooden Chest",    icon: "🧰", color: "#a8703f", rolls: 2, table: [["coins", 60, 50], ["booster", 1, 30], ["life", 1, 20]] },
  silver:    { name: "Silver Chest",    icon: "🎁", color: "#b8c4d8", rolls: 3, table: [["coins", 120, 40], ["booster", 1, 35], ["life", 2, 15], ["crystals", 3, 10]] },
  golden:    { name: "Golden Chest",    icon: "💰", color: "#F4C75E", rolls: 4, table: [["coins", 200, 35], ["booster", 2, 35], ["crystals", 5, 15], ["card", 1, 15]] },
  crystal:   { name: "Crystal Chest",   icon: "💠", color: "#7fd0ff", rolls: 4, table: [["coins", 300, 30], ["booster", 2, 30], ["crystals", 10, 20], ["card", 1, 20]] },
  legendary: { name: "Legendary Chest", icon: "🏆", color: "#8866C8", rolls: 5, table: [["coins", 500, 25], ["booster", 3, 25], ["crystals", 20, 20], ["card", 1, 20], ["unlimited", 30, 10]] },
};

/* ---------- boosters ---------- */
const BOOSTERS = {
  hammer:  { name: "Royal Hammer", icon: "🔨", kind: "in", desc: "Smash any one tile or obstacle layer. Breaks Shadow Crystals too.", price: 400 },
  saber:   { name: "Light Saber Row", icon: "🗡️", kind: "in", desc: "Clear an entire row of your choice.", price: 550 },
  bomb:    { name: "Star Bomb", icon: "💣", kind: "in", desc: "Blast a 3×3 area.", price: 500 },
  prism:   { name: "Prism Wand", icon: "🪄", kind: "in", desc: "Pick a gem: every gem of that color is cleared.", price: 700 },
  shuffle: { name: "Royal Shuffle", icon: "🔀", kind: "in", desc: "Reshuffle the gems. Does not use a move.", price: 250 },
  moves5:  { name: "+5 Moves", icon: "➕", kind: "in", desc: "Add 5 moves to the current level.", price: 900 },
  pre_beam: { name: "Starter Beam", icon: "⚡", kind: "pre", desc: "Start the level with a Crystal Beam on the board.", price: 300 },
  pre_core: { name: "Starter Core", icon: "🔥", kind: "pre", desc: "Start with a Dragon Core on the board.", price: 400 },
  pre_orb:  { name: "Starter Orb", icon: "🔮", kind: "pre", desc: "Start with a Mystic Orb on the board.", price: 600 },
};

/* ---------- achievements ---------- */
const ACH = [
  { id: "first_win", group: "Puzzle", name: "First Victory", desc: "Win your first level.", stat: "wins", n: 1, reward: { coins: 100 } },
  { id: "combo_50", group: "Puzzle", name: "Combo Master", desc: "Combine power-ups 50 times.", stat: "combos", n: 50, reward: { crystals: 10 } },
  { id: "gem_5000", group: "Puzzle", name: "Crystal Collector", desc: "Clear 5,000 gems.", stat: "matched", n: 5000, reward: { coins: 500 } },
  { id: "core_100", group: "Puzzle", name: "Explosion Expert", desc: "Detonate 100 Dragon Cores.", stat: "cores", n: 100, reward: { crystals: 10 } },
  { id: "orb_100", group: "Puzzle", name: "Orb Whisperer", desc: "Use 100 Mystic Orbs.", stat: "orbs", n: 100, reward: { crystals: 15 } },
  { id: "perfect_20", group: "Puzzle", name: "Perfect Strategy", desc: "Earn 3 stars on 20 levels.", stat: "threeStars", n: 20, reward: { crystals: 15 } },
  { id: "cascade_6", group: "Puzzle", name: "Chain Reaction", desc: "Trigger a 6-step cascade.", stat: "bestCascade", n: 6, reward: { coins: 300 } },
  { id: "star_made", group: "Puzzle", name: "Starmaker", desc: "Create a Celestial Star.", stat: "starsMade", n: 1, reward: { crystals: 5 } },
  { id: "boss_1", group: "Puzzle", name: "Giant Slayer", desc: "Defeat a boss.", stat: "bosses", n: 1, reward: { crystals: 10 } },
  { id: "lvl_25", group: "Progression", name: "Rising Hero", desc: "Reach level 25.", stat: "level", n: 25, reward: { coins: 300 } },
  { id: "lvl_100", group: "Progression", name: "First 100 Levels", desc: "Reach level 100.", stat: "level", n: 100, reward: { crystals: 25 } },
  { id: "region_3", group: "Progression", name: "Kingdom Explorer", desc: "Complete 3 regions.", stat: "regions", n: 3, reward: { crystals: 15 } },
  { id: "restore_8", group: "Progression", name: "Region Restorer", desc: "Finish every restoration task in a region.", stat: "restoredRegions", n: 1, reward: { coins: 500 } },
  { id: "legend", group: "Progression", name: "Legendary Adventurer", desc: "Complete all 160 levels.", stat: "level", n: 161, reward: { crystals: 100 } },
  { id: "daily_1", group: "Consistency", name: "Daily Player", desc: "Claim a daily reward.", stat: "dailyClaims", n: 1, reward: { coins: 50 } },
  { id: "streak_7", group: "Consistency", name: "Seven-Day Streak", desc: "Log in 7 days in a row.", stat: "bestStreak", n: 7, reward: { crystals: 20 } },
  { id: "weekly_1", group: "Consistency", name: "Weekly Champion", desc: "Complete all weekly missions in one week.", stat: "weeklyAll", n: 1, reward: { crystals: 20 } },
  { id: "chest_10", group: "Consistency", name: "Treasure Seeker", desc: "Open 10 chests.", stat: "chests", n: 10, reward: { coins: 400 } },
];

/* ---------- missions ---------- */
const DAILY_POOL = [
  { id: "d_win3", text: "Complete 3 levels", stat: "wins", n: 3, icon: "🏅", reward: { coins: 80 } },
  { id: "d_pow5", text: "Create 5 power-ups", stat: "specialsMade", n: 5, icon: "🔮", reward: { coins: 60 } },
  { id: "d_hard", text: "Win a Hard or harder level", stat: "hardWins", n: 1, icon: "👑", reward: { coins: 120 } },
  { id: "d_coins", text: "Earn 300 coins", stat: "coinsEarned", n: 300, icon: "🪙", reward: { crystals: 2 } },
  { id: "d_event", text: "Make progress in an event", stat: "eventPts", n: 10, icon: "🎪", reward: { coins: 70 } },
  { id: "d_combo", text: "Combine 2 power-ups", stat: "combos", n: 2, icon: "💥", reward: { coins: 90 } },
  { id: "d_gems", text: "Clear 150 gems", stat: "matched", n: 150, icon: "💎", reward: { coins: 70 } },
];
const WEEKLY_POOL = [
  { id: "w_win15", text: "Win 15 levels", stat: "wins", n: 15, icon: "🏆", reward: { crystals: 10 } },
  { id: "w_hard4", text: "Win 4 Hard levels", stat: "hardWins", n: 4, icon: "👑", reward: { coins: 500 } },
  { id: "w_stars", text: "Collect 30 stars", stat: "starsEarned", n: 30, icon: "⭐", reward: { chest: "silver" } },
  { id: "w_boss", text: "Finish a region challenge (boss)", stat: "bosses", n: 1, icon: "🐉", reward: { chest: "golden" } },
];

/* ---------- events (local schedule, rotates by date) ---------- */
const EVENTS = [
  { id: "gemrush", name: "Gem Rush", icon: "💎", color: "#EF826F", desc: "Clear gems in any level. Every 20 gems = 1 point.", stat: "matched", per: 20 },
  { id: "expedition", name: "Crystal Expedition", icon: "🏔️", color: "#2859A8", desc: "Each level win = 3 points. Three in a row without losing doubles it.", stat: "wins", per: 1, mult: 3 },
  { id: "treasurehunt", name: "Kingdom Treasure Hunt", icon: "🗝️", color: "#F4C75E", desc: "Rescue relics and break chests. Each = 2 points.", stat: "treasure", per: 1, mult: 2 },
  { id: "dragon", name: "Dragon Challenge", icon: "🐉", color: "#8866C8", desc: "Detonate Dragon Cores. Each = 2 points.", stat: "cores", per: 1, mult: 2 },
];
const SEASONAL = [
  { months: [9, 10], id: "harvest", name: "Harvest Lantern Festival", icon: "🏮", color: "#EF826F", desc: "Autumn festival! Every star you earn = 2 points.", stat: "starsEarned", per: 1, mult: 2 },
  { months: [11, 0], id: "frost", name: "Frostlight Festival", icon: "❄️", color: "#7fb0e8", desc: "Winter festival! Every power-up used = 1 point.", stat: "specialsUsed", per: 1 },
  { months: [2, 3, 4], id: "bloom", name: "Bloom Festival", icon: "🌸", color: "#ff8fc8", desc: "Spring festival! Every obstacle broken = 1 point.", stat: "blocksBroken", per: 1 },
  { months: [5, 6, 7, 8], id: "sun", name: "Sunfire Festival", icon: "☀️", color: "#F4C75E", desc: "Summer festival! Every gem cleared counts (30 = 1 point).", stat: "matched", per: 30 },
];
const EVENT_MILESTONES = [{ pts: 10, r: { coins: 100 } }, { pts: 25, r: { booster: "hammer" } }, { pts: 50, r: { crystals: 5 } }, { pts: 80, r: { chest: "golden" } }, { pts: 120, r: { chest: "crystal", item: "de_tent" } }];
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function activeEvents(now = new Date()) {
  const out = [];
  // rotating 3-day events (local calendar days)
  const epoch = new Date(2026, 0, 1);
  const day0 = Math.round((startOfDay(now) - epoch) / 864e5);
  const slot = Math.floor(day0 / 3);
  const ev = EVENTS[((slot % EVENTS.length) + EVENTS.length) % EVENTS.length];
  const st = new Date(2026, 0, 1 + slot * 3), en = new Date(2026, 0, 1 + slot * 3 + 3);
  out.push(Object.assign({}, ev, { key: ev.id + "_" + slot, start: st.getTime(), end: en.getTime() }));
  // weekend adventure Fri 00:00 – Mon 00:00
  const dow = now.getDay();
  if (dow === 5 || dow === 6 || dow === 0) {
    const fri = startOfDay(now); fri.setDate(fri.getDate() - ((dow + 2) % 7));
    const mon = new Date(fri); mon.setDate(mon.getDate() + 3);
    out.push({ id: "weekend", key: "weekend_" + fri.toDateString(), name: "Weekend Adventure", icon: "🎒", color: "#39A879", desc: "Weekend special: each level win = 4 points.", stat: "wins", per: 1, mult: 4, start: fri.getTime(), end: mon.getTime() });
  }
  // seasonal festival: whole month(s)
  const S = SEASONAL.find(s => s.months.includes(now.getMonth()));
  if (S) {
    const st = new Date(now.getFullYear(), now.getMonth(), 1), en = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    out.push(Object.assign({}, S, { key: S.id + "_" + now.getFullYear() + "_" + now.getMonth(), start: st.getTime(), end: en.getTime() }));
  }
  // tournament runs Monday to Monday
  const mon = startOfDay(now); mon.setDate(mon.getDate() - ((dow + 6) % 7));
  const next = new Date(mon); next.setDate(next.getDate() + 7);
  out.push({ id: "tournament", key: "tour_" + mon.toDateString(), name: "Royal Puzzle Tournament", icon: "🏆", color: "#F4C75E", desc: "Score points from level wins (your best scores count). Beat your personal records!", stat: "tourPts", per: 1, start: mon.getTime(), end: next.getTime(), tournament: true });
  return out;
}

/* ---------- daily reward calendar ---------- */
const DAILY = [
  { coins: 50 }, { coins: 80 }, { booster: "hammer" }, { coins: 150 }, { crystals: 3 }, { booster: "pre_core", coins: 100 }, { chest: "golden", crystals: 5 },
];

/* ---------- translations ---------- */
const I18N = {
  en: {}, // English is the source text
  fil: { Home: "Home", Map: "Mapa", Play: "Laro", Boosters: "Boosters", Shop: "Tindahan", Level: "Antas", Settings: "Settings", Inbox: "Inbox", "Daily Rewards": "Araw-araw na Gantimpala", Events: "Mga Event", Tournament: "Paligsahan", Missions: "Mga Misyon", Collection: "Koleksyon", Achievements: "Mga Tagumpay", Friends: "Mga Kaibigan", "Daily Missions": "Mga Misyon Ngayon", "Kingdom Progress": "Progreso ng Kaharian", Profile: "Profile", Moves: "Galaw", Victory: "Tagumpay!", "Out of moves": "Ubos na ang galaw", Retry: "Subukan muli", Next: "Susunod", Close: "Isara", Claim: "Kunin", Resume: "Ituloy", Quit: "Umalis", Language: "Wika", Audio: "Tunog", Graphics: "Graphics", Gameplay: "Laro", Accessibility: "Accessibility", Notifications: "Mga Abiso", Help: "Tulong", "Challenge Modes": "Mga Hamon", Objectives: "Mga Layunin", Lives: "Buhay", Full: "Puno" },
  es: { Home: "Inicio", Map: "Mapa", Play: "Jugar", Boosters: "Potenciadores", Shop: "Tienda", Level: "Nivel", Settings: "Ajustes", Inbox: "Buzón", "Daily Rewards": "Recompensas diarias", Events: "Eventos", Tournament: "Torneo", Missions: "Misiones", Collection: "Colección", Achievements: "Logros", Friends: "Amigos", "Daily Missions": "Misiones diarias", "Kingdom Progress": "Progreso del reino", Profile: "Perfil", Moves: "Movimientos", Victory: "¡Victoria!", "Out of moves": "Sin movimientos", Retry: "Reintentar", Next: "Siguiente", Close: "Cerrar", Claim: "Reclamar", Resume: "Continuar", Quit: "Salir", Language: "Idioma", Audio: "Sonido", Graphics: "Gráficos", Gameplay: "Juego", Accessibility: "Accesibilidad", Notifications: "Notificaciones", Help: "Ayuda", "Challenge Modes": "Modos desafío", Objectives: "Objetivos", Lives: "Vidas", Full: "Lleno" },
  fr: { Home: "Accueil", Map: "Carte", Play: "Jouer", Boosters: "Bonus", Shop: "Boutique", Level: "Niveau", Settings: "Paramètres", Inbox: "Boîte", "Daily Rewards": "Récompenses du jour", Events: "Événements", Tournament: "Tournoi", Missions: "Missions", Collection: "Collection", Achievements: "Succès", Friends: "Amis", "Daily Missions": "Missions du jour", "Kingdom Progress": "Progrès du royaume", Profile: "Profil", Moves: "Coups", Victory: "Victoire !", "Out of moves": "Plus de coups", Retry: "Réessayer", Next: "Suivant", Close: "Fermer", Claim: "Récupérer", Resume: "Reprendre", Quit: "Quitter", Language: "Langue", Audio: "Son", Graphics: "Graphismes", Gameplay: "Jeu", Accessibility: "Accessibilité", Notifications: "Notifications", Help: "Aide", "Challenge Modes": "Modes défi", Objectives: "Objectifs", Lives: "Vies", Full: "Plein" },
  de: { Home: "Start", Map: "Karte", Play: "Spielen", Boosters: "Booster", Shop: "Laden", Level: "Level", Settings: "Einstellungen", Inbox: "Posteingang", "Daily Rewards": "Tägliche Belohnungen", Events: "Events", Tournament: "Turnier", Missions: "Missionen", Collection: "Sammlung", Achievements: "Erfolge", Friends: "Freunde", "Daily Missions": "Tägliche Missionen", "Kingdom Progress": "Fortschritt des Königreichs", Profile: "Profil", Moves: "Züge", Victory: "Sieg!", "Out of moves": "Keine Züge mehr", Retry: "Nochmal", Next: "Weiter", Close: "Schließen", Claim: "Abholen", Resume: "Fortsetzen", Quit: "Beenden", Language: "Sprache", Audio: "Ton", Graphics: "Grafik", Gameplay: "Spiel", Accessibility: "Barrierefreiheit", Notifications: "Benachrichtigungen", Help: "Hilfe", "Challenge Modes": "Herausforderungen", Objectives: "Ziele", Lives: "Leben", Full: "Voll" },
  nb: { Home: "Hjem", Map: "Kart", Play: "Spill", Boosters: "Boostere", Shop: "Butikk", Level: "Nivå", Settings: "Innstillinger", Inbox: "Innboks", "Daily Rewards": "Daglige belønninger", Events: "Hendelser", Tournament: "Turnering", Missions: "Oppdrag", Collection: "Samling", Achievements: "Prestasjoner", Friends: "Venner", "Daily Missions": "Dagens oppdrag", "Kingdom Progress": "Rikets fremgang", Profile: "Profil", Moves: "Trekk", Victory: "Seier!", "Out of moves": "Tom for trekk", Retry: "Prøv igjen", Next: "Neste", Close: "Lukk", Claim: "Hent", Resume: "Fortsett", Quit: "Avslutt", Language: "Språk", Audio: "Lyd", Graphics: "Grafikk", Gameplay: "Spilling", Accessibility: "Tilgjengelighet", Notifications: "Varsler", Help: "Hjelp", "Challenge Modes": "Utfordringer", Objectives: "Mål", Lives: "Liv", Full: "Full" },
  sv: { Home: "Hem", Map: "Karta", Play: "Spela", Boosters: "Boosters", Shop: "Butik", Level: "Nivå", Settings: "Inställningar", Inbox: "Inkorg", "Daily Rewards": "Dagliga belöningar", Events: "Evenemang", Tournament: "Turnering", Missions: "Uppdrag", Collection: "Samling", Achievements: "Prestationer", Friends: "Vänner", "Daily Missions": "Dagens uppdrag", "Kingdom Progress": "Rikets framsteg", Profile: "Profil", Moves: "Drag", Victory: "Seger!", "Out of moves": "Slut på drag", Retry: "Försök igen", Next: "Nästa", Close: "Stäng", Claim: "Hämta", Resume: "Fortsätt", Quit: "Avsluta", Language: "Språk", Audio: "Ljud", Graphics: "Grafik", Gameplay: "Spel", Accessibility: "Tillgänglighet", Notifications: "Aviseringar", Help: "Hjälp", "Challenge Modes": "Utmaningar", Objectives: "Mål", Lives: "Liv", Full: "Fullt" },
};
const LANGS = [["en", "English"], ["fil", "Filipino"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["nb", "Norsk bokmål"], ["sv", "Svenska"]];

root.GKData = { REGIONS, PER_REGION, MAX_LEVEL, DIFF, BOSSES, makeLevel, makeMode, MODES, ITEMS, RARITY, AVATARS, FRAMES, TITLES, BACKGROUND_SKY, RESTORE, CHESTS, BOOSTERS, ACH, DAILY_POOL, WEEKLY_POOL, activeEvents, EVENT_MILESTONES, DAILY, I18N, LANGS, dateSeed, difficultyOf };
})(typeof window !== "undefined" ? window : globalThis);
