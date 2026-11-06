/* ===== Gembound Kingdom — match-3 engine (pure logic, no DOM) ===== */
(function (root) {
"use strict";

function mulberry32(a) {
  a = a >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GEMS = ["Ruby", "Sapphire", "Emerald", "Citrine", "Amethyst", "Moonstone"];
const RELIC = -2, NOCOLOR = -1;
// obstacle definitions: where they live and how they break
const OBST = {
  stone:  { layer: "block", label: "Stone Barrier", adj: true,  power: true },
  vine:   { layer: "block", label: "Enchanted Vine", adj: true, power: true },
  chest:  { layer: "block", label: "Ancient Chest", adj: true,  power: true },
  shadow: { layer: "block", label: "Shadow Crystal", adj: false, power: true },
  cage:   { layer: "over",  label: "Crystal Cage",  adj: false, power: true },
  lock:   { layer: "over",  label: "Magical Lock",  adj: false, power: true },
  resin:  { layer: "over",  label: "Magic Resin",   adj: true,  power: true },
  ice:    { layer: "floor", label: "Frozen Floor",  adj: false, power: true },
  portal: { layer: "floor", label: "Sealed Portal", adj: false, power: true },
};

let NEXT_ID = 1;

class Game {
  /* level: {w,h,mask[],colors,moves,objectives[],obstacles[{t,r,c,hp}],preset[],seed,boss,relics,mode} */
  constructor(level, opts = {}) {
    this.level = level;
    this.w = level.w; this.h = level.h;
    this.rng = mulberry32(level.seed || 12345);
    this.ncolors = level.colors || 5;
    this.moves = level.moves == null ? 20 : level.moves;
    this.movesUsed = 0;
    this.score = 0;
    this.cascade = 0;
    this.fx = [];
    this.queue = [];      // pending special activations
    this.stats = { matched: 0, specialsMade: 0, specialsUsed: 0, combos: 0, maxCascade: 0, cores: 0, orbs: 0, beams: 0, sparks: 0, stars: 0, colorCleared: [0,0,0,0,0,0], relics: 0, blocksBroken: 0 };
    this.vineHit = false;
    this.relicsSpawned = 0;
    this.endless = !!level.endless;
    this.state = "play";
    this.objectives = (level.objectives || []).map(o => Object.assign({ got: 0 }, o));
    this.boss = level.boss ? Object.assign({ max: level.boss.hp, stage: 0 }, level.boss) : null;
    this.cells = [];
    for (let r = 0; r < this.h; r++) {
      const row = [];
      for (let c = 0; c < this.w; c++) {
        const hole = level.mask ? (level.mask[r] || "")[c] === " " : false;
        row.push({ hole, tile: null, block: null, over: null, floor: null });
      }
      this.cells.push(row);
    }
    for (const o of level.obstacles || []) {
      const cell = this.cell(o.r, o.c); if (!cell || cell.hole) continue;
      const def = OBST[o.t]; if (!def) continue;
      cell[def.layer] = { type: o.t, hp: o.hp || 1, max: o.hp || 1 };
    }
    if (level.preset) this.fillPreset(level.preset); else this.fillRandom();
    for (const s of level.startSpecials || []) this.placeRandomSpecial(s);
  }

  /* ---------- basic helpers ---------- */
  cell(r, c) { return r >= 0 && c >= 0 && r < this.h && c < this.w ? this.cells[r][c] : null; }
  tile(r, c) { const x = this.cell(r, c); return x ? x.tile : null; }
  rand(n) { return Math.floor(this.rng() * n); }
  newTile(color, sp) { return { id: NEXT_ID++, color, sp: sp || null }; }
  canHoldTile(r, c) { const x = this.cell(r, c); return !!x && !x.hole && !x.block; }
  movable(r, c) { const x = this.cell(r, c); return !!x && !x.hole && !x.block && !x.over && !!x.tile; }
  matchColor(r, c) { const t = this.tile(r, c); return t && t.color >= 0 ? t.color : null; }
  each(fn) { for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) fn(this.cells[r][c], r, c); }
  randomColor() { return this.rand(this.ncolors); }

  fillPreset(preset) {
    // preset: rows of chars: 0-5 colors, R relic, '.' random, '#' none
    this.each((cell, r, c) => {
      if (cell.hole || cell.block) return;
      const ch = (preset[r] || "")[c];
      if (ch >= "0" && ch <= "5") cell.tile = this.newTile(+ch);
      else if (ch === "R") cell.tile = this.newTile(RELIC);
      else if ("hvkpo".includes(ch) && ch) cell.tile = this.newTile(ch === "o" ? NOCOLOR : 1 + "hvkp".indexOf(ch) % 3, { h: "bh", v: "bv", k: "core", p: "spark", o: "orb" }[ch]);
      else cell.tile = this.newTile(this.safeColor(r, c));
    });
    // re-roll random cells that accidentally form matches with preset gems
    for (let k = 0; k < 40; k++) {
      const m = this.findMatches(); if (!m.length) break;
      for (const g of m) for (const [r, c] of g.cells) if (((preset[r] || "")[c] || ".") === ".") this.cells[r][c].tile.color = this.randomColor();
    }
  }
  safeColor(r, c) {
    for (let tries = 0; tries < 20; tries++) {
      const col = this.randomColor();
      const l1 = this.matchColor(r, c - 1), l2 = this.matchColor(r, c - 2);
      const u1 = this.matchColor(r - 1, c), u2 = this.matchColor(r - 2, c);
      if (l1 === col && l2 === col) continue;
      if (u1 === col && u2 === col) continue;
      // avoid ready-made 2x2 squares
      if (l1 === col && u1 === col && this.matchColor(r - 1, c - 1) === col) continue;
      return col;
    }
    return this.randomColor();
  }
  fillRandom() {
    for (let attempt = 0; attempt < 50; attempt++) {
      this.each((cell, r, c) => { if (!cell.hole && !cell.block) cell.tile = null; });
      this.each((cell, r, c) => { if (!cell.hole && !cell.block) cell.tile = this.newTile(this.safeColor(r, c)); });
      const relicsStart = Math.min(this.level.relicsOnStart || 0, 3);
      for (let i = 0; i < relicsStart; i++) this.spawnRelicTop();
      if (this.findMatches().length === 0 && this.hasMoves()) return;
    }
  }
  spawnRelicTop() {
    const cand = [];
    for (let c = 0; c < this.w; c++) {
      for (let r = 0; r < Math.min(3, this.h); r++) {
        const x = this.cell(r, c);
        if (x && !x.hole && !x.block && !x.over && x.tile && x.tile.color >= 0 && !x.tile.sp) { cand.push([r, c]); break; }
      }
    }
    if (!cand.length) return;
    const [r, c] = cand[this.rand(cand.length)];
    this.cells[r][c].tile = this.newTile(RELIC); this.relicsSpawned++;
  }
  placeRandomSpecial(sp) {
    const cand = [];
    this.each((x, r, c) => { if (x.tile && !x.over && x.tile.color >= 0 && !x.tile.sp) cand.push([r, c]); });
    if (!cand.length) return null;
    const [r, c] = cand[this.rand(cand.length)];
    const t = this.cells[r][c].tile;
    if (sp === "beam") sp = this.rng() < 0.5 ? "bh" : "bv";
    t.sp = sp; if (sp === "orb" || sp === "star") t.color = NOCOLOR;
    return [r, c];
  }

  /* ---------- match detection ---------- */
  findMatches() {
    const H = this.h, W = this.w;
    const id = (r, c) => r * W + c;
    const parent = new Map();
    const find = a => { while (parent.get(a) !== a) { parent.set(a, parent.get(parent.get(a))); a = parent.get(a); } return a; };
    const add = a => { if (!parent.has(a)) parent.set(a, a); };
    const union = (a, b) => { add(a); add(b); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    const hRun = new Map(), vRun = new Map(), sq = new Set();
    // horizontal runs
    for (let r = 0; r < H; r++) {
      let c = 0;
      while (c < W) {
        const col = this.matchColor(r, c);
        if (col === null) { c++; continue; }
        let e = c; while (e + 1 < W && this.matchColor(r, e + 1) === col) e++;
        const len = e - c + 1;
        if (len >= 3) { for (let k = c; k <= e; k++) { union(id(r, c), id(r, k)); hRun.set(id(r, k), len); } }
        c = e + 1;
      }
    }
    for (let c = 0; c < W; c++) {
      let r = 0;
      while (r < H) {
        const col = this.matchColor(r, c);
        if (col === null) { r++; continue; }
        let e = r; while (e + 1 < H && this.matchColor(e + 1, c) === col) e++;
        const len = e - r + 1;
        if (len >= 3) { for (let k = r; k <= e; k++) { union(id(r, c), id(k, c)); vRun.set(id(k, c), len); } }
        r = e + 1;
      }
    }
    for (let r = 0; r + 1 < H; r++) for (let c = 0; c + 1 < W; c++) {
      const col = this.matchColor(r, c);
      if (col === null) continue;
      if (this.matchColor(r, c + 1) === col && this.matchColor(r + 1, c) === col && this.matchColor(r + 1, c + 1) === col) {
        const ids = [id(r, c), id(r, c + 1), id(r + 1, c), id(r + 1, c + 1)];
        ids.forEach(x => { union(ids[0], x); sq.add(x); });
      }
    }
    const groups = new Map();
    for (const k of parent.keys()) {
      const root = find(k);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(k);
    }
    const out = [];
    for (const ids of groups.values()) {
      const cells = ids.map(k => [Math.floor(k / W), k % W]);
      let maxH = 0, maxV = 0, hasSq = false;
      ids.forEach(k => { maxH = Math.max(maxH, hRun.get(k) || 0); maxV = Math.max(maxV, vRun.get(k) || 0); if (sq.has(k)) hasSq = true; });
      const color = this.matchColor(cells[0][0], cells[0][1]);
      let make = null;
      if (Math.max(maxH, maxV) >= 6 || (maxH >= 3 && maxV >= 3 && cells.length >= 7)) make = "star";
      else if (Math.max(maxH, maxV) >= 5) make = "orb";
      else if (maxH >= 3 && maxV >= 3) make = "core";
      else if (maxH === 4 || maxV === 4) make = maxH >= maxV ? "bh" : "bv";
      else if (hasSq && maxH < 3 && maxV < 3) make = "spark";
      else if (hasSq) make = "spark";
      // intersection cell for L/T shapes
      let pivot = null;
      if (make === "core" || make === "star") pivot = ids.find(k => hRun.has(k) && vRun.has(k));
      out.push({ cells, color, make, pivot: pivot != null ? [Math.floor(pivot / W), pivot % W] : null, size: cells.length });
    }
    return out;
  }

  /* would swapping a and b create a match? */
  swapMakesMatch(a, b) {
    const ta = this.tile(a[0], a[1]), tb = this.tile(b[0], b[1]);
    this.cells[a[0]][a[1]].tile = tb; this.cells[b[0]][b[1]].tile = ta;
    const ok = this.matchAt(a[0], a[1]) || this.matchAt(b[0], b[1]);
    this.cells[a[0]][a[1]].tile = ta; this.cells[b[0]][b[1]].tile = tb;
    return ok;
  }
  matchAt(r, c) {
    const col = this.matchColor(r, c); if (col === null) return 0;
    let h = 1, v = 1;
    for (let k = c - 1; this.matchColor(r, k) === col; k--) h++;
    for (let k = c + 1; this.matchColor(r, k) === col; k++) h++;
    for (let k = r - 1; this.matchColor(k, c) === col; k--) v++;
    for (let k = r + 1; this.matchColor(k, c) === col; k++) v++;
    let s = 0;
    for (const [dr, dc] of [[-1, -1], [-1, 0], [0, -1], [0, 0]]) {
      const r0 = r + dr, c0 = c + dc;
      if ([[0, 0], [0, 1], [1, 0], [1, 1]].every(([a, b]) => this.matchColor(r0 + a, c0 + b) === col)) s = 4;
    }
    const best = Math.max(h >= 3 ? h : 0, v >= 3 ? v : 0, s);
    return best;
  }
  isSpecialTile(t) { return !!(t && t.sp); }
  listMoves() {
    const moves = [];
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
      if (!this.movable(r, c)) continue;
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc;
        if (!this.movable(r2, c2)) continue;
        const a = this.tile(r, c), b = this.tile(r2, c2);
        if (a.color === RELIC && b.color === RELIC) continue;
        if (a.sp && b.sp) { moves.push({ a: [r, c], b: [r2, c2], score: 50 }); continue; }
        if ((a.sp === "orb" || a.sp === "star") || (b.sp === "orb" || b.sp === "star")) { moves.push({ a: [r, c], b: [r2, c2], score: 30 }); continue; }
        if (this.swapMakesMatch([r, c], [r2, c2])) {
          // score potential
          const ta = this.tile(r, c), tb = this.tile(r2, c2);
          this.cells[r][c].tile = tb; this.cells[r2][c2].tile = ta;
          const s = Math.max(this.matchAt(r, c), this.matchAt(r2, c2));
          this.cells[r][c].tile = ta; this.cells[r2][c2].tile = tb;
          moves.push({ a: [r, c], b: [r2, c2], score: s + (a.sp || b.sp ? 3 : 0) });
        }
      }
    }
    return moves;
  }
  hasMoves() {
    let special = false;
    this.each((x) => { if (x.tile && x.tile.sp && !x.over) special = true; });
    return special || this.listMoves().length > 0;
  }
  hint() {
    const m = this.listMoves();
    if (!m.length) return null;
    m.sort((x, y) => y.score - x.score);
    return m[0];
  }

  shuffle() {
    const spots = [], tiles = [];
    this.each((x, r, c) => { if (x.tile && !x.over && !x.block && x.tile.color >= 0 && !x.tile.sp) { spots.push([r, c]); tiles.push(x.tile); } });
    for (let attempt = 0; attempt < 100; attempt++) {
      for (let i = tiles.length - 1; i > 0; i--) { const j = this.rand(i + 1); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
      spots.forEach(([r, c], i) => { this.cells[r][c].tile = tiles[i]; });
      if (this.findMatches().length === 0 && this.hasMoves()) { this.fx.push({ type: "shuffle" }); return true; }
    }
    // fallback: recolor
    spots.forEach(([r, c]) => { this.cells[r][c].tile.color = this.safeColor(r, c); });
    this.fx.push({ type: "shuffle" });
    return this.hasMoves();
  }

  /* ---------- damage ---------- */
  addScore(n) { this.score += n; }
  hit(r, c, src, depth) {
    const x = this.cell(r, c); if (!x || x.hole) return false;
    if (x.block) {
      const def = OBST[x.block.type];
      if (src === "match" && !def.adj) return false;
      if (src === "adj" && !def.adj) return false;
      this.damageLayer(x, "block", r, c);
      return true;
    }
    if (src === "adj") {
      if (x.over && OBST[x.over.type].adj) { this.damageLayer(x, "over", r, c); return true; }
      return false;
    }
    if (x.over) { this.damageLayer(x, "over", r, c); return true; }
    const t = x.tile; if (!t) return false;
    if (t.color === RELIC) return false;
    if (t.sp) {
      this.queue.push({ sp: t.sp, color: t.color, r, c, depth: (depth || 0) + 1, id: t.id });
    }
    x.tile = null;
    this.fx.push({ type: "pop", r, c, id: t.id, color: t.color, sp: t.sp });
    if (t.color >= 0) {
      this.stats.colorCleared[t.color]++;
      for (const o of this.objectives) if (o.t === "color" && o.c === t.color) o.got++;
    }
    this.stats.matched++;
    this.addScore(60 * (1 + Math.min(this.cascade, 8) * 0.5));
    if (this.boss && this.boss.hp > 0) { this.boss.hp = Math.max(0, this.boss.hp - 1); }
    if (x.floor) this.damageLayer(x, "floor", r, c);
    return true;
  }
  damageLayer(x, layer, r, c) {
    const o = x[layer]; if (!o) return;
    o.hp--;
    this.fx.push({ type: "crack", r, c, ob: o.type, hp: o.hp });
    this.addScore(100);
    if (o.type === "vine") this.vineHit = true;
    if (o.hp <= 0) {
      x[layer] = null;
      this.stats.blocksBroken++;
      this.fx.push({ type: "break", r, c, ob: o.type });
      if (o.type === "chest") this.fx.push({ type: "coins", r, c, n: 5 });
      if (this.boss && this.boss.hp > 0) this.boss.hp = Math.max(0, this.boss.hp - 2);
    }
  }

  /* ---------- specials ---------- */
  mostCommonColor() {
    const cnt = new Array(this.ncolors).fill(0);
    this.each(x => { if (x.tile && x.tile.color >= 0) cnt[x.tile.color]++; });
    let best = 0; cnt.forEach((v, i) => { if (v > cnt[best]) best = i; });
    return best;
  }
  // choose a target for fairy spark: something that advances objectives
  sparkTarget(fromR, fromC) {
    const cand = [];
    const need = new Set(this.objectives.filter(o => !this.objDone(o)).map(o => o.t === "color" ? "c" + o.c : o.t));
    this.each((x, r, c) => {
      if (x.hole || (r === fromR && c === fromC)) return;
      let w = 0;
      if (x.block && need.has(x.block.type)) w = 5;
      else if (x.over && need.has(x.over.type)) w = 4;
      else if (x.floor && need.has(x.floor.type) && x.tile && x.tile.color >= 0) w = 4;
      else if (x.tile && x.tile.color >= 0 && need.has("c" + x.tile.color)) w = 2;
      else if (x.tile && x.tile.color >= 0) w = 1;
      if (this.boss && x.block && x.block.type === "shadow") w = Math.max(w, 5);
      if (w) cand.push({ r, c, w });
    });
    if (!cand.length) return null;
    const top = Math.max(...cand.map(o => o.w));
    const best = cand.filter(o => o.w === top);
    return best[this.rand(best.length)];
  }
  hitArea(cells, depth) { for (const [r, c] of cells) this.hit(r, c, "power", depth); }
  rowCells(r) { const a = []; for (let c = 0; c < this.w; c++) a.push([r, c]); return a; }
  colCells(c) { const a = []; for (let r = 0; r < this.h; r++) a.push([r, c]); return a; }
  blastCells(r, c, rad, roundCorners) {
    const a = [];
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      if (roundCorners && Math.abs(dr) === rad && Math.abs(dc) === rad) continue;
      a.push([r + dr, c + dc]);
    }
    return a;
  }
  activate(a) {
    const { sp, r, c, depth } = a;
    this.stats.specialsUsed++;
    this.addScore(200);
    switch (sp) {
      case "bh": this.stats.beams++; this.fx.push({ type: "beam", dir: "h", r, c }); this.hitArea(this.rowCells(r), depth); break;
      case "bv": this.stats.beams++; this.fx.push({ type: "beam", dir: "v", r, c }); this.hitArea(this.colCells(c), depth); break;
      case "core": this.stats.cores++; this.fx.push({ type: "boom", r, c, rad: 2 }); this.hitArea(this.blastCells(r, c, 2, true), depth); break;
      case "bigcore": this.fx.push({ type: "boom", r, c, rad: 3 }); this.hitArea(this.blastCells(r, c, 3, true), depth); break;
      case "cross3": {
        this.fx.push({ type: "beam", dir: "h", r, c, wide: 3 }); this.fx.push({ type: "beam", dir: "v", r, c, wide: 3 });
        const cells = []; for (let k = -1; k <= 1; k++) { cells.push(...this.rowCells(r + k)); cells.push(...this.colCells(c + k)); }
        this.hitArea(cells.filter(([x, y]) => x >= 0 && x < this.h && y >= 0 && y < this.w), depth); break;
      }
      case "cross": this.fx.push({ type: "beam", dir: "h", r, c }); this.fx.push({ type: "beam", dir: "v", r, c }); this.hitArea([...this.rowCells(r), ...this.colCells(c)], depth); break;
      case "orb": {
        this.stats.orbs++;
        const col = a.target != null ? a.target : this.mostCommonColor();
        const cells = [];
        this.each((x, rr, cc) => { if (x.tile && x.tile.color === col) cells.push([rr, cc]); });
        this.fx.push({ type: "orb", r, c, cells, color: col });
        this.hitArea(cells, depth); break;
      }
      case "spark": {
        this.stats.sparks++;
        this.hitArea([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]], depth);
        const t = this.sparkTarget(r, c);
        if (t) {
          this.fx.push({ type: "spark", r, c, tr: t.r, tc: t.c });
          if (a.payload) this.queue.push({ sp: a.payload, r: t.r, c: t.c, depth: depth + 1 });
          else this.hit(t.r, t.c, "power", depth);
        }
        break;
      }
      case "star": {
        this.stats.stars++;
        this.fx.push({ type: "star", r, c });
        this.fx.push({ type: "beam", dir: "h", r, c }); this.fx.push({ type: "beam", dir: "v", r, c });
        const cells = [...this.rowCells(r), ...this.colCells(c)];
        for (let k = 1; k < Math.max(this.w, this.h); k++) cells.push([r + k, c + k], [r - k, c - k], [r + k, c - k], [r - k, c + k]);
        this.hitArea(cells, depth);
        // second stage: three bursts on objective targets
        for (let i = 0; i < 3; i++) { const t = this.sparkTarget(r, c); if (t) this.queue.push({ sp: "smallboom", r: t.r, c: t.c, depth: depth + 1 }); }
        break;
      }
      case "smallboom": this.fx.push({ type: "boom", r, c, rad: 1 }); this.hitArea(this.blastCells(r, c, 1, false), depth); break;
      case "nova": {
        this.fx.push({ type: "nova", r, c });
        const cells = []; this.each((x, rr, cc) => cells.push([rr, cc]));
        this.hitArea(cells, depth);
        this.each((x, rr, cc) => { if (x.block) this.hit(rr, cc, "power", depth); });
        break;
      }
      case "convert": {
        // orb + special: convert one color into specials then fire them
        const col = a.target != null ? a.target : this.mostCommonColor();
        const cells = [];
        this.each((x, rr, cc) => { if (x.tile && x.tile.color === col && !x.tile.sp && !x.over) cells.push([rr, cc]); });
        cells.forEach(([rr, cc]) => {
          let s = a.into; if (s === "beam") s = this.rng() < 0.5 ? "bh" : "bv";
          this.cells[rr][cc].tile.sp = s;
        });
        this.fx.push({ type: "orb", r, c, cells, color: col, convert: a.into });
        this.hitArea(cells, depth);
        break;
      }
    }
  }
  /* run one wave of queued activations; returns true if anything ran */
  runWave() {
    if (!this.queue.length) return false;
    const wave = this.queue; this.queue = [];
    for (const a of wave) this.activate(a);
    return true;
  }

  /* combination when two specials are swapped / or tap a single special */
  comboOf(a, b) {
    const kind = t => (t === "bh" || t === "bv") ? "beam" : t;
    const ka = kind(a.sp), kb = kind(b.sp);
    const has = k => ka === k || kb === k;
    const other = k => (ka === k ? b : a);
    if (has("star")) return { sp: "nova" };
    if (ka === "orb" && kb === "orb") return { sp: "nova" };
    if (has("orb")) { const o = other("orb"); const into = kind(o.sp); return { sp: "convert", into, target: o.color }; }
    if (ka === "core" && kb === "core") return { sp: "bigcore" };
    if (has("beam") && has("core")) return { sp: "cross3" };
    if (ka === "beam" && kb === "beam") return { sp: "cross" };
    if (ka === "spark" && kb === "spark") return { sp: "triplespark" };
    if (has("spark")) { const o = other("spark"); return { sp: "spark", payload: kind(o.sp) === "beam" ? (this.rng() < 0.5 ? "bh" : "bv") : o.sp }; }
    return { sp: "cross" };
  }

  /* ---------- player actions ---------- */
  // returns {ok:boolean, combo?:bool}
  trySwap(a, b) {
    if (this.state !== "play") return { ok: false };
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return { ok: false };
    if (!this.movable(a[0], a[1]) || !this.movable(b[0], b[1])) return { ok: false, blocked: true };
    const ta = this.tile(a[0], a[1]), tb = this.tile(b[0], b[1]);
    this.cascade = 0; this.vineHit = false; this.fx = [];
    // special + special => combo
    if (ta.sp && tb.sp) {
      this.cells[a[0]][a[1]].tile = null; this.cells[b[0]][b[1]].tile = null;
      this.fx.push({ type: "pop", r: a[0], c: a[1], id: ta.id, sp: ta.sp, color: ta.color });
      this.fx.push({ type: "pop", r: b[0], c: b[1], id: tb.id, sp: tb.sp, color: tb.color });
      const cb = this.comboOf(ta, tb);
      this.stats.combos++;
      this.spendMove();
      if (cb.sp === "triplespark") { for (let i = 0; i < 3; i++) this.queue.push({ sp: "spark", r: b[0], c: b[1], depth: 0 }); }
      else this.queue.push(Object.assign({ r: b[0], c: b[1], depth: 0 }, cb));
      this.fx.push({ type: "combo", r: b[0], c: b[1], name: cb.sp });
      return { ok: true, combo: true, swapBack: false };
    }
    // orb / star with normal tile
    if ((ta.sp === "orb" || tb.sp === "orb" || ta.sp === "star" || tb.sp === "star") && (ta.color !== RELIC && tb.color !== RELIC)) {
      const sp = (ta.sp === "orb" || ta.sp === "star") ? ta : tb;
      const other = sp === ta ? tb : ta;
      const pos = sp === ta ? a : b;
      this.cells[pos[0]][pos[1]].tile = null;
      this.fx.push({ type: "pop", r: pos[0], c: pos[1], id: sp.id, sp: sp.sp, color: -1 });
      this.spendMove();
      if (sp.sp === "orb") this.queue.push({ sp: "orb", r: pos[0], c: pos[1], target: other.color, depth: 0 });
      else this.queue.push({ sp: "star", r: pos[0], c: pos[1], depth: 0 });
      return { ok: true, combo: false };
    }
    // normal swap
    this.cells[a[0]][a[1]].tile = tb; this.cells[b[0]][b[1]].tile = ta;
    const m = this.findMatches();
    if (!m.length) {
      // a lone special swapped into place activates (beam/core/spark) — like most match-3 games
      if ((ta.sp && ta.color !== RELIC) || (tb.sp && tb.color !== RELIC)) {
        this.spendMove();
        for (const [t, p] of [[ta, b], [tb, a]]) if (t.sp) { this.hit(p[0], p[1], "power", 0); }
        return { ok: true };
      }
      this.cells[a[0]][a[1]].tile = ta; this.cells[b[0]][b[1]].tile = tb;
      return { ok: false, invalid: true };
    }
    this.spendMove();
    this.lastSwap = [a, b];
    return { ok: true };
  }
  tapSpecial(r, c) {
    if (this.state !== "play") return false;
    const x = this.cell(r, c);
    if (!x || !x.tile || !x.tile.sp || x.over) return false;
    this.cascade = 0; this.vineHit = false; this.fx = [];
    this.spendMove();
    this.hit(r, c, "power", 0);
    return true;
  }
  spendMove() { this.movesUsed++; if (!this.endless) this.moves--; else this.moves--; }

  /* resolve matches once. returns true if something was cleared */
  resolveMatches() {
    const groups = this.findMatches();
    if (!groups.length) return false;
    this.cascade++;
    this.stats.maxCascade = Math.max(this.stats.maxCascade, this.cascade);
    const swapCells = this.lastSwap || [];
    const creations = [];
    const adjDone = new Set();
    for (const g of groups) {
      // choose creation cell
      let spot = null;
      if (g.make) {
        const inGroup = p => g.cells.some(q => q[0] === p[0] && q[1] === p[1]);
        const okSpot = p => { const x = this.cell(p[0], p[1]); return x && !x.over && x.tile && !x.tile.sp; };
        for (const s of swapCells) if (inGroup(s) && okSpot(s)) { spot = s; break; }
        if (!spot && g.pivot && okSpot(g.pivot)) spot = g.pivot;
        if (!spot) spot = g.cells.slice().sort((p, q) => q[0] - p[0])[Math.floor(g.cells.length / 2)];
        if (spot && !okSpot(spot)) spot = g.cells.find(okSpot) || null;
        if (spot) creations.push({ spot, make: g.make, color: g.color });
      }
      if (g.make) this.fx.push({ type: "match", cells: g.cells, color: g.color, make: g.make, size: g.size });
      else this.fx.push({ type: "match", cells: g.cells, color: g.color, size: g.size });
      for (const [r, c] of g.cells) {
        if (creations.length && creations[creations.length - 1].spot === null) {}
        this.hit(r, c, "match", 0);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = (r + dr) + "," + (c + dc);
          if (adjDone.has(k)) continue;
          if (this.hit(r + dr, c + dc, "adj", 0)) adjDone.add(k);
        }
      }
    }
    for (const cr of creations) {
      const x = this.cell(cr.spot[0], cr.spot[1]);
      if (x.tile || x.block || x.over) continue;
      const color = (cr.make === "orb" || cr.make === "star") ? NOCOLOR : cr.color;
      x.tile = this.newTile(color, cr.make);
      this.stats.specialsMade++;
      this.fx.push({ type: "create", r: cr.spot[0], c: cr.spot[1], sp: cr.make, id: x.tile.id });
      this.addScore(300);
    }
    this.lastSwap = null;
    return true;
  }

  /* gravity: moves each tile at most one cell. returns true if anything moved or spawned */
  stuckAbove(r, c) {
    for (let k = r - 1; k >= 0; k--) {
      const x = this.cells[k][c];
      if (x.hole) continue;              // holes are passed through
      if (x.block || x.over) return true;
      if (x.tile) return false;
    }
    return false;
  }
  gravityStep() {
    let moved = false;
    const done = new Set();
    for (let r = this.h - 1; r >= 0; r--) {
      for (let c = 0; c < this.w; c++) {
        const x = this.cells[r][c];
        if (x.hole || x.block || x.tile) continue;
        // find first non-hole above
        let k = r - 1; while (k >= 0 && this.cells[k][c].hole) k--;
        if (k >= 0) {
          const up = this.cells[k][c];
          if (up.tile && !up.over && !up.block && !done.has(up.tile.id)) {
            x.tile = up.tile; up.tile = null; done.add(x.tile.id); moved = true; continue;
          }
        } else {
          // top of column: spawn
          x.tile = this.spawnTile(); x.tile.spawn = true; done.add(x.tile.id); moved = true; continue;
        }
        if (this.stuckAbove(r, c)) {
          // diagonal slide
          for (const dc of (this.rng() < 0.5 ? [-1, 1] : [1, -1])) {
            const rr = r - 1, cc = c + dc;
            const d = this.cell(rr, cc);
            if (d && !d.hole && d.tile && !d.over && !d.block && !done.has(d.tile.id)) {
              // don't steal if the tile could fall straight down
              const below = this.cell(rr + 1, cc);
              if (below && !below.hole && !below.block && !below.tile) continue;
              x.tile = d.tile; d.tile = null; done.add(x.tile.id); moved = true; break;
            }
          }
        }
      }
    }
    return moved;
  }
  spawnTile() {
    const relicGoal = this.objectives.find(o => o.t === "relic");
    if (relicGoal) {
      let onBoard = 0; this.each(x => { if (x.tile && x.tile.color === RELIC) onBoard++; });
      const needed = relicGoal.n - relicGoal.got - onBoard;
      if (needed > 0 && onBoard < 3 && this.rng() < 0.3) { this.relicsSpawned++; return this.newTile(RELIC); }
    }
    return this.newTile(this.randomColor());
  }
  /* collect relics resting on the bottom of their column */
  collectRelics() {
    let got = false;
    for (let c = 0; c < this.w; c++) {
      let r = this.h - 1; while (r >= 0 && this.cells[r][c].hole) r--;
      if (r < 0) continue;
      const x = this.cells[r][c];
      if (x.tile && x.tile.color === RELIC) {
        this.fx.push({ type: "relic", r, c, id: x.tile.id });
        x.tile = null; got = true; this.stats.relics++;
        for (const o of this.objectives) if (o.t === "relic") o.got++;
        this.addScore(500);
      }
    }
    return got;
  }

  /* end of a turn: vines grow, boss acts, win/lose, reshuffle */
  endTurn() {
    this.fx = [];
    // vines spread when no vine was hit
    let vines = [];
    this.each((x, r, c) => { if (x.block && x.block.type === "vine") vines.push([r, c]); });
    if (vines.length && !this.vineHit && this.movesUsed > 0) {
      const opts = [];
      for (const [r, c] of vines) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const y = this.cell(r + dr, c + dc);
        if (y && !y.hole && !y.block && !y.over && y.tile && y.tile.color >= 0 && !y.tile.sp) opts.push([r + dr, c + dc]);
      }
      if (opts.length) {
        const [r, c] = opts[this.rand(opts.length)];
        const y = this.cells[r][c];
        this.fx.push({ type: "pop", r, c, id: y.tile.id, quiet: true });
        y.tile = null; y.block = { type: "vine", hp: 1, max: 1 };
        this.fx.push({ type: "grow", r, c });
      }
    }
    this.vineHit = false;
    // boss stages
    if (this.boss && this.boss.hp > 0) {
      const frac = this.boss.hp / this.boss.max;
      const stage = frac <= 0.34 ? 2 : frac <= 0.67 ? 1 : 0;
      if (stage > this.boss.stage) {
        this.boss.stage = stage;
        const n = 3 + stage;
        const cand = [];
        this.each((x, r, c) => { if (!x.hole && !x.block && !x.over && x.tile && x.tile.color >= 0 && !x.tile.sp) cand.push([r, c]); });
        for (let i = 0; i < n && cand.length; i++) {
          const [r, c] = cand.splice(this.rand(cand.length), 1)[0];
          const y = this.cells[r][c];
          this.fx.push({ type: "pop", r, c, id: y.tile.id, quiet: true });
          y.tile = null; y.block = { type: this.boss.shield || "shadow", hp: 1, max: 1 };
        }
        this.fx.push({ type: "bossCast", stage });
      }
    }
    if (this.isWon()) { this.state = "won"; return "won"; }
    if (this.moves <= 0) { this.state = "lost"; return "lost"; }
    if (!this.hasMoves()) { this.shuffle(); return "shuffled"; }
    return "play";
  }

  /* ---------- objectives ---------- */
  countOnBoard(type) {
    let n = 0;
    this.each(x => {
      for (const L of ["block", "over", "floor"]) if (x[L] && x[L].type === type) n++;
    });
    return n;
  }
  objRemaining(o) {
    if (o.t === "color" || o.t === "relic") return Math.max(0, o.n - o.got);
    if (o.t === "score") return Math.max(0, o.n - Math.floor(this.score));
    if (o.t === "boss") return this.boss ? this.boss.hp : 0;
    return this.countOnBoard(o.t);
  }
  objDone(o) { return this.objRemaining(o) <= 0; }
  isWon() {
    if (this.endless) return false;
    if (!this.objectives.length) return false;
    return this.objectives.every(o => this.objDone(o));
  }
  starsEarned() {
    const total = this.level.moves || 1;
    const left = Math.max(0, this.moves);
    const f = left / total;
    if (this.level.scoreStars) {
      const [a, b] = this.level.scoreStars;
      return this.score >= b ? 3 : this.score >= a ? 2 : 1;
    }
    return f >= 0.3 ? 3 : (f >= 0.1 || left >= 3) ? 2 : 1;
  }

  /* boosters used by the player */
  boosterHammer(r, c) { this.fx = []; this.cascade = 0; const x = this.cell(r, c); if (!x || x.hole) return false; if (x.block && x.block.type === "shadow") { this.damageLayer(x, "block", r, c); return true; } return this.hit(r, c, "power", 0) || true; }
  boosterLine(r, c) { this.fx = []; this.cascade = 0; this.fx.push({ type: "beam", dir: "h", r, c }); this.hitArea(this.rowCells(r), 0); return true; }
  boosterArea(r, c) { this.fx = []; this.cascade = 0; this.fx.push({ type: "boom", r, c, rad: 1 }); this.hitArea(this.blastCells(r, c, 1, false), 0); return true; }
  boosterColor(r, c) {
    this.fx = []; this.cascade = 0;
    const t = this.tile(r, c); const col = t && t.color >= 0 ? t.color : this.mostCommonColor();
    const cells = []; this.each((x, rr, cc) => { if (x.tile && x.tile.color === col) cells.push([rr, cc]); });
    this.fx.push({ type: "orb", r, c, cells, color: col }); this.hitArea(cells, 0); return true;
  }
  addMoves(n) { this.moves += n; if (this.state === "lost") this.state = "play"; }

  /* ---------- text dump for tests ---------- */
  dump() {
    const ch = "RSECAM";
    return this.cells.map(row => row.map(x => {
      if (x.hole) return " ";
      if (x.block) return x.block.type[0].toUpperCase() === "S" ? "#" : x.block.type[0].toUpperCase();
      if (!x.tile) return ".";
      if (x.tile.color === RELIC) return "*";
      if (x.tile.sp) return x.tile.sp[0];
      return ch[x.tile.color];
    }).join("")).join("\n");
  }
}

const api = { Game, mulberry32, GEMS, OBST, RELIC, NOCOLOR };
if (typeof module !== "undefined" && module.exports) module.exports = api;
root.GKEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
