/* PHP 1차 — 실습이 하나도 없던 12개 유닛.

   test.php 는 sol.php 를 require 하고, 실패하면 종료 코드 1 로 끝낸다.
   PHPUnit 없이도 실제 php 로 채점되는 규약이다(C 의 test.c 와 같은 방식). */

/* 모든 테스트가 쓰는 도우미. 문자열로 여러 번 쓰느니 한 곳에 둔다. */
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
/* ── PHP 첫걸음 ──────────────────────────────────────────── */
{
  unit: "PHP 첫걸음 — 무엇이고, 어디서 도는가",
  lesson: "직접 짜 보기 — 요청 하나가 처리되는 동안",
  th: {
    sum: "PHP 는 **요청 하나마다 처음부터 시작해서, 끝나면 전부 버리는** 언어다.",
    body: [
      { h: "요청마다 깨끗한 상태", t: "자바나 노드는 서버가 계속 떠 있으면서 메모리를 이어 쓴다. PHP 는 요청이 오면 스크립트를 처음부터 실행하고, 응답을 보내면 변수도 객체도 전부 사라진다 — 메모리 누수가 잘 안 생기는 대신, 요청 사이에 무언가를 기억하려면 파일·DB·캐시가 필요하다." },
      { h: "그래서 배우기 쉬웠다", t: "'이 파일이 이 주소' 라는 단순한 규칙 덕분에 웹의 초창기를 지배했다. 지금은 프레임워크가 라우팅을 맡지만, 밑바닥의 이 모델은 그대로다." },
      { h: "타입 선언은 선택이 아니라 습관", t: "옛 PHP 는 타입을 안 적어도 됐지만, 7 이후로는 매개변수와 반환에 타입을 적을 수 있다. 적어 두면 잘못된 값이 함수 안까지 들어오지 못한다." },
      { h: "strict_types 로 더 조인다", t: "파일 맨 위에 `declare(strict_types=1);` 을 두면 '문자열 \"5\" 를 int 자리에 넣기' 같은 자동 변환이 막힌다. 조용한 버그가 요란한 오류로 바뀌는데, 그게 훨씬 낫다." },
    ],
    code: { c: "<?php\ndeclare(strict_types=1);\n\nfunction add(int $a, int $b): int {\n    return $a + $b;\n}\n\n// 요청이 끝나면 전부 사라진다", cap: "요청마다 새로 시작한다" },
    key: ["요청마다 상태가 초기화된다", "타입을 적으면 미리 막힌다", "`strict_types` 로 자동 변환을 끈다"],
  },
  q: [
    {
      k: "greet · 타입을 적어 두기",
      qq: "이름을 받아 <code>\"안녕, {이름}!\"</code> 을 돌려주는 <code>greet(string $name): string</code> 를 만드세요. 이름이 <b>빈 문자열이거나 공백뿐</b>이면 <code>\"안녕, 손님!\"</code> 입니다.",
      src: "<?php\nfunction greet($name) {\n    return \"안녕, \" . $name . \"!\";\n}\n",
      sol: "<?php\nfunction greet(string $name): string {\n    $n = trim($name);\n    if ($n === \"\") { $n = \"손님\"; }\n    return \"안녕, \" . $n . \"!\";\n}\n",
      test: test('eqv(greet("루이"), "안녕, 루이!", "보통 이름");\neqv(greet(""), "안녕, 손님!", "빈 문자열");\neqv(greet("   "), "안녕, 손님!", "공백뿐");\neqv(greet("  루이  "), "안녕, 루이!", "앞뒤 공백은 다듬는다");\n'),
      ex: "빈 이름이 그대로 들어오면 \"안녕, !\" 라는 이상한 문장이 나옵니다. 사용자 입력은 거의 언제나 앞뒤 공백이 붙어 오니, 다듬고 나서 비었는지 봐야 해요.",
    },
    {
      k: "counter · 요청 사이에는 기억이 없다",
      qq: "<code>counter(array &$store, string $key): int</code> 를 만드세요. 넘겨받은 저장소에 <b>키별 횟수</b>를 올리고 <b>올린 뒤의 값</b>을 돌려줍니다.",
      src: "<?php\nfunction counter(array &$store, string $key): int {\n    $n = 0;\n    $n++;\n    return $n;\n}\n",
      sol: "<?php\nfunction counter(array &$store, string $key): int {\n    if (!isset($store[$key])) { $store[$key] = 0; }\n    $store[$key]++;\n    return $store[$key];\n}\n",
      test: test('$s = [];\neqv(counter($s, "a"), 1, "처음은 1");\neqv(counter($s, "a"), 2, "두 번째는 2");\neqv(counter($s, "b"), 1, "키가 다르면 따로 센다");\neqv(counter($s, "a"), 3, "다시 a");\neqv($s["a"], 3, "저장소에 남아 있어야 한다");\n'),
      ex: "함수 안의 지역 변수는 함수가 끝나면 사라집니다 — PHP 에서는 요청이 끝나면 그것마저 다 사라져요. 무언가를 이어서 세려면 밖에서 넘겨준 저장소에 써야 하고, 그래서 `&` 로 참조를 받습니다.",
    },
    {
      k: "sum_ints · 자동 변환을 믿지 않기",
      qq: "<code>sum_ints(array $xs): int</code> 를 만드세요. <b>진짜 정수</b>(<code>is_int</code>)만 더하고 나머지는 <b>건너뜁니다</b>.",
      src: "<?php\nfunction sum_ints(array $xs): int {\n    $s = 0;\n    foreach ($xs as $x) { $s += (int) $x; }\n    return $s;\n}\n",
      sol: "<?php\nfunction sum_ints(array $xs): int {\n    $s = 0;\n    foreach ($xs as $x) {\n        if (is_int($x)) { $s += $x; }\n    }\n    return $s;\n}\n",
      test: test('eqv(sum_ints([1, 2, 3]), 6, "정수만");\neqv(sum_ints([1, "2", 3]), 4, "문자열은 건너뛴다");\neqv(sum_ints(["a", null, true]), 0, "정수가 없다");\neqv(sum_ints([]), 0, "빈 배열");\neqv(sum_ints([1, 1.5, 2]), 3, "실수도 건너뛴다");\n'),
      ex: "`(int)` 는 무엇이든 숫자로 만들어 버립니다 — \"abc\" 도 0 이 되고 true 도 1 이 돼요. 오류 없이 그럴듯한 합계가 나오니 아무도 의심하지 않습니다. 더하기 전에 '정말 정수인가' 를 묻는 편이 안전합니다.",
    },
  ],
},
/* ── 타입과 비교 ─────────────────────────────────────────── */
{
  unit: "타입과 비교 — PHP 를 가장 많이 오해하는 지점",
  lesson: "직접 짜 보기 — == 와 === 의 거리",
  th: {
    sum: "PHP 에서 `==` 는 **타입을 맞춰 본 뒤** 비교한다. 그 맞추는 규칙이 사고의 근원이다.",
    body: [
      { h: "== 는 변환하고 === 는 안 한다", t: "`0 == \"a\"` 는 PHP 8부터 false 지만, `\"1\" == \"01\"` 은 여전히 true 다(둘 다 숫자로 읽혀서). 의도한 게 아니라면 항상 `===` 를 쓴다 — 타입까지 같아야 참이다." },
      { h: "빈 값의 종류가 많다", t: "`\"\"`, `0`, `\"0\"`, `[]`, `null`, `false` 가 전부 `empty()` 에서 참이다. '값이 0인 것' 과 '값이 없는 것' 을 구별해야 하는 자리에서 `empty` 를 쓰면 조용히 틀린다." },
      { h: "isset 과 array_key_exists 는 다르다", t: "값이 `null` 이면 `isset` 은 false 지만 키는 존재한다. '키가 있는가' 를 묻고 싶으면 `array_key_exists` 다." },
      { h: "숫자 문자열은 특별 취급을 받는다", t: "`\"10\" > \"9\"` 는 숫자로 읽혀 true 다. 문자열로 견주고 싶으면 `strcmp` 를 쓴다 — 버전 문자열 정렬에서 이걸로 자주 데인다." },
    ],
    code: { c: "0 == \"a\"     // false (PHP 8)\n\"1\" == \"01\"  // true  ← 둘 다 숫자로 읽힘\n\"1\" === \"01\" // false\n\nisset($a[\"k\"])              // null 이면 false\narray_key_exists(\"k\", $a)   // null 이어도 true", cap: "타입까지 봐야 안전하다" },
    key: ["기본은 `===`", "`empty` 는 0도 빈 값으로 본다", "`isset` 은 null 을 없는 것으로 본다"],
  },
  q: [
    {
      k: "find_index · 값도 타입도 같아야",
      qq: "<code>find_index(array $xs, $needle): int</code> 를 만드세요. <b>타입까지 같은</b> 첫 자리를 돌려주고, 없으면 <code>-1</code> 입니다.",
      src: "<?php\nfunction find_index(array $xs, $needle): int {\n    foreach ($xs as $i => $x) {\n        if ($x == $needle) { return $i; }\n    }\n    return -1;\n}\n",
      sol: "<?php\nfunction find_index(array $xs, $needle): int {\n    foreach ($xs as $i => $x) {\n        if ($x === $needle) { return $i; }\n    }\n    return -1;\n}\n",
      test: test('eqv(find_index([1, 2, 3], 2), 1, "정수 찾기");\neqv(find_index(["01", "1"], "1"), 1, "\\"01\\" 은 \\"1\\" 이 아니다");\neqv(find_index([0, "0"], "0"), 1, "0 과 \\"0\\" 은 다르다");\neqv(find_index([], 1), -1, "빈 배열");\neqv(find_index([true, 1], 1), 1, "true 는 1 이 아니다");\n'),
      ex: "`==` 는 \"01\" 과 \"1\" 을 둘 다 숫자 1로 읽어 같다고 합니다. 주문번호나 우편번호처럼 앞자리 0이 뜻을 갖는 값에서 엉뚱한 항목을 집게 돼요 — 기본은 `===` 입니다.",
    },
    {
      k: "has_key · 값이 null 이어도 키는 있다",
      qq: "<code>has_key(array $a, string $k): bool</code> 를 만드세요. <b>키가 존재하면</b> true 입니다 — 값이 <code>null</code> 이어도요.",
      src: "<?php\nfunction has_key(array $a, string $k): bool {\n    return isset($a[$k]);\n}\n",
      sol: "<?php\nfunction has_key(array $a, string $k): bool {\n    return array_key_exists($k, $a);\n}\n",
      test: test('eqv(has_key(["a" => 1], "a"), true, "보통 값");\neqv(has_key(["a" => null], "a"), true, "null 이어도 키는 있다");\neqv(has_key([], "a"), false, "없는 키");\neqv(has_key(["a" => 0], "a"), true, "0 도 값이다");\neqv(has_key(["a" => ""], "a"), true, "빈 문자열도 값이다");\n'),
      ex: "DB 에서 읽은 행에는 null 이 흔합니다. `isset` 으로 물으면 '그 컬럼이 아예 없다' 와 '값이 null 이다' 를 구별하지 못해요 — 기본값을 채워 넣어야 할지 판단이 어긋납니다.",
    },
    {
      k: "is_blank · 0 은 빈 값이 아니다",
      qq: "<code>is_blank($v): bool</code> 를 만드세요. <code>null</code> 이거나 <b>공백뿐인 문자열</b>일 때만 true 이고, <code>0</code> 이나 <code>\"0\"</code> 은 false 입니다.",
      src: "<?php\nfunction is_blank($v): bool {\n    return empty($v);\n}\n",
      sol: "<?php\nfunction is_blank($v): bool {\n    if ($v === null) { return true; }\n    if (is_string($v)) { return trim($v) === \"\"; }\n    return false;\n}\n",
      test: test('eqv(is_blank(null), true, "null");\neqv(is_blank("  "), true, "공백뿐");\neqv(is_blank(0), false, "0 은 값이다");\neqv(is_blank("0"), false, "\\"0\\" 도 값이다");\neqv(is_blank(false), false, "false 도 값이다");\neqv(is_blank("가"), false, "보통 문자열");\n'),
      ex: "`empty(0)` 은 참입니다. 수량 입력란에 0을 넣은 사용자가 '값을 입력하세요' 를 보게 되는 거예요 — 재고 0, 할인 0%, 좌석 0번은 전부 정당한 값입니다. '없음' 과 '0' 은 다른 뜻입니다.",
    },
  ],
},
/* ── 문자열과 배열 ───────────────────────────────────────── */
{
  unit: "문자열과 배열 — 매일 쓰는 두 가지",
  lesson: "직접 짜 보기 — 자르고, 걸러 내고, 다시 번호 매기기",
  th: {
    sum: "PHP 배열은 **순서 있는 사전**이다. 그래서 걸러 내면 번호가 듬성해진다.",
    body: [
      { h: "배열은 리스트이자 맵", t: "`[10, 20]` 도 사실은 `[0 => 10, 1 => 20]` 이다. `array_filter` 로 걸러 내면 남은 것들이 원래 키를 그대로 갖고 있어서, `[0 => 10, 2 => 30]` 같은 구멍 난 배열이 된다 — JSON 으로 내보내면 리스트가 아니라 객체가 되어 프런트가 깨진다." },
      { h: "그래서 array_values 로 다시 번호를 매긴다", t: "걸러 낸 뒤 리스트로 돌려줄 거면 거의 항상 `array_values` 가 따라붙는다. 이걸 빠뜨린 버그가 PHP API 에서 대단히 흔하다." },
      { h: "문자열 함수는 바이트 단위다", t: "`strlen(\"한\")` 은 3이다 — UTF-8 에서 한글 한 글자가 3바이트라서다. 글자 수를 세려면 `mb_strlen`, 자르려면 `mb_substr` 을 쓴다." },
      { h: "explode 는 빈 조각을 남긴다", t: "`explode(\",\", \"a,,b\")` 는 `[\"a\", \"\", \"b\"]` 다. 사용자 입력을 쉼표로 나눌 때 빈 조각을 걸러 내는 처리가 거의 항상 필요하다." },
    ],
    code: { c: "$r = array_filter([1,2,3], fn($v) => $v > 1);\n// [1 => 2, 2 => 3]  ← 키가 남는다\narray_values($r);   // [2, 3]\n\nstrlen(\"한\")      // 3 (바이트)\nmb_strlen(\"한\")   // 1 (글자)", cap: "걸러 내면 번호가 듬성해진다" },
    key: ["걸러 낸 뒤 `array_values`", "글자 수는 `mb_strlen`", "`explode` 는 빈 조각을 남긴다"],
  },
  q: [
    {
      k: "positives · 걸러 낸 뒤 번호 다시 매기기",
      qq: "<code>positives(array $xs): array</code> 를 만드세요. <b>0보다 큰 값</b>만 남기고, 결과는 <b>0부터 번호가 매겨진 리스트</b>여야 합니다.",
      src: "<?php\nfunction positives(array $xs): array {\n    return array_filter($xs, fn($v) => $v > 0);\n}\n",
      sol: "<?php\nfunction positives(array $xs): array {\n    return array_values(array_filter($xs, fn($v) => $v > 0));\n}\n",
      test: test('eqv(positives([-1, 2, -3, 4]), [2, 4], "구멍 없이 다시 번호");\neqv(positives([1, 2]), [1, 2], "다 남는 경우");\neqv(positives([-1, -2]), [], "다 걸러지는 경우");\neqv(positives([]), [], "빈 배열");\neqv(array_keys(positives([-1, 5])), [0], "키가 0부터여야 한다");\n'),
      ex: "`array_filter` 는 살아남은 값의 **원래 키**를 그대로 둡니다. `[1 => 2, 3 => 4]` 를 `json_encode` 하면 배열이 아니라 `{\"1\":2,\"3\":4}` 객체가 나와요 — 프런트에서 `.map` 이 터집니다. 리스트로 줄 거면 `array_values` 를 붙이세요.",
    },
    {
      k: "cut · 글자 단위로 자르기",
      qq: "<code>cut(string $s, int $n): string</code> 를 만드세요. <b>앞에서 n글자</b>만 남깁니다 — 바이트가 아니라 <b>글자</b>입니다.",
      src: "<?php\nfunction cut(string $s, int $n): string {\n    return substr($s, 0, $n);\n}\n",
      sol: "<?php\nfunction cut(string $s, int $n): string {\n    return mb_substr($s, 0, $n);\n}\n",
      test: test('eqv(cut("abcdef", 3), "abc", "영문");\neqv(cut("한국어입니다", 3), "한국어", "한글 3글자");\neqv(cut("한글", 5), "한글", "n 이 길이보다 크면 전부");\neqv(cut("", 3), "", "빈 문자열");\neqv(mb_strlen(cut("가나다라", 2)), 2, "글자 수로 세어야 한다");\n'),
      ex: "`substr` 은 바이트로 자릅니다. 한글은 한 글자가 3바이트라 3으로 자르면 한 글자만 나오고, 4로 자르면 글자가 중간에 잘려 깨진 문자가 됩니다 — 제목 미리보기에서 자주 보는 그 깨짐이에요.",
    },
    {
      k: "split_clean · 빈 조각 걸러 내기",
      qq: "<code>split_clean(string $s): array</code> 를 만드세요. 쉼표로 나눈 뒤 <b>앞뒤 공백을 다듬고</b>, <b>빈 조각은 버리고</b>, 0부터 번호를 매깁니다.",
      src: "<?php\nfunction split_clean(string $s): array {\n    return explode(\",\", $s);\n}\n",
      sol: "<?php\nfunction split_clean(string $s): array {\n    $parts = array_map(\"trim\", explode(\",\", $s));\n    return array_values(array_filter($parts, fn($v) => $v !== \"\"));\n}\n",
      test: test('eqv(split_clean("a,b,c"), ["a", "b", "c"], "보통");\neqv(split_clean("a, ,b"), ["a", "b"], "공백뿐인 조각은 버린다");\neqv(split_clean("a,,b"), ["a", "b"], "빈 조각도 버린다");\neqv(split_clean(""), [], "빈 문자열");\neqv(split_clean(" a , b "), ["a", "b"], "앞뒤 공백을 다듬는다");\n'),
      ex: "사용자가 태그를 \"php, , laravel\" 처럼 입력하는 일은 흔합니다. 그대로 저장하면 빈 태그가 생기고, 목록에 빈칸이 하나 떠요 — 나누는 자리에서 다듬는 게 가장 쌉니다.",
    },
  ],
},
/* ── 함수와 스코프 ───────────────────────────────────────── */
{
  unit: "함수와 스코프",
  lesson: "직접 짜 보기 — 값으로 넘길까 참조로 넘길까",
  th: {
    sum: "PHP 함수는 기본이 **값 전달**이다. 배열도 복사되고, 객체만 손잡이가 복사된다.",
    body: [
      { h: "배열은 복사된다", t: "함수에 배열을 넘겨 안에서 고쳐도 바깥은 그대로다. 다른 언어에서 오면 놀라는 지점인데, 덕분에 뜻밖의 변경이 잘 안 생긴다. 실제로 복사하는 것은 고칠 때뿐이라 성능도 괜찮다." },
      { h: "객체는 손잡이가 복사된다", t: "`$b = $a` 로 객체를 넘기면 같은 객체를 가리키는 이름이 하나 더 생긴다. 안에서 속성을 바꾸면 바깥에도 보인다 — 배열과 정반대라 헷갈린다." },
      { h: "&로 참조를 받을 수 있다", t: "`function f(array &$a)` 처럼 적으면 배열도 원본이 바뀐다. 편하지만 부르는 쪽에서 안 보이는 변경이라, 정말 필요할 때만 쓴다." },
      { h: "클로저는 use 로 값을 데려간다", t: "`function() use ($x)` 는 그 시점의 `$x` 값을 복사해 간다. 바깥이 나중에 바뀌어도 클로저 안은 그대로다 — 나중 값을 원하면 `use (&$x)` 다." },
    ],
    code: { c: "function f(array $a) { $a[] = 1; }   // 바깥 그대로\nfunction g(array &$a) { $a[] = 1; }  // 바깥도 바뀜\n\n$x = 1;\n$f = function() use ($x) { return $x; };\n$x = 2;\n$f();   // 1  ← 데려간 시점의 값", cap: "배열은 복사, 객체는 손잡이" },
    key: ["배열은 값 전달", "객체는 손잡이 전달", "`use` 는 그 시점의 값"],
  },
  q: [
    {
      k: "append_copy · 원본은 건드리지 않기",
      qq: "<code>append_copy(array $a, $v): array</code> 를 만드세요. 값을 <b>덧붙인 새 배열</b>을 돌려주고, <b>넘겨받은 배열은 그대로</b>여야 합니다.",
      src: "<?php\nfunction append_copy(array &$a, $v): array {\n    $a[] = $v;\n    return $a;\n}\n",
      sol: "<?php\nfunction append_copy(array $a, $v): array {\n    $a[] = $v;\n    return $a;\n}\n",
      test: test('$orig = [1, 2];\neqv(append_copy($orig, 3), [1, 2, 3], "덧붙인 결과");\neqv($orig, [1, 2], "원본은 그대로여야 한다");\neqv(append_copy([], 1), [1], "빈 배열에 덧붙이기");\n$o2 = ["a"];\nappend_copy($o2, "b");\neqv($o2, ["a"], "두 번째 확인");\n'),
      ex: "`&` 를 붙이면 부르는 쪽 배열이 조용히 바뀝니다. 반환값만 보면 둘 다 맞아 보여서 테스트를 통과하기 쉬워요 — 그래서 원본까지 함께 확인합니다. 고칠 뜻이 없으면 `&` 를 쓰지 않습니다.",
    },
    {
      k: "make_adders · 반복문 안에서 값을 데려가기",
      qq: "<code>make_adders(array $ns): array</code> 를 만드세요. 각 <code>$n</code> 마다 <b>그 값을 더하는 함수</b>를 만들어 목록으로 돌려줍니다.",
      src: "<?php\nfunction make_adders(array $ns): array {\n    $out = [];\n    foreach ($ns as $n) {\n        $out[] = function (int $x) use (&$n) { return $x + $n; };\n    }\n    return $out;\n}\n",
      sol: "<?php\nfunction make_adders(array $ns): array {\n    $out = [];\n    foreach ($ns as $n) {\n        $out[] = function (int $x) use ($n) { return $x + $n; };\n    }\n    return $out;\n}\n",
      test: test('$fns = make_adders([1, 2, 3]);\neqv($fns[0](0), 1, "첫 번째는 1 을 더해야 한다");\neqv($fns[1](0), 2, "두 번째는 2");\neqv($fns[2](0), 3, "세 번째는 3");\neqv(count(make_adders([])), 0, "빈 목록");\neqv(make_adders([5])[0](10), 15, "하나만");\n'),
      ex: "`use (&$n)` 은 값이 아니라 변수 자체를 데려갑니다. 반복문이 끝나면 `$n` 은 마지막 값이니, 만들어 둔 함수가 **전부** 마지막 값을 더하게 돼요 — 여러 언어에서 똑같이 반복되는 고전적인 함정입니다. 값을 데려가려면 `&` 를 뺍니다.",
    },
    {
      k: "sum_all · 개수가 정해지지 않은 인자",
      qq: "<code>sum_all(int ...$xs): int</code> 를 만드세요. 넘어온 <b>모든 인자</b>를 더하고, 없으면 0 입니다.",
      src: "<?php\nfunction sum_all(int $a = 0, int $b = 0): int {\n    return $a + $b;\n}\n",
      sol: "<?php\nfunction sum_all(int ...$xs): int {\n    return array_sum($xs);\n}\n",
      test: test('eqv(sum_all(1, 2), 3, "두 개");\neqv(sum_all(1, 2, 3, 4), 10, "네 개");\neqv(sum_all(), 0, "없으면 0");\neqv(sum_all(5), 5, "하나");\neqv(sum_all(...[1, 2, 3]), 6, "배열 펼치기도 된다");\n'),
      ex: "매개변수를 두 개만 적어 두면 세 번째부터는 조용히 무시됩니다 — 오류도 안 나요. `...` 로 받으면 몇 개가 오든 배열로 모이고, 부르는 쪽에서 배열을 `...` 로 펼쳐 넣는 것도 그대로 됩니다.",
    },
  ],
},
/* ── 객체지향 ────────────────────────────────────────────── */
{
  unit: "객체지향 — 구조를 만드는 도구",
  lesson: "직접 짜 보기 — 감추고, 약속하고, 갈아 끼우기",
  th: {
    sum: "객체지향의 핵심은 상속이 아니라 **밖에 무엇을 보일지 정하는 것**이다.",
    body: [
      { h: "private 은 나중을 위한 여지", t: "속성을 밖에 열어 두면 누가 어떻게 쓰는지 알 수 없어 영영 못 바꾼다. 감춰 두면 안쪽 구현을 마음대로 바꿔도 밖이 안 깨진다." },
      { h: "생성자에서 불변식을 지킨다", t: "'수량은 음수가 될 수 없다' 같은 규칙은 만들 때 한 번 검사하면, 그 뒤로는 어디서든 믿을 수 있다. 쓸 때마다 검사하는 코드가 사라진다." },
      { h: "인터페이스는 갈아 끼울 자리", t: "'이런 메서드가 있다' 만 약속해 두면, 구현을 통째로 바꿔도 쓰는 쪽은 그대로다. 테스트에서 가짜 구현을 넣을 수 있는 것도 이 덕분이다." },
      { h: "생성자 프로퍼티 승격", t: "PHP 8 부터 `public function __construct(private int $n) {}` 로 선언과 대입을 한 번에 한다. 같은 이름을 세 번 적던 군더더기가 사라진다." },
    ],
    code: { c: "final class Qty {\n    public function __construct(private int $n) {\n        if ($n < 0) throw new InvalidArgumentException(\"음수\");\n    }\n    public function value(): int { return $this->n; }\n}", cap: "감추고, 만들 때 검사한다" },
    key: ["기본은 `private`", "불변식은 생성자에서", "인터페이스는 갈아 끼울 자리"],
  },
  q: [
    {
      k: "Money · 만들 때 검사하기",
      qq: "<code>Money</code> 클래스를 만드세요. 생성자는 <code>int $cents</code> 를 받고 <b>음수면 <code>InvalidArgumentException</code></b> 을 던집니다. <code>cents(): int</code> 와 <code>plus(Money $o): Money</code> 를 제공하세요.",
      src: "<?php\nclass Money {\n    public int $cents;\n    public function __construct(int $cents) {\n        $this->cents = $cents;\n    }\n    public function cents(): int { return $this->cents; }\n    public function plus(Money $o): Money { return new Money($this->cents + $o->cents()); }\n}\n",
      sol: "<?php\nfinal class Money {\n    public function __construct(private int $cents) {\n        if ($cents < 0) {\n            throw new InvalidArgumentException(\"금액은 음수가 될 수 없습니다\");\n        }\n    }\n    public function cents(): int { return $this->cents; }\n    public function plus(Money $o): Money { return new Money($this->cents + $o->cents()); }\n}\n",
      test: test('$m = new Money(100);\neqv($m->cents(), 100, "값 읽기");\neqv($m->plus(new Money(50))->cents(), 150, "더하기");\neqv((new Money(0))->cents(), 0, "0 은 된다");\n$threw = false;\ntry { new Money(-1); } catch (InvalidArgumentException $e) { $threw = true; }\neqv($threw, true, "음수는 막아야 한다");\n$hidden = !property_exists("Money", "cents") || !(new ReflectionProperty("Money", "cents"))->isPublic();\neqv($hidden, true, "속성은 밖에 보이면 안 된다");\n'),
      ex: "속성을 public 으로 두면 `$m->cents = -999;` 한 줄로 규칙이 무너집니다. 만들 때만 검사해 봐야 소용이 없어요 — 감춰야 검사가 뜻을 갖습니다.",
    },
    {
      k: "total · 인터페이스로 갈아 끼우기",
      qq: "<code>Priced</code> 인터페이스(<code>price(): int</code>)와, 그 목록의 합을 구하는 <code>total(array $items): int</code> 를 만드세요.",
      src: "<?php\ninterface Priced { public function price(): int; }\n\nfunction total(array $items): int {\n    $s = 0;\n    foreach ($items as $it) { $s += $it->amount; }\n    return $s;\n}\n",
      sol: "<?php\ninterface Priced { public function price(): int; }\n\nfunction total(array $items): int {\n    $s = 0;\n    foreach ($items as $it) { $s += $it->price(); }\n    return $s;\n}\n",
      test: test('final class Book implements Priced {\n    public function __construct(private int $p) {}\n    public function price(): int { return $this->p; }\n}\nfinal class Coupon implements Priced {\n    public function price(): int { return -100; }\n}\neqv(total([new Book(500), new Book(300)]), 800, "책 두 권");\neqv(total([new Book(500), new Coupon()]), 400, "쿠폰은 음수");\neqv(total([]), 0, "빈 목록");\neqv(total([new Coupon()]), -100, "쿠폰만");\n'),
      ex: "속성 이름에 기대면 그 이름을 가진 클래스만 넣을 수 있습니다 — 인터페이스를 선언한 의미가 사라져요. 메서드로 물으면 값을 어떻게 만들든(저장된 값이든, 계산이든) 상관없이 다 받아 줍니다.",
    },
    {
      k: "Stack · 감춘 채로 다루기",
      qq: "<code>Stack</code> 클래스를 만드세요. <code>push($v): void</code>, <code>pop()</code>(비었으면 <code>null</code>), <code>size(): int</code> 를 제공하고 <b>안쪽 배열은 밖에서 못 건드려야</b> 합니다.",
      src: "<?php\nclass Stack {\n    public array $items = [];\n    public function push($v): void { $this->items[] = $v; }\n    public function pop() { return array_pop($this->items); }\n    public function size(): int { return count($this->items); }\n}\n",
      sol: "<?php\nfinal class Stack {\n    private array $items = [];\n    public function push($v): void { $this->items[] = $v; }\n    public function pop() { return array_pop($this->items); }\n    public function size(): int { return count($this->items); }\n}\n",
      test: test('$s = new Stack();\neqv($s->size(), 0, "처음엔 비었다");\n$s->push(1); $s->push(2);\neqv($s->size(), 2, "두 개");\neqv($s->pop(), 2, "마지막이 먼저");\neqv($s->pop(), 1, "그다음");\neqv($s->pop(), null, "비면 null");\n$hidden = !property_exists("Stack", "items") || !(new ReflectionProperty("Stack", "items"))->isPublic();\neqv($hidden, true, "안쪽 배열은 감춰야 한다");\n'),
      ex: "배열이 열려 있으면 누군가 `$s->items = [];` 로 통째로 갈아 끼우거나 중간을 삭제합니다. 그러면 스택이 스택이 아니게 돼요 — 감춰야 push·pop 이라는 약속이 지켜집니다.",
    },
  ],
},
/* ── 오류와 예외 ─────────────────────────────────────────── */
{
  unit: "오류와 예외 — 실패를 다루는 법",
  lesson: "직접 짜 보기 — 삼키지 말고 알려 주기",
  th: {
    sum: "예외는 **호출한 쪽이 결정하게 넘기는 방법**이다. 삼켜 버리면 그 기회가 사라진다.",
    body: [
      { h: "@ 로 숨기지 않는다", t: "`@` 는 오류를 안 보이게만 할 뿐 고치지 않는다. 나중에 왜 값이 비었는지 아무도 못 찾는다 — 원인이 지워졌기 때문이다." },
      { h: "빈 catch 는 최악", t: "`catch (Exception $e) {}` 는 문제가 있었다는 사실 자체를 지운다. 최소한 로그를 남기거나, 다시 던지거나, 뜻이 통하는 기본값을 주고 그 사실을 알린다." },
      { h: "Throwable 이 꼭대기", t: "PHP 7 부터 `Error`(타입 오류 등)와 `Exception` 이 갈라졌고 둘 다 `Throwable` 이다. 전부 잡으려면 `Throwable` 을 잡는다 — `Exception` 만 잡으면 타입 오류는 안 잡힌다." },
      { h: "finally 는 정리하는 자리", t: "성공하든 실패하든 파일을 닫고 잠금을 푼다. `return` 이 있어도 `finally` 는 실행된다." },
    ],
    code: { c: "try {\n    위험한일();\n} catch (Throwable $e) {\n    로그($e->getMessage());   // 삼키지 않는다\n    throw $e;                  // 또는 다시 던진다\n} finally {\n    정리();\n}", cap: "삼키면 원인이 사라진다" },
    key: ["`@` 로 숨기지 않는다", "빈 catch 는 금물", "전부 잡으려면 `Throwable`"],
  },
  q: [
    {
      k: "divide · 나눌 수 없으면 알려 주기",
      qq: "<code>divide(int $a, int $b): float</code> 를 만드세요. <code>$b</code> 가 0이면 <b><code>InvalidArgumentException</code></b> 을 던집니다.",
      src: "<?php\nfunction divide(int $a, int $b): float {\n    try {\n        return $a / $b;\n    } catch (Throwable $e) {\n        return 0.0;\n    }\n}\n",
      sol: "<?php\nfunction divide(int $a, int $b): float {\n    if ($b === 0) {\n        throw new InvalidArgumentException(\"0 으로 나눌 수 없습니다\");\n    }\n    return $a / $b;\n}\n",
      test: test('eqv(divide(6, 2), 3.0, "보통 나눗셈");\neqv(divide(1, 4), 0.25, "소수");\n$threw = false;\ntry { divide(1, 0); } catch (InvalidArgumentException $e) { $threw = true; }\neqv($threw, true, "0 으로 나누면 던져야 한다");\neqv(divide(0, 5), 0.0, "0 을 나누는 건 된다");\n'),
      ex: "0.0 을 돌려주면 '1÷0 은 0' 이라고 말하는 셈입니다. 부르는 쪽은 그게 진짜 계산 결과인지 실패인지 구별할 수 없어요 — 평균이나 비율 계산에 섞이면 조용히 틀린 보고서가 나갑니다.",
    },
    {
      k: "safe_json · 실패를 값으로 돌려주기",
      qq: "<code>safe_json(string $s)</code> 를 만드세요. 올바른 JSON 이면 <b>배열</b>을, 아니면 <code>null</code> 을 돌려줍니다 — <b>예외로 죽지 않게</b>요.",
      src: "<?php\nfunction safe_json(string $s) {\n    return json_decode($s, true, 512, JSON_THROW_ON_ERROR);\n}\n",
      sol: "<?php\nfunction safe_json(string $s) {\n    try {\n        $v = json_decode($s, true, 512, JSON_THROW_ON_ERROR);\n    } catch (Throwable $e) {\n        return null;\n    }\n    return is_array($v) ? $v : null;\n}\n",
      test: test('eqv(safe_json(\'{"a":1}\'), ["a" => 1], "올바른 객체");\neqv(safe_json("[1,2]"), [1, 2], "올바른 배열");\neqv(safe_json("망가짐"), null, "잘못된 JSON");\neqv(safe_json(""), null, "빈 문자열");\neqv(safe_json("5"), null, "배열이 아니면 null");\n'),
      ex: "바깥에서 오는 JSON 은 언제든 망가져 있을 수 있습니다 — 흔히 일어나는 일은 예외가 아니라 정상 경로로 다뤄야 해요. 다만 `catch` 안에서 아무 말도 안 하는 대신, '실패했다' 를 null 이라는 값으로 분명히 전합니다.",
    },
    {
      k: "with_cleanup · 실패해도 정리한다",
      qq: "<code>with_cleanup(callable $work, array &$log)</code> 를 만드세요. <code>$work</code> 를 부르고 <b>성공하든 실패하든</b> <code>$log</code> 에 <code>\"닫음\"</code> 을 남깁니다. 예외는 <b>그대로 밖으로</b> 나가야 합니다.",
      src: "<?php\nfunction with_cleanup(callable $work, array &$log) {\n    $r = $work();\n    $log[] = \"닫음\";\n    return $r;\n}\n",
      sol: "<?php\nfunction with_cleanup(callable $work, array &$log) {\n    try {\n        return $work();\n    } finally {\n        $log[] = \"닫음\";\n    }\n}\n",
      test: test('$log = [];\neqv(with_cleanup(fn() => 7, $log), 7, "성공 결과");\neqv($log, ["닫음"], "성공해도 정리");\n$log2 = [];\n$threw = false;\ntry { with_cleanup(function () { throw new RuntimeException("펑"); }, $log2); }\ncatch (RuntimeException $e) { $threw = true; }\neqv($threw, true, "예외는 그대로 나가야 한다");\neqv($log2, ["닫음"], "실패해도 정리해야 한다");\n'),
      ex: "예외가 나면 그 아래 줄은 실행되지 않습니다 — 파일이 열린 채, 잠금이 걸린 채 남아요. `finally` 는 `return` 이 있든 예외가 나든 반드시 실행되고, 예외를 삼키지도 않습니다.",
    },
  ],
},
/* ── 네임스페이스·Composer ───────────────────────────────── */
{
  unit: "네임스페이스 · Composer · 오토로딩",
  lesson: "직접 짜 보기 — 이름이 겹치지 않게",
  th: {
    sum: "네임스페이스는 **이름에 성(姓)을 붙이는 일**이다. 오토로딩은 그 성으로 파일을 찾는 규칙이다.",
    body: [
      { h: "왜 필요한가", t: "라이브러리 두 개가 똑같이 `Logger` 를 정의하면 하나만 살아남는다. `App\\Logger` 와 `Vendor\\Logger` 로 성을 붙이면 둘 다 공존한다." },
      { h: "PSR-4 는 이름과 경로를 맞춘다", t: "`App\\Service\\Mailer` 는 `src/Service/Mailer.php` 에 있다는 약속이다. 그래서 `require` 를 하나도 안 써도 필요한 순간에 파일을 찾아 읽는다 — 규칙이 곧 색인이다." },
      { h: "use 는 별명일 뿐", t: "`use App\\Service\\Mailer;` 는 파일을 읽는 게 아니라 '이 파일에서 Mailer 라고 쓰면 그것' 이라는 별명 선언이다. 실제로 읽는 것은 오토로더다." },
      { h: "전역 함수는 백슬래시로", t: "네임스페이스 안에서 `strlen()` 을 부르면 PHP 는 먼저 그 네임스페이스를 찾아본다. `\\strlen()` 으로 적으면 곧바로 전역으로 간다." },
    ],
    code: { c: "// src/Service/Mailer.php\nnamespace App\\Service;\nclass Mailer {}\n\n// 쓰는 쪽\nuse App\\Service\\Mailer;   // 별명\n$m = new Mailer();          // 오토로더가 파일을 찾는다", cap: "이름 규칙이 곧 파일 경로" },
    key: ["네임스페이스는 이름 충돌을 막는다", "PSR-4 는 이름=경로", "`use` 는 별명 선언"],
  },
  q: [
    {
      k: "psr4_path · 이름에서 경로 만들기",
      qq: "<code>psr4_path(string $class, string $prefix, string $dir): string</code> 를 만드세요. <code>App\\Service\\Mailer</code> 와 접두사 <code>App\\</code>, 디렉터리 <code>src</code> 면 <code>src/Service/Mailer.php</code> 입니다. 접두사가 안 맞으면 <b>빈 문자열</b>입니다.",
      src: "<?php\nfunction psr4_path(string $class, string $prefix, string $dir): string {\n    return $dir . \"/\" . str_replace(\"\\\\\", \"/\", $class) . \".php\";\n}\n",
      sol: "<?php\nfunction psr4_path(string $class, string $prefix, string $dir): string {\n    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {\n        return \"\";\n    }\n    $rest = substr($class, strlen($prefix));\n    return $dir . \"/\" . str_replace(\"\\\\\", \"/\", $rest) . \".php\";\n}\n",
      test: test('eqv(psr4_path("App\\\\Service\\\\Mailer", "App\\\\", "src"), "src/Service/Mailer.php", "보통");\neqv(psr4_path("App\\\\Mailer", "App\\\\", "src"), "src/Mailer.php", "한 단계");\neqv(psr4_path("Other\\\\Mailer", "App\\\\", "src"), "", "접두사가 다르면 빈 문자열");\neqv(psr4_path("App\\\\A\\\\B\\\\C", "App\\\\", "lib"), "lib/A/B/C.php", "깊은 경로");\n'),
      ex: "접두사를 안 떼면 `src/App/Service/Mailer.php` 가 됩니다 — 실제 파일은 `src/Service/Mailer.php` 라 못 찾아요. 그리고 다른 라이브러리의 클래스까지 내 디렉터리에서 찾으려 들어, 오토로더 사슬이 헛돕니다.",
    },
    {
      k: "short_name · 성을 떼고 이름만",
      qq: "<code>short_name(string $fqcn): string</code> 를 만드세요. 마지막 <code>\\</code> 뒤의 이름만 돌려주고, <code>\\</code> 가 없으면 그대로입니다.",
      src: "<?php\nfunction short_name(string $fqcn): string {\n    $parts = explode(\"\\\\\", $fqcn);\n    return $parts[0];\n}\n",
      sol: "<?php\nfunction short_name(string $fqcn): string {\n    $i = strrpos($fqcn, \"\\\\\");\n    return $i === false ? $fqcn : substr($fqcn, $i + 1);\n}\n",
      test: test('eqv(short_name("App\\\\Service\\\\Mailer"), "Mailer", "깊은 이름");\neqv(short_name("Mailer"), "Mailer", "성이 없으면 그대로");\neqv(short_name("A\\\\B"), "B", "두 단계");\neqv(short_name("\\\\App\\\\X"), "X", "앞에 백슬래시가 있어도");\n'),
      ex: "첫 조각을 집으면 네임스페이스의 맨 앞(App)이 나옵니다 — 클래스 이름이 아니에요. 로그나 화면에 'App' 만 잔뜩 찍히게 됩니다. 필요한 것은 **마지막** 조각입니다.",
    },
    {
      k: "resolve · use 별명 풀기",
      qq: "<code>resolve(string $name, array $uses): string</code> 를 만드세요. 별명 표에 있으면 <b>전체 이름</b>으로 바꾸고, 없으면 <b>그대로</b> 돌려줍니다. 이미 <code>\\</code> 로 시작하면 <b>앞의 <code>\\</code> 만 떼고</b> 그대로입니다.",
      src: "<?php\nfunction resolve(string $name, array $uses): string {\n    return $uses[$name];\n}\n",
      sol: "<?php\nfunction resolve(string $name, array $uses): string {\n    if (str_starts_with($name, \"\\\\\")) {\n        return substr($name, 1);\n    }\n    return $uses[$name] ?? $name;\n}\n",
      test: test('$u = ["Mailer" => "App\\\\Service\\\\Mailer"];\neqv(resolve("Mailer", $u), "App\\\\Service\\\\Mailer", "별명을 푼다");\neqv(resolve("Other", $u), "Other", "없으면 그대로");\neqv(resolve("\\\\Vendor\\\\Mailer", $u), "Vendor\\\\Mailer", "절대 이름은 그대로");\neqv(resolve("Mailer", []), "Mailer", "표가 비었으면 그대로");\n'),
      ex: "표에 없는 이름을 꺼내면 PHP 8 부터는 경고가 뜨고 값은 null 입니다 — 반환 타입이 string 이라 그대로 터져요. `??` 로 기본값을 두면 '별명이 없으면 원래 이름' 이라는 규칙이 그대로 코드가 됩니다.",
    },
  ],
},
];
