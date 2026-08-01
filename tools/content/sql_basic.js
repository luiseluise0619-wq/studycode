/* SQL 기초 유닛 실습.
   '데이터 조회 기초' 는 14문항 전부 고르기다 — 쿼리를 한 줄도 안 쓴다.

   SQL 은 인터넷 없이 브라우저에서 진짜 SQLite 로 채점되고, 재생 뷰어와도 이어진다.
   틀리면 내 쿼리가 실제로 어떤 행을 냈는지 하나씩 넘겨 볼 수 있다.

   주의: 시작 쿼리(src)는 반드시 정답과 '다른 결과' 를 내야 한다.
   문법만 다르고 결과가 같으면 검증기가 잡는다. */

const 가게 = `CREATE TABLE 회원 (
  id INTEGER PRIMARY KEY, 이름 TEXT, 도시 TEXT, 등급 TEXT, 나이 INTEGER
);
INSERT INTO 회원 VALUES
  (1,'가영','서울','우수',28),(2,'나연','부산','일반',35),
  (3,'다솜','서울','일반',22),(4,'라온','대구','우수',41),(5,'마루','서울','일반',NULL);
CREATE TABLE 주문 (
  id INTEGER PRIMARY KEY, 회원 INTEGER, 상품 TEXT, 금액 INTEGER, 날짜 TEXT
);
INSERT INTO 주문 VALUES
  (1,1,'키보드',45000,'2026-01-05'),(2,1,'마우스',22000,'2026-01-20'),
  (3,2,'모니터',210000,'2026-02-11'),(4,4,'키보드',45000,'2026-02-14'),
  (5,4,'허브',18000,'2026-03-02'),(6,4,'케이블',3000,'2026-03-02'),
  -- 경계 날짜에 주문을 둔다. 없으면 '> vs >=' 문제가 같은 결과를 내서 문제가 성립하지 않는다.
  (7,2,'패드',9000,'2026-02-01'),(8,2,'스탠드',31500,'2026-02-28');`;

module.exports = [
{
  unit: "데이터 조회 기초",
  lesson: "직접 써 보기 — 고르고 거르고 줄 세우기",
  th: {
    sum: "`SELECT 무엇을 FROM 어디서 WHERE 조건 ORDER BY 기준` — 이 순서가 SQL 의 뼈대다.",
    body: [
      { h: "NULL 은 = 로 못 찾는다", t: "빈 칸(NULL)은 '값이 없다' 는 뜻이라 `= NULL` 로는 절대 찾아지지 않는다. 어떤 값과 비교해도 참이 아니기 때문이다. `IS NULL` / `IS NOT NULL` 로 물어야 한다." },
      { h: "순서를 안 정하면 순서가 없다", t: "`ORDER BY` 를 쓰지 않으면 행 순서는 보장되지 않는다. 지금 우연히 맞게 나와도 데이터가 커지면 달라진다. 순서가 중요하면 반드시 적는다." },
    ],
    code: { c: "SELECT 이름, 도시\nFROM 회원\nWHERE 도시 = '서울'\nORDER BY 이름;", cap: "고르고 · 거르고 · 줄 세운다" },
    key: ["`WHERE` 는 행을 거른다", "NULL 은 `IS NULL` 로만 찾는다", "`ORDER BY` 없이는 순서가 보장되지 않는다"],
  },
  q: [
    {
      k: "서울 회원 이름", cat: "internals", schema: 가게, ordered: true,
      q: "도시가 <code>'서울'</code> 인 회원의 <b>이름만</b> 골라, <b>이름 오름차순</b>으로 보여 주세요.",
      src: "SELECT * FROM 회원;",
      sol: "SELECT 이름 FROM 회원 WHERE 도시 = '서울' ORDER BY 이름;",
      ex: "SELECT * 는 모든 열과 모든 행을 가져옵니다. 필요한 열만 적고, WHERE 로 거르고, ORDER BY 로 줄을 세워야 해요.",
    },
    {
      k: "나이가 비어 있는 회원", cat: "debug", schema: 가게, ordered: true,
      q: "나이가 <b>입력되지 않은</b> 회원의 이름을 보여 주세요.",
      src: "SELECT 이름 FROM 회원 WHERE 나이 = NULL;",
      sol: "SELECT 이름 FROM 회원 WHERE 나이 IS NULL;",
      ex: "NULL 은 '값이 없다' 는 뜻이라 = 로 비교하면 참이 되는 일이 없습니다. 결과가 0행이 나와요. IS NULL 로 물어야 합니다.",
    },
  ],
},
{
  unit: "집계와 그룹",
  lesson: "직접 써 보기 — 묶어서 세기",
  th: {
    sum: "`GROUP BY` 는 행을 묶고, 집계 함수는 묶음마다 하나의 값을 만든다.",
    body: [
      { h: "WHERE 와 HAVING", t: "`WHERE` 는 **묶기 전에** 행을 거르고, `HAVING` 은 **묶은 뒤** 그룹을 거른다. 그래서 `WHERE COUNT(*) > 1` 은 오류다 — 그 시점엔 아직 센 것이 없다." },
      { h: "COUNT(*) 와 COUNT(열)", t: "`COUNT(*)` 는 행 수를 센다. `COUNT(나이)` 는 그 열이 NULL 이 아닌 행만 센다. 둘의 차이가 곧 빈 칸의 개수다 — 데이터 점검에 자주 쓴다." },
    ],
    code: { c: "SELECT 도시, COUNT(*) AS 수\nFROM 회원\nGROUP BY 도시\nHAVING COUNT(*) >= 2;", cap: "묶고 · 세고 · 묶음을 거른다" },
    key: ["`WHERE` 는 묶기 전, `HAVING` 은 묶은 뒤", "`COUNT(열)` 은 NULL 을 세지 않는다", "묶은 뒤에는 묶은 열과 집계 값만 고를 수 있다"],
  },
  q: [
    {
      k: "회원이 2명 이상인 도시", cat: "internals", schema: 가게, ordered: true,
      q: "회원이 <b>2명 이상</b>인 도시와 그 인원수를 보여 주세요. 열 이름은 <code>도시</code>, <code>수</code> 로 하고 도시 오름차순으로 정렬하세요.",
      src: "SELECT 도시, COUNT(*) AS 수 FROM 회원 GROUP BY 도시 ORDER BY 도시;",
      sol: "SELECT 도시, COUNT(*) AS 수 FROM 회원 GROUP BY 도시 HAVING COUNT(*) >= 2 ORDER BY 도시;",
      ex: "묶은 결과를 거르려면 HAVING 이 필요합니다. 지금은 1명뿐인 도시도 전부 나와요.",
    },
    {
      k: "나이가 입력된 사람 수", cat: "internals", schema: 가게, ordered: true,
      q: "전체 회원 수와 <b>나이가 입력된</b> 회원 수를 한 행으로 보여 주세요. 열 이름은 <code>전체</code>, <code>나이있음</code> 입니다.",
      src: "SELECT COUNT(*) AS 전체, COUNT(*) AS 나이있음 FROM 회원;",
      sol: "SELECT COUNT(*) AS 전체, COUNT(나이) AS 나이있음 FROM 회원;",
      ex: "COUNT(*) 는 행 수라 NULL 도 셉니다. COUNT(나이) 는 나이가 있는 행만 세요 — 그 차이가 빈 칸 개수입니다.",
    },
  ],
},
{
  unit: "JOIN 심화",
  lesson: "직접 써 보기 — 표를 잇기",
  th: {
    sum: "`JOIN` 은 두 표를 잇는다. 짝이 없는 행을 버릴지 남길지가 `INNER` 와 `LEFT` 의 차이다.",
    body: [
      { h: "행이 늘어난다", t: "한 회원에게 주문이 3건이면 이어 붙인 결과에 그 회원이 **3번** 나온다. 그래서 JOIN 뒤에 `COUNT(*)` 를 세면 회원 수가 아니라 주문 수가 나온다. 사람 수를 세려면 `COUNT(DISTINCT 회원.id)` 라고 적어야 한다." },
      { h: "짝이 없는 행", t: "`INNER JOIN` 은 짝이 없으면 버린다 — 주문이 없는 회원은 사라진다. `LEFT JOIN` 은 왼쪽을 다 남기고 오른쪽을 NULL 로 채운다. '주문한 적 없는 회원 찾기' 는 LEFT JOIN 뒤 `IS NULL` 로 만든다." },
    ],
    code: { c: "SELECT 회원.이름, 주문.상품\nFROM 회원\nLEFT JOIN 주문 ON 주문.회원 = 회원.id\nORDER BY 회원.이름;", cap: "LEFT 는 왼쪽을 버리지 않는다" },
    key: ["JOIN 은 행을 늘린다", "사람 수는 `COUNT(DISTINCT …)`", "짝 없는 행을 남기려면 `LEFT JOIN`"],
  },
  q: [
    {
      k: "주문한 적 없는 회원", cat: "internals", schema: 가게, ordered: true,
      q: "주문을 <b>한 번도 하지 않은</b> 회원의 이름을 이름 오름차순으로 보여 주세요.",
      src: "SELECT 회원.이름 FROM 회원 JOIN 주문 ON 주문.회원 = 회원.id ORDER BY 회원.이름;",
      sol: "SELECT 회원.이름 FROM 회원 LEFT JOIN 주문 ON 주문.회원 = 회원.id WHERE 주문.id IS NULL ORDER BY 회원.이름;",
      ex: "INNER JOIN 은 짝이 없는 행을 버려서, 찾으려는 사람이 결과에서 사라집니다. LEFT JOIN 으로 남긴 뒤 오른쪽이 NULL 인 행만 골라야 해요.",
    },
    {
      k: "주문한 사람 수 세기", cat: "debug", schema: 가게, ordered: true,
      q: "주문을 한 번이라도 한 <b>사람이 몇 명</b>인지 한 행으로 보여 주세요. 열 이름은 <code>사람수</code> 입니다.",
      src: "SELECT COUNT(*) AS 사람수 FROM 회원 JOIN 주문 ON 주문.회원 = 회원.id;",
      sol: "SELECT COUNT(DISTINCT 회원.id) AS 사람수 FROM 회원 JOIN 주문 ON 주문.회원 = 회원.id;",
      ex: "JOIN 뒤에는 주문 건수만큼 행이 늘어나 COUNT(*) 가 주문 수를 셉니다. 사람 수를 세려면 DISTINCT 로 중복을 없애야 해요.",
    },
  ],
},
{
  unit: "데이터 조작",
  lesson: "직접 써 보기 — 조건을 정확히 걸기",
  th: {
    sum: "행을 바꾸거나 지울 때 가장 중요한 것은 `WHERE` 다. 빼먹으면 표 전체가 대상이 된다.",
    body: [
      { h: "먼저 SELECT 로 확인한다", t: "`UPDATE`·`DELETE` 를 쓰기 전에 같은 `WHERE` 로 `SELECT` 해서 몇 행이 걸리는지 본다. 그 숫자가 예상과 다르면 조건이 틀린 것이다. 실무에서 사고를 막는 가장 값싼 습관이다." },
      { h: "범위 조건의 함정", t: "`BETWEEN a AND b` 는 양끝을 **포함한다.** 날짜에 쓸 때는 시각까지 있는 열에서 마지막 날이 빠질 수 있으니 `>= 시작 AND < 다음날` 로 적는 편이 안전하다." },
    ],
    code: { c: "-- 바꾸기 전에 먼저 세어 본다\nSELECT COUNT(*) FROM 회원 WHERE 등급 = '일반' AND 나이 >= 30;", cap: "고치기 전에 몇 행이 걸리는지 본다" },
    key: ["`WHERE` 없는 UPDATE·DELETE 는 표 전체를 바꾼다", "바꾸기 전에 같은 조건으로 SELECT 해 본다", "`BETWEEN` 은 양끝을 포함한다"],
  },
  q: [
    {
      k: "정확한 대상 고르기", cat: "internals", schema: 가게, ordered: true,
      q: "등급이 <code>'일반'</code> <b>이면서</b> 나이가 30 이상인 회원의 이름을 이름순으로 보여 주세요. (등급을 바꾸기 전에 대상을 확인하는 쿼리입니다.)",
      src: "SELECT 이름 FROM 회원 WHERE 등급 = '일반' OR 나이 >= 30 ORDER BY 이름;",
      sol: "SELECT 이름 FROM 회원 WHERE 등급 = '일반' AND 나이 >= 30 ORDER BY 이름;",
      ex: "OR 는 둘 중 하나만 맞아도 걸립니다. 이걸 그대로 UPDATE 에 쓰면 엉뚱한 사람까지 바뀌어요. 두 조건을 다 만족해야 하면 AND 입니다.",
    },
    {
      k: "기간으로 고르기", cat: "internals", schema: 가게, ordered: true,
      q: "2026년 2월에 들어온 주문의 <code>상품</code> 과 <code>금액</code> 을 id 순서대로 보여 주세요.",
      src: "SELECT 상품, 금액 FROM 주문 WHERE 날짜 > '2026-02-01' AND 날짜 < '2026-02-28' ORDER BY id;",
      sol: "SELECT 상품, 금액 FROM 주문 WHERE 날짜 >= '2026-02-01' AND 날짜 <= '2026-02-28' ORDER BY id;",
      ex: "> 와 < 는 양끝 날짜를 빼먹습니다. 2월 1일과 2월 28일 주문이 빠져요. 경계를 포함하려면 >= 와 <= 를 써야 합니다.",
    },
  ],
},
{
  unit: "필터·집합 심화",
  lesson: "직접 써 보기 — IN·NOT IN 과 NULL",
  th: {
    sum: "`IN` 은 여러 값 중 하나인지 묻는다. 그런데 `NOT IN` 에 NULL 이 섞이면 결과가 통째로 비어 버린다.",
    body: [
      { h: "NOT IN 의 함정", t: "`x NOT IN (1, NULL)` 은 참이 되는 일이 없다. NULL 과의 비교가 '모름' 이라서 '전부 다르다' 를 증명할 수 없기 때문이다. 결과가 0행이면 이걸 먼저 의심한다. 서브쿼리에 NULL 이 섞이면 `NOT EXISTS` 를 쓰거나 `WHERE 열 IS NOT NULL` 을 붙인다." },
      { h: "LIKE 와 대소문자", t: "`LIKE '%김%'` 은 부분 일치를 찾는다. `%` 는 아무 글자 0개 이상, `_` 는 딱 한 글자다. 찾을 값 안에 `%` 가 들어 있으면 그대로 와일드카드로 해석되니 주의한다." },
    ],
    code: { c: "SELECT 이름 FROM 회원\nWHERE 도시 IN ('서울', '부산');\n\n-- 위험: 서브쿼리에 NULL 이 있으면 0행\nSELECT * FROM 주문 WHERE 회원 NOT IN (SELECT 나이 FROM 회원);", cap: "NOT IN 에 NULL 이 섞이면 결과가 사라진다" },
    key: ["`IN` 은 '여러 값 중 하나'", "`NOT IN` + NULL = 0행", "`%` 는 여러 글자, `_` 는 한 글자"],
  },
  q: [
    {
      k: "여러 도시 한 번에", cat: "internals", schema: 가게, ordered: true,
      q: "도시가 <code>'서울'</code> 또는 <code>'대구'</code> 인 회원의 이름을 이름순으로 보여 주세요.",
      src: "SELECT 이름 FROM 회원 WHERE 도시 = '서울' AND 도시 = '대구' ORDER BY 이름;",
      sol: "SELECT 이름 FROM 회원 WHERE 도시 IN ('서울', '대구') ORDER BY 이름;",
      ex: "한 행의 도시가 동시에 두 값일 수는 없어서 AND 로 묶으면 결과가 0행입니다. '둘 중 하나' 는 OR 또는 IN 입니다.",
    },
    {
      k: "NOT IN 이 비는 이유", cat: "debug", schema: 가게, ordered: true,
      q: "나이가 <b>22살도 35살도 아닌</b> 회원의 이름을 이름순으로 보여 주세요. 나이가 비어 있는 회원도 포함해야 합니다.",
      src: "SELECT 이름 FROM 회원 WHERE 나이 NOT IN (22, 35) ORDER BY 이름;",
      sol: "SELECT 이름 FROM 회원 WHERE 나이 IS NULL OR 나이 NOT IN (22, 35) ORDER BY 이름;",
      ex: "나이가 NULL 인 행은 NOT IN 비교가 '모름' 이라 걸러집니다. 조용히 빠져요 — NULL 을 따로 챙겨 줘야 합니다.",
    },
  ],
},
{
  unit: "문자열·숫자 함수",
  lesson: "직접 써 보기 — 값 다듬기",
  th: {
    sum: "표에 든 값이 늘 깨끗하지는 않다. 붙이고, 자르고, 없는 값을 채우는 함수를 쓴다.",
    body: [
      { h: "NULL 은 전염된다", t: "NULL 이 섞인 계산은 결과도 NULL 이 된다. `'가' || NULL` 은 NULL 이고, `NULL + 1` 도 NULL 이다. 그래서 붙이거나 더하기 전에 `COALESCE(값, 기본값)` 으로 채운다." },
      { h: "정수 나눗셈", t: "SQLite 에서 `7 / 2` 는 `3` 이다. 정수끼리 나누면 정수가 나온다. 소수가 필요하면 `7 * 1.0 / 2` 처럼 한쪽을 실수로 만든다 — 비율·평균 계산에서 자주 놓친다." },
    ],
    code: { c: "SELECT COALESCE(나이, 0) AS 나이 FROM 회원;\nSELECT 7 / 2;        -- 3\nSELECT 7 * 1.0 / 2;  -- 3.5", cap: "NULL 은 채우고, 나눗셈은 실수로 만든다" },
    key: ["NULL 이 섞이면 결과도 NULL", "`COALESCE(값, 기본값)` 으로 채운다", "정수끼리 나누면 정수가 나온다"],
  },
  q: [
    {
      k: "빈 나이를 0으로", cat: "debug", schema: 가게, ordered: true,
      q: "회원의 <code>이름</code> 과 나이를 보여 주되, 나이가 비어 있으면 <code>0</code> 으로 채워 주세요. 열 이름은 <code>이름</code>, <code>나이</code> 이고 id 순서입니다.",
      src: "SELECT 이름, 나이 FROM 회원 ORDER BY id;",
      sol: "SELECT 이름, COALESCE(나이, 0) AS 나이 FROM 회원 ORDER BY id;",
      ex: "빈 칸이 그대로 NULL 로 나옵니다. COALESCE 로 기본값을 채워야 해요.",
    },
    {
      k: "평균 금액을 소수로", cat: "debug", schema: 가게, ordered: true,
      q: "주문 <b>1건당 평균 금액</b>을 소수까지 보여 주세요. 열 이름은 <code>평균</code> 이고, <code>SUM</code> 과 <code>COUNT</code> 로 직접 계산합니다.",
      src: "SELECT SUM(금액) / COUNT(*) AS 평균 FROM 주문;",
      sol: "SELECT SUM(금액) * 1.0 / COUNT(*) AS 평균 FROM 주문;",
      ex: "정수끼리 나누면 소수점 아래가 잘려 나갑니다. 한쪽에 1.0 을 곱해 실수로 만들어야 해요.",
    },
  ],
},
];
