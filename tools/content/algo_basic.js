/* 알고리즘 기초 유닛 실습.
   여섯 유닛 전부 고르기만 있고 구현이 하나도 없다. 'BFS 는 큐를 쓴다' 를 고를 줄 알아도
   막상 짜면 방문 표시를 어디서 하는지에서 막힌다. 그 자리를 문제로 만들었다.

   시작 코드는 전부 '그럴듯하게 생겼는데 틀린' 것이다 — 빈 껍데기가 아니다.
   틀린 곳을 찾는 것 자체가 연습이고, 재생 뷰어로 한 줄씩 되감아 볼 수 있다. */
module.exports = [
{
  unit: "시간·공간 복잡도",
  lesson: "직접 짜 보기 — 훑는 횟수를 줄이기",
  th: {
    sum: "같은 답을 내도 '몇 번 훑느냐' 가 다르다. 이중 반복(O(n²))을 한 번 훑기(O(n))로 바꾸는 것이 가장 흔하고 효과 큰 개선이다.",
    body: [
      { h: "배열 안에서 찾기의 비용", t: "`xs.includes(x)` 나 `indexOf` 는 앞에서부터 하나씩 본다. 반복문 **안에서** 쓰면 전체가 O(n²)이 된다. 본 것을 `Set` 에 담아 두면 확인이 O(1)이라 전체가 O(n)으로 떨어진다." },
      { h: "자기 자신과 비교하지 않기", t: "쌍을 비교하는 이중 반복에서 안쪽을 `j = i` 부터 돌리면 자기 자신과도 비교한다. 값이 같은 게 당연하므로 늘 참이 되어 버린다. 안쪽은 `j = i + 1` 부터 시작해야 한다." },
    ],
    code: { c: "// O(n²) — 반복문 안에서 다시 훑는다\nfor (const x of xs) if (seen.includes(x)) …\n\n// O(n) — 확인이 상수 시간\nconst seen = new Set();\nfor (const x of xs) { if (seen.has(x)) …; seen.add(x); }", cap: "안에서 훑으면 제곱이 된다" },
    key: ["반복문 안의 `includes` 는 O(n²)", "`Set.has` 는 평균 O(1)", "쌍 비교의 안쪽은 `j = i + 1`"],
  },
  q: [
    {
      k: "hasDuplicate · 중복이 있는가",
      q: "배열에 <b>같은 값이 두 번 이상</b> 있으면 <code>true</code>, 모두 다르면 <code>false</code> 를 돌려주세요.",
      src: "function hasDuplicate(xs) {\n  for (let i = 0; i < xs.length; i++) {\n    for (let j = i; j < xs.length; j++) {\n      if (xs[i] === xs[j]) return true;\n    }\n  }\n  return false;\n}",
      sol: "function hasDuplicate(xs) {\n  const seen = new Set();\n  for (const x of xs) {\n    if (seen.has(x)) return true;\n    seen.add(x);\n  }\n  return false;\n}",
      tests: [["hasDuplicate([1,2,3])", "false"], ["hasDuplicate([1,2,1])", "true"], ["hasDuplicate([5])", "false"]],
      edge: [["hasDuplicate([])", "false"], ["hasDuplicate(['a','a'])", "true"]],
      ex: "안쪽 반복이 j = i 부터라 자기 자신과 비교합니다. 값이 같은 게 당연하니 항상 true 가 나와요. Set 으로 바꾸면 버그도 사라지고 O(n) 이 됩니다.",
    },
    {
      k: "firstUnique · 딱 한 번만 나온 첫 값",
      q: "배열에서 <b>정확히 한 번만</b> 나온 값 중 <b>가장 먼저</b> 나온 것을 돌려주세요. 없으면 <code>null</code> 입니다.",
      src: "function firstUnique(xs) {\n  for (const x of xs) {\n    if (xs.indexOf(x) === xs.lastIndexOf(x)) return x;\n  }\n  return undefined;\n}",
      sol: "function firstUnique(xs) {\n  const cnt = new Map();\n  for (const x of xs) cnt.set(x, (cnt.get(x) || 0) + 1);\n  for (const x of xs) if (cnt.get(x) === 1) return x;\n  return null;\n}",
      tests: [["firstUnique([1,2,2,3])", "1"], ["firstUnique([2,2,3])", "3"], ["firstUnique([1,1])", "null"]],
      edge: [["firstUnique([])", "null"], ["firstUnique(['a','b','a'])", "'b'"]],
      ex: "없을 때 undefined 를 돌려주고 있어 null 과 다릅니다. 그리고 indexOf·lastIndexOf 를 값마다 부르면 전체가 O(n²) 이에요 — 한 번 세어 두면 O(n) 입니다.",
    },
  ],
},
{
  unit: "배열·해시",
  lesson: "직접 짜 보기 — 해시로 한 번에 끝내기",
  th: {
    sum: "'이미 본 것' 을 기억해 두면 두 번 훑을 일을 한 번으로 줄일 수 있다.",
    body: [
      { h: "두 수의 합", t: "짝을 찾을 때 모든 쌍을 보면 O(n²)이다. 대신 훑으면서 '지금 값의 짝(`target - x`)을 아까 본 적 있나' 를 물으면 한 번에 끝난다. 본 값과 **그 위치**를 함께 담아 두는 것이 요령이다." },
      { h: "동점일 때의 순서", t: "가장 많이 나온 값을 찾을 때 개수가 같으면 무엇을 줄지 정해야 한다. 정하지 않으면 결과가 실행할 때마다 달라 보인다. 보통 '먼저 나온 것' 으로 정한다." },
    ],
    code: { c: "const pos = new Map();\nfor (let i = 0; i < xs.length; i++) {\n  const need = target - xs[i];\n  if (pos.has(need)) return [pos.get(need), i];\n  pos.set(xs[i], i);\n}", cap: "본 값과 그 위치를 함께 기억한다" },
    key: ["짝 찾기는 '아까 본 적 있나' 로 바꾼다", "위치가 필요하면 값과 함께 담는다", "동점 규칙을 정해 둔다"],
  },
  q: [
    {
      k: "twoSum · 합이 target 인 두 자리",
      q: "합이 <code>target</code> 이 되는 <b>두 값의 위치</b>를 <code>[앞, 뒤]</code> 로 돌려주세요. 없으면 <code>null</code> 입니다. 같은 자리를 두 번 쓸 수는 없습니다.",
      src: "function twoSum(xs, target) {\n  const pos = new Map();\n  for (let i = 0; i < xs.length; i++) {\n    pos.set(xs[i], i);\n  }\n  for (let i = 0; i < xs.length; i++) {\n    const need = target - xs[i];\n    if (pos.has(need)) return [i, pos.get(need)];\n  }\n  return null;\n}",
      sol: "function twoSum(xs, target) {\n  const pos = new Map();\n  for (let i = 0; i < xs.length; i++) {\n    const need = target - xs[i];\n    if (pos.has(need)) return [pos.get(need), i];\n    pos.set(xs[i], i);\n  }\n  return null;\n}",
      tests: [["twoSum([2,7,11],9)", "[0,1]"], ["twoSum([3,2,4],6)", "[1,2]"], ["twoSum([1,2],7)", "null"]],
      edge: [["twoSum([3,3],6)", "[0,1]"], ["twoSum([],1)", "null"]],
      ex: "먼저 전부 담아 두면 자기 자신을 짝으로 잡습니다 — [2,7,11] 에서 target 4 면 [0,0] 이 나와요. 훑으면서 '아까 본 것' 중에서만 찾으면 그 문제가 사라집니다.",
    },
    {
      k: "mostFrequent · 가장 많이 나온 값",
      q: "가장 많이 나온 값을 돌려주세요. 개수가 같으면 <b>먼저 나온</b> 값입니다. 배열이 비면 <code>null</code> 입니다.",
      src: "function mostFrequent(xs) {\n  const cnt = new Map();\n  for (const x of xs) cnt.set(x, (cnt.get(x) || 0) + 1);\n  let best = null, bn = -1;\n  for (const [k, v] of cnt) {\n    if (v >= bn) { best = k; bn = v; }\n  }\n  return best;\n}",
      sol: "function mostFrequent(xs) {\n  const cnt = new Map();\n  for (const x of xs) cnt.set(x, (cnt.get(x) || 0) + 1);\n  let best = null, bn = -1;\n  for (const [k, v] of cnt) {\n    if (v > bn) { best = k; bn = v; }\n  }\n  return best;\n}",
      tests: [["mostFrequent([1,2,2,3])", "2"], ["mostFrequent([1,1,2,2])", "1"], ["mostFrequent(['a'])", "'a'"]],
      edge: [["mostFrequent([])", "null"], ["mostFrequent([5,6])", "5"]],
      ex: ">= 로 비교하면 개수가 같을 때 뒤에 나온 값으로 계속 바뀝니다. Map 은 넣은 순서를 지키니 > 로만 바꾸면 '먼저 나온 것' 이 남아요.",
    },
  ],
},
{
  unit: "스택·큐·덱",
  lesson: "직접 짜 보기 — 가장 최근 것부터",
  th: {
    sum: "'가장 최근에 열린 것부터 닫는다' 는 규칙이 보이면 스택이다.",
    body: [
      { h: "괄호 짝 맞추기", t: "개수만 세면 `(]` 처럼 종류가 어긋난 것을 잡지 못한다. 여는 괄호를 쌓아 두고, 닫는 괄호를 만나면 **맨 위와 짝이 맞는지** 확인해야 한다. 끝났을 때 스택이 비어 있어야 완전히 맞은 것이다." },
      { h: "다음 큰 값", t: "각 자리에서 '오른쪽에 처음 나오는 더 큰 값' 을 찾을 때, 아직 답을 못 찾은 자리를 스택에 쌓아 둔다. 더 큰 값이 오면 쌓인 것들을 꺼내며 답을 채운다. 각 원소가 한 번씩만 들어가고 나오므로 전체 O(n)이다." },
    ],
    code: { c: "const pair = { ')': '(', ']': '[', '}': '{' };\nfor (const c of s) {\n  if (c === '(' || c === '[' || c === '{') st.push(c);\n  else if (st.pop() !== pair[c]) return false;\n}\nreturn st.length === 0;", cap: "종류까지 맞는지 봐야 한다" },
    key: ["개수만 세면 종류가 어긋난 것을 놓친다", "끝에 스택이 비어야 맞은 것", "각 원소가 한 번씩 push·pop 되면 O(n)"],
  },
  q: [
    {
      k: "isBalanced · 괄호가 맞는가",
      q: "<code>()[]{}</code> 세 종류의 괄호가 <b>짝과 순서까지</b> 맞으면 <code>true</code> 를 돌려주세요.",
      src: "function isBalanced(s) {\n  let n = 0;\n  for (const c of s) {\n    if (c === '(' || c === '[' || c === '{') n++;\n    else if (c === ')' || c === ']' || c === '}') n--;\n    if (n < 0) return false;\n  }\n  return n === 0;\n}",
      sol: "function isBalanced(s) {\n  const pair = { ')': '(', ']': '[', '}': '{' };\n  const st = [];\n  for (const c of s) {\n    if (c === '(' || c === '[' || c === '{') st.push(c);\n    else if (pair[c]) { if (st.pop() !== pair[c]) return false; }\n  }\n  return st.length === 0;\n}",
      tests: [["isBalanced('()[]')", "true"], ["isBalanced('(]')", "false"], ["isBalanced('([)]')", "false"]],
      edge: [["isBalanced('')", "true"], ["isBalanced('(')", "false"], ["isBalanced('{[()]}')", "true"]],
      ex: "개수만 세면 '(]' 도 통과합니다. 여는 괄호를 쌓아 두고 닫을 때 맨 위와 종류가 맞는지 봐야 해요.",
    },
    {
      k: "nextGreater · 오른쪽의 첫 큰 값",
      q: "각 자리마다 <b>오른쪽에서 처음 나오는 더 큰 값</b>을 담은 배열을 돌려주세요. 없으면 <code>-1</code> 입니다.",
      src: "function nextGreater(xs) {\n  const out = [];\n  for (let i = 0; i < xs.length; i++) {\n    let v = -1;\n    for (let j = 0; j < xs.length; j++) {\n      if (xs[j] > xs[i]) { v = xs[j]; break; }\n    }\n    out.push(v);\n  }\n  return out;\n}",
      sol: "function nextGreater(xs) {\n  const out = new Array(xs.length).fill(-1);\n  const st = [];\n  for (let i = 0; i < xs.length; i++) {\n    while (st.length && xs[st[st.length - 1]] < xs[i]) out[st.pop()] = xs[i];\n    st.push(i);\n  }\n  return out;\n}",
      tests: [["nextGreater([2,1,3])", "[3,3,-1]"], ["nextGreater([3,2,1])", "[-1,-1,-1]"], ["nextGreater([1,2])", "[2,-1]"]],
      edge: [["nextGreater([])", "[]"], ["nextGreater([5])", "[-1]"], ["nextGreater([1,1,2])", "[2,2,-1]"]],
      ex: "안쪽 반복이 0 부터 시작해 '오른쪽' 이 아니라 배열 전체에서 찾습니다. [2,1,3] 의 두 번째 칸이 왼쪽의 2 를 답으로 잡아요.",
    },
  ],
},
{
  unit: "트리·힙",
  lesson: "직접 짜 보기 — 갈래를 모두 보기",
  th: {
    sum: "트리는 갈래가 둘이다. 한쪽만 보면 답이 조용히 작아진다.",
    body: [
      { h: "양쪽을 모두 재기", t: "깊이를 구할 때 `1 + depth(왼쪽)` 만 쓰면 오른쪽이 더 깊어도 무시된다. 반드시 양쪽을 모두 재서 **더 큰 쪽**을 쓴다. 빈 노드에서 0을 돌려주는 멈춤 조건이 먼저 와야 한다." },
      { h: "상위 k개는 전부 정렬하지 않아도 된다", t: "n개를 다 정렬하면 O(n log n)이다. k개만 필요하면 크기 k짜리 힙으로 O(n log k)에 끝난다. k가 n보다 훨씬 작을 때 차이가 크다." },
    ],
    code: { c: "function depth(node) {\n  if (!node) return 0;\n  return 1 + Math.max(depth(node.l), depth(node.r));\n}", cap: "양쪽을 모두 재고 큰 쪽을 쓴다" },
    key: ["빈 노드에서 멈춘다", "양쪽을 모두 재서 큰 쪽을 쓴다", "상위 k개는 전부 정렬할 필요가 없다"],
  },
  q: [
    {
      k: "depth · 트리의 깊이",
      q: "<code>{v, l, r}</code> 모양 트리의 <b>가장 깊은 곳까지의 깊이</b>를 돌려주세요. 빈 트리(<code>null</code>)는 0 입니다.",
      src: "function depth(node) {\n  if (!node) return 0;\n  return 1 + depth(node.l);\n}",
      sol: "function depth(node) {\n  if (!node) return 0;\n  return 1 + Math.max(depth(node.l), depth(node.r));\n}",
      tests: [["depth(null)", "0"],
              ["depth({v:1, l:null, r:{v:2, l:null, r:{v:3, l:null, r:null}}})", "3"],
              ["depth({v:1, l:{v:2, l:null, r:null}, r:null})", "2"]],
      edge: [["depth({v:1, l:null, r:null})", "1"],
             ["depth({v:1, l:{v:2,l:{v:4,l:null,r:null},r:null}, r:{v:3,l:null,r:null}})", "3"]],
      ex: "왼쪽만 재고 있어서 오른쪽이 더 깊으면 답이 작게 나옵니다. 양쪽을 모두 재서 큰 쪽을 써야 해요.",
    },
    {
      k: "topK · 큰 것부터 k개",
      q: "숫자 배열에서 <b>큰 것부터 k개</b>를 배열로 돌려주세요. k가 개수보다 크면 있는 만큼만, 0 이하면 빈 배열입니다.",
      src: "function topK(xs, k) {\n  return xs.sort((a, b) => b - a).slice(0, k);\n}",
      sol: "function topK(xs, k) {\n  if (k <= 0) return [];\n  return [...xs].sort((a, b) => b - a).slice(0, k);\n}",
      tests: [["topK([3,1,4,1,5],2)", "[5,4]"], ["topK([1,2],5)", "[2,1]"], ["topK([1,2,3],0)", "[]"]],
      edge: [["topK([],2)", "[]"], ["topK([7],-1)", "[]"],
             ["(function(){ const a=[3,1,2]; topK(a,2); return a; })()", "[3,1,2]"]],
      ex: "sort 는 받은 배열을 그 자리에서 바꿔서 부른 쪽의 배열까지 뒤섞습니다. 그리고 k 가 음수면 slice(0,-1) 이 되어 엉뚱한 답이 나와요.",
    },
  ],
},
{
  unit: "그래프",
  lesson: "직접 짜 보기 — 넓게 퍼지기",
  th: {
    sum: "BFS 는 큐로 가까운 곳부터 층층이 퍼진다. 그래서 가중치가 없는 그래프의 최단 거리를 준다.",
    body: [
      { h: "방문 표시는 넣을 때", t: "큐에서 **꺼낼 때** 방문 표시를 하면, 같은 노드가 여러 번 큐에 들어간다. 이웃이 많으면 큐가 폭발하고 거리도 덮어써진다. 표시는 큐에 **넣는 순간** 해야 한다 — BFS 에서 가장 흔한 실수다." },
      { h: "왜 최단인가", t: "큐는 먼저 넣은 것을 먼저 꺼낸다. 시작점에서 1칸 거리를 모두 본 뒤에야 2칸을 보므로, 처음 도달했을 때가 곧 최단이다. 그래서 나중에 다시 만나도 갱신할 필요가 없다." },
    ],
    code: { c: "const dist = { [start]: 0 };\nconst q = [start];\nwhile (q.length) {\n  const cur = q.shift();\n  for (const nb of adj[cur] || []) {\n    if (dist[nb] === undefined) {   // 넣을 때 표시\n      dist[nb] = dist[cur] + 1;\n      q.push(nb);\n    }\n  }\n}", cap: "표시는 넣는 순간에 한다" },
    key: ["방문 표시는 큐에 넣을 때", "처음 도달한 거리가 곧 최단", "가중치가 있으면 BFS 로는 안 된다"],
  },
  q: [
    {
      k: "bfsDist · 시작점에서의 거리",
      q: "인접 목록 <code>adj</code> 와 시작점을 받아, <b>닿을 수 있는 노드까지의 최단 거리</b>를 <code>{노드: 거리}</code> 로 돌려주세요. 시작점은 0 입니다.",
      src: "function bfsDist(adj, start) {\n  const dist = {};\n  const q = [start];\n  while (q.length) {\n    const cur = q.shift();\n    if (dist[cur] === undefined) dist[cur] = cur === start ? 0 : 1;\n    for (const nb of adj[cur] || []) {\n      if (dist[nb] === undefined) q.push(nb);\n    }\n  }\n  return dist;\n}",
      sol: "function bfsDist(adj, start) {\n  const dist = { [start]: 0 };\n  const q = [start];\n  while (q.length) {\n    const cur = q.shift();\n    for (const nb of adj[cur] || []) {\n      if (dist[nb] === undefined) {\n        dist[nb] = dist[cur] + 1;\n        q.push(nb);\n      }\n    }\n  }\n  return dist;\n}",
      tests: [["bfsDist({a:['b'], b:['c'], c:[]}, 'a')", "{a:0, b:1, c:2}"],
              ["bfsDist({a:['b','c'], b:[], c:[]}, 'a')", "{a:0, b:1, c:1}"],
              ["bfsDist({a:[]}, 'a')", "{a:0}"]],
      edge: [["bfsDist({a:['b'], b:['a']}, 'a')", "{a:0, b:1}"],
             ["bfsDist({}, 'x')", "{x:0}"]],
      ex: "거리를 '시작점이면 0, 아니면 1' 로 정하고 있어 두 칸 이상 떨어진 곳이 전부 1 이 됩니다. 이웃의 거리는 '지금 노드의 거리 + 1' 이어야 해요.",
    },
    {
      k: "countComponents · 덩어리 개수",
      q: "노드 <code>0..n-1</code> 과 무방향 간선 목록을 받아 <b>연결된 덩어리가 몇 개</b>인지 돌려주세요.",
      src: "function countComponents(n, edges) {\n  const adj = Array.from({ length: n }, () => []);\n  for (const [a, b] of edges) adj[a].push(b);\n  const seen = new Set();\n  let c = 0;\n  for (let i = 0; i < n; i++) {\n    if (seen.has(i)) continue;\n    c++;\n    const st = [i];\n    while (st.length) {\n      const cur = st.pop();\n      if (seen.has(cur)) continue;\n      seen.add(cur);\n      for (const nb of adj[cur]) st.push(nb);\n    }\n  }\n  return c;\n}",
      sol: "function countComponents(n, edges) {\n  const adj = Array.from({ length: n }, () => []);\n  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }\n  const seen = new Set();\n  let c = 0;\n  for (let i = 0; i < n; i++) {\n    if (seen.has(i)) continue;\n    c++;\n    const st = [i];\n    while (st.length) {\n      const cur = st.pop();\n      if (seen.has(cur)) continue;\n      seen.add(cur);\n      for (const nb of adj[cur]) st.push(nb);\n    }\n  }\n  return c;\n}",
      tests: [["countComponents(3, [[0,1]])", "2"], ["countComponents(4, [[0,1],[2,3]])", "2"], ["countComponents(3, [])", "3"]],
      edge: [["countComponents(0, [])", "0"], ["countComponents(2, [[1,0]])", "1"]],
      ex: "간선을 한 방향으로만 넣어서 무방향 그래프가 아니게 됩니다. [[1,0]] 만 있으면 0 에서 1 로 갈 수 없어 덩어리를 두 개로 세요. 양쪽에 모두 넣어야 합니다.",
    },
  ],
},
{
  unit: "정렬·탐색",
  lesson: "직접 짜 보기 — 절반씩 줄이기",
  th: {
    sum: "이진 탐색의 어려움은 아이디어가 아니라 **경계**다. 한 칸 차이로 답을 놓치거나 영영 안 끝난다.",
    body: [
      { h: "끝을 포함하는가", t: "`lo <= hi` 로 돌면 `hi` 를 포함하니 후보가 하나 남아도 검사한다. `lo < hi` 로 돌면 마지막 하나를 안 보고 끝나 답을 놓친다. 어느 쪽을 쓰든 `hi` 의 초기값·갱신과 짝을 맞춰야 한다." },
      { h: "구간이 반드시 줄어야 한다", t: "`lo = mid` 처럼 갱신하면 후보가 둘일 때 제자리를 맴돌아 끝나지 않는다. 찾는 값이 아니면 `lo = mid + 1` 또는 `hi = mid - 1` 로 **한 칸은 반드시** 줄인다." },
    ],
    code: { c: "let lo = 0, hi = xs.length - 1;\nwhile (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  if (xs[mid] === t) return mid;\n  if (xs[mid] < t) lo = mid + 1;\n  else hi = mid - 1;\n}\nreturn -1;", cap: "한 칸은 반드시 줄인다" },
    key: ["`lo <= hi` 와 `lo < hi` 는 끝 처리가 다르다", "구간이 매번 줄어야 끝난다", "못 찾으면 -1"],
  },
  q: [
    {
      k: "binarySearch · 자리 찾기",
      q: "오름차순 배열에서 <code>t</code> 가 있는 <b>위치</b>를 돌려주세요. 없으면 <code>-1</code> 입니다.",
      src: "function binarySearch(xs, t) {\n  let lo = 0, hi = xs.length - 1;\n  while (lo < hi) {\n    const mid = (lo + hi) >> 1;\n    if (xs[mid] === t) return mid;\n    if (xs[mid] < t) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}",
      sol: "function binarySearch(xs, t) {\n  let lo = 0, hi = xs.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (xs[mid] === t) return mid;\n    if (xs[mid] < t) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}",
      tests: [["binarySearch([1,3,5,7],7)", "3"], ["binarySearch([1,3,5,7],1)", "0"], ["binarySearch([1,3,5],4)", "-1"]],
      edge: [["binarySearch([],1)", "-1"], ["binarySearch([9],9)", "0"], ["binarySearch([1,2],2)", "1"]],
      ex: "lo < hi 로 돌면 후보가 하나 남았을 때 검사하지 않고 끝납니다. 원소가 하나인 배열이나 양끝 값을 못 찾아요.",
    },
    {
      k: "mergeIntervals · 겹치는 구간 합치기",
      q: "<code>[시작, 끝]</code> 구간 목록에서 <b>겹치거나 맞닿는</b> 것을 합쳐, 시작 오름차순으로 돌려주세요.",
      src: "function mergeIntervals(xs) {\n  const out = [];\n  for (const [s, e] of xs) {\n    const last = out[out.length - 1];\n    if (last && s <= last[1]) last[1] = Math.max(last[1], e);\n    else out.push([s, e]);\n  }\n  return out;\n}",
      sol: "function mergeIntervals(xs) {\n  const sorted = [...xs].sort((a, b) => a[0] - b[0]);\n  const out = [];\n  for (const [s, e] of sorted) {\n    const last = out[out.length - 1];\n    if (last && s <= last[1]) last[1] = Math.max(last[1], e);\n    else out.push([s, e]);\n  }\n  return out;\n}",
      tests: [["mergeIntervals([[1,3],[2,6],[8,10]])", "[[1,6],[8,10]]"],
              ["mergeIntervals([[3,5],[1,2]])", "[[1,2],[3,5]]"],
              ["mergeIntervals([[1,4],[4,5]])", "[[1,5]]"]],
      edge: [["mergeIntervals([])", "[]"], ["mergeIntervals([[1,2]])", "[[1,2]]"],
             ["mergeIntervals([[5,7],[1,9]])", "[[1,9]]"]],
      ex: "시작 순으로 정렬하지 않으면 겹치는데도 못 알아봅니다. [[5,7],[1,9]] 처럼 뒤에 오는 구간이 앞을 다 덮는 경우가 그렇습니다.",
    },
  ],
},
];
