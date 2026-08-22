#!/usr/bin/env node
/* 정답 보기에 붙은 '근거 꼬리' 를 해설로 옮긴다.

   정답이 가장 긴 보기이면 내용을 몰라도 찍을 수 있다(tools/qbias.cjs 참고).
   가장 흔한 모양은 이렇다.

     ✅ 락을 걸지 않는다 — 낙관적 잠금은 충돌이 드물 때 더 빠르다
     ✗  락을 건다
     ✗  트랜잭션을 나눈다

   앞의 '락을 걸지 않는다' 만으로 답으로 충분하고, 뒤는 근거다. 근거를 해설로
   옮기면 내용은 하나도 안 사라지면서(답을 낸 뒤에 보인다) 길이 단서만 없어진다.

   손대지 않는 경우
     · 구분자가 없거나 앞쪽이 너무 짧아 답으로 성립하지 않을 때
     · 오답에도 같은 구분자가 있을 때 (문항 전체의 서술 방식이다)
     · 잘라도 여전히 정답이 가장 길 때 — 그건 오답을 채워야 하는 문항이라
       기계로 못 고친다. 세어서 알려만 준다.

   사용법:  node tools/qbalance.cjs            무엇이 바뀌는지만 본다
            node tools/qbalance.cjs --write    실제로 고친다
            node tools/qbalance.cjs <track>    한 트랙만 자세히 */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const ARG = process.argv[2] || null;
const WRITE = ARG === '--write';
const ONLY = WRITE ? null : ARG;

const strip = s => String(s || '').replace(/<[^>]*>/g, '').trim();
const SEP = /\s+—\s+/;

/* 정답에서 근거 꼬리를 떼어낼 수 있으면 [머리, 꼬리] 를, 아니면 null */
function split(q) {
  if ((q.t || 'choice') !== 'choice') return null;
  if (!Array.isArray(q.o) || q.o.length !== 4) return null;
  if (!(q.a >= 0 && q.a < 4)) return null;
  const lens = q.o.map(o => strip(o).length);
  const max = Math.max(...lens);
  /* 정답이 유일한 최장이 아니면 단서가 아니다 */
  if (!(lens[q.a] === max && lens.filter(x => x === max).length === 1)) return null;

  const ok = String(q.o[q.a]);
  if (!SEP.test(ok)) return null;
  /* 오답에도 같은 구분자가 있으면 그것이 이 문항의 서술 방식이다 */
  if (q.o.some((o, i) => i !== q.a && SEP.test(String(o)))) return null;

  const at = ok.search(SEP);
  const head = ok.slice(0, at).trim();
  const tail = ok.slice(at).replace(SEP, '').trim();
  if (strip(head).length < 6 || strip(tail).length < 8) return null;
  /* 태그가 머리와 꼬리에 걸쳐 있으면 자르면 깨진다 */
  for (const t of ['b', 'code', 'i', 'em']) {
    const o = (head.match(new RegExp('<' + t + '>', 'g')) || []).length;
    const c = (head.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) return null;
  }
  const maxOther = Math.max(...lens.filter((_, i) => i !== q.a));
  return { head, tail, fixed: strip(head).length <= maxOther, maxOther };
}

function apply(q) {
  const s = split(q);
  if (!s || !s.fixed) return false;
  q.o = q.o.slice();
  q.o[s.a === undefined ? q.a : q.a] = s.head;
  const add = '\n✅ 왜 그 답인가: ' + s.tail;
  q.ex = String(q.ex || '') + add;
  return true;
}

/* ---------- 대상 파일: 셸과 데이터 청크 둘 다 ---------- */
const targets = [];
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/^const COURSES = (\{.*\});$/m);
  if (!m) throw new Error('셸에서 COURSES 를 못 찾았다');
  targets.push({ kind: 'shell', file: 'index.html', raw: html, json: m[1], data: JSON.parse(m[1]) });
}
fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^t-.*\.js$/.test(f)).forEach(f => {
  const raw = fs.readFileSync(path.join(ROOT, 'data', f), 'utf8');
  const m = raw.match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
  if (!m) return;
  targets.push({ kind: 'chunk', file: 'data/' + f, raw, key: m[1], json: m[2], data: JSON.parse(m[2]) });
});

/* 셸과 청크의 문항 구조가 다르다 — 셸은 {units:[{lessons:[{q:[]}]}]}, 청크는 [{l:[{q:[]}]}] */
function eachQ(t, fn) {
  if (t.kind === 'shell') {
    for (const k in t.data) (t.data[k].units || []).forEach(u => (u.lessons || []).forEach(l => (l.q || []).forEach(q => fn(q, k, u.title))));
  } else {
    (t.data || []).forEach(u => (u.l || []).forEach(l => (l.q || []).forEach(q => fn(q, t.key, u.t))));
  }
}

const stat = {};
const samples = [];
let total = 0, biased = 0, moved = 0, cantFix = 0;

targets.forEach(t => {
  let changed = 0;
  eachQ(t, (q, trk, unit) => {
    if ((q.t || 'choice') !== 'choice' || !Array.isArray(q.o) || q.o.length !== 4) return;
    total++;
    const lens = q.o.map(o => strip(o).length), max = Math.max(...lens);
    const isLongest = lens[q.a] === max && lens.filter(x => x === max).length === 1;
    if (!isLongest) return;
    biased++;
    stat[trk] = stat[trk] || { biased: 0, moved: 0 };
    stat[trk].biased++;
    const s = split(q);
    if (!s || !s.fixed) { cantFix++; return; }
    if (ONLY === trk && samples.length < 6)
      samples.push({ unit, before: strip(q.o[q.a]), after: strip(s.head), tail: strip(s.tail), maxOther: s.maxOther });
    q.o = q.o.slice();
    q.o[q.a] = s.head;
    q.ex = String(q.ex || '') + '\n✅ 왜 그 답인가: ' + s.tail;
    moved++; changed++; stat[trk].moved++;
  });
  t.changed = changed;
});

const pct = (a, b) => b ? (a / b * 100).toFixed(1) : '0.0';
console.log('선택형 ' + total + '문항 · 정답이 최장 ' + biased + ' (' + pct(biased, total) + '%)');
console.log('  근거 꼬리를 옮겨 고칠 수 있는 것  ' + moved);
console.log('  오답을 채워야 하는 것(기계로 불가) ' + cantFix);
console.log('  고친 뒤 예상 비율 ' + pct(biased - moved, total) + '%');

const rows = Object.entries(stat).filter(x => x[1].moved).sort((a, b) => b[1].moved - a[1].moved);
if (rows.length) {
  console.log('\n트랙별로 옮길 수 있는 수');
  rows.forEach(([k, v]) => console.log('  ' + k.padEnd(11) + v.moved + ' / ' + v.biased));
}
samples.forEach(s => {
  console.log('\n  ' + s.unit);
  console.log('   전 (' + s.before.length + ') ' + s.before.slice(0, 120));
  console.log('   후 (' + s.after.length + ') ' + s.after + '   (가장 긴 오답 ' + s.maxOther + '자)');
  console.log('   해설로 → ' + s.tail.slice(0, 90));
});

if (!WRITE) { console.log('\n(--write 를 주면 실제로 고칩니다)'); return; }

let files = 0;
targets.forEach(t => {
  if (!t.changed) return;
  files++;
  if (t.kind === 'shell') {
    const out = t.raw.replace(t.json, JSON.stringify(t.data));
    fs.writeFileSync(path.join(ROOT, 'index.html'), out);
    const back = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/^const COURSES = (\{.*\});$/m)[1];
    if (JSON.stringify(JSON.parse(back)) !== JSON.stringify(t.data)) throw new Error('셸 왕복에서 내용이 달라졌다');
  } else {
    const p = path.join(ROOT, t.file);
    fs.writeFileSync(p, "__CR('t:" + t.key + "'," + JSON.stringify(t.data) + ");\n");
    const back = JSON.parse(fs.readFileSync(p, 'utf8').match(/^__CR\('t:[^']+',(.*)\);\s*$/s)[1]);
    if (JSON.stringify(back) !== JSON.stringify(t.data)) throw new Error(t.file + ' 왕복에서 내용이 달라졌다');
  }
});
const size = fs.statSync(path.join(ROOT, 'index.html')).size;
console.log('\n파일 ' + files + '개를 고쳤다 · 셸 ' + size + '바이트 (한도까지 ' + (614400 - size) + ')');
