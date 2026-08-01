/* 살아 있는 추적 배선 검증 — Pyodide 경계만 모킹하고 내 쪽 배선은 전부 확인한다.
   Pyodide 자체는 tools/tracer/pw_pyodide.cjs 가 따로 본다.
   여기서 확인하는 것: 추적기 소스가 파이썬에 올라가는가 · 사용자 코드가 그대로
   전달되는가 · 봉투가 화면으로 이어지는가 · 실패했을 때 조용히 예제로 바꿔치기하지 않는가 */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const fs=require("fs");
const PY=fs.readFileSync(__dirname+"/tracer.py","utf8");

(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:820}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof traceRun==="function",{timeout:60000});

 const r=await p.evaluate(async(pySrc)=>{
   const out={};

   /* ── ① Pyodide 가 없을 때: 조용히 예제로 바꿔치기하면 안 된다 ── */
   window.ensurePy=()=>Promise.resolve(null);
   await ensureTracer();
   out.tracerLoaded=typeof TRACER_SRC==="string" && TRACER_SRC.indexOf("def trace_json")>=0;
   const none=await traceRun("x = 1");
   out.noPyFlag=none.__nopy===true;
   out.noPyNotFake=!none.events;

   /* ── ② 가짜 Pyodide: 실제 파이썬 대신 추적기가 받았을 인자를 확인한다 ── */
   const seen={};
   const fake={ globals:{ set:(k,v)=>{ seen[k]=v; } },
     runPython:(code)=>{
       seen.ran=(seen.ran||[]).concat(code);
       if(code.indexOf("def trace_json")>=0) return null;      // 추적기 적재
       if(code.indexOf("trace_json(")>=0){
         /* 사용자 코드를 그대로 받았는지 확인하고, 스키마에 맞는 봉투를 돌려준다 */
         const src=seen.__cr_src||"";
         return JSON.stringify({v:1, run:"r-t", lang:"python", at:1, src:src, ctx:null,
           events:[{s:0,e:"step",line:1,fn:"<module>",d:0},
                   {s:0,e:"set",name:"x",to:{k:"int",v:7}},
                   {s:1,e:"step",line:2,fn:"<module>",d:0},
                   {s:1,e:"out",text:"7\n"}],
           steps:2, out:"7\n", err:null, cut:false, ms:1});
       }
       return null;
     } };
   window.ensurePy=()=>Promise.resolve(fake);
   const env=await traceRun("x = 7\nprint(x)", {qid:"demo-1"});
   out.gotEnv=env&&env.v===1;
   out.srcPassed=seen.__cr_src==="x = 7\nprint(x)";
   out.tracerInstalled=(seen.ran||[]).some(c=>c.indexOf("def trace_json")>=0);
   out.ctxAttached=env.ctx&&env.ctx.qid==="demo-1";

   /* 추적기는 한 번만 올려야 한다 — 매번 올리면 느려진다 */
   await traceRun("y = 1");
   out.installedOnce=(seen.ran||[]).filter(c=>c.indexOf("def trace_json")>=0).length===1;

   /* ── ③ 봉투가 화면으로 이어지는가 ── */
   openTrace(env, "내 코드", "테스트");
   out.opened=!!document.querySelector("#tracev.on .tv-code");
   out.codeShown=(document.querySelector("#tracev .tv-code")||{}).textContent.indexOf("print(x)")>=0;
   out.steps=(document.getElementById("tv-count")||{}).textContent;
   closeTrace();

   /* ── ④ 실행 실패를 감추지 않는가 ── */
   window.ensurePy=()=>Promise.resolve({globals:{set:()=>{}}, runPython:()=>{ throw new Error("boom"); }});
   const bad=await traceRun("x = 1");
   out.errSurfaced=typeof bad.__err==="string" && bad.__err.indexOf("boom")>=0;

   /* ── ⑤ 목록 화면에 내 코드 입력이 있는가 ── */
   window.ensurePy=()=>Promise.resolve(null);
   openTraceDemo();
   await new Promise(r=>setTimeout(r,300));
   out.hasTextarea=!!document.getElementById("tv-src");
   out.hasRun=!!document.getElementById("tv-run");
   document.getElementById("tv-run").click();
   out.emptyGuard=(document.getElementById("tv-msg")||{}).textContent.indexOf("코드를 먼저")>=0;
   document.getElementById("tv-src").value="x = 1";
   document.getElementById("tv-run").click();
   await new Promise(r=>setTimeout(r,400));
   out.noPyMessage=(document.getElementById("tv-msg")||{}).textContent.indexOf("파이썬을 불러오지 못했")>=0;
   closeTrace();
   return out;
 }, PY);

 const probs=[];
 const need=(c,m)=>{ if(!c) probs.push(m); };
 need(r.tracerLoaded, "추적기 소스 청크가 안 붙는다");
 need(r.noPyFlag, "Pyodide 가 없을 때 그 사실을 알리지 않는다");
 need(r.noPyNotFake, "Pyodide 가 없는데 가짜 트레이스를 만들어 준다 — 사용자가 자기 코드가 돈 줄 안다");
 need(r.tracerInstalled, "추적기를 파이썬에 올리지 않는다");
 need(r.installedOnce, "추적기를 매번 다시 올린다");
 need(r.srcPassed, "사용자 코드가 그대로 전달되지 않는다");
 need(r.gotEnv, "봉투를 못 받았다");
 need(r.ctxAttached, "ctx 가 봉투에 붙지 않는다");
 need(r.opened, "봉투로 화면이 열리지 않는다");
 need(r.codeShown, "화면에 사용자 코드가 안 보인다");
 need(/^1 \/ 2/.test(r.steps||""), "단계 수가 봉투와 다르다: "+r.steps);
 need(r.errSurfaced, "실행 실패를 감춘다");
 need(r.hasTextarea&&r.hasRun, "내 코드 입력창이 없다");
 need(r.emptyGuard, "빈 코드로 눌러도 안내가 없다");
 need(r.noPyMessage, "Pyodide 없을 때 사용자에게 설명하지 않는다");
 if(errs.length) probs.push("페이지 에러: "+errs.join(" | "));

 console.log(JSON.stringify(r));
 if(probs.length) console.log("\n✗ "+probs.join("\n✗ "));
 else console.log("\n살아 있는 추적 배선 확인 완료 — Pyodide 경계만 모킹, 나머지 전부 검증");
 await b.close();
 process.exit(probs.length?1:0);
})();
