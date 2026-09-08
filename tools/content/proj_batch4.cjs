/* 두 번째 프로젝트 묶음 4 — 시스템 설계와 데이터 과학 쪽의 깊이.
   설계 문서를 쓰는 일, 모델을 내보내는 일, 실험을 판정하는 일,
   메시지를 순서대로 다루는 일, 그리고 캐시를 믿을 수 있게 만드는 일. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── sysd */
{
  lv: 4, em: "📐",
  title: "설계 문서로 팀을 설득한다",
  desc: "선택지를 감이 아니라 숫자로 견주는 설계 문서를 쓰고, 반대 의견을 반영해 결정과 그 근거를 기록으로 남긴다",
  skills: ["system_design", "communication", "leadership"],
  phases: [

  { t: "무엇을 정해야 하는지 적는다", type: "note",
    goal: "결정해야 할 것 <b>하나</b>를 고르고, 그것이 왜 지금 필요한지 적으세요.\n여러 개를 한 문서에 담으면 아무것도 못 정합니다.",
    ph: "예: 알림 발송을 동기 호출에서 큐로 바꿀 것인가 · 지금 필요한 이유: 발송이 느려 주문 API 의 p99 가 2초 · 되돌릴 수 있는가: 6주치 작업이라 어렵다 · 정하지 않으면: 다음 분기 트래픽에 못 버틴다" },

  { t: "선택지를 몇 개로 둘 것인가", type: "decide",
    goal: "설계 문서를 쓰려는데 후보가 하나밖에 떠오르지 않습니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "'아무것도 안 한다' 를 포함해 최소 셋을 만들고, 각각을 진지하게 쓴다",
        fx: { system_design: 3, leadership: 3 },
        fb: "✅ <b>선택지가 하나면 그것은 문서가 아니라 통보입니다.</b> 특히 '아무것도 안 한다' 를 넣으면 '이걸 안 하면 무슨 일이 나는가' 가 드러나, 정말 지금 해야 하는지가 판가름 납니다. 들러리 선택지를 쓰면 읽는 사람이 곧 알아채고 문서 전체를 믿지 않게 됩니다.",
        best: true },
      { label: "하나만 쓰고 왜 좋은지 자세히 설명한다",
        fx: { leadership: -2, communication: -2 },
        fb: "⚠️ 읽는 사람은 <b>다른 길을 검토했는지</b>를 알 수 없습니다. 나중에 문제가 생기면 '그때 왜 이걸 골랐냐' 가 아니라 '왜 저건 안 봤냐' 가 되고, 답할 근거가 없습니다." },
      { label: "선택지를 다섯 개 이상 만든다",
        fx: { communication: -1 },
        fb: "△ 많다고 좋지 않습니다. 진지하게 검토하지 않은 선택지가 섞이면 <b>읽는 시간만 늘고 판단은 흐려집니다.</b> 셋 안팎이 대개 적당합니다." },
      { label: "먼저 프로토타입을 만들어 보고 문서를 쓴다",
        fx: { system_design: 1 },
        fb: "△ 모르는 것이 많을 때는 좋은 순서입니다. 다만 만들어 본 것에 <b>애착이 생겨</b> 다른 선택지를 공정하게 못 보게 되는 함정이 있으니, 무엇을 확인하려는 프로토타입인지 먼저 적어 둡니다." }] },

  { t: "선택지를 숫자로 견준다", type: "build",
    goal: "선택지들을 <b>같은 기준으로</b> 점수 내어 비교표를 만드세요.\n기준마다 가중치를 두고, 가중치를 바꿨을 때 순위가 뒤집히는지도 봅니다.",
    hint: "표를 만드는 목적은 답을 얻는 것이 아니라 <b>의견이 어디서 갈리는지</b>를 드러내는 것입니다. 가중치를 바꿔도 1등이 그대로면 논쟁할 것이 없고, 뒤집히면 '무엇을 더 중요하게 볼 것인가' 가 진짜 쟁점이라는 뜻입니다. 그 질문은 기술이 아니라 사업 판단입니다.",
    acc: "선택지별 기준 점수와 가중 합계가 나오고, 가중치를 바꿨을 때 순위가 어떻게 변하는지 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst crit = [\"지연 개선\", \"구현 비용\", \"운영 부담\", \"되돌리기\", \"팀 숙련도\"];\nconst opts = [\n  { n: \"아무것도 안 함\", s: [0, 5, 5, 5, 5] },\n  { n: \"스레드 풀로 비동기\", s: [3, 4, 3, 4, 4] },\n  { n: \"메시지 큐 도입\", s: [5, 2, 2, 2, 2] }\n];\n\nfunction rank(w) {\n  return opts.map((o) => ({\n    n: o.n,\n    total: +o.s.reduce((a, v, i) => a + v * w[i], 0).toFixed(2)\n  })).sort((a, b) => b.total - a.total);\n}\n\nout.push(\"기준          \" + opts.map((o) => o.n.padEnd(16)).join(\"\"));\ncrit.forEach((c, i) => {\n  out.push(c.padEnd(14) + opts.map((o) => String(o.s[i]).padEnd(16)).join(\"\"));\n});\n\nconst sets = [\n  { n: \"성능 우선\", w: [0.5, 0.1, 0.1, 0.15, 0.15] },\n  { n: \"균형\", w: [0.2, 0.2, 0.2, 0.2, 0.2] },\n  { n: \"안정 우선\", w: [0.1, 0.15, 0.25, 0.35, 0.15] }\n];\n\nout.push(\"\");\nout.push(\"가중치 관점   1위                2위\");\nconst winners = [];\nsets.forEach((s) => {\n  const r = rank(s.w);\n  winners.push(r[0].n);\n  out.push(s.n.padEnd(14) + (r[0].n + \" \" + r[0].total).padEnd(19) + r[1].n + \" \" + r[1].total);\n});\n\nout.push(\"\");\nif (new Set(winners).size === 1) {\n  out.push(\"어떤 관점에서도 1위가 같다: \" + winners[0]);\n  out.push(\"→ 논쟁할 것이 없다. 문서는 결정을 기록하는 역할만 하면 된다\");\n} else {\n  out.push(\"관점에 따라 1위가 갈린다: \" + [...new Set(winners)].join(\" / \"));\n  out.push(\"→ 진짜 쟁점은 '무엇을 더 중요하게 볼 것인가' 다. 기술이 아니라 사업 판단이다\");\n}\nconsole.log(out.join(\"\\n\"));" },

  { t: "규모를 어림한다", type: "build",
    goal: "설계가 <b>감당해야 할 크기</b>를 어림 계산하세요.\n초당 요청, 저장량, 대역폭을 구하고 어디가 먼저 한계에 닿는지 봅니다.",
    hint: "어림 계산의 목적은 정확한 숫자가 아니라 <b>자릿수</b>입니다. 초당 100건인지 10만 건인지에 따라 설계가 통째로 달라지고, 그 사이의 차이는 대개 중요하지 않습니다. 평균이 아니라 <b>피크</b>로 계산해야 하고, 대개 하루 평균의 3~5배로 잡습니다.",
    acc: "일 요청수에서 평균·피크 QPS, 연간 저장량, 피크 대역폭이 계산되고, 가장 먼저 한계에 닿는 것이 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst DAU = 2000000;\nconst PER_USER = 8;              // 하루 알림 수\nconst PAYLOAD = 1200;            // 바이트\nconst PEAK = 4;                  // 피크는 평균의 몇 배\nconst KEEP_DAYS = 365;\n\nconst perDay = DAU * PER_USER;\nconst avgQps = perDay / 86400;\nconst peakQps = avgQps * PEAK;\nconst yearBytes = perDay * PAYLOAD * KEEP_DAYS;\nconst peakBps = peakQps * PAYLOAD;\n\nconst fmt = (n) => n >= 1e12 ? (n / 1e12).toFixed(1) + \"T\"\n  : n >= 1e9 ? (n / 1e9).toFixed(1) + \"G\"\n  : n >= 1e6 ? (n / 1e6).toFixed(1) + \"M\"\n  : n >= 1e3 ? (n / 1e3).toFixed(1) + \"K\" : String(Math.round(n));\n\nout.push(\"하루 알림      \" + fmt(perDay) + \"건\");\nout.push(\"평균 QPS       \" + Math.round(avgQps));\nout.push(\"피크 QPS       \" + Math.round(peakQps) + \"  (평균의 \" + PEAK + \"배)\");\nout.push(\"1년 저장량     \" + fmt(yearBytes) + \"B\");\nout.push(\"피크 대역폭    \" + fmt(peakBps * 8) + \"bps\");\n\n/* 흔한 한 대의 한계와 견준다 — 몇 대가 필요한지가 아니라 자릿수가 목적이다 */\nconst limits = [\n  { n: \"앱 서버 1대(2,000 QPS)\", need: peakQps / 2000 },\n  { n: \"DB 쓰기 1대(5,000 QPS)\", need: peakQps / 5000 },\n  { n: \"1Gbps 회선\", need: peakBps * 8 / 1e9 },\n  { n: \"1TB 디스크\", need: yearBytes / 1e12 }\n];\nout.push(\"\");\nout.push(\"자원              필요 배수\");\nlimits.forEach((l) => out.push(l.n.padEnd(24) + l.need.toFixed(1) + \"배\"));\n\nconst worst = limits.slice().sort((a, b) => b.need - a.need)[0];\nout.push(\"\");\nout.push(\"가장 먼저 한계에 닿는 것: \" + worst.n + \" (\" + worst.need.toFixed(1) + \"배)\");\nout.push(\"어림 계산의 목적은 정확한 값이 아니라 자릿수다\");\nout.push(\"평균이 아니라 피크로 계산해야 한다 — 시스템은 피크에서 무너진다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "반대 의견을 어떻게 다룰 것인가", type: "decide",
    goal: "문서에 '큐를 도입하면 운영이 복잡해진다' 는 반대가 달렸습니다. 맞는 지적입니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "지적을 문서에 그대로 적고, 그 위험을 줄이는 방법과 남는 위험을 함께 적는다",
        fx: { communication: 3, leadership: 3 },
        fb: "✅ <b>반대를 지운 문서는 나중에 아무도 못 믿습니다.</b> 지적을 그대로 남기고 '이렇게 줄이겠다, 그래도 이만큼은 남는다' 를 적으면, 결정이 위험을 모르고 내려진 것이 아님이 기록됩니다. 실제로 문제가 생겼을 때 '알고 감수한 것' 과 '몰랐던 것' 은 완전히 다릅니다.",
        best: true },
      { label: "운영 복잡도를 낮추는 설계로 바꾼다",
        fx: { system_design: 1 },
        fb: "△ 지적이 옳다면 좋은 대응입니다. 다만 <b>모든 지적에 설계를 바꾸면</b> 문서가 끝나지 않습니다. 감수할 위험과 없앨 위험을 구분해야 합니다." },
      { label: "숫자로 반박한다",
        fx: { communication: -1 },
        fb: "⚠️ 이 지적은 숫자로 반박할 성격이 아닙니다. 운영 복잡도는 <b>사람이 감당하는 것</b>이라, 숫자를 들이대면 대화가 끊깁니다." },
      { label: "일단 도입하고 복잡해지면 그때 대응한다",
        fx: { leadership: -2, system_design: -1 },
        fb: "⚠️ 되돌리기 어려운 결정에는 쓸 수 없는 태도입니다. 6주치 작업이라면 <b>'그때 대응' 이 사실상 불가능</b>합니다." }] },

  { t: "회고 — 무엇이 결정을 바꿨나", type: "note",
    goal: "문서를 쓰기 전과 후에 <b>생각이 바뀐 부분</b>을 적으세요.\n안 바뀌었다면 그 문서는 설득용이었는지 검토용이었는지도 적습니다.",
    ph: "처음 마음에 둔 안 / 최종 결정 / 바뀌었다면 무엇 때문에 / 반영한 지적과 감수한 위험 / 어림 계산에서 놀란 숫자 / 6개월 뒤 다시 볼 조건" }]
},

/* ─────────────────────────────────────────────── ml */
{
  lv: 4, em: "🚀",
  title: "모델은 좋은데 서비스가 안 된다",
  desc: "노트북에서만 잘 도는 모델을 실제 서비스로 옮기며 학습·서빙 불일치, 지연, 버전 관리, 성능 저하 감지를 차례로 해결한다",
  skills: ["ml", "backend", "mleval"],
  phases: [

  { t: "노트북과 서비스의 차이를 적는다", type: "note",
    goal: "지금 노트북에서 되는 것과 <b>서비스에 필요한 것</b>을 나란히 적으세요.\n빠진 것이 대개 사고가 나는 자리입니다.",
    ph: "예: 노트북 — 전처리를 셀에서 손으로 · 특징 12개를 그때그때 계산 · 응답 시간 상관없음\n서비스 — 전처리 코드가 없음 · 특징 중 3개는 실시간에 못 구함 · p99 100ms 이내 · 하루 40만 건" },

  { t: "학습과 서빙이 왜 어긋나는가", type: "decide",
    goal: "검증 정확도는 94% 인데 서비스에 올리니 78% 입니다.",
    sit: "무엇을 먼저 의심하시겠습니까?",
    opts: [
      { label: "특징을 만드는 코드가 학습과 서빙에서 다른 것 — 같은 입력에 다른 특징이 나오는지 확인",
        fx: { algorithms: 3, coding: 2 },
        fb: "✅ <b>가장 흔하고 가장 조용한 원인입니다.</b> 학습은 노트북에서, 서빙은 서비스 코드에서 특징을 만들면 두 구현이 미묘하게 달라집니다. 정규화 기준값을 다시 계산했거나, 결측을 다르게 채웠거나, 범주를 다른 순서로 인코딩한 것 같은 차이입니다. 같은 입력을 양쪽에 넣어 특징 벡터를 견주면 바로 드러납니다.",
        best: true },
      { label: "실제 데이터 분포가 학습 데이터와 달라서",
        fx: { algorithms: 2 },
        fb: "△ 실제 원인일 수 있고 확인해야 합니다. 다만 <b>확인이 더 쉬운 것</b>이 있으므로 순서상 뒤입니다. 특징 벡터 비교는 몇 분이면 되고, 분포 비교는 그보다 오래 걸립니다." },
      { label: "검증 세트에 정답이 새어 들어갔다",
        fx: { algorithms: 2 },
        fb: "△ 94% 가 애초에 거짓이었을 가능성입니다. 미래 정보가 특징에 섞였거나 같은 사용자가 학습·검증에 나뉘어 들어간 경우인데, <b>이것도 확인해야 하지만</b> 특징 불일치보다는 뒤입니다." },
      { label: "모델을 다시 학습한다",
        fx: { algorithms: -2 },
        fb: "⚠️ 원인을 모른 채 다시 학습하면 <b>같은 차이가 그대로 남습니다.</b> 시간만 쓰고 결과는 같습니다." }] },

  { t: "양쪽 특징을 견준다", type: "build",
    goal: "같은 입력을 학습용·서빙용 두 코드에 넣어 <b>특징 벡터가 같은지</b> 확인하세요.\n다르면 어느 특징이 얼마나 다른지 짚습니다.",
    hint: "완전히 같아야 합니다. 부동소수점 오차 수준의 차이는 괜찮지만 <b>규칙이 다른 차이</b>는 안 됩니다. 자주 어긋나는 자리는 세 곳입니다 — 결측값 채우기, 정규화에 쓰는 기준값(학습 때의 값을 저장해 두고 써야 한다), 범주 인코딩 순서.",
    acc: "특징별 두 값과 차이가 출력되고, 규칙이 다른 특징이 이름으로 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst row = { age: 34, income: null, city: \"부산\", visits: 7 };\n\n/* 학습 때 계산해 저장해 둔 값들 — 서빙에서도 이것을 써야 한다 */\nconst FIT = { incomeMean: 4200, ageMean: 41, ageStd: 12, cities: [\"서울\", \"부산\", \"대구\"] };\n\nfunction trainFeat(r) {\n  return {\n    age_z: (r.age - FIT.ageMean) / FIT.ageStd,\n    income: r.income == null ? FIT.incomeMean : r.income,\n    city_idx: FIT.cities.indexOf(r.city),\n    visits_log: Math.log1p(r.visits)\n  };\n}\n\n/* 서빙 코드 — 따로 짜다 보니 세 곳이 어긋났다 */\nfunction serveFeat(r) {\n  const cities = [\"부산\", \"서울\", \"대구\"];      // 순서가 다르다\n  return {\n    age_z: (r.age - 40) / 12,                    // 기준값을 다시 정했다\n    income: r.income == null ? 0 : r.income,     // 결측을 0으로 채운다\n    city_idx: cities.indexOf(r.city),\n    visits_log: Math.log1p(r.visits)\n  };\n}\n\nconst a = trainFeat(row), b = serveFeat(row);\nconst EPS = 1e-9;\nout.push(\"특징          학습          서빙          판정\");\nconst wrong = [];\nObject.keys(a).forEach((k) => {\n  const same = Math.abs(a[k] - b[k]) < EPS;\n  if (!same) wrong.push(k);\n  out.push(k.padEnd(14) + String(+a[k].toFixed(4)).padEnd(14) +\n    String(+b[k].toFixed(4)).padEnd(14) + (same ? \"같음\" : \"다름\"));\n});\n\nout.push(\"\");\nout.push(\"어긋난 특징: \" + (wrong.length ? wrong.join(\", \") : \"없음\"));\nout.push(\"\");\nout.push(\"자주 어긋나는 세 자리\");\nout.push(\"  1. 결측값 채우기 — 학습은 평균, 서빙은 0\");\nout.push(\"  2. 정규화 기준값 — 학습 때의 평균·표준편차를 저장해 두고 써야 한다\");\nout.push(\"  3. 범주 인코딩 순서 — 목록 순서가 다르면 다른 숫자가 된다\");\nout.push(\"→ 특징 코드를 한 벌만 두고 양쪽이 그것을 부르는 것이 유일한 해법이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "지연 예산 안에 넣는다", type: "build",
    goal: "추론 한 번의 시간을 <b>단계별로</b> 나누고, 목표 안에 들어오게 하는 방법들의 효과를 계산하세요.",
    hint: "추론 시간은 모델 계산만이 아닙니다 — 특징을 만드느라 DB 를 여러 번 조회하는 것이 대개 더 큽니다. 줄이는 방법은 <b>미리 계산해 두기</b>, <b>묶어서 조회하기</b>, <b>모델을 가볍게 하기</b> 순으로 효과가 큽니다. 모델부터 손대는 것은 대개 마지막 수단입니다.",
    acc: "단계별 시간과 각 조치의 효과가 나오고, 목표를 만족하는 조합이 계산되어 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst TARGET = 100;   // ms\n\nconst base = [\n  { n: \"특징 DB 조회(3회)\", ms: 66, fix: \"미리 계산해 캐시\", after: 4 },\n  { n: \"특징 변환\", ms: 12, fix: \"벡터화\", after: 5 },\n  { n: \"모델 추론\", ms: 41, fix: \"경량화(정확도 -1%p)\", after: 14 },\n  { n: \"후처리·직렬화\", ms: 7, fix: \"—\", after: 7 }\n];\n\nconst total = base.reduce((s, x) => s + x.ms, 0);\nout.push(\"단계                시간    목표 대비\");\nbase.forEach((x) => out.push(x.n.padEnd(20) + (x.ms + \"ms\").padEnd(8) +\n  Math.round(x.ms / TARGET * 100) + \"%\"));\nout.push(\"합계\".padEnd(20) + (total + \"ms\").padEnd(8) +\n  (total <= TARGET ? \"목표 안\" : \"목표 초과 \" + (total - TARGET) + \"ms\"));\n\nout.push(\"\");\nout.push(\"조치                        절감    누적 시간  목표\");\n/* 효과 큰 것부터 하나씩 적용한다 */\nconst order = base.filter((x) => x.after < x.ms).sort((a, b) => (b.ms - b.after) - (a.ms - a.after));\nlet cur = total;\nconst applied = [];\nfor (const x of order) {\n  cur -= (x.ms - x.after);\n  applied.push(x.fix);\n  out.push(x.fix.padEnd(28) + (\"-\" + (x.ms - x.after) + \"ms\").padEnd(8) +\n    (cur + \"ms\").padEnd(11) + (cur <= TARGET ? \"만족\" : \"아직\"));\n  if (cur <= TARGET) break;\n}\n\nout.push(\"\");\nout.push(\"필요한 조치: \" + applied.join(\" + \"));\nout.push(applied.some((x) => x.indexOf(\"경량화\") >= 0)\n  ? \"모델을 건드려야 했다 — 정확도 손실을 감수할지 따로 판단해야 한다\"\n  : \"모델은 건드리지 않았다 — 정확도를 지키면서 목표를 맞췄다\");\nout.push(\"\");\nout.push(\"추론 시간의 대부분은 모델이 아니라 특징을 모으는 데 든다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "성능이 떨어지는 것을 어떻게 알 것인가", type: "decide",
    goal: "배포 3개월 뒤 정확도가 조용히 떨어지고 있습니다. 정답은 며칠 뒤에나 알 수 있습니다.",
    sit: "무엇으로 감지하시겠습니까?",
    opts: [
      { label: "정답 없이도 볼 수 있는 것 — 입력 분포와 예측 분포의 변화를 함께 감시한다",
        fx: { algorithms: 3, system_design: 2 },
        fb: "✅ <b>정답을 기다리면 며칠 늦습니다.</b> 입력 특징의 분포가 학습 때와 달라졌는지, 예측 확률의 분포가 갑자기 한쪽으로 쏠렸는지는 지금 당장 볼 수 있습니다. 둘 중 하나가 움직이면 정확도가 떨어지기 전에 알아챌 수 있고, 정답이 도착하면 그때 확인하면 됩니다.",
        best: true },
      { label: "정답이 도착하는 대로 정확도를 계산해 지켜본다",
        fx: { algorithms: 2 },
        fb: "△ 반드시 해야 하는 일이고 최종 판정은 이것으로 합니다. 다만 <b>며칠이 늦으므로</b> 이것만으로는 감지가 느립니다. 둘을 함께 둡니다." },
      { label: "주기적으로 다시 학습한다",
        fx: { algorithms: 1 },
        fb: "△ 대응책이지 감지책이 아닙니다. 그리고 <b>왜 떨어졌는지 모른 채</b> 다시 학습하면 데이터가 오염된 경우 오히려 나빠집니다." },
      { label: "사용자 문의가 늘면 확인한다",
        fx: { algorithms: -3 },
        fb: "⚠️ 가장 늦게 아는 방법이고, 그때는 이미 신뢰를 잃은 뒤입니다." }] },

  { t: "회고 — 무엇이 노트북에만 있었나", type: "note",
    goal: "노트북에서만 성립하던 가정들을 적으세요.\n다음 모델에서 <b>처음부터 확인할 목록</b>으로 만듭니다.",
    ph: "학습·서빙이 어긋난 자리 / 실시간에 못 구하는 특징 / 검증 94% 가 정말이었나 / 지연 목표를 맞춘 방법 / 감시 지표와 임계 / 다음 모델의 확인 목록" }]
},

/* ─────────────────────────────────────────────── stat */
{
  lv: 3, em: "🎲",
  title: "이 실험 결과를 믿어도 되나",
  desc: "A/B 테스트의 결과를 성급히 읽지 않도록 표본 크기·유의성·다중 비교·실무적 의미를 차례로 따져 결론을 내린다",
  skills: ["stat", "mleval", "python"],
  phases: [

  { t: "무엇을 재려 했는지 적는다", type: "note",
    goal: "실험을 시작할 때 정했어야 할 것들을 적으세요.\n<b>끝난 뒤에 정하면</b> 어떤 결과든 원하는 대로 읽을 수 있습니다.",
    ph: "예: 주요 지표 — 결제 전환율 하나 · 최소 관심 차이 — 상대 3% · 실험 기간 — 14일 고정 · 표본 — 그룹당 최소 8만 · 보조 지표 — 객단가·이탈률(참고만) · 중간에 안 본다" },

  { t: "언제 결과를 볼 것인가", type: "decide",
    goal: "실험 3일째에 실험군이 8% 높게 나왔습니다. 팀에서 지금 배포하자고 합니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "정해 둔 기간과 표본을 채운 뒤에 본다 — 지금 멈추면 우연을 실력으로 착각한다",
        fx: { algorithms: 3, communication: 2 },
        fb: "✅ <b>계속 들여다보다 좋아 보일 때 멈추면</b> 아무 차이가 없어도 상당한 확률로 '이겼다' 가 나옵니다. 초반에는 표본이 적어 흔들림이 크고, 그 흔들림의 봉우리에서 멈추게 되기 때문입니다. 중간에 꼭 봐야 한다면 그것을 감안한 방법을 미리 정해 두고 써야 합니다.",
        best: true },
      { label: "표본이 충분한지만 확인하고 충분하면 멈춘다",
        fx: { algorithms: 1 },
        fb: "△ 표본 확인은 맞지만 <b>여러 번 본 것 자체가 문제</b>입니다. 볼 때마다 우연히 유의해질 기회가 생기므로, 본 횟수를 감안하지 않으면 기준이 헐거워집니다." },
      { label: "일주일만 더 보고 결정한다",
        fx: { algorithms: 1 },
        fb: "△ 기간을 늘리는 방향은 맞습니다. 다만 <b>결과를 보고 기간을 정하는 것</b> 자체가 같은 문제라, 처음 정한 14일을 지키는 것이 낫습니다." },
      { label: "8% 는 크니까 배포한다",
        fx: { algorithms: -3 },
        fb: "⚠️ 차이의 크기가 아니라 <b>그 크기가 우연히 나올 확률</b>이 문제입니다. 표본이 적으면 20% 차이도 흔히 나옵니다." }] },

  { t: "표본이 얼마나 필요한지 센다", type: "build",
    goal: "감지하려는 차이 크기에 따라 <b>그룹당 필요한 표본 수</b>를 계산하세요.\n차이가 작아질수록 얼마나 급격히 늘어나는지 봅니다.",
    hint: "필요한 표본은 <b>감지하려는 차이의 제곱에 반비례</b>합니다. 차이를 절반으로 줄이면 표본은 네 배가 필요합니다. 이 성질 때문에 '아주 작은 개선' 을 확인하려면 현실적으로 불가능한 표본이 필요해지고, 그것이 곧 '이 실험은 할 값어치가 있는가' 를 정합니다.",
    acc: "차이 크기별 필요 표본과 소요 일수가 나오고, 주어진 트래픽으로 감지 가능한 최소 차이가 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst BASE = 0.04;          // 기준 전환율 4%\nconst DAILY = 50000;        // 하루 방문 (양쪽 합)\nconst Z = 1.96 + 0.84;      // 유의수준 5% · 검정력 80% 의 합\n\nfunction needPerGroup(relLift) {\n  const p1 = BASE, p2 = BASE * (1 + relLift);\n  const pBar = (p1 + p2) / 2;\n  const diff = Math.abs(p2 - p1);\n  return Math.ceil(2 * pBar * (1 - pBar) * (Z / diff) ** 2);\n}\n\nout.push(\"감지할 차이   그룹당 표본     소요 일수\");\n[0.20, 0.10, 0.05, 0.03, 0.01].forEach((r) => {\n  const n = needPerGroup(r);\n  const days = (n * 2) / DAILY;\n  out.push((\"상대 \" + (r * 100).toFixed(0) + \"%\").padEnd(14) +\n    String(n).padEnd(16) + days.toFixed(1) + \"일\");\n});\n\nout.push(\"\");\nout.push(\"차이를 절반으로 줄이면 표본은 네 배 — 제곱에 반비례한다\");\n\n/* 14일 안에 감지할 수 있는 최소 차이를 되짚는다 */\nconst budget = DAILY * 14 / 2;\nlet minLift = 0.20;\nfor (let r = 0.20; r >= 0.001; r -= 0.001) { if (needPerGroup(r) <= budget) minLift = r; }\nout.push(\"\");\nout.push(\"14일 트래픽(그룹당 \" + budget + \")으로 감지 가능한 최소 차이: 상대 \" +\n  (minLift * 100).toFixed(1) + \"%\");\nout.push(\"→ 그보다 작은 개선은 이 기간으로는 확인할 수 없다\");\nout.push(\"→ 확인할 수 없는 크기를 목표로 잡은 실험은 시작하기 전에 접는 것이 맞다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "여러 번 들여다보면 어떻게 되나", type: "build",
    goal: "<b>차이가 전혀 없는</b> 두 그룹을 만들어 놓고, 매일 들여다보며 '유의하면 멈추기' 를 했을 때 얼마나 자주 이겼다고 나오는지 세세요.",
    hint: "핵심은 <b>진짜 차이가 없는 데이터</b>로 실험하는 것입니다. 그런데도 '한 번이라도 유의하면 멈춘다' 규칙을 쓰면 5% 를 훨씬 넘는 비율로 유의가 나옵니다. 이것이 중간에 들여다보는 것의 값입니다. 한 번만 보는 경우와 나란히 두면 차이가 분명해집니다.",
    acc: "한 번만 볼 때와 매일 볼 때의 거짓 양성 비율이 나란히 출력되고, 후자가 훨씬 큰 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 32비트 안에서 도는 난수 — 큰 곱셈을 그냥 쓰면 자릿수를 잃어 값이 굳는다 */\nlet seed = 20240917;\nfunction rnd() {\n  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;\n  return seed / 4294967296;\n}\n\nconst P = 0.04, DAILY = 4000, DAYS = 14, TRIALS = 400;\n\nfunction zTest(cA, nA, cB, nB) {\n  const p = (cA + cB) / (nA + nB);\n  const se = Math.sqrt(p * (1 - p) * (1 / nA + 1 / nB));\n  return se ? Math.abs(cA / nA - cB / nB) / se : 0;\n}\n\nlet onceHit = 0, peekHit = 0;\nfor (let t = 0; t < TRIALS; t++) {\n  let cA = 0, cB = 0, n = 0, peeked = false;\n  for (let d = 0; d < DAYS; d++) {\n    for (let i = 0; i < DAILY; i++) {\n      if (rnd() < P) cA++;\n      if (rnd() < P) cB++;\n      n++;\n    }\n    /* 매일 들여다보고 유의하면 그 자리에서 멈춘다 */\n    if (!peeked && zTest(cA, n, cB, n) > 1.96) peeked = true;\n  }\n  if (peeked) peekHit++;\n  if (zTest(cA, n, cB, n) > 1.96) onceHit++;\n}\n\nout.push(\"진짜 차이가 전혀 없는 두 그룹으로 \" + TRIALS + \"번 실험\");\nout.push(\"(각 그룹 하루 \" + DAILY + \"명 · \" + DAYS + \"일 · 전환율 \" + (P * 100) + \"%)\");\nout.push(\"\");\nout.push(\"규칙                          '이겼다' 가 나온 비율\");\nout.push(\"끝까지 보고 한 번만 판정       \" + (onceHit / TRIALS * 100).toFixed(1) + \"%   (기대 5%)\");\nout.push(\"매일 보고 유의하면 멈춤         \" + (peekHit / TRIALS * 100).toFixed(1) + \"%\");\nout.push(\"\");\nout.push(\"차이가 없는데도 들여다볼수록 이겼다는 결론이 자주 나온다\");\nout.push(\"초반에는 표본이 적어 흔들림이 크고, 그 봉우리에서 멈추기 때문이다\");\nout.push(\"중간에 봐야 한다면 그것을 감안한 방법을 미리 정해 두고 써야 한다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "유의하면 배포해도 되나", type: "decide",
    goal: "14일을 채웠고 상대 1.2% 개선에 유의합니다. 표본이 커서 아주 작은 차이도 유의하게 나옵니다.",
    sit: "어떻게 판단하시겠습니까?",
    opts: [
      { label: "미리 정해 둔 '최소 관심 차이' 와 견주고, 신뢰구간이 그 선을 넘는지 본다",
        fx: { algorithms: 3, communication: 2 },
        fb: "✅ <b>유의하다는 것은 '차이가 0은 아니다' 일 뿐</b>입니다. 표본이 크면 무의미한 차이도 유의해집니다. 실험 전에 '이 정도는 되어야 할 값어치가 있다' 는 선을 정해 두고, 신뢰구간 전체가 그 선을 넘는지 보면 실무적 판단이 됩니다.",
        best: true },
      { label: "유의하니 배포한다",
        fx: { algorithms: -2 },
        fb: "⚠️ 1.2% 개선을 위해 <b>코드 복잡도·유지 비용</b>을 치를 값어치가 있는지는 통계가 답해 주지 않습니다. 유의성은 판단의 출발점이지 결론이 아닙니다." },
      { label: "효과가 작으니 버린다",
        fx: { algorithms: -1 },
        fb: "⚠️ 작다고 무조건 버릴 것도 아닙니다. 매출 규모가 크면 1.2% 도 큰 금액이고, <b>비용이 거의 없는 변경</b>이면 할 값어치가 있습니다. 미리 정한 선과 견주는 것이 답입니다." },
      { label: "표본을 더 모아 다시 본다",
        fx: { algorithms: -1 },
        fb: "⚠️ 표본을 늘리면 <b>더 확실히 유의해질 뿐</b>이고 효과 크기는 그대로입니다. 지금 질문은 '진짜인가' 가 아니라 '값어치가 있는가' 입니다." }] },

  { t: "회고 — 무엇을 미리 정했어야 했나", type: "note",
    goal: "이번 실험에서 <b>시작 전에 정했어야 했는데 안 정한 것</b>을 적으세요.\n다음 실험의 사전 등록 양식으로 만듭니다.",
    ph: "주요 지표 하나 / 최소 관심 차이 / 필요한 표본과 기간 / 중간에 볼 것인가와 그 방법 / 보조 지표는 참고만 / 결과가 반대여도 그대로 따를 것인가" }]
},

/* ─────────────────────────────────────────────── dbt */
{
  lv: 3, em: "📚",
  title: "순서가 뒤바뀐 메시지",
  desc: "이벤트가 순서 없이 도착해 상태가 어긋나는 문제를 재현하고, 버전·타임스탬프·파티션 키로 순서를 지키는 설계를 만든다",
  skills: ["database", "backend", "system_design"],
  phases: [

  { t: "어긋난 상태를 적는다", type: "note",
    goal: "무엇이 어떤 상태로 남았는지, <b>기대한 상태는 무엇이었는지</b> 적으세요.\n원본 이벤트 순서와 처리 순서를 함께 적으면 원인이 반쯤 보입니다.",
    ph: "예: 주문 8821 이 '결제완료' 여야 하는데 '생성됨' · 발생 순서는 created→paid 인데 처리 순서는 paid→created · 하루 30건쯤 · 워커를 3대로 늘린 날부터 시작" },

  { t: "왜 순서가 뒤바뀌는가", type: "decide",
    goal: "워커를 한 대에서 세 대로 늘린 뒤부터 순서 문제가 생겼습니다.",
    sit: "무엇이 원인입니까?",
    opts: [
      { label: "같은 주문의 이벤트가 서로 다른 워커로 흩어져, 각자 다른 속도로 처리된다",
        fx: { database: 3, system_design: 2 },
        fb: "✅ <b>큐가 보장하는 순서는 파티션 안에서만</b>입니다. 여러 워커가 같은 큐를 나눠 먹으면 같은 주문의 두 이벤트가 다른 워커로 가고, 한쪽이 조금 느리면 순서가 뒤집힙니다. 워커가 하나일 때는 이 문제가 없어서 늘린 날부터 시작한 것입니다.",
        best: true },
      { label: "네트워크 지연으로 메시지가 늦게 도착해서",
        fx: { system_design: 1 },
        fb: "△ 원인의 일부입니다. 다만 <b>워커가 하나였을 때는 지연이 있어도 순서가 지켜졌습니다</b> — 큐에서 하나씩 꺼내 처리했기 때문입니다. 늘린 것이 방아쇠입니다." },
      { label: "발행하는 쪽에서 순서를 잘못 보냈다",
        fx: { debugging: 1 },
        fb: "△ 확인할 값어치는 있습니다. 다만 발행 순서가 맞다는 것이 이미 확인됐고, <b>워커 수와 시점이 정확히 맞아떨어집니다.</b>" },
      { label: "DB 복제 지연 때문에",
        fx: { database: -1 },
        fb: "⚠️ 복제 지연이면 '방금 쓴 것을 못 읽는' 증상이 나오지 <b>상태가 뒤로 되돌아가지</b> 않습니다. 증상의 모양이 다릅니다." }] },

  { t: "뒤바뀜을 재현한다", type: "build",
    goal: "이벤트를 <b>여러 워커로 흩어</b> 처리했을 때 최종 상태가 어떻게 되는지 보여 주세요.\n워커 하나일 때와 나란히 둡니다.",
    hint: "각 워커가 조금씩 다른 속도로 돈다고 두면 됩니다. 같은 주문의 이벤트가 다른 워커로 가면 도착 순서가 뒤집힐 수 있고, 상태 전이를 <b>덮어쓰기</b>로 처리하고 있으면 나중에 도착한 옛 이벤트가 새 상태를 지웁니다.",
    acc: "워커 1대와 3대의 최종 상태가 나란히 출력되고, 3대에서 어긋난 주문이 몇 건인지 세어지면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst STAGE = { created: 1, paid: 2, shipped: 3 };\nconst events = [];\nfor (let id = 1; id <= 20; id++) {\n  [\"created\", \"paid\", \"shipped\"].forEach((s, i) => events.push({ id: id, stage: s, seq: i, at: id * 10 + i }));\n}\n\nfunction process(workers) {\n  /* 워커마다 처리 속도가 조금씩 다르다 */\n  const speed = [1.0, 1.4, 0.7];\n  const arrivals = events.map((e, i) => {\n    const w = workers === 1 ? 0 : i % workers;\n    return { e: e, w: w, done: e.at * speed[w % speed.length] };\n  }).sort((a, b) => a.done - b.done);\n\n  const state = {};\n  arrivals.forEach((a) => { state[a.e.id] = a.e.stage; });   // 덮어쓰기\n  return state;\n}\n\nfunction wrong(state) {\n  return Object.keys(state).filter((id) => state[id] !== \"shipped\");\n}\n\n[1, 3].forEach((w) => {\n  const s = process(w);\n  const bad = wrong(s);\n  out.push(\"워커 \" + w + \"대 — 어긋난 주문 \" + bad.length + \"/20\");\n  if (bad.length) out.push(\"    \" + bad.slice(0, 8).map((id) => id + \":\" + s[id]).join(\"  \"));\n});\n\nout.push(\"\");\nout.push(\"큐가 보장하는 순서는 파티션 안에서만이다\");\nout.push(\"같은 주문의 이벤트가 다른 워커로 흩어지면 순서는 보장되지 않는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "순서를 지키게 만든다", type: "build",
    goal: "두 가지 방법을 각각 구현해 비교하세요 — <b>같은 열쇠는 같은 워커로</b> 보내는 것과, <b>더 낮은 버전은 무시</b>하는 것.",
    hint: "첫 번째는 애초에 뒤바뀌지 않게 하는 방법입니다. 주문 번호로 워커를 정하면 같은 주문은 언제나 같은 워커로 갑니다 — 대신 특정 열쇠에 부하가 몰리면 그 워커만 바빠집니다. 두 번째는 뒤바뀌어도 <b>결과가 맞게</b> 만드는 방법입니다. 상태에 버전을 두고 낮은 버전은 버리면 되고, 이쪽이 더 넓게 통합니다.",
    acc: "두 방법 각각의 최종 상태와 어긋난 건수가 나오고, 각 방법의 한계가 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst STAGE = { created: 1, paid: 2, shipped: 3 };\nconst events = [];\nfor (let id = 1; id <= 20; id++) {\n  [\"created\", \"paid\", \"shipped\"].forEach((s, i) => events.push({ id: id, stage: s, ver: i + 1, at: id * 10 + i }));\n}\nconst speed = [1.0, 1.4, 0.7];\n\nfunction run(mode, workers) {\n  const arrivals = events.map((e, i) => {\n    /* 열쇠로 워커를 정하면 같은 주문은 언제나 같은 워커로 간다 */\n    const w = mode === \"key\" ? e.id % workers : i % workers;\n    return { e: e, done: e.at * speed[w % speed.length] };\n  }).sort((a, b) => a.done - b.done);\n\n  const state = {}, ver = {};\n  arrivals.forEach((a) => {\n    if (mode === \"version\") {\n      if ((ver[a.e.id] || 0) >= a.e.ver) return;      // 낮은 버전은 버린다\n      ver[a.e.id] = a.e.ver;\n    }\n    state[a.e.id] = a.e.stage;\n  });\n  return Object.keys(state).filter((id) => state[id] !== \"shipped\").length;\n}\n\nout.push(\"방법                        워커 3대에서 어긋난 건수\");\nout.push(\"아무것도 안 함\".padEnd(28) + run(\"none\", 3) + \"/20\");\nout.push(\"같은 열쇠는 같은 워커로\".padEnd(24) + run(\"key\", 3) + \"/20\");\nout.push(\"낮은 버전은 무시\".padEnd(26) + run(\"version\", 3) + \"/20\");\n\nout.push(\"\");\nout.push(\"각 방법의 한계\");\nout.push(\"  열쇠로 나누기 — 특정 열쇠에 부하가 몰리면 그 워커만 바빠진다\");\nout.push(\"                 워커 수를 바꾸면 배정이 통째로 달라진다\");\nout.push(\"  버전으로 거르기 — 뒤바뀌어도 결과가 맞다. 더 넓게 통한다\");\nout.push(\"                   대신 버전을 어디서 매길지 정해야 한다\");\nout.push(\"\");\nout.push(\"둘을 함께 쓰는 것이 흔하다 — 나누어 순서를 지키고, 버전으로 한 번 더 막는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "버전을 어디서 매길 것인가", type: "decide",
    goal: "버전으로 거르기로 했는데, 그 번호를 누가 매길지 정해야 합니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "원본 데이터를 가진 쪽에서 매긴다 — 그 행이 바뀔 때마다 하나씩 올린다",
        fx: { database: 3, system_design: 2 },
        fb: "✅ <b>진실을 가진 쪽이 순서도 알고 있습니다.</b> DB 행에 버전 컬럼을 두고 갱신할 때마다 올리면, 그 값을 이벤트에 실어 보내는 것만으로 순서가 따라옵니다. 이벤트가 여러 경로로 복제돼도 버전은 그대로라 어디서 걸러도 결과가 같습니다.",
        best: true },
      { label: "발행 시각(타임스탬프)을 쓴다",
        fx: { database: 1 },
        fb: "△ 흔히 쓰지만 두 가지 함정이 있습니다. 서버 시계가 <b>몇 밀리초씩 어긋나고</b>, 같은 밀리초에 두 이벤트가 생기면 순서를 못 정합니다. 보조 수단으로는 쓸 만합니다." },
      { label: "큐가 매기는 일련번호를 쓴다",
        fx: { database: 1 },
        fb: "△ 파티션 안에서는 정확합니다. 다만 <b>파티션이 다르면 견줄 수 없고</b>, 큐를 바꾸면 번호 체계가 통째로 달라집니다. 큐에 묶이는 설계가 됩니다." },
      { label: "받는 쪽에서 도착 순서대로 매긴다",
        fx: { database: -3 },
        fb: "⚠️ 지금 문제가 <b>도착 순서가 틀렸다</b>는 것인데, 그 틀린 순서로 번호를 매기면 아무것도 해결되지 않습니다." }] },

  { t: "회고 — 어디까지 보장하기로 했나", type: "note",
    goal: "무엇을 <b>보장하고 무엇은 보장하지 않기로</b> 했는지 적으세요.\n보장하지 않기로 한 것에 대해서는 어떻게 대응하는지도 적습니다.",
    ph: "보장하는 것(예: 같은 주문 안의 순서) / 보장 안 하는 것(예: 주문 간 순서) / 버전을 매기는 자리 / 낮은 버전이 버려질 때 남기는 기록 / 어긋난 30건을 어떻게 고쳤나" }]
},

/* ─────────────────────────────────────────────── arch */
{
  lv: 4, em: "🗃️",
  title: "캐시를 믿을 수 있게 만든다",
  desc: "빨라지려고 넣은 캐시가 낡은 값·쏠림·동시 재계산으로 문제를 만드는 상황을 다루고, 무효화 전략을 명시적으로 정한다",
  skills: ["arch", "backend", "performance"],
  phases: [

  { t: "무엇을 캐시하고 있는지 적는다", type: "note",
    goal: "지금 캐시하는 것들을 <b>낡아도 되는 정도</b>로 나눠 적으세요.\n같은 캐시에 성격이 다른 것이 섞이면 규칙을 정할 수 없습니다.",
    ph: "예: 상품 상세 — 5분 낡아도 됨 · 재고 수량 — 낡으면 안 됨(주문 실패) · 사용자 프로필 — 1분 · 환율 — 10분 · 권한 정보 — 낡으면 보안 문제 · 지금은 전부 TTL 60초로 통일" },

  { t: "무엇을 캐시하지 말아야 하는가", type: "decide",
    goal: "재고 수량도 캐시에 들어 있어, 품절인데 주문이 들어오는 일이 생깁니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "재고는 캐시에서 빼고, 최종 판정은 언제나 원본에서 한다",
        fx: { system_design: 3, database: 2 },
        fb: "✅ <b>틀리면 안 되는 값은 캐시하지 않습니다.</b> 목록 화면에 '대략 남았음' 을 보여 주려고 캐시한 값을 쓰는 것은 괜찮지만, 주문을 확정하는 순간에는 원본에서 조건부로 차감해야 합니다. 보여 주기용과 판정용을 나누는 것이 핵심입니다.",
        best: true },
      { label: "재고만 TTL 을 1초로 줄인다",
        fx: { performance: -1 },
        fb: "⚠️ 1초 안에도 팔립니다. <b>확률을 줄일 뿐 없애지 못하고</b>, 캐시 효과도 거의 사라져 얻는 것이 없습니다." },
      { label: "재고가 바뀔 때마다 캐시를 지운다",
        fx: { system_design: 1 },
        fb: "△ 방향은 맞지만 지우는 것과 읽는 것 사이에 여전히 틈이 있습니다. 인기 상품은 초당 수십 번 바뀌어 <b>지우느라 더 바빠지기도</b> 합니다." },
      { label: "주문 실패를 사용자에게 잘 안내한다",
        fx: { communication: 1, system_design: -1 },
        fb: "△ 필요한 배려지만 원인은 그대로입니다. 재고는 애초에 <b>초과 판매가 나면 안 되는 값</b>이라 안내로 덮을 문제가 아닙니다." }] },

  { t: "무효화 전략을 견준다", type: "build",
    goal: "캐시를 언제 버릴지 정하는 방법들을 <b>낡음의 정도와 비용</b>으로 견주는 표를 만드세요.",
    hint: "세 가지가 있습니다 — 시간이 지나면 버리기(간단하지만 그 시간만큼 낡는다), 바뀔 때 지우기(정확하지만 지우는 곳을 다 알아야 한다), 바뀔 때 새 값을 넣기(빠르지만 안 쓰일 값도 계산한다). <b>어느 것이 옳은지는 데이터마다 다릅니다.</b>",
    acc: "전략별 최대 낡음·쓰기 비용·구현 복잡도가 표로 나오고, 데이터 성격별 추천이 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst STRATS = [\n  { n: \"TTL 만료\", staleSec: 60, writeCost: 0, complexity: 1 },\n  { n: \"바뀔 때 삭제\", staleSec: 0.05, writeCost: 1, complexity: 2 },\n  { n: \"바뀔 때 갱신\", staleSec: 0.05, writeCost: 3, complexity: 3 },\n  { n: \"캐시 안 함\", staleSec: 0, writeCost: 0, complexity: 0 }\n];\n\nconst DATA = [\n  { n: \"상품 상세\", tolerate: 300, reads: 10000, writes: 5 },\n  { n: \"재고 수량\", tolerate: 0, reads: 20000, writes: 3000 },\n  { n: \"사용자 프로필\", tolerate: 60, reads: 800, writes: 20 },\n  { n: \"권한 정보\", tolerate: 5, reads: 5000, writes: 10 }\n];\n\nout.push(\"전략           최대 낡음   쓰기 비용   복잡도\");\nSTRATS.forEach((s) => out.push(s.n.padEnd(15) +\n  (s.staleSec + \"초\").padEnd(12) + String(s.writeCost).padEnd(12) + s.complexity));\n\nout.push(\"\");\nout.push(\"데이터          허용 낡음   읽기/쓰기 비   추천\");\nDATA.forEach((d) => {\n  const ratio = d.writes ? Math.round(d.reads / d.writes) : Infinity;\n  let pick;\n  if (d.tolerate === 0) pick = \"캐시 안 함 (판정용)\";\n  else if (ratio < 20) pick = \"캐시 안 함 (쓰기가 잦다)\";\n  else if (d.tolerate >= 60) pick = \"TTL 만료\";\n  else pick = \"바뀔 때 삭제\";\n  out.push(d.n.padEnd(16) + (d.tolerate + \"초\").padEnd(12) +\n    (ratio + \":1\").padEnd(15) + pick);\n});\n\nout.push(\"\");\nout.push(\"읽기가 쓰기보다 훨씬 많을 때만 캐시가 이득이다\");\nout.push(\"틀리면 안 되는 값은 아예 캐시하지 않는다 — TTL 을 줄이는 것으로는 안 된다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "동시에 다시 계산하는 것을 막는다", type: "build",
    goal: "인기 있는 값의 캐시가 만료되는 순간 <b>수백 개의 요청이 동시에</b> 원본을 때리는 상황을 재현하고 막으세요.",
    hint: "만료 순간에 몰리는 요청이 전부 '캐시에 없네' 를 보고 각자 계산에 들어갑니다. 막는 방법은 <b>첫 하나만 계산하게 하고 나머지는 기다리게</b> 하는 것입니다. 또 하나, 여러 열쇠가 <b>같은 시각에 함께 만료되지</b> 않도록 만료 시각에 약간의 흔들림을 주면 몰림 자체가 흩어집니다.",
    acc: "잠금 없을 때와 있을 때의 원본 호출 횟수가 나오고, 만료 시각에 흔들림을 준 효과가 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 만료 직후 300개가 '거의 동시에' 도착한다 — 첫 계산이 끝나기 전에 전부 온다.\n   계산에 40ms 가 걸리고 요청은 0.1ms 간격으로 온다고 두면 실제와 같은 모양이 된다. */\nconst CALC_MS = 40, GAP_MS = 0.1, N = 300;\n\nfunction run(useLock) {\n  let ready = Infinity;       // 값이 채워지는 시각 — 아직 없다\n  let inFlight = false;\n  let origin = 0, waited = 0, served = 0;\n  for (let i = 0; i < N; i++) {\n    const at = i * GAP_MS;\n    if (at >= ready) { served++; continue; }   // 값이 이미 채워졌다\n    if (useLock && inFlight) { waited++; continue; }\n    origin++;\n    inFlight = true;\n    ready = Math.min(ready, at + CALC_MS);     // 가장 먼저 끝난 계산이 값을 채운다\n  }\n  return { origin: origin, waited: waited, served: served };\n}\n\nout.push(\"만료 직후 \" + N + \"개 요청 (계산 \" + CALC_MS + \"ms · 도착 간격 \" + GAP_MS + \"ms)\");\nout.push(\"\");\nout.push(\"            원본 호출   기다린 요청   캐시로 처리\");\n[[false, \"잠금 없음\"], [true, \"잠금 있음\"]].forEach((c) => {\n  const r = run(c[0]);\n  out.push(c[1].padEnd(12) + String(r.origin).padStart(6) + \"회\" +\n    String(r.waited).padStart(12) + String(r.served).padStart(14));\n});\nout.push(\"\");\nout.push(\"잠금이 없으면 값이 채워지기 전에 온 요청이 전부 각자 계산에 들어간다\");\n\n/* 여러 열쇠가 같은 시각에 함께 만료되는 것도 몰림을 만든다 */\nfunction expiry(jitter) {\n  const b = {};\n  for (let k = 0; k < 1000; k++) {\n    const j = jitter ? (Math.imul(k, 2654435761) >>> 0) % 21 - 10 : 0;\n    const at = 60 + j;\n    b[at] = (b[at] || 0) + 1;\n  }\n  return { spread: Object.keys(b).length, max: Math.max.apply(null, Object.keys(b).map((k) => b[k])) };\n}\nconst a = expiry(false), z = expiry(true);\nout.push(\"\");\nout.push(\"열쇠 1000개의 만료 시각\");\nout.push(\"  흔들림 없음    퍼진 초 \" + String(a.spread).padStart(3) + \"   한 초에 몰린 최대 \" + a.max);\nout.push(\"  흔들림 ±10초   퍼진 초 \" + String(z.spread).padStart(3) + \"   한 초에 몰린 최대 \" + z.max);\nout.push(\"\");\nout.push(\"첫 하나만 계산하게 하면 만료 순간의 몰림이 사라진다\");\nout.push(\"만료 시각을 흩뿌리면 몰림 자체가 여러 초로 나뉜다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "적중률과 이득을 잰다", type: "build",
    goal: "캐시가 <b>실제로 이득인지</b> 계산하세요.\n적중률과 원본 비용을 받아 평균 응답 시간과 원본 부하 감소를 구합니다.",
    hint: "캐시는 공짜가 아닙니다 — 조회 비용, 저장 비용, 낡은 값의 위험이 있습니다. <b>적중률이 낮으면 캐시 조회 시간만 더해질 뿐</b>이고, 대략 적중률이 어느 선을 넘어야 이득이 시작됩니다. 그 선을 계산해 두면 '이 캐시를 유지할 값어치가 있는가' 에 답할 수 있습니다.",
    acc: "적중률별 평균 시간과 원본 부하가 나오고, 이득이 시작되는 적중률이 계산되어 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst ORIGIN_MS = 45;      // 원본에서 가져오는 데 드는 시간\nconst CACHE_MS = 2;        // 캐시 조회\n\nfunction avgMs(hit) { return hit * CACHE_MS + (1 - hit) * (CACHE_MS + ORIGIN_MS); }\n\nout.push(\"적중률   평균 시간   캐시 없을 때 대비   원본 부하\");\n[0, 0.2, 0.5, 0.8, 0.95, 0.99].forEach((h) => {\n  const ms = avgMs(h);\n  const gain = (1 - ms / ORIGIN_MS) * 100;\n  out.push((h * 100).toFixed(0).padStart(4) + \"%    \" +\n    (ms.toFixed(1) + \"ms\").padEnd(12) +\n    (gain >= 0 ? \"-\" + gain.toFixed(0) + \"%\" : \"+\" + (-gain).toFixed(0) + \"% 느림\").padEnd(19) +\n    ((1 - h) * 100).toFixed(0) + \"%\");\n});\n\n/* 이득이 시작되는 적중률 — 캐시 조회 비용을 원본 비용으로 나눈 값 */\nconst breakEven = CACHE_MS / ORIGIN_MS;\nout.push(\"\");\nout.push(\"이득이 시작되는 적중률: \" + (breakEven * 100).toFixed(1) + \"%\");\nout.push(\"→ 그보다 낮으면 캐시 조회 시간만 더해질 뿐이다\");\nout.push(\"\");\nout.push(\"원본 비용이 클수록 낮은 적중률에서도 이득이 난다\");\nout.push(\"적중률을 재지 않는 캐시는 이득인지 손해인지 알 수 없다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 무엇을 명시적으로 정했나", type: "note",
    goal: "캐시하는 것마다 <b>낡아도 되는 시간과 무효화 방법</b>을 적어 두세요.\n적어 두지 않은 캐시는 시간이 지나면 아무도 규칙을 모르게 됩니다.",
    ph: "데이터별 허용 낡음과 전략 / 캐시하지 않기로 한 것과 이유 / 적중률 실측 / 만료 몰림을 막은 방법 / 캐시를 껐을 때 서비스가 버티는가" }]
}

]};
