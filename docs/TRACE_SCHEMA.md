# 실행 트레이스 스키마 v1 (고정)

코드런의 모든 언어는 **같은 형태**로 실행 과정을 기록한다.
Python·JavaScript·SQL·C++·Java 어댑터가 각자 다른 방법으로 만들지만, 나오는 것은 동일하다.

이 스키마 하나가 두 가지 일을 한다.

1. **화면** — 슬라이더로 되감는 재생 프레임
2. **데이터** — 학습 과정 분석의 원천

둘을 따로 만들면 반드시 어긋난다. 그래서 하나로 둔다.

---

## 왜 이 형태인가

같은 문제를 틀린 두 사람을 구별할 수 있어야 한다.

```python
# A: for i in range(1, 5)   → 시작값 개념 혼동
# B: 들여쓰기 누락           → 문법 이해 부족
```

기존 플랫폼이 남기는 것은 `문제 42, 오답, 1회`. 둘이 구별되지 않는다.
트레이스가 남기는 것은 **실행 경로**다 — A는 `i`가 1부터 시작한 5단계, B는 0단계와 `IndentationError`.
필요한 처방이 다르고, 그 차이가 데이터에 남는다.

---

## 설계 규칙 (어댑터를 추가할 때 지킬 것)

1. **이벤트 종류는 닫힌 집합이다.** 언어를 붙인다고 종류를 늘리지 않는다.
   늘려야 한다면 그건 스키마 v2 이고, 기존 데이터 마이그레이션이 필요하다는 뜻이다.
2. **필드를 늘리지 않는다.** 언어 고유의 것은 값의 `k`(모양) 로 표현한다.
3. **값은 반드시 모양 태그를 가진다.** 원시값을 그대로 넣지 않는다.
   그래야 뷰를 *언어*가 아니라 *모양*으로 고를 수 있다.
4. **크기 상한을 지킨다.** 브라우저 메모리에서 재생해야 하고, 나중에는 서버로 보내야 한다.
5. **잘렸으면 잘렸다고 말한다.** `cut` 을 조용히 비워 두지 않는다.

---

## 봉투 (Envelope) — 한 번의 실행

```jsonc
{
  "v": 1,                    // 스키마 버전
  "run": "r-8f3a…",          // 이 실행의 식별자
  "lang": "python",          // python | javascript | sql | cpp | java | …
  "at": 1738368000000,       // 실행 시작 (epoch ms)
  "src": "x = 10\n…",        // 소스. 서버 저장 시에는 해시로 대체할 수 있다
  "ctx": {                   // 어디서 실행했나. 자유 실행이면 없다
    "track": "python", "unit": "반복과 데이터",
    "lesson": "range 다루기", "qid": "py-0421", "attempt": 3
  },
  "events": [ … ],           // 아래 이벤트 목록
  "steps": 12,               // 단계 수 (= 마지막 s + 1)
  "out": "15\n",             // 표준출력 전체
  "err": {"type":"IndexError","msg":"list index out of range","line":2},
  "cut": false,              // 상한에서 잘렸는가
  "ms": 4                    // 추적 포함 총 실행 시간
}
```

`ctx`·`err` 는 없을 수 있다(`null`). 나머지는 필수.

---

## 이벤트 (Event)

모든 이벤트는 `s`(단계 번호)와 `e`(종류) 두 개만 공유한다.

**프레임 정보(줄·함수·깊이)는 `step` 이벤트에만 있다.** 단계마다 `step` 이 정확히 하나
먼저 나오고, 그 단계에서 일어난 일들이 같은 `s` 로 뒤에 붙는다.

```jsonc
{"s":0, "e":"step", "line":1, "fn":"<module>", "d":0}
{"s":0, "e":"set",  "name":"x", "to":{"k":"int","v":10}}
{"s":1, "e":"step", "line":3, "fn":"<module>", "d":0}
{"s":1, "e":"out",  "text":"15\n"}
```

이렇게 두는 이유: **변수가 바뀌지 않는 줄도 단계로 남아야** 슬라이더에서 사라지지 않는다.
그리고 줄·함수·깊이를 모든 이벤트에 중복해 넣지 않아도 된다.

### 이벤트 종류 (닫힌 집합)

| `e` | 추가 필드 | 뜻 | 쓰는 언어 |
|---|---|---|---|
| `step` | `line`, `fn`, `d` | **단계 시작.** 단계마다 정확히 하나 | 전부 |
| `set` | `name`, `from?`, `to` | 변수·필드가 값을 가짐 | 전부 |
| `del` | `name` | 사라짐 (스코프 이탈 등) | 전부 |
| `call` | `name`, `args?` | 프레임 진입 | 전부 |
| `ret` | `to` | 프레임 반환 | 전부 |
| `throw` | `name`, `msg?` | 예외 발생 | 전부 |
| `out` | `text` | 표준출력 | 전부 |
| `mem` | `addr`, `size`, `name?`, `to?` | 메모리 셀 변화 | C·C++ |
| `row` | `table`, `op`, `to` | 표의 행 변화 (`op`: `ins`/`upd`/`del`/`scan`) | SQL |
| `dom` | `sel`, `op`, `to?` | DOM 변화 (`op`: `add`/`upd`/`rm`) | JS·HTML |

`from` 이 없으면 "이전에 없던 것", 있으면 "이 값에서 저 값으로".

### 값 (Value) — `from` · `to` · `args` 에 들어가는 것

모양 태그 `k` 가 **필수**다. 뷰는 `k` 만 보고 그린다.

```jsonc
{"k":"none"}
{"k":"bool",  "v": true}
{"k":"int",   "v": 42}
{"k":"float", "v": 1.5}
{"k":"str",   "v":"hi", "n":2, "cut":false}          // n = 원래 길이
{"k":"list",  "v":["1","2"], "n":2, "cut":false}      // 원소는 짧은 표현
{"k":"tuple", "v":["1"], "n":1}
{"k":"set",   "v":["1"], "n":1}
{"k":"dict",  "v":[["'a'","1"]], "n":1}               // [키, 값] 쌍
{"k":"fn",    "v":"add"}
{"k":"obj",   "v":"<Point x=1>", "t":"Point"}
{"k":"ref",   "id":7}                                  // 포인터·참조 (C++ 어댑터용)
```

### 상한

| 대상 | 상한 | 넘으면 |
|---|---|---|
| 단계 수 | 1000 | `cut: true` 로 표시하고 중단 |
| 문자열 | 200자 | `cut: true`, `n` 에 원래 길이 |
| 리스트·집합 | 50개 | 위와 같음 |
| 딕셔너리 | 30쌍 | 위와 같음 |
| 원소 표현 | 80자 | 뒤에 `…` |

---

## UI 와 분석이 같은 배열을 읽는 방법

**UI (재생 슬라이더)**
```js
const frames = groupBy(env.events, e => e.s);   // 단계별로 묶는다
// 프레임 n = 그 시점까지의 누적 상태 + 이번 단계에 바뀐 것
```

**분석 (학습 데이터)**
```sql
-- '어떤 개념에서 막히는가' 를 이벤트에서 바로 센다
select json_extract(e, '$.name') as err_type, count(*)
from runs, json_each(events) as e
where json_extract(e, '$.e') = 'throw'
group by 1 order by 2 desc;
```

같은 배열이다. 변환도, 이중 기록도 없다.

---

## 서버 저장 (계정이 붙었을 때)

```sql
create table runs (
  run        text primary key,
  user_id    text not null,
  lang       text not null,
  at         bigint not null,
  src_sha    text not null,         -- 소스 본문은 별도 테이블에 중복 제거해 저장
  ctx        jsonb,
  steps      int, cut boolean, ms int,
  out        text, err jsonb,
  events     jsonb not null         -- 압축 후 대개 수십 KB
);
create index on runs (user_id, at desc);
create index on runs ((ctx->>'qid'));
```

**주의:** 사용자 코드는 개인정보에 준해 다룬다. 수집에는 동의가 필요하고,
동의 없으면 봉투에서 `src` 를 빼고 `src_sha` 만 남긴다.

---

## 어댑터 현황

| 언어 | 방법 | 상태 |
|---|---|---|
| **Python** | `sys.settrace` (Pyodide) | 구현·CPython 검증 완료 · **Pyodide 검증 대기** (`pw_pyodide.cjs`) |
| SQL | sql.js 단계 캡처 + `EXPLAIN QUERY PLAN` | 미착수 |
| HTML/CSS | 기존 iframe 렌더 재사용 | 미착수 |
| JavaScript | Sucrase 로 AST 계측 | 미착수 |
| C·C++ | 서버 디버거 (gdb) | 보류 — 비용이 크다 |
| Java | JVMTI·JDI | 보류 |

새 어댑터는 `node tools/tracer/schema.cjs <봉투.json>` 을 통과해야 한다.
