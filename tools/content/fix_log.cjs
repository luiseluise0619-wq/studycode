/* 이미 실린 로그 문항의 <b>줄을 고쳐 쓴다</b>.

     node tools/content/fix_log.cjs ./fixlog_cpp.cjs          # 미리보기
     node tools/content/fix_log.cjs ./fixlog_cpp.cjs --write

   `ver_logguess.cjs` 가 찾아낸 빚 — '첫 WARN 이상' 과 '가장 긴 줄' — 을 갚기 위한
   도구다. 문항을 새로 쓰는 것이 아니라 <b>이미 있는 줄의 등급과 살을</b> 고친다.

   패치 파일은 트랙 이름과 문항 번호(ver_logguess --list 가 찍는 번호)로 찍는다.

     module.exports = {
       cpp: {
         0: { 3: "11:00:33 INFO  svc ...",         // 줄 통째로 교체
              5: "+, freed by realloc at store.cpp:88",     // '+' 로 시작하면 덧붙인다
              i3: "11:00:28 WARN  svc ..." },               // 3번 <b>앞에</b> 끼워 넣는다
       },
     };

   끼워 넣는 줄은 앞뒤 시각 사이의 시각을 직접 적는다 — 시간이 거꾸로 가면 안 된다.
   번호는 <b>끼워 넣기 전</b>의 번호이므로, 한 문항 안에서 여러 번 끼워도 서로 밀리지 않는다.

   번호는 <b>파일 안에서 로그 문항이 나오는 차례</b>다. 문항을 새로 넣으면 밀리므로
   패치는 쓰고 나서 지운다 — 이 파일들은 한 번 쓰는 도구다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const SRC = process.argv[2];
const WRITE = process.argv.includes("--write");
if (!SRC) { console.error("패치 파일을 인자로 주세요: node fix_log.cjs ./fixlog_cpp.cjs"); process.exit(2); }
const PATCH = require(path.resolve(SRC));

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
    if (o.t === "log" && Array.isArray(o.items)) found.push(o);
    for (const k in o) walk(o[k]);
  };
  walk(arr);

  for (const idx of Object.keys(PATCH[track])) {
    const q = found[+idx];
    if (!q) { console.error(track + " #" + idx + " 가 없다 (로그 문항 " + found.length + "개)"); process.exit(1); }
    const ops = PATCH[track][idx];
    const ins = [];
    for (const li of Object.keys(ops)) {
      if (li === "ex") { q.ex = ops.ex; lines++; continue; }
      if (li === "bad") continue;
      if (/^i\d+$/.test(li)) { ins.push([+li.slice(1), ops[li]]); continue; }
      const it = q.items[+li];
      if (!it) { console.error(track + " #" + idx + " 에 " + li + "번 줄이 없다"); process.exit(1); }
      const v = ops[li];
      const next = v.startsWith("+") ? it.txt + v.slice(1) : v;
      if (next === it.txt) { console.error(track + " #" + idx + " " + li + "번 줄이 그대로다"); process.exit(1); }
      it.txt = next;
      lines++;
    }
    /* 두 줄의 내용을 맞바꾸면 원인 표시도 함께 옮겨야 한다 */
    if ("bad" in ops) {
      const want = new Set([].concat(ops.bad));
      q.items.forEach((x, j) => { if (want.has(j)) x.bad = true; else delete x.bad; });
      lines++;
    }
    /* 뒤에서부터 끼워야 앞 번호가 밀리지 않는다 */
    ins.sort((a, b) => b[0] - a[0]).forEach(([at, txt]) => { q.items.splice(at, 0, { txt: txt }); lines++; });
    if (q.items.length > 10) { console.error(track + " #" + idx + " 가 " + q.items.length + "줄이 됐다 — 10줄까지다"); process.exit(1); }
    const sec = s => { const m = String(s).match(/^(\d{2}):(\d{2}):(\d{2})/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null; };
    const ts = q.items.map(x => sec(x.txt));
    for (let j = 1; j < ts.length; j++)
      if (ts[j] === null || ts[j] < ts[j - 1]) { console.error(track + " #" + idx + " 시각이 거꾸로 간다: " + q.items[j].txt.slice(0, 40)); process.exit(1); }
    touched++;
  }
  if (WRITE) fs.writeFileSync(p, raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1));
}
console.log(touched + "문항 · " + lines + "줄" + (WRITE ? "  (썼다)" : "  (미리보기 — --write 를 주면 쓴다)"));
