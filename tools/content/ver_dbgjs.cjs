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

function eq(a, b) { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return String(a) === String(b); } }

/* 앱의 testDoc 은 tests 와 edge 를 '같은 문서' 안에서 이어서 돌린다 —
   상태를 가진 핸들러는 그 순서에 의존하므로 검증기도 한 컨텍스트에서 이어 돌린다. */
function runBoth(code, tests, edge) {
  const ctx = vm.createContext({ URL, TextEncoder, TextDecoder });
  try { vm.runInContext(code, ctx, { timeout: 3000 }); }
  catch (e) {
    const mk = c => ({ ok: false, in: c[0], got: "[코드 에러] " + e.message, exp: c[1] });
    return { t: (tests || []).map(mk), e: (edge || []).map(mk), boom: e.message };
  }
  const run = cases => (cases || []).map(c => {
    try {
      const got = vm.runInContext(c[0], ctx, { timeout: 3000 });
      const exp = vm.runInContext("(" + c[1] + ")", ctx, { timeout: 3000 });
      return { ok: eq(got, exp), in: c[0], got: JSON.stringify(got), exp: c[1] };
    } catch (e) { return { ok: false, in: c[0], got: "[에러] " + e.message, exp: c[1] }; }
  });
  return { t: run(tests), e: run(edge), boom: null };
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
Q.forEach((q, i) => {
  const tag = "[" + (i + 1) + "] " + q.k;
  const fail = m => { bad++; console.log("✗ " + tag + " — " + m); };

  if (keys.has(q.k)) fail("제목 중복"); keys.add(q.k);
  const st = q.q.slice(0, 40); if (stems.has(st)) fail("문제 줄기 중복"); stems.add(st);
  if (q.cat !== "debug") fail('cat 이 "debug" 가 아니다');
  if (!q.track) fail("track 이 없다");
  if (!/🐛 원인/.test(q.ex) || !/🔧 해결/.test(q.ex) || !/🛡 재발 방지/.test(q.ex))
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

  const both = runBoth(q.sol, q.tests, q.edge);
  const sf = [...both.t, ...both.e].filter(r => !r.ok);
  if (sf.length) fail("sol 실패: " + sf.map(r => r.in + " → " + r.got + " (기대 " + r.exp + ")").join(" | "));

  const b = runBoth(q.src, q.tests, q.edge);
  if (b.boom) fail("src 가 문법·로드 오류다 — 문법 오류 찾기는 디버깅이 아니다: " + b.boom);
  const n = b.t.filter(r => !r.ok).length;
  if (!b.boom && n === 0) fail("고장난 코드가 이미 전부 통과 — 고칠 게 없다");
  else if (!sf.length && !qb.length && !b.boom)
    console.log("✓ " + tag + "  (고장 " + n + "/" + q.tests.length + ")");
});

const byTrack = {}; Q.forEach(q => { byTrack[q.track] = (byTrack[q.track] || 0) + 1; });
console.log("\n트랙별: " + Object.keys(byTrack).map(k => k + " " + byTrack[k]).join(" · "));
console.log(Q.length + "문항 중 " + bad + "건 문제");
process.exit(bad ? 1 : 0);
