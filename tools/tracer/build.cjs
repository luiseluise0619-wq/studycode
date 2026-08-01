/* tracer.py 를 앱이 읽는 청크로 내보낸다. 원본은 언제나 tracer.py 하나다 —
   JS 안에 파이썬을 손으로 복사해 두면 반드시 어긋난다. */
const fs=require("fs"), path=require("path");
const ROOT=path.resolve(__dirname,"..","..");
const py=fs.readFileSync(path.join(__dirname,"tracer.py"),"utf8");
if(!/def trace_json\(/.test(py)) throw new Error("tracer.py 에 trace_json 진입점이 없다");
const out="/* 자동 생성 — 원본은 tools/tracer/tracer.py 다. 직접 고치지 말고 build.cjs 를 돌려라.\n"
  +"   Pyodide 에 이 소스를 넣고 __cr_trace_json(src) 로 부른다. */\n"
  +"__CR('tracer', "+JSON.stringify(py)+");\n";
fs.writeFileSync(path.join(ROOT,"data","trace.js"), out);
console.log("data/trace.js 생성 · "+Math.round(Buffer.byteLength(out)/1024)+"KB");
