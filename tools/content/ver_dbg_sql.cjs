/* dbg_sql.cjs 를 앱의 진짜 SQL 채점기(__sqlGrade)로 검증한다.
     sol → 자기 자신과 비교하면 당연히 통과. 대신 결과가 '비어 있지 않은지' 를 본다
           (빈 결과끼리 비교하면 어떤 쿼리든 통과하므로 문항이 의미를 잃는다)
     src → sol 과 다른 결과여야 한다. 같으면 고칠 게 없다.
   sol 의 기대 행도 함께 찍어 사람 눈으로 요구사항과 대조할 수 있게 한다. */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const Q=require("./dbg_sql.cjs");
(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},{onboarded:true,goal:"free",freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof gradeSql==="function",{timeout:60000});
 await p.evaluate(()=>ensureSqlLib());
 await p.waitForFunction(()=>typeof initSqlJs==="function",{timeout:60000});
 const rows=await p.evaluate(async(QS)=>{
   const out=[];
   for(const q of QS){
     const self=await gradeSql(q, q.sol);      // sol vs sol
     const broke=await gradeSql(q, q.src);     // src vs sol
     out.push({k:q.k, selfOk:self.ok, selfErr:self.error||null, n:self.expN,
               cols:self.cols, exp:self.exp, brokeOk:broke.ok, brokeErr:broke.error||null,
               gotN:broke.gotN==null?null:broke.gotN});
   }
   return out;
 }, Q);
 await b.close();
 let f=0;
 rows.forEach((r,i)=>{
   const bad=[];
   if(!r.selfOk) bad.push("정답 쿼리 오류: "+r.selfErr);
   if(!r.n) bad.push("정답 결과가 0행 — 빈 결과끼리 비교하면 아무 쿼리나 통과한다");
   if(r.brokeOk) bad.push("고장난 쿼리가 정답과 같은 결과 — 고칠 게 없다");
   if(bad.length){ f++; console.log("✗ ["+(i+1)+"] "+r.k+" — "+bad.join(" / ")); }
   else console.log("✓ ["+(i+1)+"] "+r.k+"  정답 "+r.n+"행 "+JSON.stringify(r.exp)
     +" · 고장 "+(r.brokeErr?("오류("+r.brokeErr.slice(0,40)+")"):(r.gotN+"행")));
 });
 console.log("\n"+Q.length+"문항 중 "+f+"건 문제 · 페이지 오류 "+errs.length);
 process.exit(f||errs.length?1:0);
})();
