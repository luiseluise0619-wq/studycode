/* php 트랙을 실제 앱에서 열어 확인한다.
   ① 트랙 청크가 붙고 유닛·레슨·이론·문항이 그려지는가
   ② 실행형(rt) 문항이 러너를 불러 정답을 통과로, 고장 코드를 실패로 판정하는가
      — 앱의 runnerTest() 를 그대로 쓴다. 검증기가 따로 호출하면 앱과 다른 조건이 된다. */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const EXEC=require("./exec_php.cjs");

(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage();
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true, runner:{url:"http://127.0.0.1:8787"}});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof ensureTrack==="function" && typeof runnerTest==="function",{timeout:60000});

 const info=await p.evaluate(async()=>{
   await ensureTrack("php");
   const c=COURSES.php;
   let q=0, th=0, rt=0, monLang=new Set();
   c.units.forEach(u=>u.lessons.forEach(l=>{
     q+=(l.q||[]).length;
     if(l.theory) th++;
     (l.q||[]).forEach(x=>{ if(x.t==="code"&&x.rt){ rt++; monLang.add(x.rt.lang); } });
   }));
   return { name:c.name, em:c.em, units:c.units.length,
            lessons:c.units.reduce((s,u)=>s+u.lessons.length,0), q, th, rt,
            monLang:[...monLang], intro:!!(typeof TRACK_INTRO!=="undefined"&&TRACK_INTRO.php),
            inCats:CATS.some(g=>g.tracks.includes("php")),
            runLabel:(typeof RUN_LABEL!=="undefined")&&RUN_LABEL.php };
 });

 /* 러너 판정을 앱의 함수로 확인한다 (첫 문항과 마지막 문항) */
 const picks=[0, EXEC.length-1];
 const graded=[];
 for(const i of picks){
   const x=EXEC[i];
   const r=await p.evaluate(async ({test, sol, src})=>{
     const a=await runnerTest("php", sol, test, null, null);
     const c=await runnerTest("php", src, test, null, null);
     return { needRunner:!!(a&&a.needRunner), solPass:!!(a&&a.pass), srcPass:!!(c&&c.pass),
              err:(a&&a.error)||null, out:String((a&&(a.stdout||a.stderr))||"").slice(0,300) };
   }, {test:x.test, sol:x.sol, src:x.src});
   graded.push({k:x.k, ...r});
 }

 const probs=[];
 if(info.name!=="PHP") probs.push("트랙 이름이 PHP 가 아니다: "+info.name);
 if(info.units<13) probs.push("유닛이 13개 미만: "+info.units);
 if(info.q<160) probs.push("문항이 160개 미만: "+info.q);
 if(info.th<info.lessons) probs.push("이론이 붙지 않은 레슨이 있다: "+info.th+"/"+info.lessons);
 if(info.rt!==EXEC.length) probs.push("rt 문항 수 불일치: "+info.rt+" (기대 "+EXEC.length+")");
 if(info.monLang.join(",")!=="php") probs.push("rt.lang 이 php 가 아니다: "+info.monLang.join(","));
 if(!info.intro) probs.push("TRACK_INTRO.php 가 없다");
 if(!info.inCats) probs.push("CATS 어느 그룹에도 php 가 없다 — UI 에서 닿을 수 없다");
 if(info.runLabel!=="PHP") probs.push("RUN_LABEL.php 가 없다");
 graded.forEach(g=>{
   if(g.needRunner) probs.push(g.k+": 앱이 러너 주소를 못 읽었다");
   else if(g.err) probs.push(g.k+": 러너 오류 "+g.err);
   else{
     if(!g.solPass) probs.push(g.k+": 앱 경로에서 정답이 통과하지 않았다 — "+g.out);
     if(g.srcPass) probs.push(g.k+": 앱 경로에서 고장 코드가 통과했다");
   }
 });
 if(errs.length) probs.push("페이지 에러: "+errs.join(" | "));

 console.log(JSON.stringify(info));
 graded.forEach(g=>console.log((g.solPass&&!g.srcPass?"✓ ":"✗ ")+g.k+"  (정답 "+(g.solPass?"통과":"실패")+" · 고장 "+(g.srcPass?"통과":"실패")+")"));
 if(probs.length) console.log("\n✗ "+probs.join("\n✗ "));
 else console.log("\n앱에서 확인 완료 — php 트랙 "+info.units+"유닛 "+info.q+"문항, 러너 판정 정상");
 await b.close();
 process.exit(probs.length?1:0);
})();
