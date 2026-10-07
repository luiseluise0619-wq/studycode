'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{createServer}=require('../tools/serve.cjs');
const root=path.resolve(process.env.CODERUN_RELEASE_ROOT||path.join(__dirname,'..'));
const server=createServer(root);let passed=0;
function check(name,value){assert.ok(value,name);passed++;console.log('PASS '+name);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 const response=await fetch(url),html=await response.text();
 check('release entry is served as HTML with security headers',response.ok&&response.headers.get('content-type').includes('text/html')&&response.headers.get('x-content-type-options')==='nosniff'&&response.headers.get('content-security-policy').includes("frame-ancestors 'self'"));
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');const shell=worker.slice(worker.indexOf('const SHELL = ['),worker.indexOf('const isData'));
 const entry=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,tag=>tag.match(/^<script[^>]*>/i)[0]);
 const assets=new Set([...entry.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match=>match[1]).filter(asset=>!/^https?:|^data:|^blob:/.test(asset)));
 for(const match of shell.matchAll(/"(\/[^"\n]*)"/g))assets.add(match[1]);
 for(const asset of assets){const r=await fetch(new URL(asset,url+'/'));assert.equal(r.status,200,asset);if(/\.js(?:\?|$)/.test(asset))assert.match(r.headers.get('content-type'),/javascript/,asset);}
 check('every local entry asset and precached module is present in the release',assets.size>50);
 const manifest=await(await fetch(url+'/manifest.webmanifest')).json();check('installation metadata matches the app',manifest.lang==='ko'&&manifest.start_url==='/'&&manifest.theme_color==='#b94e2b');
 for(const size of [192,512]){const icon=fs.readFileSync(path.join(root,'icons/icon-'+size+'.png'));assert.equal(icon.readUInt32BE(16),size);assert.equal(icon.readUInt32BE(20),size);}check('both installation icons have the declared dimensions',true);
 check('missing files and private paths do not return the app shell',(await fetch(url+'/missing.css')).status===404&&(await fetch(url+'/.git/config')).status===404);
 check('the AI endpoint rejects unsupported methods',(await fetch(url+'/api/review')).status===405);
 check('a caller without a connection code cannot use the AI proxy',[401,503].includes((await fetch(url+'/api/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user:'test'})})).status));
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:process.platform==='win32'?{channel:'msedge'}:{});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{if(top===window&&!localStorage.getItem('coderun'))localStorage.setItem('coderun',JSON.stringify({xp:99,done:{},onboarded:true,goal:'free',freeMode:true,recall:false}));});
  await page.goto(url);await page.waitForFunction(()=>typeof ReleaseHelpers!=='undefined'&&typeof ServicePath!=='undefined'&&trackLoaded(curLang));
  check('the mobile home opens without horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check('optional AI is disconnected on a fresh install',await page.evaluate(()=>!aiReady()));
  await page.evaluate(()=>{S.ai={provider:'gemini',model:'gemini-3.5-flash-lite',key:'test-only-secret',proxyToken:'test-only-token'};S.studyNotes={release:{text:'saved note'}};save();});
  const downloadPromise=page.waitForEvent('download');await page.locator('#backup-link').click();const download=await downloadPromise;const backup=fs.readFileSync(await download.path(),'utf8');const data=JSON.parse(backup);
  check('the real backup download preserves notes and excludes credentials',data.format==='coderun-backup'&&data.data.xp===99&&data.data.studyNotes.release.text==='saved note'&&!backup.includes('test-only-secret')&&!backup.includes('test-only-token'));
  await page.locator('#restore-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"message":"wrong file"}')});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('학습 백업'));
  check('invalid imports leave progress unchanged and do not offer replacement',await page.evaluate(()=>S.xp===99)&&!(await page.locator('#confirm.on').count()));
  await page.evaluate(()=>{S.xp=101;save();});await page.locator('#restore-file').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(backup)});await page.waitForSelector('#confirm.on');await page.locator('#confirm-no').click();
  check('canceling a valid restore keeps the current record',await page.evaluate(()=>S.xp===101));
  await page.locator('#restore-file').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(backup)});await page.locator('#confirm-yes').click();await page.waitForFunction(()=>typeof ReleaseHelpers!=='undefined'&&S.xp===99&&trackLoaded(curLang));
  check('confirming restore reloads the saved progress and disconnected AI',await page.evaluate(()=>S.studyNotes.release.text==='saved note'&&!aiReady()));
  await page.locator('#vibe-start').click();await page.waitForSelector('#vibe-code');await page.waitForFunction(()=>$('vibe-preview-status').textContent==='입력하고 눌러 볼 수 있어요');await page.locator('#vibe-check').click();await page.waitForFunction(()=>!!S.vibeLab.cart.missions.quantity.lastCheck);
  check('the release runs its real practice checker and rejects the broken starter',await page.evaluate(()=>!S.vibeLab.cart.missions.quantity.lastCheck.gate));
  await page.locator('#vibe-code').fill('  const subtotal = price * quantity;');await page.locator('#vibe-check').click();await page.waitForFunction(()=>S.vibeLab.cart.missions.quantity.lastCheck?.gate===true);
  const answer=await page.evaluate(()=>VibeLab.projects[0].missions[0].quiz.answer);await page.locator('[data-vibe-answer="'+answer+'"]').click();
  check('a correct edit and concept answer complete the real exercise under deployment headers',await page.evaluate(()=>S.vibeLab.cart.missions.quantity.passed&&S.vibeLab.cart.missions.quantity.lastCheck.pass===4));await page.locator('#vibe-close').click();
  await page.goto(url+'/privacy.html');check('the data page is reachable and readable on mobile',(await page.locator('h1').innerText()).includes('공부 기록')&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.goto(url);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(async()=>{const c=await caches.open('coderun-shell-v21-release');return !!(await c.match('/data/release-helpers.js?v=21'))&&!!(await c.match('/privacy.html'))&&!!(await c.match('/index.html'));});await page.reload();await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof ReleaseHelpers!=='undefined'&&typeof ServicePath!=='undefined');
  check('the packaged app reopens offline with its backup helper and service path',await page.evaluate(()=>S.xp===99));
  await page.locator('#reset-link').click();await page.locator('#confirm-no').click();check('canceling reset preserves the learner record',await page.evaluate(()=>S.xp===99&&S.vibeLab.cart.missions.quantity.passed));
  await page.locator('#reset-link').click();await page.locator('#confirm-yes').click();await page.waitForSelector('#study-setup-start');
  const reset=await page.evaluate(()=>({xp:S.xp,done:Object.keys(S.done).length,practice:VibeLab.progress().done,sourceCleared:!S.vibeLab?.cart?.source||S.vibeLab.cart.source===VibeLab.projects[0].source,ai:aiReady(),wrongs:S.wrongs.length}));assert.deepEqual(reset,{xp:0,done:0,practice:0,sourceCleared:true,ai:false,wrongs:0});check('confirmed reset clears progress, project code and connection settings',true);
  check('no browser exceptions during release operations',errors.length===0);
  console.log(passed+' release smoke checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
