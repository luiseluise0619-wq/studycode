/* AI·딥러닝 실행형 12문항 — 순수 파이썬(math 만 쓴다).
   앞 6문항은 ai(LLM 추론·토크나이저·검색), 뒤 6문항은 dl(학습 구성 요소) 트랙으로 간다.
   전부 '수식을 읽는 것' 과 '경계에서 맞게 만드는 것' 이 다른 주제다. */

module.exports=[

/* ══ ai ══ */
{ k:"수치 안정 softmax", fn:"softmax", cat:"debug",
  q:"<code>softmax(xs)</code> 를 구현하세요. <code>exp(xᵢ) / Σexp(xⱼ)</code> 이며 빈 입력은 <code>[]</code> 입니다. 아래 구현은 수식대로 썼는데 실제 로짓에서 <b>죽습니다</b> — 고치세요.",
  src:`def softmax(xs):
    import math
    if not xs:
        return []
    # TODO: 로짓이 크면 exp 가 넘친다
    exps = [math.exp(x) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]`,
  sol:`def softmax(xs):
    import math
    if not xs:
        return []
    m = max(xs)                                 # 최댓값을 빼도 결과는 같다
    exps = [math.exp(x - m) for x in xs]
    s = sum(exps)
    return [e / s for e in exps]`,
  tests:[
    ["[round(v, 6) for v in softmax([0, 0])]","[0.5, 0.5]"],
    ["[round(v, 6) for v in softmax([1000, 1000])]","[0.5, 0.5]"],
    ["round(sum(softmax([1, 2, 3])), 6)","1.0"],
    ["[round(v, 6) for v in softmax([0, 1])]","[0.268941, 0.731059]"],
    ["softmax([])","[]"]],
  edge:[
    ["[round(a - b, 6) for a, b in zip(softmax([1, 2, 3]), softmax([11, 12, 13]))]","[0.0, 0.0, 0.0]"],
    ["[round(v, 6) for v in softmax([-1000, -1000])]","[0.5, 0.5]"]],
  ex:"🎯 softmax 는 **입력 전체에 같은 수를 더하거나 빼도 결과가 변하지 않습니다**(shift invariance) — 분자와 분모에 같은 `exp(m)` 이 곱해져 약분되기 때문입니다. 첫 edge 테스트가 그 성질을 직접 확인합니다.\n💡 그래서 최댓값을 빼면 지수의 인자가 항상 0 이하가 되어 `exp` 가 넘칠 수 없습니다. 이것이 모든 실전 구현이 하는 일이고, PyTorch·TensorFlow 의 softmax 도 내부에서 같은 처리를 합니다.\n⚠️ 이 버그가 위험한 이유는 **작은 예제에서는 완벽히 동작한다**는 것입니다. `[1, 2, 3]` 으로 테스트하면 통과하고, 실제 모델의 로짓이 수백~수천에 이르는 순간 `OverflowError` 로 죽습니다. `[1000, 1000]` 같은 테스트가 없으면 배포 후에 발견합니다.\n🔧 반대 방향 함정도 있습니다 — 최댓값을 빼지 않고 아주 작은 값(`-1000`)을 넣으면 `exp` 가 전부 0 이 되어 **0으로 나누기**가 됩니다(두 번째 edge 테스트). 오버플로는 예외로 드러나지만 언더플로는 조용히 `nan` 을 만들어 학습 전체를 오염시키므로 더 나쁩니다." },

{ k:"교차 엔트로피와 log(0)", fn:"cross_entropy", cat:"debug",
  q:"<code>cross_entropy(probs, target)</code> 는 정답 인덱스의 확률에 대해 <code>−log(p)</code> 를 돌려줍니다. 확률이 <b><code>1e-12</code> 보다 작으면 그 값으로 눌러</b> 계산하고, <code>target</code> 이 범위를 벗어나면 <code>float('inf')</code> 입니다. 아래 구현은 모델이 정답에 0을 준 순간 예외를 냅니다.",
  src:`def cross_entropy(probs, target):
    import math
    if target < 0 or target >= len(probs):
        return float('inf')
    # TODO: 확률이 0 이면 log 가 정의되지 않는다
    return -math.log(probs[target])`,
  sol:`def cross_entropy(probs, target):
    import math
    if target < 0 or target >= len(probs):
        return float('inf')
    p = probs[target]
    if p < 1e-12:
        p = 1e-12          # 클리핑 — 손실을 크게 두되 발산시키지 않는다
    return -math.log(p)`,
  tests:[
    ["round(cross_entropy([0.5, 0.5], 0), 6)","0.693147"],
    ["round(cross_entropy([1.0, 0.0], 0), 6)","0.0"],
    ["round(cross_entropy([1.0, 0.0], 1), 6)","27.631021"],
    ["cross_entropy([0.5, 0.5], 5)","float('inf')"],
    ["round(cross_entropy([0.1] * 10, 3), 6)","2.302585"]],
  edge:[
    ["cross_entropy([0.5, 0.5], -1)","float('inf')"],
    ["round(cross_entropy([0.25] * 4, 0), 6)","1.386294"]],
  ex:"🎯 교차 엔트로피는 '**정답에 얼마나 낮은 확률을 줬는지**' 를 재고, 확률이 0 에 가까워지면 무한대로 발산합니다. 그런데 모델이 정답 토큰에 정확히 0 을 주는 일은 실제로 일어납니다 — float16 언더플로, softmax 후 반올림, 마스킹 처리 실수.\n⚠️ 가드가 없으면 `ValueError: math domain error` 로 학습이 멈추거나, 프레임워크에서는 `inf` 손실이 나와 역전파에서 **모든 가중치가 nan** 이 됩니다. 한 번 nan 이 되면 되돌릴 수 없어 체크포인트부터 다시 시작해야 합니다.\n💡 클리핑 값의 의미도 알아 둘 값이 있습니다. `1e-12` 로 누르면 손실이 약 27.6 으로 고정됩니다 — '매우 나쁘지만 유한한 값' 입니다. 이 정도면 기울기가 충분히 커서 모델이 배우고, 동시에 다른 샘플의 손실을 압도하지는 않습니다.\n🔧 실전에서는 확률을 만든 뒤 log 를 취하는 대신 **로짓에서 바로 계산**합니다(`log_softmax` + `nll_loss`, 또는 `cross_entropy_with_logits`). 지수화와 로그가 상쇄되어 클리핑 없이도 수치가 안정되고, 이것이 프레임워크가 `softmax` 결과를 손실 함수에 넣지 말라고 경고하는 이유입니다." },

{ k:"top-k 필터와 재정규화", fn:"top_k_filter", cat:"internals",
  q:"<code>top_k_filter(probs, k)</code> 를 구현하세요. 확률 <b>상위 k개만 남기고</b>(동점이면 인덱스가 작은 쪽) 나머지는 <code>0.0</code>, 남은 값들은 <b>합이 1이 되도록 재정규화</b>합니다. <code>k</code> 는 1 이상 <code>len(probs)</code> 이하로 눌러 쓰고, 남은 값의 합이 0이면 균등 분포로 둡니다. 빈 입력은 <code>[]</code> 입니다.",
  src:`def top_k_filter(probs, k):
    n = len(probs)
    if n == 0:
        return []
    k = max(1, min(k, n))
    order = sorted(range(n), key=lambda i: (-probs[i], i))
    keep = set(order[:k])
    # TODO: 자르고 나면 합이 1 이 아니다
    return [probs[i] if i in keep else 0.0 for i in range(n)]`,
  sol:`def top_k_filter(probs, k):
    n = len(probs)
    if n == 0:
        return []
    k = max(1, min(k, n))
    order = sorted(range(n), key=lambda i: (-probs[i], i))
    keep = set(order[:k])
    total = sum(probs[i] for i in keep)
    if total == 0:
        return [1.0 / k if i in keep else 0.0 for i in range(n)]
    return [probs[i] / total if i in keep else 0.0 for i in range(n)]`,
  tests:[
    ["[round(v, 6) for v in top_k_filter([0.5, 0.3, 0.2], 2)]","[0.625, 0.375, 0.0]"],
    ["[round(v, 6) for v in top_k_filter([0.5, 0.3, 0.2], 1)]","[1.0, 0.0, 0.0]"],
    ["[round(v, 6) for v in top_k_filter([0.5, 0.5], 5)]","[0.5, 0.5]"],
    ["top_k_filter([], 3)","[]"],
    ["[round(v, 6) for v in top_k_filter([0.25, 0.25, 0.5], 2)]","[0.333333, 0.0, 0.666667]"]],
  edge:[
    ["[round(v, 6) for v in top_k_filter([0.0, 0.0], 1)]","[1.0, 0.0]"],
    ["round(sum(top_k_filter([0.4, 0.3, 0.2, 0.1], 2)), 6)","1.0"]],
  ex:"🎯 top-k 는 '**꼬리를 잘라 헛소리를 줄이는**' 샘플링 기법입니다. 언어 모델의 어휘는 수만 개라 각각 0.0001 의 확률을 가진 토큰이 수천 개 있고, 그것들의 합이 무시할 수 없어서 **가끔 완전히 엉뚱한 토큰이 뽑힙니다**. 상위 k개만 남기면 그 가능성이 사라집니다.\n⚠️ 자른 뒤 **재정규화를 빼먹으면 확률이 아닌 것**을 샘플링하게 됩니다. 첫 테스트에서 합이 0.8 인 분포를 그대로 쓰면, 구현에 따라 나머지 0.2 만큼 아무것도 뽑히지 않거나 마지막 토큰에 몰립니다. 결과가 '리스트' 라서 형태만 봐서는 통과합니다.\n💡 동점 처리(인덱스가 작은 쪽)를 명시하는 이유는 **결정성**입니다. 어휘 크기가 커지면 같은 확률을 가진 토큰이 반드시 생기고, 규칙이 없으면 같은 시드로도 다른 문장이 나와 재현이 불가능해집니다.\n🔧 k 를 고르는 것은 트레이드오프입니다 — 작으면 안전하지만 반복적이고 지루한 문장이 나오고, 크면 다양하지만 헛소리가 섞입니다. 그리고 k 는 **분포의 모양을 무시**합니다: 모델이 확신하는 지점(한 토큰이 0.99)에서도 억지로 k개를 남기므로, 그 약점을 고친 것이 다음 문항의 top-p 입니다." },

{ k:"nucleus(top-p) 샘플링", fn:"nucleus", cat:"design",
  q:"<code>nucleus(probs, p)</code> 를 구현하세요. 확률 <b>내림차순으로 누적</b>하며 누적합이 <code>p</code> <b>이상이 되는 토큰까지 포함</b>(그 토큰도 포함)하고, 나머지는 <code>0.0</code>, 남은 것을 재정규화합니다. 동점은 인덱스가 작은 쪽을 먼저, 남은 합이 0이면 균등 분포, 빈 입력은 <code>[]</code> 입니다. 아래 구현은 경계 토큰을 하나 더 넣습니다.",
  src:`def nucleus(probs, p):
    n = len(probs)
    if n == 0:
        return []
    order = sorted(range(n), key=lambda i: (-probs[i], i))
    keep, acc = [], 0.0
    for i in order:
        keep.append(i)
        acc += probs[i]
        # TODO: '이상' 과 '초과' 중 어느 쪽에서 멈춰야 하는가
        if acc > p:
            break
    ks = set(keep)
    total = sum(probs[i] for i in ks)
    if total == 0:
        return [1.0 / len(ks) if i in ks else 0.0 for i in range(n)]
    return [probs[i] / total if i in ks else 0.0 for i in range(n)]`,
  sol:`def nucleus(probs, p):
    n = len(probs)
    if n == 0:
        return []
    order = sorted(range(n), key=lambda i: (-probs[i], i))
    keep, acc = [], 0.0
    for i in order:
        keep.append(i)
        acc += probs[i]
        if acc >= p:
            break
    ks = set(keep)
    total = sum(probs[i] for i in ks)
    if total == 0:
        return [1.0 / len(ks) if i in ks else 0.0 for i in range(n)]
    return [probs[i] / total if i in ks else 0.0 for i in range(n)]`,
  tests:[
    ["[round(v, 6) for v in nucleus([0.5, 0.3, 0.15, 0.05], 0.8)]","[0.625, 0.375, 0.0, 0.0]"],
    ["[round(v, 6) for v in nucleus([0.5, 0.3, 0.15, 0.05], 0.9)]","[0.526316, 0.315789, 0.157895, 0.0]"],
    ["[round(v, 6) for v in nucleus([0.5, 0.5], 0.0)]","[1.0, 0.0]"],
    ["round(sum(nucleus([0.4, 0.3, 0.2, 0.1], 1.0)), 6)","1.0"],
    ["nucleus([], 0.5)","[]"]],
  edge:[
    ["[round(v, 6) for v in nucleus([1.0, 0.0], 0.5)]","[1.0, 0.0]"],
    ["[round(v, 6) for v in nucleus([0.0, 0.0], 0.9)]","[0.5, 0.5]"]],
  ex:"🎯 top-p 가 top-k 보다 나은 점은 **분포의 모양에 적응한다**는 것입니다. 모델이 확신하는 지점(한 토큰이 0.95)에서는 후보가 1개로 줄고, 애매한 지점에서는 수십 개로 늘어납니다 — 고정된 k 는 이 둘을 구별하지 못합니다.\n⚠️ 경계 조건이 이 문항의 핵심입니다. `>=` 와 `>` 는 한 글자 차이지만 **후보 개수가 달라집니다**: `[0.5, 0.3, ...]` 에서 p=0.8 이면 정확히 두 토큰으로 0.8 에 도달하므로 거기서 멈춰야 하는데, `>` 로 쓰면 세 번째 토큰까지 들어옵니다. 결과가 여전히 정상적인 확률 분포라서 **눈으로는 절대 알 수 없습니다**.\n💡 첫 두 테스트를 나란히 보면 p 를 0.8 에서 0.9 로 올릴 때 후보가 2개에서 3개로 늘어나는 것이 보입니다. 이런 '문턱을 하나씩 넘겨 보는' 테스트가 경계 버그를 잡는 유일한 방법입니다.\n🔧 실전에서는 top-k 와 top-p 를 함께 걸고(먼저 k 로 상한을 두고 그 안에서 p), temperature 로 분포의 뾰족함을 조절합니다. 순서가 중요합니다 — temperature 를 먼저 적용해야 p 가 조절된 분포에 대해 계산됩니다. 그리고 p=0 일 때 최상위 하나만 남는 것(세 번째 테스트)이 greedy 디코딩이며, temperature=0 과 같은 결과입니다." },

{ k:"BPE 병합 한 스텝", fn:"bpe_merge", cat:"internals",
  q:"<code>bpe_merge(tokens, pair)</code> 를 구현하세요. 토큰 목록에서 <code>pair</code> 와 같은 <b>인접한 두 토큰</b>을 앞에서부터 찾아 하나로 이어 붙입니다. 병합된 토큰은 <b>다시 병합 대상이 되지 않습니다</b>(겹치지 않게 처리). 해당 쌍이 없으면 원래 목록과 같은 내용을 돌려줍니다.",
  src:`def bpe_merge(tokens, pair):
    out, i = [], 0
    while i < len(tokens):
        if i + 1 < len(tokens) and tokens[i] == pair[0] and tokens[i + 1] == pair[1]:
            out.append(tokens[i] + tokens[i + 1])
            # TODO: 두 토큰을 소비했는데 한 칸만 전진한다
            i += 1
        else:
            out.append(tokens[i])
            i += 1
    return out`,
  sol:`def bpe_merge(tokens, pair):
    out, i = [], 0
    while i < len(tokens):
        if i + 1 < len(tokens) and tokens[i] == pair[0] and tokens[i + 1] == pair[1]:
            out.append(tokens[i] + tokens[i + 1])
            i += 2                 # 두 토큰을 소비했다
        else:
            out.append(tokens[i])
            i += 1
    return out`,
  tests:[
    ["bpe_merge(['l', 'o', 'w', '</w>'], ('l', 'o'))","['lo', 'w', '</w>']"],
    ["bpe_merge(['a', 'a', 'a'], ('a', 'a'))","['aa', 'a']"],
    ["bpe_merge(['a', 'b'], ('b', 'a'))","['a', 'b']"],
    ["bpe_merge([], ('a', 'b'))","[]"],
    ["bpe_merge(['a', 'b', 'a', 'b'], ('a', 'b'))","['ab', 'ab']"]],
  edge:[
    ["bpe_merge(['a'], ('a', 'a'))","['a']"],
    ["bpe_merge(['x', 'a', 'a', 'y'], ('a', 'a'))","['x', 'aa', 'y']"]],
  ex:"🎯 BPE(byte pair encoding)는 '가장 자주 붙어 나오는 두 토큰을 하나로 합치기' 를 수천 번 반복해 어휘를 만듭니다. 이 문항은 그중 **한 스텝**이고, 실제 토크나이저 학습은 이것을 빈도 순으로 반복하는 것입니다.\n⚠️ 인덱스를 하나만 전진시키는 버그는 `['a','a','a']` 에서 드러납니다 — 병합된 `'aa'` 의 두 번째 `'a'` 를 다시 병합 대상으로 보아 `['aa','aa','a']` 라는 **원본보다 긴 결과**가 나옵니다. 겹치지 않는 처리는 정규식의 `re.finditer` 도 하는 일이고, 문자열 치환·패턴 매칭 전반에서 반복되는 실수입니다.\n💡 `['a','b','a','b']` 테스트가 두 번째 방어선입니다. 첫 병합 후 인덱스가 하나만 움직이면 두 번째 `'a','b'` 쌍의 시작점을 놓쳐 `['ab','b','ab']` 가 됩니다 — 개수는 그럴듯한데 내용이 틀린, 찾기 어려운 형태입니다.\n🔧 토크나이저를 이해하는 것이 실무에 직접 닿는 부분: 왜 한글이 영어보다 토큰을 많이 먹는지(학습 코퍼스에 한글 쌍이 적어 병합이 덜 일어남 → 비용과 컨텍스트 길이에 직결), 왜 숫자가 이상하게 쪼개져 산수를 틀리는지, 왜 `</w>` 같은 단어 경계 표시가 필요한지가 전부 이 병합 규칙에서 나옵니다." },

{ k:"겹치는 청킹", fn:"chunk_with_overlap", cat:"design",
  q:"검색용 문서 분할 <code>chunk_with_overlap(tokens, size, overlap)</code> 을 구현하세요. 길이 <code>size</code> 의 청크를 만들되 인접 청크가 <code>overlap</code> 만큼 <b>겹치게</b> 하고, 마지막 청크는 짧을 수 있습니다. <code>size</code> 가 0 이하거나 <code>overlap</code> 이 음수이거나 <code>overlap &gt;= size</code> 이면 <b>빈 리스트</b>를 돌려줍니다(전진하지 못해 무한 루프가 되기 때문입니다).",
  src:`def chunk_with_overlap(tokens, size, overlap):
    if size <= 0 or overlap < 0 or overlap >= size:
        return []
    out, i = [], 0
    n = len(tokens)
    while i < n:
        out.append(tokens[i:i + size])
        if i + size >= n:
            break
        # TODO: 겹침을 만들려면 얼마나 전진해야 하는가
        i += size
    return out`,
  sol:`def chunk_with_overlap(tokens, size, overlap):
    if size <= 0 or overlap < 0 or overlap >= size:
        return []
    out, i = [], 0
    n = len(tokens)
    while i < n:
        out.append(tokens[i:i + size])
        if i + size >= n:
            break
        i += size - overlap        # 겹치는 만큼 덜 전진한다
    return out`,
  tests:[
    ["chunk_with_overlap([1,2,3,4,5], 3, 1)","[[1, 2, 3], [3, 4, 5]]"],
    ["chunk_with_overlap([1,2,3,4,5], 2, 0)","[[1, 2], [3, 4], [5]]"],
    ["chunk_with_overlap([1,2,3], 3, 2)","[[1, 2, 3]]"],
    ["chunk_with_overlap([1,2,3], 2, 2)","[]"],
    ["chunk_with_overlap([], 3, 1)","[]"]],
  edge:[
    ["chunk_with_overlap([1,2,3], 0, 0)","[]"],
    ["len(chunk_with_overlap(list(range(100)), 10, 5))","19"]],
  ex:"🎯 겹침이 필요한 이유는 **의미가 경계에서 잘리기** 때문입니다. '이 약은 하루 세 번 / 복용하면 위험합니다' 가 두 청크로 나뉘면 어느 쪽을 검색해도 답을 얻을 수 없습니다. 겹침은 경계에 걸친 문장이 최소 한 청크 안에 온전히 들어갈 확률을 높입니다.\n⚠️ 구현의 함정은 **전진 폭**입니다. `i += size` 는 겹침을 만들지 않고(파라미터를 받아 놓고 쓰지 않는 셈), `i += overlap` 은 반대로 거의 전진하지 않아 청크가 폭발합니다. 두 경우 모두 결과가 '청크 목록' 이라 형태만 봐서는 통과합니다 — 마지막 edge 테스트가 개수를 세는 이유입니다.\n💡 `overlap >= size` 를 막는 가드가 실용적으로 중요합니다. 설정값을 외부에서 받는 코드에서 `size=200, overlap=200` 이 들어오면 전진 폭이 0 이 되어 **무한 루프로 메모리를 다 씁니다**. 이런 '설정 실수가 무한 루프가 되는' 지점에는 반드시 가드를 둡니다.\n🔧 실무에서는 토큰 수로만 자르지 않습니다 — 문단·문장 경계를 먼저 존중하고(recursive splitting), 청크마다 문서 제목·섹션 같은 맥락을 덧붙이며, 표와 코드 블록은 쪼개지 않습니다. 겹침의 대가는 **저장 비용과 중복 검색 결과**이므로 보통 10~20% 정도로 둡니다." },

/* ══ dl ══ */
{ k:"레이어 정규화", fn:"layer_norm", cat:"debug",
  q:"<code>layer_norm(xs, eps)</code> 를 구현하세요. 같은 샘플 안에서 평균 0, 분산 1 로 맞춥니다 — <code>(x − 평균) / sqrt(분산 + eps)</code> 이며 빈 입력은 <code>[]</code> 입니다. 아래 구현은 분모를 잘못 만들었습니다.",
  src:`def layer_norm(xs, eps):
    n = len(xs)
    if n == 0:
        return []
    mu = sum(xs) / n
    var = sum((x - mu) ** 2 for x in xs) / n
    # TODO: 표준편차로 나눠야 한다
    return [(x - mu) / (var + eps) for x in xs]`,
  sol:`def layer_norm(xs, eps):
    n = len(xs)
    if n == 0:
        return []
    mu = sum(xs) / n
    var = sum((x - mu) ** 2 for x in xs) / n
    denom = (var + eps) ** 0.5        # eps 는 제곱근 안에 들어간다
    return [(x - mu) / denom for x in xs]`,
  tests:[
    ["[round(v, 6) for v in layer_norm([1, 2, 3], 0.0)]","[-1.224745, 0.0, 1.224745]"],
    ["[round(v, 6) for v in layer_norm([1, 3], 0.0)]","[-1.0, 1.0]"],
    ["layer_norm([5, 5, 5], 1e-05)","[0.0, 0.0, 0.0]"],
    ["layer_norm([], 1e-05)","[]"],
    ["round(sum(layer_norm([1, 2, 3, 4], 0.0)), 6)","0.0"]],
  edge:[
    ["[round(v, 6) for v in layer_norm([0, 0, 3], 0.0)]","[-0.707107, -0.707107, 1.414214]"],
    ["round(sum(v * v for v in layer_norm([1, 2, 3, 10], 0.0)), 6)","4.0"]],
  ex:"🎯 정규화의 목적은 각 층의 입력 분포를 안정시켜 **깊은 신경망이 학습되게** 만드는 것입니다. 마지막 edge 테스트가 결과의 성질을 보여 줍니다 — 제곱의 합이 원소 개수와 같으므로 분산이 정확히 1 입니다.\n⚠️ 분산으로 나누는 것과 표준편차로 나누는 것은 **차원이 다릅니다**. 분산은 값의 제곱 단위라 스케일이 완전히 어긋나고, 값이 작으면(분산 0.01) 오히려 100배로 증폭됩니다. 그런데 첫 테스트를 `[5,5,5]` 같은 상수 입력으로만 하면 양쪽 다 `0.0` 을 내서 통과합니다 — **차이가 나는 입력을 테스트에 넣는 것**이 핵심입니다.\n💡 `eps` 의 위치도 중요합니다. `sqrt(var + eps)` 와 `sqrt(var) + eps` 는 다른 값이고, 전자만 분산이 0 일 때 분모를 안전하게 만듭니다(`sqrt(0 + 1e-5)`). 후자는 수학적으로도 의미가 불분명합니다.\n🔧 배치 정규화와의 차이가 LayerNorm 이 트랜스포머의 표준이 된 이유입니다: BatchNorm 은 **배치 안의 다른 샘플들**의 통계를 쓰므로 배치 크기에 민감하고 추론 시 이동 평균을 따로 관리해야 하며 시퀀스 길이가 다르면 곤란해집니다. LayerNorm 은 **한 샘플 안에서만** 계산하므로 배치 크기 1 에서도 같게 동작하고, 학습과 추론의 코드가 같습니다." },

{ k:"Adam 한 걸음", fn:"adam_step", cat:"debug",
  q:"<code>adam_step(w, g, m, v, t, lr, b1, b2, eps)</code> 를 완성하세요. <code>m ← b1·m + (1−b1)·g</code>, <code>v ← b2·v + (1−b2)·g²</code> 로 갱신한 뒤 <b>바이어스 보정</b> <code>m̂ = m/(1−b1ᵗ)</code>, <code>v̂ = v/(1−b2ᵗ)</code> 을 적용해 <code>w − lr·m̂/(√v̂ + eps)</code> 를 돌려줍니다. 반환은 <code>(w, m, v)</code> 입니다. 아래 구현은 초기 몇 스텝의 크기가 지나치게 작습니다.",
  src:`def adam_step(w, g, m, v, t, lr=0.001, b1=0.9, b2=0.999, eps=1e-08):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g * g
    # TODO: m 과 v 는 0 에서 시작하므로 초기에 과소평가된다
    return w - lr * m / (v ** 0.5 + eps), m, v`,
  sol:`def adam_step(w, g, m, v, t, lr=0.001, b1=0.9, b2=0.999, eps=1e-08):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g * g
    mh = m / (1 - b1 ** t)            # 바이어스 보정
    vh = v / (1 - b2 ** t)
    return w - lr * mh / (vh ** 0.5 + eps), m, v`,
  tests:[
    ["round(adam_step(1.0, 0.1, 0.0, 0.0, 1, 0.1)[0], 6)","0.9"],
    ["round(adam_step(1.0, 0.0, 0.0, 0.0, 1, 0.1)[0], 6)","1.0"],
    ["[round(x, 10) for x in adam_step(1.0, 0.1, 0.0, 0.0, 1, 0.1)[1:]]","[0.01, 1e-05]"],
    ["round(adam_step(1.0, 1e-08, 0.0, 0.0, 1, 0.1)[0], 6)","0.95"]],
  edge:[
    ["round(adam_step(1.0, -0.1, 0.0, 0.0, 1, 0.1)[0], 6)","1.1"],
    ["round(adam_step(0.0, 0.1, 0.01, 1e-05, 2, 0.1)[0], 6)","-0.1"]],
  ex:"🎯 Adam 의 첫 스텝 크기는 **기울기의 크기와 거의 무관하게 lr 에 가깝습니다** — 첫 테스트에서 기울기가 0.1 인데 걸음이 0.1(=lr)입니다. `m̂/√v̂` 가 대략 `g/|g|` = ±1 이 되기 때문이고, 이 '스케일 불변성' 이 Adam 이 학습률 조정을 덜 필요하게 만드는 이유입니다.\n⚠️ 바이어스 보정이 없으면 그 성질이 깨집니다. `m` 과 `v` 는 0 에서 시작하므로 첫 스텝의 `m` 은 실제 기울기의 10%, `v` 는 0.1% 뿐입니다 — 보정 없이 나누면 걸음이 lr 의 세 배가 되거나(√v 가 더 심하게 과소평가되어) 방향이 불안정해집니다. 첫 테스트에서 0.9 가 아니라 0.68 정도가 나옵니다.\n💡 네 번째 테스트가 `eps` 의 역할을 드러냅니다. 기울기가 `1e-8` 로 아주 작으면 `√v̂` 도 `1e-8` 이 되어 `eps` 와 같은 크기가 되고, 스텝이 lr 의 절반으로 줄어듭니다 — 즉 `eps` 는 '0으로 나누기 방지' 만이 아니라 **아주 작은 기울기에서 걸음을 억제하는 문턱**입니다. 그래서 `eps` 를 키우면 Adam 이 SGD 처럼 동작합니다.\n🔧 `t` 를 인자로 받는 이유도 여기 있습니다 — 옵티마이저는 **스텝 수를 상태로** 들고 있어야 하고, 체크포인트에서 재개할 때 이 값을 복원하지 않으면 학습이 다시 '첫 스텝' 처럼 굴어 손실이 튑니다. 옵티마이저 상태(`m`, `v`, `t`)를 함께 저장해야 하는 실무적 이유입니다." },

{ k:"워밍업과 코사인 감쇠", fn:"lr_schedule", cat:"internals",
  q:"<code>lr_schedule(step, warmup, total, base)</code> 를 구현하세요. <code>step &lt; warmup</code> 이면 <b>선형 워밍업</b>(<code>base·step/warmup</code>), 그 뒤로는 <b>코사인 감쇠</b> <code>base·0.5·(1+cos(π·진행률))</code> 이며 진행률은 <code>(step−warmup)/max(1, total−warmup)</code> 입니다. <code>step</code> 이 음수거나 <code>total</code> 이 0 이하거나 <code>step &gt;= total</code> 이면 <code>0.0</code> 입니다.",
  src:`def lr_schedule(step, warmup, total, base):
    import math
    if step < 0 or total <= 0:
        return 0.0
    if step >= total:
        return 0.0
    # TODO: 워밍업 구간이 없다 — 처음부터 최대 학습률로 시작한다
    prog = (step - warmup) / max(1, total - warmup)
    return base * 0.5 * (1 + math.cos(math.pi * prog))`,
  sol:`def lr_schedule(step, warmup, total, base):
    import math
    if step < 0 or total <= 0:
        return 0.0
    if warmup > 0 and step < warmup:
        return base * step / warmup      # 선형 워밍업
    if step >= total:
        return 0.0
    prog = (step - warmup) / max(1, total - warmup)
    return base * 0.5 * (1 + math.cos(math.pi * prog))`,
  tests:[
    ["round(lr_schedule(0, 100, 1000, 0.1), 6)","0.0"],
    ["round(lr_schedule(50, 100, 1000, 0.1), 6)","0.05"],
    ["round(lr_schedule(100, 100, 1000, 0.1), 6)","0.1"],
    ["round(lr_schedule(550, 100, 1000, 0.1), 6)","0.05"],
    ["round(lr_schedule(1000, 100, 1000, 0.1), 6)","0.0"]],
  edge:[
    ["round(lr_schedule(-1, 100, 1000, 0.1), 6)","0.0"],
    ["round(lr_schedule(100, 0, 1000, 0.1), 6)","0.097553"]],
  ex:"🎯 학습률 스케줄은 **두 구간이 정반대의 이유로 필요**합니다. 초반의 워밍업은 아직 통계가 없는 옵티마이저 상태(Adam 의 `v`)와 무작위 초기화된 가중치를 보호합니다 — 처음부터 큰 걸음을 걸으면 손실이 발산하거나 나쁜 지역해에 갇힙니다. 후반의 감쇠는 최소점 근처에서 걸음을 줄여 진동하지 않게 합니다.\n💡 코사인 감쇠가 선형보다 널리 쓰이는 이유는 **초반에 천천히, 중반에 빠르게, 끝에서 다시 천천히** 줄기 때문입니다. 마지막 구간에서 학습률이 거의 0 에 가까워지며 오래 머무는 것이 미세 조정 효과를 냅니다.\n⚠️ 워밍업을 빼먹으면 `step=0` 에서 최대 학습률로 시작합니다(두 번째 테스트에서 0.05 대신 0.1). 트랜스포머 학습에서 이것이 발산의 가장 흔한 원인이고, '왜 원 논문 하이퍼파라미터로는 학습이 안 되지' 의 답이 대개 여기입니다.\n🔧 경계 처리도 실무적입니다. `max(1, total - warmup)` 은 `warmup == total` 인 잘못된 설정에서 0으로 나누기를 막고, `step >= total` 에서 0을 돌려주는 것은 스케줄을 넘긴 스텝(재개·에폭 계산 오류)이 **음수 학습률**을 만들지 않게 합니다 — 음수 학습률은 경사 상승이라 모델을 조용히 망칩니다." },

{ k:"인버티드 드롭아웃", fn:"dropout_scale", cat:"debug",
  q:"<code>dropout_scale(xs, mask, p)</code> 를 구현하세요. <code>mask</code> 는 유지할 위치가 1, 버릴 위치가 0 이며, 남은 값에 <b><code>1/(1−p)</code> 를 곱해</b> 기댓값을 보존합니다. <code>p</code> 가 0 이하면 원본을 float 로, 1 이상이면 전부 <code>0.0</code> 입니다. 아래 구현은 학습과 추론의 값 크기를 어긋나게 만듭니다.",
  src:`def dropout_scale(xs, mask, p):
    if p >= 1.0:
        return [0.0] * len(xs)
    if p <= 0.0:
        return [float(x) for x in xs]
    # TODO: 절반을 껐으면 남은 값은 얼마여야 하는가
    return [float(x) * m for x, m in zip(xs, mask)]`,
  sol:`def dropout_scale(xs, mask, p):
    if p >= 1.0:
        return [0.0] * len(xs)
    if p <= 0.0:
        return [float(x) for x in xs]
    scale = 1.0 / (1.0 - p)        # 남은 값을 키워 기댓값을 유지한다
    return [float(x) * m * scale for x, m in zip(xs, mask)]`,
  tests:[
    ["[round(v, 6) for v in dropout_scale([1, 1, 1, 1], [1, 0, 1, 0], 0.5)]","[2.0, 0.0, 2.0, 0.0]"],
    ["round(sum(dropout_scale([1, 1, 1, 1], [1, 0, 1, 0], 0.5)), 6)","4.0"],
    ["[round(v, 6) for v in dropout_scale([2, 4], [1, 1], 0.0)]","[2.0, 4.0]"],
    ["dropout_scale([1, 2], [1, 1], 1.0)","[0.0, 0.0]"],
    ["dropout_scale([], [], 0.5)","[]"]],
  edge:[
    ["[round(v, 6) for v in dropout_scale([1, 1, 1, 1, 1], [1, 1, 1, 1, 0], 0.2)]","[1.25, 1.25, 1.25, 1.25, 0.0]"],
    ["[round(v, 6) for v in dropout_scale([3], [0], 0.5)]","[0.0]"]],
  ex:"🎯 드롭아웃의 핵심 계약은 '**학습과 추론의 출력 기댓값이 같아야 한다**' 입니다. 두 번째 테스트가 그것을 확인합니다 — 절반을 껐는데도 합이 원본과 같은 4.0 입니다. 남은 값을 2배로 키웠기 때문입니다.\n⚠️ 스케일링을 빼먹으면 학습 시 활성값이 추론 시의 절반이 됩니다. 그러면 **학습된 가중치가 그 절반 크기에 맞춰지므로**, 추론에서 값이 두 배로 들어와 출력이 완전히 어긋납니다. 손실은 잘 떨어지는데 추론 성능만 나쁜, 가장 찾기 어려운 부류의 버그입니다.\n💡 그래서 '인버티드(inverted)' 드롭아웃입니다 — 원래 방식은 추론 시에 `(1−p)` 를 곱했지만, 학습 시에 나누는 쪽으로 뒤집으면 **추론 코드에 드롭아웃 관련 처리가 전혀 없어집니다**. 배포 경로를 단순하게 유지하는 것이 이 설계의 실용적 이득입니다.\n🔧 여기서 나오는 실무 규칙이 `model.eval()` 입니다 — 추론에서 드롭아웃을 끄지 않으면 같은 입력에 매번 다른 출력이 나옵니다. 반대로 학습에서 `eval()` 상태를 풀지 않으면 정규화가 전혀 걸리지 않아 과적합합니다. BatchNorm 도 같은 스위치에 묶여 있어서, 이 한 줄을 빠뜨리는 것이 프레임워크 사용의 대표적 사고입니다." },

{ k:"어텐션 가중치와 스케일", fn:"attention_weights", cat:"internals",
  q:"<code>attention_weights(q, K)</code> 를 구현하세요. 각 키와의 <b>내적을 <code>√d</code> 로 나눈 뒤</b>(<code>d</code> 는 <code>q</code> 의 길이) softmax 를 적용해 가중치를 돌려줍니다. <code>K</code> 가 비면 <code>[]</code>, <code>d</code> 가 0 이면 나누지 않습니다. softmax 는 수치 안정하게(최댓값을 빼고) 계산하세요.",
  src:`def attention_weights(q, K):
    import math
    if not K:
        return []
    # TODO: 내적을 그대로 쓰면 차원이 커질수록 분포가 뾰족해진다
    raw = [sum(a * b for a, b in zip(q, k)) for k in K]
    m = max(raw)
    exps = [math.exp(r - m) for r in raw]
    s = sum(exps)
    return [e / s for e in exps]`,
  sol:`def attention_weights(q, K):
    import math
    if not K:
        return []
    d = len(q)
    scale = math.sqrt(d) if d else 1.0
    raw = [sum(a * b for a, b in zip(q, k)) / scale for k in K]
    m = max(raw)
    exps = [math.exp(r - m) for r in raw]
    s = sum(exps)
    return [e / s for e in exps]`,
  tests:[
    ["[round(v, 6) for v in attention_weights([1, 1, 1, 1], [[1, 1, 1, 1], [0, 0, 0, 0]])]","[0.880797, 0.119203]"],
    ["[round(v, 6) for v in attention_weights([1, 1], [[1, 1], [1, 1]])]","[0.5, 0.5]"],
    ["round(sum(attention_weights([1, 2], [[1, 0], [0, 1], [1, 1]])), 6)","1.0"],
    ["attention_weights([1, 0], [])","[]"],
    ["attention_weights([1, 0], [[1, 0], [0, 1]])[0] > attention_weights([1, 0], [[1, 0], [0, 1]])[1]","True"]],
  edge:[
    ["[round(v, 6) for v in attention_weights([], [[], []])]","[0.5, 0.5]"],
    ["[round(v, 6) for v in attention_weights([1000, 1000], [[1000, 1000], [0, 0]])]","[1.0, 0.0]"]],
  ex:"🎯 `√d` 로 나누는 이유는 **차원이 커질수록 내적의 분산이 커지기** 때문입니다. 각 성분이 독립이고 분산 1 이면 내적의 분산은 `d` 이므로, 표준편차 `√d` 로 나눠 스케일을 되돌립니다. 이것이 '**Scaled** Dot-Product Attention' 의 스케일입니다.\n⚠️ 나누지 않으면 로짓의 차이가 벌어져 softmax 가 **거의 원-핫이 됩니다**. 첫 테스트에서 스케일이 있으면 0.88/0.12 로 두 키를 모두 조금씩 보지만, 없으면 0.98/0.02 가 되어 사실상 하나만 봅니다. 그리고 뾰족한 softmax 의 기울기는 0 에 가까워 **학습이 진행되지 않습니다** — 성능이 안 나오는데 손실 곡선은 평평한 형태로 나타납니다.\n💡 마지막 edge 테스트가 극단을 보여 줍니다 — 값이 아주 크면 스케일이 있어도 완전한 원-핫이 됩니다. 그래서 실전에서는 스케일 외에 가중치 초기화와 정규화로 로짓의 크기 자체를 관리합니다.\n🔧 이 함수에 두 가지를 더하면 실제 어텐션이 됩니다: **마스킹**(미래 토큰이나 패딩 위치의 로짓을 `-inf` 로 두어 softmax 후 0 이 되게 하는 것 — 여기서 `-inf` 대신 큰 음수를 쓰면 완전히 0 이 되지 않아 정보가 누수됩니다), 그리고 가중치를 값(V)에 곱해 더하는 단계입니다." },

{ k:"1차원 합성곱", fn:"conv1d", cat:"internals",
  q:"<code>conv1d(xs, kernel, stride, padding)</code> 을 구현하세요. 입력 양쪽에 <code>padding</code> 개의 0을 붙이고, 커널을 <code>stride</code> 만큼 옮기며 <b>커널이 완전히 들어가는 위치에서만</b> 내적을 계산해 목록으로 돌려줍니다. <code>stride</code> 가 1 미만이거나 <code>padding</code> 이 음수이거나 커널이 비면 <code>[]</code> 입니다.",
  src:`def conv1d(xs, kernel, stride=1, padding=0):
    if stride < 1 or padding < 0 or not kernel:
        return []
    # TODO: 패딩을 붙이지 않았다
    a = list(xs)
    k = len(kernel)
    out, i = [], 0
    while i + k <= len(a):
        out.append(sum(a[i + j] * kernel[j] for j in range(k)))
        i += stride
    return out`,
  sol:`def conv1d(xs, kernel, stride=1, padding=0):
    if stride < 1 or padding < 0 or not kernel:
        return []
    pad = [0] * padding
    a = pad + list(xs) + pad
    k = len(kernel)
    out, i = [], 0
    while i + k <= len(a):
        out.append(sum(a[i + j] * kernel[j] for j in range(k)))
        i += stride
    return out`,
  tests:[
    ["conv1d([1,2,3,4], [1,1], 1, 0)","[3, 5, 7]"],
    ["conv1d([1,2,3,4], [1,1], 2, 0)","[3, 7]"],
    ["conv1d([1,2,3], [1,0,-1], 1, 1)","[-2, -2, 2]"],
    ["len(conv1d(list(range(10)), [1,1,1], 2, 1))","5"],
    ["conv1d([1,2], [], 1, 0)","[]"]],
  edge:[
    ["conv1d([1,2,3], [1], 1, 0)","[1, 2, 3]"],
    ["conv1d([], [1,1], 1, 0)","[]"],
    ["conv1d([1,2,3], [1,1], 0, 0)","[]"]],
  ex:"🎯 출력 길이 공식 `⌊(n + 2p − k)/s⌋ + 1` 을 외우는 것보다 **커널이 완전히 들어가는 위치를 세는 것**으로 이해하는 편이 오래 남습니다. 네 번째 테스트가 그 계산을 확인합니다: 입력 10, 패딩 1 → 길이 12, 커널 3, 스트라이드 2 → 시작 위치 0·2·4·6·8 → 5개.\n💡 세 번째 테스트의 커널 `[1, 0, -1]` 은 **에지 검출기**입니다. 값이 급변하는 곳에서 큰 값이 나오고 평탄한 곳에서 0 이 나옵니다 — CNN 이 학습으로 찾아내는 첫 층 필터가 대체로 이런 모양이라는 것이 시각화로 확인된 사실입니다.\n⚠️ 패딩을 빼먹으면 **출력이 입력보다 짧아집니다**. 층을 쌓을 때마다 조금씩 줄어들어 깊은 네트워크에서는 공간 차원이 사라지고, 무엇보다 **경계 픽셀이 중앙보다 적게 관여**해 이미지 테두리 정보가 소실됩니다. 그래서 `padding=(k-1)//2` 로 크기를 유지하는 것(same padding)이 기본 관례입니다.\n🔧 그리고 여기서 구현한 것은 엄밀히는 **상호상관(cross-correlation)** 입니다 — 수학적 합성곱은 커널을 뒤집어 적용합니다. 딥러닝 프레임워크는 전부 뒤집지 않는 쪽을 쓰는데, 커널을 학습으로 배우므로 뒤집힌 버전을 배우면 되고 결과가 같기 때문입니다. 이름만 관례적으로 '합성곱' 을 씁니다." },

];
