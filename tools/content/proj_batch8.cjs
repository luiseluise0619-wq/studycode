/* 두 번째 프로젝트 묶음 8 — 아직 프로젝트가 하나뿐인 트랙들 (2/2) 과
   가장 큰 트랙의 세 번째. Git · Linux · Testing · Python. */
module.exports = {
  group: "tracks", extra: true,
  PROJECTS: [

/* ─────────────────────────────────────────────── git */
{
  lv: 3, em: "🌿",
  title: "브랜치가 서른 개 쌓였다",
  desc: "머지 충돌과 오래된 브랜치로 팀이 느려지는 상황을 브랜치 수명·통합 주기·자동 정리로 다루어 합치는 일을 다시 값싸게 만든다",
  skills: ["git", "devops", "communication"],
  phases: [

  { t: "지금 상태를 세어 적는다", type: "note",
    goal: "브랜치의 <b>나이와 크기</b>를 세어 적으세요.\n'많다' 가 아니라 몇 개가 며칠 됐고 몇 줄 차이인지 적습니다.",
    ph: "예: 원격 브랜치 34개 · 30일 넘은 것 19개 · 가장 오래된 것 214일 · 평균 변경 620줄 · 최대 4,100줄 · 지난달 머지 충돌 27건 · 충돌 해결에 평균 40분" },

  { t: "왜 합치기가 어려워졌는가", type: "decide",
    goal: "브랜치를 합칠 때마다 충돌이 나고 해결에 오래 걸립니다.",
    sit: "무엇이 원인입니까?",
    opts: [
      { label: "브랜치가 오래 살아서 — 갈라져 있는 시간이 길수록 겹칠 확률과 양이 함께 는다",
        fx: { leadership: 3, system_design: 2 },
        fb: "✅ <b>충돌의 양은 갈라져 있던 시간에 거의 비례합니다.</b> 하루짜리 브랜치는 겹칠 것이 적고, 두 달짜리는 그동안 남들이 바꾼 것 전부와 겹칩니다. 그래서 해결책은 '충돌을 잘 푸는 법' 이 아니라 <b>브랜치를 짧게 사는 것</b>입니다 — 자주 합치면 한 번의 충돌이 작아집니다.",
        best: true },
      { label: "머지 도구가 부족해서",
        fx: { coding: -1 },
        fb: "⚠️ 도구는 <b>겹친 것을 보여 줄 뿐</b>이고, 어느 쪽이 맞는지는 사람만 압니다. 도구를 바꿔도 겹친 양이 줄지 않습니다." },
      { label: "코드가 한 파일에 몰려 있어서",
        fx: { coding: 1, system_design: 1 },
        fb: "△ 실제 요인이고 구조를 나누면 겹칠 확률이 줍니다. 다만 <b>같은 파일을 안 건드려도</b> 오래된 브랜치는 옛 전제 위에서 만들어져 논리적으로 어긋납니다." },
      { label: "리베이스 대신 머지를 써서",
        fx: { coding: -1 },
        fb: "⚠️ 이력의 모양이 달라질 뿐 <b>겹친 양은 같습니다.</b> 리베이스는 충돌을 커밋마다 나눠 풀게 할 뿐입니다." }] },

  { t: "브랜치 나이와 충돌을 견준다", type: "build",
    goal: "브랜치 목록에서 <b>나이·크기와 충돌 위험</b>의 관계를 계산하세요.\n어느 브랜치부터 처리해야 하는지 순서를 냅니다.",
    hint: "위험은 대략 <b>나이 × 겹치는 파일 수</b>로 어림할 수 있습니다. 나이가 길수록 그동안 주 브랜치가 많이 바뀌었고, 겹치는 파일이 많을수록 그 변경과 부딪힐 자리가 많습니다. 순서를 내면 '무엇부터 합치거나 버릴지' 를 논쟁 없이 정할 수 있습니다.",
    acc: "브랜치별 위험 점수와 처리 순서가 나오고, 나이와 위험의 관계가 숫자로 드러나면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst branches = [\n  { n: \"feat/pay-v2\", days: 214, lines: 4100, touched: 38, sharedWithMain: 21 },\n  { n: \"fix/login\", days: 2, lines: 40, touched: 2, sharedWithMain: 1 },\n  { n: \"feat/search\", days: 46, lines: 980, touched: 12, sharedWithMain: 7 },\n  { n: \"chore/deps\", days: 91, lines: 60, touched: 2, sharedWithMain: 2 },\n  { n: \"feat/report\", days: 8, lines: 310, touched: 5, sharedWithMain: 1 },\n  { n: \"exp/spike\", days: 130, lines: 2200, touched: 24, sharedWithMain: 0 }\n];\n\nconst rows = branches.map((b) => ({\n  n: b.n, days: b.days, lines: b.lines,\n  risk: Math.round(b.days * b.sharedWithMain / 10),\n  dead: b.sharedWithMain === 0 && b.days > 60\n})).sort((a, b) => b.risk - a.risk);\n\nout.push(\"브랜치            나이   변경 줄   위험   처리\");\nrows.forEach((r) => {\n  let act;\n  if (r.dead) act = \"주인에게 물어보고 지운다 (겹침 없음·오래됨)\";\n  else if (r.risk > 60) act = \"지금 합치거나 잘게 나눈다\";\n  else if (r.risk > 10) act = \"이번 주에 합친다\";\n  else act = \"그대로 둔다\";\n  out.push(r.n.padEnd(18) + (r.days + \"일\").padEnd(7) +\n    String(r.lines).padEnd(10) + String(r.risk).padEnd(7) + act);\n});\n\nconst old = rows.filter((r) => r.days > 30);\nout.push(\"\");\nout.push(\"30일 넘은 브랜치 \" + old.length + \"/\" + rows.length +\n  \" · 그 브랜치들의 위험 합계가 전체의 \" +\n  Math.round(old.reduce((s, r) => s + r.risk, 0) / rows.reduce((s, r) => s + r.risk, 0) * 100) + \"%\");\nout.push(\"위험 ≈ 나이 × 주 브랜치와 겹치는 파일 수\");\nout.push(\"겹치는 파일이 0인데 오래된 것은 충돌이 아니라 '잊힌 것' 이다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "자주 합치면 얼마나 싸지나", type: "build",
    goal: "같은 작업을 <b>한 번에 합치는 것</b>과 <b>나눠서 자주 합치는 것</b>의 총 충돌 비용을 계산해 견주세요.",
    hint: "충돌 해결 비용은 겹친 양에 <b>비례 이상</b>으로 늡니다 — 겹친 것이 많으면 서로 얽혀 하나를 풀면 다른 것이 어긋나기 때문입니다. 그래서 같은 총량이라도 잘게 나누면 합계가 훨씬 작아집니다. 다만 합치는 일 자체에도 고정 비용이 있으므로 무한히 잘게 나누는 것이 답은 아닙니다.",
    acc: "합치는 횟수별 총 비용이 나오고, 최소가 되는 지점이 계산되어 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst TOTAL_DAYS = 60;        // 이만큼의 작업을 한다\nconst DRIFT_PER_DAY = 6;      // 하루에 주 브랜치가 이만큼 바뀐다\nconst FIXED_MIN = 12;         // 합칠 때마다 드는 고정 비용(분)\n\n/* 겹친 양이 많을수록 한 건당 비용이 더 든다 — 얽혀서 하나를 풀면 다른 것이 어긋난다 */\nfunction conflictCost(overlap) { return Math.pow(overlap, 1.4) * 0.35; }\n\nfunction plan(times) {\n  const gap = TOTAL_DAYS / times;\n  const overlapEach = gap * DRIFT_PER_DAY;\n  const each = FIXED_MIN + conflictCost(overlapEach);\n  return { times: times, gapDays: gap, overlap: Math.round(overlapEach),\n    total: Math.round(each * times) };\n}\n\nout.push(TOTAL_DAYS + \"일치 작업 · 주 브랜치는 하루 \" + DRIFT_PER_DAY + \"곳씩 바뀐다\");\nout.push(\"\");\nout.push(\"합치는 횟수   간격     한 번 겹침   총 비용\");\nconst rows = [];\n[1, 2, 4, 8, 15, 30, 60].forEach((t) => {\n  const p = plan(t);\n  rows.push(p);\n  out.push(String(t).padEnd(14) + (p.gapDays.toFixed(1) + \"일\").padEnd(9) +\n    String(p.overlap).padEnd(13) + p.total + \"분\");\n});\n\nconst best = rows.slice().sort((a, b) => a.total - b.total)[0];\nconst once = rows[0];\nout.push(\"\");\nout.push(\"가장 싼 주기: \" + best.gapDays.toFixed(1) + \"일마다 (\" + best.times + \"번) — \" +\n  best.total + \"분\");\nout.push(\"한 번에 합치면 \" + once.total + \"분 — \" +\n  (once.total / best.total).toFixed(1) + \"배\");\nout.push(\"\");\nout.push(\"충돌 비용은 겹친 양에 비례 이상으로 는다 — 그래서 잘게 나누면 합계가 준다\");\nout.push(\"다만 합치는 일 자체에 고정 비용이 있어 무한히 잘게 나누는 것이 답은 아니다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "오래된 브랜치를 어떻게 할 것인가", type: "decide",
    goal: "30일 넘은 브랜치가 19개 있고, 주인이 회사를 떠난 것도 있습니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "지우기 전에 태그로 표시해 두고, 규칙을 정해 자동으로 정리한다",
        fx: { system_design: 3, communication: 2 },
        fb: "✅ <b>지운 브랜치도 커밋은 남습니다.</b> 태그를 붙여 두면 나중에 되찾을 수 있고, 목록에서는 사라져 사람들이 헷갈리지 않습니다. 규칙(예: 90일 넘고 주 브랜치에 병합됨)을 자동으로 돌리면 다시 쌓이지 않습니다. 사람이 매번 판단하게 두면 아무도 안 지웁니다.",
        best: true },
      { label: "주인에게 물어보고 답이 없으면 둔다",
        fx: { communication: 1, system_design: -1 },
        fb: "△ 예의 바르지만 <b>지금 상태가 그렇게 만들어졌습니다.</b> 떠난 사람은 답할 수 없고, 답이 없으면 영원히 남습니다." },
      { label: "전부 지운다",
        fx: { system_design: -1 },
        fb: "⚠️ 아직 작업 중인 것이 섞여 있습니다. <b>병합됐는지</b>와 <b>최근 커밋이 언제인지</b>를 보면 대부분 자동으로 갈립니다." },
      { label: "그대로 둔다 — 브랜치는 값싸다",
        fx: { system_design: -2, communication: -1 },
        fb: "⚠️ 저장 공간은 값싸지만 <b>사람의 주의는 아닙니다.</b> 목록이 길면 무엇이 살아 있는지 아무도 몰라, 이미 있는 작업을 다시 하는 일이 생깁니다." }] },

  { t: "회고 — 무엇이 브랜치를 길게 만들었나", type: "note",
    goal: "브랜치가 오래 살게 된 <b>진짜 이유</b>를 적으세요.\n대개 게을러서가 아니라 구조에 이유가 있습니다.",
    ph: "가장 오래 산 브랜치와 그 이유 / 리뷰를 기다린 시간 / 배포 주기가 길어서인가 / 기능이 커서인가 / 정한 규칙 / 자동 정리 조건 / 한 달 뒤 브랜치 수" }]
},

/* ─────────────────────────────────────────────── linux */
{
  lv: 3, em: "🧾",
  title: "디스크가 가득 찼다",
  desc: "새벽에 디스크가 차서 서비스가 멈춘 상황을 빠르게 되살리고, 무엇이 채웠는지 찾아 다시 차지 않게 규칙으로 막는다",
  skills: ["linux", "devops", "os"],
  phases: [

  { t: "무엇이 멈췄는지 적는다", type: "note",
    goal: "디스크가 찼을 때 <b>무엇이 어떻게 실패했는지</b> 적으세요.\n쓰기가 막히면 예상 못 한 곳까지 함께 멈춥니다.",
    ph: "예: / 가 100% · 애플리케이션은 살아 있는데 요청마다 500 · DB 가 쓰기 거부 · 로그가 안 남아 원인을 못 봄 · ssh 로그인은 되는데 명령이 느림 · 03:40 부터" },

  { t: "가장 먼저 무엇을 하는가", type: "decide",
    goal: "디스크가 100% 이고 서비스가 실패하고 있습니다.",
    sit: "무엇을 먼저 하시겠습니까?",
    opts: [
      { label: "안전하게 지울 수 있는 것으로 먼저 자리를 만들고, 원인은 그 다음에 찾는다",
        fx: { system_design: 3, debugging: 2 },
        fb: "✅ <b>자리가 없으면 조사도 못 합니다.</b> 로그를 남길 수도, 임시 파일을 만들 수도 없어서 도구조차 제대로 돌지 않습니다. 오래된 로그·패키지 캐시·빌드 산출물처럼 <b>지워도 되는 것이 확실한 것</b>부터 몇 GB 만들면, 서비스가 살아나고 그때 원인을 찾을 여유가 생깁니다.",
        best: true },
      { label: "무엇이 채웠는지 먼저 찾는다",
        fx: { debugging: 1 },
        fb: "△ 곧 해야 할 일입니다. 다만 <b>그동안 서비스는 계속 실패</b>하고, 자리가 없으면 조사 도구도 제대로 못 돕니다." },
      { label: "디스크를 늘린다",
        fx: { system_design: 1 },
        fb: "△ 클라우드라면 빠른 해결책이고 실제로 많이 씁니다. 다만 <b>왜 찼는지 모르면</b> 늘린 만큼 다시 차고, 그때는 더 큰 데이터가 쌓여 있습니다." },
      { label: "서버를 재시작한다",
        fx: { debugging: -2 },
        fb: "⚠️ 임시 파일 일부가 정리되어 잠깐 나아 보일 수 있지만, <b>원인은 그대로</b>이고 재시작 중에 남았어야 할 로그까지 잃습니다." }] },

  { t: "무엇이 채웠는지 찾는다", type: "build",
    goal: "디렉터리별 크기에서 <b>범인 몇 개</b>를 찾으세요.\n지운 뒤에도 안 줄어드는 경우까지 함께 다룹니다.",
    hint: "큰 것부터 몇 개만 보면 대개 끝납니다. 그런데 지웠는데 안 줄어들면 <b>지운 파일을 아직 열고 있는 프로세스</b>가 있는 것이라, 그 프로세스를 재시작해야 공간이 돌아옵니다. 이것을 모르면 '분명히 지웠는데' 에서 막힙니다.",
    acc: "큰 디렉터리 순위와 누적 비율이 나오고, 지운 뒤 안 줄어드는 경우의 처리가 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst TOTAL_GB = 200;\n\nconst dirs = [\n  { p: \"/var/log/app\", gb: 96, safe: true, why: \"회전 설정 없음\" },\n  { p: \"/var/lib/docker\", gb: 42, safe: true, why: \"안 쓰는 이미지·컨테이너\" },\n  { p: \"/var/lib/postgresql\", gb: 38, safe: false, why: \"실제 데이터\" },\n  { p: \"/home/deploy/builds\", gb: 14, safe: true, why: \"옛 빌드 산출물\" },\n  { p: \"/tmp\", gb: 6, safe: true, why: \"임시 파일\" },\n  { p: \"기타\", gb: 4, safe: false, why: \"\" }\n];\n\nconst sorted = dirs.slice().sort((a, b) => b.gb - a.gb);\nconst used = sorted.reduce((s, d) => s + d.gb, 0);\nout.push(\"전체 \" + TOTAL_GB + \"GB · 사용 \" + used + \"GB (\" +\n  Math.round(used / TOTAL_GB * 100) + \"%)\");\nout.push(\"\");\nout.push(\"경로                     크기    누적    지워도 되나\");\nlet cum = 0;\nsorted.forEach((d) => {\n  cum += d.gb;\n  out.push(d.p.padEnd(25) + (d.gb + \"GB\").padEnd(8) +\n    (Math.round(cum / used * 100) + \"%\").padEnd(8) +\n    (d.safe ? \"예 — \" + d.why : \"아니오 — \" + d.why));\n});\n\nconst freeable = sorted.filter((d) => d.safe).reduce((s, d) => s + d.gb, 0);\nout.push(\"\");\nout.push(\"안전하게 지울 수 있는 것 \" + freeable + \"GB → 사용률 \" +\n  Math.round((used - freeable) / TOTAL_GB * 100) + \"%\");\n\n/* 지웠는데 안 줄어드는 경우 */\nout.push(\"\");\nout.push(\"지웠는데 안 줄어든다면\");\nconst held = [\n  { pid: 8123, cmd: \"app-server\", gb: 31, file: \"/var/log/app/access.log (deleted)\" },\n  { pid: 8140, cmd: \"log-shipper\", gb: 7, file: \"/var/log/app/error.log (deleted)\" }\n];\nheld.forEach((h) => out.push(\"  pid \" + h.pid + \" \" + h.cmd.padEnd(14) +\n  h.gb + \"GB 붙잡음  \" + h.file));\nout.push(\"  → 지운 파일을 아직 열고 있는 프로세스다. 재시작해야 \" +\n  held.reduce((s, h) => s + h.gb, 0) + \"GB 가 돌아온다\");\nout.push(\"  → 파일 이름은 사라져도 링크 수가 0이 아니면 공간은 살아 있다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "다시 차지 않게 막는다", type: "build",
    goal: "로그 회전 설정을 정하고, 그 설정에서 <b>디스크가 언제 다시 찰지</b> 계산하세요.",
    hint: "회전 설정은 세 가지로 정해집니다 — 얼마나 자주 자를지, 몇 개를 남길지, 압축할지. 이 셋으로 <b>최대 차지하는 용량</b>이 정해지므로, 그 값이 여유 공간보다 작은지 확인하면 됩니다. 계산해 두지 않으면 '언젠가 또 차는' 상태로 돌아갑니다.",
    acc: "설정별 최대 용량과 여유 대비 안전 여부가 나오고, 안전한 조합이 지목되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\nconst FREE_GB = 120;         // 정리 뒤 남은 여유\nconst PER_DAY_GB = 8;        // 하루에 쌓이는 로그\nconst SAFETY = 0.5;          // 여유의 절반까지만 쓴다\n\nfunction maxSize(days, keep, compress) {\n  const cur = PER_DAY_GB * days;                    // 회전 전 현재 파일\n  const old = PER_DAY_GB * days * keep * (compress ? 0.12 : 1);\n  return +(cur + old).toFixed(1);\n}\n\nconst budget = FREE_GB * SAFETY;\nout.push(\"여유 \" + FREE_GB + \"GB · 하루 \" + PER_DAY_GB + \"GB 쌓임\");\nout.push(\"예산: 여유의 \" + (SAFETY * 100) + \"% = \" + budget + \"GB\");\nout.push(\"\");\nout.push(\"주기    보관   압축   최대 용량   판정\");\nconst configs = [\n  { d: 30, k: 12, c: false }, { d: 7, k: 8, c: false },\n  { d: 1, k: 30, c: false }, { d: 1, k: 30, c: true },\n  { d: 1, k: 14, c: true }, { d: 1, k: 7, c: true }\n];\nlet pick = null;\nconfigs.forEach((c) => {\n  const m = maxSize(c.d, c.k, c.c);\n  const ok = m <= budget;\n  if (ok && !pick) pick = { c: c, m: m };\n  out.push((c.d + \"일\").padEnd(8) + (c.k + \"개\").padEnd(7) +\n    (c.c ? \"예  \" : \"아니오\").padEnd(7) + (m + \"GB\").padEnd(12) +\n    (ok ? \"안전\" : \"예산 초과\"));\n});\n\nout.push(\"\");\nout.push(\"고른 설정: \" + pick.c.d + \"일마다 회전 · \" + pick.c.k + \"개 보관 · \" +\n  (pick.c.c ? \"압축\" : \"압축 안 함\") + \" → 최대 \" + pick.m + \"GB\");\nout.push(\"압축이 \" + Math.round((1 - 0.12) * 100) + \"% 를 줄여 준다 — 로그는 잘 압축된다\");\n\nout.push(\"\");\nout.push(\"경보는 언제 울려야 하나\");\n[70, 80, 90].forEach((pct) => {\n  const left = (FREE_GB * (100 - pct) / 100) / PER_DAY_GB;\n  out.push(\"  \" + pct + \"% 에서 울리면  남은 시간 약 \" + left.toFixed(1) + \"일\");\n});\nout.push(\"→ 사람이 대응할 시간이 남는 자리에서 울려야 뜻이 있다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "회고 — 왜 아무도 몰랐나", type: "note",
    goal: "디스크가 <b>100% 가 될 때까지 아무도 몰랐던 이유</b>를 적으세요.\n지금은 며칠 전에 알 수 있는지도 적습니다.",
    ph: "경보가 없었나 있었는데 무시됐나 / 정리한 용량 / 붙잡고 있던 프로세스 / 정한 회전 설정과 최대 용량 / 경보 문턱과 그때 남는 시간 / 이 서버 말고 같은 문제가 있을 서버" }]
},

/* ─────────────────────────────────────────────── test */
{
  lv: 3, em: "🧬",
  title: "테스트가 20분 걸린다",
  desc: "느려진 테스트 스위트를 유형별로 나눠 재고, 느린 것을 빠르게 바꾸거나 나눠 돌려 되먹임을 몇 분 안으로 되돌린다",
  skills: ["test", "performance", "devops"],
  phases: [

  { t: "어디에 시간이 드는지 적는다", type: "note",
    goal: "스위트를 <b>유형별로 나눠</b> 시간을 적으세요.\n총 시간만 보면 어디를 고칠지 알 수 없습니다.",
    ph: "예: 전체 21분 · 단위 1,840개 2분 · 통합 310개 9분 · 브라우저 46개 8분 · 준비(DB 띄우기) 2분 · 가장 느린 테스트 하나가 40초 · 하루 빌드 30회" },

  { t: "무엇부터 줄일 것인가", type: "decide",
    goal: "21분 중 통합 9분, 브라우저 8분입니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "가장 느린 몇 개를 찾아 왜 느린지 보고, 같은 것을 확인하는 더 싼 테스트로 바꿀 수 있는지 본다",
        fx: { performance: 3, coding: 2 },
        fb: "✅ <b>대개 전체의 절반이 몇 개에서 나옵니다.</b> 그것들이 왜 느린지 보면 대체로 '기다리고 있다' — 고정 시간 대기, 매번 새로 띄우는 준비, 실제 네트워크 호출입니다. 그리고 그중 상당수는 <b>더 싼 층에서 같은 것을 확인</b>할 수 있어, 통합 테스트 하나를 단위 테스트 셋으로 바꾸면 빨라지면서 실패 원인도 더 분명해집니다.",
        best: true },
      { label: "병렬로 돌린다",
        fx: { performance: 2 },
        fb: "△ 효과가 크고 해야 할 일입니다. 다만 <b>테스트가 서로 독립이어야</b> 하고, 아니면 거짓 실패가 쏟아집니다. 그리고 느린 테스트 하나가 40초면 병렬로도 그 아래로는 못 갑니다." },
      { label: "느린 테스트를 밤에만 돌린다",
        fx: { performance: 1, coding: -1 },
        fb: "△ 되먹임은 빨라집니다. 다만 <b>밤에 깨진 것을 아침에 발견</b>하게 되어, 원인이 된 커밋을 찾기가 어려워집니다. 마지막 수단으로 둡니다." },
      { label: "기계를 키운다",
        fx: { performance: 1 },
        fb: "△ 값싼 개선이고 실제로 효과가 있습니다. 다만 <b>기다리는 시간은 안 줄어들고</b>, 스위트가 계속 커지면 다시 같은 자리입니다." }] },

  { t: "느린 것부터 세어 본다", type: "build",
    goal: "테스트별 시간에서 <b>상위 몇 개가 전체의 얼마</b>인지 계산하세요.\n각각이 왜 느린지 분류도 함께 냅니다.",
    hint: "테스트 시간은 대개 <b>한쪽으로 크게 쏠립니다</b> — 대부분은 밀리초이고 몇 개가 수십 초입니다. 상위 몇 개의 누적 비율을 보면 어디에 시간을 쓸지 정해지고, 느린 이유를 분류해 두면 같은 처방을 묶어 적용할 수 있습니다.",
    acc: "느린 순 목록과 누적 비율이 나오고, 이유별로 묶은 합계와 처방이 함께 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 앞 단계에서 적은 것과 같은 스위트 — 전체 21분 */\nconst tests = [\n  { n: \"결제 전체 흐름\", sec: 210, why: \"고정 시간 대기\" },\n  { n: \"주문 목록 렌더\", sec: 190, why: \"매번 브라우저 띄움\" },\n  { n: \"회원가입 흐름\", sec: 165, why: \"실제 메일 서버 호출\" },\n  { n: \"재고 동시성\", sec: 140, why: \"고정 시간 대기\" },\n  { n: \"검색 색인\", sec: 130, why: \"매번 DB 새로 채움\" },\n  { n: \"권한 매트릭스\", sec: 95, why: \"매번 DB 새로 채움\" },\n  { n: \"그 밖 2,190개\", sec: 330, why: \"보통\" }\n];\n\nconst total = tests.reduce((s, t) => s + t.sec, 0);\nout.push(\"전체 \" + (total / 60).toFixed(1) + \"분\");\nout.push(\"\");\nout.push(\"묶음                  시간    비율    누적    느린 이유\");\nlet cum = 0;\ntests.forEach((t) => {\n  cum += t.sec;\n  out.push(t.n.padEnd(22) + (t.sec + \"초\").padEnd(8) +\n    (Math.round(t.sec / total * 100) + \"%\").padEnd(8) +\n    (Math.round(cum / total * 100) + \"%\").padEnd(8) + t.why);\n});\n\nconst FIX = {\n  \"고정 시간 대기\": \"조건이 될 때까지 짧게 확인 — 대개 90% 가 준다\",\n  \"매번 브라우저 띄움\": \"한 번 띄워 나눠 쓰거나 더 싼 층으로 옮긴다\",\n  \"실제 메일 서버 호출\": \"가짜로 바꾼다 — 메일 전송은 여기서 확인할 것이 아니다\",\n  \"매번 DB 새로 채움\": \"한 번 채우고 트랜잭션으로 되돌린다\",\n  \"보통\": \"그대로 둔다\"\n};\nconst byWhy = {};\ntests.forEach((t) => { byWhy[t.why] = (byWhy[t.why] || 0) + t.sec; });\nout.push(\"\");\nout.push(\"이유              합계     처방\");\nObject.keys(byWhy).sort((a, b) => byWhy[b] - byWhy[a]).forEach((w) => {\n  out.push(w.padEnd(18) + (byWhy[w] + \"초\").padEnd(9) + FIX[w]);\n});\n\nconst top3 = tests.slice(0, 3).reduce((s, t) => s + t.sec, 0);\nconst fixable = total - byWhy[\"보통\"];\nout.push(\"\");\nout.push(\"상위 3개가 전체의 \" + Math.round(top3 / total * 100) + \"%\");\nout.push(\"고칠 이유가 붙은 것이 전체의 \" + Math.round(fixable / total * 100) + \"%\");\nout.push(\"시간은 한쪽으로 크게 쏠린다 — 몇 개만 고쳐도 크게 준다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "고친 뒤와 나눠 돌린 뒤를 견준다", type: "build",
    goal: "처방을 적용한 시간과, 그것을 <b>여러 대로 나눠 돌린</b> 시간을 계산하세요.\n나눌 때 한쪽에 몰리지 않게 배분합니다.",
    hint: "나눠 돌릴 때 가장 흔한 실수는 <b>개수로 나누는 것</b>입니다. 시간이 크게 다르면 느린 것들이 한 대에 몰려 그 대가 전체 시간을 정합니다. 시간이 긴 것부터 <b>지금 가장 한가한 대</b>에 주면 훨씬 고르게 나뉩니다. 그리고 아무리 나눠도 <b>가장 느린 테스트 하나</b>보다 짧아질 수 없습니다.",
    acc: "고친 뒤 총 시간과 대수별 배분 결과가 나오고, 가장 느린 테스트가 하한이 되는 것이 보이면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\nconst BEFORE_MIN = 21;\n\n/* 처방을 적용한 뒤의 시간 — 느린 것들이 크게 줄었다 */\nconst after = [\n  { n: \"결제 전체 흐름\", sec: 21 },\n  { n: \"주문 목록 렌더\", sec: 34 },\n  { n: \"회원가입 흐름\", sec: 6 },\n  { n: \"재고 동시성\", sec: 14 },\n  { n: \"검색 색인\", sec: 16 },\n  { n: \"권한 매트릭스\", sec: 11 }\n];\nfor (let i = 0; i < 60; i++) after.push({ n: \"기타\" + i, sec: 5.5 });\n\nconst total = after.reduce((s, t) => s + t.sec, 0);\nout.push(\"고치기 전 \" + BEFORE_MIN + \".0분 → 고친 뒤 \" + (total / 60).toFixed(1) +\n  \"분 (한 대에서)\");\n\nfunction split(n, byCount) {\n  const lanes = new Array(n).fill(0);\n  const list = byCount ? after.slice() : after.slice().sort((a, b) => b.sec - a.sec);\n  list.forEach((t, i) => {\n    /* 개수로 나누면 순서대로, 시간으로 나누면 가장 한가한 대에 준다 */\n    const at = byCount ? i % n : lanes.indexOf(Math.min.apply(null, lanes));\n    lanes[at] += t.sec;\n  });\n  return { max: Math.max.apply(null, lanes), min: Math.min.apply(null, lanes) };\n}\n\nconst slowest = Math.max.apply(null, after.map((t) => t.sec));\nout.push(\"\");\nout.push(\"대수   개수로 나눔   시간으로 나눔   가장 느린 테스트\");\n[1, 2, 4, 8, 16, 32].forEach((n) => {\n  const a = split(n, true), b = split(n, false);\n  out.push(String(n).padEnd(7) + (a.max.toFixed(0) + \"초\").padEnd(14) +\n    (b.max.toFixed(0) + \"초\").padEnd(16) + slowest + \"초\");\n});\n\nout.push(\"\");\nout.push(\"개수로 나누면 느린 것이 한 대에 몰려 그 대가 전체 시간을 정한다\");\nout.push(\"시간이 긴 것부터 가장 한가한 대에 주면 훨씬 고르게 나뉜다\");\nout.push(\"아무리 나눠도 가장 느린 테스트 하나(\" + slowest + \"초)보다 짧아지지 않는다\");\nout.push(\"→ 더 줄이려면 그 테스트를 쪼개거나 더 싼 층으로 옮겨야 한다\");\nconsole.log(out.join(\"\\n\"));\n" },

  { t: "무엇을 언제 돌릴 것인가", type: "decide",
    goal: "고쳐서 4분이 됐습니다. 더 줄이고 싶지만 남은 것은 정말 필요한 테스트입니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "빠른 것을 먼저 돌려 몇 초 안에 대부분의 실패를 알리고, 나머지는 뒤에 이어 돌린다",
        fx: { performance: 3, system_design: 2 },
        fb: "✅ <b>총 시간보다 첫 실패까지의 시간이 중요합니다.</b> 단위 테스트를 먼저 돌리면 대부분의 실수는 몇 초 안에 잡히고, 그동안 느린 테스트가 이어서 돕니다. 4분을 기다리는 것과 10초 만에 알고 나머지를 배경에서 보는 것은 체감이 완전히 다릅니다.",
        best: true },
      { label: "커밋마다 전부 돌리는 것을 그만두고 병합 전에만 돌린다",
        fx: { performance: 1, system_design: -1 },
        fb: "△ 시간은 아끼지만 <b>깨진 것을 늦게 압니다.</b> 커밋 여러 개가 쌓인 뒤에 실패하면 어느 것이 원인인지 찾기 어려워집니다." },
      { label: "바뀐 파일에 닿는 테스트만 돌린다",
        fx: { performance: 2 },
        fb: "△ 효과가 크고 함께 씁니다. 다만 의존 목록이 실제보다 좁으면 놓치므로, <b>병합 전에는 전부 돌리는</b> 안전망이 있어야 합니다." },
      { label: "4분이면 충분하니 그만둔다",
        fx: { performance: 1 },
        fb: "△ 합리적인 판단일 수 있습니다. <b>하루 30번이면 2시간</b>이므로 더 줄일 값어치가 있는지 계산해 보고 정하면 됩니다." }] },

  { t: "회고 — 되먹임이 얼마나 빨라졌나", type: "note",
    goal: "총 시간이 아니라 <b>첫 실패를 아는 데 걸리는 시간</b>으로 다시 재세요.\n그것이 실제로 개발 속도를 정합니다.",
    ph: "전체 21분 → ? / 첫 실패까지 걸리는 시간 / 하루 빌드 횟수 × 절약 시간 / 가장 느린 테스트와 그 이유 / 밤에만 돌리기로 한 것 / 다시 느려지는 것을 무엇이 막나" }]
},

/* ─────────────────────────────────────────────── python */
{
  lv: 4, em: "📦",
  title: "내 컴퓨터에서는 되는데요",
  desc: "환경마다 다르게 도는 파이썬 프로젝트를 의존성 고정·격리·재현 가능한 빌드로 다루어 어디서든 같게 만든다",
  skills: ["python", "devops", "code"],
  phases: [

  { t: "어디서 어떻게 다른지 적는다", type: "note",
    goal: "환경별로 <b>무엇이 다른지</b> 적으세요.\n'안 된다' 가 아니라 어느 버전에서 무엇이 어떻게 다른지 적습니다.",
    ph: "예: 로컬 3.11 · CI 3.9 · 운영 3.10 · pandas 로컬 2.1 운영 1.5 · 정렬 결과가 달라 리포트 숫자가 어긋남 · requirements.txt 에 버전이 없는 패키지 14개 · CI 는 되는데 운영만 실패" },

  { t: "왜 환경마다 다른가", type: "decide",
    goal: "같은 코드인데 환경마다 다른 결과가 나옵니다.",
    sit: "무엇이 원인입니까?",
    opts: [
      { label: "버전을 고정하지 않아 설치 시점마다 다른 것이 깔린다 — 코드는 같아도 의존성이 다르다",
        fx: { coding: 3, system_design: 2 },
        fb: "✅ <b>같은 코드가 같은 프로그램은 아닙니다.</b> 버전을 안 적으면 설치하는 날에 따라 다른 것이 깔리고, 간접 의존성까지 치면 수십 개가 제각각입니다. 무엇이 깔렸는지 <b>정확히 적어 두고 그대로 설치</b>해야 어디서든 같아집니다.",
        best: true },
      { label: "파이썬 버전이 달라서",
        fx: { coding: 2 },
        fb: "△ 실제 요인이고 함께 고정해야 합니다. 다만 <b>파이썬만 맞춰도</b> 패키지가 제각각이면 여전히 다르게 돕니다." },
      { label: "운영 체제가 달라서",
        fx: { coding: 1 },
        fb: "△ 경로 구분자나 컴파일된 확장에서 차이가 납니다. 다만 <b>대부분의 차이는 버전</b>에서 오고, OS 차이는 그 다음입니다." },
      { label: "가상 환경을 안 써서",
                fx: { coding: 2 },
        fb: "△ 격리는 꼭 필요하고 다른 프로젝트와 섞이는 것을 막습니다. 다만 격리만 하고 <b>버전을 안 적으면</b> 격리된 환경끼리 여전히 다릅니다." }] },

  { t: "무엇이 깔렸는지 정확히 적는다", type: "build",
    goal: "느슨한 의존성 목록과 <b>전부 고정한 목록</b>이 어떻게 다른지 보이세요.\n간접 의존성까지 세어 봅니다.",
    hint: "직접 적은 패키지는 몇 개여도 그것들이 <b>끌고 오는 것</b>이 훨씬 많습니다. 직접 것만 고정하면 간접 것은 여전히 설치 시점마다 달라집니다. 그래서 실제로 깔린 <b>전부를 적어 두는</b> 파일과, 사람이 관리하는 <b>직접 의존성 파일</b>을 나눠 두는 방식이 널리 쓰입니다.",
    acc: "직접·간접 의존성 수와 고정 여부가 나오고, 느슨한 목록에서 나올 수 있는 조합 수가 계산되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 직접 적은 것과 그것들이 끌고 오는 것 */\nconst direct = [\n  { n: \"pandas\", spec: \">=1.5\", versions: [\"1.5.3\", \"2.0.3\", \"2.1.4\", \"2.2.0\"] },\n  { n: \"requests\", spec: \"\", versions: [\"2.28.2\", \"2.31.0\", \"2.32.3\"] },\n  { n: \"fastapi\", spec: \"==0.104.1\", versions: [\"0.104.1\"] },\n  { n: \"pydantic\", spec: \">=2\", versions: [\"2.4.2\", \"2.6.1\", \"2.7.0\"] }\n];\nconst indirect = [\n  \"numpy\", \"python-dateutil\", \"pytz\", \"six\", \"urllib3\", \"idna\",\n  \"certifi\", \"charset-normalizer\", \"starlette\", \"anyio\", \"sniffio\",\n  \"typing-extensions\", \"annotated-types\", \"pydantic-core\", \"click\"\n];\n\nout.push(\"직접 적은 것 \" + direct.length + \"개 · 끌려 오는 것 \" + indirect.length + \"개\");\nout.push(\"\");\nout.push(\"패키지        적은 것        고를 수 있는 버전\");\ndirect.forEach((d) => out.push(d.n.padEnd(14) +\n  (d.spec || \"(안 적음)\").padEnd(15) + d.versions.length + \"가지\"));\n\nconst combos = direct.reduce((s, d) => s * d.versions.length, 1);\nout.push(\"\");\nout.push(\"직접 의존성만으로 나올 수 있는 조합: \" + combos + \"가지\");\nout.push(\"간접까지 치면 사실상 셀 수 없다 — 설치하는 날마다 다른 프로그램이다\");\n\nout.push(\"\");\nout.push(\"전부 고정하면\");\nout.push(\"  직접 \" + direct.length + \"개 + 간접 \" + indirect.length + \"개 = \" +\n  (direct.length + indirect.length) + \"개를 정확한 버전으로 적는다\");\nout.push(\"  조합: 1가지\");\nout.push(\"\");\nout.push(\"두 파일로 나눠 둔다\");\nout.push(\"  · 사람이 관리하는 것 — '무엇이 필요한가' (pandas>=1.5)\");\nout.push(\"  · 도구가 만드는 것   — '무엇이 깔렸는가' (전부 == 로 고정)\");\nout.push(\"  설치는 아래 파일로, 올릴 때만 위 파일을 고친다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "고정한 것이 정말 같은지 확인한다", type: "build",
    goal: "버전을 고정해도 <b>같은 파일이 깔렸는지</b>는 다른 문제입니다.\n해시로 확인하는 방법과 그 값어치를 보이세요.",
    hint: "같은 버전 번호가 붙은 파일이 바뀌는 일이 실제로 있습니다 — 실수로 다시 올리거나, 저장소가 공격당하거나, 미러가 다르거나. <b>파일의 해시를 함께 적어 두면</b> 다른 파일이 오면 설치가 멈춥니다. 버전 고정이 '무엇을' 을 정한다면 해시는 '정확히 그것인가' 를 확인합니다.",
    acc: "버전만 맞고 내용이 다른 경우가 해시 검사에서 걸리는 것이 출력되면 완료입니다.",
    lang: "javascript",
    sol: "const out = [];\n\n/* 아주 단순한 해시 — 진짜는 sha256 을 쓴다 */\nfunction hash(s) {\n  let h = 2166136261;\n  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }\n  return ((h >>> 0).toString(16)).padStart(8, \"0\");\n}\n\nconst lock = [\n  { n: \"pandas\", ver: \"2.1.4\", sha: hash(\"pandas-2.1.4-real\") },\n  { n: \"requests\", ver: \"2.31.0\", sha: hash(\"requests-2.31.0-real\") },\n  { n: \"fastapi\", ver: \"0.104.1\", sha: hash(\"fastapi-0.104.1-real\") }\n];\n\n/* 저장소에서 실제로 받은 파일들 — requests 만 내용이 다르다 */\nconst got = [\n  { n: \"pandas\", ver: \"2.1.4\", body: \"pandas-2.1.4-real\" },\n  { n: \"requests\", ver: \"2.31.0\", body: \"requests-2.31.0-TAMPERED\" },\n  { n: \"fastapi\", ver: \"0.104.1\", body: \"fastapi-0.104.1-real\" }\n];\n\nout.push(\"패키지       버전만 확인   해시까지 확인\");\nlet stopped = null;\ngot.forEach((g) => {\n  const want = lock.filter((l) => l.n === g.n)[0];\n  const verOk = want && want.ver === g.ver;\n  const shaOk = want && want.sha === hash(g.body);\n  if (!shaOk && !stopped) stopped = g.n;\n  out.push(g.n.padEnd(13) + (verOk ? \"통과      \" : \"실패      \").padEnd(14) +\n    (shaOk ? \"통과\" : \"실패 — 다른 파일이다\"));\n});\n\nout.push(\"\");\nout.push(\"버전만 보면 셋 다 통과한다\");\nout.push(\"해시까지 보면 \" + stopped + \" 에서 멈춘다 — 같은 버전 번호의 다른 파일\");\nout.push(\"\");\nout.push(\"같은 버전 번호의 파일이 바뀌는 일은 실제로 있다\");\nout.push(\"  · 실수로 다시 올림  · 저장소가 공격당함  · 미러가 다름\");\nout.push(\"버전 고정이 '무엇을' 을 정한다면 해시는 '정확히 그것인가' 를 확인한다\");\nconsole.log(out.join(\"\\n\"));" },

  { t: "어디까지 똑같이 만들 것인가", type: "decide",
    goal: "의존성을 고정했는데도 운영에서만 실패하는 것이 남았습니다.",
    sit: "어떻게 하시겠습니까?",
    opts: [
      { label: "실행 환경 전체를 이미지로 굳혀, 개발·CI·운영이 같은 것을 돌린다",
        fx: { system_design: 3, coding: 2 },
        fb: "✅ <b>파이썬과 패키지 밖에도 다른 것이 있습니다</b> — 시스템 라이브러리, 로케일, 시간대, 컴파일된 확장. 이것들까지 이미지에 굳히면 '내 컴퓨터에서는' 이라는 말 자체가 성립하지 않게 됩니다. 개발도 그 이미지 안에서 하는 것이 핵심이고, 그러지 않으면 다시 갈라집니다.",
        best: true },
      { label: "운영과 같은 OS 를 개발에도 깐다",
        fx: { coding: 1 },
        fb: "△ 차이가 줄지만 <b>사람마다 설치 상태가 다릅니다.</b> 시간이 지나면 각자의 기계가 조금씩 갈라져 원점으로 돌아옵니다." },
      { label: "실패하는 것을 하나씩 고친다",
        fx: { coding: -1 },
        fb: "⚠️ 끝이 없습니다. 하나 고치면 다음 것이 나오고, <b>왜 다른지</b>를 다루지 않았기 때문에 새 환경이 생길 때마다 반복됩니다." },
      { label: "운영에서 직접 디버깅한다",
        fx: { security: -2, system_design: -1 },
        fb: "⚠️ 위험하고 재현도 안 됩니다. 운영에 도구를 깔면 <b>그 환경 자체가 또 달라져</b> 문제가 사라지기도 합니다." }] },

  { t: "회고 — 무엇이 아직 다른가", type: "note",
    goal: "굳힌 것과 <b>아직 다른 것</b>을 나눠 적으세요.\n다르게 두기로 한 것에는 그 이유도 적습니다.",
    ph: "고정한 패키지 수 / 해시 검사 도입 여부 / 이미지에 굳힌 것 / 아직 다른 것(데이터·설정·비밀) / 다르게 두기로 한 것과 이유 / '내 컴퓨터에서는' 이 몇 번 나왔나(전 vs 후)" }]
}

]};
