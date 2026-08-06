/* Go 실습 3차 — 유닛마다 실습이 2개뿐이라 '읽고 고르기' 로 끝나던 곳에 세 개씩 더 넣는다.

   러너는 인터넷 없이 돈다(GOPROXY=off). 표준 라이브러리만 쓴다.

   실패는 반드시 '정해진' 실패여야 한다.
   경쟁 상태(race)로 값이 틀리기를 기대하는 문제는 여기 넣지 않았다 — 대개는 틀리지만
   가끔 맞는다. 가끔 통과하는 시작 코드는 배우는 사람을 헷갈리게만 한다.
   대신 닫지 않은 채널(교착), 값 리시버(아무 일도 안 일어남), 타입 있는 nil 처럼
   언제 돌려도 같은 답이 나오는 함정을 골랐다. */
module.exports = [
/* ── 1. Go 첫걸음 ─────────────────────────────────────────── */
{
  unit: "Go 첫걸음",
  lesson: "더 해 보기 — 에러를 값으로 돌려주기",
  th: {
    sum: "Go 에는 예외가 없다. 잘못될 수 있는 함수는 **결과와 에러를 같이** 돌려준다.",
    body: [
      { h: "왜 두 개를 돌려주나", t: "다른 말에서는 잘못되면 예외를 던지고, 부르는 쪽이 잊으면 프로그램이 통째로 멈춘다. Go 는 에러를 그냥 **두 번째 반환값**으로 준다. 부르는 쪽이 눈으로 보게 되니 잊기 어렵다." },
      { h: "0으로 나누면 터진다", t: "정수를 0으로 나누면 프로그램이 그 자리에서 죽는다(panic). 그래서 나누기 전에 먼저 확인하고, 안 되면 에러를 만들어 돌려줘야 한다. 확인을 빼먹으면 테스트가 실패하는 게 아니라 아예 멈춘다." },
      { h: "에러는 이렇게 만든다", t: "`errors.New(\"설명\")` 이면 충분하다. 설명은 소문자로 시작하고 마침표를 찍지 않는 것이 Go 관례다 — 다른 에러 안에 끼워 넣어 이어 붙이기 때문이다." },
    ],
    code: { c: "func Divide(a, b int) (int, error) {\n\tif b == 0 {\n\t\treturn 0, errors.New(\"0으로 나눌 수 없다\")\n\t}\n\treturn a / b, nil\n}", cap: "결과와 에러를 같이 돌려준다" },
    key: ["에러는 두 번째 반환값", "0으로 나누면 panic 이라 미리 막는다", "`errors.New` 로 만든다"],
  },
  q: [
    {
      k: "Divide · 0으로 나누면 에러로 알리기",
      pkg: "ex",
      q: "<code>a / b</code> 를 돌려주되, <code>b</code> 가 0이면 계산하지 말고 <b>에러</b>를 돌려주세요.",
      src: "package ex\n\nimport \"errors\"\n\nvar _ = errors.New\n\nfunc Divide(a, b int) (int, error) {\n\treturn a / b, nil\n}\n",
      sol: "package ex\n\nimport \"errors\"\n\nfunc Divide(a, b int) (int, error) {\n\tif b == 0 {\n\t\treturn 0, errors.New(\"0으로 나눌 수 없다\")\n\t}\n\treturn a / b, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestDivideOK(t *testing.T) {\n\tgot, err := Divide(7, 2)\n\tif err != nil {\n\t\tt.Fatalf(\"에러가 나면 안 된다: %v\", err)\n\t}\n\tif got != 3 {\n\t\tt.Fatalf(\"7/2 는 3이다 (got %d)\", got)\n\t}\n}\n\nfunc TestDivideZero(t *testing.T) {\n\t_, err := Divide(1, 0)\n\tif err == nil {\n\t\tt.Fatal(\"b 가 0이면 에러를 돌려줘야 한다\")\n\t}\n}\n" },
      ex: "정수를 0으로 나누면 그 줄에서 프로그램이 죽습니다. 그래서 나누기 전에 b == 0 을 먼저 확인하고, 그때는 계산하지 않고 에러만 돌려줘야 해요.",
    },
    {
      k: "Sum · 처음부터 끝까지 더하기",
      pkg: "ex",
      q: "정수 슬라이스의 <b>모든</b> 값을 더해 돌려주세요.",
      src: "package ex\n\nfunc Sum(xs []int) int {\n\ttotal := 0\n\tfor i := 1; i < len(xs); i++ {\n\t\ttotal += xs[i]\n\t}\n\treturn total\n}\n",
      sol: "package ex\n\nfunc Sum(xs []int) int {\n\ttotal := 0\n\tfor _, x := range xs {\n\t\ttotal += x\n\t}\n\treturn total\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestSum(t *testing.T) {\n\tif got := Sum([]int{1, 2, 3}); got != 6 {\n\t\tt.Fatalf(\"1+2+3 은 6이다 (got %d)\", got)\n\t}\n\tif got := Sum([]int{5}); got != 5 {\n\t\tt.Fatalf(\"한 개짜리: got %d, want 5\", got)\n\t}\n\tif got := Sum(nil); got != 0 {\n\t\tt.Fatalf(\"빈 것: got %d, want 0\", got)\n\t}\n}\n" },
      ex: "인덱스는 0부터 시작합니다. i := 1 로 시작하면 첫 칸을 통째로 빼먹어요. range 를 쓰면 이런 실수 자체가 생기지 않습니다.",
    },
    {
      k: "Greet · 이름이 없을 때도 인사하기",
      pkg: "ex",
      q: "<code>\"안녕, ○○!\"</code> 를 돌려주세요. 이름이 <b>빈 문자열</b>이면 <code>\"안녕, 손님!\"</code> 입니다.",
      src: "package ex\n\nfunc Greet(name string) string {\n\treturn \"안녕, \" + name + \"!\"\n}\n",
      sol: "package ex\n\nfunc Greet(name string) string {\n\tif name == \"\" {\n\t\tname = \"손님\"\n\t}\n\treturn \"안녕, \" + name + \"!\"\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestGreet(t *testing.T) {\n\tif got := Greet(\"루이\"); got != \"안녕, 루이!\" {\n\t\tt.Fatalf(\"got %q\", got)\n\t}\n\tif got := Greet(\"\"); got != \"안녕, 손님!\" {\n\t\tt.Fatalf(\"이름이 비면 손님: got %q\", got)\n\t}\n}\n" },
      ex: "빈 값이 들어오는 경우를 정하지 않으면 '안녕, !' 같은 이상한 문장이 나갑니다. 바깥에서 들어오는 값은 늘 비어 있을 수 있다고 생각하고 기본값을 정해 두세요.",
    },
  ],
},
/* ── 2. 슬라이스와 배열 ───────────────────────────────────── */
{
  unit: "슬라이스와 배열",
  lesson: "더 해 보기 — 원본을 건드리지 않기",
  th: {
    sum: "슬라이스를 넘기면 **같은 배열을 함께 쓰는 것**이다. 복사본이 아니다.",
    body: [
      { h: "넘겨도 복사되지 않는다", t: "슬라이스는 배열을 가리키는 표식일 뿐이다. 함수에 넘기면 표식만 복사되고 배열은 하나다. 그래서 함수 안에서 `xs[0] = 9` 하면 부른 쪽의 값도 바뀐다. 모르고 쓰면 '왜 원본이 바뀌었지' 하고 한참 헤맨다." },
      { h: "진짜 복사본 만들기", t: "`out := make([]int, len(xs))` 로 새 배열을 만들고 `copy(out, xs)` 로 옮긴다. 이러면 두 슬라이스가 서로 다른 배열을 본다. `out := xs` 는 복사가 아니라 표식만 하나 더 만드는 것이다." },
      { h: "xs[:0] 은 함정이다", t: "`out := xs[:0]` 은 '빈 슬라이스' 처럼 보이지만 **원본과 같은 배열**을 쓴다. 여기에 append 하면 원본의 앞칸부터 차례로 덮어쓴다. 걸러 내기를 이렇게 짜면 원본이 조용히 망가진다." },
    ],
    code: { c: "out := make([]int, len(xs))\ncopy(out, xs)   // 여기까지 해야 진짜 복사본\n\nbad := xs       // 표식만 하나 더 — 배열은 그대로 하나", cap: "make + copy 가 복사, 대입은 공유" },
    key: ["슬라이스를 넘겨도 배열은 하나", "복사는 `make` + `copy`", "`xs[:0]` 은 원본을 덮어쓴다"],
  },
  q: [
    {
      k: "Copy · 진짜 복사본 돌려주기",
      pkg: "ex",
      q: "받은 슬라이스의 <b>복사본</b>을 돌려주세요. 돌려준 것을 고쳐도 원본은 그대로여야 합니다.",
      src: "package ex\n\nfunc Copy(xs []int) []int {\n\treturn xs\n}\n",
      sol: "package ex\n\nfunc Copy(xs []int) []int {\n\tout := make([]int, len(xs))\n\tcopy(out, xs)\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestCopy(t *testing.T) {\n\ta := []int{1, 2, 3}\n\tb := Copy(a)\n\tif len(b) != 3 || b[0] != 1 || b[2] != 3 {\n\t\tt.Fatalf(\"내용이 같아야 한다: %v\", b)\n\t}\n\tb[0] = 99\n\tif a[0] != 1 {\n\t\tt.Fatalf(\"원본이 바뀌었다: %v — 같은 배열을 함께 쓰고 있다\", a)\n\t}\n}\n" },
      ex: "return xs 는 표식만 하나 더 만드는 것이라 배열은 여전히 하나입니다. make 로 새 배열을 만들고 copy 로 옮겨야 서로 상관없는 두 개가 돼요.",
    },
    {
      k: "Evens · 걸러 내되 원본은 그대로",
      pkg: "ex",
      q: "짝수만 모아 돌려주세요. <b>원본 슬라이스는 그대로</b>여야 합니다.",
      src: "package ex\n\nfunc Evens(xs []int) []int {\n\tout := xs[:0]\n\tfor _, x := range xs {\n\t\tif x%2 == 0 {\n\t\t\tout = append(out, x)\n\t\t}\n\t}\n\treturn out\n}\n",
      sol: "package ex\n\nfunc Evens(xs []int) []int {\n\tout := []int{}\n\tfor _, x := range xs {\n\t\tif x%2 == 0 {\n\t\t\tout = append(out, x)\n\t\t}\n\t}\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestEvens(t *testing.T) {\n\ta := []int{1, 2, 3, 4}\n\tgot := Evens(a)\n\tif len(got) != 2 || got[0] != 2 || got[1] != 4 {\n\t\tt.Fatalf(\"got %v, want [2 4]\", got)\n\t}\n\tif a[0] != 1 || a[1] != 2 || a[2] != 3 || a[3] != 4 {\n\t\tt.Fatalf(\"원본이 덮어써졌다: %v — xs[:0] 은 같은 배열을 쓴다\", a)\n\t}\n}\n" },
      ex: "xs[:0] 은 길이만 0인 같은 배열입니다. 여기에 append 하면 원본 첫 칸부터 결과가 덮어써져요. 새 슬라이스에 담으면 원본은 안전합니다.",
    },
    {
      k: "Reverse · 제자리에서 뒤집기",
      pkg: "ex",
      q: "받은 슬라이스를 <b>그 자리에서</b> 앞뒤로 뒤집으세요.",
      src: "package ex\n\nfunc Reverse(xs []int) {\n\tfor i := 0; i < len(xs); i++ {\n\t\tj := len(xs) - 1 - i\n\t\txs[i], xs[j] = xs[j], xs[i]\n\t}\n}\n",
      sol: "package ex\n\nfunc Reverse(xs []int) {\n\tfor i, j := 0, len(xs)-1; i < j; i, j = i+1, j-1 {\n\t\txs[i], xs[j] = xs[j], xs[i]\n\t}\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestReverse(t *testing.T) {\n\ta := []int{1, 2, 3, 4}\n\tReverse(a)\n\tfor i, w := range []int{4, 3, 2, 1} {\n\t\tif a[i] != w {\n\t\t\tt.Fatalf(\"got %v, want [4 3 2 1]\", a)\n\t\t}\n\t}\n\tb := []int{1, 2, 3}\n\tReverse(b)\n\tif b[0] != 3 || b[1] != 2 || b[2] != 1 {\n\t\tt.Fatalf(\"홀수 개: got %v\", b)\n\t}\n}\n" },
      ex: "끝까지 도는 동안 같은 짝을 두 번 바꿉니다. 두 번 바꾸면 제자리로 돌아와서 결국 아무 일도 없었던 것이 돼요. 가운데에서 멈춰야 합니다.",
    },
  ],
},
/* ── 3. 맵(map) ───────────────────────────────────────────── */
{
  unit: "맵(map)",
  lesson: "더 해 보기 — 없는 키와 0을 구별하기",
  th: {
    sum: "맵은 **만들어야 쓸 수 있고**, 없는 키를 읽으면 0이 나온다. 이 두 가지가 초보자를 가장 많이 잡는다.",
    body: [
      { h: "선언만 하면 못 쓴다", t: "`var m map[string]int` 은 nil 맵이다. 읽는 것은 되지만 **쓰면 그 자리에서 죽는다**(panic). 반드시 `m := map[string]int{}` 나 `make(map[string]int)` 로 만들어야 한다. '왜 갑자기 죽지' 의 절반은 이것이다." },
      { h: "없는 키는 0이다", t: "`m[\"없음\"]` 은 에러가 아니라 그냥 0을 준다. 그래서 `m[k] != 0` 으로 '있는지' 를 판단하면, **0이 저장된 키**를 없다고 잘못 말한다. 점수 0점인 사람이 명단에서 사라지는 식이다." },
      { h: "두 번째 값으로 물어본다", t: "`v, ok := m[k]` 로 받으면 `ok` 가 있는지 없는지를 알려 준다. 값과 존재 여부는 다른 질문이니 따로 받아야 한다." },
    ],
    code: { c: "m := map[string]int{\"a\": 0}\n\nfmt.Println(m[\"a\"] != 0)   // false — 있는데 없다고 나온다\nv, ok := m[\"a\"]\nfmt.Println(v, ok)         // 0 true — 이게 정답", cap: "값과 '있는지' 는 다른 질문이다" },
    key: ["맵은 만들어야 쓴다", "없는 키는 0", "`v, ok := m[k]` 로 존재를 묻는다"],
  },
  q: [
    {
      k: "Count · 단어 수 세기",
      pkg: "ex",
      q: "낱말 목록을 받아 <b>낱말마다 몇 번 나왔는지</b> 맵으로 돌려주세요.",
      src: "package ex\n\nfunc Count(words []string) map[string]int {\n\tvar m map[string]int\n\tfor _, w := range words {\n\t\tm[w]++\n\t}\n\treturn m\n}\n",
      sol: "package ex\n\nfunc Count(words []string) map[string]int {\n\tm := map[string]int{}\n\tfor _, w := range words {\n\t\tm[w]++\n\t}\n\treturn m\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestCount(t *testing.T) {\n\tm := Count([]string{\"a\", \"b\", \"a\"})\n\tif m[\"a\"] != 2 || m[\"b\"] != 1 {\n\t\tt.Fatalf(\"got %v, want a:2 b:1\", m)\n\t}\n\tif e := Count(nil); len(e) != 0 {\n\t\tt.Fatalf(\"빈 목록: %v\", e)\n\t}\n}\n" },
      ex: "var m map[string]int 은 아직 맵이 아니라 '맵이 없다' 는 표시입니다. 여기에 쓰면 그 줄에서 프로그램이 죽어요. map[string]int{} 로 먼저 만들어야 합니다.",
    },
    {
      k: "Get · 0이 저장된 키도 찾아내기",
      pkg: "ex",
      q: "키가 <b>있으면</b> 값과 <code>true</code>, 없으면 0과 <code>false</code> 를 돌려주세요. 값이 0인 키도 '있다' 로 봐야 합니다.",
      src: "package ex\n\nfunc Get(m map[string]int, k string) (int, bool) {\n\treturn m[k], m[k] != 0\n}\n",
      sol: "package ex\n\nfunc Get(m map[string]int, k string) (int, bool) {\n\tv, ok := m[k]\n\treturn v, ok\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestGet(t *testing.T) {\n\tm := map[string]int{\"a\": 5, \"zero\": 0}\n\tif v, ok := Get(m, \"a\"); v != 5 || !ok {\n\t\tt.Fatalf(\"a: got %d %v\", v, ok)\n\t}\n\tif v, ok := Get(m, \"zero\"); v != 0 || !ok {\n\t\tt.Fatalf(\"0이 저장된 키도 있다고 해야 한다: got %d %v\", v, ok)\n\t}\n\tif v, ok := Get(m, \"없음\"); v != 0 || ok {\n\t\tt.Fatalf(\"없는 키: got %d %v\", v, ok)\n\t}\n}\n" },
      ex: "없는 키를 읽어도 0이 나오기 때문에, 0인지 아닌지로는 있는지 없는지를 알 수 없습니다. v, ok := m[k] 의 ok 가 그 답을 정확히 알려 줘요.",
    },
    {
      k: "Merge · 겹치면 뒤엣것이 이긴다",
      pkg: "ex",
      q: "두 맵을 합쳐 새 맵으로 돌려주세요. 같은 키가 있으면 <b>두 번째 맵</b>의 값이 남아야 합니다. 원본 두 개는 건드리지 마세요.",
      src: "package ex\n\nfunc Merge(a, b map[string]int) map[string]int {\n\tout := map[string]int{}\n\tfor k, v := range b {\n\t\tout[k] = v\n\t}\n\tfor k, v := range a {\n\t\tout[k] = v\n\t}\n\treturn out\n}\n",
      sol: "package ex\n\nfunc Merge(a, b map[string]int) map[string]int {\n\tout := map[string]int{}\n\tfor k, v := range a {\n\t\tout[k] = v\n\t}\n\tfor k, v := range b {\n\t\tout[k] = v\n\t}\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestMerge(t *testing.T) {\n\ta := map[string]int{\"x\": 1, \"y\": 2}\n\tb := map[string]int{\"y\": 20, \"z\": 30}\n\tgot := Merge(a, b)\n\tif got[\"x\"] != 1 || got[\"z\"] != 30 {\n\t\tt.Fatalf(\"got %v\", got)\n\t}\n\tif got[\"y\"] != 20 {\n\t\tt.Fatalf(\"겹치면 뒤엣것이 남아야 한다: y = %d, want 20\", got[\"y\"])\n\t}\n\tif len(a) != 2 || len(b) != 2 {\n\t\tt.Fatalf(\"원본이 바뀌었다: %v %v\", a, b)\n\t}\n}\n" },
      ex: "나중에 쓴 값이 앞의 값을 덮습니다. 그러니 '이겨야 하는 쪽' 을 나중에 넣어야 해요. 순서를 거꾸로 두면 겹치는 키에서만 조용히 틀립니다.",
    },
  ],
},
/* ── 4. 구조체(struct) ────────────────────────────────────── */
{
  unit: "구조체(struct)",
  lesson: "더 해 보기 — 값이 복사되는 자리 알아보기",
  th: {
    sum: "구조체는 넘길 때마다 **통째로 복사**된다. 그래서 복사본을 고치면 원본은 그대로다.",
    body: [
      { h: "range 는 복사본을 준다", t: "`for _, u := range users` 의 `u` 는 원소가 아니라 **원소의 복사본**이다. `u.Age = 20` 은 복사본만 바꾸고 끝난다. 반복문이 끝나면 그 복사본은 사라진다 — 아무 일도 일어나지 않는다." },
      { h: "고치려면 자리를 잡아야 한다", t: "`for i := range users` 로 번호를 받아 `users[i].Age = 20` 처럼 **원래 자리**를 고쳐야 한다. 슬라이스 자체는 배열을 공유하므로 이건 부른 쪽에도 보인다." },
      { h: "메서드도 같은 이야기다", t: "`func (c Counter) Inc()` 는 복사본의 값을 올린다. 값을 바꾸는 메서드는 `func (c *Counter) Inc()` 처럼 **포인터 리시버**로 써야 한다. 규칙은 하나다 — 바꿀 거면 포인터." },
    ],
    code: { c: "for _, u := range users { u.Age = 20 }   // 아무 일도 안 일어난다\nfor i := range users { users[i].Age = 20 }  // 이게 진짜 바꾸는 것", cap: "복사본을 고치는지, 원래 자리를 고치는지" },
    key: ["구조체는 복사된다", "`range` 의 값은 복사본", "바꿀 거면 포인터 리시버"],
  },
  q: [
    {
      k: "Inc · 값이 진짜 올라가게",
      pkg: "ex",
      q: "<code>Inc()</code> 를 부르면 카운터가 <b>1 올라가게</b> 만드세요.",
      src: "package ex\n\ntype Counter struct {\n\tN int\n}\n\nfunc (c Counter) Inc() {\n\tc.N++\n}\n",
      sol: "package ex\n\ntype Counter struct {\n\tN int\n}\n\nfunc (c *Counter) Inc() {\n\tc.N++\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestInc(t *testing.T) {\n\tc := &Counter{}\n\tc.Inc()\n\tc.Inc()\n\tif c.N != 2 {\n\t\tt.Fatalf(\"두 번 올렸으면 2여야 한다 (got %d) — 값 리시버는 복사본을 올린다\", c.N)\n\t}\n}\n" },
      ex: "값 리시버는 구조체를 복사해서 받습니다. 복사본의 N 을 올려 봐야 원본은 그대로예요. 값을 바꾸는 메서드는 포인터 리시버로 써야 합니다.",
    },
    {
      k: "SetAge · 목록 안의 값을 바꾸기",
      pkg: "ex",
      q: "목록에 있는 <b>모든</b> 사람의 나이를 주어진 값으로 바꾸세요.",
      src: "package ex\n\ntype User struct {\n\tName string\n\tAge  int\n}\n\nfunc SetAge(us []User, age int) {\n\tfor _, u := range us {\n\t\tu.Age = age\n\t}\n}\n",
      sol: "package ex\n\ntype User struct {\n\tName string\n\tAge  int\n}\n\nfunc SetAge(us []User, age int) {\n\tfor i := range us {\n\t\tus[i].Age = age\n\t}\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestSetAge(t *testing.T) {\n\tus := []User{{Name: \"가\", Age: 1}, {Name: \"나\", Age: 2}}\n\tSetAge(us, 30)\n\tfor _, u := range us {\n\t\tif u.Age != 30 {\n\t\t\tt.Fatalf(\"%s 의 나이가 안 바뀌었다: %v — range 의 값은 복사본이다\", u.Name, us)\n\t\t}\n\t}\n}\n" },
      ex: "range 가 주는 u 는 원소의 복사본입니다. 복사본을 고치면 반복문이 끝날 때 그냥 버려져요. us[i] 처럼 원래 자리를 지목해야 바뀝니다.",
    },
    {
      k: "NewUser · 잘못된 값은 받지 않기",
      pkg: "ex",
      q: "이름이 <b>비었거나</b> 나이가 <b>음수</b>면 만들지 말고 에러를 돌려주세요. 괜찮으면 <code>*User</code> 를 돌려줍니다.",
      src: "package ex\n\nimport \"errors\"\n\nvar _ = errors.New\n\ntype User struct {\n\tName string\n\tAge  int\n}\n\nfunc NewUser(name string, age int) (*User, error) {\n\treturn &User{Name: name, Age: age}, nil\n}\n",
      sol: "package ex\n\nimport \"errors\"\n\ntype User struct {\n\tName string\n\tAge  int\n}\n\nfunc NewUser(name string, age int) (*User, error) {\n\tif name == \"\" {\n\t\treturn nil, errors.New(\"이름이 비었다\")\n\t}\n\tif age < 0 {\n\t\treturn nil, errors.New(\"나이가 음수다\")\n\t}\n\treturn &User{Name: name, Age: age}, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestNewUserOK(t *testing.T) {\n\tu, err := NewUser(\"루이\", 20)\n\tif err != nil || u == nil || u.Name != \"루이\" || u.Age != 20 {\n\t\tt.Fatalf(\"got %v %v\", u, err)\n\t}\n}\n\nfunc TestNewUserBad(t *testing.T) {\n\tif u, err := NewUser(\"\", 20); err == nil {\n\t\tt.Fatalf(\"이름이 비면 에러여야 한다 (got %v)\", u)\n\t}\n\tif u, err := NewUser(\"루이\", -1); err == nil {\n\t\tt.Fatalf(\"나이가 음수면 에러여야 한다 (got %v)\", u)\n\t}\n}\n" },
      ex: "잘못된 값을 그대로 담아 두면, 나중에 화면에 나올 때가 돼서야 문제가 드러납니다. 만드는 자리에서 막으면 그 뒤로는 언제나 올바른 값이라고 믿을 수 있어요.",
    },
  ],
},
];
