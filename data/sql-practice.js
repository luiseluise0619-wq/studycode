/* SQLite runs in a disposable worker so a recursive query cannot freeze the app. */
(function(){
 'use strict';
 let active=null,generation=0;
 function stop(){generation++;if(active)active.finish({cancelled:true});}
 async function execute(schema,queries){
  stop();
  const id=generation;
  try{await ensureSqlLib();}catch(_){return {unavailable:true,error:'SQL 실행기를 준비하지 못했어요. data 폴더가 함께 있는지 확인해 주세요.'};}
  if(id!==generation)return {cancelled:true};
  if(typeof Worker!=='function')return {unavailable:true,error:'SQL 실행을 시작하지 못했어요. 최신 Chrome이나 Edge로 열어 주세요.'};
  return new Promise(resolve=>{
   const source='var initSqlJsPromise;var initSqlJs='+initSqlJs.toString()+';onmessage=async function(e){try{var d=e.data,b=atob(d.wasm),bytes=new Uint8Array(b.length);for(var i=0;i<b.length;i++)bytes[i]=b.charCodeAt(i);var SQL=await initSqlJs({wasmBinary:bytes});postMessage({phase:"running"});var results=d.queries.map(function(query){var db=new SQL.Database();try{if(d.schema)db.run(d.schema);var rows=db.exec(query);return rows.length?{cols:rows[0].columns,rows:rows[0].values}:{cols:[],rows:[]};}catch(e){return {error:String(e.message||e)};}finally{db.close();}});postMessage({results:results});}catch(e){postMessage({unavailable:true,error:"SQL 실행기를 준비하지 못했어요."});}};';
   let url,worker;try{url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));worker=new Worker(url);}catch(_){if(url)URL.revokeObjectURL(url);resolve({unavailable:true,error:'SQL 실행을 시작하지 못했어요. 브라우저의 실행 제한을 확인해 주세요.'});return;}
   const job={worker,url,timer:null,finish(result){if(active!==job)return;active=null;clearTimeout(job.timer);worker.terminate();URL.revokeObjectURL(url);resolve(result);}};active=job;
   worker.onmessage=e=>{if(e.data.phase==='running'){clearTimeout(job.timer);job.timer=setTimeout(()=>job.finish({error:'5초 안에 쿼리가 끝나지 않았어요. 재귀 조건과 결과 개수를 확인해 주세요.',timedOut:true}),5000);}else job.finish(e.data);};
   worker.onerror=e=>{e.preventDefault();job.finish({unavailable:true,error:'SQL 실행기를 준비하지 못했어요. 다시 검사해 주세요.'});};
   job.timer=setTimeout(()=>job.finish({unavailable:true,error:'SQL 실행기 준비가 오래 걸려요. 다시 검사해 주세요.'}),15000);
   worker.postMessage({schema,queries,wasm:window.__SQL_WASM_B64});
  });
 }
 sqlRun=async function(schema,query){const result=await execute(schema,[query]);return result.results?result.results[0]:result;};
 gradeSql=async function(q,query){
  const result=await execute(q.schema,[query,q.sol]);if(!result.results)return result;
  const [got,exp]=result.results;if(got.error)return {ok:false,error:got.error};
  if(exp.error)return {unavailable:true,error:'이 문제의 기준 쿼리에 오류가 있어요. 다른 문제를 풀어 주세요.'};
  const norm=rows=>rows.map(row=>JSON.stringify(row)).sort();
  const ok=q.ordered?JSON.stringify(got.rows)===JSON.stringify(exp.rows):JSON.stringify(norm(got.rows))===JSON.stringify(norm(exp.rows));
  return {ok,cols:got.cols,got:got.rows,exp:exp.rows,gotN:got.rows.length,expN:exp.rows.length};
 };
 setupSql=function(q){const editor=$('sqlcode');if(editor){editor.value=q.src||'';editor.oninput=()=>{liveTest=null;};}if($('sqlout'))$('sqlout').textContent='쿼리를 다 쓴 뒤 아래 ‘코드 검사하기’를 눌러 주세요.';};
 const previous=onCheck;
 onCheck=function(){
  if(!run||run.answered)return;const context=run,index=run.i,q=run.les.q[index];if(q.t!=='sql'){previous();return;}
  const editor=$('sqlcode'),button=$('check');editor.readOnly=true;if(__monEditor)__monEditor.updateOptions({readOnly:true});button.disabled=true;button.textContent='SQL 검사 중…';
  const current=()=>run===context&&run.i===index&&$('lesson').classList.contains('on');
  gradeSql(q,editor.value).then(result=>{
   if(editor.isConnected)editor.readOnly=false;if(!current()||result.cancelled)return;if(__monEditor)__monEditor.updateOptions({readOnly:false});
   if(result.unavailable){button.disabled=false;button.textContent='다시 검사하기';$('sqlout').textContent=result.error;return;}
   $('sqlout').innerHTML=result.error?'<span class="sql-err">'+escHtml(result.error)+'</span>':sqlTable(result.cols,result.got)+'<div class="sql-meta">'+result.gotN+'행</div>';
   liveTest={gate:!!result.ok,pass:result.ok?1:0,total:1};if(q.k)recordImpl(q.k,result.ok?100:0);
   applyResult(!!result.ok,result.error||(result.ok?'기준 결과와 일치해요.':'결과가 달라요. 내 결과 '+result.gotN+'행, 기준 결과 '+result.expN+'행. 값과 정렬 조건을 확인해 주세요.'),q);
  }).catch(()=>{if(!current())return;editor.readOnly=false;if(__monEditor)__monEditor.updateOptions({readOnly:false});button.disabled=false;button.textContent='다시 검사하기';$('sqlout').textContent='검사를 완료하지 못했어요. 다시 검사해 주세요.';});
 };
 const previousShow=showQ;showQ=function(){stop();previousShow();};
 new MutationObserver(()=>{if(!$('lesson').classList.contains('on'))stop();}).observe($('lesson'),{attributes:true,attributeFilter:['class']});
 window.SQLPractice={stop};
})();
