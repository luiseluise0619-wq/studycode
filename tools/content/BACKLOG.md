# 남은 콘텐츠 배치 큐

완료 기준: **모든 트랙 exec ≥ 10%** — "어떤 트랙도 읽기만으로는 통과할 수 없다".
숫자 목표(2000/1000/500)는 참고선일 뿐이고, 판정은 언제나 *"이건 직접 만들어 봐야 아는가"* 입니다.

현재 남은 양: **219문항 ≈ 19배치**. 한 배치 = 12문항 = PR 하나.

작성 계약·검증 명령·주입 절차는 기존 파일을 그대로 따릅니다.
본보기: `exec_sysd.cjs`(설계) · `exec_os2.cjs`(알고리즘) · `exec_npd.cjs`(라이브러리 의미) · `sim_zero.cjs`(시뮬)

```
node ver_exec_pygen.cjs ./exec_<주제>.cjs   # "0건 문제" 가 나와야 함
node inj_pyexec.cjs ./spec_<트랙>.cjs
node ladder.cjs                              # 역전 0
node ../../tests/engine.test.cjs             # 101 통과
```

**중복 금지** — 새 배치를 쓰기 전에 `grep -h 'fn:"' tools/content/exec_*.cjs | sort` 로
이미 있는 함수 이름을 확인하세요. 주제가 겹치면 검증은 통과해도 학습 가치가 없습니다.

---

## 우선순위 A — 큰 트랙의 큰 구멍

### 1·2. devops (+25, 2배치)
이미 있음: `exp_backoff` `token_bucket` `circuit_breaker` `weighted_rr` `consistent_hash`
`bump_semver` `mask_secrets` `rolling_update` `cidr_match` `log_rotate` `docker_cache` `quorum_lock`

후보: 카나리 판정(오류율 비교) · 에러 버짓 소진 계산 · blue-green 전환 순서 · 헬스체크
플래핑 억제(연속 N회) · 배포 잠금과 동시 배포 차단 · 의존성 그래프 배포 순서(위상 정렬) ·
리소스 요청/제한과 QoS 등급 · HPA 목표 사용률에서 목표 레플리카 수 · PDB 위반 판정 ·
크론 표현식 다음 실행 시각 · 로그 샘플링 비율 결정 · 아티팩트 보존 정책(GC)

### 3·4. backend (+24, 2배치)
이미 있음: exec 40개(대부분 code/testDoc). `grep` 으로 확인 필수.

후보: HTTP 캐시 헤더 판정(ETag·max-age·stale-while-revalidate) · 커서 페이지네이션 토큰
인코딩/디코딩 · 부분 응답(Range) 처리 · 멀티파트 경계 파싱 · 조건부 요청(If-Match) 충돌 ·
API 버전 협상 · 요청 서명 검증(HMAC + 타임스탬프 창) · 업로드 재개(청크 병합) ·
웹훅 서명과 재시도 · 배치 API 부분 실패 응답 · 응답 압축 선택(Accept-Encoding q값) ·
트랜잭션 격리 수준별 결과

### 5·6. react (+24, 2배치)
**주의: py 로 쓰면 어색합니다.** `react` 유형(JSX)이나 JS `code`(testDoc) 로 쓰세요.
`data/t-react.js` 의 기존 `react` 유형 문항을 본보기로 삼으세요.

후보: 상태 갱신 배칭과 함수형 갱신 · 의존성 배열 누락으로 인한 stale closure ·
`useEffect` 정리 함수와 경쟁 조건(취소 토큰) · 리스트 key 로 인한 상태 오염 ·
제어/비제어 컴포넌트 전환 · `useMemo` 가 도움이 안 되는 경우 · 컨텍스트 리렌더 범위 ·
리듀서로 상태 전이 정규화 · 폼 검증 상태 기계 · 낙관적 UI 와 롤백 ·
가상 스크롤 윈도 계산 · 디바운스/스로틀 훅

### 7·8. sysd (+23, 2배치)
이미 있음: `window_count` `single_flight` `lfu_keys` `idempotent` `fanout_cost` `route_read`
`bloom` `saga_compensate` `dedupe_consume` `capacity` `moved_keys` `hot_key_split`

후보: 벡터 클럭 비교(동시/선후) · CRDT G-Counter 병합 · 리더 선출 임기와 투표 ·
gossip 전파 라운드 수 · 백프레셔 큐 상한과 드롭 정책 · 우선순위 큐 기아 방지 ·
멀티리전 쓰기 충돌 해결(LWW vs 병합) · 읽기 복구(read repair) · 힌티드 핸드오프 ·
TTL 기반 캐시 계층 승격 · 요청 헤징(hedged request) 꼬리 지연 · 배압 신호 전파

### 9·10. go (+21, 2배치)
**러너 필요** — `rt` 유형(실제 `go test`)입니다. Jules VM 에 Go 툴체인이 없으면 건너뛰세요.
본보기: `data/t-go.js` 의 `rt` 문항, 러너 계약은 `tools/runner/server.cjs` 의 `TESTS.go`.

후보: 채널 방향 타입 · `select` 기본절과 논블로킹 · 컨텍스트 취소 전파 · `sync.Once` ·
워커 풀과 결과 수집 순서 · 슬라이스 재할당과 공유 배열 · `defer` 인자 평가 시점 ·
인터페이스 nil 과 타입 있는 nil · 에러 래핑과 `errors.Is/As` · 뮤텍스 vs 채널 선택 ·
`sync.Map` 이 맞는 경우 · 고루틴 누수 탐지

---

## 우선순위 B — 중간 규모

### 11. ai (+10) + dl (+3)
이미 있음(ai): `softmax` `cross_entropy` `top_k_filter` `nucleus` `bpe_merge` `chunk_with_overlap`
이미 있음(dl): `layer_norm` `adam_step` `lr_schedule` `dropout_scale` `attention_weights` `conv1d`

후보(ai): 코사인 유사도 top-k 검색 · MMR 재순위 · 프롬프트 토큰 예산 배분 · 컨텍스트
윈도 초과 시 잘라내기 전략 · 함수 호출 인자 검증 · 스트리밍 델타 병합 · 반복 페널티 ·
정지 시퀀스 처리 · 임베딩 정규화와 내적 · 청크 중복 제거
후보(dl): 배치 정규화 추론 시 이동 평균 · 가중치 감쇠 vs L2 · 기울기 클리핑

### 12. net (+8) + ml (+8)
후보(net): 슬라이딩 윈도 흐름 제어 · 체크섬 계산 · MTU 와 분할 · ARP 캐시 ·
NAT 포트 매핑 · DNS 리졸버 캐시 TTL · HTTP/2 헤더 압축(HPACK 인덱스) · QUIC 연결 ID
후보(ml): 결측 대치 전략 비교 · 원-핫 vs 타깃 인코딩 누수 · 특성 중요도 순열 ·
학습곡선으로 과소/과대적합 판정 · 클래스 임계값 조정 · 앙상블 투표 · 조기 종료 ·
하이퍼파라미터 그리드 크기 계산

### 13. arch (+7) — **특수**
`arch` 트랙은 현재 exec 0 이고 `arch` 유형(설계 배치도) 위주입니다.
py 실행형이 어색하면 **`sim` 유형**으로 대체하세요: 캐시 계층 히트율 · 파이프라인 단계별
지연 누적 · 분기 예측 적중률 · 메모리 계층 접근 비용 · TLB 미스 · 명령어 스케줄링

### 14. mleval (+7) + numpy (+6)
이미 있음(mleval): `prf1` `roc_auc` `average_precision` `ece` `min_threshold_for_precision` `macro_micro_f1`
이미 있음(numpy): `broadcast_shape` `c_strides` `flat_index` `reduce_axis` `argsort_stable` `int8_add`

후보(mleval): 혼동행렬 다중 클래스 · 코헨 카파 · 리프트/게인 · 시간 분할 검증 ·
부트스트랩 신뢰구간(지표) · 모델 비교 유의성 · 라벨 노이즈 영향
후보(numpy): 마스킹과 `where` · 팬시 인덱싱 뷰/복사 · `einsum` 축 대응 · 누적 연산 ·
`clip` 과 포화 · 부동소수점 결합법칙 깨짐

### 15. php (+6) + compiler (+6)
이미 있음(php): 실행형 12개(러너 채점). 추가는 **py 가 아니라 php `rt`** 로 쓰세요.
후보(php): 배열 함수 조합 · 날짜/시간대 처리 · 스트림 필터 · 정규식 백트래킹 ·
`spl` 자료구조 · 직렬화 취약점
후보(compiler): 어휘 분석기 · 재귀 하강 파서 · 우선순위 등반 · 심볼 테이블 스코프 ·
상수 폴딩 · 3주소 코드 생성

### 16. cs (+5) + os (+5)
이미 있음(os): `fifo_faults` `lru_faults` `optimal_faults` `belady_anomaly` `sjf_avg_wait`
`round_robin` `blocked_forever` `best_fit` `translate` `sstf_distance` `inode_blocks` `ring_ops`

후보(cs): 유니온-파인드 경로 압축 · 트라이 접두사 검색 · 위상 정렬 결정성 ·
비트마스크 부분집합 · 이진 탐색 경계(lower/upper bound)
후보(os): 프로세스 상태 전이 · 시그널 처리 순서 · 파일 디스크립터 상속 · 복사-쓰기(COW) ·
슬랩 할당자

### 17. pandas (+5) + security (+5)
이미 있음(pandas): `merge_inner` `left_join` `group_agg` `ffill` `pivot` `rolling_mean`
후보(pandas): 중복 제거 기준 · 멀티인덱스 정렬 · `melt`(wide→long) · 카테고리 dtype ·
시간대 변환과 DST
후보(security): JWT 검증 순서(서명 → exp → aud) · 경로 정규화 우회 · 오픈 리다이렉트 ·
CORS 프리플라이트 판정 · 비밀번호 정책 엔트로피

### 18. fp (+5) + arduino (+4) + math (+4)
후보(fp): 커링과 부분 적용 · 트랜스듀서 합성 · 지연 평가 스트림 · 불변 갱신(렌즈) · 꼬리 재귀 변환
후보(arduino): 디바운싱 · PWM 듀티 계산 · ADC 값 → 물리량 변환 · 밀리스 오버플로 안전 비교
후보(math): 모듈러 역원 · 유클리드 호제법 · 조합 계산 오버플로 회피 · 부동소수점 비교

### 19. c (+4) + dl(잔여) + dbt (+2) + mobile (+2)
c 는 **러너 필요**(`rt`). 없으면 건너뛰고 나머지만 채우세요.
후보(dbt): 증분 모델 갱신 판정 · 테스트 심각도 분류
후보(mobile): 생명주기 상태 복원 · 오프라인 큐 동기화

---

## 부수 목표 — 시뮬레이션 (273 남음, 선택)

시뮬이 0개인 트랙: `arch` `arduino` `dbt` `go` `mobile` `c` `cpp` `java` `python` `rust` `code`

시뮬은 **되감아 보는 것이 실제로 이해를 바꾸는 주제**에만 쓰세요. 표를 채우고 끝나는
주제는 실행형이 낫습니다. 좋은 후보:
- `python` — GIL 하에서 스레드가 겹치는 구간 / 참조 카운트와 순환 참조
- `java` — GC 세대 승격 / JIT 워밍업 구간
- `c` — 스택 프레임 쌓임과 되감기 / 힙 단편화
- `go` — 고루틴 스케줄러의 M:N 배정 / 채널 블로킹
- `arch` — 캐시 계층 히트율 / 파이프라인 스톨

작성 계약은 `sim_zero.cjs` 와 `ver_simgen.cjs` 를 따릅니다. **결정적이어야 합니다** —
`Math.random` · `Date.now` · `setTimeout` · `async` 금지.

---

## 진행 기록

| 배치 | 트랙 | 문항 | 상태 |
|---|---|---|---|
| — | stat | 12 | 완료 (Jules) |
| — | devops #1 | 12 | 완료 (Jules) |
| — | sysd #1 | 12 | 완료 |
| 1~19 | 위 목록 | 219 | 대기 |
