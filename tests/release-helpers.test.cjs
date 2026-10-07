'use strict';
const assert=require('node:assert/strict');
const {backup,parseBackup}=require('../data/release-helpers.js');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
const state={xp:170,done:{'python.lesson':true},wrongs:[{lang:'python',q:{t:'choice',q:'test'},box:1}],vibeLab:{cart:{source:'const price=1200;',missions:{quantity:{passed:true}}}},ai:{provider:'gemini',model:'gemini-3.5-flash-lite',key:'test-secret',proxyToken:'test-connection'},onboarded:true};
check('new backups retain progress, code and answers but exclude credentials',()=>{const file=backup(state);assert.equal(file.format,'coderun-backup');assert.equal(file.version,1);assert.deepEqual(parseBackup(JSON.stringify(file)),{...state,ai:{provider:state.ai.provider,model:state.ai.model}});assert.equal(JSON.stringify(file).includes('test-secret'),false);assert.equal(JSON.stringify(file).includes('test-connection'),false);});
check('export leaves the active connection and progress untouched',()=>{const before=JSON.stringify(state);backup(state);assert.equal(JSON.stringify(state),before);});
check('legacy raw backups remain compatible',()=>assert.deepEqual(parseBackup(JSON.stringify(state)),state));
check('ordinary JSON cannot overwrite progress',()=>{for(const bad of ['null','[]','{}','{"message":"hello"}','{"xp":0,"done":[]}'])assert.throws(()=>parseBackup(bad));});
check('malformed JSON gives a readable error',()=>assert.throws(()=>parseBackup('{'),/JSON/));
check('invalid record types and numbers are rejected',()=>{for(const patch of [{xp:-1},{xp:'100'},{hearts:-2},{wrongs:{}},{wrongs:[null]},{build:[]},{vibeLab:'broken'},{ai:[]},{onboarded:'yes'}])assert.throws(()=>parseBackup(JSON.stringify({...state,...patch})));});
check('unsupported envelopes do not silently reset progress',()=>assert.throws(()=>parseBackup(JSON.stringify({format:'coderun-backup',version:2,data:state}))));
check('prototype-changing properties are rejected at every depth',()=>{assert.throws(()=>parseBackup('{"xp":0,"done":{},"__proto__":{"x":1}}'));assert.throws(()=>parseBackup('{"xp":0,"done":{"nested":{"__proto__":{}}}}'));assert.equal({}.x,undefined);});
check('large and deeply nested files are rejected',()=>{assert.throws(()=>parseBackup(' '.repeat(10*1024*1024+1)));let deep={};for(let i=0;i<65;i++)deep={next:deep};assert.throws(()=>parseBackup(JSON.stringify({xp:0,done:deep})));});
check('loading progress never mutates the defaults used for a full reset',()=>{const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),ctx={localStorage:{getItem:()=>null}};vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('const MAX_HEARTS='),html.indexOf('/* 저장은 실패할 수 있다')),ctx);const result=vm.runInContext('S.done.sample=true;S.wrongs.push({q:{}});S.git.done.example=true;S.ai.key="test-only";JSON.stringify(freshState())',ctx);const fresh=JSON.parse(result);assert.deepEqual(fresh.done,{});assert.deepEqual(fresh.wrongs,[]);assert.deepEqual(fresh.git.done,{});assert.equal(fresh.ai.key,'');ctx.localStorage.getItem=()=>'{"xp":42,"done":{"saved":true}}';assert.equal(vm.runInContext('load().xp',ctx),42);assert.equal(vm.runInContext('load().done.saved',ctx),true);});
console.log(passed+' backup and state checks passed');
