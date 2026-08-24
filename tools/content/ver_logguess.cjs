/* 데이터에 들어 있는 로그 문항 전체를 놓고 <b>찍어서 맞힐 길</b>을 잰다.

     node tools/content/ver_logguess.cjs            # 전체 요약
     node tools/content/ver_logguess.cjs --track    # 트랙별
     node tools/content/ver_logguess.cjs --list devops   # 고쳐야 할 문항 목록

   `ver_log.cjs` 는 새 배치 하나를 보지만, 이 도구는 <b>이미 실린 것</b>을 본다.
   로그를 읽지 않고도 통하는 규칙이 있으면 그 유형은 훈련이 되지 않는다.

     · 첫 WARN 이상   — 처음 나오는 경고 줄을 찍는다
     · 첫 WARN 직전   — 그 바로 앞 INFO 를 찍는다 (원인을 조용히 적은 문항의 뒷문)
     · 마지막 INFO    — 경고가 시작되기 전 마지막 평온한 줄
     · 최고 등급      — 가장 심각한 줄
     · 가장 긴 줄     — 설명이 길게 붙은 줄이 대개 원인이다
     · 자리           — 한 자리를 계속 찍는다

   기준선은 <b>줄 수의 역수</b>다. 7줄짜리면 아무 줄이나 찍어도 14% 는 맞는다.
   그보다 크게 높은 규칙이 남아 있으면 갚아야 할 빚이다. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const RANK = { DEBUG: 0, TRACE: 0, INFO: 1, NOTICE: 1, WARN: 2, WARNING: 2, ERROR: 3, CRIT: 3, FATAL: 4 };
const lv = t => {
  const m = String(t).match(/\b(INFO|DEBUG|TRACE|NOTICE|WARN|WARNING|ERROR|FATAL|CRIT)\b/);
  return m ? RANK[m[1]] : 1;
};

/* 눈에 보이는 길이로 잰다 — 한글·한자는 라틴 문자의 두 칸을 먹는다.
   글자 수로 재면 한글 60자 줄이 영문 100자 줄보다 짧아 보이지만, 화면에서는 더 길다. */
function width(s) {
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    w += (c >= 0x1100 && c <= 0x115F) || (c >= 0x2E80 && c <= 0xA4CF)
      || (c >= 0xAC00 && c <= 0xD7A3) || (c >= 0xF900 && c <= 0xFAFF)
      || (c >= 0xFE30 && c <= 0xFE6F) || (c >= 0xFF00 && c <= 0xFF60)
      || (c >= 0xFFE0 && c <= 0xFFE6) ? 2 : 1;
  }
  return w;
}

/* 규칙 하나하나가 '로그를 읽지 않고 고르는 방법' 이다. 고른 자리를 돌려준다. */
const RULES = {
  "첫 WARN 이상": L => L.findIndex(x => x >= 2),
  "첫 WARN 직전": L => { const i = L.findIndex(x => x >= 2); return i > 0 ? i - 1 : -1; },
  "마지막 INFO": L => { let k = -1; L.forEach((x, i) => { if (x <= 1) k = i; }); return k; },
  "최고 등급": L => L.indexOf(Math.max(...L)),
  "가장 긴 줄": (L, it) => { let k = 0; it.forEach((x, i) => { if (width(x.txt) > width(it[k].txt)) k = i; }); return k; },
  "가장 짧은 줄": (L, it) => { let k = 0; it.forEach((x, i) => { if (width(x.txt) < width(it[k].txt)) k = i; }); return k; },
};

function load() {
  const out = [];
  for (const f of fs.readdirSync(path.join(ROOT, "data")).filter(x => /^t-.*\.js$/.test(x)).sort()) {
    const raw = fs.readFileSync(path.join(ROOT, "data", f), "utf8");
    const a = raw.indexOf("["), z = raw.lastIndexOf("]");
    let i = 0;
    const walk = o => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== "object") return;
      if (o.t === "log" && Array.isArray(o.items)) out.push({ track: f.replace(/^t-|\.js$/g, ""), i: i++, q: o });
      for (const k in o) walk(o[k]);
    };
    walk(JSON.parse(raw.slice(a, z + 1)));
  }
  return out;
}

function score(rows) {
  const hit = {}, pos = {};
  let base = 0;
  Object.keys(RULES).forEach(k => hit[k] = 0);
  rows.forEach(({ q }) => {
    const it = q.items, L = it.map(x => lv(x.txt)), idx = it.findIndex(x => x.bad);
    base += 1 / it.length;
    pos[idx] = (pos[idx] || 0) + 1;
    Object.keys(RULES).forEach(k => { if (RULES[k](L, it) === idx) hit[k]++; });
  });
  const n = rows.length || 1;
  return { n, base: base / n, hit, pos, worstPos: Math.max(0, ...Object.values(pos)) / n };
}

const rows = load();
const pct = x => (x * 100).toFixed(1) + "%";

if (process.argv.includes("--list")) {
  const want = process.argv[process.argv.indexOf("--list") + 1];
  rows.filter(r => !want || r.track === want).forEach(({ track, i, q }) => {
    const it = q.items, L = it.map(x => lv(x.txt)), idx = it.findIndex(x => x.bad);
    const flags = Object.keys(RULES).filter(k => RULES[k](L, it) === idx);
    if (!flags.length) return;
    console.log(track + " #" + i + "  원인 " + idx + "/" + it.length + "  [" + flags.join(", ") + "]");
    console.log("    " + it[idx].txt);
  });
  process.exit(0);
}

if (process.argv.includes("--track")) {
  const by = {};
  rows.forEach(r => (by[r.track] = by[r.track] || []).push(r));
  const keys = Object.keys(RULES);
  console.log("트랙".padEnd(12) + "n".padStart(4) + "  기준선  " + keys.map(k => k.padStart(12)).join(""));
  Object.entries(by).sort((a, b) => b[1].length - a[1].length).forEach(([t, rs]) => {
    const s = score(rs);
    console.log(t.padEnd(12) + String(s.n).padStart(4) + pct(s.base).padStart(8) + "  "
      + keys.map(k => pct(s.hit[k] / s.n).padStart(12)).join(""));
  });
  console.log();
}

const s = score(rows);
console.log("로그 " + s.n + "문항 · 아무 줄이나 찍었을 때 " + pct(s.base));
Object.keys(RULES).forEach(k => {
  const r = s.hit[k] / s.n;
  console.log("  " + (r > s.base + 0.15 ? "✗" : "·") + " " + k.padEnd(14) + pct(r).padStart(7)
    + (r > s.base + 0.15 ? "   ← 읽지 않고도 통한다" : ""));
});
console.log("  " + (s.worstPos > 0.45 ? "✗" : "·") + " 한 자리".padEnd(14) + pct(s.worstPos).padStart(7)
  + "   " + JSON.stringify(s.pos));

/* 기준선 + 15%p 를 넘는 규칙이 하나라도 있으면 실패로 본다 */
const over = Object.keys(RULES).filter(k => s.hit[k] / s.n > s.base + 0.15);
if (over.length) console.log("\n갚아야 할 빚: " + over.join(" · "));
process.exit(over.length || s.worstPos > 0.45 ? 1 : 0);
