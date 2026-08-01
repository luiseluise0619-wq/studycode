/* jstrace.js 와 acorn 을 앱이 읽는 청크로 내보낸다.

   acorn 을 함께 싣는 이유: 자바스크립트에는 sys.settrace 같은 갈고리가 없어서
   소스에 표시를 남기는 수밖에 없고, 그러려면 진짜 파서가 있어야 한다.
   정규식으로 흉내 내면 문자열·템플릿 리터럴·주석에서 반드시 틀린다.

   243KB 는 작지 않다. 그래서 'JS 추적' 을 실제로 누르기 전에는 받지 않는다.
   예제는 미리 만든 트레이스라 이걸 받지 않고도 열린다. */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const ac = fs.readFileSync(path.join(ROOT, "vendor", "acorn.js"), "utf8");
if (!/exports\.parse|acorn\.parse|function parse\b/.test(ac)) throw new Error("vendor/acorn.js 가 파서로 보이지 않는다");
/* acorn 은 UMD 라 module 이 있으면 그쪽으로 붙는다. 브라우저에서는 전역으로 와야 한다. */
const acOut = "/* acorn 8.16.0 (MIT) — vendor/acorn.js 에서 가져왔다. 사본은 손대지 않는다.\n"
  + "   자바스크립트 계측에 진짜 파서가 필요하다. 라이선스는 vendor/acorn.LICENSE. */\n"
  + "(function(){var module=undefined,exports=undefined,define=undefined;\n" + ac
  + "\n})();\nif(typeof __CR===\"function\") __CR('acorn', true);\n";
fs.writeFileSync(path.join(ROOT, "data", "acorn.js"), acOut);

const js = fs.readFileSync(path.join(__dirname, "jstrace.js"), "utf8");
if (!/function traceJs\(/.test(js)) throw new Error("jstrace.js 에 traceJs 진입점이 없다");
if (!/__CR\("jsTracer"/.test(js)) throw new Error("jstrace.js 가 __CR 로 스스로 등록하지 않는다");
const out = "/* 자동 생성 — 원본은 tools/tracer/jstrace.js 다.\n"
  + "   직접 고치지 말고 build_js.cjs 를 돌려라. */\n" + js;
fs.writeFileSync(path.join(ROOT, "data", "trace-js.js"), out);

console.log("data/acorn.js " + Math.round(Buffer.byteLength(acOut) / 1024) + "KB · "
  + "data/trace-js.js " + Math.round(Buffer.byteLength(out) / 1024) + "KB");
