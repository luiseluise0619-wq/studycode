/* 배선 문항 검증 — index.html 의 채점 엔진을 그대로 뽑아 쓴다.

   보는 것
     1. 시작 상태(start)는 반드시 실패한다 — 아무것도 안 해도 통과하면 실습이 아니다
     2. 정답 배선(sol)이 실제로 통과한다 — 적어만 두고 확인하지 않으면 소용없다
     3. sol 의 선이 하나라도 빠지면 실패한다 — 쓸데없는 선이 섞여 있지 않다는 뜻
     4. 검사에 쓰는 핀 이름이 부품에 실제로 있다 — 오타면 영영 통과 못 한다
     5. 검사 문구가 서로 다르다 — 같은 문구가 두 번 나오면 무엇이 남았는지 알 수 없다

   처음에는 통과하는 배선을 탐색으로 찾게 했는데, 그 방식은 through 조건에서 막힌다.
   '저항을 거쳐서' 는 선 두 개를 동시에 놓아야 점수가 오르고, 지름길을 한 번 그으면
   점수가 떨어지는 방향이라 되돌리지도 못한다. 탐색을 키우는 대신 정답을 적고
   그 정답을 기계가 돌려서 확인하는 쪽으로 바꿨다 — 다른 검증기와 같은 방식이다.

     node tools/content/ver_wire.cjs */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const a = HTML.indexOf("/* ===== 회로 배선 채점 엔진 =====");
const b = HTML.indexOf("/* ===== 회로 배선 UI =====");
if (a < 0 || b < 0) throw new Error("index.html 에서 배선 엔진을 찾지 못했다");
const sandbox = {};
new Function("ctx", "with(ctx){" + HTML.slice(a, b) + "\nctx.api={wireCheck,wireNets};}")(sandbox);
const { wireCheck } = sandbox.api;

const GROUPS = require(path.resolve(process.argv[2] || path.join(__dirname, "arduino_wire.js")));

const bad = [];
let n = 0;
GROUPS.forEach(g => {
  g.q.forEach(x => {
    n++;
    const q = { parts: x.parts, checks: x.checks, start: x.start };
    if (!x.parts || !x.parts.length) return bad.push(x.k + ": 부품이 없다");
    if (!x.checks || !x.checks.length) return bad.push(x.k + ": 검사가 없다");

    /* 핀 이름 오타 */
    const known = new Set();
    x.parts.forEach(p => (p.pins || []).forEach(nm => known.add(p.id + "." + nm)));
    x.checks.forEach(c => (c.link || c.apart || []).forEach(pin => {
      if (!known.has(pin)) bad.push(x.k + ": 없는 핀 " + pin);
    }));
    x.checks.forEach(c => {
      if (c.through && !x.parts.some(p => p.id === c.through)) bad.push(x.k + ": 없는 부품 " + c.through);
      if (!c.link && !c.apart) bad.push(x.k + ": link 도 apart 도 없는 검사");
      if (!c.d) bad.push(x.k + ": 검사 설명이 없다");
    });
    (x.start || []).forEach(w => w.forEach(pin => {
      if (!known.has(pin)) bad.push(x.k + ": 시작 배선에 없는 핀 " + pin);
    }));
    const ds = x.checks.map(c => c.d);
    if (new Set(ds).size !== ds.length) bad.push(x.k + ": 검사 문구가 겹친다");

    /* 시작 상태는 실패해야 한다 */
    const first = wireCheck(q, x.start || []);
    if (first.gate) bad.push(x.k + ": 시작 상태가 이미 통과한다 — 이을 것이 없는 문제다");

    /* 정답 배선이 실제로 통과하는가 */
    if (!x.sol || !x.sol.length) return bad.push(x.k + ": 정답 배선(sol)이 없다");
    x.sol.forEach(w => w.forEach(pin => {
      if (!known.has(pin)) bad.push(x.k + ": 정답 배선에 없는 핀 " + pin);
    }));
    const done = wireCheck(q, x.sol);
    if (!done.gate) {
      const miss = done.detail.filter(d => !d.ok).map(d => d.d).join(" · ");
      return bad.push(x.k + ": 정답 배선이 통과하지 못한다 (" + done.pass + "/" + done.total + ") — " + miss);
    }

    /* 선을 하나라도 빼면 실패해야 한다 — 쓸데없는 선이 없다는 뜻 */
    let extra = null;
    x.sol.forEach((_, i) => {
      const less = x.sol.filter((__, j) => j !== i);
      if (wireCheck(q, less).gate) extra = x.sol[i];
    });
    if (extra) return bad.push(x.k + ": 없어도 통과하는 선이 있다 — " + extra.join(" ↔ "));

    process.stdout.write("  ✓ " + x.k + "  (시작 " + first.pass + "/" + first.total
      + " → 선 " + x.sol.length + "개, 하나만 빠져도 실패)\n");
  });
});

console.log("\n배선 문항 " + n + "개 · 레슨 " + GROUPS.length + "개");
if (bad.length) { bad.forEach(x => console.log("  ✗ " + x)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
console.log("전부 통과 — 시작은 반드시 실패하고, 통과하는 배선이 실제로 존재한다");
