/* 새 빌드 랩 — 로그 집계 파이프라인 5일.
   기존 3개(주문 API·URL 단축·배달 주문)는 전부 HTTP 핸들러였다. 이건 데이터 처리 쪽이라
   파싱·집계·백분위·시간 창·경보라는 다른 근육을 쓴다.
   파일은 Day 사이에 남으므로 어제 만든 모듈 위에 오늘을 얹는다. */

/* ── 참조 구현 (Day 별 누적) ─────────────────────────────── */
const PARSE_JS = `const RE = /^(\\S+)\\s+(\\w+)\\s+(\\d+)ms\\s+(GET|POST|PUT|PATCH|DELETE)\\s+(\\S+)\\s+(\\d{3})$/;

function parseLine(line) {
  const m = RE.exec(String(line).trim());
  if (!m) return null;
  return {
    ts: m[1],
    level: m[2],
    ms: Number(m[3]),
    method: m[4],
    path: m[5],
    status: Number(m[6]),
  };
}

function parse(text) {
  return String(text)
    .split('\\n')
    .map((l) => l.trim())
    .filter((l) => l && l[0] !== '#')
    .map(parseLine)
    .filter((e) => e !== null);
}

module.exports = { parseLine, parse };
`;

const STATS2_JS = `function summarize(events) {
  const byStatus = {};
  const byPath = {};
  let errors = 0;
  events.forEach((e) => {
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    byPath[e.path] = (byPath[e.path] || 0) + 1;
    if (e.status >= 500) errors += 1;
  });
  return {
    count: events.length,
    byStatus,
    byPath,
    errorRate: events.length ? errors / events.length : 0,
  };
}

module.exports = { summarize };
`;

/* Day3 에서 percentile 이 추가된다 — Day2 파일에 미리 넣으면 Day3 이 '시작하자마자 통과' 가 된다 */
const STATS_JS = STATS2_JS.replace(
  "module.exports = { summarize };",
  `function percentile(nums, p) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1];
}

module.exports = { summarize, percentile };`);

const WINDOW_JS = `const { summarize, percentile } = require('./stats');

function bucket(events, sec) {
  const groups = new Map();
  events.forEach((e) => {
    const t = Math.floor(Date.parse(e.ts) / 1000);
    const start = Math.floor(t / sec) * sec;
    if (!groups.has(start)) groups.set(start, []);
    groups.get(start).push(e);
  });
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .map((start) => {
      const list = groups.get(start);
      const s = summarize(list);
      return { start, count: s.count, errorRate: s.errorRate, p95: percentile(list.map((e) => e.ms), 95) };
    });
}

module.exports = { bucket };
`;

const REPORT_JS = `const { parse } = require('./parse');
const { summarize, percentile } = require('./stats');

function byPathP95(events) {
  const g = {};
  events.forEach((e) => { (g[e.path] = g[e.path] || []).push(e.ms); });
  return Object.keys(g).map((p) => ({ path: p, p95: percentile(g[p], 95) }));
}

function report(text, opts) {
  const o = opts || {};
  const events = parse(text);
  const s = summarize(events);
  const slow = byPathP95(events).sort((a, b) => b.p95 - a.p95 || (a.path < b.path ? -1 : 1));
  const top = Object.keys(s.byPath)
    .map((p) => ({ path: p, count: s.byPath[p] }))
    .sort((a, b) => b.count - a.count || (a.path < b.path ? -1 : 1));
  const alerts = [];
  if (o.slaMs != null) {
    slow.filter((x) => x.p95 > o.slaMs).forEach((x) => alerts.push({ type: 'slow', path: x.path, p95: x.p95 }));
  }
  if (o.maxErrorRate != null && s.errorRate > o.maxErrorRate) {
    alerts.push({ type: 'errors', rate: s.errorRate });
  }
  return { total: s.count, errorRate: s.errorRate, slowest: slow, topPaths: top, alerts };
}

module.exports = { report };
`;

const appJs = (parts) => {
  const req = [];
  const exp = [];
  if (parts.includes("parse")) { req.push("const parse = require('./parse');"); exp.push("...parse"); }
  if (parts.includes("stats")) { req.push("const stats = require('./stats');"); exp.push("...stats"); }
  if (parts.includes("window")) { req.push("const win = require('./window');"); exp.push("...win"); }
  if (parts.includes("report")) { req.push("const report = require('./report');"); exp.push("...report"); }
  return req.join("\n") + "\n\nmodule.exports = { " + exp.join(", ") + " };\n";
};

const SOL = [
  { "app.js": appJs(["parse"]), "parse.js": PARSE_JS },
  { "app.js": appJs(["parse","stats"]), "parse.js": PARSE_JS, "stats.js": STATS2_JS },
  { "app.js": appJs(["parse","stats"]), "parse.js": PARSE_JS, "stats.js": STATS_JS },
  { "app.js": appJs(["parse","stats","window"]), "parse.js": PARSE_JS, "stats.js": STATS_JS, "window.js": WINDOW_JS },
  { "app.js": appJs(["parse","stats","window","report"]), "parse.js": PARSE_JS, "stats.js": STATS_JS, "window.js": WINDOW_JS, "report.js": REPORT_JS },
];

const L = (ts, lvl, ms, m, p, st) => `${ts} ${lvl} ${ms}ms ${m} ${p} ${st}`;
const SAMPLE = [
  L("2024-03-01T10:00:00Z","INFO",120,"GET","/a",200),
  L("2024-03-01T10:00:30Z","INFO",300,"GET","/a",200),
  L("2024-03-01T10:01:10Z","ERROR",900,"POST","/b",500),
  L("2024-03-01T10:01:40Z","INFO",50,"GET","/a",404),
].join("\\n");

const PROJECT = {
  id: "logagg",
  em: "📊",
  lv: 4,
  title: "로그 집계 파이프라인 — 5일",
  sub: "원시 로그를 파싱해 지표로 바꾸고, 임계를 넘으면 경보까지",
  brief: "서비스 로그 한 줄씩을 받아 숫자로 바꾸는 일을 처음부터 만듭니다. 파싱은 깨진 줄을 만나도 멈추면 안 되고, 지표는 평균이 아니라 백분위여야 하며, '언제' 나빴는지 보려면 시간 창이 필요합니다. 마지막 날에는 이 조각들을 합쳐 임계를 넘은 것만 경보로 올립니다.",
  contract: "app.js 가 그날까지 만든 함수들을 내보내야 합니다. 파일을 나눠 만들고 require 로 불러 쓰세요 — 매일 새 모듈이 하나씩 늘어납니다.",
  seed: {
    "app.js": "// 여기서 그날까지 만든 함수들을 내보내세요.\n// 예: const parse = require('./parse');\n//     module.exports = { ...parse };\n\nmodule.exports = {};\n"
  },
  days: [
    { n: 1, title: "파싱 — 깨진 줄에서 멈추지 않기",
      req: [
        "parseLine(line) 은 `<시각> <레벨> <지연>ms <메서드> <경로> <상태코드>` 한 줄을 {ts, level, ms, method, path, status} 로 만든다.",
        "ms 와 status 는 문자열이 아니라 숫자여야 한다.",
        "형식이 맞지 않는 줄은 예외를 던지지 말고 null 을 반환한다.",
        "parse(text) 는 여러 줄을 받아 유효한 것만 배열로 돌려준다.",
        "빈 줄과 # 로 시작하는 주석 줄은 건너뛴다.",
        "메서드는 GET·POST·PUT·PATCH·DELETE 만 인정한다."
      ],
      hint: "정규식 하나로 여섯 조각을 한 번에 잡으면 검증과 추출이 같이 끝납니다. 깨진 줄에서 예외를 던지면 로그 파일 하나가 파이프라인 전체를 멈춥니다 — null 을 돌려주고 걸러내세요.",
      tests: [
        { n: "한 줄을 객체로 만든다", c: "const e=A.parseLine('2024-03-01T10:00:00Z INFO 120ms GET /a 200'); eq(e.method,'GET'); eq(e.path,'/a');" },
        { n: "ms 와 status 가 숫자다", c: "const e=A.parseLine('2024-03-01T10:00:00Z INFO 120ms GET /a 200'); ok(typeof e.ms==='number','ms 는 숫자'); ok(typeof e.status==='number','status 는 숫자'); eq(e.ms,120); eq(e.status,200);" },
        { n: "깨진 줄은 null (예외 아님)", c: "eq(A.parseLine('이건 로그가 아니다'),null); eq(A.parseLine(''),null); eq(A.parseLine('2024-03-01T10:00:00Z INFO 120 GET /a 200'),null);" },
        { n: "모르는 메서드는 null", c: "eq(A.parseLine('2024-03-01T10:00:00Z INFO 5ms TRACE /a 200'),null);" },
        { n: "여러 줄을 배열로", c: "const r=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:01Z INFO 2ms GET /b 200'); eq(r.length,2); eq(r[1].path,'/b');" },
        { n: "빈 줄·주석·깨진 줄을 건너뛴다", c: "const r=A.parse('# 주석\\n\\n2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n깨진 줄\\n'); eq(r.length,1); eq(A.parse('').length,0);" }
      ],
      sol: SOL[0] },
    { n: 2, title: "집계 — 무엇이 얼마나",
      req: [
        "summarize(events) 는 {count, byStatus, byPath, errorRate} 를 돌려준다.",
        "byStatus 는 상태코드별 건수, byPath 는 경로별 건수다.",
        "errorRate 는 status 가 500 이상인 건의 비율(0~1)이다.",
        "이벤트가 없으면 count 는 0, errorRate 는 0 이고 예외가 나면 안 된다.",
        "404 는 오류율에 포함하지 않는다 — 서버 잘못이 아니다."
      ],
      hint: "빈 배열을 첫 테스트로 두세요. 0으로 나누기는 집계 함수에서 가장 먼저 터지는 곳입니다.",
      tests: [
        { n: "건수와 경로별 집계", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:01Z INFO 2ms GET /a 200\\n2024-03-01T10:00:02Z INFO 3ms GET /b 200'); const s=A.summarize(e); eq(s.count,3); eq(s.byPath['/a'],2); eq(s.byPath['/b'],1);" },
        { n: "상태코드별 집계", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:01Z ERROR 2ms GET /a 500'); const s=A.summarize(e); eq(s.byStatus['200'],1); eq(s.byStatus['500'],1);" },
        { n: "오류율은 500 이상만", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:01Z ERROR 2ms GET /a 500'); eq(A.summarize(e).errorRate,0.5);" },
        { n: "404 는 오류율에 넣지 않는다", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 404\\n2024-03-01T10:00:01Z INFO 2ms GET /a 200'); eq(A.summarize(e).errorRate,0);" },
        { n: "빈 입력에서 터지지 않는다", c: "const s=A.summarize([]); eq(s.count,0); eq(s.errorRate,0);" },
        { n: "원본 배열을 바꾸지 않는다", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 200'); const n=e.length; A.summarize(e); eq(e.length,n);" }
      ],
      sol: SOL[1] },
    { n: 3, title: "백분위 — 평균이 숨기는 것",
      req: [
        "percentile(nums, p) 는 nums 의 p 백분위 값을 돌려준다.",
        "정렬 후 ceil(p/100 × n) 번째 값을 쓴다(1부터 세는 nearest-rank).",
        "빈 배열이면 null 을 돌려준다.",
        "원본 배열의 순서를 바꾸면 안 된다.",
        "p=100 은 최댓값, p=1 은 최솟값 쪽이어야 한다."
      ],
      hint: "sort 는 제자리 정렬입니다 — 인자로 받은 배열을 그대로 정렬하면 호출자의 데이터 순서가 바뀝니다. 그리고 숫자 배열에 비교 함수를 빼먹으면 사전순으로 정렬돼 10이 9보다 앞에 옵니다.",
      tests: [
        { n: "중앙값", c: "eq(A.percentile([1,2,3,4,5],50),3);" },
        { n: "p95 와 p100", c: "eq(A.percentile([1,2,3,4,5,6,7,8,9,10],95),10); eq(A.percentile([1,2,3],100),3);" },
        { n: "숫자로 정렬한다 (사전순 아님)", c: "eq(A.percentile([9,10,2],100),10); eq(A.percentile([9,10,2],1),2);" },
        { n: "빈 배열은 null", c: "eq(A.percentile([],50),null);" },
        { n: "원본 순서를 바꾸지 않는다", c: "const xs=[3,1,2]; A.percentile(xs,50); eq(xs,[3,1,2]);" },
        { n: "값이 하나면 그 값", c: "eq(A.percentile([42],50),42); eq(A.percentile([42],99),42);" }
      ],
      sol: SOL[2] },
    { n: 4, title: "시간 창 — 언제 나빴는가",
      req: [
        "bucket(events, sec) 는 events 를 sec 초 단위 창으로 묶는다.",
        "각 창은 {start, count, errorRate, p95} 이고 start 는 창 시작의 epoch 초다.",
        "창 경계는 epoch 기준으로 정렬한다 — 첫 이벤트 시각이 아니라 sec 의 배수다.",
        "결과는 start 오름차순이어야 한다.",
        "이벤트가 없는 창은 만들지 않는다.",
        "이벤트가 하나도 없으면 빈 배열이다."
      ],
      hint: "창 시작을 '첫 이벤트 시각' 으로 잡으면 파일마다 경계가 달라져 두 리포트를 비교할 수 없습니다. epoch 초를 sec 으로 나눠 내림하면 언제 돌려도 같은 경계가 나옵니다.",
      tests: [
        { n: "60초 창으로 나눈다", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:30Z INFO 2ms GET /a 200\\n2024-03-01T10:01:10Z INFO 3ms GET /a 200'); const b=A.bucket(e,60); eq(b.length,2); eq(b[0].count,2); eq(b[1].count,1);" },
        { n: "창 시작이 60의 배수다", c: "const e=A.parse('2024-03-01T10:00:30Z INFO 1ms GET /a 200'); const b=A.bucket(e,60); ok(b[0].start%60===0,'창 시작은 sec 의 배수여야 한다');" },
        { n: "start 오름차순", c: "const e=A.parse('2024-03-01T10:02:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:00Z INFO 2ms GET /a 200'); const b=A.bucket(e,60); ok(b[0].start<b[1].start,'오름차순이어야 한다');" },
        { n: "창마다 오류율", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:10Z ERROR 2ms GET /a 500'); eq(A.bucket(e,60)[0].errorRate,0.5);" },
        { n: "창마다 p95", c: "const e=A.parse('2024-03-01T10:00:00Z INFO 10ms GET /a 200\\n2024-03-01T10:00:10Z INFO 900ms GET /a 200'); eq(A.bucket(e,60)[0].p95,900);" },
        { n: "빈 입력은 빈 배열", c: "eq(A.bucket([],60),[]);" }
      ],
      sol: SOL[3] },
    { n: 5, title: "리포트와 경보 — 임계를 넘은 것만",
      req: [
        "report(text, opts) 는 원시 로그 텍스트를 받아 {total, errorRate, slowest, topPaths, alerts} 를 돌려준다.",
        "slowest 는 경로별 p95 를 내림차순으로 담는다: [{path, p95}].",
        "topPaths 는 경로별 건수를 내림차순으로 담는다: [{path, count}].",
        "opts.slaMs 를 넘는 경로마다 {type:'slow', path, p95} 경보를 넣는다.",
        "opts.maxErrorRate 를 넘으면 {type:'errors', rate} 경보를 넣는다.",
        "임계를 안 넘으면 alerts 는 빈 배열이다 — 경보는 '넘은 것만' 이다."
      ],
      hint: "정렬이 같은 값에서 흔들리면 리포트가 실행할 때마다 달라집니다. 1차 기준이 같을 때의 타이브레이커를 정해 두세요.",
      tests: [
        { n: "총 건수와 오류율", c: "const r=A.report('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:01Z ERROR 2ms GET /b 500',{}); eq(r.total,2); eq(r.errorRate,0.5);" },
        { n: "느린 경로가 앞에 온다", c: "const r=A.report('2024-03-01T10:00:00Z INFO 10ms GET /fast 200\\n2024-03-01T10:00:01Z INFO 900ms GET /slow 200',{}); eq(r.slowest[0].path,'/slow'); eq(r.slowest[0].p95,900);" },
        { n: "많이 불린 경로가 앞에 온다", c: "const r=A.report('2024-03-01T10:00:00Z INFO 1ms GET /a 200\\n2024-03-01T10:00:01Z INFO 1ms GET /a 200\\n2024-03-01T10:00:02Z INFO 1ms GET /b 200',{}); eq(r.topPaths[0],{path:'/a',count:2});" },
        { n: "SLA 초과 경보", c: "const r=A.report('2024-03-01T10:00:00Z INFO 900ms GET /slow 200',{slaMs:300}); eq(r.alerts.length,1); eq(r.alerts[0].type,'slow'); eq(r.alerts[0].path,'/slow');" },
        { n: "오류율 초과 경보", c: "const r=A.report('2024-03-01T10:00:00Z ERROR 1ms GET /a 500',{maxErrorRate:0.1}); ok(r.alerts.some(a=>a.type==='errors'),'errors 경보가 있어야 한다');" },
        { n: "임계를 안 넘으면 경보 없음", c: "const r=A.report('2024-03-01T10:00:00Z INFO 10ms GET /a 200',{slaMs:300,maxErrorRate:0.5}); eq(r.alerts,[]);" }
      ],
      sol: SOL[4] },
  ],
};

module.exports = { PROJECT, SOL };
