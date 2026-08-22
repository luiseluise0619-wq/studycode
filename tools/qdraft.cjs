#!/usr/bin/env node
/* qfix 초안을 사람이 읽고 쓰기 좋은 최소 형태로 뽑는다.
   한 줄에 하나씩: 필요 길이 · 정답 · 지금 오답. 질문은 짧게 자른다. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const T = process.argv[2], N = process.argv[3] || '', SKIP = Number(process.argv[4] || 0);
const out = cp.execSync('node ' + path.join(__dirname, 'qfix.cjs') + ' dump ' + T, { maxBuffer: 1 << 28 }).toString();
let rows = JSON.parse(out).slice(SKIP);
if (N) rows = rows.slice(0, Number(N));
const s = x => String(x).replace(/<[^>]*>/g, '').trim();
rows.forEach((r, i) => {
  console.log('\n#' + (i + SKIP) + ' [' + r.k + '] 목표 ' + r.okLen + '자  · ' + r.unit.slice(0, 20));
  console.log('  Q ' + s(r.q).slice(0, 90));
  console.log('  ✅ ' + s(r.ok));
  r.no.forEach(o => console.log('  ✗  (' + s(o).length + ') ' + s(o)));
});
console.log('\n총 ' + rows.length + '개');
