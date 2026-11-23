// Offline support: cache-first for hashed static assets, network-first for pages
// (so a deployed update is picked up whenever the phone is online).
const CACHE = "roulette-academy-v2";
const PRECACHE = ["/", "/play", "/guided", "/program", "/learn", "/strategies", "/simulator", "/casino", "/casino/session", "/assessment", "/history", "/settings"];

self.addEventListener("install", (e) => {
  // Cache each page independently so one failure can't abort the whole install.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  const isAsset = /\/_next\/static\/|\/icons\//.test(req.url);
  if (isAsset) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match("/"))));
  }
});
