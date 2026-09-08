/* 두 번째 프로젝트 묶음 2 — 앞 다섯이 '언어·데이터가 무너지는 자리' 였다면
   이 다섯은 '시스템과 협업이 무너지는 자리' 다.
   장애 대응 · 배포 · 관측 · 비용 · 데이터 품질. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── devops */
{
  lv: 4, em: "🚨",
  title: "새벽 3시에 알림이 울렸다",
  desc: "장애를 받은 순간부터 복구·회고까지의 순서를 몸에 익히고, 다시 울릴 때 더 빨리 끝나도록 경보·대시보드·기록을 손본다",
  skills: ["devops", "system_design", "communication"],
  phases: [

  { t: "무엇이 울렸는지 적는다", type: "note",
    goal: "지금 아는 것과 모르는 것을 <b>나눠서</b> 적으세요.\n장애 대응이 어긋나는 가장 흔한 이유는 추측을 사실로 다루기 때문입니다.",
    ph: "아는 것: 오류율 0.2%→12% (03:04부터) · 결제 API 만 · 배포는 없었음\n모르는 것: 몇 명이 영향받는지 · DB 인지 외부 결제사인지 · 03:00에 무슨 일이 있었는지" },

  { t: "가장 먼저 무엇을 하는가", type: "decide",
    goal: "오류율이 12% 로 뛰었고 사용자 문의가 들어오기 시작했습니다.",
    sit: "무엇을 먼저 하시겠습니까?",
    opts: [
      { label: "영향을 줄이는 조치를 먼저 하고, 원인은 그 다음에 찾는다",
        fx: { system_design: 3, leadership: 2 },
        fb: "✅ <b>복구와 원인 규명은 다른 일</b>이고 순서가 정해져 있습니다. 되돌리기·트래픽 차단·기능 끄기처럼 되돌릴 수 있는 조치로 피를 먼저 멈춥니다. 원인은 서비스가 살아난 뒤에 찾아도 되고, 그때가 더 침착하게 찾을 수 있습니다.",
        best: true },
      { label: "원인을 정확히 찾은 뒤 정확한 조치를 한다",
        fx: { system_design: -2 },
        fb: "⚠️ 그동안 사용자가 계속 실패합니다. 원인 규명은 몇 시간이 걸릴 수 있고, <b>그 시간이 곧 장애 시간</b>입니다. 정확한 조치는 다음 배포에서 하면 됩니다." },
      { label: "관련 팀을 전부 불러 모아 함께 본다",
        fx: { communication: -1, leadership: -1 },
        fb: "⚠️ 사람이 많다고 빨라지지 않습니다. 오히려 <b>누가 무엇을 하는지 아무도 모르는 상태</b>가 되기 쉽습니다. 지휘하는 한 사람을 정하고 필요한 사람만 부르는 편이 빠릅니다." },
      { label: "고객에게 먼저 공지한다",
        fx: { communication: 1 },
        fb: "△ 필요한 일이고 빠를수록 좋습니다. 다만 <b>영향 범위를 모른 채 공지하면</b> 나중에 정정해야 하고, 정정한 공지는 신뢰를 더 깎습니다. 조치를 시작한 직후, 아는 만큼만 알리는 것이 순서입니다." }] },

  { t: "되돌릴 수 있는 조치를 고른다", type: "build",
    goal: "지금 쓸 수 있는 조치들을 <b>효과와 되돌릴 수 있는가</b>로 견주는 표를 만드세요.\n무엇을 먼저 할지 순서가 나오게 합니다.",
    hint: "장애 중에 고르는 기준은 '가장 좋은 것' 이 아니라 <b>가장 빨리 되돌릴 수 있는 것</b>입니다. 효과가 커도 되돌리기 어려우면 뒤로 미룹니다. 각 조치가 무엇을 희생하는지도 함께 적어야 나중에 설명할 수 있습니다.",
    acc: "조치별 효과·소요 시간·되돌릴 수 있는지·희생하는 것이 표로 나오고, 권장 순서가 계산되어 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst actions = [\n  { n: \"직전 배포 되돌리기\", effect: 5, mins: 4, reversible: true, cost: \"새 기능 사라짐\" },\n  { n: \"결제 기능 끄기\", effect: 4, mins: 1, reversible: true, cost: \"결제 전부 중단\" },\n  { n: \"외부 결제사 우회\", effect: 4, mins: 20, reversible: true, cost: \"수수료 증가\" },\n  { n: \"DB 인덱스 추가\", effect: 3, mins: 40, reversible: false, cost: \"되돌리기 어려움\" },\n  { n: \"서버 대수 두 배\", effect: 2, mins: 6, reversible: true, cost: \"요금 증가\" }\n];\n\n/* 되돌릴 수 있는 것을 앞에, 그 안에서 빨리 되고 효과 큰 것을 앞에 */\nconst ranked = actions.slice().sort((a, b) =>\n  (Number(b.reversible) - Number(a.reversible)) ||\n  ((b.effect / b.mins) - (a.effect / a.mins)));\n\nout.push(\"순서 조치                효과 시간  되돌리기  희생\");\nranked.forEach((a, i) => {\n  out.push(String(i + 1).padEnd(5) + a.n.padEnd(20) +\n    String(a.effect).padEnd(5) + (a.mins + \"분\").padEnd(6) +\n    (a.reversible ? \"가능    \" : \"어려움  \") + a.cost);\n});\n\nout.push(\"\");\nout.push(\"장애 중 기준은 '가장 좋은 것' 이 아니라 '가장 빨리 되돌릴 수 있는 것'\");\nout.push(\"되돌리기 어려운 것은 서비스가 살아난 뒤에 한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "언제부터인지 좁힌다", type: "build",
    goal: "지표가 언제부터 나빠졌는지 <b>자동으로 찾는</b> 계산을 만드세요.\n그 시각과 배포·설정 변경 기록을 견주어 후보를 좁힙니다.",
    hint: "'언제부터인가' 를 사람이 그래프에서 눈으로 찾으면 느리고 틀립니다. 앞 구간의 보통 값을 기준으로 <b>처음으로 크게 벗어난 지점</b>을 찾으면 됩니다. 그 시각의 앞뒤 몇 분 안에 있었던 변경이 후보이고, 없다면 바깥에서 온 것입니다.",
    acc: "지표 계열에서 변곡 시각이 계산되고, 그 시각 근처의 변경 기록이 후보로 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 분당 오류율 — 03:00 부터 한 시간 */\nconst series = [];\nfor (let m = 0; m < 20; m++) series.push({ min: m, err: 0.2 + (m % 3) * 0.05 });\nfor (let m = 20; m < 40; m++) series.push({ min: m, err: 11 + (m % 4) * 0.4 });\n\nfunction findBreak(xs) {\n  const warm = 10;\n  const base = xs.slice(0, warm).reduce((s, x) => s + x.err, 0) / warm;\n  const sd = Math.sqrt(xs.slice(0, warm).reduce((s, x) => s + (x.err - base) ** 2, 0) / warm) || 0.01;\n  for (let i = warm; i < xs.length; i++) {\n    if (xs[i].err > base + sd * 6) return { at: xs[i].min, base: +base.toFixed(2), sd: +sd.toFixed(3) };\n  }\n  return null;\n}\n\nconst brk = findBreak(series);\nout.push(\"보통 오류율 \" + brk.base + \"% (표준편차 \" + brk.sd + \")\");\nout.push(\"처음 크게 벗어난 시각: 03:\" + String(brk.at).padStart(2, \"0\"));\n\nconst changes = [\n  { at: 5, what: \"모니터링 대시보드 수정\" },\n  { at: 19, what: \"결제사 API 키 교체\" },\n  { at: 21, what: \"캐시 서버 재시작\" },\n  { at: 35, what: \"로그 수집기 배포\" }\n];\nconst near = changes.filter((c) => Math.abs(c.at - brk.at) <= 3);\nout.push(\"\");\nout.push(\"변곡 앞뒤 3분 안의 변경 — 후보\");\nnear.forEach((c) => out.push(\"  03:\" + String(c.at).padStart(2, \"0\") + \"  \" + c.what));\nout.push(\"\");\nout.push(near.length ? \"후보가 있다 — 여기부터 본다\" : \"후보가 없다 — 바깥에서 온 것을 의심한다\");\nout.push(\"변곡보다 뒤에 있는 변경은 원인이 아니다 (03:35 로그 수집기)\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "무엇을 회고에 남길 것인가", type: "decide",
    goal: "복구했습니다. 원인은 결제사 API 키를 교체하면서 새 키의 한도가 낮았던 것이었습니다.",
    sit: "회고를 어떻게 쓰시겠습니까?",
    opts: [
      { label: "사람이 아니라 시스템을 묻는다 — 왜 한도 차이를 아무도 몰랐는지, 왜 4시간이나 걸렸는지",
        fx: { leadership: 3, communication: 3 },
        fb: "✅ <b>같은 사람이 다시 그 자리에 서도 안 나게</b> 만드는 것이 회고의 목적입니다. '키 교체 전 한도를 확인한다' 는 체크리스트보다, '한도가 부족하면 배포가 막힌다' 는 자동 확인이 낫습니다. 탐지·완화가 왜 늦었는지도 원인만큼 중요합니다.",
        best: true },
      { label: "누가 키를 교체했는지 밝히고 재발 방지 서약을 받는다",
        fx: { leadership: -3, communication: -2 },
        fb: "⚠️ <b>다음 장애를 숨기게 만듭니다.</b> 사람을 지목하는 회고가 한 번 나오면 그 뒤로는 아무도 실수를 먼저 말하지 않고, 그러면 발견이 늦어져 피해가 커집니다." },
      { label: "원인과 조치만 짧게 남기고 넘어간다",
        fx: { leadership: -1 },
        fb: "△ 없는 것보다는 낫습니다. 다만 <b>탐지가 왜 늦었는지</b>가 빠지면 다음에도 똑같이 늦게 알아채고, 장애 시간은 그대로입니다." },
      { label: "모든 API 키 교체를 승인제로 바꾼다",
        fx: { system_design: -1, leadership: -1 },
        fb: "⚠️ 한 번의 사고로 절차를 무겁게 만들면, 급할 때 사람들이 절차를 우회합니다. <b>자동으로 확인되는 것</b>과 <b>사람이 승인하는 것</b>을 구분해야 합니다." }] },

  { t: "다음엔 더 빨리 알아채게", type: "build",
    goal: "이번 장애의 시간을 <b>단계별로 쪼개</b> 어디가 길었는지 보고, 무엇을 고치면 얼마가 줄어드는지 계산하세요.",
    hint: "장애 시간은 '발생→탐지→인지→완화→복구' 로 나눠 봐야 합니다. 대개 가장 긴 구간은 고치는 시간이 아니라 <b>알아채는 시간</b>입니다. 어디를 고칠지 정하려면 이 구간들을 숫자로 봐야 하고, 그러면 대시보드를 늘릴지 경보를 손볼지가 저절로 정해집니다.",
    acc: "구간별 시간과 비율이 출력되고, 가장 긴 구간을 절반으로 줄였을 때 전체가 얼마가 되는지 함께 나오면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst spans = [\n  { n: \"발생 → 탐지\", mins: 34, fix: \"오류율 경보를 5분→1분 주기로\" },\n  { n: \"탐지 → 인지\", mins: 12, fix: \"경보에 담당자 자동 호출\" },\n  { n: \"인지 → 완화\", mins: 22, fix: \"되돌리기 버튼 하나로\" },\n  { n: \"완화 → 복구\", mins: 51, fix: \"한도 확인을 배포 검사에\" }\n];\n\nconst total = spans.reduce((s, x) => s + x.mins, 0);\nout.push(\"전체 장애 시간 \" + total + \"분\");\nout.push(\"\");\nout.push(\"구간            분    비율   고치면\");\nspans.forEach((s) => {\n  out.push(s.n.padEnd(16) + String(s.mins).padEnd(6) +\n    (Math.round(s.mins / total * 100) + \"%\").padEnd(7) + s.fix);\n});\n\nconst worst = spans.slice().sort((a, b) => b.mins - a.mins)[0];\nconst after = total - Math.floor(worst.mins / 2);\nout.push(\"\");\nout.push(\"가장 긴 구간: \" + worst.n + \" (\" + worst.mins + \"분)\");\nout.push(\"절반으로 줄이면 전체 \" + total + \"분 → \" + after + \"분 (\" +\n  Math.round((1 - after / total) * 100) + \"% 단축)\");\nout.push(\"\");\nout.push(\"대개 가장 긴 구간은 고치는 시간이 아니라 알아채는 시간이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 다음 새벽 3시를 위해", type: "note",
    goal: "이번에 <b>가장 아까웠던 시간</b>과 그것을 줄이는 방법을 적으세요.\n사람이 기억해야 하는 것은 지키지 못하므로, 자동으로 되게 만들 것을 골라 적습니다.",
    ph: "가장 아까웠던 구간 / 그때 무엇이 없어서 오래 걸렸나 / 자동으로 만들 것 하나 / 사람이 판단해야 할 것 하나 / 다음에 같은 일이 나면 몇 분 안에 끝날까" }]
},

/* ─────────────────────────────────────────────── backend */
{
  lv: 4, em: "🔀",
  title: "안 멈추고 스키마를 바꾼다",
  desc: "쓰고 있는 테이블의 컬럼을 무중단으로 바꾸는 절차를 단계로 나누고, 각 단계가 되돌릴 수 있는지 확인하며 옮긴다",
  skills: ["backend", "database", "devops"],
  phases: [

  { t: "무엇을 어디로 옮기는가", type: "note",
    goal: "바꿀 대상과 <b>지금 그것을 쓰는 곳</b>을 전부 적으세요.\n옮기는 중에 어긋나는 것은 대개 '이것도 그 컬럼을 쓰고 있었다' 입니다.",
    ph: "예: users.phone (문자열) → users.phone_e164 (정규화) · 쓰는 곳: 가입 API · 알림 발송 배치 · 관리자 검색 · CS 툴 · 리포트 뷰 3개 · 행 4,200만 · 초당 쓰기 90건" },

  { t: "한 번에 바꿀 수 없는 이유", type: "decide",
    goal: "컬럼 이름과 형식을 동시에 바꾸는 이전 스크립트를 한 번 돌리면 끝나 보입니다.",
    sit: "왜 그렇게 하면 안 됩니까?",
    opts: [
      { label: "배포는 순간이 아니라서, 옛 코드와 새 코드가 한동안 함께 돈다",
        fx: { system_design: 3, database: 2 },
        fb: "✅ <b>이것이 무중단 이전의 전부입니다.</b> 순차 배포든 청·녹이든 두 버전이 겹치는 구간이 있고, 그동안 옛 코드가 없어진 컬럼을 찾으면 그대로 터집니다. 그래서 '양쪽 다 되는 상태' 를 반드시 거쳐야 합니다.",
        best: true },
      { label: "4,200만 행을 한 번에 바꾸면 테이블이 잠겨 서비스가 멈춘다",
        fx: { database: 2, performance: 1 },
        fb: "△ 맞는 걱정이고 실제로 큰 문제입니다. 다만 <b>나눠서 바꾸면 해결되는</b> 문제라, 이것만으로는 단계를 나누는 이유가 다 설명되지 않습니다. 배포가 겹친다는 사실이 더 근본적입니다." },
      { label: "이전 스크립트가 중간에 실패하면 절반만 바뀐 상태가 된다",
        fx: { database: 1 },
        fb: "△ 실제 위험입니다. 다만 이어서 할 수 있게 만들면 다룰 수 있는 문제입니다. <b>두 버전이 함께 도는 것</b>은 다시 돌린다고 해결되지 않습니다." },
      { label: "되돌릴 수 없어서",
        fx: { database: 1 },
        fb: "△ 맞습니다. 다만 '왜 되돌릴 수 없는가' 가 핵심이고, 그 답이 <b>옛 컬럼을 지워 버렸기 때문</b>입니다. 지우지 않으면 되돌릴 수 있고, 그것이 단계를 나누는 방법입니다." }] },

  { t: "단계를 나눈다", type: "build",
    goal: "이전을 <b>각각 되돌릴 수 있는 단계</b>로 쪼개고, 단계마다 옛 코드와 새 코드가 모두 도는지 확인하는 표를 만드세요.",
    hint: "널리 쓰이는 순서는 '새 칸 추가 → 양쪽에 쓰기 → 옛 데이터 채우기 → 새 칸으로 읽기 → 옛 칸 쓰기 중단 → 옛 칸 삭제' 입니다. 각 단계에서 <b>옛 코드와 새 코드가 모두 살 수 있는지</b>를 확인하는 것이 핵심이고, 하나라도 아니면 그 단계를 더 쪼개야 합니다.",
    acc: "단계별로 옛 코드·새 코드가 도는지, 되돌릴 수 있는지가 표로 나오고, 안전하지 않은 단계가 있으면 지적되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst steps = [\n  { n: \"새 칸 추가(널 허용)\", old: true, neu: true, back: true },\n  { n: \"양쪽에 쓰기\", old: true, neu: true, back: true },\n  { n: \"옛 데이터 채우기(나눠서)\", old: true, neu: true, back: true },\n  { n: \"새 칸으로 읽기\", old: true, neu: true, back: true },\n  { n: \"옛 칸 쓰기 중단\", old: false, neu: true, back: true },\n  { n: \"옛 칸 삭제\", old: false, neu: true, back: false }\n];\n\nout.push(\"단계                      옛코드 새코드 되돌리기 판정\");\nlet firstUnsafe = null;\nsteps.forEach((s, i) => {\n  const safe = s.old && s.neu;\n  if (!safe && firstUnsafe === null) firstUnsafe = i;\n  out.push(s.n.padEnd(26) +\n    (s.old ? \"산다  \" : \"죽는다\").padEnd(7) +\n    (s.neu ? \"산다  \" : \"죽는다\").padEnd(7) +\n    (s.back ? \"가능    \" : \"불가    \") +\n    (safe ? \"안전\" : \"배포가 겹치면 위험\"));\n});\n\nout.push(\"\");\nout.push(\"처음 위험해지는 단계: \" + steps[firstUnsafe].n);\nout.push(\"→ 이 단계는 옛 코드가 완전히 사라진 뒤에만 한다\");\nout.push(\"→ '완전히 사라졌다' 는 배포 완료가 아니라 옛 인스턴스가 0인 것을 확인하는 것이다\");\nout.push(\"\");\nconst noBack = steps.filter((s) => !s.back);\nout.push(\"되돌릴 수 없는 단계: \" + noBack.map((s) => s.n).join(\", \"));\nout.push(\"→ 앞 단계들이 충분히 오래 안정된 뒤에 한다. 서두를 이유가 없다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "4천만 행을 나눠 채운다", type: "build",
    goal: "옛 데이터를 <b>서비스를 방해하지 않고</b> 채우는 절차를 만드세요.\n한 번에 몇 행씩, 얼마나 쉬면서 할지 계산하고 중간에 멈춰도 이어갈 수 있게 합니다.",
    hint: "한 번에 다 하면 테이블이 잠깁니다. 나눠서 하되 <b>어디까지 했는지</b>를 기록해야 중간에 멈춰도 이어갈 수 있습니다. 진행 중에 새로 들어오는 행은 이미 새 칸에 쓰이고 있으므로(양쪽 쓰기 단계) 걱정하지 않아도 됩니다. 서비스가 느려지면 묶음 크기를 줄이는 조절도 필요합니다.",
    acc: "묶음 크기별 소요 시간이 계산되고, 중간에 멈췄다가 이어서 끝까지 채우는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst TOTAL = 42000000;\n\nfunction plan(batch, restMs, perRowMs) {\n  const rounds = Math.ceil(TOTAL / batch);\n  const workMs = TOTAL * perRowMs;\n  const restTotal = (rounds - 1) * restMs;\n  return { rounds: rounds, hours: +((workMs + restTotal) / 3600000).toFixed(1) };\n}\n\nout.push(\"묶음      횟수        예상 시간   한 묶음 잠금\");\n[1000, 5000, 20000, 100000].forEach((b) => {\n  const p = plan(b, 200, 0.05);\n  out.push(String(b).padEnd(10) + String(p.rounds).padEnd(12) +\n    (p.hours + \"시간\").padEnd(12) + (b * 0.05).toFixed(0) + \"ms\");\n});\nout.push(\"\");\nout.push(\"묶음이 크면 빨리 끝나지만 한 번에 오래 잠근다\");\nout.push(\"잠금 시간이 사용자가 느끼는 지연이므로 여기서 상한을 정한다\");\n\n/* 어디까지 했는지 남기면 멈춰도 이어갈 수 있다 */\nout.push(\"\");\nlet cursor = 0, done = 0;\nfunction backfill(untilRound, batch) {\n  let r = 0;\n  while (cursor < TOTAL && r < untilRound) { cursor += batch; done += batch; r++; }\n  if (cursor > TOTAL) { done -= cursor - TOTAL; cursor = TOTAL; }\n  return r;\n}\n\nbackfill(300, 20000);\nout.push(\"1차 실행 중단 — 커서 \" + cursor + \" (\" + (cursor / TOTAL * 100).toFixed(1) + \"%)\");\nbackfill(1000, 20000);\nout.push(\"이어서 실행 — 커서 \" + cursor + \" (\" + (cursor / TOTAL * 100).toFixed(1) + \"%)\");\nwhile (cursor < TOTAL) backfill(5000, 20000);\nout.push(\"끝까지 — 커서 \" + cursor + \"  채운 행 \" + done);\nout.push(\"전부 채웠는가: \" + (cursor === TOTAL && done === TOTAL));\nout.push(\"중복해서 채우지 않았는가: \" + (done === TOTAL));\nconsole.log(out.join(\"\\n\"));" },

  { t: "양쪽이 맞는지 확인한다", type: "build",
    goal: "옛 칸과 새 칸이 <b>정말 같은 뜻인지</b> 표본으로 확인하는 검사를 만드세요.\n다른 것이 있으면 어떤 모양인지 분류합니다.",
    hint: "'채웠다' 와 '맞게 채웠다' 는 다릅니다. 변환 규칙에 빠진 경우가 있으면 조용히 다른 값이 들어갑니다. 전부 비교할 수 없으면 표본으로 하되, <b>어긋난 것을 모양별로 묶어</b> 보면 규칙의 어디가 빠졌는지가 드러납니다.",
    acc: "표본 비교 결과가 일치·불일치로 나오고, 불일치가 유형별로 묶여 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 옛 값 → 새 값 변환 규칙 (E.164) */\nfunction toE164(s) {\n  const d = String(s).replace(/[^0-9+]/g, \"\");\n  if (d.indexOf(\"+\") === 0) return d;\n  if (d.indexOf(\"0\") === 0) return \"+82\" + d.slice(1);\n  return null;                     // 규칙이 모르는 모양\n}\n\nconst sample = [\n  { old: \"010-1234-5678\", stored: \"+821012345678\" },\n  { old: \"01098765432\", stored: \"+8210987654 32\" },\n  { old: \"+81 90 1111 2222\", stored: \"+819011112222\" },\n  { old: \"02)555-1234\", stored: \"+8225551234\" },\n  { old: \"1588-1588\", stored: null },\n  { old: \"010 0000 0000\", stored: \"+821000000000\" }\n];\n\nconst bad = [];\nlet ok = 0;\nsample.forEach((r) => {\n  const want = toE164(r.old);\n  if (want === r.stored) { ok++; return; }\n  let kind = \"값이 다름\";\n  if (want === null) kind = \"규칙이 모르는 모양\";\n  else if (r.stored === null) kind = \"채워지지 않음\";\n  else if (String(r.stored).replace(/\\s/g, \"\") === want) kind = \"공백이 섞임\";\n  bad.push({ old: r.old, want: want, got: r.stored, kind: kind });\n});\n\nout.push(\"표본 \" + sample.length + \"건 · 일치 \" + ok + \" · 불일치 \" + bad.length);\nout.push(\"\");\nconst byKind = {};\nbad.forEach((b) => { (byKind[b.kind] = byKind[b.kind] || []).push(b); });\nObject.keys(byKind).forEach((k) => {\n  out.push(k + \" (\" + byKind[k].length + \"건)\");\n  byKind[k].forEach((b) => out.push(\"  \" + b.old + \"  기대 \" + b.want + \"  실제 \" + b.got));\n});\n\nout.push(\"\");\nout.push(\"모양별로 묶으면 규칙의 어디가 빠졌는지가 드러난다\");\nout.push(\"'채웠다' 와 '맞게 채웠다' 는 다르다 — 세어 보기 전에는 알 수 없다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "언제 옛 칸을 지울 것인가", type: "decide",
    goal: "새 칸으로 읽고 쓰기 시작한 지 하루가 지났습니다. 옛 칸은 아직 남아 있습니다.",
    sit: "언제 지우시겠습니까?",
    opts: [
      { label: "옛 칸을 읽는 코드가 정말 없는지 확인한 뒤, 충분한 기간을 두고 지운다",
        fx: { database: 3, system_design: 2 },
        fb: "✅ <b>지우는 것만 되돌릴 수 없으므로</b> 서두를 이유가 하나도 없습니다. 컬럼 하나가 남아 있어서 드는 값은 저장 공간뿐이고, 잘못 지웠을 때 드는 값은 복구 불가능한 데이터입니다. 접근 로그로 '정말 아무도 안 읽는다' 를 확인한 뒤가 안전합니다.",
        best: true },
      { label: "리포트·배치·CS 툴까지 코드를 검색해 확인하고 바로 지운다",
        fx: { database: 1 },
        fb: "△ 검색은 필요하지만 충분하지 않습니다. 문자열로 조립된 쿼리, 외부 BI 도구, 저장 프로시저는 <b>코드 검색에 안 잡힙니다.</b> 실제 접근 로그가 검색보다 믿을 만합니다." },
      { label: "이름을 바꿔 두고 아무도 안 찾으면 지운다",
        fx: { database: 2, system_design: 1 },
        fb: "△ 실제로 쓰이는 좋은 방법입니다. 이름을 바꾸면 쓰던 곳이 곧바로 터져서 드러나기 때문입니다. 다만 <b>터지는 것이 곧 장애</b>이므로, 조용한 시간대에 하고 되돌릴 준비를 해 둡니다." },
      { label: "저장 공간을 아끼려면 빨리 지워야 한다",
        fx: { database: -2 },
        fb: "⚠️ 저장 공간은 가장 싼 자원입니다. 컬럼 하나 값과 데이터를 잃는 값을 견주면 <b>비교가 되지 않습니다.</b>" }] },

  { t: "회고 — 무엇이 겹쳐 있었나", type: "note",
    goal: "옮기는 동안 <b>예상 못 한 사용처</b>가 나왔는지 적으세요.\n다음 이전에서 처음부터 확인할 목록으로 만듭니다.",
    ph: "처음 적은 사용처 / 진행 중에 발견한 사용처 / 어떻게 발견했나(터져서? 로그로?) / 다음엔 무엇부터 확인할까 / 각 단계에 둔 대기 시간과 그 근거" }]
},

/* ─────────────────────────────────────────────── pandas */
{
  lv: 3, em: "🧹",
  title: "리포트 숫자가 매번 다르다",
  desc: "같은 원본으로 돌렸는데 결과가 달라지는 데이터 파이프라인을 결정적으로 만들고, 품질 검사를 붙여 조용한 오염을 막는다",
  skills: ["pandas", "python", "database"],
  phases: [

  { t: "무엇이 얼마나 다른지 적는다", type: "note",
    goal: "'다르다' 를 <b>숫자로</b> 적으세요. 어느 지표가 얼마나, 몇 번 중 몇 번 달라지는지 적습니다.",
    ph: "예: 일일 매출 합계가 같은 원본으로 두 번 돌리면 0.3% 차이 · 5번 중 2번 · 사용자 수는 항상 같음 · 국가별로 나누면 KR 만 다름 · 파일 순서가 매번 다르게 읽힘" },

  { t: "무엇이 결과를 흔드는가", type: "decide",
    goal: "같은 입력에 같은 코드인데 결과가 다릅니다.",
    sit: "무엇을 먼저 의심하시겠습니까?",
    opts: [
      { label: "순서에 기대는 자리 — 파일 읽는 순서, 중복 제거 시 남기는 행, 그룹 안 첫 값",
        fx: { database: 3, debugging: 2 },
        fb: "✅ <b>순서가 정해지지 않은 자리</b>가 흔들림의 대부분입니다. 파일 목록 순서는 파일 시스템이 정하고, 중복 제거는 '먼저 온 것' 을 남기는데 그 '먼저' 가 매번 다르며, 정렬 없는 그룹의 첫 값도 마찬가지입니다. 정렬 기준을 못 박으면 전부 사라집니다.",
        best: true },
      { label: "부동소수점 오차가 쌓여서",
        fx: { debugging: -1 },
        fb: "⚠️ 오차는 생기지만 <b>같은 순서로 더하면 같은 결과</b>가 나옵니다. 순서가 달라져서 오차가 다르게 쌓인 것이라면 원인은 여전히 순서입니다." },
      { label: "원본 데이터가 중간에 바뀌었다",
        fx: { debugging: 1 },
        fb: "△ 확인할 값어치가 있고 실제 원인일 수 있습니다. 다만 <b>확인이 쉬우므로</b> 원본의 해시를 찍어 보고 넘어가면 됩니다. 같다면 원인은 코드 안에 있습니다." },
      { label: "병렬 처리 때문에",
        fx: { debugging: 1 },
        fb: "△ 병렬이면 순서가 달라지므로 위 항목과 같은 이야기입니다. 다만 병렬을 끄는 것이 답은 아니고, <b>순서에 기대지 않게</b> 만드는 것이 답입니다." }] },

  { t: "흔들리는 자리를 찾는다", type: "build",
    goal: "입력 순서만 바꿔서 <b>결과가 달라지는 단계</b>를 찾아내세요.\n같은 데이터를 여러 순서로 넣어 보고 결과를 견줍니다.",
    hint: "결정적인지 확인하는 방법은 간단합니다 — <b>순서를 섞어 여러 번 돌리고 결과가 같은지</b> 보면 됩니다. 단계마다 이것을 하면 어느 단계가 범인인지 바로 나옵니다. 합계처럼 순서와 무관해야 하는 것이 달라지면 그 안에 순서 의존이 숨어 있습니다.",
    acc: "단계별로 순서를 바꿔 돌린 결과가 같은지 다른지 판정되고, 흔들리는 단계가 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst rows = [\n  { id: 1, user: \"a\", amt: 100, at: 5 },\n  { id: 2, user: \"a\", amt: 200, at: 3 },\n  { id: 3, user: \"b\", amt: 50, at: 7 },\n  { id: 4, user: \"b\", amt: 50, at: 7 },\n  { id: 5, user: \"c\", amt: 300, at: 1 }\n];\n\nfunction shuffled(xs, seed) {\n  const a = xs.slice();\n  for (let i = a.length - 1; i > 0; i--) {\n    seed = (seed * 1103515245 + 12345) % 2147483648;\n    const j = seed % (i + 1);\n    const t = a[i]; a[i] = a[j]; a[j] = t;\n  }\n  return a;\n}\n\n/* 순서에 기대는 단계들 */\nconst steps = {\n  \"합계\": (xs) => xs.reduce((s, r) => s + r.amt, 0),\n  \"중복 제거(user,amt)\": (xs) => {\n    const seen = new Set(), keep = [];\n    xs.forEach((r) => { const k = r.user + \"|\" + r.amt; if (!seen.has(k)) { seen.add(k); keep.push(r.id); } });\n    return keep.join(\",\");\n  },\n  \"그룹의 첫 행\": (xs) => {\n    const first = {};\n    xs.forEach((r) => { if (first[r.user] === undefined) first[r.user] = r.id; });\n    return JSON.stringify(first);\n  },\n  \"정렬 후 첫 행\": (xs) => {\n    const s = xs.slice().sort((a, b) => (a.at - b.at) || (a.id - b.id));\n    return s[0].id;\n  }\n};\n\nout.push(\"단계                    판정\");\nObject.keys(steps).forEach((name) => {\n  const got = new Set();\n  for (let s = 1; s <= 8; s++) got.add(String(steps[name](shuffled(rows, s * 97))));\n  out.push(name.padEnd(24) +\n    (got.size === 1 ? \"결정적 (\" + [...got][0] + \")\" : \"흔들림 — \" + got.size + \"가지 결과\"));\n});\n\nout.push(\"\");\nout.push(\"순서를 섞어 여러 번 돌리면 흔들리는 단계가 바로 드러난다\");\nout.push(\"정렬 기준에 동점을 깨는 열쇠(id)까지 넣어야 완전히 결정적이 된다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "결과를 못 박는다", type: "build",
    goal: "흔들리는 단계마다 <b>순서를 정하는 기준</b>을 넣어 결정적으로 만드세요.\n같은 입력이면 몇 번을 돌려도 같은 결과가 나와야 합니다.",
    hint: "정렬 기준에는 <b>동점을 깨는 열쇠</b>가 반드시 있어야 합니다. 시각으로만 정렬하면 같은 시각의 행 순서는 여전히 정해지지 않습니다. 중복 제거도 '어느 것을 남길지' 를 명시해야 하고, 대개 '가장 최근' 이나 '가장 작은 id' 처럼 데이터에서 정할 수 있는 것으로 잡습니다.",
    acc: "고친 뒤 모든 단계가 순서를 바꿔도 같은 결과를 내고, 그 사실이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst rows = [\n  { id: 1, user: \"a\", amt: 100, at: 5 },\n  { id: 2, user: \"a\", amt: 200, at: 3 },\n  { id: 3, user: \"b\", amt: 50, at: 7 },\n  { id: 4, user: \"b\", amt: 50, at: 7 },\n  { id: 5, user: \"c\", amt: 300, at: 1 }\n];\n\nfunction shuffled(xs, seed) {\n  const a = xs.slice();\n  for (let i = a.length - 1; i > 0; i--) {\n    seed = (seed * 1103515245 + 12345) % 2147483648;\n    const j = seed % (i + 1);\n    const t = a[i]; a[i] = a[j]; a[j] = t;\n  }\n  return a;\n}\n\n/* 무엇을 하든 먼저 순서를 못 박는다 — 동점을 깨는 id 까지 */\nconst canon = (xs) => xs.slice().sort((a, b) => (a.at - b.at) || (a.id - b.id));\n\nconst steps = {\n  \"중복 제거\": (xs) => {\n    const seen = new Set(), keep = [];\n    canon(xs).forEach((r) => { const k = r.user + \"|\" + r.amt; if (!seen.has(k)) { seen.add(k); keep.push(r.id); } });\n    return keep.join(\",\");\n  },\n  \"그룹의 첫 행\": (xs) => {\n    const first = {};\n    canon(xs).forEach((r) => { if (first[r.user] === undefined) first[r.user] = r.id; });\n    return JSON.stringify(first);\n  },\n  \"사용자별 합계\": (xs) => {\n    const m = {};\n    canon(xs).forEach((r) => { m[r.user] = (m[r.user] || 0) + r.amt; });\n    return Object.keys(m).sort().map((k) => k + \"=\" + m[k]).join(\" \");\n  }\n};\n\nout.push(\"단계              판정\");\nlet allOk = true;\nObject.keys(steps).forEach((name) => {\n  const got = new Set();\n  for (let s = 1; s <= 20; s++) got.add(String(steps[name](shuffled(rows, s * 97))));\n  if (got.size !== 1) allOk = false;\n  out.push(name.padEnd(18) + (got.size === 1 ? \"결정적  \" + [...got][0] : \"아직 흔들림\"));\n});\n\nout.push(\"\");\nout.push(\"20가지 순서로 돌려 전부 같은가: \" + allOk);\nout.push(\"결과를 내보낼 때도 열쇠로 정렬해야 파일 자체가 같아진다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "품질 검사를 어디에 둘 것인가", type: "decide",
    goal: "원본이 이상해도 파이프라인은 그냥 돌아가고, 리포트를 본 사람이 며칠 뒤에 알아챕니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "각 단계 뒤에 기대치를 적어 두고, 어긋나면 그 자리에서 멈춘다",
        fx: { database: 3, debugging: 2 },
        fb: "✅ <b>이상한 데이터가 흘러 내려가지 못하게</b> 막는 것이 핵심입니다. 행 수 범위, 널 비율, 열쇠의 유일성, 합계의 대략적인 크기를 단계마다 적어 두면 어긋난 자리에서 곧바로 멈춥니다. 리포트를 본 사람이 알아채는 것보다 며칠 빠릅니다.",
        best: true },
      { label: "마지막에 결과를 어제와 비교해 크게 다르면 알린다",
        fx: { database: 2 },
        fb: "△ 값싸고 효과가 좋아 반드시 함께 둡니다. 다만 <b>어디서 잘못됐는지</b>는 알려 주지 않아 조사 시간이 길어집니다. 단계별 검사와 짝지어야 합니다." },
      { label: "원본을 넣는 팀에게 형식을 지켜 달라고 요청한다",
        fx: { communication: 1, database: -1 },
        fb: "⚠️ 요청은 필요하지만 <b>지켜지지 않을 때를 대비하는 것</b>이 파이프라인의 일입니다. 바깥에서 오는 데이터는 언제나 예상을 벗어납니다." },
      { label: "이상한 행은 조용히 버리고 진행한다",
        fx: { database: -3 },
        fb: "⚠️ <b>가장 위험한 선택</b>입니다. 숫자는 나오는데 조용히 틀리고, 얼마나 버렸는지도 모르게 됩니다. 버릴 거라면 최소한 몇 건을 왜 버렸는지 세어 남겨야 합니다." }] },

  { t: "기대치를 적어 둔다", type: "build",
    goal: "단계마다 <b>이 정도는 되어야 한다</b>를 코드로 적고, 어긋나면 멈추는 검사를 만드세요.",
    hint: "좋은 기대치는 정확한 값이 아니라 <b>범위</b>입니다. '행이 정확히 100만 개' 는 매일 깨지지만 '90만~110만 개' 는 진짜 이상할 때만 걸립니다. 널 비율, 열쇠 유일성, 값의 범위, 어제 대비 변화폭 네 가지로 대부분 잡힙니다. 검사가 실패하면 무엇이 얼마나 어긋났는지 함께 남겨야 조사할 수 있습니다.",
    acc: "정상 데이터는 통과하고 오염된 데이터는 어떤 기대치가 어떻게 어긋났는지와 함께 멈추는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction checks(spec) {\n  return function (rows, yesterdaySum) {\n    const fails = [];\n    if (rows.length < spec.minRows || rows.length > spec.maxRows)\n      fails.push(\"행 수 \" + rows.length + \" (기대 \" + spec.minRows + \"~\" + spec.maxRows + \")\");\n    const nulls = rows.filter((r) => r.amt == null).length;\n    const nullPct = rows.length ? nulls / rows.length : 0;\n    if (nullPct > spec.maxNullPct)\n      fails.push(\"널 비율 \" + (nullPct * 100).toFixed(1) + \"% (상한 \" + (spec.maxNullPct * 100) + \"%)\");\n    const ids = rows.map((r) => r.id);\n    if (new Set(ids).size !== ids.length)\n      fails.push(\"열쇠 중복 \" + (ids.length - new Set(ids).size) + \"건\");\n    const sum = rows.reduce((s, r) => s + (r.amt || 0), 0);\n    if (yesterdaySum) {\n      const change = Math.abs(sum - yesterdaySum) / yesterdaySum;\n      if (change > spec.maxChange)\n        fails.push(\"합계 변화 \" + (change * 100).toFixed(0) + \"% (상한 \" + (spec.maxChange * 100) + \"%)\");\n    }\n    return { ok: !fails.length, fails: fails, sum: sum };\n  };\n}\n\nconst gate = checks({ minRows: 4, maxRows: 10, maxNullPct: 0.2, maxChange: 0.5 });\n\nconst good = [{ id: 1, amt: 100 }, { id: 2, amt: 120 }, { id: 3, amt: 90 }, { id: 4, amt: 110 }, { id: 5, amt: null }];\nconst bad = [{ id: 1, amt: 100 }, { id: 1, amt: 100 }, { id: 3, amt: null }, { id: 4, amt: null }, { id: 5, amt: 9000 }];\n\n[[\"정상 데이터\", good], [\"오염된 데이터\", bad]].forEach((c) => {\n  const r = gate(c[1], 420);\n  out.push(c[0] + \" — \" + (r.ok ? \"통과 (합계 \" + r.sum + \")\" : \"멈춤\"));\n  r.fails.forEach((f) => out.push(\"    \" + f));\n});\n\nout.push(\"\");\nout.push(\"좋은 기대치는 정확한 값이 아니라 범위다 — 매일 깨지면 아무도 안 본다\");\nout.push(\"무엇이 얼마나 어긋났는지 남겨야 조사할 수 있다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 무엇이 조용했나", type: "note",
    goal: "이번에 <b>조용히 틀리고 있었던 것</b>과 그것을 며칠 만에 알아챘는지 적으세요.\n검사를 붙인 뒤 같은 일이 몇 분 만에 잡히는지도 적습니다.",
    ph: "조용히 틀린 것 / 며칠 만에 알아챘나 / 누가 어떻게 발견했나 / 지금은 어느 단계에서 몇 분 만에 잡히나 / 아직 검사가 없는 자리" }]
},

/* ─────────────────────────────────────────────── net */
{
  lv: 4, em: "🌐",
  title: "가끔 느린 이유를 끝까지 쫓는다",
  desc: "평균은 멀쩡한데 꼬리가 긴 응답 시간을 연결·재시도·큐 세 층에서 나눠 재고, 꼬리를 줄이는 조치를 골라 넣는다",
  skills: ["net", "performance", "system_design"],
  phases: [

  { t: "꼬리를 숫자로 본다", type: "note",
    goal: "평균 말고 <b>분위수</b>로 적으세요. p50·p95·p99 와 최댓값을 적고, 언제 나빠지는지도 적습니다.",
    ph: "예: p50 40ms · p95 180ms · p99 2,400ms · 최대 31초 · 평균 92ms(멀쩡해 보임) · 오전 9시와 매시 정각에 집중 · 특정 API 아니고 전 구간" },

  { t: "평균이 왜 거짓말을 하는가", type: "decide",
    goal: "대시보드의 평균 응답 시간은 92ms 로 목표 안입니다. 그런데 느리다는 문의가 계속 옵니다.",
    sit: "무엇이 문제입니까?",
    opts: [
      { label: "평균은 소수의 아주 느린 요청을 흐려서, 100명 중 1명이 30초를 기다려도 안 보인다",
        fx: { performance: 3, system_design: 2 },
        fb: "✅ <b>사용자는 평균을 겪지 않습니다.</b> 각자 자기 요청 하나를 겪을 뿐이라, 100명 중 1명이 30초를 기다리면 그 1명에게는 서비스가 고장 난 것입니다. 게다가 한 화면이 여러 요청을 하면 <b>그중 하나만 느려도</b> 화면 전체가 느려서, 체감 확률은 훨씬 높습니다.",
        best: true },
      { label: "평균을 재는 구간이 너무 길어서 순간의 나쁨이 묻힌다",
        fx: { performance: 1 },
        fb: "△ 그것도 사실이고 구간을 짧게 하면 조금 나아집니다. 다만 구간을 아무리 줄여도 <b>평균이라는 요약 자체가</b> 꼬리를 지웁니다." },
      { label: "느리다는 문의가 과장된 것이다",
        fx: { performance: -3 },
        fb: "⚠️ 숫자를 보고 사람을 의심하는 순간 조사가 끝납니다. p99 를 재 보면 <b>문의가 정확했다</b>는 것이 드러납니다." },
      { label: "클라이언트 쪽 문제다",
        fx: { performance: -1 },
        fb: "⚠️ 가능성은 있지만 확인 전에 결론입니다. 서버 쪽 분위수를 먼저 보면 <b>어느 쪽에서 시작할지</b>가 정해집니다." }] },

  { t: "분위수로 다시 본다", type: "build",
    goal: "같은 데이터를 평균과 분위수로 <b>나란히</b> 보여 주세요.\n한 화면이 여러 요청을 할 때 느릴 확률도 함께 계산합니다.",
    hint: "분위수는 정렬한 뒤 자리를 찾으면 됩니다. 중요한 것은 <b>화면 하나가 요청 여러 개를 한다</b>는 점입니다. 각 요청이 1% 확률로 느리면, 요청 10개짜리 화면은 대략 10% 확률로 느려집니다. 이 계산이 '왜 체감이 숫자보다 나쁜가' 를 설명합니다.",
    acc: "평균과 p50·p95·p99·최댓값이 함께 출력되고, 요청 수에 따른 화면 지연 확률이 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 대부분 빠르고 소수가 아주 느리다 — 실제 응답 시간의 전형적인 모양 */\nconst lat = [];\nfor (let i = 0; i < 990; i++) lat.push(30 + (i % 60));\nfor (let i = 0; i < 10; i++) lat.push(2000 + i * 400);\n\nfunction q(xs, p) {\n  const s = xs.slice().sort((a, b) => a - b);\n  return s[Math.min(s.length - 1, Math.floor(s.length * p))];\n}\n\nconst avg = Math.round(lat.reduce((s, x) => s + x, 0) / lat.length);\nout.push(\"요청 \" + lat.length + \"건\");\nout.push(\"  평균  \" + avg + \"ms   ← 대시보드에 보이던 숫자\");\nout.push(\"  p50   \" + q(lat, 0.5) + \"ms\");\nout.push(\"  p95   \" + q(lat, 0.95) + \"ms\");\nout.push(\"  p99   \" + q(lat, 0.99) + \"ms\");\nout.push(\"  최대  \" + Math.max.apply(null, lat) + \"ms\");\n\nconst slow = lat.filter((x) => x > 1000).length / lat.length;\nout.push(\"\");\nout.push(\"1초 넘는 요청 비율: \" + (slow * 100).toFixed(1) + \"%\");\nout.push(\"\");\nout.push(\"화면당 요청 수   그 화면이 느릴 확률\");\n[1, 5, 10, 30].forEach((n) => {\n  const p = 1 - Math.pow(1 - slow, n);\n  out.push(String(n).padEnd(17) + (p * 100).toFixed(1) + \"%\");\n});\n\nout.push(\"\");\nout.push(\"사용자는 평균을 겪지 않는다 — 자기 요청 하나를 겪는다\");\nout.push(\"요청이 많은 화면일수록 그중 하나가 느릴 확률이 커진다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "어느 층에서 늦는지 나눈다", type: "build",
    goal: "한 요청의 시간을 <b>연결·전송·서버 처리·대기</b>로 쪼개 보여 주세요.\n느린 요청과 보통 요청의 구성이 어떻게 다른지 견줍니다.",
    hint: "'느리다' 는 어느 층에서 늦었는지 모르면 고칠 수 없습니다. 새 연결을 맺는 비용(핸드셰이크)은 재사용하면 사라지고, 큐에서 기다린 시간은 처리 능력이 모자란다는 뜻이며, 서버 처리 시간이 길면 코드나 DB 문제입니다. <b>층마다 처방이 다릅니다.</b>",
    acc: "보통 요청과 느린 요청의 층별 시간이 나란히 나오고, 느린 쪽에서 어느 층이 커졌는지 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst normal = { \"DNS\": 1, \"TCP 연결\": 2, \"TLS\": 3, \"큐 대기\": 2, \"서버 처리\": 28, \"응답 전송\": 4 };\nconst slow = { \"DNS\": 1, \"TCP 연결\": 32, \"TLS\": 48, \"큐 대기\": 1900, \"서버 처리\": 31, \"응답 전송\": 5 };\n\nconst FIX = {\n  \"DNS\": \"결과를 캐시한다\",\n  \"TCP 연결\": \"연결을 재사용한다(keep-alive·풀)\",\n  \"TLS\": \"세션 재개 · 연결 재사용\",\n  \"큐 대기\": \"처리 능력을 늘리거나 부하를 덜어낸다\",\n  \"서버 처리\": \"코드·쿼리를 본다\",\n  \"응답 전송\": \"응답을 줄이거나 압축한다\"\n};\n\nconst keys = Object.keys(normal);\nconst tn = keys.reduce((s, k) => s + normal[k], 0);\nconst ts = keys.reduce((s, k) => s + slow[k], 0);\n\nout.push(\"층            보통(ms)  느림(ms)   배수\");\nkeys.forEach((k) => {\n  const r = normal[k] ? (slow[k] / normal[k]).toFixed(0) : \"—\";\n  out.push(k.padEnd(14) + String(normal[k]).padEnd(10) + String(slow[k]).padEnd(11) + r + \"배\");\n});\nout.push(\"합계          \" + String(tn).padEnd(10) + String(ts).padEnd(11) +\n  (ts / tn).toFixed(0) + \"배\");\n\nconst worst = keys.slice().sort((a, b) => (slow[b] - normal[b]) - (slow[a] - normal[a]))[0];\nout.push(\"\");\nout.push(\"가장 많이 늘어난 층: \" + worst + \" (+\" + (slow[worst] - normal[worst]) + \"ms, 전체의 \" +\n  Math.round((slow[worst] - normal[worst]) / (ts - tn) * 100) + \"%)\");\nout.push(\"처방: \" + FIX[worst]);\nout.push(\"\");\nout.push(\"층마다 처방이 다르다 — 나누지 않으면 엉뚱한 곳을 고친다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "재시도를 어떻게 할 것인가", type: "decide",
    goal: "느린 요청을 줄이려고 2초가 넘으면 다시 보내는 재시도를 넣으려 합니다.",
    sit: "어떻게 넣으시겠습니까?",
    opts: [
      { label: "재시도 총량에 상한을 두고, 여유가 있을 때만 보낸다",
        fx: { system_design: 3, performance: 2 },
        fb: "✅ <b>재시도는 부하를 늘리는 조치</b>라, 서버가 힘들 때 재시도가 몰리면 상황을 악화시킵니다. 전체 요청의 몇 퍼센트까지만 재시도하도록 예산을 두면, 평상시에는 꼬리를 줄이고 장애 때는 저절로 멈춥니다. 상대에게 이미 도착했을 수 있으므로 <b>여러 번 와도 안전한 요청</b>에만 씁니다.",
        best: true },
      { label: "두 배씩 늘려 가며 세 번까지 재시도한다",
        fx: { system_design: 1 },
        fb: "△ 간격을 늘리는 것은 맞고 지터도 있어야 합니다. 다만 <b>전체 총량에 상한이 없으면</b> 장애 때 재시도가 눈덩이처럼 불어납니다. 개별 규칙만으로는 부족합니다." },
      { label: "느린 것 같으면 곧바로 다시 보내고 먼저 오는 것을 쓴다",
        fx: { performance: 1, system_design: -1 },
        fb: "△ 꼬리를 줄이는 실제 기법이고 효과도 큽니다. 다만 부하가 배로 늘 수 있어 <b>여유가 있을 때만</b> 해야 하고, 상대가 중복을 견딜 수 있어야 합니다." },
      { label: "타임아웃을 늘려 재시도가 필요 없게 한다",
        fx: { performance: -2 },
        fb: "⚠️ 꼬리가 더 길어질 뿐입니다. 기다리는 동안 연결과 스레드가 묶여 <b>다른 요청까지 느려집니다.</b>" }] },

  { t: "재시도 예산을 만든다", type: "build",
    goal: "전체 요청 대비 <b>몇 퍼센트까지</b>만 재시도하는 장치를 만드세요.\n장애 상황에서 재시도가 저절로 멈추는지 확인합니다.",
    hint: "최근 요청 수를 세고 재시도 수가 그 몇 퍼센트를 넘으면 더 이상 재시도하지 않는 방식입니다. 평상시에는 실패가 적어 예산이 남아돌고, <b>대규모 장애 때는 금세 예산이 바닥나</b> 재시도가 멈춥니다. 이 성질이 눈덩이를 막습니다.",
    acc: "정상 상황과 장애 상황에서 실제 재시도 횟수와 예산 소진 여부가 나란히 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nfunction budget(pct) {\n  let calls = 0, retries = 0;\n  return {\n    call(failed) {\n      calls++;\n      if (!failed) return \"성공\";\n      if (retries + 1 > calls * pct) return \"실패(예산 소진 — 재시도 안 함)\";\n      retries++;\n      return \"재시도\";\n    },\n    stat() { return { calls: calls, retries: retries, pct: calls ? +(retries / calls * 100).toFixed(1) : 0 }; }\n  };\n}\n\nfunction runScenario(name, failRate) {\n  const b = budget(0.1);              // 전체의 10% 까지만 재시도\n  let blocked = 0;\n  for (let i = 0; i < 1000; i++) {\n    const failed = (i % 100) < failRate * 100;\n    if (b.call(failed).indexOf(\"예산 소진\") >= 0) blocked++;\n  }\n  const s = b.stat();\n  out.push(name.padEnd(22) + \"재시도 \" + String(s.retries).padStart(4) +\n    \" (\" + s.pct + \"%)   막힌 재시도 \" + blocked);\n}\n\nout.push(\"상황                  결과 (예산 10%)\");\nrunScenario(\"정상 (실패 2%)\", 0.02);\nrunScenario(\"조금 나쁨 (실패 8%)\", 0.08);\nrunScenario(\"장애 (실패 60%)\", 0.60);\n\nout.push(\"\");\nout.push(\"평상시에는 예산이 남아돌아 꼬리를 줄여 준다\");\nout.push(\"장애 때는 금세 바닥나 재시도가 저절로 멈춘다 — 눈덩이를 막는다\");\nout.push(\"상대에게 이미 도착했을 수 있으므로 멱등한 요청에만 쓴다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 꼬리가 어디서 왔나", type: "note",
    goal: "꼬리를 만든 <b>진짜 원인</b>과 그것을 줄인 조치를 적으세요.\n조치 뒤의 p99 를 함께 적어 효과를 숫자로 남깁니다.",
    ph: "꼬리의 원인(층) / 넣은 조치 / 조치 전후 p99 / 평균은 어떻게 변했나 / 재시도 예산이 실제로 막은 적이 있나 / 아직 남은 꼬리" }]
},

/* ─────────────────────────────────────────────── cloud */
{
  lv: 3, em: "💸",
  title: "이번 달 청구서가 세 배가 됐다",
  desc: "요금이 왜 늘었는지 데이터로 쪼개고, 아끼는 조치를 위험도와 절감액으로 줄 세워 되돌릴 수 있는 것부터 실행한다",
  skills: ["cloud", "devops", "performance"],
  phases: [

  { t: "얼마가 어디서 늘었는지 적는다", type: "note",
    goal: "총액이 아니라 <b>늘어난 항목</b>을 적으세요. 지난달과 이번 달을 항목별로 견주고, 그 시점에 무슨 일이 있었는지 함께 적습니다.",
    ph: "예: 총액 210만→640만 · 데이터 전송 40만→310만(가장 큼) · 컴퓨트 120만→150만 · 저장 30만→90만 · 15일에 이미지 서비스를 앱에 직접 연결 · 로그 보존을 90일로 늘림" },

  { t: "무엇부터 볼 것인가", type: "decide",
    goal: "요금이 세 배가 됐습니다. 항목이 40개가 넘습니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "늘어난 절대 금액이 큰 순으로 줄 세우고 위에서 몇 개만 본다",
        fx: { performance: 3, system_design: 2 },
        fb: "✅ <b>증가액이 큰 두세 항목이 대개 전체의 80% 입니다.</b> 비율로 보면 작은 항목이 1000% 늘어 눈에 띄지만 금액으로는 미미합니다. 어디에 시간을 쓸지 정하는 것이 첫 일이고, 그 기준은 절대 금액입니다.",
        best: true },
      { label: "가장 비싼 항목부터 본다",
        fx: { performance: 1 },
        fb: "△ 나쁘지 않지만 <b>원래 비쌌던 것</b>과 <b>이번에 늘어난 것</b>은 다릅니다. 컴퓨트가 가장 비싸도 지난달과 같다면 이번 사태의 원인은 아닙니다." },
      { label: "전체적으로 10% 씩 줄이는 목표를 세운다",
        fx: { performance: -2 },
        fb: "⚠️ 40개 항목을 조금씩 건드리면 시간은 많이 들고 효과는 적습니다. <b>대부분의 절감은 두세 곳에서</b> 나옵니다." },
      { label: "더 싼 클라우드로 옮기는 것을 검토한다",
        fx: { system_design: -2 },
        fb: "⚠️ 원인을 모르는 채 옮기면 <b>같은 낭비를 다른 곳에서</b> 반복합니다. 전송비가 원인이라면 어디로 옮겨도 마찬가지입니다." }] },

  { t: "늘어난 곳을 짚는다", type: "build",
    goal: "항목별 지난달·이번 달을 받아 <b>증가액 순</b>으로 줄 세우고, 상위 몇 개가 전체 증가의 몇 퍼센트인지 계산하세요.",
    hint: "비율 증가와 금액 증가를 <b>나란히</b> 보여 주는 것이 중요합니다. 1000% 늘었지만 3만 원인 항목과 150% 늘었지만 270만 원인 항목이 있을 때, 사람 눈은 앞을 보고 계산은 뒤를 가리킵니다. 누적 비율을 함께 내면 '여기까지만 보면 된다' 는 선이 보입니다.",
    acc: "증가액 순 목록과 각 항목의 비율·누적 비율이 출력되고, 전체 증가의 80% 를 덮는 항목 수가 나오면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst items = [\n  { n: \"데이터 전송(아웃)\", last: 400000, now: 3100000 },\n  { n: \"컴퓨트\", last: 1200000, now: 1500000 },\n  { n: \"객체 저장\", last: 300000, now: 900000 },\n  { n: \"NAT 게이트웨이\", last: 80000, now: 420000 },\n  { n: \"로그 수집\", last: 60000, now: 380000 },\n  { n: \"관리형 DB\", last: 150000, now: 160000 },\n  { n: \"함수 실행\", last: 3000, now: 33000 }\n];\n\nconst rows = items.map((x) => ({ n: x.n, up: x.now - x.last, pct: x.last ? (x.now / x.last - 1) * 100 : 0 }))\n  .sort((a, b) => b.up - a.up);\nconst totalUp = rows.reduce((s, r) => s + r.up, 0);\n\nout.push(\"항목                증가액      증가율    누적\");\nlet cum = 0, need80 = 0;\nrows.forEach((r, i) => {\n  cum += r.up;\n  const cp = cum / totalUp * 100;\n  if (!need80 && cp >= 80) need80 = i + 1;\n  out.push(r.n.padEnd(20) +\n    (\"+\" + (r.up / 10000).toFixed(0) + \"만\").padEnd(12) +\n    (r.pct.toFixed(0) + \"%\").padEnd(10) + cp.toFixed(0) + \"%\");\n});\n\nout.push(\"\");\nout.push(\"전체 증가 \" + (totalUp / 10000).toFixed(0) + \"만원\");\nout.push(\"상위 \" + need80 + \"개가 증가의 80% 를 차지한다 — 여기까지만 보면 된다\");\nout.push(\"\");\nconst byPct = rows.slice().sort((a, b) => b.pct - a.pct)[0];\nout.push(\"증가율 1위는 \" + byPct.n + \" (\" + byPct.pct.toFixed(0) + \"%) 이지만 금액은 +\" +\n  (byPct.up / 10000).toFixed(0) + \"만원뿐이다\");\nout.push(\"눈은 비율을 보고 계산은 금액을 가리킨다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "전송비가 어디서 나가는지 본다", type: "build",
    goal: "나가는 데이터의 <b>경로별 요금</b>을 계산하고, 앞에 캐시를 두었을 때 얼마가 줄어드는지 보여 주세요.",
    hint: "요금은 <b>나가는 쪽</b>에만 붙고 경로마다 단가가 다릅니다. 인터넷으로 나가는 것이 가장 비싸고, 리전 사이·AZ 사이가 그 다음이며, 들어오는 것은 대개 무료입니다. 캐시가 아끼는 것은 '적중률만큼의 인터넷 전송' 이므로, 적중률을 가정하고 계산하면 효과를 미리 볼 수 있습니다.",
    acc: "경로별 전송량·단가·요금이 나오고, 캐시 적중률에 따른 절감액이 함께 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst RATE = { \"인터넷(아웃)\": 120, \"리전 간\": 25, \"AZ 간\": 12, \"인터넷(인)\": 0 };\nconst traffic = { \"인터넷(아웃)\": 22000, \"리전 간\": 3000, \"AZ 간\": 9000, \"인터넷(인)\": 18000 };\n\nout.push(\"경로            GB       단가(원/GB)  요금\");\nlet total = 0;\nObject.keys(traffic).forEach((k) => {\n  const cost = traffic[k] * RATE[k];\n  total += cost;\n  out.push(k.padEnd(16) + String(traffic[k]).padEnd(9) +\n    String(RATE[k]).padEnd(13) + (cost / 10000).toFixed(0) + \"만원\");\n});\nout.push(\"합계\".padEnd(16) + \"\".padEnd(22) + (total / 10000).toFixed(0) + \"만원\");\n\nout.push(\"\");\nout.push(\"CDN 적중률   인터넷 전송   요금      절감\");\nconst outGb = traffic[\"인터넷(아웃)\"];\nconst CDN_RATE = 40;\n[0, 0.5, 0.8, 0.95].forEach((hit) => {\n  const origin = outGb * (1 - hit);\n  const cost = origin * RATE[\"인터넷(아웃)\"] + outGb * hit * CDN_RATE;\n  const save = outGb * RATE[\"인터넷(아웃)\"] - cost;\n  out.push((hit * 100).toFixed(0).padStart(3) + \"%\" + \"\".padEnd(9) +\n    String(Math.round(origin)).padEnd(14) +\n    ((cost / 10000).toFixed(0) + \"만\").padEnd(10) +\n    (save > 0 ? \"-\" + (save / 10000).toFixed(0) + \"만원\" : \"—\"));\n});\n\nout.push(\"\");\nout.push(\"들어오는 데이터는 무료지만 나가는 데이터에는 붙는다\");\nout.push(\"이미지를 그대로 서비스하면 전송비가 저장비를 훌쩍 넘는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "무엇부터 실행할 것인가", type: "decide",
    goal: "절감 후보가 여섯 개 나왔습니다. 어떤 것은 위험하고 어떤 것은 시간이 오래 걸립니다.",
    sit: "어떤 기준으로 고르시겠습니까?",
    opts: [
      { label: "되돌릴 수 있고 서비스에 영향이 없는 것부터, 절감액 순으로",
        fx: { performance: 3, system_design: 2 },
        fb: "✅ <b>비용 절감으로 장애를 만들면 아낀 것보다 크게 잃습니다.</b> 안 쓰는 자원 정리·개발 환경 야간 정지·보존 기간 조정은 되돌릴 수 있고 영향이 없어 먼저 합니다. 아키텍처를 바꾸는 절감은 효과가 커도 위험하므로 뒤로 미룹니다.",
        best: true },
      { label: "절감액이 가장 큰 것부터",
        fx: { performance: 1, system_design: -1 },
        fb: "△ 금액만 보면 대개 가장 위험한 것이 1등입니다. <b>위험도를 함께 보지 않으면</b> 요금은 줄고 장애가 늘어납니다." },
      { label: "가장 빨리 할 수 있는 것부터",
        fx: { performance: 1 },
        fb: "△ 속도는 좋은 기준이지만 효과가 작은 것만 잔뜩 하고 끝날 수 있습니다. <b>안전한 것 중에서</b> 절감액 순으로 하는 편이 낫습니다." },
      { label: "팀이 합의한 것부터",
        fx: { communication: 1, performance: -1 },
        fb: "△ 합의는 필요하지만 기준이 아닙니다. <b>기준을 먼저 정하고</b> 그 기준으로 줄 세운 것을 합의하는 순서가 맞습니다." }] },

  { t: "절감 계획을 세운다", type: "build",
    goal: "후보들을 <b>절감액·위험도·되돌릴 수 있는가</b>로 줄 세우고, 안전한 것만으로 얼마를 아낄 수 있는지 계산하세요.",
    hint: "위험한 조치를 뺐을 때 <b>목표를 채울 수 있는지</b>가 핵심 질문입니다. 채울 수 있으면 위험한 것은 아예 안 해도 되고, 못 채우면 그때 위험을 감수할지 논의하면 됩니다. 순서를 계산으로 내면 논쟁이 줄어듭니다.",
    acc: "안전한 조치만의 누적 절감액과 목표 달성 여부가 출력되고, 위험한 조치가 왜 뒤로 밀렸는지 함께 나오면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst TARGET = 3000000;\n\nconst plans = [\n  { n: \"안 붙은 디스크·IP 정리\", save: 180000, risk: 0, back: true, days: 1 },\n  { n: \"개발 환경 야간·주말 정지\", save: 520000, risk: 0, back: true, days: 1 },\n  { n: \"로그 보존 90→30일\", save: 240000, risk: 1, back: false, days: 1 },\n  { n: \"이미지 앞에 CDN\", save: 1900000, risk: 1, back: true, days: 3 },\n  { n: \"약정 인스턴스 전환\", save: 400000, risk: 2, back: false, days: 2 },\n  { n: \"멀티리전 → 단일리전\", save: 900000, risk: 4, back: false, days: 14 }\n];\n\nconst safe = plans.filter((p) => p.risk <= 1).sort((a, b) => b.save - a.save);\nconst risky = plans.filter((p) => p.risk > 1).sort((a, b) => b.save - a.save);\n\nout.push(\"먼저 할 것 (위험 낮음)\");\nout.push(\"조치                      절감      되돌리기  일수  누적\");\nlet cum = 0;\nsafe.forEach((p) => {\n  cum += p.save;\n  out.push(\"  \" + p.n.padEnd(24) + ((p.save / 10000).toFixed(0) + \"만\").padEnd(10) +\n    (p.back ? \"가능      \" : \"불가      \") + (p.days + \"일\").padEnd(6) +\n    (cum / 10000).toFixed(0) + \"만\");\n});\n\nout.push(\"\");\nout.push(\"안전한 조치만으로 \" + (cum / 10000).toFixed(0) + \"만원 · 목표 \" + (TARGET / 10000).toFixed(0) + \"만원\");\nout.push(cum >= TARGET ? \"→ 목표를 채운다. 위험한 조치는 하지 않아도 된다\"\n  : \"→ \" + ((TARGET - cum) / 10000).toFixed(0) + \"만원 부족 — 여기서부터 위험을 논의한다\");\n\nout.push(\"\");\nout.push(\"뒤로 미룬 것 (위험 높음)\");\nrisky.forEach((p) => out.push(\"  \" + p.n.padEnd(24) +\n  ((p.save / 10000).toFixed(0) + \"만\").padEnd(10) + \"위험도 \" + p.risk + \" · \" + p.days + \"일\"));\n\nout.push(\"\");\nout.push(\"비용 절감으로 장애를 만들면 아낀 것보다 크게 잃는다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 왜 늦게 알았나", type: "note",
    goal: "요금이 <b>세 배가 될 때까지 몰랐던 이유</b>를 적으세요.\n다음 달에 같은 일이 나면 며칠 만에 알 수 있는지도 적습니다.",
    ph: "왜 청구서를 받고서야 알았나 / 지금 붙인 예산 경보의 기준 / 태그가 없어서 주인을 못 찾은 자원 수 / 실행한 조치와 실제 절감액 / 다음 달 예상 청구액" }]
}

]};
