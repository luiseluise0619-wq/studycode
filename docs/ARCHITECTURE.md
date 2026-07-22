# CodeRun V2 — Architecture

V2는 **단일 HTML 파일**로 동작하는 클라이언트 전용 앱입니다. 서버·빌드·번들러·의존성이 없습니다. 이 문서는 "왜 이런 구조인지"를 설명합니다.

---

## 1. 설계 원칙

1. **오프라인 우선** — 네트워크 없이 완전 동작. 상태는 `localStorage`.
2. **판단 반복 > 콘텐츠 양** — 문제 수가 아니라 *어려운 의사결정을 반복*시키는 엔진이 핵심.
3. **하나의 성장 축(9축 스킬)** — 모든 활동(문제·시뮬·진단·프로젝트)이 같은 9축 스킬 벡터에 기여 → 일관된 성장 신호.
4. **엔진과 데이터 분리** — 콘텐츠는 순수 데이터(`COURSES`, `SIMS`, `DIAGS`, `PROJECTS`), 로직은 렌더러/평가 엔진.

---

## 2. 파일 구조

```
index.html          # 전부. HTML + CSS + JS + 데이터가 한 파일.
├─ <style>          # 반응형(320~440px 모바일 브레이크포인트 포함)
├─ 데이터 (const)
│   ├─ COURSES      # 32트랙 × 유닛 × 레슨 × 문항(2,454)
│   ├─ SIMS         # Real Work 시뮬 101
│   ├─ DIAGS        # 원인 추적 진단 12
│   ├─ PROJECTS     # {ai, backend, fullstack} × 프로젝트(30)
│   ├─ AXES         # 9축 정의
│   ├─ ROLES        # 역할 티어 임계값
│   └─ SCORECARD    # 프로젝트 완료 평가표
└─ 엔진 (function)  # 렌더링 · 상태 · 평가 · 시뮬/진단/프로젝트 진행
```

---

## 3. 상태 모델

전부 하나의 객체 `S`에 담겨 `localStorage`에 직렬화됩니다.

```js
const DEF = {
  xp:0, streak:0, lastDay:null, hearts, heartsDay:null,
  done:{},          // 완료한 레슨/문항
  theme, freeMode, wrongs:[],   // 틀린 문제 복습 큐
  goal, onboarded, dayCount, dayDate, dailyTarget:10,
  proj:{},          // 프로젝트 진행 상태 + "<id>:score" 스코어카드 결과
  skills:{},        // ← 9축 성장 벡터 (핵심)
  sims:{},          // 시뮬 완료/선택 기록
  diags:{}          // 진단 완료 기록
};
// 부팅: S = load()  →  변경 시 save()
```

**설계 포인트**: `skills`가 전 시스템의 공유 통화(currency)입니다. 무엇을 하든 이 벡터가 갱신되고, Developer Passport·역할 티어가 여기서 파생됩니다. V3에서 이 객체가 그대로 **클라우드 저장 payload의 뿌리**가 됩니다 (→ `docs/V3_DESIGN.md`).

---

## 4. 9축 평가 엔진

```js
const AXES = [coding, debugging, algorithms, database, system_design,
              performance, security, communication, leadership]; // 각 0~100
```

### 성장 함수 (체감 감소 diminishing returns)
```js
function awardSkill(k, d){
  const cur = S.skills[k];
  if(d>0){ const gain = Math.max(d*0.12, d*(1 - cur/100));  // 높을수록 덜 오름
           S.skills[k] = min(100, cur+gain); }
  else   { S.skills[k] = max(0, cur+d); }
}
```
- 문제 정답 → 트랙 기본축 +0.5, 문제의 `cat`(디버깅/성능/보안 등) 매핑축 +1.6
- 시뮬/진단/프로젝트 결정 → 옵션의 `fx`(축별 델타)로 가·감점 (틀린 판단은 마이너스도 가능)

### 역할 티어
```js
const ROLES = [[0,Beginner],[15,Junior],[35,Mid],[55,Senior],[74,Staff],[90,Principal]];
roleOf(avg)  = 9축 평균으로 현재 티어
nextRole(avg)= 다음 티어까지 필요치
```
Developer Passport는 `radarSVG()`로 9축을 SVG 레이더로 그립니다.

---

## 5. 콘텐츠·엔진 4종

### (a) 지식 엔진 — `COURSES`
```
COURSES[track] = { name, units:[ { title, lessons:[ { q:[ 문항 ] } ] } ] }
문항 t: "choice" | "input" | "code"
  choice: {q, o:[4], a:정답인덱스, ex, cat?}
  input : {q, a:[허용답들], ex, cat?}
  code  : {q, ex, ...}   // iframe에서 JS 라이브 실행
```
`cat` 필드 → `CATMAP` 배지(🐛디버깅/🔍리뷰/⚡성능/🏗️설계/🚨실무/🎓면접/⚙️내부동작/🔐보안). 문항은 innerHTML로 렌더되므로 `<`,`>`는 **`&lt;`,`&gt;`로 미리 이스케이프**되어 저장됨.

### (b) Real Work 시뮬 — `SIMS` (101)
분기형 의사결정. `cat`: incident(장애30)·review(20)·techchoice(30)·stakeholder·product·ethics. 각 옵션에 `fx`(축 델타)와 best 여부 → 선택 후 시니어 관점 피드백.

### (c) 원인 추적 진단 — `DIAGS` (12)
증상 + 단서(clues, 일부 **red herring**) → 최소 2개 조사 후 근본원인 선택. "불완전한 정보로 문제 정의"를 훈련.

### (d) 프로젝트 워크스페이스 — `PROJECTS` (30)
8단계 라이프사이클을 `phases[]`로 표현.
```
phase.type: note | decide | build | web
  decide → 옵션 fx로 9축 기여
  build  → sol(정답 구현) 대조
  web    → iframe 라이브 프리뷰 + 자동검증(dom/count/text/src)
```
구버전 프로젝트는 `steps[]` → `projPhases(p)`가 phases로 합성. 완료 시 **스코어카드**(`SCORECARD`) → 등급 S/A/B/C + Senior Readiness % → `finishProject()`가 축 보상 지급. 프로젝트는 난이도 티어(`PROJ_TIER`: Beginner→Principal)를 가짐.

---

## 6. 렌더링·화면 흐름

`render()`가 중앙 디스패처. 주요 패널 오프너:
```
openProfile()   Developer Passport (레이더 + 역할)
openSims()      시뮬 목록 → startSim(id) → renderSimStep()
openDiags()     진단 목록 → startDiag(id) → renderDiag() → pickDiagCause()
openProjects()  프로젝트 목록 → openLab(track, idx) → renderPhase()
```
성장 루프: **온보딩 → 진단 배치 → 커리큘럼 → 데일리 → 시뮬 → 원인추적 → 프로젝트/랩 → 스코어카드 → Passport**.

---

## 7. 알려진 제약 (V3에서 해소)

| 제약 | 영향 | V3 대응 |
|---|---|---|
| `localStorage`만 사용 | 기기 간 이동 불가, 브라우저 초기화 시 소실 | 계정 + 클라우드 저장 |
| 단일 사용자 | 랭킹·비교·협업 불가 | users/attempts 테이블 |
| 프로젝트 평가가 자동 규칙 기반 | 사람/AI 리뷰 없음 | project_reviews + V4 AI 리뷰 |
| 단일 HTML(1.6MB) | 콘텐츠 늘수록 파일 비대 | 문항 API 분리 로딩 |

이 제약들은 **의도된 것**입니다. V2는 "구조가 옳은가"를 증명하는 단계였고, 저장/계정/협업은 V3의 몫입니다.
