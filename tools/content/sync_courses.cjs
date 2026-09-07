/* index.html 의 COURSES 개요를 데이터 청크와 맞춘다.

   앱은 데이터에만 있는 유닛도 화면에 끼워 넣어 주므로(mergeTrack) 안 맞아도
   동작은 한다. 다만 청크가 오기 전에 보이는 개요가 실제와 달라지고, 데이터에만
   있는 레슨은 xp 가 기본값으로 잡힌다. 새 유닛을 넣은 트랙은 맞춰 두는 편이 낫다.

   사용: node tools/content/sync_courses.cjs [트랙 …]   (인자 없으면 확인만) */
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..","..");
const IH=ROOT+"/index.html";

let html=fs.readFileSync(IH,"utf8");
const s=html.indexOf("COURSES = ")+10;
if(s<10) throw new Error("COURSES 를 찾지 못했다");
let d=0,e=s;
for(let i=s;i<html.length;i++){
  if(html[i]==="{")d++;
  else if(html[i]==="}"){ d--; if(!d){ e=i; break; } }
}
const C=JSON.parse(html.slice(s,e+1));

const only=process.argv.slice(2);
const report=[];
let changed=0;
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
  /* 제목이 같은 유닛은 그대로 두고, 개요에 없는 유닛만 데이터 순서대로 더한다 */
  const have=new Set(C[k].units.map(x=>x.title));
  u.forEach(su=>{
    if(have.has(su.t)) return;
    C[k].units.push({ title:su.t, guide:"",
      lessons:su.l.map(L=>({ title:L.t, xp:L.xp||40, n:L.q.length })) });
    changed++;
  });
});

if(report.length) console.log("어긋난 트랙\n  "+report.join("\n  "));
else console.log("전 트랙 COURSES ↔ 데이터 일치");

if(changed){
  html=html.slice(0,s)+JSON.stringify(C)+html.slice(e+1);
  fs.writeFileSync(IH,html);
  console.log("\n유닛 "+changed+"개를 개요에 더했다: "+only.join(" "));
}else if(only.length){
  console.log("\n더할 유닛이 없다");
}
