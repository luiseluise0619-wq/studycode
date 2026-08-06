/* React 실습 3차 — 실습이 하나도 없던 6개 유닛을 연다.
   Context · ref 와 DOM · 파생 상태 · 이벤트 처리 · 생명주기(useEffect) · 접근성.

   채점은 진짜 React 로 마운트한 뒤 클릭·입력을 넣고 DOM 을 본다.
   도우미: Q QA COUNT TXT ATTR CLICK CLICKN TYPE — CLICK 은 flushSync 로 감싸므로
   누른 직후의 화면을 바로 확인할 수 있다. 컴포넌트 이름은 반드시 App 이다.

   훅은 반드시 `React.useState` 처럼 앞에 React 를 붙인다. 하네스는 라이브러리를
   전역으로만 실어 주기 때문에, 그냥 `useState` 라고 쓰면 정답도 통과하지 못한다. */
module.exports = [
/* ── Context와 의존성 주입 ────────────────────────────────── */
{
  unit: "Context와 의존성 주입 — 언제 쓰고 언제 피할까 (중급)",
  lesson: "직접 짜 보기 — 깊은 곳까지 값 내려보내기",
  th: {
    sum: "Context 는 값을 **중간 컴포넌트를 거치지 않고** 아래로 바로 내려보내는 통로다.",
    body: [
      { h: "prop 을 한 단계씩 넘기는 지겨움", t: "테마나 로그인 정보처럼 깊은 곳에서 쓰는 값을, 중간 컴포넌트들이 쓰지도 않으면서 계속 받아 넘겨야 할 때가 있다. 중간 하나만 빠뜨려도 아래가 값을 못 받는다. Context 는 그 사슬을 건너뛴다." },
      { h: "Provider 로 감싼 안쪽만 받는다", t: "`<Ctx.Provider value={v}>` 로 감싼 **안쪽**에서만 그 값이 보인다. 감싸는 것을 잊으면 아래에서는 만들 때 정한 기본값이 나온다. 오류가 아니라 기본값이라, '왜 옛날 값이 나오지' 로 나타난다." },
      { h: "값이 바뀌면 쓰는 곳이 다시 그려진다", t: "Context 값이 바뀌면 그 값을 쓰는 컴포넌트가 전부 다시 그려진다. 자주 바뀌는 값을 큰 Context 하나에 몰아 두면 관계없는 화면까지 같이 다시 그려진다. 자주 바뀌는 것과 거의 안 바뀌는 것은 나눠 담는다." },
    ],
    code: { c: "const Ctx = React.createContext('밝게');\n\n<Ctx.Provider value=\"어둡게\">\n  <Deep />\n</Ctx.Provider>\n\nconst v = React.useContext(Ctx);", cap: "감싼 안쪽에서만 보인다" },
    key: ["중간을 건너뛰는 통로", "`Provider` 안쪽만 받는다", "바뀌면 쓰는 곳이 다시 그려진다"],
  },
  q: [
    {
      k: "theme · 깊은 곳까지 값 내려보내기",
      q: "<code>Deep</code> 이 <b>Context 로</b> 테마를 받아 <code>.theme</code> 에 보여 주게 하세요. 값은 <code>\"어둡게\"</code> 입니다.",
      src: "const Ctx = React.createContext('밝게');\n\nfunction Deep() {\n  return <span className=\"theme\">{'밝게'}</span>;\n}\n\nfunction App() {\n  return (\n    <Ctx.Provider value=\"어둡게\">\n      <Deep />\n    </Ctx.Provider>\n  );\n}",
      sol: "const Ctx = React.createContext('밝게');\n\nfunction Deep() {\n  const v = React.useContext(Ctx);\n  return <span className=\"theme\">{v}</span>;\n}\n\nfunction App() {\n  return (\n    <Ctx.Provider value=\"어둡게\">\n      <Deep />\n    </Ctx.Provider>\n  );\n}",
      tests: [
        { d: "Provider 가 준 값이 보인다", js: "TXT('.theme')==='어둡게'" },
        { d: "칸이 하나 있다", js: "COUNT('.theme')===1" },
      ],
      ex: "값을 화면에 그대로 적어 두면 Provider 가 무엇을 주든 달라지지 않습니다. useContext 로 받아야 위에서 내려보낸 값이 실제로 쓰여요.",
    },
    {
      k: "provider · 감싸야 값이 간다",
      q: "<code>App</code> 이 <code>Ctx.Provider</code> 로 아래를 감싸 <code>\"관리자\"</code> 를 내려보내게 하세요. <code>.role</code> 에 그 값이 보여야 합니다.",
      src: "const Ctx = React.createContext('손님');\n\nfunction Deep() {\n  const v = React.useContext(Ctx);\n  return <span className=\"role\">{v}</span>;\n}\n\nfunction App() {\n  return <Deep />;\n}",
      sol: "const Ctx = React.createContext('손님');\n\nfunction Deep() {\n  const v = React.useContext(Ctx);\n  return <span className=\"role\">{v}</span>;\n}\n\nfunction App() {\n  return (\n    <Ctx.Provider value=\"관리자\">\n      <Deep />\n    </Ctx.Provider>\n  );\n}",
      tests: [
        { d: "내려보낸 값이 보인다", js: "TXT('.role')==='관리자'" },
        { d: "기본값이 남아 있지 않다", js: "TXT('.role')!=='손님'" },
      ],
      ex: "Provider 로 감싸지 않으면 아래에서는 만들 때 정한 기본값이 나옵니다. 오류가 아니라 그럴듯한 값이라 '왜 옛날 값이 나오지' 로 한참 헤매요.",
    },
    {
      k: "count · Context 값을 바꾸기",
      q: "버튼(<code>.inc</code>)을 누르면 Context 로 내려간 숫자가 1씩 올라가게 하세요. 숫자는 <code>.n</code> 입니다.",
      src: "const Ctx = React.createContext(0);\n\nfunction Deep() {\n  const n = React.useContext(Ctx);\n  return <span className=\"n\">{n}</span>;\n}\n\nfunction App() {\n  const [n, setN] = React.useState(0);\n  return (\n    <div>\n      <Ctx.Provider value={0}>\n        <Deep />\n      </Ctx.Provider>\n      <button className=\"inc\" onClick={() => setN(n + 1)}>+1</button>\n    </div>\n  );\n}",
      sol: "const Ctx = React.createContext(0);\n\nfunction Deep() {\n  const n = React.useContext(Ctx);\n  return <span className=\"n\">{n}</span>;\n}\n\nfunction App() {\n  const [n, setN] = React.useState(0);\n  return (\n    <div>\n      <Ctx.Provider value={n}>\n        <Deep />\n      </Ctx.Provider>\n      <button className=\"inc\" onClick={() => setN(n + 1)}>+1</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음은 0", js: "TXT('.n')==='0'" },
        { d: "누르면 1", js: "(CLICK('.inc'), TXT('.n')==='1')" },
        { d: "두 번 더 누르면 3", js: "(CLICK('.inc'),CLICK('.inc'), TXT('.n')==='3')" },
      ],
      ex: "Provider 에 고정된 값을 넣어 두면 상태가 아무리 바뀌어도 아래는 그대로입니다. 상태를 그대로 value 에 넣어야 바뀔 때마다 아래도 다시 그려져요.",
    },
  ],
},
/* ── ref와 DOM 제어 ───────────────────────────────────────── */
{
  unit: "ref와 DOM 제어 — forwardRef·useImperativeHandle·측정과 포커스 (중급)",
  lesson: "직접 짜 보기 — 화면 요소를 직접 만지기",
  th: {
    sum: "`ref` 는 화면에 그려진 **진짜 요소를 잡는 손잡이**다. 포커스를 주거나 크기를 잴 때 쓴다.",
    body: [
      { h: "상태로 할 수 없는 일이 있다", t: "포커스를 주는 것, 크기를 재는 것, 스크롤 위치를 옮기는 것은 화면에 그려진 요소에 직접 시켜야 한다. 이런 일까지 상태로 흉내 내려 하면 코드만 복잡해진다. 그때만 `ref` 를 쓴다." },
      { h: "ref 는 바뀌어도 다시 그리지 않는다", t: "`useRef` 로 만든 상자의 `.current` 를 바꿔도 화면은 다시 그려지지 않는다. 그래서 '화면에 보여야 하는 값' 을 여기 담으면 숫자가 바뀌어도 화면이 그대로다. 보여 줄 값은 상태에, 기억만 할 값은 ref 에 담는다." },
      { h: "그려진 뒤에야 잡힌다", t: "처음 그리는 도중에는 `ref.current` 가 아직 비어 있다. 그래서 포커스나 측정은 `useEffect` 안에서 한다 — 그때는 이미 화면에 붙어 있다. 본문에서 바로 쓰면 `null` 을 만진다." },
    ],
    code: { c: "const box = React.useRef(null);\nReact.useEffect(() => { box.current.focus(); }, []);\n\n<input ref={box} />", cap: "그려진 뒤에 만진다" },
    key: ["`ref` 는 진짜 요소의 손잡이", "바뀌어도 다시 그리지 않는다", "`useEffect` 안에서 만진다"],
  },
  q: [
    {
      k: "autofocus · 처음에 입력칸으로 커서 보내기",
      q: "화면이 뜨면 입력칸(<code>.in</code>)에 <b>커서가 가 있게</b> 하세요.",
      src: "function App() {\n  const box = React.useRef(null);\n  return <input className=\"in\" />;\n}",
      sol: "function App() {\n  const box = React.useRef(null);\n  React.useEffect(() => {\n    box.current.focus();\n  }, []);\n  return <input className=\"in\" ref={box} />;\n}",
      tests: [
        { d: "입력칸이 있다", js: "COUNT('.in')===1" },
        { d: "커서가 입력칸에 있다", js: "document.activeElement === Q('.in')" },
      ],
      ex: "ref 를 만들어 두기만 하고 요소에 붙이지 않으면 아무것도 잡히지 않습니다. ref 속성으로 연결하고, 화면에 붙은 뒤인 useEffect 안에서 focus 를 줘야 해요.",
    },
    {
      k: "showCount · 보여 줄 값은 상태에",
      q: "버튼(<code>.inc</code>)을 누르면 <code>.cnt</code> 의 숫자가 1씩 <b>올라가 보이게</b> 하세요.",
      src: "function App() {\n  const n = React.useRef(0);\n  return (\n    <div>\n      <span className=\"cnt\">{n.current}</span>\n      <button className=\"inc\" onClick={() => { n.current += 1; }}>+1</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [n, setN] = React.useState(0);\n  return (\n    <div>\n      <span className=\"cnt\">{n}</span>\n      <button className=\"inc\" onClick={() => setN(n + 1)}>+1</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음은 0", js: "TXT('.cnt')==='0'" },
        { d: "누르면 1", js: "(CLICK('.inc'), TXT('.cnt')==='1')" },
        { d: "세 번 누르면 3", js: "(CLICK('.inc'),CLICK('.inc'), TXT('.cnt')==='3')" },
      ],
      ex: "ref 의 값을 바꿔도 React 는 다시 그리지 않습니다. 값은 실제로 올라가는데 화면만 0에 멈춰 있어요. 보여 줄 값은 상태에 담아야 합니다.",
    },
    {
      k: "clearOnClick · 버튼으로 입력칸 비우기",
      q: "버튼(<code>.clr</code>)을 누르면 입력칸(<code>.in</code>)이 <b>비고</b> 커서도 그리로 가게 하세요.",
      src: "function App() {\n  const [v, setV] = React.useState('가나');\n  const box = React.useRef(null);\n  return (\n    <div>\n      <input className=\"in\" ref={box} value={v} onChange={(e) => setV(e.target.value)} />\n      <button className=\"clr\" onClick={() => { box.current.focus(); }}>비우기</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [v, setV] = React.useState('가나');\n  const box = React.useRef(null);\n  return (\n    <div>\n      <input className=\"in\" ref={box} value={v} onChange={(e) => setV(e.target.value)} />\n      <button className=\"clr\" onClick={() => { setV(''); box.current.focus(); }}>비우기</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 값이 있다", js: "Q('.in').value==='가나'" },
        { d: "누르면 비워진다", js: "(CLICK('.clr'), Q('.in').value==='')" },
        { d: "커서가 입력칸으로 간다", js: "document.activeElement === Q('.in')" },
      ],
      ex: "값은 상태가 쥐고 있으니 ref 로 포커스만 줘서는 글자가 지워지지 않습니다. 지우는 것은 상태로, 커서를 옮기는 것은 ref 로 — 둘은 서로 다른 일이에요.",
    },
  ],
},
/* ── 파생 상태와 계산 캐싱 ────────────────────────────────── */
{
  unit: "React 중급 — 파생 상태와 계산 캐싱",
  lesson: "직접 짜 보기 — 계산할 수 있는 것은 담지 않기",
  th: {
    sum: "다른 상태에서 **계산해 낼 수 있는 값**은 상태로 담지 않는다. 담는 순간 두 값이 어긋난다.",
    body: [
      { h: "두 개를 두면 어긋난다", t: "목록과 '목록의 개수' 를 각각 상태로 두면, 목록을 고칠 때마다 개수도 같이 고쳐야 한다. 한 곳만 고치는 날이 반드시 오고, 그때 화면에는 목록 3개에 '2개' 라고 적힌다. 개수는 그릴 때 세면 어긋날 수가 없다." },
      { h: "그릴 때 계산한다", t: "`const n = items.length` 처럼 본문에서 계산하면 언제나 지금 상태와 맞는다. 필터링·정렬·합계도 마찬가지다. 계산이 무겁지 않다면 이게 가장 단순하고 가장 안전하다." },
      { h: "정말 무거울 때만 캐싱", t: "`useMemo` 는 '값이 안 바뀌었으면 지난 계산을 다시 쓰라' 는 표시다. 공짜가 아니라 비교하는 비용이 든다. 먼저 재 보고, 정말 오래 걸리는 계산에만 붙인다 — 습관처럼 다 붙이면 코드만 복잡해진다." },
    ],
    code: { c: "const [items, setItems] = React.useState([]);\nconst n = items.length;        // 상태로 담지 않는다\nconst done = items.filter(x => x.done);", cap: "계산되는 값은 계산한다" },
    key: ["계산되는 값은 담지 않는다", "그릴 때 계산하면 안 어긋난다", "`useMemo` 는 재 보고 붙인다"],
  },
  q: [
    {
      k: "count · 개수는 세어서 보여 주기",
      q: "버튼(<code>.add</code>)을 누르면 항목이 하나 늘고, <code>.n</code> 에 <b>지금 개수</b>가 보이게 하세요.",
      src: "function App() {\n  const [items, setItems] = React.useState([]);\n  const [n, setN] = React.useState(0);\n  return (\n    <div>\n      <span className=\"n\">{n}</span>\n      <button className=\"add\" onClick={() => setItems([...items, 1])}>추가</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [items, setItems] = React.useState([]);\n  return (\n    <div>\n      <span className=\"n\">{items.length}</span>\n      <button className=\"add\" onClick={() => setItems([...items, 1])}>추가</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음은 0", js: "TXT('.n')==='0'" },
        { d: "한 번 추가하면 1", js: "(CLICK('.add'), TXT('.n')==='1')" },
        { d: "세 번 추가하면 3", js: "(CLICK('.add'),CLICK('.add'), TXT('.n')==='3')" },
      ],
      ex: "개수를 따로 상태로 두면 목록을 고칠 때마다 개수도 같이 고쳐야 합니다. 한 곳만 고치는 날이 반드시 오고, 그때 화면에는 항목 3개에 '0' 이라고 적혀요.",
    },
    {
      k: "filtered · 걸러 낸 목록도 계산으로",
      q: "체크박스(<code>.only</code>)를 켜면 <b>끝난 것만</b> 보이게 하세요. 항목은 <code>.item</code> 입니다.",
      src: "function App() {\n  const [items] = React.useState([{ t: '가', done: true }, { t: '나', done: false }]);\n  const [only, setOnly] = React.useState(false);\n  const [shown, setShown] = React.useState(items);\n  return (\n    <div>\n      <input className=\"only\" type=\"checkbox\" checked={only} onChange={() => setOnly(!only)} />\n      {shown.map((it, i) => <span className=\"item\" key={i}>{it.t}</span>)}\n    </div>\n  );\n}",
      sol: "function App() {\n  const [items] = React.useState([{ t: '가', done: true }, { t: '나', done: false }]);\n  const [only, setOnly] = React.useState(false);\n  const shown = only ? items.filter(x => x.done) : items;\n  return (\n    <div>\n      <input className=\"only\" type=\"checkbox\" checked={only} onChange={() => setOnly(!only)} />\n      {shown.map((it, i) => <span className=\"item\" key={i}>{it.t}</span>)}\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 둘 다 보인다", js: "COUNT('.item')===2" },
        { d: "켜면 하나만 보인다", js: "(CLICK('.only'), COUNT('.item')===1)" },
        { d: "다시 끄면 둘 다", js: "(CLICK('.only'), COUNT('.item')===2)" },
      ],
      ex: "걸러 낸 결과를 따로 상태에 담아 두면, 조건이 바뀌어도 그 상태를 다시 계산해 넣기 전까지는 옛 목록이 그대로 보입니다. 그릴 때 계산하면 언제나 지금 조건과 맞아요.",
    },
    {
      k: "total · 합계는 그릴 때 더하기",
      q: "버튼(<code>.add</code>)을 누르면 <code>10</code>이 하나씩 쌓이고, <code>.sum</code> 에 <b>합계</b>가 보이게 하세요.",
      src: "function App() {\n  const [xs, setXs] = React.useState([]);\n  const [sum, setSum] = React.useState(0);\n  return (\n    <div>\n      <span className=\"sum\">{sum}</span>\n      <button className=\"add\" onClick={() => setXs([...xs, 10])}>추가</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [xs, setXs] = React.useState([]);\n  const sum = xs.reduce((a, b) => a + b, 0);\n  return (\n    <div>\n      <span className=\"sum\">{sum}</span>\n      <button className=\"add\" onClick={() => setXs([...xs, 10])}>추가</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음은 0", js: "TXT('.sum')==='0'" },
        { d: "한 번 누르면 10", js: "(CLICK('.add'), TXT('.sum')==='10')" },
        { d: "세 번 누르면 30", js: "(CLICK('.add'),CLICK('.add'), TXT('.sum')==='30')" },
      ],
      ex: "합계를 따로 담아 두면 목록만 늘고 합계는 0에 멈춰 있습니다. 목록에서 바로 더하면 두 값이 어긋날 자리 자체가 없어져요.",
    },
  ],
},
/* ── 이벤트 처리 실무 ─────────────────────────────────────── */
{
  unit: "React 중급 — 이벤트 처리 실무",
  lesson: "직접 짜 보기 — 눌린 것과 새어 나가는 것",
  th: {
    sum: "이벤트는 누른 곳에서 **위로 타고 올라간다.** 그래서 안쪽을 눌렀는데 바깥 것도 같이 실행된다.",
    body: [
      { h: "위로 올라간다(버블링)", t: "안쪽 버튼을 누르면 그 버튼의 처리기가 돌고, 이어서 바깥 상자의 처리기도 돈다. 목록 항목 안의 '삭제' 를 눌렀는데 항목 열기까지 같이 일어나는 사고가 이것이다. `e.stopPropagation()` 으로 거기서 멈춘다." },
      { h: "폼은 기본 동작이 있다", t: "`<form>` 안에서 제출하면 브라우저가 페이지를 새로 연다. React 앱에서는 대개 원하지 않는 동작이라 `e.preventDefault()` 로 막는다. 안 막으면 입력하던 값이 통째로 사라진다." },
      { h: "처리기는 함수를 넘긴다", t: "`onClick={f()}` 라고 쓰면 그리는 순간 함수가 **바로 실행되고** 그 결과가 처리기로 등록된다. `onClick={f}` 나 `onClick={() => f(x)}` 로 써야 누를 때 실행된다." },
    ],
    code: { c: "<button onClick={(e) => { e.stopPropagation(); del(); }}>삭제</button>\n\n<form onSubmit={(e) => { e.preventDefault(); save(); }}>", cap: "멈출 곳과 막을 곳" },
    key: ["이벤트는 위로 올라간다", "폼 제출은 막아야 한다", "처리기에는 함수를 넘긴다"],
  },
  q: [
    {
      k: "stop · 바깥까지 새어 나가지 않게",
      q: "안쪽 버튼(<code>.del</code>)을 눌렀을 때 <b>바깥 상자</b>의 처리기는 돌지 않게 하세요. 바깥이 돌면 <code>.open</code> 이 <code>1</code>이 됩니다.",
      src: "function App() {\n  const [open, setOpen] = React.useState(0);\n  const [del, setDel] = React.useState(0);\n  return (\n    <div onClick={() => setOpen(1)}>\n      <span className=\"open\">{open}</span>\n      <span className=\"cnt\">{del}</span>\n      <button className=\"del\" onClick={() => setDel(1)}>삭제</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [open, setOpen] = React.useState(0);\n  const [del, setDel] = React.useState(0);\n  return (\n    <div onClick={() => setOpen(1)}>\n      <span className=\"open\">{open}</span>\n      <span className=\"cnt\">{del}</span>\n      <button className=\"del\" onClick={(e) => { e.stopPropagation(); setDel(1); }}>삭제</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 둘 다 0", js: "TXT('.open')==='0' && TXT('.cnt')==='0'" },
        { d: "삭제를 누르면 삭제만 1", js: "(CLICK('.del'), TXT('.cnt')==='1')" },
        { d: "바깥은 돌지 않았다", js: "TXT('.open')==='0'" },
      ],
      ex: "이벤트는 누른 곳에서 위로 타고 올라갑니다. 항목 안의 '삭제' 를 눌렀는데 항목 열기까지 같이 일어나는 사고가 이것이에요. stopPropagation 으로 거기서 멈춥니다.",
    },
    {
      k: "submit · 새로 열리지 않게 막기",
      q: "폼을 제출하면 <b>페이지를 새로 열지 않고</b> <code>.out</code> 에 입력값이 나오게 하세요.",
      src: "function App() {\n  const [v, setV] = React.useState('가');\n  const [out, setOut] = React.useState('');\n  return (\n    <form onSubmit={() => setOut(v)}>\n      <input className=\"in\" value={v} onChange={(e) => setV(e.target.value)} />\n      <button className=\"go\" type=\"submit\">보내기</button>\n      <span className=\"out\">{out}</span>\n    </form>\n  );\n}",
      sol: "function App() {\n  const [v, setV] = React.useState('가');\n  const [out, setOut] = React.useState('');\n  return (\n    <form onSubmit={(e) => { e.preventDefault(); setOut(v); }}>\n      <input className=\"in\" value={v} onChange={(e) => setV(e.target.value)} />\n      <button className=\"go\" type=\"submit\">보내기</button>\n      <span className=\"out\">{out}</span>\n    </form>\n  );\n}",
      /* 버튼을 눌러 진짜로 제출시키지 않는다. 검사용 iframe 은 샌드박스라 폼 전송이
         아예 막히고, 그러면 submit 이벤트가 React 까지 오지 않아 정답도 떨어진다.
         대신 취소 가능한 submit 이벤트를 직접 보내고, 막혔는지를 그 이벤트에서 읽는다. */
      tests: [
        { d: "처음에는 비어 있다", js: "TXT('.out')===''" },
        { d: "보내면 값이 나온다", js: "(function(){var ev=new Event('submit',{bubbles:true,cancelable:true});ReactDOM.flushSync(function(){Q('form').dispatchEvent(ev);});return TXT('.out')==='가';})()" },
        { d: "기본 동작을 막았다", js: "(function(){var ev=new Event('submit',{bubbles:true,cancelable:true});ReactDOM.flushSync(function(){Q('form').dispatchEvent(ev);});return ev.defaultPrevented;})()" },
      ],
      ex: "폼 제출은 브라우저가 페이지를 새로 여는 기본 동작을 갖고 있습니다. React 앱에서는 대개 원하지 않는 동작이라, preventDefault 로 막지 않으면 입력하던 값이 통째로 사라져요.",
    },
    {
      k: "handler · 누를 때 실행되게",
      q: "버튼(<code>.go</code>)을 <b>누를 때</b> <code>.out</code> 이 <code>\"눌림\"</code> 이 되게 하세요. 그리는 순간이 아닙니다.",
      src: "function App() {\n  const [out, setOut] = React.useState('');\n  const hit = () => setOut('눌림');\n  return (\n    <div>\n      <span className=\"out\">{out}</span>\n      <button className=\"go\" onClick={hit()}>누르기</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [out, setOut] = React.useState('');\n  const hit = () => setOut('눌림');\n  return (\n    <div>\n      <span className=\"out\">{out}</span>\n      <button className=\"go\" onClick={hit}>누르기</button>\n    </div>\n  );\n}",
      tests: [
        { d: "그리는 순간에는 비어 있다", js: "TXT('.out')===''" },
        { d: "누르면 바뀐다", js: "(CLICK('.go'), TXT('.out')==='눌림')" },
      ],
      ex: "onClick={hit()} 은 그리는 순간 함수를 실행하고 그 결과를 처리기로 등록합니다. 그래서 누르기도 전에 값이 바뀌어 있어요. 함수 자체를 넘기거나 화살표로 감싸야 합니다.",
    },
  ],
},
/* ── 생명주기를 훅으로 사고하기 ───────────────────────────── */
{
  unit: "React 중급 — 생명주기를 훅으로 사고하기",
  lesson: "직접 짜 보기 — 언제 다시 돌지 정하기",
  th: {
    sum: "`useEffect` 는 '그린 뒤에 할 일' 이다. **의존성 배열**이 언제 다시 돌지를 정한다.",
    body: [
      { h: "배열이 없으면 매번 돈다", t: "두 번째 인자를 안 주면 그릴 때마다 매번 실행된다. 그 안에서 상태를 바꾸면 다시 그려지고 또 실행되어 끝없이 돈다. 화면이 멎거나 요청이 무한히 나가는 사고의 대부분이 이것이다." },
      { h: "빈 배열은 처음 한 번", t: "`[]` 를 주면 처음 붙을 때 한 번만 돈다. 처음 자료를 불러오거나 구독을 시작할 때 쓴다. 값이 바뀌면 다시 해야 하는 일이라면 그 값을 배열에 적어야 한다 — 안 적으면 옛 값이 계속 쓰인다." },
      { h: "치운 것은 반드시 되돌린다", t: "타이머를 걸었거나 이벤트를 붙였으면, `useEffect` 가 돌려주는 함수에서 없애야 한다. 안 없애면 화면을 떠난 뒤에도 계속 돌면서 쌓인다. 여러 번 들락거리면 그만큼 겹쳐 돈다." },
    ],
    code: { c: "React.useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);   // 반드시 되돌린다\n}, []);", cap: "언제 돌지, 무엇을 되돌릴지" },
    key: ["배열이 없으면 매번", "`[]` 는 처음 한 번", "건 것은 되돌린다"],
  },
  q: [
    {
      k: "once · 처음 한 번만 하기",
      q: "화면이 뜰 때 <b>한 번만</b> 준비 작업을 하게 하세요. <code>.n</code> 에 <code>1</code>이 보여야 하고, 눌러도 늘면 안 됩니다.",
      src: "function App() {\n  const [n, setN] = React.useState(0);\n  const [x, setX] = React.useState(0);\n  React.useEffect(() => {\n    setN((v) => v + 1);\n  });\n  return (\n    <div>\n      <span className=\"n\">{n}</span>\n      <button className=\"go\" onClick={() => setX(x + 1)}>+1</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [n, setN] = React.useState(0);\n  const [x, setX] = React.useState(0);\n  React.useEffect(() => {\n    setN((v) => v + 1);\n  }, []);\n  return (\n    <div>\n      <span className=\"n\">{n}</span>\n      <button className=\"go\" onClick={() => setX(x + 1)}>+1</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음에 한 번만 돈다", js: "new Promise(function(r){setTimeout(function(){r(TXT('.n')==='1');},60);})" },
        { d: "다른 버튼을 눌러도 늘지 않는다", js: "(CLICK('.go'), new Promise(function(r){setTimeout(function(){r(TXT('.n')==='1');},60);}))" },
      ],
      ex: "의존성 배열을 안 주면 그릴 때마다 매번 돕니다. 그 안에서 상태를 바꾸면 다시 그려지고 또 돌아 끝없이 반복돼요. 처음 한 번이면 빈 배열을 줍니다.",
    },
    {
      k: "deps · 값이 바뀌면 다시 하기",
      q: "<code>.go</code> 를 눌러 값이 바뀔 때마다 <code>.copy</code> 도 <b>같이 따라오게</b> 하세요.",
      src: "function App() {\n  const [n, setN] = React.useState(0);\n  const [copy, setCopy] = React.useState(0);\n  React.useEffect(() => {\n    setCopy(n);\n  }, []);\n  return (\n    <div>\n      <span className=\"n\">{n}</span>\n      <span className=\"copy\">{copy}</span>\n      <button className=\"go\" onClick={() => setN(n + 1)}>+1</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [n, setN] = React.useState(0);\n  const [copy, setCopy] = React.useState(0);\n  React.useEffect(() => {\n    setCopy(n);\n  }, [n]);\n  return (\n    <div>\n      <span className=\"n\">{n}</span>\n      <span className=\"copy\">{copy}</span>\n      <button className=\"go\" onClick={() => setN(n + 1)}>+1</button>\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 둘 다 0", js: "TXT('.n')==='0' && TXT('.copy')==='0'" },
        { d: "한 번 누르면 둘 다 1", js: "(CLICK('.go'), new Promise(function(r){setTimeout(function(){r(TXT('.copy')==='1');},60);}))" },
        { d: "두 번 더 누르면 3", js: "(CLICK('.go'),CLICK('.go'), new Promise(function(r){setTimeout(function(){r(TXT('.copy')==='3');},60);}))" },
      ],
      ex: "빈 배열은 '처음 한 번만' 이라는 뜻입니다. 값이 아무리 바뀌어도 다시 돌지 않아 옛 값이 그대로 남아요. 따라와야 하는 값은 배열에 적어 줘야 합니다.",
    },
    {
      k: "cleanup · 건 것을 되돌리기",
      q: "<code>.on</code> 을 눌러 켜면 타이머가 돌고, <b>끄면 멈추게</b> 하세요. <code>.tick</code> 은 타이머가 올린 숫자입니다.",
      src: "function App() {\n  const [on, setOn] = React.useState(false);\n  const [t, setT] = React.useState(0);\n  React.useEffect(() => {\n    if (!on) return;\n    const id = setInterval(() => setT((v) => v + 1), 20);\n  }, [on]);\n  return (\n    <div>\n      <span className=\"tick\">{t}</span>\n      <button className=\"on\" onClick={() => setOn(!on)}>{on ? '끄기' : '켜기'}</button>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [on, setOn] = React.useState(false);\n  const [t, setT] = React.useState(0);\n  React.useEffect(() => {\n    if (!on) return;\n    const id = setInterval(() => setT((v) => v + 1), 20);\n    return () => clearInterval(id);\n  }, [on]);\n  return (\n    <div>\n      <span className=\"tick\">{t}</span>\n      <button className=\"on\" onClick={() => setOn(!on)}>{on ? '끄기' : '켜기'}</button>\n    </div>\n  );\n}",
      tests: [
        { d: "켜면 올라간다", js: "(CLICK('.on'), new Promise(function(r){setTimeout(function(){r(Number(TXT('.tick'))>0);},200);}))" },
        /* 끈 직후가 아니라 한참 뒤에 기준값을 잡는다. 바로 읽으면 아직 처리되지 않은
           마지막 틱이 끼어들어, 제대로 치운 정답도 '아직 도는 중' 으로 보인다.
           여유를 넉넉히 둔 이유: 검증기는 문항 수십 개를 잇달아 돌려서 기계가 바쁘다.
           혼자 돌릴 때만 맞는 간격은 전체 검사에서 무작위로 실패한다 — 실제로 그랬다. */
        { d: "끄면 멈춘다", js: "(CLICK('.on'), new Promise(function(r){setTimeout(function(){var a=TXT('.tick');setTimeout(function(){r(TXT('.tick')===a);},400);},300);}))" },
      ],
      ex: "타이머를 걸고 치우지 않으면 껐다고 생각한 뒤에도 계속 돕니다. 켰다 껐다를 반복하면 그만큼 겹쳐서 더 빨리 올라가요. useEffect 가 돌려주는 함수에서 없애야 합니다.",
    },
  ],
},
/* ── 접근성과 UX ──────────────────────────────────────────── */
{
  unit: "접근성과 UX — 키보드·포커스 트랩·aria·로딩과 빈 상태 (중급)",
  lesson: "직접 짜 보기 — 누구나 쓸 수 있게 만들기",
  th: {
    sum: "화면은 눈으로만 쓰는 것이 아니다. **키보드와 읽어 주는 프로그램**으로도 쓸 수 있어야 한다.",
    body: [
      { h: "누를 수 있는 것은 button 으로", t: "`<div onClick>` 은 마우스로는 눌리지만 키보드 탭으로는 갈 수 없고, 읽어 주는 프로그램도 '버튼' 이라고 말해 주지 않는다. `<button>` 을 쓰면 이 모든 것이 공짜로 따라온다 — 흉내 내려면 여러 속성을 직접 붙여야 한다." },
      { h: "입력칸에는 이름이 필요하다", t: "`<label htmlFor>` 로 이름을 붙이면 읽어 주는 프로그램이 '이메일, 입력' 이라고 말해 준다. 없으면 그냥 '입력' 이라고만 해서 무엇을 적어야 할지 알 수 없다. 이름표를 누르면 칸으로 커서가 가는 것도 덤이다." },
      { h: "상태는 눈에만 보여선 안 된다", t: "열림·닫힘을 색으로만 표시하면 화면을 못 보는 사람에게는 아무 정보도 없다. `aria-expanded` 같은 속성으로 상태를 적어 두면 읽어 주는 프로그램이 그대로 전한다. 비어 있는 목록도 '없음' 이라고 글로 적어 준다." },
    ],
    code: { c: "<button aria-expanded={open} onClick={t}>메뉴</button>\n\n<label htmlFor=\"email\">이메일</label>\n<input id=\"email\" />", cap: "상태를 글로도 적어 둔다" },
    key: ["누를 것은 `<button>`", "입력칸에는 이름표", "상태는 속성으로도 적는다"],
  },
  q: [
    {
      k: "button · 키보드로도 갈 수 있게",
      q: "누르는 요소를 <b><code>&lt;button&gt;</code></b> 으로 바꾸세요. 누르면 <code>.out</code> 이 <code>\"열림\"</code> 이 됩니다.",
      src: "function App() {\n  const [out, setOut] = React.useState('');\n  return (\n    <div>\n      <div className=\"go\" onClick={() => setOut('열림')}>열기</div>\n      <span className=\"out\">{out}</span>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [out, setOut] = React.useState('');\n  return (\n    <div>\n      <button className=\"go\" onClick={() => setOut('열림')}>열기</button>\n      <span className=\"out\">{out}</span>\n    </div>\n  );\n}",
      tests: [
        { d: "버튼 요소여야 한다", js: "Q('.go').tagName==='BUTTON'" },
        { d: "누르면 열린다", js: "(CLICK('.go'), TXT('.out')==='열림')" },
      ],
      ex: "div 는 마우스로만 눌립니다. 키보드 탭으로 갈 수 없고, 읽어 주는 프로그램도 버튼이라고 말해 주지 않아요. button 을 쓰면 이 모든 것이 그냥 따라옵니다.",
    },
    {
      k: "label · 입력칸에 이름 붙이기",
      q: "입력칸(<code>#email</code>)에 이름표를 연결하세요. <code>label</code> 의 <code>for</code> 가 입력칸의 <code>id</code> 와 같아야 합니다.",
      src: "function App() {\n  return (\n    <div>\n      <label className=\"lbl\">이메일</label>\n      <input id=\"email\" className=\"in\" />\n    </div>\n  );\n}",
      sol: "function App() {\n  return (\n    <div>\n      <label className=\"lbl\" htmlFor=\"email\">이메일</label>\n      <input id=\"email\" className=\"in\" />\n    </div>\n  );\n}",
      tests: [
        { d: "이름표가 입력칸을 가리킨다", js: "ATTR('.lbl','for')==='email'" },
        { d: "입력칸이 있다", js: "COUNT('#email')===1" },
      ],
      ex: "이름표를 연결하지 않으면 읽어 주는 프로그램이 그냥 '입력' 이라고만 말합니다. 무엇을 적어야 할지 알 수 없어요. 연결해 두면 이름표를 눌러도 커서가 칸으로 갑니다.",
    },
    {
      k: "expanded · 상태를 글로도 적기",
      q: "메뉴 버튼(<code>.go</code>)에 <code>aria-expanded</code> 를 붙여 <b>열림·닫힘</b>을 적어 주세요. 처음은 닫힘입니다.",
      src: "function App() {\n  const [open, setOpen] = React.useState(false);\n  return (\n    <div>\n      <button className=\"go\" onClick={() => setOpen(!open)}>메뉴</button>\n      {open && <span className=\"menu\">항목</span>}\n    </div>\n  );\n}",
      sol: "function App() {\n  const [open, setOpen] = React.useState(false);\n  return (\n    <div>\n      <button className=\"go\" aria-expanded={open} onClick={() => setOpen(!open)}>메뉴</button>\n      {open && <span className=\"menu\">항목</span>}\n    </div>\n  );\n}",
      tests: [
        { d: "처음은 닫힘이라고 적혀 있다", js: "ATTR('.go','aria-expanded')==='false'" },
        { d: "누르면 열림으로 바뀐다", js: "(CLICK('.go'), ATTR('.go','aria-expanded')==='true')" },
        { d: "메뉴도 함께 보인다", js: "COUNT('.menu')===1" },
      ],
      ex: "열렸는지를 색이나 모양으로만 알려 주면, 화면을 못 보는 사람에게는 아무 정보도 없습니다. aria-expanded 로 적어 두면 읽어 주는 프로그램이 그대로 전해 줘요.",
    },
  ],
},
];
