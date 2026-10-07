/* Compose calls and write assertions against the same service used in the project.
   Practice drafts/results are separate from project files, completion, and XP. */
(function () {
  'use strict';
  const ID = 'reservation-journey';
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
  const authHint = ' 인증 헤더는 {Authorization:"Bearer alice-token"}이고 bob은 "Bearer bob-token"을 써요. 같은 요청을 기억하게 하려면 여기에 "Idempotency-Key":"first" 같은 항목을 더해요. 헤더 객체는 handle(method, path, body, headers)의 네 번째 입력이에요.';
  for (const stage of [7, 8, 13, 17]) lessons[stage].hint += authHint;
  lessons[3].hint += ' 이 단계의 GET /bookings는 {status:200, body:[예약객체, 예약객체]}로 답해요. 목록은 응답.body에서 읽어요.';
  lessons[7].hint += ' 이 단계의 GET /bookings도 {status:200, body:[예약객체]}로 답해요. 재요청은 같은 body와 같은 인증·중복 요청 키를 다시 보내는 뜻이에요.';
  lessons[7].hint += ' 저장 객체의 bookings는 예약 배열이고, keys[key]는 {signature,response:{status,body:예약객체}}예요. JSON.parse(raw)를 부를 때마다 독립 객체를 만들어요. duplicate.bookings.push(duplicate.bookings[0])은 첫 예약을 한 번 더 넣어요. foreign.keys[key].response.body.owner = "bob";은 저장된 응답의 소유자를 바꾸는 문장이에요.';
  lessons[11].sol = lessons[11].sol.replace('same(page([2,4,6,8], 4, 1, read)', 'same(page([2,4,6,8], 0, 1, read), {items:[{id:2}], next:2}, "첫 페이지");\nassert(reads === 1, "첫 항목만 읽기");\nreads = 0;\nsame(page([2,4,6,8], 4, 1, read)');
  function source(body) {
    return 'const assert = (condition, message) => { if (!condition) throw new Error(message); };\n' +
      'const same = (actual, expected, message) => assert(JSON.stringify(actual) === JSON.stringify(expected), message);\n' +
      'function verify(factory) {\n' + body + '\n}\nmodule.exports = { verify };';
  }
  function seed(stage) { return source('// 위의 순서대로 요청과 assert를 작성해요.\n// 이 파일의 verify 본문만 고치면 돼요.'); }
  function build(stage, draft) {
    const lesson = lessons[stage], refs = BUILD_SOL[ID][stage - 1];
    const files = { ...refs, 'logic.js': refs['app.js'], 'app.js': draft };
    const ref = stage === 11 ? refs['query.js'] : refs['service.js'].replace(/require\(['"]\.\/app['"]\)/g, "require('./logic')");
    files['fixture.js'] = ref;
    const exported = stage === 11 ? 'page' : 'createService';
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
  function mount(parent, stage, record, persist) {
    const lesson = lessons[stage]; if (!lesson) return;
    const state = record.practice || (record.practice = { draft: seed(stage), attempts: 0 });
    state.running = false;
    if (typeof state.draft !== 'string') state.draft = seed(stage);
    if (state.signature !== state.draft) { state.passed = false; delete state.rows; }
    const box = document.createElement('details'); box.className = 'service-practice';
    box.innerHTML = '<summary>연결해서 직접 검사하기 · ' + escHtml(lesson.title) + '</summary><div class="service-practice-body"><p>' + escHtml(lesson.text) + '</p><ol>' + lesson.steps.map(text => '<li>' + escHtml(text) + '</li>').join('') + '</ol><p>' + escHtml(lesson.hint) + '</p><pre>' + escHtml(lesson.sample) + '</pre><label for="service-practice-code">내 검사 코드 · verify 본문을 채워요</label><textarea id="service-practice-code" spellcheck="false" autocapitalize="off"></textarea><div class="service-practice-actions"><button type="button" data-practice-run>내 검사 실행</button><button type="button" data-practice-stop hidden>실행 멈추기</button><button type="button" data-practice-solution>풀이 코드 보기</button></div><p class="service-practice-status" role="status" aria-live="polite"></p><ul class="service-practice-results"></ul><p class="study-muted">완성된 연습용 서버에 내 검사를 실행해요. 아래 프로젝트 파일과 단계 완료 기록은 별도로 확인해요.</p></div>';
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
      state.rows = rows; state.signature = run.draft; state.passed = rows.length === run.tests.length && rows.every(row => row.ok);
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
    box.querySelector('[data-practice-solution]').onclick = () => {
      state.helped = true; state.independent = false; persist();
      let solution = box.querySelector('.service-practice-solution');
      if (!solution) { solution = document.createElement('pre'); solution.className = 'service-practice-solution'; solution.textContent = source(lesson.sol); results.after(solution); }
      solution.hidden = !solution.hidden && solution.dataset.open === 'yes'; solution.dataset.open = solution.hidden ? 'no' : 'yes'; paint();
    };
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
