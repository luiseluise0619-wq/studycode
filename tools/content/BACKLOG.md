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
44~45차에서 자리를, 48차에서 로그의 등급·길이를 갚았습니다. **지금 남은 빚은 없습니다.**

로그 문항은 여섯 가지 규칙으로 잽니다 (`node tools/content/ver_logguess.cjs`).
기준선은 *아무 줄이나 찍었을 때* — 7줄짜리면 14% 입니다.

```
로그 513문항 · 아무 줄이나 찍기 13.3%
  첫 WARN 이상  8.4%   첫 WARN 직전 17.3%   마지막 INFO 14.8%
  최고 등급     1.0%   가장 긴 줄   22.4%   가장 짧은 줄 0.8%   한 자리 34.5%
```

`--track` 은 트랙별로, `--list <트랙>` 은 고쳐야 할 문항을 짚어 줍니다.
`tests/app.test.cjs` 가 같은 규칙으로 **기준선 +15%p** 를 넘으면 실패시킵니다.
기준선보다 낮은 쪽은 막지 않습니다 — 넘치면 "읽지 않아도 맞힌다" 이지만
모자라면 "그 줄 하나를 후보에서 뺀다" 일 뿐이라 힘이 훨씬 약합니다.

로그를 새로 쓸 때 지킬 것:

- 원인 줄을 **첫 경고로 두지 않는다.** 앞에 무관한 경고를 한 줄 깔거나
  (인증서 만료 예고, 로그 회전 지연 같은 것), 원인을 INFO 로 조용히 적는다.
- 원인을 INFO 로 낮췄다면 **그 뒤에도 평온한 줄을 남긴다.** 안 그러면
  '경고 직전 줄' 과 '마지막 INFO' 가 새 정답 자리가 된다.
- 원인 줄에 **해설을 달지 않는다.** 로그는 자기를 설명하지 않는다. 대신 증상 줄에
  실제 로그가 남길 세부(파일·줄 번호, 수치, 영향 범위)를 적어 길이를 고르게 한다.
- 이미 실린 줄을 고칠 때는 `tools/content/fix_log.cjs` 를 씁니다 (끼우기·맞바꾸기·덧붙이기).
  시각이 거꾸로 가면 도구가 막습니다.

### 리뷰·로그 배치를 쓸 때

두 유형은 실행으로 채점할 수 없으므로 검증기가 **찍는 길**을 대신 막습니다.

```
node tools/content/ver_review.cjs ./tools/content/rev_algo.cjs
node tools/content/ver_log.cjs    ./tools/content/log_ml.cjs
```

`ver_review.cjs` 가 보는 것 — 결함 자리 쏠림, 가장 긴 보기가 결함인 비율(기대치 ±25%p),
'…해야 한다' 로 끝나는 보기가 결함에만 몰렸는지, 해설의 자리 표현, 기존 데이터와의 중복.
**디스트랙터도 길고 처방형으로** 써야 통과합니다 — 그것이 곧 좋은 오답이기도 합니다.

실린 리뷰 문항 전체는 `ver_revguess.cjs` 로 잽니다. 49차에 883문항 중 84.9% 에서
가장 긴 보기가 결함이었고, 평균보다 긴 보기를 전부 찍는 것만으로 네 문항 중 하나를
통째로 맞힐 수 있었습니다. 지금은 이렇습니다.

```
리뷰 883문항 · 아무 보기나 결함이라 찍으면 40.7%
  가장 긴 보기가 결함 35.0%   길이만으로 문항 완주 1.7% (보기 적중 64.7%)
  처방형 말투가 결함 45.9%    자리별 최고 41.3%
```

`--need <트랙>` 은 어느 정상 보기를 얼마나 늘려야 하는지, `--up <트랙>` 은 반대로
결함 쪽을 늘려 되돌릴 문항을 한 줄씩 찍어 줍니다. 고칠 때는 `fix_review.cjs` 를 씁니다.
**정상 보기를 짧은 승인문으로 두지 마세요** — 그럴듯하지만 틀린 지적을 같은 밀도로
쓰는 것이 길이 단서를 없애는 유일한 방법이고, 그것이 곧 좋은 오답입니다.

`ver_log.cjs` 가 보는 것 — 시간 순서, 원인 줄의 자리(첫 줄·마지막 줄 금지, 배치 안 45% 상한),
'첫 WARN 이상' 적중 60% 상한, **'가장 긴 줄' 적중 기준선 +25%p 상한**, 유일한 WARN 이 정답인
문항, 뼈대 복제, 이모지.

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

## 실행형(code) 문항을 새로 쓸 때 (50차)

`ver_core.cjs` 가 인자로 준 배치 파일을 봅니다. 반드시 저장소 루트에서 부르세요.

```
node tools/content/ver_core.cjs ./tools/content/algo_dp.cjs
cd tools/content && node inj_jsexec.cjs ./spec_algo_dp.cjs
```

배치 한 문항의 모양:

```js
{ track: "algo", k: "짧은 제목 · 함수명", cat: "internals",
  q: "무엇을 돌려주는지 · 경계는 무엇인지 (HTML 가능)",
  src: "고장난 시작 코드 — 테스트를 하나 이상 떨어뜨려야 한다",
  sol: "참조 해답 — 28줄 이내 · var 금지 · console.log 금지",
  tests: [["호출식", "기댓값"], ...4개],
  edge:  [["호출식", "기댓값"], ...2개],
  ex: "해설 — 세 문단 이상, \n 으로 나눈다" }
```

기댓값은 `eval("(" + 기댓값 + ")")` 로 평가한 뒤 `JSON.stringify` 로 견줍니다.
그래서 **객체를 돌려주는 문제는 피합니다** — 키 순서가 다르면 옳은 답이 틀립니다.
배열·숫자·불리언·문자열로 답이 나오게 문제를 설계하세요. 문자열 기댓값은
`'"user_name"'` 처럼 따옴표를 안에 넣습니다.

해답의 지역 변수 이름이 채점 하네스와 겹치면 안 됩니다. 예약된 이름은
`SRC TS EG PF esc sh eq P row Cp Ch Ep Eh perfScore perfMs perfOk qr qp qScore
comps impl PG gate gcol gtxt bar parts eh ph qn __out` 입니다.

해설에는 **왜 다른 방법이 틀리는가**를 함께 씁니다. 반례가 되는 입력을
테스트에 실제로 넣고, 해설에서 "몇 번째 테스트가 그 자리" 라고 가리키면
학습자가 실패를 보고 배웁니다. 유닛 제목은 `직접 구현 —` 으로 시작해야
'해 보는 유닛이 마지막' 규칙(TAILU)을 만족합니다.
