// tools/edge-smoke.mjs - real-browser crossings of the edge gates between the live areas on the BAKED pages (GPU job: take /d/git2/gpulock first). A player is placed inside the FROM area (default Palace-Liteyny) near an edge
// that faces the TO area (default Smolninskoye), the gate fires without a question, the page navigates, the destination loads from its bake behind the veil and starts by itself. A look + a check, not a suite.
//   node tools/edge-smoke.mjs [--from palace] [--to smolny] [--out shots/edge] [--mode fly|walk] [--ret] [--net KBPS,LATENCY_MS] [--cpu N] [--fonts-delay MS] [--block-storage] [--remote https://host/path/] [--idle SECONDS]
//   --from / --to    registry ids of two live areas that have an edge gate between them (docs/AREAS.md 15.y: palace, smolny, admiralty, vladimirsky; admiralty and smolny have none)
//   --ret            after the first crossing cross BACK (to -> from) as well, recording that arrival too
//   --net / --cpu    throttle the network (download kbit/s, latency ms; applied after the origin page is up) / the CPU of the page (a factor, 4 = four times slower)
//   --fonts-delay    the Google Fonts stylesheet (render-blocking in the head) answers after this many ms (default 2500 when --net is given, else 0)
//   --stall MS       the destination's FIRST bake request is held for MS ms (a stalled download behind the veil: 55000 outlasts the 45 s loading watchdog of the page, which used to throw the veil away and show the splash)
//   --block-storage  the destination page has no usable sessionStorage (a private window / blocked site data): the veil must still be the plain dark one, never the splash
// THE PRELOADER RULE (docs/AREAS.md 14): from the freeze on the origin to the first live frame on the destination the ONLY thing on screen is the blurred frame (or its plain dark twin) with the one progress bar.
// The recorder below logs EVERY frame of the destination document from its creation (a requestAnimationFrame loop installed before any page script: #intro visibility, the veil, the bar, the page's own state)
// and the check fails when ANY frame shows the splash card, shows no veil before the game runs, shows a bar that goes backwards, or shows the bar's label out of step with the bar.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {}; for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true; }
const OUT = path.resolve(args.out || path.join(here, 'shots/edge')); fs.mkdirSync(OUT, { recursive: true });
const MODE = args.mode === 'walk' ? 'walk' : 'fly';
const NET = args.net ? String(args.net).split(',').map(Number) : null;
const WAIT = Number(args.wait) || 400;
const STALL = Number(args.stall) || 0; let stallLeft = 1;
const FONTS_DELAY = args['fonts-delay'] !== undefined ? Number(args['fonts-delay']) : NET ? 2500 : 0;
const { REGISTRY, GATES } = await import(pathToFileURL(path.join(here, 'src/areas/registry.js')).href);
const inU = (rs, x, z, m = 0) => rs.some((r) => x >= r.x0 + m && x <= r.x1 - m && z >= r.z0 + m && z <= r.z1 - m);
const FROM = args.from || 'palace', TO = args.to || 'smolny';
for (const id of [FROM, TO]) if (!REGISTRY[id] || REGISTRY[id].parked) { console.log(`unknown or parked area "${id}" (live: ${Object.values(REGISTRY).filter((a) => !a.parked).map((a) => a.id).join(', ')})`); process.exit(2); }
if (!GATES.some((g) => g.kind === 'edge' && g.from === FROM && g.to === TO)) { console.log(`no edge gate ${FROM} -> ${TO} (the territories do not overlap)`); process.exit(2); }
// a start point inside FROM, 40 m (the probe rule of the edge gate) before a point that is outside FROM but >= 60 m inside TO, heading east / west / north / south: the first hit of a 20 m grid over the territory of FROM
// (HEADS: dx, dz, yaw; yaw 0 = north, 90 = west, -90 = east, 180 = south)
const HEADS = [[1, 0, -90], [-1, 0, 90], [0, -1, 0], [0, 1, 180]];
function findStart(from, to) {
  const rs = REGISTRY[from].play, x0 = Math.min(...rs.map((r) => r.x0)), x1 = Math.max(...rs.map((r) => r.x1)), z0 = Math.min(...rs.map((r) => r.z0)), z1 = Math.max(...rs.map((r) => r.z1));
  for (let z = z0; z < z1; z += 20) for (let x = x0; x < x1; x += 20) for (const [dx, dz, yaw] of HEADS) {
    const qx = x + 40 * dx, qz = z + 40 * dz;
    if (inU(rs, x, z, 10) && !inU(rs, qx, qz) && inU(REGISTRY[to].play, qx, qz, 60) && inU(REGISTRY[to].play, x, z, 60)) return { x: x - 40 * dx, z: z - 40 * dz, yaw, dx, dz };
  }
  return null;
}
const S1 = findStart(FROM, TO), S2 = findStart(TO, FROM);
if (!S1 || (args.ret && !S2)) { console.log('no start point found'); process.exit(2); }
console.log(`crossing ${FROM} -> ${TO}`, 'start', JSON.stringify(S1), args.ret ? JSON.stringify(S2) : '', 'mode', MODE, 'net', NET ? NET.join(',') : 'off', 'cpu', args.cpu || 1, 'fonts-delay', FONTS_DELAY);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.gz': 'application/gzip' };
let server = null, ORIGIN = args.remote ? String(args.remote).replace(/\/+$/, '') : '';
if (!args.remote) {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(here, p);
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  ORIGIN = `http://127.0.0.1:${server.address().port}`;
}
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const threeRoot = path.join(here, 'node_modules', 'three');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', '--window-size=1280,720'] });
let ok = true; const check = (n, c, d = '') => { if (!c) ok = false; console.log((c ? '  ok   ' : '  FAIL ') + n + (c ? '' : '  -> ' + d)); };

/** The recorder, installed before any script of every document the page loads (so the origin and each destination have their own log, read through window.__rec). One entry per animation frame of the document:
 *  t ms since the document was created, rs readyState, body (does it exist), intro (is the #intro card visible: display / visibility / opacity), seam (is #seam shown), cls (html class), pct (the label of the bar, %),
 *  fill (the bar's drawn width, %), play (body.playing), loaded (body.loaded). */
function recorderSource() {
  window.__rec = { hand: /[?&]ho=/.test(location.search), t0: performance.now(), frames: [], first: null, entry: null };
  try { const e = JSON.parse(sessionStorage.getItem('n4spb.seam') || 'null'); if (e) window.__rec.entry = { p: e.p, imgChars: (e.img || '').length, ageMs: Date.now() - e.t, to: e.to }; } catch (x) { /* blocked */ }
  const px = (e) => { try { const m = /scaleX\(([\d.]+)\)/.exec(e.style.transform) || /matrix\(([\d.]+)/.exec(getComputedStyle(e).transform); return m ? Math.round(Number(m[1]) * 1000) / 10 : 0; } catch (x) { return -1; } };
  const tick = () => {
    const R = window.__rec, b = document.body, i = document.getElementById('intro'), s = document.getElementById('seam');
    let intro = false, seam = false, pct = null, fill = null, op = 0;
    if (i) { const cs = getComputedStyle(i); intro = cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05; }
    if (s) { const cs = getComputedStyle(s); seam = cs.display !== 'none'; const sn = s.querySelector('.seam-snap'); op = sn ? Number(getComputedStyle(sn).opacity) : 1; const p = s.querySelector('.seam-pct'), f = s.querySelector('.seam-fill'); pct = p && getComputedStyle(p).visibility !== 'hidden' ? parseFloat(p.textContent) : null; fill = f ? px(f) : null; }
    const f = { t: Math.round(performance.now() - R.t0), rs: document.readyState, body: !!b, intro, seam, op, plain: !!s && s.classList.contains('plain'), cls: document.documentElement.className, pct, fill, play: !!b && b.classList.contains('playing'), loaded: !!b && b.classList.contains('loaded') };
    if (R.first === null) R.first = f.t;
    if (R.frames.length < 20000) R.frames.push(f);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // a fast sampler for the first seconds: every change of the bar's label with the time it happened (the bar may move between two frames: this is what the next frame will show)
  window.__rec.pctLog = []; let lastPct = null; const iv = setInterval(() => { const p = document.querySelector('#seam .seam-pct'), v = p ? p.textContent : null; if (v !== lastPct) { lastPct = v; window.__rec.pctLog.push([Math.round(performance.now() - window.__rec.t0), v]); } if (performance.now() - window.__rec.t0 > 8000 || window.__rec.pctLog.length > 60) clearInterval(iv); }, 2);
}
/** the verdict on one destination's frame log (a hand-off document: ?ho= in its URL) */
function judge(name, rec) {
  const F = rec.frames, hand = rec.hand;
  const play0 = F.findIndex((f) => f.play), pre = play0 < 0 ? F : F.slice(0, play0);
  const introFrames = F.filter((f) => f.intro), noVeil = pre.filter((f) => !f.seam), back = [];
  let last = -1; for (const f of F) { if (f.seam && f.pct !== null) { if (f.pct < last - 0.6) back.push(f.t + ':' + last + '>' + f.pct); last = Math.max(last, f.pct); } }
  const lag = F.filter((f) => f.seam && f.pct !== null && f.fill !== null && Math.abs(f.pct - f.fill) > 6);
  const first = F[0], startPct = F.find((f) => f.seam && f.pct !== null);
  console.log(`  [${name}] frames ${F.length} (first at ${rec.first} ms), before play ${pre.length}, #intro visible in ${introFrames.length}, no veil before play in ${noVeil.length}, bar backwards ${back.length}, label/bar apart >6 pt in ${lag.length}, first frame:`, JSON.stringify(first), 'bar starts at', startPct ? startPct.pct : 'n/a');
  if (hand) {
    check(`[${name}] no frame shows the splash card (#intro)`, introFrames.length === 0, JSON.stringify(introFrames.slice(0, 3)));
    check(`[${name}] every frame before the game runs shows the veil`, noVeil.length === 0, JSON.stringify(noVeil.slice(0, 3)));
    const plain = F.filter((f) => f.seam && f.plain).length;
    console.log(`  [${name}] veil: ${plain ? 'PLAIN dark (no frozen frame reached this page)' : 'the frozen frame'}; stored entry at document start: ${JSON.stringify(rec.entry)}; bar label changes in the first 8 s: ${JSON.stringify((rec.pctLog || []).slice(0, 14))}`);
    check(`[${name}] the bar continues from the origin (first drawn value >= 10 %) when the frozen frame came along`, plain > 0 || (startPct && startPct.pct >= 10), String(startPct && startPct.pct));
    check(`[${name}] the bar never goes backwards`, back.length === 0, back.slice(0, 3).join(' '));
    check(`[${name}] the bar and its label agree (within 6 points)`, lag.length === 0, JSON.stringify(lag.slice(0, 3)));
  }
  return { startPct: startPct ? startPct.pct : null };
}

/** one crossing from the current page: place the player, wait for the gate, follow the navigation, wait for the destination to run; returns the destination's recorder + state */
async function cross(page, S, tag, destFile) {
  if (MODE === 'fly') await page.keyboard.press('KeyF');
  let early = false;
  await page.evaluate((s, m) => { if (m === 'fly') window.__setCam(s.x, 60, s.z, s.yaw, 0); else window.__setCam(s.x, null, s.z, s.yaw, 0); window.__tod.set(2.0, true); }, S, MODE).catch(() => { early = true; });
  if (!early) { await sleep(4000).catch(() => {}); early = await page.evaluate(() => window.__gates.traveling).catch(() => true); }
  console.log(`  [${tag}] fired BEFORE any key press (60-80 m from the edge)?`, early);
  if (!early) await page.screenshot({ path: path.join(OUT, `${tag}-1-before.png`) }).catch(() => {});
  if (!early) await page.keyboard.down('KeyW').catch(() => {});
  if (!early && MODE === 'walk') await page.keyboard.down('ShiftLeft').catch(() => {});
  const t0 = Date.now();
  let at = null;
  if (!early) at = await page.waitForFunction(() => window.__gates && window.__gates.traveling && document.getElementById('seam') && getComputedStyle(document.getElementById('seam')).display !== 'none' && { t: true, ui: !!document.getElementById('panel') && !document.getElementById('panel').hidden, seam: getComputedStyle(document.getElementById('seam')).display, pct: document.querySelector('.seam-pct').textContent }, { timeout: 60000, polling: 50 }).then((h) => h.jsonValue()).catch(() => null);
  if (!early) { await page.keyboard.up('KeyW').catch(() => {}); await page.keyboard.up('ShiftLeft').catch(() => {}); }
  const trav = early ? { t: true, ui: false, seam: 'block' } : at || { t: true, ui: false, seam: 'block (navigated before it could be read)' };
  check(`[${tag}] the gate fired by itself (traveling, no question panel, veil shown)`, trav.t && !trav.ui && trav.seam !== 'none', JSON.stringify(trav));
  if (!early) await page.screenshot({ path: path.join(OUT, `${tag}-2-veil-origin.png`) }).catch(() => {});
  console.log(`  [${tag}] gate fired after`, Date.now() - t0, 'ms; origin bar', JSON.stringify(trav.pct));
  for (let i = 0; i < 900; i++) { const p = await page.evaluate(() => location.pathname).catch(() => ''); if (p.endsWith(destFile)) break; await sleep(200); }
  for (let i = 0; i < WAIT * 2; i++) { const pl = await page.evaluate(() => !!document.body && document.body.classList.contains('playing')).catch(() => false); if (pl) break; await sleep(500); }
  await sleep(2500);
  const r = await page.evaluate(() => ({ path: location.pathname, playing: document.body.classList.contains('playing'), rec: window.__rec, area: window.__ctx && window.__ctx.area && window.__ctx.area.ID, p: window.__ctx && window.__ctx.playerObj ? [Math.round(window.__ctx.playerObj.pos.x), Math.round(window.__ctx.playerObj.pos.z)] : null, seamLeft: !!(document.getElementById('seam') && getComputedStyle(document.getElementById('seam')).display !== 'none'), introDisplay: getComputedStyle(document.getElementById('intro')).display })).catch((e) => ({ err: String(e.message).slice(0, 100) }));
  await page.screenshot({ path: path.join(OUT, `${tag}-3-destination.png`) }).catch(() => {});
  return r;
}

try {
  const page = await (await browser.createBrowserContext()).newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(u);
    if (m && !args.remote) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
    if (/^https:\/\/fonts\.googleapis\.com/.test(u)) { if (!FONTS_DELAY) return req.abort('failed'); return void setTimeout(() => req.respond({ status: 200, contentType: 'text/css', body: '/* the fonts stylesheet, late */' }).catch(() => {}), FONTS_DELAY); }
    if (/^https:\/\/fonts\.gstatic\.com/.test(u)) return req.abort('failed');
    if (STALL && stallLeft && u.includes('/' + REGISTRY[TO].bake) && page.url().includes(REGISTRY[TO].page)) { stallLeft--; console.log('  holding the first ' + TO + ' bake request for', STALL, 'ms:', u.slice(-60)); return void setTimeout(() => req.continue().catch(() => {}), STALL); }
    req.continue();
  });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
  await page.evaluateOnNewDocument(recorderSource);
  if (args['block-storage']) await page.evaluateOnNewDocument(() => { if (/[?&]ho=/.test(location.search)) { try { Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); } catch (e) { /* ignore */ } } });
  await page.goto(`${ORIGIN}/${REGISTRY[FROM].page}?q=performance`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 360000, polling: 500 });
  await page.click('#go'); await page.waitForFunction("document.body.classList.contains('playing')", { timeout: 20000 });
  check(`${FROM} page has edge gates armed`, await page.evaluate(() => !!window.__gates && window.__gates.gates.some((g) => g.kind === 'edge')));
  if (args.idle) { await sleep(Number(args.idle) * 1000); console.log('idle check: path', await page.evaluate(() => location.pathname).catch((e) => 'NAVIGATED ' + e.message.slice(0, 40)), 'traveling', await page.evaluate(() => window.__gates && window.__gates.traveling).catch(() => 'n/a')); process.exit(0); }
  if (NET) await page.emulateNetworkConditions({ download: NET[0] * 125, upload: NET[0] * 125, latency: NET[1] || 0 });
  if (args.cpu) await page.emulateCPUThrottling(Number(args.cpu));

  const r = await cross(page, S1, 'there', REGISTRY[TO].page);
  console.log('  destination', JSON.stringify({ ...r, rec: undefined }));
  check(`${TO} started by itself and the veil is gone`, !!r.path && r.path.endsWith(REGISTRY[TO].page) && r.area === TO && r.playing && !r.seamLeft, JSON.stringify({ ...r, rec: undefined }));
  check('the splash card stays hidden on the running destination', r.introDisplay === 'none', String(r.introDisplay));
  check('same place: within 150 m of where he left', r.p && Math.hypot(r.p[0] - (S1.x + 80 * S1.dx), r.p[1] - (S1.z + 80 * S1.dz)) < 150, JSON.stringify(r.p));
  if (r.rec) judge(`${FROM} -> ${TO}`, r.rec);
  if (args.ret && r.playing) {
    const r2 = await cross(page, S2, 'back', REGISTRY[FROM].page);
    console.log('  back at', JSON.stringify({ ...r2, rec: undefined }));
    check(`${FROM} started by itself again and the veil is gone`, !!r2.path && r2.path.endsWith(REGISTRY[FROM].page) && r2.area === FROM && r2.playing && !r2.seamLeft, JSON.stringify({ ...r2, rec: undefined }));
    if (r2.rec) judge(`${TO} -> ${FROM}`, r2.rec);
  }
  if (errors.length) console.log('  page errors:', JSON.stringify(errors.slice(0, 3)));
} finally { await browser.close(); if (server) server.close(); }
console.log(ok ? 'EDGE-SMOKE OK' : 'EDGE-SMOKE FAIL');
process.exit(ok ? 0 : 1);
