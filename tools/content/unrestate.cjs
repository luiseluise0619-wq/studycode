/* 보기 끝에 앞 문장을 되풀이하거나 토막말을 덧붙여 길이를 맞춘 흔적을 찾아 걷어낸다.

     "배열을 선언할 때의 크기를 그대로 돌려준다. 선언 크기를 쓴다"
     "측정이 잘못됐다 — 연산을 네 배 늘렸으면 시간도 네 배가 되어야 한다. 측정이 잘못됐다 — 연산을 네 배 늘렸으면 걸리는 시간도 네 배가 되어야 한다."

   둘째 문장부터가 앞 문장의 되풀이(글자 2-gram 겹침 55% 이상)이거나 8자 이하 토막이면
   첫 문장만 남긴다. 60차의 unpad·natural 이 잡지 못한 꼴이다 — 문장이 완전해서 문법으로는
   걸리지 않았다.

     node unrestate.cjs            # 목록
     node unrestate.cjs --apply    # 첫 문장만 남긴다

   걷어내면 오답이 짧아져 길이 편향이 드러난다. 그것이 참 숫자다 — 다시 채우지 말고
   fix_opts.cjs 로 내용 있는 오답을 새로 쓴다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const APPLY = process.argv.indexOf("--apply") >= 0;

const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/\s+/g, " ").trim();
const grams = s => {
  const w = s.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean);
  const g = new Set();
  for (const x of w) { g.add(x); if (x.length >= 2) for (let i = 0; i + 2 <= x.length; i++) g.add("~" + x.slice(i, i + 2)); }
  return g;
};
const overlap = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / Math.max(1, Math.min(a.size, b.size)); };
/* 문장 끝(…다. / …요. / …됨.) 뒤에서만 자른다 — "3.14" 나 "e.g." 에서 갈리지 않게 */
const SPLIT = /(?<=[다요음임됨])\.\s+|(?<=\))\.\s+/;

function padded(o) {
  const parts = plain(o).split(SPLIT).map(x => x.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  for (let a = 0; a < parts.length; a++) for (let b = a + 1; b < parts.length; b++)
    if (overlap(grams(parts[a]), grams(parts[b])) >= 0.55 || parts[b].length <= 8) return parts;
  return null;
}
/* 원문(태그 포함)에서 첫 문장까지만 남긴다 */
function firstSentence(o) {
  const s = String(o);
  const m = s.match(/^[\s\S]*?(?:[다요음임됨]|\))\./);
  return m ? m[0] : s;
}

module.exports = { padded, firstSentence };
if (require.main !== module) return;

let seen = 0, hit = 0, changedFiles = 0;
for (const f of fs.readdirSync(ROOT + "/data").filter(x => /^t-.*\.js$/.test(x)).sort()) {
  const p = ROOT + "/data/" + f, t = f.slice(2, -3);
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  const arr = JSON.parse(raw.slice(a, z + 1));
  let n = 0;
  arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => {
    if (!Array.isArray(q.o)) return;
    q.o.forEach((o, i) => {
      seen++;
      const parts = padded(o);
      if (!parts) return;
      hit++; n++;
      const keep = firstSentence(o);
      if (!APPLY) console.log(t + " | " + q.k + " | " + (i === q.a ? "정답" : "오답") + "\n    " + plain(o) + "\n  → " + plain(keep));
      else q.o[i] = keep;
    });
  })));
  if (APPLY && n) {
    /* 자른 뒤 보기가 겹치면 문항이 깨진다 — 그 트랙은 손대지 않고 알린다 */
    let clash = 0;
    /* 앱은 보기를 pre-wrap 으로 그리므로 "   42" 와 "42" 는 다른 보기다 — 글자 그대로 견준다(audit_all 과 같은 규칙) */
    arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => { if (Array.isArray(q.o) && new Set(q.o.map(String)).size !== q.o.length) clash++; })));
    if (clash) { console.log(t + ": 자르면 보기가 겹치는 문항 " + clash + "개 — 이 트랙은 건너뛴다"); continue; }
    const out = raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1);
    if (JSON.stringify(JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1))) !== JSON.stringify(arr)) throw new Error(t + ": 왕복 검증 실패");
    fs.writeFileSync(p, out);
    changedFiles++;
    console.log(t + ": 보기 " + n + "개를 첫 문장만 남겼다");
  }
}
console.log("\n보기 " + seen + "개 중 되풀이·토막 덧붙임 " + hit + "개" + (APPLY ? " · 고친 트랙 " + changedFiles : ""));
