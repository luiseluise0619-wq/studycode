/* Clear tool choices and keyboard navigation for every existing dialog. */
(function(){
  'use strict';
  const practical=['code','py','sql','html','react','ts','sim','arch','wire'];
  function closeProfile(){$('profile').classList.remove('on');document.body.style.overflow='';}
  function openTools(){
    const rows=[
      ['review','복습 노트','헷갈렸던 문제를 다시 풀고 설명을 확인해요.',startReview],
      ['path','성장 과정','지금부터 설계·운영까지, 무엇을 연습할지 살펴봐요.',openPath],
      ['build','직접 만드는 프로젝트','요구사항을 읽고 파일을 작성해 검사를 통과시켜요.',openBuildLab],
      ['git','Git 연습','커밋·브랜치·병합을 실수해도 괜찮은 곳에서 연습해요.',openGitLab],
      ['cause','장애 원인 찾기','로그와 단서로 문제의 원인을 좁혀요.',openDiags],
      ['sim','실무 판단','여러 선택의 결과를 비교하고 이유를 생각해요.',openSims],
      ['project','프로젝트 계획과 운영','요구사항·배포·장애 대응을 차례로 연습해요.',openProjects]
    ];
    const body=$('profile-body');body.innerHTML='<div class="home-kicker">배운 것을 써 보기</div><h2>어떤 연습을 해 볼까요?</h2><p class="sub">처음이라면 추천 레슨부터 시작하세요. 문법에 익숙해지면 작은 구현과 Git 연습을 함께 해 보세요.</p><div class="study-tool-grid">'+rows.map(([id,title,description])=>'<button class="study-tool-card" data-tool="'+id+'"><b>'+title+'</b><span>'+description+'</span><i aria-hidden="true">→</i></button>').join('')+'</div><details class="study-tool-settings"><summary>실행 설정과 상세 기록</summary><button data-tool="runner">C·C++·Java·Go 실행 서버 설정</button><button data-tool="ai">AI 도움 연결</button><button data-tool="records">상세 기록·포트폴리오·업적</button></details><button class="ovclose alt" id="study-tools-close">닫기</button>';
    const go=Object.fromEntries(rows.map(r=>[r[0],r[3]]));go.runner=openRunnerSetup;go.ai=openAiSetup;go.records=openProfile2;
    body.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{closeProfile();go[b.dataset.tool]();});$('study-tools-close').onclick=closeProfile;
    body.scrollTop=0;$('profile').classList.add('on');document.body.style.overflow='hidden';
  }
  $('study-tools').onclick=openTools;
  const oldCoach=openCoach;
  openCoach=function(){oldCoach();const notes=Object.values(S.studyNotes||{}).filter(n=>n.text&&n.text.trim()).slice(-5).reverse();if(!notes.length)return;const section=document.createElement('section');section.className='study-saved-notes';section.innerHTML='<h3>내 말로 정리한 내용</h3>'+notes.map(n=>'<article><b>'+escHtml(n.title)+'</b><small>'+escHtml(n.day)+'</small><p>'+escHtml(n.text)+'</p></article>').join('');$('cch-close').before(section);};
  $('profile-btn').onclick=openCoach;const progress=document.querySelector('[data-nav="progress"]');if(progress)progress.onclick=openCoach;

  // Give copied questions their original concept and difficulty in mixed reviews.
  const coreReview=startReview;
  startReview=function(){coreReview();if(!run||!run.review)return;
    for(const q of run.les.q){const track=q._studyTrack||run.lang,c=COURSES[track];if(!c)continue;
      let found=false;for(const u of c.units){for(const lesson of u.lessons){if((lesson.q||[]).some(item=>wKey(item)===wKey(q))){q._studyTheory=lesson.theory;q._studyLevel=LearningPath.questionLevel(q,u,lesson,track);found=true;break;}}if(found)break;}
    }
    if(!$('qbody').querySelector('.theory')){run.theoryShown=true;showQ();}
  };
  const oldQLevel=qLevel;qLevel=function(q,ui,total){return q&&q._studyLevel||oldQLevel(q,ui,total);};
  const oldShow=showQ;
  showQ=function(){
    if(run&&run.les&&run.les.q[run.i]&&run.les.q[run.i]._studyTrack)run.les.theory=run.les.q[run.i]._studyTheory||null;
    oldShow();
    if(run&&!$('qbody').querySelector('.theory')){
      const q=run.les.q[run.i],title=$('qbody').querySelector('.q-title');if(title){title.tabIndex=-1;title.setAttribute('aria-label',String(run.i+1)+'번 문제');}
      if(practical.includes(q.t)&&q.t!=='wire'&&q.t!=='arch')$('check').textContent='코드 검사하기';
      const draft=S.studyDraft,editor=$('pycode')||$('sqlcode')||$('livecode');
      if(editor&&draft&&draft.id===run.id&&draft.index===run.i&&draft.type===q.t)editor.value=draft.value;
    }
  };
  let draftTimer=null;
  document.addEventListener('input',e=>{
    if(!run||!run.id||run.answered||!['pycode','sqlcode','livecode'].includes(e.target.id))return;
    const q=run.les.q[run.i];S.studyDraft={id:run.id,track:run.lang,index:run.i,type:q.t,value:e.target.value.slice(0,50000),day:today()};
    S.studyResume={id:run.id,track:run.lang,next:run.i,correct:run.correct,answers:run.studyAnswers||[],resumeCurrent:true,hinted:!!run.studyHinted};
    clearTimeout(draftTimer);draftTimer=setTimeout(save,350);
  },true);
  addEventListener('pagehide',()=>{clearTimeout(draftTimer);save();});
  const oldEnd=endLesson;endLesson=function(passed){if(passed&&run&&S.studyDraft&&S.studyDraft.id===run.id)S.studyDraft=null;return oldEnd(passed);};

  const surfaces=['onboard','tracev','profile','curr','proj','lab','aiov','confirm','blab','gitlab','lesson','done'].map(id=>$(id)).filter(Boolean);
  const shell=document.querySelector('.study-shell');const previous=new Map();let stack=[];
  const names={onboard:'학습 계획',lesson:'레슨',done:'학습 결과',blab:'직접 만드는 프로젝트',gitlab:'Git 연습',profile:'학습 도구와 기록',aiov:'AI 도움 설정',confirm:'확인',tracev:'코드 실행 과정',curr:'학습 계획',proj:'프로젝트',lab:'프로젝트 연습'};
  surfaces.forEach(el=>{el.setAttribute('role',el.id==='confirm'?'alertdialog':'dialog');el.setAttribute('aria-label',names[el.id]||'학습 화면');el.tabIndex=-1;});
  const selector='button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],summary,[tabindex="0"]';
  function focusable(el){return [...el.querySelectorAll(selector)].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert]'));}
  function sync(){
    const open=surfaces.filter(el=>el.classList.contains('on'));
    const removed=stack.filter(el=>!open.includes(el));stack=stack.filter(el=>open.includes(el));
    const added=open.filter(el=>!stack.includes(el));added.forEach(el=>{previous.set(el,document.activeElement);stack.push(el);});
    const top=stack[stack.length-1];
    shell.inert=!!top;document.body.style.overflow=top?'hidden':'';
    surfaces.forEach(el=>{el.inert=el!==top;el.setAttribute('aria-hidden',String(el!==top));if(el===top)el.setAttribute('aria-modal','true');else el.removeAttribute('aria-modal');});
    if(added.length)requestAnimationFrame(()=>{if(stack[stack.length-1]===top){const target=focusable(top)[0]||top;if(!top.contains(document.activeElement))target.focus({preventScroll:true});}});
    else if(removed.length){const original=previous.get(removed[removed.length-1]);if(original&&original.isConnected&&!original.closest('[inert]'))original.focus({preventScroll:true});else if(top)(focusable(top)[0]||top).focus({preventScroll:true});else ($('vibe-start')||$('hero-cta')).focus({preventScroll:true});}
  }
  const observer=new MutationObserver(sync);surfaces.forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}));sync();
  window.StudyDialogs={register(el,label){if(surfaces.includes(el))return;surfaces.push(el);el.setAttribute('role','dialog');el.setAttribute('aria-label',label);el.tabIndex=-1;observer.observe(el,{attributes:true,attributeFilter:['class']});sync();}};
  document.addEventListener('keydown',e=>{
    const top=stack[stack.length-1];if(!top)return;
    if(e.key==='Tab'){const items=focusable(top),first=items[0],last=items[items.length-1];if(!items.length){e.preventDefault();top.focus();}else if(e.shiftKey&&(document.activeElement===first||!top.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!top.contains(document.activeElement))){e.preventDefault();first.focus();}}
    if(e.key==='Escape'){
      e.preventDefault();e.stopImmediatePropagation();
      if(top.id==='lesson')$('quit').click();else if(top.id==='confirm')$('confirm-no').click();else if(top.id==='blab')$('bl-quit').click();else if(top.id==='gitlab')$('gl-quit').click();else if(top.id==='done')$('study-finish-home').click();else if(top.id==='onboard'){if(S.onboarded)$('study-setup-close').click();}else if(top.id==='tracev'&&typeof closeTrace==='function')closeTrace();else {const close=top.querySelector('.ovclose,.close-x');if(close)close.click();else top.classList.remove('on');}
    }
  },true);
})();
