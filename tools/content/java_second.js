/* Java 실습 2차 — 실습이 하나도 없던 6개 유닛을 연다.

   객체지향 심화 · Optional · equals/hashCode 계약 · 불변 객체 · enum · 상속 실무.
   전부 '읽으면 알겠는데 짜면 틀리는' 자리다.

   채점은 러너의 javac + JUnit 4 가 한다. 네트워크 없이 도는 jar 만 쓴다.
   각 문항: cls(공개 클래스 이름) · src(반드시 실패) · sol · test.
   한 파일에 공개 클래스는 하나뿐이라, 도움 클래스는 public 을 빼고 같은 파일에 둔다. */
module.exports = [
/* ── 객체지향 심화 ────────────────────────────────────────── */
{
  unit: "객체지향 심화",
  lesson: "직접 짜 보기 — 공통을 위로 올리기",
  th: {
    sum: "같은 일을 하는 것들을 하나의 **약속(인터페이스·추상 클래스)** 아래 두면, 부르는 쪽에서 종류를 따질 필요가 없어진다.",
    body: [
      { h: "instanceof 가 늘어나면 신호다", t: "`if (x instanceof A) ... else if (x instanceof B)` 가 길어지면, 종류가 하나 늘 때마다 이 자리를 또 고쳐야 한다. 그리고 고치는 걸 잊으면 조용히 빠뜨린다. 각 종류가 **자기 일을 스스로 하게** 만들면 이 분기 자체가 사라진다." },
      { h: "추상 클래스는 뼈대를 준다", t: "공통 흐름은 부모가 쓰고, 달라지는 한 조각만 자식이 채우게 할 수 있다. 부모의 `describe()` 안에서 추상 메서드 `sound()` 를 부르면, 흐름은 한 곳에만 있고 자식은 자기 소리만 신경 쓰면 된다." },
      { h: "super 를 부르지 않으면 부모가 비어 있다", t: "자식 생성자에서 `super(name)` 을 부르지 않으면 부모의 필드는 채워지지 않는다. 자식이 자기 필드에 따로 저장해 두면 부모 쪽 `getName()` 은 계속 null 이다 — 물어보는 자리에 따라 답이 달라지는 이상한 객체가 된다." },
    ],
    code: { c: "abstract class Animal {\n    abstract String sound();\n    String describe() { return name + \": \" + sound(); }\n}\n\nclass Dog extends Animal {\n    Dog(String n) { super(n); }   // 이걸 빼면 부모가 빈다\n    String sound() { return \"멍멍\"; }\n}", cap: "흐름은 부모, 다른 조각만 자식" },
    key: ["`instanceof` 사슬은 신호다", "공통 흐름은 부모가 쓴다", "생성자에서 `super` 를 부른다"],
  },
  q: [
    {
      k: "totalArea · 종류를 따지지 않고 넓이 더하기",
      cls: "Sol",
      q: "도형 배열의 넓이를 모두 더해 돌려주세요. <b>도형 종류가 늘어도</b> 이 함수는 고치지 않아도 되게 만드세요.",
      src: "public class Sol {\n    public static double totalArea(Shape[] shapes) {\n        double sum = 0;\n        for (Shape s : shapes) {\n            if (s instanceof Rect) {\n                Rect r = (Rect) s;\n                sum += r.w * r.h;\n            }\n        }\n        return sum;\n    }\n}\n\ninterface Shape {\n    double area();\n}\n\nclass Rect implements Shape {\n    final double w, h;\n\n    Rect(double w, double h) { this.w = w; this.h = h; }\n\n    public double area() { return w * h; }\n}\n\nclass Square implements Shape {\n    final double a;\n\n    Square(double a) { this.a = a; }\n\n    public double area() { return a * a; }\n}\n",
      sol: "public class Sol {\n    public static double totalArea(Shape[] shapes) {\n        double sum = 0;\n        for (Shape s : shapes) {\n            sum += s.area();\n        }\n        return sum;\n    }\n}\n\ninterface Shape {\n    double area();\n}\n\nclass Rect implements Shape {\n    final double w, h;\n\n    Rect(double w, double h) { this.w = w; this.h = h; }\n\n    public double area() { return w * h; }\n}\n\nclass Square implements Shape {\n    final double a;\n\n    Square(double a) { this.a = a; }\n\n    public double area() { return a * a; }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 사각형만() {\n        assertEquals(6.0, Sol.totalArea(new Shape[]{new Rect(2, 3)}), 1e-9);\n    }\n\n    @Test\n    public void 정사각형도_세어야_한다() {\n        assertEquals(4.0, Sol.totalArea(new Shape[]{new Square(2)}), 1e-9);\n    }\n\n    @Test\n    public void 섞여_있어도() {\n        assertEquals(10.0, Sol.totalArea(new Shape[]{new Rect(2, 3), new Square(2)}), 1e-9);\n    }\n\n    @Test\n    public void 빈_배열() {\n        assertEquals(0.0, Sol.totalArea(new Shape[]{}), 1e-9);\n    }\n}\n" },
      ex: "instanceof 로 종류를 따지면 종류가 하나 늘 때마다 이 함수를 또 고쳐야 하고, 잊으면 조용히 0으로 세어집니다. 각 도형이 자기 넓이를 알고 있으니 그냥 물어보면 돼요.",
    },
    {
      k: "describe · 흐름은 부모가, 소리는 자식이",
      cls: "Sol",
      q: "<code>Animal.describe()</code> 가 <code>\"이름: 소리\"</code> 를 돌려주게 하세요. 소리는 <b>자식이 정합니다</b>.",
      src: "public class Sol {\n    public static String describeOf(Animal a) {\n        return a.describe();\n    }\n}\n\nabstract class Animal {\n    final String name;\n\n    Animal(String name) { this.name = name; }\n\n    abstract String sound();\n\n    String describe() { return name + \": \" + \"멍멍\"; }\n}\n\nclass Dog extends Animal {\n    Dog(String name) { super(name); }\n\n    String sound() { return \"멍멍\"; }\n}\n\nclass Cat extends Animal {\n    Cat(String name) { super(name); }\n\n    String sound() { return \"야옹\"; }\n}\n",
      sol: "public class Sol {\n    public static String describeOf(Animal a) {\n        return a.describe();\n    }\n}\n\nabstract class Animal {\n    final String name;\n\n    Animal(String name) { this.name = name; }\n\n    abstract String sound();\n\n    String describe() { return name + \": \" + sound(); }\n}\n\nclass Dog extends Animal {\n    Dog(String name) { super(name); }\n\n    String sound() { return \"멍멍\"; }\n}\n\nclass Cat extends Animal {\n    Cat(String name) { super(name); }\n\n    String sound() { return \"야옹\"; }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 개() {\n        assertEquals(\"바둑: 멍멍\", Sol.describeOf(new Dog(\"바둑\")));\n    }\n\n    @Test\n    public void 고양이() {\n        assertEquals(\"나비: 야옹\", Sol.describeOf(new Cat(\"나비\")));\n    }\n}\n" },
      ex: "부모가 소리를 직접 적어 두면 자식이 무엇을 정하든 소용이 없습니다. 공통 흐름만 부모에 두고 달라지는 조각은 추상 메서드로 물어봐야, 자식이 늘어도 부모는 그대로예요.",
    },
    {
      k: "super · 부모 자리를 채워 주기",
      cls: "Sol",
      q: "<code>Student</code> 를 만들 때 부모의 이름도 채워지게 하세요. <code>getName()</code> 이 이름을 돌려줘야 합니다.",
      src: "public class Sol {\n    public static String nameOf(Person p) {\n        return p.getName();\n    }\n}\n\nclass Person {\n    private String name;\n\n    Person() { }\n\n    Person(String name) { this.name = name; }\n\n    String getName() { return name; }\n}\n\nclass Student extends Person {\n    private final String myName;\n\n    Student(String name) {\n        this.myName = name;\n    }\n\n    String myName() { return myName; }\n}\n",
      sol: "public class Sol {\n    public static String nameOf(Person p) {\n        return p.getName();\n    }\n}\n\nclass Person {\n    private String name;\n\n    Person() { }\n\n    Person(String name) { this.name = name; }\n\n    String getName() { return name; }\n}\n\nclass Student extends Person {\n    Student(String name) {\n        super(name);\n    }\n\n    String myName() { return getName(); }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 부모_자리가_채워져야_한다() {\n        assertEquals(\"루이\", Sol.nameOf(new Student(\"루이\")));\n    }\n\n    @Test\n    public void 자식_쪽에서도_같은_이름() {\n        assertEquals(\"루이\", new Student(\"루이\").myName());\n    }\n}\n" },
      ex: "자식이 자기 필드에 따로 저장하면, 부모 쪽에서 물어볼 때는 여전히 비어 있습니다. 같은 객체인데 물어보는 자리에 따라 답이 달라져요. super 로 부모 자리를 채워야 합니다.",
    },
  ],
},
/* ── 중급 — Optional과 null 안전성 ────────────────────────── */
{
  unit: "중급 — Optional과 null 안전성",
  lesson: "직접 써 보기 — 없을 수도 있다는 것을 타입으로 말하기",
  th: {
    sum: "`Optional` 은 '없을 수도 있다' 를 **타입에 적어 두는** 것이다. 적어 두기만 하고 `get()` 으로 열면 아무 소용이 없다.",
    body: [
      { h: "of 와 ofNullable 은 다르다", t: "`Optional.of(null)` 은 그 자리에서 터진다. 값이 null 일 수 있으면 `Optional.ofNullable` 이다. 이걸 바꿔 쓰면 '없을 때를 다루려고 만든 코드' 가 없을 때 터지는 우스운 일이 생긴다." },
      { h: "get() 은 마지막 수단이다", t: "`o.get()` 은 비어 있으면 `NoSuchElementException` 을 던진다. null 검사를 안 한 것과 결과가 같다. `orElse(기본값)` 이나 `map(...)` 을 쓰면 '없을 때' 가 코드에 자연스럽게 적힌다." },
      { h: "map 은 있을 때만 지나간다", t: "`o.map(String::length)` 는 값이 있을 때만 함수를 적용하고, 없으면 그대로 빈 Optional 이다. if 문 없이 '있으면 이렇게' 를 이어 붙일 수 있다." },
    ],
    code: { c: "Optional.ofNullable(m.get(k))        // null 이어도 안전\n\no.orElse(\"손님\")                      // 없으면 기본값\no.map(String::length).orElse(0)      // 있을 때만 적용", cap: "없을 때를 코드에 적어 둔다" },
    key: ["null 가능하면 `ofNullable`", "`get()` 은 터진다", "`map` 은 있을 때만"],
  },
  q: [
    {
      k: "find · 없을 수도 있는 값 돌려주기",
      cls: "Sol",
      q: "맵에서 값을 찾아 <code>Optional</code> 로 돌려주세요. 키가 <b>없어도 터지면 안 됩니다</b>.",
      src: "import java.util.Map;\nimport java.util.Optional;\n\npublic class Sol {\n    public static Optional<String> find(Map<String, String> m, String k) {\n        return Optional.of(m.get(k));\n    }\n}\n",
      sol: "import java.util.Map;\nimport java.util.Optional;\n\npublic class Sol {\n    public static Optional<String> find(Map<String, String> m, String k) {\n        return Optional.ofNullable(m.get(k));\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.HashMap;\nimport java.util.Map;\nimport java.util.Optional;\n\npublic class SolTest {\n    @Test\n    public void 있으면_담아_준다() {\n        Map<String, String> m = new HashMap<>();\n        m.put(\"a\", \"가\");\n        assertEquals(Optional.of(\"가\"), Sol.find(m, \"a\"));\n    }\n\n    @Test\n    public void 없으면_빈_Optional() {\n        Map<String, String> m = new HashMap<>();\n        assertEquals(Optional.empty(), Sol.find(m, \"a\"));\n    }\n}\n" },
      ex: "Optional.of 는 null 을 받으면 그 자리에서 터집니다. '없을 때를 다루려고' 만든 코드가 없을 때 터지는 셈이에요. null 일 수 있으면 ofNullable 입니다.",
    },
    {
      k: "nameOr · 없으면 기본값으로",
      cls: "Sol",
      q: "값이 있으면 그 값을, 없으면 <code>\"손님\"</code> 을 돌려주세요. <b>예외가 나면 안 됩니다.</b>",
      src: "import java.util.Optional;\n\npublic class Sol {\n    public static String nameOr(Optional<String> o) {\n        return o.get();\n    }\n}\n",
      sol: "import java.util.Optional;\n\npublic class Sol {\n    public static String nameOr(Optional<String> o) {\n        return o.orElse(\"손님\");\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Optional;\n\npublic class SolTest {\n    @Test\n    public void 있으면_그_값() {\n        assertEquals(\"루이\", Sol.nameOr(Optional.of(\"루이\")));\n    }\n\n    @Test\n    public void 없으면_손님() {\n        assertEquals(\"손님\", Sol.nameOr(Optional.empty()));\n    }\n}\n" },
      ex: "get() 은 비어 있으면 예외를 던집니다. null 검사를 안 한 것과 결과가 같아요. orElse 를 쓰면 '없을 때는 이 값' 이 코드에 그대로 적힙니다.",
    },
    {
      k: "totalOf · 있는 것만 더하기",
      cls: "Sol",
      q: "목록 안에서 <b>값이 있는 것만</b> 더해 돌려주세요. 비어 있는 것은 건너뜁니다.",
      src: "import java.util.List;\nimport java.util.Optional;\n\npublic class Sol {\n    public static int totalOf(List<Optional<Integer>> xs) {\n        int sum = 0;\n        for (Optional<Integer> o : xs) {\n            sum += o.get();\n        }\n        return sum;\n    }\n}\n",
      sol: "import java.util.List;\nimport java.util.Optional;\n\npublic class Sol {\n    public static int totalOf(List<Optional<Integer>> xs) {\n        int sum = 0;\n        for (Optional<Integer> o : xs) {\n            sum += o.orElse(0);\n        }\n        return sum;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Arrays;\nimport java.util.Optional;\n\npublic class SolTest {\n    @Test\n    public void 전부_있을_때() {\n        assertEquals(3, Sol.totalOf(Arrays.asList(Optional.of(1), Optional.of(2))));\n    }\n\n    @Test\n    public void 빈_것이_섞여도() {\n        assertEquals(4, Sol.totalOf(Arrays.asList(Optional.of(1), Optional.empty(), Optional.of(3))));\n    }\n\n    @Test\n    public void 전부_비었을_때() {\n        assertEquals(0, Sol.totalOf(Arrays.asList(Optional.empty(), Optional.empty())));\n    }\n}\n" },
      ex: "목록 하나만 비어 있어도 get() 은 그 자리에서 전체를 멈춥니다. orElse(0) 이면 '없는 것은 0으로 친다' 는 규칙이 코드에 드러나요.",
    },
  ],
},
/* ── equals·hashCode·Comparable 계약 ──────────────────────── */
{
  unit: "equals·hashCode·Comparable 계약",
  lesson: "직접 짜 보기 — 같다는 약속을 지키기",
  th: {
    sum: "`equals` 를 고쳤으면 `hashCode` 도 같이 고쳐야 한다. 둘은 **한 쌍의 약속**이다.",
    body: [
      { h: "해시 자료구조는 hashCode 를 먼저 본다", t: "`HashSet`·`HashMap` 은 먼저 `hashCode` 로 칸을 찾고, 그 칸 안에서만 `equals` 로 비교한다. `equals` 만 고치면 값이 같은 두 객체가 서로 다른 칸에 들어가서 **영영 만나지 못한다.** 중복이 걸러지지 않고 `contains` 도 거짓이 된다." },
      { h: "매개변수 타입을 바꾸면 재정의가 아니다", t: "`equals(Money o)` 라고 쓰면 이름만 같은 **새 메서드**다. 컬렉션은 `equals(Object)` 를 부르므로 여전히 기본 동작(주소 비교)이 쓰인다. `@Override` 를 붙여 두면 컴파일러가 이 실수를 잡아 준다." },
      { h: "정렬 기준은 끝까지 정한다", t: "나이만 비교하면 나이가 같은 사람들의 순서는 정해지지 않는다. 목록이 어떻게 들어왔는지에 따라 결과가 달라진다. 1순위가 같을 때 무엇으로 가릴지까지 정해 둬야 언제 돌려도 같은 답이 나온다." },
    ],
    code: { c: "@Override\npublic boolean equals(Object o) { ... }\n\n@Override\npublic int hashCode() { return Objects.hash(x, y); }", cap: "equals 와 hashCode 는 한 쌍" },
    key: ["`equals` 를 고치면 `hashCode` 도", "`equals(Object)` 여야 재정의다", "정렬 기준은 끝까지"],
  },
  q: [
    {
      k: "Point · 값이 같으면 하나로 세기",
      cls: "Sol",
      q: "좌표가 같은 <code>Point</code> 는 <b>같은 것</b>으로 다뤄지게 하세요. <code>HashSet</code> 에 두 번 넣어도 하나여야 합니다.",
      src: "import java.util.Objects;\n\npublic class Sol {\n    public static int distinct(Point[] ps) {\n        java.util.Set<Point> set = new java.util.HashSet<>();\n        for (Point p : ps) set.add(p);\n        return set.size();\n    }\n}\n\nclass Point {\n    final int x, y;\n\n    Point(int x, int y) { this.x = x; this.y = y; }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Point)) return false;\n        Point p = (Point) o;\n        return x == p.x && y == p.y;\n    }\n}\n",
      sol: "import java.util.Objects;\n\npublic class Sol {\n    public static int distinct(Point[] ps) {\n        java.util.Set<Point> set = new java.util.HashSet<>();\n        for (Point p : ps) set.add(p);\n        return set.size();\n    }\n}\n\nclass Point {\n    final int x, y;\n\n    Point(int x, int y) { this.x = x; this.y = y; }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Point)) return false;\n        Point p = (Point) o;\n        return x == p.x && y == p.y;\n    }\n\n    @Override\n    public int hashCode() {\n        return Objects.hash(x, y);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 같은_좌표는_하나() {\n        assertEquals(1, Sol.distinct(new Point[]{new Point(1, 2), new Point(1, 2)}));\n    }\n\n    @Test\n    public void 다른_좌표는_둘() {\n        assertEquals(2, Sol.distinct(new Point[]{new Point(1, 2), new Point(3, 4)}));\n    }\n\n    @Test\n    public void 해시가_값에서_나와야_한다() {\n        assertEquals(new Point(1, 2).hashCode(), new Point(1, 2).hashCode());\n    }\n}\n" },
      ex: "HashSet 은 먼저 hashCode 로 칸을 찾고 그 칸 안에서만 equals 를 비교합니다. hashCode 를 안 고치면 값이 같아도 다른 칸으로 가서 서로 만나지 못해요.",
    },
    {
      k: "Money · 진짜 재정의하기",
      cls: "Sol",
      q: "금액이 같은 <code>Money</code> 를 <code>contains</code> 로 찾을 수 있게 하세요. <b>재정의가 되고 있는지</b> 확인해 보세요.",
      src: "import java.util.Objects;\n\npublic class Sol {\n    public static boolean has(java.util.Set<Money> set, Money m) {\n        return set.contains(m);\n    }\n}\n\nclass Money {\n    final int won;\n\n    Money(int won) { this.won = won; }\n\n    public boolean equals(Money o) {\n        return o != null && won == o.won;\n    }\n\n    @Override\n    public int hashCode() {\n        return Objects.hash(won);\n    }\n}\n",
      sol: "import java.util.Objects;\n\npublic class Sol {\n    public static boolean has(java.util.Set<Money> set, Money m) {\n        return set.contains(m);\n    }\n}\n\nclass Money {\n    final int won;\n\n    Money(int won) { this.won = won; }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Money)) return false;\n        return won == ((Money) o).won;\n    }\n\n    @Override\n    public int hashCode() {\n        return Objects.hash(won);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.HashSet;\nimport java.util.Set;\n\npublic class SolTest {\n    @Test\n    public void 값이_같으면_찾아야_한다() {\n        Set<Money> set = new HashSet<>();\n        set.add(new Money(1000));\n        assertTrue(Sol.has(set, new Money(1000)));\n    }\n\n    @Test\n    public void 값이_다르면_못_찾는다() {\n        Set<Money> set = new HashSet<>();\n        set.add(new Money(1000));\n        assertFalse(Sol.has(set, new Money(2000)));\n    }\n\n    @Test\n    public void 다른_타입과는_같지_않다() {\n        assertFalse(new Money(1000).equals(\"1000\"));\n    }\n}\n" },
      ex: "equals(Money) 는 이름만 같은 새 메서드입니다. 컬렉션은 equals(Object) 를 부르니 여전히 주소를 비교해요. @Override 를 붙여 두면 컴파일러가 이 실수를 바로 잡아 줍니다.",
    },
    {
      k: "sortPeople · 나이가 같으면 이름으로",
      cls: "Sol",
      q: "나이 <b>오름차순</b>으로 정렬하되, 나이가 같으면 <b>이름 오름차순</b>으로 가려 주세요.",
      src: "import java.util.Comparator;\nimport java.util.List;\n\npublic class Sol {\n    public static void sortPeople(List<Person> ps) {\n        ps.sort(Comparator.comparingInt(p -> p.age));\n    }\n}\n\nclass Person {\n    final String name;\n    final int age;\n\n    Person(String name, int age) { this.name = name; this.age = age; }\n}\n",
      sol: "import java.util.Comparator;\nimport java.util.List;\n\npublic class Sol {\n    public static void sortPeople(List<Person> ps) {\n        ps.sort(Comparator.<Person>comparingInt(p -> p.age).thenComparing(p -> p.name));\n    }\n}\n\nclass Person {\n    final String name;\n    final int age;\n\n    Person(String name, int age) { this.name = name; this.age = age; }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class SolTest {\n    @Test\n    public void 나이순() {\n        List<Person> ps = new ArrayList<>(Arrays.asList(new Person(\"a\", 30), new Person(\"b\", 20)));\n        Sol.sortPeople(ps);\n        assertEquals(\"b\", ps.get(0).name);\n    }\n\n    @Test\n    public void 나이가_같으면_이름순() {\n        List<Person> ps = new ArrayList<>(Arrays.asList(new Person(\"na\", 20), new Person(\"ga\", 20)));\n        Sol.sortPeople(ps);\n        assertEquals(\"ga\", ps.get(0).name);\n        assertEquals(\"na\", ps.get(1).name);\n    }\n}\n" },
      ex: "나이만 비교하면 나이가 같은 사람들의 순서는 '들어온 순서' 로 남습니다. 목록을 만드는 쪽이 바뀌면 결과도 바뀌어요. thenComparing 으로 끝까지 정해 두면 언제 돌려도 같습니다.",
    },
  ],
},
/* ── 불변 객체와 방어적 복사 ──────────────────────────────── */
{
  unit: "불변 객체와 방어적 복사",
  lesson: "직접 짜 보기 — 밖에서 못 바꾸게 하기",
  th: {
    sum: "`final` 은 **참조를 못 바꾼다**는 뜻이지, 그 안의 내용을 못 바꾼다는 뜻이 아니다.",
    body: [
      { h: "받은 그대로 저장하면 손잡이를 나눠 준 것", t: "생성자가 받은 리스트를 그대로 필드에 두면, 넘겨준 쪽이 나중에 그 리스트를 고칠 때 내 객체도 같이 바뀐다. 내가 모르는 사이에 내용이 달라지는 객체가 된다. 받은 것은 **복사해서** 담는다." },
      { h: "돌려줄 때도 마찬가지다", t: "게터가 내부 리스트를 그대로 돌려주면, 받은 쪽이 거기에 `add` 하는 순간 내 상태가 바뀐다. 복사본을 돌려주거나 `Collections.unmodifiableList` 로 감싸서 내보낸다. 들어올 때와 나갈 때 **양쪽 다** 막아야 한다." },
      { h: "바꾸는 대신 새로 만든다", t: "값을 고친 것이 필요하면 자기를 고치지 말고 **새 객체**를 만들어 돌려준다. 그러면 원래 객체를 들고 있는 다른 코드는 영향을 받지 않는다. 이 방식은 여러 곳에서 동시에 써도 안전하다." },
    ],
    code: { c: "Team(List<String> ms) {\n    this.members = new ArrayList<>(ms);   // 들어올 때 복사\n}\n\nList<String> getMembers() {\n    return new ArrayList<>(members);      // 나갈 때도 복사\n}", cap: "양쪽 다 막아야 불변이다" },
    key: ["`final` 은 내용을 지키지 않는다", "들어올 때·나갈 때 복사", "고칠 때는 새 객체로"],
  },
  q: [
    {
      k: "Team · 넘겨받은 목록을 복사해 담기",
      cls: "Sol",
      q: "생성자가 받은 목록을 <b>복사해서</b> 담으세요. 넘겨준 쪽이 나중에 그 목록을 고쳐도 팀은 그대로여야 합니다.",
      src: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static int size(Team t) { return t.count(); }\n}\n\nclass Team {\n    private final List<String> members;\n\n    Team(List<String> members) {\n        this.members = members;\n    }\n\n    int count() { return members.size(); }\n}\n",
      sol: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static int size(Team t) { return t.count(); }\n}\n\nclass Team {\n    private final List<String> members;\n\n    Team(List<String> members) {\n        this.members = new ArrayList<>(members);\n    }\n\n    int count() { return members.size(); }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class SolTest {\n    @Test\n    public void 처음_크기() {\n        assertEquals(2, Sol.size(new Team(new ArrayList<>(Arrays.asList(\"a\", \"b\")))));\n    }\n\n    @Test\n    public void 밖에서_고쳐도_그대로() {\n        List<String> ms = new ArrayList<>(Arrays.asList(\"a\", \"b\"));\n        Team t = new Team(ms);\n        ms.add(\"c\");\n        assertEquals(2, Sol.size(t));\n    }\n}\n" },
      ex: "받은 목록을 그대로 저장하면 손잡이를 나눠 가진 것과 같습니다. 넘겨준 쪽이 뒤에서 고치면 내 객체도 같이 바뀌어요. 생성자에서 새 리스트로 복사해 담아야 합니다.",
    },
    {
      k: "getMembers · 내보낼 때도 막기",
      cls: "Sol",
      q: "<code>getMembers()</code> 로 받은 목록을 고쳐도 팀은 <b>그대로</b>여야 합니다.",
      src: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static List<String> membersOf(Team t) { return t.getMembers(); }\n\n    public static int size(Team t) { return t.count(); }\n}\n\nclass Team {\n    private final List<String> members;\n\n    Team(List<String> members) {\n        this.members = new ArrayList<>(members);\n    }\n\n    List<String> getMembers() { return members; }\n\n    int count() { return members.size(); }\n}\n",
      sol: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static List<String> membersOf(Team t) { return t.getMembers(); }\n\n    public static int size(Team t) { return t.count(); }\n}\n\nclass Team {\n    private final List<String> members;\n\n    Team(List<String> members) {\n        this.members = new ArrayList<>(members);\n    }\n\n    List<String> getMembers() { return new ArrayList<>(members); }\n\n    int count() { return members.size(); }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class SolTest {\n    @Test\n    public void 내용은_같아야_한다() {\n        Team t = new Team(new ArrayList<>(Arrays.asList(\"a\", \"b\")));\n        assertEquals(Arrays.asList(\"a\", \"b\"), Sol.membersOf(t));\n    }\n\n    @Test\n    public void 받은_목록을_고쳐도_팀은_그대로() {\n        Team t = new Team(new ArrayList<>(Arrays.asList(\"a\", \"b\")));\n        Sol.membersOf(t).add(\"c\");\n        assertEquals(2, Sol.size(t));\n    }\n}\n" },
      ex: "게터가 내부 목록을 그대로 내보내면, 받은 쪽이 add 하는 순간 내 상태가 바뀝니다. 들어올 때만 막고 나갈 때 안 막으면 절반만 지킨 셈이에요.",
    },
    {
      k: "withName · 고치지 말고 새로 만들기",
      cls: "Sol",
      q: "이름만 바꾼 <b>새 객체</b>를 돌려주세요. 원래 객체는 바뀌면 안 됩니다.",
      src: "public class Sol {\n    public static User renamed(User u, String name) { return u.withName(name); }\n}\n\nclass User {\n    private String name;\n    private final int age;\n\n    User(String name, int age) { this.name = name; this.age = age; }\n\n    String getName() { return name; }\n\n    int getAge() { return age; }\n\n    User withName(String newName) {\n        this.name = newName;\n        return this;\n    }\n}\n",
      sol: "public class Sol {\n    public static User renamed(User u, String name) { return u.withName(name); }\n}\n\nclass User {\n    private final String name;\n    private final int age;\n\n    User(String name, int age) { this.name = name; this.age = age; }\n\n    String getName() { return name; }\n\n    int getAge() { return age; }\n\n    User withName(String newName) {\n        return new User(newName, age);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 새_객체는_새_이름() {\n        User u = new User(\"가\", 20);\n        assertEquals(\"나\", Sol.renamed(u, \"나\").getName());\n    }\n\n    @Test\n    public void 원래_객체는_그대로() {\n        User u = new User(\"가\", 20);\n        Sol.renamed(u, \"나\");\n        assertEquals(\"가\", u.getName());\n    }\n\n    @Test\n    public void 나이는_유지() {\n        assertEquals(20, Sol.renamed(new User(\"가\", 20), \"나\").getAge());\n    }\n}\n" },
      ex: "자기를 고쳐서 돌려주면, 원래 객체를 들고 있던 다른 코드까지 같이 바뀝니다. 새 객체를 만들어 돌려주면 각자 자기 값을 그대로 갖고 있어요.",
    },
  ],
},
/* ── 열거형(enum) 실무 ────────────────────────────────────── */
{
  unit: "열거형(enum) 실무",
  lesson: "직접 써 보기 — 정해진 값만 다니게 하기",
  th: {
    sum: "enum 은 '이 중 하나' 를 **타입으로** 못 박는 것이다. 그 안에 값과 동작도 같이 담을 수 있다.",
    body: [
      { h: "ordinal() 에 의미를 걸지 않는다", t: "`ordinal()` 은 그저 **선언한 순서**다. 나중에 누가 상수 하나를 가운데 끼워 넣으면 모든 숫자가 밀린다. 점수·코드처럼 뜻이 있는 값은 필드로 직접 적어 둔다 — 그러면 순서를 바꿔도 안전하다." },
      { h: "빠뜨린 값은 조용히 지나간다", t: "switch 에서 상수 하나를 빠뜨리면 컴파일은 되고 실행 중에 엉뚱한 기본값이 나간다. 새 상수를 추가하고 switch 고치는 것을 잊는 것이 흔한 사고다. 모든 상수를 다루고 있는지 눈으로 확인하는 습관이 필요하다." },
      { h: "valueOf 는 모르는 이름에 터진다", t: "`Level.valueOf(\"HIGHT\")` 는 `IllegalArgumentException` 이다. 사용자 입력이나 설정 파일에서 온 글자를 바로 넣으면 서버가 그대로 죽는다. 목록을 훑어 확인하거나 예외를 잡아 기본값으로 돌린다." },
    ],
    code: { c: "enum Level {\n    LOW(1), MID(5), HIGH(10);\n    final int score;\n    Level(int s) { this.score = s; }\n}", cap: "뜻이 있는 값은 필드로 적는다" },
    key: ["`ordinal()` 은 순서일 뿐", "switch 에서 빠뜨리지 않기", "`valueOf` 는 터질 수 있다"],
  },
  q: [
    {
      k: "score · 순서가 아니라 값으로",
      cls: "Sol",
      q: "각 등급의 점수를 돌려주세요. <code>LOW</code>는 1, <code>MID</code>는 5, <code>HIGH</code>는 10입니다. <b>선언 순서를 바꿔도</b> 맞아야 합니다.",
      src: "public class Sol {\n    public static int score(Level l) {\n        return l.ordinal() + 1;\n    }\n}\n\nenum Level {\n    LOW, MID, HIGH\n}\n",
      sol: "public class Sol {\n    public static int score(Level l) {\n        return l.score;\n    }\n}\n\nenum Level {\n    LOW(1), MID(5), HIGH(10);\n\n    final int score;\n\n    Level(int score) { this.score = score; }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 낮음() {\n        assertEquals(1, Sol.score(Level.LOW));\n    }\n\n    @Test\n    public void 중간() {\n        assertEquals(5, Sol.score(Level.MID));\n    }\n\n    @Test\n    public void 높음() {\n        assertEquals(10, Sol.score(Level.HIGH));\n    }\n}\n" },
      ex: "ordinal() 은 선언한 순서일 뿐이라 1, 2, 3 밖에 안 나옵니다. 게다가 누가 상수를 가운데 끼워 넣으면 모든 값이 밀려요. 뜻이 있는 값은 필드로 적어 둡니다.",
    },
    {
      k: "describe · 빠뜨린 값 없이",
      cls: "Sol",
      q: "<code>LOW</code>는 <code>\"낮음\"</code>, <code>MID</code>는 <code>\"보통\"</code>, <code>HIGH</code>는 <code>\"높음\"</code> 을 돌려주세요.",
      src: "public class Sol {\n    public static String describe(Level l) {\n        switch (l) {\n            case LOW:\n                return \"낮음\";\n            case HIGH:\n                return \"높음\";\n            default:\n                return \"모름\";\n        }\n    }\n}\n\nenum Level {\n    LOW, MID, HIGH\n}\n",
      sol: "public class Sol {\n    public static String describe(Level l) {\n        switch (l) {\n            case LOW:\n                return \"낮음\";\n            case MID:\n                return \"보통\";\n            case HIGH:\n                return \"높음\";\n            default:\n                return \"모름\";\n        }\n    }\n}\n\nenum Level {\n    LOW, MID, HIGH\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 세_등급_모두() {\n        assertEquals(\"낮음\", Sol.describe(Level.LOW));\n        assertEquals(\"보통\", Sol.describe(Level.MID));\n        assertEquals(\"높음\", Sol.describe(Level.HIGH));\n    }\n\n    @Test\n    public void 빠뜨린_값이_없어야_한다() {\n        for (Level l : Level.values()) {\n            assertNotEquals(\"모름\", Sol.describe(l));\n        }\n    }\n}\n" },
      ex: "switch 에서 상수 하나를 빠뜨려도 컴파일은 됩니다. 실행 중에 기본값이 조용히 나갈 뿐이에요. values() 로 전부 돌려 보는 테스트를 두면 빠뜨린 것이 바로 걸립니다.",
    },
    {
      k: "parse · 모르는 이름이 와도 버티기",
      cls: "Sol",
      q: "글자를 등급으로 바꿔 주세요. <b>모르는 글자</b>가 오면 터지지 말고 <code>LOW</code> 를 돌려줍니다.",
      src: "public class Sol {\n    public static Level parse(String s) {\n        return Level.valueOf(s);\n    }\n}\n\nenum Level {\n    LOW, MID, HIGH\n}\n",
      sol: "public class Sol {\n    public static Level parse(String s) {\n        for (Level l : Level.values()) {\n            if (l.name().equals(s)) return l;\n        }\n        return Level.LOW;\n    }\n}\n\nenum Level {\n    LOW, MID, HIGH\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 아는_이름() {\n        assertEquals(Level.HIGH, Sol.parse(\"HIGH\"));\n    }\n\n    @Test\n    public void 모르는_이름은_기본값() {\n        assertEquals(Level.LOW, Sol.parse(\"HIGHT\"));\n    }\n\n    @Test\n    public void 빈_글자도_기본값() {\n        assertEquals(Level.LOW, Sol.parse(\"\"));\n    }\n}\n" },
      ex: "valueOf 는 모르는 이름에 예외를 던집니다. 설정 파일이나 사용자 입력에서 온 글자를 바로 넣으면 오타 하나로 서버가 멈춰요. 목록을 훑어 확인하면 안전합니다.",
    },
  ],
},
/* ── 상속과 다형성 실무 (중급) ────────────────────────────── */
{
  unit: "상속과 다형성 실무 (중급)",
  lesson: "직접 짜 보기 — 재정의되는 것과 안 되는 것",
  th: {
    sum: "인스턴스 메서드는 **객체를 보고** 고르지만, static 메서드와 필드는 **변수의 타입을 보고** 고른다.",
    body: [
      { h: "static 은 재정의되지 않는다", t: "부모와 자식에 같은 이름의 static 메서드를 두면 그건 '가리기' 일 뿐이다. `Base b = new Child(); b.who()` 는 변수 타입이 `Base` 이므로 **부모 것**이 불린다. 자식마다 다르게 답하게 하고 싶으면 인스턴스 메서드여야 한다." },
      { h: "생성자에서 재정의 메서드를 부르지 않는다", t: "부모 생성자가 도는 시점에 자식 필드는 아직 채워지지 않았다. 그때 자식이 재정의한 메서드를 부르면 자식 필드는 0이나 null 이다. 컴파일도 되고 실행도 되지만 값만 이상하게 나오는, 찾기 어려운 사고다." },
      { h: "분기 대신 물어보기", t: "`instanceof` 로 갈라 쓰는 코드는 종류가 늘 때마다 손봐야 한다. 각 자식이 자기 답을 아는 메서드를 두면 부르는 쪽은 그냥 물어보면 된다 — 이것이 다형성을 쓰는 이유다." },
    ],
    code: { c: "Base b = new Child();\nb.who();     // static 이면 Base, 인스턴스 메서드면 Child\n\nBase() { init(); }   // 위험 — 자식 필드는 아직 비어 있다", cap: "무엇을 보고 고르는지가 다르다" },
    key: ["static 은 변수 타입으로 고른다", "생성자에서 재정의 메서드 금지", "분기 대신 물어본다"],
  },
  q: [
    {
      k: "who · 자식이 답하게 하기",
      cls: "Sol",
      q: "<code>Base</code> 타입 변수에 담아도 <b>실제 객체</b>가 답하게 하세요.",
      src: "public class Sol {\n    public static String whoOf(Base b) {\n        return b.who();\n    }\n}\n\nclass Base {\n    static String who() { return \"부모\"; }\n}\n\nclass Child extends Base {\n    static String who() { return \"자식\"; }\n}\n",
      sol: "public class Sol {\n    public static String whoOf(Base b) {\n        return b.who();\n    }\n}\n\nclass Base {\n    String who() { return \"부모\"; }\n}\n\nclass Child extends Base {\n    @Override\n    String who() { return \"자식\"; }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 부모는_부모() {\n        assertEquals(\"부모\", Sol.whoOf(new Base()));\n    }\n\n    @Test\n    public void 자식은_자식() {\n        assertEquals(\"자식\", Sol.whoOf(new Child()));\n    }\n}\n" },
      ex: "static 메서드는 재정의되지 않고 '가려질' 뿐입니다. 변수 타입이 Base 면 Base 것이 불려서, 어떤 객체를 넣어도 답이 같아요. 인스턴스 메서드여야 실제 객체가 답합니다.",
    },
    {
      k: "Report · 생성자에서 부르지 않기",
      cls: "Sol",
      q: "<code>title()</code> 이 <b>자식이 정한 제목</b>을 돌려주게 하세요. 부모 생성자에서 미리 만들어 두면 안 됩니다.",
      src: "public class Sol {\n    public static String titleOf(Report r) {\n        return r.title();\n    }\n}\n\nclass Report {\n    private final String cached;\n\n    Report() {\n        this.cached = header();\n    }\n\n    String header() { return \"보고서\"; }\n\n    String title() { return cached; }\n}\n\nclass Monthly extends Report {\n    private final String month;\n\n    Monthly() {\n        this.month = \"3월\";\n    }\n\n    @Override\n    String header() { return month + \" 보고서\"; }\n}\n",
      sol: "public class Sol {\n    public static String titleOf(Report r) {\n        return r.title();\n    }\n}\n\nclass Report {\n    Report() {\n    }\n\n    String header() { return \"보고서\"; }\n\n    String title() { return header(); }\n}\n\nclass Monthly extends Report {\n    private final String month;\n\n    Monthly() {\n        this.month = \"3월\";\n    }\n\n    @Override\n    String header() { return month + \" 보고서\"; }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 부모() {\n        assertEquals(\"보고서\", Sol.titleOf(new Report()));\n    }\n\n    @Test\n    public void 자식_필드가_반영돼야_한다() {\n        assertEquals(\"3월 보고서\", Sol.titleOf(new Monthly()));\n    }\n}\n" },
      ex: "부모 생성자가 도는 시점에 자식의 month 는 아직 채워지지 않아 null 입니다. 그래서 'null 보고서' 가 저장돼요. 필요할 때 물어보면 그때는 이미 다 채워져 있습니다.",
    },
    {
      k: "labelAll · 분기 대신 물어보기",
      cls: "Sol",
      q: "동물 배열의 이름표를 <code>[\"개\", \"고양이\"]</code> 처럼 모아 돌려주세요. <b>동물이 늘어도</b> 이 함수는 고치지 않아도 되게 하세요.",
      src: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static List<String> labelAll(Animal[] as) {\n        List<String> out = new ArrayList<>();\n        for (Animal a : as) {\n            if (a instanceof Dog) out.add(\"개\");\n            else out.add(\"고양이\");\n        }\n        return out;\n    }\n}\n\nabstract class Animal {\n    abstract String label();\n}\n\nclass Dog extends Animal {\n    String label() { return \"개\"; }\n}\n\nclass Cat extends Animal {\n    String label() { return \"고양이\"; }\n}\n\nclass Bird extends Animal {\n    String label() { return \"새\"; }\n}\n",
      sol: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static List<String> labelAll(Animal[] as) {\n        List<String> out = new ArrayList<>();\n        for (Animal a : as) {\n            out.add(a.label());\n        }\n        return out;\n    }\n}\n\nabstract class Animal {\n    abstract String label();\n}\n\nclass Dog extends Animal {\n    String label() { return \"개\"; }\n}\n\nclass Cat extends Animal {\n    String label() { return \"고양이\"; }\n}\n\nclass Bird extends Animal {\n    String label() { return \"새\"; }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Arrays;\n\npublic class SolTest {\n    @Test\n    public void 둘() {\n        assertEquals(Arrays.asList(\"개\", \"고양이\"), Sol.labelAll(new Animal[]{new Dog(), new Cat()}));\n    }\n\n    @Test\n    public void 새로_생긴_동물도() {\n        assertEquals(Arrays.asList(\"새\"), Sol.labelAll(new Animal[]{new Bird()}));\n    }\n}\n" },
      ex: "instanceof 로 갈라 쓰면 동물이 하나 늘 때마다 이 함수를 또 고쳐야 하고, 잊으면 엉뚱한 이름표가 붙습니다. 각자 자기 이름표를 알고 있으니 그냥 물어보면 돼요.",
    },
  ],
},
];
