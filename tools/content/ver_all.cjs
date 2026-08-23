/* 주입이 끝난 데이터 전체를 다시 채점한다 — 배치 검증기와 달리 data/t-*.js 만 읽는다.

     node tools/content/ver_all.cjs            # 전부
     node tools/content/ver_all.cjs js         # 갈래를 골라서
     node tools/content/ver_all.cjs py numpy   # 트랙까지 좁혀서
   갈래: js · py · c · cpp · java · go · rust · php

   왜 필요한가: 배치 검증기는 <b>넣을 때 한 번</b> 볼 뿐이다. 그 뒤에 보기 문구를
   손보거나(37~39차의 답 모양 상환) 주입기를 고치거나 라이브러리가 올라가면,
   앱에서만 깨지는 문항이 조용히 생긴다. 여기서는 실제로 저장된 값만 읽어
   sol 을 tests + edge 로 다시 돌린다.

   컴파일 언어(c·cpp·java·go·rust)와 php 는 로컬 러너가 필요하다 —
   안 떠 있거나 그 툴체인이 없으면 해당 갈래만 건너뛰고 몇 개를 건너뛰었는지 알린다.
     node tools/runner/server.cjs &  */
const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const { execFile } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const WANT = (process.argv[2] || "").toLowerCase();       // js | py | c | cpp | java | go | rust | php | ""
const ONLY_TRACK = process.argv[3] || "";
const RUNNER = process.env.RUNNER || "http://127.0.0.1:8787";
const TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), "cr-verall-"));
const POOL = Math.max(2, Math.min(8, os.cpus().length - 1));

/* ── 데이터에서 검증 가능한 문항을 모은다 ───────────────────────────── */
const items = [];
for (const f of fs.readdirSync(path.join(ROOT, "data")).filter(x => /^t-.*\.js$/.test(x)).sort()) {
  const track = f.slice(2, -3);
  if (ONLY_TRACK && track !== ONLY_TRACK) continue;
  const raw = fs.readFileSync(path.join(ROOT, "data", f), "utf8");
  const arr = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
  arr.forEach(u => (u.l || []).forEach(l => (l.q || []).forEach(q => {
    if (!q || !q.sol) return;
    const at = { track, unit: u.t, lesson: l.t, k: q.k || q.fn || "(제목 없음)", q };
    if (q.t === "code" && q.run === "js" && q.tests) { at.kind = "js"; items.push(at); }
    else if (q.t === "py" && q.tests) { at.kind = "py"; items.push(at); }
    else if (q.t === "code" && q.rt && q.rt.test) { at.kind = q.rt.lang || q.run; items.push(at); }
  })));
}
const pick = items.filter(x => !WANT || x.kind === WANT);
const byKind = {};
pick.forEach(x => { byKind[x.kind] = (byKind[x.kind] || 0) + 1; });
console.log("검증 대상 " + pick.length + "문항 " + JSON.stringify(byKind)
  + (ONLY_TRACK ? " · 트랙 " + ONLY_TRACK : "") + " · 동시 " + POOL);

/* ── js: 앱의 testDoc 과 같은 하네스를 쓴다 ───────────────────────────
   두 가지를 맞춰야 결과가 같다.
     ① sol 과 채점 코드가 <b>같은 스크립트</b>에 있어야 한다 — 따로 돌리면
        최상위 const·let·class 가 안 보여서 "정의되지 않음" 이 된다.
     ② 테스트 식이 프라미스를 돌려주면 <b>기다렸다가</b> 견줘야 한다 —
        안 그러면 async 함수는 무엇을 써도 통과하지 못한다. 앱과 같이 3초에서 끊는다. */
const JS_HARNESS = `
;(async function(){
  function __eq(a,b){ try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return String(a) === String(b); } }
  function __sh(v){ try { return typeof v === "undefined" ? "undefined" : JSON.stringify(v); } catch (e) { return String(v); } }
  function __wait(v){
    if (!v || typeof v.then !== "function") return Promise.resolve(v);
    var id; var to = new Promise(function(_, rj){ id = setTimeout(function(){ rj(new Error("시간 초과")); }, 3000); });
    return Promise.race([v, to]).finally(function(){ clearTimeout(id); });
  }
  var __out = [];
  for (var __i = 0; __i < __CASES.length; __i++) {
    var __t = __CASES[__i], __ok = false, __g;
    try { __g = await __wait(eval(__t[0])); var __e = await __wait(eval("(" + __t[1] + ")")); __ok = __eq(__g, __e); }
    catch (e) { __g = "[에러] " + (e && e.message || e); }
    if (!__ok) __out.push(__t[0] + " → " + __sh(__g) + " (기대 " + __t[1] + ")");
  }
  return __out;
})()`;
function runJs(q) {
  const cases = [].concat(q.tests || [], q.edge || []);
  if (!cases.length) return Promise.resolve([]);
  const ctx = vm.createContext({
    URL, TextEncoder, TextDecoder, performance, queueMicrotask,
    setTimeout, clearTimeout, setInterval, clearInterval,
    console: { log() {}, debug() {}, error() {}, warn() {} },
    __CASES: cases.map(c => [c.in, c.out]),
  });
  let p;
  try { p = vm.runInContext(q.sol + "\n" + JS_HARNESS, ctx, { timeout: 20000 }); }
  catch (e) { return Promise.resolve(["[로드 오류] " + (e && e.message || e)]); }
  let id;
  const guard = new Promise(res => { id = setTimeout(() => res(["[하네스 시간 초과]"]), 30000); });
  return Promise.race([Promise.resolve(p), guard])
    .catch(e => ["[하네스 오류] " + (e && e.message || e)])
    .finally(() => clearTimeout(id));
}

/* ── py: 앱의 pyHarness 와 같게 맞춘다 ─────────────────────────────
   두 가지를 맞춰야 결과가 같다.
     ① 검사식이 <b>코루틴</b>을 돌려주면 기다렸다 견준다 — 안 그러면 async 문항은
        코루틴 객체와 기대값을 견주게 되어 무엇을 써도 통과하지 못한다(앱과 같이 5초 제한).
     ② tests 와 edge 를 <b>따로</b> 돌린다 — 앱은 두 번 호출하면서 사용자 코드를
        다시 실행하므로 전역 상태가 초기화된다. 한 번에 이어 돌리면 모듈 수준
        카운터를 쓰는 문항이 앞 케이스의 흔적을 안고 채점된다. */
function pyHarness(user, cases) {
  return user + "\n\n__T=" + JSON.stringify(cases.map(c => [c.in, c.out]))
    + "\nimport json, inspect, asyncio\n__r=[]\n"
    + "async def __await1(v):\n    return await asyncio.wait_for(v, 5) if inspect.isawaitable(v) else v\n"
    + "async def __run():\n    for __i,__o in __T:\n        try:\n            __g=await __await1(eval(__i))\n            __e=await __await1(eval(__o))\n            __r.append([bool(__g==__e), __i, repr(__g), __o])\n        except Exception as __ex:\n            __r.append([False, __i, '[에러] '+str(__ex), __o])\n"
    + "asyncio.run(__run())\nprint(json.dumps(__r, ensure_ascii=False))";
}
function pyOnce(sol, cases, file) {
  return new Promise(resolve => {
    if (!cases.length) return resolve([]);
    fs.writeFileSync(file, pyHarness(sol, cases));
    execFile("python3", ["-I", file], { timeout: 60000, encoding: "utf8" }, (err, out) => {
      if (err && !out) return resolve(["[하네스 실패] " + String(err.stderr || err.message).split("\n").slice(-3).join(" ")]);
      let rows;
      try { rows = JSON.parse(out); } catch (e) { return resolve(["[출력 파싱 실패] " + String(out).slice(0, 200)]); }
      resolve(rows.filter(r => !r[0]).map(r => r[1] + " → " + r[2] + " (기대 " + r[3] + ")"));
    });
  });
}
async function runPy(q, i) {
  const a = await pyOnce(q.sol, q.tests || [], path.join(TMPDIR, "p" + i + "a.py"));
  const b = await pyOnce(q.sol, q.edge || [], path.join(TMPDIR, "p" + i + "b.py"));
  return a.concat(b);
}

/* ── 러너 언어(c·cpp·java·go·rust·php): 러너가 그대로 채점한다.
   테스트를 다른 형식으로 번역하지 않고, 데이터에 든 값을 그대로 보낸다 —
   주입기가 srcName 을 빠뜨려 공개 클래스 이름이 안 맞는 사고가 실제로 있었다. */
/* 러너는 spawnSync 로 컴파일한다 — 한 요청을 처리하는 동안 새 연결을 받지 못해,
   동시에 보내면 접속 자체가 실패한다("fetch failed"). 그래서 이 갈래만 줄을 세운다. */
let rtChain = Promise.resolve();
function runRt(q) {
  const send = () => fetch(RUNNER + "/test", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ language: q.rt.lang || q.run, test: q.rt.test, code: q.sol,
                           name: q.rt.name, srcName: q.rt.srcName }),
  }).then(r => r.json());
  const once = () => send().then(r => {
    if (r.error) return ["[실행 오류] " + r.error];
    if (!r.pass) return [String(r.stdout || r.stderr || "").trim().split("\n").slice(0, 4).join(" / ")];
    return [];
  });
  const job = () => once().catch(() => once())      // 접속 실패는 한 번 더 해 본다
    .catch(e => ["[러너 오류] " + (e && e.message || e)]);
  const p = rtChain.then(job, job);
  rtChain = p.then(() => {}, () => {});
  return p;
}

/* ── 동시에 POOL 개씩 돌린다 ─────────────────────────────────────── */
(async () => {
  const RT = new Set(["c", "cpp", "java", "go", "rust", "php"]);
  let rtOk = true, langs = {};
  if (pick.some(x => RT.has(x.kind))) {
    try { langs = (await fetch(RUNNER + "/health").then(r => r.json())).langs || {}; }
    catch (e) { rtOk = false; console.log("러너에 못 붙어 컴파일 언어는 건너뛴다(" + RUNNER + ")"); }
  }
  const skipped = {};
  const todo = pick.filter(x => {
    if (!RT.has(x.kind)) return true;
    if (rtOk && langs[x.kind]) return true;
    skipped[x.kind] = (skipped[x.kind] || 0) + 1;
    return false;
  });
  if (Object.keys(skipped).length) console.log("건너뜀: " + JSON.stringify(skipped));
  const fails = [];
  let done = 0, next = 0;
  async function worker() {
    while (next < todo.length) {
      const i = next++, it = todo[i];
      let bad = [];
      if (it.kind === "js") bad = await runJs(it.q);
      else if (it.kind === "py") bad = await runPy(it.q, i);
      else bad = await runRt(it.q);
      if (bad.length) fails.push({ ...it, bad });
      done += 1;
      if (done % 100 === 0) process.stdout.write("  " + done + "/" + todo.length + "\n");
    }
  }
  await Promise.all(Array.from({ length: POOL }, worker));

  fails.sort((a, b) => (a.track + a.k) < (b.track + b.k) ? -1 : 1);
  fails.forEach(f => {
    console.log("✗ " + f.track + " · " + f.kind + " · " + f.k + "  (" + f.unit + " / " + f.lesson + ")");
    f.bad.slice(0, 4).forEach(m => console.log("    " + m));
  });
  try { fs.rmSync(TMPDIR, { recursive: true, force: true }); } catch (e) {}
  console.log("\n" + todo.length + "문항 중 " + fails.length + "건 실패");
  process.exit(fails.length ? 1 : 0);
})();
