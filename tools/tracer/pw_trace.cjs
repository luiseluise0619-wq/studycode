/* 재생 뷰어 검증 — 실제 앱에서 예제 트레이스를 열어 단계를 넘겨 본다.
   Pyodide 없이 돈다(예제는 CPython 으로 미리 만들어 둔 것). */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");

(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:820}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof openTraceDemo==="function",{timeout:60000});

 const r=await p.evaluate(async()=>{
   await ensureTraceDemo();
   const out={demos:(TRACE_DEMO||[]).length};

   /* 'b = a 는 복사가 아니다' 예제 — 한 단계에서 a 와 b 가 함께 바뀌어야 한다 */
   const alias=TRACE_DEMO.find(d=>d.id==="alias");
   const F=traceFrames(alias.env);
   out.frames=F.length;
   out.bothChange=F.some(f=>f.changed.a&&f.changed.b);
   out.varsAccumulate=F[F.length-1].vars.a&&F[F.length-1].vars.b?true:false;
   out.outGrows=F[F.length-1].out.length>0 && F[0].out.length===0;

   /* 오류 예제 — 마지막에 IndexError 가 남아야 한다 */
   const er=TRACE_DEMO.find(d=>d.id==="error");
   out.errType=er.env.err&&er.env.err.type;
   out.throwFrame=traceFrames(er.env).some(f=>f.note&&f.note.k==="throw");

   /* 함수 예제 — 깊이가 올라갔다 돌아와야 한다 */
   const sc=TRACE_DEMO.find(d=>d.id==="scope");
   const SF=traceFrames(sc.env);
   out.maxDepth=Math.max(...SF.map(f=>f.d));
   out.endsAtZero=SF[SF.length-1].d===0;

   /* 실제로 화면을 열고 넘겨 본다 */
   openTrace(alias.env, alias.title, alias.hint);
   out.opened=!!document.querySelector("#tracev.on .tv-code");
   out.step1=document.querySelector("#tv-count").textContent;
   out.prevDisabled=document.getElementById("tv-prev").disabled;
   document.getElementById("tv-next").click();
   document.getElementById("tv-next").click();
   document.getElementById("tv-next").click();
   out.step4=document.getElementById("tv-count").textContent;
   out.highlighted=document.querySelectorAll("#tracev .tv-l.on").length;
   out.changedShown=document.querySelectorAll("#tracev .tv-v.ch").length;
   out.hasArrow=!!document.querySelector("#tracev .tv-arw");
   /* 슬라이더로 끝까지 */
   const sl=document.getElementById("tv-slider");
   sl.value=String(traceFrames(alias.env).length-1);
   sl.dispatchEvent(new Event("input"));
   out.lastNext=document.getElementById("tv-next").disabled;
   out.outShown=!!document.querySelector("#tracev .tv-out");
   closeTrace();
   out.closed=!document.querySelector("#tracev.on");

   /* 홈에서 실제로 닿는가 — 진입점이 없으면 아무도 못 쓴다 */
   const card=document.getElementById("trace-open");
   out.homeCard=!!card;
   if(card){ card.click(); await new Promise(r=>setTimeout(r,300));
     out.pickerOpened=document.querySelectorAll("#tracev.on .tv-pick").length; closeTrace(); }
   return out;
 });

 const probs=[];
 const need=(c,m)=>{ if(!c) probs.push(m); };
 need(r.demos>=6, "예제가 6개 미만: "+r.demos);
 need(r.bothChange, "'b = a' 예제에서 a 와 b 가 같은 단계에 바뀌지 않는다 — 이 예제의 핵심이다");
 need(r.varsAccumulate, "변수가 누적되지 않는다");
 need(r.outGrows, "출력이 단계에 따라 늘어나지 않는다");
 need(r.errType==="IndexError", "오류 예제의 종류가 다르다: "+r.errType);
 need(r.throwFrame, "예외 단계에 표시가 없다");
 need(r.maxDepth>=1, "함수 예제에서 깊이가 올라가지 않는다: "+r.maxDepth);
 need(r.endsAtZero, "함수에서 돌아온 뒤 깊이가 0 이 아니다");
 need(r.opened, "재생 화면이 열리지 않는다");
 need(/^1 \//.test(r.step1), "처음이 1단계가 아니다: "+r.step1);
 need(r.prevDisabled, "첫 단계인데 이전 버튼이 살아 있다");
 need(/^4 \//.test(r.step4), "세 번 눌렀는데 4단계가 아니다: "+r.step4);
 need(r.highlighted===1, "현재 줄 강조가 정확히 하나가 아니다: "+r.highlighted);
 need(r.changedShown>=1, "바뀐 변수 표시가 없다");
 need(r.hasArrow, "값이 바뀔 때 '이전 → 이후' 가 안 보인다");
 need(r.lastNext, "마지막 단계인데 다음 버튼이 살아 있다");
 need(r.outShown, "출력이 표시되지 않는다");
 need(r.closed, "닫기가 동작하지 않는다");
 need(r.homeCard, "홈에 진입 카드가 없다 — 진입점이 없으면 아무도 못 쓴다");
 need(r.pickerOpened>=6, "홈 카드를 눌렀을 때 예제 목록이 안 뜬다: "+r.pickerOpened);
 if(errs.length) probs.push("페이지 에러: "+errs.join(" | "));

 console.log(JSON.stringify(r));
 if(probs.length) console.log("\n✗ "+probs.join("\n✗ "));
 else console.log("\n재생 뷰어 확인 완료 — 예제 "+r.demos+"개 · 단계 이동 · 변수 변화 · 출력 · 예외 · 함수 깊이");
 await b.close();
 process.exit(probs.length?1:0);
})();
