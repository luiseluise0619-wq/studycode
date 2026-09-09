/* 저장소 전수 점검 — 테스트가 보지 않는 자리를 훑는다.

   app.test.cjs 는 비율·눈금·구조를 본다. 이 도구는 그 아래를 본다 —
   깨진 태그, 빈 레슨, 같은 문항이 두 곳에 있는 것처럼
   '있으면 학습자 화면에서만 드러나는' 것들이다.

   경고는 적을수록 좋다. 늑대를 외치는 점검기는 없는 것만 못하므로,
   규약이 아닌 것(k 중복 같은)은 일부러 보지 않는다.

   사용: node tools/content/audit_all.cjs [--full] [--info] */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const DATA = path.join(ROOT, "data");
const FULL = process.argv.indexOf("--full") >= 0;
const INFO = process.argv.indexOf("--info") >= 0;

const norm = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const strip = s => String(s == null ? "" : s).replace(/<[^>]*>/g, "");
/* 앱이 단답을 맞힐 때 쓰는 규칙과 같다(index.html 의 norm) */
const ansNorm = s => String(s == null ? "" : s).toLowerCase().replace(/\s+/g, "").replace(/;$/, "");

const tracks = {};
for (const f of fs.readdirSync(DATA).filter(x => /^t-.*\.js$/.test(x)).sort()) {
  const raw = fs.readFileSync(path.join(DATA, f), "utf8");
  tracks[f.replace(/^t-|\.js$/g, "")] =
    JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1));
}

const err = {}, info = {};
const hit = (kind, where) => { (err[kind] = err[kind] || []).push(where); };
const note = (kind, where) => { (info[kind] = info[kind] || []).push(where); };

/* 여는 태그와 닫는 태그의 수가 맞는지.
   `<b>` 와 `<b class=…>` 를 한 번만 세도록 하나의 정규식으로 잡는다. */
const PAIRED = ["b", "code", "i", "em", "strong", "u", "small", "pre"];
function tagBalance(s, where) {
  const text = String(s == null ? "" : s);
  if (!text) return;
  PAIRED.forEach(t => {
    const open = (text.match(new RegExp("<" + t + "(?:\\s[^>]*)?>", "gi")) || []).length;
    const close = (text.match(new RegExp("</" + t + "\\s*>", "gi")) || []).length;
    if (open !== close) hit("태그 짝이 안 맞는다", where + "  <" + t + "> 열림 " + open + " / 닫힘 " + close);
  });
}

/* 문항이 정말 같은지는 질문만으로 판단하지 않는다 — 리뷰·로그처럼
   질문 문구가 정형인 유형이 많아 오탐이 난다. 보기·정답까지 함께 본다. */
function fingerprint(q) {
  const t = q.t || "choice";
  /* 질문 문구가 '아래 코드의 출력값은?' 처럼 정형인 문항이 많다. 실제로 무엇을
     묻는지는 함께 보여 주는 코드에 있으므로 그것까지 지문에 넣는다. */
  const payload = norm(q.code) + "|" + norm(q.src) + "|" + norm(q.expect);
  if (t === "choice") return "c|" + norm(q.q) + "|" + payload + "|" + (q.o || []).map(norm).sort().join("|");
  if (t === "input") return "i|" + norm(q.q) + "|" + payload + "|" + (q.a || []).map(ansNorm).sort().join("|");
  return null;   // 그 밖의 유형은 페이로드가 따로 있어 이 방식으로 못 견준다
}

const seen = new Map();
let nq = 0;

Object.keys(tracks).forEach(tk => {
  const unitTitles = new Set();
  tracks[tk].forEach((u, ui) => {
    const uw = tk + " / " + u.t;
    if (!u.t) hit("유닛 제목이 없다", tk + " #" + ui);
    if (unitTitles.has(u.t)) hit("같은 트랙에 같은 유닛 제목", uw);
    unitTitles.add(u.t);
    if (typeof u.ord !== "number") hit("유닛에 순서(ord)가 없다", uw);
    if (!Array.isArray(u.l) || !u.l.length) { hit("레슨이 없는 유닛", uw); return; }

    const lessonTitles = new Set();
    u.l.forEach((L, li) => {
      const lw = uw + " / " + L.t;
      if (!L.t) hit("레슨 제목이 없다", uw + " #" + li);
      if (lessonTitles.has(L.t)) hit("같은 유닛에 같은 레슨 제목", lw);
      lessonTitles.add(L.t);
      if (!Array.isArray(L.q) || !L.q.length) { hit("문항이 없는 레슨", lw); return; }
      /* 이론(sum·body)은 thText 가 escHtml 로 감싼 뒤 마크다운만 바꾼다.
         거기 든 <a><b> 같은 것은 글자 그대로 보이므로 태그 검사를 하지 않는다. */
      if (L.th && !L.th.sum) hit("이론에 요약이 없다", lw);

      L.q.forEach((q, qi) => {
        nq++;
        const w = lw + " / " + (q.k || "#" + qi);
        const t = q.t || "choice";

        if (!q.q) hit("질문이 비었다", w);
        else tagBalance(q.q, w + " (질문)");
        if (!q.ex) hit("해설이 없다", w);
        else {
          /* 40자 미만 해설은 대개 정답을 되풀이한 것이다("int 는 정수형이다").
             69차에 748개를 전부 '왜 맞고 나머지는 왜 아닌가' 로 다시 써서 0이 됐다.
             다시 늘지 않도록 고칠 것으로 잡는다. 새로 쓸 때는 ex_short.cjs 를 쓴다. */
          if (strip(q.ex).trim().length < 40) hit("해설이 40자 미만이다", w + " (" + strip(q.ex).trim().length + "자)");
          tagBalance(q.ex, w + " (해설)");
        }

        const fp = fingerprint(q);
        if (fp && norm(q.q).length >= 20) {
          if (seen.has(fp)) {
            const first = seen.get(fp);
            const cross = first.split(" / ")[0] !== tk;
            hit(cross ? "트랙을 넘는 문항 중복" : "같은 트랙 안 문항 중복", w + "  ←→  " + first);
          } else seen.set(fp, w);
        }

        if (t === "choice") {
          if (!Array.isArray(q.o) || q.o.length !== 4) hit("보기가 4개가 아니다", w);
          else {
            /* 보기는 white-space:pre-wrap 으로 그려져 앞뒤 공백까지 보인다.
               `"   42"` 와 `"42"` 는 화면에서 다르므로 공백을 지우고 견주면 안 된다. */
            if (q.o.some(x => !String(x).trim())) hit("빈 보기가 있다", w);
            if (new Set(q.o.map(String)).size !== q.o.length) hit("보기가 겹친다", w);
            q.o.forEach((o, i) => tagBalance(o, w + " (보기" + i + ")"));
            if (!(Number.isInteger(q.a) && q.a >= 0 && q.a < 4)) hit("정답 자리가 범위 밖", w);
          }
        } else if (t === "input") {
          if (!Array.isArray(q.a) || !q.a.length) hit("정답 배열이 없다", w);
          else {
            if (q.a.some(x => !norm(x))) hit("빈 정답이 섞였다", w);
            /* 앱은 소문자·공백 무시로 견주므로, 그 규칙에서 같아지는 항목은 죽은 값이다 */
            const seenA = new Set(), dup = [];
            q.a.forEach(x => { const k = ansNorm(x); if (seenA.has(k)) dup.push(x); else seenA.add(k); });
            if (dup.length) note("단답 정답에 못 쓰이는 항목", w + " [" + dup.join(" | ") + "]");
          }
        } else if (t === "code") {
          /* 실행형이 정답을 확인하는 길은 셋이다 — 호출식 테스트(tests),
             언어별 러너가 돌리는 테스트 파일(rt), 출력 대조(expect).
             셋 다 없으면 채점할 방법이 없는 문항이다. */
          const verified = (Array.isArray(q.tests) && q.tests.length) || q.rt ||
                           (q.expect !== undefined && q.expect !== null);
          if (!verified) hit("실행형을 채점할 방법이 없다", w);
          if (!q.src) hit("실행형에 시작 코드가 없다", w);
        }
      });
    });
  });
});

/* 셸의 트랙 목록과 데이터 청크가 서로 맞는지 */
const html = fs.readFileSync(ROOT + "/index.html", "utf8");
const COURSES = require("../lib/courses.cjs").readCourses(html).obj;   /* 셸 개요는 압축된 꼴 — 도구로 읽는다 */
Object.keys(COURSES).forEach(k => { if (!tracks[k]) hit("셸에만 있는 트랙", k); });
Object.keys(tracks).forEach(k => { if (!COURSES[k]) hit("데이터에만 있는 트랙", k); });

/* 도구가 문법적으로 성립하는지.

   7차에 이모지를 걷어내면서 정규식 안의 이모지까지 지워져
   `if(!//.test(x))` 같은 줄이 남았고, 검증기 11개가 통째로 깨졌다.
   CI 에 물려 있지 않은 도구라 몇 달 동안 아무도 몰랐다 —
   그 사이 dbg_code 의 소스가 데이터와 갈라진 것도 못 잡았다.
   도구는 늘 돌지 않으므로, 최소한 '읽히기는 하는가' 만은 여기서 본다. */
{
  const dirs = [path.join(ROOT, "tools"), path.join(ROOT, "tools", "content"), path.join(ROOT, "tools", "lib")];
  const seenFile = new Set();
  dirs.forEach(d => {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).filter(f => /\.c?js$/.test(f)).forEach(f => {
      const full = path.join(d, f);
      if (seenFile.has(full) || fs.statSync(full).isDirectory()) return;
      seenFile.add(full);
      const r = require("child_process").spawnSync(process.execPath, ["--check", full],
        { encoding: "utf8" });
      if (r.status !== 0) {
        const why = String(r.stderr || "").split("\n").filter(x => /Error/.test(x))[0] || "";
        hit("도구가 문법 오류로 안 읽힌다", path.relative(ROOT, full) + " — " + why.trim());
      }
    });
  });
}

/* 프로젝트를 쓴 소스(tools/content/proj_*.cjs)와 데이터가 아직 같은지.

   데이터를 스크립트로 고치고 소스를 안 고치면(또는 그 반대면) 둘이 갈라지는데,
   앱은 데이터만 읽으므로 아무 검사에도 안 걸린다. 다음 사람이 소스를 고쳐
   다시 넣는 순간 이미 고쳐 둔 것이 조용히 되돌아간다.
   실제로 한 번 났다 — 제목으로 찾아 바꾸는 스크립트가 sol 안의 `" },` 를
   끝으로 잘못 잡아 소스만 깨졌고, 테스트는 전부 통과했다. */
{
  const pj = path.join(ROOT, "data", "projects.js");
  if (fs.existsSync(pj)) {
    const raw = fs.readFileSync(pj, "utf8");
    const DATA = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    const dir = path.join(ROOT, "tools", "content");
    fs.readdirSync(dir).filter(f => /^proj_.*\.cjs$/.test(f)).forEach(f => {
      let mod;
      try { mod = require(path.join(dir, f)); }
      catch (e) { hit("프로젝트 소스를 읽을 수 없다", f + " — " + e.message.split("\n")[0]); return; }
      const list = Array.isArray(mod) ? mod : (mod.PROJECTS || (mod.title ? [mod] : null));
      if (!list) return;                       // 프로젝트 파일이 아니다
      const group = (mod && mod.group) || "tracks";
      (DATA[group] || []).length;              // 없는 묶음이면 아래에서 걸린다
      list.forEach(sp => {
        const dp = (DATA[group] || []).filter(x => x.title === sp.title)[0];
        if (!dp) { hit("소스에만 있는 프로젝트", f + " / " + sp.title); return; }
        (sp.phases || []).forEach((ph, i) => {
          if (JSON.stringify(ph) !== JSON.stringify((dp.phases || [])[i]))
            hit("소스와 데이터가 다른 프로젝트 단계", f + " / " + sp.title + " / " + ph.t);
        });
      });
    });
  }
}

function report(bag, head) {
  const kinds = Object.keys(bag).sort((a, b) => bag[b].length - bag[a].length);
  if (!kinds.length) return 0;
  let total = 0;
  console.log(head);
  kinds.forEach(k => {
    const list = bag[k];
    total += list.length;
    console.log("■ " + k + " — " + list.length + "건");
    (FULL ? list : list.slice(0, 6)).forEach(x => console.log("    " + x));
    if (!FULL && list.length > 6) console.log("    … 그 밖 " + (list.length - 6) + "건 (--full 로 전부)");
    console.log("");
  });
  return total;
}

console.log("트랙 " + Object.keys(tracks).length + " · 문항 " + nq + "\n");
const nErr = report(err, "");
if (INFO) report(info, "── 참고 (동작에는 영향 없음) ──\n");
else {
  const n = Object.keys(info).reduce((a, k) => a + info[k].length, 0);
  if (n) console.log("참고 " + n + "건 (--info 로 보기)\n");
}
console.log(nErr ? "고칠 것 " + nErr + "건" : "고칠 것 없음");
process.exit(nErr ? 1 : 0);
