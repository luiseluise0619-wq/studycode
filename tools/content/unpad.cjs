/* 기계로 붙인 '맺음말' 이 남긴 찌꺼기를, 붙이기 전 글로 되돌린다.

     node unpad.cjs <base-dir>            # 얼마나, 어떤 꼴로 되돌리는지 (미리보기)
     node unpad.cjs <base-dir> --show     # 되돌리는 보기를 전부 보여 준다
     node unpad.cjs <base-dir> --apply    # 실제로 고친다

   <base-dir> 에는 맺음말을 붙이기 전 시점(bcca23c 직전)의 data/t-*.js 를 둔다.
     git show bcca23c~1:data/t-python.js > base/t-python.js

   depad.cjs 는 꼬리를 문법으로 잘랐다. 그래서 '대표적인 경우' 가 '대표적인' 으로,
   '…없다는 뜻이다' 가 '…없다는 자리' 로 남은 자리가 있다. 이 도구는 문법을 보지
   않는다 — 붙이기 전 글이 지금 글의 앞머리와 같으면 그냥 그때 글로 되돌린다.

   문항은 제목(k)과 물음(q)으로 짝을 찾고, 보기는 자리가 아니라 글로 짝을 찾는다
   (그 사이에 보기를 섞은 적이 있다). 정답 보기의 짝이 없거나 네 보기가 서로
   같아지면 그 문항은 건드리지 않는다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const norm = s => plain(s).replace(/[\s.,·:;!?]+$/g, "");

function load(p) {
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  return { raw, a, z, arr: JSON.parse(raw.slice(a, z + 1)) };
}
function key(q) { return q.k + " || " + plain(q.q); }

/* 옛 보기가 지금 보기의 앞머리인가 — 또는 그 반대인가.
   앞머리 6자 이상 같고, 짧은 쪽 길이의 70% 이상이 같으면 같은 보기로 본다. */
function related(oldS, newS) {
  const A = norm(oldS), B = norm(newS);
  if (A === B) return "same";
  if (B.startsWith(A)) return "padded";      /* 옛 글 + 꼬리 */
  if (A.startsWith(B)) return "cut";         /* 꼬리를 자르다 옛 글까지 잘림 */
  let i = 0; const n = Math.min(A.length, B.length);
  while (i < n && A[i] === B[i]) i++;
  if (i >= 6 && i >= 0.7 * n) return "drift"; /* '…다' 가 '…라고' 로 바뀐 뒤 잘린 꼴 */
  return null;
}

const baseDir = process.argv[2];
if (!baseDir || baseDir.startsWith("--")) { console.log("사용: node unpad.cjs <base-dir> [--show|--apply]"); process.exit(1); }
const mode = process.argv[3] || "";
const files = fs.readdirSync(ROOT + "/data").filter(x => /^t-.*\.js$/.test(x)).sort();
const stat = { same: 0, padded: 0, cut: 0, drift: 0, other: 0, noq: 0, skipped: 0, fixedQ: 0 };
const shown = [];

for (const f of files) {
  const bp = path.join(baseDir, f);
  if (!fs.existsSync(bp)) continue;
  const B = load(bp), C = load(ROOT + "/data/" + f);
  const track = f.slice(2, -3);
  const old = new Map();
  B.arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => { if (q.t === "choice" && Array.isArray(q.o)) old.set(key(q), q); })));
  let touched = 0;

  C.arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => {
    if (q.t !== "choice" || !Array.isArray(q.o)) return;
    const o0 = old.get(key(q));
    if (!o0) { stat.noq++; return; }
    const next = q.o.slice(); let changed = false, ok = true;
    q.o.forEach((cur, i) => {
      if (o0.o.some(x => norm(x) === norm(cur))) { stat.same++; return; }
      /* 글로 짝을 찾는다 — 가장 긴 앞머리를 가진 옛 보기 */
      let best = null, bestKind = null, bestLen = -1;
      o0.o.forEach(x => {
        const k = related(x, cur); if (!k) return;
        const A = norm(x), Bn = norm(cur); let j = 0; while (j < Math.min(A.length, Bn.length) && A[j] === Bn[j]) j++;
        if (j > bestLen) { best = x; bestKind = k; bestLen = j; }
      });
      if (!best) { stat.other++; if (i === q.a) ok = false; return; }
      stat[bestKind]++;
      if (norm(best) !== norm(cur)) { next[i] = best; changed = true;
        if (shown.length < 400) shown.push(track + (i === q.a ? " *" : "  ") + " [" + bestKind + "] " + plain(cur) + "\n      → " + plain(best)); }
    });
    if (!changed) return;
    if (!ok || new Set(next.map(norm)).size !== next.length || next.some(x => norm(x).length === 0)) { stat.skipped++; return; }
    stat.fixedQ++;
    if (mode === "--apply") { q.o = next; touched++; }
  })));

  if (mode === "--apply" && touched) {
    const outRaw = C.raw.slice(0, C.a) + JSON.stringify(C.arr) + C.raw.slice(C.z + 1);
    const back = JSON.parse(outRaw.slice(outRaw.indexOf("["), outRaw.lastIndexOf("]") + 1));
    if (JSON.stringify(back) !== JSON.stringify(C.arr)) throw new Error(f + " 왕복 검증 실패");
    fs.writeFileSync(ROOT + "/data/" + f, outRaw);
    console.log(track + " +" + touched);
  }
}

if (mode === "--show") shown.forEach(x => console.log(x));
else shown.slice(0, 40).forEach(x => console.log(x));
console.log("\n같음 " + stat.same + " · 꼬리 붙음 " + stat.padded + " · 잘림 " + stat.cut + " · 어긋남 " + stat.drift
  + " · 짝 없음 " + stat.other + " · 옛 문항 없음 " + stat.noq
  + "\n되돌릴 문항 " + stat.fixedQ + " · 건드리지 않는 문항 " + stat.skipped);
if (!mode) console.log("\n실제로 고치려면 --apply");
