/* SQL 실습 4차 — 실습이 하나도 없던 6개 유닛을 연다.
   정규화 · 트랜잭션과 무결성 · 인덱스와 실행계획 · 뷰와 트리거 ·
   조인 재작성 · 동시성 제어.

   채점은 브라우저 안의 sql.js(진짜 SQLite)가 한다. 여러 문장을 이어 써도 되고,
   결과가 나오는 첫 문장이 채점 대상이다 — 그래서 'DDL 을 먼저 하고 마지막에 조회'
   하는 문항도 낼 수 있다.

   실행 계획을 묻는 문항은 EXPLAIN QUERY PLAN 의 출력을 그대로 견준다.
   정답과 시작 쿼리가 같은 엔진에서 돌기 때문에, 계획이 갈리면 반드시 갈린다. */

const 판매 = `CREATE TABLE 주문 (
  id INTEGER PRIMARY KEY, 손님 TEXT, 손님전화 TEXT, 상품 TEXT, 수량 INTEGER
);
INSERT INTO 주문 VALUES
  (1,'가영','010-1111','연필',2),
  (2,'가영','010-1111','지우개',1),
  -- 같은 손님인데 전화번호가 다르게 적힌 행. 갱신 이상이 이렇게 남는다.
  (3,'가영','010-9999','공책',3),
  (4,'나연','010-2222','연필',5),
  (5,'다솜','010-3333','공책',1);`;

const 정규 = `CREATE TABLE 손님 (
  id INTEGER PRIMARY KEY, 이름 TEXT, 전화 TEXT
);
INSERT INTO 손님 VALUES (1,'가영','010-1111'),(2,'나연','010-2222'),(3,'다솜','010-3333');
CREATE TABLE 주문 (
  id INTEGER PRIMARY KEY, 손님 INTEGER, 상품 TEXT, 수량 INTEGER
);
INSERT INTO 주문 VALUES (1,1,'연필',2),(2,1,'지우개',1),(3,2,'연필',5);`;

const 계좌 = `CREATE TABLE 계좌 (
  id INTEGER PRIMARY KEY, 이름 TEXT, 잔액 INTEGER CHECK (잔액 >= 0), 버전 INTEGER DEFAULT 1
);
INSERT INTO 계좌 VALUES (1,'가영',1000,1),(2,'나연',500,1);`;

const 색인 = `CREATE TABLE 직원 (
  id INTEGER PRIMARY KEY, 이름 TEXT, 부서 TEXT, 급여 INTEGER, 입사 TEXT
);
INSERT INTO 직원 VALUES
  (1,'가영','영업',5200000,'2021-03-15'),
  (2,'나연','영업',4800000,'2022-07-01'),
  (3,'다솜','개발',6100000,'2020-01-20'),
  (4,'라온','개발',5500000,'2023-02-28'),
  (5,'마루','개발',5500000,'2023-11-05'),
  (6,'바다','지원',3900000,'2024-06-10');`;

const 재고 = `CREATE TABLE 상품 (
  id INTEGER PRIMARY KEY, 이름 TEXT, 재고 INTEGER
);
INSERT INTO 상품 VALUES (1,'연필',10),(2,'공책',3);
CREATE TABLE 기록 (
  id INTEGER PRIMARY KEY, 상품 INTEGER, 이전 INTEGER, 이후 INTEGER
);
CREATE TABLE 예약 (
  손님 TEXT, 상품 INTEGER, UNIQUE(손님, 상품)
);
INSERT INTO 예약 VALUES ('가영',1);`;

module.exports = [
/* ── 데이터 모델링 - 정규화와 비정규화 ────────────────────── */
{
  unit: "데이터 모델링 - 정규화와 비정규화",
  lesson: "직접 써 보기 — 같은 사실을 한 곳에만 적기",
  th: {
    sum: "정규화는 **같은 사실을 한 곳에만 적는 것**이다. 여러 곳에 적으면 언젠가 서로 달라진다.",
    body: [
      { h: "겹쳐 적으면 어긋난다", t: "주문마다 손님 전화번호를 같이 적어 두면, 번호가 바뀔 때 모든 주문을 고쳐야 한다. 하나만 놓치면 같은 손님의 번호가 두 가지가 된다 — 어느 쪽이 맞는지 아무도 모른다." },
      { h: "따로 떼어 번호로 잇는다", t: "손님을 따로 표로 두고 주문에는 손님 번호만 적는다. 번호가 바뀌면 한 곳만 고치면 된다. 대신 붙여 보려면 조인이 필요해진다." },
      { h: "일부러 겹쳐 적기도 한다", t: "조회가 아주 잦고 값이 거의 안 바뀐다면, 조인을 없애려고 일부러 함께 적기도 한다(비정규화). 이때는 '어긋날 수 있다' 는 것을 알고 하는 것이고, 맞추는 방법도 함께 정해 둬야 한다." },
      { h: "중복은 세어 보면 보인다", t: "한 손님에게 서로 다른 값이 몇 가지 적혀 있는지 세면 어긋난 자리가 바로 나온다. `COUNT(DISTINCT ...)` 가 1보다 크면 그 손님이다." },
    ],
    code: { c: "SELECT 손님, COUNT(DISTINCT 손님전화) AS 가짓수\nFROM 주문 GROUP BY 손님\nHAVING COUNT(DISTINCT 손님전화) > 1;", cap: "어긋난 자리는 세어 보면 나온다" },
    key: ["같은 사실은 한 곳에만", "따로 떼어 번호로 잇는다", "어긋남은 `COUNT(DISTINCT)` 로"],
  },
  q: [
    {
      k: "손님 목록 뽑아내기", schema: 판매, ordered: true,
      qq: "주문 표에서 <b>손님 이름 목록</b>을 <b>겹치지 않게</b> 뽑아 주세요. 열 이름은 <code>손님</code>, 이름 오름차순입니다.",
      src: "SELECT 손님 FROM 주문 ORDER BY 손님;",
      sol: "SELECT DISTINCT 손님 FROM 주문 ORDER BY 손님;",
      ex: "주문 표에는 손님이 주문 수만큼 적혀 있습니다. 그대로 뽑으면 같은 사람이 여러 번 나와요. 따로 떼어 낼 목록을 만들 때는 겹치는 것을 먼저 없애야 합니다.",
    },
    {
      k: "어긋난 값 찾아내기", schema: 판매, ordered: true,
      qq: "같은 손님에게 <b>서로 다른 전화번호</b>가 적힌 경우를 찾아 주세요. 열 이름은 <code>손님</code>, <code>가짓수</code> 이고 손님 오름차순입니다.",
      src: "SELECT 손님, COUNT(손님전화) AS 가짓수\nFROM 주문 GROUP BY 손님\nHAVING COUNT(손님전화) > 1\nORDER BY 손님;",
      sol: "SELECT 손님, COUNT(DISTINCT 손님전화) AS 가짓수\nFROM 주문 GROUP BY 손님\nHAVING COUNT(DISTINCT 손님전화) > 1\nORDER BY 손님;",
      ex: "그냥 COUNT 는 행 수를 세기 때문에, 번호가 전부 같아도 주문이 두 건이면 걸립니다. 물어본 것은 '값이 몇 가지인가' 이니 DISTINCT 를 세어야 해요.",
    },
    {
      k: "나눈 표를 다시 붙이기", schema: 정규, ordered: true,
      qq: "손님 표와 주문 표를 이어 <code>이름</code>·<code>상품</code>·<code>수량</code>을 보여 주세요. 주문 id 순서입니다.",
      src: "SELECT c.이름, o.상품, o.수량\nFROM 손님 c JOIN 주문 o ON o.id = c.id\nORDER BY o.id;",
      sol: "SELECT c.이름, o.상품, o.수량\nFROM 손님 c JOIN 주문 o ON o.손님 = c.id\nORDER BY o.id;",
      ex: "이어 붙일 열을 잘못 고르면 엉뚱한 짝이 만들어집니다. 여기서는 주문의 '손님' 이 손님 표의 id 를 가리켜요 — 둘 다 id 라는 이름이라 특히 헷갈립니다.",
    },
  ],
},
/* ── 트랜잭션과 무결성 ────────────────────────────────────── */
{
  unit: "트랜잭션과 무결성",
  lesson: "직접 써 보기 — 전부 되거나 전부 안 되거나",
  th: {
    sum: "트랜잭션은 여러 변경을 **하나의 덩어리**로 묶는다. 중간에 멈춘 상태가 남지 않게 한다.",
    body: [
      { h: "반쯤 된 상태를 막는다", t: "이체는 한쪽에서 빼고 다른 쪽에 더하는 두 가지 일이다. 빼기만 되고 더하기가 안 되면 돈이 사라진다. 둘을 묶어 두면 함께 되거나 함께 안 된다." },
      { h: "되돌릴 수 있다", t: "`ROLLBACK` 하면 그 덩어리 안의 변경이 전부 없던 일이 된다. 검사에 걸렸을 때 앞의 변경을 손으로 되돌릴 필요가 없다 — 되돌리는 코드가 또 틀릴 자리를 없애는 것이다." },
      { h: "제약이 마지막 방어선이다", t: "코드에서 검사해도 다른 경로로 들어오는 변경이 있다. `CHECK` 나 `UNIQUE` 를 표에 걸어 두면 어디로 들어오든 막힌다. 데이터베이스가 거절하면 그 값은 절대 저장되지 않는다." },
      { h: "조건을 갱신에 넣는다", t: "'잔액이 충분하면' 을 먼저 조회해 확인하고 갱신하면, 그 사이에 값이 바뀔 수 있다. `WHERE 잔액 >= 금액` 처럼 조건을 갱신문에 넣으면 확인과 갱신이 한 번에 일어난다." },
    ],
    code: { c: "BEGIN;\nUPDATE 계좌 SET 잔액 = 잔액 - 100 WHERE id = 1 AND 잔액 >= 100;\nUPDATE 계좌 SET 잔액 = 잔액 + 100 WHERE id = 2;\nCOMMIT;", cap: "묶고, 조건을 갱신에 넣는다" },
    key: ["여러 변경을 하나로 묶는다", "`ROLLBACK` 으로 되돌린다", "조건은 갱신문 안에"],
  },
  q: [
    {
      k: "이체 · 양쪽을 함께", schema: 계좌, ordered: true,
      qq: "1번에서 2번으로 <b>100원</b>을 옮기고 결과를 보여 주세요. 열 이름은 <code>id</code>, <code>잔액</code> 이고 id 순서입니다.",
      src: "BEGIN;\nUPDATE 계좌 SET 잔액 = 잔액 - 100 WHERE id = 1;\nCOMMIT;\nSELECT id, 잔액 FROM 계좌 ORDER BY id;",
      sol: "BEGIN;\nUPDATE 계좌 SET 잔액 = 잔액 - 100 WHERE id = 1;\nUPDATE 계좌 SET 잔액 = 잔액 + 100 WHERE id = 2;\nCOMMIT;\nSELECT id, 잔액 FROM 계좌 ORDER BY id;",
      ex: "빼기만 하고 더하기를 안 하면 돈이 사라집니다. 이체는 두 가지 일이 하나로 묶여야 하는 대표적인 예예요 — 하나만 되는 상태가 남으면 안 됩니다.",
    },
    {
      k: "되돌리기 · 없던 일로", schema: 계좌, ordered: true,
      qq: "잔액을 0으로 바꿨다가 <b>되돌려</b>, 원래 값이 그대로 남게 하세요. 열 이름은 <code>id</code>, <code>잔액</code> 이고 id 순서입니다.",
      src: "BEGIN;\nUPDATE 계좌 SET 잔액 = 0;\nCOMMIT;\nSELECT id, 잔액 FROM 계좌 ORDER BY id;",
      sol: "BEGIN;\nUPDATE 계좌 SET 잔액 = 0;\nROLLBACK;\nSELECT id, 잔액 FROM 계좌 ORDER BY id;",
      ex: "COMMIT 은 '이대로 확정' 이라는 뜻입니다. 되돌리려면 ROLLBACK 이어야 해요 — 확정한 뒤에 손으로 되돌리려 하면 그 코드가 또 틀릴 자리가 됩니다.",
    },
    {
      k: "조건을 갱신에 넣기", schema: 계좌, ordered: true,
      qq: "2번 계좌에서 <b>1000원</b>을 빼되, <b>잔액이 모자라면 아무 일도 없어야</b> 합니다. 열 이름은 <code>id</code>, <code>잔액</code> 이고 id 순서입니다.",
      src: "UPDATE 계좌 SET 잔액 = 잔액 - 1000 WHERE id = 2;\nSELECT id, 잔액 FROM 계좌 ORDER BY id;",
      sol: "UPDATE 계좌 SET 잔액 = 잔액 - 1000 WHERE id = 2 AND 잔액 >= 1000;\nSELECT id, 잔액 FROM 계좌 ORDER BY id;",
      ex: "조건 없이 빼면 잔액이 음수가 되려다 CHECK 에 걸려 쿼리 전체가 오류로 끝납니다. 조건을 갱신문에 넣으면 해당 행이 없어 아무 일도 안 일어나고, 확인과 갱신이 한 번에 이뤄져요.",
    },
  ],
},
/* ── 인덱스와 실행계획 ────────────────────────────────────── */
{
  unit: "인덱스와 실행계획",
  lesson: "직접 써 보기 — 계획을 눈으로 보고 고치기",
  th: {
    sum: "`EXPLAIN QUERY PLAN` 은 **어떻게 찾을 작정인지** 보여 준다. 짐작 대신 이걸 본다.",
    body: [
      { h: "SCAN 과 SEARCH", t: "계획에 `SCAN` 이 보이면 표를 처음부터 다 훑는다는 뜻이고, `SEARCH ... USING INDEX` 는 인덱스로 바로 찾아간다는 뜻이다. 어느 쪽인지가 속도를 가른다." },
      { h: "만들었다고 반드시 쓰이지는 않는다", t: "조건 모양이 맞지 않으면 인덱스가 있어도 무시된다. 그래서 만든 뒤에는 계획을 다시 봐야 한다 — 안 보면 쓰이지도 않는 인덱스를 믿고 넘어간다." },
      { h: "열을 감싸면 인덱스가 죽는다", t: "`WHERE substr(입사,1,4) = '2023'` 처럼 열을 함수로 감싸면, 미리 정렬해 둔 것이 소용없어져 다 훑는다. 열은 그대로 두고 범위로 바꾸면 인덱스가 산다." },
      { h: "필요한 열이 인덱스에 다 있으면", t: "조회하는 열까지 인덱스 안에 들어 있으면 원본 표를 볼 필요가 없다. 계획에 `COVERING INDEX` 라고 나오는 경우다 — 훨씬 적게 읽는다." },
    ],
    code: { c: "EXPLAIN QUERY PLAN\nSELECT 이름 FROM 직원 WHERE 부서 = '개발';\n-- SCAN 직원            (인덱스 없음)\n-- SEARCH 직원 USING INDEX ...  (있음)", cap: "짐작 대신 계획을 본다" },
    key: ["`SCAN` 은 다 훑기", "만든 뒤 계획을 다시 본다", "열을 감싸면 인덱스가 죽는다"],
  },
  q: [
    {
      k: "인덱스를 만들어 바로 찾게", schema: 색인, ordered: true,
      qq: "<code>부서</code>로 찾는 조회가 <b>표를 다 훑지 않게</b> 인덱스를 만들고, 그 <b>실행 계획</b>을 보여 주세요.",
      src: "EXPLAIN QUERY PLAN\nSELECT 이름 FROM 직원 WHERE 부서 = '개발';",
      sol: "CREATE INDEX ix_부서 ON 직원(부서);\nEXPLAIN QUERY PLAN\nSELECT 이름 FROM 직원 WHERE 부서 = '개발';",
      ex: "인덱스가 없으면 계획에 SCAN 이 나옵니다 — 표를 처음부터 끝까지 훑는다는 뜻이에요. 인덱스를 만들면 SEARCH ... USING INDEX 로 바뀌어 해당 값이 있는 자리로 바로 갑니다.",
    },
    {
      k: "열을 감싸지 않기", schema: 색인, ordered: true,
      qq: "2023년에 입사한 사람을 찾되, <b>인덱스가 쓰이도록</b> 조건을 <b>범위</b>로 바꾸고 실행 계획을 보여 주세요.",
      src: "CREATE INDEX ix_입사 ON 직원(입사);\nEXPLAIN QUERY PLAN\nSELECT 이름 FROM 직원 WHERE substr(입사, 1, 4) = '2023';",
      sol: "CREATE INDEX ix_입사 ON 직원(입사);\nEXPLAIN QUERY PLAN\nSELECT 이름 FROM 직원 WHERE 입사 >= '2023-01-01' AND 입사 < '2024-01-01';",
      ex: "열을 함수로 감싸면 미리 정렬해 둔 것을 쓸 수 없어 결국 다 훑습니다. 같은 뜻을 범위로 바꿔 쓰면 결과는 같고 계획만 달라져요 — 열은 그대로 두는 것이 규칙입니다.",
    },
    {
      k: "필요한 열을 인덱스에 담기", schema: 색인, ordered: true,
      qq: "부서로 찾아 <b>급여만</b> 읽는 조회가 <b>원본 표를 보지 않아도 되게</b> 인덱스를 만들고, 실행 계획을 보여 주세요.",
      src: "CREATE INDEX ix_부서 ON 직원(부서);\nEXPLAIN QUERY PLAN\nSELECT 급여 FROM 직원 WHERE 부서 = '개발';",
      sol: "CREATE INDEX ix_부서_급여 ON 직원(부서, 급여);\nEXPLAIN QUERY PLAN\nSELECT 급여 FROM 직원 WHERE 부서 = '개발';",
      ex: "부서만 담은 인덱스로는 자리를 찾은 뒤 급여를 읽으러 원본 표를 또 봐야 합니다. 급여까지 인덱스에 넣으면 인덱스만 보고 답이 나와요 — 계획에 COVERING 이라고 찍힙니다.",
    },
  ],
},
/* ── 뷰·프로시저·트리거 ───────────────────────────────────── */
{
  unit: "뷰·프로시저·트리거",
  lesson: "직접 써 보기 — 이름을 붙여 두고 자동으로 남기기",
  th: {
    sum: "**뷰**는 조회에 이름을 붙인 것이고, **트리거**는 어떤 변경이 일어날 때 자동으로 실행되는 것이다.",
    body: [
      { h: "뷰는 저장된 조회다", t: "복잡한 조회에 이름을 붙여 두면 여러 곳에서 표처럼 쓸 수 있다. 규칙이 한 곳에만 있으니, 기준이 바뀌어도 뷰만 고치면 된다." },
      { h: "보여 줄 것만 보여 준다", t: "민감한 열을 뺀 뷰를 만들어 그것만 쓰게 하면, 실수로 그 열을 조회할 방법 자체가 없어진다. 권한을 뷰 단위로 주는 것이 이래서 편하다." },
      { h: "트리거는 잊지 않는다", t: "재고가 바뀔 때마다 기록을 남기는 일을 코드에 넣으면, 다른 경로로 들어온 변경에서는 빠진다. 트리거로 두면 어디로 들어오든 반드시 남는다." },
      { h: "대신 눈에 안 보인다", t: "트리거는 쿼리 어디에도 안 적혀 있는데 실행된다. 그래서 '왜 이 행이 생겼지' 를 한참 찾게 될 수 있다. 꼭 필요한 것만 두고, 있다는 사실을 문서에 남긴다." },
    ],
    code: { c: "CREATE VIEW 공개주문 AS SELECT id, 상품, 수량 FROM 주문;\n\nCREATE TRIGGER 재고기록 AFTER UPDATE ON 상품\nBEGIN INSERT INTO 기록(상품, 이전, 이후) VALUES (old.id, old.재고, new.재고); END;", cap: "이름을 붙이고, 자동으로 남긴다" },
    key: ["뷰는 저장된 조회", "뷰로 보여 줄 것만", "트리거는 잊지 않는다"],
  },
  q: [
    {
      k: "뷰 · 민감한 열 빼고 보여 주기", schema: 판매, ordered: true,
      qq: "전화번호를 <b>뺀</b> 뷰 <code>공개주문</code>을 만들고 그 내용을 보여 주세요. 열은 <code>id</code>, <code>손님</code>, <code>상품</code>, <code>수량</code> 이고 id 순서입니다.",
      src: "CREATE VIEW 공개주문 AS SELECT id, 손님, 손님전화, 상품, 수량 FROM 주문;\nSELECT * FROM 공개주문 ORDER BY id;",
      sol: "CREATE VIEW 공개주문 AS SELECT id, 손님, 상품, 수량 FROM 주문;\nSELECT * FROM 공개주문 ORDER BY id;",
      ex: "뷰에 민감한 열을 그대로 두면, 뷰를 만든 의미가 없습니다. 뺀 뷰만 쓰게 하면 실수로 그 열을 조회할 방법 자체가 없어져요.",
    },
    {
      k: "트리거 · 바뀔 때마다 남기기", schema: 재고, ordered: true,
      qq: "재고가 바뀔 때 <code>기록</code> 표에 <b>이전·이후 값</b>이 남게 하세요. 그다음 연필 재고를 <code>7</code>로 바꾸고 기록을 보여 줍니다. 열은 <code>상품</code>, <code>이전</code>, <code>이후</code> 입니다.",
      src: "UPDATE 상품 SET 재고 = 7 WHERE id = 1;\nSELECT 상품, 이전, 이후 FROM 기록 ORDER BY id;\nSELECT 1;",
      sol: "CREATE TRIGGER 재고기록 AFTER UPDATE ON 상품\nBEGIN\n  INSERT INTO 기록(상품, 이전, 이후) VALUES (old.id, old.재고, new.재고);\nEND;\nUPDATE 상품 SET 재고 = 7 WHERE id = 1;\nSELECT 상품, 이전, 이후 FROM 기록 ORDER BY id;",
      ex: "기록을 코드에서 남기면 다른 경로로 들어온 변경에서는 빠집니다. 트리거로 두면 어느 쿼리로 바꾸든 반드시 남아요 — 대신 쿼리에 안 적혀 있으니 있다는 사실을 문서에 남겨야 합니다.",
    },
    {
      k: "뷰 · 기준을 한 곳에", schema: 색인, ordered: true,
      qq: "<b>급여 550만 이상</b>인 직원만 담은 뷰 <code>고액</code>을 만들고 이름을 보여 주세요. 열 이름은 <code>이름</code>, id 순서입니다.",
      src: "CREATE VIEW 고액 AS SELECT id, 이름 FROM 직원 WHERE 급여 > 5500000;\nSELECT 이름 FROM 고액 ORDER BY id;",
      sol: "CREATE VIEW 고액 AS SELECT id, 이름 FROM 직원 WHERE 급여 >= 5500000;\nSELECT 이름 FROM 고액 ORDER BY id;",
      ex: "'이상' 은 그 값을 포함합니다. 딱 550만인 사람이 빠지는데, 뷰를 쓰는 모든 화면에서 똑같이 빠져요 — 기준이 한 곳에 있다는 것은 틀렸을 때도 한 곳에서 다 틀린다는 뜻입니다.",
    },
  ],
},
/* ── 조인 최적화와 쿼리 재작성 ────────────────────────────── */
{
  unit: "조인 최적화와 쿼리 재작성",
  lesson: "직접 써 보기 — 붙이는 순서와 자리",
  th: {
    sum: "같은 결과를 내는 쿼리도 **어디에 조건을 두느냐**로 결과와 속도가 달라진다.",
    body: [
      { h: "LEFT JOIN 의 조건 자리", t: "짝이 없는 행도 남기려고 `LEFT JOIN` 을 썼는데, 오른쪽 표의 조건을 `WHERE` 에 두면 그 행들이 다시 걸러진다. 결국 안쪽 조인과 같아진다 — 조건을 `ON` 에 두어야 남는다." },
      { h: "먼저 줄이고 붙인다", t: "붙인 뒤에 거르면 버릴 행까지 전부 짝을 지어 놓고 버리는 셈이다. 먼저 조건으로 줄인 다음 붙이면 짝지을 양 자체가 줄어든다. 결과는 같은데 하는 일이 다르다." },
      { h: "조인은 행을 불린다", t: "한 사람에게 주문이 셋이면 조인 결과에 그 사람이 세 번 나온다. 그대로 세면 사람 수가 부풀려진다. 세기 전에 묶거나, 미리 집계한 뒤에 붙인다." },
      { h: "결과가 같은지 먼저 확인한다", t: "쿼리를 다시 쓸 때는 빨라지기 전에 **같은 답인지**부터 본다. 행 수만 같고 내용이 다른 경우가 흔하다 — 속도를 위해 답을 바꾸면 아무 의미가 없다." },
    ],
    code: { c: "-- 짝 없는 행을 남기려면 ON 에\nFROM 손님 c LEFT JOIN 주문 o ON o.손님 = c.id AND o.상품 = '연필'", cap: "조건의 자리가 결과를 바꾼다" },
    key: ["`LEFT JOIN` 조건은 `ON` 에", "먼저 줄이고 붙인다", "조인은 행을 불린다"],
  },
  q: [
    {
      k: "짝이 없는 손님도 남기기", schema: 정규, ordered: true,
      qq: "<b>모든 손님</b>과 그 손님의 <b>연필 주문 수량</b>을 보여 주세요. 연필을 안 산 손님도 <b>남아야</b> 합니다. 열 이름은 <code>이름</code>, <code>수량</code> 이고 손님 id 순서입니다.",
      src: "SELECT c.이름, o.수량\nFROM 손님 c LEFT JOIN 주문 o ON o.손님 = c.id\nWHERE o.상품 = '연필'\nORDER BY c.id;",
      sol: "SELECT c.이름, o.수량\nFROM 손님 c LEFT JOIN 주문 o ON o.손님 = c.id AND o.상품 = '연필'\nORDER BY c.id;",
      ex: "WHERE 에 오른쪽 표 조건을 두면, 짝이 없어 NULL 이 된 행들이 그 조건에 걸려 사라집니다. LEFT JOIN 을 쓴 의미가 없어져요 — 남기려면 조건을 ON 에 둡니다.",
    },
    {
      k: "사람 수를 부풀리지 않기", schema: 정규, ordered: true,
      qq: "주문이 <b>한 건이라도 있는 손님이 몇 명</b>인지 세 주세요. 열 이름은 <code>인원</code> 입니다.",
      src: "SELECT COUNT(*) AS 인원\nFROM 손님 c JOIN 주문 o ON o.손님 = c.id;",
      sol: "SELECT COUNT(DISTINCT c.id) AS 인원\nFROM 손님 c JOIN 주문 o ON o.손님 = c.id;",
      ex: "조인하면 주문이 셋인 손님은 세 줄이 됩니다. 그대로 세면 사람 수가 아니라 주문 수를 센 셈이에요 — 물어본 것이 무엇인지에 따라 무엇을 셀지가 달라집니다.",
    },
    {
      k: "미리 묶고 붙이기", schema: 정규, ordered: true,
      qq: "손님마다 <b>주문 건수</b>를 보여 주세요. 주문이 없으면 <code>0</code> 입니다. 열 이름은 <code>이름</code>, <code>건수</code> 이고 손님 id 순서입니다.",
      src: "SELECT c.이름, COUNT(*) AS 건수\nFROM 손님 c LEFT JOIN 주문 o ON o.손님 = c.id\nGROUP BY c.id\nORDER BY c.id;",
      sol: "SELECT c.이름, COUNT(o.id) AS 건수\nFROM 손님 c LEFT JOIN 주문 o ON o.손님 = c.id\nGROUP BY c.id\nORDER BY c.id;",
      ex: "COUNT(*) 는 행 수를 세는데, 짝이 없는 손님도 NULL 이 붙은 행 하나로 남아 1이 됩니다. COUNT(열) 은 그 열이 비어 있지 않은 행만 세니 0이 나와요.",
    },
  ],
},
/* ── 동시성 제어와 트랜잭션 격리 ──────────────────────────── */
{
  unit: "동시성 제어와 트랜잭션 격리",
  lesson: "직접 써 보기 — 동시에 고칠 때 지키는 법",
  th: {
    sum: "여럿이 같은 행을 고치면 **나중에 쓴 것만 남는다.** 그래서 조건을 함께 걸어야 한다.",
    body: [
      { h: "읽고 고치면 그 사이가 위험하다", t: "값을 읽어 계산한 뒤 그 결과를 쓰면, 읽은 뒤 쓰기 전에 남이 고쳤을 수 있다. 내가 쓴 값이 남의 변경을 덮어써 조용히 사라진다 — 잃어버린 갱신이다." },
      { h: "데이터베이스에게 계산을 맡긴다", t: "`SET 재고 = 재고 - 1` 처럼 쓰면 읽기와 쓰기가 한 번에 일어난다. 밖에서 읽어 계산한 값을 넣는 것과 결과가 달라진다 — 동시에 들어와도 둘 다 반영된다." },
      { h: "버전을 함께 견준다", t: "행에 버전을 두고 `WHERE 버전 = 읽은버전` 으로 갱신하면, 그사이 남이 고쳤을 때 아무 행도 안 바뀐다. 실패했다는 것을 알 수 있으니 다시 읽고 다시 시도하면 된다." },
      { h: "중복은 표가 막게 한다", t: "'이미 있나' 를 조회로 확인한 뒤 넣으면 그 사이에 남이 넣을 수 있다. `UNIQUE` 를 걸어 두면 데이터베이스가 거절하므로 확인과 삽입이 한 번에 끝난다." },
    ],
    code: { c: "UPDATE 상품 SET 재고 = 재고 - 1 WHERE id = 1 AND 재고 > 0;\nUPDATE 계좌 SET 잔액 = 0 WHERE id = 1 AND 버전 = 1;", cap: "확인과 갱신을 한 번에" },
    key: ["읽고 고치는 사이가 위험하다", "계산을 갱신문 안에서", "버전을 함께 견준다"],
  },
  q: [
    {
      k: "재고 줄이기 · 계산을 안에서", schema: 재고, ordered: true,
      qq: "연필 재고를 <b>1 줄이세요</b>. 밖에서 읽은 값을 넣지 말고 <b>지금 값에서 빼야</b> 합니다. 결과는 <code>id</code>, <code>재고</code> 이고 id 순서입니다.",
      src: "UPDATE 상품 SET 재고 = 9 WHERE id = 1;\nUPDATE 상품 SET 재고 = 9 WHERE id = 1;\nSELECT id, 재고 FROM 상품 ORDER BY id;",
      sol: "UPDATE 상품 SET 재고 = 재고 - 1 WHERE id = 1;\nUPDATE 상품 SET 재고 = 재고 - 1 WHERE id = 1;\nSELECT id, 재고 FROM 상품 ORDER BY id;",
      ex: "밖에서 읽은 값(9)을 그대로 넣으면, 두 번 실행해도 9 그대로입니다. 한 번의 차감이 통째로 사라진 거예요. 지금 값에서 빼면 두 번 들어와도 둘 다 반영됩니다.",
    },
    {
      k: "버전으로 덮어쓰기 막기", schema: 계좌, ordered: true,
      qq: "1번 계좌를 <b>버전 1일 때만</b> 잔액 0으로 바꾸세요. 아래 두 번째 갱신은 <b>이미 버전이 올라가 실패해야</b> 합니다. 결과는 <code>id</code>, <code>잔액</code>, <code>버전</code> 이고 id 순서입니다.",
      src: "UPDATE 계좌 SET 잔액 = 0, 버전 = 버전 + 1 WHERE id = 1;\nUPDATE 계좌 SET 잔액 = 777 WHERE id = 1;\nSELECT id, 잔액, 버전 FROM 계좌 ORDER BY id;",
      sol: "UPDATE 계좌 SET 잔액 = 0, 버전 = 버전 + 1 WHERE id = 1 AND 버전 = 1;\nUPDATE 계좌 SET 잔액 = 777 WHERE id = 1 AND 버전 = 1;\nSELECT id, 잔액, 버전 FROM 계좌 ORDER BY id;",
      ex: "버전을 안 보면 나중에 온 갱신이 앞의 변경을 그대로 덮어씁니다. 버전을 함께 견주면 그사이 값이 바뀐 경우 아무 행도 안 바뀌어, 실패했다는 것을 알고 다시 시도할 수 있어요.",
    },
    {
      k: "중복은 표가 막게", schema: 재고, ordered: true,
      qq: "<code>('가영', 1)</code> 예약을 <b>다시 넣어도 오류 없이</b> 지나가게 하고, 예약 목록을 보여 주세요. 열 이름은 <code>손님</code>, <code>상품</code> 입니다.",
      src: "INSERT INTO 예약 (손님, 상품) VALUES ('가영', 1);\nSELECT 손님, 상품 FROM 예약;",
      sol: "INSERT OR IGNORE INTO 예약 (손님, 상품) VALUES ('가영', 1);\nSELECT 손님, 상품 FROM 예약;",
      ex: "이미 있는 값을 그냥 넣으면 UNIQUE 에 걸려 쿼리 전체가 오류로 끝납니다. '있으면 넘어간다' 고 적어 두면 확인과 삽입이 한 번에 끝나고, 그 사이에 남이 넣어도 안전해요.",
    },
  ],
},
];
