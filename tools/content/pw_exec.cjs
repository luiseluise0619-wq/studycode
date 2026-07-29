/* 주입 전 브라우저 검증: 앱을 실제로 띄워 testDoc 하네스로 돌린다.
   sol 은 gate 통과 + 품질 100, src 는 gate 실패여야 한다.
   testDoc 은 결과를 두 번 postMessage 하므로(파싱 시점 + load) 마지막 메시지를 쓴다.
   사용: node pw_exec.cjs ./exec_sysnet.cjs */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const Q=require(process.argv[2]);
(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:900}});
 const errs=[]; p.on("pageerror",e=>{ if(!/sandboxed/.test(e.message)) errs.push(e.message); });
 await p.addInitScript(()=>{ try{localStorage.setItem("coderun",JSON.stringify({onboarded:true,goal:"free",freeMode:true}));}catch(e){} });
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof testDoc==="function",{timeout:60000});
 let bad=0;
 for(let i=0;i<Q.length;i++){
   const q=Q[i];
   const spec={tests:q.tests.map(c=>({in:c[0],out:c[1]})), edge:q.edge.map(c=>({in:c[0],out:c[1]}))};
   const r=await p.evaluate(async([spec,srcCode,solCode])=>{
     const once=(code)=>new Promise(res=>{
       const f=document.createElement("iframe");
       f.style.cssText="width:1px;height:1px;opacity:0";
       f.setAttribute("sandbox","allow-scripts");
       let last=null, settle=null;
       const fin=()=>{ window.removeEventListener("message",h); f.remove(); res(last||{timeout:true}); };
       const h=e=>{ if(e.source===f.contentWindow && e.data && e.data.__cr==="test"){
         last=e.data; clearTimeout(settle); settle=setTimeout(fin,500); } };
       window.addEventListener("message",h);
       document.body.appendChild(f);
       f.srcdoc=testDoc(code,spec);
       setTimeout(fin,8000);
     });
     const seed=await once(srcCode);
     const fixed=await once(solCode);
     return {seedGate:!!seed.gate, solGate:!!fixed.gate, impl:fixed.impl,
             seedTimeout:!!seed.timeout, solTimeout:!!fixed.timeout};
   },[spec,q.src,q.sol]);
   const ok=!r.seedGate && r.solGate && r.impl===100 && !r.seedTimeout && !r.solTimeout;
   if(!ok){ bad++; console.log("✗ ["+(i+1)+"] "+(q.track||q.lang||"")+"/"+q.k+" — "+JSON.stringify(r)); }
   else console.log("✓ ["+(i+1)+"] "+(q.track||q.lang||"")+"/"+q.k);
 }
 if(errs.length) console.log("페이지 에러: "+errs.join(" | "));
 console.log(Q.length+"문항 중 "+bad+"건 문제");
 await b.close();
 process.exit((bad||errs.length)?1:0);
})();
