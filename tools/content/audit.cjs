/* 트랙별 커리큘럼 점검 — '유닛이 부족한가 · 실습이 부족한가' 를 숫자로 본다.

   짐작으로 채우면 이미 두꺼운 데를 또 두껍게 만든다. 그래서 먼저 센다.

   실습(hands-on)의 정의: 사용자가 직접 코드를 쓰고 기계가 채점하는 것.
   고르기·빈칸은 아무리 많아도 실습이 아니다.

     node tools/content/audit.cjs                요약
     node tools/content/audit.cjs <트랙>         그 트랙의 유닛 목록
     node tools/content/audit.cjs --dry [트랙…]  실습이 0인 유닛만 (채울 곳 목록) */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "data");

/* 직접 코드를 쓰고 기계가 채점하는 유형 */
const HANDS = new Set(["code", "py", "sql", "html", "react", "ts", "sim", "arch"]);

function load(f) {
  const s = fs.readFileSync(path.join(DATA, f), "utf8");
  return JSON.parse(s.slice(s.indexOf(",", s.indexOf("(")) + 1, s.lastIndexOf(")")));
}

function scan(track) {
  /* 청크 모양: [{t: 유닛제목, l: [{t: 레슨제목, q: [문항…]}]}] */
  return (load("t-" + track + ".js") || []).map(u => {
    const out = { title: u.t, lessons: (u.l || []).length, q: 0, hands: 0, types: {}, lt: (u.l || []).map(l => l.t) };
    (u.l || []).forEach(l => (l.q || []).forEach(q => {
      if (!q || typeof q.t !== "string") return;
      out.q++;
      out.types[q.t] = (out.types[q.t] || 0) + 1;
      if (HANDS.has(q.t)) out.hands++;
    }));
    return out;
  });
}

const tracks = fs.readdirSync(DATA).filter(f => /^t-.*\.js$/.test(f)).map(f => f.slice(2, -3)).sort();
const only = process.argv[2];

if (only === "--dry") {
  const want = (process.argv[3] || "python,javascript,sql,react,web,algo").split(",");
  want.forEach(t => {
    const us = scan(t).filter(u => u.q > 0 && u.hands === 0);
    console.log("\n== " + t + " · 실습 0인 유닛 " + us.length + "개");
    us.forEach(u => console.log("   " + String(u.q).padStart(3) + "문항  " + u.title));
  });
  process.exit(0);
}

if (only) {
  const us = scan(only);
  console.log(only + " · 유닛 " + us.length + "개\n");
  us.forEach((u, i) => {
    const t = Object.keys(u.types).sort((a, b) => u.types[b] - u.types[a])
      .map(k => k + " " + u.types[k]).join(" · ");
    console.log(String(i + 1).padStart(3) + " " + u.title
      + "\n     문항 " + u.q + " · 실습 " + u.hands
      + " (" + (u.q ? Math.round(u.hands / u.q * 100) : 0) + "%) · " + t);
  });
  process.exit(0);
}

const rows = [];
tracks.forEach(t => {
  let us; try { us = scan(t); } catch (e) { return; }
  const q = us.reduce((a, u) => a + u.q, 0);
  const h = us.reduce((a, u) => a + u.hands, 0);
  rows.push({
    t, u: us.length, les: us.reduce((a, u) => a + u.lessons, 0), q, h,
    pct: q ? Math.round(h / q * 100) : 0,
    /* 실습이 하나도 없는 유닛 — 여기가 '읽기만 하고 끝나는' 구간이다 */
    dry: us.filter(u => u.q > 0 && u.hands === 0).length,
  });
});

rows.sort((a, b) => a.pct - b.pct);
console.log("트랙       유닛  레슨   문항   실습   실습%  실습0유닛");
console.log("─".repeat(58));
rows.forEach(r => {
  const flag = r.pct < 5 ? "  ◀ 거의 읽기만" : r.pct < 10 ? "  ◀ 부족" : "";
  console.log(r.t.padEnd(10) + String(r.u).padStart(5) + String(r.les).padStart(6)
    + String(r.q).padStart(7) + String(r.h).padStart(7) + (r.pct + "%").padStart(7)
    + (r.dry + "/" + r.u).padStart(10) + flag);
});
const Q = rows.reduce((a, r) => a + r.q, 0), H = rows.reduce((a, r) => a + r.h, 0);
console.log("─".repeat(58));
console.log("합계".padEnd(9) + String(rows.reduce((a, r) => a + r.u, 0)).padStart(5)
  + String(rows.reduce((a, r) => a + r.les, 0)).padStart(6)
  + String(Q).padStart(7) + String(H).padStart(7) + (Math.round(H / Q * 100) + "%").padStart(7));
console.log("\n실습 0인 유닛 " + rows.reduce((a, r) => a + r.dry, 0) + "개 / 전체 유닛 "
  + rows.reduce((a, r) => a + r.u, 0) + "개");
