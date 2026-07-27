#!/usr/bin/env node
/* CodeRun 로컬 실행 서버 — 브라우저에서 못 돌리는 언어를 "진짜 컴파일러" 로 실행한다. (C · C++ · Java · Go · Rust)
 *
 * 왜 이게 필요한가
 *   C·C++·Java·Go 는 브라우저 안에서 정확하게 실행할 방법이 없다. 실제로 두 후보를
 *   시험해 보고 둘 다 기각했다 (docs/CONTENT_POLICY.md 참고):
 *     - JSCPP(C++ 인터프리터): -7/2 를 -4 로 계산 (정답 -3)
 *     - yaegi(Go 인터프리터): defer 인자 평가 시점, defer 루프, nil 인터페이스가 명세와 다름
 *   틀린 결과를 가르치느니, 진짜 컴파일러를 옆에서 돌리는 편이 낫다.
 *
 * 쓰는 법
 *   node tools/runner/server.cjs            # 기본 http://127.0.0.1:8787
 *   PORT=9000 node tools/runner/server.cjs
 *   앱 → 설정 → "로컬 실행 서버" 에 주소를 넣으면 C·C++·Java·Go 문제에서 실행 버튼이 열린다.
 *
 * 보안
 *   이 서버는 받은 소스를 그대로 컴파일·실행한다. 기본값은 127.0.0.1 바인딩이라
 *   같은 기계에서만 접근된다. 절대 공개 인터페이스에 그대로 노출하지 말 것.
 *   격리가 필요하면 tools/runner/Dockerfile 로 컨테이너 안에서 돌린다.
 */
const http = require("http");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const REAL_HOME = process.env.HOME || os.homedir();
const PORT = +(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const TIMEOUT_MS = +(process.env.RUN_TIMEOUT_MS || 10000);
const MAX_SRC = 200 * 1024;      // 소스 200KB 상한
const MAX_OUT = 64 * 1024;       // 출력 64KB 상한 (무한 출력 방어)

/* 언어별 컴파일·실행 방법. 없는 도구는 시작할 때 알려 준다. */
const LANGS = {
  c:    { file: "main.c",    probe: ["gcc", "--version"],
          build: (d) => run("gcc", ["-std=c11", "-O1", "-w", "-o", "prog", "main.c"], d),
          exec:  (d) => run(path.join(d, "prog"), [], d) },
  cpp:  { file: "main.cpp",  probe: ["g++", "--version"],
          build: (d) => run("g++", ["-std=c++17", "-O1", "-w", "-o", "prog", "main.cpp"], d),
          exec:  (d) => run(path.join(d, "prog"), [], d) },
  java: { file: "Main.java", probe: ["javac", "-version"],
          build: (d) => run("javac", ["-nowarn", "-encoding", "UTF-8", "Main.java"], d),
          exec:  (d) => run("java", ["-Dfile.encoding=UTF-8", "-cp", ".", "Main"], d) },
  rust: { file: "main.rs",   probe: ["rustc", "--version"],
          build: (d) => run("rustc", ["-O", "--edition", "2021", "-A", "warnings", "-o", "prog", "main.rs"], d),
          exec:  (d) => run(path.join(d, "prog"), [], d) },
  go:   { file: "main.go",   probe: ["go", "version"],
          build: (d) => { fs.writeFileSync(path.join(d, "go.mod"), "module run\n\ngo 1.21\n"); return { status: 0, stdout: "", stderr: "" }; },
          exec:  (d) => run("go", ["run", "."], d) },
};

function run(cmd, args, cwd, stdin) {
  const r = spawnSync(cmd, args, {
    cwd, encoding: "utf8", timeout: TIMEOUT_MS, input: stdin || "",
    maxBuffer: MAX_OUT * 4,
    env: {
      PATH: process.env.PATH, HOME: cwd, LANG: "C.UTF-8",
      GOCACHE: path.join(cwd, ".gocache"), GOPATH: path.join(cwd, ".gopath"),
      GOFLAGS: "-mod=mod", GOTOOLCHAIN: "local", JAVA_TOOL_OPTIONS: "",
      /* HOME 을 임시 디렉터리로 바꿔 격리하므로, 툴체인 위치는 따로 알려 줘야 한다.
         rustup 은 $HOME/.rustup 을 보기 때문에 이걸 빼면 "toolchain 을 고를 수 없다" 로 실패한다. */
      RUSTUP_HOME: process.env.RUSTUP_HOME || path.join(REAL_HOME, ".rustup"),
      CARGO_HOME: process.env.CARGO_HOME || path.join(REAL_HOME, ".cargo"),
      RUSTUP_TOOLCHAIN: process.env.RUSTUP_TOOLCHAIN || "stable",
    },
  });
  return {
    status: r.status,
    signal: r.signal,
    stdout: cap(r.stdout || ""),
    stderr: cap(r.stderr || ""),
    timedOut: r.error && r.error.code === "ETIMEDOUT",
  };
}
function cap(s) { return s.length > MAX_OUT ? s.slice(0, MAX_OUT) + "\n…(출력이 잘렸습니다)" : s; }

/* 테스트 모드 — exercism 처럼 '해답 파일 + 테스트 파일' 이 짝으로 오는 경우.
   테스트를 우리 형식으로 번역하지 않고 그 언어의 테스트 러너에 그대로 맡긴다.
   번역하면 의미가 틀어지고, 틀어진 채로 채점하면 그게 가짜 실행이다. */
function walk(dir, ext, base) {
  base = base || dir; let out = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out = out.concat(walk(p, ext, base));
    else if (f.name.endsWith(ext)) out.push(path.relative(base, p));
  }
  return out;
}
const TESTS = {
  go:   { src: "sol.go", test: "sol_test.go",
          prep: (d) => fs.writeFileSync(path.join(d, "go.mod"), "module ex\n\ngo 1.21\n"),
          run:  (d) => run("go", ["test", "./..."], d) },
  rust: { src: "src/lib.rs", test: "tests/it.rs",
          /* 테스트가 `use <크레이트>::...` 로 참조하므로 이름이 문항과 같아야 한다 */
          prep: (d, name) => { fs.mkdirSync(path.join(d, "src"), { recursive: true });
                         fs.mkdirSync(path.join(d, "tests"), { recursive: true });
                         const n = String(name || "ex").replace(/[^A-Za-z0-9_-]/g, "") || "ex";
                         fs.writeFileSync(path.join(d, "Cargo.toml"),
                           "[package]\nname=\"" + n + "\"\nversion=\"0.1.0\"\nedition=\"2021\"\n"); },
          run:  (d) => run("cargo", ["test", "--offline", "-q"], d) },
  c:    { src: "sol.c", test: "test.c",
          prep: () => {},
          run:  (d) => { const srcs = walk(d, ".c");
                         const b = run("gcc", ["-std=c11", "-w", "-I", ".", "-o", "t"].concat(srcs), d);
                         if (b.status !== 0) return b;
                         return run(path.join(d, "t"), [], d); } },
  cpp:  { src: "sol.cpp", test: "test.cpp",
          prep: () => {},
          run:  (d) => { const srcs = walk(d, ".cpp");
                         const b = run("g++", ["-std=c++17", "-w", "-I", ".", "-o", "t"].concat(srcs), d);
                         if (b.status !== 0) return b;
                         return run(path.join(d, "t"), [], d); } }
};

function executeTests(lang, source, testSource, name) {
  const spec = TESTS[lang];
  if (!spec) return { error: "테스트 모드를 지원하지 않는 언어: " + lang };
  if (typeof source !== "string" || !source.trim()) return { error: "소스가 비어 있습니다" };
  if (source.length > MAX_SRC || String(testSource || "").length > MAX_SRC)
    return { error: "소스가 너무 큽니다 (200KB 상한)" };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "coderun-t-"));
  try {
    spec.prep(dir, name);
    fs.mkdirSync(path.dirname(path.join(dir, spec.src)), { recursive: true });
    fs.writeFileSync(path.join(dir, spec.src), source);
    /* 테스트가 여러 파일일 수 있다 (Go 의 cases_test.go 처럼). 이어 붙이면 package 선언이
       두 번 나와 문법 오류가 나므로, 파일 이름을 유지해 각각 쓴다. */
    const files = (testSource && typeof testSource === "object")
      ? testSource
      : { [path.basename(spec.test)]: String(testSource || "") };
    const baseDir = path.dirname(path.join(dir, spec.test));
    fs.mkdirSync(baseDir, { recursive: true });
    for (const [name, body] of Object.entries(files)) {
      /* 하위 경로는 허용하되(test-framework/unity.h) 상위로 탈출하는 것은 막는다 */
      const rel = path.normalize(String(name)).replace(/^(\.\.(\/|\\|$))+/, "");
      if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) continue;
      const dest = path.join(baseDir, rel);
      if (!dest.startsWith(baseDir)) continue;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, String(body || ""));
    }
    const t0 = Date.now();
    const r = spec.run(dir);
    if (r.timedOut) return { timedOut: true, stdout: r.stdout, stderr: r.stderr,
                             error: "실행 시간 초과 (" + TIMEOUT_MS + "ms)" };
    return { pass: r.status === 0, stdout: r.stdout, stderr: r.stderr,
             exit: r.status, ms: Date.now() - t0 };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
}

function execute(lang, source, stdin) {
  const spec = LANGS[lang];
  if (!spec) return { error: "지원하지 않는 언어: " + lang };
  if (typeof source !== "string" || !source.trim()) return { error: "소스가 비어 있습니다" };
  if (source.length > MAX_SRC) return { error: "소스가 너무 큽니다 (200KB 상한)" };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "coderun-"));
  try {
    fs.writeFileSync(path.join(dir, spec.file), source);
    const t0 = Date.now();
    const b = spec.build(dir);
    if (b.timedOut) return { error: "컴파일 시간 초과" };
    if (b.status !== 0) return { compileError: b.stderr || b.stdout || "컴파일 실패" };
    const e = spec.exec(dir, stdin);
    if (e.timedOut) return { stdout: e.stdout, stderr: e.stderr, timedOut: true,
                             error: "실행 시간 초과 (" + TIMEOUT_MS + "ms) — 무한 루프인지 확인하세요" };
    return { stdout: e.stdout, stderr: e.stderr, exit: e.status,
             signal: e.signal || null, ms: Date.now() - t0 };
  } catch (err) {
    return { error: String((err && err.message) || err) };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, GET, OPTIONS",
};

const server = http.createServer((req, res) => {
  const send = (code, obj) =>
    res.writeHead(code, Object.assign({ "content-type": "application/json; charset=utf-8" }, CORS))
       .end(JSON.stringify(obj));

  if (req.method === "OPTIONS") return res.writeHead(204, CORS).end();
  if (req.method === "GET" && req.url.startsWith("/health"))
    return send(200, { ok: true, langs: available() });

  const isRun = req.url.startsWith("/run");
  const isExec = req.url.startsWith("/execute");   /* 통일 계약 (docs/EXECUTION.md) */
  const isTest = req.url.startsWith("/test");      /* 언어의 테스트 러너에 그대로 맡긴다 */
  if (req.method !== "POST" || !(isRun || isExec || isTest))
    return send(404, { error: "POST /run · /execute · /test 또는 GET /health 를 쓰세요" });

  let body = "";
  let tooBig = false;
  req.on("data", (c) => {
    body += c;
    if (body.length > (isTest ? 4 * 1024 * 1024 : MAX_SRC + 4096)) { tooBig = true; req.destroy(); }
  });
  req.on("end", () => {
    if (tooBig) return send(413, { error: "요청이 너무 큽니다" });
    let j;
    try { j = JSON.parse(body); } catch (_) { return send(400, { error: "JSON 파싱 실패" }); }
    if (isTest) return send(200, executeTests(j.language || j.lang, j.code || j.source, j.test, j.name));
    const r = execute(j.language || j.lang, j.code || j.source, j.stdin);
    if (!isExec) return send(200, r);
    /* 통일 계약으로 변환 — Local 과 Cloud 러너가 같은 모양을 돌려줘야 한다 */
    send(200, {
      status: r.error && !r.timedOut ? "rejected"
            : r.timedOut ? "timeout"
            : r.compileError ? "compile_error"
            : (r.exit !== 0 && r.exit !== undefined) ? "runtime_error"
            : "success",
      output: r.stdout || "",
      compileError: r.compileError || null,
      runtimeError: (r.exit !== 0 && r.stderr) ? r.stderr : (r.error || null),
      executionTime: r.ms == null ? null : r.ms
    });
  });
});

function available() {
  const out = {};
  for (const [k, v] of Object.entries(LANGS)) {
    const r = spawnSync(v.probe[0], v.probe.slice(1), { encoding: "utf8", timeout: 8000 });
    out[k] = r.status === 0;
  }
  return out;
}

server.listen(PORT, HOST, () => {
  const av = available();
  const ok = Object.keys(av).filter((k) => av[k]);
  const no = Object.keys(av).filter((k) => !av[k]);
  console.log("CodeRun 실행 서버: http://" + HOST + ":" + PORT);
  console.log("  사용 가능: " + (ok.join(", ") || "(없음)"));
  if (no.length) console.log("  없음: " + no.join(", ") + "  ← 해당 컴파일러를 설치하면 자동으로 켜집니다");
  console.log("  앱 설정의 '로컬 실행 서버' 에 위 주소를 넣으세요.");
});
