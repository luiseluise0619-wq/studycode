/* rev_sql2.cjs 를 sql 트랙에 주입한다.
   검증 전용 필드(schema·bad·fix·proof)는 주입하지 않는다 — 정답을 데이터에 심으면 안 된다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const Q=require("./rev_sql2.cjs");
const ROOT=require("path").resolve(__dirname, "..", "..");
const EXPECT=15;
if(Q.length!==EXPECT) throw new Error(EXPECT+"문항 기대, 실제 "+Q.length);

const UNIT="코드 리뷰 2 — 쿼리·스키마 결함 찾기";
const LESSONS=[
  { t:"쿼리 결함 I — 페이지네이션·NULL·조인", n:3,
    th:{ sum:"결과가 조용히 틀리는 쿼리를 읽어 낸다 — **깊은 OFFSET·NOT IN 의 NULL·조인 팬아웃**.",
      body:[
        {h:"읽고 버리는 비용", t:"`OFFSET` 은 건너뛰는 것이 아니라 **읽고 버리는** 것이라 페이지가 깊어질수록 선형으로 느려진다. 커서(키셋) 방식으로 바꾸고, 정렬 키에 동점이 있으면 **유일한 tie-break** 를 넣어야 페이지 사이에서 행이 중복되거나 빠지지 않는다."},
        {h:"NULL 과 복제", t:"`NOT IN` 목록에 NULL 이 하나라도 있으면 결과가 통째로 빈다 — `<> NULL` 이 UNKNOWN 이기 때문이다. `NOT EXISTS` 가 안전한 기본값이다. 1:N 조인은 왼쪽 행을 짝의 수만큼 **복제**하므로 'JOIN 뒤에 SUM' 은 항상 의심할 신호다."}],
      code:{ c:"-- 커서 방식: 페이지 깊이와 무관하게 일정\nWHERE (created_at, id) < (?, ?)\nORDER BY created_at DESC, id DESC LIMIT 20", cap:"OFFSET 100000 은 10만 행을 읽는다" },
      key:["OFFSET 은 읽고 버린다","정렬 키에 유일한 tie-break","NOT IN + NULL = 빈 결과","JOIN 뒤 SUM 은 팬아웃 의심"] } },
  { t:"인덱스를 못 쓰게 만드는 것들", n:2,
    th:{ sum:"인덱스는 **컬럼의 원래 값** 순으로 정렬돼 있다 — 그 전제를 깨는 순간 쓸 수 없게 된다.",
      body:[
        {h:"좌측 접두사", t:"복합 인덱스는 왼쪽부터 **연속으로** 쓰일 때만 범위를 좁힌다. 첫 컬럼이 조건에 없으면 인덱스가 있어도 못 쓴다. 배치 규칙은 '**등치 조건 → 정렬 → 범위**' 순이며, 이렇게 두면 정렬 작업 자체가 사라지기도 한다."},
        {h:"컬럼을 감싸면 끝난다", t:"`LOWER(col)`·`DATE(col)` 처럼 컬럼에 함수를 씌우면 정렬된 순서를 쓸 수 없어 전 행을 계산하며 훑는다(sargable 하지 않음). 우변의 함수는 상수라 무해하다 — **어느 쪽을 감쌌는가**가 갈림길이다. 날짜는 반열린 범위가 표준 해법이다."}],
      code:{ c:"-- 인덱스를 쓰는 형태\nWHERE created_at >= '2024-01-01'\n  AND created_at <  '2025-01-01'", cap:"strftime('%Y', created_at)='2024' 는 전체 스캔" },
      key:["복합 인덱스는 좌측 접두사","등치 → 정렬 → 범위 순으로 배치","컬럼을 함수로 감싸지 않는다","SELECT * 는 테이블 재방문을 부른다"] } },
  { t:"쓰기·동시성·보안", n:3,
    th:{ sum:"읽기보다 위험한 쪽 — **경쟁 조건, 문자열 조립, 한 방에 지우기**.",
      body:[
        {h:"틈을 없앤다", t:"읽고 계산해서 쓰는 사이의 틈이 갱신 손실을 만든다 — 값을 애플리케이션이 계산하지 말고 `SET stock = stock - 1 WHERE stock > 0` 처럼 **DB 가 한 문장에서** 처리하게 하면 틈이 사라지고 하한 검사도 함께 걸린다."},
        {h:"경계와 규모", t:"사용자 입력을 이어 붙인 SQL 은 데이터와 코드의 경계를 지운다 — 이스케이프는 컨텍스트마다 규칙이 달라 빠짐없이 적용하기 어렵고, **바인드 파라미터**가 구조적 해법이다. 대량 삭제는 한 트랜잭션에 몰면 언두·WAL 이 폭증하고 락이 오래 걸린다 — 배치로 끊거나 파티션을 떼어낸다."}],
      code:{ c:"UPDATE items SET stock = stock - 1\nWHERE id = ? AND stock > 0;\n-- 영향 행 수 0 이면 재고 부족", cap:"읽기와 쓰기 사이의 틈을 없앤다" },
      key:["read-modify-write 를 한 문장으로","바인드 파라미터가 구조적 해법","대량 DML 은 배치로 끊는다","TRUNCATE 는 조건을 받지 못한다"] } },
  { t:"집합·스키마·구조", n:4,
    th:{ sum:"결과의 **모양**을 정하는 것들 — 집합 연산, 스키마 타입, 반복 평가, 격리 수준.",
      body:[
        {h:"합치기와 담기", t:"`UNION` 은 중복을 지우므로 건수가 의미인 로그 합치기에서는 `UNION ALL` 이 기본이고, 갈래별 `ORDER BY` 는 허용되지 않는다(합집합에는 순서가 없다). 스키마에서는 **기본 키·외래 키 부재**와 **돈을 부동소수점으로** 담는 것이 3대 결함이다."},
        {h:"몇 번 읽는가, 무엇을 보는가", t:"같은 조건의 상관 서브쿼리를 여러 번 두면 그만큼 반복 스캔한다 — 한 번의 조인·집계로 합친다. 그리고 한 트랜잭션 안에서 같은 집계를 두 번 하면 격리 수준에 따라 **다른 값**이 나온다(반복 불가능한 읽기·팬텀)."}],
      code:{ c:"-- 돈은 정수 최소 단위나 DECIMAL 로\namount_cents INTEGER NOT NULL", cap:"REAL 은 0.1+0.2 를 정확히 담지 못한다" },
      key:["UNION ALL 이 기본","갈래별 ORDER BY 는 불가","돈을 REAL 로 담지 않는다","반복 읽기는 격리 수준이 정한다"] } },
  { t:"인덱스 운영과 뷰", n:3,
    th:{ sum:"만들고 끝이 아니다 — **인덱스는 쓰기 비용**이고, **뷰는 인터페이스**다.",
      body:[
        {h:"접두사 중복과 쓰기 비용", t:"`(a)`·`(a,b)`·`(a,b,c)` 를 모두 만들면 앞의 둘은 대개 낭비다 — 긴 인덱스가 접두사 조회를 흡수한다. 다만 **첫 컬럼이 다른** 인덱스는 대체 불가다. 인덱스마다 INSERT 시 갱신이 붙으므로 쓰기가 많은 테이블에서는 개수 자체가 비용이다."},
        {h:"뷰는 계약이다", t:"뷰 안의 `ORDER BY` 는 의미가 없거나 불필요한 정렬을 강제한다 — 순서는 쓰는 쪽에서 정한다. `SELECT o.*` 로 열어 두면 원본에 컬럼이 추가될 때 뷰의 출력이 **조용히 바뀌어** 사용하는 코드가 깨진다."}],
      code:{ c:"-- (a) 는 (a,b) 에 흡수되지만\n-- (b) 는 첫 컬럼이 달라 대체 불가", cap:"인덱스 정리의 기준은 접두사 관계" },
      key:["접두사 인덱스는 흡수된다","첫 컬럼이 다르면 대체 불가","인덱스는 쓰기 비용","뷰에서는 컬럼을 명시한다"] } },
];
if(LESSONS.reduce((s,L)=>s+L.n,0)!==EXPECT) throw new Error("레슨 합 불일치");

const norm=s=>String(s).replace(/\s+/g," ").trim();
const path=ROOT+"/data/t-sql.js";
const raw=fs.readFileSync(path,"utf8");
const a=raw.indexOf("["), z=raw.lastIndexOf("]");
const arr=JSON.parse(raw.slice(a,z+1));
const existing=new Set();
arr.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>existing.add(norm(q.code||q.q)))));
Q.forEach(q=>{ if(existing.has(norm(q.code))) throw new Error("중복 코드 — "+q.k); });
if(arr.some(u=>u.t===UNIT)) throw new Error("유닛 제목 중복");

let cur=0;
const lessons=LESSONS.map(L=>{
  if(!L.th||!L.th.sum||L.th.body.length!==2||!L.th.code||!L.th.key) throw new Error(L.t+": 이론 형식");
  const qs=Q.slice(cur,cur+L.n).map(x=>{
    const nb=x.items.filter(i=>i.bad).length;
    if(x.items.length<5||nb<2||nb>=x.items.length) throw new Error(x.k+": 보기 구성");
    return { t:"review", k:x.k, cat:"review", q:x.q, code:x.code,
             items:x.items.map(i=>({txt:i.txt, bad:!!i.bad})), ex:x.ex };
  });
  cur+=L.n;
  return { t:L.t, xp:70, th:L.th, q:qs };
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
if(C.sql.units.some(u=>u.title===UNIT)) throw new Error("목차 유닛 중복");
C.sql.units.push({ title:UNIT, lessons:LESSONS.map(L=>({ title:L.t, xp:70, n:L.n })) });
fs.writeFileSync(ih, html.slice(0,start)+JSON.stringify(C)+html.slice(end+1));

console.log("주입 완료: sql 리뷰 +"+Q.length);
