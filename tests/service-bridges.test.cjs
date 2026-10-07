'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require('playwright');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/service-bridges.js'),'utf8'),context);
const {lessons,accepts}=context.window.ServiceBridges;
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;console.log('PASS '+name);};
check('연결 연습은 17구간 45개이며 마지막 확장의 기초 문제 풀이는 따로 제공하지 않는다',Object.keys(lessons).length===17&&Object.values(lessons).flat().length===45&&!lessons[18]);
check('재요청을 만들기 전에 변수 키로 기록을 저장하는 법을 연습한다',lessons[6].some(q=>q.title==='변수 이름으로 영수증 저장하기'&&accepts(q,'201')));
const code=lessons[1][2];
check('한 줄 쓰기는 공백과 마지막 세미콜론을 허용하고 다른 계산·잘못 붙인 단어는 거절한다',accepts(code,' return price*count ')&&!accepts(code,'return price + count;')&&!accepts(code,'returnprice*count;'));
const assertion=lessons[17][0];
check('문자열 내부 공백이나 잘못된 상태를 무시하지 않는다',!accepts(assertion,'assert(result.status === 201, "생성실패");')&&!accepts(assertion,'assert(result.status === 200, "생성 실패");'));
(async()=>{
  const browser=await chromium.launch(process.platform==='win32'?{channel:'msedge'}:{});
  try{
    const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{if(top===window&&!localStorage.getItem('coderun'))localStorage.setItem('coderun',JSON.stringify({onboarded:true,freeMode:true,theme:'light',recall:false}));});
    await page.goto('file:///'+path.resolve(__dirname,'../index.html').replace(/\\/g,'/'),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof ServicePath!=='undefined'&&typeof ServiceBridges!=='undefined');
    await page.locator('#service-home').click();await page.waitForSelector('[data-service-day]');
    await page.locator('[data-service-day="0"]').click();await page.waitForSelector('#service-bridge-input');
    check('처음 서비스에 들어가면 짧은 기초 설명과 직접 쓰는 연습을 보여 준다',await page.locator('.service-bridge').evaluate(el=>el.open)&&await page.locator('.service-bridge').innerText().then(t=>t.includes('값에 이름 붙이기')));
    await page.locator('#service-bridge-input').fill('6000');await page.locator('.service-bridge form button').click();
    check('틀린 예측은 현재 값의 근거를 보여 주고 완료하지 않는다',await page.locator('.service-bridge-status').innerText().then(t=>t.includes('새로 저장한 3'))&&await page.evaluate(()=>!blState(ServicePath.id).serviceRecords[1].bridge.items[0].passed));
    await page.locator('#service-bridge-input').fill('9000');await page.locator('.service-bridge form button').click();
    check('수정한 답과 처음 혼자 맞힌 답을 구분한다',await page.locator('.service-bridge-status').innerText().then(t=>t.includes('다시 풀어')));
    await page.locator('[data-bridge-next]').click();await page.locator('.service-bridge-solution').click();
    await page.locator('#service-bridge-input').fill('14');await page.locator('.service-bridge form button').click();
    check('풀이를 보고 맞힌 연습은 도움 사용을 보존한다',await page.locator('.service-bridge-status').innerText().then(t=>t.includes('풀이를 참고')));
    await page.locator('[data-bridge-next]').click();await page.locator('#service-bridge-input').fill('return price * count;');await page.locator('.service-bridge form button').click();
    check('처음 작성한 올바른 한 줄은 처음 풀이 없이 맞힌 기록으로 남는다',await page.locator('.service-bridge-status').innerText().then(t=>t.includes('처음에 풀이 없이')));
    await page.locator('#service-bridge-input').fill('return price + count;');
    check('답을 틀리게 바꾸면 해당 연습의 통과 표시를 취소한다',await page.evaluate(()=>!blState(ServicePath.id).serviceRecords[1].bridge.items[2].passed));
    const before=await page.evaluate(()=>({files:JSON.stringify(blState(ServicePath.id).files),xp:S.xp,done:ServicePath.summary().done}));
    check('연결 연습은 서비스 코드·검사·완료나 XP를 대신하지 않는다',before.done===0&&await page.evaluate(()=>!BL.res&&!blState(ServicePath.id).serviceRecords[1].signature));
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof ServicePath!=='undefined');
    await page.locator('#service-home').click();await page.waitForSelector('[data-service-day]');await page.locator('[data-service-day="0"]').click();await page.waitForSelector('#service-bridge-input');
    check('재실행 뒤 작성 중인 답·도움·첫 시도와 프로젝트 파일을 보존한다',await page.locator('#service-bridge-input').inputValue()==='return price + count;'&&await page.evaluate(before=>{const s=blState(ServicePath.id),r=s.serviceRecords[1].bridge;return r.items[0].attempts===2&&r.items[1].helped===true&&JSON.stringify(s.files)===before.files&&S.xp===before.xp;},before));
    // Exercise all public mini forms without completing or injecting the service project.
    await page.evaluate(()=>{document.querySelector('.service-bridge').remove();window.__bridgeRecords={};const host=document.createElement('div');host.id='bridge-test-host';document.body.append(host);closeBuildLab();});
    for(const [stage,list]of Object.entries(lessons)){
      await page.evaluate(stage=>{const host=document.getElementById('bridge-test-host');host.innerHTML='';const record=window.__bridgeRecords[stage]={};ServiceBridges.mount(host,Number(stage),record,()=>{});},stage);
      for(let i=0;i<list.length;i++){
        if(i)await page.locator('[data-bridge-next]').click();
        await page.locator('#service-bridge-input').fill(list[i].answers[0]);await page.locator('.service-bridge form button').click();
        assert.ok(await page.evaluate(({stage,i})=>window.__bridgeRecords[stage].bridge.items[i].passed,{stage,i}),'mini stage '+stage+'/'+i);
      }
    }
    check('45개 연습의 실제 폼 제출과 피드백이 동작한다',true);
    await page.setViewportSize({width:360,height:800});
    await page.evaluate(()=>document.getElementById('bridge-test-host').remove());
    await page.locator('#service-home').click();await page.waitForSelector('[data-service-day]');await page.locator('[data-service-day="0"]').click();await page.waitForSelector('.service-bridge');
    check('휴대폰 폭에서 설명·코드·답 입력이 화면 안에 들어온다',await page.locator('.service-bridge').evaluate(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth+1&&el.scrollWidth<=el.clientWidth+1;}));
    await page.screenshot({path:path.resolve(__dirname,'../../../outputs/CodeRun-bridge-mobile.png'),fullPage:true});
    check('새 연습을 사용하면서 브라우저 실행 오류가 없다',errors.length===0);
    console.log(checks+' bridge check groups passed');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
