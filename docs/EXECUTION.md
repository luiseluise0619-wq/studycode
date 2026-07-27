# 실행 구조 설계 — 하이브리드 3단 (확정 스펙)

목표: **PC와 모바일 모두에서 실제 코드 실행 경험**. 가짜 인터프리터로 언어 의미를
왜곡하지 않는다 — 실제 컴파일러 기반 실행만 허용한다.

## 3단 우선순위

```
1순위  브라우저 내장 엔진        오프라인 · 즉시
       JS · Python(Pyodide) · SQL(sql.js) · HTML/CSS · React JSX · TypeScript
          ↓ 없으면
2순위  Local Runner (PC)         127.0.0.1 자동 탐지
       C · C++ · Java · Go · Rust  →  gcc · g++ · javac · go · rustc
          ↓ 없으면 (모바일 · 미설치)
3순위  Cloud Sandbox Runner
       Client → API Gateway → Docker Sandbox Worker → 실제 컴파일러
```

1순위는 **절대 유지**한다. 인터넷 없이도 학습이 가능해야 한다.

## 왜 브라우저 내장을 늘리지 않는가 (측정 기록)

| 후보 | 결과 |
|---|---|
| JSCPP (브라우저 C++) | 10문항 중 5 실패. `-7/2` 를 **-4** 로 계산(정답 -3) → 기각 |
| yaegi (Go, WASM 39MB) | `defer` 인자 평가 시점 · 루프 안 `defer` · **nil 인터페이스** 오판 → 기각 |
| 공개 실행 API (Piston) | 프록시 403 차단 + 오프라인 원칙과 충돌 |
| `tcc-wasm` · `cheerpj` | npm 에 없음 |
| `@wasmer/sdk` | 실행 시점에 네트워크로 패키지를 받아야 함 → 오프라인 불가 |

결론: C·C++·Java·Go·Rust 를 **오프라인 브라우저 안에서 컴파일하는 길은 현재 없다.**
그래서 2·3순위를 둔다. 의미론이 틀린 엔진을 넣느니 서버를 쓴다.

## 통일 실행 API

언어별로 다른 방식을 쓰지 않는다. Local Runner 와 Cloud Runner 가 **같은 계약**을 지킨다.

```
POST /execute
{ "language": "python", "code": "print('hello')", "stdin": "", "tests": [] }

200
{ "status": "success",          // success | compile_error | runtime_error | timeout | rejected
  "output": "hello",
  "compileError": null,
  "runtimeError": null,
  "executionTime": 120 }        // ms
```

기존 `POST /run` 은 하위 호환으로 남기고, 새 클라이언트는 `/execute` 를 쓴다.

## 보안 (사용자 코드를 그대로 실행하므로 필수)

- Docker 격리 · `--network none` 기본
- CPU 제한 · 메모리 **256MB**
- 실행 시간 **5~10초**
- 프로세스 개수 제한 (`--pids-limit`)
- 파일 시스템은 임시 공간, 실행 후 삭제
- 컨테이너 자동 삭제
- 소스 **200KB** · 출력 **64KB** 상한
- 무한 루프 차단 (타임아웃 + 컨테이너 강제 종료)
- **절대 공개 인터페이스에 그대로 노출하지 않는다.** 기본 바인드는 `127.0.0.1`

## 모바일 UX

"실행" 버튼 하나. 사용자는 Docker·서버·컴파일러를 **몰라도 된다.**
앱이 1→2→3순위를 자동으로 고르고 결과만 보여 준다. 어떤 경로로 실행됐는지는
작은 배지로만 표시한다(내장 / 로컬 / 클라우드).

## 언어별 유형 확장

실행 가능한 언어마다 여섯 유형을 갖춘다:
`code 작성` · `debug` · `review` · `output prediction` · `refactoring` · `performance`

목표 비율 (갱신):

| 유형 | 비율 |
|---|---|
| choice | 30% |
| input | 15% |
| code | 25% |
| debug | 15% |
| review | 10% |
| log | 5% |

## 프로젝트 제작형 (언어별)

`요구사항 → 설계 → 코딩 → 테스트 → 디버깅 → 배포` 흐름으로 연결한다.

주제는 확정했다 (사용자 위임). 각 프로젝트는 7일이고 Day 마다 수용 기준이 붙는다.
설계 Day 는 JSON 문서 검사, 구현 Day 는 실제 컴파일러 실행으로 채점한다.

| 언어 | 프로젝트 | 7일 흐름 |
|---|---|---|
| C | **센서 로거** — 온도 센서 원시값을 읽어 보정·이상치 제거·요약 출력 | 요구사항 → 자료구조 설계(고정 크기 링버퍼) → 파싱 → 보정·이동평균 → 이상치·경계 테스트 → 메모리/성능(동적 할당 제거) → 배포(펌웨어 크기·워치독) |
| C++ | **충돌 판정 모듈** — AABB/원 충돌, 공간 분할, 프레임 예산 | 요구사항 → 인터페이스 설계 → 브로드페이즈(그리드) → 내로우페이즈 → 경계 케이스(접점·영크기) → 성능(O(n²)→그리드) → API 안정성·헤더 정리 |
| Java | **주문 REST API (Spring 스타일)** — 계층 분리·트랜잭션·예외 | 요구사항 → 도메인/DB 설계 → API 설계 → 서비스·리포지토리 구현 → 테스트(경계·롤백) → 성능(N+1 제거·인덱스) → 배포(설정 외부화·헬스체크) |
| Go | **동시성 프록시** — 요청 팬아웃·타임아웃·컨텍스트 취소 | 요구사항 → 인터페이스 설계 → goroutine/channel 구현 → 취소·타임아웃 → 레이스 테스트(-race) → 백프레셔·워커 풀 → 배포(그레이스풀 셧다운) |
| Rust | **로그 파서 CLI** — 소유권으로 무복사 파싱, 에러 타입 | 요구사항 → 타입 설계(enum 에러) → 파서 구현 → Result 전파·경계 → 테스트 → 성능(할당 줄이기·&str) → 배포(CLI 인자·종료 코드) |

구현 Day 채점은 Local/Cloud Runner 의 실제 컴파일러를 쓴다. 러너가 없으면 설계 Day 는
그대로 풀리고 구현 Day 는 '러너 필요' 로 표시한다 — 오프라인에서도 절반은 진행된다.

## 삭제 금지

인출 모드 · 근거 기반 역량 점수 · Git 시뮬레이터 · 빌드 랩 · 아키텍처 · 시뮬레이션 ·
리뷰 · 로그 분석. **어느 것도 지우지 않는다.**

## 최종 목표

"브라우저에서 배우는 코딩 앱" 이 아니라, 초급 → 실무 개발자까지 성장시키는
**AI Software Engineer Simulator**. PC 는 Local Runner 로 최고 성능,
모바일은 Cloud Runner 로 같은 경험.

## 진행

- [x] Local Runner (`tools/runner/server.cjs`) — C·C++·Java·Go·Rust 실제 컴파일러
- [x] Docker 격리 (`tools/runner/Dockerfile`) — network none · 메모리 · pids 제한
- [x] 앱의 127.0.0.1 자동 탐지 + 실행 패널 (기존 352문항에서 열림)
- [x] `POST /execute` 통일 계약 — 상태값 success/compile_error/runtime_error/timeout/rejected
- [x] `POST /test` 테스트 모드 — go test · cargo test · gcc/g++ 링크 실행 (테스트를 번역하지 않는다)
- [ ] 한 줄 실행 (npx / docker run) + 앱 안내에 복사 버튼
- [ ] Cloud Runner (API Gateway + Docker Worker)
- [ ] 실행 경로 배지 (내장/로컬/클라우드)
- [ ] 언어별 6유형 확장
- [ ] 언어별 프로젝트 5종
