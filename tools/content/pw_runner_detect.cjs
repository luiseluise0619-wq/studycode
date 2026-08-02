/* 로컬 실행 서버 자동 탐지가 실제로 동작하는가.

   설계 문서는 '127.0.0.1 자동 탐지' 라고 적어 두었지만 실제로는 없었다.
   러너를 띄워 두고도 앱이 못 찾아 '설정되지 않았어요' 만 보게 된다.

   두 가지를 본다.
     1. 러너가 켜져 있으면 설정 없이 찾아서 채점까지 가는가
     2. 꺼져 있으면 오래 매달리지 않고 안내로 끝나는가 (한 번만 시도)

     node tools/content/pw_runner_detect.cjs */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "..", "..");

function serve() {
  const T = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png",
              ".webmanifest": "application/manifest+json" };
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const rel = decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { "content-type": T[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0, "127.0.0.1", () => res(s));
  });
}

/* 러너 대역: 진짜 서버를 켜지 않고도 탐지 경로를 시험한다.
   CORS 헤더는 tools/runner/server.cjs 와 글자까지 같게 맞춘다. 대역이 실제보다
   너그러우면 브라우저에서만 막히는 문제를 놓친다 — 실제로 한 번 놓쳤다.
   POST 는 content-type 때문에 preflight 가 먼저 오므로 OPTIONS 처리가 필수다. */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, GET, OPTIONS",
};
function fakeRunner(port) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      if (q.method === "OPTIONS") return r.writeHead(204, CORS).end();
      r.writeHead(200, Object.assign({ "content-type": "application/json" }, CORS));
      if (q.url.startsWith("/health")) return r.end(JSON.stringify({ ok: true, langs: { go: true } }));
      r.end(JSON.stringify({ pass: true, output: "ok" }));
    });
    s.listen(port, "127.0.0.1", () => res(s));
  });
}

(async () => {
  const srv = await serve();
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const bad = [];

  const open = async () => {
    const p = await b.newPage({ viewport: { width: 390, height: 820 } });
    await p.addInitScript(s => { try { localStorage.setItem("coderun", JSON.stringify(s)); } catch (e) {} },
      { onboarded: true, goal: "free", freeMode: true });
    await p.goto("http://127.0.0.1:" + srv.address().port + "/index.html");
    await p.waitForFunction(() => typeof runnerDetect === "function", { timeout: 60000 });
    return p;
  };

  /* 1. 러너가 켜져 있을 때 — 설정이 비어 있어도 찾아내야 한다 */
  const rn = await fakeRunner(8787);
  {
    const p = await open();
    const r = await p.evaluate(async () => {
      const before = (runnerCfg().url || "");
      const found = await runnerDetect();
      return { before, found, after: runnerCfg().url || "", ready: runnerReady() };
    });
    if (r.before !== "") bad.push("시작할 때 주소가 비어 있어야 한다: " + r.before);
    if (r.found !== "http://127.0.0.1:8787") bad.push("켜져 있는 러너를 못 찾았다: " + r.found);
    if (!r.ready) bad.push("찾은 뒤 runnerReady 가 참이어야 한다");
    console.log("러너 켜짐 → 자동 탐지: " + (r.found || "실패") + " · 설정에 저장됨: " + (r.after || "안 됨"));

    /* 찾은 주소로 실제 채점 경로까지 가는가 */
    const g = await p.evaluate(() => runnerTest("go", "package ex", { "a_test.go": "x" }, "t"));
    if (!g || !g.pass) bad.push("탐지 후 채점 경로가 이어지지 않는다: " + JSON.stringify(g));
    else console.log("탐지된 주소로 채점 요청까지 성공");
    await p.close();
  }
  await new Promise(r => rn.close(r));

  /* 2. 러너가 꺼져 있을 때 — 오래 매달리지 않고, 두 번째부터는 다시 찌르지 않아야 한다 */
  {
    const p = await open();
    const r = await p.evaluate(async () => {
      const t0 = performance.now();
      const first = await runnerDetect();
      const mid = performance.now();
      const second = await runnerDetect();
      return { first, second, firstMs: mid - t0, secondMs: performance.now() - mid };
    });
    if (r.first !== null) bad.push("꺼져 있는데 찾았다고 한다: " + r.first);
    if (r.firstMs > 6000) bad.push("탐지가 너무 오래 걸린다: " + Math.round(r.firstMs) + "ms");
    if (r.secondMs > 100) bad.push("두 번째 호출이 다시 네트워크를 찌른다: " + Math.round(r.secondMs) + "ms");
    console.log("러너 꺼짐 → 첫 시도 " + Math.round(r.firstMs) + "ms 만에 포기 · 두 번째 "
      + Math.round(r.secondMs) + "ms (기억해 둔 결과)");

    const t = await p.evaluate(() => runnerTest("go", "x", { "a_test.go": "y" }, "t"));
    if (!t || !t.needRunner) bad.push("러너가 없으면 needRunner 로 알려야 한다: " + JSON.stringify(t));
    else console.log("러너 없음을 needRunner 로 알린다");
    await p.close();
  }

  await b.close(); srv.close();
  if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("\n자동 탐지 정상 — 러너를 켜 두기만 하면 설정 없이 채점된다");
})();
