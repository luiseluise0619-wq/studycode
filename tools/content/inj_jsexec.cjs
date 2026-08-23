/* JS 실행형(code · run:"js") 문항을 임의의 트랙에 주입하는 공용 주입기.
   inj_pyexec.cjs 의 JS 판이다.

   사용:  node inj_jsexec.cjs ./spec_dbg_be.cjs
   spec 은 {track, unit, guide, xp, source, slice?, lessons:[{t,n,th}]} 를 내보낸다.
   slice 로 한 콘텐츠 파일을 여러 트랙에 나눠 넣을 수 있다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs = require("fs");
const ROOT = require("path").resolve(__dirname, "..", "..");
const SPEC = require(require("path").resolve(process.argv[2]));
const ALL = require(require("path").resolve(__dirname, SPEC.source));
const Q = SPEC.slice ? ALL.slice(SPEC.slice[0], SPEC.slice[1]) : ALL;

const need = SPEC.lessons.reduce((s, L) => s + L.n, 0);
if (Q.length !== need) throw new Error("문항 " + Q.length + "개, 레슨 합 " + need);

const norm = s => String(s).replace(/\s+/g, " ").trim();
const p = ROOT + "/data/t-" + SPEC.track + ".js";
const raw = fs.readFileSync(p, "utf8");
const a = raw.indexOf("["), z = raw.lastIndexOf("]");
const arr = JSON.parse(raw.slice(a, z + 1));
const seen = new Set();
arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => seen.add(norm(q.q)))));
Q.forEach(q => { if (seen.has(norm(q.q))) throw new Error("중복 문항 — " + q.k); });
if (arr.some(u => u.t === SPEC.unit)) throw new Error("유닛 제목 중복: " + SPEC.unit);

const xp = SPEC.xp || 80;
let cur = 0;
const lessons = SPEC.lessons.map(L => {
  if (!L.th || !L.th.sum || L.th.body.length !== 2 || !L.th.code || !L.th.key) throw new Error(L.t + ": 이론 형식");
  const qs = Q.slice(cur, cur + L.n).map(x => {
    if (!x.src || !x.sol || !x.tests || !x.edge) throw new Error(x.k + ": 필드 누락");
    return {
      t: "code", run: "js", k: x.k, cat: x.cat || "internals", q: x.q, src: x.src, sol: x.sol,
      tests: x.tests.map(c => ({ in: c[0], out: c[1] })),
      edge: x.edge.map(c => ({ in: c[0], out: c[1] })), ex: x.ex,
    };
  });
  cur += L.n;
  return { t: L.t, xp, th: L.th, q: qs };
});
if (cur !== Q.length) throw new Error("배정 누락");
/* 트랙이 유닛 순서(ord)를 적어 두었으면 새 유닛에도 자리를 준다.
   일부만 적혀 있으면 앱이 순서를 통째로 무시하므로 반드시 함께 맞춘다. */
const unit = { t: SPEC.unit, l: lessons };
if (arr.length && arr.every(u => typeof u.ord === "number")) {
  unit.ord = Math.max(...arr.map(u => u.ord)) + 1;
}
arr.push(unit);
fs.writeFileSync(p, raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1));

/* 쓴 뒤 다시 읽어 그대로인지 본다 */
const back = JSON.parse(fs.readFileSync(p, "utf8").match(/^__CR\('[^']+',(.*)\);\s*$/s)[1]);
const u = back[back.length - 1];
if (u.t !== SPEC.unit || u.l.length !== SPEC.lessons.length) throw new Error("왕복 검증 실패");
console.log(SPEC.track + " ← " + Q.length + "문항 / 레슨 " + lessons.length + " · 유닛 '" + SPEC.unit + "'");
