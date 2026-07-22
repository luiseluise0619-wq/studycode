/* CodeRun service worker — app-shell cache, network-first so deploys update,
   offline fallback. Never touches /api/* or cross-origin (Monaco/Pyodide CDNs). */
const CACHE = "coderun-v2";
const SHELL = [
  "/", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // CDNs (Monaco/Pyodide) pass through
  if (url.pathname.startsWith("/api/")) return;     // never cache the AI proxy
  // network-first: fresh on deploy, cached when offline
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match("/")))
  );
});
