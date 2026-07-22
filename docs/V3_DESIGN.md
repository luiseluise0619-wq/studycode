# CodeRun V3 — Design Document

> **정체성 전환**: V2(개발자 훈련 시뮬레이터) → V3(개인 개발자 성장 **플랫폼**)
> V3의 핵심은 기능이 아니라 **데이터 구조**다. 코드를 짜기 전에 스키마를 확정한다.

이 문서는 설계도이며 구현 지시서가 아니다. V2는 freeze 상태를 유지한다.

---

## 0. V3가 푸는 문제

V2의 유일한 한계는 저장이 `localStorage`에 갇혀 있다는 것.

```
[V2]  User → Progress → localStorage(기기 1대, 브라우저 초기화 시 소실)
[V3]  User → Progress → Cloud Save(계정 기반, 기기 간 동기화, 분석·평가 가능)
```

이게 "서비스화"의 시작점이다.

---

## 1. DB Schema

RDB(PostgreSQL 가정). V2의 상태 객체 `S`가 정규화되어 아래 테이블로 흩어진다.

```
users
 ├ id            PK
 ├ email         unique
 ├ role          현재 티어 (Beginner … Principal) — skills 평균에서 파생, 캐시
 ├ display_name
 └ created_at

skills                      -- V2의 S.skills(9축)를 행으로
 ├ id            PK
 ├ user_id       FK→users
 ├ category      coding|debugging|algorithms|database|system_design|
 │                performance|security|communication|leadership
 ├ level         0~100 (float)
 └ updated_at
 UNIQUE(user_id, category)

problems                    -- V2의 COURSES 문항을 서버로 이관
 ├ id            PK
 ├ track         python|sql|sysd|backend|…
 ├ type          choice|input|code
 ├ difficulty    1~6 (Beginner … Principal)
 ├ skill         이 문제가 기여하는 9축 중 하나
 ├ payload       JSONB (q, o, a, ex, cat …)
 └ created_at

attempts                    -- V2의 done/wrongs를 이벤트 로그로
 ├ id            PK
 ├ user_id       FK→users
 ├ problem_id    FK→problems
 ├ score         0~1 (정답=1)
 ├ time_ms       풀이 소요
 └ created_at
 INDEX(user_id, problem_id)

projects
 ├ id            PK
 ├ user_id       FK→users
 ├ template_id   PROJECTS의 원본
 ├ tier          Beginner … Principal
 ├ status        in_progress|done
 └ completed_at

project_reviews             -- V3의 차별점(사람) + V4 확장점(AI)
 ├ id            PK
 ├ project_id    FK→projects (또는 user_id+template)
 ├ reviewer_id   FK→users  (V4에서는 'ai' 가상 리뷰어)
 ├ scores        JSONB {architecture, testing, security, operations}
 ├ senior_readiness  0~100 (%)
 ├ feedback      TEXT
 └ created_at
```

**설계 원칙**
- `attempts`는 append-only 이벤트 로그. 성장 곡선·약점 분석·재추천이 여기서 나온다.
- `skills`는 attempts에서 파생 가능하지만, 읽기 성능을 위해 materialized(캐시). V2의 `awardSkill` 로직을 서버에서 재현.
- `problems.payload`는 JSONB — V2 문항 포맷을 그대로 담아 마이그레이션 비용 최소화.

---

## 2. API 설계 (REST)

```
POST   /auth/signup                  이메일 가입
POST   /auth/login                   → JWT
GET    /me                           프로필 + role + 9축 skills

# 동기화 (1순위 기능)
GET    /progress                     서버 → 클라 (로그인 시 병합)
PUT    /progress                     클라 → 서버 (변경분 업서트)
POST   /attempts                     문제 풀이 1건 기록 → skills 갱신

# 성장 분석 (2순위 기능)
GET    /me/passport                  9축 + 역할 + 다음 티어까지 필요치
GET    /me/analysis                  강점/약점 + 추천 미션
   → 예: { weakness:"database_scaling",
           recommended:[{mission:"Replication Mission", track:"sysd"}] }

# 프로젝트 평가 (3순위 기능 = 차별점)
GET    /projects                     내 프로젝트 목록 + tier
POST   /projects/:id/complete        스코어카드 제출
GET    /projects/:id/review          평가 결과(architecture/testing/security/operations + readiness%)
POST   /projects/:id/review          사람 리뷰어 피드백 (V4에서 AI가 이 엔드포인트 사용)

# 콘텐츠
GET    /tracks                       트랙 목록
GET    /tracks/:track/problems       문항 페이지네이션 (단일 HTML 비대화 해소)
```

**인증**: JWT(access) + refresh. `skills`/`attempts`는 항상 `user_id` 스코프.

---

## 3. 마이그레이션 전략 (V2 → V3)

1. **오프라인 우선 유지** — V3도 로그인 없이 동작. 계정은 *선택적 클라우드 저장*.
2. **로컬 우선 병합** — 로그인 시 `localStorage`의 `S`를 서버 progress와 병합(스킬은 max, attempts는 union).
3. **문항 이관** — `COURSES` → `problems` 테이블(JSONB). 클라는 API로 페이지 로딩 → 1.6MB 단일 파일 문제 해소.
4. **평가 로직 재사용** — `awardSkill` 감소함수·`ROLES` 임계값·`SCORECARD`를 서버로 포팅(동일 공식).

---

## 4. 기능 우선순위 (V3)

| 순위 | 기능 | V2 연결점 | 왜 |
|---|---|---|---|
| **1** | 계정 + 클라우드 동기화 | `S` → users/skills/attempts | 서비스화의 시작. 기기 이동·소실 방지 |
| **2** | 개인 성장 분석 | Developer Passport(9축) | V2의 강점을 개인화 추천으로 확장 |
| **3** | 프로젝트 평가 시스템 | 스코어카드 → project_reviews | "문제 맞춤"이 아닌 "개발자 성장"의 증거 = 차별점 |

예시 — 성장 분석 응답:
```
Developer Passport
  Python 82 · SQL 75 · System Design 61 · DevOps 43
  Weakness:    Database Scaling
  Recommended: Replication Mission
```

예시 — 프로젝트 평가:
```
Architecture: A   Testing: B   Security: A   Operations: C
Senior Readiness: 78%
```

---

## 4.5 코드 실행 & 프로젝트 모드 (V3→V4 핵심 자산)

CodeRun의 목표는 "문제 풀이 → 정답 확인 → XP"가 아니라 **혼자서 개발팀 경험을 하는 시뮬레이터**다:
```
개념 학습 → 코드 작성 → 프로젝트 제작 → 테스트 → 코드 리뷰 → 장애 대응 → 개발자 평가
```
바이브코딩 시대에 차별화 능력은 *무엇을 만들지 정하기 · 좋은 구조 판단 · 코드 검증 · 장애 대응* — 프로젝트 모드가 이걸 훈련한다.

### 직접 코딩 4단계 사다리 (질이 핵심)
| Level | 목표 | 예시 |
|---|---|---|
| 1 구현 | 빈 함수 채우기 | `def is_even(n): pass` → 짝수 True |
| 2 테스트 통과 | 케이스 대조 | `is_even(2)→True, is_even(3)→False` |
| 3 리팩토링 | 같은 기능, 더 나은 코드 | `for i in data: result.append(i*2)` → Pythonic |
| 4 실무 코드 | 조건부 구현 | 로그인 API: 비밀번호 검증·예외 처리·로그 |

### 실행 환경 매트릭스 (기술적 현실)
| 언어 | 방법 | 무게 | 버전 |
|---|---|---|---|
| **JS** | 브라우저 iframe 직접 실행 | 가벼움 | ✅ **V2 (이미 있음)** — `code` 문제 + 프로젝트 `web` 페이즈 자동검증(dom/count/text/src) |
| **SQL** | `sql.js`(WASM SQLite) 인라인 실행 | 중간 | ✅ **V2 (완료)** — 실제 SQLite로 쿼리 실행 → 결과셋 비교 채점(JOIN·GROUP BY·HAVING·윈도우·CTE) |
| **Python** | Pyodide(용량 큼, 모바일 부담) 또는 서버 Docker 샌드박스 | 무거움 | **V4** — 서버 샌드박스가 실제 서비스 방식 |

> V2는 이미 JS 라이브 실행 + 프로젝트 자동검증을 갖고 있다. V3는 여기에 **SQL 실행**과 **코드 제출/저장**을 더하고, Python 실행은 서버 샌드박스가 필요한 V4로 둔다.

### 코드 에디터 선택 (Monaco vs CodeMirror)
| 에디터 | 장점 | 단점 | 어디에 |
|---|---|---|---|
| **Monaco** (VS Code 엔진) | IntelliSense·타입체크·최고 UX | 수 MB + 언어별 web worker 별도 파일, 번들러 전제, 모바일 무거움 | **V3** (단일 HTML 탈출 후 서버 제공 시 정답) |
| **CodeMirror 5** | 단일 파일 ~200KB, 인라인 가능, 오프라인 유지, 가벼움 | Monaco보다 기능 적음 | V2에서 리치 에디터가 필요하면 이것 |
| `<textarea>` (현재) | 0KB, 완전 오프라인 | 하이라이트 없음 | V2 기본 |

> **Monaco는 V2(단일 HTML·오프라인·모바일)에 넣지 않는다** — 파일 하나 원칙과 충돌하고 1.6MB→8MB+ 비대화. Monaco는 실행기가 아니라 편집기일 뿐이라 실행(iframe/sql.js/Pyodide)은 별도로 필요하다. V3에서 서버·번들러가 생기면 그때 채택.

### 프로젝트 모드 5단계 (V3의 차별점)
```
1. 프로젝트 선택   (Python: CSV 분석기/크롤러 · SQL: 쇼핑몰 DB · Backend: 인증 API · AI: RAG 챗봇)
2. 요구사항 제공   실무처럼 — "쇼핑몰 주문 분석: 테이블 설계·월별 매출·인기상품·테스트. 조건: Index·에러처리·README"
3. 직접 구현       사용자 코드 → 자동 테스트 (예: 테스트 15개 중 13 통과 → 기능 86%)
4. 시니어 평가     Code Quality/Architecture/Performance/Security/Testing/Documentation → Developer Score → 티어
5. AI 멘토(V4)    대신 만들지 않음. "함수 책임이 큼 · DB 접근 분리 필요 · Service Layer 적용" 식 방향 제시
```
이 5단계는 스키마와 직접 매핑된다: 3→`attempts`, 4→`project_reviews.scores`+`senior_readiness`, 5→`reviewer_id='ai'`.

### 구현 순서 (냉정하게)
```
[V2 現] 프로젝트 템플릿 · 코드 저장(localStorage) · 테스트 일부(JS)
   ↓
[V3]    회원 · 서버 저장 · SQL 실행(sql.js) · 코드 제출 기록 · 평가 데이터
   ↓
[V4]    Python 실행(샌드박스) · AI 코드 리뷰 · 개인 멘토
```
남은 건 3개뿐 — **실행 환경 + 사용자 데이터 + AI 피드백**. 프로젝트 30개·시뮬 101개가 이미 잘 설계된 상태라 그게 핵심 자산이다.

---

## 5. V4 예고 (설계만, 구현 아님)

V4의 AI는 **평가 기준과 문제 구조가 먼저 존재**하기 때문에 붙이기 쉽다. `project_reviews.reviewer_id='ai'`로 자연스럽게 확장.

AI 코드 리뷰의 방향 — "좋아요"가 아니라 시니어 기준:
```
이 코드는 동작하지만 Senior 기준으로:
  문제:  DB Connection 관리 부족 · Error handling 부족 · 테스트 없음
  예상 장애:  Traffic 10배 증가 시 Connection Pool 고갈
```

"AI 붙이면 된다"로 서두르지 않는다. 구조가 먼저, AI는 그 위에.

### AI 코드 리뷰 — 연동 방식 (결정: V4로 미룸)
모델 무관(엔드포인트만 다름 — Gemini/Claude 등 교체 가능). 두 경로:
- **BYOK** (사용자가 자기 API 키 입력, localStorage 저장, 브라우저가 직접 호출) — 단일 HTML에서도 가능하나 본인·프로토타입용. 키를 절대 하드코딩하지 않음.
- **서버 프록시** (V4, 진짜 제품) — 서버가 키를 숨기고 대신 호출·계정 연동·비용/레이트 관리. `project_reviews.reviewer_id='ai'` 슬롯에 매핑.

결정: V2에는 붙이지 않고 **V4(서버 프록시)** 로 진행. 평가 기준·문제 구조가 이미 있어 붙이기 쉬운 상태를 유지.

---

## 6. 다음 액션 (권장 순서)

1. ✅ **V2 Freeze** (tag `v2.0`)
2. ✅ README / ARCHITECTURE 문서화
3. ✅ **본 V3 설계 문서**
4. ⬜ 실제 사용자 테스트 → V3 스키마 검증
5. ⬜ V3 백엔드 구현 (별도 레포)

> V3부터는 단일 HTML을 벗어나 **별도 백엔드 레포**로 간다. 이 문서가 그 레포의 출발점이다.
