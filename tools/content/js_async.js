/* 자바스크립트 비동기 실습 — 채점기가 프라미스를 기다리게 된 뒤에야 낼 수 있게 된 문항들.

   앞 배치들에서는 이 유닛을 건너뛰었다. 채점기가 eval 결과를 그대로 비교해서,
   async 함수를 내면 무엇을 써도 통과하지 못하는 가짜 문제가 되기 때문이다.
   이제 프라미스를 기다렸다 비교하므로 제대로 낼 수 있다.

   시간에 기대는 문항은 조심해서 만들었다. '몇 ms 걸렸나' 로 판정하면 느린 기기에서
   흔들린다. 대신 '순서가 맞나', '몇 번 불렸나', '동시에 몇 개가 떠 있었나' 처럼
   세어서 확인한다 — 기계가 느려도 답이 달라지지 않는다. */
module.exports = [
{
  unit: "비동기 기초",
  lesson: "직접 써 보기 — 기다리기와 모으기",
  th: {
    sum: "`await` 는 '이게 끝날 때까지 이 함수만 멈춰 있어' 라는 뜻이다. 프로그램 전체가 멈추는 것이 아니다.",
    body: [
      { h: "async 함수는 늘 프라미스를 돌려준다", t: "`async function f() { return 1; }` 을 그냥 부르면 `1` 이 아니라 프라미스가 나온다. 값을 쓰려면 `await f()` 라고 하거나 `.then()` 을 붙인다. 이걸 잊으면 숫자를 기대한 자리에 `[object Promise]` 가 찍힌다." },
      { h: "줄줄이 기다리면 느려진다", t: "`await a(); await b();` 는 a 가 끝나야 b 를 시작한다. 서로 상관없는 일이라면 `Promise.all([a(), b()])` 로 **함께 보내고 한 번만 기다린다.** 셋을 줄줄이 기다리면 시간이 세 배가 된다." },
      { h: "먼저 시작해야 함께 간다", t: "`Promise.all` 에 넘기기 전에 함수를 **불러 둬야** 동시에 진행된다. `Promise.all([a, b])` 처럼 함수 자체를 넘기면 아무것도 시작되지 않는다 — 괄호를 붙여 부른 결과를 넘긴다." },
    ],
    code: { c: "// 줄줄이 — 느리다\nconst x = await a();\nconst y = await b();\n\n// 함께 — 빠르다\nconst [x2, y2] = await Promise.all([a(), b()]);", cap: "상관없는 일은 함께 보낸다" },
    key: ["`async` 함수는 프라미스를 돌려준다", "상관없으면 `Promise.all`", "넘기기 전에 불러 둬야 함께 간다"],
  },
  q: [
    {
      k: "fetchBoth · 두 가지를 함께 가져오기", cat: "perf",
      q: "두 비동기 함수를 <b>동시에</b> 실행해 결과를 <code>[첫째, 둘째]</code> 로 돌려주세요. 줄줄이 기다리면 안 됩니다.",
      src: "async function fetchBoth(a, b) {\n  const x = await a();\n  const y = await b();\n  return [x, y];\n}",
      sol: "async function fetchBoth(a, b) {\n  return Promise.all([a(), b()]);\n}",
      tests: [["fetchBoth(async () => 1, async () => 2)", "[1, 2]"],
              ["fetchBoth(async () => 'a', async () => 'b')", "['a', 'b']"],
              /* 둘이 동시에 떠 있었는지를 센다 — 시간이 아니라 개수로 판정한다 */
              ["(function(){ let live = 0, peak = 0;\n  const mk = v => async () => { live++; peak = Math.max(peak, live);\n    await new Promise(r => setTimeout(r, 20)); live--; return v; };\n  return fetchBoth(mk(1), mk(2)).then(() => peak); })()", "2"]],
      edge: [["fetchBoth(async () => null, async () => 0)", "[null, 0]"]],
      ex: "await 를 줄줄이 쓰면 첫째가 끝나야 둘째가 시작합니다. 서로 상관없는 일이면 함께 보내야 해요 — 동시에 떠 있는 개수를 세어 보면 줄줄이 방식은 늘 1입니다.",
    },
    {
      k: "safeFetch · 실패하면 기본값", cat: "internals",
      q: "비동기 함수를 실행하되 <b>실패하면</b> 기본값을 돌려주세요. 성공하면 그 값을 그대로 줍니다.",
      src: "async function safeFetch(fn, def) {\n  const v = fn();\n  return v;\n}",
      sol: "async function safeFetch(fn, def) {\n  try {\n    return await fn();\n  } catch (e) {\n    return def;\n  }\n}",
      tests: [["safeFetch(async () => 7, 0)", "7"],
              ["safeFetch(async () => { throw new Error('x'); }, 0)", "0"],
              ["safeFetch(async () => { throw new Error('x'); }, 'fallback')", "'fallback'"]],
      edge: [["safeFetch(async () => 0, 9)", "0"], ["safeFetch(async () => null, 9)", "null"]],
      ex: "try 안에서 await 를 하지 않으면 프라미스만 돌려주고 catch 를 지나갑니다. 나중에 거부되어도 여기서는 잡지 못해요 — return await 로 기다려야 catch 가 걸립니다.",
    },
  ],
},
{
  unit: "비동기와 Promise",
  lesson: "직접 써 보기 — 순서와 재시도",
  th: {
    sum: "`Promise.all` 은 하나라도 실패하면 통째로 실패한다. `Promise.allSettled` 는 전부 기다리고 결과를 각각 알려 준다.",
    body: [
      { h: "하나 실패하면 전부 실패", t: "`Promise.all` 은 첫 실패가 나는 순간 거부된다. 나머지가 성공했어도 결과를 받을 수 없다. '되는 것만이라도 쓰겠다' 면 `allSettled` 를 쓴다 — 각 항목이 `status` 와 값을 함께 준다." },
      { h: "순서대로 해야 할 때", t: "앞 결과가 다음 입력이면 함께 보낼 수 없다. `for` 문 안에서 `await` 하면 순서가 지켜진다. `forEach` 안의 `await` 는 기다려 주지 않으므로 쓰면 안 된다 — 전부 동시에 출발해 버린다." },
      { h: "다시 시도하기", t: "실패를 몇 번까지 다시 해 볼지 정해 둔다. 무한히 시도하면 서버가 더 힘들어진다. 시도 사이에 잠깐 쉬고, 횟수를 다 쓰면 마지막 오류를 그대로 올려 보낸다." },
    ],
    code: { c: "// 순서대로\nfor (const id of ids) {\n  out.push(await load(id));\n}\n\n// 되는 것만\nconst rs = await Promise.allSettled(tasks);", cap: "forEach 안의 await 는 기다려 주지 않는다" },
    key: ["`all` 은 하나 실패하면 전부 실패", "`allSettled` 는 각각 알려 준다", "순서가 필요하면 `for` + `await`"],
  },
  q: [
    {
      k: "inOrder · 순서대로 처리하기", cat: "debug",
      q: "값 목록을 <b>앞에서부터 차례로</b> 처리해 결과 배열을 돌려주세요. 앞의 것이 끝나야 다음이 시작되어야 합니다.",
      src: "async function inOrder(xs, fn) {\n  const out = [];\n  xs.forEach(async x => {\n    out.push(await fn(x));\n  });\n  return out;\n}",
      sol: "async function inOrder(xs, fn) {\n  const out = [];\n  for (const x of xs) {\n    out.push(await fn(x));\n  }\n  return out;\n}",
      tests: [["inOrder([1, 2, 3], async x => x * 2)", "[2, 4, 6]"],
              ["inOrder([], async x => x)", "[]"],
              /* 동시에 두 개가 떠 있으면 순서대로가 아니다 */
              ["(function(){ let live = 0, peak = 0;\n  const fn = async x => { live++; peak = Math.max(peak, live);\n    await new Promise(r => setTimeout(r, 10)); live--; return x; };\n  return inOrder([1, 2, 3], fn).then(() => peak); })()", "1"]],
      edge: [["inOrder(['a'], async x => x + '!')", "['a!']"]],
      ex: "forEach 는 넘긴 함수가 async 여도 기다려 주지 않습니다. 셋이 동시에 출발하고 out 은 빈 배열인 채로 돌아가요. 순서가 필요하면 for…of 안에서 await 해야 합니다.",
    },
    {
      k: "allResults · 되는 것만이라도", cat: "internals",
      q: "여러 비동기 작업을 실행해 <b>성공한 값만</b> 배열로 모아 주세요. 하나가 실패해도 나머지는 살아야 합니다.",
      src: "async function allResults(tasks) {\n  return Promise.all(tasks.map(t => t()));\n}",
      sol: "async function allResults(tasks) {\n  const rs = await Promise.allSettled(tasks.map(t => t()));\n  return rs.filter(r => r.status === 'fulfilled').map(r => r.value);\n}",
      tests: [["allResults([async () => 1, async () => 2])", "[1, 2]"],
              ["allResults([async () => 1, async () => { throw new Error('x'); }, async () => 3])", "[1, 3]"],
              ["allResults([])", "[]"]],
      edge: [["allResults([async () => { throw new Error('x'); }])", "[]"],
             ["allResults([async () => 0])", "[0]"]],
      ex: "Promise.all 은 하나가 실패하면 통째로 거부돼 성공한 값도 못 받습니다. allSettled 는 전부 기다린 뒤 각각의 상태를 알려 주니, 성공한 것만 골라낼 수 있어요.",
    },
  ],
},
{
  unit: "비동기 실무 심화: 동시성 제어와 취소",
  lesson: "직접 써 보기 — 몇 개까지 동시에",
  th: {
    sum: "동시에 보내는 개수를 제한하지 않으면 서버가 무너진다. '한 번에 몇 개까지' 를 정해 두는 것이 실무의 기본이다.",
    body: [
      { h: "왜 제한하나", t: "1,000건을 `Promise.all` 로 한꺼번에 보내면 요청 1,000개가 동시에 나간다. 서버는 거절하고, 브라우저는 연결 수 제한에 걸려 오히려 느려진다. 보통 5~10개씩 나눠 보낸다." },
      { h: "일꾼을 정해 두기", t: "정해진 수의 '일꾼' 이 목록에서 다음 일을 하나씩 꺼내 간다. 하나가 끝나면 그 일꾼이 다음 것을 집는다. 그래서 동시에 떠 있는 개수가 항상 제한 이하로 유지된다." },
      { h: "결과 순서를 지키기", t: "먼저 끝난 것부터 담으면 순서가 뒤섞인다. 각 일에 원래 번호를 붙여 두고 그 자리에 결과를 넣으면 입력 순서가 그대로 유지된다." },
    ],
    code: { c: "let i = 0;\nconst out = new Array(xs.length);\nconst 일꾼 = async () => {\n  while (i < xs.length) {\n    const k = i++;\n    out[k] = await fn(xs[k]);\n  }\n};\nawait Promise.all([일꾼(), 일꾼()]);", cap: "일꾼이 다음 일을 하나씩 집어 간다" },
    key: ["한꺼번에 보내면 오히려 느려진다", "일꾼 수로 동시 개수를 정한다", "번호를 붙여 순서를 지킨다"],
  },
  q: [
    {
      k: "mapLimit · 동시 개수 제한하기", cat: "perf",
      q: "목록을 처리하되 <b>동시에 2개까지만</b> 실행하세요. 결과는 <b>입력 순서</b>를 지켜야 합니다.",
      src: "async function mapLimit(xs, fn) {\n  return Promise.all(xs.map(fn));\n}",
      sol: "async function mapLimit(xs, fn) {\n  const out = new Array(xs.length);\n  let i = 0;\n  const worker = async () => {\n    while (i < xs.length) {\n      const k = i++;\n      out[k] = await fn(xs[k]);\n    }\n  };\n  await Promise.all([worker(), worker()]);\n  return out;\n}",
      tests: [["mapLimit([1, 2, 3, 4], async x => x * 10)", "[10, 20, 30, 40]"],
              ["mapLimit([], async x => x)", "[]"],
              ["(function(){ let live = 0, peak = 0;\n  const fn = async x => { live++; peak = Math.max(peak, live);\n    await new Promise(r => setTimeout(r, 10)); live--; return x; };\n  return mapLimit([1,2,3,4,5,6], fn).then(() => peak); })()", "2"]],
      edge: [["mapLimit([5], async x => x)", "[5]"],
             ["mapLimit([1,2,3], async x => x).then(r => r.length)", "3"]],
      ex: "Promise.all(xs.map(fn)) 은 전부 한꺼번에 출발시킵니다. 여섯 개면 여섯 개가 동시에 떠요. 일꾼 둘이 목록에서 하나씩 집어 가게 하면 동시 개수가 늘 2 이하로 유지됩니다.",
    },
    {
      k: "withTimeout · 오래 걸리면 포기", cat: "internals",
      q: "비동기 작업이 <b>제한 시간 안에</b> 끝나면 그 값을, 넘기면 <code>'timeout'</code> 을 돌려주세요.",
      src: "async function withTimeout(fn, ms) {\n  return fn();\n}",
      sol: "async function withTimeout(fn, ms) {\n  const timer = new Promise(r => setTimeout(() => r('timeout'), ms));\n  return Promise.race([fn(), timer]);\n}",
      tests: [["withTimeout(async () => 'fast', 200)", "'fast'"],
              ["withTimeout(() => new Promise(r => setTimeout(() => r('slow'), 300)), 50)", "'timeout'"],
              ["withTimeout(async () => 0, 100)", "0"]],
      edge: [["withTimeout(() => new Promise(() => {}), 40)", "'timeout'"]],
      ex: "그냥 부르면 끝날 때까지 무한정 기다립니다. 응답 없는 서버를 만나면 화면이 영영 로딩 상태로 남아요. Promise.race 로 작업과 타이머를 겨루게 하면 먼저 끝난 쪽이 이깁니다.",
    },
  ],
},
{
  unit: "이벤트 루프와 태스크 큐",
  lesson: "직접 써 보기 — 실행 순서 만들기",
  th: {
    sum: "자바스크립트는 한 번에 하나만 실행한다. 미룬 일들은 **줄을 서서** 차례를 기다린다.",
    body: [
      { h: "두 줄이 있다", t: "`setTimeout` 은 큰 줄(매크로태스크), `Promise.then` 은 작은 줄(마이크로태스크)에 선다. 지금 하던 일이 끝나면 **작은 줄을 전부 비운 뒤** 큰 줄에서 하나를 꺼낸다. 그래서 `setTimeout(f, 0)` 보다 `Promise.resolve().then(f)` 가 먼저 실행된다." },
      { h: "0ms 도 지금이 아니다", t: "`setTimeout(f, 0)` 은 '즉시' 가 아니라 '지금 하던 일이 다 끝난 뒤' 다. 그래서 그 뒤에 적은 동기 코드가 먼저 돈다. 순서가 이상해 보이면 무엇이 동기이고 무엇이 미뤄진 것인지부터 가른다." },
      { h: "오래 걸리는 동기 코드는 다 막는다", t: "무거운 반복문을 돌리는 동안에는 클릭도 화면 갱신도 멈춘다. 줄에 선 일들이 차례를 못 받기 때문이다. 큰 작업은 잘게 쪼개 사이사이 줄을 비워 준다." },
    ],
    code: { c: "console.log('1');\nsetTimeout(() => console.log('4'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('2');\n// 1 2 3 4", cap: "작은 줄을 다 비운 뒤 큰 줄로 간다" },
    key: ["`then` 은 작은 줄, `setTimeout` 은 큰 줄", "`0ms` 도 지금이 아니다", "동기 코드는 모든 것을 막는다"],
  },
  q: [
    {
      k: "order · 실행 순서 맞히기", cat: "internals",
      q: "<code>log</code> 에 <code>['sync', 'micro', 'macro']</code> 순서로 쌓이게 하세요. 세 가지를 <b>모두 시작해 둔 뒤</b> 기다립니다.",
      src: "function order(log) {\n  setTimeout(() => log.push('macro'), 0);\n  Promise.resolve().then(() => log.push('micro'));\n  log.push('sync');\n  return log;\n}",
      sol: "function order(log) {\n  setTimeout(() => log.push('macro'), 0);\n  Promise.resolve().then(() => log.push('micro'));\n  log.push('sync');\n  return new Promise(r => setTimeout(() => r(log), 10));\n}",
      tests: [["order([])", "['sync', 'micro', 'macro']"],
              ["order(['시작'])", "['시작', 'sync', 'micro', 'macro']"]],
      edge: [["order([]).then ? true : false", "true"]],
      ex: "미룬 일들이 아직 줄에 서 있는데 배열을 그대로 돌려주면 'sync' 하나만 담겨 있습니다. 결과를 보려면 줄이 비워질 때까지 기다렸다가 돌려줘야 해요 — 그래서 프라미스를 돌려줍니다.",
    },
    {
      k: "chunked · 잘게 쪼개 돌리기", cat: "perf",
      q: "큰 배열을 처리하되 <b>중간중간 줄을 비워</b> 다른 일이 끼어들 수 있게 하세요. 결과는 각 값에 함수를 적용한 배열입니다.",
      src: "async function chunked(xs, fn) {\n  return xs.map(fn);\n}",
      sol: "async function chunked(xs, fn) {\n  const out = [];\n  for (let i = 0; i < xs.length; i++) {\n    out.push(fn(xs[i]));\n    if (i % 100 === 99) await new Promise(r => setTimeout(r, 0));\n  }\n  return out;\n}",
      tests: [["chunked([1, 2, 3], x => x * 2)", "[2, 4, 6]"],
              ["chunked([], x => x)", "[]"],
              /* 250개면 중간에 최소 두 번은 줄을 비워야 한다 */
              ["(function(){ let ticks = 0;\n  const t = setInterval(() => ticks++, 0);\n  const xs = Array.from({length: 250}, (_, i) => i);\n  return chunked(xs, x => x).then(r => { clearInterval(t);\n    return r.length === 250 && ticks >= 2; }); })()", "true"]],
      edge: [["chunked([5], x => x + 1)", "[6]"]],
      ex: "map 은 한 번에 끝까지 돌아 그동안 아무 일도 끼어들지 못합니다. 중간에 await 로 줄을 한 번 비워 주면 클릭이나 화면 갱신이 처리될 틈이 생겨요.",
    },
  ],
},
];
