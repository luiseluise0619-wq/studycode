(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.ReaderGuide=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const definitions=/* DEFINITIONS */ {};
  const titles=/* TITLES */ {};
  function title(value){return titles[value]||value;}
  const aliases={
    '변수':['변수'], '함수':['함수','function','def'], '반환값':['반환값','return','반환'],
    '매개변수':['매개변수','parameter'], '인자':['인자','argument'], '반복문':['반복문','for','while'],
    '프로미스':['프로미스','Promise','await'], '비동기':['비동기','async'], '콜백':['콜백','callback'],
    '배열':['배열','array'], '딕셔너리':['딕셔너리','dictionary'], '집합':['집합','Set'],
    '클로저':['클로저','closure'], '인덱스':['인덱스','CREATE INDEX','EXPLAIN'],
    '멱등':['멱등','idempotent'], '멱등성 키':['멱등성 키','Idempotency-Key'],
    '아웃박스':['아웃박스','outbox'], '페이지네이션':['페이지네이션','pagination'],
    '커서':['커서','cursor'], '백오프':['백오프','backoff'], '지터':['지터','jitter'],
    '뮤텍스':['뮤텍스','mutex'], '회귀':['회귀 테스트','regression'],
    '트랜잭션':['트랜잭션','transaction'], '경쟁 조건':['경쟁 조건','race condition'],
    '교착':['교착','deadlock'], '커넥션 풀':['커넥션 풀','connection pool'],
    '백분위':['백분위','P95','P99'], '최종 일관성':['최종 일관성','eventual consistency'],
    '카나리':['카나리','canary'], '블루그린':['블루그린','blue-green'],
    '정밀도':['정밀도','precision'], '재현율':['재현율','recall'], '과적합':['과적합','overfit'],
    '경사 하강':['경사 하강','gradient descent'], '브로드캐스팅':['브로드캐스팅','broadcasting'],
    '웹소켓':['웹소켓','WebSocket'], 'DOM':['DOM','querySelector'],
    '인증과 권한':['인증과 권한','authentication','authorization'], '요청 ID':['요청 ID','request ID'],
    '준비 상태':['준비 상태','readiness'], '커버리지':['커버리지','coverage']
  };
  function plain(v){return String(v||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
  function matches(text,term){
    if(/^[a-z][a-z0-9 -]*$/i.test(term))return new RegExp('(^|[^a-z0-9_$])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^a-z0-9_$])','i').test(text);
    return text.includes(term);
  }
  function compatible(name,track,text){
    const db=['sql','dbt','backend','sysd','security'].includes(track)||/데이터베이스|DB|쿼리|CREATE INDEX/i.test(text);
    const ml=['ai','ml','dl','mleval','stat'].includes(track);
    if(name==='인덱스'||name==='정규화')return db;
    if(name==='힙')return track!=='algo'&&!/힙 정렬|최소 힙|최대 힙|우선순위 큐/.test(text);
    if(name==='토큰')return /인증|로그인|JWT|권한|세션/.test(text);
    if(name==='정밀도'||name==='재현율')return ml;
    if(name==='회귀')return !ml||/테스트|regression test/i.test(text);
    if(name==='분산')return ['stat','math','ml','mleval'].includes(track)&&!/분산 시스템/.test(text);
    return true;
  }
  function related(q,theory,track,limit=3,title=''){
    const question=plain(q?.q||q?.question||q?.goal),headline=plain(title),summary=plain(typeof theory==='string'?theory:theory?.sum),body=plain(JSON.stringify(theory?.body||[]));
    const code=String(q?.src||q?.code||''),context=[question,headline,summary,body,code].join(' '),items=[];
    for(const [name,text] of Object.entries(definitions)){
      if(!compatible(name,track,context))continue;
      const names=aliases[name]||[name];
      const score=names.some(n=>matches(question,n))?0:names.some(n=>matches(headline,n))?1:names.some(n=>matches(summary,n))?2:names.some(n=>matches(body,n))?3:names.some(n=>matches(code,n))?4:-1;
      if(score>=0)items.push({name,text,score});
    }
    items.sort((a,b)=>a.score-b.score||b.name.length-a.name.length);
    return items.slice(0,limit);
  }
  function escape(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function html(items){return items.length?'<aside class="reader-analogy"><b>비유로 이해하기 · '+escape(items[0].name)+'</b><p>'+escape(items[0].text)+'</p></aside>':'';}
  return {definitions,related,compatible,html,title};
});
