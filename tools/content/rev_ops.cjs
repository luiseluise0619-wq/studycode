/* 코드 리뷰 16문항 — 리뷰가 하나도 없던 네 트랙(git·linux·test·cloud)에 4개씩.
   읽는 것은 코드만이 아니다: 워크플로 YAML, 셸 스크립트, 테스트 코드, 인프라 정의도
   전부 리뷰 대상이고 사고는 대개 거기서 난다.

   보기 순서는 일부러 흩어 두었다 — 결함이 늘 같은 자리에 있으면 읽지 않아도 골라진다. */
module.exports = [

/* ══════════════ git ══════════════ */
{
  t: "review", k: "배포 워크플로", cat: "review", d: 3, track: "git",
  q: "이 GitHub Actions 워크플로의 결함을 모두 고르세요",
  code: "on:\n  pull_request_target:\n    types: [opened, synchronize]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@main\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n      - run: npm install && npm test\n        env:\n          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}",
  items: [
    { txt: "<code>pull_request_target</code> 은 <b>기본 브랜치의 워크플로 권한</b>으로 도는데 거기에 포크의 코드를 체크아웃해 실행했다. 외부인이 보낸 PR 의 코드가 시크릿을 그대로 읽는다.", bad: true },
    { txt: "<code>runs-on: ubuntu-latest</code> 는 러너 이미지가 바뀔 때마다 환경이 달라지므로, 완전한 재현을 원한다면 <code>ubuntu-22.04</code> 처럼 고정한다.", bad: false },
    { txt: "<code>actions/checkout@main</code> 은 액션의 <b>움직이는 브랜치</b>를 가리켜, 그 저장소가 바뀌면 우리 CI 에서 남의 새 코드가 돈다. 공급망 방어의 기본은 커밋 SHA 로 고정하는 것이다.", bad: true },
    { txt: "<code>types: [opened, synchronize]</code> 를 명시했으므로 PR 을 다시 열었을 때(<code>reopened</code>)는 돌지 않는다 — 검사 결과가 남아 있어 대개 문제되지 않는다.", bad: false },
    { txt: "<code>npm test</code> 가 실패해도 <code>&amp;&amp;</code> 로 이어 붙였기 때문에 앞 명령의 종료 코드가 가려져 워크플로가 초록불이 된다.", bad: false },
    { txt: "<code>npm install</code> 은 lock 파일이 있어도 버전을 올릴 수 있어 CI 마다 다른 의존성이 깔린다 — <code>npm ci</code> 는 lock 그대로만 설치하고 어긋나면 실패하므로 재현이 보장된다.", bad: true },
  ],
  ex: "결함 3가지. (1) <b><code>pull_request_target</code> + 포크 코드 체크아웃</b> — 이 조합이 GitHub Actions 에서 가장 잘 알려진 시크릿 탈취 경로다. 외부 PR 을 검사하려면 <code>pull_request</code> 를 쓰고 시크릿을 주지 않는다. (2) 액션을 <code>@main</code> 으로 참조하면 남의 저장소 변경이 우리 CI 에서 곧바로 실행된다 — 커밋 SHA 로 고정한다. (3) <code>npm install</code> 은 lock 을 넘어설 수 있어 CI 재현이 깨진다.\n디스트랙터: 러너 이미지 고정은 좋은 습관이지만 지금 결함은 아니다. <code>reopened</code> 누락은 팀 규칙의 문제다. <code>&amp;&amp;</code> 는 앞이 실패하면 뒤를 실행하지 않고 그 종료 코드가 그대로 전달되므로 초록불이 되지 않는다.",
},
{
  t: "review", k: "무시 파일과 새어 나간 비밀", cat: "review", d: 2, track: "git",
  q: "이 <code>.gitignore</code> 와 커밋 절차의 결함을 모두 고르세요",
  code: "# .gitignore\nnode_modules\n.env\n*.log\n\n# 방금 한 일\n# 1. .env 를 실수로 커밋해 푸시했다\n# 2. .gitignore 에 .env 를 추가했다\n# 3. git rm --cached .env 로 추적을 끊고 커밋했다\n# 4. 팀에 '해결됐다' 고 알렸다",
  items: [
    { txt: "<code>node_modules</code> 앞에 슬래시를 붙여 <code>/node_modules</code> 로 적지 않으면 하위 디렉터리의 같은 이름까지 함께 무시된다 — 대개 그것을 원하지만 의도라면 명시하는 편이 읽기 좋다.", bad: false },
    { txt: "<code>git rm --cached</code> 는 <b>앞으로</b> 추적하지 않게 할 뿐 이미 푸시된 커밋 안의 파일은 그대로 남는다. 원격 이력에서 지우려면 이력을 다시 쓰고 강제 푸시해야 한다.", bad: true },
    { txt: "<code>*.log</code> 는 확장자만 보므로 <code>logs/</code> 디렉터리 전체는 무시되지 않는다 — 로그를 디렉터리째 두는 프로젝트라면 규칙을 하나 더 넣어야 한다.", bad: false },
    { txt: "이력에서 지우더라도 그 비밀은 이미 남의 컴퓨터·포크·CI 로그에 복제됐을 수 있으므로, 먼저 할 일은 <b>키를 폐기하고 재발급</b>받는 것이다. 지우는 것은 그 다음이다.", bad: true },
    { txt: "<code>.gitignore</code> 는 <b>이미 추적 중인 파일에는 적용되지 않는다</b>. 그래서 2번 조치만으로는 아무 일도 일어나지 않고, 3번을 해야 비로소 추적이 끊긴다.", bad: false },
  ],
  ex: "결함 2가지. (1) <b>추적을 끊는 것과 이력에서 지우는 것은 다르다</b> — <code>git rm --cached</code> 뒤에도 옛 커밋을 체크아웃하면 파일이 그대로 나온다. (2) 더 중요한 것은 순서다: 이력에서 지우는 데 성공해도 <b>이미 새어 나간 비밀은 되돌릴 수 없다.</b> 포크·미러·CI 로그·남의 로컬 저장소에 복제됐을 수 있으므로 <b>폐기하고 재발급</b>이 첫 조치다.\n디스트랙터: <code>/node_modules</code> 표기와 <code>logs/</code> 규칙은 취향이나 프로젝트 사정의 문제다. '.gitignore 가 추적 중인 파일에 적용되지 않는다' 는 <b>사실이고</b>, 그래서 추적을 끊는 단계가 필요했던 것이므로 이 절차의 결함이 아니라 올바른 대응이다.",
},
{
  t: "review", k: "커밋을 되돌리는 방법", cat: "review", d: 3, track: "git",
  q: "공유 브랜치에서 잘못된 커밋을 되돌리는 이 절차의 결함을 모두 고르세요",
  code: "# main 에 잘못된 커밋 abc123 이 이미 푸시됐다.\n# 다른 개발자 다섯 명이 그 위에서 작업 중이다.\n\ngit checkout main\ngit reset --hard abc123^\ngit push --force origin main\n\n# 그리고 팀 채널에 남겼다:\n# \"main 정리했습니다. 각자 pull 받으세요.\"",
  items: [
    { txt: "<code>abc123^</code> 는 부모를 가리키므로 병합 커밋이라면 어느 부모인지 모호해진다 — 병합이라면 <code>^1</code> 이나 <code>^2</code> 로 명시해야 뜻이 분명해진다.", bad: false },
    { txt: "이미 푸시된 공유 브랜치를 <b>강제 푸시</b>로 다시 썼다. 다섯 명의 로컬 이력이 원격과 갈라져, 그들이 <code>pull</code> 하면 사라진 커밋이 되살아나거나 충돌이 쏟아진다.", bad: true },
    { txt: "<code>git checkout main</code> 대신 <code>git switch main</code> 을 쓰는 편이 의도가 분명하다 — <code>checkout</code> 은 브랜치 이동과 파일 복원을 겸해서 읽는 사람이 헷갈릴 수 있다.", bad: false },
    { txt: "<code>git revert abc123</code> 이면 이력을 다시 쓰지 않고 <b>되돌리는 커밋을 새로 얹어</b> 같은 결과를 낸다. 공유 브랜치에서는 이쪽이 기본이다.", bad: true },
    { txt: "\"각자 pull 받으세요\" 는 이 상황에서 <b>정확히 반대</b>의 안내다. 그냥 pull 하면 지워진 커밋이 다시 올라오므로, 무엇을 할지 구체적으로 알려야 한다.", bad: true },
    { txt: "<code>reset --hard</code> 는 작업 디렉터리의 변경까지 버리므로, 커밋하지 않은 것이 있었다면 그대로 사라진다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>공유 브랜치에 강제 푸시</b> — 나 혼자의 이력이 아니라 다섯 명이 딛고 선 바닥을 바꾼 것이다. (2) 그래서 <code>revert</code> 가 맞다: 이력을 그대로 두고 되돌리는 커밋을 얹으면 아무도 다치지 않는다. (3) 안내도 틀렸다 — 그냥 pull 하면 지운 커밋이 되살아나므로, 강제 푸시를 했다면 <code>fetch</code> 후 <code>reset --hard origin/main</code> 처럼 정확한 절차를 줘야 한다.\n디스트랙터: <code>^</code> 의 모호함은 병합 커밋일 때의 이야기고 여기서는 알 수 없다. <code>switch</code> 는 읽기 좋은 선택이지 결함이 아니다. <code>reset --hard</code> 가 작업 디렉터리를 버리는 것은 <b>사실이지만</b> 이 절차에서 실제로 잃은 것은 그것이 아니라 남들의 이력이다.",
},
{
  t: "review", k: "PR 로 올린 변경 묶음", cat: "review", d: 2, track: "git",
  q: "이 Pull Request 의 결함을 모두 고르세요",
  code: "제목: 수정\n변경: 파일 47개, +2,180 -1,940\n커밋: 1개 (\"작업\")\n\n포함된 것:\n  - 결제 버그 수정 (3줄)\n  - 전체 코드 포매터 적용 (파일 44개)\n  - 로깅 라이브러리 교체\n  - .env.example 에 새 설정 키 추가\n\n설명란: (비어 있음)",
  items: [
    { txt: "포매터 적용 44개 파일이 실제 변경 3줄을 <b>덮어 버린다</b>. 리뷰어가 결제 수정을 찾을 수 없으므로, 포매팅은 별도 PR 로 분리한다.", bad: true },
    { txt: "커밋이 하나뿐이라 리뷰어가 단계별로 따라갈 수 없다 — 다만 스쿼시 병합을 쓰는 팀이라면 최종 이력에는 어차피 한 커밋으로 남으므로 팀 규칙에 달렸다.", bad: false },
    { txt: "서로 관계없는 네 가지가 한 PR 에 묶여 있어 <b>부분 되돌리기가 불가능하다</b>. 결제 수정만 롤백하려 해도 로깅 교체까지 함께 딸려 온다.", bad: true },
    { txt: "<code>.env.example</code> 에 키를 추가했으면 실제 배포 환경에도 그 값을 넣어야 하는데 PR 만으로는 확인되지 않는다 — 배포 체크리스트에 넣을 일이지 PR 자체의 결함은 아니다.", bad: false },
    { txt: "제목 \"수정\" 과 빈 설명란은 <b>왜</b> 이 변경이 필요한지를 남기지 않는다. 6개월 뒤 이 커밋을 만난 사람이 배경을 찾을 곳이 없다.", bad: true },
    { txt: "+2,180 -1,940 은 순증이 240줄이므로 변경 크기 자체는 문제가 아니다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>포매팅이 실제 변경을 덮었다</b> — 리뷰의 목적이 사라진다. (2) <b>관계없는 것들이 한 묶음</b>이라 되돌리기가 전부 아니면 전무가 된다. (3) 제목과 설명이 <b>왜</b> 를 남기지 않아 나중에 이 변경을 만난 사람이 배경을 알 수 없다.\n디스트랙터: 커밋 하나로 묶는 것은 병합 전략에 달린 취향이다. <code>.env.example</code> 과 실제 배포 환경의 어긋남은 배포 절차에서 볼 일이다. 줄 수의 순증이 작다는 것은 <b>리뷰 부담과 무관하다</b> — 리뷰어가 읽어야 하는 것은 순증이 아니라 바뀐 줄 전부다.",
},

/* ══════════════ linux ══════════════ */
{
  t: "review", k: "정리 스크립트", cat: "review", d: 3, track: "linux",
  q: "이 정리 스크립트의 결함을 모두 고르세요",
  code: "#!/bin/bash\nBASE=$1\nfind $BASE/tmp -mtime +7 -exec rm -rf {} \\;\ntar czf /backup/$(date +%F).tar.gz $BASE/data\necho \"done\" >> /var/log/cleanup.log",
  items: [
    { txt: "<code>date +%F</code> 는 하루에 한 번 도는 것을 전제하므로 같은 날 두 번 돌면 백업이 덮어써진다 — 시각까지 넣거나 이어 붙이는 편이 안전하지만, 하루 한 번이 규칙이라면 의도된 동작이다.", bad: false },
    { txt: "<code>tar czf</code> 는 gzip 압축이라 큰 데이터에서 시간이 오래 걸린다. 더 빠른 알고리즘으로 바꾸면 성능이 좋아지므로 반드시 교체한다.", bad: false },
    { txt: "<code>find ... -exec rm -rf {} \\;</code> 는 파일마다 프로세스를 새로 띄워 느리다 — <code>-delete</code> 나 <code>+</code> 로 묶는 편이 빠르다. 다만 이 스크립트가 잘못 도는 이유는 아니다.", bad: false },
    { txt: "<code>$BASE</code> 를 따옴표로 감싸지 않아 공백이 든 경로에서 인자가 쪼개진다. 게다가 <code>$1</code> 이 비면 <code>/tmp</code> 가 되어 <b>엉뚱한 곳을 지운다</b>.", bad: true },
    { txt: "로그를 <code>&gt;&gt;</code> 로 이어 붙이기만 하고 회전 설정이 없어 파일이 무한히 자란다.", bad: false },
    { txt: "<code>set -euo pipefail</code> 이 없어 <code>tar</code> 가 실패해도 스크립트가 계속 돌면서 <code>done</code> 을 남긴다 — 로그만 보면 성공한 것처럼 보인다.", bad: true },
  ],
  ex: "결함 2가지. (1) <b>따옴표 없는 변수와 빈 인자</b> — 이 조합이 '스크립트가 시스템을 지웠다' 는 사고의 전형적인 모양이다. <code>\"${1:?경로를 주세요}\"</code> 처럼 비었을 때 멈추게 하고 언제나 따옴표로 감싼다. (2) <b>실패해도 계속 돈다</b> — <code>set -euo pipefail</code> 이 없으면 중간이 깨져도 성공을 기록하는 곳까지 실행되어, 로그를 믿을 수 없게 된다.\n디스트랙터: 날짜 파일명, 압축 알고리즘, <code>-exec</code> 의 프로세스 비용, 로그 회전은 모두 개선할 값어치가 있지만 <b>지금 이 스크립트가 잘못 도는 이유</b>는 아니다. 리뷰에서는 '더 좋아질 것' 과 '지금 틀린 것' 을 나눠 적어야 한다.",
},
{
  t: "review", k: "서비스 유닛 파일", cat: "review", d: 3, track: "linux",
  q: "이 systemd 유닛 파일의 결함을 모두 고르세요",
  code: "[Unit]\nDescription=Order API\n\n[Service]\nUser=root\nExecStart=/usr/bin/node /srv/api/index.js\nRestart=always\nEnvironment=DB_PASSWORD=prod_secret\nStandardOutput=file:/var/log/api.log\n\n[Install]\nWantedBy=multi-user.target",
  items: [
    { txt: "<code>Restart=always</code> 는 정상 종료(코드 0)까지 다시 띄운다 — 배치성 작업이라면 <code>on-failure</code> 가 맞지만, 계속 떠 있어야 하는 API 서버라면 이 설정이 옳다.", bad: false },
    { txt: "<code>User=root</code> 로 돌아 애플리케이션 취약점 하나가 곧바로 시스템 전체 권한이 된다. 전용 계정을 만들어 낮추는 것이 기본이다.", bad: true },
    { txt: "<code>After=network.target</code> 이 없어 네트워크가 준비되기 전에 뜰 수 있다 — 다만 대부분의 서버는 재시도로 넘어가고, 진짜 의존이 있다면 <code>network-online.target</code> 을 쓴다.", bad: false },
    { txt: "로그를 파일로 직접 쓰면 journald 를 거치지 않아 회전과 수집이 따로 필요해진다 — 표준 출력에 그대로 두면 <code>journalctl</code> 로 함께 다뤄지므로 그편이 관례에 맞다.", bad: false },
    { txt: "<code>Environment=</code> 에 비밀번호를 적으면 <code>systemctl show</code> 로 누구나 읽을 수 있고 유닛 파일 자체가 저장소에 커밋되기도 한다 — <code>EnvironmentFile=</code> 로 권한을 좁힌 파일에서 읽어야 한다.", bad: true },
    { txt: "<code>ExecStart</code> 에 절대 경로를 쓴 것은 옳다 — systemd 는 로그인 셸의 <code>PATH</code> 를 상속하지 않으므로 이름만 적으면 실행되지 않는다.", bad: false },
  ],
  ex: "결함 2가지. (1) <b>root 실행</b> — 컨테이너든 유닛이든 서비스 계정을 낮추는 것이 가장 값싼 방어다. <code>User=api</code> 와 함께 <code>NoNewPrivileges=true</code>·<code>ProtectSystem=strict</code> 같은 샌드박스 설정을 얹으면 더 좋다. (2) <b>유닛 파일에 박힌 비밀</b> — <code>systemctl show</code> 는 권한이 없어도 대부분 읽을 수 있어 사실상 공개다.\n디스트랙터: <code>Restart=always</code> 는 상주 서비스에 맞는 설정이다. <code>After=network.target</code> 과 로그 대상은 개선 여지이지 결함은 아니다. 절대 경로는 <b>옳게 쓴 것</b>이라 지적할 자리가 아니다 — 리뷰에서 잘된 것을 결함으로 적으면 신뢰를 잃는다.",
},
{
  t: "review", k: "권한을 여는 방식", cat: "review", d: 2, track: "linux",
  q: "배포 뒤 '권한 오류' 를 해결한 이 절차의 결함을 모두 고르세요",
  code: "# 증상: 웹 서버가 /srv/app/uploads 에 파일을 못 쓴다\n\nsudo chmod -R 777 /srv/app\nsudo chown -R www-data:www-data /srv/app\nsudo chmod 777 /srv/app/config/secrets.yml\n\n# 확인: 업로드가 된다. 티켓 닫음.",
  items: [
    { txt: "<code>chmod -R 777</code> 은 <b>필요한 것보다 훨씬 넓게</b> 연다. 못 쓰는 것은 <code>uploads</code> 하나였는데 소스·설정·스크립트까지 누구나 쓰고 실행할 수 있게 됐다.", bad: true },
    { txt: "<code>chown</code> 을 <code>chmod</code> 뒤에 해서 순서가 어긋났다 — 소유자를 먼저 바꾸고 권한을 조정해야 중간 상태에서 잠깐이라도 열리는 시간이 없다.", bad: false },
    { txt: "비밀 파일을 <code>777</code> 로 열어 서버에 들어온 누구나 읽을 수 있다. 이것은 원래 증상과 아무 관계도 없는 변경이다.", bad: true },
    { txt: "재발 방지가 없다. 배포할 때마다 권한이 초기화된다면 다음 배포에서 같은 증상이 돌아오므로, 배포 절차 안에서 <code>uploads</code> 만 정해진 소유자로 만들어야 한다.", bad: true },
    { txt: "<code>-R</code> 는 심볼릭 링크를 따라가지 않으므로 링크 너머의 파일은 그대로 남는다 — 의도한 대상이 링크 뒤에 있다면 증상이 안 고쳐질 수 있지만, 여기서는 업로드가 된 것으로 확인됐다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>777 은 진단이 아니라 포기다</b> — 무엇이 왜 막혔는지 알아내지 않고 전부 연 것이라, 원인은 그대로 남고 공격면만 넓어졌다. 필요한 것은 <code>uploads</code> 디렉터리를 서버 계정 소유로 두고 <code>755</code> 정도로 맞추는 것이다. (2) <b>비밀 파일까지 열었다</b> — 증상과 무관한 변경이 슬쩍 섞였다. (3) <b>재발 방지가 없다</b> — 배포가 권한을 되돌린다면 다음 배포에서 그대로 반복된다.\n디스트랙터: <code>chown</code> 과 <code>chmod</code> 의 적용 순서는 이 상황에서 실질적 차이를 만들지 않는다. 심볼릭 링크 이야기는 가능성이지만 증상이 해소된 것으로 배제된다.",
},
{
  t: "review", k: "크론 작업 등록", cat: "review", d: 3, track: "linux",
  q: "이 crontab 항목의 결함을 모두 고르세요",
  code: "# crontab -e\n*/5 * * * * cd /srv/etl && ./run.sh\n0 3 * * * /srv/etl/backup.sh > /dev/null 2>&1\n@reboot /srv/etl/warmup.sh",
  items: [
    { txt: "<code>@reboot</code> 는 부팅 시각을 정확히 보장하지 않아 의존 서비스가 아직 안 떠 있을 수 있다 — 순서가 중요하면 systemd 유닛으로 옮기는 편이 낫다.", bad: false },
    { txt: "5분마다 도는 작업이 <b>5분 안에 안 끝나면 겹쳐서 돈다</b>. 크론은 앞의 것이 끝났는지 보지 않으므로 잠금 파일이나 <code>flock</code> 이 필요하다.", bad: true },
    { txt: "<code>&gt; /dev/null 2&gt;&amp;1</code> 로 출력을 통째로 버려 <b>실패해도 아무도 모른다</b>. 크론은 원래 출력을 메일로 보내 실패를 알리는데 그 경로까지 막았다.", bad: true },
    { txt: "<code>*/5</code> 는 0·5·10… 분에 도므로 정각에 다른 무거운 작업과 겹칠 수 있다 — 분을 하나 밀어 두면 몰림을 피할 수 있지만 이 항목의 결함은 아니다.", bad: false },
    { txt: "<code>cd /srv/etl &amp;&amp; ./run.sh</code> 는 <code>cd</code> 가 실패하면 스크립트를 실행하지 않으므로 그 자체로는 안전한 관용구다.", bad: false },
    { txt: "크론의 <code>PATH</code> 는 로그인 셸보다 훨씬 짧아, 스크립트 안에서 이름만으로 부르는 명령이 없다고 나올 수 있다 — 절대 경로를 쓰거나 <code>PATH</code> 를 명시해야 한다.", bad: true },
  ],
  ex: "결함 3가지. (1) <b>겹쳐 도는 것을 막지 않았다</b> — 크론은 이전 실행이 끝났는지 보지 않는다. <code>flock -n /tmp/etl.lock</code> 으로 감싸면 겹치면 그냥 넘어간다. (2) <b>출력을 버려 실패가 안 보인다</b> — 크론의 기본 알림 경로를 스스로 막은 셈이라, 버리려면 대신 로그와 경보를 붙여야 한다. (3) <b>크론의 환경은 로그인 셸과 다르다</b> — <code>PATH</code>·로케일·<code>HOME</code> 이 모두 좁아, 손으로는 되는데 크론에서만 안 되는 일이 여기서 나온다.\n디스트랙터: <code>@reboot</code> 의 순서 문제와 정각 몰림은 개선 여지다. <code>cd &amp;&amp; 실행</code> 은 오히려 권장되는 형태로, 경로가 없을 때 엉뚱한 디렉터리에서 도는 것을 막아 준다.",
},

/* ══════════════ test ══════════════ */
{
  t: "review", k: "단위 테스트 한 벌", cat: "review", d: 2, track: "test",
  q: "이 테스트 코드의 결함을 모두 고르세요",
  code: "let db;\n\ntest(\"주문을 만든다\", async () => {\n  db = await connect();\n  const r = await createOrder({ item: \"A\", qty: 2 });\n  expect(r).toBeTruthy();\n});\n\ntest(\"주문을 조회한다\", async () => {\n  const r = await getOrder(1);\n  expect(r.item).toBe(\"A\");\n});",
  items: [
    { txt: "조회 테스트가 앞선 테스트의 부산물에 통째로 기댄다 — <code>db</code> 연결도, <code>getOrder(1)</code> 의 <code>1</code> 도 앞에서 만들어진 것을 짐작한 값이라, 혼자 돌리거나 순서가 바뀌면 실패한다.", bad: true },
    { txt: "<code>async</code> 테스트에 명시적인 타임아웃을 주지 않아 기본값에 기대게 된다 — 느린 환경에서 흔들릴 수 있으니 정해 두는 편이 낫지만, 지금 이 테스트가 틀린 이유는 아니다.", bad: false },
    { txt: "테스트 이름이 한국어라 국제 팀에서 읽기 어려울 수 있으므로 팀에 따라 영어로 통일한다.", bad: false },
    { txt: "<code>toBeTruthy()</code> 는 <b>거의 모든 값</b>을 통과시킨다 — 빈 객체도, 문자열 \"error\" 도 통과하므로 사실상 아무것도 확인하지 않는다.", bad: true },
    { txt: "연결을 열기만 하고 닫지 않아 테스트가 끝난 뒤에도 커넥션이 남는다 — 스위트가 끝나지 않거나 커넥션 풀이 고갈될 수 있다.", bad: true },
    { txt: "조회 테스트가 <code>item</code> 하나만 확인하고 수량이나 상태는 보지 않는다 — 다만 한 테스트가 한 가지를 확인하는 것은 오히려 권장되는 모양이다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>테스트 사이의 의존</b> — 조회 테스트가 생성 테스트가 남긴 연결과 id 에 기댄다. 어느 쪽도 이 테스트가 스스로 만든 것이 아니라, 순서가 바뀌면 그대로 무너진다. (2) <b><code>toBeTruthy()</code> 는 확인이 아니다</b> — 무엇을 기대하는지 적지 않은 단언은 통과해도 아무것도 보장하지 않는다. (3) <b>연결을 안 닫는다</b> — 준비한 것은 반드시 정리해야 한다.\n디스트랙터: 타임아웃을 명시하는 것은 좋은 습관이지만 지금 실패의 원인이 아니다. 테스트 이름의 언어는 팀 규칙이다. 단언이 하나뿐인 것도 결함이 아니다 — 한 테스트가 한 가지를 확인하면 실패했을 때 무엇이 깨졌는지 바로 읽힌다.",
},
{
  t: "review", k: "흔들리는 테스트를 다룬 방식", cat: "review", d: 3, track: "test",
  q: "가끔 실패하는 테스트에 대한 이 대응의 결함을 모두 고르세요",
  code: "// 이 테스트가 CI 에서 하루 두세 번 실패한다.\n// 다시 돌리면 통과해서 아래처럼 바꿨다.\n\ntest.retry(3)(\"알림이 발송된다\", async () => {\n  await sendNotification(user);\n  await sleep(2000);              // 발송을 기다린다\n  expect(mailbox.count()).toBe(1);\n});\n\n// 그래도 가끔 실패하면 test.skip 으로 바꾸기로 팀에서 정했다.",
  items: [
    { txt: "<code>sleep(2000)</code> 은 빠른 기계에서는 낭비고 느린 기계에서는 모자란다 — 조건이 될 때까지 짧게 확인하는 방식으로 바꾸면 대개 훨씬 빠르면서 안정적이다.", bad: true },
    { txt: "재시도는 흔들림을 <b>가려 줄 뿐</b> 없애지 않는다. 초록불이 되면서 원인을 조사할 계기까지 사라져, 같은 불안정이 운영에서 드러난다.", bad: true },
    { txt: "<code>test.skip</code> 은 문제를 지우는 것이 아니라 <b>덮는 것</b>이다. 꺼진 테스트는 아무도 다시 켜지 않고, 그 기능은 이제 아무 검사도 받지 않는다.", bad: true },
    { txt: "<code>mailbox.count()</code> 를 <code>toBe(1)</code> 로 단정하면 다른 테스트가 남긴 메일이 섞였을 때 실패한다 — 격리가 안 됐다면 이것도 흔들림의 원인일 수 있다.", bad: false },
    { txt: "재시도 횟수를 3으로 정한 근거가 코드에 없어, 왜 2도 4도 아닌지 나중에 알 수 없다 — 상수에는 이유를 주석으로 남긴다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>고정 시간 대기</b>가 흔들림의 직접적인 원인일 가능성이 높다 — 조건 폴링으로 바꾸는 것이 첫 조치다. (2) <b>재시도로 덮었다</b> — 재시도는 진짜 불확실한 바깥 세계에 쓰는 도구이고, 우리 코드의 경합에 쓰면 문제를 감춘다. (3) <b>끄기로 정한 것</b>이 가장 나쁘다: 꺼진 테스트는 되살아나지 않고, 그동안 그 기능은 무방비다.\n디스트랙터: <code>toBe(1)</code> 의 격리 문제는 실제로 원인일 수 있어 확인할 값어치가 있지만 이 코드만으로는 단정할 수 없다. 재시도 횟수의 근거를 남기는 것은 좋은 습관이지 결함이 아니다 — 애초에 재시도를 쓰지 않는 것이 답이다.",
},
{
  t: "review", k: "모킹의 범위", cat: "review", d: 3, track: "test",
  q: "이 테스트에서 가짜로 바꾼 방식의 결함을 모두 고르세요",
  code: "jest.mock(\"../src/order\");     // 모듈 전체를 가짜로\n\ntest(\"주문 총액을 계산한다\", () => {\n  order.calcTotal.mockReturnValue(15000);\n  order.applyCoupon.mockReturnValue(13500);\n  order.validate.mockReturnValue(true);\n\n  const r = order.checkout({ items: [], coupon: \"X\" });\n  expect(order.calcTotal).toHaveBeenCalled();\n});",
  items: [
    { txt: "<code>items: []</code> 로 빈 배열을 넘겼는데 총액 15000 을 기대하는 것은 앞뒤가 맞지 않는다 — 다만 모두 가짜라 어차피 값이 흐르지 않으므로 이 어긋남 자체가 실패를 만들지는 않는다.", bad: false },
    { txt: "<code>jest.mock</code> 은 호출 위치와 무관하게 파일 위쪽으로 끌어올려지므로, <code>import</code> 아래에 적어도 먼저 적용된다 — 읽는 사람이 헷갈릴 수는 있다.", bad: false },
    { txt: "테스트 대상인 <code>order</code> 모듈을 통째로 가짜로 만들어, <code>checkout</code> 조차 가짜다 — <b>아무 실제 코드도 실행되지 않는다</b>.", bad: true },
    { txt: "<code>toHaveBeenCalled()</code> 만 확인하고 <b>결과를 보지 않는다</b> — 계산이 틀려도 부르기만 했으면 통과하므로 '총액을 계산한다' 는 이름이 지키는 것이 없다.", bad: true },
    { txt: "쿠폰 코드 \"X\" 처럼 뜻이 없는 값을 쓰면 실패했을 때 무엇을 시험하려 했는지 읽히지 않는다 — 의미 있는 이름을 준다.", bad: false },
    { txt: "모의 객체를 테스트마다 초기화하지 않으면 앞 테스트의 설정이 남아 결과가 순서에 따라 달라진다 — <code>clearMocks</code> 설정이나 <code>beforeEach</code> 가 필요하다.", bad: true },
  ],
  ex: "결함 3가지. (1) <b>시험 대상을 가짜로 만들었다</b> — 협력자를 가짜로 두는 것이 모킹이지 대상 자체를 바꾸면 아무것도 확인하지 않는다. (2) <b>호출 여부만 단언</b>했다: 결과를 보지 않는 단언은 리팩터링에 깨지면서 버그는 못 잡는, 가장 나쁜 조합이다. (3) <b>모의 상태를 초기화하지 않으면</b> 테스트가 순서에 의존한다.\n디스트랙터: 빈 배열과 15000 의 어긋남은 읽기에 어색하지만 이 코드에서 실패를 만들지는 않는다. <code>jest.mock</code> 의 끌어올림은 <b>의도된 동작</b>이다. 쿠폰 코드에 뜻을 주는 것은 읽기 좋게 하는 일이지 결함이 아니다.",
},
{
  t: "review", k: "커버리지 목표", cat: "review", d: 2, track: "test",
  q: "이 커버리지 설정과 그에 따라 쓰인 테스트의 결함을 모두 고르세요",
  code: "// jest.config.js\ncoverageThreshold: { global: { lines: 100 } }\n\n// 목표를 채우려고 추가된 테스트\ntest(\"getters\", () => {\n  const u = new User(\"a\", \"b\");\n  expect(u.firstName).toBe(\"a\");\n  expect(u.lastName).toBe(\"b\");\n  expect(u.fullName).toBe(\"a b\");\n});\n\n// 그리고 통과가 어려운 파일들:\ncoveragePathIgnorePatterns: [\"src/payment/\", \"src/auth/\"]",
  items: [
    { txt: "줄 커버리지 100% 는 <b>모든 줄이 한 번 실행됐다</b>는 뜻일 뿐, 분기와 경계가 확인됐다는 뜻이 아니다 — 조건문의 한쪽만 지나가도 그 줄은 덮인 것으로 센다.", bad: true },
    { txt: "목표를 채우려고 <b>결제와 인증을 제외 목록에 넣었다</b> — 가장 확인이 필요한 곳을 빼고 100% 를 만든 것이라, 숫자가 뜻하는 바가 정반대가 됐다.", bad: true },
    { txt: "임계값을 <code>global</code> 로만 두면 새로 추가되는 파일의 커버리지가 낮아도 전체 평균에 묻힌다 — 변경된 파일에 대한 임계를 따로 두는 편이 낫지만 지금 설정이 틀린 것은 아니다.", bad: false },
    { txt: "<code>fullName</code> 이 <code>firstName</code> 과 <code>lastName</code> 을 조합한다면 그것은 로직이므로 확인할 값어치가 있다 — 이 셋 중 성격이 다른 단언이다.", bad: false },
    { txt: "getter 를 확인하는 테스트는 <b>깨질 일이 없는 것</b>을 확인한다 — 커버리지 숫자만 올리고 회귀는 못 잡으므로, 그 시간을 분기가 많은 코드에 쓰는 편이 낫다.", bad: true },
  ],
  ex: "결함 3가지. (1) <b>줄 커버리지 100% 는 안전을 뜻하지 않는다</b> — 분기·조건·경계는 세지 않으므로, 같은 100% 라도 확인의 깊이가 완전히 다르다. (2) <b>어려운 곳을 제외해 목표를 맞췄다</b> — 결제와 인증이야말로 덮여야 할 곳이라, 이 숫자는 이제 거짓말이 됐다. (3) <b>getter 테스트</b>는 숫자만 올린다.\n디스트랙터: 변경분 기준 임계는 좋은 개선이지 지금의 결함이 아니다. <code>fullName</code> 확인은 <b>실제로 로직</b>이라 이 셋 중 유일하게 값어치가 있는 단언이다 — 커버리지용 테스트를 싸잡아 지적하면 이런 것까지 지우게 된다.",
},

/* ══════════════ cloud ══════════════ */
{
  t: "review", k: "보안 그룹 규칙", cat: "review", d: 3, track: "cloud",
  q: "이 보안 그룹 정의의 결함을 모두 고르세요",
  code: "ingress:\n  - port: 22\n    cidr: 0.0.0.0/0\n  - port: 5432\n    cidr: 0.0.0.0/0\n  - port: 443\n    cidr: 0.0.0.0/0\negress:\n  - port: all\n    cidr: 0.0.0.0/0",
  items: [
    { txt: "443 을 <code>0.0.0.0/0</code> 으로 연 것은 공개 웹 서비스라면 <b>의도된 설정</b>이다 — 여기서 지적할 자리가 아니다.", bad: false },
    { txt: "나가는 트래픽을 전부 허용하면 침해된 인스턴스가 데이터를 밖으로 보내거나 명령을 받아 오는 것을 막지 못한다 — 다만 좁히려면 의존하는 목적지를 전부 알아야 해서 단계적으로 진행할 일이다.", bad: false },
    { txt: "SSH(22)를 전 세계에 열었다. 열어 둔 순간부터 자동화된 시도가 끊이지 않으므로, 사내 대역이나 배스천을 거치게 좁혀야 한다.", bad: true },
    { txt: "IPv6 대역(<code>::/0</code>)에 대한 규칙이 없어, 인스턴스에 IPv6 주소가 붙어 있다면 규칙이 적용되지 않는 경로가 생긴다.", bad: false },
    { txt: "데이터베이스(5432)가 인터넷에 직접 노출됐다 — 앱 서버의 보안 그룹만 오도록 좁히는 것이 기본이고, 애초에 사설 서브넷에 둔다.", bad: true },
    { txt: "규칙에 설명(<code>description</code>)이 없어 몇 달 뒤 이 구멍이 왜 열렸는지 아무도 모른다 — 좁힐 때 무엇을 깨뜨릴지 판단할 근거가 사라진다.", bad: false },
  ],
  ex: "결함 2가지. (1) <b>SSH 전면 개방</b> — 키 인증만 쓰더라도 열어 둘 이유가 없다. 세션 관리자나 배스천을 거치면 포트를 아예 닫을 수 있다. (2) <b>DB 전면 개방</b> — 이쪽이 훨씬 심각하다. 보안 그룹은 대역이 아니라 <b>다른 보안 그룹</b>을 출발지로 지정할 수 있어, '앱 서버에서만' 을 정확히 표현할 수 있다.\n디스트랙터: 443 개방은 공개 서비스의 목적 그 자체다. 나가는 트래픽 제한과 IPv6, 설명 문구는 모두 실제로 개선할 값어치가 있지만 <b>지금 당장의 구멍</b>과는 급이 다르다 — 리뷰에서는 무엇을 먼저 막을지도 함께 말해야 한다.",
},
{
  t: "review", k: "인프라 코드의 상태 관리", cat: "review", d: 4, track: "cloud",
  q: "이 Terraform 설정의 결함을 모두 고르세요",
  code: "terraform {\n  # backend 설정 없음 — 상태 파일이 로컬에 저장된다\n}\n\nresource \"aws_db_instance\" \"main\" {\n  identifier = \"prod-db\"\n  password   = \"Prod2024!\"\n  skip_final_snapshot = true\n}\n\n# 배포: 각자 자기 노트북에서 terraform apply",
  items: [
    { txt: "상태 파일이 로컬에 있는데 각자 자기 노트북에서 적용하니 <b>팀이 서로의 변경을 모른다</b>. 두 사람이 동시에 적용하면 한쪽이 다른 쪽의 자원을 지우거나 중복 생성하고, 누가 언제 무엇을 바꿨는지도 남지 않는다.", bad: true },
    { txt: "비밀번호를 코드에 적었다. 게다가 <b>상태 파일에도 평문으로 남으므로</b>, 상태를 원격으로 옮기더라도 그 저장소의 접근 권한이 곧 DB 비밀번호에 대한 권한이 된다.", bad: true },
    { txt: "<code>identifier</code> 를 <code>prod-db</code> 로 고정하면 같은 계정에서 스테이징을 만들 때 이름이 충돌한다 — 환경별 접두사를 붙이는 편이 낫지만 지금 설정이 잘못 도는 이유는 아니다.", bad: false },
    { txt: "<code>skip_final_snapshot = true</code> 는 삭제할 때 마지막 스냅샷을 남기지 않는다 — 운영 DB 에서 실수로 <code>destroy</code> 가 돌면 되돌릴 방법이 없다.", bad: true },
    { txt: "프로바이더 버전을 고정하지 않아 <code>terraform init</code> 시점마다 다른 버전이 받아져 계획 결과가 달라질 수 있다.", bad: false },
    { txt: "<code>backup_retention_period</code> 를 적지 않아 보관 기간이 제공자 기본값에 맡겨진다 — 운영이라면 명시하는 편이 좋지만 기본값으로도 자동 백업은 남는다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>로컬 상태로 각자 적용</b> — 인프라 코드에서 가장 먼저 고쳐야 할 것이다. 상태는 '무엇이 실제로 있는가' 의 기록이라, 사람마다 다르면 도구가 엉뚱한 판단을 한다. 원격 백엔드와 잠금을 두고, CI 에서 <code>plan</code> 을 리뷰한 뒤 <code>apply</code> 하는 흐름으로 옮긴다. (2) <b>코드에 박힌 비밀</b>, 그리고 상태 파일에까지 평문으로 남는다는 점. (3) <b>최종 스냅샷 생략</b> — 되돌릴 수 없는 설정이다.\n디스트랙터: 이름 충돌, 프로바이더 버전 고정, 백업 보관 기간 명시는 실제로 겪게 될 문제이고 고치면 좋지만, 지금 이 설정이 만들 사고의 크기와는 다르다.",
},
{
  t: "review", k: "자동 확장 설정", cat: "review", d: 3, track: "cloud",
  q: "이 오토스케일 정책의 결함을 모두 고르세요",
  code: "min: 1\nmax: 100\nmetric: cpu_utilization\ntarget: 90\nscale_out_cooldown: 0\nscale_in_cooldown: 0\nhealth_check: TCP:80",
  items: [
    { txt: "CPU 를 지표로 삼으면 I/O 대기가 많은 워크로드에서는 부하를 반영하지 못한다 — 큐 길이나 요청 수가 더 맞을 수 있지만, 어떤 워크로드인지 이 설정만으로는 알 수 없다.", bad: false },
    { txt: "쿨다운이 0이라 지표가 조금만 흔들려도 늘렸다 줄였다를 반복한다. 늘어난 인스턴스가 지표에 반영되기 전에 또 늘리므로 과잉 확장으로도 이어진다.", bad: true },
    { txt: "TCP 헬스 체크는 <b>포트가 열려 있는지만</b> 본다. 애플리케이션이 응답을 못 해도 통과하므로, 실제 동작을 보는 HTTP 검사가 필요하다.", bad: true },
    { txt: "<code>min: 1</code> 은 한가한 시간에 한 대만 남긴다는 뜻이라 비용에는 유리하다 — 무중단이 필요한 서비스라면 가용 영역을 나눠 두 대를 두지만, 이 설정만으로는 어느 쪽인지 알 수 없다.", bad: false },
    { txt: "목표 사용률 90% 는 여유가 거의 없어, 새 인스턴스가 준비되는 동안 남은 대수가 곧바로 한계에 닿는다 — 60~70% 가 흔한 출발점이다.", bad: true },
    { txt: "최대 100대는 잘못된 지표 하나로 요금이 폭발할 수 있는 값이다 — 예산에 맞춰 낮추는 편이 안전하다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>쿨다운 0</b> — 늘린 것이 지표에 반영되기 전에 또 판단하므로 진동하거나 과잉 확장한다. (2) <b>TCP 헬스 체크</b> — 포트만 열려 있으면 통과하므로 죽은 애플리케이션도 살아 있는 것으로 센다. (3) <b>목표 90%</b> — 새 인스턴스가 준비되는 시간을 감당할 여유가 없다.\n디스트랙터: CPU 지표가 늘 맞는 것은 아니지만 워크로드를 모르면 단정할 수 없다. 최소 대수는 가용성 요구에 달렸다 — 공개 API 라면 두 대 이상이 맞지만 내부 배치 작업이라면 한 대로 충분하다. 최대 100대는 <b>상한이 있다는 것 자체가 안전장치</b>이고, 적정값은 예산과 최대 부하로 정할 일이다.",
},
{
  t: "review", k: "객체 저장소 정책", cat: "review", d: 3, track: "cloud",
  q: "사용자 업로드를 다루는 이 버킷 설정의 결함을 모두 고르세요",
  code: "bucket: user-uploads\npublic_access_block: disabled\nacl: public-read\nversioning: disabled\nlifecycle: (없음)\nupload: 클라이언트가 액세스 키로 직접 PUT\nencryption: (없음)",
  items: [
    { txt: "버킷을 공개 읽기로 두면 <b>업로드된 모든 파일이 URL 만 알면 열린다</b> — 사용자 파일이라면 서명된 URL 로 필요한 사람에게만 잠깐 열어야 한다.", bad: true },
    { txt: "버전 관리가 꺼져 있어 덮어쓰거나 지운 것을 되돌릴 수 없다 — 다만 켜면 저장 비용이 늘고 수명 주기 규칙이 함께 필요하므로, 파일의 성격을 보고 정한다.", bad: false },
    { txt: "저장 시 암호화가 없다 — 대부분의 제공자가 기본으로 켜 주지만 명시해 두는 편이 낫고, 규제 대상 데이터라면 필수다.", bad: false },
    { txt: "클라이언트에 액세스 키를 심으면 그 키가 곧바로 새어 나가고, 키의 권한 전부를 남에게 준 것이 된다 — 서버가 발급한 서명된 업로드 URL 을 쓰는 것이 정석이다.", bad: true },
    { txt: "미완성 멀티파트 업로드를 정리하는 수명 주기 규칙이 없어, 중간에 끊긴 업로드 조각이 목록에 안 보이는 채로 요금을 낸다.", bad: true },
    { txt: "버킷 이름이 <code>user-uploads</code> 로 짧아 전역 이름 공간에서 이미 쓰이고 있을 수 있다 — 조직 접두사를 붙이는 편이 낫다.", bad: false },
  ],
  ex: "결함 3가지. (1) <b>공개 읽기</b> — 사용자 업로드에 이 설정은 그 자체로 사고다. 열람이 필요하면 서명된 URL 로 시간을 정해 빌려준다. (2) <b>클라이언트에 심은 액세스 키</b> — 앱 안에 넣은 키는 언제나 추출된다. 서버가 업로드용 서명을 발급하면 키를 내보내지 않고도 직접 올릴 수 있다. (3) <b>미완성 업로드 정리 규칙 없음</b> — '저장 용량이 계산과 안 맞는' 흔한 원인이다.\n디스트랙터: 버전 관리·암호화·이름 규칙은 모두 손볼 값어치가 있지만 성격이 다르다 — 앞의 셋은 지금 새고 있는 구멍이고, 이 셋은 정책으로 정할 사항이다.",
},

];
