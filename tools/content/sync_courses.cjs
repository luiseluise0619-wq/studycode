/* index.html 의 COURSES 개요를 데이터 청크와 맞춘다.

   앱은 데이터에만 있는 유닛도 화면에 끼워 넣어 주므로(mergeTrack) 안 맞아도
   동작은 한다. 다만 청크가 오기 전에 보이는 개요가 실제와 달라지고, 데이터에만
   있는 레슨은 xp 가 기본값으로 잡힌다. 새 유닛을 넣은 트랙은 맞춰 두는 편이 낫다.

   전 트랙을 다 맞추면 셸이 38KB 자란다(70차에 재 보니 614 → 652KB, 상한 640KB 코앞).
   앱이 병합 때 알아서 끼워 넣으므로 전부 맞출 필요는 없다 — 새로 넣은 트랙이나
   개요가 크게 어긋난 트랙만 골라서 맞춘다.

   사용: node tools/content/sync_courses.cjs [트랙 …]   (인자 없으면 확인만) */
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..","..");
const IH=ROOT+"/index.html";

const {readCourses,writeCourses}=require("../lib/courses.cjs");   /* 셸 개요는 압축된 꼴 — 이 도구로 읽고 쓴다 */
let html=fs.readFileSync(IH,"utf8");
const G=readCourses(html);
const C=G.obj;

const only=process.argv.slice(2);
const report=[];
let changed=0, fixedN=0, addedL=0;
Object.keys(C).forEach(k=>{
  const p=ROOT+"/data/t-"+k+".js";
  if(!fs.existsSync(p)) return;
  const raw=fs.readFileSync(p,"utf8");
  const u=JSON.parse(raw.slice(raw.indexOf("["),raw.lastIndexOf("]")+1));
  const cq=C[k].units.reduce((a,x)=>a+x.lessons.reduce((b,L)=>b+L.n,0),0);
  const dq=u.reduce((a,x)=>a+x.l.reduce((b,L)=>b+L.q.length,0),0);
  if(C[k].units.length===u.length&&cq===dq) return;
  report.push(k+" — 유닛 "+C[k].units.length+"/"+u.length+" · 문항 "+cq+"/"+dq);
  if(only.length&&only.indexOf(k)<0) return;
  if(!only.length) return;
  /* 제목이 같은 레슨의 문항 수(n)를 데이터에 맞춘다 — 청크가 오기 전 목록에 보이는 숫자다.
     앱은 병합 뒤 l.q.length 로 다시 채우지만, 그 전까지는 이 숫자를 보여 준다. */
  const byTitle={};
  u.forEach(su=>su.l.forEach(L=>{ (byTitle[su.t+"\u0001"+L.t]=byTitle[su.t+"\u0001"+L.t]||[]).push(L.q.length); }));
  C[k].units.forEach(cu=>cu.lessons.forEach(L=>{
    const q=byTitle[cu.title+"\u0001"+L.title];
    if(q&&q.length){ const n=q.shift(); if(L.n!==n){ L.n=n; fixedN++; } }
  }));
  /* 제목이 같은 유닛은 그대로 두고, 개요에 없는 유닛만 데이터 순서대로 더한다.
     유닛은 있는데 개요에 없는 레슨(주로 '직접 짜 보기' 실습)도 데이터 자리에 끼워 넣는다 —
     앱의 mergeTrack 이 병합 때 하는 일과 같다. 미리 맞춰 두면 청크가 오기 전 목록도 같다. */
  const byTitle2={};
  C[k].units.forEach(cu=>{ (byTitle2[cu.title]=byTitle2[cu.title]||[]).push(cu); });
  u.forEach(su=>{
    const cands=byTitle2[su.t];
    const cu=cands&&cands.length? cands.shift() : null;
    if(!cu){
      C[k].units.push({ title:su.t, guide:"",
        lessons:su.l.map(L=>({ title:L.t, xp:L.xp||40, n:L.q.length })) });
      changed++; return;
    }
    const pool={}; cu.lessons.forEach(L=>{ (pool[L.title]=pool[L.title]||[]).push(L); });
    const extra=[]; let at=-1;
    su.l.forEach(L=>{
      const m=pool[L.t]&&pool[L.t].length? pool[L.t].shift() : null;
      if(m){ at=cu.lessons.indexOf(m); return; }
      const sib=cu.lessons.length? cu.lessons[cu.lessons.length-1].xp : 0;
      extra.push([at, { title:L.t, xp:L.xp||sib||30*L.q.length, n:L.q.length }]);
    });
    for(let i=extra.length-1;i>=0;i--){ cu.lessons.splice(extra[i][0]+1,0,extra[i][1]); addedL++; }
  });
});

if(report.length) console.log("어긋난 트랙\n  "+report.join("\n  "));
else console.log("전 트랙 COURSES ↔ 데이터 일치");

if(changed||fixedN||addedL){
  html=writeCourses(html,C,G);
  fs.writeFileSync(IH,html);
  console.log("\n유닛 "+changed+"개 · 레슨 "+addedL+"개를 개요에 더하고 레슨 "+fixedN+"개의 문항 수를 맞췄다: "+only.join(" "));
}else if(only.length){
  console.log("\n더할 유닛이 없다");
}
