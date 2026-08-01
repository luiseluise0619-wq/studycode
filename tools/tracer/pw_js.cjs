/* JS 재생 검증 — 브라우저에서 진짜 자바스크립트 엔진으로 끝까지 돌린다. 모킹 없음.

   가장 중요한 것: 계측이 코드의 의미를 바꾸지 않는가.
   그래서 같은 코드를 (1) 계측 없이 그냥 돌린 결과와 (2) 추적기로 돌린 결과를
   브라우저 안에서 직접 비교한다. 단계가 예쁘게 남아도 결과가 다르면 쓸모없다. */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const fs=require("fs"), path=require("path"), http=require("http");
const ROOT=path.resolve(__dirname,"..","..");

function serve(){
  const T={".html":"text/html",".js":"text/javascript",".json":"application/json",
           ".webmanifest":"application/manifest+json",".png":"image/png"};
  return new Promise(res=>{
    const s=http.createServer((q,r)=>{
      const rel=decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/,"")||"index.html";
      const f=path.join(ROOT,rel);
      if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
      r.writeHead(200,{"content-type":T[path.extname(f)]||"application/octet-stream"});
      fs.createReadStream(f).pipe(r);
    });
    s.listen(0,"127.0.0.1",()=>res(s));
  });
}

(async()=>{
 const srv=await serve();
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:820}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p.goto("http://127.0.0.1:"+srv.address().port+"/index.html");
 await p.waitForFunction(()=>typeof traceRunJs==="function",{timeout:60000});

 const r=await p.evaluate(async()=>{
   const out={}, sleep=ms=>new Promise(r=>setTimeout(r,ms));

   /* ── ① 예제는 파서를 받지 않고 열려야 한다 (243KB) ── */
   out.noParserYet=typeof acorn==="undefined";
   openTraceDemo("js");
   await sleep(400);
   out.tabs=Array.prototype.map.call(document.querySelectorAll("#tracev.on .tv-tab"),t=>t.textContent).join("|");
   out.jsTabOn=(document.querySelector("#tracev.on .tv-tab.on")||{}).textContent==="자바스크립트";
   out.jsDemos=document.querySelectorAll("#tracev.on .tv-pick").length;
   out.stillNoParser=typeof acorn==="undefined";

   /* ── ② var / let 예제가 진짜로 다른 답을 보여 준다 ── */
   const g=id=>TRACE_DEMO_JS.filter(d=>d.id===id)[0];
   out.varOut=g("var").env.out.trim();
   out.letOut=g("let").env.out.trim();

   /* ── ③ 별칭: b 를 바꾼 그 단계에서 a 도 바뀐다 ── */
   const al=g("alias");
   openTrace(al.env, al.title, al.hint);
   await sleep(150);
   out.aliasOpened=!!document.querySelector("#tracev.on .tv-code");
   const chg=[];
   for(let i=0;i<TV.F.length;i++){ const f=TV.F[i]; const k=Object.keys(f.changed); if(k.length===2) chg.push(k.sort().join(",")); }
   out.aliasBothChange=chg.indexOf("a,b")>=0;
   tvGo(TV.F.length-1);
   out.aliasBody=(document.getElementById("tv-body")||{}).textContent||"";
   out.aliasShowsFour=out.aliasBody.indexOf("[1, 2, 3, 4]")>=0;
   out.aliasNoTable=document.querySelectorAll("#tracev.on .tv-tbl").length===0;  // 표가 아니라 변수다
   closeTrace();

   /* ── ④ 함수 깊이가 보인다 ── */
   const sc=g("scope");
   openTrace(sc.env, sc.title, sc.hint);
   await sleep(120);
   let sawDepth=false;
   for(let i=0;i<TV.F.length;i++){ tvGo(i);
     if(((document.getElementById("tv-body")||{}).textContent||"").indexOf("함수 안 1단계")>=0) sawDepth=true; }
   out.depthShown=sawDepth;
   closeTrace();

   /* ── ⑤ 계측이 의미를 바꾸지 않는다 — 브라우저 안에서 직접 비교 ── */
   const CASES=[
     "let s=0; for(let i=0;i<5;i++){ s+=i; } console.log(s);",
     "function f(n){ return n<2?1:n*f(n-1); } console.log(f(6));",
     "let a=1; { let a=2; console.log(a); } console.log(a);",
     "let t=`가\\n나`; console.log(t.length);",
     "for(const c of 'ab') console.log(c);",
     "console.log([1,2,3].filter(x=>x>1).join('-'));",
     "let o={x:1}; const {x}=o; console.log(x);",
     "try{ null.q }catch(e){ console.log('잡힘'); }",
   ];
   const same=[];
   for(const src of CASES){
     let plain="";
     try{ new Function("console", src)({log:function(){ plain+=Array.prototype.join.call(arguments," ")+"\n"; }}); }
     catch(e){ plain="throw:"+e.name; }
     const env=await traceRunJs(src);
     const got=env.__err?("engine:"+env.__err):(env.err?"throw:"+env.err.type:env.out);
     same.push(plain.trim()===got.trim() ? 1 : (plain+" ≠ "+got));
   }
   out.sameCount=same.filter(x=>x===1).length;
   out.sameFirstBad=same.filter(x=>x!==1)[0]||null;
   out.parserLoaded=typeof acorn!=="undefined";     // 여기서 처음 받았다

   /* ── ⑥ 내 코드를 UI 로 돌린다 ── */
   openTraceDemo("js");
   await sleep(250);
   document.getElementById("tv-src").value="let n = 0;\nfor (let i = 1; i <= 3; i++) {\n  n += i;\n}\nconsole.log(n);";
   document.getElementById("tv-run").click();
   for(let i=0;i<100 && !document.querySelector("#tracev.on .tv-code");i++) await sleep(50);
   out.mineOpened=!!document.querySelector("#tracev.on .tv-code");
   out.mineTitle=(document.querySelector("#tracev.on .tv-head b")||{}).textContent||"";
   if(out.mineOpened){
     out.mineLang=TV.env.lang;
     tvGo(TV.F.length-1);
     out.mineSum=((document.getElementById("tv-body")||{}).textContent||"").indexOf("6")>=0;
   }
   closeTrace();

   /* ── ⑦ 무한 루프가 화면을 죽이지 않는다 ── */
   const t0=Date.now();
   const inf=await traceRunJs("while(true){}");
   out.infMs=Date.now()-t0;
   out.infCut=inf.cut===true;
   out.infAlive=!!document.getElementById("tracev");

   /* ── ⑧ 문법 오류는 오류라고 말한다 ── */
   openTraceDemo("js");
   await sleep(200);
   document.getElementById("tv-src").value="let x = (";
   document.getElementById("tv-run").click();
   await sleep(400);
   out.synMsg=(document.getElementById("tv-msg")||{}).textContent||"";
   out.synTold=/SyntaxError/.test(out.synMsg) && /줄\)/.test(out.synMsg);
   out.synNoEmptyViewer=!document.querySelector("#tracev.on .tv-code");
   closeTrace();

   /* ── ⑨ 세 탭을 오가도 각자 예제가 맞다 ── */
   openTraceDemo("sql"); await sleep(400);
   out.sqlAfter=document.querySelectorAll("#tracev.on .tv-pick").length;
   openTraceDemo("python"); await sleep(400);
   out.pyAfter=document.querySelectorAll("#tracev.on .tv-pick").length;
   closeTrace();
   return out;
 });

 await b.close(); srv.close();
 console.log(JSON.stringify(r,null,1));
 const want={noParserYet:true, tabs:"파이썬|자바스크립트|SQL", jsTabOn:true, jsDemos:6,
   stillNoParser:true, varOut:"3 3 3", letOut:"0 1 2", aliasOpened:true, aliasBothChange:true,
   aliasShowsFour:true, aliasNoTable:true, depthShown:true, sameCount:8, sameFirstBad:null,
   parserLoaded:true, mineOpened:true, mineTitle:"내 코드", mineLang:"javascript", mineSum:true,
   infCut:true, infAlive:true, synTold:true, synNoEmptyViewer:true, sqlAfter:6, pyAfter:6};
 const bad=Object.keys(want).filter(k=>r[k]!==want[k]).map(k=>k+"("+JSON.stringify(r[k])+"≠"+JSON.stringify(want[k])+")");
 if(r.infMs>15000) bad.push("무한 루프를 끊는 데 "+r.infMs+"ms — 너무 오래 멈춘다");
 if(errs.length) bad.push("pageerror: "+errs[0]);
 if(bad.length){ console.log("\n실패: "+bad.join(", ")); process.exit(1); }
 console.log("\nJS 재생 확인 완료 — 모킹 없이 진짜 엔진으로. 계측 전후 결과 8/8 일치, 무한 루프 "+r.infMs+"ms 에 중단");
})();
