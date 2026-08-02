/* Go 중급·심화 유닛 실습 (2차).
   1차에서 기초 10개 유닛을 채웠고, 여기서 중급·심화 10개를 더 채운다.

   러너는 인터넷 없이 돈다(GOPROXY=off). 그래서 표준 라이브러리만 쓴다 —
   HTTP 도 httptest, 파일도 strings.Reader 로 낸다. 외부 의존이 하나라도 있으면
   러너를 띄운 사람도 채점하지 못한다. */
module.exports = [
{
  unit: "슬라이스 내부 구조 (중급)",
  lesson: "직접 짜 보기 — len 과 cap",
  th: {
    sum: "슬라이스는 **포인터·길이(len)·용량(cap)** 세 값이다. 눈에 보이는 것은 len 까지지만, 사고는 cap 에서 난다.",
    body: [
      { h: "잘라내도 용량은 남는다", t: "`a[:2]` 의 len 은 2지만 cap 은 원래 배열 끝까지다. 그래서 여기에 `append` 하면 원본의 세 번째 칸을 덮어쓴다. 잘라낸 슬라이스를 남에게 넘길 때는 이 뒤쪽 여유를 잘라 둬야 안전하다." },
      { h: "세 칸짜리 자르기", t: "`a[low:high:max]` 로 용량까지 지정하면 `cap` 이 `max-low` 로 제한된다. `a[:2:2]` 처럼 쓰면 여유가 0이라 append 가 반드시 새 배열을 만든다 — 원본을 건드릴 방법이 없어진다. 이것이 관용적인 방어법이다." },
    ],
    code: { c: "a := []int{1, 2, 3, 4}\nb := a[:2]      // len 2, cap 4 — 위험\nc := a[:2:2]    // len 2, cap 2 — 안전\nc = append(c, 9)   // 새 배열이 생긴다", cap: "a[low:high:max] 로 용량을 끊는다" },
    key: ["`len` 과 `cap` 은 다르다", "잘라내도 뒤쪽 용량이 남는다", "`a[:n:n]` 으로 여유를 끊는다"],
  },
  q: [
    {
      k: "Clip · 뒤쪽 여유를 끊어 넘기기",
      pkg: "ex",
      q: "앞 <code>n</code>개만 담은 슬라이스를 돌려주되, 받은 쪽이 <code>append</code> 해도 <b>원본을 덮지 않게</b> 하세요. 복사는 하지 말고 <b>용량만</b> 끊습니다.",
      src: "package ex\n\nfunc Clip(xs []int, n int) []int {\n\treturn xs[:n]\n}\n",
      sol: "package ex\n\nfunc Clip(xs []int, n int) []int {\n\treturn xs[:n:n]\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestClip(t *testing.T) {\n\ta := []int{1, 2, 3, 4}\n\tb := Clip(a, 2)\n\tif len(b) != 2 || b[0] != 1 || b[1] != 2 {\n\t\tt.Fatalf(\"내용: %v\", b)\n\t}\n\tif cap(b) != 2 {\n\t\tt.Fatalf(\"cap 이 2여야 한다 (got %d) — 뒤쪽 여유가 남아 있다\", cap(b))\n\t}\n\tb = append(b, 99)\n\tif a[2] != 3 {\n\t\tt.Fatalf(\"원본이 덮어써졌다: %v\", a)\n\t}\n}\n" },
      ex: "xs[:n] 은 len 만 줄이고 cap 은 원래 배열 끝까지 남깁니다. 받은 쪽이 append 하면 원본 뒤쪽을 그대로 덮어써요. 세 칸짜리 자르기로 용량을 끊어야 합니다.",
    },
    {
      k: "Grow · 미리 잡아 두고 채우기",
      pkg: "ex",
      q: "<code>n</code>개를 담을 슬라이스를 <b>미리 용량까지 잡아</b> 두고, 0부터 n-1을 채워 돌려주세요. 중간에 다시 할당되면 안 됩니다.",
      src: "package ex\n\nfunc Grow(n int) []int {\n\tout := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tout = append(out, i)\n\t}\n\treturn out\n}\n",
      sol: "package ex\n\nfunc Grow(n int) []int {\n\tout := make([]int, 0, n)\n\tfor i := 0; i < n; i++ {\n\t\tout = append(out, i)\n\t}\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestGrow(t *testing.T) {\n\tgot := Grow(3)\n\tif len(got) != 3 {\n\t\tt.Fatalf(\"길이가 3이어야 한다: %v\", got)\n\t}\n\tfor i := 0; i < 3; i++ {\n\t\tif got[i] != i {\n\t\t\tt.Fatalf(\"got %v, want [0 1 2]\", got)\n\t\t}\n\t}\n\tif e := Grow(0); len(e) != 0 {\n\t\tt.Fatalf(\"0개: %v\", e)\n\t}\n}\n" },
      ex: "make([]int, n) 은 길이 n 을 0 으로 채운 슬라이스입니다. 거기에 append 하면 뒤에 덧붙어 길이가 2n 이 돼요. 미리 잡아 두려면 make([]int, 0, n) — 길이 0, 용량 n 입니다.",
    },
  ],
},
{
  unit: "타입 시스템과 변환 (중급)",
  lesson: "직접 짜 보기 — 조용히 잘리는 변환",
  th: {
    sum: "Go 는 타입을 섞어 쓰지 못하게 막지만, **명시적 변환은 검사하지 않는다.** `int32(큰수)` 는 조용히 잘린다.",
    body: [
      { h: "잘림과 부호", t: "`int8(200)` 은 `-56` 이다. 범위를 넘으면 비트가 잘리고 부호 비트가 뒤집힌다. 오류도 경고도 없다. 좁은 타입으로 바꿀 때는 **바꾸기 전에** 범위를 확인해야 한다." },
      { h: "이름 있는 타입", t: "`type Celsius float64` 는 float64 와 다른 타입이다. 그래서 실수로 섞어 쓰면 컴파일러가 잡아 준다 — 단위를 타입으로 만들면 '섭씨에 화씨를 더하는' 버그가 컴파일 단계에서 걸린다." },
    ],
    code: { c: "int8(200)      // -56, 조용히 잘린다\n\ntype Celsius float64\ntype Fahrenheit float64\nvar c Celsius = 20\n// var f Fahrenheit = c   // 컴파일 오류 — 좋은 일이다", cap: "명시적 변환은 검사하지 않는다" },
    key: ["좁은 타입으로 바꾸면 조용히 잘린다", "바꾸기 전에 범위를 확인한다", "단위는 이름 있는 타입으로"],
  },
  q: [
    {
      k: "ToUint8 · 범위를 확인하고 바꾸기",
      pkg: "ex",
      q: "정수를 <code>uint8</code> 로 바꾸되, <b>0~255 를 벗어나면</b> 에러를 돌려주세요. 벗어난 값을 잘라서 돌려주면 안 됩니다.",
      src: "package ex\n\nimport \"errors\"\n\nfunc ToUint8(n int) (uint8, error) {\n\tv := uint8(n)\n\tif v != uint8(n) {\n\t\treturn 0, errors.New(\"범위 초과\")\n\t}\n\treturn v, nil\n}\n",
      sol: "package ex\n\nimport \"errors\"\n\nfunc ToUint8(n int) (uint8, error) {\n\tif n < 0 || n > 255 {\n\t\treturn 0, errors.New(\"범위 초과\")\n\t}\n\treturn uint8(n), nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestToUint8(t *testing.T) {\n\tif v, err := ToUint8(200); v != 200 || err != nil {\n\t\tt.Fatalf(\"200: %d %v\", v, err)\n\t}\n\tif v, err := ToUint8(0); v != 0 || err != nil {\n\t\tt.Fatalf(\"0: %d %v\", v, err)\n\t}\n\tif v, err := ToUint8(255); v != 255 || err != nil {\n\t\tt.Fatalf(\"255: %d %v\", v, err)\n\t}\n\tif _, err := ToUint8(256); err == nil {\n\t\tt.Fatal(\"256 은 범위 초과여야 한다\")\n\t}\n\tif _, err := ToUint8(-1); err == nil {\n\t\tt.Fatal(\"-1 은 범위 초과여야 한다\")\n\t}\n}\n" },
      ex: "uint8(n) 을 두 번 해서 비교하면 늘 같은 값이라 아무것도 못 잡습니다. 바꾸기 전에 원래 값이 범위 안인지 봐야 해요.",
    },
    {
      k: "Celsius · 단위를 타입으로",
      pkg: "ex",
      q: "섭씨를 화씨로 바꾸는 함수를 만드세요. 두 단위는 <b>서로 다른 타입</b>이어야 하고, 공식은 <code>화씨 = 섭씨×9/5 + 32</code> 입니다.",
      src: "package ex\n\ntype Celsius = float64\ntype Fahrenheit = float64\n\nfunc ToF(c Celsius) Fahrenheit {\n\treturn Fahrenheit(c*9/5 + 32)\n}\n",
      sol: "package ex\n\ntype Celsius float64\ntype Fahrenheit float64\n\nfunc ToF(c Celsius) Fahrenheit {\n\treturn Fahrenheit(c*9/5 + 32)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestToF(t *testing.T) {\n\tif got := ToF(100); got != 212 {\n\t\tt.Fatalf(\"100C = %v, want 212\", got)\n\t}\n\tif got := ToF(0); got != 32 {\n\t\tt.Fatalf(\"0C = %v, want 32\", got)\n\t}\n}\n\n// 두 단위가 서로 다른 타입이어야 한다. 같은 타입(별칭)이면 이 함수가 컴파일된다.\nfunc mustNotCompileIfAlias(f Fahrenheit) Celsius {\n\treturn Celsius(f)\n}\n\nfunc TestDistinctTypes(t *testing.T) {\n\tvar c Celsius = 10\n\tvar f Fahrenheit = 10\n\t// 별칭이라면 c 와 f 가 같은 타입이라 아래 비교가 컴파일된다.\n\tif any(c) == any(f) {\n\t\tt.Fatal(\"Celsius 와 Fahrenheit 가 같은 타입이다 — type 별칭(=)이 아니라 새 타입으로 정의해야 한다\")\n\t}\n\t_ = mustNotCompileIfAlias(f)\n}\n" },
      ex: "type A = float64 는 별칭이라 float64 와 완전히 같은 타입입니다. 섞어 써도 컴파일러가 못 잡아요. 등호를 빼고 type A float64 로 써야 새 타입이 됩니다.",
    },
  ],
},
{
  unit: "정렬과 비교 (중급)",
  lesson: "직접 짜 보기 — 기준을 정확히 주기",
  th: {
    sum: "`sort.Slice` 는 '앞이 뒤보다 먼저 오는가' 를 묻는 함수를 받는다. 같을 때 `true` 를 주면 규칙이 깨진다.",
    body: [
      { h: "less 는 엄격해야 한다", t: "비교 함수는 같은 값에 대해 반드시 `false` 여야 한다. `<=` 로 쓰면 'a가 b보다 앞' 이면서 'b가 a보다 앞' 이 동시에 참이 되어, 정렬 결과가 뒤죽박죽이 되거나 패닉이 난다." },
      { h: "안정 정렬이 필요할 때", t: "`sort.Slice` 는 같은 값의 원래 순서를 **보장하지 않는다.** '2차 기준으로 먼저 정렬한 뒤 1차 기준으로 다시 정렬' 하는 방식을 쓰려면 `sort.SliceStable` 이어야 한다. 아니면 한 번에 두 기준을 다 적는다." },
    ],
    code: { c: "sort.Slice(xs, func(i, j int) bool {\n    if xs[i].Score != xs[j].Score {\n        return xs[i].Score > xs[j].Score   // 1차\n    }\n    return xs[i].Name < xs[j].Name          // 2차\n})", cap: "두 기준을 한 번에 적는 것이 가장 안전하다" },
    key: ["같을 때는 반드시 `false`", "`sort.Slice` 는 안정적이지 않다", "2차 기준은 한 함수 안에 적는다"],
  },
  q: [
    {
      k: "Rank · 점수 내림차순, 동점은 이름순",
      pkg: "ex",
      q: "<b>점수 높은 순</b>으로, 점수가 같으면 <b>이름 오름차순</b>으로 정렬하세요.",
      src: "package ex\n\nimport \"sort\"\n\ntype P struct {\n\tName  string\n\tScore int\n}\n\nfunc Rank(ps []P) {\n\tsort.SliceStable(ps, func(i, j int) bool {\n\t\treturn ps[i].Score > ps[j].Score\n\t})\n}\n",
      sol: "package ex\n\nimport \"sort\"\n\ntype P struct {\n\tName  string\n\tScore int\n}\n\nfunc Rank(ps []P) {\n\tsort.Slice(ps, func(i, j int) bool {\n\t\tif ps[i].Score != ps[j].Score {\n\t\t\treturn ps[i].Score > ps[j].Score\n\t\t}\n\t\treturn ps[i].Name < ps[j].Name\n\t})\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestRank(t *testing.T) {\n\tps := []P{{\"na\", 90}, {\"ga\", 90}, {\"da\", 80}, {\"ma\", 95}}\n\tRank(ps)\n\twant := []string{\"ma\", \"ga\", \"na\", \"da\"}\n\tfor i, w := range want {\n\t\tif ps[i].Name != w {\n\t\t\tt.Fatalf(\"%d번째가 %q, want %q (전체 %v)\", i, ps[i].Name, w, ps)\n\t\t}\n\t}\n\tvar empty []P\n\tRank(empty)\n}\n" },
      ex: "점수만 비교하면 동점자끼리는 입력 순서가 그대로 남습니다 — 안정 정렬이라 '순서가 유지된' 것이지 '이름순으로 정렬된' 게 아니에요. 2차 기준은 비교 함수 안에 직접 적어야 합니다.",
    },
    {
      k: "Dedup · 정렬 후 중복 없애기",
      pkg: "ex",
      q: "정수 슬라이스를 <b>오름차순 정렬</b>하고 <b>중복을 없앤</b> 새 슬라이스를 돌려주세요. 원본은 그대로여야 합니다.",
      src: "package ex\n\nimport \"sort\"\n\nfunc Dedup(xs []int) []int {\n\tsort.Ints(xs)\n\tout := []int{}\n\tfor i, v := range xs {\n\t\tif i == 0 || v != xs[i-1] {\n\t\t\tout = append(out, v)\n\t\t}\n\t}\n\treturn out\n}\n",
      sol: "package ex\n\nimport \"sort\"\n\nfunc Dedup(xs []int) []int {\n\tcp := make([]int, len(xs))\n\tcopy(cp, xs)\n\tsort.Ints(cp)\n\tout := []int{}\n\tfor i, v := range cp {\n\t\tif i == 0 || v != cp[i-1] {\n\t\t\tout = append(out, v)\n\t\t}\n\t}\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestDedup(t *testing.T) {\n\ta := []int{3, 1, 3, 2, 1}\n\tgot := Dedup(a)\n\twant := []int{1, 2, 3}\n\tif len(got) != len(want) {\n\t\tt.Fatalf(\"got %v, want %v\", got, want)\n\t}\n\tfor i := range want {\n\t\tif got[i] != want[i] {\n\t\t\tt.Fatalf(\"got %v, want %v\", got, want)\n\t\t}\n\t}\n\tif a[0] != 3 || a[1] != 1 || a[4] != 1 {\n\t\tt.Fatalf(\"원본이 정렬돼 버렸다: %v\", a)\n\t}\n\tif e := Dedup(nil); len(e) != 0 {\n\t\tt.Fatalf(\"빈 입력: %v\", e)\n\t}\n}\n" },
      ex: "sort.Ints 는 받은 슬라이스를 그 자리에서 정렬합니다. 부른 쪽의 배열 순서까지 바뀌어요 — 남의 데이터를 말없이 바꾸지 않으려면 복사하고 정렬해야 합니다.",
    },
  ],
},
{
  unit: "임베딩과 구성 중급: 상속이 아니라 조립이다",
  lesson: "직접 짜 보기 — 끼워 넣고 덮어쓰기",
  th: {
    sum: "Go 에는 상속이 없다. 구조체 안에 **이름 없이 끼워 넣으면** 그 메서드가 바깥으로 올라온다.",
    body: [
      { h: "승격과 가림", t: "`type Admin struct { User }` 라고 쓰면 `User` 의 메서드를 `Admin` 이 그대로 쓸 수 있다(승격). 같은 이름의 메서드를 `Admin` 에 만들면 바깥 것이 이긴다(가림). 안쪽 것을 부르려면 `a.User.Name()` 이라고 적는다." },
      { h: "상속이 아니다", t: "안쪽 타입의 메서드가 다른 메서드를 부를 때, 그 메서드는 **안쪽 것**을 부른다. 바깥에서 덮어쓴 것이 불리지 않는다. 객체지향의 오버라이드를 기대하면 여기서 어긋난다." },
    ],
    code: { c: "type User struct{ N string }\nfunc (u User) Hello() string { return \"안녕 \" + u.N }\n\ntype Admin struct{ User }\n// Admin 은 Hello 를 그대로 쓴다\n// 덮어쓰려면 Admin 에 Hello 를 만든다", cap: "이름 없이 끼워 넣으면 메서드가 올라온다" },
    key: ["이름 없는 필드가 임베딩", "같은 이름은 바깥이 이긴다", "안쪽 것은 `x.Inner.M()` 으로 부른다"],
  },
  q: [
    {
      k: "Admin · 끼워 넣고 한 줄만 덮기",
      pkg: "ex",
      q: "<code>Admin</code> 이 <code>User</code> 를 <b>임베딩</b>해 <code>Name()</code> 은 그대로 쓰고, <code>Role()</code> 만 <code>\"admin\"</code> 으로 덮어쓰게 하세요.",
      src: "package ex\n\ntype User struct {\n\tN string\n}\n\nfunc (u User) Name() string { return u.N }\nfunc (u User) Role() string { return \"user\" }\n\ntype Admin struct {\n\tU User\n}\n\nfunc (a Admin) Role() string { return \"admin\" }\n",
      sol: "package ex\n\ntype User struct {\n\tN string\n}\n\nfunc (u User) Name() string { return u.N }\nfunc (u User) Role() string { return \"user\" }\n\ntype Admin struct {\n\tUser\n}\n\nfunc (a Admin) Role() string { return \"admin\" }\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestAdmin(t *testing.T) {\n\ta := Admin{User{N: \"가영\"}}\n\tif a.Name() != \"가영\" {\n\t\tt.Fatalf(\"Name 이 승격되어야 한다: %q\", a.Name())\n\t}\n\tif a.Role() != \"admin\" {\n\t\tt.Fatalf(\"Role 은 덮어써야 한다: %q\", a.Role())\n\t}\n\tif a.User.Role() != \"user\" {\n\t\tt.Fatalf(\"안쪽 Role 은 그대로여야 한다: %q\", a.User.Role())\n\t}\n}\n" },
      ex: "U User 처럼 이름을 붙이면 그냥 보통 필드라 메서드가 올라오지 않습니다. a.Name() 이 없다고 컴파일 오류가 나요. 이름 없이 User 라고만 적어야 임베딩입니다.",
    },
    {
      k: "Wrap · 감싸서 기능 덧붙이기",
      pkg: "ex",
      q: "<code>Logger</code> 인터페이스를 감싸 모든 메시지 앞에 <code>\"[앱] \"</code> 을 붙이는 <code>Prefixed</code> 를 만드세요. 안쪽 로거는 임베딩으로 받습니다.",
      src: "package ex\n\ntype Logger interface {\n\tLog(msg string)\n}\n\ntype Mem struct {\n\tLines []string\n}\n\nfunc (m *Mem) Log(msg string) { m.Lines = append(m.Lines, msg) }\n\ntype Prefixed struct {\n\tLogger\n}\n",
      sol: "package ex\n\ntype Logger interface {\n\tLog(msg string)\n}\n\ntype Mem struct {\n\tLines []string\n}\n\nfunc (m *Mem) Log(msg string) { m.Lines = append(m.Lines, msg) }\n\ntype Prefixed struct {\n\tLogger\n}\n\nfunc (p Prefixed) Log(msg string) { p.Logger.Log(\"[앱] \" + msg) }\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestPrefixed(t *testing.T) {\n\tm := &Mem{}\n\tvar l Logger = Prefixed{m}\n\tl.Log(\"시작\")\n\tl.Log(\"끝\")\n\tif len(m.Lines) != 2 {\n\t\tt.Fatalf(\"두 줄이어야 한다: %v\", m.Lines)\n\t}\n\tif m.Lines[0] != \"[앱] 시작\" || m.Lines[1] != \"[앱] 끝\" {\n\t\tt.Fatalf(\"접두어가 붙어야 한다: %v\", m.Lines)\n\t}\n}\n" },
      ex: "임베딩만 하면 안쪽 Log 가 그대로 승격돼 접두어 없이 기록됩니다. 같은 이름의 메서드를 바깥에 만들어 가린 뒤, 안에서 p.Logger.Log 로 넘겨야 해요.",
    },
  ],
},
{
  unit: "제네릭 심화: 타입 파라미터·제약·쓰지 말아야 할 때",
  lesson: "직접 짜 보기 — 타입 파라미터",
  th: {
    sum: "제네릭은 '같은 코드를 타입만 바꿔 여러 번 쓰는' 자리를 없앤다. 대신 **제약(constraint)** 으로 무엇을 할 수 있는지 밝혀야 한다.",
    body: [
      { h: "제약이 곧 계약", t: "`[T any]` 는 아무 타입이나 받지만 그 값으로 할 수 있는 게 거의 없다 — 비교도 못 한다. 비교하려면 `[T comparable]`, 크기를 견주려면 `[T int | float64 | string]` 같은 합집합을 준다. 제약이 좁을수록 안에서 할 수 있는 일이 많아진다." },
      { h: "언제 쓰지 말아야 하나", t: "타입이 하나뿐이거나, 제약이 너무 넓어 결국 타입 스위치를 쓰게 되면 제네릭이 오히려 읽기 어렵다. '같은 코드를 두 번 이상 복사하고 있는가' 가 판단 기준이다." },
    ],
    code: { c: "func Keys[K comparable, V any](m map[K]V) []K {\n    out := make([]K, 0, len(m))\n    for k := range m { out = append(out, k) }\n    return out\n}", cap: "제약이 안에서 할 수 있는 일을 정한다" },
    key: ["`any` 로는 비교도 못 한다", "비교는 `comparable`", "복사가 두 번 이상일 때 꺼낸다"],
  },
  q: [
    {
      k: "Contains · 어떤 타입이든 찾기",
      pkg: "ex",
      q: "슬라이스에 값이 있는지 확인하는 <b>제네릭</b> 함수를 만드세요. <code>int</code>·<code>string</code> 모두에 쓸 수 있어야 합니다.",
      src: "package ex\n\nfunc Contains[T any](xs []T, v T) bool {\n\tfor _, x := range xs {\n\t\tif x == v {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn false\n}\n",
      sol: "package ex\n\nfunc Contains[T comparable](xs []T, v T) bool {\n\tfor _, x := range xs {\n\t\tif x == v {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn false\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestContains(t *testing.T) {\n\tif !Contains([]int{1, 2, 3}, 2) {\n\t\tt.Fatal(\"2 가 있어야 한다\")\n\t}\n\tif Contains([]int{1, 2}, 9) {\n\t\tt.Fatal(\"9 는 없다\")\n\t}\n\tif !Contains([]string{\"a\", \"b\"}, \"b\") {\n\t\tt.Fatal(\"b 가 있어야 한다\")\n\t}\n\tif Contains([]string{}, \"x\") {\n\t\tt.Fatal(\"빈 슬라이스\")\n\t}\n}\n" },
      ex: "any 는 '아무 타입' 이라 == 로 비교할 수 있다는 보장이 없습니다. 컴파일이 안 돼요 — 비교가 필요하면 comparable 제약을 줘야 합니다.",
    },
    {
      k: "MaxOf · 큰 쪽 고르기",
      pkg: "ex",
      q: "두 값 중 <b>큰 쪽</b>을 돌려주는 제네릭 함수를 만드세요. <code>int</code>·<code>float64</code>·<code>string</code> 에 쓸 수 있어야 합니다.",
      src: "package ex\n\nfunc MaxOf[T comparable](a, b T) T {\n\tif a > b {\n\t\treturn a\n\t}\n\treturn b\n}\n",
      sol: "package ex\n\ntype Ordered interface {\n\t~int | ~int64 | ~float64 | ~string\n}\n\nfunc MaxOf[T Ordered](a, b T) T {\n\tif a > b {\n\t\treturn a\n\t}\n\treturn b\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestMaxOf(t *testing.T) {\n\tif MaxOf(3, 7) != 7 {\n\t\tt.Fatal(\"int\")\n\t}\n\tif MaxOf(2.5, 1.5) != 2.5 {\n\t\tt.Fatal(\"float64\")\n\t}\n\tif MaxOf(\"a\", \"b\") != \"b\" {\n\t\tt.Fatal(\"string\")\n\t}\n\tif MaxOf(-1, -9) != -1 {\n\t\tt.Fatal(\"음수\")\n\t}\n}\n" },
      ex: "comparable 은 == 와 != 만 보장합니다. > 로 크기를 견주려면 순서가 있는 타입만 받는 제약이 필요해요 — 합집합으로 직접 적거나 표준 라이브러리의 순서 제약을 씁니다.",
    },
  ],
},
{
  unit: "동시성 패턴 심화: 워커 풀·팬인/팬아웃·파이프라인",
  lesson: "직접 짜 보기 — 워커 풀",
  th: {
    sum: "일이 많을 때 고루틴을 무한히 만들면 메모리와 스케줄러가 무너진다. **정해진 수의 일꾼**이 채널에서 일을 꺼내 가게 한다.",
    body: [
      { h: "일감 채널과 결과 채널", t: "일감을 담는 채널 하나, 결과를 받는 채널 하나를 두고 일꾼 n명이 `for job := range jobs` 로 꺼내 간다. 일감을 다 넣은 쪽이 `close(jobs)` 하면 일꾼들이 자연스럽게 끝난다." },
      { h: "결과 채널은 누가 닫나", t: "일꾼이 여럿이므로 아무나 닫으면 안 된다. `WaitGroup` 으로 **모두 끝난 뒤** 별도 고루틴에서 닫는다. 이 순서를 지키지 않으면 '닫힌 채널에 보내기' 패닉이나 데드락이 난다." },
    ],
    code: { c: "for i := 0; i < n; i++ {\n    wg.Add(1)\n    go func() { defer wg.Done()\n        for j := range jobs { results <- work(j) } }()\n}\ngo func() { wg.Wait(); close(results) }()", cap: "모두 끝난 뒤에 결과 채널을 닫는다" },
    key: ["일꾼 수를 정해 둔다", "일감 채널은 넣는 쪽이 닫는다", "결과 채널은 모두 끝난 뒤 닫는다"],
  },
  q: [
    {
      k: "Pool · 일꾼 셋이 나눠 처리하기",
      pkg: "ex",
      q: "일꾼 <b>3명</b>이 숫자를 나눠 제곱한 결과의 <b>합</b>을 돌려주세요. 하나도 빠뜨리면 안 되고, 멈추지 않아야 합니다.",
      src: "package ex\n\nimport \"sync\"\n\nfunc Pool(xs []int) int {\n\tjobs := make(chan int)\n\tresults := make(chan int)\n\tvar wg sync.WaitGroup\n\tfor i := 0; i < 3; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tfor j := range jobs {\n\t\t\t\tresults <- j * j\n\t\t\t}\n\t\t}()\n\t}\n\tfor _, x := range xs {\n\t\tjobs <- x\n\t}\n\tclose(jobs)\n\twg.Wait()\n\tclose(results)\n\ttotal := 0\n\tfor v := range results {\n\t\ttotal += v\n\t}\n\treturn total\n}\n",
      sol: "package ex\n\nimport \"sync\"\n\nfunc Pool(xs []int) int {\n\tjobs := make(chan int)\n\tresults := make(chan int)\n\tvar wg sync.WaitGroup\n\tfor i := 0; i < 3; i++ {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\tfor j := range jobs {\n\t\t\t\tresults <- j * j\n\t\t\t}\n\t\t}()\n\t}\n\tgo func() {\n\t\tfor _, x := range xs {\n\t\t\tjobs <- x\n\t\t}\n\t\tclose(jobs)\n\t}()\n\tgo func() {\n\t\twg.Wait()\n\t\tclose(results)\n\t}()\n\ttotal := 0\n\tfor v := range results {\n\t\ttotal += v\n\t}\n\treturn total\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestPool(t *testing.T) {\n\tdone := make(chan int, 1)\n\tgo func() { done <- Pool([]int{1, 2, 3, 4}) }()\n\tselect {\n\tcase got := <-done:\n\t\tif got != 30 {\n\t\t\tt.Fatalf(\"1+4+9+16 = 30, got %d\", got)\n\t\t}\n\tcase <-time.After(3 * time.Second):\n\t\tt.Fatal(\"멈췄다 — 결과를 아무도 받지 않는 사이 일감을 계속 밀어 넣고 있다\")\n\t}\n}\n" },
      ex: "결과를 받는 반복문이 맨 마지막에 있어서, 일꾼들이 results 로 보내려 해도 받을 사람이 없어 전부 멈춥니다. 일감 넣기와 결과 채널 닫기를 각각 고루틴으로 빼서, 받는 쪽이 먼저 돌게 해야 해요.",
    },
    {
      k: "FanIn · 두 흐름을 하나로",
      pkg: "ex",
      q: "채널 두 개에서 오는 값을 <b>하나의 채널</b>로 모으세요. 양쪽이 다 끝나면 모은 채널도 닫혀야 합니다.",
      src: "package ex\n\nfunc FanIn(a, b <-chan int) <-chan int {\n\tout := make(chan int)\n\tgo func() {\n\t\tdefer close(out)\n\t\tfor v := range a {\n\t\t\tout <- v\n\t\t}\n\t\tfor v := range b {\n\t\t\tout <- v\n\t\t}\n\t}()\n\treturn out\n}\n",
      sol: "package ex\n\nimport \"sync\"\n\nfunc FanIn(a, b <-chan int) <-chan int {\n\tout := make(chan int)\n\tvar wg sync.WaitGroup\n\twg.Add(2)\n\tpipe := func(c <-chan int) {\n\t\tdefer wg.Done()\n\t\tfor v := range c {\n\t\t\tout <- v\n\t\t}\n\t}\n\tgo pipe(a)\n\tgo pipe(b)\n\tgo func() {\n\t\twg.Wait()\n\t\tclose(out)\n\t}()\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestFanIn(t *testing.T) {\n\ta := make(chan int)\n\tb := make(chan int)\n\t// b 는 지금 바로 보낸다. a 는 400ms 뒤에야 보낸다.\n\tgo func() { b <- 10; b <- 20; close(b) }()\n\tgo func() {\n\t\ttime.Sleep(400 * time.Millisecond)\n\t\ta <- 1\n\t\tclose(a)\n\t}()\n\n\tout := FanIn(a, b)\n\tstart := time.Now()\n\tfirst, ok := <-out\n\telapsed := time.Since(start)\n\tif !ok {\n\t\tt.Fatal(\"값이 하나도 오지 않았다\")\n\t}\n\t// 두 채널을 동시에 읽고 있다면 b 의 값이 곧바로 온다.\n\t// a 를 다 읽은 뒤에 b 를 읽는 구현은 400ms 를 기다린 뒤에야 첫 값을 준다.\n\tif elapsed > 200*time.Millisecond {\n\t\tt.Fatalf(\"첫 값이 %v 만에 왔다 — 한쪽을 다 읽을 때까지 다른 쪽을 못 읽고 있다\", elapsed)\n\t}\n\tif first != 10 {\n\t\tt.Fatalf(\"먼저 도착한 값이 먼저 나와야 한다: %d\", first)\n\t}\n\n\tsum, n := first, 1\n\tdone := make(chan bool, 1)\n\tgo func() {\n\t\tfor v := range out {\n\t\t\tsum += v\n\t\t\tn++\n\t\t}\n\t\tdone <- true\n\t}()\n\tselect {\n\tcase <-done:\n\t\tif n != 3 || sum != 31 {\n\t\t\tt.Fatalf(\"n=%d sum=%d, want n=3 sum=31\", n, sum)\n\t\t}\n\tcase <-time.After(3 * time.Second):\n\t\tt.Fatal(\"끝나지 않았다 — 양쪽이 끝난 뒤 out 을 닫아야 한다\")\n\t}\n}\n" },
      ex: "a 를 다 읽고 나서 b 를 읽으면, b 에 값이 벌써 와 있어도 a 가 끝날 때까지 못 넘깁니다. 결국 다 오기는 하지만 순서와 지연이 망가져요 — 팬인의 목적이 사라집니다. 두 채널을 각각 고루틴으로 동시에 읽고, 둘 다 끝난 뒤에 닫아야 합니다.",
    },
  ],
},
{
  unit: "표준 라이브러리 실무 중급: json·time·strings·io",
  lesson: "직접 짜 보기 — json 태그와 시간",
  th: {
    sum: "`encoding/json` 은 **대문자로 시작하는 필드만** 내보낸다. 소문자 필드는 조용히 사라진다.",
    body: [
      { h: "태그로 이름 정하기", t: "Go 필드 이름은 `UserName` 인데 JSON 은 `user_name` 이어야 할 때 `json:\"user_name\"` 태그를 붙인다. 값이 없을 때 아예 빼려면 `omitempty` 를 더한다. 태그 문법은 문자열이라 오타가 나도 컴파일 오류가 아니다 — 조용히 무시된다." },
      { h: "시간 더하기", t: "`t.Add(24 * time.Hour)` 는 정확히 24시간 뒤다. '내일 같은 시각' 은 서머타임 때문에 다를 수 있어 `t.AddDate(0, 0, 1)` 을 쓴다. 둘을 섞으면 하루에 한 시간씩 어긋난다." },
    ],
    code: { c: "type User struct {\n    Name string `json:\"name\"`\n    age  int     // 소문자 — 나가지 않는다\n}\n\nt.Add(24 * time.Hour)   // 정확히 24시간\nt.AddDate(0, 0, 1)      // 달력상 하루", cap: "대문자 필드만 JSON 으로 나간다" },
    key: ["소문자 필드는 JSON 에 안 나간다", "이름은 `json:\"…\"` 태그로", "달력 계산은 `AddDate`"],
  },
  q: [
    {
      k: "ToJSON · 이름을 맞춰 내보내기",
      pkg: "ex",
      q: "구조체를 JSON 으로 바꾸되 키가 <code>name</code>, <code>age</code> 여야 합니다. 나이가 <code>0</code> 이면 <b>키 자체를 빼</b> 주세요.",
      src: "package ex\n\nimport \"encoding/json\"\n\ntype User struct {\n\tName string\n\tAge  int\n}\n\nfunc ToJSON(u User) (string, error) {\n\tb, err := json.Marshal(u)\n\treturn string(b), err\n}\n",
      sol: "package ex\n\nimport \"encoding/json\"\n\ntype User struct {\n\tName string `json:\"name\"`\n\tAge  int    `json:\"age,omitempty\"`\n}\n\nfunc ToJSON(u User) (string, error) {\n\tb, err := json.Marshal(u)\n\treturn string(b), err\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestToJSON(t *testing.T) {\n\tgot, err := ToJSON(User{Name: \"가영\", Age: 30})\n\tif err != nil {\n\t\tt.Fatal(err)\n\t}\n\tif got != `{\"name\":\"가영\",\"age\":30}` {\n\t\tt.Fatalf(\"got %s\", got)\n\t}\n\tgot2, _ := ToJSON(User{Name: \"나연\"})\n\tif got2 != `{\"name\":\"나연\"}` {\n\t\tt.Fatalf(\"나이가 0이면 빠져야 한다: %s\", got2)\n\t}\n}\n" },
      ex: "태그가 없으면 Go 필드 이름 그대로 Name·Age 로 나갑니다. 그리고 omitempty 가 없으면 0 도 그대로 실려요.",
    },
    {
      k: "NextDay · 달력상 하루 뒤",
      pkg: "ex",
      q: "받은 시각의 <b>달력상 하루 뒤</b>를 돌려주세요. 월말·연말을 넘어가도 정확해야 합니다.",
      src: "package ex\n\nimport \"time\"\n\nfunc NextDay(t time.Time) time.Time {\n\treturn t.Add(24 * time.Hour)\n}\n\nfunc DaysBetween(a, b time.Time) int {\n\treturn int(b.Sub(a).Hours()) / 24\n}\n",
      sol: "package ex\n\nimport \"time\"\n\nfunc NextDay(t time.Time) time.Time {\n\treturn t.AddDate(0, 0, 1)\n}\n\nfunc DaysBetween(a, b time.Time) int {\n\treturn int(b.Sub(a).Hours()) / 24\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestNextDay(t *testing.T) {\n\t// 서머타임이 있는 지역에서 시계가 한 시간 앞당겨지는 날\n\tloc, err := time.LoadLocation(\"America/New_York\")\n\tif err != nil {\n\t\tloc = time.UTC\n\t}\n\tstart := time.Date(2026, 3, 7, 12, 0, 0, 0, loc)\n\tgot := NextDay(start)\n\tif got.Day() != 8 || got.Hour() != 12 {\n\t\tt.Fatalf(\"3/7 12시의 다음 날은 3/8 12시여야 한다, got %v\", got)\n\t}\n\tend := time.Date(2026, 12, 31, 9, 0, 0, 0, time.UTC)\n\tif n := NextDay(end); n.Year() != 2027 || n.Month() != 1 || n.Day() != 1 {\n\t\tt.Fatalf(\"연말: %v\", n)\n\t}\n}\n" },
      ex: "24시간을 더하는 것과 달력상 하루는 다릅니다. 서머타임이 시작되는 날은 하루가 23시간이라, Add 로는 시각이 한 시간 밀려요.",
    },
  ],
},
{
  unit: "파일과 IO 실무 (심화)",
  lesson: "직접 짜 보기 — Reader 로 받기",
  th: {
    sum: "함수가 파일 경로 대신 `io.Reader` 를 받으면 파일·네트워크·문자열 어디서든 쓸 수 있고, **테스트도 파일 없이** 된다.",
    body: [
      { h: "왜 인터페이스로 받나", t: "`func Count(path string)` 는 테스트할 때마다 진짜 파일을 만들어야 한다. `func Count(r io.Reader)` 로 바꾸면 `strings.NewReader(\"…\")` 를 넘기면 끝이다. 실무 코드에서는 열어 둔 파일을 그대로 넘긴다." },
      { h: "Scanner 의 한계", t: "`bufio.Scanner` 는 한 줄이 너무 길면 조용히 멈춘다(기본 64KB). 끝난 뒤 `scanner.Err()` 를 반드시 확인해야 '끝까지 읽었는지' 알 수 있다 — 이걸 빼먹으면 잘린 결과를 정상으로 착각한다." },
    ],
    code: { c: "func Count(r io.Reader) (int, error) {\n    sc := bufio.NewScanner(r)\n    n := 0\n    for sc.Scan() { n++ }\n    return n, sc.Err()      // 반드시 확인\n}", cap: "Reader 로 받으면 테스트가 쉬워진다" },
    key: ["경로 대신 `io.Reader` 로 받는다", "`scanner.Err()` 를 확인한다", "테스트는 `strings.NewReader` 로"],
  },
  q: [
    {
      k: "CountLines · 줄 세기",
      pkg: "ex",
      q: "<code>io.Reader</code> 에서 읽은 <b>줄 수</b>를 돌려주세요. 읽는 중 문제가 있었으면 <b>에러도</b> 돌려줘야 합니다.",
      src: "package ex\n\nimport (\n\t\"bufio\"\n\t\"io\"\n)\n\nfunc CountLines(r io.Reader) (int, error) {\n\tsc := bufio.NewScanner(r)\n\tn := 0\n\tfor sc.Scan() {\n\t\tn++\n\t}\n\treturn n, nil\n}\n",
      sol: "package ex\n\nimport (\n\t\"bufio\"\n\t\"io\"\n)\n\nfunc CountLines(r io.Reader) (int, error) {\n\tsc := bufio.NewScanner(r)\n\tn := 0\n\tfor sc.Scan() {\n\t\tn++\n\t}\n\treturn n, sc.Err()\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"errors\"\n\t\"strings\"\n\t\"testing\"\n)\n\ntype badReader struct{ left int }\n\nfunc (b *badReader) Read(p []byte) (int, error) {\n\tif b.left > 0 {\n\t\tb.left--\n\t\tp[0] = 'a'\n\t\tp[1] = '\\n'\n\t\treturn 2, nil\n\t}\n\treturn 0, errors.New(\"읽기 실패\")\n}\n\nfunc TestCountLines(t *testing.T) {\n\tif n, err := CountLines(strings.NewReader(\"a\\nb\\nc\\n\")); n != 3 || err != nil {\n\t\tt.Fatalf(\"3줄: %d %v\", n, err)\n\t}\n\tif n, err := CountLines(strings.NewReader(\"\")); n != 0 || err != nil {\n\t\tt.Fatalf(\"빈 입력: %d %v\", n, err)\n\t}\n\tif _, err := CountLines(&badReader{left: 1}); err == nil {\n\t\tt.Fatal(\"읽다가 실패하면 에러를 돌려줘야 한다\")\n\t}\n}\n" },
      ex: "Scan() 이 false 를 돌려주는 이유는 '끝' 일 수도 있고 '실패' 일 수도 있습니다. sc.Err() 를 확인하지 않으면 중간에 끊긴 결과를 정상으로 착각해요.",
    },
    {
      k: "ReadAll · 다 읽고 다듬기",
      pkg: "ex",
      q: "<code>io.Reader</code> 의 내용을 전부 읽어 <b>앞뒤 공백을 없앤</b> 문자열로 돌려주세요. 실패하면 빈 문자열과 에러입니다.",
      src: "package ex\n\nimport (\n\t\"io\"\n\t\"strings\"\n)\n\nfunc ReadAll(r io.Reader) (string, error) {\n\tb, err := io.ReadAll(r)\n\treturn strings.TrimSpace(string(b)), err\n}\n",
      sol: "package ex\n\nimport (\n\t\"io\"\n\t\"strings\"\n)\n\nfunc ReadAll(r io.Reader) (string, error) {\n\tb, err := io.ReadAll(r)\n\tif err != nil {\n\t\treturn \"\", err\n\t}\n\treturn strings.TrimSpace(string(b)), nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"errors\"\n\t\"strings\"\n\t\"testing\"\n)\n\ntype partial struct{ done bool }\n\nfunc (p *partial) Read(b []byte) (int, error) {\n\tif !p.done {\n\t\tp.done = true\n\t\tcopy(b, \"조각\")\n\t\treturn len(\"조각\"), nil\n\t}\n\treturn 0, errors.New(\"끊김\")\n}\n\nfunc TestReadAll(t *testing.T) {\n\tif s, err := ReadAll(strings.NewReader(\"  안녕  \")); s != \"안녕\" || err != nil {\n\t\tt.Fatalf(\"%q %v\", s, err)\n\t}\n\ts, err := ReadAll(&partial{})\n\tif err == nil {\n\t\tt.Fatal(\"끊기면 에러여야 한다\")\n\t}\n\tif s != \"\" {\n\t\tt.Fatalf(\"실패했으면 빈 문자열이어야 한다: %q\", s)\n\t}\n}\n" },
      ex: "에러가 났는데도 읽다 만 조각을 함께 돌려주고 있습니다. 받는 쪽이 에러를 안 보면 잘린 데이터를 그대로 써요 — 실패하면 값도 비워서 돌려줘야 합니다.",
    },
  ],
},
{
  unit: "성능과 메모리 심화: 이스케이프 분석·할당 줄이기·벤치마크",
  lesson: "직접 짜 보기 — 할당을 줄이기",
  th: {
    sum: "Go 에서 가장 흔한 성능 문제는 알고리즘이 아니라 **불필요한 할당**이다.",
    body: [
      { h: "문자열 이어 붙이기", t: "`s += x` 는 문자열이 불변이라 매번 새로 만든다. n번 이으면 O(n²)이다. `strings.Builder` 는 안에서 버퍼를 키워 가며 한 번만 문자열로 만든다 — 길이를 안다면 `Grow` 로 미리 잡아 두면 더 낫다." },
      { h: "슬라이스 미리 잡기", t: "`append` 는 용량이 모자라면 새 배열로 옮긴다. 몇 개가 들어올지 안다면 `make([]T, 0, n)` 으로 미리 잡아 두는 것만으로 복사가 사라진다. 반복문 밖에서 한 줄이면 되는 개선이다." },
    ],
    code: { c: "var b strings.Builder\nb.Grow(len(xs) * 4)\nfor _, x := range xs { b.WriteString(x) }\nreturn b.String()", cap: "Builder 는 한 번만 문자열을 만든다" },
    key: ["`s += x` 반복은 O(n²)", "`strings.Builder` 를 쓴다", "개수를 알면 `make(…, 0, n)`"],
  },
  q: [
    {
      k: "Join · 이어 붙이기",
      pkg: "ex",
      q: "문자열 슬라이스를 구분자로 이어 붙여 돌려주세요. <code>strings.Builder</code> 를 써서 <b>할당을 줄여야</b> 합니다.",
      src: "package ex\n\nfunc Join(xs []string, sep string) string {\n\ts := \"\"\n\tfor i, x := range xs {\n\t\tif i > 0 {\n\t\t\ts += sep\n\t\t}\n\t\ts += x\n\t}\n\treturn s\n}\n",
      sol: "package ex\n\nimport \"strings\"\n\nfunc Join(xs []string, sep string) string {\n\tvar b strings.Builder\n\tfor i, x := range xs {\n\t\tif i > 0 {\n\t\t\tb.WriteString(sep)\n\t\t}\n\t\tb.WriteString(x)\n\t}\n\treturn b.String()\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc TestJoin(t *testing.T) {\n\tif got := Join([]string{\"a\", \"b\", \"c\"}, \"-\"); got != \"a-b-c\" {\n\t\tt.Fatalf(\"got %q\", got)\n\t}\n\tif got := Join(nil, \"-\"); got != \"\" {\n\t\tt.Fatalf(\"빈 입력: %q\", got)\n\t}\n\tif got := Join([]string{\"x\"}, \",\"); got != \"x\" {\n\t\tt.Fatalf(\"하나: %q\", got)\n\t}\n}\n\n// 1000개를 이을 때 할당이 몇 번 일어나는지 본다.\n// s += x 방식은 원소마다 새 문자열을 만들어 수백 번 할당한다.\nfunc TestJoinAllocs(t *testing.T) {\n\txs := make([]string, 1000)\n\tfor i := range xs {\n\t\txs[i] = \"abcdefgh\"\n\t}\n\tn := testing.AllocsPerRun(20, func() { _ = Join(xs, \",\") })\n\tif n > 40 {\n\t\tt.Fatalf(\"할당이 %.0f회다 — strings.Builder 로 줄여야 한다\", n)\n\t}\n\tif got := Join(xs, \",\"); !strings.HasPrefix(got, \"abcdefgh,abcdefgh\") {\n\t\tt.Fatal(\"내용이 틀렸다\")\n\t}\n}\n" },
      ex: "문자열은 불변이라 s += x 는 매번 전체를 새로 복사합니다. 1000개면 수백 번 할당이 일어나요. Builder 는 버퍼를 키워 가며 마지막에 한 번만 문자열을 만듭니다.",
    },
    {
      k: "Filter · 미리 잡아 두고 담기",
      pkg: "ex",
      q: "조건에 맞는 값만 골라 돌려주세요. 결과 슬라이스의 <b>용량을 미리 잡아</b> 중간 재할당을 없애야 합니다.",
      src: "package ex\n\nfunc Filter(xs []int, ok func(int) bool) []int {\n\tvar out []int\n\tfor _, x := range xs {\n\t\tif ok(x) {\n\t\t\tout = append(out, x)\n\t\t}\n\t}\n\treturn out\n}\n",
      sol: "package ex\n\nfunc Filter(xs []int, ok func(int) bool) []int {\n\tout := make([]int, 0, len(xs))\n\tfor _, x := range xs {\n\t\tif ok(x) {\n\t\t\tout = append(out, x)\n\t\t}\n\t}\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestFilter(t *testing.T) {\n\tgot := Filter([]int{1, -2, 3}, func(v int) bool { return v > 0 })\n\tif len(got) != 2 || got[0] != 1 || got[1] != 3 {\n\t\tt.Fatalf(\"got %v\", got)\n\t}\n\tif e := Filter(nil, func(int) bool { return true }); len(e) != 0 {\n\t\tt.Fatalf(\"빈 입력: %v\", e)\n\t}\n}\n\nfunc TestFilterAllocs(t *testing.T) {\n\txs := make([]int, 4096)\n\tall := func(int) bool { return true }\n\tn := testing.AllocsPerRun(20, func() { _ = Filter(xs, all) })\n\tif n > 1 {\n\t\tt.Fatalf(\"할당이 %.0f회다 — 용량을 미리 잡으면 1회면 된다\", n)\n\t}\n}\n" },
      ex: "var out []int 로 시작하면 append 가 용량을 넘길 때마다 새 배열로 복사합니다. 4096개면 열 번 넘게 다시 잡아요. 최대 개수를 알면 make(…, 0, len(xs)) 한 줄로 없앨 수 있습니다.",
    },
  ],
},
{
  unit: "HTTP 서버 실무 심화: 미들웨어·타임아웃·graceful shutdown",
  lesson: "직접 짜 보기 — 핸들러와 미들웨어",
  th: {
    sum: "`http.Handler` 는 `ServeHTTP(w, r)` 하나짜리 인터페이스다. 미들웨어는 **핸들러를 받아 핸들러를 돌려주는 함수**일 뿐이다.",
    body: [
      { h: "상태 코드는 한 번만", t: "`w.WriteHeader(404)` 를 부른 뒤에 또 부르면 무시되고 경고가 남는다. 그리고 `w.Write` 를 먼저 하면 자동으로 200이 나가 버려서, 그 뒤의 `WriteHeader` 는 효과가 없다. **코드 먼저, 본문 나중**이 순서다." },
      { h: "미들웨어의 모양", t: "`func(next http.Handler) http.Handler` 로 두면 여러 개를 겹쳐 쓸 수 있다. 안에서 `next.ServeHTTP(w, r)` 를 부르는 것을 빠뜨리면 요청이 그대로 멈춘다 — 응답이 비는 흔한 실수다." },
    ],
    code: { c: "func WithHeader(next http.Handler) http.Handler {\n    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n        w.Header().Set(\"X-App\", \"1\")   // 쓰기 전에\n        next.ServeHTTP(w, r)\n    })\n}", cap: "헤더는 본문을 쓰기 전에 정한다" },
    key: ["상태 코드는 본문보다 먼저", "미들웨어는 핸들러→핸들러", "`next.ServeHTTP` 를 빠뜨리지 않는다"],
  },
  q: [
    {
      k: "Handler · 상태 코드를 제대로",
      pkg: "ex",
      q: "<code>?name=</code> 이 없으면 <b>400</b> 과 <code>\"이름이 필요합니다\"</code>, 있으면 <b>200</b> 과 <code>\"안녕 이름\"</code> 을 돌려주세요.",
      src: "package ex\n\nimport (\n\t\"fmt\"\n\t\"net/http\"\n)\n\nfunc Handler(w http.ResponseWriter, r *http.Request) {\n\tname := r.URL.Query().Get(\"name\")\n\tif name == \"\" {\n\t\tfmt.Fprint(w, \"이름이 필요합니다\")\n\t\tw.WriteHeader(http.StatusBadRequest)\n\t\treturn\n\t}\n\tfmt.Fprintf(w, \"안녕 %s\", name)\n}\n",
      sol: "package ex\n\nimport (\n\t\"fmt\"\n\t\"net/http\"\n)\n\nfunc Handler(w http.ResponseWriter, r *http.Request) {\n\tname := r.URL.Query().Get(\"name\")\n\tif name == \"\" {\n\t\tw.WriteHeader(http.StatusBadRequest)\n\t\tfmt.Fprint(w, \"이름이 필요합니다\")\n\t\treturn\n\t}\n\tfmt.Fprintf(w, \"안녕 %s\", name)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"net/http\"\n\t\"net/http/httptest\"\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc TestHandler(t *testing.T) {\n\tw := httptest.NewRecorder()\n\tHandler(w, httptest.NewRequest(\"GET\", \"/?name=가영\", nil))\n\tif w.Code != http.StatusOK {\n\t\tt.Fatalf(\"정상은 200: %d\", w.Code)\n\t}\n\tif !strings.Contains(w.Body.String(), \"안녕 가영\") {\n\t\tt.Fatalf(\"본문: %q\", w.Body.String())\n\t}\n\n\tw2 := httptest.NewRecorder()\n\tHandler(w2, httptest.NewRequest(\"GET\", \"/\", nil))\n\tif w2.Code != http.StatusBadRequest {\n\t\tt.Fatalf(\"이름이 없으면 400이어야 한다: %d\", w2.Code)\n\t}\n}\n" },
      ex: "본문을 먼저 쓰면 그 순간 200 이 확정돼 나갑니다. 뒤에 부른 WriteHeader(400) 은 무시돼요 — 상태 코드를 먼저 정하고 본문을 씁니다.",
    },
    {
      k: "Middleware · 다음으로 넘기기",
      pkg: "ex",
      q: "모든 응답에 <code>X-App: coderun</code> 헤더를 붙이는 미들웨어를 만드세요. 안쪽 핸들러의 <b>응답은 그대로</b> 나가야 합니다.",
      src: "package ex\n\nimport \"net/http\"\n\nfunc WithHeader(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tw.Header().Set(\"X-App\", \"coderun\")\n\t})\n}\n",
      sol: "package ex\n\nimport \"net/http\"\n\nfunc WithHeader(next http.Handler) http.Handler {\n\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tw.Header().Set(\"X-App\", \"coderun\")\n\t\tnext.ServeHTTP(w, r)\n\t})\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"fmt\"\n\t\"net/http\"\n\t\"net/http/httptest\"\n\t\"testing\"\n)\n\nfunc TestWithHeader(t *testing.T) {\n\tinner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {\n\t\tfmt.Fprint(w, \"본문\")\n\t})\n\tw := httptest.NewRecorder()\n\tWithHeader(inner).ServeHTTP(w, httptest.NewRequest(\"GET\", \"/\", nil))\n\tif got := w.Header().Get(\"X-App\"); got != \"coderun\" {\n\t\tt.Fatalf(\"헤더: %q\", got)\n\t}\n\tif w.Body.String() != \"본문\" {\n\t\tt.Fatalf(\"안쪽 핸들러의 응답이 그대로 나와야 한다: %q\", w.Body.String())\n\t}\n}\n" },
      ex: "next.ServeHTTP 를 부르지 않으면 헤더만 붙고 요청이 거기서 끝납니다. 응답 본문이 비어요 — 미들웨어에서 가장 흔한 실수입니다.",
    },
  ],
},
];
