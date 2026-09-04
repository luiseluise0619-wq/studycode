/* Linux 트랙 전용 프로젝트 — 빈 서버 한 대를 받아 서비스를 띄우고 지킨다.
   설치·서비스 등록·로그·방화벽·백업까지 한 바퀴를 돌면
   '서버를 다룬다' 는 말의 내용이 손에 남는다. */
module.exports = {
  lv: 3, em: "🖥️",
  title: "빈 서버 한 대를 받았다",
  desc: "갓 만든 리눅스 서버에 서비스를 올리고, 자동으로 살아나게 하고, 로그와 디스크를 관리하고, 바깥에서 안전하게 접속되게 만든다",
  skills: ["linux", "devops", "security"],
  phases: [

  { t: "무엇을 지킬지 먼저 적는다", type: "note",
    goal: "서버를 만지기 전에 <b>이 서버가 무엇을 해야 하는지</b>와 <b>무엇을 지켜야 하는지</b>를 적으세요.\n열 포트, 돌 서비스, 접속할 사람, 남길 로그의 보관 기간까지 정합니다.",
    ph: "예: 80·443 만 공개 · SSH 는 사무실 IP 에서만 · 앱은 appsvc 계정으로 · 로그는 14일 보관 · 백업은 매일 새벽 3시" },

  { t: "계정과 권한부터 정리한다", type: "build",
    goal: "서비스 전용 계정을 만들고, 앱이 쓸 디렉터리의 소유자를 그 계정으로 맞추세요.\n<b>로그인할 수 없는 계정</b>으로 만드는 것이 요점입니다 — 서비스는 로그인할 필요가 없습니다.",
    hint: "<code>useradd -r</code> 은 시스템 계정(UID 가 낮고 홈을 만들지 않음)을 만듭니다. 셸을 <code>/usr/sbin/nologin</code> 으로 두면 그 계정으로는 로그인 자체가 되지 않습니다. 확인은 <code>id</code> 와 <code>ls -ld</code> 로 합니다.",
    acc: "<code>sudo -u appsvc touch /srv/app/test</code> 가 성공하고, <code>su - appsvc</code> 는 로그인이 거부되면 완료입니다.",
    lang: "bash",
    sol: "# 로그인할 수 없는 서비스 전용 계정\nsudo useradd -r -s /usr/sbin/nologin -d /srv/app appsvc\n\nsudo mkdir -p /srv/app\nsudo chown -R appsvc:appsvc /srv/app\nsudo chmod 750 /srv/app          # 그룹까지만, 나머지는 접근 불가\n\n# 확인\nid appsvc\nls -ld /srv/app\nsudo -u appsvc touch /srv/app/test && echo \"쓰기 OK\"\nsu - appsvc 2>&1 | tail -1        # 로그인은 거부되어야 한다" },

  { t: "이 서비스를 어떻게 띄울 것인가", type: "decide",
    goal: "앱을 실행해 두어야 하는데, 지금은 SSH 로 들어가 <code>./app &</code> 로 띄운 상태입니다.",
    sit: "어떻게 바꾸시겠습니까?",
    opts: [
      { label: "systemd 서비스로 등록하고 Restart 와 부팅 시 자동 시작을 함께 건다",
        fx: { system_design: 3, performance: 1, leadership: 1 },
        fb: "✅ <code>&</code> 로 띄운 프로세스는 <b>터미널이 닫히면 함께 죽고, 죽어도 아무도 되살리지 않습니다.</b> 서비스로 등록하면 그 둘을 시스템이 맡고, 로그도 journald 가 모아 줍니다. 서버를 재부팅해도 알아서 뜬다는 점이 무엇보다 큽니다.",
        best: true },
      { label: "nohup 을 붙여 터미널을 닫아도 죽지 않게 한다",
        fx: { system_design: -1 },
        fb: "⚠️ 터미널 문제는 풀리지만 <b>죽었을 때 되살아나지 않고 재부팅하면 사라집니다.</b> 로그도 어디로 갈지 직접 정해야 합니다. 임시 작업에는 쓸 만하지만 서비스에는 부족합니다." },
      { label: "tmux 세션 안에서 실행해 두고 필요할 때 붙어서 확인한다",
        fx: { system_design: -1, leadership: -1 },
        fb: "⚠️ 사람이 세션을 살려 두어야 하고, 그 사람이 없으면 아무도 손대지 못합니다. 재부팅 후 복구도 수동입니다. 개발 중 임시로는 편하지만 운영 방식이 될 수는 없습니다." },
      { label: "cron 에 1분마다 '안 떠 있으면 띄우는' 스크립트를 건다",
        fx: { system_design: -2, debugging: -1 },
        fb: "⚠️ systemd 가 이미 하는 일을 손으로 다시 만드는 것입니다. 중복 실행을 막는 잠금, 재시도 간격, 실패 알림을 전부 직접 해결해야 하고, 대개 그중 하나가 빠져 사고가 납니다." }] },

  { t: "서비스로 등록한다", type: "build",
    goal: "유닛 파일을 만들어 서비스로 등록하고, <b>부팅 시 자동 시작</b>과 <b>죽으면 재시작</b>을 걸어 주세요.\n무한 재시작에 빠지지 않도록 간격과 횟수 제한도 함께 둡니다.",
    hint: "유닛 파일을 고친 뒤에는 반드시 <code>systemctl daemon-reload</code> 로 systemd 에게 다시 읽게 해야 합니다. 설정 오류로 즉시 죽는 서비스에 <code>Restart=always</code> 만 걸면 초당 수십 번 재시작하므로 <code>RestartSec</code> 과 <code>StartLimitBurst</code> 를 함께 정합니다.",
    acc: "<code>systemctl status</code> 가 active 이고, 프로세스를 강제로 죽였을 때 몇 초 뒤 다시 살아나며, 재부팅 후에도 자동으로 떠 있으면 완료입니다.",
    lang: "ini",
    sol: "# /etc/systemd/system/myapp.service\n[Unit]\nDescription=My App\nAfter=network-online.target\nWants=network-online.target\nStartLimitIntervalSec=60\nStartLimitBurst=5          # 1분에 5번 넘게 실패하면 포기한다\n\n[Service]\nUser=appsvc\nWorkingDirectory=/srv/app\nExecStart=/usr/bin/node /srv/app/server.js\nRestart=always\nRestartSec=5               # 5초 간격 — 즉시 재시작은 로그만 태운다\n\n# 사고 범위를 좁히는 샌드박스 옵션\nNoNewPrivileges=yes\nPrivateTmp=yes\nProtectSystem=strict\nReadWritePaths=/srv/app\n\n[Install]\nWantedBy=multi-user.target\n\n# 적용\n#   sudo systemctl daemon-reload\n#   sudo systemctl enable --now myapp\n#   systemctl status myapp" },

  { t: "접속이 안 된다는 신고가 왔다", type: "decide",
    goal: "서비스는 <code>active</code> 인데 바깥에서 <code>curl</code> 이 연결되지 않습니다.",
    sit: "무엇을 가장 먼저 확인하시겠습니까?",
    opts: [
      { label: "서버 안에서 ss -ltnp 로 어느 주소·포트를 듣고 있는지 확인한다",
        fx: { debugging: 4, system_design: 1 },
        fb: "✅ 층을 따라 아래에서부터 좁히는 것이 정석입니다. <code>127.0.0.1:8080</code> 으로만 듣고 있으면 <b>방화벽을 열어도 바깥에서는 절대 닿지 않습니다.</b> 여기서 확인하면 애플리케이션 설정 문제인지 네트워크 문제인지가 한 번에 갈립니다.",
        best: true },
      { label: "일단 서버를 재부팅해 본다",
        fx: { debugging: -3 },
        fb: "⚠️ 증상이 사라져도 원인을 모르므로 반드시 다시 일어납니다. 무엇보다 재부팅은 <b>증거를 지웁니다</b> — 그 순간의 프로세스 상태와 연결 정보가 전부 사라집니다." },
      { label: "방화벽을 전부 열어 두고 되는지 본다",
        fx: { security: -3, debugging: -1 },
        fb: "⚠️ 원인을 찾는 방법이 될 수는 있지만, 열어 둔 채 잊는 순간 그것이 사고가 됩니다. 확인이 목적이라면 특정 포트만 잠시 열고 즉시 되돌려야 합니다." },
      { label: "애플리케이션 코드에서 포트 설정 부분을 읽어 본다",
        fx: { debugging: 1 },
        fb: "⚠️ 나쁜 선택은 아니지만 순서가 늦습니다. 코드가 무엇을 의도했든 <b>실제로 무엇을 듣고 있는지</b>는 <code>ss</code> 가 알려 줍니다. 설정 파일이나 환경 변수가 코드를 덮어썼을 수도 있습니다." }] },

  { t: "바깥에서 안전하게 닿게 만든다", type: "build",
    goal: "방화벽을 <b>기본 차단</b>으로 두고 필요한 포트만 여세요. SSH 는 비밀번호 인증을 끄고 키만 남깁니다.\n<b>순서를 지키는 것</b>이 이 단계의 전부입니다 — 잘못하면 스스로 잠깁니다.",
    hint: "방화벽은 <b>SSH 허용 규칙을 넣은 뒤에</b> 켭니다. SSH 설정은 <code>sshd -t</code> 로 문법을 먼저 검사하고, 비밀번호 인증을 끄기 전에 <b>다른 터미널에서 키 접속이 되는지</b> 반드시 확인합니다.",
    acc: "새 터미널에서 키로 접속이 되고, 비밀번호 접속은 거부되며, <code>ufw status</code> 에 필요한 포트만 열려 있으면 완료입니다.",
    lang: "bash",
    sol: "# 1) 방화벽 — SSH 를 먼저 열고 나서 켠다\nsudo ufw default deny incoming\nsudo ufw default allow outgoing\nsudo ufw allow 22/tcp\nsudo ufw allow 80/tcp\nsudo ufw allow 443/tcp\nsudo ufw enable\nsudo ufw status numbered\n\n# 2) SSH — 문법 검사 → 반영 → '다른 터미널에서' 확인\nsudo tee /etc/ssh/sshd_config.d/hardening.conf > /dev/null <<'EOF'\nPasswordAuthentication no\nPermitRootLogin no\nPubkeyAuthentication yes\nEOF\n\nsudo sshd -t                  # 문법이 틀리면 여기서 걸린다\nsudo systemctl reload sshd\n\n# 지금 연결을 끊지 말고, 새 터미널에서 접속되는지 먼저 확인할 것" },

  { t: "로그와 디스크를 관리한다", type: "build",
    goal: "로그가 디스크를 채우지 않도록 <b>상한</b>을 정하고, 앱 로그에는 회전을 걸어 주세요.\n디스크 사용률이 임계값을 넘으면 알아채도록 간단한 점검도 만듭니다.",
    hint: "journald 는 <code>SystemMaxUse</code> 로 상한을 둡니다. 파일 로그는 <code>logrotate</code> 에 맡기는데, <b>지우지 않고 옮긴 뒤 신호를 보내는</b> 방식이라야 열려 있는 파일의 공간이 제대로 반환됩니다.",
    acc: "<code>journalctl --disk-usage</code> 가 상한 안에 있고, <code>logrotate -d</code>(예행연습)가 오류 없이 계획을 출력하면 완료입니다.",
    lang: "bash",
    sol: "# journald 상한\nsudo tee /etc/systemd/journald.conf.d/limit.conf > /dev/null <<'EOF'\n[Journal]\nSystemMaxUse=500M\nMaxRetentionSec=14day\nEOF\nsudo systemctl restart systemd-journald\njournalctl --disk-usage\n\n# 앱 파일 로그 회전\nsudo tee /etc/logrotate.d/myapp > /dev/null <<'EOF'\n/srv/app/logs/*.log {\n    daily\n    rotate 14\n    size 100M\n    compress\n    delaycompress\n    missingok\n    notifempty\n    copytruncate      # 앱이 파일을 계속 열고 있을 때\n}\nEOF\n\nsudo logrotate -d /etc/logrotate.d/myapp   # 예행연습으로 계획만 확인\n\n# 디스크 점검 — 90% 넘으면 알린다\ndf -h --output=pcent,target | awk 'NR>1 && $1+0 >= 90 {print \"경고:\", $2, $1}'" },

  { t: "무엇을 백업할 것인가", type: "decide",
    goal: "서버가 사라졌을 때 무엇이 있어야 다시 만들 수 있을지 정해야 합니다.",
    sit: "백업 대상으로 무엇을 고르시겠습니까?",
    opts: [
      { label: "데이터베이스와 사용자 업로드 파일, 그리고 설정을 코드로 남긴다",
        fx: { system_design: 4, security: 1 },
        fb: "✅ 다시 만들 수 없는 것은 <b>데이터</b>뿐입니다. 코드는 저장소에 있고 서버 설정은 스크립트로 다시 만들 수 있습니다. 그래서 '서버 전체 이미지' 보다 이 조합이 값싸고 복원도 빠릅니다.",
        best: true },
      { label: "서버 전체를 통째로 이미지로 떠 둔다",
        fx: { system_design: 1 },
        fb: "⚠️ 확실하지만 무겁고 비쌉니다. 무엇보다 <b>손으로 만진 상태가 그대로 굳어</b> 왜 그렇게 설정되었는지 아무도 모르게 됩니다. 스냅숏은 보조 수단으로 두는 편이 낫습니다." },
      { label: "소스 코드를 서버에서 압축해 보관한다",
        fx: { system_design: -2 },
        fb: "⚠️ 코드는 이미 Git 저장소에 있습니다. 서버의 사본이 저장소와 달라졌다면 그것 자체가 고쳐야 할 문제입니다 — 백업할 것이 아니라 배포 방식을 바로잡을 신호입니다." },
      { label: "로그를 전부 보관해 두면 나중에 복원할 수 있다",
        fx: { system_design: -2, security: -1 },
        fb: "⚠️ 로그로는 상태를 복원할 수 없습니다. 게다가 오래 보관할수록 유출 시 피해가 커지고 비용도 늡니다. 로그는 조사에 필요한 기간만 두는 것이 원칙입니다." }] },

  { t: "복원이 되는지 확인한다", type: "build",
    goal: "백업을 만드는 것에서 끝내지 말고 <b>실제로 복원해 보세요.</b> 복원에 걸린 시간도 함께 재 둡니다.\n한 번도 복원해 본 적 없는 백업은 백업이 아닙니다.",
    hint: "복원은 <b>원본이 아닌 곳</b>에 해야 합니다. 임시 디렉터리나 별도 데이터베이스에 풀어 파일 수와 핵심 데이터가 맞는지 확인합니다. 자동화한 뒤에는 이 검증도 정기 작업으로 걸어 둡니다.",
    acc: "백업 파일에서 복원한 데이터의 개수가 원본과 같고, 복원에 걸린 시간이 기록되면 완료입니다.",
    lang: "bash",
    sol: "set -euo pipefail\n\nSTAMP=$(date +%F)\nBACKUP=/var/backups/app-$STAMP.tar.gz\n\n# 1) 백업\nsudo tar -czf \"$BACKUP\" -C /srv/app data uploads\nls -lh \"$BACKUP\"\n\n# 2) 복원 검증 — 원본이 아닌 곳에 푼다\nRESTORE=$(mktemp -d)\nSTART=$(date +%s)\ntar -xzf \"$BACKUP\" -C \"$RESTORE\"\nEND=$(date +%s)\n\n# 3) 개수를 비교한다\nSRC=$(find /srv/app/uploads -type f | wc -l)\nDST=$(find \"$RESTORE/uploads\" -type f | wc -l)\necho \"원본 $SRC / 복원 $DST · 복원 시간 $((END-START))초\"\n[ \"$SRC\" -eq \"$DST\" ] && echo \"복원 검증 통과\"\n\nrm -rf \"$RESTORE\"" },

  { t: "손으로 한 일을 파일로 옮긴다", type: "note",
    goal: "여기까지 손으로 친 명령 중 <b>다시 하게 될 것</b>을 골라 스크립트로 옮기세요.\n그리고 이 서버를 처음부터 다시 만든다면 어떤 순서로 할지 적어 봅니다.",
    ph: "예: 계정 생성·디렉터리 권한·systemd 유닛·방화벽 규칙은 setup.sh 로 · 백업 검증은 매주 타이머로 · 아직 손으로 하는 것: TLS 인증서 발급(다음에 자동화)" }

]};
