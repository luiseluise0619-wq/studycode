/* 선택형 감축 — 목표 비율(choice 30%)에 맞추되, 무작위가 아니라 '약한 것부터' 지운다.

   약점 점수 (측정 가능한 것만)
     +3  길이 편향: 정답이 가장 길고 최단 보기의 1.8배 이상 → 내용을 몰라도 맞힐 수 있다
     +2  해설 40자 미만 → 왜 그런지가 없다
     +2  같은 트랙 안에서 문제 줄기가 겹침
     +1  모든 보기가 12자 이하 → 단어 맞히기에 가깝다
     +1  해설 80자 미만

   보호 장치
     - 트랙마다 최소 30문항은 남긴다 (커버리지)
     - 한 레슨을 통째로 비우지 않는다 (최소 2문항 유지)
     - 점수 0인 문항은 절대 지우지 않는다
   하나라도 어긋나면 아무것도 쓰지 않는다. */
const fs=require("fs"), path=require("path");
const ROOT="/home/user/studycode";
const TARGET_DELETE=Number(process.argv[2]||2688);
const MIN_PER_TRACK=30, MIN_PER_LESSON=2, MIN_CHOICE_PER_LESSON=1;

const de=s=>String(s==null?"":s).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
const strip=s=>de(s).replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
function loadTrack(k){ let out=null;
  new Function("__CR", fs.readFileSync(path.join(ROOT,"data","t-"+k+".js"),"utf8"))((key,v)=>{ out=v; }); return out; }
function saveTrack(k,u){ fs.writeFileSync(path.join(ROOT,"data","t-"+k+".js"),"__CR('t:"+k+"',"+JSON.stringify(u)+");\n"); }
function shellCut(h){
  const i=h.indexOf("const COURSES = {"); const br=h.indexOf("{", i);
  let d=0,end=-1,ins=false,q="",e2=false;
  for(let k=br;k<h.length;k++){ const c=h[k];
    if(ins){ if(e2)e2=false; else if(c==="\\")e2=true; else if(c===q)ins=false; continue; }
    if(c==='"'||c==="'"){ ins=true; q=c; continue; }
    if(c==="["||c==="{") d++;
    else if(c==="]"||c==="}"){ d--; if(d===0){ end=k; break; } } }
  return {br,end,obj:(new Function("return ("+h.slice(br,end+1)+")"))()};
}

const tracks=fs.readdirSync(path.join(ROOT,"data")).filter(f=>/^t-.+\.js$/.test(f)).map(f=>f.slice(2,-3));
const data={}, rows=[];
tracks.forEach(t=>{
  const units=loadTrack(t); data[t]=units;
  const stems=new Map();
  units.forEach((u,ui)=>u.l.forEach((l,li)=>(l.q||[]).forEach((q,qi)=>{
    if((q.t||"choice")!=="choice") return;
    if(q.cat) return;   /* debug·predict 로 분류된 문항은 부족한 쪽이라 건드리지 않는다 */
    const o=(q.o||[]).map(strip), exl=strip(q.ex||"").length;
    let score=0, why=[];
    if(o.length===4){
      const L=o.map(s=>s.length), a=q.a;
      if(L[a]===Math.max(...L)&&L[a]>Math.min(...L)*1.8){ score+=3; why.push("길이편향"); }
      if(Math.max(...L)<=12){ score+=1; why.push("단답보기"); }
    }
    if(exl<40){ score+=2; why.push("해설<40"); }
    else if(exl<80){ score+=1; why.push("해설<80"); }
    const stem=strip(q.q).slice(0,60);
    if(stems.has(stem)){ score+=2; why.push("줄기중복"); } else stems.set(stem,1);
    rows.push({track:t, ui, li, qi, score, why, exl});
  })));
});
const totalChoice=rows.length;
console.log("선택형 "+totalChoice+"문항 검사");
const dist={}; rows.forEach(r=>dist[r.score]=(dist[r.score]||0)+1);
console.log("약점 점수 분포: "+Object.keys(dist).sort((a,b)=>b-a).map(k=>k+"점 "+dist[k]).join(" · "));

/* 트랙별 현재 선택형 수 */
const perTrack={}; rows.forEach(r=>perTrack[r.track]=(perTrack[r.track]||0)+1);

/* 약한 것부터, 보호 장치를 지키며 선택 */
const cand=rows.filter(r=>r.score>0).sort((a,b)=> b.score-a.score || a.exl-b.exl);
const left={}; Object.keys(perTrack).forEach(t=>left[t]=perTrack[t]);
const lessonLeft={};
rows.forEach(r=>{ const k=r.track+"/"+r.ui+"/"+r.li; lessonLeft[k]=(lessonLeft[k]||0)+1; });
const lessonTotal={};
tracks.forEach(t=>data[t].forEach((u,ui)=>u.l.forEach((l,li)=>{ lessonTotal[t+"/"+ui+"/"+li]=(l.q||[]).length; })));

const picked=[];
for(const r of cand){
  if(picked.length>=TARGET_DELETE) break;
  if(left[r.track]-1 < MIN_PER_TRACK) continue;
  const lk=r.track+"/"+r.ui+"/"+r.li;
  if(lessonTotal[lk]-1 < MIN_PER_LESSON) continue;
  /* 인출 모드는 선택형에서 열린다 — 선택형이 있던 레슨에는 최소 1개를 남긴다 */
  if(lessonLeft[lk]-1 < MIN_CHOICE_PER_LESSON) continue;
  picked.push(r); left[r.track]--; lessonTotal[lk]--; lessonLeft[lk]--;
}
console.log("삭제 대상 "+picked.length+"문항 (요청 "+TARGET_DELETE+")");
const byScore={}; picked.forEach(r=>byScore[r.score]=(byScore[r.score]||0)+1);
console.log("  점수별: "+Object.keys(byScore).sort((a,b)=>b-a).map(k=>k+"점 "+byScore[k]).join(" · "));
const byTrackDel={}; picked.forEach(r=>byTrackDel[r.track]=(byTrackDel[r.track]||0)+1);
console.log("  트랙별 삭제/남김:");
Object.keys(byTrackDel).sort((a,b)=>byTrackDel[b]-byTrackDel[a]).forEach(t=>
  console.log("    "+t.padEnd(12)+String(byTrackDel[t]).padStart(4)+" 삭제 → "+String(perTrack[t]-byTrackDel[t]).padStart(4)+" 남음 (원래 "+perTrack[t]+")"));

if(process.argv.indexOf("--apply")<0){ console.log("\n(미리보기입니다. 실제로 지우려면 --apply)"); process.exit(0); }

/* 실제 삭제 — 트랙별로 뒤에서부터 */
let h=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const cut=shellCut(h), COURSES=cut.obj;
const byTrack={}; picked.forEach(r=>(byTrack[r.track]=byTrack[r.track]||[]).push(r));
const writes=[];
Object.keys(byTrack).forEach(t=>{
  const units=data[t];
  byTrack[t].slice().sort((a,b)=> b.ui-a.ui || b.li-a.li || b.qi-a.qi).forEach(r=>{
    const l=units[r.ui] && units[r.ui].l[r.li];
    if(!l||!l.q||!l.q[r.qi]) throw new Error(t+" 위치 불일치 "+JSON.stringify(r));
    if((l.q[r.qi].t||"choice")!=="choice") throw new Error(t+" 선택형이 아님 "+JSON.stringify(r));
    l.q.splice(r.qi,1);
  });
  /* 셸의 n 동기화 */
  const c=COURSES[t];
  units.forEach(u=>{ const su=c.units.find(x=>x.title===u.t); if(!su) return;
    u.l.forEach((l,li)=>{ if(su.lessons[li]) su.lessons[li].n=l.q.length; }); });
  writes.push([t,units]);
});
writes.forEach(([t,u])=>saveTrack(t,u));
h=h.slice(0,cut.br)+JSON.stringify(COURSES)+h.slice(cut.end+1);
fs.writeFileSync(path.join(ROOT,"index.html"),h);
console.log("\n삭제 완료: "+picked.length+"문항");
