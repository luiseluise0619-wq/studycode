#!/usr/bin/env node
/* 답안 초안의 길이만 먼저 재 본다 — 되넣기 전에.

   tools/qpad.cjs apply 도 같은 검사를 하지만, 이 도구는 파일을 건드리지
   않고 블록마다 '가장 긴 오답 / 목표 / 모자란 글자 수' 만 찍는다. 초안을
   손보는 동안 여러 번 돌리기 위한 것이다.

     node tools/qlen.cjs <track> <답안.txt>          모자란 것만
     node tools/qlen.cjs <track> <답안.txt> --all    전부 */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const strip = s => String(s || '').replace(/<[^>]*>/g, '').trim();

const TRACK = process.argv[2], FILE = process.argv[3];
const ALL = process.argv.includes('--all');
if (!TRACK || !FILE) { console.error('사용법: qlen.cjs <track> <답안.txt> [--all]'); process.exit(2); }

const idxFile = path.join(ROOT, '.pad', TRACK + '.json');
if (!fs.existsSync(idxFile)) { console.error('먼저 qpad.cjs dump 를 돌리세요'); process.exit(2); }
const all = JSON.parse(fs.readFileSync(idxFile, 'utf8'));

const blocks = [];
let cur = null;
fs.readFileSync(path.resolve(FILE), 'utf8').split('\n').forEach(line => {
  const m = line.match(/^#(\d+)\s*$/);
  if (m) { cur = { i: Number(m[1]), no: [] }; blocks.push(cur); return; }
  if (cur && line.trim()) cur.no.push(line.trim());
});

let bad = 0;
blocks.forEach(b => {
  const r = all[b.i];
  if (!r) { console.log('  ✗ #' + b.i + ' 없는 번호'); bad++; return; }
  if (b.no.length !== 3) { console.log('  ✗ #' + b.i + ' 오답이 ' + b.no.length + '줄'); bad++; return; }
  const need = strip(r.ok).length;
  const got = Math.max(...b.no.map(o => strip(o).length));
  if (got < need) { console.log('  ✗ #' + b.i + ' ' + got + ' / ' + need + '  (' + (need - got) + '자 더)'); bad++; }
  else if (ALL) console.log('  · #' + b.i + ' ' + got + ' / ' + need);
});
console.log(blocks.length + '블록 중 ' + bad + '건 모자람');
process.exit(bad ? 1 : 0);
