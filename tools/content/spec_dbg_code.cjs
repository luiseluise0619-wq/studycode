module.exports = {
  track: "code", guide: "", xp: 80,
  unit: "실행형 실전 — 자바스크립트가 조용히 다르게 도는 자리",
  source: "./dbg_code.cjs",
  lessons: [
    { t: "값이 조용히 바뀌는 자리", n: 7,
      th: { sum: "예제에서는 맞고 실제 데이터에서만 틀리는 버그는 대개 **언어가 대신 해 준 변환** 때문이다 — 인자 개수, 거짓 같은 값, 코드 단위.",
        body: [
          { h: "언어가 몰래 채워 주는 것들", t: "<code>map</code> 은 콜백에 <b>값·인덱스·배열</b> 셋을 넘기므로 <code>list.map(parseInt)</code> 는 인덱스를 진법으로 읽는다. <code>||</code> 는 '없으면' 이 아니라 '<b>거짓 같으면</b>' 이라서 <code>0</code>·<code>''</code>·<code>false</code> 를 기본값으로 덮어쓴다 — 기본값에는 <code>??</code> 를 쓴다. <code>reduce</code> 의 초기값은 선택 인자가 아니라 <b>누적값의 타입 선언</b>이다. 셋 다 원소가 하나뿐인 예제에서는 통과한다." },
          { h: "세는 단위와 바꾸는 범위를 확인한다", t: "<code>.length</code> 는 글자가 아니라 <b>UTF-16 코드 단위</b>를 세므로 이모지가 반으로 잘린다 — <code>[...s]</code> 로 코드 포인트를 센다. <code>replace</code> 에 문자열을 주면 <b>처음 하나</b>만 바뀐다. <code>new RegExp(사용자입력)</code> 은 남이 준 글자를 <b>문법으로 해석</b>하므로 <code>.</code> 이 전부를 세고 <code>+</code> 가 예외를 낸다 — 문자열 API 로 풀 수 있는지 먼저 묻는다." }],
        code: { c: "list.map(s => Number.parseInt(s, 10));   // 인자를 하나만 받게 감싼다\nretries: o.retries ?? 3,                 // 0 을 살린다\ntext.split(needle).length - 1;           // 정규식이 필요 없다", cap: "언어가 대신 해 준 일을 되돌려 놓는다" },
        key: ["콜백에 함수 이름을 그대로 넘기지 않는다", "기본값에는 ?? 를 쓴다", "reduce 에는 초기값을 준다", "바꿀 대상이 둘 이상인 입력을 테스트한다"] } },
    { t: "공유되고 남아 있는 상태", n: 6,
      th: { sum: "반환값만 확인하는 테스트로는 절대 잡히지 않는 버그가 있다 — **인자를 고쳤거나, 참조를 나눠 가졌거나, 지난 호출의 자리를 기억하고 있다.**",
        body: [
          { h: "고치는 함수와 나눠 가진 참조", t: "<code>sort</code>·<code>reverse</code>·<code>splice</code>·<code>push</code>·<code>Object.assign(base, …)</code> 는 <b>받은 것을 직접 고친다</b>. 공유되는 설정 객체나 캐시된 목록에 쓰면 첫 호출의 흔적이 이후 전부에 남는다. <code>{ ...user }</code> 는 <b>한 겹만</b> 복사하므로 중첩 배열은 여전히 같은 것을 가리킨다 — 불변 갱신은 <b>바뀌는 경로 위의 모든 층</b>을 새로 만들어야 한다. 그리고 훑으면서 지우면 뒤 원소가 당겨져 <b>한 칸을 건너뛴다</b>." },
          { h: "물려받은 이름과 기억하는 자리", t: "<code>{}</code> 로 만든 객체는 <code>constructor</code>·<code>toString</code> 을 <b>물려받는다</b> — 바깥에서 오는 값을 열쇠로 삼을 때 <code>Map</code> 을 쓰는 이유다. <code>g</code> 플래그가 붙은 정규식은 <code>lastIndex</code> 라는 <b>가변 상태</b>를 들고 있어 같은 객체를 다시 쓰면 앞부분을 건너뛴다. 메서드를 변수에 담으면 <code>this</code> 가 끊긴다 — <code>this</code> 는 <b>어떻게 불렸는지</b>로 정해진다." }],
        code: { c: "return scores.slice().sort((a, b) => b - a);        // 먼저 복사한다\nreturn { ...user, tags: [...user.tags, tag] };      // 바뀌는 층을 모두 새로\nout.push(this.inc());                               // 점 표기로 붙여서 부른다", cap: "테스트에 '원본이 그대로인가' 를 넣는다" },
        key: ["정렬 전에 복사한다", "참조가 갈라졌는지 직접 확인한다", "바깥에서 온 열쇠는 Map 으로", "모듈 최상단의 g 정규식은 공유 상태다"] } },
  ],
};
