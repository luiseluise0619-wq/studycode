'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
let content;
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/service-project.js'), 'utf8'), { __CR: (_, data) => content = data });
const context = { window: {}, $: () => null, BUILD_SOL: content.sol };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/service-practice.js'), 'utf8'), context);
const practice = context.window.ServicePractice;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const buildDoc = new Function(html.slice(html.indexOf('const BL_HELP ='), html.indexOf('let BL=null;')) + ';return buildDoc;')();
const BuildWorker = require('../data/build-worker.js');
function grade(stage, source) {
  const plan = practice.build(stage, source); let rows;
  vm.runInNewContext(BuildWorker.scriptFromDoc(buildDoc(plan.files, plan.tests)), { parent: { postMessage: data => rows = data.res } }, { timeout: 5000 });
  return rows;
}
let checks = 0, behaviors = 0;
function check(name, value) { assert.ok(value, name); checks++; console.log('PASS ' + name); }
for (const [stage, lesson] of Object.entries(practice.lessons)) {
  const rows = grade(Number(stage), practice.source(lesson.sol));
  assert.ok(rows.every(row => row.ok), 'practice ' + stage + ': ' + JSON.stringify(rows)); behaviors += rows.length;
  const blank = grade(Number(stage), practice.seed(stage));
  assert.ok(blank[0].ok && blank.slice(1).every(row => !row.ok), 'blank should miss defects ' + stage);
  const always = grade(Number(stage), practice.source('throw new Error("always");'));
  assert.ok(!always[0].ok, 'always throwing should reject valid implementation ' + stage);
}
check('13개 연결 실습의 62개 정상·결함 검사를 실제 코드로 확인', Object.keys(practice.lessons).length === 13 && behaviors === 62);
check('빈 검사와 무조건 실패하는 검사로는 통과하지 않는다', true);

(async () => {
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { if (top === window && !localStorage.getItem('coderun')) localStorage.setItem('coderun', JSON.stringify({ onboarded: true, freeMode: true, theme: 'light', recall: true })); });
    await page.goto('file:///' + path.join(root, 'index.html').replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof ServicePath !== 'undefined' && typeof ServicePractice !== 'undefined');
    await page.locator('#service-home').click(); await page.waitForSelector('[data-service-day]');
    await page.locator('[data-service-day="0"]').click(); await page.waitForSelector('.service-bridge');
    await page.evaluate(() => { BL.di = 2; blApplyDayFiles(); blRender(); });
    await page.locator('.service-practice>summary').click();
    const before = await page.evaluate(() => ({ files: JSON.stringify(blState(ServicePath.id).files), xp: S.xp, done: JSON.stringify(blState(ServicePath.id).done) }));
    check('연결 실습이 실제 서비스 단계의 설명 옆에 나타난다', await page.locator('.service-practice').innerText().then(text => text.includes('예약 두 번') && text.includes('같은 서버')));
    await page.locator('[data-practice-run]').click();
    await page.waitForFunction(() => !ServicePractice.active());
    check('작성 전에는 실제 결함을 놓친 결과와 다음 할 일을 보여 준다', await page.locator('.service-practice-results .failed').count() === 4 && await page.locator('.service-practice-results').innerText().then(text => text.includes('assert가 필요')));
    const good = practice.source(practice.lessons[3].sol);
    await page.locator('#service-practice-code').fill(good); await page.locator('[data-practice-run]').click();
    await page.waitForFunction(() => !ServicePractice.active());
    check('직접 쓴 검사로 정상·결함을 실행하고 통과 기록을 따로 남긴다', await page.evaluate(() => blState(ServicePath.id).serviceRecords[3].practice.passed && blState(ServicePath.id).serviceRecords[3].practice.independent));
    check('실습은 프로젝트 파일·XP·단계 완료를 바꾸지 않는다', await page.evaluate(before => JSON.stringify(blState(ServicePath.id).files) === before.files && S.xp === before.xp && JSON.stringify(blState(ServicePath.id).done) === before.done, before));
    await page.locator('.service-bridge>summary').click();
    check('별도 짧은 연습을 여는 것만으로 프로젝트 도움 사용을 기록하지 않는다', await page.evaluate(() => !blState(ServicePath.id).serviceRecords[3].helpUsed));
    await page.locator('[data-practice-solution]').click();
    check('풀이를 열면 해당 실습의 도움 기록을 남기고 혼자 통과 기록을 취소한다', await page.evaluate(() => { const r = blState(ServicePath.id).serviceRecords[3]; return r.practice.helped && !r.practice.independent && !r.helpUsed; }));
    await page.locator('#service-practice-code').fill(practice.seed(3));
    check('코드를 바꾸면 이전 통과와 검사 결과를 취소한다', await page.evaluate(() => { const r = blState(ServicePath.id).serviceRecords[3].practice; return !r.passed && !r.rows && !r.signature; }));
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => typeof ServicePath !== 'undefined');
    await page.locator('#service-home').click(); await page.waitForSelector('[data-service-day]'); await page.locator('[data-service-day="0"]').click();
    await page.evaluate(() => { BL.di = 2; blApplyDayFiles(); blRender(); }); await page.locator('.service-practice>summary').click();
    check('재실행 뒤 작성 중인 코드와 도움 사용·시도 횟수를 보존한다', await page.locator('#service-practice-code').inputValue() === practice.seed(3) && await page.evaluate(() => { const r = blState(ServicePath.id).serviceRecords[3].practice; return r.helped && r.attempts === 2; }));
    await page.locator('#service-practice-code').fill(practice.source('while (true) {}')); await page.locator('[data-practice-run]').click();
    check('무한 반복 중에도 앱이 응답하고 실행을 멈출 수 있다', await page.evaluate(() => ServicePractice.active() && document.getElementById('service-practice-code') !== null));
    await page.locator('[data-practice-stop]').click();
    check('수동 중단은 워커를 종료하고 통과를 기록하지 않는다', !await page.evaluate(() => ServicePractice.active()) && await page.locator('.service-practice-status').innerText().then(text => text.includes('멈췄어요')));
    await page.locator('[data-practice-run]').click(); await page.waitForFunction(() => !ServicePractice.active(), { timeout: 10000 });
    check('시간 제한 뒤 무한 반복을 실패 처리한다', await page.locator('.service-practice-results').innerText().then(text => text.includes('5초 안에')));
    await page.locator('[data-practice-run]').click();
    await page.locator('#service-practice-code').fill(good);
    check('실행 중 수정하면 이전 실행과 결과를 취소한다', !await page.evaluate(() => ServicePractice.active()) && await page.locator('.service-practice-results li').count() === 0);
    await page.locator('[data-practice-run]').click(); await page.waitForFunction(() => !ServicePractice.active());
    check('중단 뒤 다시 실행하면 새 코드의 결과를 받는다', await page.evaluate(() => blState(ServicePath.id).serviceRecords[3].practice.passed));
    await page.locator('#service-practice-code').fill(practice.source('while (true) {}')); await page.locator('[data-practice-run]').click();
    await page.locator('#bl-quit').click();
    check('실습을 닫으면 이전 실행을 종료한다', !await page.evaluate(() => ServicePractice.active()) && !await page.locator('#blab').evaluate(el => el.classList.contains('on')));
    // Submit every composition exercise through the real editor and worker.
    await page.evaluate(() => { document.querySelectorAll('.service-practice').forEach(el => el.remove()); window.__practiceRecords = {}; const host = document.createElement('div'); host.id = 'practice-test-host'; host.style.cssText = 'position:fixed;inset:0;overflow:auto;z-index:10000;padding:12px;background:var(--card);box-sizing:border-box'; document.body.append(host); });
    await page.evaluate(draft => {
      const r = { practice: { draft, signature: draft, revision: 1, passed: true, independent: true, attempts: 4, helped: true, rows: [{n:'old',ok:true}] } };
      window.__oldPractice = r; ServicePractice.mount(document.getElementById('practice-test-host'), 13, r, () => {});
    }, practice.source(practice.lessons[13].sol));
    await page.locator('.service-practice>summary').click();
    check('보강 전 통과 기록은 재검사를 요구하고 작성 코드·도움·횟수는 보존한다', await page.evaluate(() => { const r = window.__oldPractice.practice; return !r.passed && !r.independent && !r.rows && r.helped && r.attempts === 4 && r.draft === document.getElementById('service-practice-code').value; }) && await page.locator('.service-practice-status').innerText().then(t => t.includes('보관')));
    for (const [stage, lesson] of Object.entries(practice.lessons)) {
      await page.evaluate(stage => { const host = document.getElementById('practice-test-host'); host.innerHTML = ''; ServicePractice.mount(host, Number(stage), window.__practiceRecords[stage] = {}, () => {}); }, stage);
      await page.locator('.service-practice>summary').click(); await page.locator('#service-practice-code').fill(practice.source(lesson.sol));
      await page.locator('[data-practice-run]').click(); await page.waitForFunction(() => !ServicePractice.active());
      assert.ok(await page.evaluate(stage => window.__practiceRecords[stage].practice.passed, stage), 'browser exercise ' + stage);
    }
    check('13개 실습 모두 실제 편집·실행·결과 표시가 동작한다', true);
    await page.locator('[data-practice-solution]').click();
    check('마지막 취소 확장의 풀이를 열면 프로젝트에도 도움 사용을 기록한다', await page.evaluate(() => window.__practiceRecords[18].helpUsed && window.__practiceRecords[18].practice.helped && !window.__practiceRecords[18].practice.independent));
    check('예약과 취소의 키·서명·응답을 표로 비교한다', await page.locator('.service-comparison tbody tr').count() === 6 && await page.locator('.service-comparison').innerText().then(t => t.includes('JSON.stringify(null)') && t.includes('실제경로')));
    await page.setViewportSize({ width: 360, height: 800 });
    check('휴대폰 폭에서 설명·코드·검사 결과가 화면 안에 들어온다', await page.locator('.service-practice').evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= innerWidth + 1 && el.scrollWidth <= el.clientWidth + 1; }));
    check('360px에서도 비교 표의 모든 열과 셀이 잘리지 않는다', await page.locator('.service-comparison').evaluate(el => el.scrollWidth <= el.clientWidth + 1 && [...el.querySelectorAll('th,td')].every(cell => cell.scrollWidth <= cell.clientWidth + 1)));
    await page.locator('#practice-test-host').evaluate(el => el.scrollTop = 0);
    await page.locator('#practice-test-host').screenshot({ path: path.resolve(root, '../../outputs/CodeRun-composition-mobile.png') });
    check('연결 실습과 이동 중 브라우저 실행 오류가 없다', errors.length === 0);
    console.log(checks + ' practice check groups passed (' + behaviors + ' behavior checks)');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
