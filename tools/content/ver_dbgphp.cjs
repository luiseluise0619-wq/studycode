/* PHP 디버깅 배치를 로컬 러너의 실제 php 로 검증한다.

     node tools/runner/server.cjs &          # 먼저 러너를 띄운다
     node ver_dbgphp.cjs ./dbg_php.cjs

   디버깅 문항은 구현형과 계약이 다르다. 구현형의 src 는 'TODO 가 적힌 빈칸' 이지만,
   디버깅의 src 는 <b>돌아가는 것처럼 보이는 고장난 코드</b>여야 한다. 그래서 더 본다.
     · src 에 TODO 나 빈 함수 몸통이 없어야 한다 — 빈칸 채우기는 디버깅이 아니다
     · src 가 문법 오류가 아니어야 한다(php -l 통과) — 문법 오류 찾기도 디버깅이 아니다
   나머지(sol 전부 통과 · src 반드시 실패 · 해설 품질)는 구현형과 같다. */
const path = require("path");
const SRC = process.argv[2];
if (!SRC) { console.error("문항 파일을 인자로 주세요: node ver_dbgphp.cjs ./dbg_php.cjs"); process.exit(2); }
const Q = require(path.resolve(SRC));
const BASE = process.env.RUNNER || "http://127.0.0.1:8787";

const post = body => fetch(BASE + "/test", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
}).then(r => r.json());

(async () => {
  try { await fetch(BASE + "/health").then(r => r.json()); }
  catch (e) { console.error("러너에 못 붙는다(" + BASE + "). node tools/runner/server.cjs 를 먼저 띄우세요."); process.exit(2); }

  let bad = 0;
  const keys = new Set(), stems = new Set();
  for (let i = 0; i < Q.length; i++) {
    const q = Q[i], tag = "[" + (i + 1) + "] " + q.k;
    const probs = [];

    if (keys.has(q.k)) probs.push("제목 중복"); keys.add(q.k);
    const st = String(q.q || "").slice(0, 40);
    if (stems.has(st)) probs.push("문제 줄기 중복"); stems.add(st);
    if (q.cat !== "debug") probs.push('cat 이 "debug" 가 아니다');
    if (!q.test || !q.test["test.php"]) probs.push("test.php 가 없다");
    if (!q.src || !q.sol) probs.push("src 또는 sol 이 없다");
    if (q.src === q.sol) probs.push("src 와 sol 이 같다");
    if (/TODO|여기를 채우|구현하세요/.test(String(q.src))) probs.push("src 에 빈칸이 있다 — 디버깅이 아니라 구현이다");
    if (!/(^|\n)원인/.test(q.ex || "") || !/(^|\n)해결/.test(q.ex || "") || !/(^|\n)재발 방지/.test(q.ex || ""))
      probs.push("해설에 원인·해결·재발방지가 없다");
    if (String(q.ex || "").length < 200) probs.push("해설이 200자 미만");
    if (String(q.q || "").length < 60) probs.push("문제 설명이 부실하다");

    if (probs.length === 0) {
      const base = { language: "php", test: q.test };
      const a = await post({ ...base, code: q.sol });
      const b = await post({ ...base, code: q.src });
      if (a.error) probs.push("정답 실행 오류: " + a.error);
      else if (!a.pass) probs.push("정답이 테스트를 통과하지 못함:\n    "
        + String(a.stdout || a.stderr || "").trim().split("\n").slice(0, 8).join("\n    "));
      if (b.error && /문법|syntax|Parse error/i.test(String(b.error)))
        probs.push("고장 코드가 문법 오류다 — 문법 오류 찾기는 디버깅이 아니다: " + b.error);
      else if (b.pass) probs.push("고장난 코드가 통과함 — 고칠 게 없다");
      if (!probs.length) console.log("✓ " + tag + "  (정답 통과 · 고장 " + (b.timedOut ? "시간초과" : "실패") + ")");
    }
    if (probs.length) { bad++; console.log("✗ " + tag + "\n  " + probs.join("\n  ")); }
  }
  console.log("\n" + Q.length + "문항 중 " + bad + "건 문제");
  process.exit(bad ? 1 : 0);
})();
