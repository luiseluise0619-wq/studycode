/* ML·모델 평가 실행형 12문항 — 순수 파이썬만 쓴다(Pyodide 에서 오프라인으로 돈다).
   지표와 분할은 '공식을 아는 것' 과 '경계에서 맞게 만드는 것' 이 완전히 다르다.
   앞 6문항은 ml, 뒤 6문항은 mleval 트랙으로 간다. */

module.exports=[

/* ══ ml ══ */
{ k:"그룹 누수 없는 분할", fn:"group_holdout", cat:"debug",
  q:"같은 환자·같은 사용자의 데이터가 학습과 평가에 <b>동시에 들어가면</b> 점수가 부풀려집니다. <code>group_holdout(groups, holdout)</code> 은 <code>groups[i]</code> 가 <code>holdout</code> 집합에 속하면 인덱스 <code>i</code> 를 test 로, 아니면 train 으로 보내 <code>(train, test)</code> 를 돌려줍니다(각 리스트는 오름차순). 아래 구현은 그룹을 보지 않습니다 — 고치세요.",
  src:`def group_holdout(groups, holdout):
    n = len(groups)
    cut = int(n * 0.8)
    # TODO: 인덱스 비율로 자르면 같은 그룹이 양쪽에 걸친다
    return list(range(cut)), list(range(cut, n))`,
  sol:`def group_holdout(groups, holdout):
    train, test = [], []
    for i, g in enumerate(groups):
        (test if g in holdout else train).append(i)
    return train, test`,
  tests:[
    ["group_holdout(['a','a','b','c','b'], {'b'})","([0, 1, 3], [2, 4])"],
    ["group_holdout(['x'], set())","([0], [])"],
    ["group_holdout(['x','y'], {'x','y'})","([], [0, 1])"],
    ["set('aabcb'[i] for i in group_holdout(list('aabcb'), {'b'})[0]) & set('aabcb'[i] for i in group_holdout(list('aabcb'), {'b'})[1])","set()"]],
  edge:[
    ["group_holdout([], {'a'})","([], [])"],
    ["group_holdout(['a','a'], {'b'})","([0, 1], [])"]],
  ex:"🎯 데이터 누수는 **점수를 올리면서 모델을 나쁘게 만드는** 유일한 종류의 버그입니다. 같은 환자의 다른 촬영본, 같은 사용자의 다른 세션이 양쪽에 들어가면 모델은 '그 개체를 외우는 것' 으로 정답을 맞히고, 배포 후 처음 보는 개체에서 성능이 무너집니다.\n💡 그래서 분할의 단위는 **행이 아니라 그룹**이어야 합니다 — scikit-learn 의 `GroupKFold`·`GroupShuffleSplit` 이 정확히 이 일을 합니다. 시계열이라면 그룹 대신 **시간**이 단위가 되고(미래로 과거를 예측하지 않도록), 그때는 `TimeSeriesSplit` 입니다.\n⚠️ 네 번째 테스트가 이 문항의 핵심입니다 — 반환값이 맞는지가 아니라 **양쪽 그룹 집합의 교집합이 비어 있는지**를 봅니다. 누수는 결과 형태가 정상이라 눈으로는 보이지 않으므로, 이런 불변식을 테스트로 박아 두는 것이 유일한 방어입니다.\n🔧 실무 점검법: 분할 후 `set(train_groups) & set(test_groups)` 를 단정하는 테스트를 파이프라인에 넣으세요. 전처리(스케일러·인코더·타깃 인코딩)를 분할 **전에** 적용하는 것도 같은 부류의 누수입니다." },

{ k:"표준화는 학습셋에서만 배운다", fn:"standardize", cat:"debug",
  q:"<code>standardize(train, test)</code> 는 <b>train 의 평균과 표준편차만</b> 써서 두 리스트를 표준화한 <code>(train_z, test_z)</code> 를 돌려줍니다. 표준편차가 0이면 해당 값은 모두 <code>0.0</code>, train 이 비어 있으면 test 도 전부 <code>0.0</code> 입니다. 아래 구현은 통계를 잘못된 곳에서 구합니다.",
  src:`def standardize(train, test):
    both = list(train) + list(test)
    n = len(both)
    if n == 0:
        return [], []
    mu = sum(both) / n
    sd = (sum((x - mu) ** 2 for x in both) / n) ** 0.5
    # TODO: 평가셋의 정보를 끌어다 쓰고 있다
    if sd == 0:
        return [0.0] * len(train), [0.0] * len(test)
    return ([(x - mu) / sd for x in train], [(x - mu) / sd for x in test])`,
  sol:`def standardize(train, test):
    n = len(train)
    if n == 0:
        return [], [0.0] * len(test)
    mu = sum(train) / n
    sd = (sum((x - mu) ** 2 for x in train) / n) ** 0.5
    if sd == 0:
        return [0.0] * n, [0.0] * len(test)
    return ([(x - mu) / sd for x in train], [(x - mu) / sd for x in test])`,
  tests:[
    ["[round(v, 6) for v in standardize([1, 2, 3], [4])[0]]","[-1.224745, 0.0, 1.224745]"],
    ["[round(v, 6) for v in standardize([1, 2, 3], [4])[1]]","[2.44949]"],
    ["standardize([5, 5, 5], [9])","([0.0, 0.0, 0.0], [0.0])"],
    ["standardize([], [1, 2])","([], [0.0, 0.0])"]],
  edge:[
    ["standardize([1, 2, 3], [])","([-1.224744871391589, 0.0, 1.224744871391589], [])"],
    ["[round(v, 6) for v in standardize([0, 10], [5])[1]]","[0.0]"]],
  ex:"🎯 전처리도 **모델의 일부**입니다. 평균·표준편차·최소최대·어휘 사전·타깃 인코딩은 모두 데이터에서 '배우는' 값이라, 평가셋을 섞어 계산하면 그 순간 평가셋의 정보가 학습에 흘러듭니다. 이 누수는 교차검증 점수를 조금 올려서 **더 나쁜 모델을 고르게** 만듭니다.\n💡 그래서 scikit-learn 은 `fit`(배우기)과 `transform`(적용하기)을 분리하고, `Pipeline` 으로 묶어 교차검증의 각 폴드에서 `fit` 이 **학습 폴드에만** 적용되도록 만듭니다. `fit_transform` 을 전체 데이터에 한 번 부르는 코드가 보이면 그것이 신호입니다.\n⚠️ 표준편차 0 가드를 빼면 상수 열에서 `ZeroDivisionError` 가 납니다. 상수 열은 실무에서 흔하고(수집이 중단된 센서, 전부 같은 값인 플래그), 여기서 죽으면 배치가 통째로 멈춥니다 — 0으로 두는 것이 관례입니다.\n🔧 train 이 비었을 때 test 를 `0.0` 으로 두는 것은 '아는 것이 없으면 중심값' 이라는 규칙입니다. 어느 쪽이든 **동작을 정하고 테스트로 못 박는 것**이 요점입니다." },

{ k:"k-폴드 인덱스와 나머지 분배", fn:"kfold_indices", cat:"internals",
  q:"<code>kfold_indices(n, k)</code> 를 구현하세요. <code>0..n-1</code> 을 <b>연속된 k개 폴드</b>로 나누고, 나누어 떨어지지 않는 나머지는 <b>앞쪽 폴드가 하나씩 더</b> 가집니다. <code>k</code> 가 1 미만이거나 <code>n</code> 보다 크면 빈 리스트를 돌려줍니다.",
  src:`def kfold_indices(n, k):
    # TODO: 나머지를 버리지 말고 앞쪽 폴드에 분배해야 한다
    size = n // k if k else 0
    return [list(range(i * size, (i + 1) * size)) for i in range(k)]`,
  sol:`def kfold_indices(n, k):
    if k < 1 or k > n:
        return []
    base, rem = divmod(n, k)
    out, start = [], 0
    for i in range(k):
        size = base + (1 if i < rem else 0)
        out.append(list(range(start, start + size)))
        start += size
    return out`,
  tests:[
    ["kfold_indices(10, 3)","[[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]]"],
    ["kfold_indices(6, 3)","[[0, 1], [2, 3], [4, 5]]"],
    ["sum(len(f) for f in kfold_indices(97, 7))","97"],
    ["kfold_indices(7, 2)","[[0, 1, 2, 3], [4, 5, 6]]"],
    ["kfold_indices(3, 5)","[]"]],
  edge:[
    ["kfold_indices(1, 1)","[[0]]"],
    ["kfold_indices(5, 0)","[]"],
    ["sorted(i for f in kfold_indices(11, 4) for i in f)","list(range(11))"]],
  ex:"🎯 이 문항의 진짜 요구사항은 세 번째·여덟 번째 테스트입니다 — **모든 인덱스가 정확히 한 번씩 나타나야** 합니다. 나머지를 버리는 구현은 형태가 그럴듯해 보이지만 `n=97, k=7` 에서 4개 샘플을 조용히 잃고, 그만큼 평가에서 빠집니다.\n💡 `divmod(n, k)` 로 몫과 나머지를 한 번에 받아 '앞쪽 폴드에 하나씩' 나누는 것이 표준 관용구입니다. scikit-learn 의 `KFold` 도 정확히 이 규칙을 씁니다.\n⚠️ 여기서는 연속 구간으로 잘랐지만, 실제 데이터가 클래스나 시간 순으로 정렬되어 있으면 폴드마다 분포가 완전히 달라집니다 — 그래서 실무 기본값은 **셔플 + 계층화**(`StratifiedKFold`)이고, 재현을 위해 시드를 고정합니다.\n🔧 `k > n` 을 빈 리스트로 처리한 것도 계약입니다. 샘플보다 폴드가 많은 상황은 대개 상위 코드의 버그이므로, 조용히 빈 폴드를 만들어 넘기지 않고 **드러나게** 하는 편이 낫습니다." },

{ k:"경사 하강 한 걸음", fn:"sgd_step", cat:"debug",
  q:"단순 선형회귀 <code>ŷ = w·x + b</code> 의 MSE 를 줄이는 <b>한 걸음</b>을 계산하는 <code>sgd_step(w, b, xs, ys, lr)</code> 입니다. 기울기는 <code>∂/∂w = mean(2(ŷ−y)x)</code>, <code>∂/∂b = mean(2(ŷ−y))</code> 이고 갱신은 <code>값 − lr·기울기</code> 입니다. 데이터가 없으면 <code>(w, b)</code> 를 그대로 돌려줍니다. 아래 구현은 한 걸음마다 손실이 <b>커집니다</b>.",
  src:`def sgd_step(w, b, xs, ys, lr):
    n = len(xs)
    if n == 0:
        return w, b
    dw = sum(2 * (y - (w * x + b)) * x for x, y in zip(xs, ys)) / n
    db = sum(2 * (y - (w * x + b)) for x, y in zip(xs, ys)) / n
    # TODO: 기울기의 부호가 맞는가?
    return w - lr * dw, b - lr * db`,
  sol:`def sgd_step(w, b, xs, ys, lr):
    n = len(xs)
    if n == 0:
        return w, b
    dw = sum(2 * ((w * x + b) - y) * x for x, y in zip(xs, ys)) / n
    db = sum(2 * ((w * x + b) - y) for x, y in zip(xs, ys)) / n
    return w - lr * dw, b - lr * db`,
  tests:[
    ["tuple(round(v, 6) for v in sgd_step(0, 0, [1, 2], [2, 4], 0.1))","(1.0, 0.6)"],
    ["tuple(round(v, 6) for v in sgd_step(2, 0, [1, 2], [2, 4], 0.1))","(2.0, 0.0)"],
    ["sgd_step(1, 2, [], [], 0.5)","(1, 2)"],
    ["tuple(round(v, 6) for v in sgd_step(1, 1, [1], [0], 0.0))","(1.0, 1.0)"]],
  edge:[
    ["tuple(round(v, 6) for v in sgd_step(0, 0, [1], [1], 0.5))","(1.0, 1.0)"],
    ["round(sgd_step(0, 0, [1, 2], [2, 4], 0.1)[0], 6) > 0","True"]],
  ex:"🎯 기울기는 '**손실이 커지는 방향**' 을 가리키므로, 줄이려면 그 반대로 가야 합니다 — 그래서 `값 − lr·기울기` 입니다. 오차를 `(y − ŷ)` 로 쓰면 기울기 부호가 뒤집혀 `값 + lr·기울기` 가 되고, 이는 **경사 상승**이라 손실이 매 걸음 커집니다.\n⚠️ 이 버그는 조용하지 않지만 원인을 오해하기 쉽습니다. 손실이 발산하면 대개 학습률을 의심해 낮추는데, 부호가 틀렸다면 학습률을 낮춰도 **느리게 발산**할 뿐입니다. 두 번째 테스트가 최적점(w=2, b=0)에서 움직이지 않는지 확인하는 이유이고, 마지막 edge 테스트는 **방향 자체**를 봅니다.\n💡 `lr=0` 테스트도 의미가 있습니다 — 갱신식이 `w − 0·dw` 이므로 값이 그대로여야 하는데, 부호나 항을 잘못 쓰면 여기서도 어긋납니다. 이런 '아무 일도 일어나지 않아야 하는' 테스트가 의외로 많은 버그를 잡습니다.\n🔧 실무에서는 구현한 기울기를 **수치 미분과 비교**(gradient checking)해 검증합니다: `(L(w+ε) − L(w−ε)) / 2ε` 와 해석적 기울기가 소수점 몇 자리까지 맞는지 보는 것으로, 부호 오류는 그 자리에서 드러납니다." },

{ k:"최소최대 정규화와 상수 열", fn:"min_max_scale", cat:"debug",
  q:"<code>min_max_scale(xs)</code> 는 각 값을 <code>(x − min) / (max − min)</code> 으로 [0, 1] 범위로 옮깁니다. <b>모든 값이 같으면</b> 전부 <code>0.0</code>, 빈 리스트는 <code>[]</code> 를 돌려줍니다. 아래 구현은 실제 데이터에서 배치를 멈추게 합니다.",
  src:`def min_max_scale(xs):
    if not xs:
        return []
    lo, hi = min(xs), max(xs)
    # TODO: lo == hi 인 경우가 실제로 온다
    return [(x - lo) / (hi - lo) for x in xs]`,
  sol:`def min_max_scale(xs):
    if not xs:
        return []
    lo, hi = min(xs), max(xs)
    if hi == lo:
        return [0.0] * len(xs)
    return [(x - lo) / (hi - lo) for x in xs]`,
  tests:[
    ["[round(v, 6) for v in min_max_scale([2, 4, 6])]","[0.0, 0.5, 1.0]"],
    ["min_max_scale([5, 5, 5])","[0.0, 0.0, 0.0]"],
    ["min_max_scale([])","[]"],
    ["[round(v, 6) for v in min_max_scale([-1, 0, 1])]","[0.0, 0.5, 1.0]"]],
  edge:[
    ["min_max_scale([3])","[0.0]"],
    ["[round(v, 6) for v in min_max_scale([10, 0])]","[1.0, 0.0]"]],
  ex:"🎯 상수 열은 예외 상황이 아니라 **평범한 현실**입니다 — 고장 나 같은 값만 보내는 센서, 아직 아무도 켜지 않은 기능 플래그, 특정 기간에만 값이 있는 컬럼. 가드가 없으면 `ZeroDivisionError` 로 파이프라인 전체가 멈추고, 원인은 스택 트레이스만 봐서는 '어느 컬럼인지' 알 수 없습니다.\n💡 값 하나짜리 리스트(`[3]`)도 같은 경우입니다 — min == max 이므로 상수 열과 동일하게 처리됩니다. 이 edge 테스트가 가드의 존재를 직접 확인합니다.\n⚠️ 최소최대 정규화는 **이상치에 극도로 약합니다**. 값 하나가 10,000 이면 나머지 전부가 0 근처로 눌려 정보가 사라집니다. 그래서 이상치가 있는 데이터에는 표준화나 `RobustScaler`(중앙값·사분위 범위 기준)가 낫고, 최소최대는 **범위가 정해진 값**(픽셀 0~255, 비율 0~1)에 잘 맞습니다.\n🔧 그리고 이 스케일러도 **학습셋에서만 min/max 를 배워야** 합니다. 평가셋의 값이 그 범위를 벗어나 0~1 밖으로 나가는 것은 정상이며, 억지로 자르면(clip) 그것 자체가 정보 손실입니다." },

{ k:"불균형 클래스 가중치", fn:"class_weights", cat:"internals",
  q:"불균형 데이터의 손실 가중치를 계산하는 <code>class_weights(labels)</code> 를 구현하세요. 클래스 <code>c</code> 의 가중치는 <code>n / (k · count[c])</code> 이며 <code>n</code> 은 전체 개수, <code>k</code> 는 클래스 종류 수입니다. 반환은 <b>키를 정렬한</b> dict 이고, 빈 입력은 <code>{}</code> 입니다.",
  src:`def class_weights(labels):
    counts = {}
    for y in labels:
        counts[y] = counts.get(y, 0) + 1
    # TODO: 정규화가 빠졌다 — 가중치의 기준이 없다
    return {c: 1 / n for c, n in sorted(counts.items())}`,
  sol:`def class_weights(labels):
    counts = {}
    for y in labels:
        counts[y] = counts.get(y, 0) + 1
    if not counts:
        return {}
    total, k = len(labels), len(counts)
    return {c: total / (k * counts[c]) for c in sorted(counts)}`,
  tests:[
    ["{c: round(w, 6) for c, w in class_weights([0, 0, 0, 1]).items()}","{0: 0.666667, 1: 2.0}"],
    ["class_weights([0, 1])","{0: 1.0, 1: 1.0}"],
    ["class_weights([7, 7])","{7: 1.0}"],
    ["class_weights([])","{}"],
    ["list(class_weights(['b', 'a', 'a']).keys())","['a', 'b']"]],
  edge:[
    ["round(sum(class_weights([0, 0, 0, 1])[y] for y in [0, 0, 0, 1]), 6)","4.0"],
    ["{c: round(w, 6) for c, w in class_weights([1, 1, 1, 1, 0]).items()}","{0: 2.5, 1: 0.625}"]],
  ex:"🎯 `n / (k · count[c])` 라는 식의 의미는 **'모든 클래스가 전체의 1/k 만큼 기여하게 만든다'** 입니다. 첫 edge 테스트가 그것을 보여 줍니다 — 가중치를 모든 샘플에 곱해 더하면 정확히 `n` 이 되어, 클래스별 총 기여가 균등해집니다. scikit-learn 의 `class_weight='balanced'` 가 쓰는 공식입니다.\n💡 `1/count` 만 쓰면 비율은 같지만 **손실의 절대 크기가 데이터 크기에 따라 달라져** 학습률을 함께 조정해야 합니다. 정규화 항이 있어야 같은 학습률로 균형·불균형 데이터를 다룰 수 있습니다.\n⚠️ 가중치는 만능이 아닙니다. 소수 클래스가 30건뿐이면 가중치를 100배 줘도 **없는 정보가 생기지는 않고**, 그 30건에 과적합할 뿐입니다. 그때는 데이터를 더 모으거나, 문제를 이상 탐지로 재정의하거나, 임계값을 조정하는 쪽이 낫습니다.\n🔧 그리고 가중치를 바꾸면 **모델의 확률 출력이 왜곡됩니다** — 실제 발생률과 예측 확률이 어긋나므로, 확률 값을 그대로 쓰는 시스템(기대값 계산, 임계값 정책)에서는 사후 보정(calibration)이 필요합니다." },

/* ══ mleval ══ */
{ k:"정밀도·재현율·F1 의 0 분모", fn:"prf1", cat:"debug",
  q:"<code>prf1(y_true, y_pred)</code> 는 이진 분류의 <code>(정밀도, 재현율, F1)</code> 을 돌려줍니다(라벨은 0/1). <b>분모가 0이면 그 지표를 <code>0.0</code></b> 으로 둡니다. 아래 구현은 모델이 아무것도 양성으로 예측하지 않는 순간 죽습니다 — 학습 초기와 극단적 불균형에서 반드시 일어나는 일입니다.",
  src:`def prf1(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    # TODO: tp + fp 가 0 이면? tp + fn 이 0 이면?
    prec = tp / (tp + fp)
    rec = tp / (tp + fn)
    return prec, rec, 2 * prec * rec / (prec + rec)`,
  sol:`def prf1(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    prec = tp / (tp + fp) if tp + fp else 0.0
    rec = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
    return prec, rec, f1`,
  tests:[
    ["tuple(round(v, 6) for v in prf1([1, 1, 0, 0], [1, 0, 1, 0]))","(0.5, 0.5, 0.5)"],
    ["prf1([1, 1], [0, 0])","(0.0, 0.0, 0.0)"],
    ["tuple(round(v, 6) for v in prf1([1, 0], [1, 0]))","(1.0, 1.0, 1.0)"],
    ["tuple(round(v, 6) for v in prf1([1, 1, 1, 0], [1, 0, 0, 0]))","(1.0, 0.333333, 0.5)"]],
  edge:[
    ["prf1([], [])","(0.0, 0.0, 0.0)"],
    ["prf1([0, 0], [0, 0])","(0.0, 0.0, 0.0)"],
    ["tuple(round(v, 6) for v in prf1([0, 0], [1, 1]))","(0.0, 0.0, 0.0)"]],
  edgeNote:"",
  ex:"🎯 세 지표 모두 분모가 0이 되는 상황이 **정상적으로** 발생합니다. 아무것도 양성으로 예측하지 않으면 정밀도의 분모가 0(맞힐 기회가 없었음), 실제 양성이 하나도 없으면 재현율의 분모가 0(맞힐 대상이 없었음), 둘 다 0이면 F1 의 분모가 0입니다. 학습 초기 몇 스텝, 그리고 양성이 0.1% 인 데이터의 어떤 배치에서는 반드시 겪습니다.\n⚠️ 지표 계산이 예외로 죽으면 **학습 루프 전체가 멈춥니다** — 몇 시간 돌린 학습이 검증 단계에서 날아가는 전형적인 사고입니다. 0으로 두는 것이 scikit-learn 의 기본값이며(`zero_division=0`), 경고를 함께 내보내 '모델이 아직 아무것도 예측하지 않는다' 는 사실을 알립니다.\n💡 다만 **0 과 '정의되지 않음' 은 다릅니다**. 정밀도 0.0 은 '양성으로 예측한 것이 다 틀렸다' 로 읽히지만 실제로는 '예측한 게 없다' 입니다. 여러 폴드의 평균을 낼 때 이 0들이 섞이면 점수가 실제보다 낮게 나오므로, 로그에 분모를 함께 남기는 것이 안전합니다.\n🔧 그리고 불균형 데이터에서 정확도는 쓸모가 없습니다 — 양성이 1% 면 '전부 음성' 이 99% 정확도이고, 그 모델의 F1 은 0입니다. 이 문항의 두 번째 테스트가 바로 그 모델입니다." },

{ k:"ROC AUC 와 동점 처리", fn:"roc_auc", cat:"debug",
  q:"<code>roc_auc(y_true, scores)</code> 를 순위 해석으로 계산합니다 — 양성·음성 쌍을 모두 만들어 <b>양성의 점수가 더 높으면 1점, 같으면 0.5점</b>을 주고 쌍의 수로 나눕니다. 한쪽 클래스가 아예 없으면 <code>0.5</code> 를 돌려줍니다. 아래 구현은 점수가 겹칠 때 값을 낮게 봅니다.",
  src:`def roc_auc(y_true, scores):
    pos = [s for y, s in zip(y_true, scores) if y == 1]
    neg = [s for y, s in zip(y_true, scores) if y == 0]
    if not pos or not neg:
        return 0.5
    # TODO: 점수가 같은 쌍은 어떻게 세야 하는가?
    wins = sum(1 for p in pos for n in neg if p > n)
    return wins / (len(pos) * len(neg))`,
  sol:`def roc_auc(y_true, scores):
    pos = [s for y, s in zip(y_true, scores) if y == 1]
    neg = [s for y, s in zip(y_true, scores) if y == 0]
    if not pos or not neg:
        return 0.5
    total = 0.0
    for p in pos:
        for n in neg:
            if p > n:
                total += 1.0
            elif p == n:
                total += 0.5
    return total / (len(pos) * len(neg))`,
  tests:[
    ["round(roc_auc([0, 0, 1, 1], [0.1, 0.4, 0.35, 0.8]), 6)","0.75"],
    ["roc_auc([0, 1], [0.5, 0.5])","0.5"],
    ["round(roc_auc([0, 0, 1, 1], [0.1, 0.2, 0.3, 0.4]), 6)","1.0"],
    ["round(roc_auc([1, 1, 0, 0], [0.1, 0.2, 0.3, 0.4]), 6)","0.0"],
    ["roc_auc([1, 1], [0.1, 0.9])","0.5"]],
  edge:[
    ["roc_auc([], [])","0.5"],
    ["round(roc_auc([0, 1, 1], [0.5, 0.5, 0.9]), 6)","0.75"]],
  ex:"🎯 AUC 의 가장 쓸모 있는 해석은 '**무작위로 뽑은 양성 하나가 무작위로 뽑은 음성 하나보다 높은 점수를 받을 확률**' 입니다(Mann-Whitney U 와 같은 값). 이 해석을 알면 구현이 곧 정의가 되고, 0.5 가 왜 '동전 던지기' 인지도 자명해집니다.\n⚠️ 동점을 0.5로 세지 않으면 값이 **체계적으로 낮게** 나옵니다. 그리고 이 오차는 모델을 개선할수록 커집니다 — 결정 트리나 앙상블은 같은 잎에 떨어진 샘플에 **똑같은 점수**를 주므로 동점이 대량으로 발생하고, 확률을 소수 둘째 자리로 반올림해 저장하는 파이프라인도 마찬가지입니다.\n💡 극단적인 예: 모델이 모든 샘플에 같은 점수를 주면 정답은 0.5(무작위와 같음)여야 하는데, 동점을 무시하면 0.0 이 나옵니다 — 두 번째 테스트가 정확히 그 경우입니다.\n🔧 AUC 자체의 한계도 알아 둘 값이 있습니다. 불균형이 극심하면 AUC 는 높은데 **실무에서 쓸 수 없는** 모델이 나옵니다(음성이 압도적이라 FP 가 조금만 늘어도 정밀도가 무너지지만 AUC 는 거의 변하지 않습니다). 그럴 때는 PR 곡선 아래 면적(average precision)을 봐야 합니다." },

{ k:"평균 정밀도(AP)", fn:"average_precision", cat:"internals",
  q:"<code>average_precision(y_true, scores)</code> 를 구현하세요. 점수 <b>내림차순</b>으로 훑으며 <b>양성을 만날 때마다</b> 그 지점까지의 정밀도(<code>맞힌 양성 수 / 지금까지 본 개수</code>)를 모아 <b>전체 양성 수로 나눈</b> 값입니다. 양성이 하나도 없으면 <code>0.0</code> 입니다(점수는 서로 다르다고 가정합니다).",
  src:`def average_precision(y_true, scores):
    order = sorted(zip(scores, y_true), key=lambda p: -p[0])
    total_pos = sum(y_true)
    if total_pos == 0:
        return 0.0
    hits = sum(1 for _, y in order if y == 1)
    # TODO: 이건 정밀도의 평균이 아니라 그냥 비율이다
    return hits / len(order)`,
  sol:`def average_precision(y_true, scores):
    order = sorted(zip(scores, y_true), key=lambda p: -p[0])
    total_pos = sum(y_true)
    if total_pos == 0:
        return 0.0
    hits, acc = 0, 0.0
    for i, (_, y) in enumerate(order, start=1):
        if y == 1:
            hits += 1
            acc += hits / i
    return acc / total_pos`,
  tests:[
    ["round(average_precision([1, 0, 1, 0], [0.9, 0.8, 0.7, 0.6]), 6)","0.833333"],
    ["round(average_precision([0, 1], [0.9, 0.1]), 6)","0.5"],
    ["average_precision([0, 0], [0.5, 0.1])","0.0"],
    ["round(average_precision([1, 1], [0.5, 0.1]), 6)","1.0"]],
  edge:[
    ["average_precision([], [])","0.0"],
    ["round(average_precision([0, 0, 0, 1], [0.9, 0.8, 0.7, 0.6]), 6)","0.25"]],
  ex:"🎯 AP 는 '**상위 결과가 얼마나 깨끗한가**' 를 재는 지표입니다. 같은 개수를 맞혀도 **앞에서 맞히면 높고 뒤에서 맞히면 낮습니다** — 두 번째와 네 번째 테스트를 비교해 보세요. 검색 결과, 추천 목록, 알림 큐처럼 **사용자가 위에서부터 보는** 시스템의 품질을 재는 데 맞습니다.\n💡 그래서 AP 는 순위에 민감하고, 마지막 edge 테스트처럼 유일한 양성이 꼴찌면 0.25(=1/4)로 떨어집니다. AUC 로 재면 같은 상황이 0.0 이 되어 '완전히 뒤집혔다' 는 다른 이야기를 하는데, 둘 다 맞습니다 — **묻는 질문이 다릅니다**.\n⚠️ 불균형이 심할 때 AUC 대신 AP 를 보라는 조언의 근거가 여기 있습니다. AUC 의 분모는 양성×음성 쌍의 수라 음성이 압도적이면 FP 몇 개가 값을 거의 바꾸지 못하지만, AP 는 **정밀도를 직접 쓰므로** 상위권의 FP 가 그대로 반영됩니다.\n🔧 실무에서는 AP 하나로 끝내지 않고 `Precision@k`·`Recall@k` 를 함께 봅니다 — 첫 화면에 10개만 보여 준다면 11위 이하의 순위는 사용자에게 아무 의미가 없기 때문입니다. 지표는 **제품이 실제로 쓰는 방식**을 닮아야 합니다." },

{ k:"확률 보정 오차(ECE)", fn:"ece", cat:"design",
  q:"<code>ece(probs, labels, bins)</code> 를 구현하세요. [0, 1]을 <code>bins</code> 개의 등간격 구간으로 나눠 각 확률을 <code>min(int(p·bins), bins−1)</code> 번째 칸에 넣고(확률 1.0 은 마지막 칸), 칸마다 <code>|평균 확률 − 실제 양성 비율|</code> 을 구해 <b>칸에 든 개수로 가중 평균</b>합니다. 빈 칸은 건너뛰고, 입력이 비면 <code>0.0</code> 입니다.",
  src:`def ece(probs, labels, bins=10):
    n = len(probs)
    if n == 0:
        return 0.0
    buckets = [[] for _ in range(bins)]
    for p, y in zip(probs, labels):
        buckets[int(p * bins) % bins].append((p, y))
    gaps = []
    for b in buckets:
        if not b:
            continue
        conf = sum(p for p, _ in b) / len(b)
        acc = sum(y for _, y in b) / len(b)
        gaps.append(abs(conf - acc))
    # TODO: 칸마다 든 개수가 다른데 단순 평균이 맞는가?
    return sum(gaps) / len(gaps) if gaps else 0.0`,
  sol:`def ece(probs, labels, bins=10):
    n = len(probs)
    if n == 0:
        return 0.0
    buckets = [[] for _ in range(bins)]
    for p, y in zip(probs, labels):
        buckets[min(int(p * bins), bins - 1)].append((p, y))
    total = 0.0
    for b in buckets:
        if not b:
            continue
        conf = sum(p for p, _ in b) / len(b)
        acc = sum(y for _, y in b) / len(b)
        total += (len(b) / n) * abs(conf - acc)
    return total`,
  tests:[
    ["round(ece([0.0, 1.0], [0, 1], 2), 6)","0.0"],
    ["round(ece([0.9, 0.9], [1, 0], 2), 6)","0.4"],
    ["round(ece([0.1, 0.1, 0.1, 0.9], [0, 0, 0, 0], 2), 6)","0.3"],
    ["round(ece([0.2, 0.8], [0, 1], 2), 6)","0.2"],
    ["ece([], [], 5)","0.0"]],
  edge:[
    ["round(ece([0.5, 0.5, 0.5, 0.5], [1, 1, 0, 0], 1), 6)","0.0"],
    ["round(ece([1.0], [1], 4), 6)","0.0"]],
  ex:"🎯 정확도와 **보정**은 다른 문제입니다. '90% 확신' 이라고 말한 예측 100건 중 실제로 90건이 맞아야 그 확률이 의미가 있는데, 대부분의 현대 신경망은 **과신**합니다 — 90% 라고 하면서 70%만 맞습니다. ECE 는 그 어긋남을 하나의 숫자로 요약합니다.\n💡 가중 평균이 핵심입니다. 세 번째 테스트에서 한 칸에 3건, 다른 칸에 1건이 들었는데 단순 평균은 두 칸을 같은 무게로 취급해 0.5 를, 가중 평균은 0.3 을 냅니다. **1건뿐인 칸의 오차가 전체 결론을 좌우하면** 지표가 잡음을 재는 것이 됩니다.\n⚠️ `int(p * bins)` 는 `p == 1.0` 에서 인덱스가 범위를 벗어나므로 `min(..., bins-1)` 로 눌러야 합니다. `% bins` 로 감싸는 것은 더 나쁩니다 — 가장 확신하는 예측이 **가장 확신하지 않는 칸**으로 들어가 보정 오차를 정반대로 계산합니다.\n🔧 확률이 중요한 곳은 분류가 아니라 **의사결정**입니다: 기대 손실 계산, 임계값 정책, 여러 모델의 확률 결합, 사람에게 넘길지 판단. 보정이 안 된 확률로 이런 결정을 하면 체계적으로 틀립니다. 사후 보정은 Platt scaling(로지스틱 회귀)이나 isotonic regression 을 **검증셋에서** 학습해 붙입니다 — 학습셋에서 하면 이미 과적합된 확률을 배우게 됩니다." },

{ k:"목표 정밀도를 만족하는 최소 임계값", fn:"min_threshold_for_precision", cat:"design",
  q:"<code>min_threshold_for_precision(y_true, scores, target)</code> 를 구현하세요. 후보 임계값은 <code>scores</code> 에 등장하는 값들이며, 임계값 <b>이상</b>을 양성으로 예측했을 때 정밀도가 <code>target</code> 이상이 되는 <b>가장 낮은</b> 임계값을 돌려줍니다. 양성 예측이 0인 임계값은 후보에서 제외하고, 만족하는 값이 없으면 <code>None</code> 입니다.",
  src:`def min_threshold_for_precision(y_true, scores, target):
    best_t, best_p = None, -1.0
    for t in sorted(set(scores)):
        pp = sum(1 for s in scores if s >= t)
        if pp == 0:
            continue
        prec = sum(1 for y, s in zip(y_true, scores) if s >= t and y == 1) / pp
        # TODO: 가장 정밀한 임계값이 아니라 '조건을 만족하는 가장 낮은' 임계값이다
        if prec > best_p:
            best_t, best_p = t, prec
    return best_t if best_p >= target else None`,
  sol:`def min_threshold_for_precision(y_true, scores, target):
    for t in sorted(set(scores)):
        pp = sum(1 for s in scores if s >= t)
        if pp == 0:
            continue
        prec = sum(1 for y, s in zip(y_true, scores) if s >= t and y == 1) / pp
        if prec >= target:
            return t
    return None`,
  tests:[
    ["min_threshold_for_precision([1, 0, 1, 0], [0.9, 0.8, 0.7, 0.6], 0.6)","0.7"],
    ["min_threshold_for_precision([1, 0, 1, 0], [0.9, 0.8, 0.7, 0.6], 1.0)","0.9"],
    ["min_threshold_for_precision([0, 0], [0.1, 0.2], 0.5)","None"],
    ["min_threshold_for_precision([1, 0], [0.9, 0.1], 0.0)","0.1"]],
  edge:[
    ["min_threshold_for_precision([], [], 0.5)","None"],
    ["min_threshold_for_precision([1, 1], [0.3, 0.7], 1.0)","0.3"]],
  ex:"🎯 모델을 배포할 때 실제로 정하는 것은 가중치가 아니라 **임계값**입니다. 그리고 그 선택은 통계가 아니라 제품이 정합니다 — '오탐이 사용자를 잃게 하니 정밀도 95% 는 지켜야 한다' 같은 제약을 먼저 두고, 그 안에서 **재현율을 최대로** 가져가는 것이 목표입니다.\n💡 임계값을 낮출수록 양성 예측이 늘어 재현율이 올라가고 정밀도는 내려갑니다. 그러니 '정밀도 제약을 만족하는 **가장 낮은** 임계값' 이 곧 '제약 안에서 재현율이 가장 높은 지점' 입니다 — 가장 정밀한 임계값을 고르면 대개 양성 예측 한두 건만 남아 쓸모가 없습니다. 두 구현의 차이가 정확히 이것입니다.\n⚠️ 정밀도는 임계값에 **단조롭지 않습니다**. 임계값을 올려도 그 구간에 FP 가 몰려 있으면 정밀도가 떨어질 수 있으므로, 이분 탐색으로 찾으면 틀립니다 — 후보를 다 훑는 것이 맞습니다.\n🔧 그리고 이 임계값은 **평가셋이 아니라 별도의 검증셋에서** 정해야 합니다. 평가셋으로 임계값을 고르면 그 점수는 더 이상 미래 성능의 추정치가 아닙니다. 실무에서는 데이터 분포가 움직이므로 임계값을 주기적으로 재조정하고, 정밀도·재현율을 함께 모니터링합니다." },

{ k:"macro F1 과 micro F1", fn:"macro_micro_f1", cat:"design",
  q:"다중 클래스 <code>macro_micro_f1(y_true, y_pred, classes)</code> 를 구현해 <code>(macro, micro)</code> 를 돌려주세요. <b>macro</b> 는 클래스별 F1 의 <b>단순 평균</b>, <b>micro</b> 는 모든 클래스의 TP·FP·FN 을 <b>합친 뒤</b> 계산한 F1 입니다. 분모가 0인 지표는 <code>0.0</code> 으로 둡니다.",
  src:`def macro_micro_f1(y_true, y_pred, classes):
    def f1(tp, fp, fn):
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        return 2 * p * r / (p + r) if p + r else 0.0
    TP = FP = FN = 0
    for c in classes:
        TP += sum(1 for t, p in zip(y_true, y_pred) if t == c and p == c)
        FP += sum(1 for t, p in zip(y_true, y_pred) if t != c and p == c)
        FN += sum(1 for t, p in zip(y_true, y_pred) if t == c and p != c)
    # TODO: macro 는 클래스별 F1 을 먼저 구해야 한다
    m = f1(TP, FP, FN)
    return m, m`,
  sol:`def macro_micro_f1(y_true, y_pred, classes):
    def f1(tp, fp, fn):
        p = tp / (tp + fp) if tp + fp else 0.0
        r = tp / (tp + fn) if tp + fn else 0.0
        return 2 * p * r / (p + r) if p + r else 0.0
    per, TP, FP, FN = [], 0, 0, 0
    for c in classes:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == c and p == c)
        fp = sum(1 for t, p in zip(y_true, y_pred) if t != c and p == c)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t == c and p != c)
        per.append(f1(tp, fp, fn))
        TP += tp
        FP += fp
        FN += fn
    macro = sum(per) / len(per) if per else 0.0
    return macro, f1(TP, FP, FN)`,
  tests:[
    ["tuple(round(v, 6) for v in macro_micro_f1(['a','a','b','c'], ['a','b','b','c'], ['a','b','c']))","(0.777778, 0.75)"],
    ["tuple(round(v, 6) for v in macro_micro_f1(['a'] * 9 + ['b'], ['a'] * 10, ['a','b']))","(0.473684, 0.9)"],
    ["tuple(round(v, 6) for v in macro_micro_f1(['a','b'], ['a','b'], ['a','b']))","(1.0, 1.0)"],
    ["tuple(round(v, 6) for v in macro_micro_f1(['a','a'], ['a','a'], ['a','b']))","(0.5, 1.0)"]],
  edge:[
    ["macro_micro_f1([], [], ['a'])","(0.0, 0.0)"],
    ["macro_micro_f1([], [], [])","(0.0, 0.0)"]],
  ex:"🎯 두 번째 테스트가 이 문항의 전부입니다. 90%가 'a' 인 데이터에서 **전부 'a' 라고 답하는 모델**의 micro F1 은 0.9(정확도와 같음)로 훌륭해 보이지만, macro F1 은 0.47 입니다 — 'b' 를 하나도 못 맞혔다는 사실이 macro 에서만 드러납니다.\n💡 단일 라벨 다중 클래스에서는 **micro F1 = 정확도** 입니다(모든 오분류가 한 클래스의 FP 이면서 다른 클래스의 FN 이 되어 상쇄되기 때문). 그래서 micro 를 보고하는 것은 정확도를 보고하는 것과 같고, 불균형 데이터에서 정확도가 왜 쓸모없는지에 대한 이야기가 그대로 적용됩니다.\n⚠️ macro 는 반대 방향으로 편향됩니다 — **모든 클래스를 같은 무게로** 보므로, 샘플이 3개뿐인 클래스가 10만 개인 클래스와 동등하게 점수를 흔듭니다. 어느 쪽이 옳은지는 지표가 정하지 않습니다: 희귀 질병처럼 소수 클래스가 진짜 목적이면 macro, 전체 처리량이 목적이면 micro, 그 사이가 필요하면 클래스 크기로 가중한 weighted 입니다.\n🔧 그리고 네 번째 테스트처럼 **데이터에 없는 클래스**를 `classes` 에 넣으면 macro 가 0으로 끌려 내려갑니다. 폴드마다 등장 클래스가 달라지는 상황에서 이것이 점수를 요동치게 만드므로, `classes` 목록은 데이터가 아니라 **문제 정의**에서 고정해 넘겨야 합니다." },

];
