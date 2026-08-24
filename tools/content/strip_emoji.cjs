/* 콘텐츠에서 장식용 이모지를 걷어낸다.

   해설이 "💡 개념: …", "🛠 실무: …", "🐛 원인: …" 처럼 이모지로 문단을 열고 있었다.
   낱말은 그대로 두고 <b>그림 문자만</b> 지운다 — "개념:", "실무:", "원인:" 이 남는다.

   남기는 것: 화살표(→ ← ↑ ↓ ↔), 동그라미 숫자(①②③), 체크·가위표(✓ ✗ ✕),
             바닥·천장 기호(⌊⌋), 도형(▶ ▮ □) — 뜻을 나르는 기호들이다.
   지우는 것: 그 밖의 그림 문자와 변이 선택자(U+FE0F).

   설계 문항의 <code>icon</code> 필드는 값이 이모지뿐이라 <b>필드째</b> 지운다
   (앱의 렌더러가 없으면 ▪ 를 쓴다).

   사용:  node strip_emoji.cjs                  # 데이터 미리보기
          node strip_emoji.cjs --write          # 데이터에 쓴다
          node strip_emoji.cjs --tools --write  # 배치 원본(tools/content/*.cjs)도 함께 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const WRITE = process.argv.includes("--write");

/* 뜻을 나르므로 남긴다 */
const KEEP = new Set([
  0x2190, 0x2191, 0x2192, 0x2193, 0x2194, 0x2195, 0x21D2, 0x21D4,   // 화살표
  0x2713, 0x2714, 0x2715, 0x2717, 0x2718,                           // 체크·가위표
  0x230A, 0x230B, 0x2308, 0x2309,                                   // 바닥·천장
  0x25A0, 0x25A1, 0x25AA, 0x25AB, 0x25AE, 0x25B2, 0x25B6, 0x25BC, 0x25C0, 0x25CB, 0x25CF,
  0x2026, 0x2022,                                                   // 말줄임·불릿
]);
for (let c = 0x2460; c <= 0x2473; c++) KEEP.add(c);
for (let c = 0x25A0; c <= 0x25FF; c++) KEEP.add(c);   // 도형 — 캐럿·불릿·재생 표시                 // ①~⑳
for (let c = 0x2500; c <= 0x257F; c++) KEEP.add(c);                 // 罫선

function isEmoji(cp) {
  if (KEEP.has(cp)) return false;
  if (cp === 0xFE0F || cp === 0xFE0E || cp === 0x200D) return true;  // 변이 선택자·접합자
  if (cp >= 0x1F000 && cp <= 0x1FAFF) return true;
  if (cp >= 0x2600 && cp <= 0x27BF) return true;
  if (cp >= 0x2B00 && cp <= 0x2BFF) return true;
  if (cp >= 0x2190 && cp <= 0x21FF) return false;
  if (cp >= 0x2300 && cp <= 0x23FF) return true;                     // ⌨ ⏱ …
  if (cp >= 0x1F1E6 && cp <= 0x1F1FF) return true;                   // 국기
  return false;
}

/* 이모지를 지운다. 코드의 들여쓰기를 건드리면 안 되므로 <b>지운 자리에 붙어 있던
   빈칸 하나만</b> 정리한다 — 줄 앞의 "💡 " 나 낱말 사이의 " 📈 " 같은 경우다. */
function strip(s) {
  /* 지운 자리 앞이 줄머리·따옴표·빈칸이면, 뒤따르던 빈칸 하나도 함께 지운다.
     배치 원본은 소스 코드라 문자열이 따옴표나 \n 로 시작한다 — 그 경우도 같이 본다.
     앞 두 글자만 따로 들고 있는다: 50만 자짜리 index.html 에서 out 을 매번 들여다보면
     길이에 제곱으로 느려진다. */
  const out = [];
  let removed = false, p1 = "", p2 = "";
  for (const ch of String(s)) {
    if (isEmoji(ch.codePointAt(0))) { removed = true; continue; }
    const head = out.length === 0 || p1 === "\n" || p1 === " "
      || p1 === '"' || p1 === "'" || p1 === "`" || p1 === "(" || p1 === "["
      || (p2 === "\\" && p1 === "n");
    if (removed && ch === " " && head) { removed = false; continue; }
    removed = false;
    out.push(ch); p2 = p1; p1 = ch;
  }
  return out.join("");
}

const has = s => [...String(s)].some(ch => isEmoji(ch.codePointAt(0)));

let files = 0, fields = 0, icons = 0;
for (const f of fs.readdirSync(path.join(ROOT, "data")).filter(x => /^t-.*\.js$/.test(x)).sort()) {
  const p = path.join(ROOT, "data", f);
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  const arr = JSON.parse(raw.slice(a, z + 1));
  let touched = false;
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (k === "icon" && typeof v === "string") { delete o[k]; icons++; touched = true; continue; }
      if (typeof v === "string") {
        let nv = v;
        /* 설계 문항의 src 는 JSON 문자열이다 — 안의 icon 키는 값이 이모지뿐이라 통째로 뺀다 */
        if (k === "src" && /"icon"\s*:/.test(nv)) {
          try {
            const d = JSON.parse(nv);
            const drop = x => { if (Array.isArray(x)) return x.forEach(drop);
              if (!x || typeof x !== "object") return;
              if ("icon" in x) { delete x.icon; icons++; }
              Object.values(x).forEach(drop); };
            drop(d);
            nv = JSON.stringify(d, null, 2);
          } catch (e) { /* JSON 이 아니면 그대로 둔다 */ }
        }
        if (nv !== v || has(nv)) { o[k] = strip(nv); fields++; touched = true; }
      } else walk(v);
    }
  };
  walk(arr);
  if (touched) {
    files++;
    if (WRITE) fs.writeFileSync(p, raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1));
  }
}
console.log("데이터 " + files + "개 파일 · 문자열 " + fields + "곳 · icon 필드 " + icons + "개 제거"
  + (WRITE ? "  (썼다)" : "  (미리보기 — --write 를 주면 쓴다)"));

/* 배치 원본도 함께 훑는다 — 다시 주입할 때 이모지가 되돌아오지 않게. */
if (process.argv.includes("--tools")) {
  const dir = path.join(ROOT, "tools", "content");
  let tf = 0, tc = 0;
  for (const f of fs.readdirSync(dir).filter(x => /\.(cjs|js)$/.test(x))) {
    if (f === "strip_emoji.cjs") continue;
    const p2 = path.join(dir, f);
    const src = fs.readFileSync(p2, "utf8");
    if (!has(src)) continue;
    const out = strip(src)
      .replace(/,\s*"icon"\s*:\s*""/g, "")
      .replace(/"icon"\s*:\s*""\s*,\s*/g, "")
      .replace(/,\s*icon\s*:\s*""/g, "")
      .replace(/icon\s*:\s*""\s*,\s*/g, "");
    tf++; tc += [...src].filter(ch => isEmoji(ch.codePointAt(0))).length;
    if (WRITE) fs.writeFileSync(p2, out);
  }
  console.log("배치 원본 " + tf + "개 파일 · 이모지 " + tc + "자" + (WRITE ? "  (썼다)" : "  (미리보기)"));
}

/* 앱 화면(index.html)의 아이콘도 함께 걷어낸다. 구조가 남는 자리(em·guide 값 등)는
   이 스크립트가 비우기만 하고, 렌더 코드는 사람이 함께 고쳐야 한다. */
if (process.argv.includes("--html")) {
  const p3 = path.join(ROOT, "index.html");
  const src = fs.readFileSync(p3, "utf8");
  const n = [...src].filter(ch => isEmoji(ch.codePointAt(0))).length;
  if (WRITE) fs.writeFileSync(p3, strip(src));
  console.log("index.html 이모지 " + n + "자" + (WRITE ? "  (썼다)" : "  (미리보기)"));
}
