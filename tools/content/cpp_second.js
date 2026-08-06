/* C++ 실습 2차 — 실습이 하나도 없던 6개 유닛을 연다.

   이동 의미론 · STL 과 반복자 · 가상 함수 · 연산자 오버로딩 · 예외 안전성 ·
   생성자와 초기화 리스트.

   C 와 같은 원칙: 시작 코드의 실패가 정의되지 않은 동작에 기대면 안 된다.
   무효화된 반복자를 읽거나 이동한 객체를 다시 쓰는 식으로 틀리게 만들면 어떤
   기계에서는 우연히 통과한다. 그래서 여기서는 컴파일이 거부하거나, 세어 둔 복사
   횟수가 다르거나, 결과 벡터의 크기가 다른 식으로 **반드시** 드러나게 했다.

   채점은 러너가 깔아 주는 catch2 로 한다. 클래스는 sol.cpp 안에 통째로 있으므로
   테스트에서 다시 선언하지 않고 그대로 포함해 한 덩어리로 컴파일한다.
   테스트에서 클래스를 다시 적을 수는 없다 — 고쳐야 할 대상이 바로 그 클래스라,
   답을 미리 적어 두는 셈이 되고 학습자가 고친 것과도 어긋난다.

   그래서 sol.cpp 의 자유 함수와 정적 멤버에는 inline 을 붙였다. 러너가 sol.cpp 와
   test.cpp 를 함께 컴파일하는데 test.cpp 가 sol.cpp 를 포함하므로, inline 이 없으면
   정의가 둘이 되어 링크가 거부한다 — 검증기가 7건을 그렇게 잡아 줬다. */
module.exports = [
/* ── 이동 의미론과 복사 생략 (심화) ───────────────────────── */
{
  unit: "이동 의미론과 복사 생략 (심화)",
  lesson: "직접 짜 보기 — 복사하지 않고 옮기기",
  th: {
    sum: "`std::move` 는 옮기는 것이 아니라 **'옮겨도 된다'고 표시하는 것**이다. 표시가 없으면 컴파일러는 복사한다.",
    body: [
      { h: "이름이 붙은 값은 복사된다", t: "`void f(T t) { v.push_back(t); }` 에서 `t` 는 이름이 있으니 복사된다. 어차피 함수가 끝나면 사라질 값인데도 그렇다. `std::move(t)` 로 표시해 줘야 옮겨 간다 — 큰 문자열이나 벡터에서 이 한 단어가 성능을 가른다." },
      { h: "생성자에서도 마찬가지다", t: "`Holder(std::vector<T> d) : data_(d) {}` 는 매개변수를 한 번 만들고 멤버로 또 복사한다. `data_(std::move(d))` 로 쓰면 복사가 사라진다. '값으로 받아서 옮겨 담기' 가 요즘 C++ 의 기본 모양이다." },
      { h: "복사할 수 없는 것도 있다", t: "`std::unique_ptr` 은 아예 복사가 금지되어 있다. 그래서 그냥 넣으려 하면 **컴파일이 거부한다.** 이건 불편한 게 아니라, 소유권이 둘로 나뉘는 사고를 컴파일 단계에서 막아 주는 것이다." },
    ],
    code: { c: "v.push_back(std::move(t));          // 옮겨도 된다고 표시\nHolder(std::vector<int> d) : data_(std::move(d)) {}\nv.push_back(std::move(p));          // unique_ptr 은 이것만 된다", cap: "표시가 없으면 복사한다" },
    key: ["이름 붙은 값은 복사된다", "`std::move` 는 표시일 뿐", "`unique_ptr` 은 이동만 된다"],
  },
  q: [
    {
      k: "store · 복사하지 말고 옮겨 담기",
      qq: "받은 값을 벡터에 <b>복사 없이</b> 넣으세요. 복사 생성자가 한 번도 불리면 안 됩니다.",
      src: "#include <vector>\n\nstruct Tracked {\n    int v = 0;\n    static inline int copies = 0;\n    static inline int moves = 0;\n    Tracked() {}\n    explicit Tracked(int x) : v(x) {}\n    Tracked(const Tracked& o) : v(o.v) { ++copies; }\n    Tracked(Tracked&& o) noexcept : v(o.v) { ++moves; }\n    Tracked& operator=(const Tracked&) = default;\n    Tracked& operator=(Tracked&&) = default;\n};\n\ninline void store(std::vector<Tracked>& v, Tracked t) {\n    v.push_back(t);\n}\n",
      sol: "#include <vector>\n#include <utility>\n\nstruct Tracked {\n    int v = 0;\n    static inline int copies = 0;\n    static inline int moves = 0;\n    Tracked() {}\n    explicit Tracked(int x) : v(x) {}\n    Tracked(const Tracked& o) : v(o.v) { ++copies; }\n    Tracked(Tracked&& o) noexcept : v(o.v) { ++moves; }\n    Tracked& operator=(const Tracked&) = default;\n    Tracked& operator=(Tracked&&) = default;\n};\n\ninline void store(std::vector<Tracked>& v, Tracked t) {\n    v.push_back(std::move(t));\n}\n",
      test: { "test.cpp": "/* 클래스가 sol.cpp 안에 있으므로 그대로 포함해 한 덩어리로 컴파일한다 */\n#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"값은 제대로 들어간다\") {\n    std::vector<Tracked> v;\n    v.reserve(4);\n    store(v, Tracked(7));\n    REQUIRE(v.size() == 1);\n    REQUIRE(v[0].v == 7);\n}\n\nTEST_CASE(\"복사가 일어나면 안 된다\") {\n    std::vector<Tracked> v;\n    v.reserve(4);\n    Tracked::copies = 0;\n    Tracked::moves = 0;\n    store(v, Tracked(1));\n    store(v, Tracked(2));\n    REQUIRE(Tracked::copies == 0);\n    REQUIRE(Tracked::moves == 2);\n}\n" },
      ex: "t 는 이름이 붙은 값이라, 어차피 함수가 끝나면 사라질 것인데도 컴파일러는 복사합니다. std::move 로 '옮겨도 된다' 고 표시해 줘야 옮겨 가요. (미리 reserve 해 둔 것은 자리를 늘리며 생기는 이동을 세지 않기 위해서입니다.)",
    },
    {
      k: "Holder · 멤버로 옮겨 담기",
      qq: "받은 벡터를 멤버로 <b>복사 없이</b> 담으세요.",
      src: "#include <vector>\n\nstruct Tracked {\n    int v = 0;\n    static inline int copies = 0;\n    static inline int moves = 0;\n    Tracked() {}\n    explicit Tracked(int x) : v(x) {}\n    Tracked(const Tracked& o) : v(o.v) { ++copies; }\n    Tracked(Tracked&& o) noexcept : v(o.v) { ++moves; }\n};\n\nclass Holder {\npublic:\n    explicit Holder(std::vector<Tracked> d) : data_(d) {}\n\n    int size() const { return static_cast<int>(data_.size()); }\n\nprivate:\n    std::vector<Tracked> data_;\n};\n",
      sol: "#include <vector>\n#include <utility>\n\nstruct Tracked {\n    int v = 0;\n    static inline int copies = 0;\n    static inline int moves = 0;\n    Tracked() {}\n    explicit Tracked(int x) : v(x) {}\n    Tracked(const Tracked& o) : v(o.v) { ++copies; }\n    Tracked(Tracked&& o) noexcept : v(o.v) { ++moves; }\n};\n\nclass Holder {\npublic:\n    explicit Holder(std::vector<Tracked> d) : data_(std::move(d)) {}\n\n    int size() const { return static_cast<int>(data_.size()); }\n\nprivate:\n    std::vector<Tracked> data_;\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"내용은 그대로 담긴다\") {\n    std::vector<Tracked> src;\n    src.reserve(2);\n    src.emplace_back(1);\n    src.emplace_back(2);\n    Holder h(std::move(src));\n    REQUIRE(h.size() == 2);\n}\n\nTEST_CASE(\"멤버로 담을 때 복사가 없어야 한다\") {\n    std::vector<Tracked> src;\n    src.reserve(2);\n    src.emplace_back(1);\n    src.emplace_back(2);\n    Tracked::copies = 0;\n    Holder h(std::move(src));\n    REQUIRE(h.size() == 2);\n    REQUIRE(Tracked::copies == 0);\n}\n" },
      ex: "값으로 받은 매개변수를 멤버 초기화에 그대로 쓰면 한 번 더 복사됩니다. 벡터 안의 원소가 전부 복사돼요. std::move 로 옮겨 담으면 안쪽 버퍼의 주인만 바뀌어 복사가 하나도 없습니다.",
    },
    {
      k: "collect · 복사할 수 없는 것 넘기기",
      qq: "<code>std::unique_ptr</code> 을 벡터에 담아 돌려주세요. 소유권은 <b>하나</b>여야 합니다.",
      src: "#include <memory>\n#include <vector>\n\nstd::vector<std::unique_ptr<int>> collect(std::unique_ptr<int> p) {\n    std::vector<std::unique_ptr<int>> out;\n    out.push_back(p);\n    return out;\n}\n",
      sol: "#include <memory>\n#include <utility>\n#include <vector>\n\nstd::vector<std::unique_ptr<int>> collect(std::unique_ptr<int> p) {\n    std::vector<std::unique_ptr<int>> out;\n    out.push_back(std::move(p));\n    return out;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <memory>\n#include <utility>\n#include <vector>\n\nstd::vector<std::unique_ptr<int>> collect(std::unique_ptr<int> p);\n\nTEST_CASE(\"값이 담긴다\") {\n    auto v = collect(std::make_unique<int>(42));\n    REQUIRE(v.size() == 1);\n    REQUIRE(*v[0] == 42);\n}\n\nTEST_CASE(\"여러 번 불러도 각각 담긴다\") {\n    auto a = collect(std::make_unique<int>(1));\n    auto b = collect(std::make_unique<int>(2));\n    REQUIRE(*a[0] == 1);\n    REQUIRE(*b[0] == 2);\n}\n" },
      ex: "unique_ptr 은 복사가 아예 금지돼 있어서, 그냥 넣으려 하면 컴파일이 거부합니다. 불편한 게 아니라 '주인이 둘이 되는' 사고를 컴파일 단계에서 막아 주는 거예요. std::move 로 주인을 넘겨야 합니다.",
    },
  ],
},
/* ── STL 컨테이너와 반복자 무효화 (심화) ──────────────────── */
{
  unit: "STL 컨테이너와 반복자 무효화 (심화)",
  lesson: "직접 짜 보기 — 지우면서 순회하기",
  th: {
    sum: "컨테이너에서 지우면서 도는 것은 생각보다 까다롭다. **지운 자리 뒤가 앞으로 당겨지기** 때문이다.",
    body: [
      { h: "지우고 나서 i++ 하면 하나를 건너뛴다", t: "`v[i]` 를 지우면 뒤에 있던 값이 `i` 자리로 온다. 그런데 반복문이 `i++` 를 하면 그 값을 보지 못하고 지나간다. 지운 뒤에는 **i 를 올리지 않아야** 한다. 값이 두 개 붙어 있을 때만 틀려서 찾기도 어렵다." },
      { h: "erase-remove 관용구", t: "`std::remove` 는 지우는 게 아니라 남길 값을 앞으로 몰아 놓고 **새 끝** 자리를 알려 준다. 그래서 `v.erase(std::remove(...), v.end())` 처럼 두 단계로 써야 진짜 줄어든다. `remove` 만 부르면 크기가 그대로다." },
      { h: "map 의 [] 는 없는 키를 만든다", t: "`m[k]` 는 키가 없으면 **기본값으로 만들어 넣는다.** 읽기만 하려던 코드가 조용히 맵을 키운다. 읽을 때는 `find` 나 `count` 를 쓴다." },
    ],
    code: { c: "v.erase(std::remove(v.begin(), v.end(), x), v.end());\n\nauto it = m.find(k);\nreturn it == m.end() ? def : it->second;   // m[k] 는 넣어 버린다", cap: "지우기와 읽기 모두 함정이 있다" },
    key: ["지운 뒤에는 i 를 올리지 않는다", "`remove` 뒤에 `erase`", "`m[k]` 는 없는 키를 만든다"],
  },
  q: [
    {
      k: "remove_all · 붙어 있는 값도 빠뜨리지 않기",
      qq: "벡터에서 <code>x</code> 와 같은 값을 <b>모두</b> 지우세요. 같은 값이 <b>이어서</b> 있어도 다 지워져야 합니다.",
      src: "#include <vector>\n\nvoid remove_all(std::vector<int>& v, int x) {\n    for (std::size_t i = 0; i < v.size(); ++i) {\n        if (v[i] == x) {\n            v.erase(v.begin() + static_cast<long>(i));\n        }\n    }\n}\n",
      sol: "#include <algorithm>\n#include <vector>\n\nvoid remove_all(std::vector<int>& v, int x) {\n    v.erase(std::remove(v.begin(), v.end(), x), v.end());\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n\nvoid remove_all(std::vector<int>& v, int x);\n\nTEST_CASE(\"떨어져 있는 값\") {\n    std::vector<int> v{1, 2, 3, 2};\n    remove_all(v, 2);\n    REQUIRE(v == std::vector<int>{1, 3});\n}\n\nTEST_CASE(\"이어서 붙어 있는 값도 다 지워야 한다\") {\n    std::vector<int> v{1, 2, 2, 3};\n    remove_all(v, 2);\n    REQUIRE(v == std::vector<int>{1, 3});\n}\n\nTEST_CASE(\"전부 같은 값\") {\n    std::vector<int> v{5, 5, 5};\n    remove_all(v, 5);\n    REQUIRE(v.empty());\n}\n\nTEST_CASE(\"없는 값이면 그대로\") {\n    std::vector<int> v{1, 2};\n    remove_all(v, 9);\n    REQUIRE(v == std::vector<int>{1, 2});\n}\n" },
      ex: "지우면 뒤에 있던 값이 그 자리로 당겨 오는데, 반복문은 그대로 i++ 를 합니다. 그래서 붙어 있는 두 번째 값을 건너뛰어요. erase-remove 관용구는 이 문제 자체를 없앱니다.",
    },
    {
      k: "dedupe · 정렬하고 중복 지우기",
      qq: "벡터를 <b>정렬</b>하고 <b>중복을 없애</b> 주세요. 크기도 실제로 줄어야 합니다.",
      src: "#include <algorithm>\n#include <vector>\n\nvoid dedupe(std::vector<int>& v) {\n    std::sort(v.begin(), v.end());\n    std::unique(v.begin(), v.end());\n}\n",
      sol: "#include <algorithm>\n#include <vector>\n\nvoid dedupe(std::vector<int>& v) {\n    std::sort(v.begin(), v.end());\n    v.erase(std::unique(v.begin(), v.end()), v.end());\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <vector>\n\nvoid dedupe(std::vector<int>& v);\n\nTEST_CASE(\"정렬되고 중복이 사라진다\") {\n    std::vector<int> v{3, 1, 3, 2, 1};\n    dedupe(v);\n    REQUIRE(v == std::vector<int>{1, 2, 3});\n}\n\nTEST_CASE(\"이미 정리된 것은 그대로\") {\n    std::vector<int> v{1, 2, 3};\n    dedupe(v);\n    REQUIRE(v == std::vector<int>{1, 2, 3});\n}\n\nTEST_CASE(\"빈 벡터\") {\n    std::vector<int> v;\n    dedupe(v);\n    REQUIRE(v.empty());\n}\n" },
      ex: "std::unique 는 값을 지우지 않습니다. 남길 값을 앞으로 몰아 놓고 '여기까지가 새 끝' 이라고 알려 줄 뿐이에요. 그 자리부터 끝까지를 erase 해야 크기가 실제로 줄어듭니다.",
    },
    {
      k: "get_or · 없는 키를 만들지 않기",
      qq: "맵에서 값을 읽되, 키가 없으면 <code>def</code> 를 돌려주세요. <b>맵의 크기가 늘어나면 안 됩니다.</b>",
      src: "#include <map>\n#include <string>\n\nint get_or(std::map<std::string, int>& m, const std::string& k, int def) {\n    if (m[k] == 0) return def;\n    return m[k];\n}\n",
      sol: "#include <map>\n#include <string>\n\nint get_or(std::map<std::string, int>& m, const std::string& k, int def) {\n    auto it = m.find(k);\n    if (it == m.end()) return def;\n    return it->second;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <map>\n#include <string>\n\nint get_or(std::map<std::string, int>& m, const std::string& k, int def);\n\nTEST_CASE(\"있으면 그 값\") {\n    std::map<std::string, int> m{{\"a\", 5}};\n    REQUIRE(get_or(m, \"a\", -1) == 5);\n}\n\nTEST_CASE(\"없으면 기본값이고 맵은 그대로\") {\n    std::map<std::string, int> m{{\"a\", 5}};\n    REQUIRE(get_or(m, \"b\", -1) == -1);\n    REQUIRE(m.size() == 1);\n}\n\nTEST_CASE(\"0 이 저장돼 있으면 0 을 돌려준다\") {\n    std::map<std::string, int> m{{\"zero\", 0}};\n    REQUIRE(get_or(m, \"zero\", -1) == 0);\n}\n" },
      ex: "m[k] 는 키가 없으면 0 을 만들어 넣습니다. 읽기만 하려던 코드가 맵을 키우고, 게다가 저장된 0 과 없는 키를 구분하지 못해요. 읽을 때는 find 를 씁니다.",
    },
  ],
},
/* ── 가상 함수와 다형성 (심화) ────────────────────────────── */
{
  unit: "가상 함수와 다형성 (심화)",
  lesson: "직접 짜 보기 — 실제 객체가 답하게 하기",
  th: {
    sum: "`virtual` 이 붙어야 **실제 객체**의 함수가 불린다. 안 붙으면 참조·포인터의 타입으로 정해진다.",
    body: [
      { h: "virtual 이 없으면 기반 것이 불린다", t: "`const Animal&` 로 받아 `sound()` 를 부를 때, `virtual` 이 없으면 컴파일 시점에 `Animal::sound` 로 못 박힌다. 실제로 개를 넘겨도 개 소리가 안 난다. 상속을 써 놓고 다형성이 안 되는 흔한 모양이다." },
      { h: "const 하나만 달라도 재정의가 아니다", t: "기반이 `virtual int f() const` 인데 파생이 `int f()` 라고 쓰면, 서명이 달라 **다른 함수**가 된다. `override` 를 붙여 두면 컴파일러가 '재정의할 것이 없다' 고 바로 알려 준다 — 붙이는 습관 하나로 이 사고가 사라진다." },
      { h: "분기 대신 물어본다", t: "`dynamic_cast` 로 종류를 하나씩 따지면 종류가 늘 때마다 이 자리를 고쳐야 하고, 잊으면 조용히 빠뜨린다. 각 파생이 자기 답을 아는 가상 함수를 두면 부르는 쪽은 그냥 물어보면 된다." },
    ],
    code: { c: "struct Animal {\n    virtual ~Animal() = default;\n    virtual std::string sound() const = 0;\n};\n\nstruct Dog : Animal {\n    std::string sound() const override { return \"멍멍\"; }\n};", cap: "virtual + override 를 같이 쓴다" },
    key: ["`virtual` 이 있어야 실제 객체가 답한다", "서명이 다르면 재정의가 아니다", "`override` 를 붙인다"],
  },
  q: [
    {
      k: "speak · 개는 개 소리를 내야 한다",
      qq: "<code>const Animal&</code> 로 받아도 <b>실제 객체</b>의 소리가 나게 하세요.",
      src: "#include <string>\n\nstruct Animal {\n    virtual ~Animal() = default;\n    std::string sound() const { return \"...\"; }\n};\n\nstruct Dog : Animal {\n    std::string sound() const { return \"멍멍\"; }\n};\n\nstruct Cat : Animal {\n    std::string sound() const { return \"야옹\"; }\n};\n\ninline std::string speak(const Animal& a) {\n    return a.sound();\n}\n",
      sol: "#include <string>\n\nstruct Animal {\n    virtual ~Animal() = default;\n    virtual std::string sound() const { return \"...\"; }\n};\n\nstruct Dog : Animal {\n    std::string sound() const override { return \"멍멍\"; }\n};\n\nstruct Cat : Animal {\n    std::string sound() const override { return \"야옹\"; }\n};\n\ninline std::string speak(const Animal& a) {\n    return a.sound();\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"개\") {\n    Dog d;\n    REQUIRE(speak(d) == \"멍멍\");\n}\n\nTEST_CASE(\"고양이\") {\n    Cat c;\n    REQUIRE(speak(c) == \"야옹\");\n}\n\nTEST_CASE(\"기반은 기반대로\") {\n    Animal a;\n    REQUIRE(speak(a) == \"...\");\n}\n" },
      ex: "virtual 이 없으면 컴파일 시점에 Animal::sound 로 못 박힙니다. 개를 넘겨도 개 소리가 안 나요. 상속을 써 놓고 다형성이 안 되는 가장 흔한 모양입니다.",
    },
    {
      k: "score · const 를 맞춰야 재정의가 된다",
      qq: "파생이 정한 점수가 나오게 하세요. <b>서명이 정확히 같아야</b> 재정의입니다.",
      src: "struct Base {\n    virtual ~Base() = default;\n    virtual int score() const { return 0; }\n};\n\nstruct Bonus : Base {\n    int score() { return 10; }\n};\n\ninline int score_of(const Base& b) {\n    return b.score();\n}\n",
      sol: "struct Base {\n    virtual ~Base() = default;\n    virtual int score() const { return 0; }\n};\n\nstruct Bonus : Base {\n    int score() const override { return 10; }\n};\n\ninline int score_of(const Base& b) {\n    return b.score();\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"파생이 정한 점수가 나와야 한다\") {\n    Bonus b;\n    REQUIRE(score_of(b) == 10);\n}\n\nTEST_CASE(\"기반은 0\") {\n    Base b;\n    REQUIRE(score_of(b) == 0);\n}\n" },
      ex: "기반은 const 인데 파생이 const 를 빼면 서명이 달라 아예 다른 함수가 됩니다. 컴파일도 되고 실행도 되는데 기반 것이 불려요. override 를 붙여 두면 컴파일러가 바로 잡아 줍니다.",
    },
    {
      k: "total · 종류를 따지지 않고 더하기",
      qq: "도형들의 넓이를 모두 더하세요. <b>도형이 늘어도</b> 이 함수는 고치지 않아도 되게 하세요.",
      src: "#include <vector>\n\nstruct Shape {\n    virtual ~Shape() = default;\n    virtual double area() const = 0;\n};\n\nstruct Rect : Shape {\n    double w, h;\n    Rect(double w_, double h_) : w(w_), h(h_) {}\n    double area() const override { return w * h; }\n};\n\nstruct Square : Shape {\n    double a;\n    explicit Square(double a_) : a(a_) {}\n    double area() const override { return a * a; }\n};\n\ninline double total(const std::vector<const Shape*>& ss) {\n    double sum = 0;\n    for (const Shape* s : ss) {\n        if (const Rect* r = dynamic_cast<const Rect*>(s)) sum += r->w * r->h;\n    }\n    return sum;\n}\n",
      sol: "#include <vector>\n\nstruct Shape {\n    virtual ~Shape() = default;\n    virtual double area() const = 0;\n};\n\nstruct Rect : Shape {\n    double w, h;\n    Rect(double w_, double h_) : w(w_), h(h_) {}\n    double area() const override { return w * h; }\n};\n\nstruct Square : Shape {\n    double a;\n    explicit Square(double a_) : a(a_) {}\n    double area() const override { return a * a; }\n};\n\ninline double total(const std::vector<const Shape*>& ss) {\n    double sum = 0;\n    for (const Shape* s : ss) sum += s->area();\n    return sum;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"사각형만\") {\n    Rect r(2, 3);\n    std::vector<const Shape*> v{&r};\n    REQUIRE(total(v) == Approx(6.0));\n}\n\nTEST_CASE(\"정사각형도 세어야 한다\") {\n    Square s(2);\n    std::vector<const Shape*> v{&s};\n    REQUIRE(total(v) == Approx(4.0));\n}\n\nTEST_CASE(\"섞여 있어도\") {\n    Rect r(2, 3);\n    Square s(2);\n    std::vector<const Shape*> v{&r, &s};\n    REQUIRE(total(v) == Approx(10.0));\n}\n" },
      ex: "dynamic_cast 로 종류를 따지면 도형이 하나 늘 때마다 이 함수를 또 고쳐야 하고, 잊으면 조용히 0 으로 세어집니다. 각 도형이 자기 넓이를 아니 그냥 물어보면 돼요.",
    },
  ],
},
/* ── 연산자 오버로딩과 값 의미론 (심화) ───────────────────── */
{
  unit: "연산자 오버로딩과 값 의미론 (심화)",
  lesson: "직접 짜 보기 — 숫자처럼 행동하게 만들기",
  th: {
    sum: "연산자를 만들 때는 **내장 타입이 하는 대로** 따라야 한다. `a + b` 가 `a` 를 바꾸면 아무도 그 코드를 못 읽는다.",
    body: [
      { h: "+ 는 아무것도 바꾸지 않는다", t: "`3 + 4` 가 3을 바꾸지 않듯이, `operator+` 도 양쪽을 그대로 두고 **새 값**을 돌려줘야 한다. `const` 멤버 함수로 만들면 컴파일러가 이 약속을 지켜 준다. 바꾸는 것은 `+=` 의 몫이다." },
      { h: "읽기 전용 자리에서도 쓸 수 있어야 한다", t: "`operator[]` 를 비-const 버전만 만들면, `const` 객체나 `const&` 로 받은 자리에서는 아예 못 쓴다. 읽기용(`const`)과 쓰기용 두 벌을 두는 것이 관례다." },
      { h: "출력은 ostream 으로", t: "`operator<<` 를 만들어 두면 `std::cout` 뿐 아니라 문자열 스트림·파일에도 같은 방식으로 나간다. 형식을 한 곳에만 적어 두게 되어, 나중에 바꿀 때도 한 곳만 고친다." },
    ],
    code: { c: "Vec2 operator+(const Vec2& o) const {   // const — 나를 안 바꾼다\n    return Vec2(x + o.x, y + o.y);\n}\n\nint operator[](int i) const;   // 읽기용\nint& operator[](int i);        // 쓰기용", cap: "내장 타입이 하는 대로" },
    key: ["`+` 는 새 값을 만든다", "`[]` 는 const 판도 만든다", "출력은 `operator<<`"],
  },
  q: [
    {
      k: "operator+ · 왼쪽 값을 건드리지 않기",
      qq: "두 벡터를 더한 <b>새 값</b>을 돌려주세요. <code>a + b</code> 를 해도 <code>a</code> 는 그대로여야 합니다.",
      src: "struct Vec2 {\n    int x = 0, y = 0;\n    Vec2() {}\n    Vec2(int x_, int y_) : x(x_), y(y_) {}\n\n    Vec2 operator+(const Vec2& o) {\n        x += o.x;\n        y += o.y;\n        return *this;\n    }\n};\n",
      sol: "struct Vec2 {\n    int x = 0, y = 0;\n    Vec2() {}\n    Vec2(int x_, int y_) : x(x_), y(y_) {}\n\n    Vec2 operator+(const Vec2& o) const {\n        return Vec2(x + o.x, y + o.y);\n    }\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"더한 값이 나온다\") {\n    Vec2 a(1, 2), b(10, 20);\n    Vec2 c = a + b;\n    REQUIRE(c.x == 11);\n    REQUIRE(c.y == 22);\n}\n\nTEST_CASE(\"왼쪽 값은 그대로여야 한다\") {\n    Vec2 a(1, 2), b(10, 20);\n    Vec2 c = a + b;\n    REQUIRE(a.x == 1);\n    REQUIRE(a.y == 2);\n}\n\nTEST_CASE(\"const 객체에서도 더할 수 있어야 한다\") {\n    const Vec2 a(1, 2);\n    const Vec2 b(3, 4);\n    Vec2 c = a + b;\n    REQUIRE(c.x == 4);\n}\n" },
      ex: "3 + 4 가 3 을 바꾸지 않듯이 operator+ 도 양쪽을 그대로 둬야 합니다. const 멤버 함수로 만들면 실수로 고치는 코드가 컴파일 단계에서 막혀요.",
    },
    {
      k: "operator[] · 읽기 전용 자리에서도",
      qq: "<code>const</code> 객체에서도 <code>[]</code> 로 읽을 수 있게 하세요. 쓰기도 그대로 되어야 합니다.",
      src: "#include <vector>\n\nclass Row {\npublic:\n    explicit Row(int n) : data_(static_cast<std::size_t>(n), 0) {}\n\n    int& operator[](int i) { return data_[static_cast<std::size_t>(i)]; }\n\n    int size() const { return static_cast<int>(data_.size()); }\n\nprivate:\n    std::vector<int> data_;\n};\n",
      sol: "#include <vector>\n\nclass Row {\npublic:\n    explicit Row(int n) : data_(static_cast<std::size_t>(n), 0) {}\n\n    int& operator[](int i) { return data_[static_cast<std::size_t>(i)]; }\n\n    int operator[](int i) const { return data_[static_cast<std::size_t>(i)]; }\n\n    int size() const { return static_cast<int>(data_.size()); }\n\nprivate:\n    std::vector<int> data_;\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nstatic int first_of(const Row& r) { return r[0]; }\n\nTEST_CASE(\"쓰고 읽을 수 있다\") {\n    Row r(3);\n    r[0] = 7;\n    REQUIRE(r[0] == 7);\n    REQUIRE(r.size() == 3);\n}\n\nTEST_CASE(\"const 참조로 받아도 읽을 수 있어야 한다\") {\n    Row r(3);\n    r[0] = 9;\n    REQUIRE(first_of(r) == 9);\n}\n\nTEST_CASE(\"const 객체에서도\") {\n    const Row r(2);\n    REQUIRE(r[1] == 0);\n}\n" },
      ex: "비-const 버전만 있으면 const 객체나 const& 로 받은 자리에서는 아예 쓸 수 없습니다. 읽기용과 쓰기용 두 벌을 두는 것이 관례예요.",
    },
    {
      k: "operator<< · 한 곳에만 형식을 적기",
      qq: "<code>(x, y)</code> 형식으로 스트림에 나가게 하세요. <code>std::ostringstream</code> 에도 같은 글자가 나와야 합니다.",
      src: "#include <ostream>\n\nstruct Point {\n    int x = 0, y = 0;\n    Point() {}\n    Point(int x_, int y_) : x(x_), y(y_) {}\n};\n\ninline std::ostream& operator<<(std::ostream& os, const Point& p) {\n    os << p.x << \",\" << p.y;\n    return os;\n}\n",
      sol: "#include <ostream>\n\nstruct Point {\n    int x = 0, y = 0;\n    Point() {}\n    Point(int x_, int y_) : x(x_), y(y_) {}\n};\n\ninline std::ostream& operator<<(std::ostream& os, const Point& p) {\n    os << \"(\" << p.x << \", \" << p.y << \")\";\n    return os;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n#include <sstream>\n#include <string>\n\nstatic std::string text(const Point& p) {\n    std::ostringstream os;\n    os << p;\n    return os.str();\n}\n\nTEST_CASE(\"형식이 맞아야 한다\") {\n    REQUIRE(text(Point(1, 2)) == \"(1, 2)\");\n}\n\nTEST_CASE(\"음수도\") {\n    REQUIRE(text(Point(-1, 0)) == \"(-1, 0)\");\n}\n\nTEST_CASE(\"이어서 쓸 수 있어야 한다\") {\n    std::ostringstream os;\n    os << Point(1, 2) << \"!\";\n    REQUIRE(os.str() == \"(1, 2)!\");\n}\n" },
      ex: "형식을 여기 한 곳에만 적어 두면 화면·파일·문자열 어디로 내보내든 같은 모양이 나옵니다. 그리고 스트림을 돌려줘야 << 를 이어서 쓸 수 있어요.",
    },
  ],
},
/* ── 예외 안전성과 오류 처리 (심화) ───────────────────────── */
{
  unit: "예외 안전성과 오류 처리 (심화)",
  lesson: "직접 짜 보기 — 터져도 망가지지 않게",
  th: {
    sum: "예외가 나도 **자료가 반쯤 고쳐진 채로 남으면 안 된다.** 이것이 '강한 보장' 이다.",
    body: [
      { h: "먼저 복사하고, 다 되면 바꾼다", t: "원본을 직접 고치다 중간에 예외가 나면, 앞부분만 바뀐 이상한 상태가 남는다. 복사본에서 다 해 보고 **성공했을 때만** 원본과 바꿔치기(swap)하면, 실패해도 원본은 처음 그대로다." },
      { h: "예외는 참조로 잡는다", t: "`catch (std::exception e)` 처럼 값으로 잡으면 파생 예외가 기반으로 **잘려 나간다**(슬라이싱). 정작 필요한 상세 메시지가 사라진다. 언제나 `catch (const std::exception& e)` 다." },
      { h: "잘못된 입력은 던져서 알린다", t: "0으로 나눌 수 없는데 0을 돌려주면, 부른 쪽은 진짜 0인지 실패인지 알 수 없다. `throw std::invalid_argument(...)` 로 알리면 못 본 척 지나갈 수 없다." },
    ],
    code: { c: "std::vector<int> tmp = v;   // 복사본에서 다 해 보고\n... // 여기서 예외가 나도 v 는 그대로\nv.swap(tmp);                // 성공했을 때만 바꿔치기\n\ncatch (const std::exception& e)   // 반드시 참조로", cap: "성공했을 때만 바꾼다" },
    key: ["복사본에서 하고 swap", "예외는 참조로 잡는다", "실패는 던져서 알린다"],
  },
  q: [
    {
      k: "safe_div · 못 하면 던져서 알리기",
      qq: "나눈 값을 돌려주되, <code>b</code> 가 0이면 <code>std::invalid_argument</code> 를 던지세요.",
      src: "#include <stdexcept>\n\nint safe_div(int a, int b) {\n    if (b == 0) return 0;\n    return a / b;\n}\n",
      sol: "#include <stdexcept>\n\nint safe_div(int a, int b) {\n    if (b == 0) throw std::invalid_argument(\"0으로 나눌 수 없다\");\n    return a / b;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <stdexcept>\n\nint safe_div(int a, int b);\n\nTEST_CASE(\"보통 나눗셈\") {\n    REQUIRE(safe_div(7, 2) == 3);\n    REQUIRE(safe_div(-6, 3) == -2);\n}\n\nTEST_CASE(\"0으로 나누면 던져야 한다\") {\n    REQUIRE_THROWS_AS(safe_div(1, 0), std::invalid_argument);\n}\n" },
      ex: "0 을 돌려주면 부른 쪽은 진짜 0 인지 실패인지 구분할 수 없습니다. 던져서 알리면 못 본 척 지나갈 수 없어요 — 실패를 조용히 값으로 둔갑시키지 않는 것이 핵심입니다.",
    },
    {
      k: "reason · 예외는 참조로 잡기",
      qq: "던져진 예외의 <b>원래 메시지</b>를 돌려주세요. 파생 예외의 메시지가 그대로 나와야 합니다.",
      src: "#include <stdexcept>\n#include <string>\n\nstd::string reason(void (*f)()) {\n    try {\n        f();\n    } catch (std::exception e) {\n        return e.what();\n    }\n    return \"\";\n}\n",
      sol: "#include <stdexcept>\n#include <string>\n\nstd::string reason(void (*f)()) {\n    try {\n        f();\n    } catch (const std::exception& e) {\n        return e.what();\n    }\n    return \"\";\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <stdexcept>\n#include <string>\n\nstd::string reason(void (*f)());\n\nstatic void boom() { throw std::runtime_error(\"디스크가 가득 찼다\"); }\nstatic void fine() {}\n\nTEST_CASE(\"파생 예외의 메시지가 그대로 나와야 한다\") {\n    REQUIRE(reason(boom) == std::string(\"디스크가 가득 찼다\"));\n}\n\nTEST_CASE(\"안 터지면 빈 문자열\") {\n    REQUIRE(reason(fine) == std::string(\"\"));\n}\n" },
      ex: "값으로 잡으면 파생 예외가 기반으로 잘려 나갑니다(슬라이싱). 정작 필요한 상세 메시지가 사라지고 밋밋한 기본 문구만 남아요. 예외는 언제나 const 참조로 잡습니다.",
    },
    {
      k: "double_all · 터져도 원본은 그대로",
      qq: "모든 값을 두 배로 만들되, 음수를 만나면 <code>std::invalid_argument</code> 를 던지세요. <b>던졌을 때 원본은 하나도 바뀌면 안 됩니다.</b>",
      src: "#include <stdexcept>\n#include <vector>\n\nvoid double_all(std::vector<int>& v) {\n    for (std::size_t i = 0; i < v.size(); ++i) {\n        if (v[i] < 0) throw std::invalid_argument(\"음수\");\n        v[i] *= 2;\n    }\n}\n",
      sol: "#include <stdexcept>\n#include <vector>\n\nvoid double_all(std::vector<int>& v) {\n    std::vector<int> tmp = v;\n    for (std::size_t i = 0; i < tmp.size(); ++i) {\n        if (tmp[i] < 0) throw std::invalid_argument(\"음수\");\n        tmp[i] *= 2;\n    }\n    v.swap(tmp);\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include <stdexcept>\n#include <vector>\n\nvoid double_all(std::vector<int>& v);\n\nTEST_CASE(\"보통은 두 배가 된다\") {\n    std::vector<int> v{1, 2, 3};\n    double_all(v);\n    REQUIRE(v == std::vector<int>{2, 4, 6});\n}\n\nTEST_CASE(\"음수를 만나면 던진다\") {\n    std::vector<int> v{1, -1};\n    REQUIRE_THROWS_AS(double_all(v), std::invalid_argument);\n}\n\nTEST_CASE(\"던졌으면 원본이 그대로여야 한다\") {\n    std::vector<int> v{1, 2, -1, 4};\n    try {\n        double_all(v);\n    } catch (const std::exception&) {\n    }\n    REQUIRE(v == std::vector<int>{1, 2, -1, 4});\n}\n" },
      ex: "원본을 직접 고치다 중간에 던지면 앞부분만 두 배가 된 이상한 상태가 남습니다. 복사본에서 다 해 보고 성공했을 때만 swap 하면, 실패해도 원본은 처음 그대로예요.",
    },
  ],
},
/* ── 생성자·소멸자 순서와 초기화 리스트 (중급) ────────────── */
{
  unit: "생성자·소멸자 순서와 초기화 리스트 (중급)",
  lesson: "직접 짜 보기 — 만들 때 한 번에 채우기",
  th: {
    sum: "생성자 **몸통에서 대입하는 것**과 **초기화 리스트에서 채우는 것**은 다르다. 앞의 것은 두 번 일한다.",
    body: [
      { h: "몸통에 들어오기 전에 멤버는 이미 만들어져 있다", t: "생성자 몸통에서 `t_ = t;` 라고 쓰면, 멤버는 먼저 기본값으로 만들어지고 그다음 대입된다 — 두 번 일한 것이다. 초기화 리스트에 `: t_(t)` 로 쓰면 처음부터 그 값으로 만들어진다." },
      { h: "const 와 참조는 대입할 수 없다", t: "`const` 멤버나 참조 멤버는 만들어진 뒤에는 바꿀 수 없다. 그래서 몸통에서 대입하면 **컴파일이 거부한다.** 초기화 리스트 말고는 채울 방법이 없다 — 이건 실수가 아니라 언어가 막아 주는 것이다." },
      { h: "위임 생성자로 규칙을 한 곳에", t: "인자가 다른 생성자가 여럿일 때, 같은 검사·같은 기본값을 각각 적으면 언젠가 어긋난다. `C() : C(0) {}` 처럼 다른 생성자에게 넘기면 규칙이 한 곳에만 남는다." },
    ],
    code: { c: "class C {\npublic:\n    explicit C(int n) : n_(n) {}   // 여기서 채운다\n    C() : C(0) {}                  // 규칙은 한 곳에\nprivate:\n    const int n_;\n};", cap: "몸통 대입이 아니라 초기화 리스트" },
    key: ["몸통 대입은 두 번 일한다", "`const`·참조는 리스트로만", "위임 생성자로 규칙을 모은다"],
  },
  q: [
    {
      k: "Config · const 멤버 채우기",
      qq: "<code>const</code> 멤버 <code>port_</code> 를 생성자에서 채우세요.",
      src: "class Config {\npublic:\n    explicit Config(int port) {\n        port_ = port;\n    }\n\n    int port() const { return port_; }\n\nprivate:\n    const int port_;\n};\n",
      sol: "class Config {\npublic:\n    explicit Config(int port) : port_(port) {}\n\n    int port() const { return port_; }\n\nprivate:\n    const int port_;\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"넣은 값이 그대로\") {\n    Config c(8080);\n    REQUIRE(c.port() == 8080);\n}\n\nTEST_CASE(\"다른 값도\") {\n    Config c(80);\n    REQUIRE(c.port() == 80);\n}\n" },
      ex: "const 멤버는 만들어진 뒤에는 바꿀 수 없어서, 몸통에서 대입하면 컴파일이 거부합니다. 실수가 아니라 언어가 막아 주는 거예요 — 채울 자리는 초기화 리스트뿐입니다.",
    },
    {
      k: "Range · 규칙을 한 곳에 모으기",
      qq: "인자 없이 만들면 <code>0~100</code> 이어야 합니다. <b>기본값 규칙이 한 곳에만</b> 있게 하세요.",
      src: "class Range {\npublic:\n    Range(int lo, int hi) : lo_(lo), hi_(hi < lo ? lo : hi) {}\n\n    Range() : lo_(0), hi_(10) {}\n\n    int lo() const { return lo_; }\n\n    int hi() const { return hi_; }\n\nprivate:\n    int lo_;\n    int hi_;\n};\n",
      sol: "class Range {\npublic:\n    Range(int lo, int hi) : lo_(lo), hi_(hi < lo ? lo : hi) {}\n\n    Range() : Range(0, 100) {}\n\n    int lo() const { return lo_; }\n\n    int hi() const { return hi_; }\n\nprivate:\n    int lo_;\n    int hi_;\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"기본은 0~100\") {\n    Range r;\n    REQUIRE(r.lo() == 0);\n    REQUIRE(r.hi() == 100);\n}\n\nTEST_CASE(\"직접 넣은 값\") {\n    Range r(5, 9);\n    REQUIRE(r.lo() == 5);\n    REQUIRE(r.hi() == 9);\n}\n\nTEST_CASE(\"뒤집혀 들어오면 바로잡는다\") {\n    Range r(9, 5);\n    REQUIRE(r.hi() == 9);\n}\n" },
      ex: "생성자마다 규칙을 따로 적으면 언젠가 어긋납니다. 한쪽만 고치고 다른 쪽을 잊거든요. 위임 생성자로 넘기면 검사도 기본값도 한 곳에만 남습니다.",
    },
    {
      k: "Box · 두 번 일하지 않기",
      qq: "받은 값을 멤버에 담되, 멤버가 <b>기본 생성되었다가 다시 대입되는</b> 일이 없게 하세요.",
      src: "struct Tracked {\n    int v = 0;\n    static inline int defaults = 0;\n    static inline int copies = 0;\n    Tracked() { ++defaults; }\n    explicit Tracked(int x) : v(x) {}\n    Tracked(const Tracked& o) : v(o.v) { ++copies; }\n    Tracked& operator=(const Tracked& o) {\n        v = o.v;\n        return *this;\n    }\n};\n\nclass Box {\npublic:\n    explicit Box(const Tracked& t) {\n        t_ = t;\n    }\n\n    int value() const { return t_.v; }\n\nprivate:\n    Tracked t_;\n};\n",
      sol: "struct Tracked {\n    int v = 0;\n    static inline int defaults = 0;\n    static inline int copies = 0;\n    Tracked() { ++defaults; }\n    explicit Tracked(int x) : v(x) {}\n    Tracked(const Tracked& o) : v(o.v) { ++copies; }\n    Tracked& operator=(const Tracked& o) {\n        v = o.v;\n        return *this;\n    }\n};\n\nclass Box {\npublic:\n    explicit Box(const Tracked& t) : t_(t) {}\n\n    int value() const { return t_.v; }\n\nprivate:\n    Tracked t_;\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"값은 제대로 담긴다\") {\n    Tracked t(7);\n    Box b(t);\n    REQUIRE(b.value() == 7);\n}\n\nTEST_CASE(\"기본 생성이 한 번도 없어야 한다\") {\n    Tracked t(1);\n    Tracked::defaults = 0;\n    Box b(t);\n    REQUIRE(b.value() == 1);\n    REQUIRE(Tracked::defaults == 0);\n}\n" },
      ex: "생성자 몸통에 들어올 때는 멤버가 이미 기본값으로 만들어져 있습니다. 거기에 대입하면 만들고 또 덮어쓰는 셈이라 두 번 일해요. 초기화 리스트에 쓰면 처음부터 그 값으로 만들어집니다.",
    },
  ],
},
];
