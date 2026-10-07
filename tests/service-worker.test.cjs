/* First offline visit must use modules precached in the app shell. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.resolve(__dirname,'../sw.js'),'utf8'),events={},stores=new Map();
const version=code.match(/const VERSION = "([^"]+)"/)[1],origin='http://127.0.0.1:4173';
const key=request=>typeof request==='string'?new URL(request,origin).href:request.url;
function cache(name){if(!stores.has(name)){const data=new Map();stores.set(name,{data,match:async req=>data.get(key(req))?.clone(),put:async(req,res)=>data.set(key(req),res.clone())});}return stores.get(name);}
let offline=true;
vm.runInNewContext(code,{URL,Promise,Response,self:{location:{origin},addEventListener:(type,fn)=>events[type]=fn},caches:{open:async name=>cache(name),match:async req=>{for(const c of stores.values()){const result=await c.match(req);if(result)return result;}}},fetch:async()=>{if(offline)throw new Error('offline');return new Response('fresh');}});
function request(url,method='GET'){let response;events.fetch({request:new Request(new URL(url,origin),{method}),respondWith:value=>response=value});return response;}
(async()=>{let count=0;const shell=cache('coderun-shell-'+version),data=cache('coderun-data-'+version);
 for(const name of ['vibe-lab.js','vibe-scenarios.js','learning-path.js']){shell.data.set(key('/data/'+name),new Response(name));assert.equal(await(await request('/data/'+name)).text(),name);count++;console.log('PASS first offline load '+name+' from shell');}
 data.data.set(key('/data/t-python.js'),new Response('lesson'));assert.equal(await(await request('/data/t-python.js')).text(),'lesson');count++;console.log('PASS previously loaded lessons remain available offline');
 offline=false;assert.equal(await(await request('/data/t-new.js')).text(),'fresh');count++;console.log('PASS uncached online lesson loads normally');
 assert.equal(await(await request('/data/t-python.js')).text(),'lesson');await new Promise(r=>setTimeout(r,0));assert.equal(await(await data.match('/data/t-python.js')).text(),'fresh');count++;console.log('PASS cached lessons revalidate in the background');
 assert.equal(request('/api/check'),undefined);assert.equal(request('https://example.com/lib.js'),undefined);assert.equal(request('/data/vibe-lab.js','POST'),undefined);count+=3;console.log('PASS API, external requests and writes bypass the cache');
 shell.data.set(key('/'),new Response('home',{headers:{'Content-Type':'text/html'}}));offline=true;
 for(const url of ['/missing.css','/missing.wasm','/vendor/missing.js']){const r=await request(url);assert.equal(r.status,503);assert.match(r.headers.get('content-type'),/text\/plain/);count++;}
 let fallback;events.fetch({request:{url:origin+'/another-page',method:'GET',mode:'navigate'},respondWith:value=>fallback=value});assert.equal(await(await fallback).text(),'home');count++;console.log('PASS only navigation receives the offline HTML fallback');
 let reported;events.message({data:{type:'version'},ports:[{postMessage:value=>reported=value}]});assert.equal(reported.version,version);count++;console.log('PASS the controlling worker reports its actual version');
 console.log(count+' service worker checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
