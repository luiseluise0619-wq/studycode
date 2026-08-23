/* PHP 디버깅 12 — 돌아가는 것처럼 보이는 고장난 코드를 받아 고친다.
   채점은 로컬 러너의 실제 php 가 한다.
   계약
     1. src 는 문법 오류가 아니고 TODO 도 없다. 작은 입력에서는 통과하기도 한다.
     2. src 는 test.php 를 반드시 실패한다.
     3. sol 은 test.php 를 전부 통과한다.
   검증:  node tools/runner/server.cjs &   그리고   node ver_dbgphp.cjs ./dbg_php.cjs */

const T = body => `<?php
require "sol.php";

$fails = 0;
function eqv($got, $want, $msg) {
    global $fails;
    if ($got !== $want) {
        echo "실패: $msg — 받은 값 " . var_export($got, true)
           . ", 기대 " . var_export($want, true) . "\\n";
        $fails++;
    }
}

${body}

if ($fails > 0) { exit(1); }
echo "ok\\n";
`;

module.exports = [

/* ── 1 ── */
{ lang:"php", cat:"debug", k:"토큰을 느슨하게 견준다",
  q:"발급한 토큰과 들어온 토큰이 <b>같은 문자열인지</b> 확인하는 함수입니다. 평소에는 잘 막는데, 어떤 토큰 쌍에서는 <b>전혀 다른 값인데도 통과</b>합니다.",
  src:`<?php
function token_ok(string $given, string $stored): bool {
    return $given == $stored;
}
`,
  sol:`<?php
function token_ok(string $given, string $stored): bool {
    return hash_equals($stored, $given);
}
`,
  test:{"test.php":T(`
eqv(token_ok("0e123", "0e456"), false, "숫자로 읽히는 두 문자열은 다른 값이다");
eqv(token_ok("abc", "abc"), true, "같은 문자열은 통과");
eqv(token_ok("abc", "abd"), false, "다른 문자열은 거부");
eqv(token_ok("10", "1e1"), false, "지수 표기도 다른 문자열이다");
eqv(token_ok("", ""), true, "빈 문자열끼리는 같다");
`)},
  ex:"🐛 원인: <code>==</code> 는 양쪽이 <b>숫자로 읽히는 문자열</b>이면 숫자로 바꿔 견줍니다. <code>'0e123'</code> 과 <code>'0e456'</code> 은 둘 다 <b>0 의 지수 표기</b>라 같다고 판정됩니다. 해시 결과가 <code>0e</code> 로 시작할 확률은 낮지만 0 은 아니고, 공격자는 그런 값을 <b>일부러 찾아낼 수 있습니다</b>.\n🔧 해결: 문자열은 <code>===</code> 로 견주고, 비밀값이라면 <code>hash_equals</code> 를 씁니다 — 길이가 같으면 <b>언제나 같은 시간</b>이 걸려 한 글자씩 맞춰 보는 시간 공격까지 막습니다.\n🛡 재발 방지: 토큰·해시·서명 비교에는 <code>==</code> 를 절대 쓰지 마세요. 코드 리뷰 항목으로 못 박고, 정적 분석기의 느슨한 비교 규칙을 켜 두면 자동으로 걸립니다." },

/* ── 2 ── */
{ lang:"php", cat:"debug", k:"점이 없는 파일 이름",
  q:"파일 이름에서 <b>확장자를 소문자로</b> 뽑는 함수입니다. 확장자가 없으면 빈 문자열이어야 하고, <code>.env</code> 처럼 <b>점으로 시작만</b> 하는 이름도 확장자가 없는 것으로 봅니다. 그런데 확장자가 없는 파일에서 <b>이름 전체</b>가 확장자로 나옵니다.",
  src:`<?php
function ext(string $name): string {
    $parts = explode(".", $name);
    return strtolower(end($parts));
}
`,
  sol:`<?php
function ext(string $name): string {
    $at = strrpos($name, ".");
    if ($at === false || $at === 0) return "";
    return strtolower(substr($name, $at + 1));
}
`,
  test:{"test.php":T(`
eqv(ext("README"), "", "점이 없으면 확장자도 없다");
eqv(ext("report.PDF"), "pdf", "소문자로 돌려준다");
eqv(ext("archive.tar.gz"), "gz", "마지막 점 뒤가 확장자");
eqv(ext(".env"), "", "점으로 시작만 하는 이름은 확장자가 없다");
eqv(ext("noext."), "", "점으로 끝나면 확장자가 비어 있다");
`)},
  ex:"🐛 원인: <code>explode</code> 는 구분자가 <b>하나도 없어도</b> 원본 하나짜리 배열을 돌려줍니다. 그래서 <code>end()</code> 가 집는 것이 '확장자' 가 아니라 <b>파일 이름 전체</b>가 됩니다. 확장자가 늘 있는 테스트 데이터에서는 완벽히 동작합니다.\n🔧 해결: '<b>마지막 점의 위치</b>' 를 직접 찾습니다. 점이 없으면(<code>false</code>) 확장자가 없는 것이고, 점이 <b>0 번 자리</b>면 숨김 파일이므로 역시 없습니다.\n🛡 재발 방지: 경로를 다룰 때는 <code>pathinfo()</code> 처럼 <b>규격을 아는 함수</b>를 먼저 찾아보세요. 그리고 '구분자가 없는 입력' 과 '구분자가 맨 앞·맨 뒤에 있는 입력' 은 문자열 분해 함수의 <b>고정 테스트</b>여야 합니다." },

/* ── 3 ── */
{ lang:"php", cat:"debug", k:"거른 배열을 그대로 내보낸다",
  q:"활성 사용자의 <code>id</code> 만 골라 <b>JSON 배열 문자열</b>로 내보내는 함수입니다. 앞쪽이 전부 활성일 때는 잘 나오는데, <b>중간이 걸러지면</b> 클라이언트가 배열 대신 객체를 받습니다.",
  src:`<?php
function active_ids_json(array $rows): string {
    $ids = [];
    foreach ($rows as $r) {
        if ($r["active"]) $ids[] = $r["id"];
    }
    $ids = array_filter($ids, fn($id) => $id > 0);
    return json_encode($ids);
}
`,
  sol:`<?php
function active_ids_json(array $rows): string {
    $ids = [];
    foreach ($rows as $r) {
        if ($r["active"]) $ids[] = $r["id"];
    }
    $ids = array_values(array_filter($ids, fn($id) => $id > 0));
    return json_encode($ids);
}
`,
  test:{"test.php":T(`
$rows = [["id" => 1, "active" => true], ["id" => 0, "active" => true], ["id" => 3, "active" => true]];
eqv(active_ids_json($rows), "[1,3]", "가운데가 걸려도 배열이어야 한다");
eqv(active_ids_json([["id" => 1, "active" => true]]), "[1]", "하나만 있을 때");
eqv(active_ids_json([]), "[]", "빈 입력은 빈 배열");
eqv(active_ids_json([["id" => 0, "active" => true]]), "[]", "전부 걸리면 빈 배열");
`)},
  ex:"🐛 원인: <code>array_filter</code> 는 <b>키를 그대로 남깁니다</b>. 가운데가 걸리면 키가 <code>0, 2</code> 처럼 띄엄띄엄해지고, PHP 배열은 목록과 사전을 한 타입으로 쓰기 때문에 <code>json_encode</code> 가 그것을 <b>객체</b>로 내보냅니다. 앞쪽만 걸러지거나 아무것도 안 걸리면 키가 0 부터 이어져 우연히 배열로 나옵니다.\n🔧 해결: 내보내기 전에 <code>array_values()</code> 로 <b>번호를 다시 매깁니다</b>.\n🛡 재발 방지: 응답 타입이 <b>데이터에 따라 흔들리는 것</b>이 가장 나쁩니다 — 클라이언트는 배열을 기대하다 어느 날 객체를 받습니다. 목록을 내보내는 자리에는 <code>array_values</code> 를 규칙으로 두고, 테스트에 '<b>가운데가 걸리는</b>' 입력을 꼭 넣으세요." },

/* ── 4 ── */
{ lang:"php", cat:"debug", k:"참조로 훑은 뒤 남는 것",
  q:"모든 값을 두 배로 만든 뒤 그대로 모아 돌려주는 함수입니다. 그런데 <b>마지막 원소만</b> 엉뚱한 값이 됩니다.",
  src:`<?php
function double_all(array $a): array {
    foreach ($a as &$v) {
        $v = $v * 2;
    }
    $out = [];
    foreach ($a as $v) {
        $out[] = $v;
    }
    return $out;
}
`,
  sol:`<?php
function double_all(array $a): array {
    foreach ($a as &$v) {
        $v = $v * 2;
    }
    unset($v);
    $out = [];
    foreach ($a as $v) {
        $out[] = $v;
    }
    return $out;
}
`,
  test:{"test.php":T(`
eqv(double_all([1, 2, 3]), [2, 4, 6], "세 개를 두 배로");
eqv(double_all([5]), [10], "하나짜리");
eqv(double_all([]), [], "빈 배열");
eqv(double_all([1, 2, 3, 4]), [2, 4, 6, 8], "네 개를 두 배로");
`)},
  ex:"🐛 원인: <code>foreach ($a as &$v)</code> 가 끝나도 <code>$v</code> 는 <b>마지막 원소를 가리키는 참조로 남습니다</b>. 그 뒤 같은 이름으로 다시 훑으면 대입할 때마다 <b>마지막 칸이 덮어써집니다</b> — 그래서 마지막 값만 틀립니다. 원소가 하나면 티가 안 나고, 두 개여도 우연히 맞을 수 있습니다.\n🔧 해결: 참조 순회가 끝나면 <b>즉시 <code>unset($v)</code></b> 합니다. 이것이 PHP 의 표준 관용구입니다.\n🛡 재발 방지: 더 나은 방법은 <b>참조를 아예 안 쓰는 것</b>입니다 — <code>array_map</code> 이나 새 배열에 담기로 바꾸면 이 함정이 사라집니다. 참조를 꼭 써야 한다면 변수 이름을 그 블록에서만 쓰는 이름으로 두세요." },

/* ── 5 ── */
{ lang:"php", cat:"debug", k:"정렬한 것과 자른 것이 다르다",
  q:"점수 배열에서 <b>가장 큰 두 값</b>을 내림차순으로 돌려주는 함수입니다. 원본을 건드리지 않으려고 복사까지 해 두었는데, 결과가 <b>정렬되지 않은 채</b> 나옵니다.",
  src:`<?php
function top_two(array $a): array {
    $copy = $a;
    rsort($copy);
    return array_slice($a, 0, 2);
}
`,
  sol:`<?php
function top_two(array $a): array {
    $copy = $a;
    rsort($copy);
    return array_slice($copy, 0, 2);
}
`,
  test:{"test.php":T(`
eqv(top_two([3, 9, 1, 7]), [9, 7], "가장 큰 둘");
eqv(top_two([5, 5, 1]), [5, 5], "동점도 그대로");
eqv(top_two([2]), [2], "하나뿐이면 하나만");
eqv(top_two([]), [], "빈 배열");
eqv(top_two([1, 2, 3]), [3, 2], "오름차순 입력");
`)},
  ex:"🐛 원인: 정렬한 것은 <code>$copy</code> 인데 잘라 낸 것은 <b>원본 <code>$a</code></b> 입니다. 이미 큰 값이 앞에 있는 입력(<code>[9, 7, 1]</code>)에서는 우연히 맞아, 예제 데이터로는 절대 안 잡힙니다.\n🔧 해결: 자를 대상을 <code>$copy</code> 로 바꿉니다. 한 글자 차이지만 결과는 전혀 다릅니다.\n🛡 재발 방지: PHP 의 정렬 함수(<code>sort</code>·<code>rsort</code>·<code>usort</code>)는 <b>인자를 직접 고치고 <code>bool</code> 을 돌려줍니다</b> — <code>$s = sort($a)</code> 라고 쓰면 <code>$s</code> 는 <code>true</code> 입니다. '고치는 함수' 와 '돌려주는 함수' 를 이름으로 구분해 외우고, 테스트에는 <b>이미 정렬된 입력과 뒤섞인 입력</b>을 함께 넣으세요." },

/* ── 6 ── */
{ lang:"php", cat:"debug", k:"금액을 실수로 다루면",
  q:"<code>\"1.15\"</code> 같은 금액 문자열을 <b>센트 단위 정수</b>로 바꾸는 함수입니다. 대부분 맞는데 <b>어떤 금액에서만</b> 1 센트가 모자랍니다.",
  src:`<?php
function to_cents(string $price): int {
    return (int) (floatval($price) * 100);
}
`,
  sol:`<?php
function to_cents(string $price): int {
    return (int) round(floatval($price) * 100);
}
`,
  test:{"test.php":T(`
eqv(to_cents("1.15"), 115, "1.15 달러는 115 센트");
eqv(to_cents("0.29"), 29, "0.29 달러는 29 센트");
eqv(to_cents("10.00"), 1000, "소수가 없는 금액");
eqv(to_cents("0"), 0, "0 원");
eqv(to_cents("2.675"), 268, "셋째 자리는 반올림");
`)},
  ex:"🐛 원인: <code>1.15</code> 는 이진 부동소수로 정확히 담기지 않아 실제로는 <b>1.1499999…</b> 입니다. 100 을 곱하면 <code>114.99999…</code> 가 되고, <code>(int)</code> 캐스팅은 <b>버림</b>이라 114 가 됩니다. <code>0.5</code>·<code>0.25</code> 처럼 이진수로 딱 떨어지는 금액에서는 멀쩡합니다.\n🔧 해결: 캐스팅 전에 <code>round()</code> 를 겁니다. 그러면 아주 작은 오차가 흡수됩니다.\n🛡 재발 방지: 근본 해법은 <b>돈을 실수로 다루지 않는 것</b>입니다 — 처음부터 정수 최소 단위로 받고 저장하세요. 실수를 거쳐야 한다면 <code>bcmath</code> 나 정수 문자열 파싱을 쓰고, 테스트에는 <b>이진수로 안 떨어지는 금액</b>(0.1·1.15·2.675)을 꼭 넣으세요." },

/* ── 7 ── */
{ lang:"php", cat:"debug", k:"찾을 말을 패턴으로 넘긴다",
  q:"본문에 어떤 <b>글자 그대로</b>가 몇 번 나오는지 세는 함수입니다. 보통 낱말은 맞는데, 찾을 말에 <code>.</code> 이 들어가면 터무니없이 큰 수가 나오고 <code>+</code> 가 들어가면 <b>0</b> 이 나옵니다.",
  src:`<?php
function count_occurrences(string $text, string $needle): int {
    if ($needle === "") return 0;
    return preg_match_all("/" . $needle . "/", $text);
}
`,
  sol:`<?php
function count_occurrences(string $text, string $needle): int {
    if ($needle === "") return 0;
    return substr_count($text, $needle);
}
`,
  test:{"test.php":T(`
eqv(count_occurrences("a.b.c", "."), 2, "점은 글자 그대로 두 번");
eqv(count_occurrences("1+2+3", "+"), 2, "더하기도 글자 그대로");
eqv(count_occurrences("abcabc", "bc"), 2, "보통 낱말");
eqv(count_occurrences("aaa", "a"), 3, "겹치지 않게 센다");
eqv(count_occurrences("abc", ""), 0, "빈 문자열은 0");
`)},
  ex:"🐛 원인: 사용자가 준 글자를 <b>패턴 문법으로</b> 해석했습니다. <code>.</code> 은 '아무 글자' 라 전부 세고, <code>+</code> 는 앞에 붙을 것이 없어 패턴 컴파일이 실패합니다(경고와 함께 <code>false</code>). 값과 코드를 섞었다는 점에서 SQL 인젝션과 같은 종류의 실수입니다.\n🔧 해결: 정규식이 필요 없는 문제입니다 — <code>substr_count</code> 는 글자 그대로 세고 겹치지 않게 셉니다.\n🛡 재발 방지: 패턴이 꼭 필요하면 <code>preg_quote($needle, '/')</code> 로 <b>메타문자를 막고</b> 넣으세요. 더 좋은 습관은 '사용자 입력이 문법으로 해석되는 자리' 를 목록으로 적어 두고, 각각 <b>문자열 API 로 바꿀 수 있는지</b> 먼저 묻는 것입니다." },

/* ── 8 ── */
{ lang:"php", cat:"debug", k:"숫자 키가 다시 번호 매겨진다",
  q:"기본 설정 위에 사용자 설정을 덮어쓰는 함수입니다. 키가 글자일 때는 잘 덮이는데, <b>키가 숫자처럼 생기면</b> 덮이지 않고 <b>뒤에 하나 더 붙습니다</b>.",
  src:`<?php
function merge_config(array $base, array $over): array {
    return array_merge($base, $over);
}
`,
  sol:`<?php
function merge_config(array $base, array $over): array {
    return array_replace($base, $over);
}
`,
  test:{"test.php":T(`
eqv(merge_config(["2" => "a", "x" => 1], ["2" => "b"]), [2 => "b", "x" => 1], "숫자 키도 덮어쓴다");
eqv(merge_config(["x" => 1], ["x" => 2]), ["x" => 2], "글자 키는 덮어쓴다");
eqv(merge_config(["x" => 1], ["y" => 2]), ["x" => 1, "y" => 2], "없던 키는 더한다");
eqv(merge_config([], ["a" => 1]), ["a" => 1], "빈 기본 설정");
eqv(merge_config(["a" => 1], []), ["a" => 1], "덮을 것이 없으면 그대로");
`)},
  ex:"🐛 원인: <code>array_merge</code> 는 <b>숫자 키를 값으로 보지 않고 자리로</b> 봅니다. 그래서 뒤 배열의 숫자 키는 덮어쓰지 않고 <b>새 번호를 받아 뒤에 붙습니다</b>. 설정 키가 <code>'timeout'</code> 처럼 글자일 때는 완벽히 동작하다가, 상태 코드나 등급처럼 숫자 키가 섞이는 순간 어긋납니다.\n🔧 해결: 키를 그대로 유지하며 덮어쓰는 <code>array_replace</code> 를 씁니다.\n🛡 재발 방지: 목록을 이을 때는 <code>array_merge</code>, 사전을 덮어쓸 때는 <code>array_replace</code> 로 <b>쓰임을 갈라 두세요</b>. 중첩 설정이라면 두 함수 모두 <b>한 겹만</b> 처리하므로 재귀 판(<code>array_replace_recursive</code>)이 필요한지도 함께 따져야 합니다." },

/* ── 9 ── */
{ lang:"php", cat:"debug", k:"바이트로 자르면 글자가 깨진다",
  q:"긴 글을 최대 <code>$max</code> <b>글자</b>까지만 남기고 넘치면 <code>…</code> 을 붙이는 함수입니다. 붙인 결과도 <code>$max</code> 글자를 넘지 않아야 합니다. 영문은 맞는데 <b>한글</b>에서 글자가 깨지고 개수도 안 맞습니다.",
  src:`<?php
function preview(string $s, int $max): string {
    if (strlen($s) <= $max) return $s;
    return substr($s, 0, $max - 1) . "…";
}
`,
  sol:`<?php
function preview(string $s, int $max): string {
    if (mb_strlen($s) <= $max) return $s;
    return mb_substr($s, 0, $max - 1) . "…";
}
`,
  test:{"test.php":T(`
eqv(preview("한국어테스트", 4), "한국어…", "한글은 글자 단위로 자른다");
eqv(preview("abcdef", 4), "abc…", "영문도 같은 규칙");
eqv(preview("abc", 4), "abc", "짧으면 그대로");
eqv(preview("한글", 2), "한글", "딱 맞으면 그대로");
eqv(preview("", 3), "", "빈 문자열");
`)},
  ex:"🐛 원인: <code>strlen</code> 과 <code>substr</code> 은 글자가 아니라 <b>바이트</b>를 셉니다. UTF-8 한글은 한 글자가 3 바이트라, 짧은 글도 '길다' 고 판정되고 <code>substr</code> 이 <b>글자 중간을 잘라</b> 깨진 바이트를 남깁니다. 영문은 1 바이트라 완벽히 동작합니다.\n🔧 해결: <code>mb_strlen</code>·<code>mb_substr</code> 로 바꿉니다. 말줄임표 한 글자를 붙이므로 <code>$max - 1</code> 까지만 남기는 계산은 그대로입니다.\n🛡 재발 방지: 사용자에게 보여 줄 글자 수를 다루는 자리에는 <b>바이트 함수를 쓰지 않는다</b>를 규칙으로 두세요. 입력 길이 제한도 '20 자' 인지 '20 바이트' 인지 명시해야 하고, 테스트에는 <b>한글·이모지</b>를 반드시 넣습니다." },

/* ── 10 ── */
{ lang:"php", cat:"debug", k:"빈 값 검사가 0을 버린다",
  q:"입력에서 표시할 이름을 고르는 함수입니다. 이름이 없거나 빈 문자열이면 <code>\"손님\"</code> 을 씁니다. 그런데 이름이 <code>\"0\"</code> 인 사용자에게도 <b>손님</b>이라고 인사합니다.",
  src:`<?php
function pick_name(array $in): string {
    return !empty($in["name"]) ? (string) $in["name"] : "손님";
}
`,
  sol:`<?php
function pick_name(array $in): string {
    $n = $in["name"] ?? null;
    if ($n === null || $n === "") return "손님";
    return (string) $n;
}
`,
  test:{"test.php":T(`
eqv(pick_name(["name" => "0"]), "0", "0 도 정당한 이름이다");
eqv(pick_name(["name" => "루이"]), "루이", "보통 이름");
eqv(pick_name(["name" => ""]), "손님", "빈 문자열은 없는 것으로 본다");
eqv(pick_name([]), "손님", "키가 아예 없을 때");
eqv(pick_name(["name" => null]), "손님", "null 도 없는 것으로 본다");
`)},
  ex:"🐛 원인: <code>empty()</code> 는 '<b>거짓 같은 값</b>' 을 전부 비었다고 봅니다 — <code>0</code>·<code>\"0\"</code>·<code>0.0</code>·<code>false</code>·<code>[]</code> 가 모두 걸립니다. 이름이 <code>\"0\"</code> 인 경우는 드물지만, 수량·번호·좌표처럼 <b>0 이 흔한 필드</b>에서는 매일 터집니다.\n🔧 해결: '없음' 의 뜻을 <b>정확히 적습니다</b> — 여기서는 <code>null</code> 과 빈 문자열만 없는 것으로 봅니다. <code>??</code> 는 없는 키를 경고 없이 처리해 줍니다.\n🛡 재발 방지: <code>empty()</code> 와 <code>if ($v)</code> 는 '값이 있는가' 가 아니라 '<b>참 같은가</b>' 를 묻는 표현입니다. 존재 여부는 <code>isset</code>·<code>array_key_exists</code>, 빈 값 판정은 <code>=== \"\"</code> 처럼 <b>뜻을 그대로 적으세요</b>." },

/* ── 11 ── */
{ lang:"php", cat:"debug", k:"호출 사이에 남는 상태",
  q:"항목들을 받아 <b>이번에 받은 것만</b> 담아 돌려주는 함수입니다. 한 번 부를 때는 맞는데, <b>두 번째 호출부터</b> 지난 호출의 항목까지 함께 나옵니다.",
  src:`<?php
function collect(array $items): array {
    static $out = [];
    foreach ($items as $i) {
        $out[] = $i;
    }
    return $out;
}
`,
  sol:`<?php
function collect(array $items): array {
    $out = [];
    foreach ($items as $i) {
        $out[] = $i;
    }
    return $out;
}
`,
  test:{"test.php":T(`
eqv(collect([1]), [1], "첫 호출");
eqv(collect([2]), [2], "두 번째 호출에는 지난 것이 없어야 한다");
eqv(collect([]), [], "빈 입력이면 빈 결과");
eqv(collect([3, 4]), [3, 4], "네 번째 호출");
`)},
  ex:"🐛 원인: <code>static</code> 으로 선언한 지역 변수는 함수가 끝나도 <b>사라지지 않고 다음 호출까지 남습니다</b>. 그래서 결과가 호출할 때마다 누적됩니다. 테스트가 함수를 <b>한 번만</b> 부르면 절대 드러나지 않습니다.\n🔧 해결: 매번 새로 만들어야 하는 값이므로 <code>static</code> 을 뗍니다. 캐시처럼 정말 남겨야 하는 값에만 쓰는 키워드입니다.\n🛡 재발 방지: 호출 사이에 남는 상태(<code>static</code>·전역 변수·싱글턴·모듈 수준 변수)는 <b>같은 입력에 같은 출력</b>이라는 성질을 깨뜨립니다. 테스트에서 <b>같은 함수를 두 번 이상</b> 부르는 것만으로 이 부류가 대부분 잡힙니다." },

/* ── 12 ── */
{ lang:"php", cat:"debug", k:"찾은 자리가 0일 때",
  q:"배열에서 값을 찾아 <b>자리 번호</b>를 돌려주는 함수입니다. 없으면 <code>-1</code> 입니다. 그런데 찾는 값이 <b>맨 앞</b>에 있으면 없다고 답합니다.",
  src:`<?php
function index_of(array $a, string $v): int {
    $i = array_search($v, $a, true);
    return $i ? $i : -1;
}
`,
  sol:`<?php
function index_of(array $a, string $v): int {
    $i = array_search($v, $a, true);
    return $i === false ? -1 : $i;
}
`,
  test:{"test.php":T(`
eqv(index_of(["a", "b", "c"], "a"), 0, "맨 앞에 있으면 0");
eqv(index_of(["a", "b", "c"], "b"), 1, "가운데");
eqv(index_of(["a", "b", "c"], "z"), -1, "없으면 -1");
eqv(index_of([], "a"), -1, "빈 배열");
eqv(index_of(["x"], "x"), 0, "하나뿐인 배열의 첫 자리");
`)},
  ex:"🐛 원인: <code>array_search</code> 는 못 찾으면 <code>false</code>, 찾으면 <b>자리 번호</b>를 돌려줍니다. 그런데 <code>$i ? … : -1</code> 은 '<b>참 같은가</b>' 를 묻기 때문에 <b>정당한 자리 번호 0</b> 도 거짓으로 봅니다. 찾는 값이 첫 자리에 없는 테스트만 있으면 절대 안 잡힙니다.\n🔧 해결: <code>=== false</code> 로 <b>실패만</b> 가려냅니다. 성공과 실패를 구분할 때는 값의 참·거짓이 아니라 <b>반환 규약</b>을 그대로 검사해야 합니다.\n🛡 재발 방지: PHP 에는 '실패하면 <code>false</code>, 성공하면 0 일 수도 있는 값' 을 돌려주는 함수가 많습니다 — <code>strpos</code>·<code>array_search</code>·<code>filter_var</code>. 이 함수들의 반환값은 <b>언제나 <code>=== false</code></b> 로 검사하고, 테스트에 <b>0 이 나오는 경우</b>를 반드시 넣으세요." },

];
