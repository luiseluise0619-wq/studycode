/* 모바일 1차 — 실습이 하나도 없던 4개 유닛.

   기기 없이도 판단은 연습할 수 있다. 생명주기 순서, 오프라인 큐,
   배터리 비용, 권한 흐름은 전부 규칙이라 순수 파이썬으로 짜진다. */
module.exports = [
/* ── 앱 개발 기초 ────────────────────────────────────────── */
{
  unit: "앱 개발 기초",
  lesson: "직접 짜 보기 — 화면 하나가 뜨기까지",
  th: {
    sum: "모바일 앱은 **화면이 쌓이고 걷히는 더미**다. 뒤로 가기는 그 더미에서 하나를 걷어내는 일이다.",
    body: [
      { h: "화면은 스택으로 쌓인다", t: "새 화면을 열면 위에 쌓이고, 뒤로 가면 걷힌다. 마지막 화면에서 뒤로 가면 앱이 종료된다 — 이 규칙을 모르면 '뒤로 가기가 이상하다' 는 버그를 잡을 수 없다." },
      { h: "네이티브·크로스플랫폼·웹뷰", t: "네이티브는 가장 빠르고 기기 기능을 다 쓰지만 두 벌을 만들어야 한다. 크로스플랫폼(React Native·Flutter)은 한 벌로 두 곳에 내지만 새 OS 기능이 늦다. 웹뷰는 가장 싸지만 느리고 기기 기능이 제한된다." },
      { h: "화면 크기는 하나가 아니다", t: "같은 앱이 작은 폰과 큰 태블릿에서 돈다. 픽셀 대신 밀도 독립 단위를 쓰고, 넓어지면 배치를 바꾼다 — 고정 크기로 짜면 어느 기기에선가 반드시 깨진다." },
      { h: "메인 스레드를 막지 않는다", t: "화면을 그리는 스레드에서 네트워크나 파일 작업을 하면 앱이 얼어붙는다. 몇 백 밀리초만 막혀도 사용자는 '고장' 으로 느낀다." },
    ],
    code: { c: "스택: [홈] → [목록] → [상세]\n뒤로 → [홈, 목록]\n뒤로 → [홈]\n뒤로 → 앱 종료\n\n무거운 일은 메인 스레드 밖에서", cap: "쌓고 걷어낸다" },
    key: ["화면은 스택", "메인 스레드를 막지 않는다", "고정 크기로 짜지 않는다"],
  },
  q: [
    {
      k: "back · 뒤로 가면 무엇이 남나",
      qq: "화면 스택과 뒤로 가기 횟수를 받아 <b>남은 스택</b>을 돌려주세요. 다 걷히면 <b>빈 목록</b>(앱 종료)입니다.",
      src: "def back(stack, n):\n    return stack[:-n]\n",
      sol: "def back(stack, n):\n    if n >= len(stack):\n        return []\n    return stack[:len(stack) - n]\n",
      tests: [["back(['홈', '목록', '상세'], 1)", "['홈', '목록']"], ["back(['홈', '목록'], 2)", "[]"], ["back(['홈'], 3)", "[]"]],
      edge: [["back(['홈', '목록'], 0)", "['홈', '목록']"], ["back([], 1)", "[]"]],
      ex: "`stack[:-0]` 은 빈 목록이 아니라 **전체**입니다 — 뒤로 가기 0번이 전부 지우는 것으로 보이면 반대로 동작해요. 그리고 남은 것보다 많이 걷으려 하면 음수 슬라이스가 되어 엉뚱한 결과가 나옵니다.",
    },
    {
      k: "dp_to_px · 기기마다 다른 픽셀",
      qq: "밀도 독립 단위와 배율을 받아 <b>실제 픽셀</b>을 돌려주세요. 반올림하고, 결과는 <b>최소 1</b>입니다.",
      src: "def dp_to_px(dp, scale):\n    return int(dp * scale)\n",
      sol: "def dp_to_px(dp, scale):\n    v = int(round(dp * scale))\n    return v if v >= 1 else 1\n",
      tests: [["dp_to_px(10, 2.0)", "20"], ["dp_to_px(10, 1.5)", "15"], ["dp_to_px(1, 0.4)", "1"]],
      edge: [["dp_to_px(0, 3.0)", "1"], ["dp_to_px(3, 1.6)", "5"]],
      ex: "`int()` 는 버리기라 1.5dp 짜리 구분선이 0픽셀이 되어 **사라집니다** — 저밀도 기기에서만 선이 안 보이는, 재현하기 어려운 버그예요. 반올림하고 최소 1을 보장하면 어느 기기에서도 보입니다.",
    },
    {
      k: "main_thread_ok · 이 일을 여기서 해도 되나",
      qq: "작업 이름과 예상 소요 시간(ms)을 받아, <b>16ms 이하</b>일 때만 메인 스레드에서 해도 된다고 True 를 돌려주세요. 이름이 <code>'network'</code>·<code>'disk'</code> 면 시간과 무관하게 False 입니다.",
      src: "def main_thread_ok(kind, ms):\n    return ms <= 16\n",
      sol: "def main_thread_ok(kind, ms):\n    if kind in ('network', 'disk'):\n        return False\n    return ms <= 16\n",
      tests: [["main_thread_ok('compute', 5)", "True"], ["main_thread_ok('compute', 100)", "False"], ["main_thread_ok('network', 1)", "False"]],
      edge: [["main_thread_ok('disk', 0)", "False"], ["main_thread_ok('compute', 16)", "True"]],
      ex: "네트워크는 지금 1ms 여도 지하철에서 30초가 됩니다 — 걸린 시간으로 판단하면 개발자 책상에서만 멀쩡해요. 시간이 **예측 불가능한** 종류의 작업은 아예 메인 스레드에 올리지 않습니다. 16ms 는 60fps 한 프레임의 예산입니다.",
    },
  ],
},
/* ── 생명주기와 상태 저장 ────────────────────────────────── */
{
  unit: "생명주기와 상태 저장",
  lesson: "직접 짜 보기 — 언제 저장하고 언제 되살리나",
  th: {
    sum: "모바일 앱은 **언제든 뒤로 밀려나고, 언제든 죽을 수 있다**. 그래서 저장 시점이 중요하다.",
    body: [
      { h: "화면이 가려지면 곧 죽을 수 있다", t: "전화가 오거나 홈으로 나가면 앱이 배경으로 밀린다. 메모리가 부족하면 OS 가 조용히 죽인다 — 배경으로 갈 때 저장해 두지 않으면 사용자가 쓰던 글이 사라진다." },
      { h: "화면 회전도 재생성이다", t: "안드로이드는 회전할 때 화면을 다시 만든다. 메모리에만 들고 있던 값은 사라지므로, 상태를 따로 저장하고 복원해야 한다 — '회전하면 입력이 지워진다' 는 버그의 정체다." },
      { h: "저장은 작게, 자주", t: "번들에 넣는 상태는 몇 KB 를 넘기면 안 된다. 큰 데이터는 파일이나 DB 에 두고, 번들에는 '무엇을 보고 있었나' 만 남긴다." },
      { h: "복원은 없을 수도 있다", t: "처음 실행이면 저장된 상태가 없다. 복원 코드는 언제나 '없으면 기본값' 을 다뤄야 한다." },
    ],
    code: { c: "onPause / onStop  → 저장 (곧 죽을 수 있다)\nonCreate          → 복원 (없으면 기본값)\n\n번들에는 작은 것만 — 큰 것은 DB 로", cap: "가려질 때 저장, 만들 때 복원" },
    key: ["배경으로 갈 때 저장한다", "회전도 재생성이다", "복원은 없을 수 있다"],
  },
  q: [
    {
      k: "should_save · 지금 저장해야 하나",
      qq: "생명주기 이벤트 이름을 받아, <code>'pause'</code>·<code>'stop'</code>·<code>'rotate'</code> 일 때 True 를 돌려주세요.",
      src: "def should_save(event):\n    return event == 'destroy'\n",
      sol: "def should_save(event):\n    return event in ('pause', 'stop', 'rotate')\n",
      tests: [["should_save('pause')", "True"], ["should_save('rotate')", "True"], ["should_save('resume')", "False"]],
      edge: [["should_save('destroy')", "False"], ["should_save('')", "False"]],
      ex: "`destroy` 를 기다리면 늦습니다 — 메모리가 부족해 OS 가 죽일 때는 그 콜백이 안 불릴 수도 있어요. 화면이 가려지는 순간(pause/stop)이 마지막으로 보장되는 시점입니다.",
    },
    {
      k: "restore · 없으면 기본값",
      qq: "저장된 상태 사전과 기본값 사전을 받아, <b>저장된 값이 있으면 그것</b>, 없으면 기본값을 쓴 사전을 돌려주세요. <b>기본값에 있는 키만</b> 남깁니다.",
      src: "def restore(saved, defaults):\n    return dict(saved)\n",
      sol: "def restore(saved, defaults):\n    return {k: saved.get(k, v) for k, v in defaults.items()}\n",
      tests: [["restore({'page': 3}, {'page': 1, 'sort': 'new'})", "{'page': 3, 'sort': 'new'}"], ["restore({}, {'page': 1})", "{'page': 1}"], ["restore({'x': 9}, {'page': 1})", "{'page': 1}"]],
      edge: [["restore({}, {})", "{}"], ["restore({'page': 0}, {'page': 1})", "{'page': 0}"]],
      ex: "저장된 것을 그대로 쓰면 첫 실행에서 빈 사전이 나와, 아래 코드가 없는 키를 읽다 터집니다. 그리고 앱을 업데이트해 새 설정이 생겨도 옛 저장본에는 그 키가 없어요 — 기본값을 바탕에 깔고 덮어쓰면 두 문제가 함께 해결됩니다.",
    },
    {
      k: "bundle_ok · 번들에 넣어도 되는 크기인가",
      qq: "저장할 값들의 <b>총 바이트</b>가 <code>limit</code> <b>이하</b>면 True 를 돌려주세요. 각 값의 크기는 문자열 길이로 셉니다.",
      src: "def bundle_ok(values, limit):\n    return len(values) <= limit\n",
      sol: "def bundle_ok(values, limit):\n    return sum(len(str(v)) for v in values) <= limit\n",
      tests: [["bundle_ok(['abc', 'de'], 5)", "True"], ["bundle_ok(['abc', 'de'], 4)", "False"], ["bundle_ok([], 0)", "True"]],
      edge: [["bundle_ok(['x' * 100], 50)", "False"], ["bundle_ok([1, 22], 3)", "True"]],
      ex: "개수만 세면 100KB 짜리 문자열 하나를 '한 개니까 괜찮다' 로 봅니다. 번들이 상한을 넘으면 안드로이드는 앱을 죽여 버려요 — 사용자에게는 '가끔 앱이 꺼진다' 로만 보이는, 원인 찾기 어려운 사고입니다.",
    },
  ],
},
/* ── 네트워크·오프라인·캐시 ──────────────────────────────── */
{
  unit: "네트워크·오프라인·캐시 전략",
  lesson: "직접 짜 보기 — 끊겨도 쓸 수 있게",
  th: {
    sum: "모바일에서 네트워크는 **있다가 없다가 하는 것**이다. 끊김을 예외가 아니라 기본으로 다룬다.",
    body: [
      { h: "캐시 먼저 보여 주고 뒤에서 갱신", t: "저장해 둔 것을 즉시 띄우고, 새 데이터가 오면 바꿔 준다. 화면이 비어 있는 시간이 사라져 체감 속도가 크게 좋아진다." },
      { h: "쓰기는 큐에 넣는다", t: "오프라인에서 누른 '좋아요' 를 버리지 않고 큐에 쌓았다가, 연결되면 순서대로 보낸다. 사용자에게는 이미 눌린 것으로 보여 준다(낙관적 UI)." },
      { h: "재시도에는 지터를 섞는다", t: "끊겼다 돌아오면 모든 기기가 동시에 재시도해 서버를 밀어붙인다. 대기 시간에 무작위를 조금 섞으면 이 몰림이 흩어진다." },
      { h: "캐시에는 유효기간이 있어야 한다", t: "언제까지 믿을지 정해 두지 않으면, 며칠 지난 값을 계속 보여 준다. 신선도를 넘으면 화면에 띄우되 '갱신 중' 을 함께 보여 주는 것이 보통이다." },
    ],
    code: { c: "1) 캐시 즉시 표시\n2) 네트워크 요청\n3) 오면 갱신\n\n오프라인 쓰기 → 큐 → 연결되면 순서대로\n재시도 대기 = base * 2^n + 무작위", cap: "끊김이 기본이다" },
    key: ["캐시 먼저, 갱신은 뒤에", "쓰기는 큐에 쌓는다", "재시도에 지터를 섞는다"],
  },
  q: [
    {
      k: "cache_state · 이 캐시를 쓸 수 있나",
      qq: "저장 시각·현재 시각·유효기간을 받아 <code>'신선'</code>(기간 안), <code>'낡음'</code>(기간을 넘었지만 <code>stale</code> 안), <code>'버림'</code> 을 돌려주세요.",
      src: "def cache_state(saved, now, ttl, stale):\n    return '신선' if now - saved <= ttl else '버림'\n",
      sol: "def cache_state(saved, now, ttl, stale):\n    age = now - saved\n    if age <= ttl:\n        return '신선'\n    if age <= stale:\n        return '낡음'\n    return '버림'\n",
      tests: [["cache_state(0, 5, 10, 100)", "'신선'"], ["cache_state(0, 50, 10, 100)", "'낡음'"], ["cache_state(0, 500, 10, 100)", "'버림'"]],
      edge: [["cache_state(0, 10, 10, 100)", "'신선'"], ["cache_state(0, 100, 10, 100)", "'낡음'"]],
      ex: "신선하지 않으면 곧바로 버리면, 지하철에서 화면이 텅 빕니다. 조금 낡은 데이터라도 보여 주면서 뒤에서 갱신하는 편이 훨씬 나아요 — '낡음' 이라는 중간 상태가 오프라인 경험을 만듭니다.",
    },
    {
      k: "flush_queue · 순서대로 보내기",
      qq: "대기 큐와 <b>연결 여부</b>를 받아 <code>(보낸 것, 남은 것)</code> 을 돌려주세요. 연결이 없으면 <b>아무것도 못 보냅니다</b>. 한 번에 최대 <code>n</code>개입니다.",
      src: "def flush_queue(queue, online, n):\n    return (queue[:n], queue[n:])\n",
      sol: "def flush_queue(queue, online, n):\n    if not online:\n        return ([], list(queue))\n    return (queue[:n], queue[n:])\n",
      tests: [["flush_queue(['a', 'b', 'c'], True, 2)", "(['a', 'b'], ['c'])"], ["flush_queue(['a', 'b'], False, 2)", "([], ['a', 'b'])"], ["flush_queue([], True, 2)", "([], [])"]],
      edge: [["flush_queue(['a'], True, 5)", "(['a'], [])"], ["flush_queue(['a'], False, 0)", "([], ['a'])"]],
      ex: "연결이 없는데 보낸 것으로 처리하면 큐에서 사라집니다 — 사용자가 오프라인에서 쓴 글이 영영 안 올라가요. 게다가 화면에는 성공으로 보이니 아무도 모릅니다. 보낼 수 없으면 큐에 그대로 남겨 둡니다.",
    },
    {
      k: "backoff_jitter · 동시에 몰리지 않게",
      qq: "시도 횟수·기본 대기·<b>지터 비율</b>·무작위값(0~1)을 받아 대기 시간을 돌려주세요. <code>base * 2**n</code> 에 <code>(1 - jitter + 2*jitter*r)</code> 을 곱합니다.",
      src: "def backoff_jitter(n, base, jitter, r):\n    return base * (2 ** n)\n",
      sol: "def backoff_jitter(n, base, jitter, r):\n    return base * (2 ** n) * (1 - jitter + 2 * jitter * r)\n",
      tests: [["backoff_jitter(0, 100, 0.0, 0.5)", "100.0"], ["backoff_jitter(1, 100, 0.5, 0.5)", "200.0"], ["backoff_jitter(0, 100, 0.5, 0.0)", "50.0"]],
      edge: [["backoff_jitter(0, 100, 0.5, 1.0)", "150.0"], ["backoff_jitter(2, 10, 0.0, 0.9)", "40.0"]],
      ex: "지터가 없으면 끊겼던 기기 수만 대가 **정확히 같은 순간**에 재시도합니다 — 서버가 막 살아나려는 참에 다시 쓰러져요. 대기 시간을 조금씩 흩뜨리는 곱셈 하나가 그 몰림을 막습니다.",
    },
  ],
},
/* ── 성능·배터리·권한 ───────────────────────────────────── */
{
  unit: "성능·배터리·권한과 프라이버시",
  lesson: "직접 짜 보기 — 아껴 쓰고, 물어보고 쓰기",
  th: {
    sum: "모바일에서는 **배터리도 자원이고, 사용자의 허락도 자원**이다. 둘 다 함부로 쓰면 앱이 지워진다.",
    body: [
      { h: "깨우는 횟수가 배터리를 먹는다", t: "무선 통신 모듈은 한 번 깨어나면 잠시 켜져 있는다. 1분마다 한 번씩 보내면 하루 종일 깨어 있는 셈이라, 데이터를 모아 뭉쳐 보내는 편이 훨씬 낫다." },
      { h: "화면 밖은 그리지 않는다", t: "목록에서 화면에 보이는 것만 그리고 나머지는 재활용한다. 천 개짜리 목록을 다 만들면 메모리와 배터리가 함께 날아간다." },
      { h: "권한은 필요한 순간에 이유와 함께", t: "앱을 켜자마자 전부 요구하면 대부분 거절한다. 그 기능을 쓰려는 순간에, 왜 필요한지 보여 주고 물으면 허락률이 크게 오른다." },
      { h: "거절을 정상 경로로 다룬다", t: "위치를 거절해도 앱은 동작해야 한다. 직접 입력 같은 대안을 두지 않으면, 한 번 거절한 사용자는 앱을 지운다." },
    ],
    code: { c: "// 나쁨: 1분마다 한 번씩\n// 좋음: 모았다가 15분마다 한 번\n\n권한: 그 기능을 쓰는 순간 + 이유 설명\n거절: 기능만 줄이고 앱은 계속 동작", cap: "깨우지 말고, 미리 묻지 말고" },
    key: ["깨우는 횟수를 줄인다", "권한은 그 순간에 묻는다", "거절도 정상 경로다"],
  },
  q: [
    {
      k: "wakeups · 뭉쳐 보내면 몇 번 깨나",
      qq: "이벤트 개수·묶음 크기를 받아 <b>깨우는 횟수</b>를 돌려주세요. 자투리도 한 번으로 셉니다. 묶음이 1 미만이면 0 입니다.",
      src: "def wakeups(events, batch):\n    return events\n",
      sol: "def wakeups(events, batch):\n    if batch < 1:\n        return 0\n    return -(-events // batch)\n",
      tests: [["wakeups(100, 10)", "10"], ["wakeups(100, 30)", "4"], ["wakeups(0, 10)", "0"]],
      edge: [["wakeups(1, 10)", "1"], ["wakeups(10, 0)", "0"]],
      ex: "이벤트마다 보내면 100번 깨우고, 30개씩 묶으면 4번입니다 — 배터리 소모가 스물다섯 배 차이예요. 통신 모듈은 한 번 깨면 잠시 켜져 있기 때문에, 횟수가 곧 비용입니다.",
    },
    {
      k: "ask_when · 언제 물어볼까",
      qq: "화면 이름·필요한 권한·이미 가진 권한 집합을 받아, <b>지금 물어야 하면</b> True 를 돌려주세요. 이미 있거나 이 화면에 필요 없으면 False 입니다.",
      src: "def ask_when(screen, needed, granted):\n    return screen == 'launch'\n",
      sol: "def ask_when(screen, needed, granted):\n    want = needed.get(screen, set())\n    return bool(want - granted)\n",
      tests: [["ask_when('map', {'map': {'location'}}, set())", "True"], ["ask_when('map', {'map': {'location'}}, {'location'})", "False"], ["ask_when('home', {'map': {'location'}}, set())", "False"]],
      edge: [["ask_when('map', {}, set())", "False"], ["ask_when('map', {'map': set()}, set())", "False"]],
      ex: "앱을 켜자마자 전부 물으면 사용자는 이유를 몰라 거절합니다. 그리고 한 번 거절하면 다시 묻기 어려워요 — 지도 화면에 들어간 순간 물으면 '아, 그래서 필요하구나' 가 되어 허락률이 크게 오릅니다.",
    },
    {
      k: "on_deny · 거절해도 앱은 돌아간다",
      qq: "권한 이름과 대체 수단 사전을 받아, 거절되었을 때 <b>쓸 대체 수단</b>을 돌려주세요. 대체가 없으면 <code>None</code> 입니다.",
      src: "def on_deny(perm, fallbacks):\n    raise PermissionError(perm)\n",
      sol: "def on_deny(perm, fallbacks):\n    return fallbacks.get(perm)\n",
      tests: [["on_deny('location', {'location': '직접 입력'})", "'직접 입력'"], ["on_deny('camera', {'location': '직접 입력'})", "None"], ["on_deny('camera', {'camera': '갤러리에서 고르기'})", "'갤러리에서 고르기'"]],
      edge: [["on_deny('x', {})", "None"], ["on_deny('location', {'location': None})", "None"]],
      ex: "거절을 예외로 던지면 앱이 그 자리에서 죽습니다. 사용자는 '허락 안 하면 못 쓰는 앱' 으로 여기고 지워요 — 위치를 거절해도 주소를 직접 입력할 수 있으면 앱은 계속 쓸모가 있습니다.",
    },
  ],
},
];
