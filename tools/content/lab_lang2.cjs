/* 언어별 빌드 랩 2차 — C · C++ · Rust.
   러너가 파일 하나를 실제 컴파일러로 빌드하고 그 언어의 테스트 러너로 채점한다.
   각 Day 의 테스트는 앞선 Day 의 요구사항까지 다시 검사한다(회귀 안전). */

/* ───────────────── C — 센서 링 버퍼 로거 (sol.c) ───────────────── */
const C_SEED =
`#include <stddef.h>

/* 센서 값을 고정 크기 링 버퍼에 담고 통계를 낸다.
   구조체는 test.c 와 공유하므로 필드 이름을 바꾸지 마세요. */
typedef struct {
    int buf[8];
    int head;   /* 다음에 쓸 자리 */
    int count;  /* 지금까지 담긴 개수 (최대 8) */
    int total;  /* 담긴 값들의 합 */
} Log;

void log_init(Log *g) {
    /* TODO: Day 1 */
}

void log_push(Log *g, int v) {
    /* TODO: Day 1 */
}

int log_avg(const Log *g) {
    /* TODO: Day 2 */
    return 0;
}

int log_spikes(const Log *g, int threshold) {
    /* TODO: Day 3 */
    return 0;
}
`;

const C_D1 =
`#include <stddef.h>

typedef struct {
    int buf[8];
    int head;
    int count;
    int total;
} Log;

void log_init(Log *g) {
    g->head = 0;
    g->count = 0;
    g->total = 0;
    for (int i = 0; i < 8; i++) g->buf[i] = 0;
}

void log_push(Log *g, int v) {
    if (g->count == 8) g->total -= g->buf[g->head];
    else g->count++;
    g->buf[g->head] = v;
    g->total += v;
    g->head = (g->head + 1) % 8;
}

int log_avg(const Log *g) {
    return 0;
}

int log_spikes(const Log *g, int threshold) {
    return 0;
}
`;

const C_D2 = C_D1.replace(
`int log_avg(const Log *g) {
    return 0;
}`,
`int log_avg(const Log *g) {
    if (g->count == 0) return 0;
    return g->total / g->count;
}`);

const C_D3 = C_D2.replace(
`int log_spikes(const Log *g, int threshold) {
    return 0;
}`,
`int log_spikes(const Log *g, int threshold) {
    int n = 0;
    for (int i = 0; i < g->count; i++) {
        int idx = (g->head - g->count + i + 16) % 8;
        if (g->buf[idx] >= threshold) n++;
    }
    return n;
}`);

const C_T1 = `#include <stdio.h>

typedef struct { int buf[8]; int head; int count; int total; } Log;
void log_init(Log *g);
void log_push(Log *g, int v);
int log_avg(const Log *g);
int log_spikes(const Log *g, int threshold);

int main(void) {
    Log g;
    log_init(&g);
    if (g.count != 0 || g.total != 0 || g.head != 0) { printf("초기화 실패\\n"); return 1; }

    log_push(&g, 10);
    log_push(&g, 20);
    if (g.count != 2 || g.total != 30) { printf("두 개 담기 실패: count=%d total=%d\\n", g.count, g.total); return 1; }

    for (int i = 0; i < 6; i++) log_push(&g, 5);
    if (g.count != 8) { printf("여덟 개까지: count=%d\\n", g.count); return 1; }
    if (g.total != 60) { printf("합계: %d, 기대 60\\n", g.total); return 1; }

    log_push(&g, 100);
    if (g.count != 8) { printf("가득 찬 뒤에도 8 이어야 한다: %d\\n", g.count); return 1; }
    if (g.total != 150) { printf("가장 오래된 10 이 빠져야 한다: %d, 기대 150\\n", g.total); return 1; }

    Log h;
    log_init(&h);
    for (int i = 0; i < 20; i++) log_push(&h, 1);
    if (h.count != 8 || h.total != 8) { printf("오래 돌린 뒤: count=%d total=%d\\n", h.count, h.total); return 1; }

    printf("ok\\n");
    return 0;
}
`;

const C_T2 = C_T1.replace(
`    printf("ok\\n");
    return 0;
}`,
`    Log a;
    log_init(&a);
    if (log_avg(&a) != 0) { printf("빈 버퍼 평균은 0\\n"); return 1; }
    log_push(&a, 10);
    log_push(&a, 20);
    if (log_avg(&a) != 15) { printf("평균: %d, 기대 15\\n", log_avg(&a)); return 1; }
    log_push(&a, 1);
    if (log_avg(&a) != 10) { printf("세 개 평균(내림): %d, 기대 10\\n", log_avg(&a)); return 1; }
    Log b;
    log_init(&b);
    for (int i = 0; i < 10; i++) log_push(&b, 100);
    if (log_avg(&b) != 100) { printf("가득 찬 뒤 평균: %d\\n", log_avg(&b)); return 1; }

    printf("ok\\n");
    return 0;
}`);

const C_T3 = C_T2.replace(
`    printf("ok\\n");
    return 0;
}`,
`    Log s;
    log_init(&s);
    if (log_spikes(&s, 10) != 0) { printf("빈 버퍼 스파이크는 0\\n"); return 1; }
    log_push(&s, 5);
    log_push(&s, 50);
    log_push(&s, 10);
    if (log_spikes(&s, 10) != 2) { printf("임계 이상 개수: %d, 기대 2\\n", log_spikes(&s, 10)); return 1; }
    if (log_spikes(&s, 100) != 0) { printf("임계가 높으면 0: %d\\n", log_spikes(&s, 100)); return 1; }

    Log w;
    log_init(&w);
    for (int i = 0; i < 8; i++) log_push(&w, 999);
    for (int i = 0; i < 4; i++) log_push(&w, 1);
    if (log_spikes(&w, 500) != 4) { printf("감긴 뒤 남은 큰 값: %d, 기대 4\\n", log_spikes(&w, 500)); return 1; }

    printf("ok\\n");
    return 0;
}`);

/* ───────────────── C++ — 충돌 판정 (sol.h) ───────────────── */
const CPP_SEED =
`#pragma once
#include <vector>
#include <utility>

/* 축 정렬 사각형(AABB) 충돌 판정. Day 를 따라가며 채웁니다. */
struct AABB {
    int x, y, w, h;
};

inline bool overlaps(const AABB &a, const AABB &b) {
    // TODO: Day 1
    return false;
}

/* 겹치는 쌍의 인덱스를 (작은 인덱스, 큰 인덱스) 로 모아 돌려준다. */
inline std::vector<std::pair<int, int>> collisions(const std::vector<AABB> &xs) {
    // TODO: Day 2
    return {};
}

/* a 를 b 밖으로 밀어낼 때 필요한 최소 이동 (dx, dy). 겹치지 않으면 (0, 0). */
inline std::pair<int, int> resolve(const AABB &a, const AABB &b) {
    // TODO: Day 3
    return {0, 0};
}
`;

const CPP_D1 =
`#pragma once
#include <vector>
#include <utility>
#include <cstdlib>

struct AABB {
    int x, y, w, h;
};

inline bool overlaps(const AABB &a, const AABB &b) {
    if (a.x + a.w <= b.x || b.x + b.w <= a.x) return false;
    if (a.y + a.h <= b.y || b.y + b.h <= a.y) return false;
    return true;
}

inline std::vector<std::pair<int, int>> collisions(const std::vector<AABB> &xs) {
    return {};
}

inline std::pair<int, int> resolve(const AABB &a, const AABB &b) {
    return {0, 0};
}
`;

const CPP_D2 = CPP_D1.replace(
`inline std::vector<std::pair<int, int>> collisions(const std::vector<AABB> &xs) {
    return {};
}`,
`inline std::vector<std::pair<int, int>> collisions(const std::vector<AABB> &xs) {
    std::vector<std::pair<int, int>> out;
    for (std::size_t i = 0; i < xs.size(); ++i)
        for (std::size_t j = i + 1; j < xs.size(); ++j)
            if (overlaps(xs[i], xs[j]))
                out.push_back({static_cast<int>(i), static_cast<int>(j)});
    return out;
}`);

const CPP_D3 = CPP_D2.replace(
`inline std::pair<int, int> resolve(const AABB &a, const AABB &b) {
    return {0, 0};
}`,
`inline std::pair<int, int> resolve(const AABB &a, const AABB &b) {
    if (!overlaps(a, b)) return {0, 0};
    int left = b.x - (a.x + a.w);
    int right = (b.x + b.w) - a.x;
    int up = b.y - (a.y + a.h);
    int down = (b.y + b.h) - a.y;
    int dx = std::abs(left) <= std::abs(right) ? left : right;
    int dy = std::abs(up) <= std::abs(down) ? up : down;
    if (std::abs(dx) <= std::abs(dy)) return {dx, 0};
    return {0, dy};
}`);

const CPP_T1 = `#include "catch.hpp"
#include "sol.h"

TEST_CASE("겹치는 사각형") {
    REQUIRE(overlaps({0, 0, 10, 10}, {5, 5, 10, 10}));
}

TEST_CASE("떨어진 사각형") {
    REQUIRE_FALSE(overlaps({0, 0, 10, 10}, {20, 0, 5, 5}));
    REQUIRE_FALSE(overlaps({0, 0, 10, 10}, {0, 20, 5, 5}));
}

TEST_CASE("변이 맞닿는 것은 충돌이 아니다") {
    REQUIRE_FALSE(overlaps({0, 0, 10, 10}, {10, 0, 10, 10}));
    REQUIRE_FALSE(overlaps({0, 0, 10, 10}, {0, 10, 10, 10}));
}

TEST_CASE("포함 관계도 충돌이다") {
    REQUIRE(overlaps({0, 0, 100, 100}, {10, 10, 5, 5}));
    REQUIRE(overlaps({10, 10, 5, 5}, {0, 0, 100, 100}));
}

TEST_CASE("한 축만 겹치면 충돌이 아니다") {
    REQUIRE_FALSE(overlaps({0, 0, 10, 10}, {5, 50, 10, 10}));
}
`;

const CPP_T2 = CPP_T1 + `
TEST_CASE("겹치는 쌍을 모은다") {
    std::vector<AABB> xs{{0, 0, 10, 10}, {5, 5, 10, 10}, {100, 100, 5, 5}};
    auto got = collisions(xs);
    REQUIRE(got.size() == 1);
    REQUIRE(got[0] == std::make_pair(0, 1));
}

TEST_CASE("겹치는 쌍이 없으면 빈 결과") {
    std::vector<AABB> xs{{0, 0, 1, 1}, {50, 50, 1, 1}};
    REQUIRE(collisions(xs).empty());
}

TEST_CASE("같은 쌍을 두 번 넣지 않는다") {
    std::vector<AABB> xs{{0, 0, 10, 10}, {1, 1, 2, 2}, {2, 2, 2, 2}};
    auto got = collisions(xs);
    REQUIRE(got.size() == 3);
    for (auto &p : got) REQUIRE(p.first < p.second);
}

TEST_CASE("원소가 하나거나 없으면 빈 결과") {
    REQUIRE(collisions({}).empty());
    REQUIRE(collisions({{0, 0, 1, 1}}).empty());
}
`;

const CPP_T3 = CPP_T2 + `
TEST_CASE("겹치지 않으면 움직이지 않는다") {
    REQUIRE(resolve({0, 0, 10, 10}, {50, 50, 10, 10}) == std::make_pair(0, 0));
}

TEST_CASE("가로로 조금 겹치면 가로로 민다") {
    auto d = resolve({8, 0, 10, 10}, {0, 0, 10, 10});
    REQUIRE(d.second == 0);
    REQUIRE(d.first == 2);
}

TEST_CASE("세로로 조금 겹치면 세로로 민다") {
    auto d = resolve({0, 8, 10, 10}, {0, 0, 10, 10});
    REQUIRE(d.first == 0);
    REQUIRE(d.second == 2);
}

TEST_CASE("밀어낸 뒤에는 겹치지 않는다") {
    AABB a{8, 6, 10, 10}, b{0, 0, 10, 10};
    auto d = resolve(a, b);
    AABB moved{a.x + d.first, a.y + d.second, a.w, a.h};
    REQUIRE_FALSE(overlaps(moved, b));
}
`;

/* ───────────────── Rust — 설정 파서 (src/lib.rs) ───────────────── */
const RS_SEED =
`use std::collections::HashMap;

/// 설정 파일 파서. Day 를 따라가며 채웁니다.
#[derive(Debug, PartialEq)]
pub enum ConfError {
    Malformed(usize),
    NotFound,
    BadType,
}

/// "key = value" 한 줄을 (키, 값) 으로 자른다. 주석(#)과 빈 줄은 None.
pub fn parse_line(_s: &str) -> Option<(String, String)> {
    // TODO: Day 1
    None
}

/// 여러 줄을 읽어 맵으로 만든다. 형식이 틀린 줄은 그 줄 번호(0부터)와 함께 에러.
pub fn parse(_lines: &[&str]) -> Result<HashMap<String, String>, ConfError> {
    // TODO: Day 2
    Ok(HashMap::new())
}

/// 정수 설정을 읽는다. 없으면 NotFound, 숫자가 아니면 BadType.
pub fn get_int(_cfg: &HashMap<String, String>, _key: &str) -> Result<i64, ConfError> {
    // TODO: Day 3
    Err(ConfError::NotFound)
}
`;

const RS_D1 =
`use std::collections::HashMap;

#[derive(Debug, PartialEq)]
pub enum ConfError {
    Malformed(usize),
    NotFound,
    BadType,
}

pub fn parse_line(s: &str) -> Option<(String, String)> {
    let t = s.trim();
    if t.is_empty() || t.starts_with('#') {
        return None;
    }
    let (k, v) = t.split_once('=')?;
    Some((k.trim().to_string(), v.trim().to_string()))
}

pub fn parse(_lines: &[&str]) -> Result<HashMap<String, String>, ConfError> {
    Ok(HashMap::new())
}

pub fn get_int(_cfg: &HashMap<String, String>, _key: &str) -> Result<i64, ConfError> {
    Err(ConfError::NotFound)
}
`;

const RS_D2 = RS_D1.replace(
`pub fn parse(_lines: &[&str]) -> Result<HashMap<String, String>, ConfError> {
    Ok(HashMap::new())
}`,
`pub fn parse(lines: &[&str]) -> Result<HashMap<String, String>, ConfError> {
    let mut out = HashMap::new();
    for (i, line) in lines.iter().enumerate() {
        let t = line.trim();
        if t.is_empty() || t.starts_with('#') {
            continue;
        }
        match parse_line(line) {
            Some((k, v)) if !k.is_empty() => {
                out.insert(k, v);
            }
            _ => return Err(ConfError::Malformed(i)),
        }
    }
    Ok(out)
}`);

const RS_D3 = RS_D2.replace(
`pub fn get_int(_cfg: &HashMap<String, String>, _key: &str) -> Result<i64, ConfError> {
    Err(ConfError::NotFound)
}`,
`pub fn get_int(cfg: &HashMap<String, String>, key: &str) -> Result<i64, ConfError> {
    let raw = cfg.get(key).ok_or(ConfError::NotFound)?;
    raw.parse::<i64>().map_err(|_| ConfError::BadType)
}`);

const RS_T1 = `use confparse::parse_line;

#[test]
fn splits_key_and_value() {
    assert_eq!(parse_line("port = 8080"), Some(("port".to_string(), "8080".to_string())));
}

#[test]
fn trims_spaces() {
    assert_eq!(parse_line("   host=localhost   "), Some(("host".to_string(), "localhost".to_string())));
}

#[test]
fn skips_comments_and_blanks() {
    assert_eq!(parse_line("# 주석"), None);
    assert_eq!(parse_line(""), None);
    assert_eq!(parse_line("    "), None);
}

#[test]
fn no_equals_is_none() {
    assert_eq!(parse_line("justtext"), None);
}

#[test]
fn value_may_contain_equals() {
    assert_eq!(parse_line("url = a=b"), Some(("url".to_string(), "a=b".to_string())));
}
`;

const RS_T2 = `use confparse::{parse, parse_line, ConfError};

#[test]
fn splits_key_and_value() {
    assert_eq!(parse_line("port = 8080"), Some(("port".to_string(), "8080".to_string())));
}

#[test]
fn trims_spaces() {
    assert_eq!(parse_line("   host=localhost   "), Some(("host".to_string(), "localhost".to_string())));
}

#[test]
fn skips_comments_and_blanks() {
    assert_eq!(parse_line("# 주석"), None);
    assert_eq!(parse_line(""), None);
    assert_eq!(parse_line("    "), None);
}

#[test]
fn no_equals_is_none() {
    assert_eq!(parse_line("justtext"), None);
}

#[test]
fn value_may_contain_equals() {
    assert_eq!(parse_line("url = a=b"), Some(("url".to_string(), "a=b".to_string())));
}

#[test]
fn builds_map() {
    let cfg = parse(&["port = 80", "host = local"]).unwrap();
    assert_eq!(cfg.get("port"), Some(&"80".to_string()));
    assert_eq!(cfg.len(), 2);
}

#[test]
fn ignores_comments_and_blanks() {
    let cfg = parse(&["# c", "", "port = 80"]).unwrap();
    assert_eq!(cfg.len(), 1);
}

#[test]
fn last_key_wins() {
    let cfg = parse(&["port = 80", "port = 90"]).unwrap();
    assert_eq!(cfg.get("port"), Some(&"90".to_string()));
}

#[test]
fn malformed_reports_line_number() {
    assert_eq!(parse(&["ok = 1", "이건 아니다"]), Err(ConfError::Malformed(1)));
    assert_eq!(parse(&["= 1"]), Err(ConfError::Malformed(0)));
}
`;

const RS_T3 = RS_T2.replace("use confparse::{parse, parse_line, ConfError};",
                            "use confparse::{get_int, parse, parse_line, ConfError};") + `
#[test]
fn reads_int() {
    let cfg = parse(&["port = 8080"]).unwrap();
    assert_eq!(get_int(&cfg, "port"), Ok(8080));
}

#[test]
fn missing_key_is_not_found() {
    let cfg = parse(&["port = 80"]).unwrap();
    assert_eq!(get_int(&cfg, "nope"), Err(ConfError::NotFound));
}

#[test]
fn non_numeric_is_bad_type() {
    let cfg = parse(&["port = abc"]).unwrap();
    assert_eq!(get_int(&cfg, "port"), Err(ConfError::BadType));
}

#[test]
fn negative_and_zero() {
    let cfg = parse(&["a = -5", "b = 0"]).unwrap();
    assert_eq!(get_int(&cfg, "a"), Ok(-5));
    assert_eq!(get_int(&cfg, "b"), Ok(0));
}
`;

module.exports = {
  projects: [
    { id:"sensorlog", lang:"c", mainFile:"sol.c", srcName:"sol.c",
      em:"🌡", title:"C — 센서 링 버퍼 로거",
      sub:"고정 메모리로 최근 8개를 유지하고 통계를 낸다. 실제 gcc 가 채점합니다",
      brief:"파일 하나(sol.c)를 3일에 걸쳐 키웁니다. 할당은 없습니다 — 배열 8칸이 전부이고, 그 안에서 감기(wrap)와 합계 유지를 직접 다뤄야 합니다. 채점은 로컬 러너의 진짜 gcc 가 sol.c 와 test.c 를 함께 빌드해 실행합니다.",
      contract:"sol.c 는 Log 구조체(buf·head·count·total)와 log_init·log_push·log_avg·log_spikes 를 제공해야 합니다. 구조체 필드 이름은 테스트가 직접 읽으므로 바꾸면 안 됩니다.",
      seed:{ "sol.c": C_SEED },
      days:[
        { n:1, title:"링 버퍼에 담기",
          req:["log_init 은 head·count·total 을 0 으로 만든다.",
               "log_push 는 값을 넣고 count 와 total 을 갱신한다.",
               "8개를 넘으면 가장 오래된 값을 밀어내고 count 는 8 로 유지된다.",
               "밀려난 값은 total 에서도 빠져야 한다."],
          hint:"total 을 매번 다시 더하지 말고 증분으로 유지하세요 — 나갈 값을 빼고 들어올 값을 더하면 O(1) 입니다. 가득 찼을 때 head 가 가리키는 칸이 바로 '가장 오래된 값' 입니다. 그 칸을 덮어쓰기 전에 빼야 합니다.",
          tests:[{n:"초기화된다"},{n:"값을 담고 합계를 유지한다"},{n:"8개를 넘으면 밀어낸다"},{n:"밀려난 값이 합계에서 빠진다"}],
          rt:{ label:"gcc + test.c", test:{ "test.c": C_T1 } } },
        { n:2, title:"이동 평균",
          req:["log_avg 는 담긴 값들의 평균(정수 내림)을 돌려준다.",
               "비어 있으면 0 을 돌려준다(0으로 나누지 않는다).",
               "가득 차기 전에는 지금까지 담긴 개수로 나눈다.",
               "Day 1 의 요구사항도 계속 만족해야 한다."],
          hint:"분모를 8 로 고정하면 초반 값이 실제보다 낮게 나옵니다 — 전원을 켠 직후 센서가 '낮게' 읽히는 미스터리의 정체가 대개 이것입니다. count 로 나누세요.",
          tests:[{n:"빈 버퍼는 0"},{n:"두 값의 평균"},{n:"정수 내림"},{n:"가득 찬 뒤의 평균"}],
          rt:{ label:"gcc + test.c", test:{ "test.c": C_T2 } } },
        { n:3, title:"임계 초과 세기",
          req:["log_spikes 는 담긴 값 중 threshold 이상인 개수를 센다.",
               "밀려난(사라진) 값은 세지 않는다.",
               "비어 있으면 0 이다.",
               "Day 1·2 의 요구사항도 계속 만족해야 한다."],
          hint:"버퍼를 0..count 로 훑으면 감긴 경우에 틀립니다 — 가장 오래된 칸이 어디인지부터 계산하세요. head 에서 count 만큼 되돌아간 자리이며, 음수가 되지 않도록 8 을 더해 나머지를 취하면 안전합니다.",
          tests:[{n:"빈 버퍼는 0"},{n:"임계 이상만 센다"},{n:"임계가 높으면 0"},{n:"감긴 뒤에도 정확하다"}],
          rt:{ label:"gcc + test.c", test:{ "test.c": C_T3 } } },
      ] },

    { id:"aabb", lang:"cpp", mainFile:"sol.h", srcName:"sol.h",
      em:"🎮", title:"C++ — 충돌 판정",
      sub:"AABB 겹침 → 쌍 찾기 → 밀어내기. 실제 g++ 와 catch2 가 채점합니다",
      brief:"게임 물리의 가장 기본인 축 정렬 사각형(AABB) 충돌을 3일에 걸쳐 만듭니다. 경계가 맞닿았을 때를 충돌로 볼지, 밀어낼 때 어느 축으로 밀지 — 두 가지 결정이 이 프로젝트의 진짜 주제입니다. 채점은 로컬 러너의 g++ 와 catch2 가 합니다.",
      contract:"sol.h 는 struct AABB{x,y,w,h} 와 overlaps·collisions·resolve 를 제공해야 합니다. 테스트가 헤더를 include 하므로 함수는 inline 이거나 템플릿이어야 합니다.",
      seed:{ "sol.h": CPP_SEED },
      days:[
        { n:1, title:"겹치는가",
          req:["overlaps 는 두 사각형이 겹치면 true 를 돌려준다.",
               "떨어져 있으면 false 다.",
               "변이 정확히 맞닿기만 하면 충돌이 아니다.",
               "한쪽이 다른 쪽을 완전히 품어도 충돌이다.",
               "한 축만 겹치면 충돌이 아니다."],
          hint:"'겹친다' 를 직접 검사하는 것보다 '<b>겹치지 않는 경우</b>' 를 먼저 배제하는 편이 훨씬 짧습니다 — 한 축에서라도 완전히 떨어져 있으면 겹칠 수 없습니다. 맞닿음을 충돌로 볼지는 <= 와 < 한 글자로 갈립니다.",
          tests:[{n:"겹치면 true"},{n:"떨어지면 false"},{n:"맞닿음은 충돌 아님"},{n:"포함 관계도 충돌"},{n:"한 축만 겹치면 false"}],
          rt:{ label:"g++ + catch2", test:{ "test.cpp": CPP_T1 } } },
        { n:2, title:"겹치는 쌍 모으기",
          req:["collisions 는 겹치는 모든 쌍의 인덱스를 돌려준다.",
               "각 쌍은 (작은 인덱스, 큰 인덱스) 이며 같은 쌍이 두 번 나오지 않는다.",
               "겹치는 쌍이 없으면 빈 결과다.",
               "원소가 하나 이하면 빈 결과다.",
               "Day 1 의 요구사항도 계속 만족해야 한다."],
          hint:"이중 루프에서 안쪽을 i+1 부터 돌리면 같은 쌍을 두 번 검사하지 않고 (작은, 큰) 순서도 공짜로 얻습니다. 자기 자신과의 비교도 자연히 빠집니다.",
          tests:[{n:"겹치는 쌍을 찾는다"},{n:"없으면 빈 결과"},{n:"쌍이 중복되지 않는다"},{n:"원소가 하나 이하"}],
          rt:{ label:"g++ + catch2", test:{ "test.cpp": CPP_T2 } } },
        { n:3, title:"밀어내기",
          req:["resolve 는 a 를 b 밖으로 밀 최소 이동 (dx, dy) 를 돌려준다.",
               "겹치지 않으면 (0, 0) 이다.",
               "한 축으로만 민다 — 이동량이 작은 축을 고른다.",
               "밀어낸 뒤에는 두 사각형이 겹치지 않아야 한다.",
               "Day 1·2 의 요구사항도 계속 만족해야 한다."],
          hint:"각 축마다 '왼쪽으로 빼기'와 '오른쪽으로 빼기' 두 후보가 있고, 그중 절댓값이 작은 쪽이 그 축의 최소 이동입니다. 네 후보 중 가장 작은 하나만 적용하면 물체가 자연스럽게 미끄러집니다 — 두 축을 동시에 적용하면 대각선으로 튀어 버립니다.",
          tests:[{n:"겹치지 않으면 이동 없음"},{n:"가로로 민다"},{n:"세로로 민다"},{n:"민 뒤에는 겹치지 않는다"}],
          rt:{ label:"g++ + catch2", test:{ "test.cpp": CPP_T3 } } },
      ] },

    { id:"confparse", lang:"rust", mainFile:"src/lib.rs",
      em:"🦀", title:"Rust — 설정 파서",
      sub:"한 줄 파싱 → 맵 구성 → 타입 변환. 실제 cargo test 가 채점합니다",
      brief:"설정 파일 파서를 3일에 걸쳐 만듭니다. 러스트답게 실패를 전부 타입으로 표현합니다 — '없음'은 Option, '틀림'은 Result, 그리고 어떤 방식으로 틀렸는지는 열거형이 담습니다. 채점은 로컬 러너의 진짜 cargo test 가 합니다.",
      contract:"src/lib.rs 는 크레이트 ex 로 빌드되며 parse_line·parse·get_int 과 ConfError 를 pub 으로 내보내야 합니다. 외부 크레이트는 쓸 수 없습니다(오프라인 빌드).",
      seed:{ "src/lib.rs": RS_SEED },
      days:[
        { n:1, title:"한 줄 자르기",
          req:["parse_line 은 \"key = value\" 를 (키, 값) 으로 자르고 공백을 다듬는다.",
               "주석(#으로 시작)과 빈 줄은 None 이다.",
               "= 가 없으면 None 이다.",
               "값 안의 = 는 값의 일부다(첫 = 에서만 자른다)."],
          hint:"split_once 는 첫 구분자에서 한 번만 자르고 Option 을 돌려줍니다 — ? 연산자와 잘 맞습니다. split('=') 로 나누면 값 안의 = 에서 조각이 늘어나 요구사항이 깨집니다.",
          tests:[{n:"키와 값을 자른다"},{n:"공백을 다듬는다"},{n:"주석·빈 줄은 None"},{n:"= 없으면 None"},{n:"값 안의 = 는 유지"}],
          rt:{ label:"cargo test", test:{ "sol.rs": RS_T1 } } },
        { n:2, title:"맵으로 모으기",
          req:["parse 는 여러 줄을 읽어 HashMap 을 만든다.",
               "주석과 빈 줄은 건너뛴다.",
               "같은 키가 두 번 나오면 마지막 값이 이긴다.",
               "형식이 틀린 줄이 있으면 그 줄 번호(0부터)를 담은 Malformed 에러다.",
               "Day 1 의 요구사항도 계속 만족해야 한다."],
          hint:"'건너뛸 줄'과 '틀린 줄'을 구분해야 합니다 — 둘 다 parse_line 이 None 을 주기 때문에, 주석·빈 줄인지 먼저 확인한 뒤 나머지 None 을 에러로 처리하세요. 키가 빈 문자열인 경우(= 로 시작)도 틀린 줄입니다.",
          tests:[{n:"맵을 만든다"},{n:"주석·빈 줄을 건너뛴다"},{n:"마지막 키가 이긴다"},{n:"틀린 줄 번호를 담는다"}],
          rt:{ label:"cargo test", test:{ "sol.rs": RS_T2 } } },
        { n:3, title:"타입 변환",
          req:["get_int 는 설정값을 i64 로 읽는다.",
               "키가 없으면 NotFound 다.",
               "숫자가 아니면 BadType 이다.",
               "음수와 0 도 올바르게 읽는다.",
               "Day 1·2 의 요구사항도 계속 만족해야 한다."],
          hint:"ok_or 는 Option 을 Result 로, map_err 는 에러 타입을 바꿔 줍니다. 이 둘과 ? 를 엮으면 세 줄이면 끝납니다 — unwrap 을 쓰면 설정 파일의 오타 하나가 프로세스를 죽입니다.",
          tests:[{n:"정수를 읽는다"},{n:"없으면 NotFound"},{n:"숫자가 아니면 BadType"},{n:"음수와 0"}],
          rt:{ label:"cargo test", test:{ "sol.rs": RS_T3 } } },
      ] },
  ],
  sol: {
    sensorlog: [ {"sol.c": C_D1}, {"sol.c": C_D2}, {"sol.c": C_D3} ],
    aabb: [ {"sol.h": CPP_D1}, {"sol.h": CPP_D2}, {"sol.h": CPP_D3} ],
    confparse: [ {"src/lib.rs": RS_D1}, {"src/lib.rs": RS_D2}, {"src/lib.rs": RS_D3} ],
  },
};
