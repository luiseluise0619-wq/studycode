/* Real browser Workers, in a disposable child process. No learner code executes
   on this test runner's thread; a broken isolation regression has a hard limit. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
if (!process.argv.includes('--child')) {
  const result = spawnSync(process.execPath, [__filename, '--child'], {
    env: process.env, encoding: 'utf8', timeout: 90000, windowsHide: true
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  process.exit(result.status === null ? 1 : result.status);
}
const { chromium } = require('playwright');
const FILE = process.env.CR_URL || 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
let passed = 0;
function check(name, condition, detail) {
  assert.ok(condition, name + (detail ? ': ' + JSON.stringify(detail) : ''));
  passed++;
  console.log('PASS ' + name);
}
(async function () {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ?
    { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { try { localStorage.setItem('coderun', JSON.stringify({ onboarded: true, goal: 'free', freeMode: true })); } catch (_) {} });
    await page.goto(FILE);
    await page.waitForFunction(() => typeof COURSES !== 'undefined' && !!window.BuildWorker);
    await page.evaluate(() => ensureBuild());
    const result = await page.evaluate(async () => {
      const out = {};
      let created = 0, revoked = 0;
      const makeURL = URL.createObjectURL.bind(URL), revokeURL = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = b => { created++; return makeURL(b); };
      URL.revokeObjectURL = u => { revoked++; return revokeURL(u); };
      S.build = {}; save();
      await openBuildLab(); blOpen(0);
      async function wait() {
        const started = performance.now();
        while (BL && BL.running && performance.now() - started < 7500) await new Promise(r => setTimeout(r, 20));
        if (BL && BL.running) throw new Error('Worker 검사 제한 시간을 넘었습니다.');
        return BL && BL.res || [];
      }
      function solution(id, di) {
        Object.assign(blState(id).files, BUILD_SOL[id][di]);
        save(); BL.res = null; blRender();
      }
      const count = rows => ({ pass: rows.filter(x => x.ok).length, total: rows.length });
      blRun(); out.seed = count(await wait());
      solution('orders', 0); blRun(); out.correct = count(await wait());
      out.recorded = S.build.orders.done.includes(1);
      out.cleanAfterSuccess = !BuildWorker.active();

      // The parent's clock and UI stay alive while a worker burns CPU.
      S.build.orders.files['app.js'] = 'function handle(){while(true){}}\nmodule.exports={handle};';
      blRender();
      let ticks = 0;
      const pulse = setInterval(() => ticks++, 50), started = performance.now();
      blRun(); const loopRows = await wait();
      clearInterval(pulse);
      out.loop = { ms: performance.now() - started, ticks, stopped: !BL.running && !BuildWorker.active(),
        fails: loopRows.every(x => !x.ok), message: loopRows.some(x => /무한 루프/.test(x.err || '')) };
      solution('orders', 0); blRun(); out.recovered = count(await wait());

      // A new run disposes of the old runaway worker immediately.
      S.build.orders.files['app.js'] = 'while(true){}'; blRender(); blRun();
      out.started = BuildWorker.active();
      solution('orders', 0); blRun(); out.restarted = count(await wait());
      S.build.orders.files['app.js'] = 'while(true){}'; blRender(); blRun();
      document.getElementById('bl-quit').click(); out.closed = !BuildWorker.active() && BL === null;
      await openBuildLab(); blOpen(0); BL.di = 0; blApplyDayFiles(); solution('orders', 0); blRun(); out.afterClose = count(await wait());
      S.build.orders.files['app.js'] = 'while(true){}'; blRender(); blRun();
      blOpen(1); out.switched = !BuildWorker.active() && BL.pi === 1 && !BL.running;

      // Existing document, mutation and performance gates use the same buildDoc.
      const pi = BUILD_PROJECTS.findIndex(p => p.id === 'deliver');
      blOpen(pi);
      const project = BUILD_PROJECTS[pi], days = [];
      for (let di = 0; di < project.days.length; di++) {
        BL.di = di; blApplyDayFiles(); blRender();
        blRun(); const seed = count(await wait());
        solution('deliver', di); blRun(); const good = count(await wait());
        days.push({ day: project.days[di].n, seed, good, errors: (BL.res || []).filter(x => !x.ok).map(x => x.err) });
      }
      out.deliver = days;
      const di6 = project.days.findIndex(d => d.n === 6);
      BL.di = di6;
      S.build.deliver.files['app.js'] = BUILD_SOL.deliver[di6]['app.js'].replace(
        'const all = byCustomer[q.customerId] || [];',
        'const all = orders.filter(o => o.customerId === q.customerId).sort((a, b) => a.createdAt - b.createdAt);');
      blRender(); blRun(); out.slowFails = (await wait()).filter(x => !x.ok).map(x => x.n);
      const docDay = project.days.findIndex(d => !!d.doc);
      BL.di = docDay; blApplyDayFiles(); solution('deliver', docDay);
      S.build.deliver.files['app.js'] = 'function broken(';
      blRender(); blRun(); out.documentWithBrokenApp = count(await wait());

      const NativeWorker = window.Worker;
      window.Worker = undefined;
      blRun(); out.unavailable = !BL.running && !BuildWorker.active() &&
        (BL.res || []).every(x => !x.ok && /브라우저/.test(x.err || ''));
      window.Worker = NativeWorker;
      out.noIframe = !document.getElementById('bl-frame').getAttribute('srcdoc');
      closeBuildLab();
      out.urls = { created, revoked };
      return out;
    });
    const allPass = r => r.total > 0 && r.pass === r.total;
    check('시작 코드는 수용 기준을 통과하지 못한다', result.seed.total > 0 && result.seed.pass < result.seed.total, result.seed);
    check('실제 Worker에서 정답 코드를 채점하고 진도를 기록한다', allPass(result.correct) && result.recorded, result.correct);
    check('정상 채점 후 Worker를 정리한다', result.cleanAfterSuccess);
    check('무한 루프 중에도 앱의 타이머가 실행된다', result.loop.ticks > 50, result.loop);
    check('5초 제한으로 무한 루프 Worker를 종료한다', result.loop.stopped && result.loop.fails && result.loop.message && result.loop.ms >= 4900 && result.loop.ms < 7000, result.loop);
    check('무한 루프 뒤 수정한 코드를 다시 채점한다', allPass(result.recovered), result.recovered);
    check('재실행에서 이전 Worker를 종료한다', result.started && allPass(result.restarted), result.restarted);
    check('빌드랩을 닫으면 Worker를 종료한다', result.closed && allPass(result.afterClose), { closed: result.closed, afterClose: result.afterClose });
    check('프로젝트 전환에서 Worker를 종료한다', result.switched);
    check('설계·변이·성능을 포함한 7일 정답이 모두 통과한다', result.deliver.length === 7 && result.deliver.every(d => allPass(d.good)), result.deliver);
    check('7일 시작 코드는 기준을 모두 통과하지 못한다', result.deliver.every(d => d.seed.pass < d.seed.total), result.deliver);
    check('느린 전체 조회 구현은 성능 게이트에서 실패한다', result.slowFails.length > 0, result.slowFails);
    check('app.js 문법 오류가 있어도 올바른 설계 문서를 채점한다', allPass(result.documentWithBrokenApp), result.documentWithBrokenApp);
    check('Worker 불가 시 iframe 실행 없이 오류를 표시한다', result.unavailable && result.noIframe);
    check('모든 Worker Blob URL을 해제한다', result.urls.created > 0 && result.urls.created === result.urls.revoked, result.urls);
    check('브라우저 런타임 오류가 없다', errors.length === 0, errors);
    console.log('\nBuildWorker: ' + passed + '개 검증 통과');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
