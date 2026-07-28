/* 언어 빌드 랩을 data/build.js 에 주입한다.
   기존 프로젝트는 건드리지 않고 뒤에 붙이며, index.html 의 BUILD_DAYS 도 함께 맞춘다.
   전부 성공해야 쓴다(all-or-nothing). */
const fs=require("fs");
const LAB=require(process.argv[2]||"./lab_lang1.cjs");
const ROOT="/home/user/studycode";

const path=ROOT+"/data/build.js";
const raw=fs.readFileSync(path,"utf8");
const a=raw.indexOf("("), z=raw.lastIndexOf(")");
const inner=raw.slice(a+1, z);
const comma=inner.indexOf(",");
const key=inner.slice(0, comma).trim();
const data=JSON.parse(inner.slice(comma+1).trim());
if(key!=="'build'"&&key!=='"build"') throw new Error("예상 밖 키: "+key);

const have=new Set(data.projects.map(p=>p.id));
LAB.projects.forEach(p=>{
  if(have.has(p.id)) throw new Error("프로젝트 id 중복: "+p.id);
  if(!p.lang||!p.mainFile||!p.seed[p.mainFile]) throw new Error(p.id+": lang·mainFile·seed 필요");
  if(!LAB.sol[p.id]||LAB.sol[p.id].length!==p.days.length) throw new Error(p.id+": 해답 수 불일치");
  p.days.forEach(d=>{
    if(!d.rt||!d.rt.test||!Object.keys(d.rt.test).length) throw new Error(p.id+" Day"+d.n+": 러너 테스트 없음");
    if(!Array.isArray(d.tests)||d.tests.length<4) throw new Error(p.id+" Day"+d.n+": 수용 기준 4개 미만");
    if(!LAB.sol[p.id][d.n-1][p.mainFile]) throw new Error(p.id+" Day"+d.n+": 해답에 "+p.mainFile+" 없음");
  });
});

data.projects=data.projects.concat(LAB.projects);
Object.keys(LAB.sol).forEach(k=>{ data.sol[k]=LAB.sol[k]; });

const totalDays=data.projects.reduce((s,p)=>s+p.days.length,0);
fs.writeFileSync(path, "__CR('build',"+JSON.stringify(data)+");\n");

const ih=ROOT+"/index.html";
let html=fs.readFileSync(ih,"utf8");
const m=/const BUILD_DAYS=(\d+);/.exec(html);
if(!m) throw new Error("BUILD_DAYS 를 못 찾음");
html=html.replace(m[0], "const BUILD_DAYS="+totalDays+";");
fs.writeFileSync(ih, html);

console.log("주입 완료: "+LAB.projects.map(p=>p.id+"("+p.lang+") "+p.days.length+"일").join(" · ")+
            " → 총 "+data.projects.length+"개 프로젝트 · "+totalDays+" Day");
