/* DevOps 실행형 12문항 — 순수 파이썬만 쓴다.
   인프라와 배포에서 흔히 부딪히는 로직: 재시도, 서킷 브레이커, 속도 제한, 롤링 업데이트, 로드 밸런싱 등.
   상태를 다루거나 난수를 쓸 때는 순수 함수처럼 동작하도록 시드와 상태 인자를 활용한다. */

module.exports=[

{ k:"지수 백오프와 지터", fn:"exp_backoff", cat:"design",
  q:"<code>exp_backoff(retries, base, cap, seed)</code> 를 구현하세요. API 호출 실패 시 다음 재시도까지 기다릴 <b>지연 시간 목록</b>을 돌려줍니다. <code>i</code> 번째 재시도(i=1부터 <code>retries</code> 까지)의 기본 지연 시간은 <code>min(cap, base * 2^(i-1))</code> 이며, 여기에 <code>0</code> 부터 이 기본 시간 사이의 무작위 값(지터)을 <code>random.uniform</code> 으로 뽑아 더한 값이 최종 지연 시간입니다(<code>round(v, 4)</code> 로). <code>retries</code> 가 0 이하면 <code>[]</code>. 아래 구현은 지터를 고정된 비율로 더합니다.",
  src:`def exp_backoff(retries, base, cap, seed):
    import random
    random.seed(seed)
    if retries <= 0:
        return []
    out = []
    for i in range(1, retries + 1):
        delay = min(cap, base * (2 ** (i - 1)))
        # TODO: 지터는 delay 사이에서 균등 무작위여야 한다
        jitter = delay * 0.5
        out.append(round(delay + jitter, 4))
    return out`,
  sol:`def exp_backoff(retries, base, cap, seed):
    import random
    random.seed(seed)
    if retries <= 0:
        return []
    out = []
    for i in range(1, retries + 1):
        delay = min(cap, base * (2 ** (i - 1)))
        jitter = random.uniform(0, delay)
        out.append(round(delay + jitter, 4))
    return out`,
  tests:[
    ["exp_backoff(4, 1.0, 10.0, 42)","[1.6394, 2.05, 5.1001, 9.7857]"],
    ["exp_backoff(2, 0.5, 2.0, 42)","[0.8197, 1.025]"],
    ["exp_backoff(5, 1.0, 5.0, 42)","[1.6394, 2.05, 5.1001, 6.1161, 8.6824]"],
    ["exp_backoff(0, 1.0, 10.0, 42)","[]"]],
  edge:[
    ["exp_backoff(1, 100.0, 1.0, 42)","[1.6394]"]],
  ex:"🎯 재시도 로직에서 **지연 시간(Backoff)** 이 중요한 이유는 실패한 서비스가 복구될 시간을 주기 위해서입니다. 하지만 수천 대의 클라이언트가 동시에 지수 백오프를 쓰면 결국 같은 시간에 다시 요청을 보내는 '천둥 떼 현상(Thundering Herd)' 이 발생합니다.\n💡 **지터(Jitter)** 는 이 재시도 시점들을 무작위로 흩어놓아 서버 부하를 분산시키는 역할을 합니다. AWS 에서 가장 널리 쓰이는 Full Jitter 패턴은 원래 계산된 지연 시간과 0 사이에서 무작위 값을 뽑아 최종 지연에 더하거나(`delay + random(0, delay)`) 그냥 그 무작위 값 자체를(`random(0, delay)`) 지연으로 씁니다.\n⚠️ 지터를 단순히 상수로 넣거나 좁은 범위에서 뽑으면 결국 분산 효과가 사라집니다.\n🔧 이 패턴은 HTTP 클라이언트, 메세지 큐 소비자, 데이터베이스 연결 풀 등 네트워크 실패가 가능한 모든 곳의 필수 조건입니다." },

{ k:"토큰 버킷 속도 제한", fn:"token_bucket", cat:"internals",
  q:"<code>token_bucket(cap, rate, reqs)</code> 를 구현하세요. 버킷의 최대 용량은 <code>cap</code> 이고, 초당 <code>rate</code> 개씩 토큰이 찹니다. 처음에 버킷은 가득 차 있습니다. <code>reqs</code> 는 <code>(시간(초), 필요한_토큰)</code> 의 목록입니다. 각 요청마다 토큰이 <b>충분하면 빼고 <code>True</code></b>, 부족하면 <b>거부하고(토큰 유지) <code>False</code></b> 를 돌려주는 목록을 만드세요. 이전 요청과 <b>시간 차이</b>만큼 토큰이 차오르며 최대 <code>cap</code> 을 넘지 않습니다. 아래 코드는 시간 차이 반영이 틀렸습니다.",
  src:`def token_bucket(cap, rate, reqs):
    tokens = cap
    out = []
    last_t = 0 if not reqs else reqs[0][0]
    for t, n in reqs:
        # TODO: 시간 차이 계산과 버킷 용량 제한이 잘못되었다
        tokens += (t - last_t) * rate
        last_t = t
        if tokens >= n:
            tokens -= n
            out.append(True)
        else:
            out.append(False)
    return out`,
  sol:`def token_bucket(cap, rate, reqs):
    tokens = cap
    out = []
    last_t = 0 if not reqs else reqs[0][0]
    for t, n in reqs:
        tokens = min(cap, tokens + (t - last_t) * rate)
        last_t = t
        if tokens >= n:
            tokens -= n
            out.append(True)
        else:
            out.append(False)
    return out`,
  tests:[
    ["token_bucket(10, 2, [(0, 5), (10, 15)])","[True, False]"],
    ["token_bucket(5, 1, [(0, 5), (5, 5)])","[True, True]"],
    ["token_bucket(5, 1, [(0, 5), (1, 10)])","[True, False]"],
    ["token_bucket(10, 5, [])","[]"]],
  edge:[
    ["token_bucket(3, 1, [(0, 1), (10, 1)])","[True, True]"]],
  ex:"🎯 토큰 버킷(Token Bucket)은 API 속도 제한(Rate Limiting)의 표준 알고리즘입니다. Leaky Bucket 이 고정된 처리율만 허용하는 반면, 토큰 버킷은 토큰이 남아있다면 **일시적인 트래픽 폭주(Burst)를 허용**한다는 강력한 장점이 있습니다.\n⚠️ `min(cap, ...)` 제한이 빠지면 요청이 없을 때 토큰이 무한히 쌓여, 나중에 엄청난 버스트를 허용하게 되어 서버가 터집니다.\n💡 이 알고리즘의 우아함은 백그라운드 스레드로 1초마다 토큰을 채워넣을 필요가 **없다**는 점입니다. 요청이 들어온 순간에 이전 요청과의 '시간 차이' 만 계산해서 한 번에 채우면 되므로, 상태 공간(O(1))과 계산이 아주 저렴합니다.\n🔧 Nginx 의 `limit_req`, AWS API Gateway 등 상용 API 속도 제한의 핵심 엔진입니다." },

{ k:"서킷 브레이커", fn:"circuit_breaker", cat:"internals",
  q:"<code>circuit_breaker(calls, limit)</code> 를 구현하세요. <code>calls</code> 는 호출의 성공 여부(<code>True</code>/<code>False</code>) 리스트입니다. 상태는 '닫힘(정상)' 이고 <b>연속 <code>limit</code> 번 실패</b>하면 '열림(차단)' 이 됩니다. '열림' 상태에서 <b>한 번이라도 성공</b>(반-열림 시도)하면 즉시 '닫힘' 이 되고, 실패하면 계속 '열림' 입니다. 각 호출에 대해, '열림' 상태에서 들어온 호출은 원래 결과를 무시하고 <b>무조건 <code>False</code>(차단)</b> 로 바꾸어 돌려줍니다. 열림 상태가 되면 <code>limit-1</code> 개만큼의 호출을 차단한 후, 다음 1개의 호출을 반-열림 시도로 간주합니다. (성공 시 닫히고, 실패 시 다시 처음부터 차단 시작). 아래 코드는 반-열림 로직이 구현되지 않아 영원히 닫히지 않습니다.",
  src:`def circuit_breaker(calls, limit):
    out = []
    fails = 0
    state = "CLOSED"
    for c in calls:
        if state == "CLOSED":
            if c:
                fails = 0
                out.append(True)
            else:
                fails += 1
                if fails >= limit:
                    state = "OPEN"
                out.append(False)
        else:
            # TODO: 반-열림(Half-Open) 메커니즘을 제대로 구현하지 않았다
            out.append(False)
    return out`,
  sol:`def circuit_breaker(calls, limit):
    out = []
    fails = 0
    state = "CLOSED"
    open_count = 0
    for c in calls:
        if state == "CLOSED":
            if c:
                fails = 0
                out.append(True)
            else:
                fails += 1
                if fails >= limit:
                    state = "OPEN"
                    open_count = limit - 1
                out.append(False)
        elif state == "OPEN":
            if open_count > 0:
                # 차단 기간 중에는 실제 호출 무시
                open_count -= 1
                out.append(False)
            else:
                # 반-열림 시도
                if c:
                    state = "CLOSED"
                    fails = 0
                    out.append(True)
                else:
                    open_count = limit - 1 # 다시 차단
                    out.append(False)
    return out`,
  tests:[
    ["circuit_breaker([False, False, True, False, True, True], 2)","[False, False, False, False, False, True]"],
    ["circuit_breaker([False, False, False, True, True, True], 2)","[False, False, False, True, True, True]"],
    ["circuit_breaker([False, False, False, False, True], 2)","[False, False, False, False, False]"],
    ["circuit_breaker([True, True], 3)","[True, True]"]],
  edge:[
    ["circuit_breaker([], 1)","[]"]],
  ex:"🎯 서킷 브레이커(Circuit Breaker)는 장애의 연쇄(Cascading Failure)를 막는 마이크로서비스의 핵심 방어 기제입니다. 하위 서비스가 느려지거나 죽었을 때, 계속 요청을 보내면 스레드가 모두 대기 상태에 빠지면서 내 서비스마저 멈추게 됩니다.\n💡 브레이커가 '열리면(차단)' 요청을 즉시 실패(Fast Fail) 처리하여 자원 고갈을 막습니다. 이 문제에서는 단순화를 위해 차단 기간을 '요청 횟수(limit)' 로 잡았습니다.\n⚠️ 반-열림(Half-Open) 상태는 차단 후 일정 시간(여기선 요청 수)이 지났을 때 서비스가 회복되었는지 '찔러보는' 상태입니다. 이 시도 하나가 성공하면 회로를 닫고(CLOSED), 실패하면 다시 회로를 열어(OPEN) 둡니다.\n🔧 Spring Cloud Resilience4j 나 Istio 와 같은 서비스 메시는 이 패턴을 투명하게 주입해 주어, 비즈니스 코드 수정 없이도 장애 격리를 가능하게 합니다." },

{ k:"가중치 라운드 로빈", fn:"weighted_rr", cat:"internals",
  q:"<code>weighted_rr(servers, n)</code> 을 구현하세요. <code>servers</code> 는 <code>{'id': 'A', 'w': 가중치}</code> 딕셔너리의 리스트입니다. <b>가중치만큼 연속해서</b> 해당 서버를 선택하는 방식으로 <code>n</code> 개의 선택된 서버 <code>id</code> 목록을 만듭니다. 순서는 리스트에 주어진 서버 순서대로 돕니다. 가중치가 0인 서버는 건너뛰고, 가용한 서버가 없거나 <code>n <= 0</code> 이면 <code>[]</code> 입니다. 아래 구현은 가용한 서버가 없을 때 무한 루프에 빠집니다.",
  src:`def weighted_rr(servers, n):
    if n <= 0 or not servers: return []
    out = []
    i = 0
    # TODO: 모든 서버의 가중치가 0일 때 무한 루프 발생
    while len(out) < n:
        srv = servers[i]
        for _ in range(srv['w']):
            if len(out) < n:
                out.append(srv['id'])
        i = (i + 1) % len(servers)
    return out`,
  sol:`def weighted_rr(servers, n):
    if n <= 0 or not servers: return []
    total_w = sum(s['w'] for s in servers)
    if total_w == 0: return []

    out = []
    i = 0
    while len(out) < n:
        srv = servers[i]
        for _ in range(srv['w']):
            if len(out) < n:
                out.append(srv['id'])
        i = (i + 1) % len(servers)
    return out`,
  tests:[
    ["weighted_rr([{'id':'A','w':2}, {'id':'B','w':1}], 5)","['A', 'A', 'B', 'A', 'A']"],
    ["weighted_rr([{'id':'A','w':1}, {'id':'B','w':0}, {'id':'C','w':1}], 3)","['A', 'C', 'A']"],
    ["weighted_rr([{'id':'X','w':3}], 4)","['X', 'X', 'X', 'X']"],
    ["weighted_rr([{'id':'A','w':0}], 5)","[]"]],
  edge:[
    ["weighted_rr([{'id':'A','w':0}, {'id':'B','w':0}], 5)","[]"]],
  ex:"🎯 라운드 로빈은 단순하지만, 서버 스펙이 다를 때 트래픽을 고르게 처리하지 못합니다. 가중치 라운드 로빈(Weighted Round Robin)은 서버 성능(또는 연결 용량)에 비례해 요청을 분배합니다.\n💡 가장 기초적인 방식은 가중치만큼 리스트에 넣고 도는 것(예: AAB AAB)입니다. Nginx 나 HAProxy 같은 로드 밸런서의 기본 분배 방식 중 하나입니다.\n⚠️ 가중치가 모두 0 이거나, 헬스 체크 실패로 동적으로 가중치가 0 이 된 경우를 처리하지 않으면 로드 밸런서 스레드가 요청을 분배할 곳을 찾지 못해 무한 루프에 빠져 CPU 를 100% 점유해버리는 치명적 장애가 납니다.\n🔧 실제 Nginx 의 `smooth weighted round-robin` 알고리즘은 AAB 대신 ABA 로 섞어서 요청이 한 서버로 일시에 몰리는 것(burst)을 방지하는 우아한 수학적 기법을 씁니다." },

{ k:"일관된 해싱 (링 배치)", fn:"consistent_hash", cat:"internals",
  q:"<code>consistent_hash(nodes, keys)</code> 를 구현하세요. 각 노드 문자열과 키 문자열을 정수(여기선 문자열 길이로 단순화)로 맵핑합니다. <code>hash(x) = len(x)</code>. <b>가장 가까운 시계 방향(값 이상)</b>의 노드들(문자열 길이와 이름 기준 정렬)을 찾아 키를 배치한 결과 딕셔너리(<code>{'노드': [키리스트]}</code>)를 돌려줍니다. 노드 값보다 큰 키는 <b>링의 첫 번째 노드</b>로 돌아갑니다. 노드가 없으면 빈 딕셔너리. 아래 구현은 링의 감싸기(wraparound)가 빠졌습니다.",
  src:`def consistent_hash(nodes, keys):
    if not nodes: return {}
    ring = sorted([(len(n), n) for n in nodes])
    out = {n: [] for n in nodes}
    for k in keys:
        h = len(k)
        target = None
        for r_h, r_n in ring:
            if r_h >= h:
                target = r_n
                break
        # TODO: 노드를 못 찾았을 때 링의 첫 번째로 돌아가야 한다
        if target:
            out[target].append(k)
    return out`,
  sol:`def consistent_hash(nodes, keys):
    if not nodes: return {}
    ring = sorted([(len(n), n) for n in nodes])
    out = {n: [] for n in nodes}
    for k in keys:
        h = len(k)
        target = None
        for r_h, r_n in ring:
            if r_h >= h:
                target = r_n
                break
        if target is None:
            target = ring[0][1]
        out[target].append(k)
    return out`,
  tests:[
    ["consistent_hash(['N1', 'Node2'], ['K1', 'Key_2', 'LongerKey'])","{'N1': ['K1', 'LongerKey'], 'Node2': ['Key_2']}"],
    ["consistent_hash(['N1', 'N2'], ['K1', 'K2'])","{'N1': ['K1', 'K2'], 'N2': []}"],
    ["consistent_hash(['Node'], ['K', 'LongKey'])","{'Node': ['K', 'LongKey']}"],
    ["consistent_hash([], ['K1'])","{}"]],
  edge:[
    ["consistent_hash(['A', 'BB'], ['C'])","{'A': ['C'], 'BB': []}"]],
  ex:"🎯 전통적인 해시 분배 `hash(key) % N` 은 서버(N) 대수가 하나라도 늘거나 줄어들면 거의 모든 키의 매핑이 바뀌어 대규모 캐시 미스(Cache Stampede)를 일으킵니다.\n💡 일관된 해싱(Consistent Hashing)은 해시 공간을 거대한 링(Ring)으로 만들고 노드와 키를 링 위에 배치합니다. 키는 링을 따라 시계 방향으로 돌다가 처음 만나는 노드에 저장됩니다. 이렇게 하면 노드가 추가/삭제될 때 **그 노드의 인접한 키들만** 재배치되므로 이동이 최소화됩니다.\n⚠️ 해시값이 모든 노드보다 클 때 링의 맨 처음 인덱스로 넘어가는 Wraparound 처리가 핵심입니다. 이것이 빠지면 특정 키들이 저장될 곳을 잃습니다.\n🔧 실무에서는 노드 간 데이터 불균형을 막기 위해 가상 노드(Virtual Nodes) 기법을 써서 한 물리 노드를 링 위에 수백 개 흩뿌립니다. Redis Cluster 나 Cassandra 의 데이터 파티셔닝 핵심 원리입니다." },

{ k:"유의적 버전 갱신", fn:"bump_semver", cat:"design",
  q:"<code>bump_semver(v, bump)</code> 를 구현하세요. <code>v</code> 는 <code>\"MAJOR.MINOR.PATCH\"</code> 형식의 문자열이고, <code>bump</code> 는 <code>'major'</code>, <code>'minor'</code>, <code>'patch'</code> 중 하나입니다. 지시된 단계를 1 올리고 <b>하위 단계는 0 으로 초기화</b>한 문자열을 돌려줍니다. 형식이 맞지 않거나 알 수 없는 bump 면 <code>None</code>. 아래 구현은 하위 단계를 초기화하지 않습니다.",
  src:`def bump_semver(v, bump):
    parts = v.split('.')
    if len(parts) != 3: return None
    try:
        M, m, p = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        return None

    if bump == 'major':
        M += 1
        # TODO: major 가 오르면 minor 와 patch 는 0 이 되어야 한다
    elif bump == 'minor':
        m += 1
    elif bump == 'patch':
        p += 1
    else:
        return None
    return f"{M}.{m}.{p}"`,
  sol:`def bump_semver(v, bump):
    parts = v.split('.')
    if len(parts) != 3: return None
    try:
        M, m, p = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        return None

    if bump == 'major':
        M += 1
        m = 0
        p = 0
    elif bump == 'minor':
        m += 1
        p = 0
    elif bump == 'patch':
        p += 1
    else:
        return None
    return f"{M}.{m}.{p}"`,
  tests:[
    ["bump_semver('1.2.3', 'patch')","'1.2.4'"],
    ["bump_semver('1.2.3', 'minor')","'1.3.0'"],
    ["bump_semver('1.2.3', 'major')","'2.0.0'"],
    ["bump_semver('0.9.9', 'minor')","'0.10.0'"]],
  edge:[
    ["bump_semver('1.2', 'patch')","None"],
    ["bump_semver('1.2.a', 'patch')","None"]],
  ex:"🎯 유의적 버전(Semantic Versioning, SemVer)은 소프트웨어의 호환성 약속입니다. MAJOR 는 하위 호환성이 깨질 때, MINOR 는 기능이 추가될 때, PATCH 는 버그가 수정될 때 올립니다.\n⚠️ `1.2.3` 에서 minor 를 올릴 때 `1.3.3` 이 아니라 `1.3.0` 이 되어야 합니다. 상위 버전이 바뀌면 하위 버전은 무조건 0으로 초기화(Reset)되어야 한다는 규칙을 빼먹으면, 의존성 관리 도구(npm, pip 등)가 버전을 잘못 해석해 치명적인 빌드 깨짐을 유발할 수 있습니다.\n💡 CI/CD 파이프라인에서 Git 태그나 커밋 메시지(예: `feat:`, `fix:`)를 분석해 자동으로 이 버전을 올려주는 도구(Semantic Release)가 널리 쓰입니다.\n🔧 버전은 문자열이 아니라 숫자의 배열입니다. 버전을 비교할 때 문자열 비교를 쓰면 `'1.10.0' < '1.2.0'` 이 되어버리는 유명한 함정이 있습니다." },

{ k:"비밀값 로깅 마스킹", fn:"mask_secrets", cat:"internals",
  q:"<code>mask_secrets(text, secrets)</code> 을 구현하세요. <code>text</code> 안에서 <code>secrets</code> 리스트에 있는 문자열들을 <b>길이에 상관없이 항상 <code>'***'</code></b> 로 바꾼 문자열을 돌려줍니다. <code>secrets</code> 가 빈 문자열을 포함하면 그것은 무시하고, 비밀 문자열 중 긴 것부터 처리해 포함관계를 방어하세요. 아래 구현은 비밀의 길이를 고려하지 않아 긴 비밀의 일부가 남게 됩니다.",
  src:`def mask_secrets(text, secrets):
    if not text or not secrets: return text
    out = text
    # TODO: 'password123' 와 'password' 가 있을 때 긴 것부터 마스킹해야 한다
    for s in secrets:
        if s:
            out = out.replace(s, "***")
    return out`,
  sol:`def mask_secrets(text, secrets):
    if not text or not secrets: return text
    out = text
    for s in sorted([s for s in secrets if s], key=len, reverse=True):
        out = out.replace(s, "***")
    return out`,
  tests:[
    ["mask_secrets('key=secret123', ['secret', 'secret123'])","'key=***'"],
    ["mask_secrets('pwd=MyPassWord', ['Pass', 'MyPassWord'])","'pwd=***'"],
    ["mask_secrets('text without secret', ['secret'])","'text without ***'"],
    ["mask_secrets('text', [])","'text'"]],
  edge:[
    ["mask_secrets('key=abc', [''])","'key=abc'"],
    ["mask_secrets('pass=12345, v=123', ['123', '12345'])","'pass=***, v=***'"]],
  ex:"🎯 DevOps 와 SRE 의 악몽 중 하나는 DB 패스워드나 API 토큰이 평문으로 로그나 에러 트래커(Sentry 등)에 남는 것입니다. 이를 막기 위해 로깅 파이프라인 단에서 정규식이나 문자열 치환으로 마스킹을 수행합니다.\n⚠️ `['password123', 'password']` 처럼 짧은 비밀문자열이 긴 것의 부분집합일 때, 짧은 것부터 치환하면 `***123` 처럼 뒤쪽 글자가 노출되어 버립니다. 반드시 **긴 문자열부터(정렬)** 치환해야 합니다.\n💡 실무에서는 이 방식으론 한계가 있어 로그 포맷 자체를 JSON 으로 강제하고, `password`, `token` 같은 '특정 키' 의 값을 일괄 마스킹하는 구조적 로깅(Structured Logging)을 주로 사용합니다.\n🔧 더 좋은 접근은 비밀값을 환경변수에서 읽을 때 애초에 로그에 찍히지 않는 `SecretStr` 타입으로 감싸버리는 것입니다." },

{ k:"롤링 업데이트 노드 가용성", fn:"rolling_update", cat:"design",
  q:"<code>rolling_update(total, max_surge, max_unav)</code> 를 구현하세요. 총 <code>total</code> 개의 노드를 롤링 업데이트할 때 <b>단계별 총 노드 수(가용 여부 불문) 목록</b>을 반환합니다. 단순화를 위해 업데이트는 한 번의 배치(내리고 올리기)를 1 step으로 간주, 남은 예전 노드가 0이 될 때까지 각 단계마다의 (전체 노드 수 - 종료된 노드 수 + 추가된 노드 수) 가용 수 목록입니다. 단축 규칙: 매 스텝마다 종료할 예전 노드 수 <code>take_down = min(rem, max_unav)</code>, 그리고 전체 노드 수가 <code>total + max_surge</code> 를 넘지 않게 할 때, 배치 도중의 총 노드 수는 항상 <code>total - take_down + max_surge</code> 로 둡니다. 아래 코드는 가용 노드 하한과 상한을 제멋대로 잡습니다.",
  src:`def rolling_update(total, max_surge, max_unav):
    out = []
    rem = total
    while rem > 0:
        # TODO: 가용 노드가 과도하게 떨어지는 버그
        take_down = min(rem, max_unav + max_surge)
        rem -= take_down
        out.append(total - take_down + max_surge)
    return out`,
  sol:`def rolling_update(total, max_surge, max_unav):
    if total <= 0: return []
    out = []
    rem = total
    while rem > 0:
        take_down = min(rem, max_unav)
        current = total - take_down + max_surge
        out.append(current)
        rem -= min(rem, max_unav + max_surge)
    return out`,
  tests:[
    ["rolling_update(5, 1, 1)","[5, 5, 5]"],
    ["rolling_update(3, 2, 0)","[5, 5]"],
    ["rolling_update(4, 0, 2)","[2, 2]"],
    ["rolling_update(0, 1, 1)","[]"]],
  edge:[
    ["rolling_update(10, 25, 25)","[25]"]],
  ex:"🎯 Kubernetes(K8s)의 Deployment 가 배포할 때 쓰는 롤링 업데이트 전략을 손으로 계산해 보는 문제입니다. `maxSurge` 는 전체 노드 수 위로 띄울 수 있는 여분, `maxUnavailable` 은 일시적으로 잃어도 되는 가용성입니다.\n⚠️ 버그 코드는 한 번에 너무 많은 노드를 내려버려서(max_unav + max_surge) 가용성이 `total - max_unav` 밑으로 떨어지게 만듭니다. 트래픽 피크 시간에 이 설정이 틀리면 요청의 절반이 502 에러를 받습니다.\n💡 두 번째 테스트(`max_unav=0`)를 보면 항상 전체 가용성을 100% 이상 유지하지만 자원을 많이 씁니다. 세 번째 테스트(`max_surge=0`)를 보면 추가 자원 없이 배포하지만 가용성이 50% 로 떨어집니다. 이 트레이드오프를 맞추는 것이 배포 전략의 핵심입니다.\n🔧 블루-그린(Blue-Green) 배포는 `maxSurge=100%`, `maxUnavailable=0%` 인 극단적인 롤링 업데이트와 논리적으로 같습니다." },

{ k:"IP CIDR 매치", fn:"cidr_match", cat:"internals",
  q:"<code>cidr_match(ip, cidr)</code> 를 구현하세요. IPv4 주소가 <code>'192.168.1.0/24'</code> 형식의 네트워크에 속하는지 <code>True/False</code> 로 돌려줍니다. <code>ip</code> 는 <code>'A.B.C.D'</code> 문자열. 32비트 정수로 변환 후 마스크 비트 수(예: 24)만큼 앞에서부터 비교합니다. 잘못된 형식이면 <code>False</code>. 아래 코드는 비트 시프트 연산 방향이 틀렸습니다.",
  src:`def cidr_match(ip, cidr):
    def ip_to_int(addr):
        parts = addr.split('.')
        if len(parts) != 4: return None
        return (int(parts[0]) << 24) + (int(parts[1]) << 16) + (int(parts[2]) << 8) + int(parts[3])

    try:
        net, bits = cidr.split('/')
        bits = int(bits)
        ip_i = ip_to_int(ip)
        net_i = ip_to_int(net)
        if ip_i is None or net_i is None: return False

        # TODO: 마스크는 '32 - bits' 만큼 오른쪽으로 밀어내서 상위 비트만 비교해야 한다
        mask = (1 << bits) - 1
        return (ip_i & mask) == (net_i & mask)
    except:
        return False`,
  sol:`def cidr_match(ip, cidr):
    def ip_to_int(addr):
        parts = addr.split('.')
        if len(parts) != 4: return None
        return (int(parts[0]) << 24) + (int(parts[1]) << 16) + (int(parts[2]) << 8) + int(parts[3])

    try:
        net, bits = cidr.split('/')
        bits = int(bits)
        ip_i = ip_to_int(ip)
        net_i = ip_to_int(net)
        if ip_i is None or net_i is None: return False

        shift = 32 - bits
        return (ip_i >> shift) == (net_i >> shift)
    except:
        return False`,
  tests:[
    ["cidr_match('192.168.1.15', '192.168.1.0/24')","True"],
    ["cidr_match('192.168.2.15', '192.168.1.0/24')","False"],
    ["cidr_match('10.0.0.5', '10.0.0.0/8')","True"],
    ["cidr_match('192.168.1.15', '192.168.1.15/32')","True"]],
  edge:[
    ["cidr_match('1.1.1.1', '1.1.1.0/0')","True"],
    ["cidr_match('invalid_ip', '1.1.1.0/24')","False"]],
  ex:"🎯 CIDR(Classless Inter-Domain Routing)은 클라우드 환경(VPC, 서브넷 구성, 방화벽 룰 등)에서 인프라 엔지니어가 매일 다루는 표기법입니다.\n⚠️ 32비트 IP 주소에서 `/24` 란 '앞에서부터 24개의 비트가 고정' 이라는 뜻입니다. 버그 코드처럼 마스크를 만들어서 AND(&) 하려면 `0xFFFFFF00` 을 만들어야 하는데, 단순히 `(1 << 24) - 1` 을 하면 하위 24비트를 보게 되어 정반대의 네트워크 매칭이 일어납니다.\n💡 가장 깔끔한 계산은 상위 비트만 남기고 나머지 하위 `32 - 24 = 8` 비트를 오른쪽으로 시프트(`>>`)로 버려버린 후 두 숫자가 일치하는지 보는 것입니다.\n🔧 AWS Security Group 에서 특정 대역의 접속만 허용할 때 이 연산이 보이지 않게 수행됩니다. VPC 설계 시 이 비트 놀음에 익숙하지 않으면 IP 대역이 겹쳐서 라우팅이 박살나는 참사가 일어납니다." },

{ k:"로그 로테이션 (최대 보관 개수)", fn:"log_rotate", cat:"design",
  q:"<code>log_rotate(logs, max_files)</code> 를 구현하세요. 현재 디렉토리의 파일 목록 <code>logs</code>(문자열) 중에서 <code>'app.log'</code>, <code>'app.log.1'</code>, <code>'app.log.2'</code> 등의 이름만 골라냅니다. 파일이 로테이트될 때 모든 파일의 번호가 1씩 오르며, <code>max_files</code>(기본 원본 포함)를 초과하는 <b>가장 오래된 파일들의 목록(삭제 대상)</b>을 반환하세요. 번호가 클수록 오래된 파일입니다. <code>max_files <= 0</code> 이면 모두 삭제. 아래 코드는 삭제 기준이 반대로 되었습니다.",
  src:`def log_rotate(logs, max_files):
    apps = [f for f in logs if f.startswith('app.log')]
    if max_files <= 0:
        return sorted(apps)
    targets = []
    for f in apps:
        if f == 'app.log':
            num = 0
        else:
            try: num = int(f.split('.')[-1])
            except: continue
        targets.append((num, f))

    # TODO: 오래된 것(번호가 큰 것)을 지워야 한다
    targets.sort()
    to_delete = max(0, len(targets) - max_files)
    return [f for _, f in targets[:to_delete]]`,
  sol:`def log_rotate(logs, max_files):
    apps = [f for f in logs if f.startswith('app.log')]
    if max_files <= 0: return sorted(apps)
    targets = []
    for f in apps:
        if f == 'app.log':
            num = 0
        else:
            try: num = int(f.split('.')[-1])
            except: continue
        targets.append((num, f))

    targets.sort(reverse=True) # 번호가 큰(오래된) 것부터
    # 남길 파일 수 제외하고 삭제
    to_delete = max(0, len(targets) - max_files)
    return [f for _, f in targets[:to_delete]]`,
  tests:[
    ["log_rotate(['app.log', 'app.log.1', 'app.log.2', 'app.log.3'], 2)","['app.log.3', 'app.log.2']"],
    ["log_rotate(['app.log', 'app.log.1'], 5)","[]"],
    ["log_rotate(['app.log.3', 'app.log'], 1)","['app.log.3']"],
    ["log_rotate(['other.log', 'app.log'], 0)","['app.log']"]],
  edge:[
    ["log_rotate(['app.log.invalid', 'app.log.99'], 1)","[]"]],
  ex:"🎯 애플리케이션에서 로그를 파일로 쓸 때, 디스크 공간이 꽉 차서(No space left on device) 서비스 전체가 죽는(Disk Full) 장애는 아주 고전적이고 흔한 패턴입니다. 이를 막기 위해 일정 크기나 기간마다 파일을 쪼개고 오래된 것을 지우는 것이 Log Rotation 입니다.\n⚠️ 로테이션 관례상 `app.log` 가 최신이고, `.1`, `.2` 순으로 번호가 밀려납니다(즉 번호가 클수록 오래된 파일). 정렬을 오름차순으로 하고 앞쪽을 지워버리면, 가장 최신 로그(`app.log`)가 삭제되어 장애 분석을 전혀 할 수 없게 됩니다.\n💡 로그 파일명이 문자열이므로 `'app.log.10'` 과 `'app.log.2'` 를 단순 문자열 비교하면 `10 < 2` 가 되는 문제가 있어, 반드시 추출해서 숫자로 정렬해야 합니다.\n🔧 실무 환경에서는 개발자가 이걸 짜지 않고 Linux 의 `logrotate` 유틸리티에 설정(conf)만 던져주거나, 컨테이너 환경에서는 STDOUT 으로 던지고 Filebeat 나 Fluentd 가 수집하게 맡기는 것이 베스트 프랙티스입니다." },

{ k:"도커 레이어 캐시 무효화", fn:"docker_cache", cat:"design",
  q:"<code>docker_cache(dockerfile, changed_files)</code> 를 구현하세요. <code>COPY</code> 나 <code>ADD</code> 명령에서 변경된 파일이 포함되면 캐시가 깨집니다. <b>캐시가 깨진 후의 모든 명령어</b>(RUN, COPY 등)는 새로 실행해야 하므로, 캐시를 <b>사용하지 못하고 새로 빌드되는 명령어의 수</b>를 반환하세요. <code>dockerfile</code> 과 <code>changed_files</code> 는 문자열 리스트입니다. 아래 코드는 깨진 시점 이후를 전부 무효화하지 않습니다.",
  src:`def docker_cache(dockerfile, changed_files):
    invalidated = 0
    cache_broken = False
    for line in dockerfile:
        parts = line.strip().split()
        if not parts: continue
        cmd = parts[0]

        if cmd in ['COPY', 'ADD'] and len(parts) >= 2:
            src = parts[1]
            if src in changed_files:
                # TODO: 한 번 깨지면 이후의 모든 명령어가 다시 실행되어야 한다
                invalidated += 1
            elif cache_broken:
                invalidated += 1
        elif cache_broken:
            invalidated += 1

    return invalidated`,
  sol:`def docker_cache(dockerfile, changed_files):
    invalidated = 0
    cache_broken = False
    for line in dockerfile:
        parts = line.strip().split()
        if not parts: continue
        cmd = parts[0]

        if not cache_broken and cmd in ['COPY', 'ADD'] and len(parts) >= 2:
            src = parts[1]
            if src in changed_files:
                cache_broken = True

        if cache_broken:
            invalidated += 1

    return invalidated`,
  tests:[
    ["docker_cache(['FROM u', 'COPY req.txt .', 'RUN pip', 'COPY src/ .'], ['src/'])","1"],
    ["docker_cache(['FROM u', 'COPY req.txt .', 'RUN pip', 'COPY src/ .'], ['req.txt'])","3"],
    ["docker_cache(['FROM u', 'RUN apt'], ['src/'])","0"],
    ["docker_cache(['COPY a .', 'COPY b .'], ['a'])","2"]],
  edge:[
    ["docker_cache(['COPY . .', 'RUN build'], [])","0"]],
  ex:"🎯 Docker 빌드 시스템의 핵심인 '레이어 캐싱' 원리입니다. Dockerfile 의 각 줄은 하나의 레이어(Layer)가 되고, 앞선 레이어의 입력이 바뀌면 그 레이어의 해시가 바뀌어 **그 이후의 모든 레이어 캐시가 무효화(Invalidation)** 됩니다.\n⚠️ 버그 코드는 변경된 파일이 있는 특정 `COPY` 만 무효화한다고 착각하는 대표적인 안티패턴입니다. 캐시는 종속적이기 때문에 한 번 깨지는 순간(Flag=True) 뒤따르는 명령어는 볼 것도 없이 전부 새로 돌아갑니다.\n💡 이 때문에 첫 번째 테스트와 두 번째 테스트의 결과가 극명하게 다릅니다. 소스코드(`src/`)가 바뀌면 뒤에 1줄만 빌드하지만, 의존성 파일(`req.txt`)이 바뀌면 무거운 `RUN pip` 까지 3줄이 재실행됩니다.\n🔧 그래서 Dockerfile 을 쓸 때는 '자주 안 바뀌는 것(OS 패키지, 라이브러리 설치)' 을 위로 올리고, '자주 바뀌는 것(앱 소스코드)' 을 맨 아래로 내려야 빌드 시간이 수십 분에서 몇 초로 단축됩니다." },

{ k:"정족수 락 (Quorum Lock)", fn:"quorum_lock", cat:"internals",
  q:"<code>quorum_lock(nodes, success_list)</code> 를 구현하세요. 분산 시스템에서 총 <code>nodes</code> 대의 서버에 락(Lock)을 요청하여 각 서버의 성공 여부가 <code>success_list</code> 에 담깁니다. 락을 획득하려면 <b>과반수(N/2 초과)</b>의 서버에서 성공해야 합니다. 획득했으면 <code>True</code>, 실패했으면 얻었던 락들도 <b>모두 해제(Rollback)</b>해야 하므로 <code>False</code> 를 반환하세요. 아래 코드는 딱 절반(N/2)일 때를 통과시킵니다.",
  src:`def quorum_lock(nodes, success_list):
    if nodes <= 0 or not success_list: return False
    success_count = sum(1 for s in success_list if s)
    # TODO: 과반수는 절반 '초과' 이어야 한다. (N/2)는 짝수 노드 시 스플릿 브레인 발생
    if success_count >= nodes / 2:
        return True
    return False`,
  sol:`def quorum_lock(nodes, success_list):
    if nodes <= 0 or not success_list: return False
    success_count = sum(1 for s in success_list if s)
    if success_count > nodes / 2:
        return True
    return False`,
  tests:[
    ["quorum_lock(3, [True, True, False])","True"],
    ["quorum_lock(4, [True, True, False, False])","False"],
    ["quorum_lock(5, [True, True, True, False, False])","True"],
    ["quorum_lock(3, [False, False, False])","False"]],
  edge:[
    ["quorum_lock(2, [True, False])","False"]],
  ex:"🎯 분산 데이터베이스(Redis Sentinel, ZooKeeper, etcd)에서 합의를 이루고 락을 획득하는 근본 원리인 정족수(Quorum)입니다. 네트워크 단절(Network Partition) 상황에서 양쪽 그룹이 각자 자기가 리더라고 착각하는 현상을 막습니다.\n⚠️ 노드가 4대일 때 `N/2` 인 2대의 동의만으로 락을 주면, 네트워크가 정확히 2대 2로 쪼개졌을 때(Split Brain) 양쪽이 모두 락을 획득하여 데이터를 동시에 수정해버려 데이터가 돌이킬 수 없이 오염됩니다. 그래서 정족수는 반드시 **초과(>)** 이어야 합니다.\n💡 이 규칙 때문에 분산 시스템은 항상 홀수 대(3, 5, 7대)로 구성합니다. 4대 클러스터의 정족수는 3대이고 3대 클러스터의 정족수는 2대입니다. 즉 4대로 구성하면 비용은 비싼데 죽어도 되는 서버 수는 1대로 똑같아 가용성에 아무 이득이 없습니다.\n🔧 실무에서 Redlock 같은 분산 락 알고리즘을 쓸 때, 시간 동기화(NTP)나 타임아웃 지연 같은 문제 때문에 과반수를 넘더라도 락을 잃는 복잡한 엣지 케이스들을 추가로 다루게 됩니다." }

];
