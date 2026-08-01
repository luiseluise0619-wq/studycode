/* CodeRun SQL 실행 추적기 — 쿼리가 행을 어떻게 내놓고 표를 어떻게 바꾸는지 기록한다.

   파이썬 추적기와 같은 봉투(스키마 v1)를 만든다. 화면은 언어를 모른다 — 모양만 본다.

   설계
     · 문장 나누기·행 뽑기를 손으로 하지 않는다. SQLite 엔진이 한 것을 그대로 적는다.
       (iterateStatements · stmt.step() — 가짜 파서로 SQL 의미를 왜곡하지 않는다)
     · SELECT 는 행 하나가 한 단계다. 슬라이더를 넘기면 행이 하나씩 나온다.
     · INSERT·UPDATE·DELETE 는 표 전체를 앞뒤로 찍어 비교한다. rowid 로 맞추므로
       수정이 '지우고 새로 넣기' 로 보이지 않는다.
     · 상한을 지킨다. 교육용 표는 작지만, 사용자가 무엇을 넣을지는 모른다.

   브라우저와 Node 양쪽에서 돈다 — Node 에서 진짜 SQLite 로 검증할 수 있어야 한다. */
(function (root) {
  var SCHEMA = 1;
  var MAX_STEPS = 1000;
  var MAX_ROWS = 200;      // 표 하나를 앞뒤로 비교할 때의 상한
  var MAX_COLS = 30;
  var MAX_STR = 200;
  var MAX_PLAN = 400;

  function brief(v) {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "string") return "'" + (v.length > 80 ? v.slice(0, 80) + "…" : v) + "'";
    if (v instanceof Uint8Array) return "<이진 " + v.length + "바이트>";
    return String(v);
  }

  /* 행 하나를 값의 '모양' 으로. 뷰는 이 모양만 보고 그린다 — SQL 인 줄 모른다. */
  function rowShape(cols, vals) {
    var n = Math.min(cols.length, MAX_COLS), pairs = [];
    for (var i = 0; i < n; i++) pairs.push([String(cols[i]), brief(vals[i])]);
    return { k: "dict", v: pairs, n: cols.length, cut: cols.length > MAX_COLS };
  }

  function tables(db) {
    var out = [];
    try {
      var r = db.exec("select name from sqlite_master where type='table' and name not like 'sqlite_%'");
      if (r.length) r[0].values.forEach(function (v) { out.push(v[0]); });
    } catch (e) { /* 표가 없으면 비교할 것도 없다 */ }
    return out;
  }

  /* rowid 로 표를 찍는다. rowid 가 없는 표(WITHOUT ROWID)는 값 자체를 열쇠로 쓴다. */
  function snap(db, name) {
    var q = 'select rowid as __rid, * from "' + name.replace(/"/g, '""') + '" limit ' + (MAX_ROWS + 1);
    var res;
    try { res = db.exec(q); }
    catch (e) {
      try { res = db.exec('select * from "' + name.replace(/"/g, '""') + '" limit ' + (MAX_ROWS + 1)); }
      catch (e2) { return null; }
    }
    if (!res.length) return { cols: [], rows: {}, n: 0, cut: false };
    var cols = res[0].columns, vals = res[0].values;
    var hasRid = cols[0] === "__rid";
    var cut = vals.length > MAX_ROWS;
    if (cut) vals = vals.slice(0, MAX_ROWS);
    var rows = {};
    vals.forEach(function (v, i) {
      var key = hasRid ? "r" + v[0] : "v" + JSON.stringify(v);
      rows[key] = hasRid ? v.slice(1) : v;
    });
    return { cols: hasRid ? cols.slice(1) : cols, rows: rows, n: vals.length, cut: cut };
  }

  function snapAll(db) {
    var out = {};
    tables(db).forEach(function (t) { var s = snap(db, t); if (s) out[t] = s; });
    return out;
  }

  /* 앞뒤 사진을 비교해 ins·upd·del 을 만든다. 같은 rowid 인데 값이 다르면 수정이다. */
  function diff(before, after) {
    var evs = [];
    Object.keys(after).forEach(function (t) {
      var a = after[t], b = before[t];
      if (!b) { /* 이번에 생긴 표 — 행 전부가 새로 들어온 것이다 */
        Object.keys(a.rows).forEach(function (k) {
          evs.push({ e: "row", table: t, op: "ins", to: rowShape(a.cols, a.rows[k]) });
        });
        return;
      }
      Object.keys(a.rows).forEach(function (k) {
        if (!(k in b.rows)) evs.push({ e: "row", table: t, op: "ins", to: rowShape(a.cols, a.rows[k]) });
        else if (JSON.stringify(b.rows[k]) !== JSON.stringify(a.rows[k]))
          evs.push({ e: "row", table: t, op: "upd", from: rowShape(b.cols, b.rows[k]), to: rowShape(a.cols, a.rows[k]) });
      });
      Object.keys(b.rows).forEach(function (k) {
        if (!(k in a.rows)) evs.push({ e: "row", table: t, op: "del", to: rowShape(b.cols, b.rows[k]) });
      });
    });
    Object.keys(before).forEach(function (t) {
      if (t in after) return;
      Object.keys(before[t].rows).forEach(function (k) {
        evs.push({ e: "row", table: t, op: "del", to: rowShape(before[t].cols, before[t].rows[k]) });
      });
    });
    return evs;
  }

  function kindOf(sql) {
    var m = /^\s*(--[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*([a-z]+)/i.exec(sql);
    return m ? m[2].toUpperCase() : "SQL";
  }

  function plan(db, sql) {
    try {
      var r = db.exec("EXPLAIN QUERY PLAN " + sql);
      if (!r.length) return "";
      var last = r[0].columns.length - 1;
      return r[0].values.map(function (v) { return String(v[last]); }).join("\n").slice(0, MAX_PLAN);
    } catch (e) { return ""; }
  }

  /* 본체. SQL 은 sql.js 인스턴스, schema 는 미리 깔아 두는 표(추적하지 않는다). */
  function traceSql(SQL, schema, sql, opts) {
    opts = opts || {};
    var t0 = (opts.now != null) ? opts.now : Date.now();
    var maxSteps = opts.maxSteps || MAX_STEPS;
    var events = [], s = -1, n = 0, cut = false, err = null, out = "";

    function open(line, fn, d) {
      if (n >= maxSteps) { cut = true; return false; }
      s = n; n++;
      events.push({ s: s, e: "step", line: line, fn: fn, d: d });
      return true;
    }
    function add(ev) { ev.s = s; events.push(ev); }

    var db = null;
    try {
      db = new SQL.Database();
      if (schema) db.run(schema);          // 주어진 표는 무대 장치다 — 추적 대상이 아니다

      /* 문장 나누기는 SQLite 가 한다. 그 원문 길이로 줄 번호를 센다. */
      var consumed = 0;
      var it = db.iterateStatements(sql);
      var st;
      while (true) {
        var nx;
        try { nx = it.next(); } catch (e) { throw e; }
        if (nx.done) break;
        st = nx.value;
        var raw = st.getSQL();
        var line = sql.slice(0, consumed + (raw.length - raw.replace(/^\s+/, "").length)).split("\n").length;
        consumed += raw.length;
        var body = raw.trim();
        if (!body || body === ";") continue;
        var kind = kindOf(body);

        if (!open(line, kind, 0)) break;
        var p = (kind === "SELECT" || kind === "WITH") ? plan(db, body.replace(/;\s*$/, "")) : "";
        if (p) add({ e: "out", text: p + "\n" });

        var before = snapAll(db);
        var cols = null, produced = 0, stop = false;
        while (st.step()) {
          if (!cols) cols = st.getColumnNames();
          var vals = st.get();
          produced++;
          if (!open(line, "행 " + produced, 1)) { stop = true; break; }
          add({ e: "row", table: "결과", op: "scan", to: rowShape(cols, vals) });
        }
        if (stop) break;
        if (produced === 0 && (kind === "SELECT" || kind === "WITH")) {
          if (!open(line, "행 없음", 1)) break;
          add({ e: "out", text: "조건에 맞는 행이 없습니다.\n" });
        }
        out += produced ? (produced + "행\n") : "";

        var changes = diff(before, snapAll(db));
        if (changes.length) {
          if (!open(line, "표 변화", 1)) break;
          changes.slice(0, 100).forEach(add);
          if (changes.length > 100) { cut = true; add({ e: "out", text: "… " + (changes.length - 100) + "건 더\n" }); }
        }
      }
    } catch (e) {
      var msg = String((e && e.message) || e).slice(0, MAX_STR);
      err = { type: "SQLError", msg: msg, line: s >= 0 ? lineOfStep(events, s) : 1 };
      if (s < 0) open(1, "SQL", 0);
      add({ e: "throw", name: "SQLError", msg: msg });
    }
    try { if (db) db.close(); } catch (e2) { /* 닫기 실패가 결과를 막지 않는다 */ }

    return {
      v: SCHEMA, run: opts.runId || ("r-sql-" + t0.toString(16)), lang: "sql",
      at: t0, src: sql, ctx: opts.ctx || null, events: events, steps: n,
      out: out, err: err, cut: cut, ms: ((opts.now != null) ? 0 : Date.now() - t0)
    };
  }

  function lineOfStep(events, s) {
    for (var i = events.length - 1; i >= 0; i--)
      if (events[i].e === "step" && events[i].s === s) return events[i].line;
    return 1;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { traceSql: traceSql };
  else if (typeof root.__CR === "function") root.__CR("sqlTracer", traceSql);
  else root.traceSql = traceSql;
})(typeof globalThis !== "undefined" ? globalThis : this);
