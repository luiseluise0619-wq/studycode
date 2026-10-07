/* Small, contextual explanations for people who build with AI and learn as they go. */
(function(){
 'use strict';
 const terms=[
  ['변수',['변수'],'값에 붙인 이름이에요. 이름으로 값을 다시 꺼내거나 바꿀 수 있어요.','age = 20 → age라는 이름에 20을 저장해요.'],
  ['문자열',['문자열','string'],'글자를 묶은 값이에요. 숫자처럼 보여도 따옴표 안에 있으면 글자로 다뤄요.','"20"은 글자, 20은 숫자예요.'],
  ['자료형',['자료형','데이터 타입'],'값의 종류예요. 숫자·글자·참/거짓처럼 종류에 따라 할 수 있는 일이 달라요.','숫자 둘은 더할 수 있고, 문자열 둘은 이어 붙일 수 있어요.'],
  ['함수',['함수','function','def'],'이름을 붙여 다시 쓸 수 있게 묶은 코드예요. 입력을 받아 일을 하고 결과를 돌려줄 수도 있어요.','두 숫자를 받아 합을 돌려주는 코드를 묶어 둘 수 있어요.'],
  ['매개변수와 인자',['매개변수','인자','parameter','argument'],'매개변수는 입력을 받을 이름이고, 인자는 함수를 부를 때 실제로 넣는 값이에요.','def greet(name):에서 name은 매개변수, greet("진")의 "진"은 인자예요.'],
  ['return',['return','반환','돌려주','돌려줘'],'함수를 끝내고, 호출한 곳으로 결과를 돌려줘요. 화면에 출력하는 것과는 달라요.','return 3의 결과는 다른 계산에 쓸 수 있어요.'],
  ['출력',['print','console.log','출력'],'사람이 확인할 수 있게 값을 화면이나 콘솔에 보여 줘요. 함수의 결과를 돌려주는 return과 구분해요.','Python의 print("안녕"), JavaScript의 console.log("안녕")처럼 써요.'],
  ['조건문',['조건문','if','else'],'조건을 확인하고 실행할 코드를 골라요.','비가 오면 우산을 챙기는 것처럼, 조건이 참일 때 정해 둔 일을 해요.'],
  ['반복문',['반복문','for','while'],'같은 일을 여러 번 하게 하는 코드예요. 언제 멈추는지도 정해야 해요.','목록의 항목을 하나씩 처리하거나, 조건이 참인 동안 계속 실행해요.'],
  ['배열과 리스트',['배열','리스트','array','list'],'여러 값을 순서대로 담는 자료예요. 위치로 특정 값을 꺼낼 수 있어요.','["사과", "배"]의 첫 번째 값은 보통 0번 위치에 있어요.'],
  ['객체와 딕셔너리',['객체','딕셔너리','object','dict'],'이름과 값을 짝지어 담는 자료예요. 언어에 따라 만드는 법과 동작은 달라요.','{"name": "진"}처럼 name이라는 이름으로 값을 찾을 수 있어요.'],
  ['참과 거짓',['불리언','boolean','bool','true','false'],'조건의 결과를 나타내는 값이에요.','나이가 18 이상인지 검사하면 참 또는 거짓이 나와요.'],
  ['인덱스 · 값의 위치',['인덱스','index'],'배열이나 문자열에서 값의 위치를 나타내는 번호예요. 데이터베이스의 인덱스와는 다른 뜻이에요.','대부분의 프로그래밍 언어에서는 첫 번째 위치가 0이에요.'],
  ['null·None·undefined',['null','None','undefined'],'값이 없음을 나타내는 표현이에요. 언어마다 의미가 달라요.','JavaScript의 null은 비어 있음을 명시한 값이고, undefined는 값이 정해지지 않았을 때 자주 나타나요.'],
  ['클래스',['클래스','class'],'객체가 가질 데이터와 동작을 정의하는 틀이에요.','사용자의 이름과 로그인 동작을 한곳에 묶어 정의할 수 있어요.'],
  ['예외',['예외','exception','throw','raise'],'실행 중에 생긴 오류를 알리는 방식이에요. 예상한 오류는 따로 처리할 수 있어요.','없는 파일을 읽을 때 실패를 처리하고 다시 선택하도록 안내할 수 있어요.'],
  ['디버깅',['디버깅','debug'],'예상과 다른 결과가 나온 원인을 찾고 고치는 과정이에요.','입력 → 중간 값 → 결과를 차례로 확인하면 어디서 달라졌는지 좁힐 수 있어요.'],
  ['테스트',['테스트','test'],'정해 둔 입력을 넣고 기대한 결과가 나오는지 확인하는 검사예요.','정상 입력뿐 아니라 빈 값과 잘못된 입력도 확인해요.'],
  ['비동기',['비동기','async'],'오래 걸리는 작업을 시작하고, 완료될 때 결과를 이어서 처리하는 방식이에요.','서버 응답을 기다리는 동안 화면의 다른 일을 처리할 수 있어요.'],
  ['Promise와 await',['Promise','await'],'Promise는 나중에 완료될 작업을 나타내요. await는 그 작업의 결과를 기다려 다음 줄로 이어 가요.','await는 주로 async 함수 안에서 써요.'],
  ['API',['API'],'프로그램끼리 기능이나 데이터를 주고받기 위해 정한 사용 방법이에요.','날씨 API에 도시를 보내고 기온을 받을 수 있어요.'],
  ['HTTP',['HTTP','GET','POST'],'웹에서 요청과 응답을 주고받는 약속이에요. 요청에는 주소와 메서드 등이 담겨요.','GET은 주로 조회, POST는 주로 새 작업을 요청할 때 사용해요.'],
  ['JSON',['JSON'],'이름과 값을 정해진 문법으로 적는 데이터 형식이에요.','{"name":"진","age":20}처럼 앱과 서버가 데이터를 주고받을 때 자주 써요.'],
  ['HTML',['HTML','태그'],'웹 화면의 제목·문단·버튼 같은 내용과 구조를 적는 언어예요.','<h1>안녕</h1>은 제목을 만들어요.'],
  ['CSS',['CSS','스타일'],'웹 화면의 색·크기·간격·배치를 정하는 언어예요.','color는 글자 색, padding은 요소 안쪽 여백이에요.'],
  ['선택자',['선택자','selector'],'CSS나 JavaScript에서 다룰 화면 요소를 찾는 표현이에요.','.card는 class가 card인 요소를 찾아요.'],
  ['DOM',['DOM'],'브라우저가 화면의 요소들을 객체로 만든 구조예요. JavaScript로 읽거나 바꿀 수 있어요.','버튼을 찾고 글자를 바꾸거나 클릭에 반응하게 할 수 있어요.'],
  ['이벤트',['이벤트','event','onClick','addEventListener'],'클릭·입력·화면 로드처럼 프로그램이 알아차릴 수 있는 일이에요.','버튼 클릭이 발생했을 때 실행할 함수를 연결해요.'],
  ['컴포넌트',['컴포넌트','component','React'],'화면의 한 부분을 담당하는 코드 묶음이에요. 같은 부분을 여러 곳에서 다시 쓸 수 있어요.','상품 카드 하나를 컴포넌트로 만들고 여러 상품에 사용할 수 있어요.'],
  ['상태 · state',['상태','state','useState'],'현재 화면이나 동작을 결정하는, 바뀔 수 있는 데이터예요.','React에서 상태를 바꾸면 그 값에 맞춰 화면을 다시 그려요.'],
  ['props',['props'],'부모 컴포넌트가 자식에게 전달하는 값이에요.','상품 카드에 상품 이름과 가격을 전달할 수 있어요.'],
  ['ref',['ref','useRef'],'React에서 요소나 값을 계속 참조할 때 쓰는 보관함이에요. ref 변경만으로 화면이 다시 그려지지는 않아요.','입력칸을 참조해 커서를 보내는 데 쓸 수 있어요.'],
  ['useEffect',['useEffect','effect'],'React에서 화면 렌더링과 외부 작업을 연결할 때 쓰는 기능이에요.','이벤트 연결이나 요청을 시작하고, 필요하면 정리하는 코드를 함께 적어요.'],
  ['타입',['타입','type','TypeScript'],'값이 어떤 종류여야 하는지 나타내요. TypeScript는 실행 전에 타입이 맞는지 검사할 수 있어요.','이 앱의 TypeScript 실습은 변환 후 동작을 검사해요. 타입 검사와는 별개예요.'],
  ['데이터베이스',['데이터베이스','database','DB'],'데이터를 저장하고, 조건에 맞춰 찾거나 바꿀 수 있게 관리하는 시스템이에요.','사용자나 주문 데이터를 표에 저장할 수 있어요.'],
  ['SQL',['SQL','쿼리'],'관계형 데이터베이스에 조회나 변경을 요청할 때 쓰는 언어예요.','하나의 요청 문장을 쿼리라고 불러요.'],
  ['SELECT',['SELECT'],'데이터베이스에서 필요한 값을 조회해요.','SELECT name FROM users는 users에서 name을 조회해요.'],
  ['WHERE',['WHERE'],'조건에 맞는 행만 골라요.','WHERE age >= 18은 나이가 18 이상인 행을 골라요.'],
  ['JOIN',['JOIN','조인'],'두 표의 데이터를 정해 둔 관계로 연결해요.','주문의 사용자 번호와 사용자 표의 번호를 맞춰 주문자 이름을 찾을 수 있어요.'],
  ['GROUP BY',['GROUP BY','집계'],'같은 기준의 행을 묶어 합계나 개수 등을 구할 때 써요.','도시별로 주문 개수를 셀 수 있어요.'],
  ['트랜잭션',['트랜잭션','transaction'],'여러 변경을 하나의 작업으로 묶어요. 모두 성공시키거나, 실패하면 되돌릴 수 있게 해요.','송금할 때 출금과 입금을 함께 처리해요.'],
  ['DB 인덱스',['DB 인덱스','데이터베이스 인덱스'],'조건에 맞는 데이터를 빨리 찾도록 만드는 보조 자료예요. 저장 공간과 변경 비용이 더 들어요.','책 뒤의 찾아보기처럼 전체를 읽지 않고 필요한 위치를 좁혀요.'],
  ['Git',['Git'],'파일 변경의 이력을 남기고 여러 사람의 작업을 합치는 도구예요.','잘못 바뀐 부분을 찾거나 이전 버전과 비교할 수 있어요.'],
  ['커밋',['커밋','commit'],'Git에 변경 묶음을 메시지와 함께 기록하는 일이에요.','한 기능을 고친 뒤 무엇을 바꿨는지 남겨요.'],
  ['브랜치',['브랜치','branch'],'기존 작업에서 갈라져 별도로 변경을 쌓는 흐름이에요.','새 기능을 따로 작업한 뒤 검사하고 합칠 수 있어요.'],
  ['병합',['병합','merge'],'서로 다른 작업 흐름의 변경을 합치는 일이에요.','같은 부분을 다르게 고쳤다면 충돌을 해결해야 해요.'],
  ['인증과 권한',['인증','권한','authentication','authorization'],'인증은 누구인지 확인하는 일이고, 권한은 그 사람이 무엇을 해도 되는지 확인하는 일이에요.','로그인했다고 모든 사용자의 주문을 수정할 수 있는 것은 아니에요.'],
  ['캐시',['캐시','cache'],'다시 사용할 결과를 잠시 보관해 같은 일을 줄이는 방법이에요.','원본이 바뀌었는데 옛 결과를 계속 쓰지 않도록 갱신 규칙도 필요해요.'],
  ['멱등성',['멱등','idempotent'],'같은 요청을 여러 번 보내도 결과가 한 번 보낸 것과 같게 만드는 성질이에요.','결제 요청을 재전송해도 중복 결제가 생기지 않도록 설계해요.'],
  ['프롬프트',['프롬프트','prompt'],'AI에게 맡길 일과 필요한 조건을 적는 요청이에요.','원하는 결과, 현재 코드, 기대와 다른 결과를 구체적으로 적어 주세요.']
 ];
 function plain(value){return String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
 function matches(text,alias){if(/^[a-z_$][a-z0-9_$]*$/i.test(alias))return new RegExp('(^|[^a-z0-9_$])'+alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^a-z0-9_$])','i').test(text);return text.toLowerCase().includes(alias.toLowerCase());}
 function related(q,theory,track){
  const question=plain(q.q),code=q.src||plain(q.code)||'',background=plain(JSON.stringify(theory||{})),text=question+' '+code+' '+background;
  const sql=track==='sql'||q.t==='sql'||/\b(SELECT|CREATE INDEX|EXPLAIN)\b|쿼리|데이터베이스|DB 인덱스/i.test(text);
  const selected=terms.map((term,index)=>({term,index,score:term[1].some(a=>matches(question,a))?0:term[1].some(a=>matches(code,a))?1:2})).filter(({term})=>{if(term[0]==='인덱스 · 값의 위치'&&sql)return false;if(term[0]==='DB 인덱스'&&sql)return /인덱스|index/i.test(text);return term[1].some(alias=>matches(text,alias));}).sort((a,b)=>a.score-b.score||a.index-b.index).slice(0,4).map(item=>item.term.slice());
  if(typeof ReaderGuide!=='undefined'){
   const names={'배열과 리스트':'배열','객체와 딕셔너리':'딕셔너리','매개변수와 인자':'매개변수','Promise와 await':'프로미스','DB 인덱스':'인덱스','멱등성':'멱등'};
   selected.forEach(term=>{const key=names[term[0]]||term[0];if(ReaderGuide.compatible(key,track,text)&&ReaderGuide.definitions[key])term[4]=ReaderGuide.definitions[key];});
   const seen=new Set(selected.map(t=>names[t[0]]||t[0]));
   for(const item of ReaderGuide.related(q,theory,track,4))if(selected.length<4&&!seen.has(item.name)){selected.push([item.name,[item.name],item.text,'']);seen.add(item.name);}
  }
  if(track==='python'){
   for(const term of selected){
    if(term[0]==='출력'){term[2]='값을 화면에 보여 주는 일이에요. Python에서는 print의 괄호 안에 보여 줄 값을 넣어요.';term[3]='print("안녕")을 실행하면 화면에 안녕이 나와요.';term[4]='';}
    if(term[0]==='배열과 리스트'||term[0]==='리스트'){term[2]='여러 값을 순서대로 모아 둔 목록이에요. 첫 번째 값은 0번 위치에 있어요.';term[3]='["사과", "배"]에서 0번은 "사과", 1번은 "배"예요.';term[4]='';}
   }
  }
  return selected;
 }
 function questionPrompt(q,code,track){return '나는 '+(COURSES[track]?.name||track)+'를 배우며 AI와 함께 코드를 만들고 있어요.\n\n연습할 내용:\n'+plain(q.q)+'\n\n현재 코드:\n'+String(code||'(아직 작성하지 않았어요)').slice(0,6000)+'\n\n정답 코드를 바로 완성하지 말고 도와주세요.\n1. 현재 코드가 하는 일을 입력 → 처리 → 결과 순서로 설명해 주세요.\n2. 낯선 용어의 뜻과 필요한 이유를 쉬운 말로 풀어 주세요.\n3. 내가 직접 바꿔 볼 한 가지와 예상 결과를 물어봐 주세요.\n4. 정상 입력과 잘못된 입력에서 확인할 테스트를 제안해 주세요.\n내가 답한 뒤 이해가 부족한 부분을 짚어 주세요.';}
 const previous=showQ;
 showQ=function(){previous();if(!run)return;const q=run.les.q[run.i];if(!q)return;
  const track=q._studyTrack||run.lang,list=related(q,run.les.theory,track),practical=['code','py','sql','html','react','ts','sim'].includes(q.t),theory=!!$('qbody').querySelector('.theory');
  if(!list.length&&!practical)return;
  const panel=document.createElement('details');panel.className='study-literacy';
  panel.innerHTML='<summary>낯선 말의 뜻'+(practical?' · AI에 물어볼 질문':'')+'</summary>'+(list.length?'<dl>'+list.map(t=>'<div><dt>'+escHtml(t[0])+'</dt><dd>'+escHtml(t[2])+(t[3]?'<small>'+escHtml(t[3])+'</small>':'')+(t[4]?'<p class="reader-comparison">'+escHtml(t[4])+'</p>':'')+'</dd></div>').join('')+'</dl>':'')+(practical?'<div class="study-ai-question"><b>AI와 공부할 때는 설명부터 부탁해 보세요.</b><p>지금 쓴 코드와 문제를 담아 질문을 준비해요. 사용하는 AI에 붙여 넣을 수 있어요.</p><button type="button" id="study-ai-prompt-open">설명을 부탁할 질문 만들기</button><div id="study-ai-prompt-panel" hidden><label for="study-ai-prompt">복사해서 AI에 물어보기</label><textarea id="study-ai-prompt" readonly rows="7"></textarea><button type="button" id="study-ai-prompt-copy">질문 복사하기</button><span id="study-ai-prompt-status" role="status"></span></div></div>':'');
  const title=$('qbody').querySelector('.q-title'),tools=$('qbody').querySelector('.study-lesson-tools');if(title)title.after(panel);else if(tools)tools.after(panel);else $('qbody').prepend(panel);
  const context=run;panel.addEventListener('toggle',()=>{if(panel.open&&run===context&&!run.answered&&!theory)run.studyHinted=true;});
  if(practical){panel.querySelector('#study-ai-prompt-open').onclick=()=>{const editor=$('pycode')||$('sqlcode')||$('livecode'),output=panel.querySelector('#study-ai-prompt');output.value=questionPrompt(q,editor?.value||q.src||q.code,track);panel.querySelector('#study-ai-prompt-panel').hidden=false;};panel.querySelector('#study-ai-prompt-copy').onclick=async()=>{const output=panel.querySelector('#study-ai-prompt');let copied=false;try{await navigator.clipboard.writeText(output.value);copied=true;}catch(_){output.select();try{copied=document.execCommand('copy');}catch(_){}}panel.querySelector('#study-ai-prompt-status').textContent=copied?'복사했어요. 사용하는 AI에 붙여 넣어 주세요.':'질문을 선택했어요. Ctrl+C로 복사해 주세요.';};}
 };
 window.CodeLiteracy={related,questionPrompt};
})();
