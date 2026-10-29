// Surface cost of the metro, measured in the REAL page (full scene, normal baked loading): which underground geometry the street view draws, the draw calls of a
// fixed render, the metro's retained memory, and the frame / heap trace while standing and while driving (a drop of the JS heap between two frames = a garbage collection).
//   node tools/metro-surface-probe.mjs [--root <dir>] [--trace-gc] [--gctrace] [--profile] [--free] [--start "498.2286,135.1625,76.0322"] [--q medium] [--params "k=v"] [--stand 8] [--drive 12] [--out shots/perf/metro-probe]
// Diagnostic only (CDP heap reads and the per-frame heap samples cost time): never a timed FPS comparison; use tools/drive-bench.mjs for that.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; }
const root = args.root ? path.resolve(args.root) : here;      // --root <project dir>: serve another checkout (an A/B against an older revision); outputs and three.js stay here
const out = args.out || 'shots/perf/metro-probe';
fs.mkdirSync(path.dirname(path.resolve(here, out)), { recursive: true });
const { handleBakedRevision } = await import('./lib/dev-revision.mjs');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--disable-http2', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--window-size=1280,720', '--enable-precise-memory-info', ...(args['trace-gc'] ? ['--js-flags=--trace-gc'] : [])], dumpio: !!args['trace-gc'], defaultViewport: { width: 1280, height: 720 }, protocolTimeout: 600000 });
const page = await browser.newPage();
const threeRoot = path.join(here, 'node_modules', 'three');
const fetchSession = await page.createCDPSession();
await fetchSession.send('Fetch.enable', { patterns: [{ urlPattern: 'https://cdn.jsdelivr.net/npm/three@*/*' }] });
fetchSession.on('Fetch.requestPaused', async ({ requestId, request }) => {
  try {
    const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(request.url); const file = m && path.join(threeRoot, m[1].split('?')[0]);
    if (file && fs.existsSync(file)) await fetchSession.send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: fs.readFileSync(file).toString('base64') });
    else await fetchSession.send('Fetch.continueRequest', { requestId });
  } catch (e) { /* closed */ }
});
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
const q = new URLSearchParams({ q: args.q || 'medium', stats: '1' });
if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);
const t0 = Date.now();
console.log('loading', q.toString());
await page.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: 400000, polling: 250 });
console.log('loaded after', ((Date.now() - t0) / 1000).toFixed(1), 's; baked', await page.evaluate(() => JSON.stringify({ rev: window.__stats?.baked?.revision, n: window.__stats?.baked?.loaded?.length })));
await page.click('#go'); await sleep(1500);
const start = (args.start || '498.2286,135.1625,76.0322').split(',').map(Number);
await page.evaluate(async (a) => { await window.__regions?.ensureAt(a[0], a[1]); const d = window.__drive; d.enter(); d.place(...a); }, start);
await sleep(2500);

{ const t1 = Date.now(); while (Date.now() - t1 < 20000 && await page.evaluate(() => { const r = window.__ctx.metro && window.__ctx.metro.release; return !!(r && !r.done); })) await sleep(250);
  console.log('RELEASE', await page.evaluate(() => JSON.stringify(window.__ctx.metro && window.__ctx.metro.release ? { ...window.__ctx.metro.release, orphanPxM: +(window.__ctx.metro.release.orphanPx / 1e6).toFixed(1), uploadedPxM: +(window.__ctx.metro.release.uploadedPx / 1e6).toFixed(1), ms: Math.round(window.__ctx.metro.release.ms) } : null))); }
// ---- 1. census: what the street view draws that lies underground (exact: the renderer's own draw list of one frame)
const census = await page.evaluate(() => {
  const ctx = window.__ctx, R = ctx.renderer, scene = ctx.staticRoot.parent, THREE = window.THREE;
  const tagOf = (o) => { for (let p = o; p; p = p.parent) { const u = p.userData; if (u.undergroundOnly) return 'under'; if (u.alwaysVisible) return 'always'; if (u.surfaceOnly) return 'surface'; } return '-'; };
  const label = (o) => { const names = []; for (let p = o; p && p !== scene; p = p.parent) if (p.name) names.push(p.name); return names.reverse().slice(0, 3).join('/') || o.type; };
  const sph = new THREE.Sphere();
  const worldSphere = (o) => { const g = o.geometry; if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); sph.copy(o.boundingSphere); } else { if (!g.boundingSphere) g.computeBoundingSphere(); sph.copy(g.boundingSphere); } return sph.applyMatrix4(o.matrixWorld); };
  const draws = new Map(); let total = 0;
  const orig = R.renderBufferDirect;
  R.renderBufferDirect = function (camera, sc, geometry, material, object, group) { total++; draws.set(object, (draws.get(object) || 0) + 1); return orig.apply(this, arguments); };
  try { window.__bench(1); } finally { R.renderBufferDirect = orig; }
  const under = {}; let underDraws = 0, underTris = 0, taggedDrawn = 0;
  for (const [o, n] of draws) {
    if (!o.geometry || !o.isMesh) continue;
    const s = worldSphere(o); if (s.center.y + s.radius > -3) continue;
    const tg = tagOf(o); if (tg === 'under') taggedDrawn += n;
    const tris = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
    const k = label(o) + ' [' + tg + ']'; const e = under[k] || (under[k] = { draws: 0, meshes: 0, tris: 0, y: Math.round(s.center.y) }); e.draws += n; e.meshes++; e.tris += Math.round(tris);
    underDraws += n; underTris += tris;
  }
  const top = Object.entries(under).sort((a, b) => b[1].draws - a[1].draws).slice(0, 40);
  // visible-mesh count (scene graph, all ancestors visible) below -3 m by top-level group
  const byTop = {}; let visUnder = 0;
  const walk = (o, vis, topName) => { if (!o.visible) return; if (o.isMesh && o.geometry) { const s = worldSphere(o); if (s.center.y + s.radius < -3) { visUnder++; byTop[topName] = (byTop[topName] || 0) + 1; } } for (const c of o.children) walk(c, vis, topName); };
  for (const r of [ctx.staticRoot, ctx.dynamicRoot]) for (const c of r.children) { if (c.name === 'sectors' || c.name === 'nd-sectors' || c.name === 'static-batched' || c.name === 'static-nd') { for (const cc of c.children) walk(cc, true, c.name + '/' + (cc.name || cc.type)); } else walk(c, true, (r === ctx.staticRoot ? 's:' : 'd:') + (c.name || c.type)); }
  const topVis = Object.entries(byTop).sort((a, b) => b[1] - a[1]).slice(0, 30);
  return { totalDraws: total, underDraws, underTris: Math.round(underTris), taggedDrawn, top, visibleUnderMeshes: visUnder, topVis, zones: ctx.zones.visibility, camY: ctx.camera.position.y };
});
console.log('CENSUS', JSON.stringify(census, null, 1));
const bench = await page.evaluate(() => window.__bench(10));
console.log('BENCH', JSON.stringify(bench));

// ---- 2. memory: the metro's retained CPU geometry, canvases, texture pixels; the heap
const cdp = await page.createCDPSession();
const heap = async () => { try { return await cdp.send('Runtime.getHeapUsage'); } catch (e) { return null; } };
const mem = await page.evaluate(() => {
  const ctx = window.__ctx; const seenG = new Set(), seenT = new Set(); let metroGeoBytes = 0, metroGeoN = 0, metroMeshes = 0, canvasPx = 0, canvasN = 0, metroTris = 0;
  const under = (o) => { for (let p = o; p; p = p.parent) if (p.userData.undergroundOnly) return true; return false; };
  ctx.staticRoot.parent.traverse((o) => {
    const m = o.material; for (const mm of Array.isArray(m) ? m : m ? [m] : []) for (const k of ['map', 'emissiveMap', 'alphaMap']) { const t = mm[k]; if (t && !seenT.has(t) && t.image && t.image.nodeName === 'CANVAS') { seenT.add(t); canvasPx += t.image.width * t.image.height; canvasN++; } }
    if (!o.isMesh || !o.geometry || !under(o)) return; metroMeshes++;
    const g = o.geometry; metroTris += (g.index ? g.index.count : g.attributes.position?.count || 0) / 3;
    if (seenG.has(g)) return; seenG.add(g); metroGeoN++;
    for (const a of Object.values(g.attributes)) if (a.array) metroGeoBytes += a.array.byteLength; if (g.index && g.index.array) metroGeoBytes += g.index.array.byteLength;
  });
  const st = ctx.metro && ctx.metro.stations; let trainsBuilt = 0, activeTracks = 0;
  if (st) for (const rt of Object.values(st)) for (const tk of rt.platform?.tracks || []) { trainsBuilt += Object.keys(tk.trains || {}).length; }
  return { texPixelsM: +(ctx.tex.pixels / 1e6).toFixed(1), texCache: ctx.tex.cache.size, canvasTexturesInScene: canvasN, canvasPxInSceneM: +(canvasPx / 1e6).toFixed(1), metroMeshes, metroGeometries: metroGeoN, metroCpuGeoMB: +(metroGeoBytes / 1048576).toFixed(1), metroTris: Math.round(metroTris), trainsBuilt, sessionTrains: Object.keys(ctx.metro?.sessionTrains || {}).length, heapLimitMB: Math.round(performance.memory.jsHeapSizeLimit / 1048576), usedMB: Math.round(performance.memory.usedJSHeapSize / 1048576) };
});
console.log('MEMORY', JSON.stringify(mem), 'cdp heap', JSON.stringify(await heap()));

// ---- 0. --gctrace: a 6 s Chrome trace while standing, GC events by name (MinorGC = scavenge, MajorGC = mark-compact) with their longest instances
if (args.gctrace) {
  const tc = await page.createCDPSession(); const events = [];
  tc.on('Tracing.dataCollected', (e) => { for (const ev of e.value) if (/GC|Scaveng|Marking|Mark|Sweep|Compact|Heap/i.test(ev.name)) events.push(ev); });
  const done = new Promise((r) => tc.once('Tracing.tracingComplete', r));
  await tc.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'v8', 'disabled-by-default-v8.gc'], excludedCategories: ['*'] } });
  await sleep(6000);
  await tc.send('Tracing.end'); await done;
  const by = {};
  for (const ev of events) { if (ev.ph !== 'X' && ev.ph !== 'B') continue; const k = ev.name; const e = by[k] || (by[k] = { n: 0, ms: 0, max: 0, maxArgs: null }); const d = (ev.dur || 0) / 1000; e.n++; e.ms += d; if (d > e.max) { e.max = d; e.maxArgs = ev.args; } }
  const top = Object.entries(by).sort((a, b) => b[1].ms - a[1].ms).slice(0, 25);
  for (const [k, e] of top) console.log('GCTRACE', k, 'n', e.n, 'ms', e.ms.toFixed(0), 'max', e.max.toFixed(0), JSON.stringify(e.maxArgs).slice(0, 300));
}
// ---- 3. frame + heap trace: standing still in the car, then full throttle (a heap drop of > 30 MB between two frames = a GC that frame)
await page.evaluate(() => {
  const T = window.__trace = { on: false, f: [] };
  let last = performance.now();
  const tick = (now) => { if (T.on) T.f.push([+(now - last).toFixed(1), Math.round(performance.memory.usedJSHeapSize / 1048576), window.__stats.calls]); last = now; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const phase = async (name, secs, key) => {
  await page.evaluate(() => { window.__trace.f = []; window.__trace.on = true; });
  if (key) await page.keyboard.down(key);
  await sleep(secs * 1000);
  if (key) await page.keyboard.up(key);
  const f = await page.evaluate(() => { window.__trace.on = false; return window.__trace.f; });
  const d = f.map((x) => x[0]).sort((a, b) => a - b), pct = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))];
  let gcs = 0, gcFreed = 0; const spikes = [];
  for (let i = 1; i < f.length; i++) { const drop = f[i - 1][1] - f[i][1]; if (drop > 30) { gcs++; gcFreed += drop; } if (f[i][0] > 300) spikes.push(`${f[i][0]}ms heap ${f[i - 1][1]}->${f[i][1]}`); }
  const r = { name, frames: f.length, mean: +(d.reduce((s, v) => s + v, 0) / d.length).toFixed(1), p50: pct(0.5), p95: pct(0.95), max: d[d.length - 1], gcDrops: gcs, freedMB: gcFreed, heapMin: Math.min(...f.map((x) => x[1])), heapMax: Math.max(...f.map((x) => x[1])), callsMean: Math.round(f.reduce((s, x) => s + x[2], 0) / f.length), spikes: spikes.slice(0, 12) };
  console.log('PHASE', JSON.stringify(r));
  return { ...r, trace: f };
};
if (args.profile) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); }
console.log('PHASE-MARK stand start');
const stand = await phase('stand', Number(args.stand || 8), null);
if (args.profile) { const { profile } = await cdp.send('Profiler.stop'); fs.writeFileSync(path.resolve(here, out + '-stand.cpuprofile'), JSON.stringify(profile)); console.log('profile', out + '-stand.cpuprofile'); }
console.log('PHASE-MARK drive start');
const drive = await phase('drive', Number(args.drive || 12), 'KeyW');
// ---- 4. --free: a causal test of the metro's memory share. Step A zeroes the canvases that ONLY metro meshes use (their backing stores are external memory of V8), step B also
// drops the CPU arrays of every metro mesh and removes the metro subtrees; after each step a forced GC and a standing phase. Diagnostic only: the page is unusable afterwards.
if (args.free) {
  const breakdown = await page.evaluate(() => {
    const ctx = window.__ctx, scene = ctx.staticRoot.parent;
    const isMetro = (o) => { for (let p = o; p; p = p.parent) { const u = p.userData; if (u.undergroundOnly) return true; if (p.name && /^(platform-|metro|real-link|generic-|vosstaniya|vladimirskaya|tunnel)/.test(p.name)) return true; } return false; };
    const texUse = new Map();      // texture -> { metro, other }
    scene.traverse((o) => { const m = o.material; for (const mm of Array.isArray(m) ? m : m ? [m] : []) for (const k in mm) { const t = mm[k]; if (t && t.isTexture) { const e = texUse.get(t) || { metro: 0, other: 0 }; if (isMetro(o)) e.metro++; else e.other++; texUse.set(t, e); } } });
    const keyOf = new Map(); for (const [k, t] of ctx.tex.cache) keyOf.set(t, k);
    const prefix = (k) => (k || '(nokey)').replace(/[-_|:].*$/, '');
    const only = [], byPrefix = {}; let px = 0;
    for (const [t, e] of texUse) if (e.metro && !e.other && t.image && t.image.nodeName === 'CANVAS') { only.push(t); const n = t.image.width * t.image.height; px += n; const p = prefix(keyOf.get(t)); byPrefix[p] = (byPrefix[p] || 0) + n; }
    // cached canvases referenced by no mesh of the scene (orphans: drawn, never used)
    let orphanPx = 0; const orphanBy = {}; const used = new Set(texUse.keys());
    for (const [k, t] of ctx.tex.cache) if (!used.has(t) && t.image && t.image.nodeName === 'CANVAS') { const n = t.image.width * t.image.height; orphanPx += n; const p = prefix(k); orphanBy[p] = (orphanBy[p] || 0) + n; }
    const big = only.map((t) => [keyOf.get(t) || t.uuid.slice(0, 8), t.image.width + 'x' + t.image.height]).sort((a, b) => eval(b[1].replace('x', '*')) - eval(a[1].replace('x', '*'))).slice(0, 25);
    window.__metroOnlyTex = only;
    const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => k + ' ' + (v / 1e6).toFixed(1) + 'M');
    return { metroOnlyCanvases: only.length, metroOnlyPxM: +(px / 1e6).toFixed(1), byPrefix: top(byPrefix), big, orphanPxM: +(orphanPx / 1e6).toFixed(1), orphanBy: top(orphanBy) };
  });
  console.log('METRO TEXTURES', JSON.stringify(breakdown, null, 1));
  const gc = async () => { try { await cdp.send('HeapProfiler.collectGarbage'); } catch (e) { /* */ } await sleep(1500); };
  await page.evaluate(() => { for (const t of window.__metroOnlyTex) { t.image.width = 1; t.image.height = 1; } });
  await gc(); console.log('A: metro canvases zeroed; heap', JSON.stringify(await heap()), 'perf.memory MB', await page.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1048576)));
  await phase('stand-after-canvases', 8, null);
  const freed = await page.evaluate(() => {
    const ctx = window.__ctx, scene = ctx.staticRoot.parent; let bytes = 0; const seen = new Set(), victims = [];
    const tagged = (o) => { for (let p = o; p; p = p.parent) if (p.userData.undergroundOnly) return true; return false; };
    scene.traverse((o) => { if (o.userData.undergroundOnly && !(o.parent && tagged(o.parent))) victims.push(o); });
    for (const v of victims) v.traverse((o) => { const g = o.geometry; if (!g || seen.has(g)) return; seen.add(g); for (const a of [...Object.values(g.attributes), g.index]) if (a && a.array && a.array.byteLength) { bytes += a.array.byteLength; a.array = new a.array.constructor(0); } if (o.isInstancedMesh && o.instanceMatrix.array.byteLength) { bytes += o.instanceMatrix.array.byteLength; o.instanceMatrix.array = new Float32Array(0); } });
    for (const v of victims) v.removeFromParent();
    return { roots: victims.length, MB: +(bytes / 1048576).toFixed(1) };
  });
  await gc(); console.log('B: metro geometry dropped', JSON.stringify(freed), 'heap', JSON.stringify(await heap()), 'perf.memory MB', await page.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1048576)));
  await phase('stand-after-geometry', 8, null);
}
const pos = await page.evaluate(() => { const c = window.__drive.car; return { x: Math.round(c.x), z: Math.round(c.z), kmh: Math.round(c.speed) }; });
console.log('END', JSON.stringify(pos), 'cdp heap', JSON.stringify(await heap()));
fs.writeFileSync(path.resolve(here, out + '.json'), JSON.stringify({ params: q.toString(), census, bench, mem, stand, drive, pos }, null, 1));
await browser.close(); server.close();
console.log('EXIT 0');
