/* C 실습 3차 — 실습이 하나도 없던 6개 유닛을 더 연다.
   구조체와 정렬 · 전처리기 함정 · 정수 승격과 함수 포인터 · 다차원 배열 ·
   링크드 리스트 · const 한정자.

   실패가 정의되지 않은 동작(UB)에 기대면 안 된다. 범위 밖을 읽어야만 드러나는
   버그는 어떤 기계에서 우연히 통과하고, 그건 배우는 사람에게 거짓말을 하는 것이다.
   여기 있는 시작 코드의 버그는 전부 '읽어도 안전한데 값이 틀린' 것이다.

   테스트는 러너가 sol.c 와 test.c 를 함께 컴파일해 실행하고 종료 코드로 판정한다. */
module.exports = [
/* ── 구조체·공용체와 메모리 정렬 심화 ─────────────────────── */
{
  unit: "구조체·공용체와 메모리 정렬 심화",
  lesson: "직접 짜 보기 — 빈칸이 생기는 자리",
  th: {
    sum: "구조체의 크기는 필드 크기를 더한 값이 **아니다.** 자리를 맞추느라 빈칸이 들어간다.",
    body: [
      { h: "왜 자리를 맞추나", t: "CPU 는 정해진 크기 단위로 메모리를 읽는다. 값이 그 경계에 걸쳐 있으면 두 번 읽어 붙여야 해서 느려진다. 그래서 컴파일러가 알아서 빈칸을 넣어 자리를 맞춘다." },
      { h: "순서만 바꿔도 작아진다", t: "큰 것부터 작은 것 순으로 늘어놓으면 빈칸이 줄어든다. 같은 필드인데 순서만 바꿔 크기가 줄기도 한다. 구조체를 수백만 개 담는다면 이 차이가 그대로 메모리 사용량이 된다." },
      { h: "공용체는 자리를 나눠 쓴다", t: "`union` 은 여러 필드가 **같은 자리**를 쓴다. 크기는 가장 큰 필드만큼이고, 하나를 쓰면 나머지는 뜻을 잃는다. 지금 무엇이 들어 있는지는 따로 적어 둬야 한다." },
      { h: "파일이나 통신에 그대로 쓰지 않는다", t: "빈칸의 크기와 위치는 컴파일러와 기계에 따라 다르다. 구조체를 통째로 파일에 쓰거나 네트워크로 보내면 다른 환경에서 읽을 때 어긋난다. 필드를 하나씩 정해진 형식으로 적어야 한다." },
    ],
    code: { c: "struct A { char c; int n; char d; };   // 빈칸이 있다\nstruct B { int n; char c; char d; };   // 순서만 바꿨다\n\nunion U { int n; char b[4]; };          // 같은 자리를 나눠 쓴다", cap: "큰 것부터 늘어놓는다" },
    key: ["크기는 더한 값이 아니다", "순서만 바꿔도 작아진다", "공용체는 자리를 나눠 쓴다"],
  },
  q: [
    {
      k: "pack_order · 순서를 바꿔 작게 만들기",
      qq: "같은 필드로 <b>더 작은</b> 구조체를 만드세요. <code>Small</code> 의 크기가 <code>Big</code> 보다 <b>작아야</b> 합니다.",
      src: "#include <stddef.h>\n\ntypedef struct { char a; int n; char b; } Big;\ntypedef struct { char a; int n; char b; } Small;\n\nsize_t big_size(void) { return sizeof(Big); }\nsize_t small_size(void) { return sizeof(Small); }\n",
      sol: "#include <stddef.h>\n\ntypedef struct { char a; int n; char b; } Big;\ntypedef struct { int n; char a; char b; } Small;\n\nsize_t big_size(void) { return sizeof(Big); }\nsize_t small_size(void) { return sizeof(Small); }\n",
      test: { "test.c": "#include <stdio.h>\n#include <stddef.h>\n\nsize_t big_size(void);\nsize_t small_size(void);\n\nstatic int fails = 0;\n\nint main(void) {\n    if (small_size() >= big_size()) {\n        printf(\"작은 쪽이 더 작아야 한다: small %zu, big %zu\\n\", small_size(), big_size());\n        fails++;\n    }\n    if (small_size() < 6) {\n        printf(\"필드를 빠뜨린 것 같다: %zu\\n\", small_size());\n        fails++;\n    }\n    return fails ? 1 : 0;\n}\n" },
      ex: "char, int, char 순서면 int 를 4의 배수 자리에 놓으려고 앞에 빈칸 3개가 들어가고, 뒤에도 자리를 맞추느라 빈칸이 붙습니다. 큰 것부터 늘어놓으면 그 빈칸이 줄어들어요.",
    },
    {
      k: "union_size · 자리를 나눠 쓰면",
      qq: "<code>int</code> 하나와 <code>char</code> 네 개가 <b>같은 자리</b>를 쓰게 만들고, 그 크기를 돌려주세요.",
      src: "#include <stddef.h>\n\ntypedef struct { int n; char b[4]; } Val;\n\nsize_t val_size(void) { return sizeof(Val); }\nint first_byte(int n) { Val v; v.n = n; return v.b[0]; }\n",
      sol: "#include <stddef.h>\n\ntypedef union { int n; char b[4]; } Val;\n\nsize_t val_size(void) { return sizeof(Val); }\nint first_byte(int n) { Val v; v.n = n; return v.b[0]; }\n",
      test: { "test.c": "#include <stdio.h>\n#include <stddef.h>\n\nsize_t val_size(void);\nint first_byte(int n);\n\nstatic int fails = 0;\n\nint main(void) {\n    if (val_size() != sizeof(int)) {\n        printf(\"같은 자리를 나눠 쓰면 int 크기여야 한다: %zu\\n\", val_size());\n        fails++;\n    }\n    if (first_byte(0) != 0) {\n        printf(\"0 의 첫 바이트는 0 이어야 한다: %d\\n\", first_byte(0));\n        fails++;\n    }\n    return fails ? 1 : 0;\n}\n" },
      ex: "struct 는 필드마다 자리를 따로 잡아 크기가 두 배가 됩니다. union 은 같은 자리를 나눠 써서 가장 큰 필드만큼만 차지해요 — 대신 하나를 쓰면 나머지는 뜻을 잃습니다.",
    },
    {
      k: "field_offset · 빈칸이 어디에 들어갔나",
      qq: "구조체에서 <code>n</code> 필드가 <b>시작하는 위치</b>를 돌려주세요. <code>offsetof</code> 를 씁니다.",
      src: "#include <stddef.h>\n\ntypedef struct { char a; int n; } S;\n\nsize_t n_offset(void) { return sizeof(char); }\n",
      sol: "#include <stddef.h>\n\ntypedef struct { char a; int n; } S;\n\nsize_t n_offset(void) { return offsetof(S, n); }\n",
      test: { "test.c": "#include <stdio.h>\n#include <stddef.h>\n\ntypedef struct { char a; int n; } S;\nsize_t n_offset(void);\n\nstatic int fails = 0;\n\nint main(void) {\n    if (n_offset() != offsetof(S, n)) {\n        printf(\"실제 위치와 달라야 한다: got %zu, want %zu\\n\", n_offset(), offsetof(S, n));\n        fails++;\n    }\n    return fails ? 1 : 0;\n}\n" },
      ex: "필드 크기를 더해 위치를 짐작하면 빈칸을 빼먹습니다. char 하나 뒤에 int 가 오면 실제 위치는 1이 아니라 4예요. offsetof 는 컴파일러가 정한 진짜 위치를 알려 줍니다.",
    },
  ],
},
/* ── 파일 입출력과 전처리기 중급 ──────────────────────────── */
{
  unit: "파일 입출력과 전처리기 중급: 버퍼링과 매크로 함정",
  lesson: "직접 짜 보기 — 매크로는 글자를 바꿔 넣을 뿐",
  th: {
    sum: "매크로는 함수가 아니라 **글자를 그대로 바꿔 넣는 것**이다. 그래서 괄호를 빠뜨리면 뜻이 달라진다.",
    body: [
      { h: "괄호를 빠뜨리면 순서가 어긋난다", t: "`#define SQ(x) x * x` 에 `SQ(1 + 2)` 를 넣으면 `1 + 2 * 1 + 2` 가 되어 5가 나온다. 인자마다, 그리고 전체에 괄호를 씌워야 한다 — `((x) * (x))` 다." },
      { h: "인자를 두 번 쓰면 두 번 실행된다", t: "`#define MAX(a,b) ((a) > (b) ? (a) : (b))` 에 `MAX(i++, 3)` 을 넣으면 `i++` 이 두 번 나온다. 함수라면 한 번만 계산될 값이 두 번 늘어난다." },
      { h: "여러 문장은 한 덩어리로 묶는다", t: "매크로가 문장 두 개를 펼치면 `if` 뒤에 붙였을 때 두 번째 문장이 조건 밖으로 새어 나간다. `do { ... } while (0)` 으로 감싸면 한 문장처럼 쓰인다." },
      { h: "인라인 함수를 먼저 생각한다", t: "요즘 컴파일러에서는 짧은 함수도 충분히 빠르다. 타입 검사도 되고 인자도 한 번만 계산되므로, 매크로는 정말 필요할 때만 쓴다." },
    ],
    code: { c: "#define SQ(x) ((x) * (x))\n\n#define SWAP(a, b) do { int t = (a); (a) = (b); (b) = t; } while (0)", cap: "괄호를 빠뜨리면 뜻이 달라진다" },
    key: ["매크로는 글자를 바꿔 넣는다", "인자와 전체에 괄호를", "여러 문장은 `do{}while(0)`"],
  },
  q: [
    {
      k: "SQ · 괄호를 빠뜨리지 않기",
      qq: "제곱을 구하는 매크로를 고치세요. <code>SQ(1 + 2)</code> 가 <b>9</b>가 되어야 합니다.",
      src: "#define SQ(x) x * x\n\nint sq_of(int a, int b) { return SQ(a + b); }\nint sq_one(int a) { return SQ(a); }\n",
      sol: "#define SQ(x) ((x) * (x))\n\nint sq_of(int a, int b) { return SQ(a + b); }\nint sq_one(int a) { return SQ(a); }\n",
      test: { "test.c": "#include <stdio.h>\n\nint sq_of(int a, int b);\nint sq_one(int a);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(sq_of(1, 2), 9, \"(1+2) 의 제곱은 9\");\n    eq(sq_one(3), 9, \"3 의 제곱은 9\");\n    eq(sq_of(2, 3), 25, \"(2+3) 의 제곱은 25\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "괄호가 없으면 SQ(a + b) 가 a + b * a + b 로 펼쳐집니다. 곱셈이 먼저라 뜻이 완전히 달라져요. 인자마다 괄호를 씌우고 전체에도 한 번 더 씌웁니다.",
    },
    {
      k: "SWAP · 한 문장처럼 쓰이게",
      qq: "두 값을 바꾸는 매크로를 만드세요. <code>if</code> 뒤에 <b>중괄호 없이 붙여도</b> 조건대로 동작해야 합니다.",
      src: "#define SWAP(a, b) int t = (a); (a) = (b); (b) = t;\n\nvoid maybe_swap(int *x, int *y, int cond) {\n    if (cond) SWAP(*x, *y);\n}\n",
      sol: "#define SWAP(a, b) do { int t = (a); (a) = (b); (b) = t; } while (0)\n\nvoid maybe_swap(int *x, int *y, int cond) {\n    if (cond) SWAP(*x, *y);\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nvoid maybe_swap(int *x, int *y, int cond);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int a = 1, b = 2;\n    maybe_swap(&a, &b, 1);\n    eq(a, 2, \"조건이 참이면 바뀐다\");\n    eq(b, 1, \"조건이 참이면 바뀐다(뒤)\");\n    int c = 1, d = 2;\n    maybe_swap(&c, &d, 0);\n    eq(c, 1, \"조건이 거짓이면 그대로\");\n    eq(d, 2, \"조건이 거짓이면 그대로(뒤)\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "문장 세 개가 그대로 펼쳐지면 if 는 첫 문장만 조건으로 삼고 나머지는 늘 실행됩니다. 조건이 거짓인데도 값이 바뀌어요. do{}while(0) 으로 감싸면 한 문장처럼 쓰입니다.",
    },
    {
      k: "line_count · 줄을 세다 마지막을 빠뜨리지 않기",
      qq: "글자에서 <b>줄 수</b>를 세세요. 마지막 줄이 개행으로 <b>끝나지 않아도</b> 한 줄로 셉니다.",
      src: "int line_count(const char *s) {\n    int n = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == '\\n') n++;\n    }\n    return n;\n}\n",
      sol: "int line_count(const char *s) {\n    if (!s[0]) return 0;\n    int n = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == '\\n' && s[i + 1]) n++;\n    }\n    return n + 1;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint line_count(const char *s);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(line_count(\"a\\nb\\n\"), 2, \"개행으로 끝나는 두 줄\");\n    eq(line_count(\"a\\nb\"), 2, \"개행 없이 끝나도 두 줄\");\n    eq(line_count(\"a\"), 1, \"한 줄\");\n    eq(line_count(\"\"), 0, \"빈 글자\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "개행만 세면 마지막 줄이 개행으로 안 끝날 때 한 줄을 빠뜨립니다. 파일 마지막 줄에 개행이 없는 경우가 흔해서, 이 한 줄 차이로 계산이 어긋나요.",
    },
  ],
},
/* ── 다차원 배열과 포인터 배열 (심화) ─────────────────────── */
{
  unit: "다차원 배열과 포인터 배열 (심화)",
  lesson: "직접 짜 보기 — 표를 한 줄로 펴서 다루기",
  th: {
    sum: "C 의 2차원 배열은 사실 **한 줄로 이어진 메모리**다. 줄과 칸은 계산으로 찾는다.",
    body: [
      { h: "자리를 계산으로 찾는다", t: "`cols` 칸짜리 표에서 `r`줄 `c`칸의 자리는 `r * cols + c` 다. 이 식 하나만 알면 1차원 배열로 어떤 크기의 표든 다룰 수 있다." },
      { h: "이어져 있으면 훑기가 빠르다", t: "줄 순서대로 읽으면 메모리를 앞에서부터 차례로 읽게 되어 캐시가 잘 맞는다. 칸 순서로 훑으면 계속 건너뛰어 훨씬 느리다 — 같은 값을 세는데 몇 배 차이가 난다." },
      { h: "포인터 배열은 다른 것이다", t: "`char *names[]` 는 각각 다른 곳을 가리키는 포인터들의 배열이다. 줄마다 길이가 달라도 되지만, 메모리가 이어져 있지 않아 훑기는 느리다." },
      { h: "칸 수를 함께 넘긴다", t: "1차원으로 받으면 함수는 표가 몇 칸짜리인지 알 수 없다. 포인터와 칸 수를 한 쌍으로 넘기는 것이 관례다 — 안 넘기면 자리 계산 자체를 할 수 없다." },
    ],
    code: { c: "// r줄 c칸의 자리\nm[r * cols + c]\n\n// 줄 순서로 훑는다 (캐시가 맞는다)\nfor (r) for (c) sum += m[r * cols + c];", cap: "자리는 계산으로 찾는다" },
    key: ["`r * cols + c` 로 찾는다", "줄 순서로 훑으면 빠르다", "칸 수를 함께 넘긴다"],
  },
  q: [
    {
      k: "at · 줄과 칸으로 값 찾기",
      qq: "<code>cols</code>칸짜리 표에서 <code>r</code>줄 <code>c</code>칸의 값을 돌려주세요.",
      src: "int at(const int *m, int cols, int r, int c) {\n    return m[r + c * cols];\n}\n",
      sol: "int at(const int *m, int cols, int r, int c) {\n    return m[r * cols + c];\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint at(const int *m, int cols, int r, int c);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int m[] = {1, 2, 3,\n               4, 5, 6};\n    eq(at(m, 3, 0, 0), 1, \"첫 줄 첫 칸\");\n    eq(at(m, 3, 1, 0), 4, \"둘째 줄 첫 칸\");\n    eq(at(m, 3, 1, 2), 6, \"둘째 줄 셋째 칸\");\n    eq(at(m, 3, 0, 2), 3, \"첫 줄 셋째 칸\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "줄과 칸을 바꿔 쓰면 표를 옆으로 눕혀 읽는 셈이 됩니다. 정사각형 표에서는 값이 그럴듯하게 나와서 더 늦게 발견돼요 — 줄이 먼저, 칸이 나중입니다.",
    },
    {
      k: "row_max · 줄마다 가장 큰 값",
      qq: "표에서 <b>줄마다</b> 가장 큰 값을 <code>out</code> 에 담아 주세요. 줄 수는 <code>rows</code>, 칸 수는 <code>cols</code> 입니다.",
      src: "void row_max(const int *m, int rows, int cols, int *out) {\n    for (int r = 0; r < rows; r++) {\n        int best = 0;\n        for (int c = 0; c < cols; c++) {\n            if (m[r * cols + c] > best) best = m[r * cols + c];\n        }\n        out[r] = best;\n    }\n}\n",
      sol: "void row_max(const int *m, int rows, int cols, int *out) {\n    for (int r = 0; r < rows; r++) {\n        int best = m[r * cols];\n        for (int c = 1; c < cols; c++) {\n            if (m[r * cols + c] > best) best = m[r * cols + c];\n        }\n        out[r] = best;\n    }\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nvoid row_max(const int *m, int rows, int cols, int *out);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int m[] = {1, 2, 3,\n               -5, -2, -9};\n    int out[2] = {0, 0};\n    row_max(m, 2, 3, out);\n    eq(out[0], 3, \"첫 줄 최댓값\");\n    eq(out[1], -2, \"음수만 있는 줄의 최댓값\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "0에서 시작하면 값이 전부 음수인 줄에서 있지도 않은 0이 최댓값이 됩니다. 첫 칸의 값으로 시작해야 그 줄에 실제로 있는 값 중에서 고르게 돼요.",
    },
    {
      k: "col_sum · 칸 하나를 세로로 더하기",
      qq: "표에서 <code>c</code>번째 <b>칸</b>의 값을 세로로 모두 더해 주세요.",
      src: "int col_sum(const int *m, int rows, int cols, int c) {\n    int s = 0;\n    for (int r = 0; r < rows; r++) s += m[c * cols + r];\n    return s;\n}\n",
      sol: "int col_sum(const int *m, int rows, int cols, int c) {\n    int s = 0;\n    for (int r = 0; r < rows; r++) s += m[r * cols + c];\n    return s;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint col_sum(const int *m, int rows, int cols, int c);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int m[] = {1, 2, 3,\n               4, 5, 6};\n    eq(col_sum(m, 2, 3, 0), 5, \"첫 칸 1+4\");\n    eq(col_sum(m, 2, 3, 2), 9, \"셋째 칸 3+6\");\n    eq(col_sum(m, 2, 3, 1), 7, \"둘째 칸 2+5\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "칸을 세로로 더할 때도 자리 계산은 같습니다 — 줄이 바뀌고 칸은 고정이에요. 두 값을 바꿔 쓰면 엉뚱한 자리를 더하고, 표가 정사각형이면 그럴듯한 값이 나와 더 늦게 걸립니다.",
    },
  ],
},
/* ── 링크드 리스트와 트리 직접 구현 (심화) ────────────────── */
{
  unit: "링크드 리스트와 트리 직접 구현 (심화)",
  lesson: "직접 짜 보기 — 이어 붙인 자료 다루기",
  th: {
    sum: "링크드 리스트는 **다음 자리를 가리키는 사슬**이다. 자리를 옮기지 않아도 넣고 뺄 수 있다.",
    body: [
      { h: "가운데에 넣고 빼기가 싸다", t: "배열은 가운데에 넣으려면 뒤를 전부 밀어야 한다. 사슬은 가리키는 화살표 두 개만 고치면 된다. 대신 n번째 값을 보려면 앞에서부터 따라가야 해서 조회는 느리다." },
      { h: "끝을 알아보는 방법이 있어야 한다", t: "마지막 노드의 다음은 `NULL` 이다. 이 표시가 없으면 어디서 멈춰야 할지 알 수 없다. 반복문의 조건은 언제나 '지금 노드가 NULL 이 아닌 동안' 이다." },
      { h: "머리를 바꾸려면 포인터의 포인터", t: "맨 앞에 넣거나 맨 앞을 지우면 머리 자체가 바뀐다. 함수 안에서 머리를 바꾸려면 머리를 가리키는 포인터를 받아야 한다 — 값으로 받으면 부른 쪽 머리는 그대로다." },
      { h: "트리는 갈래가 둘인 사슬", t: "노드마다 왼쪽·오른쪽을 가리키면 트리가 된다. 세는 것도 찾는 것도 '자기 자신 + 왼쪽 + 오른쪽' 으로 나눠 생각하면 짧게 끝난다." },
    ],
    code: { c: "typedef struct Node { int v; struct Node *next; } Node;\n\nfor (Node *p = head; p; p = p->next) ...   // NULL 까지", cap: "사슬을 따라가며 끝을 본다" },
    key: ["가운데 넣고 빼기가 싸다", "끝은 `NULL` 로 안다", "머리를 바꾸려면 포인터의 포인터"],
  },
  q: [
    {
      k: "list_len · 끝까지 세기",
      qq: "사슬의 <b>노드 개수</b>를 세세요. 빈 사슬은 0입니다.",
      src: "typedef struct Node { int v; struct Node *next; } Node;\n\nint list_len(const Node *head) {\n    int n = 0;\n    for (const Node *p = head; p->next; p = p->next) n++;\n    return n;\n}\n",
      sol: "typedef struct Node { int v; struct Node *next; } Node;\n\nint list_len(const Node *head) {\n    int n = 0;\n    for (const Node *p = head; p; p = p->next) n++;\n    return n;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\ntypedef struct Node { int v; struct Node *next; } Node;\nint list_len(const Node *head);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    Node c = {3, 0}, b = {2, &c}, a = {1, &b};\n    eq(list_len(&a), 3, \"세 개\");\n    eq(list_len(&c), 1, \"하나\");\n    eq(list_len(0), 0, \"빈 사슬\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "조건을 p->next 로 두면 마지막 노드를 세지 않아 언제나 하나가 모자랍니다. 게다가 빈 사슬이면 NULL 의 next 를 읽으려다 죽어요 — 조건은 '지금 노드가 있는 동안' 입니다.",
    },
    {
      k: "push_front · 맨 앞에 넣기",
      qq: "사슬 <b>맨 앞</b>에 노드를 넣으세요. 부른 쪽의 <b>머리도 바뀌어야</b> 합니다.",
      src: "typedef struct Node { int v; struct Node *next; } Node;\n\nvoid push_front(Node **head, Node *n) {\n    n->next = *head;\n}\n",
      sol: "typedef struct Node { int v; struct Node *next; } Node;\n\nvoid push_front(Node **head, Node *n) {\n    n->next = *head;\n    *head = n;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\ntypedef struct Node { int v; struct Node *next; } Node;\nvoid push_front(Node **head, Node *n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    Node b = {2, 0};\n    Node *head = &b;\n    Node a = {1, 0};\n    push_front(&head, &a);\n    eq(head->v, 1, \"머리가 새 노드여야 한다\");\n    eq(head->next->v, 2, \"그 뒤에 원래 머리\");\n    Node *empty = 0;\n    Node c = {9, 0};\n    push_front(&empty, &c);\n    eq(empty->v, 9, \"빈 사슬에 넣기\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "새 노드가 옛 머리를 가리키게만 하고 머리 자체를 안 바꾸면, 부른 쪽은 여전히 옛 머리를 봅니다. 넣은 노드가 사슬에 안 들어간 것과 같아요 — 머리를 바꾸려면 그 자리를 직접 고쳐야 합니다.",
    },
    {
      k: "tree_depth · 가장 깊은 곳까지",
      qq: "트리의 <b>깊이</b>를 돌려주세요. 빈 트리는 0, 노드 하나면 1입니다.",
      src: "typedef struct Node { int v; struct Node *l, *r; } Node;\n\nint tree_depth(const Node *n) {\n    if (n == 0) return 0;\n    return 1 + tree_depth(n->l);\n}\n",
      sol: "typedef struct Node { int v; struct Node *l, *r; } Node;\n\nint tree_depth(const Node *n) {\n    if (n == 0) return 0;\n    int a = tree_depth(n->l);\n    int b = tree_depth(n->r);\n    return 1 + (a > b ? a : b);\n}\n",
      test: { "test.c": "#include <stdio.h>\n\ntypedef struct Node { int v; struct Node *l, *r; } Node;\nint tree_depth(const Node *n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    Node d = {4, 0, 0}, c = {3, &d, 0};\n    Node b = {2, 0, 0};\n    Node root = {1, &b, &c};\n    eq(tree_depth(&root), 3, \"오른쪽이 더 깊다\");\n    eq(tree_depth(&b), 1, \"잎 하나\");\n    eq(tree_depth(0), 0, \"빈 트리\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "왼쪽만 세면 오른쪽이 더 깊을 때 답이 작아집니다. 깊이는 '더 깊은 쪽' 이니 양쪽을 다 재고 큰 쪽을 골라야 해요 — 한쪽만 보는 재귀는 트리에서 가장 흔한 실수입니다.",
    },
  ],
},
/* ── 헤더와 분할 컴파일·링크 (중급) ───────────────────────── */
{
  unit: "헤더와 분할 컴파일·링크 (중급)",
  lesson: "직접 짜 보기 — 어디까지 보이게 할 것인가",
  th: {
    sum: "C 는 파일마다 따로 번역한다. 그래서 **무엇을 밖에 보일지**를 직접 정해야 한다.",
    body: [
      { h: "선언과 정의는 다르다", t: "선언은 '이런 이름이 있다' 이고 정의는 '몸통은 이것이다' 이다. 다른 파일에서 쓰려면 선언만 보이면 되고, 몸통은 프로그램 전체에서 하나여야 한다." },
      { h: "static 은 이 파일 안에서만", t: "함수나 전역 변수에 `static` 을 붙이면 그 파일 밖에서는 보이지 않는다. 이름이 겹칠 걱정이 없어지고, 밖에서 함부로 쓰는 것도 막힌다 — 안 붙이면 전부 공개다." },
      { h: "헤더에 몸통을 두면 둘이 된다", t: "`#include` 는 내용을 그대로 붙여 넣는 것이다. 헤더에 함수 몸통을 적으면 그것을 가져간 파일마다 몸통이 생겨 링크가 거부한다. 헤더에는 선언만 둔다." },
      { h: "두 번 들어오는 것을 막는다", t: "같은 헤더가 두 번 포함되면 정의가 두 번 생겨 오류가 난다. `#pragma once` 나 매크로 가드를 맨 위에 두면 한 번만 들어온다." },
    ],
    code: { c: "// 헤더: 선언만\nint add(int a, int b);\n\n// 구현 파일: 몸통\nint add(int a, int b) { return a + b; }\nstatic int helper(void) { ... }   // 이 파일 안에서만", cap: "선언은 헤더, 몸통은 한 곳" },
    key: ["선언과 정의는 다르다", "`static` 은 이 파일 안에서만", "헤더에는 선언만"],
  },
  q: [
    {
      k: "static · 밖에 안 보이게 감추기",
      qq: "도우미 함수 <code>helper</code> 를 <b>이 파일 안에서만</b> 보이게 하고, <code>compute</code> 만 밖에 열어 주세요.",
      src: "int helper(int x) { return x * 2; }\n\nint compute(int x) { return helper(x) + 1; }\n",
      sol: "static int helper(int x) { return x * 2; }\n\nint compute(int x) { return helper(x) + 1; }\n",
      test: { "test.c": "/* helper 가 밖에 보이면 여기서 같은 이름을 정의할 때 링크가 거부한다.\n   감춰져 있으면 서로 다른 것으로 취급되어 둘 다 존재할 수 있다. */\n#include <stdio.h>\n\nint compute(int x);\nint helper(int x) { return 999; }\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(compute(3), 7, \"compute 는 자기 helper 를 쓴다\");\n    eq(helper(1), 999, \"여기 helper 는 내 것\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "static 을 안 붙이면 그 이름이 프로그램 전체에 공개됩니다. 다른 파일에 같은 이름이 있으면 링크가 거부해요. 밖에서 쓸 것만 열어 두는 것이 기본입니다.",
    },
    {
      k: "counter · 값을 파일 안에 가둬 두기",
      qq: "부를 때마다 1씩 올라가는 번호를 돌려주세요. 그 값은 <b>함수 밖에서 못 건드리게</b> 감춥니다.",
      src: "int count = 0;\n\nint next_id(void) { return ++count; }\n",
      sol: "static int count = 0;\n\nint next_id(void) { return ++count; }\n",
      test: { "test.c": "/* count 가 공개돼 있으면 여기서 같은 이름을 정의할 때 링크가 거부한다. */\n#include <stdio.h>\n\nint next_id(void);\nint count = 12345;\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(next_id(), 1, \"처음은 1\");\n    eq(next_id(), 2, \"그다음은 2\");\n    eq(count, 12345, \"여기 count 는 내 것\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "전역 변수를 공개해 두면 어느 파일에서든 값을 바꿀 수 있습니다. 번호가 갑자기 뛰어도 어디서 바꿨는지 찾을 수가 없어요. static 으로 가두면 이 파일만 의심하면 됩니다.",
    },
    {
      k: "double_limit · 몸통은 한 곳, 나머지는 extern",
      qq: "<code>limit</code> 은 <b>다른 파일(helper.c)에 이미 있습니다</b>. 여기서 새로 만들지 말고 그것을 가져다 두 배를 돌려주세요.",
      src: "int limit = 5;\n\nint double_limit(void) { return limit * 2; }\n",
      sol: "extern int limit;\n\nint double_limit(void) { return limit * 2; }\n",
      test: {
        "helper.c": "/* limit 의 몸통은 여기 하나뿐이다. sol.c 가 또 만들면 링크가 거부한다. */\nint limit = 5;\n",
        "test.c": "/* 값을 바꾼 뒤에도 따라오면 같은 변수를 본 것이고,\n   따라오지 않으면 자기 사본을 따로 갖고 있는 것이다. */\n#include <stdio.h>\n\nextern int limit;\nint double_limit(void);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(double_limit(), 10, \"처음 값은 5\");\n    limit = 11;\n    eq(double_limit(), 22, \"바뀐 값을 따라와야 한다\");\n    return fails ? 1 : 0;\n}\n",
      },
      ex: "`int limit = 5;` 는 선언이 아니라 몸통을 만드는 정의입니다. 파일마다 이렇게 적으면 몸통이 여러 개가 되어 링크가 거부해요. 쓰기만 할 때는 `extern` 으로 '어딘가에 있다' 고만 알려 줍니다.",
    },
  ],
},
/* ── C 심화 — const·volatile·restrict 한정자 ──────────────── */
{
  unit: "C 심화 — const·volatile·restrict 한정자",
  lesson: "직접 짜 보기 — 못 바꾸게 하고, 다르다고 알려 주기",
  th: {
    sum: "한정자는 컴파일러에게 **약속을 알려 주는 말**이다. 지키면 사고를 막아 주고 최적화도 돕는다.",
    body: [
      { h: "const 는 '나는 안 바꾼다' 는 약속", t: "매개변수를 `const int *` 로 받으면 그 함수가 값을 고치지 않는다는 뜻이다. 부르는 쪽이 안심할 수 있고, 실수로 고치는 코드는 컴파일에서 막힌다." },
      { h: "붙는 자리에 따라 뜻이 다르다", t: "`const int *p` 는 가리키는 값을 못 바꾸고, `int * const p` 는 가리키는 자리를 못 바꾼다. 별표를 기준으로 왼쪽이면 값, 오른쪽이면 포인터다." },
      { h: "volatile 은 '캐시하지 마라'", t: "값이 프로그램 밖에서 바뀔 수 있다고 알려 준다. 컴파일러가 '어차피 안 바뀌니' 하고 읽기를 생략하지 못하게 막는다. 하드웨어 레지스터나 신호 처리기가 건드리는 변수에 쓴다." },
      { h: "restrict 는 '겹치지 않는다' 는 약속", t: "두 포인터가 같은 자리를 가리키지 않는다고 약속하면 컴파일러가 더 과감히 줄인다. 약속을 어기면 결과가 어긋나므로, 겹칠 수 있으면 붙이지 않는다." },
    ],
    code: { c: "int sum(const int *xs, int n);      // 안 바꾼다\nint * const p = &x;                 // 자리를 안 바꾼다\nvolatile int flag;                  // 밖에서 바뀔 수 있다", cap: "약속을 말로 적어 둔다" },
    key: ["`const` 는 안 바꾼다는 약속", "별표 왼쪽이면 값, 오른쪽이면 자리", "`volatile` 은 읽기를 생략하지 마라"],
  },
  q: [
    {
      k: "sum_const · 안 바꾼다고 약속하기",
      qq: "<code>api.h</code> 가 <b>이미 약속해 둔 모양</b>이 있습니다. 그 모양 그대로 몸통을 채워 합을 돌려주세요.",
      src: "#include \"api.h\"\n\nint sum_const(int *xs, int n) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += xs[i];\n    return s;\n}\n",
      sol: "#include \"api.h\"\n\nlong sum_const(const int *xs, int n) {\n    long s = 0;\n    for (int i = 0; i < n; i++) s += xs[i];\n    return s;\n}\n",
      test: {
        "api.h": "#ifndef API_H\n#define API_H\n/* 이 줄이 약속이다. sol.c 의 몸통은 여기 적힌 모양과 정확히 같아야 하고,\n   다르면 컴파일러가 '선언과 어긋난다' 며 거부한다. */\nlong sum_const(const int *xs, int n);\n#endif\n",
        "test.c": "/* 헤더만 보고 부른다. 몸통이 어디 있는지는 알 필요가 없다. */\n#include <stdio.h>\n#include \"api.h\"\n\nstatic int fails = 0;\nstatic void eq(long got, long want, const char *what) {\n    if (got != want) { printf(\"%s: got %ld, want %ld\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    const int a[] = {1, 2, 3};\n    eq(sum_const(a, 3), 6L, \"읽기 전용 배열도 넘길 수 있어야 한다\");\n    int big[] = {2000000000, 2000000000, 7};\n    eq(sum_const(big, 3), 4000000007L, \"int 로 담으면 넘치는 크기\");\n    eq(sum_const(a, 0), 0L, \"개수가 0\");\n    return fails ? 1 : 0;\n}\n",
      },
      ex: "헤더는 남들과 맺은 계약입니다. `const int *` 로 약속했으면 몸통도 `const int *` 여야 하고, 돌려주는 타입까지 같아야 해요. 어긋나면 컴파일러가 그 자리에서 막아 줍니다 — 그러라고 헤더를 두는 겁니다.",
    },
    {
      k: "set_via · 자리를 고정하고 값만 바꾸기",
      qq: "포인터가 <b>가리키는 자리는 못 바꾸고</b> 값만 바꾸도록 선언하세요. 함수는 그 자리에 <code>v</code> 를 넣습니다.",
      src: "void set_via(int *p, int v) {\n    int other = 0;\n    p = &other;\n    *p = v;\n}\n",
      sol: "void set_via(int *p, int v) {\n    int *const q = p;\n    *q = v;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nvoid set_via(int *p, int v);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int x = 1;\n    set_via(&x, 9);\n    eq(x, 9, \"넘긴 자리에 값이 들어가야 한다\");\n    int y = 0;\n    set_via(&y, -3);\n    eq(y, -3, \"음수도\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "포인터를 다른 곳으로 옮겨 놓고 값을 넣으면, 넘겨받은 자리는 그대로입니다. 부른 쪽에서는 아무 일도 안 일어난 것처럼 보여요. 자리를 고정해 두면 그런 실수가 컴파일에서 막힙니다.",
    },
    {
      k: "wait_flag · 읽기를 생략하지 못하게",
      qq: "밖에서 바뀔 수 있는 깃발을 읽어 <b>그 값을 그대로</b> 돌려주세요. 컴파일러가 읽기를 생략하지 못하게 선언합니다.",
      src: "int read_flag(int *flag) {\n    return 0;\n}\n",
      sol: "int read_flag(volatile int *flag) {\n    return *flag;\n}\n",
      test: { "test.c": "/* volatile 로 받지 않으면 volatile 변수의 주소를 넘길 수 없어 컴파일이 거부한다. */\n#include <stdio.h>\n\nint read_flag(volatile int *flag);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    volatile int f = 7;\n    eq(read_flag(&f), 7, \"지금 값을 읽어야 한다\");\n    f = 0;\n    eq(read_flag(&f), 0, \"바뀐 값도 읽어야 한다\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "값을 안 읽고 0을 돌려주면 깃발이 무엇이든 늘 같은 답이 나옵니다. 그리고 volatile 로 받지 않으면 밖에서 바뀌는 변수의 주소를 아예 넘길 수 없어요 — 약속이 서명에도 드러나야 합니다.",
    },
  ],
},
];
