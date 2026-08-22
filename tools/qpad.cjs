#!/usr/bin/env node
/* 정답만 긴 문항의 오답을 다시 쓰기 위한 좁은 왕복 도구.

   tools/qfix.cjs 와 하는 일은 같지만, 주고받는 글자 수를 줄였다. 한 번에
   수십 문항씩 손보려면 JSON 을 통째로 오가는 것이 너무 무겁다.

     내보내기:  node tools/qpad.cjs dump <track> [개수] [건너뛸수]
                → 화면에 읽기 좋은 목록, 옆에 .pad/<track>.json 에 원본 색인

     되넣기:    node tools/qpad.cjs apply <track> <답안.txt>
                답안.txt 는 이런 꼴이다
                  #3
                  오답 첫째 줄
                  오답 둘째 줄
                  오답 셋째 줄
                  #7
                  ...
                색인 번호는 dump 가 찍어 준 번호다. 빠뜨린 번호는 그냥 안 고친다.

   되넣을 때는 qfix.cjs 와 똑같은 검사를 통과해야 한다 — 겹치지 않을 것,
   태그 짝이 맞을 것, 고친 뒤 정답이 유일한 최장이 아닐 것. */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const PAD = path.join(ROOT, '.pad');
const strip = s => String(s || '').replace(/<[^>]*>/g, '').trim();

const MODE = process.argv[2], TRACK = process.argv[3];
if (!MODE || !TRACK) {
  console.error('사용법: qpad.cjs dump <track> [개수] [건너뛸수]  |  qpad.cjs apply <track> <답안.txt>');
  process.exit(2);
}
const dumpAll = () => JSON.parse(
  cp.execSync('node ' + path.join(__dirname, 'qfix.cjs') + ' dump ' + TRACK, { maxBuffer: 1 << 28 }).toString());

if (MODE === 'dump') {
  const N = Number(process.argv[4] || 0), SKIP = Number(process.argv[5] || 0);
  const all = dumpAll();
  fs.mkdirSync(PAD, { recursive: true });
  fs.writeFileSync(path.join(PAD, TRACK + '.json'), JSON.stringify(all));
  const slice = all.map((r, i) => ({ r, i })).slice(SKIP, N ? SKIP + N : undefined);
  console.log('# ' + TRACK + ' 편향 ' + all.length + '문항 중 ' + slice.length + '개 (' + SKIP + '번부터)');
  let unit = null;
  slice.forEach(({ r, i }) => {
    if (r.unit !== unit) { unit = r.unit; console.log('\n=== ' + unit); }
    const no = r.no.map(o => strip(o).length);
    console.log('#' + i + ' 목표' + (r.okLen + 1) + '자  ' + strip(r.q).replace(/\s+/g, ' ').slice(0, 150));
    console.log('  ✅ ' + strip(r.ok));
    r.no.forEach((o, j) => console.log('  ✗' + (j + 1) + '(' + no[j] + ') ' + strip(o)));
  });
  process.exit(0);
}

if (MODE !== 'apply') { console.error('dump 또는 apply'); process.exit(2); }
const idxFile = path.join(PAD, TRACK + '.json');
if (!fs.existsSync(idxFile)) { console.error('먼저 dump 를 돌리세요'); process.exit(2); }
const all = JSON.parse(fs.readFileSync(idxFile, 'utf8'));
const txt = fs.readFileSync(path.resolve(process.argv[4]), 'utf8').split('\n');

const draft = [];
let cur = null;
txt.forEach(line => {
  const m = line.match(/^#(\d+)\s*$/);
  if (m) {
    const i = Number(m[1]);
    if (!all[i]) throw new Error('없는 번호: #' + i);
    cur = { i, no: [] };
    draft.push(cur);
    return;
  }
  if (!cur) return;
  const s = line.trim();
  if (!s) return;
  if (cur.no.length >= 3) throw new Error('#' + cur.i + ' 에 오답이 4줄 이상이다');
  cur.no.push(s);
});
const rows = draft.map(d => {
  if (d.no.length !== 3) throw new Error('#' + d.i + ' 오답이 ' + d.no.length + '줄이다');
  const r = all[d.i];
  return { k: r.k, q: r.q, ok: r.ok, no: d.no };
});
if (!rows.length) { console.error('빈 답안'); process.exit(2); }

/* 넣기 전에 길이부터 스스로 본다 — 어느 것이 모자란지 한 번에 보여 준다 */
const short = rows.map((r, n) => {
  const need = strip(r.ok).length, got = Math.max(...r.no.map(o => strip(o).length));
  return got >= need ? null : '#' + draft[n].i + ' 가장 긴 오답 ' + got + '자 < 정답 ' + need + '자 (' + (need - got + 1) + '자 더)';
}).filter(Boolean);
if (short.length) { short.forEach(s => console.log('  ✗ ' + s)); console.log('\n' + short.length + '건 짧다 — 넣지 않았다'); process.exit(1); }

const tmp = path.join(PAD, TRACK + '-apply.json');
fs.writeFileSync(tmp, JSON.stringify(rows));
try {
  console.log(cp.execSync('node ' + path.join(__dirname, 'qfix.cjs') + ' apply ' + tmp, { maxBuffer: 1 << 28 }).toString().trim());
} catch (e) {
  console.log(String(e.stdout || '') + String(e.stderr || ''));
  process.exit(1);
}
