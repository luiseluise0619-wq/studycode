/* 재생 뷰어가 쓸 JavaScript 예제 트레이스를 만든다.

   미리 만들어 두는 이유는 SQL 과 같다 — 예제 하나 보려고 243KB 짜리 파서를
   먼저 받게 하면 아무도 안 본다. '내 코드로 해보기' 를 눌렀을 때만 받는다.

   예제는 '자바스크립트에서만 유난히 자주 틀리는 곳' 으로 골랐다.
   파이썬 예제와 겹치는 것은 별칭 하나뿐이고, 그건 두 언어에 같은 오해가 있어서다.

     node tools/tracer/make_demo_js.cjs */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const acorn = require("/opt/node22/lib/node_modules/eslint/node_modules/acorn/dist/acorn.js");
const { traceJs } = require("./jstrace.js");
const { check } = require("./schema.cjs");

const DEMOS = [
  {
    id: "alias",
    title: "복사한 줄 알았는데 같이 바뀐다",
    hint: "b = a 는 복사가 아닙니다. b 를 바꿨는데 a 도 바뀌는 단계를 찾아보세요.",
    src: "let a = [1, 2, 3];\nlet b = a;\nb.push(4);\nconsole.log(a);\nconsole.log(b);",
  },
  {
    id: "var",
    title: "var 로 만든 i 가 반복 끝 값이 되는 이유",
    hint: "함수 세 개가 모두 같은 i 를 봅니다. i 가 어떤 값들을 거치는지 세어 보세요.",
    src: "var fns = [];\nfor (var i = 0; i < 3; i++) {\n  fns.push(function () { return i; });\n}\n"
       + "console.log(fns[0](), fns[1](), fns[2]());",
  },
  {
    id: "let",
    title: "let 으로 바꾸면 달라지는 것",
    hint: "위 예제와 var 하나만 다릅니다. 결과가 왜 달라지는지 단계를 비교해 보세요.",
    src: "let fns = [];\nfor (let i = 0; i < 3; i++) {\n  fns.push(function () { return i; });\n}\n"
       + "console.log(fns[0](), fns[1](), fns[2]());",
  },
  {
    id: "undef",
    title: "undefined 와 null 은 다르다",
    hint: "선언만 한 것, 비워 둔 것, 없는 열쇠를 꺼낸 것 — 셋이 어떻게 다른지 보세요.",
    src: "let a;\nlet b = null;\nlet o = { x: 1 };\nlet c = o.y;\n"
       + "console.log(a, b, c);\nconsole.log(a == b, a === b);",
  },
  {
    id: "nan",
    title: "숫자가 아닌 숫자, NaN",
    hint: "문자열에 숫자를 더하면 붙고, 빼면 계산합니다. 어디서 NaN 이 되는지 보세요.",
    src: "let n = Number('열');\nlet s = '3' + 1;\nlet t = '3' - 1;\n"
       + "console.log(n, s, t);\nconsole.log(n === n);",
  },
  {
    id: "scope",
    title: "함수 안에서 바꾼 값이 왜 밖에 안 보이나",
    hint: "호출할 때 깊이가 1 로 들어갔다가 돌아옵니다. 안쪽 n 과 바깥 n 은 다른 상자입니다.",
    src: "function bump(n) {\n  n = n + 1;\n  return n;\n}\n\nlet n = 5;\nbump(n);\nconsole.log(n);",
  },
];

const out = [];
let bad = 0;
DEMOS.forEach(d => {
  const env = traceJs(d.src, { acorn, runId: "demo-js-" + d.id, now: 1 });
  env.ctx = { demo: d.id };
  const errs = check(env);
  if (errs.length) { bad++; console.log("  ✗ " + d.id + " — " + errs.slice(0, 2).join(" / ")); }
  if (env.err) { bad++; console.log("  ✗ " + d.id + " — 실행 오류: " + env.err.type + " " + env.err.msg); }
  console.log("  " + d.id.padEnd(7) + "단계 " + String(env.steps).padStart(3)
    + " · 출력 " + JSON.stringify(env.out.replace(/\n$/, "")));
  out.push({ id: d.id, title: d.title, hint: d.hint, env: env });
});
if (bad) { console.log("\n" + bad + "건 문제 — 쓰지 않는다"); process.exit(1); }

const body = JSON.stringify(out);
fs.writeFileSync(path.join(ROOT, "data", "trace-demo-js.js"),
  "/* 자동 생성 — tools/tracer/make_demo_js.cjs 를 돌려 만든다.\n"
  + "   acorn(243KB)을 받지 않고도 JS 재생 예제를 보여 주기 위한 것이다. */\n"
  + "__CR('traceDemoJs', " + body + ");\n");
console.log("\ndata/trace-demo-js.js · " + Math.round(Buffer.byteLength(body) / 1024) + "KB");
