// Browser test of the area seam (docs/AREAS.md, milestone M1): the page boots as the area its <html data-area> names, exposes it as __ctx.area, and REFUSES to run when the page and its area
// module disagree. Fast harness (a drive-only build, ~6 s per page), no bake needed. node tools/area-boot-test.mjs [--root <repo dir>] [--page index.html]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {}; for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const root = path.resolve(args.root || here), PAGE = args.page || 'index.html';
const { REGISTRY } = await import(pathToFileURL(path.join(here, 'src/areas/registry.js')).href);
const ROW = Object.values(REGISTRY).find((a) => a.page === PAGE) || REGISTRY.strip;      // the area whose page is tested (--page north.html)
const OTHER = Object.keys(REGISTRY).find((k) => k !== ROW.id);                           // an area module that is NOT this page's: the mismatch test serves the page with its id
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
let rewriteArea = null;      // when set, the page is served with another data-area
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); }
    if (rewriteArea && p === '/' + PAGE) d = Buffer.from(d.toString('utf8').replace(/data-area="[^"]*"/, `data-area="${rewriteArea}"`));
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/${PAGE}`;
const FAST = 'baked=0&only=drive&noroof=1&gate=0&guard=0';
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions'] });
let fails = 0;
const check = (name, ok, detail = '') => { if (ok) console.log('  ok   ' + name); else { fails++; console.log('  FAIL ' + name + (detail !== '' ? '  -> ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); } };
async function open(url) {
  const page = await (await browser.createBrowserContext()).newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.setRequestInterception(true);
  const three = path.join(here, 'node_modules', 'three');
  page.on('request', (req) => {
    const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
    if (m) { const f = path.join(three, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url())) return req.abort('failed');
    req.continue();
  });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  return { page, errors };
}
try {
  console.log('the page boots as its area:');
  { const { page, errors } = await open(`${base}?${FAST}`);
    await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 120000, polling: 250 });
    const r = await page.evaluate(() => ({ id: window.__ctx.area.ID, bake: window.__ctx.area.BAKE_DIR, attr: document.documentElement.dataset.area, errs: (window.__errors || []).length, hero: window.__ctx.area.makeViews ? true : false, mods: Object.keys(window.__stats.modules),
      garage: (window.__ctx.drive ? window.__ctx.drive.fleet.map((v) => ({ id: v.id, x: v.parked.x, z: v.parked.z })) : null), poses: window.__ctx.area.GARAGE ? window.__ctx.area.GARAGE.poses : null }));
    check('__ctx.area.ID equals <html data-area>', r.id === r.attr, r);
    check(`area id is ${ROW.id} and its bake dir is ${ROW.bake}`, r.id === ROW.id && r.bake === ROW.bake, r);
    check('the fast harness built its module', r.mods.includes('drive'), r.mods);
    // docs/AREAS.md 13.4: the four cars stand only at the central station; an area without the station (no ST rectangle in its registry row) holds the purple Zhiguli alone
    const wantCars = ROW.play && !ROW.play.some((q) => q.name === 'ST') && ROW.id !== 'north' ? 'lada' : 'coupe,truck,lada,roadster';
    check('the garage holds the cars of the area (' + wantCars + ') at the poses of the area module', !!r.garage && r.garage.map((c) => c.id).join() === wantCars && r.garage.every((c) => Math.abs(c.x - r.poses[c.id].x) < 1e-6 && Math.abs(c.z - r.poses[c.id].z) < 1e-6), r);
    check('no module errors, no page errors', r.errs === 0 && errors.length === 0, { errs: r.errs, errors });
    await page.close(); }
  console.log('a page whose data-area disagrees with its area module is refused:');
  { rewriteArea = OTHER;
    const { page } = await open(`${base}?${FAST}`);
    await page.waitForFunction("document.getElementById('fatal') && getComputedStyle(document.getElementById('fatal')).display !== 'none'", { timeout: 60000, polling: 250 }).catch(() => {});
    const r = await page.evaluate(() => ({ fatal: !!document.getElementById('fatal'), text: (document.getElementById('fatal') || {}).textContent || '', loaded: document.body.classList.contains('loaded') }));
    check('the fatal card is shown and the scene is not "loaded"', r.fatal && !r.loaded, r);
    check('the card names the disagreement', /area|область/i.test(r.text) || r.text.includes(OTHER), r.text.slice(0, 200));
    rewriteArea = null; await page.close(); }
} catch (e) { fails++; console.log('TEST ERROR:', e.stack || e.message); }
finally { await browser.close(); server.close(); }
console.log(fails ? `RESULT: FAIL (${fails})` : 'RESULT: OK');
process.exit(fails ? 1 : 0);
