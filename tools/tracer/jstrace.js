/* CodeRun JavaScript 실행 추적기 — 진짜 엔진이 돈다. 해석기를 흉내 내지 않는다.

   방법: acorn 으로 실제 파싱한 뒤, 원문을 건드리지 않고 '틈' 에 탐침을 끼워 넣는다.
   기존 글자를 고쳐 쓰지 않으므로 사용자가 쓴 코드의 의미가 바뀌지 않는다.
   실행은 브라우저 자바스크립트 엔진이 그대로 한다.

   파이썬은 sys.settrace 라는 갈고리가 언어에 있어서 계측이 필요 없었다.
   자바스크립트에는 그런 게 없다. 그래서 소스에 표시를 남기는 방법뿐이고,
   그 표시를 남기려면 진짜 파서가 있어야 한다. 정규식으로 흉내 내면
   문자열·템플릿 리터럴·주석에서 반드시 틀린다.

   한계 (숨기지 않는다)
     · async/await·Promise 의 이어지는 실행은 잡지 못한다. 동기 흐름만 본다.
     · 화살표 함수의 식 본문(x => x*2)에는 단계가 생기지 않는다. 문장이 없다.
     · 클로저가 바깥에서 나중에 선언된 이름을 보는 경우는 변수 목록에서 빠진다. */
(function (root) {
  var SCHEMA = 1;
  var MAX_STEPS = 1000;
  var MAX_STR = 200, MAX_SEQ = 50, MAX_MAP = 30, MAX_REPR = 80, MAX_DEPTH = 60;

  /* ── 값의 모양 ─────────────────────────────────────────────────────────
     파이썬 추적기와 같은 태그를 쓴다. 뷰는 언어가 아니라 이 태그를 보고 그린다. */
  function brief(x) {
    try {
      if (typeof x === "string") return JSON.stringify(x.length > MAX_REPR ? x.slice(0, MAX_REPR) + "…" : x);
      if (x === undefined) return "undefined";
      if (x === null) return "null";
      if (typeof x === "function") return "함수 " + (x.name || "익명");
      if (typeof x === "object") {
        var s = Array.isArray(x) ? "[…]" : (x.constructor && x.constructor.name || "Object") + " {…}";
        return s;
      }
      var t = String(x);
      return t.length > MAX_REPR ? t.slice(0, MAX_REPR) + "…" : t;
    } catch (e) { return "<?>"; }
  }

  /* 출력용 표시. brief 는 변수 칸에 넣는 한 줄 축약이라 console.log 에는 못 쓴다 —
     […] 만 찍히면 무엇이 출력됐는지 알 수 없다. */
  function disp(x, d) {
    d = d || 0;
    try {
      if (typeof x === "string") return d ? JSON.stringify(x) : x;
      if (x === undefined) return "undefined";
      if (x === null) return "null";
      if (typeof x === "function") return "[함수 " + (x.name || "익명") + "]";
      if (d >= 2) return brief(x);
      if (Array.isArray(x)) return "[" + x.slice(0, MAX_SEQ).map(function (y) { return disp(y, d + 1); }).join(", ")
        + (x.length > MAX_SEQ ? ", …" : "") + "]";
      if (typeof x === "object") {
        var ks = Object.keys(x).slice(0, MAX_MAP);
        var nm = (x.constructor && x.constructor.name) || "Object";
        return (nm !== "Object" ? nm + " " : "") + "{ "
          + ks.map(function (k) { return k + ": " + disp(x[k], d + 1); }).join(", ")
          + (Object.keys(x).length > MAX_MAP ? ", …" : "") + " }";
      }
      return String(x);
    } catch (e) { return "<?>"; }
  }

  function shape(v, d) {
    d = d || 0;
    try {
      /* undefined 와 null 은 다르다. 초보자가 가장 많이 헷갈리는 곳이라 뭉개면 안 된다. */
      if (v === undefined) return { k: "obj", v: "undefined", t: "undefined" };
      if (v === null) return { k: "obj", v: "null", t: "null" };
      if (typeof v === "boolean") return { k: "bool", v: v };
      if (typeof v === "number") {
        if (!isFinite(v)) return { k: "obj", v: String(v), t: "number" };   // NaN · Infinity
        return Number.isInteger(v) ? { k: "int", v: v } : { k: "float", v: v };
      }
      if (typeof v === "bigint") return { k: "obj", v: String(v) + "n", t: "bigint" };
      if (typeof v === "string") return { k: "str", v: v.slice(0, MAX_STR), n: v.length, cut: v.length > MAX_STR };
      if (typeof v === "symbol") return { k: "obj", v: String(v), t: "symbol" };
      if (typeof v === "function") return { k: "fn", v: v.name || "익명" };
      if (Array.isArray(v)) return { k: "list", v: v.slice(0, MAX_SEQ).map(brief), n: v.length, cut: v.length > MAX_SEQ };
      if (typeof Set !== "undefined" && v instanceof Set) {
        var sa = []; v.forEach(function (x) { if (sa.length < MAX_SEQ) sa.push(brief(x)); });
        return { k: "set", v: sa, n: v.size, cut: v.size > MAX_SEQ };
      }
      if (typeof Map !== "undefined" && v instanceof Map) {
        var ma = []; v.forEach(function (val, key) { if (ma.length < MAX_MAP) ma.push([brief(key), brief(val)]); });
        return { k: "dict", v: ma, n: v.size, cut: v.size > MAX_MAP };
      }
      if (typeof v === "object") {
        if (d > 0) return { k: "obj", v: brief(v), t: (v.constructor && v.constructor.name) || "Object" };
        var ks = Object.keys(v), pr = ks.slice(0, MAX_MAP).map(function (k) { return [k, brief(v[k])]; });
        var name = (v.constructor && v.constructor.name) || "Object";
        if (name !== "Object") return { k: "obj", v: name + " {" + pr.map(function (p) { return p[0] + ": " + p[1]; }).join(", ") + "}", t: name };
        return { k: "dict", v: pr, n: ks.length, cut: ks.length > MAX_MAP };
      }
      return { k: "obj", v: brief(v), t: typeof v };
    } catch (e) { return { k: "obj", v: "<표현할 수 없음>", t: "?" }; }
  }

  /* ── 계측 ─────────────────────────────────────────────────────────────
     원문에 '끼워 넣기' 만 한다. 지우거나 바꾸지 않는다. */
  function names(pat, out) {
    if (!pat) return out;
    if (pat.type === "Identifier") out.push(pat.name);
    else if (pat.type === "ObjectPattern") pat.properties.forEach(function (p) {
      names(p.type === "RestElement" ? p.argument : p.value, out);
    });
    else if (pat.type === "ArrayPattern") pat.elements.forEach(function (e) { names(e, out); });
    else if (pat.type === "AssignmentPattern") names(pat.left, out);
    else if (pat.type === "RestElement") names(pat.argument, out);
    return out;
  }

  var FN = { FunctionDeclaration: 1, FunctionExpression: 1, ArrowFunctionExpression: 1 };
  var BODY1 = { IfStatement: ["consequent", "alternate"], ForStatement: ["body"], ForInStatement: ["body"],
                ForOfStatement: ["body"], WhileStatement: ["body"], DoWhileStatement: ["body"],
                LabeledStatement: ["body"] };

  function instrument(src, acorn) {
    var ast = acorn.parse(src, { ecmaVersion: 2022, locations: true, allowReturnOutsideFunction: false });
    var ins = [];                       // {at, text} — 끼워 넣을 자리
    var put = function (at, text) { ins.push({ at: at, text: text }); };

    /* 스코프: 지금 이 자리에서 '이미 선언이 지나간' 이름만 넘긴다.
       let/const 는 선언 전에 건드리면 던지므로(TDZ), 위치를 봐야 한다. */
    function walk(node, scopes) {
      if (!node || typeof node.type !== "string") return;

      if (FN[node.type]) {
        var sc = { start: node.start, decl: [], all: {}, fn: true };
        (node.params || []).forEach(function (p) { names(p, []).forEach(function (n) { sc.decl.push({ n: n, at: node.start }); }); });
        var body = node.body;
        if (body && body.type === "BlockStatement") {
          var nm = (node.id && node.id.name) || (node.type === "ArrowFunctionExpression" ? "화살표 함수" : "익명 함수");
          var args = (node.params || []).map(function (p) { return names(p, []).join(","); }).filter(Boolean);
          put(body.start + 1, "__cr$c(" + JSON.stringify(nm) + ",[" + args.join(",") + "]," + node.loc.start.line + ");try{");
          put(body.end - 1, "}finally{__cr$e();}");
          walkBody(body, scopes.concat([sc]), sc);
        } else {
          walk(body, scopes.concat([sc]));      // 식 본문 화살표 — 문장이 없어 단계가 없다
        }
        return;
      }

      if (node.type === "Program" || node.type === "BlockStatement") { walkBody(node, scopes); return; }

      if (node.type === "ReturnStatement" && node.argument) {
        put(node.argument.start, "__cr$r(");
        put(node.argument.end, "," + node.loc.start.line + ")");
      }

      /* 중괄호 없는 본문은 중괄호를 씌운다 — 그래야 그 안에 단계를 넣을 수 있고,
         본문이 비어 있는 무한 루프도 상한에 걸린다. */
      var slots = BODY1[node.type];
      if (slots) slots.forEach(function (key) {
        var b = node[key];
        if (b && b.type !== "BlockStatement" && b.type !== "IfStatement") {
          put(b.start, "{"); put(b.end, "}");
          put(b.start, probeText(b.loc.start.line, b.start, scopes));
        }
      });

      for (var k in node) {
        if (k === "type" || k === "loc" || k === "start" || k === "end") continue;
        var v = node[k];
        if (Array.isArray(v)) v.forEach(function (c) { if (c && c.type) walk(c, scopes); });
        else if (v && typeof v === "object" && v.type) walk(v, scopes);
      }
    }

    /* 안쪽 스코프부터 훑는다. 안쪽이 같은 이름을 쓰면 바깥 것은 가려진 것이므로 빼야 한다 —
       안 그러면 { let a = 2 } 안에서 바깥 a 를 읽으려다 TDZ 로 던진다. */
    function probeText(line, pos, scopes) {
      var seen = {}, parts = [];
      for (var i = scopes.length - 1; i >= 0; i--) {
        var sc = scopes[i];
        sc.decl.forEach(function (d) {
          if (d.at < pos && !seen[d.n]) { seen[d.n] = 1; parts.push(JSON.stringify(d.n) + ":" + d.n); }
        });
        for (var nm in sc.all) seen[nm] = 1;      // 이 스코프가 쓰는 이름은 바깥을 가린다
      }
      return "__cr$(" + line + ",{" + parts.join(",") + "});";
    }

    function declared(stmt) {
      if (stmt.type === "VariableDeclaration") {
        var out = [];
        stmt.declarations.forEach(function (d) { names(d.id, out); });
        return { kind: stmt.kind, list: out };
      }
      if ((stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") && stmt.id)
        return { kind: stmt.type === "FunctionDeclaration" ? "fn" : "class", list: [stmt.id.name] };
      return null;
    }

    function walkBody(block, scopes, own) {
      /* 블록마다 스코프를 따로 둔다. 함수 본문은 이미 만들어 둔 함수 스코프를 쓴다. */
      var sc = own || { start: block.start, decl: [], all: {}, fn: false };
      if (!own) scopes = scopes.concat([sc]);
      var body = block.body || [];

      /* 이 블록이 앞으로 선언할 이름을 먼저 모아 둔다 — 가림 판정에 쓴다 */
      body.forEach(function (stmt) {
        var d = declared(stmt);
        if (!d) return;
        if (d.kind === "var") { for (var i = scopes.length - 1; i >= 0; i--) if (scopes[i].fn || i === 0) { d.list.forEach(function (n) { scopes[i].all[n] = 1; }); break; } }
        else d.list.forEach(function (n) { sc.all[n] = 1; });
      });

      /* 본문이 비어 있어도 단계는 하나 넣는다 — while(true){} 가 상한에 걸리게 하려면 필요하다 */
      if (!body.length && block.type === "BlockStatement")
        put(block.start + 1, probeText(block.loc.start.line, block.start, scopes));

      body.forEach(function (stmt) {
        put(stmt.start, probeText(stmt.loc.start.line, stmt.start, scopes));
        var d = declared(stmt);
        if (d) {
          /* 선언은 '이 문장이 끝난 뒤부터' 보이는 것으로 친다. 함수 선언은 끌어올려진다. */
          var at = (d.kind === "fn") ? stmt.start : stmt.end;
          var target = sc;
          if (d.kind === "var") for (var i = scopes.length - 1; i >= 0; i--) if (scopes[i].fn || i === 0) { target = scopes[i]; break; }
          d.list.forEach(function (n) { target.decl.push({ n: n, at: at }); });
        }
        walk(stmt, scopes);
      });
    }

    var top = { start: 0, decl: [], all: {}, fn: true };
    walkBody(ast, [top], top);
    /* 탐침은 문장을 실행하기 '전' 에 온다. 그래서 마지막 문장의 효과는 어떤 단계에도
       담기지 않는다 — 끝에 한 단계를 더 만들어 채운다. 파이썬 추적기와 같은 이유다. */
    var lastLn = src.replace(/\s+$/, "").split("\n").length;
    var tail = top.decl.map(function (d) { return JSON.stringify(d.n) + ":" + d.n; });
    put(ast.end, ";__cr$(" + lastLn + ",{" + tail.join(",") + "});");

    /* 뒤에서부터 끼워 넣어야 앞쪽 위치가 밀리지 않는다.
       같은 자리에 여러 개면 넣은 순서를 지킨다(중괄호 → 탐침). */
    ins.forEach(function (x, i) { x.i = i; });
    ins.sort(function (a, b) { return (b.at - a.at) || (b.i - a.i); });
    var out = src;
    ins.forEach(function (x) { out = out.slice(0, x.at) + x.text + out.slice(x.at); });
    return out;
  }

  /* ── 본체 ─────────────────────────────────────────────────────────── */
  function traceJs(src, opts) {
    opts = opts || {};
    var acorn = opts.acorn || root.acorn;
    var t0 = (opts.now != null) ? opts.now : Date.now();
    var maxSteps = opts.maxSteps || MAX_STEPS;
    var events = [], s = -1, n = 0, cut = false, err = null, out = "";
    var depth = 0, prev = [{}];
    var CUT = { __crCut: 1 };

    function base() {
      return { v: SCHEMA, run: opts.runId || ("r-js-" + t0.toString(16)), lang: "javascript",
               at: t0, src: src, ctx: opts.ctx || null, events: events, steps: n,
               out: out, err: err, cut: cut, ms: (opts.now != null) ? 0 : Date.now() - t0 };
    }

    var code;
    try { code = instrument(src, acorn); }
    catch (e) {
      err = { type: "SyntaxError", msg: String(e && e.message || e).slice(0, MAX_STR),
              line: (e && e.loc && e.loc.line) || 0 };
      return base();
    }

    function open(line, fn, d) {
      if (n >= maxSteps) { cut = true; throw CUT; }
      s = n; n++;
      events.push({ s: s, e: "step", line: line, fn: fn, d: d });
    }
    function add(ev) { ev.s = s; events.push(ev); }

    function probe(line, vars) {
      open(line, depth ? (prev[depth] && prev[depth].__fn) || "함수" : "<module>", depth);
      var old = prev[depth] || {}, cur = {};
      for (var k in vars) cur[k] = shape(vars[k]);
      for (var k2 in cur) {
        var was = old[k2];
        if (!was || JSON.stringify(was) !== JSON.stringify(cur[k2])) {
          var ev = { e: "set", name: k2, to: cur[k2] };
          if (was) ev.from = was;
          add(ev);
        }
      }
      for (var k3 in old) if (k3 !== "__fn" && !(k3 in cur)) add({ e: "del", name: k3 });
      cur.__fn = old.__fn;
      prev[depth] = cur;
    }
    function enter(name, args, line) {
      if (depth >= MAX_DEPTH) { cut = true; throw CUT; }
      depth++;
      prev[depth] = { __fn: name };
      open(line, name, depth);
      add({ e: "call", name: name, args: args.map(function (a) { return shape(a); }) });
    }
    function leave() { prev[depth] = null; depth = Math.max(0, depth - 1); }
    function ret(v, line) {
      try { open(line, (prev[depth] && prev[depth].__fn) || "함수", depth); add({ e: "ret", to: shape(v) }); }
      catch (e) { if (e !== CUT) throw e; }
      return v;
    }

    var log = function () {
      var t = Array.prototype.map.call(arguments, function (a) { return disp(a, 0); }).join(" ") + "\n";
      out += t;
      try { add({ e: "out", text: t.slice(0, MAX_STR * 8) }); } catch (e) { /* 단계 밖 출력은 버린다 */ }
    };
    var con = { log: log, info: log, warn: log, error: log, debug: log };

    try {
      var f = new Function("__cr$", "__cr$c", "__cr$e", "__cr$r", "console", code);
      f(probe, enter, leave, ret, con);
    } catch (e) {
      if (e === CUT) { /* 상한 — cut 으로 이미 표시했다 */ }
      else {
        var name = (e && e.name) || "Error";
        var msg = String((e && e.message) || e).slice(0, MAX_STR);
        var ln = 0;
        for (var i = events.length - 1; i >= 0; i--) if (events[i].e === "step") { ln = events[i].line; break; }
        err = { type: name, msg: msg, line: ln };
        try { add({ e: "throw", name: name, msg: msg }); } catch (e2) { /* 무시 */ }
      }
    }
    return base();
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { traceJs: traceJs, instrument: instrument };
  else if (typeof root.__CR === "function") root.__CR("jsTracer", traceJs);
  else root.traceJs = traceJs;
})(typeof globalThis !== "undefined" ? globalThis : this);
