/* '해 보는 유닛'(직접 구현 …)을 트랙 맨 뒤로 보내고 ord 를 다시 매긴다.

   app.test.cjs 가 이 자리를 검사한다 — 읽고 고르는 문항을 먼저 지나고
   마지막에 손으로 만들어 보는 순서라야 학습 흐름이 맞기 때문이다.
   새 유닛을 뒤에 붙이면 이 순서가 깨지므로 붙인 뒤에 한 번 돌린다.

   사용: node tools/content/reorder_lastunit.cjs <트랙 …> */
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"..","..");
const TRACKS=process.argv.slice(2);
if(!TRACKS.length) throw new Error("트랙을 하나 이상 주세요");

const IS_HANDS_ON=t=>/^직접 (구현|SQL|짜)/.test(t)||t.indexOf("손으로 만들어")>=0;

TRACKS.forEach(k=>{
  const p=ROOT+"/data/t-"+k+".js";
  const raw=fs.readFileSync(p,"utf8");
  const a=raw.indexOf("["), z=raw.lastIndexOf("]");
  const arr=JSON.parse(raw.slice(a,z+1));
  const hands=arr.filter(u=>IS_HANDS_ON(u.t));
  if(!hands.length){ console.log(k+" — 해 보는 유닛이 없다, 건너뜀"); return; }
  const rest=arr.filter(u=>!IS_HANDS_ON(u.t));
  const out=rest.concat(hands);
  /* ord 를 적어 두는 트랙이면 새 순서대로 다시 매긴다 — 하나라도 빠지면 앱이 무시한다 */
  if(arr.every(u=>typeof u.ord==="number")) out.forEach((u,i)=>{ u.ord=i; });
  fs.writeFileSync(p, raw.slice(0,a)+JSON.stringify(out)+raw.slice(z+1));
  console.log(k+" — 맨 뒤로: '"+hands.map(u=>u.t).join("', '")+"'");
});
