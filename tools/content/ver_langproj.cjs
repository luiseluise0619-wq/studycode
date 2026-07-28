/* 언어 빌드 랩 검증 — 실제 컴파일러·테스트 러너가 판정한다.
   Day 마다 두 방향을 확인한다:
     1. 그 시점의 '시작 파일'(직전 Day 의 해답, Day1 은 시드)로는 통과하지 못한다 — 할 일이 남아 있어야 미션이다
     2. 그 Day 의 참조 해답으로는 통과한다 — 요구사항이 실제로 만족 가능해야 한다
   엔진 테스트는 오프라인이어야 해서 이 확인을 여기서 따로 한다. */
const LAB=require(process.argv[2]||"./lab_lang1.cjs");
const BASE=process.env.RUNNER||"http://127.0.0.1:8787";

function post(body){
  return fetch(BASE+"/test",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify(body)}).then(r=>r.json());
}
(async()=>{
  let bad=0;
  for(const p of LAB.projects){
    const sols=LAB.sol[p.id];
    if(!sols||sols.length!==p.days.length){ console.log("✗ "+p.id+": 참조 해답 수가 Day 수와 다르다"); bad++; continue; }
    let cur=p.seed[p.mainFile];          /* 이 Day 를 시작할 때의 파일 상태 */
    for(let i=0;i<p.days.length;i++){
      const d=p.days[i], tag="["+p.id+" Day"+d.n+"] "+d.title;
      const base={ language:p.lang, test:d.rt.test, name:p.id };
      if(p.srcName) base.srcName=p.srcName;   /* rust 는 주면 lib 타깃이 깨지므로 문항이 비워 둔다 */

      const start=await post({...base, code:cur});
      const fin=await post({...base, code:sols[i][p.mainFile]});
      const probs=[];
      if(start.pass) probs.push("시작 상태로 이미 통과한다 — 이 Day 에 할 일이 없다");
      if(fin.error) probs.push("참조 해답 실행 오류: "+fin.error);
      else if(!fin.pass) probs.push("참조 해답이 통과하지 못함:\n    "+
        String(fin.stdout||fin.stderr||"").trim().split("\n").slice(0,10).join("\n    "));
      if(!d.rt||!d.rt.test||!Object.keys(d.rt.test).length) probs.push("러너 테스트 파일이 없다");
      if(!Array.isArray(d.req)||d.req.length<3) probs.push("요구사항 3개 미만");
      if(!Array.isArray(d.tests)||d.tests.length<4) probs.push("수용 기준 4개 미만");
      if(!d.hint||d.hint.length<40) probs.push("힌트가 부실하다");

      if(probs.length){ bad++; console.log("✗ "+tag+"\n  "+probs.join("\n  ")); }
      else console.log("✓ "+tag+"  (시작 미통과 · 해답 통과)");
      cur=sols[i][p.mainFile];           /* 다음 Day 는 이 날의 해답 위에서 이어진다 */
    }
  }
  const days=LAB.projects.reduce((a,p)=>a+p.days.length,0);
  console.log("\n"+LAB.projects.length+"개 프로젝트 · "+days+" Day 중 "+bad+"건 문제");
  process.exit(bad?1:0);
})();
