/* 통계 실행형 12문항 — 순수 파이썬만 쓴다(Pyodide 오프라인).
   부트스트랩 신뢰구간, Welch t 통계량, BH 보정, 심프슨의 역설, 표본 크기 산정, 베이즈 갱신,
   분산 편향, 순열 검정, EWMA, 저수지 샘플링, F1 Score, 지니 불순도.
   난수를 쓰는 것은 시드를 고정해 결정적으로 만든다. */

module.exports=[

{ k:"편향 없는 표본 분산", fn:"sample_variance", cat:"internals",
  q:"<code>sample_variance(xs)</code> 를 구현하세요. 리스트 <code>xs</code> 의 표본 분산을 구합니다. 모집단 분산을 추정하기 위해 <code>n</code> 이 아니라 <b><code>n - 1</code> 로 나누어야</b> 합니다(베셀 보정). 결과는 <code>round(v, 4)</code> 로 감싸고, 요소가 2개 미만이면 <code>None</code> 입니다. 아래 구현은 n 으로 나눕니다.",
  src:`def sample_variance(xs):
    n = len(xs)
    if n < 2:
        return None
    mean = sum(xs) / n
    # TODO: 모집단 분산을 추정하려면 n - 1 로 나누어야 한다
    ss = sum((x - mean) ** 2 for x in xs)
    return round(ss / n, 4)`,
  sol:`def sample_variance(xs):
    n = len(xs)
    if n < 2:
        return None
    mean = sum(xs) / n
    ss = sum((x - mean) ** 2 for x in xs)
    return round(ss / (n - 1), 4)`,
  tests:[
    ["sample_variance([1, 2, 3, 4, 5])","2.5"],
    ["sample_variance([10, 10, 10])","0.0"],
    ["sample_variance([0, 100])","5000.0"],
    ["sample_variance([1])","None"],
    ["sample_variance([])","None"]],
  edge:[
    ["sample_variance([-5, -3, -1, 1, 3, 5])","14.0"],
    ["sample_variance([0, 0, 0, 0, 1])","0.2"]],
  ex:"🎯 편향(Bias)의 핵심을 손으로 확인하는 문항입니다. 표본의 평균은 모평균과 다를 수밖에 없는데, 표본 분산을 계산할 때 모평균이 아닌 표본 평균을 사용하면 편차 제곱의 합이 수학적으로 항상 작게 나옵니다. 그래서 `n` 으로 나누면 분산을 과소 추정하게 됩니다.\n💡 베셀 보정(Bessel's correction)이라 불리는 `n-1` 나누기는 이 과소 추정을 정확히 상쇄해 기댓값을 모분산과 일치시킵니다. `n` 대신 `n-1` 을 쓰는 이유는 '표본 평균을 계산하는 데 데이터 정보(자유도) 하나를 썼기 때문' 이라고 이해하면 편합니다.\n⚠️ numpy 의 `np.var` 와 `np.std` 는 기본적으로 `n` 으로 나눕니다(`ddof=0`). 반면 pandas 의 `.var()` 와 `.std()` 는 기본적으로 `n-1` 로 나눕니다(`ddof=1`). 이 차이를 모르면 두 라이브러리를 섞어 쓸 때 이유 없이 값이 어긋납니다.\n🔧 기계학습에서 데이터 크기가 크면 `n` 이나 `n-1` 이나 차이가 거의 없지만, 실험 설계나 소표본 A/B 테스트에서는 분산의 미세한 차이가 p-value 에 직접적인 영향을 주므로 `ddof=1` 을 명시하는 습관이 안전합니다." },

{ k:"부트스트랩 신뢰구간", fn:"bootstrap_ci", cat:"internals",
  q:"<code>bootstrap_ci(data, b, alpha, seed)</code> 를 구현하세요. 데이터에서 <b>복원 추출</b>로 크기가 같은 표본을 <code>b</code> 번 뽑아 각각의 평균을 구하고, 그 평균들의 하위 <code>alpha / 2</code> 와 상위 <code>1 - alpha / 2</code> 백분위수를 <code>[lower, upper]</code> 로 돌려줍니다. 인덱스는 <code>int(b * 백분위수)</code> 로 구하고 <code>round(x, 4)</code> 를 적용하세요. 아래 구현은 비복원 추출을 합니다.",
  src:`def bootstrap_ci(data, b, alpha, seed):
    import random
    random.seed(seed)
    n = len(data)
    means = []
    for _ in range(b):
        # TODO: 복원 추출(with replacement)이어야 한다
        sample = random.sample(data, n)
        means.append(sum(sample) / n)
    means.sort()
    lower = means[int(b * (alpha / 2))]
    upper = means[int(b * (1 - alpha / 2))]
    return [round(lower, 4), round(upper, 4)]`,
  sol:`def bootstrap_ci(data, b, alpha, seed):
    import random
    random.seed(seed)
    n = len(data)
    means = []
    for _ in range(b):
        sample = [data[random.randint(0, n - 1)] for _ in range(n)]
        means.append(sum(sample) / n)
    means.sort()
    lower = means[int(b * (alpha / 2))]
    upper = means[int(b * (1 - alpha / 2))]
    return [round(lower, 4), round(upper, 4)]`,
  tests:[
    ["bootstrap_ci([1, 2, 3, 4, 5], 1000, 0.05, 42)","[1.8, 4.2]"],
    ["bootstrap_ci([10, 20, 30], 500, 0.10, 42)","[13.3333, 26.6667]"],
    ["bootstrap_ci([0, 0, 0], 100, 0.05, 42)","[0.0, 0.0]"],
    ["bootstrap_ci([1, 100], 200, 0.05, 42)","[1.0, 100.0]"]],
  edge:[
    ["bootstrap_ci([1, 2, 3], 10, 0.2, 42)","[1.3333, 3.0]"]],
  ex:"🎯 부트스트랩은 복잡한 수식 없이 **시뮬레이션으로 통계적 불확실성을 측정하는** 강력한 도구입니다. 핵심은 모집단을 모를 때 '현재 표본을 모집단으로 간주' 하고 반복해서 다시 뽑아(재표본) 통계량의 분포를 만드는 것입니다.\n⚠️ 비복원 추출(`random.sample`)로 표본 크기만큼 뽑으면 원래 데이터와 완벽히 같은 구성이 되므로, 평균은 매번 같아져 신뢰구간이 점(point)으로 수렴합니다. 부트스트랩이 성립하려면 반드시 **복원 추출**이어야 표본마다 구성을 조금씩 다르게 만들 수 있습니다.\n💡 정규분포 가정이 필요 없고 평균뿐 아니라 중앙값, 90분위수, 심지어 두 지표의 비율 등 수식으로 분산을 구하기 어려운 어떤 복잡한 지표라도 적용할 수 있다는 것이 실무적 가치입니다.\n🔧 단, 데이터가 너무 적거나(꼬리 분포를 반영 못 함) 시계열 데이터처럼 독립성이 깨진 경우에는 기본 부트스트랩이 틀린 결과를 냅니다. 이럴 때는 블록 단위로 뽑는 Block Bootstrap 을 써야 합니다." },

{ k:"순열 검정 (Permutation Test)", fn:"permutation_test", cat:"internals",
  q:"<code>permutation_test(x, y, b, seed)</code> 를 구현하세요. 두 그룹 <code>x, y</code> 간의 평균 차이가 우연인지 확인하기 위해, <b>두 데이터를 섞어 임의로 다시 두 그룹으로 나눈 뒤</b> 차이를 계산하는 과정을 <code>b</code> 번 반복합니다. 원래 관측된 차이 이상으로 큰 차이(절댓값)가 나올 비율(p-value)을 <code>round(p, 4)</code> 로 돌려줍니다. 입력이 비었으면 <code>None</code>. 아래 구현은 관측값과 임의값을 잘못 비교합니다.",
  src:`def permutation_test(x, y, b, seed):
    import random
    random.seed(seed)
    if not x or not y:
        return None
    def mean(arr): return sum(arr) / len(arr)
    obs = abs(mean(x) - mean(y))
    pool = x + y
    nx = len(x)
    count = 0
    for _ in range(b):
        shuffled = pool[:]
        random.shuffle(shuffled)
        diff = abs(mean(shuffled[:nx]) - mean(shuffled[nx:]))
        # TODO: 관측값 '이상' 이 나오는 비율을 세어야 한다
        if diff < obs:
            count += 1
    return round(count / b, 4)`,
  sol:`def permutation_test(x, y, b, seed):
    import random
    random.seed(seed)
    if not x or not y:
        return None
    def mean(arr): return sum(arr) / len(arr)
    obs = abs(mean(x) - mean(y))
    pool = x + y
    nx = len(x)
    count = 0
    for _ in range(b):
        shuffled = pool[:]
        random.shuffle(shuffled)
        diff = abs(mean(shuffled[:nx]) - mean(shuffled[nx:]))
        if diff >= obs:
            count += 1
    return round(count / b, 4)`,
  tests:[
    ["permutation_test([1, 2, 3], [4, 5, 6], 1000, 42)","0.121"],
    ["permutation_test([1, 1], [1, 1], 100, 42)","1.0"],
    ["permutation_test([10, 20], [15, 25], 500, 42)","0.722"],
    ["permutation_test([0], [100], 100, 42)","1.0"]],
  edge:[
    ["permutation_test([], [1, 2], 10, 42)","None"]],
  ex:"🎯 A/B 테스트에서 가장 직관적인 검정 방법입니다. 'A 와 B 에 차이가 없다(귀무가설)' 면 라벨을 무작위로 섞어도 원래 관측된 차이만큼 큰 차이가 종종 나와야 합니다. 섞었는데도 원래 차이보다 큰 경우가 거의 없다면(p-value 가 작다면), 우연이 아니라고 결론 내릴 수 있습니다.\n⚠️ 버그 코드처럼 `diff < obs` (작은 경우)를 세면 p-value 의 정의가 정반대가 됩니다. p-value 는 관측된 결과 '이상' 으로 극단적인 결과가 우연히 나올 확률입니다.\n💡 t-test 와 목적은 같지만, 정규분포 가정이 필요 없고 이상치에 덜 민감하며 작은 표본에서도 정확하다는 장점이 있습니다.\n🔧 단점은 계산 비용입니다. 데이터가 많아지면 섞고 계산하는 과정이 수만 번 반복되어야 해서 느립니다. 실무에서는 표본이 크면 근사가 잘 되는 t-test 나 부트스트랩을 쓰고, 샘플이 아주 적을 때 순열 검정으로 확신을 얻는 용도로 씁니다." },

{ k:"Welch's t-test 자유도", fn:"welch_df", cat:"internals",
  q:"<code>welch_df(v1, n1, v2, n2)</code> 를 구현하세요. 분산이 다를 때(이분산) t-검정을 수행하는 Welch's t-test 의 <b>근사 자유도(df)</b>를 계산합니다. <code>(v1/n1 + v2/n2)^2 / ((v1/n1)^2/(n1-1) + (v2/n2)^2/(n2-1))</code> 입니다. <code>n1, n2</code> 가 1 이하거나 분모가 0이면 <code>0.0</code> 이며 결과는 <code>round(df, 4)</code> 입니다. 아래 코드는 분자 계산에 괄호가 빠졌습니다.",
  src:`def welch_df(v1, n1, v2, n2):
    if n1 <= 1 or n2 <= 1:
        return 0.0
    # TODO: 분자 전체의 제곱이어야 한다
    num = v1 / n1 + v2 / n2 ** 2
    den = (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1)
    if den == 0:
        return 0.0
    return round(num / den, 4)`,
  sol:`def welch_df(v1, n1, v2, n2):
    if n1 <= 1 or n2 <= 1:
        return 0.0
    num = (v1 / n1 + v2 / n2) ** 2
    den = (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1)
    if den == 0:
        return 0.0
    return round(num / den, 4)`,
  tests:[
    ["welch_df(2.0, 10, 3.0, 15)","21.913"],
    ["welch_df(1.0, 10, 1.0, 10)","18.0"],
    ["welch_df(100.0, 50, 1.0, 50)","49.9799"],
    ["welch_df(0.0, 10, 0.0, 10)","0.0"]],
  edge:[
    ["welch_df(5.0, 1, 3.0, 10)","0.0"]],
  ex:"🎯 A/B 테스트에서 두 그룹의 분산이 같다는 가정은 대부분 틀립니다(효과가 있는 그룹은 대개 분산도 커집니다). Student's t-test 는 분산이 같다고 가정해 pooled variance 를 쓰지만, Welch's t-test 는 각자의 분산을 쓰고 자유도를 조정해 이 문제를 해결합니다.\n💡 두 번째 테스트를 보면 분산과 표본 크기가 같을 때 자유도가 `n1 + n2 - 2` (10 + 10 - 2 = 18)로 Student 와 똑같아집니다. 하지만 세 번째 테스트처럼 분산 차이가 극심하면 자유도가 49 로 뚝 떨어져 보수적인 검정을 하게 됩니다.\n⚠️ 분자와 분모 계산에 제곱 연산과 나눗셈이 섞여 있어 괄호를 하나만 실수해도 값이 완전히 달라지고, 그 결과로 p-value 가 엉뚱해집니다. 이 공식(Satterthwaite approximation)은 꽤 길지만 통계 라이브러리 깊은 곳에서 항상 돌아가고 있습니다.\n🔧 R 과 Scipy 의 `ttest_ind` 는 기본값이 다릅니다. R 은 기본적으로 이분산을 가정해 Welch 를 쓰지만, 파이썬 Scipy 는 기본값이 Student(`equal_var=True`)입니다. 현대 통계학에서는 항상 Welch's t-test 를 쓰는 것을 권장하므로 파이썬에서는 `equal_var=False` 를 습관적으로 켜야 합니다." },

{ k:"다중 비교 BH 보정", fn:"bh_correction", cat:"internals",
  q:"<code>bh_correction(p_values, alpha)</code> 를 구현하세요. 여러 가설을 동시에 검정할 때 <b>거짓 발견율(FDR)</b>을 <code>alpha</code> 이하로 통제하는 Benjamini-Hochberg 절차입니다. p-value 를 오름차순 정렬하고, <code>p_i <= (i / m) * alpha</code> (i 는 1부터 시작)를 만족하는 <b>가장 큰 i</b> 를 찾아, 그보다 작거나 같은 순위의 가설 인덱스를 정렬해 돌려줍니다. 만족하는 가설이 없으면 <code>[]</code>. 아래 구현은 모든 인덱스를 돌려줍니다.",
  src:`def bh_correction(p_values, alpha):
    m = len(p_values)
    if m == 0:
        return []
    sorted_p = sorted(enumerate(p_values), key=lambda x: x[1])
    k_max = 0
    for i in range(m):
        k = i + 1
        if sorted_p[i][1] <= (k / m) * alpha:
            k_max = k
    if k_max == 0:
        return []
    # TODO: 인덱스 k_max 개만 돌려줘야 한다
    rejected = [idx for idx, _ in sorted_p]
    return sorted(rejected)`,
  sol:`def bh_correction(p_values, alpha):
    m = len(p_values)
    if m == 0:
        return []
    sorted_p = sorted(enumerate(p_values), key=lambda x: x[1])
    k_max = 0
    for i in range(m):
        k = i + 1
        if sorted_p[i][1] <= (k / m) * alpha:
            k_max = k
    if k_max == 0:
        return []
    rejected = [idx for idx, _ in sorted_p[:k_max]]
    return sorted(rejected)`,
  tests:[
    ["bh_correction([0.01, 0.05, 0.03, 0.04, 0.2], 0.1)","[0, 1, 2, 3]"],
    ["bh_correction([0.06, 0.1, 0.2], 0.05)","[]"],
    ["bh_correction([0.001, 0.002, 0.003], 0.05)","[0, 1, 2]"],
    ["bh_correction([0.04, 0.041, 0.042], 0.05)","[0, 1, 2]"]],
  edge:[
    ["bh_correction([], 0.05)","[]"]],
  ex:"🎯 100번의 독립적인 A/B 테스트를 하면, 효과가 전혀 없어도 유의수준 5% 에 의해 우연히 5개는 '효과가 있다(p < 0.05)' 고 나옵니다. 이것이 다중 비교 문제(Multiple Comparisons Problem)입니다.\n💡 Bonferroni 보정은 기준을 무조건 `alpha / m` 으로 나누어 너무 빡빡합니다. 반면 BH 절차는 p-value 의 순위에 비례해 기준을 완화(`(i / m) * alpha`)하여, '발견된 것 중 가짜의 비율(FDR)' 을 통제하면서도 통계적 검정력을 유지합니다.\n⚠️ 주의할 점은 '가장 큰 i' 를 찾는다는 것입니다. 중간에 부등식을 만족하지 않는 p-value 가 있어도, 그 뒤에 더 큰 i 에서 부등식을 만족하면 앞의 가설들도 전부 기각합니다.\n🔧 추천 시스템 A/B 테스트나 유전자 발현 분석처럼 동시에 수백 수천 개의 가설을 검정할 때는 단순히 p < 0.05 를 보면 완전히 잘못된 결론을 냅니다. 현대 데이터 분석에서 p-value 를 볼 때 반드시 세트로 따라와야 하는 보정 절차입니다." },

{ k:"심프슨의 역설", fn:"simpsons_paradox", cat:"design",
  q:"<code>simpsons_paradox(records)</code> 를 구현하세요. 각 레코드는 <code>{'g': 'A'|'B', 'd': 부서, 's': 성공여부(bool)}</code> 입니다. <b>전체 성공률</b>은 A 가 B 보다 크지만(<code>A > B</code>), <b>모든 개별 부서</b> 내에서는 B 의 성공률이 A <b>이상</b>인 경우(<code>B >= A</code>) <code>True</code> 를 돌려줍니다. 어느 한쪽 그룹이 빈 부서가 있거나 그룹 자체가 비었으면 <code>False</code>. 아래 구현은 전체 성공률만 비교합니다.",
  src:`def simpsons_paradox(records):
    def rate(recs):
        if not recs: return 0.0
        return sum(1 for r in recs if r['s']) / len(recs)
    a_recs = [r for r in records if r['g'] == 'A']
    b_recs = [r for r in records if r['g'] == 'B']
    if not a_recs or not b_recs:
        return False
    # TODO: 개별 부서 조건이 누락되었다
    return rate(a_recs) > rate(b_recs)`,
  sol:`def simpsons_paradox(records):
    def rate(recs):
        if not recs: return 0.0
        return sum(1 for r in recs if r['s']) / len(recs)
    a_recs = [r for r in records if r['g'] == 'A']
    b_recs = [r for r in records if r['g'] == 'B']
    if not a_recs or not b_recs:
        return False
    oa = rate(a_recs)
    ob = rate(b_recs)
    depts = set(r['d'] for r in records)
    for d in depts:
        ad = [r for r in a_recs if r['d'] == d]
        bd = [r for r in b_recs if r['d'] == d]
        if not ad or not bd:
            return False
        if rate(bd) < rate(ad):  # B 가 A 이상이어야 하므로 작으면 False
            return False
    return oa > ob`,
  tests:[
    ["simpsons_paradox([{'g':'A','d':1,'s':1},{'g':'A','d':1,'s':1},{'g':'A','d':1,'s':1},{'g':'A','d':1,'s':0},{'g':'A','d':2,'s':0},{'g':'B','d':1,'s':1},{'g':'B','d':2,'s':1},{'g':'B','d':2,'s':0},{'g':'B','d':2,'s':0},{'g':'B','d':2,'s':0}])","True"],
    ["simpsons_paradox([{'g':'A','d':1,'s':1},{'g':'B','d':1,'s':0}])","False"],
    ["simpsons_paradox([{'g':'A','d':1,'s':1},{'g':'B','d':2,'s':1}])","False"],
    ["simpsons_paradox([])","False"]],
  edge:[
    ["simpsons_paradox([{'g':'A','d':1,'s':0},{'g':'B','d':1,'s':1}])","False"]],
  ex:"🎯 심프슨의 역설은 부분에서 성립하던 관계가 데이터를 모두 합쳤을 때 뒤집히는 현상입니다. 이 역설이 왜 무서운지 눈으로 확인하게 하는 코딩입니다. 첫 번째 테스트를 보면, 전체 성공률은 A가 60%(3/5), B가 40%(2/5) 로 A가 높게 나오지만, 부서별로 보면 1부서(A:75%, B:100%), 2부서(A:0%, B:25%) 로 무조건 B 가 더 잘합니다.\n💡 원인은 교란 변수(Confounding variable)에 있습니다. A 는 '성공률이 원래 높은 1부서' 에 표본이 몰려 있고, B 는 '원래 낮은 2부서' 에 몰려 있으면 합쳤을 때 A 가 유리해 보입니다.\n⚠️ 실무에서 대시보드만 보고 결정을 내리면 안 되는 이유입니다. '전체 모바일 유저의 전환율이 올랐다' 고 좋아했는데, 알고 보니 안드로이드와 iOS 각각에서는 모두 떨어졌지만 전환율이 높은 iOS 유저 비중이 늘어나서 전체 지표가 오르는 일이 흔합니다.\n🔧 데이터를 분석할 때 항상 주요 세그먼트(성별, 기기, 국가, 시간대)로 '쪼개서' 트렌드가 일관된지 확인해야 합니다. 혼합 효과 모델(Mixed Effects Model)도 이 문제를 해결하는 통계적 기법 중 하나입니다." },

{ k:"베이즈 갱신", fn:"bayes_update", cat:"internals",
  q:"<code>bayes_update(prior_h1, likelihoods, evidence_seq)</code> 를 구현하세요. H1 과 H2 두 가설이 있고, 초기 확률은 <code>prior_h1</code> 과 <code>1 - prior_h1</code> 입니다. <code>likelihoods</code> 는 증거 <code>e</code> 에 대해 <code>(P(e|H1), P(e|H2))</code> 를 매핑합니다. <code>evidence_seq</code> 증거가 차례로 들어올 때마다 사후 확률을 갱신해 최종 H1 의 확률을 <code>round(p, 4)</code> 로 돌려줍니다. 확률 분모가 0이 되면 <code>0.0</code>. 모르는 증거는 무시합니다. 아래 구현은 베이즈 정리가 아닌 단순히 우도를 더합니다.",
  src:`def bayes_update(prior_h1, likelihoods, evidence_seq):
    p_h1 = prior_h1
    p_h2 = 1.0 - prior_h1
    for e in evidence_seq:
        if e not in likelihoods:
            continue
        l1, l2 = likelihoods[e]
        # TODO: 베이즈 정리는 P(H1|e) = P(e|H1)*P(H1) / P(e) 이다
        p_h1 += l1
        p_h2 += l2
    total = p_h1 + p_h2
    return round(p_h1 / total, 4) if total else 0.0`,
  sol:`def bayes_update(prior_h1, likelihoods, evidence_seq):
    p_h1 = prior_h1
    p_h2 = 1.0 - prior_h1
    for e in evidence_seq:
        if e not in likelihoods:
            continue
        l1, l2 = likelihoods[e]
        p_e = l1 * p_h1 + l2 * p_h2
        if p_e == 0:
            return 0.0
        p_h1 = (l1 * p_h1) / p_e
        p_h2 = (l2 * p_h2) / p_e
    return round(p_h1, 4)`,
  tests:[
    ["bayes_update(0.5, {'pos': (0.9, 0.1), 'neg': (0.1, 0.9)}, ['pos'])","0.9"],
    ["bayes_update(0.5, {'pos': (0.9, 0.1), 'neg': (0.1, 0.9)}, ['pos', 'pos'])","0.9878"],
    ["bayes_update(0.01, {'pos': (0.9, 0.1)}, ['pos'])","0.0833"],
    ["bayes_update(0.5, {'A': (1.0, 0.0)}, ['A'])","1.0"],
    ["bayes_update(0.5, {}, ['unknown'])","0.5"]],
  edge:[
    ["bayes_update(0.5, {'pos': (0.0, 0.0)}, ['pos'])","0.0"]],
  ex:"🎯 베이즈 정리의 본질은 '새로운 증거가 들어왔을 때 내 믿음을 어떻게 갱신할 것인가' 입니다. $P(H|e) = \\frac{P(e|H)P(H)}{P(e)}$ 공식에서 이전 단계의 사후 확률 $P(H|e)$ 이 다음 단계의 사전 확률 $P(H)$ 로 자연스럽게 이어지는 것을 코드로 구현했습니다.\n💡 세 번째 테스트(0.01 사전 확률)가 이른바 '거짓 양성 역설(Base rate fallacy)' 입니다. 정확도가 90% 인 검사기라도 희귀병(1%)에 양성이 떴을 때 진짜 병에 걸렸을 확률은 90% 가 아니라 8.3% 에 불과합니다. 사전 확률이 얼마나 강력한 닻 역할을 하는지 보여 줍니다.\n⚠️ 우도를 단순히 더하거나 곱하기만 하면 분모로 정규화하는 과정($P(e)$ 로 나누기)이 빠져 확률의 합이 1을 넘거나 0에 수렴해 버립니다. 매 단계 갱신을 정확히 해야 합니다.\n🔧 스팸 필터(나이브 베이즈 분류기)가 정확히 이 과정을 수만 단어에 대해 수행합니다. 단어 하나하나가 증거(evidence)가 되어 스팸 가설의 확률을 계속 올리거나 내리는 방식입니다." },

{ k:"목표 표본 크기 산정", fn:"sample_size_prop", cat:"internals",
  q:"<code>sample_size_prop(z, p, e)</code> 를 구현하세요. 비율 추정에서 오차 한계(Margin of Error)를 <code>e</code> 이하로 맞추기 위한 <b>최소 표본 크기 <code>n</code></b> 을 구합니다. 공식은 <code>n = (z^2 * p * (1 - p)) / e^2</code> 이고, 사람은 나눌 수 없으므로 항상 <b>올림(ceil)</b>해야 합니다. <code>e <= 0</code> 이면 <code>None</code>. 아래 구현은 올림 대신 반올림을 합니다.",
  src:`def sample_size_prop(z, p, e):
    if e <= 0: return None
    n = (z ** 2 * p * (1 - p)) / (e ** 2)
    # TODO: 보수적으로 무조건 올림해야 한다
    return round(n)`,
  sol:`def sample_size_prop(z, p, e):
    import math
    if e <= 0: return None
    n = (z ** 2 * p * (1 - p)) / (e ** 2)
    return math.ceil(n)`,
  tests:[
    ["sample_size_prop(1.96, 0.5, 0.05)","385"],
    ["sample_size_prop(2.58, 0.5, 0.01)","16641"],
    ["sample_size_prop(1.96, 0.1, 0.05)","139"],
    ["sample_size_prop(1.96, 0.5, 0)","None"]],
  edge:[
    ["sample_size_prop(1.96, 0.5, 0.5)","4"]],
  ex:"🎯 A/B 테스트를 시작하기 전에 반드시 묻게 되는 질문, '며칠이나 돌려야 하나요?' 에 대답하는 공식입니다. 표본 크기는 목표하는 신뢰도(z)와 오차(e), 그리고 기저 비율(p)에 의해 결정됩니다.\n⚠️ `round` 나 `int` 로 내림을 해버리면 요구하는 오차 한계(e)를 아주 미세하게 만족시키지 못하는 경우가 생깁니다. 표본 크기는 항상 보수적으로 넉넉히 잡아야 하므로 무조건 `ceil` 로 올려야 합니다.\n💡 `p=0.5` 일 때 `p(1-p)` 가 0.25 로 최대가 됩니다. 첫 번째 테스트를 보면 오차 5% 를 맞추려면 약 385명(또는 개)의 응답이 필요합니다. 만약 비율을 모른다면 가장 보수적인 0.5 를 넣고 계산하는 것이 표준 절차입니다.\n🔧 오차(e)를 절반(0.05 -> 0.025)으로 줄이려면 표본은 2배가 아니라 **4배**가 필요합니다(분모에 제곱). 데이터를 두 배 더 모았다고 확신이 두 배가 되지는 않는다는, 통계학의 비정한 법칙입니다." },

{ k:"지수 가중 이동 평균 (EWMA)", fn:"ewma", cat:"internals",
  q:"<code>ewma(xs, alpha)</code> 를 구현하세요. 시계열 데이터 <code>xs</code> 에 대해 <b>현재 값에 <code>alpha</code>, 과거 평균에 <code>(1 - alpha)</code></b> 가중치를 두어 계산합니다. 첫 번째 값은 <code>xs[0]</code> 을 그대로 씁니다. 결과를 <code>round(v, 4)</code> 로 매핑해 돌려주고 빈 입력은 <code>[]</code>. 아래 구현은 최신 값을 무시합니다.",
  src:`def ewma(xs, alpha):
    if not xs:
        return []
    out = [xs[0]]
    for x in xs[1:]:
        # TODO: 과거 평균만 남기고 최신 값(x)을 누락했다
        out.append((1 - alpha) * out[-1])
    return [round(v, 4) for v in out]`,
  sol:`def ewma(xs, alpha):
    if not xs:
        return []
    out = [xs[0]]
    for x in xs[1:]:
        out.append(alpha * x + (1 - alpha) * out[-1])
    return [round(v, 4) for v in out]`,
  tests:[
    ["ewma([10, 20, 30], 0.5)","[10, 15.0, 22.5]"],
    ["ewma([10, 10, 10], 0.1)","[10, 10.0, 10.0]"],
    ["ewma([0, 100], 1.0)","[0, 100.0]"],
    ["ewma([100, 0], 0.0)","[100, 100.0]"]],
  edge:[
    ["ewma([], 0.5)","[]"]],
  ex:"🎯 지수 가중 이동 평균(EWMA)은 최근 데이터에 더 큰 가중치를 두면서도 과거의 모든 데이터를 버리지 않고 지수적으로 감소시키며 반영하는 우아한 방법입니다. 상태를 저장할 변수가 직전 평균값 하나뿐이라 스트리밍 데이터에 제격입니다.\n💡 극단적인 가중치를 보면 이해가 쉽습니다. 세 번째 테스트처럼 `alpha=1.0` 이면 과거를 완전히 잊고 최신 값만 따라갑니다(순수 관측). 반대로 `alpha=0.0` 이면 첫 값만 고집합니다. 이 둘을 얼마나 섞을지가 `alpha` 의 역할입니다.\n⚠️ 딥러닝 옵티마이저(Adam, RMSprop)의 모멘텀이나 배치 정규화(Batch Normalization)의 이동 평균 추정 등 기계학습 내부에서 정말 많이 쓰이는 공식입니다.\n🔧 단순히 산술 이동 평균(Rolling Mean)을 쓰면 과거 데이터가 윈도우를 벗어나는 순간 값이 툭 떨어지는 '절벽 효과' 가 생기지만, EWMA 는 매끄럽게 감소하므로 노이즈가 많은 금융 시계열 평활화에 선호됩니다." },

{ k:"F1 Score 와 0 나누기", fn:"f1_score", cat:"debug",
  q:"<code>f1_score(y_true, y_pred)</code> 를 구현하세요. 이진 분류의 정밀도(Precision)와 재현율(Recall)의 조화평균입니다. TP, FP, FN 을 직접 세고, 분모가 0이 되어 지표를 정의할 수 없으면 0.0 처리 후 <code>round(v, 4)</code> 를 돌려줍니다. 아래 구현은 아무것도 맞추지 못했을 때 예외가 터집니다.",
  src:`def f1_score(y_true, y_pred):
    tp = fp = fn = 0
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1: tp += 1
        elif t == 0 and p == 1: fp += 1
        elif t == 1 and p == 0: fn += 1
    # TODO: 양성 예측이 전혀 없거나(Precision 0/0), 진짜 양성이 전혀 없으면(Recall 0/0)
    precision = tp / (tp + fp)
    recall = tp / (tp + fn)
    return round(2 * precision * recall / (precision + recall), 4)`,
  sol:`def f1_score(y_true, y_pred):
    tp = fp = fn = 0
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1:
            tp += 1
        elif t == 0 and p == 1:
            fp += 1
        elif t == 1 and p == 0:
            fn += 1
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    if precision + recall == 0:
        return 0.0
    return round(2 * precision * recall / (precision + recall), 4)`,
  tests:[
    ["f1_score([1, 0, 1, 1], [1, 0, 0, 1])","0.8"],
    ["f1_score([0, 0, 0], [1, 1, 1])","0.0"],
    ["f1_score([1, 1], [0, 0])","0.0"],
    ["f1_score([0, 0], [0, 0])","0.0"]],
  edge:[
    ["f1_score([1], [1])","1.0"]],
  ex:"🎯 데이터 불균형이 심할 때(예: 희귀병 진단, 불량품 탐지) 정확도(Accuracy)는 99% 라도 모델은 무가치할 수 있습니다. 그래서 양성(Positive) 예측에 초점을 맞춘 Precision 과 Recall 의 조화평균인 F1 Score 를 씁니다.\n⚠️ 이 구현의 가장 흔한 실수는 0 나누기(ZeroDivisionError) 방어를 잊는 것입니다. 두 번째 테스트처럼 모델이 양성을 한 번도 예측하지 않거나(tp+fp=0), 실제 양성이 아예 없거나(tp+fn=0), 둘 다 0이 되어 버리면 파이썬은 자비 없이 스크립트를 터뜨립니다. 파이프라인에서 수백 개의 배치를 돌리다 하나라도 0 이 나오면 학습이 통째로 멈춥니다.\n💡 산술평균이 아닌 조화평균을 쓰는 이유는, 한쪽이라도 낮으면 전체 점수를 가혹하게 깎아내리기 위해서입니다. Precision 1.0, Recall 0.1 이면 평균은 0.55 가 아니라 0.18 입니다. 모델이 꼼수를 쓰지 못하게 하는 페널티입니다.\n🔧 scikit-learn 의 `f1_score` 역시 이 0/0 상황에서 경고를 내고 0 을 반환(`zero_division=0` 기본값)합니다." },

{ k:"지니 불순도 (Gini Impurity)", fn:"gini_impurity", cat:"internals",
  q:"<code>gini_impurity(labels)</code> 를 구현하세요. 의사결정나무에서 노드의 불순도를 재는 지표로, 수식은 <code>1 - sum(p_i^2)</code> (p_i 는 각 클래스의 비율) 입니다. 결과는 <code>round(v, 4)</code> 이고, 입력이 비었으면 <code>0.0</code> 입니다. 아래 구현은 엔트로피와 헷갈렸습니다.",
  src:`def gini_impurity(labels):
    if not labels:
        return 0.0
    counts = {}
    for l in labels:
        counts[l] = counts.get(l, 0) + 1
    n = len(labels)
    # TODO: 지니 불순도는 1 - 확률의 제곱합이다
    import math
    imp = -sum((c / n) * math.log2(c / n) for c in counts.values())
    return round(imp, 4)`,
  sol:`def gini_impurity(labels):
    if not labels:
        return 0.0
    counts = {}
    for l in labels:
        counts[l] = counts.get(l, 0) + 1
    n = len(labels)
    imp = 1.0 - sum((c / n) ** 2 for c in counts.values())
    return round(imp, 4)`,
  tests:[
    ["gini_impurity(['A', 'A', 'A'])","0.0"],
    ["gini_impurity(['A', 'B'])","0.5"],
    ["gini_impurity(['A', 'B', 'B', 'C'])","0.625"],
    ["gini_impurity([])","0.0"]],
  edge:[
    ["gini_impurity(['X'])","0.0"]],
  ex:"🎯 지니 불순도는 트리 모델(Random Forest, XGBoost)이 가지를 칠 때 '얼마나 섞여 있는가' 를 판단하는 기준입니다. 한 클래스만 있으면 0 (완벽히 순수)이 되고, 여러 클래스가 골고루 섞일수록 값이 커집니다(최대 0.5 또는 1 - 1/k).\n💡 정보 이득을 구하는 엔트로피(Entropy)와 자주 비교됩니다. 버그 코드가 짠 것이 엔트로피인데, 로그($\\log_2$) 계산이 들어가서 상대적으로 연산이 무겁습니다. 반면 지니는 제곱 연산만 쓰기 때문에 빠르고, 결과 양상은 거의 비슷해 실무 트리 모델들의 기본 분할 기준으로 널리 쓰입니다.\n⚠️ 불순도 계산 자체는 간단하지만, 트리를 만들 때는 모든 특성과 분할 점에 대해 이 계산을 수만 번 반복해야 하므로 성능 최적화가 필수적입니다.\n🔧 특성 중요도(Feature Importance) 역시 이 지니 불순도의 감소량을 노드마다 누적해서 구하는 것입니다. 트리가 '이 특성 덕분에 얼마나 순수해졌는가' 가 곧 그 특성의 기여도가 됩니다." },

{ k:"저수지 샘플링 (Reservoir Sampling)", fn:"reservoir_sample", cat:"design",
  q:"<code>reservoir_sample(stream, k, seed)</code> 를 구현하세요. 길이를 미리 알 수 없는 데이터 스트림에서 <code>k</code> 개를 <b>균등한 확률</b>로 복원 없이 추출하는 온라인 알고리즘입니다. 처음 k 개는 채우고, <code>i</code> 번째 원소(i=0 부터)는 <code>0 ~ i</code> 사이의 난수 <code>j</code> 를 뽑아 <code>j < k</code> 이면 저수지의 <code>j</code> 번째를 교체합니다. 아래 구현은 교체 확률이 틀렸습니다.",
  src:`def reservoir_sample(stream, k, seed):
    import random
    random.seed(seed)
    res = []
    for i, item in enumerate(stream):
        if i < k:
            res.append(item)
        else:
            # TODO: i 번째 아이템이 선택될 확률이 k/(i+1) 이어야 한다
            j = random.randint(0, k)
            if j < k:
                res[j] = item
    return res`,
  sol:`def reservoir_sample(stream, k, seed):
    import random
    random.seed(seed)
    res = []
    for i, item in enumerate(stream):
        if i < k:
            res.append(item)
        else:
            j = random.randint(0, i)   # 0 부터 i 까지 (확률 k/(i+1))
            if j < k:
                res[j] = item
    return res`,
  tests:[
    ["reservoir_sample(list(range(10)), 3, 42)","[4, 1, 9]"],
    ["reservoir_sample(list(range(3)), 3, 42)","[0, 1, 2]"],
    ["reservoir_sample(list(range(5)), 5, 42)","[0, 1, 2, 3, 4]"],
    ["reservoir_sample([], 3, 42)","[]"]],
  edge:[
    ["reservoir_sample(list(range(100)), 1, 42)","[31]"]],
  ex:"🎯 데이터 엔지니어링의 마법 같은 알고리즘입니다. 테라바이트 급의 로그 파일이 쏟아질 때, 파일 끝까지 읽기 전에 미리 몇 개인지도 모르면서 딱 1000개를 고르게 뽑아내고 싶을 때 메모리를 O(k) 만 쓰고 해냅니다.\n⚠️ 난수의 범위를 `random.randint(0, k)` 로 잘못 잡으면, 새로운 요소가 무조건 큰 확률로 기존 데이터를 밀어내어 최근 데이터 편향(Recency bias)이 극심해집니다. `0 ~ i` 로 잡아야 $N$ 번째 요소가 선택될 확률이 $\\frac{k}{N}$ 으로 딱 떨어지고, 수학적 귀납법에 의해 이전 요소가 살아남을 확률도 최종적으로 $\\frac{k}{N}$ 으로 균등해집니다.\n💡 이 알고리즘은 분산 시스템에서도 빛을 발합니다. 맵리듀스에서 여러 파티션별로 독립적인 저수지를 만들고 마지막에 이들을 다시 합치는 식으로 분산 병렬 샘플링이 가능합니다.\n🔧 실무 사례: 로그 모니터링 데몬이 에러 로그를 무한정 버퍼에 쌓지 못할 때, 메모리 10MB 크기의 저수지를 열어두면 과거부터 지금까지의 대표적인 에러 패턴을 균등하게 유지하며 개발자에게 보여줄 수 있습니다." }

];
