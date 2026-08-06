/* C++ 3차 — 실습이 하나도 없던 6개 유닛. 러너(g++ -std=c++17 + catch2)가 채점한다.

   러너는 sol.cpp 와 test.cpp 를 함께 컴파일하고, test.cpp 가 sol.cpp 를 include 한다.
   그래서 자유 함수는 inline, 클래스의 정적 데이터 멤버는 static inline 이어야
   중복 정의로 링크가 거부되지 않는다 — 2차에서 일곱 문항이 여기서 걸렸다. */
module.exports = [
/* ── 컨테이너와 클래스 ──────────────────────────────────── */
{
  unit: "컨테이너와 클래스",
  lesson: "직접 짜 보기 — 무엇이 언제 무효가 되는가",
  th: {
    sum: "STL 컨테이너를 쓸 때 가장 자주 데이는 곳은 **반복자와 참조가 언제 무효가 되는가**다.",
    body: [
      { h: "vector 는 늘어나면 통째로 옮긴다", t: "용량이 차면 더 큰 자리를 잡아 전부 복사한다. 그 순간 이전 원소를 가리키던 포인터·참조·반복자가 전부 못 쓰게 된다 — `push_back` 하는 반복문 안에서 참조를 들고 있으면 그날 터진다." },
      { h: "지우면서 도는 건 규칙이 있다", t: "`erase` 는 다음 원소의 반복자를 돌려준다. 그것을 받아 쓰지 않고 `++it` 을 하면 이미 무효가 된 반복자를 올리는 셈이다 — 지우는 반복문은 `it = v.erase(it)` 꼴이 기본이다." },
      { h: "map 은 [] 로 읽으면 만들어 버린다", t: "`m[key]` 는 없으면 기본값으로 만들어 넣는다. 읽기만 하려던 코드가 맵을 키우고, `const map` 에서는 아예 컴파일이 안 된다 — 읽을 땐 `find` 나 `at` 이다." },
      { h: "reserve 는 옮기는 일을 미리 없앤다", t: "몇 개 넣을지 알면 미리 잡아 둔다. 재할당이 사라져 빨라지고, 반복자 무효화도 그만큼 줄어든다." },
    ],
    code: { c: "std::vector<int> v;\nv.reserve(100);              // 미리 잡아 둔다\n\nfor (auto it = v.begin(); it != v.end(); )\n    if (*it % 2) it = v.erase(it);   // 받아서 쓴다\n    else         ++it;\n\nm.find(k)  // 읽기 — m[k] 는 만들어 버린다", cap: "언제 무효가 되는지 안다" },
    key: ["재할당은 반복자를 무효로 만든다", "`erase` 는 다음 반복자를 돌려준다", "`m[k]` 는 읽기가 아니다"],
  },
  q: [
    {
      k: "remove_odds · 지우면서 도는 법",
      qq: "<code>std::vector&lt;int&gt;</code> 에서 <b>홀수를 전부 지우고</b> 남은 개수를 돌려주세요. 벡터도 실제로 줄어야 합니다.",
      src: "#include <vector>\n\ninline int remove_odds(std::vector<int>& v) {\n    for (auto it = v.begin(); it != v.end(); ++it) {\n        if (*it % 2 != 0) v.erase(it);\n    }\n    return static_cast<int>(v.size());\n}\n",
      sol: "#include <vector>\n\ninline int remove_odds(std::vector<int>& v) {\n    for (auto it = v.begin(); it != v.end(); ) {\n        if (*it % 2 != 0) it = v.erase(it);\n        else ++it;\n    }\n    return static_cast<int>(v.size());\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"홀수를 지운다\") {\n    std::vector<int> a{1, 2, 3, 4};\n    REQUIRE(remove_odds(a) == 2);\n    REQUIRE(a == std::vector<int>{2, 4});\n}\n\nTEST_CASE(\"연속된 홀수도 빠짐없이\") {\n    std::vector<int> a{1, 3, 5, 2};\n    REQUIRE(remove_odds(a) == 1);\n    REQUIRE(a == std::vector<int>{2});\n}\n\nTEST_CASE(\"경계\") {\n    std::vector<int> e{};\n    REQUIRE(remove_odds(e) == 0);\n    std::vector<int> all{2, 4};\n    REQUIRE(remove_odds(all) == 2);\n}\n" },
      ex: "`erase` 뒤에 `++it` 을 하면 지운 자리의 다음 원소를 건너뜁니다 — 홀수가 연속으로 있을 때 하나씩 살아남아요. `erase` 가 돌려주는 반복자가 이미 다음을 가리키니, 지운 경우에는 올리지 않는 것이 규칙입니다.",
    },
    {
      k: "count_of · 읽기만 하려던 것이 만든다",
      qq: "<code>const std::map&lt;std::string,int&gt;&</code> 에서 키의 값을 돌려주세요. <b>없으면 0</b> 이고, 맵은 <b>커지면 안 됩니다</b>.",
      src: "#include <map>\n#include <string>\n\ninline int count_of(std::map<std::string, int>& m, const std::string& k) {\n    return m[k];\n}\n",
      sol: "#include <map>\n#include <string>\n\ninline int count_of(const std::map<std::string, int>& m, const std::string& k) {\n    auto it = m.find(k);\n    return it == m.end() ? 0 : it->second;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"있는 키\") {\n    const std::map<std::string, int> m{{\"a\", 3}};\n    REQUIRE(count_of(m, \"a\") == 3);\n}\n\nTEST_CASE(\"없는 키는 0 이고 맵은 그대로다\") {\n    std::map<std::string, int> m{{\"a\", 3}};\n    REQUIRE(count_of(m, \"z\") == 0);\n    REQUIRE(m.size() == 1);\n}\n\nTEST_CASE(\"빈 맵\") {\n    const std::map<std::string, int> e{};\n    REQUIRE(count_of(e, \"a\") == 0);\n}\n" },
      ex: "`m[k]` 는 없으면 0 을 **만들어 넣고** 그 참조를 줍니다. 조회만 하는 코드가 맵을 무한히 키우고, 메모리가 새는 것처럼 보여요. 그리고 `const map` 에는 아예 쓸 수 없어서, 매개변수를 const 로 못 받는 것부터가 신호입니다.",
    },
    {
      k: "grow_safe · 늘어나면 참조가 죽는다",
      qq: "<code>std::vector&lt;int&gt;</code> 의 <b>첫 원소 값</b>을 읽고, <code>n</code>개를 덧붙인 뒤 <b>그 값</b>을 돌려주세요. 비어 있으면 <code>-1</code> 입니다.",
      src: "#include <vector>\n\ninline int grow_safe(std::vector<int>& v, int n) {\n    if (v.empty()) return -1;\n    int& first = v[0];\n    for (int i = 0; i < n; i++) v.push_back(i);\n    return first;\n}\n",
      sol: "#include <vector>\n\ninline int grow_safe(std::vector<int>& v, int n) {\n    if (v.empty()) return -1;\n    int first = v[0];\n    for (int i = 0; i < n; i++) v.push_back(i);\n    return first;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\n/* 값으로 복사해 두면 재할당이 일어나도 안전하다.\n   참조로 들고 있으면 옮겨진 뒤의 참조라 무엇이 나올지 알 수 없다 —\n   그래서 여기서는 '읽은 값이 맞는가' 만 확인한다. */\nTEST_CASE(\"많이 덧붙여도 처음 값을 지킨다\") {\n    std::vector<int> v{7};\n    REQUIRE(grow_safe(v, 1000) == 7);\n    REQUIRE(v.size() == 1001);\n}\n\nTEST_CASE(\"덧붙이지 않으면\") {\n    std::vector<int> v{5, 6};\n    REQUIRE(grow_safe(v, 0) == 5);\n}\n\nTEST_CASE(\"빈 벡터\") {\n    std::vector<int> e{};\n    REQUIRE(grow_safe(e, 3) == -1);\n}\n" },
      ex: "`push_back` 으로 용량이 넘치면 벡터는 더 큰 자리를 잡아 전부 옮깁니다 — 그 순간 `first` 는 이미 해제된 메모리를 가리켜요. 값으로 복사해 두면 옮겨지든 말든 상관이 없습니다. 참조는 편하지만, 컨테이너가 자라는 동안에는 들고 있으면 안 됩니다.",
    },
  ],
},
/* ── 캐스팅 4종 ─────────────────────────────────────────── */
{
  unit: "캐스팅 4종 완전 정리 (중급)",
  lesson: "직접 짜 보기 — 무엇을 바꾸는 캐스팅인가",
  th: {
    sum: "C++ 의 캐스팅 네 가지는 **각자 다른 일을 하고, 이름이 곧 의도**다.",
    body: [
      { h: "static_cast — 관계가 있는 변환", t: "int↔double, 상속 관계의 위아래처럼 컴파일러가 관계를 아는 변환이다. 검사는 컴파일 시점에만 하므로, 아래로 내릴 때(다운캐스트) 실제 타입이 아니면 그대로 잘못된 포인터가 된다." },
      { h: "dynamic_cast — 실행 중에 확인", t: "가상 함수가 있는 클래스에서만 쓸 수 있고, 실제 타입이 아니면 포인터는 `nullptr` 을 준다. 느리지만 '정말 그 타입인가' 를 물어볼 수 있는 유일한 방법이다." },
      { h: "const_cast — const 만 떼기", t: "const 를 붙이거나 떼는 것만 한다. 원래 const 인 객체의 const 를 떼고 고치면 미정의 동작이다 — 옛 API 에 넘길 때 말고는 쓸 일이 없다." },
      { h: "reinterpret_cast — 비트를 다시 읽기", t: "관계 없는 타입으로 비트를 그대로 재해석한다. 가장 위험하고 가장 이식성이 없다 — 이름이 길고 눈에 띄는 것이 의도된 설계다." },
    ],
    code: { c: "static_cast<double>(i)          // 관계 있는 변환\ndynamic_cast<Dog*>(animal)      // 실행 중 확인 (아니면 nullptr)\nconst_cast<char*>(s)            // const 만 뗀다\nreinterpret_cast<int*>(p)       // 비트 재해석 (위험)", cap: "이름이 곧 의도다" },
    key: ["`static_cast` 는 컴파일 시점만 본다", "`dynamic_cast` 는 아니면 nullptr", "`reinterpret_cast` 는 최후의 수단"],
  },
  q: [
    {
      k: "as_dog · 정말 그 타입인가",
      qq: "<code>Animal*</code> 을 받아 <b>정말 <code>Dog</code> 일 때만</b> 짖는 소리를 돌려주세요. 아니면 <code>\"?\"</code> 입니다.",
      src: "#include <string>\n\nstruct Animal { virtual ~Animal() = default; };\nstruct Dog : Animal { std::string bark() const { return \"멍\"; } };\nstruct Cat : Animal {};\n\ninline std::string as_dog(Animal* a) {\n    return static_cast<Dog*>(a)->bark();\n}\n",
      sol: "#include <string>\n\nstruct Animal { virtual ~Animal() = default; };\nstruct Dog : Animal { std::string bark() const { return \"멍\"; } };\nstruct Cat : Animal {};\n\ninline std::string as_dog(Animal* a) {\n    if (auto* d = dynamic_cast<Dog*>(a)) return d->bark();\n    return \"?\";\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"개는 짖는다\") {\n    Dog d;\n    REQUIRE(as_dog(&d) == \"멍\");\n}\n\nTEST_CASE(\"고양이는 개가 아니다\") {\n    Cat c;\n    REQUIRE(as_dog(&c) == \"?\");\n}\n\nTEST_CASE(\"널 포인터\") {\n    REQUIRE(as_dog(nullptr) == \"?\");\n}\n" },
      ex: "`static_cast` 로 내리면 컴파일러는 '네가 안다고 했으니 그런 줄 알겠다' 하고 넘어갑니다 — 고양이를 개로 읽어 엉뚱한 메모리를 건드려요. 실제 타입을 물어보는 것은 `dynamic_cast` 뿐이고, 아니면 nullptr 로 정직하게 답합니다.",
    },
    {
      k: "to_ratio · 정수 나눗셈이 먼저 일어난다",
      qq: "두 <code>int</code> 를 받아 <b>비율</b>을 <code>double</code> 로 돌려주세요. 분모가 0이면 <code>0.0</code> 입니다.",
      src: "inline double to_ratio(int a, int b) {\n    if (b == 0) return 0.0;\n    return static_cast<double>(a / b);\n}\n",
      sol: "inline double to_ratio(int a, int b) {\n    if (b == 0) return 0.0;\n    return static_cast<double>(a) / b;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"소수가 살아남는다\") {\n    REQUIRE(to_ratio(1, 2) == 0.5);\n    REQUIRE(to_ratio(3, 4) == 0.75);\n}\n\nTEST_CASE(\"딱 나눠떨어질 때\") {\n    REQUIRE(to_ratio(4, 2) == 2.0);\n}\n\nTEST_CASE(\"0 으로 나누기\") {\n    REQUIRE(to_ratio(1, 0) == 0.0);\n}\n" },
      ex: "괄호 자리 하나 차이입니다. `a / b` 가 먼저 정수 나눗셈으로 계산돼 1/2 가 0 이 되고, 그 0 을 double 로 바꾸는 거예요 — 캐스팅은 했는데 아무 소용이 없습니다. **나누기 전에** 한쪽을 올려야 합니다.",
    },
    {
      k: "same_bits · 비트를 다시 읽는다는 것",
      qq: "<code>unsigned int</code> 의 <b>바이트 수</b>를 <code>reinterpret_cast</code> 로 세어 돌려주세요. 첫 바이트가 <code>0xFF</code> 인지도 함께 봅니다 — 값이 <code>0xFF</code> 일 때 <b>어느 바이트가 0xFF 인지</b>는 기계에 달렸으니, <b>바이트 수만</b> 돌려주세요.",
      src: "inline int byte_count(unsigned int v) {\n    return static_cast<int>(sizeof(v)) / 2;\n}\n",
      sol: "inline int byte_count(unsigned int v) {\n    const unsigned char* p = reinterpret_cast<const unsigned char*>(&v);\n    int n = 0;\n    for (const unsigned char* q = p; q != p + sizeof(v); ++q) ++n;\n    return n;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\n/* 어느 바이트가 0xFF 인지는 엔디언에 달렸다 — 그래서 개수만 묻는다.\n   기계마다 답이 다른 것을 문항으로 내면, 채점이 기계 사정에 휘둘린다. */\nTEST_CASE(\"unsigned int 의 바이트 수\") {\n    REQUIRE(byte_count(0) == static_cast<int>(sizeof(unsigned int)));\n    REQUIRE(byte_count(0xFF) == static_cast<int>(sizeof(unsigned int)));\n}\n\nTEST_CASE(\"값이 달라도 크기는 같다\") {\n    REQUIRE(byte_count(1) == byte_count(0xFFFFFFFFu));\n}\n" },
      ex: "`sizeof` 를 반으로 나눈 값은 그냥 틀린 수입니다. 비트를 바이트 단위로 훑으려면 `unsigned char*` 로 재해석해야 하고, 그건 `static_cast` 로는 안 돼요 — 관계 없는 타입이라 `reinterpret_cast` 만 허용됩니다. 그리고 어느 바이트가 무엇인지는 엔디언에 달렸으니, 이식성 있는 코드는 거기까지 기대지 않습니다.",
    },
  ],
},
/* ── 입출력 스트림 ──────────────────────────────────────── */
{
  unit: "입출력 스트림 다루기 (중급)",
  lesson: "직접 짜 보기 — 실패한 스트림은 조용하다",
  th: {
    sum: "스트림은 **실패해도 예외를 던지지 않는다**. 상태를 물어보지 않으면 실패를 모른다.",
    body: [
      { h: "읽기 실패는 상태 비트로 남는다", t: "`std::cin >> n` 이 실패하면 `n` 은 그대로이고 스트림에 `failbit` 이 선다. 확인하지 않으면 초기화되지 않은 값이나 이전 값을 그대로 쓰게 된다 — `if (in >> n)` 이 기본 모양이다." },
      { h: "실패하면 흐름이 멈춘다", t: "failbit 이 선 뒤로는 모든 읽기가 즉시 실패한다. `clear()` 로 상태를 지우고 `ignore()` 로 남은 입력을 버려야 다시 읽을 수 있다." },
      { h: "getline 과 >> 를 섞으면 줄이 밀린다", t: "`>>` 는 줄바꿈을 남겨 두므로, 바로 뒤의 `getline` 이 빈 줄을 읽는다. 섞어 쓸 거면 그 줄바꿈을 버려야 한다." },
      { h: "stringstream 으로 파싱을 격리한다", t: "한 줄을 통째로 읽고 `istringstream` 에 넣어 파싱하면, 입력 스트림 상태와 파싱 실패가 뒤섞이지 않는다 — 테스트하기도 훨씬 쉽다." },
    ],
    code: { c: "int n;\nif (in >> n) { …성공… }\nelse { in.clear(); in.ignore(1e9, '\\n'); }\n\nstd::istringstream ss(line);\nwhile (ss >> word) { … }", cap: "물어보지 않으면 실패를 모른다" },
    key: ["실패는 예외가 아니라 상태 비트", "실패 뒤에는 `clear` 가 필요하다", "한 줄 읽고 따로 파싱한다"],
  },
  q: [
    {
      k: "sum_ints · 못 읽은 것은 세지 않는다",
      qq: "문자열에서 <b>정수만</b> 골라 더한 값을 돌려주세요. 숫자가 아닌 낱말이 섞여 있어도 <b>끝까지</b> 읽습니다.",
      src: "#include <sstream>\n#include <string>\n\ninline int sum_ints(const std::string& s) {\n    std::istringstream ss(s);\n    int total = 0, n = 0;\n    while (!ss.eof()) {\n        ss >> n;\n        total += n;\n    }\n    return total;\n}\n",
      sol: "#include <sstream>\n#include <string>\n\ninline int sum_ints(const std::string& s) {\n    std::istringstream ss(s);\n    std::string w;\n    int total = 0;\n    while (ss >> w) {\n        try {\n            size_t used = 0;\n            int v = std::stoi(w, &used);\n            if (used == w.size()) total += v;\n        } catch (...) {\n        }\n    }\n    return total;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"숫자만 더한다\") {\n    REQUIRE(sum_ints(\"1 2 3\") == 6);\n}\n\nTEST_CASE(\"낱말이 섞여도 끝까지\") {\n    REQUIRE(sum_ints(\"1 가 2\") == 3);\n    REQUIRE(sum_ints(\"가 1 나 2\") == 3);\n}\n\nTEST_CASE(\"경계\") {\n    REQUIRE(sum_ints(\"\") == 0);\n    REQUIRE(sum_ints(\"가 나\") == 0);\n    REQUIRE(sum_ints(\"12abc 3\") == 3);\n}\n" },
      ex: "`>>` 가 실패하면 failbit 이 서고 그 뒤로는 아무것도 못 읽습니다 — 낱말 하나에 막혀 뒤의 숫자를 전부 놓쳐요. 게다가 실패한 `n` 은 값이 바뀌지 않으니 이전 값을 한 번 더 더하게 됩니다. 낱말 단위로 읽고 각각 파싱하면 한 조각의 실패가 나머지를 막지 않습니다.",
    },
    {
      k: "read_pair · 실패를 값으로 알려 주기",
      qq: "<code>\"이름 나이\"</code> 꼴을 파싱해 <b>성공 여부</b>를 돌려주세요. 나이가 정수가 아니거나 조각이 모자라면 실패이고, 실패면 출력 인자를 <b>건드리지 않습니다</b>.",
      src: "#include <sstream>\n#include <string>\n\ninline bool read_pair(const std::string& s, std::string& name, int& age) {\n    std::istringstream ss(s);\n    ss >> name >> age;\n    return true;\n}\n",
      sol: "#include <sstream>\n#include <string>\n\ninline bool read_pair(const std::string& s, std::string& name, int& age) {\n    std::istringstream ss(s);\n    std::string n;\n    int a = 0;\n    if (!(ss >> n >> a)) return false;\n    name = n;\n    age = a;\n    return true;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"올바른 입력\") {\n    std::string n; int a = -1;\n    REQUIRE(read_pair(\"루이 30\", n, a) == true);\n    REQUIRE(n == \"루이\");\n    REQUIRE(a == 30);\n}\n\nTEST_CASE(\"실패하면 출력 인자를 건드리지 않는다\") {\n    std::string n = \"그대로\"; int a = -1;\n    REQUIRE(read_pair(\"루이 서른\", n, a) == false);\n    REQUIRE(n == \"그대로\");\n    REQUIRE(a == -1);\n}\n\nTEST_CASE(\"조각이 모자라면\") {\n    std::string n = \"그대로\"; int a = -1;\n    REQUIRE(read_pair(\"루이\", n, a) == false);\n    REQUIRE(n == \"그대로\");\n}\n" },
      ex: "무조건 true 를 돌려주면 부르는 쪽은 실패를 알 길이 없습니다. 게다가 `name` 은 이미 덮어써졌는데 `age` 만 안 채워진 **어중간한 상태**가 남아요 — 성공했을 때만 출력 인자를 채우면, 실패해도 부르는 쪽 값이 온전합니다.",
    },
    {
      k: "join_lines · 줄바꿈을 잃지 않기",
      qq: "여러 줄 문자열을 <code>getline</code> 으로 읽어 <b><code>\"|\"</code> 로 이어</b> 돌려주세요. 마지막에 구분자가 붙으면 안 됩니다.",
      src: "#include <sstream>\n#include <string>\n\ninline std::string join_lines(const std::string& s) {\n    std::istringstream ss(s);\n    std::string line, out;\n    while (std::getline(ss, line)) out += line + \"|\";\n    return out;\n}\n",
      sol: "#include <sstream>\n#include <string>\n\ninline std::string join_lines(const std::string& s) {\n    std::istringstream ss(s);\n    std::string line, out;\n    bool first = true;\n    while (std::getline(ss, line)) {\n        if (!first) out += \"|\";\n        out += line;\n        first = false;\n    }\n    return out;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"여러 줄\") {\n    REQUIRE(join_lines(\"a\\nb\\nc\") == \"a|b|c\");\n}\n\nTEST_CASE(\"한 줄이면 구분자가 없다\") {\n    REQUIRE(join_lines(\"a\") == \"a\");\n}\n\nTEST_CASE(\"빈 줄과 빈 입력\") {\n    REQUIRE(join_lines(\"\") == \"\");\n    REQUIRE(join_lines(\"a\\n\\nb\") == \"a||b\");\n}\n" },
      ex: "뒤에 붙이는 방식은 마지막에도 구분자가 남습니다 — CSV 로 내보내면 빈 열이 하나 더 생기고, 받는 쪽 파서가 컬럼 수가 다르다고 거부해요. '처음이 아니면 먼저 붙인다' 로 뒤집으면 경계가 사라집니다.",
    },
  ],
},
/* ── 빌드와 헤더 관리 ───────────────────────────────────── */
{
  unit: "빌드와 헤더 관리 (중급)",
  lesson: "직접 짜 보기 — 한 번만 정의되게",
  th: {
    sum: "C++ 빌드 문제의 대부분은 **정의가 몇 개인가**로 갈린다. 하나여야 하는 것과 여러 개여도 되는 것을 구별한다.",
    body: [
      { h: "ODR — 정의는 프로그램에 하나", t: "함수나 변수의 몸통은 프로그램 전체에서 하나여야 한다. 헤더에 몸통을 두고 여러 파일이 가져가면 링크가 거부한다." },
      { h: "inline 은 '여러 번 나와도 된다'", t: "속도 힌트가 아니라 ODR 예외를 뜻한다. 헤더에 몸통을 둘 거면 `inline` 을 붙이면 되고, C++17 부터는 변수에도 붙일 수 있다." },
      { h: "static 은 이 파일에서만", t: "파일마다 자기 사본을 갖는다. 헤더에 `static` 변수를 두면 파일 수만큼 사본이 생겨, 하나를 고쳐도 다른 곳은 그대로다 — 링크는 되는데 동작이 이상한 종류의 버그다." },
      { h: "가드는 두 번 들어오는 것을 막는다", t: "같은 헤더가 두 번 포함되면 정의가 두 번 생긴다. `#pragma once` 나 매크로 가드를 맨 위에 둔다." },
    ],
    code: { c: "// 헤더\n#pragma once\ninline int add(int a, int b) { return a + b; }   // 여러 번 OK\ninline constexpr int kMax = 100;                 // C++17\n\nstatic int counter;   // 헤더에 두면 파일마다 사본!", cap: "정의가 몇 개인가" },
    key: ["정의는 하나, 선언은 여럿", "`inline` 은 ODR 예외", "헤더의 `static` 은 사본을 만든다"],
  },
  q: [
    {
      k: "Config · 값 하나를 공유하기",
      qq: "<code>Config</code> 클래스에 <b>모든 곳이 공유하는</b> 정적 카운터를 두세요. <code>bump()</code> 는 올린 뒤의 값을, <code>value()</code> 는 현재 값을 돌려줍니다.",
      src: "struct Config {\n    static int n;\n    static int bump() { return ++n; }\n    static int value() { return n; }\n};\n",
      sol: "struct Config {\n    static inline int n = 0;\n    static int bump() { return ++n; }\n    static int value() { return n; }\n};\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"올린 뒤의 값\") {\n    REQUIRE(Config::value() == 0);\n    REQUIRE(Config::bump() == 1);\n    REQUIRE(Config::bump() == 2);\n    REQUIRE(Config::value() == 2);\n}\n" },
      ex: "`static int n;` 은 클래스 안에서는 **선언**일 뿐입니다 — 몸통이 어디에도 없어서 링크가 '정의를 못 찾겠다' 며 거부해요. C++17 의 `static inline` 은 선언과 정의를 한 줄로 하면서, 여러 파일이 가져가도 하나로 합쳐 줍니다.",
    },
    {
      k: "counter_of · 파일마다 사본이 생기면",
      qq: "호출할 때마다 1씩 올라가는 번호를 돌려주는 <code>next_id()</code> 를 만드세요. <b>어디서 부르든 이어서</b> 올라가야 합니다.",
      src: "inline int next_id() {\n    int n = 0;\n    return ++n;\n}\n",
      sol: "inline int next_id() {\n    static int n = 0;\n    return ++n;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"이어서 올라간다\") {\n    REQUIRE(next_id() == 1);\n    REQUIRE(next_id() == 2);\n    REQUIRE(next_id() == 3);\n}\n" },
      ex: "지역 변수는 함수가 끝나면 사라지니, 매번 0에서 시작해 언제나 1 이 나옵니다. 함수 안의 `static` 은 처음 한 번만 초기화되고 프로그램이 끝날 때까지 남아요 — 그리고 `inline` 함수 안의 static 은 여러 파일에서 가져가도 **하나**로 합쳐집니다.",
    },
    {
      k: "kMax · 헤더에 두는 상수",
      qq: "헤더에 두어도 되는 <b>상수</b> <code>kMax</code>(값 100)와, 그것을 넘는지 보는 <code>over(int)</code> 를 만드세요.",
      src: "int kMax = 100;\n\ninline bool over(int v) { return v > kMax; }\n",
      sol: "inline constexpr int kMax = 100;\n\ninline bool over(int v) { return v > kMax; }\n",
      test: { "test.cpp": "/* 같은 이름을 여기서도 쓴다. inline 이면 하나로 합쳐지고,\n   보통 정의라면 정의가 둘이 되어 링크가 거부한다. */\n#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nstatic_assert(kMax == 100, \"상수여야 한다\");\nstatic int arr[kMax];\n\nTEST_CASE(\"넘는지 본다\") {\n    REQUIRE(over(101) == true);\n    REQUIRE(over(100) == false);\n    REQUIRE(over(0) == false);\n    REQUIRE(sizeof(arr) / sizeof(arr[0]) == 100);\n}\n" },
      ex: "보통 전역 변수를 헤더에 두면 그 헤더를 가져간 파일마다 정의가 생겨 링크가 거부합니다. 그리고 `const` 가 아니면 배열 크기로도 못 써요 — `inline constexpr` 은 '여러 번 나와도 하나' 와 '컴파일 시점에 값이 정해진다' 를 함께 줍니다.",
    },
  ],
},
/* ── 상속 심화 ──────────────────────────────────────────── */
{
  unit: "상속 심화 — 다중·가상 상속과 슬라이싱 (심화)",
  lesson: "직접 짜 보기 — 값으로 담으면 잘려 나간다",
  th: {
    sum: "다형성은 **포인터나 참조로 다룰 때만** 살아 있다. 값으로 담는 순간 잘린다.",
    body: [
      { h: "슬라이싱은 조용하다", t: "`Base b = derived;` 는 파생 부분을 버리고 기반 부분만 복사한다. 오류도 경고도 없이 가상 함수가 기반 것으로 돌아간다 — `vector<Base>` 에 파생 객체를 넣는 코드가 대표적이다." },
      { h: "가상 소멸자가 없으면 새어 나간다", t: "`Base*` 로 파생 객체를 지우면, 가상 소멸자가 없을 때 파생 소멸자가 안 불린다. 다형적으로 쓸 클래스의 소멸자는 언제나 가상이어야 한다." },
      { h: "override 를 적으면 오타가 잡힌다", t: "시그니처가 조금이라도 다르면 재정의가 아니라 새 함수가 된다. `override` 를 적어 두면 그 순간 컴파일 오류가 나서, 실행 중에 이상한 동작을 겪지 않는다." },
      { h: "다이아몬드는 가상 상속으로", t: "같은 조상을 두 경로로 물려받으면 조상이 둘이 된다. `virtual` 상속을 쓰면 하나로 합쳐진다 — 다만 복잡해지니, 애초에 상속을 얕게 두는 편이 낫다." },
    ],
    code: { c: "Base b = derived;        // 슬라이싱 — 조용히 잘린다\nBase& r = derived;       // 다형성 유지\nstd::unique_ptr<Base> p; // 유지 (가상 소멸자 필수)\n\nvirtual ~Base() = default;\nvoid f() const override;", cap: "값으로 담으면 잘린다" },
    key: ["값 복사는 슬라이싱", "다형적이면 가상 소멸자", "`override` 로 오타를 잡는다"],
  },
  q: [
    {
      k: "speak_all · 잘리지 않게 담기",
      qq: "여러 <code>Animal</code> 을 담아 각자의 소리를 이어 붙이세요. <b>파생 클래스의 소리</b>가 나와야 합니다.",
      src: "#include <memory>\n#include <string>\n#include <vector>\n\nstruct Animal {\n    virtual ~Animal() = default;\n    virtual std::string say() const { return \"...\"; }\n};\nstruct Dog : Animal { std::string say() const override { return \"멍\"; } };\nstruct Cat : Animal { std::string say() const override { return \"야옹\"; } };\n\ninline std::string speak_all() {\n    std::vector<Animal> zoo;\n    zoo.push_back(Dog{});\n    zoo.push_back(Cat{});\n    std::string out;\n    for (const auto& a : zoo) out += a.say();\n    return out;\n}\n",
      sol: "#include <memory>\n#include <string>\n#include <vector>\n\nstruct Animal {\n    virtual ~Animal() = default;\n    virtual std::string say() const { return \"...\"; }\n};\nstruct Dog : Animal { std::string say() const override { return \"멍\"; } };\nstruct Cat : Animal { std::string say() const override { return \"야옹\"; } };\n\ninline std::string speak_all() {\n    std::vector<std::unique_ptr<Animal>> zoo;\n    zoo.push_back(std::make_unique<Dog>());\n    zoo.push_back(std::make_unique<Cat>());\n    std::string out;\n    for (const auto& a : zoo) out += a->say();\n    return out;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"각자의 소리가 나온다\") {\n    REQUIRE(speak_all() == \"멍야옹\");\n}\n" },
      ex: "`vector<Animal>` 에 개를 넣으면 개다운 부분이 복사되지 않고 버려집니다 — 오류도 경고도 없이 모두가 \"...\" 라고 말해요. 다형성을 지키려면 포인터나 참조로 담아야 하고, 소유까지 맡기려면 `unique_ptr` 이 기본입니다.",
    },
    {
      k: "no_leak · 지울 때 파생까지",
      qq: "<code>Base*</code> 로 파생 객체를 지웠을 때 <b>파생 소멸자도 불리게</b> 만드세요. 소멸자가 불린 횟수를 돌려줍니다.",
      src: "struct Base {\n    ~Base() {}\n};\nstruct Derived : Base {\n    static inline int destroyed = 0;\n    ~Derived() { ++destroyed; }\n};\n\ninline int no_leak() {\n    Derived::destroyed = 0;\n    Base* p = new Derived();\n    delete p;\n    return Derived::destroyed;\n}\n",
      sol: "struct Base {\n    virtual ~Base() = default;\n};\nstruct Derived : Base {\n    static inline int destroyed = 0;\n    ~Derived() override { ++destroyed; }\n};\n\ninline int no_leak() {\n    Derived::destroyed = 0;\n    Base* p = new Derived();\n    delete p;\n    return Derived::destroyed;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"파생 소멸자가 불린다\") {\n    REQUIRE(no_leak() == 1);\n}\n\nTEST_CASE(\"여러 번 해도 마찬가지\") {\n    REQUIRE(no_leak() == 1);\n    REQUIRE(no_leak() == 1);\n}\n" },
      ex: "기반 소멸자가 가상이 아니면 `delete p` 는 기반 소멸자만 부릅니다 — 파생이 들고 있던 자원이 그대로 새어 나가요. 표준은 이걸 미정의 동작으로 규정하고, 실제로는 조용히 새는 쪽으로 나타나서 더 찾기 어렵습니다.",
    },
    {
      k: "shape_area · override 가 오타를 잡는다",
      qq: "<code>Shape</code> 의 <code>area()</code> 를 <code>Square</code> 가 재정의하게 만드세요. <b><code>const</code> 여부까지 맞아야</b> 합니다.",
      src: "struct Shape {\n    virtual ~Shape() = default;\n    virtual int area() const { return 0; }\n};\nstruct Square : Shape {\n    int side = 0;\n    int area() { return side * side; }\n};\n\ninline int shape_area(int s) {\n    Square sq;\n    sq.side = s;\n    const Shape& r = sq;\n    return r.area();\n}\n",
      sol: "struct Shape {\n    virtual ~Shape() = default;\n    virtual int area() const { return 0; }\n};\nstruct Square : Shape {\n    int side = 0;\n    int area() const override { return side * side; }\n};\n\ninline int shape_area(int s) {\n    Square sq;\n    sq.side = s;\n    const Shape& r = sq;\n    return r.area();\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"정사각형 넓이\") {\n    REQUIRE(shape_area(3) == 9);\n    REQUIRE(shape_area(1) == 1);\n    REQUIRE(shape_area(0) == 0);\n}\n" },
      ex: "`const` 하나가 빠지면 서명이 달라져 **재정의가 아니라 새 함수**가 됩니다. 기반 참조로 부르면 기반 것이 불려 언제나 0 이 나오고, 컴파일은 멀쩡히 통과해요 — `override` 를 적어 두면 바로 그 자리에서 컴파일 오류가 납니다.",
    },
  ],
},
/* ── 코드 리뷰 ──────────────────────────────────────────── */
{
  unit: "코드 리뷰 — C++ 결함 찾기",
  lesson: "직접 고쳐 보기 — 수명과 복사를 의심한다",
  th: {
    sum: "C++ 리뷰의 단골은 **수명(누가 언제까지 살아 있나)**과 **복사(언제 몇 번 복사되나)**다.",
    body: [
      { h: "지역 객체의 참조를 돌려주지 않는다", t: "함수가 끝나면 지역 변수는 사라진다. 그 참조나 포인터를 돌려주면 부르는 쪽은 이미 없는 것을 읽는다 — 값이 우연히 남아 있어 한동안 멀쩡해 보이는 것이 가장 나쁘다." },
      { h: "범위 for 에서 참조를 쓴다", t: "`for (auto x : v)` 는 원소마다 복사를 만든다. 큰 객체면 그대로 비용이고, 고칠 생각이었다면 원본이 안 바뀐다 — 읽기만 하면 `const auto&` 다." },
      { h: "매개변수도 마찬가지", t: "`std::string s` 로 받으면 부를 때마다 복사한다. 읽기만 할 거면 `const std::string&` 이고, 안에서 보관할 거면 값으로 받아 `std::move` 한다." },
      { h: "raw new/delete 가 보이면 멈춘다", t: "예외가 한 번만 나도 `delete` 를 건너뛴다. `unique_ptr`·`vector` 로 바꾸면 그 걱정이 통째로 사라진다." },
    ],
    code: { c: "const std::string& bad() { std::string s = \"x\"; return s; }  // 위험\n\nfor (const auto& x : v)   // 복사 없음\nvoid f(const std::string& s)\n\nauto p = std::make_unique<T>();   // new/delete 대신", cap: "수명과 복사를 먼저 본다" },
    key: ["지역 객체의 참조를 돌려주지 않는다", "범위 for 는 `const auto&`", "`new`/`delete` 대신 스마트 포인터"],
  },
  q: [
    {
      k: "longest · 지역 객체를 돌려주지 않기",
      qq: "문자열 목록에서 <b>가장 긴 것</b>을 돌려주세요. 같으면 <b>앞의 것</b>이고, 비면 빈 문자열입니다.",
      src: "#include <string>\n#include <vector>\n\ninline const std::string& longest(const std::vector<std::string>& v) {\n    std::string best;\n    for (const auto& s : v) if (s.size() > best.size()) best = s;\n    return best;\n}\n",
      sol: "#include <string>\n#include <vector>\n\ninline std::string longest(const std::vector<std::string>& v) {\n    std::string best;\n    for (const auto& s : v) if (s.size() > best.size()) best = s;\n    return best;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n\nTEST_CASE(\"가장 긴 것\") {\n    std::vector<std::string> v{\"a\", \"abc\", \"ab\"};\n    REQUIRE(longest(v) == \"abc\");\n}\n\nTEST_CASE(\"같으면 앞의 것\") {\n    std::vector<std::string> v{\"ab\", \"cd\"};\n    REQUIRE(longest(v) == \"ab\");\n}\n\nTEST_CASE(\"빈 목록\") {\n    std::vector<std::string> e{};\n    REQUIRE(longest(e) == \"\");\n}\n" },
      ex: "지역 변수 `best` 는 함수가 끝나면 사라집니다. 그 참조를 돌려주면 부르는 쪽은 이미 없는 메모리를 읽어요 — 값이 잠깐 남아 있어 테스트가 통과하기도 하는데, 그게 이 버그가 오래 살아남는 이유입니다. 값으로 돌려주면 이동 최적화 덕에 비용도 거의 없습니다.",
    },
    {
      k: "total_len · 복사를 만들지 않기",
      qq: "문자열 목록의 <b>길이 합</b>을 돌려주세요. 복사본을 만들지 마세요.",
      src: "#include <string>\n#include <vector>\n\ninline int total_len(std::vector<std::string> v) {\n    int n = 0;\n    for (auto s : v) n += static_cast<int>(s.size());\n    return n;\n}\n",
      sol: "#include <string>\n#include <vector>\n\ninline int total_len(const std::vector<std::string>& v) {\n    int n = 0;\n    for (const auto& s : v) n += static_cast<int>(s.size());\n    return n;\n}\n",
      test: { "test.cpp": "#include \"catch.hpp\"\n#include \"sol.cpp\"\n#include <type_traits>\n\n/* 복사 여부는 결과로 안 드러나니, const 참조로만 부를 수 있게 해\n   시그니처 자체를 검사한다 — 값으로 받는 코드는 여기서 걸린다. */\nTEST_CASE(\"길이 합\") {\n    const std::vector<std::string> v{\"a\", \"bb\"};\n    REQUIRE(total_len(v) == 3);\n}\n\nTEST_CASE(\"경계\") {\n    const std::vector<std::string> e{};\n    REQUIRE(total_len(e) == 0);\n    const std::vector<std::string> one{\"abcd\"};\n    REQUIRE(total_len(one) == 4);\n}\n\nstatic_assert(std::is_same_v<decltype(total_len), int(const std::vector<std::string>&)>,\n              \"const 참조로 받아야 한다\");\n" },
      ex: "값으로 받으면 벡터 전체와 그 안의 모든 문자열이 복사됩니다 — 만 개짜리면 만 번이에요. 결과는 똑같이 맞아서 테스트로는 안 드러나니, 시그니처를 직접 검사했습니다. 리뷰에서 눈으로 잡아야 하는 종류의 결함입니다.",
    },
    {
      k: "make_buf · new 대신 스마트 포인터",
      qq: "크기 <code>n</code> 짜리 버퍼를 만들어 <b>0으로 채운 뒤</b> 합을 돌려주세요. <code>n</code> 이 음수면 0 입니다. <b>수동 해제가 필요 없게</b> 만드세요.",
      src: "#include <numeric>\n\ninline int make_buf(int n) {\n    if (n < 0) return 0;\n    int* p = new int[n];\n    for (int i = 0; i < n; i++) p[i] = 0;\n    int s = 0;\n    for (int i = 0; i < n; i++) s += p[i];\n    if (n > 100) return s;   // 여기서 새어 나간다\n    delete[] p;\n    return s;\n}\n",
      sol: "#include <numeric>\n#include <vector>\n\ninline int make_buf(int n) {\n    if (n < 0) return 0;\n    std::vector<int> buf(static_cast<size_t>(n), 0);\n    return std::accumulate(buf.begin(), buf.end(), 0);\n}\n",
      test: { "test.cpp": "/* 새어 나가는지는 값으로 안 보인다. 그래서 시그니처가 아니라\n   '수동 해제가 코드에 남아 있는가' 를 소스에서 확인한다. */\n#include \"catch.hpp\"\n#include \"sol.cpp\"\n#include <fstream>\n#include <sstream>\n#include <string>\n\nTEST_CASE(\"합은 0\") {\n    REQUIRE(make_buf(10) == 0);\n    REQUIRE(make_buf(0) == 0);\n    REQUIRE(make_buf(200) == 0);\n    REQUIRE(make_buf(-1) == 0);\n}\n\nTEST_CASE(\"수동 할당이 남아 있으면 안 된다\") {\n    std::ifstream in(\"sol.cpp\");\n    std::stringstream ss;\n    ss << in.rdbuf();\n    const std::string src = ss.str();\n    REQUIRE(src.find(\"new int\") == std::string::npos);\n    REQUIRE(src.find(\"delete[]\") == std::string::npos);\n}\n" },
      ex: "중간에 `return` 이 하나만 있어도 `delete[]` 를 건너뜁니다 — 예외라면 더 쉽게 새어 나가요. `vector` 는 어떤 경로로 함수를 빠져나가든 알아서 정리하니, 해제를 기억할 필요 자체가 사라집니다. 값으로는 안 드러나는 결함이라 소스를 직접 확인했습니다.",
    },
  ],
},
];
