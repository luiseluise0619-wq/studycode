/* 새 빌드 랩을 앱의 buildDoc 샌드박스로 검증한다.
     각 Day: 그날의 참조 파일로 그날 테스트가 전부 통과해야 한다
     시작 파일(seed): 통과하면 안 된다 — 만들 게 없다는 뜻
     그리고 마지막 참조 파일로 '모든 Day' 를 다시 돌린다 — 나중 Day 가 앞 Day 를 깨면 안 된다 */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const {PROJECT,SOL}=require("./lab_logagg.cjs");
(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},{onboarded:true,goal:"free",freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof buildDoc==="function",{timeout:60000});
 const out=await p.evaluate(async(A)=>{
   const {PROJECT,SOL}=A;
   function run(files, tests, day){ return new Promise(res=>{
     const f=document.createElement("iframe");
     f.style.cssText="position:fixed;left:0;top:0;width:10px;height:10px;opacity:0;z-index:-1";
     document.body.appendChild(f);
     let done=false;
     const on=e=>{ if(done||!e.data||e.data.__cr!=="build")return; if(e.source!==f.contentWindow)return;
       done=true; window.removeEventListener("message",on); f.remove(); res(e.data.res); };
     window.addEventListener("message",on);
     setTimeout(()=>{ if(!done){done=true;window.removeEventListener("message",on);f.remove();res(null);} },4000);
     f.srcdoc=buildDoc(files, tests, day||{});
   });}
   const rows=[];
   for(let i=0;i<PROJECT.days.length;i++){
     const d=PROJECT.days[i];
     rows.push({day:d.n, kind:"참조", res: await run(SOL[i], d.tests, d)});
     rows.push({day:d.n, kind:"시작", res: await run(PROJECT.seed, d.tests, d)});
     rows.push({day:d.n, kind:"최종", res: await run(SOL[SOL.length-1], d.tests, d)});
   }
   return rows;
 },{PROJECT,SOL});
 await b.close();
 let fail=0;
 out.forEach(r=>{
   if(!r.res){ fail++; console.log("✗ Day"+r.day+" "+r.kind+" — 결과 없음"); return; }
   const bad=r.res.filter(x=>!x.ok);
   if(r.kind==="시작"){
     if(!bad.length){ fail++; console.log("✗ Day"+r.day+" 시작 파일이 이미 전부 통과 — 만들 게 없다"); }
     else console.log("· Day"+r.day+" 시작   "+(r.res.length-bad.length)+"/"+r.res.length+" (남은 일이 있다)");
   } else {
     if(bad.length){ fail++; console.log("✗ Day"+r.day+" "+r.kind+" 실패:\n    "+bad.map(x=>x.n+" → "+x.err).join("\n    ")); }
     else console.log("✓ Day"+r.day+" "+r.kind+"   "+r.res.length+"/"+r.res.length);
   }
 });
 console.log("\n실패 "+fail+" · 페이지 오류 "+errs.length);
 process.exit(fail||errs.length?1:0);
})();
