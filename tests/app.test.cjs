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
 async function page(state){
   const p=await browser.newPage({viewport:{width:390,height:800}});
   p.on("pageerror",e=>errs.push("pageerror: "+e.message));
   await p.addInitScript(s=>{ try{ localStorage.setItem("coderun", JSON.stringify(s)); }catch(e){} },
     Object.assign({onboarded:true, goal:"free", freeMode:true}, state||{}));
   await p.goto(FILE);
   await p.waitForFunction(()=>typeof COURSES!=="undefined", {timeout:60000});
   await p.waitForTimeout(700);
   return p;
 }

 /* ---------- 콘텐츠 무결성 ---------- */
 {
  const p=await page();
  const r=await p.evaluate(()=>{
    let units=0, lessons=0, qs=0, noTheory=0, badTheory=0, badChoice=0, badLog=0;
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
      });
    });});
    const introMissing=Object.keys(COURSES).filter(k=>!TRACK_INTRO[k]);
    return {units, lessons, qs, byType, noTheory, badTheory, badChoice, badLog,
            introMissing, missions:GIT_MISSIONS.length, sims:SIMS.length, diags:DIAGS.length};
  });
  check("모든 레슨에 이론이 있다", r.noTheory===0, {noTheory:r.noTheory});
  check("이론이 요약·본문2절·예제·요점을 모두 갖춘다", r.badTheory===0, {badTheory:r.badTheory});
  check("선택형은 4개의 서로 다른 보기와 유효한 정답을 갖는다", r.badChoice===0, {badChoice:r.badChoice});
  check("로그 문항 구조가 올바르다", r.badLog===0, {badLog:r.badLog});
  check("모든 트랙에 분야 소개가 있다", r.introMissing.length===0, r.introMissing);
  check("Git 미션 12개", r.missions===12, {missions:r.missions});
  console.log("  콘텐츠: "+r.qs+"문항 / "+r.units+"유닛 / "+r.lessons+"레슨 · 유형 "+JSON.stringify(r.byType));
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
  const p=await page();
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
