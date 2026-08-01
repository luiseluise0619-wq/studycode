/* React 기초·중급 유닛 실습.
   'React 기초' 8문항, 'React 더 배우기' 12문항 — 둘 다 실습 0이다.
   컴포넌트를 한 줄도 안 쓰고 훅 얘기를 읽기만 한다.

   채점은 진짜 React 로 마운트한 뒤 클릭·입력을 넣고 DOM 을 본다.
   도우미: Q QA COUNT TXT ATTR CLICK CLICKN TYPE — CLICK 은 flushSync 로 감싸므로
   누른 직후의 화면을 바로 확인할 수 있다. 컴포넌트 이름은 반드시 App 이다.

   문제는 전부 '화면이 안 바뀐다' 는 증상으로 골랐다. React 초보가 가장 오래 헤매는 곳이고,
   원인이 눈에 보이지 않아 혼자서는 못 빠져나온다. */
module.exports = [
{
  unit: "React 기초",
  lesson: "직접 만들어 보기 — 상태로 화면 바꾸기",
  th: {
    sum: "화면을 바꾸는 유일한 방법은 **상태를 바꾸는 것**이다. 값을 직접 고쳐도 React 는 모른다.",
    body: [
      { h: "왜 화면이 안 바뀌나", t: "보통 변수를 고치면 값은 바뀌지만 React 는 다시 그릴 이유를 알지 못한다. `useState` 가 준 setter 를 불러야 '바뀌었다' 는 신호가 간다. 그 신호를 받으면 컴포넌트 함수가 통째로 다시 실행되고, 그 결과로 새 화면이 만들어진다." },
      { h: "다시 그려도 값이 남는 이유", t: "컴포넌트 함수는 상태가 바뀔 때마다 처음부터 다시 실행된다. 그런데도 `React.useState(0)` 이 매번 0으로 돌아가지 않는 것은, React 가 그 값을 컴포넌트 바깥에 따로 보관하기 때문이다." },
    ],
    code: { c: "function App() {\n  const [n, setN] = React.useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}", cap: "setter 를 불러야 다시 그린다" },
    key: ["보통 변수를 고쳐도 화면은 안 바뀐다", "setter 를 부르면 컴포넌트가 다시 실행된다", "컴포넌트 이름은 `App`"],
  },
  q: [
    {
      k: "counter · 눌러서 올라가는 숫자",
      q: "버튼을 누르면 숫자가 1씩 올라가게 하세요. 숫자는 <code>.cnt</code>, 버튼은 <code>.inc</code> 이고 처음 값은 0 입니다.",
      src: "function App() {\n  let n = 0;\n  return (\n    <div>\n      <span className=\"cnt\">{n}</span>\n      <button className=\"inc\" onClick={() => { n = n + 1; }}>+1</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [n, setN] = React.useState(0);\n  return (\n    <div>\n      <span className=\"cnt\">{n}</span>\n      <button className=\"inc\" onClick={() => setN(n + 1)}>+1</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음 값이 0 이다", js: "TXT('.cnt')==='0'" },
        { d: "한 번 누르면 1", js: "(CLICK('.inc'), TXT('.cnt')==='1')" },
        { d: "두 번 더 누르면 3", js: "(CLICK('.inc'),CLICK('.inc'), TXT('.cnt')==='3')" },
      ],
      ex: "보통 변수 n 을 고치면 값은 바뀌지만 React 는 다시 그릴 이유를 모릅니다. 게다가 다시 그려질 때 n 은 또 0 으로 시작해요. useState 가 준 setter 를 불러야 합니다.",
    },
    {
      k: "toggle · 눌러서 보였다 숨었다",
      q: "버튼(<code>.btn</code>)을 누를 때마다 <code>.msg</code> 가 보였다 사라지게 하세요. 처음에는 <b>숨어 있어야</b> 합니다.",
      src: "function App() {\n  const [open, setOpen] = React.useState(true);\n  return (\n    <div>\n      <button className=\"btn\" onClick={() => setOpen(true)}>토글</button>\n      {open && <p className=\"msg\">안녕</p>}\n    </div>\n  );\n}",
      sol: "function App() {\n  const [open, setOpen] = React.useState(false);\n  return (\n    <div>\n      <button className=\"btn\" onClick={() => setOpen(!open)}>토글</button>\n      {open && <p className=\"msg\">안녕</p>}\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 숨어 있다", js: "COUNT('.msg')===0" },
        { d: "한 번 누르면 보인다", js: "(CLICK('.btn'), COUNT('.msg')===1)" },
        { d: "다시 누르면 숨는다", js: "(CLICK('.btn'), COUNT('.msg')===0)" },
      ],
      ex: "처음 값이 true 라 이미 보이고, onClick 이 항상 true 로만 바꿔서 다시 눌러도 그대로입니다. 뒤집으려면 !open 을 넣어야 해요.",
    },
  ],
},
{
  unit: "React 더 배우기",
  lesson: "직접 만들어 보기 — 목록과 전달",
  th: {
    sum: "배열을 화면으로 바꿀 때는 `map` 을 쓰고, 각 항목에 `key` 를 준다.",
    body: [
      { h: "key 가 하는 일", t: "`key` 는 다시 그릴 때 '이 항목이 아까 그 항목' 임을 알려 주는 표다. 없으면 React 가 순서로 짐작하다가, 중간에 항목이 끼어들면 엉뚱한 자리의 내용이 남는다. 목록에서 값이 이상하게 섞이면 먼저 key 를 의심한다." },
      { h: "props 는 아래로만", t: "부모가 자식에게 값을 내려 주는 것이 `props` 다. 자식은 받은 props 를 고칠 수 없다 — 바꿔야 하면 부모가 준 함수를 부른다. 이 방향이 지켜져야 '누가 바꿨는지' 를 추적할 수 있다." },
    ],
    code: { c: "function App() {\n  const items = ['가', '나'];\n  return <ul>{items.map(x => <li key={x}>{x}</li>)}</ul>;\n}", cap: "map 으로 펼치고 key 를 붙인다" },
    key: ["배열은 `map` 으로 펼친다", "각 항목에 `key` 를 준다", "props 는 자식이 고칠 수 없다"],
  },
  q: [
    {
      k: "list · 배열을 목록으로",
      q: "<code>items</code> 배열을 <code>&lt;li&gt;</code> 목록으로 그리세요. 각 항목에는 <b>key</b> 를 주고, 글자는 배열 값 그대로입니다.",
      src: "function App() {\n  const items = ['사과', '배', '감'];\n  return (\n    <ul className=\"list\">\n      <li>{items}</li>\n    </ul>\n  );\n}",
      sol: "function App() {\n  const items = ['사과', '배', '감'];\n  return (\n    <ul className=\"list\">\n      {items.map(x => <li key={x}>{x}</li>)}\n    </ul>\n  );\n}",
      tests: [
        { d: "li 가 세 개다", js: "COUNT('.list li')===3" },
        { d: "첫 항목이 '사과' 다", js: "QA('.list li')[0].textContent.trim()==='사과'" },
        { d: "마지막 항목이 '감' 이다", js: "QA('.list li')[2].textContent.trim()==='감'" },
      ],
      ex: "배열을 그대로 넣으면 React 가 값을 이어 붙여 한 줄로 그립니다. 항목마다 태그를 만들려면 map 으로 펼쳐야 해요.",
    },
    {
      k: "props · 값을 내려 주기",
      q: "<code>Item</code> 이 받은 이름을 <code>.name</code> 안에 보여 주도록 <b>props 를 이어</b> 주세요. 목록은 <code>['가영','나연']</code> 입니다.",
      src: "function Item(props) {\n  return <span className=\"name\">이름</span>;\n}\nfunction App() {\n  const names = ['가영', '나연'];\n  return <div>{names.map(n => <Item key={n} name={n} />)}</div>;\n}",
      sol: "function Item(props) {\n  return <span className=\"name\">{props.name}</span>;\n}\nfunction App() {\n  const names = ['가영', '나연'];\n  return <div>{names.map(n => <Item key={n} name={n} />)}</div>;\n}",
      tests: [
        { d: "이름이 두 개 그려진다", js: "COUNT('.name')===2" },
        { d: "첫 이름이 '가영' 이다", js: "QA('.name')[0].textContent.trim()==='가영'" },
        { d: "둘째 이름이 '나연' 이다", js: "QA('.name')[1].textContent.trim()==='나연'" },
      ],
      ex: "부모가 name 을 내려 주고 있는데 자식이 쓰지 않아 글자가 고정돼 있습니다. props.name 을 화면에 넣어야 해요.",
    },
  ],
},
{
  unit: "폼 실무 심화: 제어 컴포넌트와 비제어 컴포넌트",
  lesson: "직접 만들어 보기 — 입력을 상태와 잇기",
  th: {
    sum: "제어 컴포넌트는 입력칸의 값을 **상태가 정한다.** 그래서 `value` 와 `onChange` 는 반드시 짝이다.",
    body: [
      { h: "value 만 주면 못 친다", t: "`value={text}` 만 주고 `onChange` 를 빼면, 타이핑해도 상태가 안 바뀌고 React 가 매번 원래 값으로 되돌려 놓는다. 입력칸이 얼어붙은 것처럼 보이는 전형적인 증상이다." },
      { h: "제어와 비제어", t: "값을 상태로 들고 있으면 제어, DOM 에 맡기고 `ref` 로 꺼내 쓰면 비제어다. 글자마다 검사·버튼 활성화가 필요하면 제어가 낫고, 제출할 때 한 번만 읽으면 비제어가 가볍다. 둘을 섞으면(값은 상태인데 초기값만 `defaultValue`) 경고가 난다." },
    ],
    code: { c: "const [text, setText] = React.useState(\"\");\n<input value={text} onChange={e => setText(e.target.value)} />", cap: "value 와 onChange 는 짝이다" },
    key: ["`value` 만 주면 입력이 얼어붙는다", "제어는 상태가 값을 정한다", "비제어는 `ref` 로 꺼내 쓴다"],
  },
  q: [
    {
      k: "input · 친 글자를 그대로 보여 주기",
      q: "입력칸(<code>.in</code>)에 친 글자가 <code>.out</code> 에 그대로 나오게 하세요.",
      src: "function App() {\n  const [text, setText] = React.useState(\"\");\n  return (\n    <div>\n      <input className=\"in\" value={text} />\n      <p className=\"out\">{text}</p>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [text, setText] = React.useState(\"\");\n  return (\n    <div>\n      <input className=\"in\" value={text} onChange={e => setText(e.target.value)} />\n      <p className=\"out\">{text}</p>\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 비어 있다", js: "TXT('.out')===''" },
        { d: "치면 그대로 나온다", js: "(TYPE('.in','안녕'), TXT('.out')==='안녕')" },
        { d: "고쳐 치면 따라 바뀐다", js: "(TYPE('.in','바뀜'), TXT('.out')==='바뀜')" },
      ],
      ex: "value 만 주고 onChange 가 없으면 상태가 안 바뀌고, React 가 입력칸을 매번 원래 값으로 되돌려 놓습니다. 얼어붙은 것처럼 보여요.",
    },
    {
      k: "submit · 빈 값은 막기",
      q: "입력칸이 <b>비어 있으면</b> 버튼(<code>.add</code>)을 <b>누를 수 없게</b> 하고, 값이 있으면 눌러서 <code>.done</code> 에 그 값을 보여 주세요.",
      src: "function App() {\n  const [text, setText] = React.useState(\"\");\n  const [done, setDone] = React.useState(\"\");\n  return (\n    <div>\n      <input className=\"in\" value={text} onChange={e => setText(e.target.value)} />\n      <button className=\"add\" onClick={() => setDone(text)}>담기</button>\n      <p className=\"done\">{done}</p>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [text, setText] = React.useState(\"\");\n  const [done, setDone] = React.useState(\"\");\n  return (\n    <div>\n      <input className=\"in\" value={text} onChange={e => setText(e.target.value)} />\n      <button className=\"add\" disabled={text.trim() === \"\"} onClick={() => setDone(text)}>담기</button>\n      <p className=\"done\">{done}</p>\n    </div>\n  );\n}",
      tests: [
        { d: "비어 있으면 버튼을 누를 수 없다", js: "Q('.add').disabled===true" },
        { d: "값을 치면 누를 수 있다", js: "(TYPE('.in','우유'), Q('.add').disabled===false)" },
        { d: "누르면 값이 담긴다", js: "(CLICK('.add'), TXT('.done')==='우유')" },
      ],
      ex: "빈 값으로도 담기가 눌려 빈 항목이 들어갑니다. 값이 비었는지 보고 disabled 를 걸어야 해요 — 공백만 친 경우도 막아야 합니다.",
    },
  ],
},
{
  unit: "리스트와 key 심화 — 재조정 규칙·순서 변경·가상화 (중급)",
  lesson: "직접 만들어 보기 — 배열 상태 바꾸기",
  th: {
    sum: "배열 상태는 **고치지 말고 새로 만든다.** 같은 배열을 다시 넣으면 React 는 바뀐 줄 모른다.",
    body: [
      { h: "왜 안 그려지나", t: "`items.push(x)` 는 배열 안을 고칠 뿐 배열 자체는 같은 것이다. `setItems(items)` 로 같은 것을 다시 넣으면 React 는 '전과 같다' 고 보고 그냥 넘어간다. `setItems([...items, x])` 처럼 **새 배열**을 만들어야 한다." },
      { h: "지울 때도 마찬가지", t: "`splice` 는 원본을 고친다. `filter` 는 새 배열을 돌려준다. 지우기는 `filter`, 바꾸기는 `map` 을 쓰면 자연스럽게 새 배열이 나온다." },
    ],
    code: { c: "setItems([...items, x]);              // 더하기\nsetItems(items.filter(v => v !== x)); // 지우기\nsetItems(items.map(v => v === a ? b : v)); // 바꾸기", cap: "고치지 말고 새로 만든다" },
    key: ["`push`·`splice` 는 원본을 고친다 — 안 그려진다", "더하기는 `[...items, x]`", "지우기는 `filter`"],
  },
  q: [
    {
      k: "add · 목록에 더하기",
      q: "버튼(<code>.add</code>)을 누르면 목록에 항목이 하나씩 늘어나게 하세요. 처음에는 <code>'가'</code> 하나뿐입니다.",
      src: "function App() {\n  const [items, setItems] = React.useState(['가']);\n  const add = () => {\n    items.push('나');\n    setItems(items);\n  };\n  return (\n    <div>\n      <button className=\"add\" onClick={add}>추가</button>\n      <ul className=\"list\">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [items, setItems] = React.useState(['가']);\n  const add = () => {\n    setItems([...items, '나']);\n  };\n  return (\n    <div>\n      <button className=\"add\" onClick={add}>추가</button>\n      <ul className=\"list\">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 하나다", js: "COUNT('.list li')===1" },
        { d: "누르면 두 개가 된다", js: "(CLICK('.add'), COUNT('.list li')===2)" },
        { d: "한 번 더 누르면 세 개", js: "(CLICK('.add'), COUNT('.list li')===3)" },
      ],
      ex: "push 는 배열 안을 고칠 뿐 배열 자체는 같은 것입니다. 같은 것을 setItems 에 다시 넣으면 React 는 바뀐 줄 몰라 화면이 그대로예요.",
    },
    {
      k: "remove · 목록에서 지우기",
      q: "각 항목의 지우기 버튼(<code>.del</code>)을 누르면 <b>그 항목만</b> 사라지게 하세요. 목록은 <code>['가','나','다']</code> 입니다.",
      src: "function App() {\n  const [items, setItems] = React.useState(['가', '나', '다']);\n  const del = (i) => {\n    items.splice(i, 1);\n    setItems(items);\n  };\n  return (\n    <ul className=\"list\">\n      {items.map((x, i) => (\n        <li key={x}>\n          <span className=\"nm\">{x}</span>\n          <button className=\"del\" onClick={() => del(i)}>x</button>\n        </li>\n      ))}\n    </ul>\n  );\n}",
      sol: "function App() {\n  const [items, setItems] = React.useState(['가', '나', '다']);\n  const del = (i) => {\n    setItems(items.filter((_, j) => j !== i));\n  };\n  return (\n    <ul className=\"list\">\n      {items.map((x, i) => (\n        <li key={x}>\n          <span className=\"nm\">{x}</span>\n          <button className=\"del\" onClick={() => del(i)}>x</button>\n        </li>\n      ))}\n    </ul>\n  );\n}",
      tests: [
        { d: "처음에는 세 개다", js: "COUNT('.list li')===3" },
        { d: "가운데를 지우면 두 개가 된다", js: "(CLICKN('.del',1), COUNT('.list li')===2)" },
        { d: "남은 것이 '가' 와 '다' 다", js: "QA('.nm').map(function(e){return e.textContent.trim();}).join(',')==='가,다'" },
      ],
      ex: "splice 는 원본 배열을 고칩니다. 같은 배열을 다시 넣어 화면이 안 바뀌어요. filter 는 새 배열을 돌려주니 그대로 쓸 수 있습니다.",
    },
  ],
},
{
  unit: "useReducer와 복잡한 상태 전이 — 상태 머신·불변 갱신 (심화)",
  lesson: "직접 만들어 보기 — 리듀서로 상태 옮기기",
  th: {
    sum: "리듀서는 '지금 상태 + 무슨 일' 을 받아 **새 상태를 돌려주는 함수**다. 고쳐서 돌려주면 안 된다.",
    body: [
      { h: "새 객체를 돌려준다", t: "`state.n++` 후 `return state` 는 같은 객체를 돌려주는 것이라 React 가 바뀐 줄 모른다. `return { ...state, n: state.n + 1 }` 처럼 새 객체를 만들어야 한다. 배열도 마찬가지다." },
      { h: "언제 useReducer 인가", t: "상태가 여러 개인데 서로 얽혀 함께 움직이거나, '무슨 일이 일어났나' 를 이름으로 남기고 싶을 때 쓴다. 값 하나를 켰다 껐다 하는 정도면 `useState` 가 더 읽기 쉽다." },
    ],
    code: { c: "function reducer(state, action) {\n  switch (action.type) {\n    case 'inc': return { ...state, n: state.n + 1 };\n    default: return state;\n  }\n}", cap: "고치지 말고 새 객체를 돌려준다" },
    key: ["리듀서는 새 상태를 돌려준다", "같은 객체를 돌려주면 안 그려진다", "얽힌 상태가 여럿일 때 쓴다"],
  },
  q: [
    {
      k: "reducer · 새 상태를 돌려주기",
      q: "<code>.inc</code> 를 누르면 숫자가 1씩 오르고 <code>.reset</code> 을 누르면 0으로 돌아가게 하세요. 숫자는 <code>.cnt</code> 입니다.",
      src: "function reducer(state, action) {\n  if (action.type === 'inc') { state.n++; return state; }\n  if (action.type === 'reset') { state.n = 0; return state; }\n  return state;\n}\nfunction App() {\n  const [s, dispatch] = React.useReducer(reducer, { n: 0 });\n  return (\n    <div>\n      <span className=\"cnt\">{s.n}</span>\n      <button className=\"inc\" onClick={() => dispatch({ type: 'inc' })}>+1</button>\n      <button className=\"reset\" onClick={() => dispatch({ type: 'reset' })}>0</button>\n    </div>\n  );\n}",
      sol: "function reducer(state, action) {\n  if (action.type === 'inc') return { ...state, n: state.n + 1 };\n  if (action.type === 'reset') return { ...state, n: 0 };\n  return state;\n}\nfunction App() {\n  const [s, dispatch] = React.useReducer(reducer, { n: 0 });\n  return (\n    <div>\n      <span className=\"cnt\">{s.n}</span>\n      <button className=\"inc\" onClick={() => dispatch({ type: 'inc' })}>+1</button>\n      <button className=\"reset\" onClick={() => dispatch({ type: 'reset' })}>0</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음 값이 0 이다", js: "TXT('.cnt')==='0'" },
        { d: "두 번 누르면 2", js: "(CLICK('.inc'),CLICK('.inc'), TXT('.cnt')==='2')" },
        { d: "reset 을 누르면 0", js: "(CLICK('.reset'), TXT('.cnt')==='0')" },
      ],
      ex: "state.n++ 후 같은 객체를 돌려주면 React 는 전과 같다고 보고 다시 그리지 않습니다. 새 객체를 만들어 돌려줘야 해요.",
    },
    {
      k: "updater · 한 번에 두 번 올리기",
      q: "<code>.add2</code> 를 한 번 누르면 숫자가 <b>2</b> 오르게 하세요. 반드시 1씩 올리는 동작을 두 번 보내서 만듭니다.",
      src: "function App() {\n  const [n, setN] = React.useState(0);\n  const add2 = () => {\n    setN(n + 1);\n    setN(n + 1);\n  };\n  return (\n    <div>\n      <span className=\"cnt\">{n}</span>\n      <button className=\"add2\" onClick={add2}>+2</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [n, setN] = React.useState(0);\n  const add2 = () => {\n    setN(v => v + 1);\n    setN(v => v + 1);\n  };\n  return (\n    <div>\n      <span className=\"cnt\">{n}</span>\n      <button className=\"add2\" onClick={add2}>+2</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음 값이 0 이다", js: "TXT('.cnt')==='0'" },
        { d: "한 번 누르면 2", js: "(CLICK('.add2'), TXT('.cnt')==='2')" },
        { d: "또 누르면 4", js: "(CLICK('.add2'), TXT('.cnt')==='4')" },
      ],
      ex: "setN(n+1) 두 번은 같은 n 을 두 번 읽어 결국 1만 오릅니다. 앞의 결과 위에 쌓으려면 setN(v => v+1) 처럼 함수를 넘겨야 해요.",
    },
  ],
},
{
  unit: "컴포넌트 설계 심화: 합성과 커스텀 훅 실무",
  lesson: "직접 만들어 보기 — 합성과 커스텀 훅",
  th: {
    sum: "겹치는 **화면**은 `children` 으로 감싸고, 겹치는 **로직**은 커스텀 훅으로 뽑는다.",
    body: [
      { h: "children 으로 감싸기", t: "테두리·여백 같은 껍데기가 반복되면, 안쪽을 `props.children` 으로 받는 컴포넌트를 만든다. 안에 무엇이 들어올지 몰라도 되므로 재사용이 넓어진다 — 종류마다 prop 을 늘리는 것보다 낫다." },
      { h: "커스텀 훅은 그냥 함수다", t: "이름이 `use` 로 시작하고 안에서 훅을 부르는 함수일 뿐이다. 상태를 **공유하는 게 아니라 로직을 공유한다** — 두 컴포넌트가 같은 훅을 써도 상태는 각자 따로다. 여기를 헷갈리면 '왜 같이 안 움직이지' 로 한참 헤맨다." },
    ],
    code: { c: "function useCounter(init) {\n  const [n, setN] = React.useState(init);\n  return { n, inc: () => setN(v => v + 1) };\n}\n\nfunction Box(props) {\n  return <div className=\"box\">{props.children}</div>;\n}", cap: "화면은 children, 로직은 훅" },
    key: ["`props.children` 으로 안쪽을 받는다", "커스텀 훅은 `use` 로 시작하는 함수", "훅은 로직을 공유하지 상태를 공유하지 않는다"],
  },
  q: [
    {
      k: "children · 감싸는 컴포넌트",
      q: "<code>Box</code> 가 <b>안에 넣은 내용</b>을 그대로 보여 주게 하세요. <code>.box</code> 안에 <code>.inner</code> 가 있어야 합니다.",
      src: "function Box(props) {\n  return <div className=\"box\"></div>;\n}\nfunction App() {\n  return (\n    <Box>\n      <span className=\"inner\">안쪽 내용</span>\n    </Box>\n  );\n}",
      sol: "function Box(props) {\n  return <div className=\"box\">{props.children}</div>;\n}\nfunction App() {\n  return (\n    <Box>\n      <span className=\"inner\">안쪽 내용</span>\n    </Box>\n  );\n}",
      tests: [
        { d: "box 가 있다", js: "COUNT('.box')===1" },
        { d: "box 안에 inner 가 있다", js: "COUNT('.box .inner')===1" },
        { d: "안쪽 글자가 그대로다", js: "TXT('.box .inner')==='안쪽 내용'" },
      ],
      ex: "감싸는 컴포넌트가 props.children 을 그리지 않으면 안에 넣은 것이 통째로 사라집니다. 화면에는 빈 상자만 남아요.",
    },
    {
      k: "custom hook · 상태는 각자 따로",
      q: "<code>useCounter</code> 를 완성해 두 카운터가 <b>서로 영향 없이</b> 각자 세게 하세요. 숫자는 <code>.c</code>, 버튼은 <code>.b</code> 입니다.",
      src: "let shared = 0;\nfunction useCounter() {\n  const [, force] = React.useState(0);\n  return { n: shared, inc: () => { shared += 1; force(v => v + 1); } };\n}\nfunction One() {\n  const c = useCounter();\n  return <span><span className=\"c\">{c.n}</span><button className=\"b\" onClick={c.inc}>+</button></span>;\n}\nfunction App() {\n  return <div><One /><One /></div>;\n}",
      sol: "function useCounter() {\n  const [n, setN] = React.useState(0);\n  return { n, inc: () => setN(v => v + 1) };\n}\nfunction One() {\n  const c = useCounter();\n  return <span><span className=\"c\">{c.n}</span><button className=\"b\" onClick={c.inc}>+</button></span>;\n}\nfunction App() {\n  return <div><One /><One /></div>;\n}",
      tests: [
        { d: "둘 다 0 에서 시작한다", js: "QA('.c').map(function(e){return e.textContent.trim();}).join(',')==='0,0'" },
        { d: "첫째만 눌러도 둘째는 그대로다", js: "(CLICKN('.b',0), QA('.c').map(function(e){return e.textContent.trim();}).join(',')==='1,0')" },
        { d: "둘째를 누르면 둘째만 오른다", js: "(CLICKN('.b',1), QA('.c').map(function(e){return e.textContent.trim();}).join(',')==='1,1')" },
      ],
      ex: "훅 바깥의 변수를 쓰면 모든 컴포넌트가 그 하나를 나눠 씁니다. 훅은 로직을 공유하는 것이지 상태를 공유하는 게 아니에요 — 상태는 훅 안의 useState 로 각자 가져야 합니다.",
    },
  ],
},
];
