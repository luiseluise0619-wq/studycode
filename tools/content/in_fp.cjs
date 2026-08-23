/* 함수형 프로그래밍 단답 15 — 합성·커링·불변성을 손으로 적어 본다.
   검증:  node ver_input.cjs ./in_fp.cjs
   출력값 대조:  node chk_predict.cjs ./in_fp.cjs */
module.exports = [

{ track:"fp", t:"input", cat:"internals", k:"모으고 거르면 남는 것",
  q:"두 배로 바꾼 뒤 2 보다 큰 것만 남기면 무엇이 나올까요? 출력되는 JSON 을 그대로 적으세요. (예: [1,2])",
  code:"console.log(JSON.stringify([1, 2, 3].map(x => x * 2).filter(x => x > 2)));",
  a:["[4,6]"],
  ex:"<code>map</code> 이 <code>[2,4,6]</code> 을 만들고 <code>filter</code> 가 2 보다 큰 <code>[4,6]</code> 만 남깁니다.\n💡 개념: 두 함수 모두 <b>새 배열을 돌려주고</b> 원본을 건드리지 않습니다 — 그래서 이어 붙여 쓸 수 있습니다.\n🛠 실무: 이어 붙일 때마다 배열이 하나씩 더 만들어지므로, 데이터가 아주 크면 <code>reduce</code> 한 번이나 지연 평가로 합치는 편이 낫습니다." },

{ track:"fp", t:"input", cat:"internals", k:"인자를 하나씩 받는 함수",
  q:"인자를 하나 받아 <b>또 함수를 돌려주는</b> 함수에 값을 두 번 넘기면 얼마가 될까요? 출력되는 값을 적으세요. (숫자)",
  code:"const add = a => b => a + b;\nconsole.log(add(2)(3));",
  a:["5"],
  ex:"<code>add(2)</code> 는 '2 를 기억하는 함수' 를 돌려주고, 거기에 3 을 넘겨야 비로소 값이 나옵니다.\n💡 개념: 이렇게 인자를 <b>한 번에 하나씩</b> 받도록 만드는 것을 커링이라 합니다.\n🛠 실무: <code>const addTax = withRate(0.1)</code> 처럼 <b>설정을 미리 먹여 둔 함수</b>를 만들 때 쓰면, 호출부가 짧아지고 설정이 한 곳에 모입니다." },

{ track:"fp", t:"input", cat:"internals", k:"오른쪽부터 적용하기",
  q:"두 함수를 <b>수학에서 적듯이</b>(오른쪽 것을 먼저) 합성해 3 을 넘기면 얼마가 될까요? 출력되는 값을 적으세요. (숫자)",
  code:"const f = x => x + 1, g = x => x * 2;\nconst compose = (p, q) => x => p(q(x));\nconsole.log(compose(f, g)(3));",
  a:["7"],
  ex:"<code>g(3) = 6</code> 을 먼저 하고 <code>f(6) = 7</code> 입니다 — <code>f∘g</code> 는 '<b>g 를 먼저</b>' 입니다.\n💡 개념: 합성은 결합법칙이 성립합니다 — <code>compose(f, compose(g, h))</code> 와 <code>compose(compose(f, g), h)</code> 가 같습니다.\n🛠 실무: 순서를 헷갈리기 쉬워 실무에서는 <b>왼쪽부터 읽는</b> <code>pipe</code> 를 더 즐겨 씁니다." },

{ track:"fp", t:"input", cat:"internals", k:"왼쪽부터 흘려보내기",
  q:"같은 두 함수를 <b>적은 순서대로</b> 흘려보내며 3 을 넘기면 얼마가 될까요? 출력되는 값을 적으세요. (숫자)",
  code:"const f = x => x + 1, g = x => x * 2;\nconst pipe = (...fs) => x => fs.reduce((v, fn) => fn(v), x);\nconsole.log(pipe(f, g)(3));",
  a:["8"],
  ex:"<code>f(3) = 4</code>, <code>g(4) = 8</code> 입니다. 같은 두 함수라도 순서가 바뀌면 값이 달라집니다.\n💡 개념: <code>pipe</code> 는 <code>reduce</code> 로 세 줄이면 만들어집니다 — 값 하나를 함수들 사이로 흘려보내는 것이 전부입니다.\n🛠 실무: 데이터 변환을 <code>pipe(정규화, 검증, 저장모양으로)</code> 처럼 적으면 <b>단계 이름이 곧 문서</b>가 됩니다." },

{ track:"fp", t:"input", cat:"internals", k:"식을 값으로 바꿔 써도 되는 성질",
  q:"같은 입력에 언제나 같은 출력을 주어, 식을 <b>그 결과값으로 바꿔 써도</b> 프로그램의 뜻이 안 변하는 성질을 무엇이라 부를까요? (한글 다섯 글자 또는 영문)",
  a:["참조투명성", "referential transparency", "참조투명", "투명성"],
  ex:"이 성질이 있으면 <b>메모이제이션·병렬 실행·순서 바꾸기</b>가 전부 안전해집니다. 컴파일러의 최적화도 이 위에 서 있습니다.\n💡 개념: 깨뜨리는 것은 대개 넷입니다 — 전역 상태, 입출력, 현재 시각, 난수.\n🛠 실무: 시각과 난수를 <b>인자로 받게</b> 바꾸는 것만으로 테스트가 결정적으로 변합니다." },

{ track:"fp", t:"input", cat:"internals", k:"겉만 얼린 객체",
  q:"객체를 얼린 뒤 <b>안쪽 객체</b>의 값을 바꾸면 어떻게 될까요? 출력되는 값을 적으세요. (숫자)",
  code:"const o = Object.freeze({ inner: { v: 1 } });\no.inner.v = 2;\nconsole.log(o.inner.v);",
  a:["2"],
  ex:"<code>Object.freeze</code> 는 <b>한 겹만</b> 얼립니다. 안쪽 객체는 그대로라 값이 바뀝니다.\n💡 개념: 얕은 복사와 같은 함정입니다 — 불변성은 <b>바뀌는 경로 위의 모든 층</b>에 걸어야 합니다.\n🛠 실무: 깊게 얼리려면 재귀로 훑거나 아예 처음부터 <b>새로 만드는 갱신</b>만 허용하세요. 조용히 실패하는 것도 문제라, 개발 빌드는 엄격 모드로 두어 예외가 나게 하는 편이 낫습니다." },

{ track:"fp", t:"input", cat:"internals", k:"접기로 모으기를 만들면",
  q:"<code>reduce</code> 만으로 '두 배로 바꾸기' 를 만들면 무엇이 나올까요? 출력되는 JSON 을 그대로 적으세요. (예: [1,2])",
  code:"console.log(JSON.stringify([1, 2, 3].reduce((a, x) => a.concat(x * 2), [])));",
  a:["[2,4,6]"],
  ex:"<code>map</code>·<code>filter</code>·<code>flatMap</code> 은 전부 <code>reduce</code> 로 만들 수 있습니다 — <b>접기가 가장 일반적인 형태</b>입니다.\n💡 개념: 반대로 <code>reduce</code> 는 <code>map</code> 으로 만들 수 없습니다. 표현력의 위아래가 정해져 있습니다.\n🛠 실무: 그렇다고 전부 <code>reduce</code> 로 적으면 읽기 어렵습니다 — 뜻이 분명한 <code>map</code>·<code>filter</code> 를 쓰고, 한 번에 끝내야 할 때만 접으세요." },

{ track:"fp", t:"input", cat:"internals", k:"모으면서 한 겹 펴기",
  q:"중첩 배열을 <b>모으면서 한 겹 펴면</b> 무엇이 나올까요? 출력되는 JSON 을 그대로 적으세요. (예: [1,2])",
  code:"console.log(JSON.stringify([[1, 2], [3]].flatMap(x => x)));",
  a:["[1,2,3]"],
  ex:"<code>flatMap</code> 은 <code>map</code> 뒤에 <code>flat(1)</code> 을 붙인 것과 같습니다.\n💡 개념: 원소 하나가 <b>0 개 또는 여러 개</b>로 늘어날 수 있을 때 쓰는 도구라, <code>map</code>+<code>filter</code> 를 한 번에 대신할 수도 있습니다 — 버릴 원소는 빈 배열을 돌려주면 됩니다.\n🛠 실무: 중첩 응답을 평평하게 펼 때 <code>flatMap</code> 한 번이면 임시 배열을 안 만듭니다." },

{ track:"fp", t:"input", cat:"internals", k:"인자를 하나씩 받게 바꾸기",
  q:"여러 인자를 받는 함수를 <b>인자 하나씩 받는 함수들의 사슬</b>로 바꾸는 기법을 무엇이라 부를까요? (영문 한 단어)",
  a:["currying", "curry", "커링"],
  ex:"<code>f(a, b, c)</code> 를 <code>f(a)(b)(c)</code> 로 바꾸는 것입니다. 하스켈처럼 아예 모든 함수가 이 꼴인 언어도 있습니다.\n💡 개념: '인자 일부만 미리 먹이기'(부분 적용)와는 다릅니다 — 부분 적용은 <b>몇 개든</b> 한 번에 먹일 수 있습니다.\n🛠 실무: 설정을 미리 먹여 둔 함수를 만들 때 유용하지만, 남용하면 호출부에서 <b>인자 개수를 세기</b> 어려워집니다." },

{ track:"fp", t:"input", cat:"internals", k:"필요할 때까지 미루기",
  q:"값이 실제로 쓰일 때까지 계산을 <b>미뤄 두는</b> 평가 방식을 무엇이라 부를까요? (영문 한 단어)",
  a:["lazy", "지연평가", "lazyevaluation", "지연"],
  ex:"무한 수열을 다룰 수 있고, 안 쓰이는 값은 아예 계산하지 않아 낭비가 없습니다.\n💡 개념: 자바스크립트의 <code>&amp;&amp;</code>·<code>||</code>·삼항 연산자도 오른쪽을 필요할 때만 계산하는 <b>단축 평가</b>입니다.\n🛠 실무: 제너레이터나 이터러블로 파이프라인을 만들면 큰 파일도 <b>한 줄씩</b> 흘려보내며 처리할 수 있습니다 — 전체를 메모리에 올리지 않습니다." },

{ track:"fp", t:"input", cat:"internals", k:"조건에 맞는 첫 값",
  q:"2 보다 큰 <b>첫 원소</b>를 찾으면 무엇이 나올까요? 출력되는 값을 적으세요. (숫자)",
  code:"console.log([1, 2, 3, 4].find(x => x > 2));",
  a:["3"],
  ex:"<code>find</code> 는 조건에 맞는 <b>첫 값</b>을, <code>findIndex</code> 는 그 자리를 줍니다. 없으면 각각 <code>undefined</code> 와 <code>-1</code> 입니다.\n💡 개념: 찾는 순간 <b>멈추므로</b> <code>filter(...)[0]</code> 보다 낫습니다 — 뒤쪽은 끝까지 훑습니다.\n🛠 실무: 값이 <code>undefined</code> 일 수 있는 배열에서는 '못 찾음' 과 '찾았는데 undefined' 가 구별되지 않으므로 <code>findIndex</code> 를 쓰세요." },

{ track:"fp", t:"input", cat:"internals", k:"모두 참인가",
  q:"모든 원소가 양수인지 물으면 무엇이 나올까요? 출력되는 값을 적으세요. (true 또는 false)",
  code:"console.log([1, 2, 3].every(x => x > 0));",
  a:["true"],
  ex:"셋 다 조건을 만족하므로 참입니다. 하나라도 어긋나면 <b>거기서 멈추고</b> 거짓을 냅니다.\n💡 개념: <code>every</code> 는 '반례가 없는가', <code>some</code> 은 '예가 있는가' 를 묻습니다 — 서로 부정 관계입니다.\n🛠 실무: 검증 함수를 <code>every</code> 로 적으면 첫 실패에서 멈춰 빠르지만, <b>모든 오류를 모아 보여 주려면</b> 일부러 끝까지 훑어야 합니다." },

{ track:"fp", t:"input", cat:"internals", k:"빈 배열에 모두 물으면",
  q:"<b>빈 배열</b>에게 '모든 원소가 조건을 만족하는가' 를 물으면 무엇이 나올까요? 조건은 언제나 거짓입니다. 출력되는 값을 적으세요. (true 또는 false)",
  code:"console.log([].every(x => false));",
  a:["true"],
  ex:"반례가 하나도 없으므로 참입니다 — 이를 <b>공허한 참</b>(vacuous truth)이라 합니다.\n💡 개념: 논리적으로도 자연스럽습니다. '<b>모든</b>' 은 '반례가 없다' 와 같은 말이고, 원소가 없으면 반례도 없습니다.\n🛠 실무: '모든 항목이 승인됐으면 진행' 같은 코드가 <b>목록이 비었을 때</b> 그대로 통과합니다 — 빈 목록을 따로 막을지 먼저 정하세요." },

{ track:"fp", t:"input", cat:"internals", k:"빈 배열에 하나라도 물으면",
  q:"<b>빈 배열</b>에게 '조건을 만족하는 원소가 하나라도 있는가' 를 물으면 무엇이 나올까요? 조건은 언제나 참입니다. 출력되는 값을 적으세요. (true 또는 false)",
  code:"console.log([].some(x => true));",
  a:["false"],
  ex:"원소가 하나도 없으니 '있다' 고 할 수 없습니다. 앞 문제와 짝을 이루는 결과입니다.\n💡 개념: 두 값은 각 연산의 <b>항등원</b>입니다 — AND 의 항등원은 참, OR 의 항등원은 거짓이라 빈 입력에서 그 값이 나옵니다.\n🛠 실무: <code>reduce</code> 의 초기값을 고를 때도 같은 기준입니다 — 덧셈이면 0, 곱셈이면 1, 최댓값이면 <code>-Infinity</code>." },

{ track:"fp", t:"input", cat:"internals", k:"펼쳐 만든 객체는 같은 것인가",
  q:"기존 객체를 펼쳐 새 객체를 만든 뒤 <b>같은 것인지</b> 물으면 무엇이 나올까요? 출력되는 값을 적으세요. (true 또는 false)",
  code:"const o = { a: 1 };\nconst n = { ...o, a: 2 };\nconsole.log(n === o);",
  a:["false"],
  ex:"펼치기는 <b>새 객체</b>를 만듭니다. 참조가 다르므로 <code>===</code> 는 거짓입니다.\n💡 개념: 이 '참조가 바뀐다' 는 성질이 리액트 같은 화면 라이브러리가 <b>바뀐 것을 알아채는</b> 근거입니다 — 제자리에서 고치면 알아채지 못합니다.\n🛠 실무: 다만 한 겹만 새로 만들므로 안쪽 배열·객체는 여전히 공유됩니다. 바뀌는 경로 위의 층을 모두 새로 만드세요." },

];
