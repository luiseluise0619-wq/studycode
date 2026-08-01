/* 구현(JS)·SQL 문항 → 재생 뷰어 배선 검증. 모킹 없음 — 둘 다 인터넷이 필요 없다.

   확인하는 것: 채점 하네스가 '어떤 입력이 틀렸는지' 를 돌려주는가 ·
   그 입력으로 되감기가 열리는가 · 내 값과 기대값이 나란히 보이는가 ·
   SQL 은 내 쿼리가 실제로 어떤 행을 냈는지 보여 주는가 */
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

/* 일부러 두 번째 테스트에서만 틀리는 구현 — '첫 테스트' 가 아니라
   '틀린 테스트' 를 고르는지 확인하려면 이래야 한다 */
const JSQ={ t:"code", run:"js", k:"js.trace.test", q:"두 수를 더해 돌려주세요.",
  src:"function add(a, b){\n  return a === 5 ? 0 : a + b;\n}",
  tests:[{in:"add(1,2)",out:"3"},{in:"add(5,5)",out:"10"},{in:"add(2,2)",out:"4"}] };

const SQLQ={ t:"sql", k:"sql.trace.test", q:"우수 등급 회원의 이름을 고르세요.",
  schema:"create table 회원(id integer primary key, 이름 text, 등급 text);\n"
        +"insert into 회원 values (1,'가영','일반'),(2,'나연','우수'),(3,'다솜','우수');",
  src:"", sol:"select 이름 from 회원 where 등급='우수' order by id;", ordered:true };

(async()=>{
 const srv=await serve();
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:820}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p.goto("http://127.0.0.1:"+srv.address().port+"/index.html");
 await p.waitForFunction(()=>typeof tracePlanFor==="function",{timeout:60000});

 const r=await p.evaluate(async(Q)=>{
   const out={}, sleep=ms=>new Promise(r=>setTimeout(r,ms));
   function start(q){
     run={lang:"javascript",les:{title:"배선",xp:0,q:[q,Object.assign({},q,{k:"other"})]},
          i:0,correct:0,total:2,hearts:5,id:null,color:"#5b6cff",free:true};
     document.getElementById("lesson").classList.add("on");
     showQ();
   }
   async function waitBtn(ms){
     for(let i=0;i<ms/50;i++){ if(document.getElementById("trace-go")) return true; await sleep(50); }
     return false;
   }
   async function waitViewer(ms){
     for(let i=0;i<ms/50;i++){ if(document.querySelector("#tracev.on .tv-code")) return true; await sleep(50); }
     return false;
   }

   /* ── ① JS 구현 문항 — 두 번째 테스트에서만 틀린다 ── */
   start(Q.JSQ);
   await sleep(120);
   out.jsEditor=!!document.getElementById("livecode");
   document.getElementById("livecode").value=Q.JSQ.src;
   document.getElementById("check").click();
   out.jsBtn=await waitBtn(4000);
   out.jsPlanKind=run.tracePlan&&run.tracePlan.kind;
   out.jsPickedFailing=run.tracePlan&&run.tracePlan.expr;      // add(5,5) 여야 한다 — 첫 번째가 아니다
   out.jsWant=run.tracePlan&&run.tracePlan.want;
   out.jsGot=run.tracePlan&&run.tracePlan.got;
   out.jsRowsCame=!!(liveTest&&liveTest.rows&&liveTest.rows.length===3);
   out.jsLabel=(document.getElementById("trace-go")||{}).textContent||"";

   /* 붙이는 줄은 내 코드를 건드리지 않고, 내 값과 기대값을 나란히 만든다 */
   const ts=jsTraceSrc(Q.JSQ.src, "add(5,5)", "10");
   out.jsSrcKeepsMine=ts.indexOf(Q.JSQ.src)===0;
   out.jsSrcAdds=ts.replace(Q.JSQ.src,"").trim().replace(/\s+/g," ");

   document.getElementById("trace-go").click();
   out.jsViewer=await waitViewer(8000);
   if(out.jsViewer){
     out.jsLang=TV.env.lang;
     tvGo(TV.F.length-1);
     const body=(document.getElementById("tv-body")||{}).textContent||"";
     out.jsShowsBoth=/결과/.test(body) && /기대/.test(body);
     out.jsShowsMine=body.indexOf("결과0")>=0 || /결과\s*0/.test(body);   // 내 값 0
     out.jsShowsWant=/기대\s*10/.test(body);                              // 기대 10
     out.jsHint=(document.querySelector("#tracev.on .tv-hint")||{}).textContent||"";
   }
   closeTrace();

   /* ── ② 다음 문항으로 넘어가면 계획이 지워진다 ── */
   document.getElementById("check").click();
   await sleep(250);
   out.jsCleared=run.tracePlan===null && !document.getElementById("trace-go");

   /* ── ③ SQL 문항 — 틀린 쿼리를 내고 내 쿼리가 낸 행을 본다 ── */
   start(Q.SQLQ);
   await sleep(150);
   out.sqlEditor=!!document.getElementById("sqlcode");
   document.getElementById("sqlcode").value="select 이름 from 회원 where 등급='일반';";
   document.getElementById("check").click();
   out.sqlBtn=await waitBtn(20000);
   out.sqlPlanKind=run.tracePlan&&run.tracePlan.kind;
   out.sqlKeepsQuery=run.tracePlan&&run.tracePlan.src.indexOf("일반")>=0;
   out.sqlHasSchema=!!(run.tracePlan&&run.tracePlan.schema);
   out.sqlLabel=(document.getElementById("trace-go")||{}).textContent||"";
   out.sqlWasWrong=run.lastOk===false;

   document.getElementById("trace-go").click();
   out.sqlViewer=await waitViewer(20000);
   if(out.sqlViewer){
     out.sqlLang=TV.env.lang;
     tvGo(TV.F.length-1);
     const body=(document.getElementById("tv-body")||{}).textContent||"";
     out.sqlShowsRow=body.indexOf("나온 행")>=0 && body.indexOf("가영")>=0;   // 내 쿼리는 일반 = 가영
     out.sqlNotAnswer=body.indexOf("나연")<0;                                 // 정답 행을 대신 보여 주지 않는다
     out.sqlRowCount=document.querySelectorAll("#tracev.on .tv-tbl tr").length; // 헤더 + 1행
   }
   closeTrace();

   /* ── ④ 붙지 않아야 하는 곳 ── */
   out.noPlanForRunner=tracePlanFor({t:"code",run:"java",tests:[{in:"f()",out:"1"}]},"x",null)===null;
   out.noPlanForNoTests=tracePlanFor({t:"code",run:"js"},"x",null)===null;
   out.noPlanForEmptySql=tracePlanFor({t:"sql",schema:"create table t(a)"},"   ",null)===null;
   out.noPlanForSchemaless=tracePlanFor({t:"sql"},"select 1",null)===null;
   return out;
 }, {JSQ, SQLQ});

 await b.close(); srv.close();
 console.log(JSON.stringify(r,null,1));
 const want={jsEditor:true, jsBtn:true, jsPlanKind:"jsq", jsPickedFailing:"add(5,5)",
   jsWant:"10", jsGot:"0", jsRowsCame:true, jsSrcKeepsMine:true,
   jsSrcAdds:"let 결과 = add(5,5); let 기대 = 10;", jsViewer:true, jsLang:"javascript",
   jsShowsBoth:true, jsShowsWant:true, jsCleared:true,
   sqlEditor:true, sqlBtn:true, sqlPlanKind:"sqlq", sqlKeepsQuery:true, sqlHasSchema:true,
   sqlWasWrong:true, sqlViewer:true, sqlLang:"sql", sqlShowsRow:true, sqlNotAnswer:true,
   sqlRowCount:2, noPlanForRunner:true, noPlanForNoTests:true, noPlanForEmptySql:true,
   noPlanForSchemaless:true};
 const bad=Object.keys(want).filter(k=>r[k]!==want[k]).map(k=>k+"("+JSON.stringify(r[k])+"≠"+JSON.stringify(want[k])+")");
 if(r.jsLabel.indexOf("왜 이 값이")<0) bad.push("jsLabel("+r.jsLabel+")");
 if(r.sqlLabel.indexOf("어떤 행을 내놓았는지")<0) bad.push("sqlLabel("+r.sqlLabel+")");
 if(errs.length) bad.push("pageerror: "+errs[0]);
 if(bad.length){ console.log("\n실패: "+bad.join(", ")); process.exit(1); }
 console.log("\n구현·SQL 문항 배선 확인 완료 — 틀린 테스트를 골라 되감고, 내 쿼리가 낸 행을 보여 준다");
})();
