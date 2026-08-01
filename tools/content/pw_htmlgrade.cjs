/* HTML 문항 채점이 실제 화면 흐름에서 안정적인가.

   하네스는 결과를 두 번 보낸다 — 파싱 직후, load 직후. 폭·위치 같은 레이아웃 값은
   두 번째가 맞다. 고정 시간만 기다리면 느린 기기에서 '폭 0' 인 첫 값으로 채점해
   맞은 답을 틀렸다고 한다. 그래서 같은 문항을 여러 번 채점해 흔들리지 않는지 본다.

     node tools/content/pw_htmlgrade.cjs */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "..", "..");
const WEB = require("./web_basic.js");

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

/* 레이아웃을 재는 문항만 고른다 — 여기가 흔들리는 자리다 */
const LAYOUT = WEB.find(g => g.unit === "CSS 기초").q;
const ROUNDS = 5;

(async () => {
  const srv = await serve();
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 390, height: 820 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e.message)));
  await p.addInitScript(s => { try { localStorage.setItem("coderun", JSON.stringify(s)); } catch (e) {} },
    { onboarded: true, goal: "free", freeMode: true });
  await p.goto("http://127.0.0.1:" + srv.address().port + "/index.html");
  await p.waitForFunction(() => typeof onCheck === "function" && typeof showQ === "function", { timeout: 60000 });

  const out = await p.evaluate(async ({ qs, rounds }) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const res = [];
    for (const qq of qs) {
      for (const which of ["sol", "src"]) {
        const marks = [];
        for (let i = 0; i < rounds; i++) {
          const q = { t: "html", k: qq.k, q: qq.q, src: qq.src, tests: qq.tests, ex: qq.ex };
          /* 실제 문항 흐름을 그대로 태운다 — 채점 규칙을 여기서 다시 만들지 않는다 */
          run = { lang: "web", les: { title: "채점 안정성", xp: 0, q: [q, q] }, i: 0,
                  correct: 0, total: 2, hearts: 5, id: null, color: "#5b6cff", free: true };
          document.getElementById("lesson").classList.add("on");
          showQ();
          await sleep(80);
          document.getElementById("livecode").value = qq[which];
          document.getElementById("check").click();
          for (let t = 0; t < 60 && !run.answered; t++) await sleep(60);
          marks.push(run.answered ? !!run.lastOk : null);
        }
        res.push({ k: qq.k, which, marks });
      }
    }
    return res;
  }, { qs: LAYOUT, rounds: ROUNDS });

  await b.close(); srv.close();

  const bad = [];
  out.forEach(r => {
    const want = r.which === "sol";
    const wrong = r.marks.filter(m => m !== want).length;
    console.log((wrong ? "✗ " : "✓ ") + r.k.padEnd(18) + r.which
      + "  " + r.marks.map(m => m === null ? "?" : m ? "○" : "×").join(" "));
    if (wrong) bad.push(r.k + " (" + r.which + "): " + ROUNDS + "번 중 " + wrong + "번 다르게 채점됐다");
  });
  if (errs.length) bad.push("pageerror: " + errs[0]);
  if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("\n실제 채점 흐름으로 " + ROUNDS + "번씩 — 판정이 흔들리지 않는다");
})();
