/* 보기 문장에서 '기계가 붙인 말' 의 찌꺼기를 걷어내고, 사람이 쓴 말만 남긴다.

     node natural.cjs              # 몇 개를 어떻게 고치는지 (미리보기)
     node natural.cjs --show       # 고치는 보기를 전부 보여 준다
     node natural.cjs --apply      # 실제로 고친다
     node natural.cjs --left       # 고친 뒤에도 남는 의심스러운 보기 (손으로 볼 목록)

   unpad.cjs 가 옛 글로 되돌린 뒤에도 남는 꼴이 세 가지다.

     1. 꼬리 — "…기 때문이라고 본다", "…해서 실무에서는 그렇게 볼 수 있다"
     2. 되풀이 — "타입 검사를 거친다. 타입 검사가 이뤄진다고 본다. 검사가 이뤄진다"
        (길이를 맞추려고 같은 말을 두세 번 적은 것)
     3. 이름씨 꼬리 — "…하는 대목", "…라는 자리", "…하는 꼴", "…방식 쪽"

   문장 단위로 다룬다. 꼬리를 자른 뒤 그 문장이 앞 문장의 되풀이면 문장째 버린다.
   고친 결과가 비거나 네 보기가 겹치면 그 문항은 건드리지 않는다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const plain = s => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/* 꼬리 앞에 끼어 있는 꾸밈말 — 몇 개가 이어져도 걷어낸다 */
const JUNKADV = "(?:실무에서는|경우에 따라서는|어느 정도는|자세히 따져 보면|문서와 견주어 보면|앞뒤를 놓고 보면|"
  + "여러 자료에서 공통으로 짚는 대목까지 더해 보면|이 단원에서 다루는 범위 안에서는|이 단원에서는|지금 다루는 맥락에서는|"
  + "비교적 자주|무리 없이|오래전부터|처음 배울 때는|한 걸음 물러나 전체를 훑어보면|엄밀히 따지면|한 번 더|"
  + "기본이 되는 내용이라 여러 자료에서 공통으로 다루는 대목까지 더해서|흔히 마주치는 상황을 놓고 보면|"
  + "처음 배울 때 특히 헷갈리는 대목이라 차근차근 따져 가며 살펴보면)";
/* 꼬리 바로 앞에서만 걷어내는 부사 — 문장 첫머리의 '실제로', '그대로' 는 뜻이 있으므로 건드리지 않는다 */
const ADV = "(?:" + JUNKADV.slice(3, -1) + "|그렇게|차근차근|대체로|흔히|꽤|늘|실제로|충분히|분명히|바로|그대로|있는 그대로)";
const ADVS = "(?:" + ADV + "\\s*)*";
/* '…다고 본다' 무리 */
const SAY = "(?:봐야 한다는 이야기가 된다|보아야 한다|봐야 한다|볼 수 있다|보면 된다|봐도 된다|봐도 무방하다|봐도 괜찮다|본다|여긴다|여겨진다|"
  + "알려져 있다|알려져 왔다|이해하면 된다|이해해야 한다|이해할 수 있다|정리할 수 있다|정리되어 있다|설명할 수 있다|말할 수 있다|할 수 있다|"
  + "볼 수 있는 것|보아도 된다|보아 두면 된다|짚어 두어야 한다|새겨 두어야 한다|알아 두어야 한다|알아 두면 된다|정리해 두면 된다|이해하면 되고|볼 수 있고|함|봄|되어 있다)";
/* '…해서 그렇다' 무리 */
const SO = "(?:그렇다|그런 것이다|그렇게 볼 수 있다|그렇게 되는 것|그렇게 본다|그런 것이라고 볼 수 있다|그렇게 볼 수 있는 것|그런 것|그런 결과가 나온다|"
  + "그렇게 볼 수 있어서|그렇게 되어 있다|그렇게 정해져 있다)";

/* '…이라고' 를 자를 때 '이' 가 이음말인지 낱말의 일부인지 — 앞 음절에 받침이 있어야 이음말이다.
   '차이라고' 의 '이' 는 '차이' 의 것이므로 남긴다. */
const jong = ch => { const c = ch ? ch.charCodeAt(0) : 0; return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 !== 0 : /[lmnLMN013678)\]]$/.test(ch || "") ; };
function cutRago(s, re) {
  return s.replace(re, (m, ...a) => {
    const off = a[a.length - 2]; /* 짝의 위치 */
    if (!m.startsWith("이라고")) return "";
    let i = off - 1; while (i > 0 && s[i] === " ") i--;
    return jong(s[i]) ? "" : "이";
  });
}
const R = [
  /* 1. 꼬리 */
  [new RegExp("다고\\s+" + ADVS + SAY + "\\.?$"), "다"],
  [new RegExp("이?라고\\s+" + ADVS + SAY + "\\.?$"), cutRago],
  [new RegExp("(해서|라서|아서|어서|워서|이어서|때문에|이므로|이라|이니까|니까|려고|하려고|두려고)\\s+" + ADVS + SO + "\\.?$"), (m, p) => p === "때문에" ? "때문" : p],
  [/다고\s+(실무에서는|경우에 따라서는)?\s*보고,\s.*$/, "다"],
  [new RegExp("^" + JUNKADV + "\\s+"), ""],
  [new RegExp("\\s+" + ADV + "\\s+" + SO + "\\.?$"), ""],
  [new RegExp("다고\\s+" + ADVS + "(봐도 무방하고|보면 되고|볼 수 있고|이해하면 되고|여기면 되고|보고),?\\s.*$"), "다"],
  [new RegExp("이?라고\\s+" + ADVS + "(봐도 무방하고|보면 되고|볼 수 있고|이해하면 되고|여기면 되고|보고),?\\s.*$"), cutRago],
  /* 2. 이름씨 꼬리 */
  [/다고\s+설명할 수 있는 (대목|쪽|자리|것)$/, "다"],
  [/이?라고\s+설명할 수 있는 (대목|쪽|자리|것)$/, cutRago],
  [/는 (자리|대목)$/, "는 것"],
  [/(이?라는|라는 그|이라는 그) (자리|꼴|모양|것|형태|표기)$/, ""],
  [/(는|은|한|된|되는|하는|ㄹ|을|일|올|줄) 꼴$/, "$1 것"],
  [/(?<![라다])(는|은|던) 뜻$/, "$1 것"],                 /* "공격을 받은 뜻" — '…라는 뜻' 은 남긴다 */
  [/(는|한) 그런 (방식|방법|것)$/, "$1 $2"],
  [/이다 처럼 적어 두는 코드 (형태|표현)(?: 하나(?:의 꼴)?)?(?: 처럼 적어 두는 코드 (?:형태|표현))?$/, ""],
  [/ 처럼 적어 두는 코드 (형태|표현)(?: 하나(?:의 꼴)?)?(?: 처럼 적어 두는 코드 (?:형태|표현))?$/, ""],
  [/그대로 (생긴|붕괴하는|보장하려고)/, "$1"],
  [/(\]|\)) 꼴$/, "$1"],
  [/(방식|방법|쪽) 쪽$/, "$1"],
  [/(려고 하|바꿔 보|되어 버리|해 보|보내 보|고르)는 쪽$/, "$1는 것"],
  /* 3. 낱말 장식 */
  [/그때그때 즉석에서/, "즉석에서"],
  [/서로 완전히 다 똑같/, "똑같"],
  [/완전히 다 똑같/, "똑같"],
  [/지금보다 (훨씬 )?(더 )?/, (m, a, b) => (a || "") + (b || "")],
  [/바로 그 (사본|방향|정답)/, "$1"],
  [/(처음부터 끝까지 )?계속 붙들고 있어야만 하기 때문/, "계속 붙들고 있어야 하기 때문"],
  [/이 단원에서 다루는 범위 안에서는 /, ""],
  [/이 단원에서는 /, ""],
  [/경우에 따라서는 /, ""],
  [/어느 정도는 /, ""],
  [/비교적 자주 /, ""],
  [/무리 없이 /, ""],
  [/,\s*$/, ""],
];

function fixSentence(s) {
  let before;
  do {
    before = s;
    for (const [re, to] of R) s = typeof to === "function" && to.length === 2 && to === cutRago ? cutRago(s, re) : s.replace(re, to);
    s = s.trim();
  } while (s !== before);
  return s;
}
const words = s => plain(s).replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(w => w.length >= 2);
function restates(sent, prev) {
  const w = words(sent); if (!w.length) return true;
  const have = new Set(prev.flatMap(words));
  return w.every(x => have.has(x) || [...have].some(h => h.includes(x) || x.includes(h)));
}

function natural(o) {
  let s = String(o);
  /* 마침표 뒤 띄어쓰기 · 마침표 없이 이어진 '그래서' */
  s = s.replace(/([가-힣])\.([가-힣])/g, "$1. $2");
  s = s.replace(/([가-힣](다|니다)) (그래서|그러면|그러므로|따라서|하지만|그런데) /g, "$1. $3 ");
  s = s.replace(/([가-힣]니다) (?!라고|라는|하고|고 |는 )([가-힣])/g, "$1. $2");
  s = s.replace(/((?:다|라)고 본다) ([가-힣])/g, "$1. $2");
  const parts = s.split(/(?<=[.!?])\s+/);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const hadDot = /[.!?]$/.test(parts[i]);
    const raw = parts[i].replace(/[.!?]$/, "");
    const fixed = fixSentence(raw);
    if (!fixed) continue;
    const changed = fixed !== raw;
    /* 고쳐진 문장이나 마지막 문장이 앞 문장의 되풀이면 버린다 */
    if (out.length && (changed || i === parts.length - 1) && restates(fixed, out)) continue;
    if (out.length && out.some(p => plain(p).replace(/[.!?]$/, "") === fixed)) continue;
    /* 꼬리를 자르고 이름씨 토막만 남은 뒷문장 — "정적 분석 도구." — 은 버린다 */
    if (out.length && changed && !/(다|음|기|것|점|때문|서|까)$/.test(fixed)) continue;
    out.push(fixed + (hadDot && (i < parts.length - 1 || parts.length > 1) ? "." : ""));
  }
  let r = out.join(" ").trim();
  if (out.length === 1) r = r.replace(/\.$/, "");
  /* 끝 마침표만 다른 것은 고친 것이 아니다 */
  if (r === String(o).replace(/\.\s*$/, "").trim()) return String(o);
  return r;
}

const mode = process.argv[2] || "";
const files = fs.readdirSync(ROOT + "/data").filter(x => /^t-.*\.js$/.test(x)).sort();
const LEFT = new RegExp("(다|라)고\\s+(" + ADV.slice(3, -1) + "\\s+)*(" + SAY.slice(3, -1) + ")$|"
  + "(" + SO.slice(3, -1) + "|는 자리|는 대목|는 꼴|라는 자리|라는 꼴)$|처음 배울 때|이 단원|여러 자료|견주어|나란히 놓고|무리 없이|이라고 함$|이라고 본다");
let seen = 0, fixedQ = 0, skipped = 0; const shown = [], left = [];

for (const f of files) {
  const p = ROOT + "/data/" + f;
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  const arr = JSON.parse(raw.slice(a, z + 1));
  const track = f.slice(2, -3);
  let touched = 0;
  arr.forEach(u => u.l.forEach(l => (l.q || []).forEach(q => {
    if (q.t !== "choice" || !Array.isArray(q.o)) return;
    const next = q.o.map(o => natural(o));
    const diff = next.some((x, i) => x !== String(q.o[i]));
    next.forEach((x, i) => { if (LEFT.test(plain(x))) left.push(track + (i === q.a ? " *" : "  ") + " | " + plain(x)); });
    if (!diff) return;
    seen++;
    const bad = next.some(x => plain(x).length < 1) || new Set(next.map(plain)).size !== next.length;
    if (bad) { skipped++; return; }
    next.forEach((x, i) => { if (x !== String(q.o[i]) && shown.length < 5000) shown.push(track + (i === q.a ? " *" : "  ") + " | " + plain(q.o[i]) + "\n      → " + plain(x)); });
    fixedQ++;
    if (mode === "--apply") { q.o = next; touched++; }
  })));
  if (mode === "--apply" && touched) {
    const outRaw = raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1);
    const back = JSON.parse(outRaw.slice(outRaw.indexOf("["), outRaw.lastIndexOf("]") + 1));
    if (JSON.stringify(back) !== JSON.stringify(arr)) throw new Error(f + " 왕복 검증 실패");
    fs.writeFileSync(p, outRaw);
    console.log(track + " +" + touched);
  }
}
if (mode === "--left") { left.forEach(x => console.log(x)); console.log("\n남는 보기 " + left.length); process.exit(0); }
(mode === "--show" ? shown : shown.slice(0, 60)).forEach(x => console.log(x));
console.log("\n고칠 문항 " + fixedQ + " · 건드리지 않는 문항 " + skipped + " · 남는 의심 보기 " + left.length);
if (!mode) console.log("실제로 고치려면 --apply");
