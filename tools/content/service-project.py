import json
from pathlib import Path

repo = Path(__file__).resolve().parents[2]

validate = '''function validate(body) {
  if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 40) return false;
  return ['10:00', '14:00'].includes(body.slot) && Number.isInteger(body.seats) && body.seats >= 1 && body.seats <= 4;
}
'''
available = '''function available(bookings, slot) {
  return 4 - bookings.filter(b => b.slot === slot).reduce((sum, b) => sum + b.seats, 0);
}
'''
wrappers = '''module.exports = {
  validate, available,
  createService: options => require('./service').createService(options),
  page: (...args) => require('./query').page(...args),
  migrate: raw => require('./migration').migrate(raw)
};
'''
page_code = '''// IDs are sorted in ascending order. Read only the part needed for this page.
function page(ids, after, limit, read) {
  let lo = 0, hi = ids.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (ids[mid] <= after) lo = mid + 1;
    else hi = mid;
  }
  const result = [];
  for (let i = lo; i < ids.length && result.length < limit; i++) result.push(read(ids[i]));
  return { items: result, next: lo + result.length < ids.length ? ids[lo + result.length - 1] : null };
}
module.exports = { page };
'''
migration_code = '''// Copy before changing a schema so the old process can keep using its data.
function migrate(raw) {
  const old = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!old || ![1, 2].includes(old.schema) || !Array.isArray(old.bookings)) throw new Error('unknown schema');
  const next = JSON.parse(JSON.stringify(old));
  next.schema = 2;
  next.bookings = next.bookings.map(b => ({ ...b, note: typeof b.note === 'string' ? b.note : '' }));
  return next;
}
module.exports = { migrate };
'''

def service(stage):
    if stage < 3:
        return "function createService() {\n  // 3단계에서 예약을 보관하는 서버를 만들어요.\n  return { handle() { return { status: 501, body: { error: '아직 만들지 않은 기능' } }; } };\n}\nmodule.exports = { createService };\n"
    code = """const { validate, available } = require('./app');
const clone = value => JSON.parse(JSON.stringify(value));
function createService(options = {}) {
  const now = options.now || (() => Date.now());
  let state = { schema: 1, nextId: 1, bookings: [], keys: {}, events: [] };
@@RESTORE@@
@@INDEX@@
@@OPS@@
  function serial(draft) {
@@SERIAL@@
    return JSON.stringify(draft);
  }
  function publish(draft) {
@@SAVE@@
    state = draft;
@@REINDEX@@
  }
  const reply = (status, body) => ({ status, body });
@@RATE@@
  function process(method, path, body, headers = {}) {
@@HEALTH@@
    if (!['/bookings', '/slots'].includes(path) && !/^\\/bookings\\/\\d+$/.test(path)) return reply(404, { error: 'not found' });
    if (method === 'GET' && path === '/slots') return reply(200, ['10:00', '14:00'].map(slot => ({ slot, remaining: available(state.bookings, slot) })));
    let owner = 'guest';
@@AUTH@@
    if (method === 'GET' && path === '/bookings') {
@@LIST@@
    }
    if (method === 'POST' && path === '/bookings') {
      if (!validate(body)) return reply(400, { error: 'invalid booking' });
      const clean = { name: body.name.trim(), slot: body.slot, seats: body.seats };
@@IDEMPOTENCY@@
      if (available(state.bookings, clean.slot) < clean.seats) return reply(409, { error: 'full' });
@@ADMIT@@
      const draft = clone(state);
      const booking = { id: draft.nextId++, owner, ...clean };
      draft.bookings.push(booking);
      const result = reply(201, clone(booking));
@@REMEMBER@@
@@CREATED@@
      try { publish(draft); } catch (_) { return reply(503, { error: 'save failed' }); }
      return result;
    }
@@CANCEL@@
    return reply(404, { error: 'not found' });
  }
@@HANDLE@@
@@DELIVERY@@
  return { handle@@EXPORT@@ };
}
module.exports = { createService };
"""
    parts = {}
    if stage >= 7:
        schema = '[1, 2].includes(data.schema)' if stage >= 15 else 'data.schema === 1'
        parts['RESTORE'] = """  if (options.snapshot !== undefined) {
    let data = JSON.parse(options.snapshot);
    if (!data || !(@@SCHEMA@@) || !Array.isArray(data.bookings) || !Number.isSafeInteger(data.nextId) || data.nextId < 1 || !data.keys || typeof data.keys !== 'object' || Array.isArray(data.keys) || !Array.isArray(data.events)) throw new Error('invalid snapshot');
    const ids = new Set();
    for (const b of data.bookings) {
      if (!validate(b) || !Number.isSafeInteger(b.id) || b.id < 1 || ids.has(b.id) || typeof b.owner !== 'string' || !b.owner) throw new Error('invalid booking');
      ids.add(b.id);
    }
    if (['10:00', '14:00'].some(slot => available(data.bookings, slot) < 0)) throw new Error('over capacity');
    const eventIds = new Set();
    for (const e of data.events) {
      if (!e || typeof e.id !== 'string' || eventIds.has(e.id) || !Number.isSafeInteger(e.bookingId) || e.bookingId < 1 || !['booking.created', 'booking.cancelled'].includes(e.type) || !['pending', 'sent', 'dead'].includes(e.status) || !Number.isInteger(e.attempts) || e.attempts < 0 || e.attempts > 3 || !Number.isFinite(e.nextAt)) throw new Error('invalid event');
      eventIds.add(e.id);
    }
    let highestId = Math.max(0, ...data.bookings.map(b => b.id), ...data.events.map(e => e.bookingId));
    for (const key of Object.keys(data.keys)) {
      const entry = data.keys[key];
      if (!entry || typeof entry.signature !== 'string' || !entry.response || ![201, 204].includes(entry.response.status)) throw new Error('invalid retry record');
      const scope = JSON.parse(key);
      if (!Array.isArray(scope) || scope.length !== 4 || typeof scope[0] !== 'string' || !scope[0] || !['POST', 'DELETE'].includes(scope[1]) || typeof scope[2] !== 'string' || typeof scope[3] !== 'string' || !scope[3].trim() || scope[3].length > 80) throw new Error('invalid retry scope');
      if (entry.response.status === 201) {
        const b = entry.response.body;
        if (scope[1] !== 'POST' || scope[2] !== '/bookings' || !validate(b) || !Number.isSafeInteger(b.id) || b.id < 1 || b.owner !== scope[0] || entry.signature !== JSON.stringify({ name: b.name, slot: b.slot, seats: b.seats })) throw new Error('invalid retry response');
        highestId = Math.max(highestId, b.id);
      } else if (scope[1] !== 'DELETE' || !/^\\/bookings\\/\\d+$/.test(scope[2]) || entry.response.body !== null) throw new Error('invalid cancel response');
    }
@@MIGRATE@@
    data.nextId = Math.max(data.nextId, highestId + 1);
    state = clone(data);
  }
""".replace('@@SCHEMA@@', schema).replace('@@MIGRATE@@', "    data = require('./migration').migrate(data);" if stage >= 15 else '')
    if stage >= 8:
        parts['SAVE'] = "    if (options.save) options.save(serial(draft)); // Save the complete draft before exposing it."
    if stage >= 12:
        parts['INDEX'] = """  let byId, byOwner;
  function reindex() {
    byId = new Map(); byOwner = new Map();
    for (const booking of state.bookings) {
      byId.set(booking.id, booking);
      if (!byOwner.has(booking.owner)) byOwner.set(booking.owner, []);
      byOwner.get(booking.owner).push(booking.id);
    }
    for (const ids of byOwner.values()) ids.sort((a, b) => a - b);
  }
  reindex();"""
        parts['REINDEX'] = '    reindex();'
    parts['LIST'] = "      return reply(200, clone(state.bookings" + (".filter(b => b.owner === owner)" if stage >= 5 else '') + "));"
    if stage >= 12:
        parts['LIST'] = """      const limit = body && body.limit !== undefined ? body.limit : 20;
      const after = body && body.after !== undefined ? body.after : 0;
      if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(after) || after < 0) return reply(400, { error: 'bad page' });
      return reply(200, require('./query').page(byOwner.get(owner) || [], after, limit, id => clone(byId.get(id))));"""
    if stage >= 5:
        parts['AUTH'] = """    const token = typeof headers.Authorization === 'string' ? headers.Authorization.replace(/^Bearer /, '') : '';
    const tokens = options.tokens || { 'alice-token': 'alice', 'bob-token': 'bob' };
    if (!Object.prototype.hasOwnProperty.call(tokens, token) || !tokens[token]) return reply(401, { error: 'unauthorized' });
    owner = tokens[token];"""
    if stage >= 6:
        parts['IDEMPOTENCY'] = """      const key = headers['Idempotency-Key'];
      if (key !== undefined && (typeof key !== 'string' || !key.trim() || key.length > 80)) return reply(400, { error: 'bad retry key' });
      const signature = JSON.stringify(clean);
      const scoped = JSON.stringify([owner, 'POST', path, key]);
      if (key !== undefined && state.keys[scoped]) {
        const old = state.keys[scoped];
        return old.signature === signature ? clone(old.response) : reply(409, { error: 'key reused for another request' });
      }"""
        parts['REMEMBER'] = '      if (key !== undefined) draft.keys[scoped] = { signature, response: clone(result) };'
    if stage >= 9:
        parts['CREATED'] = "      draft.events.push({ id: 'created-' + booking.id, type: 'booking.created', bookingId: booking.id, status: 'pending', attempts: 0, nextAt: now() });"
    if stage >= 4:
        cancel = """    if (method === 'DELETE' && /^\\/bookings\\/\\d+$/.test(path)) {
      const id = Number(path.split('/')[2]);
@@CANCELRETRY@@
      const booking = state.bookings.find(b => b.id === id@@OWNER@@);
      if (!booking) return reply(404, { error: 'not found' });
@@ADMIT@@
      const draft = clone(state);
      draft.bookings = draft.bookings.filter(b => b.id !== id);
@@CANCELLED@@
      try { publish(draft); } catch (_) { return reply(503, { error: 'save failed' }); }
      return reply(204, null);
    }"""
        cancel = cancel.replace('@@OWNER@@', ' && b.owner === owner' if stage >= 5 else '')
        retry = ''
        cancelled = ''
        if stage >= 18:
            retry = """      const key = headers['Idempotency-Key'];
      if (key !== undefined && (typeof key !== 'string' || !key.trim() || key.length > 80)) return reply(400, { error: 'bad retry key' });
      const scoped = JSON.stringify([owner, 'DELETE', path, key]);
      if (key !== undefined && state.keys[scoped]) return clone(state.keys[scoped].response);"""
            cancelled = """      draft.events.push({ id: 'cancelled-' + id, type: 'booking.cancelled', bookingId: id, status: 'pending', attempts: 0, nextAt: now() });
      if (key !== undefined) draft.keys[scoped] = { signature: 'cancel', response: reply(204, null) };"""
        parts['CANCEL'] = cancel.replace('@@CANCELRETRY@@', retry).replace('@@CANCELLED@@', cancelled)
    parts['HANDLE'] = '  const handle = process;'
    if stage >= 13:
        parts['OPS'] = """  const logs = [];
  let requestId = 0;
  function metrics() {
    const recent = logs.filter(log => now() - log.at <= 300000);
    const durations = recent.map(log => log.ms).sort((a, b) => a - b);
    return { requests: recent.length, errors: recent.filter(log => log.status >= 500).length,
      successRate: recent.length ? recent.filter(log => log.status < 500).length / recent.length : 1,
      p95: durations.length ? durations[Math.ceil(durations.length * 0.95) - 1] : 0 };
  }"""
        parts['HANDLE'] = """  function handle(method, path, body, headers) {
    const start = now();
    const result = process(method, path, body, headers);
    const log = { id: 'request-' + (++requestId), at: start, method, path: /^\\/bookings\\/\\d+$/.test(path) ? '/bookings/:id' : ['/bookings', '/slots', '/health/live', '/health/ready'].includes(path) ? path : '/unknown', status: result.status, ms: Math.max(0, now() - start) };
    logs.push(log);
    if (logs.length > 100) logs.shift();
    return { ...result, requestId: log.id };
  }"""
    if stage >= 14:
        parts['RATE'] = """  const rates = new Map();
  function admit(owner) {
    const at = now();
    const old = rates.get(owner);
    const bucket = old && at - old.start < 60000 ? old : { start: at, count: 0 };
    if (bucket.count >= (options.rateLimit || 100)) return false;
    bucket.count++; rates.set(owner, bucket); return true;
  }"""
        parts['ADMIT'] = "      if (!admit(owner)) return reply(429, { error: 'too many requests' });"
    if stage >= 15:
        parts['SERIAL'] = """    const saved = clone(draft);
    saved.schema = options.writeVersion === 2 ? 2 : 1;
    saved.bookings = saved.bookings.map(b => {
      if (saved.schema === 2) return { ...b, note: typeof b.note === 'string' ? b.note : '' };
      return { ...b }; // An old schema may still carry additive fields; never drop an existing note.
    });
    return JSON.stringify(saved);"""
    if stage >= 16:
        parts['HEALTH'] = """    if (method === 'GET' && path === '/health/live') return reply(200, { live: true });
    if (method === 'GET' && path === '/health/ready') {
      let ready = true;
      try { if (options.probe) ready = options.probe() === true; } catch (_) { ready = false; }
      return reply(ready ? 200 : 503, { ready });
    }"""
    if stage >= 9:
        retry = """      if (event.status !== 'pending') continue;
      const draft = clone(state), target = draft.events.find(e => e.id === event.id);
      try { sink(clone(event)); target.status = 'sent'; } catch (_) { target.attempts++; }
      try { publish(draft); } catch (_) { break; }"""
        if stage >= 10:
            retry = """      if (event.status !== 'pending' || event.nextAt > now()) continue;
      const draft = clone(state), target = draft.events.find(e => e.id === event.id);
      target.attempts++;
      try { sink(clone(event)); target.status = 'sent'; }
      catch (_) {
        target.status = target.attempts >= 3 ? 'dead' : 'pending';
        target.nextAt = now() + 1000 * target.attempts;
      }
      try { publish(draft); } catch (_) { break; }"""
        parts['DELIVERY'] = """  function flush(sink) {
    for (const event of clone(state.events)) {
@@ATTEMPT@@
    }
    return clone(state.events);
  }
""".replace('@@ATTEMPT@@', retry)
        if stage >= 10:
            parts['DELIVERY'] += """  function replay(id) {
    const draft = clone(state), event = draft.events.find(e => e.id === id && e.status === 'dead');
    if (!event) return false;
    event.status = 'pending'; event.attempts = 0; event.nextAt = now();
    try { publish(draft); return true; } catch (_) { return false; }
  }
"""
    exports = []
    if stage >= 7:
        exports += ['snapshot: () => serial(state)']
    if stage >= 9:
        exports += ['events: () => clone(state.events)', 'flush']
    if stage >= 10:
        exports += ['replay']
    if stage >= 13:
        exports += ['logs: () => clone(logs)', 'metrics']
    parts['EXPORT'] = ', ' + ', '.join(exports) if exports else ''
    for key in ['RESTORE','INDEX','OPS','SERIAL','SAVE','REINDEX','RATE','HEALTH','AUTH','LIST','IDEMPOTENCY','ADMIT','REMEMBER','CREATED','CANCEL','HANDLE','DELIVERY','EXPORT']:
        code = code.replace('@@'+key+'@@', parts.get(key,''))
    # The admission hook appears inside the cancellation fragment too.
    code = code.replace('@@ADMIT@@', parts.get('ADMIT',''))
    assert '@@' not in code, code
    return code

verify_code = """const assert = (condition, message) => { if (!condition) throw new Error(message); };
function verify(factory) {
  const alice = { Authorization: 'Bearer alice-token', 'Idempotency-Key': 'first' };
  const bob = { Authorization: 'Bearer bob-token' };
  const body = { name: '가은', slot: '10:00', seats: 3 };
  const app = factory();
  const first = app.handle('POST', '/bookings', body, alice);
  assert(first.status === 201, '예약을 만들지 못했어요');
  const again = app.handle('POST', '/bookings', body, alice);
  assert(again.status === 201 && again.body.id === first.body.id, '중복 예약');
  assert(app.handle('POST', '/bookings', { ...body, seats: 2 }, bob).status === 409, '정원 초과');
  assert(app.handle('DELETE', '/bookings/' + first.body.id, null, bob).status === 404, '남의 예약 취소');
  assert(app.handle('DELETE', '/bookings/' + first.body.id, null, alice).status === 204, '내 예약 취소');
  assert(app.handle('DELETE', '/bookings/' + first.body.id, null, bob).status === 404, '반복 취소');
  const failing = factory({ save() { throw new Error('disk full'); } });
  assert(failing.handle('POST', '/bookings', body, alice).status === 503, '저장 실패 은폐');
  assert(failing.handle('GET', '/slots').body[0].remaining === 4, '실패한 예약의 정원 차감');
}
module.exports = { verify };
"""

def files(stage):
    result = {'app.js': validate + (available if stage >= 2 else "function available() { return 0; }\n") + wrappers, 'service.js': service(stage)}
    if stage >= 11:
        result['query.js'] = page_code
    if stage >= 15:
        result['migration.js'] = migration_code
    if stage >= 17:
        result['test.js'] = verify_code
    return result

groups = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]
def test(stage, title, code):
    groups[stage-1].append({'n': title, 'c': code})

test(1,'빈 이름·잘못된 시간·소수 인원은 거절한다', "ok(!A.validate({name:' ',slot:'10:00',seats:1})); ok(!A.validate({name:'가은',slot:'11:00',seats:1})); ok(!A.validate({name:'가은',slot:'10:00',seats:1.5}));")
test(1,'이름과 인원 1~4명을 허용한다', "for(const seats of [1,4]) ok(A.validate({name:' 가은 ',slot:'14:00',seats})); for(const seats of [0,5,'2',NaN]) ok(!A.validate({name:'가은',slot:'10:00',seats})); ok(!A.validate(null)); ok(!A.validate({name:'x'.repeat(41),slot:'10:00',seats:1}));")
test(2,'시간대별 남은 자리를 계산한다', "const list=[{slot:'10:00',seats:2},{slot:'14:00',seats:1}]; eq(A.available(list,'10:00'),2);eq(A.available(list,'14:00'),3);eq(A.available([],'10:00'),4);")
test(3,'예약 생성 후 목록과 남은 자리에 반영한다', "const s=A.createService(),h={Authorization:'Bearer alice-token'};const r=s.handle('POST','/bookings',{name:' 가은 ',slot:'10:00',seats:2},h);eq(r.status,201);eq(r.body.name,'가은');eq(s.handle('GET','/slots').body[0].remaining,2);const list=s.handle('GET','/bookings',null,h).body;eq((Array.isArray(list)?list:list.items).length,1);")
test(3,'잘못된 입력·없는 경로는 상태를 바꾸지 않는다', "const s=A.createService();eq(s.handle('POST','/bookings',{name:'x',slot:'10:00',seats:0},{Authorization:'Bearer alice-token'}).status,400);eq(s.handle('GET','/missing').status,404);eq(s.handle('GET','/slots').body[0].remaining,4);")
test(3,'마지막 자리까지만 예약할 수 있다', "const s=A.createService(),h={Authorization:'Bearer alice-token'},b={name:'x',slot:'10:00',seats:3};eq(s.handle('POST','/bookings',b,h).status,201);eq(s.handle('POST','/bookings',{...b,seats:2},h).status,409);eq(s.handle('GET','/slots').body[0].remaining,1);")
test(4,'취소한 자리는 정확히 한 번 돌아온다', "const s=A.createService(),h={Authorization:'Bearer alice-token'};const r=s.handle('POST','/bookings',{name:'x',slot:'10:00',seats:3},h);eq(s.handle('DELETE','/bookings/'+r.body.id,null,h).status,204);eq(s.handle('DELETE','/bookings/'+r.body.id,null,{Authorization:'Bearer bob-token'}).status,404);eq(s.handle('GET','/slots').body[0].remaining,4);")
test(5,'서버가 확인한 사용자만 예약할 수 있다', "const s=A.createService(),b={name:'x',slot:'10:00',seats:1};eq(s.handle('POST','/bookings',b).status,401);eq(s.handle('POST','/bookings',b,{Authorization:'Bearer wrong'}).status,401);eq(s.handle('POST','/bookings',b,{Authorization:'Bearer toString'}).status,401);eq(s.handle('GET','/bookings').status,401);")
test(5,'남의 예약은 조회하거나 취소하지 못한다', "const s=A.createService(),a={Authorization:'Bearer alice-token'},b={Authorization:'Bearer bob-token'};const r=s.handle('POST','/bookings',{name:'x',slot:'10:00',seats:1,owner:'bob'},a);eq(r.body.owner,'alice');const list=s.handle('GET','/bookings',null,b).body;eq((Array.isArray(list)?list:list.items).length,0);eq(s.handle('DELETE','/bookings/'+r.body.id,null,b).status,404);eq(s.handle('DELETE','/bookings/999',null,b).status,404);eq(s.handle('GET','/slots').body[0].remaining,3);")
test(6,'응답을 못 받아 다시 보내도 같은 예약을 돌려준다', "const s=A.createService(),h={Authorization:'Bearer alice-token','Idempotency-Key':'retry'},b={name:'x',slot:'10:00',seats:2};const first=s.handle('POST','/bookings',b,h),again=s.handle('POST','/bookings',b,h);eq(first.body,again.body);eq(again.status,201);eq(s.handle('GET','/slots').body[0].remaining,2);")
test(6,'같은 키로 다른 요청을 보내면 409, 다른 사용자는 별개다', "const s=A.createService(),h={Authorization:'Bearer alice-token','Idempotency-Key':'same'},b={name:'x',slot:'10:00',seats:1};s.handle('POST','/bookings',b,h);eq(s.handle('POST','/bookings',{...b,seats:2},h).status,409);const r=s.handle('POST','/bookings',b,{...h,Authorization:'Bearer bob-token'});eq(r.status,201);eq(r.body.owner,'bob');eq(s.handle('POST','/bookings',b,{...h,'Idempotency-Key':' '}).status,400);")
test(7,'재시작 뒤 예약·중복 요청 기록·다음 ID를 복원한다', "const h={Authorization:'Bearer alice-token','Idempotency-Key':'persist'},b={name:'x',slot:'10:00',seats:1},s=A.createService();const first=s.handle('POST','/bookings',b,h);const t=A.createService({snapshot:s.snapshot()});eq(t.handle('POST','/bookings',b,h).body.id,first.body.id);ok(t.handle('POST','/bookings',b,{Authorization:'Bearer alice-token'}).body.id>first.body.id);eq(t.handle('GET','/slots').body[0].remaining,2);")
test(7,'깨진 저장·겹친 ID·정원 초과는 조용히 초기화하지 않는다', "const base={schema:1,nextId:2,bookings:[{id:1,owner:'alice',name:'x',slot:'10:00',seats:4}],keys:{},events:[]};throws(()=>A.createService({snapshot:'bad json'}));throws(()=>A.createService({snapshot:''}));throws(()=>A.createService({snapshot:JSON.stringify({...base,bookings:[...base.bookings,...base.bookings]})}));throws(()=>A.createService({snapshot:JSON.stringify({...base,bookings:[...base.bookings,{...base.bookings[0],id:2}]})}));")
test(7,'취소한 예약의 재요청 기록을 복원해도 ID를 재사용하지 않는다', "const s=A.createService(),h={Authorization:'Bearer alice-token','Idempotency-Key':'history'},b={name:'x',slot:'10:00',seats:1};const id=s.handle('POST','/bookings',b,h).body.id;s.handle('DELETE','/bookings/'+id,null,{Authorization:'Bearer alice-token'});const data=JSON.parse(s.snapshot());data.nextId=1;const t=A.createService({snapshot:JSON.stringify(data)});ok(t.handle('POST','/bookings',b,{Authorization:'Bearer alice-token'}).body.id>id);const key=Object.keys(data.keys)[0];data.keys[key].response.body.owner='bob';throws(()=>A.createService({snapshot:JSON.stringify(data)}));")
test(8,'저장 실패 때 정원·ID·재요청 기록을 소비하지 않는다', "let fail=true;const s=A.createService({save(){if(fail)throw new Error('disk full');}}),h={Authorization:'Bearer alice-token','Idempotency-Key':'one'},b={name:'x',slot:'10:00',seats:2};const before=s.snapshot();eq(s.handle('POST','/bookings',b,h).status,503);eq(s.snapshot(),before);fail=false;eq(s.handle('POST','/bookings',b,h).body.id,1);")
test(8,'취소 저장에 실패하면 예약과 자리를 그대로 보존한다', "let fail=false;const s=A.createService({save(){if(fail)throw new Error('disk full');}}),h={Authorization:'Bearer alice-token'};const r=s.handle('POST','/bookings',{name:'x',slot:'10:00',seats:2},h);const before=s.snapshot();fail=true;eq(s.handle('DELETE','/bookings/'+r.body.id,null,h).status,503);eq(s.snapshot(),before);")
test(9,'예약과 알림할 일이 함께 저장된다', "let saved;const s=A.createService({save(raw){saved=JSON.parse(raw);}}),h={Authorization:'Bearer alice-token','Idempotency-Key':'one'},b={name:'x',slot:'10:00',seats:1};s.handle('POST','/bookings',b,h);s.handle('POST','/bookings',b,h);eq(saved.bookings.length,1);eq(saved.events.length,1);eq(s.events()[0].bookingId,1);eq(s.events()[0].type,'booking.created');const seen=[];s.flush(e=>seen.push(e.id));s.flush(e=>seen.push(e.id));eq(seen,['created-1']);")
test(9,'전송 후 기록 저장에 실패하면 같은 이벤트 ID로 다시 보낸다', "let fail=false,at=0;const s=A.createService({now:()=>at,save(){if(fail)throw new Error('disk');}});s.handle('POST','/bookings',{name:'x',slot:'10:00',seats:1},{Authorization:'Bearer alice-token'});fail=true;const seen=[];s.flush(e=>seen.push(e.id));fail=false;at=10000;s.flush(e=>seen.push(e.id));eq(seen,['created-1','created-1']);eq(s.events()[0].status,'sent');")
test(10,'실패한 알림은 기다렸다 세 번 시도하고 보류한다', "let at=0,calls=0;const s=A.createService({now:()=>at});s.handle('POST','/bookings',{name:'x',slot:'10:00',seats:1},{Authorization:'Bearer alice-token'});const fail=()=>{calls++;throw new Error('offline');};s.flush(fail);s.flush(fail);eq(calls,1);at=1000;s.flush(fail);at=3000;s.flush(fail);eq(s.events()[0].status,'dead');at=10000;s.flush(fail);eq(calls,3);ok(s.replay('created-1'));s.flush(()=>{});eq(s.events()[0].status,'sent');eq(s.events()[0].id,'created-1');")
test(11,'커서 다음 항목만 읽고 마지막 페이지를 구분한다', "const ids=[1,3,8,20],read=id=>({id});eq(A.page(ids,3,2,read),{items:[{id:8},{id:20}],next:null});eq(A.page(ids,0,2,read),{items:[{id:1},{id:3}],next:3});eq(A.page([],0,2,read),{items:[],next:null});")
test(11,'5만 ID에서도 전체 스캔 없이 다음 20개를 찾는다', "let touches=0,reads=0;const ids=new Proxy(Array.from({length:50000},(_,i)=>i+1),{get(t,k){if(/^\\d+$/.test(String(k)))touches++;return t[k];}});const result=A.page(ids,40000,20,id=>{reads++;return{id};});eq(result.items[0].id,40001);eq(result.items.length,20);eq(reads,20);ok(touches<=60,'ID를 '+touches+'개 읽었어요. 커서 위치를 이진 탐색하고 필요한 부분만 읽어 보세요.');")
test(12,'서버 목록은 사용자별 인덱스·커서·페이지 크기를 사용한다', "const s=A.createService(),h={Authorization:'Bearer alice-token'},b={name:'x',slot:'10:00',seats:1};s.handle('POST','/bookings',b,h);s.handle('POST','/bookings',{...b,slot:'14:00'},h);const first=s.handle('GET','/bookings',{limit:1},h);eq(first.body.items.length,1);eq(first.body.next,1);eq(s.handle('GET','/bookings',{limit:1,after:1},h).body.items[0].id,2);eq(s.handle('GET','/bookings',{limit:0},h).status,400);eq(s.handle('GET','/bookings',{limit:51},h).status,400);eq(s.handle('GET','/bookings',{after:-1},h).status,400);")
test(12,'재시작·취소 뒤에도 인덱스와 실제 예약이 같다', "const s=A.createService(),h={Authorization:'Bearer alice-token'},b={name:'x',slot:'10:00',seats:1};const r=s.handle('POST','/bookings',b,h);const t=A.createService({snapshot:s.snapshot()});eq(t.handle('GET','/bookings',null,h).body.items[0].id,r.body.id);t.handle('DELETE','/bookings/'+r.body.id,null,h);eq(t.handle('GET','/bookings',null,h).body.items.length,0);")
test(13,'실패율·P95와 요청 ID를 기록한다', "let tick=0;const s=A.createService({now:()=>tick,save(){tick+=5;throw new Error('disk');}});const r=s.handle('POST','/bookings',{name:'x',slot:'10:00',seats:1},{Authorization:'Bearer alice-token'});ok(r.requestId);s.handle('GET','/slots');eq(s.metrics().requests,2);eq(s.metrics().errors,1);eq(s.metrics().successRate,0.5);eq(s.metrics().p95,5);eq(s.logs()[0].id,r.requestId);")
test(13,'로그에 토큰·이름을 남기지 않고 최근 100건만 보관한다', "let at=0;const s=A.createService({now:()=>at}),h={Authorization:'Bearer alice-token'};s.handle('POST','/bookings',{name:'private-name',slot:'10:00',seats:1},h);s.handle('GET','/private-name');ok(!JSON.stringify(s.logs()).includes('private-name'));ok(!JSON.stringify(s.logs()).includes('alice-token'));for(let i=0;i<110;i++)s.handle('GET','/slots');eq(s.logs().length,100);at=300001;eq(s.metrics().requests,0);eq(s.metrics().p95,0);")
test(14,'사용자별 요청 제한은 재요청을 새 요청으로 세지 않는다', "let at=0;const s=A.createService({now:()=>at,rateLimit:1}),h={Authorization:'Bearer alice-token','Idempotency-Key':'k'},b={name:'x',slot:'10:00',seats:1};eq(s.handle('POST','/bookings',b,h).status,201);eq(s.handle('POST','/bookings',b,h).status,201);eq(s.handle('POST','/bookings',b,{Authorization:'Bearer alice-token'}).status,429);eq(s.handle('POST','/bookings',b,{Authorization:'Bearer bob-token'}).status,201);at=60000;eq(s.handle('POST','/bookings',b,{Authorization:'Bearer alice-token'}).status,201);")
test(15,'V1을 복사해 V2로 바꾸며 원본과 ID를 보존한다', "const old={schema:1,nextId:2,bookings:[{id:1,owner:'alice',name:'x',slot:'10:00',seats:1}],keys:{},events:[]};const next=A.migrate(old);eq(old.schema,1);ok(old.bookings[0].note===undefined);eq(next.schema,2);eq(next.bookings[0].note,'');eq(A.migrate(next),next);throws(()=>A.migrate({...old,schema:99}));")
test(15,'새 판은 양쪽 형식을 읽고 이전 판이 읽는 V1도 쓸 수 있다', "const h={Authorization:'Bearer alice-token'},b={name:'x',slot:'10:00',seats:1};const s=A.createService({writeVersion:2});s.handle('POST','/bookings',b,h);eq(JSON.parse(s.snapshot()).schema,2);const next=A.createService({snapshot:s.snapshot()});eq(JSON.parse(next.snapshot()).schema,1);const previous=REF().createService({snapshot:next.snapshot()});eq(previous.handle('GET','/slots').body[0].remaining,3);")
test(15,'새 필드에 값이 있어도 이전 호환 형식으로 저장하며 잃지 않는다', "const original={schema:2,nextId:2,bookings:[{id:1,owner:'alice',name:'x',slot:'10:00',seats:1,note:'창가 자리'}],keys:{},events:[]};const current=A.createService({snapshot:JSON.stringify(original)});eq(JSON.parse(current.snapshot()).bookings[0].note,'창가 자리');const previous=REF().createService({snapshot:current.snapshot()});eq(JSON.parse(previous.snapshot()).bookings[0].note,'창가 자리');")
test(16,'살아 있는 서버와 요청을 받아도 되는 서버를 구분한다', "const s=A.createService({probe:()=>false});eq(s.handle('GET','/health/live').status,200);eq(s.handle('GET','/health/ready').status,503);eq(A.createService({probe:()=>true}).handle('GET','/health/ready').status,200);eq(A.createService({probe(){throw new Error('disk');}}).handle('GET','/health/ready').status,503);")
test(17,'내가 쓴 회귀 검사는 정상 구현을 받아들인다', "require('./test').verify(REF().createService);")
mutations = [
    ('정원 확인 삭제', "if (available(state.bookings, clean.slot) < clean.seats)", 'if (false)'),
    ('소유자 확인 삭제', 'b.id === id && b.owner === owner', 'b.id === id'),
    ('재요청 기억 삭제', 'key !== undefined && state.keys[scoped]', 'false'),
    ('저장 실패 은폐', "return reply(503, { error: 'save failed' });", "return reply(201, { id: 1 });"),
    ('저장보다 먼저 상태 변경', 'if (options.save) options.save(serial(draft));', 'state = draft; if (options.save) options.save(serial(draft));'),
]
for title, before, after in mutations:
    test(17, '내 회귀 검사가 잡아야 하는 결함: '+title, 'throws(()=>require(\'./test\').verify(MUT('+json.dumps(before)+','+json.dumps(after)+').createService),'+json.dumps(title)+');')
test(18,'취소 요청을 다시 보내도 같은 204와 알림 하나를 유지한다', "const s=A.createService(),h={Authorization:'Bearer alice-token'},b={name:'x',slot:'10:00',seats:2};const id=s.handle('POST','/bookings',b,h).body.id;const retry={...h,'Idempotency-Key':'cancel'};eq(s.handle('DELETE','/bookings/'+id,null,retry).status,204);eq(s.handle('DELETE','/bookings/'+id,null,retry).status,204);eq(s.events().filter(e=>e.type==='booking.cancelled').length,1);eq(s.handle('GET','/slots').body[0].remaining,4);")
test(18,'취소 키도 사용자·경로별로 나누고 저장 실패를 복구한다', "let fail=false;const s=A.createService({save(){if(fail)throw new Error('disk');}}),a={Authorization:'Bearer alice-token'},b={name:'x',slot:'10:00',seats:1};const id=s.handle('POST','/bookings',b,a).body.id,h={...a,'Idempotency-Key':'one'};fail=true;eq(s.handle('DELETE','/bookings/'+id,null,h).status,503);eq(s.events().filter(e=>e.type==='booking.cancelled').length,0);fail=false;eq(s.handle('DELETE','/bookings/'+id,null,h).status,204);eq(s.handle('DELETE','/bookings/'+id,null,{...h,Authorization:'Bearer bob-token'}).status,404);const restored=A.createService({snapshot:s.snapshot()});eq(restored.handle('DELETE','/bookings/'+id,null,h).status,204);eq(restored.events().filter(e=>e.type==='booking.cancelled').length,1);")

# Human explanations accompany behavior, not a claim that a job title was earned.
lessons = [
('예약 입력 검사','입문','검증은 잘못된 입력을 저장하기 전에 걸러내는 일이에요. 0명이나 빈 이름이 들어오면 예약을 만들지 않아요.','이름은 공백을 빼고 1~40자, 시간은 10:00·14:00, 인원은 정수 1~4명이어야 해요. validate(body)는 참 또는 거짓을 반환해요.','입력값이 숫자처럼 보여도 문자열일 수 있어요. Number.isInteger로 실제 정수를 확인해 보세요.','"2"와 2를 구분해야 하는 이유는?',['입력의 타입과 범위를 함께 확인하려고','문자열은 화면에 표시할 수 없어서','모든 입력을 배열로 바꾸려고'],0,'app.js'),
('남은 자리 계산','입문','같은 시간대의 예약 인원을 더하고 정원 4명에서 빼요. 다른 시간대의 예약은 계산에 넣지 않아요.','available(bookings, slot)은 해당 시간대의 남은 인원을 반환해요. 원래 배열은 바꾸지 않아요.','filter는 조건에 맞는 항목을 남기고 reduce는 여러 값을 하나로 모아요.','10시에 2명, 14시에 1명이 예약했다면 10시의 남은 자리는?',['1명','2명','3명'],1,'app.js'),
('예약 API 만들기','입문','API는 화면이 서버에 일을 부탁하는 약속이에요. POST로 예약을 만들고 GET으로 저장한 예약을 확인해요.','createService()는 handle(method, path, body, headers)를 반환해요. POST /bookings 성공은 201, 잘못된 입력은 400, 정원 부족은 409, 없는 경로는 404예요. GET /slots와 GET /bookings도 구현해요.','상태 코드는 결과의 종류를 알려 줘요. 정원을 확인한 뒤 ID를 붙이고 목록에 넣으세요.','정원 부족을 서버 오류 500으로 보내면 어떤 문제가 생길까요?',['이름을 저장할 수 없다','클라이언트가 일시적 장애로 오해해 재시도할 수 있다','예약 배열이 반드시 비어 버린다'],1,'service.js'),
('취소와 자리 복원','입문','취소는 예약을 목록에서 없애는 일이에요. 남은 자리를 따로 더하지 않고, 현재 예약 목록에서 다시 계산하면 두 번 복원하는 실수를 줄일 수 있어요.','DELETE /bookings/{id}는 존재하는 예약을 지우고 204를 반환해요. 이미 없거나 처음부터 없는 ID는 404예요.','예약을 먼저 찾고, 찾았을 때만 삭제하세요. 같은 취소를 두 번 보내며 남은 자리도 확인해 보세요.','취소 요청이 두 번 도착했을 때 지켜야 할 것은?',['자리를 두 번 돌려준다','두 번째 요청은 다른 예약을 지운다','예약과 정원은 한 번만 바뀐다'],2,'service.js'),
('사용자와 권한','중급','인증은 누구인지 확인하는 일이고, 권한 검사는 그 사람이 이 일을 해도 되는지 확인하는 일이에요. 입력 body의 owner를 믿으면 남의 예약을 만들거나 지울 수 있어요.','예약 조회·생성·취소는 Authorization: Bearer alice-token 또는 bob-token으로 사용자를 확인해요. 토큰은 options.tokens로 바꿀 수 있어요. 내 예약만 조회·취소하며 남의 ID와 없는 ID는 모두 404예요.','여기서는 로그인 이후 전달된 토큰을 확인하는 부분을 연습해요. 실제 로그인·비밀번호 저장은 이 실습의 범위 밖이에요.','body의 owner와 서버가 확인한 사용자가 다르면 무엇을 믿을까요?',['서버가 확인한 사용자','body의 owner','둘 중 먼저 읽은 값'],0,'service.js'),
('중복 요청 막기','중급','멱등성은 같은 요청을 다시 보내도 결과가 한 번 처리했을 때와 같게 만드는 성질이에요. 응답을 못 받은 사용자가 재시도해도 예약이 늘어나면 안 돼요.','Idempotency-Key를 사용자·메서드·경로와 묶어 저장해요. 같은 입력의 재시도는 처음 응답, 같은 키에 다른 입력은 409예요. 빈 키·80자 초과는 400예요.','키를 전체 사용자에게 하나로 쓰면 다른 사람의 응답이 섞여요. 입력 내용도 함께 비교하세요.','같은 키로 인원만 바꿔 보내면?',['새 예약을 하나 더 만든다','409로 충돌을 알려 준다','다른 사용자의 응답을 돌려준다'],1,'service.js'),
('저장과 재시작','중급','메모리는 프로세스가 끝나면 사라져요. 스냅샷은 다시 시작할 때 복원할 상태를 파일로 남기기 위한 값이에요.','snapshot()은 schema:1, nextId, bookings, keys, events를 담은 JSON 문자열이에요. options.snapshot으로 복원해요. 깨진 JSON·중복 ID·정원 초과는 예외로 알리고 원본을 보존해요. events는 이 단계에서는 빈 배열이에요.','예약만 저장하고 중복 요청 키를 빼면 재시작 뒤 같은 요청이 새 예약이 됩니다. nextId도 기존 ID보다 커야 해요.','저장 파일을 읽을 수 없을 때 조용히 빈 목록으로 시작하면?',['복구가 끝난다','사용자의 기존 예약이 사라진 것처럼 처리될 수 있다','ID가 자동으로 안전해진다'],1,'service.js'),
('저장 실패를 안전하게 처리','중급','원자성은 관련된 변경을 전부 반영하거나 전부 반영하지 않는 성질이에요. 저장에 실패했는데 화면에서는 예약됐다고 보이면 문제가 커져요.','변경안을 별도로 만들고 options.save(JSON)를 먼저 호출해요. 저장이 실패하면 503, 현재 예약·다음 ID·중복 키는 그대로예요. 취소에도 같은 순서를 적용해요.','현재 상태를 먼저 바꾸고 저장하면 실패 때 되돌릴 항목을 빠뜨리기 쉬워요. 초안 → 저장 → 공개 순서로 정리해 보세요.','저장 실패 뒤 재시도에서 ID가 2가 되어야 할까요?',['항상 2여야 한다','실패한 변경은 공개되지 않았으므로 이 실습에서는 1을 유지한다','ID는 매번 무작위 문자여야 한다'],1,'service.js'),
('예약과 알림을 함께 기록','중급','아웃박스는 처리할 알림을 예약과 함께 저장하는 목록이에요. 알림 서버가 꺼져도 할 일을 잊지 않도록 해요.','예약 저장안에 created-{예약ID} 이벤트를 함께 넣어요. events()로 확인하고 flush(sink)로 보내요. 성공하면 sent를 저장해요. 전달 기록 저장에 실패하면 같은 ID로 재전송해요.','수신한 쪽도 이벤트 ID를 기억해야 중복 알림을 막을 수 있어요. 이 단계는 동기 sink로 전송 실패를 재현해요.','전송은 성공했지만 sent 저장에 실패했다면?',['같은 이벤트 ID로 재전송할 수 있고 수신 측도 중복을 걸러야 한다','반드시 한 번만 전송됐다고 보장한다','예약을 무조건 삭제한다'],0,'service.js'),
('재시도와 보류 목록','중급','계속 실패하는 작업을 쉬지 않고 다시 보내면 장애를 더 키워요. 기다렸다 재시도하고, 일정 횟수를 넘으면 사람이 확인할 목록으로 옮겨요.','options.now로 시간을 주입해요. 첫 실패 뒤 1초, 두 번째 실패 뒤 2초를 기다리고 세 번째 실패는 dead예요. replay(id)는 dead를 같은 ID로 다시 pending으로 바꿔요.','시간을 직접 주입하면 실제로 기다리지 않고도 경계 시점을 검사할 수 있어요. 미래 시각의 작업과 sent·dead는 건너뛰세요.','보류된 알림을 다시 보낼 때 이벤트 ID는?',['매번 새로 만든다','원래 ID를 유지한다','삭제한다'],1,'service.js'),
('전체 목록 대신 필요한 부분 찾기','중급','커서는 마지막으로 본 항목의 위치예요. 이진 탐색은 범위를 절반씩 좁혀 그 다음 위치를 찾는 방법이에요.','query.js의 page(ids, after, limit, read)는 정렬된 ID에서 after보다 큰 항목을 limit개 읽어요. {items,next}를 반환하며 마지막 페이지의 next는 null이에요. 5만 ID에서 20개를 찾을 때 ID 접근은 60회 이하예요.','시작 위치를 찾은 뒤 필요한 항목만 읽으세요. 전체 배열에 filter를 쓰면 뒤쪽 페이지에서도 처음부터 읽게 돼요.','커서가 40000인 페이지를 찾을 때 전체 5만 항목을 읽어야 하나요?',['항상 전부 읽는다','정렬된 ID라면 범위를 좁혀 시작 위치를 찾을 수 있다','사용자가 5만 번 눌러야 한다'],1,'query.js'),
('조회 인덱스 연결','시니어','인덱스는 원하는 데이터를 빠르게 찾기 위해 따로 만든 찾아보기예요. 조회는 빨라지지만 데이터가 바뀔 때 인덱스도 맞춰야 해요.','사용자별 정렬 ID와 ID별 예약 맵을 만들어요. GET /bookings는 {items,next}, limit 기본 20·최대 50, after 기본 0을 사용해요. 복원·취소·저장 성공 뒤 인덱스를 갱신해요.','이 실습은 읽기 경로의 탐색량을 검사해요. 저장 초안 복사와 인덱스 재구성 비용은 별도이며 실제 DB 인덱스 실습을 대체하지 않아요.','취소 뒤 인덱스를 갱신하지 않으면?',['이미 지운 예약을 다시 보여 줄 수 있다','모든 조회가 자동으로 빨라진다','권한 검사가 필요 없어진다'],0,'service.js'),
('로그와 장애 지표','시니어','로그는 한 요청에서 무슨 일이 있었는지 남긴 기록이에요. 실패율은 서비스 전체 상태를, P95는 느린 쪽 5% 경계의 응답 시간을 보여 줘요.','모든 응답에 requestId를 붙이고 logs()에 id·at·method·경로 종류·status·ms만 남겨요. 최근 100건 중 최근 5분의 요청 수·5xx 수·성공률·P95를 metrics()로 계산해요.','토큰과 예약자 이름은 로그에 남기지 않아요. 여기서는 표본 지표이며 대규모 서비스의 장기 SLO 계산은 별도 저장소가 필요해요.','401과 503 중 서버 장애 지표의 5xx에 들어가는 것은?',['둘 다','401만','503만'],2,'service.js'),
('요청 폭주 제한','시니어','요청 제한은 한 사용자의 과도한 요청이 다른 사용자까지 막지 않게 하는 장치예요. 이미 처리한 요청의 재전송은 새 예약 시도로 세지 않아요.','사용자마다 60초 동안 options.rateLimit회(기본 100)까지 변경을 허용해요. 초과는 429. 유효한 재요청은 제한보다 먼저 확인해요. 사용자별 제한은 서로 독립이고 정확히 60초에 새 구간이 시작해요.','읽기·입력 오류는 이 제한의 대상이 아니에요. 실제 서비스에서는 프로세스 여러 개가 같은 제한을 공유하도록 구성해야 해요.','같은 예약 재전송을 먼저 제한해 버리면?',['이미 성공한 결과를 확인하지 못할 수 있다','모든 데이터가 암호화된다','남의 예약을 볼 수 없다'],0,'service.js'),
('데이터 형식을 안전하게 바꾸기','시니어','마이그레이션은 저장 형식을 새 버전으로 옮기는 작업이에요. 새 서버와 이전 서버가 잠시 함께 돌아갈 수 있어서 읽기와 쓰기 변경 순서를 나눠야 해요.','migration.js의 migrate는 V1·V2를 읽고 원본을 바꾸지 않은 V2를 반환해요. 예약에 note 기본 빈 문자열을 추가해요. 새 서버는 두 버전을 읽고 기본으로 V1을 쓰며 writeVersion:2를 켜면 V2를 써요.','먼저 두 형식을 읽는 코드를 배포하고 확인한 뒤 새 형식 쓰기를 켜세요. V2를 쓴 이후에는 V1만 읽는 이전 판으로 바로 돌아가면 안 돼요.','V2 쓰기를 켜기 전에 필요한 준비는?',['파일 이름만 바꾼다','모든 실행 중인 서버가 V2를 읽을 수 있는지 확인한다','기존 데이터를 전부 지운다'],1,'migration.js'),
('살아 있음과 준비됨 구분','시니어','라이브니스는 프로세스가 살아 있는지, 레디니스는 지금 요청을 받아도 되는지 확인해요. 저장소가 고장 나면 살아 있어도 새 요청을 받으면 안 돼요.','GET /health/live는 200. GET /health/ready는 options.probe()가 true일 때 200, false·예외일 때 503이에요. 토큰 없이 확인할 수 있어야 해요.','로컬 서버 실행 파일은 저장 폴더에 임시 파일을 실제로 써 보고 준비 상태를 확인해요. 이 검사가 실제 배포를 수행하는 것은 아니에요.','저장소가 고장 나도 프로세스는 실행 중일 때 올바른 응답은?',['live 200, ready 503','live 503, ready 200','항상 둘 다 200'],0,'service.js'),
('내 테스트로 결함 잡기','시니어','회귀 검사는 새 기능을 넣었을 때 예전 기능이 깨지지 않았는지 확인해요. 변이 검사는 일부러 결함을 넣은 구현에도 내 테스트가 실패하는지 확인해요.','test.js의 verify(factory)는 정상 구현에서 예외 없이 끝나고, 정원·소유자·중복 키·저장 실패를 망가뜨린 5개 구현에서는 예외를 던져야 해요.','정상 예약만 검사하면 정원을 넘긴 예약이나 남의 취소를 놓쳐요. 실패 전후의 상태도 검사해 보세요.','정상 코드와 결함 코드가 모두 내 테스트를 통과한다면?',['테스트가 잡아야 할 조건이 빠졌을 수 있다','코드가 반드시 완벽하다','테스트 수만 늘리면 자동으로 해결된다'],0,'test.js'),
('혼자 확장: 취소도 재전송에 안전하게','시니어','처음부터 다시 만들지 않고, 지금까지 만든 서비스에 취소 재시도와 취소 알림을 추가해요. 앞 단계의 기능도 함께 검사해요.','DELETE의 키를 사용자·메서드·경로별로 기억해요. 같은 취소 재요청은 204, cancelled-{예약ID} 이벤트는 한 개예요. booking.cancelled 타입과 원래 예약 ID를 넣고, 저장 실패·재시작에도 상태를 지켜요.','요구사항과 실패 사례를 먼저 적고 구현해 보세요. 힌트·예시를 열면 도움을 사용한 기록으로 남아요.','예약과 취소에 같은 키가 쓰여도 구분할 수 있어야 하는 이유는?',['키를 더 길게 보이게 하려고','메서드와 경로가 다른 별개의 작업이어서','모든 요청을 거절하려고'],1,'service.js'),
]

project = {'id':'reservation-journey','em':'↗','lv':2,'servicePath':True,'title':'예약 서비스, 작은 기능에서 운영까지','sub':'입문 4단계 → 중급 7단계 → 시니어 7단계','brief':'앞에서 만든 예약 앱을 서버로 옮깁니다. 같은 코드에 기능을 쌓고, 저장 실패·중복 요청·장애를 직접 재현하며 고칩니다. 순서는 권장 경로이며 이미 아는 단계도 자유롭게 확인할 수 있습니다.','contract':'app.js는 validate, available, createService를 내보냅니다. createService(options)는 handle(method, path, body, headers)를 반환합니다. 응답은 {status, body}입니다. 동기 저장·알림 어댑터로 실패를 재현하며 최종 파일은 Node.js HTTP 서버에서도 실행합니다.','seed':{'app.js':"function validate(body) {\n  // 이름·시간·인원을 확인해 참 또는 거짓을 반환해요.\n  return false;\n}\nfunction available(bookings, slot) {\n  // 2단계에서 시간대별 남은 자리를 계산해요.\n  return 0;\n}\n"+wrappers,'service.js':service(1)},'days':[]}
solutions = []
for i, lesson in enumerate(lessons, 1):
    title, band, concept, requirement, hint, question, options, answer, focus = lesson
    checks = [t for group in groups[:i] for t in group]
    day = {'n':i,'title':title,'band':band,'concept':concept,'req':[requirement,'앞 단계에서 통과한 동작도 그대로 유지해요.'],'hint':hint,'focus':focus,'tests':checks,'quiz':{'question':question,'options':options,'answer':answer},'independent':i==18}
    if i == 11:
        day['addFiles'] = {'query.js':"function page(ids, after, limit, read) {\n  // after 다음 위치를 찾고 필요한 항목만 읽어요.\n  return { items: [], next: null };\n}\nmodule.exports = { page };\n"}
    if i == 15:
        day['addFiles'] = {'migration.js':"function migrate(raw) {\n  // 원본을 바꾸지 않고 V2를 반환해요.\n  throw new Error('마이그레이션을 구현해 주세요');\n}\nmodule.exports = { migrate };\n"}
    if i == 17:
        day['addFiles'] = {'test.js':"function verify(factory) {\n  // 정상 구현은 통과하고 결함 구현에서는 예외를 던져야 해요.\n}\nmodule.exports = { verify };\n"}
    if i >= 15:
        day['ref'] = validate + available + service(8 if i < 17 else 16).replace("const { validate, available } = require('./app');\n", '')
    project['days'].append(day)
    solutions.append(files(i))

data={'projects':[project],'sol':{project['id']:solutions}}
(repo/'data/service-project.js').write_text("/* One reservation service grows through implementation, failure handling and operations. */\n__CR('servicebuild',"+json.dumps(data,ensure_ascii=False,separators=(',',':'))+");\n",encoding='utf-8')
print(json.dumps({'stages':len(lessons),'uniqueChecks':sum(map(len,groups)),'cumulativeChecks':sum(len(d['tests']) for d in project['days'])}))
