/* 넘파이 단답 15 — 모양·타입·뷰를 직접 적어 본다.
   검증:  node ver_input.cjs ./in_numpy.cjs
   출력값 대조:  node chk_predict_py.cjs ./in_numpy.cjs */
module.exports = [

{ track:"numpy", t:"input", cat:"internals", k:"모양을 바꾸면",
  q:"원소 여섯 개짜리 배열을 2행짜리로 다시 접으면 모양이 어떻게 될까요? 출력되는 값을 그대로 적으세요. (괄호와 쉼표 포함)",
  code:"import numpy as np\nprint(np.arange(6).reshape(2, 3).shape)",
  a:["(2, 3)", "2x3", "2행3열"],
  ex:"원소 개수가 같으면 모양만 바꿀 수 있습니다 — 데이터는 <b>그대로</b> 두고 보는 방식만 달라집니다.\n개념: 그래서 대개 <b>복사가 아니라 뷰</b>입니다. 값을 고치면 원본도 바뀝니다.\n실무: 한 축에 <code>-1</code> 을 주면 나머지에서 알아서 계산합니다 — <code>reshape(2, -1)</code> 처럼 쓰면 길이가 바뀌어도 코드를 안 고쳐도 됩니다." },

{ track:"numpy", t:"input", cat:"internals", k:"정수만 넣으면 무슨 타입",
  q:"파이썬 정수 리스트로 배열을 만들면 <code>dtype</code> 은 무엇이 될까요? 리눅스 기준 출력값을 그대로 적으세요. (영문+숫자)",
  code:"import numpy as np\nprint(np.array([1, 2, 3]).dtype)",
  a:["int64", "정수64"],
  ex:"플랫폼의 기본 정수 크기를 따릅니다. 리눅스·맥에서는 64 비트, 윈도우에서는 32 비트라 <b>같은 코드가 다르게 돕니다</b>.\n개념: 넘파이 배열은 파이썬 리스트와 달리 <b>모든 원소가 같은 타입</b>이라, 그 덕분에 메모리가 촘촘하고 계산이 빠릅니다.\n실무: 큰 정수를 다룬다면 넘침이 <b>조용히</b> 일어납니다 — 예외가 없으니 범위를 미리 확인하거나 <code>dtype</code> 을 명시하세요." },

{ track:"numpy", t:"input", cat:"internals", k:"영으로 채우면 무슨 타입",
  q:"<code>np.zeros(3)</code> 으로 만든 배열의 <code>dtype</code> 은 무엇일까요? 출력값을 그대로 적으세요. (영문+숫자)",
  code:"import numpy as np\nprint(np.zeros(3).dtype)",
  a:["float64", "실수64"],
  ex:"<code>zeros</code>·<code>ones</code>·<code>empty</code> 는 <b>실수</b>가 기본입니다. 정수 배열이 필요하면 <code>dtype=int</code> 를 적어야 합니다.\n개념: 이 기본값 때문에 인덱스 배열을 만들려다 실수 배열이 나와 오류가 나는 일이 흔합니다.\n실무: 정수 인덱스에는 <code>np.zeros(n, dtype=int)</code> 나 <code>np.arange</code> 를 쓰세요." },

{ track:"numpy", t:"input", cat:"internals", k:"모양이 서로 늘어날 때",
  q:"세로 벡터 <code>(3, 1)</code> 과 가로 벡터 <code>(1, 4)</code> 를 더하면 결과 모양은 어떻게 될까요? 출력값을 그대로 적으세요. (괄호와 쉼표 포함)",
  code:"import numpy as np\nprint((np.ones((3, 1)) + np.ones((1, 4))).shape)",
  a:["(3, 4)", "3x4", "3행4열"],
  ex:"길이가 1 인 축은 상대 쪽 길이만큼 <b>늘어나 맞춰집니다</b>(브로드캐스팅). 실제로 복사하지는 않습니다.\n개념: 규칙은 뒤 축부터 견주어 '<b>같거나 한쪽이 1</b>' 이면 통과입니다. 그렇지 않으면 오류입니다.\n실무: 의도치 않게 큰 배열이 만들어지는 사고가 여기서 납니다 — <code>(10000,1)</code> 과 <code>(1,10000)</code> 을 더하면 1 억 칸짜리가 됩니다." },

{ track:"numpy", t:"input", cat:"internals", k:"건너뛰며 자른 뒤의 합",
  q:"0 부터 9 까지의 배열에서 2 번 자리부터 8 번 자리 앞까지 <b>두 칸씩 건너뛰어</b> 고른 값들의 합은 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"import numpy as np\nprint(np.arange(10)[2:8:2].sum())",
  a:["12"],
  ex:"고른 값은 2, 4, 6 이라 합이 12 입니다 — 끝 자리 8 은 <b>포함되지 않습니다</b>.\n개념: 파이썬 슬라이스는 언제나 '<b>시작은 포함, 끝은 제외</b>' 입니다. 그래야 <code>a[:k]</code> 와 <code>a[k:]</code> 가 겹치지도 빠지지도 않습니다.\n실무: 이 규칙 덕분에 조각 길이가 <code>끝 - 시작</code> 으로 딱 떨어집니다 — 경계 계산이 훨씬 단순해집니다." },

{ track:"numpy", t:"input", cat:"internals", k:"잘라낸 조각을 고치면",
  q:"배열을 슬라이스로 잘라 낸 뒤 그 조각의 값을 고치면 <b>원본</b>은 어떻게 될까요? 아래 코드의 출력값을 적으세요. (숫자)",
  code:"import numpy as np\na = np.arange(5)\nb = a[1:3]\nb[0] = 99\nprint(a[1])",
  a:["99"],
  ex:"기본 슬라이스는 <b>복사가 아니라 뷰</b>라 같은 메모리를 가리킵니다. 파이썬 리스트 슬라이스가 복사인 것과 정반대입니다.\n개념: 뷰라서 큰 배열을 잘라도 메모리를 더 쓰지 않습니다 — 이 성질이 넘파이가 빠른 이유의 하나입니다.\n실무: 원본을 지키려면 <code>.copy()</code> 를 명시하세요. 반대로 <b>팬시 인덱싱</b>(정수 배열·불리언 마스크)은 언제나 복사라 원본이 안 바뀝니다." },

{ track:"numpy", t:"input", cat:"internals", k:"세 값의 평균",
  q:"<code>np.array([1, 2, 3])</code> 의 평균을 구하면 무엇이 출력될까요? 출력값을 그대로 적으세요. (소수점 포함)",
  code:"import numpy as np\nprint(np.array([1, 2, 3]).mean())",
  a:["2.0", "2"],
  ex:"정수 배열이어도 평균은 <b>실수</b>로 나옵니다.\n개념: 넘파이의 집계 함수는 결과 타입을 입력에 맞춰 승격시킵니다 — 정수의 합은 정수, 평균은 실수입니다.\n실무: 정수 나눗셈을 기대하고 짠 코드가 여기서 실수로 바뀌어, 인덱스로 쓰면 오류가 납니다." },

{ track:"numpy", t:"input", cat:"internals", k:"어느 축으로 접는가",
  q:"<code>[[1, 2], [3, 4]]</code> 를 <code>axis=0</code> 으로 더하면 첫 번째 값은 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"import numpy as np\nprint(np.array([[1, 2], [3, 4]]).sum(axis=0)[0])",
  a:["4"],
  ex:"<code>axis=0</code> 은 <b>행 방향으로 접는다</b>는 뜻이라 열끼리 더해집니다 — <code>1+3 = 4</code>.\n개념: '<b>그 축이 사라진다</b>' 고 외우면 헷갈리지 않습니다. <code>(2,2)</code> 에서 축 0 을 접으면 <code>(2,)</code> 가 남습니다.\n실무: 축을 반대로 잡는 실수는 정사각 행렬에서 티가 안 납니다 — 테스트 데이터는 <b>행과 열 수가 다른</b> 배열로 만드세요." },

{ track:"numpy", t:"input", cat:"internals", k:"대각선의 합",
  q:"<code>np.eye(3)</code> 의 대각합(trace)은 얼마일까요? 출력값을 그대로 적으세요. (소수점 포함)",
  code:"import numpy as np\nprint(np.eye(3).trace())",
  a:["3.0", "3"],
  ex:"단위행렬은 대각선만 1 이라 크기 <code>n</code> 이면 대각합이 <code>n</code> 입니다.\n개념: <code>eye</code> 는 실수 배열이라 결과도 실수입니다.\n실무: 대각합은 고윳값의 합과 같아, 행렬을 안 풀고도 성질을 가늠하는 데 쓰입니다 — 공분산 행렬의 대각합은 전체 분산입니다." },

{ track:"numpy", t:"input", cat:"internals", k:"등간격으로 나눈 두 번째 값",
  q:"0 과 1 사이를 <b>양 끝을 포함해</b> 다섯 점으로 나누면 두 번째 값은 얼마일까요? 출력값을 적으세요. (소수)",
  code:"import numpy as np\nprint(np.linspace(0, 1, 5)[1])",
  a:["0.25", ".25"],
  ex:"다섯 점이면 <b>간격이 넷</b>이라 0, 0.25, 0.5, 0.75, 1 입니다.\n개념: <code>arange</code> 는 <b>간격</b>을 주고 끝을 제외하지만, 이 함수는 <b>개수</b>를 주고 끝을 포함합니다 — 부동소수 오차로 마지막 점이 빠지는 사고를 피할 수 있습니다.\n실무: 그래프의 x 축이나 하이퍼파라미터 탐색 격자를 만들 때는 개수를 주는 쪽이 안전합니다." },

{ track:"numpy", t:"input", cat:"internals", k:"조건을 만족하는 개수",
  q:"<code>np.array([1, 2, 3]) &gt; 1</code> 의 결과를 더하면 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"import numpy as np\nprint((np.array([1, 2, 3]) > 1).sum())",
  a:["2"],
  ex:"비교 결과는 <code>True</code>/<code>False</code> 배열이고, 더하면 참인 개수가 됩니다.\n개념: 이 불리언 배열을 인덱스로 넣으면 조건에 맞는 원소만 골라냅니다(<b>불리언 마스크</b>) — 반복문 없이 거르는 표준 방법입니다.\n실무: 여러 조건을 엮을 때는 <code>and</code>·<code>or</code> 가 아니라 <code>&amp;</code>·<code>|</code> 를 쓰고 <b>괄호를 꼭</b> 치세요 — 우선순위가 비교 연산자보다 높습니다." },

{ track:"numpy", t:"input", cat:"internals", k:"배열이 차지하는 바이트",
  q:"64비트 정수 세 개짜리 배열이 데이터에 쓰는 바이트 수는 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"import numpy as np\nprint(np.array([1, 2, 3], dtype=np.int64).nbytes)",
  a:["24"],
  ex:"원소 하나가 8 바이트라 <code>3 × 8 = 24</code> 입니다.\n개념: 파이썬 리스트는 <b>객체 포인터</b>를 담아 원소마다 수십 바이트를 씁니다 — 넘파이가 메모리에서 압도적으로 유리한 이유입니다.\n실무: 큰 데이터는 <code>float32</code>·<code>int32</code> 로 낮추기만 해도 메모리가 절반이 됩니다. 정밀도가 정말 필요한지 먼저 따져 보세요." },

{ track:"numpy", t:"input", cat:"internals", k:"이어 붙인 뒤의 크기",
  q:"길이 2 인 배열과 길이 3 인 배열을 이어 붙이면 원소가 모두 몇 개일까요? 출력값을 적으세요. (숫자)",
  code:"import numpy as np\nprint(np.concatenate([np.ones(2), np.zeros(3)]).size)",
  a:["5"],
  ex:"단순히 이어 붙이므로 2 + 3 = 5 입니다.\n개념: 이 연산은 <b>새 메모리를 잡아 통째로 복사</b>합니다 — 반복문 안에서 하나씩 붙이면 <code>O(n²)</code> 가 됩니다.\n실무: 조각을 리스트에 모아 두었다가 <b>마지막에 한 번</b> 이어 붙이거나, 최종 크기를 알면 미리 잡아 두고 채우세요." },

{ track:"numpy", t:"input", cat:"internals", k:"가장 큰 값의 자리",
  q:"<code>np.array([3, 9, 2])</code> 에서 가장 큰 값이 있는 자리 번호는? 출력값을 적으세요. (숫자)",
  code:"import numpy as np\nprint(np.argmax(np.array([3, 9, 2])))",
  a:["1"],
  ex:"0 부터 세므로 두 번째 자리인 1 입니다. 값이 아니라 <b>자리</b>를 돌려줍니다.\n개념: 같은 최댓값이 여럿이면 <b>가장 앞</b> 자리를 줍니다.\n실무: 분류 모델의 예측 라벨을 뽑을 때 가장 많이 쓰는 함수입니다. 축을 안 주면 <b>평평하게 편</b> 기준의 번호가 나오니 배치 데이터에서는 <code>axis</code> 를 꼭 지정하세요." },

{ track:"numpy", t:"input", cat:"internals", k:"가로와 세로를 곱하면",
  q:"모양 <code>(3,)</code> 인 배열과 모양 <code>(2, 1)</code> 인 배열을 곱하면 결과 모양은 어떻게 될까요? 출력값을 그대로 적으세요. (괄호와 쉼표 포함)",
  code:"import numpy as np\nprint((np.array([1, 2, 3]) * np.array([[1], [2]])).shape)",
  a:["(2, 3)", "2x3", "2행3열"],
  ex:"뒤 축부터 견주면 <code>3</code> 과 <code>1</code> 이라 1 쪽이 늘고, 앞에는 <code>2</code> 만 남아 <code>(2, 3)</code> 이 됩니다.\n개념: 축 수가 다르면 <b>앞쪽에 1 을 채워</b> 맞춘 뒤 견줍니다 — <code>(3,)</code> 은 <code>(1, 3)</code> 으로 봅니다.\n실무: 곱셈 결과가 예상보다 커졌다면 브로드캐스팅이 일어난 것입니다. 의도한 것이 행렬 곱이라면 <code>@</code> 를 쓰세요 — <code>*</code> 는 자리끼리 곱하기입니다." },

];
