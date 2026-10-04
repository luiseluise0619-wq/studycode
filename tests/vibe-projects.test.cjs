const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {chromium}=require('playwright');
const projects=require('../data/vibe-projects.js');
const base=require('../data/vibe-scenarios.js');
const all=[...base,...require('../data/vibe-challenges.js')(base),...projects];
const journey=require('../data/vibe-journey.js')(all);
let checks=0,referenceChecks=0,references=0,rejectedDrafts=0;
function check(name,value){assert.ok(value,name);checks++;console.log('PASS '+name);}
assert.equal(projects.length,5);assert.equal(projects.reduce((n,p)=>n+p.missions.length,0),25);
for(const p of projects){assert.equal(p.missions.length,5);assert.ok(p.storage&&p.filename&&p.missions.at(-1).independent);new vm.Script(p.source);for(const m of p.missions)new vm.Script(m.reference);}
const completed={vibeLab:{},vibeJourney:{}};
for(const p of all.filter(p=>p.kind!=='project'))completed.vibeLab[p.id]={missions:Object.fromEntries(p.missions.map(m=>[m.id,{passed:true}]))};
for(const id of journey.families)completed.vibeJourney[id]={independent:true,due:'2099-01-01'};
check('기존 앱 완료자는 가계부부터 추천',journey.recommend(completed,'2026-10-04',1).project.id==='expense-app');
for(const p of projects){completed.vibeLab[p.id]={missions:Object.fromEntries(p.missions.map(m=>[m.id,{passed:true,helpUsed:true}]))};}
check('모든 앱 완료자는 서버 등 다음 과정으로',journey.recommend(completed,'2026-10-04',1).complete);
check('도움받은 마지막 확장을 독립 완료로 세지 않음',journey.stats(completed,'2026-10-04').independentProjects===0);
completed.vibeLab['expense-app'].missions.budget.helpUsed=false;
check('완성 앱과 독립 확장 수를 각각 계산',journey.stats(completed,'2026-10-04').collectionDone===5&&journey.stats(completed,'2026-10-04').independentProjects===1);
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM;
 const browser=await chromium.launch(executablePath?{executablePath}:process.platform==='win32'?{channel:'msedge'}:{});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'coderun-projects-'));
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(top===window&&!localStorage.getItem('coderun'))localStorage.setItem('coderun',JSON.stringify({onboarded:true,goal:'free',freeMode:true,recall:false,theme:'light'}));});
  await page.goto('file:///'+path.resolve(__dirname,'../index.html').replace(/\\/g,'/'));
  await page.waitForFunction(()=>typeof VibeLab!=='undefined');
  async function grade(p,index,source){return page.evaluate(({id,index,source})=>new Promise((resolve,reject)=>{
   const p=VibeLab.projects.find(p=>p.id===id),token='project-'+Math.random(),frame=document.createElement('iframe');
   frame.setAttribute('sandbox','allow-scripts allow-forms');document.body.append(frame);
   const timer=setTimeout(()=>end(null,new Error('grading timeout '+id)),20000);
   function end(data,error){clearTimeout(timer);removeEventListener('message',receive);frame.remove();error?reject(error):resolve(data);}
   function receive(e){if(e.source===frame.contentWindow&&e.data?.__cr==='vibe'&&e.data.__studyToken===token&&!e.data.kind)end(e.data);}
   addEventListener('message',receive);frame.srcdoc=VibeLab.frameDoc(p,source,p.missions[index].tests,token);
  }),{id:p.id,index,source});}
  for(const p of projects)for(let i=0;i<p.missions.length;i++){
   const m=p.missions[i],draft=await grade(p,i,i?p.missions[i-1].reference:p.source);
   assert.equal(draft.gate,false,p.id+':'+m.id+' unfinished draft '+JSON.stringify(draft));rejectedDrafts++;
   const result=await grade(p,i,m.reference);
   assert.equal(result.gate,true,p.id+':'+m.id+' reference '+JSON.stringify(result));
   references++;referenceChecks+=result.pass;console.log('PASS '+p.id+':'+m.id+' '+result.pass+'/'+result.total);
  }
  await page.evaluate(()=>VibeLab.open('catalog'));
  check('기존 여섯 앱과 새 완성 앱 다섯 개 모두 접근',await page.locator('[data-vibe-project]').count()===6&&await page.locator('[data-vibe-complete]').count()===5);
  await page.locator('[data-vibe-complete=expense-app]').click();
  check('프로젝트 카드로 실제 편집 화면 진입',await page.locator('#vibe-code').inputValue().then(v=>v.includes('function addExpense')));
  async function checkInUI(p,index){
   await page.locator('#vibe-code').fill(p.missions[index].reference);
   await page.locator('#vibe-check').click();
   await page.waitForFunction(({id,mission})=>!!S.vibeLab[id]?.missions?.[mission]?.lastCheck,{id:p.id,mission:p.missions[index].id});
   check(p.app+' '+(index+1)+'단계 실제 편집·검사',await page.evaluate(({id,mission})=>S.vibeLab[id].missions[mission].lastCheck.gate,{id:p.id,mission:p.missions[index].id}));
   await page.locator('[data-vibe-answer="'+p.missions[index].quiz.answer+'"]').click();
  }
  for(const p of projects){
   await page.evaluate(id=>VibeLab.select(id,0),p.id);
   check(p.app+' 초안에서는 다운로드 숨김',await page.locator('#vibe-export').count()===0);
   for(let i=0;i<5;i++){await checkInUI(p,i);if(i<4)await page.locator('#vibe-next').click();}
   check(p.app+' 완성 뒤 다운로드 제공',await page.locator('#vibe-export').isVisible());
   const pending=page.waitForEvent('download');await page.locator('#vibe-export').click();const download=await pending;
   assert.equal(download.suggestedFilename(),p.filename);const file=path.join(temp,p.filename);await download.saveAs(file);
   const exported=await browser.newPage();exported.on('pageerror',e=>errors.push(e.message));
   await exported.goto('file:///'+file.replace(/\\/g,'/'));
   if(p.id==='expense-app'){
    await exported.locator('#expense-name').fill('<b>점심</b>');await exported.locator('#expense-amount').fill('3000');await exported.locator('#expense-add').click();await exported.reload();
    check('가계부 파일에서 지출·태그 글자·합계 복원',await exported.locator('#expense-list').innerText().then(v=>v.includes('<b>점심</b>'))&&await exported.locator('#expense-total').innerText()==='3000'&&await exported.locator('#expense-list b').count()===0);
    await exported.locator('#expense-list button').click();await exported.reload();check('가계부 파일에서 삭제도 저장',await exported.locator('#expense-list li').count()===0);
   }else if(p.id==='habit-app'){
    await exported.locator('#habit-name').fill('산책');await exported.locator('#habit-add').click();await exported.locator('#habit-list input').check();await exported.reload();
    check('습관 파일에서 오늘 체크·달성률 복원',await exported.locator('#habit-list input').isChecked()&&await exported.locator('#habit-rate').innerText()==='100');
   }else if(p.id==='quiz-app'){
    await exported.locator('[data-answer=\"1\"]').click();await exported.reload();check('퀴즈 파일에서 다음 문제와 점수 복원',await exported.locator('#quiz-progress').innerText()==='1/3'&&await exported.locator('#quiz-score').innerText()==='1');
    await exported.locator('#quiz-restart').click();await exported.reload();check('퀴즈 재시작도 저장',await exported.locator('#quiz-progress').innerText()==='0/3');
   }else if(p.id==='reservation-app'){
    await exported.locator('#booking-name').fill('민지');await exported.locator('#booking-seats').fill('2');await exported.locator('#booking-add').click();await exported.reload();check('예약 파일에서 목록과 남은 자리 복원',await exported.locator('#booking-list li').count()===1&&await exported.locator('#booking-left').innerText()==='2');
    await exported.locator('#booking-list button').click();await exported.reload();check('예약 취소도 저장',await exported.locator('#booking-left').innerText()==='4'&&await exported.locator('#booking-list li').count()===0);
   }else{
    await exported.locator('#post-title').fill('<b>인사</b>');await exported.locator('#post-body').fill('</script><b>내용</b>');await exported.locator('#post-add').click();await exported.locator('[data-pin-id]').click();await exported.reload();
    check('게시판 파일에서 글자와 고정 상태 복원',await exported.locator('#post-list').innerText().then(v=>v.includes('</script><b>내용</b>')&&v.includes('고정 해제'))&&await exported.locator('#post-list b').count()===0);
   }
   await exported.evaluate(key=>localStorage.setItem(key,'{"wrong":"shape"}'),p.storage.key);await exported.reload();
   check(p.app+' 손상된 저장 형식으로 앱이 멈추지 않음',await exported.locator('h1').isVisible());await exported.close();await page.bringToFront();
  }
  await page.evaluate(()=>VibeLab.select('board-app',4));
  await page.locator('#vibe-preview-run').click();await page.waitForFunction(()=>$('vibe-preview-status').textContent==='입력하고 눌러 볼 수 있어요');
  let preview=page.frameLocator('#vibe-preview');const unusual='<b></script>내 기록</b>';
  await preview.locator('#post-title').fill(unusual);await preview.locator('#post-body').fill('미리보기만의 내용');await preview.locator('#post-add').click();
  await page.waitForFunction(title=>S.vibeLab['board-app'].previewData?.some(p=>p.title===title),unusual);
  await page.locator('#vibe-check').click();await page.waitForFunction(()=>!!S.vibeLab['board-app'].missions.pin.lastCheck);
  check('채점 자료가 내 미리보기 글을 덮지 않음',await page.evaluate(title=>S.vibeLab['board-app'].previewData.some(p=>p.title===title),unusual));
  await page.locator('#vibe-preview-run').click();await page.waitForFunction(()=>$('vibe-preview-status').textContent==='입력하고 눌러 볼 수 있어요');preview=page.frameLocator('#vibe-preview');
  check('스크립트 종료 모양도 미리보기 복원에서 글자로 유지',await preview.locator('#post-list').innerText().then(v=>v.includes(unusual))&&await preview.locator('#post-list b').count()===0);
  await page.locator('#vibe-close').click();await page.reload();await page.waitForFunction(()=>typeof VibeLab!=='undefined');
  check('새로고침 뒤 25단계 완료 기록 유지',await page.evaluate(()=>VibeJourney.stats(S,today()).collectionSteps===25));
  await page.evaluate(()=>VibeLab.open('catalog'));await page.locator('[data-vibe-complete=board-app]').click();
  check('완료 프로젝트는 마지막 코드 그대로 이어 열기',await page.locator('#vibe-code').inputValue().then(v=>v===projects.at(-1).missions.at(-1).reference));
  await page.locator('#vibe-code').fill('throw new Error("실습 오류");');await page.locator('#vibe-check').click();await page.waitForFunction(()=>!!S.vibeLab['board-app'].missions.pin.lastCheck);
  check('실행 실패 뒤 완료·다운로드·독립 근거 취소',await page.locator('#vibe-export').count()===0&&await page.evaluate(()=>!S.vibeLab['board-app'].missions.pin.passed&&VibeJourney.stats(S,today()).independentProjects===4));
  await page.setViewportSize({width:360,height:800});await page.evaluate(()=>VibeLab.catalog());
  check('휴대폰에 완성 프로젝트 다섯 개 표시',await page.locator('[data-vibe-complete]').count()===5);
  check('휴대폰 목록에 가로 넘침 없음',await page.evaluate(()=>$('vibe-body').scrollWidth<=$('vibe-body').clientWidth+1));
  await page.locator('[data-vibe-complete=expense-app]').click();
  check('휴대폰 편집 화면에 가로 넘침 없음',await page.evaluate(()=>$('vibe-body').scrollWidth<=$('vibe-body').clientWidth+1));
  await page.locator('[data-vibe-mission="4"]').click();await page.locator('.vibe-concepts details').first().locator('summary').click();
  await page.waitForFunction(()=>S.vibeLab['expense-app'].missions.budget.helpUsed);
  check('마지막 확장에서 개념을 열면 도움 사용 기록',await page.evaluate(()=>S.vibeLab['expense-app'].missions.budget.helpUsed));
  check('처리하지 못한 브라우저 오류 없음',errors.length===0);
  console.log(JSON.stringify({projects:projects.length,references,rejectedDrafts,referenceChecks,uiChecks:checks,errors}));
 }finally{
  await browser.close();assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(temp).startsWith('coderun-projects-'));fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
