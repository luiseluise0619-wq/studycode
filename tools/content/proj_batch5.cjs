/* 두 번째 프로젝트 묶음 5 — 시스템 언어와 저수준 쪽의 깊이.
   메모리를 손으로 다루는 일, 소유권이 막아 주는 것, 동시성의 대가,
   빌드가 느려지는 이유, 그리고 작은 기계에서 전력을 아끼는 일. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── c */
{
  lv: 4, em: "🧱",
  title: "메모리를 손으로 관리한다",
  desc: "누수·이중 해제·경계 넘기가 어디서 나는지 규칙으로 좁히고, 소유권을 문서가 아니라 코드로 드러내 사고를 구조적으로 막는다",
  skills: ["c", "debugging", "performance"],
  phases: [

  { t: "누가 해제하는지 적는다", type: "note",
    goal: "동적으로 잡는 자리마다 <b>누가 해제하는지</b>를 적으세요.\n적을 수 없는 자리가 있으면 그곳이 바로 새는 자리입니다.",
    ph: "예: parse_config() 가 반환한 포인터 — 호출자가 free · buffer_new() — 짝인 buffer_free 가 있음 · handle_request 안의 tmp — 오류 경로에서 안 지움(누수) · 리스트 노드 — 누가 지우는지 아무도 모름" },

  { t: "소유권을 어떻게 드러낼 것인가", type: "decide",
    goal: "함수가 포인터를 돌려주는데, 호출자가 해제해야 하는지 아닌지 이름만 봐서는 모릅니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "이름과 짝으로 규약을 드러낸다 — 만드는 함수에는 반드시 짝이 되는 해제 함수를 둔다",
        fx: { coding: 3, debugging: 2 },
        fb: "✅ <b>C 에는 소유권을 강제하는 장치가 없으므로 규약이 유일한 방어입니다.</b> `xxx_new` 에는 `xxx_free` 를 두고, 빌려주기만 하는 함수는 `xxx_get` 처럼 다른 이름을 씁니다. 이름만 보고 판단할 수 있으면 리뷰에서 잡히고, 헤더 주석에 한 줄 적어 두면 도구도 도울 수 있습니다.",
        best: true },
      { label: "헤더 주석에 자세히 적는다",
        fx: { coding: 1 },
        fb: "△ 필요하지만 <b>주석은 컴파일되지 않습니다.</b> 코드가 바뀌어도 주석은 그대로 남아, 몇 년 뒤에는 틀린 설명이 되어 있습니다. 이름 규약과 함께 써야 뜻이 있습니다." },
      { label: "전부 호출자가 해제하는 것으로 통일한다",
        fx: { coding: 1 },
        fb: "△ 일관성은 좋습니다. 다만 <b>내부 구조를 가리키는 포인터</b>를 돌려주는 함수는 그럴 수 없어서, 예외가 생기는 순간 규칙이 무너집니다." },
      { label: "가비지 컬렉터 라이브러리를 쓴다",
        fx: { performance: -2, coding: -1 },
        fb: "⚠️ 성능과 예측 가능성을 잃습니다. C 를 고른 이유가 대개 그 둘이라, <b>고른 이유를 버리는 선택</b>이 됩니다." }] },

  { t: "새는 자리를 센다", type: "build",
    goal: "잡은 것과 푼 것을 세어 <b>어느 경로에서 새는지</b> 찾는 계산을 만드세요.\n정상 경로와 오류 경로를 나눠서 봅니다.",
    hint: "누수는 대개 <b>오류 경로</b>에서 납니다. 정상 흐름은 눈에 잘 띄어 테스트도 되지만, 중간에 실패해서 일찍 돌아가는 길은 잊히기 쉽습니다. 잡은 것과 푼 것을 경로별로 세면 어느 분기가 빠졌는지 정확히 나옵니다.",
    acc: "경로별 alloc/free 수와 남은 개수가 출력되고, 새는 경로가 이름으로 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 함수 하나의 실행 경로들 — 실제로는 코드를 읽어 뽑는다 */\nconst paths = [\n  { n: \"정상 처리\", steps: [\"alloc:buf\", \"alloc:hdr\", \"free:hdr\", \"free:buf\"] },\n  { n: \"헤더 파싱 실패\", steps: [\"alloc:buf\", \"alloc:hdr\", \"return\"] },\n  { n: \"입력이 너무 큼\", steps: [\"alloc:buf\", \"return\"] },\n  { n: \"본문 없음\", steps: [\"alloc:buf\", \"alloc:hdr\", \"free:hdr\", \"free:buf\", \"return\"] }\n];\n\nout.push(\"경로              잡음  품  남음   판정\");\nconst leaky = [];\npaths.forEach((p) => {\n  const live = new Set();\n  p.steps.forEach((s) => {\n    const [op, name] = s.split(\":\");\n    if (op === \"alloc\") live.add(name);\n    if (op === \"free\") live.delete(name);\n  });\n  const a = p.steps.filter((s) => s.indexOf(\"alloc\") === 0).length;\n  const f = p.steps.filter((s) => s.indexOf(\"free\") === 0).length;\n  if (live.size) leaky.push({ n: p.n, what: [...live] });\n  out.push(p.n.padEnd(18) + String(a).padEnd(6) + String(f).padEnd(4) +\n    String(live.size).padEnd(7) + (live.size ? \"샘: \" + [...live].join(\",\") : \"괜찮음\"));\n});\n\nout.push(\"\");\nout.push(\"새는 경로 \" + leaky.length + \"개: \" + leaky.map((x) => x.n).join(\", \"));\nout.push(\"둘 다 오류 경로다 — 정상 흐름은 테스트되지만 일찍 돌아가는 길은 잊힌다\");\nout.push(\"\");\nout.push(\"C 의 관용구: 실패하면 goto 로 한 자리에 모아 역순으로 푼다\");\nout.push(\"  cleanup_hdr: free(hdr);\");\nout.push(\"  cleanup_buf: free(buf);\");\nout.push(\"  return err;\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "경계를 넘는 자리를 잡는다", type: "build",
    goal: "버퍼에 쓰는 코드가 <b>경계를 넘는지</b> 판정하는 계산을 만드세요.\n널 종료 문자 자리를 빼먹는 흔한 실수도 함께 봅니다.",
    hint: "문자열을 담으려면 <b>길이 + 1</b> 바이트가 필요합니다. 널 종료 자리를 빼먹는 것이 C 에서 가장 흔한 한 칸 차이 실수입니다. 복사 함수마다 이 규칙이 달라서, 어떤 것은 널을 붙이고 어떤 것은 자리가 모자라면 안 붙입니다. '몇 바이트 쓰는가' 와 '몇 바이트 필요한가' 를 따로 세면 판정이 분명해집니다.",
    acc: "경우별로 필요한 크기와 버퍼 크기, 넘치는지 여부가 출력되고, 널 종료가 빠지는 경우가 따로 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 마지막 열은 '문자열로 쓸 것인가' — memcpy 로 옮긴 바이트는\n   문자열이 아니라면 널 종료가 없어도 된다. 쓰임을 알아야 판정할 수 있다. */\nconst cases = [\n  { n: \"strcpy\", buf: 8, src: \"hello\", writes: (s) => s.length + 1, nulls: true, asStr: true },\n  { n: \"strcpy\", buf: 5, src: \"hello\", writes: (s) => s.length + 1, nulls: true, asStr: true },\n  { n: \"strncpy(n=8)\", buf: 8, src: \"hello world\", writes: () => 8, nulls: false, asStr: true },\n  { n: \"snprintf(n=8)\", buf: 8, src: \"hello world\", writes: () => 8, nulls: true, asStr: true },\n  { n: \"memcpy(len) → 문자열로\", buf: 5, src: \"hello\", writes: (s) => s.length, nulls: false, asStr: true },\n  { n: \"memcpy(len) → 바이트로\", buf: 5, src: \"hello\", writes: (s) => s.length, nulls: false, asStr: false }\n];\n\nout.push(\"함수                     버퍼  원본  쓰는 양  판정\");\ncases.forEach((c) => {\n  const w = c.writes(c.src);\n  let verdict;\n  if (w > c.buf) verdict = \"넘침 (\" + (w - c.buf) + \"바이트)\";\n  else if (c.asStr && !c.nulls && w === c.buf) verdict = \"널 종료 없음 — 다음 읽기가 버퍼 밖으로 나간다\";\n  else verdict = \"안전\";\n  out.push(c.n.padEnd(25) + String(c.buf).padEnd(6) +\n    String(c.src.length).padEnd(6) + String(w).padEnd(9) + verdict);\n});\n\nout.push(\"\");\nout.push(\"문자열을 담으려면 길이 + 1 바이트가 필요하다 — 널 종료 자리\");\nout.push(\"strncpy 는 자리가 모자라면 널을 안 붙인다. 이름이 비슷해도 규칙이 다르다\");\nout.push(\"snprintf 는 언제나 널로 끝내고 잘라 낸다 — 그래서 대개 이쪽을 쓴다\");\nout.push(\"같은 memcpy 라도 그 바이트를 문자열로 읽을 것인가에 따라 판정이 갈린다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "해제 뒤에 쓰는 것을 막는다", type: "build",
    goal: "해제한 포인터를 다시 쓰거나 두 번 푸는 것을 <b>구조적으로</b> 막는 방법을 보이세요.\n푼 뒤 널로 두는 것과 안 두는 것을 견줍니다.",
    hint: "해제한 뒤 포인터를 <b>널로 두면</b> 이중 해제는 무해해지고(널을 푸는 것은 안전하다), 다시 쓰면 곧바로 터져서 <b>조용히 남의 메모리를 건드리는 것보다 낫습니다.</b> 조용히 도는 버그가 곧바로 죽는 버그보다 훨씬 비쌉니다. 매크로로 해제와 널 대입을 묶어 두면 잊을 수 없습니다.",
    acc: "널로 두는 경우와 안 두는 경우의 이중 해제·해제 후 사용 결과가 나란히 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 아주 단순한 힙 흉내 — 주소마다 살아 있는지만 본다 */\nfunction heap() {\n  const live = new Map();\n  let next = 100;\n  return {\n    alloc(v) { const p = next++; live.set(p, v); return p; },\n    free(p) {\n      if (p === null) return \"NULL 해제 — 무해\";\n      if (!live.has(p)) return \"이중 해제 — 힙이 깨진다\";\n      live.set(p, \"<해제됨>\");\n      live.delete(p);\n      return \"해제\";\n    },\n    read(p) {\n      if (p === null) return \"NULL 역참조 — 곧바로 죽는다\";\n      if (!live.has(p)) return \"해제 후 사용 — 조용히 남의 메모리를 읽는다\";\n      return \"읽음: \" + live.get(p);\n    }\n  };\n}\n\n[false, true].forEach((setNull) => {\n  const h = heap();\n  let p = h.alloc(\"data\");\n  const log = [];\n  log.push(h.free(p));\n  if (setNull) p = null;\n  log.push(h.free(p));        // 두 번째 해제\n  log.push(h.read(p));        // 해제 뒤 읽기\n  out.push((setNull ? \"free 뒤 NULL 대입\" : \"그냥 free\").padEnd(20) + log.join(\"  |  \"));\n});\n\nout.push(\"\");\nout.push(\"NULL 로 두면 이중 해제가 무해해지고, 다시 쓰면 곧바로 죽는다\");\nout.push(\"곧바로 죽는 버그가 조용히 도는 버그보다 훨씬 싸다\");\nout.push(\"\");\nout.push(\"매크로로 묶으면 잊을 수 없다:\");\nout.push(\"  #define FREE(p) do { free(p); (p) = NULL; } while (0)\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 규약을 어디에 새겼나", type: "note",
    goal: "소유권 규약을 <b>어디에 어떻게</b> 새겼는지 적으세요.\n주석 말고, 이름·타입·매크로처럼 실수하면 드러나는 자리를 골랐는지 봅니다.",
    ph: "이름 규약(예: _new/_free 짝) / 빌려주는 함수의 표시 / 오류 경로 정리 방식 / 도구로 잡은 누수 수 / 아직 규약이 없는 자리 / 다음에 새면 무엇이 먼저 알려 주나" }]
},

/* ─────────────────────────────────────────────── rust */
{
  lv: 4, em: "🦀",
  title: "컴파일러와 싸우지 않고 이긴다",
  desc: "빌림 검사기에 막힐 때마다 우회하는 대신 그것이 가리키는 설계 문제를 읽고, 소유권 구조를 바꿔 코드를 단순하게 만든다",
  skills: ["rust", "code", "system_design"],
  phases: [

  { t: "막힌 자리를 적는다", type: "note",
    goal: "컴파일러가 거절한 자리와 <b>그때 하려던 일</b>을 적으세요.\n오류 메시지가 아니라 '무엇을 하려 했는가' 를 적는 것이 중요합니다.",
    ph: "예: 목록을 순회하면서 그 안의 항목을 지우려 했다 · 두 곳에서 같은 설정을 고치려 했다 · 콜백에 self 를 넘기려 했다 · 반환한 참조가 지역 변수를 가리켰다 · 각각 clone 이나 unsafe 로 넘겼다" },

  { t: "막혔을 때 무엇을 먼저 생각할 것인가", type: "decide",
    goal: "빌림 검사기가 거절합니다. `clone()` 을 붙이면 통과합니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "거절이 가리키는 것을 먼저 읽는다 — 같은 데이터를 두 곳에서 고치려 한 것은 아닌지",
        fx: { coding: 3, system_design: 2 },
        fb: "✅ <b>빌림 검사기의 거절은 대개 설계에 대한 지적입니다.</b> '두 곳에서 동시에 고치려 한다', '수명이 다른 것을 이어 붙였다' 같은 것이고, 다른 언어에서는 이런 코드가 통과했다가 나중에 경합이나 해제 후 사용으로 나타납니다. 구조를 바꾸면 대개 코드가 더 단순해집니다.",
        best: true },
      { label: "clone 을 붙이고 넘어간다",
        fx: { performance: -1, coding: -1 },
        fb: "△ 때로는 맞는 답입니다 — 작은 데이터라면 복사 비용보다 코드가 단순해지는 것이 낫습니다. 다만 <b>습관이 되면</b> 성능을 잃고, 두 벌이 생겨 어느 쪽이 진짜인지 헷갈립니다." },
      { label: "Rc<RefCell<T>> 로 감싼다",
        fx: { coding: -1 },
        fb: "⚠️ 컴파일은 되지만 <b>검사를 컴파일 시점에서 실행 시점으로 미룬 것</b>뿐입니다. 규칙을 어기면 이제 실행 중에 패닉이 나고, 그것은 컴파일 오류보다 훨씬 나쁩니다." },
      { label: "unsafe 로 우회한다",
        fx: { coding: -3, security: -2 },
        fb: "⚠️ 컴파일러가 막아 준 것을 손으로 뚫는 것입니다. unsafe 는 <b>컴파일러가 확인할 수 없지만 사람이 증명할 수 있을 때</b> 쓰는 것이지, 이해하지 못했을 때 쓰는 것이 아닙니다." }] },

  { t: "빌림 규칙을 판정한다", type: "build",
    goal: "코드의 빌림 상황을 받아 <b>규칙을 어기는지</b> 판정하는 계산을 만드세요.\n어긴다면 어떤 규칙인지 이름으로 알려 줍니다.",
    hint: "규칙은 둘뿐입니다 — 같은 시점에 <b>불변 빌림은 여럿</b> 가능하지만, <b>가변 빌림은 하나뿐</b>이고 그때 다른 빌림이 있으면 안 됩니다. 그리고 빌림은 원본보다 오래 살 수 없습니다. 이 셋만 판정하면 대부분의 거절이 설명됩니다.",
    acc: "상황별로 허용·거절이 나오고 거절 이유가 규칙 이름으로 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 빌림 상황: 같은 값에 대해 겹치는 구간의 빌림들 */\nconst cases = [\n  { n: \"읽기 둘\", borrows: [\"shared\", \"shared\"], outlives: false },\n  { n: \"읽기와 쓰기\", borrows: [\"shared\", \"mut\"], outlives: false },\n  { n: \"쓰기 둘\", borrows: [\"mut\", \"mut\"], outlives: false },\n  { n: \"쓰기 하나\", borrows: [\"mut\"], outlives: false },\n  { n: \"지역 변수를 가리켜 반환\", borrows: [\"shared\"], outlives: true },\n  { n: \"읽기 셋\", borrows: [\"shared\", \"shared\", \"shared\"], outlives: false }\n];\n\nfunction judge(c) {\n  if (c.outlives) return [false, \"수명: 빌림이 원본보다 오래 산다\"];\n  const muts = c.borrows.filter((b) => b === \"mut\").length;\n  if (muts > 1) return [false, \"가변 빌림은 한 번에 하나뿐\"];\n  if (muts === 1 && c.borrows.length > 1) return [false, \"가변 빌림이 있으면 다른 빌림은 안 된다\"];\n  return [true, \"불변 빌림은 여럿 가능\"];\n}\n\nout.push(\"상황                        판정   이유\");\ncases.forEach((c) => {\n  const [ok, why] = judge(c);\n  out.push(c.n.padEnd(28) + (ok ? \"허용\" : \"거절\").padEnd(7) + why);\n});\n\nout.push(\"\");\nout.push(\"규칙은 셋뿐이다 — 읽기는 여럿, 쓰기는 하나, 빌림은 원본보다 오래 못 산다\");\nout.push(\"이 규칙이 데이터 경합을 컴파일 시점에 없앤다\");\nout.push(\"다른 언어에서는 통과했다가 나중에 경합으로 나타나는 코드들이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "구조를 바꿔 통과시킨다", type: "build",
    goal: "거절당한 상황을 <b>구조를 바꿔</b> 통과시키는 방법들을 견주세요.\n각 방법이 무엇을 얻고 무엇을 잃는지 함께 적습니다.",
    hint: "널리 쓰이는 길이 몇 가지 있습니다 — <b>순서를 나누기</b>(읽고 끝난 뒤 쓴다), <b>인덱스를 들고 다니기</b>(참조 대신 위치), <b>새 값을 만들어 돌려주기</b>(고치는 대신 반환), <b>소유권을 넘기기</b>. 대개 '고치기' 를 '만들어 돌려주기' 로 바꾸면 문제가 통째로 사라집니다.",
    acc: "방법별로 통과 여부·복사 비용·코드 복잡도가 표로 나오고, 상황에 맞는 추천이 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst ways = [\n  { n: \"순서를 나눈다\", pass: true, copy: 0, complexity: 1,\n    note: \"읽는 구간과 쓰는 구간을 겹치지 않게 한다\" },\n  { n: \"인덱스를 들고 다닌다\", pass: true, copy: 0, complexity: 2,\n    note: \"참조 대신 위치를 저장한다. 대신 유효성은 손으로 지켜야 한다\" },\n  { n: \"새 값을 만들어 반환\", pass: true, copy: 1, complexity: 1,\n    note: \"고치는 대신 만들어 돌려준다. 대개 코드가 더 단순해진다\" },\n  { n: \"소유권을 넘긴다\", pass: true, copy: 0, complexity: 2,\n    note: \"원본을 못 쓰게 된다. 넘긴 뒤에 필요하면 못 쓴다\" },\n  { n: \"clone 을 붙인다\", pass: true, copy: 2, complexity: 0,\n    note: \"가장 쉽다. 데이터가 크면 비싸고 두 벌이 생긴다\" },\n  { n: \"Rc<RefCell<T>>\", pass: true, copy: 0, complexity: 3,\n    note: \"검사가 실행 시점으로 옮겨간다 — 어기면 패닉\" },\n  { n: \"unsafe\", pass: true, copy: 0, complexity: 4,\n    note: \"컴파일러가 막아 준 것을 손으로 뚫는다\" }\n];\n\nout.push(\"방법                    복사  복잡도  설명\");\nways.forEach((w) => out.push(w.n.padEnd(24) + String(w.copy).padEnd(6) +\n  String(w.complexity).padEnd(8) + w.note));\n\n/* 데이터 크기와 '고친 뒤에도 원본이 필요한가' 로 고른다 */\nconst scenes = [\n  { n: \"작은 값 · 원본 필요\", big: false, needOrig: true },\n  { n: \"큰 값 · 원본 불필요\", big: true, needOrig: false },\n  { n: \"큰 값 · 원본 필요\", big: true, needOrig: true }\n];\nout.push(\"\");\nout.push(\"상황                    추천\");\nscenes.forEach((s) => {\n  let pick;\n  if (!s.big) pick = \"clone — 싸고 단순하다\";\n  else if (!s.needOrig) pick = \"소유권을 넘긴다 — 복사가 없다\";\n  else pick = \"순서를 나누거나 새 값을 만들어 반환\";\n  out.push(s.n.padEnd(24) + pick);\n});\n\nout.push(\"\");\nout.push(\"clone 이 나쁜 것이 아니라 '생각 없이 붙이는 clone' 이 나쁘다\");\nout.push(\"막힌 자리는 대개 설계를 다시 보라는 신호다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "오류를 어떻게 다룰 것인가", type: "decide",
    goal: "함수마다 `unwrap()` 이 흩어져 있어 실패하면 패닉으로 죽습니다.",
    sit: "어떻게 바꾸시겠습니까?",
    opts: [
      { label: "Result 로 위로 올리고, 최상단에서 한 번 결정한다",
        fx: { coding: 3, system_design: 2 },
        fb: "✅ <b>실패를 값으로 다루면 호출자가 무엇을 할지 정할 수 있습니다.</b> 라이브러리는 실패를 알려 주고, 어떻게 대응할지는 그것을 쓰는 쪽이 정합니다. `?` 로 올리면 코드도 짧아지고, 최상단에서 로그를 남길지 되돌릴지 한 번만 결정하면 됩니다.",
        best: true },
      { label: "expect 로 바꿔 메시지를 남긴다",
        fx: { coding: 1 },
        fb: "△ unwrap 보다는 낫습니다. 실패했을 때 왜 죽었는지는 알 수 있으니까요. 다만 <b>여전히 죽습니다</b> — 정말 일어날 수 없는 경우에만 쓸 것입니다." },
      { label: "패닉을 잡아서 계속 돌게 한다",
        fx: { coding: -2 },
        fb: "⚠️ 패닉은 <b>회복 불가능한 상태</b>를 뜻하도록 설계되었습니다. 잡아서 계속 돌면 깨진 상태로 도는 것이라, 그 뒤의 동작을 아무도 보장할 수 없습니다." },
      { label: "실패할 수 있는 곳마다 기본값을 돌려준다",
        fx: { coding: -2, debugging: -1 },
        fb: "⚠️ 조용히 틀린 값으로 계속 도는 것이 가장 나쁩니다. 설정 파일을 못 읽었는데 <b>기본 설정으로 도는 서버</b>는 죽는 것보다 위험할 수 있습니다." }] },

  { t: "회고 — 무엇을 배웠나", type: "note",
    goal: "컴파일러가 막았던 자리 중 <b>실제로 버그였을 것</b>을 골라 적으세요.\nclone 이나 unsafe 로 넘겼던 자리를 다시 보고 어떻게 바꿨는지도 적습니다.",
    ph: "막혔던 자리 목록 / 그중 진짜 버그였을 것 / clone 으로 넘겼다가 구조를 바꾼 자리 / 남아 있는 unsafe 와 그 근거 / unwrap 을 없앤 뒤 코드 길이 변화" }]
},

/* ─────────────────────────────────────────────── cpp */
{
  lv: 4, em: "⚙️",
  title: "빌드가 20분 걸린다",
  desc: "한 줄만 고쳐도 전부 다시 빌드되는 프로젝트의 의존 그래프를 재고, 헤더와 경계를 정리해 다시 빌드하는 범위를 줄인다",
  skills: ["cpp", "performance", "code"],
  phases: [

  { t: "무엇을 고치면 얼마나 걸리는지 적는다", type: "note",
    goal: "<b>파일별로</b> 한 줄 고쳤을 때의 빌드 시간을 재서 적으세요.\n평균이 아니라 '자주 고치는 파일' 의 시간이 중요합니다.",
    ph: "예: 전체 클린 빌드 21분 · common.h 한 줄 → 19분 · user_service.cpp 한 줄 → 40초 · 하루에 common.h 를 3~4번 건드림 · 파일 480개 · 헤더 하나가 300개 파일에 포함됨" },

  { t: "왜 전부 다시 빌드되는가", type: "decide",
    goal: "헤더 하나를 고치면 그것을 포함한 모든 파일이 다시 컴파일됩니다.",
    sit: "무엇이 문제입니까?",
    opts: [
      { label: "헤더에 구현이 들어 있어, 바뀔 이유가 많은 것이 널리 퍼져 있다",
        fx: { performance: 3, coding: 2 },
        fb: "✅ <b>포함 관계가 곧 다시 빌드하는 범위입니다.</b> 헤더에 인라인 구현·private 멤버·다른 헤더 포함이 들어 있으면, 그 무엇이 바뀌어도 포함한 파일 전부가 다시 컴파일됩니다. 헤더를 '무엇이 있는지' 만 적는 얇은 것으로 만들면 바뀔 이유 자체가 줄어듭니다.",
        best: true },
      { label: "빌드 도구가 변경을 잘 감지하지 못해서",
        fx: { performance: -1 },
        fb: "⚠️ 도구는 정확히 일하고 있습니다 — 헤더가 바뀌었으니 <b>포함한 것을 다시 빌드하는 것이 옳습니다.</b> 문제는 포함한 것이 300개라는 사실입니다." },
      { label: "컴파일러가 느려서",
        fx: { performance: -1 },
        fb: "⚠️ 한 파일당 시간을 줄이는 것도 방법이지만, <b>480개를 300개 빌드하는 구조</b>를 그대로 두면 한계가 있습니다. 구조를 먼저 봅니다." },
      { label: "기계가 느려서",
        fx: { performance: -2 },
        fb: "⚠️ 코어를 두 배로 늘려도 절반입니다. 다시 빌드하는 파일 수를 <b>10분의 1로</b> 줄이는 것이 훨씬 큽니다." }] },

  { t: "포함 관계를 센다", type: "build",
    goal: "헤더별로 <b>몇 개의 파일이 영향을 받는지</b> 세고, 고치는 빈도와 곱해 실제 비용을 구하세요.",
    hint: "직접 포함만 세면 안 됩니다 — 헤더가 다른 헤더를 포함하면 <b>간접적으로도 전파</b>되므로, 그 전이 관계까지 따라가야 실제 범위가 나옵니다. 그리고 '영향받는 파일 수' 만으로는 부족합니다. 거의 안 고치는 헤더가 300개에 퍼져 있는 것보다 <b>매일 고치는 헤더가 50개에 퍼져 있는 것</b>이 더 비쌉니다.",
    acc: "헤더별 전이적 영향 범위와 고치는 빈도를 곱한 비용이 순위로 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst MS_PER_FILE = 2600;\n\n/* 480개짜리 프로젝트를 흉내 낸다 — 계층마다 몇 개가 그 헤더를 포함하는지 */\nconst headers = [\n  { n: \"common.h\", depth: 0, edits: 4 },\n  { n: \"types.h\", depth: 0, edits: 0.2 },\n  { n: \"db.h\", depth: 1, edits: 1 },\n  { n: \"http.h\", depth: 1, edits: 0.5 },\n  { n: \"user_service.h\", depth: 2, edits: 2 },\n  { n: \"report_util.h\", depth: 3, edits: 3 }\n];\nconst SOURCES = 480;\n/* 아래쪽(깊이 0)일수록 널리 퍼져 있다 */\nconst spread = [300, 260, 140, 90, 25, 6];\n\nconst rows = headers.map((h, i) => {\n  const n = spread[i];\n  const per = n * MS_PER_FILE / 1000;\n  return { h: h.n, n: n, per: per, edits: h.edits, daily: h.edits * per };\n}).sort((a, b) => b.daily - a.daily);\n\nout.push(\"전체 \" + SOURCES + \"개 · 한 파일 컴파일 \" + (MS_PER_FILE / 1000) + \"초\");\nout.push(\"\");\nout.push(\"헤더              영향 파일  한 번 빌드  하루 편집  하루 대기\");\nrows.forEach((r) => out.push(r.h.padEnd(18) + String(r.n).padEnd(11) +\n  ((r.per / 60).toFixed(1) + \"분\").padEnd(12) + String(r.edits).padEnd(11) +\n  (r.daily / 60).toFixed(1) + \"분\"));\n\nconst totalDaily = rows.reduce((s, r) => s + r.daily, 0);\nout.push(\"\");\nout.push(\"하루 총 빌드 대기 \" + (totalDaily / 60).toFixed(0) + \"분\");\nout.push(\"가장 비싼 헤더: \" + rows[0].h + \" (하루 \" + (rows[0].daily / 60).toFixed(0) + \"분, 전체의 \" +\n  Math.round(rows[0].daily / totalDaily * 100) + \"%)\");\n\nconst byWidth = rows.slice().sort((a, b) => b.n - a.n);\nout.push(\"\");\nout.push(\"영향 범위 순위\");\nbyWidth.slice(0, 3).forEach((r, i) => out.push(\"  \" + (i + 1) + \". \" + r.h.padEnd(18) +\n  r.n + \"개  하루 대기 \" + (r.daily / 60).toFixed(1) + \"분\"));\nconst trap = byWidth.filter((r) => r.daily / 60 < 5)[0];\nout.push(\"\");\nout.push(\"범위만 보면 \" + trap.h + \" 도 커 보인다 — \" + trap.n + \"개에 퍼져 있다\");\nout.push(\"그런데 하루 대기는 \" + (trap.daily / 60).toFixed(1) + \"분뿐이다. 거의 안 고치기 때문이다\");\nout.push(\"영향 범위 × 고치는 빈도 를 봐야 어디에 손댈지 정해진다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "헤더를 얇게 만든다", type: "build",
    goal: "헤더에서 <b>덜어 낼 수 있는 것</b>을 찾아 다시 빌드 범위가 얼마나 줄어드는지 계산하세요.",
    hint: "덜어 내는 방법이 몇 가지 있습니다 — 포인터나 참조로만 쓰는 타입은 <b>전방 선언</b>으로 충분해서 헤더를 포함할 필요가 없고, 구현을 별도 클래스로 숨기면 private 멤버가 바뀌어도 헤더가 안 바뀝니다. 각각 얼마나 줄이는지 계산하면 어디에 손댈지 정해집니다.",
    acc: "조치별로 줄어드는 영향 파일 수와 하루 절감 시간이 나오고, 가장 효과 큰 것이 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst MS = 2600, EDITS = 4;\nconst before = { affected: 300, headerReasons: [\"인라인 구현\", \"private 멤버\", \"다른 헤더 포함 5개\", \"공개 API\"] };\n\nconst fixes = [\n  { n: \"전방 선언으로 바꾸기\", cut: 90, effort: 1,\n    why: \"포인터·참조로만 쓰는 타입은 정의가 필요 없다\" },\n  { n: \"구현을 숨기기(pImpl)\", cut: 120, effort: 3,\n    why: \"private 멤버가 바뀌어도 헤더가 안 바뀐다\" },\n  { n: \"인라인 구현을 .cpp 로\", cut: 60, effort: 2,\n    why: \"구현이 바뀔 이유가 헤더에서 사라진다\" },\n  { n: \"헤더를 역할별로 쪼개기\", cut: 40, effort: 2,\n    why: \"필요한 것만 포함하게 된다\" }\n];\n\nout.push(\"조치                    줄어드는 파일  하루 절감   품\");\nlet cur = before.affected;\nfixes.forEach((f) => {\n  const save = f.cut * MS * EDITS / 1000;\n  out.push(f.n.padEnd(24) + String(f.cut).padEnd(15) +\n    ((save / 60).toFixed(1) + \"분\").padEnd(12) + f.effort);\n});\n\nout.push(\"\");\nout.push(\"조치                    누적 영향 파일  한 번 빌드\");\nfixes.slice().sort((a, b) => (b.cut / b.effort) - (a.cut / a.effort)).forEach((f) => {\n  cur = Math.max(cur - f.cut, 10);\n  out.push(f.n.padEnd(24) + String(cur).padEnd(16) + (cur * MS / 1000).toFixed(0) + \"초\");\n});\n\nout.push(\"\");\nout.push(\"처음 \" + (before.affected * MS / 1000 / 60).toFixed(1) + \"분 → \" +\n  (cur * MS / 1000 / 60).toFixed(1) + \"분\");\nout.push(\"품 대비 효과가 큰 것부터 했다 — 전부 할 필요는 없다\");\nout.push(\"\");\nout.push(\"헤더는 '무엇이 있는지' 만 적는 얇은 것이어야 한다\");\nout.push(\"구현이 헤더에 있으면 구현이 바뀔 때마다 세상이 다시 빌드된다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "무엇을 더 할 것인가", type: "decide",
    goal: "헤더를 정리해 빌드가 21분에서 6분이 됐습니다. 더 줄이고 싶습니다.",
    sit: "다음으로 무엇을 하시겠습니까?",
    opts: [
      { label: "빌드 결과를 캐시해 같은 입력이면 다시 컴파일하지 않게 한다",
        fx: { performance: 3, system_design: 1 },
        fb: "✅ <b>같은 것을 두 번 컴파일하지 않는 것</b>이 가장 큰 남은 이득입니다. 브랜치를 오갈 때, CI 에서, 팀원끼리 같은 결과를 나눠 쓰면 대부분의 빌드가 캐시 적중이 됩니다. 구조를 바꾸지 않아도 되고 되돌리기도 쉽습니다.",
        best: true },
      { label: "여러 .cpp 를 하나로 묶어 한꺼번에 컴파일한다",
        fx: { performance: 2, coding: -1 },
        fb: "△ 전체 빌드는 크게 빨라집니다. 다만 <b>한 줄만 고쳐도 묶인 것 전부가</b> 다시 빌드되어, 개발 중의 반복 빌드는 오히려 느려집니다. 릴리스 빌드에만 쓰는 경우가 많습니다." },
      { label: "미리 컴파일된 헤더를 쓴다",
        fx: { performance: 2 },
        fb: "△ 표준 라이브러리처럼 <b>거의 안 바뀌는 것</b>에는 효과가 큽니다. 다만 그 안에 자주 바뀌는 것을 넣으면 매번 다시 만들어져 오히려 손해입니다." },
      { label: "모듈로 전환한다",
        fx: { performance: 1, coding: -1 },
        fb: "△ 근본적인 해결이고 방향은 맞습니다. 다만 도구 지원과 의존 라이브러리 상황을 봐야 하고, <b>전환 비용이 큽니다.</b> 지금 단계에서 꺼낼 카드는 아닙니다." }] },

  { t: "회고 — 무엇이 진짜 비쌌나", type: "note",
    goal: "빌드 시간을 <b>자주 하는 것 기준</b>으로 다시 재세요.\n전체 빌드가 아니라 '한 줄 고치고 다시 빌드' 가 하루 몇 번이고 얼마나 걸리는지가 진짜 비용입니다.",
    ph: "가장 자주 고치는 파일 3개와 각각의 다시 빌드 시간 / 하루 빌드 횟수 / 하루 총 대기 시간(전 vs 후) / 남은 병목 / 다음에 할 것" }]
},

/* ─────────────────────────────────────────────── go 두 번째는 이미 있으므로 java */
{
  lv: 4, em: "🔒",
  title: "가끔 두 번 처리된다",
  desc: "재현되지 않는 동시성 버그를 경합 구간으로 좁히고, 잠금·원자 연산·불변 객체 중 무엇으로 막을지 비용과 함께 정한다",
  skills: ["java", "debugging", "system_design"],
  phases: [

  { t: "재현 조건을 좁힌다", type: "note",
    goal: "'가끔' 을 <b>어떤 조건에서</b> 로 바꾸세요.\n부하·스레드 수·타이밍 중 무엇과 상관있는지 적습니다.",
    ph: "예: 초당 200건 이상에서만 · 스레드 8개일 때 하루 3건, 2개면 0건 · 같은 사용자가 빠르게 두 번 누를 때 · 로컬에서는 재현 안 됨 · 로그에는 둘 다 '성공' 으로 남음" },

  { t: "어디를 의심할 것인가", type: "decide",
    goal: "여러 스레드가 같은 코드를 도는데 가끔 결과가 어긋납니다.",
    sit: "무엇을 먼저 보시겠습니까?",
    opts: [
      { label: "여러 스레드가 함께 건드리는 상태를 찾고, 읽고-고치고-쓰는 구간을 짚는다",
        fx: { debugging: 3, system_design: 2 },
        fb: "✅ <b>경합은 공유 상태에서만 납니다.</b> 스레드마다 따로 가진 것은 아무리 동시에 돌아도 안전하므로, 공유되는 것만 목록으로 뽑으면 후보가 몇 개로 줄어듭니다. 그중 '읽고 계산해서 다시 쓰는' 구간이 거의 언제나 범인입니다.",
        best: true },
      { label: "로그를 더 자세히 남긴다",
        fx: { debugging: 1 },
        fb: "△ 도움이 되지만 두 가지 함정이 있습니다. 로그를 넣으면 <b>타이밍이 바뀌어 재현이 더 어려워지고</b>, 로그 자체가 동기화되어 경합을 감춥니다." },
      { label: "전체에 잠금을 걸어 본다",
        fx: { performance: -2 },
        fb: "⚠️ 증상은 사라집니다. 다만 <b>어디가 문제였는지 모른 채</b> 성능을 크게 잃고, 나중에 잠금을 좁히려 할 때 다시 처음부터 찾아야 합니다." },
      { label: "재현 테스트를 먼저 만든다",
        fx: { debugging: 2, coding: 1 },
        fb: "△ 아주 좋은 일이고 결국 해야 합니다. 다만 <b>어디를 노려야 하는지 알아야</b> 재현 테스트를 만들 수 있어서, 공유 상태를 먼저 좁히는 것이 순서입니다." }] },

  { t: "경합을 재현한다", type: "build",
    goal: "읽고-고치고-쓰는 구간이 <b>엇갈리면</b> 어떤 결과가 나오는지 보이세요.\n스레드 수를 늘렸을 때 어긋나는 빈도가 어떻게 변하는지도 봅니다.",
    hint: "완전히 동시일 필요가 없습니다. 한 스레드가 읽은 뒤 쓰기 전에 다른 스레드가 읽으면 그것으로 충분합니다. 이 <b>겹치는 창</b>이 넓을수록 자주 나고, 스레드가 많을수록 겹칠 확률이 커집니다. 그래서 로컬(스레드 적음)에서는 재현이 안 됩니다.",
    acc: "스레드 수별로 어긋난 횟수가 나오고, 원자 연산으로 바꿨을 때 0이 되는 것이 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nlet seed = 987654321;\nfunction rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }\n\n/* 스레드가 '읽고 → (잠깐 딴짓) → 쓰기' 를 한다. 그 사이에 남이 끼어들 수 있다. */\nfunction simulate(threads, atomic, rounds) {\n  let counter = 0, lost = 0;\n  for (let r = 0; r < rounds; r++) {\n    if (atomic) { counter += threads; continue; }   // 한 동작이면 끼어들 수 없다\n    const seen = counter;\n    let wrote = 0;\n    for (let t = 0; t < threads; t++) {\n      /* 겹칠 확률은 스레드가 많을수록 커진다 */\n      const overlaps = rnd() < 1 - 1 / threads;\n      if (overlaps) { counter = seen + 1; }         // 같은 값을 읽고 덮어쓴다\n      else { counter = counter + 1; wrote++; }\n    }\n    lost += threads - Math.max(wrote, 1);\n  }\n  return { counter: counter, want: threads * rounds, lost: lost };\n}\n\nout.push(\"스레드   기대값    실제값    잃은 갱신\");\n[1, 2, 8, 32].forEach((t) => {\n  const r = simulate(t, false, 2000);\n  out.push(String(t).padEnd(9) + String(r.want).padEnd(10) +\n    String(r.counter).padEnd(10) + r.lost);\n});\n\nout.push(\"\");\nout.push(\"원자 연산으로 바꾸면\");\n[8, 32].forEach((t) => {\n  const r = simulate(t, true, 2000);\n  out.push(\"  스레드 \" + String(t).padEnd(5) + \"기대 \" + r.want +\n    \"  실제 \" + r.counter + \"  \" + (r.counter === r.want ? \"일치\" : \"어긋남\"));\n});\n\nout.push(\"\");\nout.push(\"스레드가 적으면 겹칠 확률이 낮아 재현되지 않는다 — 로컬에서 안 나는 이유다\");\nout.push(\"읽기와 쓰기 사이가 비어 있는 한 확률의 문제일 뿐 언젠가 난다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "무엇으로 막을지 견준다", type: "build",
    goal: "잠금·원자 연산·불변 객체·스레드 국소 저장을 <b>비용과 적용 범위</b>로 견주세요.",
    hint: "각각 잘하는 일이 다릅니다 — 숫자 하나를 세는 데는 <b>원자 연산</b>이 가장 싸고, 여러 값을 함께 바꿔야 하면 <b>잠금</b>이 필요하며, 아예 안 바뀌게 만들면(<b>불변</b>) 동기화 자체가 필요 없습니다. 스레드마다 자기 것을 갖게 하는 방법도 공유를 없애는 좋은 길입니다.",
    acc: "방법별로 적용 가능한 상황·상대 비용·주의점이 표로 나오고, 주어진 상황에 맞는 추천이 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst ways = [\n  { n: \"원자 연산\", cost: 1, multi: false, note: \"값 하나에만. 여러 값을 함께는 못 한다\" },\n  { n: \"잠금(synchronized)\", cost: 8, multi: true, note: \"여러 값을 함께. 경합하면 느려지고 교착 위험\" },\n  { n: \"불변 객체\", cost: 2, multi: true, note: \"안 바뀌면 동기화가 필요 없다. 매번 새로 만든다\" },\n  { n: \"스레드 국소 저장\", cost: 1, multi: true, note: \"공유 자체를 없앤다. 합쳐야 할 때 따로 처리\" },\n  { n: \"큐로 한 줄로 처리\", cost: 4, multi: true, note: \"순서까지 보장. 처리량이 한 줄로 묶인다\" }\n];\n\nout.push(\"방법                 비용  여러 값  주의점\");\nways.forEach((w) => out.push(w.n.padEnd(21) + String(w.cost).padEnd(6) +\n  (w.multi ? \"가능    \" : \"불가    \") + w.note));\n\nconst scenes = [\n  { n: \"요청 수 세기\", fields: 1, mutate: true, shared: true },\n  { n: \"주문 상태 전이\", fields: 3, mutate: true, shared: true },\n  { n: \"설정 읽기\", fields: 5, mutate: false, shared: true },\n  { n: \"요청별 임시 버퍼\", fields: 1, mutate: true, shared: false }\n];\n\nout.push(\"\");\nout.push(\"상황                 추천\");\nscenes.forEach((s) => {\n  let pick;\n  if (!s.shared) pick = \"스레드 국소 저장 — 애초에 공유가 아니다\";\n  else if (!s.mutate) pick = \"불변 객체 — 안 바뀌면 동기화가 필요 없다\";\n  else if (s.fields === 1) pick = \"원자 연산 — 가장 싸다\";\n  else pick = \"잠금 — 여러 값을 함께 바꿔야 한다\";\n  out.push(s.n.padEnd(21) + pick);\n});\n\nout.push(\"\");\nout.push(\"가장 좋은 동기화는 동기화하지 않는 것이다 — 공유를 없애거나 안 바뀌게 한다\");\nout.push(\"잠금은 마지막이 아니라 '여러 값을 함께 바꿔야 할 때' 의 도구다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "재현되게 만든다", type: "build",
    goal: "경합을 <b>일부러 잘 나게</b> 만드는 테스트를 설계하세요.\n스레드 수·반복 횟수·틈 넓히기로 재현 확률을 올립니다.",
    hint: "경합 테스트는 '한 번 돌려 통과' 로는 아무것도 증명하지 못합니다. 확률을 올리는 세 가지 손잡이가 있습니다 — <b>스레드 수 늘리기</b>, <b>반복 많이</b>, 그리고 읽기와 쓰기 사이에 <b>일부러 틈을 넣기</b>. 고친 뒤에는 같은 조건에서 0이 나와야 합니다.",
    acc: "조건별 재현 확률이 나오고, 고친 코드에서는 가장 가혹한 조건에서도 어긋남이 0인 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nlet seed = 24681357;\nfunction rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }\n\n/* gap 이 클수록 읽기와 쓰기 사이가 벌어져 끼어들 확률이 커진다 */\nfunction trial(threads, gap, fixed) {\n  if (fixed) return 0;\n  const pOverlap = 1 - Math.pow(1 - Math.min(gap / 10, 0.9), threads - 1);\n  return rnd() < pOverlap ? 1 : 0;\n}\n\nfunction run(threads, gap, rounds, fixed) {\n  let hit = 0;\n  for (let i = 0; i < rounds; i++) hit += trial(threads, gap, fixed);\n  return hit / rounds;\n}\n\nout.push(\"조건                          재현 확률\");\nconst conds = [\n  { n: \"스레드 2 · 틈 없음 · 100회\", t: 2, g: 0, r: 100 },\n  { n: \"스레드 2 · 틈 1 · 100회\", t: 2, g: 1, r: 100 },\n  { n: \"스레드 8 · 틈 1 · 2000회\", t: 8, g: 1, r: 2000 },\n  { n: \"스레드 32 · 틈 3 · 2000회\", t: 32, g: 3, r: 2000 }\n];\nconds.forEach((c) => out.push(c.n.padEnd(30) +\n  (run(c.t, c.g, c.r, false) * 100).toFixed(1) + \"%\"));\n\nout.push(\"\");\nout.push(\"고친 뒤 같은 조건\");\nconds.forEach((c) => out.push(\"  \" + c.n.padEnd(30) +\n  (run(c.t, c.g, c.r, true) * 100).toFixed(1) + \"%\"));\n\nout.push(\"\");\nout.push(\"손잡이 셋 — 스레드 수 · 반복 횟수 · 읽기와 쓰기 사이의 틈\");\nout.push(\"한 번 돌려 통과한 것은 아무것도 증명하지 않는다\");\nout.push(\"가장 가혹한 조건에서 0이 나와야 고쳤다고 말할 수 있다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 왜 로컬에서 안 났나", type: "note",
    goal: "재현되지 않던 <b>구조적인 이유</b>를 적으세요.\n앞으로 같은 종류의 버그를 개발 중에 잡으려면 무엇이 필요한지도 적습니다.",
    ph: "공유 상태 목록 / 경합 구간 / 로컬에서 안 난 이유 / 고른 방법과 그 이유 / 재현 테스트의 조건 / CI 에서 그 테스트를 몇 번 돌리나" }]
},

/* ─────────────────────────────────────────────── arduino */
{
  lv: 3, em: "🔋",
  title: "배터리가 사흘 만에 닳는다",
  desc: "몇 달을 버텨야 할 센서 장치의 전력을 항목별로 재고, 잠자기·전송 주기·측정 빈도를 조정해 수명을 예측 가능하게 만든다",
  skills: ["arduino", "c", "performance"],
  phases: [

  { t: "무엇이 전력을 쓰는지 적는다", type: "note",
    goal: "동작을 <b>항목별로</b> 나누고 각각 얼마나 자주, 얼마나 오래 도는지 적으세요.\n합이 실제 소모와 맞지 않으면 빠뜨린 것이 있습니다.",
    ph: "예: 배터리 2000mAh · 목표 6개월 · 온도 측정 1초마다 (80ms, 12mA) · 무선 전송 1분마다 (300ms, 120mA) · LED 항상 켜짐 (2mA) · MCU 항상 깨어 있음 (8mA) · 실측 사흘" },

  { t: "무엇부터 줄일 것인가", type: "decide",
    goal: "사흘밖에 못 버팁니다. 줄일 수 있는 것이 여럿 보입니다.",
    sit: "무엇부터 보시겠습니까?",
    opts: [
      { label: "항목별 mAh 를 계산해 가장 큰 것부터 — 대개 '항상 켜져 있는 것' 이다",
        fx: { performance: 3, debugging: 2 },
        fb: "✅ <b>전류가 작아도 항상 흐르면 가장 큽니다.</b> 120mA 로 0.3초 쓰는 전송보다 8mA 로 24시간 깨어 있는 MCU 가 훨씬 큽니다. 계산해 보면 대개 '잠들지 않는 것' 이 전체의 대부분이고, 그것을 재우는 것 하나로 수명이 열 배가 되기도 합니다.",
        best: true },
      { label: "전송 주기를 늘린다",
        fx: { performance: 1 },
        fb: "△ 무선이 순간 전류가 가장 커서 눈에 띄지만, <b>도는 시간이 짧아 총량은 작을 수 있습니다.</b> 계산해 보고 정해야 합니다." },
      { label: "더 큰 배터리를 쓴다",
        fx: { performance: -1 },
        fb: "⚠️ 사흘을 엿새로 만들 뿐입니다. 6개월을 만들려면 <b>60배 용량</b>이 필요해 현실적이지 않습니다." },
      { label: "더 저전력 MCU 로 바꾼다",
        fx: { performance: -1 },
        fb: "⚠️ 하드웨어를 바꾸는 것은 마지막 수단입니다. 지금 MCU 도 <b>잠들면 마이크로암페어 단위</b>로 내려가므로, 쓰는 방법을 먼저 고칩니다." }] },

  { t: "항목별 전력을 계산한다", type: "build",
    goal: "동작마다 <b>하루 mAh</b> 를 구하고 순위를 매기세요.\n배터리 수명도 함께 계산합니다.",
    hint: "한 항목의 하루 소모는 '전류 × 켜져 있는 시간' 입니다. 초당 몇 번, 한 번에 몇 밀리초를 하루로 환산해야 합니다. <b>항상 켜져 있는 것</b>은 24시간을 그대로 곱하므로, 전류가 작아도 결과가 큽니다. 계산 결과가 실측과 크게 다르면 빠뜨린 항목이 있다는 뜻입니다.",
    acc: "항목별 하루 mAh 와 비율이 순위로 나오고, 예상 수명이 계산되어 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst BATTERY = 2000;      // mAh\nconst MEASURED_DAYS = 3;   // 실제로 버틴 날\n\nconst items = [\n  { n: \"MCU 항상 깨어 있음\", mA: 8, perDay: 1, msEach: 86400000 },\n  { n: \"온도 측정\", mA: 12, perDay: 86400, msEach: 80 },\n  { n: \"무선 전송\", mA: 120, perDay: 1440, msEach: 300 },\n  { n: \"LED 상시 점등\", mA: 2, perDay: 1, msEach: 86400000 }\n];\n\nconst rows = items.map((x) => ({ n: x.n, mah: x.mA * (x.perDay * x.msEach) / 3600000 }))\n  .sort((a, b) => b.mah - a.mah);\nconst total = rows.reduce((s, r) => s + r.mah, 0);\n\nout.push(\"항목                    하루 mAh   비율\");\nrows.forEach((r) => out.push(r.n.padEnd(24) +\n  r.mah.toFixed(1).padStart(8) + \"   \" + (r.mah / total * 100).toFixed(0) + \"%\"));\nout.push(\"합계\".padEnd(24) + total.toFixed(1).padStart(8));\n\nconst days = BATTERY / total;\nout.push(\"\");\nout.push(\"계산한 수명 \" + days.toFixed(1) + \"일 · 실측 \" + MEASURED_DAYS + \"일\");\nconst gap = total * (days / MEASURED_DAYS - 1);\nout.push(\"계산이 \" + (days / MEASURED_DAYS).toFixed(1) + \"배 낙관적이다 — 하루 \" +\n  gap.toFixed(0) + \"mAh 를 못 세고 있다\");\nout.push(\"빠뜨렸을 만한 것: 부팅 전류 · 무선 재접속 실패 재시도 · 추운 곳에서의 용량 감소\");\nout.push(\"→ 계산이 실측과 맞을 때까지는 어떤 조치의 효과도 예측할 수 없다\");\n\nout.push(\"\");\nout.push(\"목표 180일을 채우려면 하루 \" + (BATTERY / 180).toFixed(2) + \"mAh 이하여야 한다\");\nout.push(\"→ 계산값 기준으로도 \" + (total / (BATTERY / 180)).toFixed(0) + \"분의 1로 줄여야 한다\");\nout.push(\"\");\nout.push(\"가장 큰 것: \" + rows[0].n + \" (\" + (rows[0].mah / total * 100).toFixed(0) + \"%)\");\nout.push(\"전류가 작아도 항상 흐르면 가장 크다 — 24시간을 그대로 곱하기 때문이다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "재우고 다시 계산한다", type: "build",
    goal: "조치를 하나씩 적용하며 <b>수명이 어떻게 늘어나는지</b> 계산하세요.\n목표에 닿는 최소 조합을 찾습니다.",
    hint: "조치마다 효과가 크게 다릅니다. MCU 를 재우는 것은 <b>깨어 있는 시간의 비율</b>만큼 줄이므로 효과가 압도적이고, 측정 주기를 늘리는 것은 그에 비례합니다. 목표를 채우는 <b>최소 조합</b>을 찾으면 사용자 경험을 덜 해치면서 수명을 얻습니다.",
    acc: "조치를 누적 적용한 하루 소모와 수명이 단계별로 나오고, 목표를 채우는 최소 조합이 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst BATTERY = 2000, GOAL_DAYS = 180;\nconst NEED = BATTERY / GOAL_DAYS;\n\nfunction daily(cfg) {\n  const mcuAwakeMs = cfg.sleep\n    ? (86400 / cfg.measureSec) * 80 + 1440 * 300      // 일할 때만 깬다\n    : 86400000;\n  const mcu = 8 * mcuAwakeMs / 3600000 + (cfg.sleep ? 0.005 * 24 : 0);\n  const meas = 12 * ((86400 / cfg.measureSec) * 80) / 3600000;\n  const tx = 120 * ((1440 / cfg.txMult) * 300) / 3600000;\n  const led = cfg.led ? 2 * 24 : 0;\n  return mcu + meas + tx + led;\n}\n\nconst steps = [\n  { n: \"지금 그대로\", cfg: { sleep: false, measureSec: 1, txMult: 1, led: true } },\n  { n: \"+ LED 끄기\", cfg: { sleep: false, measureSec: 1, txMult: 1, led: false } },\n  { n: \"+ MCU 재우기\", cfg: { sleep: true, measureSec: 1, txMult: 1, led: false } },\n  { n: \"+ 측정 1초→30초\", cfg: { sleep: true, measureSec: 30, txMult: 1, led: false } },\n  { n: \"+ 전송 1분→10분\", cfg: { sleep: true, measureSec: 30, txMult: 10, led: false } }\n];\n\nout.push(\"조치                  하루 mAh   수명       목표(180일)\");\nlet firstOk = null;\nsteps.forEach((s) => {\n  const d = daily(s.cfg);\n  const days = BATTERY / d;\n  if (!firstOk && days >= GOAL_DAYS) firstOk = s.n;\n  out.push(s.n.padEnd(22) + d.toFixed(2).padStart(8) + \"   \" +\n    (days.toFixed(0) + \"일\").padEnd(11) + (days >= GOAL_DAYS ? \"만족\" : \"부족\"));\n});\n\nout.push(\"\");\nout.push(\"목표를 처음 만족한 단계: \" + (firstOk || \"없음\"));\nout.push(\"필요한 하루 소모: \" + NEED.toFixed(2) + \"mAh 이하\");\nout.push(\"\");\nout.push(\"MCU 를 재우는 것 하나가 나머지를 전부 합친 것보다 크다\");\nout.push(\"목표를 채우는 최소 조합을 찾으면 사용자 경험을 덜 해친다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "얼마나 자주 보낼 것인가", type: "decide",
    goal: "전송을 10분마다로 늘리면 목표를 채웁니다. 그런데 사용자는 실시간에 가까운 값을 원합니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "평소에는 드물게 보내되, 값이 크게 변하면 즉시 보낸다",
        fx: { system_design: 3, performance: 2 },
        fb: "✅ <b>대부분의 시간에는 값이 거의 안 변합니다.</b> 같은 값을 10분마다 보내는 것은 낭비고, 중요한 순간(급변)에는 10분이 너무 깁니다. 변화가 임계를 넘을 때만 즉시 보내면 전력은 드물게 보내는 만큼 쓰면서 반응은 실시간에 가까워집니다.",
        best: true },
      { label: "10분마다로 하고 사용자에게 설명한다",
        fx: { communication: 1 },
        fb: "△ 정직하고 때로는 맞습니다. 다만 <b>급변을 놓치는 것</b>이 이 장치의 목적과 충돌한다면 설명으로 해결되지 않습니다." },
      { label: "측정은 자주 하고 여러 개를 모아 한 번에 보낸다",
        fx: { performance: 2, system_design: 1 },
        fb: "△ 좋은 방법이고 함께 쓸 수 있습니다. 무선을 켜는 <b>고정 비용</b>이 크므로 모아 보내면 전력이 크게 절약됩니다. 다만 급변에 대한 반응은 여전히 느립니다." },
      { label: "1분마다 보내고 배터리를 자주 갈게 한다",
        fx: { performance: -2 },
        fb: "⚠️ 설치 장소가 손닿기 어려우면 <b>교체 비용이 장치 값보다 커집니다.</b> 6개월 목표가 있었던 이유가 대개 그것입니다." }] },

  { t: "회고 — 무엇이 예상과 달랐나", type: "note",
    goal: "계산과 실측이 <b>얼마나 맞았는지</b> 적으세요.\n어긋났다면 무엇을 빠뜨렸는지 찾아 적습니다.",
    ph: "계산한 수명 vs 실측 / 빠뜨린 항목(부팅 전류·무선 재접속·온도에 따른 용량 감소 등) / 가장 큰 절감 / 사용자 경험과의 맞바꿈 / 남은 위험(추운 곳에서의 용량)" }]
}

]};
