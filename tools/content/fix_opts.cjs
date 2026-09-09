/* 선택형 보기를 새로 쓴 것을 데이터에 넣는다 — 길이 편향을 '내용' 으로 갚을 때 쓴다.

     node fix_opts.cjs <track> [--gap N]     # 정답이 단독으로 가장 긴 문항을 보여 준다 (기본 N=10)
     node fix_opts.cjs --apply fix.cjs      # {track, fixes:[{k, q?, o:[4], a?}]} 를 적용한다

   규칙
     · 정답 자리(a)는 바뀌지 않는다. 정답 글을 바꾸려면 새 보기에 그대로 넣되 a 는 같아야 한다.
     · 네 보기는 서로 달라야 하고 비어 있으면 안 된다.
     · 새 보기의 정답이 단독 최장이면 거부한다 — 그러려고 고치는 것이니까.
     · 전부 찾아야 쓴다. 하나라도 못 찾으면 아무것도 안 바꾼다.

   좋은 오답은 <b>그럴듯한 이유까지 갖춘 틀린 답</b>이다. 길이는 저절로 따라온다.
   장식으로 늘리지 말 것 — depad.cjs · natural.cjs 가 잡아낸다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function load(track) {
  const p = ROOT + "/data/t-" + track + ".js";
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  return { p, raw, a, z, arr: JSON.parse(raw.slice(a, z + 1)) };
}
const walk = (arr, fn) => arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => fn(q, u, l))));

const args = process.argv.slice(2);
function apply(SPEC) {
  const T = load(SPEC.track);
  const all = []; walk(T.arr, q => all.push(q));
  const hit = [], bad = [];
  for (const f of SPEC.fixes) {
    let c = all.filter(q => q.t === "choice" && q.k === f.k);
    if (f.q) c = c.filter(q => plain(q.q).indexOf(f.q) >= 0);
    if (c.length !== 1) { bad.push(f.k + ": 짝이 " + c.length + "개다 (q 로 좁히세요)"); continue; }
    const q = c[0];
    if (!Array.isArray(f.o) || f.o.length !== 4) { bad.push(f.k + ": 보기는 4개여야 한다"); continue; }
    if (new Set(f.o.map(plain)).size !== 4 || f.o.some(x => !plain(x))) { bad.push(f.k + ": 보기가 겹치거나 비었다"); continue; }
    const a = typeof f.a === "number" ? f.a : q.a;
    const L = f.o.map(x => plain(x).length);
    /* 사람 눈금(5자) 안이면 된다 — 정확히 맞추려다 또 장식이 붙는다 */
    const gap = L[a] - Math.max(...L.filter((x, i) => i !== a));
    if (gap >= 5) { bad.push(f.k + ": 새 보기에서도 정답이 " + gap + "자 길다 (" + L.join("/") + ")"); continue; }
    if (f.o.some(x => /(라고|다고)\s+(본다|보면 된다|볼 수 있다)$/.test(plain(x)))) { bad.push(f.k + ": 꼬리를 붙이지 마세요"); continue; }
    hit.push([q, f.o, a, f.ex]);
  }
  if (bad.length) { console.log(bad.join("\n")); throw new Error(bad.length + "개가 어긋난다 — 아무것도 바꾸지 않았다"); }
  hit.forEach(([q, o, a, ex]) => { q.o = o; q.a = a; if (ex) q.ex = ex; });
  const out = T.raw.slice(0, T.a) + JSON.stringify(T.arr) + T.raw.slice(T.z + 1);
  const back = JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1));
  if (JSON.stringify(back) !== JSON.stringify(T.arr)) throw new Error("왕복 검증 실패");
  fs.writeFileSync(T.p, out);
  console.log(SPEC.track + ": 보기 " + hit.length + "문항을 새로 썼다");
}
if (args[0] === "--apply") {
  const SPEC = require(path.resolve(args[1]));
  (Array.isArray(SPEC) ? SPEC : [SPEC]).forEach(apply);   /* 여러 트랙을 한 파일에 배열로 담아도 된다 */
  process.exit(0);
}

const track = args[0];
if (!track) { console.log("사용: node fix_opts.cjs <track> [--gap N] | --apply fix.cjs"); process.exit(1); }
const gi = args.indexOf("--gap"); const GAP = gi >= 0 ? +args[gi + 1] : 10;
const json = args.indexOf("--json") >= 0;
const out = [];
walk(load(track).arr, (q, u, l) => {
  if (q.t !== "choice" || !Array.isArray(q.o) || q.o.length !== 4) return;
  const L = q.o.map(o => plain(o).length);
  const gap = L[q.a] - Math.max(...L.filter((x, i) => i !== q.a));
  if (gap < GAP) return;
  out.push({ k: q.k, unit: u.t, lesson: l.t, gap, q: q.q, o: q.o, a: q.a, ex: q.ex });
});
out.sort((x, y) => y.gap - x.gap);
if (json) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }
out.forEach((x, i) => {
  console.log("[" + (i + 1) + "] k=" + x.k + "  (+" + x.gap + "자 · " + x.unit + ")");
  console.log("    Q. " + plain(x.q).slice(0, 160));
  x.o.forEach((o, j) => console.log("    " + (j === x.a ? "->" : "  ") + " " + j + ". " + plain(o)));
  console.log("    ex: " + plain(x.ex).slice(0, 140) + "\n");
});
console.log(track + ": 정답이 " + GAP + "자 이상 단독 최장인 문항 " + out.length + "개");
