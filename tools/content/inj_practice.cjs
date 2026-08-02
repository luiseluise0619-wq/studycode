/* 기존 유닛 '안에' 실습 레슨을 넣는다.

   왜 새 유닛을 만들지 않는가: 새 유닛은 제목 때문에 트랙 맨 뒤로 정렬되고
   (unitDiff 에서 '직접 코딩' 은 95점), 초보자는 거기까지 가지 못한다.
   이론을 읽은 그 자리에서 바로 써 봐야 실습이다.

     node tools/content/inj_practice.cjs <spec.js>

   spec: {track, source, lang:"py"|"js"|"sql"}
   source 는 [{unit, lesson, th, q:[…]}] 를 내보낸다 — unit 은 이미 있는 유닛 제목.
   전부 성공해야 쓴다(all-or-nothing). */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const SPEC = require(path.resolve(process.argv[2]));
const GROUPS = require(path.resolve(path.dirname(path.resolve(process.argv[2])), SPEC.source));

const norm = s => String(s).replace(/\s+/g, " ").trim();
const file = ROOT + "/data/t-" + SPEC.track + ".js";
const raw = fs.readFileSync(file, "utf8");
const a = raw.indexOf("["), z = raw.lastIndexOf("]");
const arr = JSON.parse(raw.slice(a, z + 1));

const seen = new Set();
arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => seen.add(norm(q.q)))));

GROUPS.forEach(g => {
  const u = arr.find(x => x.t === g.unit);
  if (!u) throw new Error("없는 유닛: " + g.unit);
  if (u.l.some(l => l.t === g.lesson)) throw new Error("레슨 제목 중복: " + g.unit + " / " + g.lesson);
  if (!g.th || !g.th.sum || !Array.isArray(g.th.body) || !g.th.code || !g.th.key)
    throw new Error(g.unit + ": 이론 형식이 맞지 않는다");
  if (!g.q.length) throw new Error(g.unit + ": 문항이 없다");
  g.q.forEach(x => {
    if (SPEC.lang === "wire") {
      if (!x.k || !x.qq || !x.ex || !x.parts || !x.checks || !x.sol)
        throw new Error((x.k || "?") + ": 배선 문항 필드 누락");
      if (seen.has(norm(x.qq))) throw new Error("중복 문항 — " + x.k);
      seen.add(norm(x.qq));
      return;
    }
    const body = x.q || x.qq;
    if (seen.has(norm(body))) throw new Error("중복 문항 — " + x.k);
    seen.add(norm(body));
    if (!x.k || !x.src || !x.sol || !x.ex) throw new Error((x.k || "?") + ": 필드 누락");
    /* SQL 은 테스트 목록이 아니라 표(schema)와 기준 쿼리(sol)로 채점한다 */
    if (SPEC.lang === "sql") { if (!x.schema) throw new Error(x.k + ": schema 가 없다"); }
    /* 러너 언어(go 등)는 그 언어의 테스트 러너가 채점한다 — 테스트를 옮기지 않는다 */
    else if (SPEC.runner) {
      if (!x.test || !Object.keys(x.test).length) throw new Error(x.k + ": 테스트 파일이 없다");
      return;
    }
    else if (!x.tests || !x.tests.length) throw new Error(x.k + ": tests 가 없다");
    /* html·react 는 DOM 검사({d, js})다 — 입력/기대값 쌍이 아니다 */
    else if (SPEC.lang === "html" || SPEC.lang === "react") {
      x.tests.forEach(t => { if (!t || !t.d || !t.js) throw new Error(x.k + ": DOM 검사는 {d, js} 여야 한다"); });
    }
    /* 원문 그대로 비교한다. 공백을 지우고 비교하면 '들여쓰기가 버그' 인 문제를
       같은 코드로 오해한다 — 초보자가 가장 자주 만나는 버그인데 그걸 막으면 안 된다.
       '고칠 것이 없는 문제' 인지는 ver_practice.cjs 가 실제로 돌려서 확인한다. */
    if (x.src === x.sol) throw new Error(x.k + ": 시작 코드와 정답이 글자까지 같다");
  });
});

let added = 0;
GROUPS.forEach(g => {
  const u = arr.find(x => x.t === g.unit);
  const q = g.q.map(x => {
    const base = { k: x.k, cat: x.cat || "internals", q: x.q || x.qq, src: x.src, sol: x.sol, ex: x.ex };
    if (SPEC.lang === "sql") return Object.assign(base, { t: "sql", schema: x.schema, ordered: !!x.ordered });
    /* 배선 문항: 부품·검사·시작배선을 그대로 싣는다. sol 은 참고 답안으로 함께 둔다 */
    if (SPEC.lang === "wire")
      return Object.assign({ k: x.k, cat: x.cat || "internals", q: x.qq, ex: x.ex },
        { t: "wire", lv: x.lv || 1, parts: x.parts, checks: x.checks,
          start: x.start || [], sol: x.sol });
    if (SPEC.lang === "html" || SPEC.lang === "react")
      return Object.assign(base, { t: SPEC.lang, lv: x.lv || 1, tests: x.tests });
    /* 러너 문항: 앱은 rt.lang·rt.test·rt.srcName 을 그대로 실행 서버로 보낸다.
       srcName 을 빠뜨리면 러너가 기본 파일명(java 는 Sol.java)으로 저장한다.
       공개 클래스 이름이 Bag 인데 Sol.java 로 저장되면 javac 가 거부한다 —
       검증기는 srcName 을 넘겨서 통과하는데 앱에서만 실패하는, 최악의 어긋남이다. */
    if (SPEC.runner) {
      const rt = { lang: SPEC.lang, test: x.test };
      if (x.name || x.cls) rt.name = x.name || x.cls;
      const srcName = x.srcName || (SPEC.lang === "java" && x.cls ? x.cls + ".java" : null);
      if (srcName) rt.srcName = srcName;
      return Object.assign(base, { t: "code", run: SPEC.lang, lv: x.lv || 2, rt: rt });
    }
    return Object.assign(base, {
      t: SPEC.lang === "py" ? "py" : "code",
      run: SPEC.lang === "js" ? "js" : undefined,
      tests: x.tests.map(c => ({ in: c[0], out: c[1] })),
      edge: (x.edge || []).map(c => ({ in: c[0], out: c[1] })),
    });
  });
  /* 이론 뒤, 고르기 문항 뒤에 붙인다 — 읽고 → 고르고 → 직접 써 본다 */
  u.l.push({ t: g.lesson, th: g.th, q: q });
  added += q.length;
});

fs.writeFileSync(file, raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1));
console.log("t-" + SPEC.track + ".js · 실습 레슨 " + GROUPS.length + "개 · 문항 " + added + "개 주입");
