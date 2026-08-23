/* 이미 완성된 문항 객체(t 를 스스로 들고 있는 것)를 임의 트랙에 새 유닛으로 넣는다.
   단답형(input)·선택형(choice)처럼 러너가 필요 없는 유형에 쓴다.
   실행형은 inj_jsexec.cjs / inj_pyexec.cjs 를 쓴다.

     node inj_qa.cjs ./spec_in_cs.cjs

   spec 은 {track, unit, guide?, xp?, source, slice?, lessons:[{t, n, th}]} 를 내보낸다.
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
arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(x => seen.add(norm(x.q)))));
Q.forEach(x => { if (seen.has(norm(x.q))) throw new Error("중복 문항 — " + x.k); });
if (arr.some(u => u.t === SPEC.unit)) throw new Error("유닛 제목 중복: " + SPEC.unit);

const xp = SPEC.xp || 60;
let cur = 0;
const lessons = SPEC.lessons.map(L => {
  if (!L.th || !L.th.sum || L.th.body.length !== 2 || !L.th.code || !L.th.key) throw new Error(L.t + ": 이론 형식");
  const qs = Q.slice(cur, cur + L.n).map(x => {
    if (!x.t || !x.q || !x.ex) throw new Error(x.k + ": 필드 누락");
    /* track 은 검증기용 표시라 데이터에는 넣지 않는다 — 트랙은 파일이 이미 정한다 */
    const out = {};
    Object.keys(x).forEach(k => { if (k !== "track") out[k] = x[k]; });
    return out;
  });
  cur += L.n;
  return { t: L.t, xp, th: L.th, q: qs };
});
if (cur !== Q.length) throw new Error("배정 누락");

/* 자리 정하기.
   '해 보는 유닛'(시뮬레이션·실행형 실전·설계 실전)은 배운 뒤에 오는 것이라 트랙 맨 뒤에
   있어야 하고, app 테스트가 그것을 검사한다. 단답·선택형은 배우는 단계이므로
   그 무리 <b>앞에</b> 끼운다. 순서(ord)를 적어 둔 트랙이면 전부 다시 매긴다. */
const TAILU = /시뮬레이션|실행형 실전|실행형 ·|설계 실전|설계 · 직접|직접 구현 —|직접 코딩 —|직접 SQL —|직접 만들며|직접 실행해/;
const unit = { t: SPEC.unit, l: lessons };
const hasOrd = arr.length > 0 && arr.every(u => typeof u.ord === "number");
const order = hasOrd ? arr.slice().sort((x, y) => x.ord - y.ord) : arr.slice();
let at = order.findIndex(u => TAILU.test(u.t));
if (at < 0) at = order.length;
order.splice(at, 0, unit);
if (hasOrd) order.forEach((u, i) => { u.ord = i; });
fs.writeFileSync(p, raw.slice(0, a) + JSON.stringify(order) + raw.slice(z + 1));

const back = JSON.parse(fs.readFileSync(p, "utf8").match(/^__CR\('[^']+',(.*)\);\s*$/s)[1]);
const u = back.find(x => x.t === SPEC.unit);
if (!u || u.l.length !== SPEC.lessons.length) throw new Error("왕복 검증 실패");
console.log(SPEC.track + " ← " + Q.length + "문항 / 레슨 " + lessons.length
  + " · 유닛 '" + SPEC.unit + "' (" + (at + 1) + "/" + order.length + "번째)");
