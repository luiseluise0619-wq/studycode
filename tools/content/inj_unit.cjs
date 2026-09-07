/* 이미 있는 트랙에 유닛을 붙이는 공용 주입기 (choice·input 문항용).
   inj_jsexec.cjs 는 실행형(code) 전용이라 이론·선택형 유닛은 이쪽을 쓴다.

   사용: node inj_unit.cjs <트랙> ./diag_git.cjs
   내용 파일은 shuffleUnits 를 거친 유닛 배열을 내보낸다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..","..");

const TRACK=process.argv[2];
const SRC=process.argv[3];
if(!TRACK||!SRC) throw new Error("사용: node inj_unit.cjs <트랙> <내용파일>");
const UNITS=require(path.resolve(SRC));
if(!Array.isArray(UNITS)||!UNITS.length) throw new Error("유닛 배열이 아니다");

const p=ROOT+"/data/t-"+TRACK+".js";
if(!fs.existsSync(p)) throw new Error("트랙이 없다: "+TRACK);
const raw=fs.readFileSync(p,"utf8");
const a=raw.indexOf("["), z=raw.lastIndexOf("]");
const arr=JSON.parse(raw.slice(a,z+1));

/* 이미 있는 문항과 겹치면 막는다 — 같은 질문이 두 곳에 있으면 학습자가 헷갈린다 */
const norm=s=>String(s).replace(/\s+/g," ").trim();
const seenQ=new Set(), seenK=new Set();
arr.forEach(u=>u.l.forEach(L=>(L.q||[]).forEach(q=>{ seenQ.add(norm(q.q)); seenK.add(q.k); })));

UNITS.forEach(u=>{
  if(arr.some(x=>x.t===u.t)) throw new Error("유닛 제목 중복: "+u.t);
  if(!u.t||!Array.isArray(u.l)||!u.l.length) throw new Error("유닛 형식: "+u.t);
  u.l.forEach(L=>{
    const th=L.th;
    if(!th||!th.sum||!Array.isArray(th.body)||th.body.length!==2||!th.code||!th.code.c
       ||!Array.isArray(th.key)||th.key.length<3) throw new Error(L.t+": 이론 형식");
    if(!L.xp) throw new Error(L.t+": xp 없음");
    if(!Array.isArray(L.q)||L.q.length<5) throw new Error(L.t+": 문항 5개 미만");
    L.q.forEach(q=>{
      if(seenQ.has(norm(q.q))) throw new Error("문항 중복: "+q.k);
      if(seenK.has(q.k)) throw new Error("제목(k) 중복: "+q.k);
      seenQ.add(norm(q.q)); seenK.add(q.k);
      if(!q.ex||q.ex.length<80) throw new Error(q.k+": 해설이 부실하다");
      if(q.t==="choice"){
        if(!Array.isArray(q.o)||q.o.length!==4) throw new Error(q.k+": 보기가 4개가 아니다");
        if(new Set(q.o.map(norm)).size!==4) throw new Error(q.k+": 보기 중복");
        if(!(q.a>=0&&q.a<4)) throw new Error(q.k+": 정답 인덱스 범위 밖");
      } else if(q.t==="input"){
        if(!Array.isArray(q.a)||!q.a.length) throw new Error(q.k+": 정답 배열이 없다");
      } else throw new Error(q.k+": 알 수 없는 유형 "+q.t);
    });
  });
});

/* 트랙이 유닛 순서(ord)를 적어 두었으면 새 유닛에도 자리를 준다.
   일부만 적혀 있으면 앱이 순서를 통째로 무시하므로 반드시 함께 맞춘다. */
const hasOrd=arr.length&&arr.every(u=>typeof u.ord==="number");
let next=hasOrd?Math.max.apply(null,arr.map(u=>u.ord))+1:0;
UNITS.forEach(u=>{
  const unit={ t:u.t, l:u.l.map(L=>({ t:L.t, xp:L.xp, th:L.th, q:L.q })) };
  if(hasOrd) unit.ord=next++;
  arr.push(unit);
});
fs.writeFileSync(p, raw.slice(0,a)+JSON.stringify(arr)+raw.slice(z+1));

/* 쓴 뒤 다시 읽어 그대로인지 본다 */
const back=JSON.parse(fs.readFileSync(p,"utf8").match(/^__CR\('[^']+',(.*)\);\s*$/s)[1]);
const added=back.slice(-UNITS.length);
if(added.some((u,i)=>u.t!==UNITS[i].t)) throw new Error("왕복 검증 실패");
const n=UNITS.reduce((s,u)=>s+u.l.reduce((t,L)=>t+L.q.length,0),0);
console.log(TRACK+" ← 유닛 "+UNITS.length+" · 레슨 "+
  UNITS.reduce((s,u)=>s+u.l.length,0)+" · 문항 "+n+
  " ('"+UNITS.map(u=>u.t).join("', '")+"')");
