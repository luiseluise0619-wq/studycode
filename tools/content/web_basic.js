/* HTML·CSS 기초 유닛 실습.
   'HTML 기초' 14문항, 'CSS 기초' 9문항 — 둘 다 실습 0이다. 마크업을 한 줄도 안 쓴다.

   채점은 브라우저가 실제로 그린 결과를 본다(t:"html").
   TXT/CS/RECT/COUNT 같은 도우미로 진짜 DOM 과 계산된 스타일을 확인하므로,
   '글자만 맞춘' 답은 통과하지 못한다. */
module.exports = [
{
  unit: "HTML 기초",
  lesson: "직접 만들어 보기 — 뼈대 세우기",
  th: {
    sum: "HTML 은 꾸미는 것이 아니라 **무엇인지 말하는 것**이다. 제목은 제목 태그로, 목록은 목록 태그로 적는다.",
    body: [
      { h: "글자가 아니라 의미", t: "굵게 보이길 원해서 `<div>` 에 큰 글씨를 주면 화면은 비슷해도 기계는 그것이 제목인 줄 모른다. 검색 엔진도, 화면 낭독기도 태그를 보고 판단한다. `<h1>` 은 페이지에 하나만 두고 `<h2>` 로 내려간다." },
      { h: "목록과 링크", t: "나열되는 것은 `<ul><li>` 로 적는다. `<li>` 는 반드시 `<ul>` 이나 `<ol>` 안에 있어야 한다. 링크는 `<a href=\"주소\">글자</a>` 이고, `href` 가 없으면 링크로 취급되지 않는다." },
    ],
    code: { c: "<h1>제목</h1>\n<ul>\n  <li>첫째</li>\n  <li>둘째</li>\n</ul>\n<a href=\"/about\">소개</a>", cap: "무엇인지를 태그로 말한다" },
    key: ["`<h1>` 은 페이지에 하나", "`<li>` 는 `<ul>`·`<ol>` 안에만", "링크에는 `href` 가 필요하다"],
  },
  q: [
    {
      k: "제목과 목록 만들기",
      q: "<code>메뉴</code> 를 <b>1단계 제목</b>으로 두고, 그 아래 <b>순서 없는 목록</b>에 <code>커피</code>·<code>차</code> 두 항목을 넣으세요.",
      src: "<div class=\"title\">메뉴</div>\n<div>커피</div>\n<div>차</div>",
      sol: "<h1>메뉴</h1>\n<ul>\n  <li>커피</li>\n  <li>차</li>\n</ul>",
      tests: [
        { d: "h1 이 하나 있고 글자가 '메뉴' 다", js: "COUNT('h1')===1 && TXT('h1')==='메뉴'" },
        { d: "ul 이 있다", js: "COUNT('ul')===1" },
        { d: "ul 안에 li 가 두 개다", js: "COUNT('ul > li')===2" },
        { d: "항목 글자가 커피·차 다", js: "QA('ul > li').map(function(e){return e.textContent.trim();}).join(',')==='커피,차'" },
      ],
      ex: "div 로 만들면 화면은 비슷해도 기계는 제목인지 목록인지 알 수 없습니다. 제목은 h1, 나열은 ul > li 로 적어야 해요.",
    },
    {
      k: "링크 만들기",
      q: "<code>소개</code> 라는 글자를 <code>/about</code> 으로 가는 <b>링크</b>로 만드세요.",
      src: "<span class=\"link\">소개</span>",
      sol: "<a href=\"/about\">소개</a>",
      tests: [
        { d: "a 태그가 있다", js: "COUNT('a')===1" },
        { d: "글자가 '소개' 다", js: "TXT('a')==='소개'" },
        { d: "href 가 /about 이다", js: "ATTR('a','href')==='/about'" },
      ],
      ex: "파란 글씨로 보이게 만들어도 링크가 아닙니다. a 태그와 href 가 있어야 눌러서 이동하고, 화면 낭독기도 링크로 읽어요.",
    },
  ],
},
{
  unit: "CSS 기초",
  lesson: "직접 만들어 보기 — 크기와 여백",
  th: {
    sum: "CSS 에서 가장 많이 틀리는 것은 '내가 정한 너비' 와 '실제로 차지하는 너비' 가 다르다는 점이다.",
    body: [
      { h: "박스 계산 방식", t: "기본값 `content-box` 에서 `width: 200px` 에 `padding: 20px` 을 주면 실제 폭은 240px 이 된다. 안쪽 여백과 테두리가 바깥에 더해지기 때문이다. `box-sizing: border-box` 로 바꾸면 padding·border 를 **포함해** 200px 이 된다 — 실무에서는 거의 항상 이쪽을 쓴다." },
      { h: "margin 과 padding", t: "`padding` 은 테두리 **안쪽** 여백이라 배경색이 칠해진다. `margin` 은 테두리 **바깥** 여백이라 칠해지지 않는다. 배경이 어디까지 보이는지로 둘을 구별할 수 있다." },
    ],
    code: { c: ".box {\n  box-sizing: border-box;\n  width: 200px;\n  padding: 20px;   /* 폭은 여전히 200px */\n}", cap: "border-box 는 여백을 폭 안에 넣는다" },
    key: ["기본은 `content-box` — padding 이 폭에 더해진다", "`border-box` 는 폭 안에 포함한다", "`padding` 은 안쪽, `margin` 은 바깥"],
  },
  q: [
    {
      k: "폭을 200px 로 지키기",
      q: "<code>.box</code> 의 <b>화면에서 실제 폭</b>이 정확히 200px 이 되게 하세요. 안쪽 여백 20px 은 그대로 두어야 합니다.",
      src: "<style>\n  .box { width: 200px; padding: 20px; background: #cde; }\n</style>\n<div class=\"box\">내용</div>",
      sol: "<style>\n  .box { box-sizing: border-box; width: 200px; padding: 20px; background: #cde; }\n</style>\n<div class=\"box\">내용</div>",
      tests: [
        { d: "실제 폭이 200px 이다", js: "Math.abs(RECT('.box').width-200)<1" },
        { d: "안쪽 여백 20px 이 남아 있다", js: "CS('.box','padding-left')==='20px'" },
      ],
      ex: "기본 계산 방식에서는 padding 이 폭에 더해져 240px 이 됩니다. box-sizing: border-box 로 바꾸면 여백을 폭 안에 넣어요.",
    },
    {
      k: "가로 가운데 정렬",
      q: "<code>.card</code> 를 <code>.wrap</code> 안에서 <b>가로 가운데</b>에 놓으세요. 카드 폭 100px 은 유지합니다.",
      src: "<style>\n  .wrap { width: 300px; background: #eee; }\n  .card { width: 100px; height: 40px; background: #47f; }\n</style>\n<div class=\"wrap\"><div class=\"card\"></div></div>",
      sol: "<style>\n  .wrap { width: 300px; background: #eee; }\n  .card { width: 100px; height: 40px; background: #47f; margin-left: auto; margin-right: auto; }\n</style>\n<div class=\"wrap\"><div class=\"card\"></div></div>",
      tests: [
        { d: "카드 폭이 100px 이다", js: "Math.abs(RECT('.card').width-100)<1" },
        { d: "카드 중심이 wrap 중심과 맞는다", js: "Math.abs((RECT('.card').left+RECT('.card').right)/2-(RECT('.wrap').left+RECT('.wrap').right)/2)<3" },
      ],
      ex: "text-align: center 는 글자를 가운데로 보낼 뿐 블록 요소는 움직이지 않습니다. 폭이 정해진 블록은 좌우 margin 을 auto 로 주거나 flex 로 정렬해야 해요.",
    },
  ],
},
{
  unit: "폼과 입력",
  lesson: "직접 만들어 보기 — 입력을 이름표와 잇기",
  th: {
    sum: "입력칸에는 반드시 이름표가 붙어야 한다. 붙어 있지 않으면 화면 낭독기 사용자는 무엇을 넣는 칸인지 알 수 없다.",
    body: [
      { h: "label 과 input 잇기", t: "`<label for=\"이메일\">` 의 `for` 와 `<input id=\"이메일\">` 의 `id` 가 같아야 이어진다. 이어지면 이름표를 눌러도 입력칸에 커서가 간다 — 눌러서 커서가 가는지로 확인할 수 있다." },
      { h: "type 이 하는 일", t: "`type=\"email\"` 은 모바일에서 @ 가 있는 자판을 띄우고, 제출할 때 형식을 검사한다. `type=\"submit\"` 인 버튼이 있어야 폼이 제출된다. 다만 브라우저 검사는 편의일 뿐이고 **서버 검증을 대신할 수 없다.**" },
    ],
    code: { c: "<label for=\"email\">이메일</label>\n<input id=\"email\" type=\"email\" name=\"email\">\n<button type=\"submit\">보내기</button>", cap: "for 와 id 가 같아야 이어진다" },
    key: ["`label[for]` 와 `input[id]` 를 맞춘다", "`type` 은 자판과 검사를 바꾼다", "브라우저 검사는 서버 검증을 대신하지 못한다"],
  },
  q: [
    {
      k: "이름표 붙은 이메일 입력칸",
      q: "<code>이메일</code> 이름표와 입력칸을 만들고 <b>서로 이어</b> 주세요. 입력칸의 <code>type</code> 은 <code>email</code> 이어야 합니다.",
      src: "<div>이메일</div>\n<input type=\"text\">",
      sol: "<label for=\"email\">이메일</label>\n<input id=\"email\" type=\"email\">",
      tests: [
        { d: "label 이 있다", js: "COUNT('label')===1" },
        { d: "input 의 type 이 email 이다", js: "Q('input').type==='email'" },
        { d: "label 의 for 와 input 의 id 가 같다", js: "ATTR('label','for')===Q('input').id && !!Q('input').id" },
      ],
      ex: "글자만 위에 적어 두면 화면 낭독기는 그 둘이 한 쌍인 줄 모릅니다. for 와 id 를 맞춰야 이어져요.",
    },
    {
      k: "필수 입력과 제출 버튼",
      q: "<code>이름</code> 입력칸을 <b>필수</b>로 만들고, 폼을 <b>제출하는</b> 버튼을 두세요.",
      src: "<form>\n  <label for=\"name\">이름</label>\n  <input id=\"name\" type=\"text\">\n  <button type=\"button\">보내기</button>\n</form>",
      sol: "<form>\n  <label for=\"name\">이름</label>\n  <input id=\"name\" type=\"text\" required>\n  <button type=\"submit\">보내기</button>\n</form>",
      tests: [
        { d: "입력칸이 필수다", js: "Q('#name').required===true" },
        { d: "버튼이 제출용이다", js: "Q('button').type==='submit'" },
        { d: "비어 있으면 폼이 유효하지 않다", js: "Q('form').checkValidity()===false" },
      ],
      ex: "type=\"button\" 은 아무것도 제출하지 않습니다. 그리고 required 가 없으면 빈 값도 그대로 넘어가요.",
    },
  ],
},
{
  unit: "시맨틱 & 구조",
  lesson: "직접 만들어 보기 — 자리에 맞는 태그",
  th: {
    sum: "`div` 만으로도 화면은 만들어진다. 하지만 기계는 어디가 본문이고 어디가 머리글인지 알 수 없다.",
    body: [
      { h: "구역을 알려 주는 태그", t: "`<header>` 머리글, `<nav>` 길잡이, `<main>` 본문(페이지에 하나), `<article>` 그 자체로 완결된 글, `<footer>` 바닥글. 화면 낭독기 사용자는 이 표지를 따라 건너뛴다 — `div` 만 있으면 처음부터 끝까지 들어야 한다." },
      { h: "이미지의 대체 글", t: "`<img>` 에는 `alt` 를 적는다. 내용이 있는 이미지면 무엇이 보이는지 적고, 순전히 장식이면 `alt=\"\"` 로 **비워 둔다.** 비워 두면 낭독기가 건너뛴다 — 빼먹으면 파일 이름을 읽어 버린다." },
    ],
    code: { c: "<header><nav>…</nav></header>\n<main>\n  <article>…</article>\n</main>\n<footer>…</footer>", cap: "표지가 있어야 건너뛸 수 있다" },
    key: ["`<main>` 은 페이지에 하나", "구역은 의미에 맞는 태그로", "장식 이미지는 `alt=\"\"`"],
  },
  q: [
    {
      k: "페이지 뼈대 세우기",
      q: "머리글·본문·바닥글을 <b>알맞은 태그</b>로 바꾸세요. 글자는 그대로 두고, 본문 안에는 <code>article</code> 이 하나 있어야 합니다.",
      src: "<div class=\"header\">사이트 이름</div>\n<div class=\"main\">\n  <div class=\"post\">글 내용</div>\n</div>\n<div class=\"footer\">© 2026</div>",
      sol: "<header>사이트 이름</header>\n<main>\n  <article>글 내용</article>\n</main>\n<footer>© 2026</footer>",
      tests: [
        { d: "header 가 있다", js: "COUNT('header')===1" },
        { d: "main 이 하나다", js: "COUNT('main')===1" },
        { d: "main 안에 article 이 있다", js: "COUNT('main article')===1" },
        { d: "footer 가 있다", js: "COUNT('footer')===1" },
      ],
      ex: "class 이름은 사람만 읽습니다. 기계는 태그를 보고 구역을 판단해요 — 이름을 header 라고 지어도 div 는 div 입니다.",
    },
    {
      k: "이미지에 대체 글 달기",
      q: "내용이 있는 이미지에는 설명을 적고, <b>장식용 이미지</b>에는 대체 글을 <b>비워</b> 두세요. 두 이미지 모두 <code>alt</code> 속성 자체는 있어야 합니다.",
      src: "<img class=\"photo\" src=\"cat.png\">\n<img class=\"deco\" src=\"line.png\">",
      sol: "<img class=\"photo\" src=\"cat.png\" alt=\"창가에 앉은 고양이\">\n<img class=\"deco\" src=\"line.png\" alt=\"\">",
      tests: [
        { d: "사진에 설명이 있다", js: "(ATTR('.photo','alt')||'').length>0" },
        { d: "장식 이미지에 alt 속성이 있다", js: "Q('.deco').hasAttribute('alt')" },
        { d: "장식 이미지의 alt 는 비어 있다", js: "ATTR('.deco','alt')===''" },
      ],
      ex: "alt 를 아예 빼면 낭독기가 파일 이름을 읽습니다. 장식이면 alt=\"\" 로 비워 둬야 조용히 건너뛰어요.",
    },
  ],
},
];
