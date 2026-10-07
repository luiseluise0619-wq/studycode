/* Short prerequisite exercises. They never award project completion or edit project files. */
(function () {
  'use strict';
  const lessons = {};
  const item = (title, text, code, question, answers, feedback, solution, mode = 'text') => ({ title, text, code, question, answers, feedback, solution, mode });
  lessons[1] = [
    item('값에 이름 붙이기', 'const는 값에 이름을 붙여요. let으로 붙인 이름에는 나중에 다른 값을 넣을 수 있어요. =는 저장, +는 더하기, -는 빼기, *는 곱하기, /는 나누기예요. 숫자가 아닌 문자열끼리 +를 쓰면 글자를 이어 붙여요. 따옴표 안은 글자, 따옴표 없는 숫자는 계산할 값이에요.', 'const price = 3000;\nlet count = 2;\ncount = 3;\nconst total = price * count;', '마지막 total은 얼마인가요? 숫자만 적어요.', ['9000'], 'count는 처음의 2가 아니라 새로 저장한 3이에요.', '3000 × 3이라서 9000이에요.'),
    item('함수에 넣고 돌려받기', '함수는 같은 일을 다시 쓸 수 있게 묶은 코드예요. function 이름(입력 이름) { 할 일 }로 만들고 이름(값)으로 불러요. return은 결과를 부른 곳에 돌려주고 함수를 끝내요. ;는 문장 끝을 표시해요.', 'function double(amount) {\n  return amount * 2;\n}\nconst result = double(4);', 'double(7)을 부르면 무엇을 돌려주나요?', ['14'], 'amount 자리에 이번에 넣은 7을 놓고 계산해요.', '7 × 2를 돌려주므로 14예요.'),
    item('필요한 한 줄 써 보기', '매번 다른 값을 받을 때는 숫자를 고정해 쓰지 않고 입력 이름으로 계산해요. 아래 함수의 빈 줄에는 price와 count를 곱한 값을 돌려주는 문장이 필요해요.', 'function cost(price, count) {\n  // 여기에 한 줄을 넣어요.\n}', '빈 줄에 들어갈 return 문장을 직접 적어요.', ['return price * count;', 'return count * price;'], '앞에서 본 return 뒤에 두 입력 이름을 곱한 식을 놓아요.', 'return price * count; — 어떤 가격과 개수를 받아도 그 둘을 곱해 돌려줘요.', 'code'),
    item('객체에서 값 꺼내기', '객체는 이름표가 붙은 값들을 한 묶음으로 담아요. {name: "가은", seats: 2}에서 name과 seats는 이름표예요. 점 뒤에 이름표를 써서 값을 꺼내요. 문자열의 trim()은 앞뒤 공백을 뺀 새 글자를 돌려주고 length는 글자 수를 알려 줘요.', 'const form = { name: "  민수  ", seats: 3 };\nconst name = form.name.trim();\nconst size = name.length;', 'size에 담긴 숫자는 무엇인가요?', ['2'], '앞뒤 공백을 빼면 두 글자만 남아요.', '민수는 2글자예요.'),
    item('조건과 잘못된 입력', 'true와 false는 참과 거짓이에요. ===는 값과 종류가 같은지, >=와 <=는 기준을 포함하는지 비교해요. &&는 두 조건이 모두 참일 때 참이에요. if (조건) { 할 일 }은 조건이 참일 때 실행해요. null은 값이 없다는 표시이고 !는 참·거짓을 뒤집어요. if (!body) return false;를 먼저 두면 값이 없을 때 뒤의 속성을 읽지 않아요. typeof는 값의 종류를 알려 주고 Number.isInteger는 실제 정수인지 확인해요.', 'const seats = 4;\nconst allowed = Number.isInteger(seats) && seats >= 1 && seats <= 4;', 'allowed는 true인가요, false인가요? 둘 중 하나를 적어요.', ['true'], '4도 정수이고, <= 4는 4 자체를 포함해요.', '세 조건이 모두 참이라서 true예요.'),
    item('문자와 숫자 구분하기', 'includes(값)는 배열이나 문자열 안에 그 값이 있는지 확인해요. 배열은 [값, 값]처럼 순서대로 묶어요. Number.isInteger("2")는 false예요. 따옴표 안의 "2"는 숫자처럼 생긴 글자이기 때문이에요. typeof "민수"는 "string", typeof 2는 "number"예요. 입력이 아예 빠지면 undefined라는 값이에요.', 'const times = ["09:00", "11:00"];\nconst allowed = times.includes("11:00");', 'allowed에 들어가는 값을 적어요.', ['true'], '시간 목록에 같은 문자열이 있는지 찾아요.', '목록에 "11:00"이 있어서 true예요.'),
    item('조건을 함수로 묶기', '한 조건을 함수에 넣어 참·거짓 결과를 돌려줄 수 있어요. 입력 개수가 1 이상 3 이하인지만 검사해 봐요. 서비스 파일의 내보내기·연결 부분은 제공된 틀이에요. 첫 단계에서는 validate의 본문을 고치고, 파일을 연결하는 뜻은 3단계 앞에서 배워요.', 'function allowed(count) {\n  // 조건 결과를 돌려주는 한 줄\n}', '1 이상 3 이하인 조건을 반환하는 return 한 줄을 적어요.', ['return count >= 1 && count <= 3;', 'return count <= 3 && count >= 1;'], '두 비교를 &&로 연결하고 앞에 return을 붙여요.', 'return count >= 1 && count <= 3;', 'code')
  ];
  lessons[2] = [
    item('반복하며 모으기', 'for (const 항목 of 배열) { 할 일 }은 배열을 하나씩 꺼내요. sum += 값은 sum = sum + 값의 짧은 표현이에요. 합계를 담을 그릇은 반복 전에 만들고, return은 다 더한 뒤에 써요. 배열[0]은 첫 항목, 배열[1]은 두 번째 항목이에요. 배열.length는 항목 수예요.', 'const rows = [{ count: 2 }, { count: 1 }];\nlet sum = 0;\nfor (const row of rows) {\n  sum += row.count;\n}', '반복이 끝난 sum은 얼마인가요?', ['3'], '0에서 시작해 2와 1을 차례로 더해요.', '0 → 2 → 3이 돼요.'),
    item('조건에 맞는 값만 더하기', 'if 안에 더하기를 넣으면 조건에 맞는 항목만 계산해요. filter는 조건에 맞는 항목의 새 배열, reduce는 항목을 하나의 값으로 모을 때 쓰는 방법이에요. 아직 낯설면 아래처럼 for와 if로 먼저 만들어도 돼요.', 'let used = 0;\nfor (const row of [{ time: "아침", count: 2 }, { time: "저녁", count: 3 }]) {\n  if (row.time === "아침") used += row.count;\n}', '정원 5에서 used를 빼면 몇 자리가 남나요?', ['3'], '저녁의 3명은 아침 자리 계산에 넣지 않아요.', '아침 2명만 빼므로 5 − 2 = 3이에요.')
  ];
  lessons[3] = [
    item('객체 안의 함수를 부르기', '객체에는 값뿐 아니라 함수도 담을 수 있어요. return { handle };은 {handle: handle}을 짧게 쓴 표현이에요. 아래 handle은 상태 코드와 내용을 함께 담은 객체를 돌려줘요. 상태 코드는 결과의 종류를 나타내는 숫자예요.', 'function create() {\n  function handle(method) {\n    if (method === "GET") return { status: 200, body: "읽었어요" };\n    return { status: 400, body: "다시 확인해요" };\n  }\n  return { handle };\n}\nconst app = create();', 'app.handle("GET").status 값은 무엇인가요?', ['200'], 'create가 반환한 객체의 handle을 부른 뒤 응답의 status를 읽어요.', 'GET 분기로 들어가므로 200이에요.'),
    item('요청 사이에 기억하기', '바깥 함수에서 만든 값은 안쪽 함수가 계속 사용할 수 있어요. 이를 클로저라고 불러요. create를 한 번 부른 뒤 같은 객체의 add를 두 번 부르면 같은 count를 바꿔요. create를 새로 부르면 별도의 count가 생겨요. push(값)는 배열 끝에 값을 더해요.', 'function create() {\n  let count = 0;\n  function add() { count += 1; return count; }\n  return { add };\n}\nconst app = create();\napp.add();', '이어서 같은 app.add()를 한 번 더 부르면 얼마인가요?', ['2'], '첫 호출 뒤 count는 1로 남아 있어요.', '같은 count에 1을 더해 2를 돌려줘요.'),
    item('파일 사이에 함수 건네기', '이 실습의 실행기는 Node.js의 CommonJS 방식으로 파일을 연결해요. module.exports = { double };은 다른 파일이 double을 꺼낼 수 있게 해요. require("./math")는 같은 폴더의 math.js가 내보낸 값을 읽어요. 함수 입력에 options = {}를 쓰면 입력이 없을 때 빈 객체를 쓰는 기본값이에요. { double }로 꺼내는 문법은 객체의 같은 이름 속성을 변수로 받는 표현이에요.', '// math.js\nfunction double(n) { return n * 2; }\nmodule.exports = { double };\n\n// app.js\nconst { double } = require("./math");', 'app.js에서 double(5)를 부르면 무엇을 돌려주나요?', ['10'], '파일을 바꿔도 double의 계산 규칙은 같아요.', '5 × 2라서 10이에요.')
  ];
  lessons[4] = [
    item('찾기와 삭제 구분하기', 'find는 조건에 맞는 첫 항목을 꺼내고, 없으면 undefined를 돌려줘요. filter는 조건에 맞는 항목만 남긴 새 배열을 만들어요. !==는 값이나 종류가 다르다는 비교예요. b => 조건은 입력 b를 받아 조건 결과를 돌려주는 짧은 함수예요.', 'const rows = [{ id: 1 }, { id: 2 }];\nconst remaining = rows.filter(b => b.id !== 1);', 'remaining.length는 얼마인가요?', ['1'], 'ID가 1이 아닌 항목만 남겨요.', 'ID 2 하나만 남아 길이는 1이에요.'),
    item('경로에서 ID 꺼내기', 'split("/")은 /마다 문자열을 나눠 배열로 만들어요. Number(글자)는 숫자로 바꿔요. 경로가 정해 둔 모양인지 먼저 확인하고 ID를 읽어야 엉뚱한 경로를 취소로 처리하지 않아요. 문자열 뒤에 숫자를 +로 붙이면 숫자를 글자로 바꿔 이어 붙여요. "/bookings/" + 7은 "/bookings/7"이에요.', 'const parts = "/tasks/7".split("/");\n// parts는 ["", "tasks", "7"]이에요.\nconst id = Number(parts[2]);', 'id에 담긴 숫자는 무엇인가요?', ['7'], '배열 위치 2의 "7"을 숫자로 바꿔요.', '숫자 7이에요.'),
    item('없는 예약 다시 취소하기', '한 번 지운 예약을 다시 지운다고 자리를 더 늘리면 안 돼요. 현재 남아 있는 예약 인원을 기준으로 자리를 계산하면 두 번째 취소가 빈자리를 만들지 않아요.', '정원 5명 · 현재 예약 2명\n예약을 한 번 취소 → 예약 0명\n같은 ID를 다시 취소 → 예약은 여전히 0명', '두 번째 취소 뒤 남은 자리는 몇 개인가요?', ['5'], '정원에서 현재 예약 인원을 빼요.', '5 − 0 = 5예요. 정원을 넘겨 7로 늘어나지 않아요.')
  ];
  lessons[5] = [
    item('누구인지와 가능한 일', '토큰은 서버가 사용자를 알아보는 데 쓰는 표예요. 인증은 표의 주인을 확인하고, 권한 검사는 그 주인이 이 예약을 취소해도 되는지 확인해요. body에 적은 owner 대신 확인한 사용자 ID를 믿어요.', '확인한 사용자: 지수\n예약 주인: 민수\n요청: 그 예약 취소', '이 요청은 허용인가요, 거절인가요?', ['거절'], '표가 유효해도 다른 사람의 예약을 취소할 권한은 없어요.', '지수의 예약이 아니므로 거절해요.'),
    item('직접 등록한 이름만 인정하기', 'JavaScript 객체에는 직접 넣지 않아도 물려받은 속성이 있어요. tokens[token]은 변수 token에 담긴 이름의 속성을 읽어요. Object.prototype.hasOwnProperty.call(객체, 키)는 직접 등록한 키인지 확인해요. Authorization은 요청에 붙이는 정보인 headers 객체의 속성이에요. "Bearer " 뒤에 토큰이 들어와요. startsWith("Bearer ")로 앞부분을 확인하고 slice(7)로 그 7글자를 뺀 뒤 토큰을 꺼낼 수 있어요.', 'const tokens = { "mina-token": "mina" };\nconst registered = Object.prototype.hasOwnProperty.call(tokens, "toString");', 'registered는 true인가요, false인가요?', ['false'], 'tokens 안에 직접 넣은 이름은 mina-token 하나예요.', 'toString은 직접 등록하지 않아 false예요.')
  ];
  lessons[6] = [
    item('응답을 못 받았을 때', '요청을 처리했어도 응답이 도중에 끊길 수 있어요. 다시 보내는 같은 요청에는 앞서 저장한 응답을 돌려줘야 한 번만 처리돼요. 키를 사용자·작업 종류·경로와 함께 묶으면 서로 다른 사람의 작업이 섞이지 않아요.', '첫 요청: 주문 1개 생성, 응답 전달 실패\n같은 사용자·키·입력으로 다시 요청', '이 재요청 뒤 주문은 총 몇 개인가요?', ['1'], '새 주문을 만들지 않고 첫 응답을 다시 보내요.', '첫 주문 한 개만 남아요.'),
    item('같은 키인데 내용이 바뀌면', 'JSON.stringify(값)는 객체나 배열을 저장할 문자열로 바꿔요. 여기서는 순서를 정한 입력 객체를 문자열로 만들어 같은 입력인지 비교해요. 같은 키에 다른 내용이 오면 충돌로 거절해요. 이 방법이 모든 객체의 의미상 동등성을 판정하는 것은 아니에요.', 'const signature = JSON.stringify({ count: 2 });\n같은 키로 { count: 3 }을 다시 보냄', '앞선 결과를 그대로 보내나요, 충돌로 거절하나요? 그대로 또는 거절을 적어요.', ['거절'], '키는 같지만 입력 내용은 달라요.', '다른 내용을 같은 요청이라고 취급하지 않고 거절해요.')
  ];
  lessons[7] = [
    item('저장했다가 다시 읽기', 'JSON.parse(문자열)는 저장한 JSON을 값으로 읽어요. 문자열이 깨졌으면 예외가 나요. try { 작업 } catch (error) { 실패 처리 }는 예외를 받는 문법이고 throw new Error("설명")는 잘못된 상태를 예외로 알려요. 복원 실패를 빈 상태로 바꾸지 말고 알리세요. 저장에는 예약뿐 아니라 다음 ID와 재요청 응답도 함께 들어가야 해요. 현재 예약이 없어도 과거 응답에는 사용한 ID가 남을 수 있어요. 이 실습은 다음 ID를 이전에 사용한 모든 ID보다 크게 정해요.', '현재 예약: 없음\n재요청 기록의 예약 ID: 7\n다음 ID의 최소값: ?', '다음 예약이 써야 할 ID의 최소값을 적어요.', ['8'], '이미 응답으로 내보낸 7을 다시 쓰면 다른 예약과 섞여요.', '7보다 큰 8부터 써야 해요.'),
    item('값 하나보다 관계를 확인하기', '복원 검사는 값의 종류와 범위만 확인하는 것으로 끝나지 않아요. 저장된 응답의 주인과 키에 묶인 사용자도 같아야 해요. new Set()은 중복 없는 값의 묶음을 만들고 add(값)는 넣기, has(값)는 이미 담았는지 확인하는 기능이에요. Array.isArray는 배열인지, Number.isSafeInteger는 정확하게 표현할 수 있는 정수인지 확인해요.', '키에 묶인 사용자: 민수\n저장된 응답의 예약 주인: 지수\n둘 다 빈 문자열은 아니에요.', '이 저장 데이터를 받아들이나요? 허용 또는 거절을 적어요.', ['거절'], '각 값은 글자지만 둘의 관계가 맞지 않아요.', '다른 사람의 응답이 섞였으므로 거절해요.'),
    item('이름이 매번 다른 기록 다루기', 'records[key] = value는 변수 key의 이름으로 값을 저장해요. Object.entries(records)는 [키, 값] 쌍들의 배열을 만들어요. for (const [key, value] of 쌍배열)은 각 쌍의 첫 값을 key, 둘째 값을 value로 꺼내요. 저장된 재요청 기록을 하나씩 확인할 때 쓸 수 있어요.', 'const records = {};\nconst key = "first";\nrecords[key] = { status: 201 };\nrecords["second"] = { status: 204 };\nlet count = 0;\nfor (const [name, response] of Object.entries(records)) {\n  count += 1;\n}', '반복이 끝난 count는 얼마인가요?', ['2'], '직접 저장한 키마다 한 번씩 돌아요.', 'first와 second 두 기록이어서 2예요.'),
    item('객체여야 하는 자리 검사하기', 'typeof {}는 "object"예요. 그런데 배열과 null도 typeof 결과가 "object"라서 그것만 확인하면 부족해요. records !== null로 빈 값을 제외하고 !Array.isArray(records)로 배열을 제외해요. 조건을 먼저 확인한 뒤 기록을 순회해야 해요.', 'const records = [];\nconst allowed = typeof records === "object"\n  && records !== null\n  && !Array.isArray(records);', 'allowed는 true인가요, false인가요?', ['false'], '배열은 object로 보이지만 마지막 조건에서 제외돼요.', '배열을 허용하지 않으므로 false예요.')
  ];
  lessons[6].push(item('변수 이름으로 영수증 저장하기', '객체의 속성 이름도 변수에 담을 수 있어요. records[key] = value는 key에 담긴 글자를 이름으로 쓰고 value를 저장해요. 서랍 이름을 정해 영수증을 넣는 것과 같아요. records.key는 글자 key라는 이름을 찾으므로 서로 달라요.', 'const records = {};\nconst key = "first";\nrecords[key] = { status: 201 };\nconst saved = records["first"];', 'saved.status는 얼마인가요?', ['201'], '변수 key의 값은 first예요. first 이름으로 넣은 응답을 다시 꺼내요.', '저장했던 status인 201이에요. 재요청이 오면 이 응답을 다시 보내요.'));
  lessons[8] = [
    item('초안과 현재 상태 나누기', '객체나 배열을 다른 변수에 대입해도 복사본이 생기지는 않아요. 둘이 같은 묶음을 가리켜요. 이 실습의 JSON으로 표현 가능한 예약 데이터는 JSON.parse(JSON.stringify(state))로 별도 초안을 만들 수 있어요. 함수·undefined 등을 포함한 일반 객체에는 이 복사법을 그대로 적용하면 안 돼요.', 'const state = { count: 1 };\nconst draft = state;\ndraft.count = 2;', '마지막 state.count는 얼마인가요?', ['2'], 'draft와 state는 같은 객체를 가리켜요.', '복사하지 않았으므로 state도 2가 돼요.'),
    item('실패하기 전에 공개하지 않기', 'try { 작업 } catch (error) { 실패 처리 }는 예외가 나면 실패 처리로 넘어가요. 저장에 성공한 뒤에만 현재 상태를 초안으로 바꿔요. 계좌 이체 때 출금만 반영하지 않는 것처럼 예약·ID·재요청 기록도 묶어서 지켜요.', '현재 예약 1개\n초안에는 예약 2개\n초안을 저장하는 중 예외 발생', '실패 응답 뒤 현재 예약은 몇 개여야 하나요?', ['1'], '저장 실패한 초안을 현재 상태로 공개하지 않아요.', '저장 전 상태인 1개를 유지해요.')
  ];
  lessons[9] = [
    item('할 일도 함께 저장하기', '아웃박스는 나중에 보낼 알림을 적은 할 일 목록이에요. 예약과 알림을 한 저장안에 넣으면 예약만 저장하고 알림을 잊는 틈을 막아요. sink는 호출할 함수를 입력으로 받는 자리예요. 이런 함수를 콜백이라고 불러요.', '예약 저장 성공\n같은 저장안에 알림 pending 기록\n알림 전송 함수 sink가 예외를 던짐', '알림 기록은 pending인가요, sent인가요?', ['pending'], '보내지 못한 할 일은 목록에 남겨야 해요.', '아직 전송하지 못했으므로 pending이에요.'),
    item('보냈지만 기록을 못 남기면', '전송 성공 뒤 sent 저장에 실패하면 다시 시작한 서버는 전송 여부를 모를 수 있어요. 따라서 같은 ID로 다시 보내고, 받는 쪽도 그 ID로 중복을 구분해야 해요. 저장만으로 외부 전송을 정확히 한 번 보장하는 것은 아니에요.', '전송 성공 → sent 저장 실패 → 재시작\n다음 전송의 이벤트 ID는 이전과 같아야 하나요?', '같음 또는 다름을 적어요.', ['같음'], '새 ID를 만들면 받는 쪽이 같은 알림인지 구분할 수 없어요.', '같은 ID로 다시 보내요.')
  ];
  lessons[10] = [
    item('기다릴 시각 계산하기', 'now는 현재 밀리초를 돌려주는 함수예요. 함수 자체를 전달하면 검사할 때 시계를 바꿀 수 있어요. 1000ms는 1초예요. nextAt 이전에는 건너뛰고 그 시각부터 다시 시도해요.', '첫 실패 시각: 5000ms\n첫 실패 뒤 대기: 1000ms', '다음 시도 가능한 시각은 몇 ms인가요? 숫자만 적어요.', ['6000'], '실패 시각에 대기 시간을 더해요.', '5000 + 1000 = 6000이에요.'),
    item('계속 실패하면 보류하기', 'attempts는 전송을 실제로 시도한 횟수예요. 여기서는 세 번째 실패부터 dead로 옮겨 자동 전송을 멈춰요. replay는 같은 이벤트를 사람이 다시 시도하도록 돌리는 작업이에요.', '현재 attempts: 2, status: pending\n세 번째 전송도 실패', '새 status에 들어갈 단어는 무엇인가요?', ['dead'], '실패 횟수가 정한 상한에 도달했어요.', 'dead로 보류해요.')
  ];
  lessons[11] = [
    item('탐색 범위를 직접 좁히기', 'lo는 후보 범위의 시작, hi는 끝 다음 위치예요. let lo = 0, hi = 4처럼 쉼표로 이름 여러 개를 한 선언에서 만들 수 있어요. 처음 범위는 [0, 배열 길이)예요. 중간 값이 after 이하이면 그 값과 왼쪽은 답이 아니므로 lo = mid + 1로 옮겨요. after보다 크면 그 위치도 답일 수 있어 hi = mid로 옮겨요. lo와 hi가 만나면 시작 위치를 찾은 거예요. Math.floor는 소수 부분을 버려요.', 'const ids = [2, 4, 6, 8], after = 5;\nlet lo = 0, hi = 4;\nconst mid = Math.floor((lo + hi) / 2);\n// mid는 2, ids[mid]는 6이에요.', '이번 비교 뒤 hi에 들어갈 숫자는 무엇인가요?', ['2'], '6은 5보다 커서 위치 2도 후보에 남겨요.', 'hi = mid이므로 2예요. hi = mid - 1로 하면 후보를 놓칠 수 있어요.'),
    item('만날 때까지 반복하기', 'while (조건) { 할 일 }은 조건이 참인 동안 반복해요. <는 미만 비교예요. else는 if 조건이 거짓일 때 실행할 부분이에요. 아래에서 lo와 hi 사이에 후보를 남기고, 매번 범위를 좁혀요. 두 값이 같아지면 반복이 끝나요.', 'const ids = [2, 4, 6, 8];\nconst after = 5;\nlet lo = 0, hi = ids.length;\nwhile (lo < hi) {\n  const mid = Math.floor((lo + hi) / 2);\n  if (ids[mid] <= after) lo = mid + 1;\n  else hi = mid;\n}', '반복이 끝난 lo의 숫자는 무엇인가요?', ['2'], '첫 비교 뒤 hi는 2예요. 다음에는 위치 1의 4가 5 이하라서 lo가 2가 돼요.', 'lo와 hi가 2에서 만나 끝나요. 위치 2의 6이 after 뒤의 첫 값이에요.'),
    item('필요한 개수만 꺼내기', 'for (시작; 계속할 조건; 한 칸 이동)은 위치를 옮기는 반복이에요. i += 1은 다음 위치로 이동해요. 배열 끝에 닿거나 items가 limit개에 도달하면 멈춰요. read(id)는 그 ID의 항목을 돌려주는 제공 함수예요.', 'const ids = [2, 4, 6, 8];\nconst start = 1, limit = 2;\nconst items = [];\nfor (let i = start; i < ids.length && items.length < limit; i += 1) {\n  items.push(read(ids[i]));\n}', 'read는 총 몇 번 호출되나요?', ['2'], '위치 1부터 두 항목만 꺼내고 limit에 도달하면 멈춰요.', 'ID 4와 6을 읽는 두 번이에요.'),
    item('마지막 페이지 확인하기', 'items는 after 다음의 항목을 limit개까지 읽은 목록이에요. 뒤에 더 읽을 항목이 있으면 마지막으로 읽은 ID를 next에 적고, 없으면 null로 끝을 알려요. 빈 배열도 items: [], next: null이에요.', 'ids = [2, 4, 6, 8]\nafter = 4, limit = 2\n읽은 items = [6, 8]', '이 페이지의 next에는 무엇을 넣나요?', ['null'], '8 뒤에는 더 읽을 항목이 없어요.', '마지막 페이지라서 null이에요.')
  ];
  lessons[12] = [
    item('찾아보기도 함께 맞추기', 'Map은 키로 값을 찾는 묶음이에요. new Map()으로 만들고 set(키, 값)으로 넣고 get(키)으로 읽어요. has(키)는 존재 확인이에요. 사용자별 ID 목록과 ID별 예약 맵을 따로 두면 필요한 예약만 꺼낼 수 있어요. IDs.sort((a, b) => a - b)는 ID 배열을 작은 숫자부터 정렬해요. 원본이 바뀐 뒤에는 찾아보기도 맞춰야 해요.', '예약 목록에서 ID 9 취소 성공\n사용자별 ID 목록에는 아직 9가 남음', '이 인덱스는 현재 데이터와 일치하나요? 일치 또는 불일치를 적어요.', ['불일치'], '찾아보기가 이미 삭제된 예약을 가리키고 있어요.', '취소를 반영하도록 인덱스를 갱신해야 해요.'),
    item('빠진 조건과 null 구분하기', '함수의 기본 입력 body = {}는 인자가 빠졌거나 undefined일 때만 적용돼요. null을 명시해서 보내면 null 그대로예요. body || {}는 값이 없을 때 빈 객체를 쓰는 표현이에요. ||는 앞이 참으로 취급되는 값이면 앞값, 아니면 뒷값을 고르는 연산이에요.', 'function read(body = {}) { return body; }\nconst result = read(null);', 'result에는 null과 {} 중 무엇이 들어가나요?', ['null'], 'null을 직접 전달했으므로 기본값으로 바뀌지 않아요.', 'result는 null이에요.')
  ];
  lessons[13] = [
    item('느린 쪽 경계 찾기', 'P95는 응답 시간을 작은 순서로 정렬한 뒤 95% 위치의 값을 고르는 지표예요. 이 실습은 ceil(개수 × 0.95)번째 값을 써요. Math.ceil은 소수를 올리고, 배열 위치는 0부터 세므로 한 칸 빼요. sort((a, b) => a - b)는 숫자를 작은 순서로 정렬해요.', '응답 시간: [10, 20, 30, 100]ms\nceil(4 × 0.95) = 4\n4번째 값 = ?', '이 표본의 P95는 몇 ms인가요?', ['100'], '정렬된 목록의 네 번째 값을 골라요.', '100ms예요. 표본이 적으면 가장 큰 값이 될 수 있어요.'),
    item('비율의 기준 읽기', '5xx는 500~599 상태 코드를 묶어 부르는 말이에요. 이 실습의 successRate는 5xx가 아닌 응답의 비율이에요. 따라서 400도 그 비율에는 포함되지만, 사용자가 원하는 일을 마쳤다는 뜻은 아니에요. 로그에는 토큰이나 이름 대신 요청 종류·상태·시간을 남겨요.', '최근 요청 4건\n상태 코드: 200, 201, 400, 503', '5xx가 아닌 응답은 몇 건인가요?', ['3'], '여기서는 서버 오류인 500대만 빼요.', '503을 뺀 3건이에요.')
  ];
  lessons[14] = [
    item('시간 구간의 끝 포함하기', '사용자별 구간 시작과 횟수를 Map에 담아요. 현재 시각 − 시작 시각이 60000 미만이면 같은 구간, 60000 이상이면 새 구간이에요. 경계가 정확히 같은 때도 확인해야 해요.', '시작: 1000ms\n현재: 61000ms', '같은 구간인가요, 새 구간인가요? 같은 또는 새를 적어요.', ['새'], '시작한 지 정확히 60000ms가 지났어요.', '새 구간이에요.'),
    item('재요청을 먼저 찾는 이유', '이미 처리한 요청에 저장 응답을 보내는 일은 새 변경이 아니에요. 제한을 먼저 적용하면 응답을 못 받은 사람이 자기 예약을 확인하지 못할 수 있어요.', '사용자는 이번 구간 한도를 모두 사용함\n같은 키와 같은 입력의 유효한 재요청이 도착', '저장 응답과 제한 거절 중 무엇을 먼저 하나요? 저장 응답 또는 제한 거절을 적어요.', ['저장 응답'], '중복 확인을 통과한 재전송은 새 변경 횟수로 세지 않아요.', '먼저 저장한 응답을 돌려줘요.')
  ];
  lessons[15] = [
    item('새 칸을 만들되 값은 지키기', '마이그레이션은 저장 데이터를 새 형식으로 옮겨요. note가 없으면 빈 문자열을 추가하고, 이미 있으면 값을 보존해요. {...booking, note: 값}은 속성을 새 객체로 펼친 뒤 note를 정하는 문법이에요. 원본을 바꾸지 않아 이전 판이 계속 읽을 수 있어야 해요.', '기존 예약: { id: 3, note: "창가" }\n새 형식으로 변환', '변환한 note의 글자는 무엇인가요?', ['창가'], '기본값은 기존 값이 없을 때만 써요.', '이미 적힌 창가를 유지해요.'),
    item('형식 이름과 새 값 구분하기', '이 실습의 이전 판도 추가 속성을 읽고 보존할 수 있어요. 그래서 V1 태그로 저장해도 기존 note를 삭제하면 안 돼요. 먼저 V1·V2를 모두 읽는 판을 준비한 뒤 V2 쓰기를 켜요. 이것은 추가 칸을 허용하는 이번 저장 계약이며 모든 형식 변경에 적용되는 규칙은 아니에요.', '새 서버가 V2 데이터를 읽음: note = "문 옆"\n기본 쓰기 버전은 V1', '다시 저장할 때 note는 보존인가요, 삭제인가요?', ['보존'], '형식 태그를 V1로 유지하는 것과 값 삭제는 다른 일이에요.', '문 옆을 보존해요. V2를 쓰기 시작한 뒤에는 V2를 읽는 판으로 복구해야 해요.')
  ];
  lessons[16] = [
    item('살아 있어도 일을 못 받는 경우', 'live는 프로그램이 살아 있는지, ready는 지금 일을 받을 준비가 됐는지예요. 저장소 장애는 ready를 실패시켜 새 요청을 막아요. 준비되면 200, 준비되지 않았으면 503을 반환해요. 두 상태를 같게 처리하면 멀쩡한 프로세스를 불필요하게 다시 시작할 수 있어요.', '프로세스는 실행 중\n저장 폴더 검사 probe는 실패', 'ready의 상태 코드 200 또는 503을 적어요.', ['503'], '살아 있지만 요청을 안전하게 저장할 수 없어요.', '준비되지 않은 상태라서 503이에요.')
  ];
  lessons[17] = [
    item('기대한 결과를 직접 검사하기', 'assert는 조건이 거짓이면 예외를 던져 검사를 실패하게 만드는 함수예요. throw new Error(설명)는 예외를 만드는 문장이에요. factory(options)는 매번 새 서비스를 만드는 함수예요. 시나리오마다 새 서비스를 쓰면 이전 예약이 다음 검사에 섞이지 않아요.', 'const assert = (ok, message) => {\n  if (!ok) throw new Error(message);\n};\nconst result = { status: 201 };', '정상 생성 상태를 검사하는 한 줄을 적어요. 설명은 "생성 실패"로 써요.', ['assert(result.status === 201, "생성 실패");', "assert(result.status === 201, '생성 실패');"], 'assert의 첫 입력에 기대 상태와 같은지 비교하는 식을 넣어요.', 'assert(result.status === 201, "생성 실패");', 'code'),
    item('경계와 실패 뒤의 상태', '정상 입력 하나만으로는 결함을 잡기 어려워요. 정원 바로 아래·정확한 정원·초과 입력을 비교하고, 저장 실패 뒤 예약과 남은 자리가 모두 그대로인지 확인해요. 실패 응답만 맞고 실제 데이터가 바뀌는 결함도 있기 때문이에요.', '정원 5명, 현재 예약 4명\n2명 예약 요청', '자리 부족을 확인하는 데 필요한 것은 성공인가요, 거절인가요?', ['거절'], '요청을 받아들이면 정원이 6명으로 넘쳐요.', '정원을 넘으므로 거절해야 해요.')
  ];

  const normal = (value, mode) => mode === 'code' ? JSON.stringify(String(value).trim().replace(/;\s*$/, '').match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|===|!==|>=|<=|&&|\|\||[^\s]/g) || []) : String(value).trim();
  function accepts(question, value) { return question.answers.some(answer => normal(answer, question.mode) === normal(value, question.mode)); }
  function mount(parent, stage, record, persist) {
    const list = lessons[stage]; if (!list) return;
    const state = record.bridge || (record.bridge = { items: {} });
    if (!state.items || typeof state.items !== 'object') state.items = {};
    const box = document.createElement('details'); box.className = 'service-bridge';
    box.open = !list.every((_, i) => state.items[i]?.passed);
    const title = document.createElement('summary'); box.append(title);
    const panel = document.createElement('div'); panel.className = 'service-bridge-panel'; box.append(panel);
    let index = Number.isInteger(state.index) && state.index >= 0 && state.index < list.length ? state.index : 0;
    function paint() {
      const question = list[index], result = state.items[index] || (state.items[index] = { draft: '', attempts: 0 });
      const count = list.filter((_, i) => state.items[i]?.passed).length;
      title.textContent = '처음이라면, 짧게 연습하고 시작해요 · ' + count + '/' + list.length;
      panel.innerHTML = '<div class="service-bridge-heading"><span class="home-kicker">연결 연습 ' + (index + 1) + '/' + list.length + '</span><h4>' + escHtml(question.title) + '</h4></div><p>' + escHtml(question.text) + '</p><pre><code>' + escHtml(question.code) + '</code></pre><form><label for="service-bridge-input">' + escHtml(question.question) + '</label><input id="service-bridge-input" type="text" maxlength="300" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + escHtml(result.draft || '') + '"><button type="submit">내 답 확인</button></form><p class="service-bridge-status" role="status"></p><button type="button" class="service-bridge-solution">풀이 보기</button><div class="service-bridge-nav"><button type="button" data-bridge-prev ' + (index === 0 ? 'disabled' : '') + '>← 앞 연습</button><button type="button" data-bridge-next ' + (index === list.length - 1 ? 'disabled' : '') + '>다음 연습 →</button></div><small>짧은 답과 표시된 한 줄을 확인하는 연습이에요. 서비스 동작 검사와 완료 기록은 따로 남아요.</small>';
      const input = panel.querySelector('input'), status = panel.querySelector('[role="status"]');
      const show = () => {
        status.textContent = result.revealed ? '풀이를 봤어요. ' + question.solution : result.passed ? (result.independent ? '처음에 풀이 없이 맞혔어요. ' : result.helped ? '풀이를 참고해 고쳤어요. ' : '다시 풀어 맞혔어요. ') + question.solution : result.attempts ? '아직 맞지 않아요. ' + question.feedback : '먼저 예상하거나 한 줄을 써 본 뒤 확인해요.';
      };
      show();
      input.oninput = () => {
        result.draft = input.value;
        if (result.passed && !accepts(question, result.draft)) { result.passed = false; title.textContent = '처음이라면, 짧게 연습하고 시작해요 · ' + list.filter((_, i) => state.items[i]?.passed).length + '/' + list.length; }
        persist();
      };
      panel.querySelector('form').onsubmit = event => {
        event.preventDefault(); result.draft = input.value; result.attempts++;
        result.passed = accepts(question, result.draft); result.revealed = false;
        if (result.passed && result.independent === undefined) result.independent = result.attempts === 1 && !result.helped;
        persist(); show(); title.textContent = '처음이라면, 짧게 연습하고 시작해요 · ' + list.filter((_, i) => state.items[i]?.passed).length + '/' + list.length;
      };
      panel.querySelector('.service-bridge-solution').onclick = () => { result.helped = true; result.revealed = true; result.independent = false; persist(); show(); };
      panel.querySelector('[data-bridge-prev]').onclick = () => { index--; state.index = index; persist(); paint(); };
      panel.querySelector('[data-bridge-next]').onclick = () => { index++; state.index = index; persist(); paint(); };
    }
    paint(); parent.append(box);
  }
  window.ServiceBridges = { mount, lessons, accepts };
})();
