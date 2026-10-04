/* app.test.cjs runs this fixture in a disposable process so a browser that
   shares an iframe's execution thread cannot block the rest of the suite. */
const path=require('path');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM});
  const p=await browser.newPage({viewport:{width:390,height:800}});
  await p.addInitScript(()=>localStorage.setItem('coderun',JSON.stringify({onboarded:true,goal:'free',freeMode:true})));
  await p.goto('file://'+path.join(__dirname,'..','index.html'));
  await p.waitForFunction(()=>typeof COURSES!=='undefined');
  await p.evaluate(()=>ensureBuild());
  const result=await p.evaluate(async()=>{
    S.build={}; save();
    await openBuildLab(); blOpen(0); BL.di=0; blApplyDayFiles(); blRender();
    S.build.orders.files['app.js']='function handle(){ while(true){} }\nmodule.exports={handle};\n';
    save(); blRender(); blRun(); await new Promise(r=>setTimeout(r,6500));
    const loopGuard=!BL.running && (BL.res||[]).some(x=>/무한 루프/.test(x.err||''));
    Object.assign(S.build.orders.files,BUILD_SOL.orders[0]); save(); BL.res=null; blRender();
    blRun(); await new Promise(r=>setTimeout(r,2500));
    const res=BL.res||[];
    closeBuildLab();
    return {loopGuard,again:res.filter(x=>x.ok).length,againTotal:res.length};
  });
  // Parent collects this result and disposes the complete fixture process tree.
  console.log('LOOP_RESULT '+JSON.stringify(result));
  await new Promise(()=>{});
})().catch(e=>{
  console.log('LOOP_RESULT '+JSON.stringify({err:String(e.message||e).split('\n')[0]}));
  setInterval(()=>{},1000);
});
