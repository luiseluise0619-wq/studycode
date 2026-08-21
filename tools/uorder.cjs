#!/usr/bin/env node
/* 트랙의 유닛 배열 순서를 점검한다.

   앱은 유닛 순서를 두 가지로 정한다.
     ord 가 적혀 있으면  → 그 값을 따른다 (mergeTrack)
     없으면              → 유닛 제목의 낱말을 보고 난이도를 짐작한다 (unitDiff)

   짐작이 자주 틀린다 — '고차함수와 함수 합성' 이 '고차' 때문에 맨 뒤로 가고,
   '최적화·코드 생성' 이 '최적화' 때문에 맨 뒤로 가고, '힙·구간·DP 입문' 이
   '입문' 때문에 맨 앞으로 온다. 지금까지 이런 오정렬을 여덟 트랙에서 손으로
   찾아 고쳤다. 이 도구는 나머지를 한 번에 훑는다.

   무엇을 의심스럽다고 보나
     · 데이터에 적힌 순서와 화면 순서가 다른데 ord 가 없다 (짐작이 개입했다)
     · 마무리 성격 유닛(시뮬레이션·실행형·심화)이 뒤가 아니다
     · 시작 성격 유닛(기초·첫걸음·입문)이 앞이 아니다

   고칠 때는 데이터 파일 순서로 되돌리지 않는다 — 데이터 파일은 콘텐츠를 덧붙인
   순서라 큰 트랙일수록 엉망이다 (python 은 '파이썬 첫걸음' 이 12번, sql 은 1번이
   'SQL 심화'). 짐작이 그걸 보정해 기초를 앞으로 끌어오고 있고, 그 일은 잘한다.
   남은 문제는 마무리 성격 유닛(시뮬레이션·실행형 실전·설계 실전)이 중간에 끼는
   것과, 기초가 그래도 뒤에 남는 몇몇 트랙이다. 그래서 --fix 는 화면 순서를 받아
   그 둘만 고쳐 ord 로 굳힌다.

   사용법:  node tools/uorder.cjs            모든 트랙 점검
            node tools/uorder.cjs <track>    한 트랙 자세히
            node tools/uorder.cjs --fix      고친 순서를 제안만 (쓰지 않음)
            node tools/uorder.cjs --write    제안대로 ord 를 적는다 */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));

const ARG = process.argv[2] || null;
const FIX = ARG === '--fix' || ARG === '--write';
const WRITE = ARG === '--write';
const ONLY = FIX ? null : ARG;
/* 점검용 — 넓게 잡아 눈에 띄게 한다 */
const LAST = /시뮬레이션|실행형|심화|프로젝트|설계 실전/;
const FIRST = /첫걸음|기초|입문|시작|이란|무엇/;

/* 고치기용 — 좁게 잡는다. '포인터 심화' 는 '포인터' 바로 뒤가 맞으므로
   심화를 뒤로 보내면 안 된다. 정말 맨 뒤에 와야 하는 것은 '해 보는' 유닛뿐이다. */
const TAIL_FIX = /시뮬레이션|실행형 실전|실행형 ·|설계 실전|설계 · 직접|직접 구현 —|직접 코딩 —|직접 SQL —|직접 만들며|직접 실행해/;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  const p = await b.newPage();
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  await p.waitForFunction(() => typeof COURSES !== 'undefined', { timeout: 60000 });

  const shown = await p.evaluate(async () => {
    await Promise.all(Object.keys(COURSES).map(k => ensureTrack(k)));
    const o = {};
    for (const k in COURSES) o[k] = COURSES[k].units.map(u => u.title);
    return o;
  });
  await b.close();

  /* 데이터 파일에 적힌 순서와 ord 선언 여부 */
  const raw = {};
  fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^t-.*\.js$/.test(f)).forEach(f => {
    const m = fs.readFileSync(path.join(ROOT, 'data', f), 'utf8').match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    if (!m) return;
    const u = JSON.parse(m[2]);
    raw[m[1]] = { titles: u.map(x => x.t), ord: u.length > 0 && u.every(x => typeof x.ord === 'number') };
  });

  let flagged = 0;
  const keys = ONLY ? [ONLY] : Object.keys(shown).sort();
  keys.forEach(k => {
    const view = shown[k] || [], data = raw[k];
    if (!view.length) return;
    const why = [];

    /* 마무리 유닛이 뒤에 몰려 있는가 */
    const lastIdx = view.map((t, i) => LAST.test(t) ? i : -1).filter(i => i >= 0);
    const tail = view.length - lastIdx.length;
    lastIdx.forEach(i => { if (i < tail) why.push('마무리 유닛이 앞에 있다: ' + (i + 1) + '. ' + view[i]); });

    /* 시작 유닛이 앞에 있는가 */
    view.forEach((t, i) => { if (FIRST.test(t) && i > 2) why.push('시작 성격 유닛이 뒤에 있다: ' + (i + 1) + '. ' + view[i]); });

    /* ord 가 없는데 데이터 순서와 화면 순서가 다르다 = 짐작이 순서를 바꿨다 */
    let moved = 0;
    if (data && !data.ord) {
      const inData = data.titles.filter(t => view.includes(t));
      const inView = view.filter(t => inData.includes(t));
      inView.forEach((t, i) => { if (inData[i] !== t) moved++; });
      if (moved) why.push('데이터 순서와 다르게 재배치됨 (' + moved + '자리) — ord 없음');
    }

    if (!why.length && !ONLY) return;
    flagged++;
    console.log('\n■ ' + k + (data && data.ord ? '  [순서 적혀 있음]' : '  [짐작에 맡김]'));
    why.forEach(w => console.log('   · ' + w));
    if (ONLY || why.length) view.forEach((t, i) => console.log('     ' + String(i + 1).padStart(2) + '. ' + t));
  });

  if (!FIX) {
    console.log('\n트랙 ' + Object.keys(shown).length + '개 중 순서를 적어 둔 트랙 ' +
      Object.values(raw).filter(x => x.ord).length + '개 · 살펴볼 트랙 ' + flagged + '개');
    return;
  }

  /* 화면 순서를 받아 두 가지만 고친다 — 기초를 맨 앞으로, 마무리류를 맨 뒤로 */
  let changed = 0;
  Object.keys(shown).sort().forEach(k => {
    const data = raw[k];
    if (!data || data.ord) return;                 // 이미 적어 둔 트랙은 건드리지 않는다
    const view = shown[k];
    /* ord 는 유닛 제목으로 되짚어 적으므로, 같은 제목이 두 번 있으면 어느 쪽인지
       가릴 수 없다. 그런 트랙은 손대지 않고 알리기만 한다. */
    if (new Set(view).size !== view.length) {
      const d = view.filter((t, i) => view.indexOf(t) !== i);
      console.log('\n■ ' + k + '  (건너뜀 — 유닛 제목이 겹친다: ' + [...new Set(d)].join(', ') + ')');
      return;
    }
    const mid = [], tailArr = [];
    view.forEach(t => (TAIL_FIX.test(t) ? tailArr : mid).push(t));
    const want = mid.concat(tailArr);
    const same = want.every((t, i) => t === view[i]);
    if (same) return;
    changed++;
    console.log('\n■ ' + k);
    want.forEach((t, i) => {
      const from = view.indexOf(t);
      console.log('   ' + String(i + 1).padStart(2) + '. ' + t + (from === i ? '' : '   ← ' + (from + 1) + '번에서'));
    });
    if (!WRITE) return;
    const f = path.join(ROOT, 'data', 't-' + k + '.js');
    const m2 = fs.readFileSync(f, 'utf8').match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    const units = JSON.parse(m2[2]);
    const pos = {}; want.forEach((t, i) => { pos[t] = i + 1; });
    if (!units.every(u => pos[u.t])) { console.log('   (건너뜀 — 데이터에만 있는 유닛이 있다)'); changed--; return; }
    units.forEach(u => { u.ord = pos[u.t]; });
    fs.writeFileSync(f, "__CR('t:" + m2[1] + "'," + JSON.stringify(units) + ");\n");
    const back = JSON.parse(fs.readFileSync(f, 'utf8').match(/^__CR\('t:[^']+',(.*)\);\s*$/s)[1]);
    if (JSON.stringify(back) !== JSON.stringify(units)) throw new Error(k + ' 왕복에서 내용이 달라졌다');
  });
  console.log('\n' + (WRITE ? '순서를 적은' : '고칠') + ' 트랙 ' + changed + '개');
})();
