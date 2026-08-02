/* 러너 언어 실습 검증 — 검사기를 따로 만들지 않고 러너 자체에 물어본다.

   Go 1차에서 배운 것: 검사기를 따로 두면 러너와 조건이 어긋난다(타임아웃·환경변수·
   캐시). 검사기에서 통과한 문항이 실제 채점에서 떨어지면 최악이다.
   그래서 여기서는 tools/runner 를 실제로 띄우고 /test 로 물어본다 — 채점 경로가 하나다.

     node tools/content/ver_runner.cjs <content.js> <java|c|cpp|rust|go> [포트] */
const path = require("path");
const { spawn } = require("child_process");

const GROUPS = require(path.resolve(process.argv[2]));
const LANG = process.argv[3];
const PORT = +(process.argv[4] || 8799);
const BASE = "http://127.0.0.1:" + PORT;

if (!LANG) { console.error("언어를 지정하세요 (java|c|cpp|rust|go)"); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitHealthy(deadlineMs) {
  const until = Date.now() + deadlineMs;
  while (Date.now() < until) {
    try {
      const j = await fetch(BASE + "/health").then(r => r.json());
      if (j && j.ok) return j;
    } catch (_) {}
    await sleep(300);
  }
  return null;
}

function grade(q, code) {
  return fetch(BASE + "/test", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ language: LANG, code, test: q.test, name: q.name, srcName: q.srcName }),
  }).then(r => r.json()).catch(e => ({ error: String(e.message || e) }));
}

const short = s => String(s || "").split("\n").filter(l => l.trim()).slice(0, 3).join(" | ").slice(0, 260);

(async () => {
  const srv = spawn("node", [path.join(__dirname, "..", "runner", "server.cjs")],
    { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: "ignore" });
  const stop = () => { try { srv.kill(); } catch (_) {} };
  process.on("exit", stop);

  const health = await waitHealthy(30000);
  if (!health) { stop(); console.error("러너가 뜨지 않았다"); process.exit(1); }
  if (!health.langs || !health.langs[LANG]) { stop(); console.error(LANG + " 툴체인이 없다"); process.exit(1); }

  const bad = [];
  let n = 0, slowest = 0, slowK = "";
  for (const g of GROUPS) {
    for (const x of g.q) {
      n++;
      if (!x.src || !x.sol || !x.test || !Object.keys(x.test).length) { bad.push(x.k + ": 필드 누락"); continue; }
      if (x.src === x.sol) { bad.push(x.k + ": 시작 코드와 정답이 같다"); continue; }

      /* 앱이 보내는 것과 같은 모양으로 보낸다 */
      const q = { test: x.test, name: x.name || x.cls || "ex",
                  srcName: x.srcName || (LANG === "java" && x.cls ? x.cls + ".java" : undefined) };

      const t0 = Date.now();
      const good = await grade(q, x.sol);
      const ms = Date.now() - t0;
      if (ms > slowest) { slowest = ms; slowK = x.k; }
      if (!good.pass) { bad.push(x.k + ": 정답이 러너에서 통과하지 못한다 — " + short(good.output || good.error)); continue; }

      const start = await grade(q, x.src);
      if (start.pass) bad.push(x.k + ": 시작 코드가 이미 통과한다 — 고칠 것이 없는 문제다");
      else process.stdout.write("  ✓ " + x.k + "\n");
    }
  }

  stop();
  console.log("\n러너(" + LANG + ")로 검사 " + n + "문항 · 레슨 " + GROUPS.length + "개");
  console.log("가장 느린 채점 " + slowest + "ms (" + slowK + ")");
  if (bad.length) { bad.forEach(b => console.log("  ✗ " + b)); console.log("\n" + bad.length + "건 실패 — 주입하지 않는다"); process.exit(1); }
  console.log("전부 통과 — 실제 채점 경로에서 정답만 통과한다");
})();
