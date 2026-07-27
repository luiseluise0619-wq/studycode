# 콘텐츠 소스 대장 (사용자가 보낸 저장소)

이 표에 있는 저장소는 **하나도 남기지 않고** 문항으로 환산한다. 상태가 `대기` 인 줄이
남아 있으면 작업이 끝난 것이 아니다. 산출이 0 인 소스는 반드시 **이유**를 적는다.

## 원칙

- **정답은 소스에서 나온다.** 실제 버그 데이터셋은 diff 가 정답이고, 코드 스니펫은
  실행 결과가 정답이다. 내가 판단해서 적지 않는다
- **코드는 인용 범위로만.** 문항에 들어가는 코드는 수십 줄을 넘기지 않고, 출처를
  문항에 표기한다 (예: `pandas #42 · BugsInPy`). 프로젝트별 라이선스(MIT·BSD·Apache)를
  추출기가 확인한다
- **해설은 전부 새로 쓴다.** 원인·왜 테스트가 못 잡았나·재발 방지
- 기존 검증 기준은 그대로다 — 실행형은 시작 코드 미통과·해답 통과, 리뷰는 정답 집합
  통과·오탐 추가 시 실패, 로그는 원인 한 줄·인과 순서

## 대장

| # | 저장소 | 쓰임 | 만들 유형 | 예상 | 상태 |
|---|---|---|---|---|---|
| 1 | soarsmu/BugsInPy | 파이썬 실제 버그 501개 (버그·수정·테스트) | review + debug | 200~350 | 클론 완료 · 추출기 대기 |
| 2 | rjust/defects4j | 자바 실제 버그 (버그·수정·테스트) | review + debug | 300~500 | 대기 |
| 3 | Chalarangelo/30-seconds-of-code | 짧고 자족적인 JS 스니펫 | input(출력예측) · code | 300~500 | 대기 |
| 4 | Asabeneh/30-Days-Of-React | React 예제 | react exec · review | 80~150 | 대기 |
| 5 | airbnb/javascript | 스타일 가이드의 '왜' | review | 100~150 | 대기 |
| 6 | donnemartin/system-design-primer | 설계 주제·트레이드오프 | arch · review | 100~150 | 대기 |
| 7 | TheAlgorithms | 알고리즘 구현 | sim · code | 200~300 | 대기 |
| 8 | codecrafters-io/build-your-own-x | 만들어 보는 프로젝트 주제 | project(빌드 랩 Day) | 20~40 Day | 대기 |
| 9 | practical-tutorials/project-based-learning | 프로젝트 주제 | project | 20~40 Day | 대기 |
| 10 | Devinterview-io/python-interview-questions | 면접 질문 주제 | review · input | 80~120 | 대기 |
| 11 | python/cpython | 언어 의미론 근거 (실제 동작 대조) | input 검증 근거 | — | 대기 |
| 12 | openjdk/jdk | 자바 의미론 근거 | input 검증 근거 | — | 대기 |
| 13 | rust-lang/rust | 러스트 진단 메시지·소유권 사례 | input · debug | 60~100 | 대기 |
| 14 | facebook/react | 렌더링·Hook 규칙 근거 | react review | 40~80 | 대기 |
| 15 | nodejs/node | 이벤트 루프·스트림 사례 | js debug · log | 60~100 | 대기 |
| 16 | postgres/postgres | 실행 계획·격리 수준 | sql review · sim | 60~100 | 대기 |
| 17 | mysql/mysql-server | 인덱스·락 차이 (PG 와 대조) | sql review | 40~80 | 대기 |
| 18 | redis/redis | 자료구조·만료·영속화 | backend review · log | 40~80 | 대기 |
| 19 | moby/moby | 컨테이너 동작·장애 | devops log · review | 60~100 | 대기 |
| 20 | prometheus/prometheus | 지표·경보 설계 | devops review · log | 40~80 | 대기 |
| 21 | spring-projects/spring-boot | 자동 설정·트랜잭션 함정 | java review · debug | 60~100 | 대기 |
| 22 | spring-projects/spring-framework | DI·AOP·프록시 함정 | java review | 40~80 | 대기 |
| 23 | npm/cli | 의존성·잠금 파일 사고 | devops log · review | 30~60 | 대기 |
| 24 | tidwall/gjson | Go API 설계 사례 | go review | 20~40 | 대기 |
| 25 | swisskyrepo/PayloadsAllTheThings | 공격 페이로드 | security review · log | 80~120 | 대기 |
| 26 | sbilly/awesome-security | 보안 주제 색인 | security 커버리지 점검 | — | 대기 |
| 27 | qazbnm456/awesome-web-security | 웹 보안 주제 색인 | web/security review | 40~80 | 대기 |
| 28 | vinta/awesome-python | 파이썬 생태계 색인 | python 커버리지 점검 | — | 대기 |
| 29 | kamranahmedse/developer-roadmap | 로드맵 | 트랙·유닛 구성 점검 | — | 대기 |
| 30 | nilbuild/developer-roadmap | 위의 포크 | 위와 동일 (중복) | — | 중복 확인 필요 |
| 31 | ossu/computer-science | CS 커리큘럼 | cs 트랙 구성 점검 | — | 대기 |
| 32 | freeCodeCamp/freeCodeCamp | 커리큘럼·연습 | 트랙 구성 점검 | — | 대기 |
| 33 | TheOdinProject/curriculum | 커리큘럼 | 트랙 구성 점검 | — | 대기 |
| 34 | microsoft/Web-Dev-For-Beginners | 웹 기초 커리큘럼 | web 커버리지 점검 | — | 대기 |
| 35 | microsoft/monaco-editor | 에디터 | **이미 사용 중** (앱 에디터) | — | ✅ 반영됨 |
| 36 | felixhao28/JSCPP | 브라우저 C++ 인터프리터 후보 | 실행 엔진 후보 | — | ✅ 측정 후 기각 (의미론 오류, CONTENT_POLICY 기록) |
| 37 | kripken/emscripten | WASM 툴체인 (이슈 참조) | 실행 엔진 조사 | — | ✅ 조사 완료 (로컬 러너로 결론) |

## 커버리지 점검용 소스 (문항이 아니라 '빠진 주제 찾기')

29·31·32·33·34·26·28 은 문항을 뽑는 소스가 아니라 **우리 트랙에 빠진 주제가 있는지**
대조하는 용도다. 대조 결과 나온 빈칸은 다른 소스로 채운다. 이것도 '사용' 으로 친다.

## 진행 기록

- 2026-07-27: 대장 작성. BugsInPy 얕은 클론(7.6MB, 버그 501개) 확인.
