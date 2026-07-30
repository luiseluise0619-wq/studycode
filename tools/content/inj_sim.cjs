/* 시뮬레이션 문항을 임의의 트랙에 주입하는 공용 주입기.
   사용: node inj_sim.cjs <spec.js>
   spec: {source, xp, entries:[{track, guide, unit, lesson, th, slice:[from,to]}]}
   ref(참조 구현)는 주입하지 않는다 — 정답을 데이터에 심으면 안 된다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const ROOT="/home/user/studycode";
const SPEC=require(process.argv[2]);
const ALL=require(SPEC.source);
const xp=SPEC.xp||70;

const norm=s=>String(s).replace(/\s+/g," ").trim();
const ih=ROOT+"/index.html";
let html=fs.readFileSync(ih,"utf8");
const mark="COURSES = ";
const start=html.indexOf(mark+"{")+mark.length;
let depth=0, end=start;
for(let i=start;i<html.length;i++){
  if(html[i]==="{")depth++;
  else if(html[i]==="}"){ depth--; if(!depth){ end=i; break; } }
}
const C=JSON.parse(html.slice(start,end+1));

/* 먼저 전부 검사한 뒤에 쓴다 */
const plans=SPEC.entries.map(E=>{
  const Q=ALL.slice(E.slice[0], E.slice[1]);
  if(!Q.length) throw new Error(E.track+": 문항이 없다");
  if(!E.th||!E.th.sum||E.th.body.length!==2||!E.th.code||!E.th.key) throw new Error(E.track+": 이론 형식");
  if(!C[E.track]) throw new Error("COURSES 에 "+E.track+" 이 없다");
  if(C[E.track].units.some(u=>u.title===E.unit)) throw new Error(E.track+": 목차 유닛 중복");
  const path=ROOT+"/data/t-"+E.track+".js";
  const raw=fs.readFileSync(path,"utf8");
  const a=raw.indexOf("["), z=raw.lastIndexOf("]");
  const arr=JSON.parse(raw.slice(a,z+1));
  const seen=new Set();
  arr.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>seen.add(norm(q.q)))));
  Q.forEach(q=>{ if(seen.has(norm(q.q))) throw new Error(E.track+": 중복 문항 — "+q.k); });
  if(arr.some(u=>u.t===E.unit)) throw new Error(E.track+": 유닛 제목 중복");
  const qs=Q.map(x=>{
    if(!x.src||!x.ref||!x.tests||x.tests.length<5) throw new Error(x.k+": 필드 누락 또는 검사 5개 미만");
    if(!/RESULT\s*=/.test(x.src)) throw new Error(x.k+": 시작 코드에 RESULT 대입이 없다");
    return { t:"sim", k:x.k, cat:x.cat||"design", q:x.q, src:x.src,
             tests:x.tests.map(t=>({d:t.d, js:t.js})), ex:x.ex };
  });
  arr.push({ t:E.unit, l:[{ t:E.lesson, xp, th:E.th, q:qs }] });
  return {E, path, out:raw.slice(0,a)+JSON.stringify(arr)+raw.slice(z+1), n:qs.length};
});

plans.forEach(p=>{
  fs.writeFileSync(p.path, p.out);
  const unit={ title:p.E.unit, lessons:[{ title:p.E.lesson, xp, n:p.n }] };
  if(p.E.guide) unit.guide=p.E.guide;
  C[p.E.track].units.push(unit);
});
fs.writeFileSync(ih, html.slice(0,start)+JSON.stringify(C)+html.slice(end+1));

console.log("주입 완료: "+plans.map(p=>p.E.track+" +"+p.n).join(" · "));
