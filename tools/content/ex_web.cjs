/* web 트랙 짧은 해설 다시 쓰기 — 태그 이름은 글자로 보이도록 &lt; &gt; 로 적는다 */
module.exports = {
 "track": "web",
 "fixes": [
  {
   "k": "제목",
   "ex0": "h1 이 가장 큰 제목",
   "ex": "제목 태그는 &lt;h1&gt; 부터 &lt;h6&gt; 까지 여섯 단계이고 숫자가 작을수록 크고 중요한 제목이다. &lt;title&gt; 은 브라우저 탭에 보이는 문서 제목이라 본문에는 나타나지 않고, &lt;head&gt; 는 메타 정보를 담는 영역이며, &lt;big&gt; 은 폐기된 태그다. 한 페이지에 &lt;h1&gt; 은 하나만 두는 것이 관례다."
  },
  {
   "k": "빈칸",
   "ex0": "는 문단(paragraph)",
   "ex": "문단은 &lt;p&gt; 태그다. paragraph 의 첫 글자를 땄다. &lt;p&gt; 는 블록 요소라 앞뒤로 줄이 바뀌고 문단 사이에 여백이 생긴다. 줄만 바꾸고 싶으면 &lt;br&gt;, 의미 없이 묶기만 하려면 &lt;div&gt; 를 쓴다."
  },
  {
   "k": "개념",
   "ex0": "HTML 은 페이지의 뼈대(구조)",
   "ex": "페이지에 제목·문단·이미지·링크가 어디에 있는지, 즉 구조를 정하는 언어가 HTML 이다. CSS 는 그 구조에 색과 배치를 입히고, JS 는 동작을 붙이며, MySQL 은 서버의 데이터베이스라 브라우저 화면과는 직접 관계가 없다."
  },
  {
   "k": "태그",
   "ex0": "태그는 꺾쇠",
   "ex": "HTML 태그는 꺾쇠 &lt; &gt; 로 감싼다. &lt;p&gt;내용&lt;/p&gt; 처럼 여는 태그와 닫는 태그 사이에 내용을 넣는다. 대괄호 [ ] 는 마크다운 링크, 중괄호 { } 는 CSS 규칙과 JS 블록, 소괄호는 함수 호출에 쓰는 기호라 HTML 요소 표시에는 쓰지 않는다."
  },
  {
   "k": "닫는 태그",
   "ex0": "닫는 태그는 슬래시를 붙여",
   "ex": "닫는 태그는 이름 앞에 슬래시를 붙인 &lt;/p&gt; 다. &lt;\\p&gt; 는 역슬래시라 잘못된 표기이고, &lt;p/&gt; 는 &lt;br/&gt; 처럼 내용이 없는 빈 요소에만 쓰는 꼴이라 문단에는 맞지 않으며, &lt;close&gt; 라는 태그는 없다."
  },
  {
   "k": "이미지",
   "ex0": "로 이미지를 넣는다",
   "ex": "이미지는 &lt;img src=\"경로\" alt=\"설명\"&gt; 으로 넣는다. image 를 줄인 이름이라 &lt;image&gt; 나 &lt;photo&gt; 는 HTML 태그가 아니다. &lt;img&gt; 는 닫는 태그가 없는 빈 요소이고, alt 를 함께 적어야 이미지를 못 볼 때 설명이 대신 나온다."
  },
  {
   "k": "빈칸",
   "ex0": "src 속성에 이미지 경로",
   "ex": "&lt;img&gt; 의 이미지 파일 위치는 src(source) 속성에 적는다. href 는 링크의 목적지를 적는 &lt;a&gt; 의 속성이라 &lt;img&gt; 에는 쓰지 않는다. alt 는 이미지가 안 보일 때 대신 나올 글이고, 경로는 상대 경로든 절대 URL 이든 된다."
  },
  {
   "k": "링크",
   "ex0": "로 링크를 만든다",
   "ex": "다른 페이지로 가는 링크는 &lt;a href=\"주소\"&gt;글자&lt;/a&gt; 다. anchor 의 a 다. &lt;link&gt; 는 CSS 파일 같은 외부 자원을 문서에 연결하는 &lt;head&gt; 안의 태그라 사용자가 클릭하는 링크가 아니고, href 는 속성 이름이며, &lt;url&gt; 태그는 없다."
  },
  {
   "k": "속성",
   "ex0": "href 속성에 주소를 넣는다",
   "ex": "&lt;a&gt; 가 이동할 주소는 href 속성에 적는다. hypertext reference 의 줄임말이다. src 는 이미지나 스크립트 파일을 불러올 때 쓰는 속성이라 &lt;a&gt; 에는 없다. to 는 React Router 같은 라이브러리의 이름이고 hlink 는 존재하지 않는다."
  },
  {
   "k": "강조",
   "ex0": "로 굵게 표시",
   "ex": "굵은 글씨는 &lt;b&gt; 또는 &lt;strong&gt; 이다. &lt;strong&gt; 은 '중요하다' 는 뜻까지 담아 화면 낭독기가 강조해 읽고, &lt;b&gt; 는 모양만 굵게 한다. &lt;bold&gt; 나 &lt;hard&gt; 라는 태그는 없고, &lt;big&gt; 은 크기를 키우던 폐기된 태그다."
  },
  {
   "k": "항목",
   "ex0": "(list item) 로 각 항목을",
   "ex": "목록의 각 항목은 &lt;li&gt;(list item) 다. 번호 없는 목록 &lt;ul&gt; 이나 번호 목록 &lt;ol&gt; 안에 &lt;li&gt; 를 나열한다. &lt;item&gt; 과 &lt;el&gt; 은 HTML 태그가 아니고, &lt;p&gt; 는 문단이라 목록 항목으로 쓰면 구조가 드러나지 않는다."
  },
  {
   "k": "표",
   "ex0": "안에 행/칸을 넣는다",
   "ex": "표는 &lt;table&gt; 로 만든다. 그 안에 행은 &lt;tr&gt;, 각 칸은 &lt;td&gt;, 머리글 칸은 &lt;th&gt; 로 채운다. &lt;tab&gt;, &lt;gridtable&gt;, &lt;box&gt; 는 HTML 태그가 아니다. 레이아웃을 잡는 용도로 표를 쓰던 시절이 있었지만 지금은 데이터 표에만 쓴다."
  },
  {
   "k": "주석",
   "ex0": "이 HTML 주석이다",
   "ex": "HTML 주석은 &lt;!-- 메모 --&gt; 다. 브라우저는 화면에 그리지 않지만 소스 보기에는 그대로 남으므로 비밀은 적지 않는다. // 와 /* */ 는 JS 와 CSS 의 주석이고 # 은 파이썬과 셸의 주석이라 HTML 에서는 그대로 글자로 보인다."
  },
  {
   "k": "선택자",
   "ex0": ". 은 class, # 은 id 선택자",
   "ex": "class 는 마침표로 고른다. .box 는 class=\"box\" 인 모든 요소다. #box 는 id 가 box 인 요소 하나, box 라고만 쓰면 &lt;box&gt; 라는 태그 이름을 찾고, *box 는 문법에 없다. class 는 여러 요소가 공유할 수 있고 id 는 페이지에 하나뿐이어야 한다."
  },
  {
   "k": "빈칸",
   "ex0": "color 속성이 글자색",
   "ex": "글자 색은 color: blue; 처럼 color 속성으로 정한다. 배경은 background-color 라 이름이 다르다. font-color 나 text-color 라는 속성은 없어 적어도 무시된다. 값은 이름(blue), 16진수(#0000ff), rgb() 어느 것이든 된다."
  },
  {
   "k": "개념",
   "ex0": "CSS 는 스타일(디자인)을 담당",
   "ex": "색·크기·배치 같은 겉모습은 CSS 가 맡는다. HTML 은 구조, JS 는 동작이고, JSON 은 데이터를 주고받는 형식이라 화면 꾸미기와 관계없다. 세 언어의 역할을 나누면 구조를 바꾸지 않고 디자인만 바꿀 수 있다."
  },
  {
   "k": "문법",
   "ex0": "속성: 값; 형태로 쓴다",
   "ex": "CSS 규칙은 속성: 값; 꼴이다. color: red; 처럼 콜론으로 잇고 세미콜론으로 끝낸다. = 는 HTML 속성과 JS 에서 쓰는 기호라 CSS 에서는 무시되고, color(red) 나 red -&gt; color 는 문법에 없다. 세미콜론을 빼면 다음 줄까지 한 규칙으로 읽혀 깨진다."
  },
  {
   "k": "아이디",
   "ex0": "# 은 id 선택자",
   "ex": "id 는 샵 기호로 고른다. #main 은 id=\"main\" 인 요소다. .main 은 class, main 은 &lt;main&gt; 태그, @main 은 문법에 없다. id 는 문서에 하나뿐이어야 하므로 반복되는 요소에는 class 를 쓴다."
  },
  {
   "k": "글자 크기",
   "ex0": "font-size 로 크기를 정한다",
   "ex": "글자 크기는 font-size 다. font-size: 16px 처럼 쓴다. font-weight 는 굵기이고, text-size 와 text-length 는 존재하지 않는 속성이라 적어도 아무 일이 없다. 단위는 px 외에 em, rem, % 도 쓴다."
  },
  {
   "k": "박스모델",
   "ex0": "margin 은 바깥 여백, padding 은 안쪽 여백",
   "ex": "요소 바깥, 즉 이웃과의 간격은 margin 이다. padding 은 테두리 안쪽 여백이라 배경색이 칠해지는 영역이 넓어지고, border 는 그 사이의 선이다. gap 은 flex 나 grid 의 자식 사이 간격에만 쓴다. 박스 모델은 안쪽부터 content → padding → border → margin 순이다."
  },
  {
   "k": "배경",
   "ex0": "background-color 로 배경색을 정한다",
   "ex": "배경색은 background-color 다. background 하나로 색과 이미지를 함께 적을 수도 있다. bgcolor 는 옛 HTML 속성이고 back, back-color, fill 은 CSS 속성이 아니다. fill 은 SVG 도형의 채우기 색에만 쓴다."
  },
  {
   "k": "레이아웃",
   "ex0": "display:flex (플렉스박스) 가 대표적",
   "ex": "요소를 한 방향으로 유연하게 늘어놓는 현대적 방법은 flexbox, 즉 부모에 display: flex 를 주는 것이다. float 은 글자가 이미지를 감싸게 하던 옛 방식이라 레이아웃용으로는 권하지 않고, &lt;table&gt; 로 배치하는 것은 의미가 어긋나며, align 은 폐기된 HTML 속성이다. 2 차원 격자에는 grid 를 쓴다."
  },
  {
   "k": "버튼",
   "ex0": "태그로 클릭 가능한 버튼",
   "ex": "클릭할 수 있는 버튼은 &lt;button&gt; 이다. &lt;input type=\"button\"&gt; 으로도 만들 수 있지만 &lt;button&gt; 은 안에 아이콘이나 태그를 넣을 수 있어 더 유연하다. &lt;form&gt; 안의 &lt;button&gt; 은 기본 type 이 submit 이라 폼을 전송하므로, 전송을 원치 않으면 type=\"button\" 을 붙인다."
  },
  {
   "k": "연결",
   "ex0": "label의 for 값과 input의 id가 같으면",
   "ex": "&lt;label for=\"email\"&gt; 은 id=\"email\" 인 입력칸과 짝이 된다. 그러면 라벨 글자를 클릭해도 입력칸에 커서가 가고 화면 낭독기가 둘을 함께 읽는다. type 이나 부모 태그 이름, form 의 action 과는 관계가 없다. 라벨 안에 input 을 넣으면 for 없이도 연결된다."
  },
  {
   "k": "전송",
   "ex0": "action 속성에 데이터를 받을 서버 주소",
   "ex": "&lt;form action=\"/submit\"&gt; 의 action 이 데이터를 보낼 서버 주소다. method 는 GET 으로 보낼지 POST 로 보낼지 정하는 다른 속성이다. href 는 링크 전용이고 &lt;form&gt; 에는 쓰지 않는다. action 을 비우면 현재 페이지 주소로 보낸다."
  },
  {
   "k": "폼",
   "ex0": "태그는 입력 요소들을 묶어 서버로 전송",
   "ex": "입력칸들을 하나로 묶어 서버로 보내는 태그는 &lt;form&gt; 이다. &lt;input&gt; 은 칸 하나, &lt;label&gt; 은 그 칸의 설명, &lt;div&gt; 는 의미 없는 묶음이라 전송 기능이 없다. &lt;form&gt; 안의 버튼을 누르면 모든 입력값이 action 주소로 함께 간다."
  },
  {
   "k": "라벨",
   "ex0": "은 입력칸에 설명을 붙여 접근성을",
   "ex": "&lt;label&gt; 은 입력칸이 무엇인지 설명하는 글을 붙이고 for 로 그 칸과 연결한다. 라벨을 클릭하면 칸에 초점이 가고, 화면 낭독기가 '이메일, 입력칸' 처럼 함께 읽어 준다. 링크·표·이미지와는 관계없다."
  },
  {
   "k": "이메일",
   "ex0": "type=\"email\"은 올바른 이메일 형식",
   "ex": "&lt;input type=\"email\"&gt; 은 @ 가 빠진 값을 넣으면 브라우저가 제출을 막고 안내를 띄운다. 모바일에서는 @ 가 있는 키보드가 뜬다. 다만 브라우저 검사는 우회할 수 있으므로 서버에서도 다시 검사해야 한다. type=\"text\" 는 아무 검사도 하지 않는다."
  },
  {
   "k": "라디오",
   "ex0": "같은 name의 type=\"radio\"들은 하나만",
   "ex": "동그란 단일 선택 버튼은 type=\"radio\" 다. 같은 name 을 가진 라디오끼리 한 묶음이 되어 그중 하나만 고를 수 있다. 여러 개를 고르려면 checkbox, 드롭다운 목록은 &lt;select&gt; 와 &lt;option&gt; 이다. one 이라는 type 은 없다."
  },
  {
   "k": "속성",
   "ex0": "type 속성 값에 따라 입력칸의 모양과 동작",
   "ex": "&lt;input&gt; 의 종류는 type 속성이 정한다. text, password, email, number, checkbox, radio, date 등 값에 따라 모양·키보드·검사 방식이 달라진다. type 을 생략하면 text 다. name 은 서버로 보낼 때의 키 이름이라 역할이 다르다."
  },
  {
   "k": "타입",
   "ex0": "type=\"password\"는 입력 문자를 점으로",
   "ex": "비밀번호 칸은 type=\"password\" 다. 글자가 점이나 별표로 가려진다. hidden 은 화면에 아예 보이지 않는 칸이라 사용자가 입력할 수 없고, text 는 그대로 보이며, secret-text 는 없는 값이다. 가려질 뿐 전송은 평문이므로 HTTPS 가 필요하다."
  },
  {
   "k": "체크",
   "ex0": "type=\"checkbox\"로 체크박스를",
   "ex": "여러 개를 동시에 고르는 네모 칸은 type=\"checkbox\" 다. 각 칸이 독립적으로 켜지고 꺼진다. 하나만 고르게 하려면 radio 를 쓴다. tick, box, multi-check 는 존재하지 않는 type 이라 브라우저가 text 로 취급한다."
  },
  {
   "k": "여러줄",
   "ex0": "는 여러 줄의 긴 글을 입력받는다",
   "ex": "여러 줄 글은 &lt;textarea&gt; 다. &lt;input type=\"text\"&gt; 는 한 줄만 받는다. &lt;textarea&gt; 는 여는 태그와 닫는 태그 사이의 글이 초기값이 되고, rows 와 cols 로 크기를 정한다. 사용자가 모서리를 끌어 크기를 바꿀 수도 있다."
  },
  {
   "k": "초기값",
   "ex0": "value 속성에 넣은 값이 입력칸에 미리",
   "ex": "&lt;input value=\"홍길동\"&gt; 처럼 value 에 적은 값이 처음부터 칸에 채워진다. placeholder 는 비어 있을 때 흐리게 보이는 안내문이라 실제 값이 아니고 제출되지도 않는다. 사용자가 고치면 value 도 바뀌어 서버로 간다."
  },
  {
   "k": "필수",
   "ex0": "required가 있으면 비워둔 채 제출할 수 없다",
   "ex": "&lt;input required&gt; 가 있으면 비운 채로는 제출이 막히고 브라우저가 '이 입력란을 작성하세요' 를 띄운다. must 나 must-fill 은 없는 속성이고, checked 는 체크박스나 라디오를 미리 켜 두는 속성이라 필수 여부와 다르다. 서버 검사는 별도로 필요하다."
  },
  {
   "k": "메뉴",
   "ex0": "는 사이트의 주요 이동 메뉴를 묶는다",
   "ex": "주요 메뉴 링크 묶음은 &lt;nav&gt; 로 감싼다. 화면 낭독기가 '내비게이션' 이라고 알려 주어 바로 건너뛸 수 있다. &lt;a&gt; 는 링크 하나, &lt;link&gt; 는 &lt;head&gt; 에서 CSS 를 연결하는 태그이며, &lt;menu&gt; 는 도구 모음용으로 뜻이 다르다."
  },
  {
   "k": "바닥글",
   "ex0": "는 문서나 구역의 바닥글 정보를",
   "ex": "저작권·연락처·관련 링크가 들어가는 하단 영역은 &lt;footer&gt; 다. &lt;end&gt;, &lt;bottom&gt;, &lt;foot&gt; 은 HTML 태그가 아니다. &lt;footer&gt; 는 페이지 전체뿐 아니라 &lt;article&gt; 안에도 둘 수 있어 그 글의 바닥글이 된다."
  },
  {
   "k": "이유",
   "ex0": "시맨틱 태그는 의미를 드러내 SEO와 접근성",
   "ex": "&lt;nav&gt;, &lt;article&gt;, &lt;main&gt; 처럼 뜻이 있는 태그는 검색엔진과 화면 낭독기가 '여기가 본문, 여기가 메뉴' 라고 알아보게 해 준다. 모두 &lt;div&gt; 면 기계는 구조를 모른다. 화면 모양, 스크립트 속도, 이미지 압축과는 관계없다."
  },
  {
   "k": "독립",
   "ex0": "은 떼어내도 완결되는 독립 콘텐츠",
   "ex": "블로그 글, 뉴스 기사, 댓글처럼 따로 떼어 내도 말이 되는 덩어리는 &lt;article&gt; 이다. &lt;section&gt; 은 한 문서 안의 주제별 구획이라 혼자서는 완결되지 않고, &lt;div&gt; 는 의미가 없으며, &lt;post&gt; 는 태그가 아니다. RSS 로 내보낼 만한 단위라고 생각하면 된다."
  },
  {
   "k": "구획",
   "ex0": "은 보통 제목을 가진 주제별 구획",
   "ex": "관련 내용을 주제별로 나누는 태그는 &lt;section&gt; 이다. 보통 안에 제목(h2 등)이 하나씩 있다. &lt;group&gt;, &lt;part&gt;, &lt;box&gt; 는 HTML 태그가 아니다. 단순히 스타일을 입히려고 묶는 것이라면 의미 없는 &lt;div&gt; 가 맞다."
  },
  {
   "k": "섹션",
   "ex0": "은 제목을 동반한 주제 단위 구획",
   "ex": "&lt;section&gt; 은 제목을 가진 주제 단위 구획이다. 이미지 전용도, 표도, 링크 전용도 아니다. '이 구획에 제목을 붙일 수 있는가' 가 section 을 쓸지 div 를 쓸지 가르는 기준이다."
  },
  {
   "k": "인라인",
   "ex0": "은 줄 안의 일부만 감싸는 인라인 상자",
   "ex": "문장 안의 몇 글자만 감쌀 때는 &lt;span&gt; 이다. 줄을 바꾸지 않고 내용만큼만 차지한다. &lt;div&gt; 와 &lt;p&gt; 는 블록 요소라 줄이 바뀌고, &lt;inline&gt; 이라는 태그는 없다. 특정 단어에만 색을 입힐 때 &lt;span class=\"hl\"&gt; 처럼 쓴다."
  },
  {
   "k": "span표시",
   "ex0": "은 기본이 inline이라 내용만큼만",
   "ex": "&lt;span&gt; 의 기본 display 는 inline 이다. 그래서 줄을 바꾸지 않고 너비·높이를 직접 지정할 수 없다. block 은 &lt;div&gt; 와 &lt;p&gt; 의 기본값이고, flex 와 grid 는 부모에 직접 지정해야만 되는 값이다. 크기를 주고 싶으면 inline-block 으로 바꾼다."
  },
  {
   "k": "블록",
   "ex0": "는 의미가 없는 블록 레벨 그룹핑 상자",
   "ex": "아무 의미 없이 여러 요소를 묶는 블록 상자는 &lt;div&gt; 다. 한 줄을 통째로 차지한다. &lt;span&gt; 은 인라인이라 줄 안에서만 묶고, &lt;block&gt; 과 &lt;group&gt; 은 태그가 아니다. 의미가 있는 묶음이라면 &lt;section&gt; 이나 &lt;article&gt; 을 먼저 고려한다."
  },
  {
   "k": "교차축",
   "ex0": "align-items는 교차축 방향으로 아이템을",
   "ex": "flex 에서 주축이 가로면 교차축은 세로다. 교차축 정렬은 align-items 다. justify-content 는 주축 정렬이고, vertical-align 은 인라인 요소와 표 칸에만 듣는 옛 속성이며, align-text 는 없다. 가운데 세로 정렬은 align-items: center 다."
  },
  {
   "k": "컨테이너",
   "ex0": "display: flex를 주면 자식들이 flex 아이템",
   "ex": "부모에 display: flex 를 주면 그 직계 자식들이 flex 아이템이 되어 한 줄로 늘어선다. 자식에게 주는 것이 아니라 부모에게 준다. inline-flex 는 부모 자체가 인라인으로 놓이는 변형이고, grid 는 격자 배치용이다."
  },
  {
   "k": "주축",
   "ex0": "justify-content는 주축 방향으로 아이템을",
   "ex": "주축(기본은 가로) 방향 정렬은 justify-content 다. space-between 으로 양끝 정렬, center 로 가운데 정렬을 한다. align-items 는 교차축, text-align 은 글자 정렬, float 은 flex 와 함께 쓰지 않는 옛 배치 방식이다."
  },
  {
   "k": "중앙",
   "ex0": "두 축의 정렬 속성을 모두 center로",
   "ex": "가로는 justify-content: center, 세로는 align-items: center 다. 둘을 함께 주면 아이템이 정확히 가운데 온다. text-align 은 글자에만, margin: 0 은 여백 제거일 뿐이고, float: center 는 존재하지 않는 값이다. 이 두 줄이 CSS 로 가운데 정렬하는 가장 짧은 방법이다."
  },
  {
   "k": "상대",
   "ex0": "relative는 자기 원래 자리를 기준으로 이동하며",
   "ex": "position: relative 는 원래 있던 자리를 기준으로 top·left 만큼 옮기되, 원래 자리는 비워 둔 채 남긴다. static 은 옮길 수 없는 기본값, fixed 는 화면에 고정, sticky 는 스크롤하다 특정 위치에서 붙는 값이다. relative 는 absolute 자식의 기준점을 만들 때도 쓴다."
  },
  {
   "k": "고정",
   "ex0": "fixed는 뷰포트를 기준으로 고정되어",
   "ex": "position: fixed 는 화면(뷰포트)을 기준으로 자리를 잡아 스크롤해도 그대로 있다. 상단 고정 바나 채팅 버튼에 쓴다. sticky 는 스크롤 중 특정 지점부터 붙고 부모 영역을 벗어나면 함께 사라진다는 점이 다르다."
  },
  {
   "k": "절대",
   "ex0": "absolute는 흐름에서 빠져나와 기준 조상 위에",
   "ex": "position: absolute 는 문서 흐름에서 빠져나와 원래 자리를 차지하지 않고, position 이 static 이 아닌 가장 가까운 조상을 기준으로 놓인다. 그런 조상이 없으면 문서 전체가 기준이다. fixed 는 뷰포트 기준, sticky 는 흐름에 남아 있다는 점이 다르다."
  },
  {
   "k": "기본",
   "ex0": "모든 요소의 기본 position은 static",
   "ex": "position 을 지정하지 않은 요소는 static 이다. 문서 흐름대로 놓이고 top·left 가 듣지 않는다. block 은 display 의 값이라 position 과 무관하다. static 이 아닌 값(relative 등)을 줘야 좌표 속성이 동작한다."
  },
  {
   "k": "인라인블록",
   "ex0": "inline-block은 옆으로 배치되면서도 크기",
   "ex": "display: inline-block 은 인라인처럼 옆으로 나란히 놓이면서 block 처럼 width·height·margin 을 줄 수 있다. inline 은 크기를 줄 수 없고 block 은 줄을 바꾼다. 버튼이나 뱃지처럼 줄 안에 크기 있는 상자를 둘 때 쓴다."
  },
  {
   "k": "그리드",
   "ex0": "display: grid를 주면 행과 열로 배치하는",
   "ex": "행과 열의 격자로 배치하려면 부모에 display: grid 를 준다. 그 뒤 grid-template-columns 로 열을 정한다. table 은 표 태그의 display 값이고 gridbox 와 flexgrid 는 없는 값이다. 한 방향 배치는 flex, 두 방향은 grid 가 맞다."
  },
  {
   "k": "간격",
   "ex0": "gap 속성으로 그리드 행·열 사이의 간격",
   "ex": "grid 와 flex 에서 자식 사이의 간격은 부모에 gap 을 주면 된다. margin 을 자식마다 주는 방식보다 가장자리에 여백이 생기지 않아 깔끔하다. padding 은 안쪽 여백, spacing 은 없는 속성이다. row-gap 과 column-gap 으로 방향별로 줄 수도 있다."
  },
  {
   "k": "라이브",
   "ex0": "h1 은 가장 큰 제목이다. 글자를 바꾸면",
   "ex": "h1 은 가장 큰 제목 태그다. 태그 사이의 글자를 바꾸면 화면의 제목이 바로 바뀐다. 이미지는 img, 버튼은 button, 작은 글씨는 small 이 따로 있다. 제목 태그는 크기만이 아니라 '이 페이지의 주제' 라는 뜻을 담으므로 한 페이지에 하나만 두는 것이 좋다."
  },
  {
   "k": "라이브",
   "ex0": "p 는 문단이다. p 를 추가할수록",
   "ex": "p 는 문단(paragraph)이다. p 를 하나 더 넣으면 새 문단이 생겨 화면에 줄이 하나 늘고 문단 사이에 여백이 생긴다. 링크는 a, 표는 table, 제목은 h1~h6 이라 각각 다른 태그다. 글을 문단 단위로 나눌 때 p 를 쓴다."
  }
 ]
};
