/* New contexts reuse known concepts; all checks still run against real controls. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.VIBE_SCENARIOS.push(...factory(root.VIBE_SCENARIOS));})(typeof globalThis!=='undefined'?globalThis:this,function(base){
 'use strict';
 const result=[],check=(d,js)=>({d,js});
 const names={cart:['좌석 예약','인원에 맞는 예약 금액과 수수료를 계산해 주세요.'],search:['여행지 찾기','도시 검색에서도 공백·대소문자와 빈 결과를 처리해 주세요.'],todo:['읽을 알림','읽지 않은 알림에서 고른 항목만 읽음으로 바꾸고 남은 개수를 표시해 주세요.'],form:['초대 등록','연락 이메일과 초대 암호가 빠지거나 형식이 틀리면 이유를 알려 주세요.'],request:['날씨 요청','마지막으로 고른 지역의 결과만 반영하고, 실패해도 다시 요청할 수 있게 해 주세요.'],memo:['짧은 댓글','입력한 글을 그대로 보여 주고 최근 댓글 세 개만 최신순으로 남겨 주세요.']};
 for(let variant=0;variant<3;variant++)for(const original of base){
  const p=JSON.parse(JSON.stringify(original)),pairs=[];
  if(p.id==='cart'){
   const price=[8000,12000,6000][variant],fmt=n=>n.toLocaleString('en-US');
   for(const n of [40000,30000,23000,20000,10000])pairs.push([fmt(n),fmt(n===23000?price*2+3000:n/10000*price)]);
   pairs.push(['30000',String(price*3)],['10000',String(price)],['qty','seats'],['renderPrice','renderBooking'],['subtotal','fare'],['shipping','fee'],['생각 노트',['봄 공연','사진 전시','독립 영화'][variant]],['문구 가게','예약 연습'],['나의 장바구니','좌석 예약'],['장바구니','예약'],['한 권','한 명'],['권','명'],['배송비','예약 수수료'],['상품 금액','좌석 금액'],['상품','좌석']);
  }
  if(p.id==='search')pairs.push(['NOTEBOOK',['SEOUL','LONDON','PARIS'][variant]],['Notebook',['Seoul','London','Paris'][variant]],['notebook',['seoul','london','paris'][variant]],['키보드',['부산','오사카','로마'][variant]],['무선 마우스',['제주','도쿄','밀라노'][variant]],['마우스',['제주','도쿄','밀라노'][variant]],['products','cities'],['query','destination'],['product','city'],['상품','도시'],['책상 위의 물건','다음 여행'],['필요한 물건 찾기','여행지 찾기']);
  if(p.id==='todo')pairs.push(['tasks','messages'],['task','message'],['remaining','unread'],['장보기',['예약 확인','회의 안내','수업 안내'][variant]],['물 마시기',['탑승 안내','리뷰 요청','과제 안내'][variant]],['코드 읽기',['출발 알림','작업 알림','시험 안내'][variant]],['할 일','알림'],['미완료','안 읽음'],['완료','읽음']);
  if(p.id==='form')pairs.push(['emailInput','contactInput'],['passwordInput','codeInput'],["'#email'","'#contact'"],["'#password'","'#invite-code'"],['id="email"','id="contact"'],['id="password"','id="invite-code"'],['이메일','연락 이메일'],['비밀번호','초대 암호'],['로그인 폼',['모임 초대 등록','스터디 초대 등록','행사 초대 등록'][variant]],['실제 로그인','실제 가입'],['사용자 확인','초대 권한 확인']);
  if(p.id==='request')pairs.push(['키보드',['서울 21도','부산 24도','제주 19도'][variant]],['마우스','맑음'],['이전 책 목록','이전 지역 10도'],['category','region'],['mockProducts','mockWeather'],['loadProducts','loadWeather'],['상품 목록','날씨'],['상품','지역'],['이전 책','이전 지역'],['목록','날씨']);
  if(p.id==='memo')pairs.push(['notes','comments'],['note','comment'],['메모','댓글'],['첫째','첫 댓글'],['둘째','둘째 댓글'],['셋째','셋째 댓글'],['넷째','넷째 댓글'],['작은 댓글장',['게시물 댓글','사진 댓글','영상 댓글'][variant]]);
  const transform=text=>pairs.reduce((s,[a,b])=>a==='query'?s.replace(/\bquery\b/g,b):s.split(a).join(b),text);
  p.html=transform(p.html);p.source=transform(p.source);p.concepts=p.concepts.map(t=>t.map(transform));
  const flows={cart:[['입력','seats.value에서 예약 인원을 읽어요.'],['처리','인원에 맞는 좌석 금액과 예약 수수료를 계산해요.'],['화면','계산한 좌석 금액·수수료·합계를 보여 줘요.']],search:[['입력','destination.value에서 도시 이름을 읽어요.'],['처리','검색어와 도시 이름을 같은 기준으로 비교해요.'],['화면','맞는 도시 목록이나 결과 없음 안내를 보여 줘요.']],todo:[['입력','현재 필터와 체크한 알림을 읽어요.'],['처리','messages에서 고유 번호로 해당 알림을 찾아 바꿔요.'],['화면','목록과 읽지 않은 알림 개수를 다시 그려요.']],form:[['입력','연락 이메일과 초대 암호를 읽어요.'],['처리','빈 값·이메일 형식·암호 길이를 확인해요.'],['화면','통과 안내 또는 실패 이유를 보여 줘요.']],request:[['입력','region.value에서 응답 상황을 읽어요.'],['처리','mockWeather를 기다리고 현재 요청인지 확인해요.'],['화면','기다림·날씨 결과·실패 상태를 갱신해요.']],memo:[['입력','댓글 입력칸의 글을 읽어요.'],['처리','공백을 확인하고 최근 댓글 세 개를 남겨요.'],['화면','태그를 해석하지 않고 글자로 보여 줘요.']]};
  p.reading=flows[p.id];
  let tests=[...original.missions[0].tests,...original.missions[1].tests];
  if(original.id==='todo')tests=[check('처음 읽지 않은 알림은 2개',"TXT('#remaining')==='2'"),...original.missions[0].tests,check('읽지 않은 알림 개수도 1개로 갱신',"TXT('#remaining')==='1'"),check('나머지도 읽으면 0개',`(()=>{CLICK('[data-filter="todo"]');var box=Q('.task input');box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));return TXT('#remaining')==='0'&&COUNT('.task')===0;})()`)];
  p.family=original.id;p.kind='transfer';p.variant=variant;p.id=original.id+'-transfer-'+variant;p.app=names[original.id][0];p.title=p.app+'에 배운 것 적용하기';p.summary=names[original.id][1];p.minutes=original.level===3?20:10;
  const price=[8000,12000,6000][variant],goals={cart:`한 좌석은 ${price.toLocaleString('ko-KR')}원이에요. 인원에 맞춰 좌석 금액을 계산해 주세요. 3명분 금액부터 예약 수수료는 0원, 그 미만은 3,000원이에요. 인원이 0이거나 음수이면 금액과 수수료 모두 0원으로 처리해 주세요.`,search:'검색어 앞뒤 공백과 영문 대소문자가 달라도 같은 도시를 찾아 주세요. 빈 검색어는 도시 3개를 모두 보여 줘요. 결과가 없으면 안내를 보여 주고, 다시 찾으면 숨겨 주세요.',todo:'안 읽음 목록에서 체크한 알림만 읽음으로 바꿔 주세요. 다른 알림의 상태는 그대로 유지해요. 읽지 않은 알림 개수도 함께 갱신해 주세요.',form:'연락 이메일이나 초대 암호가 비어 있거나 공백뿐이면 안내해 주세요. 이메일 형식과 암호 8자 이상도 확인해요. 조건을 통과한 경우에만 통과 안내를 보여 주세요.',request:'요청 중에는 버튼을 잠그고 기다림 표시를 보여 주세요. 성공하거나 실패하면 다시 요청할 수 있게 정리해요. 지역을 빠르게 바꾸면 마지막 선택의 응답만 반영하고, 이전 결과나 오류가 새 화면을 덮지 않게 해 주세요.',memo:'댓글을 HTML로 해석하지 말고 입력한 글 그대로 보여 주세요. 공백뿐인 댓글은 추가하지 않아요. 최근 댓글 3개만 최신순으로 보여 주고 목록에서도 글자를 그대로 보존해 주세요.'};
  p.missions=[{id:'transfer',title:p.title,goal:goals[original.id],hint:transform(original.missions.map(m=>m.hint).join(' ')),quiz:JSON.parse(JSON.stringify(original.missions[1].quiz)),reference:transform(original.missions[1].reference),tests:tests.map(t=>({d:transform(t.d),js:transform(t.js)}))}];
  p.missions[0].quiz.q=transform(p.missions[0].quiz.q);p.missions[0].quiz.options=p.missions[0].quiz.options.map(transform);p.missions[0].quiz.why=transform(p.missions[0].quiz.why);
  if(original.id==='cart')p.missions[0].quiz.q='3명분 금액부터 예약 수수료를 없애려면 어떤 비교가 맞나요?';
  if(original.id==='todo')p.missions[0].quiz={q:'messages.filter(message => !message.done).length는 무엇을 세나요?',options:['읽은 알림의 개수','모든 알림의 개수','읽지 않은 알림의 개수'],answer:2,why:'done이 false인 알림만 남긴 뒤 개수를 세어요. 화면 필터가 달라져도 읽지 않은 전체 알림의 개수를 표시합니다.'};
  result.push(p);
 }
 const html='<div class="demo-kicker">내가 만드는 앱</div><h1>읽을 책 모아두기</h1><form id="book-form" novalidate><label class="field">책 이름<input id="book-title" maxlength="80"></label><button id="book-add" class="primary">목록에 넣기</button></form><p id="book-error" class="error" role="status"></p><label class="field">제목으로 찾기<input id="book-query"></label><div class="filters"><button data-book-filter="all">모두</button><button data-book-filter="unread">읽을 책</button></div><div id="book-list" class="tasks"></div><p id="book-empty" class="empty" hidden>찾는 책이 없어요.</p><p>아직 읽을 책 <b id="book-count"></b>권</p>';
 const source=String.raw`// readBooks와 writeBooks는 저장을 맡는 준비된 함수예요.
let books = [
  { id: 11, title: 'JavaScript 첫걸음', read: true },
  { id: 22, title: '나의 공부 노트', read: false }
];
let nextId = 23;
let bookFilter = 'all';
const bookList = document.querySelector('#book-list');
const bookQuery = document.querySelector('#book-query');
const bookError = document.querySelector('#book-error');

function renderBooks() {
  const word = bookQuery.value;
  const visible = books.filter(book => book.title.includes(word));
  bookList.replaceChildren();
  visible.forEach(book => {
    const row = document.createElement('label');
    row.className = 'task';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = book.read;
    box.dataset.bookId = book.id;
    row.append(box, document.createTextNode(' ' + book.title));
    bookList.append(row);
  });
  document.querySelector('#book-empty').hidden = true;
  document.querySelector('#book-count').textContent = books.length;
}

document.querySelector('#book-form').addEventListener('submit', event => {
  event.preventDefault();
  // 2단계: 제목을 확인하고 새 책을 추가해요.
});
bookList.addEventListener('change', event => {
  // 2단계: 순서 대신 고유 번호로 읽음 상태를 바꿔요.
});
bookQuery.addEventListener('input', renderBooks);
document.querySelectorAll('[data-book-filter]').forEach(button => {
  button.addEventListener('click', () => {
    bookFilter = button.dataset.bookFilter;
    renderBooks();
  });
});
renderBooks();`;
 const first=source.replace('const word = bookQuery.value;','const word = bookQuery.value.trim().toLowerCase();').replace('book.title.includes(word)','book.title.toLowerCase().includes(word) && (bookFilter === "all" || !book.read)').replace("document.querySelector('#book-empty').hidden = true;","document.querySelector('#book-empty').hidden = visible.length > 0;").replace("document.querySelector('#book-count').textContent = books.length;","document.querySelector('#book-count').textContent = books.filter(book => !book.read).length;");
 const second=first.replace('// 2단계: 제목을 확인하고 새 책을 추가해요.',String.raw`const input = document.querySelector('#book-title');
  const title = input.value.trim();
  bookError.textContent = '';
  if (!title) { bookError.textContent = '책 이름을 입력해 주세요.'; return; }
  if (books.length >= 100) { bookError.textContent = '이 목록에는 책을 100권까지 모아둘 수 있어요.'; return; }
  books.push({ id: nextId++, title, read: false });
  input.value = '';
  renderBooks();`).replace('// 2단계: 순서 대신 고유 번호로 읽음 상태를 바꿔요.',String.raw`const id = Number(event.target.dataset.bookId);
  const book = books.find(book => book.id === id);
  if (book) book.read = event.target.checked;
  renderBooks();`);
 const third=second.replace('let nextId = 23;',String.raw`const restored = readBooks();
if (restored) books = restored;
let nextId = Math.max(0, ...books.map(book => book.id)) + 1;`).replace("  input.value = '';", "  writeBooks(books);\n  input.value = '';").replace('  if (book) book.read = event.target.checked;','  if (book) book.read = event.target.checked;\n  writeBooks(books);');
 const query=value=>`Q('#book-query').value=${JSON.stringify(value)};Q('#book-query').dispatchEvent(new Event('input'));`;
 const add=value=>`Q('#book-title').value=${JSON.stringify(value)};CLICK('#book-add');`;
 const firstTests=[check('처음 읽을 책은 1권',"TXT('#book-count')==='1'"),check('공백·대문자 검색도 같은 책 찾기',`(()=>{${query(' JAVASCRIPT ')}return COUNT('.task')===1&&TXT('#book-list').includes('JavaScript');})()`),check('없는 제목이면 안내 표시',`(()=>{${query('없는제목')}return COUNT('.task')===0&&!Q('#book-empty').hidden;})()`),check('읽을 책 필터와 검색을 함께 적용',`(()=>{${query('')}CLICK('[data-book-filter="unread"]');return COUNT('.task')===1&&TXT('#book-list').includes('공부 노트')&&Q('#book-empty').hidden;})()`)];
 const secondTests=[check('빈 이름은 추가하지 않고 이유 안내',`(()=>{${add('   ')}return COUNT('.task')===2&&TXT('#book-error').includes('입력');})()`),check('사용자 제목의 태그는 글자로 표시',`(()=>{${add('<b>새 책</b>')}return COUNT('.task')===3&&TXT('#book-list').includes('<b>새 책</b>')&&COUNT('#book-list b')===0&&TXT('#book-count')==='2';})()`),check('필터된 목록에서도 선택한 책만 읽음 처리',`(()=>{CLICK('[data-book-filter="unread"]');var box=QA('.task').find(e=>e.textContent.includes('공부 노트')).querySelector('input');box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));return COUNT('.task')===1&&TXT('#book-list').includes('<b>새 책</b>')&&TXT('#book-count')==='1';})()`),check('검색 기능도 유지',`(()=>{CLICK('[data-book-filter="all"]');${query(' JAVASCRIPT ')}return COUNT('.task')===1;})()`)];
 const thirdTests=[check('저장된 목록을 시작할 때 복원',"COUNT('.task')===1&&TXT('#book-list').includes('저장된 책')&&TXT('#book-count')==='1'"),check('추가한 책과 고유 번호를 저장',`(()=>{${add('다음 책')}var stored=readBooks();return stored.length===2&&stored[1].title==='다음 책'&&stored[1].id!==stored[0].id;})()`),check('읽음 상태 변경도 저장',"(()=>{var box=Q('.task input');box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));return readBooks()[0].read&&TXT('#book-count')==='1';})()"),check('빈 제목은 저장 목록도 바꾸지 않음',`(()=>{${add(' ')}return readBooks().length===2;})()`)];
 const quiz=(q,options,answer,why)=>({q,options,answer,why});
 result.push({id:'bookshelf',kind:'capstone',app:'내 독서 목록',title:'한 앱에 배운 것 모으기',summary:'검색·입력 검사·목록 상태·저장을 연결하고 파일로 가져가요.',level:2,minutes:20,html,source,foundation:{track:'javascript',lesson:'배열'},concepts:[['상태와 화면','books는 실제 목록이에요. 화면은 필터를 거친 일부만 보여 줄 수 있어요.'],['저장','readBooks는 저장된 목록을 읽고 writeBooks는 현재 목록을 저장해요. 내보낸 앱은 브라우저 저장소를 사용해요.'],['입력은 글자로','책 이름은 사용자가 쓴 글이에요. HTML로 해석하지 않고 글자 노드로 붙여요.']],missions:[
 {id:'find',title:'찾고 싶은 책만 보여 주기',goal:'공백·대소문자를 정리해 검색하고, 읽을 책 필터와 남은 개수·빈 결과 안내를 연결해 주세요.',hint:'검색어와 제목을 같은 기준으로 비교하세요. 보이는 목록과 전체 미독서 개수는 별개예요.',tests:firstTests,reference:first,quiz:quiz('필터로 보이지 않는 책도 books에 남겨야 하는 이유는?',['다른 필터로 돌아오면 다시 보여 줘야 하므로','배열이 길어야 하므로','검색을 막으려고'],0,'화면의 일부를 숨기는 일과 원본 목록에서 삭제하는 일은 달라요.')},
 {id:'edit',title:'책 추가와 읽음 상태 연결하기',goal:'빈 제목은 이유를 안내하고, 이름이 있으면 목록에 추가해 주세요. 태그도 글자로 보여 주고, 필터 뒤에도 선택한 책만 읽음으로 바꿔 주세요.',hint:'추가는 trim으로 확인해요. 상태 변경은 dataset.bookId와 find로 연결해요.',tests:secondTests,reference:second,quiz:quiz('화면 순서가 바뀌어도 같은 책을 찾는 기준은?',['화면의 첫 번째 위치','책의 고유 번호','제목의 길이'],1,'고유 번호를 유지하면 검색이나 필터가 달라져도 같은 책을 찾을 수 있어요.')},
 {id:'save',title:'닫았다 열어도 목록 유지하기',goal:'시작할 때 readBooks()의 목록을 복원해 주세요. 책을 추가하거나 읽음 상태를 바꾼 뒤 writeBooks(books)로 저장해 주세요. 끝나면 내 앱 파일을 받을 수 있어요.',hint:'저장된 값이 있으면 시작 목록을 바꿔요. 변경 두 곳 모두에서 저장해야 해요. 새 id는 저장 목록의 최대 id 다음 번호로 만들어요.',tests:thirdTests,reference:third,quiz:quiz('화면만 다시 그려도 새로고침 뒤 목록이 유지되나요?',['네. 그리면 자동 저장돼요.','아니요. 상태 변경을 저장하고 다음 시작 때 복원해야 해요.','검색하면 저장돼요.'],1,'화면 갱신과 저장은 다른 동작이에요. 추가와 읽음 변경을 저장하고 시작할 때 읽어 와야 해요.')}
 ]});
 return result;
});
