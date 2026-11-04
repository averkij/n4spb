// Browser regression: saved reports survive reload WITHOUT re-running the game,
// worker transfer/error recording, blocked imports, storage/clipboard failures,
// bounded logging and phone layout. --full also boots the actual landing scene.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'n4spb-diagnostics-test-'));
const key = 'n4spb.loading-report.v1:/n4spb/';
const fixture = `
window.__mainStarted = true; window.__stats = { modules: {}, timing: {} };
document.getElementById('loadpct').textContent = '3%';
document.getElementById('loadlabel').textContent = 'field decoding';
document.getElementById('ver').textContent = 'test';
const worker = new Worker('./fixture-worker.js', {type: 'module'});
window.fixtureWorker = worker;
await new Promise(resolve => {
  worker.onmessage = e => { window.transferred = e.data.value[0] === 42; resolve(); };
  worker.postMessage({id: 1, url: './fixture.bin', rawBytes: 8});
});
window.fetched = (await (await fetch('./fixture-data')).json()).ok;
document.body.classList.add('loaded');
document.getElementById('loadpct').textContent = '100%';
document.getElementById('loadlabel').textContent = '';
`;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://test'), rel = decodeURIComponent(url.pathname).replace(/^\/n4spb\//, '');
  if (rel === 'fixture-worker.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(`onmessage = ({data}) => { const value = new Uint8Array(8); value[0] = 42; setTimeout(() => postMessage({id: data.id, value, bytes: 8, readMs: 5, decodeMs: 1}, [value.buffer]), 50); };`); }
  if (rel === 'fixture-data') { res.setHeader('Content-Type', 'application/json'); return res.end('{"ok":true}'); }
  if (rel === 'fixture-hold') return; // Deliberate pending fetch; closed with the test worker/server.
  const file = path.resolve(root, rel);
  if (!file.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' })[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/n4spb/`;
const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const browser = await puppeteer.launch({ executablePath, headless: true, protocolTimeout: 180000,
  args: ['--use-angle=d3d11', '--enable-gpu', '--no-first-run', '--disable-extensions'] });
async function open({ full = false, block = false, storageDenied = false, probeTimeout = false } = {}) {
  const context = await browser.createBrowserContext(), page = await context.newPage();
  await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  let mainRequests = 0;
  if (storageDenied) await page.evaluateOnNewDocument(() => { Storage.prototype.setItem = () => { throw Error('Storage blocked'); }; });
  if (probeTimeout) await page.evaluateOnNewDocument(() => {
    Worker.prototype.postMessage = () => {}; // Reproduce a worker that never replies.
    const schedule = window.setTimeout;
    window.setTimeout = (fn, ms, ...args) => schedule(fn, ms === 90000 ? 300 : ms, ...args);
  });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.endsWith('/src/main.js')) {
      mainRequests++;
      if (block) return request.abort();
      if (!full) return request.respond({ status: 200, contentType: 'text/javascript', body: fixture });
    }
    const match = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(url);
    if (match) return request.respond({ status: 200, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(path.join(root, 'node_modules/three', match[1])) });
    if (/^https:\/\/fonts\./.test(url)) return request.abort();
    request.continue();
  });
  await page.goto(base + 'diagnostics.html', { waitUntil: 'domcontentloaded' });
  return { page, context, errors, mainRequests: () => mainRequests };
}
const read = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
const show = page => page.click('#diag-toggle');
try {
  const t = await open(); const { page } = t;
  assert.equal(t.mainRequests(), 0, 'game waits for Start');
  assert.equal(await page.$eval('#load-diag', e => e.hidden), false);
  assert.equal(await page.$eval('#diag-hide', e => e.disabled), true, 'cannot expose an unstarted 0% scene');
  assert((await page.$eval('#diag-version', e => e.textContent)).includes(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version));
  await page.screenshot({ path: path.join(out, 'portrait-paused.png') });
  await page.type('#diag-device', 'iPhone 16 Pro Max, iOS 26.7');
  await page.click('#diag-start');
  await page.waitForFunction(() => document.body.classList.contains('loaded'));
  await page.waitForFunction(k => JSON.parse(localStorage.getItem(k))?.current.loaded, {}, key);
  let data = await read(page);
  assert.equal(await page.evaluate(() => window.transferred && window.fetched), true, 'worker payload and fetch response forwarded intact');
  assert(data.current.events.some(e => e.kind === 'worker:decoded' && e.detail.includes('8 bytes')));
  assert(data.current.events.some(e => e.kind === 'fetch:headers'));
  assert.equal(data.current.deviceNote, 'iPhone 16 Pro Max, iOS 26.7');
  const id = data.current.id;
  const originalPageId = data.current.page.id;
  await show(page);
  assert.equal(await page.$eval('#diag-hide', e => e.disabled), false);
  assert.match(await page.$eval('#diag-status', e => e.textContent), /^Live attempt/);
  await page.click('#diag-hide');
  assert.equal(await page.$eval('#load-diag', e => e.hidden), true);
  assert.equal(await page.$eval('#loadpct', e => e.textContent), '100%', 'showing the game does not reset progress');
  assert((await read(page)).current.events.some(e => e.kind === 'ui:show-game' && e.detail.includes('loaded=true')));
  // Capture a real DOM regression immediately, rather than waiting for the
  // heartbeat; distinguish this from reopening a document with a saved report.
  await show(page);
  await page.evaluate(() => { document.getElementById('loadpct').textContent = '0%'; });
  await page.click('#diag-show');
  const liveExport = JSON.parse(await page.$eval('#diag-output', e => e.value));
  assert.equal(liveExport.currentPage.reportSource, 'live');
  assert.equal(liveExport.currentPage.reportFromCurrentPage, true);
  assert.equal(liveExport.currentPage.visibleProgress, '0%');
  assert(liveExport.report.events.some(e => e.kind === 'progress:regressed'));
  await page.evaluate(() => { document.getElementById('loadpct').textContent = '100%'; });
  await page.evaluate(() => {
    fixtureWorker.postMessage({ id: 2, url: './fixture.bin?secret=redact-me', rawBytes: 8 });
    for (let i = 0; i < 170; i++) console.warn('bounded log', i);
  });
  data = await read(page);
  assert(data.current.events.length <= 140);
  assert(!JSON.stringify(data).includes('redact-me'), 'request query redacted');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(t.mainRequests(), 1, 'reload pauses before importing the game again');
  assert.equal((await read(page)).current.id, id, 'last report not overwritten by page open');
  assert.equal(await page.$eval('#diag-hide', e => e.disabled), true);
  assert.match(await page.$eval('#diag-status', e => e.textContent), /^Saved attempt/);
  await page.click('#diag-hide');
  assert.equal(await page.$eval('#load-diag', e => e.hidden), false);
  await page.click('#diag-copy');
  // Clipboard may work on localhost; force the fallback as on an insecure LAN URL.
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
  await page.click('#diag-copy');
  assert.equal(await page.$eval('#diag-output', e => e.hidden), false);
  const recoveredExport = JSON.parse(await page.$eval('#diag-output', e => e.value));
  assert.equal(recoveredExport.report.id, id);
  assert.equal(recoveredExport.report.page.id, originalPageId);
  assert.notEqual(recoveredExport.currentPage.id, originalPageId);
  assert.equal(recoveredExport.currentPage.testStarted, false);
  assert.equal(recoveredExport.currentPage.reportSource, 'saved');
  assert.equal(recoveredExport.currentPage.reportFromCurrentPage, false);
  assert.equal(recoveredExport.currentPage.navigationType, 'reload');
  await page.screenshot({ path: path.join(out, 'recovered-report.png') });
  await page.select('#diag-worker', '0');
  await page.click('#diag-compile');
  await page.click('#diag-start');
  await page.waitForFunction(() => document.body.classList.contains('loaded'));
  data = await read(page);
  assert.equal(data.previous.id, id, 'previous attempt preserved when starting comparison');
  assert.equal(data.current.options.bakedworker, '0');
  assert.equal(data.current.options.earlycompile, '0');
  await show(page); await page.click('#diag-previous'); await page.click('#diag-show');
  assert.equal(JSON.parse(await page.$eval('#diag-output', e => e.value)).report.id, id);
  await page.evaluate(() => document.getElementById('scene').dispatchEvent(new Event('webglcontextlost')));
  assert.equal((await read(page)).current.status, 'Graphics context lost');
  await t.context.close();

  const blocked = await open({ block: true });
  await blocked.page.click('#diag-start');
  await blocked.page.waitForFunction(k => JSON.parse(localStorage.getItem(k))?.current.status === 'Main module failed', {}, key);
  assert(!(await blocked.page.evaluate(() => window.__mainStarted)), 'import failure recorded before game starts');
  await show(blocked.page);
  await blocked.page.screenshot({ path: path.join(out, 'import-failure.png') });
  await blocked.context.close();

  const denied = await open({ storageDenied: true });
  await denied.page.click('#diag-start');
  await denied.page.waitForFunction(() => document.body.classList.contains('loaded'));
  await show(denied.page); await denied.page.click('#diag-show');
  const memoryOnly = JSON.parse(await denied.page.$eval('#diag-output', e => e.value));
  assert(memoryOnly.storageWarning.includes('unavailable'));
  assert(memoryOnly.report.events.length > 0, 'in-memory export works without storage');
  assert.deepEqual(denied.errors, []);
  await denied.context.close();

  // Real gzip data and the shipping module worker, with no game bootstrap or
  // WebGL context. Cover both serial requests and the original startup burst.
  for (const mode of ['assets-sequential', 'assets-burst']) {
    const isolated = await open();
    await isolated.page.select('#diag-test', mode);
    await isolated.page.screenshot({ path: path.join(out, mode + '-options.png') });
    await isolated.page.click('#diag-start');
    await isolated.page.waitForFunction(k => JSON.parse(localStorage.getItem(k))?.current.status === 'Assets test passed', { timeout: 100000 }, key);
    const result = (await read(isolated.page)).current;
    assert.equal(result.probe.completed.length, 7);
    assert(result.probe.bytes > 100000000);
    assert.equal(result.test, mode);
    assert.equal(Object.keys(result.pending).length, 0);
    assert.equal(result.events.filter(e => e.kind === 'worker:decoded').length, 7);
    assert.equal(isolated.mainRequests(), 0, 'asset test never imports main');
    assert.equal(await isolated.page.$eval('#diag-hide', e => e.disabled), true, 'completed asset test has no game to show');
    assert.equal(await isolated.page.evaluate(() => !!window.__ctx), false, 'asset test creates no renderer/scene');
    assert.deepEqual(isolated.errors, []);
    fs.writeFileSync(path.join(out, mode + '-report.json'), JSON.stringify(result, null, 2));
    await isolated.page.screenshot({ path: path.join(out, mode + '-passed.png') });
    await isolated.page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal((await read(isolated.page)).current.id, result.id);
    assert.equal(isolated.mainRequests(), 0);
    assert.equal(await isolated.page.$eval('#diag-test', e => e.value), mode);
    await isolated.context.close();
  }

  const hung = await open({ probeTimeout: true });
  await hung.page.select('#diag-test', 'assets-burst');
  await hung.page.click('#diag-start');
  await hung.page.waitForFunction(k => JSON.parse(localStorage.getItem(k))?.current.status === 'Assets test failed', {}, key);
  const timeoutReport = (await read(hung.page)).current;
  assert(timeoutReport.events.some(e => e.kind === 'probe:error' && e.detail.includes('90 seconds')));
  assert.equal(Object.keys(timeoutReport.pending).length, 0, 'timed out worker requests are terminated');
  assert.equal(hung.mainRequests(), 0, 'timeout never falls back to building the scene');
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.deepEqual(hung.errors, [], 'cancelling the probe does not create unhandled rejections');
  await hung.context.close();

  const riverfront = await open();
  await riverfront.page.select('#diag-test', 'riverfront');
  await riverfront.page.click('#diag-start');
  await riverfront.page.waitForFunction(k => JSON.parse(localStorage.getItem(k))?.current.status === 'Riverfront test passed', { timeout: 100000 }, key);
  const riverReport = (await read(riverfront.page)).current;
  assert(riverReport.riverfront.triangles > 10000);
  assert(Object.keys(riverReport.riverfront.parts).length > 0);
  assert(!riverReport.events.some(e => e.kind === 'worker:created'));
  assert.equal(riverfront.mainRequests(), 0);
  assert.equal(await riverfront.page.evaluate(() => !!window.__ctx), false);
  assert.deepEqual(riverfront.errors, []);
  await riverfront.page.screenshot({ path: path.join(out, 'riverfront-passed.png') });
  fs.writeFileSync(path.join(out, 'riverfront-report.json'), JSON.stringify(riverReport, null, 2));
  await riverfront.context.close();

  const trace = await open();
  await trace.page.select('#diag-test', 'scene-staged');
  await trace.page.click('#diag-start');
  await trace.page.waitForFunction(() => document.body.classList.contains('loaded'));
  await trace.page.evaluate(() => {
    window.__stats.modules.landmarksRiverfront = { ms: 1 };
    window.traceReplies = [];
    window.traceWorker = new Worker('./src/core/baked-worker.js', { type: 'module' });
    traceWorker.onmessage = e => traceReplies.push(e.data);
    traceWorker.postMessage({ id: 501, url: new URL('./fixture-hold', location.href).href, rawBytes: 8 });
  });
  await trace.page.waitForFunction(k => JSON.parse(localStorage.getItem(k))?.current.workerTrace?.heartbeatMs > 0, {}, key);
  const waiting = (await read(trace.page)).current;
  assert(Object.values(waiting.pending).some(p => p.workerPhase === 'fetch'));
  assert.equal(await trace.page.evaluate(() => traceReplies.length), 0, 'phase messages never reach the asset consumer');
  await trace.page.evaluate(() => traceWorker.terminate());
  assert.equal(Object.keys((await read(trace.page)).current.pending).length, 0);
  await trace.page.evaluate(() => {
    window.traceWorker = new Worker('./src/core/baked-worker.js', { type: 'module' });
    traceWorker.onmessage = e => traceReplies.push(e.data);
    traceWorker.postMessage({ id: 502, url: new URL('./missing-probe-file', location.href).href, rawBytes: 8 });
  });
  await trace.page.waitForFunction(() => traceReplies.length === 1);
  assert.equal(await trace.page.evaluate(() => traceReplies[0].error), 'HTTP 404');
  assert.deepEqual(trace.errors, []);
  await trace.context.close();

  if (process.argv.includes('--full')) {
    const real = await open({ full: true });
    await real.page.setViewport({ width: 956, height: 440, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const jsGzip = process.argv.includes('--js-gzip');
    const staged = process.argv.includes('--staged') || jsGzip;
    if (staged) await real.page.select('#diag-test', jsGzip ? 'scene-js-gzip' : 'scene-staged');
    // Capture all worker events before the bounded on-phone journal rolls over.
    const workerEvents = [];
    await real.page.exposeFunction('recordWorkerEvent', entry => workerEvents.push(entry));
    await real.page.evaluate(() => {
      const persist = Storage.prototype.setItem; let last = '';
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith('n4spb.loading-report.v1:')) {
          const entry = JSON.parse(value)?.current?.events?.at(-1), id = JSON.stringify(entry);
          if (entry && id !== last) { last = id; if (entry.kind.startsWith('worker:') || entry.kind.startsWith('gpu:')) void window.recordWorkerEvent(entry); }
        }
        return persist.call(this, key, value);
      };
    });
    await real.page.click('#diag-start');
    await real.page.waitForSelector('#fatal button', { timeout: 60000 });
    await real.page.click('#fatal button');
    await real.page.waitForFunction(() => document.body.classList.contains('loaded'), { timeout: 240000 });
    await real.page.click('#go');
    await real.page.waitForFunction(() => document.body.classList.contains('playing'));
    await show(real.page);
    await real.page.screenshot({ path: path.join(out, 'full-scene-diagnostics.png') });
    data = await read(real.page);
    assert.equal(data.current.baked.decoder.mode, 'worker');
    assert.deepEqual(data.current.baked.failures, []);
    assert.deepEqual(await real.page.evaluate(() => window.__errors), []);
    assert.deepEqual(real.errors, []);
    assert(workerEvents.some(e => e.kind === 'gpu:compile:start'));
    assert(workerEvents.some(e => e.kind === 'gpu:render:end'));
    fs.writeFileSync(path.join(out, 'full-scene-events.json'), JSON.stringify(workerEvents, null, 2));
    if (staged) {
      for (const phase of ['fetch', 'headers', ...(jsGzip ? ['download-compressed', 'import-js-inflater', 'inflate-js'] : ['decompress']), 'decode', 'transfer', 'transferred'])
        assert(workerEvents.some(e => e.kind === 'worker:phase' && e.detail.startsWith(phase + ' ')), `traced worker reports ${phase}`);
      if (jsGzip) assert(!workerEvents.some(e => e.kind === 'worker:phase' && e.detail.startsWith('decompress ')), 'JS mode bypasses native decompression');
      let active = 0, sent = 0;
      for (const e of workerEvents) {
        if (e.kind === 'worker:sent') { active++; sent++; assert.equal(active, 1, 'at most one active decode'); }
        if (e.kind === 'worker:decoded' || e.kind === 'worker:asset-error') { active--; assert(active >= 0); }
      }
      assert(sent - active >= 7);
      assert(active === 0 || active === 1); // Region streaming can start another request after entering play.
      const firstSend = workerEvents.findIndex(e => e.kind === 'worker:sent');
      const firstCompile = workerEvents.findIndex(e => e.kind === 'gpu:compile:end');
      assert(firstCompile >= 0 && firstSend > firstCompile, 'first decode waits for riverfront early compile');
    }
    fs.writeFileSync(path.join(out, 'full-scene-report.json'), JSON.stringify(data, null, 2));
    await real.page.click('#diag-hide');
    await real.page.screenshot({ path: path.join(out, 'full-scene-playing.png') });
    await real.page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(real.mainRequests(), 1, 'full-scene report survives reload without auto-start');
    assert.equal((await read(real.page)).current.id, data.current.id);
    await real.context.close();
  }
  console.log('RESULT: OK (paused recovery, worker transfer, import failure, bounded reports, comparison, clipboard/storage fallback, isolated real assets serial/burst, worker timeout, riverfront geometry' + (process.argv.includes('--full') ? ', real scene + reload' : '') + ')');
  console.log(`Evidence: ${out}`);
} finally {
  await browser.close();
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
