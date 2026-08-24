/* 데이터에 실린 코드 리뷰(t:"review") 문항 전체를 놓고 <b>읽지 않고 고르는 길</b>을 잰다.

     node tools/content/ver_revguess.cjs            # 전체 요약
     node tools/content/ver_revguess.cjs --track    # 트랙별
     node tools/content/ver_revguess.cjs --list rust   # 고쳐야 할 문항 목록

   리뷰는 '결함을 모두 고르기' 라 판정 단위가 <b>보기 하나하나</b>다.
   기준선은 전체 결함 비율 — 아무 보기나 결함이라 부를 때 맞을 확률이다.

     · 가장 긴 보기      — 그 보기가 결함인 비율
     · 평균보다 긴 보기  — 평균 길이를 넘는 보기를 전부 결함이라 찍는 전략의 적중
     · 자리              — 자리별 결함 비율 (44차에 100% → 40.6% 로 갚았다)
     · 처방형 말투       — '…해야 한다' 로 끝나는 보기가 결함인 비율

   길이가 갈리는 까닭은 대개 하나다: <b>결함 보기에만 근거를 쓰고 정상 보기는
   짧은 승인문으로 둔 것.</b> 고치는 방향은 결함을 줄이는 쪽이 아니라
   디스트랙터를 같은 밀도로 다시 쓰는 쪽이다 — 그것이 곧 좋은 오답이다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

/* 화면에 보이는 길이 — 한글은 라틴 문자의 두 칸을 먹는다 */
function width(s) {
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    w += (c >= 0x1100 && c <= 0x115F) || (c >= 0x2E80 && c <= 0xA4CF) || (c >= 0xAC00 && c <= 0xD7A3)
      || (c >= 0xF900 && c <= 0xFAFF) || (c >= 0xFF00 && c <= 0xFF60) ? 2 : 1;
  }
  return w;
}
/* 보기는 HTML 로 실린다. 태그를 걷고 엔티티를 되돌려야 <b>화면에 보이는</b> 길이가 된다 —
   "&amp;amp;" 는 다섯 글자로 저장되지만 화면에서는 한 글자다. */
const dec = s => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const plain = s => dec(String(s || "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

function load() {
  const out = [];
  for (const f of fs.readdirSync(path.join(ROOT, "data")).filter(x => /^t-.*\.js$/.test(x)).sort()) {
    const raw = fs.readFileSync(path.join(ROOT, "data", f), "utf8");
    const a = raw.indexOf("["), z = raw.lastIndexOf("]");
    let i = 0;
    const walk = o => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== "object") return;
      if (o.t === "review" && Array.isArray(o.items)) out.push({ track: f.replace(/^t-|\.js$/g, ""), i: i++, q: o });
      for (const k in o) walk(o[k]);
    };
    walk(JSON.parse(raw.slice(a, z + 1)));
  }
  return out;
}

/* 한 문항이 길이로 얼마나 새는지 */
function leak(q) {
  const it = q.items, w = it.map(x => width(plain(x.txt)));
  const mean = w.reduce((s, x) => s + x, 0) / w.length;
  let mx = 0;
  w.forEach((x, i) => { if (x > w[mx]) mx = i; });
  let ok = 0;
  it.forEach((x, i) => { if (!!x.bad === (w[i] > mean)) ok++; });
  return { longestBad: !!it[mx].bad, itemHit: ok, n: it.length, exact: ok === it.length };
}

function score(rows) {
  let items = 0, bad = 0, lgBad = 0, hit = 0, exact = 0, tailN = 0, tailBad = 0;
  const pos = {}, seen = {};
  rows.forEach(({ q }) => {
    const it = q.items, L = leak(q);
    items += it.length;
    bad += it.filter(x => x.bad).length;
    if (L.longestBad) lgBad++;
    hit += L.itemHit;
    if (L.exact) exact++;
    it.forEach((x, i) => {
      seen[i] = (seen[i] || 0) + 1;
      if (x.bad) pos[i] = (pos[i] || 0) + 1;
      if (/(해야 한다|바꿔야 한다|써야 한다|한다\.?)$/.test(plain(x.txt))) { tailN++; if (x.bad) tailBad++; }
    });
  });
  const n = rows.length || 1;
  const rate = Object.keys(seen).map(k => (pos[k] || 0) / seen[k]);
  return {
    n, base: bad / items, longest: lgBad / n, itemHit: hit / items, exact: exact / n,
    tail: tailN ? tailBad / tailN : 0, tailN,
    posWorst: Math.max.apply(null, rate), posBest: Math.min.apply(null, rate), rate,
  };
}

const rows = load();
const pct = x => (x * 100).toFixed(1) + "%";

if (process.argv.includes("--list")) {
  const want = process.argv[process.argv.indexOf("--list") + 1];
  rows.filter(r => !want || r.track === want).forEach(({ track, i, q }) => {
    const L = leak(q);
    if (!L.exact && !L.longestBad) return;
    console.log(track + " #" + i + "  " + (L.exact ? "[길이만으로 전부 맞힘] " : "") + (L.longestBad ? "[가장 긴 보기가 결함]" : ""));
    q.items.forEach((x, j) => console.log("  " + (x.bad ? "*" : " ") + j + " (" + width(plain(x.txt)) + ") " + plain(x.txt)));
  });
  process.exit(0);
}

/* --need <트랙> : 고쳐야 할 문항마다 <b>한 줄</b>만 찍는다.
   "가장 긴 정상 보기를 결함보다 길게" 만들면 되므로, 그 보기와 모자란 폭을 알려 준다. */
if (process.argv.includes("--need")) {
  const want = process.argv[process.argv.indexOf("--need") + 1];
  rows.filter(r => !want || r.track === want).forEach(({ track, i, q }) => {
    const it = q.items;
    let mx = 0;
    it.forEach((x, j) => { if (width(plain(x.txt)) > width(plain(it[mx].txt))) mx = j; });
    if (!it[mx].bad) return;                       // 이미 정상 보기가 가장 길다
    let d = -1;
    it.forEach((x, j) => { if (!x.bad && (d < 0 || width(plain(x.txt)) > width(plain(it[d].txt)))) d = j; });
    if (d < 0) return;
    const need = width(plain(it[mx].txt)) - width(plain(it[d].txt)) + 4;
    console.log(track + " #" + i + "  결함 " + width(plain(it[mx].txt)) + " · " + d + "번 정상 "
      + width(plain(it[d].txt)) + " (+" + need + " 필요)  " + plain(it[d].txt));
  });
  process.exit(0);
}

/* --up <트랙> : 반대 방향으로 치우친 것을 되돌린다.
   '가장 긴 보기는 결함이 아니다' 도 규칙이 되므로, 기준선(40%) 근처까지는 결함이 가장 긴
   문항도 있어야 한다. 결함 쪽을 조금만 늘리면 되는 문항을 골라 준다.
   세 번째마다 하나씩만 고른다 — 전부 뒤집으면 처음 상태로 돌아간다. */
if (process.argv.includes("--up")) {
  const want = process.argv[process.argv.indexOf("--up") + 1];
  let k = 0;
  rows.filter(r => !want || r.track === want).forEach(({ track, i, q }) => {
    const it = q.items;
    let mx = 0;
    it.forEach((x, j) => { if (width(plain(x.txt)) > width(plain(it[mx].txt))) mx = j; });
    if (it[mx].bad) return;                        // 이미 결함이 가장 길다
    if (k++ % 3) return;                           // 셋에 하나만
    let d = -1;
    it.forEach((x, j) => { if (x.bad && (d < 0 || width(plain(x.txt)) > width(plain(it[d].txt)))) d = j; });
    if (d < 0) return;
    const need = width(plain(it[mx].txt)) - width(plain(it[d].txt)) + 4;
    console.log(track + " #" + i + "  정상 " + width(plain(it[mx].txt)) + " · " + d + "번 결함 "
      + width(plain(it[d].txt)) + " (+" + need + " 필요)  " + plain(it[d].txt));
  });
  process.exit(0);
}

if (process.argv.includes("--track")) {
  const by = {};
  rows.forEach(r => (by[r.track] = by[r.track] || []).push(r));
  console.log("트랙".padEnd(12) + "n".padStart(4) + "  기준선   가장 긴 보기  평균초과 적중  완전 적중  처방형");
  Object.entries(by).sort((a, b) => score(b[1]).exact - score(a[1]).exact).forEach(([t, rs]) => {
    const s = score(rs);
    console.log(t.padEnd(12) + String(s.n).padStart(4) + pct(s.base).padStart(8)
      + pct(s.longest).padStart(13) + pct(s.itemHit).padStart(14) + pct(s.exact).padStart(11) + pct(s.tail).padStart(9));
  });
  console.log();
}

const s = score(rows);
console.log("리뷰 " + s.n + "문항 · 아무 보기나 결함이라 찍으면 " + pct(s.base));
console.log("  " + (s.longest > s.base + 0.25 ? "✗" : "·") + " 가장 긴 보기가 결함    " + pct(s.longest).padStart(7));
console.log("  " + (s.exact > 0.15 ? "✗" : "·") + " 길이만으로 문항 완주   " + pct(s.exact).padStart(7)
  + "   (보기 적중 " + pct(s.itemHit) + ")");
console.log("  " + (s.tail > 0.8 ? "✗" : "·") + " 처방형 말투가 결함     " + pct(s.tail).padStart(7) + "   (" + s.tailN + "개)");
console.log("  " + (s.posWorst - s.base > 0.06 ? "✗" : "·") + " 자리별 최고            " + pct(s.posWorst).padStart(7)
  + "   " + s.rate.map(pct).join(" "));

const over = [];
if (s.longest > s.base + 0.25) over.push("가장 긴 보기");
if (s.exact > 0.15) over.push("길이만으로 문항 완주");
if (s.tail > 0.8) over.push("처방형 말투");
if (s.posWorst - s.base > 0.06) over.push("자리");
if (over.length) console.log("\n갚아야 할 빚: " + over.join(" · "));
process.exit(over.length ? 1 : 0);
