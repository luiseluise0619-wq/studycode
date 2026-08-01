/* 자바스크립트 기초 유닛 실습.
   지금 '자바스크립트 첫걸음' 은 13문항 전부 고르기다 — 코드를 한 줄도 안 쓴다.

   JS 는 인터넷 없이 브라우저에서 바로 채점되고, 재생 뷰어와도 바로 이어진다.
   틀리면 그 자리에서 '왜 이 값이 나왔는지' 를 한 줄씩 되감아 볼 수 있다. */
module.exports = [
{
  unit: "자바스크립트 첫걸음",
  lesson: "직접 써 보기 — 값과 조건",
  th: {
    sum: "읽어서 아는 것과 손으로 쓰는 것은 다르다. 여기서는 직접 함수를 채운다.",
    body: [
      { h: "돌려주기와 찍기", t: "`console.log` 는 화면에 보여줄 뿐이다. 채점은 `return` 한 값을 본다. `return` 이 없는 함수는 `undefined` 를 돌려준다 — 그래서 테스트가 전부 틀린다." },
      { h: "== 대신 ===", t: "`==` 는 타입이 다르면 몰래 맞춰 본다. `\"1\" == 1` 이 참이다. 그래서 실무에서는 타입까지 보는 `===` 만 쓴다. 안 그러면 `0 == \"\"` 같은 곳에서 조용히 틀린다." },
    ],
    code: { c: "function 두배(n) {\n  return n * 2;   // return 이 있어야 값이 나간다\n}\n\n\"1\" == 1    // true  — 타입을 몰래 맞춘다\n\"1\" === 1   // false — 이게 안전하다", cap: "return 으로 돌려주고, 비교는 === 로" },
    key: ["`return` 이 없으면 `undefined` 를 돌려준다", "비교는 항상 `===`", "`console.log` 는 채점과 무관하다"],
  },
  q: [
    {
      k: "greet · 인사말 만들기", cat: "internals",
      q: "이름을 받아 <code>\"안녕, 이름!\"</code> 문자열을 <b>돌려주는</b> 함수를 완성하세요.",
      src: "function greet(name) {\n  console.log(\"안녕, \" + name + \"!\");\n}",
      sol: "function greet(name) {\n  return \"안녕, \" + name + \"!\";\n}",
      tests: [["greet('세계')", "'안녕, 세계!'"], ["greet('가영')", "'안녕, 가영!'"]],
      edge: [["greet('')", "'안녕, !'"]],
      ex: "console.log 는 화면에 보여줄 뿐 값을 돌려주지 않습니다. return 이 없으면 undefined 가 나가요.",
    },
    {
      k: "sameValue · === 로 정확히 비교", cat: "debug",
      q: "두 값이 <b>타입까지 같을 때만</b> <code>true</code> 를 돌려주세요. <code>sameValue(1, \"1\")</code> 은 <code>false</code> 입니다.",
      src: "function sameValue(a, b) {\n  return a == b;\n}",
      sol: "function sameValue(a, b) {\n  return a === b;\n}",
      tests: [["sameValue(1, 1)", "true"], ["sameValue(1, '1')", "false"], ["sameValue('a', 'a')", "true"]],
      edge: [["sameValue(0, '')", "false"], ["sameValue(null, undefined)", "false"]],
      ex: "== 는 타입이 다르면 몰래 맞춰 봅니다. 1 == \"1\" 이 true 가 돼요. === 는 타입까지 봅니다.",
    },
  ],
},
{
  unit: "함수와 데이터",
  lesson: "직접 써 보기 — 배열을 다루는 함수",
  th: {
    sum: "배열을 다루는 함수는 '원본을 고치는 것' 과 '새로 만들어 돌려주는 것' 이 갈린다. 섞으면 사고가 난다.",
    body: [
      { h: "고치는 것 · 새로 만드는 것", t: "`push`·`sort`·`reverse`·`splice` 는 **원본을 바꾼다.** `map`·`filter`·`slice`·`concat` 은 **새 배열을 돌려준다.** 남의 배열을 받아서 정렬하면 부른 쪽 배열까지 바뀐다 — 실무에서 자주 터진다." },
      { h: "안전하게 정렬하기", t: "정렬이 필요하면 `[...xs].sort()` 처럼 복사본을 만들어 정렬한다. 그리고 숫자 배열에는 반드시 비교 함수를 준다 — `sort()` 는 기본이 **문자열 순서**라 `[10, 9]` 가 `[10, 9]` 그대로 나온다." },
    ],
    code: { c: "const xs = [10, 9, 2];\nxs.sort();                  // [10, 2, 9] — 문자열 순서!\n[...xs].sort((a,b) => a-b); // [2, 9, 10] — 복사 + 숫자 비교", cap: "sort 는 원본을 바꾸고, 기본이 문자열 순서다" },
    key: ["`push`·`sort`·`reverse` 는 원본을 바꾼다", "숫자 정렬은 `sort((a,b) => a-b)`", "복사는 `[...xs]` 또는 `xs.slice()`"],
  },
  q: [
    {
      k: "sortedCopy · 원본을 지키며 정렬", cat: "debug",
      q: "숫자 배열을 <b>오름차순으로 정렬한 새 배열</b>을 돌려주세요. 원래 배열은 그대로여야 합니다.",
      src: "function sortedCopy(xs) {\n  return xs.sort();\n}",
      sol: "function sortedCopy(xs) {\n  return [...xs].sort((a, b) => a - b);\n}",
      tests: [["sortedCopy([10, 9, 2])", "[2, 9, 10]"],
              ["(function(){ const a=[3,1]; sortedCopy(a); return a; })()", "[3, 1]"]],
      edge: [["sortedCopy([])", "[]"], ["sortedCopy([1])", "[1]"]],
      ex: "두 가지가 틀렸습니다. sort() 는 원본을 바꾸고, 비교 함수가 없으면 문자열 순서로 정렬해 [10,9,2] 가 [10,2,9] 가 돼요.",
    },
    {
      k: "sumBy · 조건에 맞는 것만 더하기", cat: "internals",
      q: "숫자 배열에서 <b>양수만</b> 더한 값을 돌려주세요. 하나도 없으면 <code>0</code> 입니다.",
      src: "function sumBy(xs) {\n  let total;\n  for (const x of xs) {\n    if (x > 0) total += x;\n  }\n  return total;\n}",
      sol: "function sumBy(xs) {\n  let total = 0;\n  for (const x of xs) {\n    if (x > 0) total += x;\n  }\n  return total;\n}",
      tests: [["sumBy([1, -2, 3])", "4"], ["sumBy([-1, -2])", "0"], ["sumBy([5])", "5"]],
      edge: [["sumBy([])", "0"], ["sumBy([0, 1])", "1"]],
      ex: "let total; 은 undefined 로 시작합니다. undefined + 1 은 NaN 이라 결과가 전부 NaN 이 돼요. 0 으로 시작해야 합니다.",
    },
  ],
},
{
  unit: "문자열 메서드",
  lesson: "직접 써 보기 — 문자열 다듬기",
  th: {
    sum: "문자열은 **바뀌지 않는다.** 모든 메서드는 새 문자열을 돌려줄 뿐 원본을 고치지 않는다.",
    body: [
      { h: "돌려받아야 한다", t: "`s.trim()` 만 쓰고 버리면 아무 일도 없다. `s = s.trim()` 처럼 다시 담거나 바로 `return` 해야 한다. 배열의 `push` 와 정반대라서 헷갈리기 쉽다." },
      { h: "replace 의 함정", t: "`s.replace(\"a\", \"b\")` 는 **첫 번째 하나만** 바꾼다. 전부 바꾸려면 `replaceAll` 을 쓰거나 `/a/g` 처럼 g 플래그를 준 정규식을 넘긴다. 조용히 하나만 바뀌어서 늦게 발견되는 버그다." },
    ],
    code: { c: "const s = \"a-b-c\";\ns.replace(\"-\", \"+\");     // 'a+b-c' — 하나만!\ns.replaceAll(\"-\", \"+\");  // 'a+b+c'\ns.replace(/-/g, \"+\");    // 'a+b+c'", cap: "replace 는 첫 번째만 바꾼다" },
    key: ["문자열 메서드는 새 값을 돌려준다", "`replace` 는 첫 하나만, 전부는 `replaceAll`", "`split(\" \")` 은 공백이 두 칸이면 빈 조각이 생긴다"],
  },
  q: [
    {
      k: "slugify · 주소용 문자열 만들기", cat: "internals",
      q: "문자열을 소문자로 바꾸고 <b>모든</b> 공백을 <code>-</code> 로 바꿔 돌려주세요. 앞뒤 공백은 먼저 없앱니다.",
      src: "function slugify(s) {\n  return s.trim().toLowerCase().replace(\" \", \"-\");\n}",
      sol: "function slugify(s) {\n  return s.trim().toLowerCase().replaceAll(\" \", \"-\");\n}",
      tests: [["slugify(' Hello World Now ')", "'hello-world-now'"], ["slugify('A B')", "'a-b'"]],
      edge: [["slugify('one')", "'one'"], ["slugify('  ')", "''"]],
      ex: "replace 는 첫 번째 공백 하나만 바꿉니다. 공백이 둘 이상이면 뒤쪽이 그대로 남아요.",
    },
    {
      k: "countWord · 단어 세기", cat: "internals",
      q: "문장에 들어 있는 단어 개수를 돌려주세요. 공백이 여러 칸이거나 앞뒤에 있어도 정확해야 합니다.",
      src: "function countWord(s) {\n  return s.split(\" \").length;\n}",
      sol: "function countWord(s) {\n  const t = s.trim();\n  if (t === \"\") return 0;\n  return t.split(/\\s+/).length;\n}",
      tests: [["countWord('a b c')", "3"], ["countWord('  a   b  ')", "2"], ["countWord('')", "0"]],
      edge: [["countWord('   ')", "0"], ["countWord('one')", "1"]],
      ex: "split(\" \") 는 공백이 두 칸이면 그 사이에 빈 문자열을 만들어 개수를 부풀립니다. /\\s+/ 로 나누고, 빈 문장은 따로 걸러야 해요.",
    },
  ],
},
{
  unit: "배열 심화",
  lesson: "직접 써 보기 — map·filter·reduce",
  th: {
    sum: "`map` 은 개수를 유지하며 바꾸고, `filter` 는 골라내고, `reduce` 는 하나로 합친다.",
    body: [
      { h: "map 에서 return 을 빠뜨리면", t: "`xs.map(x => { x * 2 })` 는 중괄호를 썼는데 `return` 이 없어 전부 `undefined` 가 된다. 중괄호를 쓰면 반드시 `return` 을 적거나, 아예 중괄호를 빼고 `x => x * 2` 로 쓴다." },
      { h: "reduce 의 시작값", t: "`reduce((a, b) => a + b)` 는 시작값이 없어 빈 배열에서 오류가 난다. 항상 `reduce((a, b) => a + b, 0)` 처럼 시작값을 준다. 이게 빈 입력을 안전하게 만드는 가장 싼 방법이다." },
    ],
    code: { c: "[1,2,3].map(x => x * 2)          // [2,4,6]\n[1,2,3].map(x => { x * 2 })      // [undefined×3] — return 없음\n[].reduce((a,b) => a+b)          // 오류!\n[].reduce((a,b) => a+b, 0)       // 0", cap: "중괄호를 쓰면 return, reduce 에는 시작값" },
    key: ["중괄호 화살표 함수에는 `return` 이 필요하다", "`reduce` 에는 항상 시작값을 준다", "`map` 은 개수를 바꾸지 않는다"],
  },
  q: [
    {
      k: "doubled · 두 배로 바꾸기", cat: "debug",
      q: "숫자 배열의 각 값을 두 배로 바꾼 새 배열을 돌려주세요.",
      src: "function doubled(xs) {\n  return xs.map(x => { x * 2; });\n}",
      sol: "function doubled(xs) {\n  return xs.map(x => x * 2);\n}",
      tests: [["doubled([1,2,3])", "[2,4,6]"], ["doubled([0])", "[0]"]],
      edge: [["doubled([])", "[]"], ["doubled([-1])", "[-2]"]],
      ex: "중괄호를 쓴 화살표 함수는 return 이 없으면 undefined 를 돌려줍니다. 중괄호를 빼거나 return 을 적어야 해요.",
    },
    {
      k: "average · 평균 구하기", cat: "internals",
      q: "숫자 배열의 평균을 돌려주세요. <b>빈 배열이면 0</b> 을 돌려줘야 합니다.",
      src: "function average(xs) {\n  return xs.reduce((a, b) => a + b) / xs.length;\n}",
      sol: "function average(xs) {\n  if (xs.length === 0) return 0;\n  return xs.reduce((a, b) => a + b, 0) / xs.length;\n}",
      tests: [["average([1,2,3])", "2"], ["average([])", "0"], ["average([5])", "5"]],
      edge: [["average([1,2])", "1.5"], ["average([0,0])", "0"]],
      ex: "시작값 없는 reduce 는 빈 배열에서 TypeError 를 던집니다. 시작값 0 을 주고, 나누기 전에 길이도 확인해야 해요.",
    },
  ],
},
{
  unit: "스코프와 클로저",
  lesson: "직접 써 보기 — 값을 기억하는 함수",
  th: {
    sum: "함수가 만들어질 때 주변의 변수를 함께 기억하는 것을 클로저라 한다. 그 변수는 함수가 살아 있는 동안 사라지지 않는다.",
    body: [
      { h: "var 와 let 의 차이", t: "`for (var i …)` 로 만든 함수들은 **같은 i 하나**를 본다. 그래서 나중에 부르면 전부 마지막 값이 나온다. `let` 은 반복마다 새 상자를 만들어 각자 다른 값을 기억한다 — 이 한 글자가 결과를 바꾼다." },
      { h: "감춰진 값", t: "함수 안에서 만든 변수는 밖에서 건드릴 수 없다. 그래서 '바깥에서 마음대로 못 바꾸는 값' 을 만들 때 클로저를 쓴다. 카운터·캐시가 대표적이다." },
    ],
    code: { c: "function 만들기() {\n  let n = 0;              // 밖에서 못 건드린다\n  return () => ++n;\n}\nconst 다음 = 만들기();\n다음();  // 1\n다음();  // 2 — n 을 기억한다", cap: "함수가 자기 주변 변수를 기억한다" },
    key: ["`var` 로 만든 반복 변수는 하나를 공유한다", "`let` 은 반복마다 새로 만든다", "함수 안 변수는 밖에서 못 건드린다"],
  },
  q: [
    {
      k: "makeCounter · 세는 함수 만들기", cat: "internals",
      q: "부를 때마다 1씩 커지는 숫자를 돌려주는 함수를 <b>만들어 돌려주세요.</b> 처음 호출은 1입니다. 카운터를 두 개 만들면 서로 영향이 없어야 합니다.",
      src: "let n = 0;\nfunction makeCounter() {\n  return function () { return ++n; };\n}",
      sol: "function makeCounter() {\n  let n = 0;\n  return function () { return ++n; };\n}",
      tests: [["(function(){ const c = makeCounter(); return [c(), c(), c()]; })()", "[1,2,3]"],
              ["(function(){ const a = makeCounter(), b = makeCounter(); a(); a(); return b(); })()", "1"]],
      edge: [["makeCounter()()", "1"]],
      ex: "n 을 함수 밖에 두면 모든 카운터가 그 하나를 나눠 씁니다. 두 번째 카운터가 1부터 시작하지 않아요. n 은 makeCounter 안에 있어야 합니다.",
    },
    {
      k: "makeAdders · var 의 함정", cat: "debug",
      q: "0부터 n-1까지 각각을 더해 주는 함수들의 배열을 돌려주세요. <code>makeAdders(3)[1](10)</code> 은 <code>11</code> 입니다.",
      src: "function makeAdders(n) {\n  const out = [];\n  for (var i = 0; i < n; i++) {\n    out.push(function (x) { return x + i; });\n  }\n  return out;\n}",
      sol: "function makeAdders(n) {\n  const out = [];\n  for (let i = 0; i < n; i++) {\n    out.push(function (x) { return x + i; });\n  }\n  return out;\n}",
      tests: [["makeAdders(3)[1](10)", "11"], ["makeAdders(3)[0](5)", "5"], ["makeAdders(3)[2](0)", "2"]],
      edge: [["makeAdders(1)[0](7)", "7"], ["makeAdders(0).length", "0"]],
      ex: "var 로 만든 i 는 반복 전체가 하나를 공유합니다. 함수들이 전부 마지막 값(n)을 봐요. let 으로 바꾸면 반복마다 새 i 가 생깁니다.",
    },
  ],
},
{
  unit: "this와 프로토타입",
  lesson: "직접 써 보기 — this 가 가리키는 것",
  th: {
    sum: "`this` 는 **어떻게 불렸는지**로 정해진다. 어디에 적혀 있는지가 아니다.",
    body: [
      { h: "떼어 내면 잃어버린다", t: "`obj.f()` 로 부르면 `this` 는 obj 다. 그런데 `const g = obj.f;` 로 떼어 내 `g()` 로 부르면 `this` 를 잃는다. 콜백으로 넘길 때 가장 자주 터진다 — `setTimeout(obj.f)` 가 그렇다." },
      { h: "화살표 함수는 다르다", t: "화살표 함수는 자기 `this` 를 만들지 않고 **만들어질 때 주변의 this** 를 그대로 쓴다. 그래서 메서드 안의 콜백에는 화살표가 안전하고, 반대로 객체의 메서드 자체를 화살표로 쓰면 `this` 가 객체를 가리키지 않는다." },
    ],
    code: { c: "const o = { n: 1, get() { return this.n; } };\no.get();              // 1\nconst g = o.get;\n// g();               // 오류 — this 를 잃었다\nconst h = o.get.bind(o);\nh();                  // 1 — 묶어 두면 안전", cap: "this 는 부르는 방식으로 정해진다" },
    key: ["`this` 는 호출 방식이 정한다", "떼어 내면 `bind` 로 묶는다", "화살표 함수는 주변의 `this` 를 쓴다"],
  },
  q: [
    {
      k: "Bag · 메서드를 떼어 내도 도는 객체", cat: "debug",
      q: "<code>add</code> 를 <b>변수에 떼어 내 불러도</b> 동작하는 <code>makeBag</code> 을 완성하세요. <code>size()</code> 는 담긴 개수를 돌려줍니다.",
      src: "function makeBag() {\n  return {\n    items: [],\n    add(x) { this.items.push(x); return this; },\n    size() { return this.items.length; }\n  };\n}",
      sol: "function makeBag() {\n  const items = [];\n  return {\n    items,\n    add(x) { items.push(x); return this; },\n    size() { return items.length; }\n  };\n}",
      tests: [["(function(){ const b = makeBag(); const add = b.add; add(1); add(2); return b.size(); })()", "2"],
              ["(function(){ const b = makeBag(); b.add(1); return b.size(); })()", "1"]],
      edge: [["makeBag().size()", "0"]],
      ex: "this.items 는 떼어 내 부르는 순간 this 를 잃어 터집니다. 클로저로 items 를 잡아 두면 어떻게 불려도 안전해요.",
    },
    {
      k: "delayedName · 콜백 안의 this", cat: "debug",
      q: "<code>describe()</code> 가 콜백 안에서도 자기 이름을 읽어 <code>\"이름: 가영\"</code> 을 돌려주게 고치세요.",
      src: "function makeUser(name) {\n  return {\n    name,\n    describe() {\n      const f = function () { return \"이름: \" + this.name; };\n      return f();\n    }\n  };\n}",
      sol: "function makeUser(name) {\n  return {\n    name,\n    describe() {\n      const f = () => \"이름: \" + this.name;\n      return f();\n    }\n  };\n}",
      tests: [["makeUser('가영').describe()", "'이름: 가영'"], ["makeUser('나연').describe()", "'이름: 나연'"]],
      /* 빈 이름은 엣지로 쓰지 않는다 — 브라우저의 느슨한 모드에서는 this 가 window 라
         window.name 이 빈 문자열이어서 시작 코드가 우연히 통과해 버린다. */
      edge: [["makeUser('x').describe()", "'이름: x'"]],
      ex: "일반 function 은 부를 때 자기 this 를 새로 만듭니다. 그냥 f() 로 부르면 객체를 가리키지 않아요. 화살표 함수는 주변의 this 를 그대로 씁니다.",
    },
  ],
},
];
