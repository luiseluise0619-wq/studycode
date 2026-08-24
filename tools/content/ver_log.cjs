/* 로그 분석(t:"log") 배치를 넣기 전에 검사한다.

     node ver_log.cjs ./log_ml.cjs

   로그 문항은 실행해서 채점할 수 없으므로, 대신 <b>찍어서 맞힐 수 있는 길</b>이
   열려 있지 않은지를 본다. 44차에서 실제로 드러난 세 가지다.
     · 자리 — 원인 줄이 늘 같은 자리에 있으면 로그를 안 읽어도 맞힌다
     · 등급 — '첫 WARN 이상' 을 찍는 것만으로 맞으면 읽을 이유가 없다
     · 복제 — 서비스 이름만 바꿔 찍어낸 문항은 새 문항이 아니다
   그 밖에 시간 순서, 해설의 자리 표현, 기존 데이터와의 중복도 본다. */
const fs = require("fs");
const path = require("path");
const sig = require("./logsig.cjs");

const SRC = process.argv[2];
if (!SRC) { console.error("문항 파일을 인자로 주세요: node ver_log.cjs ./log_ml.cjs"); process.exit(2); }
const Q = require(path.resolve(SRC));
const ROOT = path.resolve(__dirname, "..", "..");

const RANK = { DEBUG: 0, TRACE: 0, INFO: 1, NOTICE: 1, WARN: 2, WARNING: 2, ERROR: 3, CRIT: 3, FATAL: 4 };
const level = t => {
  const m = String(t).match(/\b(INFO|DEBUG|TRACE|NOTICE|WARN|WARNING|ERROR|FATAL|CRIT)\b/);
  return m ? RANK[m[1]] : 1;
};
const secs = t => {
  const m = String(t).match(/^(\d{2}):(\d{2}):(\d{2})/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
};
const POSWORD = /(첫|두|세|네|다섯|여섯|일곱|여덟|마지막)\s?(번째|줄)|맨\s?(위|아래|앞|뒤)|위에서\s?\d/;

/* 이미 들어 있는 로그 문항의 뼈대 — 새 배치가 그것을 되풀이하면 안 된다 */
const already = new Set();
for (const f of fs.readdirSync(path.join(ROOT, "data")).filter(x => /^t-.*\.js$/.test(x))) {
  const raw = fs.readFileSync(path.join(ROOT, "data", f), "utf8");
  const a = raw.indexOf("["), z = raw.lastIndexOf("]");
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (o.q && o.t === "log" && Array.isArray(o.items)) already.add(sig.skeleton(o));
    for (const k in o) walk(o[k]);
  };
  walk(JSON.parse(raw.slice(a, z + 1)));
}

let bad = 0;
const keys = new Set(), stems = new Set(), skels = new Set();
const atIdx = {};
let firstWarnHit = 0;

Q.forEach((q, i) => {
  const tag = "[" + (i + 1) + "] " + (q.k || "(제목 없음)");
  const fail = m => { bad++; console.log("✗ " + tag + " — " + m); };

  if (q.t !== "log") fail('t 가 "log" 가 아니다');
  if (q.cat !== "logs") fail('cat 이 "logs" 가 아니다');
  if (!q.track) fail("track 이 없다");
  if (!q.file) fail("file(로그 파일 이름)이 없다");
  if (!(q.d >= 1 && q.d <= 5)) fail("d(난이도)가 1~5 가 아니다");
  if (keys.has(q.k)) fail("제목 중복"); keys.add(q.k);

  const st = String(q.q).slice(0, 30);
  if (stems.has(st)) fail("물음 줄기 중복"); stems.add(st);
  if (!/고르세요[.?]?$/.test(String(q.q).trim())) fail("물음이 '…고르세요.' 로 끝나지 않는다");
  if (POSWORD.test(q.q)) fail("물음이 보기 자리를 가리킨다 — 순서를 바꾸면 뜻이 깨진다");
  if (POSWORD.test(q.ex)) fail("해설이 보기 자리를 가리킨다");
  if (String(q.ex || "").length < 150) fail("해설이 150자 미만");

  const it = q.items;
  if (!Array.isArray(it) || it.length < 6 || it.length > 8) { fail("보기(로그 줄)가 6~8개가 아니다"); return; }
  if (it.some(x => !x || typeof x.txt !== "string" || x.txt.length < 12)) fail("너무 짧거나 비어 있는 줄이 있다");

  const nbad = it.filter(x => x.bad).length;
  if (nbad < 1) fail("원인 줄(bad)이 없다");
  if (nbad > 3) fail("원인 줄이 3개를 넘는다 — 한 사고의 원인은 그렇게 많지 않다");
  if (nbad === it.length) fail("모든 줄이 원인이다");

  const ts = it.map(x => secs(x.txt));
  if (ts.some(x => x === null)) fail("HH:MM:SS 로 시작하지 않는 줄이 있다");
  else for (let j = 1; j < ts.length; j++) if (ts[j] < ts[j - 1]) fail("시각이 거꾸로 간다: " + it[j].txt.slice(0, 30));

  const idx = it.findIndex(x => x.bad);
  atIdx[idx] = (atIdx[idx] || 0) + 1;
  if (idx === 0) fail("원인 줄이 첫 줄이다 — 정상 상태를 보여 주는 줄이 앞에 있어야 한다");
  if (idx === it.length - 1) fail("원인 줄이 마지막 줄이다 — 증상이 뒤따라야 한다");

  const lv = it.map(x => level(x.txt));
  if (lv.findIndex(x => x >= 2) === idx) firstWarnHit++;
  /* 결함이 하나뿐인데 그것이 유일한 WARN 이상이면 등급만 보고 찍힌다.
     결함이 여럿이면 한 줄을 찍어도 못 풀고, 원인이 INFO 면 등급은 오히려 함정이다. */
  if (nbad === 1 && lv.filter(x => x >= 2).length === 1 && lv[idx] >= 2)
    fail("원인 줄이 유일한 WARN 이상이다 — 등급만 보고 찍힌다");

  const sk = sig.skeleton(q);
  if (skels.has(sk)) fail("배치 안에 이름만 다른 같은 문항이 있다"); skels.add(sk);
  if (already.has(sk)) fail("이미 데이터에 같은 뼈대의 문항이 있다");

  if (!bad) console.log("✓ " + tag + "  (원인 " + idx + "번 / " + it.length + "줄)");
});

/* 배치 전체의 쏠림 — 한 자리에 몰리면 자리로 찍힌다 */
const n = Q.length;
const worst = Math.max(0, ...Object.values(atIdx));
if (n >= 6 && worst / n > 0.45)
  { bad++; console.log("✗ 원인 줄이 한 자리에 몰렸다: " + JSON.stringify(atIdx) + " — 자리로 찍힌다"); }
if (n >= 6 && firstWarnHit / n > 0.6)
  { bad++; console.log("✗ '첫 WARN 이상' 을 찍으면 " + firstWarnHit + "/" + n + " 맞는다 — 앞선 붉은 청어를 섞으세요"); }

console.log("\n자리 분포 " + JSON.stringify(atIdx) + " · '첫 WARN' 적중 " + firstWarnHit + "/" + n);
console.log(n + "문항 중 " + bad + "건 문제");
process.exit(bad ? 1 : 0);
