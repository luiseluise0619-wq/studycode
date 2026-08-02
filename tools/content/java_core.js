/* Java 핵심 유닛 실습.
   Java 는 664문항에 실습 71개(11%)이고, 그 71개는 전부 exercism 임포트 유닛에 있다.
   배우는 유닛 34개는 하나도 없다 — Go 와 똑같은 모양이었다.

   채점은 러너의 javac + JUnit 이 한다. 네트워크 없이 도는 jar 만 쓴다.
   각 문항: cls(공개 클래스 이름) · src(반드시 실패) · sol · test(테스트 파일). */
module.exports = [
{
  unit: "Java 첫걸음",
  lesson: "직접 짜 보기 — 값이 같다는 것",
  th: {
    sum: "`==` 는 '같은 물건인가', `.equals()` 는 '값이 같은가' 를 묻는다. 문자열에서 이 둘을 헷갈리면 조용히 틀린다.",
    body: [
      { h: "왜 어떤 때는 맞나", t: "`\"a\" == \"a\"` 는 참이다. 컴파일할 때 정해진 같은 문자열은 한 곳에 모아 두기 때문이다(문자열 풀). 하지만 입력이나 계산으로 만들어진 문자열은 다른 물건이라 `==` 가 거짓이 된다. **테스트에서는 맞고 실제로는 틀리는** 전형적인 모양이다." },
      { h: "정수도 마찬가지", t: "`Integer` 는 -128~127 을 미리 만들어 재사용한다. 그래서 작은 수는 `==` 가 참이고 큰 수는 거짓이다. 값을 비교할 때는 항상 `.equals()` 를 쓰거나 기본형 `int` 로 꺼내 쓴다." },
    ],
    code: { c: "String a = \"kim\";\nString b = new String(\"kim\");\na == b          // false — 다른 물건\na.equals(b)     // true  — 값은 같다", cap: "값 비교는 .equals()" },
    key: ["`==` 는 같은 물건인지 묻는다", "값 비교는 `.equals()`", "`Integer` 도 큰 수에서 갈린다"],
  },
  q: [
    {
      k: "sameName · 이름이 같은가",
      cls: "Sol",
      q: "두 이름이 <b>값으로</b> 같은지 판단하세요. 어느 쪽이 <code>null</code> 이어도 터지면 안 되고, 둘 다 null 이면 <code>true</code> 입니다.",
      src: "public class Sol {\n    public static boolean sameName(String a, String b) {\n        return a == b;\n    }\n}\n",
      sol: "import java.util.Objects;\n\npublic class Sol {\n    public static boolean sameName(String a, String b) {\n        return Objects.equals(a, b);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 값이_같으면_참() {\n        String a = \"kim\";\n        String b = new StringBuilder(\"k\").append(\"im\").toString();\n        assertTrue(Sol.sameName(a, b));\n    }\n\n    @Test\n    public void 다르면_거짓() {\n        assertFalse(Sol.sameName(\"kim\", \"lee\"));\n    }\n\n    @Test\n    public void null_처리() {\n        assertTrue(Sol.sameName(null, null));\n        assertFalse(Sol.sameName(null, \"kim\"));\n        assertFalse(Sol.sameName(\"kim\", null));\n    }\n}\n" },
      ex: "== 는 두 변수가 같은 객체를 가리키는지 봅니다. 계산으로 만들어진 문자열은 글자가 같아도 다른 객체라 거짓이에요. Objects.equals 는 값을 비교하면서 null 도 안전하게 다룹니다.",
    },
    {
      k: "average · 정수 나눗셈",
      cls: "Sol",
      q: "정수 배열의 <b>평균</b>을 <code>double</code> 로 돌려주세요. 빈 배열이면 <code>0.0</code> 입니다.",
      src: "public class Sol {\n    public static double average(int[] xs) {\n        int sum = 0;\n        for (int x : xs) sum += x;\n        return sum / xs.length;\n    }\n}\n",
      sol: "public class Sol {\n    public static double average(int[] xs) {\n        if (xs.length == 0) return 0.0;\n        int sum = 0;\n        for (int x : xs) sum += x;\n        return (double) sum / xs.length;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 소수점이_살아야_한다() {\n        assertEquals(1.5, Sol.average(new int[]{1, 2}), 1e-9);\n        assertEquals(2.5, Sol.average(new int[]{1, 2, 3, 4}), 1e-9);\n    }\n\n    @Test\n    public void 정확히_나뉘는_경우() {\n        assertEquals(2.0, Sol.average(new int[]{1, 2, 3}), 1e-9);\n    }\n\n    @Test\n    public void 빈_배열() {\n        assertEquals(0.0, Sol.average(new int[]{}), 1e-9);\n    }\n}\n" },
      ex: "int / int 는 정수 나눗셈이라 소수점이 잘립니다. 3/2 가 1 이 돼요. 나누기 전에 한쪽을 double 로 바꿔야 하고, 빈 배열은 0으로 나눠 터집니다.",
    },
  ],
},
{
  unit: "반복문과 배열",
  lesson: "직접 짜 보기 — 경계와 기본값",
  th: {
    sum: "배열은 만들 때 **기본값으로 채워진다.** `int[]` 는 0, 객체 배열은 `null` 이다.",
    body: [
      { h: "채워졌는지 확인하기", t: "`new String[3]` 은 길이 3짜리 `null` 세 칸이다. 채우지 않고 `.length()` 를 부르면 NullPointerException 이다. '값이 없음' 과 '빈 문자열' 을 구별해야 하는 자리에서 자주 터진다." },
      { h: "마지막 칸", t: "`for (int i = 0; i <= xs.length; i++)` 는 없는 칸을 건드려 예외가 난다. 반대로 `i < xs.length - 1` 은 마지막 칸을 빼먹는다. 이웃끼리 비교할 때는 후자가 맞고, 전부 훑을 때는 `i < xs.length` 다." },
    ],
    code: { c: "int[] a = new int[3];       // {0, 0, 0}\nString[] s = new String[2];  // {null, null}\n\nfor (int i = 0; i < a.length; i++) …        // 전부\nfor (int i = 0; i < a.length - 1; i++) …    // 이웃 비교", cap: "객체 배열의 기본값은 null 이다" },
    key: ["`int[]` 는 0, 객체 배열은 `null` 로 찬다", "전부 훑기는 `i < length`", "이웃 비교는 `i < length - 1`"],
  },
  q: [
    {
      k: "isSorted · 오름차순인가",
      cls: "Sol",
      q: "배열이 <b>오름차순(같은 값 허용)</b>인지 판단하세요. 빈 배열과 한 칸짜리는 <code>true</code> 입니다.",
      src: "public class Sol {\n    public static boolean isSorted(int[] xs) {\n        for (int i = 0; i < xs.length; i++) {\n            if (xs[i] > xs[i + 1]) return false;\n        }\n        return true;\n    }\n}\n",
      sol: "public class Sol {\n    public static boolean isSorted(int[] xs) {\n        for (int i = 0; i < xs.length - 1; i++) {\n            if (xs[i] > xs[i + 1]) return false;\n        }\n        return true;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 정렬된_경우() {\n        assertTrue(Sol.isSorted(new int[]{1, 2, 3}));\n        assertTrue(Sol.isSorted(new int[]{1, 1, 2}));\n    }\n\n    @Test\n    public void 아닌_경우() {\n        assertFalse(Sol.isSorted(new int[]{2, 1}));\n        assertFalse(Sol.isSorted(new int[]{1, 3, 2}));\n    }\n\n    @Test\n    public void 경계() {\n        assertTrue(Sol.isSorted(new int[]{}));\n        assertTrue(Sol.isSorted(new int[]{7}));\n    }\n}\n" },
      ex: "i 가 마지막 칸일 때 xs[i+1] 은 배열 밖입니다. ArrayIndexOutOfBoundsException 이 나요. 이웃끼리 비교할 때는 마지막 하나 앞에서 멈춰야 합니다.",
    },
    {
      k: "firstNonEmpty · 비어 있지 않은 첫 값",
      cls: "Sol",
      q: "문자열 배열에서 <b>null 도 빈 문자열도 아닌</b> 첫 값을 돌려주세요. 없으면 <code>null</code> 입니다.",
      src: "public class Sol {\n    public static String firstNonEmpty(String[] xs) {\n        for (String s : xs) {\n            if (s.length() > 0) return s;\n        }\n        return null;\n    }\n}\n",
      sol: "public class Sol {\n    public static String firstNonEmpty(String[] xs) {\n        for (String s : xs) {\n            if (s != null && !s.isEmpty()) return s;\n        }\n        return null;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 첫_값을_찾는다() {\n        assertEquals(\"b\", Sol.firstNonEmpty(new String[]{\"\", \"b\", \"c\"}));\n    }\n\n    @Test\n    public void null_을_건너뛴다() {\n        assertEquals(\"x\", Sol.firstNonEmpty(new String[]{null, \"\", \"x\"}));\n    }\n\n    @Test\n    public void 없으면_null() {\n        assertNull(Sol.firstNonEmpty(new String[]{null, \"\"}));\n        assertNull(Sol.firstNonEmpty(new String[3]));\n        assertNull(Sol.firstNonEmpty(new String[]{}));\n    }\n}\n" },
      ex: "new String[3] 은 null 세 칸입니다. null.length() 를 부르면 NullPointerException 이 나요 — null 확인이 먼저입니다.",
    },
  ],
},
{
  unit: "메서드",
  lesson: "직접 짜 보기 — 넘긴 것이 바뀌는가",
  th: {
    sum: "Java 는 **값을 복사해서 넘긴다.** 객체를 넘기면 '참조라는 값' 이 복사되므로, 객체 안은 바꿀 수 있어도 변수 자체는 못 바꾼다.",
    body: [
      { h: "바꿀 수 있는 것 · 없는 것", t: "메서드 안에서 `list.add(x)` 는 부른 쪽에도 보인다 — 같은 객체이기 때문이다. 하지만 `list = new ArrayList<>()` 는 그 메서드 안의 변수만 바꾼다. 부른 쪽은 여전히 원래 목록을 본다. 새 값을 주고 싶으면 **돌려줘야** 한다." },
      { h: "기본형은 절대 안 바뀐다", t: "`int` 를 넘겨서 안에서 `n++` 해도 부른 쪽은 그대로다. Java 에는 참조로 넘기는 방법이 없다. 값을 바꿔 주고 싶으면 돌려주거나, 담을 객체를 함께 넘긴다." },
    ],
    code: { c: "void f(List<String> a) {\n    a.add(\"x\");             // 부른 쪽에도 보인다\n    a = new ArrayList<>();   // 여기서만 바뀐다\n}", cap: "객체 안은 바꿀 수 있고, 변수 자체는 못 바꾼다" },
    key: ["객체 안은 바꿀 수 있다", "변수 자체는 못 바꾼다", "새 값은 `return` 으로 준다"],
  },
  q: [
    {
      k: "appended · 새 목록을 돌려주기",
      cls: "Sol",
      q: "받은 목록에 값을 덧붙인 <b>새 목록</b>을 돌려주세요. <b>원래 목록은 그대로</b>여야 합니다.",
      src: "import java.util.List;\n\npublic class Sol {\n    public static List<String> appended(List<String> xs, String v) {\n        xs.add(v);\n        return xs;\n    }\n}\n",
      sol: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static List<String> appended(List<String> xs, String v) {\n        List<String> out = new ArrayList<>(xs);\n        out.add(v);\n        return out;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 새_목록에_붙는다() {\n        List<String> a = new ArrayList<>(Arrays.asList(\"x\"));\n        List<String> b = Sol.appended(a, \"y\");\n        assertEquals(Arrays.asList(\"x\", \"y\"), b);\n    }\n\n    @Test\n    public void 원본은_그대로() {\n        List<String> a = new ArrayList<>(Arrays.asList(\"x\"));\n        Sol.appended(a, \"y\");\n        assertEquals(Arrays.asList(\"x\"), a);\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertEquals(Arrays.asList(\"z\"), Sol.appended(new ArrayList<String>(), \"z\"));\n    }\n}\n" },
      ex: "받은 목록에 바로 add 하면 부른 쪽의 목록이 함께 바뀝니다. 남의 데이터를 말없이 고치는 셈이에요 — 복사본을 만들어 붙여야 합니다.",
    },
    {
      k: "clampAll · 배열 칸을 실제로 바꾸기",
      cls: "Sol",
      q: "배열의 모든 값을 <code>lo</code>~<code>hi</code> 범위 안으로 넣어 <b>그 자리에서</b> 바꾸세요.",
      src: "public class Sol {\n    public static int clamp(int v, int lo, int hi) {\n        if (v < lo) v = lo;\n        if (v > hi) v = hi;\n        return v;\n    }\n\n    public static void clampAll(int[] xs, int lo, int hi) {\n        for (int x : xs) {\n            x = clamp(x, lo, hi);\n        }\n    }\n}\n",
      sol: "public class Sol {\n    public static int clamp(int v, int lo, int hi) {\n        if (v < lo) v = lo;\n        if (v > hi) v = hi;\n        return v;\n    }\n\n    public static void clampAll(int[] xs, int lo, int hi) {\n        for (int i = 0; i < xs.length; i++) {\n            xs[i] = clamp(xs[i], lo, hi);\n        }\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 하나씩() {\n        assertEquals(5, Sol.clamp(1, 5, 10));\n        assertEquals(10, Sol.clamp(99, 5, 10));\n        assertEquals(7, Sol.clamp(7, 5, 10));\n    }\n\n    @Test\n    public void 배열_전체가_바뀐다() {\n        int[] xs = {1, 7, 99};\n        Sol.clampAll(xs, 5, 10);\n        assertArrayEquals(new int[]{5, 7, 10}, xs);\n    }\n\n    @Test\n    public void 빈_배열() {\n        int[] xs = {};\n        Sol.clampAll(xs, 0, 1);\n        assertEquals(0, xs.length);\n    }\n}\n" },
      ex: "for (int x : xs) 의 x 는 복사본입니다. x 에 대입해도 배열은 그대로예요. 배열 칸을 바꾸려면 인덱스로 xs[i] 에 직접 넣어야 합니다.",
    },
  ],
},
{
  unit: "클래스와 객체",
  lesson: "직접 짜 보기 — 안을 내주지 않기",
  th: {
    sum: "필드를 `private` 으로 감춰도, 그 안의 **객체를 그대로 돌려주면** 바깥에서 고칠 수 있다.",
    body: [
      { h: "새는 캡슐화", t: "`return this.items;` 는 내부 목록 자체를 넘긴다. 받은 쪽이 `add` 하면 객체 안이 바뀐다 — `private` 은 아무 방어도 못 한 것이다. 복사본을 주거나 읽기 전용으로 감싸야 한다." },
      { h: "생성자에서도 마찬가지", t: "생성자에서 받은 목록을 그대로 필드에 넣으면, 넘긴 쪽이 나중에 그 목록을 고쳐 객체 상태를 바꿀 수 있다. 들어올 때도 나갈 때도 복사하는 것이 원칙이다." },
    ],
    code: { c: "Bag(List<String> src) {\n    this.items = new ArrayList<>(src);   // 들어올 때 복사\n}\nList<String> getItems() {\n    return new ArrayList<>(items);       // 나갈 때 복사\n}", cap: "들어올 때도 나갈 때도 복사한다" },
    key: ["내부 객체를 그대로 돌려주지 않는다", "생성자에서 받은 것도 복사한다", "읽기 전용으로 감싸는 것도 방법"],
  },
  q: [
    {
      k: "Bag · 안을 지키는 상자",
      cls: "Bag",
      q: "<code>Bag</code> 의 내부 목록이 <b>바깥에서 바뀌지 않게</b> 하세요. 생성자로 넘긴 목록을 나중에 고쳐도 영향이 없어야 합니다.",
      src: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Bag {\n    private final List<String> items;\n\n    public Bag(List<String> src) {\n        this.items = src;\n    }\n\n    public void add(String s) { items.add(s); }\n\n    public List<String> getItems() { return items; }\n\n    public int size() { return items.size(); }\n}\n",
      sol: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Bag {\n    private final List<String> items;\n\n    public Bag(List<String> src) {\n        this.items = new ArrayList<>(src);\n    }\n\n    public void add(String s) { items.add(s); }\n\n    public List<String> getItems() { return new ArrayList<>(items); }\n\n    public int size() { return items.size(); }\n}\n",
      test: { "BagTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class BagTest {\n    @Test\n    public void 기본_동작() {\n        Bag b = new Bag(new ArrayList<String>());\n        b.add(\"a\");\n        assertEquals(1, b.size());\n        assertEquals(Arrays.asList(\"a\"), b.getItems());\n    }\n\n    @Test\n    public void 돌려준_목록을_고쳐도_안전() {\n        Bag b = new Bag(new ArrayList<String>());\n        b.add(\"a\");\n        b.getItems().add(\"몰래\");\n        assertEquals(1, b.size());\n    }\n\n    @Test\n    public void 넘긴_목록을_고쳐도_안전() {\n        List<String> src = new ArrayList<>(Arrays.asList(\"a\"));\n        Bag b = new Bag(src);\n        src.add(\"몰래\");\n        assertEquals(1, b.size());\n    }\n}\n" },
      ex: "private 은 '필드 이름으로 접근하지 못하게' 할 뿐, 그 안의 객체를 넘겨주면 소용이 없습니다. 들어올 때도 나갈 때도 복사해야 안이 지켜져요.",
    },
    {
      k: "Point · 값이 같으면 같은 것",
      cls: "Point",
      q: "<code>Point</code> 두 개가 좌표가 같으면 <b>같은 것으로</b> 취급되게 하세요. <code>HashSet</code>·<code>HashMap</code> 에서도 그래야 합니다.",
      src: "public class Point {\n    public final int x, y;\n\n    public Point(int x, int y) { this.x = x; this.y = y; }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Point)) return false;\n        Point p = (Point) o;\n        return x == p.x && y == p.y;\n    }\n}\n",
      sol: "import java.util.Objects;\n\npublic class Point {\n    public final int x, y;\n\n    public Point(int x, int y) { this.x = x; this.y = y; }\n\n    @Override\n    public boolean equals(Object o) {\n        if (!(o instanceof Point)) return false;\n        Point p = (Point) o;\n        return x == p.x && y == p.y;\n    }\n\n    @Override\n    public int hashCode() { return Objects.hash(x, y); }\n}\n",
      test: { "PointTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class PointTest {\n    @Test\n    public void 값이_같으면_equals() {\n        assertEquals(new Point(1, 2), new Point(1, 2));\n        assertNotEquals(new Point(1, 2), new Point(2, 1));\n    }\n\n    @Test\n    public void 집합에서_중복으로_걸린다() {\n        Set<Point> s = new HashSet<>();\n        s.add(new Point(1, 2));\n        s.add(new Point(1, 2));\n        assertEquals(1, s.size());\n    }\n\n    @Test\n    public void 맵의_열쇠로_쓸_수_있다() {\n        Map<Point, String> m = new HashMap<>();\n        m.put(new Point(3, 4), \"거기\");\n        assertEquals(\"거기\", m.get(new Point(3, 4)));\n    }\n}\n" },
      ex: "equals 만 고치고 hashCode 를 놔두면 HashSet·HashMap 이 서로 다른 칸에 넣어 버립니다. 값이 같은데도 중복으로 걸리지 않고 맵에서 찾지도 못해요 — 둘은 반드시 짝으로 고칩니다.",
    },
  ],
},
{
  unit: "컬렉션과 제네릭",
  lesson: "직접 짜 보기 — 돌면서 지우기",
  th: {
    sum: "`for` 로 돌면서 컬렉션에서 원소를 지우면 `ConcurrentModificationException` 이 난다.",
    body: [
      { h: "왜 예외가 나나", t: "반복자는 '내가 보기 시작한 뒤 목록이 바뀌었는지' 를 세어 두고 확인한다. 돌던 중에 `list.remove()` 를 부르면 그 숫자가 어긋나 예외를 던진다. 조용히 건너뛰는 것보다 낫다 — 결과가 틀리는 대신 바로 알려 준다." },
      { h: "지우는 방법", t: "`list.removeIf(조건)` 이 가장 짧다. 반복자를 직접 쓸 때는 `it.remove()` 를 쓴다. 아니면 남길 것만 새 목록에 담는다. `Arrays.asList` 로 만든 목록은 크기를 못 바꾸므로 이 방법들도 실패한다." },
    ],
    code: { c: "list.removeIf(s -> s.isEmpty());\n\nIterator<String> it = list.iterator();\nwhile (it.hasNext()) {\n    if (it.next().isEmpty()) it.remove();\n}", cap: "돌면서 지우려면 반복자에게 시킨다" },
    key: ["돌면서 `list.remove` 는 예외", "`removeIf` 가 가장 짧다", "`Arrays.asList` 는 크기를 못 바꾼다"],
  },
  q: [
    {
      k: "dropEmpty · 빈 문자열 지우기",
      cls: "Sol",
      q: "목록에서 <b>빈 문자열과 null</b> 을 지우세요. 받은 목록을 <b>그 자리에서</b> 고칩니다.",
      src: "import java.util.List;\n\npublic class Sol {\n    public static void dropEmpty(List<String> xs) {\n        for (String s : xs) {\n            if (s == null || s.isEmpty()) xs.remove(s);\n        }\n    }\n}\n",
      sol: "import java.util.List;\n\npublic class Sol {\n    public static void dropEmpty(List<String> xs) {\n        xs.removeIf(s -> s == null || s.isEmpty());\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 여러_개를_지운다() {\n        List<String> xs = new ArrayList<>(Arrays.asList(\"a\", \"\", \"b\", \"\", \"\"));\n        Sol.dropEmpty(xs);\n        assertEquals(Arrays.asList(\"a\", \"b\"), xs);\n    }\n\n    @Test\n    public void null_도_지운다() {\n        List<String> xs = new ArrayList<>(Arrays.asList(null, \"x\", null));\n        Sol.dropEmpty(xs);\n        assertEquals(Arrays.asList(\"x\"), xs);\n    }\n\n    @Test\n    public void 지울_것이_없으면_그대로() {\n        List<String> xs = new ArrayList<>(Arrays.asList(\"a\"));\n        Sol.dropEmpty(xs);\n        assertEquals(Arrays.asList(\"a\"), xs);\n    }\n}\n" },
      ex: "for 로 돌면서 목록을 고치면 ConcurrentModificationException 이 납니다. 게다가 s 가 null 이면 isEmpty() 에서도 터져요. removeIf 는 반복자를 안전하게 다뤄 줍니다.",
    },
    {
      k: "countBy · 세어서 담기",
      cls: "Sol",
      q: "문자열 목록에서 각 값이 <b>몇 번 나왔는지</b> 세어 맵으로 돌려주세요. <b>처음 나온 순서</b>가 유지되어야 합니다.",
      src: "import java.util.*;\n\npublic class Sol {\n    public static Map<String, Integer> countBy(List<String> xs) {\n        Map<String, Integer> m = new HashMap<>();\n        for (String s : xs) {\n            m.put(s, m.get(s) + 1);\n        }\n        return m;\n    }\n}\n",
      sol: "import java.util.*;\n\npublic class Sol {\n    public static Map<String, Integer> countBy(List<String> xs) {\n        Map<String, Integer> m = new LinkedHashMap<>();\n        for (String s : xs) {\n            m.merge(s, 1, Integer::sum);\n        }\n        return m;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 세기() {\n        Map<String, Integer> m = Sol.countBy(Arrays.asList(\"a\", \"b\", \"a\"));\n        assertEquals(Integer.valueOf(2), m.get(\"a\"));\n        assertEquals(Integer.valueOf(1), m.get(\"b\"));\n    }\n\n    @Test\n    public void 처음_나온_순서를_지킨다() {\n        Map<String, Integer> m = Sol.countBy(Arrays.asList(\"z\", \"a\", \"m\", \"a\"));\n        assertEquals(Arrays.asList(\"z\", \"a\", \"m\"), new ArrayList<>(m.keySet()));\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertTrue(Sol.countBy(new ArrayList<String>()).isEmpty());\n    }\n}\n" },
      ex: "m.get(s) 는 처음 보는 값이면 null 이고, null + 1 은 NullPointerException 입니다. 그리고 HashMap 은 넣은 순서를 지키지 않아요 — 순서가 필요하면 LinkedHashMap 입니다.",
    },
  ],
},
{
  unit: "예외와 문자열",
  lesson: "직접 짜 보기 — 삼키지 않기",
  th: {
    sum: "`catch (Exception e) {}` 로 삼키면 문제가 사라지는 게 아니라 **보이지 않게** 된다.",
    body: [
      { h: "잡을 것만 잡는다", t: "다룰 수 있는 예외만 잡고 나머지는 위로 올린다. `Exception` 을 통째로 잡으면 예상한 실패와 진짜 버그가 같은 취급을 받는다. 굳이 잡아야 한다면 원인을 담아 다시 던진다 — `throw new IllegalStateException(\"…\", e)` 처럼." },
      { h: "문자열 이어 붙이기", t: "반복문 안의 `s += x` 는 매번 새 문자열을 만든다. 목록이 길수록 급격히 느려진다. `StringBuilder` 로 모았다가 마지막에 한 번 만든다." },
    ],
    code: { c: "try {\n    return Integer.parseInt(s);\n} catch (NumberFormatException e) {\n    return def;          // 이것만 다룬다\n}", cap: "다룰 수 있는 예외만 잡는다" },
    key: ["빈 `catch` 로 삼키지 않는다", "`Exception` 통째로 잡지 않는다", "이어 붙이기는 `StringBuilder`"],
  },
  q: [
    {
      k: "parseOr · 못 읽으면 기본값",
      cls: "Sol",
      q: "문자열을 정수로 바꾸되 <b>형식이 잘못된 경우에만</b> 기본값을 돌려주세요. <code>null</code> 이 들어오면 <code>NullPointerException</code> 이 그대로 나가야 합니다.",
      src: "public class Sol {\n    public static int parseOr(String s, int def) {\n        try {\n            return Integer.parseInt(s);\n        } catch (Exception e) {\n            return def;\n        }\n    }\n}\n",
      sol: "public class Sol {\n    public static int parseOr(String s, int def) {\n        if (s == null) throw new NullPointerException(\"s\");\n        try {\n            return Integer.parseInt(s);\n        } catch (NumberFormatException e) {\n            return def;\n        }\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 정상() {\n        assertEquals(42, Sol.parseOr(\"42\", 0));\n        assertEquals(-3, Sol.parseOr(\"-3\", 0));\n    }\n\n    @Test\n    public void 형식_오류면_기본값() {\n        assertEquals(7, Sol.parseOr(\"abc\", 7));\n        assertEquals(7, Sol.parseOr(\"\", 7));\n    }\n\n    @Test(expected = NullPointerException.class)\n    public void null_은_그대로_던진다() {\n        Sol.parseOr(null, 7);\n    }\n}\n" },
      ex: "catch (Exception e) 는 형식 오류뿐 아니라 null 로 인한 오류까지 삼킵니다. '값이 없어서 실패' 와 '숫자가 아니어서 실패' 가 같은 취급을 받아요.",
    },
    {
      k: "join · 이어 붙이기",
      cls: "Sol",
      q: "문자열 목록을 구분자로 이어 붙여 돌려주세요. 구분자는 <b>사이에만</b> 들어갑니다.",
      src: "import java.util.List;\n\npublic class Sol {\n    public static String join(List<String> xs, String sep) {\n        String s = \"\";\n        for (String x : xs) {\n            s += sep + x;\n        }\n        return s;\n    }\n}\n",
      sol: "import java.util.List;\n\npublic class Sol {\n    public static String join(List<String> xs, String sep) {\n        StringBuilder b = new StringBuilder();\n        for (int i = 0; i < xs.size(); i++) {\n            if (i > 0) b.append(sep);\n            b.append(xs.get(i));\n        }\n        return b.toString();\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 사이에만_들어간다() {\n        assertEquals(\"a-b-c\", Sol.join(Arrays.asList(\"a\", \"b\", \"c\"), \"-\"));\n    }\n\n    @Test\n    public void 하나면_구분자가_없다() {\n        assertEquals(\"x\", Sol.join(Arrays.asList(\"x\"), \",\"));\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertEquals(\"\", Sol.join(new ArrayList<String>(), \",\"));\n    }\n}\n" },
      ex: "구분자를 앞에 붙이면 맨 앞에도 하나 생깁니다. 그리고 문자열 += 는 매번 새 문자열을 만들어 목록이 길수록 급격히 느려져요.",
    },
  ],
},
{
  unit: "스트림 API와 지연 평가 (중급)",
  lesson: "직접 짜 보기 — 스트림은 한 번만",
  th: {
    sum: "스트림은 **한 번 쓰면 끝난다.** 그리고 최종 연산이 오기 전까지는 아무것도 실행되지 않는다.",
    body: [
      { h: "재사용하면 예외", t: "`Stream` 을 변수에 담아 두 번 쓰면 `IllegalStateException: stream has already been operated upon or closed` 가 난다. 두 번 써야 하면 원본 컬렉션에서 스트림을 다시 만든다." },
      { h: "지연 평가", t: "`filter`·`map` 은 예약만 해 둔다. `collect`·`count` 같은 최종 연산이 와야 실제로 돈다. 최종 연산 없이 `peek` 만 걸어 두면 아무것도 출력되지 않는다 — 디버깅할 때 헷갈리는 자리다." },
    ],
    code: { c: "List<String> out = xs.stream()\n    .filter(s -> !s.isEmpty())\n    .map(String::toUpperCase)\n    .collect(Collectors.toList());   // 여기서 실제로 돈다", cap: "최종 연산이 와야 실행된다" },
    key: ["스트림은 한 번만 쓸 수 있다", "최종 연산 전에는 실행되지 않는다", "두 번 쓰려면 다시 만든다"],
  },
  q: [
    {
      k: "summary · 두 번 쓰지 않기",
      cls: "Sol",
      q: "숫자 목록에서 <b>양수의 개수</b>와 <b>양수의 합</b>을 <code>\"개수:합\"</code> 형태로 돌려주세요.",
      src: "import java.util.List;\nimport java.util.stream.Stream;\n\npublic class Sol {\n    public static String summary(List<Integer> xs) {\n        Stream<Integer> pos = xs.stream().filter(v -> v > 0);\n        long n = pos.count();\n        int sum = pos.mapToInt(Integer::intValue).sum();\n        return n + \":\" + sum;\n    }\n}\n",
      sol: "import java.util.List;\n\npublic class Sol {\n    public static String summary(List<Integer> xs) {\n        long n = xs.stream().filter(v -> v > 0).count();\n        int sum = xs.stream().filter(v -> v > 0).mapToInt(Integer::intValue).sum();\n        return n + \":\" + sum;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 개수와_합() {\n        assertEquals(\"2:4\", Sol.summary(Arrays.asList(1, -5, 3)));\n    }\n\n    @Test\n    public void 양수가_없으면() {\n        assertEquals(\"0:0\", Sol.summary(Arrays.asList(-1, -2)));\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertEquals(\"0:0\", Sol.summary(new ArrayList<Integer>()));\n    }\n}\n" },
      ex: "같은 스트림을 두 번 쓰면 IllegalStateException 이 납니다. 스트림은 일회용이라 필요할 때마다 컬렉션에서 새로 만들어야 해요.",
    },
    {
      k: "topWords · 골라서 정렬해 담기",
      cls: "Sol",
      q: "문자열 목록에서 <b>길이가 3 이상</b>인 것만 골라 <b>대문자로</b> 바꾸고 <b>사전순</b>으로 정렬해 돌려주세요.",
      src: "import java.util.*;\nimport java.util.stream.*;\n\npublic class Sol {\n    public static List<String> topWords(List<String> xs) {\n        return xs.stream()\n                .filter(s -> s.length() >= 3)\n                .map(String::toUpperCase)\n                .collect(Collectors.toList());\n    }\n}\n",
      sol: "import java.util.*;\nimport java.util.stream.*;\n\npublic class Sol {\n    public static List<String> topWords(List<String> xs) {\n        return xs.stream()\n                .filter(s -> s.length() >= 3)\n                .map(String::toUpperCase)\n                .sorted()\n                .collect(Collectors.toList());\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 고르고_바꾸고_정렬() {\n        assertEquals(Arrays.asList(\"APPLE\", \"BANANA\"),\n            Sol.topWords(Arrays.asList(\"banana\", \"hi\", \"apple\")));\n    }\n\n    @Test\n    public void 경계_길이() {\n        assertEquals(Arrays.asList(\"ABC\"), Sol.topWords(Arrays.asList(\"ab\", \"abc\")));\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertTrue(Sol.topWords(new ArrayList<String>()).isEmpty());\n    }\n}\n" },
      ex: "정렬 단계가 빠져 입력 순서 그대로 나옵니다. sorted() 를 넣어야 하고, 대문자로 바꾼 뒤에 정렬해야 결과가 대문자 기준으로 맞습니다.",
    },
  ],
},
{
  unit: "컬렉션 내부 동작 (중급)",
  lesson: "직접 짜 보기 — 열쇠가 바뀌면",
  th: {
    sum: "`HashMap` 은 열쇠의 해시로 자리를 정한다. 넣은 **뒤에 열쇠가 바뀌면** 그 자리를 다시 찾지 못한다.",
    body: [
      { h: "바뀌는 열쇠", t: "열쇠로 쓴 객체의 필드를 나중에 고치면 해시가 달라진다. 맵은 예전 해시 자리에 넣어 뒀으므로 `get` 이 `null` 을 돌려준다 — 분명히 넣었는데 없다고 한다. 열쇠는 **변하지 않는 값**이어야 한다." },
      { h: "없는 열쇠 다루기", t: "`m.get(k)` 는 없으면 `null` 이다. 거기에 바로 `.add()` 하면 NullPointerException 이다. `computeIfAbsent` 는 없으면 만들어 주고 있으면 그대로 쓴다 — 묶기 코드가 한 줄로 줄어든다." },
    ],
    code: { c: "Key k = new Key(1);\nmap.put(k, \"값\");\nk.id = 2;              // 열쇠가 바뀌었다\nmap.get(k);            // null — 못 찾는다", cap: "열쇠는 변하지 않아야 한다" },
    key: ["열쇠는 불변이어야 한다", "`equals` 와 `hashCode` 는 짝", "없는 열쇠는 `computeIfAbsent`"],
  },
  q: [
    {
      k: "Key · 변하지 않는 열쇠",
      cls: "Key",
      q: "<code>Key</code> 를 <b>불변</b>으로 만들어 <code>HashMap</code> 의 열쇠로 안전하게 쓰이게 하세요. 필드는 밖에서 바꿀 수 없어야 합니다.",
      src: "public class Key {\n    public int id;\n\n    public Key(int id) { this.id = id; }\n\n    public void setId(int id) { this.id = id; }\n\n    @Override\n    public boolean equals(Object o) {\n        return (o instanceof Key) && ((Key) o).id == id;\n    }\n\n    @Override\n    public int hashCode() { return id; }\n}\n",
      sol: "public class Key {\n    private final int id;\n\n    public Key(int id) { this.id = id; }\n\n    public int getId() { return id; }\n\n    @Override\n    public boolean equals(Object o) {\n        return (o instanceof Key) && ((Key) o).id == id;\n    }\n\n    @Override\n    public int hashCode() { return id; }\n}\n",
      test: { "KeyTest.java": "import static org.junit.Assert.*;\nimport java.lang.reflect.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class KeyTest {\n    @Test\n    public void 맵의_열쇠로_동작한다() {\n        Map<Key, String> m = new HashMap<>();\n        m.put(new Key(1), \"하나\");\n        assertEquals(\"하나\", m.get(new Key(1)));\n        assertNull(m.get(new Key(2)));\n    }\n\n    @Test\n    public void 필드가_불변이어야_한다() {\n        for (Field f : Key.class.getDeclaredFields()) {\n            assertTrue(\"필드 \" + f.getName() + \" 이 final 이 아니다\",\n                Modifier.isFinal(f.getModifiers()));\n            assertFalse(\"필드 \" + f.getName() + \" 이 public 이다\",\n                Modifier.isPublic(f.getModifiers()));\n        }\n    }\n\n    @Test\n    public void 값을_바꾸는_메서드가_없어야_한다() {\n        for (Method m : Key.class.getDeclaredMethods()) {\n            assertFalse(\"세터가 있다: \" + m.getName(), m.getName().startsWith(\"set\"));\n        }\n    }\n}\n" },
      ex: "열쇠를 넣은 뒤 필드를 바꾸면 해시가 달라져 맵이 그 자리를 못 찾습니다. 분명히 넣었는데 get 이 null 을 돌려줘요. 필드를 final·private 으로 두고 세터를 없애면 이 사고가 원천적으로 막힙니다.",
    },
    {
      k: "groupByLen · 없는 열쇠 다루기",
      cls: "Sol",
      q: "문자열 목록을 <b>길이별로</b> 묶은 맵으로 돌려주세요. 값은 그 길이의 문자열 목록이고 <b>입력 순서</b>를 지킵니다.",
      src: "import java.util.*;\n\npublic class Sol {\n    public static Map<Integer, List<String>> groupByLen(List<String> xs) {\n        Map<Integer, List<String>> m = new HashMap<>();\n        for (String s : xs) {\n            m.get(s.length()).add(s);\n        }\n        return m;\n    }\n}\n",
      sol: "import java.util.*;\n\npublic class Sol {\n    public static Map<Integer, List<String>> groupByLen(List<String> xs) {\n        Map<Integer, List<String>> m = new LinkedHashMap<>();\n        for (String s : xs) {\n            m.computeIfAbsent(s.length(), k -> new ArrayList<>()).add(s);\n        }\n        return m;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport java.util.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 길이별로_묶는다() {\n        Map<Integer, List<String>> m = Sol.groupByLen(Arrays.asList(\"a\", \"bb\", \"c\"));\n        assertEquals(Arrays.asList(\"a\", \"c\"), m.get(1));\n        assertEquals(Arrays.asList(\"bb\"), m.get(2));\n    }\n\n    @Test\n    public void 처음_나온_순서를_지킨다() {\n        Map<Integer, List<String>> m = Sol.groupByLen(Arrays.asList(\"bbb\", \"a\", \"cc\"));\n        assertEquals(Arrays.asList(3, 1, 2), new ArrayList<>(m.keySet()));\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertTrue(Sol.groupByLen(new ArrayList<String>()).isEmpty());\n    }\n}\n" },
      ex: "없는 열쇠를 get 하면 null 이고, null.add 는 NullPointerException 입니다. computeIfAbsent 가 없으면 만들어 주고, 순서가 필요하면 LinkedHashMap 을 씁니다.",
    },
  ],
},
];
