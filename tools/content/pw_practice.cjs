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
const SQL2 = require("./sql_mid.js");
const SQL3 = require("./sql_third.js");
const WEB = require("./web_basic.js");
const WEB2 = require("./web_second.js");
const REACT = require("./react_basic.js");
const REACTA = require("./react_async.js");
const REACT3 = require("./react_third.js");
const ALGO = require("./algo_basic.js");
const JSMID = require("./js_mid.js");
const JSASYNC = require("./js_async.js");
const JS3 = require("./js_third.js");
const BE3 = require("./be_third.js");

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
  /* '실패를 화면에 그렸는가' 를 묻는 문항은 일부러 거부되는 프라미스를 넘긴다.
     .catch 를 안 쓴 시작 코드에서는 그게 처리되지 않은 거부로 새어 나오는데,
     그건 문항이 노린 바로 그 모습이다. 그래서 그 메시지만 빼고 나머지는 그대로 본다. */
  const errs = []; p.on("pageerror", e => {
    if (/의도된 실패/.test(String(e.message))) return;
    errs.push(String(e.message));
  });
  await p.addInitScript(s => { try { localStorage.setItem("coderun", JSON.stringify(s)); } catch (e) {} },
    { onboarded: true, goal: "free", freeMode: true });
  await p.goto("http://127.0.0.1:" + srv.address().port + "/index.html");
  await p.waitForFunction(() => typeof testDoc === "function" && typeof gradeSql === "function" && typeof htmlTestDoc === "function" && typeof reactTestDoc === "function", { timeout: 60000 });

  const items = flat(JS, "js").concat(flat(ALGO, "js")).concat(flat(JSMID, "js")).concat(flat(JSASYNC, "js")).concat(flat(JS3, "js")).concat(flat(BE3, "js")).concat(flat(SQL, "sql")).concat(flat(SQL2, "sql")).concat(flat(SQL3, "sql")).concat(flat(WEB, "html")).concat(flat(WEB2, "html")).concat(flat(REACT, "react")).concat(flat(REACTA, "react")).concat(flat(REACT3, "react"));
  /* 한 언어만 다시 보고 싶을 때가 있다 — React 는 한 문항에 최대 24초라
     전체를 다시 돌리면 15분이 넘는다. PW_ONLY=react 처럼 골라서 돌린다. */
  const only = process.env.PW_ONLY;
  const items2 = only ? items.filter(x => x.lang === only) : items;
  const out = await p.evaluate(async (items) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const res = [];
    /* 레이아웃을 재는 프레임은 '진짜로 보이게' 둔다. opacity:0 이나 z-index:-1 로
       가려 두면 크로미움이 렌더 자체를 건너뛰어 RECT().width 가 0 으로 나온다.
       앱에서는 미리보기가 실제로 보이므로 이 문제가 없다 — 검증기만 불리한 조건이었다. */
    const ONSCREEN = "position:fixed;top:0;left:0;width:400px;height:420px;border:0;z-index:99999;background:#fff";
    const OFFSCREEN = "position:absolute;left:-9999px;width:10px;height:10px";
    /* React 는 변환기(sucrase)와 라이브러리를 먼저 받아 둔다 — 앱이 하는 그대로다 */
    await ensureSucrase();
    const REACT_LIB = await ensureReactSrc();

    /* 앱이 쓰는 그 하네스를 그대로 쓴다 — 채점 규칙을 여기서 다시 구현하지 않는다 */
    function gradeJs(q, code) {
      return new Promise(resolve => {
        const f = document.createElement("iframe");
        f.style.cssText = OFFSCREEN;
        f.setAttribute("sandbox", "allow-scripts");
        /* 보낸 프레임을 반드시 확인한다. 앞 문항의 프레임이 늦게 보낸 결과를
           받으면 문항과 결과가 한 칸씩 밀려서, 멀쩡한 문제가 실패로 보인다. */
        let last = null, done = false, seen = 0;
        const fin = () => { if (done) return; done = true;
          window.removeEventListener("message", on); f.remove(); resolve(last); };
        /* JS 하네스는 결과를 한 번만 보낸다(html 하네스와 다르다). 그래서 첫 값에 끝낸다.
           두 번을 기다리면 매번 제한 시간까지 서 있게 되고, 비동기 문항처럼 오래 걸리는
           것이 제한을 넘겨 '결과 없음' 으로 잘못 판정된다 — 실제로 그렇게 걸렸다. */
        const on = e => {
          if (!e.data || e.data.__cr !== "test" || e.source !== f.contentWindow) return;
          last = e.data;
          fin();
        };
        window.addEventListener("message", on);
        document.body.appendChild(f);
          // load 뒤 한 번 더 오는 값을 기다린다
        f.srcdoc = testDoc(code, { tests: q.tests, edge: q.edge });
        setTimeout(fin, 12000);  // 비동기 문항은 프라미스 제한까지 갈 수 있다
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
      } else if (x.lang === "react") {
        /* 앱과 같은 길: sucrase 로 JSX 를 벗기고 진짜 react-dom 으로 마운트한다 */
        const grade = (code) => new Promise(resolve => {
          const t = tsToJs(code, true);
          if (t.error) return resolve({ pass: 0, total: x.tests.length, gate: false, syntax: t.error });
          const f = document.createElement("iframe");
          f.style.cssText = ONSCREEN;
          f.setAttribute("sandbox", "allow-scripts");
          let last = null, done = false, seen = 0;
          const fin = () => { if (done) return; done = true;
            window.removeEventListener("message", on); f.remove(); resolve(last); };
          const on = e => {
            if (!e.data || e.data.__cr !== "test" || e.source !== f.contentWindow) return;
            last = e.data;
            if (++seen >= 2) fin();      // 두 번째가 레이아웃이 확정된 값이다
          };
          window.addEventListener("message", on);
          document.body.appendChild(f);
          f.srcdoc = reactTestDoc(t.code, x.tests, REACT_LIB);
          setTimeout(fin, 12000);  // 비동기 검사식은 프라미스 제한까지 갈 수 있다
        });
        const sol = await grade(x.sol), src = await grade(x.src);
        res.push({ k: x.k, unit: x.unit, lang: "react",
                   solGate: sol ? !!sol.gate : null, srcGate: src ? !!src.gate : null,
                   solPass: sol ? (sol.syntax ? "문법오류: " + sol.syntax : sol.pass + "/" + sol.total) : "?",
                   srcPass: src ? (src.syntax ? "문법오류: " + src.syntax : src.pass + "/" + src.total) : "?" });
      } else if (x.lang === "html") {
        /* 레이아웃 문항은 여기서 재지 않는다 — 중첩 iframe 은 가려지면 렌더가 스킵돼
           RECT().width 가 0 으로 나온다. 하네스 문서만 만들어 두고, 최상위 페이지에서
           재도록 밖으로 넘긴다(앱의 미리보기도 실제로 보이는 최상위 렌더다). */
        res.push({ k: x.k, unit: x.unit, lang: "html", defer: true,
                   solDoc: htmlTestDoc(x.sol, x.tests), srcDoc: htmlTestDoc(x.src, x.tests) });
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
  }, items2);

  /* 미룬 레이아웃 문항을 최상위 페이지에서 채점한다. 하네스는 결과를 window.__cr_result
     에도 남기므로 그것을 읽는다 — 채점 규칙은 여전히 앱 것 그대로다. */
  const page2 = await b.newPage({ viewport: { width: 400, height: 700 } });
  for (const r of out) {
    if (!r.defer) continue;
    for (const [key, doc] of [["sol", r.solDoc], ["src", r.srcDoc]]) {
      await page2.setContent(doc, { waitUntil: "load" });
      const v = await page2.evaluate(() => new Promise(res => {
        const t0 = Date.now();
        (function poll() {
          if (window.__cr_result || Date.now() - t0 > 3000) return res(window.__cr_result || null);
          setTimeout(poll, 50);
        })();
      }));
      r[key + "Gate"] = v ? !!v.gate : null;
      r[key + "Pass"] = v ? v.pass + "/" + v.total : "?";
    }
    delete r.solDoc; delete r.srcDoc;
  }
  await page2.close();

  await b.close(); srv.close();

  const bad = [];
  out.forEach(r => {
    if (r.solGate !== true) bad.push(r.k + " [" + r.unit + "]: 정답이 앱에서 통과하지 못한다 (" + r.solPass + ")");
    if (r.srcGate !== false) bad.push(r.k + " [" + r.unit + "]: 시작 코드가 앱에서 이미 통과한다 (" + r.srcPass + ")");
  });
  const cnt = k => out.filter(r => r.lang === k).length;
  console.log("앱 채점 경로로 확인 · JS " + cnt("js") + " · SQL " + cnt("sql") + " · HTML " + cnt("html") + " · React " + cnt("react") + "문항");
  if (errs.length) bad.push("pageerror: " + errs[0]);
  if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("전부 통과 — 정답은 앱에서 통과하고, 시작 코드는 앱에서 반드시 막힌다");
})();
