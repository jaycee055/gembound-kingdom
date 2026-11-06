/* Gembound Kingdom service worker: offline play */
const CACHE = "gembound-v2";
const CORE = ["./", "index.html", "manifest.webmanifest", "privacy.html", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png",
  "img/bo_bomb.webp", "img/bo_hammer.webp", "img/bo_moves5.webp", "img/bo_prism.webp", "img/bo_saber.webp", "img/bo_shuffle.webp", "img/cat_happy.webp", "img/cat_surprised.webp", "img/ch_crystal.webp", "img/ch_golden.webp", "img/ch_legendary.webp", "img/ch_open.webp", "img/ch_silver.webp", "img/ch_wooden.webp", "img/gem0.webp", "img/gem1.webp", "img/gem2.webp", "img/gem3.webp", "img/gem4.webp", "img/gem5.webp", "img/heart.webp", "img/ob_cage.webp", "img/ob_chest.webp", "img/ob_chest2.webp", "img/ob_ice.webp", "img/ob_lock.webp", "img/ob_portal.webp", "img/ob_resin.webp", "img/ob_shadow.webp", "img/ob_stone.webp", "img/ob_stone2.webp", "img/ob_vine.webp", "img/pr_cheer.webp", "img/pr_happy.webp", "img/pr_worried.webp", "img/relic.webp", "img/sp_bh.webp", "img/sp_bv.webp", "img/sp_core.webp", "img/sp_orb.webp", "img/sp_spark.webp", "img/sp_star.webp"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // page: network first so updates arrive immediately, cached copy offline
  if (req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith("/index.html"))) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return r; })
      .catch(() => caches.match("index.html").then(r => r || caches.match("./"))));
    return;
  }
  // same-origin assets and Google Fonts: cache first
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === "opaque")) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => hit)));
  }
});
