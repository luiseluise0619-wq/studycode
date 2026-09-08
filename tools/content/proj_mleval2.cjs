/* mleval 두 번째 프로젝트 — 첫 프로젝트('정확도 98% 인데 쓸모가 없다')가
   지표를 고르는 일을 다루므로, 이쪽은 그 다음 문제를 다룬다:
   지표를 제대로 골랐는데도 오프라인 성적과 실제 결과가 어긋나는 상황. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

{
  lv: 4, em: "🔬",
  title: "오프라인에서 이겼는데 실제로는 졌다",
  desc: "검증 성적이 좋았던 모델이 실서비스에서 지는 이유를 되먹임·시점 누출·선택 편향에서 찾고, 온라인 실험으로 판정하는 절차를 만든다",
  skills: ["mleval", "ml", "stat"],
  phases: [

  { t: "두 숫자를 나란히 적는다", type: "note",
    goal: "오프라인 성적과 <b>실제로 관측한 결과</b>를 나란히 적으세요.\n같은 것을 재고 있는지부터 확인해야 합니다.",
    ph: "예: 오프라인 AUC 0.79 → 0.86 (신모델 우세) · 온라인 클릭률 3.1% → 2.9% (신모델 열세) · 실험 기간 10일 · 트래픽 50:50 · 오프라인은 지난달 로그로 평가 · 온라인 지표는 클릭률" },

  { t: "왜 어긋날 수 있는가", type: "decide",
    goal: "오프라인에서 확실히 이겼는데 온라인에서 졌습니다.",
    sit: "무엇을 먼저 의심하시겠습니까?",
    opts: [
      { label: "평가에 쓴 로그가 옛 모델이 고른 것만 담고 있다 — 신모델이 고를 것을 평가할 수 없었다",
        fx: { algorithms: 3, communication: 1 },
        fb: "✅ <b>로그는 지금 돌고 있는 모델이 만든 것</b>입니다. 옛 모델이 보여 준 것에만 클릭 기록이 있으므로, 신모델이 새로 밀어 올릴 항목에는 정답이 아예 없습니다. 그 부분을 '관심 없음' 으로 취급하면 신모델이 부당하게 유리하거나 불리해집니다. 이 되먹임이 오프라인·온라인 어긋남의 가장 흔한 원인입니다.",
        best: true },
      { label: "온라인 지표가 오프라인 지표와 다른 것을 재고 있다",
        fx: { algorithms: 2, communication: 2 },
        fb: "△ 아주 중요한 확인이고 실제로 자주 그렇습니다. AUC 는 순위를 재고 클릭률은 <b>맨 위에 무엇이 있는가</b>를 재므로, 하위 순위가 좋아져도 클릭률은 그대로일 수 있습니다." },
      { label: "실험 표본이 모자라서",
        fx: { algorithms: 1 },
        fb: "△ 확인해야 합니다. 다만 <b>확인이 가장 쉬운 것</b>이므로 몇 분이면 배제할 수 있고, 그 뒤에 진짜 원인을 찾습니다." },
      { label: "신모델을 다시 학습한다",
        fx: { algorithms: -2 },
        fb: "⚠️ 왜 어긋났는지 모른 채 다시 학습하면 <b>같은 어긋남이 그대로</b> 남습니다. 오프라인 성적만 또 좋아질 것입니다." }] },

  { t: "되먹임이 만드는 편향을 본다", type: "build",
    goal: "옛 모델이 <b>보여 준 것만</b> 기록에 남는다는 사실이 평가를 어떻게 왜곡하는지 보이세요.\n전부 보여 줬을 때의 진짜 성적과 견줍니다.",
    hint: "핵심은 <b>안 보여 준 항목에는 정답이 없다</b>는 것입니다. 그것을 '관심 없음' 으로 채우면 신모델이 새로 올린 좋은 항목이 오답으로 세어집니다. 진짜 성적(전부 보여 줬다면)과 견주면 오프라인 평가가 얼마나 어긋나는지 숫자로 나옵니다.",
    acc: "가려진 로그로 잰 성적과 전부 아는 성적이 나란히 출력되고, 어긋난 폭이 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nlet seed = 4242;\nfunction rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }\n\n/* 항목 200개. 진짜 관심 여부는 우리가 알지만 로그는 모른다. */\nconst items = [];\nfor (let i = 0; i < 200; i++) {\n  items.push({ id: i, likes: rnd() < 0.25,\n    oldScore: rnd(), newScore: 0 });\n}\n/* 신모델은 진짜 관심과 조금 더 잘 맞는다 */\nitems.forEach((it) => { it.newScore = (it.likes ? 0.45 : 0.3) + rnd() * 0.5; });\n\n/* 옛 모델이 상위 40개만 보여 줬다 — 거기에만 기록이 남는다 */\nconst shown = new Set(items.slice().sort((a, b) => b.oldScore - a.oldScore)\n  .slice(0, 40).map((x) => x.id));\n\nfunction hitRate(scoreKey, useLog) {\n  const top = items.slice().sort((a, b) => b[scoreKey] - a[scoreKey]).slice(0, 40);\n  const hits = top.filter((it) => {\n    if (!useLog) return it.likes;                 // 전부 안다\n    return shown.has(it.id) ? it.likes : false;   // 기록에 없으면 '관심 없음' 으로 센다\n  }).length;\n  return hits / 40;\n}\n\nout.push(\"평가 방식              옛 모델   신모델   판정\");\n[[true, \"로그로만 평가\"], [false, \"전부 아는 경우\"]].forEach((c) => {\n  const o = hitRate(\"oldScore\", c[0]), n = hitRate(\"newScore\", c[0]);\n  out.push(c[1].padEnd(22) + (o * 100).toFixed(0).padStart(5) + \"%  \" +\n    (n * 100).toFixed(0).padStart(6) + \"%   \" +\n    (n > o ? \"신모델 우세\" : n < o ? \"옛 모델 우세\" : \"비김\"));\n});\n\nconst newTop = items.slice().sort((a, b) => b.newScore - a.newScore).slice(0, 40);\nconst unseen = newTop.filter((it) => !shown.has(it.id)).length;\nout.push(\"\");\nout.push(\"신모델이 올린 상위 40개 중 옛 모델이 안 보여 준 것: \" + unseen + \"개\");\nout.push(\"→ 그 \" + unseen + \"개에는 애초에 정답이 없다. 로그로 재면 전부 오답으로 센다\");\nout.push(\"\");\nout.push(\"로그는 지금 돌고 있는 모델이 만든 것이다\");\nout.push(\"보여 주지 않은 것을 '관심 없음' 으로 채우면 평가가 통째로 기운다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "시점이 새는 자리를 찾는다", type: "build",
    goal: "특징 중에 <b>예측 시점에는 알 수 없는 것</b>이 섞였는지 찾으세요.\n각 특징이 언제 확정되는지와 예측 시각을 견줍니다.",
    hint: "누출은 대개 <b>미래 정보</b>가 특징에 들어간 것입니다. '이 주문의 최종 결제 금액' 이나 '이 사용자의 그날 총 클릭 수' 는 예측 시점에 아직 정해지지 않았는데, 로그를 나중에 뽑으면 그 값이 들어 있습니다. 특징마다 '언제 확정되는가' 를 적어 두고 예측 시각과 견주면 기계적으로 걸러집니다.",
    acc: "특징별 확정 시각과 예측 시각이 견주어져 누출이 지목되고, 그것을 뺐을 때의 성적 변화가 함께 나오면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst PREDICT_AT = 0;   // 요청이 들어온 순간\n\nconst feats = [\n  { n: \"사용자 가입 경과일\", knownAt: -86400, gain: 0.03 },\n  { n: \"지난 30일 구매 횟수\", knownAt: -3600, gain: 0.06 },\n  { n: \"장바구니 금액\", knownAt: -60, gain: 0.05 },\n  { n: \"그날 총 클릭 수\", knownAt: 43200, gain: 0.11 },\n  { n: \"최종 결제 금액\", knownAt: 900, gain: 0.14 },\n  { n: \"세션 시작 후 경과초\", knownAt: 0, gain: 0.02 }\n];\n\nout.push(\"특징                  확정 시각      기여   판정\");\nconst leaks = [];\nfeats.forEach((f) => {\n  const leak = f.knownAt > PREDICT_AT;\n  if (leak) leaks.push(f);\n  const when = f.knownAt < -3600 ? Math.abs(f.knownAt / 3600).toFixed(0) + \"시간 전\"\n    : f.knownAt < 0 ? Math.abs(f.knownAt / 60).toFixed(0) + \"분 전\"\n    : f.knownAt === 0 ? \"예측 시점\"\n    : \"+\" + (f.knownAt / 60).toFixed(0) + \"분 뒤\";\n  out.push(f.n.padEnd(22) + when.padEnd(15) +\n    (\"+\" + f.gain.toFixed(2)).padEnd(7) + (leak ? \"누출 — 예측 때는 모른다\" : \"쓸 수 있다\"));\n});\n\nconst total = feats.reduce((s, f) => s + f.gain, 0);\nconst leaked = leaks.reduce((s, f) => s + f.gain, 0);\nout.push(\"\");\nout.push(\"누출된 특징 \" + leaks.length + \"개: \" + leaks.map((f) => f.n).join(\", \"));\nout.push(\"오프라인 성적 기여의 \" + Math.round(leaked / total * 100) + \"% 가 누출에서 왔다\");\nout.push(\"→ 이것을 빼면 오프라인 성적이 \" + (total).toFixed(2) + \" → \" +\n  (total - leaked).toFixed(2) + \" 로 떨어진다\");\nout.push(\"→ 그런데 그 낮은 값이 실제로 얻을 수 있는 성적이다\");\nout.push(\"\");\nout.push(\"특징마다 '언제 확정되는가' 를 적어 두면 기계적으로 걸러진다\");\nout.push(\"누출은 성적을 올려 주기 때문에 아무도 의심하지 않는다 — 그래서 위험하다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "온라인으로 판정한다", type: "build",
    goal: "온라인 실험 결과가 <b>결론을 내릴 만한지</b> 판정하세요.\n표본·기간·신뢰구간을 함께 봅니다.",
    hint: "온라인 결과도 그냥 믿으면 안 됩니다. 표본이 모자라면 우연이고, 기간이 짧으면 <b>요일 효과</b>가 섞이며, 새 것에 반응하는 <b>신기 효과</b>가 초반을 부풀립니다. 신뢰구간이 0을 넘나들면 '차이를 확인하지 못했다' 이지 '차이가 없다' 가 아닙니다.",
    acc: "차이·신뢰구간·판정이 출력되고, 기간과 표본이 모자란 경우가 따로 지적되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction judge(nA, cA, nB, cB, days) {\n  const pA = cA / nA, pB = cB / nB;\n  const diff = pB - pA;\n  const se = Math.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB);\n  const lo = diff - 1.96 * se, hi = diff + 1.96 * se;\n  const notes = [];\n  if (days < 7) notes.push(\"기간 \" + days + \"일 — 요일 효과가 섞인다\");\n  if (Math.min(nA, nB) < 20000) notes.push(\"표본이 적다\");\n  const verdict = lo > 0 ? \"신모델 우세\" : hi < 0 ? \"신모델 열세\" : \"차이를 확인하지 못함\";\n  return { pA: pA, pB: pB, diff: diff, lo: lo, hi: hi, verdict: verdict, notes: notes };\n}\n\nconst runs = [\n  { n: \"3일차\", nA: 9000, cA: 279, nB: 9000, cB: 297, days: 3 },\n  { n: \"10일차\", nA: 62000, cA: 1922, nB: 62000, cB: 1798, days: 10 },\n  { n: \"10일차(신기효과 제외)\", nA: 43000, cA: 1333, nB: 43000, cB: 1200, days: 7 }\n];\n\nout.push(\"구간                    옛 모델  신모델   차이      95% 구간          판정\");\nruns.forEach((r) => {\n  const j = judge(r.nA, r.cA, r.nB, r.cB, r.days);\n  out.push(r.n.padEnd(24) +\n    (j.pA * 100).toFixed(2) + \"%  \" +\n    (j.pB * 100).toFixed(2) + \"%  \" +\n    ((j.diff >= 0 ? \"+\" : \"\") + (j.diff * 100).toFixed(2) + \"%p\").padEnd(10) +\n    (\"[\" + (j.lo * 100).toFixed(2) + \", \" + (j.hi * 100).toFixed(2) + \"]\").padEnd(18) +\n    j.verdict);\n  j.notes.forEach((x) => out.push(\"    ⚠ \" + x));\n});\n\nout.push(\"\");\nout.push(\"신뢰구간이 0을 넘나들면 '차이가 없다' 가 아니라 '확인하지 못했다' 다\");\nout.push(\"초반 며칠은 새 것에 반응하는 효과가 섞여 부풀거나 꺼진다\");\nout.push(\"요일마다 사용자가 다르므로 최소 한 주는 돌려야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "다음에는 무엇을 바꿀 것인가", type: "decide",
    goal: "원인은 되먹임 편향이었습니다. 다음 모델도 같은 로그로 평가하게 됩니다.",
    sit: "무엇을 하시겠습니까?",
    opts: [
      { label: "트래픽의 일부를 무작위로 보여 주어, 편향 없는 평가용 기록을 계속 모은다",
        fx: { algorithms: 3, system_design: 2 },
        fb: "✅ <b>편향 없는 로그를 만드는 유일한 방법은 일부러 무작위로 보여 주는 것</b>입니다. 1~2% 정도만 떼어도 평가에 쓸 만한 기록이 쌓이고, 그 손실은 잘못된 모델을 배포하는 값보다 훨씬 쌉니다. 이 기록이 있으면 다음 모델부터는 오프라인 평가를 믿을 수 있습니다.",
        best: true },
      { label: "오프라인 평가를 그만두고 온라인 실험만 한다",
        fx: { algorithms: -1, performance: -1 },
        fb: "⚠️ 온라인 실험은 비싸고 느립니다. 후보가 스무 개면 스무 번을 며칠씩 돌려야 하므로, <b>오프라인으로 거르고 온라인으로 확인하는</b> 두 단계가 필요합니다." },
      { label: "보여 준 것에 가중치를 주어 편향을 보정한다",
        fx: { algorithms: 2 },
        fb: "△ 실제로 쓰이는 방법이고 무작위 기록이 없을 때의 차선입니다. 다만 <b>옛 모델이 아예 안 보여 준 항목</b>은 어떤 가중치로도 되살릴 수 없습니다." },
      { label: "온라인 결과를 학습 데이터에 넣어 다시 학습한다",
        fx: { algorithms: -1 },
        fb: "⚠️ 되먹임을 더 강하게 만듭니다. <b>모델이 만든 데이터로 모델을 학습</b>하면 편향이 스스로를 강화해, 시간이 갈수록 좁은 것만 보여 주게 됩니다." }] },

  { t: "회고 — 무엇을 믿을 수 있게 됐나", type: "note",
    goal: "이번 일로 <b>어떤 숫자를 얼마나 믿을 수 있는지</b> 다시 적으세요.\n다음 모델을 판정하는 절차도 순서대로 적습니다.",
    ph: "오프라인 지표를 얼마나 믿는가 / 누출로 부풀었던 폭 / 무작위 기록을 몇 % 로 정했나 / 온라인 실험의 최소 기간·표본 / 판정 순서(오프라인 거르기 → 온라인 확인) / 되먹임을 다시 재는 주기" }]
}

]};
