/* exec_sysnet.cjs 24문항을 sysd·net 트랙에 주입한다.
   문항은 이미 쉬운 것부터 어려운 순으로 정렬해 두었다(계단식) — 순서를 바꾸지 않는다.
   전부 성공해야 쓴다(all-or-nothing), 개수는 EXPECT 로 못 박는다 */
const fs=require("fs");
const Q=require("./exec_sysnet.cjs");
const ROOT="/home/user/studycode";
const EXPECT={sysd:12, net:12};
const byTrack={};
Q.forEach(q=>{ (byTrack[q.track]=byTrack[q.track]||[]).push(q); });
Object.keys(EXPECT).forEach(k=>{
  if((byTrack[k]||[]).length!==EXPECT[k]) throw new Error(k+": "+(byTrack[k]||[]).length+"개 (기대 "+EXPECT[k]+")");
});

const PLAN={
sysd:{ unit:"실행형 실전 — 설계의 뒤에 있는 계산", lessons:[
  { t:"용량·쿼럼·레이트", n:3,
    th:{ sum:"설계 문서의 결정은 대부분 **몇 개의 산수** 위에 서 있다 — 용량 산정, 쿼럼 부등식, 윈도우 카운트.",
      body:[
        {h:"평균이 아니라 피크", t:"하루 요청을 86,400초로 나눠 평균 QPS 를 얻고 **피크 배수**를 곱한다. 평균으로 서버를 잡으면 점심시간에 무너진다. 저장량은 QPS 와 달리 **누적**이라, 일 5GB 가 1년이면 1.8TB 이고 여기에 복제본과 인덱스가 곱해진다."},
        {h:"겹치게 만드는 부등식", t:"`R + W > N` 은 읽는 집합과 쓰는 집합이 **반드시 겹치게** 하는 조건이고, 그 겹침이 강한 일관성의 전부다. 레이트 리밋의 슬라이딩 윈도우는 고정 윈도우의 경계 문제(59초·61초에 두 배 통과)를 없애는 대신 요청 시각을 들고 있어야 한다."}],
      code:{ c:"strong = r + w > n\n// N=3,W=2,R=2 — 일관성도 지키고 1대 장애도 견딘다", cap:"N 을 홀수로 잡는 이유도 여기서 나온다" },
      key:["평균 QPS × 피크 배수로 잡는다","저장량은 누적 — 복제본까지 곱한다","R+W>N 이 겹침을 보장한다","슬라이딩 윈도우는 경계 구멍이 없다"] } },
  { t:"버전·팬아웃·샤딩·ID", n:4,
    th:{ sum:"분산 상태를 다루는 네 도구 — **벡터 클록**으로 순서를, **팬아웃**으로 비용을, **샤딩**으로 분산을, **비트 배치**로 ID 를 정한다.",
      body:[
        {h:"시간 대신 인과", t:"벽시계는 서버마다 어긋나므로 분산 이벤트의 순서를 정할 수 없다. 벡터 클록은 '누가 무엇을 보았는가' 로 before·after·**concurrent** 를 판정한다 — 세 번째 답이 핵심이며, 자동으로 고를 수 없다는 신호다."},
        {h:"어디에 비용을 낼 것인가", t:"타임라인은 쓰기 시 퍼뜨리거나 읽을 때 모은다 — 읽기가 훨씬 많으니 보통 쓰기 팬아웃이지만, 팔로워 100만 계정에서 무너져 혼합 전략이 된다. `hash % N` 은 N 이 바뀌면 거의 모든 키가 이사하고(2배 증설만 예외), 분산 ID 는 시각을 상위 비트에 둬 정렬 가능하게 만든다."}],
      code:{ c:"const v = (BigInt(ms) << 22n) | (BigInt(node) << 12n) | BigInt(seq);\nreturn v.toString();   // JSON 숫자로 넣으면 끝자리가 뭉개진다", cap:"41 + 10 + 12 비트 — 시각이 위로" },
      key:["concurrent 는 도메인이 풀어야 한다","팬아웃은 읽기:쓰기 비율이 정한다","샤드는 2의 거듭제곱이 재배치에 유리","64비트 ID 는 문자열로 주고받는다"] } },
  { t:"장애 감지·선출·라우팅·멱등·차단", n:5,
    th:{ sum:"장애 앞에서의 다섯 규율 — **성급히 죽이지 않고, 과반으로 정하고, 신선도로 라우팅하고, 중복을 흡수하고, 못 할 일은 버린다**.",
      body:[
        {h:"판정과 결정", t:"타임아웃만으로는 '노드가 죽었나, 네트워크가 끊겼나' 를 구분할 수 없다 — **여러 대가 동시에 죽어 보이면** 대개 네트워크 쪽이므로 임계치로 폭주를 막는다. 리더 선출의 과반수(절반 **초과**)는 두 과반 집합이 반드시 겹친다는 성질에서 나오고, 그래서 스플릿 브레인이 불가능해진다."},
        {h:"흡수하고 버린다", t:"읽기는 신선도가 필요한 것만 리더로 보내고 나머지는 지연이 임계 안인 복제본으로 보낸다. 재시도는 반드시 오므로 멱등키로 **효과를 한 번**으로 만들고, 결과까지 기억해 돌려줘야 재시도가 안전해진다. 과부하에서는 **이미 마감이 지난 요청부터** 버리는 것이 첫 규칙이다."}],
      code:{ c:"return out.length >= k ? [] : out;\n// 여러 대가 한꺼번에 죽어 보이면 의심할 것은 네트워크다", cap:"멀쩡한 노드를 쫓아내면 상황이 더 나빠진다" },
      key:["대량 실패는 네트워크를 의심한다","과반은 절반 초과 — 홀수로 잡는다","쓴 직후 읽기만 리더로","죽은 요청에 일하지 않는다"] } },
]},
net:{ unit:"실행형 실전 — 프로토콜을 직접 굴린다", lessons:[
  { t:"주소·체크섬·라우팅", n:3,
    th:{ sum:"패킷이 목적지를 찾아가는 세 장치 — **마스크로 대역을 나누고, 합으로 손상을 보고, 가장 구체적인 경로를 고른다**.",
      body:[
        {h:"비트로 나눈 주소", t:"`/24` 는 앞 24비트가 네트워크라는 뜻이고, IP 와 마스크를 AND 하면 네트워크 주소가 나온다. `/25` 같은 어중간한 경계에서 실수가 나며, 자바스크립트는 비트 연산이 **부호 있는 32비트**라 `>>> 0` 로 부호를 털지 않으면 128.x 이상이 전부 틀린다."},
        {h:"싼 검사와 구체성 우선", t:"인터넷 체크섬은 덧셈과 반전뿐이라 라우터가 패킷마다 할 수 있고, 그 대가로 검출 능력이 약하다(고의 변조는 못 막는다). 라우팅은 겹치는 규칙 중 **가장 긴 접두사**가 이긴다 — nginx location·DNS 위임에도 같은 원리가 있다."}],
      code:{ c:"const mask = (0xffffffff << (32 - pfx)) >>> 0;\nconst net  = (toNum(ip) & mask) >>> 0;", cap:">>> 0 을 빼면 128.x 이상에서 음수가 된다" },
      key:["/25 경계에서 대역이 갈린다","체크섬은 실수만 잡는다","최장 접두사가 이긴다","/32 는 호스트 하나짜리 경로"] } },
  { t:"흐름 제어와 재전송", n:3,
    th:{ sum:"TCP 가 하는 일의 핵심 — **용량을 모르는 채 찾아내고, 순서를 복원하고, 언제 다시 보낼지 정한다**.",
      body:[
        {h:"늘려 보고 물러선다", t:"느린 시작의 지수 증가로 빠르게 탐색하고, 임계 이후에는 선형으로 조심스럽게 올린다. 손실이 나면 임계를 **절반**으로 낮춘다 — 증가는 더하기, 감소는 곱하기(AIMD)라는 비대칭이 여러 흐름의 공평한 분배를 만든다. 다만 손실을 혼잡으로 해석하는 전제는 무선망에서 틀린다."},
        {h:"빈칸이 메워질 때까지", t:"수신 창은 순서가 뒤바뀐 패킷을 버퍼에 담고 **이어지는 순간 한꺼번에** 올려보낸다 — 그래서 앞의 하나가 유실되면 뒤가 다 와 있어도 멈춘다(head-of-line blocking). RTO 는 평균만이 아니라 **변동폭**까지 반영해(`srtt + 4·rttvar`) 흔들리는 경로에서 자동으로 넉넉해진다."}],
      code:{ c:"rttvar = 0.75*rttvar + 0.25*|srtt - r|\nsrtt   = 0.875*srtt + 0.125*r\nrto    = srtt + 4*rttvar", cap:"계수가 1/8·1/4 인 것은 시프트로 계산하려고" },
      key:["AIMD 가 공평 분배를 만든다","무선에서는 손실≠혼잡","앞 패킷 하나가 뒤 전부를 막는다","RTO 는 변동폭까지 본다"] } },
  { t:"이름·크기·주소 변환·배분", n:6,
    th:{ sum:"연결이 서기까지 거치는 관문들 — **이름 해석·본문 인코딩·조각내기·주소 변환·대역 배분·핸드셰이크**.",
      body:[
        {h:"따라가고 쪼갠다", t:"CNAME 은 별칭이라 A 레코드를 만날 때까지 따라가야 하고, 순환과 과도한 단계를 **둘 다** 막아야 한다. chunked 인코딩은 전체 길이를 모를 때 쓰는데 길이가 **16진수**이며, 파서가 관대하면 요청 스머글링이 성립한다. MTU 를 넘는 페이로드는 8의 배수 단위로 조각나고, 조각 하나만 잃어도 전체를 다시 보내야 한다."},
        {h:"바꾸고 나누고 줄인다", t:"NAT 은 포트로 내부 호스트를 구분하며 **같은 쌍은 같은 포트를 재사용**해야 세션이 유지된다. 큐는 가중치만큼 나눠 서비스해 낮은 우선순위가 굶지 않게 하고, 연결 지연은 바이트가 아니라 **왕복 수**가 지배한다 — TLS 1.3 이 1 RTT 로 줄인 것이 그래서 큰 개선이다."}],
      code:{ c:"// 첫 요청 지연 = (TCP 1 + TLS n) × RTT\n// 1.2 → 3 RTT · 1.3 → 2 RTT · 재개 → 1 RTT", cap:"RTT 200ms 면 600ms 와 200ms 의 차이다" },
      key:["CNAME 체인은 상한과 방문 기록으로","chunked 길이는 16진수","단편화는 조각 하나만 잃어도 전체 재전송","0-RTT 는 멱등 요청에만"] } },
]},
};

const norm=s=>String(s).replace(/\s+/g," ").trim();
const writes=[];
Object.keys(EXPECT).forEach(track=>{
  const path=ROOT+"/data/t-"+track+".js";
  const raw=fs.readFileSync(path,"utf8");
  const a=raw.indexOf("["), z=raw.lastIndexOf("]");
  const arr=JSON.parse(raw.slice(a,z+1));
  const existing=new Set();
  arr.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>existing.add(norm(q.q)))));
  const items=byTrack[track];
  items.forEach(q=>{ if(existing.has(norm(q.q))) throw new Error(track+": 중복 문항 — "+q.k); });

  const pl=PLAN[track];
  if(pl.lessons.reduce((s,L)=>s+L.n,0)!==EXPECT[track]) throw new Error(track+": 레슨 합 불일치");
  if(arr.some(u=>u.t===pl.unit)) throw new Error(track+": 유닛 제목 중복");
  let cur=0;
  const lessons=pl.lessons.map(L=>{
    if(!L.th||!L.th.sum||L.th.body.length!==2||!L.th.code||!L.th.key) throw new Error(track+"/"+L.t+": 이론 형식");
    const qs=items.slice(cur,cur+L.n).map(x=>({ t:"code", run:"js", k:x.k, cat:x.cat, q:x.q, src:x.src, sol:x.sol,
      tests:x.tests.map(c=>({in:c[0],out:c[1]})), edge:x.edge.map(c=>({in:c[0],out:c[1]})), ex:x.ex }));
    cur+=L.n;
    return { t:L.t, xp:80, th:L.th, q:qs };
  });
  if(cur!==items.length) throw new Error(track+": 배정 누락");
  arr.push({ t:pl.unit, l:lessons });
  writes.push({ path, content: raw.slice(0,a)+JSON.stringify(arr)+raw.slice(z+1) });
});

const ih=ROOT+"/index.html";
const html=fs.readFileSync(ih,"utf8");
const mark="COURSES = ";
const start=html.indexOf(mark+"{")+mark.length;
let depth=0, end=start;
for(let i=start;i<html.length;i++){
  if(html[i]==="{")depth++;
  else if(html[i]==="}"){ depth--; if(!depth){ end=i; break; } }
}
const C=JSON.parse(html.slice(start,end+1));
Object.keys(EXPECT).forEach(track=>{
  const pl=PLAN[track];
  if(C[track].units.some(u=>u.title===pl.unit)) throw new Error(track+": 목차 유닛 중복");
  C[track].units.push({ title:pl.unit, lessons:pl.lessons.map(L=>({ title:L.t, xp:80, n:L.n })) });
});
writes.push({ path:ih, content: html.slice(0,start)+JSON.stringify(C)+html.slice(end+1) });

writes.forEach(w=>fs.writeFileSync(w.path,w.content));
console.log("주입 완료: sysd +12 · net +12 (파일 "+writes.length+"개)");
