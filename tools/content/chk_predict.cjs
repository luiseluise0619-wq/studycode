/* 단답형 중 code 가 붙은 '출력 예측' 문항의 정답을 실제로 실행해 대조한다.

     node chk_predict.cjs ./in_code.cjs

   code 를 실행해 console.log 로 찍힌 마지막 줄을 앱의 채점 규칙(norm)으로
   정답 목록과 견준다. 손으로 적은 기대값이 틀리면 여기서 걸린다.
   code 가 없거나 자바스크립트가 아닌 문항은 건너뛴다. */
const vm = require("vm");
const path = require("path");
const SRC = process.argv[2];
if (!SRC) { console.error("파일을 인자로 주세요"); process.exit(2); }
const Q = require(path.resolve(SRC));
const norm = s => String(s).toLowerCase().replace(/\s+/g, "").replace(/;$/, "");

let bad = 0, ran = 0;
Q.forEach((q, i) => {
  if (!q.code) return;
  ran += 1;
  const out = [];
  const ctx = vm.createContext({ URL, TextEncoder, TextDecoder,
    console: { log: (...a) => out.push(a.map(String).join(" ")) } });
  let got;
  try { vm.runInContext(q.code, ctx, { timeout: 2000 }); got = out[out.length - 1]; }
  catch (e) { got = "[에러] " + e.message; }
  const ok = (q.a || []).some(a => norm(a) === norm(got));
  if (!ok) { bad += 1; console.log("✗ [" + (i + 1) + "] " + q.k + " — 실행값 " + JSON.stringify(got) + " · 적어 둔 정답 " + JSON.stringify(q.a)); }
  else console.log("✓ [" + (i + 1) + "] " + q.k + " → " + got);
});
console.log("실행 " + ran + "문항 중 " + bad + "건 불일치");
process.exit(bad ? 1 : 0);
