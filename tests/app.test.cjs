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
    while(document.getElementById("lesson").classList.contains("on") && g++<50){
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
