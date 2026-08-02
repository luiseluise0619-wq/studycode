/* C 핵심 유닛 실습.
   C 는 640문항에 실습 61개(9.5%)이고, 그 61개는 전부 exercism 임포트 유닛에 있다.
   배우는 유닛 31개는 하나도 없다 — Go·Java 와 같은 모양이다.

   테스트는 Unity 같은 프레임워크를 들고 오지 않는다. 러너가 sol.c 와 test.c 를 함께
   컴파일해 실행하고 종료 코드로 판정하므로, main() 에서 틀리면 1 을 돌려주면 된다.
   문항마다 프레임워크 파일을 싣지 않아 데이터도 가볍다.

   중요: 실패가 '정의되지 않은 동작(UB)' 에 기대면 안 된다. 버퍼 밖에 쓰거나
   해제한 메모리를 읽는 식으로 틀리게 만들면, 어떤 기계에서는 우연히 통과한다.
   그래서 시작 코드의 버그는 전부 결정적으로 드러나는 것으로 골랐다. */
module.exports = [
{
  unit: "C 언어 첫걸음",
  lesson: "직접 짜 보기 — 나눗셈과 타입",
  th: {
    sum: "C 에서 `int / int` 는 **정수 나눗셈**이다. 소수점은 계산 뒤에 붙는 게 아니라 계산 중에 잘려 나간다.",
    body: [
      { h: "언제 잘리나", t: "`3 / 2` 는 `1` 이다. `double x = 3 / 2;` 라고 써도 `1.0` 이 된다 — 나눗셈이 먼저 끝나고 그 결과를 double 에 담기 때문이다. 소수가 필요하면 **나누기 전에** 한쪽을 double 로 만든다: `(double)a / b`." },
      { h: "형 변환의 자리", t: "`(double)(a / b)` 는 소용없다. 괄호 안에서 이미 잘렸다. 캐스트는 나눗셈 **앞**에 붙어야 한다 — 이 한 글자 자리 차이가 결과를 바꾼다." },
    ],
    code: { c: "int a = 3, b = 2;\ndouble x = a / b;            // 1.0  — 이미 잘렸다\ndouble y = (double)a / b;    // 1.5  — 이게 맞다", cap: "캐스트는 나누기 전에 붙인다" },
    key: ["`int / int` 는 정수 나눗셈", "캐스트는 나눗셈 앞에", "빈 배열은 0으로 나누게 된다"],
  },
  q: [
    {
      k: "average · 평균 구하기",
      qq: "정수 배열의 <b>평균</b>을 <code>double</code> 로 돌려주세요. 개수가 0이면 <code>0.0</code> 입니다.",
      src: "double average(const int *xs, int n) {\n    int sum = 0;\n    for (int i = 0; i < n; i++) sum += xs[i];\n    return sum / n;\n}\n",
      sol: "double average(const int *xs, int n) {\n    if (n <= 0) return 0.0;\n    int sum = 0;\n    for (int i = 0; i < n; i++) sum += xs[i];\n    return (double)sum / n;\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <math.h>\n\ndouble average(const int *xs, int n);\n\nstatic int fails = 0;\nstatic void near(double got, double want, const char *what) {\n    if (fabs(got - want) > 1e-9) { printf(\"%s: got %.6f, want %.6f\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int a[] = {1, 2};\n    near(average(a, 2), 1.5, \"평균 1.5 여야 한다\");\n    int b[] = {1, 2, 3, 4};\n    near(average(b, 4), 2.5, \"평균 2.5 여야 한다\");\n    int c[] = {1, 2, 3};\n    near(average(c, 3), 2.0, \"딱 나뉘는 경우\");\n    near(average(a, 0), 0.0, \"개수가 0이면 0.0\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "sum 과 n 이 둘 다 int 라 나눗셈에서 소수점이 잘립니다. 3/2 가 1 이 되는 것과 같아요. 나누기 전에 (double) 을 붙여야 하고, n 이 0이면 0으로 나눠 터집니다.",
    },
    {
      k: "clamp · 범위 안으로 넣기",
      qq: "값을 <code>lo</code>~<code>hi</code> 범위 안으로 넣어 돌려주세요. 범위를 벗어나면 <b>가까운 끝값</b>입니다.",
      src: "int clamp(int v, int lo, int hi) {\n    if (v < lo) return lo;\n    if (v > hi) return lo;\n    return v;\n}\n",
      sol: "int clamp(int v, int lo, int hi) {\n    if (v < lo) return lo;\n    if (v > hi) return hi;\n    return v;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint clamp(int v, int lo, int hi);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(clamp(1, 5, 10), 5, \"아래로 벗어나면 lo\");\n    eq(clamp(99, 5, 10), 10, \"위로 벗어나면 hi\");\n    eq(clamp(7, 5, 10), 7, \"범위 안이면 그대로\");\n    eq(clamp(5, 5, 10), 5, \"경계 lo\");\n    eq(clamp(10, 5, 10), 10, \"경계 hi\");\n    eq(clamp(-3, -5, -1), -3, \"음수 범위\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "위로 벗어났을 때도 lo 를 돌려주고 있습니다. 복사·붙여넣기로 생기는 전형적인 오타이고, 큰 값이 갑자기 최솟값이 되어 버려요.",
    },
  ],
},
{
  unit: "흐름 제어",
  lesson: "직접 짜 보기 — 경계와 순서",
  th: {
    sum: "`if / else if` 사슬은 **위에서부터 처음 맞는 것 하나만** 실행된다. 그래서 조건의 순서가 결과를 정한다.",
    body: [
      { h: "넓은 조건을 먼저 쓰면", t: "`if (s >= 60) 통과; else if (s >= 90) 최우수;` 는 90점도 '통과' 로 끝난다. 앞에서 이미 걸렸기 때문이다. 좁은 조건(높은 기준)부터 위에 둔다." },
      { h: "= 와 ==", t: "`if (n = 0)` 은 비교가 아니라 대입이다. n 에 0을 넣고 그 값(0)이 거짓이라 블록을 건너뛴다. 컴파일러가 경고를 주지만 경고를 끄면 조용히 지나간다 — C 에서 가장 오래된 함정이다." },
    ],
    code: { c: "if (s >= 90) return 'A';\nelse if (s >= 60) return 'C';   // 좁은 것부터 위에\nelse return 'F';", cap: "높은 기준을 위에 둔다" },
    key: ["`else if` 는 처음 맞는 하나만", "높은 기준을 먼저", "`=` 는 대입, `==` 가 비교"],
  },
  q: [
    {
      k: "grade · 점수를 등급으로",
      qq: "점수를 등급으로 바꾸세요. <b>90 이상 A</b>, <b>80 이상 B</b>, <b>60 이상 C</b>, 나머지는 <b>F</b> 입니다.",
      src: "char grade(int s) {\n    if (s >= 60) return 'C';\n    else if (s >= 80) return 'B';\n    else if (s >= 90) return 'A';\n    return 'F';\n}\n",
      sol: "char grade(int s) {\n    if (s >= 90) return 'A';\n    else if (s >= 80) return 'B';\n    else if (s >= 60) return 'C';\n    return 'F';\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nchar grade(int s);\n\nstatic int fails = 0;\nstatic void eq(char got, char want, int s) {\n    if (got != want) { printf(\"%d점: got %c, want %c\\n\", s, got, want); fails++; }\n}\n\nint main(void) {\n    eq(grade(95), 'A', 95);\n    eq(grade(90), 'A', 90);\n    eq(grade(85), 'B', 85);\n    eq(grade(80), 'B', 80);\n    eq(grade(70), 'C', 70);\n    eq(grade(60), 'C', 60);\n    eq(grade(59), 'F', 59);\n    eq(grade(0), 'F', 0);\n    return fails ? 1 : 0;\n}\n" },
      ex: "60 이상을 맨 위에 두면 95점도 거기서 걸려 'C' 가 됩니다. else if 사슬은 처음 맞는 하나만 실행되니 높은 기준을 위에 둬야 해요.",
    },
    {
      k: "count_even · 짝수 세기",
      qq: "배열에서 <b>짝수의 개수</b>를 세어 돌려주세요. 음수도 짝수일 수 있습니다.",
      src: "int count_even(const int *xs, int n) {\n    int c = 0;\n    for (int i = 0; i <= n; i++) {\n        if (xs[i] % 2 == 0) c++;\n    }\n    return c;\n}\n",
      sol: "int count_even(const int *xs, int n) {\n    int c = 0;\n    for (int i = 0; i < n; i++) {\n        if (xs[i] % 2 == 0) c++;\n    }\n    return c;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint count_even(const int *xs, int n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    /* 배열 뒤에 짝수를 한 칸 더 두었다. 범위를 넘겨 읽으면 개수가 늘어난다. */\n    int buf[5] = {1, 2, 3, 0, 0};\n    eq(count_even(buf, 3), 1, \"앞 3칸에서 짝수는 2 하나\");\n    int a[4] = {2, 4, 6, 8};\n    eq(count_even(a, 4), 4, \"전부 짝수\");\n    int b[3] = {1, 3, 5};\n    eq(count_even(b, 3), 0, \"짝수 없음\");\n    int c[3] = {-2, -3, 0};\n    eq(count_even(c, 3), 2, \"음수와 0\");\n    eq(count_even(a, 0), 0, \"개수 0\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "i <= n 은 마지막에 배열 밖을 한 칸 더 읽습니다. 여기서는 뒤에 0 이 놓여 있어 짝수 하나가 더 세어져요 — 실제로는 무엇이 있을지 알 수 없어 더 위험합니다. i < n 이 맞습니다.",
    },
  ],
},
{
  unit: "함수",
  lesson: "직접 짜 보기 — 값이 아니라 주소를 넘긴다",
  th: {
    sum: "C 는 **값을 복사해서** 넘긴다. 함수 안에서 매개변수를 고쳐도 부른 쪽은 그대로다.",
    body: [
      { h: "바꾸려면 주소를", t: "부른 쪽의 변수를 바꾸려면 그 변수의 **주소**를 넘기고(`&x`), 함수 안에서 `*p` 로 접근한다. `swap(a, b)` 는 아무 일도 안 하고 `swap(&a, &b)` 여야 한다. 컴파일 오류가 아니라 조용히 아무 일도 안 일어난다." },
      { h: "배열은 예외처럼 보인다", t: "배열을 넘기면 첫 원소의 주소가 넘어간다(감쇠). 그래서 함수 안에서 고치면 원본이 바뀐다 — 값 전달 규칙의 예외가 아니라, '주소라는 값' 이 복사된 것이다." },
    ],
    code: { c: "void swap(int *a, int *b) {\n    int t = *a; *a = *b; *b = t;\n}\nswap(&x, &y);   // 주소를 넘긴다", cap: "바꾸려면 주소를 넘긴다" },
    key: ["값은 복사되어 넘어간다", "바꾸려면 주소(`&x`)를 넘긴다", "배열은 주소가 넘어간다"],
  },
  q: [
    {
      k: "swap · 두 값 바꾸기",
      qq: "두 정수의 값을 <b>서로 바꾸는</b> 함수를 완성하세요. 부른 쪽의 변수가 실제로 바뀌어야 합니다.",
      src: "void swap(int *a, int *b) {\n    int t = *a;\n    a = b;\n    b = &t;\n}\n",
      sol: "void swap(int *a, int *b) {\n    int t = *a;\n    *a = *b;\n    *b = t;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nvoid swap(int *a, int *b);\n\nstatic int fails = 0;\n\nint main(void) {\n    int x = 1, y = 2;\n    swap(&x, &y);\n    if (x != 2 || y != 1) { printf(\"1,2 를 바꾸면 2,1 이어야 한다: got %d,%d\\n\", x, y); fails++; }\n    int p = -5, q = 0;\n    swap(&p, &q);\n    if (p != 0 || q != -5) { printf(\"-5,0 을 바꾸면 0,-5: got %d,%d\\n\", p, q); fails++; }\n    int s = 7;\n    swap(&s, &s);\n    if (s != 7) { printf(\"자기 자신끼리 바꾸면 그대로여야 한다: got %d\\n\", s); fails++; }\n    return fails ? 1 : 0;\n}\n" },
      ex: "a = b 는 함수 안의 포인터 변수만 바꿉니다. 가리키는 곳의 값은 그대로예요. 값을 바꾸려면 *a = *b 처럼 별표를 붙여 가리키는 곳에 써야 합니다.",
    },
    {
      k: "min_max · 두 값을 한 번에 돌려주기",
      qq: "배열에서 <b>최솟값과 최댓값</b>을 찾아 <code>out_min</code>·<code>out_max</code> 에 담아 주세요. 개수가 0이면 아무것도 쓰지 말고 <code>0</code>을, 아니면 <code>1</code>을 돌려줍니다.",
      src: "int min_max(const int *xs, int n, int *out_min, int *out_max) {\n    if (n <= 0) return 0;\n    int lo = xs[0], hi = xs[0];\n    for (int i = 1; i < n; i++) {\n        if (xs[i] < lo) lo = xs[i];\n        if (xs[i] > hi) hi = xs[i];\n    }\n    out_min = &lo;\n    out_max = &hi;\n    return 1;\n}\n",
      sol: "int min_max(const int *xs, int n, int *out_min, int *out_max) {\n    if (n <= 0) return 0;\n    int lo = xs[0], hi = xs[0];\n    for (int i = 1; i < n; i++) {\n        if (xs[i] < lo) lo = xs[i];\n        if (xs[i] > hi) hi = xs[i];\n    }\n    *out_min = lo;\n    *out_max = hi;\n    return 1;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint min_max(const int *xs, int n, int *out_min, int *out_max);\n\nstatic int fails = 0;\n\nint main(void) {\n    int a[] = {3, 1, 4, 1, 5};\n    int lo = -999, hi = -999;\n    if (min_max(a, 5, &lo, &hi) != 1) { printf(\"성공하면 1 을 돌려준다\\n\"); fails++; }\n    if (lo != 1 || hi != 5) { printf(\"최소 1, 최대 5 여야 한다: got %d,%d\\n\", lo, hi); fails++; }\n    int b[] = {-2};\n    lo = hi = -999;\n    min_max(b, 1, &lo, &hi);\n    if (lo != -2 || hi != -2) { printf(\"하나뿐이면 둘 다 그 값: got %d,%d\\n\", lo, hi); fails++; }\n    lo = hi = -999;\n    if (min_max(a, 0, &lo, &hi) != 0) { printf(\"개수 0 이면 0 을 돌려준다\\n\"); fails++; }\n    if (lo != -999 || hi != -999) { printf(\"개수 0 이면 쓰지 않는다: got %d,%d\\n\", lo, hi); fails++; }\n    return fails ? 1 : 0;\n}\n" },
      ex: "out_min = &lo 는 함수 안의 포인터 변수에 지역 변수 주소를 넣을 뿐입니다. 부른 쪽에는 아무것도 전달되지 않아요. *out_min = lo 처럼 가리키는 곳에 값을 써야 합니다.",
    },
  ],
},
{
  unit: "배열과 문자열",
  lesson: "직접 짜 보기 — 배열은 넘어가면서 주소가 된다",
  th: {
    sum: "배열을 함수에 넘기면 **크기 정보가 사라진다.** 안에서 `sizeof` 로 길이를 재려 하면 포인터 크기가 나온다.",
    body: [
      { h: "감쇠(decay)", t: "`void f(int a[])` 는 사실 `void f(int *a)` 다. 그래서 함수 안의 `sizeof(a)` 는 배열 전체 크기가 아니라 포인터 크기(보통 8)다. `sizeof(a)/sizeof(a[0])` 이 2 가 나오는 이유가 이것이다 — 길이는 **따로 넘겨야** 한다." },
      { h: "문자열의 길이", t: "`strlen` 은 `\\0` 을 만날 때까지 세므로 널 종단 문자를 포함하지 않는다. 담을 배열은 `strlen + 1` 만큼 있어야 한다. 이 +1 을 빼먹는 것이 C 에서 가장 흔한 버퍼 사고다." },
    ],
    code: { c: "void f(int a[]) {\n    sizeof(a);            // 포인터 크기 (8)\n}\nint a[5];\nsizeof(a)/sizeof(a[0]);   // 5 — 여기서만 된다", cap: "넘어가면 길이 정보가 사라진다" },
    key: ["함수 안에서는 배열 길이를 알 수 없다", "길이는 따로 넘긴다", "`strlen` 은 `\\0` 을 세지 않는다"],
  },
  q: [
    {
      k: "sum_all · 배열 전부 더하기",
      qq: "배열의 합을 돌려주세요. 함수 안에서는 배열 길이를 알 수 없으니 <b>넘어온 개수</b>를 써야 합니다.",
      src: "int sum_all(const int *xs, int n) {\n    int len = sizeof(xs) / sizeof(xs[0]);\n    int s = 0;\n    for (int i = 0; i < len; i++) s += xs[i];\n    return s;\n}\n",
      sol: "int sum_all(const int *xs, int n) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += xs[i];\n    return s;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint sum_all(const int *xs, int n);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    int a[] = {1, 2, 3, 4, 5};\n    eq(sum_all(a, 5), 15, \"다섯 개를 다 더한다\");\n    int b[] = {10};\n    eq(sum_all(b, 1), 10, \"하나\");\n    eq(sum_all(a, 0), 0, \"개수 0\");\n    int c[] = {-1, 1, -2, 2};\n    eq(sum_all(c, 4), 0, \"음수 섞임\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "함수 안의 xs 는 배열이 아니라 포인터입니다. sizeof(xs) 는 포인터 크기(8)라 len 이 2 로 나와 앞 두 개만 더해요. 길이는 매개변수로 받은 n 을 써야 합니다.",
    },
    {
      k: "count_char · 글자 세기",
      qq: "문자열에서 특정 글자가 <b>몇 번 나오는지</b> 세어 주세요. 널 종단(<code>\\0</code>)은 세지 않습니다.",
      src: "#include <string.h>\n\nint count_char(const char *s, char c) {\n    int n = 0;\n    for (int i = 0; i <= strlen(s); i++) {\n        if (s[i] == c) n++;\n    }\n    return n;\n}\n",
      sol: "#include <string.h>\n\nint count_char(const char *s, char c) {\n    int n = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == c) n++;\n    }\n    return n;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint count_char(const char *s, char c);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(count_char(\"banana\", 'a'), 3, \"banana 의 a\");\n    eq(count_char(\"banana\", 'z'), 0, \"없는 글자\");\n    eq(count_char(\"\", 'a'), 0, \"빈 문자열\");\n    /* 널 종단 문자를 세면 안 된다 */\n    eq(count_char(\"abc\", '\\0'), 0, \"널 종단은 세지 않는다\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "i <= strlen(s) 는 마지막에 널 종단 문자까지 봅니다. '\\0' 을 찾는 경우 1 이 나와 버려요. 문자열은 s[i] != '\\0' 을 조건으로 도는 것이 관용구입니다.",
    },
  ],
},
{
  unit: "포인터 심화",
  lesson: "직접 짜 보기 — 포인터 산술",
  th: {
    sum: "포인터에 1을 더하면 **가리키는 타입 크기만큼** 움직인다. `int*` 에 +1 은 주소가 4 늘어난다.",
    body: [
      { h: "끝을 가리키는 포인터", t: "C 는 배열의 '마지막 원소 다음' 을 가리키는 포인터를 합법으로 인정한다(읽지만 않으면). 그래서 구간을 `[시작, 끝)` 반열림으로 표현하는 관용구가 성립한다 — `for (p = a; p != end; p++)`. 끝을 포함하는 것으로 착각하면 한 칸을 더 읽는다." },
      { h: "두 포인터의 차", t: "`end - begin` 은 바이트 수가 아니라 **원소 개수**다. 이것도 타입 크기로 나눈 값이라, `char*` 와 `int*` 에서 같은 주소 차이라도 결과가 다르다." },
    ],
    code: { c: "int a[5];\nint *end = a + 5;              // 끝 다음 — 읽지만 않으면 합법\nfor (int *p = a; p != end; p++) …\nend - a;                        // 5 (개수)", cap: "구간은 [시작, 끝) 반열림" },
    key: ["포인터 +1 은 타입 크기만큼", "구간은 끝을 포함하지 않는다", "포인터 차는 원소 개수"],
  },
  q: [
    {
      k: "sum_range · 구간 합",
      qq: "<code>begin</code>부터 <code>end</code> <b>직전</b>까지(반열림 구간)의 합을 돌려주세요. 두 포인터가 같으면 0 입니다.",
      src: "int sum_range(const int *begin, const int *end) {\n    int s = 0;\n    for (const int *p = begin; p <= end; p++) s += *p;\n    return s;\n}\n",
      sol: "int sum_range(const int *begin, const int *end) {\n    int s = 0;\n    for (const int *p = begin; p != end; p++) s += *p;\n    return s;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint sum_range(const int *begin, const int *end);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    /* 뒤에 큰 값을 두었다. 끝을 포함해 읽으면 합이 크게 어긋난다. */\n    int a[5] = {1, 2, 3, 1000, 2000};\n    eq(sum_range(a, a + 3), 6, \"앞 세 개만 더한다\");\n    eq(sum_range(a, a), 0, \"같으면 0\");\n    eq(sum_range(a, a + 1), 1, \"하나만\");\n    eq(sum_range(a + 1, a + 3), 5, \"가운데 구간\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "p <= end 는 end 가 가리키는 곳까지 읽습니다. 반열림 구간에서 end 는 '마지막 다음' 이라 읽으면 안 되는 자리예요 — 여기서는 1000 이 더해져 합이 틀립니다.",
    },
    {
      k: "find · 값이 있는 자리 찾기",
      qq: "배열에서 값을 찾아 <b>그 자리의 포인터</b>를 돌려주세요. 없으면 <code>end</code> 를 돌려줍니다(표준 라이브러리 관용구).",
      src: "const int *find(const int *begin, const int *end, int v) {\n    for (const int *p = begin; p != end; p++) {\n        if (*p == v) return p;\n    }\n    return begin;\n}\n",
      sol: "const int *find(const int *begin, const int *end, int v) {\n    for (const int *p = begin; p != end; p++) {\n        if (*p == v) return p;\n    }\n    return end;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nconst int *find(const int *begin, const int *end, int v);\n\nstatic int fails = 0;\n\nint main(void) {\n    int a[4] = {10, 20, 30, 40};\n    const int *r = find(a, a + 4, 30);\n    if (r != a + 2) { printf(\"30 은 세 번째 자리\\n\"); fails++; }\n    r = find(a, a + 4, 10);\n    if (r != a) { printf(\"첫 자리\\n\"); fails++; }\n    r = find(a, a + 4, 99);\n    if (r != a + 4) { printf(\"없으면 end 를 돌려준다\\n\"); fails++; }\n    r = find(a, a, 10);\n    if (r != a) { printf(\"빈 구간이면 end(=begin)\\n\"); fails++; }\n    return fails ? 1 : 0;\n}\n" },
      ex: "못 찾았을 때 begin 을 돌려주면 '첫 번째 자리에서 찾았다' 와 구별되지 않습니다. 표준 라이브러리는 end 를 돌려주는 규약을 씁니다 — 부른 쪽이 if (r == end) 로 확인해요.",
    },
  ],
},
{
  unit: "동적 메모리 관리 중급: malloc·free와 메모리 버그",
  lesson: "직접 짜 보기 — 복사인가 별칭인가",
  th: {
    sum: "포인터를 돌려주는 것과 **새 메모리를 만들어 돌려주는 것**은 다르다. 앞쪽은 원본이 바뀌면 같이 바뀐다.",
    body: [
      { h: "복사본을 만든다는 것", t: "문자열을 복제하려면 `malloc(strlen(s) + 1)` 로 자리를 잡고 내용을 옮긴다. **+1 은 널 종단 자리**다. 이걸 빼먹으면 마지막 글자를 쓸 자리가 없어 버퍼 밖을 건드린다 — 당장은 멀쩡해 보이다가 나중에 엉뚱한 데서 터진다." },
      { h: "누가 해제하는가", t: "`malloc` 한 메모리는 누군가 `free` 해야 한다. 함수가 새 메모리를 돌려주면 '해제는 부른 쪽 책임' 이라는 약속이 따라붙는다. 이 약속을 문서에 적지 않으면 새거나 두 번 해제된다." },
    ],
    code: { c: "char *dup(const char *s) {\n    char *p = malloc(strlen(s) + 1);   // +1 은 '\\0' 자리\n    if (!p) return NULL;\n    strcpy(p, s);\n    return p;                           // free 는 부른 쪽이\n}", cap: "+1 을 빼먹지 않는다" },
    key: ["복사는 새 메모리를 잡아 옮기는 것", "`strlen + 1` — 널 종단 자리", "해제 책임을 정해 둔다"],
  },
  q: [
    {
      k: "dup_str · 진짜 복사본 만들기",
      qq: "문자열의 <b>독립된 복사본</b>을 만들어 돌려주세요. 원본을 고쳐도 복사본은 그대로여야 합니다. 실패하면 <code>NULL</code> 입니다.",
      src: "#include <stdlib.h>\n#include <string.h>\n\nchar *dup_str(const char *s) {\n    if (!s) return NULL;\n    return (char *)s;\n}\n",
      sol: "#include <stdlib.h>\n#include <string.h>\n\nchar *dup_str(const char *s) {\n    if (!s) return NULL;\n    char *p = (char *)malloc(strlen(s) + 1);\n    if (!p) return NULL;\n    strcpy(p, s);\n    return p;\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar *dup_str(const char *s);\n\nstatic int fails = 0;\n\nint main(void) {\n    char orig[] = \"hello\";\n    char *cp = dup_str(orig);\n    if (!cp) { printf(\"NULL 이 아니어야 한다\\n\"); return 1; }\n    if (strcmp(cp, \"hello\") != 0) { printf(\"내용이 같아야 한다: %s\\n\", cp); fails++; }\n    if (cp == orig) { printf(\"같은 주소를 돌려주면 복사가 아니다\\n\"); fails++; }\n    /* 원본을 고쳐도 복사본은 그대로여야 한다 */\n    orig[0] = 'J';\n    if (strcmp(cp, \"hello\") != 0) { printf(\"원본을 고치니 복사본도 바뀌었다: %s\\n\", cp); fails++; }\n    free(cp);\n\n    char *e = dup_str(\"\");\n    if (!e || e[0] != '\\0') { printf(\"빈 문자열도 복사되어야 한다\\n\"); fails++; }\n    free(e);\n\n    if (dup_str(NULL) != NULL) { printf(\"NULL 이면 NULL\\n\"); fails++; }\n    return fails ? 1 : 0;\n}\n" },
      ex: "받은 포인터를 그대로 돌려주면 복사가 아니라 같은 메모리를 가리키는 별칭입니다. 원본을 고치면 '복사본' 도 함께 바뀌어요. malloc 으로 자리를 잡고 옮겨야 하고, +1 은 널 종단 자리입니다.",
    },
    {
      k: "make_zeros · 0으로 채운 배열",
      qq: "정수 <code>n</code>개를 담을 배열을 만들어 <b>전부 0으로</b ></code> 채워 돌려주세요. <code>n</code>이 0 이하면 <code>NULL</code> 입니다.",
      src: "#include <stdlib.h>\n\nint *make_zeros(int n) {\n    int *p = (int *)malloc(n * sizeof(int));\n    return p;\n}\n",
      sol: "#include <stdlib.h>\n\nint *make_zeros(int n) {\n    if (n <= 0) return NULL;\n    int *p = (int *)calloc((size_t)n, sizeof(int));\n    return p;\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <stdlib.h>\n\nint *make_zeros(int n);\n\nstatic int fails = 0;\n\nint main(void) {\n    /* 먼저 같은 크기를 잡아 쓰레기 값으로 더럽혀 둔다. 그 자리를 다시 받으면\n       0으로 채우지 않은 구현이 드러난다. */\n    int *dirty = (int *)malloc(16 * sizeof(int));\n    for (int i = 0; i < 16; i++) dirty[i] = 0x5A5A5A5A;\n    free(dirty);\n\n    int *p = make_zeros(16);\n    if (!p) { printf(\"NULL 이 아니어야 한다\\n\"); return 1; }\n    for (int i = 0; i < 16; i++) {\n        if (p[i] != 0) { printf(\"%d번째가 0 이 아니다: %d\\n\", i, p[i]); fails++; break; }\n    }\n    free(p);\n\n    if (make_zeros(0) != NULL) { printf(\"0 이면 NULL\\n\"); fails++; }\n    if (make_zeros(-1) != NULL) { printf(\"음수면 NULL\\n\"); fails++; }\n    return fails ? 1 : 0;\n}\n" },
      ex: "malloc 은 자리만 잡고 내용을 채우지 않습니다 — 앞서 쓰던 값이 그대로 남아 있어요. 0 으로 시작해야 하면 calloc 을 쓰거나 직접 채워야 합니다. 그리고 n 이 0 이하일 때를 막지 않으면 malloc(0) 이나 음수 크기로 이상하게 동작합니다.",
    },
  ],
},
{
  unit: "문자열과 널 종단 심화: strncpy 함정과 안전한 복사",
  lesson: "직접 짜 보기 — 잘릴 때가 진짜 문제다",
  th: {
    sum: "`strncpy` 는 **널 종단을 보장하지 않는다.** 원본이 버퍼보다 길면 `\\0` 없이 꽉 채우고 끝난다.",
    body: [
      { h: "왜 위험한가", t: "널 종단이 없는 배열을 `printf(\"%s\")` 나 `strlen` 에 넘기면 `\\0` 을 만날 때까지 계속 읽는다. 남의 메모리를 읽고, 운이 나쁘면 죽는다. 잘림 자체보다 **잘렸는데 표시가 없다는 것**이 문제다." },
      { h: "안전하게 쓰는 법", t: "`strncpy(dst, src, size - 1); dst[size - 1] = '\\0';` 처럼 마지막 칸을 직접 채운다. 크기가 0 인 경우도 먼저 걸러야 `dst[-1]` 을 건드리지 않는다." },
    ],
    code: { c: "if (size == 0) return;\nstrncpy(dst, src, size - 1);\ndst[size - 1] = '\\0';   // 이 줄이 핵심", cap: "마지막 칸을 직접 채운다" },
    key: ["`strncpy` 는 널 종단을 보장하지 않는다", "마지막 칸을 직접 `\\0` 로", "크기 0 을 먼저 거른다"],
  },
  q: [
    {
      k: "safe_copy · 잘려도 안전하게",
      qq: "<code>src</code>를 <code>dst</code>에 복사하되 <b>절대 버퍼를 넘지 않고</b>, 잘리더라도 <b>반드시 널 종단</b>되게 하세요. <code>size</code>가 0이면 아무것도 쓰지 않습니다.",
      src: "#include <string.h>\n\nvoid safe_copy(char *dst, size_t size, const char *src) {\n    strncpy(dst, src, size);\n}\n",
      sol: "#include <string.h>\n\nvoid safe_copy(char *dst, size_t size, const char *src) {\n    if (size == 0) return;\n    strncpy(dst, src, size - 1);\n    dst[size - 1] = '\\0';\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <string.h>\n\nvoid safe_copy(char *dst, size_t size, const char *src);\n\nstatic int fails = 0;\n\nint main(void) {\n    /* 버퍼를 X 로 채워 두면 '어디까지 썼는지' 와 '널 종단이 있는지' 를 볼 수 있다 */\n    char buf[8];\n    memset(buf, 'X', sizeof(buf));\n    safe_copy(buf, 5, \"abcdefgh\");\n    if (buf[4] != '\\0') { printf(\"잘려도 널 종단이 있어야 한다: buf[4]=%d\\n\", buf[4]); fails++; }\n    if (strncmp(buf, \"abcd\", 4) != 0) { printf(\"앞 4글자는 복사되어야 한다\\n\"); fails++; }\n    if (buf[5] != 'X') { printf(\"size 를 넘겨 쓰면 안 된다: buf[5]=%d\\n\", buf[5]); fails++; }\n\n    memset(buf, 'X', sizeof(buf));\n    safe_copy(buf, 8, \"hi\");\n    if (strcmp(buf, \"hi\") != 0) { printf(\"짧은 문자열은 그대로: %s\\n\", buf); fails++; }\n\n    memset(buf, 'X', sizeof(buf));\n    safe_copy(buf, 0, \"abc\");\n    if (buf[0] != 'X') { printf(\"size 0 이면 아무것도 쓰지 않는다\\n\"); fails++; }\n\n    memset(buf, 'X', sizeof(buf));\n    safe_copy(buf, 1, \"abc\");\n    if (buf[0] != '\\0') { printf(\"size 1 이면 빈 문자열이 된다\\n\"); fails++; }\n    return fails ? 1 : 0;\n}\n" },
      ex: "strncpy 에 size 를 그대로 넘기면, 원본이 길 때 버퍼를 꽉 채우고 널 종단을 넣지 않습니다. 그 뒤로 그 버퍼를 문자열로 쓰면 어디까지가 끝인지 알 수 없어요. size-1 만 복사하고 마지막 칸을 직접 채웁니다.",
    },
    {
      k: "trim_end · 뒤쪽 공백 지우기",
      qq: "문자열 <b>뒤쪽의 공백</b>을 지워 제자리에서 잘라 주세요. 전부 공백이면 빈 문자열이 됩니다.",
      src: "#include <string.h>\n#include <ctype.h>\n\nvoid trim_end(char *s) {\n    size_t n = strlen(s);\n    while (isspace((unsigned char)s[n - 1])) n--;\n    s[n] = '\\0';\n}\n",
      sol: "#include <string.h>\n#include <ctype.h>\n\nvoid trim_end(char *s) {\n    size_t n = strlen(s);\n    while (n > 0 && isspace((unsigned char)s[n - 1])) n--;\n    s[n] = '\\0';\n}\n",
      test: { "test.c": "#include <stdio.h>\n#include <string.h>\n\nvoid trim_end(char *s);\n\nstatic int fails = 0;\nstatic void chk(const char *in, const char *want) {\n    char buf[32];\n    strcpy(buf, in);\n    trim_end(buf);\n    if (strcmp(buf, want) != 0) { printf(\"[%s] -> [%s], want [%s]\\n\", in, buf, want); fails++; }\n}\n\nint main(void) {\n    chk(\"abc  \", \"abc\");\n    chk(\"abc\", \"abc\");\n    chk(\"a b  \", \"a b\");\n    chk(\"   \", \"\");\n    chk(\"\", \"\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "빈 문자열이면 n 이 0 이라 s[n-1] 이 배열 앞을 건드립니다. 전부 공백일 때도 n 이 0 까지 내려가 같은 일이 벌어져요. 조건에 n > 0 을 먼저 두어야 합니다 — && 는 왼쪽이 거짓이면 오른쪽을 보지 않습니다.",
    },
  ],
},
{
  unit: "비트 연산과 플래그 (중급)",
  lesson: "직접 짜 보기 — 켜고 끄고 뒤집기",
  th: {
    sum: "플래그는 비트 하나가 켜짐·꺼짐 하나를 뜻한다. 켜기는 `|`, 끄기는 `& ~`, 뒤집기는 `^` 다.",
    body: [
      { h: "끄기에는 물결표", t: "`v & (1u << n)` 은 **확인**이지 끄기가 아니다. 끄려면 그 비트만 0인 마스크가 필요하므로 `v & ~(1u << n)` 이다. `~` 를 빼먹으면 다른 비트가 전부 날아간다 — 눈에 잘 안 띄는 한 글자다." },
      { h: "부호와 자리 넘침", t: "`1 << 31` 은 int 에서 정의되지 않은 동작이다. 부호 없는 상수 `1u << 31` 을 쓴다. 그리고 시프트 폭이 타입 비트 수 이상이면 그것도 정의되지 않는다 — 32비트 값에 `<< 32` 는 쓰면 안 된다." },
    ],
    code: { c: "v |= (1u << n);      // 켜기\nv &= ~(1u << n);     // 끄기\nv ^= (1u << n);      // 뒤집기\n(v >> n) & 1u        // 확인", cap: "끄기에는 ~ 가 붙는다" },
    key: ["켜기 `|`, 끄기 `& ~`, 뒤집기 `^`", "확인은 `(v >> n) & 1`", "시프트에는 `1u` 를 쓴다"],
  },
  q: [
    {
      k: "clear_bit · 비트 하나만 끄기",
      qq: "<code>n</code>번째 비트만 <b>끄고</b> 나머지는 그대로 둔 값을 돌려주세요.",
      src: "unsigned clear_bit(unsigned v, int n) {\n    return v & (1u << n);\n}\n",
      sol: "unsigned clear_bit(unsigned v, int n) {\n    return v & ~(1u << n);\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nunsigned clear_bit(unsigned v, int n);\n\nstatic int fails = 0;\nstatic void eq(unsigned got, unsigned want, const char *what) {\n    if (got != want) { printf(\"%s: got 0x%X, want 0x%X\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(clear_bit(0xFFu, 0), 0xFEu, \"0번 비트를 끈다\");\n    eq(clear_bit(0xFFu, 7), 0x7Fu, \"7번 비트를 끈다\");\n    eq(clear_bit(0x00u, 3), 0x00u, \"이미 꺼져 있으면 그대로\");\n    eq(clear_bit(0x0Au, 1), 0x08u, \"다른 비트는 건드리지 않는다\");\n    eq(clear_bit(0xFFFFFFFFu, 31), 0x7FFFFFFFu, \"맨 위 비트\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "v & (1u << n) 은 그 비트만 남기고 나머지를 전부 지웁니다 — 끄기가 아니라 확인이에요. 끄려면 그 비트만 0 인 마스크가 필요하니 ~ 를 붙입니다.",
    },
    {
      k: "count_bits · 켜진 비트 세기",
      qq: "값에서 <b>켜진 비트가 몇 개</b>인지 세어 돌려주세요. 32비트 전체를 봐야 합니다.",
      src: "int count_bits(unsigned v) {\n    int c = 0;\n    while (v) {\n        if (v & 1) c++;\n        v = v / 2;\n    }\n    return c;\n}\n\nint highest_bit(unsigned v) {\n    int h = -1;\n    for (int i = 0; i < 32; i++) {\n        if (v & (1 << i)) h = i;\n    }\n    return h;\n}\n",
      sol: "int count_bits(unsigned v) {\n    int c = 0;\n    while (v) {\n        c += (int)(v & 1u);\n        v >>= 1;\n    }\n    return c;\n}\n\nint highest_bit(unsigned v) {\n    int h = -1;\n    for (int i = 0; i < 32; i++) {\n        if ((v >> i) & 1u) h = i;\n    }\n    return h;\n}\n",
      test: { "test.c": "#include <stdio.h>\n\nint count_bits(unsigned v);\nint highest_bit(unsigned v);\n\nstatic int fails = 0;\nstatic void eq(int got, int want, const char *what) {\n    if (got != want) { printf(\"%s: got %d, want %d\\n\", what, got, want); fails++; }\n}\n\nint main(void) {\n    eq(count_bits(0u), 0, \"0 은 없음\");\n    eq(count_bits(1u), 1, \"1 은 하나\");\n    eq(count_bits(0xFFu), 8, \"0xFF 는 여덟\");\n    eq(count_bits(0xFFFFFFFFu), 32, \"전부 켜짐\");\n    eq(highest_bit(0u), -1, \"없으면 -1\");\n    eq(highest_bit(1u), 0, \"0번\");\n    eq(highest_bit(0x80000000u), 31, \"맨 위 비트\");\n    eq(highest_bit(0x0Fu), 3, \"0x0F 의 맨 위는 3번\");\n    return fails ? 1 : 0;\n}\n" },
      ex: "highest_bit 의 1 << i 는 int 라서 i 가 31 일 때 정의되지 않은 동작입니다. 부호 없는 쪽으로 옮겨 (v >> i) & 1u 로 보면 안전해요. count_bits 는 나눗셈 대신 시프트를 쓰는 편이 뜻도 분명합니다.",
    },
  ],
},
];
