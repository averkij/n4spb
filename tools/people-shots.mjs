// Screenshots of the PEOPLE at several places in ONE page load (real renderer, headless Edge / Chrome; the scene build takes minutes).
// tools/shot.mjs simulates once and then only moves the camera: the walkers that follow the player stay at the first camera. Here the simulation runs on for --dwell seconds at every
// camera (window.__sim with a growing target: the people sim continues, the modules that are pure functions of t are re-evaluated), so every frame shows the crowd as the player meets it.
//   node tools/people-shots.mjs --cams "x,y,z,yaw,pitch;..." --out shots/people/petro [--only a,b,c] [--t 20] [--dwell 25] [--params "petro=off"] [--q high] [--w 1280 --h 720] [--bench 40] [--wait 1800000]
//   cams: 5 numbers = free camera (x, y = eye height, z, yaw, pitch); 4 numbers = walking eye (x, z, yaw, pitch); yaw 0 north, 90 west, 180 south, -90 east
//   --bench n: after each shot the page renders n frames and reports the mean frame time (window.__bench)
// Prints for each camera: draw calls, triangles, the people drawn (services.people.shown()) and the head count within 60 / 120 m.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { handleBakedRevision } from './lib/dev-revision.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; args[k] = v; } }
const W = Number(args.w || 1280), H = Number(args.h || 720), T0 = Number(args.t ?? 20), DWELL = Number(args.dwell ?? 25);
const cams = String(args.cams || '').split(';').map((s) => s.trim()).filter(Boolean);
if (!cams.length) { console.log('usage: node tools/people-shots.mjs --cams "x,y,z,yaw,pitch;..." --out shots/people/a [--only ...] [--dwell 25]'); process.exit(1); }
const out = args.out || 'shots/people/shot';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, protocolTimeout: Number(args.wait || 600000) + 600000, args: [...(args.sw ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox']), '--no-first-run', '--disable-extensions', '--js-flags=--max-old-space-size=14000', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
const logs = [];
try {
  const page = await browser.newPage();
  await page.bringToFront(); try { const fc = await page.createCDPSession(); await fc.send('Emulation.setFocusEmulationEnabled', { enabled: true }); await fc.send('Page.setWebLifecycleState', { state: 'active' }).catch(() => {}); setInterval(() => { page.bringToFront().catch(() => {}); }, 20000).unref(); } catch (e) { console.log('focus emulation failed', e.message); }       // a hidden headless tab is throttled / frozen on this machine: keep it active
  const threeRoot = path.join(root, 'node_modules', 'three');
  if (!args.network && fs.existsSync(threeRoot)) {
    await page.setRequestInterception(true);
    page.on('request', (req) => { const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url()); if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); } req.continue(); });
  }
  page.on('console', (m) => { const t = m.type(); if (t === 'error') logs.push(`[console.${t}] ${m.text()}`); });
  page.on('error', (e) => console.log('PAGE CRASHED:', e.message));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const q = new URLSearchParams({ w: String(W), h: String(H), t: String(T0), q: args.q || 'high', shot: '1' });
  if (args.only) q.set('only', args.only);
  if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);
  q.set('cam', cams[0]);
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction('window.__ready === true', { timeout: Number(args.wait || 600000), polling: 500 });          // --wait ms: the live build of the whole island takes 10+ minutes on a loaded machine
  console.log('page ready in', Math.round((Date.now() - t0) / 1000), 's; people', await page.evaluate(() => { const p = window.__ctx.services.people || {}; return JSON.stringify({ count: p.count, buildMs: p.buildMs, petro: p.plan && p.plan.petroTotal, nodes: p.nav && p.nav.nodes }); }));
  if (args.fov) await page.evaluate((f) => { window.__camera.fov = f; window.__camera.updateProjectionMatrix(); }, Number(args.fov));
  let t = T0;
  for (let i = 0; i < cams.length; i++) {
    const v = cams[i].split(',').map(Number);
    await page.evaluate((v) => { if (v.length === 4) window.__setCam(v[0], null, v[1], v[2], v[3]); else window.__setCam(v[0], v[1], v[2], v[3], v[4], v.length >= 6 && !!v[5]); }, v);
    if (i > 0 || DWELL > 0) { t += DWELL; await page.evaluate((tt) => window.__sim(tt, 0.1), t); }
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const file = path.resolve(root, `${out}_${i}.png`);
    await page.screenshot({ path: file });
    const st = await page.evaluate(() => { const c = window.__camera.position, s = window.__ctx.services.people && window.__ctx.services.people.sim; let n60 = 0, n120 = 0; if (s) for (const a of s.agents) { if (a.hidden) continue; const d = Math.hypot(a.x - c.x, a.z - c.z); if (d < 60) n60++; if (d < 120) n120++; } return { calls: window.__stats.calls, triangles: window.__stats.triangles, shown: window.__ctx.services.people && window.__ctx.services.people.shown ? window.__ctx.services.people.shown() : null, n60, n120 }; });
    console.log(`saved ${path.relative(root, file)}  cam=[${cams[i]}] t=${t}  calls=${st.calls} tris=${st.triangles} peopleDrawn=${st.shown} within60=${st.n60} within120=${st.n120}`);
    if (args.bench) { const b = await page.evaluate((n) => window.__bench(n), Number(args.bench) > 1 ? Number(args.bench) : 40); console.log(`  bench: ${JSON.stringify(b)}`); }
  }
  if (args.find) {                                                    // --find scene1,scene2,near:x:z:r: where the people of these scenes (or within r m of x,z) stand (to aim the next cameras)
    const found = await page.evaluate((names) => { const s = window.__ctx.services.people.sim, out = {}; const nr = names.filter((n) => n.startsWith('near:')).map((n) => n.split(':').slice(1).map(Number)); for (const a of s.agents) { if (a.hidden) continue; if (!names.includes(a.scene) && !nr.some(([x, z, r]) => Math.hypot(a.x - x, a.z - z) < r)) continue; (out[a.scene] ||= []).push([+a.x.toFixed(1), +a.y.toFixed(2), +a.z.toFixed(1), +(a.yaw * 180 / Math.PI).toFixed(0), a.kind]); } for (const k in out) out[k] = out[k].slice(0, 8); return out; }, String(args.find).split(','));
    console.log('find:', JSON.stringify(found));
  }
  const errs = await page.evaluate(() => window.__errors);
  if (errs && errs.length) { console.log('MODULE ERRORS:'); for (const e of errs) console.log(` - [${e.module}] ${String(e.message).split('\n').slice(0, 4).join('\n   ')}`); }
} catch (e) { console.log('SHOTS FAILED:', e.message); process.exitCode = 1; } finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 40)) console.log(' ', l.slice(0, 500)); }
  await browser.close(); server.close();
}
