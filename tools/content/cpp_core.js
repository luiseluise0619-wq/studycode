/* C++ 핵심 유닛 실습.
   C++ 는 608문항에 실습 62개(10%)이고, 그 62개는 전부 exercism 임포트 유닛에 있다.
   배우는 유닛 30개는 하나도 없다.

   채점은 러너가 깔아 주는 catch2 로 한다. sol.cpp 와 test.cpp 를 함께 컴파일하므로,
   테스트는 sol.cpp 안의 함수를 선언만 하고 쓰면 된다 (헤더를 따로 만들지 않는다).

   C 와 같은 원칙: 시작 코드의 실패가 정의되지 않은 동작에 기대면 안 된다.
   무효화된 반복자를 읽거나 이동한 객체를 쓰는 식으로 틀리게 만들면 어떤 기계에서는
   우연히 통과한다. 전부 결정적으로 드러나는 버그로 골랐다. */
module.exports = [
{
  unit: "C++ 첫걸음",
  lesson: "직접 짜 보기 — 값과 참조",
  th: {
    sum: "C++ 는 기본이 **복사**다. 큰 객체를 값으로 받으면 통째로 복사되고, 함수 안에서 고쳐도 부른 쪽은 그대로다.",
    body: [
      { h: "const 참조로 받기", t: "읽기만 할 거면 `const std::string&` 로 받는다. 복사가 없어 빠르고, `const` 라서 실수로 고칠 수도 없다. 고쳐야 하면 `&` 만 붙여 참조로 받는다 — 그때는 부른 쪽 값이 실제로 바뀐다." },
      { h: "정수 나눗셈은 C 와 같다", t: "`int / int` 는 소수점이 잘린다. `static_cast<double>(a) / b` 처럼 **나누기 전에** 바꾼다. `static_cast<double>(a / b)` 는 이미 늦었다." },
    ],
    code: { c: "void f(const std::string& s);   // 읽기만 — 복사 없음\nvoid g(std::vector<int>& v);    // 고친다 — 부른 쪽도 바뀐다\nstatic_cast<double>(a) / b;     // 나누기 전에 바꾼다", cap: "읽기는 const 참조, 고치기는 참조" },
    key: ["기본은 복사다", "읽기만 하면 `const&`", "캐스트는 나눗셈 앞에"],
  },
  q: [
    {
      k: "average · 평균 구하기",
      qq: "정수 벡터의 <b>평균</b>을 <code>double</code> 로 돌려주세요. 비어 있으면 <code>0.0</code> 입니다. 벡터는 <b>복사하지 말고</b> const 참조로 받으세요.",
      src: "#include <vector>\n\ndouble average(std::vector<int> xs) {\n    int sum = 0;\n    for (int x : xs) sum += x;\n    return sum / xs.size();\n}\n",
      sol: "#include <vector>\n\ndouble average(const std::vector<int>& xs) {\n    if (xs.empty()) return 0.0;\n    int sum = 0;\n    for (int x : xs) sum += x;\n    return static_cast<double>(sum) / static_cast<double>(xs.size());\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n\ndouble average(const std::vector<int>& xs);\n\nTEST_CASE(\"평균은 소수까지 나온다\") {\n    REQUIRE(average({1, 2}) == Approx(1.5));\n    REQUIRE(average({1, 2, 3, 4}) == Approx(2.5));\n}\n\nTEST_CASE(\"딱 나뉘는 경우\") {\n    REQUIRE(average({1, 2, 3}) == Approx(2.0));\n}\n\nTEST_CASE(\"빈 벡터는 0.0\") {\n    std::vector<int> e;\n    REQUIRE(average(e) == Approx(0.0));\n}\n\nTEST_CASE(\"음수도 된다\") {\n    REQUIRE(average({-2, 2}) == Approx(0.0));\n    REQUIRE(average({-3}) == Approx(-3.0));\n}\n" },
      ex: "값으로 받으면 벡터가 통째로 복사됩니다. 그리고 sum 과 size() 가 둘 다 정수라 나눗셈에서 소수점이 잘려요. 빈 벡터에서는 size() 가 0 이라 나누기 자체가 문제가 됩니다. const 참조로 받고, 나누기 전에 double 로 바꾸고, 빈 경우를 먼저 거릅니다.",
    },
    {
      k: "double_all · 벡터를 제자리에서 두 배로",
      qq: "벡터의 모든 값을 <b>두 배</b>로 만드세요. 부른 쪽의 벡터가 실제로 바뀌어야 합니다.",
      src: "#include <vector>\n\nvoid double_all(std::vector<int> xs) {\n    for (int& x : xs) x *= 2;\n}\n",
      sol: "#include <vector>\n\nvoid double_all(std::vector<int>& xs) {\n    for (int& x : xs) x *= 2;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n\nvoid double_all(std::vector<int>& xs);\n\nTEST_CASE(\"부른 쪽 벡터가 바뀐다\") {\n    std::vector<int> v{1, 2, 3};\n    double_all(v);\n    REQUIRE(v == std::vector<int>{2, 4, 6});\n}\n\nTEST_CASE(\"빈 벡터도 안전하다\") {\n    std::vector<int> v;\n    double_all(v);\n    REQUIRE(v.empty());\n}\n\nTEST_CASE(\"음수와 0\") {\n    std::vector<int> v{-1, 0};\n    double_all(v);\n    REQUIRE(v == std::vector<int>{-2, 0});\n}\n" },
      ex: "값으로 받으면 함수 안에서 사본을 고치고 버립니다. 안쪽 for 에 int& 를 써 봐야 그 사본의 원소일 뿐이에요. 매개변수 자체를 참조로 받아야 합니다.",
    },
  ],
},
{
  unit: "참조와 포인터",
  lesson: "직접 짜 보기 — 무엇을 가리키는가",
  th: {
    sum: "참조는 **다른 이름**이고 포인터는 **주소를 담은 값**이다. 참조는 한 번 묶이면 다른 것을 가리킬 수 없다.",
    body: [
      { h: "지역 변수를 가리키지 않기", t: "함수가 끝나면 지역 변수는 사라진다. 그 참조나 주소를 돌려주면 없어진 것을 가리키게 된다. 컴파일은 되고 당장은 값이 남아 있는 것처럼 보이기도 해서, 나중에 엉뚱한 데서 터진다." },
      { h: "무엇을 돌려줄 것인가", t: "컨테이너 안의 원소를 가리키려면 참조를 돌려줘도 된다 — 그 원소는 컨테이너가 살아 있는 동안 남는다. 반대로 함수 안에서 만든 값은 **값으로** 돌려준다. 요즘 컴파일러는 그 복사를 대부분 없애 준다." },
    ],
    code: { c: "int& at(std::vector<int>& v, size_t i) {\n    return v[i];       // 컨테이너의 원소 — 안전하다\n}\nstd::string make() {\n    std::string s = \"hi\";\n    return s;          // 값으로 — 복사는 대개 생략된다\n}", cap: "지역 변수의 참조를 돌려주지 않는다" },
    key: ["참조는 다시 묶을 수 없다", "지역 변수의 참조를 돌려주지 않는다", "컨테이너 원소의 참조는 안전하다"],
  },
  q: [
    {
      k: "biggest · 가장 큰 원소를 고쳐 쓰기",
      qq: "벡터에서 <b>가장 큰 원소에 대한 참조</b>를 돌려주세요. 부른 쪽이 그 참조로 값을 고치면 벡터가 실제로 바뀌어야 합니다.",
      src: "#include <vector>\n#include <algorithm>\n\nint& biggest(std::vector<int>& v) {\n    int m = *std::max_element(v.begin(), v.end());\n    return m;\n}\n",
      sol: "#include <vector>\n#include <algorithm>\n\nint& biggest(std::vector<int>& v) {\n    return *std::max_element(v.begin(), v.end());\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n\nint& biggest(std::vector<int>& v);\n\nTEST_CASE(\"가장 큰 값을 고치면 벡터가 바뀐다\") {\n    std::vector<int> v{3, 9, 4};\n    biggest(v) = 0;\n    REQUIRE(v == std::vector<int>{3, 0, 4});\n}\n\nTEST_CASE(\"참조가 벡터 안을 가리킨다\") {\n    std::vector<int> v{1, 5};\n    int& r = biggest(v);\n    REQUIRE(&r == &v[1]);\n}\n\nTEST_CASE(\"하나뿐이면 그것\") {\n    std::vector<int> v{7};\n    biggest(v) = 8;\n    REQUIRE(v[0] == 8);\n}\n" },
      ex: "max_element 가 준 값을 지역 변수 m 에 복사한 뒤 그 참조를 돌려주고 있습니다. 함수가 끝나면 m 은 사라지고, 부른 쪽은 없어진 것을 가리켜요. 반복자를 그대로 역참조해 컨테이너 안의 원소를 돌려줘야 합니다.",
    },
    {
      k: "swap_ref · 참조로 두 값 바꾸기",
      qq: "두 값을 <b>서로 바꾸는</b> 함수를 참조로 완성하세요. 같은 변수를 두 번 넘겨도 안전해야 합니다.",
      src: "void swap_ref(int& a, int& b) {\n    a = b;\n    b = a;\n}\n",
      sol: "void swap_ref(int& a, int& b) {\n    int t = a;\n    a = b;\n    b = t;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n\nvoid swap_ref(int& a, int& b);\n\nTEST_CASE(\"두 값이 바뀐다\") {\n    int x = 1, y = 2;\n    swap_ref(x, y);\n    REQUIRE(x == 2);\n    REQUIRE(y == 1);\n}\n\nTEST_CASE(\"음수와 0\") {\n    int p = -5, q = 0;\n    swap_ref(p, q);\n    REQUIRE(p == 0);\n    REQUIRE(q == -5);\n}\n\nTEST_CASE(\"같은 변수를 두 번 넘겨도 그대로\") {\n    int s = 7;\n    swap_ref(s, s);\n    REQUIRE(s == 7);\n}\n" },
      ex: "a = b 를 먼저 하면 a 의 원래 값이 사라집니다. 그 뒤 b = a 는 방금 덮어쓴 값을 도로 넣는 것이라 둘 다 b 가 돼요. 임시 변수에 먼저 담아 둬야 합니다.",
    },
  ],
},
{
  unit: "STL 컨테이너",
  lesson: "직접 짜 보기 — 찾기와 지우기",
  th: {
    sum: "`std::map` 의 `operator[]` 는 **없는 열쇠를 만들어 넣는다.** 읽기만 하려던 자리에서 맵이 조용히 커진다.",
    body: [
      { h: "읽기는 find 로", t: "`m[k]` 는 열쇠가 없으면 기본값으로 만들어 삽입하고 그 참조를 준다. `const` 맵에서는 아예 컴파일도 안 된다. 있는지 확인하려면 `m.find(k) != m.end()` 나 `m.count(k)` 를 쓴다." },
      { h: "지우기 관용구", t: "벡터에서 조건에 맞는 원소를 지우려면 `erase(std::remove_if(...), v.end())` 다. `remove_if` 만 부르면 원소를 앞으로 몰아놓기만 하고 크기는 그대로다 — 뒤쪽에 쓰레기가 남는다." },
    ],
    code: { c: "auto it = m.find(k);\nif (it != m.end()) use(it->second);   // 읽기\n\nv.erase(std::remove_if(v.begin(), v.end(), pred), v.end());", cap: "remove_if 만으로는 지워지지 않는다" },
    key: ["`m[k]` 는 없으면 만들어 넣는다", "읽기는 `find` 로", "지우기는 `erase(remove_if(...), end())`"],
  },
  q: [
    {
      k: "lookup · 맵을 키우지 않고 읽기",
      qq: "맵에서 값을 찾아 돌려주되, 없으면 <code>def</code> 를 돌려주세요. <b>맵의 크기가 늘어나면 안 됩니다.</b>",
      src: "#include <map>\n#include <string>\n\nint lookup(std::map<std::string, int>& m, const std::string& k, int def) {\n    if (m[k] != 0) return m[k];\n    return def;\n}\n",
      sol: "#include <map>\n#include <string>\n\nint lookup(std::map<std::string, int>& m, const std::string& k, int def) {\n    auto it = m.find(k);\n    if (it != m.end()) return it->second;\n    return def;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <map>\n#include <string>\n\nint lookup(std::map<std::string, int>& m, const std::string& k, int def);\n\nTEST_CASE(\"있으면 그 값\") {\n    std::map<std::string, int> m{{\"a\", 5}};\n    REQUIRE(lookup(m, \"a\", 0) == 5);\n}\n\nTEST_CASE(\"값이 0 이어도 있으면 0\") {\n    std::map<std::string, int> m{{\"zero\", 0}};\n    REQUIRE(lookup(m, \"zero\", 99) == 0);\n}\n\nTEST_CASE(\"없으면 기본값이고 맵이 커지지 않는다\") {\n    std::map<std::string, int> m{{\"a\", 5}};\n    REQUIRE(lookup(m, \"none\", 42) == 42);\n    REQUIRE(m.size() == 1);\n}\n" },
      ex: "m[k] 는 없는 열쇠를 기본값 0 으로 만들어 넣습니다. 읽기만 하려 했는데 맵이 커져요. 게다가 값이 진짜 0 인 항목을 '없음' 으로 취급합니다. find 로 확인해야 합니다.",
    },
    {
      k: "drop_negatives · 음수 지우기",
      qq: "벡터에서 <b>음수를 지우세요.</b> 크기도 실제로 줄어야 하고, 남은 값의 순서는 그대로여야 합니다.",
      src: "#include <vector>\n#include <algorithm>\n\nvoid drop_negatives(std::vector<int>& v) {\n    std::remove_if(v.begin(), v.end(), [](int x) { return x < 0; });\n}\n",
      sol: "#include <vector>\n#include <algorithm>\n\nvoid drop_negatives(std::vector<int>& v) {\n    v.erase(std::remove_if(v.begin(), v.end(), [](int x) { return x < 0; }), v.end());\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n\nvoid drop_negatives(std::vector<int>& v);\n\nTEST_CASE(\"음수가 사라지고 크기가 준다\") {\n    std::vector<int> v{1, -2, 3, -4};\n    drop_negatives(v);\n    REQUIRE(v == std::vector<int>{1, 3});\n}\n\nTEST_CASE(\"전부 음수면 비워진다\") {\n    std::vector<int> v{-1, -2};\n    drop_negatives(v);\n    REQUIRE(v.empty());\n}\n\nTEST_CASE(\"지울 것이 없으면 그대로\") {\n    std::vector<int> v{0, 1};\n    drop_negatives(v);\n    REQUIRE(v == std::vector<int>{0, 1});\n}\n" },
      ex: "remove_if 는 남길 원소를 앞으로 몰아 놓고 '새 끝' 을 알려 줄 뿐, 크기를 줄이지 않습니다. 뒤쪽에는 값이 그대로 남아 있어요. 돌려받은 반복자부터 끝까지를 erase 로 잘라내야 합니다.",
    },
  ],
},
{
  unit: "클래스 심화",
  lesson: "직접 짜 보기 — 초기화 순서와 const",
  th: {
    sum: "멤버는 **선언한 순서대로** 초기화된다. 초기화 목록에 적은 순서가 아니다.",
    body: [
      { h: "왜 문제가 되나", t: "`A(int n) : b_(n), a_(b_) {}` 에서 `a_` 가 먼저 선언되어 있으면, `a_` 는 아직 값이 없는 `b_` 로 초기화된다. 컴파일러가 경고를 줄 수는 있지만 오류는 아니다. **선언 순서와 초기화 목록 순서를 맞춰 두면** 이 사고가 생기지 않는다." },
      { h: "const 멤버 함수", t: "객체를 고치지 않는 함수에는 `const` 를 붙인다. 그래야 `const` 객체나 `const&` 로 받은 객체에서도 부를 수 있다. 빠뜨리면 '읽기만 하는데 왜 안 되지' 하는 컴파일 오류가 난다." },
    ],
    code: { c: "class Box {\n    int w_, h_;                       // 선언 순서\npublic:\n    Box(int w, int h) : w_(w), h_(h) {}   // 같은 순서로\n    int area() const { return w_ * h_; }  // 고치지 않으면 const\n};", cap: "선언 순서와 초기화 순서를 맞춘다" },
    key: ["멤버는 선언 순서대로 초기화된다", "고치지 않는 함수에는 `const`", "초기화 목록 순서를 선언과 맞춘다"],
  },
  q: [
    {
      k: "Rect · const 객체에서도 읽히게",
      qq: "<code>Rect</code> 를 완성하세요. 넓이를 돌려주는 <code>area()</code> 는 <b>const 객체에서도</b> 부를 수 있어야 합니다.",
      src: "class Rect {\n    int w_, h_;\npublic:\n    Rect(int w, int h) : w_(w), h_(h) {}\n    int area() { return w_ * h_; }\n    int width() { return w_; }\n};\n",
      sol: "class Rect {\n    int w_, h_;\npublic:\n    Rect(int w, int h) : w_(w), h_(h) {}\n    int area() const { return w_ * h_; }\n    int width() const { return w_; }\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n\nclass Rect {\n    int w_, h_;\npublic:\n    Rect(int w, int h);\n    int area() const;\n    int width() const;\n};\n\nstatic int area_of(const Rect& r) { return r.area(); }\n\nTEST_CASE(\"넓이를 구한다\") {\n    Rect r(3, 4);\n    REQUIRE(r.area() == 12);\n    REQUIRE(r.width() == 3);\n}\n\nTEST_CASE(\"const 참조로 받아도 읽을 수 있다\") {\n    Rect r(5, 6);\n    REQUIRE(area_of(r) == 30);\n}\n\nTEST_CASE(\"const 객체에서도 부를 수 있다\") {\n    const Rect r(2, 7);\n    REQUIRE(r.area() == 14);\n    REQUIRE(r.width() == 2);\n}\n" },
      ex: "const 가 없는 멤버 함수는 const 객체에서 부를 수 없습니다. 읽기만 하는데도 컴파일이 막혀요. 값을 고치지 않는 함수에는 const 를 붙이는 것이 기본입니다.",
    },
    {
      k: "Counter · 초기화 순서 맞추기",
      qq: "<code>Counter</code> 를 완성하세요. <code>limit</code> 로 만들고, <code>left()</code> 는 <b>남은 횟수</b>를 돌려줍니다. 처음에는 남은 횟수가 limit 과 같아야 합니다.",
      src: "class Counter {\n    int left_;\n    int limit_;\npublic:\n    Counter(int limit) : limit_(limit), left_(limit_) {}\n    void use() { if (left_ > 0) left_--; }\n    int left() const { return left_; }\n    int limit() const { return limit_; }\n};\n",
      sol: "class Counter {\n    int limit_;\n    int left_;\npublic:\n    Counter(int limit) : limit_(limit), left_(limit) {}\n    void use() { if (left_ > 0) left_--; }\n    int left() const { return left_; }\n    int limit() const { return limit_; }\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n\nclass Counter {\n    int limit_;\n    int left_;\npublic:\n    Counter(int limit);\n    void use();\n    int left() const;\n    int limit() const;\n};\n\nTEST_CASE(\"처음에는 남은 횟수가 limit 과 같다\") {\n    Counter c(3);\n    REQUIRE(c.limit() == 3);\n    REQUIRE(c.left() == 3);\n}\n\nTEST_CASE(\"쓸 때마다 하나씩 줄어든다\") {\n    Counter c(2);\n    c.use();\n    REQUIRE(c.left() == 1);\n    c.use();\n    REQUIRE(c.left() == 0);\n}\n\nTEST_CASE(\"0 아래로 내려가지 않는다\") {\n    Counter c(1);\n    c.use();\n    c.use();\n    REQUIRE(c.left() == 0);\n}\n" },
      ex: "left_ 가 먼저 선언되어 있으면 left_ 가 먼저 초기화됩니다. 초기화 목록에 limit_ 를 앞에 적어도 순서는 선언을 따라가요 — 그래서 left_(limit_) 는 아직 값이 없는 limit_ 를 읽습니다. 선언 순서를 맞추고, 매개변수 limit 을 직접 쓰는 편이 안전합니다.",
    },
  ],
},
{
  unit: "STL 알고리즘 활용 (중급)",
  lesson: "직접 짜 보기 — 알고리즘에 기준을 넘기기",
  th: {
    sum: "표준 알고리즘은 '무엇을 할지' 를 함수로 받는다. 정렬 기준은 **'앞이 뒤보다 먼저 오는가'** 를 답하는 함수다.",
    body: [
      { h: "비교 함수는 엄격해야", t: "같은 값에 대해 반드시 `false` 를 돌려줘야 한다. `<=` 로 쓰면 'a가 b보다 앞' 과 'b가 a보다 앞' 이 동시에 참이 되어 규칙이 깨진다. 표준은 이 경우 동작을 보장하지 않아 실제로 죽기도 한다." },
      { h: "sort 와 stable_sort", t: "`std::sort` 는 같은 값의 원래 순서를 지키지 않는다. 2차 기준이 필요하면 비교 함수 안에 함께 적거나 `stable_sort` 를 쓴다. 둘을 섞어 생각하면 결과가 실행할 때마다 달라 보인다." },
    ],
    code: { c: "std::sort(v.begin(), v.end(), [](const P& a, const P& b) {\n    if (a.score != b.score) return a.score > b.score;\n    return a.name < b.name;              // 2차 기준\n});", cap: "2차 기준은 비교 함수 안에" },
    key: ["같으면 `false` 를 돌려준다", "`sort` 는 안정적이지 않다", "2차 기준은 한 함수 안에"],
  },
  q: [
    {
      k: "sort_by_len · 길이순 정렬",
      qq: "문자열 벡터를 <b>길이가 짧은 것부터</b> 정렬하세요. 길이가 같으면 <b>사전순</b>입니다.",
      src: "#include <vector>\n#include <string>\n#include <algorithm>\n\nvoid sort_by_len(std::vector<std::string>& v) {\n    std::sort(v.begin(), v.end(), [](const std::string& a, const std::string& b) {\n        return a.size() <= b.size();\n    });\n}\n",
      sol: "#include <vector>\n#include <string>\n#include <algorithm>\n\nvoid sort_by_len(std::vector<std::string>& v) {\n    std::sort(v.begin(), v.end(), [](const std::string& a, const std::string& b) {\n        if (a.size() != b.size()) return a.size() < b.size();\n        return a < b;\n    });\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n#include <string>\n\nvoid sort_by_len(std::vector<std::string>& v);\n\nTEST_CASE(\"짧은 것부터\") {\n    std::vector<std::string> v{\"bbb\", \"a\", \"cc\"};\n    sort_by_len(v);\n    REQUIRE(v == std::vector<std::string>{\"a\", \"cc\", \"bbb\"});\n}\n\nTEST_CASE(\"길이가 같으면 사전순\") {\n    std::vector<std::string> v{\"dd\", \"cc\", \"aa\", \"bb\"};\n    sort_by_len(v);\n    REQUIRE(v == std::vector<std::string>{\"aa\", \"bb\", \"cc\", \"dd\"});\n}\n\nTEST_CASE(\"빈 벡터와 하나\") {\n    std::vector<std::string> e;\n    sort_by_len(e);\n    REQUIRE(e.empty());\n    std::vector<std::string> one{\"x\"};\n    sort_by_len(one);\n    REQUIRE(one == std::vector<std::string>{\"x\"});\n}\n" },
      ex: "<= 는 길이가 같을 때도 true 라 '서로가 서로보다 앞' 이 됩니다. 표준이 요구하는 순서 규칙이 깨져 결과를 보장할 수 없어요. 같으면 false 를 주고, 2차 기준을 따로 적어야 합니다.",
    },
    {
      k: "count_if_pos · 조건에 맞는 개수",
      qq: "벡터에서 <b>양수의 개수</b>와 <b>합</b>을 <code>{개수, 합}</code> 쌍으로 돌려주세요.",
      src: "#include <vector>\n#include <utility>\n#include <algorithm>\n#include <numeric>\n\nstd::pair<int, int> count_if_pos(const std::vector<int>& v) {\n    int n = std::count_if(v.begin(), v.end(), [](int x) { return x > 0; });\n    int s = std::accumulate(v.begin(), v.end(), 0);\n    return {n, s};\n}\n",
      sol: "#include <vector>\n#include <utility>\n#include <algorithm>\n#include <numeric>\n\nstd::pair<int, int> count_if_pos(const std::vector<int>& v) {\n    int n = std::count_if(v.begin(), v.end(), [](int x) { return x > 0; });\n    int s = 0;\n    for (int x : v) if (x > 0) s += x;\n    return {n, s};\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n#include <utility>\n\nstd::pair<int, int> count_if_pos(const std::vector<int>& v);\n\nTEST_CASE(\"양수만 세고 양수만 더한다\") {\n    auto r = count_if_pos({1, -5, 3});\n    REQUIRE(r.first == 2);\n    REQUIRE(r.second == 4);\n}\n\nTEST_CASE(\"양수가 없으면 둘 다 0\") {\n    auto r = count_if_pos({-1, -2});\n    REQUIRE(r.first == 0);\n    REQUIRE(r.second == 0);\n}\n\nTEST_CASE(\"빈 벡터\") {\n    std::vector<int> e;\n    auto r = count_if_pos(e);\n    REQUIRE(r.first == 0);\n    REQUIRE(r.second == 0);\n}\n" },
      ex: "개수는 양수만 세는데 합은 전체를 더하고 있습니다. 두 값의 기준이 달라 짝이 맞지 않아요 — 합도 같은 조건으로 걸러야 합니다.",
    },
  ],
},
{
  unit: "문자열과 string_view (중급)",
  lesson: "직접 짜 보기 — 자르고 붙이기",
  th: {
    sum: "`std::string::find` 는 못 찾으면 `std::string::npos` 를 돌려준다. 이 값은 아주 큰 수라, 확인하지 않고 쓰면 엉뚱한 곳을 자른다.",
    body: [
      { h: "npos 확인", t: "`s.substr(s.find(x))` 는 못 찾았을 때 `substr(npos)` 가 되어 예외를 던진다. `find` 결과는 **쓰기 전에** `!= npos` 로 확인한다. 정수형이라 `-1` 과 비교하는 코드도 보이는데, 타입이 부호 없는 값이라 정확하지 않다." },
      { h: "substr 의 두 번째 인자", t: "`substr(pos, len)` 의 두 번째는 끝 위치가 아니라 **길이**다. 끝 위치를 넣으면 뒤가 더 딸려 온다. 끝 위치밖에 없다면 `substr(begin, end - begin)` 으로 길이를 만들어 준다." },
    ],
    code: { c: "auto p = s.find(',');\nif (p == std::string::npos) return s;\nreturn s.substr(0, p);        // 두 번째는 길이", cap: "find 결과는 쓰기 전에 확인한다" },
    key: ["못 찾으면 `npos`", "`substr` 의 둘째 인자는 길이", "`npos` 를 -1 과 비교하지 않는다"],
  },
  q: [
    {
      k: "before_comma · 쉼표 앞부분",
      qq: "문자열에서 <b>첫 쉼표 앞부분</b>을 돌려주세요. 쉼표가 없으면 <b>전체</b>를 그대로 돌려줍니다.",
      src: "#include <string>\n\nstd::string before_comma(const std::string& s) {\n    return s.substr(0, s.find(','));\n}\n\nstd::string after_comma(const std::string& s) {\n    return s.substr(s.find(',') + 1);\n}\n",
      sol: "#include <string>\n\nstd::string before_comma(const std::string& s) {\n    auto p = s.find(',');\n    if (p == std::string::npos) return s;\n    return s.substr(0, p);\n}\n\nstd::string after_comma(const std::string& s) {\n    auto p = s.find(',');\n    if (p == std::string::npos) return \"\";\n    return s.substr(p + 1);\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <string>\n\nstd::string before_comma(const std::string& s);\nstd::string after_comma(const std::string& s);\n\nTEST_CASE(\"쉼표로 나눈다\") {\n    REQUIRE(before_comma(\"ab,cd\") == \"ab\");\n    REQUIRE(after_comma(\"ab,cd\") == \"cd\");\n}\n\nTEST_CASE(\"쉼표가 없으면\") {\n    REQUIRE(before_comma(\"abcd\") == \"abcd\");\n    REQUIRE(after_comma(\"abcd\") == \"\");\n}\n\nTEST_CASE(\"쉼표가 맨 앞이나 맨 뒤\") {\n    REQUIRE(before_comma(\",x\") == \"\");\n    REQUIRE(after_comma(\",x\") == \"x\");\n    REQUIRE(after_comma(\"x,\") == \"\");\n}\n\nTEST_CASE(\"빈 문자열\") {\n    REQUIRE(before_comma(\"\") == \"\");\n    REQUIRE(after_comma(\"\") == \"\");\n}\n" },
      ex: "after_comma 가 find 결과를 확인하지 않습니다. 쉼표가 없으면 npos + 1 이 0 이 되어 문자열 전체가 나와요 — 빈 문자열이어야 하는데 원본이 통째로 돌아옵니다. before_comma 는 우연히 맞게 동작하지만, 그것도 npos 가 '끝까지' 로 해석되는 덕이라 뜻을 분명히 적는 편이 낫습니다.",
    },
    {
      k: "join · 사이에만 구분자 넣기",
      qq: "문자열 벡터를 구분자로 이어 붙이세요. 구분자는 <b>사이에만</b> 들어갑니다.",
      src: "#include <vector>\n#include <string>\n\nstd::string join(const std::vector<std::string>& v, const std::string& sep) {\n    std::string out;\n    for (const auto& s : v) {\n        out += s;\n        out += sep;\n    }\n    return out;\n}\n",
      sol: "#include <vector>\n#include <string>\n\nstd::string join(const std::vector<std::string>& v, const std::string& sep) {\n    std::string out;\n    for (size_t i = 0; i < v.size(); i++) {\n        if (i > 0) out += sep;\n        out += v[i];\n    }\n    return out;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n#include <string>\n\nstd::string join(const std::vector<std::string>& v, const std::string& sep);\n\nTEST_CASE(\"사이에만 들어간다\") {\n    REQUIRE(join({\"a\", \"b\", \"c\"}, \"-\") == \"a-b-c\");\n}\n\nTEST_CASE(\"하나면 구분자가 없다\") {\n    REQUIRE(join({\"x\"}, \",\") == \"x\");\n}\n\nTEST_CASE(\"빈 벡터\") {\n    std::vector<std::string> e;\n    REQUIRE(join(e, \",\") == \"\");\n}\n\nTEST_CASE(\"빈 문자열이 섞여도\") {\n    REQUIRE(join({\"\", \"b\"}, \"-\") == \"-b\");\n}\n" },
      ex: "구분자를 뒤에 붙이면 마지막에도 하나가 남습니다. 'a-b-c-' 가 돼요. 첫 번째가 아닐 때만 먼저 붙이는 것이 관용적인 방법입니다.",
    },
  ],
},
{
  unit: "현대 C++ 문법 (중급)",
  lesson: "직접 짜 보기 — auto 와 구조적 바인딩",
  th: {
    sum: "`auto` 는 편하지만 **참조와 const 를 떨어뜨린다.** `auto x = v[0]` 은 복사다.",
    body: [
      { h: "복사가 조용히 생긴다", t: "범위 기반 for 에서 `for (auto s : v)` 는 원소를 매번 복사한다. 문자열이나 큰 구조체면 비용이 크다. 읽기만 하면 `for (const auto& s : v)`, 고치려면 `for (auto& s : v)` 다." },
      { h: "구조적 바인딩", t: "`for (const auto& [k, v] : m)` 로 맵의 열쇠와 값을 한 번에 받는다. 여기서도 `&` 를 빼면 쌍 전체가 복사된다 — 맵 원소는 `pair<const K, V>` 라 복사 비용이 그대로 든다." },
    ],
    code: { c: "for (const auto& s : v) …        // 복사 없음\nfor (auto& s : v) s += \"!\";      // 고친다\nfor (const auto& [k, val] : m) … // 열쇠와 값을 한 번에", cap: "auto 에 & 를 붙이는 것을 잊지 않는다" },
    key: ["`auto` 는 참조·const 를 떨어뜨린다", "읽기는 `const auto&`", "고치기는 `auto&`"],
  },
  q: [
    {
      k: "shout · 원소를 실제로 고치기",
      qq: "문자열 벡터의 <b>모든 원소 뒤에 <code>!</code></b> 를 붙이세요. 부른 쪽의 벡터가 실제로 바뀌어야 합니다.",
      src: "#include <vector>\n#include <string>\n\nvoid shout(std::vector<std::string>& v) {\n    for (auto s : v) {\n        s += \"!\";\n    }\n}\n",
      sol: "#include <vector>\n#include <string>\n\nvoid shout(std::vector<std::string>& v) {\n    for (auto& s : v) {\n        s += \"!\";\n    }\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n#include <string>\n\nvoid shout(std::vector<std::string>& v);\n\nTEST_CASE(\"모든 원소가 바뀐다\") {\n    std::vector<std::string> v{\"a\", \"b\"};\n    shout(v);\n    REQUIRE(v == std::vector<std::string>{\"a!\", \"b!\"});\n}\n\nTEST_CASE(\"빈 벡터\") {\n    std::vector<std::string> v;\n    shout(v);\n    REQUIRE(v.empty());\n}\n\nTEST_CASE(\"빈 문자열도\") {\n    std::vector<std::string> v{\"\"};\n    shout(v);\n    REQUIRE(v == std::vector<std::string>{\"!\"});\n}\n" },
      ex: "for (auto s : v) 의 s 는 원소의 복사본입니다. 복사본에 ! 를 붙이고 버려서 벡터는 그대로예요. 고치려면 auto& 로 받아야 합니다.",
    },
    {
      k: "sum_values · 맵의 값 더하기",
      qq: "맵의 <b>값</b>을 모두 더해 돌려주세요. 열쇠가 <code>skip</code> 과 같은 항목은 <b>빼고</b> 셉니다.",
      src: "#include <map>\n#include <string>\n\nint sum_values(const std::map<std::string, int>& m, const std::string& skip) {\n    int s = 0;\n    for (const auto& [k, v] : m) {\n        if (k == skip) break;\n        s += v;\n    }\n    return s;\n}\n",
      sol: "#include <map>\n#include <string>\n\nint sum_values(const std::map<std::string, int>& m, const std::string& skip) {\n    int s = 0;\n    for (const auto& [k, v] : m) {\n        if (k == skip) continue;\n        s += v;\n    }\n    return s;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <map>\n#include <string>\n\nint sum_values(const std::map<std::string, int>& m, const std::string& skip);\n\nTEST_CASE(\"건너뛴 것만 빼고 더한다\") {\n    std::map<std::string, int> m{{\"a\", 1}, {\"b\", 2}, {\"c\", 3}};\n    REQUIRE(sum_values(m, \"b\") == 4);\n}\n\nTEST_CASE(\"없는 열쇠를 건너뛰라고 하면 전부 더한다\") {\n    std::map<std::string, int> m{{\"a\", 1}, {\"b\", 2}};\n    REQUIRE(sum_values(m, \"zz\") == 3);\n}\n\nTEST_CASE(\"빈 맵\") {\n    std::map<std::string, int> m;\n    REQUIRE(sum_values(m, \"a\") == 0);\n}\n" },
      ex: "break 는 반복을 통째로 끝냅니다. 건너뛰려던 열쇠 뒤의 항목이 전부 빠져요 — 맵은 열쇠 순으로 돌기 때문에 어디서 멈추는지도 예측하기 어렵습니다. 하나만 건너뛰려면 continue 입니다.",
    },
  ],
},
{
  unit: "RAII와 스마트 포인터 (중급)",
  lesson: "직접 짜 보기 — 수명을 객체에 맡기기",
  th: {
    sum: "RAII 는 '자원을 객체의 수명에 묶는다' 는 뜻이다. 생성자에서 얻고 소멸자에서 놓으면, 예외가 나도 새지 않는다.",
    body: [
      { h: "왜 new/delete 를 직접 쓰지 않나", t: "`new` 뒤에 예외가 나면 `delete` 에 닿지 못해 샌다. `std::unique_ptr` 는 범위를 벗어나는 순간 자동으로 놓아 준다 — `return` 이 여러 곳에 있어도, 예외가 나도 마찬가지다." },
      { h: "unique 와 shared", t: "`unique_ptr` 는 주인이 하나다. 복사할 수 없고 `std::move` 로 넘긴다. `shared_ptr` 는 세어 가며 마지막 하나가 사라질 때 놓는다 — 편하지만 세는 비용이 있고, 서로를 가리키면 영영 안 놓인다(순환 참조)." },
    ],
    code: { c: "auto p = std::make_unique<Thing>();\n// 어디로 빠져나가든 자동으로 정리된다\nreturn std::move(p);   // 주인을 넘긴다", cap: "자원을 객체의 수명에 묶는다" },
    key: ["생성자에서 얻고 소멸자에서 놓는다", "`unique_ptr` 는 주인이 하나", "복사 대신 `std::move`"],
  },
  q: [
    {
      k: "Guard · 나갈 때 반드시 정리하기",
      qq: "<code>Guard</code> 를 완성하세요. 만들 때 카운터를 <b>1 올리고</b>, 범위를 벗어날 때 <b>1 내려야</b> 합니다. 예외가 나도 마찬가지여야 합니다.",
      src: "class Guard {\n    int* n_;\npublic:\n    explicit Guard(int* n) : n_(n) { (*n_)++; }\n    void release() { (*n_)--; }\n};\n",
      sol: "class Guard {\n    int* n_;\npublic:\n    explicit Guard(int* n) : n_(n) { (*n_)++; }\n    ~Guard() { (*n_)--; }\n    Guard(const Guard&) = delete;\n    Guard& operator=(const Guard&) = delete;\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <stdexcept>\n\nclass Guard {\n    int* n_;\npublic:\n    explicit Guard(int* n);\n    ~Guard();\n    Guard(const Guard&) = delete;\n    Guard& operator=(const Guard&) = delete;\n};\n\nTEST_CASE(\"범위를 벗어나면 되돌아온다\") {\n    int n = 0;\n    {\n        Guard g(&n);\n        REQUIRE(n == 1);\n    }\n    REQUIRE(n == 0);\n}\n\nTEST_CASE(\"예외가 나도 되돌아온다\") {\n    int n = 0;\n    try {\n        Guard g(&n);\n        REQUIRE(n == 1);\n        throw std::runtime_error(\"붐\");\n    } catch (const std::exception&) {\n    }\n    REQUIRE(n == 0);\n}\n\nTEST_CASE(\"여러 개가 겹쳐도 맞는다\") {\n    int n = 0;\n    {\n        Guard a(&n);\n        {\n            Guard b(&n);\n            REQUIRE(n == 2);\n        }\n        REQUIRE(n == 1);\n    }\n    REQUIRE(n == 0);\n}\n" },
      ex: "release() 를 손으로 불러야 하는 설계는 예외가 나거나 return 이 여러 곳이면 빠뜨리게 됩니다. 소멸자에 넣으면 어떻게 빠져나가든 반드시 실행돼요 — 이것이 RAII 입니다. 복사되면 카운터가 두 번 내려가므로 복사도 막습니다.",
    },
    {
      k: "make_list · 주인을 넘기기",
      qq: "정수를 담은 <code>unique_ptr&lt;vector&lt;int&gt;&gt;</code> 를 만들어 돌려주세요. 값은 <code>0..n-1</code> 이고, <code>n</code>이 0 이하면 <b>빈 벡터</b>를 담습니다.",
      src: "#include <memory>\n#include <vector>\n\nstd::unique_ptr<std::vector<int>> make_list(int n) {\n    std::vector<int> v;\n    for (int i = 0; i < n; i++) v.push_back(i);\n    return std::make_unique<std::vector<int>>(n);\n}\n",
      sol: "#include <memory>\n#include <vector>\n\nstd::unique_ptr<std::vector<int>> make_list(int n) {\n    auto p = std::make_unique<std::vector<int>>();\n    for (int i = 0; i < n; i++) p->push_back(i);\n    return p;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <memory>\n#include <vector>\n\nstd::unique_ptr<std::vector<int>> make_list(int n);\n\nTEST_CASE(\"0 부터 n-1 까지 담는다\") {\n    auto p = make_list(3);\n    REQUIRE(p != nullptr);\n    REQUIRE(*p == std::vector<int>{0, 1, 2});\n}\n\nTEST_CASE(\"하나\") {\n    auto p = make_list(1);\n    REQUIRE(*p == std::vector<int>{0});\n}\n\nTEST_CASE(\"0 이하는 빈 벡터\") {\n    auto p = make_list(0);\n    REQUIRE(p != nullptr);\n    REQUIRE(p->empty());\n    auto q = make_list(-2);\n    REQUIRE(q->empty());\n}\n" },
      ex: "채워 둔 지역 벡터 v 를 버리고, make_unique<vector<int>>(n) 으로 '0 이 n 개 든 벡터' 를 새로 만들고 있습니다. vector 의 그 생성자는 '크기 n' 이라는 뜻이에요. 스마트 포인터를 먼저 만들고 그 안을 채워야 합니다.",
    },
  ],
},
];
