/* CodeRun service worker
   - 앱 셸(index.html 등): network-first — 배포하면 바로 갱신된다
   - /data/*.js 청크: 캐시 우선·백그라운드 갱신 — 처음 오프라인에서도 미리 받은 앱 코드를 읽는다
   - /api/* 와 교차 출처(Monaco/Pyodide CDN)는 건드리지 않는다 */
const VERSION = "v15-copy-sweep";
const SHELL_CACHE = "coderun-shell-" + VERSION;
const DATA_CACHE  = "coderun-data-" + VERSION;
const KEEP = [SHELL_CACHE, DATA_CACHE];

const SHELL = [
  "/data/reader-guide.js?v=15", "/data/reader-guide.js", "/data/glossary.js", "/data/intro.js",
  "/data/study-quality.js?v=15",
  "/data/study-ui.js?v=15", "/data/code-literacy.js?v=15", "/data/learning-path.js?v=15", "/data/coderun-design.css?v=15",
  "/data/vibe-scenarios.js?v=15", "/data/vibe-challenges.js?v=15", "/data/vibe-projects.js?v=15", "/data/vibe-journey.js?v=15", "/data/vibe-lab.js?v=15",
  "/data/build.js?v=15", "/data/service-project.js?v=15", "/data/service-path.js?v=15", "/data/service-export.js?v=15",
  "/data/build.js", "/data/service-project.js", "/data/service-path.js", "/data/service-export.js",
  "/", "/index.html", "/manifest.webmanifest",
  "/data/study-design.css", "/data/study-ui.css",
  "/data/coderun-design.css", "/data/vibe-challenges.js", "/data/vibe-projects.js", "/data/vibe-journey.js", "/data/vibe-lab.css", "/data/vibe-scenarios.js", "/data/vibe-lab.js",
  "/data/learning-path.js", "/data/study-ui.js", "/data/build-worker.js", "/data/practice-worker.js", "/data/sql-practice.js", "/data/study-quality.js", "/data/dom-practice.js", "/data/code-literacy.js", "/vendor/acorn.js",
  "/icons/icon-192.png", "/icons/icon-512.png"
];

const isData = (p) => p.startsWith("/data/") && p.endsWith(".js");

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => KEEP.indexOf(k) < 0).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 앱이 "이 트랙 미리 받아둬" 라고 알려주면 백그라운드로 캐시에 채운다 */
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "version") { if (e.ports && e.ports[0]) e.ports[0].postMessage({ version: VERSION }); return; }
  if (d.type !== "precache" || !Array.isArray(d.urls)) return;
  e.waitUntil(caches.open(DATA_CACHE).then((c) =>
    Promise.all(d.urls.map((u) =>
      c.match(u).then((hit) => hit ? null : c.add(u).catch(() => {}))
    ))
  ));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // CDN 은 통과
  if (url.pathname.startsWith("/api/")) return;    // AI 프록시는 절대 캐시하지 않는다

  /* 데이터 청크: stale-while-revalidate.
     캐시가 있으면 즉시 내주고(로딩이 빨라진다), 뒤에서 새로 받아 캐시를 갱신한다.
     그래서 콘텐츠를 고쳐 배포해도 다음 실행에는 반영된다 — 캐시 버전을 손으로 올릴 필요가 없다. */
  if (isData(url.pathname)) {
    e.respondWith(
      caches.open(DATA_CACHE).then((c) =>
        c.match(req)
          .then((hit) => hit || caches.open(SHELL_CACHE).then((shell) => shell.match(req)))
          .then((hit) => {
          const net = fetch(req).then((res) => {
            if (res && res.ok) c.put(req, res.clone()).catch(() => {});
            return res;
          });
          if (!hit) return net;
          net.catch(() => {});   // 오프라인이면 조용히 실패시키고 캐시본을 쓴다
          return hit;
        })
      )
    );
    return;
  }

  /* 셸: network-first, 실패하면 캐시 → 최후엔 "/" */
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match("/")))
  );
});
