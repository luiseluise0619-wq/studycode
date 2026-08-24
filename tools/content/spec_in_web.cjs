module.exports = {
  track: "web", guide: "", xp: 60,
  unit: "단답으로 확인하기 — 기본값과 규칙의 이름",
  source: "./in_web.cjs",
  lessons: [
    { t: "상자와 배치의 기본값", n: 8,
      th: { sum: "CSS 가 '안 먹는' 대부분의 순간은 **기본값을 모르고 있을 때**다 — 배치 방식, 상자 계산 범위, 기준이 되는 조상.",
        body: [
          { h: "무엇이 기본인가", t: "<code>&lt;a&gt;</code> 는 <code>inline</code> 이라 너비·높이·위아래 여백이 안 먹고, <code>box-sizing</code> 의 기본 <code>content-box</code> 는 <b>콘텐츠만</b> 재어 안쪽 여백을 주면 상자가 커진다 — 그래서 대부분의 프로젝트가 맨 앞에 <code>border-box</code> 를 깐다. 플렉스의 <code>flex-direction</code> 기본은 <code>row</code> 이고, 방향을 바꾸면 <code>justify-content</code> 와 <code>align-items</code> 의 역할도 함께 뒤바뀐다." },
          { h: "무엇을 기준으로 놓이는가", t: "<code>absolute</code> 는 <code>position</code> 이 <b><code>static</code> 이 아닌</b> 가장 가까운 조상을 기준으로 삼고, 없으면 화면 구석으로 날아간다 — <code>transform</code>·<code>filter</code> 가 걸린 조상도 기준이 되어 애니메이션을 넣었더니 배치가 틀어지는 사고가 난다. <code>z-index</code> 는 <code>position</code> 이 있어야 먹고, 더 중요한 것은 <b>쌓임 맥락</b>이다 — 9999 를 줘도 안 올라오면 값이 아니라 맥락 문제다. 특이도는 앞자리부터 견주므로 클래스 열 개가 아이디 하나를 못 이긴다." }],
        code: { c: "*, *::before, *::after { box-sizing: border-box }\n.parent { position: relative }   /* 기준점을 여기로 */\n#nav .item p  →  (1, 1, 1)", cap: "기본값을 알면 '왜 안 먹지' 가 없다" },
        key: ["a 는 inline 이 기본", "border-box 는 패딩·테두리 포함", "absolute 의 기준은 static 이 아닌 조상", "특이도는 앞자리부터 견준다"] } },
    { t: "사람과 브라우저에게 알려 주기", n: 7,
      th: { sum: "마크업은 **기계에게 뜻을 알려 주는 일**이고, 성능 최적화는 **브라우저에게 일을 덜 시키는 일**이다.",
        body: [
          { h: "뜻을 알려 주는 속성들", t: "<code>alt</code> 는 이미지가 전하는 <b>정보</b>를 적는 자리이고, 장식용이면 빈 문자열을 주어 '읽지 말라' 고 알린다 — 속성을 빼면 낭독기가 파일 이름을 읽는다. <code>&lt;label for&gt;</code> 로 이름표와 입력칸을 이으면 누를 영역이 넓어지고 낭독기가 함께 읽어 준다(자리 표시자는 이름표를 대신하지 못한다). <code>&lt;main&gt;</code> 은 한 페이지에 하나만 두어 '본문 바로가기' 의 목적지가 되고, <code>tabindex</code> 의 양수는 문서 순서를 어지럽혀 쓰지 않는다." },
          { h: "일을 덜 시키기", t: "뷰포트 메타의 <code>width=device-width</code> 가 없으면 모바일이 폭 980px 인 척하고 축소해, CSS 를 아무리 잘 짜도 반응형이 안 먹는다. <code>Cache-Control: max-age</code> 안에서는 <b>요청 자체가 안 나가고</b>, 지나면 <code>ETag</code> 로 바뀌었는지만 물어 304 로 끝낸다. 애니메이션은 <b><code>transform</code> 과 <code>opacity</code></b> 로 — 합성 단계에서만 처리되어 리플로가 없다. Grid 의 <code>repeat(auto-fit, minmax(…))</code> 는 미디어 쿼리 없이 열 수를 바꾼다." }],
        code: { c: "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\nCache-Control: max-age=31536000, immutable\ngrid-template-columns: repeat(auto-fit, minmax(200px, 1fr))", cap: "가장 빠른 요청은 보내지 않는 요청" },
        key: ["alt 는 정보를, 장식이면 빈 문자열", "label 은 for 로 잇는다", "뷰포트 메타 한 줄이 반응형의 전제", "움직임은 transform 으로"] } },
  ],
};
