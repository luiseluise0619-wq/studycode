/* exec_php.cjs 12문항을 php 트랙의 실행형 유닛으로 주입한다.
   채점은 로컬 러너의 실제 php 가 한다(rt) — 테스트를 다른 형식으로 번역하지 않는다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const Q=require("./exec_php.cjs");
const ROOT=require("path").resolve(__dirname, "..", "..");
const EXPECT=12;
if(Q.length!==EXPECT) throw new Error(EXPECT+"문항 기대, 실제 "+Q.length);

const UNIT="실행형 실전 — 직접 만들고 php 가 채점한다";
const LESSONS=[
  { t:"값을 다듬는 세 가지", n:3,
    th:{ sum:"바깥에서 들어온 값을 안쪽에서 쓸 수 있는 형태로 바꾸는 세 가지 — **검증하고, 묶고, 병합한다**.",
      body:[
        {h:"캐스팅과 검증은 다르다", t:"`(int)$v` 는 **무엇이든 숫자로 만들어 버린다** — `\"x\"`·`null`·`\"\"` 가 모두 0 이 되어 잘못된 입력이 유효한 값 0 으로 위장한다. `filter_var(..., FILTER_VALIDATE_INT)` 는 '해석 가능한가' 를 먼저 묻고 실패를 `false` 로 알리므로 **`=== false` 로 검사**해야 한다 — `if (!$n)` 이라고 쓰면 정상적인 0 까지 버린다."},
        {h:"묶기와 병합", t:"`$out[$key][] = $v;` 한 줄이 '없으면 만들고 있으면 덧붙이는' 그룹화를 끝낸다. 다만 키는 **먼저 정규화**해야 한다 — 도메인처럼 대소문자를 구분하지 않는 값을 그대로 키로 쓰면 같은 것이 두 버킷으로 갈라진다. 설정 병합에서는 '`null` 은 값인가 부재인가' 를 **명시적으로 정하고**, `if ($v)` 대신 `=== null` 로 검사해야 0 과 빈 문자열을 지우지 않는다."}],
      code:{ c:"$n = filter_var($v, FILTER_VALIDATE_INT);\nif ($n === false) continue;   // !$n 이라고 쓰면 0 을 버린다", cap:"실패와 0 을 구분하는 것이 핵심" },
      key:["캐스팅은 검증이 아니다","filter_var 실패는 === false 로","그룹화는 $out[$k][] = $v","null 을 값으로 볼지 먼저 정한다"] } },
  { t:"문자열·정렬·복사", n:3,
    th:{ sum:"PHP 의 세 가지 성질을 모르면 조용히 틀리는 셋 — **문자열은 바이트고, 정렬은 동점을 남기며, 객체는 핸들이다**.",
      body:[
        {h:"바이트와 글자", t:"`strlen(\"한\")` 은 3 이고, `substr` 로 어중간한 위치를 자르면 **깨진 바이트**가 남는다. 글자 단위 작업은 전부 `mb_*` 다. 그리고 자른 뒤 말줄임표를 붙이면 상한을 넘으므로, `$max` 에서 **말줄임표 길이를 먼저 빼야** 한다 — UI 상한을 넘기는 문자열은 레이아웃을 깨뜨린다."},
        {h:"동점과 사본", t:"배열끼리의 `<=>` 는 원소별로 비교하므로 다중 키 정렬이 한 줄이 된다(내림차순 항목만 좌우를 뒤집는다). 정렬 키의 마지막에는 **유일한 tie-break** 를 둬야 페이지 사이에서 행이 중복되거나 사라지지 않는다. 배열은 값, **객체는 핸들**이라 함수 안에서 프로퍼티를 바꾸면 바깥에도 반영된다 — `clone` 이 필요하고, 그마저 **얕은 복사**다."}],
      code:{ c:"return [$b['prio'], $a['due'], $a['name']]\n   <=> [$a['prio'], $b['due'], $b['name']];", cap:"내림차순 항목만 좌우를 뒤집는다" },
      key:["글자 단위는 mb_*","말줄임표 길이를 상한에서 뺀다","정렬 키 마지막에 유일한 tie-break","객체는 핸들 — clone 은 얕은 복사"] } },
  { t:"실패와 구조", n:3,
    th:{ sum:"규모가 커질 때 필요한 셋 — **실패를 두 종류로 나누고, 계약을 인터페이스로 세우고, 메모리를 입력 크기와 분리한다**.",
      body:[
        {h:"값으로 돌릴 것과 던질 것", t:"입력에 따라 정상적으로 일어나는 실패(0 으로 나누기)는 **값**으로 돌려주고, 호출자가 계약을 어긴 것(문자열을 넘김)은 **예외**로 알린다. 섞으면 호출자가 무엇을 대비해야 할지 알 수 없다. 그리고 `Error` 는 `Exception` 을 **상속하지 않으므로** `catch (Exception)` 으로는 `TypeError`·`DivisionByZeroError` 가 잡히지 않는다."},
        {h:"교체 가능성과 게으름", t:"인터페이스를 먼저 정의하면 테스트에서는 메모리 구현을, 운영에서는 Redis 구현을 쓸 수 있다. LRU 는 '**조회도 사용**' 이라 `get` 이 순서를 갱신하지 않으면 FIFO 가 되고, PHP 배열이 삽입 순서를 기억하므로 `unset` 후 재삽입만으로 순서를 옮길 수 있다. 제너레이터는 메모리를 입력 크기와 무관하게 만드는데, 중간에 `iterator_to_array` 를 부르면 **그 자리에서 게으름이 사라진다**."}],
      code:{ c:"foreach ($rows as $r) {\n    $buf[] = $r;\n    if (count($buf) === $size) { yield $buf; $buf = []; }\n}", cap:"전체를 올리지 않고 한 덩어리씩" },
      key:["예상 가능한 실패는 값, 계약 위반은 예외","Error 와 Exception 은 형제","LRU 는 get 도 최근 사용으로","제너레이터는 중간에 배열로 만들면 끝난다"] } },
  { t:"경계에서 막는다", n:3,
    th:{ sum:"보안은 기능이 아니라 **경계의 성질**이다 — 무엇을 허용할지 정하고, 맥락에 맞게 내보내고, 비밀은 상수 시간으로 비교한다.",
      body:[
        {h:"허용 목록과 출력 맥락", t:"위험한 것을 지우는 블랙리스트는 우회가 끝없이 나온다 — **허용 목록**은 목록에 없으면 기본값으로 떨어지므로 우회할 표면이 없다. `href` 는 이스케이프만으로 부족하다: `javascript:` 에는 이스케이프할 문자가 없다. 이스케이프 함수는 **출력 맥락마다 다르다** — HTML 은 `htmlspecialchars`, URL 쿼리는 `urlencode`, `<script>` 안은 `json_encode` 다."},
        {h:"바인딩과 비교", t:"준비된 구문의 플레이스홀더는 **값 자리 전용**이라 `ORDER BY ?` 는 정렬을 하지 않는다 — 식별자는 화이트리스트에서 고른다. 페이지 크기 같은 값은 바인딩할 수 있지만 **범위 검증**이 함께 필요하다(`limit=1000000` 은 인젝션이 아니어도 서비스를 멈춘다). 토큰 비교는 `hash_equals` 여야 한다 — `===` 조차 첫 다른 바이트에서 멈춰 시간 차이를 흘린다."}],
      code:{ c:"$sort = in_array($req['sort'] ?? '', ['name','created_at'], true)\n      ? $req['sort'] : 'name';", cap:"목록에 없으면 조용히 기본값" },
      key:["블랙리스트가 아니라 허용 목록","이스케이프는 출력 맥락마다 다르다","값은 바인딩, 식별자는 화이트리스트","비밀 비교는 hash_equals"] } },
];
if(LESSONS.reduce((s,L)=>s+L.n,0)!==EXPECT) throw new Error("레슨 합 불일치");

const norm=s=>String(s).replace(/\s+/g," ").trim();
const path=ROOT+"/data/t-php.js";
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
  const qs=Q.slice(cur,cur+L.n).map(x=>{
    if(!x.test||!x.test["test.php"]) throw new Error(x.k+": test.php 가 없다");
    return { t:"code", run:"php", rt:{lang:"php", test:x.test},
             k:x.k, cat:x.cat, q:x.q, src:x.src, ex:x.ex };
  });
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
if(!C.php) throw new Error("COURSES 에 php 가 없다 — inj_php.cjs 를 먼저 돌려야 한다");
if(C.php.units.some(u=>u.title===UNIT)) throw new Error("목차 유닛 중복");
C.php.units.push({ title:UNIT, guide:"🐘", lessons:LESSONS.map(L=>({ title:L.t, xp:80, n:L.n })) });
fs.writeFileSync(ih, html.slice(0,start)+JSON.stringify(C)+html.slice(end+1));

console.log("주입 완료: php 실행형 +"+Q.length);
