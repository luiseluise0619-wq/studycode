#!/usr/bin/env node
/* 빌드 랩 프로젝트를 data/build.js 에 넣는다.

   넣기 전에 앱과 <b>똑같은 채점기</b>로 돌려 본다. 셸의 buildDoc() 이 만드는
   iframe 문서를 그대로 쓰므로, 여기서 통과하면 학습자 화면에서도 통과한다.

   Day 마다 두 가지를 확인한다
     · 정답 예시(sol)를 넣으면 그 Day 의 기준을 전부 통과한다
     · 씨앗 파일(seed)만으로는 통과하지 못한다 — 통과하면 그 Day 는 빈 과제다
   그리고 Day N 의 정답으로 Day 1..N 의 기준을 모두 확인한다. 앞 Day 를 깨뜨리는
   구현을 정답이라고 부를 수는 없다.

   사용법:  BSRC=./myproject.cjs node tools/binject.cjs [--dry]
   대상 파일은 module.exports = { PROJECT, SOL } 을 내보내야 한다.
     PROJECT : data/build.js 의 projects 에 들어갈 객체 (id·title·seed·days…)
     SOL     : Day 수만큼의 배열. 각 원소는 {파일이름: 내용} 이다. */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const { chromium } = require(path.join(ROOT, 'node_modules', 'playwright'));

const src = process.env.BSRC || process.argv[2];
const DRY = process.argv.includes('--dry');
if (!src) { console.error('BSRC 환경변수나 인자로 프로젝트 파일을 지정하세요'); process.exit(2); }
const { PROJECT, SOL } = require(path.resolve(src));

const B = path.join(ROOT, 'data', 'build.js');
const raw = fs.readFileSync(B, 'utf8');
const m = raw.match(/^__CR\('([^']+)',(.*)\);\s*$/s);
if (!m) throw new Error('build.js 형식이 예상과 다르다');
const DATA = JSON.parse(m[2]);

let bad = 0;
const say = msg => { bad++; console.log('  ✗ ' + msg); };

/* ---- 형식 검사 ---- */
['id', 'title', 'sub', 'brief', 'contract', 'seed', 'days'].forEach(k => {
  if (PROJECT[k] === undefined) say('PROJECT.' + k + ' 가 없다');
});
if (DATA.projects.some(p => p.id === PROJECT.id)) say('같은 id 가 이미 있다: ' + PROJECT.id);
if (DATA.projects.some(p => p.title === PROJECT.title)) say('같은 제목이 이미 있다');
if (!PROJECT.seed || !PROJECT.seed['app.js']) say('seed 에 app.js 가 없다');
if (!Array.isArray(SOL) || SOL.length !== (PROJECT.days || []).length)
  say('SOL 길이가 Day 수와 다르다 (' + (SOL || []).length + ' / ' + (PROJECT.days || []).length + ')');
(PROJECT.days || []).forEach((d, i) => {
  const w = 'Day' + (i + 1);
  if (d.n !== i + 1) say(w + ' 의 n 이 순서와 다르다: ' + d.n);
  ['title', 'req', 'hint', 'tests'].forEach(k => { if (!d[k]) say(w + ' 에 ' + k + ' 가 없다'); });
  if (!Array.isArray(d.req) || d.req.length < 3) say(w + ' 요구사항이 3개 미만');
  if (!Array.isArray(d.tests) || d.tests.length < 4) say(w + ' 수용 기준이 4개 미만');
  (d.tests || []).forEach((t, j) => {
    if (!t.n || !t.c) say(w + ' 기준' + (j + 1) + ' 에 n 또는 c 가 없다');
  });
  const names = (d.tests || []).map(t => t.n);
  if (new Set(names).size !== names.length) say(w + ' 기준 이름이 겹친다');
});
if (bad) { console.log('\n' + bad + '건 문제 — 넣지 않았다'); process.exit(1); }

/* ---- 앱과 같은 채점기로 실제 실행 ---- */
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  const page = await b.newPage();
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => typeof buildDoc === 'function', { timeout: 60000 });

  /* buildDoc 이 만든 문서를 iframe 에 넣고 postMessage 로 결과를 받는다 */
  async function run(files, tests, day) {
    return page.evaluate(({ files, tests, day }) => new Promise((res) => {
      const fr = document.createElement('iframe');
      fr.style.display = 'none';
      const to = setTimeout(() => { cleanup(); res(tests.map(t => ({ n: t.n, ok: false, err: '시간 초과' }))); }, 8000);
      function onMsg(e) { if (e.data && e.data.__cr === 'build') { clearTimeout(to); cleanup(); res(e.data.res); } }
      function cleanup() { window.removeEventListener('message', onMsg); fr.remove(); }
      window.addEventListener('message', onMsg);
      document.body.appendChild(fr);
      fr.srcdoc = buildDoc(files, tests, day);
    }), { files, tests, day });
  }

  const merged = Object.assign({}, PROJECT.seed);
  let fail = 0;
  for (let i = 0; i < PROJECT.days.length; i++) {
    const d = PROJECT.days[i];

    /* 씨앗만으로 통과하면 빈 과제다 */
    const seedRes = await run(PROJECT.seed, d.tests, d);
    if (seedRes.every(x => x.ok)) { console.log('  ✗ Day' + d.n + ' 은 씨앗만으로 통과한다 (과제가 없다)'); fail++; }

    Object.assign(merged, SOL[i]);
    /* Day 1..N 의 기준을 이번 정답으로 모두 확인 */
    for (let k = 0; k <= i; k++) {
      const dk = PROJECT.days[k];
      const r = await run(merged, dk.tests, dk);
      const ng = r.filter(x => !x.ok);
      if (ng.length) {
        fail++;
        console.log('  ✗ Day' + d.n + ' 정답으로 Day' + dk.n + ' 기준 ' + ng.length + '개 실패');
        ng.slice(0, 4).forEach(x => console.log('      · ' + x.n + ' — ' + x.err));
      }
    }
    console.log('  Day' + d.n + '  기준 ' + d.tests.length + '개 · 누적 확인 ' + (i + 1) + '일치');
  }
  await b.close();
  if (fail) { console.log('\n' + fail + '건 실패 — 넣지 않았다'); process.exit(1); }

  const nTests = PROJECT.days.reduce((a, d) => a + d.tests.length, 0);
  if (DRY) { console.log('\n검사 통과 (--dry 라 쓰지 않았다) · Day ' + PROJECT.days.length + ' · 기준 ' + nTests); return; }

  DATA.projects.push(PROJECT);
  DATA.sol[PROJECT.id] = SOL;
  fs.writeFileSync(B, "__CR('" + m[1] + "'," + JSON.stringify(DATA) + ");\n");
  const back = JSON.parse(fs.readFileSync(B, 'utf8').match(/^__CR\('[^']+',(.*)\);\s*$/s)[1]);
  if (JSON.stringify(back) !== JSON.stringify(DATA)) throw new Error('왕복에서 내용이 달라졌다');

  const totDays = DATA.projects.reduce((a, p) => a + p.days.length, 0);
  const totTests = DATA.projects.reduce((a, p) => a + p.days.reduce((s, d) => s + d.tests.length, 0), 0);
  console.log('\n' + PROJECT.title + ' 추가 — Day ' + PROJECT.days.length + ' · 기준 ' + nTests);
  console.log('빌드 랩 전체: 프로젝트 ' + DATA.projects.length + ' · Day ' + totDays + ' · 기준 ' + totTests);
  console.log('셸의 BUILD_DAYS 를 ' + totDays + ' 로 맞춰야 합니다');
})();
