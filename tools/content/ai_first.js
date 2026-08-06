/* AI 1차 — 실습이 하나도 없던 유닛 중 앞 7개.

   순수 파이썬이다. 토큰 세기, 청킹, 코사인 유사도, 배칭 계산은
   전부 열 줄 안쪽이라, 라이브러리 없이도 "왜 그렇게 되는가" 를 만질 수 있다. */
module.exports = [
/* ── ML 파이프라인 ───────────────────────────────────────── */
{
  unit: "ML 파이프라인",
  lesson: "직접 짜 보기 — 순서가 결과를 정한다",
  th: {
    sum: "파이프라인은 **정해진 순서로 이어 붙인 처리 단계**다. 순서를 지키는 것 자체가 기능이다.",
    body: [
      { h: "왜 굳이 파이프라인으로 묶나", t: "전처리를 학습 때와 서빙 때 따로 적으면, 언젠가 둘이 어긋난다. 한 덩어리로 묶어 두면 같은 코드가 양쪽에서 돌아 그 어긋남이 생길 수 없다 — 이걸 학습·서빙 편향이라고 부른다." },
      { h: "fit 과 transform 은 다르다", t: "`fit` 은 학습 데이터를 보고 규칙(평균·어휘·범주 목록)을 정하고, `transform` 은 그 규칙을 적용하기만 한다. 검증·운영 데이터에는 `transform` 만 한다 — 이 구분이 누수를 막는 장치다." },
      { h: "단계마다 입출력 모양을 적어 둔다", t: "단계가 늘어나면 어디서 모양이 깨졌는지 찾기 어렵다. 각 단계가 무엇을 받아 무엇을 내는지 한 줄로 적어 두면, 붙이는 순간 어긋남이 보인다." },
      { h: "중간 결과를 캐시한다", t: "무거운 전처리를 매번 다시 하면 실험 한 번에 몇십 분이 든다. 입력이 같으면 결과도 같으니, 입력의 해시를 키로 저장해 두면 실험 속도가 완전히 달라진다." },
    ],
    code: { c: "규칙 = fit(학습)          # 학습만 보고 정한다\n학습 = transform(규칙, 학습)\n검증 = transform(규칙, 검증)   # 적용만\n\n# 순서를 데이터로 들고 다닌다\nfor 단계 in 파이프라인:\n    x = 단계(x)", cap: "fit 은 한 번, transform 은 어디서나" },
    key: ["학습과 서빙이 같은 코드를 쓴다", "`fit` 은 학습만, `transform` 은 모두에", "단계마다 입출력을 적어 둔다"],
  },
  q: [
    {
      k: "run_pipeline · 순서대로 흘려보내기",
      qq: "함수 목록을 <b>앞에서부터 차례로</b> 적용한 결과를 돌려주세요.",
      src: "def run_pipeline(steps, x):\n    for f in reversed(steps):\n        x = f(x)\n    return x\n",
      sol: "def run_pipeline(steps, x):\n    for f in steps:\n        x = f(x)\n    return x\n",
      tests: [["run_pipeline([lambda v: v + 1, lambda v: v * 10], 0)", "10"], ["run_pipeline([lambda v: v * 10, lambda v: v + 1], 0)", "1"], ["run_pipeline([], 5)", "5"]],
      edge: [["run_pipeline([lambda v: v + 1], 1)", "2"], ["run_pipeline([str, len], 100)", "3"]],
      ex: "덧셈 뒤 곱셈과 곱셈 뒤 덧셈은 결과가 다릅니다. 파이프라인에서 순서는 옵션이 아니라 정의예요 — 토큰화 뒤 소문자화와 소문자화 뒤 토큰화도 결과가 달라집니다.",
    },
    {
      k: "fit_transform · 규칙은 한 번만 정한다",
      qq: "학습 목록으로 <b>어휘 사전</b>(정렬된 고유값 → 번호)을 만들고, 그것으로 테스트 목록을 번호로 바꾸세요. 사전에 없으면 <code>-1</code> 입니다.",
      src: "def fit_transform(train, test):\n    vocab = {w: i for i, w in enumerate(sorted(set(train + test)))}\n    return [vocab.get(w, -1) for w in test]\n",
      sol: "def fit_transform(train, test):\n    vocab = {w: i for i, w in enumerate(sorted(set(train)))}\n    return [vocab.get(w, -1) for w in test]\n",
      tests: [["fit_transform(['b', 'a'], ['a', 'b'])", "[0, 1]"], ["fit_transform(['a'], ['z'])", "[-1]"], ["fit_transform(['a', 'b', 'c'], ['c'])", "[2]"]],
      edge: [["fit_transform([], ['a'])", "[-1]"], ["fit_transform(['b'], ['a', 'b'])", "[-1, 0]"]],
      ex: "테스트 값까지 넣어 사전을 만들면 번호가 통째로 밀립니다 — 학습 때 'a' 가 0 이었는데 운영에서는 1 이 되는 거예요. 게다가 운영에서는 미래 데이터를 미리 알 수 없으니 애초에 불가능한 코드입니다.",
    },
    {
      k: "cache_key · 같은 입력이면 다시 안 한다",
      qq: "입력 목록과 <b>설정 사전</b>으로 캐시 키 문자열을 만드세요. 설정의 키 순서가 달라도 <b>같은 키</b>가 나와야 합니다.",
      src: "def cache_key(items, cfg):\n    return str(items) + str(cfg)\n",
      sol: "def cache_key(items, cfg):\n    return str(items) + str(sorted(cfg.items()))\n",
      tests: [["cache_key([1], {'a': 1, 'b': 2}) == cache_key([1], {'b': 2, 'a': 1})", "True"], ["cache_key([1], {'a': 1}) == cache_key([2], {'a': 1})", "False"], ["cache_key([], {}) == cache_key([], {})", "True"]],
      edge: [["cache_key([1], {'a': 1}) == cache_key([1], {'a': 2})", "False"]],
      ex: "파이썬 사전은 넣은 순서를 기억해서, 같은 설정이라도 만든 순서가 다르면 문자열이 달라집니다. 캐시가 안 맞아 매번 다시 계산하게 돼요 — 정렬 한 번으로 순서를 지웁니다.",
    },
  ],
},
/* ── 모델 서빙 ───────────────────────────────────────────── */
{
  unit: "모델 서빙",
  lesson: "직접 짜 보기 — 지연과 처리량 사이에서",
  th: {
    sum: "서빙은 **한 요청을 얼마나 빨리(지연)**와 **초당 몇 개를(처리량)** 사이의 흥정이다.",
    body: [
      { h: "배칭은 처리량을 사고 지연을 판다", t: "요청을 모아 한 번에 처리하면 GPU 를 알차게 쓴다. 대신 먼저 온 요청은 뒤의 요청을 기다려야 해서 늦어진다 — 그래서 '최대 몇 ms 까지 기다린다' 는 상한을 둔다." },
      { h: "평균이 아니라 p95·p99 를 본다", t: "평균 지연이 50ms 여도 100명 중 한 명은 2초를 기다릴 수 있다. 사용자가 느끼는 것은 그 꼬리 쪽이라, 서비스 지표는 백분위로 잡는다." },
      { h: "웜업이 없으면 첫 요청이 느리다", t: "모델을 처음 부를 때 메모리 할당과 커널 컴파일이 일어난다. 배포 직후 첫 사용자가 그 비용을 다 낸다 — 뜨자마자 더미 요청을 몇 번 돌려 데워 둔다." },
      { h: "큐가 무한이면 장애가 길어진다", t: "처리 속도보다 요청이 빨리 들어오면 큐가 무한히 쌓이고, 사용자는 이미 포기한 요청을 서버가 계속 처리한다. 큐 길이에 상한을 두고 넘치면 바로 거절하는 편이 회복이 빠르다." },
    ],
    code: { c: "# 배칭: 최대 크기 또는 최대 대기시간\nif len(큐) >= B or 기다린시간 >= T:\n    처리(큐)\n\n# 백분위\nsorted(지연)[int(0.95 * n)]", cap: "무엇을 팔아 무엇을 살 것인가" },
    key: ["배칭은 처리량↑ 지연↑", "평균 말고 p95·p99", "큐에 상한을 둔다"],
  },
  q: [
    {
      k: "percentile · 꼬리를 본다",
      qq: "지연 목록에서 <code>p</code> 백분위 값을 돌려주세요. 정렬 후 <code>int(p * n)</code> 번째이고, 범위를 넘으면 <b>마지막 값</b>입니다.",
      src: "def percentile(xs, p):\n    return sum(xs) / len(xs)\n",
      sol: "def percentile(xs, p):\n    s = sorted(xs)\n    i = int(p * len(s))\n    return s[min(i, len(s) - 1)]\n",
      tests: [["percentile([1, 2, 3, 100], 0.95)", "100"], ["percentile([1, 2, 3, 4], 0.5)", "3"], ["percentile([5], 0.99)", "5"]],
      edge: [["percentile([3, 1, 2], 0.0)", "1"], ["percentile([1, 1, 1, 9], 0.5)", "1"]],
      ex: "[1, 2, 3, 100] 의 평균은 26.5 라 '조금 느리네' 로 보입니다. 하지만 네 명 중 한 명은 100ms 를 기다렸어요 — 사용자가 겪는 것은 평균이 아니라 자기 요청의 지연입니다.",
    },
    {
      k: "should_flush · 언제 배치를 보낼까",
      qq: "큐 길이가 <code>B</code> <b>이상</b>이거나 기다린 시간이 <code>T</code> <b>이상</b>이면 True 를 돌려주세요.",
      src: "def should_flush(n, waited, B, T):\n    return n >= B and waited >= T\n",
      sol: "def should_flush(n, waited, B, T):\n    return n >= B or waited >= T\n",
      tests: [["should_flush(8, 1, 8, 50)", "True"], ["should_flush(1, 50, 8, 50)", "True"], ["should_flush(1, 1, 8, 50)", "False"]],
      edge: [["should_flush(0, 50, 8, 50)", "True"], ["should_flush(8, 50, 8, 50)", "True"]],
      ex: "`and` 로 묶으면 요청이 뜸한 새벽에 한 건이 배치가 찰 때까지 영원히 기다립니다. 둘 중 하나만 만족해도 보내야 해요 — 크기는 처리량을 위한 조건, 시간은 지연 상한을 지키기 위한 조건입니다.",
    },
    {
      k: "admit · 넘치면 빨리 거절한다",
      qq: "큐 길이가 <code>cap</code> <b>미만</b>일 때만 받아들여 True 를 돌려주세요.",
      src: "def admit(qlen, cap):\n    return True\n",
      sol: "def admit(qlen, cap):\n    return qlen < cap\n",
      tests: [["admit(0, 10)", "True"], ["admit(10, 10)", "False"], ["admit(11, 10)", "False"]],
      edge: [["admit(9, 10)", "True"], ["admit(0, 0)", "False"]],
      ex: "다 받아 두면 큐가 무한히 쌓이고, 사용자는 이미 창을 닫았는데 서버는 그 요청을 계속 처리합니다. 장애가 끝나도 밀린 것을 다 소화할 때까지 회복이 안 돼요 — 빨리 거절하는 편이 모두에게 낫습니다.",
    },
  ],
},
/* ── RAG 아키텍처 ────────────────────────────────────────── */
{
  unit: "RAG 아키텍처",
  lesson: "직접 짜 보기 — 찾아서 붙여 주기",
  th: {
    sum: "RAG 는 **모델에게 답을 외우게 하는 대신, 찾아서 프롬프트에 붙여 주는 것**이다.",
    body: [
      { h: "왜 학습 대신 검색인가", t: "회사 문서는 매일 바뀐다. 바뀔 때마다 모델을 다시 학습시키는 건 비싸고 느리다. 검색으로 붙여 주면 문서만 갈아 끼우면 되고, 출처도 함께 보여 줄 수 있다." },
      { h: "세 단계로 나뉜다", t: "문서를 잘라 벡터로 만들어 저장(색인) → 질문과 가까운 조각을 찾기(검색) → 찾은 것을 프롬프트에 붙여 답 생성. 문제가 생기면 이 셋 중 어디인지부터 가른다." },
      { h: "컨텍스트에는 한계가 있다", t: "찾은 것을 다 붙일 수는 없다. 토큰 상한 안에서 가장 쓸모 있는 것만 골라야 하고, 그래서 순위와 자르기가 품질을 좌우한다." },
      { h: "못 찾으면 지어낸다", t: "근거를 못 찾았는데도 답을 내라고 하면 모델은 그럴듯한 말을 만든다. '근거가 없으면 모른다고 답하라' 를 프롬프트에 명시하고, 검색 점수가 낮으면 아예 답하지 않는 길도 둔다." },
    ],
    code: { c: "조각들 = split(문서)\n색인 = [(조각, embed(조각)) for 조각 in 조각들]\n\n후보 = top_k(색인, embed(질문), k)\n프롬프트 = 지시 + 붙일수있는만큼(후보) + 질문", cap: "찾고 → 자르고 → 붙인다" },
    key: ["문서가 바뀌어도 다시 학습 안 한다", "색인·검색·생성 셋으로 나뉜다", "근거가 없으면 모른다고 답한다"],
  },
  q: [
    {
      k: "fit_context · 들어갈 만큼만 붙이기",
      qq: "조각 목록을 <b>앞에서부터</b> 붙이되, 길이 합이 <code>limit</code> 를 <b>넘지 않게</b> 담아 돌려주세요. 넘치는 조각은 건너뛰지 말고 <b>거기서 멈춥니다</b>.",
      src: "def fit_context(chunks, limit):\n    out, used = [], 0\n    for c in chunks:\n        if used + len(c) <= limit:\n            out.append(c)\n            used += len(c)\n    return out\n",
      sol: "def fit_context(chunks, limit):\n    out, used = [], 0\n    for c in chunks:\n        if used + len(c) > limit:\n            break\n        out.append(c)\n        used += len(c)\n    return out\n",
      tests: [["fit_context(['aaa', 'bbbb', 'c'], 4)", "['aaa']"], ["fit_context(['ab', 'cd'], 4)", "['ab', 'cd']"], ["fit_context(['abcde'], 3)", "[]"]],
      edge: [["fit_context([], 5)", "[]"], ["fit_context(['a', 'bbbb', 'c'], 2)", "['a']"]],
      ex: "건너뛰면 순위 3위가 2위를 제치고 앞에 옵니다 — 점수 순으로 정렬해 둔 의미가 사라져요. 게다가 문서를 이어 붙인 맥락이 중간이 빠진 채 들어가 모델이 헷갈립니다. 상한에 닿으면 멈추는 편이 예측 가능합니다.",
    },
    {
      k: "should_answer · 근거가 약하면 답하지 않기",
      qq: "최고 검색 점수가 <code>thr</code> <b>이상</b>일 때만 True 를 돌려주세요. 후보가 없으면 False 입니다.",
      src: "def should_answer(scores, thr):\n    return len(scores) > 0\n",
      sol: "def should_answer(scores, thr):\n    return bool(scores) and max(scores) >= thr\n",
      tests: [["should_answer([0.9, 0.1], 0.5)", "True"], ["should_answer([0.2, 0.1], 0.5)", "False"], ["should_answer([], 0.5)", "False"]],
      edge: [["should_answer([0.5], 0.5)", "True"], ["should_answer([0.49], 0.5)", "False"]],
      ex: "검색이 무언가를 돌려주긴 합니다 — 아무리 관련 없어도 가장 덜 관련 없는 것을 줘요. 그걸 근거라고 붙이면 모델은 엉뚱한 문서를 인용하며 자신 있게 지어냅니다. 점수가 낮으면 '모른다' 가 정답입니다.",
    },
    {
      k: "cite · 출처를 함께 돌려주기",
      qq: "<code>[(조각, 문서id)]</code> 에서 <b>중복 없이</b> 문서 id 목록을 <b>처음 나온 순서대로</b> 돌려주세요.",
      src: "def cite(hits):\n    return sorted(set(d for _, d in hits))\n",
      sol: "def cite(hits):\n    out = []\n    for _, d in hits:\n        if d not in out:\n            out.append(d)\n    return out\n",
      tests: [["cite([('a', 'D2'), ('b', 'D1'), ('c', 'D2')])", "['D2', 'D1']"], ["cite([('a', 'D1')])", "['D1']"], ["cite([])", "[]"]],
      edge: [["cite([('a', 'D1'), ('b', 'D1')])", "['D1']"], ["cite([('a', 'B'), ('b', 'A')])", "['B', 'A']"]],
      ex: "정렬해 버리면 가장 관련 높은 문서가 출처 목록 아래로 밀립니다. 사용자는 위에서부터 읽으니, 순위가 곧 출처의 신뢰도 순서예요 — 검색이 매긴 순서를 지켜야 합니다.",
    },
  ],
},
/* ── Vector DB·검색 ──────────────────────────────────────── */
{
  unit: "Vector DB·검색",
  lesson: "직접 짜 보기 — 가까움을 숫자로",
  th: {
    sum: "벡터 검색은 **뜻이 비슷한 것을 가까운 점으로 만들어** 거리를 재는 일이다.",
    body: [
      { h: "코사인은 방향만 본다", t: "두 벡터가 이루는 각도의 코사인이다. 길이를 무시하므로 문서가 길든 짧든 '무엇에 대한 글인가' 만 견준다 — 그래서 텍스트 검색의 기본값이다." },
      { h: "정규화하면 내적이 곧 코사인", t: "길이를 1로 맞춰 두면 코사인이 그냥 내적이 된다. 곱셈과 덧셈만 남아 아주 빠르고, 그래서 벡터 DB 는 저장할 때 미리 정규화한다." },
      { h: "정확한 검색은 전부 비교해야 한다", t: "백만 개면 백만 번 비교다. 그래서 실제로는 근사 최근접(ANN) 을 쓴다 — 조금 틀릴 수 있지만 수백 배 빠르다. 재현율을 얼마나 포기할지가 설정값이다." },
      { h: "키워드 검색과 섞으면 더 낫다", t: "벡터는 뜻을 잘 잡지만 정확한 제품 코드나 사람 이름에는 약하다. 키워드 점수와 벡터 점수를 합치는 하이브리드가 실무에서 보통 가장 낫다." },
    ],
    code: { c: "코사인 = Σaᵢbᵢ / (|a| * |b|)\n\n# 미리 정규화해 두면\na = a / |a|;  b = b / |b|\n코사인 = Σaᵢbᵢ        # 내적만", cap: "방향이 같으면 1, 직각이면 0" },
    key: ["코사인은 길이를 무시한다", "정규화하면 내적이 곧 코사인", "정확 검색은 전부 비교"],
  },
  q: [
    {
      k: "cosine · 방향이 얼마나 같은가",
      qq: "두 벡터의 <b>코사인 유사도</b>를 돌려주세요. 한쪽이 영벡터면 0.0 입니다.",
      src: "def cosine(a, b):\n    return sum(x * y for x, y in zip(a, b))\n",
      sol: "def cosine(a, b):\n    na = sum(x * x for x in a) ** 0.5\n    nb = sum(y * y for y in b) ** 0.5\n    if na == 0 or nb == 0:\n        return 0.0\n    return sum(x * y for x, y in zip(a, b)) / (na * nb)\n",
      tests: [["cosine([1.0, 0.0], [2.0, 0.0])", "1.0"], ["cosine([1.0, 0.0], [0.0, 1.0])", "0.0"], ["cosine([1.0, 0.0], [0.0, 0.0])", "0.0"]],
      edge: [["round(cosine([1.0, 1.0], [-1.0, -1.0]), 10)", "-1.0"], ["round(cosine([3.0, 4.0], [3.0, 4.0]), 10)", "1.0"]],
      ex: "정규화를 안 하면 긴 문서가 무조건 이깁니다 — 값이 크니까 내적도 커요. 같은 방향인 [1,0] 과 [2,0] 은 뜻이 똑같은데 점수가 2배가 되는 겁니다. 길이로 나눠야 '방향' 만 남습니다.",
    },
    {
      k: "top_k · 가까운 것 k개",
      qq: "<code>[(id, 점수)]</code> 에서 점수가 <b>높은 순</b>으로 k개의 id 를 돌려주세요. 동점이면 <b>id 가 작은 것</b>이 먼저입니다.",
      src: "def top_k(items, k):\n    return [i for i, _ in sorted(items, key=lambda t: t[1])[:k]]\n",
      sol: "def top_k(items, k):\n    return [i for i, _ in sorted(items, key=lambda t: (-t[1], t[0]))[:k]]\n",
      tests: [["top_k([('a', 0.1), ('b', 0.9)], 1)", "['b']"], ["top_k([('a', 0.5), ('b', 0.5)], 2)", "['a', 'b']"], ["top_k([('c', 0.3), ('a', 0.7), ('b', 0.5)], 2)", "['a', 'b']"]],
      edge: [["top_k([], 3)", "[]"], ["top_k([('a', 0.1)], 5)", "['a']"]],
      ex: "정렬 방향을 안 뒤집으면 **가장 먼** 것부터 나옵니다 — 검색 결과 맨 위에 가장 관련 없는 문서를 올리는 셈이에요. 그런데 오류가 안 나서, 품질이 나쁜 이유를 모델 탓으로 돌리게 됩니다.",
    },
    {
      k: "hybrid · 두 점수를 섞기",
      qq: "벡터 점수와 키워드 점수를 <code>w</code> : <code>1-w</code> 로 섞은 점수를 돌려주세요. <code>w</code> 는 벡터 쪽 비중입니다.",
      src: "def hybrid(vec, kw, w):\n    return vec * w + kw * w\n",
      sol: "def hybrid(vec, kw, w):\n    return vec * w + kw * (1 - w)\n",
      tests: [["hybrid(1.0, 0.0, 0.5)", "0.5"], ["hybrid(1.0, 0.0, 1.0)", "1.0"], ["hybrid(0.0, 1.0, 0.0)", "1.0"]],
      edge: [["hybrid(0.5, 0.5, 0.3)", "0.5"], ["hybrid(1.0, 1.0, 0.7)", "1.0"]],
      ex: "양쪽에 같은 가중치를 곱하면 w=1 일 때 두 점수를 그냥 더한 것이 됩니다 — '벡터만 쓴다' 는 뜻이 사라져요. 비중은 합이 1이 되도록 나눠 가져야 결과가 원래 점수와 같은 범위에 있습니다.",
    },
  ],
},
/* ── LLM 평가 ────────────────────────────────────────────── */
{
  unit: "LLM 평가",
  lesson: "직접 짜 보기 — 생성물을 어떻게 채점하나",
  th: {
    sum: "생성 모델은 **정답이 하나가 아니라서** 평가가 어렵다. 그래서 여러 자를 함께 댄다.",
    body: [
      { h: "문자열 비교로는 안 된다", t: "'서울입니다' 와 '서울' 은 같은 답인데 문자열로는 다르다. 정확 일치는 선택지가 정해진 문제에만 쓰고, 자유 생성에는 포함 여부·의미 유사도·사람 평가를 섞는다." },
      { h: "근거에 있는 말인지부터 본다", t: "RAG 라면 답의 주장 하나하나가 붙여 준 문서에 있는지 확인할 수 있다. 없는 말을 했으면 환각이다 — 완벽하진 않지만 자동으로 잴 수 있는 몇 안 되는 지표다." },
      { h: "심판 모델도 편향이 있다", t: "LLM 에게 채점을 시키면 긴 답, 자기가 쓴 것 같은 문체, 먼저 보여 준 쪽을 선호하는 경향이 있다. 순서를 바꿔 두 번 물어보는 것만으로도 상당히 줄어든다." },
      { h: "A/B 는 충분한 표본이 있어야 한다", t: "50명에게 물어 55:45 가 나온 것은 우연과 구별되지 않는다. 차이를 말하기 전에 표본이 그 차이를 뒷받침하는지 먼저 본다." },
    ],
    code: { c: "# 근거 기반 채점\n주장들이 근거 안에 있는가?\n\n# 심판 편향 줄이기\n점수1 = judge(A, B)\n점수2 = judge(B, A)   # 순서를 바꿔 한 번 더", cap: "자 하나로는 못 잰다" },
    key: ["정확 일치는 자유 생성에 안 맞는다", "근거 밖의 말은 환각", "심판은 순서를 바꿔 물어본다"],
  },
  q: [
    {
      k: "loose_match · 느슨하게 맞히기",
      qq: "정답 문자열이 답변에 <b>들어 있으면</b> True 를 돌려주세요. 앞뒤 공백과 대소문자는 무시합니다.",
      src: "def loose_match(answer, gold):\n    return answer == gold\n",
      sol: "def loose_match(answer, gold):\n    return gold.strip().lower() in answer.strip().lower()\n",
      tests: [["loose_match('정답은 Seoul 입니다', 'seoul')", "True"], ["loose_match('  Seoul  ', 'Seoul')", "True"], ["loose_match('부산입니다', 'seoul')", "False"]],
      edge: [["loose_match('', '')", "True"], ["loose_match('SEOUL', 'seoul')", "True"]],
      ex: "정확 일치는 '서울' 과 '서울입니다' 를 다른 답으로 셉니다. 모델이 맞혔는데도 0점이 나와서, 개선 여부를 판단할 수 없게 돼요 — 자유 생성에는 자유 생성에 맞는 자가 필요합니다.",
    },
    {
      k: "grounded · 근거 안의 말인가",
      qq: "주장 목록이 <b>전부</b> 근거 문자열에 들어 있으면 True 를 돌려주세요. 주장이 없으면 True 입니다.",
      src: "def grounded(claims, evidence):\n    return any(c in evidence for c in claims)\n",
      sol: "def grounded(claims, evidence):\n    return all(c in evidence for c in claims)\n",
      tests: [["grounded(['서울', '한국'], '서울은 한국의 수도')", "True"], ["grounded(['서울', '도쿄'], '서울은 한국의 수도')", "False"], ["grounded([], '아무거나')", "True"]],
      edge: [["grounded(['없는말'], '')", "False"], ["grounded(['서울'], '서울')", "True"]],
      ex: "`any` 는 주장 하나만 맞아도 통과시킵니다 — 맞는 말 하나에 지어낸 말 아홉을 섞으면 그대로 넘어가요. 환각을 잡으려면 **전부** 근거 안에 있어야 합니다.",
    },
    {
      k: "ab_decide · 표본이 충분한가",
      qq: "A 승·B 승 수를 받아, 표본이 <code>n_min</code> 미만이면 <code>'판단 보류'</code>, 아니면 이긴 쪽(<code>'A'</code>/<code>'B'</code>), 동점이면 <code>'무승부'</code> 를 돌려주세요.",
      src: "def ab_decide(a, b, n_min):\n    if a > b:\n        return 'A'\n    if b > a:\n        return 'B'\n    return '무승부'\n",
      sol: "def ab_decide(a, b, n_min):\n    if a + b < n_min:\n        return '판단 보류'\n    if a > b:\n        return 'A'\n    if b > a:\n        return 'B'\n    return '무승부'\n",
      tests: [["ab_decide(3, 2, 100)", "'판단 보류'"], ["ab_decide(60, 40, 100)", "'A'"], ["ab_decide(50, 50, 100)", "'무승부'"]],
      edge: [["ab_decide(0, 0, 1)", "'판단 보류'"], ["ab_decide(40, 60, 100)", "'B'"]],
      ex: "5명에게 물어 3:2 가 나온 것은 동전을 다섯 번 던진 것과 구별되지 않습니다. 그런데 코드는 당당히 'A 승' 이라고 답해요 — 표본이 모자라면 '모른다' 고 말할 줄 아는 것이 지표의 정직함입니다.",
    },
  ],
},
/* ── MLOps·운영 ──────────────────────────────────────────── */
{
  unit: "MLOps·운영",
  lesson: "직접 짜 보기 — 배포한 뒤가 진짜다",
  th: {
    sum: "모델은 배포한 순간부터 **조용히 낡는다**. 세상이 변하는데 모델은 그대로이기 때문이다.",
    body: [
      { h: "드리프트는 소리 없이 온다", t: "입력 분포가 변하면(새 상품군, 계절, 유행) 정확도가 서서히 떨어진다. 오류가 나지 않으니 알림도 없다 — 입력 통계를 학습 때와 견주는 감시를 따로 둬야 한다." },
      { h: "정답은 늦게 온다", t: "이탈 예측의 정답은 한 달 뒤에나 확인된다. 그동안은 성능을 못 재니, 대신 입력 분포와 예측 분포의 변화를 본다. '양성 비율이 갑자기 3배' 는 정답 없이도 잡히는 신호다." },
      { h: "롤백할 수 있어야 배포할 수 있다", t: "모델 버전을 데이터·코드와 함께 기록하고, 한 번의 조작으로 되돌릴 수 있어야 한다. 되돌릴 방법이 없으면 배포가 도박이 된다." },
      { h: "카나리로 조금씩 흘린다", t: "트래픽의 1%만 새 모델로 보내고 지표를 견준다. 문제가 있어도 1%만 겪는다 — 전면 배포는 그 1%가 멀쩡할 때 한다." },
    ],
    code: { c: "# 분포가 얼마나 옮겨졌나 (아주 단순한 버전)\n|학습평균 - 운영평균| / 학습표준편차\n\n# 카나리\n if hash(user) % 100 < 비율: 새모델\n else: 기존모델", cap: "정답 없이도 볼 수 있는 신호" },
    key: ["드리프트는 오류를 안 낸다", "정답이 늦으면 분포를 본다", "롤백과 카나리를 먼저 준비"],
  },
  q: [
    {
      k: "drift_score · 얼마나 옮겨졌나",
      qq: "학습 평균·표준편차와 운영 평균을 받아 <b>표준편차 단위의 이동량</b>을 돌려주세요. 표준편차가 0이면 0.0 입니다.",
      src: "def drift_score(train_mean, train_sd, live_mean):\n    return live_mean - train_mean\n",
      sol: "def drift_score(train_mean, train_sd, live_mean):\n    if train_sd == 0:\n        return 0.0\n    return abs(live_mean - train_mean) / train_sd\n",
      tests: [["drift_score(0.0, 1.0, 2.0)", "2.0"], ["drift_score(0.0, 1.0, -2.0)", "2.0"], ["drift_score(10.0, 5.0, 15.0)", "1.0"]],
      edge: [["drift_score(1.0, 0.0, 9.0)", "0.0"], ["drift_score(0.0, 2.0, 1.0)", "0.5"]],
      ex: "빼기만 하면 단위가 그대로라 '5 만큼 옮겼다' 가 큰지 작은지 알 수 없습니다. 원래 값이 ±100 사이를 오가는 지표라면 5는 아무것도 아니고, ±1 사이라면 큰일이에요. 표준편차로 나눠야 값들끼리 견줄 수 있습니다. 부호도 지워야 양쪽 이동을 똑같이 잡습니다.",
    },
    {
      k: "canary · 같은 사용자는 늘 같은 쪽",
      qq: "사용자 id 와 비율(%)을 받아, 그 사용자가 <b>새 모델</b>로 가면 True 를 돌려주세요. <b>같은 id 는 언제나 같은 결과</b>여야 합니다.",
      src: "_N = [0]\n\n\ndef canary(uid, pct):\n    _N[0] += 1\n    return _N[0] % 100 < pct\n",
      sol: "def canary(uid, pct):\n    h = 0\n    for ch in str(uid):\n        h = (h * 31 + ord(ch)) % 1000003\n    return h % 100 < pct\n",
      /* 같은 id 를 여러 번 물어봐야 '들어온 순서로 나눠 주기' 의 정체가 드러난다.
         두세 번으로는 우연히 같은 값이 나와 통과해 버린다. */
      tests: [["canary('u1', 100)", "True"], ["canary('u1', 0)", "False"], ["len({canary('u1', 50) for _ in range(200)})", "1"]],
      edge: [["len({canary('u%d' % i, 50) for i in range(50)})", "2"], ["canary('u7', 100)", "True"]],
      ex: "들어온 순서대로 번갈아 나눠 주면, 같은 사용자가 새로고침할 때마다 다른 모델을 만납니다. 답이 왔다 갔다 하니 사용자는 고장으로 느끼고, 지표도 두 모델에 섞여 비교가 안 돼요 — id 를 해시해 고정하면 그 사람은 늘 같은 쪽에 머뭅니다. 비율은 그대로 지켜지고요.",
    },
    {
      k: "rollback · 되돌릴 수 있는가",
      qq: "배포 기록 <code>[(버전, 정상여부)]</code> 에서 <b>가장 최근의 정상 버전</b>을 돌려주세요. 없으면 <code>None</code> 입니다. 목록은 오래된 것부터입니다.",
      src: "def rollback(history):\n    for v, ok in history:\n        if ok:\n            return v\n    return None\n",
      sol: "def rollback(history):\n    for v, ok in reversed(history):\n        if ok:\n            return v\n    return None\n",
      tests: [["rollback([('v1', True), ('v2', True), ('v3', False)])", "'v2'"], ["rollback([('v1', True)])", "'v1'"], ["rollback([('v1', False)])", "None"]],
      edge: [["rollback([])", "None"], ["rollback([('v1', True), ('v2', False), ('v3', False)])", "'v1'"]],
      ex: "앞에서부터 찾으면 가장 **오래된** 정상 버전으로 돌아갑니다 — 그 사이의 멀쩡한 개선까지 전부 날아가요. 롤백은 '문제 직전' 으로 가는 것이지 '태초' 로 가는 것이 아닙니다.",
    },
  ],
},
/* ── AI 첫걸음 ───────────────────────────────────────────── */
{
  unit: "AI 첫걸음",
  lesson: "직접 짜 보기 — 토큰과 확률의 감을 잡는다",
  th: {
    sum: "언어 모델은 **다음에 올 토큰의 확률**을 내놓는 기계다. 나머지는 그것을 어떻게 쓰느냐의 문제다.",
    body: [
      { h: "토큰은 글자도 단어도 아니다", t: "자주 쓰는 조각 단위로 자른 것이다. 영어는 대략 단어 하나가 1~2 토큰, 한국어는 글자당 1~2 토큰쯤 든다. 요금과 컨텍스트 한도가 전부 토큰 기준이라, 대충이라도 셀 줄 알아야 한다." },
      { h: "온도는 다양성 손잡이", t: "0에 가까우면 가장 확률 높은 것만 골라 매번 같은 답이 나온다. 높이면 낮은 확률의 토큰도 뽑혀 다채롭지만 헛소리도 는다 — 사실을 다루면 낮게, 창작이면 높게." },
      { h: "컨텍스트는 입력과 출력이 함께 쓴다", t: "한도가 8000 토큰이면 프롬프트와 답변을 합쳐 8000 이다. 프롬프트를 7900 쓰면 답할 자리가 100밖에 없다 — 답이 잘리는 사고가 여기서 난다." },
      { h: "모델은 자기가 틀렸는지 모른다", t: "확률이 높은 말을 이어 붙일 뿐이라, 자신 있게 틀린 문장을 만든다. 확신에 찬 말투를 근거로 삼으면 안 된다." },
    ],
    code: { c: "쓸 수 있는 답변 토큰 = 한도 - 프롬프트 토큰\n\n온도 0   → 언제나 같은 답\n온도 높음 → 다양하지만 헛소리 ↑", cap: "입력과 출력이 같은 한도를 나눠 쓴다" },
    key: ["요금과 한도는 토큰 기준", "온도는 다양성 손잡이", "프롬프트가 길면 답이 잘린다"],
  },
  q: [
    {
      k: "room_for_answer · 답할 자리가 남았나",
      qq: "한도와 프롬프트 토큰 수를 받아 <b>답변에 쓸 수 있는 토큰 수</b>를 돌려주세요. 음수면 0 입니다.",
      src: "def room_for_answer(limit, prompt):\n    return limit\n",
      sol: "def room_for_answer(limit, prompt):\n    return max(0, limit - prompt)\n",
      tests: [["room_for_answer(8000, 7900)", "100"], ["room_for_answer(8000, 0)", "8000"], ["room_for_answer(100, 500)", "0"]],
      edge: [["room_for_answer(100, 100)", "0"], ["room_for_answer(0, 0)", "0"]],
      ex: "한도를 그대로 답변 자리로 여기면, 프롬프트에 문서를 잔뜩 붙였을 때 답이 중간에 잘립니다. 오류가 아니라 문장이 끊긴 채로 와서 원인을 찾기 어려워요 — 입력과 출력은 같은 한도를 나눠 씁니다.",
    },
    {
      k: "greedy · 온도 0이면 늘 같은 답",
      qq: "<code>[(토큰, 확률)]</code> 에서 <b>확률이 가장 높은</b> 토큰을 돌려주세요. 동점이면 <b>사전순으로 앞선</b> 것입니다.",
      src: "def greedy(dist):\n    return max(dist, key=lambda t: t[1])[0]\n",
      sol: "def greedy(dist):\n    best = max(p for _, p in dist)\n    return min(t for t, p in dist if p == best)\n",
      tests: [["greedy([('b', 0.5), ('a', 0.5)])", "'a'"], ["greedy([('a', 0.1), ('b', 0.9)])", "'b'"], ["greedy([('z', 1.0)])", "'z'"]],
      edge: [["greedy([('b', 0.3), ('a', 0.3), ('c', 0.3)])", "'a'"]],
      ex: "`max` 는 동점일 때 **먼저 나온 것**을 집습니다. 확률 계산이 미세하게 달라지거나 목록 순서가 바뀌면 답이 달라져요 — 온도 0 의 약속은 '재현된다' 인데, 동점 규칙을 안 정하면 그 약속이 깨집니다.",
    },
    {
      k: "est_tokens · 대충이라도 세어 보기",
      qq: "문자열의 토큰 수를 어림하세요. <b>아스키 글자는 4자당 1토큰</b>(올림), <b>그 밖의 글자는 1자당 1토큰</b>입니다.",
      src: "def est_tokens(s):\n    return len(s) // 4\n",
      sol: "def est_tokens(s):\n    ascii_n = sum(1 for c in s if ord(c) < 128)\n    other = len(s) - ascii_n\n    return -(-ascii_n // 4) + other\n",
      tests: [["est_tokens('abcd')", "1"], ["est_tokens('한글')", "2"], ["est_tokens('ab한')", "2"]],
      edge: [["est_tokens('')", "0"], ["est_tokens('a')", "1"]],
      ex: "4로 나누기만 하면 한국어 문서의 토큰 수를 4분의 1로 봅니다 — 한도에 들어갈 줄 알았던 프롬프트가 실제로는 네 배라 그대로 거절당해요. 그리고 내림이라 'a' 한 글자가 0 토큰이 됩니다. 어림이라도 방향은 맞아야 합니다.",
    },
  ],
},
];
