/* Real DOM checks: drafts must fail and every supplied fix must pass. */
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const projects=require('../data/vibe-scenarios.js');
(async()=>{
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:{channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(top===window)localStorage.setItem('coderun',JSON.stringify({onboarded:true,goal:'free',freeMode:true,recall:false}));});
  await page.goto(process.env.CR_URL||'file:///'+path.resolve(__dirname,'../index.html').replace(/\\/g,'/'));
  await page.waitForFunction(()=>typeof VibeLab!=='undefined');
  async function grade(id,index,source){return page.evaluate(({id,index,source})=>new Promise((resolve,reject)=>{
   const p=VibeLab.projects.find(p=>p.id===id),m=p.missions[index],token='ref-'+Math.random(),frame=document.createElement('iframe');
   frame.setAttribute('sandbox','allow-scripts allow-forms');frame.style='width:500px;height:460px';document.body.append(frame);
   const timer=setTimeout(()=>end(null,new Error('timeout '+id+':'+index)),20000);
   function end(result,error){clearTimeout(timer);removeEventListener('message',receive);frame.remove();error?reject(error):resolve(result);}
   function receive(e){if(e.source===frame.contentWindow&&e.data?.__cr==='vibe'&&e.data.__studyToken===token&&e.data.kind!=='size')end(e.data);}
   addEventListener('message',receive);frame.srcdoc=VibeLab.frameDoc(p,source,m.tests,token);
  }),{id,index,source});}
  let checks=0,bugChecks=0;
  for(const p of projects){
   for(let i=0;i<p.missions.length;i++){
    const m=p.missions[i],draft=i?p.missions[i-1].reference:p.source;
    const broken=await grade(p.id,i,draft);assert.equal(broken.gate,false,p.id+':'+m.id+' draft must fail');bugChecks++;
    const fixed=await grade(p.id,i,m.reference);assert.equal(fixed.gate,true,p.id+':'+m.id+' '+JSON.stringify(fixed));assert.equal(fixed.pass,m.tests.length);checks+=fixed.pass;
    console.log('PASS '+p.id+':'+m.id+' '+fixed.pass+'/'+fixed.total+'; draft rejected');
   }
   const compatible=await grade(p.id,0,p.missions[1].reference);assert.equal(compatible.gate,true,p.id+' final code preserves the first fix');
  }
  assert.deepEqual(errors,[]);assert.equal(checks,44);console.log(JSON.stringify({projects:projects.length,references:12,checks,bugChecks,compatibleFinals:6}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
