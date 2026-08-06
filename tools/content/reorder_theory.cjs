/* 레슨이 자기 주제를 맨 앞에서 읽게 문단 순서를 바꾼다.

   왜: 574개 유닛이 레슨마다 이론이 똑같다. 그중 일부는 이론 안에 그 레슨 이야기가
   이미 들어 있는데, 자리가 뒤라서 학습자가 남의 주제를 먼저 읽고 내려가야 한다.
   예를 들어 '임베딩과 벡터 검색' 레슨을 열면 '청킹' 문단이 먼저 나온다.

   글을 새로 쓰지 않는다. 있는 문단의 순서만 바꾼다 — 그래서 안전하고, 되돌리기도 쉽다.
   맞는 문단이 아예 없는 레슨은 건드리지 않는다. 그건 손으로 써야 한다.

     node tools/content/reorder_theory.cjs          무엇이 바뀔지 보여만 준다
     node tools/content/reorder_theory.cjs --write  실제로 바꾼다 */
const fs = require("fs");
const path = require("path");
const DATA = path.join(path.resolve(__dirname, "..", ".."), "data");
const WRITE = process.argv.includes("--write");

const norm = s => String(s).replace(/[\s·—\-()[\]]/g, "").toLowerCase();

/* 레슨 제목과 문단 제목이 같은가. 완전히 같은 것을 먼저 찾고, 없으면 한쪽이
   다른 쪽을 품는 경우를 본다 ('배칭과 KV 캐시' ↔ '배칭과 KV 캐시와 처리량'). */
function findPara(lessonTitle, heads) {
  const ln = norm(lessonTitle);
  let i = heads.findIndex(h => norm(h) === ln);
  if (i >= 0) return i;
  return heads.findIndex(h => {
    const hn = norm(h);
    return hn.length >= 4 && ln.length >= 4 && (ln.includes(hn) || hn.includes(ln));
  });
}

const tracks = fs.readdirSync(DATA).filter(f => /^t-.*\.js$/.test(f)).map(f => f.slice(2, -3)).sort();
let moved = 0, skipped = 0;
const log = [];

tracks.forEach(track => {
  const file = path.join(DATA, "t-" + track + ".js");
  const raw = fs.readFileSync(file, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  let arr;
  try { arr = JSON.parse(raw.slice(a, z + 1)); } catch (e) { return; }
  let changed = 0;

  arr.forEach(u => {
    const ls = (u.l || []).filter(l => l.th);
    if (ls.length < 2) return;
    /* 레슨끼리 이론이 똑같은 유닛만 다룬다 — 이미 따로 쓴 곳은 건드리지 않는다 */
    if (new Set(ls.map(l => JSON.stringify(l.th))).size !== 1) return;

    ls.forEach(l => {
      const heads = (l.th.body || []).map(b => b.h);
      const i = findPara(l.t, heads);
      if (i < 0) { skipped++; return; }
      if (i === 0) return;
      /* 이 레슨만의 사본을 만들어 문단 순서를 바꾼다. 글자는 그대로다. */
      const th = JSON.parse(JSON.stringify(l.th));
      const body = th.body;
      th.body = [body[i]].concat(body.filter((_, j) => j !== i));
      l.th = th;
      changed++; moved++;
      if (log.length < 12) log.push(track + "  " + l.t.slice(0, 22).padEnd(23) + "→ '" + heads[i] + "' 를 맨 앞으로");
    });
  });

  if (changed && WRITE) fs.writeFileSync(file, raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1));
  if (changed) console.log(track.padEnd(11) + changed + "개 레슨");
});

console.log("\n" + (WRITE ? "바꿨다" : "바꿀 수 있다") + ": " + moved + "개 레슨");
console.log("맞는 문단이 없어 못 건드림: " + skipped + "개 (손으로 써야 한다)");
if (log.length) { console.log("\n예:"); log.forEach(x => console.log("  " + x)); }
if (!WRITE) console.log("\n실제로 바꾸려면 --write 를 붙인다");
