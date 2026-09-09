/* react 트랙 짧은 해설 다시 쓰기 — 왜 맞는지와 나머지는 왜 아닌지를 같이 적는다 */
module.exports = { track: "react", fixes: [
  { k: "JSX", ex0: "JSX 로 UI 를 선언적으로 작성", ex: "자바스크립트 안에 HTML 처럼 태그를 적는 문법이 JSX 다. 빌드 도구가 React.createElement 호출로 바꿔 준다. TSX 는 TypeScript 에서 쓰는 JSX 의 변형이라 '만' 이 아니고, JSON 은 데이터 표기 형식이며, HTML5 는 브라우저 마크업 표준이라 자바스크립트 안에 그대로 쓸 수 없다." },
  { k: "규칙", ex0: "컴포넌트는 대문자로 시작해야 한다", ex: "컴포넌트 이름은 App 처럼 대문자로 시작해야 한다. JSX 는 소문자 태그(&lt;div&gt;)를 HTML 요소로, 대문자 태그(&lt;App /&gt;)를 컴포넌트로 구별하기 때문이다. 소문자로 지으면 그런 HTML 태그가 없다는 경고와 함께 렌더링되지 않고, 숫자로는 식별자를 시작할 수 없다." },
  { k: "개념", ex0: "UI 를 컴포넌트 단위로 나눠 조립", ex: "React 에서 화면을 이루는 재사용 조각은 컴포넌트다. 버튼, 카드, 목록처럼 나눠 만들고 조립한다. 함수로 구현하지만 '함수' 는 구현 수단일 뿐 개념 이름이 아니고, 모듈은 파일 단위의 코드 묶음, 태그는 컴포넌트를 JSX 에서 쓰는 표기다." },
  { k: "상식", ex0: "React 는 Meta 에서 개발", ex: "React 는 페이스북(현 Meta)이 2013 년에 공개한 라이브러리다. 구글은 Angular, 마이크로소프트는 TypeScript 와 Blazor, 애플은 Swift UI 를 만들었으니 서로 헷갈리기 쉽다. React 와 함께 쓰는 Next.js 는 Vercel 이 만든 별도 프레임워크다." },
  { k: "개념", ex0: "props 로 컴포넌트에 데이터를 전달", ex: "부모가 자식에게 값을 넘길 때는 props 를 쓴다. &lt;Child name=\"a\" /&gt; 처럼 속성으로 적으면 자식이 props.name 으로 받는다. state 는 컴포넌트 자신이 관리하는 값이고, hook 은 useState 같은 함수의 총칭이며, ref 는 DOM 이나 값을 붙잡아 두는 참조라 부모 자식 전달 수단이 아니다." },
  { k: "훅", ex0: "const [n,setN]=useState(0) 형태", ex: "함수형 컴포넌트에서 상태를 만드는 훅은 useState 다. const [n, setN] = useState(0) 처럼 값과 변경 함수를 받는다. setState 는 클래스 컴포넌트의 메서드이고, useBox 와 useVar 는 존재하지 않는 훅이다. 훅 이름은 모두 use 로 시작한다." },
  { k: "상태", ex0: "state 는 컴포넌트의 변하는 값", ex: "컴포넌트 안에서 시간에 따라 바뀌는 데이터는 state 로 다룬다. 바뀌면 React 가 다시 렌더링한다. props 는 부모가 내려 준 값이라 자식이 직접 바꾸지 않고, const 는 변수 선언 키워드일 뿐 리렌더링을 일으키지 않으며, css 는 스타일이다." },
  { k: "동작", ex0: "state 가 바뀌면 화면이 다시 그려진다", ex: "setState 로 state 가 바뀌면 React 가 그 컴포넌트를 다시 렌더링해 화면을 갱신한다. 페이지가 새로고침되는 것이 아니라 바뀐 부분만 DOM 에 반영된다. 컴포넌트가 삭제되지도 않고, 아무 일도 없다면 화면이 갱신되지 않을 것이다. 이 자동 갱신이 React 의 핵심이다." },
  { k: "개념", ex0: "map() 으로 배열을 JSX 목록으로 변환", ex: "배열을 컴포넌트 목록으로 바꿀 때는 map() 을 쓴다. items.map(x => &lt;li key={x.id}&gt;{x.name}&lt;/li&gt;) 처럼 각 원소를 JSX 로 변환한 새 배열을 돌려준다. forEach 는 아무것도 돌려주지 않아 JSX 안에서 쓸 수 없고, filter 는 걸러낼 뿐 변환하지 않으며, push 는 배열에 원소를 추가한다." },
  { k: "규칙", ex0: "변하지 않는 고유 id 가 가장 좋은 key", ex: "key 는 항목마다 고유하고 렌더링 사이에 변하지 않아야 하므로 데이터의 id 가 가장 좋다. 랜덤 숫자는 렌더링마다 바뀌어 매번 새 요소로 취급되고, 배열 인덱스는 항목을 삽입하거나 삭제하면 밀려서 엉뚱한 요소가 재사용되며, 항상 0 이면 중복 key 경고가 난다." },
  { k: "핵심", ex0: "React 는 key 로 각 항목을 구분", ex: "목록의 각 항목에는 key 속성을 줘야 한다. React 가 어떤 항목이 추가되고 삭제되고 이동했는지 key 로 알아내 최소한만 다시 그린다. id 는 HTML 속성이라 React 의 비교에 쓰이지 않고, name 은 폼 요소 속성이며, ref 는 DOM 참조용이다. key 가 없으면 경고가 난다." },
  { k: "동작", ex0: "map() 은 변환된 새 배열을 반환", ex: "map() 은 각 원소를 콜백으로 변환한 결과를 모아 새 배열로 돌려준다. 원본은 바뀌지 않는다. 그래서 JSX 안에서 {arr.map(...)} 이 요소 배열이 되어 렌더링된다. 문자열이나 숫자 하나를 돌려주지 않고, 아무것도 돌려주지 않는 것은 forEach 다." },
  { k: "개념", ex0: "onClick={함수} 로 클릭을 처리", ex: "JSX 에서 클릭은 onClick={함수} 로 처리한다. 카멜 표기라 HTML 의 onclick 과 다르다. onPress 는 React Native 의 이름이고, onTap 과 click 은 React 에 없는 속성이다. 값에는 함수 자체를 넘겨야 하며 onClick={f()} 처럼 호출해 넣으면 렌더링 때 바로 실행된다." },
  { k: "입력", ex0: "onChange 로 입력 변화를 감지", ex: "입력창의 값이 바뀔 때는 onChange 가 호출된다. e.target.value 로 새 값을 읽어 state 에 넣는다. onInput 도 동작하지만 React 에서는 onChange 가 표준 방식이라 '만' 은 틀리고, onType 과 onEdit 은 존재하지 않는 속성이다." },
  { k: "개념", ex0: "값을 state 로 관리하면 제어 컴포넌트", ex: "입력값을 state 에 두고 value={state} 와 onChange 로 묶은 방식을 제어 컴포넌트(controlled)라 한다. React 가 값의 유일한 출처가 되어 검증과 초기화가 쉽다. 반대로 DOM 이 값을 갖고 ref 로 읽는 것은 비제어 컴포넌트다. 정적 입력, 자유 입력, 숨김 입력은 React 용어가 아니다." },
  { k: "문법", ex0: "중괄호 {} 안에 함수를 전달", ex: "JSX 속성에 자바스크립트 값을 넣을 때는 중괄호를 쓰므로 onClick={handleClick} 이 맞다. onClick=\"handleClick\" 은 문자열이라 함수가 실행되지 않고, onClick(handleClick) 은 속성이 아니라 함수 호출 문법이며, click:handleClick 은 JSX 에 없는 표기다. 괄호 없이 함수 이름만 넘겨야 클릭 때 실행된다." },
  { k: "개념", ex0: "useState, useEffect 처럼 use 로 시작", ex: "훅은 useState, useEffect, useRef 처럼 모두 use 로 시작한다. 이 접두어 덕분에 린터가 훅 규칙(최상위에서만 호출)을 검사할 수 있다. on 은 이벤트 속성, get 과 set 은 일반 함수 이름 관례라 훅과 무관하다. 직접 만드는 커스텀 훅도 use 로 시작해야 한다." },
  { k: "핵심", ex0: "useEffect 로 렌더링 후 작업을 처리", ex: "데이터 가져오기, 구독, 타이머처럼 렌더링 결과와 별개로 바깥 세계에 영향을 주는 부수 효과는 useEffect 안에서 실행한다. useState 는 값을 저장하는 훅이고, useMemo 는 계산 결과를 기억해 두는 최적화 훅이며, useRef 는 렌더링과 무관하게 값이나 DOM 을 붙잡아 두는 훅이다." },
  { k: "문법", ex0: "const [n, setN] = useState(0) 형태", ex: "useState 는 [현재 값, 변경 함수] 두 개짜리 배열을 돌려준다. 그래서 const [n, setN] = useState(0) 처럼 배열 구조 분해로 받는다. 값 하나나 함수 하나만 돌려주는 것이 아니고, 객체가 아니라 배열이기 때문에 이름을 자유롭게 지을 수 있다." },
  { k: "데이터", ex0: "fetch() 로 API 데이터를 불러온다", ex: "브라우저가 기본으로 제공하는 네트워크 요청 함수는 fetch() 다. Promise 를 돌려주므로 then 이나 await 로 응답을 받는다. get() 과 load() 는 브라우저 표준 함수가 아니고, import() 는 자바스크립트 모듈을 동적으로 불러오는 문법이라 서버 데이터 요청과 다르다. axios 는 fetch 를 감싼 외부 라이브러리다." }
] };
