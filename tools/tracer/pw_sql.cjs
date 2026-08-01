/* SQL 재생 검증 — 브라우저에서 진짜 SQLite 로 끝까지 돌린다.

   파이썬 쪽과 결정적으로 다른 점: 모킹이 하나도 없다. sql.js 는 저장소 안에 있어
   CDN 이 필요 없다. 그래서 '사용자가 보는 것' 을 여기서 그대로 확인할 수 있다.

   확인하는 것: 예제가 엔진 없이 열리는가 · 내 쿼리가 진짜로 도는가 ·
   행이 하나씩 늘어나는가 · 표 변화가 보이는가 · 뷰가 언어를 묻지 않는가 */
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
 await p.waitForFunction(()=>typeof traceRunSql==="function",{timeout:60000});

 const r=await p.evaluate(async()=>{
   const out={}, sleep=ms=>new Promise(r=>setTimeout(r,ms));
   const txt=id=>(document.getElementById(id)||{}).textContent||"";

   /* ── ① 예제는 엔진을 하나도 받지 않고 열려야 한다 ── */
   out.sqlLibUntouched=typeof initSqlJs!=="function";
   openTraceDemo("sql");
   await sleep(400);
   out.tabsShown=document.querySelectorAll("#tracev.on .tv-tab").length===2;
   out.sqlTabOn=(document.querySelector("#tracev.on .tv-tab.on")||{}).textContent==="SQL";
   out.sqlDemos=document.querySelectorAll("#tracev.on .tv-pick").length;
   out.stillNoEngine=typeof initSqlJs!=="function";      // 예제만 봤는데 870KB 를 받으면 안 된다

   /* ── ② JOIN 예제: 행이 하나씩 늘어나고, 가영이 두 번 나온다 ── */
   const join=TRACE_DEMO_SQL.filter(d=>d.id==="join")[0];
   openTrace(join.env, join.title, join.hint);
   await sleep(150);
   out.joinOpened=!!document.querySelector("#tracev.on .tv-code");
   out.joinSteps=txt("tv-count");
   tvGo(1); out.rowsAt1=document.querySelectorAll("#tracev.on .tv-tbl tr").length;   // 헤더 + 1행
   tvGo(3); out.rowsAt3=document.querySelectorAll("#tracev.on .tv-tbl tr").length;   // 헤더 + 3행
   out.hotOne=document.querySelectorAll("#tracev.on .tv-tbl tr.hot").length===1;
   out.joinBody=(document.getElementById("tv-body")||{}).textContent||"";
   /* 질의문에는 변수가 없다 — '변수가 없습니다' 를 보여 주면 안 된다 */
   out.noVarSection=out.joinBody.indexOf("아직 만들어진 변수가 없습니다")<0;
   out.noteIsRow=/행.{0,3}이 나왔습니다/.test(txt("tv-body"));
   closeTrace();

   /* ── ③ UPDATE 예제: 표 변화가 '바뀜' 으로 보여야 한다 (지우고 넣기가 아니다) ── */
   const up=TRACE_DEMO_SQL.filter(d=>d.id==="update")[0];
   openTrace(up.env, up.title, up.hint);
   await sleep(120);
   tvGo(TV.F.length-1);
   const ub=(document.getElementById("tv-body")||{}).textContent||"";
   out.updShowsChange=ub.indexOf("표 변화")>=0 && ub.indexOf("바뀜")>=0;
   out.updShowsAllThree=(ub.match(/바뀜/g)||[]).length===3;   // WHERE 를 빼서 세 명 전부
   out.updShowsFromTo=ub.indexOf("제주")>=0 && (ub.indexOf("서울")>=0||ub.indexOf("부산")>=0);
   closeTrace();

   /* ── ④ 두 질의가 한 표로 뭉치지 않는다 ── */
   const inn=TRACE_DEMO_SQL.filter(d=>d.id==="inner")[0];
   openTrace(inn.env, inn.title, inn.hint);
   await sleep(120);
   tvGo(TV.F.length-1);
   out.secondStmtRows=document.querySelectorAll("#tracev.on .tv-tbl tr").length;  // 헤더 + LEFT JOIN 4행
   closeTrace();

   /* ── ⑤ 내 쿼리를 진짜로 돌린다 (여기서 처음 엔진을 받는다) ── */
   openTraceDemo("sql");
   await sleep(300);
   document.getElementById("tv-src").value=
     "create table t(a int, b text);\ninsert into t values (1,'가'),(2,'나');\nupdate t set b='다' where a=1;\nselect * from t;";
   const t0=Date.now();
   document.getElementById("tv-run").click();
   for(let i=0;i<300 && !document.querySelector("#tracev.on .tv-code");i++) await sleep(100);
   out.engineMs=Date.now()-t0;
   out.mineOpened=!!document.querySelector("#tracev.on .tv-code");
   out.mineTitle=(document.querySelector("#tracev.on .tv-head b")||{}).textContent||"";
   if(out.mineOpened){
     out.mineSteps=TV.F.length;
     tvGo(TV.F.length-1);
     const mb=(document.getElementById("tv-body")||{}).textContent||"";
     out.mineHasRows=mb.indexOf("나온 행")>=0;
     out.mineShowsUpdated=mb.indexOf("'다'")>=0;      // UPDATE 가 반영된 최종 결과
     out.mineEnvLang=TV.env.lang;
   }
   closeTrace();

   /* ── ⑥ 잘못된 쿼리는 잘못됐다고 말한다 ── */
   openTraceDemo("sql");
   await sleep(250);
   document.getElementById("tv-src").value="select * from 없는표;";
   document.getElementById("tv-run").click();
   for(let i=0;i<100 && !document.querySelector("#tracev.on .tv-code");i++) await sleep(50);
   out.errOpened=!!document.querySelector("#tracev.on .tv-code");
   out.errShown=((document.getElementById("tv-body")||{}).textContent||"").indexOf("없는표")>=0;
   closeTrace();

   /* ── ⑦ 빈 입력 방어 · 파이썬 탭으로 돌아가기 ── */
   openTraceDemo("sql");
   await sleep(200);
   document.getElementById("tv-src").value="   ";
   document.getElementById("tv-run").click();
   await sleep(120);
   out.emptyGuard=txt("tv-msg").indexOf("쿼리를")>=0;
   document.querySelectorAll("#tracev.on .tv-tab")[0].click();
   await sleep(300);
   out.backToPython=(document.querySelector("#tracev.on .tv-tab.on")||{}).textContent==="파이썬"
     && document.querySelectorAll("#tracev.on .tv-pick").length===6;
   closeTrace();

   /* ── ⑧ 파이썬 트레이스는 여전히 변수를 보여 준다 (표 코드가 망가뜨리지 않았는가) ── */
   await ensureTraceDemo();
   const al=TRACE_DEMO.filter(d=>d.id==="alias")[0];
   openTrace(al.env, al.title, al.hint);
   await sleep(120);
   tvGo(TV.F.length-1);
   const pb=(document.getElementById("tv-body")||{}).textContent||"";
   out.pyStillVars=pb.indexOf("변수")>=0 && pb.indexOf("[1, 2, 3, 4]")>=0;
   out.pyNoTable=document.querySelectorAll("#tracev.on .tv-tbl").length===0;
   closeTrace();
   return out;
 });

 await b.close(); srv.close();
 console.log(JSON.stringify(r,null,1));
 const want={sqlLibUntouched:true, tabsShown:true, sqlTabOn:true, sqlDemos:6, stillNoEngine:true,
   joinOpened:true, joinSteps:"1 / 4 단계", rowsAt1:2, rowsAt3:4, hotOne:true, noVarSection:true,
   noteIsRow:true, updShowsChange:true, updShowsAllThree:true, updShowsFromTo:true,
   secondStmtRows:5, mineOpened:true, mineTitle:"내 쿼리", mineHasRows:true,
   mineShowsUpdated:true, mineEnvLang:"sql", errOpened:true, errShown:true,
   emptyGuard:true, backToPython:true, pyStillVars:true, pyNoTable:true};
 const bad=Object.keys(want).filter(k=>r[k]!==want[k]).map(k=>k+"("+JSON.stringify(r[k])+"≠"+JSON.stringify(want[k])+")");
 if(errs.length) bad.push("pageerror: "+errs[0]);
 if(bad.length){ console.log("\n실패: "+bad.join(", ")); process.exit(1); }
 console.log("\nSQL 재생 확인 완료 — 모킹 없이 진짜 SQLite 로 끝까지 (엔진 받기 "+r.engineMs+"ms)");
})();
