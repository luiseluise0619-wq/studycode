/* 문항 → 재생 뷰어 배선 검증.
   여기서 확인하는 것은 하나다: 파이썬 문항을 틀렸을 때, '틀렸습니다' 로 끝나지 않고
   틀린 그 입력을 그대로 다시 돌려 볼 수 있는가.

   Pyodide 경계(ensurePy)만 모킹한다. 채점 → 추적 계획 → 버튼 → 뷰어까지는 실제 코드다.
   실제 파이썬은 tools/tracer/pw_pyodide.cjs 가 따로 본다. */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");

const Q={ t:"py", k:"py.trace.test", q:"두 수를 더해 돌려주세요.",
  src:"def add(a, b):\n    return a - b",
  tests:[{in:"add(1,2)",out:"3"},{in:"add(5,5)",out:"10"}] };

(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:820}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof tracePlanFor==="function",{timeout:60000});

 const r=await p.evaluate(async(Q)=>{
   const out={}, sleep=ms=>new Promise(r=>setTimeout(r,ms));

   /* 가짜 파이썬 — 채점은 첫 번째 테스트만 틀리게, 추적은 봉투를 돌려주게 한다 */
   let traced=null;
   function mkPy(failFirst){
     return { globals:{set:(k,v)=>{ if(k==="__cr_src") traced=v; }},
       runPython:(code)=>{
         if(code.indexOf("trace_json(")<0) return null;
         return JSON.stringify({v:1,run:"r-q",lang:"python",at:1,src:traced,ctx:null,
           events:[{s:0,e:"step",line:1,fn:"<module>",d:0},
                   {s:0,e:"set",name:"add",to:{k:"fn",v:"add"}},
                   {s:1,e:"step",line:3,fn:"<module>",d:0},
                   {s:1,e:"set",name:"결과",to:{k:"int",v:-1}}],
           steps:2,out:"",err:null,cut:false,ms:1});
       },
       runPythonAsync:(code)=>{
         /* pyHarness 가 심어 둔 테스트 목록을 그대로 읽어 결과를 만든다 */
         const raw=code.split("__T=")[1].split("\nimport json")[0];
         const T=JSON.parse(raw);
         return Promise.resolve(JSON.stringify(T.map((t,i)=>
           (failFirst&&i===0) ? [false,t[0],"-1",t[1]] : [true,t[0],t[1],t[1]])));
       } };
   }
   window.ensurePy=()=>Promise.resolve(mkPy(true));

   /* 실제 문항 흐름을 태운다 — run 을 세우고 showQ → 확인 클릭 */
   function start(q){
     run={lang:"python",les:{title:"추적 배선",xp:0,q:[q,Object.assign({},q,{k:"py.other"})]},
          i:0,correct:0,total:2,hearts:5,id:null,color:"#5b6cff",free:true};
     document.getElementById("lesson").classList.add("on");
     showQ();
   }
   start(Q);
   await sleep(60);
   out.editorReady=!!document.getElementById("pycode");

   document.getElementById("pycode").value=Q.src;
   document.getElementById("check").click();
   await sleep(400);

   /* ── ① 틀렸을 때: 틀린 그 입력이 추적 대상이어야 한다 ── */
   out.planMade=!!run.tracePlan;
   out.planIsFailing=run.tracePlan && run.tracePlan.fail===true;
   out.planExpr=run.tracePlan && run.tracePlan.expr;        // 첫 번째가 틀렸으므로 add(1,2)
   out.planKeepsMyCode=run.tracePlan && run.tracePlan.src===Q.src;
   const btn=document.getElementById("trace-go");
   out.btnShown=!!btn;
   out.btnLabel=btn?btn.textContent.trim():"";

   /* 붙이는 호출 줄은 딱 한 줄이고, 내 코드를 건드리지 않는다 */
   const ts=pyTraceSrc(Q.src, "add(1,2)");
   out.srcKeepsUser=ts.indexOf(Q.src)===0;
   out.srcAddsOneCall=ts.replace(Q.src,"").trim()==="결과 = add(1,2)";

   /* ── ② 버튼을 누르면 실제로 그 입력이 파이썬으로 간다 ── */
   btn.click();
   await sleep(400);
   out.sentToPython=typeof traced==="string" && traced.indexOf("결과 = add(1,2)")>=0;
   out.viewerOpen=!!document.querySelector("#tracev.on .tv-code");
   out.viewerTitle=(document.querySelector("#tracev.on .tv-head b")||{}).textContent||"";
   const hint=(document.querySelector("#tracev.on .tv-hint")||{}).textContent||"";
   out.hintHasExpected=hint.indexOf("3")>=0 && hint.indexOf("-1")>=0;   // 기대 3 · 나온 -1
   out.myCodeShown=(document.querySelector("#tracev.on .tv-code")||{}).textContent.indexOf("a - b")>=0;
   closeTrace();

   /* ── ③ 다음 문항으로 넘어가면 앞 계획이 남으면 안 된다 ── */
   document.getElementById("check").click();     // '계속'
   await sleep(200);
   out.planCleared=run.tracePlan===null;
   out.btnGone=!document.getElementById("trace-go");

   /* ── ④ 다 맞았을 때도 볼 수 있고, 문구가 달라야 한다 ── */
   window.ensurePy=()=>Promise.resolve(mkPy(false));
   start(Q);
   await sleep(60);
   document.getElementById("pycode").value=Q.src;
   document.getElementById("check").click();
   await sleep(400);
   out.okPlan=!!run.tracePlan && run.tracePlan.fail===false;
   const b2=document.getElementById("trace-go");
   out.okBtnDifferent=!!b2 && b2.textContent.indexOf("어떻게 돌았는지")>=0;

   /* ── ⑤ 파이썬이 없으면 없다고 말한다 — 가짜 트레이스를 만들지 않는다 ── */
   window.ensurePy=()=>Promise.resolve(null);
   document.getElementById("trace-go").click();
   await sleep(300);
   const msg=(document.getElementById("trace-msg")||{}).textContent||"";
   out.noPyTold=msg.indexOf("파이썬")>=0 && !document.querySelector("#tracev.on");

   /* ── ⑥ py 가 아닌 문항에는 붙지 않는다 ── */
   out.noPlanForChoice=tracePlanFor({t:"choice",opts:[]}, "x", [])===null;
   out.noPlanWithoutTests=tracePlanFor({t:"py"}, "x", [])===null;
   return out;
 }, Q);

 await b.close();
 console.log(JSON.stringify(r));
 const want={editorReady:true, planMade:true, planIsFailing:true, planExpr:"add(1,2)",
   planKeepsMyCode:true, btnShown:true, srcKeepsUser:true, srcAddsOneCall:true,
   sentToPython:true, viewerOpen:true, viewerTitle:"add(1,2)", hintHasExpected:true,
   myCodeShown:true, planCleared:true, btnGone:true, okPlan:true, okBtnDifferent:true,
   noPyTold:true, noPlanForChoice:true, noPlanWithoutTests:true};
 const bad=Object.keys(want).filter(k=>r[k]!==want[k]);
 if(!r.btnLabel||r.btnLabel.indexOf("왜 이 값이")<0) bad.push("btnLabel");
 if(errs.length) bad.push("pageerror: "+errs[0]);
 if(bad.length){ console.log("\n실패: "+bad.join(", ")); process.exit(1); }
 console.log("\n문항 → 재생 뷰어 배선 확인 완료 — 틀린 입력이 그대로 추적 대상이 된다");
})();
