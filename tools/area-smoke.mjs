// tools/area-smoke.mjs - ONE real-browser smoke of the live areas on their BAKES (GPU job: take /d/git2/gpulock first): the page loads from assets/baked/<id>/, the scene builds, the player starts, a handful of
// poses are photographed, console / page errors are listed. A look, not a test: the owner wants to see the areas with his eyes first (docs/AREAS.md 13).
//   node tools/area-smoke.mjs [--area palace|smolny|admiralty|all] [--out shots/smoke] [--only name,name]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {}; for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true; }
const OUT = path.resolve(args.out || path.join(here, 'shots/smoke')); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.gz': 'application/gzip' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(here, p);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const threeRoot = path.join(here, 'node_modules', 'three');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// [area page, shot name, [x, z, yaw, pitch, y?] (y = the eye height of a fly pose; omitted = standing on the ground), query extras, time of day (tod.set k) or null]
const SHOTS = [
  ['palace', 'palace-station', [560, 192, -138.5, 8], '', 2.0],
  ['palace', 'palace-square', [-1985, -715, 31.5, 6], '', 2.0],
  ['palace', 'palace-hermitage-neva', [-2039, -1084, -129, 10], '', 2.0],
  ['palace', 'palace-summer-garden', [-905, -1180, 0, 8], '', 2.0],
  ['palace', 'palace-mars-field', [-1180, -1180, -30, 8], '', 2.0],
  ['palace', 'palace-troitsky-open', null, 'troitsky=open', 2.0],
  ['palace', 'palace-palacebridge', [-2352, -872, 35, 8], '', 2.0],
  ['palace', 'palace-palacebridge-open', [-2352, -872, 35, 8], '', 2.0],
  ['smolny', 'smolny-station', [560, 192, -138.5, 8], '', 2.0],
  ['smolny', 'smolny-tauride', [1368, -1471, -4, 2], '', 2.0],
  ['smolny', 'smolny-cathedral', [2335, -1833, -90, 21], '', 2.0],
  ['smolny', 'smolny-lavra', [1900, 960, 180, 8], '', 2.0],
  ['smolny', 'smolny-bolsheokhtinsky', [2480, -1130, -90, 8], '', 2.0],
  // the garden nursery lot (T8b): the owner's pose from above (summer green, not the autumn photo), a lane between two glasshouses, the south edge
  ['smolny', 'smolny-nursery', [1121.5, -1600.2, 44.2, -21.9, 34.1], '', 0],
  ['smolny', 'smolny-nursery-lane', [1072, -1631.5, 90, 2], '', 0],
  ['smolny', 'smolny-nursery-south', [1045, -1596, 0, 4], '', 0],
  // Admiralty-Haymarket (docs/AREAS.md 15.2): the VIEWS poses of src/areas/admiralty/area.js
  ['admiralty', 'admiralty-garden', [-2329, -508, 40.5, 8], '', 2.0],
  ['admiralty', 'admiralty-isaac', [-2488, -63, 15, 18], '', 2.0],
  ['admiralty', 'admiralty-horseman', [-2735, -405, 14.4, 6], '', 2.0],
  ['admiralty', 'admiralty-mariinsky', [-3030, 760, 49.4, 8], '', 2.0],
  ['admiralty', 'admiralty-yusupov', [-2950, 300, -155.3, 8], '', 2.0],
  ['admiralty', 'admiralty-newholland', [-3339, 471, 70.6, 8], '', 2.0],
  ['admiralty', 'admiralty-nikolsky', [-2873, 1040, -170.4, 10], '', 2.0],
  ['admiralty', 'admiralty-blagoveshchensky', [-3376, -100, 25.7, 8], '', 2.0],
  // Vladimirsky-Ligovka (the VIEWS poses of src/areas/vladimirsky/area.js; the Obvodny canal pose looks along the Predtechensky Bridge)
  ['vladimirsky', 'vladimirsky-cathedral', [-215, 438, -103.5, 14], '', 2.0],
  ['vladimirsky', 'vladimirsky-passage', [-217, 432, 119, 10], '', 2.0],
  ['vladimirsky', 'vladimirsky-tolstoy', [-726, 292, -80, 6], '', 2.0],
  ['vladimirsky', 'vladimirsky-station', [560, 192, -138.5, 8], '', 2.0],
  ['vladimirsky', 'vladimirsky-lavra-gate', [1939, 996, -144, 10], '', 2.0],
  ['vladimirsky', 'vladimirsky-obvodny', [218, 1930, 180, 4], '', 2.0],
];
const only = args.only ? String(args.only).split(',') : null, areaArg = args.area || 'all';
const jobs = SHOTS.filter(([a, n]) => (areaArg === 'all' || a === areaArg) && (!only || only.includes(n)));
const PAGE = { palace: 'index.html', smolny: 'smolny.html', admiralty: 'admiralty.html', vladimirsky: 'vladimirsky.html' };
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', '--window-size=1280,720'] });
const report = [];
try {
  let page = null, curArea = null, errors = [];
  for (const [area, name, cam, extra, tod] of jobs) {
    if (area !== curArea || !page) {
      if (page) await page.close();
      const ctxB = await browser.createBrowserContext(); page = await ctxB.newPage(); curArea = area; errors = [];
      await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
        if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
        if (/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url())) return req.abort('failed');
        req.continue();
      });
      page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 220)));
      page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 220)); });
      const t0 = Date.now();
      await page.goto(`${ORIGIN}/${PAGE[area]}?q=performance&gates=0${extra ? '&' + extra : ''}`, { waitUntil: 'load', timeout: 180000 });
      await page.waitForFunction("document.body.classList.contains('loaded') || !!document.querySelector('.fatal, #fatal')", { timeout: 360000, polling: 500 });
      const loadS = ((Date.now() - t0) / 1000).toFixed(1);
      const st = await page.evaluate(() => ({ loaded: document.body.classList.contains('loaded'), fatal: !!document.querySelector('.fatal, #fatal'), errs: (window.__errors || []).map((e) => e.module + ': ' + e.message.slice(0, 160)), timing: window.__stats && window.__stats.timing, regions: window.__regions && window.__regions.stats }));
      console.log(`[${area}] loaded in ${loadS} s; module errors: ${JSON.stringify(st.errs)}; fatal: ${st.fatal}`);
      report.push({ area, loadS, errs: st.errs, fatal: st.fatal });
      if (!st.loaded) { await page.screenshot({ path: path.join(OUT, `${area}-FATAL.png`) }); continue; }
      await page.click('#go'); await page.waitForFunction("document.body.classList.contains('playing')", { timeout: 20000 });
    }
    try {
      if (cam) await page.evaluate((c, t, open) => { window.__setCam(c[0], c[4] === undefined ? null : c[4], c[1], c[2], c[3]); if (t !== null) window.__tod.set(t, true); if (open) { const B = window.__ctx.services.landmarksPalaceBridge; if (B && B.setMode) B.setMode('open'); } }, cam, tod, /-open$/.test(name));
      else if (name === 'palace-troitsky-open') await page.evaluate((t) => { const T = window.__ctx.services.landmarksTroitsky; const p = T && T.frame ? T.frame.toWorld(8, 8) : null; if (p) window.__setCam(p.x, null, p.z, 0, 4); window.__tod.set(t, true); if (T && T.setMode) T.setMode('open'); }, tod);
      await sleep(cam && !/-open$/.test(name) ? 6000 : 95000);      // the regions around the pose stream in; the Troitsky leaf needs about 90 s to rise
      const info = await page.evaluate(() => { const p = window.__ctx.playerObj; return { x: +p.pos.x.toFixed(1), z: +p.pos.z.toFixed(1), y: +p.pos.y.toFixed(2) }; });
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      console.log(`  shot ${name} at ${JSON.stringify(info)}`);
    } catch (e) { console.log(`  shot ${name} FAILED: ${String(e.message).slice(0, 200)}`); }
    if (errors.length) { console.log('  errors so far: ' + JSON.stringify(errors.slice(0, 4))); errors = []; }
  }
} finally { await browser.close(); server.close(); }
console.log('smoke report', JSON.stringify(report));
