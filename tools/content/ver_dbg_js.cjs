/* dbg_js.cjs 를 앱의 testDoc 하네스와 같은 규칙으로 실제 실행해 검증한다.
     gate  = tests + edge 전부 통과
     품질  = var 금지 · 주석 뺀 28줄 이하 · console.log 금지 (점수에 반영되므로 sol 은 100 이어야 한다)
   확인: sol 은 gate 통과 + 품질 100, src 는 tests 중 하나 이상 실패. */
const vm=require("vm");
const Q=require("./dbg_js.cjs");

function eq(a,b){ try{ return JSON.stringify(a)===JSON.stringify(b); }catch(e){ return String(a)===String(b); } }
function runOne(code, cases){
  const ctx=vm.createContext({});
  try{ vm.runInContext(code, ctx, {timeout:3000}); }
  catch(e){ return cases.map(c=>({ok:false, in:c[0], got:"[코드 에러] "+e.message, exp:c[1]})); }
  return cases.map(c=>{
    try{
      const got=vm.runInContext(c[0], ctx, {timeout:3000});
      const exp=vm.runInContext("("+c[1]+")", ctx, {timeout:3000});
      return {ok:eq(got,exp), in:c[0], got:JSON.stringify(got), exp:c[1]};
    }catch(e){ return {ok:false, in:c[0], got:"[에러] "+e.message, exp:c[1]}; }
  });
}
function quality(src){
  const bad=[];
  if(/\bvar\s/.test(src)) bad.push("var 사용");
  const ln=src.split("\n").filter(l=>l.trim()&&!/^\s*\/\//.test(l)).length;
  if(ln>28) bad.push("줄 수 "+ln+" > 28");
  if(/console\.(log|debug)/.test(src)) bad.push("console.log");
  return bad;
}

let bad=0; const fns=new Set(), stems=new Set();
Q.forEach((q,i)=>{
  const tag="["+(i+1)+"] "+q.k;
  const fail=m=>{ bad++; console.log("✗ "+tag+" — "+m); };
  if(fns.has(q.fn)) fail("함수 이름 중복: "+q.fn); fns.add(q.fn);
  const st=q.q.slice(0,40); if(stems.has(st)) fail("문제 줄기 중복"); stems.add(st);
  if(!/🐛 원인/.test(q.ex)||!/🔧 해결/.test(q.ex)||!/🛡 재발 방지/.test(q.ex)) fail("해설 3단 구성이 아니다");
  if(q.tests.length<4) fail("tests 4개 미만");
  if(!q.edge||q.edge.length<2) fail("edge 2개 미만");
  if(!q.src.includes(q.fn)||!q.sol.includes(q.fn)) fail("함수 이름이 코드에 없다");
  if(q.src===q.sol) fail("src 와 sol 이 같다");

  const qb=quality(q.sol); if(qb.length) fail("sol 품질 감점: "+qb.join(", "));
  const qs=quality(q.src); if(qs.length) fail("src 품질 감점(고치기 전부터 감점되면 원인이 흐려진다): "+qs.join(", "));

  const sc=runOne(q.sol,q.tests), se=runOne(q.sol,q.edge);
  const sf=[...sc,...se].filter(r=>!r.ok);
  if(sf.length) fail("sol 실패: "+sf.map(r=>r.in+" → "+r.got+" (기대 "+r.exp+")").join(" | "));

  const bc=runOne(q.src,q.tests);
  const n=bc.filter(r=>!r.ok).length;
  if(n===0) fail("src 가 전부 통과 — 고칠 게 없다");
  else if(!sf.length&&!qb.length&&!qs.length)
    console.log("✓ "+tag+"  (고장 "+n+"/"+q.tests.length+" · 정답 "+(q.tests.length+q.edge.length)+"/"+(q.tests.length+q.edge.length)+")");
});
console.log("\n"+Q.length+"문항 중 "+bad+"건 문제");
process.exit(bad?1:0);
