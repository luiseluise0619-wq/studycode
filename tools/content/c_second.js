/* C 실습 2차 — 실습이 하나도 없던 6개 유닛을 연다.

   포인터 감쇠 · 문자열 파싱 · 방어적 코딩 · 열거형/typedef · 재귀 · 표준 라이브러리.

   실패가 '정의되지 않은 동작(UB)' 에 기대면 안 된다. 버퍼 밖에 쓰거나 해제한 메모리를
   읽는 식으로 틀리게 만들면 어떤 기계에서는 우연히 통과한다 — 그건 배우는 사람에게
   거짓말을 하는 것이다. 그래서 시작 코드의 버그는 전부 '읽어도 안전한데 값이 틀린'
   것으로 골랐다. 범위 밖을 읽어야만 드러나는 버그는 여기 없다.

   테스트는 러너가 sol.c 와 test.c 를 함께 컴파일해 실행하고 종료 코드로 판정한다. */
module.exports = [
/* ── 포인터와 배열 심화: 감쇠와 포인터 연산 ───────────────── */
{
  unit: "포인터와 배열 심화: 감쇠와 포인터 연산",
  lesson: "직접 짜 보기 — 배열은 넘어가면 포인터다",
  th: {
    sum: "배열을 함수에 넘기면 **첫 칸을 가리키는 포인터**만 간다. 길이는 따라가지 않는다.",
    body: [
      { h: "sizeof 가 갑자기 8이 된다", t: "함수 밖에서는 `sizeof(arr)` 가 배열 전체 크기지만, 매개변수로 받은 순간 그건 포인터라서 `sizeof` 는 **포인터 크기**(보통 8)다. `sizeof(xs)/sizeof(xs[0])` 로 개수를 세면 8/4 = 2 가 나온다 — 배열이 몇 개든 늘 2다." },
      { h: "그래서 길이를 같이 넘긴다", t: "C 에는 배열이 자기 길이를 아는 방법이 없다. 함수는 `(포인터, 개수)` 한 쌍으로 받는 것이 관례다. 이 관례를 어기면 어디까지 읽어야 하는지 아무도 모르게 된다." },
      { h: "포인터 연산은 칸 단위다", t: "`xs + 3` 은 3바이트 뒤가 아니라 **원소 3칸 뒤**다. 그리고 두 포인터를 빼면 몇 칸 떨어졌는지가 나온다. 바이트로 착각하면 엉뚱한 자리를 가리킨다." },
    ],
    code: { c: "void f(const int *xs) {\n    sizeof(xs);      // 8 — 포인터 크기다\n}\n\nint sum(const int *xs, int n);   // 개수를 같이 받는다", cap: "길이는 따라가지 않는다" },
    key: ["매개변수 배열은 포인터다", "길이를 같이 넘긴다", "포인터 연산은 칸 단위"],
  },
  q: [
    {
      k: "sum_all · 넘겨받은 개수만큼 더하기",
      qq: "배열의 값을 <b>n개 전부</b> 더해 돌려주세요.",
      src: "int sum_all(const int *xs, int n) {\n    int count = (int)(sizeof(xs) / sizeof(xs[0]));\n    int sum = 0;\n    for (int i = 0; i < count; i++) sum += xs[i];\n    return sum;\n}\n",
      sol: "int sum_all(const int *xs, int n) {\n    int sum = 0;\n    for (int i = 0; i < n; i++) sum += xs[i];\n    return sum;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint sum_all(const int *xs, int n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int a[] = {1, 2, 3, 4, 5};\n    eq(sum_all(a, 5), 15, \"다섯 개를 다 더해야 한다\");\n    int b[] = {10, 20, 30};\n    eq(sum_all(b, 3), 60, \"세 개를 다 더해야 한다\");\n    eq(sum_all(a, 1), 1, \"한 개만\");\n    eq(sum_all(a, 0), 0, \"개수가 0이면 0\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "매개변수로 받은 xs 는 배열이 아니라 포인터라, sizeof(xs) 는 포인터 크기인 8입니다. 8/4 = 2 라서 배열이 몇 개든 늘 앞의 두 개만 더해요. 개수는 n 으로 받은 것을 써야 합니다.",
    },
    {
      k: "reverse · 가운데에서 멈추기",
      qq: "배열을 <b>제자리에서</b> 앞뒤로 뒤집으세요.",
      src: "void reverse(int *xs, int n) {\n    for (int i = 0; i < n; i++) {\n        int j = n - 1 - i;\n        int t = xs[i];\n        xs[i] = xs[j];\n        xs[j] = t;\n    }\n}\n",
      sol: "void reverse(int *xs, int n) {\n    for (int i = 0, j = n - 1; i < j; i++, j--) {\n        int t = xs[i];\n        xs[i] = xs[j];\n        xs[j] = t;\n    }\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nvoid reverse(int *xs, int n);\n\nstatic int fails = 0;\nstatic void same(const int *got, const int *want, int n, const char *what) {\n    for (int i = 0; i < n; i++) {\n        if (got[i] != want[i]) { printf(\"%s: [%d] got %d, want %d\\n\", what, i, got[i], want[i]); fails++; return; }\n    }\n}\n\nint main(void) {\n    int a[] = {1, 2, 3, 4};\n    int wa[] = {4, 3, 2, 1};\n    reverse(a, 4);\n    same(a, wa, 4, \"짝수 개\");\n    int b[] = {1, 2, 3};\n    int wb[] = {3, 2, 1};\n    reverse(b, 3);\n    same(b, wb, 3, \"홀수 개\");\n    int c[] = {7};\n    int wc[] = {7};\n    reverse(c, 1);\n    same(c, wc, 1, \"한 개\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "끝까지 돌면 같은 짝을 두 번 바꿉니다. 두 번 바꾸면 제자리로 돌아와서 결국 아무 일도 없었던 것이 돼요. 두 포인터가 만나는 가운데에서 멈춰야 합니다.",
    },
    {
      k: "row_sum · 한 줄을 끝까지 더하기",
      qq: "<code>cols</code>칸짜리 줄이 여러 개인 표에서 <code>r</code>번째 줄의 합을 돌려주세요.",
      src: "int row_sum(const int *m, int cols, int r) {\n    return m[r * cols] + m[r * cols + 1];\n}\n",
      sol: "int row_sum(const int *m, int cols, int r) {\n    int sum = 0;\n    for (int c = 0; c < cols; c++) sum += m[r * cols + c];\n    return sum;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint row_sum(const int *m, int cols, int r);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int m[] = {1, 2, 3,\n               4, 5, 6};\n    eq(row_sum(m, 3, 0), 6, \"첫 줄 1+2+3\");\n    eq(row_sum(m, 3, 1), 15, \"둘째 줄 4+5+6\");\n    int k[] = {1, 2, 3, 4};\n    eq(row_sum(k, 4, 0), 10, \"네 칸짜리 줄\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "두 칸만 더하면 세 칸짜리 표에서 마지막 값이 빠집니다. 줄의 시작은 r*cols 이고, 거기서 cols 칸을 세어야 해요 — 칸 수가 바뀌어도 맞습니다.",
    },
  ],
},
/* ── 문자열 파싱 실무 (중급) ──────────────────────────────── */
{
  unit: "문자열 파싱 실무 (중급)",
  lesson: "직접 짜 보기 — 사람이 친 글자를 받아 내기",
  th: {
    sum: "사람이 친 글자는 **깨끗하지 않다.** 앞뒤 공백, 두 번 들어간 띄어쓰기, 숫자가 아닌 글자를 늘 만난다.",
    body: [
      { h: "칸을 세지 말고 낱말을 센다", t: "'띄어쓰기 개수 + 1' 로 낱말을 세면, 앞에 공백이 있거나 두 번 띄었을 때 바로 틀린다. 낱말은 '공백이 아닌 글자가 **시작되는 자리**' 를 세야 한다. 이렇게 하면 공백이 몇 개든 상관없다." },
      { h: "atoi 는 실패를 알려 주지 않는다", t: "`atoi(\"abc\")` 는 0을 돌려준다. `\"0\"` 을 넣어도 0이다. 둘을 구분할 방법이 없어서 잘못된 입력이 조용히 0으로 흘러간다. `strtol` 은 **어디까지 읽었는지**를 알려 주므로 성공·실패를 가릴 수 있다." },
      { h: "다듬기는 양쪽 다", t: "줄 끝의 개행만 지우면 그 앞의 공백은 남는다. 비교할 때 `\"kim \"` 과 `\"kim\"` 이 달라져서 '분명 같은데 왜 안 맞지' 가 된다. 뒤에서부터 공백이 아닌 글자를 만날 때까지 잘라 낸다." },
    ],
    code: { c: "char *end;\nlong v = strtol(s, &end, 10);\nif (end == s || *end != '\\0') return 0;   // 못 읽었거나 뒤에 뭔가 남았다", cap: "strtol 은 어디까지 읽었는지 알려 준다" },
    key: ["낱말은 시작 자리를 센다", "`atoi` 는 실패를 못 알린다", "공백은 끝까지 다듬는다"],
  },
  q: [
    {
      k: "word_count · 공백이 몇 개든 맞게 세기",
      qq: "문장의 <b>낱말 수</b>를 세세요. 앞뒤 공백이나 이어진 공백이 있어도 맞아야 합니다.",
      src: "int word_count(const char *s) {\n    int spaces = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == ' ') spaces++;\n    }\n    return spaces + 1;\n}\n",
      sol: "int word_count(const char *s) {\n    int n = 0;\n    int in_word = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == ' ') {\n            in_word = 0;\n        } else if (!in_word) {\n            in_word = 1;\n            n++;\n        }\n    }\n    return n;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint word_count(const char *s);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(word_count(\"a b c\"), 3, \"보통 문장\");\n    eq(word_count(\"  a   b  \"), 2, \"앞뒤와 가운데 공백\");\n    eq(word_count(\"\"), 0, \"빈 문자열\");\n    eq(word_count(\"   \"), 0, \"공백뿐\");\n    eq(word_count(\"one\"), 1, \"한 낱말\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "공백 개수 + 1 은 낱말이 공백 하나로만 나뉘어 있을 때만 맞습니다. 빈 문자열에서 1이 나오고, 앞에 공백이 있으면 하나 더 세요. 낱말이 시작되는 자리를 세면 공백이 몇 개든 상관없습니다.",
    },
    {
      k: "trim_right · 뒤쪽 공백까지 잘라 내기",
      qq: "문자열 <b>끝</b>의 공백과 개행을 잘라 내세요. 제자리에서 고칩니다.",
      src: "void trim_right(char *s) {\n    int n = 0;\n    while (s[n]) n++;\n    if (n > 0 && s[n - 1] == '\\n') s[n - 1] = '\\0';\n}\n",
      sol: "void trim_right(char *s) {\n    int n = 0;\n    while (s[n]) n++;\n    while (n > 0 && (s[n - 1] == ' ' || s[n - 1] == '\\n' || s[n - 1] == '\\t')) {\n        s[n - 1] = '\\0';\n        n--;\n    }\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <string.h>\n\nvoid trim_right(char *s);\n\nstatic int fails = 0;\nstatic void eq(const char *got, const char *want, const char *what) {\n    if (strcmp(got, want) != 0) { printf(\"%s: got \\\"%s\\\", want \\\"%s\\\"\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    char a[32] = \"kim\\n\";\n    trim_right(a);\n    eq(a, \"kim\", \"개행 제거\");\n    char b[32] = \"kim   \";\n    trim_right(b);\n    eq(b, \"kim\", \"뒤쪽 공백 제거\");\n    char c[32] = \"kim \\n\";\n    trim_right(c);\n    eq(c, \"kim\", \"공백과 개행이 섞여도\");\n    char d[32] = \" kim\";\n    trim_right(d);\n    eq(d, \" kim\", \"앞쪽은 건드리지 않는다\");\n    char e[32] = \"\";\n    trim_right(e);\n    eq(e, \"\", \"빈 문자열\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "개행만 지우면 그 앞의 공백은 그대로 남습니다. 그러면 \"kim \" 과 \"kim\" 이 다른 값이 되어 '분명 같은데 왜 안 맞지' 가 돼요. 공백이 아닌 글자를 만날 때까지 계속 잘라야 합니다.",
    },
    {
      k: "parse_int · 숫자가 아니면 실패라고 말하기",
      qq: "글자를 정수로 바꿔 <code>*out</code> 에 넣고 <code>1</code>을 돌려주세요. <b>숫자가 아니면</b> <code>0</code>을 돌려줍니다.",
      src: "#include <stdlib.h>\n\nint parse_int(const char *s, int *out) {\n    *out = atoi(s);\n    return 1;\n}\n",
      sol: "#include <stdlib.h>\n\nint parse_int(const char *s, int *out) {\n    char *end;\n    long v = strtol(s, &end, 10);\n    if (end == s || *end != '\\0') return 0;\n    *out = (int)v;\n    return 1;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint parse_int(const char *s, int *out);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int v = -1;\n    eq(parse_int(\"12\", &v), 1, \"숫자는 성공\");\n    eq(v, 12, \"값이 들어가야 한다\");\n    eq(parse_int(\"0\", &v), 1, \"0도 성공\");\n    eq(v, 0, \"0이 들어가야 한다\");\n    eq(parse_int(\"abc\", &v), 0, \"글자는 실패\");\n    eq(parse_int(\"12x\", &v), 0, \"뒤에 남으면 실패\");\n    eq(parse_int(\"\", &v), 0, \"빈 문자열은 실패\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "atoi 는 \"abc\" 도 0을 돌려줍니다. \"0\" 과 구분할 방법이 없어서 잘못된 입력이 조용히 0으로 흘러가요. strtol 은 어디까지 읽었는지 알려 주니 실패를 가릴 수 있습니다.",
    },
  ],
},
/* ── 에러 처리와 방어적 코딩 (심화) ───────────────────────── */
{
  unit: "에러 처리와 방어적 코딩 (심화)",
  lesson: "직접 짜 보기 — 실패를 정직하게 알리기",
  th: {
    sum: "C 에는 예외가 없다. 실패는 **반환값으로** 알리고, 실패했으면 결과를 건드리지 않는다.",
    body: [
      { h: "실패했으면 결과를 남기지 않는다", t: "검사에 걸렸는데 `*out` 을 이미 고쳐 놨다면, 부른 쪽은 '실패' 를 보고도 망가진 값을 들고 있게 된다. 검사를 먼저 다 하고, 통과했을 때만 쓴다. 이 순서 하나로 부른 쪽이 안심할 수 있다." },
      { h: "없는 것은 성공이 아니다", t: "빈 배열에서 최댓값을 구할 수는 없다. 이때 0을 넣고 '성공' 이라고 하면, 부른 쪽은 진짜 0인지 없는 건지 알 수 없다. **못 했으면 못 했다고** 말해야 한다." },
      { h: "잘라 넣었으면 그것도 실패다", t: "`strncpy` 는 자리가 모자라면 끝의 `\\0` 을 안 붙인다. 그러면 그 뒤로 문자열이 어디서 끝나는지 알 수 없게 된다. 잘랐다는 사실을 알리고, 넣은 만큼은 반드시 제대로 끝맺어야 한다." },
    ],
    code: { c: "int set_percent(int v, int *out) {\n    if (v < 0 || v > 100) return 0;   // 먼저 거른다\n    *out = v;                          // 통과했을 때만 쓴다\n    return 1;\n}", cap: "검사가 먼저, 쓰기는 나중" },
    key: ["실패하면 결과를 안 건드린다", "'없음' 은 성공이 아니다", "잘라 넣은 것도 실패다"],
  },
  q: [
    {
      k: "set_percent · 실패했으면 손대지 않기",
      qq: "0~100 이면 <code>*out</code> 에 넣고 <code>1</code>, 아니면 <code>*out</code> 을 <b>건드리지 말고</b> <code>0</code>을 돌려주세요.",
      src: "int set_percent(int v, int *out) {\n    *out = v;\n    if (v < 0 || v > 100) return 0;\n    return 1;\n}\n",
      sol: "int set_percent(int v, int *out) {\n    if (v < 0 || v > 100) return 0;\n    *out = v;\n    return 1;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint set_percent(int v, int *out);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int v = 50;\n    eq(set_percent(70, &v), 1, \"범위 안이면 성공\");\n    eq(v, 70, \"값이 들어가야 한다\");\n    eq(set_percent(200, &v), 0, \"범위 밖이면 실패\");\n    eq(v, 70, \"실패했으면 이전 값이 그대로여야 한다\");\n    eq(set_percent(-1, &v), 0, \"음수도 실패\");\n    eq(v, 70, \"음수에서도 그대로\");\n    eq(set_percent(0, &v), 1, \"경계 0\");\n    eq(set_percent(100, &v), 1, \"경계 100\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "먼저 쓰고 나중에 거르면, 부른 쪽은 '실패' 를 보고도 이미 망가진 값을 들고 있게 됩니다. 검사를 다 통과한 뒤에 쓰면 실패했을 때 아무것도 달라지지 않아요.",
    },
    {
      k: "max_of · 없으면 없다고 말하기",
      qq: "최댓값을 <code>*out</code> 에 넣고 <code>1</code>을 돌려주세요. 개수가 <b>0이면</b> <code>0</code>을 돌려줍니다.",
      src: "int max_of(const int *xs, int n, int *out) {\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        if (xs[i] > m) m = xs[i];\n    }\n    *out = m;\n    return 1;\n}\n",
      sol: "int max_of(const int *xs, int n, int *out) {\n    if (n <= 0) return 0;\n    int m = xs[0];\n    for (int i = 1; i < n; i++) {\n        if (xs[i] > m) m = xs[i];\n    }\n    *out = m;\n    return 1;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint max_of(const int *xs, int n, int *out);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int v = -999;\n    int a[] = {3, 9, 4};\n    eq(max_of(a, 3, &v), 1, \"값이 있으면 성공\");\n    eq(v, 9, \"최댓값\");\n    int b[] = {-5, -2, -9};\n    eq(max_of(b, 3, &v), 1, \"음수만 있어도 성공\");\n    eq(v, -2, \"음수 중 최댓값\");\n    eq(max_of(a, 0, &v), 0, \"개수가 0이면 실패라고 말해야 한다\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "0에서 시작하면 값이 전부 음수일 때 있지도 않은 0이 최댓값이 됩니다. 그리고 빈 배열에서 '성공' 이라고 하면 부른 쪽은 진짜 0인지 없는 건지 알 수 없어요.",
    },
    {
      k: "safe_copy · 잘랐으면 잘랐다고",
      qq: "<code>src</code> 를 <code>dst</code> 에 복사하세요. 자리가 <b>모자라면</b> <code>0</code>을 돌려주되, 넣은 만큼은 <b>반드시 <code>\\0</code> 으로 끝맺어야</b> 합니다.",
      src: "#include <string.h>\n\nint safe_copy(char *dst, unsigned long cap, const char *src) {\n    strncpy(dst, src, cap);\n    return 1;\n}\n",
      sol: "#include <string.h>\n\nint safe_copy(char *dst, unsigned long cap, const char *src) {\n    if (cap == 0) return 0;\n    unsigned long n = strlen(src);\n    unsigned long copy = (n < cap - 1) ? n : cap - 1;\n    memcpy(dst, src, copy);\n    dst[copy] = '\\0';\n    return n < cap ? 1 : 0;\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <string.h>\n\nint safe_copy(char *dst, unsigned long cap, const char *src);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\nstatic void eqs(const char *got, const char *want, const char *what) {\n    if (strcmp(got, want) != 0) { printf(\"%s: got \\\"%s\\\", want \\\"%s\\\"\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    char buf[8];\n    memset(buf, 'X', sizeof(buf));\n    eq(safe_copy(buf, 8, \"kim\"), 1, \"넉넉하면 성공\");\n    eqs(buf, \"kim\", \"내용\");\n\n    char small[4];\n    memset(small, 'X', sizeof(small));\n    eq(safe_copy(small, 4, \"abcdefg\"), 0, \"모자라면 실패라고 말해야 한다\");\n    eq(small[3], '\\0', \"잘라 넣어도 끝맺어야 한다\");\n    eqs(small, \"abc\", \"들어간 만큼\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "strncpy 는 자리가 모자라면 끝의 \\0 을 안 붙입니다. 그러면 그 뒤로 문자열이 어디서 끝나는지 알 수 없게 돼요. 넣은 만큼 끝맺고, 잘랐다는 사실도 알려야 합니다.",
    },
  ],
},
/* ── C 중급 — 열거형과 typedef ────────────────────────────── */
{
  unit: "C 중급 — 열거형과 typedef",
  lesson: "직접 써 보기 — 숫자에 이름을 붙이기",
  th: {
    sum: "enum 은 **숫자에 이름을 붙이는 것**이고, typedef 는 **타입에 짧은 이름을 붙이는 것**이다.",
    body: [
      { h: "값을 직접 적을 수 있다", t: "enum 상수는 적지 않으면 0부터 하나씩 올라간다. HTTP 코드처럼 뜻이 있는 숫자는 `OK = 200` 처럼 **직접 적는다.** 순서에 기대면 누가 상수를 가운데 끼워 넣는 순간 전부 밀린다." },
      { h: "빠뜨린 case 는 조용히 지나간다", t: "switch 에서 상수 하나를 빠뜨려도 C 는 아무 말도 하지 않는다. 기본값이 그대로 나가서 화면에 '알 수 없음' 이 뜰 뿐이다. 새 상수를 넣고 switch 고치는 걸 잊는 것이 흔한 사고다." },
      { h: "typedef 는 구조체를 짧게 만든다", t: "`struct Point p;` 대신 `Point p;` 로 쓸 수 있다. 함수 인자·반환에 구조체를 그대로 주고받으면 값이 통째로 복사되므로, 부른 쪽 값은 안전하다 — 대신 큰 구조체는 포인터로 넘긴다." },
    ],
    code: { c: "typedef enum { OK = 200, NOT_FOUND = 404 } Code;\ntypedef struct { int x, y; } Point;\n\nPoint add(Point a, Point b);   // 값으로 주고받는다", cap: "이름을 붙이면 읽을 수 있다" },
    key: ["뜻이 있는 값은 직접 적는다", "switch 에서 빠뜨리지 않기", "`typedef` 로 짧게"],
  },
  q: [
    {
      k: "code_of · 뜻이 있는 숫자 적어 두기",
      qq: "<code>OK</code>는 200, <code>NOT_FOUND</code>는 404, <code>ERROR</code>는 500을 돌려주게 하세요.",
      src: "typedef enum { OK, NOT_FOUND, ERROR } Code;\n\nint code_of(Code c) {\n    return (int)c;\n}\n",
      sol: "typedef enum { OK = 200, NOT_FOUND = 404, ERROR = 500 } Code;\n\nint code_of(Code c) {\n    return (int)c;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\ntypedef enum { OK = 200, NOT_FOUND = 404, ERROR = 500 } Code;\nint code_of(Code c);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(code_of(OK), 200, \"OK 는 200\");\n    eq(code_of(NOT_FOUND), 404, \"NOT_FOUND 는 404\");\n    eq(code_of(ERROR), 500, \"ERROR 는 500\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "값을 적지 않으면 0, 1, 2 가 됩니다. 뜻이 있는 숫자는 직접 적어야 하고, 그래야 나중에 상수를 가운데 끼워 넣어도 나머지가 밀리지 않아요.",
    },
    {
      k: "level_name · 빠뜨린 case 없이",
      qq: "<code>LOW</code>는 <code>\"낮음\"</code>, <code>MID</code>는 <code>\"보통\"</code>, <code>HIGH</code>는 <code>\"높음\"</code> 을 돌려주세요.",
      src: "typedef enum { LOW, MID, HIGH } Level;\n\nconst char *level_name(Level l) {\n    switch (l) {\n        case LOW: return \"낮음\";\n        case HIGH: return \"높음\";\n        default: return \"알 수 없음\";\n    }\n}\n",
      sol: "typedef enum { LOW, MID, HIGH } Level;\n\nconst char *level_name(Level l) {\n    switch (l) {\n        case LOW: return \"낮음\";\n        case MID: return \"보통\";\n        case HIGH: return \"높음\";\n        default: return \"알 수 없음\";\n    }\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <string.h>\n\ntypedef enum { LOW, MID, HIGH } Level;\nconst char *level_name(Level l);\n\nstatic int fails = 0;\nstatic void eqs(const char *got, const char *want, const char *what) {\n    if (strcmp(got, want) != 0) { printf(\"%s: got \\\"%s\\\", want \\\"%s\\\"\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eqs(level_name(LOW), \"낮음\", \"LOW\");\n    eqs(level_name(MID), \"보통\", \"MID — 빠뜨리기 쉬운 자리\");\n    eqs(level_name(HIGH), \"높음\", \"HIGH\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "case 하나를 빠뜨려도 컴파일러는 아무 말 하지 않습니다. 실행 중에 기본값이 그대로 나가서 화면에 '알 수 없음' 이 뜰 뿐이에요. 상수를 늘렸다면 switch 도 같이 봐야 합니다.",
    },
    {
      k: "add · 구조체를 값으로 주고받기",
      qq: "두 점을 더한 <b>새 점</b>을 돌려주세요. <code>x</code>와 <code>y</code> 둘 다 더해야 합니다.",
      src: "typedef struct {\n    int x, y;\n} Point;\n\nPoint add(Point a, Point b) {\n    Point r;\n    r.x = a.x + b.x;\n    r.y = a.y;\n    return r;\n}\n",
      sol: "typedef struct {\n    int x, y;\n} Point;\n\nPoint add(Point a, Point b) {\n    Point r;\n    r.x = a.x + b.x;\n    r.y = a.y + b.y;\n    return r;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\ntypedef struct {\n    int x, y;\n} Point;\nPoint add(Point a, Point b);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    Point a = {1, 2}, b = {10, 20};\n    Point r = add(a, b);\n    eq(r.x, 11, \"x 를 더해야 한다\");\n    eq(r.y, 22, \"y 도 더해야 한다\");\n    eq(a.x, 1, \"원본은 그대로 (값으로 넘어간다)\");\n    eq(a.y, 2, \"원본은 그대로\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "한 줄을 복사해 놓고 뒤쪽만 고치는 실수가 흔합니다. 그리고 구조체를 값으로 넘기면 통째로 복사되니, 함수 안에서 무엇을 하든 부른 쪽 값은 안전해요.",
    },
  ],
},
/* ── C 중급 — 재귀와 스택 프레임 ──────────────────────────── */
{
  unit: "C 중급 — 재귀와 스택 프레임",
  lesson: "직접 짜 보기 — 멈추는 자리를 먼저 정하기",
  th: {
    sum: "재귀는 **멈추는 자리(기저)** 와 **한 걸음 줄이는 자리**, 두 가지만 맞으면 된다.",
    body: [
      { h: "기저를 먼저 쓴다", t: "기저 조건을 나중에 생각하면, 값이 줄어들다가 지나쳐 버려 영영 멈추지 않는다. 그래서 함수의 첫 줄에 '언제 끝나는가' 를 쓰는 습관이 좋다. 끝나는 값이 맞는지도 확인해야 한다 — `0!` 은 1이지 0이 아니다." },
      { h: "부를 때마다 자리를 하나 더 쓴다", t: "함수를 부를 때마다 지역 변수·돌아갈 주소를 담을 자리(스택 프레임)가 하나씩 쌓인다. 너무 깊이 들어가면 자리가 모자라 프로그램이 죽는다. 깊이가 자료 크기만큼 커지는 재귀는 반복문으로 바꾸는 것이 안전하다." },
      { h: "쪼갠 답을 합치는 방법을 정한다", t: "트리에서 잎을 셀 때는 '왼쪽 잎 수 + 오른쪽 잎 수' 로 합친다. 무엇을 세는지에 따라 합치는 방법이 달라진다 — 모든 노드를 세는 것과 잎만 세는 것은 다른 문제다." },
    ],
    code: { c: "int fact(int n) {\n    if (n <= 1) return 1;   // 멈추는 자리 — 값도 맞아야 한다\n    return n * fact(n - 1); // 한 걸음 줄인다\n}", cap: "기저를 먼저, 그다음 한 걸음" },
    key: ["기저를 먼저 쓴다", "부를 때마다 자리가 쌓인다", "합치는 방법을 정한다"],
  },
  q: [
    {
      k: "fact · 0! 은 1이다",
      qq: "<code>n</code>의 <b>팩토리얼</b>을 재귀로 구하세요. <code>0!</code> 과 <code>1!</code> 은 1입니다.",
      src: "int fact(int n) {\n    if (n <= 1) return 0;\n    return n * fact(n - 1);\n}\n",
      sol: "int fact(int n) {\n    if (n <= 1) return 1;\n    return n * fact(n - 1);\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint fact(int n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(fact(0), 1, \"0! 은 1\");\n    eq(fact(1), 1, \"1! 은 1\");\n    eq(fact(5), 120, \"5! 은 120\");\n    eq(fact(3), 6, \"3! 은 6\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "멈추는 자리에서 0을 돌려주면 곱셈이 전부 0이 됩니다. 재귀는 기저에서 돌려주는 값이 맞아야 위로 올라가는 계산이 맞아요 — 곱셈의 시작값은 1입니다.",
    },
    {
      k: "rev_str · 가운데에서 멈추는 재귀",
      qq: "문자열을 재귀로 <b>제자리에서</b> 뒤집으세요. <code>i</code>는 앞, <code>j</code>는 뒤 자리입니다.",
      src: "void rev_str(char *s, int i, int j) {\n    if (i > j) return;\n    char t = s[i];\n    s[i] = s[j];\n    s[j] = t;\n    rev_str(s, i + 1, j - 1);\n}\n",
      sol: "void rev_str(char *s, int i, int j) {\n    if (i >= j) return;\n    char t = s[i];\n    s[i] = s[j];\n    s[j] = t;\n    rev_str(s, i + 1, j - 1);\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <string.h>\n\nvoid rev_str(char *s, int i, int j);\n\nstatic int fails = 0;\nstatic void eqs(const char *got, const char *want, const char *what) {\n    if (strcmp(got, want) != 0) { printf(\"%s: got \\\"%s\\\", want \\\"%s\\\"\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    char a[] = \"abcd\";\n    rev_str(a, 0, 3);\n    eqs(a, \"dcba\", \"짝수 길이\");\n    char b[] = \"abc\";\n    rev_str(b, 0, 2);\n    eqs(b, \"cba\", \"홀수 길이 — 가운데를 건드리면 안 된다\");\n    char c[] = \"a\";\n    rev_str(c, 0, 0);\n    eqs(c, \"a\", \"한 글자\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "i > j 로 멈추면 i 와 j 가 같은 자리(가운데)에서 한 번 더 들어가 자기 자신과 바꿉니다. 한 글자짜리에서는 티가 안 나지만, 홀수 길이에서 한 걸음을 더 가서 다음 재귀가 서로 지나쳐요.",
    },
    {
      k: "count_leaves · 잎만 세기",
      qq: "이진 트리에서 <b>잎(자식이 없는 노드)</b>의 개수를 세세요.",
      src: "typedef struct Node {\n    int v;\n    struct Node *l, *r;\n} Node;\n\nint count_leaves(const Node *n) {\n    if (n == 0) return 0;\n    return 1 + count_leaves(n->l) + count_leaves(n->r);\n}\n",
      sol: "typedef struct Node {\n    int v;\n    struct Node *l, *r;\n} Node;\n\nint count_leaves(const Node *n) {\n    if (n == 0) return 0;\n    if (n->l == 0 && n->r == 0) return 1;\n    return count_leaves(n->l) + count_leaves(n->r);\n}\n",
      test: { "test.c": "#include <stdio.h>\n\ntypedef struct Node {\n    int v;\n    struct Node *l, *r;\n} Node;\nint count_leaves(const Node *n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    Node l1 = {1, 0, 0}, l2 = {2, 0, 0};\n    Node root = {3, &l1, &l2};\n    eq(count_leaves(&root), 2, \"잎 두 개\");\n    Node only = {9, 0, 0};\n    eq(count_leaves(&only), 1, \"혼자면 자기가 잎\");\n    Node mid = {5, &only, 0};\n    eq(count_leaves(&mid), 1, \"자식이 하나면 그 아래 잎만\");\n    eq(count_leaves(0), 0, \"빈 트리\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "1 + 왼쪽 + 오른쪽 은 '모든 노드' 를 세는 방법입니다. 잎만 세려면 자식이 없을 때만 1을 보태고, 그렇지 않으면 아래에서 올라온 수만 합쳐야 해요.",
    },
  ],
},
/* ── 표준 라이브러리 활용 (중급) ──────────────────────────── */
{
  unit: "표준 라이브러리 활용 (중급)",
  lesson: "직접 써 보기 — 이미 있는 것을 제대로 쓰기",
  th: {
    sum: "표준 라이브러리 함수는 대개 **돌려주는 값에 중요한 정보**가 들어 있다. 그걸 버리면 반쯤만 쓰는 것이다.",
    body: [
      { h: "qsort 의 비교 함수가 순서를 정한다", t: "`qsort` 는 비교 함수가 음수를 주면 앞, 양수를 주면 뒤로 보낸다. 두 값을 반대로 놓으면 그대로 내림차순이 된다. 오름차순인지 내림차순인지는 비교 함수 한 줄에 달려 있다." },
      { h: "snprintf 는 '필요했던 길이' 를 준다", t: "자리가 모자라 잘렸어도 `snprintf` 는 **원래 필요했던 길이**를 돌려준다. 그 값이 버퍼 크기 이상이면 잘린 것이다. 반환값을 버리면 잘린 문자열을 멀쩡한 것으로 착각한다." },
      { h: "비교 함수를 골라 쓴다", t: "`strcmp` 는 전체가 같은지, `strncmp` 는 앞의 n글자만 같은지 본다. '으로 시작하는가' 를 `strcmp` 로 물으면 완전히 같을 때만 참이 되어, 접두사 검사가 아니라 동일성 검사가 된다." },
    ],
    code: { c: "static int cmp(const void *a, const void *b) {\n    int x = *(const int *)a, y = *(const int *)b;\n    return (x > y) - (x < y);      // 오름차순\n}\n\nint n = snprintf(buf, cap, \"...\");\nif (n >= (int)cap) { /* 잘렸다 */ }", cap: "반환값에 답이 들어 있다" },
    key: ["비교 함수가 순서를 정한다", "`snprintf` 반환값으로 잘림을 안다", "접두사는 `strncmp`"],
  },
  q: [
    {
      k: "sort_ints · 작은 것부터",
      qq: "배열을 <b>오름차순</b>으로 정렬하세요. <code>qsort</code> 를 씁니다.",
      src: "#include <stdlib.h>\n\nstatic int cmp(const void *a, const void *b) {\n    int x = *(const int *)a;\n    int y = *(const int *)b;\n    return (y > x) - (y < x);\n}\n\nvoid sort_ints(int *xs, int n) {\n    qsort(xs, (unsigned long)n, sizeof(int), cmp);\n}\n",
      sol: "#include <stdlib.h>\n\nstatic int cmp(const void *a, const void *b) {\n    int x = *(const int *)a;\n    int y = *(const int *)b;\n    return (x > y) - (x < y);\n}\n\nvoid sort_ints(int *xs, int n) {\n    qsort(xs, (unsigned long)n, sizeof(int), cmp);\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nvoid sort_ints(int *xs, int n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int a[] = {3, 1, 2};\n    sort_ints(a, 3);\n    eq(a[0], 1, \"맨 앞은 가장 작은 값\");\n    eq(a[1], 2, \"가운데\");\n    eq(a[2], 3, \"맨 뒤는 가장 큰 값\");\n    int b[] = {-1, -9, 5};\n    sort_ints(b, 3);\n    eq(b[0], -9, \"음수도 오름차순\");\n    eq(b[2], 5, \"맨 뒤\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "비교 함수에서 두 값을 반대로 놓으면 그대로 내림차순이 됩니다. qsort 자체는 아무 순서도 정하지 않아요 — 순서는 전부 이 한 줄에 달려 있습니다.",
    },
    {
      k: "has_prefix · 으로 시작하는가",
      qq: "<code>s</code> 가 <code>p</code> 로 <b>시작하면</b> 1, 아니면 0을 돌려주세요.",
      src: "#include <string.h>\n\nint has_prefix(const char *s, const char *p) {\n    return strcmp(s, p) == 0;\n}\n",
      sol: "#include <string.h>\n\nint has_prefix(const char *s, const char *p) {\n    return strncmp(s, p, strlen(p)) == 0;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint has_prefix(const char *s, const char *p);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(has_prefix(\"hello\", \"he\"), 1, \"앞부분이 같으면 참\");\n    eq(has_prefix(\"hello\", \"hello\"), 1, \"통째로 같아도 참\");\n    eq(has_prefix(\"hello\", \"lo\"), 0, \"뒷부분은 아니다\");\n    eq(has_prefix(\"he\", \"hello\"), 0, \"짧으면 거짓\");\n    eq(has_prefix(\"hello\", \"\"), 1, \"빈 접두사는 언제나 참\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "strcmp 는 전체가 같은지를 봅니다. '으로 시작하는가' 를 물었는데 '똑같은가' 로 답하는 셈이에요. 앞의 몇 글자만 볼 때는 strncmp 입니다.",
    },
    {
      k: "fmt_point · 잘렸는지 확인하기",
      qq: "<code>\"(x, y)\"</code> 를 <code>buf</code> 에 쓰세요. 자리가 <b>모자라 잘렸으면</b> <code>0</code>, 다 들어갔으면 <code>1</code>을 돌려줍니다.",
      src: "#include <stdio.h>\n\nint fmt_point(char *buf, unsigned long cap, int x, int y) {\n    snprintf(buf, cap, \"(%d, %d)\", x, y);\n    return 1;\n}\n",
      sol: "#include <stdio.h>\n\nint fmt_point(char *buf, unsigned long cap, int x, int y) {\n    int need = snprintf(buf, cap, \"(%d, %d)\", x, y);\n    return (need >= 0 && (unsigned long)need < cap) ? 1 : 0;\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <string.h>\n\nint fmt_point(char *buf, unsigned long cap, int x, int y);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\nstatic void eqs(const char *got, const char *want, const char *what) {\n    if (strcmp(got, want) != 0) { printf(\"%s: got \\\"%s\\\", want \\\"%s\\\"\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    char big[32];\n    eq(fmt_point(big, sizeof(big), 1, 2), 1, \"넉넉하면 성공\");\n    eqs(big, \"(1, 2)\", \"내용\");\n    char small[4];\n    eq(fmt_point(small, sizeof(small), 100, 200), 0, \"모자라면 실패라고 말해야 한다\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "snprintf 는 잘렸어도 '원래 필요했던 길이' 를 돌려줍니다. 그 값이 버퍼 크기 이상이면 잘린 거예요. 반환값을 버리면 잘린 문자열을 멀쩡한 것으로 착각하게 됩니다.",
    },
  ],
},
];
