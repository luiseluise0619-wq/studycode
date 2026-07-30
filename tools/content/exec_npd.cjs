/* NumPy·pandas 실행형 12문항 — 라이브러리를 부르지 않고 그 '의미' 를 순수 파이썬으로 만든다.
   브로드캐스팅·스트라이드·축·dtype 래핑, 그리고 조인·그룹·피벗·롤링의 규칙.
   앞 6문항은 numpy, 뒤 6문항은 pandas 트랙으로 간다. */

module.exports=[

/* ══ numpy ══ */
{ k:"브로드캐스팅 모양 규칙", fn:"broadcast_shape", cat:"internals",
  q:"두 배열 모양이 브로드캐스팅되는 결과 모양을 돌려주는 <code>broadcast_shape(a, b)</code> 를 구현하세요. 규칙은 <b>뒤에서부터 축을 맞추고</b>, 각 축은 <b>같거나 한쪽이 1</b> 이어야 하며(1 인 쪽이 늘어남), 축 수가 다르면 짧은 쪽 앞을 1 로 채웁니다. 맞출 수 없으면 <code>None</code> 입니다. 아래 구현은 축을 앞에서부터 맞춥니다.",
  src:`def broadcast_shape(a, b):
    # TODO: 뒤에서부터 맞춰야 한다
    ra, rb = list(a), list(b)
    n = max(len(ra), len(rb))
    out = []
    for i in range(n):
        x = ra[i] if i < len(ra) else 1
        y = rb[i] if i < len(rb) else 1
        if x == y:
            out.append(x)
        elif x == 1:
            out.append(y)
        elif y == 1:
            out.append(x)
        else:
            return None
    return tuple(out)`,
  sol:`def broadcast_shape(a, b):
    ra, rb = list(a)[::-1], list(b)[::-1]     # 뒤에서부터
    n = max(len(ra), len(rb))
    out = []
    for i in range(n):
        x = ra[i] if i < len(ra) else 1       # 없는 축은 1 로 본다
        y = rb[i] if i < len(rb) else 1
        if x == y:
            out.append(x)
        elif x == 1:
            out.append(y)
        elif y == 1:
            out.append(x)
        else:
            return None
    return tuple(out[::-1])`,
  tests:[
    ["broadcast_shape((3, 1), (1, 4))","(3, 4)"],
    ["broadcast_shape((5,), (3, 5))","(3, 5)"],
    ["broadcast_shape((2, 3), (3, 2))","None"],
    ["broadcast_shape((), (2, 3))","(2, 3)"],
    ["broadcast_shape((4, 1, 3), (2, 3))","(4, 2, 3)"]],
  edge:[
    ["broadcast_shape((3,), (4,))","None"],
    ["broadcast_shape((1,), (1,))","(1,)"]],
  ex:"🎯 브로드캐스팅 규칙의 전부는 '**뒤에서부터 맞추고, 같거나 1**' 입니다. 뒤에서부터인 이유는 관례가 아니라 메모리 배치 때문입니다 — C 순서에서 마지막 축이 연속으로 놓이므로, 뒤쪽 축을 맞추면 데이터를 복사하지 않고 stride 를 0 으로 두어 '같은 값을 반복해 읽는' 것으로 확장할 수 있습니다.\n⚠️ 앞에서 맞추는 구현은 `(5,)` 와 `(3,5)` 에서 어긋납니다 — 실제로는 5가 마지막 축과 맞아 `(3,5)` 가 되지만, 앞에서 맞추면 5와 3이 부딪혀 실패합니다. 이것이 '왜 `(3,5)` 배열에 `(5,)` 는 더할 수 있고 `(3,)` 은 못 더하는가' 의 답입니다.\n💡 그래서 `(3,)` 을 열 방향으로 더하려면 `arr + v[:, None]` 로 **모양을 `(3,1)` 로 만들어** 뒤쪽 축을 1 로 두어야 합니다. `None`(=`np.newaxis`) 을 넣는 관용구가 이 규칙에서 나옵니다.\n🔧 브로드캐스팅이 조용히 잘못 동작하는 대표 사례: `(n,1)` 과 `(n,)` 을 더하면 오류가 아니라 `(n,n)` 행렬이 됩니다. 예측값과 정답의 모양을 확인하지 않고 손실을 계산하면 n² 개의 차이를 평균해 **엉뚱한 손실**이 나오는데, 숫자가 그럴듯해 몇 시간을 잃습니다 — `assert pred.shape == y.shape` 한 줄이 이것을 막습니다." },

{ k:"C 순서 스트라이드", fn:"c_strides", cat:"internals",
  q:"<code>c_strides(shape, itemsize)</code> 를 구현하세요. C 순서(행 우선)에서 각 축의 <b>바이트 스트라이드</b>를 돌려줍니다 — 마지막 축이 <code>itemsize</code> 이고, 앞으로 갈수록 뒤 축들의 크기를 누적해 곱합니다. <code>itemsize</code> 가 0 이하면 <code>()</code> 입니다. 아래 구현은 Fortran 순서로 계산합니다.",
  src:`def c_strides(shape, itemsize):
    if itemsize <= 0:
        return ()
    # TODO: C 순서는 마지막 축이 가장 촘촘하다
    out, acc = [], itemsize
    for s in shape:
        out.append(acc)
        acc *= s
    return tuple(out)`,
  sol:`def c_strides(shape, itemsize):
    if itemsize <= 0:
        return ()
    out = [0] * len(shape)
    acc = itemsize
    for i in range(len(shape) - 1, -1, -1):   # 뒤에서 앞으로
        out[i] = acc
        acc *= shape[i]
    return tuple(out)`,
  tests:[
    ["c_strides((2, 3, 4), 8)","(96, 32, 8)"],
    ["c_strides((5,), 4)","(4,)"],
    ["c_strides((3, 3), 1)","(3, 1)"],
    ["c_strides((), 8)","()"],
    ["c_strides((2, 2), 0)","()"]],
  edge:[
    ["c_strides((1, 1), 8)","(8, 8)"],
    ["c_strides((10, 1), 4)","(4, 4)"]],
  ex:"🎯 스트라이드는 '**그 축으로 한 칸 움직이려면 몇 바이트를 건너뛰어야 하는가**' 입니다. C 순서에서는 마지막 축이 연속이라 스트라이드가 `itemsize` 이고, 앞 축은 뒤 축들의 크기를 곱한 값입니다 — `(2,3,4)` float64 라면 행 하나가 4×8=32 바이트, 면 하나가 3×32=96 바이트입니다.\n💡 이 개념을 알면 numpy 의 여러 동작이 한꺼번에 설명됩니다. **전치(`.T`)가 공짜인 이유**는 데이터를 옮기지 않고 스트라이드 순서만 뒤집기 때문이고, **`reshape` 이 때로 복사를 하는 이유**는 원하는 모양을 기존 스트라이드로 표현할 수 없을 때가 있기 때문입니다. 전치한 배열에 `reshape` 을 걸면 복사가 일어나는 것이 그 경우입니다.\n⚠️ 성능에도 직결됩니다 — 행 방향 순회(`for row in arr`)는 연속 메모리를 읽어 캐시 적중률이 높지만, 열 방향은 매번 큰 폭으로 건너뛰어 느립니다. 같은 연산이 축에 따라 몇 배 차이 나는 이유가 이것입니다.\n🔧 마지막 edge 테스트가 흥미롭습니다: 크기 1 인 축의 스트라이드는 **의미가 없습니다**(그 축으로 움직일 수 없으므로). numpy 는 여기에 임의의 값을 넣거나 0 을 두기도 하며, 브로드캐스팅이 바로 이 자리에 0 을 넣어 '움직여도 같은 값' 을 만드는 기법입니다." },

{ k:"평탄 인덱스 계산", fn:"flat_index", cat:"internals",
  q:"<code>flat_index(shape, idx)</code> 를 구현하세요. 다차원 인덱스를 C 순서의 <b>1차원 위치</b>로 바꿉니다. 축 수가 다르거나 인덱스가 범위를 벗어나면 <code>-1</code> 입니다. 아래 구현은 누적 방식이 틀렸습니다.",
  src:`def flat_index(shape, idx):
    if len(shape) != len(idx):
        return -1
    flat = 0
    for s, i in zip(shape, idx):
        if i < 0 or i >= s:
            return -1
        # TODO: 누적 순서가 뒤집혀 있다
        flat += i * s
    return flat`,
  sol:`def flat_index(shape, idx):
    if len(shape) != len(idx):
        return -1
    flat = 0
    for s, i in zip(shape, idx):
        if i < 0 or i >= s:
            return -1
        flat = flat * s + i        # 자릿수 올림과 같은 계산
    return flat`,
  tests:[
    ["flat_index((2, 3), (1, 2))","5"],
    ["flat_index((2, 3), (0, 0))","0"],
    ["flat_index((2, 3), (1, 3))","-1"],
    ["flat_index((2, 3, 4), (1, 2, 3))","23"],
    ["flat_index((2, 3), (1,))","-1"]],
  edge:[
    ["flat_index((2, 3), (-1, 0))","-1"],
    ["flat_index((2, 3), (1, 2)) == 2 * 3 - 1","True"]],
  ex:"🎯 이 계산은 **자릿수 올림과 똑같습니다** — 십진수 `123` 이 `((1×10)+2)×10+3` 인 것처럼, 인덱스 `(1,2,3)` 은 `((1×3)+2)×4+3` 입니다. 각 축의 '진법' 이 그 축의 크기라는 것만 다릅니다.\n⚠️ `flat = flat * s + i` 와 `flat += i * s` 는 비슷해 보이지만 완전히 다릅니다. 후자는 축 크기를 그 축의 인덱스에 곱하는 것이라 아무 의미가 없는데, **결과가 여전히 그럴듯한 정수**라서 작은 배열에서는 우연히 맞기도 합니다.\n💡 마지막 edge 테스트가 불변식을 확인합니다 — 마지막 원소의 평탄 인덱스는 항상 `전체 개수 − 1` 입니다. 이런 '경계에서 성립해야 하는 등식' 을 테스트로 두면 계산식 오류가 즉시 드러납니다.\n🔧 반대 방향(`unravel_index`)은 나머지 연산으로 뒤에서부터 벗겨 냅니다. 두 함수는 **평탄한 인덱스를 다차원으로 다루는 모든 코드**의 기초이며, GPU 커널에서 스레드 ID 를 좌표로 바꾸거나 이미지 배치를 1차원 버퍼에 담을 때 직접 쓰게 됩니다. 음수 인덱스를 거부한 것도 의도적입니다 — numpy 는 음수를 뒤에서 세지만, 그 편의가 오프바이원 버그를 조용히 감추는 자리가 많습니다." },

{ k:"축(axis)의 의미", fn:"reduce_axis", cat:"debug",
  q:"2차원 리스트의 합을 구하는 <code>reduce_axis(mat, axis)</code> 를 구현하세요. <code>axis=0</code> 은 <b>행 방향으로 접어</b> 열마다 하나의 값(결과 길이 = 열 수), <code>axis=1</code> 은 <b>열 방향으로 접어</b> 행마다 하나의 값(결과 길이 = 행 수)입니다. 그 밖의 <code>axis</code> 나 빈 입력은 <code>[]</code> 입니다. 아래 구현은 두 축이 뒤바뀌었습니다.",
  src:`def reduce_axis(mat, axis):
    if not mat:
        return []
    # TODO: axis 는 '없어지는 축' 이다
    if axis == 0:
        return [sum(row) for row in mat]
    if axis == 1:
        cols = len(mat[0])
        return [sum(row[j] for row in mat) for j in range(cols)]
    return []`,
  sol:`def reduce_axis(mat, axis):
    if not mat:
        return []
    if axis == 1:
        return [sum(row) for row in mat]           # 행마다 하나
    if axis == 0:
        cols = len(mat[0])
        return [sum(row[j] for row in mat) for j in range(cols)]   # 열마다 하나
    return []`,
  tests:[
    ["reduce_axis([[1, 2, 3], [4, 5, 6]], 0)","[5, 7, 9]"],
    ["reduce_axis([[1, 2, 3], [4, 5, 6]], 1)","[6, 15]"],
    ["len(reduce_axis([[1, 2, 3], [4, 5, 6]], 0))","3"],
    ["reduce_axis([], 0)","[]"],
    ["reduce_axis([[1, 2]], 2)","[]"]],
  edge:[
    ["reduce_axis([[1], [2], [3]], 0)","[6]"],
    ["reduce_axis([[1], [2], [3]], 1)","[1, 2, 3]"]],
  ex:"🎯 `axis` 를 외우는 유일하게 안 헷갈리는 방법: **`axis` 는 없어지는 축**입니다. `(2,3)` 배열에 `axis=0` 을 걸면 0번 축(길이 2)이 사라져 결과가 `(3,)` 이고, `axis=1` 이면 `(2,)` 입니다. '행 방향으로 더한다' 같은 말은 사람마다 반대로 해석하므로 쓰지 않는 편이 낫습니다.\n⚠️ 두 축을 뒤바꾼 버그는 **정사각 행렬에서는 개수가 같아 통과합니다**. `(3,3)` 으로만 테스트하면 영원히 발견하지 못하고, 실제 데이터가 `(1000, 5)` 가 되는 순간 결과가 5개가 아니라 1000개로 나오며 다음 단계에서 모양 오류가 납니다 — 그것도 몇 단계 뒤에서.\n💡 세 번째 테스트가 그래서 **길이를 직접 셉니다**. 축 관련 버그를 잡는 테스트는 반드시 **행과 열의 수가 다른** 입력을 써야 하고, 결과의 모양을 단정해야 합니다.\n🔧 pandas 에서는 같은 규칙이 `axis=0`(index 방향, 열마다 집계) / `axis=1`(columns 방향, 행마다 집계)로 이어지는데, `drop(axis=1)` 처럼 '없어지는 축' 해석과 잘 맞는 API 와 `apply(axis=1)` 처럼 '따라 움직이는 축' 으로 읽히는 API 가 섞여 있어 더 헷갈립니다. 확신이 없으면 **작은 비정사각 예제로 한 번 돌려 보는 것**이 가장 빠릅니다." },

{ k:"argsort 는 인덱스를 준다", fn:"argsort_stable", cat:"debug",
  q:"<code>argsort_stable(xs)</code> 를 구현하세요. 값이 <b>오름차순이 되도록 하는 인덱스</b> 목록을 돌려주고, 값이 같으면 <b>원래 인덱스 순서</b>를 유지합니다. 아래 구현은 인덱스가 아닌 것을 돌려줍니다.",
  src:`def argsort_stable(xs):
    # TODO: argsort 는 값이 아니라 순서를 돌려준다
    return sorted(xs)`,
  sol:`def argsort_stable(xs):
    return sorted(range(len(xs)), key=lambda i: (xs[i], i))`,
  tests:[
    ["argsort_stable([3, 1, 2])","[1, 2, 0]"],
    ["argsort_stable([1, 1, 1])","[0, 1, 2]"],
    ["argsort_stable([2, 1, 2, 1])","[1, 3, 0, 2]"],
    ["argsort_stable([])","[]"],
    ["[[3, 1, 2][i] for i in argsort_stable([3, 1, 2])]","[1, 2, 3]"]],
  edge:[
    ["argsort_stable([5])","[0]"],
    ["[['c', 'a', 'b'][i] for i in argsort_stable([2, 0, 1])]","['a', 'b', 'c']"]],
  ex:"🎯 argsort 가 값이 아니라 **인덱스**를 돌려주는 이유는, 그 인덱스로 **다른 배열을 함께 정렬**할 수 있기 때문입니다. 마지막 edge 테스트가 그 용도입니다 — 점수로 정렬한 순서를 이름 배열에 적용해 '점수 순 이름 목록' 을 얻습니다. 값만 정렬하면 어느 이름이 어느 점수였는지 잃습니다.\n⚠️ 그래서 `sorted(xs)` 를 돌려주는 실수는 **결과가 정상적인 정렬된 리스트**라서 다섯 번째 테스트 같은 '인덱스로 써 보는' 검증이 없으면 통과합니다. 실제로는 인덱스 자리에 값이 들어가 `IndexError` 가 나거나, 값이 우연히 유효한 인덱스 범위면 **조용히 엉뚱한 원소**를 집습니다.\n💡 안정성(동점의 원래 순서 유지)이 필요한 이유는 **여러 키로 나눠 정렬**하기 위해서입니다. 먼저 이름으로 정렬하고 그다음 점수로 정렬하면 '점수 같으면 이름 순' 이 되는데, 안정 정렬이 아니면 이 방식이 성립하지 않습니다. 세 번째 테스트가 동점(값 1 이 인덱스 1·3, 값 2 가 0·2)에서 순서를 확인합니다.\n🔧 numpy 의 기본 `argsort` 는 quicksort 라 **안정적이지 않습니다** — 안정성이 필요하면 `kind='stable'` 을 명시해야 합니다. 이것을 모르고 다단 정렬을 하면 실행할 때마 결과가 달라지는 재현 불가능한 버그가 되고, 페이지네이션에서 행이 중복되거나 사라집니다." },

{ k:"int8 오버플로 래핑", fn:"int8_add", cat:"debug",
  q:"<code>int8_add(xs, k)</code> 를 구현하세요. 각 값에 <code>k</code> 를 더한 결과를 <b><code>int8</code> 범위(−128 ~ 127)로 래핑</b>해 돌려줍니다. 아래 구현은 파이썬 정수가 무한 정밀도라는 사실에 기대고 있습니다.",
  src:`def int8_add(xs, k):
    # TODO: 파이썬 int 는 넘치지 않지만 int8 은 넘친다
    return [x + k for x in xs]`,
  sol:`def int8_add(xs, k):
    # 128 을 더해 0 기준으로 옮기고, 256 으로 감싼 뒤 되돌린다
    return [((x + k + 128) % 256) - 128 for x in xs]`,
  tests:[
    ["int8_add([127], 1)","[-128]"],
    ["int8_add([0], 0)","[0]"],
    ["int8_add([-128], -1)","[127]"],
    ["int8_add([100, -100], 50)","[-106, -50]"],
    ["int8_add([], 5)","[]"]],
  edge:[
    ["int8_add([127, 127], 1)","[-128, -128]"],
    ["int8_add([50], 300)","[94]"]],
  ex:"🎯 파이썬 정수는 무한 정밀도라 절대 넘치지 않지만, **numpy 배열은 고정 폭 dtype** 이라 넘칩니다. 그리고 numpy 의 기본 동작은 예외가 아니라 **조용한 래핑**입니다 — `np.int8(127) + 1` 은 `-128` 이고 경고도 나지 않습니다(최근 버전은 스칼라에 대해 경고를 내지만 배열 연산은 여전히 조용합니다).\n⚠️ 이것이 실무에서 만드는 사고: 이미지를 `uint8` 로 읽어 밝기를 더하면 밝은 픽셀이 **검게** 변합니다(255+10 → 5). 카운터를 `int16` 으로 두고 누적하면 32767 을 넘는 순간 음수가 되어 합계가 갑자기 마이너스가 됩니다. 둘 다 오류 없이 진행되므로 결과를 눈으로 보기 전까지 모릅니다.\n💡 래핑 공식 `((x + 128) % 256) - 128` 은 '**부호 있는 범위를 0 기준으로 옮겨 감싸고 되돌리는**' 관용구입니다. 파이썬의 `%` 가 음수에 대해 항상 양수를 돌려주기 때문에(C 와 다릅니다) 이 식이 음수 입력에서도 그대로 동작합니다 — 세 번째 테스트가 그 경우입니다.\n🔧 방어법: 계산 전에 `.astype(np.int32)` 로 넓히거나, `np.add(a, b, dtype=np.int64)` 로 결과 타입을 지정하거나, 클리핑이 맞는 의미라면 `np.clip` 을 명시적으로 씁니다. 그리고 `np.seterr` 로 오버플로를 경고나 예외로 올릴 수 있는데, **수치 파이프라인에서는 켜 두는 편이 안전합니다**." },

/* ══ pandas ══ */
{ k:"내부 조인과 행 폭발", fn:"merge_inner", cat:"design",
  q:"<code>merge_inner(left, right, key)</code> 를 구현하세요. 두 dict 리스트를 <code>key</code> 로 <b>내부 조인</b>해 합친 dict 목록을 돌려줍니다. 순서는 왼쪽 순서, 같은 왼쪽 행 안에서는 오른쪽 순서이고, <b>겹치는 컬럼은 오른쪽 값이 이깁니다</b>. <code>key</code> 가 없는 왼쪽 행은 건너뜁니다. 아래 구현은 짝이 여러 개일 때 하나만 씁니다.",
  src:`def merge_inner(left, right, key):
    idx = {}
    for r in right:
        idx.setdefault(r.get(key), r)      # TODO: 같은 키의 오른쪽 행이 여러 개면?
    out = []
    for l in left:
        if key not in l:
            continue
        r = idx.get(l[key])
        if r is None:
            continue
        merged = dict(l)
        merged.update(r)
        out.append(merged)
    return out`,
  sol:`def merge_inner(left, right, key):
    out = []
    for l in left:
        if key not in l:
            continue
        for r in right:
            if r.get(key) == l[key]:
                merged = dict(l)
                merged.update(r)          # 겹치는 컬럼은 오른쪽이 이긴다
                out.append(merged)
    return out`,
  tests:[
    ["merge_inner([{'id': 1, 'a': 'x'}], [{'id': 1, 'b': 'y'}], 'id')","[{'id': 1, 'a': 'x', 'b': 'y'}]"],
    ["len(merge_inner([{'id': 1}], [{'id': 1, 'v': 1}, {'id': 1, 'v': 2}], 'id'))","2"],
    ["len(merge_inner([{'id': 1}, {'id': 1}], [{'id': 1}, {'id': 1}], 'id'))","4"],
    ["merge_inner([{'id': 1}], [{'id': 2}], 'id')","[]"],
    ["merge_inner([], [{'id': 1}], 'id')","[]"]],
  edge:[
    ["merge_inner([{'id': 1, 'v': 1}], [{'id': 1, 'v': 9}], 'id')","[{'id': 1, 'v': 9}]"],
    ["[r['v'] for r in merge_inner([{'id': 1}], [{'id': 1, 'v': 1}, {'id': 1, 'v': 2}], 'id')]","[1, 2]"]],
  ex:"🎯 조인의 가장 큰 함정은 '**행 수가 늘어나는 것**' 입니다. 키가 양쪽에서 유일하면 결과는 최대 왼쪽 행 수지만, 오른쪽에 같은 키가 2개 있으면 왼쪽 행이 2개로 복제됩니다 — 세 번째 테스트처럼 양쪽에 2개씩이면 **2×2 = 4행**입니다.\n⚠️ 그래서 '**조인 뒤에 합계를 내는 코드**' 는 항상 의심해야 합니다. 주문에 배송 이력을 조인하고 금액을 SUM 하면, 배송이 두 번 있던 주문의 금액이 두 번 더해집니다. 결과는 그럴듯한 숫자라서 검증 없이는 발견되지 않고, 대개 재무 대조에서 뒤늦게 드러납니다.\n💡 첫 번째 방어는 **조인 전후 행 수를 확인**하는 것입니다: `assert len(after) == len(before)` 를 넣거나, pandas 라면 `merge(..., validate='one_to_one')`·`'many_to_one'` 으로 관계를 선언해 어기면 예외가 나게 합니다. 선언한 관계가 깨졌다는 것은 대개 **데이터에 대한 이해가 틀렸다**는 신호입니다.\n⚠️ 두 번째 함정은 겹치는 컬럼입니다. 양쪽에 `v` 가 있으면 어느 쪽이 남는지가 조용히 결정됩니다 — 여기서는 오른쪽이 이기게 정했지만, pandas 는 `_x`/`_y` 접미사를 붙여 **둘 다 남기고 사람이 고르게** 만듭니다. 그쪽이 더 안전한 기본값입니다." },

{ k:"왼쪽 조인은 행을 지키지 않는다", fn:"left_join", cat:"internals",
  q:"<code>left_join(left, right, key, fill=None)</code> 을 구현하세요. 왼쪽 행은 <b>짝이 없어도 남기고</b>, 오른쪽에서 온 컬럼(<code>right</code> 전체에 등장하는 <code>key</code> 이외의 컬럼)을 <code>fill</code> 로 채웁니다. 짝이 여러 개면 <b>그만큼 행이 늘어납니다</b>. 아래 구현은 짝 없는 행을 버립니다.",
  src:`def left_join(left, right, key, fill=None):
    cols = []
    for r in right:
        for c in r:
            if c != key and c not in cols:
                cols.append(c)
    idx = {}
    for r in right:
        idx.setdefault(r.get(key), []).append(r)
    out = []
    for l in left:
        ms = idx.get(l.get(key))
        # TODO: 짝이 없을 때 왼쪽 행을 어떻게 해야 하는가
        if not ms:
            continue
        for r in ms:
            row = dict(l)
            row.update(r)
            for c in cols:
                row.setdefault(c, fill)
            out.append(row)
    return out`,
  sol:`def left_join(left, right, key, fill=None):
    cols = []
    for r in right:
        for c in r:
            if c != key and c not in cols:
                cols.append(c)
    idx = {}
    for r in right:
        idx.setdefault(r.get(key), []).append(r)
    out = []
    for l in left:
        ms = idx.get(l.get(key))
        if not ms:
            row = dict(l)
            for c in cols:
                row.setdefault(c, fill)   # 짝이 없어도 남긴다
            out.append(row)
            continue
        for r in ms:
            row = dict(l)
            row.update(r)
            for c in cols:
                row.setdefault(c, fill)
            out.append(row)
    return out`,
  tests:[
    ["left_join([{'id': 1}, {'id': 2}], [{'id': 1, 'v': 10}], 'id')","[{'id': 1, 'v': 10}, {'id': 2, 'v': None}]"],
    ["len(left_join([{'id': 1}], [{'id': 1, 'v': 1}, {'id': 1, 'v': 2}], 'id'))","2"],
    ["left_join([{'id': 2}], [{'id': 1, 'v': 10}], 'id', 0)","[{'id': 2, 'v': 0}]"],
    ["left_join([{'id': 3}], [], 'id')","[{'id': 3}]"],
    ["left_join([], [{'id': 1, 'v': 1}], 'id')","[]"]],
  edge:[
    ["len(left_join([{'id': 1}, {'id': 9}], [{'id': 1, 'v': 1}, {'id': 1, 'v': 2}], 'id'))","3"],
    ["left_join([{'id': 1, 'v': 1}], [{'id': 1, 'v': 9}], 'id')","[{'id': 1, 'v': 9}]"]],
  ex:"🎯 '왼쪽 조인이니까 행 수가 유지된다' 는 가장 흔한 오해입니다. 왼쪽 조인이 보장하는 것은 '**왼쪽 행이 최소 한 번 나타난다**' 뿐이고, 오른쪽에 짝이 여러 개면 그만큼 늘어납니다 — 첫 edge 테스트가 그 조합입니다(짝 2개인 행 + 짝 없는 행 = 3행).\n⚠️ 반대 방향 실수는 짝 없는 행이 조용히 사라지는 것입니다. 전체 사용자에 결제 이력을 조인해 '사용자별 매출' 을 만들 때 내부 조인을 쓰면 **결제하지 않은 사용자가 통째로 빠져** 평균 매출이 부풀려집니다. 결과가 여전히 표라서 눈에 띄지 않습니다.\n💡 채움 값을 무엇으로 두는지도 결정입니다. `None`(NaN)으로 두면 이후 집계에서 자동으로 제외되고, `0` 으로 두면 '결제 0원' 으로 계산에 참여합니다 — **'모른다' 와 '0 이다' 는 다르며**, 어느 쪽이 맞는지는 도메인이 정합니다. 세 번째 테스트에서 `fill` 을 인자로 뺀 이유입니다.\n🔧 실무 습관: 조인 뒤 `len()` 을 비교하는 단정, pandas 의 `indicator=True` 로 어느 쪽에서 왔는지 표시하기, 그리고 매칭률을 로그에 남기기(`매칭 98.2%` 가 갑자기 60% 가 되면 상류 데이터가 바뀐 것입니다)." },

{ k:"그룹 집계와 결측값", fn:"group_agg", cat:"debug",
  q:"<code>group_agg(rows, by, col, how)</code> 를 구현하세요. <code>by</code> 컬럼으로 묶어 <code>col</code> 을 집계하며, <code>how</code> 는 <code>'sum'</code>·<code>'mean'</code>·<code>'count'</code> 입니다. <b><code>None</code> 값은 집계에서 제외</b>하고(count 는 <code>None</code> 이 아닌 개수), 그룹의 값이 전부 <code>None</code> 이면 sum 은 <code>0</code>, mean 은 <code>None</code> 입니다. 키는 정렬해 담고, 모르는 <code>how</code> 는 <code>{}</code> 입니다. 아래 구현은 결측을 0으로 셉니다.",
  src:`def group_agg(rows, by, col, how):
    buckets = {}
    for r in rows:
        buckets.setdefault(r.get(by), []).append(r.get(col))
    out = {}
    for k in sorted(buckets, key=lambda x: (x is None, x)):
        # TODO: None 을 0 으로 바꾸면 개수와 평균이 틀어진다
        vals = [0 if v is None else v for v in buckets[k]]
        if how == 'count':
            out[k] = len(vals)
        elif how == 'sum':
            out[k] = sum(vals)
        elif how == 'mean':
            out[k] = sum(vals) / len(vals) if vals else None
        else:
            return {}
    return out`,
  sol:`def group_agg(rows, by, col, how):
    buckets = {}
    for r in rows:
        buckets.setdefault(r.get(by), []).append(r.get(col))
    out = {}
    for k in sorted(buckets, key=lambda x: (x is None, x)):
        vals = [v for v in buckets[k] if v is not None]   # 결측은 제외
        if how == 'count':
            out[k] = len(vals)
        elif how == 'sum':
            out[k] = sum(vals)
        elif how == 'mean':
            out[k] = (sum(vals) / len(vals)) if vals else None
        else:
            return {}
    return out`,
  tests:[
    ["group_agg([{'g': 'a', 'v': 1}, {'g': 'a', 'v': None}, {'g': 'b', 'v': 4}], 'g', 'v', 'sum')","{'a': 1, 'b': 4}"],
    ["group_agg([{'g': 'a', 'v': 1}, {'g': 'a', 'v': None}], 'g', 'v', 'count')","{'a': 1}"],
    ["group_agg([{'g': 'a', 'v': 1}, {'g': 'a', 'v': 3}], 'g', 'v', 'mean')","{'a': 2.0}"],
    ["group_agg([{'g': 'a', 'v': None}], 'g', 'v', 'mean')","{'a': None}"],
    ["group_agg([{'g': 'a', 'v': 1}], 'g', 'v', 'median')","{}"]],
  edge:[
    ["group_agg([], 'g', 'v', 'sum')","{}"],
    ["group_agg([{'g': 'a', 'v': None}], 'g', 'v', 'sum')","{'a': 0}"],
    ["list(group_agg([{'g': 'b', 'v': 1}, {'g': 'a', 'v': 2}], 'g', 'v', 'sum').keys())","['a', 'b']"]],
  ex:"🎯 결측값을 0 으로 바꾸는 것과 제외하는 것은 **완전히 다른 질문에 답합니다**. 값이 `[10, None]` 일 때 평균은 제외하면 10, 0 으로 바꾸면 5 입니다 — '측정하지 못한 것' 을 '측정했더니 0' 으로 바꿔 버리면 평균이 체계적으로 낮아집니다.\n⚠️ `count` 에서 특히 명확합니다. pandas 의 `count()` 는 **non-null 개수**이고 전체 행 수는 `size()` 입니다. 이 둘을 혼동하면 '응답률' 같은 지표가 조용히 100% 로 계산됩니다. 두 번째 테스트가 정확히 그 차이입니다.\n💡 sum 과 mean 의 비대칭도 알아 둘 값이 있습니다 — 전부 결측인 그룹의 sum 은 0(빈 합의 항등원)이지만 mean 은 `None` 입니다(정의할 수 없음). pandas 도 같은 규칙이고, `sum(min_count=1)` 로 '값이 하나도 없으면 NaN' 으로 바꿀 수 있습니다.\n🔧 그리고 이것이 데이터 파이프라인에서 `fillna(0)` 을 습관적으로 쓰지 말아야 하는 이유입니다. 채우는 것은 **모델링 결정**이므로 어디서 왜 채웠는지 남겨야 하고, 집계 전에 채우면 위 계산이 전부 바뀝니다. 안전한 순서는 '집계는 결측을 제외하고 → 결과에 결측이 남으면 그때 표시' 입니다." },

{ k:"앞 값으로 채우기", fn:"ffill", cat:"internals",
  q:"<code>ffill(xs)</code> 를 구현하세요. <code>None</code> 인 자리를 <b>바로 앞의 유효한 값</b>으로 채우고, 맨 앞이 <code>None</code> 이면 채울 값이 없으므로 <code>None</code> 으로 둡니다. 아래 구현은 <code>0</code> 을 결측으로 착각합니다.",
  src:`def ffill(xs):
    out, last = [], None
    for x in xs:
        # TODO: 0 과 빈 문자열은 결측이 아니다
        if not x:
            out.append(last)
        else:
            last = x
            out.append(x)
    return out`,
  sol:`def ffill(xs):
    out, last = [], None
    for x in xs:
        if x is None:
            out.append(last)
        else:
            last = x
            out.append(x)
    return out`,
  tests:[
    ["ffill([1, None, None, 2, None])","[1, 1, 1, 2, 2]"],
    ["ffill([0, None])","[0, 0]"],
    ["ffill([None, 1])","[None, 1]"],
    ["ffill([None, None])","[None, None]"],
    ["ffill([])","[]"]],
  edge:[
    ["ffill(['', None, 'x'])","['', '', 'x']"],
    ["ffill([1, None, 0, None])","[1, 1, 0, 0]"]],
  ex:"🎯 `if not x` 와 `if x is None` 의 차이가 이 문항의 전부입니다. 파이썬에서 `0`·`''`·`[]`·`False` 는 모두 거짓이므로, truthy 검사로 결측을 판정하면 **정상적인 0 을 결측으로 취급**해 앞 값으로 덮어씁니다.\n⚠️ 이 버그는 데이터에 0 이 섞이는 순간에만 나타납니다. 재고·잔액·강수량·클릭 수처럼 0 이 의미 있는 값인 컬럼에서 '0 이었던 날이 전날 값으로 바뀌는' 형태로 드러나고, 시계열 그래프를 그려 보기 전까지는 알 수 없습니다.\n💡 ffill 자체가 **모델링 결정**이라는 점도 중요합니다. 센서 값이라면 '마지막 관측이 계속 유효하다' 는 가정이고, 주가라면 휴장일 처리로 타당하지만, 사용자의 나이나 상태 코드라면 근거 없는 조작입니다. 그리고 **얼마나 오래 채울지**에 상한을 두지 않으면(pandas 의 `limit`) 몇 달 전 값이 오늘까지 이어집니다.\n🔧 시계열에서 ffill 은 안전한 방향입니다 — 과거 값으로 현재를 채우므로 **미래 정보가 새지 않습니다**. 반대로 `bfill`(뒤 값으로 채우기)은 미래를 끌어와 학습에 쓰면 곧 누수입니다. 결측 처리 방식을 고를 때 '이 값이 그 시점에 실제로 알 수 있었는가' 를 먼저 묻는 것이 원칙입니다." },

{ k:"피벗과 중복 조합", fn:"pivot", cat:"design",
  q:"<code>pivot(rows, index, columns, values)</code> 를 구현하세요. <code>index</code> 값을 행, <code>columns</code> 값을 열로 놓고(둘 다 <b>정렬</b>) <code>values</code> 를 채운 2차원 리스트를 돌려줍니다. 빈 칸은 <code>None</code> 이고, 같은 <code>(index, columns)</code> 조합이 <b>두 번 나오면 어느 값을 쓸지 정할 수 없으므로 <code>None</code> 을 돌려줍니다</b>. 아래 구현은 뒤에 온 값으로 조용히 덮어씁니다.",
  src:`def pivot(rows, index, columns, values):
    idxs, cols, cell = [], [], {}
    for r in rows:
        i, c = r.get(index), r.get(columns)
        # TODO: 이미 있는 조합이면 어떻게 해야 하는가
        cell[(i, c)] = r.get(values)
        if i not in idxs:
            idxs.append(i)
        if c not in cols:
            cols.append(c)
    idxs.sort(key=lambda x: (x is None, x))
    cols.sort(key=lambda x: (x is None, x))
    return [[cell.get((i, c)) for c in cols] for i in idxs]`,
  sol:`def pivot(rows, index, columns, values):
    idxs, cols, cell = [], [], {}
    for r in rows:
        i, c = r.get(index), r.get(columns)
        if (i, c) in cell:
            return None            # 집계 함수 없이는 결정할 수 없다
        cell[(i, c)] = r.get(values)
        if i not in idxs:
            idxs.append(i)
        if c not in cols:
            cols.append(c)
    idxs.sort(key=lambda x: (x is None, x))
    cols.sort(key=lambda x: (x is None, x))
    return [[cell.get((i, c)) for c in cols] for i in idxs]`,
  tests:[
    ["pivot([{'r': 'a', 'c': 'x', 'v': 1}, {'r': 'a', 'c': 'y', 'v': 2}, {'r': 'b', 'c': 'x', 'v': 3}], 'r', 'c', 'v')","[[1, 2], [3, None]]"],
    ["pivot([{'r': 'a', 'c': 'x', 'v': 1}, {'r': 'a', 'c': 'x', 'v': 2}], 'r', 'c', 'v')","None"],
    ["pivot([{'r': 'b', 'c': 'y', 'v': 1}, {'r': 'a', 'c': 'x', 'v': 2}], 'r', 'c', 'v')","[[2, None], [None, 1]]"],
    ["pivot([], 'r', 'c', 'v')","[]"],
    ["len(pivot([{'r': 'a', 'c': 'x', 'v': 1}], 'r', 'c', 'v'))","1"]],
  edge:[
    ["pivot([{'r': 'a', 'c': 'x', 'v': None}], 'r', 'c', 'v')","[[None]]"],
    ["len(pivot([{'r': 'a', 'c': 'x', 'v': 1}, {'r': 'b', 'c': 'y', 'v': 2}], 'r', 'c', 'v')[0])","2"]],
  ex:"🎯 피벗은 '긴 형태(long)' 를 '넓은 형태(wide)' 로 바꾸는 것이고, 그 변환이 성립하려면 **`(행, 열)` 조합이 유일해야** 합니다. 중복이 있으면 한 칸에 값이 두 개 들어가야 하므로 정의되지 않습니다.\n⚠️ 조용히 덮어쓰는 구현이 위험한 이유는 **결과가 완벽히 정상적인 표**이기 때문입니다. 월별 매출 피벗에서 같은 월에 두 행이 있으면 하나가 사라지고, 합계가 실제보다 작게 나옵니다 — 표를 눈으로 봐도 이상한 곳이 없습니다.\n💡 그래서 pandas 의 `pivot()` 은 중복이 있으면 **`ValueError` 를 던지고**, 집계가 필요하면 `pivot_table(aggfunc='sum')` 을 쓰라고 안내합니다. 이 구분은 '**의도를 명시하게 만드는**' 좋은 API 설계입니다 — 중복을 어떻게 처리할지는 라이브러리가 정할 문제가 아닙니다.\n🔧 그리고 세 번째 테스트가 정렬의 필요성을 보여 줍니다. 등장 순서대로 두면 입력 순서에 따라 표의 행·열 순서가 달라져 **같은 데이터가 다른 표**로 보입니다. 리포트를 비교하거나 스냅샷 테스트를 쓸 때 결정적 순서가 없으면 매번 diff 가 발생합니다. 빈 칸을 `None` 으로 두는 것도 결정입니다 — 0 으로 채우면 '값이 0' 과 '해당 없음' 이 구별되지 않습니다." },

{ k:"롤링 평균과 미래 누수", fn:"rolling_mean", cat:"debug",
  q:"<code>rolling_mean(xs, w, min_periods=None)</code> 을 구현하세요. 각 위치에서 <b>그 지점까지의 최근 <code>w</code> 개</b>의 평균을 돌려줍니다. 창에 든 값이 <code>min_periods</code>(기본값은 <code>w</code>) 미만이면 <code>None</code> 이고, <code>w</code> 가 1 미만이면 <code>[]</code> 입니다. 아래 구현은 창을 잘못된 방향으로 잡습니다.",
  src:`def rolling_mean(xs, w, min_periods=None):
    if w < 1:
        return []
    mp = w if min_periods is None else min_periods
    out = []
    for i in range(len(xs)):
        # TODO: 이 창은 현재 지점보다 뒤를 본다
        window = xs[i:i + w]
        if len(window) < mp:
            out.append(None)
        else:
            out.append(sum(window) / len(window))
    return out`,
  sol:`def rolling_mean(xs, w, min_periods=None):
    if w < 1:
        return []
    mp = w if min_periods is None else min_periods
    out = []
    for i in range(len(xs)):
        window = xs[max(0, i - w + 1):i + 1]      # 과거 w 개 (현재 포함)
        if len(window) < mp:
            out.append(None)
        else:
            out.append(sum(window) / len(window))
    return out`,
  tests:[
    ["rolling_mean([1, 2, 3, 4], 2)","[None, 1.5, 2.5, 3.5]"],
    ["rolling_mean([1, 2, 3], 2, 1)","[1.0, 1.5, 2.5]"],
    ["rolling_mean([1, 2, 3], 5)","[None, None, None]"],
    ["rolling_mean([1, 2], 0)","[]"],
    ["rolling_mean([], 3)","[]"]],
  edge:[
    ["rolling_mean([1, 2, 3], 3)","[None, None, 2.0]"],
    ["rolling_mean([5], 1)","[5.0]"]],
  ex:"🎯 이 버그가 **데이터 누수의 교과서적 형태**입니다. 창을 `xs[i:i+w]` 로 잡으면 위치 `i` 의 값이 **미래 값들의 평균**이 됩니다 — 학습할 때는 성능이 놀랍게 좋고, 실제 배포에서는 그 미래 값을 알 수 없으므로 성능이 무너집니다.\n⚠️ 더 나쁜 것은 **오류가 나지 않는다**는 점입니다. 결과는 정상적인 숫자 목록이고 그래프도 매끄럽게 나옵니다. 첫 테스트에서 정답의 첫 값은 `None`(창이 아직 안 찼음)인데 버그 구현은 `1.5` 를 내놓습니다 — '앞쪽에 값이 있다' 는 것이 유일한 단서입니다.\n💡 그래서 시계열 특성 공학의 검증법은 '**각 시점의 값이 그 시점에 실제로 알 수 있었는가**' 를 묻는 것입니다. 롤링 평균·표준편차·최댓값, 그리고 라벨을 만들 때의 shift 방향까지 전부 이 질문을 통과해야 합니다. pandas 의 `rolling()` 은 기본이 과거 방향이고, 미래를 보려면 `shift(-w)` 를 **명시적으로** 써야 합니다 — 그 명시성이 안전장치입니다.\n🔧 `min_periods` 의 트레이드오프도 실무적입니다. 기본값(창이 다 차야 값이 나옴)은 앞쪽 데이터를 버리지만 모든 값의 통계적 성질이 같습니다. `min_periods=1` 로 두면 데이터를 버리지 않지만 앞쪽 값들은 **표본이 적어 분산이 큽니다** — 그 값으로 학습하면 모델이 앞쪽 잡음을 신호로 배웁니다." },

];
