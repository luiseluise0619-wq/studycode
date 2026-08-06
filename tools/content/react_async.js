/* React 비동기 실습 — 하네스가 프라미스를 기다리게 된 뒤에야 낼 수 있게 된 문항들.

   데이터를 불러오는 화면은 '조금 뒤에' 바뀐다. 하네스가 기다리지 못하면 로딩 상태만
   보고 채점하게 되어, 무엇을 써도 통과하지 못했다.

   검사식에서 화면이 바뀔 때까지 기다릴 때는 '몇 ms 뒤' 가 아니라 '조건이 맞을 때까지'
   로 기다린다. 느린 기기에서도 답이 달라지지 않는다.

   컴포넌트 이름은 App, 훅은 React.useState 규약을 따른다. */

/* 검사식 안에서 쓰는 도우미. 조건이 맞을 때까지 최대 1.5초 기다린다. */
const WAIT = "(function(f){return new Promise(function(res,rej){var t0=Date.now();"
  + "(function tick(){ if(f()) return res(true);"
  + " if(Date.now()-t0>1500) return rej(new Error('화면이 바뀌지 않았습니다'));"
  + " setTimeout(tick,20); })();});})";

module.exports = [
{
  unit: "데이터 페칭 실무 심화: 로딩·에러·경합 조건",
  lesson: "직접 만들어 보기 — 로딩과 에러를 다루기",
  th: {
    sum: "데이터를 불러오는 화면에는 **세 가지 상태**가 있다. 불러오는 중, 실패, 성공이다. 셋을 다 그려야 화면이 완성된다.",
    body: [
      { h: "왜 세 가지인가", t: "성공만 그리면 불러오는 동안 빈 화면이 보인다. 사용자는 고장 났다고 생각한다. 실패도 그리지 않으면 서버가 죽었을 때 영영 빈 채로 남는다. 처음부터 셋을 나눠 두면 나중에 덧붙이는 것보다 훨씬 간단하다." },
      { h: "빈 결과와 로딩은 다르다", t: "'아직 안 왔다' 와 '와 봤더니 없다' 는 다른 상태다. 둘을 같이 다루면 결과가 0건일 때도 영영 로딩으로 보인다. 불러오기가 끝났는지를 따로 표시해 둔다." },
      { h: "정리하는 것을 잊지 않는다", t: "`useEffect` 안에서 시작한 일은 화면이 사라질 때 정리해야 한다. 정리하지 않으면 이미 없어진 화면에 값을 넣으려다 경고가 나고, 오래된 응답이 새 응답을 덮어쓴다." },
    ],
    code: { c: "const [state, setState] = React.useState({ loading: true });\n// loading → error 또는 data 로 옮겨 간다\nif (state.loading) return <p className=\"loading\">불러오는 중</p>;\nif (state.error) return <p className=\"error\">실패</p>;", cap: "로딩·실패·성공 셋을 다 그린다" },
    key: ["상태는 로딩·실패·성공 셋", "빈 결과와 로딩은 다르다", "시작한 일은 정리한다"],
  },
  q: [
    {
      k: "loading · 불러오는 중을 보여 주기",
      qq: "데이터를 불러오는 동안 <code>.loading</code> 을 보여 주고, 오면 <code>.data</code> 에 값을 넣으세요. 실패하면 <code>.error</code> 를 보여 줍니다.",
      src: "function App() {\n  const [data, setData] = React.useState(null);\n  React.useEffect(() => {\n    window.__load().then(setData);\n  }, []);\n  return <div className=\"data\">{data}</div>;\n}",
      sol: "function App() {\n  const [s, setS] = React.useState({ loading: true });\n  React.useEffect(() => {\n    window.__load()\n      .then(v => setS({ loading: false, data: v }))\n      .catch(() => setS({ loading: false, error: true }));\n  }, []);\n  if (s.loading) return <p className=\"loading\">불러오는 중</p>;\n  if (s.error) return <p className=\"error\">실패</p>;\n  return <div className=\"data\">{s.data}</div>;\n}",
      tests: [
        { d: "처음에는 '불러오는 중' 이 보인다",
          js: "(window.__load = () => new Promise(r => setTimeout(() => r('값'), 80)), COUNT('.loading') === 1)" },
        { d: "값이 오면 .data 에 들어간다",
          js: WAIT + "(() => COUNT('.data') === 1 && TXT('.data') === '값')" },
        { d: "실패하면 .error 가 보인다",
          js: "(function(){ window.__load = () => Promise.reject(new Error('x'));"
            + " var root = ReactDOM.createRoot(document.getElementById('root'));"
            + " ReactDOM.flushSync(function(){ root.render(React.createElement(App)); });"
            + " return " + WAIT + "(() => COUNT('.error') === 1); })()" },
      ],
      ex: "성공만 그리면 불러오는 동안 빈 화면이 보이고, 실패했을 때는 영영 빈 채로 남습니다. 로딩·실패·성공을 하나의 상태로 묶어 두면 셋 중 하나만 그려져 서로 어긋날 일이 없어요.",
    },
    {
      k: "race · 늦게 온 응답이 덮어쓰지 않게",
      qq: "빠르게 두 번 요청하면 <b>늦게 온 옛 응답</b>이 최신 값을 덮어쓸 수 있습니다. 마지막 요청의 결과만 화면에 남게 하세요.",
      src: "function App() {\n  const [v, setV] = React.useState('');\n  const go = (n) => { window.__load(n).then(setV); };\n  return (\n    <div>\n      <button className=\"a\" onClick={() => go(1)}>A</button>\n      <button className=\"b\" onClick={() => go(2)}>B</button>\n      <span className=\"out\">{v}</span>\n    </div>\n  );\n}",
      sol: "function App() {\n  const [v, setV] = React.useState('');\n  const seq = React.useRef(0);\n  const go = (n) => {\n    const my = ++seq.current;\n    window.__load(n).then(r => { if (my === seq.current) setV(r); });\n  };\n  return (\n    <div>\n      <button className=\"a\" onClick={() => go(1)}>A</button>\n      <button className=\"b\" onClick={() => go(2)}>B</button>\n      <span className=\"out\">{v}</span>\n    </div>\n  );\n}",
      tests: [
        { d: "처음에는 비어 있다", js: "TXT('.out') === ''" },
        { d: "한 번만 누르면 그 값이 보인다",
          js: "(function(){ window.__load = n => new Promise(r => setTimeout(() => r('R' + n), 30));"
            + " CLICK('.b'); return " + WAIT + "(() => TXT('.out') === 'R2'); })()" },
        { d: "느린 A 뒤에 빠른 B 를 누르면 B 결과가 남는다",
          js: "(function(){ window.__load = n => new Promise(r => setTimeout(() => r('R' + n), n === 1 ? 200 : 20));"
            + " CLICK('.a'); CLICK('.b');"
            + " return new Promise(function(res, rej){ setTimeout(function(){"
            + "   TXT('.out') === 'R2' ? res(true) : rej(new Error('늦게 온 A 가 덮어썼다: ' + TXT('.out'))); }, 400); }); })()" },
      ],
      ex: "먼저 보낸 요청이 늦게 도착하면 나중 값을 덮어씁니다. 검색창에서 빠르게 타이핑할 때 옛 결과가 뜨는 것이 이 현상이에요. 요청마다 번호를 붙이고 '내가 마지막인가' 를 확인하면 막을 수 있습니다.",
    },
  ],
},
];
