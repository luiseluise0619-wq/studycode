/* 두 번째 프로젝트 묶음 6 — 데이터 다루기와 학습 도구 쪽의 깊이.
   숫자가 조용히 틀리는 자리, 모델을 잘못 평가하는 자리, 딥러닝이 학습되지
   않는 자리, 언어를 만드는 일의 경계, 그리고 함수형으로 상태를 다루는 일. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── numpy */
{
  lv: 3, em: "📏",
  title: "배열 계산이 조용히 틀린다",
  desc: "브로드캐스팅·자료형·뷰와 복사가 만드는 조용한 오류를 재현해 잡고, 형태와 자료형을 검사로 붙잡아 다시 나지 않게 한다",
  skills: ["numpy", "python", "debugging"],
  phases: [

  { t: "무엇이 이상한지 적는다", type: "note",
    goal: "결과가 <b>어떻게</b> 이상한지 적으세요.\n'틀리다' 가 아니라 어느 값이 얼마나 어긋났는지, 어느 단계 뒤부터인지 적습니다.",
    ph: "예: 정규화 뒤 평균이 0이 아니라 0.34 · 배열 형태가 (100,3) 이어야 하는데 (100,100) · 정수 나눗셈에서 소수가 사라짐 · 원본을 안 건드렸는데 원본이 바뀜 · 표본 20개에서는 맞고 10만 개에서 틀림" },

  { t: "형태가 왜 부풀었는가", type: "decide",
    goal: "(100,3) 배열에서 열 평균을 빼려 했는데 결과가 (100,100) 이 됐습니다.",
    sit: "무엇이 문제입니까?",
    opts: [
      { label: "브로드캐스팅이 의도와 다른 축으로 맞춰졌다 — 뺄 값의 형태가 (100,) 이라 열로 해석됐다",
        fx: { algorithms: 3, debugging: 2 },
        fb: "✅ <b>브로드캐스팅은 뒤쪽 축부터 맞춥니다.</b> (100,3) 과 (100,) 을 맞추려 하면 (100,) 이 마지막 축과 견주어지는데 3과 100이 달라 오류가 나거나, 중간에 축이 하나 늘어 (100,100) 같은 것이 됩니다. 뺄 값을 (100,1) 로 만들어 '행마다 하나' 임을 분명히 하면 해결됩니다.",
        best: true },
      { label: "평균을 잘못된 축으로 구했다",
        fx: { algorithms: 2 },
        fb: "△ 함께 확인할 값어치가 있고 실제로 자주 어긋납니다. 다만 축을 맞게 구했어도 <b>형태가 (100,) 이면 같은 문제</b>가 납니다." },
      { label: "전치를 안 해서",
        fx: { algorithms: 1 },
        fb: "△ 전치로 우연히 맞을 수는 있지만 <b>왜 맞는지 모른 채</b> 넘어가게 됩니다. 다음에 형태가 조금만 달라지면 다시 틀립니다." },
      { label: "reshape 로 강제로 맞춘다",
        fx: { algorithms: -2, debugging: -1 },
        fb: "⚠️ 가장 위험한 대응입니다. 형태는 맞지만 <b>값이 엉뚱한 자리로 들어가</b> 오류 없이 조용히 틀린 결과가 나옵니다." }] },

  { t: "브로드캐스팅을 손으로 따라간다", type: "build",
    goal: "두 형태를 받아 <b>브로드캐스팅 결과</b>를 계산하세요.\n맞출 수 없으면 어느 축에서 어긋났는지 알려 줍니다.",
    hint: "규칙은 하나입니다 — <b>뒤쪽 축부터</b> 견주어, 같거나 한쪽이 1이면 맞춰지고 아니면 오류입니다. 짧은 쪽 앞에는 1이 채워집니다. 이 규칙을 손으로 따라가 보면 '왜 (100,3) 과 (100,) 이 안 되는지' 가 분명해집니다.",
    acc: "형태 쌍마다 결과 형태 또는 어긋난 축이 출력되고, (100,3)+(100,) 이 실패하고 (100,1) 이 성공하는 것이 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction broadcast(a, b) {\n  const n = Math.max(a.length, b.length);\n  /* 짧은 쪽 앞을 1로 채운다 — 뒤쪽 축부터 맞추기 위해서다 */\n  const A = new Array(n - a.length).fill(1).concat(a);\n  const B = new Array(n - b.length).fill(1).concat(b);\n  const res = [];\n  for (let i = 0; i < n; i++) {\n    if (A[i] === B[i] || A[i] === 1 || B[i] === 1) res.push(Math.max(A[i], B[i]));\n    else return { ok: false, at: i - n, a: A[i], b: B[i] };\n  }\n  return { ok: true, shape: res };\n}\n\nconst pairs = [\n  [[100, 3], [3]],\n  [[100, 3], [100]],\n  [[100, 3], [100, 1]],\n  [[100, 3], [1, 3]],\n  [[8, 1, 6], [7, 1]],\n  [[5, 4], [4, 5]]\n];\n\nout.push(\"A            B            결과\");\npairs.forEach((p) => {\n  const r = broadcast(p[0], p[1]);\n  const label = \"(\" + p[0].join(\",\") + \")\";\n  const label2 = \"(\" + p[1].join(\",\") + \")\";\n  out.push(label.padEnd(13) + label2.padEnd(13) +\n    (r.ok ? \"(\" + r.shape.join(\",\") + \")\"\n          : \"오류 — 뒤에서 \" + (-r.at) + \"번째 축이 \" + r.a + \" vs \" + r.b));\n});\n\nout.push(\"\");\nout.push(\"규칙은 하나 — 뒤쪽 축부터 견주어 같거나 한쪽이 1이면 맞춰진다\");\nout.push(\"(100,3) 에서 행마다 하나를 빼려면 (100,1) 이어야 한다\");\nout.push(\"(100,) 은 앞이 1로 채워져 (1,100) 이 되고, 3과 100 이 안 맞는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "자료형이 값을 자르는 자리", type: "build",
    goal: "자료형 때문에 값이 <b>잘리거나 넘치는</b> 경우를 재현하세요.\n정수 나눗셈과 오버플로를 각각 보입니다.",
    hint: "배열은 자료형이 고정입니다. 정수 배열에 나눗셈 결과를 넣으면 <b>소수가 버려지고</b>, 8비트 정수에 256을 넣으면 <b>돌아서 0</b>이 됩니다. 오류가 안 나므로 조용히 틀립니다. 큰 데이터에서 자료형을 줄여 메모리를 아끼는 것이 흔한데, 그때 이 위험이 함께 들어옵니다.",
    acc: "정수 나눗셈과 오버플로 각각의 기대값·실제값이 출력되고, 자료형을 올렸을 때 맞아지는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 자료형을 흉내 낸다 */\nfunction cast(v, dtype) {\n  if (dtype === \"int32\") return Math.trunc(v);\n  if (dtype === \"uint8\") { const m = Math.trunc(v) % 256; return m < 0 ? m + 256 : m; }\n  return v;   // float64\n}\n\nout.push(\"정수 나눗셈\");\nconst vals = [7, 10, 3];\n[\"int32\", \"float64\"].forEach((dt) => {\n  const got = vals.map((v) => cast(v / 2, dt));\n  out.push(\"  \" + dt.padEnd(10) + \"[\" + vals.join(\",\") + \"] / 2 = [\" + got.join(\",\") + \"]\");\n});\nout.push(\"  → 정수 배열은 소수를 버린다. 평균·비율이 조용히 틀린다\");\n\nout.push(\"\");\nout.push(\"오버플로\");\nconst sums = [200, 100];\n[\"uint8\", \"int32\"].forEach((dt) => {\n  const got = cast(sums[0] + sums[1], dt);\n  out.push(\"  \" + dt.padEnd(10) + sums[0] + \" + \" + sums[1] + \" = \" + got +\n    (got !== 300 ? \"   ← 돌아 나왔다 (기대 300)\" : \"\"));\n});\nout.push(\"  → 오류가 안 난다. 256으로 나눈 나머지가 조용히 들어간다\");\n\nout.push(\"\");\nout.push(\"누적에서 특히 위험하다\");\nlet acc8 = 0, acc32 = 0;\nfor (let i = 0; i < 1000; i++) { acc8 = cast(acc8 + 1, \"uint8\"); acc32 = cast(acc32 + 1, \"int32\"); }\nout.push(\"  1을 1000번 더하면  uint8 \" + acc8 + \"   int32 \" + acc32);\nout.push(\"\");\nout.push(\"메모리를 아끼려 자료형을 줄이면 이 위험이 함께 들어온다\");\nout.push(\"누적하는 값은 원소보다 큰 자료형으로 받아야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "원본이 왜 바뀌는가", type: "build",
    goal: "슬라이스가 <b>복사가 아니라 뷰</b>라서 원본이 함께 바뀌는 상황을 보이세요.\n복사한 경우와 나란히 둡니다.",
    hint: "배열의 슬라이스는 <b>같은 메모리를 가리키는 창</b>입니다. 그래서 슬라이스를 고치면 원본도 바뀝니다. 이것은 성능을 위한 선택이고(큰 배열을 복사하지 않는다), 알고 쓰면 아주 유용하지만 모르면 조용한 버그가 됩니다. 명시적으로 복사하면 끊어집니다.",
    acc: "뷰를 고쳤을 때와 복사본을 고쳤을 때의 원본이 나란히 출력되고, 차이가 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 뷰 — 원본의 일부를 가리키는 창 */\nfunction view(arr, from, to) {\n  return {\n    set(i, v) { arr[from + i] = v; },\n    get(i) { return arr[from + i]; },\n    len: to - from\n  };\n}\nfunction copy(arr, from, to) {\n  const c = arr.slice(from, to);\n  return { set(i, v) { c[i] = v; }, get(i) { return c[i]; }, len: c.length, own: c };\n}\n\nconst orig1 = [1, 2, 3, 4, 5];\nconst v = view(orig1, 1, 4);\nv.set(0, 99);\nout.push(\"뷰를 고침    원본 [\" + orig1.join(\",\") + \"]   ← 함께 바뀌었다\");\n\nconst orig2 = [1, 2, 3, 4, 5];\nconst c = copy(orig2, 1, 4);\nc.set(0, 99);\nout.push(\"복사본을 고침 원본 [\" + orig2.join(\",\") + \"]   복사본 [\" + c.own.join(\",\") + \"]\");\n\nout.push(\"\");\nout.push(\"뷰는 성능을 위한 선택이다 — 큰 배열을 복사하지 않는다\");\nout.push(\"알고 쓰면 유용하지만 모르면 조용한 버그가 된다\");\nout.push(\"\");\nout.push(\"함수가 배열을 받아 고칠 때는 규약을 정해야 한다\");\nout.push(\"  · 원본을 고치는 함수인가 (제자리 연산)\");\nout.push(\"  · 새 배열을 돌려주는 함수인가\");\nout.push(\"이름으로 드러내지 않으면 부르는 쪽이 매번 문서를 봐야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "다시 안 틀리게 붙잡는다", type: "build",
    goal: "함수 입구에서 <b>형태와 자료형을 확인</b>하는 검사를 만드세요.\n어긋나면 무엇이 어떻게 다른지 알려 줍니다.",
    hint: "배열 코드의 버그는 대개 <b>형태나 자료형이 예상과 다른 것</b>에서 옵니다. 함수 입구에서 한 줄로 확인하면 어긋난 자리에서 곧바로 멈추고, 나중에 이상한 숫자를 보고 거슬러 올라가는 것보다 훨씬 쌉니다. 확인은 비싸지 않고, 틀린 결과를 며칠 뒤에 발견하는 것보다 언제나 싸다.",
    acc: "형태·자료형이 맞는 경우와 틀린 경우가 각각 통과·실패로 판정되고, 실패 메시지가 무엇이 다른지 밝히면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction expect(arr, spec) {\n  const errs = [];\n  if (spec.shape) {\n    if (arr.shape.length !== spec.shape.length)\n      errs.push(\"차원 수 \" + arr.shape.length + \" (기대 \" + spec.shape.length + \")\");\n    else spec.shape.forEach((want, i) => {\n      if (want !== null && want !== arr.shape[i])\n        errs.push(\"축\" + i + \" 크기 \" + arr.shape[i] + \" (기대 \" + want + \")\");\n    });\n  }\n  if (spec.dtype && arr.dtype !== spec.dtype)\n    errs.push(\"자료형 \" + arr.dtype + \" (기대 \" + spec.dtype + \")\");\n  if (spec.finite && !arr.finite) errs.push(\"NaN 또는 무한대가 섞였다\");\n  return errs;\n}\n\n/* null 은 '아무 크기나' — 배치 크기처럼 달라지는 축에 쓴다 */\nconst SPEC = { shape: [null, 3], dtype: \"float64\", finite: true };\n\nconst cases = [\n  { n: \"정상\", shape: [100, 3], dtype: \"float64\", finite: true },\n  { n: \"열이 다름\", shape: [100, 5], dtype: \"float64\", finite: true },\n  { n: \"차원이 다름\", shape: [100], dtype: \"float64\", finite: true },\n  { n: \"정수 배열\", shape: [100, 3], dtype: \"int32\", finite: true },\n  { n: \"NaN 섞임\", shape: [100, 3], dtype: \"float64\", finite: false }\n];\n\nout.push(\"경우              판정   무엇이 다른가\");\ncases.forEach((c) => {\n  const e = expect(c, SPEC);\n  out.push(c.n.padEnd(18) + (e.length ? \"실패\" : \"통과\").padEnd(7) +\n    (e.length ? e.join(\" · \") : \"—\"));\n});\n\nout.push(\"\");\nout.push(\"입구에서 한 줄 확인하면 어긋난 자리에서 곧바로 멈춘다\");\nout.push(\"이상한 숫자를 며칠 뒤에 발견하고 거슬러 올라가는 것보다 훨씬 싸다\");\nout.push(\"달라져도 되는 축은 null 로 둔다 — 지나치게 빡빡하면 아무도 안 쓴다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 어디서 조용했나", type: "note",
    goal: "오류 없이 <b>조용히 틀리던 자리</b>를 적으세요.\n무엇이 있었으면 그 자리에서 멈췄을지도 함께 적습니다.",
    ph: "조용히 틀린 자리 / 며칠 만에 알아챘나 / 무엇이 있었으면 곧바로 멈췄을까 / 지금 붙인 검사 / 검사를 안 붙인 자리와 그 이유 / 뷰인지 복사인지 헷갈리는 함수" }]
},

/* mleval 항목은 기존 '정확도 98% 인데 쓸모가 없다' 와 주제가 겹쳐 뺐다.
   대신 proj_mleval2.cjs 에 '오프라인에서 이겼는데 실제로는 졌다' 를 따로 두었다. */

/* ─────────────────────────────────────────────── dl */
{
  lv: 4, em: "📉",
  title: "학습이 안 되는 이유를 찾는다",
  desc: "손실이 안 내려가거나 발산하거나 과적합하는 세 가지 상황을 구분하고, 각각에 맞는 처방을 순서대로 시험한다",
  skills: ["dl", "ml", "debugging"],
  phases: [

  { t: "어떤 모양으로 안 되는지 적는다", type: "note",
    goal: "손실 곡선의 <b>모양</b>을 적으세요.\n안 내려가는 것, 튀는 것, 내려가다 검증만 올라가는 것은 원인이 완전히 다릅니다.",
    ph: "예: 학습 손실이 2.30 에서 안 움직임(클래스 10개, ln10=2.30) · 배치마다 값이 크게 튐 · 에폭 4부터 검증 손실만 상승 · 학습 정확도 99% 검증 62% · 학습률 0.01 · 배치 32" },

  { t: "손실이 처음부터 안 내려간다", type: "decide",
    goal: "학습 손실이 2.30 에서 전혀 움직이지 않습니다. 클래스는 10개입니다.",
    sit: "무엇을 먼저 의심하시겠습니까?",
    opts: [
      { label: "2.30 은 무작위 추측값이다 — 모델이 아무것도 못 배우고 있으니 데이터·라벨·연결을 먼저 확인한다",
        fx: { algorithms: 3, debugging: 3 },
        fb: "✅ <b>ln(10) = 2.303 은 10개 중 하나를 무작위로 고르는 것과 같습니다.</b> 정확히 그 값에 머물러 있다면 학습이 느린 것이 아니라 <b>아예 신호가 안 흐르는 것</b>입니다. 라벨이 섞였는지, 입력이 전부 같은 값인지, 그래디언트가 끊겼는지를 먼저 봅니다. 학습률을 만지는 것은 그 다음입니다.",
        best: true },
      { label: "학습률이 너무 작아서",
        fx: { algorithms: 1 },
        fb: "△ 가능성은 있지만 그렇다면 <b>아주 조금씩이라도 내려가야</b> 합니다. 완전히 안 움직이는 것은 다른 이야기입니다." },
      { label: "모델이 너무 작아서",
        fx: { algorithms: -1 },
        fb: "⚠️ 작은 모델도 학습 데이터 몇 개는 외웁니다. <b>아주 작은 표본으로 과적합이 되는지</b> 먼저 시험해 보면 이 가설이 곧바로 걸러집니다." },
      { label: "더 오래 학습한다",
        fx: { algorithms: -2 },
        fb: "⚠️ 움직이지 않는 것을 더 오래 두면 그대로 움직이지 않습니다. <b>시간과 비용만 쓰고</b> 아무것도 알아내지 못합니다." }] },

  { t: "곡선 모양으로 원인을 나눈다", type: "build",
    goal: "학습·검증 손실 계열을 받아 <b>어떤 상황인지</b> 판정하는 계산을 만드세요.\n각각에 맞는 처방도 함께 냅니다.",
    hint: "네 가지 모양을 구분하면 됩니다 — <b>안 움직임</b>(무작위 추측값 근처에서 평평), <b>발산</b>(값이 커지거나 NaN), <b>과적합</b>(학습은 내려가는데 검증이 올라감), <b>정상</b>. 판정 기준을 코드로 적어 두면 매번 눈으로 보지 않아도 됩니다.",
    acc: "계열마다 상황 판정과 처방이 출력되고, 네 가지가 모두 구분되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst CLASSES = 10;\nconst CHANCE = Math.log(CLASSES);\n\nfunction diagnose(train, val) {\n  const last = train[train.length - 1];\n  if (train.some((x) => !isFinite(x)) || last > train[0] * 2)\n    return [\"발산\", \"학습률을 10분의 1로 · 그래디언트 클리핑 · 입력 정규화 확인\"];\n  const moved = (train[0] - last) / Math.max(train[0], 1e-9);\n  if (Math.abs(last - CHANCE) < 0.05 && moved < 0.05)\n    return [\"안 움직임\", \"라벨·입력 확인 · 아주 작은 표본에 과적합되는지 먼저 시험\"];\n  const valUp = val[val.length - 1] - Math.min.apply(null, val);\n  if (valUp > 0.15 && moved > 0.3)\n    return [\"과적합\", \"데이터 늘리기 · 정규화 · 조기 종료 · 모델 줄이기\"];\n  return [\"정상\", \"계속 학습 · 학습률 스케줄 검토\"];\n}\n\nconst series = {\n  \"평평함\": { t: [2.31, 2.30, 2.30, 2.30, 2.30], v: [2.31, 2.30, 2.30, 2.30, 2.30] },\n  \"튐\": { t: [2.3, 4.1, 9.8, 31.2, 120.0], v: [2.3, 4.5, 11.0, 40.0, 160.0] },\n  \"검증만 오름\": { t: [2.3, 1.4, 0.7, 0.25, 0.08], v: [2.3, 1.5, 1.2, 1.35, 1.6] },\n  \"잘 됨\": { t: [2.3, 1.5, 1.0, 0.75, 0.6], v: [2.3, 1.6, 1.1, 0.9, 0.82] }\n};\n\nout.push(\"무작위 추측값 ln(\" + CLASSES + \") = \" + CHANCE.toFixed(3));\nout.push(\"\");\nout.push(\"계열            판정        처방\");\nObject.keys(series).forEach((k) => {\n  const [what, fix] = diagnose(series[k].t, series[k].v);\n  out.push(k.padEnd(16) + what.padEnd(12) + fix);\n});\n\nout.push(\"\");\nout.push(\"모양이 다르면 원인이 다르다 — 같은 처방을 돌려쓰면 시간만 쓴다\");\nout.push(\"정확히 무작위 추측값에 머무는 것은 '느린 것' 이 아니라 '안 흐르는 것' 이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "가장 작은 시험을 먼저 한다", type: "build",
    goal: "표본 <b>몇 개만</b>으로 과적합이 되는지 시험하는 절차를 만드세요.\n이것이 되면 신호는 흐르는 것이고, 안 되면 그 앞이 문제입니다.",
    hint: "학습 파이프라인을 확인하는 가장 값싼 방법은 <b>표본 8개짜리로 손실을 0에 가깝게</b> 만들어 보는 것입니다. 되면 모델·손실·최적화기는 정상이고 문제는 데이터나 정규화에 있습니다. 안 되면 그 앞 어딘가가 끊긴 것이라, 큰 데이터로 며칠 돌리기 전에 몇 초 만에 알 수 있습니다.",
    acc: "작은 표본 과적합 시험의 결과에 따라 다음에 볼 곳이 달라지는 판정이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 여러 상황에서 '표본 8개 과적합' 시험을 돌린 결과 */\nconst runs = [\n  { n: \"정상 파이프라인\", finalLoss: 0.002, steps: 120 },\n  { n: \"라벨이 섞임\", finalLoss: 2.28, steps: 400 },\n  { n: \"입력이 전부 0\", finalLoss: 2.30, steps: 400 },\n  { n: \"그래디언트 끊김\", finalLoss: 2.30, steps: 400 },\n  { n: \"학습률 너무 큼\", finalLoss: 87.4, steps: 30 }\n];\n\nfunction verdict(r) {\n  if (!isFinite(r.finalLoss) || r.finalLoss > 10)\n    return [\"발산\", \"학습률부터 낮춘다 — 파이프라인 확인은 그 다음\"];\n  if (r.finalLoss < 0.05)\n    return [\"통과\", \"모델·손실·최적화기는 정상. 데이터와 정규화를 본다\"];\n  return [\"실패\", \"8개도 못 외운다 — 라벨·입력·연결 중 하나가 끊겼다\"];\n}\n\nout.push(\"표본 8개를 외우게 해 본다 (몇 초면 끝난다)\");\nout.push(\"\");\nout.push(\"상황                최종 손실   판정   다음에 볼 곳\");\nruns.forEach((r) => {\n  const [v, next] = verdict(r);\n  out.push(r.n.padEnd(20) + r.finalLoss.toFixed(3).padStart(9) + \"   \" +\n    v.padEnd(7) + next);\n});\n\nout.push(\"\");\nout.push(\"이 시험이 통과하면 신호는 흐른다 — 문제는 데이터나 정규화 쪽이다\");\nout.push(\"실패하면 큰 데이터로 며칠 돌릴 이유가 없다. 그 앞이 끊겨 있다\");\nout.push(\"파이프라인을 바꿀 때마다 가장 먼저 돌리는 시험으로 둔다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "과적합을 무엇으로 줄일 것인가", type: "decide",
    goal: "학습 정확도 99%, 검증 62% 입니다. 데이터는 8,000장입니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "데이터를 늘리거나 증강한다 — 8,000장은 이 문제에 적을 가능성이 크다",
        fx: { algorithms: 3, performance: 1 },
        fb: "✅ <b>과적합의 가장 근본적인 원인은 데이터가 적은 것</b>입니다. 모델을 줄이거나 정규화를 거는 것은 외울 능력을 깎는 것이라 상한도 함께 내려가지만, 데이터를 늘리면 상한이 올라갑니다. 새로 모으기 어렵다면 증강이 값싼 대안이고, 대개 가장 큰 효과를 냅니다.",
        best: true },
      { label: "드롭아웃과 가중치 감쇠를 건다",
        fx: { algorithms: 2 },
        fb: "△ 표준적인 대응이고 함께 씁니다. 다만 <b>외울 능력을 깎는 방향</b>이라 데이터가 정말 적으면 검증 성능의 상한이 낮게 묶입니다." },
      { label: "모델을 작게 만든다",
        fx: { algorithms: 1 },
        fb: "△ 과적합은 줄어듭니다. 다만 <b>표현력을 잃어</b> 학습·검증 둘 다 나빠지는 경우도 흔합니다. 다른 것을 먼저 시험합니다." },
      { label: "검증 세트를 다시 나눈다",
        fx: { algorithms: 1, debugging: 1 },
        fb: "△ 확인할 값어치는 있습니다. 검증 세트가 학습과 <b>분포가 다르거나</b> 같은 대상이 양쪽에 나뉘어 들어갔다면 숫자 자체가 거짓일 수 있습니다. 다만 37%p 차이는 대개 진짜 과적합입니다." }] },

  { t: "회고 — 어떤 순서로 좁혔나", type: "note",
    goal: "시도한 것들을 <b>순서와 소요 시간</b>과 함께 적으세요.\n다음에 같은 증상을 만나면 어떤 순서로 할지 목록으로 만듭니다.",
    ph: "증상 / 시도 순서와 각각의 소요 시간 / 헛되게 오래 걸린 것 / 작은 표본 시험을 언제 했나(더 일찍 했다면?) / 최종 원인 / 다음 순서 목록" }]
},

/* ─────────────────────────────────────────────── compiler */
{
  lv: 4, em: "🔤",
  title: "오류 메시지가 쓸모없다",
  desc: "'syntax error' 한 줄만 뱉는 파서를 고쳐, 어디서 무엇을 기대했는지 알려 주고 오류 하나에서 멈추지 않게 만든다",
  skills: ["compiler", "code", "communication"],
  phases: [

  { t: "지금 메시지를 적어 본다", type: "note",
    goal: "실제로 나오는 오류 메시지 몇 개와, <b>그것을 보고 무엇을 알 수 있었는지</b> 적으세요.\n알 수 없었던 것이 곧 고칠 목록입니다.",
    ph: "예: 'syntax error' — 어디인지 모름 · 'unexpected token' — 무엇을 기대했는지 모름 · 첫 오류에서 멈춤 — 20개 고치려면 20번 돌려야 함 · 줄 번호는 나오는데 열 번호가 없음" },

  { t: "좋은 오류 메시지의 조건", type: "decide",
    goal: "메시지를 고치려는데 무엇부터 담아야 할지 정해야 합니다.",
    sit: "무엇이 가장 중요합니까?",
    opts: [
      { label: "어디서(위치) · 무엇을 봤고(실제) · 무엇을 기대했는지(기대) 셋을 함께 준다",
        fx: { communication: 3, coding: 2 },
        fb: "✅ <b>이 셋이 있으면 대부분 스스로 고칠 수 있습니다.</b> 위치만 있으면 무엇이 문제인지 모르고, 기대만 있으면 어디를 볼지 모릅니다. 파서는 이 셋을 이미 다 알고 있습니다 — 어느 토큰에서 멈췄는지, 그 자리에서 어떤 토큰이 올 수 있었는지. 안 알려 주고 있을 뿐입니다.",
        best: true },
      { label: "고치는 방법을 제안한다",
        fx: { communication: 2 },
        fb: "△ 아주 좋은 추가이고 훌륭한 컴파일러들이 합니다. 다만 <b>셋이 먼저</b>이고, 제안은 틀릴 수 있어서 '아마도' 로 붙여야 합니다." },
      { label: "오류 코드를 붙여 문서를 찾게 한다",
        fx: { communication: 1 },
        fb: "△ 큰 언어에서는 쓸모 있습니다. 다만 <b>문서를 찾아가야 한다면</b> 그만큼 느려지므로, 메시지 자체로 해결되는 것이 낫습니다." },
      { label: "내부 파서 상태를 자세히 보여 준다",
        fx: { communication: -2 },
        fb: "⚠️ 컴파일러를 만드는 사람에게는 유용하지만 <b>쓰는 사람에게는 소음</b>입니다. 'expected one of: IDENT, NUMBER' 는 도움이 되고 '상태 47에서 축약 실패' 는 아닙니다." }] },

  { t: "위치와 기대를 담는다", type: "build",
    goal: "토큰 목록을 파싱하며 <b>어디서 무엇을 기대했는지</b> 담은 오류를 만드세요.\n원본 줄과 그 아래 화살표까지 함께 냅니다.",
    hint: "파서는 실패하는 순간 <b>현재 토큰의 위치</b>와 <b>그 자리에서 올 수 있었던 것</b>을 알고 있습니다. 그것을 예외에 담아 올리면 됩니다. 원본 줄을 함께 보여 주고 아래에 화살표를 찍으면, 줄 번호를 세어 찾아가는 수고가 사라집니다.",
    acc: "잘못된 입력에서 위치·실제·기대가 담긴 메시지와 화살표가 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction lex(src) {\n  const toks = [];\n  const re = /\\s*([0-9]+|[A-Za-z_]\\w*|[()+\\-*/=;])/g;\n  let m;\n  while ((m = re.exec(src))) {\n    const t = m[1];\n    toks.push({\n      v: t,\n      kind: /^[0-9]/.test(t) ? \"NUMBER\" : /^[A-Za-z_]/.test(t) ? \"IDENT\" : t,\n      at: m.index + m[0].length - t.length\n    });\n  }\n  toks.push({ v: \"<끝>\", kind: \"EOF\", at: src.length });\n  return toks;\n}\n\nfunction parseAssign(src) {\n  const toks = lex(src);\n  let i = 0;\n  const want = (kinds) => {\n    const t = toks[i];\n    if (kinds.indexOf(t.kind) >= 0) { i++; return t; }\n    return { err: { at: t.at, got: t.v, gotKind: t.kind, expect: kinds } };\n  };\n  let r = want([\"IDENT\"]); if (r.err) return r.err;\n  r = want([\"=\"]); if (r.err) return r.err;\n  r = want([\"NUMBER\", \"IDENT\"]); if (r.err) return r.err;\n  r = want([\";\"]); if (r.err) return r.err;\n  return null;\n}\n\nfunction report(src, e) {\n  const lines = [];\n  lines.push(\"오류: \" + (e.expect.length > 1 ? e.expect.join(\" 또는 \") : e.expect[0]) +\n    \" 가 필요한데 \" + (e.gotKind === \"EOF\" ? \"줄이 끝났습니다\" : \"'\" + e.got + \"' 이(가) 왔습니다\"));\n  lines.push(\"  \" + src);\n  lines.push(\"  \" + \" \".repeat(e.at) + \"^\");\n  return lines.join(\"\\n\");\n}\n\nconst inputs = [\"x = 42;\", \"x 42;\", \"x = ;\", \"x = 42\", \"= 42;\"];\ninputs.forEach((src) => {\n  const e = parseAssign(src);\n  out.push(e ? report(src, e) : \"통과: \" + src);\n  out.push(\"\");\n});\n\nout.push(\"파서는 실패하는 순간 위치와 기대를 이미 알고 있다 — 안 알려 줄 뿐이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "한 번에 여러 오류를 낸다", type: "build",
    goal: "첫 오류에서 멈추지 말고 <b>회복해서 계속</b> 파싱하도록 만드세요.\n한 번 돌려 여러 오류를 함께 보고합니다.",
    hint: "널리 쓰이는 회복 방법은 <b>동기화 지점까지 건너뛰기</b> 입니다. 오류가 나면 다음 세미콜론이나 닫는 괄호까지 토큰을 버리고 거기서 다시 시작하면, 뒤쪽 문장들의 오류도 볼 수 있습니다. 다만 회복이 잘못되면 <b>거짓 오류가 줄줄이</b> 나오므로, 너무 가까이 있는 오류는 묶어 하나로 보고합니다.",
    acc: "여러 오류가 있는 입력에서 오류가 여러 개 보고되고, 서로 가까운 거짓 오류가 묶여 줄어드는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst program = [\n  \"x = 1;\",\n  \"y 2;\",          // = 빠짐\n  \"z = ;\",         // 값 빠짐\n  \"w\",             // = · 값 · ; 셋 다 빠짐 — 한 줄에서 여러 개가 난다\n  \"v = 5;\"\n];\n\nfunction checkLine(line, lineNo) {\n  const errs = [];\n  const m = line.match(/^\\s*([A-Za-z_]\\w*)\\s*(=?)\\s*([0-9A-Za-z_]*)\\s*(;?)\\s*$/);\n  if (!m) { errs.push({ line: lineNo, col: 0, msg: \"문장을 알아볼 수 없습니다\" }); return errs; }\n  if (!m[2]) errs.push({ line: lineNo, col: line.indexOf(m[1]) + m[1].length, msg: \"'=' 가 필요합니다\" });\n  if (!m[3]) errs.push({ line: lineNo, col: line.length - (m[4] ? 1 : 0), msg: \"값이 필요합니다\" });\n  if (!m[4]) errs.push({ line: lineNo, col: line.length, msg: \"';' 로 끝나야 합니다\" });\n  return errs;\n}\n\n/* 오류가 날 때마다 멈추지 않고 다음 줄(동기화 지점)에서 다시 시작한다 */\nlet all = [];\nprogram.forEach((line, i) => { all = all.concat(checkLine(line, i + 1)); });\n\nout.push(\"첫 오류에서 멈출 때\");\nout.push(\"  \" + all[0].line + \"행 \" + all[0].col + \"열: \" + all[0].msg);\nout.push(\"  → 고치고 다시 돌려야 다음 오류를 본다. \" + all.length + \"개면 \" + all.length + \"번 돌린다\");\n\nout.push(\"\");\nout.push(\"회복해서 계속할 때 (\" + all.length + \"개)\");\nall.forEach((e) => out.push(\"  \" + e.line + \"행 \" + e.col + \"열: \" + e.msg));\n\n/* 같은 줄에서 여러 개가 나면 뒤엣것은 앞엣것 때문일 수 있다 */\nconst merged = [];\nall.forEach((e) => {\n  const prev = merged[merged.length - 1];\n  if (prev && prev.line === e.line) { prev.also = (prev.also || 0) + 1; return; }\n  merged.push(Object.assign({}, e));\n});\nout.push(\"\");\nout.push(\"같은 줄의 뒤따르는 오류를 묶으면 (\" + merged.length + \"개)\");\nmerged.forEach((e) => out.push(\"  \" + e.line + \"행 \" + e.col + \"열: \" + e.msg +\n  (e.also ? \"  (같은 줄에 \" + e.also + \"개 더 — 이것부터 고치면 사라질 수 있다)\" : \"\")));\n\nout.push(\"\");\nout.push(\"오류 \" + all.length + \"개 → 보고 \" + merged.length + \"개\");\nout.push(\"한 줄에서 여러 개가 나면 뒤엣것은 대개 앞엣것의 그림자다\");\nout.push(\"회복이 잘못되면 거짓 오류가 줄줄이 나온다 — 가까운 것은 묶는다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "무엇까지 제안할 것인가", type: "decide",
    goal: "'렝스' 라는 이름을 못 찾았습니다. 비슷한 이름 '길이' 가 범위 안에 있습니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "충분히 가까울 때만 '혹시 이것입니까' 로 제안하고, 아니면 제안하지 않는다",
        fx: { communication: 3, algorithms: 2 },
        fb: "✅ <b>틀린 제안은 없는 것보다 나쁩니다.</b> 편집 거리 같은 기준으로 충분히 가까운 것만 고르고, 확신을 담지 않은 말투로 붙입니다. 후보가 여럿이면 몇 개만 보여 주고, 하나도 가깝지 않으면 조용히 넘어가는 것이 맞습니다.",
        best: true },
      { label: "가장 가까운 이름을 항상 제안한다",
        fx: { communication: -1 },
        fb: "⚠️ 전혀 관계없는 이름이 제안되면 <b>사용자가 그것을 따라가 시간을 낭비합니다.</b> 거리 상한이 반드시 필요합니다." },
      { label: "범위 안의 모든 이름을 나열한다",
        fx: { communication: -2 },
        fb: "⚠️ 이름이 수백 개면 읽을 수 없습니다. <b>도움이 아니라 소음</b>이 됩니다." },
      { label: "제안하지 않는다",
        fx: { communication: 1 },
        fb: "△ 안전하지만 큰 도움을 놓칩니다. 오타는 아주 흔하고, 좋은 제안 하나가 <b>몇 분을 아껴 줍니다.</b>" }] },

  { t: "회고 — 무엇이 가장 도움이 됐나", type: "note",
    goal: "고친 메시지로 <b>실제 문제를 몇 개 풀어 보고</b> 무엇이 가장 도움이 됐는지 적으세요.\n아직 부족한 자리도 적습니다.",
    ph: "고친 것 목록 / 문제 5개를 풀며 각각 몇 초 만에 원인을 찾았나 / 가장 도움이 된 요소 / 거짓 오류가 나온 경우 / 제안이 틀린 경우 / 다음에 붙일 것" }]
},

/* ─────────────────────────────────────────────── fp */
{
  lv: 3, em: "🔁",
  title: "상태를 바꾸지 않고 다룬다",
  desc: "여기저기서 객체를 고쳐 생기는 버그를 불변 갱신·순수 함수·되돌리기 가능한 상태 이력으로 바꿔 추적 가능하게 만든다",
  skills: ["fp", "javascript", "code"],
  phases: [

  { t: "누가 고치는지 적는다", type: "note",
    goal: "한 객체를 <b>몇 곳에서 고치는지</b> 세어 적으세요.\n세 곳이 넘으면 무엇이 언제 바뀌었는지 아무도 모르게 됩니다.",
    ph: "예: cart 객체를 고치는 곳 7군데 · 그중 2곳은 이벤트 콜백 안 · 할인 계산 함수가 cart 를 몰래 고침 · 화면이 가끔 옛 값을 보임 · '어디서 바뀌었나' 를 찾는 데 반나절" },

  { t: "왜 고치지 않는 편이 나은가", type: "decide",
    goal: "객체를 그 자리에서 고치는 코드가 여기저기 있습니다.",
    sit: "무엇이 문제입니까?",
    opts: [
      { label: "같은 객체를 여러 곳이 들고 있어, 한 곳의 변경이 다른 곳에 예고 없이 나타난다",
        fx: { coding: 3, debugging: 2 },
        fb: "✅ <b>참조를 나눠 가진 순간 변경은 모두에게 보입니다.</b> 어느 곳이 언제 고쳤는지 추적할 수 없고, 화면이 옛 값을 보이는 것도 '바뀐 것을 못 알아채서' 가 아니라 '같은 객체라 바뀐 줄 몰라서' 인 경우가 많습니다. 새 객체를 만들어 돌려주면 변경이 곧 새 값이 되어 눈에 보입니다.",
        best: true },
      { label: "성능이 나빠서",
        fx: { performance: -1 },
        fb: "⚠️ 오히려 반대입니다. 그 자리에서 고치는 것이 <b>대개 더 빠릅니다.</b> 불변으로 하는 이유는 성능이 아니라 추적 가능성입니다." },
      { label: "타입 검사가 안 돼서",
        fx: { coding: -1 },
        fb: "⚠️ 타입은 무엇이 들어 있는지를 말할 뿐 <b>언제 누가 바꿨는지</b>는 말해 주지 않습니다. 지금 문제는 그쪽입니다." },
      { label: "테스트하기 어려워서",
        fx: { coding: 1 },
        fb: "△ 맞는 결과지만 원인이 아니라 증상입니다. <b>왜 어려운가</b> 하면 함수가 바깥 상태를 고치기 때문이고, 그것이 위 항목의 이야기입니다." }] },

  { t: "고치지 않고 갱신한다", type: "build",
    goal: "중첩된 객체의 깊은 곳을 <b>원본을 안 건드리고</b> 갱신하는 함수를 만드세요.\n원본이 그대로인지 확인합니다.",
    hint: "겉만 복사하면 <b>안쪽은 여전히 같은 객체</b>라 원본이 함께 바뀝니다. 바뀌는 경로 위의 것만 새로 만들고 나머지는 공유하면, 복사 비용을 아끼면서도 원본을 지킬 수 있습니다. 이 '경로만 복사' 가 불변 자료구조의 핵심입니다.",
    acc: "갱신 뒤 원본이 그대로이고, 바뀌지 않은 가지는 같은 객체를 공유하는 것이 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 경로 위의 것만 새로 만들고 나머지는 공유한다 */\nfunction setIn(obj, path, value) {\n  if (!path.length) return value;\n  const [head, ...rest] = path;\n  const copy = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);\n  copy[head] = setIn(obj[head], rest, value);\n  return copy;\n}\n\nconst state = {\n  user: { name: \"민준\", addr: { city: \"부산\", zip: \"48058\" } },\n  cart: { items: [{ id: 1, qty: 2 }, { id: 2, qty: 1 }], coupon: null }\n};\n\nconst next = setIn(state, [\"cart\", \"items\", 0, \"qty\"], 5);\n\nout.push(\"원본 수량   \" + state.cart.items[0].qty);\nout.push(\"새 상태 수량 \" + next.cart.items[0].qty);\nout.push(\"원본이 그대로인가: \" + (state.cart.items[0].qty === 2));\n\nout.push(\"\");\nout.push(\"무엇이 새로 만들어졌나\");\nout.push(\"  state !== next            \" + (state !== next));\nout.push(\"  cart 새로 만들어짐        \" + (state.cart !== next.cart));\nout.push(\"  items 새로 만들어짐       \" + (state.cart.items !== next.cart.items));\nout.push(\"  items[0] 새로 만들어짐    \" + (state.cart.items[0] !== next.cart.items[0]));\nout.push(\"\");\nout.push(\"무엇이 공유되나 (복사 안 함)\");\nout.push(\"  user 그대로 공유          \" + (state.user === next.user));\nout.push(\"  items[1] 그대로 공유      \" + (state.cart.items[1] === next.cart.items[1]));\n\nout.push(\"\");\nout.push(\"바뀌는 경로 위의 것만 새로 만든다 — 나머지는 그대로 나눠 쓴다\");\nout.push(\"그래서 큰 상태여도 복사 비용이 경로 길이만큼만 든다\");\nout.push(\"바뀐 가지는 참조가 달라져서, 화면이 '무엇이 바뀌었나' 를 참조 비교로 안다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "함수를 순수하게 만든다", type: "build",
    goal: "바깥을 건드리는 함수와 <b>입력만 보고 값을 돌려주는</b> 함수를 견주세요.\n같은 입력에 같은 출력이 나오는지 확인합니다.",
    hint: "순수한 함수는 <b>같은 입력에 언제나 같은 출력</b>을 내고 바깥을 건드리지 않습니다. 그래서 테스트가 쉽고, 순서를 바꿔도 되고, 캐시할 수 있습니다. 바깥을 건드리는 부분을 <b>가장자리로 밀어내면</b> 안쪽은 전부 순수해집니다 — 이것이 함수형 설계의 실용적인 요점입니다.",
    acc: "두 함수를 같은 입력으로 여러 번 불러 결과가 같은지 다른지가 출력되고, 부작용의 흔적이 드러나면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 바깥을 건드린다 — 부르는 순서와 횟수에 결과가 달라진다 */\nlet discountPool = 10000;\nfunction applyDiscountImpure(cart) {\n  const use = Math.min(discountPool, cart.total * 0.1);\n  discountPool -= use;\n  cart.total -= use;              // 인자를 고친다\n  return cart.total;\n}\n\n/* 입력만 보고 값을 돌려준다 */\nfunction applyDiscountPure(cart, pool) {\n  const use = Math.min(pool, cart.total * 0.1);\n  return { total: cart.total - use, poolLeft: pool - use, used: use };\n}\n\nconst cart = { total: 50000 };\nout.push(\"바깥을 건드리는 함수 — 같은 장바구니로 세 번\");\nfor (let i = 0; i < 3; i++) {\n  const c = { total: 50000 };\n  out.push(\"  \" + (i + 1) + \"번째: \" + applyDiscountImpure(c) + \"   남은 재원 \" + discountPool);\n}\nout.push(\"  → 같은 입력인데 결과가 매번 다르다\");\n\nout.push(\"\");\nout.push(\"순수 함수 — 같은 장바구니와 같은 재원으로 세 번\");\nconst rs = [];\nfor (let i = 0; i < 3; i++) rs.push(applyDiscountPure({ total: 50000 }, 10000));\nrs.forEach((r, i) => out.push(\"  \" + (i + 1) + \"번째: \" + r.total + \"   쓴 재원 \" + r.used));\nout.push(\"  → 언제나 같다: \" + (new Set(rs.map((r) => r.total)).size === 1));\n\nout.push(\"\");\nout.push(\"원본 장바구니가 그대로인가: \" + (cart.total === 50000));\nout.push(\"\");\nout.push(\"바깥을 건드리는 부분을 가장자리로 밀어내면 안쪽은 전부 순수해진다\");\nout.push(\"순수한 함수는 테스트가 쉽고, 순서를 바꿔도 되고, 캐시할 수 있다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "되돌릴 수 있게 만든다", type: "build",
    goal: "상태를 바꿀 때마다 <b>새 값을 쌓아</b> 되돌리기·다시 하기를 만드세요.\n무엇이 언제 바뀌었는지도 함께 봅니다.",
    hint: "값을 고치지 않고 새로 만들면 <b>옛 값이 그대로 남아</b> 되돌리기가 거의 공짜가 됩니다. 목록에 쌓아 두고 가리키는 자리만 옮기면 됩니다. 새 변경을 하면 되돌린 뒤의 것들은 버려야 하고(다시 하기가 끊긴다), 목록이 무한히 자라지 않도록 상한도 필요합니다.",
    acc: "여러 번 바꾸고 되돌리고 다시 하는 흐름이 출력되고, 되돌린 뒤 새 변경을 했을 때 앞의 것이 버려지는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction history(initial, limit) {\n  let past = [initial], at = 0;\n  return {\n    apply(fn, label) {\n      const next = fn(past[at]);\n      past = past.slice(0, at + 1).concat([next]);   // 되돌린 뒤의 것은 버린다\n      if (past.length > limit) past = past.slice(past.length - limit);\n      at = past.length - 1;\n      return label + \" → \" + JSON.stringify(next);\n    },\n    undo() { if (at > 0) at--; return JSON.stringify(past[at]); },\n    redo() { if (at < past.length - 1) at++; return JSON.stringify(past[at]); },\n    now() { return past[at]; },\n    depth() { return past.length + \" (현재 \" + (at + 1) + \"번째)\"; }\n  };\n}\n\nconst h = history({ qty: 1 }, 20);\nout.push(h.apply((s) => ({ qty: s.qty + 1 }), \"수량 +1\"));\nout.push(h.apply((s) => ({ qty: s.qty + 1 }), \"수량 +1\"));\nout.push(h.apply((s) => ({ qty: s.qty * 10 }), \"수량 ×10\"));\nout.push(\"이력 \" + h.depth());\n\nout.push(\"\");\nout.push(\"되돌리기 → \" + h.undo());\nout.push(\"되돌리기 → \" + h.undo());\nout.push(\"다시하기 → \" + h.redo());\n\nout.push(\"\");\nout.push(h.apply((s) => ({ qty: s.qty + 100 }), \"수량 +100\"));\nout.push(\"이력 \" + h.depth() + \"   ← 되돌린 뒤 새 변경을 해서 앞의 것이 버려졌다\");\nout.push(\"다시하기 → \" + h.redo() + \"   ← 더 갈 곳이 없다\");\n\nout.push(\"\");\nout.push(\"값을 고치지 않으면 옛 값이 그대로 남아 되돌리기가 거의 공짜다\");\nout.push(\"목록에 상한을 두지 않으면 오래 쓰는 화면에서 메모리가 계속 는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 어디까지 불변으로 했나", type: "note",
    goal: "불변으로 바꾼 자리와 <b>그대로 둔 자리</b>를 나눠 적으세요.\n전부 바꾸는 것이 목적이 아니라, 추적이 필요한 곳을 고르는 것이 목적입니다.",
    ph: "불변으로 바꾼 상태 / 그대로 둔 것과 이유(성능·지역 변수 등) / '어디서 바뀌었나' 를 찾는 시간 변화 / 되돌리기가 생겨 좋아진 것 / 이력 상한을 얼마로 뒀나" }]
}

]};
