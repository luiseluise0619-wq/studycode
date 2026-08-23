module.exports = {
  track: "pandas", guide: "✍️", xp: 60,
  unit: "단답으로 확인하기 — 타입·결측·기본 동작",
  source: "./in_pandas.cjs",
  lessons: [
    { t: "타입과 결측이 결과를 바꾼다", n: 8,
      th: { sum: "판다스는 **조용히 알아서 해 주는 것**이 많다. 그 기본 동작을 모르면 오류 없이 틀린 숫자가 나온다.",
        body: [
          { h: "결측 하나가 타입을 바꾼다", t: "기본 정수 타입에는 '없음' 을 담을 자리가 없어, 결측이 하나만 섞여도 열이 <b>실수로 올라간다</b> — 정수 ID 가 <code>1.0</code> 으로 보이고 문자열로 바꾸면 <code>.0</code> 이 붙는다. 결측을 담을 수 있는 <code>Int64</code>(대문자)를 쓰거나 읽을 때 <code>dtype</code> 을 지정한다. 숫자 열이 <code>object</code> 로 잡혔다면 어딘가에 문자열이 섞인 것이고, 그 순간 벡터 연산의 이점이 사라진다." },
          { h: "집계는 결측을 건너뛴다", t: "합계·평균은 <b>기본적으로 결측을 건너뛴다</b> — 데이터의 절반이 비어 있어도 경고 없이 값을 준다. <code>count()</code> 는 결측이 아닌 값만 세므로 <code>len(s) - s.count()</code> 가 결측 개수다. <code>groupby</code> 는 묶는 열의 결측 행을 <b>통째로 버리고</b>(기본), 묶은 열이 인덱스가 된다. 합칠 때 <code>merge</code> 의 기본은 <b>inner</b> 라 행이 줄고, 키가 중복이면 오히려 는다." }],
        code: { c: "df.dtypes                      # 읽은 직후 확인\nlen(s) - s.count()             # 결측 개수\nmerge(..., validate='one_to_one')", cap: "조용히 해 주는 것을 눈으로 확인한다" },
        key: ["결측 하나가 정수를 실수로 만든다", "집계는 결측을 건너뛴다", "count 는 유효값만 센다", "merge 기본은 inner"] } },
    { t: "고르고 정렬하고 넣기", n: 7,
      th: { sum: "판다스에서 조용히 틀리는 자리는 **인덱스가 값을 따라간다**는 사실을 잊었을 때 생긴다.",
        body: [
          { h: "라벨인가 번호인가", t: "<code>loc</code> 는 <b>라벨</b>, <code>iloc</code> 는 <b>번호</b>이고 슬라이스 동작도 다르다 — 라벨 슬라이스는 끝을 포함하고 번호 슬라이스는 제외한다. 정렬하거나 필터한 뒤에는 인덱스가 <code>0,1,2</code> 가 아닐 수 있어서, <code>s[0]</code> 이 '첫 값' 이 아니라 '<b>원래 0 번 행</b>' 을 집는다 — 순위가 필요한 자리에서 조용히 틀리는 대표적인 지점이다. <code>concat</code> 은 기본이 위아래(<code>axis=0</code>)이고 인덱스가 겹치므로 <code>ignore_index</code> 를 챙긴다." },
          { h: "한 번에 골라서 넣는다", t: "<code>df[df.x &gt; 0]['y'] = 1</code> 처럼 <b>두 번 나눠 골라</b> 대입하면 사본에만 들어갈 수 있다 — 값을 넣을 때는 <code>df.loc[조건, 'y'] = 1</code> 로 <b>한 번에</b> 고른다. 문자열은 <code>.str</code>, 날짜는 <code>.dt</code> 접근자로 원소마다 함수를 걸면 <code>apply</code> 보다 훨씬 빠르다. <code>cumsum</code>·<code>shift</code>·<code>diff</code> 는 순서가 있는 데이터의 도구라 <b>정렬 상태를 먼저 확인</b>해야 한다." }],
        code: { c: "df.loc[df.x > 0, 'y'] = 1     # 한 번에 고른다\ns.sort_values().iloc[0]       # 정렬 뒤엔 iloc\ns.str.upper()  ·  s.dt.year", cap: "인덱스는 값을 따라 움직인다" },
        key: ["loc 는 라벨, iloc 는 번호", "정렬 뒤에는 iloc 로 집는다", "대입은 한 번에 고른다", ".str/.dt 가 apply 보다 빠르다"] } },
  ],
};
