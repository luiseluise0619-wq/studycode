/* 비동기 채점이 실제로 되는가 — 그리고 기존 동기 문항이 망가지지 않았는가.

   채점기는 원래 eval 결과를 그대로 비교했다. async 함수는 Promise 를 돌려주므로
   무엇을 써도 통과하지 못했다. 그래서 비동기 유닛에는 실습을 못 넣고 있었다.

   여기서 보는 것
     1. async 함수를 채점할 수 있는가 (프라미스를 기다렸다가 비교)
     2. 거부된 프라미스가 오류로 보고되는가
     3. 끝나지 않는 프라미스가 시간 제한에 걸리는가 — 브라우저가 멎으면 안 된다
     4. 기존 동기 문항이 그대로 통과하는가 (되돌아가지 않았는지)

     node tools/content/pw_async.cjs */
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

const CASES = [
  { name: "동기 — 정답",
    code: "function add(a, b) { return a + b; }",
    tests: [["add(1, 2)", "3"]], gate: true },
  { name: "동기 — 오답 (되돌아가지 않았는지)",
    code: "function add(a, b) { return a - b; }",
    tests: [["add(1, 2)", "3"]], gate: false },
  { name: "비동기 — 정답",
    code: "async function fetchTwo() { return 2; }",
    tests: [["fetchTwo()", "2"]], gate: true },
  { name: "비동기 — 오답",
    code: "async function fetchTwo() { return 9; }",
    tests: [["fetchTwo()", "2"]], gate: false },
  { name: "비동기 — 기다렸다 돌려주기",
    code: "const sleep = ms => new Promise(r => setTimeout(r, ms));\n"
        + "async function slow() { await sleep(30); return 'ok'; }",
    tests: [["slow()", "'ok'"]], gate: true },
  { name: "비동기 — Promise.all 로 모으기",
    code: "async function all() { return Promise.all([1, Promise.resolve(2)]); }",
    tests: [["all()", "[1, 2]"]], gate: true },
  { name: "거부된 프라미스는 오류로",
    code: "async function boom() { throw new Error('붐'); }",
    tests: [["boom()", "1"]], gate: false },
  { name: "끝나지 않는 프라미스는 시간 제한",
    code: "function never() { return new Promise(() => {}); }",
    tests: [["never()", "1"]], gate: false, slow: true },
];

(async () => {
  const srv = await serve();
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 390, height: 820 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e.message)));
  await p.goto("http://127.0.0.1:" + srv.address().port + "/index.html");
  await p.waitForFunction(() => typeof testDoc === "function", { timeout: 60000 });

  const bad = [];
  for (const c of CASES) {
    const t0 = Date.now();
    const r = await p.evaluate(({ code, tests }) => new Promise(resolve => {
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;top:0;left:0;width:300px;height:300px;opacity:0;pointer-events:none";
      f.setAttribute("sandbox", "allow-scripts");
      let done = false;
      const fin = v => { if (done) return; done = true;
        window.removeEventListener("message", on); f.remove(); resolve(v); };
      const on = e => {
        if (!e.data || e.data.__cr !== "test" || e.source !== f.contentWindow) return;
        fin({ gate: !!e.data.gate, pass: e.data.pass, total: e.data.total });
      };
      window.addEventListener("message", on);
      document.body.appendChild(f);
      f.srcdoc = testDoc(code, { tests: tests.map(x => ({ in: x[0], out: x[1] })), edge: [] });
      /* 채점기 자체가 멎으면 여기서 잡는다 — 8초는 3초 제한보다 넉넉하다 */
      setTimeout(() => fin(null), 8000);
    }), { code: c.code, tests: c.tests });
    const ms = Date.now() - t0;

    if (!r) { bad.push(c.name + ": 결과가 오지 않았다 (채점기가 멎었다)"); continue; }
    if (r.gate !== c.gate) bad.push(c.name + ": 통과 여부가 " + r.gate + " (기대 " + c.gate + ")");
    if (c.slow && ms > 6000) bad.push(c.name + ": " + ms + "ms 나 걸렸다 — 시간 제한이 안 먹는다");
    console.log("  " + (r.gate === c.gate ? "✓" : "✗") + " " + c.name.padEnd(30)
      + r.pass + "/" + r.total + "  " + ms + "ms");
  }

  await b.close(); srv.close();
  if (errs.length) bad.push("pageerror: " + errs[0]);
  console.log("\n" + CASES.length + "가지 확인");
  if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("비동기도 채점되고, 동기는 그대로이며, 멎지 않는다");
})();
