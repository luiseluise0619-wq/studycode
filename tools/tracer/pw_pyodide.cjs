/* Pyodide(WASM 파이썬)에서 추적기가 실제로 도는지 확인한다.
   샌드박스에서는 CDN 이 막혀 돌릴 수 없다 — 네트워크가 되는 곳에서 돌려야 한다.

     node tools/tracer/pw_pyodide.cjs

   여기서 실패하면 '내 코드 추적' 전체가 브라우저에서 안 된다는 뜻이고,
   방향을 다시 봐야 한다. (예제 6개는 미리 만든 트레이스라 이것과 무관하게 돈다.)

   두 단계로 본다.
     1부 — 추적기 자체를 Pyodide 에 올려 돌리고, 나온 봉투를 스키마 검증기에 건다.
     2부 — 앱을 진짜 서버로 띄워 traceRun() 을 그대로 부른다. 실제 사용자 경로다.
            (file:// 은 ensurePy 가 스스로 막으므로 반드시 http 로 띄워야 한다) */
const {chromium}=require("playwright");
const fs=require("fs"), path=require("path"), http=require("http");
const {check}=require("./schema.cjs");

const ROOT=path.resolve(__dirname,"..","..");
const PY=fs.readFileSync(path.join(__dirname,"tracer.py"),"utf8");
const BASE="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

/* 검사는 봉투(events 배열)를 본다. steps 는 개수(숫자)지 배열이 아니다 — 스키마 v1. */
const ev=(r,k)=>(r.events||[]).filter(e=>e.e===k);
const CASES=[
  ["기본",       "x = 10\ny = x + 5\nprint(y)",
    r=>r.out.trim()==="15" && ev(r,"set").some(e=>e.name==="y"&&e.to.v===15)],
  ["마지막 대입", "a = 1\nb = 2",
    r=>ev(r,"set").some(e=>e.name==="b"&&e.to.v===2)],   // 줄 이벤트는 실행 '전' 에 온다
  ["함수",       "def add(a,b):\n    return a+b\nprint(add(2,3))",
    r=>ev(r,"ret").some(e=>e.to.v===5) && ev(r,"call").some(e=>e.name==="add")],
  ["재귀",       "def f(n):\n    return 1 if n<2 else n*f(n-1)\nprint(f(5))",
    r=>r.out.trim()==="120" && Math.max(...ev(r,"step").map(e=>e.d))>=4],
  ["별칭",       "a=[1,2,3]\nb=a\nb.append(4)\nprint(a)",
    r=>r.out.trim()==="[1, 2, 3, 4]" &&
       /* 핵심: b 를 바꾼 그 단계에서 a 도 같이 바뀌어야 한다 */
       ev(r,"set").some(e=>e.name==="a"&&e.to.n===4)],
  ["예외",       "a=[1,2]\nprint(a[5])",
    r=>r.err&&r.err.type==="IndexError"&&r.err.line===2&&ev(r,"throw").length>0],
  ["문법오류",    "x = (",
    r=>r.err&&r.err.type==="SyntaxError"&&r.events.length===0],
  ["반복 상한",   "t=0\nfor i in range(100000):\n    t+=i",
    r=>r.cut===true && r.steps<=1000],
  ["컴프리헨션",  "b=[x*2 for x in range(5)]\nprint(b)",       // 3.12 는 인라인된다(PEP 709)
    r=>r.out.trim()==="[0, 2, 4, 6, 8]"],
  ["표준입력",    "s=input()\nprint('안녕 '+s)",                 // stdin 은 기본값 "" 이라 EOF
    r=>r.err!==null||r.out.length>=0],
  ["한글 변수",   "결과 = 1 + 2\nprint(결과)",                   // 문항 배선이 붙이는 호출 줄
    r=>r.out.trim()==="3" && ev(r,"set").some(e=>e.name==="결과")],
];

function serve(){
  const TYPES={".html":"text/html",".js":"text/javascript",".json":"application/json",
               ".webmanifest":"application/manifest+json",".png":"image/png",".wasm":"application/wasm"};
  return new Promise(res=>{
    const s=http.createServer((q,rp)=>{
      const rel=decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/,"")||"index.html";
      const f=path.join(ROOT, rel);
      if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){ rp.writeHead(404); return rp.end(); }
      rp.writeHead(200,{"content-type":TYPES[path.extname(f)]||"application/octet-stream"});
      fs.createReadStream(f).pipe(rp);
    });
    s.listen(0,"127.0.0.1",()=>res(s));
  });
}

(async()=>{
 let bad=0, notes=[];
 const b=await chromium.launch();

 /* ── 1부 · 추적기를 Pyodide 에 직접 올린다 ─────────────────────────────── */
 console.log("1부 — 추적기가 Pyodide 에서 도는가\n");
 const p=await b.newPage();
 p.on("pageerror",e=>notes.push("페이지 오류: "+String(e.message).slice(0,120)));
 await p.goto("https://example.com");
 const t0=Date.now();
 try{
   await p.addScriptTag({url:BASE+"pyodide.js"});
   await p.evaluate(async base=>{ window.py=await loadPyodide({indexURL:base}); }, BASE);
 }catch(e){
   console.log("✗ Pyodide 를 불러오지 못했습니다 — "+String(e.message).slice(0,200));
   console.log("\n네트워크나 CDN 접근을 먼저 확인하세요. 추적기 문제가 아닙니다.");
   await b.close(); process.exit(2);
 }
 const boot=((Date.now()-t0)/1000).toFixed(1);
 console.log("부팅 "+boot+"s"+(boot>15?"  ← 처음 여는 사람에겐 긴 시간이다":"")+"\n");

 const res=await p.evaluate(async({src, cases})=>{
   const out=[];
   const t=performance.now();
   window.py.runPython(src);                       // 앱과 같게 — 딱 한 번만 올린다
   out.push({name:"__install", ms:Math.round(performance.now()-t)});
   for(const [name, code] of cases){
     const t1=performance.now();
     let r=null, err=null;
     try{
       window.py.globals.set("__cr_src", code);     // 앱이 쓰는 바로 그 경로
       r=JSON.parse(window.py.runPython("trace_json(__cr_src)"));
     }catch(e){ err=String(e).slice(0,300); }
     out.push({name, ms:Math.round(performance.now()-t1), r, err});
   }
   /* 추적을 끝낸 뒤 sys.settrace 가 남아 있으면 이후 모든 실행이 느려진다 */
   out.push({name:"__settrace", left:window.py.runPython("import sys; sys.gettrace() is not None")});
   return out;
 }, {src:PY, cases:CASES.map(c=>[c[0],c[1]])});

 const install=res.shift(), left=res.pop();
 console.log("추적기 적재 "+install.ms+"ms");
 res.forEach((x,i)=>{
   const [name,,want]=CASES[i];
   if(x.err){ bad++; console.log("✗ "+name.padEnd(11)+"실행 오류: "+x.err); return; }
   const errs=check(x.r);
   const ok=errs.length===0 && want(x.r);
   if(!ok) bad++;
   console.log((ok?"✓ ":"✗ ")+name.padEnd(11)+String(x.ms+"ms").padEnd(8)
     +"단계 "+String(x.r.steps).padEnd(5)
     +(x.r.cut?"(잘림) ":"")+(x.r.err?"· "+x.r.err.type:"")
     +(errs.length?"  ← 스키마 위반: "+errs[0]:"")
     +(!errs.length&&!want(x.r)?"  ← 결과가 기대와 다르다":""));
   if(x.ms>3000) notes.push(name+" 가 "+x.ms+"ms 걸렸다 — 기다릴 만한가?");
 });
 if(left.left){ bad++; console.log("✗ settrace   추적 후에도 sys.settrace 가 남아 있다 — 이후 실행이 느려진다"); }
 else console.log("✓ settrace   추적 후 복구됨");

 /* ── 2부 · 앱을 서버로 띄워 실제 경로를 태운다 ─────────────────────────── */
 console.log("\n2부 — 앱의 traceRun() 이 실제로 도는가\n");
 const srv=await serve();
 const url="http://127.0.0.1:"+srv.address().port+"/index.html";
 const p2=await b.newPage({viewport:{width:390,height:820}});
 const perr=[]; p2.on("pageerror",e=>perr.push(String(e.message)));
 await p2.addInitScript(s=>{try{localStorage.setItem("coderun",JSON.stringify(s));}catch(e){}},
   {onboarded:true, goal:"free", freeMode:true});
 await p2.goto(url);
 await p2.waitForFunction(()=>typeof traceRun==="function",{timeout:60000});

 const app=await p2.evaluate(async()=>{
   const o={};
   const t=Date.now();
   const env=await traceRun("a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)");
   o.ms=Date.now()-t;
   o.nopy=!!env.__nopy; o.err=env.__err||null; o.env=env.__nopy||env.__err?null:env;
   if(o.env){
     openTrace(o.env, "내 코드", "테스트");
     o.opened=!!document.querySelector("#tracev.on .tv-code");
     o.count=(document.getElementById("tv-count")||{}).textContent||"";
     /* 마지막 단계에서 a 와 b 가 둘 다 4개짜리로 보여야 한다 — 별칭 예제의 핵심 */
     tvGo(TV.F.length-1);
     o.body=(document.getElementById("tv-body")||{}).textContent||"";
     closeTrace();
   }
   /* 두 번째 호출은 추적기를 다시 올리지 않으므로 훨씬 빨라야 한다 */
   const t2=Date.now(); await traceRun("x = 1\ny = 2"); o.ms2=Date.now()-t2;
   return o;
 });
 srv.close();

 if(app.nopy){ bad++; console.log("✗ 앱에서 Pyodide 를 불러오지 못했다 (traceRun 이 __nopy 를 돌려줌)"); }
 else if(app.err){ bad++; console.log("✗ traceRun 이 실패했다 — "+app.err); }
 else {
   const okOpen=app.opened, okBody=/1, 2, 3, 4/.test(app.body);
   if(!okOpen) bad++;
   console.log((okOpen?"✓ ":"✗ ")+"뷰어가 열린다        "+app.count+" · 첫 호출 "+app.ms+"ms · 두 번째 "+app.ms2+"ms");
   if(!okBody) bad++;
   console.log((okBody?"✓ ":"✗ ")+"별칭이 보인다        b 를 바꿨는데 a 도 [1, 2, 3, 4] 로 보이는가");
   if(app.ms2>app.ms) notes.push("두 번째 호출이 더 느리다 — 추적기를 매번 다시 올리고 있을 수 있다");
 }
 if(perr.length){ bad++; console.log("✗ 페이지 오류: "+perr[0].slice(0,160)); }

 await b.close();
 notes.forEach(n=>console.log("  · "+n));
 if(bad){ console.log("\n"+bad+"건 실패 — 실패한 항목을 그대로 알려 주세요. 방향을 다시 봐야 할 수 있습니다."); process.exit(1); }
 console.log("\n전부 통과 — 브라우저에서 사용자 코드를 추적할 수 있습니다. 10명 테스트로 넘어가도 됩니다.");
})();
