/* 설계 문항 검증 — 앱의 archRun 과 같은 방식으로 검사식을 D 위에서 평가한다.
     1. src 가 올바른 JSON 이고, 그대로는 통과하지 못한다 (풀 게 남아 있다)
     2. ref(참조 설계)는 모든 검사를 통과한다 (요건이 실제로 만족 가능하다)
   2번이 없으면 '아무도 못 푸는 문항' 이 그대로 들어간다. */
const Q=require("./arch_new.cjs");
function runTests(tests, D){
  return tests.map(t=>{ let ok=false, err="";
    try{ ok=!!Function("D","return ("+t.js+")")(D); }catch(e){ err=String(e.message||e); }
    return {d:t.d, ok, err}; });
}
let bad=0; const stems=new Set();
Q.forEach((q,i)=>{
  const tag="["+String(i+1).padStart(2)+"] "+q.kind.padEnd(5)+" "+q.k;
  const probs=[];
  if(!["erd","api","cloud"].includes(q.kind)) probs.push("kind 가 erd/api/cloud 가 아니다");
  if(!q.tests || q.tests.length<4) probs.push("검사가 4개 미만");
  const st=String(q.q).replace(/<[^>]*>/g,"").slice(0,40);
  if(stems.has(st)) probs.push("문제 줄기 중복"); stems.add(st);
  let src=null;
  try{ src=JSON.parse(q.src); }catch(e){ probs.push("src 가 올바른 JSON 이 아니다: "+e.message); }
  if(src){
    const r=runTests(q.tests, src);
    const passed=r.filter(x=>x.ok).length;
    if(passed===q.tests.length) probs.push("시작 설계가 이미 전부 통과 — 풀 게 없다");
    const crash=r.filter(x=>x.err && !/Cannot read|undefined|not a function|null/.test(x.err));
    if(crash.length) probs.push("검사식이 예상 밖 오류: "+crash.map(x=>x.d+" → "+x.err).join(" | "));
  }
  const rr=runTests(q.tests, q.ref);
  const fail=rr.filter(x=>!x.ok);
  if(fail.length) probs.push("참조 설계가 통과하지 못함:\n      "+fail.map(x=>"✗ "+x.d+(x.err?"  ["+x.err+"]":"")).join("\n      "));
  if(!/💡|⚠️|🔧|📈/.test(q.ex)) probs.push("해설에 보충 설명이 없다");
  if(String(q.ex).length<200) probs.push("해설이 200자 미만");
  if(probs.length){ bad++; console.log("✗ "+tag+"\n    "+probs.join("\n    ")); }
  else { const sp=runTests(q.tests, src).filter(x=>x.ok).length;
    console.log("✓ "+tag+"  (시작 "+sp+"/"+q.tests.length+" · 참조 "+q.tests.length+"/"+q.tests.length+")"); }
});
console.log("\n"+Q.length+"문항 중 "+bad+"건 문제");
process.exit(bad?1:0);
