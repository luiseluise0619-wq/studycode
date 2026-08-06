/* HTML·CSS 실습 2차 — 실습이 하나도 없던 6개 유닛을 연다.
   레이아웃 · Flex/Grid · 반응형 · 접근성 · 렌더링 성능 · 셀렉터.

   채점은 브라우저가 실제로 그린 결과를 본다(t:"html").
   도우미: Q QA COUNT TXT ATTR CS RECT W H SRCCSS
   CS 는 계산된 스타일이라 '글자만 맞춘' 답은 통과하지 못한다.

   검증기의 화면 폭은 400px 다. 그래서 '작은 화면에서 어떻게 보이는가' 를 그대로
   확인할 수 있다 — 모바일 우선 문항은 이 폭을 기준으로 냈다. */
module.exports = [
/* ── CSS 레이아웃 심화 ────────────────────────────────────── */
{
  unit: "CSS 레이아웃 심화",
  lesson: "직접 만들어 보기 — 상자의 크기와 자리",
  th: {
    sum: "CSS 에서 요소는 **상자**다. 상자의 크기를 어떻게 세는지부터 알아야 한다.",
    body: [
      { h: "width 는 안쪽만 센다", t: "`width: 200px` 은 기본적으로 **내용 부분**만 200px 이라는 뜻이다. 여기에 안쪽 여백과 테두리가 더해져 실제 폭은 더 커진다. 그래서 200px 칸 두 개를 400px 안에 넣으려다 넘치는 일이 생긴다." },
      { h: "box-sizing 으로 셈법을 바꾼다", t: "`box-sizing: border-box` 를 주면 여백과 테두리까지 포함해 200px 이 된다. 계산이 훨씬 단순해져서, 요즘은 대부분 이 방식을 기본으로 깔아 둔다." },
      { h: "가운데 두기는 margin auto", t: "폭이 정해진 상자에 `margin: 0 auto` 를 주면 남는 자리를 양쪽으로 똑같이 나눈다. 폭을 정하지 않으면 상자가 가로를 다 차지해서 남는 자리가 없고, 그러면 가운데로 가지도 않는다." },
      { h: "absolute 는 기준을 찾아 올라간다", t: "`position: absolute` 인 요소는 위로 올라가며 `position` 이 지정된 조상을 찾아 그것을 기준으로 자리를 잡는다. 없으면 페이지 전체가 기준이 된다 — 부모에 `position: relative` 를 안 주면 배지가 엉뚱한 데로 날아가는 이유다." },
    ],
    code: { c: ".box { box-sizing: border-box; width: 200px; padding: 20px; }\n.wrap { max-width: 300px; margin: 0 auto; }\n.card { position: relative; }\n.badge { position: absolute; top: 0; right: 0; }", cap: "셈법·가운데·기준" },
    key: ["`width` 는 안쪽만 센다", "가운데는 `margin: 0 auto`", "`absolute` 는 기준 조상을 찾는다"],
  },
  q: [
    {
      k: "box-sizing · 200px 은 200px 이게",
      q: "<code>.box</code> 의 <b>실제 폭</b>이 여백과 테두리를 포함해 <b>정확히 200px</b> 이 되게 하세요.",
      src: "<style>\n  .box {\n    width: 200px;\n    padding: 20px;\n    border: 2px solid #333;\n  }\n</style>\n<div class=\"box\">상자</div>",
      sol: "<style>\n  .box {\n    box-sizing: border-box;\n    width: 200px;\n    padding: 20px;\n    border: 2px solid #333;\n  }\n</style>\n<div class=\"box\">상자</div>",
      tests: [
        { d: "실제 폭이 200px 이다", js: "W('.box')===200" },
        { d: "안쪽 여백은 그대로 20px", js: "CS('.box','padding-left')==='20px'" },
        { d: "테두리도 그대로 2px", js: "CS('.box','border-left-width')==='2px'" },
      ],
      ex: "width 는 기본적으로 내용 부분만 셉니다. 여백 20px 두 번과 테두리 2px 두 번이 더해져 실제로는 244px 이 돼요. border-box 를 주면 그 전부를 포함해 200px 이 됩니다.",
    },
    {
      k: "margin auto · 가운데 두기",
      q: "<code>.wrap</code> 을 화면 <b>가운데</b>에 두세요. 폭은 <code>300px</code> 입니다.",
      src: "<style>\n  .wrap {\n    width: 300px;\n    margin: 0;\n    background: #eef;\n  }\n</style>\n<div class=\"wrap\">가운데</div>",
      sol: "<style>\n  .wrap {\n    width: 300px;\n    margin: 0 auto;\n    background: #eef;\n  }\n</style>\n<div class=\"wrap\">가운데</div>",
      tests: [
        { d: "폭은 300px 그대로", js: "W('.wrap')===300" },
        { d: "왼쪽에 남는 자리가 생긴다", js: "parseFloat(CS('.wrap','margin-left'))>0" },
        { d: "양쪽이 똑같이 나뉜다", js: "Math.abs(parseFloat(CS('.wrap','margin-left'))-parseFloat(CS('.wrap','margin-right')))<2" },
      ],
      ex: "margin 을 0 으로 두면 남는 자리가 전부 오른쪽으로 갑니다. auto 는 '남는 자리를 알아서 나눠 가져라' 는 뜻이라, 양쪽에 auto 가 있으면 똑같이 나눠 가운데가 돼요.",
    },
    {
      k: "absolute · 부모를 기준으로 붙이기",
      q: "<code>.badge</code> 를 <b><code>.card</code> 의 오른쪽 위</b>에 붙이세요. 화면 구석이 아니라 카드 구석입니다.",
      src: "<style>\n  .card { width: 200px; margin-left: 40px; height: 80px; background: #eef; }\n  .badge { position: absolute; top: 0; right: 0; background: #f66; color: #fff; }\n</style>\n<div class=\"card\">카드<span class=\"badge\">새</span></div>",
      sol: "<style>\n  .card { position: relative; width: 200px; margin-left: 40px; height: 80px; background: #eef; }\n  .badge { position: absolute; top: 0; right: 0; background: #f66; color: #fff; }\n</style>\n<div class=\"card\">카드<span class=\"badge\">새</span></div>",
      tests: [
        { d: "배지의 오른쪽이 카드의 오른쪽과 맞는다", js: "Math.abs(RECT('.badge').right - RECT('.card').right) < 2" },
        { d: "배지의 위쪽이 카드의 위쪽과 맞는다", js: "Math.abs(RECT('.badge').top - RECT('.card').top) < 2" },
        { d: "카드가 기준이 되어 있다", js: "CS('.card','position')==='relative'" },
      ],
      ex: "absolute 인 요소는 위로 올라가며 position 이 지정된 조상을 찾습니다. 없으면 페이지 전체가 기준이 되어 화면 구석에 붙어요. 부모에 relative 를 주면 그 부모가 기준이 됩니다.",
    },
  ],
},
/* ── Flex와 Grid 선택 기준 ────────────────────────────────── */
{
  unit: "CSS 레이아웃 심화: Flex와 Grid 선택 기준",
  lesson: "직접 만들어 보기 — 줄로 늘어놓기와 판으로 나누기",
  th: {
    sum: "**한 방향으로 늘어놓으면 Flex**, **가로세로 판으로 나누면 Grid** 다.",
    body: [
      { h: "Flex 는 한 줄을 다룬다", t: "가로든 세로든 한 방향으로 늘어놓고 남는 자리를 어떻게 나눌지 정한다. 메뉴 막대나 버튼 묶음처럼 '한 줄' 인 것에 맞는다. `gap` 으로 사이 간격을 주면 여백을 일일이 계산할 필요가 없다." },
      { h: "남는 자리를 나누는 방법", t: "`justify-content: space-between` 은 남는 자리를 항목 **사이**에만 나눠 준다. 그래서 첫 항목은 왼쪽 끝, 마지막 항목은 오른쪽 끝에 붙는다. 양 끝에도 여백을 두고 싶으면 `space-around` 나 `space-evenly` 다." },
      { h: "Grid 는 판을 먼저 그린다", t: "`grid-template-columns: repeat(3, 1fr)` 은 가로를 세 칸으로 똑같이 나눈다. 칸을 먼저 정해 두고 그 안에 넣는 방식이라, 카드 목록이나 표 같은 화면에 맞는다." },
      { h: "억지로 하나만 쓰지 않는다", t: "한 줄짜리를 Grid 로 만들면 칸 정의가 길어지고, 판을 Flex 로 만들면 줄바꿈과 폭 계산을 손으로 맞춰야 한다. 바깥은 Grid, 각 칸 안은 Flex 처럼 섞어 쓰는 것이 보통이다." },
    ],
    code: { c: ".row { display: flex; gap: 10px; justify-content: space-between; }\n.grid { display: grid; grid-template-columns: repeat(3, 1fr); }", cap: "한 줄이면 Flex, 판이면 Grid" },
    key: ["한 방향은 Flex", "`space-between` 은 사이에만", "판은 Grid 로 먼저 그린다"],
  },
  q: [
    {
      k: "flex · 가로로 늘어놓고 사이 띄우기",
      q: "<code>.row</code> 안의 항목을 <b>가로로</b> 늘어놓고 사이를 <b>10px</b> 띄우세요.",
      src: "<style>\n  .row { }\n  .row > div { background: #eef; padding: 6px; }\n</style>\n<div class=\"row\"><div>가</div><div>나</div><div>다</div></div>",
      sol: "<style>\n  .row { display: flex; gap: 10px; }\n  .row > div { background: #eef; padding: 6px; }\n</style>\n<div class=\"row\"><div>가</div><div>나</div><div>다</div></div>",
      tests: [
        { d: "flex 로 되어 있다", js: "CS('.row','display')==='flex'" },
        { d: "사이 간격이 10px 이다", js: "CS('.row','column-gap')==='10px'" },
        { d: "항목들이 같은 줄에 있다", js: "Math.abs(RECT('.row > div:nth-child(1)').top - RECT('.row > div:nth-child(3)').top) < 2" },
      ],
      ex: "div 는 기본이 블록이라 위아래로 쌓입니다. 부모에 display: flex 를 주면 자식들이 한 줄로 늘어서요. gap 을 쓰면 항목마다 여백을 따로 주지 않아도 됩니다.",
    },
    {
      k: "space-between · 양 끝에 붙이기",
      q: "첫 항목은 <b>왼쪽 끝</b>, 마지막 항목은 <b>오른쪽 끝</b>에 붙고 남는 자리는 사이에 나뉘게 하세요.",
      src: "<style>\n  .bar { display: flex; justify-content: flex-start; width: 300px; background: #eef; }\n  .bar > div { padding: 6px; }\n</style>\n<div class=\"bar\"><div>왼</div><div>가운데</div><div>오른</div></div>",
      sol: "<style>\n  .bar { display: flex; justify-content: space-between; width: 300px; background: #eef; }\n  .bar > div { padding: 6px; }\n</style>\n<div class=\"bar\"><div>왼</div><div>가운데</div><div>오른</div></div>",
      tests: [
        { d: "첫 항목이 왼쪽 끝에 붙는다", js: "Math.abs(RECT('.bar > div:nth-child(1)').left - RECT('.bar').left) < 2" },
        { d: "마지막 항목이 오른쪽 끝에 붙는다", js: "Math.abs(RECT('.bar > div:nth-child(3)').right - RECT('.bar').right) < 2" },
        { d: "가운데 항목이 사이에 있다", js: "RECT('.bar > div:nth-child(2)').left > RECT('.bar > div:nth-child(1)').right" },
      ],
      ex: "flex-start 는 항목을 전부 왼쪽에 몰아 두고 남는 자리를 오른쪽에 남깁니다. space-between 은 그 남는 자리를 항목 사이에만 나눠 줘서, 양 끝이 자연스럽게 붙어요.",
    },
    {
      k: "grid · 세 칸으로 나누기",
      q: "<code>.grid</code> 를 <b>같은 폭 세 칸</b>으로 나누세요.",
      src: "<style>\n  .grid { display: grid; grid-template-columns: repeat(2, 1fr); width: 300px; }\n  .grid > div { background: #eef; }\n</style>\n<div class=\"grid\"><div>1</div><div>2</div><div>3</div></div>",
      sol: "<style>\n  .grid { display: grid; grid-template-columns: repeat(3, 1fr); width: 300px; }\n  .grid > div { background: #eef; }\n</style>\n<div class=\"grid\"><div>1</div><div>2</div><div>3</div></div>",
      tests: [
        { d: "칸이 세 개다", js: "CS('.grid','grid-template-columns').split(/\\s+/).length===3" },
        { d: "세 항목이 한 줄에 있다", js: "Math.abs(RECT('.grid > div:nth-child(1)').top - RECT('.grid > div:nth-child(3)').top) < 2" },
        { d: "칸 폭이 같다", js: "Math.abs(W('.grid > div:nth-child(1)') - W('.grid > div:nth-child(3)')) < 2" },
      ],
      ex: "칸을 두 개로 정해 두면 세 번째 항목은 다음 줄로 내려갑니다. 항목 수가 아니라 칸 수가 줄바꿈을 정해요 — 판을 먼저 그린다는 것이 이 뜻입니다.",
    },
  ],
},
/* ── 반응형 심화 ──────────────────────────────────────────── */
{
  unit: "반응형 심화: 모바일 우선과 미디어쿼리 설계",
  lesson: "직접 만들어 보기 — 작은 화면을 먼저",
  th: {
    sum: "기본은 **작은 화면**으로 쓰고, 넓어질 때만 규칙을 더한다. 이것이 모바일 우선이다.",
    body: [
      { h: "왜 작은 화면이 기본인가", t: "작은 화면은 대개 한 줄로 늘어놓는 단순한 모양이다. 그것을 기본으로 두면 규칙이 짧아지고, 넓어질 때만 덧붙이면 된다. 반대로 하면 작은 화면용 규칙에서 앞의 것을 하나하나 되돌려야 한다." },
      { h: "min-width 로 더한다", t: "`@media (min-width: 600px)` 는 '600px 이상일 때만' 이라는 뜻이다. 그보다 좁은 화면에서는 이 안의 규칙이 아예 적용되지 않는다. 규칙이 더해지기만 하므로 되돌릴 일이 없다." },
      { h: "고정 폭은 넘친다", t: "`width: 600px` 짜리 요소는 화면이 400px 이어도 600px 을 차지해 가로 스크롤이 생긴다. `max-width: 100%` 를 주면 화면보다 커지지 않는다. 이미지에서 특히 자주 겪는다." },
      { h: "숨기는 것도 기본을 정한다", t: "넓은 화면에서만 보여 줄 것은 기본에서 숨기고, 미디어쿼리 안에서 보이게 한다. 반대로 하면 작은 화면에서 잠깐 보였다 사라지는 깜빡임이 생긴다." },
    ],
    code: { c: ".grid { grid-template-columns: 1fr; }      /* 기본: 한 칸 */\n\n@media (min-width: 600px) {\n  .grid { grid-template-columns: 1fr 1fr; }  /* 넓을 때만 두 칸 */\n}", cap: "기본은 좁게, 넓어지면 더한다" },
    key: ["기본은 작은 화면", "`min-width` 로 더한다", "고정 폭은 넘친다"],
  },
  q: [
    {
      k: "모바일 우선 · 좁을 때는 한 칸",
      q: "<b>좁은 화면에서는 한 칸</b>, 600px 이상에서만 두 칸이 되게 하세요. 지금 화면은 400px 입니다.",
      src: "<style>\n  .grid { display: grid; grid-template-columns: 1fr 1fr; }\n  .grid > div { background: #eef; }\n</style>\n<div class=\"grid\"><div>1</div><div>2</div></div>",
      sol: "<style>\n  .grid { display: grid; grid-template-columns: 1fr; }\n  .grid > div { background: #eef; }\n  @media (min-width: 600px) {\n    .grid { grid-template-columns: 1fr 1fr; }\n  }\n</style>\n<div class=\"grid\"><div>1</div><div>2</div></div>",
      tests: [
        { d: "좁은 화면에서는 칸이 하나다", js: "CS('.grid','grid-template-columns').split(/\\s+/).length===1" },
        { d: "두 항목이 위아래로 쌓인다", js: "RECT('.grid > div:nth-child(2)').top > RECT('.grid > div:nth-child(1)').top" },
        { d: "넓을 때 규칙을 따로 두었다", js: "/min-width/.test(SRCCSS())" },
      ],
      ex: "기본을 두 칸으로 두면 좁은 화면에서도 두 칸이라 글자가 눌립니다. 기본을 한 칸으로 두고 넓을 때만 더하면, 좁은 화면은 아무것도 안 해도 알아서 잘 보여요.",
    },
    {
      k: "max-width · 화면보다 커지지 않게",
      q: "<code>.thumb</code> 이 화면보다 <b>넓어지지 않게</b> 하세요. 원래 폭은 600px 이고 화면은 400px 입니다.",
      src: "<style>\n  body { margin: 0; }\n  .thumb { width: 600px; height: 40px; background: #eef; }\n</style>\n<div class=\"thumb\">썸네일</div>",
      sol: "<style>\n  body { margin: 0; }\n  .thumb { width: 600px; max-width: 100%; height: 40px; background: #eef; }\n</style>\n<div class=\"thumb\">썸네일</div>",
      tests: [
        { d: "화면 폭을 넘지 않는다", js: "W('.thumb') <= 400" },
        { d: "높이는 그대로 40px", js: "H('.thumb')===40" },
      ],
      ex: "고정 폭은 화면이 좁아져도 그대로 버팁니다. 그래서 가로 스크롤이 생기고 화면이 옆으로 밀려요. max-width: 100% 는 '부모보다는 커지지 마라' 는 뜻입니다.",
    },
    {
      k: "숨기기 · 좁을 때는 감추기",
      q: "<code>.wide-only</code> 를 <b>좁은 화면에서는 숨기고</b> 600px 이상에서만 보이게 하세요.",
      src: "<style>\n  .wide-only { display: block; }\n</style>\n<div class=\"wide-only\">넓은 화면 전용</div>",
      sol: "<style>\n  .wide-only { display: none; }\n  @media (min-width: 600px) {\n    .wide-only { display: block; }\n  }\n</style>\n<div class=\"wide-only\">넓은 화면 전용</div>",
      tests: [
        { d: "좁은 화면에서는 안 보인다", js: "CS('.wide-only','display')==='none'" },
        { d: "넓을 때 보이게 하는 규칙이 있다", js: "/min-width/.test(SRCCSS())" },
      ],
      ex: "기본을 보이게 두고 좁을 때 숨기면, 화면을 그리는 동안 잠깐 보였다 사라지는 깜빡임이 생깁니다. 기본을 숨김으로 두면 그럴 일이 없어요.",
    },
  ],
},
/* ── 웹 접근성 심화 ───────────────────────────────────────── */
{
  unit: "웹 접근성 심화: 시맨틱·ARIA·키보드·대비",
  lesson: "직접 만들어 보기 — 눈으로만 쓰지 않는 화면",
  th: {
    sum: "화면은 눈으로만 쓰는 것이 아니다. **키보드와 읽어 주는 프로그램**으로도 쓸 수 있어야 한다.",
    body: [
      { h: "태그가 곧 설명이다", t: "`<div>` 는 아무 뜻이 없다. `<nav>`·`<main>`·`<button>` 을 쓰면 읽어 주는 프로그램이 '탐색', '본문', '버튼' 이라고 말해 준다. 같은 화면인데 쓸 수 있는 사람이 달라진다." },
      { h: "이미지에는 대체 글을 단다", t: "`alt` 는 이미지를 못 볼 때 대신 읽어 줄 글이다. 없으면 파일 이름을 읽거나 그냥 '이미지' 라고만 한다. 장식용이라 읽을 필요가 없다면 `alt=\"\"` 로 **비워 두는 것**이 정답이다." },
      { h: "입력칸에는 이름표를 연결한다", t: "`<label for=\"email\">` 과 `<input id=\"email\">` 을 이어 두면 무엇을 적는 칸인지 읽어 준다. 이름표를 눌렀을 때 커서가 칸으로 가는 것도 이 연결 덕이다." },
      { h: "누를 것은 button 으로", t: "`<div onclick>` 은 키보드 탭으로 갈 수 없다. `<button>` 은 탭 이동·엔터 입력·버튼이라는 안내가 전부 딸려 온다. 흉내 내려면 여러 속성을 직접 붙여야 하고, 하나만 빠져도 못 쓰게 된다." },
    ],
    code: { c: "<main>\n  <img src=\"cat.png\" alt=\"고양이가 자는 모습\">\n  <label for=\"email\">이메일</label>\n  <input id=\"email\">\n  <button aria-expanded=\"false\">메뉴</button>\n</main>", cap: "태그가 곧 설명이다" },
    key: ["의미 있는 태그를 쓴다", "이미지에는 `alt`", "누를 것은 `<button>`"],
  },
  q: [
    {
      k: "시맨틱 · 본문과 대체 글",
      q: "본문을 <code>&lt;main&gt;</code> 으로 감싸고, 이미지에 <b>대체 글</b>을 달아 주세요.",
      src: "<div class=\"body\">\n  <img src=\"cat.png\">\n  <p>고양이 사진</p>\n</div>",
      sol: "<main>\n  <img src=\"cat.png\" alt=\"고양이가 자는 모습\">\n  <p>고양이 사진</p>\n</main>",
      tests: [
        { d: "main 이 하나 있다", js: "COUNT('main')===1" },
        { d: "이미지에 alt 가 있다", js: "typeof ATTR('img','alt')==='string'" },
        { d: "alt 가 비어 있지 않다", js: "ATTR('img','alt').length>0" },
      ],
      ex: "div 로 감싸면 기계는 그것이 본문인지 광고인지 알 수 없습니다. main 을 쓰면 '본문으로 건너뛰기' 가 동작해요. alt 가 없으면 파일 이름을 읽거나 그냥 '이미지' 라고만 합니다.",
    },
    {
      k: "label · 입력칸에 이름 붙이기",
      q: "이름표와 입력칸을 <b>연결</b>하세요. <code>label</code> 의 <code>for</code> 가 입력칸의 <code>id</code> 와 같아야 합니다.",
      src: "<label>이메일</label>\n<input id=\"email\" type=\"email\">",
      sol: "<label for=\"email\">이메일</label>\n<input id=\"email\" type=\"email\">",
      tests: [
        { d: "이름표가 입력칸을 가리킨다", js: "ATTR('label','for')==='email'" },
        { d: "입력칸이 있다", js: "COUNT('#email')===1" },
      ],
      ex: "연결하지 않으면 읽어 주는 프로그램이 그냥 '입력' 이라고만 말합니다. 무엇을 적어야 할지 알 수 없어요. 연결해 두면 이름표를 눌러도 커서가 칸으로 갑니다.",
    },
    {
      k: "button · 키보드로도 갈 수 있게",
      q: "누르는 요소를 <code>&lt;button&gt;</code> 으로 바꾸고, 열림·닫힘을 <code>aria-expanded</code> 로 적어 주세요. 처음은 닫힘입니다.",
      src: "<div class=\"toggle\">메뉴</div>",
      sol: "<button class=\"toggle\" aria-expanded=\"false\">메뉴</button>",
      tests: [
        { d: "버튼 요소다", js: "Q('.toggle').tagName==='BUTTON'" },
        { d: "닫힘이라고 적혀 있다", js: "ATTR('.toggle','aria-expanded')==='false'" },
      ],
      ex: "div 는 키보드 탭으로 갈 수 없고 엔터로 눌리지도 않습니다. button 은 그 모두가 그냥 따라와요. 그리고 열림 상태를 색으로만 보여 주면 화면을 못 보는 사람에게는 아무 정보가 없습니다.",
    },
  ],
},
/* ── 렌더링 성능 심화 ─────────────────────────────────────── */
{
  unit: "렌더링 성능 심화: reflow·repaint와 크리티컬 CSS",
  lesson: "직접 만들어 보기 — 다시 그리는 일을 줄이기",
  th: {
    sum: "브라우저는 **자리 계산(reflow)** 과 **칠하기(repaint)** 를 한다. 자리 계산이 훨씬 비싸다.",
    body: [
      { h: "자리를 바꾸면 다 다시 잰다", t: "`width`·`left`·`margin` 처럼 크기와 위치를 건드리면, 그 요소뿐 아니라 주변까지 자리를 다시 계산한다. 애니메이션에서 이걸 매 프레임 하면 화면이 툭툭 끊긴다." },
      { h: "transform 은 자리를 안 건드린다", t: "`transform: translateX(20px)` 은 이미 계산된 결과를 옮겨 그리기만 한다. 자리 계산이 다시 일어나지 않아 훨씬 싸다. 움직이는 것은 되도록 `transform` 과 `opacity` 로 만든다." },
      { h: "이미지 자리를 미리 잡는다", t: "크기를 안 정해 둔 이미지는 늦게 도착하면서 갑자기 자리를 밀어낸다. 읽던 글이 아래로 밀리는 그 현상이다. `aspect-ratio` 나 `width`·`height` 를 미리 적어 두면 빈자리를 잡아 둔다." },
      { h: "먼저 보이는 것만 먼저 싣는다", t: "첫 화면에 필요한 스타일만 먼저 보내고 나머지는 나중에 받으면, 사용자는 훨씬 빨리 무언가를 본다. 스타일이 다 올 때까지 브라우저는 아무것도 그리지 않기 때문이다." },
    ],
    code: { c: ".box { transform: translateX(20px); }   /* 자리 계산이 없다 */\n\nimg { width: 100%; aspect-ratio: 16 / 9; }  /* 빈자리를 미리 */", cap: "자리 계산을 피한다" },
    key: ["자리 계산이 제일 비싸다", "움직임은 `transform` 으로", "이미지 자리를 미리 잡는다"],
  },
  q: [
    {
      k: "transform · 자리 계산 없이 옮기기",
      q: "<code>.box</code> 를 오른쪽으로 <b>20px</b> 옮기되, <b>자리 계산이 다시 일어나지 않는</b> 방법으로 하세요.",
      src: "<style>\n  body { margin: 0; }\n  .box { position: relative; left: 20px; width: 100px; height: 40px; background: #eef; }\n</style>\n<div class=\"box\">상자</div>",
      sol: "<style>\n  body { margin: 0; }\n  .box { transform: translateX(20px); width: 100px; height: 40px; background: #eef; }\n</style>\n<div class=\"box\">상자</div>",
      tests: [
        { d: "transform 으로 옮겼다", js: "CS('.box','transform')!=='none'" },
        /* 화면 좌표로 재지 않는다. 하네스 문서에 자체 여백이 있어서 왼쪽 좌표가 20 이
             아니다 — 문항이 묻는 것은 '얼마나 옮겼는가' 이지 '어디에 있는가' 가 아니다. */
        { d: "오른쪽으로 20px 옮겼다", js: "CS('.box','transform')==='matrix(1, 0, 0, 1, 20, 0)'" },
        { d: "크기는 그대로", js: "W('.box')===100" },
      ],
      ex: "left 를 건드리면 그 요소와 주변의 자리를 다시 계산합니다. transform 은 이미 계산된 결과를 옮겨 그리기만 해서 훨씬 싸요. 움직이는 것은 되도록 이쪽으로 만듭니다.",
    },
    {
      k: "aspect-ratio · 이미지 자리 미리 잡기",
      q: "<code>.ph</code> 가 <b>16:9 비율</b>로 자리를 미리 잡게 하세요. 폭은 화면에 맞춥니다.",
      src: "<style>\n  body { margin: 0; }\n  .ph { width: 100%; background: #eef; }\n</style>\n<div class=\"ph\"></div>",
      sol: "<style>\n  body { margin: 0; }\n  .ph { width: 100%; aspect-ratio: 16 / 9; background: #eef; }\n</style>\n<div class=\"ph\"></div>",
      tests: [
        { d: "비율이 지정되어 있다", js: "CS('.ph','aspect-ratio')!=='auto'" },
        { d: "높이가 폭의 9/16 이다", js: "Math.abs(H('.ph') - W('.ph')*9/16) < 3" },
        { d: "폭은 화면에 맞는다", js: "W('.ph') <= 400" },
      ],
      ex: "높이를 안 정해 두면 이미지가 도착하는 순간 갑자기 자리를 밀어냅니다. 읽던 글이 아래로 밀리는 그 현상이에요. 비율을 적어 두면 빈자리를 미리 잡아 둡니다.",
    },
    {
      k: "will-change 대신 · 바뀔 것만 알리기",
      q: "<code>.card</code> 가 <b>바깥에 영향을 주지 않도록</b> 격리하세요. <code>contain</code> 을 <code>content</code> 로 지정합니다.",
      src: "<style>\n  .card { width: 200px; height: 60px; background: #eef; }\n</style>\n<div class=\"card\">카드</div>",
      sol: "<style>\n  .card { contain: content; width: 200px; height: 60px; background: #eef; }\n</style>\n<div class=\"card\">카드</div>",
      tests: [
        { d: "격리가 지정되어 있다", js: "CS('.card','contain')==='content'" },
        { d: "크기는 그대로", js: "W('.card')===200 && H('.card')===60" },
      ],
      ex: "contain 은 '이 안의 변화는 밖에 영향이 없다' 고 브라우저에 알려 주는 것입니다. 그러면 안쪽이 바뀌어도 페이지 전체를 다시 계산하지 않아, 목록이 긴 화면에서 특히 효과가 큽니다.",
    },
  ],
},
/* ── 셀렉터 심화 ──────────────────────────────────────────── */
{
  unit: "셀렉터 심화: 특이도·캐스케이드·상속",
  lesson: "직접 만들어 보기 — 어느 규칙이 이기는가",
  th: {
    sum: "같은 요소에 규칙이 여럿 걸리면 **더 구체적인 것**이 이긴다. 같으면 **나중에 쓴 것**이 이긴다.",
    body: [
      { h: "구체적일수록 세다", t: "id 로 고른 것이 클래스로 고른 것보다 세고, 클래스가 태그 이름보다 세다. 그래서 `.btn { color: blue }` 를 나중에 써도 `#save { color: red }` 를 이기지 못한다. '분명 아래에 썼는데 왜 안 먹지' 의 대부분이 이것이다." },
      { h: "같은 세기면 나중이 이긴다", t: "세기가 같을 때만 순서가 의미를 갖는다. 같은 클래스 규칙을 두 번 쓰면 아래 것이 적용된다. 그래서 덮어쓰려면 세기를 맞추거나 더 세게 만들어야 한다." },
      { h: "상속되는 것과 아닌 것", t: "글자 색이나 글꼴은 부모에서 자식으로 이어진다. 하지만 테두리·여백·배경은 이어지지 않는다. '부모에 줬는데 왜 자식엔 안 나오지' 는 그 속성이 상속되지 않는 것이어서다." },
      { h: "!important 는 마지막 수단", t: "모든 세기를 무시하고 이겨 버린다. 한 번 쓰면 그것을 덮으려고 또 쓰게 되어, 결국 아무도 규칙을 예측할 수 없게 된다. 세기를 조정해 푸는 편이 거의 항상 낫다." },
    ],
    code: { c: "#save { color: red; }     /* 이긴다 */\n.btn  { color: blue; }    /* 나중에 써도 진다 */\n\n#save.btn { color: green; }   /* 더 구체적이라 이긴다 */", cap: "구체적인 것이 이긴다" },
    key: ["id > 클래스 > 태그", "같은 세기면 나중이 이긴다", "여백·테두리는 상속되지 않는다"],
  },
  q: [
    {
      k: "특이도 · 더 구체적으로 만들어 이기기",
      q: "<code>#save</code> 버튼의 글자색이 <b>초록</b>이 되게 하세요. <code>#save</code> 규칙은 <b>고치지 말고</b>, 더 구체적인 규칙을 더하세요.",
      src: "<style>\n  #save { color: red; }\n  .btn { color: green; }\n</style>\n<button id=\"save\" class=\"btn\">저장</button>",
      sol: "<style>\n  #save { color: red; }\n  .btn { color: green; }\n  #save.btn { color: green; }\n</style>\n<button id=\"save\" class=\"btn\">저장</button>",
      tests: [
        { d: "글자색이 초록이다", js: "CS('#save','color')==='rgb(0, 128, 0)'" },
        { d: "#save 규칙은 그대로 두었다", js: "/#save\\s*\\{[^}]*red/.test(SRCCSS())" },
      ],
      ex: ".btn 을 아래에 써도 id 로 고른 규칙을 이기지 못합니다. 순서는 세기가 같을 때만 의미가 있어요. id 와 클래스를 함께 적으면 더 구체적이 되어 이깁니다.",
    },
    {
      k: "캐스케이드 · 같은 세기면 나중이 이긴다",
      q: "<code>.msg</code> 의 글자색이 <b>파랑</b>이 되게 하세요. 두 규칙의 <b>순서만</b> 바꿉니다.",
      src: "<style>\n  .msg { color: blue; }\n  .msg { color: red; }\n</style>\n<p class=\"msg\">알림</p>",
      sol: "<style>\n  .msg { color: red; }\n  .msg { color: blue; }\n</style>\n<p class=\"msg\">알림</p>",
      tests: [
        { d: "글자색이 파랑이다", js: "CS('.msg','color')==='rgb(0, 0, 255)'" },
        { d: "!important 를 쓰지 않았다", js: "!/!important/.test(SRCCSS())" },
      ],
      ex: "세기가 같으면 나중에 쓴 것이 이깁니다. 그래서 덮어쓰려는 규칙은 아래에 두어야 해요. 여기서 !important 를 쓰면 당장은 되지만, 다음에 덮으려면 또 써야 합니다.",
    },
    {
      k: "상속 · 자식에게 이어지는 것",
      q: "<code>.card</code> 안의 글자가 모두 <b>회색</b>이 되게 하세요. 자식마다 적지 말고 <b>부모에 한 번만</b> 적습니다.",
      src: "<style>\n  .card { border: 1px solid #999; }\n</style>\n<div class=\"card\"><p class=\"a\">가</p><p class=\"b\">나</p></div>",
      sol: "<style>\n  .card { border: 1px solid #999; color: #808080; }\n</style>\n<div class=\"card\"><p class=\"a\">가</p><p class=\"b\">나</p></div>",
      tests: [
        { d: "첫 자식이 회색이다", js: "CS('.a','color')==='rgb(128, 128, 128)'" },
        { d: "둘째 자식도 회색이다", js: "CS('.b','color')==='rgb(128, 128, 128)'" },
        { d: "자식에는 색을 적지 않았다", js: "!/\\.a\\s*\\{[^}]*color/.test(SRCCSS()) && !/\\.b\\s*\\{[^}]*color/.test(SRCCSS())" },
      ],
      ex: "글자 색은 부모에서 자식으로 이어집니다. 그래서 부모에 한 번만 적으면 돼요. 반대로 테두리는 이어지지 않아서, 부모에 줘도 자식에는 생기지 않습니다.",
    },
  ],
},
];
