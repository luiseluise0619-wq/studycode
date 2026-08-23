/* 코딩 연습 단답 15 — 자바스크립트가 실제로 무엇을 내놓는지 손으로 적어 본다.
   채점은 소문자 + 공백 제거 후 완전 일치라, 물음마다 답 형식을 괄호로 적어 둔다.
   검증:  node ver_input.cjs ./in_code.cjs
   출력값 대조:  node tools/content/chk_predict.cjs ./tools/content/in_code.cjs */
module.exports = [

{ track:"code", t:"input", cat:"internals", k:"없는 값을 찾으면",
  q:"배열에서 없는 값을 찾으면 무엇이 나올까요? 콘솔에 찍히는 값을 그대로 적으세요. (숫자)",
  code:"console.log([1, 2, 3].indexOf(4));",
  a:["-1"],
  ex:"찾지 못하면 <code>-1</code> 입니다. 0 이 아니라 -1 인 이유는 <b>0 이 정당한 자리 번호</b>이기 때문입니다.\n💡 개념: 그래서 <code>if (arr.indexOf(x))</code> 는 첫 자리에서 찾았을 때 거짓이 되는 유명한 함정입니다.\n🛠 실무: 존재만 물을 때는 <code>includes</code>, 자리가 필요할 때만 <code>indexOf</code> 를 쓰세요." },

{ track:"code", t:"input", cat:"internals", k:"음수로 자르기",
  q:"문자열을 음수 자리에서 자르면 어디부터 나올까요? 출력되는 문자열을 따옴표 없이 적으세요. (영문 소문자)",
  code:"console.log('abc'.slice(-2));",
  a:["bc"],
  ex:"<code>slice</code> 에 음수를 주면 <b>끝에서부터</b> 셉니다. <code>-2</code> 는 '뒤에서 두 번째부터 끝까지' 입니다.\n💡 개념: <code>substring</code> 은 음수를 0 으로 바꿔 버려 결과가 다릅니다 — 둘은 이름만 비슷합니다.\n🛠 실무: 확장자·마지막 몇 글자를 떼어 낼 때 <code>slice(-n)</code> 이 가장 짧습니다." },

{ track:"code", t:"input", cat:"internals", k:"비어 있음의 타입",
  q:"'값이 없음' 을 뜻하는 <code>null</code> 의 타입을 물으면 무엇이 나올까요? 출력되는 낱말을 그대로 적으세요. (영문 소문자 한 단어)",
  code:"console.log(typeof null);",
  a:["object"],
  ex:"자바스크립트 초창기부터 있던 <b>고칠 수 없는 버그</b>입니다. 고치면 기존 웹이 깨지기 때문에 그대로 두었습니다.\n💡 개념: 진짜 '값이 없음' 을 가리는 방법은 <code>x === null</code> 이거나 <code>x == null</code>(null 과 undefined 를 함께)입니다.\n🛠 실무: <code>typeof</code> 로 객체인지 보려면 <code>typeof x === 'object' &amp;&amp; x !== null</code> 처럼 null 을 따로 빼야 합니다." },

{ track:"code", t:"input", cat:"internals", k:"기본 정렬의 기준",
  q:"비교 함수 없이 숫자 배열을 정렬하면 어떤 순서가 될까요? 출력되는 JSON 을 그대로 적으세요. (예: [1,2,3])",
  code:"console.log(JSON.stringify([10, 9, 1].sort()));",
  a:["[1,10,9]"],
  ex:"비교 함수를 안 주면 <b>문자열로 바꿔서</b> 사전순으로 견줍니다. <code>'10'</code> 이 <code>'9'</code> 보다 앞서는 이유입니다.\n💡 개념: 숫자로 정렬하려면 <code>sort((a, b) =&gt; a - b)</code> 처럼 비교 함수를 반드시 줘야 합니다.\n🛠 실무: 이 실수는 값이 전부 한 자리일 때는 드러나지 않아, 데이터가 커진 뒤에야 발견됩니다." },

{ track:"code", t:"input", cat:"internals", k:"이모지 한 글자의 길이",
  q:"이모지 하나짜리 문자열의 <code>length</code> 는 얼마일까요? 출력되는 숫자를 적으세요. (숫자)",
  code:"console.log('👍'.length);",
  a:["2"],
  ex:"<code>length</code> 는 글자가 아니라 <b>UTF-16 코드 단위</b>를 셉니다. 대부분의 이모지는 두 칸(대리 쌍)을 차지합니다.\n💡 개념: 코드 포인트 수를 세려면 <code>[...s].length</code> 를 씁니다.\n🛠 실무: 글자 수 제한·미리보기 자르기에 <code>length</code> 를 쓰면 이모지가 반으로 잘려 깨집니다." },

{ track:"code", t:"input", cat:"internals", k:"소수 더하기의 결과",
  q:"<code>0.1 + 0.2</code> 가 <code>0.3</code> 과 같은지 물으면 무엇이 나올까요? 출력되는 값을 그대로 적으세요. (true 또는 false)",
  code:"console.log(0.1 + 0.2 === 0.3);",
  a:["false"],
  ex:"이진 부동소수로는 <code>0.1</code> 도 <code>0.2</code> 도 정확히 담기지 않아, 더하면 <code>0.30000000000000004</code> 가 됩니다.\n💡 개념: 실수 비교는 <code>Math.abs(a - b) &lt; 1e-9</code> 처럼 <b>오차를 허용</b>해서 합니다.\n🛠 실무: 돈은 아예 <b>정수 최소 단위</b>(원·센트)로 다뤄야 회계 오차가 생기지 않습니다." },

{ track:"code", t:"input", cat:"internals", k:"초기값 없는 접기",
  q:"세 숫자를 초기값 없이 접어서 더하면 얼마가 될까요? 출력되는 숫자를 적으세요. (숫자)",
  code:"console.log([1, 2, 3].reduce((a, b) => a + b));",
  a:["6"],
  ex:"초기값을 안 주면 <b>첫 원소가 누적값</b>이 되고 두 번째부터 훑습니다. 숫자 배열에서는 결과가 같지만 <b>빈 배열이면 예외</b>가 납니다.\n💡 개념: 초기값은 선택 인자가 아니라 <b>누적값의 타입 선언</b>이라고 보는 편이 안전합니다.\n🛠 실무: 객체를 숫자로 접을 때처럼 <b>타입이 다르면</b> 초기값이 필수입니다." },

{ track:"code", t:"input", cat:"internals", k:"객체 열쇠의 순서",
  q:"문자열 열쇠만 있는 객체의 열쇠를 꺼내면 어떤 순서일까요? 출력되는 JSON 을 그대로 적으세요. (예: [\"x\",\"y\"])",
  code:"console.log(JSON.stringify(Object.keys({ b: 1, a: 2 })));",
  a:['["b","a"]', "['b','a']"],
  ex:"문자열 열쇠는 <b>넣은 순서</b>가 그대로 유지됩니다. 사전순으로 정렬되지 않습니다.\n💡 개념: 다만 <b>정수처럼 생긴 열쇠</b>(<code>'2'</code>·<code>'10'</code>)는 예외라 언제나 오름차순으로 먼저 나옵니다.\n🛠 실무: 캐시 열쇠나 서명 문자열을 만들 때는 <code>Object.keys(o).sort()</code> 로 <b>순서를 고정</b>해야 같은 설정이 같은 열쇠가 됩니다." },

{ track:"code", t:"input", cat:"internals", k:"더하기가 이어 붙이기가 될 때",
  q:"문자열과 숫자를 <code>+</code> 로 이으면 무엇이 나올까요? 출력되는 값을 따옴표 없이 적으세요. (숫자처럼 보이는 글자)",
  code:"console.log('5' + 2);",
  a:["52"],
  ex:"<code>+</code> 는 한쪽이 문자열이면 <b>이어 붙이기</b>가 됩니다. 반면 <code>-</code>·<code>*</code>·<code>/</code> 는 숫자로 바꿔 계산하므로 <code>'5' - 2</code> 는 <code>3</code> 입니다.\n💡 개념: 이 비대칭이 자바스크립트 형변환에서 가장 자주 사고를 냅니다.\n🛠 실무: 폼에서 온 값은 전부 문자열이므로, 계산 전에 <code>Number(x)</code> 로 한 번 바꾸고 <code>Number.isNaN</code> 으로 검사하세요." },

{ track:"code", t:"input", cat:"internals", k:"펼치기의 기본 깊이",
  q:"깊이를 안 주고 중첩 배열을 펼치면 어디까지 펴질까요? 출력되는 JSON 을 그대로 적으세요. (예: [1,2,3])",
  code:"console.log(JSON.stringify([1, [2, [3]]].flat()));",
  a:["[1,2,[3]]"],
  ex:"<code>flat()</code> 의 기본 깊이는 <b>1</b> 입니다. 한 겹만 벗기므로 안쪽 배열은 그대로 남습니다.\n💡 개념: 끝까지 펴려면 <code>flat(Infinity)</code> 를 줍니다.\n🛠 실무: 한 겹만 펴는 것이 기본인 이유는 <code>map</code> 뒤에 붙이는 <code>flatMap</code> 쓰임이 가장 흔하기 때문입니다." },

{ track:"code", t:"input", cat:"internals", k:"길이만 준 객체로 배열 만들기",
  q:"길이 정보만 있는 객체로 배열을 만들면서 자리 번호를 두 배로 넣으면 어떤 배열이 나올까요? 출력되는 JSON 을 그대로 적으세요. (예: [1,2,3])",
  code:"console.log(JSON.stringify(Array.from({ length: 3 }, (_, i) => i * 2)));",
  a:["[0,2,4]"],
  ex:"<code>Array.from</code> 은 <code>length</code> 만 있는 객체(유사 배열)도 받아들이고, 두 번째 인자로 <b>자리마다 만들 값</b>을 줄 수 있습니다.\n💡 개념: <code>new Array(3).map(...)</code> 은 칸이 <b>비어 있어</b>(hole) 콜백이 아예 안 불립니다.\n🛠 실무: 0..n-1 같은 수열을 만들 때 가장 짧고 안전한 방법입니다." },

{ track:"code", t:"input", cat:"internals", k:"같은 값을 두 번 넣으면",
  q:"중복이 있는 값들로 집합을 만들면 크기가 얼마일까요? 출력되는 숫자를 적으세요. (숫자)",
  code:"console.log(new Set([1, 1, 2]).size);",
  a:["2"],
  ex:"<code>Set</code> 은 같은 값을 <b>하나만</b> 담습니다. 같음의 기준은 <code>===</code> 에 가까운 SameValueZero 라, <code>NaN</code> 끼리는 같다고 봅니다.\n💡 개념: 개수를 세는 이름이 <code>length</code> 가 아니라 <code>size</code> 인 점도 자주 헷갈립니다.\n🛠 실무: 배열 중복 제거는 <code>[...new Set(arr)]</code> 한 줄이면 됩니다 — 다만 객체는 참조가 다르면 다른 값입니다." },

{ track:"code", t:"input", cat:"internals", k:"빈 조각도 세는가",
  q:"구분자가 연달아 붙은 문자열을 나누면 조각이 몇 개일까요? 출력되는 숫자를 적으세요. (숫자)",
  code:"console.log('a,b,,c'.split(',').length);",
  a:["4"],
  ex:"<code>split</code> 은 <b>빈 조각도 그대로</b> 돌려줍니다 — <code>['a', 'b', '', 'c']</code> 라 넷입니다.\n💡 개념: 이 성질 덕분에 <code>text.split(x).length - 1</code> 이 곧 <b>등장 횟수</b>가 됩니다.\n🛠 실무: CSV 에서 빈 칸은 정당한 값이므로, 빈 조각을 걸러 내면 열이 어긋납니다." },

{ track:"code", t:"input", cat:"internals", k:"직렬화가 버리는 값",
  q:"값이 <code>undefined</code> 인 필드만 있는 객체를 JSON 문자열로 바꾸면 무엇이 나올까요? 출력을 그대로 적으세요. (중괄호 포함)",
  code:"console.log(JSON.stringify({ a: undefined }));",
  a:["{}"],
  ex:"<code>JSON.stringify</code> 는 객체의 <code>undefined</code> 필드를 <b>통째로 버립니다</b>. 함수와 <code>Symbol</code> 도 마찬가지입니다.\n💡 개념: 다만 <b>배열 안</b>의 <code>undefined</code> 는 자리를 지켜야 하므로 <code>null</code> 로 바뀝니다.\n🛠 실무: 로컬 저장소에 상태를 넣을 때 필드가 조용히 사라지는 사고의 원인이 여기입니다 — 저장 전에 정규화하세요." },

{ track:"code", t:"input", cat:"internals", k:"인자 없는 최댓값",
  q:"아무 값도 주지 않고 최댓값을 구하면 무엇이 나올까요? 출력되는 값을 그대로 적으세요. (부호 포함)",
  code:"console.log(Math.max());",
  a:["-Infinity"],
  ex:"최댓값의 <b>항등원</b>이기 때문입니다 — 어떤 값과 견줘도 지는 값에서 시작해야 결과가 맞습니다.\n💡 개념: 같은 이유로 <code>Math.min()</code> 은 <code>Infinity</code>, <code>[].reduce((a,b)=&gt;a+b, 0)</code> 의 0 도 항등원입니다.\n🛠 실무: <code>Math.max(...arr)</code> 에 빈 배열을 넘기면 이 값이 나오므로, 빈 입력을 앞에서 걸러야 합니다." },

];
