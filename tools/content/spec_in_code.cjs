module.exports = {
  track: "code", guide: "✍️", xp: 60,
  unit: "단답으로 확인하기 — 자바스크립트가 실제로 내놓는 값",
  source: "./in_code.cjs",
  lessons: [
    { t: "값과 타입이 슬쩍 바뀌는 자리", n: 8,
      th: { sum: "고른 답이 맞는 것과 **직접 적을 수 있는 것**은 다르다. 여기서는 코드를 보고 결과를 손으로 적는다.",
        body: [
          { h: "없음·타입·형변환", t: "찾지 못하면 <code>-1</code> 이다 — 0 이 정당한 자리 번호라서 그렇고, 그래서 <code>if (arr.indexOf(x))</code> 는 첫 자리에서 거짓이 된다. <code>typeof null</code> 이 <code>'object'</code> 인 것은 고칠 수 없는 초창기 버그다. <code>+</code> 는 한쪽이 문자열이면 <b>이어 붙이기</b>가 되지만 <code>-</code>·<code>*</code> 는 숫자로 바꿔 계산한다 — 폼에서 온 값은 전부 문자열이므로 계산 전에 한 번 바꿔야 한다." },
          { h: "세는 단위와 견주는 방법", t: "<code>.length</code> 는 글자가 아니라 <b>UTF-16 코드 단위</b>를 세어 이모지 하나가 2 다. 이진 부동소수로는 <code>0.1 + 0.2 !== 0.3</code> 이라 실수는 오차를 허용해 견주고, 돈은 <b>정수 최소 단위</b>로 다룬다. 비교 함수를 안 준 <code>sort</code> 는 <b>문자열로</b> 견주므로 <code>10</code> 이 <code>9</code> 앞에 온다." }],
        code: { c: "[10, 9, 1].sort()            // ['1','10','9'] 순서로 견준다\n[...s].length                // 코드 포인트로 센다\nMath.abs(a - b) < 1e-9       // 실수는 오차를 허용해 견준다", cap: "언어가 대신 바꾼 것을 눈으로 확인한다" },
        key: ["못 찾으면 -1", "typeof null 은 object", "+ 만 이어 붙이기가 된다", "sort 는 기본이 사전순"] } },
    { t: "자료구조가 조용히 정하는 것", n: 7,
      th: { sum: "배열·객체·집합은 **기본값과 버리는 값**을 스스로 정한다. 그 기본값을 외우는 게 아니라 **왜 그런지**를 알면 잊히지 않는다.",
        body: [
          { h: "기본 깊이와 항등원", t: "<code>flat()</code> 의 기본 깊이가 1 인 것은 <code>flatMap</code> 쓰임이 가장 흔해서다 — 끝까지 펴려면 <code>flat(Infinity)</code>. <code>Math.max()</code> 가 <code>-Infinity</code> 인 것은 그 값이 최댓값의 <b>항등원</b>이기 때문이고, 같은 이유로 <code>reduce</code> 의 초기값 0 이 덧셈의 항등원이다. 초기값은 선택 인자가 아니라 <b>누적값의 타입 선언</b>이다." },
          { h: "순서와 버려지는 값", t: "문자열 열쇠는 <b>넣은 순서</b>를 지키지만 정수처럼 생긴 열쇠는 오름차순으로 먼저 나온다 — 캐시 열쇠를 만들 때 <code>sort()</code> 로 순서를 고정하는 이유다. <code>Set</code> 은 같은 값을 하나만 담고 개수는 <code>size</code> 로 센다. <code>JSON.stringify</code> 는 객체의 <code>undefined</code>·함수·<code>Symbol</code> 을 <b>조용히 버리고</b>, 배열 안에서는 자리를 지켜야 하므로 <code>null</code> 로 바꾼다." }],
        code: { c: "[1, [2, [3]]].flat()                 // 한 겹만 벗긴다\nObject.keys(o).sort().join('&')      // 열쇠 순서를 고정한다\nArray.from({ length: 3 }, (_, i) => i)", cap: "기본값에는 저마다 이유가 있다" },
        key: ["flat 의 기본 깊이는 1", "Math.max() 는 -Infinity", "열쇠 순서는 넣은 순서", "stringify 는 undefined 를 버린다"] } },
  ],
};
