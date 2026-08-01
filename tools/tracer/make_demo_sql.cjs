/* 재생 뷰어가 쓸 SQL 예제 트레이스를 만든다.

   파이썬 예제와 같은 이유로 미리 만들어 둔다 — 예제를 보려고 870KB 짜리
   sql.js 를 먼저 받게 하면 아무도 안 본다. '내 쿼리로 해보기' 를 눌렀을 때만 받는다.

   예제는 '초보자가 여기서 막힌다' 를 기준으로 골랐다. 문법 소개가 아니다.

     node tools/tracer/make_demo_sql.cjs */
global.window = global; global.self = global;
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
require(path.join(ROOT, "data", "sql-wasm.js"));
const lib = require(path.join(ROOT, "data", "sql-lib.js"));
global.initSqlJs = lib.default || lib;
const { traceSql } = require("./sqltrace.js");
const { check } = require("./schema.cjs");

const 가게 = `create table 회원(id integer primary key, 이름 text, 도시 text);
insert into 회원 values (1,'가영','서울'),(2,'나연','부산'),(3,'다솜','서울');
create table 주문(id integer primary key, 회원 int, 금액 int);
insert into 주문 values (1,1,10000),(2,1,5000),(3,2,8000);`;

const 점수 = `create table 시험(이름 text, 점수 int);
insert into 시험 values ('가영',90),('나연',NULL),('다솜',70);`;

const DEMOS = [
  {
    id: "join",
    title: "회원은 3명인데 결과는 왜 3행이 아닌가",
    hint: "가영은 주문이 2건입니다. 행이 하나씩 나오는 걸 보면 왜 가영이 두 번 나오는지 보입니다.",
    schema: 가게,
    src: "select 회원.이름, 주문.금액\nfrom 회원\njoin 주문 on 주문.회원 = 회원.id;",
  },
  {
    id: "inner",
    title: "주문 없는 회원이 사라지는 곳",
    hint: "같은 뜻처럼 보이는 두 질의입니다. 다솜은 주문이 없습니다 — 어느 쪽에 다솜이 나오는지 세어 보세요.",
    schema: 가게,
    src: "select 회원.이름 from 회원\njoin 주문 on 주문.회원 = 회원.id;\n\n"
       + "select 회원.이름 from 회원\nleft join 주문 on 주문.회원 = 회원.id;",
  },
  {
    id: "null",
    title: "NULL 은 = 으로 찾아지지 않는다",
    hint: "나연의 점수는 NULL 입니다. 첫 질의는 0행, 둘째는 1행이 나옵니다. 같은 걸 찾는데 결과가 다릅니다.",
    schema: 점수,
    src: "select * from 시험 where 점수 = NULL;\nselect * from 시험 where 점수 is NULL;",
  },
  {
    id: "count",
    title: "COUNT(*) 와 COUNT(열) 이 다른 이유",
    hint: "3명인데 하나는 3, 하나는 2가 나옵니다. NULL 을 세는지 안 세는지의 차이입니다.",
    schema: 점수,
    src: "select count(*) as 전체, count(점수) as 점수있음\nfrom 시험;",
  },
  {
    id: "update",
    title: "WHERE 를 빼면 전부 바뀐다",
    hint: "표 변화를 보세요. 한 명만 바꾸려던 것이 세 명 전부 바뀝니다. 되돌릴 수 없는 실수입니다.",
    schema: 가게,
    src: "update 회원 set 도시 = '제주';",
  },
  {
    id: "having",
    title: "WHERE 는 묶기 전, HAVING 은 묶은 뒤",
    hint: "묶은 결과를 걸러야 할 때 WHERE 를 쓰면 안 됩니다. 나온 행이 몇 개인지 세어 보세요.",
    schema: 가게,
    src: "select 회원, sum(금액) as 합계\nfrom 주문\ngroup by 회원\nhaving sum(금액) > 9000;",
  },
];

window.ensureSql().then(SQL => {
  const out = [];
  let bad = 0;
  DEMOS.forEach(d => {
    const env = traceSql(SQL, d.schema, d.src, { runId: "demo-sql-" + d.id, now: 1 });
    env.ctx = { demo: d.id };
    const errs = check(env);
    if (errs.length) { bad++; console.log("  ✗ " + d.id + " — " + errs.slice(0, 2).join(" / ")); }
    if (env.err) { bad++; console.log("  ✗ " + d.id + " — 실행 오류: " + env.err.msg); }
    const scan = env.events.filter(e => e.e === "row" && e.op === "scan").length;
    const chg = env.events.filter(e => e.e === "row" && e.op !== "scan").length;
    console.log("  " + d.id.padEnd(8) + "단계 " + String(env.steps).padStart(2)
      + " · 나온 행 " + scan + " · 표 변화 " + chg);
    out.push({ id: d.id, title: d.title, hint: d.hint, env: env });
  });
  if (bad) { console.log("\n" + bad + "건 문제 — 쓰지 않는다"); process.exit(1); }

  const body = JSON.stringify(out);
  fs.writeFileSync(path.join(ROOT, "data", "trace-demo-sql.js"),
    "/* 자동 생성 — tools/tracer/make_demo_sql.cjs 를 돌려 만든다.\n"
    + "   sql.js(870KB)를 받지 않고도 SQL 재생 예제를 보여 주기 위한 것이다. */\n"
    + "__CR('traceDemoSql', " + body + ");\n");
  console.log("\ndata/trace-demo-sql.js · " + Math.round(Buffer.byteLength(body) / 1024) + "KB");
}).catch(e => { console.log("SQL 엔진을 불러오지 못했습니다 — " + e.message); process.exit(2); });
