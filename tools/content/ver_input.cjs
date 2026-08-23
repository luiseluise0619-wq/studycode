/* 단답형(t:"input") 배치를 앱의 채점 규칙 그대로 검사한다.

     node ver_input.cjs ./in_cs.cjs

   앱의 채점은 norm(s) = 소문자 + 공백 제거 + 끝 세미콜론 제거 후 완전 일치다.
   그래서 단답형은 '아는가' 를 묻는 문제가 아니라 '<b>정확히 그 글자를 쓸 수 있는가</b>'
   를 묻는 문제가 된다. 아래를 본다.
     · 물음에 답 형식이 적혀 있는가(괄호 힌트) — 없으면 아는 사람도 틀린다
     · 정답 목록에 흔한 표기 변형이 들어 있는가(영문/한글·띄어쓰기·약어)
     · 정답이 물음 안에 그대로 들어 있지 않은가(그러면 베껴 쓰면 된다)
     · 정규화하면 서로 같아지는 답이 중복으로 들어 있지 않은가
     · 해설이 충분한가 */
const path = require("path");
const SRC = process.argv[2];
if (!SRC) { console.error("문항 파일을 인자로 주세요: node ver_input.cjs ./in_cs.cjs"); process.exit(2); }
const Q = require(path.resolve(SRC));

const norm = s => String(s).toLowerCase().replace(/\s+/g, "").replace(/;$/, "");
const CATS = new Set(["debug", "review", "perf", "design", "ops", "interview",
  "internals", "logs", "security", "predict", "knowledge", "impl"]);

let bad = 0;
const keys = new Set(), stems = new Set();
Q.forEach((q, i) => {
  const tag = "[" + (i + 1) + "] " + (q.k || "(제목 없음)");
  const before = bad;
  const fail = m => { bad++; console.log("✗ " + tag + " — " + m); };

  if (q.t !== "input") fail('t 가 "input" 이 아니다');
  if (!q.track) fail("track 이 없다");
  if (!q.k) fail("k(제목) 가 없다");
  if (keys.has(q.k)) fail("제목 중복"); keys.add(q.k);
  if (q.cat && !CATS.has(q.cat)) fail("모르는 cat: " + q.cat);

  const qs = String(q.q || "");
  if (qs.length < 20) fail("물음이 20자 미만");
  const st = qs.slice(0, 40);
  if (stems.has(st)) fail("물음 줄기 중복"); stems.add(st);
  /* 괄호 안에 또 괄호가 들어올 수 있어(예: "(예: O(n log n))") 안쪽을 세지 않는다.
     끝이 닫는 괄호이고 그 앞 어딘가에 여는 괄호가 있으면 힌트가 있는 것으로 본다. */
  const qt = qs.trim();
  if (!/[)）]\s*$/.test(qt) || !/[(（]/.test(qt.slice(-40)))
    fail("물음 끝에 답 형식 힌트(괄호)가 없다 — 형식을 모르면 아는 사람도 틀린다");

  const a = q.a;
  if (!Array.isArray(a) || !a.length) { fail("정답 목록이 없다"); return; }
  if (a.some(x => typeof x !== "string" || !x.trim())) fail("빈 정답이 들어 있다");
  const na = a.map(norm);
  if (na.some(x => !x)) fail("정규화하면 비는 정답이 있다");
  if (new Set(na).size !== na.length)
    fail("정규화하면 같아지는 정답이 겹친다: " + a.join(" | "));
  if (a.some(x => x.length > 40)) fail("40자 넘는 정답이 있다 — 단답이 아니다");

  /* 물음에 답이 그대로 적혀 있으면 베껴 쓰면 된다.
     다만 코드나 표를 보여 주고 '무엇이라 부르는가' 를 묻는 형태는 정당하므로,
     한 글자·두 글자짜리 짧은 답은 우연히 걸릴 수 있어 넘긴다. */
  const nq = norm(qs.replace(/[(（][^)）]*[)）]\s*$/, ""));
  const leak = a.filter(x => norm(x).length >= 3 && nq.includes(norm(x)));
  if (leak.length) fail("물음 안에 정답이 그대로 있다: " + leak.join(" | "));

  if (String(q.ex || "").length < 60) fail("해설이 60자 미만");

  if (bad === before) console.log("✓ " + tag + "  (표기 " + a.length + "가지 · 정답 '" + a[0] + "')");
});

const byTrack = {};
Q.forEach(q => { byTrack[q.track] = (byTrack[q.track] || 0) + 1; });
console.log("트랙별: " + Object.keys(byTrack).map(k => k + " " + byTrack[k]).join(" · "));
console.log("정답 표기 변형: 평균 " + (Q.reduce((s, q) => s + (q.a || []).length, 0) / Q.length).toFixed(1) + "개");
console.log(Q.length + "문항 중 " + bad + "건 문제");
process.exit(bad ? 1 : 0);
