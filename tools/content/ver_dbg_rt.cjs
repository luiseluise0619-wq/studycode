/* dbg_rt.cjs 를 로컬 러너의 실제 컴파일러·테스트 러너로 검증한다.
   sol → 통과, src → 반드시 실패. 둘 다 러너가 판정하며 우리는 번역하지 않는다. */
const Q=require("./dbg_rt.cjs");
const BASE="http://127.0.0.1:8787";
/* rust 는 srcName 을 주면 안 된다 — 러너가 basename 을 취해 src/lib.rs 가 lib.rs 로 납작해지고
   lib 타깃이 사라져 테스트의 use <크레이트> 가 깨진다. 기본값(spec.src)을 그대로 쓴다. */
const SRCNAME={ go:"sol.go", c:"sol.c", cpp:"sol.cpp", java:"Sol.java" };

function post(body){
  return fetch(BASE+"/test",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)})
    .then(r=>r.json());
}
(async()=>{
 let bad=0;
 for(let i=0;i<Q.length;i++){
   const q=Q[i], tag="["+(i+1)+"] "+q.lang.padEnd(4)+" "+q.k;
   const base={language:q.lang, test:q.test, name:q.name, srcName:SRCNAME[q.lang]};
   const a=await post({...base, code:q.sol});
   const b=await post({...base, code:q.src});
   const probs=[];
   if(a.error) probs.push("정답 실행 오류: "+a.error);
   else if(!a.pass) probs.push("정답이 테스트를 통과하지 못함:\n    "+String(a.stdout||a.stderr||"").trim().split("\n").slice(0,8).join("\n    "));
   if(b.error && !/시간 초과/.test(b.error)) probs.push("고장 코드 실행 오류: "+b.error);
   else if(b.pass) probs.push("고장난 코드가 통과함 — 고칠 게 없다");
   if(probs.length){ bad++; console.log("✗ "+tag+"\n  "+probs.join("\n  ")); }
   else console.log("✓ "+tag+"  (정답 통과 · 고장 "+(b.timedOut?"시간초과":"실패")+")");
 }
 console.log("\n"+Q.length+"문항 중 "+bad+"건 문제");
 process.exit(bad?1:0);
})();
