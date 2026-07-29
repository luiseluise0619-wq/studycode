/* dbg_js.cjs 를 앱의 testDoc 하네스와 같은 규칙으로 실제 실행해 검증한다.
     gate  = tests + edge 전부 통과
     품질  = var 금지 · 주석 뺀 28줄 이하 · console.log 금지 (점수에 반영되므로 sol 은 100 이어야 한다)
   확인: sol 은 gate 통과 + 품질 100, src 는 tests 중 하나 이상 실패. */
const vm=require("vm");
const Q=require("./exec_sysnet.cjs");

function eq(a,b){ try{ return JSON.stringify(a)===JSON.stringify(b); }catch(e){ return String(a)===String(b); } }
/* 앱의 testDoc 은 tests 와 edge 를 '같은 문서' 안에서 이어서 돌린다 —
   상태를 가진 핸들러(멱등키·레이트리밋·버전)는 그 순서에 의존한다.
   검증기도 한 컨텍스트에서 이어 돌려야 앱과 같은 판정이 나온다. */
function runBoth(code, tests, edge){
  const ctx=vm.createContext({URL, TextEncoder, TextDecoder});  /* 브라우저에 있는 전역을 맞춰 준다 */
  try{ vm.runInContext(code, ctx, {timeout:3000}); }
  catch(e){ const mk=c=>({ok:false,in:c[0],got:"[코드 에러] "+e.message,exp:c[1]});
            return {t:(tests||[]).map(mk), e:(edge||[]).map(mk)}; }
  const run=cases=>(cases||[]).map(c=>{
    try{
      const got=vm.runInContext(c[0], ctx, {timeout:3000});
      const exp=vm.runInContext("("+c[1]+")", ctx, {timeout:3000});
      return {ok:eq(got,exp), in:c[0], got:JSON.stringify(got), exp:c[1]};
    }catch(e){ return {ok:false, in:c[0], got:"[에러] "+e.message, exp:c[1]}; }
  });
  return {t:run(tests), e:run(edge)};
}
function runOne(code, cases){
  const ctx=vm.createContext({URL, TextEncoder, TextDecoder});  /* 브라우저에 있는 전역을 맞춰 준다 */
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
  const st=q.q.slice(0,40); if(stems.has(st)) fail("문제 줄기 중복"); stems.add(st);
  if(!/🎯/.test(q.ex)) fail("해설에 요지가 없다");
  if(String(q.ex).length<200) fail("해설이 200자 미만");
  if(q.tests.length<4) fail("tests 4개 미만");
  if(!q.edge||q.edge.length<2) fail("edge 2개 미만");
  if(q.src===q.sol) fail("src 와 sol 이 같다");

  /* testDoc 하네스는 사용자 코드와 '같은 블록' 에 자기 변수들을 선언한다.
     이름이 겹치면 브라우저에서 SyntaxError 가 나는데 node vm 에서는 재현되지 않는다. */
  const RESERVED=["SRC","TS","EG","PF","esc","sh","eq","P","row","Cp","Ch","Ep","Eh",
    "perfScore","perfMs","perfOk","qr","qp","qScore","comps","impl","PG","gate","gcol","gtxt",
    "bar","parts","eh","ph","qn","__out"];
  const declared=[...String(q.sol).matchAll(/(?:^|\n)\s*(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]);
  const clash=declared.filter(n=>RESERVED.indexOf(n)>=0);
  if(clash.length) fail("하네스가 쓰는 이름과 겹친다(브라우저에서만 SyntaxError): "+clash.join(", "));

  const qb=quality(q.sol); if(qb.length) fail("sol 품질 감점: "+qb.join(", "));
  const qs=[];

  const both=runBoth(q.sol,q.tests,q.edge);
  const sc=both.t, se=both.e;
  const sf=[...sc,...se].filter(r=>!r.ok);
  if(sf.length) fail("sol 실패: "+sf.map(r=>r.in+" → "+r.got+" (기대 "+r.exp+")").join(" | "));

  const bc=runBoth(q.src,q.tests,q.edge).t;
  const n=bc.filter(r=>!r.ok).length;
  if(n===0) fail("시작 코드가 이미 전부 통과 — 구현할 게 없다");
  else if(!sf.length&&!qb.length&&!qs.length)
    console.log("✓ "+tag+"  (고장 "+n+"/"+q.tests.length+" · 정답 "+(q.tests.length+q.edge.length)+"/"+(q.tests.length+q.edge.length)+")");
});
const byTrack={}; Q.forEach(q=>byTrack[q.track]=(byTrack[q.track]||0)+1);
console.log("\n트랙별: "+Object.keys(byTrack).map(k=>k+" "+byTrack[k]).join(" · "));
console.log(Q.length+"문항 중 "+bad+"건 문제");
process.exit(bad?1:0);
