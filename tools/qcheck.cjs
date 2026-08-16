#!/usr/bin/env node
/* 선택형 문항 묶음을 데이터에 넣기 전에 검사한다.
   앱 테스트가 잡아 주는 것들을 미리, 훨씬 빠르게 확인하기 위한 도구다.

   사용법:  QSRC=./mybatch.cjs node tools/qcheck.cjs
   대상 파일은 module.exports = { TH, Q } 를 내보내야 한다. */

const path = require('path');
const fs = require('fs');

const src = process.env.QSRC || process.argv[2];
if (!src) { console.error('QSRC 환경변수나 인자로 문항 파일을 지정하세요'); process.exit(2); }
const { TH, Q } = require(path.resolve(src));

const DATA = path.join(__dirname, '..', 'data');
const VALID_CAT = new Set([null, 'debug', 'review', 'perf', 'design', 'ops', 'interview',
  'internals', 'logs', 'security', 'predict', 'knowledge', 'impl']);
/* 눈에 안 보이는데 붙어 있으면 검색·중복 판정을 어긋나게 만드는 문자들 */
const INVIS = /[​‌‍﻿  - 　]/;
const strip = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ');

let bad = 0;
const say = m => { bad++; console.log('  ✗ ' + m); };

if (!TH || !TH.sum || !Array.isArray(TH.body) || TH.body.length < 2 || !TH.code || !TH.code.c ||
    !Array.isArray(TH.key) || !TH.key.length) say('이론 구조가 규칙에 안 맞는다 (sum·body 2절 이상·code·key)');
(TH && TH.body || []).forEach((b, i) => {
  const n = strip(b.t).length;
  if (n > 400) say('이론 ' + (i + 1) + '번째 절이 400자를 넘는다 (' + n + ')');
});

const pos = [0, 0, 0, 0], cats = {};
Q.forEach((q, i) => {
  const at = '[' + (i + 1) + '] ' + (q.k || '');
  if ((q.t || 'choice') !== 'choice') say(at + ' 유형이 choice 가 아니다');
  if (!Array.isArray(q.o) || q.o.length !== 4) say(at + ' 보기가 4개가 아니다');
  else {
    if (new Set(q.o.map(String)).size !== 4) say(at + ' 보기가 중복된다');
    const norm = q.o.map(x => strip(x).replace(/\s+/g, ' ').trim());
    if (new Set(norm).size !== 4) say(at + ' 태그를 벗기면 보기가 중복된다');
  }
  if (!(q.a >= 0 && q.a < 4)) say(at + ' 정답 인덱스가 범위 밖'); else pos[q.a]++;
  const c = q.cat === undefined ? null : q.cat;
  if (!VALID_CAT.has(c)) say(at + ' cat 값이 앱이 아는 목록에 없다: ' + c);
  cats[String(c)] = (cats[String(c)] || 0) + 1;
  if (!q.ex || q.ex.length < 80) say(at + ' 해설이 너무 짧다');
  if (!q.code) say(at + ' 코드 조각이 없다');
  if (!q.q || strip(q.q).length < 20) say(at + ' 질문이 너무 짧다');
  /* 보기를 섞으면 뜻이 깨지는 표현 */
  if ((q.o || []).some(o => /위\s*(모두|전부)|정답\s*없|[①-④]|[^0-9][1-4]\s*번/.test(strip(o))))
    say(at + ' 자리를 전제하는 보기가 있다');

  const all = q.q + (q.o || []).join('') + q.ex + q.code;
  if (INVIS.test(all)) say(at + ' 보이지 않는 공백 문자가 있다');
  ['b', 'code'].forEach(tag => {
    const open = (all.match(new RegExp('<' + tag + '>', 'g')) || []).length;
    const close = (all.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    if (open !== close) say(at + ' <' + tag + '> 태그 짝이 안 맞는다 (' + open + '/' + close + ')');
  });
  const bare = (q.q + (q.o || []).join('') + q.ex).replace(/<\/?(b|code|i|em)>/g, '');
  if (/<[a-zA-Z/]/.test(bare)) say(at + ' 허용하지 않는 태그가 있다');
  if (/&(?!amp;|lt;|gt;|quot;|#)/.test(bare)) say(at + ' 이스케이프하지 않은 & 가 있다');
});

/* 기존 문항과 질문이 같으면 두 번 나온다 */
const seen = new Set();
fs.readdirSync(DATA).filter(f => /^t-.*\.js$/.test(f)).forEach(f => {
  const m = fs.readFileSync(path.join(DATA, f), 'utf8').match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
  if (!m) return;
  JSON.parse(m[2]).forEach(u => u.l.forEach(l => (l.q || []).forEach(x => {
    seen.add(strip(x.q).replace(/\s+/g, ' ').trim());
  })));
});
Q.forEach((q, i) => {
  if (seen.has(strip(q.q).replace(/\s+/g, ' ').trim())) say('[' + (i + 1) + '] 기존 문항과 질문이 같다');
});
if (new Set(Q.map(q => q.k)).size !== Q.length) say('문항 제목(k)이 중복된다');

console.log('\n문항 ' + Q.length + '개 · 정답 위치 ' + pos.join('/') + ' · cat ' + JSON.stringify(cats) +
  ' · 해설 평균 ' + Math.round(Q.reduce((s, q) => s + q.ex.length, 0) / Q.length) + '자');
console.log(bad ? bad + '건 문제' : '검사 통과');
process.exit(bad ? 1 : 0);
