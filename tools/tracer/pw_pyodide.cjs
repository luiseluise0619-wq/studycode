/* Pyodide(WASM)에서 추적기가 도는지 확인한다.
   샌드박스에서는 CDN 이 막혀 돌릴 수 없다 — 네트워크가 되는 곳에서 돌려야 한다.
     node tools/tracer/pw_pyodide.cjs
   여기서 실패하면 자동 추적 방향 전체를 다시 봐야 한다. */
const {chromium}=require("playwright");
const fs=require("fs"), path=require("path");
const PY=fs.readFileSync(path.join(__dirname,"tracer.py"),"utf8");
const BASE="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

const CASES=[
  ["기본",      "x = 10\ny = x + 5\nprint(y)",                     r=>r.out.trim()==="15"],
  ["마지막 대입","a = 1\nb = 2",                                     r=>JSON.stringify(r.steps).includes('"b"')],
  ["함수",      "def add(a,b):\n    return a+b\nprint(add(2,3))",   r=>r.steps.some(s=>s.ev==="return")],
  ["재귀",      "def f(n):\n    return 1 if n<2 else n*f(n-1)\nprint(f(5))", r=>r.out.trim()==="120"],
  ["예외",      "a=[1,2]\nprint(a[5])",                             r=>r.err&&r.err.type==="IndexError"],
  ["문법오류",   "x = (",                                            r=>r.err&&r.err.type==="SyntaxError"],
  ["반복 상한",  "t=0\nfor i in range(100000):\n    t+=i",            r=>r.cut===true],
  ["컴프리헨션", "b=[x*2 for x in range(5)]\nprint(b)",              r=>r.out.trim()==="[0, 2, 4, 6, 8]"],
];

(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage();
 await p.goto("https://example.com");
 const t0=Date.now();
 await p.addScriptTag({url:BASE+"pyodide.js"});
 await p.evaluate(async(base)=>{ window.py=await loadPyodide({indexURL:base}); }, BASE);
 console.log("Pyodide 부팅 "+((Date.now()-t0)/1000).toFixed(1)+"s");

 const res=await p.evaluate(async({py:src, cases})=>{
   window.py.runPython(src);
   const out=[];
   for(const [name, code] of cases){
     const t=performance.now();
     let r=null, err=null;
     try{
       window.py.globals.set("__cr_src", code);
       r=JSON.parse(window.py.runPython("trace_json(__cr_src)"));
     }catch(e){ err=String(e).slice(0,200); }
     out.push({name, ms:Math.round(performance.now()-t), r, err});
   }
   return out;
 }, {py:PY, cases:CASES.map(c=>[c[0],c[1]])});

 let bad=0;
 res.forEach((x,i)=>{
   if(x.err){ bad++; console.log("✗ "+x.name+" — 실행 오류: "+x.err); return; }
   const ok=CASES[i][2](x.r);
   if(!ok) bad++;
   console.log((ok?"✓ ":"✗ ")+x.name.padEnd(10)+x.ms+"ms · 단계 "+x.r.steps.length
     +(x.r.cut?" (잘림)":"")+(x.r.err?" · "+x.r.err.type:""));
 });
 console.log("\n"+CASES.length+"건 중 "+bad+"건 실패");
 await b.close();
 process.exit(bad?1:0);
})();
