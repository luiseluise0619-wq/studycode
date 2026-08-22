#!/usr/bin/env node
/* 선택형 문항에서 '공부 안 해도 찍을 수 있는 단서' 를 센다.

   가장 큰 것은 길이다. 정답을 쓸 때는 근거까지 적고 오답은 한 줄로 끝내는
   습관이 쌓이면, 배우는 사람은 내용을 몰라도 <b>가장 긴 보기</b>를 고르면 된다.
   찍기로 맞힐 수 있는 문제는 실력을 재지 못한다.

   또 하나는 단정어다. '항상·절대·모든 경우' 가 든 보기는 대개 오답이라
   그것만 피해도 확률이 올라간다.

   사용법:  node tools/qbias.cjs [트랙]        (트랙을 주면 표본을 보여 준다)
            SAMPLE=20 node tools/qbias.cjs fp */

const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const ONLY = process.argv[2] || null;
const SAMPLE = Number(process.env.SAMPLE || 6);

(async () => {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => typeof COURSES !== 'undefined', { timeout: 60000 });

  const r = await p.evaluate(async (arg) => {
    await Promise.all(Object.keys(COURSES).map(k => ensureTrack(k)));
    const strip = s => String(s || '').replace(/<[^>]*>/g, '').trim();
    const per = {}, samples = [];
    let tot = 0, longest = 0, absol = 0;
    for (const k in COURSES) {
      per[k] = { n: 0, longest: 0, absol: 0, gapSum: 0 };
      COURSES[k].units.forEach(u => u.lessons.forEach(l => (l.q || []).forEach(q => {
        if ((q.t || 'choice') !== 'choice' || !Array.isArray(q.o) || q.o.length !== 4) return;
        tot++; per[k].n++;
        const lens = q.o.map(o => strip(o).length);
        const max = Math.max(...lens);
        const others = lens.filter((_, i) => i !== q.a);
        per[k].gapSum += lens[q.a] - (others.reduce((a, c) => a + c, 0) / 3);
        if (lens[q.a] === max && lens.filter(x => x === max).length === 1) {
          longest++; per[k].longest++;
          if (k === arg.only && samples.length < arg.sample)
            samples.push({ u: u.title.slice(0, 22), q: strip(q.q).slice(0, 46),
              ok: strip(q.o[q.a]), no: q.o.filter((_, i) => i !== q.a).map(strip) });
        }
        const abs = q.o.map(o => /항상|절대|모든 경우|무조건|반드시/.test(strip(o)));
        if (abs.some(Boolean) && !abs[q.a]) { absol++; per[k].absol++; }
      })));
    }
    return { tot, longest, absol, per, samples };
  }, { only: ONLY, sample: SAMPLE });

  const pct = (a, b2) => b2 ? (a / b2 * 100).toFixed(1) : '0.0';
  console.log('선택형 ' + r.tot + '문항');
  console.log('  정답이 가장 긴 보기   ' + r.longest + ' (' + pct(r.longest, r.tot) + '%) — 찍어서 맞을 확률의 기준선은 25%');
  console.log('  단정어가 오답에만     ' + r.absol + ' (' + pct(r.absol, r.tot) + '%)');
  console.log('\n트랙별 (정답이 가장 긴 비율 · 정답이 오답 평균보다 몇 자 긴가)');
  Object.entries(r.per).filter(x => x[1].n).sort((a, b2) => (b2[1].longest / b2[1].n) - (a[1].longest / a[1].n))
    .forEach(([k, v]) => console.log('  ' + k.padEnd(11) + String(v.n).padStart(5) + '문항  ' +
      (pct(v.longest, v.n) + '%').padStart(6) + '  +' + (v.gapSum / v.n).toFixed(0) + '자'));

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
