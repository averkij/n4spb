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
  await page.evaluate((key) => {
    const id = JSON.parse(localStorage.getItem(key)).current.id;
    localStorage.setItem(key + ':draw', JSON.stringify({ runId: id, draw: { number: 7, status: 'entered', object: 'crash checkpoint fixture' },
      colourGL: { draw: 7, call: 'texSubImage2D', status: 'entered' },
      canvasUpload: { number: 5, phase: 'upload:entered', width: 512, height: 96 } }));
  }, key);
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
  assert.equal(recoveredExport.report.lastColourDraw.status, 'entered', 'recovers draw checkpoint newer than the full report');
  assert.equal(recoveredExport.report.lastColourDraw.number, 7);
  assert.equal(recoveredExport.report.lastColourGL.call, 'texSubImage2D');
  assert.equal(recoveredExport.report.lastColourGL.status, 'entered');
  assert.equal(recoveredExport.report.canvasUpload.phase, 'upload:entered');
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

  const cap = await open();
  const capResult = await cap.page.evaluate(async () => {
    const THREE = await import('three');
    const { reduceCanvasTextures, plainGround, reduceSignAtlases } = await import('./src/core/loading-finalize-diagnostics.js');
    const root = new THREE.Group(), dynamicRoot = new THREE.Group();
    const make = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const c = make(512, 256), g = c.getContext('2d');
    g.fillStyle = '#ff0000'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#0000ff'; g.fillRect(256, 0, 256, 256);
    const texture = new THREE.CanvasTexture(c), alias = texture.clone();
    const mesh = t => new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({ map: t }));
    root.add(mesh(texture), mesh(alias));
    const shared = new THREE.CanvasTexture(make(1024, 512)); root.add(mesh(shared)); dynamicRoot.add(mesh(shared));
    const data = new THREE.DataTexture(new Uint8Array(512 * 512 * 4), 512, 512); root.add(mesh(data));
    const uv = Array.from(root.children[0].geometry.attributes.uv.array), version = texture.version;
    const stats = reduceCanvasTextures(root, dynamicRoot, 256);
    const groundMat = new THREE.MeshToonMaterial({ polygonOffset: true, polygonOffsetFactor: 2 }); groundMat.name = 'env-ground';
    const groundGeo = new THREE.PlaneGeometry(), ground = new THREE.Mesh(groundGeo, groundMat), other = new THREE.Mesh(groundGeo, groundMat);
    ground.name = other.name = 'env-ground'; ground.userData.noBatch = true; ground.position.set(1, 2, 3);
    root.add(ground, other);
    const plain = plainGround(root, THREE);
    const signCanvas = make(2048, 2048), signTex = new THREE.CanvasTexture(signCanvas), signAlias = new THREE.CanvasTexture(signCanvas);
    const sign = mesh(signTex), movingSign = mesh(signAlias); sign.material.name = movingSign.material.name = 'pt-sign-atlas';
    root.add(sign); dynamicRoot.add(movingSign);
    const signUV = Array.from(sign.geometry.attributes.uv.array), signVersion = signAlias.version;
    const signs = reduceSignAtlases(root, dynamicRoot, 1024);
    return { stats, dimensions: [c.width, c.height], aliasSame: alias.image === c && texture.image === c,
      signs, signDimensions: [signCanvas.width, signCanvas.height], signShared: signTex.image === signAlias.image,
      signInvalidated: signAlias.version > signVersion, signUVUnchanged: JSON.stringify(signUV) === JSON.stringify(Array.from(sign.geometry.attributes.uv.array)),
      plain, geometrySame: ground.geometry === groundGeo && other.geometry === groundGeo,
      groundShared: ground.material === other.material, groundType: ground.material.type,
      flagsKept: ground.userData.noBatch && ground.material.polygonOffsetFactor === 2 && ground.position.x === 1,
      invalidated: texture.version > version, shared: [shared.image.width, shared.image.height], dataWidth: data.image.width,
      red: Array.from(g.getImageData(10, 10, 1, 1).data), blue: Array.from(g.getImageData(240, 10, 1, 1).data),
      uvUnchanged: JSON.stringify(uv) === JSON.stringify(Array.from(root.children[0].geometry.attributes.uv.array)) };
  });
  assert.equal(capResult.stats.changed, 1);
  assert.deepEqual(capResult.plain, { meshes: 2, materials: 1 });
  assert(capResult.geometrySame && capResult.groundShared && capResult.flagsKept);
  assert.equal(capResult.groundType, 'MeshBasicMaterial');
  assert.equal(capResult.signs.changed, 1);
  assert.deepEqual(capResult.signDimensions, [1024, 1024]);
  assert(capResult.signShared && capResult.signInvalidated && capResult.signUVUnchanged);
  assert.deepEqual(capResult.dimensions, [256, 128]);
  assert(capResult.aliasSame && capResult.invalidated && capResult.uvUnchanged);
  assert.deepEqual(capResult.shared, [1024, 512]);
  assert.equal(capResult.dataWidth, 512);
  assert.deepEqual(capResult.red, [255, 0, 0, 255]); assert.deepEqual(capResult.blue, [0, 0, 255, 255]);
  assert.deepEqual(cap.errors, []);
  await cap.context.close();

  // Verify the changed TexImageSource path against native canvas upload,
  // including orientation, alpha, subimage offsets and live canvas updates.
  const pixelTest = await open();
  const pixels = await pixelTest.page.evaluate(async () => {
    const { installCanvasPixelUploads } = await import('./src/core/loading-finalize-diagnostics.js');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2;
    const ctx = canvas.getContext('2d');
    const paint = () => ctx.putImageData(new ImageData(new Uint8ClampedArray([
      255,0,0,255, 0,255,0,128, 0,0,255,255, 255,255,255,0
    ]), 2, 2), 0, 0);
    paint();
    const output = document.createElement('canvas'), gl = output.getContext('webgl2');
    const texture = gl.createTexture(), fb = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const records = [];
    const upload = (sub, source) => {
      if (sub) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, source);
      } else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      const data = new Uint8Array(16); gl.readPixels(sub ? 1 : 0, sub ? 1 : 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return Array.from(data);
    };
    let matches = 0;
    for (const flip of [false, true]) for (const premultiply of [false, true]) for (const sub of [false, true]) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
      const direct = upload(sub, canvas);
      const restore = installCanvasPixelUploads(gl, r => records.push(r));
      const compared = upload(sub, canvas); restore();
      if (JSON.stringify(direct) === JSON.stringify(compared)) matches++;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const restore = installCanvasPixelUploads(gl, r => records.push(r));
    ctx.fillStyle = '#00ffff'; ctx.fillRect(0, 0, 2, 2);
    const updated = upload(true, canvas);
    const count = records.length; upload(false, ctx.getImageData(0, 0, 2, 2));
    const passThrough = count === records.length;
    restore();
    const error = gl.getError(); gl.deleteFramebuffer(fb); gl.deleteTexture(texture); gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { matches, updated, passThrough, error, phases: [...new Set(records.map(r => r.phase))], width: canvas.width };
  });
  assert.equal(pixels.matches, 8, 'pixel conversion preserves native orientation, alpha and subimage results');
  assert.deepEqual(pixels.updated, Array(4).fill([0,255,255,255]).flat());
  assert(pixels.passThrough);
  assert.equal(pixels.error, 0);
  assert.equal(pixels.width, 2, 'source canvas retained for live painters');
  assert.deepEqual(pixels.phases, ['read:entered', 'upload:entered', 'upload:returned']);
  await pixelTest.context.close();

  if (process.argv.includes('--full')) {
    const real = await open({ full: true });
    await real.page.setViewport({ width: 956, height: 440, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const jsGzip = process.argv.includes('--js-gzip');
    const noShadows = process.argv.includes('--no-shadows');
    const noAtlas = process.argv.includes('--no-atlas');
    const textureCap = process.argv.includes('--texture-cap'), drawTrace = process.argv.includes('--draw-trace');
    const plainGround = process.argv.includes('--plain-ground');
    const signAtlas = process.argv.includes('--sign-atlas');
    const canvasPixels = process.argv.includes('--canvas-pixels');
    const staged = process.argv.includes('--staged') || jsGzip;
    if (staged) await real.page.select('#diag-test', jsGzip ? 'scene-js-gzip' : 'scene-staged');
    if (noShadows) await real.page.click('#diag-shadows');
    if (noAtlas) await real.page.click('#diag-atlas');
    if (textureCap) await real.page.click('#diag-texture');
    if (drawTrace) await real.page.click('#diag-drawtrace');
    if (plainGround) await real.page.click('#diag-ground');
    if (signAtlas) await real.page.click('#diag-signatlas');
    if (canvasPixels) await real.page.click('#diag-canvasupload');
    // Capture all worker events before the bounded on-phone journal rolls over.
    const workerEvents = [];
    const groundCheckpoints = [];
    const signCheckpoints = [];
    const canvasCheckpoints = [];
    await real.page.exposeFunction('recordWorkerEvent', entry => workerEvents.push(entry));
    await real.page.exposeFunction('recordGroundCheckpoint', entry => groundCheckpoints.push(entry));
    await real.page.exposeFunction('recordSignCheckpoint', entry => signCheckpoints.push(entry));
    await real.page.exposeFunction('recordCanvasCheckpoint', entry => canvasCheckpoints.push(entry));
    await real.page.evaluate(() => {
      const persist = Storage.prototype.setItem; let last = '', gotGround = false, gotSign = false, gotCanvas = false;
      Storage.prototype.setItem = function (key, value) {
        if (key.startsWith('n4spb.loading-report.v1:')) {
          const payload = JSON.parse(value);
          if (!gotGround && payload.draw?.object === 'env-ground') { gotGround = true; void window.recordGroundCheckpoint(payload.draw); }
          if (!gotSign && payload.draw?.material === 'pt-sign-atlas' && payload.colourGL?.status === 'returned' && payload.colourGL.call.startsWith('draw')) {
            gotSign = true; void window.recordSignCheckpoint(payload);
          }
          if (!gotCanvas && payload.colourGL?.call === 'texSubImage2D' && payload.colourGL.status === 'returned' && payload.colourGL.args.at(-1)?.sourceType === 'ImageData') {
            gotCanvas = true; void window.recordCanvasCheckpoint(payload);
          }
          const entry = JSON.parse(value)?.current?.events?.at(-1), id = JSON.stringify(entry);
          if (entry && id !== last) { last = id; if (/^(worker|gpu|build):/.test(entry.kind)) void window.recordWorkerEvent(entry); }
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
    assert(workerEvents.some(e => e.kind === 'gpu:render:start' && e.detail.includes('#1 normal-depth')));
    assert(workerEvents.some(e => e.kind === 'gpu:render:start' && e.detail.includes('#2 colour')));
    assert(data.current.sceneBuffers.geometryBytes > 1000000, 'captures reachable scene buffers before uploads');
    assert(data.current.sceneBuffers.dataTextureBytes > 1000000);
    assert(data.current.sceneBuffers.largestTextures.length <= 10);
    assert(data.current.sceneBuffers.canvasRGBA8BytesEstimate > 0);
    for (const name of ['batch', 'split-instances', 'fixture-cells', 'compact-attributes', 'outline-proxies']) {
      assert(workerEvents.some(e => e.kind === `build:${name}:start`), name + ' start persisted');
      assert(workerEvents.some(e => e.kind === `build:${name}:end`), name + ' completion persisted');
    }
    assert.equal(data.current.batch.atlasPages === 0, noAtlas);
    assert.equal(await real.page.evaluate(() => window.__stats.batch.atlasPages === 0), noAtlas);
    if (noAtlas) assert.equal(data.current.options.diagatlas, '0');
    if (textureCap) {
      assert.equal(data.current.options.diagtexture, '256');
      assert(data.current.textureCap.changed > 0);
      assert(data.current.textureCap.rgba8BytesAvoidedEstimate > 100000000, 'comparison materially reduces static canvas pixels');
    }
    if (drawTrace) {
      assert(data.current.lastColourDraw.number > 0);
      assert.equal(data.current.lastColourDraw.status, 'returned');
      assert(data.current.lastColourDraw.textures.length <= 12);
      assert(groundCheckpoints.length > 0, 'records first ground submission');
      assert.equal(groundCheckpoints[0].textures.some(t => t.label === 'uCls'), !plainGround, 'includes injected ground shader textures');
      assert.equal(data.current.lastGroundGL.status, 'returned');
      assert(data.current.lastGroundGL.number > 0);
      // Empty instance submissions (e.g. inactive jets) make no native draw.
      if (data.current.lastColourGL) {
        assert.equal(data.current.lastColourGL.status, 'returned');
        assert.equal(data.current.lastColourGL.draw, data.current.lastColourDraw.number);
      }
      assert(signCheckpoints.length > 0, 'native calls traced for sign atlas, not only ground');
      assert.equal(signCheckpoints[0].draw.textures.find(t => t.label === 'map').width, signAtlas ? 1024 : 4096);
    }
    if (signAtlas) {
      assert.equal(data.current.options.diagsignatlas, '1024');
      assert(data.current.signAtlasCap.changed > 0);
      assert(data.current.signAtlasCap.rgba8BytesAvoidedEstimate >= 62914560);
    }
    if (canvasPixels) {
      assert.equal(data.current.options.diagcanvasupload, 'pixels');
      assert.equal(data.current.canvasUpload.phase, 'upload:returned');
      assert(data.current.canvasUpload.number > 100, 'conversion covers full-scene canvas uploads');
      if (drawTrace) assert(canvasCheckpoints.length > 0, 'native upload received ImageData');
    }
    if (plainGround) {
      assert(data.current.plainGround.meshes > 0);
      assert.equal(data.current.options.diagground, 'plain');
      assert.equal(await real.page.evaluate(() => {
        let original = 0; window.__ctx.scene.traverse(o => { if (o.material?.name === 'env-ground') original++; }); return original;
      }), 0);
    }
    assert.equal(await real.page.evaluate(() => window.__ctx.renderer.shadowMap.enabled), !noShadows);
    assert.equal(workerEvents.some(e => e.kind === 'gpu:shadow:start'), !noShadows);
    if (noShadows) {
      assert.equal(data.current.options.diagshadows, '0');
      assert(workerEvents.some(e => e.kind === 'gpu:comparison'));
    } else assert(workerEvents.some(e => e.kind === 'gpu:shadow:end'));
    fs.writeFileSync(path.join(out, 'full-scene-events.json'), JSON.stringify(workerEvents, null, 2));
    fs.writeFileSync(path.join(out, 'ground-checkpoints.json'), JSON.stringify(groundCheckpoints, null, 2));
    fs.writeFileSync(path.join(out, 'sign-checkpoints.json'), JSON.stringify(signCheckpoints, null, 2));
    fs.writeFileSync(path.join(out, 'canvas-checkpoints.json'), JSON.stringify(canvasCheckpoints, null, 2));
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
    assert.equal(await real.page.$eval('#diag-shadows', e => e.checked), !noShadows);
    assert.equal(await real.page.$eval('#diag-atlas', e => e.checked), !noAtlas);
    assert.equal(await real.page.$eval('#diag-texture', e => e.checked), textureCap);
    assert.equal(await real.page.$eval('#diag-drawtrace', e => e.checked), drawTrace);
    assert.equal(await real.page.$eval('#diag-ground', e => e.checked), plainGround);
    assert.equal(await real.page.$eval('#diag-signatlas', e => e.checked), signAtlas);
    assert.equal(await real.page.$eval('#diag-canvasupload', e => e.checked), canvasPixels);
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
