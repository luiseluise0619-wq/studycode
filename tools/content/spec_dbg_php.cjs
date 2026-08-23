module.exports = {
  track: "php", guide: "🐛", xp: 80,
  unit: "실행형 실전 — 돌아가는 것처럼 보이는 PHP 고치기",
  source: "./dbg_php.cjs",
  lessons: [
    { t: "느슨한 규칙이 조용히 통과시키는 것", n: 6,
      th: { sum: "PHP 의 편의 기능은 대부분 '**웬만하면 통과시킨다**' 는 방향이다. 그 관대함이 곧 조용한 버그의 자리다.",
        body: [
          { h: "견주는 규칙과 버리는 값", t: "<code>==</code> 는 양쪽이 숫자로 읽히면 숫자로 견주므로 <code>'0e123'</code> 과 <code>'0e456'</code> 이 같아진다 — 토큰·해시·서명은 <b><code>hash_equals</code></b> 로 견준다. <code>empty()</code> 와 <code>if ($v)</code> 는 '값이 있는가' 가 아니라 '<b>참 같은가</b>' 를 묻기 때문에 <code>0</code>·<code>\"0\"</code>·<code>[]</code> 를 함께 버린다 — 존재는 <code>isset</code>, 빈 값은 <code>=== \"\"</code> 로 <b>뜻을 그대로</b> 적는다. 같은 이유로 <code>array_search</code>·<code>strpos</code> 의 결과는 언제나 <b><code>=== false</code></b> 로 검사해야 자리 0 을 안 잃는다." },
          { h: "구분자와 패턴", t: "<code>explode</code> 는 구분자가 없어도 원본 하나짜리 배열을 주므로, <code>end()</code> 로 확장자를 뽑으면 <b>이름 전체</b>가 나온다 — 마지막 점 위치를 직접 찾거나 <code>pathinfo()</code> 를 쓴다. 사용자 입력을 정규식에 그대로 넣으면 <code>.</code> 이 아무 글자가 되고 <code>+</code> 는 컴파일을 깨뜨린다 — 글자 그대로 세는 일은 <b><code>substr_count</code></b> 로 하고, 꼭 패턴이 필요하면 <code>preg_quote</code> 를 거친다." }],
        code: { c: "hash_equals($stored, $given)          // 토큰 비교\n$i === false ? -1 : $i               // 자리 0 을 살린다\nsubstr_count($text, $needle)         // 정규식이 필요 없다", cap: "관대함이 곧 버그의 자리다" },
        key: ["문자열끼리도 숫자 비교가 될 수 있다", "empty 는 0 을 버린다", "false 만 === 로 가려낸다", "사용자 입력을 문법으로 해석하지 않는다"] } },
    { t: "값·참조·상태가 새는 자리", n: 6,
      th: { sum: "PHP 배열은 값이고 객체는 핸들이며 <code>static</code> 은 호출 사이에 남는다. **무엇이 언제 복사되는가**를 놓치면 결과가 조용히 어긋난다.",
        body: [
          { h: "고치는 함수와 남는 참조", t: "정렬 함수는 <b>인자를 직접 고치고 <code>bool</code> 을 돌려준다</b> — 복사본을 정렬해 놓고 원본을 자르는 실수가 여기서 나온다. <code>foreach ($a as &$v)</code> 가 끝나도 <code>$v</code> 는 <b>마지막 원소를 가리키는 참조로 남아</b>, 같은 이름으로 다시 훑으면 마지막 칸이 덮인다 — 끝나면 <code>unset($v)</code>, 더 좋게는 참조를 아예 안 쓴다. <code>static</code> 지역 변수는 다음 호출까지 남으므로 결과가 누적된다 — <b>같은 함수를 두 번 부르는</b> 테스트로 잡는다." },
          { h: "키·바이트·부동소수", t: "<code>array_filter</code> 는 키를 남겨 <code>json_encode</code> 가 <b>객체</b>를 내보내므로 <code>array_values</code> 로 번호를 다시 매긴다. <code>array_merge</code> 는 숫자 키를 <b>자리로</b> 보아 덮어쓰지 않고 뒤에 붙이므로, 사전을 덮을 때는 <code>array_replace</code> 를 쓴다. <code>strlen</code>·<code>substr</code> 은 <b>바이트</b>라 한글을 깨뜨리니 <code>mb_</code> 계열로 바꾼다. <code>1.15 * 100</code> 은 <code>114.999…</code> 라 <code>(int)</code> 가 114 를 준다 — <b>돈은 정수 최소 단위</b>로 다룬다." }],
        code: { c: "unset($v);                       // 참조 순회 뒤 반드시\narray_values(array_filter($a))   // 내보내기 전에 번호 재정렬\n(int) round($amount * 100)       // 버림이 아니라 반올림", cap: "무엇이 언제 복사되는가" },
        key: ["정렬 함수는 인자를 고친다", "참조 순회 뒤 unset", "static 은 호출 사이에 남는다", "목록은 array_merge, 사전은 array_replace"] } },
  ],
};
