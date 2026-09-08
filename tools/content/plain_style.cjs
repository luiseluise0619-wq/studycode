/* 이론(th) 글의 말투를 하나로 맞춘다 — '…합니다' 를 '…한다' 로.

     node plain_style.cjs             # 어떤 문장이 어떻게 바뀌는지 (미리보기, 서로 다른 꼴만)
     node plain_style.cjs --left      # 규칙이 못 바꾼 '…니다' 문장 (손으로 볼 목록)
     node plain_style.cjs --apply     # 실제로 고친다

   이론 2,928개 가운데 2,071개는 '…다' 로만 쓰였고 855개는 두 말투가 섞여 있다.
   같은 화면 안에서 '…입니다' 와 '…이다' 가 오가는 것이 글을 기계처럼 보이게 하는
   가장 큰 요인이라, 소수 쪽인 '…니다' 를 '…다' 로 옮긴다.

   높임 어미를 기본형으로 되돌리는 것은 사전 없이는 완전하지 않다. '적습니다' 는
   '적는다(쓰다)' 일 수도 '적다(少)' 일 수도 있다. 그래서 (1) 자주 나오는 어미는 표로,
   (2) 나머지는 형용사 목록을 보고 '…다' 냐 '…는다' 냐를 가른다. 표에도 목록에도
   없는 것은 바꾸지 않고 --left 로 남긴다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const L = 0xac00, CHO = 588, JUNG = 28;
const dec = ch => { const c = ch.charCodeAt(0) - L; return c < 0 || c > 11171 ? null : [Math.floor(c / CHO), Math.floor((c % CHO) / JUNG), c % JUNG]; };
const enc = (a, b, c) => String.fromCharCode(L + a * CHO + b * JUNG + c);
const hasJong = ch => { const d = dec(ch); return d ? d[2] !== 0 : /[lmnLMN013678)\]]/.test(ch); };

/* 형용사 줄기 — 받침 없는 것(ㅂ니다 로 붙음) 과 받침 있는 것(습니다 로 붙음) */
const ADJ_V = ["빠르", "다르", "느리", "이르", "흐리", "바쁘", "나쁘", "예쁘", "아프", "기쁘", "슬프", "고프", "크", "비싸", "싸", "희", "드물", "멀", "힘들", "낯설", "어떠", "게으르", "서투르", "무르", "이러", "그러", "저러"];
/* '이' 로 끝나는 동사 줄기 — 'X입니다' 가 '이다' 가 아니라 'X이+ㅂ니다' 인 것들 */
const VERB_I = ["보이", "쓰이", "모이", "붙이", "죽이", "줄이", "움직이", "쌓이", "먹이", "높이", "늘이", "들이", "놓이", "섞이", "속이", "녹이", "썩이", "꺾이", "깎이", "묶이", "덮이", "끓이", "꼬이", "기울이", "돌이", "벌이", "누이", "깨이", "헤아리", "매이", "짜이", "뜨이", "트이", "꾸미", "쏘이", "보태이", "잡히", "읽히", "먹히", "막히", "밟히", "씹히", "닫히", "묻히", "얽히", "걷히", "뽑히", "꽂히", "찍히", "박히"];
const ADJ_H = ["많", "적", "좋", "낮", "높", "같", "작", "짧", "맞", "없", "있", "싶", "괜찮", "늦", "비슷", "얕", "깊", "넓", "좁", "밝", "어둡", "쉽", "어렵", "가볍", "무겁", "굵", "얇", "두껍", "붉", "검", "젊", "옳", "그렇", "이렇", "저렇", "어떻", "낫", "싫", "굳", "뜨겁", "차갑", "춥", "덥", "맵", "짙", "옅", "곧", "험", "잦", "적잖", "않", "못", "익숙", "충분", "필요"];
/* '하다' 가 붙는 형용사 — X합니다 → X하다 (동사는 X한다) */
const ADJ_HA = ["필요", "충분", "안전", "정확", "중요", "가능", "불가능", "유효", "무효", "동일", "일정", "적절", "적합", "명확", "분명", "확실", "특별", "유리", "불리", "편리", "불편", "간단", "단순", "복잡", "흔", "드문", "비슷", "당연", "자연스러", "자유로", "위험", "무관", "유용", "무의미", "유의미", "불안정", "안정적", "정상적", "치명적", "효율적", "비효율적", "일반적", "대표적", "구체적", "부족", "풍부", "정상", "이상", "미묘", "완전", "불완전", "강력", "취약", "건강", "튼튼", "느슨", "엄격", "느긋", "급", "시급", "적당", "무난", "곤란", "흔하", "성급", "지루", "생생", "깔끔", "친절", "불친절", "정직", "솔직", "빈번", "희귀", "미숙", "능숙", "저렴", "비싸", "저조", "우수", "열악", "심각", "사소", "거대", "방대", "막대", "상당", "미미", "뚜렷", "모호", "애매", "엉뚱", "평범", "특이", "고유", "독특", "동등", "균등", "불균등", "공평", "공정", "타당", "합당", "부당", "무리",
  "막막", "답답", "든든", "뻔", "어색", "익숙", "조용", "깨끗", "편안", "불안", "잔잔", "촘촘", "빽빽", "두툼", "널찍", "부지런", "똑똑", "지저분", "산만",
  "명료", "난해", "용이", "유사", "상이", "무수", "허다", "미흡", "충실", "부실", "견고", "건재", "유익", "무익", "무해", "유해", "온전", "불충분", "불명확",
  "불확실", "불필요", "불안전", "부정확", "부적절", "부적합", "정갈", "가지런", "엉성", "허술", "치밀", "섬세", "단단", "말짱", "멀쩡", "번거로", "까다로", "새로", "해로", "이로", "외로", "괴로", "날카로", "부드러", "어지러", "두려", "무서", "두렵", "무섭", "귀찮", "심각", "저렴", "고가", "고급", "저급", "미세", "거대"];

const TABLE = {
  "입니다": null, /* 따로 다룬다 */
  "아닙니다": "아니다", "합니다": "한다", "됩니다": "된다", "있습니다": "있다", "없습니다": "없다",
  "않습니다": null, /* 앞말을 본다 */
  "못합니다": "못한다", "됐습니다": "됐다", "했습니다": "했다", "였습니다": "였다", "있었습니다": "있었다", "없었습니다": "없었다",
  "겠습니다": "겠다", "습니다만": null, "옵니다": "온다", "갑니다": "간다", "옮깁니다": "옮긴다",
  "빠릅니다": "빠르다", "다릅니다": "다르다", "느립니다": "느리다", "큽니다": "크다", "비쌉니다": "비싸다",
  "드뭅니다": "드물다", "힘듭니다": "힘들다", "낯섭니다": "낯설다", "낫습니다": "낫다",
  "담습니다": "담는다", "갖습니다": "갖는다", "맡습니다": "맡는다", "가깝습니다": "가깝다", "굳습니다": "굳는다", "안습니다": "안는다",
  "넘습니다": "넘는다", "집습니다": "집는다", "잊습니다": "잊는다", "잇습니다": "잇는다", "뒤엎습니다": "뒤엎는다", "속습니다": "속는다",
  "흩습니다": "흩는다", "삼습니다": "삼는다", "숨습니다": "숨는다", "얹습니다": "얹는다", "굶습니다": "굶는다", "다듬습니다": "다듬는다",
  "멎습니다": "멎는다", "뱉습니다": "뱉는다", "닮습니다": "닮는다", "참습니다": "참는다", "돕습니다": "돕는다", "감습니다": "감는다",
  "낡습니다": "낡는다", "삶습니다": "삶는다", "품습니다": "품는다", "쥡니다": "쥔다", "빕니다": "빈다", "꿉니다": "꾼다",
  "맞습니다": "맞다", "많습니다": "많다", "좋습니다": "좋다", "같습니다": "같다", "작습니다": "작다", "짧습니다": "짧다",
  "낮습니다": "낮다", "높습니다": "높다", "쉽습니다": "쉽다", "어렵습니다": "어렵다", "가볍습니다": "가볍다", "무겁습니다": "무겁다",
  "괜찮습니다": "괜찮다", "싶습니다": "싶다", "늦습니다": "늦다", "깊습니다": "깊다", "넓습니다": "넓다", "좁습니다": "좁다",
  "적습니다": null, /* 쓰다/少 — 앞말을 본다 */
  "읽습니다": "읽는다", "찾습니다": "찾는다", "남습니다": "남는다", "잡습니다": "잡는다", "받습니다": "받는다", "믿습니다": "믿는다",
  "죽습니다": "죽는다", "닫습니다": "닫는다", "먹습니다": "먹는다", "묶습니다": "묶는다", "막습니다": "막는다", "심습니다": "심는다",
  "씻습니다": "씻는다", "웃습니다": "웃는다", "앉습니다": "앉는다", "붙습니다": "붙는다", "걷습니다": "걷는다", "긁습니다": "긁는다",
  "쌓습니다": "쌓는다", "넣습니다": "넣는다", "놓습니다": "놓는다", "낳습니다": "낳는다", "끊습니다": "끊는다", "잃습니다": "잃는다",
  "얻습니다": "얻는다", "뽑습니다": "뽑는다", "접습니다": "접는다", "입습니다": "입는다", "줍습니다": "줍는다", "씹습니다": "씹는다",
  "굽습니다": "굽는다", "밟습니다": "밟는다", "볶습니다": "볶는다", "겪습니다": "겪는다", "꺾습니다": "꺾는다", "덮습니다": "덮는다",
  "짚습니다": "짚는다", "훑습니다": "훑는다", "좇습니다": "좇는다", "쫓습니다": "쫓는다", "쏟습니다": "쏟는다", "닿습니다": "닿는다",
  "듣습니다": "듣는다", "묻습니다": "묻는다", "싣습니다": "싣는다", "깎습니다": "깎는다", "꽂습니다": "꽂는다", "섞습니다": "섞는다",
  "박습니다": "박는다", "찍습니다": "찍는다", "익습니다": "익는다", "녹습니다": "녹는다", "썩습니다": "썩는다", "식습니다": "식는다",
  "맺습니다": "맺는다", "빚습니다": "빚는다", "솟습니다": "솟는다", "벗습니다": "벗는다", "빗습니다": "빗는다", "긋습니다": "긋는다",
  "짓습니다": "짓는다", "낚습니다": "낚는다", "엮습니다": "엮는다", "떠받칩니다": "떠받친다",
};

/* 닫는 태그·따옴표를 건너뛰고 마지막 진짜 글자를 찾는다 — "값</b>입니다" 의 '값' */
const lastChar = s => { const t = s.replace(/(<\/[a-z]+>|\*\*|['"”’)\]])+$/g, ""); return t[t.length - 1] || ""; };
/* '하다' 가 붙어도 동사인 것 — 형용사 목록의 꼬리와 겹치는 낱말 */
const VERB_HA = ["과적합", "과소적합", "적합화", "합산", "통합", "결합", "조합", "병합", "집합", "부합"];

/* 어절 끝에 붙는 것들 — 마침표·따옴표·닫는 태그·굵게 표시. "됩니다</b>." 의 "</b>." */
const TAIL = /((<\/[a-z]+>)|\*\*|[.!?)'"”’\]:;,])+$/;

/* 한 낱말(어절)의 끝을 바꾼다. 못 바꾸면 null.  prev 는 앞 어절(홀로 선 '입니다' 를 위해) */
function toPlain(w, prev) {
  const punct = (w.match(TAIL) || [""])[0];
  const core = punct ? w.slice(0, -punct.length) : w;
  let out = null;
  const entry = Object.keys(TABLE).sort((a, b) => b.length - a.length).find(k => core.endsWith(k));
  const bare = core.slice(0, -3).replace(/(\*\*|<\/[a-z]+>)+$/, ""); /* '안전**합니다', '필요</b>합니다' */
  if (core.endsWith("합니다") && !core.endsWith("못합니다") && !VERB_HA.some(v => bare.endsWith(v)) && ADJ_HA.some(a => bare.endsWith(a))) out = core.slice(0, -3) + "하다";
  else if (core.endsWith("입니다") && VERB_I.some(v => core.slice(0, -3).endsWith(v.slice(0, -1)))) out = core.slice(0, -3) + "인다";
  else if (entry && TABLE[entry]) out = core.slice(0, -entry.length) + TABLE[entry];
  else if (core.endsWith("입니다")) {
    const stem = core.slice(0, -3);
    const ch = stem ? lastChar(stem) : lastChar(prev || "");
    out = stem + (!ch || hasJong(ch) ? "이다" : "다");
  } else if (core.endsWith("않습니다") || core.endsWith("적습니다")) {
    /* '…지 않습니다' — 앞의 줄기가 형용사면 '않다', 동사면 '않는다'.  어절 하나로는 앞말을
       모를 때가 많아 호출자가 앞 어절을 붙여 준다. 여기서는 낱말만 본다. */
    return null;
  } else if (core.endsWith("합니다")) {
    const stem = core.slice(0, -3);
    out = stem + (ADJ_HA.some(a => stem.endsWith(a)) ? "하다" : "한다");
  } else if (core.endsWith("습니다")) {
    const stem = core.slice(0, -3);
    const last = stem[stem.length - 1];
    if (!last || !dec(last)) return null;
    const jg = dec(last)[2];
    if (jg === 20 || /(겠)$/.test(stem)) out = stem + "다"; /* ㅆ 받침 = 지난 일 */
    else if (ADJ_H.some(a => stem.endsWith(a)) || /(스럽|롭|답|겁|섭|쉽|엽)$/.test(stem)) out = stem + "다";
    else return null; /* 모르는 동사 — 표에 넣어야 한다 */
  } else if (core.endsWith("니다")) {
    /* ㅂ니다 — 앞 음절의 ㅂ 받침을 떼면 줄기다 */
    const stem0 = core.slice(0, -2);
    const d = dec(stem0[stem0.length - 1]);
    if (!d || d[2] !== 17) return null;
    const stem = stem0.slice(0, -1) + enc(d[0], d[1], 0);
    if (ADJ_V.some(a => stem.endsWith(a))) out = stem + "다";
    else out = stem0.slice(0, -1) + enc(d[0], d[1], 4) + "다"; /* ㄴ 받침 + 다 */
  }
  return out === null ? null : out + punct;
}

/* '…지 않습니다' — 앞 어절로 형용사/동사를 가른다 */
function toPlainPair(prev, w) {
  const punct = (w.match(TAIL) || [""])[0];
  const core = punct ? w.slice(0, -punct.length) : w;
  if (core.endsWith("않습니다")) {
    const stem = core.slice(0, -4) || prev; /* '않습니다' 만 있으면 앞 어절 */
    const adj = /지$/.test(stem) && (ADJ_H.concat(ADJ_V).some(a => stem.slice(0, -1).endsWith(a)) || ADJ_HA.some(a => stem.slice(0, -1).endsWith(a + "하")) || /(스럽|롭|답|같|없|있)지$/.test(stem));
    return core.slice(0, -4) + (adj ? "않다" : "않는다") + punct;
  }
  if (core.endsWith("적습니다")) {
    /* 목적어(을/를) 가 앞에 있으면 '적는다', 아니면 '적다' */
    const obj = /[을를]$/.test(prev) || /(직접|따로|같이|함께|다시|먼저)$/.test(prev);
    return core.slice(0, -4) + (obj ? "적는다" : "적다") + punct;
  }
  return null;
}

function convert(text, log) {
  const words = String(text).split(/(\s+)/);
  for (let i = 0; i < words.length; i++) {
    let w = words[i], rest = "";
    /* "않습니다**(shift" · "있습니다(복제" — 어미 뒤에 괄호가 바로 붙은 어절은 머리만 본다 */
    const split = w.match(/^(.*?[가-힣]니다(?:<\/[a-z]+>|\*\*|[.!?)'"”’\]:;,])*)([(（\-—].*)$/);
    if (split) { w = split[1]; rest = split[2]; }
    const m = w.match(/([가-힣])니다((<\/[a-z]+>)|\*\*|[.!?)'"”’\]:;,])*$/);
    if (!m) continue;
    const d = dec(m[1]); if (!d || d[2] !== 17) continue; /* ㅂ 받침 뒤의 '니다' 만 — '아니다' 는 아니다 */
    if (/^`/.test(w)) continue;
    let prev = ""; for (let j = i - 1; j >= 0; j--) if (words[j].trim()) { prev = words[j]; break; }
    const to = toPlainPair(prev, w) || toPlain(w, prev);
    if (to === null) { log.left.push(prev + " " + w); continue; }
    log.pairs.set(w, to);
    words[i] = to + rest;
  }
  return words.join("");
}

const argv = process.argv.slice(2);
const all = argv.indexOf("--all") >= 0;           /* 물음(q)과 해설(ex)까지 */
const mode = argv.find(x => x !== "--all") || "";
const files = fs.readdirSync(ROOT + "/data").filter(x => /^t-.*\.js$/.test(x)).sort();
const log = { pairs: new Map(), left: [] };
let lessons = 0, changed = 0, qs = 0;
for (const f of files) {
  const p = ROOT + "/data/" + f;
  const raw = fs.readFileSync(p, "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  const arr = JSON.parse(raw.slice(a, z + 1));
  let touched = 0;
  arr.forEach(u => u.l.forEach(l => {
    let hit = false;
    const fix = s => { if (typeof s !== "string") return s; const t = convert(s, log); if (t !== s) hit = true; return t; };
    const th = l.th;
    if (th) {
      th.sum = fix(th.sum);
      (th.body || []).forEach(b => { b.h = fix(b.h); b.t = fix(b.t); });
      if (th.code) th.code.cap = fix(th.code.cap);
      if (Array.isArray(th.key)) th.key = th.key.map(fix);
      lessons++; if (hit) { changed++; touched++; }
    }
    if (all) (l.q || []).forEach(q => {
      hit = false;
      q.q = fix(q.q);
      q.ex = fix(q.ex);
      if (Array.isArray(q.o)) q.o = q.o.map(o => typeof o === "string" ? fix(o) : o);
      if (hit) { qs++; touched++; }
    });
  }));
  if (mode === "--apply" && touched) {
    const outRaw = raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1);
    const back = JSON.parse(outRaw.slice(outRaw.indexOf("["), outRaw.lastIndexOf("]") + 1));
    if (JSON.stringify(back) !== JSON.stringify(arr)) throw new Error(f + " 왕복 검증 실패");
    fs.writeFileSync(p, outRaw);
    console.log(f.slice(2, -3) + " +" + touched);
  }
}
if (mode === "--left") {
  const c = new Map(); log.left.forEach(x => c.set(x, (c.get(x) || 0) + 1));
  [...c.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(String(n).padStart(4) + "  " + k));
  console.log("\n못 바꾼 어절 " + log.left.length + " (" + c.size + "가지)");
  process.exit(0);
}
if (!mode) [...log.pairs.entries()].sort().forEach(([a, b]) => console.log(a + " → " + b));
console.log("\n이론 " + lessons + " · 바뀌는 이론 " + changed + (all ? " · 바뀌는 문항(물음·해설) " + qs : "") + " · 서로 다른 어절 " + log.pairs.size + " · 못 바꾼 어절 " + log.left.length);
if (!mode) console.log("실제로 고치려면 --apply");
