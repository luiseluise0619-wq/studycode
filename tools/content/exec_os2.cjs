/* 운영체제 실행형 12문항 — 순수 파이썬만 쓴다(Pyodide 오프라인).
   페이지 교체·스케줄링·데드락·주소 변환·디스크 스케줄링·아이노드·원형 버퍼.
   전부 '표를 손으로 채우는 것' 보다 '돌려 보는 것' 이 빠른 주제다. */

module.exports=[

{ k:"FIFO 페이지 교체", fn:"fifo_faults", cat:"internals",
  q:"<code>fifo_faults(pages, frames)</code> 를 구현하세요. <code>pages</code> 순서대로 참조할 때 <b>페이지 부재(fault) 횟수</b>를 돌려줍니다. 프레임이 가득 차면 <b>가장 먼저 들어온 페이지</b>를 내보내고, <code>frames</code> 가 0 이하면 모든 참조가 부재입니다.",
  src:`def fifo_faults(pages, frames):
    if frames <= 0:
        return len(pages)
    mem, order, faults = set(), [], 0
    for p in pages:
        if p in mem:
            continue
        faults += 1
        if len(mem) == frames:
            # TODO: FIFO 는 어느 쪽 끝에서 내보내는가
            old = order.pop()
            mem.discard(old)
        mem.add(p)
        order.append(p)
    return faults`,
  sol:`def fifo_faults(pages, frames):
    if frames <= 0:
        return len(pages)
    mem, order, faults = set(), [], 0
    for p in pages:
        if p in mem:
            continue
        faults += 1
        if len(mem) == frames:
            old = order.pop(0)      # 가장 먼저 들어온 것
            mem.discard(old)
        mem.add(p)
        order.append(p)
    return faults`,
  tests:[
    ["fifo_faults([1,2,3,4,1,2,5,1,2,3,4,5], 3)","9"],
    ["fifo_faults([1,2,3,4,1,2,5,1,2,3,4,5], 4)","10"],
    ["fifo_faults([1,1,1], 1)","1"],
    ["fifo_faults([], 3)","0"],
    ["fifo_faults([1,2,3], 0)","3"]],
  edge:[
    ["fifo_faults([1,2,3], 5)","3"],
    ["fifo_faults([1,2,1,2], 2)","2"]],
  ex:"🎯 첫 두 테스트를 나란히 보세요 — **프레임을 3개에서 4개로 늘렸는데 부재가 9번에서 10번으로 늘어납니다**. 이것이 **Belady 이상 현상**이고, FIFO 가 이론적으로 나쁜 알고리즘이라는 증거입니다. 메모리를 더 줬는데 느려지는 시스템은 원인을 찾기가 대단히 어렵습니다.\n💡 원인은 FIFO 가 '**앞으로 쓸 것인지**' 를 전혀 보지 않기 때문입니다. 방금 들어와 계속 쓰일 페이지도 순서만 오면 나가고, 프레임이 늘어나면 큐가 길어져 하필 곧 쓸 페이지가 나가는 배치가 생깁니다. LRU·OPT 는 이 현상이 없습니다(스택 알고리즘이라 프레임을 늘리면 메모리 내용이 부분집합 관계를 유지합니다).\n⚠️ 구현에서 `pop()` 과 `pop(0)` 은 한 글자 차이지만 완전히 다른 알고리즘입니다 — `pop()` 은 가장 최근 것을 내보내는 LIFO 로, 자주 쓰는 페이지가 붙잡혀 있어 우연히 더 좋아 보이기도 합니다. 이런 버그는 부재율 숫자만 봐서는 알아채기 어렵습니다.\n🔧 실제 커널은 FIFO 를 쓰지 않지만 완전히 버리지도 않았습니다 — Linux 는 이중 LRU 리스트(active/inactive)와 참조 비트를 조합한 근사 알고리즘을 쓰고, 이는 정확한 LRU 의 갱신 비용(참조마다 리스트 조작)을 피하려는 타협입니다. Clock 알고리즘이 그 원형입니다." },

{ k:"LRU 는 조회도 사용이다", fn:"lru_faults", cat:"debug",
  q:"<code>lru_faults(pages, frames)</code> 는 <b>가장 오래 사용되지 않은</b> 페이지를 내보내는 LRU 의 부재 횟수를 돌려줍니다. 아래 구현은 이름만 LRU 이고 실제로는 FIFO 로 동작합니다 — 고치세요.",
  src:`def lru_faults(pages, frames):
    if frames <= 0:
        return len(pages)
    used, faults = [], 0
    for p in pages:
        if p in used:
            # TODO: 이미 있는 페이지를 참조했을 때 해야 할 일이 있다
            continue
        faults += 1
        if len(used) == frames:
            used.pop(0)
        used.append(p)
    return faults`,
  sol:`def lru_faults(pages, frames):
    if frames <= 0:
        return len(pages)
    used, faults = [], 0
    for p in pages:
        if p in used:
            used.remove(p)
            used.append(p)      # 조회도 '사용' — 맨 뒤로 옮긴다
            continue
        faults += 1
        if len(used) == frames:
            used.pop(0)
        used.append(p)
    return faults`,
  tests:[
    ["lru_faults([1,2,3,4,1,2,5,1,2,3,4,5], 3)","10"],
    ["lru_faults([1,2,3,4,1,2,5,1,2,3,4,5], 4)","8"],
    ["lru_faults([1,2,1,2,1,2,3], 2)","3"],
    ["lru_faults([], 3)","0"]],
  edge:[
    ["lru_faults([1,1,1], 1)","1"],
    ["lru_faults([1,2,3], 0)","3"]],
  ex:"🎯 LRU 와 FIFO 를 가르는 것은 **적중(hit)했을 때의 동작 하나**입니다. 부재 처리 코드는 완전히 같고, '이미 있는 페이지를 참조했을 때 순서를 갱신하는가' 만 다릅니다. 그래서 이 버그는 코드 리뷰에서 눈에 잘 띄지 않습니다.\n💡 세 번째 테스트가 차이를 극적으로 보여 줍니다. `1,2,1,2,1,2,3` 을 프레임 2개로 돌리면 LRU 는 3번만 부재하지만, 갱신을 빼먹은 구현은 1과 2를 번갈아 내보내며 계속 부재합니다 — 가장 자주 쓰는 페이지를 가장 자주 버리는 최악의 패턴입니다.\n⚠️ 두 번째 테스트는 LRU 에 **Belady 이상 현상이 없다**는 것을 보여 줍니다: 프레임 3개에서 10번, 4개에서 8번. LRU 는 스택 알고리즘이라 프레임을 늘리면 메모리 내용이 항상 이전의 상위집합이 되어, 부재가 늘어날 수 없습니다.\n🔧 다만 **정확한 LRU 는 하드웨어에서 비싸다**는 것이 현실입니다. 모든 메모리 참조마다 타임스탬프를 갱신하거나 리스트를 조작해야 하는데, 그 비용이 절약한 디스크 I/O 를 넘어설 수 있습니다. 그래서 실제 커널은 참조 비트 한두 개로 근사하는 Clock/Second-chance 계열을 씁니다 — '완벽한 정책보다 싼 근사' 가 시스템 설계의 반복되는 주제입니다." },

{ k:"OPT — 미래를 아는 교체", fn:"optimal_faults", cat:"internals",
  q:"<code>optimal_faults(pages, frames)</code> 를 구현하세요. 프레임이 가득 찼을 때 <b>앞으로 가장 나중에 쓰일(또는 다시 쓰이지 않을) 페이지</b>를 내보냅니다(Belady 의 최적 알고리즘). 동점이면 아무 쪽이나 골라도 부재 횟수는 같습니다.",
  src:`def optimal_faults(pages, frames):
    if frames <= 0:
        return len(pages)
    mem, faults = [], 0
    for i, p in enumerate(pages):
        if p in mem:
            continue
        faults += 1
        if len(mem) < frames:
            mem.append(p)
            continue
        future = pages[i + 1:]
        victim, best = mem[0], len(future) + 2
        for m in mem:
            nxt = future.index(m) if m in future else len(future) + 1
            # TODO: 가장 '가까운' 미래를 고르고 있다
            if nxt < best:
                victim, best = m, nxt
        mem[mem.index(victim)] = p
    return faults`,
  sol:`def optimal_faults(pages, frames):
    if frames <= 0:
        return len(pages)
    mem, faults = [], 0
    for i, p in enumerate(pages):
        if p in mem:
            continue
        faults += 1
        if len(mem) < frames:
            mem.append(p)
            continue
        future = pages[i + 1:]
        victim, best = mem[0], -1
        for m in mem:
            # 다시 쓰이지 않는 페이지에 가장 먼 거리를 준다
            nxt = future.index(m) if m in future else len(future) + 1
            if nxt > best:
                victim, best = m, nxt
        mem[mem.index(victim)] = p
    return faults`,
  tests:[
    ["optimal_faults([1,2,3,4,1,2,5,1,2,3,4,5], 3)","7"],
    ["optimal_faults([1,2,3,4,1,2,5,1,2,3,4,5], 4)","6"],
    ["optimal_faults([1,1,1], 1)","1"],
    ["optimal_faults([], 3)","0"],
    ["optimal_faults([1,2,3], 5)","3"]],
  edge:[
    ["optimal_faults([1,2,3], 0)","3"],
    ["optimal_faults([1,2,1,2], 2)","2"]],
  ex:"🎯 OPT 는 **구현할 수 없는 알고리즘**입니다 — 미래의 참조열을 알아야 하기 때문입니다. 그런데도 배우는 이유는 **하한선**이기 때문입니다: 같은 참조열에서 어떤 알고리즘도 OPT 보다 적게 부재할 수 없으므로, LRU 가 10번이고 OPT 가 7번이라면 '개선 여지가 3번 있다' 는 것을 알 수 있습니다.\n💡 이런 '이론적 최적선' 은 시스템 성능 작업의 필수 도구입니다. 캐시 적중률을 90%에서 95%로 올리려 애쓰기 전에, 그 워크로드의 상한이 91%라면 노력의 방향 자체를 바꿔야 합니다 — 실제 트레이스를 기록해 OPT 를 오프라인으로 계산하는 것이 그 답을 줍니다.\n⚠️ 구현의 핵심은 '**다시 쓰이지 않는 페이지**' 에 가장 먼 거리를 주는 것입니다(`len(future) + 1`). 이 처리를 빼먹고 `index` 만 쓰면 예외가 나거나, 0 을 주면 오히려 가장 먼저 내보낼 후보가 되어 정반대로 동작합니다.\n🔧 부호를 뒤집어 '가장 가까운 미래' 를 고르면 **최악의 알고리즘**이 됩니다 — 곧 쓸 페이지를 골라서 버리는 것이니까요. 첫 테스트에서 7번이 아니라 훨씬 많은 부재가 나오고, 이런 부호 실수는 결과가 '그럴듯한 숫자' 라서 테스트 없이는 통과합니다." },

{ k:"Belady 이상 현상 판정", fn:"belady_anomaly", cat:"design",
  q:"<code>belady_anomaly(pages, f1, f2)</code> 는 프레임을 <code>f1</code> 에서 <code>f2</code> 로 <b>늘렸을 때 FIFO 의 부재가 오히려 늘어나면</b> <code>True</code> 를 돌려줍니다. <code>f1 &gt;= f2</code> 이면 판정 대상이 아니므로 <code>False</code> 입니다. 아래 구현은 FIFO 가 아닌 정책으로 판정합니다.",
  src:`def belady_anomaly(pages, f1, f2):
    def faults(frames):
        # TODO: 이 정책에는 애초에 이상 현상이 없다
        used, n = [], 0
        for p in pages:
            if p in used:
                used.remove(p)
                used.append(p)
                continue
            n += 1
            if len(used) == frames:
                used.pop(0)
            used.append(p)
        return n
    if f1 >= f2:
        return False
    return faults(f2) > faults(f1)`,
  sol:`def belady_anomaly(pages, f1, f2):
    def faults(frames):
        if frames <= 0:
            return len(pages)
        mem, order, n = set(), [], 0
        for p in pages:
            if p in mem:
                continue
            n += 1
            if len(mem) == frames:
                mem.discard(order.pop(0))
            mem.add(p)
            order.append(p)
        return n
    if f1 >= f2:
        return False
    return faults(f2) > faults(f1)`,
  tests:[
    ["belady_anomaly([1,2,3,4,1,2,5,1,2,3,4,5], 3, 4)","True"],
    ["belady_anomaly([1,2,3,1,2,3], 2, 3)","False"],
    ["belady_anomaly([1,2,3], 4, 5)","False"],
    ["belady_anomaly([1,2,3,4,1,2,5,1,2,3,4,5], 4, 3)","False"]],
  edge:[
    ["belady_anomaly([], 1, 2)","False"],
    ["belady_anomaly([1], 1, 2)","False"]],
  ex:"🎯 '자원을 늘리면 성능이 좋아진다' 는 직관이 **깨지는 것을 실행으로 확인하는** 문항입니다. 이 현상을 모르면 프레임(또는 캐시 크기, 커넥션 풀, 워커 수)을 늘렸는데 나빠진 측정값을 보고 '측정이 잘못됐다' 고 결론 내리게 됩니다.\n💡 두 번째 테스트가 대조군입니다 — 같은 참조열에서 LRU 로 재면 이상 현상이 나타나지 않습니다. FIFO 계열(그리고 랜덤 교체)만 이 성질을 가지고, LRU·OPT 같은 **스택 알고리즘**은 프레임을 늘렸을 때 메모리 내용이 이전의 상위집합이 되므로 부재가 늘어날 수 없습니다.\n⚠️ 이 문항의 함정은 '판정 함수 안에서 어떤 정책을 쓰는가' 입니다 — 구현이 LRU 면 어떤 입력에서도 `True` 가 나오지 않아, 테스트 없이는 '이상 현상이 원래 드문 거겠지' 라고 넘어가게 됩니다. **없다는 결과와 못 찾는 코드는 구별할 수 없습니다.**\n🔧 시스템에서 같은 모양의 함정이 반복됩니다: 스레드를 늘렸는데 처리량이 떨어지는 것(락 경쟁·컨텍스트 스위칭), 캐시를 키웠는데 느려지는 것(캐시 라인 경쟁·GC 압력), 배치 크기를 늘렸는데 지연이 늘어나는 것. 공통 교훈은 '**늘린 뒤에 반드시 다시 측정한다**' 입니다." },

{ k:"SJF 평균 대기시간", fn:"sjf_avg_wait", cat:"debug",
  q:"<code>sjf_avg_wait(jobs)</code> 는 <code>(도착시간, 실행시간)</code> 목록에 대해 <b>비선점 SJF</b>(그 시점에 도착한 작업 중 가장 짧은 것을 먼저)의 <b>평균 대기시간</b>을 돌려줍니다. 실행시간이 같으면 먼저 도착한 쪽, 그것도 같으면 목록 순서대로 고릅니다. 준비된 작업이 없으면 다음 도착까지 유휴 상태로 기다립니다. 아래 구현은 도착 순으로 처리합니다.",
  src:`def sjf_avg_wait(jobs):
    if not jobs:
        return 0.0
    remaining = sorted(range(len(jobs)), key=lambda i: (jobs[i][0], i))
    t, total = 0, 0
    for i in remaining:
        # TODO: 도착 순이 아니라 '짧은 것 먼저' 여야 한다
        if t < jobs[i][0]:
            t = jobs[i][0]
        total += t - jobs[i][0]
        t += jobs[i][1]
    return total / len(jobs)`,
  sol:`def sjf_avg_wait(jobs):
    if not jobs:
        return 0.0
    remaining = list(range(len(jobs)))
    t, total = 0, 0
    while remaining:
        ready = [i for i in remaining if jobs[i][0] <= t]
        if not ready:
            t = min(jobs[i][0] for i in remaining)
            continue
        i = min(ready, key=lambda j: (jobs[j][1], jobs[j][0], j))
        total += t - jobs[i][0]
        t += jobs[i][1]
        remaining.remove(i)
    return total / len(jobs)`,
  tests:[
    ["round(sjf_avg_wait([(0,7),(2,4),(4,1),(5,4)]), 6)","4.0"],
    ["round(sjf_avg_wait([(0,10),(0,1),(0,2)]), 6)","1.333333"],
    ["sjf_avg_wait([])","0.0"],
    ["round(sjf_avg_wait([(3,5)]), 6)","0.0"],
    ["round(sjf_avg_wait([(0,2),(10,2)]), 6)","0.0"]],
  edge:[
    ["round(sjf_avg_wait([(0,1),(0,1)]), 6)","0.5"],
    ["round(sjf_avg_wait([(0,5),(1,1),(2,1)]), 6)","2.666667"]],
  ex:"🎯 SJF 는 **평균 대기시간을 최소화하는 것이 증명된** 스케줄링입니다. 두 번째 테스트가 이유를 보여 줍니다 — 같은 시점에 10, 1, 2 가 도착할 때 도착 순으로 처리하면 평균 7.0 이지만 짧은 것부터 하면 1.33 입니다. 긴 작업 하나가 뒤의 모두를 기다리게 만드는 것을 피하기 때문입니다.\n⚠️ 그런데 실제 OS 는 SJF 를 쓸 수 없습니다 — **실행시간을 미리 모르기** 때문입니다. 그래서 과거 실행 패턴으로 추정하거나(지수 평균), 다단 피드백 큐로 '짧아 보이는 작업을 높은 우선순위에 두고 오래 도는 작업을 아래로 내리는' 방식으로 근사합니다.\n💡 더 큰 문제는 **기아(starvation)** 입니다. 짧은 작업이 계속 도착하면 긴 작업은 영원히 실행되지 않습니다. 그래서 실무 스케줄러는 대기 시간에 따라 우선순위를 올리는 aging 을 함께 넣습니다.\n🔧 다섯 번째 테스트(유휴 구간)와 마지막 edge 를 주목하세요. `(0,2)` 와 `(10,2)` 사이에는 아무 작업도 없어 CPU 가 8단위를 놀아야 하는데, 이때 시간을 다음 도착 시점으로 **점프시키지 않으면** 대기시간이 음수가 되어 평균이 조용히 틀립니다. 이벤트 기반 시뮬레이션에서 반복되는 실수입니다." },

{ k:"라운드 로빈 완료 순서", fn:"round_robin", cat:"debug",
  q:"<code>round_robin(jobs, q)</code> 는 <code>(이름, 실행시간)</code> 목록(모두 시각 0 도착)을 시간 할당량 <code>q</code> 로 라운드 로빈 처리해 <b>완료 순서대로 <code>(이름, 완료시각)</code></b> 목록을 돌려줍니다. 실행시간이 0 이하인 작업은 제외하고, <code>q</code> 가 0 이하면 빈 리스트를 돌려줍니다. 아래 구현은 시간을 과하게 소비합니다.",
  src:`def round_robin(jobs, q):
    if q <= 0:
        return []
    from collections import deque
    dq = deque((n, b) for n, b in jobs if b > 0)
    t, out = 0, []
    while dq:
        n, b = dq.popleft()
        # TODO: 남은 시간이 할당량보다 짧으면?
        run = q
        t += run
        if b - run > 0:
            dq.append((n, b - run))
        else:
            out.append((n, t))
    return out`,
  sol:`def round_robin(jobs, q):
    if q <= 0:
        return []
    from collections import deque
    dq = deque((n, b) for n, b in jobs if b > 0)
    t, out = 0, []
    while dq:
        n, b = dq.popleft()
        run = min(q, b)          # 남은 만큼만 돈다
        t += run
        if b - run > 0:
            dq.append((n, b - run))
        else:
            out.append((n, t))
    return out`,
  tests:[
    ["round_robin([('a',5),('b',3),('c',1)], 2)","[('c', 5), ('b', 8), ('a', 9)]"],
    ["round_robin([('a',3),('b',1)], 10)","[('a', 3), ('b', 4)]"],
    ["round_robin([], 2)","[]"],
    ["round_robin([('a',0),('b',1)], 2)","[('b', 1)]"],
    ["round_robin([('a',1)], 0)","[]"]],
  edge:[
    ["round_robin([('a',4)], 1)","[('a', 4)]"],
    ["[n for n, _ in round_robin([('a',1),('b',1),('c',1)], 5)]","['a', 'b', 'c']"]],
  ex:"🎯 라운드 로빈은 **응답성을 위해 처리량을 내주는** 스케줄링입니다. 두 번째 테스트처럼 할당량이 모든 작업의 실행시간보다 크면 그냥 FCFS 가 되고, 반대로 할당량이 작으면 짧은 작업이 빨리 끝나지만 컨텍스트 스위칭 비용이 늘어납니다 — 실무 값은 대개 10~100ms 로, '사람이 반응을 느끼지 못하는 시간' 과 '스위칭 오버헤드' 사이에서 정합니다.\n⚠️ `min(q, b)` 를 빼먹는 버그는 **시계를 실제보다 빠르게 돌립니다**. 남은 시간이 1인데 할당량 2를 다 쓴 것으로 계산하면 완료 시각이 부풀고, 그 오차가 누적되어 뒤 작업의 시각이 전부 어긋납니다. 첫 테스트에서 `c` 의 완료 시각이 5가 아니라 6이 되는 것이 그 증거입니다.\n💡 이런 '조금씩 어긋나는 시각' 은 시뮬레이션에서 가장 찾기 어려운 부류입니다 — 결과가 그럴듯한 숫자라 눈으로 검증할 수 없고, 순서만 보면 맞아 보입니다. 그래서 **완료 시각까지 테스트로 못 박아야** 합니다.\n🔧 실행시간이 0인 작업을 걸러내는 것도 실무적 방어입니다. 큐에 넣으면 영원히 완료되지 않는 항목(`b - run > 0` 이 계속 참)이 되어 무한 루프가 되거나, 0시간 작업이 큐를 돌며 다른 작업의 순서를 밀어냅니다." },

{ k:"영원히 진행하지 못하는 스레드", fn:"blocked_forever", cat:"design",
  q:"<code>blocked_forever(waits)</code> 를 구현하세요. <code>waits[t]</code> 는 스레드 <code>t</code> 가 기다리는 스레드들의 목록이며, <b>그 전부가 끝나야</b> <code>t</code> 가 진행할 수 있습니다. <b>영원히 진행할 수 없는 스레드</b>(순환에 속하거나 순환에 이르는 스레드)를 정렬해 돌려주세요. 없으면 빈 리스트입니다.",
  src:`def blocked_forever(waits):
    out = set()
    for t, ws in waits.items():
        for w in ws:
            # TODO: 길이가 2인 순환만 찾고 있다
            if t in waits.get(w, []):
                out.add(t)
                out.add(w)
    return sorted(out)`,
  sol:`def blocked_forever(waits):
    alive = set(waits)
    for t in waits:
        alive.update(waits[t])
    changed = True
    while changed:
        changed = False
        # 기다릴 대상이 남지 않은 스레드는 진행할 수 있다 — 벗겨 낸다
        for t in sorted(alive):
            if not [x for x in waits.get(t, []) if x in alive]:
                alive.discard(t)
                changed = True
    return sorted(alive)`,
  tests:[
    ["blocked_forever({'a': ['b'], 'b': ['a']})","['a', 'b']"],
    ["blocked_forever({'a': ['b'], 'b': []})","[]"],
    ["blocked_forever({'a': ['b'], 'b': ['c'], 'c': ['b']})","['a', 'b', 'c']"],
    ["blocked_forever({})","[]"],
    ["blocked_forever({'a': ['a']})","['a']"]],
  edge:[
    ["blocked_forever({'a': ['b','c'], 'b': [], 'c': ['a']})","['a', 'c']"],
    ["blocked_forever({'a': ['b'], 'b': ['c'], 'c': []})","[]"]],
  ex:"🎯 데드락 탐지는 **대기 그래프(wait-for graph)의 순환 찾기**입니다. 그런데 실무에서 중요한 것은 순환 자체가 아니라 '**어떤 스레드가 영원히 멈춰 있는가**' 이고, 그 답에는 순환에 이르는 스레드까지 포함됩니다 — 세 번째 테스트의 `a` 는 순환에 속하지 않지만 `b↔c` 가 풀리지 않으므로 영원히 기다립니다.\n💡 구현 방법은 위상 정렬의 반대입니다: '기다릴 대상이 남지 않은 스레드는 진행할 수 있다' 를 반복해 벗겨 내면, **남는 것이 정확히 답**입니다. 순환을 직접 찾는 DFS 보다 짧고, '순환에 이르는' 경우를 자동으로 포함합니다.\n⚠️ 2-순환만 찾는 구현은 실무에서 특히 위험합니다. 두 스레드가 서로를 기다리는 경우는 코드 리뷰로도 잡히지만, **A→B→C→A 처럼 세 개 이상이 얽힌 데드락**이야말로 리뷰를 통과해 운영에서 터집니다 — 탐지 도구가 그걸 못 찾으면 도구가 있는 의미가 없습니다.\n🔧 데드락의 네 조건(상호 배제·점유 대기·비선점·순환 대기) 중 실무에서 깨기 가장 쉬운 것은 **순환 대기**입니다: 모든 코드가 락을 **같은 전역 순서**로 획득하면 순환이 생길 수 없습니다. 그다음이 타임아웃(비선점 깨기)이고, 탐지는 마지막 수단입니다 — 이미 멈춘 뒤에 알려 주기 때문입니다." },

{ k:"최적 적합 할당", fn:"best_fit", cat:"internals",
  q:"<code>best_fit(holes, size)</code> 를 구현하세요. <code>holes</code> 는 각 빈 공간의 크기 목록이고, <code>size</code> 를 담을 수 있는 공간 중 <b>가장 작은</b> 것의 인덱스를 돌려줍니다. 크기가 같으면 <b>인덱스가 작은 쪽</b>, 담을 곳이 없거나 <code>size</code> 가 0 이하면 <code>-1</code> 입니다.",
  src:`def best_fit(holes, size):
    if size <= 0:
        return -1
    for i, h in enumerate(holes):
        # TODO: 이건 최초 적합(first fit)이다
        if h >= size:
            return i
    return -1`,
  sol:`def best_fit(holes, size):
    if size <= 0:
        return -1
    best = -1
    for i, h in enumerate(holes):
        if h >= size and (best == -1 or h < holes[best]):
            best = i
    return best`,
  tests:[
    ["best_fit([100, 500, 200, 300, 600], 212)","3"],
    ["best_fit([100, 500, 200, 300, 600], 700)","-1"],
    ["best_fit([300, 300], 100)","0"],
    ["best_fit([100, 50], 50)","1"],
    ["best_fit([], 10)","-1"]],
  edge:[
    ["best_fit([10], 0)","-1"],
    ["best_fit([10, 10, 5], 5)","2"]],
  ex:"🎯 세 가지 배치 전략은 각각 다른 것을 아낍니다. **최초 적합**은 탐색 시간이 짧고, **최적 적합**은 큰 공간을 아끼지만 쓸모없이 작은 조각을 많이 남기며, **최악 적합**은 남는 조각을 크게 유지합니다. 어느 것도 항상 이기지 않고, 실측에서는 최초 적합이 최적 적합보다 나은 경우가 흔합니다 — 전체를 훑는 비용을 치르지 않기 때문입니다.\n⚠️ 두 구현의 차이는 첫 테스트에서 드러납니다. `212` 를 담을 수 있는 공간은 500·300·600 인데, 최초 적합은 500(인덱스 1)을 골라 288 을 낭비하고, 최적 적합은 300(인덱스 3)을 골라 88 만 남깁니다. 결과가 '유효한 인덱스' 라서 **테스트 없이는 어느 전략인지 알 수 없습니다**.\n💡 동점 처리 규칙(인덱스가 작은 쪽)을 명시한 이유는 **결정성**입니다. 규칙이 없으면 딕셔너리 순회 순서나 정렬 안정성에 따라 답이 달라져, 같은 입력에 다른 결과가 나오는 재현 불가능한 버그가 됩니다.\n🔧 이 전략들의 공통 한계는 **외부 단편화**입니다 — 전체 빈 공간의 합은 충분한데 연속된 공간이 없어 할당이 실패합니다. 그래서 현대 시스템은 페이징으로 이 문제 자체를 없애거나, 크기별 프리 리스트(slab·buddy allocator)로 조각을 표준화합니다. malloc 구현체들이 하는 일이 정확히 이것입니다." },

{ k:"가상 주소 변환", fn:"translate", cat:"internals",
  q:"<code>translate(vaddr, page_size, table)</code> 를 구현하세요. 가상 주소를 <b>페이지 번호와 오프셋</b>으로 나누고, <code>table[페이지번호]</code> 가 프레임 번호를 주면 <code>프레임번호 · page_size + 오프셋</code> 을 돌려줍니다. 매핑이 없으면(페이지 폴트) <code>None</code>, 주소가 음수거나 <code>page_size</code> 가 0 이하면 <code>None</code> 입니다.",
  src:`def translate(vaddr, page_size, table):
    if vaddr < 0 or page_size <= 0:
        return None
    # TODO: 몫과 나머지 중 어느 것이 페이지 번호인가
    vpn = vaddr % page_size
    off = vaddr // page_size
    if vpn not in table:
        return None
    return table[vpn] * page_size + off`,
  sol:`def translate(vaddr, page_size, table):
    if vaddr < 0 or page_size <= 0:
        return None
    vpn, off = divmod(vaddr, page_size)
    if vpn not in table:
        return None
    return table[vpn] * page_size + off`,
  tests:[
    ["translate(0x1234, 4096, {1: 7})","29236"],
    ["translate(0x2000, 4096, {1: 7})","None"],
    ["translate(0, 4096, {0: 0})","0"],
    ["translate(100, 64, {1: 3})","228"],
    ["translate(-1, 4096, {0: 1})","None"]],
  edge:[
    ["translate(4095, 4096, {0: 5})","24575"],
    ["translate(10, 0, {0: 1})","None"]],
  ex:"🎯 주소 변환의 전부는 '**상위 비트는 페이지 번호, 하위 비트는 오프셋**' 입니다. 페이지 크기가 2의 거듭제곱이라 실제 하드웨어는 나눗셈 없이 **비트 시프트와 마스크**로 처리합니다 — `vpn = vaddr >> 12`, `off = vaddr & 0xFFF`(4KB 페이지). `divmod` 는 그것을 읽기 쉽게 쓴 것입니다.\n⚠️ 몫과 나머지를 바꿔 쓰는 실수는 결과가 **여전히 숫자라서** 조용합니다. 첫 테스트에서 `0x1234` 의 페이지 번호는 1인데, 바꿔 쓰면 564 가 되어 테이블에 없다는 이유로 페이지 폴트가 됩니다 — '왜 항상 폴트가 나지' 를 며칠 쫓게 됩니다.\n💡 오프셋이 변환되지 않고 **그대로 통과**한다는 점이 중요합니다(마지막 edge 테스트). 페이지 안의 상대 위치는 물리 프레임에서도 같으므로, 변환은 페이지 번호에만 일어납니다. 이것이 페이징이 빠른 이유이고, 페이지 크기가 클수록 테이블이 작아지는 이유입니다.\n🔧 실제로는 이 계산조차 매 접근마다 하기엔 비쌉니다(다단 페이지 테이블이면 메모리를 여러 번 읽어야 합니다). 그래서 CPU 는 **TLB** 로 최근 변환을 캐시하고, TLB 적중률이 성능을 좌우합니다 — 큰 페이지(huge page)를 쓰는 이유가 TLB 항목 하나가 더 넓은 영역을 덮게 만드는 것입니다." },

{ k:"디스크 헤드 이동 거리", fn:"sstf_distance", cat:"debug",
  q:"<code>sstf_distance(requests, head)</code> 는 SSTF(가장 가까운 요청 먼저) 방식으로 모든 요청을 처리할 때 <b>헤드가 이동한 총 거리</b>를 돌려줍니다. 거리가 같으면 <b>트랙 번호가 작은 쪽</b>을 먼저 갑니다. 아래 구현은 요청이 온 순서대로 처리합니다.",
  src:`def sstf_distance(requests, head):
    total = 0
    for r in requests:
        # TODO: 도착 순(FCFS)이 아니라 가장 가까운 것부터다
        total += abs(r - head)
        head = r
    return total`,
  sol:`def sstf_distance(requests, head):
    pending = list(requests)
    total = 0
    while pending:
        nxt = min(pending, key=lambda r: (abs(r - head), r))
        total += abs(nxt - head)
        head = nxt
        pending.remove(nxt)
    return total`,
  tests:[
    ["sstf_distance([98,183,37,122,14,124,65,67], 53)","236"],
    ["sstf_distance([], 50)","0"],
    ["sstf_distance([50], 50)","0"],
    ["sstf_distance([40, 60], 50)","30"],
    ["sstf_distance([10, 20, 30], 0)","30"]],
  edge:[
    ["sstf_distance([100, 100], 0)","100"],
    ["sstf_distance([5], 10)","5"]],
  ex:"🎯 첫 테스트의 고전적 요청열에서 FCFS 는 640, SSTF 는 236 입니다 — **2.7배 차이**입니다. 회전 디스크에서 탐색 시간이 전체 지연의 대부분이었으므로, 이 차이가 곧 처리량이었습니다.\n⚠️ 대가는 **기아**입니다. 헤드 근처에 요청이 계속 들어오면 멀리 있는 요청은 영원히 처리되지 않습니다 — SJF 스케줄링과 정확히 같은 구조의 문제입니다. 그래서 실무에서는 SCAN·C-SCAN(엘리베이터 방식)을 씁니다: 한 방향으로 끝까지 훑고 돌아오므로 최대 대기 시간에 상한이 생깁니다. '평균이 좋은 것' 과 '최악이 예측 가능한 것' 중 후자를 고르는 전형적인 사례입니다.\n💡 동점 규칙(작은 번호 먼저)이 필요한 이유는 결정성입니다. 마지막 edge 테스트(`[100, 100]`)처럼 같은 트랙에 요청이 겹치는 것도 흔하므로, 규칙이 없으면 결과가 구현 세부에 좌우됩니다.\n🔧 SSD 에서는 이 이야기가 거의 무의미해집니다 — 물리적 헤드가 없어 접근 위치와 지연의 관계가 사라지기 때문입니다. 그래서 Linux 는 SSD 기본 스케줄러를 `none`(단순 FIFO)이나 `mq-deadline` 으로 두고, 정교한 재정렬을 하지 않습니다. **알고리즘의 가치는 하드웨어 가정이 유효할 때까지**라는 것을 보여 주는 예입니다." },

{ k:"아이노드가 필요한 블록 수", fn:"inode_blocks", cat:"internals",
  q:"<code>inode_blocks(size, block, direct, ptrs)</code> 를 구현하세요. 파일을 담는 데 필요한 <b>데이터 블록 + 간접 블록의 총 개수</b>입니다. <code>direct</code> 개의 직접 포인터가 있고, 그다음은 <b>1단 간접</b>(<code>ptrs</code> 개), 그다음은 <b>2단 간접</b>(<code>ptrs × ptrs</code> 개)을 씁니다. 간접 블록 자체도 한 블록을 차지하며, 담을 수 없는 크기나 잘못된 인자는 <code>-1</code> 입니다.",
  src:`def inode_blocks(size, block, direct, ptrs):
    if size < 0 or block <= 0 or ptrs <= 0 or direct < 0:
        return -1
    data = -(-size // block)
    # TODO: 간접 블록도 디스크를 차지한다
    if data > direct + ptrs + ptrs * ptrs:
        return -1
    return data`,
  sol:`def inode_blocks(size, block, direct, ptrs):
    if size < 0 or block <= 0 or ptrs <= 0 or direct < 0:
        return -1
    data = -(-size // block)          # 올림 나눗셈
    if data <= direct:
        return data
    rest = data - direct
    meta = 1                          # 1단 간접 블록 하나
    if rest <= ptrs:
        return data + meta
    rest -= ptrs
    if rest > ptrs * ptrs:
        return -1
    meta += 1 + -(-rest // ptrs)      # 2단 간접 블록 + 그것이 가리키는 1단 블록들
    return data + meta`,
  tests:[
    ["inode_blocks(12 * 4096, 4096, 12, 1024)","12"],
    ["inode_blocks(13 * 4096, 4096, 12, 1024)","14"],
    ["inode_blocks((12 + 1024) * 4096, 4096, 12, 1024)","1037"],
    ["inode_blocks((12 + 1024 + 1) * 4096, 4096, 12, 1024)","1040"],
    ["inode_blocks((12 + 1024 + 1024 * 1024 + 1) * 4096, 4096, 12, 1024)","-1"]],
  edge:[
    ["inode_blocks(0, 4096, 12, 1024)","0"],
    ["inode_blocks(1, 4096, 12, 1024)","1"],
    ["inode_blocks(-5, 4096, 12, 1024)","-1"]],
  ex:"🎯 파일 크기가 문턱을 넘는 순간 **비용이 계단처럼 뛰는** 구조를 손으로 확인하는 문항입니다. 12블록까지는 데이터만 쓰지만 13블록이 되면 간접 블록 하나가 붙어 14가 되고(두 번째 테스트), 1단 간접을 넘어서면 2단 간접 블록과 그 아래 1단 블록이 함께 붙어 1037 → 1040 으로 **한 번에 3이 늘어납니다**(세 번째와 네 번째 테스트).\n💡 이 구조의 의도는 '**작은 파일은 싸게, 큰 파일도 가능하게**' 입니다. 대부분의 파일이 작다는 관찰에 맞춰 직접 포인터를 두고, 드문 큰 파일에만 간접 비용을 물립니다 — 이것이 ext2/ext3 의 설계입니다.\n⚠️ 대가는 **접근 지연의 불균일**입니다. 직접 블록은 아이노드만 읽으면 되지만 2단 간접 영역은 블록을 세 번 읽어야 하고, 캐시가 비었다면 실제로 세 배 느립니다. 큰 파일을 순차로 읽을 때 성능이 구간마다 다른 이유입니다.\n🔧 그래서 ext4·XFS·btrfs 는 **익스텐트**(연속 블록 범위를 시작+길이로 표현)로 바꿨습니다. 1GB 연속 파일을 익스텐트 하나로 표현하면 포인터 25만 개가 필요 없어집니다. 올림 나눗셈을 `-(-a // b)` 로 쓴 관용구도 함께 기억할 값이 있습니다 — `math.ceil(a / b)` 는 큰 정수에서 부동소수점 오차가 생깁니다." },

{ k:"원형 버퍼의 가득 참과 빔", fn:"ring_ops", cat:"debug",
  q:"<code>ring_ops(cap, ops)</code> 는 용량 <code>cap</code> 의 원형 버퍼에 연산을 순서대로 적용한 결과 목록을 돌려줍니다. <code>'p&lt;값&gt;'</code> 은 넣기(성공 <code>True</code>, <b>가득 차면 <code>False</code></b>), <code>'g'</code> 는 꺼내기(값 문자열, <b>비었으면 <code>None</code></b>)입니다. <code>cap</code> 이 0 이하면 빈 리스트입니다. 아래 구현은 두 상태를 구별하지 못합니다.",
  src:`def ring_ops(cap, ops):
    if cap <= 0:
        return []
    buf = [None] * cap
    head = tail = 0
    out = []
    for op in ops:
        if op[0] == 'p':
            # TODO: head == tail 은 '빈 것' 인가 '가득 찬 것' 인가
            buf[tail] = op[1:]
            tail = (tail + 1) % cap
            out.append(True)
        else:
            if head == tail:
                out.append(None)
                continue
            v = buf[head]
            head = (head + 1) % cap
            out.append(v)
    return out`,
  sol:`def ring_ops(cap, ops):
    if cap <= 0:
        return []
    buf = [None] * cap
    head = tail = count = 0
    out = []
    for op in ops:
        if op[0] == 'p':
            if count == cap:
                out.append(False)       # 가득 찼다
                continue
            buf[tail] = op[1:]
            tail = (tail + 1) % cap
            count += 1
            out.append(True)
        else:
            if count == 0:
                out.append(None)        # 비었다
                continue
            v = buf[head]
            head = (head + 1) % cap
            count -= 1
            out.append(v)
    return out`,
  tests:[
    ["ring_ops(2, ['p1','p2','p3','g','g','g'])","[True, True, False, '1', '2', None]"],
    ["ring_ops(2, ['g'])","[None]"],
    ["ring_ops(2, ['p1','g','p2','p3','g','g'])","[True, '1', True, True, '2', '3']"],
    ["ring_ops(0, ['p1'])","[]"],
    ["ring_ops(1, ['p1','p2','g','g'])","[True, False, '1', None]"]],
  edge:[
    ["ring_ops(3, ['p1','p2','p3','p4'])","[True, True, True, False]"],
    ["ring_ops(1, ['p1','g','p2','g'])","[True, '1', True, '2']"]],
  ex:"🎯 원형 버퍼의 고전적 난점은 **`head == tail` 이 '비었다' 와 '가득 찼다' 를 동시에 뜻한다**는 것입니다. 해법은 세 가지뿐입니다 — ① 개수를 따로 세기(이 구현) ② 한 칸을 비워 두어 가득 참을 `(tail+1)%cap == head` 로 정의하기 ③ 순번을 감싸지 않고 계속 늘려 차이로 판단하기(무한 카운터).\n⚠️ 구별하지 못하는 구현은 **가득 찬 상태에서 조용히 덮어씁니다**. 첫 테스트에서 `p3` 이 `False` 대신 `True` 를 돌려주며 `1` 을 지워 버립니다 — 데이터가 사라지는데 아무 오류도 나지 않으므로, 로그 유실이나 이벤트 누락으로 한참 뒤에 발견됩니다.\n💡 세 번째 테스트가 **감싸기(wraparound)** 를 확인합니다. 꺼낸 뒤 다시 넣으면 인덱스가 배열 끝을 넘어 0 으로 돌아오는데, 이 경로에서만 나타나는 버그가 흔합니다. 감싸기가 일어나기 전까지는 완벽히 동작하므로 짧은 테스트로는 잡히지 않습니다.\n🔧 실무에서 이 구조는 도처에 있습니다 — 커널의 링 버퍼(`dmesg`), 네트워크 카드의 송수신 디스크립터 링, 오디오 버퍼, 로그 수집기의 메모리 큐. 그리고 생산자·소비자가 서로 다른 스레드면 `count` 갱신 자체가 경쟁 조건이 되므로, 단일 생산자·단일 소비자에서는 ②·③ 방식으로 **각자 자기 인덱스만 쓰게** 만들어 락 없이 동작시킵니다." },

];
