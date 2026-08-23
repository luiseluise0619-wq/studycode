/* 웹(HTML·CSS) 단답 15 — 기본값과 규칙 이름을 적어 본다.
   검증:  node ver_input.cjs ./in_web.cjs */
module.exports = [

{ track:"web", t:"input", cat:"internals", k:"링크의 기본 배치 방식",
  q:"<code>&lt;a&gt;</code> 태그의 기본 <code>display</code> 값은 무엇일까요? (영문 한 낱말)",
  a:["inline", "인라인"],
  ex:"글 흐름 안에 놓이므로 <b>너비·높이·위아래 여백</b>이 먹지 않습니다.\n💡 개념: 크기를 주려면 <code>inline-block</code> 이나 <code>block</code> 으로 바꿔야 합니다 — 버튼처럼 생긴 링크를 만들 때 늘 걸리는 지점입니다.\n🛠 실무: 목록 항목은 <code>list-item</code>, <code>&lt;div&gt;</code> 는 <code>block</code> 이 기본입니다. '왜 여백이 안 먹지' 싶으면 먼저 이 값을 확인하세요." },

{ track:"web", t:"input", cat:"internals", k:"너비가 무엇까지 포함하는가",
  q:"<code>box-sizing: border-box</code> 를 주면 <code>width</code> 값 안에 콘텐츠 말고 무엇이 함께 들어갈까요? (두 가지, 쉼표로. 예: 여백,그림자)",
  a:["패딩,테두리", "안쪽여백,테두리", "padding,border", "패딩,보더"],
  ex:"기본값 <code>content-box</code> 는 콘텐츠만 재므로, 안쪽 여백을 주면 상자가 <b>그만큼 커집니다</b>.\n💡 개념: 바깥 여백(margin)은 어느 쪽이든 포함되지 않습니다 — 상자 <b>바깥</b>의 거리이기 때문입니다.\n🛠 실무: 대부분의 프로젝트가 <code>*, *::before, *::after { box-sizing: border-box }</code> 를 맨 앞에 깔아 둡니다. 폭 계산이 직관과 맞아떨어져 레이아웃이 훨씬 쉬워집니다." },

{ track:"web", t:"input", cat:"internals", k:"어느 규칙이 이기는가",
  q:"선택자 <code>#nav .item p</code> 의 특이도를 (아이디 수, 클래스 수, 요소 수) 세 숫자로 적으세요. (쉼표로 구분, 예: 0,2,1)",
  a:["1,1,1", "111", "0,1,1,1"],
  ex:"아이디 하나, 클래스 하나, 요소 하나입니다. 앞자리부터 <b>사전순처럼</b> 견주므로, 클래스를 열 개 붙여도 아이디 하나를 못 이깁니다.\n💡 개념: 인라인 스타일은 그보다 위, <code>!important</code> 는 그보다 위입니다 — 그래서 <code>!important</code> 는 마지막 수단입니다.\n🛠 실무: 특이도가 높은 규칙을 쌓으면 나중에 덮어쓰기가 점점 어려워집니다. 클래스 하나(0,1,0)로 평평하게 유지하는 것이 유지보수에 유리합니다." },

{ track:"web", t:"input", cat:"internals", k:"플렉스가 늘어서는 기본 방향",
  q:"<code>display: flex</code> 만 준 컨테이너에서 <code>flex-direction</code> 의 기본값은? (영문 한 낱말)",
  a:["row", "가로", "행"],
  ex:"주축이 <b>가로</b>라서 자식들이 왼쪽에서 오른쪽으로 늘어섭니다.\n💡 개념: <code>justify-content</code> 는 <b>주축</b>, <code>align-items</code> 는 <b>교차축</b>을 다루므로, 방향을 바꾸면 두 속성의 역할도 뒤바뀝니다.\n🛠 실무: 세로로 쌓고 가운데 정렬하려다 헷갈린다면 '지금 주축이 어디인가' 를 먼저 물으세요. 방향을 <code>column</code> 으로 바꾸는 순간 두 속성을 서로 바꿔 써야 합니다." },

{ track:"web", t:"input", cat:"internals", k:"절대 배치의 기준이 되는 조상",
  q:"<code>position: absolute</code> 인 요소는 <code>position</code> 값이 무엇이 <b>아닌</b> 가장 가까운 조상을 기준으로 놓일까요? (영문 한 낱말)",
  a:["static", "스태틱"],
  ex:"기준이 될 조상이 없으면 뷰포트(정확히는 초기 컨테이닝 블록)를 기준으로 삼아 <b>화면 구석으로 날아갑니다</b>.\n💡 개념: 그래서 부모에 <code>position: relative</code> 만 주는 관용구가 널리 쓰입니다 — '기준점을 여기로' 라는 선언입니다.\n🛠 실무: <code>transform</code>·<code>filter</code>·<code>will-change</code> 가 걸린 조상도 기준이 됩니다. 애니메이션을 넣었더니 배치가 틀어지는 사고가 여기서 납니다." },

{ track:"web", t:"input", cat:"internals", k:"쌓임 순서가 먹히는 조건",
  q:"<code>z-index</code> 가 효과를 내려면 그 요소에 어떤 속성이 <code>static</code> 이 아닌 값으로 있어야 할까요? (영문 한 낱말)",
  a:["position", "포지션"],
  ex:"플렉스·그리드 자식은 예외적으로 <code>static</code> 이어도 먹습니다.\n💡 개념: 더 중요한 것은 <b>쌓임 맥락</b>입니다 — 부모가 새 맥락을 만들면 자식의 <code>z-index</code> 는 그 안에서만 겨룹니다.\n🛠 실무: <code>z-index: 9999</code> 를 줬는데도 안 올라온다면 값이 작아서가 아니라 <b>다른 맥락에 갇힌</b> 것입니다. <code>opacity</code> 가 1 미만이거나 <code>transform</code> 이 걸린 조상을 찾아보세요." },

{ track:"web", t:"input", cat:"internals", k:"문서 뿌리를 기준으로 하는 단위",
  q:"글자 크기 상대 단위 두 가지 가운데 <b>문서 뿌리 요소의 글자 크기</b>를 기준으로 삼는 쪽은? (영문 세 글자)",
  a:["rem", "렘"],
  ex:"<code>em</code> 은 <b>부모</b>를 기준으로 삼아 중첩될수록 곱해집니다 — 3 단계만 겹쳐도 예상 밖의 크기가 됩니다.\n💡 개념: 뿌리 기준은 어디서 쓰든 값이 같아 예측하기 쉽습니다.\n🛠 실무: 사용자가 브라우저 기본 글자 크기를 키우면 이 단위가 함께 커집니다 — 접근성을 위해 <code>px</code> 대신 쓰는 이유입니다. 안쪽 여백처럼 '부모에 비례해야 하는' 값에만 <code>em</code> 을 남기세요." },

{ track:"web", t:"input", cat:"internals", k:"그림을 못 볼 때 읽어 주는 글",
  q:"<code>&lt;img&gt;</code> 에서 이미지를 볼 수 없는 사람에게 대신 읽어 줄 설명을 적는 속성의 이름은? (영문 세 글자)",
  a:["alt", "얼트"],
  ex:"화면 낭독기가 읽어 주고, 이미지가 안 뜰 때 자리에 표시되며, 검색 엔진도 참고합니다.\n💡 개념: 장식용 이미지라면 <b>빈 문자열</b>(<code>alt=\"\"</code>)을 주어 '읽지 말라' 고 알려야 합니다 — 속성을 아예 빼면 낭독기가 파일 이름을 읽습니다.\n🛠 실무: '사진', '이미지' 같은 말은 넣지 마세요 — 낭독기가 이미 이미지임을 알려 줍니다. 그림이 전하는 <b>정보</b>를 적으세요." },

{ track:"web", t:"input", cat:"internals", k:"이름표와 입력칸을 잇는 속성",
  q:"<code>&lt;label&gt;</code> 을 특정 입력칸과 연결할 때 입력칸의 <code>id</code> 를 적어 주는 속성의 이름은? (영문 세 글자)",
  a:["for", "htmlFor"],
  ex:"연결되면 이름표를 눌러도 입력칸에 초점이 가고, 낭독기가 <b>무엇을 입력하는 칸인지</b> 함께 읽어 줍니다.\n💡 개념: 이름표로 감싸는 방법도 있지만, 명시적으로 잇는 편이 배치를 자유롭게 합니다.\n🛠 실무: 체크박스는 이름표 연결만으로도 <b>누를 수 있는 영역</b>이 크게 넓어져 모바일에서 체감이 큽니다. 자리 표시자(placeholder)는 이름표를 대신하지 못합니다 — 입력하면 사라지기 때문입니다." },

{ track:"web", t:"input", cat:"internals", k:"모바일에서 화면 폭에 맞추기",
  q:"반응형 페이지의 뷰포트 메타 태그에서 <code>content</code> 에 가장 먼저 적는, 화면 실제 폭을 쓰라는 값은? (영문, 등호 포함)",
  a:["width=device-width", "device-width"],
  ex:"이 값이 없으면 모바일 브라우저가 폭 980px 짜리 화면인 척하고 <b>축소해서</b> 보여 줍니다. 미디어 쿼리도 그 가짜 폭으로 판정됩니다.\n💡 개념: 그래서 CSS 를 아무리 잘 짜도 이 한 줄이 빠지면 반응형이 통째로 안 먹습니다.\n🛠 실무: <code>user-scalable=no</code> 로 확대를 막지 마세요 — 저시력 사용자가 화면을 키울 수 없게 됩니다." },

{ track:"web", t:"input", cat:"perf", k:"다시 안 물어보고 쓰는 시간",
  q:"<code>Cache-Control</code> 에서 서버에 다시 묻지 않고 그대로 써도 되는 시간(초)을 정하는 지시자의 이름은? (영문, 하이픈 포함)",
  a:["max-age", "maxage"],
  ex:"이 시간 안에는 네트워크 요청 자체가 나가지 않습니다. 가장 빠른 요청은 <b>보내지 않는 요청</b>입니다.\n💡 개념: 시간이 지나면 <code>ETag</code>·<code>Last-Modified</code> 로 <b>바뀌었는지만</b> 물어(조건부 요청) 안 바뀌었으면 304 로 짧게 끝냅니다.\n🛠 실무: 파일 이름에 내용 해시를 넣으면 내용이 바뀔 때 주소가 바뀌므로, 이 값을 1 년으로 크게 두고 <code>immutable</code> 을 붙일 수 있습니다." },

{ track:"web", t:"input", cat:"internals", k:"본문의 주된 내용을 감싸는 태그",
  q:"머리말·꼬리말·내비게이션을 뺀 <b>그 페이지의 주된 내용</b>을 감싸는 시맨틱 태그의 이름은? (영문 네 글자)",
  a:["main", "메인"],
  ex:"한 페이지에 하나만 두는 것이 규칙이고, 낭독기 사용자는 이 영역으로 <b>바로 건너뛸</b> 수 있습니다.\n💡 개념: <code>&lt;div&gt;</code> 로 같은 모양을 만들 수는 있지만, 그것은 기계에게 아무 뜻도 전하지 않습니다.\n🛠 실무: '본문 바로가기' 링크를 페이지 맨 앞에 숨겨 두고 이 영역으로 보내면, 키보드 사용자가 메뉴 수십 개를 지나치지 않아도 됩니다." },

{ track:"web", t:"input", cat:"perf", k:"다시 그리지 않고 움직이기",
  q:"요소를 움직이는 애니메이션에서 레이아웃 재계산을 일으키지 않아 권장되는 CSS 속성은? (영문 아홉 글자)",
  a:["transform", "트랜스폼"],
  ex:"이 속성과 <code>opacity</code> 는 <b>합성 단계</b>에서만 처리되어 레이아웃과 페인트를 건너뜁니다.\n💡 개념: 반대로 <code>left</code>·<code>top</code>·<code>width</code> 를 애니메이션하면 매 프레임 <b>리플로</b>가 일어나 프레임이 떨어집니다.\n🛠 실무: 60fps 를 지키려면 한 프레임에 약 16ms 뿐입니다. 움직임은 이 속성으로, 나타남과 사라짐은 <code>opacity</code> 로 만드세요." },

{ track:"web", t:"input", cat:"internals", k:"공간에 맞춰 칸을 채우는 함수",
  q:"CSS Grid 에서 <code>repeat()</code> 안에 개수 대신 적어, 공간이 허락하는 만큼 칸을 만들되 <b>빈 칸은 남기지 않는</b> 키워드는? (영문, 하이픈 포함)",
  a:["auto-fit", "autofit"],
  ex:"<code>auto-fill</code> 은 빈 트랙을 그대로 남기고, 이 키워드는 <b>빈 트랙을 접어</b> 남은 칸들이 공간을 나눠 갖게 합니다.\n💡 개념: <code>repeat(auto-fit, minmax(200px, 1fr))</code> 한 줄이면 미디어 쿼리 없이도 화면 폭에 따라 열 수가 바뀝니다.\n🛠 실무: 카드 목록처럼 '가능한 만큼 늘어놓기' 에 딱 맞습니다. 항목이 하나뿐일 때 그 하나가 화면을 꽉 채워도 되는지 먼저 확인하세요." },

{ track:"web", t:"input", cat:"internals", k:"키보드 초점 순서를 정하는 속성",
  q:"요소가 키보드 <code>Tab</code> 이동을 받을 수 있는지와 그 순서를 정하는 HTML 속성의 이름은? (영문 여덟 글자)",
  a:["tabindex", "탭인덱스"],
  ex:"<code>0</code> 은 '문서 순서대로 초점을 받는다', <code>-1</code> 은 '탭으로는 못 가지만 코드로는 초점을 줄 수 있다' 입니다.\n💡 개념: 양수는 <b>문서 순서를 무시</b>하고 앞으로 끌어와 순서를 뒤죽박죽으로 만들기 쉬워, 쓰지 않는 것이 관례입니다.\n🛠 실무: <code>&lt;div&gt;</code> 로 만든 버튼에는 이 속성과 키 이벤트를 직접 붙여야 합니다 — 그럴 바에는 처음부터 <code>&lt;button&gt;</code> 을 쓰는 편이 낫습니다." },

];
