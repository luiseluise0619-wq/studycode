/* exec_py2.cjs 12문항을 python 트랙에 주입한다. 문항 순서가 곧 난이도 순서다(계단식).
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const Q=require("./exec_py2.cjs");
const ROOT="/home/user/studycode";
const EXPECT=12;
if(Q.length!==EXPECT) throw new Error(EXPECT+"문항 기대, 실제 "+Q.length);

const UNIT="실행형 실전 — 시니어 주제를 직접 만든다";
const LESSONS=[
  { t:"설정·스트리밍·자원", n:3,
    th:{ sum:"실무에서 가장 자주 쓰는 세 가지 — **설정을 합치고, 큰 데이터를 흘려보내고, 자원을 안전하게 닫는다**.",
      body:[
        {h:"덮을 것과 남길 것", t:"설정 병합은 뒤가 앞을 덮되 **`None` 은 덮지 않아야** 한다 — '설정하지 않음' 과 '빈 값으로 설정함' 은 다르기 때문이다. 딕셔너리는 재귀 병합하고 리스트는 교체하는 것이 실용적 관례이며, 원본을 바꾸지 않아야 호출자가 놀라지 않는다."},
        {h:"한 번만 흐르는 것", t:"제너레이터는 **한 번 소비하면 소진**되므로 필요한 값을 한 번의 순회에서 모두 누적해야 한다. 그리고 `with` 의 계약은 '어떻게 빠져나가든 `__exit__` 이 불린다' 이다 — `__exit__` 이 True 를 돌려주면 **예외를 삼키므로** 대부분 False 가 맞다."}],
      code:{ c:"def __exit__(self, exc_type, exc, tb):\n    self.close()\n    return False   # 예외를 삼키지 않는다", cap:"True 를 돌려주면 실패가 성공처럼 보인다" },
      key:["None 은 덮지 않는다","리스트는 교체, 딕셔너리는 재귀 병합","제너레이터는 한 번만 순회","__exit__ 의 반환값이 예외를 삼킨다"] } },
  { t:"데코레이터와 캐시", n:3,
    th:{ sum:"함수를 감싸 기능을 더하는 세 가지 — **호출을 세고, 재시도를 계획하고, 최근 것을 기억한다**.",
      body:[
        {h:"감쌌으면 이름을 지킨다", t:"`functools.wraps` 가 없으면 `__name__` 이 `wrapper` 가 되고 `__doc__` 이 사라져 로깅·문서화·디버거가 전부 엉뚱한 이름을 본다. `*args, **kwargs` 로 받아 그대로 넘겨야 어떤 시그니처에도 붙는다."},
        {h:"기다림과 기억", t:"지수 백오프는 상한과 최대 횟수를 함께 둬야 하고, 마지막 시도 뒤에는 기다리지 않으므로 대기 목록의 길이는 `attempts - 1` 이다. LRU 는 **조회도 사용**이라 `get` 이 순서를 갱신하지 않으면 FIFO 가 되고, 같은 키의 `put` 은 크기를 늘리지 않으므로 축출하면 안 된다."}],
      code:{ c:"@functools.wraps(fn)\ndef wrapper(*args, **kwargs):\n    wrapper.calls += 1\n    return fn(*args, **kwargs)", cap:"상태를 wrapper 속성에 두면 바깥에서 읽을 수 있다" },
      key:["데코레이터에는 functools.wraps","백오프는 상한 + 최대 횟수","대기 목록 길이는 attempts−1","LRU 는 get 도 최근 사용으로"] } },
  { t:"타입·메모리·동시성", n:3,
    th:{ sum:"파이썬의 성질을 알아야 판단할 수 있는 셋 — **타입 힌트는 강제되지 않고, 객체는 딕셔너리를 달고 다니며, GIL 이 병렬성을 가른다**.",
      body:[
        {h:"검사와 크기", t:"타입 힌트는 실행 시점에 아무것도 막지 않으므로, 신뢰할 수 없는 입력이 들어오는 **경계에서만** 검사 코드를 둔다. 이때 `isinstance(True, int)` 가 True 라는 점(bool 은 int 의 하위 클래스)이 함정이다. `__slots__` 는 인스턴스 딕셔너리를 없애 메모리를 줄이지만 **동적 속성 추가가 막힌다**."},
        {h:"GIL 이 정하는 선택", t:"CPU 작업은 스레드를 늘려도 GIL 을 서로 뺏느라 빨라지지 않아 **프로세스**가 필요하다. I/O 는 기다리는 동안 GIL 을 놓으므로 스레드로도 겹치고, 라이브러리가 async 를 지원하면 asyncio 가 더 가볍다 — 다만 블로킹 드라이버를 async 코드에서 부르면 **이벤트 루프 전체가 멈춘다**."}],
      code:{ c:"if want is int and isinstance(value, bool):\n    raise TypeError   # bool 은 int 의 하위 클래스다", cap:"수량 자리에 True 가 들어와도 통과해 버린다" },
      key:["타입 힌트는 실행 시점에 강제되지 않는다","bool 은 int 의 하위 클래스","__slots__ 는 대량 값 객체에만","CPU 는 프로세스, I/O 는 스레드나 async"] } },
  { t:"측정·순서·윈도우", n:3,
    th:{ sum:"규모가 커질 때 필요한 셋 — **측정으로 대상을 고르고, 의존으로 순서를 정하고, 자료구조로 반복을 없앤다**.",
      body:[
        {h:"고칠 곳을 숫자로 고른다", t:"최적화의 첫 규칙은 '측정하지 않은 것을 고치지 않는다' 이고, 판단은 절대 시간이 아니라 **비중**으로 한다 — 전체의 5% 를 절반으로 줄여 봐야 2.5% 다. 누적 시간과 자체 시간을 헷갈리면 `main` 이 항상 1위로 보인다."},
        {h:"순서와 후보", t:"초기화 순서를 손으로 관리하면 모듈이 늘 때마다 깨진다 — 의존만 선언하고 **위상 정렬**로 순서를 계산하되, 이름 순으로 골라 출력을 결정적으로 만든다. 슬라이딩 윈도우 최댓값은 창마다 다시 훑으면 O(n·k) 지만, **단조 덱**으로 후보만 남기면 O(n) 이다."}],
      code:{ c:"while idx and xs[idx[-1]] <= v:\n    idx.pop()      # 새 값보다 작은 후보는 버린다\nidx.append(i)      # 값이 아니라 인덱스를 담는다", cap:"덱이 항상 내림차순이라 맨 앞이 최댓값" },
      key:["비중으로 최적화 대상을 고른다","누적 시간과 자체 시간은 다르다","위상 정렬은 결정적 출력까지","단조 덱으로 O(n·k) → O(n)"] } },
];
if(LESSONS.reduce((s,L)=>s+L.n,0)!==EXPECT) throw new Error("레슨 합 불일치");

const norm=s=>String(s).replace(/\s+/g," ").trim();
const path=ROOT+"/data/t-python.js";
const raw=fs.readFileSync(path,"utf8");
const a=raw.indexOf("["), z=raw.lastIndexOf("]");
const arr=JSON.parse(raw.slice(a,z+1));
const existing=new Set();
arr.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>existing.add(norm(q.q)))));
Q.forEach(q=>{ if(existing.has(norm(q.q))) throw new Error("중복 문항 — "+q.k); });
if(arr.some(u=>u.t===UNIT)) throw new Error("유닛 제목 중복");

let cur=0;
const lessons=LESSONS.map(L=>{
  if(!L.th||!L.th.sum||L.th.body.length!==2||!L.th.code||!L.th.key) throw new Error(L.t+": 이론 형식");
  const qs=Q.slice(cur,cur+L.n).map(x=>({ t:"py", k:x.k, cat:"internals", q:x.q, src:x.src, sol:x.sol,
    tests:x.tests.map(c=>({in:c[0],out:c[1]})), edge:x.edge.map(c=>({in:c[0],out:c[1]})), ex:x.ex }));
  cur+=L.n;
  return { t:L.t, xp:80, th:L.th, q:qs };
});
if(cur!==Q.length) throw new Error("배정 누락");
arr.push({ t:UNIT, l:lessons });
fs.writeFileSync(path, raw.slice(0,a)+JSON.stringify(arr)+raw.slice(z+1));

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
if(C.python.units.some(u=>u.title===UNIT)) throw new Error("목차 유닛 중복");
C.python.units.push({ title:UNIT, lessons:LESSONS.map(L=>({ title:L.t, xp:80, n:L.n })) });
fs.writeFileSync(ih, html.slice(0,start)+JSON.stringify(C)+html.slice(end+1));

console.log("주입 완료: python 실행형 +"+Q.length);
