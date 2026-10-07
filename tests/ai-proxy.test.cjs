'use strict';
const assert=require('node:assert/strict'),review=require('../api/review.js');
const originalFetch=global.fetch,originalKey=process.env.GEMINI_API_KEY,originalToken=process.env.AI_PROXY_TOKEN;
let passed=0,calls=0,lastRequest;
const token='test-only-connection-code-123456';
async function request(patch={}){const response={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;}};await review({method:'POST',headers:{authorization:'Bearer '+token},body:{system:'Explain',user:'Check code'},...patch},response);return response;}
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
(async()=>{try{
 process.env.GEMINI_API_KEY='test-only-api-key';process.env.AI_PROXY_TOKEN=token;
 global.fetch=async(url,options)=>{calls++;lastRequest={url,options};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'hidden',thought:true},{text:'  answer  '}]}}]})};};
 await check('method guard prevents upstream requests',async()=>{const r=await request({method:'GET'});assert.equal(r.code,405);assert.equal(r.headers.Allow,'POST');assert.equal(calls,0);});
 await check('missing and wrong connection codes cannot spend API quota',async()=>{for(const headers of [{},{authorization:'Bearer wrong'},{authorization:'Bearer '+token+'x'}])assert.equal((await request({headers})).code,401);assert.equal(calls,0);});
 await check('an unconfigured or weakly configured server stays unavailable',async()=>{delete process.env.GEMINI_API_KEY;assert.equal((await request()).code,503);process.env.GEMINI_API_KEY='test-only-api-key';process.env.AI_PROXY_TOKEN='short';assert.equal((await request()).code,503);process.env.AI_PROXY_TOKEN=token;assert.equal(calls,0);});
 await check('invalid, empty and excessive input is rejected before fetch',async()=>{for(const body of [null,[],{},'{',{user:{}},{user:' '},{user:'x',system:12},{user:'x',model:'gemini-2.0-flash'},{user:'x'.repeat(24001)},{user:'x',system:'x'.repeat(8001)}])assert.ok([400,413].includes((await request({body})).code));assert.equal((await request({body:' '.repeat(128*1024+1)})).code,413);assert.equal(calls,0);});
 await check('authorized calls use a supported model, secret header and timeout',async()=>{const r=await request({body:JSON.stringify({user:'check',maxTokens:90000})});assert.equal(r.code,200);assert.equal(r.body.text,'answer');assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(lastRequest.url.includes('key='),false);assert.equal(lastRequest.options.headers['x-goog-api-key'],'test-only-api-key');assert.ok(lastRequest.options.signal instanceof AbortSignal);assert.equal(JSON.parse(lastRequest.options.body).generationConfig.maxOutputTokens,4096);});
 await check('upstream errors do not reveal provider details or secrets',async()=>{global.fetch=async()=>({ok:false,json:async()=>({error:{message:'SECRET'}})});const r=await request();assert.equal(r.code,502);assert.equal(JSON.stringify(r.body).includes('SECRET'),false);});
 await check('empty provider responses are reported as failures',async()=>{global.fetch=async()=>({ok:true,json:async()=>({})});assert.equal((await request()).code,502);});
 await check('timeouts and network failures produce actionable failures',async()=>{global.fetch=async()=>{throw Object.assign(new Error('SECRET'),{name:'TimeoutError'});};assert.equal((await request()).code,504);global.fetch=async()=>{throw new Error('SECRET');};const r=await request();assert.equal(r.code,502);assert.equal(JSON.stringify(r.body).includes('SECRET'),false);});
 console.log(passed+' AI proxy checks passed');
}finally{global.fetch=originalFetch;for(const [name,value]of [['GEMINI_API_KEY',originalKey],['AI_PROXY_TOKEN',originalToken]]){if(value===undefined)delete process.env[name];else process.env[name]=value;}}})().catch(error=>{console.error(error);process.exitCode=1;});
