# 테스트

`node tests/vibe-projects.test.cjs`는 새 완성 앱 5개의 25개 예시 풀이와 미완성 초안, 누적 동작 검사, 실제 편집·개념 확인·파일 다운로드, 내보낸 앱의 저장·복원, 손상된 저장 형식, 미리보기와 채점 데이터 분리, 독립 확장 기록과 모바일 화면을 검사합니다. Windows에서는 Edge를 사용하고 다른 환경에서는 설치된 Playwright Chromium을 사용합니다. `PLAYWRIGHT_CHROMIUM`으로 실행 파일을 지정할 수 있습니다.

`index.html` 은 배포되는 그 파일 하나이므로, 테스트도 **사본이 아니라 그 파일을 직접 읽어** 검사합니다.

```bash
node tests/engine.test.cjs     # 브라우저 불필요 · 1초 이내
node tests/app.test.cjs        # playwright 필요 (없으면 자동 스킵)
node tests/learning-path.test.cjs
node tests/study-flow.test.cjs
node tests/study-quality.test.cjs
node tests/code-literacy.test.cjs
node tests/build-worker.test.cjs
node tests/practice-reference.test.cjs
node tests/sql-practice.test.cjs
node tests/dom-practice.test.cjs
node tests/vibe-challenges.test.cjs
node tests/vibe-journey.test.cjs
node tests/vibe-reference.test.cjs
node tests/vibe-lab.test.cjs
node tests/service-worker.test.cjs
node tests/vibe-cache-migration.test.cjs
```

## 작은 앱 실습

`vibe-challenges.test.cjs`는 새 상황 18개 변형과 독서 앱 3단계의 예시 풀이를 실제 화면에서 실행합니다. 검사 141개를 통과하고, 오류 초안 21개는 실패해야 합니다.

`vibe-journey.test.cjs`는 도움 기록 유지, 변형 전환, 독립 적용과 복습 날짜, 한 줄 편집에서 전체 코드 보존, 실제 HTML 다운로드와 저장 복원, 채점 데이터 격리, 후속 프로젝트·Git 연결과 휴대폰 메뉴를 확인합니다.

`vibe-reference.test.cjs`는 여섯 앱의 초안과 12개 예시 풀이를 실제 화면 검사기로 실행합니다. 44개 요구사항을 확인하고, 초안은 실패하는지, 최종 풀이가 첫 단계의 수정도 보존하는지 확인합니다.

`vibe-lab.test.cjs`는 홈에서 시작해 직접 입력·수정·검사·뜻 확인·메모·이어 하기까지 수행합니다. 비동기 검사 중 편집 잠금, 앱 변경 뒤 오래된 결과 무시, 문법·무한 반복·비동기 오류와 복구, 대화상자 초점·휴대폰·야간 모드도 확인합니다.

`vibe-cache-migration.test.cjs`는 임시 로컬 서버에서 이전 서비스워커와 오래된 JS 캐시를 재현합니다. 새 버전 코드가 섞이지 않는지, 완료 기록을 유지하는지, 갱신한 앱이 오프라인으로 다시 열리는지 확인합니다. 서버는 검사 뒤 닫습니다.

`service-worker.test.cjs`는 첫 오프라인 재실행에서 셸에 미리 받은 JS를 읽는지, 이전 레슨 캐시와 온라인 갱신을 보존하는지 확인합니다.

## `engine.test.cjs`

추가 검사는 배포 파일의 학습 추천·문제 채점·복습 날짜·초안 저장·키보드 탐색과 용어 설명을 확인합니다. 참조 코드 검사는 JavaScript 945개, SQL 201개, HTML·React 82개의 공급된 정답 예제를 실제 브라우저 실행기로 확인합니다. 공급된 정답이 없는 문항과 모든 설명의 사실관계까지 검증하는 것은 아닙니다.

`index.html` 안의 Git 시뮬레이터 엔진·미션 정의를 그대로 뽑아 실행합니다.

- 명령 58종의 정상 경로와 **실패 경로** (더러운 트리 전환 거부, 미해결 충돌 커밋 거부, non-fast-forward 거절, detached HEAD 제약, 미지원 명령 안내)
- 병합 3-way·충돌·abort, 리베이스 충돌·continue·abort, reset 3종의 차이, revert·cherry-pick·stash·pull
- 미션 12개 각각에 대해 세 가지를 확인합니다
  - 시작 상태에서 목표가 **거짓**인가 (아니면 미션이 성립하지 않음)
  - `status`·`log` 같은 **조회 명령만으로 통과되지 않는가**
  - 정답 경로를 실행하면 목표가 **참**이 되는가

## `app.test.cjs`

실제 브라우저에서 앱을 열고 확인합니다.

- **콘텐츠 무결성** — 모든 레슨의 이론(요약·본문 2절 이상·예제 코드·요점), 선택형의 보기 4개·정답 인덱스·중복 보기(공백이 정답인 문항은 앱의 렌더 규칙과 동일하게 예외 처리), 로그 문항 구조, 트랙별 분야 소개 존재
- **진도 키 안정성** — 옛 인덱스 키가 안정 ID로 이관되는가, 그리고 **유닛을 새로 끼워 넣어도 완료 표시가 같은 레슨에 남는가**. 콘텐츠를 추가할 때마다 확인해야 하는 회귀입니다
- **역량 점수** — 표본 부족 시 점수를 내지 않는가, 쉬운 문제만 맞힌 사람에게 상한이 있는가, 많이 풀었지만 틀린 사람이 낮게 나오는가, 전부 틀렸을 때 점수가 오르지 않는가
- **레슨 진행** — 이론 → 난이도 배지 → 끝까지 진행 → 완료 화면, 그리고 응답이 근거로 기록되는가
- **주요 화면** — 분야 소개·성장 로드맵·학습 코치·업적·프로필·Git 시뮬레이터가 열리는가
- 페이지 에러 0 (`file://` 에서 나는 아이콘 404는 제외)

## 환경 변수

| 변수 | 용도 |
|---|---|
| `PLAYWRIGHT_CHROMIUM` | 크로미움 실행 파일 경로를 직접 지정할 때 |
