/* 짧은 해설(<40자)을 찾아 보여 주고, 새로 쓴 해설을 데이터에 다시 넣는다.

     node ex_short.cjs                 # 트랙별 개수
     node ex_short.cjs python          # 그 트랙의 짧은 해설을 전부 출력(고칠 때 보고 쓴다)
     node ex_short.cjs python --json   # 같은 것을 JSON 으로
     node ex_short.cjs --apply fix.js  # 새 해설을 적용한다

   fix.js 는 {track, fixes:[{k, ex}]} 를 내보낸다. k 는 문항 제목이고,
   한 트랙 안에서 k 가 겹치면(그런 트랙이 있다) 물음까지 함께 봐서 고른다.
   전부 찾아야 쓴다(all-or-nothing) — 하나라도 못 찾으면 아무것도 안 바꾼다.

   해설이 짧다는 것은 대개 <b>정답을 되풀이했다</b>는 뜻이다. 고칠 때는
   '왜 그런가' 와 '나머지는 왜 아닌가' 를 함께 적는다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const SHORT = 40;

function load(track) {
  const p = ROOT + "/data/t-" + track + ".js";
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  return { p, raw, a, z, arr: JSON.parse(raw.slice(a, z + 1)) };
}
function tracks() {
  return fs.readdirSync(ROOT + "/data").filter(x => /^t-.*\.js$/.test(x)).map(x => x.slice(2, -3));
}
function walk(arr, fn) {
  arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => fn(q, u, l))));
}

const args = process.argv.slice(2);

/* ---------- 적용 ---------- */
if (args[0] === "--apply") {
  const SPEC = require(path.resolve(args[1]));
  const T = load(SPEC.track);
  const all = [];
  walk(T.arr, q => all.push(q));
  const hit = [];
  for (const f of SPEC.fixes) {
    let cands = all.filter(q => q.k === f.k);
    if (f.q) cands = cands.filter(q => plain(q.q).indexOf(f.q) >= 0);
    if (f.ex0) cands = cands.filter(q => plain(q.ex).indexOf(f.ex0) >= 0);   /* 지금 해설의 한 토막으로 좁힌다 */
    if (cands.length !== 1) throw new Error(f.k + ": 짝이 " + cands.length + "개다 (q · ex0 로 좁히세요)");
    if (plain(f.ex).length < 80) throw new Error(f.k + ": 새 해설이 80자 미만이다");
    if (/<[a-z]+(?![^>]*>)/i.test(f.ex)) throw new Error(f.k + ": 태그가 닫히지 않았다");
    hit.push([cands[0], f.ex]);
  }
  hit.forEach(([q, ex]) => { q.ex = ex; });
  const out = T.raw.slice(0, T.a) + JSON.stringify(T.arr) + T.raw.slice(T.z + 1);
  const back = JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1));
  if (JSON.stringify(back) !== JSON.stringify(T.arr)) throw new Error("왕복 검증 실패");
  fs.writeFileSync(T.p, out);
  console.log(SPEC.track + ": 해설 " + hit.length + "개를 새로 썼다");
  process.exit(0);
}

/* ---------- 목록 ---------- */
if (!args[0] || args[0].startsWith("--")) {
  let total = 0;
  const rows = tracks().map(t => {
    let n = 0;
    walk(load(t).arr, q => { if (plain(q.ex).length < SHORT) n++; });
    total += n;
    return [t, n];
  }).filter(r => r[1]).sort((a, b) => b[1] - a[1]);
  rows.forEach(r => console.log(String(r[1]).padStart(4) + "  " + r[0]));
  console.log("\n짧은 해설 " + total + "개 (" + rows.length + "트랙)");
  process.exit(0);
}

const track = args[0];
const json = args.indexOf("--json") >= 0;
const out = [];
walk(load(track).arr, (q, u, l) => {
  if (plain(q.ex).length >= SHORT) return;
  out.push({ k: q.k, t: q.t, unit: u.t, lesson: l.t, q: q.q, o: q.o, a: q.a, ans: q.a2 || q.a, ex: q.ex });
});
if (json) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }
out.forEach((x, i) => {
  console.log("[" + (i + 1) + "] k=" + x.k + "  (" + x.t + " · " + x.unit + ")");
  console.log("    Q. " + plain(x.q));
  if (Array.isArray(x.o)) x.o.forEach((o, j) => console.log("    " + (j === x.a ? "->" : "  ") + " " + j + ". " + plain(o)));
  else if (Array.isArray(x.ans)) console.log("    답: " + x.ans.join(" / "));
  console.log("    ex(" + plain(x.ex).length + "자) " + plain(x.ex) + "\n");
});
console.log(track + ": 짧은 해설 " + out.length + "개");
