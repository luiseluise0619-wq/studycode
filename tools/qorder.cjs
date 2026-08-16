#!/usr/bin/env node
/* 트랙의 유닛 학습 순서를 데이터에 직접 적는다.

   앱은 기본적으로 유닛 제목의 낱말을 보고 난이도를 짐작해 순서를 정한다(unitDiff).
   그 짐작이 자주 틀린다 — '힙·구간·DP 입문' 이 '입문' 때문에 맨 앞에 오고,
   '고차함수와 함수 합성' 이 '고차' 때문에 맨 뒤로 밀리는 식이다.
   순서를 적어 두면 mergeTrack() 이 그 값을 따른다.

   사용법:  node tools/qorder.cjs <track> <순서파일>
   순서파일은 유닛 제목을 한 줄에 하나씩, 배울 순서대로 적은 텍스트 파일이다.
   (빈 줄과 # 로 시작하는 줄은 무시한다)

   한 트랙이 순서를 적기 시작하면 그 트랙의 모든 유닛이 적어야 한다 —
   일부만 있으면 앱이 통째로 무시하고 짐작으로 돌아간다. 그래서 목록이
   실제 유닛과 정확히 일치하는지 확인하고, 아니면 아무것도 쓰지 않는다. */

const fs = require('fs');
const path = require('path');

const [track, listFile] = process.argv.slice(2);
if (!track || !listFile) {
  console.error('사용법: node tools/qorder.cjs <track> <순서파일>');
  process.exit(2);
}

const p = path.join(__dirname, '..', 'data', 't-' + track + '.js');
const m = fs.readFileSync(p, 'utf8').match(/^__CR\('t:([^']+)',(.*)\);\s*$/s);
if (!m) throw new Error('데이터 파일 형식이 예상과 다르다: ' + p);
const units = JSON.parse(m[2]);

const order = fs.readFileSync(listFile, 'utf8').split('\n')
  .map(s => s.trim()).filter(s => s && s[0] !== '#');

const have = units.map(u => u.t);
const missing = have.filter(t => !order.includes(t));
const extra = order.filter(t => !have.includes(t));
if (new Set(have).size !== have.length) throw new Error('유닛 제목이 중복된다 — 순서를 적을 수 없다');
if (missing.length) throw new Error('순서 목록에 빠진 유닛:\n  ' + missing.join('\n  '));
if (extra.length) throw new Error('목록에만 있고 데이터에 없는 유닛:\n  ' + extra.join('\n  '));
if (new Set(order).size !== order.length) throw new Error('순서 목록에 같은 제목이 두 번 있다');

units.forEach(u => { u.ord = order.indexOf(u.t) + 1; });
fs.writeFileSync(p, "__CR('t:" + m[1] + "'," + JSON.stringify(units) + ");\n");
const back = JSON.parse(fs.readFileSync(p, 'utf8').match(/^__CR\('t:[^']+',(.*)\);\s*$/s)[1]);
if (JSON.stringify(back) !== JSON.stringify(units)) throw new Error('왕복에서 내용이 달라졌다');

console.log(track + ' — 유닛 ' + units.length + '개에 순서를 적었다');
order.forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t));
