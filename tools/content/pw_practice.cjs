/* 새로 넣은 실습이 '진짜 앱에서' 채점되는지 본다.

   Node 에서 통과한 것이 브라우저에서도 통과한다는 보장이 없다.
   실제로 한 번 갈렸다 — 느슨한 모드에서 this 가 window 라 window.name 이 빈 문자열이었고,
   Node 에서 실패하던 시작 코드가 브라우저에서는 우연히 통과할 뻔했다.
   그래서 앱의 채점 경로(iframe 하네스 · sql.js)를 그대로 태워서 다시 확인한다.

   파이썬은 Pyodide 가 필요해 여기서 못 본다 — 그건 pw_pyodide.cjs 몫이다.

     node tools/content/pw_practice.cjs */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "..", "..");

const JS = require("./js_basic.js");
const SQL = require("./sql_basic.js");

function serve() {
  const T = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json",
              ".webmanifest": "application/manifest+json", ".png": "image/png" };
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

const flat = (gs, lang) => gs.flatMap(g => g.q.map(x => Object.assign({ lang, unit: g.unit }, x)));

(async () => {
  const srv = await serve();
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 390, height: 820 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e.message)));
  await p.addInitScript(s => { try { localStorage.setItem("coderun", JSON.stringify(s)); } catch (e) {} },
    { onboarded: true, goal: "free", freeMode: true });
  await p.goto("http://127.0.0.1:" + srv.address().port + "/index.html");
  await p.waitForFunction(() => typeof testDoc === "function" && typeof gradeSql === "function", { timeout: 60000 });

  const items = flat(JS, "js").concat(flat(SQL, "sql"));
  const out = await p.evaluate(async (items) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const res = [];

    /* 앱이 쓰는 그 하네스를 그대로 쓴다 — 채점 규칙을 여기서 다시 구현하지 않는다 */
    function gradeJs(q, code) {
      return new Promise(resolve => {
        const f = document.createElement("iframe");
        f.style.cssText = "position:absolute;left:-9999px;width:10px;height:10px";
        f.setAttribute("sandbox", "allow-scripts");
        const on = e => {
          if (!e.data || e.data.__cr !== "test") return;
          window.removeEventListener("message", on); f.remove();
          resolve(e.data);
        };
        window.addEventListener("message", on);
        document.body.appendChild(f);
        f.srcdoc = testDoc(code, { tests: q.tests, edge: q.edge });
        setTimeout(() => { window.removeEventListener("message", on); f.remove(); resolve(null); }, 8000);
      });
    }

    for (const x of items) {
      if (x.lang === "js") {
        const q = { tests: x.tests.map(c => ({ in: c[0], out: c[1] })),
                    edge: (x.edge || []).map(c => ({ in: c[0], out: c[1] })) };
        const sol = await gradeJs(q, x.sol);
        const src = await gradeJs(q, x.src);
        res.push({ k: x.k, unit: x.unit, lang: "js",
                   solGate: sol ? !!sol.gate : null, srcGate: src ? !!src.gate : null,
                   solPass: sol ? sol.pass + "/" + sol.total : "?",
                   srcPass: src ? src.pass + "/" + src.total : "?" });
      } else {
        const q = { schema: x.schema, sol: x.sol, ordered: !!x.ordered };
        const good = await gradeSql(q, x.sol);
        const bad = await gradeSql(q, x.src);
        res.push({ k: x.k, unit: x.unit, lang: "sql",
                   solGate: good && !good.error ? !!good.ok : null,
                   srcGate: bad && !bad.error ? !!bad.ok : false,
                   solPass: good && good.error ? ("오류: " + good.error) : (good ? good.gotN + "행" : "?"),
                   srcPass: bad && bad.error ? ("오류: " + bad.error) : (bad ? bad.gotN + "행" : "?") });
      }
      await sleep(10);
    }
    return res;
  }, items);

  await b.close(); srv.close();

  const bad = [];
  out.forEach(r => {
    if (r.solGate !== true) bad.push(r.k + " [" + r.unit + "]: 정답이 앱에서 통과하지 못한다 (" + r.solPass + ")");
    if (r.srcGate !== false) bad.push(r.k + " [" + r.unit + "]: 시작 코드가 앱에서 이미 통과한다 (" + r.srcPass + ")");
  });
  const js = out.filter(r => r.lang === "js").length, sql = out.length - js;
  console.log("앱 채점 경로로 확인 · JS " + js + "문항 · SQL " + sql + "문항");
  if (errs.length) bad.push("pageerror: " + errs[0]);
  if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("전부 통과 — 정답은 앱에서 통과하고, 시작 코드는 앱에서 반드시 막힌다");
})();
