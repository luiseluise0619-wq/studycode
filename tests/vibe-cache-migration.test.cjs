/* An old active worker and poisoned module cache, followed by a complete offline upgrade. */
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
let legacy = true;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  let body = fs.readFileSync(file);
  if (legacy && url.pathname === '/sw.js') body = body.toString()
    .replaceAll('v18-learning-bridges', 'v11-projects')
    .replace(/"\/data\/(?:service-[^"]+|build\.js)[^"]*",?\s*/g, '')
    .replaceAll('?v=18', '?v=11');
  if (legacy && (url.pathname === '/' || url.pathname === '/index.html')) body = body.toString()
    .replace(/<script src="data\/(?:service-(?:path|export|bridges)|reader-guide)\.js\?v=18"><\/script>\s*/g, '')
    .replaceAll('.js?v=18', '.js?v=11');
  const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.png': 'image/png' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
});
async function waitUntil(page, predicate, argument, description) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await page.evaluate(predicate, argument)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for ' + description);
}
async function waitVersion(page, expected) {
  await waitUntil(page, expected => new Promise(async resolve => {
    const registration = await navigator.serviceWorker.getRegistration(), worker = navigator.serviceWorker.controller;
    if (!worker || registration?.active?.state !== 'activated' || registration.installing || registration.waiting) { resolve(false); return; }
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 500);
    channel.port1.onmessage = e => { clearTimeout(timer); channel.port1.close(); resolve(e.data?.version === expected); };
    worker.postMessage({ type: 'version' }, [channel.port2]);
  }), expected, 'activated worker ' + expected);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : process.platform === 'win32' ? { channel: 'msedge' } : {});
  try {
    const context = await browser.newContext(), page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { if (top === window && !localStorage.getItem('coderun')) localStorage.setItem('coderun', JSON.stringify({ onboarded: true, goal: 'free', freeMode: true, recall: false })); });
    await page.goto(url); await page.waitForFunction(() => typeof VibeLab !== 'undefined');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      S.vibeLab.cart = { source: VibeLab.projects[0].source, missions: { quantity: { passed: true } } }; save();
    });
    await page.reload(); await waitVersion(page, 'v11-projects');
    await page.evaluate(async () => {
      const cache = await caches.open('coderun-data-v11-projects');
      for (const name of ['/data/vibe-lab.js', '/data/vibe-lab.js?v=11']) await cache.put(name, new Response('throw new Error("stale cached module was executed");', { headers: { 'Content-Type': 'text/javascript' } }));
    });
    legacy = false;
    await page.reload(); await page.waitForFunction(() => typeof ServicePath !== 'undefined' && VibeLab.projects.length === 30);
    assert.equal(await page.evaluate(() => S.vibeLab.cart.missions.quantity.passed), true); assert.deepEqual(errors, []);
    console.log('PASS old cached modules are bypassed and progress survives the update');
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
    await waitVersion(page, 'v18-learning-bridges');
    await waitUntil(page, async () => {
      const cache = await caches.open('coderun-shell-v18-learning-bridges');
      const names = ['vibe-lab', 'vibe-scenarios', 'vibe-challenges', 'vibe-projects', 'vibe-journey', 'service-path', 'service-bridges', 'service-export', 'service-project', 'build', 'reader-guide', 'study-ui', 'study-quality', 'code-literacy', 'learning-path'];
      const found = await Promise.all(names.map(name => cache.match('/data/' + name + '.js?v=18')));
      return found.every(Boolean) && !!(await cache.match('/index.html'));
    }, null, 'all current modules in the offline cache');
    await context.setOffline(true); await page.reload();
    await page.waitForFunction(() => typeof ServicePath !== 'undefined' && typeof ServiceBridges !== 'undefined' && typeof ReaderGuide !== 'undefined');
    assert.equal(await page.evaluate(() => S.vibeLab.cart.missions.quantity.passed), true);
    await page.evaluate(() => ServicePath.open());
    await page.waitForSelector('[data-service-day]');
    assert.equal(await page.locator('[data-service-day]').count(), 18); assert.equal(await page.evaluate(() => Object.keys(ReaderGuide.definitions).length), 182); assert.deepEqual(errors, []);
    console.log('PASS activated upgrade reopens offline with saved progress and all service stages');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
