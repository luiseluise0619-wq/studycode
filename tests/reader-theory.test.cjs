/* Check corrected lesson prose after course loading and the real theory renderer. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:process.platform==='win32'?{channel:'msedge'}:{});
 let passed=0;
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(top===window)localStorage.setItem('coderun',JSON.stringify({onboarded:true,freeMode:true,goal:'free'}));});
  await page.goto('file:///'+path.join(__dirname,'../index.html').replace(/\\/g,'/'));
  await page.waitForFunction(()=>typeof renderTheory==='function'&&typeof ReaderGuide!=='undefined');
  const cases=[
   ['code','초기값은 생략할 수 있지만',['빈 배열','타입을 강제로 고정하는 선언은 아니에요']],
   ['compiler','스택이나 레지스터',['Go','C에서는','작업 공간']],
   ['c','함수 안의 동작을 고쳐',['매개변수 형태']],
   ['sql','WHERE right_table.status',['IS NULL','NULL을 어떻게 다루는지']],
   ['sysd','계좌 잔액을 바꾸는 작업',['버전 비교','적어도 한 복제본']],
  ];
  for(const [track,needle,expected]of cases){
   const rendered=await page.evaluate(async({track,needle})=>{
    await ensureTrack(track);const lesson=COURSES[track].units.flatMap(u=>u.lessons).find(l=>JSON.stringify(l.theory||'').includes(needle));
    if(!lesson)return null;run={lang:track,les:lesson};
    const host=document.createElement('section');host.className='theory';host.innerHTML=renderTheory(lesson.theory);document.body.append(host);
    const text=host.innerText;host.remove();return text;
   },{track,needle});
   assert.ok(rendered,track+' corrected lesson is reachable');for(const text of expected)assert.ok(rendered.includes(text),track+' '+text);
   passed++;console.log('PASS rendered corrected theory: '+track);
  }
  assert.deepEqual(errors,[]);passed++;console.log('PASS no browser exceptions');
  console.log(passed+' reader-theory checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
