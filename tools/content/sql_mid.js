/* SQL 중급 유닛 실습 (2차).
   1차에서 조회·집계·JOIN 등 기초 6개 유닛을 채웠다. 여기서는 그 다음 단계 —
   CASE·NULL·윈도우 함수·CTE·날짜·형변환처럼 '조용히 틀리는' 곳들이다.

   채점은 브라우저 안의 sql.js(진짜 SQLite)가 한다. 실행 서버가 필요 없다.
   시작 쿼리(src)는 반드시 정답과 다른 결과를 내야 한다 — 검증기가 확인한다. */

const 판매 = `CREATE TABLE 직원 (
  id INTEGER PRIMARY KEY, 이름 TEXT, 부서 TEXT, 급여 INTEGER, 입사 TEXT, 상사 INTEGER
);
INSERT INTO 직원 VALUES
  (1,'가영','영업',5200000,'2021-03-15',NULL),
  (2,'나연','영업',4800000,'2022-07-01',1),
  (3,'다솜','개발',6100000,'2020-01-20',NULL),
  (4,'라온','개발',5500000,'2023-02-28',3),
  (5,'마루','개발',5500000,'2023-11-05',3),
  (6,'바다','지원',3900000,'2024-06-10',1),
  -- 시각이 붙은 값. 이게 없으면 BETWEEN 과 반열림이 같은 결과라 기간 문항이 성립하지 않는다.
  (7,'사랑','지원',4100000,'2023-12-31 09:00',1);
CREATE TABLE 실적 (
  id INTEGER PRIMARY KEY, 직원 INTEGER, 월 TEXT, 금액 INTEGER
);
INSERT INTO 실적 VALUES
  (1,1,'2026-01',1200000),(2,1,'2026-02',900000),
  (3,2,'2026-01',700000),(4,2,'2026-03',1500000),
  (5,3,'2026-02',300000),(6,6,'2026-01',NULL);`;

module.exports = [
{
  unit: "CASE와 조건식",
  lesson: "직접 써 보기 — 조건에 따라 값 바꾸기",
  th: {
    sum: "`CASE` 는 행마다 조건을 보고 값을 고른다. **위에서부터 처음 맞는 것 하나만** 쓰인다.",
    body: [
      { h: "순서가 결과를 정한다", t: "`WHEN 급여 >= 4000000 THEN '중간' WHEN 급여 >= 6000000 THEN '높음'` 이라고 쓰면 600만원도 '중간' 이 된다. 앞에서 이미 걸렸기 때문이다. **좁은 조건(높은 기준)을 위에** 둔다 — 프로그래밍의 `else if` 사슬과 같은 규칙이다." },
      { h: "ELSE 를 빠뜨리면", t: "아무 `WHEN` 에도 걸리지 않으면 `CASE` 는 `NULL` 을 준다. 오류가 아니라 조용히 빈 값이 되므로, 집계에서 그 행만 빠지는 식으로 나중에 드러난다. 기본값이 있어야 하면 `ELSE` 를 반드시 적는다." },
    ],
    code: { c: "CASE\n  WHEN 급여 >= 6000000 THEN '높음'   -- 높은 기준부터\n  WHEN 급여 >= 5000000 THEN '중간'\n  ELSE '낮음'                        -- 빠뜨리면 NULL\nEND", cap: "높은 기준을 위에, ELSE 를 꼭" },
    key: ["처음 맞는 `WHEN` 하나만 쓰인다", "높은 기준을 위에 둔다", "`ELSE` 가 없으면 `NULL`"],
  },
  q: [
    {
      k: "급여 등급 매기기", schema: 판매, ordered: true,
      qq: "직원의 <code>이름</code>과 <b>급여 등급</b>을 보여 주세요. <b>600만 이상 '높음'</b>, <b>500만 이상 '중간'</b>, 나머지는 <b>'낮음'</b> 입니다. 열 이름은 <code>이름</code>, <code>등급</code> 이고 id 순서입니다.",
      src: "SELECT 이름,\n  CASE WHEN 급여 >= 5000000 THEN '중간'\n       WHEN 급여 >= 6000000 THEN '높음'\n       ELSE '낮음' END AS 등급\nFROM 직원 ORDER BY id;",
      sol: "SELECT 이름,\n  CASE WHEN 급여 >= 6000000 THEN '높음'\n       WHEN 급여 >= 5000000 THEN '중간'\n       ELSE '낮음' END AS 등급\nFROM 직원 ORDER BY id;",
      ex: "500만 이상을 위에 두면 610만원인 다솜도 거기서 걸려 '중간' 이 됩니다. CASE 는 처음 맞는 WHEN 하나만 쓰니 높은 기준을 위에 둬야 해요.",
    },
    {
      k: "조건부 집계", schema: 판매, ordered: true,
      qq: "부서별로 <b>전체 인원</b>과 <b>급여 550만 이상인 인원</b>을 함께 보여 주세요. 열 이름은 <code>부서</code>, <code>전체</code>, <code>고액</code> 이고 부서 오름차순입니다.",
      src: "SELECT 부서, COUNT(*) AS 전체,\n  COUNT(CASE WHEN 급여 >= 5500000 THEN 1 ELSE 0 END) AS 고액\nFROM 직원 GROUP BY 부서 ORDER BY 부서;",
      sol: "SELECT 부서, COUNT(*) AS 전체,\n  SUM(CASE WHEN 급여 >= 5500000 THEN 1 ELSE 0 END) AS 고액\nFROM 직원 GROUP BY 부서 ORDER BY 부서;",
      ex: "COUNT 는 NULL 이 아닌 값을 세는데, ELSE 0 은 NULL 이 아니라 0 입니다. 조건에 안 맞는 행까지 세어 전체 인원과 같아져요. 세고 싶으면 SUM 을 쓰거나 ELSE 를 빼서 NULL 이 되게 합니다.",
    },
  ],
},
{
  unit: "NULL 처리",
  lesson: "직접 써 보기 — 빈 값이 계산을 삼킨다",
  th: {
    sum: "NULL 은 '값이 없다' 가 아니라 **'모른다'** 다. 모르는 값과 계산하면 결과도 모른다 — 그래서 NULL 이 된다.",
    body: [
      { h: "계산과 집계의 차이", t: "`1 + NULL` 은 NULL 이다. 그런데 `SUM(열)` 은 NULL 을 **건너뛰고** 더한다. 같은 NULL 인데 산술에서는 전염되고 집계에서는 무시되니, 두 방식을 섞으면 결과가 달라진다." },
      { h: "COUNT 의 두 얼굴", t: "`COUNT(*)` 는 행 수, `COUNT(열)` 은 그 열이 NULL 이 아닌 행 수다. 평균을 직접 계산할 때 `SUM(열) / COUNT(*)` 로 쓰면 NULL 인 행까지 분모에 들어가 `AVG(열)` 과 값이 달라진다." },
    ],
    code: { c: "1 + NULL          -- NULL (전염된다)\nSUM(열)            -- NULL 을 건너뛴다\nCOALESCE(열, 0)    -- 없으면 0 으로 채운다", cap: "산술은 전염되고 집계는 건너뛴다" },
    key: ["NULL 은 '모른다' 는 뜻", "산술은 NULL 로 전염된다", "집계는 NULL 을 건너뛴다"],
  },
  q: [
    {
      k: "빈 실적을 0으로 세기", schema: 판매, ordered: true,
      qq: "직원별 <b>실적 합계</b>를 보여 주세요. 실적이 <b>없거나 금액이 비어 있으면 0</b> 이어야 합니다. 열 이름은 <code>이름</code>, <code>합계</code> 이고 이름 오름차순입니다.",
      src: "SELECT 직원.이름, SUM(실적.금액) AS 합계\nFROM 직원 LEFT JOIN 실적 ON 실적.직원 = 직원.id\nGROUP BY 직원.id, 직원.이름 ORDER BY 직원.이름;",
      sol: "SELECT 직원.이름, COALESCE(SUM(실적.금액), 0) AS 합계\nFROM 직원 LEFT JOIN 실적 ON 실적.직원 = 직원.id\nGROUP BY 직원.id, 직원.이름 ORDER BY 직원.이름;",
      ex: "짝이 없는 직원은 SUM 할 것이 없어 NULL 이 나옵니다. 바다처럼 금액이 NULL 인 실적만 있는 경우도 마찬가지예요. 0 으로 보이려면 COALESCE 로 채워야 합니다.",
    },
    {
      k: "평균의 분모", schema: 판매, ordered: true,
      qq: "실적 테이블에서 <b>기록된 금액의 평균</b>을 보여 주세요. 금액이 비어 있는 행은 <b>분모에서도 빠져야</b> 합니다. 열 이름은 <code>평균</code> 입니다.",
      src: "SELECT SUM(금액) * 1.0 / COUNT(*) AS 평균 FROM 실적;",
      sol: "SELECT SUM(금액) * 1.0 / COUNT(금액) AS 평균 FROM 실적;",
      ex: "COUNT(*) 는 금액이 NULL 인 행까지 셉니다. SUM 은 그 행을 건너뛰었는데 분모에만 들어가서 평균이 낮게 나와요. 분자와 분모의 기준을 맞춰야 합니다 — COUNT(금액) 입니다.",
    },
  ],
},
{
  unit: "윈도우 함수와 CTE",
  lesson: "직접 써 보기 — 행을 줄이지 않고 계산하기",
  th: {
    sum: "`GROUP BY` 는 행을 **묶어서 줄인다.** 윈도우 함수는 행을 그대로 두고 옆에 계산 결과를 붙인다.",
    body: [
      { h: "OVER 가 하는 일", t: "`SUM(급여) OVER (PARTITION BY 부서)` 는 부서별 합계를 **각 행 옆에** 붙인다. 개인 급여와 부서 합계를 같은 행에서 비교할 수 있다 — `GROUP BY` 로는 개인 정보가 사라져 불가능한 일이다." },
      { h: "순위 세 가지", t: "`ROW_NUMBER` 는 동점이어도 1,2,3 으로 다르게 매긴다. `RANK` 는 동점에 같은 순위를 주고 다음을 건너뛴다(1,1,3). `DENSE_RANK` 는 건너뛰지 않는다(1,1,2). '공동 2등 다음이 3등이냐 4등이냐' 가 여기서 갈린다." },
    ],
    code: { c: "SELECT 이름, 급여,\n  SUM(급여) OVER (PARTITION BY 부서) AS 부서합,\n  RANK() OVER (ORDER BY 급여 DESC) AS 순위\nFROM 직원;", cap: "행을 줄이지 않고 옆에 붙인다" },
    key: ["윈도우 함수는 행을 줄이지 않는다", "`PARTITION BY` 가 묶는 기준", "`RANK` 는 건너뛰고 `DENSE_RANK` 는 안 건너뛴다"],
  },
  q: [
    {
      k: "부서 합계를 각 행에 붙이기", schema: 판매, ordered: true,
      qq: "각 직원의 <code>이름</code>·<code>급여</code>와 함께 <b>그 직원이 속한 부서의 급여 합계</b>를 같은 행에 보여 주세요. 열 이름은 <code>이름</code>, <code>급여</code>, <code>부서합</code> 이고 id 순서입니다.",
      src: "SELECT 이름, 급여, SUM(급여) AS 부서합\nFROM 직원 GROUP BY 부서 ORDER BY id;",
      sol: "SELECT 이름, 급여, SUM(급여) OVER (PARTITION BY 부서) AS 부서합\nFROM 직원 ORDER BY id;",
      ex: "GROUP BY 로 묶으면 부서마다 한 행만 남아 개인 이름이 사라집니다. 행을 그대로 두고 계산만 옆에 붙이려면 윈도우 함수(OVER)를 써야 해요.",
    },
    {
      k: "동점을 건너뛰지 않는 순위", schema: 판매, ordered: true,
      qq: "급여가 높은 순으로 <b>순위</b>를 매기되, <b>동점 다음 순위가 건너뛰지 않게</b> 하세요. 열 이름은 <code>이름</code>, <code>급여</code>, <code>순위</code> 이고 순위·이름 순으로 정렬합니다.",
      src: "SELECT 이름, 급여, RANK() OVER (ORDER BY 급여 DESC) AS 순위\nFROM 직원 ORDER BY 순위, 이름;",
      sol: "SELECT 이름, 급여, DENSE_RANK() OVER (ORDER BY 급여 DESC) AS 순위\nFROM 직원 ORDER BY 순위, 이름;",
      ex: "RANK 는 동점이 둘이면 다음 순위를 하나 건너뜁니다 (1, 2, 2, 4). 건너뛰지 않으려면 DENSE_RANK 예요 (1, 2, 2, 3). 어느 쪽이 맞는지는 업무 규칙이 정합니다.",
    },
  ],
},
{
  unit: "서브쿼리와 NULL의 함정",
  lesson: "직접 써 보기 — NOT IN 이 비는 이유",
  th: {
    sum: "서브쿼리 결과에 NULL 이 하나라도 섞이면 `NOT IN` 은 **아무 행도 돌려주지 않는다.**",
    body: [
      { h: "왜 0행이 되나", t: "`x NOT IN (1, NULL)` 은 'x 가 1도 아니고 NULL 도 아니다' 를 증명해야 하는데, NULL 과의 비교는 참도 거짓도 아닌 '모름' 이다. 그래서 전체가 참이 될 수 없다. 결과가 갑자기 0행이면 이걸 먼저 의심한다." },
      { h: "안전한 대안", t: "`NOT EXISTS` 는 NULL 에 영향을 받지 않는다. 서브쿼리 안에서 바깥 행과 비교하는 방식이라 '짝이 없다' 를 정확히 표현한다. 아니면 서브쿼리에 `WHERE 열 IS NOT NULL` 을 붙인다." },
    ],
    code: { c: "-- 위험: 서브쿼리에 NULL 이 있으면 0행\nWHERE id NOT IN (SELECT 상사 FROM 직원)\n\n-- 안전\nWHERE NOT EXISTS (SELECT 1 FROM 직원 부하 WHERE 부하.상사 = 직원.id)", cap: "NOT IN + NULL = 0행" },
    key: ["`NOT IN` 에 NULL 이 섞이면 0행", "`NOT EXISTS` 는 안전하다", "서브쿼리에서 NULL 을 먼저 걸러도 된다"],
  },
  q: [
    {
      k: "부하가 없는 직원", schema: 판매, ordered: true,
      qq: "<b>자기 밑에 아무도 없는</b> 직원의 이름을 이름 오름차순으로 보여 주세요. (상사 열에 자기 id 가 한 번도 나오지 않는 직원입니다.)",
      src: "SELECT 이름 FROM 직원\nWHERE id NOT IN (SELECT 상사 FROM 직원)\nORDER BY 이름;",
      sol: "SELECT 이름 FROM 직원\nWHERE NOT EXISTS (SELECT 1 FROM 직원 부하 WHERE 부하.상사 = 직원.id)\nORDER BY 이름;",
      ex: "상사 열에 NULL 이 들어 있어서 NOT IN 이 아무 행도 돌려주지 않습니다. 결과가 통째로 비면 서브쿼리의 NULL 을 먼저 의심하세요. NOT EXISTS 는 이 문제가 없습니다.",
    },
    {
      k: "실적이 없는 직원", schema: 판매, ordered: true,
      qq: "실적 테이블에 <b>기록이 하나도 없는</b> 직원의 이름을 이름 오름차순으로 보여 주세요.",
      src: "SELECT 이름 FROM 직원\nWHERE id IN (SELECT 직원 FROM 실적)\nORDER BY 이름;",
      sol: "SELECT 이름 FROM 직원\nWHERE id NOT IN (SELECT 직원 FROM 실적)\nORDER BY 이름;",
      ex: "IN 은 '있는' 직원을 고릅니다 — 물어본 것과 정반대예요. 여기서는 실적.직원 에 NULL 이 없어 NOT IN 을 그대로 써도 안전합니다. NULL 이 섞일 수 있는 열이라면 NOT EXISTS 가 낫습니다.",
    },
  ],
},
{
  unit: "날짜·시간 함수",
  lesson: "직접 써 보기 — 기간을 정확히 자르기",
  th: {
    sum: "날짜를 문자열로 비교할 때는 형식이 같아야 한다. `'2026-1-5'` 와 `'2026-01-05'` 는 다른 문자열이다.",
    body: [
      { h: "월 단위로 자르기", t: "`strftime('%Y-%m', 날짜)` 로 연-월을 뽑으면 월별 집계가 쉬워진다. `substr(날짜, 1, 7)` 도 같은 결과를 주지만, 날짜 형식이 어긋난 값이 섞이면 조용히 틀린 값을 만든다 — `strftime` 은 날짜로 해석할 수 없으면 NULL 을 준다." },
      { h: "경계는 반열림으로", t: "`날짜 BETWEEN '2026-01-01' AND '2026-01-31'` 은 시각이 붙은 값(`2026-01-31 14:00`)을 놓친다. `>= 시작 AND < 다음달 1일` 로 적으면 시각이 있든 없든 정확하다." },
    ],
    code: { c: "strftime('%Y-%m', 입사)            -- '2026-01'\nWHERE 입사 >= '2026-01-01'\n  AND 입사 <  '2026-02-01'        -- 반열림", cap: "끝은 '다음 구간의 시작' 으로 자른다" },
    key: ["`strftime('%Y-%m', …)` 로 월을 뽑는다", "문자열 비교는 형식이 같아야 한다", "기간은 `>= 시작 AND < 다음`"],
  },
  q: [
    {
      k: "연도별 입사자 수", schema: 판매, ordered: true,
      qq: "<b>입사 연도별</b> 인원수를 보여 주세요. 열 이름은 <code>연도</code>, <code>인원</code> 이고 연도 오름차순입니다.",
      src: "SELECT 입사 AS 연도, COUNT(*) AS 인원\nFROM 직원 GROUP BY 입사 ORDER BY 연도;",
      sol: "SELECT strftime('%Y', 입사) AS 연도, COUNT(*) AS 인원\nFROM 직원 GROUP BY 연도 ORDER BY 연도;",
      ex: "입사 열 전체로 묶으면 날짜가 다 달라 한 명씩 나옵니다. 연도만 뽑아 묶어야 해요 — strftime('%Y', …) 가 그 일을 합니다.",
    },
    {
      k: "2023년에 입사한 사람", schema: 판매, ordered: true,
      qq: "<b>2023년에 입사한</b> 직원의 이름을 입사일 순서로 보여 주세요. 시각이 붙은 값이 있어도 빠지지 않아야 합니다.",
      src: "SELECT 이름 FROM 직원\nWHERE 입사 BETWEEN '2023-01-01' AND '2023-12-31'\nORDER BY 입사;",
      sol: "SELECT 이름 FROM 직원\nWHERE 입사 >= '2023-01-01' AND 입사 < '2024-01-01'\nORDER BY 입사;",
      ex: "BETWEEN 의 끝을 '2023-12-31' 로 잡으면 '2023-12-31 09:00' 같은 값이 빠집니다. 문자열 비교라 뒤에 시각이 붙으면 더 큰 값이 되기 때문이에요. 끝을 '다음 해 1월 1일 미만' 으로 잡으면 시각이 있든 없든 정확합니다.",
    },
  ],
},
{
  unit: "형변환",
  lesson: "직접 써 보기 — 숫자처럼 생긴 문자열",
  th: {
    sum: "숫자처럼 보여도 문자열이면 **정렬과 비교가 글자 순서**로 된다. `'10' < '9'` 가 참이다.",
    body: [
      { h: "글자 순서와 숫자 순서", t: "문자열은 앞 글자부터 비교한다. `'10'` 은 `'1'` 로 시작해 `'9'` 보다 작다. 숫자로 다루려면 `CAST(열 AS INTEGER)` 로 바꾸고 나서 비교·정렬한다. 반대로 숫자를 문자열처럼 붙이려면 `CAST(… AS TEXT)` 다." },
      { h: "정수 나눗셈", t: "SQLite 에서 `7 / 2` 는 `3` 이다. 비율이나 평균은 한쪽을 실수로 만들어야 한다 — `7 * 1.0 / 2` 또는 `CAST(7 AS REAL) / 2`. 이걸 놓치면 백분율이 전부 0 이나 정수로 나온다." },
    ],
    code: { c: "'10' < '9'                  -- 참 (글자 순서)\nCAST('10' AS INTEGER) < 9    -- 거짓 (숫자 순서)\n7 * 1.0 / 2                  -- 3.5", cap: "숫자로 다루려면 먼저 바꾼다" },
    key: ["문자열 비교는 글자 순서", "`CAST(… AS INTEGER)` 로 숫자로", "정수끼리 나누면 정수"],
  },
  q: [
    {
      k: "부서별 급여 비율", schema: 판매, ordered: true,
      qq: "부서별 급여 합계가 <b>전체 급여 합계의 몇 퍼센트</b>인지 보여 주세요. 열 이름은 <code>부서</code>, <code>비율</code> 이고 소수까지 나와야 합니다. 부서 오름차순입니다.",
      src: "SELECT 부서, SUM(급여) * 100 / (SELECT SUM(급여) FROM 직원) AS 비율\nFROM 직원 GROUP BY 부서 ORDER BY 부서;",
      sol: "SELECT 부서, SUM(급여) * 100.0 / (SELECT SUM(급여) FROM 직원) AS 비율\nFROM 직원 GROUP BY 부서 ORDER BY 부서;",
      ex: "정수끼리 나누면 소수점이 잘려 비율이 뭉툭해집니다. 100 대신 100.0 을 쓰면 실수 계산이 되어 소수까지 나와요.",
    },
    {
      k: "월을 숫자로 정렬", schema: 판매, ordered: true,
      qq: "실적을 <b>월의 숫자 순서</b>로 정렬해 <code>월</code>과 <code>금액</code>을 보여 주세요. <code>'2026-01'</code> 에서 뒤 두 자리를 숫자로 다뤄야 합니다. 금액이 비어 있는 행은 제외합니다.",
      src: "SELECT 월, 금액 FROM 실적\nWHERE 금액 IS NOT NULL\nORDER BY substr(월, 6, 2) DESC;",
      sol: "SELECT 월, 금액 FROM 실적\nWHERE 금액 IS NOT NULL\nORDER BY CAST(substr(월, 6, 2) AS INTEGER), 금액;",
      ex: "substr 로 뽑은 '01' 은 문자열이라 글자 순서로 정렬됩니다. 그리고 DESC 라 순서도 반대예요. 숫자로 다루려면 CAST 로 바꾸고 오름차순으로 정렬해야 합니다.",
    },
  ],
},
{
  unit: "재귀 CTE",
  lesson: "직접 써 보기 — 스스로를 부르는 쿼리",
  th: {
    sum: "재귀 CTE 는 '시작점' 과 '한 걸음 더 가는 규칙' 을 `UNION ALL` 로 잇는다. 조직도·경로처럼 깊이를 모르는 구조에 쓴다.",
    body: [
      { h: "두 부분으로 이루어진다", t: "앵커(시작점)는 재귀하지 않는 평범한 SELECT 다. 재귀 부분은 CTE 자기 이름을 참조해 한 걸음 더 간다. 둘을 `UNION ALL` 로 잇는다 — `UNION` 을 쓰면 중복을 지우느라 느려지고, 의도치 않게 행이 사라질 수 있다." },
      { h: "멈추는 조건", t: "재귀 부분의 `JOIN` 조건이 더 이상 맞지 않으면 자연히 멈춘다. 데이터에 순환이 있으면 영영 안 끝나므로, 깊이 열을 두고 `WHERE 깊이 < N` 으로 상한을 거는 것이 실무 관행이다." },
    ],
    code: { c: "WITH RECURSIVE 조직(id, 이름, 깊이) AS (\n  SELECT id, 이름, 0 FROM 직원 WHERE 상사 IS NULL\n  UNION ALL\n  SELECT 직원.id, 직원.이름, 조직.깊이 + 1\n  FROM 직원 JOIN 조직 ON 직원.상사 = 조직.id\n)\nSELECT * FROM 조직;", cap: "시작점 + 한 걸음 더" },
    key: ["앵커와 재귀 부분을 `UNION ALL` 로", "자기 이름을 참조하면 재귀", "순환이 있으면 깊이 상한을 건다"],
  },
  q: [
    {
      k: "조직도 깊이 구하기", schema: 판매, ordered: true,
      qq: "상사가 없는 사람을 <b>깊이 0</b> 으로 두고, 각 직원의 <b>조직 깊이</b>를 구하세요. 열 이름은 <code>이름</code>, <code>깊이</code> 이고 깊이·이름 순으로 정렬합니다.",
      src: "SELECT 이름, 0 AS 깊이 FROM 직원 WHERE 상사 IS NULL\nORDER BY 깊이, 이름;",
      sol: "WITH RECURSIVE 조직(id, 이름, 깊이) AS (\n  SELECT id, 이름, 0 FROM 직원 WHERE 상사 IS NULL\n  UNION ALL\n  SELECT 직원.id, 직원.이름, 조직.깊이 + 1\n  FROM 직원 JOIN 조직 ON 직원.상사 = 조직.id\n)\nSELECT 이름, 깊이 FROM 조직 ORDER BY 깊이, 이름;",
      ex: "시작점만 있고 한 걸음 더 가는 규칙이 없습니다. 부하 직원이 결과에 전혀 나오지 않아요. UNION ALL 아래에 CTE 자기 이름을 참조하는 부분을 붙여야 재귀가 됩니다.",
    },
    {
      k: "1부터 5까지 만들기", schema: 판매, ordered: true,
      qq: "테이블 없이 <b>1부터 5까지</b>의 숫자를 만들어 보여 주세요. 열 이름은 <code>n</code> 이고 오름차순입니다.",
      src: "WITH RECURSIVE 수(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM 수 WHERE n < 6\n)\nSELECT n FROM 수 ORDER BY n;",
      sol: "WITH RECURSIVE 수(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM 수 WHERE n < 5\n)\nSELECT n FROM 수 ORDER BY n;",
      ex: "멈추는 조건의 경계가 한 칸 밀려 6 까지 나옵니다. WHERE n < 5 여야 마지막 값이 5 예요 — 재귀는 '한 걸음 더 갈지' 를 묻는 것이라, 조건의 n 은 지금 값이고 다음 값은 n+1 입니다. 조건을 아예 빼면 영영 끝나지 않습니다.",
    },
  ],
},
{
  unit: "JOIN과 집계의 함정",
  lesson: "직접 써 보기 — 이어 붙이면 수가 부푼다",
  th: {
    sum: "JOIN 은 행을 늘린다. 늘어난 상태에서 집계하면 **같은 값을 여러 번 더한다.**",
    body: [
      { h: "부풀려진 합계", t: "직원 한 명에게 실적이 3건 있으면, JOIN 결과에 그 직원의 급여가 **3번** 나온다. 여기서 `SUM(급여)` 를 하면 급여를 세 배로 더한 값이 나온다. 눈에 잘 안 띄고, 데이터가 늘수록 더 크게 틀린다." },
      { h: "피하는 법", t: "각 테이블을 **따로 집계한 뒤** 이어 붙인다(서브쿼리나 CTE). 아니면 사람 수처럼 셀 때는 `COUNT(DISTINCT …)` 를 쓴다. '이 집계의 분모가 무엇인가' 를 먼저 정하는 것이 요령이다." },
    ],
    code: { c: "-- 위험: JOIN 뒤 SUM(급여) 은 부풀려진다\n-- 안전: 각각 집계하고 나서 잇는다\nWITH 실적합 AS (SELECT 직원, SUM(금액) 합 FROM 실적 GROUP BY 직원)\nSELECT 직원.이름, 직원.급여, 실적합.합 FROM 직원 LEFT JOIN 실적합 …", cap: "따로 집계하고 나서 잇는다" },
    key: ["JOIN 은 행을 늘린다", "늘어난 상태의 `SUM` 은 부풀려진다", "따로 집계하고 잇거나 `DISTINCT` 를 쓴다"],
  },
  q: [
    {
      k: "부서별 급여 합계 — 부풀림 없이", schema: 판매, ordered: true,
      qq: "부서별 <b>급여 합계</b>를 보여 주세요. 실적 테이블과 이어 붙여도 <b>합계가 부풀면 안 됩니다.</b> 열 이름은 <code>부서</code>, <code>급여합</code> 이고 부서 오름차순입니다.",
      src: "SELECT 직원.부서, SUM(직원.급여) AS 급여합\nFROM 직원 LEFT JOIN 실적 ON 실적.직원 = 직원.id\nGROUP BY 직원.부서 ORDER BY 직원.부서;",
      sol: "SELECT 부서, SUM(급여) AS 급여합\nFROM 직원\nGROUP BY 부서 ORDER BY 부서;",
      ex: "실적이 2건인 직원은 JOIN 결과에 두 번 나와 급여가 두 배로 더해집니다. 급여 합계에는 실적 테이블이 필요 없어요 — 필요 없는 JOIN 이 조용히 답을 망칩니다.",
    },
    {
      k: "실적을 낸 사람 수", schema: 판매, ordered: true,
      qq: "부서별로 <b>실적을 한 번이라도 낸 사람이 몇 명</b>인지 보여 주세요. 열 이름은 <code>부서</code>, <code>인원</code> 이고 부서 오름차순입니다. 아무도 없는 부서는 0 으로 나와야 합니다.",
      src: "SELECT 직원.부서, COUNT(실적.id) AS 인원\nFROM 직원 LEFT JOIN 실적 ON 실적.직원 = 직원.id\nGROUP BY 직원.부서 ORDER BY 직원.부서;",
      sol: "SELECT 직원.부서, COUNT(DISTINCT 실적.직원) AS 인원\nFROM 직원 LEFT JOIN 실적 ON 실적.직원 = 직원.id\nGROUP BY 직원.부서 ORDER BY 직원.부서;",
      ex: "COUNT(실적.id) 는 실적 건수를 셉니다. 한 사람이 두 번 냈으면 2명으로 세어져요. 사람 수를 세려면 COUNT(DISTINCT 실적.직원) 입니다.",
    },
  ],
},
];
