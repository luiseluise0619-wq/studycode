/* 컴파일 언어 실행형 디버깅 문항 — 로컬 러너의 실제 컴파일러·테스트 러너가 판정한다.
   가짜 인터프리터로 의미를 흉내내지 않는다.
     go   : go test (표준 testing)
     rust : cargo test (#[test])
     c    : gcc 로 sol.c + test.c 를 함께 빌드, main 이 0 을 반환하면 통과
     cpp  : catch2 (러너가 헤더와 main 을 제공)
     java : JUnit 5 콘솔 런처, 테스트 클래스 이름은 ...Test
   검증: sol 은 테스트를 통과하고, src 는 반드시 실패해야 한다. */
module.exports = [
/* ───────────────── Go ───────────────── */
{ lang:"go", k:"append 가 뒤쪽 배열을 공유한다",
  q:"슬라이스에서 앞 절반과 뒤 절반을 각각 복사해 돌려주는 함수입니다. 앞 절반에 값을 덧붙이면 뒤 절반의 첫 값이 덮어써집니다. 두 결과가 서로 독립이 되도록 고치세요.",
  src:"package ex\n\nfunc Halves(xs []int) ([]int, []int) {\n\tm := len(xs) / 2\n\treturn xs[:m], xs[m:]\n}",
  sol:"package ex\n\nfunc Halves(xs []int) ([]int, []int) {\n\tm := len(xs) / 2\n\ta := append([]int(nil), xs[:m]...)\n\tb := append([]int(nil), xs[m:]...)\n\treturn a, b\n}",
  test:{"sol_test.go":"package ex\n\nimport \"testing\"\n\nfunc TestIndependent(t *testing.T) {\n\txs := []int{1, 2, 3, 4}\n\ta, b := Halves(xs)\n\ta = append(a, 99)\n\tif b[0] != 3 {\n\t\tt.Fatalf(\"뒤 절반이 덮어써졌다: b[0]=%d, 기대 3\", b[0])\n\t}\n}\n\nfunc TestSplit(t *testing.T) {\n\ta, b := Halves([]int{1, 2, 3, 4})\n\tif len(a) != 2 || len(b) != 2 || a[0] != 1 || b[0] != 3 {\n\t\tt.Fatalf(\"분할이 틀렸다: %v %v\", a, b)\n\t}\n}\n\nfunc TestOdd(t *testing.T) {\n\ta, b := Halves([]int{1, 2, 3})\n\tif len(a) != 1 || len(b) != 2 {\n\t\tt.Fatalf(\"홀수 길이 분할이 틀렸다: %v %v\", a, b)\n\t}\n}\n\nfunc TestEmpty(t *testing.T) {\n\ta, b := Halves([]int{})\n\tif len(a) != 0 || len(b) != 0 {\n\t\tt.Fatalf(\"빈 입력: %v %v\", a, b)\n\t}\n}\n"},
  ex:"🐛 원인: xs[:m] 과 xs[m:] 는 새 배열이 아니라 같은 배열을 가리키는 뷰입니다. 앞 슬라이스는 len 이 m 이지만 cap 은 원본 끝까지라, append 하면 남은 자리에 그대로 써 넣어 뒤 슬라이스의 첫 원소를 덮어씁니다.\n🔧 해결: append([]int(nil), s...) 로 새 배열에 복사합니다. copy 로 미리 만든 슬라이스에 옮겨도 됩니다.\n🛡 재발 방지: 슬라이싱은 복사가 아닙니다. 결과를 호출자에게 돌려주면서 나중에 append 할 가능성이 있으면 반드시 복사하거나, xs[:m:m] 처럼 세 번째 인덱스로 cap 을 잘라 두세요." },

{ lang:"go", k:"nil 맵에는 쓸 수 없다",
  q:"문자열 목록의 빈도를 세는 함수인데 호출하면 패닉이 납니다.",
  src:"package ex\n\nfunc Count(words []string) map[string]int {\n\tvar m map[string]int\n\tfor _, w := range words {\n\t\tm[w]++\n\t}\n\treturn m\n}",
  sol:"package ex\n\nfunc Count(words []string) map[string]int {\n\tm := make(map[string]int)\n\tfor _, w := range words {\n\t\tm[w]++\n\t}\n\treturn m\n}",
  test:{"sol_test.go":"package ex\n\nimport \"testing\"\n\nfunc TestCount(t *testing.T) {\n\tm := Count([]string{\"a\", \"b\", \"a\"})\n\tif m[\"a\"] != 2 || m[\"b\"] != 1 {\n\t\tt.Fatalf(\"빈도가 틀렸다: %v\", m)\n\t}\n}\n\nfunc TestEmpty(t *testing.T) {\n\tm := Count(nil)\n\tif m == nil {\n\t\tt.Fatal(\"빈 입력에도 사용 가능한 맵을 반환해야 한다\")\n\t}\n\tif len(m) != 0 {\n\t\tt.Fatalf(\"빈 맵이어야 한다: %v\", m)\n\t}\n}\n\nfunc TestSingle(t *testing.T) {\n\tm := Count([]string{\"x\"})\n\tif m[\"x\"] != 1 {\n\t\tt.Fatalf(\"%v\", m)\n\t}\n}\n"},
  ex:"🐛 원인: var m map[string]int 은 nil 맵을 만듭니다. 읽기는 제로값을 돌려주지만 쓰기는 런타임 패닉입니다 — 선언만으로는 저장 공간이 생기지 않습니다.\n🔧 해결: make 로 실제 맵을 만듭니다.\n🛡 재발 방지: 슬라이스는 nil 상태에서도 append 가 되지만 맵은 안 됩니다. 이 비대칭이 함정입니다. 맵은 항상 make 나 리터럴로 초기화하세요." },

{ lang:"go", k:"len 은 바이트 수다",
  q:"문자열의 글자 수를 세는 함수입니다. 한글이나 이모지가 들어가면 실제보다 훨씬 큰 수가 나옵니다.",
  src:"package ex\n\nfunc Chars(s string) int {\n\treturn len(s)\n}",
  sol:"package ex\n\nimport \"unicode/utf8\"\n\nfunc Chars(s string) int {\n\treturn utf8.RuneCountInString(s)\n}",
  test:{"sol_test.go":"package ex\n\nimport \"testing\"\n\nfunc TestASCII(t *testing.T) {\n\tif got := Chars(\"abc\"); got != 3 {\n\t\tt.Fatalf(\"got %d, want 3\", got)\n\t}\n}\n\nfunc TestHangul(t *testing.T) {\n\tif got := Chars(\"한글\"); got != 2 {\n\t\tt.Fatalf(\"got %d, want 2\", got)\n\t}\n}\n\nfunc TestMixed(t *testing.T) {\n\tif got := Chars(\"a한b\"); got != 3 {\n\t\tt.Fatalf(\"got %d, want 3\", got)\n\t}\n}\n\nfunc TestEmpty(t *testing.T) {\n\tif got := Chars(\"\"); got != 0 {\n\t\tt.Fatalf(\"got %d, want 0\", got)\n\t}\n}\n"},
  ex:"🐛 원인: Go 의 문자열은 UTF-8 바이트열이고 len 은 바이트 수를 셉니다. 한글 한 글자는 3바이트라 '한글' 의 len 은 6 입니다.\n🔧 해결: utf8.RuneCountInString 으로 코드포인트 수를 셉니다. for range 로 돌아도 룬 단위로 순회합니다.\n🛡 재발 방지: 인덱싱 s[i] 도 바이트를 돌려줍니다. 글자 단위 작업은 []rune 로 변환하거나 range 를 쓰세요. 다만 결합 문자·이모지 변형은 룬 개수와 사람이 세는 글자 수가 또 다를 수 있습니다." },

{ lang:"go", k:"range 는 값을 복사한다",
  q:"모든 항목의 재고를 0 으로 만드는 함수인데 아무것도 바뀌지 않습니다.",
  src:"package ex\n\ntype Item struct {\n\tName string\n\tQty  int\n}\n\nfunc ZeroAll(items []Item) {\n\tfor _, it := range items {\n\t\tit.Qty = 0\n\t}\n}",
  sol:"package ex\n\ntype Item struct {\n\tName string\n\tQty  int\n}\n\nfunc ZeroAll(items []Item) {\n\tfor i := range items {\n\t\titems[i].Qty = 0\n\t}\n}",
  test:{"sol_test.go":"package ex\n\nimport \"testing\"\n\nfunc TestZero(t *testing.T) {\n\txs := []Item{{\"a\", 3}, {\"b\", 5}}\n\tZeroAll(xs)\n\tif xs[0].Qty != 0 || xs[1].Qty != 0 {\n\t\tt.Fatalf(\"재고가 남아 있다: %v\", xs)\n\t}\n}\n\nfunc TestNamesKept(t *testing.T) {\n\txs := []Item{{\"a\", 3}}\n\tZeroAll(xs)\n\tif xs[0].Name != \"a\" {\n\t\tt.Fatalf(\"이름이 바뀌었다: %v\", xs)\n\t}\n}\n\nfunc TestEmpty(t *testing.T) {\n\tZeroAll(nil)\n}\n"},
  ex:"🐛 원인: for _, it := range items 의 it 은 원소의 복사본입니다. 복사본을 고쳐도 슬라이스 안의 값은 그대로입니다.\n🔧 해결: 인덱스로 순회해 items[i] 를 직접 고칩니다. 원소가 포인터(*Item)라면 값 복사본이라도 같은 대상을 가리키므로 동작합니다.\n🛡 재발 방지: Go 의 range 는 언제나 복사입니다. 원소가 큰 구조체면 성능에도 영향을 주므로, 수정하거나 크기가 크면 인덱스 순회를 쓰세요." },

{ lang:"go", k:"Trim 은 문자 집합을 깎는다",
  q:"파일 이름에서 '.log' 접미사를 떼는 함수인데, 'catalog.log' 를 넣으면 'cata' 가 나옵니다.",
  src:"package ex\n\nimport \"strings\"\n\nfunc DropExt(name string) string {\n\treturn strings.Trim(name, \".log\")\n}",
  sol:"package ex\n\nimport \"strings\"\n\nfunc DropExt(name string) string {\n\treturn strings.TrimSuffix(name, \".log\")\n}",
  test:{"sol_test.go":"package ex\n\nimport \"testing\"\n\nfunc TestCatalog(t *testing.T) {\n\tif got := DropExt(\"catalog.log\"); got != \"catalog\" {\n\t\tt.Fatalf(\"got %q, want %q\", got, \"catalog\")\n\t}\n}\n\nfunc TestPlain(t *testing.T) {\n\tif got := DropExt(\"app.log\"); got != \"app\" {\n\t\tt.Fatalf(\"got %q\", got)\n\t}\n}\n\nfunc TestOther(t *testing.T) {\n\tif got := DropExt(\"data.txt\"); got != \"data.txt\" {\n\t\tt.Fatalf(\"got %q\", got)\n\t}\n}\n\nfunc TestNoExt(t *testing.T) {\n\tif got := DropExt(\"log\"); got != \"log\" {\n\t\tt.Fatalf(\"got %q\", got)\n\t}\n}\n"},
  ex:"🐛 원인: strings.Trim 의 두 번째 인자는 떼어낼 문자열이 아니라 '깎아낼 문자들의 집합' 입니다. '.log' 는 {'.', 'l', 'o', 'g'} 를 뜻해 'catalog.log' 의 뒤에서 계속 깎아 'cata' 까지 갑니다.\n🔧 해결: 접미사를 떼려면 strings.TrimSuffix 를 씁니다.\n🛡 재발 방지: Trim/TrimLeft/TrimRight 는 문자 집합, TrimPrefix/TrimSuffix 는 문자열입니다. 이름이 비슷해 헷갈리므로 '집합인가 문자열인가' 를 먼저 떠올리세요." },

/* ───────────────── Rust ───────────────── */
{ lang:"rust", name:"dbg1", k:"범위 연산자의 끝 포함 여부",
  q:"1부터 n 까지의 합을 구하는 함수인데 항상 n 만큼 모자랍니다.",
  src:"pub fn sum_to(n: u32) -> u32 {\n    (1..n).sum()\n}",
  sol:"pub fn sum_to(n: u32) -> u32 {\n    (1..=n).sum()\n}",
  test:{"it.rs":"use dbg1::sum_to;\n\n#[test]\nfn small() {\n    assert_eq!(sum_to(3), 6);\n}\n\n#[test]\nfn ten() {\n    assert_eq!(sum_to(10), 55);\n}\n\n#[test]\nfn one() {\n    assert_eq!(sum_to(1), 1);\n}\n\n#[test]\nfn zero() {\n    assert_eq!(sum_to(0), 0);\n}\n"},
  ex:"🐛 원인: 1..n 은 n 을 포함하지 않는 반열린 범위입니다. 1부터 n 까지를 뜻하려면 끝을 포함하는 범위가 필요합니다.\n🔧 해결: 1..=n 으로 끝을 포함시킵니다.\n🛡 재발 방지: 러스트의 기본은 반열린 범위입니다(슬라이싱·인덱스와 일관되게). 사람이 말하는 '~까지' 는 대개 닫힌 범위이므로 옮겨 적을 때마다 = 가 필요한지 확인하세요." },

{ lang:"rust", name:"dbg2", k:"String 의 len 은 바이트 수",
  q:"문자열의 글자 수를 세는 함수입니다. 한글이 들어가면 세 배로 나옵니다.",
  src:"pub fn chars(s: &str) -> usize {\n    s.len()\n}",
  sol:"pub fn chars(s: &str) -> usize {\n    s.chars().count()\n}",
  test:{"it.rs":"use dbg2::chars;\n\n#[test]\nfn ascii() {\n    assert_eq!(chars(\"abc\"), 3);\n}\n\n#[test]\nfn hangul() {\n    assert_eq!(chars(\"한글\"), 2);\n}\n\n#[test]\nfn mixed() {\n    assert_eq!(chars(\"a한b\"), 3);\n}\n\n#[test]\nfn empty() {\n    assert_eq!(chars(\"\"), 0);\n}\n"},
  ex:"🐛 원인: str::len 은 UTF-8 바이트 길이입니다. 한글 한 글자는 3바이트라 '한글' 은 6 이 됩니다.\n🔧 해결: chars().count() 로 코드포인트를 셉니다.\n🛡 재발 방지: 러스트가 s[0] 같은 인덱싱을 막아 둔 이유가 이것입니다. 바이트 경계를 벗어난 슬라이싱은 컴파일이 아니라 런타임 패닉이므로, 글자 단위 작업에는 chars·char_indices 를 쓰세요." },

{ lang:"rust", name:"dbg3", k:"usize 뺄셈은 음수가 될 수 없다",
  q:"목록에서 마지막 원소를 뺀 나머지의 합을 구합니다. 빈 목록을 넣으면 패닉이 납니다. 빈 목록이면 0 을 반환하세요.",
  src:"pub fn sum_but_last(xs: &[i32]) -> i32 {\n    xs[..xs.len() - 1].iter().sum()\n}",
  sol:"pub fn sum_but_last(xs: &[i32]) -> i32 {\n    match xs.split_last() {\n        Some((_, rest)) => rest.iter().sum(),\n        None => 0,\n    }\n}",
  test:{"it.rs":"use dbg3::sum_but_last;\n\n#[test]\nfn normal() {\n    assert_eq!(sum_but_last(&[1, 2, 3]), 3);\n}\n\n#[test]\nfn empty() {\n    assert_eq!(sum_but_last(&[]), 0);\n}\n\n#[test]\nfn single() {\n    assert_eq!(sum_but_last(&[9]), 0);\n}\n\n#[test]\nfn negatives() {\n    assert_eq!(sum_but_last(&[-1, -2, 5]), -3);\n}\n"},
  ex:"🐛 원인: xs.len() 은 usize(부호 없는 정수)라 0 - 1 이 음수가 되지 못하고 뺄셈 자체가 패닉합니다(디버그 빌드). 릴리스 빌드에서는 거대한 수로 감싸져 슬라이싱에서 터집니다 — 더 나쁩니다.\n🔧 해결: split_last 로 '마지막이 있는 경우' 와 '없는 경우' 를 타입으로 나눕니다.\n🛡 재발 방지: usize 에서 빼기 전에 항상 0 인지 확인하세요. checked_sub 나 saturating_sub 를 쓰면 의도를 코드에 남길 수 있습니다." },

{ lang:"rust", name:"dbg4", k:"정수 나눗셈이 평균을 자른다",
  q:"정수 목록의 평균을 f64 로 반환합니다. 소수점 이하가 잘려 나옵니다.",
  src:"pub fn mean(xs: &[i32]) -> f64 {\n    if xs.is_empty() {\n        return 0.0;\n    }\n    (xs.iter().sum::<i32>() / xs.len() as i32) as f64\n}",
  sol:"pub fn mean(xs: &[i32]) -> f64 {\n    if xs.is_empty() {\n        return 0.0;\n    }\n    xs.iter().sum::<i32>() as f64 / xs.len() as f64\n}",
  test:{"it.rs":"use dbg4::mean;\n\n#[test]\nfn halves() {\n    assert_eq!(mean(&[1, 2]), 1.5);\n}\n\n#[test]\nfn exact() {\n    assert_eq!(mean(&[2, 4]), 3.0);\n}\n\n#[test]\nfn empty() {\n    assert_eq!(mean(&[]), 0.0);\n}\n\n#[test]\nfn thirds() {\n    assert!((mean(&[1, 1, 2]) - 4.0 / 3.0).abs() < 1e-9);\n}\n"},
  ex:"🐛 원인: i32 끼리 나누면 정수 나눗셈이라 소수가 버려집니다. 그 뒤에 f64 로 바꿔도 이미 잃은 값은 돌아오지 않습니다.\n🔧 해결: 나누기 '전에' 양쪽을 f64 로 바꿉니다.\n🛡 재발 방지: 캐스팅 위치가 결과를 바꿉니다. (a / b) as f64 와 a as f64 / b as f64 는 다른 값입니다. 나눗셈이 보이면 타입부터 확인하세요." },

{ lang:"rust", name:"dbg5", k:"retain 의 조건이 뒤집혀 있다",
  q:"목록에서 음수를 제거해야 하는데 양수가 지워집니다.",
  src:"pub fn drop_negatives(xs: &mut Vec<i32>) {\n    xs.retain(|&v| v < 0);\n}",
  sol:"pub fn drop_negatives(xs: &mut Vec<i32>) {\n    xs.retain(|&v| v >= 0);\n}",
  test:{"it.rs":"use dbg5::drop_negatives;\n\n#[test]\nfn mixed() {\n    let mut v = vec![1, -1, 2, -2];\n    drop_negatives(&mut v);\n    assert_eq!(v, vec![1, 2]);\n}\n\n#[test]\nfn zero_kept() {\n    let mut v = vec![0, -1];\n    drop_negatives(&mut v);\n    assert_eq!(v, vec![0]);\n}\n\n#[test]\nfn all_positive() {\n    let mut v = vec![3, 4];\n    drop_negatives(&mut v);\n    assert_eq!(v, vec![3, 4]);\n}\n\n#[test]\nfn empty() {\n    let mut v: Vec<i32> = vec![];\n    drop_negatives(&mut v);\n    assert!(v.is_empty());\n}\n"},
  ex:"🐛 원인: retain 은 '남길 조건' 을 받습니다. '지울 조건' 을 넘기면 정확히 반대로 동작합니다. 이름이 remove_if 가 아니라 retain 인 이유입니다.\n🔧 해결: 조건을 남길 쪽으로 뒤집습니다. 0 은 음수가 아니므로 v >= 0 이어야 합니다.\n🛡 재발 방지: 필터 계열 API 는 '남길 것' 과 '버릴 것' 중 어느 쪽을 받는지 언어마다 다릅니다. 경계값(0)을 포함한 테스트를 넣으면 방향과 등호를 한 번에 잡을 수 있습니다." },

/* ───────────────── C ───────────────── */
{ lang:"c", k:"문자열은 == 로 비교할 수 없다",
  q:"두 문자열이 같은지 판정하는 함수인데, 내용이 같아도 0 을 돌려줄 때가 있습니다.",
  src:"#include \"sol.h\"\n\nint same(const char *a, const char *b) {\n    return a == b;\n}",
  sol:"#include \"sol.h\"\n#include <string.h>\n\nint same(const char *a, const char *b) {\n    return strcmp(a, b) == 0;\n}",
  test:{"sol.h":"#ifndef SOL_H\n#define SOL_H\nint same(const char *a, const char *b);\n#endif\n",
        "test.c":"#include <stdio.h>\n#include <string.h>\n#include \"sol.h\"\n\nstatic int fails = 0;\nstatic void check(int cond, const char *msg) {\n    if (!cond) { printf(\"FAIL: %s\\n\", msg); fails++; }\n}\n\nint main(void) {\n    char buf[8];\n    strcpy(buf, \"abc\");\n    check(same(buf, \"abc\") != 0, \"내용이 같으면 참이어야 한다\");\n    check(same(\"abc\", \"abd\") == 0, \"내용이 다르면 거짓이어야 한다\");\n    check(same(\"\", \"\") != 0, \"빈 문자열끼리는 같다\");\n    check(same(\"abc\", \"ab\") == 0, \"길이가 다르면 다르다\");\n    if (fails) { printf(\"%d개 실패\\n\", fails); return 1; }\n    printf(\"모두 통과\\n\");\n    return 0;\n}\n"},
  ex:"🐛 원인: C 에서 char* 끼리의 == 는 '같은 주소를 가리키는가' 입니다. 내용 비교가 아닙니다. 같은 리터럴은 컴파일러가 한 곳에 모아 두어 우연히 참이 되기도 해서 더 헷갈립니다.\n🔧 해결: strcmp 로 내용을 비교하고 0 인지 확인합니다.\n🛡 재발 방지: strcmp 는 '같으면 0' 이라 조건문에서 뒤집히기 쉽습니다. strcmp(a,b) == 0 처럼 비교를 명시적으로 쓰세요." },

{ lang:"c", k:"널 종료 문자 자리를 빼먹었다",
  q:"문자열을 복사해 돌려주는 함수인데, 만든 문자열을 출력하면 뒤에 쓰레기 값이 붙습니다.",
  src:"#include \"sol.h\"\n#include <stdlib.h>\n#include <string.h>\n\nchar *dup_str(const char *s) {\n    char *p = malloc(strlen(s));\n    memcpy(p, s, strlen(s));\n    return p;\n}",
  sol:"#include \"sol.h\"\n#include <stdlib.h>\n#include <string.h>\n\nchar *dup_str(const char *s) {\n    size_t n = strlen(s);\n    char *p = malloc(n + 1);\n    memcpy(p, s, n);\n    p[n] = '\\0';\n    return p;\n}",
  test:{"sol.h":"#ifndef SOL_H\n#define SOL_H\nchar *dup_str(const char *s);\n#endif\n",
        "test.c":"#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n#include \"sol.h\"\n\nstatic int fails = 0;\nstatic void check(int cond, const char *msg) {\n    if (!cond) { printf(\"FAIL: %s\\n\", msg); fails++; }\n}\n\nint main(void) {\n    char *a = dup_str(\"hello\");\n    check(strlen(a) == 5, \"길이가 5여야 한다\");\n    check(strcmp(a, \"hello\") == 0, \"내용이 같아야 한다\");\n    free(a);\n    char *b = dup_str(\"\");\n    check(strlen(b) == 0, \"빈 문자열은 길이 0\");\n    free(b);\n    char *c = dup_str(\"x\");\n    check(strcmp(c, \"x\") == 0, \"한 글자도 복사된다\");\n    free(c);\n    if (fails) { printf(\"%d개 실패\\n\", fails); return 1; }\n    printf(\"모두 통과\\n\");\n    return 0;\n}\n"},
  ex:"🐛 원인: C 문자열은 끝에 '\\0' 이 하나 더 필요합니다. strlen 은 그 널 문자를 세지 않으므로 malloc(strlen(s)) 는 정확히 한 바이트가 모자라고, 널 종료도 쓰지 않아 strlen 이 버퍼 밖까지 읽어 나갑니다.\n🔧 해결: n + 1 바이트를 잡고 마지막에 '\\0' 을 써 넣습니다.\n🛡 재발 방지: 문자열 버퍼 크기는 언제나 '내용 + 1' 입니다. strlen 을 두 번 부르는 것도 낭비이니 한 번 재서 변수에 담아 두세요. strdup 이 있으면 그걸 쓰는 게 가장 안전합니다." },

{ lang:"c", k:"배열은 함수로 넘어가며 포인터가 된다",
  q:"배열의 원소 개수를 세는 함수인데, 어떤 배열을 넣어도 2 만 나옵니다.",
  src:"#include \"sol.h\"\n\nint count(int *a) {\n    return (int)(sizeof(a) / sizeof(a[0]));\n}\n\nint sum_n(const int *a, int n) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += a[i];\n    return s;\n}",
  sol:"#include \"sol.h\"\n\nint count(int *a) {\n    (void)a;\n    return -1;\n}\n\nint sum_n(const int *a, int n) {\n    int s = 0;\n    for (int i = 0; i < n; i++) s += a[i];\n    return s;\n}",
  test:{"sol.h":"#ifndef SOL_H\n#define SOL_H\nint count(int *a);\nint sum_n(const int *a, int n);\n#endif\n",
        "test.c":"#include <stdio.h>\n#include \"sol.h\"\n\nstatic int fails = 0;\nstatic void check(int cond, const char *msg) {\n    if (!cond) { printf(\"FAIL: %s\\n\", msg); fails++; }\n}\n\nint main(void) {\n    int a[5] = {1, 2, 3, 4, 5};\n    /* 포인터만 받아서는 개수를 알 수 없다 — 알 수 없음(-1)을 정직하게 반환해야 한다 */\n    check(count(a) == -1, \"포인터만으로 개수를 아는 척하면 안 된다\");\n    check(sum_n(a, 5) == 15, \"개수를 함께 받으면 합계를 낼 수 있다\");\n    check(sum_n(a, 0) == 0, \"개수 0이면 합계도 0\");\n    check(sum_n(a, 2) == 3, \"앞 2개만 더한다\");\n    if (fails) { printf(\"%d개 실패\\n\", fails); return 1; }\n    printf(\"모두 통과\\n\");\n    return 0;\n}\n"},
  ex:"🐛 원인: 배열을 함수 인자로 넘기면 첫 원소를 가리키는 포인터로 변합니다. sizeof(a) 는 배열 전체가 아니라 포인터 크기(64비트에서 8)라 8/4 = 2 가 나옵니다. 배열이 얼마나 크든 항상 2 입니다.\n🔧 해결: 포인터만으로는 개수를 알 방법이 없습니다. '알 수 없음' 을 정직하게 반환하고, 개수는 호출자가 함께 넘기게 합니다.\n🛡 재발 방지: sizeof 로 원소 수를 세는 관용구는 배열이 '선언된 스코프 안' 에서만 통합니다. 함수 경계를 넘는 순간 크기 정보는 사라지므로 항상 길이를 같이 전달하세요." },

{ lang:"c", k:"<= 가 배열 끝을 한 칸 넘는다",
  q:"배열의 최댓값을 찾는 함수인데, 가끔 배열에 없는 이상한 값이 나옵니다.",
  src:"#include \"sol.h\"\n\nint max_of(const int *a, int n) {\n    int m = a[0];\n    for (int i = 1; i <= n; i++) {\n        if (a[i] > m) m = a[i];\n    }\n    return m;\n}",
  sol:"#include \"sol.h\"\n\nint max_of(const int *a, int n) {\n    int m = a[0];\n    for (int i = 1; i < n; i++) {\n        if (a[i] > m) m = a[i];\n    }\n    return m;\n}",
  test:{"sol.h":"#ifndef SOL_H\n#define SOL_H\nint max_of(const int *a, int n);\n#endif\n",
        "test.c":"#include <stdio.h>\n#include \"sol.h\"\n\nstatic int fails = 0;\nstatic void check(int cond, const char *msg) {\n    if (!cond) { printf(\"FAIL: %s\\n\", msg); fails++; }\n}\n\nint main(void) {\n    /* 배열 바로 뒤에 더 큰 값을 두어 한 칸 넘어가면 그 값을 집게 만든다 */\n    static int buf[8] = {3, 1, 2, 999, 0, 0, 0, 0};\n    check(max_of(buf, 3) == 3, \"앞 3개의 최댓값은 3이어야 한다\");\n    static int b2[4] = {5, 7, 4242, 0};\n    check(max_of(b2, 2) == 7, \"앞 2개의 최댓값은 7이어야 한다\");\n    static int b3[2] = {9, 1234};\n    check(max_of(b3, 1) == 9, \"원소가 1개면 그 값\");\n    static int b4[5] = {-3, -1, -2, 100, 0};\n    check(max_of(b4, 3) == -1, \"음수만 있어도 맞아야 한다\");\n    if (fails) { printf(\"%d개 실패\\n\", fails); return 1; }\n    printf(\"모두 통과\\n\");\n    return 0;\n}\n"},
  ex:"🐛 원인: 인덱스가 0부터 시작하므로 유효한 마지막 위치는 n-1 입니다. i <= n 은 배열 밖을 한 번 더 읽습니다. C 는 경계를 검사하지 않아 크래시 없이 옆 메모리 값을 그대로 집어 옵니다.\n🔧 해결: 조건을 i < n 으로 바꿉니다.\n🛡 재발 방지: 배열 순회의 표준형은 for (i = 0; i < n; i++) 입니다. <= 가 보이면 일단 의심하세요. 이런 한 칸 초과는 값이 우연히 작으면 테스트를 통과해 버려서, 경계 바로 뒤에 큰 값을 두는 테스트가 필요합니다." },

{ lang:"c", k:"지역 배열의 주소를 돌려준다",
  q:"숫자를 문자열로 바꿔 돌려주는 함수인데, 받은 문자열이 깨져 있거나 다음 호출에 덮어써집니다.",
  src:"#include \"sol.h\"\n#include <stdio.h>\n\nchar *to_str(int v) {\n    char buf[16];\n    snprintf(buf, sizeof(buf), \"%d\", v);\n    return buf;\n}",
  sol:"#include \"sol.h\"\n#include <stdio.h>\n#include <stdlib.h>\n\nchar *to_str(int v) {\n    char *p = malloc(16);\n    snprintf(p, 16, \"%d\", v);\n    return p;\n}",
  test:{"sol.h":"#ifndef SOL_H\n#define SOL_H\nchar *to_str(int v);\n#endif\n",
        "test.c":"#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n#include \"sol.h\"\n\nstatic int fails = 0;\nstatic void check(int cond, const char *msg) {\n    if (!cond) { printf(\"FAIL: %s\\n\", msg); fails++; }\n}\n\nint main(void) {\n    char *a = to_str(12);\n    char *b = to_str(34);\n    /* 두 결과가 동시에 살아 있어야 한다 — 같은 버퍼를 돌려주면 여기서 깨진다 */\n    check(strcmp(a, \"12\") == 0, \"첫 결과가 유지되어야 한다\");\n    check(strcmp(b, \"34\") == 0, \"둘째 결과도 맞아야 한다\");\n    check(a != b, \"서로 다른 버퍼여야 한다\");\n    free(a);\n    free(b);\n    char *c = to_str(-7);\n    check(strcmp(c, \"-7\") == 0, \"음수도 변환된다\");\n    free(c);\n    if (fails) { printf(\"%d개 실패\\n\", fails); return 1; }\n    printf(\"모두 통과\\n\");\n    return 0;\n}\n"},
  ex:"🐛 원인: buf 는 함수의 스택 프레임에 있는 지역 배열이라 함수가 끝나면 사라집니다. 반환된 포인터는 이미 남의 것이 된 메모리를 가리키고, 다음 호출이 같은 자리를 다시 씁니다.\n🔧 해결: 호출자가 오래 쓸 메모리는 malloc 으로 힙에 잡습니다. 해제 책임이 호출자에게 넘어가므로 문서에 남겨야 합니다.\n🛡 재발 방지: 더 나은 설계는 호출자가 버퍼를 넘기게 하는 것입니다(to_str(int v, char *out, size_t n)). 그러면 할당과 해제가 한 곳에서 짝을 이룹니다." },

/* ───────────────── C++ ───────────────── */
{ lang:"cpp", k:"범위 for 가 값을 복사한다",
  q:"벡터의 모든 값을 두 배로 만드는 함수인데 아무것도 바뀌지 않습니다.",
  src:"#include \"sol.h\"\n\nvoid doubleAll(std::vector<int>& v) {\n    for (int x : v) {\n        x *= 2;\n    }\n}",
  sol:"#include \"sol.h\"\n\nvoid doubleAll(std::vector<int>& v) {\n    for (int& x : v) {\n        x *= 2;\n    }\n}",
  test:{"sol.h":"#pragma once\n#include <vector>\nvoid doubleAll(std::vector<int>& v);\n",
        "test.cpp":"#include \"catch.hpp\"\n#include \"sol.h\"\n\nTEST_CASE(\"값이 두 배가 된다\") {\n    std::vector<int> v{1, 2, 3};\n    doubleAll(v);\n    REQUIRE(v == std::vector<int>{2, 4, 6});\n}\n\nTEST_CASE(\"빈 벡터도 안전하다\") {\n    std::vector<int> v;\n    doubleAll(v);\n    REQUIRE(v.empty());\n}\n\nTEST_CASE(\"음수와 0\") {\n    std::vector<int> v{-1, 0};\n    doubleAll(v);\n    REQUIRE(v == std::vector<int>{-2, 0});\n}\n"},
  ex:"🐛 원인: for (int x : v) 의 x 는 원소의 복사본입니다. 복사본을 두 배로 만들어도 벡터 안의 값은 그대로입니다.\n🔧 해결: int& 로 참조를 받아야 원본을 고칩니다.\n🛡 재발 방지: 범위 for 의 기본형은 세 가지입니다 — 읽기만 하면 const auto&, 고치면 auto&, 값 복사가 필요할 때만 auto. 큰 객체를 auto 로 받으면 조용히 복사 비용까지 붙습니다." },

{ lang:"cpp", k:"size() 는 부호 없는 정수다",
  q:"이웃한 두 원소의 차이 목록을 만드는 함수인데, 빈 벡터를 넣으면 프로그램이 죽거나 이상한 값이 나옵니다.",
  src:"#include \"sol.h\"\n\nstd::vector<int> diffs(const std::vector<int>& v) {\n    std::vector<int> out;\n    for (size_t i = 0; i < v.size() - 1; i++) {\n        out.push_back(v[i + 1] - v[i]);\n    }\n    return out;\n}",
  sol:"#include \"sol.h\"\n\nstd::vector<int> diffs(const std::vector<int>& v) {\n    std::vector<int> out;\n    for (size_t i = 1; i < v.size(); i++) {\n        out.push_back(v[i] - v[i - 1]);\n    }\n    return out;\n}",
  test:{"sol.h":"#pragma once\n#include <vector>\nstd::vector<int> diffs(const std::vector<int>& v);\n",
        "test.cpp":"#include \"catch.hpp\"\n#include \"sol.h\"\n\nTEST_CASE(\"빈 벡터는 빈 결과\") {\n    REQUIRE(diffs({}).empty());\n}\n\nTEST_CASE(\"원소 하나면 빈 결과\") {\n    REQUIRE(diffs({5}).empty());\n}\n\nTEST_CASE(\"차이를 계산한다\") {\n    REQUIRE(diffs({1, 4, 9}) == std::vector<int>{3, 5});\n}\n\nTEST_CASE(\"감소하는 값\") {\n    REQUIRE(diffs({10, 7}) == std::vector<int>{-3});\n}\n"},
  ex:"🐛 원인: v.size() 는 부호 없는 size_t 입니다. 빈 벡터에서 size() - 1 은 -1 이 아니라 아주 큰 수(2^64-1)로 감싸져 루프가 사실상 무한히 돌며 범위 밖을 읽습니다.\n🔧 해결: 빼기를 없애고 i 를 1부터 시작해 v.size() 와 비교합니다.\n🛡 재발 방지: 부호 없는 타입에서 빼지 마세요. 꼭 필요하면 v.size() > 1 을 먼저 확인하거나, C++20 의 std::ssize 로 부호 있는 크기를 얻으세요." },

{ lang:"cpp", k:"map 의 [] 는 없는 키를 만들어 넣는다",
  q:"맵에서 값을 조회하되 없으면 0 을 돌려주는 함수입니다. 조회만 했는데 맵의 크기가 계속 늘어납니다.",
  src:"#include \"sol.h\"\n\nint lookup(std::map<std::string, int>& m, const std::string& k) {\n    return m[k];\n}",
  sol:"#include \"sol.h\"\n\nint lookup(std::map<std::string, int>& m, const std::string& k) {\n    auto it = m.find(k);\n    return it == m.end() ? 0 : it->second;\n}",
  test:{"sol.h":"#pragma once\n#include <map>\n#include <string>\nint lookup(std::map<std::string, int>& m, const std::string& k);\n",
        "test.cpp":"#include \"catch.hpp\"\n#include \"sol.h\"\n\nTEST_CASE(\"있는 키는 값을 준다\") {\n    std::map<std::string, int> m{{\"a\", 7}};\n    REQUIRE(lookup(m, \"a\") == 7);\n}\n\nTEST_CASE(\"없는 키는 0을 주고 맵을 늘리지 않는다\") {\n    std::map<std::string, int> m{{\"a\", 7}};\n    REQUIRE(lookup(m, \"zzz\") == 0);\n    REQUIRE(m.size() == 1);\n}\n\nTEST_CASE(\"빈 맵도 안전하다\") {\n    std::map<std::string, int> m;\n    REQUIRE(lookup(m, \"x\") == 0);\n    REQUIRE(m.empty());\n}\n"},
  ex:"🐛 원인: std::map 의 operator[] 는 키가 없으면 값을 기본 생성해 '삽입한 뒤' 그 참조를 돌려줍니다. 읽기처럼 보이지만 쓰기입니다. 조회가 잦은 코드에서 맵이 무한히 부풀고, const map 에는 아예 쓸 수 없습니다.\n🔧 해결: find 로 존재를 확인한 뒤 값을 읽습니다. C++17 이후라면 m.count(k) 대신 m.contains(k)(C++20) 도 있습니다.\n🛡 재발 방지: 읽기 전용 조회에 [] 를 쓰지 마세요. 함수 인자를 const map& 로 받으면 컴파일러가 이 실수를 막아 줍니다." },

{ lang:"cpp", k:"순회 중 erase 로 반복자가 무효화된다",
  q:"벡터에서 특정 값을 모두 지우는 함수인데, 같은 값이 연달아 있으면 일부가 남습니다.",
  src:"#include \"sol.h\"\n\nvoid removeAll(std::vector<int>& v, int target) {\n    for (auto it = v.begin(); it != v.end(); ++it) {\n        if (*it == target) v.erase(it);\n    }\n}",
  sol:"#include \"sol.h\"\n#include <algorithm>\n\nvoid removeAll(std::vector<int>& v, int target) {\n    v.erase(std::remove(v.begin(), v.end(), target), v.end());\n}",
  test:{"sol.h":"#pragma once\n#include <vector>\nvoid removeAll(std::vector<int>& v, int target);\n",
        "test.cpp":"#include \"catch.hpp\"\n#include \"sol.h\"\n\nTEST_CASE(\"연달아 있는 값도 모두 지운다\") {\n    std::vector<int> v{1, 2, 2, 3};\n    removeAll(v, 2);\n    REQUIRE(v == std::vector<int>{1, 3});\n}\n\nTEST_CASE(\"전부 같은 값\") {\n    std::vector<int> v{5, 5, 5};\n    removeAll(v, 5);\n    REQUIRE(v.empty());\n}\n\nTEST_CASE(\"없는 값은 아무것도 안 지운다\") {\n    std::vector<int> v{1, 2};\n    removeAll(v, 9);\n    REQUIRE(v == std::vector<int>{1, 2});\n}\n\nTEST_CASE(\"빈 벡터\") {\n    std::vector<int> v;\n    removeAll(v, 1);\n    REQUIRE(v.empty());\n}\n"},
  ex:"🐛 원인: vector::erase 는 지운 자리 뒤의 반복자를 모두 무효화하고 원소를 앞으로 당깁니다. 그런데 루프는 ++it 로 한 칸 더 나아가므로 바로 뒤 원소를 건너뜁니다. 같은 값이 연달아 있으면 두 번째가 살아남습니다.\n🔧 해결: erase-remove 관용구를 씁니다. std::remove 가 남길 원소를 앞으로 모아 새 끝을 알려 주고, erase 가 꼬리를 한 번에 잘라냅니다.\n🛡 재발 방지: 제자리에서 지워야 한다면 it = v.erase(it) 로 erase 가 돌려주는 다음 반복자를 받고, 지우지 않은 경우에만 ++it 하세요. C++20 의 std::erase(v, target) 이 가장 간결합니다." },

{ lang:"cpp", k:"실수를 == 로 비교한다",
  q:"누적 비율이 1.0 에 도달했는지 판정하는 함수입니다. 0.1 을 열 번 더한 값을 넣으면 false 가 나옵니다.",
  src:"#include \"sol.h\"\n\nbool isFull(double ratio) {\n    return ratio == 1.0;\n}",
  sol:"#include \"sol.h\"\n#include <cmath>\n\nbool isFull(double ratio) {\n    return std::fabs(ratio - 1.0) < 1e-9;\n}",
  test:{"sol.h":"#pragma once\nbool isFull(double ratio);\n",
        "test.cpp":"#include \"catch.hpp\"\n#include \"sol.h\"\n\nTEST_CASE(\"0.1을 열 번 더해도 가득 찬 것으로 본다\") {\n    double s = 0.0;\n    for (int i = 0; i < 10; i++) s += 0.1;\n    REQUIRE(isFull(s));\n}\n\nTEST_CASE(\"정확히 1.0\") {\n    REQUIRE(isFull(1.0));\n}\n\nTEST_CASE(\"절반은 아니다\") {\n    REQUIRE_FALSE(isFull(0.5));\n}\n\nTEST_CASE(\"넘치면 아니다\") {\n    REQUIRE_FALSE(isFull(1.5));\n}\n"},
  ex:"🐛 원인: 0.1 은 2진 부동소수로 정확히 표현되지 않습니다. 열 번 더하면 0.9999999999999999 가 되어 == 1.0 이 거짓입니다.\n🔧 해결: 허용 오차를 두고 절댓값 차이를 비교합니다.\n🛡 재발 방지: 부동소수는 == 로 비교하지 않습니다. 허용 오차는 값의 크기에 비례해야 할 때도 있으니(상대 오차), 큰 수를 다루면 fabs(a-b) <= eps * std::max(fabs(a), fabs(b)) 형태를 고려하세요." },

/* ───────────────── Java ───────────────── */
{ lang:"java", k:"문자열을 == 로 비교한다",
  q:"입력받은 명령어가 'quit' 인지 확인하는 함수인데, 사용자가 직접 입력한 문자열은 같아도 false 가 나옵니다.",
  src:"public class Sol {\n    public static boolean isQuit(String cmd) {\n        return cmd == \"quit\";\n    }\n}",
  sol:"public class Sol {\n    public static boolean isQuit(String cmd) {\n        return \"quit\".equals(cmd);\n    }\n}",
  test:{"SolTest.java":"import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class SolTest {\n    @Test\n    public void 런타임에_만들어진_문자열도_같다() {\n        String built = new StringBuilder(\"qu\").append(\"it\").toString();\n        assertTrue(Sol.isQuit(built));\n    }\n\n    @Test\n    public void 리터럴은_같다() {\n        assertTrue(Sol.isQuit(\"quit\"));\n    }\n\n    @Test\n    public void 다른_명령은_거짓() {\n        assertFalse(Sol.isQuit(\"exit\"));\n    }\n\n    @Test\n    public void null_은_거짓이고_터지지_않는다() {\n        assertFalse(Sol.isQuit(null));\n    }\n}\n"},
  ex:"🐛 원인: 자바에서 == 는 참조 비교입니다. 소스에 직접 쓴 리터럴은 상수 풀에 모여 우연히 같은 객체가 되지만, 입력·연결·파싱으로 만들어진 문자열은 다른 객체라 false 가 됩니다.\n🔧 해결: equals 로 내용을 비교합니다. 리터럴을 앞에 두면 인자가 null 이어도 NullPointerException 이 나지 않습니다.\n🛡 재발 방지: == 가 리터럴 테스트만으로는 통과해 버리는 게 이 버그의 무서운 점입니다. 테스트에 '런타임에 만들어진 문자열' 을 반드시 넣으세요." },

{ lang:"java", k:"정수 나눗셈이 평균을 자른다",
  q:"점수 배열의 평균을 double 로 반환합니다. 소수점 이하가 잘려 나옵니다.",
  src:"public class Sol {\n    public static double mean(int[] xs) {\n        if (xs.length == 0) return 0.0;\n        int sum = 0;\n        for (int x : xs) sum += x;\n        return sum / xs.length;\n    }\n}",
  sol:"public class Sol {\n    public static double mean(int[] xs) {\n        if (xs.length == 0) return 0.0;\n        int sum = 0;\n        for (int x : xs) sum += x;\n        return (double) sum / xs.length;\n    }\n}",
  test:{"SolTest.java":"import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class SolTest {\n    @Test\n    public void 소수점이_남는다() {\n        assertEquals(1.5, Sol.mean(new int[]{1, 2}), 1e-9);\n    }\n\n    @Test\n    public void 딱_떨어지는_경우() {\n        assertEquals(3.0, Sol.mean(new int[]{2, 4}), 1e-9);\n    }\n\n    @Test\n    public void 빈_배열은_0() {\n        assertEquals(0.0, Sol.mean(new int[]{}), 1e-9);\n    }\n\n    @Test\n    public void 삼분의_사() {\n        assertEquals(4.0 / 3.0, Sol.mean(new int[]{1, 1, 2}), 1e-9);\n    }\n}\n"},
  ex:"🐛 원인: sum 과 xs.length 가 둘 다 int 라 정수 나눗셈이 일어납니다. 소수가 버려진 뒤에 double 로 변환되므로 이미 늦었습니다.\n🔧 해결: 나누기 '전에' 한쪽을 double 로 캐스팅합니다.\n🛡 재발 방지: 반환 타입이 double 이라고 계산도 double 로 되는 게 아닙니다. 나눗셈이 보이면 피연산자 타입을 먼저 보세요." },

{ lang:"java", k:"순회 중 remove 로 예외가 난다",
  q:"목록에서 특정 값을 모두 지우는 함수인데 ConcurrentModificationException 이 납니다.",
  src:"import java.util.List;\n\npublic class Sol {\n    public static void removeAll(List<String> list, String target) {\n        for (String s : list) {\n            if (s.equals(target)) list.remove(s);\n        }\n    }\n}",
  sol:"import java.util.Iterator;\nimport java.util.List;\n\npublic class Sol {\n    public static void removeAll(List<String> list, String target) {\n        Iterator<String> it = list.iterator();\n        while (it.hasNext()) {\n            if (it.next().equals(target)) it.remove();\n        }\n    }\n}",
  test:{"SolTest.java":"import org.junit.jupiter.api.Test;\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class SolTest {\n    @Test\n    public void 연달아_있어도_모두_지운다() {\n        List<String> l = new ArrayList<>(Arrays.asList(\"a\", \"b\", \"b\", \"c\"));\n        Sol.removeAll(l, \"b\");\n        assertEquals(Arrays.asList(\"a\", \"c\"), l);\n    }\n\n    @Test\n    public void 전부_같은_값() {\n        List<String> l = new ArrayList<>(Arrays.asList(\"x\", \"x\"));\n        Sol.removeAll(l, \"x\");\n        assertTrue(l.isEmpty());\n    }\n\n    @Test\n    public void 없는_값() {\n        List<String> l = new ArrayList<>(Arrays.asList(\"a\"));\n        Sol.removeAll(l, \"z\");\n        assertEquals(Arrays.asList(\"a\"), l);\n    }\n\n    @Test\n    public void 빈_목록() {\n        List<String> l = new ArrayList<>();\n        Sol.removeAll(l, \"a\");\n        assertTrue(l.isEmpty());\n    }\n}\n"},
  ex:"🐛 원인: 향상된 for 문은 내부적으로 Iterator 를 씁니다. 그 사이에 컬렉션을 직접 고치면 구조 변경 횟수가 어긋나 ConcurrentModificationException 이 납니다. 마지막에서 두 번째 원소를 지울 때는 예외 없이 조용히 건너뛰기도 해서 더 나쁩니다.\n🔧 해결: Iterator 를 직접 들고 it.remove() 로 지웁니다. 반복자가 자기 상태를 함께 갱신합니다.\n🛡 재발 방지: 자바 8 이상이면 list.removeIf(s -> s.equals(target)) 한 줄이 가장 명확합니다. 순회 대상과 수정 대상을 분리한다는 원칙은 어느 언어에서나 같습니다." },

{ lang:"java", k:"Integer 캐시 밖에서 == 가 깨진다",
  q:"두 주문 번호가 같은지 비교하는 함수입니다. 작은 번호에서는 잘 되는데 128 이상이 되면 같은 값도 false 가 나옵니다.",
  src:"public class Sol {\n    public static boolean sameId(Integer a, Integer b) {\n        return a == b;\n    }\n}",
  sol:"public class Sol {\n    public static boolean sameId(Integer a, Integer b) {\n        return a.equals(b);\n    }\n}",
  test:{"SolTest.java":"import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class SolTest {\n    @Test\n    public void 캐시_밖의_큰_값도_같다() {\n        Integer a = Integer.valueOf(1000);\n        Integer b = Integer.valueOf(1000);\n        assertTrue(Sol.sameId(a, b));\n    }\n\n    @Test\n    public void 작은_값() {\n        assertTrue(Sol.sameId(Integer.valueOf(5), Integer.valueOf(5)));\n    }\n\n    @Test\n    public void 다른_값은_거짓() {\n        assertFalse(Sol.sameId(Integer.valueOf(1000), Integer.valueOf(1001)));\n    }\n\n    @Test\n    public void 파싱해서_만든_값() {\n        assertTrue(Sol.sameId(Integer.parseInt(\"500\"), Integer.valueOf(\"500\")));\n    }\n}\n"},
  ex:"🐛 원인: Integer 는 객체이고 == 는 참조 비교입니다. JVM 은 -128~127 을 캐시해 두어 작은 값은 우연히 같은 객체가 되지만, 그 밖의 값은 매번 새 객체라 false 가 됩니다.\n🔧 해결: equals 로 값을 비교합니다.\n🛡 재발 방지: 이 버그는 테스트 데이터가 작으면 통과합니다. 박싱 타입 비교 테스트에는 반드시 127 을 넘는 값을 넣으세요. 애초에 null 이 필요 없다면 int 를 쓰는 편이 안전합니다." },

{ lang:"java", k:"Arrays.asList 는 크기가 고정이다",
  q:"배열을 받아 값을 덧붙일 수 있는 목록으로 바꿔 돌려주는 함수인데, 반환된 목록에 add 하면 예외가 납니다.",
  src:"import java.util.Arrays;\nimport java.util.List;\n\npublic class Sol {\n    public static List<String> toList(String[] arr) {\n        return Arrays.asList(arr);\n    }\n}",
  sol:"import java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\n\npublic class Sol {\n    public static List<String> toList(String[] arr) {\n        return new ArrayList<>(Arrays.asList(arr));\n    }\n}",
  test:{"SolTest.java":"import org.junit.jupiter.api.Test;\nimport java.util.Arrays;\nimport java.util.List;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class SolTest {\n    @Test\n    public void 덧붙일_수_있다() {\n        List<String> l = Sol.toList(new String[]{\"a\"});\n        l.add(\"b\");\n        assertEquals(Arrays.asList(\"a\", \"b\"), l);\n    }\n\n    @Test\n    public void 내용이_유지된다() {\n        assertEquals(Arrays.asList(\"x\", \"y\"), Sol.toList(new String[]{\"x\", \"y\"}));\n    }\n\n    @Test\n    public void 원본_배열과_끊어져_있다() {\n        String[] arr = {\"a\", \"b\"};\n        List<String> l = Sol.toList(arr);\n        arr[0] = \"CHANGED\";\n        assertEquals(\"a\", l.get(0));\n    }\n\n    @Test\n    public void 빈_배열() {\n        List<String> l = Sol.toList(new String[]{});\n        l.add(\"first\");\n        assertEquals(1, l.size());\n    }\n}\n"},
  ex:"🐛 원인: Arrays.asList 는 배열을 감싼 '고정 크기 뷰' 를 돌려줍니다. add·remove 는 UnsupportedOperationException 을 내고, set 은 원본 배열까지 바꿉니다.\n🔧 해결: new ArrayList<>(...) 로 감싸 진짜 복사본을 만듭니다.\n🛡 재발 방지: List 라는 타입만 보고 '무엇이든 되는 목록' 이라고 가정하지 마세요. Arrays.asList·List.of·Collections.unmodifiableList 는 모두 List 지만 수정 가능 범위가 제각각입니다." },
];
