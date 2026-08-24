module.exports = {
  track: "php", guide: "", xp: 60,
  unit: "단답으로 확인하기 — 비교 규칙과 표준 함수",
  source: "./in_php.cjs",
  lessons: [
    { t: "느슨한 타입이 만드는 결과", n: 8,
      th: { sum: "PHP 에서 조용히 틀리는 자리는 대개 **자동 변환**이다. 무엇이 무엇으로 바뀌는지 알면 대부분 미리 막힌다.",
        body: [
          { h: "견주는 규칙", t: "PHP 8 부터 숫자와 <b>숫자가 아닌 문자열</b>을 <code>==</code> 로 견주면 숫자를 문자열로 바꿔 견주므로 <code>0 == 'abc'</code> 가 <b>거짓</b>이다(7 까지는 참이었고 인증 우회의 단골이었다). 하지만 <code>'1' == '01'</code> 처럼 둘 다 숫자로 보이면 여전히 숫자 비교라, 해시가 <code>0e</code> 로 시작하면 서로 같아진다 — 문자열은 <code>===</code> 나 <code>strcmp</code> 로, 토큰은 <code>hash_equals</code> 로 견준다. <code>(int)'12abc'</code> 는 예외 없이 12 가 되므로 검증에는 <code>filter_var</code> 를 쓴다." },
          { h: "세는 단위와 담는 그릇", t: "<code>strlen</code> 은 <b>바이트</b>를 세어 한글 한 글자가 3 이고, 글자를 세려면 <code>mb_</code> 계열이어야 한다 — <code>substr</code> 도 마찬가지라 글자가 깨진다. PHP 배열은 <b>순서 있는 맵</b>이라 번호가 0 부터 빈틈없이 이어질 때만 JSON 배열이 되고, 원소를 지운 뒤 그대로 내보내면 <b>응답 타입이 객체로 바뀐다</b> — <code>array_values()</code> 로 번호를 다시 매긴다. 기본값에는 <code>??</code>, 참·거짓 판단에만 <code>?:</code> 를 쓴다." }],
        code: { c: "if ($a === $b)                 // 기본은 엄격 비교\narray_values($rows)            // 내보내기 전에 번호 재정렬\n$name = $in['name'] ?? '손님';  // 없을 때만", cap: "무엇이 무엇으로 바뀌는지 안다" },
        key: ["문자열끼리도 숫자 비교가 될 수 있다", "strlen 은 바이트, mb_strlen 은 글자", "배열은 목록이자 사전이다", "?? 와 ?: 는 뜻이 다르다"] } },
    { t: "요청마다 새로 태어나는 실행 모델", n: 7,
      th: { sum: "PHP 는 요청마다 새로 시작한다. 그래서 **캐시·세션·의존성**을 다루는 방식이 다른 언어와 다르다.",
        body: [
          { h: "빠르게 만들고 안전하게 내보내기", t: "요청마다 소스를 다시 컴파일하지 않도록 <b>OPcache</b> 가 바이트코드를 캐시한다 — 운영에서 끄고 쓰는 것은 사실상 실수이고, 배포 후 비우지 않으면 옛 코드가 계속 돈다. 출력 이스케이프는 <b>입력이 아니라 출력</b>에서 하고, 놓이는 자리(HTML·속성·JS·URL)마다 방법이 다르므로 템플릿의 <b>자동 이스케이프</b>를 켜 두는 편이 확실하다. <b>Composer</b> 의 잠금 파일은 애플리케이션이라면 반드시 커밋한다." },
          { h: "지켜야 할 값들", t: "비밀번호는 <b><code>password_hash</code></b> 로 저장한다 — 결과에 알고리즘·비용·소금이 함께 들어 있고, <code>md5</code>·<code>sha1</code> 은 <b>너무 빨라서</b> 쓰면 안 된다. 세션 쿠키(<b>PHPSESSID</b>)는 훔치면 로그인한 것과 같으므로 <code>HttpOnly</code>·<code>Secure</code>·<code>SameSite</code> 를 켜고, 로그인 직후 <code>session_regenerate_id(true)</code> 로 세션 고정을 막는다. 새 파일에는 <b><code>declare(strict_types=1)</code></b> 을 첫 줄에 두어 자동 변환을 끈다." }],
        code: { c: "declare(strict_types=1);\necho htmlspecialchars($s, ENT_QUOTES, 'UTF-8');\nsession_regenerate_id(true);   // 로그인 직후", cap: "매 요청이 새 시작이라는 전제" },
        key: ["OPcache 는 운영의 기본", "이스케이프는 출력 자리에서", "password_hash 는 느린 것이 장점", "로그인 직후 세션 ID 를 새로 만든다"] } },
  ],
};
