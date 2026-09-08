/* 두 번째 프로젝트 묶음 7 — 아직 프로젝트가 하나뿐인 트랙들 (1/2).
   CS 기초 · AI · 수학 · 모바일 · PHP. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── cs */
{
  lv: 3, em: "🧊",
  title: "왜 캐시가 있으면 빨라지는가",
  desc: "같은 계산인데 배열을 어떤 순서로 훑느냐에 따라 몇 배가 갈리는 이유를 지역성과 캐시 줄로 설명하고 직접 재어 확인한다",
  skills: ["cs", "performance", "algorithms"],
  phases: [

  { t: "무엇이 빠른지 먼저 적는다", type: "note",
    goal: "같은 계산의 두 가지 구현을 적고, <b>어느 쪽이 빠를 것 같은지</b> 미리 적으세요.\n예측을 적어 두어야 나중에 무엇을 배웠는지 알 수 있습니다.",
    ph: "예: 2차원 배열 합계를 행 우선으로 훑기 vs 열 우선으로 훑기 · 연산 수는 같음 · 예측: 비슷할 것 같다 · 실제로는 몇 배 차이가 났나?" },

  { t: "같은 연산인데 왜 다를까", type: "decide",
    goal: "행 우선으로 훑는 것이 열 우선보다 6배 빠릅니다. 더한 횟수는 똑같습니다.",
    sit: "무엇 때문입니까?",
    opts: [
      { label: "메모리를 한 칸씩 읽는 것이 아니라 줄 단위로 가져오기 때문 — 옆 칸을 이미 들고 있다",
        fx: { algorithms: 3, performance: 3 },
        fb: "✅ <b>메모리는 바이트가 아니라 줄(cache line) 단위로 옮겨집니다.</b> 한 칸을 읽으면 그 옆 수십 칸이 함께 딸려 오므로, 이어서 옆 칸을 읽으면 공짜입니다. 열 우선으로 훑으면 매번 다른 줄을 가져와야 해서 딸려 온 것이 전부 버려집니다. 연산 수는 같아도 <b>메모리를 가져온 횟수</b>가 다릅니다.",
        best: true },
      { label: "컴파일러가 행 우선을 더 잘 최적화해서",
        fx: { performance: 1 },
        fb: "△ 실제로 벡터화 같은 최적화가 붙기 쉬운 것은 맞습니다. 다만 그 최적화가 가능한 <b>이유 자체가</b> 이어진 메모리이기 때문이라, 근본 원인은 같습니다." },
      { label: "배열이 행 우선으로 저장되어 있어서",
        fx: { algorithms: 2, performance: 1 },
        fb: "△ 절반은 맞습니다. 저장 순서가 그렇기 때문에 행 우선 훑기가 <b>이어진 주소</b>를 읽게 됩니다. 다만 '왜 이어진 것이 빠른가' 가 핵심이고, 그 답이 캐시 줄입니다." },
      { label: "분기 예측이 더 잘 맞아서",
        fx: { performance: -1 },
        fb: "⚠️ 두 방식의 분기 구조는 같습니다. 반복문의 조건은 똑같이 예측하기 쉬우므로 <b>여기서 갈리지 않습니다.</b>" }] },

  { t: "메모리를 가져온 횟수를 센다", type: "build",
    goal: "행 우선과 열 우선이 <b>캐시 줄을 몇 번 가져오는지</b> 세어 비교하세요.\n연산 수가 같은데 가져오는 횟수가 다른 것을 보입니다.",
    hint: "캐시 줄 하나에 몇 개의 값이 들어가는지 정하고, 훑는 순서대로 <b>어느 줄을 건드리는지</b>를 따라가면 됩니다. 이미 들고 있는 줄이면 공짜고, 아니면 가져와야 합니다. 캐시가 무한하지 않으므로 오래된 줄은 버려진다는 것도 넣어야 실제와 비슷해집니다.",
    acc: "두 방식의 연산 수·캐시 적중률·가져온 횟수가 나란히 출력되고, 연산 수는 같은데 가져온 횟수가 다른 것이 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst ROWS = 512, COLS = 512;\nconst PER_LINE = 16;        // 캐시 줄 하나에 값 16개\nconst LINES = 256;          // 캐시가 담을 수 있는 줄 수\n\nfunction walk(rowMajor) {\n  const cache = new Set();\n  const order = [];\n  let ops = 0, miss = 0, hit = 0;\n  const touch = (idx) => {\n    const line = Math.floor(idx / PER_LINE);\n    if (cache.has(line)) { hit++; return; }\n    miss++;\n    cache.add(line); order.push(line);\n    if (cache.size > LINES) { cache.delete(order.shift()); }   // 오래된 줄부터 버린다\n  };\n  if (rowMajor) {\n    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { touch(r * COLS + c); ops++; }\n  } else {\n    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { touch(r * COLS + c); ops++; }\n  }\n  return { ops: ops, miss: miss, hit: hit, rate: hit / ops };\n}\n\nconst a = walk(true), b = walk(false);\nout.push(\"배열 \" + ROWS + \"×\" + COLS + \" · 캐시 줄당 값 \" + PER_LINE + \"개 · 캐시 \" + LINES + \"줄\");\nout.push(\"\");\nout.push(\"방식        더한 횟수   적중률   가져온 줄\");\nout.push(\"행 우선      \" + String(a.ops).padEnd(12) + (a.rate * 100).toFixed(1).padStart(5) + \"%   \" + a.miss);\nout.push(\"열 우선      \" + String(b.ops).padEnd(12) + (b.rate * 100).toFixed(1).padStart(5) + \"%   \" + b.miss);\n\nout.push(\"\");\nout.push(\"더한 횟수는 같은가: \" + (a.ops === b.ops));\nout.push(\"가져온 줄 수는 \" + (b.miss / a.miss).toFixed(1) + \"배 차이\");\nout.push(\"\");\nout.push(\"메모리는 바이트가 아니라 줄 단위로 옮겨진다\");\nout.push(\"한 칸을 읽으면 옆 \" + (PER_LINE - 1) + \"칸이 함께 딸려 온다 — 이어서 읽으면 공짜다\");\nout.push(\"열 우선은 매번 다른 줄을 가져와 딸려 온 것을 전부 버린다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "실제로 재 본다", type: "build",
    goal: "두 방식의 <b>실제 시간</b>을 재세요.\n예측한 배수와 실제 배수를 견줍니다.",
    hint: "측정은 흔들리므로 여러 번 재서 <b>가장 빠른 값</b>끼리 견줍니다. 잡음은 시간을 늘리기만 하기 때문입니다. 배열 크기를 바꿔 가며 재면 <b>캐시에 다 들어가는 크기</b>와 안 들어가는 크기에서 차이가 갈리는 것도 보입니다.",
    acc: "크기별로 두 방식의 시간과 배수가 나오고, 작은 배열에서는 차이가 적고 큰 배열에서 벌어지는 것이 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 배열을 만드는 비용이 측정에 섞이면 안 된다 — 미리 만들어 두고 훑기만 잰다 */\nfunction make(n) {\n  const a = new Float64Array(n * n);\n  for (let i = 0; i < a.length; i++) a[i] = i % 7;\n  return a;\n}\nfunction sumRow(a, n) { let s = 0; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s += a[r * n + c]; return s; }\nfunction sumCol(a, n) { let s = 0; for (let c = 0; c < n; c++) for (let r = 0; r < n; r++) s += a[r * n + c]; return s; }\n\nfunction timeIt(fn, reps) {\n  fn();                                    // 예열 — 첫 실행은 컴파일이 섞인다\n  let best = Infinity;\n  for (let i = 0; i < reps; i++) {\n    const t0 = Date.now();\n    if (fn() === -1) throw new Error(\"최적화로 사라지지 않게 결과를 쓴다\");\n    const d = Date.now() - t0;\n    if (d < best) best = d;\n  }\n  return Math.max(best, 1);\n}\n\n/* 작은 배열은 한 번 훑는 데 1ms 도 안 걸려 재는 눈금보다 짧다.\n   같은 총 작업량이 되도록 여러 번 반복해서 잰다. */\nconst WORK = 40000000;\nout.push(\"크기          훑는 횟수   행 우선   열 우선   배수\");\n[256, 700, 1500].forEach((n) => {\n  const a = make(n);                       // 시간 밖에서 만든다\n  const passes = Math.max(1, Math.round(WORK / (n * n)));\n  const many = (fn) => () => { let s = 0; for (let i = 0; i < passes; i++) s += fn(a, n); return s; };\n  const rm = timeIt(many(sumRow), 3);\n  const cm = timeIt(many(sumCol), 3);\n  out.push((n + \"×\" + n).padEnd(14) + String(passes).padEnd(12) +\n    (rm + \"ms\").padEnd(10) + (cm + \"ms\").padEnd(10) + (cm / rm).toFixed(1) + \"배\");\n});\n\nout.push(\"\");\nout.push(\"작은 배열은 통째로 캐시에 들어가 차이가 거의 없다\");\nout.push(\"커질수록 벌어진다 — 캐시에 안 들어가는 순간부터 순서가 값을 갖는다\");\nout.push(\"\");\nout.push(\"재는 코드에서 조심할 것 셋\");\nout.push(\"  · 배열을 만드는 비용을 시간 안에 넣지 않는다\");\nout.push(\"  · 첫 실행은 컴파일이 섞이므로 예열한다\");\nout.push(\"  · 여러 번 재서 가장 빠른 값끼리 견준다 — 잡음은 시간을 늘리기만 한다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "무엇에 이 지식을 쓸 것인가", type: "decide",
    goal: "이 성질을 실제 코드에 어떻게 반영할지 정해야 합니다.",
    sit: "어디에 적용하시겠습니까?",
    opts: [
      { label: "큰 데이터를 반복해 훑는 자리에만 — 대부분의 코드에서는 신경 쓰지 않는다",
        fx: { performance: 3, coding: 2 },
        fb: "✅ <b>이 차이는 데이터가 캐시보다 클 때만 나타납니다.</b> 항목이 수백 개인 목록에서는 아무 차이가 없고, 그런 곳에서 순서를 신경 쓰면 코드만 읽기 어려워집니다. 큰 배열을 반복해 훑는 자리 — 이미지 처리, 행렬 연산, 대량 집계 — 에만 적용합니다.",
        best: true },
      { label: "모든 반복문에서 접근 순서를 신경 쓴다",
        fx: { coding: -2 },
        fb: "⚠️ 대부분의 반복문은 <b>데이터가 작아 차이가 없습니다.</b> 읽기 어려운 코드를 얻고 아무것도 얻지 못합니다." },
      { label: "자료구조를 전부 배열로 바꾼다",
        fx: { coding: -1, performance: 1 },
        fb: "△ 배열이 이어져 있어 유리한 것은 맞지만, <b>중간 삽입·삭제가 잦으면</b> 그쪽 비용이 훨씬 큽니다. 쓰는 방식에 맞는 자료구조를 고르는 것이 먼저입니다." },
      { label: "컴파일러 최적화 옵션을 올린다",
        fx: { performance: 1 },
        fb: "△ 도움이 되고 해야 할 일입니다. 다만 <b>접근 순서 자체를 바꿔 주지는 못하므로</b>, 열 우선 반복문은 여전히 느립니다." }] },

  { t: "회고 — 예측이 맞았나", type: "note",
    goal: "처음에 적은 예측과 실제 결과를 견주세요.\n<b>왜 틀렸는지</b>를 적는 것이 이 회고의 목적입니다.",
    ph: "예측한 배수 / 실제 배수 / 어느 크기부터 벌어졌나 / 캐시 크기를 어떻게 짐작했나 / 이 지식을 실제로 쓸 만한 자리 / 안 쓸 자리" }]
},

/* ─────────────────────────────────────────────── ai */
{
  lv: 4, em: "🤖",
  title: "LLM 이 그럴듯한 거짓말을 한다",
  desc: "언어 모델이 틀린 답을 자신 있게 내놓는 상황을 근거 붙이기·검증 단계·거절 경로로 다루고, 어디까지 믿을지 선을 그어 둔다",
  skills: ["ai", "backend", "security"],
  phases: [

  { t: "어떤 거짓말인지 분류한다", type: "note",
    goal: "실제로 나온 <b>틀린 답들을 모아</b> 유형별로 나누세요.\n유형마다 대응이 다르므로 뭉뚱그리면 고칠 수 없습니다.",
    ph: "예: 없는 정책 조항을 만들어 냄(사실 지어내기) · 있는 조항인데 내용이 다름(왜곡) · 옛 규정으로 답함(오래된 지식) · 질문을 잘못 알아들음(오해) · 100건 중 12건 · 그중 8건이 지어내기" },

  { t: "무엇으로 줄일 것인가", type: "decide",
    goal: "정책 문서를 근거로 답해야 하는데 없는 조항을 만들어 냅니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "실제 문서를 찾아 붙여 주고, 그 안에서만 답하게 하며, 근거를 함께 내게 한다",
        fx: { algorithms: 3, security: 2 },
        fb: "✅ <b>모델이 기억으로 답하는 한 지어내기를 막을 수 없습니다.</b> 질문에 맞는 문서를 찾아 붙여 주고 '이 안에 없으면 모른다고 답하라' 고 두면, 지어낼 재료 자체가 줄어듭니다. 근거 인용을 함께 내게 하면 사람이 그 자리에서 확인할 수 있고, 근거를 못 대는 답은 자동으로 걸러집니다.",
        best: true },
      { label: "프롬프트에 '거짓말하지 마라' 를 넣는다",
        fx: { algorithms: -1 },
        fb: "⚠️ 모델은 <b>자기가 틀렸다는 것을 모릅니다.</b> 지어내는 순간에도 맞다고 여기므로, 지시만으로는 거의 줄지 않습니다." },
      { label: "더 큰 모델로 바꾼다",
        fx: { algorithms: 1, performance: -1 },
        fb: "△ 줄기는 합니다. 다만 <b>없앨 수는 없고</b> 값과 지연이 늘어납니다. 근거를 붙이는 것이 훨씬 큰 효과를 냅니다." },
      { label: "온도를 0으로 낮춘다",
        fx: { algorithms: 1 },
        fb: "△ 같은 질문에 같은 답이 나와 재현성이 좋아집니다. 다만 <b>일관되게 틀린 답</b>이 나올 뿐, 지어내기 자체는 줄지 않습니다." }] },

  { t: "근거를 붙여 답하게 한다", type: "build",
    goal: "질문에 맞는 문서 조각을 <b>골라 붙이고</b>, 답이 그 조각에 근거하는지 확인하는 절차를 만드세요.",
    hint: "핵심은 두 가지입니다 — 관련 있는 조각만 골라 붙이는 것(넣을 수 있는 양이 정해져 있다)과, <b>답에 인용한 조각 번호를 달게</b> 하는 것입니다. 인용이 없거나 없는 번호를 대면 그 답은 근거가 없다는 뜻이므로 사람에게 넘기거나 거절합니다.",
    acc: "질문별로 고른 조각과 답의 근거 여부가 판정되고, 근거 없는 답이 걸러지는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst docs = [\n  { id: 1, t: \"환불은 구매 후 7일 이내에 신청할 수 있다.\" },\n  { id: 2, t: \"디지털 상품은 다운로드 전에만 환불된다.\" },\n  { id: 3, t: \"배송비는 단순 변심의 경우 구매자가 부담한다.\" },\n  { id: 4, t: \"교환은 동일 상품에 한해 1회 가능하다.\" }\n];\n\nfunction retrieve(q, k) {\n  const words = q.split(/\\s+/).filter((w) => w.length > 1);\n  return docs.map((d) => ({ d: d, score: words.filter((w) => d.t.indexOf(w) >= 0).length }))\n    .filter((x) => x.score > 0)\n    .sort((a, b) => b.score - a.score).slice(0, k).map((x) => x.d);\n}\n\n/* 답에 [n] 형태로 인용이 달려 있어야 하고, 그 n 이 붙여 준 조각이어야 한다 */\nfunction check(answer, given) {\n  const cited = (answer.match(/\\[(\\d+)\\]/g) || []).map((s) => Number(s.slice(1, -1)));\n  const ids = given.map((d) => d.id);\n  if (!cited.length) return [false, \"인용이 없다 — 근거를 확인할 수 없다\"];\n  const bad = cited.filter((c) => ids.indexOf(c) < 0);\n  if (bad.length) return [false, \"붙여 주지 않은 조각을 인용했다: \" + bad.join(\",\")];\n  return [true, \"근거 \" + cited.join(\",\") + \" 확인\"];\n}\n\nconst cases = [\n  { q: \"환불 신청 기간\", a: \"구매 후 7일 이내입니다 [1].\" },\n  { q: \"환불 신청 기간\", a: \"구매 후 30일 이내입니다.\" },\n  { q: \"환불 배송비\", a: \"단순 변심이면 구매자 부담입니다 [3][9].\" },\n  { q: \"해외 배송 기간\", a: \"보통 7~14일 걸립니다 [1].\" }\n];\n\ncases.forEach((c) => {\n  const given = retrieve(c.q, 2);\n  const [ok, why] = check(c.a, given);\n  out.push(\"질문: \" + c.q);\n  out.push(\"  붙인 조각: \" + (given.length ? given.map((d) => d.id).join(\",\") : \"없음\"));\n  out.push(\"  답: \" + c.a);\n  out.push(\"  \" + (ok ? \"통과\" : \"차단\") + \" — \" + why);\n  out.push(\"\");\n});\n\nout.push(\"인용이 없거나 없는 번호를 대면 그 답은 근거가 없다\");\nout.push(\"붙일 조각이 하나도 없으면 답하지 말고 모른다고 해야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "모른다고 말하게 만든다", type: "build",
    goal: "답할 근거가 <b>모자랄 때 거절</b>하는 판정을 만드세요.\n거절 기준을 바꿔 가며 놓침과 헛답의 균형을 봅니다.",
    hint: "거절은 공짜가 아닙니다 — 너무 자주 거절하면 쓸모없는 도우미가 되고, 너무 안 하면 지어냅니다. 관련도 점수에 <b>문턱</b>을 두고 그 값을 바꿔 가며, 답할 수 있었는데 거절한 경우와 지어낸 경우를 함께 세면 적당한 자리가 보입니다.",
    acc: "문턱별로 답한 비율·정답률·지어낸 건수가 나오고, 균형점이 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nlet seed = 777001;\nfunction rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }\n\n/* 질문마다 '가장 관련 있는 조각의 점수' 와 '문서에 답이 실제로 있는가'.\n   두 무리는 겹친다 — 겹치지 않으면 문턱을 고르는 일 자체가 없다. */\nconst qs = [];\nfor (let i = 0; i < 400; i++) {\n  const has = rnd() < 0.65;\n  const score = Math.max(0, Math.min(1, (has ? 0.62 : 0.34) + (rnd() - 0.5) * 0.5));\n  qs.push({ has: has, score: score });\n}\n\nfunction run(thresh) {\n  let answered = 0, right = 0, made = 0, refusedButHad = 0;\n  qs.forEach((q) => {\n    if (q.score < thresh) { if (q.has) refusedButHad++; return; }\n    answered++;\n    if (q.has) right++; else made++;          // 근거 없이 답하면 지어낸 것이다\n  });\n  return { answered: answered, right: right, made: made, refusedButHad: refusedButHad,\n    acc: answered ? right / answered : 1 };\n}\n\nout.push(\"질문 \" + qs.length + \"건 · 그중 문서에 답이 있는 것 \" +\n  qs.filter((q) => q.has).length + \"건\");\nout.push(\"\");\nout.push(\"문턱   답한 비율   답 중 정답률   지어낸 건수   답할 수 있었는데 거절\");\nconst rows = [];\n[0, 0.2, 0.35, 0.45, 0.55, 0.65, 0.8].forEach((t) => {\n  const r = run(t);\n  rows.push({ t: t, r: r });\n  out.push(t.toFixed(2).padEnd(7) +\n    (r.answered / qs.length * 100).toFixed(0).padStart(6) + \"%   \" +\n    (r.acc * 100).toFixed(0).padStart(9) + \"%   \" +\n    String(r.made).padStart(10) + \"   \" + String(r.refusedButHad).padStart(14));\n});\n\n/* 지어낸 답 한 건이 거절 한 건보다 몇 배 비싼가 — 그 비로 총 손해를 잰다 */\nout.push(\"\");\nout.push(\"지어내기가 거절보다 비싼 정도에 따른 최적 문턱\");\n[1, 5, 20].forEach((ratio) => {\n  const best = rows.slice().sort((a, b) =>\n    (a.r.made * ratio + a.r.refusedButHad) - (b.r.made * ratio + b.r.refusedButHad))[0];\n  out.push(\"  \" + String(ratio).padStart(2) + \"배   문턱 \" + best.t.toFixed(2) +\n    \"   지어냄 \" + String(best.r.made).padStart(3) +\n    \"   헛거절 \" + String(best.r.refusedButHad).padStart(3));\n});\n\nout.push(\"\");\nout.push(\"두 무리가 겹치므로 지어내기를 0으로 만들면 답할 수 있던 것도 거절하게 된다\");\nout.push(\"거절은 공짜가 아니다 — 너무 자주 하면 쓸모없는 도우미가 된다\");\nout.push(\"어느 쪽이 더 비싼지를 정해야 문턱이 정해진다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "무엇을 사람에게 넘길 것인가", type: "decide",
    goal: "거절하거나 근거가 약한 질문을 어떻게 처리할지 정해야 합니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "영향이 큰 주제는 처음부터 사람에게 보내고, 나머지는 근거가 약할 때만 넘긴다",
        fx: { system_design: 3, security: 2 },
        fb: "✅ <b>틀렸을 때의 값이 주제마다 다릅니다.</b> 환불 금액이나 계약 조건은 한 번 틀리면 회수하기 어려우므로 근거가 충분해도 사람이 봅니다. 배송 조회처럼 값싼 것은 자동으로 답하고 근거가 약할 때만 넘기면, 사람의 시간을 정말 필요한 곳에 씁니다.",
        best: true },
      { label: "전부 사람이 확인한 뒤 내보낸다",
        fx: { performance: -2, system_design: -1 },
        fb: "⚠️ 안전하지만 <b>자동화의 값어치가 사라집니다.</b> 응답이 느려지고 사람이 병목이 되어, 결국 대충 확인하게 됩니다." },
      { label: "모델이 스스로 확신도를 말하게 하고 그것으로 나눈다",
        fx: { algorithms: -1 },
        fb: "⚠️ 모델이 말하는 확신도는 <b>실제 정확도와 잘 맞지 않습니다.</b> 지어낼 때도 자신 있게 말하므로, 이것을 기준으로 삼으면 가장 위험한 답이 통과합니다." },
      { label: "사용자가 '이 답이 이상하다' 를 누르면 그때 사람이 본다",
        fx: { communication: 1, security: -1 },
        fb: "△ 있어야 할 장치지만 <b>사후 대응</b>입니다. 사용자가 틀린 줄 모르면 누르지 않고, 그 사이에 잘못된 정보로 행동합니다." }] },

  { t: "회고 — 어디까지 믿기로 했나", type: "note",
    goal: "이 시스템이 <b>무엇을 보장하고 무엇은 안 하는지</b> 적으세요.\n사용자에게 그것을 어떻게 알리는지도 적습니다.",
    ph: "지어내기 비율(전 vs 후) / 거절 비율과 그 대가 / 사람에게 넘기는 주제 / 근거 인용을 사용자에게 보이는가 / 틀린 답이 나왔을 때의 경로 / 보장하지 않는 것" }]
},

/* ─────────────────────────────────────────────── math */
{
  lv: 3, em: "🎯",
  title: "확률을 잘못 읽어 생긴 사고",
  desc: "검사 결과·경보·추천에서 확률을 뒤집어 읽는 실수를 재현하고, 기저율과 조건부 확률을 계산해 판단을 바로잡는다",
  skills: ["math", "stat", "cs"],
  phases: [

  { t: "무엇을 확률로 다루는지 적는다", type: "note",
    goal: "지금 시스템이 내는 <b>확률처럼 보이는 숫자</b>들을 적고, 각각이 정확히 무엇의 확률인지 적으세요.\n대부분의 사고는 이 문장을 못 적는 데서 시작합니다.",
    ph: "예: 사기 점수 0.92 — '사기일 때 이 점수가 나올 확률' 인가 '이 점수일 때 사기일 확률' 인가? · 경보 정확도 99% — 무엇에 대한 99% 인가 · 사기 비율 0.3% · 하루 경보 400건 중 실제 사기 몇 건?" },

  { t: "99% 정확한 검사가 왜 못 믿을까", type: "decide",
    goal: "정확도 99% 인 사기 탐지가 경보를 울렸습니다. 전체 거래 중 사기는 0.3% 입니다.",
    sit: "이 경보가 진짜일 확률은?",
    opts: [
      { label: "약 23% — 사기가 드물어서, 헛경보의 절대 수가 진짜보다 훨씬 많다",
        fx: { algorithms: 3, communication: 2 },
        fb: "✅ <b>기저율이 낮으면 정확한 검사도 대부분 헛경보를 냅니다.</b> 10만 건 중 사기는 300건이고 그중 297건을 잡습니다(99%). 정상 99,700건 중 1% 인 997건도 잘못 잡습니다. 경보 1,294건 중 진짜는 297건 — 23% 입니다. 검사가 나빠서가 아니라 찾는 것이 드물어서입니다.",
        best: true },
      { label: "99% — 검사 정확도가 그대로 답이다",
        fx: { algorithms: -3 },
        fb: "⚠️ <b>확률을 뒤집어 읽은 것</b>입니다. '사기일 때 경보가 울릴 확률' 과 '경보가 울렸을 때 사기일 확률' 은 완전히 다른 값이고, 드문 것을 찾을 때 그 차이가 큽니다." },
      { label: "0.3% — 사기 비율이 그대로 답이다",
        fx: { algorithms: -2 },
        fb: "⚠️ 반대로 검사 결과를 무시한 것입니다. 경보가 울렸다는 <b>정보가 확률을 올려 주는 것</b>은 맞습니다 — 0.3% 에서 23% 로 77배가 됩니다." },
      { label: "정보가 부족해 계산할 수 없다",
        fx: { algorithms: 1 },
        fb: "△ 신중한 태도지만 이 경우는 계산됩니다. 필요한 것은 <b>기저율과 두 종류의 오류율</b> 셋뿐이고, '정확도 99%' 를 양쪽에 같이 적용하면 답이 나옵니다." }] },

  { t: "기저율을 넣어 계산한다", type: "build",
    goal: "기저율과 검사 성능으로 <b>경보가 진짜일 확률</b>을 계산하세요.\n기저율을 바꿔 가며 그 값이 어떻게 변하는지 봅니다.",
    hint: "전체를 큰 수(10만 명)로 놓고 네 칸을 <b>사람 수로</b> 세면 계산이 눈에 보입니다. 확률식보다 이쪽이 훨씬 덜 헷갈리고, 남에게 설명할 때도 그대로 쓸 수 있습니다. 기저율이 낮을수록 헛경보가 진짜를 압도한다는 것이 표로 드러납니다.",
    acc: "기저율별로 진짜·헛경보 수와 경보가 진짜일 확률이 표로 나오고, 기저율이 낮을수록 그 확률이 떨어지는 것이 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst N = 100000;\nconst SENS = 0.99;      // 사기일 때 잡을 확률\nconst SPEC = 0.99;      // 정상일 때 안 울릴 확률\n\nfunction posterior(base) {\n  const pos = Math.round(N * base), neg = N - pos;\n  const tp = Math.round(pos * SENS), fn = pos - tp;\n  const fp = Math.round(neg * (1 - SPEC)), tn = neg - fp;\n  return { pos: pos, tp: tp, fp: fp, fn: fn, tn: tn,\n    alarms: tp + fp, ppv: tp + fp ? tp / (tp + fp) : 0 };\n}\n\nout.push(\"검사: 사기를 \" + (SENS * 100) + \"% 잡고, 정상을 \" + (SPEC * 100) + \"% 통과시킨다\");\nout.push(\"전체 \" + N.toLocaleString() + \"건\");\nout.push(\"\");\nout.push(\"사기 비율   실제 사기   맞게 잡음   헛경보   경보 수   경보가 진짜일 확률\");\n[0.30, 0.05, 0.01, 0.003, 0.0005].forEach((b) => {\n  const r = posterior(b);\n  out.push((b * 100).toFixed(2).padStart(7) + \"%   \" +\n    String(r.pos).padStart(9) + \"   \" +\n    String(r.tp).padStart(9) + \"   \" +\n    String(r.fp).padStart(6) + \"   \" +\n    String(r.alarms).padStart(7) + \"   \" +\n    (r.ppv * 100).toFixed(1).padStart(6) + \"%\");\n});\n\nconst r = posterior(0.003);\nout.push(\"\");\nout.push(\"사기 0.3% 인 경우를 사람 수로 풀어 보면\");\nout.push(\"  사기 \" + r.pos + \"건 중 \" + r.tp + \"건을 잡는다\");\nout.push(\"  정상 \" + (N - r.pos) + \"건 중 \" + r.fp + \"건을 잘못 잡는다\");\nout.push(\"  경보 \" + r.alarms + \"건 중 진짜는 \" + r.tp + \"건 — \" + (r.ppv * 100).toFixed(0) + \"%\");\nout.push(\"\");\nout.push(\"검사가 나빠서가 아니라 찾는 것이 드물어서다\");\nout.push(\"그래도 경보는 정보를 준다 — 0.3% 에서 \" + (r.ppv * 100).toFixed(0) + \"% 로 \" +\n  Math.round(r.ppv / 0.003) + \"배가 됐다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "두 번 검사하면 어떻게 되나", type: "build",
    goal: "첫 경보 뒤 <b>다른 방식으로 한 번 더</b> 검사했을 때 확률이 어떻게 올라가는지 계산하세요.\n같은 검사를 두 번 하는 것과 견줍니다.",
    hint: "첫 검사 뒤의 확률이 <b>두 번째 검사의 기저율</b>이 됩니다. 이렇게 정보를 쌓아 가는 것이 조건부 확률의 쓸모입니다. 다만 두 검사가 <b>서로 독립일 때만</b> 이 계산이 맞습니다 — 같은 원리로 같은 실수를 하는 검사를 두 번 하면 첫 번째와 같은 것을 다시 말할 뿐입니다.",
    acc: "1차·2차 뒤의 확률이 단계별로 나오고, 독립이 아닐 때의 결과가 함께 비교되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction update(prior, sens, spec) {\n  const a = prior * sens;\n  const b = (1 - prior) * (1 - spec);\n  return a / (a + b);\n}\n\nlet p = 0.003;\nout.push(\"시작 (사기 비율)                 \" + (p * 100).toFixed(2) + \"%\");\np = update(p, 0.99, 0.99);\nconst after1 = p;\nout.push(\"1차 검사(민감도99·특이도99) 뒤     \" + (after1 * 100).toFixed(1) + \"%\");\n\n/* 다른 원리의 검사 — 1차와 무관하게 판단한다 */\nconst indep = update(after1, 0.95, 0.97);\n\n/* 같은 원리의 검사 — 1차가 헛짚은 것을 그대로 다시 헛짚는다.\n   1차에서 헛경보였던 건은 90% 확률로 2차에서도 헛경보가 되므로,\n   이 무리에 대한 실질 특이도가 크게 떨어진다. */\nconst OVERLAP = 0.9;\nconst effFpr = OVERLAP + (1 - OVERLAP) * (1 - 0.97);\nconst dep = update(after1, 0.95, 1 - effFpr);\n\nout.push(\"2차 검사(다른 원리) 뒤            \" + (indep * 100).toFixed(1) + \"%\");\nout.push(\"2차 검사(같은 원리, 90% 겹침) 뒤   \" + (dep * 100).toFixed(1) + \"%\");\n\nout.push(\"\");\nout.push(\"첫 검사 뒤의 확률이 두 번째 검사의 기저율이 된다\");\nout.push(\"  \" + (after1 * 100).toFixed(1) + \"% → 다른 원리 \" + (indep * 100).toFixed(1) +\n  \"%   ·   같은 원리 \" + (dep * 100).toFixed(1) + \"%\");\nout.push(\"\");\nout.push(\"겹치는 검사는 1차가 헛짚은 것을 그대로 다시 헛짚는다\");\nout.push(\"실질 오경보율이 \" + ((1 - 0.97) * 100).toFixed(0) + \"% 에서 \" +\n  (effFpr * 100).toFixed(0) + \"% 로 올라 새 정보가 거의 없다\");\nout.push(\"\");\nout.push(\"'두 번 확인했다' 가 안심의 근거가 되려면 두 검사가 서로 달라야 한다\");\nout.push(\"같은 원리로 같은 실수를 하는 검사를 두 번 하면 첫 번째를 다시 말할 뿐이다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "회고 — 어떻게 설명했나", type: "note",
    goal: "이 계산을 <b>수식 없이</b> 팀에게 설명해 보고, 무엇이 잘 통했는지 적으세요.\n사람 수로 푸는 방식이 왜 잘 통하는지도 적습니다.",
    ph: "설명에 쓴 방식(사람 수 표 등) / 어디서 막혔나 / '99% 인데 왜' 를 납득시킨 문장 / 시스템에 반영한 것(경보 문턱·2차 확인) / 사용자에게 확률을 어떻게 보이나" }]
},

/* ─────────────────────────────────────────────── mobile */
{
  lv: 3, em: "📶",
  title: "지하철에서 앱이 멈춘다",
  desc: "끊기고 느린 네트워크에서 앱이 얼어붙는 문제를 시간 제한·재시도·낙관적 갱신·나가는 편지함으로 다루어 끊겨도 쓸 수 있게 만든다",
  skills: ["mobile", "javascript", "system_design"],
  phases: [

  { t: "어디서 멈추는지 적는다", type: "note",
    goal: "끊긴 상황에서 <b>화면이 어떻게 되는지</b> 적으세요.\n'안 된다' 가 아니라 무엇이 얼마나 기다리다 어떻게 되는지 적습니다.",
    ph: "예: 목록 화면이 빈 채로 30초 이상 회전 · 글쓰기 버튼을 누르면 아무 반응 없이 멈춤 · 다시 연결돼도 저절로 안 채워짐 · 앱을 껐다 켜야 함 · 지하철 구간에서 하루 20분쯤" },

  { t: "끊겼을 때 무엇을 보여 줄 것인가", type: "decide",
    goal: "네트워크가 끊기면 화면이 빈 채로 계속 기다립니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "마지막으로 받은 것을 먼저 보여 주고, 새로 고치는 중임을 따로 표시한다",
        fx: { system_design: 3, coding: 2 },
        fb: "✅ <b>조금 오래된 것이 아무것도 없는 것보다 낫습니다.</b> 저장해 둔 목록을 곧바로 그리고 '언제 받은 것인지' 와 '새로 고치는 중' 을 함께 보이면, 끊긴 상태에서도 앱이 쓸 만합니다. 사용자는 기다리는 대신 읽을 수 있고, 연결되면 조용히 갱신됩니다.",
        best: true },
      { label: "'네트워크 오류' 화면을 보여 준다",
        fx: { coding: 1 },
        fb: "△ 빈 화면보다는 낫습니다. 다만 <b>이미 받아 둔 것이 있는데도</b> 아무것도 안 보여 주는 것은 아까운 일입니다." },
      { label: "시간 제한을 늘려 더 기다린다",
        fx: { system_design: -2 },
        fb: "⚠️ 끊긴 상태에서는 아무리 기다려도 안 옵니다. <b>더 오래 얼어붙을 뿐</b>입니다." },
      { label: "자동으로 계속 재시도한다",
        fx: { system_design: -1 },
        fb: "⚠️ 끊긴 동안 재시도하면 <b>배터리만 씁니다.</b> 연결이 돌아온 것을 감지해 그때 한 번 하는 편이 낫습니다." }] },

  { t: "기다리는 시간을 정한다", type: "build",
    goal: "느린 네트워크에서 <b>얼마나 기다릴지</b>와 재시도 간격을 정하고, 총 대기 시간이 얼마가 되는지 계산하세요.",
    hint: "시간 제한과 재시도 횟수를 곱하면 <b>사용자가 최악의 경우 기다리는 시간</b>이 나옵니다. 각각은 합리적으로 보여도 곱하면 1분이 넘는 일이 흔합니다. 재시도 간격은 두 배씩 늘리되 <b>지터</b>를 넣어 여럿이 동시에 다시 몰리지 않게 합니다.",
    acc: "설정별 최악 대기 시간이 계산되고, 목표 안에 들어오는 조합이 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst GOAL = 15000;   // 최악이어도 15초 안에는 끝나야 한다\n\nfunction worst(timeoutMs, tries, baseBackoff) {\n  let total = 0;\n  for (let i = 0; i < tries; i++) {\n    total += timeoutMs;\n    if (i < tries - 1) total += baseBackoff * Math.pow(2, i);\n  }\n  return total;\n}\n\nconst configs = [\n  { t: 30000, n: 3, b: 1000 },\n  { t: 10000, n: 3, b: 1000 },\n  { t: 5000, n: 3, b: 500 },\n  { t: 4000, n: 2, b: 500 },\n  { t: 3000, n: 2, b: 300 }\n];\n\nout.push(\"제한     재시도  간격     최악 대기      목표 \" + (GOAL / 1000) + \"초\");\nlet pick = null;\nconfigs.forEach((c) => {\n  const w = worst(c.t, c.n, c.b);\n  if (!pick && w <= GOAL) pick = c;\n  out.push((c.t / 1000 + \"초\").padEnd(9) + String(c.n).padEnd(8) +\n    (c.b + \"ms\").padEnd(9) + ((w / 1000).toFixed(1) + \"초\").padEnd(15) +\n    (w <= GOAL ? \"만족\" : \"초과\"));\n});\n\nout.push(\"\");\nout.push(\"고른 설정: 제한 \" + (pick.t / 1000) + \"초 · \" + pick.n + \"번 · 간격 \" + pick.b + \"ms\");\nout.push(\"\");\nout.push(\"각각은 합리적으로 보여도 곱하면 1분이 넘는다\");\nout.push(\"곱한 값을 보지 않으면 '왜 이렇게 오래 기다리지' 를 설명할 수 없다\");\n\n/* 지터 — 여럿이 동시에 다시 몰리지 않게 흩뜨린다 */\nout.push(\"\");\nout.push(\"재시도 시각 (100대가 동시에 끊겼다 돌아온 경우)\");\n[false, true].forEach((jit) => {\n  const buckets = {};\n  for (let i = 0; i < 100; i++) {\n    const j = jit ? (Math.imul(i, 2654435761) >>> 0) % 1000 : 0;\n    const at = Math.round((pick.b + j) / 200) * 200;\n    buckets[at] = (buckets[at] || 0) + 1;\n  }\n  const max = Math.max.apply(null, Object.keys(buckets).map((k) => buckets[k]));\n  out.push(\"  \" + (jit ? \"지터 있음\" : \"지터 없음\").padEnd(12) +\n    \"퍼진 구간 \" + Object.keys(buckets).length + \"   한 구간 최대 \" + max + \"대\");\n});\nconsole.log(out.join(\"\\n\"));" },

  { t: "먼저 반영하고 나중에 보낸다", type: "build",
    goal: "글쓰기 같은 동작을 <b>화면에 먼저 반영</b>하고 뒤에서 보내되, 실패하면 되돌리는 흐름을 만드세요.",
    hint: "낙관적 갱신은 '성공할 것이라 보고 먼저 보여 주는 것' 입니다. 대부분 성공하므로 앱이 즉시 반응하는 것처럼 느껴집니다. 중요한 것은 <b>실패했을 때 되돌리고 알리는 것</b>이고, 되돌릴 수 없는 동작(결제 같은)에는 쓰면 안 됩니다.",
    acc: "성공·실패 두 흐름의 화면 상태 변화가 단계별로 출력되고, 실패 시 원래대로 돌아오는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction screen() {\n  const items = [{ id: 1, text: \"기존 글\", state: \"저장됨\" }];\n  let nextTmp = -1;\n  return {\n    optimisticAdd(text) {\n      const tmp = { id: nextTmp--, text: text, state: \"보내는 중\" };\n      items.push(tmp);\n      return tmp;\n    },\n    confirm(tmp, realId) { tmp.id = realId; tmp.state = \"저장됨\"; },\n    rollback(tmp, why) {\n      const i = items.indexOf(tmp);\n      if (i >= 0) items.splice(i, 1);\n      return \"되돌림 — \" + why;\n    },\n    show() { return items.map((x) => x.id + \":\" + x.text + \"(\" + x.state + \")\").join(\"  \"); }\n  };\n}\n\nout.push(\"성공하는 경우\");\nlet s = screen();\nout.push(\"  누르기 전   \" + s.show());\nlet t = s.optimisticAdd(\"새 글\");\nout.push(\"  누른 직후   \" + s.show() + \"   ← 기다리지 않고 곧바로 보인다\");\ns.confirm(t, 42);\nout.push(\"  응답 뒤     \" + s.show());\n\nout.push(\"\");\nout.push(\"실패하는 경우\");\ns = screen();\nt = s.optimisticAdd(\"새 글\");\nout.push(\"  누른 직후   \" + s.show());\nconst why = s.rollback(t, \"서버가 400 을 돌려줌\");\nout.push(\"  실패 뒤     \" + s.show() + \"   ← \" + why);\n\nout.push(\"\");\nout.push(\"대부분 성공하므로 앱이 즉시 반응하는 것처럼 느껴진다\");\nout.push(\"중요한 것은 실패했을 때 되돌리고 알리는 것이다\");\nout.push(\"되돌릴 수 없는 동작(결제 같은)에는 쓰면 안 된다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "끊긴 동안 쌓아 둔다", type: "build",
    goal: "끊긴 동안의 동작을 <b>쌓아 두었다가</b> 연결되면 순서대로 보내는 편지함을 만드세요.\n중복 전송과 순서 뒤바뀜을 막습니다.",
    hint: "쌓아 두는 것만으로는 부족합니다 — 같은 것을 두 번 보내지 않으려면 <b>보낸 것을 표시</b>해야 하고, 순서를 지키려면 <b>앞의 것이 끝난 뒤에</b> 다음을 보내야 합니다. 실패한 것은 다시 넣되 계속 실패하면 사용자에게 알려야 하고, 그렇지 않으면 조용히 사라집니다.",
    acc: "끊긴 동안 쌓이고 연결 뒤 순서대로 보내지며, 실패한 것이 다시 시도되고 한계를 넘으면 알려지는 흐름이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction outbox(maxTries) {\n  const q = [];\n  let seq = 0;\n  return {\n    add(op) { q.push({ id: ++seq, op: op, tries: 0, done: false }); return \"쌓음: \" + op; },\n    pending() { return q.filter((x) => !x.done).length; },\n    flush(sendFn) {\n      const log = [];\n      for (const it of q) {\n        if (it.done) continue;\n        it.tries++;\n        const ok = sendFn(it.op, it.tries);\n        if (ok) { it.done = true; log.push(\"보냄 \" + it.id + \": \" + it.op); }\n        else if (it.tries >= maxTries) {\n          it.done = true; it.failed = true;\n          log.push(\"포기 \" + it.id + \": \" + it.op + \" — 사용자에게 알린다\");\n        } else {\n          log.push(\"실패 \" + it.id + \": \" + it.op + \" (\" + it.tries + \"/\" + maxTries + \") — 다음에 다시\");\n          break;                      // 순서를 지키려면 여기서 멈춘다\n        }\n      }\n      return log;\n    }\n  };\n}\n\nconst box = outbox(3);\nout.push(box.add(\"글쓰기 A\"));\nout.push(box.add(\"좋아요 B\"));\nout.push(box.add(\"글쓰기 C\"));\nout.push(\"대기 중 \" + box.pending() + \"건\");\n\nout.push(\"\");\nout.push(\"연결 돌아옴 — 1차 전송 (B 가 실패한다)\");\nbox.flush((op) => op.indexOf(\"좋아요\") < 0).forEach((l) => out.push(\"  \" + l));\nout.push(\"  대기 중 \" + box.pending() + \"건   ← C 는 B 뒤라 아직 안 보냈다\");\n\nout.push(\"\");\nout.push(\"2차 전송 (B 가 계속 실패)\");\nbox.flush(() => false).forEach((l) => out.push(\"  \" + l));\nout.push(\"\");\nout.push(\"3차 전송\");\nbox.flush((op) => op.indexOf(\"좋아요\") < 0).forEach((l) => out.push(\"  \" + l));\nout.push(\"  대기 중 \" + box.pending() + \"건\");\n\nout.push(\"\");\nout.push(\"보낸 것을 표시해야 두 번 보내지 않는다\");\nout.push(\"앞의 것이 끝나야 다음을 보낸다 — 순서가 뜻을 갖는 동작이라면\");\nout.push(\"계속 실패하는 것은 사용자에게 알린다. 그러지 않으면 조용히 사라진다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 끊겨도 쓸 수 있나", type: "note",
    goal: "비행기 모드로 <b>주요 흐름을 직접 해 보고</b> 무엇이 되고 무엇이 안 되는지 적으세요.\n안 되는 것 중 되어야 하는 것을 골라 적습니다.",
    ph: "비행기 모드에서 되는 것 / 안 되는 것 / 그중 되어야 하는 것 / 최악 대기 시간(전 vs 후) / 편지함에 쌓인 것을 사용자가 볼 수 있나 / 포기한 동작을 어떻게 알리나" }]
},

/* ─────────────────────────────────────────────── php */
{
  lv: 3, em: "🧰",
  title: "10년 된 PHP 를 물려받았다",
  desc: "전역 변수와 뒤섞인 HTML 로 된 옛 코드를 한 번에 다시 쓰지 않고, 경계를 만들어 조금씩 안전하게 밀어 낸다",
  skills: ["php", "code", "security"],
  phases: [

  { t: "지금 무엇이 위험한지 적는다", type: "note",
    goal: "코드를 읽으며 <b>위험한 자리</b>를 목록으로 만드세요.\n고칠 순서를 정하려면 먼저 무엇이 있는지 알아야 합니다.",
    ph: "예: 쿼리를 문자열로 이어 붙이는 곳 34군데 · 사용자 입력을 그대로 출력하는 곳 12군데 · 전역 $conn 을 파일 40개가 씀 · 세션에 평문 비밀번호 · 오류를 화면에 그대로 출력 · 테스트 0개" },

  { t: "어디부터 손댈 것인가", type: "decide",
    goal: "고칠 것이 많고, 동시에 새 기능도 넣어야 합니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "밖으로 새는 것부터 — 주입과 출력 이스케이프를 먼저 막고, 구조는 그 다음",
        fx: { security: 3, coding: 2 },
        fb: "✅ <b>보안 결함은 지금 이 순간에도 악용될 수 있습니다.</b> 구조가 지저분한 것은 개발 속도를 깎지만 사고를 내지는 않는 반면, 주입 하나는 데이터베이스 전체를 잃게 합니다. 게다가 이 둘은 각각 한 줄씩 고칠 수 있어 구조 변경보다 훨씬 값쌉니다.",
        best: true },
      { label: "프레임워크를 도입해 구조부터 잡는다",
        fx: { coding: -1, security: -2 },
        fb: "⚠️ 몇 달이 걸리고 그동안 <b>보안 결함은 그대로</b>입니다. 그리고 옮기는 과정에서 옛 동작을 놓치는 사고가 납니다." },
      { label: "테스트를 먼저 붙인다",
        fx: { coding: 1 },
        fb: "△ 구조를 바꾸기 전에는 필요합니다. 다만 <b>보안 수정은 대개 테스트 없이도 안전하게</b> 할 수 있어(동작이 그대로다), 순서상 뒤여도 됩니다." },
      { label: "새 기능은 새 코드로 만들고 옛 코드는 그대로 둔다",
        fx: { coding: 2, security: -1 },
        fb: "△ 실제로 널리 쓰는 방법이고 함께 해야 합니다. 다만 <b>옛 코드의 결함은 그대로</b> 남아 있으므로, 보안 수정을 미룰 이유는 되지 않습니다." }] },

  { t: "주입을 막는다", type: "build",
    goal: "문자열을 이어 붙이는 쿼리와 <b>값을 따로 넘기는</b> 쿼리를 견주세요.\n이스케이프로 막으려는 시도가 왜 부족한지도 보입니다.",
    hint: "값을 따로 넘기면 그 값이 <b>절대 문장의 일부가 되지 않습니다.</b> 이스케이프는 값을 문장 안에 넣되 위험한 글자를 바꾸는 것이라, 인코딩이나 문맥이 예상과 다르면 뚫립니다. 그리고 값이 아닌 자리(테이블 이름, 정렬 방향)는 애초에 따로 넘길 수 없으므로 <b>허용 목록</b>으로만 다뤄야 합니다.",
    acc: "같은 입력이 이어 붙이기·이스케이프·값 분리 각각에서 어떻게 되는지 나오고, 값이 아닌 자리의 처리도 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst evil = \"1 OR 1=1 --\";\nconst evil2 = \"O'Brien\";\n\n/* 1. 이어 붙이기 — 값이 문장이 된다 */\nout.push(\"이어 붙이기\");\nout.push(\"  SELECT * FROM users WHERE id = \" + evil);\nout.push(\"  → 조건이 통째로 바뀌어 전부 나온다\");\n\n/* 2. 이스케이프 — 값을 문장 안에 넣되 글자를 바꾼다 */\nconst esc = (s) => String(s).replace(/'/g, \"''\");\nout.push(\"\");\nout.push(\"이스케이프\");\nout.push(\"  SELECT * FROM users WHERE name = '\" + esc(evil2) + \"'\");\nout.push(\"  SELECT * FROM users WHERE id = \" + esc(evil) + \"   ← 따옴표가 없어 그대로 통과\");\nout.push(\"  → 숫자 자리처럼 따옴표를 안 두른 곳은 이스케이프가 아무것도 안 한다\");\n\n/* 3. 값을 따로 넘긴다 — 값이 문장의 일부가 될 수 없다 */\nout.push(\"\");\nout.push(\"값을 따로 넘기기\");\nout.push(\"  문장: SELECT * FROM users WHERE id = ? AND name = ?\");\nout.push(\"  값:   [\" + JSON.stringify(evil) + \", \" + JSON.stringify(evil2) + \"]\");\nout.push(\"  → 값은 값으로만 쓰인다. 무엇이 들어와도 문장이 바뀌지 않는다\");\n\n/* 4. 값이 아닌 자리 — 따로 넘길 수 없으므로 허용 목록 */\nout.push(\"\");\nout.push(\"값이 아닌 자리 (정렬 컬럼·방향)\");\nconst COLS = [\"created_at\", \"name\", \"price\"];\nconst DIRS = [\"ASC\", \"DESC\"];\nfunction orderBy(col, dir) {\n  const c = COLS.indexOf(col) >= 0 ? col : COLS[0];\n  const d = DIRS.indexOf(String(dir).toUpperCase()) >= 0 ? String(dir).toUpperCase() : \"ASC\";\n  return \" ORDER BY \" + c + \" \" + d;\n}\n[[\"name\", \"desc\"], [\"price; DROP TABLE users\", \"ASC\"], [\"created_at\", \"'; --\"]]\n  .forEach((x) => out.push(\"  \" + JSON.stringify(x) + \" →\" + orderBy(x[0], x[1])));\nout.push(\"  → 목록에 없으면 기본값으로 떨어진다. 만들어 낸 값은 절대 안 들어간다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "출력을 문맥에 맞게 막는다", type: "build",
    goal: "같은 값이 <b>어디에 들어가느냐</b>에 따라 다르게 처리해야 하는 것을 보이세요.\n한 가지 이스케이프로 전부 되지 않는 이유를 드러냅니다.",
    hint: "HTML 본문·속성·자바스크립트·URL 은 각각 <b>위험한 글자가 다릅니다.</b> HTML 이스케이프만 걸고 자바스크립트 안에 넣으면 여전히 뚫리고, 속성값에 따옴표 없이 넣으면 공백만으로도 새 속성이 됩니다. '어디에 들어가는가' 를 모르면 어떤 처리가 맞는지 정할 수 없습니다.",
    acc: "같은 입력이 문맥별로 다르게 처리되어 출력되고, 잘못된 문맥에 넣었을 때 뚫리는 것이 함께 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst input = \"</script><img src=x onerror=alert(1)>\";\nconst input2 = \"x onmouseover=alert(1)\";\n\nconst escHtml = (s) => String(s).replace(/&/g, \"&amp;\").replace(/</g, \"&lt;\")\n  .replace(/>/g, \"&gt;\").replace(/\\\"/g, \"&quot;\").replace(/'/g, \"&#39;\");\nconst escJs = (s) => JSON.stringify(String(s));\nconst escUrl = (s) => encodeURIComponent(String(s));\n\nout.push(\"입력: \" + input);\nout.push(\"\");\nout.push(\"HTML 본문에\");\nout.push(\"  안 막음: <p>\" + input + \"</p>   ← 태그가 살아난다\");\nout.push(\"  HTML 이스케이프: <p>\" + escHtml(input) + \"</p>\");\n\nout.push(\"\");\nout.push(\"자바스크립트 안에\");\nout.push(\"  HTML 이스케이프만: var s = '\" + escHtml(input) + \"';\");\nout.push(\"    → &lt; 로 바뀌어 문자열은 안전하지만, 스크립트 문맥에서는 따옴표가 문제다\");\nout.push(\"  JS 이스케이프: var s = \" + escJs(input) + \";\");\n\nout.push(\"\");\nout.push(\"속성값에 (따옴표 없이)\");\nout.push(\"  <img src=\" + input2 + \">   ← 공백만으로 새 속성이 붙는다\");\nout.push(\"  <img src=\\\"\" + escHtml(input2) + \"\\\">   ← 따옴표로 두르고 이스케이프\");\n\nout.push(\"\");\nout.push(\"URL 자리에\");\nout.push(\"  <a href=\\\"/s?q=\" + escUrl(input) + \"\\\">\");\n\nout.push(\"\");\nout.push(\"문맥마다 위험한 글자가 다르다 — 한 가지 이스케이프로 전부 되지 않는다\");\nout.push(\"'어디에 들어가는가' 를 모르면 어떤 처리가 맞는지 정할 수 없다\");\nout.push(\"템플릿 엔진이 문맥을 알고 자동으로 하는 것이 가장 안전하다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "옛 코드를 어떻게 밀어 낼 것인가", type: "decide",
    goal: "보안 결함은 막았습니다. 이제 구조를 정리하려 합니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "새 코드를 앞에 두고 요청을 하나씩 옮기며, 옮긴 것부터 옛 코드를 지운다",
        fx: { coding: 3, system_design: 2 },
        fb: "✅ <b>한 번에 다 옮기지 않고 경로 단위로 옮깁니다.</b> 앞단에서 '이 경로는 새 코드, 나머지는 옛 코드' 로 나누면 언제든 되돌릴 수 있고, 옮긴 만큼 값어치가 곧바로 납니다. 몇 년이 걸려도 매 순간 동작하는 시스템을 유지한다는 것이 이 방식의 핵심입니다.",
        best: true },
      { label: "새 시스템을 다 만든 뒤 한 번에 전환한다",
        fx: { coding: -3, system_design: -2 },
        fb: "⚠️ 10년치 예외 처리가 문서에 없습니다. 다시 만들면 그것들을 <b>하나씩 사고로 다시 배우게</b> 되고, 그동안 새 기능은 두 곳에 넣어야 합니다." },
      { label: "옛 코드를 그대로 두고 새 기능만 새 코드로",
        fx: { coding: 1 },
        fb: "△ 시작으로는 좋습니다. 다만 <b>줄어들지 않으면</b> 두 벌을 영원히 유지하게 되므로, 옮기는 계획이 함께 있어야 합니다." },
      { label: "파일을 하나씩 다시 쓴다",
        fx: { coding: -1 },
        fb: "⚠️ 파일 경계와 기능 경계가 다릅니다. 전역 변수로 얽혀 있으면 <b>한 파일만 바꿔도 다른 파일이 깨집니다.</b> 경로 단위가 더 안전한 경계입니다." }] },

  { t: "회고 — 무엇이 줄었나", type: "note",
    goal: "위험 목록이 <b>얼마나 줄었는지</b> 숫자로 적으세요.\n남은 것과 그것을 언제 할지도 적습니다.",
    ph: "주입 34곳 → ? / 이스케이프 안 된 출력 12곳 → ? / 옮긴 경로 수 / 남은 위험과 이유 / 새 코드가 차지하는 비율 / 다음 분기에 옮길 경로" }]
}

]};
