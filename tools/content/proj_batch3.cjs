/* 두 번째 프로젝트 묶음 3 — 프런트엔드와 알고리즘 쪽의 깊이.
   화면이 느린 이유, 상태가 어긋나는 이유, 검색이 안 맞는 이유,
   자료구조 선택이 바뀌는 지점, 그리고 남의 코드를 물려받는 일. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── react */
{
  lv: 3, em: "🖼️",
  title: "타이핑할 때마다 화면이 버벅인다",
  desc: "입력 한 글자에 목록 전체가 다시 그려지는 화면을 프로파일로 짚어 내고, 다시 그리는 범위를 줄여 큰 목록에서도 매끄럽게 만든다",
  skills: ["react", "performance", "javascript"],
  phases: [

  { t: "느린 순간을 좁힌다", type: "note",
    goal: "'느리다' 가 아니라 <b>어떤 조작이 몇 ms 걸리는지</b> 적으세요.\n어느 규모에서 느껴지기 시작하는지도 함께 적습니다.",
    ph: "예: 검색어 한 글자 입력에 220ms · 목록 2,000행일 때부터 체감 · 500행에서는 40ms · 스크롤은 멀쩡 · 정렬 버튼도 같은 증상 · 입력값이 상위 상태에 있음" },

  { t: "왜 전부 다시 그려지는가", type: "decide",
    goal: "검색어를 상위 컴포넌트의 상태로 두었더니, 한 글자마다 그 아래 전부가 다시 그려집니다.",
    sit: "무엇이 문제입니까?",
    opts: [
      { label: "상태가 바뀌는 자리가 필요한 것보다 위에 있어서, 관계없는 부분까지 함께 다시 그려진다",
        fx: { coding: 3, performance: 2 },
        fb: "✅ <b>상태의 위치가 다시 그리는 범위를 정합니다.</b> 검색어를 쓰는 곳이 입력창과 목록뿐이라면, 그 둘을 감싸는 가장 작은 자리에 두면 됩니다. 위로 올릴수록 편하지만 그만큼 넓게 다시 그려지고, 이 맞바꿈이 프런트엔드 성능의 절반입니다.",
        best: true },
      { label: "목록 항목마다 메모이제이션을 걸지 않아서",
        fx: { performance: 1 },
        fb: "△ 도움은 됩니다. 다만 <b>원인이 아니라 증상을 덮는 것</b>이고, 항목마다 비교 비용이 새로 생깁니다. 상태를 옮겨서 아예 다시 그려지지 않게 하는 편이 먼저입니다." },
      { label: "가상 스크롤을 안 써서",
        fx: { performance: 1 },
        fb: "△ 2,000행이면 결국 필요한 도구입니다. 다만 <b>500행에서 40ms</b> 라면 행 수만의 문제가 아니고, 다시 그리는 범위를 줄이는 것이 먼저입니다." },
      { label: "입력이 제어 컴포넌트라서",
        fx: { coding: -1 },
        fb: "⚠️ 제어 컴포넌트 자체는 문제가 아닙니다. 문제는 <b>그 값이 어디에 저장되는가</b>이고, 같은 제어 컴포넌트라도 상태 위치에 따라 결과가 완전히 달라집니다." }] },

  { t: "다시 그리는 범위를 센다", type: "build",
    goal: "상태 위치에 따라 <b>몇 개가 다시 그려지는지</b> 세어 비교하세요.\n위에 둘 때와 가장 작은 자리에 둘 때를 나란히 둡니다.",
    hint: "다시 그려지는 수는 '상태를 가진 컴포넌트의 자손 수' 로 정해집니다. 트리를 만들어 두고 상태 위치를 바꿔 가며 세면 차이가 바로 보입니다. 실제 도구도 같은 것을 재고 그림으로 보여 줄 뿐입니다.",
    acc: "상태 위치별로 다시 그려지는 컴포넌트 수와 예상 시간이 출력되고, 가장 작은 자리를 찾는 계산이 함께 나오면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 화면 트리 — 이름과 자식, 그리는 데 드는 시간 */\nfunction makeTree(rows) {\n  return { n: \"App\", ms: 1, kids: [\n    { n: \"Header\", ms: 2, kids: [] },\n    { n: \"Sidebar\", ms: 8, kids: [{ n: \"Filters\", ms: 4, kids: [] }] },\n    { n: \"Main\", ms: 1, kids: [\n      { n: \"SearchBox\", ms: 1, kids: [] },\n      { n: \"List\", ms: 2, kids: Array.from({ length: rows }, (_, i) => ({ n: \"Row\" + i, ms: 0.1, kids: [] })) }\n    ] },\n    { n: \"Footer\", ms: 3, kids: [] }\n  ] };\n}\n\nfunction find(node, name) {\n  if (node.n === name) return node;\n  for (const k of node.kids) { const r = find(k, name); if (r) return r; }\n  return null;\n}\nfunction weigh(node) {\n  return node.kids.reduce((a, k) => {\n    const r = weigh(k);\n    return { count: a.count + r.count, ms: a.ms + r.ms };\n  }, { count: 1, ms: node.ms });\n}\n\nfunction report(rows) {\n  const tree = makeTree(rows);\n  const at = (w) => weigh(find(tree, w));\n  out.push(\"행 \" + rows + \"개\");\n  out.push(\"  상태를 둔 자리   다시 그리는 수   예상 시간\");\n  [\"App\", \"Main\", \"List\"].forEach((w) => {\n    const x = at(w);\n    out.push(\"  \" + w.padEnd(17) + String(x.count).padEnd(17) + x.ms.toFixed(1) + \"ms\");\n  });\n  return { app: at(\"App\"), main: at(\"Main\") };\n}\n\nconst small = report(50);\nout.push(\"\");\nconst big = report(2000);\n\nout.push(\"\");\nout.push(\"검색어를 쓰는 곳: SearchBox · List → 가장 작은 공통 자리는 Main\");\nout.push(\"  행 50개:   \" + small.app.ms.toFixed(1) + \"ms → \" + small.main.ms.toFixed(1) +\n  \"ms  (\" + Math.round((1 - small.main.ms / small.app.ms) * 100) + \"% 절약)\");\nout.push(\"  행 2000개: \" + big.app.ms.toFixed(1) + \"ms → \" + big.main.ms.toFixed(1) +\n  \"ms  (\" + Math.round((1 - big.main.ms / big.app.ms) * 100) + \"% 절약)\");\n\nout.push(\"\");\nout.push(\"상태를 내리는 것은 작은 목록에서 크게 듣고 큰 목록에서는 거의 안 듣는다\");\nout.push(\"행이 많아지면 비용이 List 안으로 몰리기 때문이다 — 거기는 다른 처방이 필요하다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "한 글자마다 걸러 내지 않는다", type: "build",
    goal: "입력할 때마다 무거운 계산이 도는 것을 <b>늦추거나 건너뛰어</b> 줄이세요.\n미루기와 솎아내기의 차이를 실행 횟수로 보여 줍니다.",
    hint: "'마지막 입력 뒤 조금 기다렸다 한 번' 과 '일정 간격으로 최대 한 번' 은 다른 도구입니다. 검색은 앞쪽이 맞고(중간 글자로 검색할 이유가 없다), 스크롤 위치 저장은 뒤쪽이 맞습니다. 둘 다 <b>마지막 값이 반드시 반영되어야</b> 한다는 조건이 있습니다.",
    acc: "같은 입력 흐름에 대해 안 거른 경우·미루기·솎아내기의 실행 횟수가 나오고, 마지막 값이 세 경우 모두 반영되는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 사람이 타이핑한 시각(ms) 과 그때의 값 */\nconst keys = [];\n\"검색어입니다\".split(\"\").forEach((ch, i) => keys.push({ at: i * 60, v: \"검색어입니다\".slice(0, i + 1) }));\nkeys.push({ at: 400, v: \"검색어입니다!\" });\n\nfunction plain(evts) { return evts.map((e) => e.v); }\n\nfunction debounce(evts, wait) {\n  const fired = [];\n  evts.forEach((e, i) => {\n    const next = evts[i + 1];\n    if (!next || next.at - e.at >= wait) fired.push(e.v);   // 뒤가 조용하면 실행\n  });\n  return fired;\n}\n\nfunction throttle(evts, every) {\n  const fired = [];\n  let last = -Infinity;\n  evts.forEach((e, i) => {\n    if (e.at - last >= every) { fired.push(e.v); last = e.at; }\n    else if (i === evts.length - 1) fired.push(e.v);        // 마지막은 반드시\n  });\n  return fired;\n}\n\nconst a = plain(keys), b = debounce(keys, 150), c = throttle(keys, 150);\nout.push(\"입력 \" + keys.length + \"번\");\nout.push(\"  안 거름     실행 \" + String(a.length).padStart(2) + \"회   마지막 \\\"\" + a[a.length - 1] + \"\\\"\");\nout.push(\"  미루기(150) 실행 \" + String(b.length).padStart(2) + \"회   마지막 \\\"\" + b[b.length - 1] + \"\\\"\");\nout.push(\"  솎아내기(150) 실행 \" + String(c.length).padStart(2) + \"회   마지막 \\\"\" + c[c.length - 1] + \"\\\"\");\n\nconst want = keys[keys.length - 1].v;\nout.push(\"\");\nout.push(\"마지막 값이 셋 다 반영됐는가: \" +\n  ([a, b, c].every((x) => x[x.length - 1] === want)));\nout.push(\"검색은 미루기 — 중간 글자로 검색할 이유가 없다\");\nout.push(\"스크롤 위치 저장은 솎아내기 — 도중에도 주기적으로 남겨야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "2,000행을 어떻게 그릴 것인가", type: "decide",
    goal: "다시 그리는 범위를 줄였는데도 처음 그릴 때 2,000행이 무겁습니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "화면에 보이는 만큼만 그리고 스크롤에 따라 갈아 끼운다",
        fx: { performance: 3, coding: 2 },
        fb: "✅ <b>사람이 한 번에 보는 것은 20행 남짓</b>입니다. 나머지 1,980행을 그리는 것은 순수한 낭비이고, 행이 늘어도 비용이 그대로라는 것이 이 방식의 진짜 이득입니다. 다만 행 높이가 제각각이면 계산이 까다로워지므로, 고정 높이로 둘 수 있는지 먼저 봅니다.",
        best: true },
      { label: "한 번에 50행씩 더 불러오는 버튼을 둔다",
        fx: { performance: 2, coding: 1 },
        fb: "△ 값싸고 효과도 확실합니다. 다만 <b>계속 누르면 결국 같은 문제</b>로 돌아오고, 검색·정렬처럼 전체를 봐야 하는 조작과 잘 안 맞습니다." },
      { label: "행 컴포넌트를 가볍게 만든다",
        fx: { performance: 1 },
        fb: "△ 함께 해야 할 일입니다. 다만 <b>행당 비용을 절반으로 줄여도 행 수가 두 배면 원점</b>이라, 구조를 바꾸는 것과 함께 해야 뜻이 있습니다." },
      { label: "서버에서 이미 렌더된 HTML 을 받는다",
        fx: { system_design: -1 },
        fb: "⚠️ 처음 그리는 것은 빨라지지만 <b>그 뒤의 조작은 그대로</b>입니다. 검색·정렬이 느린 것이 문제라면 해결되지 않습니다." }] },

  { t: "보이는 것만 그린다", type: "build",
    goal: "스크롤 위치와 화면 높이로 <b>그릴 범위</b>를 계산하세요.\n위아래로 여유분을 두어 빠르게 스크롤해도 빈칸이 안 보이게 합니다.",
    hint: "시작 첨자는 '스크롤 위치 ÷ 행 높이', 개수는 '화면 높이 ÷ 행 높이' 입니다. 여기에 <b>위아래 여유분</b>을 두어야 스크롤 도중 빈칸이 안 보입니다. 목록 끝에서 범위를 넘지 않도록 자르는 것도 잊으면 안 됩니다.",
    acc: "스크롤 위치별 그릴 범위와 개수가 출력되고, 목록 끝에서도 범위를 벗어나지 않는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst TOTAL = 2000, ROW = 40, VIEW = 600, OVER = 3;\n\nfunction slice(scrollTop) {\n  const first = Math.floor(scrollTop / ROW);\n  const visible = Math.ceil(VIEW / ROW);\n  const start = Math.max(0, first - OVER);\n  const end = Math.min(TOTAL, first + visible + OVER);\n  return { start: start, end: end, count: end - start,\n    padTop: start * ROW, padBottom: (TOTAL - end) * ROW };\n}\n\nout.push(\"스크롤     범위          그리는 수  위 여백   아래 여백\");\n[0, 400, 20000, 79600, 80000].forEach((s) => {\n  const r = slice(s);\n  out.push(String(s).padEnd(11) +\n    (r.start + \"~\" + r.end).padEnd(14) +\n    String(r.count).padEnd(11) +\n    String(r.padTop).padEnd(10) + r.padBottom);\n});\n\nout.push(\"\");\nconst worst = [0, 400, 20000, 79600, 80000].map(slice)\n  .reduce((a, b) => (b.count > a.count ? b : a));\nout.push(\"가장 많이 그릴 때: \" + worst.count + \"행 (전체 \" + TOTAL + \"행)\");\nout.push(\"행이 20,000개가 되어도 그리는 수는 그대로다\");\n\nconst last = slice(80000);\nout.push(\"\");\nout.push(\"끝에서 범위를 넘지 않았는가: \" + (last.end <= TOTAL && last.padBottom >= 0));\nout.push(\"여백 합계가 전체 높이와 맞는가: \" +\n  (last.padTop + last.count * ROW + last.padBottom === TOTAL * ROW));\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 무엇이 진짜 무거웠나", type: "note",
    goal: "셋 중 <b>어느 것이 얼마나</b> 기여했는지 적으세요 — 상태 위치, 입력 거르기, 그리는 행 수.\n숫자로 적어야 다음 화면에서 무엇부터 볼지 정해집니다.",
    ph: "처음 220ms → 조치별 얼마씩 줄었나 / 가장 효과 큰 조치 / 안 해도 됐던 조치 / 2,000행 → 20,000행이면 어떻게 되나 / 다음 화면에서 먼저 볼 것" }]
},

/* ─────────────────────────────────────────────── algo */
{
  lv: 4, em: "🔎",
  title: "검색이 원하는 것을 못 찾는다",
  desc: "오타·부분 일치·순위 문제로 검색이 헛도는 상황을 정확도로 재고, 자료구조와 점수 규칙을 바꿔 가며 개선한다",
  skills: ["algo", "javascript", "performance"],
  phases: [

  { t: "못 찾은 사례를 모은다", type: "note",
    goal: "'검색이 별로다' 를 <b>못 찾은 구체적인 사례</b>로 바꾸세요.\n무엇을 쳤을 때 무엇이 나와야 했는데 무엇이 나왔는지 적습니다.",
    ph: "예: '아이폰케이스' → 0건 (상품명은 '아이폰 케이스') · '갤럭시s24' → 24건인데 s24 울트라가 8위 · '노트북거치대' → 0건 · 오타 '맥부기' → 0건 · 상위 10개 중 관련 있는 것 평균 3개" },

  { t: "무엇을 먼저 고칠 것인가", type: "decide",
    goal: "못 찾는 사례가 네 가지 유형으로 나뉩니다: 띄어쓰기, 부분 일치, 오타, 순위.",
    sit: "무엇부터 고치시겠습니까?",
    opts: [
      { label: "정확도를 유형별로 재서, 사례 수가 많고 고치기 쉬운 것부터",
        fx: { algorithms: 3, performance: 2 },
        fb: "✅ <b>네 유형의 사례 수가 같지 않습니다.</b> 띄어쓰기 하나가 전체의 절반이면 그것만 고쳐도 체감이 달라지고, 오타 교정은 어렵고 사례가 적을 수 있습니다. 재고 나서 고르면 같은 시간에 훨씬 많이 좋아집니다.",
        best: true },
      { label: "오타 교정부터 — 가장 티가 난다",
        fx: { algorithms: -1 },
        fb: "⚠️ 가장 어렵고 <b>잘못 교정하면 오히려 나빠집니다.</b> '맥부기' 를 '맥북기' 로 고치면 여전히 0건이고, 사용자는 자기가 안 친 말로 검색된 결과를 보게 됩니다." },
      { label: "검색 엔진을 도입한다",
        fx: { system_design: -1 },
        fb: "⚠️ 좋은 도구지만 <b>넣는다고 저절로 좋아지지 않습니다.</b> 분석기 설정·색인 설계·순위 규칙을 여전히 정해야 하고, 그것이 지금 못 하고 있는 일입니다. 무엇이 문제인지 먼저 알아야 도구도 제대로 씁니다." },
      { label: "순위 규칙을 손본다",
        fx: { algorithms: 1 },
        fb: "△ 필요한 일입니다. 다만 <b>0건으로 나오는 사례</b>가 있다면 순위는 그 다음입니다. 아예 안 나오는 것을 먼저 나오게 해야 합니다." }] },

  { t: "정확도를 잰다", type: "build",
    goal: "검색 결과의 좋고 나쁨을 <b>숫자로</b> 재세요.\n정답 집합을 두고 상위 몇 개 중 몇 개가 맞았는지 계산합니다.",
    hint: "검색 품질은 두 가지로 봅니다 — <b>맞는 것 중 몇 개를 찾았나</b>(재현율)와 <b>찾은 것 중 몇 개가 맞나</b>(정밀도). 사용자는 상위 몇 개만 보므로 '상위 10개 안에서' 재는 것이 실제에 가깝습니다. 순위까지 보려면 정답이 몇 번째에 있는지도 함께 세야 합니다.",
    acc: "질의별 정밀도·재현율과 첫 정답의 순위가 출력되고, 전체 평균이 함께 나오면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst cases = [\n  { q: \"아이폰케이스\", want: [\"p1\", \"p2\"], got: [] },\n  { q: \"갤럭시s24\", want: [\"p9\"], got: [\"p3\", \"p4\", \"p5\", \"p6\", \"p7\", \"p8\", \"p9\", \"p10\"] },\n  { q: \"노트북거치대\", want: [\"p11\"], got: [] },\n  { q: \"무선이어폰\", want: [\"p12\", \"p13\"], got: [\"p12\", \"p13\", \"p14\"] }\n];\n\nfunction score(c, k) {\n  const top = c.got.slice(0, k);\n  const hit = top.filter((x) => c.want.indexOf(x) >= 0).length;\n  const prec = top.length ? hit / top.length : 0;\n  const rec = c.want.length ? hit / c.want.length : 0;\n  let rank = 0;\n  for (let i = 0; i < c.got.length; i++) if (c.want.indexOf(c.got[i]) >= 0) { rank = i + 1; break; }\n  return { prec: prec, rec: rec, rank: rank };\n}\n\nout.push(\"질의            정밀도  재현율  첫 정답 순위\");\nlet sp = 0, sr = 0;\ncases.forEach((c) => {\n  const s = score(c, 10);\n  sp += s.prec; sr += s.rec;\n  out.push(c.q.padEnd(16) +\n    (s.prec * 100).toFixed(0).padStart(4) + \"%   \" +\n    (s.rec * 100).toFixed(0).padStart(4) + \"%   \" +\n    (s.rank ? s.rank + \"위\" : \"없음\"));\n});\n\nout.push(\"\");\nout.push(\"평균 정밀도 \" + (sp / cases.length * 100).toFixed(0) + \"% · 평균 재현율 \" +\n  (sr / cases.length * 100).toFixed(0) + \"%\");\nconst zero = cases.filter((c) => !c.got.length).length;\nout.push(\"0건으로 나온 질의 \" + zero + \"/\" + cases.length + \" — 순위보다 이것이 먼저다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "띄어쓰기와 부분 일치를 잡는다", type: "build",
    goal: "'아이폰케이스' 가 '아이폰 케이스' 를 찾도록 <b>둘 다 같은 모양</b>으로 바꾸는 정규화를 만드세요.\n부분 일치도 함께 되게 합니다.",
    hint: "질의와 문서를 <b>같은 방식으로</b> 정규화해야 합니다. 한쪽만 하면 여전히 안 맞습니다. 공백·대소문자·기호를 없앤 형태를 따로 저장해 두고 그것끼리 견주면 띄어쓰기 문제가 통째로 사라집니다. 부분 일치는 정규화한 문서가 정규화한 질의를 포함하는지 보면 됩니다.",
    acc: "정규화 전후의 검색 결과가 나란히 출력되고, 띄어쓰기·대소문자·기호가 달라도 찾아지는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst docs = [\n  { id: \"p1\", name: \"아이폰 15 케이스 투명\" },\n  { id: \"p2\", name: \"아이폰케이스 가죽\" },\n  { id: \"p9\", name: \"갤럭시 S24 울트라\" },\n  { id: \"p11\", name: \"노트북 거치대 알루미늄\" },\n  { id: \"p12\", name: \"무선 이어폰 노이즈캔슬링\" }\n];\n\n/* 질의와 문서에 똑같이 적용한다 — 한쪽만 하면 여전히 안 맞는다 */\nconst norm = (s) => String(s).toLowerCase().replace(/[\\s\\-_/()]/g, \"\");\ndocs.forEach((d) => { d.key = norm(d.name); });\n\nfunction exact(q) { return docs.filter((d) => d.name.indexOf(q) >= 0).map((d) => d.id); }\nfunction normed(q) { const k = norm(q); return docs.filter((d) => d.key.indexOf(k) >= 0).map((d) => d.id); }\n\nconst qs = [\"아이폰케이스\", \"아이폰 케이스\", \"갤럭시s24\", \"노트북거치대\", \"S24\"];\nout.push(\"질의            그대로 비교        정규화 비교\");\nqs.forEach((q) => {\n  const a = exact(q), b = normed(q);\n  out.push(q.padEnd(16) + (a.length ? a.join(\",\") : \"0건\").padEnd(18) +\n    (b.length ? b.join(\",\") : \"0건\"));\n});\n\nout.push(\"\");\nout.push(\"질의와 문서에 같은 정규화를 걸어야 한다 — 한쪽만 하면 그대로다\");\nout.push(\"정규화한 형태를 미리 저장해 두면 검색할 때 다시 계산하지 않는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "순위를 어떻게 매길 것인가", type: "decide",
    goal: "이제 결과는 나오는데, 원하는 것이 8위에 있습니다.",
    sit: "순위를 어떻게 정하시겠습니까?",
    opts: [
      { label: "여러 신호(일치 위치·완전 일치·인기·최신)에 가중치를 주고, 가중치는 사례로 조정한다",
        fx: { algorithms: 3, performance: 1 },
        fb: "✅ <b>하나의 신호로는 언제나 반례가 나옵니다.</b> 이름 앞쪽에서 일치하면 더 관련 있고, 완전히 같으면 더더욱이며, 많이 팔린 것이 대개 원하는 것입니다. 가중치를 감이 아니라 <b>모아 둔 사례로 조정</b>하면 고칠 때마다 나빠지는 것을 막을 수 있습니다.",
        best: true },
      { label: "판매량 순으로 정렬한다",
        fx: { algorithms: -1 },
        fb: "⚠️ 관련 없는 인기 상품이 위로 올라옵니다. '케이스' 를 검색했는데 <b>가장 잘 팔리는 휴대폰</b>이 1위가 되는 식입니다." },
      { label: "글자가 많이 겹치는 순으로",
        fx: { algorithms: 1 },
        fb: "△ 기본 신호로는 쓸 만합니다. 다만 <b>긴 이름이 유리해지는</b> 편향이 있어, 길이로 나눠 주는 보정이 필요합니다." },
      { label: "사용자가 많이 누른 순으로 학습한다",
        fx: { algorithms: 2, database: 1 },
        fb: "△ 실제로 가장 강한 신호이고 결국 쓰게 됩니다. 다만 <b>위에 있어서 눌린 것</b>이 다시 위로 가는 되먹임이 있어, 그것만 쓰면 처음 순위가 영영 굳습니다." }] },

  { t: "점수를 매겨 줄 세운다", type: "build",
    goal: "여러 신호를 <b>가중치로 합쳐</b> 점수를 내고, 모아 둔 사례로 순위가 나아졌는지 확인하세요.",
    hint: "신호는 각각 0~1 로 맞춘 뒤 가중치를 곱해 더합니다. 범위가 다르면 큰 값을 가진 신호가 혼자 결정합니다. 가중치를 바꿀 때마다 <b>사례 전체의 순위가 어떻게 변하는지</b>를 봐야, 하나를 고치다 열을 망가뜨리지 않습니다.",
    acc: "가중치별로 사례들의 첫 정답 순위가 나오고, 어떤 가중치가 전체적으로 나은지 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst docs = [\n  { id: \"p9\", name: \"갤럭시 S24 울트라\", sold: 900 },\n  { id: \"p3\", name: \"갤럭시 S24 케이스\", sold: 4000 },\n  { id: \"p4\", name: \"갤럭시 S24 필름\", sold: 3200 },\n  { id: \"p5\", name: \"갤럭시 버즈\", sold: 5000 },\n  { id: \"p6\", name: \"S24 충전기\", sold: 2100 }\n];\nconst norm = (s) => String(s).toLowerCase().replace(/[\\s\\-_/()]/g, \"\");\ndocs.forEach((d) => { d.key = norm(d.name); });\n\nfunction rank(q, w) {\n  const k = norm(q);\n  const maxSold = Math.max.apply(null, docs.map((d) => d.sold));\n  return docs.map((d) => {\n    const at = d.key.indexOf(k);\n    if (at < 0) return null;\n    const posScore = 1 - at / Math.max(d.key.length, 1);      // 앞쪽 일치일수록 높다\n    const exactScore = d.key === k ? 1 : 0;\n    const lenScore = k.length / d.key.length;                  // 짧은 이름이 유리\n    const popScore = d.sold / maxSold;\n    return { id: d.id, name: d.name,\n      s: w.pos * posScore + w.exact * exactScore + w.len * lenScore + w.pop * popScore };\n  }).filter(Boolean).sort((a, b) => b.s - a.s);\n}\n\nconst want = \"p9\";\nconst weights = [\n  { n: \"인기만\", pos: 0, exact: 0, len: 0, pop: 1 },\n  { n: \"글자 겹침만\", pos: 0, exact: 0, len: 1, pop: 0 },\n  { n: \"섞음\", pos: 0.4, exact: 0.3, len: 0.2, pop: 0.1 }\n];\n\nweights.forEach((w) => {\n  const r = rank(\"갤럭시S24\", w);\n  const at = r.findIndex((x) => x.id === want) + 1;\n  out.push(w.n.padEnd(14) + \"정답(\" + want + \") \" + (at || \"없음\") + \"위\");\n  r.slice(0, 3).forEach((x, i) => out.push(\"    \" + (i + 1) + \". \" + x.name + \"  \" + x.s.toFixed(2)));\n});\n\nout.push(\"\");\nout.push(\"신호를 0~1 로 맞춘 뒤 더해야 한 신호가 혼자 결정하지 않는다\");\nout.push(\"가중치를 바꿀 때마다 사례 전체를 다시 재야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 무엇이 가장 많이 좋아졌나", type: "note",
    goal: "조치별로 <b>정확도가 얼마나 올랐는지</b> 적으세요.\n아직 못 잡는 유형과 그것을 위해 무엇이 필요한지도 적습니다.",
    ph: "조치 전 평균 정밀도/재현율 / 정규화 뒤 / 순위 조정 뒤 / 아직 0건인 질의 / 오타 교정이 필요한 사례 수 / 다음에 할 것 하나" }]
},

/* ─────────────────────────────────────────────── code */
{
  lv: 3, em: "🧭",
  title: "아무도 모르는 코드를 물려받았다",
  desc: "만든 사람이 떠난 코드를 겁내지 않고 파악하는 순서를 익히고, 테스트로 현재 동작을 붙잡은 뒤 안전하게 손댄다",
  skills: ["code", "test", "debugging"],
  phases: [

  { t: "무엇을 모르는지 적는다", type: "note",
    goal: "코드를 읽기 전에 <b>모르는 것의 목록</b>을 만드세요.\n답을 적는 것이 아니라 질문을 적는 단계입니다.",
    ph: "예: 이 서비스가 무엇을 하는가 / 누가 호출하는가 / 하루에 몇 번 도는가 / 실패하면 무슨 일이 나는가 / 테스트가 있는가 / 마지막 커밋이 언제인가 / 왜 이렇게 짰는지 아는 사람이 있는가" },

  { t: "어디부터 읽을 것인가", type: "decide",
    goal: "4만 줄짜리 서비스를 물려받았고 문서는 없습니다.",
    sit: "어디부터 보시겠습니까?",
    opts: [
      { label: "바깥 경계부터 — 어떤 입력이 들어오고 어떤 출력이 나가는지",
        fx: { coding: 3, communication: 2 },
        fb: "✅ <b>안쪽 구조는 바꿀 수 있지만 경계는 못 바꿉니다.</b> API·큐·배치·DB 스키마·설정처럼 바깥과 맞닿은 것을 먼저 파악하면, 안쪽을 몰라도 '무엇을 하는 물건인지' 가 잡힙니다. 그리고 그 경계가 곧 나중에 리팩터링할 때 지켜야 할 계약입니다.",
        best: true },
      { label: "가장 큰 파일부터 읽는다",
        fx: { coding: -1 },
        fb: "⚠️ 큰 파일은 대개 <b>여러 관심사가 뭉친 곳</b>이라 처음 읽기에 가장 나쁩니다. 맥락 없이 읽으면 하루를 쓰고도 무엇을 하는지 모릅니다." },
      { label: "커밋 기록을 처음부터 읽는다",
        fx: { coding: 1 },
        fb: "△ 값진 정보가 있고 특히 <b>왜 이렇게 짰는지</b>를 알려 줍니다. 다만 4만 줄 분량의 기록을 처음부터 읽는 것은 비싸므로, 특정 파일이 이상할 때 그 파일의 기록을 보는 편이 낫습니다." },
      { label: "돌려 보면서 로그를 따라간다",
        fx: { debugging: 2, coding: 1 },
        fb: "△ 아주 좋은 방법이고 경계를 파악한 뒤에 하면 효과가 배가 됩니다. 실제로 도는 경로만 보이므로 <b>안 쓰이는 코드에 시간을 안 씁니다.</b>" }] },

  { t: "경계를 그린다", type: "build",
    goal: "코드에서 <b>바깥과 맞닿은 자리</b>를 찾아 목록으로 만드세요.\n들어오는 것과 나가는 것을 나누고, 각각이 무엇에 의존하는지 적습니다.",
    hint: "경계는 대개 몇 가지 모양으로 나타납니다 — 라우트 정의, 큐 구독, 스케줄 등록, 외부 호출, DB 접근, 환경 변수. 이것들만 뽑아도 서비스의 지도가 그려집니다. <b>들어오는 것</b>은 내가 지켜야 할 약속이고 <b>나가는 것</b>은 내가 기대는 것입니다.",
    acc: "들어오는 경계와 나가는 경계가 분류되어 나오고, 의존하는 외부 시스템 목록이 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst src = [\n  \"app.get('/orders/:id', getOrder)\",\n  \"app.post('/orders', createOrder)\",\n  \"queue.subscribe('order.paid', onPaid)\",\n  \"cron.schedule('0 3 * * *', nightlySettle)\",\n  \"const r = await fetch(process.env.PAY_API + '/charge')\",\n  \"db.query('SELECT * FROM orders WHERE id = ?', [id])\",\n  \"db.query('UPDATE stock SET qty = qty - 1 WHERE id = ?', [id])\",\n  \"await mailer.send(user.email, 'receipt')\",\n  \"const key = process.env.SLACK_WEBHOOK\",\n  \"function calcTotal(items) { return items.reduce(...) }\"\n];\n\nconst RULES = [\n  { dir: \"들어옴\", what: \"HTTP\", re: /app\\.(get|post|put|delete)\\('([^']+)'/ },\n  { dir: \"들어옴\", what: \"큐\", re: /queue\\.subscribe\\('([^']+)'/ },\n  { dir: \"들어옴\", what: \"스케줄\", re: /cron\\.schedule\\('([^']+)'/ },\n  { dir: \"나감\", what: \"외부 API\", re: /fetch\\(process\\.env\\.(\\w+)/ },\n  { dir: \"나감\", what: \"DB 읽기\", re: /db\\.query\\('SELECT[^']*FROM (\\w+)/ },\n  { dir: \"나감\", what: \"DB 쓰기\", re: /db\\.query\\('(?:UPDATE|INSERT INTO|DELETE FROM) (\\w+)/ },\n  { dir: \"나감\", what: \"메일\", re: /mailer\\.send\\(/ },\n  { dir: \"설정\", what: \"환경 변수\", re: /process\\.env\\.(\\w+)/ }\n];\n\nconst found = [];\nsrc.forEach((line) => {\n  RULES.forEach((r) => {\n    const m = line.match(r.re);\n    if (m) found.push({ dir: r.dir, what: r.what, detail: m[2] || m[1] || \"\" });\n  });\n});\n\n[\"들어옴\", \"나감\", \"설정\"].forEach((dir) => {\n  const xs = found.filter((f) => f.dir === dir);\n  out.push(dir + \" (\" + xs.length + \")\");\n  xs.forEach((f) => out.push(\"  \" + f.what.padEnd(10) + f.detail));\n});\n\nout.push(\"\");\nout.push(\"경계에 안 걸린 줄: \" + src.filter((l) => !RULES.some((r) => r.re.test(l))).length +\n  \"개 — 순수한 계산이라 바깥과 무관하다\");\nout.push(\"들어오는 것은 내가 지킬 약속, 나가는 것은 내가 기대는 것\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "지금 동작을 붙잡는다", type: "build",
    goal: "고치기 전에 <b>지금 어떻게 도는지</b>를 테스트로 붙잡으세요.\n옳은지 그른지 판단하지 말고 현재 동작을 그대로 적습니다.",
    hint: "물려받은 코드에는 <b>이상해 보이지만 누군가 의존하는</b> 동작이 있습니다. 고치기 전에 현재 동작을 테스트로 고정해 두면, 리팩터링에서 무엇이 달라졌는지 정확히 알 수 있습니다. 이런 테스트는 '옳은 값' 이 아니라 '현재 값' 을 적는 것이라, 나중에 일부러 바꿀 때 함께 고칩니다.",
    acc: "현재 동작을 기록한 테스트가 만들어지고, 코드를 바꿨을 때 어떤 항목이 달라지는지 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 물려받은 함수 — 이상해 보이는 자리가 있다 */\nfunction discountV1(total, grade) {\n  if (grade === \"vip\") return Math.floor(total * 0.8);\n  if (grade === \"gold\") return Math.floor(total * 0.9);\n  if (total > 100000) return total - 5000;\n  return total;\n}\n\n/* 현재 동작을 그대로 적는다 — 옳은지 그른지는 지금 판단하지 않는다 */\nconst inputs = [\n  [10000, \"vip\"], [10000, \"gold\"], [10000, \"basic\"],\n  [200000, \"basic\"], [200000, \"vip\"], [0, \"basic\"], [-100, \"vip\"]\n];\nconst golden = inputs.map((i) => [i[0], i[1], discountV1(i[0], i[1])]);\n\nout.push(\"현재 동작 기록\");\ngolden.forEach((g) => out.push(\"  \" + String(g[0]).padStart(7) + \" \" + g[1].padEnd(7) + \"→ \" + g[2]));\n\n/* 리팩터링 — VIP 에게도 고액 할인을 함께 주도록 '고쳤다' */\nfunction discountV2(total, grade) {\n  let v = total;\n  if (grade === \"vip\") v = Math.floor(v * 0.8);\n  else if (grade === \"gold\") v = Math.floor(v * 0.9);\n  if (total > 100000) v -= 5000;\n  return v;\n}\n\nconst diffs = golden.filter((g) => discountV2(g[0], g[1]) !== g[2]);\nout.push(\"\");\nout.push(\"바꾼 뒤 달라진 항목 \" + diffs.length + \"건\");\ndiffs.forEach((g) => out.push(\"  \" + g[0] + \" \" + g[1] + \": \" + g[2] + \" → \" + discountV2(g[0], g[1])));\nout.push(\"\");\nout.push(diffs.length\n  ? \"달라진 것이 의도한 변경인지 확인해야 한다 — 모르고 바꾼 것이면 되돌린다\"\n  : \"동작이 그대로다 — 안전한 리팩터링\");\nout.push(\"이 테스트는 '옳은 값' 이 아니라 '현재 값' 을 적은 것이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "어디부터 손댈 것인가", type: "decide",
    goal: "코드를 파악했고 고칠 곳이 많아 보입니다. 동시에 이번 달 안에 새 기능도 넣어야 합니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "새 기능을 넣는 길목에 있는 것만 정리하고, 나머지는 그대로 둔다",
        fx: { coding: 3, leadership: 2 },
        fb: "✅ <b>지나가는 길만 닦습니다.</b> 전면 정리는 몇 달이 걸리고 그동안 아무 값어치도 못 내며, 되돌릴 수도 없습니다. 기능을 넣으면서 그 주변만 정리하면 값어치를 계속 내면서 코드가 조금씩 나아지고, 자주 건드리는 곳부터 좋아진다는 이점도 있습니다.",
        best: true },
      { label: "전면 재작성한다",
        fx: { coding: -3, leadership: -2 },
        fb: "⚠️ 물려받은 코드에서 가장 흔하고 가장 비싼 실수입니다. 4만 줄에는 <b>몇 년치의 예외 처리</b>가 들어 있고, 그것들은 문서에 없어서 다시 짜면 하나씩 사고로 다시 배우게 됩니다." },
      { label: "테스트를 먼저 전부 붙인 뒤에 손댄다",
        fx: { coding: 1 },
        fb: "△ 안전하지만 4만 줄 전부는 너무 오래 걸립니다. <b>손댈 곳 주변만</b> 붙이는 것이 현실적이고, 실제로 그것으로 충분합니다." },
      { label: "이상해 보이는 코드부터 고친다",
        fx: { coding: -2, debugging: -1 },
        fb: "⚠️ 이상해 보이는 것 중 상당수는 <b>이유가 있는 것</b>입니다. 왜 그런지 모른 채 고치면 그 이유가 사고로 돌아옵니다. 건드릴 이유가 생겼을 때 그때 이유를 찾아 고칩니다." }] },

  { t: "회고 — 무엇을 남겼나", type: "note",
    goal: "다음 사람을 위해 <b>지금 알아낸 것</b>을 남기세요.\n코드를 읽으면 알 수 있는 것 말고, 읽어도 모르는 것을 적습니다.",
    ph: "이 서비스가 하는 일 세 줄 / 경계 목록 / 이상해 보이지만 건드리면 안 되는 곳과 이유 / 아직 모르는 것 / 물어볼 사람 / 테스트로 붙잡아 둔 범위" }]
},

/* ─────────────────────────────────────────────── web */
{
  lv: 3, em: "♿",
  title: "키보드만으로 쓸 수 없다",
  desc: "마우스 없이는 못 쓰는 화면을 실제로 짚어 내고, 초점 순서·이름·상태 세 가지를 고쳐 보조 기술에서도 통하게 만든다",
  skills: ["web", "javascript", "code"],
  phases: [

  { t: "막히는 자리를 적는다", type: "note",
    goal: "마우스를 치우고 <b>키보드만으로</b> 주요 흐름을 끝까지 해 보세요.\n막힌 자리와 그때 무슨 일이 났는지 적습니다.",
    ph: "예: 탭으로 모달을 열 수 있는데 닫을 수 없음 · 모달 뒤 배경 목록으로 초점이 빠져나감 · 드롭다운이 탭으로 안 열림 · 삭제 버튼이 아이콘만 있어 무엇인지 모름 · 오류 메시지가 읽히지 않음" },

  { t: "무엇부터 고칠 것인가", type: "decide",
    goal: "접근성 검사 도구가 경고 140개를 냈습니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "실제로 막히는 흐름부터 — 키보드로 끝까지 못 하는 자리",
        fx: { coding: 3, communication: 2 },
        fb: "✅ <b>경고 수와 실제 막힘은 다릅니다.</b> 대비가 4.4:1 인 경고 100개보다 '결제 버튼에 키보드로 닿을 수 없다' 하나가 훨씬 중요합니다. 자동 검사는 놓치는 것도 많아서, 직접 써 보는 것이 언제나 첫 단계입니다.",
        best: true },
      { label: "경고가 많은 규칙부터 순서대로",
        fx: { coding: -1 },
        fb: "⚠️ 같은 규칙이 반복되는 것은 대개 한 컴포넌트가 여러 번 쓰여서입니다. 숫자는 크지만 <b>고치는 것은 한 자리</b>이고, 그것이 가장 중요한 문제라는 뜻은 아닙니다." },
      { label: "ARIA 속성을 빠짐없이 붙인다",
        fx: { coding: -2 },
        fb: "⚠️ ARIA 는 <b>잘못 쓰면 없느니만 못합니다.</b> 기본 HTML 요소가 이미 갖고 있는 것을 덮어써서 오히려 망가뜨리는 경우가 흔합니다. 첫 번째 규칙은 'ARIA 를 안 쓰는 것' 입니다." },
      { label: "화면 낭독기로 전부 들어 본다",
        fx: { coding: 2 },
        fb: "△ 아주 값진 일이고 반드시 해야 합니다. 다만 익숙하지 않으면 시간이 오래 걸리므로, <b>키보드로 먼저</b> 훑어 큰 것을 걷어 낸 뒤에 하면 효율적입니다." }] },

  { t: "초점 순서를 확인한다", type: "build",
    goal: "탭 키가 도는 <b>순서</b>를 계산하고, 화면에 보이는 순서와 어긋나는 자리를 찾으세요.",
    hint: "탭 순서는 기본적으로 문서에 적힌 순서입니다. `tabindex` 에 양수를 주면 그것들이 <b>먼저</b> 오는데, 이 때문에 순서가 뒤죽박죽되는 경우가 흔합니다. 그래서 양수 tabindex 는 거의 언제나 잘못된 신호입니다. 초점을 받을 수 없는 요소에 클릭 처리를 붙인 자리도 함께 찾습니다.",
    acc: "탭 순서가 계산되고, 시각적 순서와 어긋나는 자리와 초점을 못 받는 조작 요소가 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 문서 순서대로 늘어놓은 요소들 */\nconst els = [\n  { n: \"로고 링크\", tag: \"a\", tabindex: null, clickable: true },\n  { n: \"검색 입력\", tag: \"input\", tabindex: null, clickable: true },\n  { n: \"검색 버튼\", tag: \"button\", tabindex: 5, clickable: true },\n  { n: \"장바구니 아이콘\", tag: \"div\", tabindex: null, clickable: true },\n  { n: \"상품1 링크\", tag: \"a\", tabindex: null, clickable: true },\n  { n: \"담기 버튼\", tag: \"button\", tabindex: 1, clickable: true },\n  { n: \"안내 문구\", tag: \"p\", tabindex: null, clickable: false },\n  { n: \"결제 버튼\", tag: \"button\", tabindex: null, clickable: true }\n];\n\nconst NATURAL = { a: true, button: true, input: true, select: true, textarea: true };\nconst focusable = els.filter((e) => e.tabindex !== null || NATURAL[e.tag]);\n\n/* 양수 tabindex 가 먼저, 그 안에서 값 순 · 그 다음이 문서 순서 */\nconst order = focusable.slice().sort((a, b) => {\n  const pa = a.tabindex > 0 ? a.tabindex : Infinity;\n  const pb = b.tabindex > 0 ? b.tabindex : Infinity;\n  return (pa - pb) || (els.indexOf(a) - els.indexOf(b));\n});\n\nout.push(\"탭 순서\");\norder.forEach((e, i) => out.push(\"  \" + (i + 1) + \". \" + e.n +\n  (e.tabindex > 0 ? \"  (tabindex=\" + e.tabindex + \")\" : \"\")));\n\nconst visual = focusable.slice();\nconst mismatch = order.filter((e, i) => e !== visual[i]);\nout.push(\"\");\nout.push(\"보이는 순서와 어긋난 자리: \" + (mismatch.length ? mismatch.map((e) => e.n).join(\", \") : \"없음\"));\nout.push(\"원인: 양수 tabindex — 거의 언제나 잘못된 신호다\");\n\nconst unreachable = els.filter((e) => e.clickable && e.tabindex === null && !NATURAL[e.tag]);\nout.push(\"\");\nout.push(\"누를 수 있는데 탭으로 못 닿는 것: \" +\n  (unreachable.length ? unreachable.map((e) => e.n + \"(\" + e.tag + \")\").join(\", \") : \"없음\"));\nout.push(\"→ button 으로 바꾸면 초점·엔터·스페이스가 전부 따라온다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "모달에 초점을 가둔다", type: "build",
    goal: "모달이 열렸을 때 탭이 <b>모달 안에서만</b> 돌게 만드세요.\n닫으면 원래 있던 자리로 초점이 돌아가야 합니다.",
    hint: "세 가지가 필요합니다 — 열 때 <b>모달 안 첫 요소로</b> 초점을 옮기고, 마지막에서 탭을 누르면 첫 요소로 감싸고, 닫을 때 <b>열기 전 요소로</b> 되돌립니다. 되돌리는 것을 빠뜨리면 초점이 문서 맨 앞으로 튀어 사용자가 길을 잃습니다. Esc 로 닫히는 것도 함께 있어야 합니다.",
    acc: "모달 안에서 탭이 순환하고, 뒤 요소로 새지 않으며, 닫은 뒤 원래 자리로 돌아오는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst page = [\"메뉴\", \"열기버튼\", \"목록1\", \"목록2\"];\nconst modal = [\"제목입력\", \"저장\", \"취소\"];\n\nfunction trap(openerIdx) {\n  let where = \"page\", idx = openerIdx, saved = openerIdx;\n  const log = [];\n  return {\n    open() { where = \"modal\"; idx = 0; log.push(\"열림 → \" + modal[0]); return this; },\n    tab(n) {\n      for (let i = 0; i < n; i++) {\n        const list = where === \"modal\" ? modal : page;\n        idx = (idx + 1) % list.length;      // 마지막에서 첫 번째로 감싼다\n        log.push(\"탭 → \" + list[idx]);\n      }\n      return this;\n    },\n    esc() { where = \"page\"; idx = saved; log.push(\"Esc → \" + page[saved] + \" (열기 전 자리)\"); return this; },\n    log() { return log; },\n    at() { return (where === \"modal\" ? modal : page)[idx]; }\n  };\n}\n\nconst t = trap(1);\nt.open().tab(4).esc();\nt.log().forEach((l) => out.push(\"  \" + l));\n\nout.push(\"\");\nout.push(\"모달 밖으로 샜는가: \" +\n  (t.log().some((l) => page.some((p) => l.indexOf(\"탭 → \" + p) === 0)) ? \"샘\" : \"안 샘\"));\nout.push(\"닫은 뒤 자리: \" + t.at() + \" (기대: 열기버튼)\");\nout.push(\"돌아왔는가: \" + (t.at() === \"열기버튼\"));\nout.push(\"\");\nout.push(\"되돌리는 것을 빠뜨리면 초점이 문서 맨 앞으로 튀어 길을 잃는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "이름과 상태를 붙인다", type: "build",
    goal: "아이콘만 있는 조작 요소에 <b>읽을 이름</b>을 주고, 눌린·펼친 같은 상태가 전해지는지 확인하세요.",
    hint: "이름은 여러 경로로 정해지고 <b>우선순위</b>가 있습니다 — 명시적으로 준 이름이 가장 세고, 그 다음이 연결된 라벨, 마지막이 요소 안의 글자입니다. 아이콘만 있으면 글자가 없어 이름이 비고, 낭독기는 '버튼' 이라고만 읽습니다. 상태는 시각적으로만 표시하면 전해지지 않으므로 속성으로도 알려야 합니다.",
    acc: "요소별로 계산된 이름과 상태가 나오고, 이름이 비었거나 상태가 안 전해지는 자리가 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst els = [\n  { n: \"삭제 아이콘 버튼\", text: \"\", ariaLabel: null, labelledBy: null, title: null, state: { pressed: null } },\n  { n: \"저장 버튼\", text: \"저장\", ariaLabel: null, labelledBy: null, title: null, state: {} },\n  { n: \"검색 입력\", text: \"\", ariaLabel: null, labelledBy: \"검색어\", title: null, state: {} },\n  { n: \"즐겨찾기 토글\", text: \"\", ariaLabel: \"즐겨찾기\", labelledBy: null, title: null, state: { pressed: true } },\n  { n: \"메뉴 펼치기\", text: \"메뉴\", ariaLabel: null, labelledBy: null, title: null, state: { expanded: null } },\n  { n: \"닫기\", text: \"\", ariaLabel: null, labelledBy: null, title: \"닫기\", state: {} }\n];\n\n/* 이름을 정하는 순서 — 위가 셀수록 우선한다 */\nfunction nameOf(e) {\n  if (e.ariaLabel) return [e.ariaLabel, \"aria-label\"];\n  if (e.labelledBy) return [e.labelledBy, \"연결된 라벨\"];\n  if (e.text) return [e.text, \"안의 글자\"];\n  if (e.title) return [e.title, \"title (약함 — 터치에서 안 보임)\"];\n  return [\"\", \"없음\"];\n}\n\nout.push(\"요소                이름          출처\");\nconst noName = [], noState = [];\nels.forEach((e) => {\n  const [nm, src] = nameOf(e);\n  if (!nm) noName.push(e.n);\n  Object.keys(e.state).forEach((k) => { if (e.state[k] === null) noState.push(e.n + \"(\" + k + \")\"); });\n  out.push(e.n.padEnd(20) + (nm || \"(비어 있음)\").padEnd(14) + src);\n});\n\nout.push(\"\");\nout.push(\"이름이 없는 것: \" + (noName.length ? noName.join(\", \") : \"없음\"));\nout.push(\"  → 낭독기는 '버튼' 이라고만 읽는다. 무슨 버튼인지 알 수 없다\");\nout.push(\"상태가 안 전해지는 것: \" + (noState.length ? noState.join(\", \") : \"없음\"));\nout.push(\"  → 색으로만 표시하면 전해지지 않는다. 속성으로도 알려야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 직접 써 보니", type: "note",
    goal: "마우스 없이 <b>주요 흐름 하나를 끝까지</b> 해 보고 걸린 시간과 막힌 횟수를 적으세요.\n자동 검사가 못 잡은 문제도 함께 적습니다.",
    ph: "흐름(예: 검색→담기→결제) / 마우스로 걸린 시간 vs 키보드로 / 막힌 횟수 / 자동 검사가 못 잡은 문제 / 고친 뒤 다시 재 본 시간 / 남은 것" }]
},

/* ─────────────────────────────────────────────── os */
{
  lv: 4, em: "🧮",
  title: "서버가 조용히 죽었다",
  desc: "로그 한 줄 없이 프로세스가 사라지는 상황을 메모리·파일 서술자·시그널 세 방향에서 좁히고, 다음에는 흔적이 남게 만든다",
  skills: ["os", "linux", "debugging"],
  phases: [

  { t: "죽기 직전을 적는다", type: "note",
    goal: "죽은 뒤가 아니라 <b>죽기 직전</b>의 상태를 적으세요.\n마지막 로그, 지표의 모양, 재시작 여부를 함께 적습니다.",
    ph: "예: 03:12 이후 로그 없음 · 마지막 로그는 평범한 요청 · 메모리가 2시간에 걸쳐 1.2G→3.9G 로 우상향 · 컨테이너 종료 코드 137 · 재시작 뒤 같은 곡선 반복 · CPU 는 30% 로 평온" },

  { t: "종료 코드가 말하는 것", type: "decide",
    goal: "컨테이너 종료 코드가 137 입니다.",
    sit: "무엇을 뜻합니까?",
    opts: [
      { label: "128+9 — KILL 시그널로 죽었다. 메모리 한도 초과로 커널이 죽였을 가능성이 크다",
        fx: { debugging: 3, system_design: 2 },
        fb: "✅ <b>종료 코드는 128+시그널 번호</b>로 나타납니다. 137 은 9번(KILL)이고, 이 시그널은 프로세스가 잡을 수 없어 정리할 기회도 로그를 남길 기회도 없습니다. '로그 한 줄 없이 사라졌다' 는 증상이 정확히 이것과 맞아떨어집니다. 메모리가 우상향한 것도 같은 방향을 가리킵니다.",
        best: true },
      { label: "애플리케이션이 137 로 종료했다",
        fx: { debugging: -2 },
        fb: "⚠️ 애플리케이션 종료 코드는 보통 0~127 을 씁니다. <b>128 을 넘는 값은 시그널로 죽었다는 표시</b>라, 코드 안에서 찾을 것이 아닙니다." },
      { label: "디스크가 가득 차서",
        fx: { debugging: -1 },
        fb: "⚠️ 그렇다면 쓰기 실패 로그가 남고 종료 코드도 다릅니다. 137 은 <b>바깥에서 죽인 것</b>을 뜻합니다." },
      { label: "네트워크가 끊겨서",
        fx: { debugging: -1 },
        fb: "⚠️ 네트워크가 끊기면 오류 로그가 쌓이지 프로세스가 사라지지 않습니다. <b>로그가 없다</b>는 것이 가장 큰 단서입니다." }] },

  { t: "메모리 곡선을 읽는다", type: "build",
    goal: "메모리 사용량 계열에서 <b>새는 모양</b>과 <b>단순히 많이 쓰는 모양</b>을 구분하세요.\n한도에 언제 닿을지도 계산합니다.",
    hint: "새는 것은 <b>부하와 무관하게 계속 우상향</b>하고 되돌아오지 않습니다. 많이 쓰는 것은 부하를 따라 오르내립니다. 둘을 가르는 방법은 부하가 줄었을 때 메모리도 줄었는지 보는 것입니다. 기울기를 구하면 한도에 닿는 시각을 미리 알 수 있어, 죽기 전에 대응할 수 있습니다.",
    acc: "두 계열의 판정이 나오고, 새는 쪽에서 한도까지 남은 시간이 계산되어 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst LIMIT = 4096;   // MB\n\n/* 부하는 두 주기를 돌게 만든다 — 앞뒤 절반의 평균이 같아야 견줄 수 있다 */\nfunction series(kind, n) {\n  const xs = [];\n  for (let i = 0; i < n; i++) {\n    const load = Math.round(50 + 40 * Math.sin(i * Math.PI / 6));\n    xs.push({ min: i * 5, load: load,\n      mem: kind === \"leak\" ? Math.round(1200 + i * 22) : Math.round(1200 + load * 8) });\n  }\n  return xs;\n}\n\nfunction judge(xs) {\n  const n = xs.length, half = Math.floor(n / 2);\n  const avg = (a, k) => a.reduce((s, x) => s + x[k], 0) / a.length;\n  const A = xs.slice(0, half), B = xs.slice(half);\n  const dMem = avg(B, \"mem\") - avg(A, \"mem\");\n  const dLoad = avg(B, \"load\") - avg(A, \"load\");\n  /* 부하는 그대로인데 메모리만 올랐으면 새는 것이다 */\n  const leak = dMem > 200 && Math.abs(dLoad) < 15;\n  const hours = (xs[n - 1].min - xs[0].min) / 60;\n  const slope = Math.round((xs[n - 1].mem - xs[0].mem) / hours);\n  const left = slope > 0 ? (LIMIT - xs[n - 1].mem) / slope : Infinity;\n  return { leak: leak, dMem: Math.round(dMem), dLoad: Math.round(dLoad), slope: slope, left: left };\n}\n\nout.push(\"계열          메모리 변화  부하 변화  판정\");\n[[\"새는 쪽\", series(\"leak\", 24)], [\"많이 쓰는 쪽\", series(\"busy\", 24)]].forEach((c) => {\n  const j = judge(c[1]);\n  out.push(c[0].padEnd(14) +\n    (j.dMem > 0 ? \"+\" + j.dMem : String(j.dMem)).padEnd(13) +\n    (j.dLoad > 0 ? \"+\" + j.dLoad : String(j.dLoad)).padEnd(11) +\n    (j.leak ? \"누수\" : \"부하를 따라감\"));\n  if (j.leak) out.push(\"    기울기 \" + j.slope + \"MB/시간 · 한도 \" + LIMIT +\n    \"MB 까지 약 \" + j.left.toFixed(1) + \"시간 남음\");\n});\n\nout.push(\"\");\nout.push(\"부하가 제자리인데 메모리만 올랐는지가 둘을 가른다\");\nout.push(\"기울기를 알면 죽기 전에 대응할 수 있다 — 이것이 경보의 근거다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "다른 자원도 새는지 본다", type: "build",
    goal: "메모리 말고 <b>파일 서술자·스레드·연결</b>도 함께 세어 어느 것이 새는지 좁히세요.",
    hint: "'메모리가 샌다' 는 결론을 서두르면 엉뚱한 곳을 고칩니다. 열어 놓고 안 닫는 <b>파일·소켓</b>도 같은 모양으로 늘고, 그 각각이 메모리를 함께 붙잡습니다. 여러 자원을 같은 시각으로 나란히 보면 <b>무엇이 먼저 늘기 시작했는지</b>가 보이고, 그것이 원인에 가장 가깝습니다.",
    acc: "자원별 증가 여부와 처음 늘기 시작한 시각이 나오고, 가장 먼저 늘어난 자원이 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst t = [];\nfor (let i = 0; i < 20; i++) t.push(i * 5);\n\n/* 소켓이 먼저 새고, 그 뒤에 메모리가 따라 오른다 */\nconst res = {\n  \"메모리(MB)\": t.map((x, i) => 1200 + (i >= 6 ? (i - 6) * 90 : 0)),\n  \"파일 서술자\": t.map((x, i) => 120 + (i % 3)),\n  \"열린 소켓\": t.map((x, i) => 40 + (i >= 3 ? (i - 3) * 26 : 0)),\n  \"스레드\": t.map(() => 32)\n};\n\nfunction firstRise(xs) {\n  const base = xs.slice(0, 3).reduce((s, x) => s + x, 0) / 3;\n  for (let i = 3; i < xs.length; i++) if (xs[i] > base * 1.3) return i;\n  return -1;\n}\n\nout.push(\"자원          시작    끝      증가     처음 늘어난 시각\");\nconst rises = [];\nObject.keys(res).forEach((k) => {\n  const xs = res[k], at = firstRise(xs);\n  if (at >= 0) rises.push({ k: k, at: t[at] });\n  out.push(k.padEnd(14) + String(xs[0]).padEnd(8) + String(xs[xs.length - 1]).padEnd(8) +\n    (xs[xs.length - 1] - xs[0] > 0 ? \"+\" + (xs[xs.length - 1] - xs[0]) : \"—\").padEnd(9) +\n    (at >= 0 ? t[at] + \"분\" : \"안 늘어남\"));\n});\n\nrises.sort((a, b) => a.at - b.at);\nout.push(\"\");\nout.push(\"가장 먼저 늘어난 자원: \" + rises[0].k + \" (\" + rises[0].at + \"분)\");\nout.push(\"→ 메모리는 \" + rises[rises.length - 1].at + \"분부터 — 따라 오른 것이지 원인이 아니다\");\nout.push(\"열어 놓고 안 닫는 소켓이 메모리도 함께 붙잡는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "다음엔 흔적이 남게", type: "decide",
    goal: "원인은 찾았지만, 다음에 또 이런 일이 나면 여전히 로그 없이 사라집니다.",
    sit: "무엇을 준비하시겠습니까?",
    opts: [
      { label: "한도에 닿기 전에 경보가 울리게 하고, 죽은 뒤에도 남는 곳에 상태를 주기적으로 적는다",
        fx: { system_design: 3, debugging: 2 },
        fb: "✅ <b>KILL 은 잡을 수 없으므로 죽는 순간에 무언가 하려는 계획은 실패합니다.</b> 대신 두 가지를 합니다 — 한도의 80% 쯤에서 미리 울려 사람이 개입할 시간을 벌고, 자원 사용량을 밖(로그 수집기·지표 저장소)에 계속 적어 두어 죽은 뒤에도 곡선을 볼 수 있게 합니다.",
        best: true },
      { label: "종료 시그널 처리기를 붙여 죽을 때 상태를 남긴다",
        fx: { debugging: -1 },
        fb: "⚠️ <b>KILL 은 잡을 수 없습니다.</b> TERM 에는 유용하지만 지금 상황(137)에는 아무 소용이 없습니다. 시그널을 잡을 수 있는지 없는지가 이 판단의 전부입니다." },
      { label: "메모리 한도를 넉넉히 올린다",
        fx: { system_design: -1 },
        fb: "⚠️ 죽는 시각이 늦춰질 뿐입니다. 새는 것이 멈추지 않는 한 <b>더 오래 살다 더 크게 죽습니다.</b> 다만 원인을 고칠 때까지의 임시 조치로는 쓸 수 있습니다." },
      { label: "주기적으로 재시작하게 한다",
        fx: { system_design: -1, debugging: -1 },
        fb: "⚠️ 실제로 쓰이는 임시 조치지만 원인은 그대로입니다. <b>임시 조치라고 적어 두지 않으면</b> 영구 조치가 되어 몇 년 뒤에도 아무도 이유를 모른 채 재시작하고 있습니다." }] },

  { t: "회고 — 무엇이 단서였나", type: "note",
    goal: "원인을 좁히는 데 <b>결정적이었던 단서</b>와, 없어서 오래 걸린 정보를 적으세요.\n지금은 그것이 남는지도 적습니다.",
    ph: "결정적 단서(예: 종료 코드 137) / 없어서 오래 걸린 정보 / 지금은 어디에 남는가 / 경보 기준과 그때까지 남는 시간 / 임시 조치와 그 만료일 / 근본 원인 수정 여부" }]
}

]};
