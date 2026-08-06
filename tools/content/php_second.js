/* PHP 2차 — 남은 5개 마른 유닛. 규약은 1차와 같다. */
const H = '<?php\nrequire "sol.php";\n\n$fails = 0;\n'
  + 'function eqv($got, $want, $msg) {\n'
  + '    global $fails;\n'
  + '    if ($got !== $want) {\n'
  + '        echo "실패: $msg — 받은 값 " . var_export($got, true)\n'
  + '           . ", 기대 " . var_export($want, true) . "\\n";\n'
  + '        $fails++;\n'
  + '    }\n}\n\n';
const T = '\nif ($fails > 0) { exit(1); }\necho "ok\\n";\n';
const test = body => ({ "test.php": H + body + T });

module.exports = [
/* ── 웹 요청 처리 ────────────────────────────────────────── */
{
  unit: "웹 요청 처리 — PHP 가 가장 잘하는 일",
  lesson: "직접 짜 보기 — 들어온 값을 믿지 않기",
  th: {
    sum: "요청으로 들어온 값은 **전부 문자열이고, 전부 남이 보낸 것**이다. 두 사실이 모든 처리를 정한다.",
    body: [
      { h: "있는지부터 확인한다", t: "`$_GET['page']` 는 없을 수 있다. 그대로 쓰면 경고가 뜨고 null 이 흘러 들어간다. `?? 기본값` 으로 없을 때를 먼저 정해 두면 아래 코드가 단순해진다." },
      { h: "숫자처럼 보여도 문자열이다", t: "`$_GET['page']` 가 \"2\" 라도 문자열이다. 계산에 쓰기 전에 정말 정수인지 검증하고 변환한다 — `filter_var(..., FILTER_VALIDATE_INT)` 는 실패하면 false 를 준다." },
      { h: "범위를 좁혀 두면 사고가 준다", t: "페이지 번호를 1 이상으로, 개수를 100 이하로 눌러 두면 음수 오프셋이나 백만 건 조회 같은 사고가 애초에 생기지 않는다." },
      { h: "리다이렉트 주소도 입력이다", t: "`?next=` 를 그대로 `Location` 에 넣으면 다른 사이트로 보내는 발판이 된다. 허용 목록으로 확인하거나, 경로만 받는다." },
    ],
    code: { c: "$raw  = $_GET['page'] ?? '1';\n$page = filter_var($raw, FILTER_VALIDATE_INT);\nif ($page === false || $page < 1) { $page = 1; }\n\n$per = min(max($per, 1), 100);   // 범위를 좁힌다", cap: "없을 때·이상할 때를 먼저 정한다" },
    key: ["없을 때를 먼저 정한다", "숫자처럼 보여도 검증한다", "범위를 좁혀 둔다"],
  },
  q: [
    {
      k: "page_of · 페이지 번호 읽기",
      qq: "<code>page_of(array $query): int</code> 를 만드세요. <code>'page'</code> 를 <b>1 이상의 정수</b>로 읽고, 없거나 이상하면 <b>1</b> 입니다.",
      src: "<?php\nfunction page_of(array $query): int {\n    return (int) $query[\"page\"];\n}\n",
      sol: "<?php\nfunction page_of(array $query): int {\n    $raw = $query[\"page\"] ?? \"1\";\n    $n = filter_var($raw, FILTER_VALIDATE_INT);\n    if ($n === false || $n < 1) { return 1; }\n    return $n;\n}\n",
      test: test('eqv(page_of(["page" => "3"]), 3, "보통");\neqv(page_of([]), 1, "없으면 1");\neqv(page_of(["page" => "abc"]), 1, "숫자가 아니면 1");\neqv(page_of(["page" => "0"]), 1, "0 은 1 로");\neqv(page_of(["page" => "-5"]), 1, "음수는 1 로");\neqv(page_of(["page" => "2"]), 2, "문자열 정수");\n'),
      ex: "`(int)\"abc\"` 는 0 이고, 그 0 으로 오프셋을 계산하면 `-10` 같은 값이 나와 쿼리가 터지거나 엉뚱한 결과를 줍니다. 키가 아예 없으면 경고까지 떠요 — 없을 때와 이상할 때를 함수 맨 앞에서 정해 두면 아래가 전부 안전해집니다.",
    },
    {
      k: "clamp_per · 한 번에 너무 많이 주지 않기",
      qq: "<code>clamp_per($raw, int $lo, int $hi): int</code> 를 만드세요. 정수로 읽어 <b><code>[lo, hi]</code> 안으로 눌러</b> 돌려주고, 정수가 아니면 <code>lo</code> 입니다.",
      src: "<?php\nfunction clamp_per($raw, int $lo, int $hi): int {\n    return (int) $raw;\n}\n",
      sol: "<?php\nfunction clamp_per($raw, int $lo, int $hi): int {\n    $n = filter_var($raw, FILTER_VALIDATE_INT);\n    if ($n === false) { return $lo; }\n    return min(max($n, $lo), $hi);\n}\n",
      test: test('eqv(clamp_per("20", 10, 100), 20, "범위 안");\neqv(clamp_per("1000000", 10, 100), 100, "너무 크면 상한");\neqv(clamp_per("1", 10, 100), 10, "너무 작으면 하한");\neqv(clamp_per("abc", 10, 100), 10, "숫자가 아니면 하한");\neqv(clamp_per("100", 10, 100), 100, "경계값");\n'),
      ex: "상한이 없으면 누가 `?per=1000000` 을 보내는 순간 백만 건을 읽어 서버가 멈춥니다. 공격이 아니라 실수로도 일어나요 — 범위를 좁히는 한 줄이 가장 싼 방어입니다.",
    },
    {
      k: "safe_redirect · 남의 사이트로 보내지 않기",
      qq: "<code>safe_redirect(string $next, string $default): string</code> 를 만드세요. <code>/</code> 로 시작하는 <b>내부 경로</b>만 그대로 쓰고, <code>//</code> 로 시작하거나 그 밖이면 <code>$default</code> 입니다.",
      src: "<?php\nfunction safe_redirect(string $next, string $default): string {\n    return $next !== \"\" ? $next : $default;\n}\n",
      sol: "<?php\nfunction safe_redirect(string $next, string $default): string {\n    if ($next === \"\" || $next[0] !== \"/\") { return $default; }\n    if (str_starts_with($next, \"//\")) { return $default; }\n    return $next;\n}\n",
      test: test('eqv(safe_redirect("/home", "/"), "/home", "내부 경로");\neqv(safe_redirect("https://evil.example/x", "/"), "/", "외부 주소는 막는다");\neqv(safe_redirect("//evil.example/x", "/"), "/", "//로 시작하면 외부다");\neqv(safe_redirect("", "/"), "/", "빈 값");\neqv(safe_redirect("/a/b?c=1", "/"), "/a/b?c=1", "질의문자열도 그대로");\n'),
      ex: "`//evil.example` 은 슬래시로 시작하니 얼핏 내부처럼 보이지만, 브라우저는 '현재 프로토콜의 그 도메인' 으로 읽습니다. 로그인 직후 공격자 사이트의 가짜 로그인 화면으로 넘어가는 고전적인 수법이에요 — 슬래시 하나로 판단하면 안 됩니다.",
    },
  ],
},
/* ── 보안 ────────────────────────────────────────────────── */
{
  unit: "보안 — PHP 가 가장 많이 공격받는 자리",
  lesson: "직접 짜 보기 — 섞이지 않게 갈라 두기",
  th: {
    sum: "웹 취약점의 대부분은 **데이터가 코드로 읽히는 순간** 생긴다. 갈라 두면 대부분 사라진다.",
    body: [
      { h: "SQL 은 이어 붙이지 않는다", t: "값을 문자열로 붙이면 값 안의 따옴표가 쿼리 구조를 바꾼다. 바인딩(플레이스홀더)은 값을 '값' 자리에 못 박아, 무엇이 들어와도 구조가 안 바뀐다 — 이스케이프보다 확실하다." },
      { h: "출력할 때 이스케이프한다", t: "저장할 때가 아니라 **화면에 낼 때** `htmlspecialchars` 를 건다. 저장 시점에 바꿔 두면 원본이 훼손되고, 다른 곳(메일·JSON)에 쓸 때 이중으로 깨진다." },
      { h: "비밀번호는 해시하고 상수 시간으로 견준다", t: "`password_hash` 는 소금과 비용을 알아서 넣는다. 검증은 `password_verify` 로 한다 — 직접 `===` 로 견주면 시간 차이로 정보가 샌다." },
      { h: "토큰 비교는 hash_equals", t: "CSRF 토큰이나 API 키를 `===` 로 견주면, 앞에서 몇 글자가 맞았는지가 시간에 드러난다. `hash_equals` 는 길이가 같으면 언제나 같은 시간을 쓴다." },
    ],
    code: { c: "$st = $pdo->prepare(\"SELECT * FROM u WHERE id = ?\");\n$st->execute([$id]);          // 구조가 안 바뀐다\n\necho htmlspecialchars($name, ENT_QUOTES, 'UTF-8');\n\nhash_equals($expected, $given)   // 상수 시간", cap: "값과 코드를 갈라 둔다" },
    key: ["SQL 은 바인딩으로", "이스케이프는 출력 시점에", "토큰은 `hash_equals`"],
  },
  q: [
    {
      k: "esc · 화면에 낼 때 감싸기",
      qq: "<code>esc(string $s): string</code> 를 만드세요. <code>&lt; &gt; &amp; \" '</code> 를 전부 HTML 엔티티로 바꿉니다.",
      src: "<?php\nfunction esc(string $s): string {\n    return str_replace(\"<\", \"&lt;\", $s);\n}\n",
      sol: "<?php\nfunction esc(string $s): string {\n    return htmlspecialchars($s, ENT_QUOTES, \"UTF-8\");\n}\n",
      test: test('eqv(esc("<b>"), "&lt;b&gt;", "꺾쇠");\neqv(esc("a & b"), "a &amp; b", "앰퍼샌드");\neqv(esc("\\"x\\""), "&quot;x&quot;", "큰따옴표");\neqv(esc("\\x27x\\x27"), "&#039;x&#039;", "작은따옴표");\neqv(esc("한글"), "한글", "보통 글자는 그대로");\n'),
      ex: "여는 꺾쇠만 바꾸면 `<` 는 막아도 속성 안의 따옴표는 그대로입니다 — `value=\"여기\"` 안에서 따옴표를 닫고 `onmouseover=` 를 붙일 수 있어요. `ENT_QUOTES` 로 따옴표까지 포함해야 속성 자리에서도 안전합니다.",
    },
    {
      k: "token_ok · 시간으로 새어 나가지 않게",
      qq: "<code>token_ok(string $expected, string $given): bool</code> 를 만드세요. <b>상수 시간</b>으로 견줍니다.",
      src: "<?php\nfunction token_ok(string $expected, string $given): bool {\n    for ($i = 0; $i < strlen($expected); $i++) {\n        if (!isset($given[$i]) || $given[$i] !== $expected[$i]) { return false; }\n    }\n    return strlen($given) === strlen($expected);\n}\n",
      sol: "<?php\nfunction token_ok(string $expected, string $given): bool {\n    return hash_equals($expected, $given);\n}\n",
      test: test('eqv(token_ok("abc123", "abc123"), true, "같은 토큰");\neqv(token_ok("abc123", "abc124"), false, "한 글자 다름");\neqv(token_ok("abc", "abcd"), false, "길이가 다름");\neqv(token_ok("", ""), true, "빈 토큰끼리");\neqv(token_ok("abc", ""), false, "한쪽만 빈 값");\n$src = (new ReflectionFunction("token_ok"))->getFileName();\neqv(str_contains(file_get_contents($src), "hash_equals"), true, "hash_equals 로 견줘야 한다");\n'),
      ex: "첫 글자에서 바로 빠져나오는 코드는 '몇 글자가 맞았나' 를 응답 시간으로 알려 줍니다. 공격자는 한 글자씩 맞춰 가며 토큰 전체를 알아낼 수 있어요 — 결과는 똑같이 false 인데도요. `hash_equals` 는 언제나 끝까지 봅니다.",
    },
    {
      k: "build_query · 값을 구조로 만들지 않기",
      qq: "<code>build_query(array $cols): array</code> 를 만드세요. 열 이름 목록으로 <code>[SQL, 자리표 개수]</code> 를 돌려줍니다. SQL 은 <code>INSERT INTO t (a, b) VALUES (?, ?)</code> 꼴이고, <b>열 이름은 영문자·숫자·밑줄만</b> 허용하며 그 밖은 <b>버립니다</b>.",
      src: "<?php\nfunction build_query(array $cols): array {\n    $sql = \"INSERT INTO t (\" . implode(\", \", $cols) . \") VALUES (\"\n         . implode(\", \", array_fill(0, count($cols), \"?\")) . \")\";\n    return [$sql, count($cols)];\n}\n",
      sol: "<?php\nfunction build_query(array $cols): array {\n    $safe = array_values(array_filter($cols, fn($c) => (bool) preg_match('/^[A-Za-z0-9_]+$/', $c)));\n    $sql = \"INSERT INTO t (\" . implode(\", \", $safe) . \") VALUES (\"\n         . implode(\", \", array_fill(0, count($safe), \"?\")) . \")\";\n    return [$sql, count($safe)];\n}\n",
      test: test('eqv(build_query(["a", "b"]), ["INSERT INTO t (a, b) VALUES (?, ?)", 2], "보통");\neqv(build_query(["a", "b; DROP TABLE t --"]), ["INSERT INTO t (a) VALUES (?)", 1], "이상한 이름은 버린다");\neqv(build_query(["user_id"]), ["INSERT INTO t (user_id) VALUES (?)", 1], "밑줄은 허용");\neqv(build_query([]), ["INSERT INTO t () VALUES ()", 0], "빈 목록");\neqv(build_query(["a b"]), ["INSERT INTO t () VALUES ()", 0], "공백은 버린다");\n'),
      ex: "값은 바인딩으로 막을 수 있지만 **열 이름은 자리표로 못 씁니다** — 구조의 일부라서요. 그래서 이름만큼은 허용 목록으로 걸러야 합니다. 값은 `?` 로, 이름은 화이트리스트로 — 이 둘을 섞으면 뚫립니다.",
    },
  ],
},
/* ── 데이터베이스 PDO ────────────────────────────────────── */
{
  unit: "데이터베이스 — PDO",
  lesson: "직접 짜 보기 — 자리표와 트랜잭션",
  th: {
    sum: "PDO 의 핵심은 **자리표로 값을 넘기는 것**과 **실패하면 되돌리는 것** 둘이다.",
    body: [
      { h: "자리표는 값의 개수와 맞아야 한다", t: "`?` 를 셋 적고 값을 둘 넘기면 실행 시점에 오류가 난다. 목록으로 조건을 만들 때는 개수만큼 자리표를 만들어야 하고, 이걸 손으로 세다 틀리는 일이 흔하다." },
      { h: "예외 모드를 켜 둔다", t: "기본값에서는 쿼리가 실패해도 조용히 false 를 돌려준다. `PDO::ERRMODE_EXCEPTION` 을 켜면 실패가 예외로 올라와, 잘못된 결과로 계속 진행하는 일이 없어진다." },
      { h: "여러 줄을 고칠 땐 트랜잭션", t: "돈을 옮기는 두 줄 중 하나만 성공하면 돈이 사라진다. `beginTransaction` 으로 묶고 실패하면 `rollBack` 한다 — 중간 상태가 밖에 보이지 않는다." },
      { h: "N+1 을 조심한다", t: "목록을 읽고 각 항목마다 다시 쿼리하면 100개에 101번이다. `IN (?, ?, …)` 으로 한 번에 읽어 메모리에서 붙이면 두 번이면 끝난다." },
    ],
    code: { c: "$ph = implode(\",\", array_fill(0, count($ids), \"?\"));\n$st = $pdo->prepare(\"SELECT * FROM u WHERE id IN ($ph)\");\n$st->execute($ids);\n\ntry { $pdo->beginTransaction(); …; $pdo->commit(); }\ncatch (Throwable $e) { $pdo->rollBack(); throw $e; }", cap: "개수를 맞추고, 실패하면 되돌린다" },
    key: ["자리표 개수 = 값 개수", "예외 모드를 켠다", "N+1 은 `IN` 으로 접는다"],
  },
  q: [
    {
      k: "in_clause · 개수만큼 자리표 만들기",
      qq: "<code>in_clause(array $ids): string</code> 를 만드세요. 개수만큼 <code>?</code> 를 쉼표로 이어 돌려주고, <b>빈 목록이면 빈 문자열</b>입니다.",
      src: "<?php\nfunction in_clause(array $ids): string {\n    return \"?, ?, ?\";\n}\n",
      sol: "<?php\nfunction in_clause(array $ids): string {\n    if (count($ids) === 0) { return \"\"; }\n    return implode(\", \", array_fill(0, count($ids), \"?\"));\n}\n",
      test: test('eqv(in_clause([1, 2, 3]), "?, ?, ?", "세 개");\neqv(in_clause([1]), "?", "하나");\neqv(in_clause([]), "", "빈 목록");\neqv(in_clause([1, 2, 3, 4, 5]), "?, ?, ?, ?, ?", "다섯 개");\n'),
      ex: "자리표 개수를 고정하면 목록 크기가 달라지는 순간 실행이 실패합니다. 그리고 빈 목록에 `IN ()` 을 쓰면 문법 오류라, 아예 쿼리를 보내지 말아야 한다는 신호로 빈 문자열을 돌려줍니다.",
    },
    {
      k: "transfer · 하나만 성공하면 안 된다",
      qq: "<code>transfer(array &$acc, string $from, string $to, int $amt): bool</code> 를 만드세요. 잔액이 모자라면 <b>아무것도 바꾸지 않고</b> false 입니다.",
      src: "<?php\nfunction transfer(array &$acc, string $from, string $to, int $amt): bool {\n    $acc[$from] -= $amt;\n    if ($acc[$from] < 0) { return false; }\n    $acc[$to] += $amt;\n    return true;\n}\n",
      sol: "<?php\nfunction transfer(array &$acc, string $from, string $to, int $amt): bool {\n    if ($amt < 0) { return false; }\n    if (($acc[$from] ?? 0) < $amt) { return false; }\n    $acc[$from] -= $amt;\n    $acc[$to] = ($acc[$to] ?? 0) + $amt;\n    return true;\n}\n",
      test: test('$a = ["x" => 100, "y" => 0];\neqv(transfer($a, "x", "y", 30), true, "성공");\neqv($a, ["x" => 70, "y" => 30], "양쪽이 함께 바뀐다");\n$b = ["x" => 10, "y" => 0];\neqv(transfer($b, "x", "y", 50), false, "잔액 부족");\neqv($b, ["x" => 10, "y" => 0], "실패하면 아무것도 안 바뀐다");\n$c = ["x" => 10, "y" => 0];\neqv(transfer($c, "x", "y", -5), false, "음수 금액");\neqv($c, ["x" => 10, "y" => 0], "음수도 아무것도 안 바꾼다");\n'),
      ex: "먼저 빼고 나중에 검사하면, 실패한 뒤에도 돈이 사라진 채 남습니다. 반환값만 보면 false 라 맞아 보여요 — 그래서 실패 뒤의 상태까지 확인합니다. 바꾸기 전에 전부 검사하는 것이 트랜잭션의 정신입니다.",
    },
    {
      k: "group_by_id · N+1 을 한 번으로 접기",
      qq: "<code>group_by_id(array $rows): array</code> 를 만드세요. <code>[['id'=&gt;1,'v'=&gt;'a'], …]</code> 를 <code>[1 =&gt; ['a', …]]</code> 로 묶습니다. 값의 순서는 <b>들어온 순서</b>입니다.",
      src: "<?php\nfunction group_by_id(array $rows): array {\n    $out = [];\n    foreach ($rows as $r) { $out[$r[\"id\"]] = $r[\"v\"]; }\n    return $out;\n}\n",
      sol: "<?php\nfunction group_by_id(array $rows): array {\n    $out = [];\n    foreach ($rows as $r) {\n        $out[$r[\"id\"]][] = $r[\"v\"];\n    }\n    return $out;\n}\n",
      test: test('eqv(group_by_id([["id" => 1, "v" => "a"], ["id" => 1, "v" => "b"]]), [1 => ["a", "b"]], "같은 id 는 모은다");\neqv(group_by_id([["id" => 2, "v" => "x"]]), [2 => ["x"]], "하나");\neqv(group_by_id([]), [], "빈 목록");\neqv(group_by_id([["id" => 1, "v" => "a"], ["id" => 2, "v" => "b"]]), [1 => ["a"], 2 => ["b"]], "서로 다른 id");\n'),
      ex: "덮어쓰면 같은 id 의 앞 값들이 사라집니다 — 한 사용자의 주문 다섯 건 중 마지막 하나만 남는 거예요. 한 번의 쿼리로 다 읽어 온 의미가 없어집니다. 대괄호를 비워 두면 PHP 가 알아서 배열로 만들어 덧붙입니다.",
    },
  ],
},
/* ── 성능과 런타임 ───────────────────────────────────────── */
{
  unit: "성능과 런타임 — PHP 는 어떻게 빨라졌나",
  lesson: "직접 짜 보기 — 다시 하지 않기",
  th: {
    sum: "PHP 가 빨라진 이유는 **같은 일을 다시 하지 않게** 만든 장치들 덕분이다.",
    body: [
      { h: "OPcache 는 컴파일을 한 번만", t: "PHP 는 요청마다 소스를 opcode 로 바꾼다. OPcache 는 그 결과를 메모리에 두어 다음 요청부터 건너뛴다 — 코드를 한 줄도 안 고치고 몇 배 빨라지는 유일한 스위치다." },
      { h: "메모리에 다 올리지 않는다", t: "큰 파일을 배열로 통째로 읽으면 메모리가 터진다. 제너레이터(`yield`)로 한 줄씩 흘려보내면 메모리가 일정하게 유지된다." },
      { h: "반복문 안의 count 를 조심한다", t: "매 반복마다 다시 세는 코드는 배열이 클수록 느려진다. 사소해 보이지만, 안에서 쿼리를 부르는 경우라면 사소하지 않다." },
      { h: "먼저 재고 나서 고친다", t: "느릴 것 같은 곳과 실제로 느린 곳은 자주 다르다. 재 보지 않고 고치면 시간만 쓰고 아무것도 안 빨라진다." },
    ],
    code: { c: "// 다 올리지 않는다\nfunction lines(string $p) {\n    $f = fopen($p, 'r');\n    while (($l = fgets($f)) !== false) { yield rtrim($l); }\n    fclose($f);\n}", cap: "한 번만, 그리고 조금씩" },
    key: ["OPcache 는 공짜 성능", "큰 데이터는 흘려보낸다", "재고 나서 고친다"],
  },
  q: [
    {
      k: "memo · 같은 입력은 다시 계산하지 않기",
      qq: "<code>memo(callable $f): callable</code> 을 만드세요. 돌려받은 함수는 <b>같은 인자면 캐시된 값</b>을 씁니다.",
      src: "<?php\nfunction memo(callable $f): callable {\n    return function ($x) use ($f) { return $f($x); };\n}\n",
      sol: "<?php\nfunction memo(callable $f): callable {\n    $cache = [];\n    return function ($x) use ($f, &$cache) {\n        $k = serialize($x);\n        if (!array_key_exists($k, $cache)) { $cache[$k] = $f($x); }\n        return $cache[$k];\n    };\n}\n",
      test: test('$calls = 0;\n$slow = function ($x) use (&$calls) { $calls++; return $x * 2; };\n$fast = memo($slow);\neqv($fast(3), 6, "첫 호출");\neqv($fast(3), 6, "두 번째도 같은 값");\neqv($calls, 1, "실제 계산은 한 번뿐이어야 한다");\neqv($fast(4), 8, "다른 인자");\neqv($calls, 2, "인자가 다르면 다시 계산");\n'),
      ex: "그냥 넘겨 주기만 하면 캐시가 없는 것과 같습니다 — 반환값은 맞으니 테스트가 통과할 것 같지만, 호출 횟수를 세면 바로 드러나요. 여기서 `&$cache` 는 의도적입니다. 값을 계속 이어 써야 하니까요.",
    },
    {
      k: "chunks · 통째로 올리지 않기",
      qq: "<code>chunks(array $xs, int $n): array</code> 를 만드세요. <code>n</code>개씩 묶은 <b>묶음의 목록</b>을 돌려줍니다. <code>n</code> 이 1 미만이면 빈 배열입니다.",
      src: "<?php\nfunction chunks(array $xs, int $n): array {\n    return [$xs];\n}\n",
      sol: "<?php\nfunction chunks(array $xs, int $n): array {\n    if ($n < 1) { return []; }\n    return array_chunk($xs, $n);\n}\n",
      test: test('eqv(chunks([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]], "자투리 포함");\neqv(chunks([1, 2], 5), [[1, 2]], "묶음이 하나");\neqv(chunks([], 2), [], "빈 배열");\neqv(chunks([1, 2, 3], 0), [], "n 이 0 이면 빈 배열");\neqv(chunks([1, 2, 3, 4], 2), [[1, 2], [3, 4]], "딱 나눠떨어짐");\n'),
      ex: "십만 건을 한 번에 넘기면 메모리와 쿼리 길이 상한에 부딪힙니다. 묶어서 나눠 보내면 메모리가 일정하게 유지돼요 — 자투리를 빠뜨리지 않는 것과 `n=0` 에서 무한 반복이 안 나게 막는 것이 핵심입니다.",
    },
    {
      k: "sum_fast · 반복문 밖으로 빼기",
      qq: "<code>sum_fast(array $xs, array &$counted): int</code> 를 만드세요. 합을 구하되 <b>길이는 딱 한 번만</b> 세고, 센 횟수를 <code>$counted</code> 에 기록합니다(<code>count_calls</code>를 부를 때마다 늘어납니다).",
      src: "<?php\nfunction count_calls(array $xs, array &$counted): int {\n    $counted[] = 1;\n    return count($xs);\n}\n\nfunction sum_fast(array $xs, array &$counted): int {\n    $s = 0;\n    for ($i = 0; $i < count_calls($xs, $counted); $i++) { $s += $xs[$i]; }\n    return $s;\n}\n",
      sol: "<?php\nfunction count_calls(array $xs, array &$counted): int {\n    $counted[] = 1;\n    return count($xs);\n}\n\nfunction sum_fast(array $xs, array &$counted): int {\n    $n = count_calls($xs, $counted);\n    $s = 0;\n    for ($i = 0; $i < $n; $i++) { $s += $xs[$i]; }\n    return $s;\n}\n",
      test: test('$c = [];\neqv(sum_fast([1, 2, 3], $c), 6, "합");\neqv(count($c), 1, "길이는 한 번만 세야 한다");\n$c2 = [];\neqv(sum_fast([], $c2), 0, "빈 배열");\neqv(count($c2), 1, "빈 배열이어도 한 번");\n$c3 = [];\nsum_fast([1, 2, 3, 4, 5], $c3);\neqv(count($c3), 1, "길이가 늘어도 한 번");\n'),
      ex: "조건식은 **반복할 때마다** 실행됩니다. `count` 라면 조금 느린 정도지만, 그 자리에 쿼리나 파일 읽기가 있으면 n번 부르게 돼요 — 변하지 않는 값은 반복문 밖에서 한 번만 구합니다.",
    },
  ],
},
/* ── 모던 PHP ────────────────────────────────────────────── */
{
  unit: "모던 PHP — 8.x 가 바꾼 것들",
  lesson: "직접 짜 보기 — 짧아지고 안전해진 문법",
  th: {
    sum: "PHP 8 은 **군더더기를 줄이고, 조용한 실패를 요란하게** 만들었다.",
    body: [
      { h: "match 는 엄격하고 값을 돌려준다", t: "`switch` 는 `==` 로 견주고 `break` 를 잊으면 아래로 흐른다. `match` 는 `===` 로 견주고 값을 바로 돌려주며, 맞는 가지가 없으면 예외를 던진다 — 빠뜨린 경우가 조용히 지나가지 않는다." },
      { h: "널 세이프 연산자", t: "`$a?->b()?->c` 는 중간이 null 이면 전체가 null 이다. `if` 로 겹겹이 감싸던 코드가 한 줄이 된다." },
      { h: "이름 붙인 인자", t: "`f(정렬: true)` 처럼 부르면 어느 값이 무엇인지 읽는 자리에서 바로 보인다. `f(true, false, true)` 같은 불리언 나열의 수수께끼가 사라진다." },
      { h: "enum 은 잘못된 값을 못 만들게 한다", t: "문자열 상수로 상태를 다루면 오타가 실행 중에야 드러난다. enum 이면 없는 값은 애초에 만들 수 없다." },
    ],
    code: { c: "$label = match($code) {\n    200, 201 => '성공',\n    404      => '없음',\n    default  => '기타',\n};\n\n$city = $user?->address?->city;   // 중간이 null 이면 null", cap: "짧아지고, 빠뜨림이 드러난다" },
    key: ["`match` 는 `===` 이고 값을 돌려준다", "`?->` 로 null 을 흘려보낸다", "enum 은 잘못된 값을 막는다"],
  },
  q: [
    {
      k: "label · 엄격하게 가르기",
      qq: "<code>label($code): string</code> 를 만드세요. <code>200</code>·<code>201</code> 은 <code>\"성공\"</code>, <code>404</code> 는 <code>\"없음\"</code>, 그 밖은 <code>\"기타\"</code> 입니다. <b>타입이 다르면 같지 않습니다</b>.",
      src: "<?php\nfunction label($code): string {\n    switch ($code) {\n        case 200:\n        case 201:\n            return \"성공\";\n        case 404:\n            return \"없음\";\n    }\n    return \"기타\";\n}\n",
      sol: "<?php\nfunction label($code): string {\n    return match ($code) {\n        200, 201 => \"성공\",\n        404 => \"없음\",\n        default => \"기타\",\n    };\n}\n",
      test: test('eqv(label(200), "성공", "200");\neqv(label(201), "성공", "201");\neqv(label(404), "없음", "404");\neqv(label(500), "기타", "그 밖");\neqv(label("200"), "기타", "문자열 \\"200\\" 은 200 이 아니다");\neqv(label(null), "기타", "null");\n'),
      ex: "`switch` 는 `==` 로 견줍니다 — 문자열 \"200\" 이 정수 200 과 같다고 판단해요. 외부에서 온 값은 거의 언제나 문자열이라, 검증을 건너뛴 값이 여기서 조용히 통과합니다. `match` 는 `===` 라 그런 일이 없습니다.",
    },
    {
      k: "city_of · 중간이 없으면 없는 대로",
      qq: "<code>city_of(?object $u): ?string</code> 를 만드세요. <code>$u-&gt;address()-&gt;city</code> 를 돌려주되 <b>중간이 <code>null</code> 이면 <code>null</code></b> 입니다.",
      src: "<?php\nfunction city_of(?object $u): ?string {\n    return $u->address()->city;\n}\n",
      sol: "<?php\nfunction city_of(?object $u): ?string {\n    return $u?->address()?->city;\n}\n",
      test: test('$addr = new class { public $city = "서울"; };\n$u = new class($addr) { public function __construct(private $a) {} public function address() { return $this->a; } };\neqv(city_of($u), "서울", "정상 경로");\n$u2 = new class { public function address() { return null; } };\neqv(city_of($u2), null, "주소가 없다");\neqv(city_of(null), null, "사용자가 없다");\n'),
      ex: "중간이 null 인데 그대로 이어 가면 `null->address()` 에서 치명적 오류가 나 페이지 전체가 죽습니다. `?->` 는 '없으면 거기서 멈추고 null' 이라는 흔한 규칙을 한 글자로 적게 해 줘요 — if 로 겹겹이 감싸던 코드가 사라집니다.",
    },
    {
      k: "Status · 없는 값은 못 만들게",
      qq: "문자열 백드 <code>enum Status</code>(<code>Draft='draft'</code>, <code>Live='live'</code>)와 <code>status_of(string $s): ?Status</code> 를 만드세요. 없는 값이면 <code>null</code> 입니다.",
      src: "<?php\nclass Status {\n    const Draft = \"draft\";\n    const Live = \"live\";\n}\n\nfunction status_of(string $s): ?Status {\n    return null;\n}\n",
      sol: "<?php\nenum Status: string {\n    case Draft = \"draft\";\n    case Live = \"live\";\n}\n\nfunction status_of(string $s): ?Status {\n    return Status::tryFrom($s);\n}\n",
      test: test('eqv(status_of("draft"), Status::Draft, "초안");\neqv(status_of("live"), Status::Live, "공개");\neqv(status_of("없는값"), null, "없는 값은 null");\neqv(status_of(""), null, "빈 문자열");\neqv(Status::Draft->value, "draft", "값을 꺼낼 수 있다");\neqv(count(Status::cases()), 2, "경우는 둘뿐");\n'),
      ex: "상수로 두면 `\"drft\"` 라는 오타가 그대로 저장되고, 몇 달 뒤 목록에서 사라진 글로 발견됩니다. enum 은 정해진 경우만 존재해서 오타가 값이 될 수 없고, `tryFrom` 이 '변환할 수 없다' 를 null 로 정직하게 알려 줍니다.",
    },
  ],
},
];
