/* PHP 실행형 12문항 — 실제 php 가 테스트를 돌려 채점한다.
   규약: test.php 가 sol.php 를 require 하고, 실패가 있으면 exit(1) 로 끝낸다.
   순서가 곧 난이도 순서다(계단식). */

/* 공통 테스트 틀. eqv 는 === 로 비교하므로 타입까지 본다. */
const T=(body)=>`<?php
require "sol.php";

$fails = 0;
function check($cond, $msg) {
    global $fails;
    if (!$cond) { echo "실패: $msg\\n"; $fails++; }
}
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

module.exports=[

/* ── 1 ── */
{ lang:"php", k:"느슨한 비교와 엄격한 비교", cat:"internals",
  q:"섞여 들어온 ID 목록을 정리하는 <code>normalize_ids(array $raw): array</code> 를 구현하세요. <b><code>filter_var(..., FILTER_VALIDATE_INT)</code> 기준으로 정수로 해석 가능한 값만</b> 남기고, <b>int 로 변환</b>해 <b>입력 순서를 유지</b>하며 <b>중복을 제거</b>합니다. 결과는 0부터 번호가 매겨진 리스트여야 합니다.",
  src:`<?php
function normalize_ids(array $raw): array {
    $out = [];
    foreach ($raw as $v) {
        $n = (int) $v;            // TODO: 정수로 해석 가능한지 먼저 검증해야 한다
        if (in_array($n, $out)) continue;
        $out[] = $n;
    }
    return $out;
}
`,
  sol:`<?php
function normalize_ids(array $raw): array {
    $out = [];
    foreach ($raw as $v) {
        $n = filter_var($v, FILTER_VALIDATE_INT);
        if ($n === false) continue;              // 숫자가 아니면 버린다
        if (in_array($n, $out, true)) continue;  // 엄격 비교로 중복 판정
        $out[] = $n;
    }
    return $out;
}
`,
  test:{"test.php":T(`
eqv(normalize_ids(["1", "2", 2, "03", "x", null, "", 0, "-5"]), [1, 2, 0, -5], "혼합 입력 정리");
eqv(normalize_ids([]), [], "빈 입력");
eqv(normalize_ids(["7", 7]), [7], "문자열과 정수는 같은 ID");
eqv(normalize_ids(["1e2"]), [], "지수 표기는 정수가 아니다");
eqv(normalize_ids([0, "0"]), [0], "0 은 버리지 않는다");
`)},
  ex:"🎯 `(int)` 캐스팅은 **무엇이든 숫자로 만들어 버립니다** — `\"x\"` 도 `null` 도 `\"\"` 도 0 이 되어, 잘못된 입력이 유효한 ID 0 으로 위장합니다. `filter_var(..., FILTER_VALIDATE_INT)` 는 '해석 가능한가' 를 먼저 묻고, 실패를 `false` 로 알립니다.\n⚠️ 그래서 `=== false` 로 검사해야 합니다 — `if (!$n)` 이라고 쓰면 **정상적인 0 까지 버립니다**. 이 문항이 `0` 을 테스트에 넣은 이유입니다.\n💡 `in_array` 의 세 번째 인자 `true` 도 같은 이야기입니다. 기본값인 느슨한 비교는 `\"7\"` 과 `7` 을 같다고 보는데, 여기서는 이미 int 로 정규화했으니 엄격 비교가 의도를 정확히 표현합니다.\n🔧 `\"03\"` 과 `\"1e2\"` 가 거부되는 것이 놀랍다면, 그것이 바로 '**형식을 정하고 그 밖은 거부한다**' 는 검증의 태도입니다 — 관대하게 받아 주면 어디서 값이 변형됐는지 추적할 수 없게 됩니다." },

/* ── 2 ── */
{ lang:"php", k:"배열은 순서 있는 맵", cat:"internals",
  q:"이메일 목록을 도메인별로 묶는 <code>group_by_domain(array $emails): array</code> 를 구현하세요. 키는 <b>소문자 도메인</b>, 값은 <b>입력 순서를 유지한 원본 이메일 배열</b>입니다. 이메일 형식이 아닌 값과 문자열이 아닌 값은 <b>버립니다</b>.",
  src:`<?php
function group_by_domain(array $emails): array {
    $out = [];
    foreach ($emails as $e) {
        $domain = explode('@', (string) $e)[1] ?? '';   // TODO: 검증도 정규화도 없다
        $out[$domain][] = $e;
    }
    return $out;
}
`,
  sol:`<?php
function group_by_domain(array $emails): array {
    $out = [];
    foreach ($emails as $e) {
        if (!is_string($e)) continue;
        if (filter_var($e, FILTER_VALIDATE_EMAIL) === false) continue;
        $at = strrpos($e, '@');
        $domain = strtolower(substr($e, $at + 1));   // 도메인은 대소문자를 구분하지 않는다
        $out[$domain][] = $e;
    }
    return $out;
}
`,
  test:{"test.php":T(`
eqv(group_by_domain(["a@X.com", "b@x.com", "bad", "c@y.io"]),
    ["x.com" => ["a@X.com", "b@x.com"], "y.io" => ["c@y.io"]],
    "도메인 소문자 통합과 순서 유지");
eqv(group_by_domain([]), [], "빈 입력");
eqv(group_by_domain(["nope", null, 42, "@x.com"]), [], "유효한 이메일이 없으면 빈 배열");
eqv(array_keys(group_by_domain(["z@b.com", "y@a.com"])), ["b.com", "a.com"],
    "키 순서는 처음 등장 순서를 따른다");
`)},
  ex:"🎯 PHP 배열은 **순서를 기억하는 맵**이라, `$out[$domain][] = $e;` 한 줄로 '없으면 만들고 있으면 덧붙이는' 그룹화가 끝납니다(자동 생성). 이 관용구를 알면 그룹화 코드가 절반으로 줄어듭니다.\n⚠️ 그런데 **정규화하지 않으면 `X.com` 과 `x.com` 이 서로 다른 키**가 됩니다 — 도메인은 규격상 대소문자를 구분하지 않으니 이건 조용한 버그입니다. 로컬파트(`@` 앞)는 반대로 구분하므로 **소문자로 바꾸면 안 됩니다**.\n💡 `explode('@', $e)[1]` 은 `@` 가 여러 개인 입력에서 틀린 조각을 집습니다. `strrpos` 로 **마지막** `@` 를 찾는 것이 정확하고, 애초에 `FILTER_VALIDATE_EMAIL` 로 걸렀다면 그런 값이 들어오지도 않습니다.\n🔧 키 순서가 '처음 등장 순서' 라는 것도 테스트로 고정했습니다 — 이 성질에 의존하는 코드가 실제로 많고, PHP 는 그것을 보장합니다." },

/* ── 3 ── */
{ lang:"php", k:"널 병합과 설정 기본값", cat:"design",
  q:"설정을 병합하는 <code>merge_config(array $base, array $over): array</code> 를 구현하세요. 규칙은 넷입니다 — ① 뒤(<code>$over</code>)가 앞을 덮는다 ② 값이 <code>null</code> 이면 <b>덮지 않는다</b>('설정하지 않음' 이므로) ③ 양쪽이 모두 <b>연관 배열</b>이면 재귀 병합하고, <b>리스트</b>는 통째로 교체한다 ④ <b>원본 두 배열을 바꾸지 않는다</b>.",
  src:`<?php
function merge_config(array $base, array $over): array {
    return array_merge($base, $over);   // TODO: 중첩·null·리스트 규칙이 없다
}
`,
  sol:`<?php
function merge_config(array $base, array $over): array {
    $out = $base;                        // 값 복사 — 원본은 그대로 남는다
    foreach ($over as $k => $v) {
        if ($v === null) continue;       // '설정하지 않음' 은 덮지 않는다
        $bothMaps = is_array($v)
            && isset($out[$k]) && is_array($out[$k])
            && !array_is_list($v) && !array_is_list($out[$k]);
        $out[$k] = $bothMaps ? merge_config($out[$k], $v) : $v;
    }
    return $out;
}
`,
  test:{"test.php":T(`
$base = ['a' => 1, 'b' => ['x' => 1, 'y' => 2], 'tags' => [1, 2, 3]];
$over = ['b' => ['y' => 9], 'a' => null, 'tags' => [9], 'c' => 0];

eqv(merge_config($base, $over),
    ['a' => 1, 'b' => ['x' => 1, 'y' => 9], 'tags' => [9], 'c' => 0],
    "재귀 병합 · null 무시 · 리스트 교체 · 0 은 덮는다");

eqv($base, ['a' => 1, 'b' => ['x' => 1, 'y' => 2], 'tags' => [1, 2, 3]], "원본 base 는 그대로");
eqv($over, ['b' => ['y' => 9], 'a' => null, 'tags' => [9], 'c' => 0], "원본 over 도 그대로");

eqv(merge_config([], ['a' => 1]), ['a' => 1], "빈 base");
eqv(merge_config(['a' => 1], []), ['a' => 1], "빈 over");
eqv(merge_config(['a' => ['b' => ['c' => 1]]], ['a' => ['b' => ['d' => 2]]]),
    ['a' => ['b' => ['c' => 1, 'd' => 2]]], "3단 중첩");
eqv(merge_config(['a' => 'str'], ['a' => ['k' => 1]]), ['a' => ['k' => 1]],
    "타입이 다르면 그냥 교체");
`)},
  ex:"🎯 설정 병합에서 가장 중요한 판단은 '**`null` 은 값인가 부재인가**' 입니다. 부재로 정하면 `--flag=null` 같은 입력이 기본값을 지우지 못하고, 값으로 정하면 초기화되지 않은 필드가 기본값을 날려 버립니다. 이 문항은 부재로 정했고, **그 결정을 테스트로 못 박았습니다** — 어느 쪽이든 명시적으로 정해 문서화하는 것이 핵심입니다.\n💡 `0` 을 함께 테스트한 이유: `if ($v)` 로 검사하면 `0`·`\"\"`·`false` 가 전부 무시되어 '값을 0 으로 설정' 이 불가능해집니다. `=== null` 이어야 합니다.\n⚠️ 리스트와 연관 배열을 나누는 것도 실용적 관례입니다 — 리스트를 재귀 병합하면 인덱스별로 섞여 `['a','b'] + ['c']` 가 `['c','b']` 가 됩니다. PHP 8.1 의 `array_is_list()` 가 이 구분을 한 줄로 만들어 줍니다.\n🔧 `$out = $base;` 는 배열이 **값 의미**라 그대로 복사입니다(내부적으로는 copy-on-write). 객체가 담겨 있었다면 얕은 복사이므로 이야기가 달라집니다." },

/* ── 4 ── */
{ lang:"php", k:"문자열은 바이트가 아니다", cat:"internals",
  q:"<code>truncate_utf8(string $s, int $max, string $ellipsis = '…'): string</code> 을 구현하세요. <b>글자 수</b> 기준으로 자르고, 실제로 잘랐을 때만 말줄임표를 붙이되 <b>결과의 글자 수가 <code>$max</code> 를 넘지 않아야</b> 합니다. <code>$max</code> 가 말줄임표보다 짧으면 말줄임표를 잘라 넣고, 0 이하면 빈 문자열을 돌려줍니다.",
  src:`<?php
function truncate_utf8(string $s, int $max, string $ellipsis = '…'): string {
    if (strlen($s) <= $max) return $s;             // TODO: 바이트가 아니라 글자 수다
    return substr($s, 0, $max) . $ellipsis;        // TODO: 말줄임표 길이를 빼지 않았다
}
`,
  sol:`<?php
function truncate_utf8(string $s, int $max, string $ellipsis = '…'): string {
    if ($max <= 0) return '';
    if (mb_strlen($s, 'UTF-8') <= $max) return $s;
    $keep = $max - mb_strlen($ellipsis, 'UTF-8');
    if ($keep <= 0) return mb_substr($ellipsis, 0, $max, 'UTF-8');
    return mb_substr($s, 0, $keep, 'UTF-8') . $ellipsis;
}
`,
  test:{"test.php":T(`
eqv(truncate_utf8("한국어테스트", 3), "한국…", "한글은 글자 수로 자른다");
eqv(mb_strlen(truncate_utf8("한국어테스트", 3), 'UTF-8'), 3, "결과 글자 수가 상한을 넘지 않는다");
eqv(truncate_utf8("abc", 5), "abc", "짧으면 그대로");
eqv(truncate_utf8("abcdef", 4), "abc…", "말줄임표 길이를 빼고 자른다");
eqv(truncate_utf8("abcd", 4), "abcd", "정확히 상한이면 자르지 않는다");
eqv(truncate_utf8("한글", 1), "…", "상한이 말줄임표보다 짧을 때");
eqv(truncate_utf8("x", 0), "", "상한 0");
eqv(truncate_utf8("한국어", 2, "..."), "..", "말줄임표를 바꿔도 상한을 지킨다");
`)},
  ex:"🎯 PHP 의 문자열은 **바이트 배열**입니다. `strlen(\"한\")` 은 3 이고, `substr` 로 3의 배수가 아닌 위치를 자르면 **깨진 바이트**가 남아 화면에 `�` 가 뜹니다. 글자 단위 작업은 전부 `mb_*` 여야 합니다.\n⚠️ 두 번째 함정은 '**자른 뒤에 말줄임표를 붙이면 상한을 넘는다**' 는 것입니다. UI 에서 한 줄에 30자만 들어가는데 31자가 나오면 레이아웃이 깨집니다 — 그래서 `$max` 에서 말줄임표 길이를 **먼저 빼야** 합니다.\n💡 `truncate_utf8(\"abcd\", 4)` 가 `\"abc…\"` 가 아니라 `\"abcd\"` 인 것도 중요합니다. 딱 맞는 문자열에 말줄임표를 붙이면 '생략되었다' 는 거짓 정보를 주게 됩니다.\n🔧 실무에서는 여기에 한 겹 더 있습니다 — 이모지나 결합 문자(`가́`)는 여러 코드포인트가 한 글자로 보이므로, 엄밀하게는 grapheme 단위(`grapheme_strlen`, intl 확장)가 필요합니다. `mb_*` 는 그 사이의 실용적 타협점입니다." },

/* ── 5 ── */
{ lang:"php", k:"정렬과 결정적 순서", cat:"design",
  q:"할 일 목록을 정렬하는 <code>sort_tasks(array $tasks): array</code> 를 구현하세요. 각 원소는 <code>['name'=>string, 'prio'=>int, 'due'=>string]</code> 입니다. 정렬 기준은 <b>우선순위 내림차순 → 마감일 오름차순 → 이름 오름차순</b> 이며, 결과는 0부터 번호가 매겨진 리스트입니다. <b>원본 배열은 바꾸지 않습니다.</b>",
  src:`<?php
function sort_tasks(array $tasks): array {
    usort($tasks, fn(array $a, array $b): int => $b['prio'] <=> $a['prio']);
    return $tasks;   // TODO: 우선순위가 같을 때의 순서가 정해지지 않았다
}
`,
  sol:`<?php
function sort_tasks(array $tasks): array {
    usort($tasks, function (array $a, array $b): int {
        /* 배열끼리의 <=> 는 앞에서부터 원소별로 비교한다.
           내림차순 항목만 좌우를 뒤집어 넣으면 다중 키 정렬이 한 줄이 된다. */
        return [$b['prio'], $a['due'], $a['name']]
           <=> [$a['prio'], $b['due'], $b['name']];
    });
    return $tasks;   // 인자는 값으로 받았으므로 원본은 그대로다
}
`,
  test:{"test.php":T(`
$tasks = [
    ['name' => 'c', 'prio' => 1, 'due' => '2024-01-03'],
    ['name' => 'a', 'prio' => 2, 'due' => '2024-01-05'],
    ['name' => 'b', 'prio' => 2, 'due' => '2024-01-02'],
    ['name' => 'e', 'prio' => 2, 'due' => '2024-01-02'],
    ['name' => 'd', 'prio' => 1, 'due' => '2024-01-01'],
];
eqv(array_column(sort_tasks($tasks), 'name'), ['b', 'e', 'a', 'd', 'c'], "세 단계 정렬");
eqv(array_column($tasks, 'name'), ['c', 'a', 'b', 'e', 'd'], "원본은 그대로");
eqv(sort_tasks([]), [], "빈 목록");
eqv(array_keys(sort_tasks($tasks)), [0, 1, 2, 3, 4], "결과는 0부터 매겨진 리스트");

$same = [
    ['name' => 'z', 'prio' => 1, 'due' => '2024-01-01'],
    ['name' => 'y', 'prio' => 1, 'due' => '2024-01-01'],
];
eqv(array_column(sort_tasks($same), 'name'), ['y', 'z'], "모든 키가 같으면 이름이 결정한다");
`)},
  ex:"🎯 **배열끼리 `<=>` 를 쓰면 다중 키 정렬이 한 줄**이 됩니다 — 앞 원소부터 비교하고 같으면 다음으로 넘어갑니다. 내림차순으로 하고 싶은 항목만 좌우를 뒤집어 넣으면 되므로, `if` 사다리를 쓸 필요가 없습니다.\n⚠️ 더 중요한 것은 '**동점을 남기지 않는다**' 는 원칙입니다. 우선순위만으로 정렬하면 같은 우선순위의 순서가 정해지지 않고, 그러면 목록을 새로 고칠 때마다 순서가 달라 보이거나 페이지네이션에서 **같은 항목이 두 페이지에 나오고 어떤 항목은 사라집니다**.\n💡 PHP 8.0 부터 정렬이 안정 정렬이라 '입력 순서가 유지되는' 것처럼 보이지만, 그건 **입력 순서에 의존한다는 뜻**이라 DB 에서 다른 순서로 오면 결과가 바뀝니다. 그래서 이름·id 같은 **유일한 tie-break** 를 정렬 키의 마지막에 두는 것이 정답입니다.\n🔧 날짜를 `'2024-01-03'` 형식(ISO 8601)으로 두면 문자열 비교가 곧 시간 순서가 됩니다 — 이것이 이 형식을 쓰는 실질적인 이유 중 하나입니다." },

/* ── 6 ── */
{ lang:"php", k:"객체는 핸들로 넘어간다", cat:"internals",
  q:"주문 목록에 할인을 적용하는 <code>apply_discounts(array $orders, float $rate): array</code> 를 구현하세요. 각 원소는 <code>Ord</code> 객체이고 <code>$total</code>(정수, 원)을 가집니다. 할인된 금액은 <code>round()</code> 로 정수 반올림하며, <b>입력으로 받은 객체들은 절대 바꾸지 않고 새 객체를 만들어</b> 돌려줍니다.",
  src:`<?php
function apply_discounts(array $orders, float $rate): array {
    foreach ($orders as $o) {
        $o->total = (int) round($o->total * (1 - $rate));   // TODO: 원본 객체를 고치고 있다
    }
    return $orders;
}
`,
  sol:`<?php
function apply_discounts(array $orders, float $rate): array {
    $out = [];
    foreach ($orders as $o) {
        $copy = clone $o;                                    // 사본을 만들어 바꾼다
        $copy->total = (int) round($copy->total * (1 - $rate));
        $out[] = $copy;
    }
    return $out;
}
`,
  test:{"test.php":T(`
class Ord { public function __construct(public int $total) {} }

$in  = [new Ord(1000), new Ord(2555)];
$out = apply_discounts($in, 0.1);

eqv(array_map(fn(Ord $o): int => $o->total, $out), [900, 2300], "할인 적용과 반올림");
eqv(array_map(fn(Ord $o): int => $o->total, $in), [1000, 2555], "원본 객체는 그대로");
check($out[0] !== $in[0], "새 객체를 돌려주어야 한다");
eqv(apply_discounts([], 0.5), [], "빈 목록");
eqv(array_map(fn(Ord $o): int => $o->total, apply_discounts([new Ord(100)], 0.0)), [100],
    "할인율 0 이어도 사본이어야 한다");
check(apply_discounts([new Ord(100)], 0.0)[0] instanceof Ord, "타입은 유지된다");
`)},
  ex:"🎯 PHP 에서 **배열은 값, 객체는 핸들**입니다. `apply_discounts` 는 배열을 값으로 받았으니 배열에 원소를 추가·삭제해도 바깥에 영향이 없지만, **배열 안에 든 객체는 바깥과 같은 객체**라 프로퍼티를 바꾸면 그대로 보입니다.\n⚠️ 이 차이가 만드는 사고는 조용합니다 — 미리보기용으로 할인을 계산했는데 원본 주문 금액이 바뀌어, 저장 시점에 이미 할인된 값이 다시 할인됩니다.\n💡 `clone` 은 **얕은 복사**입니다. `Ord` 처럼 스칼라만 가진 객체는 이걸로 충분하지만, 안에 `DateTimeImmutable` 이 아닌 `DateTime` 이나 다른 객체가 있으면 사본과 원본이 그것을 **공유합니다** — 그때는 `__clone()` 에서 내부 객체를 다시 `clone` 해야 합니다.\n🔧 더 나은 설계는 애초에 `readonly` 프로퍼티로 **불변 객체**를 만들고, 변경을 `withTotal()` 같은 메서드가 새 객체를 돌려주는 방식으로 표현하는 것입니다 — 그러면 실수로 원본을 바꿀 방법 자체가 없어집니다." },

/* ── 7 ── */
{ lang:"php", k:"예외와 오류의 두 계층", cat:"design",
  q:"나눗셈을 안전하게 하는 <code>safe_div($a, $b)</code> 를 구현하세요. <code>$b</code> 가 0이면 <code>DivisionByZeroError</code> 가 나는데, 이를 잡아 <code>null</code> 을 돌려주세요. <b>숫자가 아닌 인자</b>는 <code>InvalidArgumentException</code> 을 던지고, 정상이면 몫을 <b>언제나 float 로</b> 돌려줍니다(<code>===</code> 로 비교됩니다).",
  src:`<?php
function safe_div($a, $b) {
    // TODO: 타입 검증 · 0 나눗셈 처리 · 반환 타입
    return $a / $b;
}
`,
  sol:`<?php
function safe_div($a, $b) {
    if (!is_int($a) && !is_float($a)) throw new InvalidArgumentException('a');
    if (!is_int($b) && !is_float($b)) throw new InvalidArgumentException('b');
    try {
        return (float) ($a / $b);   // 정수끼리 나눠떨어지면 int 가 나오므로 명시적으로 맞춘다
    } catch (DivisionByZeroError $e) {
        return null;               // 예상 가능한 실패는 값으로 돌려준다
    }
}
`,
  test:{"test.php":T(`
eqv(safe_div(10, 2), 5.0, "정상 나눗셈");
eqv(safe_div(1, 0), null, "0 으로 나누면 null");
eqv(safe_div(-9, 3), -3.0, "음수");
eqv(safe_div(1.0, 4), 0.25, "실수");
eqv(safe_div(0, 5), 0.0, "0 을 나누는 것은 정상");

$threw = false;
try { safe_div("x", 1); } catch (InvalidArgumentException $e) { $threw = true; }
eqv($threw, true, "문자열 인자는 예외");

$threw2 = false;
try { safe_div(1, null); } catch (InvalidArgumentException $e) { $threw2 = true; }
eqv($threw2, true, "null 인자도 예외");

/* Error 는 Exception 을 상속하지 않는다 — catch (Exception) 으로는 잡히지 않아야 한다 */
check(!is_subclass_of('DivisionByZeroError', 'Exception'), "DivisionByZeroError 는 Exception 계열이 아니다");
`)},
  ex:"🎯 PHP 7 부터 `1/0` 은 경고가 아니라 **`DivisionByZeroError`** 이고, `Error` 는 `Exception` 을 **상속하지 않습니다** — 둘 다 `Throwable` 을 구현할 뿐입니다. 그래서 `catch (Exception $e)` 로는 잡히지 않고, 전부 잡으려면 `catch (Throwable $e)` 여야 합니다.\n💡 이 문항의 진짜 주제는 **실패를 두 종류로 나누는 것**입니다. 0 으로 나누는 것은 입력에 따라 정상적으로 일어나는 일이라 `null` 이라는 **값**으로 돌려주고, 문자열을 넘긴 것은 호출자가 계약을 어긴 것이라 **예외**로 알립니다. 둘을 섞으면 호출자가 어느 쪽을 대비해야 할지 알 수 없습니다.\n⚠️ 반환 타입도 계약입니다 — `10 / 2` 는 float 5.0 이 아니라 **int 5** 입니다(PHP 의 `/` 는 정수끼리 딱 나눠떨어질 때만 int 를 돌려줍니다). `===` 로 비교하는 호출자를 위해 `(float)` 캐스팅이나 `: float` 반환 타입 선언으로 **명시**해야 합니다.\n🔧 PHP 8 의 타입 선언(`function safe_div(int|float $a, int|float $b): ?float`)을 쓰면 검증 코드 없이 `TypeError` 가 자동으로 납니다. 다만 `declare(strict_types=1)` 이 없으면 문자열 `'5'` 가 조용히 5 로 변환되므로, 엄격 모드를 켜는 것이 실무 기본값입니다." },

/* ── 8 ── */
{ lang:"php", k:"인터페이스와 LRU 캐시", cat:"design",
  q:"주어진 <code>Cache</code> 인터페이스를 구현하는 <code>LruCache</code> 를 완성하세요. 용량을 넘으면 <b>가장 오래 사용되지 않은</b> 항목을 버립니다. <b><code>get()</code> 도 '사용' 으로 취급</b>되어 순서를 갱신해야 하고, 같은 키를 다시 <code>set</code> 하는 것은 <b>크기를 늘리지 않습니다</b>. <code>keys()</code> 는 오래된 것부터 나열합니다.",
  src:`<?php
interface Cache {
    public function get(string $k): ?int;
    public function set(string $k, int $v): void;
    public function keys(): array;
}

final class LruCache implements Cache {
    private array $m = [];
    public function __construct(private int $cap) {}

    public function get(string $k): ?int {
        return $this->m[$k] ?? null;      // TODO: 조회도 '사용' 이다
    }
    public function set(string $k, int $v): void {
        $this->m[$k] = $v;                // TODO: 재설정과 축출 규칙이 없다
        if (count($this->m) > $this->cap) array_shift($this->m);
    }
    public function keys(): array { return array_keys($this->m); }
}
`,
  sol:`<?php
interface Cache {
    public function get(string $k): ?int;
    public function set(string $k, int $v): void;
    public function keys(): array;
}

final class LruCache implements Cache {
    /* PHP 배열은 삽입 순서를 기억하므로, 그것을 그대로 '사용 순서' 로 쓴다.
       맨 앞이 가장 오래된 것, 맨 뒤가 가장 최근 것이다. */
    private array $m = [];
    public function __construct(private int $cap) {}

    public function get(string $k): ?int {
        if (!array_key_exists($k, $this->m)) return null;
        $v = $this->m[$k];
        unset($this->m[$k]);
        $this->m[$k] = $v;          // 지우고 다시 넣어 맨 뒤로 옮긴다
        return $v;
    }
    public function set(string $k, int $v): void {
        if (array_key_exists($k, $this->m)) unset($this->m[$k]);  // 재설정은 크기를 늘리지 않는다
        $this->m[$k] = $v;
        if (count($this->m) > $this->cap) {
            array_shift($this->m);  // 가장 오래된 것을 버린다
        }
    }
    public function keys(): array { return array_keys($this->m); }
}
`,
  test:{"test.php":T(`
$c = new LruCache(2);
$c->set('a', 1);
$c->set('b', 2);
eqv($c->get('a'), 1, "조회");
$c->set('c', 3);
eqv($c->keys(), ['a', 'c'], "get 이 a 를 살렸으므로 b 가 축출된다");
eqv($c->get('b'), null, "축출된 키는 null");

$d = new LruCache(2);
$d->set('a', 1);
$d->set('a', 5);
eqv($d->keys(), ['a'], "같은 키 재설정은 크기를 늘리지 않는다");
eqv($d->get('a'), 5, "값은 갱신된다");

$e = new LruCache(2);
$e->set('a', 1);
$e->set('b', 2);
$e->set('c', 3);
eqv($e->keys(), ['b', 'c'], "조회가 없으면 가장 오래된 것이 나간다");

$f = new LruCache(1);
$f->set('a', 1);
$f->set('b', 2);
eqv($f->keys(), ['b'], "용량 1");

check((new LruCache(2)) instanceof Cache, "인터페이스를 구현해야 한다");
`)},
  ex:"🎯 LRU 의 핵심은 '**조회도 사용이다**' 입니다. `get` 이 순서를 갱신하지 않으면 그것은 LRU 가 아니라 FIFO 이고, 자주 읽히는 항목이 축출되어 캐시 적중률이 무너집니다. 테스트의 첫 시나리오가 정확히 이 차이를 가릅니다.\n💡 구현 요령은 PHP 배열이 **삽입 순서를 기억한다**는 성질을 그대로 쓰는 것입니다 — `unset` 후 재삽입하면 맨 뒤로 이동하므로, 별도의 연결 리스트가 필요 없습니다. 다른 언어에서는 해시맵 + 이중 연결 리스트를 손으로 엮어야 하는 작업입니다.\n⚠️ 두 번째 함정은 '**같은 키의 재설정**' 입니다. 검사 없이 넣으면 값은 갱신되지만 순서가 갱신되지 않고(이미 있는 키는 위치가 유지됩니다), 크기 검사에 걸리지도 않아 오래된 위치에 최신 값이 남습니다.\n🔧 인터페이스를 먼저 정의한 이유는 **교체 가능성**입니다 — 테스트에서는 이 메모리 구현을, 운영에서는 Redis 구현을 쓸 수 있고, 호출하는 코드는 `Cache` 타입만 알면 됩니다. `array_shift` 가 문자열 키에는 번호를 다시 매기지 않는다는 점도 여기서 유용하게 쓰입니다." },

/* ── 9 ── */
{ lang:"php", k:"제너레이터로 게으르게 읽기", cat:"perf",
  q:"<code>chunked(iterable $rows, int $size): \\Generator</code> 를 구현하세요. 입력을 <code>$size</code> 개씩 묶어 배열로 <code>yield</code> 하고, 마지막 자투리도 내보냅니다. <b>입력 전체를 메모리에 올리지 않고 게으르게</b> 동작해야 하며, <code>$size</code> 가 1보다 작으면 <code>InvalidArgumentException</code> 을 던집니다.",
  src:`<?php
function chunked(iterable $rows, int $size): \\Generator {
    // TODO: 입력을 전부 배열로 만들어 버리고 있다
    $all = is_array($rows) ? $rows : iterator_to_array($rows, false);
    foreach (array_chunk($all, $size) as $c) {
        yield $c;
    }
}
`,
  sol:`<?php
function chunked(iterable $rows, int $size): \\Generator {
    if ($size < 1) throw new InvalidArgumentException('size');
    $buf = [];
    foreach ($rows as $r) {
        $buf[] = $r;
        if (count($buf) === $size) {
            yield $buf;      // 한 덩어리가 차면 즉시 내보내고 버퍼를 비운다
            $buf = [];
        }
    }
    if ($buf !== []) yield $buf;   // 마지막 자투리
}
`,
  test:{"test.php":T(`
eqv(iterator_to_array(chunked([1, 2, 3, 4, 5], 2), false), [[1, 2], [3, 4], [5]], "자투리 포함");
eqv(iterator_to_array(chunked([], 3), false), [], "빈 입력");
eqv(iterator_to_array(chunked([1, 2, 3], 3), false), [[1, 2, 3]], "딱 맞는 경우");
eqv(iterator_to_array(chunked([1], 10), false), [[1]], "size 가 입력보다 큰 경우");

/* 게으름: 앞의 두 덩어리만 받고 멈췄을 때 실제로 읽은 개수를 센다 */
$consumed = 0;
$gen = (function () use (&$consumed) {
    for ($i = 1; $i <= 100000; $i++) { $consumed++; yield $i; }
})();
$chunks = [];
foreach (chunked($gen, 3) as $c) {
    $chunks[] = $c;
    if (count($chunks) === 2) break;
}
eqv($chunks, [[1, 2, 3], [4, 5, 6]], "앞의 두 덩어리");
check($consumed <= 7, "게으르게 읽어야 한다 — 실제로 읽은 개수 " . $consumed);

$threw = false;
try { iterator_to_array(chunked([1], 0), false); }
catch (InvalidArgumentException $e) { $threw = true; }
eqv($threw, true, "size 가 1 미만이면 예외");
`)},
  ex:"🎯 제너레이터의 가치는 **메모리 사용량이 입력 크기와 무관해지는 것**입니다. `iterator_to_array` 나 `file()` 로 한 번 배열을 만들면 그 순간 게으름이 사라지고, 100만 행 배치가 `memory_limit` 에 부딪힙니다 — 그래서 이 문항의 테스트는 결과값만 보지 않고 '**실제로 몇 개를 읽었는가**' 를 셉니다.\n💡 이런 테스트를 쓸 수 있다는 것 자체가 요령입니다. 성능 특성은 시간으로 재면 불안정하지만, **부수 효과의 횟수**(읽은 개수, 쿼리 수)로 재면 결정적입니다. N+1 쿼리 테스트도 같은 원리로 만듭니다.\n⚠️ `$buf !== []` 로 검사한 이유: `if ($buf)` 는 빈 배열을 거짓으로 보므로 여기서는 우연히 맞지만, `[0]` 처럼 거짓 같은 값이 하나 든 배열은 참이라 헷갈릴 여지가 없습니다. 그래도 **의도를 정확히 쓴 쪽**이 읽기 쉽습니다.\n🔧 인자 검증을 함수 맨 앞에 두었지만, **제너레이터 함수의 본문은 첫 순회 때까지 실행되지 않습니다** — 그래서 `chunked([1], 0)` 을 호출하는 시점에는 예외가 나지 않고, 순회를 시작할 때 납니다. 즉시 검증이 필요하면 일반 함수로 감싸고 안에서 제너레이터를 돌려주는 방식을 씁니다." },

/* ── 10 ── */
{ lang:"php", k:"출력 맥락에 맞는 이스케이프", cat:"security",
  q:"<code>safe_link(string $url, string $label): string</code> 을 구현하세요. <code>http</code>·<code>https</code> 스킴의 <b>유효한 URL 일 때만</b> <code>&lt;a href=\"…\"&gt;라벨&lt;/a&gt;</code> 을 만들고, 그 밖에는 <b>링크 없이 이스케이프한 라벨만</b> 돌려줍니다. URL 과 라벨 모두 HTML 이스케이프해야 합니다(<code>ENT_QUOTES</code>, UTF-8).",
  src:`<?php
function safe_link(string $url, string $label): string {
    // TODO: 스킴을 검증하지 않으면 javascript: 가 그대로 들어간다
    return '<a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">'
         . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</a>';
}
`,
  sol:`<?php
function safe_link(string $url, string $label): string {
    $e = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    $ok = filter_var($url, FILTER_VALIDATE_URL) !== false
       && in_array($scheme, ['http', 'https'], true);   // 화이트리스트

    if (!$ok) return $e($label);                        // 링크로 만들지 않는다
    return '<a href="' . $e($url) . '">' . $e($label) . '</a>';
}
`,
  test:{"test.php":T(`
eqv(safe_link("https://a.example/x?q=1&r=2", "가 & 나"),
    '<a href="https://a.example/x?q=1&amp;r=2">가 &amp; 나</a>',
    "정상 링크와 앰퍼샌드 이스케이프");

eqv(safe_link("javascript:alert(1)", "click"), "click", "javascript 스킴은 링크로 만들지 않는다");
eqv(safe_link("JavaScript:alert(1)", "click"), "click", "대소문자를 섞어도 막는다");
eqv(safe_link("data:text/html,<script>x</script>", "d"), "d", "data 스킴도 막는다");
eqv(safe_link("not a url", "라벨"), "라벨", "URL 이 아니면 라벨만");
eqv(safe_link("javascript:x", '<b>"위험"</b>'),
    "&lt;b&gt;&quot;위험&quot;&lt;/b&gt;", "라벨은 링크가 없을 때도 이스케이프한다");
eqv(safe_link("http://a.test", "ok"), '<a href="http://a.test">ok</a>', "http 도 허용");
`)},
  ex:"🎯 XSS 방어는 두 층입니다 — **이스케이프**(문자를 안전하게 바꾸기)와 **검증**(애초에 허용할지 정하기). `href` 는 이스케이프만으로 부족합니다: `javascript:alert(1)` 에는 이스케이프할 특수문자가 없어서 그대로 통과하고, 클릭하면 코드가 실행됩니다.\n⚠️ 그래서 URL 은 **스킴 화이트리스트**가 필요합니다. 블랙리스트(`javascript:` 를 지우기)는 `java\\tscript:`·`JaVaScRiPt:`·`data:` 처럼 우회가 끝없이 나옵니다 — 허용 목록을 정하는 쪽이 구조적으로 안전합니다.\n💡 링크로 만들지 않을 때도 **라벨은 이스케이프해야** 합니다. 실패 경로에서 이스케이프를 빼먹는 것이 실제로 가장 흔한 구멍입니다 — 그래서 이 문항의 테스트에 그 경우를 넣었습니다.\n🔧 그리고 맥락마다 함수가 다릅니다: HTML 본문·속성은 `htmlspecialchars`, URL 의 쿼리값은 `urlencode`, `<script>` 안의 JS 리터럴은 `json_encode($v, JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT)` 입니다. '**만능 이스케이프 함수는 없다**' 가 이 주제의 결론입니다." },

/* ── 11 ── */
{ lang:"php", k:"바인딩할 수 있는 것과 없는 것", cat:"security",
  q:"목록 조회 SQL 을 만드는 <code>build_list_query(array $req): array</code> 를 구현해 <code>[sql, params]</code> 를 돌려주세요. 기본은 <code>SELECT id, name FROM users</code> 이고 — ① <code>q</code> 가 비어 있지 않으면 <code>WHERE name LIKE ?</code> 와 <code>%q%</code> 파라미터 ② <code>sort</code> 는 <code>name</code>·<code>created_at</code> 만 허용(기본 <code>name</code>) ③ <code>dir</code> 는 <code>desc</code> 일 때만 <code>DESC</code>(기본 <code>ASC</code>) ④ 항상 <code>, id ASC</code> 로 순서를 확정 ⑤ <code>limit</code> 은 1~100(기본·범위 밖은 20), <code>page</code> 는 1 이상(기본 1)이며 <code>LIMIT ? OFFSET ?</code> 로 바인딩합니다.",
  src:`<?php
function build_list_query(array $req): array {
    $sql = 'SELECT id, name FROM users';
    $params = [];
    if (!empty($req['q'])) {
        $sql .= " WHERE name LIKE '%" . $req['q'] . "%'";   // TODO: 값을 문자열로 끼워 넣었다
    }
    $sort = $req['sort'] ?? 'name';                        // TODO: 검증이 없다
    $sql .= " ORDER BY $sort ASC, id ASC";
    $sql .= ' LIMIT ' . ($req['limit'] ?? 20) . ' OFFSET 0';
    return [$sql, $params];
}
`,
  sol:`<?php
function build_list_query(array $req): array {
    $sql = 'SELECT id, name FROM users';
    $params = [];

    /* 값은 바인딩한다 */
    $q = isset($req['q']) && is_string($req['q']) ? trim($req['q']) : '';
    if ($q !== '') {
        $sql .= ' WHERE name LIKE ?';
        $params[] = '%' . $q . '%';
    }

    /* 식별자는 바인딩할 수 없으므로 화이트리스트에서 고른다 */
    $sort = in_array($req['sort'] ?? '', ['name', 'created_at'], true) ? $req['sort'] : 'name';
    $dir  = strtolower((string) ($req['dir'] ?? '')) === 'desc' ? 'DESC' : 'ASC';
    $sql .= " ORDER BY $sort $dir, id ASC";   // 유일한 tie-break 로 순서를 확정

    $limit = filter_var($req['limit'] ?? 20, FILTER_VALIDATE_INT,
        ['options' => ['default' => 20, 'min_range' => 1, 'max_range' => 100]]);
    $page  = filter_var($req['page'] ?? 1, FILTER_VALIDATE_INT,
        ['options' => ['default' => 1, 'min_range' => 1]]);

    $sql .= ' LIMIT ? OFFSET ?';
    $params[] = $limit;
    $params[] = ($page - 1) * $limit;

    return [$sql, $params];
}
`,
  test:{"test.php":T(`
eqv(build_list_query([]),
    ['SELECT id, name FROM users ORDER BY name ASC, id ASC LIMIT ? OFFSET ?', [20, 0]],
    "기본값");

eqv(build_list_query(['q' => 'kim']),
    ['SELECT id, name FROM users WHERE name LIKE ? ORDER BY name ASC, id ASC LIMIT ? OFFSET ?',
     ['%kim%', 20, 0]],
    "검색어는 바인딩한다");

eqv(build_list_query(['sort' => 'created_at', 'dir' => 'DESC']),
    ['SELECT id, name FROM users ORDER BY created_at DESC, id ASC LIMIT ? OFFSET ?', [20, 0]],
    "허용된 정렬 컬럼과 방향");

[$sql, $p] = build_list_query(['sort' => 'name; DROP TABLE users --']);
check(!str_contains($sql, 'DROP'), "허용되지 않은 정렬 값은 SQL 에 들어가지 않아야 한다");
eqv($sql, 'SELECT id, name FROM users ORDER BY name ASC, id ASC LIMIT ? OFFSET ?', "기본값으로 떨어진다");

eqv(build_list_query(['limit' => 5, 'page' => 3])[1], [5, 10], "페이지 오프셋 계산");
eqv(build_list_query(['limit' => 1000])[1], [20, 0], "범위 밖 limit 은 기본값");
eqv(build_list_query(['limit' => 'abc'])[1], [20, 0], "숫자가 아닌 limit 도 기본값");
eqv(build_list_query(['page' => 0])[1], [20, 0], "page 0 은 1 로");
eqv(build_list_query(['q' => '   '])[1], [20, 0], "공백만인 검색어는 조건을 만들지 않는다");
`)},
  ex:"🎯 준비된 구문의 플레이스홀더는 **값 자리 전용**입니다. `ORDER BY ?` 로 바인딩하면 `ORDER BY 'name'`(문자열 상수)이 되어 정렬이 아무 효과도 내지 않고, 테이블·컬럼 이름도 마찬가지입니다. 그래서 **값은 바인딩, 식별자는 화이트리스트** 가 규칙입니다.\n⚠️ 화이트리스트는 '필터링' 이 아니라 '**미리 정한 목록에서 고르기**' 여야 합니다. 위험한 문자를 지우는 방식은 우회가 계속 나오지만, `in_array($v, ['name','created_at'], true)` 는 목록에 없으면 그냥 기본값으로 떨어지므로 우회할 표면이 없습니다.\n💡 `LIMIT` 과 `OFFSET` 은 값이므로 바인딩할 수 있고, 그 전에 **범위 검증**이 필요합니다 — `limit=1000000` 은 인젝션이 아니어도 서비스를 멈추게 합니다. `filter_var` 의 `min_range`/`max_range`/`default` 조합이 이 셋을 한 번에 처리합니다.\n🔧 `, id ASC` 를 항상 붙이는 것도 의도적입니다. 정렬 키에 동점이 있으면 페이지 사이에서 행이 중복되거나 사라지므로, **유일한 tie-break** 가 페이지네이션의 필수 조건입니다. 깊은 페이지에서는 `OFFSET` 자체가 병목이 되므로 커서(키셋) 방식으로 넘어가야 합니다." },

/* ── 12 ── */
{ lang:"php", k:"토큰 발급과 상수 시간 비교", cat:"security",
  q:"CSRF 토큰을 다루는 <code>Csrf</code> 클래스를 구현하세요. <code>Csrf::issue(array &$session): string</code> 은 <b>세션에 토큰이 없거나 형식이 맞지 않으면 새로 발급</b>하고(암호학적 난수 32바이트를 hex 로 → 64자), 이미 있으면 <b>같은 값을 돌려줍니다</b>. <code>Csrf::verify(array $session, mixed $token): bool</code> 은 <b>상수 시간 비교</b>로 확인하며, 문자열이 아닌 입력이나 토큰이 없는 세션에는 <code>false</code> 를 돌려줍니다.",
  src:`<?php
final class Csrf {
    public static function issue(array &$session): string {
        $session['csrf'] = $session['csrf'] ?? uniqid();   // TODO: 예측 가능한 값이다
        return $session['csrf'];
    }
    public static function verify(array $session, mixed $token): bool {
        return ($session['csrf'] ?? '') == $token;         // TODO: 느슨한 비교, 타이밍 노출
    }
}
`,
  sol:`<?php
final class Csrf {
    public static function issue(array &$session): string {
        $cur = $session['csrf'] ?? null;
        if (!is_string($cur) || strlen($cur) !== 64 || !ctype_xdigit($cur)) {
            $session['csrf'] = bin2hex(random_bytes(32));   // 암호학적으로 안전한 난수
        }
        return $session['csrf'];
    }
    public static function verify(array $session, mixed $token): bool {
        $cur = $session['csrf'] ?? null;
        if (!is_string($cur) || !is_string($token)) return false;
        return hash_equals($cur, $token);   // 길이·내용 비교 시간이 값에 좌우되지 않는다
    }
}
`,
  test:{"test.php":T(`
$s = [];
$t = Csrf::issue($s);
eqv(strlen($t), 64, "hex 64자");
check(ctype_xdigit($t), "16진수 문자만");
eqv($s['csrf'], $t, "세션에 저장된다");
eqv(Csrf::issue($s), $t, "이미 있으면 같은 값을 돌려준다");

$s2 = [];
Csrf::issue($s2);
check($s2['csrf'] !== $t, "세션마다 다른 토큰이어야 한다");

check(Csrf::verify($s, $t), "정상 검증");
check(!Csrf::verify($s, substr($t, 0, 63)), "앞부분만 맞아도 실패");
check(!Csrf::verify($s, $t . 'a'), "뒤에 덧붙여도 실패");
check(!Csrf::verify($s, ''), "빈 문자열은 실패");
check(!Csrf::verify($s, null), "null 은 실패");
check(!Csrf::verify($s, 0), "0 도 실패 — 느슨한 비교라면 통과해 버린다");
check(!Csrf::verify([], $t), "토큰 없는 세션은 실패");
check(!Csrf::verify(['csrf' => null], $t), "세션 값이 null 이면 실패");

/* 형식이 깨진 값은 새로 발급해야 한다 */
$s3 = ['csrf' => 'short'];
$t3 = Csrf::issue($s3);
eqv(strlen($t3), 64, "형식이 맞지 않으면 재발급");
`)},
  ex:"🎯 세 가지 실수가 각각 다른 방향으로 토큰을 무력화합니다.\n① **예측 가능한 난수** — `uniqid()` 는 마이크로초 시간 기반이라 공격자가 값을 좁힐 수 있고, `mt_rand` 는 시드를 알면 수열 전체가 복원됩니다. 보안 토큰은 `random_bytes()` 뿐입니다.\n② **느슨한 비교** — `('abc' == 0)` 이 PHP 7 에서 참이었던 것처럼, `==` 는 타입 변환을 거칩니다. 테스트가 `verify($s, 0)` 을 넣은 이유이고, PHP 7 시절에는 `0` 하나로 검증을 통과할 수 있었습니다.\n③ **타이밍 노출** — `===` 조차 첫 다른 바이트에서 멈추므로, 응답 시간 차이로 토큰을 앞에서부터 한 글자씩 알아낼 수 있습니다. `hash_equals` 는 길이를 먼저 확인한 뒤 항상 끝까지 비교합니다.\n💡 `issue` 가 형식까지 검사하는 것도 의도적입니다 — 세션에 남은 옛 형식 토큰이나 조작된 값을 그대로 쓰면, 세션 저장소를 건드릴 수 있는 공격자가 토큰을 **자기가 아는 값으로 고정**할 수 있습니다.\n⚠️ 그리고 이 클래스만으로는 부족합니다. 실무에서는 **로그인 직후 `session_regenerate_id(true)`** 로 세션 고정을 막고, 쿠키에 `HttpOnly`·`Secure`·`SameSite` 를 걸고, 토큰은 **상태를 바꾸는 요청**에만 요구합니다 — GET 조회에 걸면 링크 공유가 깨집니다." },

];
