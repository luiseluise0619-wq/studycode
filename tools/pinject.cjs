#!/usr/bin/env node
/* 트랙별 프로젝트를 data/projects.js 에 넣는다.

   앱은 트랙 화면 맨 위에 '이 트랙으로 만드는 프로젝트' 배너를 띄우는데,
   그 대상을 projectForTrack() 이 고른다 — PROJECTS 의 모든 페르소나를 훑어
   skills[0] 이 트랙 키와 같은 프로젝트를 찾는 방식이다. 그래서 새 프로젝트를
   'tracks' 페르소나에 넣고 skills[0] 을 트랙 키로 두면 셸을 건드리지 않고도
   배너가 붙는다 (셸은 600KB 상한에 1KB 도 안 남아 있다).

   사용법:  PSRC=./myproject.cjs node tools/pinject.cjs
   대상 파일은 module.exports = { PROJECTS: [...] } 를 내보내야 한다.

   검사하는 것
     - 필수 키(lv·em·title·desc·skills·phases)와 skills[0] 이 실제 트랙인지
     - 그 트랙에 이미 프로젝트가 붙어 있지 않은지 (있으면 덮어쓰지 않는다)
     - 단계 유형별 필수 항목 (note: ph · decide: sit·opts·best 하나 · build: hint·acc·sol)
     - decide 보기의 fx 축이 앱이 아는 역량 축인지 (모르는 축은 점수에 반영되지 않고
       조용히 사라진다 — AXIS_REMEDY 에 없는 이름을 적으면 그 선택은 무효가 된다)
     - 제목 중복, JSON 왕복 */

const fs = require('fs');
const path = require('path');

const src = process.env.PSRC || process.argv[2];
if (!src) { console.error('PSRC 환경변수나 인자로 프로젝트 파일을 지정하세요'); process.exit(2); }
const SRC = require(path.resolve(src));
const NEW = SRC.PROJECTS;
/* 어느 묶음에 넣을 것인가. 프로젝트 화면은 이제 모든 묶음을 보여 주므로
   'tracks' 말고 다른 묶음에도 넣을 수 있다. 없으면 예전대로 tracks 다. */
const GROUP = SRC.group || 'tracks';
/* 전용 프로젝트가 이미 있는 트랙에 하나 더 붙이는 경우.
   배너는 먼저 찾은 것이 잡으므로 새 프로젝트가 그 자리를 빼앗지는 않는다 —
   그래도 '모르고 두 개를 만든 것' 과 구분하려고 파일이 직접 밝히게 한다. */
const EXTRA = !!SRC.extra;

const ROOT = path.join(__dirname, '..');
const P = path.join(ROOT, 'data', 'projects.js');
const raw = fs.readFileSync(P, 'utf8');
const m = raw.match(/^__CR\('([^']+)',(.*)\);\s*$/s);
if (!m) throw new Error('projects.js 형식이 예상과 다르다');
const DATA = JSON.parse(m[2]);

/* 셸이 아는 트랙 목록 */
const shell = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const TRACKS = Object.keys(JSON.parse(shell.match(/^const COURSES = (\{.*\});$/m)[1]));
const ALIAS = JSON.parse('{' + shell.match(/const TRACK_ALIAS=\{([^}]*)\}/)[1]
  .replace(/(\w+):/g, '"$1":') + '}');

/* 앱이 아는 역량 축 — 프로젝트 보기의 fx 는 이 이름들만 쓸 수 있다 */
const AXES = (shell.match(/const AXIS_REMEDY=\{([\s\S]*?)\n\};/)[1]
  .match(/^\s*(\w+)\s*:/gm) || []).map(s => s.trim().replace(':', ''));
if (AXES.length < 5) throw new Error('역량 축 목록을 셸에서 읽지 못했다');

/* 이미 프로젝트가 붙은 트랙 — projectForTrack 과 같은 규칙.
   skills[0] 로 걸린 것(전용)과 skills 안에 끼어 걸린 것(곁다리)을 나눠 둔다.
   곁다리는 전용 프로젝트가 생기면 밀려나므로 새 프로젝트를 막지 않는다. */
function covered() {
  const out = {};
  TRACKS.forEach(tk => {
    const key = ALIAS[tk] || tk;
    for (const persona in DATA) for (const p of DATA[persona]) {
      if (!p.skills) continue;
      if (p.skills[0] === key) { out[tk] = { title: p.title, own: true }; return; }
      if (!out[tk] && p.skills.includes(key)) out[tk] = { title: p.title, own: false };
    }
  });
  return out;
}
const before = covered();

let bad = 0;
const say = (msg) => { bad++; console.log('  ✗ ' + msg); };
const titles = new Set(Object.values(DATA).flat().map(p => p.title));

NEW.forEach((p, i) => {
  const at = '[' + (i + 1) + '] ' + (p.title || '(제목 없음)');
  ['lv', 'em', 'title', 'desc', 'skills', 'phases'].forEach(k => {
    if (p[k] === undefined) say(at + ' ' + k + ' 가 없다');
  });
  if (!(p.lv >= 1 && p.lv <= 5)) say(at + ' lv 는 1~5 여야 한다');
  if (!Array.isArray(p.skills) || !p.skills.length) say(at + ' skills 가 비었다');
  else {
    const tk = p.skills[0];
    if (!TRACKS.includes(tk) && !Object.values(ALIAS).includes(tk))
      say(at + ' skills[0] 이 트랙 키가 아니다: ' + tk);
    if (before[tk] && before[tk].own && !EXTRA)
      say(at + ' 그 트랙에는 이미 전용 프로젝트가 있다: ' + before[tk].title +
          " (일부러 하나 더 붙이는 것이면 파일에 extra:true 를 적으세요)");
  }
  if (titles.has(p.title)) say(at + ' 제목이 기존 프로젝트와 같다');
  /* 제목만 다르고 주제가 같은 프로젝트를 걸러 낸다.
     단계 제목이 둘 이상 겹치면 같은 것을 두 번 가르치고 있을 가능성이 크다 —
     실제로 mleval 에서 '정확도 98%' 짜리를 두 개 만들 뻔했고, 겹친 단계
     제목 하나가 유일한 신호였다. 우연히 겹치는 일반적인 이름도 있으므로
     하나까지는 넘긴다. */
  const mine = new Set((p.phases || []).map(x => x.t).filter(Boolean));
  for (const persona in DATA) for (const ex of DATA[persona]) {
    const same = (ex.phases || []).map(x => x.t).filter(t => mine.has(t));
    if (same.length >= 2)
      say(at + " 기존 '" + ex.title + "' 과(와) 단계 제목이 " + same.length +
          '개 겹친다 — 주제가 같지 않은지 보세요: ' + same.slice(0, 3).join(' · '));
  }
  if (!Array.isArray(p.phases) || p.phases.length < 5) say(at + ' 단계가 5개 미만');
  (p.phases || []).forEach((ph, j) => {
    const w = at + ' 단계' + (j + 1);
    if (!ph.t || !ph.goal) say(w + ' t 또는 goal 이 없다');
    if (ph.type === 'note') { if (!ph.ph) say(w + ' note 에 ph(예시) 가 없다'); }
    else if (ph.type === 'decide') {
      if (!ph.sit) say(w + ' decide 에 sit 이 없다');
      const o = ph.opts || [];
      if (o.length < 3) say(w + ' 보기가 3개 미만');
      if (o.filter(x => x.best).length !== 1) say(w + ' best 가 정확히 하나가 아니다');
      o.forEach((x, k) => {
        if (!x.label || !x.fb) say(w + ' 보기' + (k + 1) + ' label/fb 누락');
        Object.keys(x.fx || {}).forEach(a => {
          if (!AXES.includes(a)) say(w + ' 보기' + (k + 1) + ' 모르는 역량 축: ' + a + ' (쓸 수 있는 것: ' + AXES.join(' ') + ')');
        });
      });
    } else if (ph.type === 'build') {
      ['hint', 'acc', 'sol', 'lang'].forEach(k => { if (!ph[k]) say(w + ' build 에 ' + k + ' 가 없다'); });
    } else say(w + ' 알 수 없는 type: ' + ph.type);
  });
});

if (bad) { console.log('\n' + bad + '건 문제 — 넣지 않았다'); process.exit(1); }

DATA[GROUP] = (DATA[GROUP] || []).concat(NEW);
fs.writeFileSync(P, "__CR('" + m[1] + "'," + JSON.stringify(DATA) + ");\n");
const back = JSON.parse(fs.readFileSync(P, 'utf8').match(/^__CR\('[^']+',(.*)\);\s*$/s)[1]);
if (JSON.stringify(back) !== JSON.stringify(DATA)) throw new Error('왕복에서 내용이 달라졌다');

const after = covered();
const gained = TRACKS.filter(t => !before[t] && after[t]);
console.log('프로젝트 ' + NEW.length + "개를 '" + GROUP + "' 묶음에 추가 · 단계 " +
  NEW.reduce((s, p) => s + p.phases.length, 0) + '개');
gained.forEach(t => console.log('  ' + t.padEnd(11) + after[t].title + (after[t].own ? '' : '  (곁다리)')));
const none = TRACKS.filter(t => !after[t]);
const side = TRACKS.filter(t => after[t] && !after[t].own);
console.log('배너가 아예 없는 트랙 ' + none.length + '개' + (none.length ? ': ' + none.join(' ') : ''));
console.log('곁다리로만 걸린 트랙 ' + side.length + '개' + (side.length ? ': ' + side.join(' ') : ''));
