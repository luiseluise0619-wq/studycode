/* exec_rt2.cjs 24문항(구현형)을 언어별 트랙에 주입한다 — 러너가 실제 컴파일러로 채점한다.
   java 6 · c 5 · cpp 5 · go 5 · rust 3, 트랙마다 유닛 1개.
   전부 성공해야 쓴다(all-or-nothing), 개수는 EXPECT 로 못 박는다 */
const fs=require("fs");
const Q=require("./exec_rt2.cjs");
const ROOT="/home/user/studycode";

const EXPECT={java:6, c:5, cpp:5, go:5, rust:3};
const SRCNAME={ go:"sol.go", c:"sol.c", cpp:"sol.cpp", java:"Sol.java" };  /* rust 는 주면 lib 타깃이 깨진다 */
const byLang={};
Q.forEach(q=>{ (byLang[q.lang]=byLang[q.lang]||[]).push(q); });
Object.keys(EXPECT).forEach(k=>{
  if((byLang[k]||[]).length!==EXPECT[k]) throw new Error(k+": "+(byLang[k]||[]).length+"개 (기대 "+EXPECT[k]+")");
});
if(Q.length!==24) throw new Error("총 24문항 기대");

const PLAN={
java:{ unit:"실행형 실전 — 표준 라이브러리로 만든다", lessons:[
  { t:"캐시·정렬·구간", n:3,
    th:{ sum:"자바 실무의 절반은 **표준 컬렉션을 정확히 고르고 정확히 쓰는 것**이다 — LRU·다중 정렬·구간 병합이 그 축소판이다.",
      body:[
        {h:"자료구조가 규칙을 대신한다", t:"`LinkedHashMap` 은 삽입 순서를 유지하므로 '지우고 다시 넣기' 로 LRU 가 된다 — 별도 연결 리스트가 필요 없다. 핵심은 **get 도 사용**이라는 것이며, 이걸 빼면 LRU 가 아니라 FIFO 가 되어 자주 쓰는 항목이 쫓겨난다."},
        {h:"정렬 방향과 경계", t:"다중 기준 정렬에서 `reversed()` 를 전체에 걸면 모든 기준이 뒤집힌다 — **뒤집을 기준에만** 건다. 구간 병합은 시작점 정렬이 먼저이고, 병합 시 `Math.max` 를 빼면 포함 관계(`[1,10]` 안의 `[3,4]`)에서 끝이 줄어든다."}],
      code:{ c:"Comparator.comparing((Emp e) -> e.dept)\n  .thenComparing(comparingInt((Emp e) -> e.salary).reversed())", cap:"방향이 섞이면 기준별로 뒤집는다" },
      key:["LRU 는 get 도 최근 사용으로","같은 키 put 은 축출하지 않는다","reversed 는 해당 기준에만","구간 병합은 정렬 + max"] } },
  { t:"스트림·제네릭·파싱", n:3,
    th:{ sum:"의도를 코드에 드러내는 세 도구 — **집계는 수집기로, 계약은 타입 경계로, 형식은 상태 기계로**.",
      body:[
        {h:"집계와 타입 경계", t:"`groupingBy` 는 '분류 함수 + 다운스트림 수집기' 구조라 두 번째 인자만 바꾸면 개수·평균·목록이 된다. **필터가 그룹핑보다 먼저** 와야 '제외된 것만 있는 그룹' 이 0으로 남지 않는다. `<T extends Comparable<T>>` 는 '비교 가능한 타입만' 이라는 컴파일 시점 계약이다."},
        {h:"형식은 상태로 읽는다", t:"CSV 를 `split(\",\")` 로 자르면 따옴표 안의 콤마에서 무너진다 — '따옴표 안인가' 라는 **상태 하나**로 콤마의 의미가 달라진다. 렉서와 같은 구조이며 정규식으로는 깔끔히 표현되지 않는다."}],
      code:{ c:"xs.stream().filter(o -> o.amount > 0)\n  .collect(groupingBy(o -> o.customer,\n           summingInt(o -> o.amount)))", cap:"'없는 것' 과 '0인 것' 은 다르다" },
      key:["필터 → 그룹핑 순서","groupingBy 는 순서를 보장하지 않는다","병합은 <= 로 안정성 확보","CSV 는 상태 기계로 판다"] } },
]},
c:{ unit:"실행형 실전 — 손으로 만드는 자료구조", lessons:[
  { t:"동적 배열과 토크나이저", n:2,
    th:{ sum:"C 에는 자료구조가 없다 — **직접 만들고, 소유권을 문서로 약속한다**.",
      body:[
        {h:"2배씩 늘린다", t:"한 칸씩 늘리면 push 마다 전체 복사라 O(n²) 이지만, **2배로 늘리면 평균 O(1)** 이다(늘리는 횟수가 log n). `realloc` 의 반환값은 **임시 변수로 받아야** 실패 시 기존 데이터를 잃지 않는다. 해제 후 포인터를 NULL 로 만드는 것이 이중 해제의 방어선이다."},
        {h:"버퍼와 상한을 함께 받는다", t:"C 의 관용구는 '버퍼 + 상한을 받고 **필요한 전체 개수를 반환**' 이다(`snprintf` 와 같은 계약) — 호출자가 먼저 물어보고 재호출할 수 있다. 빈 조각을 세는지가 중요한데, `strtok` 은 연속 구분자를 하나로 취급해 CSV 에서는 쓸 수 없다."}],
      code:{ c:"int *nd = realloc(v->data, ncap * sizeof(int));\nif (!nd) return;      /* 실패해도 원본 보존 */\nv->data = nd;", cap:"반환값을 바로 대입하면 실패 시 데이터를 잃는다" },
      key:["증가는 2배 — 평균 O(1)","realloc 은 임시 변수로 받는다","해제 후 NULL 대입","포인터와 길이는 한 쌍"] } },
  { t:"비트·링 버퍼·정렬", n:3,
    th:{ sum:"고정 자원으로 버티는 세 기법 — **비트로 압축하고, 공간을 돌려 쓰고, 범용 비교로 정렬한다**.",
      body:[
        {h:"비트와 감기", t:"플래그 32개를 4바이트에 담고, 여러 조건을 **한 번의 AND 로** 검사한다. `1 << 31` 은 부호 있는 int 에서 UB 라 반드시 `1u` 를 쓴다. 링 버퍼는 나머지 연산으로 끝에서 처음으로 감기며, `head == tail` 의 모호함은 size 를 따로 두어 푼다."},
        {h:"범용 비교의 규약", t:"`qsort` 의 비교 함수는 `const void *` 를 받는다 — C 에서 제네릭을 흉내 내는 표준 방식이다. 뺄셈 비교는 **오버플로 위험**이 있고, qsort 는 **안정 정렬이 아니라서** 2차 기준을 명시해야 결과가 결정적이다."}],
      code:{ c:"while (f) { f &= f - 1; n++; }\n/* 가장 낮은 켜진 비트를 지운다 */", cap:"켜진 비트 수만큼만 돈다 (Kernighan)" },
      key:["시프트에는 1u 를 쓴다","링 버퍼는 size 로 모호함을 푼다","qsort 는 안정 정렬이 아니다","뺄셈 비교는 오버플로를 주의"] } },
]},
cpp:{ unit:"실행형 실전 — 자원과 제네릭", lessons:[
  { t:"RAII 와 이동", n:2,
    th:{ sum:"C++ 의 자원 관리는 **수명을 객체에 묶는 것**이고, 이동은 그 자원을 **훔쳐 오는** 최적화다.",
      body:[
        {h:"수명을 블록으로", t:"RAII 는 예외가 나든 일찍 return 하든 소멸자가 **반드시** 불린다는 성질을 이용한다 — '해제를 잊는' 버그가 구조적으로 사라진다. 복사를 `= delete` 로 막는 것이 얕은 복사로 인한 이중 해제를 컴파일 오류로 바꾼다."},
        {h:"훔치되 비워 둔다", t:"이동 생성자는 **원본을 유효하지만 빈 상태**로 만들어야 한다 — 원본의 소멸자도 여전히 불리기 때문이다. `noexcept` 를 붙여야 `std::vector` 재할당에서 실제로 이동이 쓰인다(아니면 안전을 위해 복사한다)."}],
      code:{ c:"Buf(Buf &&o) noexcept : data(o.data), n(o.n) {\n    o.data = nullptr;   // 원본을 비운다\n}", cap:"안 비우면 같은 메모리를 두 번 delete 한다" },
      key:["소멸자는 반드시 불린다","복사 금지는 컴파일 오류로","이동 후 원본은 비워 둔다","noexcept 가 성능을 가른다"] } },
  { t:"템플릿과 컨테이너", n:3,
    th:{ sum:"제네릭은 **타입마다 코드를 생성**하고, 표준 컨테이너는 **순서의 정의**를 요구한다.",
      body:[
        {h:"필요한 만큼만", t:"키 함수는 **매 비교마다 다시 부르지 않는다** — 최고 키를 들고 있으면 호출이 n 번, 아니면 2n 번이다. '상위 k개' 에 전체 정렬은 과하다 — `partial_sort` 는 O(n log k), 순서가 필요 없으면 `nth_element` 가 평균 O(n) 이다."},
        {h:"순서를 정의한다", t:"`std::set`·`map` 은 원소에 '작다' 의 정의를 요구하고, 그 비교가 **중복 제거의 기준**이기도 하다(`operator==` 는 쓰이지 않는다). 잘못된 비교자는 컴파일은 되지만 런타임에 트리를 망가뜨려 추적이 어렵다."}],
      code:{ c:"std::partial_sort(v.begin(), v.begin() + k,\n                  v.end(), std::greater<int>());", cap:"k 를 먼저 클램프하지 않으면 UB" },
      key:["키 계산은 한 번만","partial_sort O(n log k)","경계 클램프가 알고리즘보다 먼저","set 의 비교가 곧 동등성"] } },
]},
go:{ unit:"실행형 실전 — Go 다운 코드", lessons:[
  { t:"인터페이스와 에러", n:3,
    th:{ sum:"Go 의 두 기둥 — **암묵적 인터페이스**와 **값으로서의 에러** — 에 defer/recover 의 경계 규칙이 더해진다.",
      body:[
        {h:"작은 인터페이스", t:"메서드 집합이 맞으면 그 인터페이스다(`implements` 선언이 없다) — 그래서 **쓰는 쪽에서 정의**할 수 있고 인터페이스가 작아진다. 값 수신자와 포인터 수신자의 차이가 '왜 만족하지 않지' 의 단골 원인이다."},
        {h:"에러에 구조를, 패닉은 경계에서", t:"에러를 타입으로 만들면 `errors.As` 로 필드를 꺼내 UI 가 반응할 수 있고, `%w` 로 감싸도 원래 타입을 잃지 않는다. `recover` 는 **defer 안에서만** 동작하고 **이름 있는 반환값**이 있어야 에러를 돌려줄 수 있다 — 다만 모든 함수를 감싸는 것은 Go 스타일이 아니다."}],
      code:{ c:"var ve *ValidationError\nif errors.As(err, &ve) { return ve.Field }", cap:"감싼 에러에서도 타입을 꺼낸다" },
      key:["인터페이스는 암묵적이고 작다","포인터 수신자면 값은 만족하지 않는다","errors.Is 는 값, errors.As 는 타입","recover 는 경계에서 한 번"] } },
  { t:"집계와 제네릭", n:2,
    th:{ sum:"Go 는 **결정적 출력**을 사람에게 맡긴다 — 맵 순회는 무작위고, nil 과 빈 슬라이스는 다르다.",
      body:[
        {h:"무작위 순회는 의도된 것", t:"맵 순회 순서를 일부러 무작위화해, 순서에 의존하는 코드가 **테스트에서 바로 깨지게** 만든다. 정렬이 필요하면 키를 꺼내 명시적으로 정렬하고, `sort.Slice` 는 안정 정렬이 아니므로 **동점 기준까지** 정해야 결과가 결정적이다."},
        {h:"nil 과 빈 것", t:"제네릭은 입력과 출력 타입이 다를 수 있어야 쓸모가 있다(`Map[T, U]`). `make([]U, 0, len(xs))` 로 용량을 미리 잡고, **nil 이 아닌 빈 슬라이스**를 돌려줘야 JSON 이 `null` 대신 `[]` 가 된다 — 클라이언트가 깨지는 흔한 원인이다."}],
      code:{ c:"out := make([]U, 0, len(xs))   // nil 이 아니다\nfor _, x := range xs { out = append(out, f(x)) }", cap:"len 0 이어도 null 로 직렬화되지 않는다" },
      key:["맵 순회는 무작위 — 명시적 정렬","동점 기준까지 정해야 결정적","nil 슬라이스와 빈 슬라이스는 다르다","용량을 미리 잡는다"] } },
]},
rust:{ unit:"실행형 실전 — 타입으로 표현한다", lessons:[
  { t:"Result·이터레이터·빌림", n:3,
    th:{ sum:"러스트는 **실패도, 없음도, 수명도 타입으로** 표현한다 — 컴파일러가 그 약속을 강제한다.",
      body:[
        {h:"실패를 조립한다", t:"`?` 는 '실패면 즉시 반환', `ok_or` 는 Option→Result, `map_err` 는 에러 타입 변환 — 이 셋으로 대부분의 파싱 파이프라인이 조립된다. 타입을 좁게 고르는 것 자체가 검증이다(`u16` 이면 범위 초과가 자동으로 실패)."},
        {h:"지연 평가와 참조", t:"이터레이터 체인은 소비자를 만나기 전까지 아무 일도 하지 않아 중간 벡터가 생기지 않는다. 그리고 참조를 돌려주면 **복제 비용이 0** 이며, 수명 표기가 '입력이 살아 있는 동안 유효' 를 컴파일 시점에 보장한다 — `clone()` 우회는 통과하지만 할당이 늘어난다."}],
      code:{ c:"cfg.get(\"port\")?          // 없으면 None\n   .parse::<u16>()\n   .ok()                  // Result → Option", cap:"실패 경로가 타입에 드러난다" },
      key:["? · ok_or · map_err 조합","좁은 타입이 곧 검증","이터레이터는 지연 평가","참조 반환은 복제 비용 0"] } },
]},
};

const norm=s=>String(s).replace(/\s+/g," ").trim();
const writes=[];
Object.keys(EXPECT).forEach(lang=>{
  const path=ROOT+"/data/t-"+lang+".js";
  const raw=fs.readFileSync(path,"utf8");
  const a=raw.indexOf("["), z=raw.lastIndexOf("]");
  const arr=JSON.parse(raw.slice(a,z+1));
  const existing=new Set();
  arr.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>existing.add(norm(q.q)))));
  const items=byLang[lang];
  items.forEach(q=>{ if(existing.has(norm(q.q))) throw new Error(lang+": 중복 문항 — "+q.k); });

  const pl=PLAN[lang];
  if(!pl) throw new Error(lang+": PLAN 없음");
  if(pl.lessons.reduce((s,L)=>s+L.n,0)!==EXPECT[lang]) throw new Error(lang+": 레슨 문항 수 합 불일치");
  if(arr.some(u=>u.t===pl.unit)) throw new Error(lang+": 유닛 제목 중복");
  let cursor=0;
  const lessons=pl.lessons.map(L=>{
    if(!L.th||!L.th.sum||L.th.body.length!==2||!L.th.code||!L.th.key) throw new Error(lang+"/"+L.t+": 이론 형식");
    const qs=items.slice(cursor, cursor+L.n).map(x=>{
      const rtSpec={ lang:x.lang, test:x.test };
      const sn=x.srcName||SRCNAME[x.lang];
      if(sn) rtSpec.srcName=sn;   /* rust 는 srcName 없이 기본값(src/lib.rs)을 쓴다 */
      return { t:"code", run:x.lang, k:x.k, cat:x.cat, q:x.q, src:x.src, sol:x.sol, rt:rtSpec, ex:x.ex };
    });
    cursor+=L.n;
    return { t:L.t, xp:80, th:L.th, q:qs };
  });
  if(cursor!==items.length) throw new Error(lang+": 배정 누락");
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
Object.keys(EXPECT).forEach(lang=>{
  if(!C[lang]) throw new Error(lang+": COURSES 에 없음");
  const pl=PLAN[lang];
  if(C[lang].units.some(u=>u.title===pl.unit)) throw new Error(lang+": 목차 유닛 중복");
  C[lang].units.push({ title:pl.unit, lessons:pl.lessons.map(L=>({ title:L.t, xp:80, n:L.n })) });
});
writes.push({ path:ih, content: html.slice(0,start)+JSON.stringify(C)+html.slice(end+1) });

writes.forEach(w=>fs.writeFileSync(w.path,w.content));
console.log("주입 완료: "+Object.keys(EXPECT).map(k=>k+" +"+EXPECT[k]).join(" · ")+" (파일 "+writes.length+"개)");
