/* Gembound Kingdom service worker: offline play */
const CACHE = "gembound-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "privacy.html", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];
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
