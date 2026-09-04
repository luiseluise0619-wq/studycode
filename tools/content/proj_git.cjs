/* Git 트랙 전용 프로젝트 — 저장소 하나를 '팀처럼' 굴려 본다.
   혼자 하더라도 브랜치·리뷰·되돌리기·자동화까지 한 바퀴를 돌면
   실무에서 만나는 상황이 대부분 이 안에 들어 있다.

   data/projects.js 의 tracks 갈래에 붙인다 (skills[0] 이 "git" 이라야 전용으로 잡힌다). */
module.exports = {
  lv: 2, em: "🌿",
  title: "혼자서 팀처럼 — 저장소 한 바퀴",
  desc: "브랜치를 따고, 충돌을 만들어 풀고, 잘못 올린 것을 되돌리고, 자동 검사를 붙인다. Git 에서 만나는 상황을 일부러 한 번씩 겪어 본다",
  skills: ["git", "devops", "code"],
  phases: [

  { t: "규칙을 먼저 적는다", type: "note",
    goal: "코드를 만지기 전에 <b>이 저장소의 규칙</b>을 적으세요.\n브랜치 이름은 어떻게 지을지, 무엇을 커밋하지 않을지, <code>main</code> 에 직접 푸시할지를 정합니다.",
    ph: "예: 브랜치는 feature/설명 · main 직접 푸시 금지 · .env 와 빌드 산출물은 커밋하지 않는다 · 커밋 제목은 한 줄 50자 이내" },

  { t: "저장소를 세우고 첫 커밋", type: "build",
    goal: "빈 폴더를 저장소로 만들고, 무시할 것을 먼저 정한 뒤 첫 커밋을 남기세요.\n<b>무시 규칙을 첫 커밋에 넣는 것</b>이 중요합니다 — 나중에 넣으면 이미 추적된 파일은 계속 따라옵니다.",
    hint: "순서가 요령입니다. ① <code>git init</code> ② <code>.gitignore</code> 작성 ③ 나머지 파일 추가 ④ 커밋. 이미 추적된 파일을 뒤늦게 빼려면 <code>git rm --cached</code> 가 필요해집니다.",
    acc: "<code>git status</code> 가 깨끗하고, <code>.env</code> 같은 무시 대상 파일을 만들어도 Untracked 목록에 뜨지 않으면 완료입니다.",
    lang: "bash",
    sol: "mkdir demo && cd demo\ngit init -q\n\n# 무시 규칙을 '먼저' 만든다 — 추적이 시작되기 전에\ncat > .gitignore <<'EOF'\nnode_modules/\ndist/\n.env\n*.log\n!.env.example\nEOF\n\necho 'API_KEY=' > .env.example\necho '# demo' > README.md\n\ngit add .\ngit commit -qm \"저장소 초기화와 무시 규칙\"\n\n# 확인: 무시가 실제로 먹는지\necho 'API_KEY=secret' > .env\ngit status --short          # .env 가 보이지 않아야 한다\ngit check-ignore -v .env    # 어떤 규칙이 걸렸는지 알려 준다" },

  { t: "무엇을 커밋에 담을 것인가", type: "decide",
    goal: "버그 수정 하나와, 하는 김에 정리한 코드 포맷 변경이 같은 파일에 섞였습니다.",
    sit: "커밋을 어떻게 나누시겠습니까?",
    opts: [
      { label: "git add -p 로 조각을 나눠 버그 수정과 포맷 정리를 각각 커밋한다",
        fx: { coding: 3, debugging: 2, leadership: 1 },
        fb: "✅ 커밋의 단위는 크기가 아니라 <b>되돌릴 수 있는 단위</b>입니다. 나중에 버그 수정만 다른 브랜치로 옮기거나 되돌려야 할 때, 섞여 있으면 방법이 없습니다. 리뷰어도 '이 줄은 버그 때문인가 정리 때문인가' 를 묻지 않게 됩니다.",
        best: true },
      { label: "한 번에 커밋하고 메시지에 두 가지를 다 적는다",
        fx: { coding: -1 },
        fb: "⚠️ 메시지에 '그리고' 가 들어가면 대개 커밋이 두 개여야 한다는 신호입니다. 되돌릴 때 한쪽만 고를 수 없고, <code>git bisect</code> 로 범인을 좁혀도 어느 쪽이 원인인지 알 수 없습니다." },
      { label: "포맷 정리를 되돌리고 버그 수정만 커밋한다",
        fx: { coding: 1, leadership: -1 },
        fb: "⚠️ 안전하긴 하지만 한 일을 버리는 선택입니다. 포맷 정리는 별도 커밋으로 남기고, 대량 포맷 커밋이라면 <code>.git-blame-ignore-revs</code> 에 적어 blame 을 가리지 않게 하면 됩니다." },
      { label: "포맷 정리만 먼저 푸시하고 버그 수정은 내일 한다",
        fx: { debugging: -2 },
        fb: "⚠️ 고쳐 둔 버그를 손에 들고 하루를 보내는 것이 가장 손해입니다. 순서를 바꿀 이유가 없고, 그 사이 다른 사람이 같은 버그를 다시 만납니다." }] },

  { t: "브랜치를 따고 충돌을 만들어 푼다", type: "build",
    goal: "브랜치 두 개에서 <b>같은 줄</b>을 서로 다르게 고쳐 충돌을 일부러 만드세요. 그리고 해결하고 병합까지 끝냅니다.\n충돌은 사고가 아니라 <b>'여기는 사람이 정하라'</b> 는 표시라는 것을 손으로 확인하는 단계입니다.",
    hint: "충돌 파일에는 <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> · <code>=======</code> · <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> 세 줄이 들어갑니다. 해결이란 <b>그 세 줄을 모두 지우고</b> 최종 코드만 남기는 일이고, 끝나면 <code>git add</code> 로 해결됐음을 알립니다.",
    acc: "병합 후 파일에 충돌 표식이 하나도 남아 있지 않고, <code>git log --oneline --graph</code> 에 갈라졌다 합쳐진 모양이 보이면 완료입니다.",
    lang: "bash",
    sol: "printf 'line1\\nline2\\nline3\\n' > app.txt\ngit add app.txt && git commit -qm \"기준 파일\"\n\ngit switch -qc feature/a\nsed -i '2s/.*/line2 from A/' app.txt\ngit commit -qam \"A 가 2번 줄을 고침\"\n\ngit switch -q -\ngit switch -qc feature/b\nsed -i '2s/.*/line2 from B/' app.txt\ngit commit -qam \"B 가 2번 줄을 고침\"\n\ngit switch -q main\ngit merge -q feature/a          # 여기는 fast-forward\ngit merge feature/b || true      # 여기서 충돌\n\ngrep -n '<<<<<<<\\|=======\\|>>>>>>>' app.txt   # 표식 확인\n\n# 해결: 표식을 지우고 최종 내용만 남긴다\nprintf 'line1\\nline2 from A and B\\nline3\\n' > app.txt\ngit add app.txt\ngit commit -qm \"두 변경을 합침\"\n\ngit log --oneline --graph --all" },

  { t: "잘못 올린 것을 어떻게 되돌릴까", type: "decide",
    goal: "설정 파일에 든 API 키를 실수로 커밋해 <code>main</code> 에 푸시했고, 동료 두 명이 이미 받아 갔습니다.",
    sit: "무엇을 가장 먼저 하시겠습니까?",
    opts: [
      { label: "그 키를 즉시 폐기하고 새로 발급한 뒤, 커밋을 revert 한다",
        fx: { security: 4, system_design: 1 },
        fb: "✅ 푸시된 순간 이미 공개되었다고 봐야 합니다. 공개 저장소는 봇이 초 단위로 훑습니다. <b>폐기가 최우선</b>이고, 코드 정리는 그 다음입니다. 역사를 다시 써도 이미 받아 간 사본은 되돌릴 수 없습니다.",
        best: true },
      { label: "git reset --hard 로 커밋을 지우고 강제 푸시한다",
        fx: { security: -2, leadership: -2 },
        fb: "⚠️ 키는 여전히 살아 있고, 동료의 저장소와 역사가 어긋나 다음 pull 에서 엉킵니다. 무엇보다 <b>이미 유출된 값은 코드에서 지운다고 돌아오지 않습니다.</b>" },
      { label: "다음 커밋에서 그 줄만 지운다",
        fx: { security: -3 },
        fb: "⚠️ 과거 커밋에는 그대로 남아 있어 누구나 <code>git show</code> 로 볼 수 있습니다. 지웠다는 사실이 오히려 '여기 뭔가 있었다' 는 표시가 되기도 합니다." },
      { label: "저장소를 비공개로 바꾸고 지켜본다",
        fx: { security: -2 },
        fb: "⚠️ 이미 클론했거나 캐시된 사본에는 영향이 없습니다. 공개 기간이 1분이었더라도 자동 수집 도구에는 충분한 시간입니다." }] },

  { t: "되돌리기 세 가지를 손으로 구분한다", type: "build",
    goal: "같은 저장소에서 <b>restore · reset · revert</b> 를 각각 한 번씩 써 보고, 무엇이 어떻게 달라지는지 <code>git log</code> 로 확인하세요.\n세 명령이 건드리는 <b>공간이 다르다</b>는 것을 눈으로 봅니다.",
    hint: "먼저 '지금 무엇을 되돌리려는가' 를 말로 정하세요. <b>작업 폴더의 수정</b>이면 <code>restore</code>, <b>스테이지</b>면 <code>restore --staged</code>, <b>커밋</b>이면 <code>reset</code>(역사를 지움) 또는 <code>revert</code>(취소 커밋을 쌓음)입니다.",
    acc: "<code>revert</code> 후 커밋이 <b>하나 늘어나</b> 있고, <code>reset --soft</code> 후에는 커밋이 <b>하나 줄었는데</b> 변경 내용이 스테이지에 그대로 남아 있으면 완료입니다.",
    lang: "bash",
    sol: "echo v1 > f.txt && git add f.txt && git commit -qm \"v1\"\n\n# ① 작업 폴더의 수정만 버린다\necho 잘못된수정 > f.txt\ngit restore f.txt\ncat f.txt                       # v1 로 돌아와 있다\n\n# ② add 를 취소한다 (수정은 남는다)\necho v2 > f.txt && git add f.txt\ngit restore --staged f.txt\ngit status --short              # ' M f.txt' — 수정은 살아 있다\n\n# ③ 커밋을 취소한다 — 두 방식\ngit commit -qam \"v2\"\nbefore=$(git rev-list --count HEAD)\n\ngit revert --no-edit -q HEAD    # 취소 '커밋' 을 쌓는다\n[ $(git rev-list --count HEAD) -eq $((before+1)) ] && echo \"revert: 커밋이 하나 늘었다\"\n\ngit reset -q --soft HEAD~1      # 역사를 뒤로 — 내용은 스테이지에 남는다\ngit diff --cached --name-only   # f.txt 가 남아 있다" },

  { t: "기계가 대신 볼 것을 정한다", type: "decide",
    goal: "리뷰에서 들여쓰기와 따옴표 지적이 반복되고, 가끔 테스트를 깨뜨린 코드가 <code>main</code> 에 들어갑니다.",
    sit: "무엇부터 손대시겠습니까?",
    opts: [
      { label: "포매터·린터·테스트를 CI 에 걸고, 통과해야 병합되도록 브랜치 보호를 켠다",
        fx: { system_design: 3, leadership: 3, coding: 1 },
        fb: "✅ 정답이 하나로 정해지는 일은 기계에게 넘기는 것이 언제나 이깁니다. 사람이 포맷을 지적하면 시간과 감정이 함께 소모되지만, 기계가 하면 아무도 기분 나쁘지 않습니다. 사람은 그 위에서 <b>설계와 빠진 케이스</b>를 봅니다.",
        best: true },
      { label: "리뷰 체크리스트를 만들어 사람이 빠짐없이 확인하게 한다",
        fx: { leadership: 1, system_design: -1 },
        fb: "⚠️ 체크리스트는 판단이 필요한 항목에 값어치가 있습니다. 기계가 0초에 끝낼 수 있는 것을 사람 규율로 막으면, 바쁠 때 가장 먼저 무너집니다." },
      { label: "커버리지 80% 미만이면 병합을 막는 규칙을 추가한다",
        fx: { coding: -1, leadership: -1 },
        fb: "⚠️ 측정값이 목표가 되면 <b>측정값만</b> 좋아집니다. 어서션 없는 테스트로도 커버리지는 오릅니다. 측정은 보여 주되 차단은 신중해야 합니다." },
      { label: "main 에 직접 푸시를 허용하되 문제가 생기면 즉시 되돌린다",
        fx: { system_design: -2, leadership: -2 },
        fb: "⚠️ 되돌리기가 쉬운 것은 사실이지만, 깨진 <code>main</code> 은 그 사이 모든 사람의 시간을 함께 태웁니다. 막는 비용보다 언제나 비쌉니다." }] },

  { t: "자동 검사를 붙인다", type: "build",
    goal: "푸시와 PR 마다 도는 워크플로를 만드세요. <b>충돌 표식이 남은 파일</b>이 있으면 실패시키는 검사도 함께 넣습니다.\n'사람이 잊어도 기계는 잊지 않는다' 를 실제로 만들어 보는 단계입니다.",
    hint: "잡은 아무것도 없는 머신에서 시작하므로 <code>actions/checkout</code> 이 첫 스텝입니다. 충돌 표식 검사는 <code>git grep</code> 으로 충분하고, <b>찾지 못했을 때 성공</b>이 되도록 종료 코드를 뒤집어야 합니다.",
    acc: "충돌 표식이 든 파일을 일부러 커밋하면 워크플로가 실패하고, 지우면 통과하면 완료입니다.",
    lang: "yaml",
    sol: "# .github/workflows/ci.yml\nname: CI\non: [push, pull_request]\n\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n\n      # 충돌 표식이 남은 채 커밋되는 사고를 막는다.\n      # grep 은 '찾으면 0' 이므로 뒤집어야 '없을 때 성공' 이 된다.\n      - name: 충돌 표식 검사\n        run: |\n          if git grep -nE '^(<{7}|={7}|>{7})( |$)' -- . ; then\n            echo \"충돌 표식이 남아 있습니다\"\n            exit 1\n          fi\n\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test" },

  { t: "한 바퀴를 돌아보고 규칙을 고친다", type: "note",
    goal: "처음에 적은 규칙 중 <b>실제로 지켜진 것</b>과 <b>지켜지지 않은 것</b>을 나눠 적으세요.\n지켜지지 않았다면 사람의 문제가 아니라 <b>규칙이나 도구의 문제</b>일 가능성이 큽니다.",
    ph: "예: 브랜치 이름 규칙은 지켜졌다 · main 직접 푸시는 두 번 있었다 → 브랜치 보호로 막는다 · 커밋 제목 50자는 자주 넘었다 → 훅으로 경고만 띄운다" }

]};
