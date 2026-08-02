/* 배선 문항이 실제 화면에서 동작하는가.

   채점 엔진은 따로 검증했지만(ver_wire.cjs), 손으로 이어지는지는 다른 문제다.
   핀을 눌러 선이 생기는가, 선을 눌러 지워지는가, 정답대로 이으면 통과 판정이 나는가.
   엔진이 맞아도 UI 가 좌표를 잘못 잡으면 아무도 못 푼다.

     node tools/content/pw_wire.cjs */
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

/* 주입된 데이터에서 배선 문항을 읽는다 — 콘텐츠 파일이 아니라 앱이 쓰는 값이다 */
const raw = fs.readFileSync(path.join(ROOT, "data", "t-arduino.js"), "utf8");
const data = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
const items = [];
data.forEach(u => (u.l || []).forEach(l => (l.q || []).forEach(q => {
  if (q && q.t === "wire") items.push({ unit: u.t, q: q });
})));

(async () => {
  const srv = await serve();
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 390, height: 820 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e.message)));
  await p.addInitScript(s => { try { localStorage.setItem("coderun", JSON.stringify(s)); } catch (e) {} },
    { onboarded: true, goal: "free", freeMode: true });
  await p.goto("http://127.0.0.1:" + srv.address().port + "/index.html");
  await p.waitForFunction(() => typeof showQ === "function" && typeof wireCheck === "function", { timeout: 60000 });

  const bad = [];
  for (const it of items) {
    const q = it.q;
    const r = await p.evaluate(async ({ q, sol }) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      /* 실제 문항 흐름을 그대로 태운다 */
      run = { lang: "arduino", les: { title: "배선 확인", xp: 0, q: [q, q] }, i: 0,
              correct: 0, total: 2, hearts: 5, id: null, color: "#5b6cff", free: true };
      document.getElementById("lesson").classList.add("on");
      showQ();
      await sleep(60);

      const stage = document.getElementById("wire-stage");
      if (!stage) return { err: "배선판이 그려지지 않았다" };
      const pinEls = [...stage.querySelectorAll(".wire-pin")].map(e => e.getAttribute("data-pin"));
      const startLines = stage.querySelectorAll(".wire-line").length;

      /* 화면의 핀을 실제로 눌러서 잇는다 — wireList 를 직접 건드리지 않는다 */
      const tap = sel => { const e = stage.querySelector(sel); if (!e) return false;
        e.dispatchEvent(new MouseEvent("click", { bubbles: true })); return true; };
      const pin = id => `.wire-pin[data-pin="${CSS.escape(id)}"]`;

      /* 먼저 남아 있는 선을 모두 지운다 (시작 배선이 틀린 문항 대비) */
      let guard = 0;
      while (stage.querySelector(".wire-line") && guard++ < 20) {
        stage.querySelector(".wire-line").dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      const clearedTo = stage.querySelectorAll(".wire-line").length;

      let missing = null;
      for (const [a, c] of sol) {
        if (!tap(pin(a)) || !tap(pin(c))) { missing = a + " / " + c; break; }
      }
      const drawn = stage.querySelectorAll(".wire-line").length;
      const res = document.getElementById("wire-res").textContent;

      /* 확인 버튼을 눌러 실제 판정을 본다 */
      document.getElementById("check").click();
      for (let t = 0; t < 40 && !run.answered; t++) await sleep(30);

      return { pins: pinEls.length, startLines, clearedTo, drawn, missing,
               ok: !!run.lastOk, res: res.replace(/\s+/g, " ").trim().slice(0, 60) };
    }, { q: q, sol: q.sol });

    if (r.err) { bad.push(q.k + ": " + r.err); continue; }
    if (r.missing) { bad.push(q.k + ": 화면에 없는 핀 — " + r.missing); continue; }
    if (r.clearedTo !== 0) bad.push(q.k + ": 선을 눌러도 지워지지 않는다 (" + r.clearedTo + "개 남음)");
    if (r.drawn !== q.sol.length) bad.push(q.k + ": 그은 선이 " + r.drawn + "개, 기대 " + q.sol.length + "개");
    if (!r.ok) bad.push(q.k + ": 정답대로 이었는데 통과 판정이 아니다 — " + r.res);
    if (!bad.length || bad[bad.length - 1].indexOf(q.k) !== 0)
      console.log("  " + (r.ok ? "✓" : "✗") + " " + q.k.padEnd(28)
        + " 핀 " + r.pins + "개 · 시작선 " + r.startLines + " → 지움 → " + r.drawn + "개 연결");
  }

  await b.close(); srv.close();
  if (errs.length) bad.push("pageerror: " + errs[0]);
  console.log("\n화면에서 배선 " + items.length + "문항 확인");
  if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("전부 통과 — 눌러서 잇고, 눌러서 지우고, 정답이면 통과 판정이 난다");
})();
