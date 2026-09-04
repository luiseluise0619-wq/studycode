/* 보기 길이로 찍을 수 있는지 잰다 (트랙별).

   app.test.cjs 가 저장소 전체로 재는 것과 같은 방식이다 — 길이 내림차순으로
   묶고(허용 오차 0자·5자), 정답이 든 묶음의 등수를 센다. '가장 긴 것을 찍으면
   맞는다' 가 되면 학습이 아니라 요령을 가르치게 된다.

   사용:
     node tools/content/ver_lenbias.cjs            트랙별 요약
     node tools/content/ver_lenbias.cjs git        그 트랙의 상세
     node tools/content/ver_lenbias.cjs git --need 손볼 문항 목록(오답을 얼마나 늘려야 하나) */
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..","..");
const DATA=path.join(ROOT,"data");

const strip=s=>String(s||"").replace(/<[^>]*>/g,"").trim();
/* 화면에 보이는 폭 — 한글·한자는 두 칸, 엔티티는 되돌려 센다 */
const dec=s=>String(s).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"')
  .replace(/&#39;/g,"'").replace(/&nbsp;/g," ").replace(/&amp;/g,"&");

function rankOf(lens, ans, tol){
  const order=[0,1,2,3].sort((x,y)=>lens[y]-lens[x]);
  const g=[[order[0]]];
  for(let i=1;i<4;i++){
    const p=g[g.length-1];
    if(lens[p[p.length-1]]-lens[order[i]]<=tol) p.push(order[i]);
    else g.push([order[i]]);
  }
  for(let gi=0;gi<g.length;gi++) if(g[gi].indexOf(ans)>=0) return {rank:gi, size:g[gi].length};
  return {rank:0,size:1};
}

const only=process.argv[2]&&process.argv[2][0]!=="-"?process.argv[2]:null;
const need=process.argv.indexOf("--need")>=0;

const rows=[];
let gAll=0; const gHit=[[0,0,0,0],[0,0,0,0]];
for(const f of fs.readdirSync(DATA).filter(x=>/^t-.*\.js$/.test(x)).sort()){
  const track=f.replace(/^t-|\.js$/g,"");
  if(only&&track!==only) continue;
  const raw=fs.readFileSync(path.join(DATA,f),"utf8");
  const units=JSON.parse(raw.slice(raw.indexOf("["),raw.lastIndexOf("]")+1));
  let n=0; const hit=[[0,0,0,0],[0,0,0,0]]; const todo=[];
  units.forEach(u=>u.l.forEach(L=>(L.q||[]).forEach(q=>{
    if((q.t||"choice")!=="choice"||!Array.isArray(q.o)||q.o.length!==4) return;
    n++; gAll++;
    const lens=q.o.map(o=>dec(strip(o)).length);
    [0,5].forEach((tol,ti)=>{
      const r=rankOf(lens,q.a,tol);
      hit[ti][r.rank]+=1/r.size; gHit[ti][r.rank]+=1/r.size;
    });
    /* 손볼 대상: 정답이 '단독 1등' 인 문항 — 가장 긴 오답을 정답보다 길게 만들면 된다 */
    const sorted=lens.slice().sort((a,b)=>b-a);
    if(lens[q.a]===sorted[0]&&sorted[0]>sorted[1]){
      const other=[0,1,2,3].filter(i=>i!==q.a).sort((x,y)=>lens[y]-lens[x])[0];
      todo.push({k:q.k, ans:lens[q.a], other:lens[other], oi:other, add:lens[q.a]-lens[other]+3});
    }
  })));
  if(!n) continue;
  rows.push({track, n,
    exact:+(Math.max.apply(null,hit[0])/n*100).toFixed(1),
    human:+(Math.max.apply(null,hit[1])/n*100).toFixed(1),
    top:+(hit[0][0]/n*100).toFixed(1), todo});
}

if(only&&need){
  const r=rows[0];
  if(!r){ console.log("트랙을 찾지 못했다: "+only); process.exit(1); }
  console.log(only+" — 정답이 단독으로 가장 긴 문항 "+r.todo.length+"개 / 사지선다 "+r.n);
  r.todo.forEach(t=>console.log("  "+t.k+"  정답 "+t.ans+"자 · 최장 오답["+t.oi+"] "+t.other+"자 → +"+t.add+"자 필요"));
  process.exit(0);
}

rows.sort((a,b)=>b.exact-a.exact);
console.log("트랙        사지선다   기계(0자)  사람(5자)  1등묶음   손볼문항");
rows.forEach(r=>console.log("  "+r.track.padEnd(12)+String(r.n).padStart(5)+
  String(r.exact).padStart(10)+"%"+String(r.human).padStart(9)+"%"+
  String(r.top).padStart(8)+"%"+String(r.todo.length).padStart(9)));
if(!only) console.log("\n전체 "+gAll+"문항 · 기계 "+(Math.max.apply(null,gHit[0])/gAll*100).toFixed(1)+
  "% · 사람 "+(Math.max.apply(null,gHit[1])/gAll*100).toFixed(1)+"% (찍기 기준선 25%)");
