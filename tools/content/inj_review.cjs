/* 코드 리뷰 문항을 임의의 트랙에 주입하는 공용 주입기.
   사용: node inj_review.cjs <spec.js>
   spec: {source, xp, entries:[{track, guide, unit, lesson, th, slice:[from,to]}]}
   d(난이도)와 track 은 소스에서만 쓰는 표시라 데이터에 넣지 않는다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const ROOT=require("path").resolve(__dirname, "..", "..");
const SPEC=require(process.argv[2]);
const ALL=require(SPEC.source);
const xp=SPEC.xp||70;

const norm=s=>String(s).replace(/\s+/g," ").trim();
const ih=ROOT+"/index.html";
let html=fs.readFileSync(ih,"utf8");
const {readCourses,writeCourses}=require("../lib/courses.cjs");   /* 셸 개요는 압축된 꼴 — 이 도구로 읽고 쓴다 */
const __g=readCourses(html);
const C=__g.obj;

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
  const qs=Q.map(x=>{
    if(x.track && x.track!==E.track) throw new Error(x.k+": 트랙이 "+x.track+" 인데 "+E.track+" 에 넣으려 한다");
    if(!x.code||!Array.isArray(x.items)||!x.ex) throw new Error(x.k+": 필드 누락");
    if(x.items.length<5||x.items.length>6) throw new Error(x.k+": 보기가 5~6개가 아니다");
    const nb=x.items.filter(i=>i.bad).length;
    if(nb<1||nb>3||nb===x.items.length) throw new Error(x.k+": 결함 수가 1~3개가 아니다");
    return { t:"review", k:x.k, cat:"review", q:x.q, code:x.code,
             items:x.items.map(i=>({txt:i.txt, bad:!!i.bad})), ex:x.ex };
  });
  /* 물음이 트랙 안에서 겹치면 같은 문항으로 보인다 — 리뷰는 코드가 달라도 물음이 비슷하므로
     제목까지 함께 본다. */
  qs.forEach(q=>{ if(seen.has(norm(q.q+" "+q.k))) throw new Error(E.track+": 중복 문항 — "+q.k); });
  if(arr.some(u=>u.t===E.unit)) throw new Error(E.track+": 유닛 제목 중복");
  /* 자리 정하기. '해 보는 유닛'(시뮬레이션·실행형 실전·설계 실전)은 배운 뒤에 오는 것이라
     트랙 맨 뒤여야 하고 app 테스트가 그것을 검사한다. 리뷰는 배우는 단계이므로 그 무리
     <b>앞에</b> 끼운다 — 맨 뒤에 붙이면 꼬리가 끊겨 검사가 걸린다.
     순서(ord)를 적어 둔 트랙이면 전부 다시 매긴다. 하나라도 빠지면 앱이 순서를 통째로
     무시하므로, 여기서 안 채우면 영영 안 채워진다. */
  const TAILU=/시뮬레이션|실행형 실전|실행형 ·|설계 실전|설계 · 직접|직접 구현 —|직접 코딩 —|직접 SQL —|직접 만들며|직접 실행해/;
  const unit={ t:E.unit, l:[{ t:E.lesson, xp, th:E.th, q:qs }] };
  const hasOrd=arr.length>0 && arr.every(u=>typeof u.ord==="number");
  const order=hasOrd ? arr.slice().sort((x,y)=>x.ord-y.ord) : arr.slice();
  let at=order.findIndex(u=>TAILU.test(u.t));
  if(at<0) at=order.length;
  order.splice(at, 0, unit);
  if(hasOrd) order.forEach((u,i)=>{ u.ord=i; });
  return {E, path, out:raw.slice(0,a)+JSON.stringify(order)+raw.slice(z+1), n:qs.length};
});

plans.forEach(p=>{
  fs.writeFileSync(p.path, p.out);
  const unit={ title:p.E.unit, lessons:[{ title:p.E.lesson, xp, n:p.n }] };
  if(p.E.guide) unit.guide=p.E.guide;
  C[p.E.track].units.push(unit);
});
fs.writeFileSync(ih, writeCourses(html,C,__g));

console.log("주입 완료: "+plans.map(p=>p.E.track+" +"+p.n).join(" · "));
