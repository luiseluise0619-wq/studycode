/* 레슨의 이론(th)을 갈아 끼운다.

   왜 필요한가: 621개 유닛 중 574개(92%)가 레슨마다 이론이 똑같다. 이론이 레슨이
   아니라 유닛 단위로 붙어 있어서, '연산자' 레슨을 열면 '출력과 변수' 이론이 나온다.
   자기가 지금 배우는 것과 다른 글을 읽는 셈이다.

     node tools/content/inj_theory.cjs <spec.js>
     node tools/content/inj_theory.cjs <source.js> <트랙>

   spec: {track, source}  ·  source 는 [{unit, lesson, th}] 를 내보낸다.
   두 번째 형태는 여러 트랙을 한 파일에 담았을 때 쓴다 — 그때 source 는
   {트랙: [{unit, lesson, th}]} 꼴이고, 트랙 이름을 인자로 골라 준다.
   차수마다 트랙 수만큼 spec 파일을 만드는 것이 번거로워 이 길을 열었다.

   문항은 건드리지 않는다 — 이론만 바꾼다. 전부 성공해야 쓴다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const ARG = require(path.resolve(process.argv[2]));
const TRACK = process.argv[3];
const SPEC = TRACK ? { track: TRACK } : ARG;
const ITEMS = TRACK
  ? ARG[TRACK]
  : require(path.resolve(path.dirname(path.resolve(process.argv[2])), SPEC.source));
if (!Array.isArray(ITEMS)) throw new Error("이 파일에 '" + TRACK + "' 트랙이 없다");

const file = ROOT + "/data/t-" + SPEC.track + ".js";
const raw = fs.readFileSync(file, "utf8");
const a = raw.indexOf("["), z = raw.lastIndexOf("]");
const arr = JSON.parse(raw.slice(a, z + 1));

/* 먼저 전부 확인한다 — 하나라도 어긋나면 아무것도 쓰지 않는다 */
ITEMS.forEach(it => {
  const u = arr.find(x => x.t === it.unit);
  if (!u) throw new Error("없는 유닛: " + it.unit);
  const l = (u.l || []).find(x => x.t === it.lesson);
  if (!l) throw new Error("없는 레슨: " + it.unit + " / " + it.lesson);
  const th = it.th;
  if (!th || !th.sum || !Array.isArray(th.body) || !th.body.length || !th.code || !th.key)
    throw new Error(it.lesson + ": 이론 형식이 맞지 않는다");
  th.body.forEach(b => { if (!b.h || !b.t) throw new Error(it.lesson + ": 문단에 제목이나 본문이 없다"); });
  if (!th.code.c || !th.code.cap) throw new Error(it.lesson + ": 예제 코드나 설명이 없다");

  /* 초보자용으로 쓰는 것이 목적이므로, 그 기준을 여기서 지킨다 */
  const sents = [th.sum].concat(th.body.map(b => b.t)).join(" ")
    .split(/(?<=다\.)\s+|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const long = sents.filter(s => s.length > 90);
  if (long.length) throw new Error(it.lesson + ": 90자 넘는 문장 " + long.length + "개 — " + long[0].slice(0, 40) + "…");
  const all = [th.sum].concat(th.body.map(b => b.t)).join(" ");
  /* '안 그러면 어떻게 되는지' 가 있는지 본다. 처음 목록이 너무 좁아서, 실제로 결과를
     적어 둔 글 넷을 오탐으로 걸렀다 — '모르면', '틀리는', '오류가 난다' 를 놓쳤다.
     기준을 낮춘 게 아니라 같은 뜻의 표현을 더한 것이다. */
  if (!/(안 그러면|그러지 않으면|않으면|빠뜨리면|잊으면|없으면|모르면|틀리|헷갈|헤맨|생략하면|빼면|오류가 난다|사고|터진|망가|사라진|어긋난|이상하게|그래서|때문|이유|못 |안 나온|안 된다|버린다|거부한다|멈춘다|찾을 수 없다|다르면)/.test(all))
    throw new Error(it.lesson + ": '안 그러면 어떻게 되는지' 가 없다");
});

let n = 0;
ITEMS.forEach(it => {
  const u = arr.find(x => x.t === it.unit);
  const l = u.l.find(x => x.t === it.lesson);
  l.th = it.th;
  n++;
});

fs.writeFileSync(file, raw.slice(0, a) + JSON.stringify(arr) + raw.slice(z + 1));
console.log("t-" + SPEC.track + ".js · 이론 " + n + "개 레슨 교체");
