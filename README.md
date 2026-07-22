# CodeRun V2 — Developer Growth Simulator

> 코딩 문제 앱이 아니라, **주니어를 시니어로 훈련시키는 성장 시뮬레이터**.
> 핵심 원칙: *"시니어를 만드는 것은 콘텐츠 양이 아니라, 반복적으로 어려운 의사결정을 시키는 구조다."*

단일 HTML 파일(`index.html`)로 동작하는 오프라인 PWA. 서버·빌드·설치 없이 브라우저에서 바로 실행되며, 모든 상태는 `localStorage`에 저장됩니다.

```
입문  →  Junior  →  Mid  →  Senior  →  Staff  →  Principal
```

---

## 무엇이 들어있나

| 영역 | 규모 | 설명 |
|---|---|---|
| **지식 엔진** | 32트랙 · 2,884문항 | Python 705 / SQL 572 중심. choice·input·code(라이브 실행·테스트 통과) 문제 |
| **Real Work 시뮬레이션** | 101개 | 장애·리뷰·기술선택·이해관계자·프로덕트·윤리 분기형 의사결정 |
| **원인 추적(진단)** | 12개 | 불완전한 정보 + 단서(일부 red herring)로 근본원인 규명 |
| **프로젝트 워크스페이스** | 30개 | 8단계 라이프사이클(요구사항→설계→개발→테스트→배포→운영→장애→Postmortem), 연쇄 장애 시나리오 |
| **9축 평가 엔진** | — | coding·debugging·algorithms·database·system_design·performance·security·communication·leadership |
| **Developer Passport** | — | SVG 레이더 차트 + 역할 티어(Beginner→Principal) |

### V1과 무엇이 다른가
V1은 "코딩 문제를 맞추는" 앱이었습니다. V2는 장애 원인 추적, DevOps(SLO/MTTR/Incident Command/Runbook), Postmortem, 설계 판단을 넣어 **개발자 성장 훈련 제품**이 되었습니다.

---

## 실행

```bash
# 그냥 파일을 브라우저로 열면 됩니다. 서버 불필요.
open index.html          # macOS
xdg-open index.html      # Linux
```

의존성 0개. 네트워크 0개. 계정 0개. 전부 클라이언트에서 동작합니다.

---

## 트랙별 문항 수

**주력** Python 705 · SQL 572 · 백엔드 121 · 시스템 설계 99 · Git/DevOps 134 · 보안 64 · 알고리즘 67
**프론트엔드** JavaScript 152 (런타임·이벤트루프·V8·성능) · React 37 (렌더링·훅 내부) · HTML/CSS 73
**언어** Java 98 · C 67 · C++ 66 · Go 53
**데이터/AI** AI 엔지니어링 50 (서빙·RAG·MLOps) · Pandas 45 · NumPy 45 · 통계 45 · 머신러닝 45 · ML평가 45 · 딥러닝 45
**CS** OS 31 · 네트워크 21 · DB내부 20 · 그 외

> 직접 코딩(테스트 통과형): 함수를 구현하면 여러 테스트 케이스로 자동 채점(X/N 통과) — 코딩 실습·알고리즘 트랙.

---

## 문서

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — V2 내부 구조(데이터 모델·엔진·렌더링·상태)
- [`docs/V3_DESIGN.md`](docs/V3_DESIGN.md) — V3 설계도(DB 스키마·API·클라우드 동기화)

---

## 버전 로드맵

| 버전 | 정체성 | 상태 |
|---|---|---|
| V1 | 코딩 문제 앱 | ✅ |
| **V2** | **개발자 훈련 시뮬레이터** | ✅ **Freeze (현재)** |
| V3 | 개인 개발자 성장 플랫폼 (계정·클라우드 저장·성장 분석·프로젝트 평가) | 📐 설계 단계 |
| V4 | AI Engineering Mentor (시니어 기준 코드 리뷰·멘토링) | 🔮 구상 |

> V4의 LLM은 서두르지 않습니다. CodeRun은 **평가 기준과 문제 구조가 먼저 존재**하는 상태라 나중에 AI를 붙이기 좋습니다.
