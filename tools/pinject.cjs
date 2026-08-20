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
     - 제목 중복, JSON 왕복 */

const fs = require('fs');
const path = require('path');

const src = process.env.PSRC || process.argv[2];
if (!src) { console.error('PSRC 환경변수나 인자로 프로젝트 파일을 지정하세요'); process.exit(2); }
const { PROJECTS: NEW } = require(path.resolve(src));

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

/* 이미 프로젝트가 붙은 트랙 — projectForTrack 과 같은 규칙 */
function covered() {
  const out = {};
  TRACKS.forEach(tk => {
    const key = ALIAS[tk] || tk;
    for (const persona in DATA) for (const p of DATA[persona]) {
      if (!p.skills) continue;
      if (p.skills[0] === key) { out[tk] = p.title; return; }
      if (!out[tk] && p.skills.includes(key)) out[tk] = p.title;
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
    if (before[tk]) say(at + ' 그 트랙에는 이미 프로젝트가 있다: ' + before[tk]);
  }
  if (titles.has(p.title)) say(at + ' 제목이 기존 프로젝트와 같다');
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
      o.forEach((x, k) => { if (!x.label || !x.fb) say(w + ' 보기' + (k + 1) + ' label/fb 누락'); });
    } else if (ph.type === 'build') {
      ['hint', 'acc', 'sol', 'lang'].forEach(k => { if (!ph[k]) say(w + ' build 에 ' + k + ' 가 없다'); });
    } else say(w + ' 알 수 없는 type: ' + ph.type);
  });
});

if (bad) { console.log('\n' + bad + '건 문제 — 넣지 않았다'); process.exit(1); }

DATA.tracks = (DATA.tracks || []).concat(NEW);
fs.writeFileSync(P, "__CR('" + m[1] + "'," + JSON.stringify(DATA) + ");\n");
const back = JSON.parse(fs.readFileSync(P, 'utf8').match(/^__CR\('[^']+',(.*)\);\s*$/s)[1]);
if (JSON.stringify(back) !== JSON.stringify(DATA)) throw new Error('왕복에서 내용이 달라졌다');

const after = covered();
const gained = TRACKS.filter(t => !before[t] && after[t]);
console.log('프로젝트 ' + NEW.length + '개 추가 · 단계 ' + NEW.reduce((s, p) => s + p.phases.length, 0) + '개');
gained.forEach(t => console.log('  ' + t.padEnd(11) + after[t]));
console.log('프로젝트 없는 트랙: ' + TRACKS.filter(t => !after[t]).length + '개 남음');
