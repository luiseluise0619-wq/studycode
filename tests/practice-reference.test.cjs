/* Verify reference implementations across all tracks through the production
   Worker, including async tests and visualization exercises. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),cases=[];
for(const name of fs.readdirSync(path.join(root,'data')).filter(n=>/^t-.*\.js$/.test(n))){let units;vm.runInNewContext(fs.readFileSync(path.join(root,'data',name),'utf8'),{__CR:(k,v)=>units=v});
 for(const u of units)for(const l of u.l)for(const q of l.q){if(q.sol&&((q.t==='code'&&!q.rt&&(q.tests||q.run==='js'))||q.t==='sim'))cases.push({name:name+':'+u.t+':'+l.t+':'+q.k,q});}}
(async()=>{const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:{channel:'msedge'});try{const page=await browser.newPage();await page.addInitScript(()=>{if(top===window)localStorage.setItem('coderun',JSON.stringify({onboarded:true,freeMode:true,goal:'free'}));});await page.goto(process.env.CR_URL||'file:///'+path.join(root,'index.html').replace(/\\/g,'/'));await page.waitForFunction(()=>typeof PracticeWorker!=='undefined');
 let passed=0;const failed=[];
 for(let i=0;i<cases.length;i+=25){const batch=cases.slice(i,i+25);const result=await page.evaluate(async cases=>{const out=[];for(const c of cases){const q=c.q,kind=q.t==='sim'?'sim':q.tests?'test':'out',doc=q.t==='sim'?simDoc(q.sol,q.tests):q.tests?testDoc(q.sol,q):jsDoc(q.sol),r=await PracticeWorker.runJavaScript(doc,kind);const ok=!r.error&&(q.tests?!!r.gate:norm(r.text||'')===norm(q.expect||''));out.push({name:c.name,ok,error:r.error,pass:r.pass,total:r.total});}return out;},batch);for(const r of result){if(r.ok)passed++;else failed.push(r);}if(i%100===0||i+25>=cases.length)console.log(passed+'/'+Math.min(i+25,cases.length)+' reference checks');}
 console.log(JSON.stringify({passed,failed,total:cases.length}));assert.equal(failed.length,0,'Reference implementations must pass their own tests');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
