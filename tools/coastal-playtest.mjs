// Real input / real renderer / NORMAL SHIPPING BAKES. Run GPU work serially:
//   node tools/coastal-playtest.mjs [--q medium] [--out shots/coastal-final]
// No only/shot/baked=0/baked=force path, direct drive.enter(), or simulated
// driving. The camera hook only places a walking player beside real fixtures;
// boarding, movement, camera changes, braking, exit and respawn use real keys.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';
import { installFontTransport } from './font-transport.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) {
  const key = process.argv[i].slice(2); args[key] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1';
}
for (const key of ['only', 'params', 'baked', 'shot']) if (args[key]) throw new Error(`${key} is unsupported: this test exercises normal baked pages`);
const quality = args.q || 'medium', out = path.resolve(root, args.out || 'shots/coastal-final');
const loadTimeout = Number(args['load-timeout'] || 300000), protocolTimeout = Number(args['protocol-timeout'] || 300000);
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname); } catch { res.writeHead(400); res.end(); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(bytes);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const executable = args.browser || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(file => fs.existsSync(file));
if (!executable) { await new Promise(resolve => server.close(resolve)); throw new Error('No supported Edge/Chrome executable'); }

const report = { quality, startedAt: new Date().toISOString(), pages: {}, checks: [], errors: [], console: [], screenshots: [] };
let browser, currentPage = null, currentArea = null;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = (name, ok, detail = null) => {
  report.checks.push({ area: currentArea, name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${currentArea}: ${name}${detail ? ' ' + JSON.stringify(detail) : ''}`);
  assert.ok(ok, name);
};
async function screenshot(page, name) {
  const file = path.join(out, name + '.png'); await page.screenshot({ path: file });
  report.screenshots.push(path.relative(root, file).replaceAll('\\', '/'));
}
async function hold(page, keys, ms) {
  for (const key of keys) await page.keyboard.down(key);
  try { await sleep(ms); } finally { for (const key of keys.toReversed()) await page.keyboard.up(key); }
}
const state = page => page.evaluate(() => {
  const d = window.__drive, p = window.__ctx.playerObj, c = d.car, camera = window.__camera;
  return { active: d.active, id: d.vehicle.id, vessel: d.vehicle.def.vessel || null, floats: !!c.floats,
    x: c.x, y: c.y, z: c.z, yaw: c.yaw, kmh: c.speed, view: d.view.mode,
    player: { x: p.pos.x, y: p.pos.y, z: p.pos.z, lock: p.inputLock, fly: p.fly, underground: p.isUnderground() },
    camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    playing: document.body.classList.contains('playing'), driving: document.body.classList.contains('driving') };
});

async function boot(id) {
  currentArea = id;
  const page = await browser.newPage(); currentPage = page;
  let closing = false;
  await installFontTransport(page);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const match = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(request.url());
    if (match) {
      const file = path.join(root, 'node_modules/three', match[1].split('?')[0]);
      if (fs.existsSync(file)) { request.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(file) }); return; }
    }
    request.continue();
  });
  page.on('pageerror', error => report.errors.push({ area: id, kind: 'pageerror', message: error.message }));
  page.on('console', message => {
    if (!['error', 'warning', 'warn'].includes(message.type())) return;
    const text = message.text(); report.console.push({ area: id, type: message.type(), text });
    if (/^\[module\s|WebGL.*(?:INVALID|CONTEXT_LOST)|THREE\.WebGLProgram: Shader Error/i.test(text)) report.errors.push({ area: id, kind: 'console', message: text });
  });
  page.on('response', response => {
    const url = response.url();
    if (response.status() >= 400 && !/\/favicon\.ico(?:\?|$)/.test(url)) report.errors.push({ area: id, kind: 'http', status: response.status(), url });
  });
  page.on('requestfailed', request => {
    if (closing && request.failure()?.errorText === 'net::ERR_ABORTED') return;
    report.errors.push({ area: id, kind: 'requestfailed', url: request.url(), message: request.failure()?.errorText });
  });
  await page.evaluateOnNewDocument(() => {
    window.__coastalContextLost = false;
    document.addEventListener('webglcontextlost', () => { window.__coastalContextLost = true; }, true);
  });
  const started = Date.now(), heartbeat = setInterval(() => console.log(`${id}: still loading (${Math.round((Date.now() - started) / 1000)} s)`), 15000);
  try {
    await page.goto(`${origin}/${id}.html?${new URLSearchParams({ q: quality })}`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => document.body.classList.contains('loaded') || !!document.getElementById('fatal'), { timeout: loadTimeout, polling: 250 });
    const booted = await page.evaluate(() => ({
      fatal: document.getElementById('fatal')?.innerText || null, errors: window.__errors || [],
      area: window.__ctx?.area?.ID, baked: window.__ctx?.services.baked || null,
      manifestArea: window.__ctx?.baked?.manifest?.area, modules: Object.keys(window.__stats?.modules || {}),
    }));
    report.pages[id] = { loadSeconds: (Date.now() - started) / 1000, ...booted };
    check('normal page loaded from its shipping bake', !booted.fatal && booted.area === id && booted.manifestArea === id && !!booted.baked?.revision && booted.baked.loaded.length >= 3 && booted.baked.failures.length === 0, booted);
    check('all normal modules built without module errors', booted.errors.length === 0 && booted.modules.includes('city') && booted.modules.includes('people') && booted.modules.includes('drive'), booted.errors);
    await page.click('#go'); await page.waitForFunction(() => document.body.classList.contains('playing'), { timeout: 10000 }); await sleep(1200);
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({ progress: document.getElementById('loadlabel')?.textContent, fatal: document.getElementById('fatal')?.innerText, errors: window.__errors, timing: window.__stats?.timing })).catch(() => null);
    report.errors.push({ area: id, kind: 'boot', message: error.message, diagnostic }); throw error;
  } finally { clearInterval(heartbeat); }
  return { page, close: async () => { closing = true; await page.close(); currentPage = null; } };
}

async function besideVehicle(page, id) {
  const pose = await page.evaluate(async id => {
    const ctx = window.__ctx, v = window.__drive.vehicles.find(v => v.id === id);
    if (!v) throw new Error('Missing vehicle ' + id);
    const p = v.parked, b = v.def.boarding || { x: 0, z: v.spec.centerZ }, s = Math.sin(p.yaw), c = Math.cos(p.yaw);
    const standX = v.def.boarding ? b.x + 1.8 : v.spec.W / 2 + 1.5;
    const x = p.x + c * standX + s * b.z, z = p.z - s * standX + c * b.z;
    const target = { x: p.x + c * b.x + s * b.z, y: p.y + .8, z: p.z - s * b.x + c * b.z };
    if (ctx.regions) await ctx.regions.ensureAt(x, z);
    window.__setCam(x, null, z, 0, 0);
    const camera = window.__camera, dx = target.x - x, dz = target.z - z;
    const yaw = Math.atan2(-dx, -dz) * 180 / Math.PI, pitch = Math.atan2(target.y - camera.position.y, Math.hypot(dx, dz)) * 180 / Math.PI;
    window.__setCam(x, null, z, yaw, pitch); ctx.gates?.teleported();
    const promptId = v.kind === 'boat' && v.id !== 'boat' ? 'drive-boat-' + v.id : v.id === 'coupe' ? 'drive-car' : 'drive-' + v.id;
    return { id, promptId, stand: { x, z }, target, boarding: b };
  }, id);
  await page.waitForFunction(promptId => {
    const el = document.getElementById('interact');
    return window.__ctx.interact.target?.id === promptId && el?.classList.contains('show') && !!el.textContent.trim() && getComputedStyle(el).visibility !== 'hidden';
  }, { timeout: 8000, polling: 100 }, pose.promptId);
  const prompt = await page.$eval('#interact', el => el.textContent);
  check('visible E interaction for ' + id, /\[E\]/.test(prompt), { ...pose, prompt });
  return pose;
}
async function board(page, id) {
  await page.keyboard.press('KeyE');
  await page.waitForFunction(id => window.__drive.active && window.__drive.vehicle.id === id, { timeout: 6000, polling: 100 }, id);
  const s = await state(page); check('first E boards ' + id, s.active && s.id === id && s.player.lock === 1, s); return s;
}
async function stopAndExit(page, hull = false) {
  await page.keyboard.down('Space');
  try { await page.waitForFunction(() => window.__drive.car.speed < .7, { timeout: 10000, polling: 100 }); }
  finally { await page.keyboard.up('Space'); }
  const stopped = await state(page); check('Space brakes to a safe exit speed', stopped.kmh < .7, stopped);
  await page.keyboard.press('KeyE');
  await page.waitForFunction(() => !window.__drive.active && window.__ctx.playerObj.inputLock === 0, { timeout: 6000, polling: 100 });
  const result = await page.evaluate(() => {
    const v = window.__drive.vehicle, p = window.__ctx.playerObj, parked = v.parked, dx = p.pos.x - parked.x, dz = p.pos.z - parked.z, c = Math.cos(parked.yaw), s = Math.sin(parked.yaw);
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    return { active: window.__drive.active, lock: p.inputLock, fly: p.fly, underground: p.isUnderground(), x: p.pos.x, y: p.pos.y, z: p.pos.z,
      outsideHull: Math.abs(lx) > v.spec.W / 2 + .2 || lz > v.spec.front + .2 || lz < v.spec.rear - .2 };
  });
  check('E exits to an unlocked walking player', !result.active && !result.lock && !result.fly && !result.underground, result);
  if (hull) check('walker exits outside the full vessel hull', result.outsideHull, result);
}
async function respawn(page) {
  await page.keyboard.press('KeyR'); await sleep(600);
  const s = await page.evaluate(() => { const p = window.__ctx.playerObj, h = window.__ctx.L.HERO; return { active: window.__drive.active, lock: p.inputLock, gap: Math.hypot(p.pos.x - h.x, p.pos.z - h.z), fly: p.fly }; });
  check('R returns to the area start on foot', !s.active && !s.lock && !s.fly && s.gap < 1.5, s);
}
async function ordinaryBoat(page) {
  const id = await page.evaluate(() => window.__drive.boats.find(v => v.def.vessel !== 'container-ship')?.id); assert.ok(id, 'ordinary motor boat missing');
  await besideVehicle(page, id); const start = await board(page, id); check('ordinary boat remains water transport', start.floats);
  await hold(page, ['KeyW'], 900); const moved = await state(page);
  check('real W moves the ordinary boat', moved.kmh > .5 && Math.hypot(moved.x - start.x, moved.z - start.z) > .05, moved);
  await stopAndExit(page, true); await respawn(page);
}

try {
  browser = await puppeteer.launch({ executablePath: executable, headless: true,
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout });
  {
    const { page, close } = await boot('morskie-vorota');
    const id = await page.evaluate(() => window.__drive.boats.find(v => v.def.vessel === 'container-ship')?.id); assert.ok(id, 'container ship missing');
    await besideVehicle(page, id); await screenshot(page, 'marine-ship-boarding');
    const seated = await board(page, id); check('container ship uses its complete boat specification', seated.floats && seated.vessel === 'container-ship');
    await hold(page, ['KeyW'], 3000); const gas = await state(page);
    check('three seconds of real W accelerates the container ship', gas.kmh > .5 && Math.hypot(gas.x - seated.x, gas.z - seated.z) > .15, gas);
    await hold(page, ['KeyW', 'KeyA'], 3000); const turn = await state(page);
    const yawDelta = Math.abs(Math.atan2(Math.sin(turn.yaw - gas.yaw), Math.cos(turn.yaw - gas.yaw))) * 180 / Math.PI;
    check('real A gradually turns the moving ship', yawDelta > .2 && yawDelta < 20, { yawDelta, ...turn });
    await screenshot(page, 'marine-ship-chase');
    await page.keyboard.press('KeyV'); await sleep(400); await page.keyboard.press('KeyV'); await sleep(600);
    const bridge = await state(page); check('V reaches the forward bridge helm camera', bridge.view === 2 && bridge.camera.y > bridge.y + 45, bridge);
    await screenshot(page, 'marine-ship-bridge');
    await page.keyboard.press('KeyV'); await sleep(400); const chase = await state(page);
    check('V returns to the full-size chase camera', chase.view === 0 && Math.hypot(chase.camera.x - chase.x, chase.camera.z - chase.z) > 240, chase);
    await stopAndExit(page, true); await respawn(page);
    await ordinaryBoat(page);
    const lada = await page.evaluate(() => window.__drive.fleet.find(v => v.id === 'lada')?.id); assert.ok(lada, 'purple Zhiguli missing');
    await besideVehicle(page, lada); const car = await board(page, lada); check('the purple Zhiguli still boards as a car', !car.floats);
    await sleep(500); await stopAndExit(page); await respawn(page);
    const lost = await page.evaluate(() => window.__coastalContextLost); check('WebGL context survives the marine verbs', !lost);
    await close();
  }
  {
    const { page, close } = await boot('okrug65');
    const route = await page.evaluate(async () => {
      const ctx = window.__ctx, polygons = ctx.area.HOOKS?.waterBodies?.() || [], ph = ctx.physics;
      const inside = (ring, x, z) => { let c = false; for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) if ((ring[i + 1] > z) !== (ring[j + 1] > z) && x < (ring[j] - ring[i]) * (z - ring[i + 1]) / (ring[j + 1] - ring[i + 1]) + ring[i]) c = !c; return c; };
      const clear = (x, z) => polygons.some(p => inside(p.o, x, z) && !(p.h || []).some(h => inside(h, x, z))) && ph.waterLevel(x, z) != null && !ctx.L.insideBuilding(x, z, .4) && !ph.columnBlocked(x, z, .4, .3, 1.9);
      for (const p of polygons) {
        const xs = p.o.filter((_, i) => !(i % 2)), zs = p.o.filter((_, i) => i % 2);
        for (let x = Math.min(...xs) + 1; x < Math.max(...xs) - 1; x += 1) for (let z = Math.min(...zs) + 1; z < Math.max(...zs) - 1; z += 1) for (let k = 0; k < 16; k++) {
          const a = k * Math.PI / 8, dx = Math.cos(a), dz = Math.sin(a);
          if (!Array.from({ length: 14 }, (_, i) => i * .5).every(t => clear(x + dx * t, z + dz * t))) continue;
          if (ctx.regions) await ctx.regions.ensureAt(x, z);
          window.__setCam(x, null, z, Math.atan2(-dx, -dz) * 180 / Math.PI, 0); ctx.gates?.teleported();
          return { x, z, dx, dz, water: ph.waterLevel(x, z), y: ctx.playerObj.pos.y };
        }
      }
      throw new Error('No clear 6.5 m walking route in the real fountain water');
    });
    await hold(page, ['KeyW'], 800);
    const wet = await page.evaluate(() => { const p = window.__ctx.playerObj, ph = window.__ctx.physics; return { x: p.pos.x, y: p.pos.y, z: p.pos.z, water: ph.waterLevel(p.pos.x, p.pos.z), fly: p.fly, underground: p.isUnderground() }; });
    check('the fountain remains reachable on foot and W walks through water', !wet.fly && !wet.underground && wet.water !== null && Math.hypot(wet.x - route.x, wet.z - route.z) > .3, { route, wet });
    await screenshot(page, 'okrug65-fountain-walk'); await respawn(page);
    await ordinaryBoat(page);
    const lost = await page.evaluate(() => window.__coastalContextLost); check('WebGL context survives Okrug 65 water/boat use', !lost);
    await close();
  }
} catch (error) {
  report.errors.push({ area: currentArea, kind: 'test', message: error.stack || error.message });
  if (currentPage && !currentPage.isClosed()) await screenshot(currentPage, `${currentArea}-failure`).catch(() => {});
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  report.finishedAt = new Date().toISOString(); report.ok = report.errors.length === 0 && report.checks.every(c => c.ok);
  fs.writeFileSync(path.join(out, 'playtest.json'), JSON.stringify(report, null, 2) + '\n');
}
for (const error of report.errors) console.error('ERROR', JSON.stringify(error));
console.log(`coastal-playtest: ${report.checks.filter(c => c.ok).length} passed, ${report.errors.length} errors; screenshots and JSON in ${path.relative(root, out)}`);
console.log(report.ok ? 'RESULT: OK' : 'RESULT: FAIL');
process.exitCode = report.ok ? 0 : 1;
