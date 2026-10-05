/* Copy changes must keep progress, explain the right meaning, and grade recalled output precisely. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),Guide=require('../data/reader-guide.js'),LP=require('../data/learning-path.js');
const fixtures=require('./fixtures/reader-progress.json'),answers=require('../tools/content/reader-output-answers.json');
let passed=0;
function check(name,value){assert.ok(value,name);passed++;console.log('PASS '+name);}
function register(name){let data;vm.runInNewContext(fs.readFileSync(path.join(root,'data',name),'utf8'),{__CR:(k,v)=>data=v});return data;}
const tracks=Object.fromEntries(fs.readdirSync(path.join(root,'data')).filter(n=>/^t-.*\.js$/.test(n)).map(n=>[n.slice(2,-3),register(n)]));
const all=Object.entries(tracks).flatMap(([track,units])=>units.flatMap(u=>u.l.flatMap(l=>l.q.map(q=>({track,q})))));
check('13,852 questions retain an explicit stable identity',all.length===13852&&all.every(({q})=>/^[a-z0-9]+$/.test(q.qid)));
check('legacy question hashes still find the current question',fixtures.every(f=>LP.questionId(f.q)===f.qid&&tracks[f.track].some(u=>u.l.some(l=>l.q.some(q=>LP.questionId(q)===f.qid)))));
check('38 tracks have their own analogy',Object.values(register('intro.js')).length===38&&Object.values(register('intro.js')).every(t=>t.analogy?.length>40));
check('175 definitions are available without an AI request',Object.keys(Guide.definitions).length===175);
check('an array index never gets a database-index explanation',!Guide.related({q:'배열의 인덱스 0은 어떤 위치일까요?'},null,'javascript',3).some(x=>x.name==='인덱스'));
check('SQL index gets its database explanation',Guide.related({q:'조회 인덱스는 왜 만들까요?'},null,'sql',1)[0].name==='인덱스');
check('precision, regression and tokens respect their domain',!Guide.compatible('정밀도','javascript','소수점 정밀도')&&!Guide.compatible('회귀','ml','선형 회귀')&&!Guide.compatible('토큰','ai','언어 모델의 토큰')&&Guide.compatible('회귀','test','회귀 테스트'));
check('glossary examples cannot inject markup',!Guide.html([{name:'<img src=x>',text:'<script>alert(1)</script>'}]).includes('<script>')&&Guide.html([{name:'<img src=x>',text:'safe'}]).includes('&lt;img'));
check('output recall keeps code while requiring case-aware answers',Object.keys(answers).length===39&&all.filter(({q})=>q.outputRecall).length===39&&all.filter(({q})=>q.outputRecall).every(({q})=>q.t==='input'&&q.caseSensitive&&JSON.stringify(q.a)===JSON.stringify(answers[q.qid])));
const {prose}=require('../tools/content/reader-copy.cjs');
check('tone changes preserve clauses joined through emphasis tags',prose('<b>값이 원인이 아니다</b>는 증거입니다.')==='<b>값이 원인이 아니다</b>는 증거예요.');
check('parenthesized prose changes without changing inline examples',prose('숫자는 그대로 쓴다(`42`).')==='숫자는 그대로 써요(`42`).');
check('the smallest-counterexample question describes its real boundary',all.find(({q})=>q.qid==='3o0ptp').q.q.includes('4개 이상이면'));

(async()=>{
 const {chromium}=require('playwright'),browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:process.platform==='win32'?{channel:'msedge'}:{});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(fixtures=>{if(top===window)localStorage.setItem('coderun',JSON.stringify({onboarded:true,goal:'free',freeMode:true,recall:false,xp:173,done:{'old-completed-lesson':true},learning:{experience:'basic',configured:true,minutes:10,totalAnswers:1,recent:[{seq:1,track:'python',questionId:fixtures[0].qid,correct:false,level:1,day:'2026-10-01'}]},wrongs:fixtures.map(f=>({lang:f.track,q:f.q,box:2,due:'2099-01-01',last:'2026-10-01'}))}));},fixtures);
  await page.goto(process.env.CR_URL||'file:///'+path.join(root,'index.html').replace(/\\/g,'/'));
  await page.waitForFunction(()=>typeof ReaderGuide!=='undefined'&&trackLoaded(curLang));
  await page.evaluate(()=>startReview());
  check('review loads old tracks before replacing saved copy',await page.evaluate(()=>trackLoaded('sql')&&S.wrongs.every(w=>w.q.qid)));
  check('review preserves intervals, XP, completion and history',await page.evaluate(()=>S.xp===173&&S.done['old-completed-lesson']&&S.learning.recent[0].questionId==='1lbwfip'&&S.wrongs.every(w=>w.box===2&&w.due==='2099-01-01'&&w.last==='2026-10-01')));
  check('saved output question is upgraded to recall without losing identity',await page.evaluate(()=>S.wrongs.find(w=>w.lang==='python').q.t==='input'&&S.wrongs.find(w=>w.lang==='python').q.qid==='1lbwfip'));
  const list=all.filter(({q})=>q.outputRecall);
  await page.evaluate(()=>{$('lesson').classList.remove('on');document.body.style.overflow='';});
  for(const {track,q} of list){
   await page.evaluate(({track,q})=>{run={lang:track,les:{title:'출력 읽기',xp:10,q:[q]},i:0,correct:0,total:1,hearts:5,id:null,color:'#b94e2b',free:true,review:true};openRun();},{track,q});
   await page.locator('#fill').fill(q.a[0]);await page.locator('#check').click();
   assert.equal(await page.evaluate(()=>run.correct),1,q.qid+' accepted output');
  }
  check('all 39 output questions accept their real output in the app',true);
  const upper=list.find(({q})=>q.qid==='1lbwfip');
  await page.evaluate(({track,q})=>{run={lang:track,les:{title:'출력 읽기',xp:10,q:[q]},i:0,correct:0,total:1,hearts:5,id:null,color:'#b94e2b',free:true,review:true};openRun();},upper);
  await page.locator('#fill').fill('hello');await page.locator('#check').click();
  check('wrong letter case is rejected',await page.evaluate(()=>run.correct===0));
  await page.locator('#study-retry').click();await page.locator('#fill').fill('HELLO');await page.locator('#check').click();
  check('case correction can be retried and graded',await page.evaluate(()=>run.correct===1));
  check('a correction after seeing the answer is recorded as assisted',await page.evaluate(()=>run.studyAnswers[0].firstCorrect===false&&run.studyAnswers[0].hinted===true));
  await page.evaluate(()=>{const q={t:'input',q:'함수가 값을 return하면 그 값을 어디에서 쓸 수 있을까요?',a:['호출한 곳'],ex:'return은 함수를 끝내고 호출한 곳으로 값을 돌려줘요.'};run={lang:'python',les:{title:'함수',xp:10,q:[q]},i:0,correct:0,total:1,hearts:5,id:null,color:'#b94e2b',free:true,review:true};openRun();});
  check('answer explanation is not shown before submission',await page.locator('.reader-analogy').count()===0);
  await page.locator('#fill').fill('호출한 곳');await page.locator('#check').click();
  check('graded explanation includes a relevant analogy',await page.locator('.study-explanation .reader-analogy').innerText().then(t=>t.includes('비유로 이해하기')&&t.includes('반환값')));
  if(process.env.CR_SCREENSHOTS)await page.screenshot({path:path.join(process.env.CR_SCREENSHOTS,'reader-explanation-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  check('explanation fits a narrow mobile screen',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&$('qbody').scrollWidth<=$('qbody').clientWidth+1));
  if(process.env.CR_SCREENSHOTS)await page.screenshot({path:path.join(process.env.CR_SCREENSHOTS,'reader-explanation-mobile.png')});
  await page.evaluate(async()=>{$('lesson').classList.remove('on');await ensureIntro();openIntro('python');});
  check('track introduction actually renders the analogy',await page.locator('.reader-intro').innerText().then(t=>t.includes('익숙한 일에 빗대어 보면')&&t.length>50));
  if(process.env.CR_SCREENSHOTS)await page.screenshot({path:path.join(process.env.CR_SCREENSHOTS,'reader-intro-mobile.png')});
  await page.evaluate(()=>ensureGloss());
  check('array theory does not link to the database-index glossary',await page.evaluate(()=>{run.lang='python';return !glossMark('배열의 인덱스는 0부터 시작해요.',new Set()).includes('data-w="인덱스"');}));
  check('database theory keeps its useful glossary link',await page.evaluate(()=>{run.lang='sql';return glossMark('조회할 열에 인덱스를 만들어요.',new Set()).includes('data-w="인덱스"');}));
  check('no browser exceptions: '+JSON.stringify(errors),errors.length===0);
  console.log(passed+' reader-copy checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
