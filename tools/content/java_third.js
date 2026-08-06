/* Java 실습 3차 — 실습이 하나도 없던 6개 유닛을 더 연다.
   제네릭과 타입 소거 · record·sealed·패턴 매칭 · 날짜·시간 API · 문자열 처리 ·
   함수형 인터페이스와 람다 · 동시성 제어.

   채점은 러너의 javac + JUnit 4 가 한다. 네트워크 없이 도는 jar 만 쓴다.
   한 파일에 공개 클래스는 하나뿐이라, 도움 클래스는 public 을 빼고 같은 파일에 둔다.

   동시성 문항의 실패는 경쟁 상태에 기대지 않는다. 대개 틀리지만 가끔 맞는 시작
   코드는 배우는 사람을 헷갈리게만 한다 — 언제 돌려도 같은 답이 나오게 만들었다. */
module.exports = [
/* ── 제네릭과 타입 소거 (중급) ────────────────────────────── */
{
  unit: "제네릭과 타입 소거 (중급)",
  lesson: "직접 짜 보기 — 타입을 매개변수로 받기",
  th: {
    sum: "제네릭은 **어떤 타입에도 쓰이는 코드**를 타입 안전하게 쓰게 해 준다.",
    body: [
      { h: "형 변환이 사라진다", t: "`Object` 로 담으면 꺼낼 때마다 형 변환을 해야 하고, 잘못 넣은 것은 실행 중에야 터진다. 제네릭으로 두면 넣을 때부터 컴파일러가 막는다 — 사고가 훨씬 앞당겨진다." },
      { h: "실행 중에는 타입이 지워진다", t: "`List<String>` 과 `List<Integer>` 는 실행 시점에 그냥 `List` 다(타입 소거). 그래서 `instanceof List<String>` 같은 것은 쓸 수 없고, 제네릭 배열도 못 만든다." },
      { h: "받을 때는 넓게, 줄 때는 좁게", t: "값을 꺼내 읽기만 하는 자리는 `? extends T`, 넣기만 하는 자리는 `? super T` 로 두면 더 많은 타입을 받을 수 있다. 읽는 쪽과 쓰는 쪽을 나눠 생각하면 헷갈리지 않는다." },
      { h: "경계를 두면 메서드를 쓸 수 있다", t: "`<T extends Comparable<T>>` 처럼 상한을 두면 그 타입의 메서드를 안에서 쓸 수 있다. 경계가 없으면 `Object` 의 메서드밖에 못 쓴다." },
    ],
    code: { c: "static <T extends Comparable<T>> T max(List<T> xs) { ... }\n\ndouble sum(List<? extends Number> xs)   // 읽기만 하는 자리", cap: "타입을 매개변수로 받는다" },
    key: ["형 변환이 사라진다", "실행 중에는 타입이 지워진다", "경계를 두면 메서드를 쓴다"],
  },
  q: [
    {
      k: "max · 어떤 타입이든 가장 큰 것",
      cls: "Sol",
      q: "목록에서 <b>가장 큰 값</b>을 돌려주세요. 숫자든 글자든 <b>비교할 수 있는 타입이면</b> 다 되어야 하고, 비어 있으면 <code>null</code> 입니다.",
      src: "import java.util.List;\n\npublic class Sol {\n    public static Integer max(List<Integer> xs) {\n        if (xs.isEmpty()) return null;\n        Integer best = xs.get(0);\n        for (Integer x : xs) if (x.compareTo(best) > 0) best = x;\n        return best;\n    }\n}\n",
      sol: "import java.util.List;\n\npublic class Sol {\n    public static <T extends Comparable<T>> T max(List<T> xs) {\n        if (xs.isEmpty()) return null;\n        T best = xs.get(0);\n        for (T x : xs) if (x.compareTo(best) > 0) best = x;\n        return best;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Arrays;\nimport java.util.Collections;\n\npublic class SolTest {\n    @Test\n    public void 숫자() {\n        assertEquals(Integer.valueOf(9), Sol.max(Arrays.asList(3, 9, 1)));\n    }\n\n    @Test\n    public void 글자도_된다() {\n        assertEquals(\"다\", Sol.max(Arrays.asList(\"가\", \"다\", \"나\")));\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertNull(Sol.max(Collections.<String>emptyList()));\n    }\n}\n" },
      ex: "Integer 로 못 박으면 문자열 목록에는 아예 못 씁니다. 같은 코드를 타입마다 복사하게 되고, 그중 하나만 고치는 날이 와요. 타입을 매개변수로 받으면 한 벌로 끝납니다.",
    },
    {
      k: "sumAll · 읽기만 하는 자리는 넓게",
      cls: "Sol",
      q: "숫자 목록의 합을 <code>double</code> 로 돌려주세요. <code>Integer</code> 목록도 <code>Double</code> 목록도 <b>모두 받을 수 있어야</b> 합니다.",
      src: "import java.util.List;\n\npublic class Sol {\n    public static double sumAll(List<Number> xs) {\n        double s = 0;\n        for (Number x : xs) s += x.doubleValue();\n        return s;\n    }\n}\n",
      sol: "import java.util.List;\n\npublic class Sol {\n    public static double sumAll(List<? extends Number> xs) {\n        double s = 0;\n        for (Number x : xs) s += x.doubleValue();\n        return s;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class SolTest {\n    @Test\n    public void 정수_목록() {\n        List<Integer> xs = Arrays.asList(1, 2, 3);\n        assertEquals(6.0, Sol.sumAll(xs), 1e-9);\n    }\n\n    @Test\n    public void 실수_목록도_된다() {\n        List<Double> xs = Arrays.asList(1.5, 2.5);\n        assertEquals(4.0, Sol.sumAll(xs), 1e-9);\n    }\n\n    @Test\n    public void 빈_목록() {\n        assertEquals(0.0, Sol.sumAll(Arrays.asList()), 1e-9);\n    }\n}\n" },
      ex: "List<Number> 는 List<Integer> 를 받지 못합니다. 상속 관계가 목록으로는 이어지지 않기 때문이에요. 읽기만 하는 자리라면 ? extends 로 두어 더 많은 타입을 받게 합니다.",
    },
    {
      k: "firstOf · 타입은 실행 중에 지워진다",
      cls: "Sol",
      q: "목록에서 <b>주어진 타입인 첫 값</b>을 돌려주세요. 없으면 <code>null</code> 입니다. 타입은 <code>Class</code> 로 받습니다.",
      src: "import java.util.List;\n\npublic class Sol {\n    public static <T> T firstOf(List<?> xs, Class<T> type) {\n        for (Object x : xs) return (T) x;\n        return null;\n    }\n}\n",
      sol: "import java.util.List;\n\npublic class Sol {\n    public static <T> T firstOf(List<?> xs, Class<T> type) {\n        for (Object x : xs) {\n            if (type.isInstance(x)) return type.cast(x);\n        }\n        return null;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Arrays;\n\npublic class SolTest {\n    @Test\n    public void 문자열_찾기() {\n        assertEquals(\"가\", Sol.firstOf(Arrays.asList(1, \"가\", 2), String.class));\n    }\n\n    @Test\n    public void 정수_찾기() {\n        assertEquals(Integer.valueOf(1), Sol.firstOf(Arrays.asList(1, \"가\"), Integer.class));\n    }\n\n    @Test\n    public void 없으면_null() {\n        assertNull(Sol.firstOf(Arrays.asList(1, 2), String.class));\n    }\n}\n" },
      ex: "실행 시점에는 제네릭 타입이 지워져 있어서, 그냥 형 변환하면 컴파일은 지나가고 쓰는 자리에서 터집니다. Class 를 함께 받아 isInstance 로 물어보면 실행 중에도 확인할 수 있어요.",
    },
  ],
},
/* ── 중급 — record·sealed·패턴 매칭 ───────────────────────── */
{
  unit: "중급 — record·sealed·패턴 매칭",
  lesson: "직접 짜 보기 — 값을 담는 타입 만들기",
  th: {
    sum: "`record` 는 **값을 담기만 하는 타입**을 한 줄로 만든다. 생성자·equals·hashCode 가 딸려 온다.",
    body: [
      { h: "값 담는 클래스의 군더더기를 없앤다", t: "필드·생성자·게터·equals·hashCode·toString 을 손으로 쓰면 수십 줄이고, 필드를 하나 더할 때마다 다 고쳐야 한다. `record` 는 그 전부를 자동으로 만들어 준다 — 빠뜨릴 자리가 사라진다." },
      { h: "값이 같으면 같은 것", t: "`record` 는 모든 필드가 같으면 같다고 판단한다. 그래서 집합에 넣거나 맵의 키로 쓰기 좋다. 직접 만든 클래스에서 `equals` 를 빠뜨려 중복이 안 걸러지는 사고가 사라진다." },
      { h: "만들 때 검사할 수 있다", t: "짧은 형태의 생성자에 검사를 적으면, 어떤 경로로 만들어도 그 검사를 지난다. 잘못된 값을 담은 객체가 아예 존재할 수 없게 된다." },
      { h: "sealed 는 종류를 못 박는다", t: "`sealed` 로 어떤 자식이 있을 수 있는지 적어 두면, 나중에 모르는 종류가 끼어들지 않는다. 그래서 종류별 분기를 빠짐없이 썼는지 확인할 수 있다." },
    ],
    code: { c: "record Point(int x, int y) {\n    Point {\n        if (x < 0 || y < 0) throw new IllegalArgumentException();\n    }\n}", cap: "값만 담는 타입은 한 줄로" },
    key: ["값 담는 타입은 `record`", "값이 같으면 같은 것", "만들 때 검사할 수 있다"],
  },
  q: [
    {
      k: "Point · 값이 같으면 같은 것",
      cls: "Sol",
      q: "<code>x</code>, <code>y</code> 를 담는 <code>Point</code> 를 만드세요. <b>값이 같으면 같은 것</b>으로 다뤄져 집합에서 하나로 세어져야 합니다.",
      src: "import java.util.HashSet;\nimport java.util.Set;\n\npublic class Sol {\n    public static int distinct(Point[] ps) {\n        Set<Point> set = new HashSet<>();\n        for (Point p : ps) set.add(p);\n        return set.size();\n    }\n}\n\nclass Point {\n    final int x, y;\n\n    Point(int x, int y) { this.x = x; this.y = y; }\n\n    int x() { return x; }\n\n    int y() { return y; }\n}\n",
      sol: "import java.util.HashSet;\nimport java.util.Set;\n\npublic class Sol {\n    public static int distinct(Point[] ps) {\n        Set<Point> set = new HashSet<>();\n        for (Point p : ps) set.add(p);\n        return set.size();\n    }\n}\n\nrecord Point(int x, int y) { }\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 같은_값은_하나() {\n        assertEquals(1, Sol.distinct(new Point[]{new Point(1, 2), new Point(1, 2)}));\n    }\n\n    @Test\n    public void 다른_값은_둘() {\n        assertEquals(2, Sol.distinct(new Point[]{new Point(1, 2), new Point(3, 4)}));\n    }\n\n    @Test\n    public void 값을_읽을_수_있다() {\n        assertEquals(1, new Point(1, 2).x());\n        assertEquals(2, new Point(1, 2).y());\n    }\n}\n" },
      ex: "직접 만든 클래스는 equals 와 hashCode 를 안 쓰면 주소로 비교합니다. 값이 같아도 다른 것이 되어 집합에서 안 걸러져요. record 는 그 둘을 자동으로 만들어 줍니다.",
    },
    {
      k: "Range · 만들 때 검사하기",
      cls: "Sol",
      q: "<code>lo</code>가 <code>hi</code>보다 크면 <b>만들 수 없게</b> 하세요. <code>IllegalArgumentException</code> 을 던집니다.",
      src: "public class Sol {\n    public static int span(Range r) { return r.hi() - r.lo(); }\n}\n\nrecord Range(int lo, int hi) { }\n",
      sol: "public class Sol {\n    public static int span(Range r) { return r.hi() - r.lo(); }\n}\n\nrecord Range(int lo, int hi) {\n    Range {\n        if (lo > hi) throw new IllegalArgumentException(\"lo 가 hi 보다 크다\");\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 보통_범위() {\n        assertEquals(5, Sol.span(new Range(1, 6)));\n    }\n\n    @Test(expected = IllegalArgumentException.class)\n    public void 뒤집힌_범위는_만들_수_없다() {\n        new Range(6, 1);\n    }\n\n    @Test\n    public void 같아도_된다() {\n        assertEquals(0, Sol.span(new Range(3, 3)));\n    }\n}\n" },
      ex: "만들 때 안 막으면 뒤집힌 범위가 그대로 돌아다니다가, 한참 뒤 음수 길이로 나타납니다. 만드는 자리에서 막으면 그런 객체가 아예 존재할 수 없어요.",
    },
    {
      k: "describe · 종류별로 갈라 쓰기",
      cls: "Sol",
      q: "도형을 받아 설명을 돌려주세요. <code>Circle</code>은 <code>\"원\"</code>, <code>Rect</code>는 <code>\"사각형\"</code>, 그 밖에는 <code>\"모름\"</code> 입니다.",
      src: "public class Sol {\n    public static String describe(Shape s) {\n        if (s instanceof Circle) return \"원\";\n        return \"사각형\";\n    }\n}\n\nsealed interface Shape permits Circle, Rect, Tri { }\n\nrecord Circle(double r) implements Shape { }\n\nrecord Rect(double w, double h) implements Shape { }\n\nrecord Tri(double b, double h) implements Shape { }\n",
      sol: "public class Sol {\n    public static String describe(Shape s) {\n        if (s instanceof Circle) return \"원\";\n        if (s instanceof Rect) return \"사각형\";\n        return \"모름\";\n    }\n}\n\nsealed interface Shape permits Circle, Rect, Tri { }\n\nrecord Circle(double r) implements Shape { }\n\nrecord Rect(double w, double h) implements Shape { }\n\nrecord Tri(double b, double h) implements Shape { }\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 원() {\n        assertEquals(\"원\", Sol.describe(new Circle(1)));\n    }\n\n    @Test\n    public void 사각형() {\n        assertEquals(\"사각형\", Sol.describe(new Rect(1, 2)));\n    }\n\n    @Test\n    public void 모르는_종류() {\n        assertEquals(\"모름\", Sol.describe(new Tri(1, 2)));\n    }\n}\n" },
      ex: "'둘 중 하나' 로 짜면 세 번째 종류가 사각형이 됩니다. sealed 로 종류를 못 박아 두었으니 무엇이 있는지 다 알 수 있어요 — 모르는 것은 모른다고 말해야 그 자리에서 걸립니다.",
    },
  ],
},
/* ── 중급 — 날짜·시간 API와 타임존 함정 ───────────────────── */
{
  unit: "중급 — 날짜·시간 API와 타임존 함정",
  lesson: "직접 짜 보기 — 날짜는 계산으로 다룬다",
  th: {
    sum: "날짜는 글자로 계산하면 반드시 틀린다. **날짜 타입으로 바꿔** 더하고 뺀다.",
    body: [
      { h: "글자로 더하면 32일이 생긴다", t: "`\"2024-01-31\"` 의 뒤 두 자리에 1을 더하면 `\"2024-01-32\"` 다. 달이 며칠까지 있는지, 윤년인지를 글자는 모른다. `LocalDate` 로 바꿔 `plusDays` 하면 알아서 넘어간다." },
      { h: "날짜만 다룰 때는 시각을 섞지 않는다", t: "`LocalDate` 는 시각도 시간대도 없는 '달력 위의 날짜' 다. 생일이나 마감일처럼 시각이 필요 없는 값에 시각을 붙이면, 시간대에 따라 하루가 밀리는 사고가 생긴다." },
      { h: "순간을 다룰 때는 시간대를 명시한다", t: "'언제 일어났는가' 는 `Instant` 로 저장하고, 보여 줄 때만 지역 시간으로 바꾼다. 저장할 때 지역 시간으로 두면 서버를 옮기는 순간 값의 뜻이 달라진다." },
      { h: "기간과 시점을 헷갈리지 않는다", t: "`Period` 는 '3개월' 처럼 달력 기준 기간이고 `Duration` 은 '90일' 처럼 정확한 시간이다. 달마다 길이가 다르므로 둘은 같지 않다." },
    ],
    code: { c: "LocalDate.parse(\"2024-01-31\").plusDays(1)   // 2024-02-01\nChronoUnit.DAYS.between(a, b)                // 며칠 차이", cap: "날짜 타입으로 바꿔 계산한다" },
    key: ["글자로 날짜 계산 금지", "날짜만이면 `LocalDate`", "기간과 시점은 다르다"],
  },
  q: [
    {
      k: "addDays · 달을 넘겨서 더하기",
      cls: "Sol",
      q: "<code>\"YYYY-MM-DD\"</code> 에 <code>n</code>일을 더한 날짜를 같은 형식으로 돌려주세요. <b>달과 해가 넘어가도</b> 맞아야 합니다.",
      src: "public class Sol {\n    public static String addDays(String iso, int n) {\n        int day = Integer.parseInt(iso.substring(8)) + n;\n        return iso.substring(0, 8) + (day < 10 ? \"0\" + day : String.valueOf(day));\n    }\n}\n",
      sol: "import java.time.LocalDate;\n\npublic class Sol {\n    public static String addDays(String iso, int n) {\n        return LocalDate.parse(iso).plusDays(n).toString();\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 달을_넘긴다() {\n        assertEquals(\"2024-02-01\", Sol.addDays(\"2024-01-31\", 1));\n    }\n\n    @Test\n    public void 해를_넘긴다() {\n        assertEquals(\"2025-01-01\", Sol.addDays(\"2024-12-31\", 1));\n    }\n\n    @Test\n    public void 윤년() {\n        assertEquals(\"2024-02-29\", Sol.addDays(\"2024-02-28\", 1));\n    }\n}\n" },
      ex: "글자의 뒤 두 자리에 더하면 '2024-01-32' 같은 날짜가 만들어집니다. 그런 날은 달력에 없어요. LocalDate 로 바꾸면 달과 해가 알아서 넘어갑니다.",
    },
    {
      k: "daysBetween · 며칠 차이인가",
      cls: "Sol",
      q: "두 날짜가 <b>며칠 차이</b>인지 돌려주세요. 순서를 바꿔 넣어도 <b>같은 값</b>이어야 합니다.",
      src: "import java.time.LocalDate;\nimport java.time.temporal.ChronoUnit;\n\npublic class Sol {\n    public static long daysBetween(String a, String b) {\n        return ChronoUnit.DAYS.between(LocalDate.parse(a), LocalDate.parse(b));\n    }\n}\n",
      sol: "import java.time.LocalDate;\nimport java.time.temporal.ChronoUnit;\n\npublic class Sol {\n    public static long daysBetween(String a, String b) {\n        return Math.abs(ChronoUnit.DAYS.between(LocalDate.parse(a), LocalDate.parse(b)));\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 앞뒤_순서() {\n        assertEquals(4, Sol.daysBetween(\"2024-03-01\", \"2024-03-05\"));\n    }\n\n    @Test\n    public void 뒤앞_순서도_같다() {\n        assertEquals(4, Sol.daysBetween(\"2024-03-05\", \"2024-03-01\"));\n    }\n\n    @Test\n    public void 윤년을_넘어() {\n        assertEquals(2, Sol.daysBetween(\"2024-02-28\", \"2024-03-01\"));\n    }\n}\n" },
      ex: "between 은 순서에 따라 음수를 돌려줍니다. '며칠 차이' 는 방향이 없는 값이니 절댓값을 취해야 해요. 2024년은 윤년이라 2월이 29일까지 있는데, 날짜 타입은 그것을 알아서 셉니다.",
    },
    {
      k: "isWeekend · 주말인가",
      cls: "Sol",
      q: "날짜가 <b>토요일이나 일요일</b>인지 판단하세요.",
      src: "import java.time.LocalDate;\n\npublic class Sol {\n    public static boolean isWeekend(String iso) {\n        return LocalDate.parse(iso).getDayOfWeek().getValue() == 7;\n    }\n}\n",
      sol: "import java.time.DayOfWeek;\nimport java.time.LocalDate;\n\npublic class Sol {\n    public static boolean isWeekend(String iso) {\n        DayOfWeek d = LocalDate.parse(iso).getDayOfWeek();\n        return d == DayOfWeek.SATURDAY || d == DayOfWeek.SUNDAY;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 토요일() {\n        assertTrue(Sol.isWeekend(\"2024-03-02\"));\n    }\n\n    @Test\n    public void 일요일() {\n        assertTrue(Sol.isWeekend(\"2024-03-03\"));\n    }\n\n    @Test\n    public void 평일() {\n        assertFalse(Sol.isWeekend(\"2024-03-04\"));\n    }\n}\n" },
      ex: "요일 번호를 외워 쓰면 토요일을 빠뜨리기 쉽고, 다른 언어에서 익힌 번호와 섞이면 더 헷갈립니다. 이름 있는 상수로 견주면 코드만 읽어도 무슨 뜻인지 보여요.",
    },
  ],
},
/* ── 심화 — 문자열 처리 ───────────────────────────────────── */
{
  unit: "심화 — 문자열 처리: String pool·StringBuilder·텍스트 블록",
  lesson: "직접 짜 보기 — 문자열은 바뀌지 않는다",
  th: {
    sum: "자바의 문자열은 **한 번 만들면 바뀌지 않는다.** 고치는 것처럼 보이는 것은 전부 새로 만드는 것이다.",
    body: [
      { h: "이어 붙일수록 새로 만든다", t: "반복문에서 `s += x` 를 하면 매번 새 문자열이 만들어진다. 길이가 n 이면 전체 비용이 n 의 제곱에 가까워진다. `StringBuilder` 에 모았다가 마지막에 한 번 꺼내면 이 낭비가 없다." },
      { h: "같은 글자는 한 곳에 모아 둔다", t: "컴파일할 때 정해진 문자열은 한 곳에 모여 재사용된다(문자열 풀). 그래서 `==` 가 참이 되기도 한다. 하지만 계산으로 만들어진 문자열은 다른 물건이라 거짓이다 — 값 비교는 언제나 `.equals()` 다." },
      { h: "나누기는 빈 조각을 남긴다", t: "`\"a,,b\".split(\",\")` 는 가운데 빈 조각을 남긴다. 뒤쪽 빈 조각은 기본적으로 버려져서, 앞뒤가 다르게 동작하는 것처럼 보인다. 필요하면 빈 조각을 직접 걸러 낸다." },
      { h: "여러 줄은 텍스트 블록으로", t: "따옴표 세 개로 감싸면 줄바꿈과 따옴표를 그대로 쓸 수 있다. `\\n` 을 이어 붙이는 것보다 읽기 쉽고, 들여쓰기도 자동으로 정리된다." },
    ],
    code: { c: "StringBuilder sb = new StringBuilder();\nfor (String x : xs) sb.append(x);\nreturn sb.toString();", cap: "모았다가 한 번에 만든다" },
    key: ["문자열은 바뀌지 않는다", "이어 붙이기는 `StringBuilder`", "값 비교는 `.equals()`"],
  },
  q: [
    {
      k: "joinAll · 모았다가 한 번에",
      cls: "Sol",
      q: "글자 배열을 구분자로 이어 붙여 주세요. <b>반복문에서 문자열을 늘리지 말고</b> 모았다가 한 번에 만듭니다.",
      src: "public class Sol {\n    public static String joinAll(String[] xs, String sep) {\n        String out = \"\";\n        for (String x : xs) out += x + sep;\n        return out;\n    }\n}\n",
      sol: "public class Sol {\n    public static String joinAll(String[] xs, String sep) {\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < xs.length; i++) {\n            if (i > 0) sb.append(sep);\n            sb.append(xs[i]);\n        }\n        return sb.toString();\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 사이에만_넣는다() {\n        assertEquals(\"a,b\", Sol.joinAll(new String[]{\"a\", \"b\"}, \",\"));\n    }\n\n    @Test\n    public void 하나면_그대로() {\n        assertEquals(\"a\", Sol.joinAll(new String[]{\"a\"}, \",\"));\n    }\n\n    @Test\n    public void 빈_배열() {\n        assertEquals(\"\", Sol.joinAll(new String[]{}, \",\"));\n    }\n}\n" },
      ex: "매번 += 로 늘리면 문자열이 그때마다 새로 만들어져 길수록 급격히 느려집니다. 게다가 마지막에 구분자가 하나 더 붙어 결과도 틀려요 — 구분자는 사이에만 들어갑니다.",
    },
    {
      k: "sameText · 값으로 견주기",
      cls: "Sol",
      q: "두 글자가 <b>값으로</b> 같은지 판단하세요. 어느 쪽이 <code>null</code> 이어도 터지면 안 되고, 둘 다 null 이면 <code>true</code> 입니다.",
      src: "public class Sol {\n    public static boolean sameText(String a, String b) {\n        return a == b;\n    }\n}\n",
      sol: "import java.util.Objects;\n\npublic class Sol {\n    public static boolean sameText(String a, String b) {\n        return Objects.equals(a, b);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 계산으로_만든_글자도_같다() {\n        String a = \"kim\";\n        String b = new StringBuilder(\"k\").append(\"im\").toString();\n        assertTrue(Sol.sameText(a, b));\n    }\n\n    @Test\n    public void 다르면_거짓() {\n        assertFalse(Sol.sameText(\"kim\", \"lee\"));\n    }\n\n    @Test\n    public void null_처리() {\n        assertTrue(Sol.sameText(null, null));\n        assertFalse(Sol.sameText(null, \"kim\"));\n    }\n}\n" },
      ex: "== 는 같은 물건인지를 봅니다. 코드에 그대로 적은 글자는 한 곳에 모여 있어 우연히 참이 되지만, 계산으로 만든 글자는 다른 물건이라 거짓이에요 — 테스트에서는 맞고 실제로는 틀리는 전형입니다.",
    },
    {
      k: "splitClean · 빈 조각 걸러 내기",
      cls: "Sol",
      q: "쉼표로 나누되 <b>빈 조각과 앞뒤 공백</b>을 없앤 배열을 돌려주세요.",
      src: "public class Sol {\n    public static String[] splitClean(String s) {\n        return s.split(\",\");\n    }\n}\n",
      sol: "import java.util.ArrayList;\nimport java.util.List;\n\npublic class Sol {\n    public static String[] splitClean(String s) {\n        List<String> out = new ArrayList<>();\n        for (String p : s.split(\",\", -1)) {\n            String t = p.trim();\n            if (!t.isEmpty()) out.add(t);\n        }\n        return out.toArray(new String[0]);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 가운데_빈_조각() {\n        assertArrayEquals(new String[]{\"a\", \"b\"}, Sol.splitClean(\"a,,b\"));\n    }\n\n    @Test\n    public void 공백을_다듬는다() {\n        assertArrayEquals(new String[]{\"a\", \"b\"}, Sol.splitClean(\" a , b \"));\n    }\n\n    @Test\n    public void 전부_비면_빈_배열() {\n        assertEquals(0, Sol.splitClean(\",,\").length);\n    }\n}\n" },
      ex: "split 은 가운데 빈 조각을 그대로 남기고 공백도 안 다듬습니다. 사람이 친 목록에는 거의 항상 빈 칸과 여분의 쉼표가 있어요 — 나눈 뒤에 정리하는 단계가 필요합니다.",
    },
  ],
},
/* ── 심화 — 함수형 인터페이스와 람다 ──────────────────────── */
{
  unit: "심화 — 기본 메서드·함수형 인터페이스·람다 실무",
  lesson: "직접 짜 보기 — 동작을 값처럼 넘기기",
  th: {
    sum: "람다는 **동작을 값처럼 넘기는 것**이다. 무엇을 할지를 인자로 받으면 같은 뼈대를 여러 곳에 쓸 수 있다.",
    body: [
      { h: "달라지는 조각만 넘긴다", t: "'목록을 돌며 조건에 맞는 것만 모은다' 는 뼈대는 늘 같고 조건만 다르다. 조건을 인자로 받으면 뼈대를 한 번만 쓰면 된다 — 같은 코드를 복사할 일이 사라진다." },
      { h: "함수형 인터페이스가 그 자리다", t: "추상 메서드가 하나뿐인 인터페이스에는 람다를 그대로 넣을 수 있다. `Predicate`·`Function`·`Supplier` 처럼 이미 만들어진 것들이 있어 대개 새로 만들 필요가 없다." },
      { h: "기본 메서드로 이어 붙인다", t: "`and`·`or`·`negate` 처럼 인터페이스에 기본 구현을 두면, 조건을 조합해 새 조건을 만들 수 있다. 조건마다 클래스를 만들지 않아도 된다." },
      { h: "바깥 변수는 바뀌지 않아야 한다", t: "람다 안에서 쓰는 바깥 지역 변수는 사실상 고정된 값이어야 한다. 나중에 실행될 수 있어서, 그때 값이 바뀌어 있으면 무엇이 맞는지 알 수 없기 때문이다." },
    ],
    code: { c: "static <T> List<T> filter(List<T> xs, Predicate<T> p)\n\np.negate()      // 반대 조건\np.and(q)        // 둘 다", cap: "달라지는 조각만 넘긴다" },
    key: ["동작을 인자로 받는다", "추상 메서드 하나면 람다", "조건은 이어 붙일 수 있다"],
  },
  q: [
    {
      k: "filter · 조건을 넘겨받기",
      cls: "Sol",
      q: "목록에서 <b>조건에 맞는 것만</b> 모아 돌려주세요. 조건은 <code>Predicate</code> 로 받습니다.",
      src: "import java.util.ArrayList;\nimport java.util.List;\nimport java.util.function.Predicate;\n\npublic class Sol {\n    public static <T> List<T> filter(List<T> xs, Predicate<T> p) {\n        return new ArrayList<>(xs);\n    }\n}\n",
      sol: "import java.util.ArrayList;\nimport java.util.List;\nimport java.util.function.Predicate;\n\npublic class Sol {\n    public static <T> List<T> filter(List<T> xs, Predicate<T> p) {\n        List<T> out = new ArrayList<>();\n        for (T x : xs) {\n            if (p.test(x)) out.add(x);\n        }\n        return out;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Arrays;\n\npublic class SolTest {\n    @Test\n    public void 짝수만() {\n        assertEquals(Arrays.asList(2, 4), Sol.filter(Arrays.asList(1, 2, 3, 4), x -> x % 2 == 0));\n    }\n\n    @Test\n    public void 글자_길이로() {\n        assertEquals(Arrays.asList(\"aa\"), Sol.filter(Arrays.asList(\"a\", \"aa\"), s -> s.length() > 1));\n    }\n\n    @Test\n    public void 아무것도_안_맞으면_빈_목록() {\n        assertTrue(Sol.filter(Arrays.asList(1, 3), x -> x % 2 == 0).isEmpty());\n    }\n}\n" },
      ex: "조건을 안 쓰고 전부 돌려주면 어떤 조건을 넘겨도 결과가 같습니다. 넘겨받은 동작을 실제로 불러야 '달라지는 조각을 밖에서 정한다' 는 뜻이 살아나요.",
    },
    {
      k: "bothOf · 조건 이어 붙이기",
      cls: "Sol",
      q: "두 조건을 <b>모두 만족</b>할 때만 참인 조건을 만들어 돌려주세요.",
      src: "import java.util.function.Predicate;\n\npublic class Sol {\n    public static <T> Predicate<T> bothOf(Predicate<T> a, Predicate<T> b) {\n        return a;\n    }\n}\n",
      sol: "import java.util.function.Predicate;\n\npublic class Sol {\n    public static <T> Predicate<T> bothOf(Predicate<T> a, Predicate<T> b) {\n        return a.and(b);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.function.Predicate;\n\npublic class SolTest {\n    @Test\n    public void 둘_다_맞으면_참() {\n        Predicate<Integer> p = Sol.bothOf(x -> x > 0, x -> x % 2 == 0);\n        assertTrue(p.test(4));\n    }\n\n    @Test\n    public void 하나만_맞으면_거짓() {\n        Predicate<Integer> p = Sol.bothOf(x -> x > 0, x -> x % 2 == 0);\n        assertFalse(p.test(3));\n    }\n\n    @Test\n    public void 앞이_틀려도_거짓() {\n        Predicate<Integer> p = Sol.bothOf(x -> x > 0, x -> x % 2 == 0);\n        assertFalse(p.test(-2));\n    }\n}\n" },
      ex: "앞의 조건만 돌려주면 두 번째 조건이 통째로 무시됩니다. and 로 이어 붙이면 새 조건 클래스를 만들지 않고도 조합할 수 있어요 — 기본 메서드가 있어서 가능한 일입니다.",
    },
    {
      k: "orDefault · 없을 때만 만들기",
      cls: "Sol",
      q: "값이 <code>null</code> 일 때만 <code>Supplier</code> 를 불러 기본값을 만들어 주세요. 값이 있으면 <b>Supplier 를 부르면 안 됩니다</b>.",
      src: "import java.util.function.Supplier;\n\npublic class Sol {\n    public static <T> T orDefault(T v, Supplier<T> s) {\n        T made = s.get();\n        return v != null ? v : made;\n    }\n}\n",
      sol: "import java.util.function.Supplier;\n\npublic class Sol {\n    public static <T> T orDefault(T v, Supplier<T> s) {\n        return v != null ? v : s.get();\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.concurrent.atomic.AtomicInteger;\n\npublic class SolTest {\n    @Test\n    public void 값이_있으면_그대로() {\n        assertEquals(\"가\", Sol.orDefault(\"가\", () -> \"기본\"));\n    }\n\n    @Test\n    public void 값이_없으면_만든다() {\n        assertEquals(\"기본\", Sol.orDefault(null, () -> \"기본\"));\n    }\n\n    @Test\n    public void 값이_있으면_만들지_않는다() {\n        AtomicInteger n = new AtomicInteger();\n        Sol.orDefault(\"가\", () -> { n.incrementAndGet(); return \"기본\"; });\n        assertEquals(0, n.get());\n    }\n}\n" },
      ex: "먼저 만들어 두면 값이 있어도 기본값을 만드는 비용을 냅니다. 그 안에서 데이터베이스를 부르기라도 하면 매번 헛일을 해요 — 필요할 때만 부르는 것이 Supplier 를 받는 이유입니다.",
    },
  ],
},
/* ── 동시성 제어 (심화) ───────────────────────────────────── */
{
  unit: "동시성 제어 (심화)",
  lesson: "직접 짜 보기 — 함께 고칠 때 지키는 법",
  th: {
    sum: "여러 스레드가 **같은 값을 함께 고치면** 하나가 덮어써진다. 막거나, 원자적으로 바꾸거나, 안 나누거나.",
    body: [
      { h: "읽고 고치고 쓰는 사이가 위험하다", t: "`n = n + 1` 은 읽기·더하기·쓰기 세 단계다. 둘이 동시에 읽으면 둘 다 같은 값을 보고 각자 쓴다. 한 번의 증가가 통째로 사라지고, 오류도 안 난다." },
      { h: "한 번에 하나만 들어가게 막는다", t: "`synchronized` 나 `Lock` 으로 감싸면 그 구간에는 한 스레드만 들어간다. 확실하지만 기다리는 시간이 생기므로, 감싸는 범위는 되도록 좁게 잡는다." },
      { h: "원자적 연산을 쓰면 더 싸다", t: "`AtomicInteger` 의 `incrementAndGet` 은 읽기와 쓰기가 한 번에 일어난다. 자물쇠 없이도 안전하고 대개 더 빠르다 — 단순한 세기에는 이쪽이 맞다." },
      { h: "안 나누는 것이 가장 쉽다", t: "각자 자기 것만 세었다가 마지막에 합치면 함께 고칠 일이 없어진다. 막을 것도 없으니 가장 단순하고 가장 안 틀린다 — 나눌 수 있으면 나누지 않는 것이 먼저다." },
    ],
    code: { c: "AtomicInteger n = new AtomicInteger();\nn.incrementAndGet();        // 읽기와 쓰기가 한 번에\n\nsynchronized (lock) { ... } // 한 번에 하나만", cap: "막거나, 원자적으로, 안 나누거나" },
    key: ["읽고 쓰는 사이가 위험하다", "원자적 연산이 더 싸다", "안 나누는 것이 가장 쉽다"],
  },
  q: [
    {
      k: "Counter · 올린 뒤의 값을 돌려주기",
      cls: "Sol",
      q: "값을 <b>1 올리고 올린 뒤의 값</b>을 돌려주세요. 읽기와 쓰기가 <b>한 번에</b> 일어나야 합니다.",
      src: "import java.util.concurrent.atomic.AtomicInteger;\n\npublic class Sol {\n    private static final AtomicInteger N = new AtomicInteger();\n\n    public static int inc() {\n        return N.getAndIncrement();\n    }\n\n    public static int value() { return N.get(); }\n\n    public static void reset() { N.set(0); }\n}\n",
      sol: "import java.util.concurrent.atomic.AtomicInteger;\n\npublic class Sol {\n    private static final AtomicInteger N = new AtomicInteger();\n\n    public static int inc() {\n        return N.incrementAndGet();\n    }\n\n    public static int value() { return N.get(); }\n\n    public static void reset() { N.set(0); }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\n\npublic class SolTest {\n    @Test\n    public void 처음_올리면_1을_돌려준다() {\n        Sol.reset();\n        assertEquals(1, Sol.inc());\n    }\n\n    @Test\n    public void 두_번째는_2() {\n        Sol.reset();\n        Sol.inc();\n        assertEquals(2, Sol.inc());\n    }\n\n    @Test\n    public void 담긴_값도_맞는다() {\n        Sol.reset();\n        Sol.inc();\n        Sol.inc();\n        assertEquals(2, Sol.value());\n    }\n}\n" },
      ex: "getAndIncrement 는 올리기 전 값을, incrementAndGet 은 올린 뒤 값을 돌려줍니다. 이름 그대로인데 순서를 놓치면 언제나 1씩 작은 값이 나가요. 둘 다 읽기와 쓰기가 한 번에 일어나므로, get 으로 읽어 set 으로 쓰는 방식과 달리 증가가 사라지지 않습니다.",
    },
    {
      k: "sumParts · 나누지 않으면 막을 것도 없다",
      cls: "Sol",
      q: "각 일꾼이 센 값들을 받아 <b>합계</b>를 돌려주세요. 함께 고치는 값 없이, 각자 센 것을 마지막에 합칩니다.",
      src: "import java.util.List;\n\npublic class Sol {\n    public static long sumParts(List<Long> parts) {\n        return parts.isEmpty() ? 0 : parts.get(0);\n    }\n}\n",
      sol: "import java.util.List;\n\npublic class Sol {\n    public static long sumParts(List<Long> parts) {\n        long s = 0;\n        for (long p : parts) s += p;\n        return s;\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.Arrays;\nimport java.util.Collections;\n\npublic class SolTest {\n    @Test\n    public void 여럿을_합친다() {\n        assertEquals(60L, Sol.sumParts(Arrays.asList(10L, 20L, 30L)));\n    }\n\n    @Test\n    public void 하나면_그대로() {\n        assertEquals(5L, Sol.sumParts(Arrays.asList(5L)));\n    }\n\n    @Test\n    public void 비면_0() {\n        assertEquals(0L, Sol.sumParts(Collections.emptyList()));\n    }\n}\n" },
      ex: "각자 자기 것만 세면 함께 고치는 값이 없어 막을 것도 없습니다. 마지막에 합치는 것은 한 스레드가 하니 안전해요 — 나눌 수 있으면 나누지 않는 것이 가장 단순한 해결입니다.",
    },
    {
      k: "compute · 없을 때만 만들어 넣기",
      cls: "Sol",
      q: "맵에 값이 <b>없을 때만</b> 만들어 넣고 그 값을 돌려주세요. 있으면 <b>새로 만들지 않습니다</b>.",
      src: "import java.util.Map;\nimport java.util.function.Function;\n\npublic class Sol {\n    public static <K, V> V compute(Map<K, V> m, K k, Function<K, V> maker) {\n        V made = maker.apply(k);\n        m.put(k, made);\n        return made;\n    }\n}\n",
      sol: "import java.util.Map;\nimport java.util.function.Function;\n\npublic class Sol {\n    public static <K, V> V compute(Map<K, V> m, K k, Function<K, V> maker) {\n        return m.computeIfAbsent(k, maker);\n    }\n}\n",
      test: { "SolTest.java": "import static org.junit.Assert.*;\nimport org.junit.Test;\nimport java.util.HashMap;\nimport java.util.Map;\nimport java.util.concurrent.atomic.AtomicInteger;\n\npublic class SolTest {\n    @Test\n    public void 없으면_만든다() {\n        Map<String, String> m = new HashMap<>();\n        assertEquals(\"가\", Sol.compute(m, \"k\", key -> \"가\"));\n        assertEquals(\"가\", m.get(\"k\"));\n    }\n\n    @Test\n    public void 있으면_그대로() {\n        Map<String, String> m = new HashMap<>();\n        m.put(\"k\", \"이미\");\n        assertEquals(\"이미\", Sol.compute(m, \"k\", key -> \"새로\"));\n    }\n\n    @Test\n    public void 있으면_만들지_않는다() {\n        Map<String, String> m = new HashMap<>();\n        m.put(\"k\", \"이미\");\n        AtomicInteger n = new AtomicInteger();\n        Sol.compute(m, \"k\", key -> { n.incrementAndGet(); return \"새로\"; });\n        assertEquals(0, n.get());\n    }\n}\n" },
      ex: "먼저 만들어 넣으면 이미 있는 값을 덮어씁니다. 다른 스레드가 그 값을 쓰고 있었다면 그때부터 서로 다른 것을 보게 돼요. computeIfAbsent 는 확인과 넣기를 한 번에 합니다.",
    },
  ],
},
];
