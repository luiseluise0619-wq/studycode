/* New study journey: real clicks, reloads, saved answers and viewport checks. */
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const FILE=process.env.CR_URL||'file:///'+path.resolve(__dirname,'../index.html').replace(/\\/g,'/');
const SHOTS=process.env.CR_SCREENSHOTS;
let pass=0;
function check(name,value){assert.ok(value,name);pass++;console.log('ok '+name);}
(async()=>{
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:process.platform==='win32'?{channel:'msedge'}:{});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1100}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(FILE);
  await page.waitForSelector('#study-setup-start');
  if(SHOTS)await page.screenshot({path:path.join(SHOTS,'onboarding.png')});
  await page.locator('[data-experience="new"]').click();
  await page.locator('[data-minutes="10"]').click();
  await page.locator('#study-setup-start').click();
  await page.waitForFunction(()=>trackLoaded(curLang));
  check('처음 수준·10분 계획으로 시작',await page.evaluate(()=>S.learning.experience==='new'&&S.learning.minutes===10&&S.recall===false));
  check('첫 추천은 출력 입문',await page.locator('.vibe-foundation-title').innerText().then(t=>/출력/.test(t)));
  if(SHOTS)await page.screenshot({path:path.join(SHOTS,'desktop.png')});
  await page.locator('#hero-cta').click();
  await page.waitForSelector('.theory');
  check('문제 전에 예제와 개념',await page.locator('.theory').innerText().then(t=>t.includes('print')));
  await page.locator('#check').click();
  await page.locator('#study-concept').click();
  check('AI 연결 없이 개념 다시 보기',await page.locator('#study-concept-panel').count()===1);
  await page.locator('#study-concept').click();
  for(let i=0;i<2;i++){
   const q=await page.evaluate(()=>({t:run.les.q[run.i].t,a:run.les.q[run.i].a}));
   if(q.t==='choice')await page.locator('.opt[data-i="'+q.a+'"]').click();
   else await page.locator('#fill').fill(q.a[0]);
   await page.locator('#check').click();
   check('정답 뒤에도 해설 표시 '+i,await page.locator('.study-explanation.correct').count()===1);
   if(i===0&&SHOTS)await page.screenshot({path:path.join(SHOTS,'lesson.png')});
   if(i===0)await page.locator('#check').click();
  }
  check('힌트 기록과 정답 기록 보존',await page.evaluate(()=>S.learning.recent.length===2&&S.learning.recent[0].hinted===true&&S.learning.recent[1].hinted===false));
  await page.locator('#quit').click();await page.locator('#confirm-yes').click();
  await page.reload();await page.waitForSelector('.study-next');await page.waitForFunction(()=>trackLoaded(curLang));
  await page.locator('#hero-cta').click();
  check('새로고침 후 확인한 다음 문제부터 시작',await page.evaluate(()=>run.i===2&&run.correct===2));
  while(!(await page.locator('#done.on').count())){
   const q=await page.evaluate(()=>({t:run.les.q[run.i].t,a:run.les.q[run.i].a}));
   if(q.t==='choice')await page.locator('.opt[data-i="'+q.a+'"]').click();
   else if(q.t==='input')await page.locator('#fill').fill(q.a[0]);
   else throw Error('Unexpected starter type '+q.t);
   await page.locator('#check').click();await page.locator('#check').click();
  }
  check('완료 저장·진행중 기록 정리',await page.evaluate(()=>Object.keys(S.done).length===1&&!S.studyResume&&S.learning.recent.length===5));
  check('쉴 수 있는 완료 화면',await page.locator('#study-finish-home').count()===1);
  await page.locator('#study-finish-home').click();
  check('다음 추천은 완료 레슨 제외',await page.locator('.vibe-foundation-title').innerText().then(t=>!/화면에 출력하기/.test(t)));
  // Two tracks in one review must each retain their own evidence.
  await page.evaluate(async()=>{
   await ensureTrack('javascript');
   const find=track=>{for(const u of COURSES[track].units)for(const l of u.lessons){const q=l.q.find(q=>q.t==='choice');if(q)return q;}};
   S.wrongs=[{lang:'python',q:find('python'),box:0,due:today()},{lang:'javascript',q:find('javascript'),box:0,due:today()}];save();startReview();
  });
  for(let i=0;i<2;i++){
   const a=await page.evaluate(()=>run.les.q[run.i].a);await page.locator('.opt[data-i="'+a+'"]').click();await page.locator('#check').click();await page.locator('#check').click();
  }
  check('섞인 복습도 분야별로 기록',await page.evaluate(()=>new Set(S.learning.recent.slice(-2).map(x=>x.track)).size===2&&S.learning.recent.slice(-2).every(x=>x.review)));
  await page.locator('#study-finish-home').click();
  await page.locator('#study-plan-edit').click();await page.locator('[data-experience="advanced"]').click();await page.locator('[data-minutes="30"]').click();await page.locator('#study-setup-start').click();
  check('심화 수준 변경 후 기존 완료 보존',await page.evaluate(()=>S.learning.experience==='advanced'&&S.learning.minutes===30&&Object.keys(S.done).length===1));
  check('심화 수준에 맞는 추천',await page.evaluate(()=>LearningPath.recommendation(S,COURSES,{track:curLang,today:today()}).lesson.level>=3));
  await page.evaluate(()=>{const c=COURSES.python;for(let ui=0;ui<c.units.length;ui++)for(let li=0;li<c.units[ui].lessons.length;li++)if(S.done[lkey('python',ui,li)]){startLesson('python',ui,li);return;}});
  await page.locator('#check').click();
  check('완료 레슨은 복습으로 처리하고 객관식 보기를 바로 표시',await page.evaluate(()=>run.review===true&&!run.studyHinted&&!!$('opts')&&!$('rc-in')&&!$('rc-skip')));
  check('직접 고르면서 개념 다시 보기 유지',await page.locator('#study-concept').count()===1);
  await page.evaluate(()=>{$('lesson').classList.remove('on');document.body.style.overflow='';renderCourse();});
  await page.locator('[data-nav=path]').click();
  check('성장 과정에서 다섯 단계 직접 접근',await page.locator('.study-growth-stage').count()===5&&await page.locator('[data-growth-track]').count()>5);
  await page.locator('#path-close').click();
  await page.evaluate(()=>{S.theme='dark';save();applyTheme('dark');});
  if(SHOTS)await page.screenshot({path:path.join(SHOTS,'dark.png')});
  await page.evaluate(()=>{S.theme='light';save();applyTheme('light');});
  for(const width of [360,390,768,1440]){
   await page.setViewportSize({width,height:900});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   check(width+'px 가로 넘침 없음',!overflow);
   if(SHOTS&&width===390)await page.screenshot({path:path.join(SHOTS,'mobile.png')});
  }
  await page.reload();await page.waitForSelector('.study-next');
  check('수준·시간·완료 기록 재시작 후 보존',await page.evaluate(()=>S.learning.experience==='advanced'&&S.learning.minutes===30&&Object.keys(S.done).length===1));
  check('브라우저 실행 오류 없음',errors.length===0);
  console.log(pass+' study flow checks passed');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
