'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
let request,reply={},passed=0;
const ctx={S:{ai:{provider:'proxy',model:'gemini-2.0-flash',key:''}},AbortSignal,Promise,Error,fetch:async(url,options)=>{request={url,options,body:JSON.parse(options.body)};return{json:async()=>reply};}};
vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('const AI_PROVIDERS='),html.indexOf('function aiMd(')),ctx);
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
(async()=>{
 await check('fresh and migrated settings never claim an unconfigured proxy is ready',async()=>{assert.equal(vm.runInContext('aiReady()',ctx),false);assert.equal(ctx.S.ai.model,'gemini-3.5-flash-lite');await assert.rejects(vm.runInContext('aiCall("explain","code")',ctx));assert.equal(request,undefined);});
 await check('proxy sends the connection code only in the authorization header',async()=>{ctx.S.ai.proxyToken='test-only';reply={text:'ok'};assert.equal(await vm.runInContext('aiCall("explain","code")',ctx),'ok');assert.equal(request.options.headers.authorization,'Bearer test-only');assert.equal(request.body.proxyToken,undefined);assert.ok(request.options.signal);});
 await check('OpenAI reasoning requests use supported token and instruction parameters',async()=>{ctx.S.ai={provider:'openai',model:'o4-mini',key:'test-only'};reply={choices:[{message:{content:'ok'}}]};assert.equal(await vm.runInContext('aiCall("explain","code",1400)',ctx),'ok');assert.equal(request.body.max_tokens,undefined);assert.equal(request.body.max_completion_tokens,4096);assert.equal(request.body.messages[0].role,'developer');});
 await check('Gemini keys are excluded from URLs and internal thoughts from answers',async()=>{ctx.S.ai={provider:'gemini',model:'gemini-3.5-flash-lite',key:'test-only'};reply={candidates:[{content:{parts:[{text:'hidden',thought:true},{text:'ok'}]}}]};assert.equal(await vm.runInContext('aiCall("explain","code")',ctx),'ok');assert.equal(request.url.includes('key='),false);assert.equal(request.options.headers['x-goog-api-key'],'test-only');});
 await check('empty answers and provider errors are never reported as successful help',async()=>{reply={};await assert.rejects(vm.runInContext('aiCall("explain","code")',ctx),/비어/);reply={error:{message:'test-error'}};await assert.rejects(vm.runInContext('aiCall("explain","code")',ctx),/test-error/);});
 console.log(passed+' AI client checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
