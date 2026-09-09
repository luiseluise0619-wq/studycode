#!/usr/bin/env node
/* 오답이 한 줄로 끝나 정답만 긴 문항을, 오답을 채워 고친다.

   tools/qbalance.cjs 가 기계로 할 수 있는 것(근거 꼬리 옮기기)을 끝낸 뒤에
   남는 것들이다. 여기서부터는 오답을 사람이 써야 한다 — 그럴듯하고, 틀렸고,
   길이가 정답과 비슷한 오답을. 이 도구는 그 왕복을 돕는다.

     내보내기:  node tools/qfix.cjs dump <track> [개수] > 초안.json
     되넣기:    node tools/qfix.cjs apply 초안.json

   초안은 [{ k, q, ok, no:["오답1","오답2","오답3"] }] 꼴이다. no 만 고쳐서
   되넣으면 그 문항의 오답이 바뀐다. 정답 문구와 정답 위치는 건드리지 않는다.
   되넣을 때 확인하는 것
     · 원본에 그 문항(k + 정답 문구)이 그대로 있는가
     · 오답 3개가 서로 다르고 정답과도 다른가
     · 태그 짝이 맞고 보이지 않는 공백이 없는가
     · 고친 뒤 정답이 더는 유일한 최장이 아닌가 (아니면 거절한다) */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const strip = s => String(s || '').replace(/<[^>]*>/g, '').trim();
const INVIS = /[​‌‍﻿  - 　]/;

const MODE = process.argv[2];
const ARG = process.argv[3];
const LIMIT = Number(process.argv[4] || 0);

/* ---------- 파일 읽기: 셸과 청크 ---------- */
function load() {
  const out = [];
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const g = require('./lib/courses.cjs').readCourses(html);   /* 셸 개요는 압축된 꼴 */
  out.push({ kind: 'shell', file: 'index.html', raw: html, pos: g, data: g.obj });
  fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^t-.*\.js$/.test(f)).forEach(f => {
    const raw = fs.readFileSync(path.join(ROOT, 'data', f), 'utf8');
    const mm = raw.match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
    if (!mm) return;
    out.push({ kind: 'chunk', file: 'data/' + f, raw, key: mm[1], json: mm[2], data: JSON.parse(mm[2]) });
  });
  return out;
}
function eachQ(t, fn) {
  if (t.kind === 'shell') {
    for (const k in t.data) (t.data[k].units || []).forEach(u => (u.lessons || []).forEach(l => (l.q || []).forEach(q => fn(q, k, u.title))));
  } else {
    (t.data || []).forEach(u => (u.l || []).forEach(l => (l.q || []).forEach(q => fn(q, t.key, u.t))));
  }
}
function save(t) {
  if (t.kind === 'shell') {
    const L = require('./lib/courses.cjs');
    fs.writeFileSync(path.join(ROOT, 'index.html'), L.writeCourses(t.raw, t.data, t.pos));
    const back = L.readCourses(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')).obj;
    if (JSON.stringify(back) !== JSON.stringify(t.data)) throw new Error('셸 왕복에서 내용이 달라졌다');
  } else {
    const p = path.join(ROOT, t.file);
    fs.writeFileSync(p, "__CR('t:" + t.key + "'," + JSON.stringify(t.data) + ");\n");
    const back = JSON.parse(fs.readFileSync(p, 'utf8').match(/^__CR\('t:[^']+',(.*)\);\s*$/s)[1]);
    if (JSON.stringify(back) !== JSON.stringify(t.data)) throw new Error(t.file + ' 왕복에서 내용이 달라졌다');
  }
}
const biased = q => {
  if ((q.t || 'choice') !== 'choice' || !Array.isArray(q.o) || q.o.length !== 4) return false;
  const L = q.o.map(o => strip(o).length), m = Math.max(...L);
  return L[q.a] === m && L.filter(x => x === m).length === 1;
};

/* ---------- 내보내기 ---------- */
if (MODE === 'dump') {
  if (!ARG) { console.error('트랙을 지정하세요'); process.exit(2); }
  const rows = [];
  load().forEach(t => eachQ(t, (q, trk, unit) => {
    if (trk !== ARG || !biased(q)) return;
    if (LIMIT && rows.length >= LIMIT) return;
    const others = q.o.filter((_, i) => i !== q.a);
    rows.push({ k: q.k || null, unit: unit, q: String(q.q),
      okLen: strip(q.o[q.a]).length, ok: String(q.o[q.a]), no: others.map(String) });
  }));
  console.log(JSON.stringify(rows, null, 1));
  process.exit(0);
}

/* ---------- 되넣기 ---------- */
if (MODE !== 'apply' || !ARG) {
  console.error('사용법: qfix.cjs dump <track> [개수]  |  qfix.cjs apply <초안.json>');
  process.exit(2);
}
const draft = JSON.parse(fs.readFileSync(path.resolve(ARG), 'utf8'));
const targets = load();

let bad = 0;
const say = m => { bad++; console.log('  ✗ ' + m); };

/* 초안 자체 검사 */
const seen = new Set();
draft.forEach((d, i) => {
  const at = '[' + (i + 1) + '] ' + (d.k || String(d.q).slice(0, 26));
  if (!Array.isArray(d.no) || d.no.length !== 3) return say(at + ' 오답이 3개가 아니다');
  const all = [d.ok].concat(d.no).map(strip);
  if (new Set(all).size !== 4) say(at + ' 보기가 겹친다');
  if (all.some(x => !x)) say(at + ' 빈 보기가 있다');
  d.no.forEach((o, j) => {
    if (INVIS.test(o)) say(at + ' 오답' + (j + 1) + ' 에 보이지 않는 공백이 있다');
    ['b', 'code'].forEach(tg => {
      const a = (o.match(new RegExp('<' + tg + '>', 'g')) || []).length;
      const c = (o.match(new RegExp('</' + tg + '>', 'g')) || []).length;
      if (a !== c) say(at + ' 오답' + (j + 1) + ' 의 <' + tg + '> 짝이 안 맞는다');
    });
    if (/<(?!\/?(b|code|i|em)>)/.test(o)) say(at + ' 오답' + (j + 1) + ' 에 허용하지 않는 태그가 있다');
  });
  const L = all.map(x => x.length), m = Math.max(...L);
  if (L[0] === m && L.filter(x => x === m).length === 1)
    say(at + ' 고친 뒤에도 정답이 유일한 최장이다 (' + L[0] + ' 대 ' + L.slice(1).join('/') + ')');
  const key = (d.k || '') + '|' + strip(d.ok);
  if (seen.has(key)) say(at + ' 초안 안에서 같은 문항이 두 번 나온다');
  seen.add(key);
});
if (bad) { console.log('\n' + bad + '건 문제 — 넣지 않았다'); process.exit(1); }

/* 원본에서 찾아 바꾼다 */
const byKey = new Map(draft.map(d => [(d.k || '') + '|' + strip(d.ok), d]));
let hit = 0;
targets.forEach(t => {
  let changed = 0;
  eachQ(t, q => {
    if ((q.t || 'choice') !== 'choice' || !Array.isArray(q.o) || q.o.length !== 4) return;
    const key = (q.k || '') + '|' + strip(q.o[q.a]);
    const d = byKey.get(key);
    if (!d) return;
    byKey.delete(key);
    const out = [];
    let j = 0;
    for (let i = 0; i < 4; i++) out.push(i === q.a ? q.o[q.a] : d.no[j++]);
    q.o = out;
    hit++; changed++;
  });
  t.changed = changed;
});
if (byKey.size) {
  [...byKey.keys()].slice(0, 5).forEach(k => console.log('  ✗ 원본에서 못 찾았다: ' + k.slice(0, 70)));
  console.log('\n' + byKey.size + '건을 못 찾아 아무것도 쓰지 않았다');
  process.exit(1);
}

let files = 0;
targets.forEach(t => { if (t.changed) { save(t); files++; } });
console.log(hit + '문항의 오답을 바꿨다 · 파일 ' + files + '개');
console.log('셸 ' + fs.statSync(path.join(ROOT, 'index.html')).size + '바이트');
