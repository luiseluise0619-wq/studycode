/* 파이썬 기초 유닛 실습 — 초보자가 트랙을 시작해서 처음 만나는 유닛들.
   지금은 이 유닛들에 실습이 하나도 없다. 읽고 고르기만 하고 넘어간다.

   문제를 고른 기준: 문법 소개가 아니라 '여기서 막힌다' 는 곳.
   시작 코드는 반드시 틀리게 두었다 — 아무것도 안 해도 통과하면 실습이 아니다. */
module.exports = [
{
  unit: "파이썬 첫걸음",
  lesson: "직접 써 보기 — 출력·변수·조건",
  th: {
    sum: "읽어서 아는 것과 손으로 쓰는 것은 다르다. 여기서는 직접 함수를 채운다.",
    body: [
      { h: "함수를 채운다는 것", t: "`def 이름(재료):` 아래 들여쓴 줄이 함수의 몸통이다. 몸통에서 계산한 값을 `return` 으로 돌려주면, 부르는 쪽이 그 값을 받는다. `print` 는 화면에 보여줄 뿐 돌려주지 않는다 — 채점은 `return` 한 값을 본다." },
      { h: "막히면 이렇게", t: "먼저 종이에 예시 하나를 손으로 풀어 본다. `인사('세계')` 가 무엇이 되어야 하는지 적고, 그걸 만드는 식을 쓴다. 틀리면 채점 결과에서 어떤 입력이 무엇을 냈는지 보고, '왜 이 값이 나왔는지 한 줄씩 보기' 로 되감아 본다." },
    ],
    code: { c: "def 두배(n):\n    return n * 2\n\n두배(5)   # 10 을 돌려준다", cap: "return 이 있어야 값이 밖으로 나온다" },
    key: ["`return` 이 없으면 함수는 `None` 을 돌려준다", "`print` 는 보여줄 뿐, 돌려주는 것이 아니다", "들여쓰기가 함수의 몸통을 정한다"],
  },
  q: [
    {
      k: "greet · 인사말 만들기", cat: "internals",
      q: "이름을 받아 <code>\"안녕, 이름!\"</code> 형태의 문자열을 <b>돌려주는</b> 함수를 완성하세요. 화면에 찍는 게 아니라 <code>return</code> 으로 돌려줘야 합니다.",
      src: "def greet(name):\n    print(\"안녕, \" + name + \"!\")",
      sol: "def greet(name):\n    return \"안녕, \" + name + \"!\"",
      tests: [["greet('세계')", "'안녕, 세계!'"], ["greet('가영')", "'안녕, 가영!'"]],
      edge: [["greet('')", "'안녕, !'"]],
      ex: "print 는 화면에 보여줄 뿐 값을 돌려주지 않습니다. print 만 있는 함수는 None 을 돌려줘요 — 그래서 테스트가 전부 틀립니다.",
    },
    {
      k: "is_adult · 조건으로 참·거짓", cat: "internals",
      q: "나이를 받아 18살 이상이면 <code>True</code>, 아니면 <code>False</code> 를 돌려주세요.",
      src: "def is_adult(age):\n    if age > 18:\n        return True\n    return False",
      sol: "def is_adult(age):\n    return age >= 18",
      tests: [["is_adult(20)", "True"], ["is_adult(18)", "True"], ["is_adult(17)", "False"]],
      edge: [["is_adult(0)", "False"]],
      ex: "'이상' 은 같은 값도 포함합니다. > 는 18을 빼먹어요. 조건식 자체가 이미 True/False 라서 return age >= 18 한 줄이면 충분합니다.",
    },
  ],
},
{
  unit: "반복과 데이터",
  lesson: "직접 써 보기 — 반복으로 모으기",
  th: {
    sum: "반복문의 핵심은 '반복 전에 빈 그릇을 준비하고, 반복 안에서 채우고, 반복이 끝난 뒤 돌려준다' 는 순서다.",
    body: [
      { h: "그릇을 어디에 두는가", t: "합계를 담을 `total = 0` 이나 결과 목록 `out = []` 은 **반복문 밖**에 둔다. 안에 두면 돌 때마다 새로 만들어져 앞의 결과가 사라진다. 초보자가 가장 자주 틀리는 자리다." },
      { h: "돌려주는 위치", t: "`return` 을 반복문 **안**에 두면 첫 바퀴에서 함수가 끝난다. 전부 모아서 돌려주려면 반복문이 끝난 뒤, 들여쓰기를 한 칸 왼쪽으로 빼서 `return` 한다." },
    ],
    code: { c: "def 합(xs):\n    total = 0        # 밖에서 준비\n    for x in xs:\n        total += x   # 안에서 채우고\n    return total     # 끝난 뒤 돌려준다", cap: "그릇은 밖, 채우기는 안, 돌려주기는 끝난 뒤" },
    key: ["누적할 그릇은 반복문 밖에서 만든다", "`return` 이 반복문 안에 있으면 첫 바퀴에 끝난다", "`range(1, 5)` 는 5를 포함하지 않는다"],
  },
  q: [
    {
      k: "sum_to · 1부터 n까지 더하기", cat: "internals",
      q: "1부터 n까지 모두 더한 값을 돌려주세요. <code>sum_to(5)</code> 는 <code>15</code> 입니다.",
      src: "def sum_to(n):\n    total = 0\n    for i in range(1, n):\n        total += i\n    return total",
      sol: "def sum_to(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total",
      tests: [["sum_to(5)", "15"], ["sum_to(1)", "1"], ["sum_to(10)", "55"]],
      edge: [["sum_to(0)", "0"]],
      ex: "range(1, n) 은 n 을 포함하지 않아 마지막 수가 빠집니다. n 까지 넣으려면 range(1, n+1) 이어야 해요.",
    },
    {
      k: "evens · 짝수만 모으기", cat: "internals",
      q: "숫자 리스트에서 짝수만 <b>순서를 지켜</b> 모은 새 리스트를 돌려주세요.",
      src: "def evens(xs):\n    out = []\n    for x in xs:\n        if x % 2 == 0:\n            out.append(x)\n        return out",
      sol: "def evens(xs):\n    out = []\n    for x in xs:\n        if x % 2 == 0:\n            out.append(x)\n    return out",
      tests: [["evens([1,2,3,4])", "[2,4]"], ["evens([2,4,6])", "[2,4,6]"], ["evens([1,3])", "[]"]],
      edge: [["evens([])", "[]"], ["evens([0,-2,-3])", "[0,-2]"]],
      ex: "return 이 for 안에 들여쓰여 있어서 첫 바퀴에 함수가 끝납니다. 들여쓰기를 한 칸 왼쪽으로 빼야 전부 모은 뒤 돌려줘요.",
    },
  ],
},
{
  unit: "문자열 다루기",
  lesson: "직접 써 보기 — 문자열 다듬기",
  th: {
    sum: "문자열은 **바뀌지 않는다**. `s.upper()` 는 s 를 고치는 게 아니라 새 문자열을 만들어 돌려준다.",
    body: [
      { h: "돌려받아야 한다", t: "`s.strip()` 만 쓰고 버리면 아무 일도 일어나지 않는다. `s = s.strip()` 처럼 결과를 다시 담거나 바로 `return` 해야 한다. 리스트의 `append` 와 정반대라서 헷갈리기 쉽다." },
      { h: "자주 쓰는 것들", t: "`strip()` 앞뒤 공백 제거, `lower()`/`upper()` 대소문자, `split()` 나누기, `\"구분자\".join(목록)` 합치기, `replace(a, b)` 바꾸기. 전부 **새 값을 돌려준다.**" },
    ],
    code: { c: "s = \"  Hello  \"\ns.strip()          # 새 문자열을 돌려줄 뿐\nprint(s)           # '  Hello  ' — 그대로다\ns = s.strip()      # 다시 담아야 바뀐다", cap: "문자열 메서드는 원본을 고치지 않는다" },
    key: ["문자열 메서드는 새 값을 돌려준다 — 다시 담아야 한다", "`\"-\".join(xs)` 는 문자열만 이어 붙일 수 있다", "`split()` 은 인자가 없으면 공백 여러 칸도 하나로 본다"],
  },
  q: [
    {
      k: "normalize · 이름 다듬기", cat: "internals",
      q: "앞뒤 공백을 없애고 모두 소문자로 바꾼 문자열을 돌려주세요. <code>normalize(\"  Gaeul \")</code> 는 <code>\"gaeul\"</code> 입니다.",
      src: "def normalize(s):\n    s.strip()\n    s.lower()\n    return s",
      sol: "def normalize(s):\n    return s.strip().lower()",
      tests: [["normalize('  Gaeul ')", "'gaeul'"], ["normalize('ABC')", "'abc'"]],
      edge: [["normalize('   ')", "''"], ["normalize('a B')", "'a b'"]],
      ex: "strip() 과 lower() 는 원본을 고치지 않고 새 문자열을 돌려줍니다. 결과를 받지 않으면 그냥 버려져요.",
    },
    {
      k: "initials · 앞글자 모으기", cat: "internals",
      q: "공백으로 나뉜 이름에서 각 단어의 <b>첫 글자</b>만 대문자로 모아 돌려주세요. <code>initials(\"hong gil dong\")</code> 은 <code>\"HGD\"</code> 입니다.",
      src: "def initials(s):\n    out = \"\"\n    for w in s.split():\n        out += w[0]\n    return out",
      sol: "def initials(s):\n    out = \"\"\n    for w in s.split():\n        out += w[0].upper()\n    return out",
      tests: [["initials('hong gil dong')", "'HGD'"], ["initials('a b')", "'AB'"]],
      edge: [["initials('')", "''"], ["initials('  Kim   Lee ')", "'KL'"]],
      ex: "첫 글자를 뽑기만 하고 대문자로 바꾸지 않았어요. w[0].upper() 가 필요합니다. split() 은 공백이 여러 칸이어도 알아서 나눕니다.",
    },
  ],
},
{
  unit: "가변 기본값과 별칭의 함정",
  lesson: "직접 써 보기 — 복사와 별칭",
  th: {
    sum: "`b = a` 는 복사가 아니다. 상자 두 개가 아니라 **이름표 두 개가 같은 상자**를 가리킨다.",
    body: [
      { h: "왜 같이 바뀌나", t: "리스트를 다른 이름에 넣으면 내용이 복사되지 않는다. `b.append(4)` 로 b 를 바꾸면 a 도 바뀐 것처럼 보인다 — 사실은 처음부터 같은 리스트였다. 진짜 복사가 필요하면 `a[:]` 나 `list(a)` 를 쓴다." },
      { h: "기본값의 함정", t: "`def f(xs=[])` 의 빈 리스트는 함수를 정의할 때 **딱 한 번** 만들어져 호출마다 재사용된다. 그래서 앞 호출의 결과가 다음 호출에 남는다. `def f(xs=None)` 으로 두고 안에서 `if xs is None: xs = []` 하는 것이 정석이다." },
    ],
    code: { c: "a = [1, 2]\nb = a          # 같은 상자\nb.append(3)\nprint(a)       # [1, 2, 3] — a 도 바뀐다\n\nc = a[:]       # 이건 진짜 복사\nc.append(9)\nprint(a)       # [1, 2, 3] — 그대로", cap: "= 는 복사가 아니라 이름표 하나 더 붙이기" },
    key: ["`b = a` 는 같은 리스트를 가리킨다", "복사는 `a[:]` 또는 `list(a)`", "기본값 `=[]` 는 호출마다 새로 만들어지지 않는다"],
  },
  q: [
    {
      k: "add_item · 원본을 건드리지 않기", cat: "debug",
      q: "리스트와 값을 받아 <b>새 리스트</b>에 값을 덧붙여 돌려주세요. 원래 리스트는 그대로여야 합니다.",
      src: "def add_item(xs, v):\n    out = xs\n    out.append(v)\n    return out",
      sol: "def add_item(xs, v):\n    out = list(xs)\n    out.append(v)\n    return out",
      tests: [["add_item([1,2], 3)", "[1,2,3]"], ["(lambda a: (add_item(a,9), a))([1,2])", "([1,2,9],[1,2])"]],
      edge: [["add_item([], 1)", "[1]"]],
      ex: "out = xs 는 복사가 아니라 같은 리스트에 이름표를 하나 더 붙인 것입니다. append 하면 원본도 바뀌어요. list(xs) 로 진짜 복사본을 만들어야 합니다.",
    },
    {
      k: "collect · 기본값이 남는 함정", cat: "debug",
      q: "값을 목록에 덧붙여 돌려주되, 목록을 주지 않으면 <b>매번 빈 목록에서</b> 시작해야 합니다.",
      src: "def collect(v, bag=[]):\n    bag.append(v)\n    return bag",
      sol: "def collect(v, bag=None):\n    if bag is None:\n        bag = []\n    bag.append(v)\n    return bag",
      tests: [["(lambda: (collect(1), collect(2)))()", "([1],[2])"], ["collect(5, [1])", "[1,5]"]],
      edge: [["(lambda: (collect('a'), collect('b'), collect('c')))()", "(['a'],['b'],['c'])"]],
      ex: "기본값 [] 은 함수를 정의할 때 한 번만 만들어져 호출마다 재사용됩니다. 그래서 두 번째 호출이 [1,2] 가 돼요. None 을 기본값으로 두고 안에서 새로 만들어야 합니다.",
    },
  ],
},
{
  unit: "튜플과 집합",
  lesson: "직접 써 보기 — 집합으로 중복 없애기",
  th: {
    sum: "집합(`set`)은 **중복이 없고 순서도 없다.** 그래서 '있나 없나' 를 아주 빠르게 확인한다.",
    body: [
      { h: "순서가 없다는 것", t: "`set([3,1,2])` 를 그대로 리스트로 바꾸면 순서를 보장할 수 없다. 순서를 지키면서 중복만 없애려면 본 것을 기억하는 집합을 따로 두고, 결과는 리스트에 차례로 담는다." },
      { h: "왜 빠른가", t: "리스트에서 `x in xs` 는 앞에서부터 하나씩 본다(느리다). 집합에서 `x in s` 는 위치를 바로 계산한다(빠르다). 데이터가 커질수록 차이가 커진다." },
    ],
    code: { c: "본것 = set()\n결과 = []\nfor x in [3,1,3,2,1]:\n    if x not in 본것:\n        본것.add(x)\n        결과.append(x)\n# 결과: [3, 1, 2] — 순서를 지키면서 중복만 제거", cap: "순서를 지키려면 집합은 '기억' 용으로만 쓴다" },
    key: ["`set` 은 중복이 없고 순서도 없다", "순서를 지키려면 결과는 리스트에 담는다", "`in` 검사는 집합이 리스트보다 훨씬 빠르다"],
  },
  q: [
    {
      k: "dedup · 순서를 지키며 중복 제거", cat: "internals",
      q: "리스트에서 중복을 없애되 <b>처음 나온 순서를 그대로</b> 유지한 새 리스트를 돌려주세요.",
      src: "def dedup(xs):\n    return list(set(xs))",
      sol: "def dedup(xs):\n    seen = set()\n    out = []\n    for x in xs:\n        if x not in seen:\n            seen.add(x)\n            out.append(x)\n    return out",
      tests: [["dedup([3,1,3,2,1])", "[3,1,2]"], ["dedup(['b','a','b'])", "['b','a']"]],
      edge: [["dedup([])", "[]"], ["dedup([1,1,1])", "[1]"]],
      ex: "set 은 순서를 보장하지 않습니다. 중복은 사라지지만 순서가 뒤섞여요. 본 것을 기억하는 집합을 따로 두고 결과는 리스트에 차례로 담아야 합니다.",
    },
    {
      k: "common · 두 목록에 다 있는 것", cat: "internals",
      q: "두 리스트에 <b>모두</b> 들어 있는 값을 <b>첫 번째 리스트의 순서대로</b>, 중복 없이 돌려주세요.",
      src: "def common(a, b):\n    out = []\n    for x in a:\n        if x in b:\n            out.append(x)\n    return out",
      sol: "def common(a, b):\n    bs = set(b)\n    seen = set()\n    out = []\n    for x in a:\n        if x in bs and x not in seen:\n            seen.add(x)\n            out.append(x)\n    return out",
      tests: [["common([1,2,2,3],[2,3,4])", "[2,3]"], ["common([1,2],[3])", "[]"]],
      edge: [["common([],[1])", "[]"], ["common([5,5,5],[5])", "[5]"]],
      ex: "첫 리스트에 같은 값이 여러 번 있으면 결과에도 여러 번 들어갑니다. 이미 담은 것을 기억해 한 번만 넣어야 해요.",
    },
  ],
},
{
  unit: "클래스와 객체",
  lesson: "직접 써 보기 — 클래스 만들기",
  th: {
    sum: "클래스는 '값과 그 값을 다루는 방법' 을 한 덩어리로 묶는다. `self` 는 그 덩어리 자신을 가리킨다.",
    body: [
      { h: "self 를 빼먹으면", t: "`__init__` 안에서 `self.x = x` 라고 써야 그 값이 객체에 남는다. `x = x` 라고만 쓰면 함수가 끝나는 순간 사라진다. 메서드의 첫 인자에 `self` 를 빠뜨리면 부를 때 인자 개수가 안 맞는다는 오류가 난다." },
      { h: "메서드 안에서 꺼내 쓰기", t: "메서드 안에서 그 객체의 값을 쓰려면 반드시 `self.x` 라고 적는다. 그냥 `x` 라고 쓰면 파이썬은 지역 변수를 찾다가 없다고 한다." },
    ],
    code: { c: "class 계좌:\n    def __init__(self, 잔액):\n        self.잔액 = 잔액       # self. 가 있어야 남는다\n    def 입금(self, 금액):\n        self.잔액 += 금액\n        return self.잔액", cap: "self. 를 붙여야 객체에 남는다" },
    key: ["`self.x = x` 여야 객체에 남는다", "메서드 첫 인자는 항상 `self`", "메서드 안에서는 `self.x` 로 꺼낸다"],
  },
  q: [
    {
      k: "Counter · 세는 물건 만들기", cat: "internals",
      q: "<code>Counter</code> 클래스를 완성하세요. <code>add()</code> 를 부를 때마다 1씩 늘고, <code>value()</code> 는 현재 값을 돌려줍니다. 처음 값은 0입니다.",
      src: "class Counter:\n    def __init__(self):\n        count = 0\n    def add(self):\n        self.count += 1\n    def value(self):\n        return self.count",
      sol: "class Counter:\n    def __init__(self):\n        self.count = 0\n    def add(self):\n        self.count += 1\n    def value(self):\n        return self.count",
      tests: [["(lambda c: (c.add(), c.add(), c.value()))(Counter())[2]", "2"], ["Counter().value()", "0"]],
      edge: [["(lambda c: (c.value()))(Counter())", "0"]],
      ex: "__init__ 안에서 count = 0 이라고만 쓰면 함수가 끝나는 순간 사라집니다. self.count = 0 이어야 객체에 남아요.",
    },
    {
      k: "Rect · 넓이를 아는 사각형", cat: "internals",
      q: "가로·세로를 받아 넓이를 돌려주는 <code>area()</code> 를 가진 <code>Rect</code> 클래스를 완성하세요.",
      src: "class Rect:\n    def __init__(self, w, h):\n        self.w = w\n        self.h = h\n    def area():\n        return self.w * self.h",
      sol: "class Rect:\n    def __init__(self, w, h):\n        self.w = w\n        self.h = h\n    def area(self):\n        return self.w * self.h",
      tests: [["Rect(3,4).area()", "12"], ["Rect(1,1).area()", "1"]],
      edge: [["Rect(0,5).area()", "0"]],
      ex: "메서드의 첫 인자에 self 가 빠졌습니다. Rect(3,4).area() 라고 부르면 파이썬이 객체 자신을 첫 인자로 넘기는데 받을 자리가 없어 오류가 나요.",
    },
  ],
},
{
  unit: "내장 함수",
  lesson: "직접 써 보기 — 내장 함수 골라 쓰기",
  th: {
    sum: "직접 반복문을 쓰기 전에, 파이썬이 이미 갖고 있는 도구가 있는지 본다. 짧아지고 덜 틀린다.",
    body: [
      { h: "자주 쓰는 것들", t: "`sum(xs)` 합, `max/min(xs)` 최대·최소, `len(xs)` 개수, `sorted(xs, key=…)` 정렬, `enumerate(xs)` 번호와 값을 함께, `zip(a, b)` 둘을 짝지어, `any/all` 하나라도/전부." },
      { h: "빈 것을 조심한다", t: "`max([])` 는 오류가 난다. `sum([])` 은 0이다. 빈 입력이 들어올 수 있으면 먼저 확인하거나 `max(xs, default=0)` 처럼 기본값을 준다 — 실무에서 가장 자주 터지는 자리다." },
    ],
    code: { c: "xs = [3, 1, 2]\nsum(xs)                       # 6\nmax(xs, default=0)            # 3, 비어 있어도 안전\nsorted(xs, reverse=True)      # [3, 2, 1]\nlist(enumerate(['a','b']))    # [(0,'a'), (1,'b')]", cap: "반복문을 쓰기 전에 내장 함수를 먼저 본다" },
    key: ["`max([])` 는 오류, `sum([])` 은 0", "`default=` 로 빈 입력을 안전하게", "`sorted` 는 새 리스트를 돌려주고 `sort()` 는 원본을 바꾼다"],
  },
  q: [
    {
      k: "average · 평균 구하기", cat: "internals",
      q: "숫자 리스트의 평균을 돌려주세요. <b>빈 리스트면 0.0</b> 을 돌려줘야 합니다.",
      src: "def average(xs):\n    return sum(xs) / len(xs)",
      sol: "def average(xs):\n    if not xs:\n        return 0.0\n    return sum(xs) / len(xs)",
      tests: [["average([1,2,3])", "2.0"], ["average([])", "0.0"], ["average([5])", "5.0"]],
      edge: [["average([1,2])", "1.5"]],
      ex: "빈 리스트면 len(xs) 가 0이라 ZeroDivisionError 가 납니다. 나누기 전에 비었는지 먼저 확인해야 해요.",
    },
    {
      k: "top_n · 큰 것부터 n개", cat: "internals",
      q: "숫자 리스트에서 <b>큰 것부터</b> n개를 리스트로 돌려주세요. n이 개수보다 크면 있는 만큼만 돌려줍니다.",
      src: "def top_n(xs, n):\n    return sorted(xs)[:n]",
      sol: "def top_n(xs, n):\n    return sorted(xs, reverse=True)[:n]",
      tests: [["top_n([3,1,4,1,5], 2)", "[5,4]"], ["top_n([1,2], 5)", "[2,1]"]],
      edge: [["top_n([], 3)", "[]"], ["top_n([7], 0)", "[]"]],
      ex: "sorted 는 기본이 오름차순이라 작은 것부터 나옵니다. reverse=True 를 줘야 큰 것부터예요. 슬라이싱은 개수를 넘겨도 오류 없이 있는 만큼만 줍니다.",
    },
  ],
},
{
  unit: "진리값·비교·스코프의 함정",
  lesson: "직접 써 보기 — 참·거짓의 함정",
  th: {
    sum: "파이썬에서 빈 것들(`0`, `\"\"`, `[]`, `{}`, `None`)은 전부 거짓처럼 쓰인다. 편하지만 함정이 된다.",
    body: [
      { h: "0 과 없음은 다르다", t: "`if x:` 는 x 가 `0` 일 때도 거짓이다. '값이 주어지지 않았다' 와 '값이 0이다' 를 구별하려면 `if x is None:` 이라고 정확히 물어야 한다. 재고 0개와 재고 미입력을 같이 취급하면 사고가 난다." },
      { h: "== 과 is", t: "`==` 는 '값이 같은가', `is` 는 '같은 물건인가' 를 묻는다. `None` 과 비교할 때만 `is` 를 쓰고, 숫자·문자열 비교에는 항상 `==` 를 쓴다." },
    ],
    code: { c: "def 재고(n=None):\n    if n is None:      # 안 준 경우\n        return \"미입력\"\n    if n == 0:         # 진짜 0개\n        return \"품절\"\n    return \"있음\"", cap: "'없음' 과 '0' 을 구별해서 물어야 한다" },
    key: ["`0`·`\"\"`·`[]`·`None` 은 모두 거짓처럼 쓰인다", "`None` 확인은 `is None`", "'0' 과 '안 줌' 을 구별하려면 조건을 나눈다"],
  },
  q: [
    {
      k: "label · 0 과 없음 구별하기", cat: "debug",
      q: "재고 수를 받아 <code>None</code> 이면 <code>\"미입력\"</code>, <code>0</code> 이면 <code>\"품절\"</code>, 그 외에는 <code>\"있음\"</code> 을 돌려주세요.",
      src: "def label(n):\n    if not n:\n        return \"미입력\"\n    return \"있음\"",
      sol: "def label(n):\n    if n is None:\n        return \"미입력\"\n    if n == 0:\n        return \"품절\"\n    return \"있음\"",
      tests: [["label(None)", "'미입력'"], ["label(0)", "'품절'"], ["label(3)", "'있음'"]],
      edge: [["label(-1)", "'있음'"]],
      ex: "if not n 은 0 도 참으로 잡습니다. 재고 0개와 미입력이 같은 취급을 받아요. None 은 is None 으로 따로 물어야 합니다.",
    },
    {
      k: "first_or · 비었으면 기본값", cat: "debug",
      q: "리스트의 첫 값을 돌려주되, <b>리스트가 비어 있을 때만</b> 기본값을 돌려주세요. 첫 값이 <code>0</code> 이나 빈 문자열이어도 그 값을 그대로 줘야 합니다.",
      src: "def first_or(xs, default):\n    return xs[0] if xs and xs[0] else default",
      sol: "def first_or(xs, default):\n    if len(xs) == 0:\n        return default\n    return xs[0]",
      tests: [["first_or([0,1], 9)", "0"], ["first_or([], 9)", "9"], ["first_or(['a'], 'z')", "'a'"]],
      edge: [["first_or([''], 'z')", "''"], ["first_or([None], 5)", "None"]],
      ex: "xs[0] 이 0 이거나 빈 문자열이면 거짓으로 판정돼 기본값이 나가 버립니다. '비었는가' 만 물어야 해요 — len(xs) == 0.",
    },
  ],
},
];
