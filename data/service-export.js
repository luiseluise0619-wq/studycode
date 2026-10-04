(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ServiceExport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function runtime(sources) {
    'use strict';
    const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
    const crypto = require('node:crypto'), os = require('node:os'), assert = require('node:assert/strict');
    const cache = Object.create(null);
    function load(name) {
      const key = name.replace(/^\.\//, '').replace(/\.js$/, '') + '.js';
      if (!Object.prototype.hasOwnProperty.call(sources, key)) throw new Error('실습 파일을 찾지 못했어요: ' + key);
      if (cache[key]) return cache[key].exports;
      const item = { exports: {} }; cache[key] = item;
      new Function('module', 'exports', 'require', sources[key])(item, item.exports, load);
      return item.exports;
    }
    const app = load('./app');
    const UI = '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>내 예약 서버</title><style>body{font:15px/1.8 system-ui,sans-serif;background:#f7f4ee;color:#292824;max-width:620px;margin:40px auto;padding:20px}input,select,button{font:inherit;padding:10px;border:1px solid #d6d0c6;border-radius:5px;max-width:100%;box-sizing:border-box}label{display:block;margin:15px 0}input{width:100%}button{cursor:pointer;background:#be512e;color:white}article{padding:14px 0;border-bottom:1px solid #d6d0c6}small{color:#756d63}#status{white-space:pre-wrap;overflow-wrap:anywhere}form{margin:24px 0}</style><main><small>코드런 · 내가 만든 서버</small><h1>예약이 서버에 저장돼요</h1><p>터미널에 나온 사용자 토큰을 붙여 넣어요. 서버를 종료하고 다시 켜도 예약은 저장 파일에서 복원됩니다.</p><label>사용자 토큰 <input id="token" autocomplete="off" type="password"></label><button id="refresh">내 예약 확인</button><p id="slots"></p><form id="form"><label>이름 <input id="name" maxlength="40" required></label><label>시간 <select id="slot"><option>10:00</option><option>14:00</option></select></label><label>인원 <input id="seats" type="number" min="1" max="4" value="1" required></label><button>예약하기</button></form><p id="status" role="status"></p><div id="list"></div><p><a href="/health/ready">서버 준비 상태 확인</a></p></main><script>const $=id=>document.getElementById(id);async function request(method,url,body,key){const r=await fetch(url,{method,headers:{"Content-Type":"application/json","Authorization":"Bearer "+$("token").value,...(key?{"Idempotency-Key":key}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=r.status===204?null:await r.json();if(!r.ok)throw new Error(r.status+" · "+(data?.error||"요청 실패"));return data;}async function refresh(){const slots=await request("GET","/slots");$("slots").textContent=slots.map(s=>s.slot+" 남은 자리 "+s.remaining+"명").join(" / ");const data=await request("GET","/bookings?limit=50");$("list").replaceChildren();for(const b of data.items){const row=document.createElement("article"),text=document.createElement("span"),btn=document.createElement("button");text.textContent=b.name+" · "+b.slot+" · "+b.seats+"명 ";btn.textContent="취소";btn.onclick=()=>action(async()=>{await request("DELETE","/bookings/"+b.id,null,crypto.randomUUID());await refresh();});row.append(text,btn);$("list").append(row);}}async function action(fn){try{await fn();$("status").textContent="서버에 반영했어요";}catch(e){$("status").textContent=e.message;}}$("refresh").onclick=()=>action(refresh);$("form").onsubmit=e=>{e.preventDefault();const button=e.submitter;button.disabled=true;const key=crypto.randomUUID();action(async()=>{await request("POST","/bookings",{name:$("name").value,slot:$("slot").value,seats:Number($("seats").value)},key);await refresh();}).finally(()=>button.disabled=false);};</script></html>';
    async function start(options = {}) {
      const dir = path.resolve(options.dir || path.join(__dirname, 'my-reservation-data'));
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, 'bookings.json');
      const tokens = options.tokens || { [crypto.randomBytes(24).toString('hex')]: 'alice', [crypto.randomBytes(24).toString('hex')]: 'bob' };
      const suppliedPort = options.port === undefined ? Number(process.env.PORT || 8788) : options.port;
      if (!Number.isInteger(suppliedPort) || suppliedPort < 0 || suppliedPort > 65535) throw new Error('포트는 0~65535 정수여야 해요.');
      const lock = path.join(dir, '.server.lock');
      let lockFd;
      try { lockFd = fs.openSync(lock, 'wx', 0o600); fs.writeFileSync(lockFd, String(process.pid)); }
      catch (_) { throw new Error('같은 저장 폴더를 쓰는 서버가 있거나 이전 잠금이 남았어요. 서버가 종료됐는지 확인한 뒤 .server.lock을 점검하세요.'); }
      const unlock = () => { if (lockFd !== undefined) { fs.closeSync(lockFd); lockFd = undefined; fs.unlinkSync(lock); } };
      try {
      function probe() {
        const name = path.join(dir, '.ready-' + crypto.randomBytes(8).toString('hex'));
        try { fs.writeFileSync(name, '', { flag: 'wx' }); fs.unlinkSync(name); return true; }
        catch (_) { try { fs.unlinkSync(name); } catch (_) {} return false; }
      }
      function save(raw) {
        if (options.failSave?.()) throw new Error('실습: 저장 실패');
        const temporary = path.join(dir, '.bookings-' + crypto.randomBytes(8).toString('hex') + '.tmp');
        try {
          const fd = fs.openSync(temporary, 'wx', 0o600);
          try { fs.writeFileSync(fd, raw, 'utf8'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
          fs.renameSync(temporary, file);
        } finally { try { fs.unlinkSync(temporary); } catch (_) {} }
      }
      // A bad snapshot aborts startup. It must not overwrite the user's original file.
      const service = app.createService({ snapshot: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined,
        tokens, save, probe, rateLimit: options.rateLimit || 100, writeVersion: options.writeVersion || 1 });
      const server = http.createServer(async (req, res) => {
        const send = (status, body, type = 'application/json; charset=utf-8') => {
          res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(type.startsWith('text/html') ? { 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } : {}) });
          res.end(status === 204 ? undefined : type.startsWith('text/html') ? body : JSON.stringify(body));
        };
        try {
          const url = new URL(req.url, 'http://127.0.0.1');
          if (req.method === 'GET' && url.pathname === '/') { send(200, UI, 'text/html; charset=utf-8'); return; }
          let body;
          if (req.method === 'POST' || req.method === 'DELETE') {
            let size = 0; const chunks = [];
            for await (const chunk of req) {
              size += chunk.length;
              if (size > 16384) { send(413, { error: 'request too large' }); req.resume(); return; }
              chunks.push(chunk);
            }
            const data = Buffer.concat(chunks).toString('utf8');
            if (data) { try { body = JSON.parse(data); } catch (_) { send(400, { error: 'invalid JSON' }); return; } }
          } else if (req.method === 'GET' && url.pathname === '/bookings') {
            body = {};
            for (const key of ['limit', 'after']) if (url.searchParams.has(key)) body[key] = Number(url.searchParams.get(key));
          }
          const result = service.handle(req.method, url.pathname, body, { Authorization: req.headers.authorization, 'Idempotency-Key': req.headers['idempotency-key'] });
          if (result.requestId) res.setHeader('X-Request-Id', result.requestId);
          send(result.status, result.body);
        } catch (_) { send(500, { error: 'internal error' }); }
      });
      server.requestTimeout = 10000; server.headersTimeout = 10000;
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(suppliedPort, '127.0.0.1', resolve); });
      return { server, service, tokens, dir, file, url: 'http://127.0.0.1:' + server.address().port,
        close: () => new Promise((resolve, reject) => { server.close(error => { try { unlock(); } catch (e) { reject(e); return; } error ? reject(error) : resolve(); }); server.closeIdleConnections(); }) };
      } catch (error) { unlock(); throw error; }
    }
    async function selfCheck() {
      load('./test').verify(app.createService);
      const tempRoot = path.resolve(os.tmpdir());
      const dir = fs.mkdtempSync(path.join(tempRoot, 'coderun-reservation-'));
      let running, fail = false;
      try {
        const tokens = { 'check-alice': 'alice', 'check-bob': 'bob' };
        const boot = () => start({ dir, port: 0, tokens, failSave: () => fail });
        running = await boot();
        await assert.rejects(boot());
        async function request(method, route, body, who = 'check-alice', key) {
          const response = await fetch(running.url + route, { method, headers: { Authorization: 'Bearer ' + who,
            'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
          return { status: response.status, body: response.status === 204 ? null : await response.json() };
        }
        const body = { name: '재시작 검사', slot: '10:00', seats: 2 };
        const first = await request('POST', '/bookings', body, 'check-alice', 'retry');
        assert.equal(first.status, 201);
        assert.equal((await request('POST', '/bookings', body, 'check-alice', 'retry')).body.id, first.body.id);
        assert.equal((await request('DELETE', '/bookings/' + first.body.id, null, 'check-bob')).status, 404);
        const saved = fs.readFileSync(running.file, 'utf8');
        fail = true;
        assert.equal((await request('POST', '/bookings', body)).status, 503);
        assert.equal(fs.readFileSync(running.file, 'utf8'), saved);
        fail = false;
        await running.close(); running = await boot();
        assert.equal((await request('POST', '/bookings', body, 'check-alice', 'retry')).body.id, first.body.id);
        assert.equal((await request('GET', '/bookings')).body.items.length, 1);
        assert.equal((await request('DELETE', '/bookings/' + first.body.id, null, 'check-alice', 'cancel')).status, 204);
        assert.equal((await request('DELETE', '/bookings/' + first.body.id, null, 'check-alice', 'cancel')).status, 204);
        assert.equal((await request('GET', '/slots')).body[0].remaining, 4);
        assert.equal((await request('GET', '/health/ready')).status, 200);
        await running.close(); running = undefined;
        const file = path.join(dir, 'bookings.json'); fs.writeFileSync(file, 'broken snapshot');
        await assert.rejects(boot()); assert.equal(fs.readFileSync(file, 'utf8'), 'broken snapshot');
        fs.writeFileSync(file, ''); await assert.rejects(boot()); assert.equal(fs.readFileSync(file, 'utf8'), '');
        console.log('통과: 내 회귀 검사·실제 HTTP·중복 요청·권한·저장 실패·취소·재시작·준비 상태·깨진 저장 보존·동시 실행 방지');
      } finally {
        if (running) await running.close();
        const resolved = path.resolve(dir);
        if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('coderun-reservation-')) throw new Error('검사 폴더 경로가 예상과 다릅니다.');
        fs.rmSync(resolved, { recursive: true, force: true });
      }
    }
    module.exports = { app, start, selfCheck };
    if (require.main === module) {
      const action = process.argv.includes('--check') ? selfCheck() : start().then(running => {
        console.log('내 예약 서버: ' + running.url);
        console.log('저장 파일: ' + running.file);
        for (const [token, user] of Object.entries(running.tokens)) console.log(user + ' 사용자 토큰: ' + token);
        console.log('토큰을 화면에 붙여 넣으세요. Ctrl+C로 종료하고 다시 실행하면 예약을 복원합니다.');
        console.log('단일 프로세스·로컬 실습용입니다. /health/ready가 503이면 저장 폴더를 점검하세요.');
        let closing = false;
        const shutdown = () => { if (closing) return; closing = true; running.close().then(() => { process.exitCode = 0; }).catch(error => { console.error(error.message); process.exitCode = 1; }); };
        process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
      });
      action.catch(error => { console.error('실행하지 못했어요. 원본 저장 파일을 보존하고 원인을 확인하세요.\n' + error.message); process.exitCode = 1; });
    }
  }
  function bundle(files) {
    return '// 코드런에서 작성한 예약 서버. Node.js에서 실행하세요.\n' +
      '// 검사: node my-reservation-server.cjs --check\n' +
      '// 실행: node my-reservation-server.cjs\n' +
      '// 배포 연습: V1·V2 읽기 배포 → 준비 상태 확인 → V2 쓰기 전환.\n' +
      '// 복구: 쓰기 중단 → 저장 파일 보관 → 같은 형식을 읽는 판으로 복원 → --check → ready 확인.\n' +
      '(' + runtime.toString() + ')(' + JSON.stringify(files) + ');\n';
  }
  return { bundle };
});
