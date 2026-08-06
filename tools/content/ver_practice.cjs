/* 실습 문항 검증 — 기계가 확인한 것만 쓴다.

   두 가지를 본다. 둘 다 필요하다.
     1. 정답(sol)이 모든 테스트를 통과하는가
     2. 시작 코드(src)가 최소 하나를 틀리는가
   2번이 없으면 '아무것도 안 해도 통과하는 문제' 다. 그건 실습이 아니다.

     node tools/content/ver_practice.cjs <content.js> <py|js|sql> */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..");
const GROUPS = require(path.resolve(process.argv[2]));
/* 문제 본문은 q 또는 qq 로 온다 — 유형마다 필드 이름이 갈렸다 */
const LANG = process.argv[3] || "py";

function runPy(code, tests) {
  const prog = code + "\n\nimport json\n__T=" + JSON.stringify(tests) + "\n__r=[]\n"
    + "for __i,__o in __T:\n"
    + "    try:\n        __g=eval(__i); __e=eval(__o); __r.append(bool(__g==__e))\n"
    + "    except Exception as __ex:\n        __r.append('ERR: '+str(__ex))\n"
    + "print(json.dumps(__r))";
  const f = path.join(os.tmpdir(), "cr_ver_" + process.pid + ".py");
  fs.writeFileSync(f, prog);
  try {
    const out = execFileSync("python3", [f], { encoding: "utf8", timeout: 20000 });
    return JSON.parse(out.trim().split("\n").pop());
  } catch (e) {
    return tests.map(() => "ERR: " + String(e.message).slice(0, 120));
  } finally { try { fs.unlinkSync(f); } catch (_) {} }
}

function runJs(code, tests) {
  /* 앱 채점기와 같은 규칙으로 판정한다. 앱은 프라미스를 기다렸다 비교하는데
     여기서만 그대로 견주면, 멀쩡한 async 정답이 전부 실패로 나온다.
     실제로 그랬다 — 앱만 고치고 검사기를 안 고쳐서 8문항이 되돌아왔다. */
  const prog = code + "\n\nconst __T=" + JSON.stringify(tests) + ";const __r=[];\n"
    + "function __eq(a,b){try{return JSON.stringify(a)===JSON.stringify(b);}catch(e){return String(a)===String(b);}}\n"
    + "function __wait(v){if(!v||typeof v.then!=='function')return Promise.resolve(v);\n"
    + "return Promise.race([v,new Promise((_,rj)=>setTimeout(()=>rj(new Error('시간 초과')),3000))]);}\n"
    + "(async()=>{ for(const [i,o] of __T){ try{ const g=await __wait(eval(i)); const e2=await __wait(eval('('+o+')')); __r.push(__eq(g,e2)); }catch(e){ __r.push('ERR: '+e.message); } }\n"
    + "console.log(JSON.stringify(__r)); })();";
  const f = path.join(os.tmpdir(), "cr_ver_" + process.pid + ".js");
  fs.writeFileSync(f, prog);
  try {
    const out = execFileSync("node", [f], { encoding: "utf8", timeout: 20000 });
    return JSON.parse(out.trim().split("\n").pop());
  } catch (e) {
    return tests.map(() => "ERR: " + String(e.message).slice(0, 120));
  } finally { try { fs.unlinkSync(f); } catch (_) {} }
}

let SQL = null;
function sqlRows(schema, query) {
  const db = new SQL.Database();
  try { if (schema) db.run(schema); const r = db.exec(query); db.close();
    return r.length ? { cols: r[0].columns, rows: r[0].values } : { cols: [], rows: [] };
  } catch (e) { try { db.close(); } catch (_) {} return { err: String(e.message || e) }; }
}

async function main() {
  if (LANG === "sql") {
    global.window = global; global.self = global;
    require(path.join(ROOT, "data", "sql-wasm.js"));
    const lib = require(path.join(ROOT, "data", "sql-lib.js"));
    global.initSqlJs = lib.default || lib;
    SQL = await window.ensureSql();
  }

  const bad = [];
  let n = 0;
  GROUPS.forEach(g => {
    g.q.forEach(x => {
      n++;
      if (LANG === "sql") {
        const want = sqlRows(x.schema, x.sol);
        if (want.err) { bad.push(x.k + ": 정답 쿼리 오류 — " + want.err); return; }
        if (!want.rows.length) { bad.push(x.k + ": 정답 쿼리가 0행 — 맞았는지 알 수 없다"); return; }
        const got = sqlRows(x.schema, x.src);
        const key = r => r.err ? "ERR" : JSON.stringify(x.ordered ? r.rows : r.rows.map(v => JSON.stringify(v)).sort());
        if (key(got) === key(want)) bad.push(x.k + ": 시작 쿼리가 이미 정답이다");
        return;
      }
      const tests = (x.tests || []).concat(x.edge || []);
      const run = LANG === "py" ? runPy : runJs;
      const okSol = run(x.sol, tests);
      const failSol = okSol.map((v, i) => v === true ? null : (tests[i][0] + " → " + v)).filter(Boolean);
      if (failSol.length) { bad.push(x.k + ": 정답이 통과하지 못한다 — " + failSol.slice(0, 2).join(" / ")); return; }
      const okSrc = run(x.src, tests);
      if (okSrc.every(v => v === true))
        bad.push(x.k + ": 시작 코드가 이미 전부 통과한다 — 고칠 것이 없는 문제다");
    });
  });

  console.log("검사 " + n + "문항 · 레슨 " + GROUPS.length + "개");
  if (bad.length) { bad.forEach(b => console.log("  ✗ " + b)); console.log("\n" + bad.length + "건 실패 — 주입하지 않는다"); process.exit(1); }
  console.log("전부 통과 — 정답은 다 맞고, 시작 코드는 반드시 하나 이상 틀린다");
}
main();
