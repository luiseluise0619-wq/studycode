/* 두 번째 프로젝트 묶음 — 트랙마다 이미 하나씩 있으므로 여기서는 '깊이' 를 더한다.
   첫 프로젝트가 '이 트랙으로 무엇을 만드는가' 라면, 이 다섯은
   '만든 것이 운영에서 어떻게 무너지는가' 를 쫓는다.
   배너는 먼저 붙은 것이 그대로 잡으므로 extra:true 로 밝혀 둔다. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── python */
{
  lv: 3, em: "🐍",
  title: "30분 걸리던 배치를 30초로",
  desc: "느린 파이썬 배치의 병목을 추측이 아니라 측정으로 찾고, 자료구조·일괄 처리·제너레이터로 줄여 메모리까지 함께 잡는다",
  skills: ["python", "performance", "code"],
  phases: [

  { t: "느린 것을 숫자로 적는다", type: "note",
    goal: "'느리다' 는 조사할 수 없습니다. <b>무엇이 · 얼마나 · 어느 규모에서</b> 느린지를 적으세요.\n지금 걸리는 시간, 견딜 만한 시간, 데이터 크기, 언제부터 느려졌는지를 함께 적습니다.",
    ph: "예: 일일 정산 배치가 32분 (작년 4분) · 주문 180만 건 · 메모리 3.2GB 까지 오름 · 목표는 5분 이내 · 건수는 6배인데 시간은 8배가 됐다" },

  { t: "어디부터 볼 것인가", type: "decide",
    goal: "배치가 32분 걸립니다. 코드는 2,000줄이고 어디가 느린지 아무도 모릅니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "프로파일러로 함수별 누적 시간을 재고 가장 큰 것부터 본다",
        fx: { performance: 3, debugging: 2 },
        fb: "✅ <b>측정이 먼저입니다.</b> 사람의 직감은 병목을 거의 맞히지 못하고, 대개 '읽기 어려운 코드' 를 범인으로 지목합니다. 함수별 누적 시간을 보면 전체의 80% 가 한두 곳에 몰려 있는 경우가 많고, 그 밖을 고치는 것은 시간 낭비입니다.",
        best: true },
      { label: "가장 커 보이는 반복문을 먼저 손본다",
        fx: { performance: -2 },
        fb: "⚠️ 커 보이는 것과 오래 걸리는 것은 다릅니다. 100줄짜리 반복문이 1,000번 도는 것보다 <b>3줄짜리가 백만 번</b> 도는 쪽이 훨씬 비쌉니다. 눈으로 고른 후보는 대개 빗나갑니다." },
      { label: "멀티프로세싱으로 코어 수만큼 나눠 돌린다",
        fx: { performance: -1, coding: -1 },
        fb: "⚠️ 병목을 모르는 채로 병렬화하면 <b>느린 것을 여러 벌 돌리게</b> 됩니다. 병목이 디스크나 DB 라면 오히려 더 느려지고, 프로세스 사이에 데이터를 옮기는 비용까지 새로 생깁니다." },
      { label: "더 빠른 기계로 옮긴다",
        fx: { performance: -2 },
        fb: "⚠️ 가장 비싸고 가장 적게 얻는 길입니다. 건수가 6배인데 시간이 8배가 됐다는 것은 <b>알고리즘이 선형이 아니라는 뜻</b>이라, 기계를 두 배로 키워도 다음 달이면 다시 같은 자리입니다." }] },

  { t: "무엇이 오래 걸리는지 잰다", type: "build",
    goal: "같은 일을 하는 두 구현의 시간을 <b>직접 재서</b> 비교하세요.\n목록에서 값을 찾는 일을 배열로 할 때와 집합·사전으로 할 때가 규모에 따라 어떻게 갈리는지 봅니다.",
    hint: "규모를 하나만 재면 아무것도 알 수 없습니다. 최소 세 가지 크기에서 재고 <b>시간이 어떻게 늘어나는지</b>를 보세요. 두 배 키웠을 때 두 배가 되면 선형, 네 배가 되면 제곱입니다. 배열의 `includes` 는 앞에서부터 훑고, `Set` 의 `has` 는 한 번에 찾습니다.",
    acc: "세 가지 규모에서 두 방식의 시간이 출력되고, 규모가 커질수록 차이가 벌어지는 것이 숫자로 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction build(n) {\n  const arr = [];\n  for (let i = 0; i < n; i++) arr.push(\"id-\" + i);\n  return arr;\n}\n\n/* 목록 안에 있는지 5,000번 물어본다 — 배치가 하는 일과 같은 모양이다 */\nfunction ask(lookup) {\n  let hit = 0;\n  for (let i = 0; i < 5000; i++) if (lookup(\"id-\" + (i * 7 % 40000))) hit++;\n  return hit;\n}\n\nfunction ms(fn) {\n  const t0 = Date.now();\n  const r = fn();\n  return [Date.now() - t0, r];\n}\n\nout.push(\"규모      배열(ms)  집합(ms)  배수\");\n[5000, 20000, 40000].forEach((n) => {\n  const arr = build(n);\n  const set = new Set(arr);\n  const a = ms(() => ask((k) => arr.indexOf(k) >= 0));\n  const s = ms(() => ask((k) => set.has(k)));\n  const ratio = s[0] ? (a[0] / s[0]).toFixed(1) : \"—\";\n  out.push(String(n).padEnd(9) + String(a[0]).padEnd(10) + String(s[0]).padEnd(10) + ratio);\n});\n\nout.push(\"\");\nout.push(\"배열은 규모에 비례해 늘고 집합은 거의 그대로다\");\nout.push(\"규모를 하나만 재면 이 차이가 안 보인다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "한 건씩 묻지 않는다", type: "build",
    goal: "배치가 느린 두 번째 이유는 대개 <b>한 건마다 바깥에 묻는 것</b>입니다.\n건마다 조회하는 방식과 한 번에 모아 조회하는 방식의 호출 수를 세어 비교하세요.",
    hint: "네트워크나 DB 호출은 한 번에 드는 고정 비용이 큽니다. 1,000건을 1,000번 묻는 것과 100건씩 10번 묻는 것은 옮기는 데이터는 같아도 <b>왕복 횟수가 100배</b> 다릅니다. 묶음 크기는 클수록 좋기만 한 것이 아니라, 너무 크면 한 번의 실패로 잃는 것이 커집니다.",
    acc: "건별 조회와 묶음 조회의 호출 횟수·추정 시간이 함께 출력되고, 묶음 크기를 바꿨을 때의 변화가 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst ROWS = 1200;\nconst TRIP_MS = 4;        // 왕복 한 번에 드는 고정 비용\nconst PER_ROW_MS = 0.02;  // 한 건을 실어 나르는 비용\n\nfunction cost(rows, batch) {\n  const trips = Math.ceil(rows / batch);\n  return { trips: trips, ms: +(trips * TRIP_MS + rows * PER_ROW_MS).toFixed(1) };\n}\n\nconst one = cost(ROWS, 1);\nout.push(\"건별 조회   왕복 \" + one.trips + \"회  \" + one.ms + \"ms\");\nout.push(\"\");\nout.push(\"묶음   왕복   시간(ms)  건별 대비\");\n[10, 50, 200, 600, 1200].forEach((b) => {\n  const c = cost(ROWS, b);\n  out.push(String(b).padEnd(7) + String(c.trips).padEnd(7) +\n    String(c.ms).padEnd(10) + (one.ms / c.ms).toFixed(1) + \"배 빠름\");\n});\n\nout.push(\"\");\nout.push(\"묶음을 키울수록 빨라지지만 이득은 금세 줄어든다\");\nout.push(\"한 번 실패했을 때 다시 해야 할 양도 함께 커진다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "메모리는 어떻게 할 것인가", type: "decide",
    goal: "속도는 잡았지만 메모리가 3.2GB 까지 오릅니다. 배치가 파일 전체를 리스트로 읽어 들이고 있습니다.",
    sit: "어떻게 바꾸시겠습니까?",
    opts: [
      { label: "한 줄씩 흘려보내며 처리하고, 필요한 집계만 들고 간다",
        fx: { performance: 3, coding: 2 },
        fb: "✅ <b>전체를 담지 않는 것</b>이 답입니다. 제너레이터로 한 줄씩 읽어 처리하면 메모리는 데이터 크기와 무관해집니다. 합계·개수처럼 누적만 필요한 일은 대부분 이 방식으로 됩니다. 데이터가 열 배가 되어도 메모리는 그대로라는 것이 진짜 이득입니다.",
        best: true },
      { label: "기계 메모리를 8GB 로 늘린다",
        fx: { performance: -2 },
        fb: "⚠️ 다음 달 데이터가 두 배가 되면 또 늘려야 합니다. 데이터 크기에 메모리가 <b>비례해 따라가는 구조</b>를 그대로 두는 한 끝이 없습니다." },
      { label: "파일을 잘라 여러 번 나눠 돌린다",
        fx: { performance: 1, coding: -1 },
        fb: "△ 당장은 됩니다. 다만 자르고 합치는 코드가 새로 생기고, 어디까지 처리했는지를 따로 관리해야 합니다. 한 줄씩 흘려보내면 그 관리 자체가 필요 없어집니다." },
      { label: "필요 없는 컬럼을 지우고 자료형을 줄인다",
        fx: { performance: 1 },
        fb: "△ 효과는 있고 값도 쌉니다. 다만 <b>줄이는 것에는 바닥이 있어서</b> 데이터가 계속 늘면 결국 같은 벽에 부딪힙니다. 흘려보내는 구조로 바꾼 뒤의 추가 최적화로 두는 것이 맞습니다." }] },

  { t: "흘려보내며 처리한다", type: "build",
    goal: "전체를 담지 않고 <b>한 건씩 흘려보내며</b> 집계하는 방식을 만드세요.\n전부 배열에 담는 방식과 나란히 두고, 동시에 들고 있는 항목 수를 비교합니다.",
    hint: "제너레이터는 값을 만들어 두는 것이 아니라 요청할 때마다 하나씩 내줍니다. 그래서 아무리 많아도 메모리에는 <b>한 번에 하나</b>만 있습니다. 합계·개수·최댓값처럼 누적만 필요한 집계는 전부 이 방식으로 됩니다. 정렬이나 중앙값처럼 전체가 필요한 것은 안 됩니다.",
    acc: "두 방식의 결과가 같고, 동시에 들고 있는 항목 수가 한쪽은 데이터 크기만큼 다른 쪽은 1인 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst N = 200000;\n\n/* 원본을 흉내 낸다 — 실제로는 파일이나 DB 커서다 */\nfunction* rows(n) {\n  for (let i = 1; i <= n; i++) yield { id: i, amount: (i % 97) * 13 };\n}\n\n/* 방식 1 — 전부 담고 나서 더한다 */\nfunction sumAll(n) {\n  const all = [];\n  for (const r of rows(n)) all.push(r);\n  let s = 0;\n  all.forEach((r) => { s += r.amount; });\n  return { sum: s, held: all.length };\n}\n\n/* 방식 2 — 하나씩 흘려보내며 더한다 */\nfunction sumStream(n) {\n  let s = 0, held = 0;\n  for (const r of rows(n)) { held = 1; s += r.amount; }\n  return { sum: s, held: held };\n}\n\nconst a = sumAll(N), b = sumStream(N);\nout.push(\"담아서 더하기   합계 \" + a.sum + \"  동시에 든 항목 \" + a.held);\nout.push(\"흘려보내 더하기 합계 \" + b.sum + \"  동시에 든 항목 \" + b.held);\nout.push(\"결과가 같은가: \" + (a.sum === b.sum));\nout.push(\"\");\nout.push(\"데이터가 열 배가 되어도 아래쪽은 1 그대로다\");\nout.push(\"다만 정렬·중앙값처럼 전체가 필요한 일에는 쓸 수 없다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "고친 뒤에도 빠른지 지킨다", type: "build",
    goal: "한 번 빠르게 만든 것은 <b>다음 사람이 다시 느리게 만듭니다.</b>\n기준 시간을 넘으면 실패하는 성능 검사를 만드세요.",
    hint: "절대 시간으로 기준을 잡으면 기계가 바뀔 때마다 깨집니다. <b>예전 대비 배수</b>로 잡고 허용 범위를 두는 편이 안정적입니다. 측정은 늘 흔들리므로 여러 번 재서 중앙값을 쓰고, 경계에서는 통과시켜 문서와 동작이 어긋나지 않게 합니다.",
    acc: "여러 번 측정해 중앙값을 구하고, 기준 배수를 넘으면 실패로 판정하는 결과가 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction median(xs) {\n  const s = xs.slice().sort((a, b) => a - b);\n  const m = s.length >> 1;\n  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;\n}\n\nfunction timeIt(fn, times) {\n  const got = [];\n  for (let i = 0; i < times; i++) {\n    const t0 = Date.now(); fn(); got.push(Date.now() - t0);\n  }\n  return median(got);\n}\n\nfunction slow(n) { let s = 0; for (let i = 0; i < n; i++) s += Math.sqrt(i); return s; }\n\n/* 기준선을 먼저 잡는다 — 이 기계에서 '보통' 이 얼마인지 */\nconst base = Math.max(timeIt(() => slow(400000), 5), 1);\nout.push(\"기준선(중앙값) \" + base + \"ms\");\nout.push(\"\");\n\nconst LIMIT = 2;   // 두 배까지 허용\n[400000, 700000, 1200000].forEach((n) => {\n  const now = Math.max(timeIt(() => slow(n), 5), 1);\n  const ratio = +(now / base).toFixed(2);\n  const verdict = ratio > LIMIT ? \"실패\" : \"통과\";\n  out.push(\"규모 \" + n + \"  \" + now + \"ms  \" + ratio + \"배  \" + verdict);\n});\n\nout.push(\"\");\nout.push(\"절대 시간이 아니라 배수로 본다 — 기계가 달라도 견줄 수 있다\");\nout.push(\"경계(정확히 \" + LIMIT + \"배)는 통과다. 문서에 적은 대로 동작해야 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 무엇이 진짜 원인이었나", type: "note",
    goal: "고치고 나서 돌아봅니다. <b>처음에 범인이라고 생각했던 것과 실제 원인</b>을 나란히 적으세요.\n다음에 같은 상황을 만나면 어디부터 볼지도 함께 적습니다.",
    ph: "처음 의심한 것 / 실제 원인 / 얼마나 줄었나(32분 → ?) / 측정 없이 고쳤다면 어디를 고쳤을까 / 다시 느려지는 것을 무엇이 막아 주나" }]
},

/* ─────────────────────────────────────────────── javascript */
{
  lv: 3, em: "🧠",
  title: "탭을 오래 켜 두면 느려진다",
  desc: "시간이 갈수록 무거워지는 프런트엔드의 메모리 누수를 리스너·타이머·클로저·캐시 네 곳에서 찾아 내고 정리 규약으로 막는다",
  skills: ["javascript", "debugging", "performance"],
  phases: [

  { t: "언제 무거워지는지 적는다", type: "note",
    goal: "'오래 켜 두면 느려진다' 를 <b>재현 절차</b>로 바꾸세요.\n어떤 조작을 몇 번 반복하면, 얼마 만에, 어떤 증상이 나오는지 적습니다.",
    ph: "예: 목록↔상세를 40번 오가면 스크롤이 끊김 · 30분 뒤 탭 메모리 180MB→1.1GB · 새로고침하면 바로 정상 · 상세를 안 열고 목록만 넘기면 안 늘어남" },

  { t: "무엇을 먼저 의심할 것인가", type: "decide",
    goal: "화면을 오갈 때마다 메모리가 조금씩 늘고 돌아오지 않습니다.",
    sit: "어디부터 보시겠습니까?",
    opts: [
      { label: "화면이 사라질 때 등록한 리스너·타이머·구독을 지우는지 본다",
        fx: { debugging: 3, coding: 2 },
        fb: "✅ <b>가장 흔한 원인이고 가장 싸게 확인됩니다.</b> `window`·`document` 처럼 오래 사는 대상에 붙인 리스너는 화면이 사라져도 남고, 그 리스너가 붙잡은 것 전부가 함께 남습니다. 등록한 자리 옆에 정리하는 자리가 있는지만 보면 됩니다.",
        best: true },
      { label: "메모리 스냅샷을 두 번 찍어 늘어난 객체를 견준다",
        fx: { debugging: 2, performance: 1 },
        fb: "△ 정확한 방법이고 원인이 뻔하지 않을 때는 이것뿐입니다. 다만 읽는 데 시간이 걸리므로, <b>싸게 확인되는 것을 먼저 걷어 낸 뒤</b>에 하는 것이 순서입니다." },
      { label: "주기적으로 페이지를 새로고침하게 한다",
        fx: { coding: -3 },
        fb: "⚠️ 증상을 숨기는 것이지 고치는 것이 아닙니다. 사용자가 쓰던 것이 날아가고, 누수는 계속 자라 새로고침 주기가 점점 짧아집니다." },
      { label: "큰 객체에 약한 참조를 써서 저절로 사라지게 한다",
        fx: { coding: -1 },
        fb: "⚠️ 도구를 원인 진단 없이 먼저 꺼낸 경우입니다. 약한 참조는 <b>캐시처럼 없어져도 되는 것</b>에 쓰는 장치라, 리스너가 붙잡고 있는 것은 이 방법으로 안 사라집니다." }] },

  { t: "붙잡고 있는 것을 드러낸다", type: "build",
    goal: "리스너를 등록만 하고 지우지 않을 때 <b>무엇이 남는지</b>를 눈으로 확인하세요.\n정리하는 판과 안 하는 판을 나란히 두고 남은 수를 셉니다.",
    hint: "이벤트 대상을 흉내 내는 작은 객체를 만들면 브라우저 없이도 확인됩니다. 핵심은 <b>등록한 함수가 바깥의 무엇을 붙잡고 있는가</b>입니다. 화면 데이터를 쓰는 함수는 그 데이터 전체를 붙잡습니다.",
    acc: "40번 오갔을 때 정리 있는 쪽과 없는 쪽의 남은 리스너 수·붙잡힌 데이터 크기가 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 오래 사는 대상 — 실제로는 window 나 document 다 */\nfunction makeHub() {\n  const subs = [];\n  return {\n    on(fn) { subs.push(fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },\n    count() { return subs.length; },\n    heldRows() { return subs.reduce((s, fn) => s + fn.rows, 0); }\n  };\n}\n\n/* 화면 하나를 열었다 닫는다. 리스너가 화면 데이터를 붙잡는다. */\nfunction visit(hub, cleanUp) {\n  const rows = new Array(5000).fill(0);      // 이 화면이 들고 있는 데이터\n  const handler = () => rows.length;         // 이 함수가 rows 를 붙잡는다\n  handler.rows = rows.length;\n  const off = hub.on(handler);\n  if (cleanUp) off();                        // 떠날 때 지운다\n}\n\n[false, true].forEach((cleanUp) => {\n  const hub = makeHub();\n  for (let i = 0; i < 40; i++) visit(hub, cleanUp);\n  out.push((cleanUp ? \"정리함  \" : \"정리안함\") +\n    \"  남은 리스너 \" + String(hub.count()).padStart(3) +\n    \"  붙잡힌 행 \" + hub.heldRows());\n});\n\nout.push(\"\");\nout.push(\"리스너 하나가 그 화면의 데이터 전부를 붙잡는다\");\nout.push(\"40번 오간 것뿐인데 20만 행이 남아 있다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "정리를 잊을 수 없게 만든다", type: "build",
    goal: "정리를 <b>기억해서 하는 일</b>로 두면 언젠가 반드시 빠집니다.\n등록과 정리를 한 자리에 묶는 작은 장치를 만드세요.",
    hint: "등록할 때마다 '되돌리는 함수' 를 돌려주고, 화면이 끝날 때 그것들을 한 번에 부르는 방식이 널리 쓰입니다. 되돌리는 함수를 모아 두는 상자가 있으면 <b>등록한 것만큼 정확히</b> 정리됩니다. 두 번 정리해도 안전해야 하고, 하나가 실패해도 나머지는 계속되어야 합니다.",
    acc: "여러 종류(리스너·타이머·구독)를 등록한 뒤 한 번의 호출로 전부 정리되고, 두 번 불러도 안전한 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 되돌리는 함수를 모아 두는 상자 */\nfunction scope() {\n  let undos = [];\n  let closed = false;\n  return {\n    add(undo) {\n      if (closed) { undo(); return; }        // 이미 닫혔으면 곧바로 되돌린다\n      undos.push(undo);\n    },\n    close() {\n      closed = true;\n      const errs = [];\n      /* 하나가 실패해도 나머지는 계속 정리한다 */\n      undos.forEach((u) => { try { u(); } catch (e) { errs.push(String(e.message)); } });\n      undos = [];\n      return errs;\n    },\n    size() { return undos.length; }\n  };\n}\n\nconst log = [];\nconst sc = scope();\nsc.add(() => log.push(\"리스너 해제\"));\nsc.add(() => log.push(\"타이머 정지\"));\nsc.add(() => { throw new Error(\"구독 해제 실패\"); });\nsc.add(() => log.push(\"캐시 비움\"));\n\nout.push(\"등록된 정리 \" + sc.size() + \"개\");\nconst errs = sc.close();\nout.push(\"정리 결과: \" + log.join(\" · \"));\nout.push(\"실패한 정리: \" + (errs.length ? errs.join(\", \") : \"없음\"));\nout.push(\"하나가 실패해도 나머지는 됐는가: \" + (log.length === 3));\n\n/* 두 번 닫아도 안전해야 한다 */\nconst again = sc.close();\nout.push(\"두 번째 close 에서 다시 부른 정리: \" + (log.length === 3 ? 0 : \"있음\") + \"개\");\n\n/* 닫힌 뒤에 등록하면 곧바로 되돌린다 — 늦게 도착한 것이 남지 않게 */\nsc.add(() => log.push(\"늦게 온 것도 정리\"));\nout.push(\"닫힌 뒤 등록: \" + log[log.length - 1]);\nconsole.log(out.join(\"\\n\"));" },

  { t: "캐시를 어디까지 둘 것인가", type: "decide",
    goal: "목록을 다시 그리지 않으려고 화면마다 결과를 캐시에 넣어 두었습니다. 캐시가 계속 자랍니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "최대 개수를 정하고 오래 안 쓴 것부터 버린다",
        fx: { performance: 3, coding: 2 },
        fb: "✅ <b>캐시에는 반드시 상한이 있어야 합니다.</b> 상한 없는 캐시는 이름만 캐시고 사실은 누수입니다. 오래 안 쓴 것부터 버리는 규칙이면 자주 쓰는 것은 남고 크기는 정해진 만큼만 씁니다. 상한을 정하는 일이 곧 '얼마나 빠를 것인가' 를 정하는 일입니다.",
        best: true },
      { label: "약한 참조로 담아 메모리가 부족할 때 저절로 사라지게 한다",
        fx: { coding: 1 },
        fb: "△ 없어져도 되는 것에는 맞는 도구입니다. 다만 <b>언제 사라질지 알 수 없어서</b> 성능이 들쭉날쭉해지고, 무엇이 남아 있는지 셀 수도 없어 문제를 조사하기 어렵습니다." },
      { label: "일정 시간이 지나면 통째로 비운다",
        fx: { performance: 1 },
        fb: "△ 크기는 잡히지만 <b>비우는 순간 전부 느려집니다.</b> 자주 쓰는 것까지 함께 버리기 때문입니다. 항목마다 수명을 두는 편이 낫습니다." },
      { label: "캐시를 아예 없앤다",
        fx: { performance: -1 },
        fb: "⚠️ 누수는 사라지지만 원래 풀려던 문제로 돌아갑니다. 캐시가 필요했던 이유가 있다면 <b>상한을 두는 것</b>이 없애는 것보다 낫습니다." }] },

  { t: "상한 있는 캐시를 만든다", type: "build",
    goal: "최대 개수를 넘으면 <b>가장 오래 안 쓴 것</b>부터 버리는 캐시를 만드세요.\n넣고 꺼내는 동안 크기가 상한을 넘지 않는 것을 확인합니다.",
    hint: "읽을 때도 '방금 썼다' 로 기록해야 합니다. 넣을 때만 순서를 갱신하면 자주 읽히는 항목이 버려집니다. `Map` 은 넣은 순서를 지키므로, 지웠다 다시 넣으면 맨 뒤로 보내는 효과가 납니다.",
    acc: "상한을 넘겨 넣어도 크기가 유지되고, 중간에 읽은 항목이 살아남는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction lru(limit) {\n  const m = new Map();\n  return {\n    get(k) {\n      if (!m.has(k)) return undefined;\n      const v = m.get(k);\n      m.delete(k); m.set(k, v);      // 방금 썼다 — 맨 뒤로 보낸다\n      return v;\n    },\n    set(k, v) {\n      if (m.has(k)) m.delete(k);\n      m.set(k, v);\n      while (m.size > limit) m.delete(m.keys().next().value);\n    },\n    keys() { return [...m.keys()]; },\n    size() { return m.size; }\n  };\n}\n\nconst c = lru(3);\n[\"a\", \"b\", \"c\"].forEach((k) => c.set(k, k.toUpperCase()));\nout.push(\"넣은 뒤: \" + c.keys().join(\",\") + \"  크기 \" + c.size());\n\nc.get(\"a\");                      // a 를 읽었다 — 가장 오래된 것이 b 가 된다\nc.set(\"d\", \"D\");\nout.push(\"a 를 읽고 d 를 넣은 뒤: \" + c.keys().join(\",\"));\nout.push(\"읽은 a 가 살아남았는가: \" + (c.get(\"a\") !== undefined));\nout.push(\"안 읽은 b 가 밀려났는가: \" + (c.get(\"b\") === undefined));\n\nfor (let i = 0; i < 100; i++) c.set(\"k\" + i, i);\nout.push(\"\");\nout.push(\"100개를 더 넣은 뒤 크기: \" + c.size() + \" (상한 3)\");\nout.push(\"상한 없는 캐시는 이름만 캐시고 사실은 누수다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "다시 새지 않는지 지킨다", type: "build",
    goal: "고친 뒤에도 누수가 돌아오지 않게 <b>자동으로 확인</b>하세요.\n화면을 여러 번 여닫은 뒤 남은 등록 수가 0인지 보는 검사를 만듭니다.",
    hint: "누수 검사는 절대 수치가 아니라 <b>여닫기 전후의 차이</b>로 봅니다. 시작할 때의 등록 수를 적어 두고, 여러 번 오간 뒤 같은 수로 돌아오는지 보면 됩니다. 한 번만 열고 닫아 보면 못 잡습니다 — 한 번은 우연히 맞을 수 있기 때문입니다.",
    acc: "여닫기 전후의 등록 수가 함께 출력되고, 정리를 빠뜨린 판에서는 검사가 실패로 판정되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction makeHub() {\n  const subs = new Set();\n  return { on(fn) { subs.add(fn); return () => subs.delete(fn); }, count() { return subs.size; } };\n}\n\nfunction screen(hub, cleanUp) {\n  const undos = [];\n  undos.push(hub.on(() => 1));\n  undos.push(hub.on(() => 2));\n  return () => { if (cleanUp) undos.forEach((u) => u()); };\n}\n\n/* 여닫기 전후를 견준다 — 한 번만 해 보면 우연히 맞을 수 있다 */\nfunction leakCheck(cleanUp, rounds) {\n  const hub = makeHub();\n  const before = hub.count();\n  for (let i = 0; i < rounds; i++) screen(hub, cleanUp)();\n  const after = hub.count();\n  return { before: before, after: after, leaked: after - before, ok: after === before };\n}\n\n[true, false].forEach((cleanUp) => {\n  const r = leakCheck(cleanUp, 30);\n  out.push((cleanUp ? \"정리함  \" : \"정리안함\") +\n    \"  전 \" + r.before + \"  후 \" + r.after +\n    \"  샌 것 \" + String(r.leaked).padStart(3) +\n    \"  \" + (r.ok ? \"통과\" : \"실패\"));\n});\n\nout.push(\"\");\nout.push(\"절대 수치가 아니라 여닫기 전후의 차이로 본다\");\nout.push(\"차이가 0이 아니면 여는 만큼 쌓이고 있다는 뜻이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 어디서 새고 있었나", type: "note",
    goal: "네 곳(리스너·타이머·클로저·캐시) 중 <b>실제로 샌 곳</b>과 그 이유를 적으세요.\n같은 실수가 다시 나오지 않게 팀이 지킬 규약도 한 줄로 적습니다.",
    ph: "샌 곳 / 왜 정리가 빠졌나 / 고친 뒤 30분 메모리 / 규약 한 줄(예: 등록하는 함수는 반드시 해제 함수를 돌려준다) / 이 규약을 무엇이 강제하나" }]
},

/* ─────────────────────────────────────────────── sql */
{
  lv: 3, em: "🗄️",
  title: "같은 주문이 두 번 들어왔다",
  desc: "중복 등록·재고 초과·이중 결제가 나는 동시성 문제를 재현해 보고 제약·트랜잭션·멱등 열쇠로 데이터 층에서 막는다",
  skills: ["sql", "database", "backend"],
  phases: [

  { t: "무엇이 두 번 들어왔는지 적는다", type: "note",
    goal: "중복이 <b>어느 조건에서</b> 생기는지 적으세요.\n하루 몇 건인지, 시간 간격은 얼마인지, 어떤 경로에서 들어왔는지를 함께 적습니다.",
    ph: "예: 주문 중복 하루 12건 · 두 행의 생성 시각 차이가 대개 0.3초 이내 · 결제 버튼 연타와 앱 재시도 두 경로 · 재고는 0인데 주문은 3건 더 들어온 사례 2건" },

  { t: "어디서 막을 것인가", type: "decide",
    goal: "'저장하기 전에 이미 있는지 조회한다' 로 막고 있었는데 중복이 계속 생깁니다.",
    sit: "어디서 막으시겠습니까?",
    opts: [
      { label: "DB 에 유일 제약을 걸고, 위반이 나면 그것을 정상 경로로 처리한다",
        fx: { database: 3, coding: 2 },
        fb: "✅ <b>확인하고 저장하는 사이에 다른 요청이 끼어들 수 있다</b>는 것이 문제의 전부입니다. 조회와 저장이 하나의 원자적 동작이 아니면 아무리 확인해도 뚫립니다. 유일 제약은 DB 가 그 원자성을 보장해 주는 유일한 자리이고, 위반 오류를 '이미 있음' 으로 받아 처리하면 됩니다.",
        best: true },
      { label: "애플리케이션에 잠금을 걸어 한 번에 하나만 저장하게 한다",
        fx: { database: -1, system_design: -1 },
        fb: "⚠️ 서버가 한 대일 때만 됩니다. 두 대로 늘리는 순간 각자의 잠금이라 뚫리고, <b>늘린 그날 사고가 납니다.</b> 분산 잠금으로 넓힐 수는 있지만 훨씬 복잡하고 여전히 DB 제약만큼 확실하지 않습니다." },
      { label: "저장한 뒤 중복을 찾아 지우는 배치를 돌린다",
        fx: { database: -2 },
        fb: "⚠️ 그 사이에 <b>이미 나간 것</b>이 있습니다. 알림이 두 번 가고 결제가 두 번 되고 나서 행만 지우는 셈입니다. 사후 정리는 마지막 안전망이지 방어가 아닙니다." },
      { label: "화면에서 버튼을 한 번만 누를 수 있게 한다",
        fx: { coding: -2 },
        fb: "⚠️ 필요한 배려지만 방어는 아닙니다. 네트워크 재시도·앱 재시작·다른 클라이언트로도 같은 요청이 들어오므로, <b>서버가 스스로 지켜야</b> 합니다." }] },

  { t: "중복이 생기는 순간을 재현한다", type: "build",
    goal: "'확인하고 저장하기' 가 왜 뚫리는지 <b>두 요청을 엇갈리게</b> 실행해 보여 주세요.\n제약이 있을 때와 없을 때를 나란히 둡니다.",
    hint: "두 요청이 완전히 동시가 아니어도 됩니다. 하나가 확인을 마치고 저장하기 전에 다른 하나가 확인을 하면 그것으로 충분합니다. 순서를 손으로 엇갈리게 만들면 언제나 재현됩니다.",
    acc: "제약 없는 저장소에서는 두 행이 들어가고, 제약 있는 저장소에서는 하나만 들어가며 두 번째가 오류로 잡히는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction store(unique) {\n  const rows = [], keys = new Set();\n  return {\n    exists(k) { return keys.has(k); },\n    insert(k) {\n      if (unique && keys.has(k)) throw new Error(\"UNIQUE 위반: \" + k);\n      keys.add(k); rows.push(k); return rows.length;\n    },\n    count() { return rows.length; }\n  };\n}\n\n/* 두 요청이 엇갈린다 — 완전히 동시가 아니어도 뚫린다 */\nfunction race(db) {\n  const key = \"order-8821\";\n  const seenA = db.exists(key);          // A 가 확인 — 없다\n  const seenB = db.exists(key);          // B 가 확인 — 아직도 없다\n  const log = [];\n  [[\"A\", seenA], [\"B\", seenB]].forEach((r) => {\n    if (r[1]) { log.push(r[0] + \": 이미 있음 — 건너뜀\"); return; }\n    try { db.insert(key); log.push(r[0] + \": 저장함\"); }\n    catch (e) { log.push(r[0] + \": \" + e.message + \" → 이미 있음으로 처리\"); }\n  });\n  return log;\n}\n\n[false, true].forEach((unique) => {\n  const db = store(unique);\n  const log = race(db);\n  out.push((unique ? \"유일 제약 있음\" : \"유일 제약 없음\"));\n  log.forEach((l) => out.push(\"  \" + l));\n  out.push(\"  최종 행 수: \" + db.count());\n  out.push(\"\");\n});\n\nout.push(\"확인과 저장 사이가 비어 있으면 확인은 아무것도 막지 못한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "다시 보내도 한 번만 처리한다", type: "build",
    goal: "클라이언트가 같은 요청을 <b>다시 보내도</b> 결과가 하나이도록 만드세요.\n요청마다 붙은 열쇠로 처음 처리한 결과를 그대로 돌려줍니다.",
    hint: "재시도는 없앨 수 없습니다 — 네트워크가 끊기면 클라이언트는 성공했는지 알 수 없어 다시 보내는 것이 옳습니다. 그래서 <b>여러 번 와도 한 번만 처리되게</b> 만듭니다. 같은 열쇠로 다시 오면 새로 처리하지 말고 처음 결과를 돌려주는 것이 핵심입니다. 열쇠는 서버가 아니라 클라이언트가 만듭니다.",
    acc: "같은 열쇠로 세 번 보내도 처리 횟수가 1이고 세 응답이 같으며, 다른 열쇠는 따로 처리되는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction server() {\n  const seen = new Map();    // 열쇠 → 처음 결과\n  let handled = 0;\n  return {\n    order(key, item) {\n      if (seen.has(key)) return { id: seen.get(key), fresh: false };\n      handled++;\n      const id = \"ORD-\" + (1000 + handled);\n      seen.set(key, id);\n      return { id: id, fresh: true };\n    },\n    handled() { return handled; }\n  };\n}\n\nconst s = server();\nconst ids = [];\nfor (let i = 0; i < 3; i++) {\n  const r = s.order(\"idem-77\", \"책상\");\n  ids.push(r.id + (r.fresh ? \"(새로 처리)\" : \"(다시 보냄)\"));\n}\nout.push(\"같은 열쇠 3번: \" + ids.join(\"  \"));\nout.push(\"실제 처리 횟수: \" + s.handled());\n\nconst other = s.order(\"idem-78\", \"의자\");\nout.push(\"다른 열쇠: \" + other.id + \"  처리 횟수 \" + s.handled());\n\nout.push(\"\");\nout.push(\"응답이 전부 같은가: \" + (new Set(ids.map((x) => x.slice(0, 8))).size === 1));\nout.push(\"열쇠는 클라이언트가 만든다 — 서버가 만들면 재시도마다 달라진다\");\nout.push(\"기억할 기간을 정해야 한다. 무한히 쌓을 수는 없다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "재고는 어떻게 지킬 것인가", type: "decide",
    goal: "재고 1개인 상품에 동시에 3건의 주문이 들어와 3건 모두 성공했습니다.",
    sit: "어떻게 막으시겠습니까?",
    opts: [
      { label: "한 문장으로 조건부 차감하고, 바뀐 행이 0이면 실패로 본다",
        fx: { database: 3, performance: 2 },
        fb: "✅ <b>읽고 계산해서 쓰는 것</b>이 문제였습니다. 조건을 문장 안에 넣어 '재고가 1 이상일 때만 1을 뺀다' 로 한 번에 처리하면, DB 가 행 잠금으로 순서를 세워 줍니다. 바뀐 행 수가 0이면 재고가 없었다는 뜻이라, 따로 조회할 필요도 없습니다.",
        best: true },
      { label: "조회할 때 그 행을 잠그고 계산한 뒤 갱신한다",
        fx: { database: 2 },
        fb: "△ 맞는 방법입니다. 여러 테이블에 걸친 복잡한 판단이 필요할 때는 이쪽이어야 합니다. 다만 잠그는 시간이 길어지고 <b>교착에 빠질 여지</b>가 생기므로, 한 문장으로 되는 일이라면 위쪽이 낫습니다." },
      { label: "격리 수준을 가장 엄격하게 올린다",
        fx: { database: -1, performance: -2 },
        fb: "⚠️ 막히기는 합니다. 다만 전체 처리량이 크게 떨어지고 <b>충돌로 실패하는 트랜잭션</b>이 늘어 재시도 코드가 필요해집니다. 문제 하나를 위해 시스템 전체에 값을 치르는 셈입니다." },
      { label: "주문을 큐에 넣어 한 줄로 처리한다",
        fx: { system_design: 1, performance: -1 },
        fb: "△ 확실히 막히고 초당 수만 건 규모에서는 실제로 쓰는 방법입니다. 다만 주문이 즉시 확정되지 않아 <b>화면과 사용자 경험이 통째로 바뀝니다.</b> 이 규모에서 꺼낼 카드는 아닙니다." }] },

  { t: "조건부 차감을 만든다", type: "build",
    goal: "재고가 남아 있을 때만 차감하는 <b>한 번의 동작</b>을 만들고, 동시에 여러 요청이 와도 초과되지 않는지 확인하세요.",
    hint: "핵심은 '읽기' 와 '쓰기' 사이에 틈이 없어야 한다는 것입니다. 조건과 갱신이 한 동작이면 그 틈이 없습니다. 바뀐 행 수를 결과로 받으면 성공·실패를 그것으로 판정할 수 있어, 다시 조회할 필요가 없습니다.",
    acc: "재고보다 많은 요청을 보냈을 때 성공 수가 정확히 재고 수와 같고, 재고가 음수가 되지 않는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction inventory(start) {\n  let stock = start;\n  return {\n    /* 나쁜 방식 — 읽고, 계산하고, 쓴다. 그 사이가 비어 있다 */\n    unsafeTake() {\n      const cur = stock;            // 읽기\n      if (cur < 1) return false;\n      stock = cur - 1;              // 쓰기 — 그 사이에 남이 끼어들 수 있다\n      return true;\n    },\n    /* 좋은 방식 — 조건과 갱신이 한 동작이다. 바뀐 행 수를 돌려준다 */\n    take() {\n      if (stock < 1) return 0;\n      stock -= 1;\n      return 1;\n    },\n    left() { return stock; }\n  };\n}\n\n/* 엇갈린 실행을 흉내 낸다 — 세 요청이 모두 '읽기' 를 먼저 마친다 */\nconst bad = inventory(1);\nconst reads = [bad.left(), bad.left(), bad.left()];\nlet badOk = 0;\nreads.forEach((cur) => { if (cur >= 1) { badOk++; } });\nout.push(\"읽고-쓰기 방식: 세 요청이 전부 재고 \" + reads[0] + \"을 보고 \" + badOk + \"건 성공\");\nout.push(\"  → 재고 1개에 주문 \" + badOk + \"건. 초과 \" + (badOk - 1) + \"건\");\n\nconst good = inventory(1);\nlet ok = 0;\nfor (let i = 0; i < 3; i++) ok += good.take();\nout.push(\"\");\nout.push(\"조건부 차감: 성공 \" + ok + \"건 · 남은 재고 \" + good.left());\n\nconst many = inventory(5);\nlet ok2 = 0;\nfor (let i = 0; i < 50; i++) ok2 += many.take();\nout.push(\"재고 5에 요청 50건: 성공 \" + ok2 + \"건 · 남은 재고 \" + many.left());\nout.push(\"음수가 되지 않았는가: \" + (many.left() >= 0));\nconsole.log(out.join(\"\\n\"));" },

  { t: "이미 들어온 중복을 정리한다", type: "build",
    goal: "막기 전에 들어온 중복 행을 <b>안전하게 정리</b>하는 절차를 만드세요.\n무엇을 남기고 무엇을 지울지 규칙을 정하고, 지우기 전에 목록을 먼저 냅니다.",
    hint: "지우는 작업은 되돌릴 수 없으므로 <b>목록을 먼저 뽑아 눈으로 봅니다.</b> 남길 것을 고르는 규칙은 대개 '가장 먼저 들어온 것' 이지만, 뒤의 행에만 붙은 정보가 있다면 합쳐야 합니다. 제약을 걸기 전에 정리하지 않으면 제약 자체가 걸리지 않습니다.",
    acc: "중복 묶음과 남길 행·지울 행이 구분되어 출력되고, 정리 뒤 열쇠가 유일해지는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst rows = [\n  { id: 1, key: \"A\", at: 100, memo: \"\" },\n  { id: 2, key: \"B\", at: 110, memo: \"선물포장\" },\n  { id: 3, key: \"A\", at: 101, memo: \"급함\" },\n  { id: 4, key: \"C\", at: 120, memo: \"\" },\n  { id: 5, key: \"A\", at: 103, memo: \"\" },\n  { id: 6, key: \"B\", at: 111, memo: \"\" }\n];\n\n/* 열쇠별로 묶는다 */\nconst byKey = new Map();\nrows.forEach((r) => { if (!byKey.has(r.key)) byKey.set(r.key, []); byKey.get(r.key).push(r); });\n\nconst keep = [], drop = [], merged = [];\nbyKey.forEach((group, key) => {\n  group.sort((a, b) => a.at - b.at);\n  const head = group[0];\n  /* 뒤의 행에만 있는 정보는 잃지 않고 합친다 */\n  group.slice(1).forEach((r) => {\n    if (r.memo && !head.memo) { head.memo = r.memo; merged.push(r.id + \"→\" + head.id + \" memo\"); }\n    drop.push(r.id);\n  });\n  keep.push(head);\n});\n\nout.push(\"중복 묶음: \" + [...byKey.keys()].filter((k) => byKey.get(k).length > 1).join(\", \"));\nout.push(\"남길 행: \" + keep.map((r) => r.id + \"(\" + r.key + (r.memo ? \" \" + r.memo : \"\") + \")\").join(\"  \"));\nout.push(\"지울 행: \" + drop.join(\", \"));\nout.push(\"합친 값: \" + (merged.length ? merged.join(\", \") : \"없음\"));\nout.push(\"\");\nconst keys = keep.map((r) => r.key);\nout.push(\"정리 뒤 열쇠가 유일한가: \" + (new Set(keys).size === keys.length));\nout.push(\"지우기 전에 이 목록을 먼저 사람이 본다 — 되돌릴 수 없기 때문이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 어디에 방어선을 두었나", type: "note",
    goal: "막은 자리를 <b>층별로</b> 적으세요. 화면·서버·DB 중 어디에 무엇을 두었고, 각 층이 무엇을 막고 무엇은 못 막는지 적습니다.",
    ph: "화면(연타 방지) / 서버(멱등 열쇠) / DB(유일 제약·조건부 차감) / 각 층이 못 막는 것 / 정리한 중복 행 수 / 다시 생기면 무엇이 먼저 알려 주나" }]
},

/* ─────────────────────────────────────────────── go */
{
  lv: 3, em: "🧵",
  title: "고루틴이 조용히 새어 나간다",
  desc: "요청이 끝나도 남는 고루틴과 닫히지 않는 채널을 재현해 찾아 내고, 취소 신호와 종료 규약으로 끝나는 길을 만든다",
  skills: ["go", "debugging", "system_design"],
  phases: [

  { t: "새고 있다는 근거를 적는다", type: "note",
    goal: "'새는 것 같다' 가 아니라 <b>세어 본 숫자</b>를 적으세요.\n시작 직후와 부하 뒤의 고루틴 수, 부하를 멈춘 뒤 돌아오는지를 적습니다.",
    ph: "예: 기동 직후 12 · 1시간 부하 뒤 48,300 · 부하를 멈추고 10분 기다려도 47,900 · 메모리도 함께 오름 · 외부 API 응답이 느린 시간대와 겹침" },

  { t: "어디서 끝나지 않는가", type: "decide",
    goal: "요청마다 고루틴을 띄워 외부 API 를 호출하는데, 응답이 늦으면 그 고루틴이 돌아오지 않습니다.",
    sit: "무엇이 원인이겠습니까?",
    opts: [
      { label: "기다리는 쪽이 먼저 떠나서, 보내려는 고루틴이 받는 사람 없는 채널에 영원히 막혀 있다",
        fx: { debugging: 3, system_design: 2 },
        fb: "✅ <b>버퍼 없는 채널은 받는 사람이 있어야 보낼 수 있습니다.</b> 호출한 쪽이 시간 초과로 떠나 버리면 결과를 보내려던 고루틴은 그 자리에서 멈춘 채 영원히 남습니다. 요청 하나마다 하나씩 쌓이므로 부하가 클수록 빨리 늘어납니다.",
        best: true },
      { label: "외부 API 가 느려서 호출이 오래 걸리는 것뿐이다",
        fx: { debugging: -1 },
        fb: "⚠️ 그렇다면 <b>부하를 멈춘 뒤에는 줄어들어야</b> 합니다. 10분이 지나도 그대로라면 기다리는 것이 아니라 끝날 수 없는 상태입니다." },
      { label: "가비지 컬렉터가 못 따라가고 있다",
        fx: { performance: -2 },
        fb: "⚠️ 돌고 있는 고루틴은 <b>수거 대상이 아닙니다.</b> 살아 있는 것이므로 아무리 수거해도 사라지지 않고, 메모리가 함께 느는 것도 그 고루틴들이 붙잡은 것 때문입니다." },
      { label: "고루틴을 너무 많이 띄워서 스케줄러가 밀린 것이다",
        fx: { system_design: -1 },
        fb: "⚠️ 많이 띄우는 것 자체는 Go 에서 문제가 아닙니다. 수만 개도 정상입니다. 문제는 수가 아니라 <b>끝나지 않는다는 것</b>입니다." }] },

  { t: "새는 모양을 재현한다", type: "build",
    goal: "받는 사람 없이 남는 고루틴을 <b>세어서</b> 보여 주세요.\n호출한 쪽이 먼저 떠나는 상황을 만들고, 남은 수가 요청 수만큼 쌓이는 것을 확인합니다.",
    hint: "Go 없이도 같은 모양을 만들 수 있습니다. '결과를 보내려고 기다리는 작업' 을 목록에 남겨 두면 그것이 곧 새는 고루틴입니다. 핵심은 <b>보내려는 쪽과 받는 쪽의 수가 맞지 않는다</b>는 것입니다.",
    acc: "요청 수를 늘렸을 때 남은 작업 수가 그만큼 쌓이고, 시간이 지나도 줄지 않는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 버퍼 없는 채널을 흉내 낸다 — 받는 사람이 있어야 보낼 수 있다 */\nfunction chan() {\n  const waiting = [];\n  return {\n    send(v) { waiting.push(v); return \"막힘\"; },   // 받는 사람이 없으면 여기서 멈춘다\n    recv() { return waiting.length ? (waiting.shift(), \"받음\") : \"없음\"; },\n    stuck() { return waiting.length; }\n  };\n}\n\nfunction runRequests(n, callerWaits) {\n  const ch = chan();\n  let leaked = 0;\n  for (let i = 0; i < n; i++) {\n    ch.send(\"결과\" + i);                 // 작업 고루틴이 결과를 보내려 한다\n    if (callerWaits) ch.recv();          // 호출한 쪽이 기다렸다가 받는다\n  }\n  leaked = ch.stuck();\n  return leaked;\n}\n\nout.push(\"요청 수   기다림   시간초과로 떠남\");\n[10, 100, 1000].forEach((n) => {\n  out.push(String(n).padEnd(10) +\n    String(runRequests(n, true)).padEnd(9) +\n    runRequests(n, false));\n});\n\nout.push(\"\");\nout.push(\"호출한 쪽이 떠나면 보내려던 것이 그 자리에 남는다\");\nout.push(\"요청 수만큼 정확히 쌓이고, 기다려도 줄지 않는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "끝나는 길을 만든다", type: "build",
    goal: "호출한 쪽이 떠나도 작업이 <b>스스로 끝날 수 있게</b> 만드세요.\n취소 신호를 함께 넘기고, 그 신호가 오면 보내기를 포기합니다.",
    hint: "두 가지 방법이 있고 둘 다 씁니다. 하나는 <b>취소 신호</b>를 함께 넘겨 '이제 안 받는다' 를 알리는 것이고, 다른 하나는 채널에 <b>버퍼를 하나 두어</b> 받는 사람이 없어도 보내고 떠날 수 있게 하는 것입니다. 취소 신호는 여러 층을 타고 내려가야 뜻이 있습니다.",
    acc: "호출한 쪽이 떠난 뒤에도 남은 작업이 0이고, 취소된 작업 수가 따로 세어져 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction chan(bufSize) {\n  const box = [];\n  return {\n    trySend(v) { if (box.length < bufSize) { box.push(v); return true; } return false; },\n    stuck() { return 0; }        // 버퍼에 넣고 떠나므로 막히지 않는다\n  };\n}\n\nfunction ctx() {\n  let done = false;\n  return { cancel() { done = true; }, done() { return done; } };\n}\n\nfunction runRequests(n, useCtx, buf) {\n  let leaked = 0, cancelled = 0, delivered = 0;\n  for (let i = 0; i < n; i++) {\n    const c = ctx();                      // 요청마다 자기 취소 신호를 갖는다\n    const ch = chan(buf);\n    if (i % 2 === 0) c.cancel();          // 절반은 호출한 쪽이 먼저 떠난다\n    /* 작업 고루틴 */\n    if (useCtx && c.done()) cancelled++;             // 취소를 보고 포기한다\n    else if (ch.trySend(\"결과\" + i)) delivered++;\n    else leaked++;                                    // 보낼 수도 포기할 수도 없다\n  }\n  return { leaked: leaked, cancelled: cancelled, delivered: delivered };\n}\n\nout.push(\"설정                    남음   전달   취소\");\n[[false, 0, \"취소 없음 · 버퍼 0\"],\n [false, 1, \"취소 없음 · 버퍼 1\"],\n [true, 1, \"취소 있음 · 버퍼 1\"]].forEach((c) => {\n  const r = runRequests(1000, c[0], c[1]);\n  out.push(c[2].padEnd(24) + String(r.leaked).padEnd(7) +\n    String(r.delivered).padEnd(7) + r.cancelled);\n});\n\nout.push(\"\");\nout.push(\"버퍼 하나만 두어도 보내고 떠날 수 있어 막히지 않는다\");\nout.push(\"취소 신호까지 있으면 떠난 요청에 헛일조차 하지 않는다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "얼마나 기다릴 것인가", type: "decide",
    goal: "외부 API 가 가끔 30초씩 걸립니다. 지금은 시간 제한이 없습니다.",
    sit: "어떻게 정하시겠습니까?",
    opts: [
      { label: "실제 응답 시간의 꼬리를 재서 그보다 조금 크게 잡고, 전체 예산 안에서 나눈다",
        fx: { system_design: 3, performance: 2 },
        fb: "✅ <b>숫자를 재서 정합니다.</b> 99% 가 800ms 안에 끝난다면 2초쯤이 합리적입니다. 그리고 이 호출은 더 큰 요청의 일부이므로, 전체 예산에서 남은 만큼만 줄 수 있습니다 — 남은 예산보다 긴 제한은 뜻이 없습니다.",
        best: true },
      { label: "모든 외부 호출에 3초로 통일한다",
        fx: { system_design: 1 },
        fb: "△ 없는 것보다 훨씬 낫고 시작점으로 나쁘지 않습니다. 다만 빠른 API 에는 너무 길고 원래 오래 걸리는 API 에는 짧아, <b>양쪽에서 어긋납니다.</b>" },
      { label: "충분히 길게 60초로 잡아 실패를 줄인다",
        fx: { performance: -2, system_design: -1 },
        fb: "⚠️ 그동안 자원이 묶여 있습니다. 상대가 죽었을 때 60초씩 붙잡고 있으면 <b>내 서비스가 먼저 무너집니다.</b> 긴 제한은 없는 것과 크게 다르지 않습니다." },
      { label: "제한을 두지 않고 실패하면 재시도한다",
        fx: { system_design: -3 },
        fb: "⚠️ 끝나지 않는 호출은 실패조차 하지 않으므로 재시도할 기회도 없습니다. <b>제한이 있어야 실패가 있고, 실패가 있어야 재시도가 뜻을 가집니다.</b>" }] },

  { t: "예산을 나눠 쓴다", type: "build",
    goal: "요청 전체에 주어진 시간을 <b>단계마다 나눠</b> 쓰는 계산을 만드세요.\n남은 예산보다 긴 제한은 남은 만큼으로 줄입니다.",
    hint: "각 단계가 자기 제한만 보면 합쳐서 전체 예산을 넘깁니다. 앞 단계가 쓴 시간을 빼고 <b>남은 것</b>을 다음 단계에 넘겨야 합니다. 남은 예산이 0 이하면 시작하기도 전에 포기하는 것이 맞습니다 — 어차피 늦었기 때문입니다.",
    acc: "단계별 제한과 실제로 쓴 시간이 출력되고, 합계가 전체 예산을 넘지 않으며 예산이 다하면 나머지 단계를 건너뛰는 것이 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction run(budgetMs, steps) {\n  let left = budgetMs;\n  const log = [];\n  let spent = 0;\n  for (const s of steps) {\n    if (left <= 0) { log.push([s.name, \"—\", \"건너뜀 (예산 없음)\"]); continue; }\n    const limit = Math.min(s.want, left);          // 남은 것보다 길게 줄 수 없다\n    const took = Math.min(s.actual, limit);\n    const ok = s.actual <= limit;\n    left -= took; spent += took;\n    log.push([s.name, limit + \"ms\", took + \"ms \" + (ok ? \"성공\" : \"시간초과\")]);\n    if (!ok) break;                                 // 초과하면 뒤는 뜻이 없다\n  }\n  return { log: log, spent: spent, left: left };\n}\n\nconst steps = [\n  { name: \"인증 조회\", want: 500, actual: 120 },\n  { name: \"상품 API\", want: 2000, actual: 900 },\n  { name: \"재고 API\", want: 2000, actual: 2600 },\n  { name: \"추천 API\", want: 1000, actual: 300 }\n];\n\nconst r = run(3000, steps);\nout.push(\"전체 예산 3000ms\");\nout.push(\"단계        제한      결과\");\nr.log.forEach((l) => out.push(l[0].padEnd(12) + String(l[1]).padEnd(10) + l[2]));\nout.push(\"\");\nout.push(\"쓴 시간 \" + r.spent + \"ms · 남은 예산 \" + r.left + \"ms\");\nout.push(\"예산을 넘지 않았는가: \" + (r.spent <= 3000));\nout.push(\"\");\nout.push(\"각 단계가 자기 제한만 보면 합쳐서 예산을 넘긴다\");\nout.push(\"남은 예산이 0이면 시작하지 않는 것이 맞다 — 어차피 늦었다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "새는지 자동으로 본다", type: "build",
    goal: "새는 것을 <b>사람이 그래프를 보고 알아채는 일</b>로 두면 늦습니다.\n작업 전후의 살아 있는 수를 견주는 검사를 만드세요.",
    hint: "누수 검사는 절대 수치가 아니라 <b>전후의 차이</b>로 봅니다. 다만 작업이 끝난 직후에는 아직 정리 중인 것이 있을 수 있어, 조금 기다렸다 재는 여유가 필요합니다. 한 번만 재면 우연히 맞을 수 있으므로 여러 번 반복합니다.",
    acc: "여러 번 반복한 뒤 전후 차이가 0인 경우와 아닌 경우가 각각 통과·실패로 판정되어 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction pool() {\n  let live = 0;\n  return {\n    spawn(finishes) { live++; if (finishes) live--; },\n    live() { return live; }\n  };\n}\n\nfunction leakCheck(finishes, rounds) {\n  const p = pool();\n  const before = p.live();\n  for (let i = 0; i < rounds; i++) p.spawn(finishes);\n  const after = p.live();\n  return { before: before, after: after, diff: after - before, ok: after === before };\n}\n\nout.push(\"판정      전   후     차이   결과\");\n[[true, \"끝난다  \"], [false, \"안 끝난다\"]].forEach((c) => {\n  const r = leakCheck(c[0], 500);\n  out.push(c[1] + \"  \" + String(r.before).padEnd(4) +\n    String(r.after).padEnd(7) + String(r.diff).padEnd(7) +\n    (r.ok ? \"통과\" : \"실패 — 요청만큼 쌓인다\"));\n});\n\nout.push(\"\");\nout.push(\"차이가 0이 아니면 요청 하나마다 하나씩 남고 있다는 뜻이다\");\nout.push(\"한 번만 재면 우연히 맞을 수 있어 여러 번 반복한다\");\nout.push(\"작업 직후에는 정리 중인 것이 있으므로 조금 기다렸다 잰다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 끝나는 길이 있었나", type: "note",
    goal: "고루틴을 띄우는 자리마다 <b>끝나는 길</b>이 있었는지 적으세요.\n취소 신호가 어디까지 내려가는지, 제한 시간을 무엇으로 정했는지도 적습니다.",
    ph: "샌 자리 / 왜 끝날 수 없었나 / 고친 뒤 1시간 부하 후 고루틴 수 / 취소 신호가 닿지 않는 곳이 남아 있나 / 제한 시간을 정한 근거(잰 숫자)" }]
},

/* ─────────────────────────────────────────────── security */
{
  lv: 4, em: "🔐",
  title: "남의 주문이 보인다",
  desc: "번호만 바꾸면 남의 데이터가 열리는 접근 제어 결함을 찾아 내고, 권한 판정을 한 자리로 모아 새 화면에서도 저절로 지켜지게 만든다",
  skills: ["security", "backend", "code"],
  phases: [

  { t: "무엇이 열렸는지 적는다", type: "note",
    goal: "확인된 사실만 적으세요. <b>어떤 요청으로 무엇이 열렸는지</b>를 재현 가능한 형태로 적습니다.\n추측과 사실을 섞지 않는 것이 중요합니다.",
    ph: "예: /orders/8821 을 다른 계정 토큰으로 호출하면 200 과 함께 주문 상세가 나옴 · 목록 API 는 막혀 있음 · 상세·영수증·취소 세 곳에서 재현 · 로그로 확인된 실제 조회 12건" },

  { t: "어디에서 판정할 것인가", type: "decide",
    goal: "권한 검사가 화면마다 흩어져 있고, 새로 만든 화면 세 곳에서 빠져 있었습니다.",
    sit: "어떻게 바꾸시겠습니까?",
    opts: [
      { label: "자원을 가져오는 자리에서 소유자까지 함께 조건에 넣어, 남의 것은 애초에 안 나오게 한다",
        fx: { security: 3, coding: 2 },
        fb: "✅ <b>검사를 잊을 수 있는 구조 자체를 없애는 방법</b>입니다. 조회 조건에 '내 것' 이 들어 있으면 새 화면을 만드는 사람이 권한을 몰라도 안전합니다. 검사를 추가하는 것이 아니라 <b>검사를 안 해도 되게</b> 만드는 것이 차이입니다.",
        best: true },
      { label: "모든 핸들러 앞에 권한 검사 미들웨어를 둔다",
        fx: { security: 2, system_design: 1 },
        fb: "△ 좋은 층이고 인증·역할 검사에는 이쪽이 맞습니다. 다만 '이 자원이 내 것인가' 는 자원을 봐야 알 수 있어 미들웨어에서 판정하기 어렵고, <b>예외 목록이 쌓이면서</b> 다시 빠지는 곳이 생깁니다." },
      { label: "화면마다 검사를 넣고 코드 리뷰에서 확인한다",
        fx: { security: -2 },
        fb: "⚠️ 지금 방식 그대로입니다. 세 곳에서 빠진 이유가 바로 <b>사람이 기억해야 하기 때문</b>이라, 같은 실수가 계속 납니다." },
      { label: "자원 번호를 추측하기 어려운 값으로 바꾼다",
        fx: { security: -1 },
        fb: "⚠️ 찾기 어렵게 만들 뿐 <b>막지는 못합니다.</b> 번호가 새는 경로(공유 링크·로그·추천 목록)는 많고, 알아낸 뒤에는 그대로 열립니다. 보완책이지 방어가 아닙니다." }] },

  { t: "뚫리는 자리를 재현한다", type: "build",
    goal: "소유자 확인 없이 번호로만 가져오는 조회가 <b>어떻게 뚫리는지</b> 보여 주세요.\n확인 있는 판과 없는 판을 나란히 둡니다.",
    hint: "핵심은 '누가 요청했는가' 가 조회 조건에 들어 있는지입니다. 조건이 번호뿐이면 번호를 아는 누구에게나 열립니다. 없는 자원과 남의 자원을 <b>같은 응답으로</b> 돌려주어야 한다는 점도 함께 확인하세요 — 다르게 응답하면 번호의 존재 여부가 새어 나갑니다.",
    acc: "남의 자원 요청이 확인 없는 쪽에서는 성공하고 확인 있는 쪽에서는 막히며, 없는 자원과 응답이 같은 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst ORDERS = [\n  { id: 8820, owner: \"u1\", total: 12000 },\n  { id: 8821, owner: \"u2\", total: 47000 }\n];\n\n/* 나쁜 방식 — 번호만 보고 가져온다 */\nfunction unsafeGet(user, id) {\n  const o = ORDERS.filter((x) => x.id === id)[0];\n  return o ? { code: 200, body: o } : { code: 404, body: null };\n}\n\n/* 좋은 방식 — 조회 조건에 소유자가 들어 있다 */\nfunction safeGet(user, id) {\n  const o = ORDERS.filter((x) => x.id === id && x.owner === user)[0];\n  /* 남의 것과 없는 것을 같은 응답으로 — 다르면 번호의 존재가 새어 나간다 */\n  return o ? { code: 200, body: o } : { code: 404, body: null };\n}\n\nconst cases = [[\"u1\", 8820, \"내 주문\"], [\"u1\", 8821, \"남의 주문\"], [\"u1\", 9999, \"없는 주문\"]];\nout.push(\"요청              소유자확인 없음      있음\");\ncases.forEach((c) => {\n  const a = unsafeGet(c[0], c[1]), b = safeGet(c[0], c[1]);\n  out.push((c[2] + \" \" + c[1]).padEnd(18) +\n    (a.code + (a.body ? \" 열림\" : \" 막힘\")).padEnd(20) +\n    b.code + (b.body ? \" 열림\" : \" 막힘\"));\n});\n\nout.push(\"\");\nconst other = safeGet(\"u1\", 8821), none = safeGet(\"u1\", 9999);\nout.push(\"남의 것과 없는 것의 응답이 같은가: \" + (other.code === none.code));\nout.push(\"다르게 응답하면 '그 번호는 있다' 가 새어 나간다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "권한을 한 자리로 모은다", type: "build",
    goal: "누가 무엇에 무엇을 할 수 있는지를 <b>한 곳에서</b> 판정하도록 만드세요.\n역할·소유·상태를 함께 보고, 모르는 동작은 거부합니다.",
    hint: "판정 함수 하나로 모으면 새 화면이 늘어도 규칙은 한 자리에 남습니다. 중요한 것은 <b>기본이 거부</b>여야 한다는 것입니다 — 규칙에 없는 동작이 허용되면 새 동작을 추가할 때마다 구멍이 생깁니다. 거부할 때는 이유를 함께 남겨 조사할 수 있게 합니다.",
    acc: "역할·소유·상태 조합에 대한 판정표가 출력되고, 규칙에 없는 동작이 거부되는 것이 확인되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 규칙은 한 자리에만 둔다. 없는 것은 거부다. */\nfunction can(user, action, order) {\n  if (!user) return [false, \"로그인 필요\"];\n  if (user.role === \"admin\") {\n    if (action === \"delete\") return [false, \"삭제는 아무도 못 한다\"];\n    return [true, \"관리자\"];\n  }\n  const mine = order && order.owner === user.id;\n  if (!mine) return [false, \"내 자원이 아님\"];\n  if (action === \"view\") return [true, \"소유자\"];\n  if (action === \"cancel\") {\n    if (order.status !== \"paid\") return [false, \"상태가 \" + order.status + \" 라 취소 불가\"];\n    return [true, \"소유자 · 결제됨\"];\n  }\n  return [false, \"모르는 동작: \" + action];   // 기본은 거부\n}\n\nconst u1 = { id: \"u1\", role: \"user\" };\nconst ad = { id: \"a1\", role: \"admin\" };\nconst paid = { owner: \"u1\", status: \"paid\" };\nconst shipped = { owner: \"u1\", status: \"shipped\" };\nconst others = { owner: \"u2\", status: \"paid\" };\n\nconst rows = [\n  [u1, \"view\", paid, \"내 결제건 보기\"],\n  [u1, \"cancel\", paid, \"내 결제건 취소\"],\n  [u1, \"cancel\", shipped, \"배송 시작 뒤 취소\"],\n  [u1, \"view\", others, \"남의 것 보기\"],\n  [ad, \"view\", others, \"관리자가 보기\"],\n  [ad, \"delete\", others, \"관리자가 삭제\"],\n  [u1, \"refund\", paid, \"규칙에 없는 동작\"],\n  [null, \"view\", paid, \"로그인 안 함\"]\n];\n\nout.push(\"상황                    결과   이유\");\nrows.forEach((r) => {\n  const v = can(r[0], r[1], r[2]);\n  out.push(r[3].padEnd(24) + (v[0] ? \"허용\" : \"거부\").padEnd(7) + v[1]);\n});\n\nout.push(\"\");\nout.push(\"규칙에 없는 동작은 거부다 — 새 동작이 저절로 열리지 않는다\");\nout.push(\"거부 이유를 남겨야 '왜 안 되는지' 를 조사할 수 있다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "새 화면이 늘어도 지켜지게", type: "build",
    goal: "다음 사람이 권한을 <b>몰라도 안전하게</b> 만드세요.\n권한 판정을 거치지 않은 조회를 찾아내는 검사를 만듭니다.",
    hint: "규약을 문서로 두면 지켜지지 않습니다. 자원을 가져오는 통로를 하나로 만들고 그 통로가 반드시 사용자를 요구하게 하면, 사용자를 안 넘긴 코드는 <b>동작 자체를 하지 않습니다.</b> 검사는 '어떤 통로가 권한 없이 불렸는가' 를 세면 됩니다.",
    acc: "사용자를 넘기지 않은 조회가 오류로 잡히고, 검사가 그 자리를 이름으로 지목하는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst ORDERS = [{ id: 1, owner: \"u1\" }, { id: 2, owner: \"u2\" }];\nconst audit = [];\n\n/* 자원을 가져오는 유일한 통로. 사용자가 없으면 아예 동작하지 않는다. */\nfunction repoFind(where, user, id) {\n  if (!user || !user.id) {\n    audit.push({ where: where, ok: false, why: \"사용자 없이 호출\" });\n    throw new Error(where + \": 사용자 없이 자원을 가져올 수 없다\");\n  }\n  const o = ORDERS.filter((x) => x.id === id && x.owner === user.id)[0] || null;\n  audit.push({ where: where, ok: true, why: o ? \"소유자 확인됨\" : \"없거나 남의 것\" });\n  return o;\n}\n\nconst u1 = { id: \"u1\" };\n\n/* 제대로 만든 화면 */\nfunction detailScreen() { return repoFind(\"detail\", u1, 1); }\n/* 권한을 잊은 새 화면 — 사용자를 안 넘겼다 */\nfunction receiptScreen() { return repoFind(\"receipt\", null, 2); }\n\nout.push(\"상세 화면: \" + (detailScreen() ? \"주문 1 반환\" : \"없음\"));\ntry { receiptScreen(); out.push(\"영수증 화면: 통과해 버렸다\"); }\ncatch (e) { out.push(\"영수증 화면: \" + e.message); }\n\nout.push(\"\");\nout.push(\"감사 기록\");\naudit.forEach((a) => out.push(\"  \" + a.where.padEnd(9) + (a.ok ? \"통과\" : \"차단\") + \"  \" + a.why));\n\nconst bad = audit.filter((a) => !a.ok);\nout.push(\"\");\nout.push(\"권한 없이 부른 자리: \" + (bad.length ? bad.map((a) => a.where).join(\", \") : \"없음\"));\nout.push(\"통로를 하나로 두면 잊은 자리가 이름으로 드러난다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "이미 열린 것은 어떻게 할 것인가", type: "decide",
    goal: "로그를 보니 12건이 실제로 조회됐습니다. 고치는 것과 별개로 처리가 필요합니다.",
    sit: "무엇을 하시겠습니까?",
    opts: [
      { label: "범위를 로그로 확정하고, 영향받은 사람과 규제 요건에 맞춰 알린다",
        fx: { security: 3, communication: 3 },
        fb: "✅ <b>범위를 아는 것이 먼저</b>이고, 그 근거는 로그뿐입니다. 누구의 무엇이 언제 몇 건 열렸는지를 확정한 뒤, 개인정보 유출에 해당하면 정해진 기한 안에 알려야 합니다. 늦게 알리는 것이 유출 자체보다 큰 문제가 되는 경우가 많습니다.",
        best: true },
      { label: "먼저 고치고, 범위 파악은 그 다음에 한다",
        fx: { security: 1 },
        fb: "△ 고치는 것이 급한 것은 맞습니다. 다만 <b>고치면서 로그가 지워지거나 덮이면</b> 범위를 영영 알 수 없게 되므로, 로그를 먼저 확보해 두고 고쳐야 합니다." },
      { label: "조용히 고치고 지켜본다",
        fx: { security: -3, communication: -3 },
        fb: "⚠️ 알릴 의무가 있는 사안이라면 <b>숨긴 것 자체가 별개의 위반</b>입니다. 나중에 드러났을 때 잃는 신뢰가 훨씬 큽니다." },
      { label: "전체 사용자에게 비밀번호를 재설정하게 한다",
        fx: { security: -1, communication: -1 },
        fb: "⚠️ 이번 사안과 관계가 없습니다. 열린 것은 주문 정보이지 자격 증명이 아니므로, <b>영향받지 않은 사람까지 불안하게</b> 하고 진짜 대응은 늦어집니다." }] },

  { t: "회고 — 왜 세 곳에서 빠졌나", type: "note",
    goal: "빠진 이유를 <b>사람이 아니라 구조에서</b> 찾으세요.\n어떤 구조였기에 잊을 수 있었는지, 지금 구조에서는 왜 잊을 수 없는지 적습니다.",
    ph: "빠진 화면 3곳 / 왜 잊을 수 있었나(구조의 이유) / 지금은 왜 잊을 수 없나 / 로그로 확정한 범위 / 알린 대상과 시점 / 남아 있는 비슷한 자리" }]
}

]};
