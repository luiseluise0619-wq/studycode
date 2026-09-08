/* 선택형 보기에 붙은 <b>말장식</b>을 찾아 걷어낸다.

     node depad.cjs              # 몇 개인지, 어떻게 잘리는지 (미리보기, 안 고침)
     node depad.cjs --review     # 잘라 낸 결과가 문장인 것들만 (사람이 볼 목록)
     node depad.cjs --apply      # 실제로 고친다

   무엇을 찾는가 — 길이 편향을 갚던 시절에 보기를 늘리려고 붙인 꼬리다.

     "데이터베이스라고 부르는 바로 그런 기술이라고 실제로 차근차근 정리할 수 있다"
     "O(log n)이라고 이 단원에서는 대체로 무리 없이 이해할 수 있다"

   앞의 뜻은 그대로 두고 뒤의 장식만 자른다. 자르고 나서 보기 네 개가 서로 다르고
   비어 있지 않아야만 고친다 — 하나라도 어긋나면 그 문항은 건드리지 않는다.

   길이로 찍는 것을 막자고 붙인 꼬리가 <b>한국어를 망가뜨렸다.</b> 지표는 맞았지만
   읽는 사람에게는 뜻이 없는 말이었다. 지표를 맞추는 것과 뜻이 맞는 것은 다르다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

/* 장식에만 쓰이는 말들 — 이것들로만 이루어진 꼬리를 자른다 */
const JUNK = [
  /* 여러 마디짜리 — 긴 것부터 적어야 먼저 걸린다 */
  "이 단원에서 다루는 범위와 실무에서 흔히 마주치는 상황을 함께 놓고 보면",
  "이 단원에서 다루는 범위와 실무에서 마주치는 상황을 함께 놓고 보면",
  "앞에서 짚은 내용과 지금 보고 있는 대목을 나란히 놓고 따져 보면",
  "문서에 적힌 내용과 실제로 돌려 본 결과를 나란히 견주어 보면",
  "여러 자료에서 공통으로 짚는 대목까지 더해서 보면",
  "여러 자료에서 공통으로 짚는 대목까지 더해서",
  "앞 단원에서 다룬 내용까지 함께 떠올려 가며 따져 보면",
  "실제 현장에서 자주 마주치는 꼴이라",
  "이 단원에서 다루는 범위 안에서는",
  "한 걸음 물러나 전체를 훑어보면",
  "흔히 마주치는 상황을 놓고 보면",
  "앞뒤를 나란히 놓고 따져 보면",
  "여러 자료를 놓고 보면",
  "지금 다루는 맥락에서는",
  "기본이 되는 내용이라",
  "문서와 견주어 보면",
  "차근차근 따져 보면",
  "앞뒤를 놓고 보면",
  "충분히 여기면 되고,", "그렇게 보면 되고,", "그렇게 할 수 있고,",
  "이 단원에서는", "경우에 따라서는", "처음 배울 때는", "엄밀히 따지면",
  "실무에서는", "있는 그대로", "비교적 자주", "되어 있고,",
  "한 번 더", "한 번에", "처음 보면", "그렇게", "보고,",
  /* 한 마디짜리 */
  "실제로", "늘", "흔히", "대체로", "꽤", "어느 정도는", "무리 없이",
  "차근차근", "곰곰이", "어렵지 않게", "충분히", "그대로", "바로", "분명히",
];
const J = JUNK.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const TAIL = "(?:설명할|정리할|이해할|말할|볼|할|짚을|따져 볼|읽을)\\s*수\\s*있다";
const MUST = "(?:짚어\\s*두어야|이해해야|정리해야|설명해야|보아야|봐야)\\s*한다";
/* 두 번째 꼬리 무리 — '…라고 봐도 된다', '…라고 알려져 있다', '…라고 적는 꼴' 같은 것.
   이쪽은 정답 보기에 더 자주 붙어 있어서, 걷어내면 '가장 긴 보기가 정답' 도 함께 준다. */
const SOFT = "(?:(?:봐도|보아도)\\s*(?:된다|괜찮다|무방하다)"
  + "|(?:보면|여기면|이해하면|생각하면|알아\\s*두면)\\s*된다"
  + "|(?:알아|새겨|기억해)\\s*두어야\\s*한다"
  + "|(?:알려져|되어|정리되어)\\s*있다|본다|여긴다"
  + "|(?:적는|쓰는|적어\\s*두는)\\s*(?:꼴|형태|표기|모양)"
  + "|(?:설명할|볼)\\s*수\\s*있는\\s*쪽)";
const MID = "(?:(?:" + J + ")|" + TAIL.replace("있다", "있고,") + "|" + MUST.replace("한다", "하고,") + ")";
const REST = "\\s+(?:" + MID + "\\s*)*(?:" + TAIL + "|" + MUST + "|" + SOFT + ")\\.?\\s*$";
/* 두 갈래다. 앞말이 문장이면 '…한다고' 처럼 <b>어미의 '다'</b>가 장식에 먹혀 있으므로
   '고' 만 자르고 '다' 를 남긴다. 앞말이 이름씨면 '…이라고' 를 통째로 자른다.
   이 구별을 안 하면 '…빠진다' 가 '…빠진' 이 되어 말이 끊긴다. */
const CUT_DA = new RegExp("고" + REST);           /* …다고 → …다 */
const CUT_RA = new RegExp("이?라고" + REST);      /* …이라고 → …   */
const isDa = new RegExp("다고" + REST);
/* 자르고 남는 앞쪽 장식 — "…라고 부르는 바로 그런 기술", "…라는 것" */
const POST = [
  /이?라고\s+(?:부르는|하는)\s+(?:바로\s+)?그(?:런)?(?:\s+\S+){0,2}$/,
  /이?라는\s+(?:것|뜻|대목|모양|말|쪽|경우|기술|형태|꼴|표기)$/,
  /이?라고\s+(?:부르는|하는)$/,
];

const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function depad(o) {
  let s = String(o);
  if (isDa.test(s)) s = s.replace(CUT_DA, "");
  else if (CUT_RA.test(s)) s = s.replace(CUT_RA, "");
  else return null;
  for (const r of POST) s = s.replace(r, "");
  s = s.replace(/[\s,·]+$/, "").trim();
  return s;
}

const mode = process.argv[2] || "";
const files = fs.readdirSync(ROOT + "/data").filter(x => /^t-.*\.js$/.test(x)).sort();
let seen = 0, fixed = 0, skipped = 0;
const review = [], skip = [];

for (const f of files) {
  const p = ROOT + "/data/" + f;
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  const arr = JSON.parse(raw.slice(a, z + 1));
  const track = f.slice(2, -3);
  let touched = 0;

  arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => {
    if (q.t !== "choice" || !Array.isArray(q.o)) return;
    const next = q.o.map(o => depad(o));
    if (!next.some(Boolean)) return;
    seen++;
    const out = q.o.map((o, i) => next[i] === null ? String(o) : next[i]);
    const bad = out.some(x => plain(x).length < 2) || new Set(out.map(plain)).size !== out.length;
    if (bad) { skipped++; skip.push(track + " | " + plain(q.q).slice(0, 50)); return; }
    out.forEach((x, i) => { if (next[i] !== null && /\s/.test(plain(x))) review.push(track + " | " + plain(x)); });
    if (mode === "--apply") { q.o = out; touched++; }
    fixed++;
  })));

  if (mode === "--apply" && touched) {
    const outRaw = raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1);
    const back = JSON.parse(outRaw.slice(outRaw.indexOf("["), outRaw.lastIndexOf("]") + 1));
    if (JSON.stringify(back) !== JSON.stringify(arr)) throw new Error(f + " 왕복 검증 실패");
    fs.writeFileSync(p, outRaw);
    console.log(track + " +" + touched);
  }
}

if (mode === "--review") { review.forEach(x => console.log(x)); }
console.log("\n장식이 붙은 문항 " + seen + " · 고칠 수 있는 것 " + fixed
  + " · 건드리지 않은 것 " + skipped + " · 자른 뒤 문장이 되는 보기 " + review.length);
if (skip.length) console.log("건드리지 않은 문항:\n  " + skip.slice(0, 20).join("\n  "));
if (!mode) console.log("\n실제로 고치려면 --apply");
