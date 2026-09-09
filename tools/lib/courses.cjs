/* 셸(index.html)의 COURSES 개요를 읽고 쓴다.

   개요는 셸 안에 압축된 꼴로 들어 있다 — 셸이 640KB 상한에 6KB 남았을 때(70차)
   키 이름을 줄이고 xp 를 유닛에 한 번만 적도록 바꿔 30KB 를 벌었다.

     셸에 적힌 꼴   {"python":{"name":…,"u":[{"t":"유닛","x":30,"guide":…,"l":[{"t":"레슨","n":7},{"t":…,"x":40,"n":5}]}]}}
     앱이 쓰는 꼴   {"python":{"name":…,"units":[{"title":"유닛","guide":…,"lessons":[{"title":"레슨","xp":30,"n":7},…]}]}}

   셸은 __expandCourses() 로 읽자마자 펼치므로 앱 코드는 옛 꼴 그대로 쓴다.
   도구는 이 파일로 읽고 쓴다 — 읽으면 앱이 쓰는 꼴이 나오고, 쓰면 압축된 꼴로 들어간다.

     const {readCourses, writeCourses} = require("../lib/courses.cjs");
     const g = readCourses(html);        // {obj, start, end}  obj 는 앱이 쓰는 꼴
     g.obj.python.units.push(…);
     html = writeCourses(html, g.obj, g); // 압축해서 같은 자리에 넣는다

   옛 꼴(펼쳐진 JSON)이 들어 있는 셸도 읽는다 — 브랜치를 오갈 때 깨지지 않게. */
"use strict";

const MARK = "const COURSES = ";

/* 트랙·유닛·레슨의 정해진 키 말고는 그대로 옮긴다(guide, em 같은 것) */
function rest(o, skip) { const r = {}; for (const k in o) if (skip.indexOf(k) < 0) r[k] = o[k]; return r; }

function compact(full) {
  const out = {};
  for (const k in full) {
    const t = full[k];
    const d = rest(t, ["units"]);
    d.u = (t.units || []).map(u => {
      const xs = new Set((u.lessons || []).map(l => l.xp));
      const one = xs.size === 1 ? u.lessons[0].xp : undefined;
      const cu = { t: u.title };
      if (one !== undefined) cu.x = one;
      Object.assign(cu, rest(u, ["title", "lessons"]));
      cu.l = (u.lessons || []).map(l => {
        const cl = { t: l.title };
        if (one === undefined && l.xp !== undefined) cl.x = l.xp;
        if (l.n !== undefined) cl.n = l.n;
        Object.assign(cl, rest(l, ["title", "xp", "n"]));
        return cl;
      });
      return cu;
    });
    out[k] = d;
  }
  return out;
}

function expand(c) {
  const out = {};
  for (const k in c) {
    const t = c[k];
    if (t.units) { out[k] = t; continue; }           /* 이미 펼쳐진 꼴 */
    const d = rest(t, ["u"]);
    d.units = (t.u || []).map(u => {
      const nu = { title: u.t };
      Object.assign(nu, rest(u, ["t", "x", "l"]));
      nu.lessons = (u.l || []).map(l => {
        const nl = { title: l.t };
        const xp = l.x !== undefined ? l.x : u.x;
        if (xp !== undefined) nl.xp = xp;
        if (l.n !== undefined) nl.n = l.n;
        Object.assign(nl, rest(l, ["t", "x", "n"]));
        return nl;
      });
      return nu;
    });
    out[k] = d;
  }
  return out;
}

/* MARK 뒤 첫 '{' 에서 짝이 맞는 '}' 까지 — 문자열 안의 괄호는 세지 않는다 */
function locate(html) {
  const m = html.indexOf(MARK);
  if (m < 0) throw new Error("셸에서 COURSES 를 못 찾았다");
  const start = html.indexOf("{", m);
  let d = 0, ins = false, esc = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (ins) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') ins = false; continue; }
    if (ch === '"') { ins = true; continue; }
    if (ch === "{") d++;
    else if (ch === "}") { d--; if (!d) return { start, end: i }; }
  }
  throw new Error("COURSES 의 닫는 괄호를 못 찾았다");
}

function readCourses(html) {
  const p = locate(html);
  return { start: p.start, end: p.end, obj: expand(JSON.parse(html.slice(p.start, p.end + 1))) };
}

function writeCourses(html, obj, pos) {
  pos = pos || locate(html);
  const json = JSON.stringify(compact(obj));
  if (JSON.stringify(expand(JSON.parse(json))) !== JSON.stringify(expand(compact(obj))))
    throw new Error("COURSES 왕복 검증 실패");
  return html.slice(0, pos.start) + json + html.slice(pos.end + 1);
}

module.exports = { MARK, compact, expand, locate, readCourses, writeCourses };
