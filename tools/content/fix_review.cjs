/* 이미 실린 코드 리뷰 문항의 <b>보기를 고쳐 쓴다</b>.

     node tools/content/fix_review.cjs ./fixrev_rust.cjs          # 미리보기
     node tools/content/fix_review.cjs ./fixrev_rust.cjs --write

   `ver_revguess.cjs` 가 찾아낸 빚 — '긴 보기가 곧 결함' — 을 갚기 위한 도구다.
   결함 보기에만 근거를 길게 쓰고 정상 보기는 짧은 승인문으로 둔 것이 원인이므로,
   고치는 방향은 <b>디스트랙터를 같은 밀도로 다시 쓰는 것</b>이다. 결함 쪽에서
   설명이 지나치게 길어진 곳은 함께 줄인다.

   패치 파일은 트랙 이름과 문항 번호(ver_revguess --list 가 찍는 번호)로 찍는다.

     module.exports = {
       rust: {
         1: { 0: "새 보기 문장",          // 0번 보기를 통째로 교체
              3: "+ 뒤에 덧붙일 말" },     // '+' 로 시작하면 이어 붙인다
       },
     };

   번호는 <b>파일 안에서 리뷰 문항이 나오는 차례</b>다. 문항을 새로 넣으면 밀리므로
   패치는 쓰고 나서 지운다 — 한 번 쓰는 도구다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const SRC = process.argv[2];
const WRITE = process.argv.includes("--write");
if (!SRC) { console.error("패치 파일을 인자로 주세요: node fix_review.cjs ./fixrev_rust.cjs"); process.exit(2); }
const PATCH = require(path.resolve(SRC));

const dec = s => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const plain = s => dec(String(s || "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

let touched = 0, lines = 0;
for (const track of Object.keys(PATCH)) {
  const p = path.join(ROOT, "data", "t-" + track + ".js");
  if (!fs.existsSync(p)) { console.error("트랙 파일이 없다: " + p); process.exit(1); }
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  const arr = JSON.parse(raw.slice(a, z + 1));

  const found = [];
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (o.t === "review" && Array.isArray(o.items)) found.push(o);
    for (const k in o) walk(o[k]);
  };
  walk(arr);

  for (const idx of Object.keys(PATCH[track])) {
    const q = found[+idx];
    if (!q) { console.error(track + " #" + idx + " 가 없다 (리뷰 문항 " + found.length + "개)"); process.exit(1); }
    const ops = PATCH[track][idx];
    for (const li of Object.keys(ops)) {
      if (li === "ex") { q.ex = ops.ex; lines++; continue; }
      const it = q.items[+li];
      if (!it) { console.error(track + " #" + idx + " 에 " + li + "번 보기가 없다"); process.exit(1); }
      const v = ops[li];
      const next = v.startsWith("+") ? it.txt + v.slice(1) : v;
      if (next === it.txt) { console.error(track + " #" + idx + " " + li + "번 보기가 그대로다"); process.exit(1); }
      it.txt = next;
      lines++;
    }
    /* 같은 문장이 두 개가 되면 채점이 불가능하다 */
    const seen = q.items.map(x => plain(x.txt));
    if (new Set(seen).size !== seen.length) { console.error(track + " #" + idx + " 에 같은 보기가 생겼다"); process.exit(1); }
    touched++;
  }
  if (WRITE) fs.writeFileSync(p, raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1));
}
console.log(touched + "문항 · " + lines + "보기" + (WRITE ? "  (썼다)" : "  (미리보기 — --write 를 주면 쓴다)"));
