'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const LP = require('../data/learning-path.js');
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS ' + name); }
  catch (error) { console.error('FAIL ' + name); throw error; }
}
function frozen(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(frozen);
    Object.freeze(value);
  }
  return value;
}
const small = {
  python: { name: 'Python', units: [
    { title: '시니어 설계', lessons: [{ title: '분산 시스템의 선택', n: 5 }] },
    { title: '파이썬 첫걸음', lessons: [{ title: '화면에 출력하기', n: 5 }, { title: '변수와 자료형', n: 5 }] },
    { title: '작은 프로그램', lessons: [{ title: '함수 만들기', n: 3 }, { title: '딕셔너리', n: 4 }] }
  ] },
  sql: { name: 'SQL', units: [{ title: 'SQL 기초', lessons: [{ title: 'SELECT로 조회하기', n: 5 }] }] },
  web: { name: 'HTML과 CSS', units: [{ title: 'HTML 기초', lessons: [{ title: '태그의 기본 구조', n: 5 }] }] },
  sysd: { name: '시스템 설계', units: [{ title: '설계 기초', lessons: [{ title: '용량 추정', n: 5 }] }] }
};
function answerSeries(state, options = {}) {
  const count = options.count || 12;
  for (let i = 0; i < count; i++) {
    state = LP.recordAnswer(state, Object.assign({
      track: 'python', lessonId: 'lesson-' + Math.floor(i / 6), questionId: 'question-' + i,
      level: 1, correct: true, hinted: false, day: '2026-10-03', type: 'choice'
    }, typeof options.row === 'function' ? options.row(i) : options.row));
  }
  return state;
}

test('기존 기록과 입력 객체를 보존하며 시작 수준과 시간만 설정한다', () => {
  const old = frozen({ xp: 300, done: { 'python:old': true }, wrongs: [{ due: '2026-10-03' }], trk: { python: { n: 10 } } });
  const next = LP.configure(old, { experience: 'working', minutes: 30 });
  assert.equal(next.learning.experience, 'working');
  assert.equal(next.learning.minutes, 30);
  assert.equal(LP.currentLevel(next, 'python'), 3);
  assert.equal(next.done, old.done);
  assert.equal(next.trk, old.trk);
  assert.equal(old.learning, undefined);
  assert.equal(LP.profile({}).experience, 'new');
  assert.equal(LP.profile({ learning: { experience: 'bad', minutes: -20 } }).minutes, 10);
});

test('초보자는 배열 맨 앞의 심화 레슨 대신 실제 첫걸음을 추천받는다', () => {
  const result = LP.recommendation(frozen({}), frozen(small), { track: 'python', today: '2026-10-03' });
  assert.equal(result.lesson.title, '화면에 출력하기');
  assert.equal(result.lesson.ui, 1);
  assert.equal(result.lesson.level, 1);
  assert.equal(result.difficulty.level, 1);
  assert.equal(LP.questionLevel({}, small.python.units[0], small.python.units[0].lessons[0], 'python'), 5);
});

test('명시 난이도가 제목 추정을 덮어쓰며 XP와 배열 위치는 난이도가 아니다', () => {
  assert.equal(LP.questionLevel({ d: 1, t: 'code' }, { title: '시니어' }, { title: '실무' }, 'sysd'), 1);
  assert.equal(LP.lessonLevel({ title: '시니어' }, { title: '실무', lv: 2 }, 'python'), 2);
  assert.equal(LP.lessonLevel({}, { title: '화면에 출력하기', xp: 140 }, 'python'), 1);
  assert.equal(LP.lessonLevel({}, { title: '용량 추정' }, 'sysd'), 3);
  assert.equal(LP.lessonLevel({ title: '가변 기본값과 별칭의 함정' }, { title: '가변 기본 인자' }, 'python'), 3);
  assert.equal(LP.lessonLevel({ title: '진리값·비교·스코프의 함정' }, { title: '연쇄 비교와 단락 평가' }, 'python'), 3);
  assert.equal(LP.lessonLevel({ title: '실무 운영 — 태그 · 릴리스 · 큰 저장소' }, { title: '버전과 태그' }, 'git'), 3);
});

test('하루 시간이 짧아도 선수 레슨을 건너뛰지 않고 앞부분부터 배운다', () => {
  const course = { python: { name: 'Python', units: [{ title: '파이썬 첫걸음', lessons: [
    { title: '화면에 출력하기', q: Array.from({ length: 5 }, () => ({ t: 'py' })) },
    { title: '변수와 자료형', q: [{ t: 'choice' }] }
  ] }] } };
  const rec = LP.recommendation({}, course, { track: 'python' });
  assert.equal(rec.lesson.title, '화면에 출력하기');
  assert.equal(rec.lesson.split, true);
  assert.equal(rec.minutes, 10);
});

test('정답률만 높거나 같은 문제를 반복해도 난이도를 올리지 않는다', () => {
  const short = answerSeries({}, { count: 7 });
  assert.equal(LP.currentLevel(short, 'python'), 1);
  const repeated = answerSeries({}, { count: 30, row: { questionId: 'same-question' } });
  assert.equal(LP.currentLevel(repeated, 'python'), 1);
  const oneLesson = answerSeries({}, { row: { lessonId: 'one-lesson' } });
  assert.equal(LP.currentLevel(oneLesson, 'python'), 1);
  const unknownHints = answerSeries({}, { row: { hinted: undefined } });
  assert.equal(LP.currentLevel(unknownHints, 'python'), 1);
});

test('현재 단계의 서로 다른 문제와 레슨에서 혼자 해결하면 한 단계만 올라간다', () => {
  const next = answerSeries(frozen({ done: { old: true }, xp: 10 }));
  assert.equal(LP.currentLevel(next, 'python'), 2);
  assert.equal(next.learning.lastAdjustment.from, 1);
  assert.equal(next.learning.lastAdjustment.to, 2);
  assert.equal(LP.recentEvidence(next, 'python').count, 0);
  assert.equal(next.xp, 10);
  const easy = answerSeries(next, { count: 30 });
  assert.equal(LP.currentLevel(easy, 'python'), 2);
  assert.equal(LP.currentLevel(easy, 'sql'), 1);
});

test('쉬운 레슨이 많이 남아 있어도 근거가 충분하면 다음 단계로 추천이 이동한다', () => {
  const course = { python: { name: 'Python', units: [
    { title: '함수 기초', lessons: Array.from({ length: 80 }, (_, i) => ({ title: '함수 만들기 ' + i, n: 4 })) },
    { title: '비동기 프로그래밍', lessons: [{ title: 'async와 await', n: 5 }] }
  ] } };
  const start = LP.configure({}, { experience: 'basic' });
  const state = answerSeries(start, { row: { level: 2 } });
  assert.equal(LP.currentLevel(state, 'python'), 3);
  assert.equal(LP.recommendation(state, course, { track: 'python' }).lesson.title, 'async와 await');
  assert.equal(Object.keys(state.done || {}).length, 0);
});

test('복습과 다른 트랙 정답으로 현재 트랙의 난이도를 올리지 않는다', () => {
  assert.equal(LP.currentLevel(answerSeries({}, { row: { review: true } }), 'python'), 1);
  const next = answerSeries({}, { row: { track: 'sql' } });
  assert.equal(LP.currentLevel(next, 'sql'), 2);
  assert.equal(LP.currentLevel(next, 'python'), 1);
});

test('응용 이후에는 직접 구현한 증거도 있어야 난이도를 올린다', () => {
  const start = LP.configure({}, { experience: 'working' });
  const choices = answerSeries(start, { row: { level: 3 } });
  assert.equal(LP.currentLevel(choices, 'python'), 3);
  const practical = answerSeries(start, { row: i => ({ level: 3, type: i < 3 ? 'py' : 'choice' }) });
  assert.equal(LP.currentLevel(practical, 'python'), 4);
});

test('최근 어려움이 지속되면 쉬운 예제로 한 단계씩 조정한다', () => {
  const start = LP.configure({}, { experience: 'advanced' });
  const failures = answerSeries(start, { count: 8, row: { level: 4, correct: false } });
  assert.equal(LP.currentLevel(failures, 'python'), 3);
  assert.equal(failures.learning.lastAdjustment.from, 4);
  const manyHints = answerSeries(start, { count: 8, row: { level: 4, hinted: true } });
  assert.equal(LP.currentLevel(manyHints, 'python'), 3);
  const fewFailures = answerSeries(start, { count: 3, row: { level: 4, correct: false } });
  assert.equal(LP.currentLevel(fewFailures, 'python'), 4);
});

test('오래된 기록·미래 기록으로 현재 추천을 바꾸지 않는다', () => {
  const p = LP.profile({});
  p.recent = Array.from({ length: 12 }, (_, i) => ({ seq: i + 1, track: 'python', level: 1,
    lessonId: 'l' + (i % 2), questionId: 'q' + i, correct: true, hinted: false, day: '2026-08-01' }));
  const state = { learning: p };
  assert.equal(LP.difficulty(state, 'python', { today: '2026-10-03' }).targetLevel, 1);
  p.recent = p.recent.map(row => Object.assign({}, row, { day: '2026-10-04' }));
  assert.equal(LP.recentEvidence(state, 'python', { today: '2026-10-03' }).count, 0);
});

test('시작 수준을 다시 고르면 기존 완료 기록을 지우지 않고 추정만 새로 시작한다', () => {
  const prior = answerSeries({ done: { kept: true } });
  const next = LP.configure(prior, { experience: 'advanced', minutes: 10 });
  assert.equal(LP.currentLevel(next, 'python'), 4);
  assert.equal(next.learning.baselineAfter, next.learning.totalAnswers);
  assert.equal(LP.recentEvidence(next, 'python').count, 0);
  assert.equal(next.done.kept, true);
  assert.equal(LP.currentLevel(LP.configure(prior, { minutes: 30 }), 'python'), 2);
});

test('10·20·30분 계획은 예산 안에서 공부·복습·회상을 나눈다', () => {
  const id = LP.lessonId('python', small.python.units[1], small.python.units[1].lessons[0]);
  for (const minutes of [10, 20, 30]) {
    const state = LP.configure({ done: { [id]: true }, wrongs: [{ due: '2026-10-03' }, { due: '2026-11-03' }] }, { minutes });
    const result = LP.recommendation(state, small, { track: 'python', today: '2026-10-03' });
    assert.equal(result.steps.reduce((n, step) => n + step.minutes, 0), minutes);
    assert.equal(result.review.available, 1);
    assert.equal(result.review.kind, 'due');
    assert.equal(result.lesson.title, '변수와 자료형');
    assert.ok(result.stages.every(stage => stage.unlocked));
  }
});

test('오답이 없어도 쉬운 완료 레슨을 기억해 보는 복습은 남는다', () => {
  const unit = small.python.units[1], lesson = unit.lessons[0];
  const state = LP.configure({ done: { [LP.lessonId('python', unit, lesson)]: true } }, { experience: 'advanced' });
  const result = LP.recommendation(state, small, { track: 'python', today: '2026-10-03' });
  assert.equal(result.review.kind, 'recall');
  assert.equal(result.review.lesson.title, lesson.title);
  assert.equal(result.review.lesson.level, 1);
  assert.ok(result.steps.some(step => step.kind === 'review'));
});

test('모두 완료해도 레슨을 잠그거나 추천을 없애지 않는다', () => {
  const done = {};
  small.python.units.forEach(u => u.lessons.forEach(l => { done[LP.lessonId('python', u, l)] = true; }));
  const lesson = LP.chooseLesson({ done }, small, 'python');
  assert.ok(lesson);
  assert.equal(lesson.review, true);
  assert.equal(lesson.level, 1);
  assert.equal(LP.recommendation({}, {}, {}).lesson, null);
});

test('브라우저에서 파일 하나로 window.LearningPath를 제공한다', () => {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data/learning-path.js'), 'utf8'), sandbox);
  assert.equal(typeof sandbox.LearningPath.recommendation, 'function');
  assert.equal(sandbox.LearningPath.profile({}).experience, 'new');
});

test('실제 38개 트랙 개요로 추천하고 기존 lkey와 같은 완료 ID를 사용한다', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const courses = require('../tools/lib/courses.cjs').readCourses(html).obj;
  const hashStart = html.indexOf('function h32('), hashEnd = html.indexOf('function migrateSkills()', hashStart);
  const actualKey = new Function('COURSES', html.slice(hashStart, hashEnd) + '\nreturn lkey;')(courses);
  for (const track of Object.keys(courses)) {
    const rec = LP.recommendation({}, courses, { track, today: '2026-10-03' });
    assert.ok(rec.lesson, track + '에 추천 레슨이 없음');
    assert.equal(rec.lesson.id, actualKey(track, rec.lesson.ui, rec.lesson.li));
    assert.ok(rec.lesson.level >= 1 && rec.lesson.level <= 5);
    assert.ok(rec.steps.reduce((n, step) => n + step.minutes, 0) <= rec.minutes);
  }
  assert.match(LP.recommendation({}, courses, { track: 'python' }).lesson.title, /출력|변수/);
  for (const goal of ['ai', 'ds', 'data', 'frontend', 'fullstack', 'backend', 'free']) {
    for (const exp of LP.experiences) {
      const state = LP.configure({ goal }, { experience: exp.id });
      const rec = LP.recommendation(state, courses, { today: '2026-10-03' });
      assert.ok(rec.lesson, goal + ':' + exp.id);
      assert.ok(rec.tracks.every(track => courses[track]));
    }
  }
});

test('난이도가 달라져도 중단한 미완료 레슨을 먼저 이어서 추천한다', () => {
  const unit=small.python.units[1],lesson=unit.lessons[0];
  const state=LP.configure({studyResume:{track:'python',id:LP.lessonId('python',unit,lesson),next:2,correct:2}}, {experience:'advanced'});
  assert.equal(LP.recommendation(state,small,{track:'python'}).lesson.title,lesson.title);
  state.done={[LP.lessonId('python',unit,lesson)]:true};
  assert.notEqual(LP.recommendation(state,small,{track:'python'}).lesson.title,lesson.title);
});

test('복습은 가장 오래 전에 확인한 레슨부터 돌아가며 추천한다',()=>{
  const u=small.python.units[1],ids=u.lessons.map(l=>LP.lessonId('python',u,l));
  const state={done:Object.fromEntries(ids.map(id=>[id,true])),lessonChecks:{[ids[0]]:{accuracy:100,seq:20},[ids[1]]:{accuracy:100,seq:10}}};
  assert.equal(LP.recommendation(state,small,{track:'python'}).review.lesson.id,ids[1]);
  state.lessonChecks[ids[1]].seq=30;assert.equal(LP.recommendation(state,small,{track:'python'}).review.lesson.id,ids[0]);
});
test('첫 문제의 작성 중 저장과 완료 레슨의 오답 재연습을 추천한다',()=>{
  const u=small.python.units[1],l=u.lessons[0],id=LP.lessonId('python',u,l);
  assert.equal(LP.recommendation({studyResume:{track:'python',id,next:0,resumeCurrent:true}},small,{track:'python'}).lesson.id,id);
  assert.equal(LP.recommendation({done:{[id]:true},lessonChecks:{[id]:{accuracy:20}}},small,{track:'python'}).lesson.id,id);
});
console.log('\nLearningPath: ' + passed + '개 검증 통과');
