/* 판다스 단답 15 — 타입·결측·기본 동작을 직접 적어 본다.
   검증:  node ver_input.cjs ./in_pandas.cjs
   출력값 대조:  node chk_predict_py.cjs ./in_pandas.cjs */
module.exports = [

{ track:"pandas", t:"input", cat:"internals", k:"정수만 담으면 무슨 타입",
  q:"정수 리스트로 시리즈를 만들면 <code>dtype</code> 은 무엇이 될까요? 출력값을 그대로 적으세요. (영문+숫자)",
  code:"import pandas as pd\nprint(pd.Series([1, 2, 3]).dtype)",
  a:["int64", "정수64"],
  ex:"넘파이 배열 위에 얹혀 있어 <b>열마다 하나의 타입</b>을 가집니다.\n💡 개념: 그래서 한 열에 숫자와 글자를 섞으면 <code>object</code> 가 되고, 그 순간 벡터 연산의 이점이 사라집니다.\n🛠 실무: 읽어 들인 직후 <code>df.dtypes</code> 를 확인하는 습관을 들이세요. 숫자 열이 <code>object</code> 로 잡혔다면 어딘가에 문자열이 섞인 것입니다." },

{ track:"pandas", t:"input", cat:"internals", k:"빈 값이 섞이면 바뀌는 타입",
  q:"정수 사이에 결측이 하나 섞인 시리즈의 <code>dtype</code> 은 무엇이 될까요? 출력값을 그대로 적으세요. (영문+숫자)",
  code:"import pandas as pd\nprint(pd.Series([1, None, 3]).dtype)",
  a:["float64", "실수64"],
  ex:"기본 정수 타입에는 '없음' 을 담을 자리가 없어서, 결측을 표현하려고 <b>실수로 올라갑니다</b>(NaN 이 실수 값이기 때문).\n💡 개념: 그래서 정수 ID 열에 결측이 하나만 있어도 <code>1.0</code>, <code>2.0</code> 처럼 보이고, 문자열로 바꾸면 <code>.0</code> 이 따라붙습니다.\n🛠 실무: 결측을 담을 수 있는 정수 타입(<code>Int64</code>, 대문자 I)을 쓰거나, 읽을 때 <code>dtype</code> 을 지정하세요." },

{ track:"pandas", t:"input", cat:"internals", k:"결측을 빼고 더하면",
  q:"<code>[1, None, 3]</code> 시리즈를 그냥 더하면 얼마가 나올까요? 출력값을 그대로 적으세요. (소수점 포함)",
  code:"import pandas as pd\nprint(pd.Series([1, None, 3]).sum())",
  a:["4.0", "4"],
  ex:"집계 함수는 <b>기본적으로 결측을 건너뜁니다</b>(<code>skipna=True</code>). 그래서 오류도 <code>NaN</code> 도 아닌 4 가 나옵니다.\n💡 개념: 편리하지만 위험하기도 합니다 — 데이터의 절반이 비어 있어도 <b>아무 경고 없이</b> 합계를 내줍니다.\n🛠 실무: 집계 전에 결측 개수를 함께 세어 보세요. '합계 4' 와 '세 개 중 두 개만 있는 합계 4' 는 전혀 다른 이야기입니다." },

{ track:"pandas", t:"input", cat:"internals", k:"세는 함수가 세지 않는 것",
  q:"<code>[1, None, 3]</code> 시리즈에 <code>count()</code> 를 부르면 얼마가 나올까요? 출력값을 적으세요. (숫자)",
  code:"import pandas as pd\nprint(pd.Series([1, None, 3]).count())",
  a:["2"],
  ex:"이 함수는 <b>결측이 아닌 값</b>만 셉니다. 전체 길이를 알고 싶으면 <code>len()</code> 이나 <code>.size</code> 를 써야 합니다.\n💡 개념: 두 값의 차이가 곧 결측 개수라, <code>len(s) - s.count()</code> 로 셀 수 있습니다.\n🛠 실무: <code>describe()</code> 의 <code>count</code> 행도 같은 뜻입니다 — 열마다 이 값이 다르면 결측이 고르지 않다는 신호입니다." },

{ track:"pandas", t:"input", cat:"internals", k:"묶어서 더하기",
  q:"열 <code>k</code> 가 <code>['a','a','b']</code>, 열 <code>v</code> 가 <code>[1,2,3]</code> 인 표를 <code>k</code> 로 묶어 <code>v</code> 를 더하면 <code>'a'</code> 의 값은 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"import pandas as pd\ndf = pd.DataFrame({'k': ['a', 'a', 'b'], 'v': [1, 2, 3]})\nprint(df.groupby('k')['v'].sum()['a'])",
  a:["3"],
  ex:"<code>a</code> 그룹의 1 과 2 를 더해 3 입니다. 묶은 열은 결과의 <b>인덱스</b>가 됩니다.\n💡 개념: 인덱스가 되는 것이 싫으면 <code>as_index=False</code> 를 주거나 <code>reset_index()</code> 를 부릅니다 — 이후 병합이 훨씬 쉬워집니다.\n🛠 실무: 묶는 열에 결측이 있으면 <b>그 행은 통째로 빠집니다</b>(<code>dropna=True</code> 가 기본). 개수가 안 맞는 원인의 단골입니다." },

{ track:"pandas", t:"input", cat:"internals", k:"서로 다른 값의 개수",
  q:"<code>[1, 2, 2]</code> 시리즈에서 서로 다른 값은 몇 개일까요? 출력값을 적으세요. (숫자)",
  code:"import pandas as pd\nprint(pd.Series([1, 2, 2]).nunique())",
  a:["2"],
  ex:"1 과 2, 두 가지입니다. 이 함수도 기본적으로 <b>결측은 세지 않습니다</b>.\n💡 개념: 각 값이 몇 번 나왔는지까지 알고 싶으면 <code>value_counts()</code> 를 씁니다 — 많은 순으로 정렬해 줍니다.\n🛠 실무: 열의 고유값 수가 행 수와 같으면 <b>키 후보</b>이고, 아주 적으면 범주형으로 바꿔 메모리를 크게 줄일 수 있습니다." },

{ track:"pandas", t:"input", cat:"internals", k:"이어 붙이는 기본 방향",
  q:"<code>pd.concat</code> 의 <code>axis</code> 기본값은 얼마일까요? (숫자)",
  a:["0"],
  ex:"0 이라 <b>위아래로</b> 쌓입니다. 옆으로 붙이려면 <code>axis=1</code> 을 줘야 합니다.\n💡 개념: 위아래로 쌓을 때 열 이름이 다르면 없는 칸이 <b>결측으로 채워집니다</b> — 오류가 아니라 조용히 넓어집니다.\n🛠 실무: 붙인 뒤 인덱스가 <code>0,1,2,0,1</code> 처럼 겹칩니다. <code>ignore_index=True</code> 를 주거나 나중에 <code>reset_index</code> 하지 않으면 이후 조회가 어긋납니다." },

{ track:"pandas", t:"input", cat:"internals", k:"합칠 때의 기본 방식",
  q:"<code>merge</code> 의 <code>how</code> 기본값은 무엇일까요? (영문 다섯 글자)",
  a:["inner", "내부조인", "이너"],
  ex:"양쪽에 <b>모두 있는</b> 키만 남습니다. 그래서 합친 뒤 행이 줄어드는 일이 흔합니다.\n💡 개념: 한쪽을 다 남기려면 <code>left</code>, 양쪽을 다 남기려면 <code>outer</code> 입니다.\n🛠 실무: 합치기 전후로 행 수를 찍어 보세요. 키가 중복되면 오히려 행이 <b>늘어납니다</b> — <code>validate='one_to_one'</code> 을 주면 그때 예외로 잡힙니다." },

{ track:"pandas", t:"input", cat:"internals", k:"이름으로 고르는 인덱서",
  q:"행·열을 <b>번호</b>가 아니라 <b>라벨</b>로 고르는 인덱서의 이름은? (영문 세 글자)",
  a:["loc", ".loc"],
  ex:"번호로 고르는 것은 <code>iloc</code> 입니다. 인덱스가 정수라도 이쪽은 <b>라벨로</b> 봅니다.\n💡 개념: 슬라이스 동작도 다릅니다 — 라벨 슬라이스는 <b>끝을 포함</b>하고 번호 슬라이스는 제외합니다.\n🛠 실무: 정렬이나 필터 뒤에는 인덱스가 <code>0,1,2</code> 가 아닐 수 있습니다. 그때 <code>df[0:3]</code> 같은 코드가 조용히 다른 행을 집습니다 — 둘 중 어느 쪽인지 명시하세요." },

{ track:"pandas", t:"input", cat:"internals", k:"세 값의 평균",
  q:"<code>[1, 2, 3]</code> 시리즈의 평균은 얼마일까요? 출력값을 그대로 적으세요. (소수점 포함)",
  code:"import pandas as pd\nprint(pd.Series([1, 2, 3]).mean())",
  a:["2.0", "2"],
  ex:"정수 시리즈여도 평균은 실수로 나옵니다.\n💡 개념: 평균 역시 결측을 건너뛰므로, 분모가 <b>전체 개수가 아니라 유효 개수</b>라는 점을 기억해야 합니다.\n🛠 실무: 결측을 0 으로 채운 뒤 평균을 내는 것과 결측을 건너뛰고 평균을 내는 것은 전혀 다른 값입니다 — 어느 쪽이 맞는지는 데이터의 뜻이 정합니다." },

{ track:"pandas", t:"input", cat:"internals", k:"글자에 함수를 걸려면",
  q:"문자열 시리즈에 대문자 변환 같은 문자열 함수를 걸 때 중간에 붙이는 접근자의 이름은? (영문 세 글자)",
  a:["str", ".str"],
  ex:"<code>s.str.upper()</code> 처럼 씁니다. 이 접근자가 결측을 알아서 건너뛰고 원소마다 함수를 걸어 줍니다.\n💡 개념: 날짜에는 <code>.dt</code>, 범주형에는 <code>.cat</code> 이라는 같은 모양의 접근자가 있습니다.\n🛠 실무: 반복문이나 <code>apply</code> 로 한 줄씩 처리하는 것보다 훨씬 빠릅니다 — 문자열 처리는 먼저 이 접근자에 같은 기능이 있는지 찾아보세요." },

{ track:"pandas", t:"input", cat:"internals", k:"정렬한 뒤 첫 값",
  q:"<code>[3, 1, 2]</code> 시리즈를 오름차순 정렬한 뒤 첫 값은 무엇일까요? 출력값을 적으세요. (숫자)",
  code:"import pandas as pd\nprint(pd.Series([3, 1, 2]).sort_values().iloc[0])",
  a:["1"],
  ex:"정렬은 <b>새 시리즈</b>를 돌려주고 원본은 그대로입니다.\n💡 개념: 중요한 것은 <b>인덱스가 값을 따라간다</b>는 점입니다 — 정렬 뒤 인덱스는 <code>1, 2, 0</code> 이 되므로, 번호로 첫 값을 집으려면 <code>iloc</code> 를 써야 합니다.\n🛠 실무: 정렬 뒤 <code>df[0]</code> 이나 <code>s[0]</code> 로 집으면 <b>원래 0 번 행</b>이 나옵니다. 순위가 필요한 자리에서 조용히 틀리는 대표적인 지점입니다." },

{ track:"pandas", t:"input", cat:"internals", k:"차곡차곡 더한 마지막 값",
  q:"<code>[1, 2, 3]</code> 시리즈의 누적합에서 마지막 값은 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"import pandas as pd\nprint(pd.Series([1, 2, 3]).cumsum().iloc[-1])",
  a:["6"],
  ex:"누적합의 마지막 값은 전체 합과 같습니다.\n💡 개념: <code>cumsum</code>·<code>cummax</code>·<code>shift</code>·<code>diff</code> 는 <b>순서가 있는 데이터</b>를 다루는 기본 도구입니다.\n🛠 실무: 이런 함수를 쓰기 전에는 반드시 <b>정렬 상태를 확인</b>하세요. 시간순으로 정렬돼 있지 않으면 누적값이 아무 뜻도 없습니다." },

{ track:"pandas", t:"input", cat:"internals", k:"몇 행짜리 표인가",
  q:"열 두 개에 각 두 값이 든 데이터프레임의 길이(<code>len</code>)는 얼마일까요? 출력값을 적으세요. (숫자)",
  code:"import pandas as pd\nprint(len(pd.DataFrame({'a': [1, 2], 'b': [3, 4]})))",
  a:["2"],
  ex:"길이는 <b>행 수</b>입니다. 열 수까지 알고 싶으면 <code>df.shape</code> 가 <code>(행, 열)</code> 을 줍니다.\n💡 개념: 시리즈에서는 길이가 곧 원소 수라, 표와 시리즈에서 같은 함수가 다른 축을 센다고 오해하기 쉽습니다 — 둘 다 <b>첫 번째 축</b>을 셉니다.\n🛠 실무: 변환 단계마다 <code>df.shape</code> 를 찍어 두면 행이 어디서 늘거나 줄었는지 바로 짚입니다." },

{ track:"pandas", t:"input", cat:"debug", k:"두 번 인덱싱해서 값을 넣으면",
  q:"<code>df[df.x &gt; 0]['y'] = 1</code> 처럼 <b>두 번 나눠 골라</b> 값을 넣으면 원본에 반영되지 않을 수 있습니다. 이런 대입을 무엇이라 부를까요? (영문 두 낱말)",
  a:["chained assignment", "연쇄대입", "체인할당", "체이닝대입"],
  ex:"앞의 조회가 <b>사본</b>을 돌려주면 그 사본에만 값이 들어가고 원본은 그대로입니다. 사본인지 뷰인지는 상황에 따라 달라 예측하기 어렵습니다.\n💡 개념: 그래서 판다스는 경고를 띄웠고, 최신 판에서는 아예 <b>언제나 사본</b>으로 정해 동작을 예측 가능하게 만들었습니다.\n🛠 실무: 값을 넣을 때는 <b>한 번에</b> 고르세요 — <code>df.loc[df.x &gt; 0, 'y'] = 1</code>. 이 형태는 언제나 원본에 반영됩니다." },

];
