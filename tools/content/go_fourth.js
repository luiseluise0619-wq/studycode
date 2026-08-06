/* Go 실습 4차 — 중급·심화 유닛에 세 개씩 더 넣는다.

   실패는 정해진 실패여야 한다. 여기서 고른 함정은 모두 언제 돌려도 같은 답이 나온다.
   · 닫지 않은 채널 / 막힌 수신 → 런타임이 교착을 알아채고 그 자리에서 멈춘다
   · 타입 있는 nil → 인터페이스는 언제나 nil 이 아니다
   · 값 리시버·복사본 → 아무 일도 일어나지 않는다
   경쟁 상태로 값이 어긋나기를 기대하는 문제는 넣지 않았다. 대개 틀리지만 가끔 맞고,
   가끔 통과하는 시작 코드는 배우는 사람을 헷갈리게만 한다. */
module.exports = [
/* ── 슬라이스 내부 구조 (중급) ────────────────────────────── */
{
  unit: "슬라이스 내부 구조 (중급)",
  lesson: "더 해 보기 — 자리 옮기기와 여유 칸",
  th: {
    sum: "슬라이스에서 무엇을 지우고 끼우려면 **칸을 옮겨야** 한다. 그리고 append 는 여유 칸이 있으면 남의 칸에 쓴다.",
    body: [
      { h: "지우기는 '당겨 오기' 다", t: "Go 에는 '지우기' 명령이 없다. 지운 자리 뒤를 앞으로 당겨 와서 덮고, 길이를 하나 줄인다. `append(xs[:i], xs[i+1:]...)` 한 줄이 그 일을 한다. 마지막 칸을 끌어다 덮는 방법도 있지만 그건 **순서가 뒤집힌다**." },
      { h: "append 는 남의 배열에 쓸 수 있다", t: "`append(a, b...)` 는 a 에 여유 칸(cap)이 남아 있으면 새 배열을 만들지 않고 **그 여유 칸에 그대로 쓴다**. a 가 더 큰 배열의 앞부분이었다면, 그 뒤에 있던 남의 값이 조용히 덮어써진다. 이어 붙일 때는 새 배열을 직접 만드는 편이 안전하다." },
      { h: "그래서 규칙은 하나다", t: "받은 슬라이스에 append 해서 돌려주면, 부른 쪽 배열이 바뀔 수 있다. 결과를 새로 만들어 돌려주면 그럴 일이 없다. 헷갈리면 새로 만든다 — 성능이 문제 될 때 그때 줄이면 된다." },
    ],
    code: { c: "xs = append(xs[:i], xs[i+1:]...)   // i번째를 지운다 (순서 유지)\n\nout := make([]int, 0, len(a)+len(b))\nout = append(out, a...)\nout = append(out, b...)            // 남의 배열을 건드리지 않는다", cap: "지우기는 당겨 오기, 이어 붙이기는 새로 만들기" },
    key: ["지우기는 뒤를 앞으로 당긴다", "`append` 는 여유 칸에 그대로 쓴다", "헷갈리면 새로 만든다"],
  },
  q: [
    {
      k: "Remove · 순서를 지키며 지우기",
      pkg: "ex",
      q: "<code>i</code>번째 값을 지운 슬라이스를 돌려주세요. <b>나머지 순서는 그대로</b>여야 합니다.",
      src: "package ex\n\nfunc Remove(xs []int, i int) []int {\n\txs[i] = xs[len(xs)-1]\n\treturn xs[:len(xs)-1]\n}\n",
      sol: "package ex\n\nfunc Remove(xs []int, i int) []int {\n\treturn append(xs[:i], xs[i+1:]...)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestRemove(t *testing.T) {\n\tgot := Remove([]int{1, 2, 3, 4}, 1)\n\twant := []int{1, 3, 4}\n\tif len(got) != len(want) {\n\t\tt.Fatalf(\"길이: got %v, want %v\", got, want)\n\t}\n\tfor i := range want {\n\t\tif got[i] != want[i] {\n\t\t\tt.Fatalf(\"순서가 바뀌었다: got %v, want %v\", got, want)\n\t\t}\n\t}\n}\n" },
      ex: "마지막 칸을 끌어다 덮으면 한 줄로 끝나지만 순서가 뒤집힙니다. 순서를 지키려면 지운 자리 뒤를 통째로 앞으로 당겨 와야 해요.",
    },
    {
      k: "Insert · i 자리에 끼워 넣기",
      pkg: "ex",
      q: "<code>i</code> 자리에 <code>v</code> 를 끼워 넣은 슬라이스를 돌려주세요. 뒤에 있던 값들은 한 칸씩 밀립니다.",
      src: "package ex\n\nfunc Insert(xs []int, i, v int) []int {\n\treturn append(xs, v)\n}\n",
      sol: "package ex\n\nfunc Insert(xs []int, i, v int) []int {\n\tout := make([]int, 0, len(xs)+1)\n\tout = append(out, xs[:i]...)\n\tout = append(out, v)\n\tout = append(out, xs[i:]...)\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc eq(t *testing.T, got, want []int) {\n\tt.Helper()\n\tif len(got) != len(want) {\n\t\tt.Fatalf(\"got %v, want %v\", got, want)\n\t}\n\tfor i := range want {\n\t\tif got[i] != want[i] {\n\t\t\tt.Fatalf(\"got %v, want %v\", got, want)\n\t\t}\n\t}\n}\n\nfunc TestInsert(t *testing.T) {\n\teq(t, Insert([]int{1, 2, 3}, 1, 9), []int{1, 9, 2, 3})\n\teq(t, Insert([]int{1, 2, 3}, 0, 9), []int{9, 1, 2, 3})\n\teq(t, Insert([]int{1, 2, 3}, 3, 9), []int{1, 2, 3, 9})\n}\n" },
      ex: "맨 뒤에 붙이는 것은 i 가 마지막일 때만 맞습니다. 가운데에 넣으려면 앞부분 · 새 값 · 뒷부분 순서로 이어 붙여야 해요.",
    },
    {
      k: "Concat · 남의 배열을 건드리지 않고 잇기",
      pkg: "ex",
      q: "두 슬라이스를 이어 붙인 <b>새 슬라이스</b>를 돌려주세요. <code>a</code> 뒤에 여유 칸이 남아 있어도 거기에 쓰면 안 됩니다.",
      src: "package ex\n\nfunc Concat(a, b []int) []int {\n\treturn append(a, b...)\n}\n",
      sol: "package ex\n\nfunc Concat(a, b []int) []int {\n\tout := make([]int, 0, len(a)+len(b))\n\tout = append(out, a...)\n\tout = append(out, b...)\n\treturn out\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestConcat(t *testing.T) {\n\tbase := []int{1, 2, 7, 8}\n\ta := base[:2]\n\tgot := Concat(a, []int{9})\n\tif len(got) != 3 || got[0] != 1 || got[1] != 2 || got[2] != 9 {\n\t\tt.Fatalf(\"got %v, want [1 2 9]\", got)\n\t}\n\tif base[2] != 7 {\n\t\tt.Fatalf(\"뒤에 있던 값이 덮어써졌다: %v — append 가 a 의 여유 칸에 썼다\", base)\n\t}\n}\n" },
      ex: "append 는 여유 칸이 있으면 새 배열을 만들지 않고 그 칸에 그대로 씁니다. a 가 더 큰 배열의 앞부분이면 그 뒤 값이 조용히 사라져요. 새 배열을 직접 만들면 이런 일이 없습니다.",
    },
  ],
},
/* ── 인터페이스와 nil 함정 (중급) ─────────────────────────── */
{
  unit: "인터페이스와 nil 함정 (중급)",
  lesson: "더 해 보기 — nil 인데 nil 이 아닌 에러",
  th: {
    sum: "인터페이스 값은 **타입과 값 두 칸**이다. 값이 nil 이어도 타입이 채워져 있으면 `!= nil` 이다.",
    body: [
      { h: "가장 유명한 함정", t: "`var e *MyErr = nil` 을 `error` 로 돌려주면, 받는 쪽의 `err != nil` 은 **참**이 된다. 값 칸은 비었지만 타입 칸에 `*MyErr` 가 들어 있기 때문이다. '분명 성공했는데 왜 에러라고 하지' 의 정체가 이것이다." },
      { h: "고치는 법은 간단하다", t: "에러 변수를 `*MyErr` 로 두지 말고 처음부터 `error` 로 두거나, 성공하는 길에서 `return nil` 을 **또박또박** 써 준다. 구체 타입 포인터를 error 자리에 흘려보내지 않는 것이 핵심이다." },
      { h: "감쌌으면 %w 로", t: "`fmt.Errorf(\"...: %v\", err)` 는 원래 에러를 글자로만 붙인다. `%w` 로 감싸야 `errors.Is` 가 안쪽까지 들여다본다. `%v` 로 쓰면 호출한 쪽이 '이게 그 에러인지' 를 알 방법이 없어진다." },
    ],
    code: { c: "func Bad() error {\n\tvar e *MyErr    // nil 포인터\n\treturn e        // 그런데 err != nil 이 참이 된다\n}\n\nfunc Good() error {\n\treturn nil      // 이렇게 또박또박", cap: "타입 칸이 차면 nil 이 아니다" },
    key: ["인터페이스는 타입+값 두 칸", "타입 있는 nil 은 `!= nil`", "감쌀 때는 `%w`"],
  },
  q: [
    {
      k: "Check · 성공하면 진짜 nil 돌려주기",
      pkg: "ex",
      q: "<code>bad</code> 가 참일 때만 에러를 돌려주세요. 아닐 때는 <b>진짜 nil</b> 이어야 합니다.",
      src: "package ex\n\ntype MyErr struct{}\n\nfunc (e *MyErr) Error() string { return \"문제\" }\n\nfunc Check(bad bool) error {\n\tvar e *MyErr\n\tif bad {\n\t\te = &MyErr{}\n\t}\n\treturn e\n}\n",
      sol: "package ex\n\ntype MyErr struct{}\n\nfunc (e *MyErr) Error() string { return \"문제\" }\n\nfunc Check(bad bool) error {\n\tif bad {\n\t\treturn &MyErr{}\n\t}\n\treturn nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestCheckOK(t *testing.T) {\n\tif err := Check(false); err != nil {\n\t\tt.Fatalf(\"성공인데 err != nil 이다 (%v) — 타입 있는 nil 을 돌려주고 있다\", err)\n\t}\n}\n\nfunc TestCheckBad(t *testing.T) {\n\tif err := Check(true); err == nil {\n\t\tt.Fatal(\"실패면 에러를 돌려줘야 한다\")\n\t}\n}\n" },
      ex: "인터페이스는 타입 칸과 값 칸으로 되어 있습니다. *MyErr 형 nil 을 돌려주면 값 칸만 비고 타입 칸은 차 있어서, 받는 쪽에는 '에러가 있다' 로 보여요.",
    },
    {
      k: "Load · 감싼 에러를 찾아낼 수 있게",
      pkg: "ex",
      q: "없는 키면 <code>ErrNotFound</code> 를 감싼 에러를 돌려주세요. 부른 쪽이 <code>errors.Is(err, ErrNotFound)</code> 로 알아볼 수 있어야 합니다.",
      src: "package ex\n\nimport (\n\t\"errors\"\n\t\"fmt\"\n)\n\nvar ErrNotFound = errors.New(\"없음\")\n\nfunc Load(m map[string]int, k string) (int, error) {\n\tv, ok := m[k]\n\tif !ok {\n\t\treturn 0, fmt.Errorf(\"%s 를 읽지 못했다: %v\", k, ErrNotFound)\n\t}\n\treturn v, nil\n}\n",
      sol: "package ex\n\nimport (\n\t\"errors\"\n\t\"fmt\"\n)\n\nvar ErrNotFound = errors.New(\"없음\")\n\nfunc Load(m map[string]int, k string) (int, error) {\n\tv, ok := m[k]\n\tif !ok {\n\t\treturn 0, fmt.Errorf(\"%s 를 읽지 못했다: %w\", k, ErrNotFound)\n\t}\n\treturn v, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"errors\"\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc TestLoadOK(t *testing.T) {\n\tif v, err := Load(map[string]int{\"a\": 1}, \"a\"); v != 1 || err != nil {\n\t\tt.Fatalf(\"got %d %v\", v, err)\n\t}\n}\n\nfunc TestLoadMissing(t *testing.T) {\n\t_, err := Load(map[string]int{}, \"a\")\n\tif err == nil {\n\t\tt.Fatal(\"없는 키면 에러여야 한다\")\n\t}\n\tif !strings.Contains(err.Error(), \"a\") {\n\t\tt.Fatalf(\"어떤 키였는지 알려 줘야 한다: %v\", err)\n\t}\n\tif !errors.Is(err, ErrNotFound) {\n\t\tt.Fatalf(\"errors.Is 로 찾을 수 없다: %v — %%v 로 붙이면 안쪽이 사라진다\", err)\n\t}\n}\n" },
      ex: "%v 는 원래 에러를 글자로만 붙입니다. 보기에는 같아도 안쪽 에러는 사라져서 errors.Is 가 찾지 못해요. %w 로 감싸야 껍질 안을 들여다볼 수 있습니다.",
    },
    {
      k: "Describe · 타입에 따라 다르게 말하기",
      pkg: "ex",
      q: "<code>int</code> 면 <code>\"정수\"</code>, <code>string</code> 이면 <code>\"문자열\"</code>, 그 밖에는 <code>\"모름\"</code> 을 돌려주세요.",
      src: "package ex\n\nfunc Describe(v any) string {\n\tif _, ok := v.(int); ok {\n\t\treturn \"정수\"\n\t}\n\treturn \"문자열\"\n}\n",
      sol: "package ex\n\nfunc Describe(v any) string {\n\tswitch v.(type) {\n\tcase int:\n\t\treturn \"정수\"\n\tcase string:\n\t\treturn \"문자열\"\n\tdefault:\n\t\treturn \"모름\"\n\t}\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestDescribe(t *testing.T) {\n\tif got := Describe(1); got != \"정수\" {\n\t\tt.Fatalf(\"int: got %q\", got)\n\t}\n\tif got := Describe(\"가\"); got != \"문자열\" {\n\t\tt.Fatalf(\"string: got %q\", got)\n\t}\n\tif got := Describe(1.5); got != \"모름\" {\n\t\tt.Fatalf(\"float64: got %q, want 모름\", got)\n\t}\n}\n" },
      ex: "'둘 중 하나' 로 짜면 세 번째 타입이 들어왔을 때 엉뚱한 답을 합니다. 타입 스위치의 default 는 '내가 모르는 것' 을 정직하게 말하는 자리예요.",
    },
  ],
},
/* ── 고루틴·채널·동기화 (심화) ────────────────────────────── */
{
  unit: "고루틴·채널·동기화 (심화)",
  lesson: "더 해 보기 — 끝을 알려 주기",
  th: {
    sum: "채널을 쓰는 쪽은 **언제 끝나는지** 알아야 한다. 보내는 쪽이 닫아서 알려 준다.",
    body: [
      { h: "닫지 않으면 영영 기다린다", t: "`for v := range ch` 는 채널이 닫힐 때까지 계속 기다린다. 보낼 것을 다 보내고도 닫지 않으면, 받는 쪽은 오지 않을 값을 기다리며 멈춘다. Go 런타임은 모두가 멈춘 걸 알아채면 'all goroutines are asleep' 이라고 알려 주고 프로그램을 끝낸다." },
      { h: "닫는 것은 보내는 쪽이다", t: "받는 쪽이 닫으면 보내는 쪽이 닫힌 채널에 쓰다가 죽는다. 그래서 **보내는 쪽만** 닫는다. 보통 값을 만들어 내는 함수 안에서 `defer close(ch)` 로 둔다 — 어디서 빠져나가도 반드시 닫힌다." },
      { h: "안 올 수도 있으면 select", t: "상대가 영영 안 보낼 수도 있다면 `select` 로 `time.After` 와 함께 기다린다. 둘 중 먼저 오는 쪽이 이긴다. 그냥 `<-ch` 로 기다리면 빠져나올 길이 없다." },
    ],
    code: { c: "func Gen(n int) <-chan int {\n\tch := make(chan int)\n\tgo func() {\n\t\tdefer close(ch)      // 다 보내면 반드시 닫는다\n\t\tfor i := 0; i < n; i++ { ch <- i }\n\t}()\n\treturn ch\n}", cap: "보내는 쪽이 defer close 로 끝을 알린다" },
    key: ["닫지 않으면 받는 쪽이 멈춘다", "닫는 것은 보내는 쪽", "안 올 수도 있으면 `select`"],
  },
  q: [
    {
      k: "Gen · 다 보냈으면 닫아 주기",
      pkg: "ex",
      q: "0부터 <code>n-1</code>까지 채널로 보내세요. 다 보냈으면 <b>채널을 닫아</b> 받는 쪽이 끝을 알게 하세요.",
      src: "package ex\n\nfunc Gen(n int) <-chan int {\n\tch := make(chan int)\n\tgo func() {\n\t\tfor i := 0; i < n; i++ {\n\t\t\tch <- i\n\t\t}\n\t}()\n\treturn ch\n}\n",
      sol: "package ex\n\nfunc Gen(n int) <-chan int {\n\tch := make(chan int)\n\tgo func() {\n\t\tdefer close(ch)\n\t\tfor i := 0; i < n; i++ {\n\t\t\tch <- i\n\t\t}\n\t}()\n\treturn ch\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestGen(t *testing.T) {\n\tvar got []int\n\tfor v := range Gen(3) {\n\t\tgot = append(got, v)\n\t}\n\tif len(got) != 3 {\n\t\tt.Fatalf(\"got %v, want [0 1 2]\", got)\n\t}\n\tfor i, v := range got {\n\t\tif v != i {\n\t\t\tt.Fatalf(\"got %v, want [0 1 2]\", got)\n\t\t}\n\t}\n}\n" },
      ex: "range 는 채널이 닫힐 때까지 기다립니다. 닫지 않으면 오지 않을 네 번째 값을 기다리다 프로그램 전체가 멈춰요. defer close 로 두면 어디로 빠져나가든 반드시 닫힙니다.",
    },
    {
      k: "WaitOr · 안 오면 포기하기",
      pkg: "ex",
      q: "값이 오면 <code>(값, true)</code>, <code>d</code> 동안 안 오면 <code>(0, false)</code> 를 돌려주세요. <b>영영 기다리면 안 됩니다.</b>",
      src: "package ex\n\nimport \"time\"\n\nvar _ = time.After\n\nfunc WaitOr(ch <-chan int, d time.Duration) (int, bool) {\n\treturn <-ch, true\n}\n",
      sol: "package ex\n\nimport \"time\"\n\nfunc WaitOr(ch <-chan int, d time.Duration) (int, bool) {\n\tselect {\n\tcase v := <-ch:\n\t\treturn v, true\n\tcase <-time.After(d):\n\t\treturn 0, false\n\t}\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestWaitOrGot(t *testing.T) {\n\tch := make(chan int, 1)\n\tch <- 7\n\tif v, ok := WaitOr(ch, time.Second); v != 7 || !ok {\n\t\tt.Fatalf(\"got %d %v, want 7 true\", v, ok)\n\t}\n}\n\nfunc TestWaitOrTimeout(t *testing.T) {\n\tch := make(chan int)\n\tif v, ok := WaitOr(ch, 50*time.Millisecond); v != 0 || ok {\n\t\tt.Fatalf(\"안 오면 0 false 여야 한다: got %d %v\", v, ok)\n\t}\n}\n" },
      ex: "<-ch 하나만 쓰면 값이 올 때까지 빠져나올 길이 없습니다. select 에 time.After 를 같이 두면 둘 중 먼저 오는 쪽이 이겨서, 안 와도 정해진 시간에 돌아올 수 있어요.",
    },
    {
      k: "Once · 딱 한 번만 준비하기",
      pkg: "ex",
      q: "<code>Setup()</code> 을 몇 번 부르든 준비 작업은 <b>한 번만</b> 일어나게 하세요.",
      src: "package ex\n\nimport \"sync\"\n\nvar _ sync.Once\n\nvar Ready int\n\nfunc Setup() {\n\tReady++\n}\n",
      sol: "package ex\n\nimport \"sync\"\n\nvar once sync.Once\n\nvar Ready int\n\nfunc Setup() {\n\tonce.Do(func() {\n\t\tReady++\n\t})\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestSetupOnce(t *testing.T) {\n\tSetup()\n\tSetup()\n\tSetup()\n\tif Ready != 1 {\n\t\tt.Fatalf(\"준비는 한 번만 일어나야 한다 (got %d)\", Ready)\n\t}\n}\n" },
      ex: "sync.Once 는 여러 곳에서 동시에 불러도 안쪽 함수를 딱 한 번만 실행합니다. 직접 '했나?' 를 깃발로 확인하면 두 곳이 동시에 확인하는 순간 두 번 실행될 수 있어요.",
    },
  ],
},
/* ── context·defer·panic (심화) ───────────────────────────── */
{
  unit: "context·defer·panic (심화)",
  lesson: "더 해 보기 — 어떤 길로 나가도 뒷정리하기",
  th: {
    sum: "`defer` 는 **어느 길로 빠져나가든** 실행된다. 뒷정리는 여기에 맡긴다.",
    body: [
      { h: "성공하는 길만 정리하면 새어 나간다", t: "`if err != nil { return err }` 를 여러 군데 두면, 정리 코드는 맨 아래 한 곳에만 있기 쉽다. 그러면 에러로 빠져나갈 때마다 파일·연결이 열린 채 남는다. 열자마자 `defer 닫기` 를 써 두면 모든 길이 한 번에 해결된다." },
      { h: "패닉도 defer 는 지나간다", t: "패닉이 나도 쌓여 있던 defer 는 실행된다. 그 안에서 `recover()` 를 부르면 패닉을 멈추고 보통 에러로 바꿔 돌려줄 수 있다. 남의 코드를 대신 실행해 주는 자리(핸들러·워커)에서 쓴다." },
      { h: "취소는 존중해야 한다", t: "`ctx` 를 받았으면 시작 전에 `ctx.Err()` 를 확인한다. 이미 취소됐는데 그대로 일하면, 아무도 기다리지 않는 결과를 만드느라 시간을 버린다. 취소를 무시하는 함수는 서버를 못 멈추게 만든다." },
    ],
    code: { c: "f, err := open()\nif err != nil { return err }\ndefer f.Close()      // 여기 한 줄이 모든 return 을 책임진다\n\nif err := ctx.Err(); err != nil { return err }", cap: "열자마자 defer, 시작 전에 취소 확인" },
    key: ["`defer` 는 모든 길에서 실행된다", "`recover` 는 defer 안에서만 듣는다", "일 시작 전에 `ctx.Err()`"],
  },
  q: [
    {
      k: "Use · 에러로 빠져나가도 닫기",
      pkg: "ex",
      q: "자원을 쓰고 나면 <b>반드시</b> <code>Close()</code> 하세요. 중간에 에러가 나서 돌아갈 때도 닫혀야 합니다.",
      src: "package ex\n\nimport \"errors\"\n\ntype Res struct {\n\tClosed int\n}\n\nfunc (r *Res) Close() { r.Closed++ }\n\nfunc Use(r *Res, fail bool) error {\n\tif fail {\n\t\treturn errors.New(\"실패\")\n\t}\n\tr.Close()\n\treturn nil\n}\n",
      sol: "package ex\n\nimport \"errors\"\n\ntype Res struct {\n\tClosed int\n}\n\nfunc (r *Res) Close() { r.Closed++ }\n\nfunc Use(r *Res, fail bool) error {\n\tdefer r.Close()\n\tif fail {\n\t\treturn errors.New(\"실패\")\n\t}\n\treturn nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestUseOK(t *testing.T) {\n\tr := &Res{}\n\tif err := Use(r, false); err != nil {\n\t\tt.Fatalf(\"got %v\", err)\n\t}\n\tif r.Closed != 1 {\n\t\tt.Fatalf(\"성공했을 때 닫힌 횟수: %d, want 1\", r.Closed)\n\t}\n}\n\nfunc TestUseFail(t *testing.T) {\n\tr := &Res{}\n\tif err := Use(r, true); err == nil {\n\t\tt.Fatal(\"실패해야 한다\")\n\t}\n\tif r.Closed != 1 {\n\t\tt.Fatalf(\"에러로 나갈 때도 닫혀야 한다 (닫힌 횟수 %d)\", r.Closed)\n\t}\n}\n" },
      ex: "돌아가는 길이 여러 개면 정리 코드도 그만큼 늘어나고, 하나를 빠뜨리면 자원이 새어 나갑니다. 여는 자리 바로 아래에 defer 를 두면 길이 몇 개든 한 줄로 끝나요.",
    },
    {
      k: "Safe · 패닉을 에러로 바꾸기",
      pkg: "ex",
      q: "넘겨받은 함수를 실행하되, 그 안에서 <b>패닉이 나도 프로그램이 죽지 않게</b> 하고 에러로 돌려주세요.",
      src: "package ex\n\nimport \"fmt\"\n\nvar _ = fmt.Errorf\n\nfunc Safe(f func()) (err error) {\n\tf()\n\treturn nil\n}\n",
      sol: "package ex\n\nimport \"fmt\"\n\nfunc Safe(f func()) (err error) {\n\tdefer func() {\n\t\tif r := recover(); r != nil {\n\t\t\terr = fmt.Errorf(\"패닉: %v\", r)\n\t\t}\n\t}()\n\tf()\n\treturn nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"strings\"\n\t\"testing\"\n)\n\nfunc TestSafeOK(t *testing.T) {\n\tcalled := false\n\tif err := Safe(func() { called = true }); err != nil || !called {\n\t\tt.Fatalf(\"got %v, called=%v\", err, called)\n\t}\n}\n\nfunc TestSafePanic(t *testing.T) {\n\terr := Safe(func() { panic(\"터짐\") })\n\tif err == nil {\n\t\tt.Fatal(\"패닉을 에러로 돌려줘야 한다\")\n\t}\n\tif !strings.Contains(err.Error(), \"터짐\") {\n\t\tt.Fatalf(\"무엇 때문인지 알려 줘야 한다: %v\", err)\n\t}\n}\n" },
      ex: "recover 는 defer 로 등록된 함수 안에서만 듣습니다. 그냥 함수 본문에서 부르면 nil 을 돌려주고 패닉은 그대로 올라가요. 그리고 err 를 고쳐 쓰려면 반환값에 이름이 있어야 합니다.",
    },
    {
      k: "Work · 이미 취소됐으면 일하지 않기",
      pkg: "ex",
      q: "일을 시작하기 전에 <code>ctx</code> 가 <b>이미 취소됐는지</b> 확인하고, 그렇다면 그 에러를 그대로 돌려주세요.",
      src: "package ex\n\nimport \"context\"\n\nfunc Work(ctx context.Context, n int) (int, error) {\n\treturn n * 2, nil\n}\n",
      sol: "package ex\n\nimport \"context\"\n\nfunc Work(ctx context.Context, n int) (int, error) {\n\tif err := ctx.Err(); err != nil {\n\t\treturn 0, err\n\t}\n\treturn n * 2, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"context\"\n\t\"errors\"\n\t\"testing\"\n)\n\nfunc TestWorkOK(t *testing.T) {\n\tif v, err := Work(context.Background(), 3); v != 6 || err != nil {\n\t\tt.Fatalf(\"got %d %v\", v, err)\n\t}\n}\n\nfunc TestWorkCanceled(t *testing.T) {\n\tctx, cancel := context.WithCancel(context.Background())\n\tcancel()\n\tv, err := Work(ctx, 3)\n\tif !errors.Is(err, context.Canceled) {\n\t\tt.Fatalf(\"취소됐으면 context.Canceled 여야 한다: got %d %v\", v, err)\n\t}\n\tif v != 0 {\n\t\tt.Fatalf(\"취소됐으면 결과를 만들지 않는다: got %d\", v)\n\t}\n}\n" },
      ex: "사용자가 이미 창을 닫았는데 서버가 계속 계산하고 있으면 그만큼 자원이 낭비됩니다. ctx.Err() 한 줄로 '아직 필요한 일인가' 를 먼저 물어볼 수 있어요.",
    },
  ],
},
/* ── 에러 처리 관용구와 테스트 (심화) ─────────────────────── */
{
  unit: "에러 처리 관용구와 테스트 (심화)",
  lesson: "더 해 보기 — 에러에 정보를 담아 넘기기",
  th: {
    sum: "에러는 '실패했다' 만 말하면 부족하다. **무엇이 왜** 실패했는지 담아야 부른 쪽이 판단할 수 있다.",
    body: [
      { h: "타입으로 정보를 담는다", t: "필드가 있는 에러 타입을 만들면 줄 번호·필드 이름 같은 것을 같이 넘길 수 있다. 부른 쪽은 `errors.As` 로 그 타입을 꺼내 필드를 읽는다. 글자만 넘기면 다시 파싱해야 하는데, 그건 곧 깨진다." },
      { h: "여러 실패를 한꺼번에", t: "입력 검사처럼 실패가 여럿일 수 있는 곳에서 첫 번째만 알려 주면, 고치고 다시 내고 또 고치고를 반복하게 된다. `errors.Join` 으로 묶어 한 번에 알려 주면 한 번에 고칠 수 있다." },
      { h: "에러를 삼키지 않는다", t: "`v, _ := strconv.Atoi(s)` 는 실패해도 0을 그대로 쓴다. 잘못된 입력이 0으로 둔갑해 조용히 흘러간다. 나중에 '왜 0이지' 를 거슬러 올라가는 것이 제일 오래 걸리는 디버깅이다." },
    ],
    code: { c: "type FieldErr struct{ Field string }\n\nfunc (e *FieldErr) Error() string { return e.Field + \" 가 잘못됐다\" }\n\nvar fe *FieldErr\nif errors.As(err, &fe) { fmt.Println(fe.Field) }", cap: "타입으로 담으면 꺼내 쓸 수 있다" },
    key: ["에러 타입에 정보를 담는다", "`errors.As` 로 꺼낸다", "에러를 `_` 로 버리지 않는다"],
  },
  q: [
    {
      k: "Validate · 어떤 항목이 잘못됐는지 알려 주기",
      pkg: "ex",
      q: "이름이 비었으면 <code>*FieldErr</code> 를 돌려주되, <code>Field</code> 에 <code>\"name\"</code> 을 담아 주세요. 부른 쪽이 <code>errors.As</code> 로 꺼내 읽습니다.",
      src: "package ex\n\nimport \"errors\"\n\ntype FieldErr struct {\n\tField string\n}\n\nfunc (e *FieldErr) Error() string { return e.Field + \" 가 잘못됐다\" }\n\nfunc Validate(name string) error {\n\tif name == \"\" {\n\t\treturn errors.New(\"name 이 잘못됐다\")\n\t}\n\treturn nil\n}\n",
      sol: "package ex\n\ntype FieldErr struct {\n\tField string\n}\n\nfunc (e *FieldErr) Error() string { return e.Field + \" 가 잘못됐다\" }\n\nfunc Validate(name string) error {\n\tif name == \"\" {\n\t\treturn &FieldErr{Field: \"name\"}\n\t}\n\treturn nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"errors\"\n\t\"testing\"\n)\n\nfunc TestValidateOK(t *testing.T) {\n\tif err := Validate(\"루이\"); err != nil {\n\t\tt.Fatalf(\"got %v\", err)\n\t}\n}\n\nfunc TestValidateField(t *testing.T) {\n\terr := Validate(\"\")\n\tif err == nil {\n\t\tt.Fatal(\"빈 이름은 에러여야 한다\")\n\t}\n\tvar fe *FieldErr\n\tif !errors.As(err, &fe) {\n\t\tt.Fatalf(\"*FieldErr 로 꺼낼 수 있어야 한다: %v\", err)\n\t}\n\tif fe.Field != \"name\" {\n\t\tt.Fatalf(\"Field: got %q, want name\", fe.Field)\n\t}\n}\n" },
      ex: "글자로만 넘기면 부른 쪽은 문장을 다시 뜯어봐야 합니다. 문장이 조금만 바뀌어도 그 코드는 깨져요. 타입에 담아 넘기면 필드를 그대로 읽을 수 있습니다.",
    },
    {
      k: "CheckAll · 잘못된 것을 한꺼번에 알려 주기",
      pkg: "ex",
      q: "이름이 비었으면 <code>ErrName</code>, 나이가 음수면 <code>ErrAge</code> 입니다. <b>둘 다</b> 잘못됐으면 둘 다 알아볼 수 있게 돌려주세요.",
      src: "package ex\n\nimport \"errors\"\n\nvar ErrName = errors.New(\"이름이 비었다\")\nvar ErrAge = errors.New(\"나이가 음수다\")\n\nfunc CheckAll(name string, age int) error {\n\tif name == \"\" {\n\t\treturn ErrName\n\t}\n\tif age < 0 {\n\t\treturn ErrAge\n\t}\n\treturn nil\n}\n",
      sol: "package ex\n\nimport \"errors\"\n\nvar ErrName = errors.New(\"이름이 비었다\")\nvar ErrAge = errors.New(\"나이가 음수다\")\n\nfunc CheckAll(name string, age int) error {\n\tvar errs []error\n\tif name == \"\" {\n\t\terrs = append(errs, ErrName)\n\t}\n\tif age < 0 {\n\t\terrs = append(errs, ErrAge)\n\t}\n\treturn errors.Join(errs...)\n}\n",
      test: { "ex_test.go": "package ex\n\nimport (\n\t\"errors\"\n\t\"testing\"\n)\n\nfunc TestCheckAllOK(t *testing.T) {\n\tif err := CheckAll(\"루이\", 20); err != nil {\n\t\tt.Fatalf(\"got %v\", err)\n\t}\n}\n\nfunc TestCheckAllOne(t *testing.T) {\n\terr := CheckAll(\"\", 20)\n\tif !errors.Is(err, ErrName) || errors.Is(err, ErrAge) {\n\t\tt.Fatalf(\"이름만 잘못됐다: %v\", err)\n\t}\n}\n\nfunc TestCheckAllBoth(t *testing.T) {\n\terr := CheckAll(\"\", -1)\n\tif !errors.Is(err, ErrName) {\n\t\tt.Fatalf(\"ErrName 이 빠졌다: %v\", err)\n\t}\n\tif !errors.Is(err, ErrAge) {\n\t\tt.Fatalf(\"ErrAge 가 빠졌다: %v — 첫 번째에서 바로 돌아가고 있다\", err)\n\t}\n}\n" },
      ex: "첫 번째 잘못에서 바로 돌아가면, 사용자는 고치고 다시 내고 또 고치기를 반복해야 합니다. errors.Join 으로 묶으면 한 번에 다 알려 줄 수 있고, errors.Is 는 묶음 안까지 들여다봐요.",
    },
    {
      k: "ParseAge · 에러를 버리지 않기",
      pkg: "ex",
      q: "글자를 숫자로 바꿔 돌려주세요. <b>숫자가 아니면</b> 에러를 돌려줍니다. 0으로 슬쩍 넘기면 안 됩니다.",
      src: "package ex\n\nimport \"strconv\"\n\nfunc ParseAge(s string) (int, error) {\n\tn, _ := strconv.Atoi(s)\n\treturn n, nil\n}\n",
      sol: "package ex\n\nimport (\n\t\"fmt\"\n\t\"strconv\"\n)\n\nfunc ParseAge(s string) (int, error) {\n\tn, err := strconv.Atoi(s)\n\tif err != nil {\n\t\treturn 0, fmt.Errorf(\"나이를 읽지 못했다: %w\", err)\n\t}\n\treturn n, nil\n}\n",
      test: { "ex_test.go": "package ex\n\nimport \"testing\"\n\nfunc TestParseAgeOK(t *testing.T) {\n\tif v, err := ParseAge(\"20\"); v != 20 || err != nil {\n\t\tt.Fatalf(\"got %d %v\", v, err)\n\t}\n}\n\nfunc TestParseAgeBad(t *testing.T) {\n\tv, err := ParseAge(\"스무살\")\n\tif err == nil {\n\t\tt.Fatalf(\"숫자가 아니면 에러여야 한다 (got %d) — _ 로 버리고 있다\", v)\n\t}\n\tif v != 0 {\n\t\tt.Fatalf(\"실패했으면 0을 돌려준다: got %d\", v)\n\t}\n}\n" },
      ex: "_ 로 버린 에러는 사라지지만 문제는 사라지지 않습니다. 잘못된 입력이 0으로 둔갑해 흘러가다가 한참 뒤에 이상한 값으로 나타나요. 그때 원인을 거슬러 찾는 것이 제일 오래 걸립니다.",
    },
  ],
},
];
