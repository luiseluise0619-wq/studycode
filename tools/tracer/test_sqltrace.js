/* SQL 추적기 검증 — 진짜 SQLite 로 확인한다.

   파이썬 추적기와 달리 이건 이 샌드박스에서 끝까지 돌릴 수 있다.
   sql.js 는 CDN 이 아니라 저장소 안에 있기 때문이다 (data/sql-wasm.js 에 wasm 이 base64 로).

     node tools/tracer/test_sqltrace.js */
global.window = global; global.self = global;
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
require(path.join(ROOT, "data", "sql-wasm.js"));
const lib = require(path.join(ROOT, "data", "sql-lib.js"));
global.initSqlJs = lib.default || lib;
const { traceSql } = require("./sqltrace.js");
const { check } = require("./schema.cjs");

const FAIL = [];
function ok(cond, name, extra) {
  if (cond) console.log("  ✓ " + name);
  else { FAIL.push(name); console.log("  ✗ " + name + (extra !== undefined ? "  " + JSON.stringify(extra) : "")); }
}
const ev = (r, k) => r.events.filter(e => e.e === k);
const steps = r => r.events.filter(e => e.e === "step");
const rows = (r, op) => ev(r, "row").filter(e => e.op === op);

const SCHEMA = `create table 회원(id integer primary key, 이름 text, 등급 text);
insert into 회원 values (1,'가','일반'),(2,'나','우수'),(3,'다','일반');
create table 주문(id integer primary key, 회원 int, 금액 int);
insert into 주문 values (1,1,1000),(2,1,2000),(3,2,500);`;

window.ensureSql().then(SQL => {
  const T = (sql, opts) => traceSql(SQL, SCHEMA, sql, Object.assign({ now: 1 }, opts));

  console.log("기본 SELECT");
  let r = T("select 이름 from 회원 where 등급='일반';");
  ok(r.err === null, "오류 없이 끝난다", r.err);
  ok(r.lang === "sql" && r.v === 1, "언어와 스키마 버전");
  ok(rows(r, "scan").length === 2, "조건에 맞는 2행이 나온다", rows(r, "scan").length);
  ok(steps(r)[0].fn === "SELECT" && steps(r)[0].d === 0, "첫 단계는 문장 자체", steps(r)[0]);
  ok(steps(r).slice(1).every(s => s.d === 1), "행 단계는 문장 안쪽(깊이 1)");
  ok(rows(r, "scan")[0].to.k === "dict", "행은 dict 모양 — 뷰는 SQL 인 줄 모른다");
  ok(rows(r, "scan")[0].to.v[0][1] === "'가'", "값이 담긴다", rows(r, "scan")[0].to.v);

  console.log("\n행이 하나씩 나온다 (슬라이더로 넘길 수 있어야 한다)");
  r = T("select id from 회원;");
  const rowSteps = steps(r).filter(s => /^행 /.test(s.fn));
  ok(rowSteps.length === 3, "행 수만큼 단계가 생긴다", rowSteps.length);
  ok(rowSteps.map(s => s.fn).join(",") === "행 1,행 2,행 3", "행 번호가 순서대로", rowSteps.map(s => s.fn));

  console.log("\n결과가 없을 때");
  r = T("select * from 회원 where 등급='없음';");
  ok(rows(r, "scan").length === 0, "행 이벤트가 없다");
  ok(steps(r).some(s => s.fn === "행 없음"), "'행 없음' 단계로 알린다", steps(r).map(s => s.fn));

  console.log("\nJOIN — 한 사람이 여러 번 나오는 것이 눈에 보여야 한다");
  r = T("select 회원.이름, 주문.금액 from 회원 join 주문 on 주문.회원=회원.id;");
  const names = rows(r, "scan").map(e => e.to.v[0][1]);
  ok(names.length === 3, "결과는 주문 수만큼 3행 (회원은 3명이지만 같은 수가 아니다)", names);
  ok(names.filter(x => x === "'가'").length === 2,
     "주문이 2건인 '가' 는 결과에 2번 나온다 — JOIN 이 행을 늘린다", names);
  ok(!names.includes("'다'"), "주문이 없는 '다' 는 결과에서 사라진다", names);

  console.log("\nINSERT · UPDATE · DELETE — 표 변화");
  r = T("insert into 회원 values (4,'라','우수');");
  ok(rows(r, "ins").length === 1, "새 행 하나", ev(r, "row"));
  ok(rows(r, "ins")[0].table === "회원", "어느 표인지 남는다");

  r = T("update 회원 set 등급='우수' where id=1;");
  ok(rows(r, "upd").length === 1, "수정은 upd 하나다 (지우고 넣기가 아니다)", ev(r, "row").map(e => e.op));
  ok(rows(r, "upd")[0].from && rows(r, "upd")[0].to, "무엇이 무엇으로 바뀌었는지 둘 다 남는다");
  ok(JSON.stringify(rows(r, "upd")[0].from.v).includes("일반") &&
     JSON.stringify(rows(r, "upd")[0].to.v).includes("우수"), "일반 → 우수",
     [rows(r, "upd")[0].from.v, rows(r, "upd")[0].to.v]);

  r = T("delete from 회원 where 등급='일반';");
  ok(rows(r, "del").length === 2, "두 행이 사라진다", rows(r, "del").length);

  console.log("\n여러 문장 — 문장마다 단계가 열린다");
  r = T("insert into 회원 values (9,'구','일반');\nselect count(*) from 회원;");
  const kinds = steps(r).filter(s => s.d === 0).map(s => s.fn);
  ok(kinds.join(",") === "INSERT,SELECT", "문장 종류가 순서대로", kinds);
  const lines = steps(r).filter(s => s.d === 0).map(s => s.line);
  ok(lines[0] === 1 && lines[1] === 2, "줄 번호가 맞는다", lines);
  ok(rows(r, "ins").length === 1 && rows(r, "scan").length === 1, "각 문장의 효과가 따로 남는다");

  console.log("\n실행 계획을 함께 보여 준다");
  r = T("select * from 회원 where 이름='가';");
  ok(ev(r, "out").some(e => /SCAN|SEARCH/.test(e.text)), "인덱스를 쓰는지 훑는지 남는다",
     ev(r, "out").map(e => e.text));

  console.log("\n오류");
  r = T("select * from 없는표;");
  ok(r.err && r.err.type === "SQLError", "오류를 잡는다", r.err);
  ok(ev(r, "throw").length === 1, "throw 이벤트가 남는다");
  ok(/없는표/.test(r.err.msg), "무엇이 없는지 말한다", r.err.msg);

  r = T("insert into 회원 values (1,'중복','일반');");
  ok(r.err && /UNIQUE|constraint/i.test(r.err.msg), "제약 위반도 잡는다", r.err && r.err.msg);

  r = T("select 1; select * from 없는표; select 2;");
  ok(rows(r, "scan").length === 1, "오류 앞까지는 기록이 남는다", rows(r, "scan").length);

  console.log("\n상한");
  r = T("with recursive n(i) as (select 1 union all select i+1 from n where i<5000) select i from n;",
        { maxSteps: 300 });
  ok(r.cut === true, "상한에서 잘린다");
  ok(r.steps <= 300, "상한을 넘지 않는다", r.steps);
  const size = Buffer.byteLength(JSON.stringify(r));
  ok(size < 200 * 1024, "300단계가 200KB 미만", (size / 1024 | 0) + "KB");

  console.log("\nNULL 과 이상한 값");
  r = T("create table t2(a); insert into t2 values (null),(1.5),('x');\nselect * from t2;");
  const vs = rows(r, "scan").map(e => e.to.v[0][1]);
  ok(vs.join(",") === "NULL,1.5,'x'", "NULL 이 빈칸이 아니라 NULL 로 보인다", vs);

  console.log("\n무대 장치(schema)는 추적하지 않는다");
  r = T("select 1;");
  ok(rows(r, "ins").length === 0, "미리 깔아 둔 표의 행이 새로 들어온 것처럼 보이지 않는다",
     ev(r, "row").length);

  console.log("\n스키마 적합성 (검증기)");
  const CASES = ["select * from 회원;", "update 회원 set 등급='x';", "delete from 주문;",
                 "select * from 없는표;", "insert into 주문 values (9,1,1);\nselect * from 주문;",
                 "select 회원.이름, 주문.금액 from 회원 join 주문 on 주문.회원=회원.id order by 금액;"];
  let bad = 0;
  CASES.forEach((c, i) => {
    const errs = check(T(c));
    if (errs.length) { bad++; console.log("  ✗ 사례 " + i + ": " + errs.slice(0, 3).join(" / ")); }
  });
  ok(bad === 0, CASES.length + "개 봉투가 모두 스키마 v1 을 통과한다");

  console.log("\n" + (FAIL.length ? FAIL.length + "건 실패: " + FAIL.join(", ") : "전부 통과"));
  process.exit(FAIL.length ? 1 : 0);
}).catch(e => { console.log("SQL 엔진을 불러오지 못했습니다 — " + e.message); process.exit(2); });
