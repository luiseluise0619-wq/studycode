/* 트랙 신설 — 데이터 청크를 만들고 셸(index.html)에 COURSES·TRACK_INTRO·CATS 를 붙인다.

   사용: cd tools/content && node inj_newtrack.cjs ./spec_track_git.cjs

   스펙 모듈이 내보내는 것:
     { id, name, color, sources:[...], intro:{...}, cat:{id,name,after} }
   전부 성공해야 쓴다(all-or-nothing) — 절반만 반영된 셸이 남지 않도록. */
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..","..");

const specPath=process.argv[2];
if(!specPath) throw new Error("스펙 파일을 인자로 주세요");
const SPEC=require(path.resolve(specPath));
["id","name","color","sources","intro","cat"].forEach(k=>{
  if(!SPEC[k]) throw new Error("스펙에 "+k+" 가 없다");
});

const UNITS=SPEC.sources.reduce((a,s)=>a.concat(require(path.resolve(__dirname,s))),[]);
const total=UNITS.reduce((s,u)=>s+u.l.reduce((t,L)=>t+L.q.length,0),0);
if(UNITS.length<10) throw new Error("유닛이 너무 적다: "+UNITS.length);
if(total<150) throw new Error("문항이 너무 적다: "+total);

/* ── 데이터 청크: 검증 전용 _p 를 떼고 옮긴다 ── */
const chunk=UNITS.map((u,ui)=>({ t:u.t, ord:ui, l:u.l.map(L=>{
  if(!L.th||!L.th.sum||L.th.body.length!==2||!L.th.code||!L.th.key) throw new Error(L.t+": 이론 형식");
  return { t:L.t, xp:L.xp, th:L.th, q:L.q.map(q=>{ const c=Object.assign({},q); delete c._p; return c; }) };
}) }));
const dataPath=ROOT+"/data/t-"+SPEC.id+".js";
if(fs.existsSync(dataPath)) throw new Error("data/t-"+SPEC.id+".js 가 이미 있다");

/* ── 셸 ── */
const ih=ROOT+"/index.html";
let html=fs.readFileSync(ih,"utf8");

function grab(mark){
  const s=html.indexOf(mark+"{")+mark.length;
  if(s<mark.length) throw new Error("표식을 찾지 못했다: "+mark);
  let d=0,e=s;
  for(let i=s;i<html.length;i++){
    if(html[i]==="{")d++;
    else if(html[i]==="}"){ d--; if(!d){ e=i; break; } }
  }
  return {start:s,end:e,obj:JSON.parse(html.slice(s,e+1))};
}
function put(g,obj){ html=html.slice(0,g.start)+JSON.stringify(obj)+html.slice(g.end+1); }

const gc=grab("COURSES = ");
if(gc.obj[SPEC.id]) throw new Error("COURSES 에 "+SPEC.id+" 가 이미 있다");
gc.obj[SPEC.id]={ name:SPEC.name, em:"", color:SPEC.color,
  g:SPEC.g||("linear-gradient(135deg,"+SPEC.color+","+SPEC.color+")"),
  units:UNITS.map(u=>({ title:u.t, guide:"",
    lessons:u.l.map(L=>({ title:L.t, xp:L.xp, n:L.q.length })) })) };
put(gc,gc.obj);

/* 트랙 소개는 셸이 아니라 data/intro.js 청크에 있다 */
const introPath=ROOT+"/data/intro.js";
let introRaw=fs.readFileSync(introPath,"utf8");
const ia=introRaw.indexOf("{",introRaw.indexOf("__CR('intro'"));
const iz=introRaw.lastIndexOf("}");
const introObj=JSON.parse(introRaw.slice(ia,iz+1));
if(introObj[SPEC.id]) throw new Error("intro 에 "+SPEC.id+" 가 이미 있다");
introObj[SPEC.id]=SPEC.intro;
introRaw=introRaw.slice(0,ia)+JSON.stringify(introObj)+introRaw.slice(iz+1);

/* CATS — 새 카테고리를 만들거나 기존 카테고리에 덧붙인다 */
const catRe=new RegExp('\\{id:"'+SPEC.cat.id+'",name:"[^"]*",tracks:\\[([^\\]]*)\\]\\}');
const m=html.match(catRe);
if(m){
  const list=JSON.parse("["+m[1]+"]");
  if(list.indexOf(SPEC.id)<0) list.push(SPEC.id);
  html=html.replace(catRe,'{id:"'+SPEC.cat.id+'",name:"'+SPEC.cat.name+'",tracks:'+JSON.stringify(list)+'}');
}else{
  const anchor='{id:"'+SPEC.cat.after+'",';
  const at=html.indexOf(anchor);
  if(at<0) throw new Error("CATS 기준 카테고리를 찾지 못했다: "+SPEC.cat.after);
  const line='{id:"'+SPEC.cat.id+'",name:"'+SPEC.cat.name+'",tracks:'+JSON.stringify([SPEC.id])+'},\n ';
  html=html.slice(0,at)+line+html.slice(at);
}

/* 카테고리 이동이 필요하면 (기존 카테고리에서 빼기) */
(SPEC.cat.moveOut||[]).forEach(([fromId,track])=>{
  const re=new RegExp('(\\{id:"'+fromId+'",name:"[^"]*",tracks:\\[)([^\\]]*)(\\]\\})');
  const mm=html.match(re);
  if(!mm) throw new Error("이동 대상 카테고리를 찾지 못했다: "+fromId);
  const list=JSON.parse("["+mm[2]+"]").filter(x=>x!==track);
  html=html.replace(re,mm[1]+list.map(x=>JSON.stringify(x)).join(",")+mm[3]);
  const re2=new RegExp('(\\{id:"'+SPEC.cat.id+'",name:"[^"]*",tracks:\\[)([^\\]]*)(\\]\\})');
  const m2=html.match(re2);
  const l2=JSON.parse("["+m2[2]+"]");
  if(l2.indexOf(track)<0) l2.push(track);
  html=html.replace(re2,m2[1]+l2.map(x=>JSON.stringify(x)).join(",")+m2[3]);
});

/* ── 테스트의 청크 수 단정도 함께 올린다 ── */
const tp=ROOT+"/tests/app.test.cjs";
let t=fs.readFileSync(tp,"utf8");
const cur=fs.readdirSync(ROOT+"/data").filter(f=>/^t-.+\.js$/.test(f)).length;
const next=cur+1;
const a1='트랙 청크가 '+cur+'개 있다';
const a2='.length==='+cur+',';
const a3='early.tracks==='+cur;
if(t.indexOf(a1)<0||t.indexOf(a3)<0) throw new Error("청크 수 단정을 찾지 못했다("+cur+")");
t=t.replace(a1,'트랙 청크가 '+next+'개 있다').replace(a2,'.length==='+next+',').replace(a3,'early.tracks==='+next);

/* 전부 검증됐다 — 이제 쓴다 */
fs.writeFileSync(dataPath,"__CR('t:"+SPEC.id+"',"+JSON.stringify(chunk)+");\n");
fs.writeFileSync(ih,html);
fs.writeFileSync(introPath,introRaw);
fs.writeFileSync(tp,t);

console.log("주입 완료: "+SPEC.id+" 트랙 신설 — 유닛 "+UNITS.length+" · 레슨 "+
  UNITS.reduce((s,u)=>s+u.l.length,0)+" · 문항 "+total+" · 청크 "+cur+" → "+next);
