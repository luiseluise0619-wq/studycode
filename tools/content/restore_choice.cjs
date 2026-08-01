/* 잘못 잘린 선택형을 되살린다.
   기준을 바꿨다 — 예전에는 '문항이 잘 만들어졌는가'로 잘랐는데, 그건 '직접 해 보는 게
   나은가'와 다른 질문이었다. 앱에서 실제로 실행해 볼 수 있는 트랙의 '출력 맞히기' 만
   실행형이 대신할 수 있고, 나머지(이유·트레이드오프·판단, 그리고 아두이노처럼 애초에
   실행할 수 없는 영역)는 선택형이 유일한 통로다.

   되살린 문항은 원래 있던 레슨의 제자리로 돌아가며, 그 레슨은 쉬운 것부터 어려운
   것 순으로 다시 정렬한다(계단식). */
const {execSync}=require("child_process");
const fs=require("fs");
const ROOT=require("path").resolve(__dirname, "..", "..");
const TRIM="4f391cc";              /* 선택형 2,688문항 삭제 커밋 */

function readTrack(ref, f){
  const s=execSync("git -C "+ROOT+" show "+ref+":data/"+f,{encoding:"utf8",maxBuffer:1e9});
  return JSON.parse(s.slice(s.indexOf("[",10), s.lastIndexOf("]")+1));
}
function readCurrent(f){
  const s=fs.readFileSync(ROOT+"/data/"+f,"utf8");
  const a=s.indexOf("["), z=s.lastIndexOf("]");
  return { head:s.slice(0,a), arr:JSON.parse(s.slice(a,z+1)), tail:s.slice(z+1) };
}

/* 앱에서 코드를 실제로 돌려 볼 수 있는 트랙 */
const RUNNABLE=new Set(["python","sql","javascript","java","c","cpp","go","rust","react","web","code","algo"]);
/* 돌려 보면 즉시 답이 나오는 유형 — 이것만 실행형이 대신할 수 있다 */
const HANDS=/무엇이 출력|무엇을 (출력|반환)|출력 결과|실행 결과는|반환값은|이 코드의 결과/;

/* 계단식 난이도 — 낮을수록 앞에 온다. 재현 가능한 값만 쓴다(추측 금지). */
function difficulty(q){
  const stem=String(q.q||"");
  const plain=stem.replace(/<[^>]*>/g,"");
  const opts=(q.o||[]).map(o=>String(o).replace(/<[^>]*>/g,""));
  const avgOpt=opts.length? opts.reduce((s,o)=>s+o.length,0)/opts.length : 0;
  let d=0;
  if(/<code>|<pre>/.test(stem)) d+=2;              /* 코드가 붙으면 읽을 것이 는다 */
  if(plain.length>90) d+=2; else if(plain.length>55) d+=1;
  if(avgOpt>34) d+=2; else if(avgOpt>18) d+=1;
  if(/트레이드오프|어느 쪽|가장 적절|판단|설계|전략|고려/.test(plain)) d+=2;
  if(/왜|이유|목적|의미/.test(plain)) d+=1;
  if(q.cat==="design"||q.cat==="internals") d+=1;
  return d;
}

const files=execSync("git -C "+ROOT+" show "+TRIM+" --stat --name-only --format=",{encoding:"utf8"})
  .trim().split("\n").filter(x=>/^data\/t-/.test(x)).map(x=>x.slice(5));

let restored=0, skipped={중복:0, 실행대체:0, 자리없음:0};
const perTrack={}, writes=[];
const seenGlobal=new Set();

files.forEach(f=>{
  const track=f.slice(2,-3);
  let before;
  try{ before=readTrack(TRIM+"~1", f); }catch(e){ return; }
  const cur=readCurrent(f);

  /* 지금 남아 있는 문제 줄기 — 되살린 것이 중복되지 않게 */
  const have=new Set();
  cur.arr.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>have.add(String(q.q).replace(/\s+/g," ").trim()))));

  /* 레슨을 (유닛 제목 | 레슨 제목) 으로 찾는다 */
  const slot=new Map();
  cur.arr.forEach(u=>u.l.forEach(l=>slot.set(u.t+"|"+l.t, l)));

  const touched=new Set();
  before.forEach(u=>u.l.forEach(l=>(l.q||[]).forEach(q=>{
    if(q.t!=="choice") return;
    const norm=String(q.q).replace(/\s+/g," ").trim();
    if(have.has(norm)) return;                       /* 안 잘렸거나 이미 되살아난 것 */
    const plain=norm.replace(/<[^>]*>/g,"");
    const key=track+"|"+plain.slice(0,45);
    if(seenGlobal.has(key)){ skipped.중복++; return; }
    if(RUNNABLE.has(track) && HANDS.test(plain)){ skipped.실행대체++; return; }
    const target=slot.get(u.t+"|"+l.t);
    if(!target){ skipped.자리없음++; return; }
    seenGlobal.add(key);
    target.q.push(q);
    have.add(norm);
    touched.add(u.t+"|"+l.t);
    restored++; perTrack[track]=(perTrack[track]||0)+1;
  })));

  if(!touched.size) return;
  /* 되살린 문항이 들어간 레슨만 계단식으로 재정렬한다 — 선택형끼리의 순서만 바꾸고
     실행형·리뷰 등 다른 유형의 상대 위치는 건드리지 않는다. */
  touched.forEach(k=>{
    const l=slot.get(k);
    const idx=[]; const picks=[];
    (l.q||[]).forEach((q,i)=>{ if(q.t==="choice"){ idx.push(i); picks.push(q); } });
    picks.sort((a,b)=>difficulty(a)-difficulty(b));
    idx.forEach((at,i)=>{ l.q[at]=picks[i]; });
  });

  writes.push({ path:ROOT+"/data/"+f, content: cur.head+JSON.stringify(cur.arr)+cur.tail });
});

if(!restored) throw new Error("되살릴 것이 없다 — 기준이나 커밋 해시를 확인하라");
writes.forEach(w=>fs.writeFileSync(w.path,w.content));
console.log("되살림 "+restored+"문항 · 파일 "+writes.length+"개");
console.log("  트랙별: "+Object.entries(perTrack).sort((a,b)=>b[1]-a[1]).map(x=>x[0]+" "+x[1]).join(" · "));
console.log("  제외: "+JSON.stringify(skipped));
