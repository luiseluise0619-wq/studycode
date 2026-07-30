/* exec_php.cjs 를 로컬 러너의 실제 php 로 검증한다.
   sol → 통과, src → 반드시 실패. 판정은 러너가 하고 우리는 번역하지 않는다. */
const Q=require("./exec_php.cjs");
const BASE="http://127.0.0.1:8787";

function post(body){
  return fetch(BASE+"/test",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)})
    .then(r=>r.json());
}
(async()=>{
 let bad=0;
 for(let i=0;i<Q.length;i++){
   const q=Q[i], tag="["+(i+1)+"] php  "+q.k;
   const base={language:"php", test:q.test};
   const a=await post({...base, code:q.sol});
   const b=await post({...base, code:q.src});
   const probs=[];
   if(a.error) probs.push("정답 실행 오류: "+a.error);
   else if(!a.pass) probs.push("정답이 테스트를 통과하지 못함:\n    "+String(a.stdout||a.stderr||"").trim().split("\n").slice(0,8).join("\n    "));
   if(b.error && !/시간 초과/.test(b.error)) probs.push("고장 코드 실행 오류: "+b.error);
   else if(b.pass) probs.push("고장난 코드가 통과함 — 고칠 게 없다");
   if(!q.ex||q.ex.length<200) probs.push("해설이 부실하다("+((q.ex||"").length)+"자)");
   if(!q.q||q.q.length<60) probs.push("문제 설명이 부실하다");
   if(probs.length){ bad++; console.log("✗ "+tag+"\n  "+probs.join("\n  ")); }
   else console.log("✓ "+tag+"  (정답 통과 · 고장 "+(b.timedOut?"시간초과":"실패")+")");
 }
 console.log("\n"+Q.length+"문항 중 "+bad+"건 문제");
 process.exit(bad?1:0);
})();
