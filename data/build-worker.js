/* Keep the existing buildDoc grading contract, but execute learner JavaScript on
   a worker thread. A runaway program can then be stopped from the app thread. */
(function (root) {
  'use strict';
  const TIMEOUT = 5000;
  function scriptFromDoc(doc) {
    const start = doc.indexOf('<script>'), end = doc.lastIndexOf('</script>');
    if (start < 0 || end <= start) throw new Error('검사 코드를 준비하지 못했어요. 페이지를 새로고침해 주세요.');
    return doc.slice(start + 8, end);
  }
  function workerSource(doc) {
    // A worker has no DOM or access to the app's window/localStorage. Disable its
    // network and shared-storage APIs too; build exercises only use supplied files.
    const bridge = '(function(){' +
      'var send=self.postMessage.bind(self);' +
      'Object.defineProperty(self,"parent",{value:Object.freeze({postMessage:function(msg){' +
      'if(msg&&msg.__cr==="build")send(msg);}}),writable:false,configurable:false});' +
      '["fetch","XMLHttpRequest","WebSocket","WebTransport","EventSource","indexedDB","caches","importScripts","Worker","SharedWorker","navigator"].forEach(function(k){' +
      'try{Object.defineProperty(self,k,{value:undefined,writable:false,configurable:false});}catch(_){}});' +
      '})();\n';
    return bridge + scriptFromDoc(doc);
  }
  const api = { timeout: TIMEOUT, scriptFromDoc, workerSource };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.BuildWorker = api;

  let active = null;
  function stop(markStopped) {
    const run = active;
    active = null;
    if (!run) return;
    clearTimeout(run.timer);
    if (__blTimer === run.timer) __blTimer = null;
    run.worker.onmessage = null;
    run.worker.onerror = null;
    run.worker.onmessageerror = null;
    run.worker.terminate();
    URL.revokeObjectURL(run.url);
    if (markStopped && run.context === BL) BL.running = false;
  }
  api.stop = function () { stop(true); };
  api.active = function () { return !!active; };
  function failureRows(tests, message) {
    return (tests.length ? tests : [{ n: '실행 검사' }]).map(t => ({ n: t.n, ok: false, err: message }));
  }
  function report(run, rows) {
    if (active !== run) return;
    const current = BL === run.context && BL && BL.pi === run.pi && BL.di === run.di;
    stop(!current);
    if (current && BL.running) blOnResult(rows);
  }
  function validResult(data, tests) {
    return data && data.__cr === 'build' && Array.isArray(data.res) &&
      data.res.length === tests.length && data.res.every((r, i) => r &&
        r.n === tests[i].n && typeof r.ok === 'boolean' && (r.err === undefined || typeof r.err === 'string'));
  }
  const coreRun = blRun;
  blRun = function () {
    stop(true);
    clearTimeout(__blTimer);
    if (!BL) return;
    blSaveCurrent();
    const project = blProject(), state = blState(project.id), day = project.days[BL.di];
    if (project.lang && project.lang !== 'js') { coreRun(); return; }
    const tests = day.tests || [];
    BL.running = true;
    BL.res = null;
    blRender();
    if (typeof Worker !== 'function' || typeof Blob !== 'function' ||
      typeof URL.createObjectURL !== 'function') {
      blOnResult(failureRows(tests, '이 브라우저에서는 코드를 따로 실행할 수 없어요. 최신 Chrome 또는 Edge에서 다시 열어 주세요.'));
      return;
    }
    let url, worker;
    try {
      url = URL.createObjectURL(new Blob([workerSource(buildDoc(state.files, tests, day))], { type: 'text/javascript' }));
      worker = new Worker(url);
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      blOnResult(failureRows(tests, '코드 실행을 시작하지 못했어요. 브라우저의 실행 제한을 확인하거나 페이지를 새로고침해 주세요.'));
      return;
    }
    const run = { worker, url, context: BL, pi: BL.pi, di: BL.di, timer: null };
    active = run;
    worker.onmessage = function (event) {
      if (validResult(event.data, tests)) report(run, event.data.res);
    };
    worker.onerror = function (event) {
      if (event.preventDefault) event.preventDefault();
      report(run, failureRows(tests, '코드를 실행하지 못했어요. ' + (event.message || '문법과 파일 내용을 확인해 주세요.')));
    };
    worker.onmessageerror = function () {
      report(run, failureRows(tests, '검사 결과를 읽지 못했어요. 다시 실행해 주세요.'));
    };
    run.timer = setTimeout(function () {
      report(run, failureRows(tests, '5초 안에 실행이 끝나지 않았어요. 무한 루프가 있는지 확인하고 다시 실행해 주세요.'));
    }, TIMEOUT);
    __blTimer = run.timer;
  };
  // Closing, switching projects/days, and starting again dispose of the old
  // worker and its URL before any new run can receive a result.
  const coreClose = closeBuildLab;
  closeBuildLab = function () { stop(true); return coreClose.apply(this, arguments); };
  const coreOpen = blOpen;
  blOpen = function () { stop(true); return coreOpen.apply(this, arguments); };
  const coreList = blRenderList;
  blRenderList = function () { stop(true); return coreList.apply(this, arguments); };
  const coreDay = blApplyDayFiles;
  blApplyDayFiles = function () { stop(true); return coreDay.apply(this, arguments); };
  // The core bound these buttons before this module loaded; update the stored
  // handlers as well as the global functions used by navigation and tests.
  if ($('bl-quit')) $('bl-quit').onclick = closeBuildLab;
  if ($('bl-menu')) $('bl-menu').onclick = blRenderList;
})(typeof globalThis !== 'undefined' ? globalThis : this);
