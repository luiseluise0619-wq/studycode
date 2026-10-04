/* Real DOM previews need the browser thread. Put a time check in user loops and
   function bodies, and grade only the result belonging to the current run. */
(function(){
 'use strict';
 let sequence=0;
 function instrument(source){
  let tree;try{tree=acorn.parse(source,{ecmaVersion:'latest',sourceType:'module',allowReturnOutsideFunction:true});}catch(e){return source;}
  const edits=[];
  function add(pos,text){edits.push({pos,text});}
  function visit(node){
   if(!node||typeof node!=='object')return;
   if(['WhileStatement','DoWhileStatement','ForStatement','ForInStatement','ForOfStatement'].includes(node.type)){
    const body=node.body;if(body.type==='BlockStatement')add(body.start+1,'__crSafetyTick();');else {add(body.start,'{__crSafetyTick();');add(body.end,'}');}
   }
   if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(node.type)){
    const body=node.body;if(body.type==='BlockStatement'){let pos=body.start+1;for(const statement of body.body){if(!statement.directive)break;pos=statement.end;}add(pos,';__crSafetyTick();');}
    else {add(body.start,'(__crSafetyTick(),');add(body.end,')');}
   }
   for(const key of Object.keys(node)){if(['start','end','loc'].includes(key))continue;const value=node[key];if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
  }
  visit(tree);edits.sort((a,b)=>b.pos-a.pos);let result=source;for(const edit of edits)result=result.slice(0,edit.pos)+edit.text+result.slice(edit.pos);return result;
 }
 function finishDoc(doc,token){
  const header='(function(){var deadline=performance.now()+1000;Object.defineProperty(window,"__crSafetyTick",{value:function(){if(performance.now()>deadline)throw new Error("실행이 1초 넘게 멈추지 않았어요. 반복문이 끝나는지 확인해 주세요.");},writable:false});setInterval(function(){deadline=performance.now()+1000;},50);window.addEventListener("error",function(e){e.preventDefault();window.__crUserError=String(e.message||"실행 오류");parent.postMessage({__cr:"test",__studyToken:'+JSON.stringify(token)+',gate:false,pass:0,total:0,error:window.__crUserError},"*");});})();';
  doc=doc.replace(/parent\.postMessage\((\w+)\s*,\s*"\*"\)/g,(_,name)=>'parent.postMessage(Object.assign('+name+',{__studyToken:'+JSON.stringify(token)+'},window.__crUserError?{gate:false,error:window.__crUserError}:{}),"*")');
  return doc.replace(/(<meta[^>]*>)/i,'$1<script>'+header+'</script>');
 }
 const coreHTML=htmlTestDoc;
 htmlTestDoc=function(html,tests,token){
  const safe=String(html).replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi,(_,start,code,end)=>start+instrument(code)+end);
  return finishDoc(coreHTML(safe,tests),token||'preview');
 };
 const coreReact=reactTestDoc;
 reactTestDoc=function(code,tests,library,token){return finishDoc(coreReact(instrument(code),tests,library),token||'preview');};
 // Keep preview navigation and grading in one action. An earlier auto-preview
 // can otherwise replace the checked document while its result is on the way.
 setupHtml=setupReact=function(q){const editor=$('livecode'),frame=$('liveview');if(editor){editor.value=q.src||'';editor.oninput=()=>{liveTest=null;};}if(frame)frame.srcdoc='<!doctype html><meta charset=utf-8><body style="font:14px system-ui;padding:12px;color:#5f6b62">코드를 다 쓴 뒤 아래 ‘코드 검사하기’를 누르면 화면과 검사 결과를 볼 수 있어요.</body>';};
 const coreRenderHTML=renderHtmlTest;renderHtmlTest=function(q,code){const frame=$('liveview');if(frame){frame.style.width=q.previewWidth?q.previewWidth+'px':'100%';frame.style.maxWidth='100%';frame.getBoundingClientRect();const label=frame.parentElement.querySelector('.tag');if(label&&q.previewWidth)label.textContent='미리보기 · 최대 '+q.previewWidth+'px';}return coreRenderHTML(q,code);};
 const coreRenderReact=renderReactTest;renderReactTest=function(q,code){const frame=$('liveview');if(frame){frame.style.width=q.previewWidth?q.previewWidth+'px':'100%';frame.style.maxWidth='100%';frame.getBoundingClientRect();}return coreRenderReact(q,code);};
 const previousCheck=onCheck;
 onCheck=function(){
  if(!run||run.answered)return;const context=run,index=run.i,q=run.les.q[index];
  if(q.t!=='html'&&q.t!=='react'){previousCheck();return;}
  const token='dom-'+(++sequence);q._studyDOM=token;
  const oldFrame=$('liveview'),frame=oldFrame.cloneNode(false);frame.removeAttribute('srcdoc');frame.removeAttribute('src');oldFrame.replaceWith(frame);
  const editor=$('livecode'),button=$('check');let result=null,loaded=false,finished=false;
  button.disabled=true;button.textContent='화면 검사 중…';editor.readOnly=true;
  frame.tabIndex=0;frame.setAttribute('aria-label','코드 미리보기');frame.getBoundingClientRect();frame.focus({preventScroll:true});
  if(__monEditor)__monEditor.updateOptions({readOnly:true});
  const current=()=>run===context&&run.i===index&&$('lesson').classList.contains('on');
  function cleanup(){clearTimeout(timer);window.removeEventListener('message',message);frame.removeEventListener('load',load);if(editor.isConnected)editor.readOnly=false;if(current()&&__monEditor)__monEditor.updateOptions({readOnly:false});}
  function finish(){if(finished||!current()||!result||(!loaded&&!result.error))return;finished=true;cleanup();liveTest=result;const ok=!!result.gate&&!result.error;if(q.k)recordImpl(q.k,result.total?Math.round(result.pass/result.total*100):0);const failures=(result.detail||[]).filter(d=>!d.ok).slice(0,2).map(d=>d.d).join(' · ');applyResult(ok,result.error||('검사 '+result.pass+'/'+result.total+(ok?' 통과':failures?' — '+failures:' — 남은 검사를 확인해 주세요.')),q);}
  function message(event){if(event.source!==frame.contentWindow||!event.data||event.data.__studyToken!==token)return;result=event.data;setTimeout(finish,120);}
  function load(){loaded=true;setTimeout(finish,120);}
  window.addEventListener('message',message);frame.addEventListener('load',load);
  const timer=setTimeout(()=>{if(finished)return;finished=true;cleanup();if(current()){button.disabled=false;button.textContent='다시 검사하기';$('foot-msg').textContent='화면 검사를 준비하지 못했어요. 연결을 확인한 뒤 다시 검사해 주세요.';}},10000);
  if(q.t==='html')renderHtmlTest(q,editor.value);else renderReactTest(q,editor.value);
 };
 window.DOMPractice={instrument};
})();
