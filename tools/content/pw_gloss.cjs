/* 용어 사전과 '쉽게 말하면' 블록이 실제 앱에서 동작하는지 확인한다.
   ① 사전 청크가 붙고 이론 화면에 용어 표시가 생기는가
   ② 표시를 누르면 뜻 카드가 뜨는가
   ③ 한 화면에 8개를 넘지 않는가(읽는 흐름을 끊지 않기 위한 상한)
   ④ 더 긴 낱말의 일부를 잘못 잡지 않는가 ('인덱스' 안의 '덱' 같은 것) */
const {chromium}=require("/opt/node22/lib/node_modules/playwright");

(async()=>{
 const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium"});
 const p=await b.newPage({viewport:{width:390,height:800}});
 const errs=[]; p.on("pageerror",e=>errs.push(String(e.message)));
 await p.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p.goto("file:///home/user/studycode/index.html");
 await p.waitForFunction(()=>typeof ensureGloss==="function" && typeof startLesson==="function",{timeout:60000});

 const r=await p.evaluate(async()=>{
   await ensureGloss();
   const terms=Object.keys(GLOSSARY||{}).length;

   /* 순수 함수로 먼저 확인한다 — 화면 상태에 기대지 않는다 */
   const mark=(t)=>glossMark(t, new Set());
   const one=mark("해시맵으로 O(n) 에 푼다");
   const inner=mark("인덱스를 쓴다");                 // '덱' 을 잡으면 안 된다
   const dup=mark("캐시는 캐시다");                    // 같은 용어는 한 번만
   const many=mark(Object.keys(GLOSSARY).slice(0,20).join(" "));

   await ensureTrack("python");
   startLesson("python", 0, 0);
   const shown=document.querySelectorAll("#qbody .theory .gl").length;
   const first=document.querySelector("#qbody .theory .gl");
   let popped=false, popText="";
   if(first){ first.click(); const el=document.querySelector(".glpop");
     popped=!!el; popText=el?el.textContent:""; }
   return { terms, one:/class="gl"/.test(one), innerBad:/>덱</.test(inner),
            dupCount:(dup.match(/class="gl"/g)||[]).length,
            manyCount:(many.match(/class="gl"/g)||[]).length,
            shown, popped, popLen:popText.length };
 });

 const probs=[];
 if(r.terms<120) probs.push("사전 용어가 120개 미만: "+r.terms);
 if(!r.one) probs.push("'해시맵' 에 표시가 붙지 않았다");
 if(r.innerBad) probs.push("'인덱스' 안의 '덱' 을 잘못 잡았다");
 if(r.dupCount!==1) probs.push("같은 용어에 두 번 표시했다: "+r.dupCount);
 if(r.manyCount>8) probs.push("한 화면 상한 8개를 넘었다: "+r.manyCount);
 if(!r.shown) probs.push("실제 이론 화면에 표시가 하나도 없다");
 if(!r.popped) probs.push("표시를 눌러도 뜻 카드가 뜨지 않는다");
 if(r.popLen<20) probs.push("뜻 카드가 비어 있다");
 if(errs.length) probs.push("페이지 에러: "+errs.join(" | "));

 console.log(JSON.stringify(r));
 if(probs.length) console.log("\n✗ "+probs.join("\n✗ "));
 else console.log("\n용어 사전 확인 완료 — "+r.terms+"개 등록 · 첫 레슨에 "+r.shown+"개 표시 · 뜻 카드 동작");
 await b.close();
 process.exit(probs.length?1:0);
})();
