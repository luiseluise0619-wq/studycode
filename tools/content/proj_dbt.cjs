/* DB 이론 트랙 전용 프로젝트 — 느려진 조회 하나를 끝까지 판다.
   실행 계획 · 인덱스 · 잠금 · 격리 수준은 따로 배우면 흩어지지만,
   '왜 이 조회가 3초 걸리는가' 를 쫓으면 한 줄에 꿰인다. */
module.exports = {
  lv: 3, em: "🗂️",
  title: "조회 하나가 3초 걸린다",
  desc: "실행 계획을 읽어 병목을 찾고, 인덱스를 설계하고, 잠금과 격리 수준까지 내려가 느려진 원인을 구조로 고친다",
  /* projectForTrack 은 dbt 트랙을 TRACK_ALIAS 로 "database" 에 맞춘다.
     skills[0] 을 그 이름으로 두어야 이 트랙의 전용 프로젝트로 잡힌다. */
  skills: ["database", "sql", "backend"],
  phases: [

  { t: "무엇이 느린지 숫자로 적는다", type: "note",
    goal: "'느리다' 대신 <b>어떤 조회가, 어떤 조건에서, 얼마나</b> 느린지 적으세요.\n호출 빈도와 데이터 규모도 함께 적습니다. 하루 한 번 도는 3초와 초당 백 번 도는 300ms 는 완전히 다른 문제입니다.",
    ph: "예: 주문 목록 조회 p95 3.1초 · 초당 40회 · orders 1,200만 행 · 조건은 고객ID + 기간 + 상태 · 정렬은 주문일 내림차순 · 페이지 20개씩 · 최근 3개월 조회가 90%" },

  { t: "무엇부터 볼 것인가", type: "decide",
    goal: "조회가 느립니다. 팀에서 여러 제안이 나왔습니다.",
    sit: "어디서부터 시작하시겠습니까?",
    opts: [
      { label: "실행 계획을 실제 수행 통계와 함께 뽑아 어느 단계가 오래 걸리는지 본다",
        fx: { database: 3, debugging: 2 },
        fb: "✅ <b>재는 것이 먼저</b>입니다. 추정 계획만 보면 옵티마이저의 짐작을 보는 것이고, 실제 수행 통계까지 붙여야 <b>예상 행 수와 실제 행 수의 차이</b>가 드러납니다. 그 차이가 크면 통계가 낡았거나 조건이 옵티마이저에게 보이지 않는 것이라, 인덱스보다 그쪽이 먼저입니다.",
        best: true },
      { label: "조건에 쓰인 컬럼마다 인덱스를 하나씩 만든다",
        fx: { database: -2, performance: -1 },
        fb: "⚠️ 인덱스는 공짜가 아닙니다. 쓰기마다 함께 갱신되고 저장 공간도 늡니다. 무엇보다 <b>여러 개를 따로 만드는 것보다 잘 고른 복합 인덱스 하나</b>가 대개 낫습니다. 재 보지 않고 만들면 안 쓰이는 인덱스만 쌓입니다." },
      { label: "데이터베이스 인스턴스 사양을 올린다",
        fx: { database: -2, system_design: -1 },
        fb: "⚠️ 전체 스캔을 더 빠른 기계로 하는 것일 뿐입니다. 데이터가 두 배가 되면 다시 느려지고, 그때는 사양으로 감당할 수 없습니다. <b>알고리즘이 바뀌지 않으면 규모가 문제를 되돌립니다.</b>" },
      { label: "조회 결과를 캐시에 담아 두고 다시 쓴다",
        fx: { database: -1, system_design: -1 },
        fb: "⚠️ 효과는 있지만 원인을 덮습니다. 조건이 사람마다 달라 적중률이 낮을 수 있고, 무효화 규칙이라는 새 문제가 생깁니다. <b>느린 이유를 안 뒤에</b> 캐시를 얹을지 정하는 것이 순서입니다." }] },

  { t: "실행 계획을 읽는다", type: "build",
    goal: "실제 수행 통계를 붙여 계획을 뽑고, <b>예상 행 수와 실제 행 수</b>를 견주세요.\n어느 단계에서 시간이 가장 오래 걸리는지, 전체 스캔이 있는지 표시합니다.",
    hint: "예상과 실제가 열 배 이상 벌어지면 통계가 낡았거나 조건 표현이 인덱스를 못 쓰게 만든 것입니다. 정렬 단계가 디스크를 쓰고 있다면 작업 메모리가 모자란 것이고, 이때는 인덱스 순서로 정렬을 없애는 편이 낫습니다.",
    acc: "계획에서 가장 오래 걸리는 단계와 예상·실제 행 수 차이를 짚어 냈고, 전체 스캔 여부를 확인했으면 완료입니다.",
    lang: "sql",
    sol: "-- 추정이 아니라 실제로 돌린 통계를 함께 본다\nEXPLAIN (ANALYZE, BUFFERS, VERBOSE)\nSELECT o.id, o.ordered_at, o.status, o.total\n  FROM orders o\n WHERE o.customer_id = 40213\n   AND o.ordered_at >= now() - interval '3 months'\n   AND o.status = 'PAID'\n ORDER BY o.ordered_at DESC\n LIMIT 20;\n\n-- 읽을 때 보는 것\n--   rows=예상  actual rows=실제   → 열 배 이상 벌어지면 통계부터 의심\n--   Seq Scan on orders             → 전체 스캔. 1,200만 행이면 여기서 끝난다\n--   Sort ... Sort Method: external merge  Disk: 48MB\n--                                  → 정렬이 디스크로 넘어갔다\n--   Buffers: shared read=...       → 캐시에 없어 디스크에서 읽은 양\n\n-- 통계가 낡았는지 먼저 확인한다\nSELECT last_analyze, last_autoanalyze, n_live_tup, n_dead_tup\n  FROM pg_stat_user_tables\n WHERE relname = 'orders';\n\n-- 낡았으면 갱신하고 다시 잰다. 인덱스는 그다음이다\nANALYZE orders;" },

  { t: "인덱스를 설계한다", type: "build",
    goal: "조건과 정렬을 함께 감당하는 <b>복합 인덱스</b>를 만드세요.\n컬럼 순서에는 이유가 있어야 합니다 — 왜 그 순서인지 주석으로 적습니다.",
    hint: "같음 비교(=)로 걸리는 컬럼을 앞에, 범위 비교(&gt;, &lt;)를 뒤에 둡니다. 범위 컬럼 뒤의 컬럼은 정렬에 쓰이지 못합니다. 조회하는 컬럼까지 인덱스에 담으면 테이블을 보지 않고 끝나는 <b>커버링 인덱스</b>가 됩니다.",
    acc: "만든 인덱스가 실행 계획에 쓰이고, 정렬 단계가 사라지거나 크게 줄었으며, 응답 시간이 재어져 있으면 완료입니다.",
    lang: "sql",
    sol: "-- 같음 조건 → 범위 조건 → 정렬 순서로 놓는다\n--   customer_id, status : = 로 걸린다   → 앞\n--   ordered_at          : 범위이자 정렬 → 뒤, 정렬 방향까지 맞춘다\nCREATE INDEX CONCURRENTLY idx_orders_cust_status_at\n    ON orders (customer_id, status, ordered_at DESC);\n\n-- 조회하는 컬럼을 담아 두면 테이블을 다시 보지 않는다(커버링)\nCREATE INDEX CONCURRENTLY idx_orders_cover\n    ON orders (customer_id, status, ordered_at DESC)\n INCLUDE (total);\n\n-- 최근 3개월 조회가 90% 라면 부분 인덱스가 훨씬 작고 빠르다\n-- (주의: 조건이 고정 시각이면 시간이 지나며 쓸모없어진다)\nCREATE INDEX CONCURRENTLY idx_orders_recent_paid\n    ON orders (customer_id, ordered_at DESC)\n WHERE status = 'PAID';\n\n-- 다시 재고, 실제로 쓰이는지 확인한다\nEXPLAIN (ANALYZE) SELECT ... ;\n\n-- 안 쓰이는 인덱스는 쓰기 비용만 만든다 — 정기적으로 확인해 지운다\nSELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))\n  FROM pg_stat_user_indexes\n WHERE relname = 'orders'\n ORDER BY idx_scan;" },

  { t: "페이지를 어떻게 넘길 것인가", type: "decide",
    goal: "목록을 20개씩 나눠 보여 줍니다. 뒤쪽 페이지로 갈수록 눈에 띄게 느려집니다.",
    sit: "어떻게 바꾸시겠습니까?",
    opts: [
      { label: "마지막으로 본 값을 기준으로 그다음부터 읽는다",
        fx: { database: 3, performance: 3 },
        fb: "✅ <b>커서 방식</b>입니다. `WHERE (ordered_at, id) < (마지막값, 마지막id)` 처럼 두면 몇 번째 페이지든 같은 비용으로 읽습니다. 정렬 키에 <b>고유한 값을 함께 묶어</b> 동점에서도 순서가 흔들리지 않게 하는 것이 요점입니다. 다만 '5페이지로 바로 가기' 는 못 합니다.",
        best: true },
      { label: "건너뛰는 개수를 늘려 가며 읽는다",
        fx: { performance: -3, database: -1 },
        fb: "⚠️ 지금 방식이고, 그것이 원인입니다. 1000번째 페이지를 보려면 앞의 2만 행을 <b>읽고 버려야</b> 합니다. 뒤로 갈수록 선형으로 느려지는 구조입니다." },
      { label: "한 페이지에 담는 개수를 늘려 페이지 수를 줄인다",
        fx: { performance: -1 },
        fb: "⚠️ 페이지 수는 줄지만 <b>건너뛰는 비용은 그대로</b>입니다. 게다가 한 번에 보내는 양이 늘어 응답이 커지고 화면도 무거워집니다." },
      { label: "전체 결과를 미리 계산해 임시 테이블에 담아 둔다",
        fx: { database: -1, system_design: -2 },
        fb: "⚠️ 조건이 사람마다 다르면 사용자 수만큼 임시 테이블이 생깁니다. 정리 시점과 최신성 문제까지 새로 생겨, 대개 커서 방식보다 훨씬 비쌉니다." }] },

  { t: "커서 방식으로 바꾼다", type: "build",
    goal: "건너뛰기 대신 <b>마지막으로 본 값</b>을 받아 그다음부터 읽도록 바꾸세요.\n정렬 키에 고유 컬럼을 묶어 동점에서도 순서가 정해지게 합니다.",
    hint: "정렬 키가 겹칠 수 있으면 페이지 경계에서 행이 빠지거나 겹칩니다. `(ordered_at, id)` 처럼 마지막에 고유 컬럼을 붙이면 사라집니다. 인덱스도 같은 순서로 만들어야 이 비교가 인덱스를 탑니다.",
    acc: "첫 페이지와 1000번째 페이지의 응답 시간이 비슷하고, 페이지 경계에서 빠지거나 겹치는 행이 없으면 완료입니다.",
    lang: "sql",
    sol: "-- 이전 방식 — 뒤로 갈수록 읽고 버리는 양이 는다\n-- SELECT ... ORDER BY ordered_at DESC LIMIT 20 OFFSET 20000;\n\n-- 커서 방식 — 마지막으로 본 (시각, id) 다음부터 읽는다\nSELECT o.id, o.ordered_at, o.status, o.total\n  FROM orders o\n WHERE o.customer_id = 40213\n   AND o.status = 'PAID'\n   AND (o.ordered_at, o.id) < (:last_at, :last_id)   -- 튜플 비교\n ORDER BY o.ordered_at DESC, o.id DESC\n LIMIT 20;\n\n-- 인덱스도 같은 순서라야 이 비교가 인덱스를 탄다\nCREATE INDEX CONCURRENTLY idx_orders_cursor\n    ON orders (customer_id, status, ordered_at DESC, id DESC);\n\n-- 다음 페이지 토큰은 마지막 행의 (ordered_at, id) 를 담아 내려보낸다.\n-- 값을 그대로 노출하기 싫으면 부호를 붙여 인코딩한다.\n\n-- 총 개수는 따로 다룬다 — 매번 세면 그것이 다시 전체 스캔이다\n--   · 정확한 수가 필요 없으면 '20개 이상' 만 보여 준다\n--   · 필요하면 추정치를 쓴다\nSELECT reltuples::bigint AS approx_rows\n  FROM pg_class WHERE relname = 'orders';" },

  { t: "쓰기가 서로를 기다린다", type: "decide",
    goal: "주문 상태를 바꾸는 처리에서 잠금 대기가 늘고, 가끔 데드락이 납니다.",
    sit: "무엇부터 하시겠습니까?",
    opts: [
      { label: "트랜잭션이 건드리는 순서를 통일하고 트랜잭션을 짧게 줄인다",
        fx: { database: 3, system_design: 2, debugging: 1 },
        fb: "✅ 데드락은 <b>서로 다른 순서로 같은 자원을 잡을 때</b> 생깁니다. 순서를 한 방향으로 통일하면 원리적으로 사라집니다. 그리고 트랜잭션 안에서 외부 호출이나 사람의 확인을 기다리지 않게 하면 <b>잠금을 쥐고 있는 시간</b>이 크게 줍니다.",
        best: true },
      { label: "격리 수준을 가장 낮게 내려 잠금을 줄인다",
        fx: { database: -2, security: -1 },
        fb: "⚠️ 대기는 줄지만 <b>읽으면 안 되는 중간 상태</b>가 보이기 시작합니다. 잔액이나 재고에서 이 선택은 곧 사고입니다. 격리 수준은 성능 손잡이가 아니라 정확성의 약속입니다." },
      { label: "데드락이 나면 자동으로 재시도하도록 감싼다",
        fx: { database: 1, debugging: -1 },
        fb: "⚠️ 재시도는 필요합니다 — 데드락은 완전히 없앨 수 없기 때문입니다. 다만 <b>그것만</b> 하면 원인이 남아 부하가 늘수록 재시도도 늡니다. 순서 통일이 먼저이고 재시도는 그 위의 안전망입니다." },
      { label: "잠금 대기 시간 상한을 늘려 기다리게 한다",
        fx: { performance: -2, database: -1 },
        fb: "⚠️ 오류는 줄지만 <b>기다리는 요청이 쌓입니다.</b> 연결이 고갈되면 멀쩡하던 조회까지 함께 막혀, 좁은 문제가 서비스 전체로 번집니다." }] },

  { t: "잠금 순서를 통일한다", type: "build",
    goal: "여러 행을 함께 바꾸는 처리에서 <b>언제나 같은 순서</b>로 잠그도록 고치세요.\n트랜잭션 안에서 외부 호출을 하지 않도록 경계도 정리합니다.",
    hint: "`ORDER BY id FOR UPDATE` 처럼 정해진 순서로 잠그면 서로 엇갈릴 일이 없습니다. 기다리지 않고 즉시 실패시키고 싶으면 `NOWAIT`, 건너뛰려면 `SKIP LOCKED` 를 씁니다 — 작업 큐를 테이블로 만들 때 유용합니다.",
    acc: "같은 두 행을 반대 순서로 건드리는 두 트랜잭션을 동시에 돌려도 데드락이 나지 않으면 완료입니다.",
    lang: "sql",
    sol: "BEGIN;\n\n-- 언제나 id 오름차순으로 잠근다 — 순서가 같으면 엇갈리지 않는다\nSELECT id, balance\n  FROM accounts\n WHERE id IN (:from_id, :to_id)\n ORDER BY id            -- 이 한 줄이 데드락을 없앤다\n   FOR UPDATE;\n\nUPDATE accounts SET balance = balance - :amt WHERE id = :from_id;\nUPDATE accounts SET balance = balance + :amt WHERE id = :to_id;\n\n-- 최종 방어선은 애플리케이션이 아니라 제약이다.\n-- '확인하고 넣기' 는 동시에 두 요청이 오면 뚫린다.\n--   ALTER TABLE accounts ADD CONSTRAINT ck_balance CHECK (balance >= 0);\n\nCOMMIT;\n\n-- 트랜잭션 안에서 외부 호출을 하지 않는다.\n--   나쁜 순서: BEGIN → 결제사 호출(2초) → UPDATE → COMMIT\n--   그동안 잠금을 쥐고 있어 다른 요청이 전부 기다린다.\n--   좋은 순서: 결제사 호출 → BEGIN → UPDATE → COMMIT\n\n-- 작업 큐를 테이블로 만들 때 — 남이 잡은 행은 건너뛴다\nSELECT id FROM jobs\n WHERE status = 'READY'\n ORDER BY id\n LIMIT 10\n   FOR UPDATE SKIP LOCKED;" },

  { t: "다시 재고 지킨다", type: "build",
    goal: "고친 뒤의 응답 시간을 <b>같은 조건에서 다시 재고</b>, 느려지면 알 수 있게 해 두세요.\n느린 쿼리 기록과 인덱스 사용 여부를 정기적으로 볼 수 있게 만듭니다.",
    hint: "고치기 전 숫자를 남겨 두지 않으면 좋아졌는지 말할 수 없습니다. 데이터베이스가 제공하는 쿼리 통계 확장을 켜 두면 어떤 쿼리가 총 시간을 가장 많이 쓰는지 한눈에 보입니다 — 한 번 느린 것보다 <b>자주 도는 것</b>이 대개 더 큰 몫입니다.",
    acc: "개선 전후 p95 가 기록되고, 총 소요 시간 상위 쿼리 목록과 안 쓰이는 인덱스 목록을 뽑을 수 있으면 완료입니다.",
    lang: "sql",
    sol: "-- 1) 총 시간을 가장 많이 쓰는 쿼리 — 한 번 느린 것보다 자주 도는 것이 크다\nSELECT round(total_exec_time)      AS total_ms,\n       calls,\n       round(mean_exec_time, 1)    AS mean_ms,\n       round(stddev_exec_time, 1)  AS sd_ms,\n       left(query, 80)             AS q\n  FROM pg_stat_statements\n ORDER BY total_exec_time DESC\n LIMIT 20;\n\n-- 2) 만들어 두고 안 쓰는 인덱스 — 쓰기 비용만 만든다\nSELECT relname, indexrelname, idx_scan,\n       pg_size_pretty(pg_relation_size(indexrelid)) AS size\n  FROM pg_stat_user_indexes\n WHERE idx_scan < 50\n ORDER BY pg_relation_size(indexrelid) DESC;\n\n-- 3) 전체 스캔이 잦은 큰 테이블\nSELECT relname, seq_scan, idx_scan, n_live_tup\n  FROM pg_stat_user_tables\n WHERE n_live_tup > 100000 AND seq_scan > idx_scan\n ORDER BY seq_scan DESC;\n\n-- 4) 지금 기다리고 있는 것 — 잠금 대기를 실시간으로 본다\nSELECT pid, wait_event_type, wait_event, state,\n       now() - query_start AS elapsed, left(query, 60)\n  FROM pg_stat_activity\n WHERE state <> 'idle'\n ORDER BY elapsed DESC;" },

  { t: "남은 위험을 적어 둔다", type: "note",
    goal: "고친 것과 <b>아직 남은 것</b>을 나눠 적으세요.\n남은 것마다 <b>언제 다시 문제가 되는지</b>(어떤 규모에서, 어떤 조건에서)를 함께 적습니다.",
    ph: "예: 고침 — 복합 인덱스로 p95 3.1초 → 90ms · 커서 페이지네이션 · 잠금 순서 통일(데드락 0) / 남음 — 총 개수는 추정치라 정확한 수가 필요해지면 다시 봐야 함 · 부분 인덱스가 3개월 조건에 묶여 있어 정책이 바뀌면 무용 · orders 가 5천만 행을 넘으면 파티셔닝 검토 · pg_stat_statements 수집 부하는 아직 재지 않음" }

]};
