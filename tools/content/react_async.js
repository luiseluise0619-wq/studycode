/* React 비동기 실습 — 하네스가 프라미스를 기다리게 된 뒤에야 낼 수 있게 된 문항들.

   데이터를 불러오는 화면은 '조금 뒤에' 바뀐다. 하네스가 기다리지 못하면 로딩 상태만
   보고 채점하게 되어, 무엇을 써도 통과하지 못했다.

   문항을 만들며 배운 것 (검증기가 알려 줬다)
   · 하네스는 검사식을 돌리기 전에 App 을 한 번 마운트한다. 그때 터지면 그대로
     끝나고 검사는 아예 돌지 않는다. 그래서 window 전역에 가짜 로더를 심는 방식은
     쓸 수 없다 — 첫 마운트 때는 아직 없기 때문이다.
     대신 불러오는 함수를 **prop 으로 받고 기본값을 둔다.** 기본값 덕에 첫 마운트가
     무사히 지나가고, 검사식은 원하는 로더를 넘겨 다시 마운트하면 된다.
     실무에서도 바깥 의존을 prop 으로 받아 두면 시험하기 쉬워진다 — 같은 이유다.
   · '몇 ms 뒤' 가 아니라 '조건이 맞을 때까지' 기다린다. 느린 기기에서도 답이 같다.
   · 거부 대신 참·거짓을 돌려준다. 거부는 처리되지 않은 오류로 새어 나온다. */

const H = {
  /* 하네스가 이미 #root 에 App 을 붙여 두었다. 거기를 비우고 다시 붙이면,
     아직 안 끝난 옛 화면을 React 가 나중에 건드리려다 터진다(removeChild).
     그러면 마운트가 실패하고 검사는 '옛 화면' 을 보게 된다 — 실제로 그렇게 걸렸다.
     그래서 아예 다른 자리(body 아래 새 상자)에 붙이고, 검사도 그 안에서만 찾는다. */
  mount: (loadFn) => "(function(){"
    + " if (window.__host) window.__host.remove();"
    + " window.__host = document.createElement('div');"
    + " document.body.appendChild(window.__host);"
    + " ReactDOM.flushSync(function(){"
    + "   ReactDOM.createRoot(window.__host).render(React.createElement(App, { load: " + loadFn + " }));"
    + " }); })();",
  /* 검사는 내가 만든 상자 안에서만 찾는다. 하네스가 그린 화면과 섞이지 않게. */
  txt: (sel) => "((window.__host.querySelector('" + sel + "') || { textContent: '' }).textContent || '').trim()",
  cnt: (sel) => "window.__host.querySelectorAll('" + sel + "').length",
  click: (sel) => "ReactDOM.flushSync(function(){ window.__host.querySelector('" + sel + "').click(); })",
  /* 조건이 맞을 때까지 기다린다. 안 맞으면 거짓 — 거부는 처리되지 않은 오류로 샌다. */
  until: (cond, ms) => "new Promise(function(res){ var t0 = Date.now();"
    + " (function tick(){ try { if (" + cond + ") return res(true); } catch (e) {}"
    + " if (Date.now() - t0 > " + (ms || 1500) + ") return res(false);"
    + " setTimeout(tick, 20); })(); })",
  /* 정해진 시간을 기다린 뒤 한 번만 확인한다 (늦게 온 것이 덮어썼는지 볼 때) */
  after: (ms, cond) => "new Promise(function(res){ setTimeout(function(){"
    + " var ok = false; try { ok = !!(" + cond + "); } catch (e) {} res(ok); }, " + ms + "); })",
};

module.exports = [
{
  unit: "데이터 페칭 실무 심화: 로딩·에러·경합 조건",
  lesson: "직접 만들어 보기 — 로딩과 에러를 다루기",
  th: {
    sum: "데이터를 불러오는 화면에는 **세 가지 상태**가 있다. 불러오는 중, 실패, 성공이다. 셋을 다 그려야 화면이 완성된다.",
    body: [
      { h: "왜 세 가지인가", t: "성공만 그리면 불러오는 동안 빈 화면이 보인다. 사용자는 고장 났다고 생각한다. 실패도 그리지 않으면 서버가 죽었을 때 영영 빈 채로 남는다. 처음부터 셋을 나눠 두면 나중에 덧붙이는 것보다 훨씬 간단하다." },
      { h: "하나의 상태로 묶는다", t: "`loading`·`error`·`data` 를 따로 두면 셋이 어긋난다. 로딩이 끝났는데 `error` 를 안 지웠다든지 하는 일이 생긴다. 하나의 객체로 묶으면 셋 중 하나만 참이 되어 어긋날 수 없다." },
      { h: "불러오는 함수는 prop 으로", t: "컴포넌트가 직접 서버를 부르면 시험할 방법이 없다. 불러오는 함수를 밖에서 받으면 가짜 함수를 넣어 로딩·실패를 마음대로 만들어 볼 수 있다. 실무에서 테스트하기 쉬운 컴포넌트는 대개 이 모양이다." },
    ],
    code: { c: "const [s, setS] = React.useState({ loading: true });\nif (s.loading) return <p className=\"loading\">불러오는 중</p>;\nif (s.error) return <p className=\"error\">실패</p>;\nreturn <div className=\"data\">{s.data}</div>;", cap: "셋을 한 상태로 묶으면 어긋나지 않는다" },
    key: ["상태는 로딩·실패·성공 셋", "하나로 묶으면 어긋나지 않는다", "불러오는 함수는 밖에서 받는다"],
  },
  q: [
    {
      k: "loading · 불러오는 중과 실패를 보여 주기",
      qq: "<code>load()</code> 로 데이터를 불러오는 동안 <code>.loading</code>, 값이 오면 <code>.data</code>, 실패하면 <code>.error</code> 를 보여 주세요.",
      src: "function App({ load = () => Promise.resolve('값') }) {\n  const [data, setData] = React.useState(null);\n  React.useEffect(() => {\n    load().then(setData);\n  }, []);\n  return <div className=\"data\">{data}</div>;\n}",
      sol: "function App({ load = () => Promise.resolve('값') }) {\n  const [s, setS] = React.useState({ loading: true });\n  React.useEffect(() => {\n    load()\n      .then(v => setS({ loading: false, data: v }))\n      .catch(() => setS({ loading: false, error: true }));\n  }, []);\n  if (s.loading) return <p className=\"loading\">불러오는 중</p>;\n  if (s.error) return <p className=\"error\">실패</p>;\n  return <div className=\"data\">{s.data}</div>;\n}",
      tests: [
        { d: "값이 오기 전에는 '불러오는 중' 이 보인다",
          js: H.mount("function(){ return new Promise(function(r){ setTimeout(function(){ r('값'); }, 150); }); }")
            + " " + H.cnt(".loading") + " === 1" },
        { d: "값이 오면 .data 에 들어간다",
          js: H.until(H.cnt(".data") + " === 1 && " + H.txt(".data") + " === '값'") },
        { d: "실패하면 .error 가 보인다",
          js: H.mount("function(){ return Promise.reject(new Error('의도된 실패')); }")
            + " " + H.until(H.cnt(".error") + " === 1") },
      ],
      ex: "성공만 그리면 불러오는 동안 빈 화면이 보이고, 실패했을 때는 영영 빈 채로 남습니다. 로딩·실패·성공을 하나의 상태로 묶어 두면 셋 중 하나만 그려져 서로 어긋날 일이 없어요.",
    },
    {
      k: "race · 늦게 온 응답이 덮어쓰지 않게",
      qq: "빠르게 두 번 요청하면 <b>늦게 온 옛 응답</b>이 최신 값을 덮어쓸 수 있습니다. <b>마지막 요청</b>의 결과만 <code>.out</code> 에 남게 하세요.",
      src: "function App({ load = n => Promise.resolve('R' + n) }) {\n  const [v, setV] = React.useState('');\n  const go = (n) => { load(n).then(setV); };\n  return (\n    <div>\n      <button className=\"a\" onClick={() => go(1)}>A</button>\n      <button className=\"b\" onClick={() => go(2)}>B</button>\n      <span className=\"out\">{v}</span>\n    </div>\n  );\n}",
      sol: "function App({ load = n => Promise.resolve('R' + n) }) {\n  const [v, setV] = React.useState('');\n  const seq = React.useRef(0);\n  const go = (n) => {\n    const my = ++seq.current;\n    load(n).then(r => { if (my === seq.current) setV(r); });\n  };\n  return (\n    <div>\n      <button className=\"a\" onClick={() => go(1)}>A</button>\n      <button className=\"b\" onClick={() => go(2)}>B</button>\n      <span className=\"out\">{v}</span>\n    </div>\n  );\n}",
      tests: [
        /* 마운트는 한 번만 한다. 검사 중간에 다시 마운트하면, 아직 안 끝난 옛 화면을
           React 가 나중에 건드리려다 터진다(removeChild 오류). 그래서 처음에
           A 는 느리고 B 는 빠른 로더를 심어 두고, 세 검사가 그 화면을 함께 쓴다. */
        { d: "처음에는 비어 있다",
          js: H.mount("function(n){ return new Promise(function(r){ setTimeout(function(){ r('R' + n); }, n === 1 ? 250 : 20); }); }")
            + " " + H.txt(".out") + " === ''" },
        { d: "B 만 누르면 B 결과가 보인다",
          js: "(" + H.click(".b") + ", " + H.until(H.txt(".out") + " === 'R2'") + ")" },
        { d: "느린 A 뒤에 빠른 B 를 누르면 B 결과가 남는다",
          js: "(" + H.click(".a") + ", " + H.click(".b") + ", " + H.after(500, H.txt(".out") + " === 'R2'") + ")" },
      ],
      ex: "먼저 보낸 요청이 늦게 도착하면 나중 값을 덮어씁니다. 검색창에서 빠르게 타이핑할 때 옛 결과가 뜨는 것이 이 현상이에요. 요청마다 번호를 붙이고 '내가 마지막인가' 를 확인하면 막을 수 있습니다.",
    },
  ],
},
];
