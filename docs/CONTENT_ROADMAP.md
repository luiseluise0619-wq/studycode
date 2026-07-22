# CodeRun — Content Roadmap

> 원칙: **지금은 문제 수를 늘리기보다 문제 하나하나의 품질(시나리오 · 직접 코드 작성 · 프로젝트 연결)을 높이는 게 성장 효과가 크다.** 아래 규모는 최종 지향점이지 당장의 목표가 아니다.

## 현재
2,891문항 / 32트랙 · 시뮬 101 · 진단 12 · 프로젝트 30
주력: Python 705 · SQL 572 · Backend 121 · System Design 99 · DevOps 134 · Algorithm 67
프론트엔드 시니어: JavaScript 152(런타임·이벤트루프·V8·성능) · React 37(렌더링·훅 내부)
AI 엔지니어링: 50 (파이프라인·서빙·RAG·Vector DB·LLM 평가·MLOps)
CS 내부: OS 31 · 네트워크 21 · DB내부 20

## 최종 지향 규모 (지식 그래프)
"모든 개발 분야를 입문 → Staff/Principal"까지 담으려면 5,000~10,000 수준이 적합.

| 구성 | 목표 |
|---|---|
| 기본 지식 문제 | 2,000 |
| 실무 시나리오 | 1,500 |
| 설계 문제 | 500 |
| 면접 문제 | 500 |
| 프로젝트/미션 | 500 |
| **합계** | **~5,000** |

## 부족 영역 → 1차 보강 완료 (계속 심화 여지)
1. ✅ **Frontend Senior** — JS Runtime · V8 · Event Loop · React 내부 · Rendering Optimization · Browser Performance (JavaScript+35, React+17)
2. ✅ **Cloud / DevOps** — AWS · Kubernetes 운영 · Terraform · CI/CD · Observability (+36, DevOps 트랙에 통합)
3. ✅ **AI Engineering** — ML Pipeline · Model Serving · RAG · Vector DB · LLM Evaluation · MLOps (AI 트랙 +42)

다음 심화 후보: 각 영역을 시나리오·직접 코드로 승격, 그리고 Data Engineering / Mobile / Security 심화.

## 품질 우선 작업 (수량보다 먼저)
- **시나리오화**: 객관식 지식 문제 → "1억 요청 서비스에서 X를 설계/판단하라" 형태로 승격
- **직접 코드 작성**: 테스트 통과형 코딩 챌린지 확대 (V2에 엔진 구현됨 — `code` 문제에 `tests:[{in,out}]` 추가 시 pass/fail 자동 채점, 함수 구현 → 테스트 통과 = Level 1~2 사다리)
- **프로젝트 연결**: 트랙 학습 → 해당 프로젝트에서 직접 구현으로 이어지는 흐름 (Python→CSV 분석기, SQL→쇼핑몰 DB, Backend→인증 API)

> 실행 환경 확장(SQL은 sql.js/V3, Python은 샌드박스/V4)과 AI 코드 리뷰(V4)는 `docs/V3_DESIGN.md` 참조.
