/* Five complete browser apps. References preserve every earlier change. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.VIBE_SCENARIOS.push(...factory());
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const projects=[];
  const test=(d,js)=>({d,js});
  const input=(id,value)=>`Q('#${id}').value=${JSON.stringify(value)};`;
  const click=id=>`CLICK('#${id}');`;
  const quiz=(q,options,answer,why)=>({q,options,answer,why});
  const todayHelper="function appToday(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}";
  function make(config,steps){
    let reference=config.source,checks=[];
    config.kind='project';config.level=2;config.minutes=20;
    if(config.storage.fixture[0]&&typeof config.storage.fixture[0]==='object'){
      config.storage.validate='('+config.storage.validate+')&&data.every(item=>item.id>0)&&new Set(data.map(item=>item.id)).size===data.length';
    }
    config.missions=steps.map((step,index)=>{
      for(const [marker,code] of Object.entries(step.code)){
        if(!reference.includes(marker))throw new Error(config.id+': missing '+marker);
        reference=reference.replace(marker,code);
      }
      checks=step.prepend?[...step.tests,...checks]:[...checks,...step.tests];
      return {id:step.id,title:step.title,goal:step.goal,hint:step.hint,quiz:step.quiz,
        tests:checks.slice(),reference,independent:index===steps.length-1};
    });
    projects.push(config);
  }

  const expenseSource=String.raw`// entries는 실제 지출 목록이에요. 화면을 숨겨도 이 목록은 유지해요.
let entries = [];
let nextId = 1;
const expenseList = document.querySelector('#expense-list');
const expenseError = document.querySelector('#expense-error');
function restoreExpenses() {
  // EXPENSE_RESTORE
}
function saveExpenses() {
  // EXPENSE_SAVE
}
function addExpense() {
  // EXPENSE_ADD
}
function removeExpense(id) {
  // EXPENSE_REMOVE
}
function renderExpenses() {
  const category = document.querySelector('#expense-filter').value;
  // EXPENSE_VISIBLE
  const visible = entries;
  expenseList.replaceChildren();
  visible.forEach(entry => {
    const row = document.createElement('li');
    row.append(document.createTextNode(entry.name + ' · ' + entry.amount + '원 · ' + entry.category + ' '));
    const button = document.createElement('button');
    button.dataset.expenseId = entry.id;
    button.textContent = '삭제';
    button.addEventListener('click', () => removeExpense(entry.id));
    row.append(button);
    expenseList.append(row);
  });
  document.querySelector('#expense-empty').hidden = visible.length > 0;
  document.querySelector('#expense-total').textContent = '0';
  // EXPENSE_SUMMARY
  // EXPENSE_BUDGET
}
document.querySelector('#expense-form').addEventListener('submit', event => {event.preventDefault();addExpense();});
document.querySelector('#expense-filter').addEventListener('change', renderExpenses);
document.querySelector('#expense-budget').addEventListener('input', renderExpenses);
restoreExpenses();
renderExpenses();`;
  const expenseReset="entries=[];nextId=1;Q('#expense-filter').value='all';Q('#expense-budget').value='10000';renderExpenses();";
  const expenseAdd=(name,amount,category='food')=>input('expense-name',name)+input('expense-amount',amount)+input('expense-category',category)+click('expense-add');
  make({id:'expense-app',app:'내 가계부',title:'쓴 돈을 기록하는 가계부',summary:'금액 검사, 분류별 합계, 삭제와 저장을 연결해요. 마지막에는 예산 알림을 직접 더해요.',
    html:'<div class="demo-kicker">작은 완성 프로젝트 · 01</div><h1>내 가계부</h1><form id="expense-form" novalidate><label class="field">어디에 썼나요?<input id="expense-name" maxlength="60"></label><label class="field">금액 · 원<input id="expense-amount" type="number"></label><label class="field">분류<select id="expense-category"><option value="food">식비</option><option value="travel">교통</option><option value="other">기타</option></select></label><button id="expense-add" class="primary">지출 기록하기</button></form><p id="expense-error" class="error" role="status"></p><label class="field">보기<select id="expense-filter"><option value="all">전체</option><option value="food">식비</option><option value="travel">교통</option><option value="other">기타</option></select></label><ul id="expense-list" class="product-list"></ul><p id="expense-empty" class="empty">지출을 기록해 보세요.</p><p>지금 보이는 지출 합계 <b id="expense-total">0</b>원</p><label class="field">전체 지출 예산 · 원<input id="expense-budget" type="number" value="10000"></label><p id="expense-budget-status" role="status">예산 알림을 아직 연결하지 않았어요.</p>',
    source:expenseSource,filename:'my-expenses.html',foundation:{track:'javascript',lesson:'배열'},
    reading:[['입력','이름·금액·분류를 입력하고 기록 버튼을 눌러요.'],['처리','entries에 지출을 모으고 선택한 분류의 금액을 더해요.'],['화면','목록과 합계, 예산 안내를 다시 보여 줘요.']],
    concepts:[['Number와 정수 검사','입력칸의 값은 글자예요. 숫자로 바꾼 뒤 양의 정수인지 확인해요.'],['filter와 reduce','filter로 보일 항목을 고르고 reduce로 금액을 더해요.'],['화면과 원본 목록','분류를 바꾸어 숨긴 지출도 entries에는 남아 있어요. 전체 예산은 원본 목록으로 계산해요.']],
    storage:{key:'coderun-expenses',fixture:[{id:41,name:'저장된 교통비',amount:2500,category:'travel'}],validate:"Array.isArray(data)&&data.length<=100&&data.every(e=>e&&Number.isSafeInteger(e.id)&&typeof e.name==='string'&&e.name.length<=60&&Number.isSafeInteger(e.amount)&&e.amount>0&&e.amount<=1000000000&&['food','travel','other'].includes(e.category))",error:'#expense-error'}},[
    {id:'input',title:'지출 한 건을 제대로 기록하기',goal:'이름이 있고 금액이 1원 이상인 정수일 때만 추가해 주세요. 빈 값·소수·음수·10억 원 초과는 이유를 안내해요.',hint:'trim으로 이름을 정리하고 Number.isSafeInteger로 원 단위 정수인지 확인해요.',code:{'// EXPENSE_ADD':String.raw`const name = document.querySelector('#expense-name').value.trim();
  const amount = Number(document.querySelector('#expense-amount').value);
  const category = document.querySelector('#expense-category').value;
  expenseError.textContent = '';
  if (!name || name.length > 60 || !Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000) {expenseError.textContent = '이름과 1원 이상인 정수 금액을 입력해 주세요.';return;}
  if (entries.length >= 100) {expenseError.textContent = '지출은 100건까지 기록할 수 있어요.';return;}
  entries.push({id:nextId++,name,amount,category});
  saveExpenses();renderExpenses();`},tests:[test('정상 지출은 목록에 기록',`(()=>{${expenseReset}${expenseAdd('점심','8000')}return COUNT('#expense-list li')===1&&TXT('#expense-list').includes('8000');})()`),test('빈 이름·0원·음수·소수는 추가하지 않기',`(()=>{${expenseReset}${expenseAdd(' ','100')}${expenseAdd('잘못된 금액','0')}${expenseAdd('잘못된 금액','-1')}${expenseAdd('잘못된 금액','1.5')}${expenseAdd('너무 큰 금액','1000000001')}return entries.length===0&&TXT('#expense-error').length>0;})()`),test('제목의 태그는 글자로 보존',`(()=>{${expenseReset}${expenseAdd('<b>점심</b>','3000')}return TXT('#expense-list').includes('<b>점심</b>')&&COUNT('#expense-list b')===0;})()`)],quiz:quiz("Number로 바꾼 다음에도 금액을 검사하는 이유는 무엇일까요?",['숫자이면 음수와 소수도 들어올 수 있어서','입력칸을 숨기려고','목록을 정렬하려고'],0,'숫자로 변환하는 일과 유효한 원 단위 금액인지 확인하는 일은 달라요.')},
    {id:'filter',title:'분류를 골라 합계 보기',goal:'선택한 분류만 보여 주고 그 목록의 합계를 계산해 주세요. 다른 분류의 지출은 지우지 않아요.',hint:'visible을 만들 때만 filter를 사용하고 그 visible로 합계를 구해요.',code:{'// EXPENSE_VISIBLE\n  const visible = entries;':"const visible = entries.filter(entry => category === 'all' || entry.category === category);",'// EXPENSE_SUMMARY':"document.querySelector('#expense-total').textContent = visible.reduce((sum, entry) => sum + entry.amount, 0);"},tests:[test('분류별 목록과 합계는 함께 변경',`(()=>{${expenseReset}${expenseAdd('밥','5000')}${expenseAdd('버스','1500','travel')}${input('expense-filter','travel')}Q('#expense-filter').dispatchEvent(new Event('change'));return COUNT('#expense-list li')===1&&TXT('#expense-total')==='1500'&&entries.length===2;})()`),test('비어 있는 분류는 합계 0과 안내',`(()=>{${input('expense-filter','other')}Q('#expense-filter').dispatchEvent(new Event('change'));return COUNT('#expense-list li')===0&&TXT('#expense-total')==='0'&&!Q('#expense-empty').hidden;})()`)],quiz:quiz('분류를 바꿀 때 원본 entries를 덮어쓰면 어떤 문제가 생기나요?',['숨겨진 지출을 다시 볼 수 없어요.','글자 크기가 커져요.','금액이 자동으로 바뀌어요.'],0,'보여 줄 일부만 골라야 원본 지출을 유지하고 다른 분류로 돌아갈 수 있어요.')},
    {id:'delete',title:'필터 뒤에도 고른 지출만 삭제하기',goal:'삭제 버튼의 고유 번호로 해당 지출을 지워 주세요. 삭제 후 목록과 합계도 갱신해요.',hint:'현재 화면 순서가 아니라 entry.id와 전달받은 id를 비교해요.',code:{'// EXPENSE_REMOVE':"entries = entries.filter(entry => entry.id !== id);\n  saveExpenses();renderExpenses();"},tests:[test('필터에서 삭제해도 다른 지출은 유지',`(()=>{${expenseReset}${expenseAdd('밥','5000')}${expenseAdd('버스','1500','travel')}${input('expense-filter','travel')}Q('#expense-filter').dispatchEvent(new Event('change'));CLICK('#expense-list button');return entries.length===1&&entries[0].name==='밥'&&TXT('#expense-total')==='0';})()`)],quiz:quiz('현재 보이는 첫 줄을 지출 배열의 첫 항목으로 생각해도 될까요?',['항상 같아요.','필터를 거치면 달라질 수 있어요.','금액이 크면 같아요.'],1,'화면 순서는 원본 배열의 위치와 다를 수 있어요. 고유 번호로 찾으면 같은 지출을 지워요.')},
    {id:'save',title:'앱을 다시 열어도 기록 유지하기',goal:'readData로 기록을 복원하고, 추가·삭제 때 writeData로 저장해 주세요. 복원된 고유 번호 다음부터 새 번호를 써요.',hint:'restoreExpenses에서 목록과 nextId를 준비하고 saveExpenses에서 현재 목록을 저장해요.',code:{'// EXPENSE_RESTORE':"const saved = readData();\n  if (saved) entries = saved;\n  nextId = Math.max(0,...entries.map(entry => entry.id)) + 1;",'// EXPENSE_SAVE':'writeData(entries);'},prepend:true,tests:[test('저장된 지출은 시작할 때 복원',"entries.length===1&&TXT('#expense-list').includes('저장된 교통비')"),test('추가·삭제 뒤 저장된 목록도 변경',`(()=>{${expenseReset}${expenseAdd('저장할 지출','1200')}const saved=readData();CLICK('#expense-list button');return saved[0].name==='저장할 지출'&&readData().length===0;})()`),test('복원 뒤 새 고유 번호는 중복되지 않기',`(()=>{writeData([{id:90,name:'기존',amount:1000,category:'food'}]);restoreExpenses();${expenseAdd('새 지출','2000')}return new Set(readData().map(e=>e.id)).size===2&&readData()[1].id>90;})()`)],quiz:quiz("삭제한 지출이 앱을 다시 열면 돌아오는 이유는 무엇일까요?",['삭제 후 바뀐 목록을 저장하지 않았기 때문','화면 글자가 작아서','고유 번호가 숫자여서'],0,'화면만 지우면 저장된 목록은 남아요. 실제 목록을 바꾸고 그 상태를 저장해야 해요.')},
    {id:'budget',title:'혼자 확장하기 · 전체 예산 알림',goal:'예산이 양의 정수이면 전체 지출과 비교해 남은 금액 또는 초과 금액을 알려 주세요. 분류를 바꿔도 예산 기준은 전체 지출이에요. 잘못된 예산은 안내해요.',hint:'전체 entries의 합계와 화면의 visible 합계를 따로 구해요.',code:{'// EXPENSE_BUDGET':String.raw`const budget = Number(document.querySelector('#expense-budget').value);
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  document.querySelector('#expense-budget-status').textContent = !Number.isSafeInteger(budget) || budget <= 0 ? '양의 정수 예산을 입력해 주세요.' : total > budget ? '예산 ' + (total-budget) + '원 초과' : '예산 ' + (budget-total) + '원 남음';`},tests:[test('분류를 바꿔도 전체 지출로 예산 계산',`(()=>{${expenseReset}${expenseAdd('밥','8000')}${expenseAdd('버스','3000','travel')}${input('expense-filter','travel')}Q('#expense-filter').dispatchEvent(new Event('change'));return TXT('#expense-budget-status').includes('1000원 초과')&&TXT('#expense-total')==='3000';})()`),test('남은 예산과 잘못된 예산을 구분',`(()=>{${expenseReset}${expenseAdd('밥','2000')}${input('expense-budget','5000')}Q('#expense-budget').dispatchEvent(new Event('input'));const remaining=TXT('#expense-budget-status').includes('3000원 남음');${input('expense-budget','-1')}Q('#expense-budget').dispatchEvent(new Event('input'));return remaining&&TXT('#expense-budget-status').includes('정수');})()`)],quiz:quiz("식비만 보고 있을 때 전체 예산 알림의 기준은 무엇일까요?",['식비만의 합계','지금 화면의 행 개수','모든 분류의 지출 합계'],2,'필터는 보기만 바꿔요. 전체 예산은 모든 지출을 합친 결과로 판단해야 해요.')}
  ]);

  const habitSource=String.raw`let habits = [];
let nextId = 1;
const habitList = document.querySelector('#habit-list');
const habitError = document.querySelector('#habit-error');
function restoreHabits() {
  // HABIT_RESTORE
}
function saveHabits() {
  // HABIT_SAVE
}
function addHabit() {
  // HABIT_ADD
}
function toggleHabit(id,checked) {
  // HABIT_TOGGLE
}
function renderHabits() {
  const day = appToday();
  const filter = document.querySelector('#habit-filter').value;
  // HABIT_VISIBLE
  const visible = habits;
  habitList.replaceChildren();
  visible.forEach(habit => {
    const row = document.createElement('label');row.className='task';
    const box = document.createElement('input');box.type='checkbox';
    box.checked=habit.days.includes(day);box.dataset.habitId=habit.id;
    box.addEventListener('change',()=>toggleHabit(habit.id,box.checked));
    row.append(box,document.createTextNode(' '+habit.name));habitList.append(row);
  });
  document.querySelector('#habit-empty').hidden=visible.length>0;
  document.querySelector('#habit-rate').textContent='0';
  // HABIT_RATE
  // HABIT_HISTORY
}
document.querySelector('#habit-form').addEventListener('submit',event=>{event.preventDefault();addHabit();});
document.querySelector('#habit-filter').addEventListener('change',renderHabits);
restoreHabits();renderHabits();`;
  const habitReset="habits=[];nextId=1;Q('#habit-filter').value='all';renderHabits();";
  const habitAdd=name=>input('habit-name',name)+click('habit-add');
  make({id:'habit-app',app:'내 습관 기록',title:'매일 체크하는 습관 기록',summary:'하루 체크, 남은 습관, 달성률과 날짜별 저장을 만들어요. 마지막에는 누적 기록을 표시해요.',source:habitSource,filename:'my-habits.html',helpers:todayHelper,foundation:{track:'javascript',lesson:'배열'},
    html:'<div class="demo-kicker">작은 완성 프로젝트 · 02</div><h1>내 습관 기록</h1><form id="habit-form" novalidate><label class="field">오늘부터 해볼 습관<input id="habit-name" maxlength="60"></label><button id="habit-add" class="primary">습관 추가하기</button></form><p id="habit-error" class="error" role="status"></p><label class="field">보기<select id="habit-filter"><option value="all">모두</option><option value="remaining">오늘 아직</option></select></label><div id="habit-list" class="tasks"></div><p id="habit-empty" class="empty">지금 보일 습관이 없어요.</p><p>오늘 달성률 <b id="habit-rate">0</b>%</p><p id="habit-history">누적 기록을 아직 연결하지 않았어요.</p>',
    reading:[['입력','습관 이름을 넣고 오늘 한 습관을 체크해요.'],['처리','고유 번호로 습관을 찾아 오늘 날짜를 기록하거나 지워요.'],['화면','오늘 남은 습관과 전체 달성률을 보여 줘요.']],concepts:[['날짜별 상태','완료 여부 하나 대신 완료한 날짜들을 모으면 어제 기록도 남길 수 있어요.'],['includes','배열에 오늘 날짜가 있는지 확인해요. 같은 날짜를 두 번 추가하지 않도록 검사할 수도 있어요.'],['달성률','오늘 끝낸 습관 수를 전체 습관 수로 나눠요. 전체가 0개이면 0%로 보여 줘요.']],
    storage:{key:'coderun-habits',fixture:[{id:71,name:'저장된 산책',days:[]}],validate:"Array.isArray(data)&&data.length<=100&&data.every(h=>h&&Number.isSafeInteger(h.id)&&typeof h.name==='string'&&h.name.length<=60&&Array.isArray(h.days)&&h.days.length<=3660&&h.days.every(d=>typeof d==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(d)))",error:'#habit-error'}},[
    {id:'input',title:'새 습관과 중복 이름 확인하기',goal:'빈 이름과 이미 있는 같은 이름은 추가하지 말고 안내해 주세요. 앞뒤 공백을 정리하고 새 습관에 고유 번호를 붙여요.',hint:'trim한 이름을 habits.some으로 비교해요.',code:{'// HABIT_ADD':String.raw`const name=document.querySelector('#habit-name').value.trim();
  habitError.textContent='';
  if(!name||name.length>60){habitError.textContent='습관 이름을 입력해 주세요.';return;}
  if(habits.some(habit=>habit.name===name)){habitError.textContent='이미 있는 습관이에요.';return;}
  if(habits.length>=100){habitError.textContent='습관은 100개까지 추가할 수 있어요.';return;}
  habits.push({id:nextId++,name,days:[]});saveHabits();renderHabits();`},tests:[test('같은 이름과 빈 이름은 늘어나지 않기',`(()=>{${habitReset}${habitAdd(' 산책 ')}${habitAdd('산책')}${habitAdd(' ')}return habits.length===1&&habits[0].name==='산책'&&TXT('#habit-error').length>0;})()`),test('습관 이름은 HTML이 아닌 글자',`(()=>{${habitReset}${habitAdd('<b>물 마시기</b>')}return TXT('#habit-list').includes('<b>물 마시기</b>')&&COUNT('#habit-list b')===0;})()`)],quiz:quiz("공백을 정리한 다음 중복 이름을 확인하는 이유는 무엇일까요?",['산책과 공백이 붙은 산책을 같은 이름으로 다루려고','모든 습관을 삭제하려고','체크를 숨기려고'],0,'사용자가 같은 뜻으로 넣은 이름이 공백 때문에 여러 개 생기지 않게 해요.')},
    {id:'today',title:'오늘 기록을 체크하고 되돌리기',goal:'체크하면 오늘 날짜를 한 번만 기록하고, 해제하면 오늘 날짜만 지워 주세요. 어제 기록은 남겨요.',hint:'find로 고유 번호를 찾고 오늘 날짜의 포함 여부를 확인해요.',code:{'// HABIT_TOGGLE':String.raw`const habit=habits.find(habit=>habit.id===id);if(!habit)return;
  const day=appToday();
  if(checked&&!habit.days.includes(day))habit.days.push(day);
  if(!checked)habit.days=habit.days.filter(value=>value!==day);
  saveHabits();renderHabits();`},tests:[test('오늘을 두 번 체크해도 날짜는 하나',`(()=>{${habitReset}${habitAdd('산책')}const box=Q('#habit-list input');box.checked=true;box.dispatchEvent(new Event('change'));const again=Q('#habit-list input');again.checked=true;again.dispatchEvent(new Event('change'));return habits[0].days.length===1&&habits[0].days[0]===appToday();})()`),test('체크 해제는 지난 기록을 지우지 않기',"(()=>{habits=[{id:10,name:'산책',days:['2020-01-01',appToday()]}];renderHabits();const box=Q('#habit-list input');box.checked=false;box.dispatchEvent(new Event('change'));return habits[0].days.join(',')==='2020-01-01';})()")],quiz:quiz('오늘 체크를 해제할 때 days를 빈 배열로 만들면?',['어제와 그 이전 기록도 사라져요.','오늘 기록만 없어져요.','이름만 바뀌어요.'],0,'오늘 날짜만 골라 지워야 다른 날의 기록을 보존할 수 있어요.')},
    {id:'rate',title:'남은 습관과 전체 달성률 구분하기',goal:'오늘 아직 필터에서는 오늘 기록이 없는 습관만 보여 주세요. 달성률은 필터와 관계없이 전체 습관 기준으로 반올림해요.',hint:'보이는 목록과 전체 완료 개수를 따로 계산해요.',code:{'// HABIT_VISIBLE\n  const visible = habits;':"const visible=habits.filter(habit=>filter==='all'||!habit.days.includes(day));",'// HABIT_RATE':"const done=habits.filter(habit=>habit.days.includes(day)).length;\n  document.querySelector('#habit-rate').textContent=habits.length?Math.round(done/habits.length*100):0;"},tests:[test('필터에서도 달성률은 전체 기준',"(()=>{habits=[{id:1,name:'산책',days:[appToday()]},{id:2,name:'독서',days:[]}];Q('#habit-filter').value='remaining';Q('#habit-filter').dispatchEvent(new Event('change'));return COUNT('.task')===1&&TXT('#habit-list').includes('독서')&&TXT('#habit-rate')==='50';})()"),test('빈 목록의 달성률은 0',`(()=>{${habitReset}return TXT('#habit-rate')==='0'&&!Q('#habit-empty').hidden;})()`)],quiz:quiz("남은 습관 하나만 보여도 달성률이 50%인 이유는 무엇일까요?",['필터가 계산을 망가뜨려서','전체 두 개 중 하나를 완료해서','한 줄이면 항상 50%여서'],1,'필터는 보기만 바꾸고 달성률은 전체 습관으로 계산해요.')},
    {id:'save',title:'습관과 날짜 기록 저장하기',goal:'처음에 저장된 습관을 읽고 추가·체크·해제한 뒤 전체 기록을 저장해 주세요.',hint:'복원할 때 nextId를 갱신하고 상태 변경 때 saveHabits를 호출해요.',code:{'// HABIT_RESTORE':"const saved=readData();if(saved)habits=saved;nextId=Math.max(0,...habits.map(h=>h.id))+1;",'// HABIT_SAVE':'writeData(habits);'},prepend:true,tests:[test('저장된 습관 복원',"habits.length===1&&TXT('#habit-list').includes('저장된 산책')"),test('체크·해제는 저장 기록에도 반영',`(()=>{${habitReset}${habitAdd('산책')}let box=Q('#habit-list input');box.checked=true;box.dispatchEvent(new Event('change'));const checked=readData()[0].days.includes(appToday());box=Q('#habit-list input');box.checked=false;box.dispatchEvent(new Event('change'));return checked&&!readData()[0].days.includes(appToday());})()`),test('복원 뒤 새 습관 번호는 중복되지 않기',`(()=>{writeData([{id:1,name:'기존 하나',days:[]},{id:90,name:'기존 둘',days:[]}]);restoreHabits();${habitAdd('새 습관')}const saved=readData();return saved.length===3&&new Set(saved.map(h=>h.id)).size===3&&saved[2].id>90;})()`)],quiz:quiz('오늘 완료한 습관 이름만 저장해도 충분할까요?',['네. 다른 날과 이름은 필요 없어요.','아니요. 습관의 번호·이름·완료 날짜들을 함께 저장해야 해요.','합계만 저장하면 돼요.'],1,'다음 시작 때 습관 목록과 날짜별 기록을 모두 복원할 수 있어야 해요.')},
    {id:'history',title:'혼자 확장하기 · 누적 실천 횟수',goal:'모든 습관의 서로 다른 완료 날짜를 합쳐 누적 실천 횟수를 보여 주세요. 오래된 중복 날짜가 있으면 한 번만 세고, 필터로 숨겨도 전체 기록을 세요.',hint:'각 습관의 days를 Set으로 중복 제거한 뒤 길이를 합쳐요.',code:{'// HABIT_HISTORY':"const total=habits.reduce((sum,habit)=>sum+new Set(habit.days).size,0);\n  document.querySelector('#habit-history').textContent='누적 실천 '+total+'회';"},tests:[test('중복 날짜와 숨긴 습관도 정확히 집계',"(()=>{habits=[{id:1,name:'산책',days:['2020-01-01','2020-01-01',appToday()]},{id:2,name:'독서',days:[appToday()]}];Q('#habit-filter').value='remaining';renderHabits();return COUNT('.task')===0&&TXT('#habit-history')==='누적 실천 3회';})()"),test('빈 기록은 누적 0회',`(()=>{${habitReset}return TXT('#habit-history')==='누적 실천 0회';})()`)],quiz:quiz("Set으로 같은 날짜를 한 번만 세는 이유는 무엇일까요?",['실제 한 번 한 일을 중복 저장 때문에 두 번 세지 않으려고','오늘 날짜를 바꾸려고','모든 기록을 지우려고'],0,'저장된 자료에 중복이 있더라도 표시한 횟수는 실제 서로 다른 날짜를 기준으로 계산해요.')}
  ]);

  const quizSource=String.raw`const questions=[
  {text:'한 권 5000원인 책 두 권의 금액은?',options:['5000원','10000원','15000원'],answer:1},
  {text:'사용자 글을 그대로 보여 줄 속성은?',options:['textContent','innerHTML','className'],answer:0},
  {text:'배열에 새 항목을 끝에 추가하는 메서드는?',options:['filter','map','push'],answer:2}
];
let answers=[];
const quizError=document.querySelector('#quiz-error');
function restoreQuiz(){
  // QUIZ_RESTORE
}
function saveQuiz(){
  // QUIZ_SAVE
}
function chooseAnswer(index){
  // QUIZ_CHOOSE
}
function restartQuiz(){
  // QUIZ_RESTART
}
function renderQuiz(){
  const index=answers.length;
  document.querySelector('#quiz-options').replaceChildren();
  document.querySelector('#quiz-progress').textContent=index+'/'+questions.length;
  if(index<questions.length){
    document.querySelector('#quiz-question').textContent=questions[index].text;
    questions[index].options.forEach((text,i)=>{const button=document.createElement('button');button.textContent=text;button.dataset.answer=i;button.addEventListener('click',()=>chooseAnswer(i));document.querySelector('#quiz-options').append(button);});
  }else document.querySelector('#quiz-question').textContent='모두 풀었어요.';
  document.querySelector('#quiz-score').textContent='0';
  // QUIZ_SCORE
  document.querySelector('#quiz-wrong').replaceChildren();
  // QUIZ_WRONG
}
document.querySelector('#quiz-restart').addEventListener('click',restartQuiz);
restoreQuiz();renderQuiz();`;
  const quizReset="answers=[];renderQuiz();";
  const solveQuiz="CLICK('[data-answer=\"1\"]');CLICK('[data-answer=\"0\"]');CLICK('[data-answer=\"2\"]');";
  make({id:'quiz-app',app:'내 퀴즈 앱',title:'풀고 다시 보는 퀴즈 앱',summary:'선택, 다음 문제, 점수와 진행 저장을 만들어요. 마지막에는 틀린 문제의 정답을 모아 보여 줘요.',source:quizSource,filename:'my-quiz.html',foundation:{track:'javascript',lesson:'배열'},
    html:'<div class="demo-kicker">작은 완성 프로젝트 · 03</div><h1>내 퀴즈 앱</h1><p>답한 문제 <b id="quiz-progress">0/3</b></p><h2 id="quiz-question"></h2><div id="quiz-options" class="filters"></div><p id="quiz-error" class="error" role="status"></p><p>현재 점수 <b id="quiz-score">0</b> / 3</p><button id="quiz-restart">처음부터 다시 풀기</button><h2>틀린 문제 다시 보기</h2><ul id="quiz-wrong" class="product-list"></ul>',
    reading:[['입력','현재 문제에서 답 하나를 고르거나 다시 풀기를 눌러요.'],['처리','answers에 선택을 순서대로 모으고 문제의 정답과 비교해요.'],['화면','다음 문제, 진행과 점수, 틀린 문제 목록을 보여 줘요.']],concepts:[['answers.length','이미 답한 개수는 다음 문제의 위치로도 사용할 수 있어요.'],['데이터에서 점수 계산','점수를 누적 변수로 따로 올리는 대신 현재 답과 정답을 비교하면 재시작과 복원이 쉬워요.'],['진행 저장','선택한 답을 저장하면 앱을 다시 열어도 이어 풀고 점수를 다시 계산할 수 있어요.']],
    storage:{key:'coderun-quiz',fixture:[1],validate:'Array.isArray(data)&&data.length<=3&&data.every(a=>Number.isInteger(a)&&a>=0&&a<3)',error:'#quiz-error'}},[
    {id:'answer',title:'답을 고르면 다음 문제 보여 주기',goal:'현재 문제에서 0·1·2 중 하나를 고르면 answers에 기록하고 다음 문제로 넘어가요. 끝난 뒤에는 더 기록하지 않아요.',hint:'선택이 유효한지, 아직 남은 문제가 있는지 먼저 확인해요.',code:{'// QUIZ_CHOOSE':"if(answers.length>=questions.length||!Number.isInteger(index)||index<0||index>=questions[answers.length].options.length)return;\n  answers.push(index);saveQuiz();renderQuiz();"},tests:[test('답을 고르면 기록하고 다음 문제 표시',`(()=>{${quizReset}CLICK('[data-answer=\"1\"]');return answers[0]===1&&TXT('#quiz-progress')==='1/3'&&TXT('#quiz-question').includes('사용자 글');})()`),test('잘못된 선택과 종료 뒤의 선택은 무시',`(()=>{${quizReset}chooseAnswer(-1);chooseAnswer(9);chooseAnswer(1.5);const invalid=answers.length===0;${solveQuiz}chooseAnswer(0);return invalid&&answers.length===3&&COUNT('#quiz-options button')===0;})()`)],quiz:quiz("다음 문제의 위치를 answers.length로 구하는 이유는 무엇일까요?",['이미 답한 개수 다음부터 보여 주려고','항상 첫 문제를 보여 주려고','점수를 두 배로 주려고'],0,'0개 답했으면 첫 문제, 1개 답했으면 두 번째 문제를 보여 줘요.')},
    {id:'score',title:'맞힌 답만 점수로 계산하기',goal:'현재 answers를 문제별 정답과 비교해 맞힌 개수를 보여 주세요. 다시 그려도 점수가 두 번 오르면 안 돼요.',hint:'answers.reduce에서 질문의 answer와 같은 경우에만 1을 더해요.',code:{'// QUIZ_SCORE':"document.querySelector('#quiz-score').textContent=answers.reduce((sum,answer,i)=>sum+(answer===questions[i].answer?1:0),0);"},tests:[test('정답·오답을 섞으면 맞힌 개수만 점수',`(()=>{${quizReset}CLICK('[data-answer=\"0\"]');CLICK('[data-answer=\"0\"]');CLICK('[data-answer=\"2\"]');renderQuiz();renderQuiz();return TXT('#quiz-score')==='2';})()`),test('모든 정답은 3점',`(()=>{${quizReset}${solveQuiz}return TXT('#quiz-score')==='3';})()`)],quiz:quiz("renderQuiz를 두 번 호출해도 점수가 같아야 하는 이유는 무엇일까요?",['화면을 그리는 횟수가 실력을 뜻하지 않아서','항상 0점이어야 해서','선택이 자동 취소돼서'],0,'점수는 저장된 답에서 계산해야 화면을 다시 그리거나 앱을 다시 열어도 같아요.')},
    {id:'restart',title:'처음부터 다시 풀 수 있게 하기',goal:'다시 풀기를 누르면 답과 점수를 비우고 첫 문제부터 보여 주세요.',hint:'answers를 비우고 저장·화면 갱신을 함께 해요.',code:{'// QUIZ_RESTART':'answers=[];saveQuiz();renderQuiz();'},tests:[test('종료 뒤 다시 풀면 첫 문제와 0점',`(()=>{${quizReset}${solveQuiz}${click('quiz-restart')}return answers.length===0&&TXT('#quiz-progress')==='0/3'&&TXT('#quiz-score')==='0'&&COUNT('#quiz-options button')===3;})()`)],quiz:quiz('재시작 때 화면 글자만 0점으로 바꾸면?',['답 배열은 남아서 다음 렌더 때 이전 점수가 돌아와요.','모든 답이 자동 삭제돼요.','다시 풀기 버튼이 사라져요.'],0,'진행의 기준인 answers를 비워야 문제와 점수도 함께 처음으로 돌아가요.')},
    {id:'save',title:'닫았다 열어도 이어 풀기',goal:'저장된 답을 복원하고, 선택과 재시작 때 답 배열을 저장해 주세요.',hint:'restoreQuiz는 readData를, saveQuiz는 writeData를 사용해요.',code:{'// QUIZ_RESTORE':'const saved=readData();if(saved)answers=saved;','// QUIZ_SAVE':'writeData(answers);'},prepend:true,tests:[test('저장된 답 뒤의 문제와 점수를 복원',"TXT('#quiz-progress')==='1/3'&&TXT('#quiz-score')==='1'&&TXT('#quiz-question').includes('사용자 글')"),test('선택과 재시작을 저장',`(()=>{${quizReset}CLICK('[data-answer=\"1\"]');const saved=readData()[0]===1;${click('quiz-restart')}return saved&&readData().length===0;})()`)],quiz:quiz('점수만 저장하면 이어 풀 때 어떤 정보가 부족하나요?',['어떤 문제까지 어떤 답을 골랐는지','화면 너비','버튼 색깔'],0,'답을 저장하면 진행·점수·틀린 문제를 함께 복원할 수 있어요.')},
    {id:'review',title:'혼자 확장하기 · 틀린 문제 모아 보기',goal:'답한 문제 중 틀린 것만 문제 이름과 올바른 답을 보여 주세요. 아직 답하지 않은 문제와 맞힌 문제는 넣지 않아요.',hint:'answers를 돌며 questions[i].answer와 비교하고 글자 노드로 목록을 만들어요.',code:{'// QUIZ_WRONG':String.raw`answers.forEach((answer,i)=>{
    if(answer===questions[i].answer)return;
    const row=document.createElement('li');row.textContent=questions[i].text+' 정답: '+questions[i].options[questions[i].answer];document.querySelector('#quiz-wrong').append(row);
  });`},tests:[test('틀린 답의 문제와 정답만 표시',`(()=>{${quizReset}CLICK('[data-answer=\"0\"]');CLICK('[data-answer=\"0\"]');return COUNT('#quiz-wrong li')===1&&TXT('#quiz-wrong').includes('10000원')&&!TXT('#quiz-wrong').includes('메서드');})()`),test('재시작 뒤 오답 목록도 비우기',`(()=>{${click('quiz-restart')}return COUNT('#quiz-wrong li')===0;})()`)],quiz:quiz("오답 목록에서 아직 풀지 않은 문제를 빼는 이유는 무엇일까요?",['선택하지 않은 답을 틀렸다고 판단할 수 없어서','모든 문제를 숨기려고','문제가 길어서'],0,'실제로 답한 기록을 기준으로 어떤 개념을 다시 볼지 알려 줘야 해요.')}
  ]);

  const reservationSource=String.raw`const capacity=4;
let bookings=[];
let nextId=1;
const bookingList=document.querySelector('#booking-list');
const bookingError=document.querySelector('#booking-error');
function restoreBookings(){
  // BOOKING_RESTORE
}
function saveBookings(){
  // BOOKING_SAVE
}
function addBooking(){
  const name=document.querySelector('#booking-name').value.trim();
  const seats=Number(document.querySelector('#booking-seats').value);
  const slot=document.querySelector('#booking-slot').value;
  bookingError.textContent='';
  // BOOKING_VALIDATE
  // BOOKING_CAPACITY
  // BOOKING_DUPLICATE
  // BOOKING_ADD
}
function cancelBooking(id){
  // BOOKING_CANCEL
}
function renderBookings(){
  const slot=document.querySelector('#booking-slot').value;
  const visible=bookings.filter(booking=>booking.slot===slot);
  bookingList.replaceChildren();
  visible.forEach(booking=>{
    const row=document.createElement('li');row.append(document.createTextNode(booking.name+' · '+booking.seats+'명 '));
    const button=document.createElement('button');button.textContent='취소';button.dataset.bookingId=booking.id;button.addEventListener('click',()=>cancelBooking(booking.id));row.append(button);bookingList.append(row);
  });
  document.querySelector('#booking-empty').hidden=visible.length>0;
  document.querySelector('#booking-left').textContent='4';
  // BOOKING_LEFT
}
document.querySelector('#booking-form').addEventListener('submit',event=>{event.preventDefault();addBooking();});
document.querySelector('#booking-slot').addEventListener('change',renderBookings);
restoreBookings();renderBookings();`;
  const bookingReset="bookings=[];nextId=1;Q('#booking-slot').value='10:00';renderBookings();";
  const bookingAdd=(name,seats,slot='10:00')=>input('booking-name',name)+input('booking-seats',seats)+input('booking-slot',slot)+click('booking-add');
  make({id:'reservation-app',app:'내 예약 목록',title:'정원 안에서 예약 받기',summary:'인원 검사, 시간별 정원, 취소와 저장을 만들어요. 마지막에는 같은 사람의 중복 예약을 막아요.',source:reservationSource,filename:'my-reservations.html',foundation:{track:'javascript',lesson:'배열'},
    html:'<div class="demo-kicker">작은 완성 프로젝트 · 04</div><h1>내 예약 목록</h1><p class="demo-note">이 브라우저에서만 사용하는 연습 앱이에요. 여러 사람이 동시에 예약하는 서버는 다음 과정에서 다뤄요.</p><form id="booking-form" novalidate><label class="field">예약자 이름<input id="booking-name" maxlength="60"></label><label class="field">예약 인원<input id="booking-seats" type="number"></label><label class="field">시간<select id="booking-slot"><option>10:00</option><option>11:00</option><option>12:00</option></select></label><button id="booking-add" class="primary">예약하기</button></form><p id="booking-error" class="error" role="status"></p><p>이 시간에 남은 자리 <b id="booking-left">4</b>명</p><ul id="booking-list" class="product-list"></ul><p id="booking-empty" class="empty">이 시간의 예약이 없어요.</p>',
    reading:[['입력','이름·인원·시간을 고르고 예약하거나 기존 예약을 취소해요.'],['처리','그 시간에 이미 예약한 인원을 더해 정원을 확인해요.'],['화면','고른 시간의 예약 목록과 남은 자리를 보여 줘요.']],concepts:[['시간별 정원','다른 시간의 예약은 현재 시간의 자리 수를 차지하지 않아요.'],['검사 뒤에 변경','입력과 정원 검사가 끝난 다음에만 bookings에 추가해야 잘못된 예약이 남지 않아요.'],['고유 번호','시간을 바꾸면 화면 순서가 바뀌어요. 취소할 때는 예약의 id로 찾아요.']],
    storage:{key:'coderun-reservations',fixture:[{id:51,name:'저장된 예약자',seats:2,slot:'10:00'}],validate:"Array.isArray(data)&&data.length<=100&&data.every(b=>b&&Number.isSafeInteger(b.id)&&typeof b.name==='string'&&b.name.length<=60&&Number.isInteger(b.seats)&&b.seats>0&&b.seats<=4&&['10:00','11:00','12:00'].includes(b.slot))",error:'#booking-error'}},[
    {id:'input',title:'예약 이름과 정수 인원 확인하기',goal:'이름이 있고 인원이 1~4명인 정수일 때 예약을 기록해요. 빈 이름·0명·음수·소수는 거절해요.',hint:'변경하기 전에 이름과 인원을 검사해요.',code:{'// BOOKING_VALIDATE':"if(!name||name.length>60||!Number.isInteger(seats)||seats<1||seats>capacity){bookingError.textContent='이름과 1~4명의 정수 인원을 입력해 주세요.';return;}",'// BOOKING_ADD':"if(bookings.length>=100){bookingError.textContent='예약은 100건까지 기록할 수 있어요.';return;}\n  bookings.push({id:nextId++,name,seats,slot});saveBookings();renderBookings();"},tests:[test('정상 예약은 고른 시간의 목록에 표시',`(()=>{${bookingReset}${bookingAdd('민지','2')}return bookings.length===1&&TXT('#booking-list').includes('민지');})()`),test('빈 이름과 잘못된 인원은 기록하지 않기',`(()=>{${bookingReset}${bookingAdd(' ','1')}${bookingAdd('민지','0')}${bookingAdd('민지','-1')}${bookingAdd('민지','1.5')}return bookings.length===0&&TXT('#booking-error').length>0;})()`)],quiz:quiz('예약을 추가한 뒤 잘못된 입력인지 확인하면?',['잘못된 예약이 목록과 저장에 남을 수 있어요.','더 안전해요.','정원이 늘어나요.'],0,'원본 상태를 바꾸기 전에 조건을 확인하면 실패한 입력이 기록에 남지 않아요.')},
    {id:'capacity',title:'시간별 정원과 남은 자리 계산하기',goal:'같은 시간의 예약 인원 합계가 4명을 넘으면 거절해요. 남은 자리도 시간별로 계산해요.',hint:'같은 slot만 filter한 뒤 seats를 더해요.',code:{'// BOOKING_CAPACITY':"const used=bookings.filter(b=>b.slot===slot).reduce((sum,b)=>sum+b.seats,0);\n  if(used+seats>capacity){bookingError.textContent='이 시간의 남은 자리가 부족해요.';return;}",'// BOOKING_LEFT':"document.querySelector('#booking-left').textContent=capacity-visible.reduce((sum,b)=>sum+b.seats,0);"},tests:[test('정원을 정확히 채울 수 있고 초과는 거절',`(()=>{${bookingReset}${bookingAdd('민지','3')}${bookingAdd('준','1')}${bookingAdd('초과','1')}return bookings.length===2&&TXT('#booking-left')==='0'&&TXT('#booking-error').includes('부족');})()`),test('다른 시간의 자리는 따로 계산',`(()=>{${bookingReset}${bookingAdd('민지','4')}${bookingAdd('준','2','11:00')}return bookings.length===2&&TXT('#booking-left')==='2'&&COUNT('#booking-list li')===1;})()`)],quiz:quiz("10시가 만석이어도 11시 예약을 받을 수 있는 이유는 무엇일까요?",['시간별 정원을 따로 계산해서','모든 예약을 지워서','이름이 달라서'],0,'예약 시간이라는 조건으로 목록을 나눈 다음 각 시간의 사용 인원을 계산해요.')},
    {id:'cancel',title:'고른 시간의 예약을 안전하게 취소하기',goal:'고유 번호에 맞는 예약만 지우고 남은 자리를 다시 계산해요. 다른 시간의 예약은 유지해요.',hint:'예약의 id를 기준으로 filter해요.',code:{'// BOOKING_CANCEL':'bookings=bookings.filter(b=>b.id!==id);saveBookings();renderBookings();'},tests:[test('다른 시간을 유지하며 취소한 자리 복구',`(()=>{${bookingReset}${bookingAdd('민지','3')}${bookingAdd('준','2','11:00')}CLICK('#booking-list button');return bookings.length===1&&bookings[0].name==='민지'&&TXT('#booking-left')==='4';})()`)],quiz:quiz('취소 뒤 남은 자리를 따로 2만큼 더하는 대신 다시 계산하면?',['현재 예약 상태에서 정확한 값을 만들 수 있어요.','항상 자리가 0이 돼요.','다른 시간이 사라져요.'],0,'목록을 기준으로 다시 계산하면 중복 갱신 때문에 남은 자리가 잘못 늘어나는 일을 줄여요.')},
    {id:'save',title:'예약 복원과 취소 저장하기',goal:'저장된 예약을 읽어 남은 자리까지 복원해요. 추가와 취소 후에는 현재 목록을 저장해요.',hint:'복원 후에는 기존 최대 id 다음부터 새 번호를 써요.',code:{'// BOOKING_RESTORE':'const saved=readData();if(saved)bookings=saved;nextId=Math.max(0,...bookings.map(b=>b.id))+1;','// BOOKING_SAVE':'writeData(bookings);'},prepend:true,tests:[test('저장된 예약과 남은 자리 복원',"bookings.length===1&&TXT('#booking-list').includes('저장된 예약자')&&TXT('#booking-left')==='2'"),test('예약과 취소 모두 저장',`(()=>{${bookingReset}${bookingAdd('민지','2')}const stored=readData()[0].seats===2;CLICK('#booking-list button');return stored&&readData().length===0;})()`),test('복원 뒤 새 예약 번호는 중복되지 않기',`(()=>{writeData([{id:1,name:'기존 하나',seats:1,slot:'10:00'},{id:90,name:'기존 둘',seats:1,slot:'11:00'}]);restoreBookings();${bookingAdd('새 예약','1','12:00')}const saved=readData();return saved.length===3&&new Set(saved.map(b=>b.id)).size===3&&saved[2].id>90;})()`)],quiz:quiz("예약 목록을 복원한 뒤 남은 자리도 다시 계산해야 하는 이유는 무엇일까요?",['예전 예약이 현재 정원을 차지하므로','저장하면 자리가 늘어나므로','이름을 지우려고'],0,'저장된 예약도 현재 상태에 포함되므로 화면과 정원 검사에 함께 반영해야 해요.')},
    {id:'duplicate',title:'혼자 확장하기 · 같은 시간 중복 예약 막기',goal:'같은 이름으로 같은 시간에 이미 예약했으면 추가하지 않아요. 다른 시간의 예약은 허용해요. 이름 앞뒤 공백도 정리해요.',hint:'이름과 시간 두 조건이 모두 같은 기존 예약이 있는지 확인해요.',code:{'// BOOKING_DUPLICATE':"if(bookings.some(b=>b.name===name&&b.slot===slot)){bookingError.textContent='같은 시간에 이미 예약했어요.';return;}"},tests:[test('공백이 달라도 같은 시간 중복은 거절',`(()=>{${bookingReset}${bookingAdd(' 민지 ','1')}${bookingAdd('민지','1')}return bookings.length===1&&TXT('#booking-error').includes('이미');})()`),test('같은 사람의 다른 시간 예약은 허용',`(()=>{${bookingReset}${bookingAdd('민지','1')}${bookingAdd('민지','1','11:00')}return bookings.length===2;})()`)],quiz:quiz('중복을 판정할 때 이름만 비교하면?',['다른 시간에 하는 정상 예약도 막힐 수 있어요.','정원이 자동 복구돼요.','아무 예약도 막지 못해요.'],0,'이 요구사항은 같은 이름과 같은 시간의 조합이 중복인지 확인해야 해요.')}
  ]);

  const boardSource=String.raw`let posts=[];
let nextId=1;
const postList=document.querySelector('#post-list');
const postError=document.querySelector('#post-error');
function restorePosts(){
  // POST_RESTORE
}
function savePosts(){
  // POST_SAVE
}
function addPost(){
  // POST_ADD
}
function deletePost(id){
  // POST_DELETE
}
function pinPost(id){
  // POST_PIN
}
function renderPosts(){
  const word=document.querySelector('#post-query').value;
  // POST_VISIBLE
  const visible=posts;
  postList.replaceChildren();
  visible.forEach(post=>{
    const row=document.createElement('li');const heading=document.createElement('strong');heading.textContent=post.title;
    const text=document.createElement('p');text.textContent=post.body;
    const remove=document.createElement('button');remove.textContent='삭제';remove.dataset.postId=post.id;remove.addEventListener('click',()=>deletePost(post.id));
    const pin=document.createElement('button');pin.textContent=post.pinned?'고정 해제':'맨 위에 고정';pin.dataset.pinId=post.id;pin.addEventListener('click',()=>pinPost(post.id));
    row.append(heading,text,remove,document.createTextNode(' '),pin);postList.append(row);
  });
  document.querySelector('#post-empty').hidden=visible.length>0;
  document.querySelector('#post-count').textContent=visible.length;
}
document.querySelector('#post-form').addEventListener('submit',event=>{event.preventDefault();addPost();});
document.querySelector('#post-query').addEventListener('input',renderPosts);
restorePosts();renderPosts();`;
  const postReset="posts=[];nextId=1;Q('#post-query').value='';renderPosts();";
  const postAdd=(title,body)=>input('post-title',title)+input('post-body',body)+click('post-add');
  make({id:'board-app',app:'내 작은 게시판',title:'글을 쓰고 찾는 작은 게시판',summary:'글 입력, 검색, 삭제와 저장을 만들어요. 마지막에는 중요한 글을 맨 위에 고정해요.',source:boardSource,filename:'my-board.html',foundation:{track:'javascript',lesson:'배열'},
    html:'<div class="demo-kicker">작은 완성 프로젝트 · 05</div><h1>내 작은 게시판</h1><p class="demo-note">내 브라우저에 글을 모으는 앱이에요. 다른 사람과 공유하는 게시판은 서버 과정에서 이어 만들어요.</p><form id="post-form" novalidate><label class="field">제목<input id="post-title" maxlength="60"></label><label class="field">내용<textarea id="post-body" maxlength="500"></textarea></label><button id="post-add" class="primary">글 올리기</button></form><p id="post-error" class="error" role="status"></p><label class="field">제목이나 내용으로 찾기<input id="post-query"></label><p>찾은 글 <b id="post-count">0</b>개</p><ul id="post-list" class="product-list"></ul><p id="post-empty" class="empty">보일 글이 없어요.</p>',
    reading:[['입력','제목과 내용을 쓰고 글을 올리거나 검색·삭제·고정해요.'],['처리','posts를 유지하며 검색에 맞는 글을 고르고 순서를 정해요.'],['화면','제목과 내용은 글자로 붙이고 보이는 글의 개수를 표시해요.']],concepts:[['안전한 글 표시','사용자 제목과 내용은 textContent로 넣어 태그도 그대로 보여 줘요.'],['원본과 검색 결과','검색은 posts를 줄여 저장하는 일이 아니에요. 검색어를 지우면 전체 글이 돌아와야 해요.'],['정렬의 기준','고정 여부를 먼저 비교하고 같은 상태끼리는 고유 번호가 큰 최신 글부터 보여 줘요.']],
    storage:{key:'coderun-board',fixture:[{id:61,title:'저장된 첫 글',body:'다시 만나요.',pinned:false}],validate:"Array.isArray(data)&&data.length<=100&&data.every(p=>p&&Number.isSafeInteger(p.id)&&typeof p.title==='string'&&p.title.length<=60&&typeof p.body==='string'&&p.body.length<=500&&typeof p.pinned==='boolean')",error:'#post-error'}},[
    {id:'input',title:'제목과 내용을 확인하고 글 올리기',goal:'제목과 내용이 모두 있을 때만 새 글을 추가해요. 앞뒤 공백을 정리하고 태그도 글자로 보여 주세요.',hint:'title과 body를 각각 trim하고 빈 값이면 먼저 멈춰요.',code:{'// POST_ADD':String.raw`const title=document.querySelector('#post-title').value.trim();const body=document.querySelector('#post-body').value.trim();
  postError.textContent='';
  if(!title||!body||title.length>60||body.length>500){postError.textContent='제목과 내용을 입력해 주세요.';return;}
  if(posts.length>=100){postError.textContent='글은 100개까지 모아둘 수 있어요.';return;}
  posts.push({id:nextId++,title,body,pinned:false});savePosts();renderPosts();`},tests:[test('빈 제목이나 내용은 글이 되지 않기',`(()=>{${postReset}${postAdd(' ','내용')}${postAdd('제목',' ')}return posts.length===0&&TXT('#post-error').length>0;})()`),test('제목과 내용의 태그를 글자로 표시',`(()=>{${postReset}${postAdd('<b>제목</b>','<img src=x>')}return COUNT('#post-list li')===1&&TXT('#post-list').includes('<b>제목</b>')&&COUNT('#post-list b')===0&&COUNT('#post-list img')===0;})()`)],quiz:quiz('게시판에서 사용자 글을 innerHTML로 넣으면?',['입력한 태그가 화면 요소로 해석될 수 있어요.','항상 글자로만 보여요.','저장이 자동으로 돼요.'],0,'사용자가 쓴 내용을 글자로 보여 주려면 textContent나 글자 노드를 사용해요.')},
    {id:'search',title:'제목과 내용을 함께 검색하기',goal:'공백·영문 대소문자를 정리해서 제목 또는 내용에 맞는 글을 찾고 최신 글부터 보여 주세요. 없는 결과는 안내해요.',hint:'검색어와 비교할 글을 소문자로 맞추고 filter 뒤 복사본을 정렬해요.',code:{'// POST_VISIBLE\n  const visible=posts;':"const normalized=word.trim().toLowerCase();\n  const visible=posts.filter(p=>(p.title+' '+p.body).toLowerCase().includes(normalized)).sort((a,b)=>b.id-a.id);"},tests:[test('내용도 공백·대문자와 관계없이 검색',`(()=>{${postReset}${postAdd('첫 글','JavaScript 공부')}${postAdd('두 번째','SQL 공부')}${input('post-query',' JAVASCRIPT ')}Q('#post-query').dispatchEvent(new Event('input'));return COUNT('#post-list li')===1&&TXT('#post-count')==='1'&&posts.length===2;})()`),test('빈 검색은 최신순 전체, 없는 검색은 안내',`(()=>{${input('post-query','')}Q('#post-query').dispatchEvent(new Event('input'));const newest=Q('#post-list strong').textContent==='두 번째';${input('post-query','없는내용')}Q('#post-query').dispatchEvent(new Event('input'));return newest&&COUNT('#post-list li')===0&&!Q('#post-empty').hidden;})()`)],quiz:quiz('검색어를 지우면 전체 글이 돌아오게 하려면?',['검색 결과로 원본 posts를 덮어쓰지 않아요.','원본을 매번 삭제해요.','검색을 저장해요.'],0,'원본 상태를 유지하고 보여 줄 목록만 검색으로 골라야 해요.')},
    {id:'delete',title:'검색한 글만 정확히 삭제하기',goal:'글의 고유 번호로 삭제하고 남은 글 수와 목록을 갱신해요. 검색으로 숨겨진 다른 글은 남겨요.',hint:'화면 순서 대신 전달받은 id와 post.id를 비교해요.',code:{'// POST_DELETE':'posts=posts.filter(p=>p.id!==id);savePosts();renderPosts();'},tests:[test('검색 결과를 지워도 다른 글은 보존',`(()=>{${postReset}${postAdd('보존','첫 글')}${postAdd('삭제 대상','둘째')}${input('post-query','삭제 대상')}Q('#post-query').dispatchEvent(new Event('input'));CLICK('#post-list [data-post-id]');return posts.length===1&&posts[0].title==='보존'&&TXT('#post-count')==='0';})()`)],quiz:quiz("검색 결과의 첫 번째 글을 지울 때 기준은 무엇일까요?",['원본 배열의 0번째','그 글에 붙은 고유 번호','제목 길이'],1,'검색과 정렬로 위치가 달라져도 고유 번호는 같은 글을 가리켜요.')},
    {id:'save',title:'글 목록과 고유 번호 복원하기',goal:'저장된 글을 읽고 새 번호가 기존 번호와 겹치지 않게 준비해요. 추가·삭제 때 글 목록을 저장해요.',hint:'저장된 최대 id 다음 번호를 nextId로 사용해요.',code:{'// POST_RESTORE':'const saved=readData();if(saved)posts=saved;nextId=Math.max(0,...posts.map(p=>p.id))+1;','// POST_SAVE':'writeData(posts);'},prepend:true,tests:[test('저장된 글을 시작할 때 복원',"posts.length===1&&TXT('#post-list').includes('저장된 첫 글')"),test('글 추가와 삭제를 저장',`(()=>{${postReset}${postAdd('저장할 글','내용')}const saved=readData()[0].title==='저장할 글';CLICK('#post-list [data-post-id]');return saved&&readData().length===0;})()`),test('복원 뒤 새 글 번호는 중복되지 않기',`(()=>{writeData([{id:1,title:'기존 하나',body:'내용',pinned:false},{id:90,title:'기존 둘',body:'내용',pinned:false}]);restorePosts();${postAdd('새 글','새 내용')}const saved=readData();return saved.length===3&&new Set(saved.map(p=>p.id)).size===3&&saved[2].id>90;})()`)],quiz:quiz('복원 뒤 nextId를 늘 기존 값 1로 시작하면?',['기존 글과 번호가 겹쳐 다른 글을 함께 지울 수 있어요.','더 빨라져요.','모든 제목이 바뀌어요.'],0,'고유 번호는 글을 정확히 찾는 기준이에요. 복원된 글과 새 글의 번호가 겹치지 않아야 해요.')},
    {id:'pin',title:'혼자 확장하기 · 중요한 글 맨 위에 고정',goal:'고정 버튼으로 해당 글의 pinned를 바꾸고 저장해요. 고정된 글을 먼저, 같은 상태에서는 최신 글을 먼저 보여 주세요. 고정을 해제하면 일반 순서로 돌아가요.',hint:'정렬에서 pinned를 먼저 비교하고, 같으면 id를 비교해요.',code:{'// POST_PIN':"const post=posts.find(p=>p.id===id);if(!post)return;post.pinned=!post.pinned;savePosts();renderPosts();",'.sort((a,b)=>b.id-a.id)':'.sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.id-a.id)'},tests:[test('고정·해제에 맞춰 순서와 저장 갱신',`(()=>{${postReset}${postAdd('오래된 중요 글','내용')}${postAdd('최신 글','내용')}CLICK('#post-list [data-pin-id="1"]');const pinned=Q('#post-list strong').textContent==='오래된 중요 글'&&readData().find(p=>p.id===1).pinned;CLICK('#post-list [data-pin-id="1"]');return pinned&&Q('#post-list strong').textContent==='최신 글'&&!readData().find(p=>p.id===1).pinned;})()`),test('고정 뒤에도 검색과 삭제 유지',`(()=>{${postReset}${postAdd('오래된','JavaScript')}${postAdd('최신','SQL')}CLICK('#post-list [data-pin-id="1"]');${input('post-query','sql')}Q('#post-query').dispatchEvent(new Event('input'));CLICK('#post-list [data-post-id]');return posts.length===1&&posts[0].pinned&&posts[0].title==='오래된';})()`)],quiz:quiz("고정 여부가 같을 때 id도 비교하는 이유는 무엇일까요?",['같은 그룹 안에서도 최신 글 순서를 유지하려고','모든 글을 지우려고','고정 저장을 막으려고'],0,'여러 정렬 기준을 순서대로 적용하면 중요한 글과 최신 글이라는 두 요구사항을 함께 만족해요.')}
  ]);
  return projects;
});
