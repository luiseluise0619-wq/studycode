/* JS 디버깅 배치를 앱의 testDoc 하네스와 같은 규칙으로 실제 실행해 검증한다.

   사용법:  node ver_dbgjs.cjs ./dbg_be.cjs

   디버깅 문항은 구현형과 계약이 다르다. 구현형의 src 는 'TODO 가 적힌 빈칸'
   이지만, 디버깅의 src 는 <b>돌아가는 것처럼 보이는 고장난 코드</b>여야 한다.
   그래서 아래 두 가지를 더 본다.
     · src 에 TODO 나 빈 함수 몸통이 없어야 한다 — 빈칸 채우기는 디버깅이 아니다
     · src 가 문법 오류가 아니어야 한다 — 문법 오류 찾기도 디버깅이 아니다
   나머지(sol 전부 통과 · src 최소 하나 실패 · 품질 · 예약어 충돌)는 구현형과 같다. */
const vm = require("vm");
const path = require("path");
const SRC = process.argv[2];
if (!SRC) { console.error("문항 파일을 인자로 주세요: node ver_dbgjs.cjs ./dbg_be.cjs"); process.exit(2); }
const Q = require(path.resolve(SRC));

/* 앱의 testDoc 을 그대로 흉내 낸다. 세 가지를 맞춰야 결과가 같다.
     ① 사용자 코드와 채점 코드가 <b>같은 스크립트</b>에 있어야 한다 — 따로 돌리면
        최상위 const·let·class 가 안 보여 "정의되지 않음" 이 된다.
     ② tests 와 edge 를 '같은 문서' 안에서 <b>이어서</b> 돌린다 — 상태를 가진
        핸들러는 그 순서에 의존한다.
     ③ 검사식이 프라미스를 돌려주면 <b>기다렸다가</b> 견준다 — 안 그러면 async
        문항은 무엇을 써도 통과하지 못한다(앱과 같이 3초에서 끊는다). */
const HARNESS = `
;(async function(){
  function __eq(a,b){ try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return String(a) === String(b); } }
  function __sh(v){ try { return typeof v === "undefined" ? "undefined" : JSON.stringify(v); } catch (e) { return String(v); } }
  function __wait(v){
    if (!v || typeof v.then !== "function") return Promise.resolve(v);
    var id; var to = new Promise(function(_, rj){ id = setTimeout(function(){ rj(new Error("시간 초과")); }, 3000); });
    return Promise.race([v, to]).finally(function(){ clearTimeout(id); });
  }
  async function __one(c){
    try { var g = await __wait(eval(c[0])); var e = await __wait(eval("(" + c[1] + ")"));
          return { ok: __eq(g, e), in: c[0], got: __sh(g), exp: c[1] }; }
    catch (e) { return { ok: false, in: c[0], got: "[에러] " + (e && e.message || e), exp: c[1] }; }
  }
  var t = [], e = [];
  for (var i = 0; i < __TS.length; i++) t.push(await __one(__TS[i]));
  for (var j = 0; j < __EG.length; j++) e.push(await __one(__EG[j]));
  return { t: t, e: e, boom: null };
})()`;
async function runBoth(code, tests, edge) {
  const ctx = vm.createContext({
    URL, TextEncoder, TextDecoder, performance, queueMicrotask,
    setTimeout, clearTimeout, setInterval, clearInterval,
    console: { log() {}, debug() {}, error() {}, warn() {} },
    __TS: (tests || []).map(c => [c[0], c[1]]),
    __EG: (edge || []).map(c => [c[0], c[1]]),
  });
  let p;
  try { p = vm.runInContext(code + "\n" + HARNESS, ctx, { timeout: 10000 }); }
  catch (e) {
    const mk = c => ({ ok: false, in: c[0], got: "[코드 에러] " + e.message, exp: c[1] });
    return { t: (tests || []).map(mk), e: (edge || []).map(mk), boom: e.message };
  }
  let id;
  const guard = new Promise(res => { id = setTimeout(() => res({ t: [], e: [], boom: "하네스 시간 초과" }), 20000); });
  try { return await Promise.race([Promise.resolve(p), guard]); }
  catch (e) {
    const mk = c => ({ ok: false, in: c[0], got: "[코드 에러] " + (e && e.message || e), exp: c[1] });
    return { t: (tests || []).map(mk), e: (edge || []).map(mk), boom: String(e && e.message || e) };
  } finally { clearTimeout(id); }
}

function quality(src) {
  const bad = [];
  if (/\bvar\s/.test(src)) bad.push("var 사용");
  const ln = src.split("\n").filter(l => l.trim() && !/^\s*\/\//.test(l)).length;
  if (ln > 28) bad.push("줄 수 " + ln + " > 28");
  if (/console\.(log|debug)/.test(src)) bad.push("console.log");
  return bad;
}

/* testDoc 하네스는 사용자 코드와 '같은 블록' 에 자기 변수들을 선언한다.
   이름이 겹치면 브라우저에서만 SyntaxError 가 난다 — node vm 에서는 재현되지 않는다. */
const RESERVED = ["SRC", "TS", "EG", "PF", "esc", "sh", "eq", "P", "row", "Cp", "Ch", "Ep", "Eh",
  "perfScore", "perfMs", "perfOk", "qr", "qp", "qScore", "comps", "impl", "PG", "gate", "gcol",
  "gtxt", "bar", "parts", "eh", "ph", "qn", "__out"];

let bad = 0;
const stems = new Set(), keys = new Set();
(async () => {
for (let i = 0; i < Q.length; i += 1) {
  const q = Q[i];
  const tag = "[" + (i + 1) + "] " + q.k;
  const fail = m => { bad++; console.log("✗ " + tag + " — " + m); };

  if (keys.has(q.k)) fail("제목 중복"); keys.add(q.k);
  const st = q.q.slice(0, 40); if (stems.has(st)) fail("문제 줄기 중복"); stems.add(st);
  if (q.cat !== "debug") fail('cat 이 "debug" 가 아니다');
  if (!q.track) fail("track 이 없다");
  if (!/(^|
)원인/.test(q.ex) || !/(^|
)해결/.test(q.ex) || !/(^|
)재발 방지/.test(q.ex))
    fail("해설에 원인·해결·재발방지가 없다");
  if (String(q.ex).length < 200) fail("해설이 200자 미만");
  if (!q.tests || q.tests.length < 4) fail("tests 4개 미만");
  if (!q.edge || q.edge.length < 2) fail("edge 2개 미만");
  if (q.src === q.sol) fail("src 와 sol 이 같다");
  if (/TODO|여기를 채우|구현하세요/.test(q.src)) fail("src 에 빈칸이 있다 — 디버깅이 아니라 구현이다");

  const declared = [...String(q.sol).matchAll(/(?:^|\n)\s*(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]);
  const clash = declared.filter(n => RESERVED.indexOf(n) >= 0);
  if (clash.length) fail("하네스가 쓰는 이름과 겹친다(브라우저에서만 SyntaxError): " + clash.join(", "));

  const qb = quality(q.sol); if (qb.length) fail("sol 품질 감점: " + qb.join(", "));

  const both = await runBoth(q.sol, q.tests, q.edge);
  const sf = [...both.t, ...both.e].filter(r => !r.ok);
  if (sf.length) fail("sol 실패: " + sf.map(r => r.in + " → " + r.got + " (기대 " + r.exp + ")").join(" | "));

  const b = await runBoth(q.src, q.tests, q.edge);
  if (b.boom) fail("src 가 문법·로드 오류다 — 문법 오류 찾기는 디버깅이 아니다: " + b.boom);
  const n = b.t.filter(r => !r.ok).length;
  if (!b.boom && n === 0) fail("고장난 코드가 이미 전부 통과 — 고칠 게 없다");
  else if (!sf.length && !qb.length && !b.boom)
    console.log("✓ " + tag + "  (고장 " + n + "/" + q.tests.length + ")");
}

const byTrack = {}; Q.forEach(q => { byTrack[q.track] = (byTrack[q.track] || 0) + 1; });
console.log("\n트랙별: " + Object.keys(byTrack).map(k => k + " " + byTrack[k]).join(" · "));
console.log(Q.length + "문항 중 " + bad + "건 문제");
process.exit(bad ? 1 : 0);
})();
