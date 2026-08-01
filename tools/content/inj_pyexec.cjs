/* 파이썬 실행형(py) 문항을 임의의 트랙에 주입하는 공용 주입기.
   사용: node inj_pyexec.cjs <spec.js>
   spec 은 {track, unit, guide, xp, source, slice?, lessons:[{t,n,th}]} 를 내보낸다.
   slice 로 한 콘텐츠 파일을 여러 트랙에 나눠 넣을 수 있다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const ROOT=require("path").resolve(__dirname, "..", "..");
const SPEC=require(process.argv[2]);
const ALL=require(SPEC.source);
const Q=SPEC.slice ? ALL.slice(SPEC.slice[0], SPEC.slice[1]) : ALL;

const need=SPEC.lessons.reduce((s,L)=>s+L.n,0);
if(Q.length!==need) throw new Error("문항 "+Q.length+"개, 레슨 합 "+need);

const norm=s=>String(s).replace(/\s+/g," ").trim();
const path=ROOT+"/data/t-"+SPEC.track+".js";
const raw=fs.readFileSync(path,"utf8");
const a=raw.indexOf("["), z=raw.lastIndexOf("]");
const arr=JSON.parse(raw.slice(a,z+1));
const seen=new Set();
arr.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>seen.add(norm(q.q)))));
Q.forEach(q=>{ if(seen.has(norm(q.q))) throw new Error("중복 문항 — "+q.k); });
if(arr.some(u=>u.t===SPEC.unit)) throw new Error("유닛 제목 중복: "+SPEC.unit);

const xp=SPEC.xp||80;
let cur=0;
const lessons=SPEC.lessons.map(L=>{
  if(!L.th||!L.th.sum||L.th.body.length!==2||!L.th.code||!L.th.key) throw new Error(L.t+": 이론 형식");
  const qs=Q.slice(cur,cur+L.n).map(x=>{
    if(!x.fn||!x.src||!x.sol||!x.tests||!x.edge) throw new Error(x.k+": 필드 누락");
    return { t:"py", k:x.k, cat:x.cat||"internals", q:x.q, src:x.src, sol:x.sol,
             tests:x.tests.map(c=>({in:c[0],out:c[1]})),
             edge:x.edge.map(c=>({in:c[0],out:c[1]})), ex:x.ex };
  });
  cur+=L.n;
  return { t:L.t, xp, th:L.th, q:qs };
});
if(cur!==Q.length) throw new Error("배정 누락");
arr.push({ t:SPEC.unit, l:lessons });
fs.writeFileSync(path, raw.slice(0,a)+JSON.stringify(arr)+raw.slice(z+1));

const ih=ROOT+"/index.html";
const html=fs.readFileSync(ih,"utf8");
const mark="COURSES = ";
const start=html.indexOf(mark+"{")+mark.length;
let depth=0, end=start;
for(let i=start;i<html.length;i++){
  if(html[i]==="{")depth++;
  else if(html[i]==="}"){ depth--; if(!depth){ end=i; break; } }
}
const C=JSON.parse(html.slice(start,end+1));
if(!C[SPEC.track]) throw new Error("COURSES 에 "+SPEC.track+" 이 없다");
if(C[SPEC.track].units.some(u=>u.title===SPEC.unit)) throw new Error("목차 유닛 중복");
const unit={ title:SPEC.unit, lessons:SPEC.lessons.map(L=>({ title:L.t, xp, n:L.n })) };
if(SPEC.guide) unit.guide=SPEC.guide;
C[SPEC.track].units.push(unit);
fs.writeFileSync(ih, html.slice(0,start)+JSON.stringify(C)+html.slice(end+1));

console.log("주입 완료: "+SPEC.track+" 실행형 +"+Q.length+" ("+SPEC.unit+")");
