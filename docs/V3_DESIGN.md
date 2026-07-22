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

## 5. V4 예고 (설계만, 구현 아님)

V4의 AI는 **평가 기준과 문제 구조가 먼저 존재**하기 때문에 붙이기 쉽다. `project_reviews.reviewer_id='ai'`로 자연스럽게 확장.

AI 코드 리뷰의 방향 — "좋아요"가 아니라 시니어 기준:
```
이 코드는 동작하지만 Senior 기준으로:
  문제:  DB Connection 관리 부족 · Error handling 부족 · 테스트 없음
  예상 장애:  Traffic 10배 증가 시 Connection Pool 고갈
```

"AI 붙이면 된다"로 서두르지 않는다. 구조가 먼저, AI는 그 위에.

---

## 6. 다음 액션 (권장 순서)

1. ✅ **V2 Freeze** (tag `v2.0`)
2. ✅ README / ARCHITECTURE 문서화
3. ✅ **본 V3 설계 문서**
4. ⬜ 실제 사용자 테스트 → V3 스키마 검증
5. ⬜ V3 백엔드 구현 (별도 레포)

> V3부터는 단일 HTML을 벗어나 **별도 백엔드 레포**로 간다. 이 문서가 그 레포의 출발점이다.
