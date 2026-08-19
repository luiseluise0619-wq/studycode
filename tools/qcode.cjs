#!/usr/bin/env node
/* 실행형(js) 문항 묶음을 데이터에 넣기 전에 검사한다.

   앱의 채점기(testDoc)가 하는 일을 그대로 흉내 내서, 넣기 전에 확인한다.
     · 모범 답안이 테스트와 엣지를 전부 통과하는가
     · 시작 코드는 통과하지 못하는가 (통과하면 문제가 성립하지 않는다)
     · 품질 검사를 만족하는가 (var 안 쓰기 · 28줄 이하 · 디버그 로그 없음)
   그리고 모범 답안이 데이터에 섞여 들어가지 않았는지도 본다.

   사용법:  QSRC=./mybatch.cjs node tools/qcode.cjs
   대상 파일은 module.exports = { TH, Q, SOL } 을 내보내야 한다.
   SOL[i] 는 Q[i] 의 모범 답안 소스이고, 데이터에는 들어가지 않는다. */

const path = require('path');
const fs = require('fs');

const src = process.env.QSRC || process.argv[2];
if (!src) { console.error('QSRC 환경변수나 인자로 문항 파일을 지정하세요'); process.exit(2); }
const { TH, Q, SOL } = require(path.resolve(src));

const DATA = path.join(__dirname, '..', 'data');
const strip = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ');

let bad = 0;
const say = m => { bad++; console.log('  ✗ ' + m); };

if (!TH || !TH.sum || !Array.isArray(TH.body) || TH.body.length < 2 || !TH.code || !TH.code.c ||
    !Array.isArray(TH.key) || !TH.key.length) say('이론 구조가 규칙에 안 맞는다 (sum·body 2절 이상·code·key)');
(TH && TH.body || []).forEach((b, i) => {
  const n = strip(b.t).length;
  if (n > 400) say('이론 ' + (i + 1) + '번째 절이 400자를 넘는다 (' + n + ')');
});

if (!Array.isArray(SOL) || SOL.length !== Q.length) { say('SOL 이 문항 수와 맞지 않는다'); }

/* testDoc 과 같은 방식으로 한 문항을 채점한다 */
function grade(code, q) {
  const out = { pass: 0, total: (q.tests || []).length, epass: 0, etotal: (q.edge || []).length, err: null };
  const run = (t) => {
    // 사용자 코드를 앞에 붙이고 식을 평가한다 — 앱과 같은 구조
    const fn = new Function(code + '\nreturn (function(){ return eval(' + JSON.stringify(t) + '); })();');
    return fn();
  };
  const eq = (a, b) => { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return String(a) === String(b); } };
  const exp = (s) => new Function('return (' + s + ');')();
  (q.tests || []).forEach(t => {
    let got; try { got = run(t.in); } catch (e) { got = '[에러] ' + e.message; }
    let want; try { want = exp(t.out); } catch (e) { want = Symbol('bad-out'); }
    if (eq(got, want)) out.pass++; else out.err = out.err || (t.in + ' → ' + JSON.stringify(got) + ' (기대 ' + t.out + ')');
  });
  (q.edge || []).forEach(t => {
    let got; try { got = run(t.in); } catch (e) { got = '[에러] ' + e.message; }
    let want; try { want = exp(t.out); } catch (e) { want = Symbol('bad-out'); }
    if (eq(got, want)) out.epass++; else out.err = out.err || ('엣지 ' + t.in + ' → ' + JSON.stringify(got) + ' (기대 ' + t.out + ')');
  });
  out.gate = out.total > 0 && out.pass === out.total && out.epass === out.etotal;
  return out;
}

function quality(code) {
  const lines = code.split('\n').filter(l => l.trim() && !/^\s*\/\//.test(l)).length;
  return { noVar: !/\bvar\s/.test(code), short: lines <= 28, lines, noLog: !/console\.(log|debug)/.test(code) };
}

Q.forEach((q, i) => {
  const at = '[' + (i + 1) + '] ' + (q.k || '');
  if (q.t !== 'code') say(at + " 유형이 code 가 아니다");
  if (q.run !== 'js') say(at + ' run 이 js 가 아니다');
  if (!q.src || !/TODO|\/\/ *여기/.test(q.src)) say(at + ' 시작 코드에 빈칸 표시가 없다');
  if (!Array.isArray(q.tests) || q.tests.length < 3) say(at + ' 테스트가 3개 미만');
  if (!Array.isArray(q.edge) || !q.edge.length) say(at + ' 엣지 케이스가 없다');
  if (!q.ex || q.ex.length < 80) say(at + ' 해설이 너무 짧다');
  if (!q.q || strip(q.q).length < 20) say(at + ' 질문이 너무 짧다');
  if (q.sol || q.answer) say(at + ' 모범 답안이 문항에 들어 있다 — 데이터로 새어 나간다');

  const sol = SOL && SOL[i];
  if (!sol) { say(at + ' 모범 답안이 없다'); return; }
  const g = grade(sol, q);
  if (!g.gate) say(at + ' 모범 답안이 통과하지 못한다: ' + g.err);
  const qu = quality(sol);
  if (!qu.noVar) say(at + ' 모범 답안이 var 를 쓴다');
  if (!qu.short) say(at + ' 모범 답안이 28줄을 넘는다 (' + qu.lines + ')');
  if (!qu.noLog) say(at + ' 모범 답안에 디버그 로그가 있다');

  const s = grade(q.src, q);
  if (s.gate) say(at + ' 시작 코드가 그대로 통과한다 — 문제가 성립하지 않는다');
});

/* 기존 문항과 겹치지 않는지 */
const seenQ = new Set(), seenK = new Set();
fs.readdirSync(DATA).filter(f => /^t-.*\.js$/.test(f)).forEach(f => {
  const m = fs.readFileSync(path.join(DATA, f), 'utf8').match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
  if (!m) return;
  JSON.parse(m[2]).forEach(u => u.l.forEach(l => (l.q || []).forEach(x => {
    seenQ.add(strip(x.q).replace(/\s+/g, ' ').trim());
    if (x.k) seenK.add(x.k);
  })));
});
Q.forEach((q, i) => {
  if (seenQ.has(strip(q.q).replace(/\s+/g, ' ').trim())) say('[' + (i + 1) + '] 기존 문항과 질문이 같다');
  if (seenK.has(q.k)) say('[' + (i + 1) + '] 이미 쓰인 제목(k) 이다: ' + q.k);
});
if (new Set(Q.map(q => q.k)).size !== Q.length) say('문항 제목(k)이 중복된다');

console.log('\n실행형 ' + Q.length + '문항 · 테스트 평균 ' +
  (Q.reduce((s, q) => s + (q.tests || []).length, 0) / Q.length).toFixed(1) + '개 · 해설 평균 ' +
  Math.round(Q.reduce((s, q) => s + q.ex.length, 0) / Q.length) + '자');
console.log(bad ? bad + '건 문제' : '검사 통과');
process.exit(bad ? 1 : 0);
