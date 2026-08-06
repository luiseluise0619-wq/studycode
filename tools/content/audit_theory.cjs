/* 이론이 초보자에게 읽히는가 — 짐작하지 않고 잰다.

   재는 것 네 가지. 전부 '초보자가 걸려 넘어지는' 자리다.
     긴 문장    90자를 넘으면 한 번에 못 읽는다. 읽다가 앞을 잊는다.
     설명 없는 용어  '스코프', '참조', '인스턴스' 같은 말을 풀지 않고 쓰면
                     아는 사람만 아는 글이 된다.
     개념 뭉치  한 문단에서 서로 다른 것을 셋 이상 다루면 무엇이 핵심인지 흐려진다.
     왜가 없음  '이렇게 한다' 만 있고 '안 그러면 어떻게 되는가' 가 없으면 외울 것만 남는다.

   점수가 높을수록 어렵다. 완벽한 잣대는 아니고, 손볼 데를 찾는 도구다.

     node tools/content/audit_theory.cjs            트랙별 요약
     node tools/content/audit_theory.cjs <트랙>     그 트랙에서 어려운 레슨
     node tools/content/audit_theory.cjs --first    각 트랙 맨 앞 유닛만 (초보자가 처음 만나는 곳) */
const fs = require("fs");
const path = require("path");
const DATA = path.join(path.resolve(__dirname, "..", ".."), "data");

/* 초보자에게 설명 없이 쓰면 막히는 말들. 같은 문단 안에서 풀어 주면 괜찮다. */
const JARGON = ["스코프", "참조", "인스턴스", "리터럴", "역참조", "직렬화", "동기", "비동기",
  "블로킹", "오버헤드", "런타임", "컴파일", "바인딩", "캡슐화", "다형성", "추상화", "재귀",
  "이터러블", "이터레이터", "제너레이터", "클로저", "뮤터블", "불변", "해시", "포인터",
  "메모리", "스택", "힙", "네임스페이스", "프로토타입", "폴리필", "트랜스파일"];
/* 바로 뒤에 이런 말이 오면 풀어 준 것으로 본다 */
const EXPLAINED = /(이란|이라는|이라고|란 |는 것|는 뜻|말한다|의미한다|다시 말해|즉 |—|:)/;

function load(f) {
  const s = fs.readFileSync(path.join(DATA, f), "utf8");
  return JSON.parse(s.slice(s.indexOf(",", s.indexOf("(")) + 1, s.lastIndexOf(")")));
}

/* 한국어 문장은 마침표만으로 잘 안 잘린다. '다.' 로도 끊는다. */
const sentences = t => String(t).split(/(?<=다\.)\s+|(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);

function score(th) {
  if (!th) return null;
  const paras = [{ h: "", t: th.sum || "" }].concat(th.body || []);
  let long = 0, jargon = [], cram = 0, why = false, chars = 0;

  paras.forEach(p => {
    const t = String(p.t || "");
    chars += t.length;
    sentences(t).forEach(s => { if (s.length > 90) long++; });
    /* 한 문단에서 서로 다른 코드 조각을 셋 이상 다루면 뭉쳐 있는 것으로 본다 */
    const codes = new Set((t.match(/`[^`]+`/g) || []).map(x => x.toLowerCase()));
    if (codes.size >= 4) cram++;
    JARGON.forEach(w => {
      const i = t.indexOf(w);
      if (i < 0) return;
      const after = t.slice(i + w.length, i + w.length + 24);
      if (!EXPLAINED.test(after)) jargon.push(w);
    });
    /* '왜' 를 말하는 신호 — 안 그러면 어떻게 되는지, 무엇이 문제인지 */
    /* 결과를 말하는 신호. 표현이 다양해서 넓게 잡는다 — 좁게 잡으면
       멀쩡히 '안 그러면 이렇게 된다' 를 적어 둔 글을 놓친다. */
    if (/(안 그러면|그러지 않으면|않으면|빠뜨리면|잊으면|없으면|모르면|틀리|헷갈|헤맨|생략하면|빼면|오류가 난다|사고|터진|망가|사라진|어긋난|이상하게|그래서|때문|이유|못 |안 나온|안 된다|버린다|거부한다|멈춘다|찾을 수 없다|다르면)/.test(t)) why = true;
  });

  const uniqJargon = [...new Set(jargon)];
  return {
    chars, long, cram, why,
    jargon: uniqJargon,
    /* 긴 문장 3점, 설명 없는 용어 2점, 뭉친 문단 2점, 왜가 없으면 3점 */
    score: long * 3 + uniqJargon.length * 2 + cram * 2 + (why ? 0 : 3),
  };
}

const tracks = fs.readdirSync(DATA).filter(f => /^t-.*\.js$/.test(f)).map(f => f.slice(2, -3)).sort();
const arg = process.argv[2];

function collect(track, firstOnly) {
  let d; try { d = load("t-" + track + ".js"); } catch (e) { return []; }
  const out = [];
  (d || []).forEach((u, ui) => {
    if (firstOnly && ui > 0) return;
    (u.l || []).forEach(l => {
      const s = score(l.th);
      if (s) out.push({ track, unit: u.t, lesson: l.t, ui, ...s });
    });
  });
  return out;
}

if (arg === "--first") {
  const rows = tracks.flatMap(t => collect(t, true)).sort((a, b) => b.score - a.score);
  console.log("각 트랙의 첫 유닛 — 초보자가 처음 만나는 이론\n");
  console.log("점수  긴문장 뭉침 왜  트랙        레슨");
  console.log("─".repeat(74));
  rows.forEach(r => console.log(
    String(r.score).padStart(4) + String(r.long).padStart(6) + String(r.cram).padStart(5)
    + (r.why ? "  o" : "  x") + "  " + r.track.padEnd(11) + r.lesson.slice(0, 30)
    + (r.jargon.length ? "  [" + r.jargon.slice(0, 3).join(",") + "]" : "")));
  process.exit(0);
}

if (arg) {
  const rows = collect(arg).sort((a, b) => b.score - a.score).slice(0, 20);
  console.log(arg + " — 손볼 순서 (점수 높은 것부터)\n");
  rows.forEach(r => console.log(String(r.score).padStart(4) + "  " + r.unit.slice(0, 22).padEnd(23)
    + r.lesson.slice(0, 26).padEnd(27)
    + "긴문장 " + r.long + " · 뭉침 " + r.cram + " · 왜 " + (r.why ? "o" : "x")
    + (r.jargon.length ? " · 용어 " + r.jargon.slice(0, 3).join(",") : "")));
  process.exit(0);
}

console.log("트랙        레슨   평균점수  긴문장  설명없는용어  왜가없는레슨");
console.log("─".repeat(66));
let all = [];
tracks.forEach(t => {
  const rows = collect(t);
  if (!rows.length) return;
  all = all.concat(rows);
  const avg = rows.reduce((a, r) => a + r.score, 0) / rows.length;
  console.log(t.padEnd(11) + String(rows.length).padStart(5) + avg.toFixed(1).padStart(9)
    + String(rows.reduce((a, r) => a + r.long, 0)).padStart(8)
    + String(rows.reduce((a, r) => a + r.jargon.length, 0)).padStart(13)
    + String(rows.filter(r => !r.why).length).padStart(13));
});
console.log("─".repeat(66));
console.log("전체 레슨 " + all.length + " · 평균 " + (all.reduce((a, r) => a + r.score, 0) / all.length).toFixed(1)
  + " · '왜' 가 없는 레슨 " + all.filter(r => !r.why).length
  + " (" + Math.round(all.filter(r => !r.why).length / all.length * 100) + "%)");
