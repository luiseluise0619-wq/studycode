/* CodeRun's study experience. Existing exercises, grading and saved progress stay in the core. */
(function () {
  'use strict';
  const LP = window.LearningPath;
  const icons = {
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h3z"/>',
    review: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/><path d="M12 8v5l3 2"/>',
    route: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 7v5a3 3 0 0 0 3 3h6a3 3 0 0 0 0-6h-3M18 15v2"/>',
    chart: '<path d="M4 4v16h17M8 16v-4M13 16V8M18 16V5"/>',
    build: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 12"/>',
    settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  };
  function icon(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[k] || icons.book) + '</svg>'; }
  function profile() { return LP ? LP.profile(S) : {experience:'new',minutes:10}; }
  function recommendation(track) {
    if (LP) return LP.recommendation(S, COURSES, {track:track || curLang,today:today()});
    const c=COURSES[track || curLang];
    let lesson=null;
    c.units.some((u,ui)=>u.lessons.some((l,li)=>{if(!S.done[lkey(curLang,ui,li)]) {lesson={track:curLang,ui,li,title:l.title,level:1,minutes:5};return true;}return false;}));
    return {lesson,review:{count:dueCount(),minutes:2},steps:[],difficulty:{level:1},tracks:[curLang],stages:[]};
  }
  function levelName(n) { return (QLV[n] || QLV[1]).n; }
  function experienceName() { return {new:'처음 배우는 중',basic:'기초를 다지는 중',working:'실무를 연습하는 중',advanced:'설계를 깊이 배우는 중'}[profile().experience] || '처음 배우는 중'; }
  function launch(rec,preferLesson) {
    if (!preferLesson && rec.review && rec.review.count>0) { startReview(); return; }
    const l=rec.lesson;
    if(l) { if(curLang!==l.track){curLang=l.track;curCat=catOf(l.track);renderCats();renderLangs();renderCourse();} startLesson(l.track,l.ui,l.li); }
    else toast('이 분야의 레슨을 모두 마쳤어요. 다른 분야나 직접 만들기에 도전해 보세요.');
  }
  function closeOverlay(id) { $(id).classList.remove('on');document.body.style.overflow=''; }
  const coreStartLesson=startLesson;
  startLesson=function(lang,ui,li){
    if(!trackLoaded(lang)){coreStartLesson(lang,ui,li);return;}
    const resume=S.studyResume;coreStartLesson(lang,ui,li);
    if(run){run.studyStarted=Date.now();run.studyAnswers=[];run.studyPauseOffered=false;}
    if(run&&S.done[run.id])run.review=true;
    if(run&&resume&&resume.id===run.id&&resume.track===lang&&(resume.next>0||resume.resumeCurrent)){
      run.i=Math.min(resume.next,run.total);run.correct=Math.min(resume.correct,run.total);run.theoryShown=true;
      run.studyAnswers=Array.isArray(resume.answers)?resume.answers.slice():[];
      if(run.i>=run.total)endLesson(true);else {showQ();run.studyHinted=!!resume.hinted;run.studyRetried=!!(run.studyAnswers[run.i]&&!run.studyAnswers[run.i].firstCorrect);toast(resume.resumeCurrent?'작성하던 문제부터 이어서 풀어요.':'확인한 문제 다음부터 이어서 풀어요.');}
    }
  };
  const coreQLevel=qLevel;
  qLevel=function(q,ui,utotal){
    if(LP&&run&&!run.diag&&run.lang&&COURSES[run.lang]){
      const track=q&&q._studyTrack||run.lang, c=COURSES[track], u=c&&c.units[ui];
      return LP.questionLevel(q,u,run.les,track);
    }
    return coreQLevel(q,ui,utotal);
  };
  startReview=function beginReview(prepared){
    const tracks=[...new Set((S.wrongs||[]).map(w=>w.lang))].filter(t=>COURSES[t]);
    if(prepared!==true&&tracks.some(t=>!trackLoaded(t))){
      return Promise.allSettled(tracks.map(ensureTrack)).then(results=>{
        if(results.some(r=>r.status==='rejected'))toast('저장된 문제로 복습해요. 새 설명은 연결되면 가져올게요.');
        return beginReview(true);
      });
    }
    tracks.filter(trackLoaded).forEach(refreshWrongCopies);
    const wrongs=S.wrongs||[], due=wrongs.filter(w=>srsDue(w,today())), pool=due.length?due:wrongs;
    if(!pool.length){
      const rec=recommendation();const learned=rec.review&&rec.review.lesson;
      if(learned){startLesson(learned.track,learned.ui,learned.li);return;}
      toast('복습할 문제가 아직 없어요. 첫 레슨을 풀면 여기에 모아 둘게요.');return;
    }
    const rec=recommendation(),count=due.length?rec.review.count:({10:2,20:3,30:5}[profile().minutes]||2);
    const picked=shuffle(pool.slice()).slice(0,count).map(w=>Object.assign({},w.q,{_studyTrack:w.lang}));
    run={lang:picked[0]._studyTrack||curLang,les:{title:due.length?'오늘의 짧은 복습':'헷갈렸던 문제 다시 풀기',xp:10,q:picked},i:0,correct:0,total:picked.length,hearts:S.hearts,id:null,color:COURSES[curLang].color,free:true,review:true};openRun();
  };

  // A short, editable starting point. No test or account is needed to begin.
  openOnboard = function () {
    const o=$('onboard'), card=o.querySelector('.ovcard');
    let selected=profile().experience, minutes=profile().minutes;
    let goal=S.goal || 'free';
    const choices=[['new','코드의 뜻부터 배우고 싶어요','AI의 도움을 받아도, 한 줄씩 이해하기'],['basic','함수와 조건문을 써 봤어요','코드를 바꾸고 결과가 맞는지 확인하기'],['working','작은 프로그램을 만들어 봤어요','버그 수정과 실무 문제 풀기'],['advanced','설계·운영 경험이 있어요','성능·안정성·설계의 판단 연습']];
    card.classList.add('study-onboard');
    card.innerHTML='<div class="onb-logo"><span class="onb-mk">&lt;/&gt;</span> 코드런</div>'+
      '<div class="home-kicker">나에게 맞는 시작</div><h2 class="onb-title">어디부터 배워 볼까요?</h2>'+
      '<p class="sub">지금 편한 수준을 골라 주세요. 공부하면서 언제든 바꿀 수 있어요.</p>'+
      '<fieldset class="study-choice-field"><legend>현재 수준</legend><div class="study-choice-grid">'+choices.map(c=>'<button type="button" class="study-choice'+(c[0]===selected?' is-selected':'')+'" data-experience="'+c[0]+'" aria-pressed="'+(c[0]===selected)+'"><b>'+c[1]+'</b><span>'+c[2]+'</span></button>').join('')+'</div></fieldset>'+
      '<fieldset class="study-choice-field"><legend>하루에 공부할 시간</legend><div class="study-time">'+[10,20,30].map(n=>'<button type="button" data-minutes="'+n+'" class="'+(n===minutes?'is-selected':'')+'" aria-pressed="'+(n===minutes)+'">'+n+'분</button>').join('')+'</div><p class="study-muted">한 번에 많이 풀기보다, 이해하고 다시 풀 시간을 포함해요.</p></fieldset>'+
      '<label class="study-goal-label" for="study-goal">관심 분야</label><select id="study-goal"><option value="free">아직 고민 중이에요 · Python부터</option><option value="fullstack">웹 개발 · 화면 만들기부터</option><option value="backend">백엔드 · 서버와 데이터</option><option value="ds">데이터 분석 · Python과 SQL</option><option value="ai">AI 개발 · 데이터와 모델</option></select>'+
      '<button class="study-action" id="study-setup-start">'+(S.onboarded?'학습 계획 저장':'내 공부 시작하기')+icon('arrow')+'</button>'+
      (S.onboarded?'<button class="study-text-link" id="study-setup-close">변경 없이 닫기</button>':"<p class=\"study-muted study-center\">회원가입 없이 시작해요. 진도는 이 브라우저에 저장돼요.</p>");
    $('study-goal').value=goal;
    card.querySelectorAll('[data-experience]').forEach(b=>b.onclick=()=>{selected=b.dataset.experience;card.querySelectorAll('[data-experience]').forEach(x=>{x.classList.toggle('is-selected',x===b);x.setAttribute('aria-pressed',String(x===b));});});
    card.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>{minutes=+b.dataset.minutes;card.querySelectorAll('[data-minutes]').forEach(x=>{x.classList.toggle('is-selected',x===b);x.setAttribute('aria-pressed',String(x===b));});});
    $('study-setup-start').onclick=()=>{
      goal=$('study-goal').value;
      const wasOnboarded=S.onboarded;
      if(LP) S=LP.configure(S,{experience:selected,minutes});
      S.goal=goal; S.onboarded=true; S.freeMode=true;
      S.recall=false; S.dailyTarget={10:8,20:16,30:24}[minutes] || 8;
      save();closeOverlay('onboard');paintFree();
      if(!wasOnboarded || goal!=='free') { const p=COURSE_PATHS[goal];curLang=(p&&p.tracks[0]) || 'python';curCat=catOf(curLang); }
      renderCats();renderLangs();renderCourse();
      toast('학습 계획을 저장했어요. 오늘 할 공부부터 시작해 보세요.');
    };
    if($('study-setup-close')) $('study-setup-close').onclick=()=>closeOverlay('onboard');
    o.classList.add('on');document.body.style.overflow='hidden';
  };

  renderHero = function () {
    const rec=recommendation(), l=rec.lesson, due=dueCount();
    const completed=Object.keys(S.done || {}).length, p=profile();
    const c=COURSES[(l&&l.track) || curLang];
    const target=due?'기억을 다지는 짧은 복습':l?readerTitle(l.title):'다음 분야에 도전하기';
    $('hero').innerHTML='<div class="study-hero-grid"><div class="study-welcome">'+
      '<div class="home-kicker"><span class="study-dot"></span> 차근차근, 내 속도로</div>'+
      '<h2>AI와 함께 만들고,<br>코드의 뜻도 익혀요.</h2><p>코드가 하는 일을 설명하고, 한 줄씩 바꿔 보세요.<br>결과를 검사하고 오류를 고치는 힘을 길러요.</p>'+
      '<div class="study-stats"><div><b>'+completed+'</b><span>공부한 레슨</span></div><div><b>'+S.streak+'</b><span>이어서 공부한 날</span></div><div><b>'+due+'</b><span>오늘 복습할 문제</span></div></div></div>'+
      '<div class="study-next"><div class="study-next-top"><span class="study-tag">'+(due?'복습 먼저':'오늘의 공부')+'</span><span class="study-muted">하루 '+p.minutes+'분 계획</span></div>'+
      '<span class="study-next-track">'+escHtml(c.name)+' · 추천 '+levelName(rec.difficulty.level)+'</span><h3>'+escHtml(target)+'</h3>'+
      '<p>'+(due?'다시 볼 때가 된 문제 '+due+'개가 있어요. 오늘은 '+rec.review.count+'개만 먼저 풀어요.':l?(l.review?'한 번 공부한 내용이에요. 설명을 보기 전에 스스로 풀어 보세요.':l.reason)+'<br><span class="study-time-note">레슨 전체 약 '+l.minutes+'분'+(l.split?' · 오늘은 앞부분만 풀어도 좋아요.':' · 설명과 연습 포함')+'</span>':'배운 것을 작은 프로젝트에 써 보세요.')+'</p>'+
      '<button class="study-action" id="hero-cta">'+(due?'복습 시작하기':'공부 시작하기')+icon('arrow')+'</button>'+
      (due&&l?'<button class="study-text-link" id="study-new-lesson">새 레슨부터 시작하기</button>':'')+
      '<button class="study-text-link" id="study-plan-edit">수준과 공부 시간 바꾸기</button></div></div>'+
      '<div class="study-plan-strip"><span>'+icon('route')+' 나의 성장 과정</span><div>'+['첫 코드','코드 이해','기능 수정','문제 해결','설계·운영'].map((s,i)=>'<span class="study-stage'+(i===((rec.difficulty&&rec.difficulty.level)||p.startingLevel||1)-1?' is-active':'')+'">'+s+'</span>').join('<span class="study-stage-arrow" aria-hidden="true">→</span>')+'</div><button id="hero-path">성장 목표 보기 →</button></div>';
    $('hero-cta').onclick=()=>launch(rec);
    if($('study-new-lesson'))$('study-new-lesson').onclick=()=>launch(rec,true);
    $('study-plan-edit').onclick=openOnboard;
    $('hero-path').onclick=openPath;
  };
  renderReco = function () {
    const p=profile(),rec=recommendation();
    $('reco').innerHTML='<details class="study-steps"><summary class="study-section-title"><h2>오늘 공부 순서</h2><span>'+p.minutes+'분 계획 · 자세히 ▾</span></summary><div class="study-step-grid">'+
      rec.steps.map((step,i)=>'<div class="study-step"><span>'+String(i+1).padStart(2,'0')+'</span><b>'+escHtml(readerTitle(step.title))+' · '+step.minutes+'분</b><p>'+escHtml(step.description)+'</p></div>').join('')+'<p class="study-muted">시간은 예상이에요. 계획한 시간이 지나면 쉬어 갈 수 있게 알려 드려요.</p></div></details>';
  };
  const coreDaily=renderDaily;
  renderDaily=function(){coreDaily();const el=$('daily');const t=el.querySelector('.dtop>span');if(t)t.textContent='오늘의 작은 목표';const done=el.querySelector('.dtop .done');if(done&&todayCount()>=(S.dailyTarget||10))done.textContent='오늘 목표 완료 · 여기서 쉬어도 좋아요';};

  let showAllUnits=false, shownTrack=curLang,courseQuery='',courseSearchOpen=false;
  const coreCourse=renderCourse;
  renderCourse=function(){
    if(S.studyTrack!==curLang){S.studyTrack=curLang;save();}
    coreCourse();
    if(shownTrack!==curLang){showAllUnits=false;shownTrack=curLang;courseQuery='';courseSearchOpen=false;}
    const rec=recommendation(), c=COURSES[curLang], wrap=$('course');
    const heading=document.createElement('div');heading.className='study-course-heading';
    heading.innerHTML='<div><div class="home-kicker">한 단원씩 배우기</div><h2>'+escHtml(c.name)+' 학습 노트</h2><p>추천 레슨부터 연결해 배워요. 배운 내용은 직접 쓰는 연습으로 확인해요.</p></div><button class="study-search-toggle" id="study-search-toggle" aria-controls="study-course-search" aria-expanded="'+courseSearchOpen+'">레슨 찾기</button>';
    wrap.prepend(heading);
    const search=document.createElement('div');search.className='study-course-search';search.id='study-course-search';search.hidden=!courseSearchOpen;search.innerHTML='<label for="study-search-input">'+escHtml(c.name)+'에서 배우고 싶은 내용</label><input type="search" id="study-search-input" placeholder="단원이나 레슨 이름으로 찾기" autocomplete="off"><span id="study-search-status" role="status" aria-live="polite"></span>';heading.after(search);const input=search.querySelector('input');input.value=courseQuery;
    const project=wrap.querySelector('.track-proj');if(project&&LP.currentLevel(S,curLang)<3)project.hidden=true;
    const sections=[...wrap.querySelectorAll('.unit-sec')];
    sections.forEach((sec,ui)=>{
      sec.querySelectorAll('.node-wrap').forEach((row,li)=>{
        const b=row.querySelector('.node'), label=row.querySelector('.node-label'), les=c.units[ui].lessons[li];
        row.classList.add('study-lesson-row');b.classList.add('study-lesson-button');
        const done=b.classList.contains('done');
        const practical=(les.q||[]).some(q=>['code','py','sql','html','react','ts','sim','arch','wire'].includes(q.t));
        const evidence=S.lessonChecks&&S.lessonChecks[lkey(curLang,ui,li)],needsPractice=evidence&&evidence.accuracy<80;
        b.innerHTML='<span class="study-lesson-number">'+(done?'✓':String(li+1).padStart(2,'0'))+'</span><span class="study-lesson-label"><b>'+escHtml(label.textContent)+'</b><span>'+((les.q&&les.q.length)||les.n||0)+'문제 · '+(practical?'직접 작성하고 검사':'설명 + 연습')+'</span></span><span class="study-row-arrow">'+(done?(needsPractice?'다시 연습':'공부함'):'→')+'</span>';
        label.hidden=true;
      });
      const lv=LP?LP.lessonLevel(c.units[ui],c.units[ui].lessons[0],curLang):unitLevel(ui,c.units.length);
      const meta=sec.querySelector('.u-main>.k');
      if(meta) {const chip=meta.querySelector('.u-chip');meta.innerHTML='단원 '+String(ui+1).padStart(2,'0')+' · '+levelName(lv)+(chip?chip.outerHTML:'');}
      const suggested=rec.lesson&&rec.lesson.track===curLang&&rec.lesson.ui===ui;
      sec.hidden=!showAllUnits && ui>=6 && !suggested;
    });
    const bar=wrap.querySelector('.unit-bar');if(bar) {const label=bar.querySelector('.ub-t');if(label) label.textContent='나의 진도 '+trackProg(curLang).pct+'%';}
    if(sections.length>6){const more=document.createElement('button');more.className='study-more-units';more.textContent=showAllUnits?'추천 단원만 보기 ↑':'전체 '+sections.length+'개 단원 보기 ↓';more.onclick=()=>{showAllUnits=!showAllUnits;renderCourse();};wrap.appendChild(more);}
    const openStates=sections.map(sec=>!sec.querySelector('.path').hidden),normalize=text=>String(text).toLowerCase().replace(/\s+/g,'');
    function filterLessons(){let count=0;const term=normalize(courseQuery);
      sections.forEach((sec,ui)=>{const unitMatches=normalize(c.units[ui].title).includes(term);let found=false;sec.querySelectorAll('.node-wrap').forEach((row,li)=>{const matches=!term||unitMatches||normalize(c.units[ui].lessons[li].title).includes(term);row.hidden=!matches;if(matches){found=true;if(term)count++;}});const suggested=rec.lesson&&rec.lesson.track===curLang&&rec.lesson.ui===ui;sec.hidden=term?!found:(!showAllUnits&&ui>=6&&!suggested);const path=sec.querySelector('.path'),head=sec.querySelector('.unit-head'),open=term&&found?true:openStates[ui];path.hidden=!open;head.setAttribute('aria-expanded',String(open));head.classList.toggle('open',open);});
      $('study-search-status').textContent=term?(count?count+'개 레슨을 찾았어요.':'맞는 레슨이 없어요. 검색어를 짧게 바꿔 보세요.'):'전체 '+c.units.length+'개 단원에서 찾아요.';const more=wrap.querySelector('.study-more-units');if(more)more.hidden=!!term;
    }
    sections.forEach(sec=>{const head=sec.querySelector('.unit-head'),toggle=head.onclick;head.onclick=()=>{if(!courseQuery){toggle();return;}const path=sec.querySelector('.path');path.hidden=!path.hidden;head.setAttribute('aria-expanded',String(!path.hidden));head.classList.toggle('open',!path.hidden);};});
    input.oninput=()=>{courseQuery=input.value;filterLessons();};$('study-search-toggle').onclick=()=>{courseSearchOpen=!courseSearchOpen;search.hidden=!courseSearchOpen;$('study-search-toggle').setAttribute('aria-expanded',String(courseSearchOpen));if(courseSearchOpen)input.focus();else {courseQuery='';input.value='';filterLessons();}};filterLessons();
    if($('ub-toggle')){const coreToggle=$('ub-toggle').onclick;$('ub-toggle').onclick=()=>{showAllUnits=true;coreToggle();};}
    const nav=document.querySelector('[data-nav="home"]');if(nav)nav.classList.add('is-active');
  };

  // Hints and explanations are available without an AI connection.
  let lessonTools=null,lessonToolsRun=null,lessonToolsIndex=-1;
  const coreShowQ=showQ;
  showQ=function(){
    coreShowQ();
    if(!run || $('qbody').querySelector('.theory'))return;
    run.studyHinted=false;
    run.studyRetried=false;
    const q=run.les.q[run.i], tools=document.createElement('div');tools.className='study-lesson-tools';
    const kind={choice:'답 하나 고르기',input:'직접 답 적기',code:'코드 작성하기',py:'Python 작성하기',sql:'SQL 작성하기',review:'코드 검토하기',log:'원인 찾기'}[q.t] || '직접 연습하기';
    tools.innerHTML='<span>'+String(run.i+1).padStart(2,'0')+' / '+run.total+' · '+kind+'</span>'+(run.les.theory?'<button id="study-concept">개념 다시 보기</button>':'');
    lessonTools=tools;lessonToolsRun=run;lessonToolsIndex=run.i;$('qbody').prepend(tools);
    if($('study-concept'))$('study-concept').onclick=()=>{
      run.studyHinted=true;
      let panel=$('study-concept-panel');if(panel){panel.remove();return;}
      panel=document.createElement('details');panel.id='study-concept-panel';panel.className='study-concept-panel';panel.open=true;
      panel.innerHTML='<summary>이번 레슨의 개념</summary>'+renderTheory(run.les.theory);tools.after(panel);afterRender();
    };
    if($('check'))$('check').textContent='답 확인하기';
    const hint=document.querySelector('#qbody .hint-btn');if(hint)hint.addEventListener('click',()=>{run.studyHinted=true;});
  };
  const coreLogAnswer=logAnswer;
  logAnswer=function(ok,q){if(q._studyTrack&&run)run.lang=q._studyTrack;coreLogAnswer(ok,q);if(LP&&run&&!run.diag){
    const track=q._studyTrack||run.lang, c=COURSES[track], u=c&&c.units[run.ui];
    S=LP.recordAnswer(S,{track,lessonId:run.id,level:LP.questionLevel(q,u,run.les,track),correct:ok,hinted:!!run.studyHinted,review:!!run.review,type:q.t,questionId:LP.questionId(q),day:today()});save();
  }};
  const coreApplyResult=applyResult;
  applyResult=function(ok,correctText,q){
    if(!run||run.les.q[run.i]!==q||!$('lesson').classList.contains('on')||run.answered)return;
    coreApplyResult(ok,correctText,q);
    $('qbody').querySelectorAll('.study-explanation').forEach(e=>e.remove());
    const panel=document.createElement('div');panel.className='study-explanation '+(ok?'correct':'incorrect');panel.setAttribute('role','status');
    // Explanation markup is authored with the exercise; unlike an answer, it is useful on success too.
    panel.innerHTML='<b>'+(ok?'맞았어요. 이유도 확인해 보세요.':'아직 맞지 않는 부분이 있어요.')+'</b>'+
      (!ok?'<div class="study-answer">'+(['choice','input'].includes(q.t)?'정답: ':'검사 결과: ')+escHtml(String(correctText).replace(/<[^>]*>/g,''))+'</div>':'')+
      (q.ex?'<div class="study-answer-ex">'+q.ex+'</div>':'<p>개념과 예제를 다시 읽으며 답이 나온 과정을 확인해 보세요.</p>')+
      (typeof ReaderGuide!=='undefined'?ReaderGuide.html(ReaderGuide.related(q,null,run.lang,1)): '')+
      (!ok?'<p class="study-muted">이 문제는 복습 목록에 담았어요. 나중에 다시 풀어 봐요.</p>':'');
    $('qbody').appendChild(panel);
    if(!ok&&liveTest&&Array.isArray(liveTest.rows)&&['code','py','ts'].includes(q.t)){
      const failed=liveTest.rows.filter(row=>!row[0]).slice(0,3);if(failed.length){const details=document.createElement('div');details.className='study-result-detail';details.innerHTML='<b>이 입력부터 확인해 보세요.</b>'+failed.map(row=>'<p><code>'+escHtml(row[1])+'</code><br>기대: <code>'+escHtml(row[3])+'</code><br>현재: <code>'+escHtml(row[2])+'</code></p>').join('');panel.querySelector('.study-answer').after(details);}
    }
    if(!run.studyAnswers)run.studyAnswers=[];
    const previous=run.studyAnswers[run.i];
    run.studyAnswers[run.i]={correct:!!ok,hinted:!!run.studyHinted,firstCorrect:previous?previous.firstCorrect:!!ok};
    if(!ok&&(q.outputRecall||['code','py','sql','html','react','ts','sim','arch','wire'].includes(q.t))){
      const retry=document.createElement('button');retry.type='button';retry.className='study-retry';retry.id='study-retry';retry.textContent=q.outputRecall?'출력 다시 적어 보기':'코드 고쳐서 다시 검사하기';
      retry.onclick=()=>{run.answered=false;run.studyHinted=true;run.studyRetried=true;if(run.id){S.studyResume={id:run.id,track:run.lang,next:run.i,correct:run.correct,answers:run.studyAnswers,resumeCurrent:true,hinted:true};save();}panel.remove();const chk=$('check');chk.disabled=false;chk.className='btn';chk.textContent=q.outputRecall?'답 확인하기':'코드 검사하기';chk.onclick=onCheck;$('foot').className='foot';$('foot-msg').textContent=q.outputRecall?'코드를 다시 읽고 출력을 적어 보세요.':'실패한 입력을 보고 코드를 고쳐 보세요.';const editor=q.outputRecall?$('fill'):$('pycode')||$('sqlcode')||$('livecode');if(editor){if(q.outputRecall)editor.disabled=false;editor.focus();}};panel.appendChild(retry);
    }
    if(ok&&run.studyRetried){const wrong=(S.wrongs||[]).find(w=>w.lang===run.lang&&wKey(w.q)===wKey(q));if(wrong){wrong.box=Math.max(1,wrong.box||0);wrong.due=srsAddDays(today(),1);save();paintReview();}}
    $('foot-msg').textContent=ok?'이유를 확인했다면 다음 문제로 가요.':'틀린 이유를 확인하고 다음 문제로 가요.';
    $('check').textContent=run.i+1>=run.total?'학습 마치기':'다음 문제';afterRender();
    if(run.id&&!run.diag){S.studyResume={id:run.id,track:run.lang,next:run.i+1,correct:run.correct,answers:run.studyAnswers};save();}
    if(run.studyStarted&&!run.studyPauseOffered&&Date.now()-run.studyStarted>=profile().minutes*60000&&run.i+1<run.total){run.studyPauseOffered=true;const pause=document.createElement('div');pause.className='study-pause';pause.innerHTML='<b>오늘 계획한 '+profile().minutes+'분이 지났어요.</b><p>지금까지 확인한 답은 저장했어요. 남은 문제는 다음에 이어 풀어도 돼요.</p><button type="button" id="study-pause-save">저장하고 쉬기</button>';pause.querySelector('button').onclick=()=>{disposeMon();$('lesson').classList.remove('on');document.body.style.overflow='';renderCourse();};panel.appendChild(pause);}
    requestAnimationFrame(()=>{if(panel.isConnected){const body=$('qbody');if(panel.getBoundingClientRect().bottom>body.getBoundingClientRect().bottom)body.scrollTo({top:panel.offsetTop-body.offsetTop-20,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
  };
  const coreEndLesson=endLesson;
  endLesson=function(passed){
    const wasDiag=run&&run.diag;
    if(passed&&!wasDiag&&run&&run.id){const answers=run.studyAnswers||[];if(!S.lessonChecks)S.lessonChecks={};S.lessonChecks[run.id]={accuracy:Math.round(run.correct/run.total*100),independent:answers.filter(a=>a&&a.correct&&!a.hinted&&a.firstCorrect).length,total:run.total,day:today(),seq:profile().totalAnswers};save();}
    coreEndLesson(passed);if(!passed||wasDiag)return;
    if(S.studyResume&&S.studyResume.id===run.id){S.studyResume=null;save();}
    const mistakes=run.total-run.correct;
    $('done-title').textContent='레슨을 마쳤어요';
    const independent=(run.studyAnswers||[]).filter(a=>a&&a.correct&&!a.hinted&&a.firstCorrect).length;
    $('done-sub').textContent=mistakes?'맞힌 문제 '+run.correct+'개, 다시 볼 문제 '+mistakes+'개. 틀린 부분을 알아낸 것도 공부예요.':independent<run.total?'모든 문제를 마쳤어요. 이 중 '+independent+'개는 도움 없이 처음에 해결했어요. 다음에는 해설 없이 다시 풀어 보세요.':'모든 문제를 혼자 해결했어요. 다음에는 배운 내용을 다른 상황에도 써 보세요.';
    let plan=$('study-finish-plan');if(plan)plan.remove();plan=document.createElement('div');plan.id='study-finish-plan';plan.className='study-finish-plan';
    const rec=recommendation();
    plan.innerHTML='<span class="home-kicker">다음 한 걸음</span><b>'+escHtml(mistakes?'틀린 문제를 다시 풀어 보기':rec.lesson?readerTitle(rec.lesson.title):'배운 내용으로 직접 만들기')+'</b><p>여기서 쉬어도 좋아요. 다음에 오면 이어서 시작할 수 있어요.</p>'+
      '<button class="study-text-link" id="study-finish-home">오늘 공부는 여기까지</button>';
    const noteKey=run.id||run.lang+':'+today(),reflection=document.createElement('details');reflection.className='study-reflection';
    reflection.innerHTML='<summary>한 문장으로 정리해 보기 · 선택</summary><label for="study-note">'+escHtml(readerTitle(run.les.title))+'에서 배운 내용은 무엇인가요?</label><textarea id="study-note" rows="3" maxlength="500" placeholder="왜 이 답이 맞는지, 다음에는 어디에 쓸지 적어 보세요."></textarea><span>학습 기록에 저장해요. 글의 길이로 실력을 평가하지 않아요.</span>';
    plan.appendChild(reflection);const note=reflection.querySelector('textarea'),title=run.les.title,track=run.lang;if(S.studyNotes&&S.studyNotes[noteKey])note.value=S.studyNotes[noteKey].text;
    let noteTimer;note.oninput=()=>{if(!S.studyNotes)S.studyNotes={};S.studyNotes[noteKey]={title,track,text:note.value,day:today()};const keys=Object.keys(S.studyNotes);if(keys.length>200)delete S.studyNotes[keys[0]];clearTimeout(noteTimer);noteTimer=setTimeout(save,350);};
    $('done-next').before(plan);$('done-next').textContent=mistakes?'틀린 문제 복습하기':'다음 레슨 시작하기';
    const returnHome=()=>{$('done').classList.remove('on');document.body.style.overflow='';renderLangs();renderCourse();};
    $('study-finish-home').onclick=returnHome;
    $('done-next').onclick=()=>{returnHome();if(mistakes)startReview();else launch(rec,true);};
  };
  const coreIntro=openIntro;
  openIntro=function(key,onStart){coreIntro(key,onStart);const b=$('profile-body');const h=b.querySelector('.ovh');if(h)h.textContent='시작 전에 알아두면 좋은 것';};
  introBannerHtml=function(key){const it=TRACK_INTRO[key],c=COURSES[key];if(!it||!c)return '';return '<button type="button" class="intro-banner" id="intro-banner"><span class="ib-m"><span class="ib-k">이 분야가 처음이라면</span><span class="ib-t">'+escHtml(c.name)+'은 어디에 쓰일까요?</span></span><span class="ib-go">소개 읽기 →</span></button>';};
  const coreTheory=showTheory;
  showTheory=function(){coreTheory();$('check').textContent='예제를 읽었어요 · 문제 풀기';};
  coachLines=function(){
    const rec=recommendation(),rows=recentHist(7),q=rows.reduce((n,r)=>n+r.q,0),ok=rows.reduce((n,r)=>n+r.ok,0),days=rows.filter(r=>r.q>0).length;
    const lines=q?['최근 7일 동안 '+days+'일 공부하며 '+q+'문제를 풀었어요. 정답률은 '+Math.round(ok/q*100)+'%예요.']:['아직 풀이 기록이 적어요. 첫 레슨을 풀고 나면 다음 공부를 함께 정해요.'];
    if(rec.difficulty){lines.push(rec.difficulty.reason);lines.push(COURSES[curLang].name+'의 현재 추천 난이도는 '+levelName(rec.difficulty.level)+'예요. 다른 분야의 기록은 이 난이도를 올리지 않아요.');}
    if(dueCount())lines.push('오늘 다시 볼 오답이 '+dueCount()+'개 있어요. 짧게 복습하고 새 레슨으로 넘어가도 괜찮아요.');
    lines.push('보기에서 답을 고르는 데 익숙해졌다면, 직접 코드를 쓰거나 답을 설명해 보세요.');return lines;
  };
  document.addEventListener('click',function(e){if(run&&!run.answered&&e.target.closest('#ask-send,.ask-chip'))run.studyHinted=true;},true);
  new MutationObserver(()=>{
    if(lessonTools&&run===lessonToolsRun&&run.i===lessonToolsIndex&&!$('qbody').querySelector('.theory,.study-lesson-tools'))$('qbody').prepend(lessonTools);
  }).observe($('qbody'),{childList:true});
  const coreAiAsk=aiAskInto;
  aiAskInto=function(){if(run&&!run.answered)run.studyHinted=true;return coreAiAsk.apply(this,arguments);};

  openPath=function(){
    const o=$('profile'),body=$('profile-body'),p=profile(),stages=LP.stages(S,COURSES),active=LP.currentLevel(S,curLang);
    const practice=[['코드 한 줄의 뜻 설명하기','도움을 받아 만든 코드도 읽어 보세요. 입력과 출력이 무엇인지 확인해요.'],['한 가지 바꾸고 결과 확인하기','변수·함수·조건의 뜻을 이해하고, 바꿨을 때 무엇이 달라지는지 예상해요.'],['작은 기능 완성하고 검사하기','AI의 초안이나 빈 코드에서 시작해 기능을 만들어요. 정상 입력과 잘못된 입력을 모두 검사해요.'],['버그·장애 해결','로그와 실패한 테스트로 원인을 좁혀요. 수정한 이유와 다시 생기지 않게 할 방법을 설명해요.'],['설계 선택 설명','성능, 비용, 안정성을 비교해요. 선택의 이유와 실제로 확인한 근거를 함께 설명해요.']];
    body.innerHTML="<div class=\"home-kicker\">만들면서 이해하기</div><h2>도움받아 시작하고, 스스로 고칠 수 있게</h2><p class=\"sub\">AI와 함께 만들어도 좋아요. 무엇이 동작하고, 왜 동작하는지 설명하며 배워요. 익숙해질수록 더 큰 기능과 설계 판단을 연습해요.</p>"+
      stages.map((s,i)=>'<section class="study-growth-stage'+(active===s.level?' active':'')+'"><div class="study-growth-head"><span>'+String(i+1).padStart(2,'0')+'</span><h3>'+s.name+'</h3>'+(active===s.level?'<b>현재 추천 단계</b>':'')+'</div><h4>'+practice[i][0]+'</h4><p>'+practice[i][1]+'</p><div class="study-growth-tracks">'+s.tracks.map(t=>'<button data-growth-track="'+t+'">'+escHtml(COURSES[t].name)+' →</button>').join('')+'</div>'+(i===2?'<button class="study-text-link" data-growth-go="build">직접 만드는 프로젝트 열기 →</button>':i===3?'<button class="study-text-link" data-growth-go="diag">장애 원인 추적해 보기 →</button>':i===4?'<button class="study-text-link" data-growth-go="sim">실무 설계 판단해 보기 →</button>':'')+'</section>').join('')+
      "<p class=\"sub\">학습 결과를 실제 프로젝트에 써 보세요. 직접 만들고 운영하며 얻은 경험이 다음 단계의 판단을 더 정확하게 해 줘요.</p><button class=\"ovclose alt\" id=\"path-close\">닫기</button>";
    body.querySelectorAll('[data-growth-track]').forEach(b=>b.onclick=()=>{closeOverlay('profile');gotoTrack(b.dataset.growthTrack);});
    body.querySelectorAll('[data-growth-go]').forEach(b=>b.onclick=()=>{closeOverlay('profile');({build:openBuildLab,diag:openDiags,sim:openSims})[b.dataset.growthGo]();});
    $('path-close').onclick=()=>closeOverlay('profile');body.scrollTop=0;o.classList.add('on');document.body.style.overflow='hidden';
  };

  // Navigation exposes practical work without crowding the first lesson.
  const shell=document.createElement('div');shell.className='study-shell';const home=$('home');home.before(shell);
  const aside=document.createElement('aside');aside.className='study-sidebar';aside.setAttribute('aria-label','주 메뉴');
  aside.innerHTML='<a class="study-brand" href="#home"><span>&lt;/&gt;</span><b>코드런<small>조금씩, 확실하게</small></b></a><div class="study-nav-label">나의 공부</div><nav class="study-nav">'+
    [['home','book','오늘의 공부'],['review','review','복습 노트'],['path','route','성장 과정'],['progress','chart','나의 기록']].map(x=>'<button class="study-nav-link'+(x[0]==='home'?' is-active':'')+'" data-nav="'+x[0]+'">'+icon(x[1])+x[2]+'</button>').join('')+
    '<div class="study-nav-label">배운 것을 써 보기</div>'+[['build','build','직접 만들기'],['git','route','Git 연습'],['sim','review','실무 판단']].map(x=>'<button class="study-nav-link" data-nav="'+x[0]+'">'+icon(x[1])+x[2]+'</button>').join('')+'</nav>'+
    '<div class="study-sidebar-foot"><div class="study-sidebar-note"><b>작게 시작해도 괜찮아요.</b><p>한 번 더 떠올리고,<br>한 번 더 직접 만들어 봐요.</p></div><button class="study-nav-link" data-nav="settings">'+icon('settings')+"공부 설정</button><span>내 기록은 자동 저장돼요</span></div>";
  shell.append(aside,home);
  const GO={home:()=>{window.scrollTo({top:0,behavior:'smooth'});},review:startReview,path:openPath,progress:openCoach,build:openBuildLab,git:openGitLab,sim:openSims,settings:openOnboard};
  aside.querySelectorAll('[data-nav]').forEach(b=>b.onclick=GO[b.dataset.nav]);
  home.querySelector('.lgtitle').hidden=true;
  const heading=document.createElement('div');heading.className='home-heading';
  heading.innerHTML='<div><div class="home-kicker">나의 공부 노트</div><h1>오늘도 한 걸음.</h1><p class="home-subtitle">AI와 만들고, 코드의 뜻을 이해해요.</p></div><span class="home-status">'+icon('book')+' 나만의 학습 공간</span>';
  $('hero').before(heading);
  $('profile-btn').textContent='나의 기록';$('profile-btn').onclick=openCoach;
  const toolButton=document.createElement('button');toolButton.className='navbtn';toolButton.id='study-tools';toolButton.textContent='학습 도구';toolButton.onclick=openProfile2;$('profile-btn').before(toolButton);
  $('random-btn').textContent='이 분야 문제 섞어 풀기';
  $('random-btn').onclick=()=>{
    if(!trackLoaded(curLang)){ensureTrack(curLang).then(()=>$('random-btn').click()).catch(()=>toast('문제를 불러오지 못했어요.'));return;}
    const c=COURSES[curLang], rec=recommendation();const lv=(rec.difficulty&&rec.difficulty.level)||1;
    const pool=[];c.units.forEach((u,ui)=>u.lessons.forEach(l=>{const level=LP?LP.lessonLevel(u,l,curLang):unitLevel(ui,c.units.length);if(level<=lv+1)(l.q||[]).forEach(q=>pool.push(q));}));
    const picked=shuffle(pool).slice(0,profile().minutes===10?8:12);
    if(!picked.length){toast('이 수준의 문제를 찾지 못했어요. 단원에서 직접 골라 보세요.');return;}
    run={lang:curLang,les:{title:c.name+' 맞춤 연습',xp:10,q:picked},i:0,correct:0,total:picked.length,hearts:S.hearts,id:null,color:c.color,free:true};openRun();
  };
  $('free-btn').hidden=true;
  let smallScreen=innerWidth<=700;
  addEventListener('resize',()=>{const next=innerWidth<=700;if(next!==smallScreen){smallScreen=next;renderReco();}});
  const toolsTitle=home.querySelector('.section-eyebrow');if(toolsTitle)toolsTitle.textContent='가볍게 연습하기';
  renderCourse();
  if(!S.onboarded)openOnboard();
})();
