#!/usr/bin/env node
/* 선택형 문항에서 '공부 안 해도 찍을 수 있는 단서' 를 센다.

   가장 큰 것은 길이다. 정답을 쓸 때는 근거까지 적고 오답은 한 줄로 끝내는
   습관이 쌓이면, 배우는 사람은 내용을 몰라도 <b>가장 긴 보기</b>를 고르면 된다.
   찍기로 맞힐 수 있는 문제는 실력을 재지 못한다.

   재는 방법을 두 번 고쳤다.
   1) 처음엔 '정답이 단독 최장인 비율' 만 셌다. 그랬더니 오답 하나만 정답보다
      길게 만드는 상환에 속아 0% 가 나왔다 — 정답은 2등이 됐을 뿐이다.
   2) 그래서 길이 순위로 바꿨더니 이번엔 1자 차이까지 순위로 셌다. 사람은
      1자 차이를 못 본다. 기계만 쓸 수 있는 단서를 세는 눈금이었다.

   지금은 '허용오차' 를 두고 잰다. 길이 차이가 허용오차 안쪽이면 눈으로
   구분 못 한다고 보고 한 묶음으로 잇는다. 그렇게 묶은 뒤 '몇 번째로 긴
   묶음에서 찍는다' 는 전략들의 정답률을 재고, 그중 가장 높은 값을 본다.
   그 값이 25% 면 길이는 아무것도 알려 주지 않는다.

   또 하나는 단정어다. '항상·절대·모든 경우' 가 든 보기는 대개 오답이라
   그것만 피해도 확률이 올라간다.

   사용법:  node tools/qbias.cjs [트랙]        (트랙을 주면 표본을 보여 준다)
            SAMPLE=20 node tools/qbias.cjs fp */

const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const ONLY = process.argv[2] || null;
const SAMPLE = Number(process.env.SAMPLE || 6);
const TOLS = [0, 3, 5];   // 허용오차: 이만큼 차이는 눈으로 구분 못 한다고 본다

(async () => {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => typeof COURSES !== 'undefined', { timeout: 60000 });

  const r = await p.evaluate(async (arg) => {
    await Promise.all(Object.keys(COURSES).map(k => ensureTrack(k)));
    const strip = s => String(s || '').replace(/<[^>]*>/g, '').trim();
    const per = {}, samples = [];
    let tot = 0, absol = 0;
    const rank = arg.tols.map(() => [0, 0, 0, 0]);
    for (const k in COURSES) {
      per[k] = { n: 0, rank: arg.tols.map(() => [0, 0, 0, 0]), absol: 0, gapSum: 0 };
      COURSES[k].units.forEach(u => u.lessons.forEach(l => (l.q || []).forEach(q => {
        if ((q.t || 'choice') !== 'choice' || !Array.isArray(q.o) || q.o.length !== 4) return;
        tot++; per[k].n++;
        const lens = q.o.map(o => strip(o).length);
        const others = lens.filter((_, i) => i !== q.a);
        per[k].gapSum += lens[q.a] - (others.reduce((a, c) => a + c, 0) / 3);
        // 길이 차이가 허용오차 안쪽이면 한 묶음. 정답이 몇 번째 묶음에 드는가.
        arg.tols.forEach((tol, ti) => {
          const order = [0, 1, 2, 3].sort((x, y) => lens[y] - lens[x]);
          const g = [[order[0]]];
          for (let i = 1; i < 4; i++) {
            const prev = g[g.length - 1];
            if (lens[prev[prev.length - 1]] - lens[order[i]] <= tol) prev.push(order[i]);
            else g.push([order[i]]);
          }
          g.forEach((grp, gi) => {
            if (grp.indexOf(q.a) >= 0) {
              rank[ti][gi] += 1 / grp.length; per[k].rank[ti][gi] += 1 / grp.length;
            }
          });
        });
        if (k === arg.only && samples.length < arg.sample)
          samples.push({ u: u.title.slice(0, 22), q: strip(q.q).slice(0, 46),
            ok: strip(q.o[q.a]), no: q.o.filter((_, i) => i !== q.a).map(strip) });
        const abs = q.o.map(o => /항상|절대|모든 경우|무조건|반드시/.test(strip(o)));
        if (abs.some(Boolean) && !abs[q.a]) { absol++; per[k].absol++; }
      })));
    }
    return { tot, rank, absol, per, samples };
  }, { only: ONLY, sample: SAMPLE, tols: TOLS });

  const pct = (a, b2) => b2 ? (a / b2 * 100).toFixed(1) : '0.0';
  const REPORT = TOLS.indexOf(5) >= 0 ? TOLS.indexOf(5) : TOLS.length - 1;  // 사람 기준 눈금
  const worst = v => Math.max(...v.rank[REPORT]) / v.n;
  console.log('선택형 ' + r.tot + '문항');
  TOLS.forEach((tol, ti) => {
    const best = Math.max(...r.rank[ti]);
    console.log('  허용오차 ' + String(tol).padStart(2) + '자   ' +
      r.rank[ti].map((x, i) => (i + 1) + '번째 ' + pct(x, r.tot) + '%').join(' · ') +
      '   최대 ' + pct(best, r.tot) + '%' + (tol === 5 ? '  ← 사람이 쓸 수 있는 단서' : ''));
  });
  console.log('  단정어가 오답에만     ' + r.absol + ' (' + pct(r.absol, r.tot) + '%)');
  console.log('\n트랙별 (허용오차 5자 기준 가장 잘 맞는 묶음과 적중률 · 정답이 오답 평균보다 몇 자 긴가)');
  Object.entries(r.per).filter(x => x[1].n).sort((a, b2) => worst(b2[1]) - worst(a[1]))
    .forEach(([k, v]) => {
      const row = v.rank[REPORT], top = row.indexOf(Math.max(...row));
      console.log('  ' + k.padEnd(11) + String(v.n).padStart(5) + '문항  ' + (top + 1) + '번째 ' +
        (pct(row[top], v.n) + '%').padStart(6) + '  +' + (v.gapSum / v.n).toFixed(0) + '자');
    });

  if (r.samples.length) {
    console.log('\n' + ONLY + ' 표본');
    r.samples.forEach(s => {
      console.log('\n  ' + s.u + ' — ' + s.q);
      console.log('   ✅(' + s.ok.length + ') ' + s.ok.slice(0, 110));
      s.no.forEach(o => console.log('   ✗ (' + o.length + ') ' + o.slice(0, 110)));
    });
  }
  await b.close();
})();
