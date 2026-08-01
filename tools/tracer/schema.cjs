/* 트레이스 스키마 v1 검증기 — docs/TRACE_SCHEMA.md 가 규격이고 이 파일이 그 집행자다.
   새 언어 어댑터(SQL·JS·C++)는 반드시 여기를 통과해야 한다.
   통과하지 못하는 형태를 하나라도 허용하면 스키마가 고정된 것이 아니다.

   사용:  node schema.cjs <봉투.json>        파일 검사
          const {check} = require("./schema.cjs")   코드에서 검사 */

const V = 1;
const EVENTS = new Set(["step", "set", "del", "call", "ret", "throw", "out", "mem", "row", "dom"]);
const KINDS = new Set(["none", "bool", "int", "float", "str", "list", "tuple",
                       "set", "dict", "fn", "obj", "ref"]);
const LIMIT = { steps: 1000, str: 200, seq: 50, map: 30, brief: 80 };

/* 이벤트 종류마다 '반드시 있어야 하는 것' 과 '값이어야 하는 것' */
const NEED = {
  /* step 은 프레임 경계다. 줄·함수·깊이는 여기에만 있고 나머지 이벤트는 s 로 여기에 붙는다.
     변수가 안 바뀌는 줄도 step 은 나오므로 슬라이더에서 단계가 사라지지 않는다. */
  step:  { req: ["line", "fn", "d"], val: [] },
  set:   { req: ["name"],            val: ["from", "to"] },
  del:   { req: ["name"],            val: [] },
  call:  { req: ["name"],            val: [] },
  ret:   { req: [],                  val: ["to"] },
  throw: { req: ["name"], opt: ["msg"], val: [] },
  out:   { req: ["text"],            val: [] },
  mem:   { req: ["addr", "size"], opt: ["name"], val: ["to"] },
  /* row 은 표에서의 set 이다. UPDATE 를 '지우고 새로 넣기' 로 적으면 거짓말이 되므로
     set 과 같은 자리에 from 을 둔다 — 새 필드가 아니라 set 의 규칙을 그대로 쓴 것이다. */
  row:   { req: ["table", "op"],     val: ["from", "to"] },
  dom:   { req: ["sel", "op"],       val: ["to"] },
};

function checkValue(v, where, errs) {
  if (v === null || typeof v !== "object" || Array.isArray(v)) {
    errs.push(where + ": 값은 모양 태그를 가진 객체여야 한다 — 원시값을 그대로 넣지 않는다");
    return;
  }
  if (!KINDS.has(v.k)) { errs.push(where + ": 알 수 없는 모양 k=" + JSON.stringify(v.k)); return; }
  if (v.k === "none") return;
  if (v.k === "ref") { if (typeof v.id !== "number") errs.push(where + ": ref 는 id 가 필요하다"); return; }
  if (!("v" in v)) { errs.push(where + ": " + v.k + " 에 v 가 없다"); return; }
  if (v.k === "str") {
    if (typeof v.v !== "string") errs.push(where + ": str 의 v 는 문자열이어야 한다");
    else if (v.v.length > LIMIT.str) errs.push(where + ": 문자열이 상한 " + LIMIT.str + " 을 넘었다");
    if (typeof v.n !== "number") errs.push(where + ": str 은 원래 길이 n 이 필요하다");
  }
  if (v.k === "list" || v.k === "tuple" || v.k === "set") {
    if (!Array.isArray(v.v)) errs.push(where + ": " + v.k + " 의 v 는 배열이어야 한다");
    else {
      if (v.v.length > LIMIT.seq) errs.push(where + ": 원소가 상한 " + LIMIT.seq + " 을 넘었다");
      v.v.forEach((x, i) => { if (typeof x !== "string") errs.push(where + "[" + i + "]: 원소는 짧은 문자열 표현이어야 한다"); });
    }
    if (typeof v.n !== "number") errs.push(where + ": 원래 개수 n 이 필요하다");
  }
  if (v.k === "dict") {
    if (!Array.isArray(v.v)) errs.push(where + ": dict 의 v 는 [키,값] 쌍의 배열이어야 한다");
    else {
      if (v.v.length > LIMIT.map) errs.push(where + ": 쌍이 상한 " + LIMIT.map + " 을 넘었다");
      v.v.forEach((p, i) => {
        if (!Array.isArray(p) || p.length !== 2 || typeof p[0] !== "string" || typeof p[1] !== "string")
          errs.push(where + "[" + i + "]: [키,값] 두 문자열이어야 한다");
      });
    }
    if (typeof v.n !== "number") errs.push(where + ": 원래 개수 n 이 필요하다");
  }
}

function check(env) {
  const errs = [];
  const E = (m) => errs.push(m);

  if (!env || typeof env !== "object") return ["봉투가 객체가 아니다"];
  if (env.v !== V) E("스키마 버전이 " + V + " 이 아니다: " + env.v);
  ["run", "lang", "src"].forEach(k => { if (typeof env[k] !== "string" || !env[k]) E("봉투에 " + k + " 가 없다"); });
  if (typeof env.at !== "number") E("봉투에 at(실행 시각)이 없다");
  if (typeof env.ms !== "number") E("봉투에 ms 가 없다");
  if (typeof env.cut !== "boolean") E("봉투에 cut 이 없다 — 잘렸는지 조용히 비워 두지 않는다");
  if (typeof env.out !== "string") E("봉투에 out 이 없다");
  if (env.err !== null && env.err !== undefined) {
    const e = env.err;
    if (typeof e !== "object" || typeof e.type !== "string" || typeof e.line !== "number")
      E("err 은 {type, msg, line} 이어야 한다");
  }
  if (env.ctx !== null && env.ctx !== undefined && typeof env.ctx !== "object") E("ctx 는 객체이거나 없어야 한다");
  if (!Array.isArray(env.events)) return errs.concat("events 가 배열이 아니다");

  if (env.events.length > LIMIT.steps + 1)
    E("이벤트가 상한을 크게 넘었다: " + env.events.length);

  let lastS = -1, maxS = -1;
  env.events.forEach((ev, i) => {
    const at = "events[" + i + "]";
    if (typeof ev.s !== "number" || ev.s < 0) { E(at + ": 단계 번호 s 가 없다"); return; }
    if (ev.s < lastS) E(at + ": 단계 번호가 거꾸로 갔다 (" + lastS + " → " + ev.s + ")");
    if (!EVENTS.has(ev.e)) { E(at + ": 알 수 없는 이벤트 종류 e=" + JSON.stringify(ev.e) + " — 종류는 닫힌 집합이다"); return; }
    if (ev.e === "step") {
      if (ev.s !== maxS + 1) E(at + ": step 은 단계마다 정확히 하나여야 한다 (기대 s=" + (maxS + 1) + ", 실제 " + ev.s + ")");
      if (typeof ev.d === "number" && typeof ev.line === "number" && ev.d < 0) E(at + ": 깊이가 음수다");
    } else if (ev.s > maxS) {
      E(at + ": step 없이 새 단계가 시작됐다 — 모든 단계는 step 으로 연다");
    }
    lastS = ev.s; maxS = Math.max(maxS, ev.s);
    const spec = NEED[ev.e];
    spec.req.forEach(k => { if (!(k in ev)) E(at + ": " + ev.e + " 에 " + k + " 가 필요하다"); });
    spec.val.forEach(k => { if (k in ev) checkValue(ev[k], at + "." + k, errs); });
    if (ev.e === "call" && "args" in ev) {
      if (!Array.isArray(ev.args)) E(at + ": args 는 배열이어야 한다");
      else ev.args.forEach((a, j) => checkValue(a, at + ".args[" + j + "]", errs));
    }
    /* 알 수 없는 필드는 막는다 — 언어를 붙일 때 필드가 늘어나는 것을 여기서 차단한다 */
    const allowed = new Set(["s", "e", "args", "t"].concat(spec.req, spec.opt || [], spec.val));
    Object.keys(ev).forEach(k => {
      if (!allowed.has(k)) E(at + ": 스키마에 없는 필드 '" + k + "' — 언어 고유의 것은 이벤트 종류나 값의 모양으로 표현한다");
    });
  });

  if (typeof env.steps !== "number") E("봉투에 steps 가 없다");
  else if (env.events.length && env.steps !== maxS + 1)
    E("steps(" + env.steps + ") 가 마지막 단계+1(" + (maxS + 1) + ") 과 다르다");

  return errs;
}

module.exports = { check, V, EVENTS, KINDS, LIMIT };

if (require.main === module) {
  const f = process.argv[2];
  if (!f) { console.error("사용: node schema.cjs <봉투.json>"); process.exit(2); }
  const env = JSON.parse(require("fs").readFileSync(f, "utf8"));
  const errs = check(env);
  if (!errs.length) console.log("스키마 v" + V + " 통과 · 이벤트 " + env.events.length + "개");
  else { console.log(errs.length + "건 위반"); errs.slice(0, 40).forEach(e => console.log("  ✗ " + e)); }
  process.exit(errs.length ? 1 : 0);
}
