/* impl_ui.cjs 를 앱의 진짜 채점기로 검증한다.
     react → reactTestDoc (벤더링된 React + Sucrase, 실제 렌더)
     html  → htmlTestDoc  (브라우저 CSS 엔진, getComputedStyle/getBoundingClientRect)
   sol 은 전부 통과해야 하고, 시작 코드(src)는 통과하면 안 된다 — 통과하면 풀 게 없다. */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const D=require("./impl_ui.cjs");
(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:420,height:900}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},{onboarded:true,goal:"free",freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof htmlTestDoc==="function",{timeout:60000});
 /* react 라이브러리와 JSX 변환기를 미리 받아 둔다 */
 const libOk=await p.evaluate(()=>Promise.all([ensureSucrase(), ensureReactSrc()]).then(r=>!!r[1]).catch(e=>String(e)));
 if(libOk!==true){ console.log("✗ React 라이브러리를 준비하지 못함: "+libOk); await b.close(); process.exit(1); }

 const rows=await p.evaluate(async(D)=>{
   const out=[];
   /* 하네스는 파싱 직후와 load 에서 각각 결과를 보낸다. 파싱 직후 값은 스타일·레이아웃이
      아직 자리를 잡기 전이라 CSS 문항에서 들쭉날쭉하다 — 앱이 그렇듯 '마지막 값' 을 쓴다.
      (첫 값을 쓰도록 뒀더니 같은 문항이 실행할 때마다 통과/실패를 오갔다) */
   function grade(doc){ return new Promise(res=>{
     const f=document.createElement("iframe");
     f.setAttribute("sandbox","allow-scripts");
     f.style.cssText="position:fixed;left:0;top:0;width:400px;height:600px;opacity:0;pointer-events:none;z-index:-1";
     document.body.appendChild(f);
     let last=null, timer=null, done=false;
     const finish=()=>{ if(done)return; done=true;
       window.removeEventListener("message",on); f.remove(); res(last); };
     const on=e=>{ if(done||!e.data||e.data.__cr!=="test")return;
       if(e.source!==f.contentWindow) return;
       last=e.data;
       if(timer) clearTimeout(timer);
       timer=setTimeout(finish, 500);      // 500ms 동안 새 결과가 없으면 확정
     };
     window.addEventListener("message",on);
     setTimeout(finish, 4000);             // 최대 대기
     f.srcdoc=doc;
   });}
   const lib=await ensureReactSrc();
   for(const q of D.react){
     const jsx=s=>tsToJs(s, true);   /* 앱과 같은 변환기(Sucrase, typescript+jsx) */
     let a=null,c=null;
     const ts=jsx(q.sol); if(ts.error){ out.push({kind:"react",k:q.k,sol:{err:"정답 문법 오류: "+ts.error}}); continue; }
     try{ a=await grade(reactTestDoc(ts.code, q.tests, lib)); }catch(e){ a={err:String(e.message||e)}; }
     const ts2=jsx(q.src);
     try{ c=ts2.error?null:await grade(reactTestDoc(ts2.code, q.tests, lib)); }catch(e){ c=null; }
     out.push({kind:"react", k:q.k, sol:a, src:c});
   }
   for(const q of D.html){
     const a=await grade(htmlTestDoc(q.sol, q.tests));
     const c=await grade(htmlTestDoc(q.src, q.tests));
     out.push({kind:"html", k:q.k, sol:a, src:c});
   }
   return out;
 }, D);
 await b.close();
 let f=0;
 rows.forEach((r,i)=>{
   const bad=[];
   if(!r.sol) bad.push("정답 결과 없음(렌더 실패)");
   else if(r.sol.err) bad.push("정답 오류: "+r.sol.err);
   else if(!r.sol.gate) bad.push("정답 미통과 "+r.sol.pass+"/"+r.sol.total+" — 실패: "
     +(r.sol.detail||[]).filter(d=>!d.ok).map(d=>d.d).join(" | "));
   if(r.src && r.src.gate) bad.push("시작 코드가 이미 통과 — 풀 게 없다");
   if(bad.length){ f++; console.log("✗ ["+(i+1)+"] "+r.kind+" "+r.k+"\n    "+bad.join("\n    ")); }
   else console.log("✓ ["+(i+1)+"] "+r.kind.padEnd(5)+" "+r.k+"  (정답 "+r.sol.pass+"/"+r.sol.total+" · 시작 "+(r.src?r.src.pass+"/"+r.src.total:"렌더실패")+")");
 });
 console.log("\n"+rows.length+"문항 중 "+f+"건 문제 · 페이지 오류 "+errs.length);
 process.exit(f?1:0);
})();
