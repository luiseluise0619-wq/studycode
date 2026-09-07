/* 통계 트랙 전용 프로젝트 — A/B 테스트 하나를 처음부터 끝까지.
   표본 크기 · 검정 · 신뢰구간 · 해석의 함정은 따로 배우면 흩어지지만,
   '이 버튼 색을 바꿀까' 하나를 끝까지 밀고 가면 한 줄에 꿰인다. */
module.exports = {
  lv: 2, em: "📊",
  title: "이 변경을 배포해도 되는가",
  desc: "A/B 테스트를 설계하고 필요한 표본 크기를 계산한 뒤, 결과를 검정하고 신뢰구간으로 읽어 배포 여부를 숫자로 판단한다",
  skills: ["stat", "python", "ml"],
  phases: [

  { t: "무엇을 재는지 먼저 못 박는다", type: "note",
    goal: "실험을 돌리기 전에 <b>지표·기준·기간</b>을 적으세요.\n'전환율이 오르는가' 로는 부족합니다. 어떤 전환을, 언제부터 언제까지, 얼마나 올라야 배포할 것인지 숫자로 정합니다.",
    ph: "예: 주지표 = 상세→결제 완료 전환율(현재 3.2%) · 배포 기준 = 상대 +5% 이상 · 부지표 = 객단가·이탈률(나빠지면 중단) · 기간 2주(주중·주말 모두 포함) · 유의수준 5% · 검정력 80% · 중간에 들여다보지 않는다" },

  { t: "표본이 얼마나 필요한가", type: "decide",
    goal: "'며칠이면 결과가 나올까요' 라는 질문을 받았습니다.",
    sit: "어떻게 답하시겠습니까?",
    opts: [
      { label: "현재 전환율·감지하려는 차이·유의수준·검정력으로 필요한 표본을 먼저 계산한다",
        fx: { algorithms: 3, communication: 2 },
        fb: "✅ 네 값이 정해지면 필요한 표본 수가 <b>계산으로 나옵니다.</b> 그리고 하루 트래픽으로 나누면 기간이 나옵니다. 순서를 이렇게 두면 '얼마나 걸리나' 와 '얼마나 작은 차이까지 볼 수 있나' 가 같은 질문이 되어, 기대를 미리 맞출 수 있습니다.",
        best: true },
      { label: "일단 일주일 돌려 보고 결과를 보며 더 돌릴지 정한다",
        fx: { algorithms: -3, leadership: -1 },
        fb: "⚠️ <b>들여다보면서 멈출 시점을 정하면</b> 우연히 벌어진 순간에 멈추게 됩니다. 이렇게 하면 실제 유의수준이 5%보다 훨씬 높아져, 아무 효과가 없어도 '유의하다' 는 결과가 자주 나옵니다." },
      { label: "통계적으로 유의해질 때까지 계속 돌린다",
        fx: { algorithms: -3, debugging: -1 },
        fb: "⚠️ 같은 문제의 더 나쁜 형태입니다. 효과가 0이어도 <b>계속 보다 보면 언젠가는 유의해집니다.</b> 멈출 규칙을 미리 정하지 않으면 p값은 뜻을 잃습니다." },
      { label: "다른 회사 사례에서 쓴 표본 수를 그대로 따른다",
        fx: { algorithms: -2 },
        fb: "⚠️ 필요한 표본은 <b>기준 전환율과 감지하려는 차이</b>에 따라 크게 달라집니다. 전환율 30% 서비스와 3% 서비스는 필요한 규모가 열 배 넘게 차이 납니다." }] },

  { t: "표본 크기를 계산한다", type: "build",
    goal: "정해 둔 네 값으로 <b>그룹당 필요한 표본 수</b>를 구하고, 하루 트래픽으로 나눠 기간을 내세요.\n감지하려는 차이를 바꿔 가며 표를 만들면 기대를 맞추기 쉽습니다.",
    hint: "두 비율을 견주는 검정의 표본 수는 기준 전환율과 감지하려는 차이, 유의수준, 검정력으로 정해집니다. 작은 차이를 보려 할수록 필요한 표본이 <b>제곱으로</b> 늘어납니다 — 절반 크기의 차이를 보려면 네 배가 필요합니다.",
    acc: "감지하려는 차이별 표본 수와 필요한 기간이 표로 출력되고, 정해 둔 기준(+5%)에 해당하는 줄이 표시되면 완료입니다.",
    lang: "python",
    sol: "import math\n\n# 정규분포 분위수 — 표를 외우지 않고 근사식으로 구한다\ndef z(p):\n    # Acklam 근사 대신 이분법으로 충분히 정확하게\n    lo, hi = -10.0, 10.0\n    for _ in range(200):\n        mid = (lo + hi) / 2\n        cdf = 0.5 * (1 + math.erf(mid / math.sqrt(2)))\n        if cdf < p:\n            lo = mid\n        else:\n            hi = mid\n    return (lo + hi) / 2\n\ndef sample_size(p0, lift, alpha=0.05, power=0.8):\n    \"\"\"그룹당 필요한 표본 수 (양측 검정, 두 비율 비교)\"\"\"\n    p1 = p0 * (1 + lift)\n    pbar = (p0 + p1) / 2\n    za = z(1 - alpha / 2)\n    zb = z(power)\n    num = (za * math.sqrt(2 * pbar * (1 - pbar))\n           + zb * math.sqrt(p0 * (1 - p0) + p1 * (1 - p1))) ** 2\n    return math.ceil(num / (p1 - p0) ** 2)\n\nP0 = 0.032          # 현재 전환율\nDAILY = 24_000      # 하루 방문 (두 그룹으로 나눠 쓴다)\n\nprint(f\"기준 전환율 {P0:.1%} · 하루 {DAILY:,}명 (그룹당 {DAILY // 2:,})\\n\")\nprint(\"감지할 차이   그룹당 표본     필요 기간\")\nfor lift in (0.20, 0.10, 0.05, 0.03, 0.02):\n    n = sample_size(P0, lift)\n    days = math.ceil(n / (DAILY / 2))\n    mark = \"  ← 정한 기준\" if abs(lift - 0.05) < 1e-9 else \"\"\n    print(f\"  상대 +{lift:.0%}      {n:>10,}     {days:>4}일{mark}\")\n\nprint(\"\\n차이가 절반이 되면 표본은 네 배가 필요하다 — 제곱으로 늘어난다.\")\nprint(\"기간이 감당 못 할 만큼 길면, 볼 수 있는 차이를 키우거나 실험을 접는다.\")" },

  { t: "결과를 검정한다", type: "build",
    goal: "실험이 끝난 뒤 두 그룹의 전환율을 검정하고, <b>차이의 신뢰구간</b>까지 함께 내세요.\np값 하나만 보고하지 말고 <b>얼마나 다른지</b>를 구간으로 말합니다.",
    hint: "p값은 '차이가 없다면 이만한 차이가 우연히 나올 확률' 이지 '효과가 있을 확률' 이 아닙니다. 실무 판단에는 <b>차이의 크기와 그 불확실성</b>이 필요하므로 신뢰구간을 함께 봐야 합니다.",
    acc: "두 그룹의 전환율·차이·p값·95% 신뢰구간이 모두 출력되고, 구간이 0을 포함하는지에 대한 해석이 붙어 있으면 완료입니다.",
    lang: "python",
    sol: "import math\n\ndef two_prop_test(x_a, n_a, x_b, n_b):\n    p_a, p_b = x_a / n_a, x_b / n_b\n    diff = p_b - p_a\n\n    # 검정 — 귀무가설(차이 없음) 아래의 합동 비율을 쓴다\n    p_pool = (x_a + x_b) / (n_a + n_b)\n    se_pool = math.sqrt(p_pool * (1 - p_pool) * (1 / n_a + 1 / n_b))\n    zstat = diff / se_pool\n    pval = 2 * (1 - 0.5 * (1 + math.erf(abs(zstat) / math.sqrt(2))))\n\n    # 구간 — 각 그룹의 실제 비율을 쓴다 (검정과 분모가 다르다)\n    se_diff = math.sqrt(p_a * (1 - p_a) / n_a + p_b * (1 - p_b) / n_b)\n    lo, hi = diff - 1.96 * se_diff, diff + 1.96 * se_diff\n    return p_a, p_b, diff, zstat, pval, lo, hi\n\n# 실험 결과\nN_A, X_A = 168_000, 5_376     # 대조군\nN_B, X_B = 167_400, 5_690     # 실험군\n\np_a, p_b, diff, zstat, pval, lo, hi = two_prop_test(X_A, N_A, X_B, N_B)\n\nprint(f\"대조군  {p_a:.4%}  ({X_A:,}/{N_A:,})\")\nprint(f\"실험군  {p_b:.4%}  ({X_B:,}/{N_B:,})\")\nprint(f\"\\n절대 차이  {diff * 100:+.3f}%p\")\nprint(f\"상대 차이  {diff / p_a:+.2%}\")\nprint(f\"z = {zstat:.3f}   p = {pval:.5f}\")\nprint(f\"95% 신뢰구간  [{lo * 100:+.3f}%p, {hi * 100:+.3f}%p]\")\n\nprint()\nif lo > 0:\n    print(\"구간이 0을 넘지 않는다 — 방향이 정해졌다.\")\nelif hi < 0:\n    print(\"구간이 전부 음수 — 나빠졌다고 볼 근거가 있다.\")\nelse:\n    print(\"구간이 0을 포함한다 — 방향을 말할 수 없다.\")\n\nprint(\"\\np값은 '효과가 있을 확률' 이 아니라\")\nprint(\"'차이가 없다면 이만한 차이가 우연히 나올 확률' 이다.\")" },

  { t: "지표 다섯 개 중 하나가 유의하다", type: "decide",
    goal: "주지표는 유의하지 않은데, 함께 본 부지표 다섯 개 중 하나가 p=0.03 으로 유의하게 나왔습니다.",
    sit: "어떻게 판단하시겠습니까?",
    opts: [
      { label: "여러 번 보면 우연히 유의한 것이 나오므로 그 결과만으로 결론짓지 않는다",
        fx: { algorithms: 3, communication: 2, leadership: 1 },
        fb: "✅ 지표를 여섯 개 보면 <b>효과가 전혀 없어도</b> 하나쯤 유의해 보일 확률이 26%에 이릅니다. 미리 정한 주지표로 판단하고, 부지표에서 나온 것은 <b>다음 실험의 가설</b>로 넘깁니다. 여러 지표를 정식으로 다루려면 유의수준을 나누는 보정을 씁니다.",
        best: true },
      { label: "유의한 지표가 하나라도 있으니 배포한다",
        fx: { algorithms: -3, leadership: -2 },
        fb: "⚠️ 이것을 반복하면 <b>거의 모든 실험이 성공</b>합니다. 실제로는 아무것도 나아지지 않는데 지표만 좋아 보이는 상태가 됩니다 — 실험 문화가 무너지는 전형적인 경로입니다." },
      { label: "주지표가 유의하지 않으니 실험은 실패로 기록하고 끝낸다",
        fx: { communication: -1 },
        fb: "⚠️ 판단은 맞지만 배울 것을 버립니다. 신뢰구간이 어디까지 걸쳐 있었는지, 표본이 모자랐던 것인지 효과가 없었던 것인지를 <b>구분해 기록</b>해야 다음 실험이 나아집니다." },
      { label: "표본을 더 모아 그 부지표가 계속 유의한지 본다",
        fx: { algorithms: -1 },
        fb: "⚠️ 이미 결과를 보고 더 모으는 것이라 같은 함정에 빠집니다. 그 가설을 확인하고 싶다면 <b>새 실험을 그 지표를 주지표로 삼아</b> 설계해야 합니다." }] },

  { t: "여러 번 보면 왜 위험한지 재어 본다", type: "build",
    goal: "효과가 <b>전혀 없는</b> 실험을 여러 번 반복해, 지표를 여럿 보거나 중간에 들여다볼 때 '유의하다' 가 얼마나 자주 나오는지 재세요.",
    hint: "두 그룹을 같은 분포에서 뽑으면 진짜 효과는 0입니다. 그래도 p&lt;0.05 가 5% 정도 나오는 것이 정상입니다. 지표를 늘리거나 중간에 여러 번 보면 그 비율이 얼마나 오르는지가 이 실험의 요점입니다.",
    acc: "지표 개수별·중간 확인 횟수별로 거짓 양성 비율이 출력되고, 5%에서 얼마나 올라가는지가 보이면 완료입니다.",
    lang: "python",
    sol: "import math\nimport random\n\nrandom.seed(20260907)\nP = 0.032          # 두 그룹 모두 같다 — 진짜 효과는 0이다\nN = 20_000         # 그룹당 표본\nTRIALS = 4000\n\ndef draw(n, p):\n    return sum(1 for _ in range(n) if random.random() < p)\n\ndef pvalue(x_a, n_a, x_b, n_b):\n    p_a, p_b = x_a / n_a, x_b / n_b\n    pool = (x_a + x_b) / (n_a + n_b)\n    se = math.sqrt(pool * (1 - pool) * (1 / n_a + 1 / n_b))\n    if se == 0:\n        return 1.0\n    zs = (p_b - p_a) / se\n    return 2 * (1 - 0.5 * (1 + math.erf(abs(zs) / math.sqrt(2))))\n\n# ── 지표를 여러 개 보면 ────────────────────────────────────\nprint(\"효과가 0인 실험을 반복했을 때 '유의하다' 가 나온 비율\\n\")\nprint(\"지표 수    거짓 양성    이론값\")\nfor k in (1, 3, 5, 10):\n    hit = 0\n    for _ in range(TRIALS):\n        if any(pvalue(draw(N, P), N, draw(N, P), N) < 0.05 for _ in range(k)):\n            hit += 1\n    theory = 1 - 0.95 ** k\n    print(f\"  {k:>2}       {hit / TRIALS:>7.1%}     {theory:>6.1%}\")\n\n# ── 중간에 여러 번 들여다보면 ─────────────────────────────\nprint(\"\\n중간 확인 횟수    거짓 양성\")\nfor peeks in (1, 2, 5, 10):\n    hit = 0\n    for _ in range(TRIALS // 4):\n        a = b = 0\n        step = N // peeks\n        found = False\n        for s in range(peeks):\n            a += draw(step, P)\n            b += draw(step, P)\n            n = step * (s + 1)\n            if pvalue(a, n, b, n) < 0.05:   # 유의해지면 멈춘다\n                found = True\n                break\n        hit += found\n    print(f\"      {peeks:>2}         {hit / (TRIALS // 4):>7.1%}\")\n\nprint(\"\\n멈출 규칙을 미리 정하지 않으면 p값은 뜻을 잃는다.\")" },

  { t: "결과를 사람에게 설명한다", type: "build",
    goal: "실험 결과를 <b>숫자를 모르는 사람도 판단할 수 있게</b> 정리하세요.\np값만 던지지 말고 '얼마나 좋아졌고 얼마나 확실한가' 를 문장으로 씁니다.",
    hint: "의사결정자가 알고 싶은 것은 '배포해도 되는가' 입니다. 상대 개선폭, 신뢰구간의 양 끝이 뜻하는 최선·최악, 그리고 그것이 정해 둔 기준을 넘는지를 붙여 주면 판단이 됩니다. 부지표가 나빠지지 않았는지도 함께 적습니다.",
    acc: "요약 문장·주지표 결과·구간 해석·부지표 확인·권고가 모두 담기고, 판단 기준과의 비교가 명시되면 완료입니다.",
    lang: "python",
    sol: "import math\n\ndef report(name, x_a, n_a, x_b, n_b, min_lift):\n    p_a, p_b = x_a / n_a, x_b / n_b\n    diff = p_b - p_a\n    se = math.sqrt(p_a * (1 - p_a) / n_a + p_b * (1 - p_b) / n_b)\n    lo, hi = diff - 1.96 * se, diff + 1.96 * se\n    lines = [\n        f\"[{name}]\",\n        f\"  대조 {p_a:.3%} → 실험 {p_b:.3%}   (상대 {diff / p_a:+.1%})\",\n        f\"  95% 구간(상대): {lo / p_a:+.1%} ~ {hi / p_a:+.1%}\",\n    ]\n    if lo / p_a >= min_lift:\n        lines.append(f\"  → 최악으로 봐도 +{lo / p_a:.1%}. 기준 +{min_lift:.0%} 를 넘는다.\")\n        verdict = \"배포\"\n    elif hi / p_a < 0:\n        lines.append(\"  → 구간이 전부 음수. 나빠졌다고 볼 근거가 있다.\")\n        verdict = \"중단\"\n    elif lo > 0:\n        lines.append(f\"  → 좋아진 방향은 분명하나 최악의 경우 +{lo / p_a:.1%} 로 기준에 못 미친다.\")\n        verdict = \"보류\"\n    else:\n        lines.append(\"  → 구간이 0을 걸친다. 방향을 말할 수 없다.\")\n        verdict = \"보류\"\n    return \"\\n\".join(lines), verdict\n\nmain, v = report(\"주지표 · 결제 전환율\", 5_376, 168_000, 5_690, 167_400, 0.05)\nsub1, _ = report(\"부지표 · 장바구니 담기\", 21_840, 168_000, 22_150, 167_400, 0.0)\nsub2, _ = report(\"부지표 · 첫 화면 이탈\", 63_840, 168_000, 63_200, 167_400, 0.0)\n\nprint(\"■ 요약\")\nprint(f\"  2주 · 그룹당 약 16.8만 명 · 사전에 정한 기준은 상대 +5%\")\nprint(f\"  판단: {v}\\n\")\nprint(main, \"\\n\")\nprint(sub1, \"\\n\")\nprint(sub2)\nprint(\"\\n■ 남는 말\")\nprint(\"  · 유의수준 5%·검정력 80% 로 설계했고 중간에 들여다보지 않았다.\")\nprint(\"  · 부지표는 참고용이다. 여기서 나온 것은 다음 실험의 가설로 넘긴다.\")\nprint(\"  · p값은 효과가 있을 확률이 아니다. 판단 근거는 구간이다.\")" },

  { t: "실험을 기록으로 남긴다", type: "note",
    goal: "이 실험을 <b>다음 사람이 읽고 판단을 재현할 수 있게</b> 적으세요.\n결과보다 <b>사전에 무엇을 정했는지</b>가 더 중요합니다 — 그것이 결과를 믿을 수 있게 만드는 근거입니다.",
    ph: "예: 가설·주지표·기준(+5%)·기간·유의수준·검정력을 시작 전에 정함(문서 링크) / 결과 상대 +5.8%, 95% 구간 +1.2%~+10.6% / 판단 배포 — 최악으로 봐도 기준을 넘음 / 부지표 이상 없음 / 배운 것: 필요한 표본을 먼저 계산했더니 '2주 안에 볼 수 있는 차이는 5% 이상' 이 분명해져 기대 조율이 쉬웠다 / 남은 의문: 신규·재방문을 나눠 보지 않았다, 다음 실험에서 층화" }

]};
