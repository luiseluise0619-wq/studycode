/* Go 실습 검증 — 러너가 하는 것과 똑같이 go test 를 돌린다.

   tools/runner/server.cjs 의 계약을 그대로 따른다:
     go.mod(module ex) · sol.go(사용자 코드) · 테스트 파일들 · go test ./...

   두 가지를 본다.
     1. 정답(sol)이 go test 를 통과하는가
     2. 시작 코드(src)가 반드시 실패하는가 — 컴파일 오류든 테스트 실패든
   2번이 없으면 고칠 것이 없는 문제이고, 그건 실습이 아니다.

     node tools/content/ver_go.cjs [content.js] */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const GROUPS = require(path.resolve(process.argv[2] || path.join(__dirname, "go_core.js")));

function goTest(pkg, code, testFiles) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cr_go_"));
  try {
    fs.writeFileSync(path.join(dir, "go.mod"), "module ex\n\ngo 1.21\n");
    fs.writeFileSync(path.join(dir, "sol.go"), code);
    Object.keys(testFiles).forEach(n => fs.writeFileSync(path.join(dir, n), testFiles[n]));
    const r = spawnSync("go", ["test", "./..."], {
      cwd: dir, encoding: "utf8", timeout: 120000,
      env: Object.assign({}, process.env, {
        HOME: dir, GOCACHE: path.join(dir, ".gocache"), GOPATH: path.join(dir, ".gopath"),
        GOFLAGS: "-mod=mod", GOTOOLCHAIN: "local", GOPROXY: "off",
      }),
    });
    const out = ((r.stdout || "") + (r.stderr || "")).trim();
    return { ok: r.status === 0, out };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
}

const short = s => String(s).split("\n").filter(l => l.trim()).slice(0, 3).join(" | ").slice(0, 240);

const bad = [];
let n = 0;
GROUPS.forEach(g => {
  g.q.forEach(x => {
    n++;
    if (!x.pkg || !x.src || !x.sol || !x.test || !Object.keys(x.test).length)
      return bad.push(x.k + ": 필드 누락");
    if (x.src === x.sol) return bad.push(x.k + ": 시작 코드와 정답이 같다");

    const good = goTest(x.pkg, x.sol, x.test);
    if (!good.ok) { bad.push(x.k + ": 정답이 go test 를 통과하지 못한다 — " + short(good.out)); return; }

    const start = goTest(x.pkg, x.src, x.test);
    if (start.ok) bad.push(x.k + ": 시작 코드가 이미 통과한다 — 고칠 것이 없는 문제다");
    else process.stdout.write("  ✓ " + x.k + "  (시작 코드는 " +
      (/build failed|cannot use|undefined:|syntax error/.test(start.out) ? "컴파일 실패" : "테스트 실패") + ")\n");
  });
});

console.log("\n검사 " + n + "문항 · 레슨 " + GROUPS.length + "개");
if (bad.length) { bad.forEach(b => console.log("  ✗ " + b)); console.log("\n" + bad.length + "건 실패 — 주입하지 않는다"); process.exit(1); }
console.log("전부 통과 — 정답은 go test 를 통과하고, 시작 코드는 반드시 실패한다");
