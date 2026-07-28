/* 시뮬레이션 문항 검증 — 앱의 simDoc 하네스를 그대로 복제해 실행한다.
     참조 구현: 모든 검사 통과
     시작 코드: 통과하면 안 된다 (풀 게 없다는 뜻)
   앱은 iframe 안에서 돌지만 의미는 동일한 동기 실행이라 node vm 으로 재현한다. */
const vm=require("vm");
const Q=require("./sim_perf.cjs");
function runSim(code, tests){
  const ctx=vm.createContext({});
  const boot=`var FRAMES=[]; var RESULT=null; var ERR=null;
    function clone(v){ try{ return JSON.parse(JSON.stringify(v)); }catch(e){ return String(v); } }
    function snap(label, value, opt){ if(FRAMES.length>400) return;
      FRAMES.push({label:String(label==null?"":label), value:clone(value), opt:clone(opt||{})}); }
    var console={log:function(){}};`;
  vm.runInContext(boot, ctx);
  try{ vm.runInContext(code, ctx, {timeout:4000}); }
  catch(e){ return {err:String(e.message||e), det:tests.map(t=>({d:t.d,ok:false})) }; }
  const det=tests.map(t=>{ try{ return {d:t.d, ok:!!vm.runInContext("("+t.js+")", ctx, {timeout:2000})}; }
                           catch(e){ return {d:t.d, ok:false, why:String(e.message||e)}; } });
  return {det};
}
let bad=0; const stems=new Set();
Q.forEach((q,i)=>{
  const tag="["+String(i+1).padStart(2)+"] "+q.k;
  const probs=[];
  if(!q.tests||q.tests.length<5) probs.push("검사가 5개 미만");
  const st=String(q.q).replace(/<[^>]*>/g,"").slice(0,40);
  if(stems.has(st)) probs.push("문제 줄기 중복"); stems.add(st);
  if(/setTimeout|Promise|async |await |Math\.random/.test(q.ref)) probs.push("참조 구현이 비동기이거나 난수를 쓴다");
  if(!/🎯/.test(q.ex)||String(q.ex).length<200) probs.push("해설이 부실하다");
  if(!/RESULT\s*=/.test(q.src)) probs.push("시작 코드에 RESULT 대입이 없다");

  const r=runSim(q.ref, q.tests);
  if(r.err) probs.push("참조 구현 실행 오류: "+r.err);
  else { const f=r.det.filter(x=>!x.ok);
    if(f.length) probs.push("참조 구현이 통과하지 못함:\n      "+f.map(x=>"✗ "+x.d+(x.why?" ["+x.why+"]":"")).join("\n      ")); }

  const s=runSim(q.src, q.tests);
  const sp=s.err?0:s.det.filter(x=>x.ok).length;
  if(!s.err && sp===q.tests.length) probs.push("시작 코드가 이미 전부 통과 — 풀 게 없다");

  /* 두 번 돌려 같은 결과가 나오는지 (결정적인가) */
  const r2=runSim(q.ref, q.tests);
  if(!r.err && !r2.err && JSON.stringify(r.det)!==JSON.stringify(r2.det)) probs.push("실행할 때마다 결과가 달라진다");

  if(probs.length){ bad++; console.log("✗ "+tag+"\n    "+probs.join("\n    ")); }
  else console.log("✓ "+tag+"  (참조 "+q.tests.length+"/"+q.tests.length+" · 시작 "+sp+"/"+q.tests.length+")");
});
console.log("\n"+Q.length+"문항 중 "+bad+"건 문제");
process.exit(bad?1:0);
