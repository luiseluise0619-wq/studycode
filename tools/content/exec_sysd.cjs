/* 시스템 설계 실행형 12문항 — 순수 파이썬. devops 배치와 주제가 겹치지 않게 골랐다
   (백오프·토큰버킷·서킷브레이커·일관된해싱·정족수는 devops 에 이미 있다).
   설계 트랙은 '고르는 문제' 가 대부분이었는데, 정책을 직접 계산해 보면 왜 그 선택인지가 남는다. */

module.exports=[

{ k:"고정 창과 슬라이딩 창", fn:"window_count", cat:"debug",
  q:"<code>window_count(events, now, size, kind)</code> 를 구현하세요. <code>kind</code> 가 <code>'fixed'</code> 면 <b><code>now</code> 가 속한 고정 구간</b>(<code>t // size</code> 가 같은 것)의 이벤트 수를, <code>'sliding'</code> 이면 <b><code>now − size</code> 보다 뒤에 온</b> 이벤트 수를 셉니다. 그 밖의 <code>kind</code> 는 <code>-1</code> 입니다. 아래 구현은 두 방식을 구별하지 않습니다.",
  src:`def window_count(events, now, size, kind):
    if kind not in ('fixed', 'sliding'):
        return -1
    if size <= 0:
        return 0
    # TODO: 고정 창은 '경계' 로 자르고 슬라이딩 창은 '지금 기준' 으로 센다
    return sum(1 for t in events if t > now - size)`,
  sol:`def window_count(events, now, size, kind):
    if kind not in ('fixed', 'sliding'):
        return -1
    if size <= 0:
        return 0
    if kind == 'fixed':
        bucket = now // size
        return sum(1 for t in events if t // size == bucket)
    return sum(1 for t in events if t > now - size)`,
  tests:[
    ["window_count([0, 1, 59, 60, 61], 61, 60, 'fixed')","2"],
    ["window_count([0, 1, 59, 60, 61], 61, 60, 'sliding')","3"],
    ["window_count([59, 59, 59, 60, 60, 60], 60, 60, 'fixed')","3"],
    ["window_count([59, 59, 59, 60, 60, 60], 60, 60, 'sliding')","6"],
    ["window_count([], 10, 60, 'sliding')","0"],
    ["window_count([1], 10, 60, 'weird')","-1"]],
  edge:[
    ["window_count([1, 2], 10, 0, 'fixed')","0"],
    ["window_count([0], 0, 60, 'fixed')","1"]],
  ex:"🎯 세 번째와 네 번째 테스트를 나란히 보세요 — 같은 이벤트인데 고정 창은 3, 슬라이딩 창은 6 을 셉니다. **고정 창은 경계에서 두 배까지 통과시킵니다**: 분당 100회 제한이라면 59초에 100회, 60초에 100회를 보내 1초 안에 200회가 지나갑니다.\n💡 그래도 고정 창을 쓰는 이유는 **비용**입니다. 카운터 하나만 있으면 되고 원자적 증가로 끝나지만, 슬라이딩 로그는 이벤트 타임스탬프를 전부 들고 있어야 해서 메모리가 요청 수에 비례합니다. 그 중간이 sliding window counter(직전 창과 현재 창을 비율로 섞는 근사)이고, 실무에서 가장 흔합니다.\n⚠️ 두 방식을 섞어 구현하는 실수가 조용한 이유는 **정상 트래픽에서 결과가 거의 같기** 때문입니다. 차이는 경계 근처에 요청이 몰릴 때만 드러나고, 그때는 이미 하류가 무너진 뒤입니다.\n🔧 그래서 레이트 리밋을 고를 때 묻는 것은 '정확한가' 가 아니라 '**무엇을 보호하는가**' 입니다. 하류가 순간 폭주에 취약하면 슬라이딩(또는 토큰 버킷)이 필요하고, 단순히 월간 쿼터를 세는 것이면 고정 창으로 충분합니다." },

{ k:"캐시 스탬피드와 요청 병합", fn:"single_flight", cat:"design",
  q:"<code>single_flight(requests, load_ms)</code> 를 구현하세요. <code>requests</code> 는 <code>(시각, 키)</code> 목록입니다. 캐시에 없는 키는 <b>적재</b>를 시작하고 <code>load_ms</code> 뒤에 끝나 그 뒤로는 캐시에 남습니다. <b>적재가 진행 중일 때 같은 키의 요청이 오면 새로 적재하지 않고 기다립니다</b>(single-flight). 실제로 일어난 <b>적재 횟수</b>를 돌려주세요.",
  src:`def single_flight(requests, load_ms):
    done = {}                       # key -> 적재가 끝난 시각
    loads = 0
    for t, key in requests:
        if key in done and t >= done[key]:
            continue
        # TODO: 적재가 '진행 중' 인 동안 온 요청은 어떻게 해야 하는가
        loads += 1
        done[key] = t + load_ms
    return loads`,
  sol:`def single_flight(requests, load_ms):
    inflight = {}          # key -> 적재가 끝나는 시각
    done = set()
    loads = 0
    for t, key in requests:
        if key in done:
            continue
        if key in inflight:
            if t < inflight[key]:
                continue           # 진행 중인 적재에 합류한다
            done.add(key)
            continue
        loads += 1
        inflight[key] = t + load_ms
    return loads`,
  tests:[
    ["single_flight([(0,'a'), (1,'a'), (2,'b'), (3,'a')], 5)","2"],
    ["single_flight([(0,'a'), (0,'a'), (0,'a')], 5)","1"],
    ["single_flight([(0,'a'), (10,'a')], 5)","1"],
    ["single_flight([], 5)","0"],
    ["single_flight([(0,'a'), (5,'a')], 5)","1"]],
  edge:[
    ["single_flight([(0,'a'), (1,'b'), (2,'c')], 5)","3"],
    ["single_flight([(0,'a')] * 100, 5)","1"]],
  ex:"🎯 캐시 스탬피드(thundering herd)는 **인기 키가 만료되는 순간** 일어납니다. 그 키를 기다리던 요청 수천 개가 동시에 캐시 미스를 겪고 전부 DB 로 내려가, 평소 잘 버티던 시스템이 한 번에 무너집니다. 마지막 edge 테스트가 그 상황입니다 — 100개 요청이 적재 1회로 줄어듭니다.\n💡 해법의 핵심은 '**진행 중**' 이라는 세 번째 상태입니다. 캐시를 '있음/없음' 두 상태로만 보면 적재가 끝나기 전에 온 요청을 구별할 수 없어 전부 새 적재를 시작합니다. `inflight` 맵 하나가 그 상태를 표현합니다.\n⚠️ 세 번째와 다섯 번째 테스트가 경계를 확인합니다. `t = 5` 에 도착한 요청은 적재가 **막 끝난** 시점이라 합류가 아니라 캐시 적중이어야 합니다 — 이 경계를 `<=` 로 쓰면 이미 끝난 적재에 영원히 합류하는 코드가 됩니다.\n🔧 실전에서는 여기에 두 가지를 더합니다: **조기 재계산**(만료 직전에 확률적으로 미리 갱신해 동시 만료를 흩뜨림)과 **stale-while-revalidate**(만료된 값을 일단 돌려주고 뒤에서 갱신). 분산 환경이라면 single-flight 를 프로세스 안이 아니라 Redis 락으로 걸어야 서버 수만큼 적재가 늘지 않습니다." },

{ k:"LFU 축출은 LRU 와 다르다", fn:"lfu_keys", cat:"internals",
  q:"<code>lfu_keys(ops, cap)</code> 를 구현하세요. <code>ops</code> 는 <code>'p&lt;키&gt;'</code>(넣기) 와 <code>'g&lt;키&gt;'</code>(조회) 목록입니다. 용량을 넘으면 <b>사용 횟수가 가장 적은</b> 키를 버리고, 횟수가 같으면 <b>가장 오래전에 쓴</b> 키를 버립니다. 넣기와 조회 모두 사용 횟수를 1 늘리며(없는 키 조회는 아무 일도 하지 않음), 결과는 남은 키를 <b>정렬해</b> 돌려줍니다.",
  src:`def lfu_keys(ops, cap):
    if cap <= 0:
        return []
    order = []                      # 최근 사용 순서
    for op in ops:
        k = op[1:]
        if op[0] == 'g' and k not in order:
            continue
        if k in order:
            order.remove(k)
        order.append(k)
        # TODO: 이건 LRU 다 — 횟수를 세지 않는다
        if len(order) > cap:
            order.pop(0)
    return sorted(order)`,
  sol:`def lfu_keys(ops, cap):
    if cap <= 0:
        return []
    freq, last, clock = {}, {}, 0
    for op in ops:
        k = op[1:]
        clock += 1
        if op[0] == 'g' and k not in freq:
            continue                       # 없는 키 조회는 만들지 않는다
        if k not in freq and op[0] == 'p' and len(freq) >= cap:
            victim = min(freq, key=lambda x: (freq[x], last[x]))
            del freq[victim]
            del last[victim]
        freq[k] = freq.get(k, 0) + 1
        last[k] = clock
    return sorted(freq)`,
  tests:[
    ["lfu_keys(['pa', 'pb', 'ga', 'ga', 'gb', 'pc'], 2)","['a', 'c']"],
    ["lfu_keys(['pa', 'pb', 'pc'], 2)","['b', 'c']"],
    ["lfu_keys(['pa', 'pa'], 2)","['a']"],
    ["lfu_keys(['gz', 'pa'], 2)","['a']"],
    ["lfu_keys(['pa'], 0)","[]"]],
  edge:[
    ["lfu_keys([], 3)","[]"],
    ["lfu_keys(['pa', 'ga', 'ga', 'pb', 'pc'], 2)","['a', 'c']"]],
  ex:"🎯 첫 테스트가 LFU 와 LRU 를 가릅니다. 사용 횟수는 `a` 가 3, `b` 가 2 이므로 LFU 는 `b` 를 버리지만, 최근 사용 순서로는 `b` 가 마지막이라 **LRU 는 `a` 를 버립니다** — 자주 쓰는 키를 버리는 것입니다.\n💡 둘의 차이는 '무엇을 예측하는가' 입니다. LRU 는 **최근성**(방금 쓴 것은 곧 또 쓴다), LFU 는 **인기도**(많이 쓰인 것은 앞으로도 많이 쓰인다)를 가정합니다. 그래서 순차 스캔이 지나가는 워크로드에서는 LRU 가 캐시를 통째로 오염시키지만 LFU 는 버팁니다.\n⚠️ 반대로 LFU 의 약점은 **캐시 오염(cache pollution)** 입니다. 한때 폭발적으로 인기였던 키가 횟수를 잔뜩 쌓아 두면, 지금 인기 있는 키가 들어오지 못합니다. 그래서 실무 구현은 횟수를 주기적으로 감쇠시키거나(window-LFU) 최근성과 섞습니다 — Redis 의 `allkeys-lfu` 도 확률적 카운터와 감쇠를 씁니다.\n🔧 동점 규칙을 명시한 것도 중요합니다. 새 키는 항상 횟수 1 로 시작하므로 **동점이 끊임없이 발생하고**, 규칙이 없으면 딕셔너리 순회 순서에 따라 답이 달라져 재현 불가능한 캐시 동작이 됩니다." },

{ k:"멱등 키와 TTL", fn:"idempotent", cat:"debug",
  q:"<code>idempotent(ops, ttl)</code> 를 구현하세요. <code>ops</code> 는 <code>(시각, 키, 값)</code> 목록입니다. 같은 키가 <b><code>ttl</code> 이 지나기 전에</b> 다시 오면 실행하지 않고 <b>처음 저장한 값</b>을 돌려줍니다(<code>('재사용', 저장값)</code>). 처음이거나 <code>ttl</code> 이 지났으면 <code>('실행', 새값)</code> 이고 저장값을 갱신합니다. 아래 구현은 재사용할 때 엉뚱한 값을 돌려줍니다.",
  src:`def idempotent(ops, ttl):
    store = {}                      # key -> (만료시각, 값)
    out = []
    for t, key, val in ops:
        hit = store.get(key)
        if hit and t < hit[0]:
            # TODO: 멱등의 핵심은 '처음 결과를 그대로' 돌려주는 것이다
            out.append(('재사용', val))
            continue
        store[key] = (t + ttl, val)
        out.append(('실행', val))
    return out`,
  sol:`def idempotent(ops, ttl):
    store = {}
    out = []
    for t, key, val in ops:
        hit = store.get(key)
        if hit and t < hit[0]:
            out.append(('재사용', hit[1]))   # 처음 저장한 값
            continue
        store[key] = (t + ttl, val)
        out.append(('실행', val))
    return out`,
  tests:[
    ["idempotent([(0,'k1','a'), (1,'k1','b'), (100,'k1','c')], 10)","[('실행', 'a'), ('재사용', 'a'), ('실행', 'c')]"],
    ["idempotent([(0,'k','x'), (0,'k','y')], 0)","[('실행', 'x'), ('실행', 'y')]"],
    ["idempotent([], 10)","[]"],
    ["idempotent([(0,'a','1'), (0,'b','2')], 10)","[('실행', '1'), ('실행', '2')]"]],
  edge:[
    ["idempotent([(0,'k','a'), (10,'k','b')], 10)","[('실행', 'a'), ('실행', 'b')]"],
    ["idempotent([(0,'k','a'), (9,'k','b'), (9,'k','c')], 10)","[('실행', 'a'), ('재사용', 'a'), ('재사용', 'a')]"]],
  ex:"🎯 멱등 키의 계약은 '**두 번 째 요청이 아무 일도 하지 않는다**' 가 아니라 '**첫 번째와 똑같은 응답을 돌려준다**' 입니다. 결제 요청이 타임아웃돼 클라이언트가 재시도했을 때, 두 번째 응답이 비어 있거나 다른 값이면 클라이언트는 결제가 안 됐다고 판단해 또 시도합니다.\n⚠️ 그래서 이 버그가 특히 나쁩니다 — **중복 실행은 막았는데 응답이 틀립니다**. 로그에는 '재사용' 이 찍혀 있어 정상으로 보이고, 문제는 클라이언트 쪽에서 이상한 상태로 나타납니다. 마지막 edge 테스트가 '두 번째·세 번째 모두 첫 값' 을 확인하는 이유입니다.\n💡 TTL 을 두는 이유는 저장소가 무한히 자라지 않게 하기 위해서지만, **TTL 이 재시도 정책보다 짧으면 안 됩니다**. 클라이언트가 24시간 뒤에 재시도하는데 키를 1시간만 들고 있으면 중복 결제가 됩니다. 두 값은 함께 정해야 합니다.\n🔧 실전에서는 키 저장과 실제 작업이 **같은 트랜잭션**이어야 합니다. 키만 먼저 저장하고 작업이 실패하면 재시도가 '재사용' 으로 막혀 영원히 처리되지 않고, 작업만 하고 키 저장에 실패하면 중복 실행됩니다. 그래서 결제·주문 같은 곳에서는 outbox 패턴과 함께 씁니다." },

{ k:"팬아웃 전략의 비용", fn:"fanout_cost", cat:"design",
  q:"<code>fanout_cost(mode, followers, following, posts, reads)</code> 를 구현하세요. <code>'push'</code>(쓰기 팬아웃)는 글을 쓸 때 팔로워 수만큼 복사하므로 <code>posts × followers + reads</code>, <code>'pull'</code>(읽기 팬아웃)은 읽을 때 팔로잉 수만큼 모으므로 <code>posts + reads × following</code> 회의 연산이 듭니다. 그 밖의 <code>mode</code> 는 <code>-1</code> 입니다.",
  src:`def fanout_cost(mode, followers, following, posts, reads):
    if mode == 'push':
        # TODO: push 는 '쓸 때' 팔로워 수만큼 퍼뜨린다
        return posts + reads * following
    if mode == 'pull':
        return posts * followers + reads
    return -1`,
  sol:`def fanout_cost(mode, followers, following, posts, reads):
    if mode == 'push':
        return posts * followers + reads
    if mode == 'pull':
        return posts + reads * following
    return -1`,
  tests:[
    ["fanout_cost('push', 1000, 200, 10, 50)","10050"],
    ["fanout_cost('pull', 1000, 200, 10, 50)","10010"],
    ["fanout_cost('push', 1000000, 200, 10, 50)","10000050"],
    ["fanout_cost('pull', 1000000, 200, 10, 50)","10010"],
    ["fanout_cost('weird', 1, 1, 1, 1)","-1"]],
  edge:[
    ["fanout_cost('push', 0, 0, 0, 0)","0"],
    ["fanout_cost('push', 5, 200, 10, 50) < fanout_cost('pull', 5, 200, 10, 50)","True"]],
  ex:"🎯 세 번째와 네 번째 테스트가 **셀럽 문제**입니다. 팔로워가 100만이면 글 하나를 쓸 때마다 100만 번 복사해야 하므로 push 비용이 1,000만으로 폭발하지만, pull 은 그대로 10,010 입니다. 반대로 마지막 edge 처럼 팔로워가 적으면 push 가 훨씬 쌉니다.\n💡 그래서 실제 서비스는 **둘을 섞습니다**. 일반 사용자의 글은 미리 팔로워 타임라인에 밀어 넣고(push — 읽기가 빠름), 팔로워가 문턱을 넘는 계정의 글은 읽을 때 합칩니다(pull). 트위터가 이 하이브리드로 알려져 있습니다.\n⚠️ 이 계산에서 빠진 것이 **지연 시간**입니다. push 는 읽기가 O(1) 이라 타임라인이 즉시 뜨지만 쓰기가 느리고(비동기 큐로 미룸), pull 은 쓰기가 즉시지만 읽을 때마다 팔로잉 수만큼 조회해 첫 화면이 느립니다. 총 연산 수가 같아도 **어느 쪽이 사용자를 기다리게 하는가**가 다릅니다.\n🔧 그리고 push 에는 숨은 비용이 있습니다 — 팔로우/언팔로우할 때 과거 타임라인을 어떻게 할지, 비활성 사용자에게도 밀어 넣을지(대부분은 안 함), 저장 공간이 팔로워 관계 수에 비례한다는 점. 설계 면접에서 이 질문이 반복되는 이유는 **정답이 없고 트레이드오프를 말해야 하기** 때문입니다." },

{ k:"자기가 쓴 것은 자기가 읽어야 한다", fn:"route_read", cat:"design",
  q:"복제 지연이 있는 시스템에서 읽기를 라우팅하는 <code>route_read(writes, reads, lag)</code> 를 구현하세요. <code>writes</code>·<code>reads</code> 는 <code>(시각, 사용자)</code> 목록이고, <b>그 사용자의 마지막 쓰기로부터 <code>lag</code> 이 지나지 않았으면</b> <code>'주'</code>(주 노드), 아니면 <code>'복제'</code> 로 보냅니다. 결과는 읽기 순서대로의 목록입니다. 아래 구현은 사용자를 구별하지 않습니다.",
  src:`def route_read(writes, reads, lag):
    last = None
    for t, u in writes:
        # TODO: 마지막 쓰기는 '사용자마다' 다르다
        if last is None or t > last:
            last = t
    out = []
    for t, u in reads:
        out.append('주' if last is not None and t < last + lag else '복제')
    return out`,
  sol:`def route_read(writes, reads, lag):
    last = {}
    for t, u in writes:
        if u not in last or t > last[u]:
            last[u] = t
    out = []
    for t, u in reads:
        w = last.get(u)
        out.append('주' if w is not None and t < w + lag else '복제')
    return out`,
  tests:[
    ["route_read([(0,'u1')], [(1,'u1'), (100,'u1'), (1,'u2')], 10)","['주', '복제', '복제']"],
    ["route_read([], [(1,'u1')], 10)","['복제']"],
    ["route_read([(0,'u1')], [(10,'u1')], 10)","['복제']"],
    ["route_read([(0,'u1'), (50,'u1')], [(55,'u1')], 10)","['주']"],
    ["route_read([(0,'u1')], [], 10)","[]"]],
  edge:[
    ["route_read([(0,'u1'), (0,'u2')], [(5,'u1'), (5,'u2'), (5,'u3')], 10)","['주', '주', '복제']"],
    ["route_read([(0,'u1')], [(0,'u1')], 0)","['복제']"]],
  ex:"🎯 복제 지연이 만드는 가장 흔한 버그는 '**댓글을 달았는데 새로고침하니 사라졌다**' 입니다. 쓰기는 주 노드로 가고 읽기는 복제본으로 가는데, 복제가 아직 안 끝났으면 자기가 방금 쓴 것을 못 봅니다 — 사용자에게는 **데이터가 사라진 것**으로 보입니다.\n💡 이 보장을 **read-your-writes consistency** 라고 하며, 가장 싼 해법이 이 문항의 방식입니다: 쓴 직후 짧은 시간만 그 사용자의 읽기를 주 노드로 보냅니다. 전체 읽기를 주 노드로 보내면 복제본을 둔 의미가 없으므로, '누가' 와 '언제까지' 를 좁히는 것이 요점입니다.\n⚠️ 그래서 사용자를 구별하지 않는 구현이 위험합니다 — 누군가 쓸 때마다 **모든 사용자의 읽기가 주 노드로 몰려** 트래픽이 많을수록 복제본이 놀고 주 노드가 죽습니다. 첫 테스트의 `u2` 와 edge 의 `u3` 가 그 경우입니다.\n🔧 더 정확한 방법은 시간이 아니라 **복제 위치**를 쓰는 것입니다. 쓰기 응답에 로그 시퀀스 번호(LSN·GTID)를 담아 클라이언트가 들고 다니고, 읽을 때 그 지점까지 따라잡은 복제본을 고릅니다. 시간 기반은 `lag` 을 실제 복제 지연보다 넉넉히 잡아야 하는데, 그 값이 상황에 따라 변한다는 것이 약점입니다." },

{ k:"블룸 필터는 한쪽으로만 틀린다", fn:"bloom", cat:"debug",
  q:"<code>bloom(items, queries, m, k)</code> 를 구현하세요. 비트 배열 크기는 <code>m</code>, 해시는 <code>k</code> 개이며 <code>i</code> 번째 해시는 <code>(rolling(s) + i * 7919) % m</code> 입니다(<code>rolling(s)</code> 는 <code>v = (v * 31 + ord(ch)) % 1000003</code>). 넣을 때와 확인할 때 <b>같은 k 개</b>를 씁니다. 각 질의가 '있을 수 있음' 이면 <code>True</code> 입니다. 아래 구현은 넣을 때 해시를 하나만 씁니다.",
  src:`def bloom(items, queries, m, k):
    def rolling(s):
        v = 0
        for ch in s:
            v = (v * 31 + ord(ch)) % 1000003
        return v
    bits = [0] * m
    for it in items:
        # TODO: 넣을 때와 볼 때 해시 개수가 다르면 안 된다
        bits[(rolling(it) + 0 * 7919) % m] = 1
    out = []
    for q in queries:
        h = rolling(q)
        out.append(all(bits[(h + i * 7919) % m] for i in range(k)))
    return out`,
  sol:`def bloom(items, queries, m, k):
    def rolling(s):
        v = 0
        for ch in s:
            v = (v * 31 + ord(ch)) % 1000003
        return v
    bits = [0] * m
    for it in items:
        h = rolling(it)
        for i in range(k):
            bits[(h + i * 7919) % m] = 1
    out = []
    for q in queries:
        h = rolling(q)
        out.append(all(bits[(h + i * 7919) % m] for i in range(k)))
    return out`,
  tests:[
    ["bloom(['a', 'b', 'c'], ['a', 'b', 'c'], 64, 3)","[True, True, True]"],
    ["bloom([], ['a'], 64, 3)","[False]"],
    ["all(bloom(list('abcdefgh'), list('abcdefgh'), 32, 3))","True"],
    ["bloom(['apple'], ['apple', 'banana'], 128, 4)","[True, False]"],
    ["bloom(['x'], ['x'], 8, 1)","[True]"]],
  edge:[
    ["all(bloom(list('abcdefgh'), list('abcdefgh'), 16, 3))","True"],
    ["bloom(['a'], ['a', 'a', 'a'], 64, 3)","[True, True, True]"]],
  ex:"🎯 블룸 필터의 계약은 **비대칭**입니다 — '없다' 고 하면 확실히 없고(위음성 없음), '있다' 고 하면 있을 수도 있습니다(위양성 가능). 세 번째와 첫 edge 테스트가 그 보장을 확인합니다: `m` 을 32 에서 16 으로 줄여 충돌을 늘려도 **넣은 것은 반드시 True** 여야 합니다.\n⚠️ 넣을 때와 볼 때 해시 개수가 다르면 이 보장이 깨집니다. 넣을 때 1개만 켜고 볼 때 3개를 확인하면 **넣은 것도 False 가 나옵니다** — 위음성이 생기는 순간 블룸 필터는 쓸 수 없습니다. 캐시 앞에 두면 있는 데이터를 없다고 판단해 조회 자체를 건너뛰기 때문입니다.\n💡 이 비대칭이 쓰임새를 정합니다. '**없으면 비싼 조회를 건너뛴다**' 가 전형적인 용법입니다 — 디스크·네트워크에 물어보기 전에 필터에 먼저 묻고, '없다' 면 확실하니 바로 끝냅니다. '있다' 는 답은 확인이 필요하므로 실제 조회로 이어지고, 그 비율이 곧 위양성률입니다.\n🔧 크기 산정은 공식이 있습니다: 원소 `n` 개를 위양성률 `p` 로 담으려면 `m ≈ −n·ln(p)/(ln2)²` 비트, 해시는 `k ≈ (m/n)·ln2` 개입니다. 1% 위양성이면 원소당 약 10비트로, 실제 데이터보다 훨씬 작습니다. 다만 **원소를 지울 수 없다**는 한계가 있어(비트를 끄면 다른 원소가 깨짐) 삭제가 필요하면 counting Bloom filter 를 씁니다." },

{ k:"사가는 역순으로 보상한다", fn:"saga_compensate", cat:"internals",
  q:"<code>saga_compensate(steps, fail_at)</code> 를 구현하세요. <code>steps</code> 를 순서대로 실행하다 인덱스 <code>fail_at</code> 의 단계가 실패하면, <b>이미 완료된 단계들을 역순으로</b> 보상해야 합니다. 보상할 단계 이름을 순서대로 돌려주세요. <code>fail_at</code> 이 음수이거나 <code>len(steps)</code> 이상이면 실패가 없었다는 뜻이라 <code>[]</code> 입니다.",
  src:`def saga_compensate(steps, fail_at):
    if fail_at < 0 or fail_at >= len(steps):
        return []
    # TODO: 보상은 어느 방향으로 하는가
    return steps[:fail_at]`,
  sol:`def saga_compensate(steps, fail_at):
    if fail_at < 0 or fail_at >= len(steps):
        return []
    return steps[:fail_at][::-1]      # 완료된 것들을 역순으로`,
  tests:[
    ["saga_compensate(['a', 'b', 'c'], 2)","['b', 'a']"],
    ["saga_compensate(['a', 'b', 'c'], 0)","[]"],
    ["saga_compensate(['a', 'b', 'c'], -1)","[]"],
    ["saga_compensate(['a', 'b', 'c'], 3)","[]"],
    ["saga_compensate(['결제', '재고차감', '배송요청'], 2)","['재고차감', '결제']"]],
  edge:[
    ["saga_compensate([], 0)","[]"],
    ["saga_compensate(['a'], 0)","[]"]],
  ex:"🎯 분산 트랜잭션에서 2단계 커밋을 쓸 수 없을 때(서비스가 서로 다른 DB 를 가질 때) 쓰는 것이 **사가 패턴**입니다. 각 단계를 독립적으로 커밋하고, 실패하면 **이미 커밋된 것들을 되돌리는 보상 트랜잭션**을 실행합니다.\n💡 역순이어야 하는 이유는 **의존 관계** 때문입니다. 결제 → 재고 차감 → 배송 요청 순으로 진행했다면, 재고를 복원하기 전에 결제를 취소하면 '결제는 취소됐는데 재고는 잡혀 있는' 중간 상태가 생깁니다. 진행할 때 쌓은 순서를 정확히 거꾸로 벗겨야 각 시점이 일관됩니다 — 스택을 되감는 것과 같습니다.\n⚠️ 두 번째 테스트가 중요합니다. 첫 단계가 실패하면 **보상할 것이 없습니다**. `steps[:0]` 은 빈 목록인데, 이걸 `steps[:fail_at+1]` 로 쓰면 실패한 단계 자체를 보상하려 들어 '하지도 않은 결제를 취소' 하게 됩니다.\n🔧 실무의 어려움은 이 코드가 아니라 **보상이 항상 가능하지는 않다**는 데 있습니다. 이메일을 이미 보냈다면 되돌릴 수 없고, 재고를 다른 주문이 가져갔다면 복원이 실패합니다. 그래서 되돌리기 어려운 단계를 **뒤쪽에 배치**하고, 보상 자체도 재시도 가능하게(멱등하게) 만들며, 끝내 실패하면 사람이 처리할 큐로 보냅니다." },

{ k:"중복 제거 창이 좁으면 다시 처리된다", fn:"dedupe_consume", cat:"debug",
  q:"at-least-once 전달을 다루는 <code>dedupe_consume(messages, window)</code> 를 구현하세요. <code>messages</code> 는 <code>(id, 값)</code> 목록이고, <b>최근 <code>window</code> 개의 id</b> 만 기억합니다. 기억하고 있는 id 면 건너뛰고, 아니면 처리합니다. <code>(처리한 값 목록, 이미 처리한 적 있는데 또 처리한 횟수)</code> 를 돌려주세요. 아래 구현은 창 크기를 무시합니다.",
  src:`def dedupe_consume(messages, window):
    seen, ever = [], set()
    out, dup = [], 0
    for mid, val in messages:
        # TODO: seen 이 무한히 자라면 window 가 의미가 없다
        if mid in seen:
            continue
        if mid in ever:
            dup += 1
        ever.add(mid)
        seen.append(mid)
        out.append(val)
    return out, dup`,
  sol:`def dedupe_consume(messages, window):
    seen, ever = [], set()
    out, dup = [], 0
    for mid, val in messages:
        if mid in seen:
            continue
        if mid in ever:
            dup += 1                  # 창 밖으로 밀려나 다시 처리됐다
        ever.add(mid)
        out.append(val)
        seen.append(mid)
        while len(seen) > window:
            seen.pop(0)
    return out, dup`,
  tests:[
    ["dedupe_consume([('1','a'), ('2','b'), ('1','a'), ('3','c'), ('1','a')], 2)","(['a', 'b', 'c', 'a'], 1)"],
    ["dedupe_consume([('1','a'), ('2','b'), ('1','a'), ('3','c'), ('1','a')], 10)","(['a', 'b', 'c'], 0)"],
    ["dedupe_consume([('1','a'), ('1','a')], 0)","(['a', 'a'], 1)"],
    ["dedupe_consume([], 5)","([], 0)"],
    ["dedupe_consume([('1','a'), ('2','b')], 5)","(['a', 'b'], 0)"]],
  edge:[
    ["dedupe_consume([('1','a')] * 5, 1)","(['a'], 0)"],
    ["dedupe_consume([('1','a'), ('2','b'), ('1','c')], 1)","(['a', 'b', 'c'], 1)"]],
  ex:"🎯 메시지 큐의 기본 보장은 대부분 **at-least-once** 입니다 — 소비자가 ack 하기 전에 죽으면 재전달되므로 중복이 옵니다. 그래서 소비자는 반드시 멱등해야 하고, 그 흔한 구현이 '최근 처리한 id 를 기억하기' 입니다.\n⚠️ 함정은 기억이 **유한하다**는 것입니다. 무한히 들고 있으면 메모리가 터지므로 창이나 TTL 로 잘라야 하는데, 그 창이 **재전달 간격보다 짧으면** 중복이 그대로 통과합니다. 첫 테스트와 두 번째 테스트가 같은 입력에 창 크기만 다른데 결과가 갈립니다.\n💡 마지막 edge 가 그 지점을 정확히 보여 줍니다 — 창이 1이면 `2` 를 기억하는 순간 `1` 이 밀려나, 바로 다음에 온 `1` 이 다시 처리됩니다. 이런 사고는 **트래픽이 늘어야** 드러납니다. 개발 환경에서는 메시지가 드물어 창이 충분해 보이고, 운영에서 초당 수천 건이 흐르면 창이 몇 밀리초 분량이 됩니다.\n🔧 그래서 실무에서는 개수가 아니라 **시간 기준 TTL** 로 잡고, 그 TTL 을 큐의 최대 재전달 지연(visibility timeout × 최대 재시도)보다 길게 둡니다. 더 확실한 방법은 애초에 **처리 자체를 멱등하게** 만드는 것입니다 — `INSERT ... ON CONFLICT DO NOTHING` 처럼 DB 제약으로 중복을 막으면 창 크기를 고민할 필요가 없습니다." },

{ k:"용량 산정", fn:"capacity", cat:"design",
  q:"<code>capacity(dau, actions, peak_mult, bytes_each, days)</code> 를 구현해 <code>(피크 QPS, 저장량 GB)</code> 를 돌려주세요. 평균 QPS 는 <code>dau × actions / 86400</code>, 피크는 거기에 <code>peak_mult</code> 를 곱한 값이며 <b>소수 둘째 자리까지 반올림</b>합니다. 저장량은 <code>dau × actions × days × bytes_each / 1e9</code> GB 입니다(1 GB = 10⁹ 바이트). 아래 구현은 피크를 고려하지 않습니다.",
  src:`def capacity(dau, actions, peak_mult, bytes_each, days):
    avg_qps = dau * actions / 86400
    # TODO: 트래픽은 하루 종일 고르게 오지 않는다
    storage_gb = dau * actions * days * bytes_each / 1e9
    return round(avg_qps, 2), round(storage_gb, 2)`,
  sol:`def capacity(dau, actions, peak_mult, bytes_each, days):
    avg_qps = dau * actions / 86400
    peak_qps = avg_qps * peak_mult
    storage_gb = dau * actions * days * bytes_each / 1e9
    return round(peak_qps, 2), round(storage_gb, 2)`,
  tests:[
    ["capacity(1000000, 10, 3, 1000, 30)","(347.22, 300.0)"],
    ["capacity(86400, 1, 1, 0, 1)","(1.0, 0.0)"],
    ["capacity(0, 10, 3, 1000, 30)","(0.0, 0.0)"],
    ["capacity(86400, 1, 5, 1000, 1)","(5.0, 0.09)"]],
  edge:[
    ["capacity(1000000, 10, 1, 1000, 30)","(115.74, 300.0)"],
    ["capacity(1000000, 10, 3, 1000, 365)","(347.22, 3650.0)"]],
  ex:"🎯 용량 산정에서 가장 자주 빠지는 것이 **피크 배수**입니다. 평균 QPS 로 서버를 맞추면 저녁 시간대에 정확히 절반이 실패합니다 — 실제 서비스의 피크는 평균의 2~5배이고, 이벤트나 푸시 알림이 있으면 10배도 나옵니다.\n💡 첫 테스트와 첫 edge 를 비교하면 그 차이가 보입니다: 같은 트래픽인데 피크를 고려하면 347 QPS, 안 하면 116 QPS 입니다. 서버를 3배 적게 준비하는 셈이고, 그 결과는 '평소엔 멀쩡한데 피크 때만 죽는' 시스템입니다.\n⚠️ 저장량 계산에서도 흔한 실수가 있습니다. 이 계산은 **원본 한 벌**만 셉니다 — 복제본 3벌이면 3배, 인덱스가 데이터만큼 크면 또 2배, 백업까지 더하면 실제 필요량은 계산값의 6~10배가 됩니다. 두 번째 edge 처럼 보존 기간을 30일에서 365일로 늘리면 12배로 뛰는 것도 함께 봐야 합니다.\n🔧 설계 면접에서 이 계산을 시키는 이유는 정확한 숫자가 아니라 **자릿수와 병목**을 보기 위해서입니다. 347 QPS 는 서버 한 대로도 되지만 3.5만 QPS 는 완전히 다른 설계이고, 300GB 는 한 대에 들어가지만 3TB 는 샤딩이 필요합니다. 계산의 목적은 '**어디서 구조가 바뀌는가**' 를 찾는 것입니다." },

{ k:"샤드를 늘리면 얼마나 움직이나", fn:"moved_keys", cat:"internals",
  q:"나머지 연산 샤딩에서 샤드 수를 <code>before</code> 에서 <code>after</code> 로 바꿀 때 <b>다른 샤드로 옮겨야 하는 키의 수</b>를 세는 <code>moved_keys(keys, before, after)</code> 를 구현하세요. 키는 정수이고 샤드는 <code>key % 샤드수</code> 로 정합니다. <code>before</code> 나 <code>after</code> 가 1 미만이면 <code>-1</code> 입니다.",
  src:`def moved_keys(keys, before, after):
    if before < 1 or after < 1:
        return -1
    if before == after:
        return 0
    # TODO: 정말 전부 움직이는가? 세어 보자
    return len(keys)`,
  sol:`def moved_keys(keys, before, after):
    if before < 1 or after < 1:
        return -1
    return sum(1 for k in keys if k % before != k % after)`,
  tests:[
    ["moved_keys(list(range(100)), 4, 5)","80"],
    ["moved_keys(list(range(100)), 4, 4)","0"],
    ["moved_keys(list(range(10)), 1, 2)","5"],
    ["moved_keys([], 3, 5)","0"],
    ["moved_keys([1, 2], 0, 5)","-1"]],
  edge:[
    ["moved_keys(list(range(1000)), 10, 11)","900"],
    ["moved_keys(list(range(100)), 5, 4)","80"]],
  ex:"🎯 나머지 샤딩의 문제는 '**거의 전부 움직인다**' 는 것입니다. 첫 테스트에서 샤드를 4개에서 5개로 하나만 늘렸는데 100개 중 80개가 이사합니다. edge 에서 10 → 11 도 90% 입니다 — 샤드 수를 늘릴수록 이동 비율은 `1 − 1/lcm` 에 가까워집니다.\n⚠️ 실무에서 이것이 뜻하는 바: 샤드 하나를 추가하려고 **데이터의 대부분을 네트워크로 옮겨야** 합니다. 그동안 두 배치를 동시에 읽을 수 있어야 하고, 이동 중 쓰기를 어디로 보낼지 정해야 하며, 전체가 몇 시간~며칠 걸립니다. '트래픽이 늘면 샤드를 추가하면 되지' 라는 계획이 실제로는 큰 프로젝트인 이유입니다.\n💡 그래서 **일관된 해싱**이 나왔습니다. 노드를 링에 배치하면 노드 하나를 추가할 때 평균 `1/n` 의 키만 움직입니다 — 4개에서 5개로 갈 때 80% 가 아니라 20% 입니다. 가상 노드를 두어 분포를 고르게 만드는 것까지가 표준 구성입니다.\n🔧 대안도 있습니다. 처음부터 **논리 샤드를 많이**(예: 1024개) 만들어 물리 노드에 매핑해 두면, 노드를 늘릴 때 논리 샤드 단위로만 옮기면 되고 키 재계산이 없습니다. Vitess·Elasticsearch 가 쓰는 방식이고, 나중에 샤드 수를 바꿀 수 없다는 대가를 미리 지불하는 설계입니다." },

{ k:"핫키를 쪼갠다", fn:"hot_key_split", cat:"design",
  q:"<code>hot_key_split(counts, threshold, shards)</code> 를 구현하세요. <code>counts</code> 는 <code>{키: 요청수}</code> 이고, 요청 수가 <b><code>threshold</code> 를 넘는</b>(초과) 키는 <code>shards</code> 개의 하위 키로 쪼개고 나머지는 1 로 둡니다. <b>키를 정렬해</b> <code>(키, 샤드수)</code> 목록을 돌려주세요. <code>shards</code> 가 1 미만이면 <code>[]</code> 입니다.",
  src:`def hot_key_split(counts, threshold, shards):
    if shards < 1:
        return []
    # TODO: 전부 쪼개면 키가 늘기만 하고 얻는 게 없다
    return [(k, shards) for k in sorted(counts)]`,
  sol:`def hot_key_split(counts, threshold, shards):
    if shards < 1:
        return []
    return [(k, shards if counts[k] > threshold else 1) for k in sorted(counts)]`,
  tests:[
    ["hot_key_split({'a': 1000, 'b': 10}, 100, 4)","[('a', 4), ('b', 1)]"],
    ["hot_key_split({'a': 10, 'b': 20}, 100, 4)","[('a', 1), ('b', 1)]"],
    ["hot_key_split({'a': 100}, 100, 4)","[('a', 1)]"],
    ["hot_key_split({}, 100, 4)","[]"],
    ["hot_key_split({'a': 1000}, 100, 0)","[]"]],
  edge:[
    ["hot_key_split({'b': 500, 'a': 500}, 100, 2)","[('a', 2), ('b', 2)]"],
    ["hot_key_split({'a': 101}, 100, 3)","[('a', 3)]"]],
  ex:"🎯 샤딩을 아무리 고르게 해도 **키 하나에 트래픽이 몰리면** 그 샤드만 죽습니다. 인기 게시물의 조회수 카운터, 특정 상품의 재고, 유명인의 팔로워 목록이 전형적입니다 — 샤드 100개 중 99개는 놀고 1개가 과부하입니다.\n💡 해법은 그 키를 `key#0` ~ `key#3` 처럼 쪼개 여러 샤드에 흩고, 읽을 때 합치는 것입니다. 쓰기 부하가 `1/shards` 로 줄고, 대신 **읽기가 shards 번의 조회 + 합산**이 됩니다. 그래서 쓰기가 압도적으로 많은 카운터에 잘 맞고, 읽기가 많은 데이터에는 오히려 손해입니다.\n⚠️ 그래서 '전부 쪼개기' 가 답이 아닙니다(세 번째 테스트와 시작 코드가 그 차이입니다). 한가한 키까지 쪼개면 읽기 비용만 4배가 되고 저장 오버헤드가 붙습니다. **문턱을 두고 소수의 핫키에만** 적용하는 것이 요점입니다.\n🔧 실전의 어려움은 문턱이 아니라 **핫키를 언제 발견하는가** 입니다. 미리 알 수 없으므로 요청 수를 샘플링해 상위 키를 추적하고(count-min sketch 같은 근사 자료구조), 문턱을 넘으면 동적으로 쪼갠 뒤 트래픽이 식으면 되돌립니다. 그 전환 중에 두 배치를 동시에 읽어야 한다는 점이 구현의 대부분을 차지합니다." },

];
