/* JS 추적기 검증 — 진짜 자바스크립트 엔진으로 확인한다.

   계측이 코드의 의미를 바꾸면 안 된다. 그래서 '결과가 원래와 같은가' 를 먼저 보고,
   그 다음에 '단계가 제대로 남는가' 를 본다. 순서가 반대면 조용히 틀린 걸 못 잡는다.

     node tools/tracer/test_jstrace.js */
const path = require("path");
const acorn = require(path.join("/opt/node22/lib/node_modules/eslint/node_modules/acorn/dist/acorn.js"));
const { traceJs, instrument } = require("./jstrace.js");
const { check } = require("./schema.cjs");

const FAIL = [];
function ok(cond, name, extra) {
  if (cond) console.log("  ✓ " + name);
  else { FAIL.push(name); console.log("  ✗ " + name + (extra !== undefined ? "  " + JSON.stringify(extra) : "")); }
}
const T = (src, o) => traceJs(src, Object.assign({ acorn, now: 1 }, o));
const ev = (r, k) => r.events.filter(e => e.e === k);
const steps = r => r.events.filter(e => e.e === "step");
const sets = r => ev(r, "set").map(e => [e.name, e.to.v]);

/* 계측한 코드와 원본이 같은 것을 출력하는지 — 의미가 바뀌지 않았다는 뜻.
   기준선의 join(' ') 은 객체를 [object Object] 로, null·undefined 를 빈칸으로 찍는다.
   그건 진짜 console.log 가 하는 일이 아니므로 여기 사례에는 원시값만 넣는다.
   표시 방식은 아래 '출력 표시' 에서 따로 못 박는다. */
function sameAsPlain(src) {
  let plain = "";
  const con = { log: function () { plain += Array.prototype.join.call(arguments, " ") + "\n"; } };
  try { new Function("console", src)(con); } catch (e) { plain = "throw:" + e.name; }
  const r = T(src);
  const got = r.err ? "throw:" + r.err.type : r.out;
  return [plain.replace(/\s+$/, ""), got.replace(/\s+$/, "")];
}

console.log("계측이 의미를 바꾸지 않는다");
[
  "let s=0; for(let i=0;i<5;i++){ s+=i; } console.log(s);",
  "const xs=[1,2,3].map(x=>x*2); console.log(xs.join(','));",
  "function f(n){ return n<2?1:n*f(n-1); } console.log(f(5));",
  "let o={a:1}; const {a}=o; console.log(a);",
  "let t=`줄1\n줄2`; console.log(t.length);",            // 템플릿 리터럴 안의 줄바꿈
  "console.log('세미콜론 없음')\nconsole.log('두 번째')",  // ASI
  "let i=0; while(i<3) i++; console.log(i);",             // 중괄호 없는 본문
  "if(true) console.log('yes'); else console.log('no');",
  "for(const c of 'ab') console.log(c);",
  "try{ null.x }catch(e){ console.log('잡힘'); }",
  "let a=1; { let a=2; console.log(a); } console.log(a);", // 블록 스코프 가림
  "console.log('a', 1, true, 'b'.repeat(3));",
  "console.log(0.1+0.2);",
  "console.log([1,2,3].length, 'abc'.toUpperCase());",
].forEach((src, i) => {
  const [want, got] = sameAsPlain(src);
  ok(want === got, "사례 " + i + " 결과가 원본과 같다", { want, got });
});

console.log("\n기본");
let r = T("let x = 10;\nlet y = x + 5;\nconsole.log(y);");
ok(r.err === null, "오류 없이 끝난다", r.err);
ok(r.lang === "javascript" && r.v === 1, "언어와 스키마 버전");
ok(r.out.trim() === "15", "출력을 잡는다", r.out);
ok(steps(r).map(s => s.line).slice(0, 3).join(",") === "1,2,3", "줄 번호", steps(r).map(s => s.line));
ok(sets(r).some(p => p[0] === "y" && p[1] === 15), "변수 변화", sets(r));

console.log("\n출력 표시 — 무엇이 찍혔는지 알아볼 수 있어야 한다");
/* 여기서는 원본과 비교하지 않는다. new Function 안의 join(' ') 은 객체를
   [object Object] 로 찍는데, 그건 진짜 console.log 가 하는 일이 아니라 기준이 못 된다. */
r = T("console.log([1,[2,3]]);\nconsole.log({x:{y:1}});\nconsole.log([]);");
ok(r.out === "[1, [2, 3]]\n{ x: { y: 1 } }\n[]\n", "배열과 객체를 펼쳐 찍는다", r.out);
r = T("console.log('a'+'b', 1+1);");
ok(r.out === "ab 2\n", "문자열은 따옴표 없이", r.out);
r = T("console.log(null, undefined);");
ok(r.out === "null undefined\n", "null 과 undefined 를 빈칸으로 뭉개지 않는다", r.out);

console.log("\nundefined 와 null 을 구별한다 (뭉개면 안 되는 곳)");
r = T("let a;\nlet b = null;\nlet c = 0/0;\nlet d = 1/0;\n");
const kind = {}; ev(r, "set").forEach(e => { kind[e.name] = e.to.v; });
ok(kind.a === "undefined", "선언만 하면 undefined", kind);
ok(kind.b === "null", "null 은 null 이다", kind);
ok(kind.c === "NaN", "NaN 이 NaN 으로 보인다", kind);
ok(kind.d === "Infinity", "Infinity", kind);

console.log("\n별칭 — 파이썬과 같은 오해가 JS 에도 있다");
r = T("let a = [1,2,3];\nlet b = a;\nb.push(4);\n");
const last = steps(r)[steps(r).length - 1].s;
const both = ev(r, "set").filter(e => e.s === last).map(e => e.name).sort();
ok(both.join(",") === "a,b", "b 를 바꾼 그 단계에서 a 도 같이 바뀐다", both);

console.log("\n함수");
r = T("function add(a,b){ return a+b; }\nconsole.log(add(2,3));");
ok(ev(r, "call").some(e => e.name === "add"), "call 이벤트", ev(r, "call"));
ok(ev(r, "call")[0].args.map(a => a.v).join(",") === "2,3", "인자가 기록된다", ev(r, "call")[0].args);
ok(ev(r, "ret").some(e => e.to.v === 5), "반환값", ev(r, "ret"));
ok(Math.max.apply(null, steps(r).map(s => s.d)) >= 1, "호출 깊이가 올라간다");
ok(steps(r)[steps(r).length - 1].d === 0, "끝나면 깊이 0 으로 돌아온다", steps(r)[steps(r).length - 1]);

console.log("\n재귀 — 프레임이 섞이지 않는다");
r = T("function f(n){ if(n<2) return 1; return n*f(n-1); }\nconsole.log(f(4));");
ok(r.out.trim() === "24", "결과가 맞다", r.out);
const ns = ev(r, "call").map(e => e.args[0].v);
ok(ns.join(",") === "4,3,2,1", "재귀 각 단계의 인자가 따로 기록된다", ns);
ok(Math.max.apply(null, steps(r).map(s => s.d)) === 4, "최대 깊이 4", Math.max.apply(null, steps(r).map(s => s.d)));

console.log("\n예외");
r = T("let a = [1,2];\nnull.foo;");
ok(r.err && r.err.type === "TypeError", "예외 종류를 잡는다", r.err);
ok(ev(r, "throw").length === 1, "throw 이벤트가 남는다");
r = T("let x = (");
ok(r.err && r.err.type === "SyntaxError", "문법 오류를 구분한다", r.err);
ok(r.events.length === 0 && r.steps === 0, "문법 오류면 단계가 없다");
ok(r.err.line === 1, "문법 오류의 줄", r.err.line);

console.log("\n상한 — 무한 루프가 브라우저를 죽이면 안 된다");
r = T("let t=0;\nfor(let i=0;i<1000000;i++){ t+=i; }\n", { maxSteps: 300 });
ok(r.cut === true, "상한에서 잘린다");
ok(r.steps <= 300, "상한을 넘지 않는다", r.steps);
r = T("while(true){}", { maxSteps: 200 });
ok(r.cut === true, "본문이 빈 무한 루프도 멈춘다", r.steps);
r = T("while(true);", { maxSteps: 200 });
ok(r.cut === true, "중괄호도 없는 무한 루프도 멈춘다", r.steps);
r = T("function f(){ return f(); } f();", { maxSteps: 5000 });
ok(r.cut === true || (r.err && /call stack|Maximum/i.test(r.err.msg)), "무한 재귀도 멈춘다", r.err);

console.log("\n크기");
r = T("let a=[];\nfor(let i=0;i<300;i++){ a.push(i); }\nconsole.log(a.length);", { maxSteps: 400 });
ok(r.out.trim() === "300", "끝까지 돈다", r.out);
const big = ev(r, "set").filter(e => e.name === "a").pop();
ok(big.to.v.length <= 50, "큰 배열은 앞부분만 담는다", big.to.v.length);
const size = Buffer.byteLength(JSON.stringify(r));
ok(size < 200 * 1024, "400단계가 200KB 미만", (size / 1024 | 0) + "KB");

console.log("\n스코프 — 선언 전 이름을 건드리지 않는다 (TDZ)");
r = T("let a = 1;\nlet b = a + 1;\nlet c = b + 1;\n");
ok(r.err === null, "TDZ 오류 없이 끝난다", r.err);
const at1 = ev(r, "set").filter(e => e.s === 0);
ok(at1.length === 0, "첫 단계에는 아직 아무 변수도 없다", at1);

console.log("\n블록 스코프 안쪽 변수도 보인다");
r = T("let a=1;\nif(a){ let inner = 9; console.log(inner); }\n");
ok(r.out.trim() === "9", "실행된다", r.out);
ok(r.err === null, "오류 없음", r.err);

console.log("\n스키마 적합성 (검증기)");
const CASES = ["let x=1;\nconsole.log(x);",
               "function f(n){return n<2?1:n*f(n-1);}\nconsole.log(f(5));",
               "null.x",
               "let x = (",
               "let t=0;\nfor(let i=0;i<50;i++){t+=i;}",
               "let m=new Map([[1,'a']]);\nlet s=new Set([1,2]);\nlet o={a:[1,2],b:null};\nconsole.log(m.size,s.size,o.b);"];
let bad = 0;
CASES.forEach((c, i) => {
  const errs = check(T(c, { maxSteps: 300 }));
  if (errs.length) { bad++; console.log("  ✗ 사례 " + i + ": " + errs.slice(0, 3).join(" / ")); }
});
ok(bad === 0, CASES.length + "개 봉투가 모두 스키마 v1 을 통과한다");

console.log("\n" + (FAIL.length ? FAIL.length + "건 실패: " + FAIL.join(", ") : "전부 통과"));
process.exit(FAIL.length ? 1 : 0);
