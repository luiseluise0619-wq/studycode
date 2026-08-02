/* 자바스크립트 중급 유닛 실습 — 실습이 0이던 유닛 중 동기 코드로 채점되는 것들.

   비동기 유닛은 여기서 다루지 않는다. 채점기는 eval 결과를 그대로 비교하므로
   프라미스를 기다리지 못한다. 억지로 넣으면 '항상 통과' 하는 가짜 문제가 된다.
   비동기는 채점기를 먼저 손봐야 한다 — 그때까지는 손대지 않는다. */
module.exports = [
{
  unit: "현대 문법 정확히 쓰기 실무 심화",
  lesson: "직접 써 보기 — ?. 와 ?? 를 정확히",
  th: {
    sum: "`?.` 는 '없으면 멈춘다', `??` 는 '없을 때만 대신 쓴다'. `||` 와 헷갈리면 0과 빈 문자열에서 조용히 틀린다.",
    body: [
      { h: "|| 와 ?? 의 차이", t: "`a || b` 는 a 가 **거짓 같으면** b 를 쓴다 — `0`, `\"\"`, `false` 도 거짓이라 넘어간다. `a ?? b` 는 a 가 `null` 이나 `undefined` 일 때**만** b 를 쓴다. 수량 0, 빈 이름, '알림 끔(false)' 이 기본값으로 덮이는 사고가 여기서 난다." },
      { h: "?. 는 어디까지 멈추나", t: "`a?.b.c` 는 a 가 없으면 통째로 `undefined` 다. 하지만 a 는 있고 b 가 없으면 `.c` 에서 터진다 — 이어지는 곳마다 `?.` 를 붙여야 한다. 함수 호출은 `f?.()`, 배열은 `xs?.[0]` 이다." },
    ],
    code: { c: "0 || 10        // 10 — 0 이 덮인다\n0 ?? 10        // 0  — 이게 보통 원하는 것\n\nuser?.profile?.name   // 중간이 없어도 안 터진다", cap: "0 과 빈 문자열은 '없음' 이 아니다" },
    key: ["`||` 는 0·빈 문자열도 덮는다", "`??` 는 null·undefined 만 본다", "이어지는 곳마다 `?.` 가 필요하다"],
  },
  q: [
    {
      k: "설정 기본값 채우기",
      q: "설정 객체에서 <code>retry</code> 를 읽되 <b>값이 없을 때만</b> 3 을 쓰세요. <code>0</code> 은 그대로 0 이어야 합니다.",
      src: "function getRetry(cfg) {\n  return cfg.retry || 3;\n}",
      sol: "function getRetry(cfg) {\n  return cfg.retry ?? 3;\n}",
      tests: [["getRetry({retry: 5})", "5"], ["getRetry({retry: 0})", "0"], ["getRetry({})", "3"]],
      edge: [["getRetry({retry: null})", "3"], ["getRetry({retry: false})", "false"]],
      ex: "|| 는 0 도 거짓으로 봐서 기본값으로 덮어 버립니다. '재시도 0회' 가 '3회' 로 바뀌는 사고예요.",
    },
    {
      k: "깊은 곳 안전하게 읽기",
      q: "<code>user.profile.name</code> 을 읽되 <b>중간이 없어도 터지지 않게</b> 하세요. 없으면 <code>\"익명\"</code> 입니다. 이름이 빈 문자열이면 그대로 빈 문자열입니다.",
      src: "function nameOf(user) {\n  return user.profile.name ?? \"익명\";\n}",
      sol: "function nameOf(user) {\n  return user?.profile?.name ?? \"익명\";\n}",
      tests: [["nameOf({profile:{name:'가영'}})", "'가영'"], ["nameOf({})", "'익명'"], ["nameOf(null)", "'익명'"]],
      edge: [["nameOf({profile:{}})", "'익명'"], ["nameOf({profile:{name:''}})", "''"]],
      ex: "?? 는 이미 값을 읽은 뒤에 동작합니다. 읽는 도중 터지면 소용이 없어요 — 이어지는 곳마다 ?. 가 필요합니다.",
    },
  ],
},
{
  unit: "에러 처리와 디버깅 실무 심화",
  lesson: "직접 써 보기 — 삼키지 않고 다루기",
  th: {
    sum: "가장 나쁜 에러 처리는 `catch {}` 로 조용히 삼키는 것이다. 문제가 사라지는 게 아니라 **보이지 않게** 될 뿐이다.",
    body: [
      { h: "무엇을 잡을지 정한다", t: "모든 에러를 뭉뚱그려 잡으면, 예상한 실패와 진짜 버그가 같은 취급을 받는다. 종류를 확인하고(`e instanceof …`), 다룰 수 없는 것은 다시 던진다. 그래야 위에서 알아챌 수 있다." },
      { h: "finally 는 반드시 돈다", t: "`finally` 는 성공하든 던지든 실행된다. 그래서 정리(자물쇠 풀기·연결 닫기)를 넣는 자리다. 다만 `finally` 안에서 `return` 하면 원래 던지려던 에러가 **사라진다** — 정리만 하고 값은 돌려주지 않는다." },
    ],
    code: { c: "try {\n  return JSON.parse(s);\n} catch (e) {\n  if (e instanceof SyntaxError) return null;\n  throw e;            // 모르는 건 위로 넘긴다\n}", cap: "다룰 수 있는 것만 잡고 나머지는 넘긴다" },
    key: ["`catch {}` 로 삼키지 않는다", "다룰 수 없는 에러는 다시 던진다", "`finally` 에서 `return` 하면 에러가 사라진다"],
  },
  q: [
    {
      k: "safeParse · 깨진 JSON 만 넘기기",
      q: "JSON 문자열을 파싱하되, <b>형식이 잘못된 경우에만</b> <code>null</code> 을 돌려주세요. 그 밖의 에러는 <b>그대로 던져야</b> 합니다.",
      src: "function safeParse(s) {\n  try {\n    return JSON.parse(s);\n  } catch (e) {\n    return null;\n  }\n}",
      sol: "function safeParse(s) {\n  try {\n    return JSON.parse(s);\n  } catch (e) {\n    if (e instanceof SyntaxError) return null;\n    throw e;\n  }\n}",
      tests: [["safeParse('{\"a\":1}').a", "1"], ["safeParse('깨짐')", "null"],
              ["(function(){ const o={}; Object.defineProperty(o,'toString',{value(){ throw new RangeError('x'); }}); try { safeParse(o); return 'no'; } catch (e) { return e.name; } })()", "'RangeError'"]],
      edge: [["safeParse('[]').length", "0"], ["safeParse('')", "null"]],
      ex: "모든 에러를 null 로 뭉개면 진짜 버그까지 조용히 사라집니다. 형식 오류(SyntaxError)만 다루고 나머지는 위로 넘겨야 해요.",
    },
    {
      k: "withCleanup · 정리는 하되 에러는 살리기",
      q: "함수를 실행하고 <b>끝나면 반드시</b> <code>log</code> 에 <code>'done'</code> 을 넣으세요. 함수가 던지면 <b>그 에러는 그대로</b> 나가야 합니다.",
      src: "function withCleanup(fn, log) {\n  try {\n    return fn();\n  } finally {\n    log.push('done');\n    return 'ok';\n  }\n}",
      sol: "function withCleanup(fn, log) {\n  try {\n    return fn();\n  } finally {\n    log.push('done');\n  }\n}",
      tests: [["withCleanup(() => 7, [])", "7"],
              ["(function(){ const l=[]; withCleanup(() => 1, l); return l; })()", "['done']"],
              ["(function(){ const l=[]; try { withCleanup(() => { throw new Error('붐'); }, l); return 'no'; } catch (e) { return e.message; } })()", "'붐'"]],
      edge: [["(function(){ const l=[]; try { withCleanup(() => { throw new Error('x'); }, l); } catch (e) {} return l; })()", "['done']"]],
      ex: "finally 안의 return 은 던지려던 에러를 삼켜 버립니다. 실패가 성공으로 둔갑해요 — finally 에서는 정리만 합니다.",
    },
  ],
},
{
  unit: "숫자와 정밀도 — 부동소수·BigInt·통화 (중급)",
  lesson: "직접 써 보기 — 돈을 안전하게 다루기",
  th: {
    sum: "`0.1 + 0.2 !== 0.3` 이다. 소수는 이진수로 정확히 표현되지 않기 때문이고, 이건 자바스크립트만의 문제가 아니다.",
    body: [
      { h: "돈은 정수로", t: "가격을 원 단위 정수로 두면 오차가 생길 자리가 없다. 화면에 보여줄 때만 나눠서 표시한다. 계산 중간에 소수를 쓰다가 반올림하면, 항목이 많아질수록 오차가 쌓인다." },
      { h: "비교는 오차를 허용해서", t: "어쩔 수 없이 소수를 비교해야 하면 `a === b` 대신 `Math.abs(a - b) < 1e-9` 처럼 아주 작은 차이를 같다고 본다. `Number.EPSILON` 이 그 기준으로 쓰인다." },
    ],
    code: { c: "0.1 + 0.2            // 0.30000000000000004\n0.1 + 0.2 === 0.3    // false\nMath.abs(0.1 + 0.2 - 0.3) < 1e-9   // true", cap: "소수는 정확하지 않다" },
    key: ["돈은 정수(원 단위)로 계산한다", "소수 비교는 오차를 허용한다", "`toFixed` 는 표시용이지 계산용이 아니다"],
  },
  q: [
    {
      k: "nearlyEqual · 소수를 제대로 비교",
      q: "두 소수가 <b>사실상 같은지</b> 판단하세요. 아주 작은 차이(<code>1e-9</code> 미만)는 같은 것으로 봅니다.",
      src: "function nearlyEqual(a, b) {\n  return a === b;\n}",
      sol: "function nearlyEqual(a, b) {\n  return Math.abs(a - b) < 1e-9;\n}",
      tests: [["nearlyEqual(0.1 + 0.2, 0.3)", "true"], ["nearlyEqual(1, 1)", "true"], ["nearlyEqual(1, 1.5)", "false"]],
      edge: [["nearlyEqual(0, 0)", "true"], ["nearlyEqual(1e-12, 0)", "true"]],
      ex: "0.1 + 0.2 는 0.30000000000000004 라 === 로는 다릅니다. 소수는 아주 작은 차이를 허용해 비교해야 해요.",
    },
    {
      k: "totalWon · 합계를 정확히",
      q: "<code>{원, 개수}</code> 목록의 <b>총액</b>을 원 단위 <b>정수</b>로 돌려주세요. 소수 오차가 남으면 안 됩니다.",
      src: "function totalWon(items) {\n  let sum = 0;\n  for (const it of items) sum += (it.원 / 100) * it.개수;\n  return sum * 100;\n}",
      sol: "function totalWon(items) {\n  let sum = 0;\n  for (const it of items) sum += it.원 * it.개수;\n  return sum;\n}",
      tests: [["totalWon([{원:1010, 개수:3}])", "3030"],
              ["totalWon([{원:1, 개수:3},{원:2, 개수:1}])", "5"],
              ["totalWon([])", "0"]],
      edge: [["totalWon([{원:70, 개수:3}])", "210"],
             ["Number.isInteger(totalWon([{원:1010, 개수:3},{원:70, 개수:3}]))", "true"]],
      ex: "100 으로 나눴다 곱하면 그 사이에 소수 오차가 들어옵니다. 정수끼리만 곱하고 더하면 오차가 생길 자리가 없어요.",
    },
  ],
},
{
  unit: "정규표현식 실무 — 그룹·전방탐색·함정 (중급)",
  lesson: "직접 써 보기 — 찾고 바꾸기",
  th: {
    sum: "정규식은 강력하지만 조용히 틀린다. `g` 플래그 하나로 결과가 달라지고, 상태가 남아 두 번째 호출이 어긋난다.",
    body: [
      { h: "g 플래그와 남는 상태", t: "`g` 가 붙은 정규식은 `lastIndex` 를 기억한다. 같은 정규식 객체로 `test()` 를 반복 호출하면 참·거짓이 번갈아 나온다. 검사용에는 `g` 를 붙이지 않고, 붙여야 하면 매번 새로 만든다." },
      { h: "그룹으로 꺼내 쓰기", t: "괄호로 묶은 부분은 `replace` 안에서 `$1`, `$2` 로 다시 쓸 수 있다. 이름을 붙이면(`(?<year>\\d{4})`) 순서가 바뀌어도 안전하다. 전체를 바꾸려면 `replace` 에 `g` 플래그나 `replaceAll` 이 필요하다." },
    ],
    code: { c: "const re = /a/g;\nre.test('a');   // true\nre.test('a');   // false! — lastIndex 가 남아 있다\n\n'2026-08-02'.replace(/(\\d{4})-(\\d{2})/, '$2/$1')", cap: "g 는 상태를 남긴다" },
    key: ["검사용 정규식에 `g` 를 붙이지 않는다", "그룹은 `$1`·`$2` 로 다시 쓴다", "전부 바꾸려면 `g` 또는 `replaceAll`"],
  },
  q: [
    {
      k: "isEmailish · 같은 값을 여러 번 검사",
      q: "문자열에 <code>@</code> 가 들어 있는지 검사하세요. <b>같은 값을 여러 번 물어도 같은 답</b>이 나와야 합니다.",
      src: "const RE = /@/g;\nfunction isEmailish(s) {\n  return RE.test(s);\n}",
      sol: "const RE = /@/;\nfunction isEmailish(s) {\n  return RE.test(s);\n}",
      tests: [["isEmailish('a@b')", "true"], ["isEmailish('없음')", "false"],
              ["(function(){ return [isEmailish('a@b'), isEmailish('a@b'), isEmailish('a@b')].join(','); })()", "'true,true,true'"]],
      edge: [["isEmailish('')", "false"], ["isEmailish('@')", "true"]],
      ex: "g 가 붙은 정규식은 어디까지 봤는지를 기억합니다. 같은 객체로 test 를 반복하면 true·false 가 번갈아 나와요.",
    },
    {
      k: "toSlash · 날짜 형식 바꾸기",
      q: "문장 안의 <b>모든</b> <code>YYYY-MM-DD</code> 를 <code>MM/DD</code> 로 바꾸세요.",
      src: "function toSlash(s) {\n  return s.replace(/(\\d{4})-(\\d{2})-(\\d{2})/, '$2/$3');\n}",
      sol: "function toSlash(s) {\n  return s.replace(/(\\d{4})-(\\d{2})-(\\d{2})/g, '$2/$3');\n}",
      tests: [["toSlash('2026-08-02')", "'08/02'"],
              ["toSlash('2026-01-01 과 2026-12-31')", "'01/01 과 12/31'"],
              ["toSlash('없음')", "'없음'"]],
      edge: [["toSlash('')", "''"], ["toSlash('2026-08-02/2026-08-03')", "'08/02/08/03'"]],
      ex: "g 가 없으면 첫 번째 하나만 바뀝니다. 뒤쪽 날짜가 그대로 남아 조용히 틀려요 — 바꿀 때는 g 가 필요합니다.",
    },
  ],
},
];
