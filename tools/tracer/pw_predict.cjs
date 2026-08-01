/* 출력 예측 문항 → 재생 뷰어 배선 검증.

   가장 중요한 것은 하나: 브라우저가 계산한 지문이 scan_code.py 가 계산한 지문과
   같은가. 한쪽만 바뀌면 버튼이 조용히 사라지고, 아무도 알아채지 못한다.
   그래서 실제 트랙 데이터의 코드 블록으로 양쪽을 맞춰 본다. */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");
const {execFileSync}=require("child_process");
const fs=require("fs");

/* 실제 트랙 파일에서 코드 블록을 뽑는다 — 손으로 만든 예시로는 지문이 맞는지 알 수 없다 */
function blocks(track){
  const s=fs.readFileSync(__dirname+"/../../data/t-"+track+".js","utf8");
  const d=JSON.parse(s.slice(s.indexOf(",",s.indexOf("("))+1, s.lastIndexOf(")")));
  const out=[];
  (function walk(o){ if(Array.isArray(o)) return o.forEach(walk);
    if(o&&typeof o==="object"){ if(o.code&&(o.t==="choice"||o.t==="input")) out.push(o);
      Object.keys(o).forEach(k=>walk(o[k])); } })(d);
  return out;
}

(async()=>{
 const allow=new Set(JSON.parse(
   fs.readFileSync(__dirname+"/../../data/traceable.js","utf8").replace(/^[\s\S]*?__CR\('traceable',\s*/,"").replace(/\);\s*$/,"")));
 const cand=blocks("python");
 /* 허용된 것과 빠진 것을 섞어서 준다 — 통과만 확인하면 '전부 true' 도 통과한다 */
 const py=execFileSync("python3",["-c",`
import sys, json
sys.path.insert(0, ${JSON.stringify(__dirname)})
from scan_code import key
print(json.dumps([key(c) for c in json.load(sys.stdin)]))`],
   {input:JSON.stringify(cand.map(q=>q.code)), encoding:"utf8"});
 const pyKeys=JSON.parse(py);

 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:820}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof traceKey==="function",{timeout:60000});

 const r=await p.evaluate(async(a)=>{
   const {codes, pyKeys}=a, out={}, sleep=ms=>new Promise(r=>setTimeout(r,ms));

   /* ── ① 지문이 파이썬 쪽과 한 글자도 다르면 안 된다 ── */
   const mine=codes.map(traceKey);
   out.keyCount=mine.length;
   out.keysMatch=mine.every((k,i)=>k===pyKeys[i]);
   out.keysDiffer=new Set(mine).size>1;              // 전부 같은 값이면 해시가 죽은 것이다

   /* ── ② 허용 목록이 실제로 걸러 내는가 ── */
   await ensureTraceable();
   out.allowLoaded=TRACEABLE instanceof Set && TRACEABLE.size>100;
   const hit=codes.filter(c=>TRACEABLE.has(traceKey(c))).length;
   out.someAllowed=hit>50;
   out.notAllAllowed=hit<codes.length;               // 전부 허용이면 거른 게 없다

   /* ── ③ 태그·엔티티가 실제 파이썬 원문으로 되돌아오는가 ── */
   const t=traceText("a &lt; b<br>print(&#39;hi&#39;)");
   out.textDecoded=t==="a < b\nprint('hi')";

   /* ── ④ 허용된 코드 문항: 채점 뒤 버튼이 뜨고, 그 코드가 그대로 파이썬으로 간다 ── */
   const good=codes.find(c=>TRACEABLE.has(traceKey(c)));
   const bad=codes.find(c=>!TRACEABLE.has(traceKey(c)));
   out.haveBoth=!!good&&!!bad;

   let traced=null;
   window.ensurePy=()=>Promise.resolve({
     globals:{set:(k,v)=>{ if(k==="__cr_src") traced=v; }},
     runPython:(code)=>code.indexOf("trace_json(")<0?null:JSON.stringify({
       v:1,run:"r-p",lang:"python",at:1,src:traced,ctx:null,
       events:[{s:0,e:"step",line:1,fn:"<module>",d:0},
               {s:0,e:"set",name:"x",to:{k:"int",v:1}},
               {s:1,e:"step",line:2,fn:"<module>",d:0}],
       steps:2,out:"",err:null,cut:false,ms:1}) });

   function ask(code){
     const q={t:"choice", k:"pred.test", q:"무엇이 출력될까요?", code:code,
              o:["1","2"], a:0};
     run={lang:"python",les:{title:"출력 예측",xp:0,q:[q,q]},i:0,correct:0,total:2,
          hearts:5,id:null,color:"#5b6cff",free:true};
     document.getElementById("lesson").classList.add("on");
     showQ();
     return q;
   }

   ask(good);
   await sleep(60);
   applyResult(false, "아니에요", run.les.q[0]);
   await sleep(250);
   out.btnOnAllowed=!!document.getElementById("trace-go");
   out.planKind=run.tracePlan&&run.tracePlan.kind;
   out.btnLabel=(document.getElementById("trace-go")||{}).textContent||"";

   document.getElementById("trace-go").click();
   await sleep(300);
   out.sentExactCode=traced===traceText(good);       // 실제로 그 코드가 갔는가
   out.viewerOpen=!!document.querySelector("#tracev.on .tv-code");
   out.viewerTitle=(document.querySelector("#tracev.on .tv-head b")||{}).textContent||"";
   closeTrace();

   /* ── ⑤ 허용되지 않은 코드에는 버튼이 없어야 한다 ── */
   ask(bad);
   await sleep(60);
   applyResult(false, "아니에요", run.les.q[0]);
   await sleep(250);
   out.noBtnOnBlocked=!document.getElementById("trace-go");
   out.noPlanOnBlocked=!run.tracePlan;

   /* ── ⑥ 코드가 없는 문항에도 붙지 않는다 ── */
   out.noPlanNoCode=tracePlanFor({t:"choice",o:[]},null,null)===null;
   return out;
 }, {codes:cand.map(q=>q.code), pyKeys});

 await b.close();
 console.log(JSON.stringify(r));
 const want={keysMatch:true, keysDiffer:true, allowLoaded:true, someAllowed:true,
   notAllAllowed:true, textDecoded:true, haveBoth:true, btnOnAllowed:true,
   planKind:"code", sentExactCode:true, viewerOpen:true, viewerTitle:"이 코드",
   noBtnOnBlocked:true, noPlanOnBlocked:true, noPlanNoCode:true};
 const bad=Object.keys(want).filter(k=>r[k]!==want[k]);
 if(!(r.keyCount>100)) bad.push("keyCount("+r.keyCount+")");
 if(r.btnLabel.indexOf("실제로 어떻게 도는지")<0) bad.push("btnLabel");
 if(errs.length) bad.push("pageerror: "+errs[0]);
 if(bad.length){ console.log("\n실패: "+bad.join(", ")); process.exit(1); }
 console.log("\n출력 예측 배선 확인 완료 — 지문이 scan_code.py 와 일치하고, 허용된 코드에만 버튼이 붙는다");
})();
