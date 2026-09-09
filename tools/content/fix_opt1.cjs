/* 보기 하나만 바꾼다 — 72차: '…에러가 발생한다' 처럼 정답률이 15% 아래인 끝맺음의 오답을
   구체적인 틀린 답으로 다시 쓸 때 쓴다.

     node fix_opt1.cjs --apply spec.cjs     # {track, fixes:[{k, q?, from, to}]} 또는 그 배열

   · from 은 그 문항의 보기 하나에만 들어 있는 글 조각, to 는 그 보기의 새 글 전체다.
   · 정답 자리는 손대지 않는다(from 이 정답에 걸리면 거부).
   · 바꾼 뒤 정답이 나머지보다 5자 이상 길면 거부, 보기가 겹치면 거부, 새 글이 다시
     치우친 끝맺음(SKEW)으로 끝나면 거부, '…라고 본다' 꼬리면 거부.
   · 트랙 단위로 전부 맞아야 쓴다 — 하나라도 어긋나면 그 트랙은 아무것도 안 바꾼다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const SKEW = new Set(["에러가 발생한다", "없게 된다", "필요 없다", "않기 때문이다", "문제가 없다", "생기지 않는다",
  "방법이 없다", "않아도 된다", "쓰지 않는다", "오류가 난다", "필요가 없다", "있기 때문이다", "주기 때문", "없기 때문이다"]);
const ABS = /(^|\s)(언제나|항상|반드시|무조건|아예|전혀|결코|하나도|절대)\s/;

function load(track) {
  const p = ROOT + "/data/t-" + track + ".js";
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  return { p, raw, a, z, arr: JSON.parse(raw.slice(a, z + 1)) };
}

function apply(SPEC) {
  const T = load(SPEC.track);
  const all = [];
  T.arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => all.push(q))));
  const bad = [], hit = [];
  let done = 0;
  for (const f of SPEC.fixes) {
    /* 이미 적용된 스펙은 조용히 건너뛴다 — 배열 스펙을 다시 돌려도 앞 트랙이 어긋나지 않게 */
    if (all.some(q => q.k === f.k && Array.isArray(q.o) && q.o.some(o => String(o) === String(f.to)))) { done++; continue; }
    let c = all.filter(q => q.k === f.k && Array.isArray(q.o));
    if (f.q) c = c.filter(q => plain(q.q).indexOf(f.q) >= 0);
    c = c.filter(q => q.o.some(o => String(o).indexOf(f.from) >= 0));
    if (c.length !== 1) { bad.push(f.k + ": 짝이 " + c.length + "개다 (from 이나 q 로 좁히세요)"); continue; }
    const q = c[0];
    const idx = q.o.map((o, i) => String(o).indexOf(f.from) >= 0 ? i : -1).filter(i => i >= 0);
    if (idx.length !== 1) { bad.push(f.k + ": from 이 보기 " + idx.length + "개에 걸린다"); continue; }
    const i = idx[0];
    if (i === q.a) { bad.push(f.k + ": from 이 정답에 걸린다"); continue; }
    if (!String(f.to).trim()) { bad.push(f.k + ": to 가 비었다"); continue; }
    const key = plain(f.to).split(/\s+/).slice(-2).join(" ");
    if (SKEW.has(key)) { bad.push(f.k + ": 새 글도 치우친 끝맺음 '" + key + "' 으로 끝난다"); continue; }
    if (/(라고|다고)\s+(본다|보면 된다|볼 수 있다)$/.test(plain(f.to))) { bad.push(f.k + ": 꼬리를 붙이지 마세요"); continue; }
    if (ABS.test(plain(f.to)) && !ABS.test(plain(q.o[i]))) { bad.push(f.k + ": 새 글에 단정어가 들어갔다 (항상·아예·전혀…)"); continue; }
    const o = q.o.slice(); o[i] = f.to;
    if (new Set(o.map(String)).size !== 4) { bad.push(f.k + ": 보기가 겹친다"); continue; }
    const L = o.map(x => plain(x).length);
    const gap = L[q.a] - Math.max(...L.filter((x, j) => j !== q.a));
    if (gap >= 5) { bad.push(f.k + ": 정답이 " + gap + "자 길어진다 (" + L.join("/") + ")"); continue; }
    hit.push([q, i, f.to]);
  }
  if (bad.length) { console.log(bad.join("\n")); throw new Error(SPEC.track + ": " + bad.length + "개가 어긋난다 — 아무것도 바꾸지 않았다"); }
  if (!hit.length) { console.log(SPEC.track + ": 이미 적용됨 (" + done + "개)"); return; }
  hit.forEach(([q, i, to]) => { q.o[i] = to; });
  const out = T.raw.slice(0, T.a) + JSON.stringify(T.arr) + T.raw.slice(T.z + 1);
  if (JSON.stringify(JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1))) !== JSON.stringify(T.arr)) throw new Error("왕복 검증 실패");
  fs.writeFileSync(T.p, out);
  console.log(SPEC.track + ": 보기 " + hit.length + "개를 다시 썼다");
}

const args = process.argv.slice(2);
const ai = args.indexOf("--apply");
if (ai < 0 || !args[ai + 1]) { console.log("사용: node fix_opt1.cjs --apply spec.cjs"); process.exit(1); }
const SPEC = require(path.resolve(args[ai + 1]));
(Array.isArray(SPEC) ? SPEC : [SPEC]).forEach(apply);
