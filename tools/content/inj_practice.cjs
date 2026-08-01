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
    if (seen.has(norm(x.q))) throw new Error("중복 문항 — " + x.k);
    seen.add(norm(x.q));
    if (!x.k || !x.src || !x.sol || !x.ex) throw new Error((x.k || "?") + ": 필드 누락");
    /* SQL 은 테스트 목록이 아니라 표(schema)와 기준 쿼리(sol)로 채점한다 */
    if (SPEC.lang === "sql") { if (!x.schema) throw new Error(x.k + ": schema 가 없다"); }
    else if (!x.tests || !x.tests.length) throw new Error(x.k + ": tests 가 없다");
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
    const base = { k: x.k, cat: x.cat || "internals", q: x.q, src: x.src, sol: x.sol, ex: x.ex };
    if (SPEC.lang === "sql") return Object.assign(base, { t: "sql", schema: x.schema, ordered: !!x.ordered });
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
