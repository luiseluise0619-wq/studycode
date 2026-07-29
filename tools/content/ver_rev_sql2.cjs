/* SQL 리뷰 문항 검증 — 구조 검사 + '주장을 실제 실행으로 확인'.
   앱의 sql.js 엔진을 그대로 써서, 결함이 있다고 주장한 쿼리가 실제로
     rows  : 고친 쿼리와 결과가 다른가(결함이 결과를 바꾼다는 증거)
     plan  : EXPLAIN QUERY PLAN 에서 bad 는 SCAN, fix 는 SEARCH 인가
     error : 실행 자체가 실패하는가
   proof 가 null 인 문항은 실행으로 증명할 수 없는 종류(설계·보안·운영)이며 구조만 본다. */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const Q=require(process.argv[2]||"./rev_sql2.cjs");

(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage();
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},{onboarded:true,goal:"free",freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof sqlRun==="function",{timeout:60000});

 const runs=await p.evaluate(async(QS)=>{
   /* 앱이 쓰는 sqlRun 을 그대로 쓴다 — 검증기가 따로 엔진을 띄우면 앱과 다른 조건이 된다 */
   const out=[];
   for(const q of QS){
     if(!q.proof){ out.push({k:q.k, skipped:true}); continue; }
     const one=async (sql)=>{
       const r=await sqlRun(q.schema, sql);
       if(r.error) return {ok:false, err:r.error};
       return {ok:true, rows:JSON.stringify(r.rows||[])};
     };
     if(q.proof==="rows"){
       const a=await one(q.bad), c=await one(q.fix);
       out.push({k:q.k, kind:"rows", badOk:a.ok, fixOk:c.ok, same:a.rows===c.rows,
                 bad:a.rows||a.err, fix:c.rows||c.err});
     } else if(q.proof==="plan"){
       const a=await one("EXPLAIN QUERY PLAN "+q.bad), c=await one("EXPLAIN QUERY PLAN "+q.fix);
       out.push({k:q.k, kind:"plan", badOk:a.ok, fixOk:c.ok,
                 badScan:/SCAN/.test(a.rows||""), fixSearch:/SEARCH/.test(c.rows||""),
                 bad:a.rows||a.err, fix:c.rows||c.err});
     } else {
       const a=await one(q.bad);
       out.push({k:q.k, kind:"error", failed:!a.ok, msg:a.err||a.rows});
     }
   }
   return out;
 }, Q.map(q=>({k:q.k, schema:q.schema, bad:q.bad, fix:q.fix, proof:q.proof})));

 let bad=0;
 Q.forEach((q,i)=>{
   const tag="["+(i+1)+"] "+q.k;
   const probs=[];
   /* ── 구조 ── */
   if(!Array.isArray(q.items)||q.items.length<5) probs.push("보기 5개 미만");
   else{
     const nb=q.items.filter(x=>x.bad).length;
     if(nb<2) probs.push("결함 보기가 2개 미만 — 고르는 훈련이 안 된다");
     if(nb>=q.items.length) probs.push("전부 결함이면 판별이 아니다");
     const norm=q.items.map(x=>String(x.txt).replace(/\s+/g," ").trim());
     if(new Set(norm).size!==norm.length) probs.push("보기 중복 — 채점 불가");
   }
   if(!q.code) probs.push("코드가 없다");
   if(!q.ex||q.ex.length<150) probs.push("해설이 부실하다");
   if(!/디스트랙터/.test(q.ex||"")) probs.push("해설이 오답 보기를 설명하지 않는다");

   /* ── 실행으로 확인 ── */
   const r=runs[i];
   if(r&&!r.skipped){
     if(r.kind==="rows"){
       if(!r.badOk) probs.push("결함 쿼리가 실행되지 않는다: "+r.bad);
       else if(!r.fixOk) probs.push("고친 쿼리가 실행되지 않는다: "+r.fix);
       else if(r.same) probs.push("결함 쿼리와 고친 쿼리의 결과가 같다 — 결함이 결과를 바꾸지 않는다 ("+r.bad+")");
     } else if(r.kind==="plan"){
       if(!r.badOk||!r.fixOk) probs.push("실행 계획을 얻지 못했다: "+(r.bad||"")+" / "+(r.fix||""));
       else if(!r.badScan) probs.push("결함 쿼리가 SCAN 이 아니다: "+r.bad);
       else if(!r.fixSearch) probs.push("고친 쿼리가 SEARCH 가 아니다: "+r.fix);
     } else if(r.kind==="error" && !r.failed){
       probs.push("실패해야 할 쿼리가 성공했다: "+r.msg);
     }
   }
   if(probs.length){ bad++; console.log("✗ "+tag+"\n  "+probs.join("\n  ")); }
   else console.log("✓ "+tag+"  ("+(r&&r.skipped?"구조 검사":"실행 확인 "+r.kind)+")");
 });
 if(errs.length) console.log("페이지 에러: "+errs.join(" | "));
 console.log("\n"+Q.length+"문항 중 "+bad+"건 문제");
 await b.close();
 process.exit(bad?1:0);
})();
