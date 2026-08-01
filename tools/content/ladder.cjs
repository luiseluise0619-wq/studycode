/* 계단식 난이도 — 레슨 안에서 선택형이 쉬운 것부터 나오게 정렬한다.
   갑자기 어려워지는 대신 한 칸씩 올라가야 학습이 이어진다.

   난이도는 추측하지 않고 '읽고 판단할 양' 으로만 잰다(재현 가능한 값):
     코드가 붙었는가 · 문제 줄기 길이 · 보기 평균 길이 · 판단/이유를 묻는가
   선택형끼리의 순서만 바꾸고 실행형·리뷰·로그 등 다른 유형의 자리는 건드리지 않는다. */
const fs=require("fs");
const ROOT=require("path").resolve(__dirname, "..", "..");

function difficulty(q){
  const stem=String(q.q||"");
  const plain=stem.replace(/<[^>]*>/g,"");
  const opts=(q.o||[]).map(o=>String(o).replace(/<[^>]*>/g,""));
  const avgOpt=opts.length? opts.reduce((s,o)=>s+o.length,0)/opts.length : 0;
  let d=0;
  if(/<code>|<pre>/.test(stem)) d+=2;
  if(plain.length>90) d+=2; else if(plain.length>55) d+=1;
  if(avgOpt>34) d+=2; else if(avgOpt>18) d+=1;
  if(/트레이드오프|어느 쪽|가장 적절|판단|설계|전략|고려/.test(plain)) d+=2;
  if(/왜|이유|목적|의미/.test(plain)) d+=1;
  if(q.cat==="design"||q.cat==="internals") d+=1;
  return d;
}
/* 뒤 문항이 앞 문항보다 2단계 이상 쉬우면 '계단이 꺼진' 것으로 본다 */
function drops(list){
  let n=0;
  for(let i=1;i<list.length;i++) if(list[i]-list[i-1] <= -2) n++;
  return n;
}

let before=0, after=0, moved=0, lessons=0;
const files=fs.readdirSync(ROOT+"/data").filter(f=>/^t-.+\.js$/.test(f));
files.forEach(f=>{
  const raw=fs.readFileSync(ROOT+"/data/"+f,"utf8");
  const a=raw.indexOf("["), z=raw.lastIndexOf("]");
  const arr=JSON.parse(raw.slice(a,z+1));
  let changed=false;
  arr.forEach(u=>u.l.forEach(l=>{
    const at=[], picks=[];
    (l.q||[]).forEach((q,i)=>{ if((q.t||"choice")==="choice"){ at.push(i); picks.push(q); } });
    if(picks.length<3) return;
    lessons++;
    const pre=picks.map(difficulty);
    before+=drops(pre);
    /* 같은 난이도끼리는 원래 순서를 지킨다(안정 정렬) — 이유 없이 흔들지 않는다 */
    const order=picks.map((q,i)=>[difficulty(q), i, q])
      .sort((x,y)=>x[0]-y[0] || x[1]-y[1]);
    const sorted=order.map(x=>x[2]);
    after+=drops(sorted.map(difficulty));
    sorted.forEach((q,i)=>{ if(l.q[at[i]]!==q){ l.q[at[i]]=q; moved++; changed=true; } });
  }));
  if(changed) fs.writeFileSync(ROOT+"/data/"+f, raw.slice(0,a)+JSON.stringify(arr)+raw.slice(z+1));
});
console.log("레슨 "+lessons+"개 · 자리 바뀐 문항 "+moved+"개");
console.log("난이도 역전(뒤가 2단계 이상 쉬움): "+before+" → "+after);
