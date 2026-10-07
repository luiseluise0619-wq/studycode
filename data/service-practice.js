/* Compose calls and write assertions against the same service used in the project.
   Practice drafts/results are separate from project files, completion, and XP. */
(function () {
  'use strict';
  const ID = 'reservation-journey';
  const REVISION = 2;
  const lessons = {
    3: {
      title: '예약 두 번 → 목록에서 확인하기',
      text: '식당에서 주문표 두 장을 받은 뒤 주문 목록과 대조해 보는 연습이에요. 같은 서버에 요청을 이어서 보내야 앞의 예약이 남아요. factory()는 예약이 없는 연습용 서버를 새로 만들어 주는 함수예요. 부를 때마다 별도 서버가 생겨요.',
      steps: ['const app = factory();로 서버를 한 번 만들어요.', '서로 다른 이름으로 1명씩 예약하고 두 응답의 status와 body.id를 확인해요.', 'GET /bookings로 목록을 읽고 두 ID가 서로 다르며 목록의 ID와 같은지 검사해요.'],
      hint: 'assert(조건, 설명)는 조건이 거짓이면 검사를 멈춰요. POST 응답은 {status:201, body:{id, name, slot, seats}}예요. 배열의 첫 항목은 [0], 두 번째는 [1]로 읽어요.',
      sample: 'const created = app.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1});\nassert(created.status === 201, "예약 생성 실패");\n// created.body.id를 다음 검사에 그대로 써요.',
      sol: 'const app = factory();\nconst first = app.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1});\nconst second = app.handle("POST", "/bookings", {name:"민수", slot:"10:00", seats:1});\nassert(first.status === 201 && second.status === 201, "두 예약 생성");\nassert(first.body.id !== second.body.id, "서로 다른 ID");\nconst list = app.handle("GET", "/bookings");\nassert(list.status === 200 && list.body.length === 2, "두 예약 보관");\nassert(list.body[0].id === first.body.id, "첫 응답과 목록 ID");\nassert(list.body[1].id === second.body.id, "두 번째 응답과 목록 ID");',
      mutations: [
        { title: '예약마다 같은 ID를 붙이는 결함', from: 'id: draft.nextId++', to: 'id: 1' },
        { title: '조회할 때 예약을 빠뜨리는 결함', from: 'return reply(200, clone(state.bookings));', to: 'return reply(200, []);' },
        { title: '요청이 끝나면 예약을 잊는 결함', from: 'state = draft;', to: 'state = {schema:1,nextId:1,bookings:[],keys:{},events:[]};' }
      ]
    },
    7: {
      title: '재시작과 깨진 저장을 함께 검사하기',
      text: '저장 파일은 잠깐 맡겨 둔 장부예요. 다시 열었을 때 주문과 영수증이 이어져야 해요. 글자 모양만 맞아도 중복 ID나 다른 사람의 영수증이 섞이면 잘못된 장부예요.',
      steps: ['alice-token과 Idempotency-Key로 예약한 뒤 snapshot()을 받아요. factory({snapshot:저장문자열})로 새 서버를 만들고 목록과 같은 요청의 응답을 비교해요.', 'JSON.parse(문자열)로 장부 객체를 꺼내요. 같은 예약을 bookings에 한 번 더 넣은 복사본과 깨진 JSON을 각각 복원해 봐요.', '또 다른 복사본의 keys 기록에서 response.body.owner를 bob으로 바꿔요. 세 가지 잘못된 저장은 모두 예외로 거절해야 해요.'],
      hint: 'snapshot()은 JSON 문자열이에요. JSON.parse는 문자열을 객체로, JSON.stringify는 객체를 문자열로 바꿔요. Object.keys(data.keys)[0]은 첫 재요청 기록의 키예요. try { 할 일 } catch (error) { 예외가 생겼을 때 할 일 }로 거절을 확인해요.',
      sample: 'function rejects(raw) {\n  let rejected = false;\n  try { factory({snapshot:raw}); }\n  catch (error) { rejected = true; }\n  assert(rejected, "잘못된 저장을 받아들였어요");\n}',
      sol: 'const headers = {Authorization:"Bearer alice-token", "Idempotency-Key":"first"};\nconst body = {name:"가은", slot:"10:00", seats:1};\nconst app = factory();\nconst first = app.handle("POST", "/bookings", body, headers);\nassert(first.status === 201, "예약 생성");\nconst raw = app.snapshot();\nconst restored = factory({snapshot:raw});\nsame(restored.handle("GET", "/bookings", null, headers).body, app.handle("GET", "/bookings", null, headers).body, "예약 복원");\nsame(restored.handle("POST", "/bookings", body, headers), first, "재요청 응답 복원");\nfunction rejects(value) {\n  let rejected = false;\n  try { factory({snapshot:value}); } catch (error) { rejected = true; }\n  assert(rejected, "잘못된 저장 거절");\n}\nrejects("{broken");\nconst duplicate = JSON.parse(raw);\nduplicate.bookings.push(duplicate.bookings[0]);\nrejects(JSON.stringify(duplicate));\nconst foreign = JSON.parse(raw);\nconst key = Object.keys(foreign.keys)[0];\nforeign.keys[key].response.body.owner = "bob";\nrejects(JSON.stringify(foreign));\nassert(app.snapshot() === raw, "원래 서버 보존");',
      mutations: [
        { title: '깨진 JSON을 빈 장부로 바꾸는 결함', from: 'let data = JSON.parse(options.snapshot);', to: 'let data = {schema:1,nextId:1,bookings:[],keys:{},events:[]}; try { data = JSON.parse(options.snapshot); } catch (_) {}' },
        { title: '중복 ID를 받아들이는 결함', from: 'ids.has(b.id)', to: 'false' },
        { title: '영수증의 소유자를 확인하지 않는 결함', from: 'b.owner !== scope[0]', to: 'false' },
        { title: '복원한 예약을 버리는 결함', from: 'state = clone(data);', to: 'state = {schema:1,nextId:1,bookings:[],keys:{},events:[]};' }
      ]
    },
    8: {
      title: '저장 실패 전후를 통째로 비교하기',
      text: '카드 결제가 실패했는데 주문 장부에만 주문이 남으면 곤란해요. 실패 응답을 확인한 뒤 장부 전체가 같은지도 비교해 봐요. 예약뿐 아니라 다음 ID와 중복 요청 기록도 함께 지켜야 해요.',
      steps: ['let fail = false;를 두고 factory({save(){...}})로 서버를 만들어요. save 안에서 fail이 참이면 throw new Error("disk");로 저장을 실패시켜요.', '예약 하나를 만든 뒤 snapshot()을 before에 저장해요. fail을 true로 바꾸고 다른 중복 요청 키로 새 예약을 보내요.', '503과 snapshot() === before를 확인해요. 첫 예약의 ID로 DELETE /bookings/ID를 보내고 취소 실패 뒤에도 둘 다 같은지 검사해요.'],
      hint: '저장 함수는 실습에서 제공하는 연결 지점이에요. 실제 디스크를 쓰지 않고 실패를 재현해요. 문자열 전체를 비교하면 bookings·nextId·keys 중 하나만 바뀌어도 잡을 수 있어요. DELETE의 body는 null이고, 네 번째 입력은 인증 헤더예요.',
      sample: 'let fail = false;\nconst app = factory({save() {\n  if (fail) throw new Error("disk");\n}});\n// 정상 예약 후 fail = true;로 바꿔요.',
      sol: 'let fail = false;\nconst app = factory({save() { if (fail) throw new Error("disk"); }});\nconst headers = {Authorization:"Bearer alice-token", "Idempotency-Key":"first"};\nconst body = {name:"가은", slot:"10:00", seats:1};\nconst first = app.handle("POST", "/bookings", body, headers);\nassert(first.status === 201, "처음 저장 성공");\nconst before = app.snapshot();\nfail = true;\nconst failed = app.handle("POST", "/bookings", body, {Authorization:"Bearer alice-token", "Idempotency-Key":"second"});\nassert(failed.status === 503, "예약 저장 실패 응답");\nassert(app.snapshot() === before, "예약 실패 뒤 전체 상태 보존");\nconst cancelled = app.handle("DELETE", "/bookings/" + first.body.id, null, headers);\nassert(cancelled.status === 503, "취소 저장 실패 응답");\nassert(app.snapshot() === before, "취소 실패 뒤 전체 상태 보존");',
      mutations: [
        { title: '저장 전에 현재 상태를 바꾸는 결함', from: 'if (options.save) options.save(serial(draft));', to: 'state = draft; if (options.save) options.save(serial(draft));' },
        { title: '실패 때 다음 ID만 올리는 결함', from: "return reply(503, { error: 'save failed' });", to: "state.nextId++; return reply(503, { error: 'save failed' });" },
        { title: '실패 때 재요청 기록만 바꾸는 결함', from: "return reply(503, { error: 'save failed' });", to: "state.keys = draft.keys; return reply(503, { error: 'save failed' });" }
      ]
    },
    11: {
      title: '페이지 시작·끝·빈 목록을 직접 호출하기',
      text: '책갈피 다음 장부터 읽는데 책갈피가 있는 장을 또 읽으면 한 항목이 겹쳐요. 마지막 장에서는 다음 책갈피를 만들면 안 돼요. 계산을 머릿속에서 끝내지 말고 page를 직접 불러 확인해 봐요.',
      steps: ['이번 factory 자리에는 page 함수가 들어와요. const page = factory;로 이름을 붙이고 read(id)는 {id}를 돌려주는 함수로 만들어요.', '[2,4,6,8]에서 after=0, limit=1이면 items는 [{id:2}], next는 2예요. after=4, limit=1이면 items는 [{id:6}], next는 6이어야 해요.', '같은 목록에서 after=4, limit=2이면 next는 null이에요. 빈 목록도 items:[], next:null인지 검사하고 read 호출 수는 꺼낸 항목 수와 같은지 확인해요.'],
      hint: 'page(ids, after, limit, read)는 {items,next}를 돌려줘요. same(현재값, 기대값, 설명)은 두 배열이나 객체를 JSON으로 비교하는 제공 함수예요. read를 호출할 때마다 let reads에 1을 더하면 불필요한 읽기도 잡을 수 있어요.',
      sample: 'const page = factory;\nlet reads = 0;\nconst read = id => { reads += 1; return {id}; };\nconst result = page([2,4,6,8], 4, 1, read);\n// result와 reads를 함께 검사해요.',
      sol: 'const page = factory;\nlet reads = 0;\nconst read = id => { reads += 1; return {id}; };\nsame(page([2,4,6,8], 4, 1, read), {items:[{id:6}], next:6}, "책갈피 다음부터");\nassert(reads === 1, "필요한 한 항목만 읽기");\nreads = 0;\nsame(page([2,4,6,8], 4, 2, read), {items:[{id:6},{id:8}], next:null}, "마지막 페이지");\nassert(reads === 2, "마지막 두 항목만 읽기");\nreads = 0;\nsame(page([], 0, 2, read), {items:[], next:null}, "빈 목록");\nassert(reads === 0, "빈 목록에서는 읽지 않기");',
      mutations: [
        { title: '책갈피가 가리키는 항목을 다시 읽는 결함', from: 'ids[mid] <= after', to: 'ids[mid] < after' },
        { title: '마지막 페이지에도 다음 책갈피를 주는 결함', from: 'lo + result.length < ids.length', to: 'result.length > 0' },
        { title: '필요 없는 예약까지 읽는 결함', from: 'const result = [];', to: 'ids.forEach(id => read(id)); const result = [];' }
      ]
    },
    13: {
      title: '성공과 실패 응답의 로그를 대조하기',
      text: '병원 접수 장부에 정상 진료만 남으면 문제가 생긴 환자를 찾을 수 없어요. 서버도 성공·입력 오류·없는 경로·저장 장애를 모두 기록해야 원인을 좁힐 수 있어요.',
      steps: ['정상 예약, seats:0인 예약, 없는 경로를 순서대로 보내고 각 응답을 배열에 모아요. 인증은 alice-token을 써요.', 'logs()의 개수와 순서를 확인해요. 각 로그의 id는 같은 순서 응답의 requestId, status는 응답의 status와 같아야 해요.', '별도 서버를 factory({save(){throw new Error("disk");}})로 만들어요. 503 응답도 로그 한 건으로 남는지 확인해요.'],
      hint: 'logs()는 로그 배열을 돌려줘요. for (let i=0; i<responses.length; i+=1)로 같은 위치의 응답과 로그를 비교해요. 정상 예약은 201, 잘못된 입력은 400, 없는 경로는 404, 저장 장애는 503이에요. 별도 서버에는 별도 로그가 쌓여요. 배열.map(r => r.status)는 각 응답에서 status만 꺼낸 새 배열이에요.',
      sample: 'const rows = app.logs();\nfor (let i = 0; i < responses.length; i += 1) {\n  assert(rows[i].id === responses[i].requestId, "응답과 로그 연결");\n}',
      sol: 'const headers = {Authorization:"Bearer alice-token"};\nconst app = factory();\nconst responses = [\n  app.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1}, headers),\n  app.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:0}, headers),\n  app.handle("GET", "/missing", null, headers)\n];\nsame(responses.map(r => r.status), [201,400,404], "세 응답의 상태");\nconst rows = app.logs();\nassert(rows.length === responses.length, "모든 응답 기록");\nfor (let i=0; i<responses.length; i+=1) {\n  assert(typeof responses[i].requestId === "string", "요청 ID 제공");\n  assert(rows[i].id === responses[i].requestId, "응답과 로그 연결");\n  assert(rows[i].status === responses[i].status, "실패 상태도 그대로 기록");\n}\nconst broken = factory({save() { throw new Error("disk"); }});\nconst failed = broken.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1}, headers);\nassert(failed.status === 503, "저장 실패");\nassert(broken.logs().length === 1, "장애 응답 기록");\nassert(broken.logs()[0].id === failed.requestId && broken.logs()[0].status === 503, "장애 로그 연결");',
      mutations: [
        { title: '실패 응답의 로그를 생략하는 결함', from: 'logs.push(log);', to: 'if (result.status < 400) logs.push(log);' },
        { title: '로그와 응답의 요청 ID가 다른 결함', from: 'requestId: log.id', to: 'requestId: "unlinked"' },
        { title: '모든 로그를 성공 상태로 적는 결함', from: 'status: result.status, ms:', to: 'status: 200, ms:' }
      ]
    },
    17: {
      title: '준비 → 요청 → 확인을 한 검사로 묶기',
      text: '테스트 하나는 작은 실험이에요. 실험할 서버를 준비하고, 요청을 보내고, 결과와 남은 상태를 확인해요. 정원·소유자·재요청·저장 장애를 각각 새 서버에서 실험하면 앞의 예약 때문에 결과가 헷갈리지 않아요.',
      steps: ['정원은 시간마다 4명이에요. 같은 서버에 3명과 1명을 예약해 정확히 4명까지 허용되는지 확인한 뒤, 한 명을 더 요청해 409와 상태 보존을 검사해요.', '새 서버에서 alice가 예약해요. bob-token으로 그 ID를 취소하면 404이고 예약은 남아야 해요. alice-token으로 취소하면 204예요.', '또 다른 서버에서 같은 본문과 같은 Idempotency-Key를 가진 요청을 두 번 보내 ID와 예약 개수가 그대로인지 확인해요. 마지막 서버에서는 저장 실패의 503과 snapshot 보존을 검사해요.'],
      hint: '앞의 작은 연습에서 쓴 handle·snapshot·assert를 이어 붙여요. 시나리오마다 factory()를 새로 호출해요. 정원 바로 아래만 검사하면 정확한 정원을 잘못 거절하는 결함을 놓칠 수 있어요. 지금 단계의 GET /bookings는 body.items에 예약 목록을 담아요. 예약 수는 body.items.length로 확인해요.',
      sample: '// 1. 준비\nconst app = factory();\n// 2. 요청\nconst result = app.handle("POST", "/bookings", body, headers);\n// 3. 확인\nassert(result.status === 201, "예약을 받아야 해요");',
      sol: 'const alice = {Authorization:"Bearer alice-token"};\nconst bob = {Authorization:"Bearer bob-token"};\nconst body = {name:"가은", slot:"10:00", seats:3};\nconst capacity = factory();\nassert(capacity.handle("POST", "/bookings", body, alice).status === 201, "3명 허용");\nassert(capacity.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1}, alice).status === 201, "정확히 정원 허용");\nconst full = capacity.snapshot();\nassert(capacity.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1}, alice).status === 409, "정원 초과 거절");\nassert(capacity.snapshot() === full, "거절 뒤 상태 보존");\nconst owned = factory();\nconst first = owned.handle("POST", "/bookings", body, alice);\nassert(first.status === 201, "소유자 검사 준비");\nconst beforeCancel = owned.snapshot();\nassert(owned.handle("DELETE", "/bookings/" + first.body.id, null, bob).status === 404, "남의 예약 취소 거절");\nassert(owned.snapshot() === beforeCancel, "남의 예약 보존");\nassert(owned.handle("DELETE", "/bookings/" + first.body.id, null, alice).status === 204, "내 예약 취소");\nconst retries = factory();\nconst headers = {Authorization:"Bearer alice-token", "Idempotency-Key":"same"};\nconst original = retries.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1}, headers);\nconst repeat = retries.handle("POST", "/bookings", {name:"가은", slot:"10:00", seats:1}, headers);\nassert(original.status === 201 && repeat.status === 201, "재요청 응답");\nsame(repeat.body, original.body, "같은 예약 반환");\nassert(retries.handle("GET", "/bookings", null, alice).body.items.length === 1, "중복 예약 방지");\nconst broken = factory({save() { throw new Error("disk"); }});\nconst before = broken.snapshot();\nassert(broken.handle("POST", "/bookings", body, alice).status === 503, "저장 실패 응답");\nassert(broken.snapshot() === before, "저장 실패 뒤 상태 보존");',
      mutations: [
        { title: '정원 확인을 빼먹은 결함', from: 'if (available(state.bookings, clean.slot) < clean.seats)', to: 'if (false)' },
        { title: '정확한 정원도 거절하는 결함', from: 'available(state.bookings, clean.slot) < clean.seats', to: 'available(state.bookings, clean.slot) <= clean.seats' },
        { title: '소유자 확인을 빼먹은 결함', from: 'b.id === id && b.owner === owner', to: 'b.id === id' },
        { title: '같은 요청을 다시 예약하는 결함', from: 'key !== undefined && state.keys[scoped]', to: 'false' },
        { title: '저장보다 먼저 상태를 바꾸는 결함', from: 'if (options.save) options.save(serial(draft));', to: 'state = draft; if (options.save) options.save(serial(draft));' }
      ]
    }
  };
  Object.assign(lessons, {
    9: {
      title: '예약과 알림을 함께 지키기',
      text: '주문 장부와 배달할 메모를 함께 저장해요. 메모를 전달했어도 전달 완료 표시를 저장하지 못하면 같은 메모를 다시 보낼 수 있어요. 이때 메모 번호까지 바꾸면 받는 쪽이 같은 알림인지 알아볼 수 없어요.',
      steps: ['save(raw)에서 JSON.parse(raw)를 saved에 담아요. 예약을 만들고 저장된 bookings와 events가 각각 한 개인지 확인해요. 이벤트의 id는 "created-" + 예약ID, bookingId는 그 예약ID, type은 "booking.created"예요.', '저장을 실패시키고 새 예약을 보내요. 503이고 snapshot 전체가 그대로인지 확인해요. 이벤트만 따로 남아도 실패예요.', 'flush(event => seen.push(event.id))로 받은 번호를 모아요. 전달 완료 저장을 실패시킨 뒤 저장을 복구하고 다시 flush해요. 같은 ID가 두 번 전달되고 status가 sent로 남아야 해요. 한 번 더 flush해도 전달 수는 늘지 않아야 해요.'],
      hint: 'events()는 이벤트 배열을 반환해요. flush는 sink라는 전달 함수를 받아 이벤트마다 불러요. 여기서는 외부 서버 대신 seen 배열로 받아요. let fail을 save 안에서 읽으면 실행 중에 저장 성공·실패를 바꿀 수 있어요. pending은 아직 보낼 일, sent는 전달 완료를 저장한 일이에요.',
      sample: 'let fail = false, saved;\nconst app = factory({save(raw) {\n  if (fail) throw new Error("disk");\n  saved = JSON.parse(raw);\n}});\nconst seen = [];\n// app.flush(event => seen.push(event.id));',
      sol: 'let fail = false, saved;\nconst app = factory({save(raw) { if (fail) throw new Error("disk"); saved = JSON.parse(raw); }});\nconst h = {Authorization:"Bearer alice-token"};\nconst body = {name:"가은", slot:"10:00", seats:1};\nconst first = app.handle("POST", "/bookings", body, h);\nassert(first.status === 201, "예약 생성");\nassert(saved.bookings.length === 1 && saved.events.length === 1, "예약과 알림 함께 저장");\nconst id = "created-" + first.body.id;\nassert(saved.events[0].id === id && saved.events[0].bookingId === first.body.id && saved.events[0].type === "booking.created", "예약과 이벤트 연결");\nconst before = app.snapshot();\nfail = true;\nassert(app.handle("POST", "/bookings", body, h).status === 503, "새 예약 저장 실패");\nassert(app.snapshot() === before, "예약과 이벤트 전체 보존");\nconst seen = [];\napp.flush(event => seen.push(event.id));\nassert(app.events()[0].status === "pending", "전달 완료 저장 실패");\nfail = false;\napp.flush(event => seen.push(event.id));\napp.flush(event => seen.push(event.id));\nsame(seen, [id,id], "같은 이벤트로 재전송");\nassert(app.events()[0].status === "sent", "전달 완료 저장");',
      mutations: [
        { title: '예약 ID와 알림 ID가 어긋나는 결함', from: "id: 'created-' + booking.id", to: "id: 'created-' + (booking.id + 1)" },
        { title: '저장 장부에서 알림을 빼먹는 결함', from: 'return JSON.stringify(draft);', to: 'return JSON.stringify({...draft, events:[]});' },
        { title: '전달 기록 저장 실패를 성공으로 남기는 결함', from: 'try { publish(draft); } catch (_) { break; }', to: 'try { publish(draft); } catch (_) { state = draft; break; }' }
      ]
    },
    10: {
      title: '기다릴 때·보낼 때·그만둘 때 확인하기',
      text: '문이 닫혔다고 초인종을 계속 누르지 않아요. 다음에 누를 시각을 정하고, 세 번 실패하면 사람이 확인할 목록으로 옮겨요. 실습에서는 시계 숫자만 바꾸므로 실제로 기다릴 필요가 없어요.',
      steps: ['let at=0;과 let calls=0;을 준비해요. factory({now:()=>at})로 서버를 만들고 예약 하나를 넣어요. 전달 함수는 calls를 늘린 뒤 예외를 던지게 해요.', '0ms의 첫 실패 뒤 attempts:1, nextAt:1000을 확인해요. 999ms에서는 보내지 않고 정확히 1000ms에 두 번째로 보내야 해요. 두 번째 실패 뒤 nextAt은 3000이에요.', '2999ms는 건너뛰고 3000ms의 세 번째 실패에서 dead가 돼야 해요. 10000ms에도 자동 전송은 없어야 해요. replay(이벤트ID) 후 같은 ID·pending·attempts:0을 확인하고 성공하는 전달 함수로 마쳐요.'],
      hint: 'now는 현재 시각을 반환하는 제공 함수예요. at=1000;처럼 값을 바꾼 뒤 flush를 부르면 그 시각의 동작을 확인해요. 다음 시각과 정확히 같으면 전송할 수 있어요. replay는 보류한 이벤트를 다시 보낼 목록으로 옮기고 성공하면 true를 반환해요.',
      sample: 'let at = 0, calls = 0;\nconst app = factory({now:()=>at});\nconst offline = () => { calls += 1; throw new Error("offline"); };\n// 예약을 만든 뒤 app.flush(offline);\n// at = 999;로 바꾸고 다시 확인해요.',
      sol: 'let at=0, calls=0;\nconst app=factory({now:()=>at});\nconst made=app.handle("POST","/bookings",{name:"가은",slot:"10:00",seats:1},{Authorization:"Bearer alice-token"});\nassert(made.status===201,"예약 준비");\nconst id="created-"+made.body.id;\nconst offline=()=>{calls+=1;throw new Error("offline");};\napp.flush(offline);\nassert(calls===1 && app.events()[0].attempts===1 && app.events()[0].nextAt===1000,"첫 실패");\nat=999;app.flush(offline);assert(calls===1,"아직 기다리기");\nat=1000;app.flush(offline);assert(calls===2 && app.events()[0].nextAt===3000,"정확한 재시도 시각");\nat=2999;app.flush(offline);assert(calls===2,"두 번째 대기");\nat=3000;app.flush(offline);assert(calls===3 && app.events()[0].status==="dead","세 번 실패 뒤 보류");\nat=10000;app.flush(offline);assert(calls===3,"보류 자동 전송 금지");\nassert(app.replay(id)===true,"보류에서 꺼내기");\nassert(app.events()[0].id===id && app.events()[0].status==="pending" && app.events()[0].attempts===0 && app.events()[0].nextAt===at,"같은 이벤트로 다시 시작");\napp.flush(()=>{});assert(app.events()[0].status==="sent","복구 후 성공");',
      mutations: [
        { title: '정확한 재시도 시각에도 기다리는 결함', from: 'event.nextAt > now()', to: 'event.nextAt >= now()' },
        { title: '세 번 실패해도 보류하지 않는 결함', from: 'target.attempts >= 3', to: 'target.attempts > 3' },
        { title: '다시 보내기에서 이전 실패 횟수를 남기는 결함', from: 'event.attempts = 0;', to: 'event.attempts = 3;' }
      ]
    },
    12: {
      title: '사용자별 목록을 취소·재시작 뒤에도 맞추기',
      text: '도서관의 검색 목록에 반납한 책이 아직 대출 중이라고 남아 있으면 헛걸음하게 돼요. 빠른 조회를 위한 인덱스도 실제 예약과 함께 바뀌어야 해요.',
      steps: ['같은 서버에서 alice와 bob이 각각 예약해요. GET /bookings에 {limit:20,after:0}과 각 사용자의 인증 헤더를 넣고 body.items에 본인 예약만 있는지 확인해요.', 'alice의 응답 ID로 취소해요. alice 목록은 빈 배열, bob 목록은 원래 예약 한 개여야 해요.', 'snapshot으로 새 서버를 만들고 두 목록을 다시 확인해요. 복원한 장부에서도 사용자별 목록을 다시 만들어야 해요.'],
      hint: 'GET /bookings의 응답 body는 {items,next}예요. next:null은 뒤에 더 읽을 항목이 없다는 뜻이에요. DELETE 성공은 204예요. 원본 예약이 맞아도 사용자별 인덱스를 갱신하지 않으면 조회에 빠지거나 남의 항목이 섞일 수 있어요.',
      sample: 'const alice = {Authorization:"Bearer alice-token"};\nconst page = app.handle("GET", "/bookings", {limit:20,after:0}, alice);\n// page.body.items의 ID를 예약 응답과 비교해요.',
      sol: 'const app=factory();\nconst alice={Authorization:"Bearer alice-token"},bob={Authorization:"Bearer bob-token"};\nconst body={name:"가은",slot:"10:00",seats:1};\nconst a=app.handle("POST","/bookings",body,alice),b=app.handle("POST","/bookings",body,bob);\nassert(a.status===201 && b.status===201,"두 사용자 예약");\nconst query={limit:20,after:0};\nsame(app.handle("GET","/bookings",query,alice).body.items.map(row=>row.id),[a.body.id],"내 예약만 조회");\nsame(app.handle("GET","/bookings",query,bob).body.items.map(row=>row.id),[b.body.id],"다른 사용자 별도 조회");\nassert(app.handle("DELETE","/bookings/"+a.body.id,null,alice).status===204,"내 예약 취소");\nsame(app.handle("GET","/bookings",query,alice).body,{items:[],next:null},"취소 뒤 빈 목록");\nconst restored=factory({snapshot:app.snapshot()});\nsame(restored.handle("GET","/bookings",query,alice).body,{items:[],next:null},"복원 뒤 취소 유지");\nsame(restored.handle("GET","/bookings",query,bob).body.items.map(row=>row.id),[b.body.id],"복원 뒤 사용자별 인덱스");',
      mutations: [
        { title: '다른 사용자 예약까지 조회하는 결함', from: 'byOwner.get(owner) || []', to: 'Array.from(byId.keys())' },
        { title: '저장 뒤 인덱스를 갱신하지 않는 결함', from: 'state = draft;\n    reindex();', to: 'state = draft;' },
        { title: '복원 때 인덱스를 만들지 않는 결함', from: '  reindex();\n\n  function serial', to: '  // restored index omitted\n\n  function serial' }
      ]
    },
    14: {
      title: '요청 제한의 사용자·재요청·60초 경계',
      text: '한 사람이 줄을 너무 오래 차지하지 않게 횟수를 제한해요. 이미 처리한 요청의 영수증을 다시 보여 주는 일까지 새 요청으로 세면 복구가 막혀요. 다른 사람의 횟수도 따로 세야 해요.',
      steps: ['now:()=>at, rateLimit:1로 서버를 만들어요. alice가 한 번 예약한 뒤 같은 본문과 같은 키로 다시 보내도 201이어야 해요. 다른 새 요청은 429예요.', '같은 시각에 bob은 첫 예약을 할 수 있어야 해요. 두 사용자의 횟수는 따로 세요.', 'alice의 새 요청을 59999ms에 보내면 429, 정확히 60000ms에 보내면 201인지 확인해요. 60초 구간은 첫 변경 시도 시각부터 세요.'],
      hint: 'rateLimit:1은 한 구간에 새 변경 시도를 한 번 허용한다는 설정이에요. 429는 너무 자주 요청했다는 뜻이에요. 1초는 1000ms라서 60초는 60000ms예요. 같은 키라도 본문이 달라지면 재요청이 아니에요.',
      sample: 'let at=0;\nconst app=factory({now:()=>at,rateLimit:1});\n// at=59999;와 at=60000;에서 같은 새 요청을 비교해요.',
      sol: 'let at=0;\nconst app=factory({now:()=>at,rateLimit:1});\nconst h={Authorization:"Bearer alice-token","Idempotency-Key":"same"};\nconst plain={Authorization:"Bearer alice-token"},bob={Authorization:"Bearer bob-token"};\nconst body={name:"가은",slot:"10:00",seats:1};\nassert(app.handle("POST","/bookings",body,h).status===201,"첫 변경 허용");\nassert(app.handle("POST","/bookings",body,h).status===201,"재요청은 횟수 소모 없음");\nassert(app.handle("POST","/bookings",body,plain).status===429,"새 변경 제한");\nassert(app.handle("POST","/bookings",body,bob).status===201,"사용자별 횟수");\nat=59999;assert(app.handle("POST","/bookings",body,plain).status===429,"60초 직전");\nat=60000;assert(app.handle("POST","/bookings",body,plain).status===201,"정확히 60초에 새 구간");',
      mutations: [
        { title: '60초 경계를 이전 구간에 넣는 결함', from: 'at - old.start < 60000', to: 'at - old.start <= 60000' },
        { title: '허용 횟수보다 한 번 더 받는 결함', from: 'bucket.count >= (options.rateLimit || 100)', to: 'bucket.count > (options.rateLimit || 100)' },
        { title: '다른 사용자의 횟수를 함께 읽는 결함', from: 'rates.get(owner)', to: 'rates.get("alice")' },
        { title: '재요청을 새 변경으로 세는 결함', from: 'if (key !== undefined && state.keys[scoped]) {', to: 'if (key !== undefined && state.keys[scoped] && admit(owner)) {' }
      ]
    },
    15: {
      title: '저장 형식을 바꾸며 원본과 메모 지키기',
      text: '장부에 메모 칸을 새로 만들어도 원래 장부를 지우거나 이미 적은 메모를 없애면 안 돼요. 바뀐 결과와 원본을 나란히 비교해 봐요.',
      steps: ['이번 factory 자리에는 migrate 함수가 들어와요. const migrate=factory;로 받아요. V1 장부 객체를 만들고 바꾸기 전 JSON 문자열을 보관해요.', 'migrate(장부) 결과는 새 V2 객체여야 해요. note가 없던 예약에는 빈 문자열, 이미 메모가 있던 예약에는 같은 메모가 있어야 해요. 원본의 JSON 문자열은 그대로여야 해요.', '같은 장부를 JSON 문자열로도 넣어 같은 결과가 나오는지 확인해요. 이미 V2인 결과를 한 번 더 바꿔도 같아야 해요. 반환된 메모를 고친 뒤에도 원본 장부가 바뀌지 않는지 확인해요.'],
      hint: 'V1 장부는 {schema:1,nextId,bookings,keys,events}예요. bookings의 예약은 {id,owner,name,slot,seats}이고 note를 추가할 수 있어요. V2는 schema:2예요. migrate는 객체와 JSON 문자열 모두 받지만 반환값은 객체예요. same은 배열과 객체의 값을 비교하는 제공 함수예요.',
      sample: 'const migrate=factory;\nconst old={schema:1,nextId:2,bookings:[{id:1,owner:"alice",name:"가은",slot:"10:00",seats:1}],keys:{},events:[]};\nconst before=JSON.stringify(old);\n// const next=migrate(old); 뒤에 원본과 결과를 검사해요.',
      sol: 'const migrate=factory;\nconst old={schema:1,nextId:3,bookings:[{id:1,owner:"alice",name:"가은",slot:"10:00",seats:1},{id:2,owner:"bob",name:"민수",slot:"14:00",seats:1,note:"창가"}],keys:{},events:[]};\nconst before=JSON.stringify(old);\nconst next=migrate(old);\nassert(typeof next==="object" && next!==null && next.schema===2,"새 V2 객체");\nassert(next.bookings[0].note==="" && next.bookings[1].note==="창가","새 칸과 기존 메모");\nassert(next.nextId===3 && next.bookings[0].id===1 && next.bookings[1].id===2,"ID 보존");\nassert(JSON.stringify(old)===before,"원본 보존");\nsame(migrate(before),next,"문자열 입력도 같은 결과");\nsame(migrate(next),next,"V2를 다시 바꿔도 유지");\nnext.bookings[1].note="수정";\nassert(JSON.stringify(old)===before,"독립 복사");',
      mutations: [
        { title: '원본 장부를 직접 바꾸는 결함', from: 'const next = JSON.parse(JSON.stringify(old));', to: 'const next = old;' },
        { title: '기존 메모를 지우는 결함', from: "note: typeof b.note === 'string' ? b.note : ''", to: "note: ''" },
        { title: '객체 대신 문자열을 돌려주는 결함', from: 'return next;', to: 'return JSON.stringify(next);' }
      ]
    },
    16: {
      title: '살아 있음과 요청 받을 준비를 따로 확인하기',
      text: '가게 불은 켜져 있어도 냉장고가 고장 나면 주문을 받기 어려워요. 프로그램이 살아 있는지와 안전하게 일을 받을 수 있는지는 서로 다른 질문이에요.',
      steps: ['probe:()=>false인 서버에서 토큰 없이 live와 ready를 읽어요. live는 200·live:true, ready는 503·ready:false여야 해요.', 'probe가 true인 서버와 probe를 주지 않은 서버는 ready가 200·ready:true인지 확인해요.', 'probe 안에서 예외를 던지는 서버도 ready는 503·ready:false여야 해요. 저장소 검사 실패 때문에 live까지 실패하면 안 돼요.'],
      hint: 'GET /health/live와 GET /health/ready는 인증 없이 볼 수 있는 제공 경로예요. probe는 저장소를 사용할 수 있는지 확인하는 제공 함수예요. 이 실습에서는 true·false·예외로 세 상황을 재현해요.',
      sample: 'const down=factory({probe:()=>false});\nconst live=down.handle("GET","/health/live");\nconst ready=down.handle("GET","/health/ready");\n// status와 body의 참·거짓을 함께 확인해요.',
      sol: 'const down=factory({probe:()=>false});\nconst live=down.handle("GET","/health/live"),ready=down.handle("GET","/health/ready");\nassert(live.status===200 && live.body.live===true,"프로세스 생존");\nassert(ready.status===503 && ready.body.ready===false,"준비 실패");\nfor(const app of [factory({probe:()=>true}),factory()]) {\n  const response=app.handle("GET","/health/ready");\n  assert(response.status===200 && response.body.ready===true,"준비 성공과 기본값");\n}\nconst broken=factory({probe(){throw new Error("disk");}});\nconst failure=broken.handle("GET","/health/ready");\nassert(failure.status===503 && failure.body.ready===false,"검사 예외");\nassert(broken.handle("GET","/health/live").status===200,"저장소 장애에도 프로세스 생존");',
      mutations: [
        { title: '준비 실패를 성공으로 바꾸는 결함', from: 'ready = options.probe() === true;', to: 'ready = true;' },
        { title: '검사 예외를 준비 성공으로 바꾸는 결함', from: 'catch (_) { ready = false; }', to: 'catch (_) { ready = true; }' },
        { title: '저장소 장애와 프로세스 생존을 함께 실패시키는 결함', from: "return reply(200, { live: true });", to: "return reply(503, { live: false });" }
      ]
    },
    18: {
      title: '취소 → 재전송 → 저장 실패 → 재시작',
      text: '예약할 때 받은 영수증과 취소할 때 받은 영수증은 달라요. 같은 취소가 다시 와도 이미 취소한 결과를 돌려주고, 취소 알림을 새로 만들지 않아야 해요. 앞에서 배운 저장과 재요청 규칙을 취소에도 옮겨 봐요.',
      steps: ['같은 중복 요청 키로 예약을 만들고 그 ID를 취소해요. POST와 DELETE는 서로 다른 작업이라 각각의 기록이 있어야 해요. 취소와 같은 취소 재전송은 모두 204이고 body는 null이어야 해요.', 'events()에서 booking.cancelled인 항목만 filter로 모아요. 한 개이며 id는 "cancelled-"+예약ID, bookingId는 원래 예약ID여야 해요. 저장 keys의 취소 기록은 아래 표의 키·서명·응답과 같은지 확인해요.', 'snapshot으로 새 서버를 만든 뒤 같은 취소를 다시 보내도 204와 알림 한 개를 유지하는지 확인해요. 별도 서버에서는 저장을 실패시켜 취소 응답 503과 snapshot 전체 보존을 검사하고, 저장을 복구한 뒤 같은 키로 다시 취소해요.'],
      hint: 'DELETE의 body는 null이에요. JSON.stringify(null)은 문자열 "null"을 반환해요. keys의 속성 이름은 JSON.stringify([사용자ID,메서드,실제경로,중복요청키])로 만들어요. 사용자ID는 토큰 문자열이 아닌 alice예요. 로그의 requestId는 호출마다 달라지므로 재요청은 status와 body를 비교해요. 풀이 코드를 열면 마지막 확장은 도움받아 진행한 기록으로 남아요.',
      sample: 'const path="/bookings/"+created.body.id;\nconst cancelled=app.handle("DELETE",path,null,headers);\n// 같은 요청을 다시 보내고 snapshot으로 재시작해 봐요.',
      comparison: {
        headers: ['비교할 것', '예약 · POST', '취소 · DELETE'],
        entries: [['경로', '/bookings', '/bookings/예약ID'], ['본문', '{name,slot,seats}', 'null'], ['기억하는 키', '[사용자,"POST",경로,요청키]', '[사용자,"DELETE",실제경로,요청키]'], ['서명', 'name 양끝 공백을 뺀 {name,slot,seats}의 JSON', 'JSON.stringify(null)'], ['기억하는 응답', '201 · 예약 객체', '204 · null'], ['이벤트', 'created-ID · booking.created', 'cancelled-ID · booking.cancelled']]
      },
      sol: 'const h={Authorization:"Bearer alice-token","Idempotency-Key":"shared"};\nconst body={name:"가은",slot:"10:00",seats:1};\nconst app=factory();\nconst made=app.handle("POST","/bookings",body,h);\nassert(made.status===201,"예약 생성");\nconst id=made.body.id,path="/bookings/"+id;\nconst cancelled=app.handle("DELETE",path,null,h);\nassert(cancelled.status===204 && cancelled.body===null,"첫 취소");\nassert(app.handle("DELETE",path,null,h).status===204,"같은 취소 재전송");\nfunction oneEvent(server) {\n  const rows=server.events().filter(e=>e.type==="booking.cancelled");\n  assert(rows.length===1 && rows[0].id==="cancelled-"+id && rows[0].bookingId===id,"취소 이벤트 하나");\n}\noneEvent(app);\nconst data=JSON.parse(app.snapshot());\nconst key=JSON.stringify(["alice","DELETE",path,"shared"]);\nassert(data.keys[key]!==undefined,"DELETE 키 범위");\nassert(data.keys[key].signature===JSON.stringify(null),"취소 서명");\nsame(data.keys[key].response,{status:204,body:null},"취소 영수증");\nconst restarted=factory({snapshot:app.snapshot()});\nassert(restarted.handle("DELETE",path,null,h).status===204,"재시작 뒤 취소 재전송");\noneEvent(restarted);\nlet fail=false;\nconst broken=factory({save(){if(fail)throw new Error("disk");}});\nconst booked=broken.handle("POST","/bookings",body,h);\nassert(booked.status===201,"실패 검사 준비");\nconst target="/bookings/"+booked.body.id,before=broken.snapshot();\nfail=true;\nassert(broken.handle("DELETE",target,null,h).status===503,"취소 저장 실패");\nassert(broken.snapshot()===before,"예약·키·이벤트 전체 보존");\nfail=false;\nassert(broken.handle("DELETE",target,null,h).status===204,"저장 복구 뒤 같은 키로 취소");',
      mutations: [
        { title: '같은 취소의 영수증을 잊는 결함', from: 'if (key !== undefined && state.keys[scoped]) return clone(state.keys[scoped].response);', to: 'if (false) return clone(state.keys[scoped].response);' },
        { title: '취소 기록을 POST로 기억하는 결함', from: "JSON.stringify([owner, 'DELETE', path, key])", to: "JSON.stringify([owner, 'POST', path, key])" },
        { title: '취소 이벤트의 예약 ID를 바꾸는 결함', from: "id: 'cancelled-' + id", to: "id: 'cancelled-' + (id + 1)" },
        { title: '취소 저장 전에 상태를 바꾸는 결함', from: 'if (options.save) options.save(serial(draft));', to: 'state = draft; if (options.save) options.save(serial(draft));' },
        { title: '재시작 때 재요청 기록을 버리는 결함', from: 'state = clone(data);', to: 'state = clone(data); state.keys = {};' }
      ]
    }
  });
  const authHint = ' 인증 헤더는 {Authorization:"Bearer alice-token"}이고 bob은 "Bearer bob-token"을 써요. 같은 요청을 기억하게 하려면 여기에 "Idempotency-Key":"first" 같은 항목을 더해요. 헤더 객체는 handle(method, path, body, headers)의 네 번째 입력이에요.';
  for (const stage of [7, 8, 9, 10, 12, 13, 14, 17, 18]) lessons[stage].hint += authHint;
  lessons[3].hint += ' 이 단계의 GET /bookings는 {status:200, body:[예약객체, 예약객체]}로 답해요. 목록은 응답.body에서 읽어요.';
  lessons[3].steps.push('GET /slots도 읽어요. 시간마다 정원은 4명이므로 10:00에 1명씩 두 번 예약한 뒤에는 remaining:2, 다른 시간 14:00은 remaining:4여야 해요.');
  lessons[3].sol += '\nconst slots=app.handle("GET","/slots");\nassert(slots.status===200,"자리 조회");\nsame(slots.body,[{slot:"10:00",remaining:2},{slot:"14:00",remaining:4}],"예약을 반영한 남은 자리");';
  lessons[3].mutations.push({ title: '예약을 남은 자리에 반영하지 않는 결함', from: 'available(state.bookings, slot)', to: 'available([], slot)' });
  lessons[7].hint += ' 이 단계의 GET /bookings도 {status:200, body:[예약객체]}로 답해요. 재요청은 같은 body와 같은 인증·중복 요청 키를 다시 보내는 뜻이에요.';
  lessons[7].hint += ' 저장 객체의 bookings는 예약 배열이고, keys[key]는 {signature,response:{status,body:예약객체}}예요. JSON.parse(raw)를 부를 때마다 독립 객체를 만들어요. duplicate.bookings.push(duplicate.bookings[0])은 첫 예약을 한 번 더 넣어요. foreign.keys[key].response.body.owner = "bob";은 저장된 응답의 소유자를 바꾸는 문장이에요.';
  lessons[11].sol = lessons[11].sol.replace('same(page([2,4,6,8], 4, 1, read)', 'same(page([2,4,6,8], 0, 1, read), {items:[{id:2}], next:2}, "첫 페이지");\nassert(reads === 1, "첫 항목만 읽기");\nreads = 0;\nsame(page([2,4,6,8], 4, 1, read)');
  lessons[11].steps.push('after=8이면 이미 마지막 ID까지 읽었으므로 items:[], next:null이고 read 호출도 0회여야 해요.');
  lessons[11].sol += '\nreads=0;\nsame(page([2,4,6,8],8,2,read),{items:[],next:null},"끝까지 읽은 뒤");\nassert(reads===0,"끝 뒤에는 읽지 않기");';
  lessons[11].mutations.push({ title: '끝에 닿으면 첫 페이지로 돌아가는 결함', from: 'const result = [];', to: 'if (lo === ids.length && ids.length) lo = 0; const result = [];' });
  lessons[8].steps[2] = '503과 snapshot() === before를 확인해요. 첫 예약의 ID로 DELETE /bookings/ID를 보내고, 취소 응답도 503이며 snapshot도 before와 같은지 검사해요.';
  lessons[7].seed = 'const headers={Authorization:"Bearer alice-token","Idempotency-Key":"first"};\nconst body={name:"가은",slot:"10:00",seats:1};\nconst app=factory();\nconst first=app.handle("POST","/bookings",body,headers);\nassert(first.status===201,"검사할 예약 준비");\nconst raw=app.snapshot();\nconst restored=factory({snapshot:raw});\n// 1. restored의 예약 목록과 같은 요청의 응답을 비교해요.\n\n// 이 함수는 잘못된 장부가 예외로 거절되는지 확인하는 제공 틀이에요.\nfunction rejects(value) {\n  let rejected=false;\n  try { factory({snapshot:value}); } catch (error) { rejected=true; }\n  assert(rejected,"잘못된 저장 거절");\n}\n// 2. rejects("{broken");를 호출해요.\nconst duplicate=JSON.parse(raw);\n// duplicate에 첫 예약을 한 번 더 넣고 rejects로 검사해요.\nconst foreign=JSON.parse(raw);\nconst key=Object.keys(foreign.keys)[0];\n// 3. 저장 응답의 owner를 bob으로 바꾸고 rejects로 검사해요.';
  lessons[7].text += ' 입력 칸에 예약 준비와 예외 확인 함수를 넣어 두었어요. 먼저 정상 복원 비교, 다음은 중복 예약 검사, 마지막은 소유자 검사 순서로 빈 곳을 채워요.';
  lessons[9].seed = lessons[9].sample.replace('// app.flush(event => seen.push(event.id));', 'const headers={Authorization:"Bearer alice-token"};\nconst body={name:"가은",slot:"10:00",seats:1};\nconst made=app.handle("POST","/bookings",body,headers);\n// 1. saved의 예약과 이벤트를 비교해요.\n// 2. snapshot을 보관하고 fail=true로 새 예약을 거절시켜요.\n// 3. flush로 보낸 ID와 전달 완료 저장의 실패·복구를 확인해요.');
  lessons[10].seed = lessons[10].sample.replace('// 예약을 만든 뒤 app.flush(offline);\n// at = 999;로 바꾸고 다시 확인해요.', 'const made=app.handle("POST","/bookings",{name:"가은",slot:"10:00",seats:1},{Authorization:"Bearer alice-token"});\nconst id="created-"+made.body.id;\n// 1. app.flush(offline); 뒤 첫 실패 상태를 확인해요.\n// 2. at를 999·1000·2999·3000으로 바꾸며 호출 수와 상태를 확인해요.\n// 3. 보류 뒤 replay(id)와 성공하는 flush를 확인해요.');
  lessons[12].seed = 'const app=factory();\nconst alice={Authorization:"Bearer alice-token"},bob={Authorization:"Bearer bob-token"};\nconst body={name:"가은",slot:"10:00",seats:1},query={limit:20,after:0};\nconst a=app.handle("POST","/bookings",body,alice);\nconst b=app.handle("POST","/bookings",body,bob);\n// 1. 사용자별 GET 응답의 body.items를 비교해요.\n// 2. a.body.id를 취소한 뒤 두 목록을 확인해요.\n// 3. snapshot으로 복원한 서버에서도 두 목록을 확인해요.';
  lessons[14].seed = lessons[14].sample.replace('// at=59999;와 at=60000;에서 같은 새 요청을 비교해요.', 'const alice={Authorization:"Bearer alice-token","Idempotency-Key":"same"};\nconst bob={Authorization:"Bearer bob-token"};\nconst plain={Authorization:"Bearer alice-token"};\nconst body={name:"가은",slot:"10:00",seats:1};\n// 1. 첫 예약·재요청·새 요청의 상태 코드를 비교해요.\n// 2. bob의 첫 예약이 가능한지 확인해요.\n// 3. at=59999;와 at=60000;에서 같은 새 요청을 비교해요.');
  lessons[15].seed = 'const migrate=factory;\nconst old={schema:1,nextId:3,bookings:[\n  {id:1,owner:"alice",name:"가은",slot:"10:00",seats:1},\n  {id:2,owner:"bob",name:"민수",slot:"14:00",seats:1,note:"창가"}\n],keys:{},events:[]};\nconst before=JSON.stringify(old);\nconst next=migrate(old);\n// 1. schema·note·ID와 원본 보존을 확인해요.\n// 2. 문자열 입력과 이미 V2인 입력도 확인해요.\n// 3. 반환된 note를 고친 뒤 원본과 before를 비교해요.';
  lessons[16].seed = lessons[16].sample + '\n// probe가 true일 때와 생략됐을 때도 새 서버로 확인해요.\n// 마지막으로 예외를 던지는 probe를 만들어 ready와 live를 확인해요.';
  lessons[13].steps.push('저장 함수 안에서 시계를 5ms 늘려 보세요. 실패 로그의 ms는 5, P95도 5예요. 로그 문자열에는 토큰과 이름이 없어야 해요. 요청 시작에서 299999ms 뒤에는 지표에 남고 정확히 300000ms 뒤에는 빠져야 해요.');
  lessons[13].hint += ' P95는 시간을 정렬한 뒤 95% 위치의 값이에요. 한 건만 있으면 그 한 건의 시간이 P95예요. 5분은 300000ms예요. metrics()의 {requests,errors,successRate,p95}는 현재 시각에서 요청 시작 시각을 뺀 값이 300000보다 작은 로그만 계산해요. JSON 문자열의 includes(글자)는 그 글자가 들어 있는지 확인해요.';
  lessons[13].sol += '\nconst logText=JSON.stringify(rows);\nassert(!logText.includes("alice-token") && !logText.includes("가은"),"로그 개인정보 제외");\nlet at=0;\nconst timed=factory({now:()=>at,save(){at+=5;throw new Error("disk");}});\nassert(timed.handle("POST","/bookings",{name:"가은",slot:"10:00",seats:1},headers).status===503,"시간 검사 준비");\nassert(timed.logs()[0].ms===5,"로그 응답 시간");\nsame(timed.metrics(),{requests:1,errors:1,successRate:0,p95:5},"장애 지표");\nat=299999;assert(timed.metrics().requests===1,"5분 직전");\nat=300000;same(timed.metrics(),{requests:0,errors:0,successRate:1,p95:0},"정확히 5분에 제외");';
  lessons[13].mutations.push(
    { title: '로그에 토큰과 이름을 남기는 결함', from: 'logs.push(log);', to: 'log.token=headers && headers.Authorization; log.name=body && body.name; logs.push(log);' },
    { title: '정확히 5분 전 로그를 지표에 넣는 결함', from: 'now() - log.at < 300000', to: 'now() - log.at <= 300000' }
  );
  function source(body) {
    return 'const assert = (condition, message) => { if (!condition) throw new Error(message); };\n' +
      'const same = (actual, expected, message) => assert(JSON.stringify(actual) === JSON.stringify(expected), message);\n' +
      'function verify(factory) {\n' + body + '\n}\nmodule.exports = { verify };';
  }
  function seed(stage) { return source(lessons[stage].seed || '// 위의 순서대로 요청과 assert를 작성해요.\n// 이 파일의 verify 본문만 고치면 돼요.'); }
  function build(stage, draft) {
    const lesson = lessons[stage], refs = BUILD_SOL[ID][stage - 1];
    const files = { ...refs, 'logic.js': refs['app.js'], 'app.js': draft };
    const ref = stage === 11 ? refs['query.js'] : stage === 15 ? refs['migration.js'] : refs['service.js'].replace(/require\(['"]\.\/app['"]\)/g, "require('./logic')");
    files['fixture.js'] = ref;
    const exported = stage === 11 ? 'page' : stage === 15 ? 'migrate' : 'createService';
    const tests = [{ n: '정상 동작을 받아들여요', c: 'A.verify(require("./fixture").' + exported + ');' }];
    lesson.mutations.forEach((mutation, i) => {
      if (!ref.includes(mutation.from)) throw new Error('연습 기준 코드가 바뀌었어요. 페이지를 새로고침해 주세요.');
      const name = 'fixture-' + i;
      files[name + '.js'] = ref.split(mutation.from).join(mutation.to);
      tests.push({ n: mutation.title, c: 'let caught=false; try { A.verify(require("./' + name + '").' + exported + '); } catch (error) { caught=true; } ok(caught, "이 결함을 찾아내는 요청과 assert가 필요해요.");' });
    });
    return { files, tests };
  }
  let active = null;
  function stop() {
    const old = active; active = null;
    if (!old) return;
    clearTimeout(old.timer); old.worker.terminate(); URL.revokeObjectURL(old.url);
    old.state.running = false;
  }
  function mount(parent, stage, record, persist, onHelp) {
    const lesson = lessons[stage]; if (!lesson) return;
    const state = record.practice || (record.practice = { draft: seed(stage), attempts: 0 });
    state.running = false;
    if (typeof state.draft !== 'string') state.draft = seed(stage);
    if (state.signature !== state.draft || state.revision !== REVISION) {
      if (state.passed) state.message = '검사할 상황을 보강했어요. 작성한 코드는 보관했고 다시 실행하면 돼요.';
      state.passed = false; state.independent = false; delete state.rows;
    }
    const box = document.createElement('details'); box.className = 'service-practice';
    box.innerHTML = '<summary>연결해서 직접 검사하기 · ' + escHtml(lesson.title) + '</summary><div class="service-practice-body"><p>' + escHtml(lesson.text) + '</p><ol>' + lesson.steps.map(text => '<li>' + escHtml(text) + '</li>').join('') + '</ol><p>' + escHtml(lesson.hint) + '</p><pre>' + escHtml(lesson.sample) + '</pre><label for="service-practice-code">내 검사 코드 · verify 본문을 채워요</label><textarea id="service-practice-code" spellcheck="false" autocapitalize="off"></textarea><div class="service-practice-actions"><button type="button" data-practice-run>내 검사 실행</button><button type="button" data-practice-stop hidden>실행 멈추기</button><button type="button" data-practice-solution>풀이 코드 보기</button></div><p class="service-practice-status" role="status" aria-live="polite"></p><ul class="service-practice-results"></ul><p class="study-muted">완성된 연습용 서버에 내 검사를 실행해요. 아래 프로젝트 파일과 단계 완료 기록은 별도로 확인해요.</p></div>';
    if (lesson.comparison) {
      const table = document.createElement('div'); table.className = 'service-comparison';
      table.innerHTML = '<table><caption>예약과 취소의 기록을 비교해요</caption><thead><tr>' + lesson.comparison.headers.map(text => '<th scope="col">' + escHtml(text) + '</th>').join('') + '</tr></thead><tbody>' + lesson.comparison.entries.map(row => '<tr>' + row.map((text, i) => i === 0 ? '<th scope="row">' + escHtml(text) + '</th>' : '<td>' + escHtml(text) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
      box.querySelector('ol').before(table);
    }
    const input = box.querySelector('textarea'), status = box.querySelector('.service-practice-status'), results = box.querySelector('.service-practice-results');
    const runButton = box.querySelector('[data-practice-run]'), stopButton = box.querySelector('[data-practice-stop]');
    input.value = state.draft;
    function paint() {
      runButton.disabled = !!state.running || !!(BL && BL.running); stopButton.hidden = !state.running;
      status.textContent = state.running ? '코드를 실행하고 있어요…' : state.message || (state.passed ? (state.helped ? '풀이를 참고해 모든 결함을 찾았어요.' : '내 검사로 정상 동작과 모든 결함을 확인했어요.') : '요청을 이어 보내고, 기대한 결과를 assert로 확인해 보세요.');
      results.innerHTML = (state.rows || []).map(row => '<li class="' + (row.ok ? 'passed' : 'failed') + '"><b>' + (row.ok ? '✓ ' : '다시 확인 · ') + escHtml(row.n) + '</b>' + (row.err ? '<span>' + escHtml(row.err) + '</span>' : '') + '</li>').join('');
    }
    input.oninput = () => {
      stop(); state.draft = input.value; state.passed = false; state.independent = false; delete state.rows; delete state.signature; delete state.message; persist(); paint();
    };
    function report(run, rows) {
      if (active !== run) return;
      const current = box.isConnected && input.value === run.draft;
      stop(); if (!current) return;
      state.rows = rows; state.signature = run.draft; state.revision = REVISION; state.passed = rows.length === run.tests.length && rows.every(row => row.ok);
      if (state.passed) state.independent = !state.helped;
      delete state.message; persist(); paint();
    }
    runButton.onclick = () => {
      stop(); state.draft = input.value; state.attempts = (Number(state.attempts) || 0) + 1;
      state.passed = false; delete state.rows; delete state.signature; delete state.message;
      let plan, url, worker;
      try {
        plan = build(stage, state.draft);
        url = URL.createObjectURL(new Blob([BuildWorker.workerSource(buildDoc(plan.files, plan.tests))], { type: 'text/javascript' }));
        worker = new Worker(url);
      } catch (error) {
        if (url) URL.revokeObjectURL(url);
        state.message = '실행을 시작하지 못했어요. ' + error.message; persist(); paint(); return;
      }
      state.running = true;
      const run = active = { worker, url, state, tests: plan.tests, draft: state.draft, timer: null };
      const failures = message => plan.tests.map(test => ({ n: test.n, ok: false, err: message }));
      worker.onmessage = event => {
        const data = event.data;
        if (data?.__cr === 'build' && Array.isArray(data.res) && data.res.length === plan.tests.length && data.res.every((row, i) => row && row.n === plan.tests[i].n && typeof row.ok === 'boolean' && (row.err === undefined || typeof row.err === 'string'))) report(run, data.res);
      };
      worker.onerror = event => { event.preventDefault(); report(run, failures('문법과 함수 이름을 확인해 주세요. ' + event.message)); };
      worker.onmessageerror = () => report(run, failures('실행 결과를 읽지 못했어요. 다시 실행해 주세요.'));
      run.timer = setTimeout(() => report(run, failures('5초 안에 끝나지 않았어요. 반복이 끝나는 조건을 확인해 주세요.')), BuildWorker.timeout);
      persist(); paint();
    };
    stopButton.onclick = () => { stop(); state.message = '실행을 멈췄어요. 코드를 고치고 다시 검사해 보세요.'; persist(); paint(); };
    function showSolution() {
      let solution = box.querySelector('.service-practice-solution');
      if (!solution) { solution = document.createElement('pre'); solution.className = 'service-practice-solution'; solution.textContent = source(lesson.sol); results.after(solution); }
      solution.hidden = !state.revealed;
    }
    box.querySelector('[data-practice-solution]').onclick = () => {
      state.helped = true; state.independent = false; state.revealed = !state.revealed;
      if (stage === 18) record.helpUsed = true;
      persist(); showSolution(); paint();
      if (onHelp) onHelp();
    };
    if (state.revealed) showSolution();
    paint(); parent.append(box);
  }
  // Dispose of detached runs before project navigation or grading rebuilds the UI.
  for (const name of ['blRender', 'blOpen', 'blApplyDayFiles', 'blRenderList', 'closeBuildLab']) {
    const core = window[name]; window[name] = function () { stop(); return core.apply(this, arguments); };
  }
  if ($('bl-quit')) $('bl-quit').onclick = closeBuildLab;
  if ($('bl-menu')) $('bl-menu').onclick = blRenderList;
  window.ServicePractice = { lessons, seed, source, build, mount, stop, active: () => !!active };
})();
