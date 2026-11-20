// Full-page kart journey through venue and non-venue areas, using fresh bakes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { makeHo, arrivalUrl } from '../src/core/handoff.js';
import { handleBakedRevision } from './lib/dev-revision.mjs';
import { installFontTransport } from './font-transport.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = process.env.KART_TEST_OUT || path.join(os.tmpdir(), 'n4-portable-kart');
fs.mkdirSync(path.dirname(out), { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const executablePath = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/chromium',
].find(p => fs.existsSync(p));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'n4-kart-journey-'));
let browser;
try {
  let car = { id: 'narvskaya-club-10', kind: 'kart', view: 0 }, from = 'kolomna';
  const results = [];
  for (const [area, pageName, x, z, yaw] of [
    ['narvsky', 'narvsky.html', -4745.35, 3639.61, 16.158],
    ['admiralty', 'admiralty.html', -2329, -508, 42],
    ['palace', 'index.html', 560, 192, 137],
    ['narvsky', 'narvsky.html', -4745.35, 3639.61, 16.158],
  ]) {
    browser = await puppeteer.launch({ executablePath, userDataDir: profile, headless: true, protocolTimeout: 300000,
      args: ['--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', '--disk-cache-size=1', '--disable-gpu-shader-disk-cache'],
      defaultViewport: { width: 1280, height: 720 } });
    const page = await browser.newPage(), errors = [];
    await installFontTransport(page);
    const cdp = await page.createCDPSession();
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: 'https://cdn.jsdelivr.net/npm/three@*/*' }] });
    cdp.on('Fetch.requestPaused', async ({ requestId, request }) => {
      const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(request.url);
      await cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }, { name: 'Access-Control-Allow-Origin', value: '*' }],
        body: fs.readFileSync(path.join(root, 'node_modules/three', m[1])).toString('base64') });
    });
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => {
      if (r.url().startsWith('http://127.0.0.1:') && r.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`${r.url()}: ${r.failure()?.errorText}`);
    });
    page.on('response', r => { if (r.url().startsWith('http://127.0.0.1:') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    console.log(`Loading browser destination ${area}`);
    const ho = makeHo({ from, to: area, via: 'place', car });
    const url = arrivalUrl({ page: pageName, pose: { x, z, yaw, pitch: 0 }, ho, search: '?q=performance' });
    await page.goto(`http://127.0.0.1:${server.address().port}/${url}`, { waitUntil: 'load', timeout: 120000 });
    try {
      await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 280000 });
    } catch (error) {
      await page.screenshot({ path: `${out}-failed-${area}.png` });
      console.error(await page.evaluate(() => ({ label: document.getElementById('loadlabel')?.textContent,
        fatal: document.getElementById('fatal')?.textContent, errors: window.__errors })));
      console.error(errors); throw error;
    }
    if (await page.evaluate(() => !document.body.classList.contains('playing') && !document.documentElement.classList.contains('seam-in'))) await page.click('#go');
    await page.waitForFunction(() => __ctx.drive?.active && __ctx.drive.vehicle.kind === 'kart', { timeout: 15000 });
    if (!results.length) await page.evaluate(() => __ctx.characters.select(1));
    await new Promise(r => setTimeout(r, 500));
    const result = await page.evaluate(() => {
      const d = __ctx.drive, v = d.vehicle;
      return { id: v.id, kind: v.kind, count: d.karts.length, duplicates: d.vehicles.filter(o => o.id === v.id).length,
        acc: d.car.tuning.acc, vmax: d.car.tuning.vmax, frontMu: d.car.tuning.frontMu,
        selected: __ctx.characters.index, driverVisible: __ctx.characters.actor.root.visible, errors: __errors };
    });
    assert.equal(result.id, car.id); assert.equal(result.kind, 'kart'); assert.equal(result.duplicates, 1);
    assert.equal(result.count, area === 'narvsky' ? 20 : 1); assert.equal(result.selected, 1); assert.equal(result.driverVisible, true);
    assert.deepEqual(result.errors, []); assert.deepEqual(errors, []);
    if (results.length) for (const key of ['acc', 'vmax', 'frontMu']) assert.equal(result[key], results[0][key]);
    await page.screenshot({ path: `${out}-${results.length}-${area}.png` });
    await page.evaluate(() => __ctx.drive.setView(2));
    await page.waitForFunction(() => !__ctx.characters.actor.root.visible &&
      __ctx.drive.model.root.getObjectByName('cockpit-arms')?.children.length > 0);
    await page.screenshot({ path: `${out}-${results.length}-${area}-cockpit.png` });
    await page.evaluate(() => __ctx.drive.sim(.3, { thr: 0, steer: .75 }));
    assert(await page.evaluate(() => __ctx.drive.car.steer > 0));
    await page.evaluate(() => __ctx.drive.setView(0));
    await page.waitForFunction(() => __ctx.characters.actor.root.visible &&
      !__ctx.drive.model.root.getObjectByName('cockpit-arms'));
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => !__ctx.drive.active);
    await page.evaluate(() => {
      const v = __ctx.drive.vehicle, p = v.parked, b = v.def.boarding, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
      __ctx.playerObj.setPose(p.x + cy * b.x + sy * b.z, p.z - sy * b.x + cy * b.z, (p.yaw + Math.PI) * 180 / Math.PI, 0);
    });
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => __ctx.drive.active);
    car = await page.evaluate(async () => (await import('/src/core/gates.js')).carHandoff(__ctx.drive));
    assert.equal(car.kind, 'kart'); assert.equal(car.id, result.id);
    results.push({ area, ...result }); from = area;
    console.log(`PASS browser ${area}: ${car.id}, ${result.count} kart(s), selected driver, E exit/reboarding`);
    await browser.close(); browser = null;
  }
  fs.writeFileSync(`${out}.json`, JSON.stringify(results, null, 2));
} finally { await browser?.close(); await new Promise(r => server.close(r)); fs.rmSync(profile, { recursive: true, force: true }); }
