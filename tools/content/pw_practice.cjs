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
const WEB = require("./web_basic.js");

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
/* 레이아웃을 재는 문항(html·css)은 iframe 이 화면 안에 있어야 한다.
   left:-9999px 로 밀어 두면 레이아웃이 계산되지 않아 RECT().width 가 0 으로 나오고,
   폭 검사만 실패하고 padding 검사는 통과하는 이상한 모습이 된다.
   그래서 보이지 않게(opacity 0) 하되 자리는 화면 안에 둔다 — 앱의 미리보기와 같다. */
/* 하네스는 결과를 두 번 보낸다 — 파싱 직후 한 번, load 직후 한 번.
   레이아웃이 확정된 것은 두 번째다. 앱도 마지막 값을 쓰므로 여기서도 그래야 한다.
   첫 값으로 판정하면 폭·위치 검사가 무작위로 실패한다.
   onload 시점에 맞춰 끊으면 두 번째 값이 아직 안 온 경우가 생겨, 그냥 넉넉히 기다린다. */

(async () => {
  const srv = await serve();
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 390, height: 820 } });
  const errs = []; p.on("pageerror", e => errs.push(String(e.message)));
  await p.addInitScript(s => { try { localStorage.setItem("coderun", JSON.stringify(s)); } catch (e) {} },
    { onboarded: true, goal: "free", freeMode: true });
  await p.goto("http://127.0.0.1:" + srv.address().port + "/index.html");
  await p.waitForFunction(() => typeof testDoc === "function" && typeof gradeSql === "function" && typeof htmlTestDoc === "function", { timeout: 60000 });

  const items = flat(JS, "js").concat(flat(SQL, "sql")).concat(flat(WEB, "html"));
  const out = await p.evaluate(async (items) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const res = [];
    const ONSCREEN = "position:fixed;top:0;left:0;width:400px;height:420px;opacity:0;pointer-events:none;border:0;z-index:-1";
    const OFFSCREEN = "position:absolute;left:-9999px;width:10px;height:10px";

    /* 앱이 쓰는 그 하네스를 그대로 쓴다 — 채점 규칙을 여기서 다시 구현하지 않는다 */
    function gradeJs(q, code) {
      return new Promise(resolve => {
        const f = document.createElement("iframe");
        f.style.cssText = OFFSCREEN;
        f.setAttribute("sandbox", "allow-scripts");
        /* 보낸 프레임을 반드시 확인한다. 앞 문항의 프레임이 늦게 보낸 결과를
           받으면 문항과 결과가 한 칸씩 밀려서, 멀쩡한 문제가 실패로 보인다. */
        let last = null, done = false;
        const fin = () => { if (done) return; done = true;
          window.removeEventListener("message", on); f.remove(); resolve(last); };
        const on = e => {
          if (!e.data || e.data.__cr !== "test" || e.source !== f.contentWindow) return;
          last = e.data;                       // 마지막 값을 쓴다
        };
        window.addEventListener("message", on);
        document.body.appendChild(f);
          // load 뒤 한 번 더 오는 값을 기다린다
        f.srcdoc = testDoc(code, { tests: q.tests, edge: q.edge });
        setTimeout(fin, 1200);   // 하네스의 두 번째 실행까지 넉넉히 기다린다
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
      } else if (x.lang === "html") {
        /* 앱이 쓰는 htmlTestDoc 을 그대로 쓴다 — 브라우저가 실제로 그린 결과를 본다 */
        const grade = (code) => new Promise(resolve => {
          const f = document.createElement("iframe");
          f.style.cssText = ONSCREEN;
          f.setAttribute("sandbox", "allow-scripts");
          let last = null, done = false;
          const fin = () => { if (done) return; done = true;
            window.removeEventListener("message", on); f.remove(); resolve(last); };
          const on = e => {
            if (!e.data || e.data.__cr !== "test" || e.source !== f.contentWindow) return;
            last = e.data;
          };
          window.addEventListener("message", on);
          document.body.appendChild(f);
          
          f.srcdoc = htmlTestDoc(code, x.tests);
          setTimeout(fin, 1200);   // 하네스의 두 번째 실행까지 넉넉히 기다린다
        });
        const sol = await grade(x.sol), src = await grade(x.src);
        res.push({ k: x.k, unit: x.unit, lang: "html",
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
  const cnt = k => out.filter(r => r.lang === k).length;
  console.log("앱 채점 경로로 확인 · JS " + cnt("js") + " · SQL " + cnt("sql") + " · HTML " + cnt("html") + "문항");
  if (errs.length) bad.push("pageerror: " + errs[0]);
  if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("전부 통과 — 정답은 앱에서 통과하고, 시작 코드는 앱에서 반드시 막힌다");
})();
