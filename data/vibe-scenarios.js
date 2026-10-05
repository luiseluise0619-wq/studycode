/* Small apps with intentionally imperfect drafts. Checks exercise real controls. */
(function(root,factory){const scenarios=factory();if(typeof module==='object'&&module.exports)module.exports=scenarios;else root.VIBE_SCENARIOS=scenarios;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const check=(d,js)=>({d,js});
 const input=(selector,value)=>`Q(${JSON.stringify(selector)}).value=${JSON.stringify(value)};Q(${JSON.stringify(selector)}).dispatchEvent(new Event('input',{bubbles:true}));`;
 const submit=(email,password)=>`Q('#email').value=${JSON.stringify(email)};Q('#password').value=${JSON.stringify(password)};CLICK('#submit');`;
 const clickTask=label=>`var box=QA('.task').find(e=>e.textContent.includes(${JSON.stringify(label)})).querySelector('input');box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));`;
 const note=value=>`Q('#note').value=${JSON.stringify(value)};CLICK('#save-note');`;
 const scenarios=[];

 const cart=String.raw`const price = 10000;
const qty = document.querySelector('#qty');
const subtotalView = document.querySelector('#subtotal');
const shippingView = document.querySelector('#shipping');
const totalView = document.querySelector('#total');

function renderPrice() {
  const quantity = Math.max(0, Number(qty.value) || 0);
  const subtotal = price;
  const shipping = 3000;
  subtotalView.textContent = subtotal.toLocaleString() + '원';
  shippingView.textContent = shipping.toLocaleString() + '원';
  totalView.textContent = (subtotal + shipping).toLocaleString() + '원';
}

qty.addEventListener('input', renderPrice);
renderPrice();`;
 const cart1=cart.replace('const subtotal = price;','const subtotal = price * quantity;');
 const cart2=cart1.replace('const shipping = 3000;','const shipping = subtotal === 0 || subtotal >= 30000 ? 0 : 3000;');
 scenarios.push({id:'cart',title:'수량을 바꿨는데 합계가 그대로예요',app:'장바구니',summary:'입력한 값이 계산과 화면까지 이어지는지 확인해요.',level:1,minutes:10,html:'<div class="demo-kicker">문구 가게</div><h1>나의 장바구니</h1><div class="product-card"><span class="product-icon">▤</span><div><b>생각 노트</b><small>한 권 10,000원</small></div></div><label class="field">수량<input id="qty" type="number" min="0" value="2"></label><dl class="receipt"><div><dt>상품 금액</dt><dd id="subtotal"></dd></div><div><dt>배송비</dt><dd id="shipping"></dd></div><div class="receipt-total"><dt>결제 금액</dt><dd id="total"></dd></div></dl>',source:cart,concepts:[['이벤트','입력값이 바뀌었을 때 실행할 함수를 연결해요. 여기서는 input 이벤트를 사용해요.'],['Number','입력칸의 value는 문자열이에요. 계산할 값으로 바꾸려고 Number를 써요.'],['화면 갱신','계산만 바꾸는 것으로 끝나지 않아요. 계산 결과를 textContent에 넣어 화면도 바꿔요.']],foundation:{track:'javascript',lesson:'변수 let 과 const'},missions:[
  {id:'quantity',title:'수량에 맞춰 상품 금액 고치기',goal:'한 권은 10,000원이에요. 수량이 2면 상품 금액은 20,000원, 0이면 0원이 되게 고쳐 주세요.',hint:'입력 이벤트는 이미 연결되어 있어요. renderPrice 안에서 quantity를 계산에 사용하고 있는지 보세요.',quiz:{q:'수량이 바뀔 때 상품 금액도 바뀌려면 이 줄에서 무엇을 해야 할까요?',options:["한 권 가격에 수량을 곱해요","배송비만 바꿔요","가격을 글자로 바꿔요"],answer:0,why:'price는 한 권 가격, quantity는 수량이에요. 두 값을 곱한 결과를 subtotal에 넣으면 수량에 맞는 상품 금액을 얻어요.'},tests:[check('수량 2 → 상품 금액 20,000원',`(()=>{${input('#qty','2')}return TXT('#subtotal')==='20,000원';})()`),check('수량 3 → 상품 금액 30,000원',`(()=>{${input('#qty','3')}return TXT('#subtotal')==='30,000원';})()`),check('수량 0 → 상품 금액 0원',`(()=>{${input('#qty','0')}return TXT('#subtotal')==='0원';})()`),check('음수 수량은 0으로 처리',`(()=>{${input('#qty','-2')}return TXT('#subtotal')==='0원';})()`)],reference:cart1},
  {id:'delivery',title:'3만원부터 무료 배송 추가하기',goal:'상품 금액이 30,000원 이상이면 배송비를 0원으로 바꿔 주세요. 그 미만은 3,000원이고, 수량 0도 배송비 0원이에요.',hint:'배송비를 정하는 조건이 필요해요. 30,000원을 포함하려면 >와 >= 중 무엇이 맞을까요?',quiz:{q:'30,000원인 주문도 무료 배송에 포함하려면?',options:['subtotal > 30000','subtotal >= 30000','subtotal < 30000'],answer:1,why:"이상은 기준값을 포함해요. >=를 쓰면 30,000원도 조건에 들어가요."},tests:[check('2권 → 배송비 3,000원, 결제 23,000원',`(()=>{${input('#qty','2')}return TXT('#shipping')==='3,000원'&&TXT('#total')==='23,000원';})()`),check('3권 → 배송비 0원, 결제 30,000원',`(()=>{${input('#qty','3')}return TXT('#shipping')==='0원'&&TXT('#total')==='30,000원';})()`),check('4권 → 배송비 0원, 결제 40,000원',`(()=>{${input('#qty','4')}return TXT('#total')==='40,000원';})()`),check('빈 장바구니 → 배송비와 결제 모두 0원',`(()=>{${input('#qty','0')}return TXT('#shipping')==='0원'&&TXT('#total')==='0원';})()`)],reference:cart2}
 ]});

 const search=String.raw`const products = ['Notebook', '키보드', '무선 마우스'];
const query = document.querySelector('#query');
const list = document.querySelector('#products');
const empty = document.querySelector('#empty');

function renderProducts() {
  const word = query.value;
  const matches = products.filter(name => name.includes(word));
  list.replaceChildren();
  matches.forEach(name => {
    const item = document.createElement('li');
    item.className = 'product';
    item.textContent = name;
    list.appendChild(item);
  });
  empty.hidden = true;
}

query.addEventListener('input', renderProducts);
renderProducts();`;
 const search1=search.replace('const word = query.value;','const word = query.value.trim().toLowerCase();').replace('name.includes(word)','name.toLowerCase().includes(word)');
 const search2=search1.replace('empty.hidden = true;','empty.hidden = matches.length > 0;');
 scenarios.push({id:'search',title:'검색어를 조금만 다르게 쓰면 못 찾아요',app:'상품 검색',summary:'입력을 정리하고, 결과가 없는 상황까지 안내해요.',level:1,minutes:10,html:'<div class="demo-kicker">책상 위의 물건</div><h1>필요한 물건 찾기</h1><label class="field">상품 이름<input id="query" placeholder="notebook 또는 마우스"></label><ul id="products" class="product-list"></ul><p id="empty" class="empty" hidden>맞는 상품이 없어요. 다른 이름으로 찾아보세요.</p>',source:search,concepts:[['trim','문자열 앞뒤의 불필요한 공백을 없애요. 문자열 사이의 공백은 유지해요.'],['toLowerCase','영문을 소문자로 통일해요. 검색어와 상품 이름을 같은 기준으로 비교해요.'],['filter','조건에 맞는 항목만 남긴 새 배열을 만들어요.']],foundation:{track:'javascript',lesson:'문자열'},missions:[
  {id:'normalize',title:'공백과 대소문자가 달라도 찾기',goal:'notebook, NOTEBOOK, 앞뒤에 공백을 넣은 검색어가 모두 Notebook을 찾게 해 주세요. 빈 검색어는 상품 3개를 보여 줘야 해요.',hint:'검색어와 상품 이름 양쪽을 같은 대소문자로 바꿔 비교해 보세요. 앞뒤 공백도 정리해야 해요.',quiz:{q:'검색어만 소문자로 바꾸면 대소문자 문제가 모두 해결될까요?',options:['네. 상품 이름은 그대로 둬도 돼요.','아니요. 상품 이름도 같은 기준으로 비교해야 해요.','공백을 더 붙이면 해결돼요.'],answer:1,why:'Notebook과 notebook을 그대로 비교하면 달라요. 검색어와 상품 이름을 모두 같은 기준으로 바꿔야 해요.'},tests:[check('소문자 notebook으로 Notebook 찾기',`(()=>{${input('#query','notebook')}return COUNT('.product')===1&&TXT('#products')==='Notebook';})()`),check('앞뒤 공백과 대문자도 같은 상품 찾기',`(()=>{${input('#query',' NOTEBOOK ')}return COUNT('.product')===1&&TXT('#products')==='Notebook';})()`),check('한글 검색어로 해당 상품만 찾기',`(()=>{${input('#query','마우스')}return COUNT('.product')===1&&TXT('#products')==='무선 마우스';})()`),check('빈 검색어는 전체 상품 3개',`(()=>{${input('#query','   ')}return COUNT('.product')===3;})()`)],reference:search1},
  {id:'empty',title:'검색 결과가 없을 때 안내하기',goal:'없는 이름으로 검색하면 안내 문구가 보이게 해 주세요. 상품이 있거나 검색어를 지우면 안내를 다시 숨겨 주세요.',hint:"hidden이 true면 숨겨져요. matches.length가 0일 때 안내가 보여야 해요.",quiz:{q:'empty.hidden = matches.length > 0의 뜻은?',options:["결과가 있을 때 안내를 숨겨요","결과가 없을 때 안내를 숨겨요","안내를 항상 숨겨요"],answer:0,why:"결과 개수가 0보다 크면 hidden이 true예요. 결과가 0개일 때는 false가 되어 안내가 보여요."},tests:[check('없는 상품은 목록 0개와 안내 표시',`(()=>{${input('#query','없는상품')}return COUNT('.product')===0&&!Q('#empty').hidden&&TXT('#empty').includes('없어요');})()`),check('상품을 찾으면 안내 숨기기',`(()=>{${input('#query','키보드')}return COUNT('.product')===1&&Q('#empty').hidden;})()`),check('검색어를 지우면 전체 목록과 안내 숨기기',`(()=>{${input('#query','')}return COUNT('.product')===3&&Q('#empty').hidden;})()`)],reference:search2}
 ]});

 const todo=String.raw`const tasks = [
  { id: 1, label: '장보기', done: true },
  { id: 2, label: '물 마시기', done: false },
  { id: 3, label: '코드 읽기', done: false }
];
let filter = 'all';
const list = document.querySelector('#tasks');
const remaining = document.querySelector('#remaining');

function renderTasks() {
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.done : !task.done));
  list.innerHTML = visible.map((task, index) => '<label class="task"><input type="checkbox" data-index="' + index + '" ' + (task.done ? 'checked' : '') + '> ' + task.label + '</label>').join('');
  remaining.textContent = tasks.length;
}

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
    renderTasks();
  });
});
list.addEventListener('change', event => {
  const index = Number(event.target.dataset.index);
  tasks[index].done = event.target.checked;
  renderTasks();
});
renderTasks();`;
 const todo1=todo.replace('data-index="\' + index','data-id="\' + task.id').replace('const index = Number(event.target.dataset.index);\n  tasks[index].done = event.target.checked;','const id = Number(event.target.dataset.id);\n  tasks.find(task => task.id === id).done = event.target.checked;');
 const todo2=todo1.replace('remaining.textContent = tasks.length;','remaining.textContent = tasks.filter(task => !task.done).length;');
 scenarios.push({id:'todo',title:'체크했는데 다른 할 일이 바뀌어요',app:'할 일 목록',summary:'목록의 순서와 항목의 고유 번호를 구분해요.',level:2,minutes:15,html:'<div class="demo-kicker">오늘의 작은 일</div><h1>할 일 노트</h1><div class="filters"><button data-filter="all" class="active">모두</button><button data-filter="todo">미완료</button><button data-filter="done">완료</button></div><div id="tasks" class="tasks"></div><p class="muted">남은 할 일 <b id="remaining"></b>개</p>',source:todo,concepts:[['배열의 위치','filter를 거친 목록의 0번째 항목은 원래 배열의 0번째 항목과 다를 수 있어요.'],['고유 번호 · id','항목의 순서가 달라져도 같은 항목을 찾을 수 있게 붙인 번호예요.'],['find','조건에 맞는 항목 하나를 찾아요. 고유 번호로 원래 항목을 찾을 때 쓸 수 있어요.']],foundation:{track:'javascript',lesson:'배열'},missions:[
  {id:'identity',title:'필터 뒤에도 내가 체크한 항목만 바꾸기',goal:'미완료 목록에서 물 마시기를 체크하면 물 마시기만 완료되어야 해요. 코드 읽기의 상태는 그대로 두세요.',hint:'지금 화면에 보이는 위치로 원래 배열을 고르면 다른 항목을 바꿀 수 있어요. 각 항목에 이미 있는 id를 사용해 보세요.',quiz:{q:'필터된 목록의 index로 원래 배열을 바로 수정하면 생길 수 있는 일은?',options:["같은 항목을 언제나 정확하게 찾아요","다른 항목을 수정할 수 있어요","필터가 자동으로 해제돼요"],answer:1,why:"필터로 일부 항목을 빼면 위치가 달라져요. 같은 항목을 찾으려면 고유 번호를 기준으로 연결해야 해요."},tests:[check('미완료 목록의 물 마시기를 정확히 완료',`(()=>{CLICK('[data-filter="todo"]');${clickTask('물 마시기')}return COUNT('.task')===1&&TXT('#tasks').includes('코드 읽기');})()`),check('다른 미완료 항목의 상태는 유지',`(()=>{CLICK('[data-filter="all"]');var item=QA('.task').find(e=>e.textContent.includes('코드 읽기'));return !item.querySelector('input').checked;})()`),check('완료 목록에는 장보기와 물 마시기',`(()=>{CLICK('[data-filter="done"]');return COUNT('.task')===2&&TXT('#tasks').includes('장보기')&&TXT('#tasks').includes('물 마시기');})()`)],reference:todo1},
  {id:'count',title:'실제로 남은 할 일 개수 표시하기',goal:'처음에는 남은 할 일이 2개예요. 하나를 더 완료하면 1개, 모두 완료하면 0개로 바뀌게 해 주세요.',hint:'tasks.length는 완료한 항목도 포함해요. done이 false인 항목만 남긴 뒤 개수를 세어 보세요.',quiz:{q:'tasks.filter(task => !task.done).length는 무엇을 세나요?',options:['완료한 항목의 개수','전체 항목의 개수','미완료 항목의 개수'],answer:2,why:"!task.done은 완료되지 않았다는 뜻이에요. 그 항목만 남긴 배열의 길이를 세면 남은 할 일 개수예요."},tests:[check('처음 남은 할 일은 2개',"TXT('#remaining')==='2'"),check('한 항목을 완료하면 1개',`(()=>{CLICK('[data-filter="all"]');${clickTask('물 마시기')}return TXT('#remaining')==='1';})()`),check('모두 완료하면 0개',`(()=>{${clickTask('코드 읽기')}return TXT('#remaining')==='0';})()`),check('완료 필터의 항목도 모두 유지',"(CLICK('[data-filter=\"done\"]'),COUNT('.task')===3)")],reference:todo2}
 ]});

 const login=String.raw`const form = document.querySelector('#login');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const error = document.querySelector('#error');
const success = document.querySelector('#success');

form.addEventListener('submit', event => {
  event.preventDefault();
  error.textContent = '';
  success.hidden = true;
  const email = emailInput.value;
  const password = passwordInput.value;
  if (email === '' && password === '') {
    error.textContent = '이메일과 비밀번호를 모두 입력해 주세요.';
    return;
  }
  success.hidden = false;
});`;
 const login1=login.replace("email === '' && password === ''","!email.trim() || !password.trim()");
 const login2=login1.replace('  success.hidden = false;',String.raw`  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    error.textContent = '이메일 형식을 확인해 주세요.';
    return;
  }
  if (password.length < 8) {
    error.textContent = '비밀번호는 8자 이상 입력해 주세요.';
    return;
  }
  success.hidden = false;`);
 scenarios.push({id:'form',title:'로그인 폼이 빈 입력을 넘겨요',app:'입력 검사',summary:'화면에서 입력값을 확인하고, 실패 이유를 알려 줘요.',level:2,minutes:15,html:'<div class="demo-kicker">입력 형식 연습</div><h1>로그인 폼</h1><form id="login" novalidate><label class="field">이메일<input id="email" type="email" placeholder="hello@example.com" autocomplete="off"></label><label class="field">비밀번호<input id="password" type="password" placeholder="8자 이상" autocomplete="off"></label><button id="submit" class="primary">입력 확인하기</button></form><p id="error" class="error" role="status"></p><p id="success" class="success" hidden>입력 형식을 확인했어요.</p><p class="demo-note">이 실습은 화면의 입력 검사예요. 실제 로그인에서는 서버가 인증과 권한을 확인해야 합니다.</p>',source:login,concepts:[['&&와 ||','&&는 조건 둘이 모두 참이어야 하고, ||는 하나만 참이어도 돼요.'],['일찍 끝내기','입력이 잘못되면 오류를 안내하고 return으로 다음 처리를 막아요.'],['화면 검사와 인증',"화면은 입력 형식을 확인해요. 실제 사용자 확인과 접근 권한은 서버의 역할이에요."]],foundation:{track:'javascript',lesson:'비교와 조건문'},missions:[
  {id:'required',title:'입력 하나라도 비어 있으면 안내하기',goal:'이메일이나 비밀번호 중 하나라도 비어 있거나 공백뿐이면 다음 처리를 막고 안내해 주세요.',hint:'현재 조건은 두 값이 모두 빈 경우만 잡아요. 둘 중 하나라도 비었을 때를 표현해 보세요.',quiz:{q:'이메일 또는 비밀번호 하나라도 비었는지 확인할 연결 기호는?',options:['&&','||','+'],answer:1,why:'||는 둘 중 하나만 참이어도 참이에요. 필수 입력 하나라도 없으면 안내하려면 이 조건이 필요해요.'},tests:[check('이메일만 비어 있어도 안내',`(()=>{${submit('','abcdefgh')}return Q('#success').hidden&&TXT('#error').length>0;})()`),check('비밀번호만 비어 있어도 안내',`(()=>{${submit('hello@example.com','')}return Q('#success').hidden&&TXT('#error').length>0;})()`),check('공백뿐인 입력도 막기',`(()=>{${submit('   ','abcdefgh')}return Q('#success').hidden;})()`),check('필수 입력이 있으면 다음 처리',`(()=>{${submit('hello@example.com','abcdefgh')}return !Q('#success').hidden&&TXT('#error')==='';})()`)],reference:login1},
  {id:'format',title:'형식과 길이까지 확인하기',goal:'이메일은 이름@주소.형식으로 입력하게 해 주세요. 비밀번호는 8자 이상이어야 해요. 실패 이유도 구분해 안내해 주세요.',hint:'필수 입력 검사 다음에 이메일 형식과 password.length를 확인해 보세요. 실패하면 성공 안내까지 내려가지 않아야 해요.',quiz:{q:'화면의 이메일·비밀번호 형식 검사가 통과하면 실제 로그인이 확인된 건가요?',options:['네. 형식만 맞으면 사용자 확인도 끝나요.','아니요. 서버에서 사용자 확인이 필요해요.','비밀번호가 길면 서버 검사는 필요 없어요.'],answer:1,why:"형식 검사와 사용자 인증은 다른 일이에요. 실제 인증과 권한은 서버에서 검증해야 해요."},tests:[check('잘못된 이메일 형식은 이유와 함께 안내',`(()=>{${submit('hello','abcdefgh')}return Q('#success').hidden&&TXT('#error').includes('이메일');})()`),check('7자 비밀번호는 길이 안내',`(()=>{${submit('hello@example.com','abcdefg')}return Q('#success').hidden&&TXT('#error').includes('8');})()`),check('8자부터 입력 형식 검사 통과',`(()=>{${submit('hello@example.com','abcdefgh')}return !Q('#success').hidden&&TXT('#error')==='';})()`),check('이메일 앞뒤 공백은 정리해서 검사',`(()=>{${submit(' hello@example.com ','abcdefgh')}return !Q('#success').hidden;})()`)],reference:login2}
 ]});

 const api=String.raw`const category = document.querySelector('#category');
const button = document.querySelector('#load');
const loading = document.querySelector('#loading');
const error = document.querySelector('#error');
const results = document.querySelector('#results');

function mockProducts(kind) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (kind === 'fail') reject(new Error('연결 실패'));
      else resolve(kind === 'slow' ? ['이전 책 목록'] : ['키보드', '마우스']);
    }, kind === 'slow' ? 500 : 150);
  });
}

async function loadProducts() {
  const requested = category.value;
  button.disabled = true;
  loading.hidden = false;
  error.textContent = '';
  results.textContent = '';
  try {
    const data = await mockProducts(requested);
    results.textContent = data.join(' · ');
  } catch (problem) {
    error.textContent = '목록을 받지 못했어요. 다시 시도해 주세요.';
  }
}

button.addEventListener('click', loadProducts);
category.addEventListener('change', loadProducts);`;
 const api1=api.replace("    error.textContent = '목록을 받지 못했어요. 다시 시도해 주세요.';\n  }","    error.textContent = '목록을 받지 못했어요. 다시 시도해 주세요.';\n  } finally {\n    button.disabled = false;\n    loading.hidden = true;\n  }");
 const api2=api1.replace('async function loadProducts() {','let requestId = 0;\nasync function loadProducts() {\n  const currentId = ++requestId;').replace("    results.textContent = data.join(' · ');","    if (currentId === requestId) results.textContent = data.join(' · ');").replace("    error.textContent = '목록을 받지 못했어요. 다시 시도해 주세요.';","    if (currentId === requestId) error.textContent = '목록을 받지 못했어요. 다시 시도해 주세요.';").replace('    button.disabled = false;\n    loading.hidden = true;','    if (currentId === requestId) {\n      button.disabled = false;\n      loading.hidden = true;\n    }');
 scenarios.push({id:'request',title:'요청이 끝나도 계속 기다리는 화면이에요',app:'데이터 요청',summary:'기다리는 중·성공·실패와 응답 순서를 다뤄요.',level:3,minutes:20,html:'<div class="demo-kicker">응답 기다리기</div><h1>상품 목록 불러오기</h1><label class="field">응답 상황<select id="category"><option value="fast">새 상품 · 빠른 응답</option><option value="slow">이전 책 · 느린 응답</option><option value="fail">연결 실패</option></select></label><button id="load" class="primary">목록 불러오기</button><p id="loading" class="muted" hidden>목록을 기다리고 있어요…</p><p id="error" class="error" role="status"></p><div id="results" class="result-card"></div><p class="demo-note">준비된 응답으로 연습해요. 실제 서버 연결 없이 느린 응답과 실패를 재현할 수 있어요.</p>',source:api,concepts:[['await','나중에 끝날 작업의 결과를 기다렸다가 다음 줄로 이어 가요.'],['finally','성공했든 실패했든 마지막에 해야 할 정리 작업을 넣어요.'],['응답 순서','먼저 보낸 요청이 나중에 끝날 수도 있어요. 현재 요청의 결과인지 확인해야 해요.']],foundation:{track:'javascript',lesson:'비동기'},missions:[
  {id:'finish',title:'성공·실패 뒤 로딩 표시 정리하기',goal:'요청 중에는 버튼을 잠그고 로딩을 보여 주세요. 성공하거나 실패하면 로딩을 숨기고 버튼을 다시 쓸 수 있게 해 주세요.',hint:'try와 catch 뒤에 성공·실패와 관계없이 실행할 정리 코드를 넣어 보세요.',quiz:{q:'성공과 실패 모두에서 버튼과 로딩을 정리할 위치는?',options:['성공하는 try 안에만','실패하는 catch 안에만','finally 안에'],answer:2,why:"finally는 성공했든 예외가 났든 마지막에 실행해요. 로딩과 버튼 상태를 되돌리는 작업에 맞아요."},tests:[check('요청 중에는 버튼 잠금과 로딩 표시',"(()=>{CLICK('#load');return Q('#load').disabled&&!Q('#loading').hidden;})()"),check('성공하면 목록 표시·로딩 종료·버튼 복구',"new Promise(r=>setTimeout(()=>r(TXT('#results').includes('키보드')&&Q('#loading').hidden&&!Q('#load').disabled),250))"),check('실패도 이유를 표시하고 다시 시도 가능',"new Promise(r=>{Q('#category').value='fail';CLICK('#load');setTimeout(()=>r(TXT('#error').length>0&&Q('#loading').hidden&&!Q('#load').disabled),250);})"),check('실패 뒤 정상 요청도 다시 성공',"new Promise(r=>{Q('#category').value='fast';CLICK('#load');setTimeout(()=>r(TXT('#results').includes('마우스')&&TXT('#error')===''),250);})")],reference:api1},
  {id:'latest',title:'이전 응답이 최신 화면을 덮지 않게 하기',goal:'느린 요청 뒤 새 요청을 보내면 마지막으로 선택한 상품을 보여 주세요. 이전 요청의 결과나 오류가 새 화면을 바꾸지 않아야 해요.',hint:'요청마다 번호를 하나 올리고, 응답이 왔을 때 그 번호가 현재 번호와 같은지 확인해 보세요.',quiz:{q:'마지막으로 선택한 결과를 표시하려면 어떤 응답을 반영해야 할까요?',options:['가장 늦게 도착한 모든 응답','현재 요청 번호와 같은 응답','가장 먼저 보낸 요청의 응답'],answer:1,why:'응답 도착 순서는 요청 순서와 다를 수 있어요. 현재 요청과 같은 번호의 응답만 반영하면 이전 결과가 새 화면을 덮지 못해요.'},tests:[check('느린 이전 응답은 최신 상품을 덮지 않음',"new Promise(r=>{Q('#category').value='slow';Q('#category').dispatchEvent(new Event('change'));setTimeout(()=>{Q('#category').value='fast';Q('#category').dispatchEvent(new Event('change'));},30);setTimeout(()=>r(TXT('#results')==='키보드 · 마우스'),650);})"),check('이전 오류는 최신 성공 화면을 바꾸지 않음',"new Promise(r=>{Q('#category').value='fail';Q('#category').dispatchEvent(new Event('change'));setTimeout(()=>{Q('#category').value='fast';Q('#category').dispatchEvent(new Event('change'));},30);setTimeout(()=>r(TXT('#results')==='키보드 · 마우스'&&TXT('#error')===''),350);})"),check('이전 응답이 와도 최신 요청의 로딩은 유지',"new Promise(r=>{Q('#category').value='fast';Q('#category').dispatchEvent(new Event('change'));setTimeout(()=>{Q('#category').value='slow';Q('#category').dispatchEvent(new Event('change'));},30);setTimeout(()=>r(!Q('#loading').hidden&&Q('#load').disabled),250);})"),check('최신 느린 요청도 끝나면 정리',"new Promise(r=>setTimeout(()=>r(TXT('#results')==='이전 책 목록'&&Q('#loading').hidden&&!Q('#load').disabled),350))")],reference:api2}
 ]});

 const memo=String.raw`const notes = [];
const input = document.querySelector('#note');
const view = document.querySelector('#note-view');
const history = document.querySelector('#history');
const count = document.querySelector('#count');

document.querySelector('#save-note').addEventListener('click', () => {
  const value = input.value;
  view.innerHTML = value;
  notes.push(value);
  count.textContent = notes.length;
  history.replaceChildren();
  input.value = '';
});`;
 const memo1=memo.replace('view.innerHTML = value;','view.textContent = value;');
 const memo2=memo1.replace('const value = input.value;','const value = input.value.trim();\n  if (!value) return;').replace('notes.push(value);','notes.unshift(value);\n  notes.splice(3);').replace('  history.replaceChildren();','  history.replaceChildren();\n  notes.forEach(note => {\n    const item = document.createElement("li");\n    item.textContent = note;\n    history.appendChild(item);\n  });');
 scenarios.push({id:'memo',title:'메모의 태그가 화면 요소로 바뀌어요',app:'메모',summary:'사용자가 쓴 글과 HTML을 구분하고 목록을 만들어요.',level:2,minutes:15,html:'<div class="demo-kicker">잊기 전에 한 줄</div><h1>작은 메모장</h1><label class="field">메모<textarea id="note" rows="3" placeholder="오늘 기억할 내용"></textarea></label><button id="save-note" class="primary">메모 남기기</button><div id="note-view" class="result-card"></div><h2>최근 메모 <span id="count">0</span>개</h2><ul id="history" class="product-list"></ul><p class="demo-note">이 화면을 실행하는 동안의 메모 목록을 연습해요.</p>',source:memo,concepts:[['innerHTML','문자열을 HTML로 해석해서 화면에 넣어요. 사용자가 쓴 글을 그대로 보여 줄 때와 구분해야 해요.'],['textContent','내용을 글자로 넣어요. 태그처럼 생긴 글도 화면 요소로 만들지 않아요.'],['unshift와 splice','unshift는 앞에 추가해요. splice로 3번째 위치부터 잘라 최근 3개만 남길 수 있어요.']],foundation:{track:'web',lesson:'HTML'},missions:[
  {id:'text',title:'메모를 HTML이 아닌 글자로 보여 주기',goal:'<b>중요</b>를 입력해도 굵은 글자로 해석하지 말고 입력한 글 그대로 보여 주세요.',hint:'사용자가 입력한 문장을 화면에 넣는 줄을 보세요. 글자를 넣는 속성과 HTML을 해석하는 속성은 달라요.',quiz:{q:'사용자가 입력한 글을 그대로 보여 줄 때 알맞은 속성은?',options:['textContent','innerHTML','className'],answer:0,why:'textContent는 내용을 글자로 넣어요. innerHTML은 태그를 HTML 요소로 해석하므로 입력한 글이 바뀔 수 있어요.'},tests:[check('일반 메모는 입력한 글 그대로',`(()=>{${note('오늘 한 줄 공부')}return TXT('#note-view')==='오늘 한 줄 공부';})()`),check('태그 형태도 글자로 표시',`(()=>{${note('<b>중요</b>')}return Q('#note-view').textContent==='<b>중요</b>'&&COUNT('#note-view b')===0;})()`),check('앰퍼샌드와 꺾쇠도 보존',`(()=>{${note('A & B < C')}return Q('#note-view').textContent==='A & B < C';})()`)],reference:memo1},
  {id:'history',title:'최근 메모 세 개를 최신순으로 보여 주기',goal:'빈 메모는 추가하지 말고, 최근 메모 3개만 최신순으로 보여 주세요. 목록에서도 입력한 글을 그대로 표시해야 해요.',hint:"새 메모를 배열 앞에 넣고 3개만 남겨 보세요. 화면에 목록을 만들 때도 글자로 넣어야 해요.",quiz:{q:'새 메모를 맨 앞에 두고 최근 3개만 남기려면?',options:["push하고 모든 항목을 유지해요","unshift하고 3번째 위치부터 잘라요","메모 내용을 HTML로 합쳐요"],answer:1,why:'unshift로 최신 메모를 앞에 넣고 splice(3)으로 4번째 항목부터 지우면 최근 3개를 유지할 수 있어요.'},tests:[check('네 번 추가해도 최신 세 개만 표시',`(()=>{${note('첫째')}${note('둘째')}${note('셋째')}${note('넷째')}return COUNT('#history li')===3&&QA('#history li').map(e=>e.textContent).join(',')==='넷째,셋째,둘째'&&TXT('#count')==='3';})()`),check('공백뿐인 메모는 추가하지 않기',`(()=>{${note('   ')}return QA('#history li')[0].textContent==='넷째'&&TXT('#count')==='3';})()`),check('목록에서도 태그는 글자로 보존',`(()=>{${note('<b>그대로</b>')}return QA('#history li')[0].textContent==='<b>그대로</b>'&&COUNT('#history b')===0;})()`)],reference:memo2}
 ]});
 return scenarios;
});
