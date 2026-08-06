/* 파이썬 문항을 '브라우저와 같은 파이썬' 으로 검사한다.

   ver_practice.cjs 는 이 컴퓨터의 python3 를 쓴다. 빠르고 편하지만,
   앱이 실제로 쓰는 것은 Pyodide 안의 파이썬이고 버전도 꾸러미도 다르다.
   numpy 2.4 에서 되는 코드가 Pyodide 의 numpy 1.26 에서 안 되면,
   검사는 전부 통과인데 학습자만 실패한다 — 그래서 여기서 한 번 더 본다.

     node tools/content/ver_pyodide.cjs <content.js> [꾸러미,꾸러미…]

   Pyodide 는 무거워서 개발 의존성으로 두지 않는다. 스크래치패드에
   설치해 두고 PYODIDE_PATH 로 알려 준다:
     npm i pyodide@0.26.4 && PYODIDE_PATH=$PWD/node_modules/pyodide node … */
const path = require("path");

const SRC = process.argv[2];
if (!SRC) { console.error("사용법: node ver_pyodide.cjs <content.js|--data> [꾸러미…]"); process.exit(2); }
const PKGS = (process.argv[3] || "").split(",").map(s => s.trim()).filter(Boolean);

/* --data 는 이미 배포된 문항을 본다. 소스 파일만 보면, 주입한 뒤에
   손으로 고친 문항이나 옛날에 들어간 문항은 아무도 확인하지 않는다. */
let GROUPS;
if (SRC === "--data") {
  const fs = require("fs");
  const dir = path.resolve(__dirname, "..", "..", "data");
  GROUPS = [];
  for (const f of fs.readdirSync(dir).filter(x => /^t-.*\.js$/.test(x))) {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const arr = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
    const q = [];
    arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(x => {
      if (x.t !== "py" || !x.src || !x.sol) return;
      /* 꾸러미가 필요한 문항은 그 꾸러미를 받았을 때만 본다 */
      if ((x.pkgs || []).some(p => !PKGS.includes(p))) return;
      q.push({ k: f.replace(/^t-|\.js$/g, "") + " · " + x.k, src: x.src, sol: x.sol,
               tests: (x.tests || []).map(t => [t.in, t.out]),
               edge: (x.edge || []).map(t => [t.in, t.out]) });
    })));
    if (q.length) GROUPS.push({ unit: f, q: q });
  }
} else {
  GROUPS = require(path.resolve(SRC));
}

const PY = process.env.PYODIDE_PATH || "pyodide";
let loadPyodide;
try { ({ loadPyodide } = require(PY)); }
catch (e) {
  console.error("Pyodide 를 찾지 못했다. PYODIDE_PATH 로 설치 경로를 알려 주거나\n" +
                "  npm i pyodide@0.26.4\n원인: " + (e && e.message));
  process.exit(2);
}

/* 앱의 pyHarness 와 같은 모양이다 — 여기서만 다르게 채점하면 의미가 없다. */
function harness(user, tests) {
  return user + "\n\n__T=" + JSON.stringify(tests.map(t => [t[0], t[1]]))
    + "\nimport json, inspect\n__r=[]\n"
    + "async def __await1(v):\n    return await __import__('asyncio').wait_for(v, 5) if inspect.isawaitable(v) else v\n"
    + "async def __run():\n    for __i,__o in __T:\n"
    + "        try:\n            __g=await __await1(eval(__i))\n            __e=await __await1(eval(__o))\n            __r.append([bool(__g==__e), __i, repr(__g), __o])\n"
    + "        except Exception as __ex:\n            __r.append([False, __i, '[에러] '+str(__ex), __o])\n"
    + "await __run()\njson.dumps(__r, ensure_ascii=False)";
}

async function main() {
  const t0 = Date.now();
  const py = await loadPyodide({ indexURL: path.join(require.resolve(PY + "/package.json").replace(/package\.json$/, "")) });
  if (PKGS.length) await py.loadPackage(PKGS);
  console.log("Pyodide 준비 " + ((Date.now() - t0) / 1000).toFixed(1) + "초"
    + (PKGS.length ? " · 꾸러미 " + PKGS.join(", ") : ""));

  const bad = [];
  let n = 0;
  for (const g of GROUPS) {
    for (const x of g.q) {
      n++;
      const all = (x.tests || []).concat(x.edge || []);
      if (!all.length) { bad.push(x.k + ": 테스트가 없다"); continue; }
      let solR, srcR;
      try { solR = JSON.parse(await py.runPythonAsync(harness(x.sol, all))); }
      catch (e) { bad.push(x.k + ": 정답이 Pyodide 에서 터진다 — " + String(e.message || e).split("\n").pop()); continue; }
      try { srcR = JSON.parse(await py.runPythonAsync(harness(x.src, all))); }
      catch (e) { srcR = all.map(t => [false, t[0], "[에러] " + String(e.message || e).slice(0, 80), t[1]]); }

      const solBad = solR.filter(r => !r[0]);
      if (solBad.length) {
        bad.push(x.k + ": 정답이 Pyodide 에서 통과하지 못한다 — "
          + solBad.map(r => r[1] + " → " + r[2] + " (기대 " + r[3] + ")").join(" / "));
        continue;
      }
      if (srcR.every(r => r[0])) { bad.push(x.k + ": 시작 코드가 이미 전부 통과한다"); continue; }
      console.log("  ✓ " + x.k);
    }
  }
  console.log("\nPyodide 로 검사 " + n + "문항 · 레슨 " + GROUPS.length + "개");
  if (bad.length) { bad.forEach(b => console.log("  ✗ " + b)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("브라우저와 같은 파이썬에서도 정답만 통과한다");
}

main().catch(e => { console.error(e); process.exit(1); });
