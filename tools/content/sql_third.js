/* SQL 실습 3차 — 실습이 하나도 없던 6개 유닛을 연다.
   집합 연산자 · EXISTS 와 정량 비교 · 그룹별 상위 N · 고급 그룹화 ·
   피벗과 조건부 집계 · 고급 윈도우 함수.

   채점은 브라우저 안의 sql.js(진짜 SQLite)가 한다. 실행 서버가 필요 없다.
   시작 쿼리(src)는 반드시 정답과 다른 결과를 내야 한다 — 검증기가 확인한다.
   그래서 자료도 그 차이가 드러나도록 만들었다. 급여가 같은 두 사람(공동 순위),
   실적이 없는 직원, 월이 빠진 달, NULL 금액이 일부러 들어 있다. */

const 판매 = `CREATE TABLE 직원 (
  id INTEGER PRIMARY KEY, 이름 TEXT, 부서 TEXT, 급여 INTEGER, 입사 TEXT
);
INSERT INTO 직원 VALUES
  (1,'가영','영업',5200000,'2021-03-15'),
  (2,'나연','영업',4800000,'2022-07-01'),
  (3,'다솜','개발',6100000,'2020-01-20'),
  -- 급여가 같은 두 사람. 공동 순위와 '몇 명만 자르기' 가 갈리는 자리다.
  (4,'라온','개발',5500000,'2023-02-28'),
  (5,'마루','개발',5500000,'2023-11-05'),
  (6,'바다','지원',3900000,'2024-06-10'),
  (7,'사랑','지원',4100000,'2023-12-31');
CREATE TABLE 실적 (
  id INTEGER PRIMARY KEY, 직원 INTEGER, 월 TEXT, 금액 INTEGER
);
INSERT INTO 실적 VALUES
  (1,1,'2026-01',1200000),(2,1,'2026-02',900000),(3,1,'2026-03',1500000),
  (4,2,'2026-01',700000),(5,2,'2026-03',300000),
  (6,3,'2026-02',800000),
  -- 금액이 비어 있는 행. 합계와 개수가 갈리는 자리다.
  (7,6,'2026-01',NULL);`;

/* 실적.직원 에 NULL 이 하나 들어 있는 판. NOT IN 이 조용히 아무것도 못 찾는 것을
   보여 주려면 이 NULL 이 반드시 있어야 한다 — 없으면 NOT IN 과 NOT EXISTS 가 같다. */
const 판매NULL = 판매 + `
INSERT INTO 실적 VALUES (8,NULL,'2026-04',500000);`;

module.exports = [
/* ── 집합 연산자 ──────────────────────────────────────────── */
{
  unit: "집합 연산자",
  lesson: "직접 써 보기 — 결과를 합치고 빼고 겹치기",
  th: {
    sum: "두 조회 결과를 **행 단위로** 합치거나(UNION) 빼거나(EXCEPT) 겹치는(INTERSECT) 것이 집합 연산자다.",
    body: [
      { h: "UNION 은 중복을 없앤다", t: "`UNION` 은 두 결과를 합치면서 **똑같은 행을 하나로 줄인다.** 그래서 원래 개수를 세는 일에 쓰면 답이 작아진다. 중복까지 그대로 두려면 `UNION ALL` 이다. 중복을 없애는 일은 정렬을 동반하므로 `UNION ALL` 이 더 빠르기도 하다." },
      { h: "EXCEPT 는 '왼쪽에만 있는 것'", t: "`A EXCEPT B` 는 A 에는 있고 B 에는 없는 행이다. '실적이 없는 직원' 처럼 **빼기**로 읽히는 질문에 그대로 들어맞는다. 순서를 바꾸면 뜻이 완전히 달라진다 — 뺄셈과 같다." },
      { h: "INTERSECT 는 '양쪽 다'", t: "`A INTERSECT B` 는 두 쪽에 모두 있는 행이다. '1월에도 있고 3월에도 있는 직원' 처럼 **둘 다** 를 물을 때 쓴다. 여기서 `UNION` 을 쓰면 '둘 중 하나' 가 되어 훨씬 많이 나온다." },
    ],
    code: { c: "SELECT 부서 FROM 직원\nUNION ALL          -- 중복도 그대로\nSELECT 부서 FROM 직원;\n\nSELECT id FROM 직원\nEXCEPT             -- 왼쪽에만 있는 것\nSELECT 직원 FROM 실적;", cap: "합치기·빼기·겹치기" },
    key: ["`UNION` 은 중복을 없앤다", "`EXCEPT` 는 왼쪽에만", "`INTERSECT` 는 양쪽 다"],
  },
  q: [
    {
      k: "부서 목록 두 번 이어 붙이기", schema: 판매, ordered: true,
      qq: "영업 부서 직원의 <code>이름</code>과 지원 부서 직원의 <code>이름</code>을 <b>이어서</b> 보여 주세요. 열 이름은 <code>이름</code>, 이름 오름차순입니다. <b>중복이 있어도 지우지 마세요.</b>",
      src: "SELECT 이름 FROM 직원 WHERE 부서 = '영업'\nUNION\nSELECT 이름 FROM 직원 WHERE 급여 >= 4000000\nORDER BY 이름;",
      sol: "SELECT 이름 FROM 직원 WHERE 부서 = '영업'\nUNION ALL\nSELECT 이름 FROM 직원 WHERE 급여 >= 4000000\nORDER BY 이름;",
      ex: "UNION 은 두 결과를 합치면서 똑같은 행을 하나로 줄입니다. 영업 직원은 양쪽 조건에 다 걸리니 한 번씩만 남아요. 중복까지 그대로 두려면 UNION ALL 입니다.",
    },
    {
      k: "실적이 없는 직원", schema: 판매, ordered: true,
      qq: "실적이 <b>한 건도 없는</b> 직원의 <code>id</code>를 보여 주세요. 열 이름은 <code>id</code>, 오름차순입니다.",
      src: "SELECT id FROM 직원\nINTERSECT\nSELECT 직원 FROM 실적\nORDER BY id;",
      sol: "SELECT id FROM 직원\nEXCEPT\nSELECT 직원 FROM 실적\nORDER BY id;",
      ex: "INTERSECT 는 '양쪽 다 있는 것' 이라 실적이 있는 직원이 나옵니다. 물은 것과 정반대예요. '있고 없고' 를 물었으면 빼기(EXCEPT) 입니다.",
    },
    {
      k: "1월에도 3월에도 실적이 있는 직원", schema: 판매, ordered: true,
      qq: "<b>2026-01 과 2026-03 두 달 모두</b> 실적이 있는 직원의 <code>직원</code> 번호를 보여 주세요. 열 이름은 <code>직원</code>, 오름차순입니다.",
      src: "SELECT 직원 FROM 실적 WHERE 월 = '2026-01'\nUNION\nSELECT 직원 FROM 실적 WHERE 월 = '2026-03'\nORDER BY 직원;",
      sol: "SELECT 직원 FROM 실적 WHERE 월 = '2026-01'\nINTERSECT\nSELECT 직원 FROM 실적 WHERE 월 = '2026-03'\nORDER BY 직원;",
      ex: "UNION 은 '둘 중 하나라도' 입니다. 한 달만 있는 직원까지 다 나와요. '둘 다' 를 물었으면 겹치는 것(INTERSECT)을 찾아야 합니다.",
    },
  ],
},
/* ── EXISTS와 정량 비교 ───────────────────────────────────── */
{
  unit: "EXISTS와 정량 비교",
  lesson: "직접 써 보기 — 있는지 묻기와 전부와 견주기",
  th: {
    sum: "`EXISTS` 는 '한 건이라도 있나' 를 묻고, `MAX`·`MIN` 을 낀 비교는 '무리 전체와 견주면' 을 묻는다.",
    body: [
      { h: "NOT IN 은 NULL 하나에 무너진다", t: "안쪽 결과에 `NULL` 이 하나라도 있으면 `NOT IN` 은 **아무 행도 돌려주지 않는다.** '이 값이 NULL 과 다른가' 를 알 수 없으니 참이라고 말할 수 없기 때문이다. 오류가 아니라 빈 결과라 알아채기도 어렵다. `NOT EXISTS` 는 이 함정이 없다." },
      { h: "EXISTS 는 있는지만 본다", t: "`EXISTS (SELECT 1 FROM ...)` 는 첫 행을 찾는 순간 참이 된다. 무엇을 고르는지는 상관없어서 `SELECT 1` 이라고 쓰는 관례가 있다. 개수를 세지 않으므로 대개 더 빠르다." },
      { h: "전부와 견주기는 MAX, 하나와는 MIN", t: "다른 데이터베이스에는 `> ALL (...)`·`> ANY (...)` 가 있지만 **SQLite 에는 없다.** 대신 `> (SELECT MAX(...))` 가 '전부보다 크다', `> (SELECT MIN(...))` 가 '하나보다만 크면 된다' 와 같은 뜻이다. MAX 와 MIN 한 글자 차이로 조건이 가장 센 것에서 가장 약한 것으로 바뀐다." },
    ],
    code: { c: "WHERE NOT EXISTS (\n  SELECT 1 FROM 실적 WHERE 실적.직원 = 직원.id\n)\n\nWHERE 급여 > (SELECT MAX(급여) FROM 직원 WHERE 부서 = '지원')", cap: "있는지 묻기 / 전부와 견주기" },
    key: ["`NOT IN` 은 NULL 에 무너진다", "`EXISTS` 는 있는지만 본다", "전부와 견주기는 `MAX`"],
  },
  q: [
    {
      k: "NULL 이 섞여도 찾아내기", schema: 판매NULL, ordered: true,
      qq: "실적이 <b>한 건도 없는</b> 직원의 <code>id</code>를 보여 주세요. 실적 표에는 <b>직원이 비어 있는 행</b>도 있습니다. 열 이름은 <code>id</code>, 오름차순입니다.",
      src: "SELECT id FROM 직원\nWHERE id NOT IN (SELECT 직원 FROM 실적)\nORDER BY id;",
      sol: "SELECT id FROM 직원\nWHERE NOT EXISTS (SELECT 1 FROM 실적 WHERE 실적.직원 = 직원.id)\nORDER BY id;",
      ex: "안쪽 결과에 NULL 이 하나만 있어도 NOT IN 은 아무 행도 못 돌려줍니다. 'NULL 과 다른가' 를 알 수 없으니 참이라 말할 수 없거든요. 오류도 안 나고 그냥 빈 결과라 더 위험합니다.",
    },
    {
      k: "지원팀 전원보다 많이 받는 사람", schema: 판매, ordered: true,
      qq: "급여가 <b>지원 부서의 모든 사람보다</b> 높은 직원의 <code>이름</code>을 보여 주세요. 열 이름은 <code>이름</code>, 이름 오름차순입니다.",
      src: "SELECT 이름 FROM 직원\nWHERE 급여 > (SELECT MIN(급여) FROM 직원 WHERE 부서 = '지원')\nORDER BY 이름;",
      sol: "SELECT 이름 FROM 직원\nWHERE 급여 > (SELECT MAX(급여) FROM 직원 WHERE 부서 = '지원')\nORDER BY 이름;",
      ex: "MIN 과 견주면 지원팀에서 제일 적게 받는 사람만 넘어도 걸립니다. '전부보다' 를 물었으면 MAX 예요 — 한 단어로 조건의 세기가 정반대가 됩니다. (SQLite 에는 ALL·ANY 가 없어서 MAX·MIN 으로 씁니다.)",
    },
    {
      k: "자기 부서 평균보다 많이 받는 사람", schema: 판매, ordered: true,
      qq: "<b>자기 부서의 평균</b>보다 급여가 높은 직원의 <code>이름</code>을 보여 주세요. 열 이름은 <code>이름</code>, id 순서입니다.",
      src: "SELECT 이름 FROM 직원 d\nWHERE 급여 > (SELECT AVG(급여) FROM 직원)\nORDER BY id;",
      sol: "SELECT 이름 FROM 직원 d\nWHERE 급여 > (SELECT AVG(급여) FROM 직원 WHERE 부서 = d.부서)\nORDER BY id;",
      ex: "안쪽 조회에 바깥 행의 부서를 연결하지 않으면 회사 전체 평균과 견주게 됩니다. 안쪽에서 d.부서 를 참조해야 행마다 자기 부서 평균이 다시 계산돼요.",
    },
  ],
},
/* ── 그룹별 상위 N ────────────────────────────────────────── */
{
  unit: "그룹별 상위 N",
  lesson: "직접 써 보기 — 그룹마다 1등 뽑기",
  th: {
    sum: "'그룹마다 상위 몇 개' 는 `LIMIT` 으로 안 된다. **그룹 안에서 번호를 매기고** 그 번호로 거른다.",
    body: [
      { h: "LIMIT 은 전체에서 자른다", t: "`ORDER BY 급여 DESC LIMIT 1` 은 회사 전체 1등 한 명이다. 부서마다 1등을 원했다면 완전히 다른 답이다. `LIMIT` 은 그룹을 모른다 — 마지막에 결과를 통째로 자를 뿐이다." },
      { h: "PARTITION BY 가 그룹을 나눈다", t: "`ROW_NUMBER() OVER (PARTITION BY 부서 ORDER BY 급여 DESC)` 는 **부서마다** 1부터 다시 번호를 매긴다. `PARTITION BY` 를 빼면 전체에 한 줄로 번호가 매겨져 1번이 딱 하나만 나온다." },
      { h: "동점을 어떻게 볼 것인가", t: "`ROW_NUMBER` 는 동점이어도 1, 2, 3 으로 서로 다른 번호를 준다. `RANK` 는 동점에 같은 번호를 주고 다음 번호를 건너뛴다. '공동 2위면 둘 다 보여 준다' 면 `RANK`, '무조건 두 명만' 이면 `ROW_NUMBER` 다 — 물어본 것에 맞춰 고른다." },
    ],
    code: { c: "SELECT 이름 FROM (\n  SELECT 이름,\n    ROW_NUMBER() OVER (PARTITION BY 부서 ORDER BY 급여 DESC) AS 순위\n  FROM 직원\n) WHERE 순위 = 1;", cap: "그룹 안에서 번호를 매긴다" },
    key: ["`LIMIT` 은 그룹을 모른다", "`PARTITION BY` 로 그룹을 나눈다", "동점은 `RANK` 로 함께 본다"],
  },
  q: [
    {
      k: "부서마다 급여 1등", schema: 판매, ordered: true,
      qq: "<b>부서마다</b> 급여가 가장 높은 직원의 <code>부서</code>와 <code>이름</code>을 보여 주세요. 열 이름은 <code>부서</code>, <code>이름</code> 이고 부서 오름차순입니다.",
      src: "SELECT 부서, 이름 FROM 직원\nORDER BY 급여 DESC\nLIMIT 1;",
      sol: "SELECT 부서, 이름 FROM (\n  SELECT 부서, 이름,\n    ROW_NUMBER() OVER (PARTITION BY 부서 ORDER BY 급여 DESC, id) AS 순위\n  FROM 직원\n)\nWHERE 순위 = 1\nORDER BY 부서;",
      ex: "LIMIT 1 은 회사 전체에서 한 명만 자릅니다. 부서를 모르거든요. 부서마다 번호를 다시 매기고 1번만 남겨야 부서 수만큼 나옵니다.",
    },
    {
      k: "부서마다 상위 2위 (공동 순위 포함)", schema: 판매, ordered: true,
      qq: "부서마다 급여 <b>2위까지</b> 보여 주세요. <b>공동 2위면 둘 다</b> 나와야 합니다. 열 이름은 <code>부서</code>, <code>이름</code>, <code>순위</code> 이고 부서·순위·이름 순입니다.",
      src: "SELECT 부서, 이름, 순위 FROM (\n  SELECT 부서, 이름,\n    ROW_NUMBER() OVER (PARTITION BY 부서 ORDER BY 급여 DESC, id) AS 순위\n  FROM 직원\n)\nWHERE 순위 <= 2\nORDER BY 부서, 순위, 이름;",
      sol: "SELECT 부서, 이름, 순위 FROM (\n  SELECT 부서, 이름,\n    RANK() OVER (PARTITION BY 부서 ORDER BY 급여 DESC) AS 순위\n  FROM 직원\n)\nWHERE 순위 <= 2\nORDER BY 부서, 순위, 이름;",
      ex: "ROW_NUMBER 는 급여가 같아도 서로 다른 번호를 줘서, 공동 2위 중 한 명이 3번이 되어 잘려 나갑니다. 동점을 함께 보여 주려면 RANK 예요.",
    },
    {
      k: "직원마다 가장 최근 실적", schema: 판매, ordered: true,
      qq: "실적이 있는 <b>직원마다</b> 가장 <b>최근 달</b>의 실적 한 건을 보여 주세요. 열 이름은 <code>직원</code>, <code>월</code>, <code>금액</code> 이고 직원 오름차순입니다.",
      src: "SELECT 직원, 월, 금액 FROM (\n  SELECT 직원, 월, 금액,\n    ROW_NUMBER() OVER (ORDER BY 월 DESC) AS 순위\n  FROM 실적\n)\nWHERE 순위 = 1\nORDER BY 직원;",
      sol: "SELECT 직원, 월, 금액 FROM (\n  SELECT 직원, 월, 금액,\n    ROW_NUMBER() OVER (PARTITION BY 직원 ORDER BY 월 DESC) AS 순위\n  FROM 실적\n)\nWHERE 순위 = 1\nORDER BY 직원;",
      ex: "PARTITION BY 를 빼면 전체에 한 줄로 번호가 매겨져 1번이 딱 한 행만 나옵니다. 직원마다 다시 세어야 직원 수만큼 나와요.",
    },
  ],
},
/* ── 고급 그룹화 ──────────────────────────────────────────── */
{
  unit: "고급 그룹화",
  lesson: "직접 써 보기 — 묶은 뒤에 거르기",
  th: {
    sum: "`WHERE` 는 **묶기 전에** 행을 거르고, `HAVING` 은 **묶은 뒤에** 그룹을 거른다. 거르는 대상이 다르다.",
    body: [
      { h: "평균으로 거르려면 HAVING", t: "'평균 급여가 500만 이상인 부서' 는 부서로 묶고 나서야 알 수 있다. `WHERE 급여 >= 5000000` 은 사람을 먼저 걸러 버려서, 남은 사람들만으로 평균을 낸 전혀 다른 답이 된다 — 게다가 그럴듯한 숫자라 틀린 줄도 모른다." },
      { h: "묶는 기준이 여럿일 수 있다", t: "`GROUP BY 부서, 연도` 처럼 두 개를 적으면 조합마다 한 줄이 나온다. 하나를 빠뜨리면 줄 수가 줄고, 빠진 기준은 합쳐져 버린다." },
      { h: "합계 줄은 따로 붙인다", t: "SQLite 에는 `ROLLUP` 이 없다. 그룹별 결과와 전체 합계를 함께 보여 주려면 `UNION ALL` 로 합계 한 줄을 이어 붙인다. 정렬에서 합계가 끝에 가도록 표시용 열을 하나 두면 편하다." },
    ],
    code: { c: "SELECT 부서, AVG(급여) FROM 직원\nGROUP BY 부서\nHAVING AVG(급여) >= 5000000;   -- 묶은 뒤에 거른다", cap: "WHERE 는 행, HAVING 은 그룹" },
    key: ["집계로 거르면 `HAVING`", "묶는 기준은 여러 개", "합계 줄은 `UNION ALL`"],
  },
  q: [
    {
      k: "평균 급여가 높은 부서", schema: 판매, ordered: true,
      qq: "<b>부서 평균 급여가 500만 이상</b>인 부서와 그 평균을 보여 주세요. 열 이름은 <code>부서</code>, <code>평균</code> 이고 부서 오름차순입니다.",
      src: "SELECT 부서, AVG(급여) AS 평균 FROM 직원\nWHERE 급여 >= 5000000\nGROUP BY 부서\nORDER BY 부서;",
      sol: "SELECT 부서, AVG(급여) AS 평균 FROM 직원\nGROUP BY 부서\nHAVING AVG(급여) >= 5000000\nORDER BY 부서;",
      ex: "WHERE 는 묶기 전에 사람을 걸러 냅니다. 500만 미만인 사람이 빠진 뒤 평균을 내니 숫자도 달라지고, 평균이 낮은 부서까지 남아요. 집계 결과로 거르려면 HAVING 입니다.",
    },
    {
      k: "부서와 입사 연도로 묶기", schema: 판매, ordered: true,
      qq: "<b>부서와 입사 연도</b>별 인원을 보여 주세요. 열 이름은 <code>부서</code>, <code>연도</code>, <code>인원</code> 이고 부서·연도 순입니다.",
      src: "SELECT 부서, substr(입사, 1, 4) AS 연도, COUNT(*) AS 인원\nFROM 직원\nGROUP BY 부서\nORDER BY 부서, 연도;",
      sol: "SELECT 부서, substr(입사, 1, 4) AS 연도, COUNT(*) AS 인원\nFROM 직원\nGROUP BY 부서, substr(입사, 1, 4)\nORDER BY 부서, 연도;",
      ex: "연도를 뽑아 보여 주기만 하고 묶는 기준에는 넣지 않으면, 부서 하나에 한 줄만 나오고 연도는 그중 아무 값이나 붙습니다. 보여 줄 기준은 묶는 기준에도 있어야 해요.",
    },
    {
      k: "부서별 인원과 전체 합계", schema: 판매, ordered: true,
      qq: "부서별 인원을 보여 주고, <b>맨 아래에 전체 합계</b> 한 줄을 붙이세요. 합계 줄의 부서 이름은 <code>'합계'</code> 입니다. 열 이름은 <code>부서</code>, <code>인원</code> 이고 합계가 마지막입니다.",
      src: "SELECT 부서, COUNT(*) AS 인원\nFROM 직원\nGROUP BY 부서\nORDER BY 부서;",
      sol: "SELECT 부서, 인원 FROM (\n  SELECT 부서, COUNT(*) AS 인원, 0 AS 끝\n  FROM 직원 GROUP BY 부서\n  UNION ALL\n  SELECT '합계', COUNT(*), 1 FROM 직원\n)\nORDER BY 끝, 부서;",
      ex: "SQLite 에는 ROLLUP 이 없어서 합계 줄을 자동으로 붙여 주지 않습니다. UNION ALL 로 한 줄을 직접 이어 붙이고, 정렬용 열을 하나 두면 합계가 항상 끝에 옵니다.",
    },
  ],
},
/* ── 피벗과 조건부 집계 ───────────────────────────────────── */
{
  unit: "피벗과 조건부 집계",
  lesson: "직접 써 보기 — 세로를 가로로 눕히기",
  th: {
    sum: "행으로 늘어선 값을 **열로 눕히는 것**이 피벗이다. SQLite 에는 전용 문법이 없어 `CASE` 와 집계로 만든다.",
    body: [
      { h: "조건마다 열을 하나씩", t: "`SUM(CASE WHEN 월='2026-01' THEN 금액 END)` 은 1월 행만 골라 더한다. 조건에 안 맞는 행은 `NULL` 이 되어 `SUM` 이 무시한다. 이 한 덩어리를 조건 개수만큼 늘어놓으면 표가 옆으로 눕는다." },
      { h: "COUNT 와 SUM 을 헷갈리지 않는다", t: "`COUNT(CASE ... THEN 1 ELSE 0 END)` 는 `0` 도 값이라 **전부** 세어 버린다. 개수를 세려면 `SUM(... THEN 1 ELSE 0 END)` 을 쓰거나 `ELSE` 를 빼서 `NULL` 이 되게 한다. 조건부 집계에서 가장 흔한 실수다." },
      { h: "빈 칸은 0으로 보여 준다", t: "해당 달에 실적이 없으면 `SUM` 은 `NULL` 을 준다. 표에 빈칸이 생기고 나중에 더하면 그 열이 통째로 사라진다. `COALESCE(SUM(...), 0)` 으로 0을 채워 두면 읽기도 계산하기도 편하다." },
    ],
    code: { c: "SELECT 직원,\n  COALESCE(SUM(CASE WHEN 월='2026-01' THEN 금액 END), 0) AS \"1월\"\nFROM 실적 GROUP BY 직원;", cap: "CASE 한 덩어리가 열 하나" },
    key: ["조건마다 열 하나", "세는 것은 `SUM`", "빈칸은 `COALESCE` 로 0"],
  },
  q: [
    {
      k: "직원별 월별 금액을 옆으로", schema: 판매, ordered: true,
      qq: "직원마다 <b>1월·2월·3월</b> 금액을 <b>열로</b> 보여 주세요. 열 이름은 <code>직원</code>, <code>m1</code>, <code>m2</code>, <code>m3</code> 이고 직원 오름차순입니다.",
      src: "SELECT 직원,\n  COUNT(CASE WHEN 월 = '2026-01' THEN 금액 END) AS m1,\n  COUNT(CASE WHEN 월 = '2026-02' THEN 금액 END) AS m2,\n  COUNT(CASE WHEN 월 = '2026-03' THEN 금액 END) AS m3\nFROM 실적 GROUP BY 직원 ORDER BY 직원;",
      sol: "SELECT 직원,\n  SUM(CASE WHEN 월 = '2026-01' THEN 금액 END) AS m1,\n  SUM(CASE WHEN 월 = '2026-02' THEN 금액 END) AS m2,\n  SUM(CASE WHEN 월 = '2026-03' THEN 금액 END) AS m3\nFROM 실적 GROUP BY 직원 ORDER BY 직원;",
      ex: "COUNT 는 값이 몇 개인지를 셉니다. 금액을 물었는데 '건수' 가 나와요. 금액을 옆으로 눕히려면 SUM 이어야 합니다.",
    },
    {
      k: "부서별 급여 구간 인원", schema: 판매, ordered: true,
      qq: "부서마다 <b>500만 이상</b> 인원과 <b>500만 미만</b> 인원을 세어 주세요. 열 이름은 <code>부서</code>, <code>많음</code>, <code>적음</code> 이고 부서 오름차순입니다.",
      src: "SELECT 부서,\n  COUNT(CASE WHEN 급여 >= 5000000 THEN 1 ELSE 0 END) AS 많음,\n  COUNT(CASE WHEN 급여 < 5000000 THEN 1 ELSE 0 END) AS 적음\nFROM 직원 GROUP BY 부서 ORDER BY 부서;",
      sol: "SELECT 부서,\n  SUM(CASE WHEN 급여 >= 5000000 THEN 1 ELSE 0 END) AS 많음,\n  SUM(CASE WHEN 급여 < 5000000 THEN 1 ELSE 0 END) AS 적음\nFROM 직원 GROUP BY 부서 ORDER BY 부서;",
      ex: "ELSE 0 은 NULL 이 아니라 0 입니다. COUNT 는 0 도 값으로 세어서 두 열이 모두 부서 전체 인원이 돼요. 세려면 SUM 을 쓰거나 ELSE 를 빼야 합니다.",
    },
    {
      k: "빈 달은 0으로 채우기", schema: 판매, ordered: true,
      qq: "직원마다 <b>1월</b> 금액을 보여 주되, <b>없거나 비어 있으면 0</b>으로 보여 주세요. 열 이름은 <code>직원</code>, <code>m1</code> 이고 직원 오름차순입니다.",
      src: "SELECT 직원,\n  SUM(CASE WHEN 월 = '2026-01' THEN 금액 END) AS m1\nFROM 실적 GROUP BY 직원 ORDER BY 직원;",
      sol: "SELECT 직원,\n  COALESCE(SUM(CASE WHEN 월 = '2026-01' THEN 금액 END), 0) AS m1\nFROM 실적 GROUP BY 직원 ORDER BY 직원;",
      ex: "해당 달 행이 없거나 금액이 비어 있으면 SUM 은 NULL 을 줍니다. 표에 빈칸이 생기고, 나중에 그 값을 더하면 결과가 통째로 NULL 이 돼요. COALESCE 로 0을 채워 둡니다.",
    },
  ],
},
/* ── 고급 윈도우 함수 ─────────────────────────────────────── */
{
  unit: "고급 윈도우 함수",
  lesson: "직접 써 보기 — 줄을 남긴 채 계산하기",
  th: {
    sum: "윈도우 함수는 **행을 줄이지 않고** 옆에 계산 결과를 붙인다. `GROUP BY` 와 가장 크게 다른 점이다.",
    body: [
      { h: "ORDER BY 가 있으면 '지금까지'", t: "`SUM(금액) OVER (ORDER BY 월)` 은 처음부터 그 행까지의 **누적 합**이다. `ORDER BY` 를 빼면 범위가 전체가 되어 모든 행에 똑같은 총합이 붙는다. 누적을 원했다면 완전히 다른 표가 된다." },
      { h: "LAG 는 앞, LEAD 는 뒤", t: "`LAG(금액) OVER (ORDER BY 월)` 은 **이전 행**의 값이고 `LEAD` 는 다음 행이다. 전월 대비를 구하는데 `LEAD` 를 쓰면 부호가 뒤집힌 채 한 칸씩 밀린 값이 나온다 — 그럴듯해서 더 위험하다." },
      { h: "PARTITION BY 로 무리를 나눈다", t: "`AVG(급여) OVER (PARTITION BY 부서)` 는 각 행 옆에 **그 사람 부서의** 평균을 붙인다. 빼면 회사 전체 평균이 붙는다. 개인과 자기 무리를 견주는 표는 대개 이 한 줄로 만든다." },
    ],
    code: { c: "SUM(금액) OVER (ORDER BY 월)              -- 누적 합\nLAG(금액) OVER (ORDER BY 월)              -- 이전 행\nAVG(급여) OVER (PARTITION BY 부서)        -- 자기 부서 평균", cap: "행을 줄이지 않고 옆에 붙인다" },
    key: ["`ORDER BY` 가 있으면 누적", "`LAG` 는 앞, `LEAD` 는 뒤", "`PARTITION BY` 로 무리를 나눈다"],
  },
  q: [
    {
      k: "1번 직원의 누적 실적", schema: 판매, ordered: true,
      qq: "<code>직원 = 1</code> 의 월별 금액과 <b>그달까지의 누적 합</b>을 보여 주세요. 열 이름은 <code>월</code>, <code>금액</code>, <code>누적</code> 이고 월 오름차순입니다.",
      src: "SELECT 월, 금액,\n  SUM(금액) OVER () AS 누적\nFROM 실적 WHERE 직원 = 1 ORDER BY 월;",
      sol: "SELECT 월, 금액,\n  SUM(금액) OVER (ORDER BY 월) AS 누적\nFROM 실적 WHERE 직원 = 1 ORDER BY 월;",
      ex: "OVER () 는 범위가 전체라서 모든 행에 똑같은 총합이 붙습니다. ORDER BY 를 넣어야 '처음부터 이 행까지' 로 범위가 좁혀져 누적이 돼요.",
    },
    {
      k: "전월 대비 증감", schema: 판매, ordered: true,
      qq: "<code>직원 = 1</code> 의 월별 금액과 <b>지난달보다 얼마나 늘었는지</b>를 보여 주세요. 첫 달은 <code>NULL</code> 입니다. 열 이름은 <code>월</code>, <code>금액</code>, <code>증감</code> 이고 월 오름차순입니다.",
      src: "SELECT 월, 금액,\n  금액 - LEAD(금액) OVER (ORDER BY 월) AS 증감\nFROM 실적 WHERE 직원 = 1 ORDER BY 월;",
      sol: "SELECT 월, 금액,\n  금액 - LAG(금액) OVER (ORDER BY 월) AS 증감\nFROM 실적 WHERE 직원 = 1 ORDER BY 월;",
      ex: "LEAD 는 다음 달 값이라, 빼면 부호가 뒤집히고 비어 있는 자리도 첫 달이 아니라 마지막 달이 됩니다. 숫자가 그럴듯해서 더 알아채기 어려워요.",
    },
    {
      k: "자기 부서 평균과 나란히", schema: 판매, ordered: true,
      qq: "직원마다 <code>이름</code>, <code>급여</code>, 그리고 <b>자기 부서의 평균 급여</b>를 나란히 보여 주세요. 열 이름은 <code>이름</code>, <code>급여</code>, <code>부서평균</code> 이고 id 순서입니다.",
      src: "SELECT 이름, 급여,\n  AVG(급여) OVER () AS 부서평균\nFROM 직원 ORDER BY id;",
      sol: "SELECT 이름, 급여,\n  AVG(급여) OVER (PARTITION BY 부서) AS 부서평균\nFROM 직원 ORDER BY id;",
      ex: "PARTITION BY 를 빼면 회사 전체 평균이 모든 행에 똑같이 붙습니다. 부서마다 다른 값이 나와야 하니 무리를 나눠 줘야 해요.",
    },
  ],
},
];
