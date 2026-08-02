/* Go 핵심 유닛 실습.
   Go 는 565문항에 실습 38개(6.7%)로 큰 트랙 중 가장 낮다. 게다가 그 38개는 전부
   exercism 임포트 유닛에 몰려 있어서, 배우는 유닛 29개는 하나도 없다.
   문법을 고르기로만 익히고 컴파일러를 한 번도 못 만나는 구조다.

   채점은 러너의 go test 가 한다 — 테스트를 다른 형식으로 옮기지 않는다.
   그래서 nil 맵 쓰기나 타입드 nil 처럼 '진짜 Go 런타임에서만 드러나는' 것을 낼 수 있다.

   각 문항: pkg(패키지 이름) · src(시작 코드, 반드시 실패) · sol(정답) · test(테스트 파일). */
module.exports = [
{
  unit: "Go 첫걸음",
  lesson: "직접 짜 보기 — 값과 에러를 함께 돌려주기",
  th: {
    sum: "Go 함수는 값과 에러를 **함께** 돌려준다. 에러를 확인하지 않고 값을 쓰면 제로값을 쓰게 된다.",
    body: [
      { h: "제로값이라는 것", t: "Go 는 선언만 해도 값이 채워진다 — 숫자는 `0`, 문자열은 `\"\"`, 불리언은 `false`, 포인터·맵·슬라이스는 `nil`. 그래서 에러가 난 자리에서도 값이 '있어 보인다'. 확인하지 않으면 0을 진짜 0으로 착각한다." },
      { h: "에러를 먼저 본다", t: "관용구는 `v, err := f()` 뒤에 곧바로 `if err != nil { return … }` 이다. 성공 경로를 들여쓰지 않고 실패를 먼저 걸러내면 읽기도 쉽다. 에러를 무시하려면 `_` 로 명시해야 해서, 무시가 눈에 보인다." },
    ],
    code: { c: "n, err := strconv.Atoi(s)\nif err != nil {\n    return 0, err      // 실패를 먼저 걸러낸다\n}\nreturn n * 2, nil", cap: "에러를 먼저 확인하고 값을 쓴다" },
    key: ["에러는 값과 함께 돌아온다", "확인 전의 값은 제로값일 수 있다", "무시하려면 `_` 로 명시한다"],
  },
  q: [
    {
      k: "Double · 숫자로 바꿔 두 배",
      pkg: "ex",
      q: "문자열을 정수로 바꿔 <b>두 배</b>를 돌려주세요. 숫자가 아니면 <code>0</code> 과 <b>에러</b>를 돌려줘야 합니다.",
      src: "package ex\n\nimport \"strconv\"\n\nfunc Double(s string) (int, error) {\n\tn, _ := strconv.Atoi(s)\n\treturn n * 2, nil\n}\n",
      sol: "package ex\n\nimport \"strconv\"\n\nfunc Double(s string) (int, error) {\n\tn, err := strconv.Atoi(s)\n\tif err != nil {\n\t\treturn 0, err\n\t}\n\treturn n * 2, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestDouble(t *testing.T) {\n\tif v, err := Double(\"21\"); v != 42 || err != nil {\n\t\tt.Fatalf(\"Double(21) = %d, %v\", v, err)\n\t}\n\tif v, err := Double(\"0\"); v != 0 || err != nil {\n\t\tt.Fatalf(\"Double(0) = %d, %v\", v, err)\n\t}\n\tif _, err := Double(\"abc\"); err == nil {\n\t\tt.Fatal(\"Double(abc) 는 에러를 돌려줘야 한다\")\n\t}\n\tif v, _ := Double(\"abc\"); v != 0 {\n\t\tt.Fatalf(\"에러일 때 값은 0 이어야 한다, got %d\", v)\n\t}\n}\n" },
      ex: "에러를 _ 로 버리면 Atoi 가 실패해도 그냥 넘어갑니다. n 은 제로값 0 이고 0*2 = 0 이라 '정상적으로 0' 처럼 보여요. 에러를 먼저 확인해야 합니다.",
    },
    {
      k: "Sum · 합계 구하기",
      pkg: "ex",
      q: "정수 슬라이스의 <b>합</b>을 돌려주세요. 빈 슬라이스면 <code>0</code> 입니다.",
      src: "package ex\n\nfunc Sum(xs []int) int {\n\tvar total int\n\tfor i := range xs {\n\t\ttotal += i\n\t}\n\treturn total\n}\n",
      sol: "package ex\n\nfunc Sum(xs []int) int {\n\tvar total int\n\tfor _, v := range xs {\n\t\ttotal += v\n\t}\n\treturn total\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestSum(t *testing.T) {\n\tcases := []struct {\n\t\tin   []int\n\t\twant int\n\t}{\n\t\t{[]int{10, 20, 30}, 60},\n\t\t{[]int{}, 0},\n\t\t{nil, 0},\n\t\t{[]int{5}, 5},\n\t\t{[]int{-1, 1}, 0},\n\t}\n\tfor _, c := range cases {\n\t\tif got := Sum(c.in); got != c.want {\n\t\t\tt.Fatalf(\"Sum(%v) = %d, want %d\", c.in, got, c.want)\n\t\t}\n\t}\n}\n" },
      ex: "for i := range xs 는 인덱스를 줍니다. 값을 받으려면 for _, v := range xs 라고 써야 해요 — Go 를 처음 쓸 때 가장 자주 하는 실수입니다.",
    },
  ],
},
{
  unit: "슬라이스와 배열",
  lesson: "직접 짜 보기 — 슬라이스는 배열을 가리킨다",
  th: {
    sum: "슬라이스는 값을 담은 것이 아니라 **배열의 일부를 가리키는 창**이다. 복사한 줄 알았는데 같은 배열을 보고 있는 일이 흔하다.",
    body: [
      { h: "잘라낸 것은 복사가 아니다", t: "`b := a[1:3]` 은 새 배열을 만들지 않는다. b 를 고치면 a 도 바뀐다. 진짜 복사가 필요하면 `make` 로 새로 만들고 `copy(dst, src)` 를 쓴다 — `copy` 는 짧은 쪽 길이만큼만 옮기므로 dst 를 먼저 충분히 크게 만들어야 한다." },
      { h: "append 가 언제 새 배열을 만드나", t: "여유 공간(capacity)이 남아 있으면 `append` 는 **원래 배열에 그대로 쓴다.** 그래서 잘라낸 슬라이스에 append 하면 원본의 뒤쪽을 덮어쓸 수 있다. 여유가 없으면 그때 새 배열로 옮긴다 — 그래서 결과가 상황에 따라 달라 보인다." },
    ],
    code: { c: "a := []int{1, 2, 3}\nb := a[:2]\nb = append(b, 99)   // a[2] 를 덮어쓴다!\n\nc := make([]int, len(a))\ncopy(c, a)           // 이게 진짜 복사", cap: "잘라낸 슬라이스는 같은 배열을 본다" },
    key: ["슬라이스는 배열을 가리킨다", "복사는 `make` + `copy`", "`append` 는 여유가 있으면 원본에 쓴다"],
  },
  q: [
    {
      k: "CopyOf · 진짜 복사본 만들기",
      pkg: "ex",
      q: "슬라이스의 <b>독립된 복사본</b>을 돌려주세요. 복사본을 고쳐도 원본이 바뀌면 안 됩니다.",
      src: "package ex\n\nfunc CopyOf(xs []int) []int {\n\treturn xs[:]\n}\n",
      sol: "package ex\n\nfunc CopyOf(xs []int) []int {\n\tout := make([]int, len(xs))\n\tcopy(out, xs)\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestCopyOf(t *testing.T) {\n\ta := []int{1, 2, 3}\n\tb := CopyOf(a)\n\tif len(b) != 3 || b[0] != 1 || b[2] != 3 {\n\t\tt.Fatalf(\"내용이 같아야 한다: %v\", b)\n\t}\n\tb[0] = 99\n\tif a[0] != 1 {\n\t\tt.Fatalf(\"복사본을 고쳤는데 원본이 바뀌었다: %v\", a)\n\t}\n\tif got := CopyOf(nil); len(got) != 0 {\n\t\tt.Fatalf(\"nil 은 빈 슬라이스여야 한다: %v\", got)\n\t}\n}\n" },
      ex: "xs[:] 는 같은 배열을 가리키는 창을 하나 더 만들 뿐입니다. 한쪽을 고치면 다른 쪽도 바뀌어요. make 로 새 배열을 잡고 copy 해야 독립됩니다.",
    },
    {
      k: "AppendSafe · 원본을 건드리지 않고 붙이기",
      pkg: "ex",
      q: "슬라이스 <b>앞 n개</b>만 남기고 값을 하나 붙인 <b>새 슬라이스</b>를 돌려주세요. 원본은 그대로여야 합니다.",
      src: "package ex\n\nfunc AppendSafe(xs []int, n, v int) []int {\n\treturn append(xs[:n], v)\n}\n",
      sol: "package ex\n\nfunc AppendSafe(xs []int, n, v int) []int {\n\tout := make([]int, n, n+1)\n\tcopy(out, xs[:n])\n\treturn append(out, v)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestAppendSafe(t *testing.T) {\n\ta := []int{1, 2, 3, 4}\n\tgot := AppendSafe(a, 2, 99)\n\twant := []int{1, 2, 99}\n\tif len(got) != len(want) {\n\t\tt.Fatalf(\"길이가 다르다: %v\", got)\n\t}\n\tfor i := range want {\n\t\tif got[i] != want[i] {\n\t\t\tt.Fatalf(\"got %v, want %v\", got, want)\n\t\t}\n\t}\n\tif a[2] != 3 {\n\t\tt.Fatalf(\"원본이 덮어써졌다: %v\", a)\n\t}\n}\n" },
      ex: "append(xs[:n], v) 는 여유 공간이 남아 있으면 원본 배열의 n번째 자리에 그대로 씁니다. a[2] 가 3 에서 99 로 바뀌어요 — 조용히 남의 데이터를 망가뜨리는 전형적인 버그입니다.",
    },
  ],
},
{
  unit: "맵(map)",
  lesson: "직접 짜 보기 — 없는 열쇠와 nil 맵",
  th: {
    sum: "맵은 없는 열쇠를 꺼내도 오류가 아니라 **제로값**을 준다. 그래서 '없음' 과 '0' 을 구별하려면 따로 물어야 한다.",
    body: [
      { h: "쉼표 ok 관용구", t: "`v, ok := m[k]` 의 `ok` 가 열쇠의 존재 여부다. `if m[k] == 0` 으로 판단하면 '값이 진짜 0인 항목' 과 '없는 항목' 이 같아진다. 재고 0개와 미등록을 섞는 사고가 여기서 난다." },
      { h: "nil 맵은 읽기만 된다", t: "선언만 한 맵(`var m map[string]int`)은 nil 이다. **읽으면 제로값이 나오지만 쓰면 패닉**이다. `make(map[string]int)` 나 리터럴로 반드시 초기화해야 한다 — 구조체 필드로 둔 맵에서 자주 놓친다." },
    ],
    code: { c: "v, ok := m[\"a\"]      // ok 가 존재 여부\n\nvar m map[string]int  // nil\n_ = m[\"x\"]            // 읽기는 된다 (0)\n// m[\"x\"] = 1         // 패닉!\nm = make(map[string]int)", cap: "nil 맵은 읽기만 되고 쓰면 패닉이다" },
    key: ["`v, ok := m[k]` 로 존재를 확인한다", "없는 열쇠는 제로값을 준다", "nil 맵에 쓰면 패닉"],
  },
  q: [
    {
      k: "Lookup · 없음과 0을 구별하기",
      pkg: "ex",
      q: "맵에서 값을 찾아 <code>(값, 있음여부)</code> 를 돌려주세요. <b>값이 0인 항목</b>도 있으면 <code>true</code> 여야 합니다.",
      src: "package ex\n\nfunc Lookup(m map[string]int, k string) (int, bool) {\n\tv := m[k]\n\treturn v, v != 0\n}\n",
      sol: "package ex\n\nfunc Lookup(m map[string]int, k string) (int, bool) {\n\tv, ok := m[k]\n\treturn v, ok\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestLookup(t *testing.T) {\n\tm := map[string]int{\"a\": 5, \"zero\": 0}\n\tif v, ok := Lookup(m, \"a\"); v != 5 || !ok {\n\t\tt.Fatalf(\"a: %d %v\", v, ok)\n\t}\n\tif v, ok := Lookup(m, \"zero\"); v != 0 || !ok {\n\t\tt.Fatalf(\"값이 0이어도 있으면 true 여야 한다: %d %v\", v, ok)\n\t}\n\tif v, ok := Lookup(m, \"none\"); v != 0 || ok {\n\t\tt.Fatalf(\"없으면 false 여야 한다: %d %v\", v, ok)\n\t}\n\tif _, ok := Lookup(nil, \"x\"); ok {\n\t\tt.Fatal(\"nil 맵은 항상 false\")\n\t}\n}\n" },
      ex: "v != 0 으로 존재를 판단하면 '값이 진짜 0인 항목' 을 없다고 합니다. 쉼표 ok 관용구가 그 구별을 해 줘요.",
    },
    {
      k: "CountWords · nil 맵에 쓰지 않기",
      pkg: "ex",
      q: "문자열 슬라이스에서 각 값이 <b>몇 번 나왔는지</b> 세어 맵으로 돌려주세요. 입력이 비어도 <b>패닉 없이</b> 빈 맵을 돌려줘야 합니다.",
      src: "package ex\n\nfunc CountWords(xs []string) map[string]int {\n\tvar m map[string]int\n\tfor _, w := range xs {\n\t\tm[w]++\n\t}\n\treturn m\n}\n",
      sol: "package ex\n\nfunc CountWords(xs []string) map[string]int {\n\tm := make(map[string]int)\n\tfor _, w := range xs {\n\t\tm[w]++\n\t}\n\treturn m\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestCountWords(t *testing.T) {\n\tm := CountWords([]string{\"a\", \"b\", \"a\"})\n\tif m[\"a\"] != 2 || m[\"b\"] != 1 {\n\t\tt.Fatalf(\"세기가 틀렸다: %v\", m)\n\t}\n\te := CountWords(nil)\n\tif e == nil {\n\t\tt.Fatal(\"빈 입력에도 맵을 돌려줘야 한다\")\n\t}\n\tif len(e) != 0 {\n\t\tt.Fatalf(\"빈 맵이어야 한다: %v\", e)\n\t}\n}\n" },
      ex: "var m map[string]int 은 nil 맵입니다. 읽기는 되지만 쓰는 순간 'assignment to entry in nil map' 으로 패닉이 나요. make 로 초기화해야 합니다.",
    },
  ],
},
{
  unit: "구조체(struct)",
  lesson: "직접 짜 보기 — 값이 복사된다는 것",
  th: {
    sum: "Go 는 구조체를 **값으로 복사**한다. 함수에 넘기거나 값 리시버 메서드를 부르면 사본이 만들어진다.",
    body: [
      { h: "고치려면 포인터", t: "`func (c Counter) Inc()` 는 사본을 고치고 버린다 — 원본은 그대로다. 고치려면 `func (c *Counter) Inc()` 여야 한다. 컴파일 오류가 나지 않고 조용히 아무 일도 안 일어나기 때문에 알아채기 어렵다." },
      { h: "일관성이 중요하다", t: "한 타입의 메서드는 값 리시버와 포인터 리시버를 섞지 않는 편이 좋다. 섞으면 인터페이스를 만족하는지가 값이냐 포인터냐에 따라 달라져 헷갈린다. 하나라도 고쳐야 하면 전부 포인터로 맞춘다." },
    ],
    code: { c: "func (c *Counter) Inc() { c.N++ }   // 원본이 바뀐다\nfunc (c Counter) Get() int { return c.N }", cap: "고치는 메서드는 포인터 리시버" },
    key: ["구조체는 값으로 복사된다", "고치려면 포인터 리시버", "한 타입의 리시버는 섞지 않는다"],
  },
  q: [
    {
      k: "Counter · 값이 실제로 늘게 하기",
      pkg: "ex",
      q: "<code>Inc()</code> 를 부르면 카운터가 <b>실제로</b> 1 늘게 하세요. <code>Get()</code> 은 현재 값을 돌려줍니다.",
      src: "package ex\n\ntype Counter struct {\n\tN int\n}\n\nfunc (c Counter) Inc() {\n\tc.N++\n}\n\nfunc (c Counter) Get() int {\n\treturn c.N\n}\n",
      sol: "package ex\n\ntype Counter struct {\n\tN int\n}\n\nfunc (c *Counter) Inc() {\n\tc.N++\n}\n\nfunc (c *Counter) Get() int {\n\treturn c.N\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestCounter(t *testing.T) {\n\tc := &Counter{}\n\tif c.Get() != 0 {\n\t\tt.Fatalf(\"처음은 0: %d\", c.Get())\n\t}\n\tc.Inc()\n\tc.Inc()\n\tif c.Get() != 2 {\n\t\tt.Fatalf(\"두 번 늘렸으면 2: %d\", c.Get())\n\t}\n\tc.Inc()\n\tif c.N != 3 {\n\t\tt.Fatalf(\"필드가 실제로 늘어야 한다: %d\", c.N)\n\t}\n}\n" },
      ex: "값 리시버는 구조체의 사본을 받습니다. c.N++ 는 사본을 고치고 버려서 원본은 그대로예요 — 컴파일 오류도 안 나서 알아채기 어렵습니다.",
    },
    {
      k: "Scale · 슬라이스 안의 구조체 고치기",
      pkg: "ex",
      q: "구조체 슬라이스의 모든 <code>V</code> 값을 <b>배수만큼 곱해</b> 제자리에서 바꾸세요.",
      src: "package ex\n\ntype Item struct {\n\tV int\n}\n\nfunc Scale(xs []Item, k int) {\n\tfor _, it := range xs {\n\t\tit.V *= k\n\t}\n}\n",
      sol: "package ex\n\ntype Item struct {\n\tV int\n}\n\nfunc Scale(xs []Item, k int) {\n\tfor i := range xs {\n\t\txs[i].V *= k\n\t}\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestScale(t *testing.T) {\n\txs := []Item{{1}, {2}, {3}}\n\tScale(xs, 10)\n\twant := []int{10, 20, 30}\n\tfor i, w := range want {\n\t\tif xs[i].V != w {\n\t\t\tt.Fatalf(\"xs[%d].V = %d, want %d (전체 %v)\", i, xs[i].V, w, xs)\n\t\t}\n\t}\n\tvar empty []Item\n\tScale(empty, 2)\n}\n" },
      ex: "for _, it := range xs 의 it 는 원소의 사본입니다. 사본을 고쳐도 슬라이스는 그대로예요. 인덱스로 xs[i] 를 직접 고쳐야 합니다.",
    },
  ],
},
{
  unit: "인터페이스와 nil 함정 (중급)",
  lesson: "직접 짜 보기 — nil 인데 nil 이 아니다",
  th: {
    sum: "Go 의 인터페이스는 **(타입, 값)** 두 칸이다. 값이 nil 이어도 타입 칸이 채워져 있으면 인터페이스 자체는 nil 이 아니다.",
    body: [
      { h: "가장 악명 높은 함정", t: "`var p *MyErr = nil` 을 `error` 로 돌려주면, 받는 쪽의 `if err != nil` 이 **참**이 된다. 타입 칸에 `*MyErr` 이 들어 있기 때문이다. 아무 문제가 없는데 에러로 처리되는, 원인을 찾기 어려운 버그다." },
      { h: "피하는 법", t: "에러를 돌려주는 함수는 구체 타입 포인터를 담은 변수를 그대로 돌려주지 말고, **성공 경로에서는 리터럴 `nil` 을 돌려준다.** 에러가 있을 때만 그 값을 넣는다." },
    ],
    code: { c: "func bad() error {\n    var e *MyErr        // nil\n    return e            // 인터페이스는 nil 이 아니다!\n}\nfunc good() error {\n    return nil          // 이렇게", cap: "성공 경로에서는 리터럴 nil 을 돌려준다" },
    key: ["인터페이스는 (타입, 값) 두 칸", "값이 nil 이어도 타입이 있으면 nil 이 아니다", "성공이면 리터럴 `nil`"],
  },
  q: [
    {
      k: "Validate · 성공이면 진짜 nil",
      pkg: "ex",
      q: "문자열이 비어 있으면 에러를, 아니면 <b>진짜 nil</b> 을 돌려주세요. 부르는 쪽의 <code>err != nil</code> 이 정확히 동작해야 합니다.",
      src: "package ex\n\ntype MyErr struct{ Msg string }\n\nfunc (e *MyErr) Error() string { return e.Msg }\n\nfunc Validate(s string) error {\n\tvar e *MyErr\n\tif s == \"\" {\n\t\te = &MyErr{Msg: \"비어 있음\"}\n\t}\n\treturn e\n}\n",
      sol: "package ex\n\ntype MyErr struct{ Msg string }\n\nfunc (e *MyErr) Error() string { return e.Msg }\n\nfunc Validate(s string) error {\n\tif s == \"\" {\n\t\treturn &MyErr{Msg: \"비어 있음\"}\n\t}\n\treturn nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestValidate(t *testing.T) {\n\tif err := Validate(\"ok\"); err != nil {\n\t\tt.Fatalf(\"성공인데 err != nil 이다 (%T)\", err)\n\t}\n\terr := Validate(\"\")\n\tif err == nil {\n\t\tt.Fatal(\"빈 문자열은 에러여야 한다\")\n\t}\n\tif err.Error() != \"비어 있음\" {\n\t\tt.Fatalf(\"메시지: %q\", err.Error())\n\t}\n}\n" },
      ex: "var e *MyErr 은 nil 포인터지만, error 인터페이스에 담기면 타입 칸에 *MyErr 이 들어가 인터페이스는 nil 이 아니게 됩니다. 성공 경로에서는 리터럴 nil 을 돌려줘야 해요.",
    },
    {
      k: "Describe · 타입 스위치로 갈라 보기",
      pkg: "ex",
      q: "<code>any</code> 값을 받아 <code>int</code> 면 <code>\"정수\"</code>, <code>string</code> 이면 <code>\"문자열\"</code>, <code>nil</code> 이면 <code>\"없음\"</code>, 나머지는 <code>\"기타\"</code> 를 돌려주세요.",
      src: "package ex\n\nfunc Describe(v any) string {\n\tswitch v.(type) {\n\tcase int:\n\t\treturn \"정수\"\n\tcase string:\n\t\treturn \"문자열\"\n\t}\n\treturn \"기타\"\n}\n",
      sol: "package ex\n\nfunc Describe(v any) string {\n\tswitch v.(type) {\n\tcase nil:\n\t\treturn \"없음\"\n\tcase int:\n\t\treturn \"정수\"\n\tcase string:\n\t\treturn \"문자열\"\n\t}\n\treturn \"기타\"\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestDescribe(t *testing.T) {\n\tcases := []struct {\n\t\tin   any\n\t\twant string\n\t}{\n\t\t{1, \"정수\"},\n\t\t{\"a\", \"문자열\"},\n\t\t{nil, \"없음\"},\n\t\t{3.5, \"기타\"},\n\t\t{true, \"기타\"},\n\t}\n\tfor _, c := range cases {\n\t\tif got := Describe(c.in); got != c.want {\n\t\t\tt.Fatalf(\"Describe(%v) = %q, want %q\", c.in, got, c.want)\n\t\t}\n\t}\n}\n" },
      ex: "타입 스위치에서 nil 은 case nil 로 따로 잡아야 합니다. 빠뜨리면 default 로 떨어져 '기타' 가 돼요.",
    },
  ],
},
{
  unit: "고루틴·채널·동기화 (심화)",
  lesson: "직접 짜 보기 — 기다리고 닫기",
  th: {
    sum: "고루틴은 시작만 하고 기다리지 않으면 결과를 못 본다. 채널은 **보내는 쪽이 닫는다.**",
    body: [
      { h: "WaitGroup 의 짝", t: "`wg.Add(1)` 은 고루틴을 **시작하기 전에**, `defer wg.Done()` 은 고루틴 **안 맨 앞에** 둔다. Add 를 고루틴 안에서 하면 Wait 가 먼저 지나가 버린다. Done 을 빠뜨리면 영원히 기다린다." },
      { h: "누가 닫는가", t: "`range ch` 는 채널이 닫혀야 끝난다. 닫지 않으면 데드락이다. 받는 쪽이 닫으면 보내는 쪽이 '닫힌 채널에 보내기' 로 패닉하므로, **항상 보내는 쪽이** 다 보낸 뒤 닫는다." },
    ],
    code: { c: "var wg sync.WaitGroup\nfor _, x := range xs {\n    wg.Add(1)                 // 시작 전에\n    go func(v int) {\n        defer wg.Done()\n        ch <- v * 2\n    }(x)\n}\ngo func() { wg.Wait(); close(ch) }()   // 다 보낸 뒤 닫는다", cap: "보내는 쪽이 다 보낸 뒤 닫는다" },
    key: ["`Add` 는 시작 전에, `Done` 은 `defer` 로", "`range ch` 는 닫혀야 끝난다", "닫는 것은 보내는 쪽"],
  },
  q: [
    {
      k: "SumAll · 고루틴 결과를 모으기",
      pkg: "ex",
      q: "각 숫자를 <b>고루틴에서</b> 두 배로 만들어 모두 더한 값을 돌려주세요. 순서는 상관없지만 <b>하나도 빠뜨리면 안 됩니다.</b>",
      src: "package ex\n\nimport \"sync\"\n\nfunc SumAll(xs []int) int {\n\tch := make(chan int, len(xs))\n\tvar wg sync.WaitGroup\n\tfor _, x := range xs {\n\t\tgo func(v int) {\n\t\t\twg.Add(1)\n\t\t\tdefer wg.Done()\n\t\t\tch <- v * 2\n\t\t}(x)\n\t}\n\twg.Wait()\n\tclose(ch)\n\ttotal := 0\n\tfor v := range ch {\n\t\ttotal += v\n\t}\n\treturn total\n}\n",
      sol: "package ex\n\nimport \"sync\"\n\nfunc SumAll(xs []int) int {\n\tch := make(chan int, len(xs))\n\tvar wg sync.WaitGroup\n\tfor _, x := range xs {\n\t\twg.Add(1)\n\t\tgo func(v int) {\n\t\t\tdefer wg.Done()\n\t\t\tch <- v * 2\n\t\t}(x)\n\t}\n\twg.Wait()\n\tclose(ch)\n\ttotal := 0\n\tfor v := range ch {\n\t\ttotal += v\n\t}\n\treturn total\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestSumAll(t *testing.T) {\n\tfor i := 0; i < 200; i++ {\n\t\tif got := SumAll([]int{1, 2, 3, 4, 5}); got != 30 {\n\t\t\tt.Fatalf(\"%d번째 시도에서 %d (want 30) — 고루틴을 다 기다리지 못했다\", i, got)\n\t\t}\n\t}\n\tif got := SumAll(nil); got != 0 {\n\t\tt.Fatalf(\"빈 입력: %d\", got)\n\t}\n}\n" },
      ex: "wg.Add(1) 이 고루틴 안에 있으면, 고루틴이 시작되기도 전에 wg.Wait() 가 지나가 버립니다. 결과가 실행할 때마다 달라져요 — Add 는 반드시 시작 전에 부릅니다.",
    },
    {
      k: "Gen · 채널로 흘려보내기",
      pkg: "ex",
      q: "숫자들을 채널로 하나씩 보내는 함수를 만드세요. 받는 쪽이 <code>range</code> 로 <b>끝까지 읽고 멈출 수</b> 있어야 합니다.",
      src: "package ex\n\nfunc Gen(xs []int) <-chan int {\n\tch := make(chan int)\n\tgo func() {\n\t\tfor _, x := range xs {\n\t\t\tch <- x\n\t\t}\n\t}()\n\treturn ch\n}\n",
      sol: "package ex\n\nfunc Gen(xs []int) <-chan int {\n\tch := make(chan int)\n\tgo func() {\n\t\tdefer close(ch)\n\t\tfor _, x := range xs {\n\t\t\tch <- x\n\t\t}\n\t}()\n\treturn ch\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestGen(t *testing.T) {\n\tdone := make(chan []int, 1)\n\tgo func() {\n\t\tvar got []int\n\t\tfor v := range Gen([]int{1, 2, 3}) {\n\t\t\tgot = append(got, v)\n\t\t}\n\t\tdone <- got\n\t}()\n\tselect {\n\tcase got := <-done:\n\t\tif len(got) != 3 || got[0] != 1 || got[2] != 3 {\n\t\t\tt.Fatalf(\"받은 값: %v\", got)\n\t\t}\n\tcase <-time.After(2 * time.Second):\n\t\tt.Fatal(\"range 가 끝나지 않았다 — 채널을 닫지 않았다\")\n\t}\n}\n" },
      ex: "채널을 닫지 않으면 range 가 다음 값을 영원히 기다립니다. 다 보낸 뒤 보내는 쪽에서 close 해야 해요 — defer close(ch) 가 관용구입니다.",
    },
  ],
},
{
  unit: "context·defer·panic (심화)",
  lesson: "직접 짜 보기 — defer 의 순서와 시점",
  th: {
    sum: "`defer` 는 함수가 끝날 때 **역순으로** 실행된다. 그리고 인자는 defer 를 **적은 순간** 평가된다.",
    body: [
      { h: "언제 평가되나", t: "`defer fmt.Println(i)` 는 그 줄을 지날 때의 `i` 를 기억한다. 나중에 i 가 바뀌어도 찍히는 값은 그대로다. 반대로 `defer func(){ fmt.Println(i) }()` 는 끝날 때의 i 를 본다 — 이 차이가 결과를 뒤집는다." },
      { h: "반복문 안의 defer", t: "`defer` 는 **함수**가 끝날 때 돈다. 반복문 안에서 파일을 열고 defer 로 닫으면, 반복이 도는 동안 하나도 안 닫히고 쌓인다. 반복 한 바퀴마다 닫으려면 안쪽을 함수로 감싼다." },
    ],
    code: { c: "for _, f := range files {\n    func() {\n        h := open(f)\n        defer h.Close()   // 이 익명 함수가 끝날 때\n        …\n    }()\n}", cap: "defer 는 함수 단위다" },
    key: ["`defer` 는 역순으로 실행된다", "인자는 적은 순간 평가된다", "반복마다 정리하려면 함수로 감싼다"],
  },
  q: [
    {
      k: "Order · 정리 순서 남기기",
      pkg: "ex",
      q: "<code>defer</code> 로 <code>\"a\"</code>, <code>\"b\"</code>, <code>\"c\"</code> 를 예약해 <b>실제 실행 순서대로</b> 로그에 쌓으세요. 결과는 <code>[c b a]</code> 여야 합니다.",
      src: "package ex\n\nfunc Order() []string {\n\tvar log []string\n\tadd := func(s string) { log = append(log, s) }\n\tadd(\"a\")\n\tadd(\"b\")\n\tadd(\"c\")\n\treturn log\n}\n",
      sol: "package ex\n\nfunc Order() (log []string) {\n\tadd := func(s string) { log = append(log, s) }\n\tdefer add(\"a\")\n\tdefer add(\"b\")\n\tdefer add(\"c\")\n\treturn log\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestOrder(t *testing.T) {\n\tgot := Order()\n\twant := []string{\"c\", \"b\", \"a\"}\n\tif len(got) != len(want) {\n\t\tt.Fatalf(\"got %v, want %v\", got, want)\n\t}\n\tfor i := range want {\n\t\tif got[i] != want[i] {\n\t\t\tt.Fatalf(\"got %v, want %v\", got, want)\n\t\t}\n\t}\n}\n" },
      ex: "defer 없이 그냥 부르면 적은 순서 그대로 [a b c] 입니다. defer 는 역순이라 [c b a] 가 돼요. 그리고 defer 가 채운 값을 돌려주려면 이름 있는 반환값이어야 합니다 — 그냥 return log 는 defer 전의 값을 복사해 버립니다.",
    },
    {
      k: "SafeDiv · 패닉을 에러로 바꾸기",
      pkg: "ex",
      q: "0으로 나누면 패닉이 납니다. <b>패닉을 잡아</b> 에러로 바꿔 돌려주세요. 정상이면 몫과 <code>nil</code> 입니다.",
      src: "package ex\n\nimport \"errors\"\n\nfunc SafeDiv(a, b int) (int, error) {\n\tif b == 0 {\n\t\treturn 0, errors.New(\"0으로 나눔\")\n\t}\n\treturn a / b, nil\n}\n\nfunc Run(f func() int) (v int, err error) {\n\tv = f()\n\treturn v, nil\n}\n",
      sol: "package ex\n\nimport (\n\t\"errors\"\n\t\"fmt\"\n)\n\nfunc SafeDiv(a, b int) (int, error) {\n\tif b == 0 {\n\t\treturn 0, errors.New(\"0으로 나눔\")\n\t}\n\treturn a / b, nil\n}\n\nfunc Run(f func() int) (v int, err error) {\n\tdefer func() {\n\t\tif r := recover(); r != nil {\n\t\t\tv = 0\n\t\t\terr = fmt.Errorf(\"패닉: %v\", r)\n\t\t}\n\t}()\n\tv = f()\n\treturn v, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestSafeDiv(t *testing.T) {\n\tif v, err := SafeDiv(6, 2); v != 3 || err != nil {\n\t\tt.Fatalf(\"6/2 = %d, %v\", v, err)\n\t}\n\tif _, err := SafeDiv(1, 0); err == nil {\n\t\tt.Fatal(\"0으로 나누면 에러\")\n\t}\n}\n\nfunc TestRun(t *testing.T) {\n\tif v, err := Run(func() int { return 7 }); v != 7 || err != nil {\n\t\tt.Fatalf(\"정상: %d %v\", v, err)\n\t}\n\tv, err := Run(func() int { panic(\"붐\") })\n\tif err == nil {\n\t\tt.Fatal(\"패닉을 에러로 바꿔야 한다\")\n\t}\n\tif v != 0 {\n\t\tt.Fatalf(\"패닉이면 값은 0: %d\", v)\n\t}\n}\n" },
      ex: "recover 는 defer 안에서만 동작합니다. Run 에 방어가 없으면 패닉이 그대로 올라가 테스트가 죽어요. 이름 있는 반환값이라야 defer 안에서 결과를 고칠 수 있습니다.",
    },
  ],
},
{
  unit: "에러 처리 관용구와 테스트 (심화)",
  lesson: "직접 짜 보기 — 감싸고 되찾기",
  th: {
    sum: "에러에 맥락을 덧붙이되 **원래 에러를 잃지 않아야** 부르는 쪽이 무슨 일인지 판단할 수 있다.",
    body: [
      { h: "%w 와 %v 의 차이", t: "`fmt.Errorf(\"…: %v\", err)` 는 글자만 남기고 원래 에러를 버린다. `%w` 로 감싸면 안에 그대로 품고 있어서, 나중에 `errors.Is(err, ErrNotFound)` 로 되찾을 수 있다. 한 글자 차이로 판별이 되고 안 되고가 갈린다." },
      { h: "센티넬 에러", t: "`var ErrNotFound = errors.New(\"not found\")` 처럼 미리 만들어 둔 값과 비교하면, 메시지 문자열을 비교하지 않아도 된다. 문자열 비교는 메시지를 다듬는 순간 조용히 깨진다." },
    ],
    code: { c: "var ErrNotFound = errors.New(\"없음\")\n\nreturn fmt.Errorf(\"사용자 %d: %w\", id, ErrNotFound)\n// 부르는 쪽\nerrors.Is(err, ErrNotFound)   // true", cap: "%w 로 감싸야 되찾을 수 있다" },
    key: ["`%w` 는 품고, `%v` 는 버린다", "`errors.Is` 로 판별한다", "메시지 문자열을 비교하지 않는다"],
  },
  q: [
    {
      k: "Find · 감싸도 되찾을 수 있게",
      pkg: "ex",
      q: "없는 열쇠면 <code>ErrNotFound</code> 를 <b>맥락과 함께</b> 돌려주세요. 부르는 쪽에서 <code>errors.Is(err, ErrNotFound)</code> 가 <code>true</code> 여야 합니다.",
      src: "package ex\n\nimport (\n\t\"errors\"\n\t\"fmt\"\n)\n\nvar ErrNotFound = errors.New(\"없음\")\n\nfunc Find(m map[string]int, k string) (int, error) {\n\tv, ok := m[k]\n\tif !ok {\n\t\treturn 0, fmt.Errorf(\"열쇠 %q: %v\", k, ErrNotFound)\n\t}\n\treturn v, nil\n}\n",
      sol: "package ex\n\nimport (\n\t\"errors\"\n\t\"fmt\"\n)\n\nvar ErrNotFound = errors.New(\"없음\")\n\nfunc Find(m map[string]int, k string) (int, error) {\n\tv, ok := m[k]\n\tif !ok {\n\t\treturn 0, fmt.Errorf(\"열쇠 %q: %w\", k, ErrNotFound)\n\t}\n\treturn v, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"errors\"\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc TestFind(t *testing.T) {\n\tm := map[string]int{\"a\": 1}\n\tif v, err := Find(m, \"a\"); v != 1 || err != nil {\n\t\tt.Fatalf(\"a: %d %v\", v, err)\n\t}\n\t_, err := Find(m, \"zz\")\n\tif err == nil {\n\t\tt.Fatal(\"없으면 에러\")\n\t}\n\tif !strings.Contains(err.Error(), \"zz\") {\n\t\tt.Fatalf(\"맥락(열쇠 이름)이 있어야 한다: %v\", err)\n\t}\n\tif !errors.Is(err, ErrNotFound) {\n\t\tt.Fatalf(\"errors.Is 로 되찾을 수 있어야 한다: %v\", err)\n\t}\n}\n" },
      ex: "%v 로 감싸면 메시지 글자만 남고 원래 에러는 버려집니다. errors.Is 가 false 가 돼서 부르는 쪽이 종류를 판단할 수 없어요. %w 한 글자 차이입니다.",
    },
    {
      k: "First · 여러 결과에서 첫 에러",
      pkg: "ex",
      q: "값들을 순서대로 검사해 <b>첫 번째 실패</b>를 돌려주세요. 전부 통과하면 <code>nil</code> 입니다. 실패한 <b>자리 번호</b>가 메시지에 있어야 합니다.",
      src: "package ex\n\nimport \"fmt\"\n\nfunc First(xs []int, ok func(int) bool) error {\n\tvar last error\n\tfor i, x := range xs {\n\t\tif !ok(x) {\n\t\t\tlast = fmt.Errorf(\"%d번째 값 %d 가 조건에 맞지 않음\", i, x)\n\t\t}\n\t}\n\treturn last\n}\n",
      sol: "package ex\n\nimport \"fmt\"\n\nfunc First(xs []int, ok func(int) bool) error {\n\tfor i, x := range xs {\n\t\tif !ok(x) {\n\t\t\treturn fmt.Errorf(\"%d번째 값 %d 가 조건에 맞지 않음\", i, x)\n\t\t}\n\t}\n\treturn nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc positive(v int) bool { return v > 0 }\n\nfunc TestFirst(t *testing.T) {\n\tif err := First([]int{1, 2, 3}, positive); err != nil {\n\t\tt.Fatalf(\"전부 통과인데 에러: %v\", err)\n\t}\n\tif err := First(nil, positive); err != nil {\n\t\tt.Fatalf(\"빈 입력: %v\", err)\n\t}\n\terr := First([]int{1, -5, -9}, positive)\n\tif err == nil {\n\t\tt.Fatal(\"실패가 있어야 한다\")\n\t}\n\tif !strings.Contains(err.Error(), \"1번째\") {\n\t\tt.Fatalf(\"첫 번째 실패(1번째)를 돌려줘야 한다: %v\", err)\n\t}\n}\n" },
      ex: "끝까지 돌면서 last 를 덮어쓰면 '마지막 실패' 가 남습니다. 첫 실패에서 바로 return 해야 하고, 그래야 뒤쪽 검사도 헛돌지 않아요.",
    },
  ],
},
{
  unit: "메서드와 리시버 중급: 값 vs 포인터와 메서드 집합",
  lesson: "직접 짜 보기 — 메서드 집합",
  th: {
    sum: "포인터 리시버 메서드는 **포인터만** 갖는다. 값 타입으로는 그 인터페이스를 만족하지 못한다.",
    body: [
      { h: "왜 컴파일이 안 되나", t: "`func (c *Counter) Inc()` 만 있으면 `Counter` 값은 `Inc` 를 가진 인터페이스를 만족하지 않는다. `&Counter{}` 는 만족한다. 반대로 값 리시버 메서드는 값과 포인터 둘 다 갖는다 — 그래서 포인터 리시버 쪽에서만 문제가 생긴다." },
      { h: "왜 그런가", t: "값은 주소가 없을 수 있다(맵의 원소, 임시 값). 주소를 못 잡으면 포인터 메서드를 부를 수 없으므로, 컴파일러가 아예 메서드 집합에서 뺀다." },
    ],
    code: { c: "type Speaker interface{ Speak() string }\n\nfunc (d *Dog) Speak() string { … }\n\nvar s Speaker = Dog{}    // 컴파일 오류\nvar s Speaker = &Dog{}   // OK", cap: "포인터 리시버는 포인터만 만족한다" },
    key: ["포인터 리시버 → 포인터만 인터페이스를 만족", "값 리시버 → 값·포인터 둘 다", "고칠 필요가 없으면 값 리시버로 둔다"],
  },
  q: [
    {
      k: "Stringify · 값으로도 쓸 수 있게",
      pkg: "ex",
      q: "<code>Point</code> 를 <b>값 그대로</b> <code>Describer</code> 인터페이스에 담을 수 있게 하세요. <code>Describe()</code> 는 <code>\"(1,2)\"</code> 형태를 돌려줍니다.",
      src: "package ex\n\nimport \"fmt\"\n\ntype Describer interface {\n\tDescribe() string\n}\n\ntype Point struct {\n\tX, Y int\n}\n\nfunc (p *Point) Describe() string {\n\treturn fmt.Sprintf(\"(%d,%d)\", p.X, p.Y)\n}\n",
      sol: "package ex\n\nimport \"fmt\"\n\ntype Describer interface {\n\tDescribe() string\n}\n\ntype Point struct {\n\tX, Y int\n}\n\nfunc (p Point) Describe() string {\n\treturn fmt.Sprintf(\"(%d,%d)\", p.X, p.Y)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestDescribe(t *testing.T) {\n\tvar d Describer = Point{1, 2}\n\tif got := d.Describe(); got != \"(1,2)\" {\n\t\tt.Fatalf(\"got %q\", got)\n\t}\n\tlist := []Describer{Point{0, 0}, Point{-1, 5}}\n\tif list[0].Describe() != \"(0,0)\" || list[1].Describe() != \"(-1,5)\" {\n\t\tt.Fatalf(\"%q %q\", list[0].Describe(), list[1].Describe())\n\t}\n}\n" },
      ex: "포인터 리시버로 두면 Point 값은 Describer 를 만족하지 못해 컴파일이 안 됩니다. 고칠 일이 없는 메서드는 값 리시버로 두는 편이 쓰기 편해요.",
    },
    {
      k: "Reset · 고치는 메서드는 포인터로",
      pkg: "ex",
      q: "<code>Reset()</code> 은 값을 0으로 <b>실제로</b> 되돌리고, <code>Value()</code> 는 현재 값을 돌려주게 하세요.",
      src: "package ex\n\ntype Box struct {\n\tN int\n}\n\nfunc (b Box) Reset() {\n\tb.N = 0\n}\n\nfunc (b Box) Value() int {\n\treturn b.N\n}\n",
      sol: "package ex\n\ntype Box struct {\n\tN int\n}\n\nfunc (b *Box) Reset() {\n\tb.N = 0\n}\n\nfunc (b *Box) Value() int {\n\treturn b.N\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestReset(t *testing.T) {\n\tb := &Box{N: 7}\n\tif b.Value() != 7 {\n\t\tt.Fatalf(\"처음 값: %d\", b.Value())\n\t}\n\tb.Reset()\n\tif b.Value() != 0 {\n\t\tt.Fatalf(\"Reset 후: %d\", b.Value())\n\t}\n\tif b.N != 0 {\n\t\tt.Fatalf(\"필드가 실제로 0이어야 한다: %d\", b.N)\n\t}\n}\n" },
      ex: "값 리시버는 사본을 받으므로 b.N = 0 이 원본에 닿지 않습니다. 상태를 바꾸는 메서드는 포인터 리시버여야 해요.",
    },
  ],
},
{
  unit: "문자열·룬·바이트 (중급)",
  lesson: "직접 짜 보기 — 글자와 바이트는 다르다",
  th: {
    sum: "Go 문자열은 **바이트 열**이다. `len(s)` 는 글자 수가 아니라 바이트 수다.",
    body: [
      { h: "한글은 3바이트", t: "`len(\"한글\")` 은 6이다. 글자 수를 세려면 `utf8.RuneCountInString(s)` 를 쓰거나 `[]rune(s)` 로 바꿔 길이를 잰다. 인덱스 `s[0]` 도 첫 **바이트**라 한글에서는 깨진 값이 나온다." },
      { h: "range 는 룬 단위", t: "`for i, r := range s` 는 글자(룬) 단위로 돈다. 대신 `i` 는 글자 번호가 아니라 **바이트 위치**다. 뒤집기처럼 자리를 다루는 일은 `[]rune` 으로 바꿔 놓고 하는 편이 안전하다." },
    ],
    code: { c: "s := \"한글\"\nlen(s)                        // 6 (바이트)\nutf8.RuneCountInString(s)     // 2 (글자)\n[]rune(s)[0]                  // '한'", cap: "len 은 바이트 수다" },
    key: ["`len` 은 바이트 수", "글자 수는 `RuneCountInString`", "자리를 다루려면 `[]rune` 으로"],
  },
  q: [
    {
      k: "CharCount · 글자 수 세기",
      pkg: "ex",
      q: "문자열의 <b>글자 수</b>를 돌려주세요. 한글·이모지도 한 글자로 세야 합니다.",
      src: "package ex\n\nfunc CharCount(s string) int {\n\treturn len(s)\n}\n",
      sol: "package ex\n\nimport \"unicode/utf8\"\n\nfunc CharCount(s string) int {\n\treturn utf8.RuneCountInString(s)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestCharCount(t *testing.T) {\n\tcases := []struct {\n\t\tin   string\n\t\twant int\n\t}{\n\t\t{\"abc\", 3},\n\t\t{\"한글\", 2},\n\t\t{\"\", 0},\n\t\t{\"a한b\", 3},\n\t}\n\tfor _, c := range cases {\n\t\tif got := CharCount(c.in); got != c.want {\n\t\t\tt.Fatalf(\"CharCount(%q) = %d, want %d\", c.in, got, c.want)\n\t\t}\n\t}\n}\n" },
      ex: "len 은 바이트 수라 한글 한 글자가 3 으로 세어집니다. 글자 수는 utf8.RuneCountInString 이에요.",
    },
    {
      k: "Reverse · 문자열 뒤집기",
      pkg: "ex",
      q: "문자열을 <b>글자 단위로</b> 뒤집어 돌려주세요. 한글도 깨지면 안 됩니다.",
      src: "package ex\n\nfunc Reverse(s string) string {\n\tb := []byte(s)\n\tfor i, j := 0, len(b)-1; i < j; i, j = i+1, j-1 {\n\t\tb[i], b[j] = b[j], b[i]\n\t}\n\treturn string(b)\n}\n",
      sol: "package ex\n\nfunc Reverse(s string) string {\n\tr := []rune(s)\n\tfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n\t\tr[i], r[j] = r[j], r[i]\n\t}\n\treturn string(r)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestReverse(t *testing.T) {\n\tcases := []struct{ in, want string }{\n\t\t{\"abc\", \"cba\"},\n\t\t{\"한글\", \"글한\"},\n\t\t{\"\", \"\"},\n\t\t{\"a\", \"a\"},\n\t\t{\"가나다\", \"다나가\"},\n\t}\n\tfor _, c := range cases {\n\t\tif got := Reverse(c.in); got != c.want {\n\t\t\tt.Fatalf(\"Reverse(%q) = %q, want %q\", c.in, got, c.want)\n\t\t}\n\t}\n}\n" },
      ex: "바이트 단위로 뒤집으면 한글의 3바이트가 거꾸로 섞여 깨진 글자가 나옵니다. []rune 으로 바꿔 글자 단위로 뒤집어야 해요.",
    },
  ],
},
];
