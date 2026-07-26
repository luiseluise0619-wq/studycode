/* 브라우저에서 실제 앱을 열고 확인하는 회귀 테스트.
   PLAYWRIGHT 가 없으면 조용히 건너뛴다(로컬에서 엔진 테스트만 돌릴 수 있게). */
const path=require("path");
let chromium;
try { chromium=require("playwright").chromium; }
catch(e){ console.log("playwright 미설치 — 브라우저 테스트를 건너뜁니다."); process.exit(0); }

const FILE="file://"+path.join(__dirname,"..","index.html");
const EXEC=process.env.PLAYWRIGHT_CHROMIUM || undefined;

let pass=0, fail=0;
function check(name, cond, detail){
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
   await p.evaluate(()=>Promise.all([ensureTrack(curLang), ensureProjects(), ensureSims(), ensureDiags()]));
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
  check("트랙 청크가 32개 있다", files.filter(f=>/^t-.+\.js$/.test(f)).length===32,
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
  check("문항 없이도 트랙 지도가 그려진다", early.nodes>0 && early.tracks===32, early);
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
    const byType={};
    for(const k in COURSES) COURSES[k].units.forEach(u=>{ units++; u.lessons.forEach(l=>{
      lessons++;
      const t=l.theory;
      if(!t) noTheory++;
      else if(!t.sum || !Array.isArray(t.body) || t.body.length<2 || !t.code || !t.code.c ||
              !Array.isArray(t.key) || !t.key.length) badTheory++;
      l.q.forEach(q=>{
        qs++; byType[q.t||"choice"]=(byType[q.t||"choice"]||0)+1;
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
        c.exec=(c.exec||0)+((t==="code"||t==="py"||t==="sql"||t==="html"||t==="react"||t==="ts"||t==="sim")?1:0);
        if(q.cat) c["cat:"+q.cat]=(c["cat:"+q.cat]||0)+1;
      })));
      perTrack[k]=c; }
    return {units, lessons, qs, byType, noTheory, badTheory, badChoice, badLog, badReview,
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
  check("로그 문항 구조가 올바르다", r.badLog===0, {badLog:r.badLog});
  check("리뷰 문항 구조가 올바르다", r.badReview===0, {badReview:r.badReview});
  check("모든 트랙에 분야 소개가 있다", r.introMissing.length===0, r.introMissing);
  check("Git 미션 12개 이상", r.missions>=12, {missions:r.missions});

  /* ---- 콘텐츠 정책 (docs/CONTENT_POLICY.md) ---- */
  const CHOICE_CAP=5690;      // 선택형 동결선. 올리지 말 것 — 교체는 총량 불변이어야 한다
  check("선택형이 동결선을 넘지 않는다 (choice 추가 금지)", r.byType.choice<=CHOICE_CAP,
        {choice:r.byType.choice, cap:CHOICE_CAP});

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
             exec:(r.byType.code||0)+(r.byType.py||0)+(r.byType.sql||0)+(r.byType.html||0)+(r.byType.react||0)+(r.byType.ts||0)+(r.byType.sim||0),
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
    const c={choice:0,input:0,code:0,debug:0,review:0,log:0,sim:0};
    for(const k in COURSES) COURSES[k].units.forEach(u=>u.lessons.forEach(l=>l.q.forEach(q=>{
      const t=q.t||"choice";
      if(q.cat==="debug") c.debug++;
      if(t==="choice") c.choice++;
      else if(t==="input") c.input++;
      else if(t==="review") c.review++;
      else if(t==="log") c.log++;
      else if(t==="sim") c.sim++;
      else c.code++;
    })));
    return {c, projects:(typeof PROJECTS!=="undefined"&&PROJECTS?Object.keys(PROJECTS).length:0),
            buildDays:(typeof BUILD_PROJECTS!=="undefined"&&BUILD_PROJECTS?BUILD_PROJECTS.reduce((a,p)=>a+(p.days||[]).length,0):0)};
  });
  const TARGET10={choice:3000,input:1500,code:2000,debug:1000,review:800,log:500,sim:500};
  console.log("  10유형 구조 (목표 10,000문항 기준):");
  Object.keys(TARGET10).forEach(k=>{
    const now=cat10.c[k]||0, t=TARGET10[k];
    const bar=now>=t? "달성" : (t-now)+" 남음";
    console.log("    "+k.padEnd(7)+String(now).padStart(5)+" / "+String(t).padStart(5)+"   "+bar);
  });
  console.log("    project  "+cat10.projects+" 프로젝트 · "+cat10.buildDays+" 빌드랩 Day (목표 500문항 상당)");

  console.log("  리뷰 분포: "+JSON.stringify(revNow));
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
  const press=[];
  for(const idx of [1,2,5,6]){
    const has=await p.evaluate(i=>{ const n=document.querySelectorAll(".node")[i];
      if(!n) return false; n.scrollIntoView({block:"center"}); return true; }, idx);
    if(!has) continue;
    await p.waitForTimeout(180);
    const box=await p.evaluate(i=>{ const r=document.querySelectorAll(".node")[i].getBoundingClientRect();
      return {x:r.x+r.width/2, y:r.y+r.height/2}; }, idx);
    await p.mouse.move(box.x, box.y);
    await p.mouse.down();
    await p.waitForTimeout(110);
    const dx=await p.evaluate(([i,x])=>{ const r=document.querySelectorAll(".node")[i].getBoundingClientRect();
      return Math.round((r.x+r.width/2)-x); }, [idx, box.x]);
    await p.mouse.up();
    await p.waitForTimeout(220);
    const opened=await p.evaluate(()=>{ const on=document.getElementById("lesson").classList.contains("on");
      if(on){ document.getElementById("lesson").classList.remove("on"); document.body.style.overflow=""; }
      return on; });
    press.push({node:idx, dx, opened});
  }
  check("누르는 동안 별이 옆으로 움직이지 않는다", press.every(x=>Math.abs(x.dx)<=1), press);
  check("별을 그 자리에서 눌러 레슨이 열린다", press.length>0 && press.every(x=>x.opened), press);
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
    open(0,0);
    out.boxShown=!!document.getElementById("rc-in");
    out.optsHiddenFirst=!document.getElementById("opts");
    const q0=run.les.q[run.i];
    const ta=document.getElementById("rc-in"); ta.value=String(q0.o[q0.a]);
    ta.dispatchEvent(new Event("input")); document.getElementById("check").click();
    out.hitGraded=run.answered && run.rcHit && document.getElementById("foot").className==="foot good";

    open(0,1);
    document.getElementById("rc-in").value="전혀 관련 없는 대답";
    document.getElementById("rc-in").dispatchEvent(new Event("input"));
    document.getElementById("check").click();
    out.missRevealsOptions=!!document.getElementById("opts") && !!document.querySelector(".rc-mine");
    out.notAutoGraded=!run.answered;

    open(1,0);
    document.getElementById("rc-skip").click();
    out.skipRevealsOptions=!!document.getElementById("opts");

    S.recall=false; save(); open(0,0);
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
    openBuildLab(); blOpen(0); BL.di=0; blApplyDayFiles(); blRender();

    blRun(); await new Promise(r=>setTimeout(r,900));
    const seed=(BL.res||[]).filter(x=>x.ok).length, total=(BL.res||[]).length;

    Object.assign(S.build.orders.files, BUILD_SOL.orders[0]); save(); blRender();
    blRun(); await new Promise(r=>setTimeout(r,900));
    const sol=(BL.res||[]).filter(x=>x.ok).length;
    const recorded=S.build.orders.done.indexOf(1)>=0;

    S.build.orders.files["app.js"]="function handle(){ while(true){} }\nmodule.exports={handle};\n";
    save(); blRender(); blRun(); await new Promise(r=>setTimeout(r,6000));
    const loopGuard=!BL.running && (BL.res||[]).some(x=>/무한 루프/.test(x.err||""));

    closeBuildLab();
    return {seed, total, sol, recorded, loopGuard};
  });
  check("시작 코드로는 수용 기준을 통과하지 못한다", r.seed<r.total, r);
  check("참조 해답으로는 전부 통과한다", r.sol===r.total && r.total>0, r);
  check("통과한 Day 가 기록된다", r.recorded, r);
  check("무한 루프가 있어도 앱이 멈추지 않는다", r.loopGuard, r);
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
    tryOpen("프로필", ()=>openProfile2(), ".skb");
    try{ openGitLab(); out["Git 시뮬레이터"]=!!document.querySelector(".glm"); closeGitLab(); }
    catch(e){ out["Git 시뮬레이터"]="ERR "+e.message; }
    try{ openBuildLab(); out["빌드 랩"]=!!document.querySelector(".blp"); closeBuildLab(); }
    catch(e){ out["빌드 랩"]="ERR "+e.message; }
    document.body.style.overflow="";
    return out;
  });
  Object.keys(r).forEach(k=>check(k+" 화면이 열린다", r[k]===true, r[k]));
  await p.close();
 }

 const realErrs=errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e));
 check("페이지 에러 없음", realErrs.length===0, realErrs.slice(0,3));

 await browser.close();
 console.log("\n"+pass+" passed, "+fail+" failed");
 process.exit(fail?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
