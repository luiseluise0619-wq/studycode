'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
let content;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data/service-project.js'), 'utf8'), { __CR: (key, data) => { assert.equal(key, 'servicebuild'); content = data; } });
const project = content.projects[0], refs = content.sol[project.id];
const buildSection = html.slice(html.indexOf('const BL_HELP ='), html.indexOf('let BL=null;'));
const buildDoc = new Function(buildSection + '; return buildDoc;')();
const BuildWorker = require('../data/build-worker.js');
let checks = 0, behavior = 0, rejected = 0;
function check(name, condition) { assert.ok(condition, name); checks++; console.log('PASS ' + name); }
function grade(files, day) {
  let result;
  vm.runInNewContext(BuildWorker.scriptFromDoc(buildDoc(files, day.tests, day)), { parent: { postMessage: message => result = message.res } }, { timeout: 5000 });
  return result;
}
for (const [i, day] of project.days.entries()) {
  const good = grade(refs[i], day);
  assert.equal(good.length, day.tests.length);
  assert.ok(good.every(row => row.ok), 'stage ' + day.n + ': ' + JSON.stringify(good.filter(row => !row.ok)));
  behavior += good.length;
  const draft = { ...(i ? refs[i - 1] : project.seed), ...(day.addFiles || {}) };
  assert.ok(grade(draft, day).some(row => !row.ok), 'unfinished stage ' + day.n + ' passed');
  rejected++;
}
check('18개 누적 예시와 미완성 초안을 실제 채점 계약으로 확인', behavior > 300 && rejected === 18);
check('입문·중급·시니어 단계에 설명과 개념 확인이 있다', ['입문', '중급', '시니어'].every(b => project.days.some(d => d.band === b)) && project.days.every(d => d.concept && d.quiz && d.tests.length));
check('입문부터 저장·알림·지표까지 입력과 응답 필드를 안내한다', project.days[0].req[0].includes('seats') && project.days[2].req[0].includes('remaining') && project.days[6].req[0].includes('signature') && project.days[8].req[0].includes('bookingId') && project.days[12].req[0].includes('successRate'));
const inputFailure=grade(project.seed,project.days[0]).find(row=>!row.ok);
check('서비스 검사 실패는 기대 결과와 함께 실제 호출 입력을 보여 준다', inputFailure && inputFailure.err.includes('실패한 호출: app.validate') && inputFailure.err.includes('seats'));
const metricBoundary = { ...refs[12], 'service.js': refs[12]['service.js'].replace('now() - log.at < 300000', 'now() - log.at <= 300000') };
check('정확히 5분 전 로그를 포함하는 구현은 새 경계 검사에서 실패한다', grade(metricBoundary, project.days[12]).some(row => !row.ok && row.n === '정확히 5분 전 요청은 지표에서 제외해요'));
const cancelSignature = { ...refs[17], 'service.js': refs[17]['service.js'].replace('signature: JSON.stringify(null)', "signature: 'cancel'") };
check('취소 영수증을 다른 서명으로 저장하면 계약 검사에서 실패한다', grade(cancelSignature, project.days[17]).some(row => !row.ok && row.n === '취소 기록의 서명과 응답을 계약대로 저장하고 복원해요'));
const looseRestore = { ...refs[17], 'service.js': refs[17]['service.js'].replace('entry.signature !== JSON.stringify(null)', 'false') };
check('다른 취소 서명을 복원해도 계약 검사에서 실패한다', grade(looseRestore, project.days[17]).some(row => !row.ok && row.n === '취소 기록의 서명과 응답을 계약대로 저장하고 복원해요'));
const largeFailure=grade(refs[10],{band:'중급',tests:[{n:'진단용 대용량 입력',c:'const ids=Array.from({length:50000},(_,i)=>i+1); eq(A.page(ids,100,20,id=>id), null);'}]})[0];
check('큰 실패 입력은 일부 항목과 개수만 표시한다', !largeFailure.ok && largeFailure.err.includes('"length":50000') && largeFailure.err.includes('"preview"') && largeFailure.err.length<1200);
const tempRoot = path.resolve(os.tmpdir()), temp = fs.mkdtempSync(path.join(tempRoot, 'coderun-service-test-'));
const exported = path.join(temp, 'my-reservation-server.cjs');
fs.writeFileSync(exported, require('../data/service-export.js').bundle(refs.at(-1)));
const self = spawnSync(process.execPath, [exported, '--check'], { encoding: 'utf8', timeout: 30000, windowsHide: true });
check('내보낸 서버가 실제 HTTP·파일 저장·재시작·깨진 저장을 검사', self.status === 0 && self.stdout.includes('통과:'));
if (self.status !== 0) console.log(self.stdout, self.stderr);

(async () => {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { if (top === window && !localStorage.getItem('coderun')) localStorage.setItem('coderun', JSON.stringify({ onboarded: true, goal: 'free', freeMode: true, recall: false, theme: 'light' })); });
    await page.goto(process.env.CR_URL || 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/'),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => typeof ServicePath !== 'undefined');
    await page.locator('#service-home').click();
    await page.waitForSelector('[data-service-day]');
    check('홈에서 입문·중급·시니어 18단계 흐름을 실제로 연다', await page.locator('[data-service-day]').count() === 18);
    check('처음에는 첫 단계만 시작할 수 있다', await page.locator('[data-service-day]:not(:disabled)').count() === 1);
    await page.locator('[data-service-day="0"]').click();
    await page.waitForSelector('[data-service-answer]');
    async function run() {
      await page.locator('#bl-go').click();
      await page.waitForFunction(() => BL && !BL.running && BL.res, null, { timeout: 12000 });
      return page.evaluate(() => BL.res.every(row => row.ok));
    }
    async function inject(index) {
      await page.evaluate(({ id, index }) => {
        blSaveCurrent(); Object.assign(blState(id).files, BUILD_SOL[id][index]); BL.res = null; blRender();
      }, { id: project.id, index });
    }
    await inject(0); check('Worker에서 첫 단계 코드 검사를 통과한다', await run());
    check('코드만 통과하면 다음 단계가 아직 열리지 않는다', await page.locator('#bl-next').count() === 0 && await page.evaluate(() => ServicePath.summary().done === 0));
    await page.locator('[data-service-answer="1"]').click();
    check('잘못 고른 개념 답은 완료로 기록하지 않는다', await page.evaluate(() => ServicePath.summary().done === 0));
    await page.locator('[data-service-answer="0"]').click();
    check('코드·개념 모두 확인하면 다음 단계가 열린다', await page.locator('#bl-next').isVisible() && await page.evaluate(() => ServicePath.summary().done === 1));
    for (let i = 1; i < project.days.length; i++) {
      await page.locator('#bl-next').click(); await inject(i);
      check('실제 Worker에서 ' + (i + 1) + '단계 누적 기능을 확인', await run());
      await page.locator('[data-service-answer="' + project.days[i].quiz.answer + '"]').click();
    }
    check('마지막 확장은 설명을 적기 전에는 완료되지 않는다', await page.evaluate(() => ServicePath.summary().done === 17) && await page.locator('#service-export').count() === 0);
    await page.locator('#service-note').fill('취소 이벤트와 응답을 같은 저장안에 넣어 재전송에서도 자리를 한 번만 돌려주게 했다.');
    check('마지막 확장의 검사·개념·설명과 도움 사용 여부를 구분', await page.evaluate(() => ServicePath.summary().done === 18 && ServicePath.summary().independent));
    const downloadEvent = page.waitForEvent('download'); await page.locator('#service-export').click();
    const download = await downloadEvent; await download.saveAs(path.join(temp, 'downloaded-server.cjs'));
    const actual = spawnSync(process.execPath, [path.join(temp, 'downloaded-server.cjs'), '--check'], { encoding: 'utf8', timeout: 30000, windowsHide: true });
    check('실제 다운로드한 파일도 HTTP·저장·재시작 검사를 통과', actual.status === 0 && actual.stdout.includes('통과:'));
    const downloaded = require(path.join(temp, 'downloaded-server.cjs'));
    const uiServer = await downloaded.start({ port: 0, dir: path.join(temp, 'ui-data'), tokens: { 'ui-alice': 'alice', 'ui-bob': 'bob' }, writeVersion: 2 });
    try {
      const ui = await browser.newPage(); await ui.goto(uiServer.url);
      await ui.locator('#token').fill('ui-alice'); await ui.locator('#name').fill('<b>한글 예약</b>');
      await ui.locator('#form button').click(); await ui.waitForFunction(() => document.querySelector('#list').textContent.includes('한글 예약'));
      check('내보낸 서버의 실제 화면에서 예약하고 사용자 입력을 글자로 표시', await ui.locator('#list').innerText().then(t => t.includes('<b>한글 예약</b>')) && await ui.locator('#list b').count() === 0);
      await ui.locator('#token').fill('ui-bob'); await ui.locator('#refresh').click(); await ui.waitForFunction(() => document.querySelector('#list').children.length === 0);
      check('서버 화면에서도 다른 사용자의 예약은 나오지 않는다', await ui.locator('#list article').count() === 0);
      await ui.locator('#token').fill('ui-alice'); await ui.locator('#refresh').click(); await ui.waitForSelector('#list button'); await ui.locator('#list button').click(); await ui.waitForFunction(() => document.querySelector('#list').children.length === 0);
      check('서버 화면에서 취소하면 남은 자리가 실제로 복원', await ui.locator('#slots').innerText().then(t => t.includes('10:00 남은 자리 4명')));
      await ui.close();
    } finally { await uiServer.close(); }
    const savedProgress = await page.evaluate(() => JSON.stringify(S));
    const updateContext = await browser.newContext(); const updated = await updateContext.newPage();
    await updated.addInitScript(saved => {
      const data = JSON.parse(saved), state = data.build['reservation-journey'];
      state.serviceRecords[13].rows.pop(); localStorage.setItem('coderun', JSON.stringify(data));
    }, savedProgress);
    await updated.goto(process.env.CR_URL || 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/')); await updated.waitForFunction(() => typeof ServicePath !== 'undefined');
    await updated.locator('#service-home').click(); await updated.waitForSelector('[data-service-day]');
    check('새 검사로 바뀌면 앞 단계부터 재확인하고 뒤의 오래된 완료도 취소한다', await updated.evaluate(() => ServicePath.summary().done === 12 && ServicePath.summary().frontier === 12 && blState(ServicePath.id).serviceRecheck === 13 && !blState(ServicePath.id).serviceRecords[18].rows) && await updated.locator('.service-check-update').innerText().then(t => t.includes('13단계')));
    check('재검사 안내는 작성한 프로젝트·메모·이미 받은 XP를 지킨다', await updated.evaluate(saved => { const old = JSON.parse(saved); return JSON.stringify(blState(ServicePath.id).files) === JSON.stringify(old.build[ServicePath.id].files) && blState(ServicePath.id).serviceRecords[18].note === old.build[ServicePath.id].serviceRecords[18].note && S.xp === old.xp; }, savedProgress));
    await updateContext.close();
    const beforeHelp = await page.evaluate(() => ({ files: JSON.stringify(blState(ServicePath.id).files), xp: S.xp }));
    await page.locator('.service-practice>summary').click(); await page.locator('[data-practice-solution]').click();
    check('취소 확장 풀이를 보면 완료 표시와 도움 기록을 즉시 맞춘다', await page.evaluate(() => ServicePath.summary().done === 18 && !ServicePath.summary().independent && blState(ServicePath.id).serviceRecords[18].helpUsed) && await page.locator('.service-complete > b').innerText().then(t => t.includes('도움받아')) && await page.locator('#service-note-status').innerText().then(t => t.includes('앱 도움')));
    check('확장 풀이 열기는 실제 프로젝트 코드와 XP를 바꾸지 않는다', await page.evaluate(before => JSON.stringify(blState(ServicePath.id).files) === before.files && S.xp === before.xp, beforeHelp));
    await page.locator('[data-service-answer="0"]').click();
    check('완료 뒤 개념 답을 바꾸면 완료와 다운로드를 취소', await page.evaluate(() => ServicePath.summary().done === 17) && await page.locator('#service-export').count() === 0);
    await page.locator('[data-service-answer="1"]').click();
    await page.locator('#bl-txt').fill('function createService(){return {handle(){return {status:500}}};}\nmodule.exports={createService};');
    check('완료 뒤 코드를 바꾸면 독립 완료 근거와 이전 통과 결과·내보내기를 취소', await page.evaluate(() => ServicePath.summary().done === 17 && !ServicePath.summary().independent) && await page.locator('#service-export').count() === 0 && await page.locator('.bl-res').count() === 0);
    await inject(17); await run();
    await page.locator('.bl-hint summary').click();
    await page.waitForFunction(() => blState(ServicePath.id).serviceRecords[18].helpUsed);
    check('힌트를 열면 완료와 도움 없이 한 확장을 따로 표시', await page.evaluate(() => ServicePath.summary().done === 18 && !ServicePath.summary().independent));
    await page.locator('#bl-quit').click(); await page.reload(); await page.waitForFunction(() => typeof ServicePath !== 'undefined');
    await page.locator('#service-home').click(); await page.waitForSelector('[data-service-day]');
    check('새로고침 뒤 단계 완료와 도움 기록이 유지', await page.evaluate(() => ServicePath.summary().done === 18 && !ServicePath.summary().independent));
    await page.setViewportSize({ width: 360, height: 800 });
    check('360px에서 전체 경로에 가로 넘침이 없다', await page.evaluate(() => $('service-path-body').scrollWidth <= $('service-path-body').clientWidth + 1));
    await page.locator('[data-service-day="17"]').click(); await page.waitForSelector('[data-service-answer]');
    check('360px에서 단계·설명·편집기에 가로 넘침이 없다', await page.evaluate(() => $('bl-body').scrollWidth <= $('bl-body').clientWidth + 1));
    await page.locator('.service-adapter>summary').click();
    check('서버 연결 설명은 직접 만든 handle과 제공된 HTTP 연결을 보여 준다', await page.locator('.service-request-flow li').count() === 4 && await page.locator('.service-adapter').innerText().then(t => t.includes('브라우저 실습은 handle을 직접') && t.includes('save·now·probe·sink')));
    check('360px에서 HTTP 요청 흐름을 끝까지 읽을 수 있다', await page.locator('.service-adapter').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    await page.locator('.service-adapter').screenshot({path:path.resolve(__dirname,'../../../outputs/CodeRun-service-flow-mobile.png')});
    await page.locator('[data-service-step="0"]').click();
    await page.locator('#bl-txt').fill('function validate(){return false;}\nmodule.exports={validate};');
    check('앞 단계 수정을 하면 이후 단계 완료와 잠금 상태를 함께 갱신', await page.evaluate(() => ServicePath.summary().done === 0) && await page.locator('[data-service-step]:not(:disabled)').count() === 1);
    const experienced = await browser.newPage();
    await experienced.addInitScript(() => { localStorage.setItem('coderun', JSON.stringify({ onboarded: true, goal: 'free', freeMode: true, recall: false })); });
    await experienced.goto(process.env.CR_URL || 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/')); await experienced.waitForFunction(() => typeof ServicePath !== 'undefined');
    await experienced.locator('#service-home').click(); await experienced.waitForSelector('[data-service-entry]'); await experienced.locator('[data-service-entry="11"]').click(); await experienced.waitForSelector('[data-service-answer]');
    check('경험자는 시니어 구간부터 시작하고 제공 코드를 직접 완료로 세지 않는다', await experienced.evaluate(() => BL.di === 11 && ServicePath.summary().done === 0 && ServicePath.summary().foundation === 11));
    await experienced.evaluate(() => { Object.assign(blState(ServicePath.id).files, BUILD_SOL[ServicePath.id][11]); blRender(); blRun(); }); await experienced.waitForFunction(() => BL && !BL.running && BL.res);
    await experienced.locator('[data-service-answer="0"]').click();
    check('시니어 시작점에서도 직접 마친 한 단계만 기록하고 다음 단계로 연결', await experienced.evaluate(() => ServicePath.summary().done === 1 && ServicePath.summary().frontier === 12) && await experienced.locator('#bl-next').isVisible());
    await experienced.close();
    check('처리하지 못한 브라우저 오류가 없다', errors.length === 0);
    console.log(JSON.stringify({ checks, behavior, rejected, errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  const resolved = path.resolve(temp); assert.equal(path.dirname(resolved), tempRoot); assert.ok(path.basename(resolved).startsWith('coderun-service-test-')); fs.rmSync(resolved, { recursive: true, force: true });
});
