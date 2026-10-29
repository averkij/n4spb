import { handleBakedRevision } from './lib/dev-revision.mjs';
// Headless GPU screenshots of the real renderer (Edge + puppeteer-core). Starts its own server.
// usage:
//   node tools/shot.mjs --only environment,city --cams "x,z,yaw,pitch;x,y,z,yaw,pitch" --out shots/city/a [--t 20] [--w 1280 --h 720] [--q high] [--fov 62]
//   --only   comma list of world modules to build (omit = full scene)
//   --cams   ';'-separated cameras (default: hero). 4 numbers = walking eye at ground (x,z,yawDeg,pitchDeg);
//            5 numbers = free camera (x,y,z,yawDeg,pitchDeg), y = eye height (also underground, e.g. -58.5 over a platform at -60);
//            6 numbers (...,1) = WALKING player standing on the highest surface whose top is not above y (feet): "0.5,-60,150,90,0,1" stands on a platform at -60.
//            yaw 0 = north(-Z), 90 = west, 180 = south, -90 = east.
//            Names from layout.js: hero, v1..v5 (viewpoint keys 1..5), views (all five), overview (high, from the south),
//            aerial (from the SE, high), top (straight down over Vosstaniya Square).
//   --fov    vertical field of view in degrees (default 62); --params "nofog=1&allcity=1" adds URL parameters
//   --pre    JS expression evaluated in the page BEFORE the shots (after --fov); its JSON result is printed as 'pre:'. A shot frame has dt = 0, so a pre hook that moves things steps the
//            simulation itself: --pre "__knock.hit(x, z, 40, 1, 0); for (let i = 0; i < 40; i++) __advance(0.05)" (knockable furniture; add --params "baked=force" while the bake is stale)
//   --eval   JS expression evaluated in the page after the shots; its JSON result is printed
//   --t      simulation time in seconds (animations are fast-forwarded deterministically)
//   --load   test the normal loading path (roof map + 10 s simulation included)
//   --play   with --load, press Start before taking scene screenshots
//   --profile record startup CPU samples to <out>.cpuprofile (or the given path)
//   --network use CDN Three.js instead of the offline local interception
//   --out    output path prefix; files are <out>_0.png, <out>_1.png, ...
//   --area <id> | --page <file>   shoot the page of another area (north.html; default: the strip, index.html); hero / v1.. / views are that area's poses
// Prints page errors, module errors and render stats. Then view the PNGs with your image viewer / Read tool.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { resolveArea, activateArea } from './lib/area-page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; args[k] = v; } }
const W = Number(args.w || 1280), H = Number(args.h || 720);
const BASE = args.base ? '/' + args.base.replace(/^\/+|\/+$/g, '') : '';
// --area <id> / --page <file>: the page of another area (north.html); hero / v1.. / views then come from THAT area's layout (default: the strip, index.html)
const AREA = resolveArea(args, root);
await activateArea(AREA.row, root);
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
const pose = (p) => `${p.x},${p.z},${p.yaw},${p.pitch}`;
const PRESETS = { hero: [pose(L.HERO)], views: L.VIEWS.map(pose), overview: ['-102,430,430,0,-42'], aerial: ['330,300,380,55,-38'], top: ['-102.9,452,83.7,0,-90'] };
if (AREA.id !== 'strip') {      // the strip's three overview cameras are placed over Vosstaniya Square: the same shapes over the area's hero
  const h = L.HERO; Object.assign(PRESETS, { overview: [`${h.x},430,${h.z + 430},0,-42`], aerial: [`${h.x + 430},300,${h.z + 380},55,-38`], top: [`${h.x},452,${h.z},0,-90`] });
}
L.VIEWS.forEach((v, i) => { PRESETS['v' + (i + 1)] = [pose(v)]; });
const cams = (args.cams || 'hero').split(';').map(s => s.trim()).filter(Boolean).flatMap((c) => PRESETS[c] || [c]);
const out = args.out || 'shots/shot';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root, { base: BASE })) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  if (BASE && p.startsWith(BASE + '/')) p = p.slice(BASE.length);
  const f = path.join(root, p);
  // serve three from node_modules when available (faster, offline-safe)
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => fs.existsSync(p));
const browser = await puppeteer.launch({
  executablePath: EDGE, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', `--window-size=${W},${H}`, ...(args['browser-heap'] ? [`--js-flags=--max-old-space-size=${Number(args['browser-heap'])}`] : [])],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  protocolTimeout: Number(args['protocol-timeout'] || 300000),
});
const logs = [];
try {
  const page = await browser.newPage();
  await (await import('./font-transport.mjs')).installFontTransport(page);
  // serve three.js from node_modules (offline-safe, faster); fall through to the network for everything else (fonts)
  const threeRoot = path.join(root, 'node_modules', 'three');
  if (!args.network && fs.existsSync(threeRoot)) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
      if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
      req.continue();
    });
  }
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning' || t === 'warn') logs.push(`[console.${t}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
  if (args.init) await page.evaluateOnNewDocument(args.init);      // --init "<js>": runs before the page scripts (debug hooks, e.g. patching window.THREE through a setter)
  const cdp = args.profile ? await page.createCDPSession() : null;
  if (cdp) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 1000 }); await cdp.send('Profiler.start'); }
  const q = new URLSearchParams({ w: String(W), h: String(H), t: String(args.t ?? (args.load ? 10 : 0)), q: args.q || 'medium' });
  if (!args.load) q.set('shot', '1');
  if (args.only) q.set('only', args.only);
  if (args.batch) q.set('batch', args.batch);
  if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);   // e.g. --params "allcity=1&stats=1"
  q.set('cam', cams[0]);
  await page.goto(`http://127.0.0.1:${port}${BASE}/${AREA.page}?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(args.load ? "document.body.classList.contains('loaded')" : 'window.__ready === true', { timeout: Number(args['load-timeout'] || 280000), polling: 250 });
  if (cdp) {
    const { profile } = await cdp.send('Profiler.stop');
    fs.writeFileSync(path.resolve(root, args.profile === '1' ? out + '.cpuprofile' : args.profile), JSON.stringify(profile));
  }
  if (args.load) {
    const report = await page.evaluate(() => ({
      timing: __stats.timing, modules: __stats.modules, batch: __stats.batch, errors: __errors,
      phases: { environment: __ctx.services.environment?.buildPhases, streets: __ctx.services.streetsStats?.ms,
        city: __ctx.services.city?.buildPhases, people: __ctx.services.people?.phases },
      roof: __stats.roof, split: __stats.split, nd: __stats.nd, lod: __stats.lod, releasedMB: typeof __stats.releasedMB === 'function' ? __stats.releasedMB() : null,
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      userAgent: navigator.userAgent,
      resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, duration: Math.round(r.duration), transferSize: r.transferSize })),
    }));
    report.test = { quality: q.get('q'), width: W, height: H, localThree: !args.network && fs.existsSync(threeRoot), profiled: !!args.profile, browserHeap: args['browser-heap'] || 'default', params: Object.fromEntries(q) };
    fs.writeFileSync(path.resolve(root, out + '.load.json'), JSON.stringify(report, null, 2));
    console.log('load timing:', JSON.stringify(report.timing));
    if (report.errors.length) throw new Error(`Loading reported ${report.errors.length} module errors`);
    if (args.play) {
      await page.click('#go');
      await page.waitForFunction(() => {
        const intro = document.getElementById('intro');
        return !intro || getComputedStyle(intro).visibility === 'hidden';
      });
    }
  }
  if (args.fov) await page.evaluate((f) => { window.__camera.fov = f; window.__camera.updateProjectionMatrix(); }, Number(args.fov));
  if (args.pre) { const r = await page.evaluate(args.pre); console.log('pre:', JSON.stringify(r)); }
  const info = await page.evaluate(() => ({ errors: window.__errors, stats: window.__stats, gl: (() => { try { const gl = document.getElementById('scene').getContext('webgl2'); const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; } catch (e) { return 'n/a'; } })() }));
  for (let i = 0; i < cams.length; i++) {
    const v = cams[i].split(',').map(Number);
    await page.evaluate(async (v) => {
      // A new district can be kilometres from the spawn; wait for its real
      // streamed content before judging missing geometry or culling in a shot.
      await window.__regions?.ensureAt(v[0], v.length === 4 ? v[1] : v[2]);
      if (v.length === 4) window.__setCam(v[0], null, v[1], v[2], v[3]); else window.__setCam(v[0], v[1], v[2], v[3], v[4], v.length >= 6 && !!v[5]);
    }, v);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const file = path.resolve(root, `${out}_${i}.png`);
    await page.screenshot({ path: file });
    const st = await page.evaluate(() => ({ calls: window.__stats.calls, triangles: window.__stats.triangles }));
    console.log(`saved ${path.relative(root, file)}  cam=[${cams[i]}]  calls=${st.calls} tris=${st.triangles}`);
    if (args.bench) { const b = await page.evaluate((n) => window.__bench(n), Number(args.bench) > 1 ? Number(args.bench) : 40); console.log(`  bench: ${JSON.stringify(b)}`); }
  }
  if (args.frameprofile) {      // CPU profile of n back-to-back frames (window.__bench) -> <out>.frame.cpuprofile (summarise with tools/cpuprofile-top.mjs)
    const c = await page.createCDPSession(); await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', { interval: 200 }); await c.send('Profiler.start');
    const b = await page.evaluate((n) => window.__bench(n), Number(args.frameprofile) > 1 ? Number(args.frameprofile) : 40);
    const { profile } = await c.send('Profiler.stop'); fs.writeFileSync(path.resolve(root, out + '.frame.cpuprofile'), JSON.stringify(profile)); console.log('frame profile:', JSON.stringify(b));
  }
  if (args.eval) { const result = await page.evaluate(args.eval); console.log('eval:', JSON.stringify(result));
    if (args.evalout) fs.writeFileSync(path.resolve(root, args.evalout), JSON.stringify(result, null, 2)); }
  if (args.diag) { const d = await page.evaluate(() => window.__diag()); console.log('diag:', JSON.stringify(d, null, 1)); }
  console.log('gpu:', info.gl);
  console.log('module stats:', JSON.stringify(info.stats.modules), 'batch:', JSON.stringify(info.stats.batch));
  if (info.errors && info.errors.length) { console.log('MODULE ERRORS:'); for (const e of info.errors) console.log(` - [${e.module}] ${e.message.split('\n').slice(0, 6).join('\n   ')}`); }
} catch (e) {
  console.log('SHOT FAILED:', e.message);
  process.exitCode = 1;
} finally {
  if (logs.length) { console.log('PAGE LOGS:'); for (const l of logs.slice(0, 60)) console.log(' ', l.slice(0, 600)); }
  await browser.close();
  server.close();
}
