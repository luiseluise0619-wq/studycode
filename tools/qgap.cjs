#!/usr/bin/env node
/* 어떤 주제가 앱 어디에 얼마나 있는지 세어 본다.

   새 문항을 어디에 넣을지 정하려면 '이 트랙에 정말 없는 축' 을 찾아야 한다.
   데이터 파일만 세면 틀린다 — 문항의 절반 이상이 셸(index.html)에 있고,
   mergeTrack() 이 둘을 합쳐야 실제 트랙이 되기 때문이다. 그래서 브라우저에서
   앱을 띄우고 모든 트랙을 불러온 뒤 합쳐진 상태에서 센다.

   사용법:
     PATS='{"푸시알림":"푸시 알림|FCM|APNs","딥링크":"딥링크|deep link"}' \
       node tools/qgap.cjs [트랙]

   PATS 는 이름 → 정규식(문자열) 이고, 대소문자는 무시한다.
   트랙을 주면 그 트랙에서 걸린 문항의 유닛·제목까지 같이 보여 준다.
   PLAYWRIGHT_CHROMIUM 으로 크로미움 경로를 지정한다. */

const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const PATS = JSON.parse(process.env.PATS || '{}');
const ONLY = process.argv[2] || null;
if (!Object.keys(PATS).length) {
  console.error("PATS 환경변수에 {\"이름\":\"정규식\"} 을 주세요");
  process.exit(2);
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => typeof COURSES !== 'undefined', { timeout: 60000 });
  const r = await p.evaluate(async (arg) => {
    await Promise.all(Object.keys(COURSES).map(k => ensureTrack(k)));
    const out = {};
    for (const name in arg.pats) {
      const re = new RegExp(arg.pats[name], 'i');
      const per = {}, hits = [];
      for (const k in COURSES) COURSES[k].units.forEach(u => u.lessons.forEach(l => (l.q || []).forEach(q => {
        const s = (q.q || '') + (q.o || []).join(' ') + (q.ex || '') + (q.code || '');
        if (!re.test(s)) return;
        per[k] = (per[k] || 0) + 1;
        if (k === arg.only) hits.push(u.title + ' / ' + (q.k || String(q.q).slice(0, 40)));
      })));
      out[name] = { per, hits };
    }
    return out;
  }, { pats: PATS, only: ONLY });

  for (const name in r) {
    const { per, hits } = r[name];
    const tot = Object.values(per).reduce((a, c) => a + c, 0);
    const mine = ONLY ? (per[ONLY] || 0) : null;
    console.log(name + '  전체 ' + tot + (ONLY ? ' · ' + ONLY + ' ' + mine : ''));
    const rows = Object.entries(per).sort((a, b2) => b2[1] - a[1]);
    if (rows.length) console.log('    ' + rows.map(x => x[0] + ':' + x[1]).join(' '));
    hits.forEach(h => console.log('    ↳ ' + h));
  }
  await b.close();
})();
