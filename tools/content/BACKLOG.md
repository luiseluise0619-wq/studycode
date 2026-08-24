# 남은 콘텐츠 배치 큐

## 상태: 수량 목표는 전부 달성했다 (2026-08)

이 파일의 예전 완료 기준이었던 **"모든 트랙 exec ≥ 10%"** 는 달성됐습니다.
가장 낮은 트랙이 react 12.0% 이고, 34개 트랙 모두 10% 를 넘습니다.
`docs/CONTENT_POLICY.md` 의 유형별 목표와 비율 하한도 모두 넘겼습니다.

```
choice 6,259 (상한 없음) · input 1,878/1,500 · code 2,438/2,000 · debug 1,013/1,000
review 883/800 · log 513/500 · sim 500/500 · arch 158/150      → 남은 총량 0
비율: choice 49.7% · input 14.9% · exec 24.5% · review 6.6% · log 4.1%   → 전부 달성
```

log 은 45차에서 919 → 373 으로 줄었습니다. 서비스 이름과 시각만 바꾼 <b>복제가 546개</b>
있었기 때문입니다. 그 자리를 새 문항 140개로 메워 513 입니다 — 비어 있던 다섯 트랙
(ml·mleval·react·web·ai) 60개와, 복제를 걷어내며 크게 줄어든 여덟 트랙
(java·python·javascript·go·rust·c·security·backend) 80개입니다.
**수를 채우려고 이름만 바꿔 찍어내지 마세요** — `tests/engine.test.cjs` 가 뼈대나
해설이 같은 문항을 실패로 잡습니다.

이 수치들은 이제 **진행률 보고가 아니라 회귀 검사**입니다. `tests/app.test.cjs` 가
아래 넷을 실패로 잡으므로, 콘텐츠를 지우거나 `cat`·`t` 값을 잘못 바꾸면 CI 가 막습니다.

- 여덟 유형이 목표 아래로 내려가지 않는다
- 다섯 갈래 비율 하한을 지킨다
- 모든 트랙에 디버깅 문항이 있다
- 모든 트랙이 실행형 10% 이상이다

**그러므로 이제부터는 "몇 개 더" 가 아니라 "무엇이 비어 있는가" 로 고릅니다.**

---

## 지금 실제로 비어 있는 칸

트랙 × 유형 표에서 0 인 칸입니다. 숫자 목표는 이미 채웠으므로, 여기서 고를 때도
판정 기준은 언제나 *"이건 직접 해 봐야 아는가"* 입니다 — 표를 채우려고 넣지 마세요.

| 유형 | 0 인 트랙 |
|---|---|
| review | arch arduino cs dbt dl math mobile stat |
| log | algo arch arduino code compiler cs dbt dl fp math mobile numpy pandas php stat |
| (log 은 어울리는 트랙을 모두 채웠습니다 — 남은 칸은 대부분 억지입니다) | |
| arch(설계 배치) | algo arduino c code compiler cpp cs dbt dl fp go java javascript math ml mleval mobile numpy pandas php python react rust stat |

세 유형 모두 **어울리는 트랙에만** 넣어야 합니다.

- `log` 는 **운영 중 남는 기록을 읽고 원인을 짚는** 트랙에서만 뜻이 있습니다.
  45차에 ml·mleval·react·web·ai 를 채웠고(각 12), 남은 칸은 대부분 억지입니다 —
  math·fp·cs 에 로그를 넣을 이유는 없습니다. numpy·pandas 정도가 그나마 후보입니다.
- `review` 는 **남의 코드에 한 줄 지적을 다는** 형태라 코드가 있는 트랙에 맞습니다.
  45차에 algo·code·compiler·fp·php·security 를 채웠고(각 8), 남은 칸은 코드가 거의
  없는 트랙이라 대부분 억지입니다 — mobile 정도가 그나마 후보입니다.
- `arch` 는 **배치도를 직접 그리는** 유형이라 설계가 실제로 갈리는 트랙에만 —
  ml(학습 파이프라인), mleval(평가 파이프라인), pandas/numpy 는 어울리지 않습니다.

## 도구 (전부 검증기가 있습니다)

| 유형 | 작성 → 검증 → 주입 |
|---|---|
| JS 실행형·디버깅 | `dbg_*.cjs` → `ver_dbgjs.cjs` → `inj_jsexec.cjs` |
| 파이썬 실행형·디버깅 | `dbg_*.cjs` → `ver_dbgpy.cjs` → `inj_pyexec.cjs` |
| PHP 실행형·디버깅 | `dbg_php.cjs` → `ver_dbgphp.cjs`(러너 필요) → `inj_phpexec.cjs` |
| 단답형 | `in_*.cjs` → `ver_input.cjs` + `chk_predict{,_py,_php}.cjs` → `inj_qa.cjs` |
| 로그 분석 | `log_*.cjs` → `ver_log.cjs` → `inj_qa.cjs` |
| 코드 리뷰 | `rev_*.cjs` → `ver_review.cjs` → `inj_qa.cjs` |
| 이론 교체 | — → `inj_theory.cjs` |
| 시뮬레이션 | `sim_*.cjs` → `ver_simgen.cjs` → `inj_sim.cjs` |

러너가 필요한 유형(C·C++·Java·Go·Rust·PHP)은 먼저 띄웁니다.

```
node tools/runner/server.cjs &      # http://127.0.0.1:8787
curl -s 127.0.0.1:8787/health       # 쓸 수 있는 언어 확인
```

**중복 금지** — 새 배치를 쓰기 전에 같은 주제가 이미 있는지 확인하세요.
검증은 통과해도 학습 가치가 없습니다.

```
grep -h 'k:"' tools/content/dbg_*.cjs | sort     # 디버깅 주제
grep -h 'k:"' tools/content/in_*.cjs  | sort     # 단답 주제
grep -h 'fn:"' tools/content/exec_*.cjs | sort   # 실행형 함수 이름
```

## 마무리 검사

```
node tests/engine.test.cjs                                                    # 163
PLAYWRIGHT_CHROMIUM=... node tests/app.test.cjs                               # 145
```

두 벌은 따로 돌리세요 — 한 명령으로 묶으면 메모리가 모자라 죽습니다(exit 137).

### 전수 재검증 (`ver_all.cjs`)

배치 검증기는 **넣을 때 한 번** 볼 뿐입니다. 그 뒤에 보기 문구를 손보거나 주입기를
고치면 앱에서만 깨지는 문항이 조용히 생기므로, `data/t-*.js` 에 **실제로 저장된 값**을
다시 채점하는 검증기를 따로 둡니다.

```
node tools/content/ver_all.cjs js         # 673문항 · 1.2초 — engine 테스트에 편입돼 있다
node tools/content/ver_all.cjs py         # 526문항 · 몇 분
node tools/runner/server.cjs &            # 컴파일 언어와 php 는 러너가 필요하다
node tools/content/ver_all.cjs c          # c 67 · cpp 67 · java 70 · go 81 · rust 11 · php 36
node tools/content/ver_all.cjs            # 전부
```

러너가 안 떠 있거나 그 툴체인이 없으면 해당 갈래만 건너뛰고 몇 개를 건너뛰었는지
알립니다. 컴파일 언어는 한 문항에 몇 초씩 걸리므로 **콘텐츠를 크게 손댄 뒤에만**
돌리면 됩니다.

## 찍어서 맞힐 수 있는 길이 없는가

문항을 넣을 때마다 이것부터 봅니다. 37~39차에서 보기 길이·맺음말·단정어를 갚았고,
44~45차에서 자리를 갚았습니다. 지금 남아 있는 빚은 하나입니다.

- **로그의 '첫 WARN 이상' 적중 54.4%** — 원인이 대개 첫 경고 줄이다.
  45차에 새로 쓴 140문항은 원인을 INFO 에 두고 앞에 붉은 청어를 깔아 1/140 이다.
  옛 문항은 줄을 지어내지 않고는 못 고치므로, **새로 쓸 때** 갚는다.
  `ver_log.cjs` 가 배치마다 60% 상한을 건다.

### 리뷰·로그 배치를 쓸 때

두 유형은 실행으로 채점할 수 없으므로 검증기가 **찍는 길**을 대신 막습니다.

```
node tools/content/ver_review.cjs ./tools/content/rev_algo.cjs
node tools/content/ver_log.cjs    ./tools/content/log_ml.cjs
```

`ver_review.cjs` 가 보는 것 — 결함 자리 쏠림, 가장 긴 보기가 결함인 비율(기대치 ±25%p),
'…해야 한다' 로 끝나는 보기가 결함에만 몰렸는지, 해설의 자리 표현, 기존 데이터와의 중복.
**디스트랙터도 길고 처방형으로** 써야 통과합니다 — 그것이 곧 좋은 오답이기도 합니다.

## 이모지를 쓰지 않는다 (47차)

해설·물음·보기·코드 어디에도 장식용 그림 문자를 넣지 않습니다. 문단을 열 때는
이름표를 낱말로 씁니다 — `원인:` `해결:` `재발 방지:` `개념:` `실무:`.

남겨도 되는 기호는 뜻을 나르는 것들뿐입니다: `→ ← ↑ ↓ ↔`, `① ② ③`, `✓ ✗ ✕`,
`▶ ▾ ● ○ □`. 판단은 `tools/content/noemoji.cjs` 한 곳에 있습니다.

`ver_log` · `ver_review` · `ver_input` · `ver_arch` 가 배치에서 이모지를 찾으면
실패시킵니다. 예전 배치를 다시 쓸 때는 먼저 훑어 주세요.

```
node tools/content/strip_emoji.cjs --tools --write   # 배치 원본
node tools/content/strip_emoji.cjs --write           # data/t-*.js
node tools/content/strip_emoji.cjs --html --write    # index.html
```

예외는 <b>이모지가 주제인 문항</b>뿐입니다(문자열 길이·접근성). 지우면 문제가
성립하지 않으므로 그대로 둡니다 — 지금 셋 있습니다.
