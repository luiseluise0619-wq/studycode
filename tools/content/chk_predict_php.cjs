/* PHP 코드가 붙은 단답 문항의 정답을 실제로 실행해 대조한다.

     node chk_predict_php.cjs ./in_php.cjs

   code 를 php -r 로 돌려 마지막 출력 줄을 앱의 채점 규칙(norm)으로 정답 목록과 견준다.
   code 가 없는 문항은 건너뛴다. */
const { execFileSync } = require("child_process");
const path = require("path");
const SRC = process.argv[2];
if (!SRC) { console.error("파일을 인자로 주세요"); process.exit(2); }
const Q = require(path.resolve(SRC));
const norm = s => String(s).toLowerCase().replace(/\s+/g, "").replace(/;$/, "");

let bad = 0, ran = 0;
Q.forEach((q, i) => {
  if (!q.code) return;
  ran += 1;
  let got;
  try {
    const src = q.code.replace(/^<\?php\s*/, "");
    const out = execFileSync("php", ["-r", src], { encoding: "utf8", timeout: 30000 });
    const lines = out.trimEnd().split("\n");
    got = lines[lines.length - 1];
  } catch (e) { got = "[에러] " + String(e.stderr || e.message).trim().split("\n").pop(); }
  const ok = (q.a || []).some(a => norm(a) === norm(got));
  if (!ok) { bad += 1; console.log("✗ [" + (i + 1) + "] " + q.k + " — 실행값 " + JSON.stringify(got) + " · 적어 둔 정답 " + JSON.stringify(q.a)); }
  else console.log("✓ [" + (i + 1) + "] " + q.k + " → " + got);
});
console.log("실행 " + ran + "문항 중 " + bad + "건 불일치");
process.exit(bad ? 1 : 0);
