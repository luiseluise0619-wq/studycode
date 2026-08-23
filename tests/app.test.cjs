/* 브라우저에서 실제 앱을 열고 확인하는 회귀 테스트.
   PLAYWRIGHT 가 없으면 조용히 건너뛴다(로컬에서 엔진 테스트만 돌릴 수 있게). */
const path=require("path");
const fs=require("fs");
let chromium;
try { chromium=require("playwright").chromium; }
catch(e){ console.log("playwright 미설치 — 브라우저 테스트를 건너뜁니다."); process.exit(0); }

const FILE="file://"+path.join(__dirname,"..","index.html");
const EXEC=process.env.PLAYWRIGHT_CHROMIUM || undefined;

let pass=0, fail=0;
const TRACE=!!process.env.CR_TRACE;
function check(name, cond, detail){
  if(TRACE) console.log((cond?"  ok  ":"  NO  ")+name);
  if(cond) pass++;
  else { fail++; console.log("FAIL  "+name+(detail?("\n      "+JSON.stringify(detail)):"")); }
}

(async()=>{
 const browser=await chromium.launch(EXEC?{executablePath:EXEC}:{});
 const errs=[];
 /* 앱은 셸만 먼저 뜨고 문항은 청크로 따라온다. 테스트는 필요한 청크를 명시적으로 기다린다.
    opt.all=true 면 32개 트랙을 전부 받는다(전수 검사용, 느리다). */
 async function page(state, opt){
   const p=await browser.newPage({viewport:{width:390,height:800}});
   p.on("pageerror",e=>errs.push("pageerror: "+e.message));
   await p.addInitScript(s=>{ try{ localStorage.setItem("coderun", JSON.stringify(s)); }catch(e){} },
     Object.assign({onboarded:true, goal:"free", freeMode:true}, state||{}));
   await p.goto(FILE);
   await p.waitForFunction(()=>typeof COURSES!=="undefined", {timeout:60000});
   await p.evaluate(()=>Promise.all([ensureTrack(curLang), ensureProjects(), ensureSims(), ensureDiags(), ensureBuild()]));
   if(opt&&opt.all){
     await p.evaluate(()=>Promise.all(Object.keys(COURSES).map(k=>ensureTrack(k))), null);
     await p.waitForFunction(()=>Object.keys(COURSES).every(k=>trackLoaded(k)), {timeout:120000});
   }
   await p.evaluate(()=>{ renderCourse(); });
   await p.waitForTimeout(700);
   return p;
 }

 /* ---------- 분할된 앱 셸이 먼저 뜨고, 문항은 뒤따라 온다 ---------- */
 {
  const fs=require("fs");
  const shell=fs.statSync(path.join(__dirname,"..","index.html")).size;
  check("셸(index.html)이 600KB 미만이다", shell<600*1024, {bytes:shell});
  const dataDir=path.join(__dirname,"..","data");
  const files=fs.readdirSync(dataDir);
  /* 트랙 수는 COURSES 와 청크가 1:1 이어야 한다. 트랙을 늘릴 때 이 숫자도 함께 올린다 */
  check("트랙 청크가 34개 있다", files.filter(f=>/^t-.+\.js$/.test(f)).length===34,
        {n:files.filter(f=>/^t-.+\.js$/.test(f)).length});
  check("시뮬·진단·프로젝트·SQL 청크가 있다",
        ["sims.js","diags.js","projects.js","sql-wasm.js","sql-lib.js"].every(f=>files.indexOf(f)>=0), files);

  const p=await browser.newPage({viewport:{width:390,height:800}});
  const asked=[];
  p.on("pageerror",e=>errs.push("pageerror: "+e.message));
  p.on("request",r=>{ const u=r.url(); if(u.indexOf("/data/")>=0) asked.push(u.split("/").pop()); });
  await p.addInitScript(s=>{ try{ localStorage.setItem("coderun", JSON.stringify(s)); }catch(e){} },
    {onboarded:true, goal:"free", freeMode:true});
  await p.goto(FILE);
  await p.waitForFunction(()=>document.querySelectorAll(".node").length>0, {timeout:60000});
  const early=await p.evaluate(()=>({
    nodes:document.querySelectorAll(".node").length,
    tracks:Object.keys(COURSES).length,
    loaded:Object.keys(COURSES).filter(k=>trackLoaded(k))
  }));
  check("문항 없이도 트랙 지도가 그려진다", early.nodes>0 && early.tracks===34, early);
  check("첫 화면에 다른 트랙은 받지 않는다", asked.filter(f=>/^t-/.test(f)).length<=1, asked.slice(0,8));
  await p.waitForFunction(()=>trackLoaded(curLang), {timeout:60000});
  const after=await p.evaluate(()=>{
    let q=0, th=0; COURSES[curLang].units.forEach(u=>u.lessons.forEach(l=>{ q+=(l.q||[]).length; if(l.theory) th++; }));
    return {q, th};
  });
  check("현재 트랙 청크가 붙으면 문항과 이론이 생긴다", after.q>500 && after.th>100, after);
  const other=await p.evaluate(()=>ensureTrack("go").then(()=>{
    let q=0; COURSES.go.units.forEach(u=>u.lessons.forEach(l=>q+=(l.q||[]).length)); return q;
  }));
  check("다른 트랙도 요청 시 붙는다", other>100, {go:other});
  const sqlOk=await p.evaluate(()=>ensureSqlLib().then(()=>typeof initSqlJs==="function").catch(()=>false));
  check("SQL 엔진이 필요할 때만 늦게 로드된다", sqlOk===true);
  await p.close();
 }

 /* ---------- 콘텐츠 무결성 ---------- */
 {
  const p=await page(null,{all:true});
  const r=await p.evaluate(()=>{
    let units=0, lessons=0, qs=0, noTheory=0, badTheory=0, badChoice=0, badLog=0, badReview=0;
    /* 실행해 볼 수 있는 트랙에서 '출력 맞히기' 를 선택형으로 내면 실행형이 할 일을 뺏는다 */
    const HANDS=/무엇이 출력|무엇을 (출력|반환)|출력 결과|실행 결과는|반환값은|이 코드의 결과/;
    const RUNNABLE=new Set(["python","sql","javascript","java","c","cpp","go","rust","react","web","code","algo"]);
    let handsChoice=0;
    const byType={};
    for(const k in COURSES) COURSES[k].units.forEach(u=>{ units++; u.lessons.forEach(l=>{
      lessons++;
      const t=l.theory;
      if(!t) noTheory++;
      else if(!t.sum || !Array.isArray(t.body) || t.body.length<2 || !t.code || !t.code.c ||
              !Array.isArray(t.key) || !t.key.length) badTheory++;
      l.q.forEach(q=>{
        qs++; byType[q.t||"choice"]=(byType[q.t||"choice"]||0)+1;
        if((q.t||"choice")==="choice" && RUNNABLE.has(k) &&
           HANDS.test(String(q.q||"").replace(/<[^>]*>/g,""))) handsChoice++;
        if((q.t||"choice")==="choice"){
          if(!Array.isArray(q.o) || q.o.length!==4) badChoice++;
          else if(!(q.a>=0 && q.a<q.o.length)) badChoice++;
          else if(new Set(q.o.map(String)).size!==4) badChoice++;      // 완전 동일한 보기
          else {
            // 공백만 다른 보기는, 앱이 공백을 보이게 렌더할 때만 허용된다 (showQ 의 wsSig 규칙과 동일)
            const wsSig=q.o.some(o=>/^\s|\s$|\s\s/.test(String(o)));
            if(!wsSig && new Set(q.o.map(x=>String(x).replace(/\s+/g," ").trim())).size!==4) badChoice++;
          }
        }
        if(q.t==="log"){
          const bad=(q.items||[]).filter(x=>x.bad).length;
          if(!q.items || q.items.length<6 || bad<1 || bad>=q.items.length) badLog++;
        }
        if(q.t==="review"){
          // 결함이 하나도 없거나 전부 결함이면 '모두 고르기'가 훈련이 되지 않는다
          const bad=(q.items||[]).filter(x=>x.bad).length;
          if(!q.items || q.items.length<4 || bad<1 || bad>=q.items.length) badReview++;
          else {
            const norm=q.items.map(x=>String(x.txt).replace(/\s+/g," ").trim());
            if(new Set(norm).size!==norm.length) badReview++;      // 후보 중복 = 채점 불가
          }
          if(!q.code) badReview++;
        }
      });
    });});
    const introMissing=Object.keys(COURSES).filter(k=>!TRACK_INTRO[k]);
    /* 트랙별 유형 분포 — 콘텐츠 정책(docs/CONTENT_POLICY.md) 강제용 */
    const perTrack={};
    for(const k in COURSES){ const c={};
      COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
        const t=q.t||"choice"; c[t]=(c[t]||0)+1;
        c.exec=(c.exec||0)+((t==="code"||t==="py"||t==="sql"||t==="html"||t==="react"||t==="ts"||t==="sim"||t==="arch")?1:0);
        if(q.cat) c["cat:"+q.cat]=(c["cat:"+q.cat]||0)+1;
      })));
      perTrack[k]=c; }
    return {units, lessons, qs, byType, handsChoice, noTheory, badTheory, badChoice, badLog, badReview,
            introMissing, perTrack, missions:GIT_MISSIONS.length, sims:SIMS.length, diags:DIAGS.length};
  });
  /* 셸(index.html)의 n 과 데이터 청크의 실제 문항 수가 어긋나면 목록에 잘못된 개수가 표시된다.
     주입기가 검증 실패 시 일부 파일만 저장해 실제로 이 상태가 만들어진 적이 있어 검사로 고정한다. */
  const nMismatch=await p.evaluate(()=>{
    const bad=[];
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>{
      if(Array.isArray(l.q) && typeof l.n==="number" && l.q.length!==l.n)
        bad.push(k+"/"+u.title+"/"+l.title+" n="+l.n+" 실제="+l.q.length);
    }));
    return bad;
  });
  check("셸의 문항 수와 데이터의 실제 문항 수가 일치한다", nMismatch.length===0, nMismatch.slice(0,5));

  check("모든 레슨에 이론이 있다", r.noTheory===0, {noTheory:r.noTheory});
  check("이론이 요약·본문2절·예제·요점을 모두 갖춘다", r.badTheory===0, {badTheory:r.badTheory});
  check("선택형은 4개의 서로 다른 보기와 유효한 정답을 갖는다", r.badChoice===0, {badChoice:r.badChoice});

  /* 정답이 특정 자리에 쏠리면 내용을 몰라도 찍어서 맞는다. 한때 0번이 41.7% 였다.
     자리에 뜻이 있는 보기(위 모두 · 정답 없음)와 번호를 참조하는 문항은 섞지 않으므로
     정확히 25% 가 되지는 않는다 — 여유를 두고 상한만 건다. */
  const spread=await p.evaluate(()=>{
    const c=[0,0,0,0]; let n=0;
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
      if((q.t||"choice")!=="choice") return;
      if(!Array.isArray(q.o)||q.o.length!==4) return;
      if(!(q.a>=0&&q.a<4)) return;
      c[q.a]++; n++;
    })));
    return {n, c, pct:c.map(v=>+(v/n*100).toFixed(1))};
  });
  check("선택형 정답 위치가 한 자리에 쏠리지 않는다", spread.pct.every(v=>v>=18&&v<=32), spread);
  check("로그 문항 구조가 올바르다", r.badLog===0, {badLog:r.badLog});
  check("리뷰 문항 구조가 올바르다", r.badReview===0, {badReview:r.badReview});
  /* 설계 문항: 시작 설계가 올바른 JSON 이고, 요건 검사가 4개 이상이어야 한다 */
  const archChk=await p.evaluate(()=>{
    let n=0, badJson=0, fewTests=0, badKind=0;
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
      if(q.t!=="arch") return; n++;
      try{ JSON.parse(q.src); }catch(e){ badJson++; }
      if(!Array.isArray(q.tests)||q.tests.length<4) fewTests++;
      if(["erd","api","cloud"].indexOf(q.kind)<0) badKind++;
    })));
    return {n, badJson, fewTests, badKind};
  });
  check("설계 문항의 시작 설계가 올바른 JSON 이다", archChk.badJson===0, archChk);
  check("설계 문항이 요건 검사를 4개 이상 갖는다", archChk.fewTests===0, archChk);
  check("설계 문항의 종류가 erd·api·cloud 중 하나다", archChk.badKind===0, archChk);
  /* 레슨 제목은 진도 키(유닛제목+레슨제목 해시)의 재료다. 같은 유닛에서 제목이 겹치면
     한 레슨을 끝냈을 때 겹친 레슨들이 함께 완료로 표시된다 — 조용히 진도가 날아간다.
     제목 생성기가 로마 숫자를 다 써서 "... undefined" 를 뱉은 적이 있어 함께 막는다. */
  const titleChk=await p.evaluate(()=>{
    const undef=[], collide=[];
    for(const k in COURSES){
      const seen={};
      COURSES[k].units.forEach(u=>u.lessons.forEach(l=>{
        if(/undefined|\[object /.test(l.title)) undef.push(k+" / "+u.title+" / "+l.title);
        const key=u.title+"  "+l.title;
        if(seen[key]) collide.push(k+" / "+key); else seen[key]=1;
      }));
    }
    return {undef, collide};
  });
  check("레슨 제목에 undefined 가 없다", titleChk.undef.length===0, titleChk.undef.slice(0,5));
  check("같은 유닛에서 레슨 제목이 겹치지 않는다 (진도 키 충돌)", titleChk.collide.length===0, titleChk.collide.slice(0,5));

  /* cat 값이 CATMAP/CN 밖이면 배지가 사라지고 코치 표에 영어 키가 그대로 나온다 */
  const catChk=await p.evaluate(()=>{
    const VALID=new Set(["debug","review","perf","design","ops","interview","internals","logs","security","predict","knowledge","impl"]);
    const bad={};
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
      if(q.cat && !VALID.has(q.cat)) bad[q.cat]=(bad[q.cat]||0)+1;
    })));
    return bad;
  });
  check("모든 cat 값이 앱이 아는 범주다", Object.keys(catChk).length===0, catChk);

  /* 시뮬레이션 채점 계약: 시작 코드는 통과하면 안 되고(통과하면 문제가 성립하지 않는다),
     테스트 식은 RESULT·FRAMES 만 볼 수 있다(사용자 코드의 const 는 블록 스코프라 안 보인다).
     iframe 없이 simDoc 과 같은 스코프를 만들어 전부 돌려 본다. */
  const simChk=await p.evaluate(()=>{
    const passes=[], throws=[];
    let n=0;
    const run=(userCode, tests)=>{
      const src='var TS='+JSON.stringify(tests||[])+';var FRAMES=[],LOG="";'
        +'function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(e){return String(v);} }'
        +'function snap(label, value, opt){ if(FRAMES.length>400) return;'
        +'FRAMES.push({label:String(label==null?"":label), value:clone(value), opt:clone(opt||{})}); }'
        +'var RESULT=null, ERR=null;'
        +'try{'+userCode+'\n}catch(e){ ERR=String(e&&e.message||e); }'
        +'var pass=0, scopeErr=0;'
        +'if(!ERR){ for(var i=0;i<TS.length;i++){ var ok=false;'
        +'try{ ok=!!eval(TS[i].js); }catch(e){ if(/is not defined/.test(String(e&&e.message))) scopeErr++; }'
        +'if(ok)pass++; } }'
        +'return {gate:!ERR&&TS.length>0&&pass===TS.length, scopeErr:scopeErr};';
      try{ return new Function(src)(); }catch(e){ return {gate:false, scopeErr:0, boom:String(e)}; }
    };
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
      if(q.t!=="sim"||!q.tests||!q.tests.length) return;
      n++;
      const r=run(q.src, q.tests);
      if(r.gate) passes.push(k+" / "+l.t+" · "+(q.k||""));
      if(r.scopeErr) throws.push(k+" / "+l.t+" · 테스트가 사용자 코드 이름을 참조("+r.scopeErr+")");
    })));
    return {n, passes, throws};
  });
  check("시뮬레이션 시작 코드는 통과하지 않는다", simChk.passes.length===0, {n:simChk.n, 통과해버림:simChk.passes.slice(0,5)});
  check("시뮬레이션 테스트가 RESULT·FRAMES 만 참조한다", simChk.throws.length===0, simChk.throws.slice(0,5));

  /* 트랙 청크는 그 트랙을 열 때 통째로 받는다. 한 파일이 몇 MB 로 불면 첫 화면이 그만큼 늦는다.
     C 트랙은 테스트 프레임워크가 문항마다 복제돼 11.8MB 까지 갔던 적이 있다 —
     공용 파일은 data/rt-shared.js 로 빼고 실행 채점 때만 받는다. */
  const chunkDir=path.join(__dirname,"..","data");
  const tooBig=fs.readdirSync(chunkDir).filter(f=>/^t-.*\.js$/.test(f))
    .map(f=>({f, mb:+(fs.statSync(path.join(chunkDir,f)).size/1048576).toFixed(2)}))
    .filter(x=>x.mb>3);
  check("트랙 청크가 3MB 를 넘지 않는다", tooBig.length===0, tooBig);

  /* 실행형(js) 문항도 같은 함정이 있다 — 시작 코드가 이미 모든 테스트를 통과하면
     그 문항은 아무것도 가르치지 않고 그냥 통과된다. index.html 의 testDoc() 이
     코드를 인라인한 뒤 각 테스트 식을 eval 하고 JSON 문자열로 비교하므로 같게 흉내 낸다.
     여기서 확인하려는 것은 '통과하지 않는다' 뿐이라, 앱처럼 프라미스를 기다리지 않고
     '아직 안 통과' 로 본다 — 다만 거부된 프라미스를 그냥 두면 프로세스가 죽으므로
     빈 catch 를 붙여 삼킨다. 시작 코드가 찍는 로그도 테스트 출력에 섞이지 않게 막는다.

     복잡도 개선 문항은 예외로 둔다 — 시작 코드도 정답은 맞고, 느리다는 것만이 잘못이라
     '통과하면 안 된다' 를 정확성으로 판정할 수 없다. 이런 문항은 엣지 테스트 안에서
     Date.now() 로 시간을 재 통과 여부를 가르는데, 그 판정은 기계 속도에 따라 달라져
     검사 자체가 들쭉날쭉해진다. 그래서 시간을 재는 문항은 세어서 알리고 건너뛴다. */
  const jsCode=[], timed=[];
  fs.readdirSync(chunkDir).filter(f=>/^t-.*\.js$/.test(f)).forEach(f=>{
    const m=fs.readFileSync(path.join(chunkDir,f),"utf8").match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    if(!m) return;
    JSON.parse(m[2]).forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>{
      if(!(q.t==="code"&&q.run==="js"&&Array.isArray(q.tests)&&q.tests.length&&q.src)) return;
      const all=[...q.tests,...(q.edge||[])];
      const row={t:m[1], u:u.t, l:l.t, k:q.k||"", src:q.src, all};
      if(all.some(x=>/Date\.now\(\)|performance\.now\(\)/.test(x.in+x.out))) timed.push(row);
      else jsCode.push(row);
    })));
  });
  const freePass=[];
  const realLog=console.log, realErr=console.error, realWarn=console.warn, hush=()=>{};
  /* 시작 코드는 대개 undefined 를 돌려주므로, 테스트 식이 인자로 만든 프라미스가
     아무에게도 잡히지 않은 채 남을 수 있다 (예: withTimeout(Promise.reject(...), 50)).
     노드는 그것만으로 프로세스를 죽이지만 브라우저는 경고만 낸다 — 앱과 같은
     조건에서 판정해야 하므로 삼킨다. 거부가 감지되는 것은 다음 틱이라 검사가
     끝난 뒤에도 남아 있어야 하고, 대신 몇 건을 삼켰는지 세어 함께 알린다. */
  let swallowed=0;
  process.on("unhandledRejection", ()=>{ swallowed++; });
  jsCode.forEach(x=>{
    let rows;
    console.log=hush; console.error=hush; console.warn=hush;
    try{
      rows=new Function("__ALL", x.src+"\n"+
        'const __eq=(a,b)=>{try{return JSON.stringify(a)===JSON.stringify(b);}catch(e){return String(a)===String(b);}};'+
        'const __no=()=>{};'+
        'const __sync=(v)=>{ if(v&&typeof v.then==="function"){ v.then(__no,__no); return Symbol("pending"); } return v; };'+
        'return __ALL.map(t=>{try{'+
        '  const got=__sync(eval(t.in)), exp=__sync(eval("("+t.out+")"));'+
        '  return typeof got==="symbol"||typeof exp==="symbol" ? false : __eq(got,exp);'+
        '}catch(e){return false;}});')(x.all);
    }catch(e){ rows=null; }   /* 시작 코드가 문법 오류면 통과할 리 없다 */
    finally{ console.log=realLog; console.error=realErr; console.warn=realWarn; }
    if(rows&&rows.length&&rows.every(Boolean)) freePass.push(x.t+" / "+x.u+" / "+x.l+" · "+x.k);
  });
  check("실행형(js) 시작 코드는 통과하지 않는다", freePass.length===0,
    {검사:jsCode.length, 시간으로가르는문항은따로검사:timed.length, 삼킨거부:swallowed, 통과해버림:freePass.slice(0,5)});

  /* 시간으로 가르는 문항은 위 검사로 판정할 수 없으니 여기서 따로 본다.
     느린 시작 코드가 예산을 얼마나 넘는지가 이 문항들의 생명이다 — 여유가 1.3배까지
     좁아져 있었고, 그래서 조금 빠른 기계에서는 아무것도 고치지 않아도 통과됐다.
     넉넉히 넘는지(3배 이상) 재서, 부하를 줄이거나 예산을 올리면 바로 드러나게 한다. */
  const thin=[], margins=[];
  timed.forEach(x=>{
    const edge=x.all[x.all.length-1];
    const bud=+(String(edge.in).match(/Date\.now\(\)\s*-\s*t\s*<\s*(\d+)/)||[])[1];
    if(!bud) return;
    const naked=String(edge.in).replace(/,\s*Date\.now\(\)\s*-\s*t\s*<\s*\d+/,"");
    let ms=-1;
    console.log=hush; console.error=hush; console.warn=hush;
    try{
      ms=new Function("__IN", x.src+"\nconst __t=Date.now(); eval(__IN); return Date.now()-__t;")(naked);
    }catch(e){ ms=-1; }
    finally{ console.log=realLog; console.error=realErr; console.warn=realWarn; }
    if(ms<0) return;
    margins.push(x.k+" "+(ms/bud).toFixed(1)+"배");
    if(ms < bud*3) thin.push(x.t+" / "+x.l+" · "+x.k+" — 시작 "+ms+"ms / 예산 "+bud+"ms");
  });
  check("복잡도 개선 문항은 시작 코드가 예산을 넉넉히 넘는다", thin.length===0,
    {검사:margins.length, 여유부족:thin});

  const sharedRt=await p.evaluate(async ()=>{
    if(typeof rtFiles!=="function") return {missing:true};
    await window.ensureTrack("c");
    const qs=[]; COURSES.c.units.forEach(u=>u.lessons.forEach(l=>(l.q||[]).forEach(q=>{ if(q.rt) qs.push(q); })));
    const sh=qs.filter(q=>q.rt.shared);
    if(!sh.length) return {shared:0};
    const files=await rtFiles(sh[0].rt);
    const plain=await rtFiles({test:{"a.c":"x"}});
    return {shared:sh.length, keys:Object.keys(files).length, hasFramework:!!files["test-framework/unity.c"], plainKeys:Object.keys(plain).length};
  });
  check("공용 테스트 프레임워크가 채점 시점에 합쳐진다", sharedRt.hasFramework===true && sharedRt.keys>=4, sharedRt);
  check("공용 파일이 없는 문항은 그대로 동작한다", sharedRt.plainKeys===1, sharedRt);

  /* 셸의 유닛·레슨 목록과 데이터 파일을 제목으로 맞춰 붙이는데, 셸 목록에 없는 레슨은
     그대로 묻힌다. 실제로 '직접 짜 보기' 실습 347레슨 909문항이 데이터에만 있고 앱에서는
     끝내 안 보였다. 데이터에 넣은 문항은 전부 화면까지 와야 한다.
     ANSWER_DROP 으로 일부러 뺀 결함 문항만 차이로 인정한다. */
  const reach=[];
  for(const f of fs.readdirSync(chunkDir).filter(x=>/^t-.*\.js$/.test(x)).sort()){
    const m=fs.readFileSync(path.join(chunkDir,f),"utf8").match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    if(!m) continue;
    let want=0;
    JSON.parse(m[2]).forEach(u=>u.l.forEach(l=>{ want+=(l.q||[]).length; }));
    const got=await p.evaluate(async k=>{
      await window.ensureTrack(k);
      const c=COURSES[k]; if(!c) return null;
      let n=0, dropped=0;
      c.units.forEach(u=>u.lessons.forEach(l=>{ n+=(l.q||[]).length; }));
      try{ dropped=ANSWER_DROP.size; }catch(e){}
      return {n, dropped};
    }, m[1]);
    if(!got){ reach.push(m[1]+": 셸에 트랙이 없다"); continue; }
    if(got.n<want-got.dropped) reach.push(m[1]+": 데이터 "+want+" 중 "+got.n+"문항만 보인다");
  }
  check("데이터에 있는 문항이 앱에서 전부 보인다", reach.length===0, reach.slice(0,8));

  /* 유닛 순서는 제목만 보고 짐작하므로 틀릴 수 있다. 데이터가 순서를 적어 둔 트랙은
     그 순서가 화면에 그대로 나와야 하고, 적기 시작했으면 빠진 유닛이 없어야 한다. */
  const ordBad=[];
  for(const f of fs.readdirSync(chunkDir).filter(x=>/^t-.*\.js$/.test(x)).sort()){
    const m=fs.readFileSync(path.join(chunkDir,f),"utf8").match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    if(!m) continue;
    const du=JSON.parse(m[2]);
    const withOrd=du.filter(u=>typeof u.ord==="number");
    if(!withOrd.length) continue;
    if(withOrd.length!==du.length){ ordBad.push(m[1]+": 유닛 "+du.length+"개 중 "+withOrd.length+"개만 순서를 적었다"); continue; }
    const want=du.slice().sort((a,b)=>a.ord-b.ord).map(u=>u.t);
    const got=await p.evaluate(async k=>{ await window.ensureTrack(k); return COURSES[k].units.map(u=>u.title); }, m[1]);
    if(want.join("")!==got.join(""))
      ordBad.push(m[1]+": 적어 둔 순서와 화면 순서가 다르다 (첫 유닛 기대 '"+want[0]+"' / 실제 '"+got[0]+"')");
  }
  check("데이터가 적어 둔 유닛 순서가 화면에 그대로 나온다", ordBad.length===0, ordBad);

  /* 이제는 모든 트랙이 순서를 적어 두어야 한다. 적지 않으면 제목의 낱말을 보고
     난이도를 짐작하는 unitDiff 로 되돌아가는데, 그 짐작이 실제로 여러 트랙에서
     틀렸다 — '고차함수와 함수 합성' 이 '고차' 때문에 맨 뒤로, 'CSS 레이아웃 심화'
     가 기초 바로 뒤로, security 는 '웹 보안 기초' 가 13번째로 갔다.
     난이도 태그가 없는 문항이 8할이고 qLevel() 이 유닛 위치로 난이도를 매기므로,
     순서가 틀리면 난이도 표시도 함께 틀린다. */
  const noOrd=[];
  for(const f of fs.readdirSync(chunkDir).filter(x=>/^t-.*\.js$/.test(x)).sort()){
    const m=fs.readFileSync(path.join(chunkDir,f),"utf8").match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    if(!m) continue;
    const du=JSON.parse(m[2]);
    if(!du.length || !du.every(u=>typeof u.ord==="number")) noOrd.push(m[1]);
  }
  check("모든 트랙이 유닛 순서를 적어 두었다", noOrd.length===0, noOrd);

  /* 해 보는 유닛(시뮬레이션·실행형 실전·설계 실전)은 배운 뒤에 오는 것이라 맨 뒤여야 한다.
     code 트랙은 예외다 — 트랙 전체가 실습이라 '직접 구현' 이 중간에 있는 것이 맞다. */
  const TAILU=/시뮬레이션|실행형 실전|실행형 ·|설계 실전|설계 · 직접|직접 구현 —|직접 코딩 —|직접 SQL —|직접 만들며|직접 실행해/;
  const tailBad=[];
  for(const k of Object.keys(await p.evaluate(()=>COURSES))){
    if(k==="code") continue;
    const t=await p.evaluate(async k2=>{ await window.ensureTrack(k2); return COURSES[k2].units.map(u=>u.title); }, k);
    const idx=t.map((x,i)=>TAILU.test(x)?i:-1).filter(i=>i>=0);
    const start=t.length-idx.length;
    const early=idx.filter(i=>i<start).map(i=>(i+1)+". "+t[i]);
    if(early.length) tailBad.push(k+": "+early.join(" / "));
  }
  check("해 보는 유닛이 트랙 맨 뒤에 있다", tailBad.length===0, tailBad);

  /* 이론 한 절이 너무 길면 읽다 지친다 — 400자를 넘으면 끊을 자리를 찾는다는 신호다 */
  const longBody=[];
  fs.readdirSync(chunkDir).filter(x=>/^t-.*\.js$/.test(x)).forEach(f=>{
    const m=fs.readFileSync(path.join(chunkDir,f),"utf8").match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    if(!m) return;
    const seen=new Set();
    JSON.parse(m[2]).forEach(u=>u.l.forEach(l=>((l.th&&l.th.body)||[]).forEach(b=>{
      const n=String(b.t||"").replace(/<[^>]*>/g,"").length;
      if(n>400 && !seen.has(b.h)){ seen.add(b.h); longBody.push(m[1]+" · "+String(b.h).slice(0,40)+" ("+n+"자)"); }
    })));
  });
  check("이론 한 절이 400자를 넘지 않는다", longBody.length===0, longBody.slice(0,8));

  /* 트랙을 처음 열었을 때 만나는 유닛이 심화·리뷰·로그면 초보는 거기서 막힌다 */
  const badStart=[];
  for(const k of Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8")
      .match(/^const COURSES = (\{.*\});$/m)[1]))){
    const first=await p.evaluate(async k=>{ await window.ensureTrack(k); const u=COURSES[k].units[0]; return u&&u.title; }, k);
    if(first&&/심화|시니어|스태프|코드 리뷰|로그 분석/.test(first)) badStart.push(k+" — "+first);
  }
  check("트랙의 첫 유닛이 심화·리뷰·로그가 아니다", badStart.length===0, badStart);

  check("모든 트랙에 분야 소개가 있다", r.introMissing.length===0, r.introMissing);
  check("Git 미션 12개 이상", r.missions>=12, {missions:r.missions});

  /* ---- 콘텐츠 정책 (docs/CONTENT_POLICY.md) ---- */
  /* 선택형 총량 동결선은 폐기했다. 총량이 아니라 '이 유형이어야만 하는가' 로 판정한다.
     (5690 → 5688: 확인된 중복 2문항 삭제)
     (5688 → 3000: 목표 비율에 맞춰 '문항 만듦새' 기준으로 2,688개 삭제 — 기준이 틀렸다.
      만듦새는 '직접 해 보는 게 나은가' 와 다른 질문이라, 실행으로는 절대 얻을 수 없는
      판단형 문항까지 잘려 나갔다. 아두이노처럼 앱에서 실행 자체가 불가능한 영역도 있다.)
     (3000 → 복원: 실행으로 대체 가능한 것만 남기고 2,457개를 제자리로 되돌렸다) */
  check("실행해 볼 수 있는 트랙에 '출력 맞히기' 선택형을 늘리지 않는다",
        r.handsChoice<=30, {handsChoice:r.handsChoice, note:"이런 건 실행형으로 내야 한다"});

  /* 리뷰가 있어야 하는 트랙. 목표는 30, 지금 달성치를 기준선으로 박아 뒷걸음질을 막는다 */
  const REVIEW_GOAL=30;
  const REVIEW_TRACKS=["react","sysd","os","net","web","ai","ml","pandas","numpy","mleval","backend","devops"];
  const REVIEW_FLOOR={};      // 트랙: 지금까지 확보한 최소치 (확대할 때마다 같이 올린다)
  REVIEW_TRACKS.forEach(k=>{ REVIEW_FLOOR[k]=REVIEW_FLOOR[k]||0; });
  Object.assign(REVIEW_FLOOR, {backend:30, react:30, devops:32, os:30, net:30, sysd:30, web:30,
                               ai:30, ml:30, mleval:30, pandas:30, numpy:30});
  const revNow={}, revShort=[], revRegress=[];
  REVIEW_TRACKS.forEach(k=>{
    const n=(r.perTrack[k]||{}).review||0;
    revNow[k]=n;
    if(n<(REVIEW_FLOOR[k]||0)) revRegress.push(k+":"+n+"<"+REVIEW_FLOOR[k]);
    if(n<REVIEW_GOAL) revShort.push(k+":"+n);
  });
  check("리뷰 확보량이 뒷걸음질하지 않는다", revRegress.length===0, revRegress);
  if(revShort.length) console.log("  리뷰 목표 미달("+REVIEW_GOAL+"개 기준): "+revShort.join(" · "));
  else check("지정 트랙 12개가 모두 리뷰 30개 이상", true);

  /* 언어별 유형 매트릭스 (docs/CONTENT_POLICY.md).
     각 트랙이 "그 언어답게" 채워졌는지 본다. GOAL 은 정책 목표, FLOOR 는 지금까지의 확보량 —
     FLOOR 아래로 떨어지면 실패(회귀 방지), GOAL 미달은 진행률로만 보고한다.
     FLOOR 는 콘텐츠를 넣을 때마다 같이 올린다. 내려서 통과시키지 말 것. */
  const MATRIX={
    //          review  log  exec  predict(input)  debug(cat)
    python:     {review:30,            exec:80,  predict:31,  "cat:debug":71},
    javascript: {review:30,            exec:76,               "cat:debug":47},
    sql:        {review:30, log:20,    exec:87,  predict:31,  "cat:debug":57},
    java:       {review:32,                       predict:50, "cat:debug":20},
    c:          {review:32,                       predict:60, "cat:debug":20},
    cpp:        {review:32,                       predict:50, "cat:debug":20},
    go:         {review:32,                       predict:50, "cat:debug":20},
    react:      {review:50, exec:12,                          "cat:debug":20},
    web:        {review:30, exec:20},
    os:         {review:30, log:20,                           "cat:debug":4},
    net:        {review:30, log:40},
    devops:     {review:32, log:120}
  };
  const GOAL={
    python:     {review:30,            exec:100, predict:30,  "cat:debug":70},
    javascript: {review:30,            exec:90,               "cat:debug":50},
    sql:        {review:30, log:20,    exec:100, predict:30,  "cat:debug":55},
    java:       {review:30,                      predict:50,  "cat:debug":20},
    c:          {review:30,                      predict:60,  "cat:debug":20},
    cpp:        {review:30,                      predict:50,  "cat:debug":20},
    go:         {review:30,                      predict:50,  "cat:debug":20},
    react:      {review:30, exec:20,                          "cat:debug":20},
    web:        {review:30, exec:20},
    os:         {review:30, log:20,                           "cat:debug":10},
    net:        {review:30, log:40},
    devops:     {review:30, log:120}
  };
  const cnt=(k,key)=>{ const t=r.perTrack[k]||{};
    return key==="predict" ? (t["cat:predict"]||0) : (t[key]||0); };
  const mxRegress=[], mxShort=[];
  Object.keys(MATRIX).forEach(k=>{
    Object.keys(MATRIX[k]).forEach(key=>{
      const n=cnt(k,key), floor=MATRIX[k][key];
      if(n<floor) mxRegress.push(k+"."+key+" "+n+"<"+floor);
    });
    Object.keys(GOAL[k]||{}).forEach(key=>{
      const n=cnt(k,key), goal=GOAL[k][key];
      if(n<goal) mxShort.push(k+"."+key+" "+n+"/"+goal);
    });
  });
  check("언어별 유형 확보량이 뒷걸음질하지 않는다", mxRegress.length===0, mxRegress);
  if(mxShort.length) console.log("  매트릭스 미달: "+mxShort.join(" · "));
  else check("언어별 유형 매트릭스가 전부 목표에 도달했다", true);

  /* 목표 비율 (docs/CONTENT_POLICY.md). choice 를 5,690 에 고정했을 때의 총량에서 역산한다.
     미달은 실패가 아니라 진행률로 보고한다 — 달성까지 CI 가 계속 빨간불이면 의미가 없다. */
  const B={choice:[55,60], input:[18,20], exec:[12,15], review:[5,8], log:[2,4]};
  const now={choice:r.byType.choice||0, input:r.byType.input||0,
             exec:(r.byType.code||0)+(r.byType.py||0)+(r.byType.sql||0)+(r.byType.html||0)+(r.byType.react||0)+(r.byType.ts||0)+(r.byType.sim||0)+(r.byType.arch||0),
             review:r.byType.review||0, log:r.byType.log||0};
  const projected=Math.round(now.choice/(B.choice[1]/100));   // choice 60% 기준 최종 총량
  const gap=[];
  Object.keys(B).forEach(k=>{
    if(k==="choice") return;
    const floor=Math.round(projected*B[k][0]/100);
    if(now[k]<floor) gap.push(k+" "+now[k]+"/"+floor+" (+"+(floor-now[k])+")");
  });
  check("문항 유형이 5종 이상 실재한다", Object.keys(r.byType).length>=5, r.byType);

  /* 출력 예측(cat=predict)은 실제 컴파일러로 정답을 검증해 넣은 문항이다.
     a[0] 이 실행 결과이므로, 정규화 기준으로 정답 목록에 중복이 있으면 안 된다. */
  const pred=await p.evaluate(()=>{
    const nm=s=>String(s).toLowerCase().replace(/\s+/g,"").replace(/;$/,"");
    let n=0, bad=0, noCode=0;
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
      if(q.cat!=="predict") return;
      n++;
      if(!q.code) noCode++;
      if(!Array.isArray(q.a) || !q.a.length) { bad++; return; }
      const na=q.a.map(nm);
      if(new Set(na).size!==na.length || na.some(x=>!x)) bad++;
    })));
    return {n, bad, noCode};
  });
  check("출력 예측 문항의 정답 목록이 정규화 기준으로 유효하다", pred.bad===0, pred);
  check("출력 예측 문항에는 코드가 있다", pred.noCode===0, pred);
  console.log("  출력 예측: "+pred.n+"문항 (Java·C·C++·Go, 실제 컴파일러로 정답 검증)");

  console.log("  콘텐츠: "+r.qs+"문항 / "+r.units+"유닛 / "+r.lessons+"레슨 · 유형 "+JSON.stringify(r.byType));
  console.log("  비율: "+Object.keys(B).map(k=>k+" "+(now[k]/r.qs*100).toFixed(1)+"%").join(" · "));
  console.log("  목표까지(choice 60% 환산 총 "+projected.toLocaleString()+"문항 기준): "+(gap.length?gap.join(" · "):"전부 달성"));
  /* 10유형 구조(docs/CONTENT_POLICY.md) 진행률.
     목표는 총 10,000문항 기준이고 아직 멀기 때문에 실패시키지 않고 진행률만 보고한다.
     디버깅은 유형이 아니라 cat:"debug" 로 세므로 다른 칸과 겹칠 수 있다 — 그대로 표시한다. */
  const cat10=await p.evaluate(()=>{
    const c={choice:0,input:0,code:0,debug:0,review:0,log:0,sim:0,arch:0};
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
      const t=q.t||"choice";
      if(q.cat==="debug") c.debug++;
      if(t==="choice") c.choice++;
      else if(t==="input") c.input++;
      else if(t==="review") c.review++;
      else if(t==="log") c.log++;
      else if(t==="sim") c.sim++;
      else if(t==="arch") c.arch++;
      else c.code++;
    })));
    const plist=(typeof PROJECTS!=="undefined"&&PROJECTS)?Object.values(PROJECTS).flat():[];
    return {c, personas:(typeof PROJECTS!=="undefined"&&PROJECTS?Object.keys(PROJECTS).length:0),
            projects:plist.length,
            projPhases:plist.reduce((a,x)=>a+projPhaseCount(x),0),
            tracks:Object.keys(COURSES).length,
            projTracks:Object.keys(COURSES).filter(k=>!!projectForTrack(k)).length,
            projOwn:Object.keys(COURSES).filter(k=>{const r=projectForTrack(k);return r&&r.p.skills[0]===(TRACK_ALIAS[k]||k);}).length,
            buildDays:(typeof BUILD_PROJECTS!=="undefined"&&BUILD_PROJECTS?BUILD_PROJECTS.reduce((a,p)=>a+(p.days||[]).length,0):0),
            buildTests:(typeof BUILD_PROJECTS!=="undefined"&&BUILD_PROJECTS?BUILD_PROJECTS.reduce((a,p)=>a+(p.days||[]).reduce((b,d)=>b+(d.tests||[]).length,0),0):0)};
  });
  /* 총량 상한은 없다. 선택형은 '실행으로 대체할 수 없는 지식' 이면 얼마든 있어도 되고,
     나머지 유형은 각자의 목표만큼 채운다 — 비율은 결과이지 제약이 아니다. */
  const TARGET10={choice:null,input:1500,code:2000,debug:1000,review:800,log:500,sim:500,arch:150};
  console.log("  10유형 구조 (choice 는 상한 없음 · 나머지는 목표치):");
  Object.keys(TARGET10).forEach(k=>{
    const now=cat10.c[k]||0, t=TARGET10[k];
    const bar = t===null ? "상한 없음"
      : (now>=t ? "달성" : (t-now)+" 남음");
    console.log("    "+k.padEnd(7)+String(now).padStart(5)+" / "+String(t===null?"—":t).padStart(5)+"   "+bar);
  });
  const remain10=Object.keys(TARGET10).filter(k=>k!=="choice")
    .reduce((a,k)=>a+Math.max(0,TARGET10[k]-(cat10.c[k]||0)),0);
  console.log("    남은 총량(choice 제외): "+remain10+"문항");
  console.log("    project  "+cat10.projects+" 프로젝트("+cat10.personas+" 갈래) · 단계 "+cat10.projPhases
    +" · 빌드랩 "+cat10.buildDays+" Day · 수용 기준 "+cat10.buildTests+" (목표 500문항 상당)");
  console.log("    프로젝트 배너가 붙은 트랙 "+cat10.projTracks+"/"+cat10.tracks+" (그중 전용 "+cat10.projOwn+")");

  console.log("  리뷰 분포: "+JSON.stringify(revNow));

  /* 프로젝트 단계의 계약 — 하나라도 빠지면 그 단계가 빈 화면으로 뜬다.
     역량 축 이름이 틀리면 조용히 무시되므로 점수가 안 오르는 형태로 나타난다. */
  const pj=await p.evaluate(()=>{
    const AX=Object.keys(AXIS_REMEDY);
    const bad={필수:[],축:[],best:[],렌더:[]};
    const seen=new Set(), dup=[];
    for(const per in PROJECTS) PROJECTS[per].forEach((x,idx)=>{
      if(seen.has(x.title)) dup.push(x.title); seen.add(x.title);
      const at=per+"/"+idx+" "+x.title;
      /* 두 형식이 있다 — phases 를 직접 적은 것과 steps 로 적어 projPhases 가
         앞뒤에 요구사항·회고를 붙여 주는 것(kind:"guide"). 설명 필드 이름이 다르다. */
      if(!(x.lv>=1&&x.lv<=5)||!x.em||!(x.desc||x.goal)||!x.skills||!x.skills.length) bad.필수.push(at);
      projPhases(x).forEach((ph,i)=>{
        const w=at+" 단계"+(i+1);
        if(!ph.t||!ph.goal) bad.필수.push(w);
        if(ph.type==="build"&&(!ph.acc||!ph.sol||!ph.lang)) bad.필수.push(w+"(build)");
        if(ph.type==="note"&&!ph.ph) bad.필수.push(w+"(note)");
        if(ph.type==="decide"){
          const o=ph.opts||[];
          if(o.filter(y=>y.best).length!==1) bad.best.push(w);
          o.forEach(y=>Object.keys(y.fx||{}).forEach(a=>{ if(!AX.includes(a)) bad.축.push(w+" "+a); }));
        }
      });
    });
    /* 모든 단계를 실제로 그려 본다 — 빈 화면이 나오면 잡는다 */
    for(const per in PROJECTS) PROJECTS[per].forEach((x,idx)=>{
      openLab(per,idx);
      for(let i=0;i<lab.phases.length;i++){
        lab.i=i; renderPhase();
        if(document.getElementById("lab-body").innerText.trim().length<40)
          bad.렌더.push(per+"/"+idx+" 단계"+(i+1));
      }
      closeLab();
    });
    return {bad, dup, n:Object.values(PROJECTS).flat().length};
  });
  check("프로젝트 단계에 빠진 항목이 없다", pj.bad.필수.length===0, {빠짐:pj.bad.필수.slice(0,6)});
  check("프로젝트 보기의 역량 축이 앱이 아는 이름이다", pj.bad.축.length===0, {모르는축:pj.bad.축.slice(0,6)});
  check("선택 단계마다 권장안이 정확히 하나다", pj.bad.best.length===0, {어긋남:pj.bad.best.slice(0,6)});
  check("모든 프로젝트 단계가 빈 화면 없이 그려진다", pj.bad.렌더.length===0, {빈화면:pj.bad.렌더.slice(0,6)});
  check("프로젝트 제목이 겹치지 않는다", pj.dup.length===0, {겹침:pj.dup, 전체:pj.n});
  check("모든 트랙에 프로젝트 배너가 붙어 있다", cat10.projTracks===cat10.tracks,
    {붙은트랙:cat10.projTracks, 전체:cat10.tracks, 전용:cat10.projOwn});

  /* 트랙 하나가 너무 얇으면 그 트랙만 고른 사람에게는 앱이 비어 보인다.
     150문항은 '한 트랙을 붙들고 며칠은 갈 수 있다' 의 하한선이다. */
  const underFloor=await p.evaluate(()=>{
    const out={};
    for(const k in COURSES){ let n=0;
      COURSES[k].units.forEach(u=>u.lessons.forEach(l=>{ n+=l.q.length; }));
      if(n<150) out[k]=n; }
    return out;
  });
  check("모든 트랙이 150문항 이상이다", Object.keys(underFloor).length===0, {미달:underFloor});

  /* 정답만 길면 내용을 몰라도 '가장 긴 보기' 를 고르면 맞는다.
     눈금을 두 번 고쳤다. 처음엔 '정답이 단독 최장인 비율' 만 셌는데,
     오답 하나만 정답보다 길게 만드는 상환에 속아 0% 가 나왔다 — 정답은
     2등이 됐을 뿐이었다. 그래서 길이 순위로 바꿨더니 이번엔 1자 차이까지
     순위로 셌다. 사람은 1자 차이를 못 본다.

     지금은 허용오차를 두고 잰다. 길이 차이가 허용오차 안쪽이면 눈으로
     구분 못 한다고 보고 한 묶음으로 잇고, '몇 번째로 긴 묶음에서 찍는다'
     전략들의 최고 정답률을 본다. 25% 면 길이가 단서가 아니다.
     0자는 기계가, 5자는 사람이 쓸 수 있는 단서다 — 둘 다 눈금을 박는다. */
  const bias=await p.evaluate(()=>{
    const strip=s2=>String(s2||"").replace(/<[^>]*>/g,"").trim();
    const TOLS=[0,5]; let n=0; const hit=TOLS.map(()=>[0,0,0,0]);
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>(l.q||[]).forEach(q=>{
      if((q.t||"choice")!=="choice"||!Array.isArray(q.o)||q.o.length!==4) return;
      n++;
      const L=q.o.map(o=>strip(o).length);
      TOLS.forEach((tol,ti)=>{
        const order=[0,1,2,3].sort((x,y)=>L[y]-L[x]); const g=[[order[0]]];
        for(let i=1;i<4;i++){ const p2=g[g.length-1];
          if(L[p2[p2.length-1]]-L[order[i]]<=tol) p2.push(order[i]); else g.push([order[i]]); }
        g.forEach((grp,gi)=>{ if(grp.indexOf(q.a)>=0) hit[ti][gi]+=1/grp.length; });
      });
    })));
    return {n, exact:+(Math.max(...hit[0])/n*100).toFixed(1), human:+(Math.max(...hit[1])/n*100).toFixed(1)};
  });
  /* 고치는 중이라 눈금이 한 번 올라간다 — 이유를 적어 둔다.
     정답이 3등·4등인 문항이 거의 없어서(5.6%/3.1%) 어떤 배정을 해도
     1등과 2등에 몰린다. 3·4등을 채우려면 오답을 정답보다 길게 다시
     써야 하고, 그 일이 끝나기 전까지는 1등 쪽이 잠깐 두꺼워진다.
     기계 눈금은 72.8 → 59.4 로 내려갔고, 사람 눈금만 29.3 → 37.7 로
     올랐다. 남은 일 3952자리를 끝내면 둘 다 25% 근처로 간다.
     이 두 숫자는 작업이 진행되는 동안 계속 내려가야 한다. */
  const BIAS_EXACT=54.0, BIAS_HUMAN=37.7;
  console.log("  길이로 찍기 최고 정답률: 기계(0자) "+bias.exact+"% · 사람(5자) "+bias.human+
              "% · 눈금 "+BIAS_EXACT+"/"+BIAS_HUMAN+"% · 찍기 기준선 25%");
  check("길이로 찍기(기계 기준)가 더 나빠지지 않았다", bias.exact<=BIAS_EXACT, {지금:bias.exact, 눈금:BIAS_EXACT});
  check("길이로 찍기(사람 기준)가 더 나빠지지 않았다", bias.human<=BIAS_HUMAN, {지금:bias.human, 눈금:BIAS_HUMAN});

  /* 셸의 BUILD_DAYS 는 허브 라벨('빌드 랩 12/46 Day')에 쓰인다.
     데이터에 Day 를 더하고 이 상수를 안 고치면 진도가 영영 안 찬 것처럼 보인다. */
  const blDays=await p.evaluate(()=>({
    선언:typeof BUILD_DAYS!=="undefined"?BUILD_DAYS:null,
    실제:BUILD_PROJECTS.reduce((a,x)=>a+(x.days||[]).length,0)
  }));
  check("셸의 BUILD_DAYS 가 실제 Day 수와 같다", blDays.선언===blDays.실제, blDays);

  /* javascript 정답 예시는 앱 안에서 ▶ 실행으로 돌아가야 한다.
     node 에서만 되는 것(process, require)을 쓰면 배우는 사람 화면에서만 터진다. */
  const jsSol=await p.evaluate(async ()=>{
    const rows=[];
    for(const per in PROJECTS) PROJECTS[per].forEach(x=>projPhases(x).forEach((ph,i)=>{
      if(ph.type==="build"&&ph.lang==="javascript"&&ph.sol&&ph.run!==false) rows.push({at:x.title+" 단계"+(i+1), code:ph.sol});
    }));
    const bad=[];
    for(const r of rows){
      const logs=[];
      const cl={log:function(){ logs.push([].slice.call(arguments).join(" ")); }};
      cl.error=cl.warn=cl.info=cl.log;
      let err=null;
      try{
        const mod={exports:{}};
        new Function("console","module","exports",r.code)(cl,mod,mod.exports);
        /* 비동기로 이어지는 것이 있으니 잠깐 기다렸다 다시 본다 */
        await new Promise(res=>setTimeout(res,400));
      }catch(e){ err=(e&&e.message)||String(e); }
      if(err) bad.push({at:r.at, 오류:err});
      else if(!logs.length) bad.push({at:r.at, 오류:"출력이 없다"});
    }
    return {검사:rows.length, bad};
  });
  check("javascript 정답 예시가 앱 안에서 그대로 돌아간다", jsSol.bad.length===0,
    {검사:jsSol.검사, 실패:jsSol.bad.slice(0,5)});
  await p.close();
 }

 /* ---------- 진도 키가 콘텐츠 추가에 흔들리지 않는다 ---------- */
 {
  const p0=await page();
  const target=await p0.evaluate(()=>{
    const u=COURSES.python.units[2], l=u.lessons[0];
    return {unit:u.title, les:l.title, oldKey:"python-2-0"};
  });
  await p0.close();
  const p=await page({done:{[target.oldKey]:true}});
  const r=await p.evaluate(t=>{
    const before={doneV:S.doneV, old:Object.keys(S.done).filter(k=>/^[a-z]+-\d+-\d+$/.test(k)).length};
    let at=null;
    COURSES.python.units.forEach((u,ui)=>u.lessons.forEach((l,li)=>{ if(u.title===t.unit&&l.title===t.les) at={ui,li}; }));
    const doneBefore=at? !!S.done[lkey("python",at.ui,at.li)] : null;
    COURSES.python.units.unshift({title:"삽입된 유닛", guide:"x",
      lessons:[{title:"새 레슨", xp:5, q:[{t:"choice",k:"z",q:"q",o:["1","2","3","4"],a:0}]}]});
    let at2=null;
    COURSES.python.units.forEach((u,ui)=>u.lessons.forEach((l,li)=>{ if(u.title===t.unit&&l.title===t.les) at2={ui,li}; }));
    return {before, doneBefore,
            doneAfter: at2? !!S.done[lkey("python",at2.ui,at2.li)] : null,
            newUnitFalselyDone: !!S.done[lkey("python",0,0)]};
  }, target);
  check("옛 인덱스 키가 안정 ID로 이관된다", r.before.doneV===2 && r.before.old===0, r.before);
  check("이관 후 같은 레슨이 완료로 남는다", r.doneBefore===true, r);
  check("유닛을 추가해도 완료 표시가 따라간다", r.doneAfter===true, r);
  check("새로 추가된 유닛이 완료로 오인되지 않는다", r.newUnitFalselyDone===false, r);
  await p.close();
 }

 /* ---------- 역량 점수가 활동량이 아니라 근거를 따른다 ---------- */
 {
  const p=await page();
  const r=await p.evaluate(()=>{
    let s=99991; const rnd=()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; };
    function profile(spec, impl){
      S.trk={}; const b=evBucket("trk","python"); const items=[];
      spec.forEach(([lv,n,rate])=>{ const okN=Math.round(n*rate); for(let i=0;i<n;i++) items.push([lv,i<okN]); });
      for(let i=items.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=items[i]; items[i]=items[j]; items[j]=t; }
      items.forEach(x=>evRecord(b,x[1],x[0],false));
      if(impl) for(let i=0;i<impl[0];i++) evRecord(b, i<impl[1], 4, true);
      return trackScore("python");
    }
    const strong = profile([[2,80,0.92],[3,120,0.85],[4,100,0.78],[5,60,0.7]],[30,26]);
    const easyOnly = profile([[1,50,1.0],[2,40,1.0]]);
    const manyWrong = profile([[1,100,0.6],[3,150,0.35],[4,100,0.25]],[20,4]);
    const tooFew = profile([[2,9,1.0]]);
    S.trk={}; S.ax={}; S.axj={}; S.skillsLegacy=null; recomputeSkills();
    const zero=S.skills.coding;
    const b=evBucket("ax","coding"); for(let i=0;i<200;i++) evRecord(b,false,2,false);
    recomputeSkills();
    return {strong, easyOnly, manyWrong, tooFew, zero, after200AllWrong:S.skills.coding};
  });
  check("표본이 적으면 점수를 내지 않는다", r.tooFew===null, r);
  check("고르게 잘한 사람이 가장 높다", r.strong>r.easyOnly && r.strong>r.manyWrong, r);
  check("쉬운 문제만 다 맞혀도 상한이 있다", r.easyOnly<65, r);
  check("많이 풀었지만 틀린 사람은 낮다", r.manyWrong<40, r);
  check("전부 틀리면 점수가 오르지 않는다", r.after200AllWrong===0, r);
  console.log("  점수: 고르게잘함 "+r.strong+" / 쉬운것만 "+r.easyOnly+" / 많이했지만못함 "+r.manyWrong);
  await p.close();
 }

 /* ---------- 학습 경로의 별 노드를 그 자리에서 눌러 들어갈 수 있다 ---------- */
 {
  const p=await browser.newPage({viewport:{width:390,height:800}, hasTouch:true, isMobile:true});
  p.on("pageerror",e=>errs.push("pageerror: "+e.message));
  await p.addInitScript(()=>{ try{ localStorage.setItem("coderun",
    JSON.stringify({onboarded:true, goal:"free", freeMode:true})); }catch(e){} });
  await p.goto(FILE);
  await p.waitForFunction(()=>typeof COURSES!=="undefined", {timeout:60000});
  await p.waitForTimeout(700);

  const rendered=await p.evaluate(()=>({
    nodes:document.querySelectorAll(".node").length,
    wraps:document.querySelectorAll(".node-wrap").length }));
  check("학습 경로에 노드가 렌더된다", rendered.nodes>0 && rendered.wraps>0, rendered);

  // 별의 중심과 라벨의 중심이 어긋나지 않는다 (가로 위치는 래퍼가 담당해야 함)
  const align=await p.evaluate(()=>[...document.querySelectorAll(".node-wrap")].slice(0,8).map(w=>{
    const n=w.querySelector(".node"), l=w.querySelector(".node-label");
    if(!n||!l) return 0;
    const a=n.getBoundingClientRect(), c=l.getBoundingClientRect();
    return Math.round((a.x+a.width/2)-(c.x+c.width/2));
  }));
  check("별과 라벨이 세로로 정렬된다", align.every(d=>Math.abs(d)<=2), align);

  // 손가락을 움직이지 않고 눌렀다 떼면 레슨이 열려야 한다.
  // (.node 에 위치용 translateX 와 :active 의 translateY 가 함께 걸리면
  //  누르는 순간 별이 옆으로 튀어 클릭이 빗나간다 — 그 회귀를 막는다)
  // 유닛은 접혀 있을 수 있으므로 '화면에 실제로 보이는' 별만 대상으로 한다.
  const VIS='(()=>[...document.querySelectorAll(".node")].filter(n=>n.offsetParent!==null))()';
  const press=[];
  const visN=await p.evaluate(`${VIS}.length`);
  for(const idx of [0,1,2,3].filter(i=>i<visN)){
    await p.evaluate(`${VIS}[${idx}].scrollIntoView({block:"center"})`);
    await p.waitForTimeout(180);
    const box=await p.evaluate(`(()=>{const r=${VIS}[${idx}].getBoundingClientRect();
      return {x:r.x+r.width/2, y:r.y+r.height/2};})()`);
    await p.mouse.move(box.x, box.y);
    await p.mouse.down();
    await p.waitForTimeout(110);
    const dx=await p.evaluate(`(()=>{const r=${VIS}[${idx}].getBoundingClientRect();
      return Math.round((r.x+r.width/2)-${box.x});})()`);
    await p.mouse.up();
    await p.waitForTimeout(220);
    const opened=await p.evaluate(()=>{ const on=document.getElementById("lesson").classList.contains("on");
      if(on){ document.getElementById("lesson").classList.remove("on"); document.body.style.overflow=""; }
      return on; });
    press.push({node:idx, dx, opened});
  }
  check("누르는 동안 별이 옆으로 움직이지 않는다", press.every(x=>Math.abs(x.dx)<=1), press);
  check("별을 그 자리에서 눌러 레슨이 열린다", press.length>0 && press.every(x=>x.opened), press);

  /* 유닛 접기/펼치기 — 처음 온 사람이 40개가 넘는 유닛에 파묻히지 않게 하는 장치라
     "기본은 지금 할 유닛만 펼침" 이 깨지면 안 된다 */
  const fold=await p.evaluate(async ()=>{
    const vis=()=>[...document.querySelectorAll(".path")].filter(x=>getComputedStyle(x).display!=="none").length;
    const before=vis();
    const units=document.querySelectorAll(".unit-sec").length;
    const cur=document.querySelectorAll(".unit-sec.is-current").length;
    document.getElementById("ub-toggle").click();
    const afterCollapse=vis();
    document.getElementById("ub-toggle").click();
    const afterExpand=vis();
    document.getElementById("ub-here").click();
    const afterHere=vis();
    const heads=document.querySelectorAll(".unit-head");
    const aria=heads.length? heads[0].getAttribute("aria-expanded") : null;
    return {units, cur, before, afterCollapse, afterExpand, afterHere, aria};
  });
  check("유닛이 기본으로 접혀 있고 '지금 할 유닛' 하나만 펼쳐진다", fold.units>1 && fold.before===1 && fold.cur===1, fold);
  check("모두 접기·모두 펼치기가 동작한다", fold.afterCollapse===0 && fold.afterExpand===fold.units, fold);
  check("'지금 할 곳으로' 가 다시 한 유닛만 남긴다", fold.afterHere===1, fold);
  check("유닛 머리글이 펼침 상태를 스크린리더에 알린다", fold.aria==="true"||fold.aria==="false", fold);

  /* 홈에서 첫 레슨까지 가는 거리 — 처음 온 사람이 여기서 이탈한다.
     기능을 빼지 않고 접어서 줄였으므로, 접힌 것을 펴면 항목이 그대로 다 있어야 한다. */
  const reach=await p.evaluate(()=>{
    const first=document.querySelector(".unit-sec");
    const fold=document.getElementById("msn-fold");
    const closed=Math.round(document.getElementById("daily").getBoundingClientRect().height);
    fold.open=true;
    const rows=document.querySelectorAll("#msn-fold .msn > *").length;
    const opened=Math.round(document.getElementById("daily").getBoundingClientRect().height);
    fold.open=false;
    return {
      첫유닛까지: first ? Math.round(first.getBoundingClientRect().top+scrollY) : null,
      접힘높이: closed, 펼침높이: opened, 미션줄: rows,
      로드맵이레슨뒤: !!(document.getElementById("course").compareDocumentPosition(
        document.getElementById("roadmap")) & Node.DOCUMENT_POSITION_FOLLOWING)
    };
  });
  check("첫 레슨까지 두 화면 안에 닿는다", reach.첫유닛까지!==null && reach.첫유닛까지<1200, reach);
  check("미션은 접혀 있고 펼치면 전부 보인다", reach.접힘높이<160 && reach.미션줄>=9 && reach.펼침높이>reach.접힘높이+200, reach);
  check("성장 로드맵은 레슨 목록 뒤에 있다", reach.로드맵이레슨뒤===true, reach);

  /* doctype 이 없으면 브라우저가 quirks 모드로 렌더한다 — 박스 모델이 달라진다 */
  const mode=await p.evaluate(()=>({compat:document.compatMode, lang:document.documentElement.lang}));
  check("표준 모드로 렌더된다 (quirks 아님)", mode.compat==="CSS1Compat", mode);
  check("문서 언어가 한국어로 선언돼 있다", mode.lang==="ko", mode);
  await p.close();
 }

 /* ---------- 레슨을 끝까지 진행할 수 있다 ---------- */
 {
  const p=await page();
  const r=await p.evaluate(()=>{
    startLesson("python",0,0);
    const chk=document.getElementById("check");
    const sawTheory=!!document.querySelector("#qbody .th-sum");
    if(sawTheory) chk.click();
    const sawBadge=!!document.querySelector("#qbody .lvbadge");
    let g=0;
    while(document.getElementById("lesson").classList.contains("on") && g++<60){
      const skip=document.getElementById("rc-skip");     // 인출 모드: 보기부터 연다
      if(skip){ skip.click(); continue; }
      const o=document.querySelector("#opts .opt"), f=document.getElementById("fill");
      if(o){ o.click(); chk.click(); chk.click(); }
      else if(f){ f.value="x"; f.dispatchEvent(new Event("input")); chk.click(); chk.click(); }
      else chk.click();
    }
    return {sawTheory, sawBadge, closed:!document.getElementById("lesson").classList.contains("on"),
            doneShown:document.getElementById("done").classList.contains("on"),
            recorded:(S.trk&&S.trk.python&&S.trk.python.n)||0};
  });
  check("문제 전에 이론이 나온다", r.sawTheory, r);
  check("문항에 난이도 배지가 붙는다", r.sawBadge, r);
  check("레슨이 끝까지 진행되고 완료 화면이 뜬다", r.closed && r.doneShown, r);
  check("응답이 근거로 기록된다", r.recorded>0, r);
  await p.close();
 }

 /* ---------- 인출 모드 ---------- */
 {
  const p=await page(null,{all:true});
  // 채점기: 오답을 정답으로 인정하는 일이 없어야 한다 (전 선택형 문항 전수)
  const g=await p.evaluate(()=>{
    const all=[];
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(x=>{
      if((x.t||"choice")==="choice" && Array.isArray(x.o) && typeof x.a==="number") all.push(x);
    })));
    let n=0, exact=0, partial=0, falsePos=0, noise=0;
    all.forEach(x=>{
      n++;
      const correct=String(x.o[x.a]);
      if(gradeRecall(x, correct).hit) exact++;
      const toks=rcTokens(correct);
      if(gradeRecall(x, toks.slice(0,Math.max(1,Math.ceil(toks.length*0.7))).join(" ")).hit) partial++;
      if(gradeRecall(x, String(x.o[(x.a+1)%x.o.length])).hit) falsePos++;
      if(gradeRecall(x, "잘 모르겠습니다 아마도 그것 같습니다").hit) noise++;
    });
    return {n, exact, partial, falsePos, noise};
  });
  check("오답을 인출 성공으로 인정하지 않는다", g.falsePos===0, g);
  check("무관한 답을 인정하지 않는다", g.noise===0, g);
  check("정답을 적으면 대체로 인정된다", g.exact/g.n>0.8, {rate:(g.exact/g.n).toFixed(3)});
  check("핵심 단어만 적어도 대체로 인정된다", g.partial/g.n>0.8, {rate:(g.partial/g.n).toFixed(3)});

  // 흐름: 성공 / 실패 / 건너뛰기 / 끄기
  const flow=await p.evaluate(()=>{
    const open=(ui,li)=>{ startLesson("python",ui,li);
      if(document.querySelector("#qbody .th-sum")) document.getElementById("check").click(); };
    const out={};
    S.rc=null; save();
    /* 고정 좌표(0,0)를 믿지 않는다 — 문항이 늘거나 줄면 그 자리가 선택형이 아닐 수 있다.
       첫 문항이 선택형인 레슨들을 먼저 찾고, 그중 인출로 채점 가능한 것을 성공 경로에 쓴다.
       ("Hello" vs "\"Hello\"" 처럼 오답과 글자만 다른 문항은 인출로 구분할 수 없고, 거절하는 채점기가 옳다) */
    const spots=[], hitSpots=[];
    for(let ui=0; ui<COURSES.python.units.length && hitSpots.length<1; ui++){
      for(let li=0; li<COURSES.python.units[ui].lessons.length; li++){
        open(ui,li);
        const q=run.les.q[run.i];
        if(!q || (q.t||"choice")!=="choice" || !q.o) continue;
        spots.push([ui,li]);
        if(gradeRecall(q,String(q.o[q.a])).hit){ hitSpots.push([ui,li]); break; }
      }
    }
    out.spots=spots.length; out.hitSpots=hitSpots.length;
    const pick=i=>spots[Math.min(i, spots.length-1)]||[0,0];

    open(hitSpots[0][0], hitSpots[0][1]);
    out.boxShown=!!document.getElementById("rc-in");
    out.optsHiddenFirst=!document.getElementById("opts");
    const q0=run.les.q[run.i];
    const ta=document.getElementById("rc-in"); ta.value=String(q0.o[q0.a]);
    ta.dispatchEvent(new Event("input")); document.getElementById("check").click();
    out.hitGraded=run.answered && run.rcHit && document.getElementById("foot").className==="foot good";

    open(pick(0)[0], pick(0)[1]);
    document.getElementById("rc-in").value="전혀 관련 없는 대답";
    document.getElementById("rc-in").dispatchEvent(new Event("input"));
    document.getElementById("check").click();
    out.missRevealsOptions=!!document.getElementById("opts") && !!document.querySelector(".rc-mine");
    out.notAutoGraded=!run.answered;

    open(pick(1)[0], pick(1)[1]);
    document.getElementById("rc-skip").click();
    out.skipRevealsOptions=!!document.getElementById("opts");

    S.recall=false; save(); open(pick(0)[0], pick(0)[1]);
    out.offShowsOptions=!document.getElementById("rc-in") && !!document.getElementById("opts");
    S.recall=true; save();
    document.getElementById("lesson").classList.remove("on"); document.body.style.overflow="";
    return out;
  });
  check("보기를 먼저 감춘다", flow.boxShown && flow.optsHiddenFirst, flow);
  check("인출에 성공하면 바로 정답 처리된다", flow.hitGraded, flow);
  check("인출에 실패하면 보기가 열리고 자동 채점되지 않는다", flow.missRevealsOptions && flow.notAutoGraded, flow);
  check("모르겠어요로 보기를 열 수 있다", flow.skipRevealsOptions, flow);
  check("인출 모드를 끄면 보기가 바로 나온다", flow.offShowsOptions, flow);

  // 근거 문장에 인출 비율이 들어간다
  const ev=await p.evaluate(()=>{
    S.trk={}; const b=evBucket("trk","python");
    for(let i=0;i<120;i++) evRecord(b, i<96, i<60?2:4, false);
    b.rc={n:80, ok:44};
    return trackEvidence("python");
  });
  check("근거에 '보기 없이 답한 비율'이 표시된다", ev.some(x=>/보기 없이/.test(x)), ev);
  await p.close();
 }

 /* ---------- 빌드 랩이 실제로 코드를 실행해 채점한다 ---------- */
 {
  const p=await page();
  const r=await p.evaluate(async()=>{
    S.build={}; save();
    await openBuildLab(); blOpen(0); BL.di=0; blApplyDayFiles(); blRender();

    blRun(); await new Promise(r=>setTimeout(r,900));
    const seed=(BL.res||[]).filter(x=>x.ok).length, total=(BL.res||[]).length;

    Object.assign(S.build.orders.files, BUILD_SOL.orders[0]); save(); blRender();
    blRun(); await new Promise(r=>setTimeout(r,900));
    const sol=(BL.res||[]).filter(x=>x.ok).length;
    const recorded=S.build.orders.done.indexOf(1)>=0;

    closeBuildLab();
    return {seed, total, sol, recorded};
  });
  check("시작 코드로는 수용 기준을 통과하지 못한다", r.seed<r.total, r);
  check("참조 해답으로는 전부 통과한다", r.sol===r.total && r.total>0, r);
  check("통과한 Day 가 기록된다", r.recorded, r);
  await p.close();
 }

 /* ---------- 무한 루프 방어 ----------
    도는 스크립트는 iframe 을 떼어내도 멈추지 않고, 크로미움이 그 iframe 을 페이지와 같은
    렌더러 프로세스에 두면 페이지 자체가 굳는다. 그래서 이 검사만 별도 브라우저에서 돌리고
    끝나면 브라우저째 닫는다 — 굳더라도 나머지 스위트를 물고 늘어지지 못하게. */
 {
  /* headless_shell 은 srcdoc iframe 을 페이지와 같은 스레드에 올려서, 무한 루프가 돌면
     페이지 자체가 굳어 이 검사를 할 수 없다. 완전한 크로미움이 있으면 그걸로 돌린다. */
  const FULL=[EXEC, "/opt/pw-browsers/chromium"].find(c=>{ try{ return c && require("fs").existsSync(c); }catch(e){ return false; } });
  if(!FULL){
   console.log("  건너뜀: 무한 루프 검사에는 완전한 크로미움이 필요합니다 (headless_shell 에서는 재현 불가)");
  } else {
  const b2=await chromium.launch({executablePath:FULL});
  let r=null;
  try{
   const p2=await b2.newPage({viewport:{width:390,height:800}});
   await p2.addInitScript(()=>{ try{ localStorage.setItem("coderun",
     JSON.stringify({onboarded:true, goal:"free", freeMode:true})); }catch(e){} });
   await p2.goto(FILE);
   await p2.waitForFunction(()=>typeof COURSES!=="undefined", {timeout:60000});
   await p2.evaluate(()=>ensureBuild());
   r=await Promise.race([
    p2.evaluate(async()=>{
      S.build={}; save();
      await openBuildLab(); blOpen(0); BL.di=0; blApplyDayFiles(); blRender();
      S.build.orders.files["app.js"]="function handle(){ while(true){} }\nmodule.exports={handle};\n";
      save(); blRender(); blRun(); await new Promise(r=>setTimeout(r,6500));
      const loopGuard=!BL.running && (BL.res||[]).some(x=>/무한 루프/.test(x.err||""));
      /* 고쳐서 다시 실행 — 굳은 프레임을 갈아 끼우지 않으면 여기서 영영 안 끝난다 */
      Object.assign(S.build.orders.files, BUILD_SOL.orders[0]); save(); BL.res=null; blRender();
      blRun(); await new Promise(r=>setTimeout(r,2500));
      const res=BL.res||[];
      closeBuildLab();
      return {loopGuard, again:res.filter(x=>x.ok).length, againTotal:res.length};
    }),
    new Promise(res=>setTimeout(()=>res({timeout:true}), 60000))
   ]);
  }catch(e){ r={err:String(e&&e.message||e).split("\n")[0]}; }
  await b2.close();
  check("무한 루프가 있어도 앱이 멈추지 않는다", r && r.loopGuard===true, r);
  check("무한 루프 뒤에 고쳐서 다시 실행하면 채점된다", !!(r && r.againTotal>0 && r.again===r.againTotal), r);
  }
 }

 /* ---------- 7일 프로젝트: 설계 문서 Day · 변이 테스트 Day · 성능 게이트 ---------- */
 {
  const p=await page();
  const r=await p.evaluate(async()=>{
    S.build={}; save();
    const pi=BUILD_PROJECTS.findIndex(x=>x.id==="deliver");
    if(pi<0) return {err:"deliver 프로젝트가 없습니다"};
    const proj=BUILD_PROJECTS[pi];
    await openBuildLab(); blOpen(pi);
    const wait=async()=>{ let t=0; while(BL.running && t<20000){ await new Promise(r=>setTimeout(r,150)); t+=150; } };
    const days=[];
    for(let di=0; di<proj.days.length; di++){
      BL.di=di; blApplyDayFiles(); BL.res=null; blRender();
      blRun(); await wait();
      const seedOk=(BL.res||[]).filter(x=>x.ok).length, total=(BL.res||[]).length;
      Object.assign(S.build.deliver.files, BUILD_SOL.deliver[di]); save(); BL.res=null; blRender();
      const t0=Date.now(); blRun(); await wait();
      days.push({n:proj.days[di].n, seedOk, total, ms:Date.now()-t0,
        solOk:(BL.res||[]).filter(x=>x.ok).length,
        fail:(BL.res||[]).filter(x=>!x.ok).map(x=>x.n+" :: "+x.err)});
    }
    const done=S.build.deliver.done.slice();
    /* 색인 없이 매번 전체를 훑는 구현은 성능 게이트에서 떨어져야 한다 */
    const d6=proj.days.findIndex(d=>d.n===6);
    BL.di=d6; BL.res=null;
    S.build.deliver.files["app.js"]=BUILD_SOL.deliver[d6]["app.js"]
      .replace("const all = byCustomer[q.customerId] || [];",
               "const all = orders.filter(o => o.customerId === q.customerId).sort((a, b) => a.createdAt - b.createdAt);");
    save(); blRender(); blRun(); await wait();
    const naive=(BL.res||[]).filter(x=>!x.ok).map(x=>x.n);
    closeBuildLab();
    return {days, done, naive};
  });
  check("7일 프로젝트가 있다", !r.err, r.err||"");
  if(!r.err){
   check("7일 전부 시작 상태로는 통과하지 못한다",
     r.days.every(d=>d.seedOk<d.total && d.total>0), r.days.map(d=>d.n+":"+d.seedOk+"/"+d.total).join(" "));
   check("7일 전부 참조 해답으로는 전부 통과한다",
     r.days.every(d=>d.solOk===d.total), r.days.filter(d=>d.solOk!==d.total).map(d=>"Day"+d.n+" "+d.fail.join(" | ")).join("  //  "));
   check("설계 Day(요구사항·DB·API)가 문서를 검사한다",
     r.days.slice(0,3).every(d=>d.total>=9), r.days.slice(0,3).map(d=>d.total));
   check("7일이 모두 완료로 기록된다", r.done.length===7, r.done);
   check("Day 6 성능 게이트가 제한 시간 안에 끝난다",
     r.days.find(d=>d.n===6).ms < 5000, r.days.find(d=>d.n===6).ms+"ms");
   check("색인 없는 구현은 성능 게이트에서 떨어진다",
     r.naive.length===1 && /빠르다/.test(r.naive[0]), r.naive);
  }
  await p.close();
 }

 /* ---------- 로컬 실행 서버 연동 (C·C++·Java·Go) ---------- */
 {
  const p=await page();
  const r=await p.evaluate(()=>{
    const out={};
    /* 설정이 없으면 실행 패널이 뜨면 안 된다 (오프라인 기본 동작을 해치지 않는다) */
    S.runner={url:""};
    out.readyWhenEmpty=runnerReady();
    /* 조각 코드를 완전한 프로그램으로 감싸는 규칙 */
    out.javaWrap=/public class Main/.test(wrapForRun("java",'System.out.println(1);'));
    out.javaKeepsMain=wrapForRun("java","public class Main { public static void main(String[] a){} }")
      .indexOf("public class Main {\n")!==0;
    out.cWrap=/#include <stdio.h>[\s\S]*int main\(void\)/.test(wrapForRun("c",'printf("x");'));
    out.cKeepsMain=!/int main\(void\)/.test(wrapForRun("c",'#include <stdio.h>\nint main(){return 0;}'));
    out.goWrap=/^package main/.test(wrapForRun("go",'fmt.Println(1)'));
    out.goKeepsMain=wrapForRun("go","package main\nfunc main(){}").indexOf("package main")===0;
    out.cppWrap=/#include <iostream>[\s\S]*int main\(void\)/.test(wrapForRun("cpp",'std::cout<<1;'));
    /* 주소를 넣으면 준비 상태가 된다 */
    S.runner={url:"http://127.0.0.1:8787/"};
    out.readyWhenSet=runnerReady();
    out.baseTrimmed=runnerBase()==="http://127.0.0.1:8787";
    S.runner={url:""};
    return out;
  });
  check("실행 서버 주소가 없으면 연동이 꺼져 있다", r.readyWhenEmpty===false, r);
  check("주소를 넣으면 연동이 켜지고 끝 슬래시를 정리한다", r.readyWhenSet===true && r.baseTrimmed===true, r);
  check("Java 조각을 실행 가능한 프로그램으로 감싼다", r.javaWrap===true, r);
  check("이미 main 이 있으면 그대로 둔다 (Java·C·Go)",
        r.javaKeepsMain===true && r.cKeepsMain===true && r.goKeepsMain===true, r);
  check("C·C++·Go 조각도 각 언어 규칙대로 감싼다",
        r.cWrap===true && r.cppWrap===true && r.goWrap===true, r);
  await p.close();
 }

 /* ---------- 막혔을 때 AI 에게 물어보기 (V5) ---------- */
 {
  const p=await page();
  const r=await p.evaluate(async()=>{
    const calls=[];
    window.aiCall=(sys,user)=>{ calls.push({sys,user}); return Promise.resolve("힌트 응답"); };
    startLesson("python",0,0);
    if(document.querySelector("#qbody .th-sum")) document.getElementById("check").click();
    const skip=document.getElementById("rc-skip"); if(skip) skip.click();
    const out={btn:!!document.getElementById("ask-open")};
    out.closedAtFirst=document.getElementById("ask-panel").style.display==="none";
    document.getElementById("ask-open").click();
    out.chips=[...document.querySelectorAll(".ask-chip")].map(c=>c.dataset.m).join(",");
    document.querySelector('.ask-chip[data-m="hint"]').click();
    await new Promise(r=>setTimeout(r,50));
    out.locked=/정답을 말하지 마세요/.test(calls[0].sys);
    out.noLeak=!/\[정답\]/.test(calls[0].user);
    out.sentProblem=/\[문제\]/.test(calls[0].user);
    out.shown=/힌트 응답/.test(document.getElementById("ask-host").innerHTML);
    const o=document.querySelector("#opts .opt"), f=document.getElementById("fill");
    if(o) o.click(); else if(f){ f.value="x"; f.dispatchEvent(new Event("input")); }
    document.getElementById("check").click();
    await new Promise(r=>setTimeout(r,60));
    out.kept=/힌트 응답/.test(document.getElementById("ask-host").innerHTML);
    out.chips2=[...document.querySelectorAll(".ask-chip")].map(c=>c.dataset.m).join(",");
    document.querySelector('.ask-chip[data-m="why"]').click();
    await new Promise(r=>setTimeout(r,50));
    const last=calls[calls.length-1];
    out.unlocked=!/정답을 말하지 마세요/.test(last.sys);
    out.sentAnswer=/\[정답\]/.test(last.user);
    return out;
  });
  check("모든 문제에 물어보기 버튼이 있다", r.btn===true, r);
  check("질문 패널은 접힌 상태로 시작한다", r.closedAtFirst===true, r);
  check("풀기 전에는 힌트·개념·접근법만 제시한다", r.chips==="hint,concept,how", r);
  check("풀기 전 프롬프트가 정답을 잠근다", r.locked===true && r.noLeak===true, r);
  check("문제 내용이 프롬프트에 실린다", r.sentProblem===true, r);
  check("AI 응답이 문제 화면에 표시된다", r.shown===true, r);
  check("채점 후에도 물어본 내용이 남는다", r.kept===true, r);
  check("채점 후에는 정답 해설을 물을 수 있다", r.chips2==="why,deep,concept", r);
  check("채점 후 프롬프트에 정답이 실린다", r.unlocked===true && r.sentAnswer===true, r);
  await p.close();
 }

 /* ---------- 주요 화면이 열린다 ---------- */
 {
  const p=await page();
  const r=await p.evaluate(()=>{
    const out={};
    const tryOpen=(name,fn,sel)=>{ try{ fn(); out[name]=!!document.querySelector(sel);
      document.getElementById("profile").classList.remove("on"); }catch(e){ out[name]="ERR "+e.message; } };
    tryOpen("분야 소개", ()=>openIntro("python"), ".in-cta");
    tryOpen("성장 로드맵", ()=>openPath(), ".pstage");
    tryOpen("학습 코치", ()=>openCoach(), ".cch-days");
    tryOpen("업적", ()=>openAchv(), ".achgrid");
    /* 9축 막대(.skb)는 푼 문제가 없으면 그리지 않는다 — 0 만 아홉 줄 늘어놓지 않으려는 것.
       그래서 화면이 열렸는지는 항상 있는 등급 상자로 판정한다. */
    tryOpen("프로필", ()=>openProfile2(), ".rolebox");
    try{ openGitLab(); out["Git 시뮬레이터"]=!!document.querySelector(".glm"); closeGitLab(); }
    catch(e){ out["Git 시뮬레이터"]="ERR "+e.message; }
    try{ openBuildLab(); out["빌드 랩"]=!!document.querySelector(".blp"); closeBuildLab(); }
    catch(e){ out["빌드 랩"]="ERR "+e.message; }
    document.body.style.overflow="";
    return out;
  });
  Object.keys(r).forEach(k=>check(k+" 화면이 열린다", r[k]===true, r[k]));

  /* 역량 분석은 '무엇부터 할지' 를 번호로 알려 주어야 한다. 훈련 모드 11가지를
     평평하게 늘어놓으면 처음 온 사람이 어디서 시작할지 알 수 없다. */
  const g=await p.evaluate(()=>{
    openProfile2();
    const b=document.getElementById("profile-body");
    const rows=[...b.querySelectorAll(".hubrow")];
    const nums=rows.slice(0,3).map(x=>x.querySelector(".hb-em").textContent);
    const unwired=rows.filter(x=>typeof x.onclick!=="function").length;
    const heads=[...b.querySelectorAll("p.sub")].map(x=>x.textContent.trim());
    document.getElementById("profile").classList.remove("on"); document.body.style.overflow="";
    return {steps:nums.join(""), rows:rows.length, unwired,
      groups:["① 먼저","② 매일","③ 크게 만들기","④ 도구와 기록"].filter(h=>heads.includes(h)).length,
      hasOrder:b.innerText.includes("지금 이 순서로")};
  });
  check("역량 분석이 할 일을 1·2·3 으로 보여 준다", g.steps==="123" && g.hasOrder, g);
  check("훈련 모드가 순서대로 묶여 있다", g.groups===4, g);
  check("역량 분석의 모든 줄이 눌린다", g.unwired===0, g);
  await p.close();
 }

 const realErrs=errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e));
 check("페이지 에러 없음", realErrs.length===0, realErrs.slice(0,3));

 await browser.close();
 console.log("\n"+pass+" passed, "+fail+" failed");
 process.exit(fail?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
