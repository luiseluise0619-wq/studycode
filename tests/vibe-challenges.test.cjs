const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright');
const base=require('../data/vibe-scenarios.js'),additional=require('../data/vibe-challenges.js')(base);
(async()=>{const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:process.platform==='win32'?{channel:'msedge'}:{});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{if(top===window)localStorage.setItem('coderun',JSON.stringify({onboarded:true,goal:'free',freeMode:true,recall:false}));});
 await page.goto('file:///'+path.resolve(__dirname,'../index.html').replace(/\\/g,'/'));await page.waitForFunction(()=>typeof VibeLab!=='undefined');
 async function grade(id,index,source){return page.evaluate(({id,index,source})=>new Promise((resolve,reject)=>{
  const p=VibeLab.projects.find(p=>p.id===id),m=p.missions[index],token='challenge-'+Math.random(),frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts allow-forms');document.body.append(frame);
  const timer=setTimeout(()=>end(null,new Error('timeout '+id)),20000);function end(data,error){clearTimeout(timer);removeEventListener('message',receive);frame.remove();error?reject(error):resolve(data);}
  function receive(e){if(e.source===frame.contentWindow&&e.data?.__cr==='vibe'&&e.data.__studyToken===token&&!e.data.kind)end(e.data);}addEventListener('message',receive);frame.srcdoc=VibeLab.frameDoc(p,source,m.tests,token);
 }),{id,index,source});}
 let checks=0,refs=0,drafts=0;
 for(const p of additional)for(let i=0;i<p.missions.length;i++){
  const m=p.missions[i],broken=await grade(p.id,i,i?p.missions[i-1].reference:p.source);assert.equal(broken.gate,false,p.id+':'+m.id+' draft '+JSON.stringify(broken));drafts++;
  const fixed=await grade(p.id,i,m.reference);assert.equal(fixed.gate,true,p.id+':'+m.id+' reference '+JSON.stringify(fixed));checks+=fixed.pass;refs++;console.log('PASS '+p.id+':'+m.id+' '+fixed.pass+'/'+fixed.total);
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({refs,drafts,checks}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
