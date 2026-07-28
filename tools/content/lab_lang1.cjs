/* 언어별 빌드 랩 1차 — Go · Java.
   러너가 파일 하나를 실제 컴파일러로 빌드하고 그 언어의 테스트 러너로 채점한다.
   각 Day 의 테스트는 앞선 Day 의 요구사항까지 다시 검사한다(회귀 안전).
   검증: tools/content/ver_langproj.cjs 가 시드 실패 · 해답 통과를 러너로 확인한다. */

const GO_SEED =
`package ex

// 접속 로그 한 줄은 "GET /path 120" 형식입니다 (메서드 경로 응답시간ms).
// 아래 세 함수를 Day 를 따라가며 채워 나갑니다.

func ParseLine(s string) (string, int, bool) {
	// TODO: Day 1
	return "", 0, false
}

type Stat struct {
	Path  string
	Count int
	Total int
}

func Aggregate(lines []string) []Stat {
	// TODO: Day 2
	return nil
}

func Report(lines []string, slowMs int) string {
	// TODO: Day 3
	return ""
}
`;

const GO_D1 =
`package ex

import "strconv"

func ParseLine(s string) (string, int, bool) {
	parts := splitFields(s)
	if len(parts) != 3 {
		return "", 0, false
	}
	ms, err := strconv.Atoi(parts[2])
	if err != nil || ms < 0 {
		return "", 0, false
	}
	return parts[1], ms, true
}

func splitFields(s string) []string {
	out := []string{}
	cur := ""
	for _, r := range s {
		if r == ' ' || r == '\\t' {
			if cur != "" {
				out = append(out, cur)
				cur = ""
			}
			continue
		}
		cur += string(r)
	}
	if cur != "" {
		out = append(out, cur)
	}
	return out
}

type Stat struct {
	Path  string
	Count int
	Total int
}

func Aggregate(lines []string) []Stat {
	return nil
}

func Report(lines []string, slowMs int) string {
	return ""
}
`;

const GO_D2 = GO_D1
  .replace(`func Aggregate(lines []string) []Stat {
	return nil
}`, `func Aggregate(lines []string) []Stat {
	idx := map[string]*Stat{}
	order := []string{}
	for _, l := range lines {
		p, ms, ok := ParseLine(l)
		if !ok {
			continue
		}
		if idx[p] == nil {
			idx[p] = &Stat{Path: p}
			order = append(order, p)
		}
		idx[p].Count++
		idx[p].Total += ms
	}
	out := make([]Stat, 0, len(order))
	for _, p := range order {
		out = append(out, *idx[p])
	}
	sortStats(out)
	return out
}

func sortStats(xs []Stat) {
	for i := 1; i < len(xs); i++ {
		for j := i; j > 0 && less(xs[j], xs[j-1]); j-- {
			xs[j], xs[j-1] = xs[j-1], xs[j]
		}
	}
}

func less(a, b Stat) bool {
	if a.Count != b.Count {
		return a.Count > b.Count
	}
	return a.Path < b.Path
}`);

const GO_D3 = GO_D2
  .replace(`func Report(lines []string, slowMs int) string {
	return ""
}`, `func Report(lines []string, slowMs int) string {
	stats := Aggregate(lines)
	slow := []Stat{}
	for _, s := range stats {
		if s.Total/s.Count >= slowMs {
			slow = append(slow, s)
		}
	}
	for i := 1; i < len(slow); i++ {
		for j := i; j > 0 && avgLess(slow[j], slow[j-1]); j-- {
			slow[j], slow[j-1] = slow[j-1], slow[j]
		}
	}
	out := ""
	for i, s := range slow {
		if i > 0 {
			out += "\\n"
		}
		out += s.Path + " " + itoa(s.Count) + " " + itoa(s.Total/s.Count)
	}
	return out
}

func avgLess(a, b Stat) bool {
	aa, bb := a.Total/a.Count, b.Total/b.Count
	if aa != bb {
		return aa > bb
	}
	return a.Path < b.Path
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}`);

const GO_T1 = `package ex

import "testing"

func TestParseOK(t *testing.T) {
	p, ms, ok := ParseLine("GET /a 120")
	if !ok || p != "/a" || ms != 120 {
		t.Fatalf("got %q %d %v", p, ms, ok)
	}
}

func TestParseFieldCount(t *testing.T) {
	if _, _, ok := ParseLine("GET /a"); ok {
		t.Fatal("필드가 모자란 줄을 통과시켰다")
	}
	if _, _, ok := ParseLine("GET /a 1 extra"); ok {
		t.Fatal("필드가 많은 줄을 통과시켰다")
	}
}

func TestParseNotNumber(t *testing.T) {
	if _, _, ok := ParseLine("GET /a abc"); ok {
		t.Fatal("숫자가 아닌 응답시간을 통과시켰다")
	}
	if _, _, ok := ParseLine(""); ok {
		t.Fatal("빈 줄을 통과시켰다")
	}
}

func TestParseSpaces(t *testing.T) {
	p, ms, ok := ParseLine("  POST   /users   45  ")
	if !ok || p != "/users" || ms != 45 {
		t.Fatalf("공백이 여러 개인 줄: %q %d %v", p, ms, ok)
	}
}
`;

const GO_T2 = GO_T1 + `
func TestAggregateCounts(t *testing.T) {
	xs := Aggregate([]string{"GET /a 100", "GET /a 200", "GET /b 50"})
	if len(xs) != 2 {
		t.Fatalf("경로 2개여야 한다: %v", xs)
	}
	if xs[0].Path != "/a" || xs[0].Count != 2 || xs[0].Total != 300 {
		t.Fatalf("집계가 틀렸다: %v", xs[0])
	}
}

func TestAggregateSkipsBadLines(t *testing.T) {
	xs := Aggregate([]string{"GET /a 100", "쓰레기", "GET /a x"})
	if len(xs) != 1 || xs[0].Count != 1 {
		t.Fatalf("파싱 실패 줄을 세었다: %v", xs)
	}
}

func TestAggregateOrder(t *testing.T) {
	xs := Aggregate([]string{"GET /b 1", "GET /a 1"})
	if xs[0].Path != "/a" || xs[1].Path != "/b" {
		t.Fatalf("동점은 경로 사전순이어야 한다: %v", xs)
	}
	ys := Aggregate([]string{"GET /z 1", "GET /y 1", "GET /y 1"})
	if ys[0].Path != "/y" {
		t.Fatalf("건수 많은 쪽이 먼저여야 한다: %v", ys)
	}
}

func TestAggregateEmpty(t *testing.T) {
	if xs := Aggregate(nil); len(xs) != 0 {
		t.Fatalf("빈 입력: %v", xs)
	}
}
`;

const GO_T3 = GO_T2 + `
func TestReportFiltersFast(t *testing.T) {
	got := Report([]string{"GET /fast 10", "GET /slow 500"}, 100)
	if got != "/slow 1 500" {
		t.Fatalf("got %q", got)
	}
}

func TestReportUsesAverage(t *testing.T) {
	got := Report([]string{"GET /a 100", "GET /a 300"}, 200)
	if got != "/a 2 200" {
		t.Fatalf("평균으로 판정해야 한다: %q", got)
	}
}

func TestReportSortedByAvg(t *testing.T) {
	got := Report([]string{"GET /a 300", "GET /b 900"}, 100)
	if got != "/b 1 900\\n/a 1 300" {
		t.Fatalf("평균 내림차순이어야 한다: %q", got)
	}
}

func TestReportEmptyWhenNoneSlow(t *testing.T) {
	if got := Report([]string{"GET /a 10"}, 100); got != "" {
		t.Fatalf("느린 경로가 없으면 빈 문자열: %q", got)
	}
}
`;

const JAVA_SEED =
`import java.util.*;

/** 주문 코어 — Day 를 따라가며 채워 나갑니다. */
public class Sol {
    /** 장바구니에 담는다. price 는 0 이상, qty 는 1 이상이어야 한다. */
    public void add(String name, int price, int qty) {
        // TODO: Day 1
    }

    /** 쿠폰 할인 합계(원 단위 내림). */
    public int total() {
        // TODO: Day 1
        return 0;
    }

    /** 할인율(%)을 적용한다. 0~50 만 허용. */
    public void applyCoupon(int percent) {
        // TODO: Day 2
    }

    /** 영수증 문자열. */
    public String receipt() {
        // TODO: Day 3
        return "";
    }
}
`;

const JAVA_D1 =
`import java.util.*;

public class Sol {
    private final List<String> names = new ArrayList<>();
    private final List<Integer> prices = new ArrayList<>();
    private final List<Integer> qtys = new ArrayList<>();

    public void add(String name, int price, int qty) {
        if (name == null || name.isEmpty()) throw new IllegalArgumentException("name");
        if (price < 0) throw new IllegalArgumentException("price");
        if (qty < 1) throw new IllegalArgumentException("qty");
        names.add(name); prices.add(price); qtys.add(qty);
    }

    public int total() {
        int sum = 0;
        for (int i = 0; i < names.size(); i++) sum += prices.get(i) * qtys.get(i);
        return sum;
    }

    public void applyCoupon(int percent) {
    }

    public String receipt() {
        return "";
    }
}
`;

const JAVA_D2 = JAVA_D1
  .replace(`    public int total() {
        int sum = 0;
        for (int i = 0; i < names.size(); i++) sum += prices.get(i) * qtys.get(i);
        return sum;
    }

    public void applyCoupon(int percent) {
    }`, `    public int total() {
        int sum = 0;
        for (int i = 0; i < names.size(); i++) sum += prices.get(i) * qtys.get(i);
        return sum - sum * coupon / 100;
    }

    public void applyCoupon(int percent) {
        if (percent < 0 || percent > 50) throw new IllegalArgumentException("percent");
        coupon = percent;
    }`)
  .replace(`    private final List<Integer> qtys = new ArrayList<>();`,
           `    private final List<Integer> qtys = new ArrayList<>();
    private int coupon = 0;`);

const JAVA_D3 = JAVA_D2
  .replace(`    public String receipt() {
        return "";
    }`, `    public String receipt() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < names.size(); i++) {
            sb.append(names.get(i)).append(" x").append(qtys.get(i))
              .append(" = ").append(prices.get(i) * qtys.get(i)).append("\\n");
        }
        sb.append("TOTAL = ").append(total());
        return sb.toString();
    }`);

const JAVA_T1 = `import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SolTest {
    @Test void sumsItems() {
        Sol s = new Sol();
        s.add("book", 1000, 2);
        s.add("pen", 500, 1);
        assertEquals(2500, s.total());
    }
    @Test void emptyCartIsZero() {
        assertEquals(0, new Sol().total());
    }
    @Test void rejectsBadQty() {
        Sol s = new Sol();
        assertThrows(IllegalArgumentException.class, () -> s.add("x", 100, 0));
        assertThrows(IllegalArgumentException.class, () -> s.add("x", 100, -1));
    }
    @Test void rejectsBadPriceAndName() {
        Sol s = new Sol();
        assertThrows(IllegalArgumentException.class, () -> s.add("x", -1, 1));
        assertThrows(IllegalArgumentException.class, () -> s.add("", 100, 1));
    }
    @Test void freeItemIsAllowed() {
        Sol s = new Sol();
        s.add("gift", 0, 3);
        assertEquals(0, s.total());
    }
}
`;

/* 마지막 클래스 닫는 괄호만 떼고 이어 붙인다 — 문자열 replace 는 첫 일치를 지우므로 반드시 앵커를 건다 */
const JAVA_T2 = JAVA_T1.replace(/\}\n$/, "") + `
    @Test void couponReducesTotal() {
        Sol s = new Sol();
        s.add("book", 1000, 2);
        s.applyCoupon(10);
        assertEquals(1800, s.total());
    }
    @Test void couponRoundsDown() {
        Sol s = new Sol();
        s.add("x", 1005, 1);
        s.applyCoupon(10);
        assertEquals(905, s.total());
    }
    @Test void lastCouponWins() {
        Sol s = new Sol();
        s.add("x", 1000, 1);
        s.applyCoupon(50);
        s.applyCoupon(10);
        assertEquals(900, s.total());
    }
    @Test void rejectsBadCoupon() {
        Sol s = new Sol();
        assertThrows(IllegalArgumentException.class, () -> s.applyCoupon(51));
        assertThrows(IllegalArgumentException.class, () -> s.applyCoupon(-1));
    }
}
`;

const JAVA_T3 = JAVA_T2.replace(/}\n$/, "") + `
    @Test void receiptLists() {
        Sol s = new Sol();
        s.add("book", 1000, 2);
        s.add("pen", 500, 1);
        assertEquals("book x2 = 2000\\npen x1 = 500\\nTOTAL = 2500", s.receipt());
    }
    @Test void receiptUsesDiscountedTotal() {
        Sol s = new Sol();
        s.add("x", 1000, 1);
        s.applyCoupon(20);
        assertTrue(s.receipt().endsWith("TOTAL = 800"), s.receipt());
    }
    @Test void receiptOfEmptyCart() {
        assertEquals("TOTAL = 0", new Sol().receipt());
    }
    @Test void receiptKeepsInsertionOrder() {
        Sol s = new Sol();
        s.add("b", 1, 1);
        s.add("a", 1, 1);
        assertTrue(s.receipt().startsWith("b x1 = 1\\na x1 = 1"), s.receipt());
    }
}
`;

module.exports = {
  projects: [
    { id:"logcli", lang:"go", mainFile:"sol.go", srcName:"sol.go",
      em:"🐹", title:"Go — 접속 로그 집계 CLI",
      sub:"파싱 → 집계 → 리포트. 실제 go test 가 채점합니다",
      brief:"파일 하나(sol.go)를 3일에 걸쳐 키웁니다. 채점은 브라우저가 아니라 로컬 러너의 진짜 Go 컴파일러와 go test 가 합니다 — 실패하면 go test 의 출력을 그대로 보여 주므로, 어느 테스트가 왜 깨졌는지는 그 출력을 읽으면 됩니다.",
      contract:"sol.go 는 package ex 이며 ParseLine·Aggregate·Report 세 함수를 내보내야 합니다. 표준 라이브러리만 쓸 수 있고 외부 모듈은 받지 않습니다.",
      seed:{ "sol.go": GO_SEED },
      days:[
        { n:1, title:"한 줄 파싱",
          req:["ParseLine(\"GET /a 120\") 은 (\"/a\", 120, true) 를 돌려준다.",
               "필드가 3개가 아니면 ok 는 false 다.",
               "응답시간이 숫자가 아니거나 음수면 ok 는 false 다.",
               "공백이 여러 개여도 올바르게 자른다."],
          hint:"strings.Fields 처럼 '연속 공백을 하나로 보고 자르는' 동작이 필요합니다. 직접 만들어도 되고 strings 를 임포트해도 됩니다. 숫자 변환 실패는 반드시 ok=false 로 돌려주세요 — 여기서 패닉이 나면 로그 한 줄이 프로그램을 죽입니다.",
          tests:[{n:"정상 줄을 파싱한다"},{n:"필드 수가 맞지 않으면 실패"},{n:"숫자가 아니면 실패"},{n:"공백이 여러 개여도 자른다"}],
          rt:{ label:"go test ./...", test:{ "go.mod":"module ex\n\ngo 1.21\n", "sol_test.go": GO_T1 } } },
        { n:2, title:"경로별 집계",
          req:["Aggregate 는 경로별 {Path, Count, Total} 을 돌려준다.",
               "파싱에 실패한 줄은 세지 않는다.",
               "정렬은 Count 내림차순, 같으면 Path 사전순이다.",
               "빈 입력에는 길이 0 을 돌려준다.",
               "Day 1 의 요구사항도 계속 만족해야 한다."],
          hint:"맵으로 모으면 순회 순서가 무작위라 결과가 호출마다 달라집니다 — 반드시 슬라이스로 꺼내 명시적으로 정렬하세요. 동점 기준(Path 사전순)까지 정해야 출력이 결정적입니다.",
          tests:[{n:"경로별로 묶어 합산한다"},{n:"파싱 실패 줄은 세지 않는다"},{n:"건수 ↓ · 경로 ↑ 로 정렬"},{n:"빈 입력을 다룬다"}],
          rt:{ label:"go test ./...", test:{ "go.mod":"module ex\n\ngo 1.21\n", "sol_test.go": GO_T2 } } },
        { n:3, title:"느린 경로 리포트",
          req:["Report(lines, slowMs) 는 평균 응답시간이 slowMs 이상인 경로만 추린다.",
               "각 줄은 \"경로 건수 평균\" 이고 줄바꿈으로 잇는다.",
               "평균 내림차순, 같으면 경로 사전순이다.",
               "해당 경로가 없으면 빈 문자열이다.",
               "Day 1·2 의 요구사항도 계속 만족해야 한다."],
          hint:"평균은 정수 나눗셈(Total/Count)입니다. Aggregate 를 다시 구현하지 말고 그대로 부르세요 — 이미 검증된 코드를 재사용하는 것이 회귀를 막는 가장 싼 방법입니다.",
          tests:[{n:"빠른 경로는 제외한다"},{n:"평균으로 판정한다"},{n:"평균 내림차순 정렬"},{n:"없으면 빈 문자열"}],
          rt:{ label:"go test ./...", test:{ "go.mod":"module ex\n\ngo 1.21\n", "sol_test.go": GO_T3 } } },
      ] },

    { id:"ordercore", lang:"java", mainFile:"Sol.java", srcName:"Sol.java",
      em:"☕", title:"Java — 주문 코어",
      sub:"장바구니 → 쿠폰 → 영수증. 실제 JUnit 이 채점합니다",
      brief:"파일 하나(Sol.java)를 3일에 걸쳐 키웁니다. 채점은 로컬 러너의 진짜 javac 와 JUnit 5 가 합니다. 검증 실패를 예외로 던지는 것, 정수 나눗셈의 내림, 상태를 어디에 둘지 — 세 가지가 이 프로젝트의 진짜 주제입니다.",
      contract:"public class Sol 이 add(String,int,int) · total() · applyCoupon(int) · receipt() 를 공개 메서드로 가져야 합니다. 잘못된 입력은 IllegalArgumentException 을 던집니다.",
      seed:{ "Sol.java": JAVA_SEED },
      days:[
        { n:1, title:"장바구니와 합계",
          req:["add(name, price, qty) 로 담고 total() 로 합계를 구한다.",
               "빈 장바구니의 합계는 0 이다.",
               "qty 가 1 미만이면 IllegalArgumentException 을 던진다.",
               "price 가 음수이거나 name 이 비면 IllegalArgumentException 을 던진다.",
               "price 가 0 인 상품(사은품)은 허용한다."],
          hint:"'0원은 허용, 음수는 거부' 처럼 경계가 갈리는 조건은 테스트가 정확히 그 지점을 찌릅니다. 상태를 어떤 자료구조에 담을지는 자유입니다 — 리스트 세 개든 내부 클래스든 상관없습니다.",
          tests:[{n:"여러 상품의 합계"},{n:"빈 장바구니는 0"},{n:"잘못된 수량 거부"},{n:"잘못된 가격·이름 거부"},{n:"0원 상품 허용"}],
          rt:{ label:"JUnit 5", test:{ "SolTest.java": JAVA_T1 } } },
        { n:2, title:"쿠폰 할인",
          req:["applyCoupon(percent) 는 total() 에 할인을 반영한다.",
               "할인 금액은 원 단위로 내림한다.",
               "쿠폰을 여러 번 적용하면 마지막 것만 유효하다(누적되지 않는다).",
               "0~50 밖의 값은 IllegalArgumentException 이다.",
               "Day 1 의 요구사항도 계속 만족해야 한다."],
          hint:"할인율을 곱한 뒤 나누면 내림이 자연히 됩니다 — 다만 순서가 중요합니다. sum * percent / 100 과 sum * (percent/100) 은 정수 연산에서 전혀 다른 값입니다.",
          tests:[{n:"할인이 반영된다"},{n:"원 단위 내림"},{n:"마지막 쿠폰만 유효"},{n:"범위 밖 쿠폰 거부"}],
          rt:{ label:"JUnit 5", test:{ "SolTest.java": JAVA_T2 } } },
        { n:3, title:"영수증",
          req:["receipt() 는 각 상품을 \"이름 x수량 = 금액\" 으로 한 줄씩 낸다.",
               "마지막 줄은 \"TOTAL = 합계\" 이며 쿠폰이 반영된 금액이다.",
               "빈 장바구니의 영수증은 \"TOTAL = 0\" 한 줄이다.",
               "상품은 담은 순서대로 나온다.",
               "Day 1·2 의 요구사항도 계속 만족해야 한다."],
          hint:"문자열을 + 로 이어 붙이면 항목이 많을 때 느립니다 — StringBuilder 를 쓰세요. 합계는 다시 계산하지 말고 total() 을 부르면 쿠폰 반영이 공짜로 따라옵니다.",
          tests:[{n:"항목이 줄마다 나온다"},{n:"합계에 쿠폰이 반영된다"},{n:"빈 장바구니 영수증"},{n:"담은 순서를 유지한다"}],
          rt:{ label:"JUnit 5", test:{ "SolTest.java": JAVA_T3 } } },
      ] },
  ],
  sol: {
    logcli: [ {"sol.go": GO_D1}, {"sol.go": GO_D2}, {"sol.go": GO_D3} ],
    ordercore: [ {"Sol.java": JAVA_D1}, {"Sol.java": JAVA_D2}, {"Sol.java": JAVA_D3} ],
  },
};
