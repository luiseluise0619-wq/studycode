/* 시뮬레이션 12문항 — 시뮬이 하나도 없던 6개 트랙(numpy·pandas·dl·ai·mleval·php)에 2개씩.
   전부 결정적이다(난수·타이머·비동기 없음). 프레임을 되감아 '왜 그렇게 되는지' 를 본다. */

module.exports=[

/* ══ numpy ══ */
{ k:"브로드캐스팅이 맞춰지는 과정",
  q:"두 모양이 브로드캐스팅되는 과정을 <b>뒤에서부터 한 축씩</b> 보여 주세요. 각 축을 처리할 때마다 <code>snap(\"축 \" + i, 지금까지의 결과, {a: x, b: y})</code> 로 기록하고(결과는 <b>앞에서 읽는 순서</b>로), 맞출 수 없으면 <code>snap(\"불가 \" + i, ...)</code> 를 남기고 <code>null</code> 을 돌려주세요. 슬라이더로 되감으면 왜 <code>(5,)</code> 는 되고 <code>(3,)</code> 은 안 되는지가 보입니다.",
  src:`function broadcastSteps(a, b) {
  snap("시작", [], {a: a.join("x") || "()", b: b.join("x") || "()"});
  // 여기에 구현하세요 — 뒤에서부터 한 축씩 맞추고 축마다 snap 을 부르세요
  return null;
}

RESULT = broadcastSteps([4, 1, 3], [2, 3]);`,
  ref:`function broadcastSteps(a, b) {
  const ra = [...a].reverse(), rb = [...b].reverse();
  const n = Math.max(ra.length, rb.length);
  const out = [];
  snap("시작", [], {a: a.join("x") || "()", b: b.join("x") || "()"});
  for (let i = 0; i < n; i++) {
    const x = i < ra.length ? ra[i] : 1;   // 없는 축은 1 로 본다
    const y = i < rb.length ? rb[i] : 1;
    if (x !== y && x !== 1 && y !== 1) {
      snap("불가 " + i, [...out].reverse(), {a: x, b: y});
      return null;
    }
    out.push(x === 1 ? y : x);
    snap("축 " + i, [...out].reverse(), {a: x, b: y});
  }
  return out.reverse();
}

RESULT = broadcastSteps([4, 1, 3], [2, 3]);`,
  tests:[
    {d:"최종 모양이 (4,2,3) 이다", js:"JSON.stringify(RESULT)==='[4,2,3]'"},
    {d:"축마다 장면이 하나씩 기록됐다", js:"FRAMES.filter(f=>/^축/.test(f.label)).length===3"},
    {d:"모든 장면이 양쪽 축 크기를 함께 남긴다", js:"FRAMES.every(f=>f.opt && 'a' in f.opt && 'b' in f.opt)"},
    {d:"축을 하나씩 처리할수록 결과가 한 칸 길어진다", js:"FRAMES.filter(f=>/^축/.test(f.label)).every((f,i)=>f.value.length===i+1)"},
    {d:"마지막 장면이 최종 결과와 같다", js:"JSON.stringify(FRAMES[FRAMES.length-1].value)===JSON.stringify(RESULT)"},
    {d:"결과는 앞에서 읽는 순서다 (뒤집힌 채로 두지 않았다)", js:"FRAMES.filter(f=>/^축/.test(f.label)).slice(-1)[0].value[0]===4"}],
  ex:"🎯 브로드캐스팅을 '규칙 세 줄' 로 외우면 `(5,)` 는 되고 `(3,)` 은 안 되는 이유를 매번 다시 생각해야 합니다. **뒤에서부터 맞춰지는 과정을 한 축씩 되감아 보면** 그 이유가 구조로 남습니다 — 마지막 축이 먼저 만나고, 없는 축은 1 로 채워지며, 1 인 쪽이 늘어납니다.\n💡 뒤에서부터인 것은 관례가 아니라 **메모리 배치** 때문입니다. C 순서에서 마지막 축이 연속으로 놓이므로, 뒤쪽 축을 맞추면 데이터를 복사하지 않고 stride 를 0 으로 두어 '같은 값을 반복해 읽는' 것으로 확장할 수 있습니다. 그래서 브로드캐스팅은 메모리를 거의 쓰지 않습니다.\n⚠️ 마지막 검사가 '뒤집힌 채로 두지 않았는가' 를 봅니다. 계산은 뒤에서부터 하지만 결과는 앞에서 읽는 순서여야 하므로 한 번 되돌려야 하는데, 이 되돌리기를 빼먹으면 모양이 `(3,2,4)` 로 나옵니다 — **정상적인 튜플**이라서 눈으로는 알 수 없습니다.\n🔧 이 과정을 눈으로 익히면 `(n,1) + (n,)` 이 `(n,n)` 이 되는 이유도 자명해집니다: 뒤쪽에서 1 과 n 이 만나 n 으로 늘어나고, 그 앞에서 n 과 없는 축(1)이 만나 다시 n 이 됩니다. 손실 계산에서 이 조합이 나오면 오류 없이 n² 개의 차이를 평균해 버립니다." },

{ k:"C 순서 순회는 마지막 축이 가장 빠르다",
  q:"모양 <code>[2, 3]</code> 배열의 모든 칸을 <b>C 순서</b>로 방문하며 <code>snap(\"방문\", 평탄인덱스목록, {idx: [i, j]})</code> 를 기록하세요. <code>RESULT</code> 에는 방문한 <b>평탄 인덱스 목록</b>을 넣습니다. 되감아 보면 어느 축이 빨리 변하는지가 보입니다.",
  src:`function walk(shape) {
  const seen = [];
  // 여기에 구현하세요 — C 순서로 방문하며 칸마다 snap 을 부르세요
  return seen;
}

RESULT = walk([2, 3]);`,
  ref:`function walk(shape) {
  const seen = [];
  for (let i = 0; i < shape[0]; i++) {
    for (let j = 0; j < shape[1]; j++) {   // 마지막 축이 가장 안쪽
      const flat = i * shape[1] + j;
      seen.push(flat);
      snap("방문", [...seen], {idx: [i, j]});
    }
  }
  return seen;
}

RESULT = walk([2, 3]);`,
  tests:[
    {d:"평탄 인덱스가 0부터 순서대로 나온다", js:"JSON.stringify(RESULT)==='[0,1,2,3,4,5]'"},
    {d:"칸마다 장면이 하나씩 기록됐다", js:"FRAMES.filter(f=>f.opt && f.opt.idx).length===6"},
    {d:"방문 순서가 C 순서다", js:"FRAMES.filter(f=>f.opt&&f.opt.idx).map(f=>f.opt.idx.join(',')).join('|')==='0,0|0,1|0,2|1,0|1,1|1,2'"},
    {d:"마지막 축이 더 자주 바뀐다", js:"(()=>{const g=FRAMES.filter(f=>f.opt&&f.opt.idx).map(f=>f.opt.idx);let a=0,b=0;for(let k=1;k<g.length;k++){if(g[k][0]!==g[k-1][0])a++;if(g[k][1]!==g[k-1][1])b++;}return b>a;})()"},
    {d:"장면이 진행될수록 방문 목록이 길어진다", js:"FRAMES.filter(f=>f.opt&&f.opt.idx).every((f,i)=>f.value.length===i+1)"}],
  ex:"🎯 '마지막 축이 가장 빠르게 변한다' 는 문장을 읽는 것과, 프레임을 넘기며 `(0,0) → (0,1) → (0,2) → (1,0)` 을 보는 것은 다릅니다. 네 번째 검사가 그 사실을 **횟수로** 확인합니다 — 두 축의 변화 횟수를 세어 비교합니다.\n💡 이것이 성능에 직접 닿습니다. C 순서 배열에서 **행 방향 순회는 연속 메모리를 읽어** 캐시 라인 하나로 여러 값을 가져오지만, 열 방향은 매번 큰 폭으로 건너뛰어 캐시가 계속 실패합니다. 같은 합계 계산이 `arr.sum(axis=0)` 과 `axis=1` 에서 몇 배 차이 나는 이유입니다.\n⚠️ 그리고 이 순서가 `reshape` 의 의미를 정합니다. `(2,3)` 을 `(3,2)` 로 reshape 하면 데이터는 그대로 두고 **읽는 방식만** 바뀌므로, `[[0,1,2],[3,4,5]]` 가 `[[0,1],[2,3],[4,5]]` 이 됩니다 — 전치가 아닙니다. 이 둘을 혼동하는 것이 이미지 데이터를 다룰 때 가장 흔한 사고입니다.\n🔧 Fortran 순서(`order='F'`)는 첫 축이 가장 빠르게 변합니다. NumPy 는 두 순서를 모두 지원하고, MATLAB·R 에서 온 데이터나 BLAS 를 직접 호출할 때 마주치게 됩니다 — 순서를 잘못 가정하면 배열이 전치된 것처럼 보입니다." },

/* ══ pandas ══ */
{ k:"groupby 는 세 단계다",
  q:"<code>groupbyMean(rows, by, col)</code> 을 구현하며 <b>split → apply → combine</b> 세 단계를 각각 기록하세요 — <code>snap(\"나누기\", 그룹별값목록)</code>, 그룹마다 <code>snap(\"적용 \" + key, [key, 평균])</code>, 마지막에 <code>snap(\"합치기\", 결과)</code>. <code>RESULT</code> 는 <code>[키, 평균]</code> 쌍을 <b>키 순으로</b> 담은 배열입니다.",
  src:`function groupbyMean(rows, by, col) {
  // 여기에 구현하세요 — 나누고, 그룹마다 적용하고, 합치세요
  return [];
}

RESULT = groupbyMean(
  [{g: "a", v: 1}, {g: "b", v: 10}, {g: "a", v: 3}, {g: "b", v: 20}, {g: "a", v: 5}],
  "g", "v");`,
  ref:`function groupbyMean(rows, by, col) {
  const buckets = {};
  rows.forEach(r => { (buckets[r[by]] = buckets[r[by]] || []).push(r[col]); });
  const keys = Object.keys(buckets).sort();
  snap("나누기", keys.map(k => [k, buckets[k]]));
  const out = [];
  keys.forEach(k => {
    const vs = buckets[k];
    const mean = vs.reduce((s, v) => s + v, 0) / vs.length;
    out.push([k, mean]);
    snap("적용 " + k, [k, mean], {n: vs.length});
  });
  snap("합치기", out);
  return out;
}

RESULT = groupbyMean(
  [{g: "a", v: 1}, {g: "b", v: 10}, {g: "a", v: 3}, {g: "b", v: 20}, {g: "a", v: 5}],
  "g", "v");`,
  tests:[
    {d:"평균이 맞다", js:"JSON.stringify(RESULT)==='[[\"a\",3],[\"b\",15]]'"},
    {d:"세 단계가 모두 기록됐다", js:"['나누기','적용','합치기'].every(w=>FRAMES.some(f=>f.label.indexOf(w)===0))"},
    {d:"나누기 장면에 그룹이 2개 있다", js:"FRAMES.find(f=>f.label==='나누기').value.length===2"},
    {d:"적용 장면이 그룹 수만큼 있다", js:"FRAMES.filter(f=>/^적용/.test(f.label)).length===2"},
    {d:"적용 장면마다 그룹 크기를 남긴다", js:"FRAMES.filter(f=>/^적용/.test(f.label)).every(f=>f.opt && typeof f.opt.n==='number')"},
    {d:"합치기 장면이 최종 결과와 같다", js:"JSON.stringify(FRAMES.find(f=>f.label==='합치기').value)===JSON.stringify(RESULT)"}],
  ex:"🎯 pandas 의 `groupby` 가 마법처럼 보이는 이유는 세 단계가 한 줄에 숨어 있기 때문입니다. **split(키로 나누기) → apply(각 그룹에 함수 적용) → combine(결과 합치기)** 를 직접 만들어 프레임으로 보면, 그 뒤의 모든 동작이 예측 가능해집니다.\n💡 예를 들어 '왜 `groupby().apply()` 가 느린가' 의 답이 여기 있습니다 — apply 단계가 그룹마다 파이썬 함수를 호출하므로 그룹이 10만 개면 10만 번 호출입니다. `agg('mean')` 은 같은 자리에서 벡터화된 C 구현을 쓰므로 수십 배 빠릅니다. 프레임 수가 그룹 수와 같다는 것(네 번째 검사)이 그 비용 구조를 그대로 보여 줍니다.\n⚠️ 키 순서를 정렬한 것도 의도적입니다. pandas 도 기본이 `sort=True` 인데, `sort=False` 로 두면 등장 순서가 되어 **입력 순서에 따라 결과 표의 행 순서가 달라집니다**. 리포트를 비교하거나 스냅샷 테스트를 쓸 때 이 차이가 매번 diff 를 만듭니다.\n🔧 그룹 크기를 함께 기록하게 한 이유(다섯 번째 검사)는 실무 습관입니다 — 평균만 보고하면 '샘플 3개의 평균 98점' 과 '샘플 1만 개의 평균 98점' 이 구별되지 않습니다. 집계 결과에는 거의 항상 `count` 를 함께 붙여야 합니다." },

{ k:"조인에서 행이 불어나는 순간",
  q:"<code>joinSteps(left, right, key)</code> 로 내부 조인을 하며, <b>왼쪽 행마다</b> <code>snap(\"행 \" + i, 지금까지의출력행수, {matches: 짝의수})</code> 를 기록하세요. <code>RESULT</code> 는 최종 출력 행 수입니다. 되감아 보면 어느 행에서 결과가 불어났는지 보입니다.",
  src:`function joinSteps(left, right, key) {
  let out = 0;
  // 여기에 구현하세요 — 왼쪽 행마다 짝의 수를 세고 snap 을 부르세요
  return out;
}

RESULT = joinSteps(
  [{id: 1}, {id: 2}, {id: 3}],
  [{id: 1, v: "a"}, {id: 1, v: "b"}, {id: 3, v: "c"}],
  "id");`,
  ref:`function joinSteps(left, right, key) {
  let out = 0;
  left.forEach((l, i) => {
    const m = right.filter(r => r[key] === l[key]).length;
    out += m;
    snap("행 " + i, out, {matches: m, id: l[key]});
  });
  return out;
}

RESULT = joinSteps(
  [{id: 1}, {id: 2}, {id: 3}],
  [{id: 1, v: "a"}, {id: 1, v: "b"}, {id: 3, v: "c"}],
  "id");`,
  tests:[
    {d:"최종 행 수가 3이다 (왼쪽 3행이었는데도)", js:"RESULT===3"},
    {d:"왼쪽 행마다 장면이 하나씩 있다", js:"FRAMES.filter(f=>/^행/.test(f.label)).length===3"},
    {d:"짝의 수를 함께 남긴다", js:"FRAMES.filter(f=>/^행/.test(f.label)).every(f=>f.opt && typeof f.opt.matches==='number')"},
    {d:"짝이 2개인 행이 있다 (행 폭발 지점)", js:"FRAMES.some(f=>f.opt && f.opt.matches===2)"},
    {d:"짝이 0개인 행이 있다 (내부 조인에서 사라지는 행)", js:"FRAMES.some(f=>f.opt && f.opt.matches===0)"},
    {d:"누적 행 수는 줄어들지 않는다", js:"(()=>{const g=FRAMES.filter(f=>/^행/.test(f.label)).map(f=>f.value);return g.every((v,i)=>i===0||v>=g[i-1]);})()"}],
  ex:"🎯 '왼쪽 3행을 조인했는데 결과도 3행' 이라는 숫자만 보면 아무 문제가 없어 보입니다. 그런데 프레임을 열어 보면 **첫 행이 2행으로 불어나고 둘째 행이 사라져** 우연히 3이 된 것입니다 — 조인의 위험이 정확히 이 지점에 있습니다.\n⚠️ 그래서 '**조인 뒤에 SUM**' 은 항상 의심 신호입니다. 주문에 배송 이력을 조인하고 금액을 합하면, 배송이 두 번 있던 주문의 금액이 두 번 더해집니다. 반대로 짝 없는 행이 사라지면 '결제하지 않은 사용자' 가 통째로 빠져 평균이 부풀려집니다. 두 오차가 상쇄되어 총합이 그럴듯해 보이는 것이 최악의 경우입니다.\n💡 방어는 두 가지입니다. 조인 전후 행 수를 단정하거나, pandas 의 `validate='many_to_one'`·`'one_to_one'` 으로 **관계를 선언**해 어기면 예외가 나게 하는 것입니다. 선언이 깨졌다는 것은 코드가 틀렸다는 신호가 아니라 대개 **데이터에 대한 이해가 틀렸다**는 신호입니다.\n🔧 그리고 매칭률을 로그에 남기는 습관이 상류 변화를 잡아 줍니다 — '매칭 98.2%' 가 어느 날 60% 가 되면 키 형식이 바뀌었거나(문자열 vs 정수, 공백, 대소문자) 상류 테이블이 잘린 것입니다. `indicator=True` 로 어느 쪽에서 왔는지 표시해 두면 원인을 바로 좁힐 수 있습니다." },

/* ══ dl ══ */
{ k:"경사 하강이 내려가는 궤적",
  q:"손실 <code>f(w) = (w − 3)²</code> 를 경사 하강으로 최소화하세요. 기울기는 <code>2(w − 3)</code> 이고 갱신은 <code>w − lr·기울기</code> 입니다. <b>매 걸음마다</b> <code>snap(\"step \" + k, w, {loss: 손실})</code> 을 기록하고, <code>RESULT</code> 에 최종 <code>w</code> 를 넣으세요(<code>w₀ = 0</code>, <code>lr = 0.1</code>, 30걸음).",
  src:`function descend(w0, lr, steps) {
  let w = w0;
  snap("start", w, {loss: (w - 3) * (w - 3)});
  // 여기에 구현하세요 — 걸음마다 w 를 갱신하고 snap 을 부르세요
  return w;
}

RESULT = descend(0, 0.1, 30);`,
  ref:`function descend(w0, lr, steps) {
  let w = w0;
  snap("start", w, {loss: (w - 3) * (w - 3)});
  for (let k = 1; k <= steps; k++) {
    const grad = 2 * (w - 3);
    w = w - lr * grad;
    snap("step " + k, w, {loss: (w - 3) * (w - 3)});
  }
  return w;
}

RESULT = descend(0, 0.1, 30);`,
  tests:[
    {d:"최소점 3 에 충분히 가까워졌다", js:"Math.abs(RESULT-3)<0.01"},
    {d:"걸음마다 장면이 하나씩 있다", js:"FRAMES.length===31"},
    {d:"모든 장면이 손실을 함께 남긴다", js:"FRAMES.every(f=>f.opt && typeof f.opt.loss==='number')"},
    {d:"손실이 한 번도 늘지 않는다", js:"FRAMES.every((f,i)=>i===0||f.opt.loss<=FRAMES[i-1].opt.loss)"},
    {d:"w 가 최소점을 넘어 진동하지 않는다", js:"FRAMES.every(f=>f.value<=3.000001)"},
    {d:"첫 걸음이 가장 크다 (기울기가 가장 클 때)", js:"(()=>{const v=FRAMES.map(f=>f.value);return (v[1]-v[0])>(v[2]-v[1]);})()"}],
  ex:"🎯 경사 하강을 수식으로 보면 '기울기의 반대로 간다' 가 전부지만, 궤적을 되감아 보면 **걸음 크기가 저절로 줄어든다**는 것이 보입니다. 최소점에 가까워질수록 기울기가 작아지므로 학습률을 그대로 둬도 걸음이 짧아집니다 — 마지막 검사가 그것을 확인합니다.\n💡 이 성질이 '왜 학습 후반에 손실이 천천히 줄어드는가' 를 설명합니다. 모델이 나빠서가 아니라 **기울기 자체가 작아졌기** 때문이고, 그래서 학습률 스케줄로 후반에 걸음을 더 줄이는 것이 오히려 도움이 됩니다(잡음에 흔들리지 않게).\n⚠️ 다섯 번째 검사가 중요합니다 — `lr = 0.1` 에서는 최소점을 넘지 않지만, `lr` 을 0.5 보다 크게 하면 넘어가서 반대편으로 튑니다. 이 함수에서는 `lr < 1` 이면 수렴하고 `lr > 1` 이면 발산하는데, 갱신식이 `w ← w(1−2lr) + 6lr` 이라 배율 `|1−2lr|` 이 1 을 넘으면 매 걸음 멀어집니다.\n🔧 실전에서 손실 곡선을 볼 때 이 세 가지를 구별해야 합니다: **매끄럽게 감소**(정상) · **진동하며 감소**(학습률이 조금 큼, 대개 괜찮음) · **발산 또는 nan**(학습률이 너무 큼 또는 기울기 부호 오류). 네 번째 검사처럼 '손실이 늘지 않는다' 를 단정하는 것은 이 장난감 함수에서만 가능하고, 실제 학습에서는 미니배치 잡음 때문에 오르내립니다." },

{ k:"학습률에 따라 수렴하거나 발산한다",
  q:"같은 손실 <code>f(w) = (w − 3)²</code> 를 여러 학습률로 20걸음씩 돌려 비교하세요. 각 학습률마다 걸음마다 <code>snap(\"lr=\" + lr + \" step \" + k, w, {lr: lr, loss: 손실})</code> 을 기록하고, <code>RESULT</code> 에는 학습률별 판정(<code>\"수렴\"</code> 또는 <code>\"발산\"</code>)을 배열로 넣으세요 — <b>마지막 손실이 첫 손실보다 크면 발산</b>입니다. 학습률은 <code>[0.1, 0.5, 1.1]</code> 입니다.",
  src:`function compare(lrs, steps) {
  const verdict = [];
  // 여기에 구현하세요 — 학습률마다 돌려 보고 판정하세요
  return verdict;
}

RESULT = compare([0.1, 0.5, 1.1], 20);`,
  ref:`function compare(lrs, steps) {
  const verdict = [];
  lrs.forEach(lr => {
    let w = 0;
    const first = (w - 3) * (w - 3);
    for (let k = 1; k <= steps; k++) {
      w = w - lr * 2 * (w - 3);
      snap("lr=" + lr + " step " + k, w, {lr: lr, loss: (w - 3) * (w - 3)});
    }
    const last = (w - 3) * (w - 3);
    verdict.push(last > first ? "발산" : "수렴");
  });
  return verdict;
}

RESULT = compare([0.1, 0.5, 1.1], 20);`,
  tests:[
    {d:"판정이 [수렴, 수렴, 발산] 이다", js:"JSON.stringify(RESULT)==='[\"수렴\",\"수렴\",\"발산\"]'"},
    {d:"학습률 3개 × 20걸음이 모두 기록됐다", js:"FRAMES.length===60"},
    {d:"모든 장면이 학습률과 손실을 남긴다", js:"FRAMES.every(f=>f.opt && typeof f.opt.lr==='number' && typeof f.opt.loss==='number')"},
    {d:"lr=0.5 는 한 걸음에 최소점에 도달한다", js:"Math.abs(FRAMES.filter(f=>f.opt.lr===0.5)[0].value-3)<1e-9"},
    {d:"lr=1.1 의 손실은 계속 커진다", js:"(()=>{const g=FRAMES.filter(f=>f.opt.lr===1.1).map(f=>f.opt.loss);return g.every((v,i)=>i===0||v>g[i-1]);})()"},
    {d:"lr=1.1 은 최소점 양쪽을 번갈아 넘는다", js:"(()=>{const g=FRAMES.filter(f=>f.opt.lr===1.1).map(f=>f.value-3);return g.slice(1).every((v,i)=>v*g[i]<0);})()"}],
  ex:"🎯 '학습률이 너무 크면 발산한다' 는 말은 흔하지만, **왜 진동하며 커지는지**는 궤적을 봐야 이해됩니다. 갱신식을 정리하면 `w − 3 ← (1 − 2lr)(w − 3)` 이므로, 매 걸음 최소점과의 거리에 `(1 − 2lr)` 이 곱해집니다.\n💡 그래서 세 가지 구간이 나옵니다: `lr < 0.5` 면 배율이 양수이고 1 보다 작아 **같은 쪽에서 다가가고**, `lr = 0.5` 면 배율이 0 이라 **한 걸음에 정확히 도달**하며(네 번째 검사), `0.5 < lr < 1` 이면 배율이 음수라 **양쪽을 번갈아 넘으면서 좁혀지고**, `lr > 1` 이면 배율의 절댓값이 1 을 넘어 **번갈아 넘으면서 벌어집니다**(마지막 검사).\n⚠️ 마지막 검사가 발산의 실제 모양을 잡아냅니다 — 손실이 단순히 커지는 것이 아니라 **부호가 매 걸음 뒤집힙니다**. 실전에서 손실 곡선이 톱니처럼 튀며 커지면 거의 항상 학습률 문제이고, 기울기 부호 오류라면 진동 없이 한 방향으로 커집니다. **모양으로 원인을 구별할 수 있습니다.**\n🔧 그래서 실무 절차는 '학습률을 로그 스케일로 훑어 손실이 가장 빨리 떨어지는 구간을 찾고, 그보다 조금 작게 잡는 것'(LR finder)입니다. 그리고 실제 신경망에서는 이 최적 학습률이 층마다 다르므로, Adam 처럼 **파라미터별로 걸음 크기를 적응시키는** 옵티마이저가 쓰입니다." },

/* ══ ai ══ */
{ k:"차원이 커지면 어텐션이 뾰족해진다",
  q:"질의와 두 키의 내적을 <b>√d 로 나눈 경우와 나누지 않은 경우</b>의 최대 어텐션 가중치를 차원 <code>d = 1..8</code> 에 대해 비교하세요. <code>q</code> 는 1이 d개, 키는 <code>[1,1,…]</code> 과 <code>[0,0,…]</code> 입니다. 각 <code>d</code> 마다 <code>snap(\"d=\" + d, [스케일적용, 스케일없음], {d: d})</code> 를 기록하고, <code>RESULT</code> 에는 <b>스케일 없이 계산한 최대 가중치가 0.99 를 처음 넘는 d</b> 를 넣으세요.",
  src:`function sharpen(maxD) {
  let first = -1;
  // 여기에 구현하세요 — d 마다 두 방식의 최대 가중치를 재고 snap 을 부르세요
  return first;
}

RESULT = sharpen(8);`,
  ref:`function sharpen(maxD) {
  let first = -1;
  for (let d = 1; d <= maxD; d++) {
    const dot = d;                        // [1..1] · [1..1] = d, [1..1] · [0..0] = 0
    const scaled = 1 / (1 + Math.exp(-dot / Math.sqrt(d)));
    const plain = 1 / (1 + Math.exp(-dot));
    snap("d=" + d, [scaled, plain], {d: d});
    if (first === -1 && plain > 0.99) first = d;
  }
  return first;
}

RESULT = sharpen(8);`,
  tests:[
    {d:"스케일 없이 0.99 를 처음 넘는 차원은 5 다", js:"RESULT===5"},
    {d:"d 마다 장면이 하나씩 있다", js:"FRAMES.length===8"},
    {d:"장면마다 두 값을 함께 남긴다", js:"FRAMES.every(f=>Array.isArray(f.value) && f.value.length===2)"},
    {d:"스케일을 적용한 쪽이 항상 덜 뾰족하다", js:"FRAMES.every(f=>f.value[0]<=f.value[1])"},
    {d:"스케일 없는 쪽은 차원이 커질수록 1 에 붙는다", js:"(()=>{const g=FRAMES.map(f=>f.value[1]);return g.every((v,i)=>i===0||v>g[i-1]) && g[7]>0.999;})()"},
    {d:"스케일을 적용하면 8차원에서도 0.95 를 넘지 않는다", js:"FRAMES[7].value[0]<0.95"}],
  ex:"🎯 `√d` 로 나누는 이유를 '분산이 d 에 비례하므로' 라고 외우는 것보다, **차원을 키우며 가중치가 1 에 붙는 것을 보는 것**이 빠릅니다. 스케일이 없으면 8차원에서 이미 0.9997 이라 사실상 키 하나만 봅니다.\n⚠️ 문제는 정확도가 아니라 **기울기**입니다. softmax 가 거의 원-핫이 되면 미분값이 0 에 가까워져 그 층에서 학습이 멈춥니다. 실제 트랜스포머의 헤드 차원은 64 이므로, 스케일이 없으면 내적이 수십에 이르고 기울기가 완전히 사라집니다 — **손실 곡선이 평평한데 성능이 안 나오는** 증상으로 나타납니다.\n💡 여섯 번째 검사가 스케일의 효과를 정량으로 보여 줍니다: 8차원에서 스케일 없는 쪽은 0.999 를 넘지만 스케일을 적용하면 0.95 미만입니다. `√d` 로 나누면 내적이 `√d` 크기로 유지되어 차원이 커져도 분포가 급격히 뾰족해지지 않습니다.\n🔧 실전에서는 스케일 외에 두 가지가 더 붙습니다. **마스킹**은 미래 토큰이나 패딩 위치의 로짓을 `-Infinity` 로 두는데, 큰 음수(`-1e9`)로 대체하면 완전히 0 이 되지 않아 미세한 정보 누수가 남습니다. 그리고 **가중치 초기화와 정규화**로 애초에 로짓 크기를 관리합니다 — 스케일만으로는 값이 아주 클 때(마지막 검사보다 극단적인 경우) 여전히 원-핫이 됩니다." },

{ k:"BPE 어휘가 만들어지는 과정",
  q:"BPE 학습을 <code>rounds</code> 회 반복하세요. 매 라운드마다 <b>가장 빈번한 인접 쌍</b>(빈도가 같으면 <b>먼저 등장한 쌍</b>)을 찾아 겹치지 않게 전부 병합하고, <code>snap(\"round \" + r, 토큰목록, {pair: [a, b], count: 빈도})</code> 를 기록하세요. <code>RESULT</code> 는 최종 토큰 목록입니다.",
  src:`function bpeTrain(tokens, rounds) {
  let cur = [...tokens];
  snap("start", [...cur]);
  // 여기에 구현하세요 — 라운드마다 최빈 쌍을 찾아 병합하세요
  return cur;
}

RESULT = bpeTrain(["l", "o", "w", "l", "o", "w", "e", "r"], 2);`,
  ref:`function bpeTrain(tokens, rounds) {
  let cur = [...tokens];
  snap("start", [...cur]);
  for (let r = 1; r <= rounds; r++) {
    const order = [], count = {};
    for (let i = 0; i + 1 < cur.length; i++) {
      const key = cur[i] + "\\u0000" + cur[i + 1];
      if (!(key in count)) { count[key] = 0; order.push(key); }
      count[key]++;
    }
    if (!order.length) break;
    let best = order[0];
    order.forEach(k => { if (count[k] > count[best]) best = k; });   // 동점이면 먼저 등장한 쌍
    const pair = best.split("\\u0000");
    const next = [];
    let i = 0;
    while (i < cur.length) {
      if (i + 1 < cur.length && cur[i] === pair[0] && cur[i + 1] === pair[1]) {
        next.push(cur[i] + cur[i + 1]);
        i += 2;                                                     // 겹치지 않게
      } else {
        next.push(cur[i]);
        i += 1;
      }
    }
    cur = next;
    snap("round " + r, [...cur], {pair: pair, count: count[best]});
  }
  return cur;
}

RESULT = bpeTrain(["l", "o", "w", "l", "o", "w", "e", "r"], 2);`,
  tests:[
    {d:"두 라운드 뒤 토큰이 low, low, e, r 이다", js:"JSON.stringify(RESULT)==='[\"low\",\"low\",\"e\",\"r\"]'"},
    {d:"라운드마다 장면이 하나씩 있다", js:"FRAMES.filter(f=>/^round/.test(f.label)).length===2"},
    {d:"라운드 장면마다 어떤 쌍을 합쳤는지 남긴다", js:"FRAMES.filter(f=>/^round/.test(f.label)).every(f=>f.opt && Array.isArray(f.opt.pair) && f.opt.pair.length===2)"},
    {d:"첫 라운드는 (l, o) 를 합친다", js:"FRAMES.find(f=>f.label==='round 1').opt.pair.join('')==='lo'"},
    {d:"라운드마다 토큰 수가 줄어든다", js:"(()=>{const g=FRAMES.map(f=>f.value.length);return g.every((v,i)=>i===0||v<g[i-1]);})()"},
    {d:"합친 쌍의 빈도를 남긴다", js:"FRAMES.filter(f=>/^round/.test(f.label)).every(f=>f.opt.count>=2)"}],
  ex:"🎯 토크나이저는 대부분 블랙박스로 쓰이지만, 학습 과정은 '**가장 자주 붙어 나오는 두 조각을 합치기**' 를 수천 번 반복하는 것뿐입니다. 두 라운드만 되감아 봐도 `l o w` 가 `lo w` 를 거쳐 `low` 가 되는 것이 보입니다.\n💡 이 과정을 이해하면 실무 현상이 설명됩니다. **왜 한글이 영어보다 토큰을 많이 먹는가** — 학습 코퍼스에 한글 쌍이 적어 병합이 덜 일어났고, 그만큼 API 비용과 컨텍스트 길이에 직결됩니다. **왜 숫자 계산을 틀리는가** — `1234` 가 `12`+`34` 처럼 빈도에 따라 임의로 쪼개져 자릿수 구조가 깨집니다. **왜 오타에 의외로 강한가** — 드문 조합은 더 작은 조각으로 분해되어 표현 자체는 가능합니다.\n⚠️ 겹치지 않게 병합하는 것(다섯 번째 검사가 간접 확인)이 구현의 핵심입니다. 인덱스를 하나만 전진시키면 방금 합친 토큰의 뒷조각을 다시 병합해 **원본보다 긴 결과**가 나옵니다.\n🔧 동점 처리 규칙을 명시한 것도 중요합니다 — 빈도가 같은 쌍이 여러 개일 때 어느 것을 고르는지가 정해져 있지 않으면 같은 코퍼스로 학습해도 **매번 다른 어휘**가 나옵니다. 토크나이저가 달라지면 모델 가중치가 그대로여도 쓸 수 없으므로, 재현성이 필수입니다. 실제 구현들은 빈도 → 사전순 같은 결정적 규칙을 씁니다." },

/* ══ mleval ══ */
{ k:"임계값을 내리면 혼동행렬이 어떻게 움직이나",
  q:"점수 내림차순의 각 값을 임계값으로 삼아(<b>그 값 이상</b>을 양성으로 예측) <code>snap(\"t=\" + t, [정밀도, 재현율], {tp: tp, fp: fp, fn: fn, f1: f1})</code> 를 기록하세요. <code>RESULT</code> 에는 <b>F1 이 가장 높은 임계값</b>을 넣습니다(동점이면 더 높은 임계값). 정답은 <code>[1,0,1,1,0]</code>, 점수는 <code>[0.9,0.8,0.7,0.4,0.3]</code> 입니다.",
  src:`function sweep(y, s) {
  let bestT = -1, bestF1 = -1;
  // 여기에 구현하세요 — 임계값마다 혼동행렬을 세고 snap 을 부르세요
  return bestT;
}

RESULT = sweep([1, 0, 1, 1, 0], [0.9, 0.8, 0.7, 0.4, 0.3]);`,
  ref:`function sweep(y, s) {
  let bestT = -1, bestF1 = -1;
  const ts = [...new Set(s)].sort((a, b) => b - a);
  ts.forEach(t => {
    let tp = 0, fp = 0, fn = 0;
    for (let i = 0; i < y.length; i++) {
      const pred = s[i] >= t ? 1 : 0;
      if (y[i] === 1 && pred === 1) tp++;
      else if (y[i] === 0 && pred === 1) fp++;
      else if (y[i] === 1 && pred === 0) fn++;
    }
    const p = tp + fp ? tp / (tp + fp) : 0;
    const r = tp + fn ? tp / (tp + fn) : 0;
    const f1 = p + r ? 2 * p * r / (p + r) : 0;
    snap("t=" + t, [p, r], {tp: tp, fp: fp, fn: fn, f1: f1});
    if (f1 > bestF1) { bestF1 = f1; bestT = t; }
  });
  return bestT;
}

RESULT = sweep([1, 0, 1, 1, 0], [0.9, 0.8, 0.7, 0.4, 0.3]);`,
  tests:[
    {d:"F1 이 가장 높은 임계값은 0.4 다", js:"Math.abs(RESULT-0.4)<1e-9"},
    {d:"임계값마다 장면이 하나씩 있다", js:"FRAMES.length===5"},
    {d:"장면마다 혼동행렬 값을 남긴다", js:"FRAMES.every(f=>f.opt && 'tp' in f.opt && 'fp' in f.opt && 'fn' in f.opt)"},
    {d:"임계값을 내릴수록 재현율은 줄지 않는다", js:"(()=>{const g=FRAMES.map(f=>f.value[1]);return g.every((v,i)=>i===0||v>=g[i-1]);})()"},
    {d:"임계값을 내릴수록 FP 는 줄지 않는다", js:"(()=>{const g=FRAMES.map(f=>f.opt.fp);return g.every((v,i)=>i===0||v>=g[i-1]);})()"},
    {d:"정밀도는 단조롭지 않다 (오르내린다)", js:"(()=>{const g=FRAMES.map(f=>f.value[0]);return !g.every((v,i)=>i===0||v<=g[i-1]);})()"}],
  ex:"🎯 정밀도와 재현율의 트레이드오프를 문장으로 읽으면 '반대로 움직인다' 로 요약되지만, 프레임을 넘겨 보면 **재현율만 단조롭고 정밀도는 오르내린다**는 것이 드러납니다. 마지막 두 검사가 정확히 그 비대칭을 확인합니다.\n💡 이유는 분모가 다르기 때문입니다. 임계값을 내리면 양성 예측이 늘어 TP 와 FP 가 **둘 다 줄지 않으므로** 재현율(`TP/(TP+FN)`)은 단조 증가합니다. 그런데 정밀도(`TP/(TP+FP)`)는 새로 들어온 예측이 TP 인지 FP 인지에 따라 오르기도 내리기도 합니다 — 이 데이터에서는 0.7 → 0.4 구간에서 TP 가 들어와 정밀도가 오릅니다.\n⚠️ 그래서 '목표 정밀도를 만족하는 임계값' 을 **이분 탐색으로 찾으면 틀립니다**. 정밀도가 단조롭지 않으므로 후보를 다 훑어야 하고, 이것을 모르고 이분 탐색을 쓴 코드가 실제로 흔합니다.\n🔧 그리고 이 임계값은 **평가셋이 아니라 별도의 검증셋에서** 골라야 합니다. 평가셋으로 임계값을 고르면 그 점수는 더 이상 미래 성능의 추정치가 아닙니다. 실무에서는 F1 최대화보다 '정밀도 95% 는 지킨다' 같은 제품 제약을 먼저 두고 그 안에서 재현율을 최대로 가져가며, 데이터 분포가 움직이므로 주기적으로 재조정합니다." },

{ k:"보정 곡선과 ECE",
  q:"확률 예측의 보정을 확인하세요. [0,1]을 <code>bins</code> 개 등간격 칸으로 나눠 각 확률을 <code>min(floor(p·bins), bins−1)</code> 칸에 넣고, <b>값이 있는 칸마다</b> <code>snap(\"bin \" + i, [평균확률, 실제양성비율], {n: 개수, gap: 차이})</code> 를 기록하세요. <code>RESULT</code> 는 <b>개수로 가중 평균한 ECE</b> 입니다. 입력은 <code>probs=[0.1,0.1,0.9,0.9]</code>, <code>labels=[0,0,1,0]</code>, <code>bins=2</code> 입니다.",
  src:`function calibration(probs, labels, bins) {
  let ece = 0;
  // 여기에 구현하세요 — 칸마다 평균 확률과 실제 비율을 재고 snap 을 부르세요
  return ece;
}

RESULT = calibration([0.1, 0.1, 0.9, 0.9], [0, 0, 1, 0], 2);`,
  ref:`function calibration(probs, labels, bins) {
  const buckets = [];
  for (let i = 0; i < bins; i++) buckets.push([]);
  probs.forEach((p, i) => {
    const b = Math.min(Math.floor(p * bins), bins - 1);   // p === 1 은 마지막 칸
    buckets[b].push([p, labels[i]]);
  });
  let ece = 0;
  buckets.forEach((b, i) => {
    if (!b.length) return;
    const conf = b.reduce((s, x) => s + x[0], 0) / b.length;
    const acc = b.reduce((s, x) => s + x[1], 0) / b.length;
    const gap = Math.abs(conf - acc);
    ece += (b.length / probs.length) * gap;
    snap("bin " + i, [conf, acc], {n: b.length, gap: gap});
  });
  return ece;
}

RESULT = calibration([0.1, 0.1, 0.9, 0.9], [0, 0, 1, 0], 2);`,
  tests:[
    {d:"ECE 가 0.25 다", js:"Math.abs(RESULT-0.25)<1e-9"},
    {d:"값이 있는 칸만 장면으로 남는다", js:"FRAMES.length===2"},
    {d:"장면마다 개수와 차이를 남긴다", js:"FRAMES.every(f=>f.opt && typeof f.opt.n==='number' && typeof f.opt.gap==='number')"},
    {d:"칸의 개수를 모두 더하면 전체 표본 수다", js:"FRAMES.reduce((s,f)=>s+f.opt.n,0)===4"},
    {d:"낮은 확률 칸은 잘 맞고 높은 확률 칸이 과신이다", js:"FRAMES[0].opt.gap<FRAMES[1].opt.gap"},
    {d:"높은 확률 칸의 평균 확률이 실제 비율보다 높다", js:"FRAMES[1].value[0]>FRAMES[1].value[1]"}],
  ex:"🎯 정확도와 **보정**은 다른 문제입니다. '90% 확신' 이라고 말한 예측 중 실제로 90%가 맞아야 그 확률로 기대값을 계산할 수 있는데, 이 예시에서는 0.9 라고 말한 두 건 중 하나만 맞아 실제 비율이 0.5 입니다 — 마지막 검사가 그 과신을 직접 확인합니다.\n💡 가중 평균이 핵심입니다. 칸마다 든 개수가 다를 때 단순 평균을 쓰면 **1건뿐인 칸의 오차가 전체 결론을 좌우**해 지표가 잡음을 재게 됩니다. 네 번째 검사가 개수의 합을 확인하는 이유이고, pandas·sklearn 의 보정 계산도 같은 가중을 씁니다.\n⚠️ `Math.floor(p * bins)` 는 `p === 1` 에서 인덱스가 범위를 벗어나므로 `min(..., bins-1)` 로 눌러야 합니다. 이걸 `% bins` 로 감싸면 더 나쁩니다 — 가장 확신하는 예측이 **가장 확신하지 않는 칸**으로 들어가 보정 오차를 정반대로 계산합니다.\n🔧 확률이 중요한 곳은 분류가 아니라 **의사결정**입니다: 기대 손실 계산, 임계값 정책, 여러 모델의 확률 결합, 사람에게 넘길지 판단. 현대 신경망은 대체로 과신하므로, 사후 보정(Platt scaling 또는 isotonic regression)을 **검증셋에서** 학습해 붙입니다 — 학습셋에서 하면 이미 과적합된 확률을 배웁니다." },

/* ══ php ══ */
{ k:"요청마다 새로 태어난다 (shared-nothing)",
  q:"PHP 의 요청 수명을 시뮬레이션하세요. 요청을 처리할 때마다 <b>지역 카운터는 0 에서 새로 시작</b>하고 <b>세션 저장소는 요청 사이에 남습니다</b>. 요청마다 <code>snap(\"요청 \" + n, {local: 지역값, session: 세션값})</code> 을 기록하고, <code>RESULT</code> 에 <code>[마지막 지역값, 마지막 세션값]</code> 을 넣으세요. 요청은 3개입니다.",
  src:`function serve(paths) {
  const session = {hits: 0};   // 요청 사이에 남는 바깥 저장소
  let last = null;
  // 여기에 구현하세요 — 요청마다 지역 변수는 새로 만들고 세션은 이어 가세요
  return last;
}

RESULT = serve(["/a", "/b", "/c"]);`,
  ref:`function serve(paths) {
  const session = {hits: 0};
  let last = null;
  paths.forEach((p, i) => {
    let local = 0;              // 요청마다 새로 태어난다
    local += 1;
    session.hits += 1;          // 바깥 저장소만 이어진다
    snap("요청 " + (i + 1), {local: local, session: session.hits}, {path: p});
    last = [local, session.hits];
  });
  return last;
}

RESULT = serve(["/a", "/b", "/c"]);`,
  tests:[
    {d:"마지막 상태가 [1, 3] 이다", js:"JSON.stringify(RESULT)==='[1,3]'"},
    {d:"요청마다 장면이 하나씩 있다", js:"FRAMES.length===3"},
    {d:"지역 값은 매 요청 1 이다 (누적되지 않는다)", js:"FRAMES.every(f=>f.value.local===1)"},
    {d:"세션 값은 1, 2, 3 으로 누적된다", js:"JSON.stringify(FRAMES.map(f=>f.value.session))==='[1,2,3]'"},
    {d:"어느 요청의 경로인지 남긴다", js:"FRAMES.every(f=>f.opt && typeof f.opt.path==='string')"},
    {d:"세션은 늘어나기만 하고 지역은 늘지 않는다", js:"(()=>{const s=FRAMES.map(f=>f.value.session),l=FRAMES.map(f=>f.value.local);return s[2]>s[0] && l[2]===l[0];})()"}],
  ex:"🎯 PHP 를 이해하는 데 필요한 사실 하나만 고르라면 이것입니다 — **요청마다 프로그램이 새로 시작하고 끝난다**(shared-nothing). 프레임을 넘기며 지역 값이 계속 1 이고 세션만 늘어나는 것을 보면, PHP 의 장점과 한계가 전부 여기서 나온다는 것이 보입니다.\n💡 장점: 메모리 누수가 서비스를 죽이지 않고(요청이 끝나면 전부 회수), 한 요청이 크래시해도 다른 요청에 영향이 없고, 배포가 '파일 교체' 로 끝납니다. 한계: 요청 사이에 무엇을 남기려면 **세션·Redis·DB 같은 바깥 저장소**가 반드시 필요하고, '앱 시작 시 한 번만' 같은 초기화가 매 요청 반복됩니다 — 그 비용을 줄이는 것이 OPcache 입니다.\n⚠️ 그래서 Node.js·Java 처럼 '앱이 계속 살아 있는' 언어의 습관이 통하지 않습니다. 모듈 수준 캐시, 전역 싱글턴, 워밍업된 연결 풀이 전부 매 요청 초기화됩니다. 반대로 Swoole·RoadRunner 처럼 프로세스를 살려 두는 런타임으로 옮기면 **이 안전망이 사라져** 전역 상태가 다음 요청으로 새고 사용자 간 데이터가 섞입니다.\n🔧 실무 판단으로 이어집니다: 세션 저장소를 파일에 두면 서버가 여러 대일 때 요청마다 다른 서버에 붙어 로그인이 풀리므로 Redis 같은 공용 저장소로 옮겨야 합니다. 그리고 요청 안에서 '지역' 인 것과 '바깥' 인 것을 구별하는 습관이 곧 PHP 코드를 읽는 능력입니다." },

{ k:"워커 풀이 요청을 처리하는 방식",
  q:"PHP-FPM 의 워커 풀을 시뮬레이션하세요. 각 요청은 정해진 <b>tick 수</b>만큼 걸리고, 워커가 <code>workers</code> 개뿐이라 남는 요청은 <b>큐에서 기다립니다</b>(FCFS). tick 마다 <code>snap(\"t=\" + t, {running: 실행중요청수, queued: 대기수}, {done: 이번에끝난요청})</code> 을 기록하고, <code>RESULT</code> 에 <b>요청별 완료 시각</b> 배열을 넣으세요. 요청 소요는 <code>[3, 1, 1]</code>, 워커는 2개입니다.",
  src:`function fpm(durations, workers) {
  const done = durations.map(() => -1);
  // 여기에 구현하세요 — tick 마다 워커를 배정하고 진행시키세요
  return done;
}

RESULT = fpm([3, 1, 1], 2);`,
  ref:`function fpm(durations, workers) {
  const done = durations.map(() => -1);
  const left = durations.map(d => d);
  let next = 0;
  const active = [];
  for (let t = 1; t <= 100; t++) {
    while (active.length < workers && next < durations.length) {
      active.push(next);
      next++;
    }
    if (!active.length) break;
    const finished = [];
    for (let k = active.length - 1; k >= 0; k--) {
      const id = active[k];
      left[id] -= 1;
      if (left[id] === 0) {
        done[id] = t;
        finished.push(id);
        active.splice(k, 1);
      }
    }
    const queued = durations.length - next;
    snap("t=" + t, {running: active.length + finished.length, queued: queued},
         {done: finished.sort((a, b) => a - b)});
    if (done.every(d => d > 0)) break;
  }
  return done;
}

RESULT = fpm([3, 1, 1], 2);`,
  tests:[
    {d:"완료 시각이 [3, 1, 2] 다", js:"JSON.stringify(RESULT)==='[3,1,2]'"},
    {d:"tick 마다 장면이 하나씩 있다", js:"FRAMES.length===3"},
    {d:"동시 실행 수가 워커 수를 넘지 않는다", js:"FRAMES.every(f=>f.value.running<=2)"},
    {d:"처음에는 대기 요청이 있다", js:"FRAMES[0].value.queued>=1"},
    {d:"마지막에는 대기가 없다", js:"FRAMES[FRAMES.length-1].value.queued===0"},
    {d:"매 tick 어떤 요청이 끝났는지 남긴다", js:"FRAMES.every(f=>f.opt && Array.isArray(f.opt.done))"}],
  ex:"🎯 PHP 는 스레드가 아니라 **프로세스 풀**로 동시성을 냅니다. 프레임을 넘기며 보면 워커 2개가 꽉 차 있는 동안 세 번째 요청이 큐에서 기다리는 것이 드러납니다 — 동시 처리량의 상한이 곧 `pm.max_children` 입니다.\n⚠️ 여기서 나오는 가장 중요한 실무 사실: 워커가 **DB 나 외부 API 응답을 기다리는 동안에도 점유된 상태로 남습니다**. 외부 API 가 3초로 느려지면 워커가 순식간에 고갈되어 **그 API 를 쓰지 않는 페이지까지 함께 멈춥니다**. CPU 는 한가한데 502 가 뜨는 상황이 정확히 이것입니다(대기 요청이 `listen.backlog` 를 넘김).\n💡 방어는 세 가지입니다: 외부 호출에 **짧은 타임아웃**, 반복 실패 시 **서킷 브레이커**, 그리고 즉시 응답이 필요 없는 작업은 **큐로 미루기**. 워커 수를 늘리는 것은 마지막 수단인데, `pm.max_children × memory_limit` 이 서버 메모리를 넘으면 스와핑이나 OOM 으로 전체가 더 느려집니다.\n🔧 워커 수 산정의 1차 제약은 메모리(`가용 메모리 ÷ 요청당 평균 메모리`)이고, 2차 조정 축은 '워커가 CPU 를 쓰는 시간 대 대기하는 시간' 의 비율입니다 — I/O 대기가 길면 코어 수보다 많이 잡는 것이 맞습니다. 그리고 세 번째 검사처럼 '**동시 실행이 상한을 넘지 않는다**' 는 불변식은 큐·풀·레이트 리밋을 구현할 때마다 테스트로 박아 둘 값이 있습니다." },

];
