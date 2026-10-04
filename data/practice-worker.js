/* Execute pure code exercises off the app's UI thread. Results, never a fixed
   delay, decide when grading finishes. DOM exercises keep their real preview. */
(function () {
  'use strict';
  const TIMEOUT=5000;
  let active=null, python=null, serial=0;
  function extract(doc){const start=doc.indexOf('<script>'),end=doc.lastIndexOf('</script>');if(start<0||end<start)throw Error('실행 코드를 준비하지 못했어요.');return doc.slice(start+8,end);}
  function jsSource(doc){return '(function(){var send=self.postMessage.bind(self);self.window=self;var node={innerHTML:"",style:{},appendChild:function(){}};self.document={body:node,getElementById:function(){return node;},createElement:function(){return {style:{},textContent:""};}};self.parent={postMessage:function(d){send(d);}};["fetch","XMLHttpRequest","WebSocket","indexedDB","caches","importScripts","Worker","SharedWorker","navigator"].forEach(function(k){try{Object.defineProperty(self,k,{value:undefined,writable:false});}catch(_){}});})();\n'+extract(doc);}
  function dispose(job){if(!job)return;clearTimeout(job.timer);job.worker.terminate();URL.revokeObjectURL(job.url);}
  function stop(){if(active){const old=active;active=null;dispose(old);old.resolve({cancelled:true});}if(python&&python.job){const old=python.job;dispose(python);python=null;old.resolve({cancelled:true});}}
  function runJS(doc,kind){stop();return new Promise(resolve=>{
    if(typeof Worker!=='function'){resolve({unavailable:true,error:'코드를 따로 실행할 수 없는 브라우저예요. 최신 Chrome이나 Edge로 열어 주세요.'});return;}
    let url,worker;try{url=URL.createObjectURL(new Blob([jsSource(doc)],{type:'text/javascript'}));worker=new Worker(url);}catch(e){if(url)URL.revokeObjectURL(url);resolve({unavailable:true,error:'코드 실행을 시작하지 못했어요. 브라우저의 실행 제한을 확인해 주세요.'});return;}
    const job={worker,url,resolve,timer:null};active=job;
    const finish=result=>{if(active!==job)return;active=null;dispose(job);resolve(result);};
    worker.onmessage=e=>{if(e.data&&e.data.__cr===kind)finish(e.data);};
    worker.onerror=e=>{e.preventDefault();finish({error:e.message||'코드 문법을 확인해 주세요.'});};
    job.timer=setTimeout(()=>finish({error:'5초 안에 실행이 끝나지 않았어요. 반복문이 끝나는지 확인해 주세요.',timedOut:true}),TIMEOUT);
  });}
  function pythonWorker(){
    if(python)return python;
    const source='let engine;onmessage=async function(e){const d=e.data;try{if(!engine){importScripts('+JSON.stringify(PY_BASE+'pyodide.js')+');engine=await loadPyodide({indexURL:'+JSON.stringify(PY_BASE)+'});}if(d.pkgs.length)await engine.loadPackage(d.pkgs);postMessage({id:d.id,phase:"running"});try{const value=await engine.runPythonAsync(d.harness);postMessage({id:d.id,rows:JSON.parse(value)});}catch(e){postMessage({id:d.id,error:String(e&&e.message||e)});}}catch(e){postMessage({id:d.id,unavailable:true,error:"Python을 준비하지 못했어요. 인터넷 연결을 확인한 뒤 다시 검사해 주세요."});}};';
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    try{python={url,worker:new Worker(url),timer:null,job:null};}catch(e){URL.revokeObjectURL(url);throw e;}
    return python;
  }
  gradePy=function(q,code){stop();return new Promise(resolve=>{
    let service;try{service=pythonWorker();}catch(e){resolve({unavailable:true,error:'Python 실행을 시작하지 못했어요. 최신 Chrome이나 Edge에서 다시 열어 주세요.'});return;}
    const id=++serial,tests=q.tests||[],all=tests.concat(q.edge||[]);service.job={id,resolve};
    const finish=result=>{if(!service.job||service.job.id!==id)return;clearTimeout(service.timer);service.job=null;resolve(result);};
    service.worker.onmessage=e=>{const d=e.data;if(!service.job||d.id!==id)return;
      if(d.phase==='running'){clearTimeout(service.timer);if($('pyout'))$('pyout').textContent='코드를 검사하고 있어요…';service.timer=setTimeout(()=>{dispose(service);if(python===service)python=null;finish({error:'5초 안에 실행이 끝나지 않았어요. 반복문이 끝나는지 확인해 주세요.',timedOut:true});},TIMEOUT);return;}
      if(d.rows)finish({correct:d.rows.slice(0,tests.length),edge:d.rows.slice(tests.length)});
      else {if(d.unavailable){dispose(service);if(python===service)python=null;}finish(d);}
    };
    service.worker.onerror=e=>{e.preventDefault();dispose(service);if(python===service)python=null;finish({unavailable:true,error:'Python을 준비하지 못했어요. 인터넷 연결을 확인한 뒤 다시 검사해 주세요.'});};
    service.timer=setTimeout(()=>{dispose(service);if(python===service)python=null;finish({unavailable:true,error:'Python을 받는 데 시간이 오래 걸려요. 연결을 확인하고 다시 검사해 주세요.'});},90000);
    service.worker.postMessage({id,pkgs:q.pkgs||[],harness:pyHarness(code,all)});
  });};
  setupPy=function(q){const ta=$('pycode');if(ta)ta.value=q.src||'';const out=$('pyout');if(out)out.textContent='검사를 누르면 Python을 준비해 실행해요. 첫 실행에는 인터넷이 필요해요.';};
  setupLive=function(q){const ta=$('livecode');if(!ta)return;ta.value=q.src||'';
    if(q.run==='js'||q.tests){const view=$('liveview');if(view)view.srcdoc='<!doctype html><meta charset=utf-8><body style="font:14px system-ui;padding:12px;color:#5f6b62">코드를 다 쓴 뒤 아래 ‘코드 검사하기’를 눌러 주세요.</body>';ta.oninput=()=>{liveTest=null;liveOut='';};}
    else {const go=()=>renderLive(q.run,ta.value);let timer;ta.oninput=()=>{clearTimeout(timer);timer=setTimeout(go,400);};go();}
  };
  const coreCheck=onCheck;
  onCheck=function(){
    if(!run||run.answered)return;
    const context=run,index=run.i,q=run.les.q[index];
    if((q.t!=='code'||q.rt||(!q.tests&&q.run!=='js'))&&q.t!=='py'&&q.t!=='sim'&&q.t!=='ts'){coreCheck();return;}
    const chk=$('check');chk.disabled=true;chk.textContent=q.t==='py'?'Python 준비·검사 중…':'코드 검사 중…';
    const editor=$((q.t==='py'?'pycode':'livecode')),source=editor.value;
    editor.readOnly=true;if(__monEditor)__monEditor.updateOptions({readOnly:true});
    const unlock=()=>{if(editor.isConnected)editor.readOnly=false;if(run===context&&run.i===index&&__monEditor)__monEditor.updateOptions({readOnly:false});};
    const execute=q.t==='py'?gradePy(q,source):q.t==='sim'?runJS(simDoc(source,q.tests),'sim'):q.t==='ts'?ensureSucrase().then(()=>{if(run!==context||run.i!==index||!$("lesson").classList.contains("on"))return {cancelled:true};const t=tsToJs(source,false);return t.error?{error:t.error}:runJS(testDoc(t.code,q),'test');}).catch(()=>({unavailable:true,error:'TypeScript 변환기를 불러오지 못했어요. 연결을 확인하고 다시 검사해 주세요.'})):runJS(q.tests?testDoc(source,q):jsDoc(source),q.tests?'test':'out');
    Promise.resolve(execute).then(r=>{
      unlock();
      if(run!==context||run.i!==index||!$('lesson').classList.contains('on')||r.cancelled)return;
      if(r.unavailable){chk.disabled=false;chk.textContent='다시 검사하기';const output=$(q.t==='py'?'pyout':'foot-msg');if(output)output.textContent=r.error;toast(r.error);return;}
      if(q.t==='py'){
        if(r.error){if($('pyout'))$('pyout').textContent=r.error;applyResult(false,r.error,q);return;}
        renderPyRows(r.correct,r.edge);const rows=r.correct.concat(r.edge),pass=rows.filter(x=>x[0]).length,ok=rows.length>0&&pass===rows.length;
        liveTest={pass,total:rows.length,gate:ok,rows};if(q.k)recordImpl(q.k,Math.round(pass/Math.max(1,rows.length)*100));
        applyResult(ok,'검사 '+pass+'/'+rows.length+(ok?' 통과':' — 실패한 입력을 확인해 주세요.'),q);return;
      }
      if(q.t==='sim'){simFrames=r.frames||[];simIdx=0;simRenderFrame();}
      if(r.err&&!r.error)r.error=r.err;
      liveOut=String(r.text||r.log||'');liveTest=r;
      if(r.total)r.impl=Math.round((r.pass||0)/r.total*100);
      const ok=!r.error&&(q.tests?!!r.gate:norm(r.text||'')===norm(q.expect||''));
      if(r.impl!=null&&q.k)recordImpl(q.k,r.impl);
      const msg=r.error||(q.tests?'검사 '+(r.pass||0)+'/'+(r.total||q.tests.length)+(ok?' 통과':' — 실패한 입력을 확인해 주세요.'):'예상 출력: '+q.expect);
      const frame=$(q.t==='sim'?'simframe':'liveview');if(frame)frame.srcdoc='<!doctype html><meta charset=utf-8><body style="font:13px system-ui;padding:12px;color:#26362e;white-space:pre-wrap">'+escHtml(r.error||r.text||(r.rows||[]).map(row=>(row[0]?'✓ ':'✗ ')+row[1]+' → '+row[2]+(!row[0]?' (기대 '+row[3]+')':'')).join('\n')||msg)+'</body>';
      applyResult(ok,msg,q);
    }).catch(error=>{unlock();if(run===context&&run.i===index&&$('lesson').classList.contains('on')){chk.disabled=false;chk.textContent='다시 검사하기';toast('검사를 완료하지 못했어요. '+error.message);}});
  };
  const oldSimSetup=simSetup;
  simSetup=function(q){oldSimSetup(q);const ta=$('livecode');if(ta)ta.oninput=()=>{liveTest=null;};};
  // setupSim's initial render must also be harmless; actual code runs on check.
  simRun=function(){simStop();liveTest=null;simFrames=[];simIdx=0;simRenderFrame();};
  setupTs=function(q){const ta=$('livecode');if(ta){ta.value=q.src||'';ta.oninput=()=>{liveTest=null;};}};
  const oldShow=showQ;
  showQ=function(){stop();oldShow();if(run&&!run.answered&&!$('qbody').querySelector('.theory')){const q=run.les.q[run.i];if(['code','py','sql','ts','sim','html','react','arch','wire'].includes(q.t))$('check').textContent='코드 검사하기';}};
  new MutationObserver(()=>{if(!$('lesson').classList.contains('on'))stop();}).observe($('lesson'),{attributes:true,attributeFilter:['class']});
  window.PracticeWorker={stop,timeout:TIMEOUT,runJavaScript:runJS};
})();
