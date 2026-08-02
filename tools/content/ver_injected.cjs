/* 주입된 데이터를 러너로 다시 채점한다.

   왜 또 하는가: 콘텐츠 파일이 맞아도 주입기가 필드를 빠뜨리면 앱에서만 실패한다.
   실제로 그랬다 — 검증기는 srcName 을 넘겨 통과했는데 주입기가 rt.srcName 을
   빼먹어서, 공개 클래스가 Bag 인 문항이 Sol.java 로 저장돼 javac 가 거부했다.
   그래서 여기서는 data/t-*.js 에 실제로 들어간 값만 읽어서 보낸다.

     node tools/content/ver_injected.cjs <트랙> <언어> [포트] */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const TRACK = process.argv[2], LANG = process.argv[3];
const PORT = +(process.argv[4] || 8798);
const BASE = "http://127.0.0.1:" + PORT;
if (!TRACK || !LANG) { console.error("사용: ver_injected.cjs <트랙> <언어>"); process.exit(2); }

const ROOT = path.resolve(__dirname, "..", "..");
const raw = fs.readFileSync(path.join(ROOT, "data", "t-" + TRACK + ".js"), "utf8");
const data = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));

/* sol 이 있는 러너 문항만 본다 — exercism 임포트분은 참조 해답이 없어 검사할 수 없다 */
const items = [];
data.forEach(u => (u.l || []).forEach(l => (l.q || []).forEach(q => {
  if (q && q.t === "code" && q.run === LANG && q.rt && q.sol) items.push({ unit: u.t, q: q });
})));

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitHealthy(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try { const j = await fetch(BASE + "/health").then(r => r.json()); if (j && j.ok) return j; } catch (_) {}
    await sleep(300);
  }
  return null;
}
const short = s => String(s || "").split("\n").filter(l => l.trim()).slice(0, 2).join(" | ").slice(0, 220);

(async () => {
  if (!items.length) { console.log("검사할 문항이 없다 (sol 이 있는 " + LANG + " 문항 0개)"); return; }
  const srv = spawn("node", [path.join(ROOT, "tools", "runner", "server.cjs")],
    { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: "ignore" });
  const stop = () => { try { srv.kill(); } catch (_) {} };
  process.on("exit", stop);

  const h = await waitHealthy(30000);
  if (!h) { stop(); console.error("러너가 뜨지 않았다"); process.exit(1); }

  /* 앱의 onCheck 이 보내는 것과 같은 인자다 (index.html: runnerTest(q.rt.lang, 코드, q.rt.test, q.rt.name, q.rt.srcName)) */
  const send = (q, code) => fetch(BASE + "/test", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ language: q.rt.lang, code: code, test: q.rt.test,
                           name: q.rt.name, srcName: q.rt.srcName }),
  }).then(r => r.json()).catch(e => ({ error: String(e.message || e) }));

  const bad = [];
  for (const it of items) {
    const q = it.q;
    const good = await send(q, q.sol);
    if (!good.pass) { bad.push(q.k + " [" + it.unit + "]: 정답이 통과하지 못한다 — " + short(good.output || good.error)); continue; }
    const start = await send(q, q.src);
    if (start.pass) bad.push(q.k + " [" + it.unit + "]: 시작 코드가 이미 통과한다");
    else process.stdout.write("  ✓ " + q.k + "\n");
  }

  stop();
  console.log("\n주입된 " + TRACK + " 데이터로 " + items.length + "문항 확인");
  if (bad.length) { bad.forEach(b => console.log("  ✗ " + b)); console.log("\n" + bad.length + "건 실패"); process.exit(1); }
  console.log("전부 통과 — 앱이 보내는 그대로 채점된다");
})();
