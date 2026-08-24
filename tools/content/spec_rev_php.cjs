module.exports = {
  track: "php", guide: "🔍", xp: 70,
  unit: "코드 리뷰 — 결함 찾기",
  source: "./rev_php.cjs",
  lessons: [
    { t: "비교와 값 판정", n: 4,
      th: { sum: "PHP 를 가장 많이 오해하는 자리는 **무엇이 같고 무엇이 비었는가**다.",
        body: [
          { h: "같다는 것", t: "<code>==</code> 는 타입을 맞춰 비교하므로 <code>\"0e123\"</code> 꼴 문자열끼리는 둘 다 0 으로 바뀌어 같아진다. 해시나 토큰 비교에서 이것은 그대로 인증 우회가 되므로 <code>===</code> 나 <code>hash_equals</code> 를 쓰고, <code>in_array</code> 는 세 번째 인자로 엄격 모드를 켠다." },
          { h: "비었다는 것", t: "<code>empty</code> 는 <code>\"0\"</code>·<code>0</code>·빈 배열을 모두 참으로 본다. 값의 유무만 보려면 <code>isset</code> 이나 <code>array_key_exists</code> 를 쓰고, <code>(int)</code> 캐스팅은 실패하지 않고 0 을 만들므로 <code>filter_var</code> 로 검증한다." }],
        code: { c: "hash_equals($stored, $given)\nin_array($v, $allowed, true)\narray_key_exists('page', $q)", cap: "같음과 비어 있음을 정확히 묻는다" },
        key: ["== 는 형 변환을 한다", "in_array 는 엄격 모드로", "empty 는 0 도 비었다고 본다", "캐스팅은 실패하지 않는다"] } },
    { t: "상태와 출력", n: 4,
      th: { sum: "**어디에 값이 사는가**와 **언제 응답이 시작되는가** — 둘을 놓치면 조용히 깨진다.",
        body: [
          { h: "남는 참조, 공유되는 정적", t: "참조로 순회한 뒤 <code>unset</code> 하지 않으면 그 이름이 마지막 원소를 계속 가리켜 다음 반복이 값을 덮어쓴다. 정적 속성은 클래스에 하나뿐이라 인스턴스를 새로 만들어도 공유되고, 워커를 재사용하는 실행 모델에서는 요청 사이에도 남는다." },
          { h: "헤더는 본문보다 먼저", t: "무엇이든 출력하고 나면 헤더는 이미 전송된 뒤라 <code>header</code>·<code>setcookie</code> 가 <b>경고만 남기고 아무 일도 하지 않는다</b>. 쿠키를 설정할 때는 <code>HttpOnly</code>·<code>Secure</code>·<code>SameSite</code> 를 함께 지정한다." }],
        code: { c: "foreach ($rows as &$r) { … } unset($r);\nsetcookie('sid', $v, ['httponly'=>true,'secure'=>true,'samesite'=>'Lax']);", cap: "참조는 끊고, 헤더는 먼저" },
        key: ["참조 순회 뒤 unset", "정적 속성은 공유된다", "출력 뒤 헤더는 무시된다", "쿠키 속성을 명시한다"] } },
  ],
};
