/* A connected practice path. Completion records describe observed work, not a job rank. */
(function () {
  'use strict';
  const ID = 'reservation-journey';
  const bands = [
    { title: '입문', from: 0, to: 4, outcome: '입력 검사부터 예약·취소까지 직접 만들어요.' },
    { title: '중급', from: 4, to: 11, outcome: '권한·저장·재시도를 다루고 실패해도 상태를 지켜요.' },
    { title: '시니어', from: 11, to: 18, outcome: '성능과 장애를 측정하고 안전하게 변경하는 연습을 해요.' }
  ];
  const dialog = document.createElement('section');
  dialog.id = 'service-path'; dialog.className = 'vibe-lab';
  dialog.innerHTML = '<div class="vibe-dialog"><header class="vibe-topbar"><span class="vibe-brand">코드런 · 이어서 만드는 서비스</span><button class="close-x" id="service-path-close">닫기 ×</button></header><div class="vibe-body" id="service-path-body"></div></div>';
  document.body.appendChild(dialog);
  StudyDialogs.register(dialog, '입문부터 운영까지 이어지는 실습');
  $('service-path-close').onclick = () => dialog.classList.remove('on');
  function project() { return BUILD_PROJECTS.find(p => p.id === ID); }
  function record(n) {
    const st = blState(ID);
    if (!st.serviceRecords || typeof st.serviceRecords !== 'object') st.serviceRecords = {};
    return st.serviceRecords[n] || (st.serviceRecords[n] = {});
  }
  function signature() { return JSON.stringify(blState(ID).files); }
  function contiguous() {
    const st = blState(ID), done = st.done;
    if (!Number.isInteger(st.serviceStart) || st.serviceStart < 0 || st.serviceStart > 17) st.serviceStart = 0;
    let n = st.serviceStart;
    while (n < 18 && done.includes(n + 1)) n++;
    return n;
  }
  function summary() {
    const st = blState(ID), r = record(18);
    return { done: st.done.filter(n=>Number.isInteger(n)&&n>=1&&n<=18).length, frontier: contiguous(), foundation: st.serviceStart || 0, helped: Object.values(st.serviceRecords || {}).filter(r => r.helpUsed).length,
      independent: st.done.includes(18) && !r.helpUsed && r.signature === signature() && (r.note || '').trim().length >= 20 };
  }
  async function open() {
    dialog.classList.add('on');
    $('service-path-body').innerHTML = '<p>이어지는 실습을 준비하고 있어요…</p>';
    try {
      await ensureBuild();
      const p = project(), st = summary(), state = blState(ID), next = Math.min(st.frontier, 17);
      $('service-path-body').innerHTML = "<div class=\"service-map\"><span class=\"home-kicker\">작은 앱 → 서버 → 운영</span><h1>같은 서비스를 끝까지 고쳐 봐요</h1><p>예약 앱에서 시작해요. 같은 코드에 기능을 더하고, 일부러 실패를 만들며 바꾼 이유를 확인해요. 각 단계는 동작 검사와 개념 확인을 마치면 이어서 열려요.</p><div class=\"service-map-status\"><b>" + st.done + '/18 단계 직접 확인' + (st.foundation ? ' · 기초 코드 ' + st.foundation + '단계 제공' : '') + '</b><span>마지막 확장: ' + (!state.done.includes(18) ? '아직 진행 전' : st.independent ? '앱 도움 없이 검사·개념 확인·설명 완료' : '도움받아 완료') + '</span></div>' + (!state.files ? '<div class="service-entry-options"><b>이미 작은 서버를 만들어 봤다면</b><p>앞 구간의 코드를 제공받고 필요한 구간부터 시작하세요. 제공한 단계는 직접 완료한 기록에 넣지 않아요.</p><button data-service-entry="4">중급부터 시작 · 권한과 저장</button><button data-service-entry="11">시니어부터 시작 · 성능과 운영</button></div>' : '') + '<div class="service-map-bands">' + bands.map(b => '<section><span class="home-kicker">' + b.title + ' · ' + (b.to - b.from) + '단계</span><h2>' + b.outcome + '</h2><ol>' + p.days.slice(b.from, b.to).map((d, i) => '<li><button data-service-day="' + (b.from + i) + '" ' + (b.from + i > st.frontier ? 'disabled' : '') + '><span>' + (state.done.includes(d.n) ? '✓' : b.from + i < st.foundation ? '제공' : String(d.n).padStart(2, '0')) + '</span><b>' + escHtml(d.title) + '</b></button></li>').join('') + '</ol></section>').join('') + '</div><button class="study-action" id="service-continue">' + (state.done.includes(18) ? '완성한 서비스 확인하기' : p.days[next].title + '부터 이어 하기') + " →</button><div class=\"service-map-bridge\"><b>아직 코드가 낯설다면</b><p>예약 화면에서 입력·정원·취소를 먼저 눌러 보고 고쳐 보세요.</p><button id=\"service-small-app\">작은 예약 앱 열기 →</button></div><p class=\"study-muted\">단계 이름은 학습 범위예요. 브라우저에서는 동기 저장과 알림 어댑터로 장애를 재현해요. 마지막에 받는 Node.js 서버는 한 프로세스의 로컬 실습용이며, 실제 DB·다중 서버 운영은 별도의 실전 경험으로 이어가야 해요.</p></div>";
      const go = async index => {
        dialog.classList.remove('on'); await openBuildLab();
        blOpen(BUILD_PROJECTS.findIndex(p => p.id === ID));
        if (index <= contiguous()) { BL.di = index; BL.res = null; blApplyDayFiles(); blRender(); }
      };
      $('service-continue').onclick = () => go(next);
      $('service-path-body').querySelector('.service-map-status').after($('service-continue'));
      $('service-path-body').querySelectorAll('[data-service-day]').forEach(b => b.onclick = () => go(Number(b.dataset.serviceDay)));
      $('service-path-body').querySelectorAll('[data-service-entry]').forEach(b => b.onclick = () => {
        const entry = Number(b.dataset.serviceEntry);
        state.files = JSON.parse(JSON.stringify(BUILD_SOL[ID][entry - 1]));
        state.serviceStart = entry; state.serviceDay = entry; save(); go(entry);
      });
      $('service-small-app').onclick = () => { dialog.classList.remove('on'); VibeLab.open('reservation-app', 0); };
    } catch (error) {
      console.warn('서비스 실습 준비 실패:', error.message);
      $('service-path-body').innerHTML = '<p>실습을 불러오지 못했어요. 연결 상태를 확인한 뒤 다시 열어 주세요.</p><button id="service-retry">다시 불러오기</button>';
      $('service-retry').onclick = open;
    }
  }
  function invalidate(from) {
    const st = blState(ID);
    st.serviceStart = Math.min(st.serviceStart || 0, from - 1);
    st.done = st.done.filter(n => n < from);
    for (const [n, r] of Object.entries(st.serviceRecords || {})) if (Number(n) >= from) { delete r.signature; delete r.rows; }
    if (BL && blProject().id === ID) BL.res = null;
  }
  function finish() {
    if (!BL || blProject().id !== ID) return;
    const d = blProject().days[BL.di], r = record(d.n), st = blState(ID);
    const ready = r.signature === signature() && Array.isArray(r.rows) && r.rows.length === d.tests.length && r.rows.every(t => t.ok) && r.answer === d.quiz.answer && (!d.independent || (r.note || '').trim().length >= 20);
    if (!ready && st.done.includes(d.n)) {
      st.done = st.done.filter(n => n < d.n);
      for (const [n, later] of Object.entries(st.serviceRecords || {})) if (Number(n) > d.n) { delete later.signature; delete later.rows; }
    }
    if (ready && !st.done.includes(d.n)) {
      st.done.push(d.n); st.done.sort((a, b) => a - b);
      if (!r.awarded) {
        r.awarded = true; S.xp = (S.xp || 0) + 60;
        if (typeof awardSkill === 'function') { awardSkill('coding', 6); awardSkill('system_design', 4); }
        if (typeof paintStats === 'function') paintStats();
      }
      toast(d.n + '단계 · 동작과 개념 확인 완료');
    }
    save();
  }
  const oldOpen = blOpen;
  blOpen = function (pi) {
    const remembered = BUILD_PROJECTS[pi]?.id === ID ? blState(ID).serviceDay : undefined;
    oldOpen(pi);
    if (blProject().id !== ID) return;
    const last = remembered;
    BL.di = Number.isInteger(last) && last <= contiguous() ? Math.min(last, 17) : Math.min(contiguous(), 17);
    blApplyDayFiles(); blRender();
  };
  const oldResult = blOnResult;
  blOnResult = function (rows) {
    if (!BL || blProject().id !== ID) return oldResult(rows);
    if (!BL.running) return;
    clearTimeout(__blTimer); BL.running = false;
    const d = blProject().days[BL.di], r = record(d.n);
    const passed = rows.length === d.tests.length && rows.every(t => t.ok);
    if (!passed) invalidate(d.n);
    BL.res = rows; r.rows = rows; r.signature = passed ? signature() : null; r.checkedAt = today();
    finish(); blRender();
  };
  const oldSave = blSaveCurrent;
  blSaveCurrent = function () {
    if (BL && blProject().id === ID && BL.file && $('bl-txt') && $('bl-txt').value !== blState(ID).files[BL.file]) invalidate(blProject().days[BL.di].n);
    return oldSave();
  };
  let pendingReference = null, pendingReset = false;
  document.addEventListener('click', event => {
    if (event.target.closest('#confirm-no')) { pendingReference = null; pendingReset = false; }
    if (!event.target.closest('#confirm-yes') || !BL || blProject().id !== ID) return;
    if (pendingReference !== null) { record(pendingReference).helpUsed = true; invalidate(pendingReference); pendingReference = null; }
    if (pendingReset) { blState(ID).serviceRecords = {}; blState(ID).serviceDay = 0; blState(ID).serviceStart = 0; pendingReset = false; }
  }, true);
  const oldRender = blRender;
  blRender = function () {
    if (BL && blProject().id === ID) {
      const d = blProject().days[BL.di], r = record(d.n);
      if (blState(ID).done.includes(d.n) && r.signature !== signature()) invalidate(d.n);
    }
    oldRender();
    if (!BL || blProject().id !== ID) return;
    const p = blProject(), st = blState(ID), d = p.days[BL.di], r = record(d.n);
    st.serviceDay = BL.di;
    const completed = st.done.includes(d.n), checked = r.signature === signature() && Array.isArray(r.rows) && r.rows.length === d.tests.length && r.rows.every(row => row.ok);
    if (!BL.res && checked) BL.res = r.rows;
    $('bl-prog').textContent = d.band + ' · ' + d.n + '/18 단계 · ' + summary().done + '단계 직접 확인';
    const chips = $('bl-body').querySelector('.bl-days');
    chips.className = 'bl-days service-steps';
    chips.innerHTML = p.days.map((day, i) => '<button data-service-step="' + i + '" ' + (i > contiguous() || BL.running ? 'disabled' : '') + ' class="' + (st.done.includes(day.n) ? 'ok' : i === BL.di ? 'on' : '') + '" aria-current="' + (i === BL.di ? 'step' : 'false') + '">' + String(day.n).padStart(2, '0') + '</button>').join('');
    chips.querySelectorAll('button').forEach(b => { b.title = p.days[Number(b.dataset.serviceStep)].title; b.onclick = () => { blSaveCurrent(); BL.di = Number(b.dataset.serviceStep); BL.res = null; blApplyDayFiles(); blRender(); }; });
    const req = $('bl-body').querySelector('.bl-req');
    req.querySelector('h3').textContent = d.n + '단계 · ' + d.title;
    const contracts = {
      1: 'validate(body) → 참 또는 거짓. body는 이름·시간·인원이 들어 있는 객체예요.',
      2: 'available(bookings, slot) → 남은 인원. bookings는 현재 예약 배열, slot은 확인할 시간이에요.',
      11: 'page(ids, after, limit, read) → {items, next}. read(id)로 예약 하나를 읽어요.',
      15: 'migrate(raw) → V2 객체. raw는 저장 객체 또는 JSON 문자열이며 원본은 바꾸지 않아요.',
      17: 'verify(factory) → 정상 코드에서는 종료, 결함 코드에서는 예외. factory(options)로 서버를 만들어요.'
    };
    const contract = req.querySelector('.bl-note');
    contract.innerHTML = '<b>이번에 고칠 파일 · ' + escHtml(d.focus) + '</b><br>' + escHtml(contracts[d.n] || 'createService(options)가 반환하는 handle(method, path, body, headers)를 고쳐요. 결과는 {status, body}예요. 이번 단계의 요구사항과 앞의 동작을 함께 지켜요.');
    const concept = document.createElement('div'); concept.className = 'service-concept';
    concept.innerHTML = '<b>먼저 뜻을 이해해요</b><p>' + escHtml(d.concept) + '</p>';
    req.querySelector('h3').after(concept);
    if (window.ServiceBridges) ServiceBridges.mount(concept, d.n, r, save);
    const help = req.querySelector('details');
    help.addEventListener('toggle', () => { if (help.open) { r.helpUsed = true; save(); } });
    const quiz = document.createElement('section'); quiz.className = 'service-quiz';
    quiz.innerHTML = '<span class="home-kicker">개념 확인</span><h3>' + escHtml(d.quiz.question) + '</h3><div>' + d.quiz.options.map((option, i) => '<button data-service-answer="' + i + '" aria-pressed="' + (r.answer === i) + '">' + escHtml(option) + '</button>').join('') + '</div><p id="service-quiz-status" role="status">' + (r.answer === undefined ? '코드와 함께 확인해요. 정답을 골라야 다음 단계로 넘어갈 수 있어요.' : r.answer === d.quiz.answer ? '개념 확인 완료. ' + (checked ? '동작 검사도 통과했어요.' : '코드 동작도 검사해 주세요.') : '다시 생각해 보세요. 설명의 조건과 처리 순서를 비교해 보세요.') + '</p>';
    req.after(quiz);
    quiz.querySelectorAll('button').forEach(b => b.onclick = () => { r.answer = Number(b.dataset.serviceAnswer); finish(); blRender(); $('service-quiz-status').focus?.({ preventScroll: true }); });
    if (d.independent) {
      const note = document.createElement('label'); note.className = 'service-reflection';
      note.innerHTML = '<b>바꾼 이유를 내 말로 적어요</b><span>저장 실패나 재전송 때 무엇을 지켰는지 20자 이상으로 설명해요. 설명은 학습 기록으로 보관하며 자동으로 내용의 정확성을 판정하지 않아요.</span><textarea id="service-note" maxlength="1500" placeholder="어떤 상황을 막았고, 어떤 검사로 확인했나요?">' + escHtml(r.note || '') + '</textarea><small id="service-note-status">' + (r.helpUsed ? '앱 도움을 사용한 확장' : '앱 도움 없이 진행 중') + '</small>';
      quiz.after(note);
      $('service-note').oninput = event => { r.note = event.target.value; finish(); $('bl-prog').textContent=d.band+' · '+d.n+'/18 단계 · '+summary().done+'단계 직접 확인'; if (st.done.includes(18) && !$('service-export')) blRender(); else if (!st.done.includes(18)) $('bl-body').querySelectorAll('.service-complete').forEach(e=>e.remove()); };
    }
    $('bl-txt').readOnly = BL.running;
    $('bl-txt').oninput = event => {
      invalidate(d.n); st.files[BL.file] = event.target.value; save();
      $('bl-body').querySelectorAll('.bl-next, .bl-res, .service-complete, #service-export').forEach(e => e.remove());
      $('bl-body').querySelectorAll('[data-service-step]').forEach(b => { b.disabled = Number(b.dataset.serviceStep) > contiguous(); if (Number(b.dataset.serviceStep) >= BL.di) b.classList.remove('ok'); });
      $('bl-prog').textContent = d.band + ' · 코드를 바꿨어요. 다시 검사해 주세요.';
      $('service-quiz-status').textContent = '코드를 바꿨어요. 개념 선택은 보관했고 동작 검사를 다시 해야 해요.';
    };
    if ($('bl-sol')) { const old = $('bl-sol').onclick; $('bl-sol').onclick = () => { pendingReference = d.n; old(); }; }
    if ($('bl-reset')) { const old = $('bl-reset').onclick; $('bl-reset').onclick = () => { pendingReset = true; old(); }; }
    if ($('bl-next')) { $('bl-next').textContent = p.days[BL.di + 1].title + ' →'; }
    // Generic completion copy cannot say this was done independently.
    const notes = [...$('bl-body').querySelectorAll('.bl-note')];
    const final = notes.find(n => n.textContent.includes('프로젝트 완주'));
    if (final) final.remove();
    if (completed && d.n === 18) {
      const result = document.createElement('section'); result.className = 'service-complete';
      result.innerHTML = '<b>' + (summary().independent ? '앱 도움 없이 마지막 확장을 마쳤어요' : '도움받아 마지막 확장을 마쳤어요') + '</b><p>선택한 구간의 코드 검사와 개념 확인을 마쳤어요. 이제 실제 HTTP 요청과 파일 저장·재시작을 로컬 서버에서 확인해 보세요.</p><button class="study-action" id="service-export">내 예약 서버 파일 받기 ↓</button><details><summary>실행·검사·장애 복구 순서</summary><ol><li>Node.js가 있는 컴퓨터에서 받은 폴더를 열어요.</li><li><code>node my-reservation-server.cjs --check</code>로 실제 HTTP·저장·재시작 검사를 실행해요.</li><li><code>node my-reservation-server.cjs</code>로 실행하고 터미널에 나온 주소를 열어요. 같은 터미널의 사용자 토큰을 화면에 붙여 넣어요.</li><li>Ctrl+C로 종료하고 다시 실행해 예약이 복원되는지 확인해요. 저장 파일이 깨졌다면 덮어쓰기 전에 원본을 복사해 보관하세요.</li><li>준비 상태가 503이면 새 요청을 받지 않고 저장 폴더를 점검해요. V2 쓰기 이후에는 V2를 읽는 판으로 복구해야 해요.</li></ol><p>한 프로세스·로컬 파일용 서버예요. 인터넷에 공개하기 전에는 실제 로그인·DB 트랜잭션·공유 요청 제한·HTTPS를 연결하는 별도 실습이 필요해요.</p></details>';
      $('bl-body').append(result);
      $('service-export').onclick = () => {
        blSaveCurrent(); if (!st.done.includes(18) || r.signature !== signature()) return;
        const blob = new Blob([ServiceExport.bundle(st.files)], { type: 'text/javascript;charset=utf-8' });
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = 'my-reservation-server.cjs'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    }
    const back = document.createElement('button'); back.className = 'service-map-link'; back.textContent = '← 전체 학습 흐름 보기';
    back.onclick = () => { blSaveCurrent(); closeBuildLab(); open(); }; chips.before(back);
    save();
  };
  const oldList = blRenderList;
  blRenderList = function () {
    oldList();
    const header = document.createElement('section'); header.className = 'service-lab-entry';
    header.innerHTML = '<span class="home-kicker">처음부터 이어서 만들기</span><h2>예약 서비스 하나로 입문부터 운영까지</h2><p>입문 4단계 · 중급 7단계 · 시니어 7단계. 같은 코드에서 실패를 재현하고, 마지막에는 서버 파일을 받아 실행해요.</p><button class="study-action" id="service-lab-map">18단계 흐름 보기 →</button>';
    $('bl-body').prepend(header);
    $('service-lab-map').onclick = () => { closeBuildLab(); open(); };
  };
  const oldHero = renderHero;
  renderHero = function () {
    oldHero();
    const next = document.querySelector('.study-next'); if (!next || $('service-home')) return;
    const link = document.createElement('button'); link.id = 'service-home'; link.className = 'service-map-link'; link.textContent = '입문 → 중급 → 시니어, 이어지는 실습 보기 →'; link.onclick = open; next.append(link);
  };
  const oldCoach = openCoach;
  openCoach = function () {
    oldCoach();
    const st = summary(), section = document.createElement('section'); section.className = 'service-coach-evidence';
    section.innerHTML = '<h3>같은 서비스를 이어서 만든 기록</h3><p>' + st.done + '/18 단계 직접 확인' + (st.foundation ? ' · 기초 코드 ' + st.foundation + '단계 제공' : '') + ' · 마지막 확장 ' + (!blState(ID).done.includes(18) ? '진행 전' : st.independent ? '앱 도움 없이 확인 완료' : '도움받아 완료') + '</p><button class="service-map-link" id="service-record-link">이어지는 실습 열기 →</button>';
    $('cch-close').before(section); $('service-record-link').onclick = () => { $('profile').classList.remove('on'); open(); };
  };
  window.ServicePath = { open, summary, id: ID };
  renderHero();
})();
