/* 파이썬 디버깅 배치를 앱과 '같은 하네스' 로 실제 python3 에서 돌려 검증한다.
   사용법:  node ver_dbgpy.cjs ./dbg_numpy.cjs
   앱의 pyHarness(index.html)와 문자열까지 동일하게 맞춘다 — 다르면 앱에서만 깨진다. */
const fs=require("fs"), {execFileSync}=require("child_process");
const path=require("path");
const SRC=process.argv[2];
if(!SRC){ console.error("문항 파일을 인자로 주세요: node ver_dbgpy.cjs ./dbg_numpy.cjs"); process.exit(2); }
const Q=require(path.resolve(SRC));
const TMP="/tmp/claude-0/-home-user-studycode/48297e2f-2aa5-53f1-a08c-af741856ba9b/scratchpad/_py.py";

/* 앱의 pyHarness 와 같게 맞춘다 — 검사식이 코루틴을 돌려주면 기다렸다 견준다.
   그러지 않으면 async 문항은 코루틴 객체와 기대값을 견주게 되어 무엇을 써도
   통과하지 못한다. 앱과 같이 5초에서 끊는다. */
function pyHarness(user, tests){
  return user+"\n\n__T="+JSON.stringify(tests.map(t=>[t[0],t[1]]))
    +"\nimport json, inspect, asyncio\n__r=[]\n"
    +"async def __await1(v):\n    return await asyncio.wait_for(v, 5) if inspect.isawaitable(v) else v\n"
    +"async def __run():\n    for __i,__o in __T:\n        try:\n            __g=await __await1(eval(__i))\n            __e=await __await1(eval(__o))\n            __r.append([bool(__g==__e), __i, repr(__g), __o])\n        except Exception as __ex:\n            __r.append([False, __i, '[에러] '+str(__ex), __o])\n"
    +"asyncio.run(__run())\nprint(json.dumps(__r, ensure_ascii=False))";
}
function run(user, tests){
  if(!tests||!tests.length) return [];
  fs.writeFileSync(TMP, pyHarness(user,tests));
  try{ return JSON.parse(execFileSync("python3",["-I",TMP],{timeout:15000,encoding:"utf8"})); }
  catch(e){ return tests.map(t=>[false,t[0],"[하네스 실패] "+String(e.stderr||e.message).split("\n").slice(-4).join(" "),t[1]]); }
}

let bad=0; const fns=new Set(), stems=new Set();
Q.forEach((q,i)=>{
  const tag="["+(i+1)+"] "+q.k;
  const fail=m=>{ bad++; console.log("✗ "+tag+" — "+m); };

  if(fns.has(q.fn)) fail("함수 이름 중복: "+q.fn); fns.add(q.fn);
  const stem=q.q.slice(0,40); if(stems.has(stem)) fail("문제 줄기 중복"); stems.add(stem);
  /* 7차에 이모지를 걷어내면서 정규식 안에 진짜 개행이 들어가 깨져 있었다.
     원래 뜻은 '해설에 원인·해결·재발 방지가 각각 있는가' 다. */
  if(!/원인/.test(q.ex)||!/해결/.test(q.ex)||!/재발\s*방지/.test(q.ex)) fail("해설에 원인·해결·재발방지가 없다");
  if(q.tests.length<4) fail("tests 가 4개 미만");
  if(!q.edge||q.edge.length<1) fail("edge 가 없다");
  if(!q.src.includes("def "+q.fn)) fail("src 에 def "+q.fn+" 이 없다");
  if(!q.sol.includes("def "+q.fn)) fail("sol 에 def "+q.fn+" 이 없다");
  if(q.src===q.sol) fail("src 와 sol 이 같다");

  /* 1. src 는 문법 오류가 아니어야 한다 */
  fs.writeFileSync(TMP, q.src);
  try{ execFileSync("python3",["-I","-m","py_compile",TMP],{timeout:10000,stdio:"pipe"}); }
  catch(e){ fail("src 가 문법 오류다 — 디버깅 문항이 아니라 오타 찾기가 된다"); }

  /* 2. sol 은 tests + edge 를 전부 통과 */
  const sc=run(q.sol,q.tests), se=run(q.sol,q.edge);
  const solFail=[...sc,...se].filter(r=>!r[0]);
  if(solFail.length) fail("sol 이 실패: "+solFail.map(r=>r[1]+" → "+r[2]+" (기대 "+r[3]+")").join(" | "));

  /* 3. src 는 tests 중 최소 하나를 실패해야 한다 */
  const bc=run(q.src,q.tests);
  const brokeN=bc.filter(r=>!r[0]).length;
  if(brokeN===0) fail("src 가 전부 통과한다 — 고칠 게 없는 가짜 디버깅");
  else console.log("✓ "+tag+"  (고장 "+brokeN+"/"+q.tests.length+" · 정답 "+(q.tests.length+q.edge.length)+"/"+(q.tests.length+q.edge.length)+")");
});
console.log("\n"+Q.length+"문항 중 "+bad+"건 문제");
process.exit(bad?1:0);
