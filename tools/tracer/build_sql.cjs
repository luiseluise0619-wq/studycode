/* sqltrace.js 를 앱이 읽는 청크로 내보낸다. 원본은 언제나 sqltrace.js 하나다.

   파이썬 쪽(build.cjs)과 다른 점: 파이썬 추적기는 '문자열' 로 실어 Pyodide 에 넣지만
   SQL 추적기는 브라우저 JS 라 그대로 실린다. __CR 로 스스로 등록한다. */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const src = fs.readFileSync(path.join(__dirname, "sqltrace.js"), "utf8");
if (!/function traceSql\(/.test(src)) throw new Error("sqltrace.js 에 traceSql 진입점이 없다");
if (!/__CR\("sqlTracer"/.test(src)) throw new Error("sqltrace.js 가 __CR 로 스스로 등록하지 않는다");
const out = "/* 자동 생성 — 원본은 tools/tracer/sqltrace.js 다.\n"
  + "   직접 고치지 말고 build_sql.cjs 를 돌려라. */\n" + src;
fs.writeFileSync(path.join(ROOT, "data", "trace-sql.js"), out);
console.log("data/trace-sql.js 생성 · " + Math.round(Buffer.byteLength(out) / 1024) + "KB");
