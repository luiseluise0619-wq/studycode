/* 언어 프로젝트가 빌드 랩 UI 에서 열리고, 러너 없이 실행하면 그 사실을 알리는지 확인 */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:900}});
 const errs=[]; p.on("pageerror",e=>{ if(!/sandboxed/.test(e.message)) errs.push(e.message); });
 await p.addInitScript(()=>{ try{localStorage.setItem("coderun",JSON.stringify({onboarded:true,goal:"free",freeMode:true}));}catch(e){} });
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof ensureBuild==="function",{timeout:60000});
 await p.evaluate(()=>ensureBuild());
 await p.waitForFunction(()=>BUILD_PROJECTS&&BUILD_PROJECTS.length>0,{timeout:60000});
 const r=await p.evaluate(async()=>{
   const out={};
   out.count=BUILD_PROJECTS.length;
   out.langs=BUILD_PROJECTS.map(x=>x.id+":"+(x.lang||"js")).join(",");
   openBuildLab();
   out.listRendered=!!document.querySelector(".blp");
   const gi=BUILD_PROJECTS.findIndex(x=>x.id==="logcli");
   blOpen(gi);
   out.opened=document.getElementById("bl-name").textContent;
   out.file=BL.file;
   out.seedShown=(document.getElementById("bl-txt")||{}).value.slice(0,20);
   blRun();
   await new Promise(r=>setTimeout(r,800));
   out.res=JSON.stringify(BL.res);
   out.running=BL.running;
   return out;
 });
 console.log(JSON.stringify(r,null,1));
 console.log("페이지 에러:", errs.length? errs.join(" | "):"없음");
 await b.close();
 process.exit((r.count===6 && r.listRendered && /Go/.test(r.opened) && r.file==="sol.go" && !errs.length)?0:1);
})();
