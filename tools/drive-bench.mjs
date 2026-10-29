// Driving benchmark in the REAL page (normal loading, regions streaming while the car moves): load -> Start -> get into the car (test hook) -> full throttle along a straight
// for --seconds, recording every frame's duration, draw calls, long tasks (> 50 ms) and the region attaches. Prints mean / p50 / p95 / max frame ms, hitch counts and where
// the car got. A/B: --params "lodscale=0.6" etc.
//   node tools/drive-bench.mjs [--q medium] [--seconds 20] [--start "x,z,yawDeg"] [--params "k=v&k2=v2"] [--out shots/drive/bench] [--mid-shot] [--walk]
// Screenshots are taken after recording by default; --mid-shot deliberately includes capture overhead in the measured drive.
// --post-profile collects a separate stationary CPU profile after the timed run and JSON are complete.
// --walk uses the same streaming scene and W input at normal walking speed/eye height, without entering the car. Choose an unobstructed walking route.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { resolveArea } from './lib/area-page.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const AREA = resolveArea(args, root);      // --area <id> | --page <file>: benchmark another area's page (default: the strip, index.html)
const walk = !!args.walk, mode = walk ? 'walk' : 'drive';
const out = args.out || 'shots/drive/bench';
fs.mkdirSync(path.dirname(path.resolve(root, out)), { recursive: true });
const { handleBakedRevision } = await import('./lib/dev-revision.mjs');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); }
    // Console-only startup instrumentation; explicitly diagnostic, never used
    // for reported benchmark comparisons. Shipping source/hash stay untouched.
    if(args['startup-phases']&&p==='/src/main.js'){
      let source=data.toString('utf8');
      for(const [needle,phase] of [
        ['  const wm = ctx.wires.build();','wires'],
        ['  pipeline.sectorsRoot = LOD.init','sectors'],
        ["  const b = params.get('batch')",'batch'],
        ["  if (params.get('split')",'split'],
        ["  if (params.get('nd') !== '0') stats.nd =",'outline-proxies'],
        ['  stats.unifiedColor =','finalize'],
        ['  const TC = performance.now();','compile'],
        ['  await buildRoofMap();','roof'],
        ['  if (simT > 0) window.__sim','simulation'],
        ['  { const gl = renderer.getContext(), px =','first-frame'],
        ["  if (!params.has('keepcpu') && !ctx.recordBake)",'upload-frame'],
      ]){if(!source.includes(needle))throw Error('Startup probe missing '+phase);source=source.replace(needle,`  console.warn('[startup-phase] ${phase}',Math.round(performance.now()),performance.memory?.usedJSHeapSize,performance.memory?.jsHeapSizeLimit);\n`+needle);}
      data=source;
    }
    if(args['startup-phases']&&p==='/src/core/batch2.js'){
      let source=data.toString('utf8');
      source=source.replace('  const atlasTex =',"  const __probe = cand.length > 1000; let __groupNumber=0;\n  if(__probe)console.warn('[batch-phase] candidates',cand.length);\n  const atlasTex =");
      source=source.replace('  const atlas =',"  if(__probe)console.warn('[batch-phase] atlas-start',atlasTex.size);\n  const atlas =");
      source=source.replace('  // ---- group',"  if(__probe)console.warn('[batch-phase] atlas-complete',atlas.texs.length);\n  // ---- group");
      source=source.replace('  // ---- merge',"  if(__probe)console.warn('[batch-phase] groups-complete',groups.size);\n  // ---- merge");
      source=source.replace('    const list = grp.items, matT = grp.mat;',"    const list = grp.items, matT = grp.mat;\n    const __vertices=list.reduce((n,it)=>n+it.o.geometry.attributes.position.count,0),__track=__probe&&(__vertices>50000||__groupNumber%500===0);__groupNumber++;\n    if(__track)console.warn('[batch-phase] group-start',__groupNumber,list[0].o.name,list.length,__vertices,grp.big,performance.memory?.usedJSHeapSize);");
      source=source.replace('    const mg = mergeStaticGeometries(geos);',"    if(__track)console.warn('[batch-phase] prepared',__groupNumber);\n    const mg = mergeStaticGeometries(geos);\n    if(__track)console.warn('[batch-phase] merged',__groupNumber);");
      source=source.replace('    for (const it of list) victims.push(it.o);',"    if(__track)console.warn('[batch-phase] placed',__groupNumber);\n    for (const it of list) victims.push(it.o);");
      source=source.replace('  const farProxies = buildFarProxies();',"  if(__probe)console.warn('[batch-phase] far-start',farBins.size);\n  const farProxies = buildFarProxies();\n  if(__probe)console.warn('[batch-phase] complete');");
      data=source;
    }
    if((args['heap-snapshot']||args['heap-sampling'])&&p==='/src/main.js')data=data.toString('utf8').replace('  const wm = ctx.wires.build();',"  await new Promise(()=>console.warn('[memory-gate] ready'));\n  const wm = ctx.wires.build();");
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const exe = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--disable-http2', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--window-size=1280,720', ...(args['browser-heap'] ? [`--js-flags=--max-old-space-size=${Number(args['browser-heap'])}`] : [])], defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout: Number(args['protocol-timeout'] || 300000) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await browser.newPage();
  await (await import('./font-transport.mjs')).installFontTransport(page, true);
  let snapshotReady;
  if(args['heap-snapshot']||args['heap-sampling']){
    const snapshot=path.resolve(root,args['heap-snapshot']||args['heap-sampling']);fs.mkdirSync(path.dirname(snapshot),{recursive:true});fs.writeFileSync(snapshot,'');
    const session=await page.createCDPSession();await session.send('HeapProfiler.enable');
    if(args['heap-sampling'])await session.send('HeapProfiler.startSampling',{samplingInterval:65536});
    snapshotReady=new Promise((resolve,reject)=>{let capturing=false;session.on('HeapProfiler.addHeapSnapshotChunk',({chunk})=>fs.appendFileSync(snapshot,chunk));page.on('console',async message=>{if(message.text()!=='[memory-gate] ready'||capturing)return;capturing=true;try{console.log('Capturing pre-batch heap diagnostic');if(args['heap-sampling']){const usage=await session.send('Runtime.getHeapUsage'),profile=await session.send('HeapProfiler.getSamplingProfile');fs.writeFileSync(snapshot,JSON.stringify({usage,...profile}));}else await session.send('HeapProfiler.takeHeapSnapshot',{reportProgress:false});resolve(snapshot);}catch(e){reject(e);}});});
  }
  const errs = []; let rejectFailure;
  const failure = new Promise((_, reject) => { rejectFailure = reject; }); failure.catch(() => {});
  const fail = (kind, message) => { errs.push(message); console.error(`${kind}: ${message}`); rejectFailure(new Error(`${kind}: ${message}`)); };
  page.on('pageerror', e => fail('PAGE ERROR', e.message));
  page.on('error', e => fail('RENDERER ERROR', e.message));
  let progress = 'loading page';
  page.on('console', m => {
    const message = m.text();
    if (message.startsWith('[drive-progress] ')) progress = message.slice(17);
    else if(message.startsWith('[startup-phase] ')||message.startsWith('[batch-phase] '))console.log(message);
    else if (message.startsWith('[module ')) fail('MODULE ERROR', message);
    else if (m.type() === 'error') console.error('PAGE CONSOLE:', message);
  });
  page.on('requestfailed', r => {
    const message = `${r.url().slice(0, 200)} ${r.failure()?.errorText || 'unknown error'}`;
    // Chromium can report a cancelled network request after its fetch consumer
    // completed successfully. Keep these notices out of PowerShell's error stream.
    if (r.failure()?.errorText === 'net::ERR_ABORTED') console.log('REQUEST ABORTED (info):', message);
    else fail('REQUEST FAILED', message);
  });
  page.on('response', r => {
    if (r.status() < 400) return;
    console.error('HTTP', r.status(), r.url().slice(0, 200));
    if (/\.m?js(?:\?|$)/.test(r.url())) rejectFailure(new Error(`Script request failed: HTTP ${r.status()} ${r.url()}`));
  });
  await page.evaluateOnNewDocument(() => {
    addEventListener('DOMContentLoaded', () => {
      const label = document.getElementById('loadlabel'), percent = document.getElementById('loadpct');
      if (!label) return;
      const report = () => console.log(`[drive-progress] ${percent?.textContent || ''} ${label.textContent || 'finalizing'}`);
      new MutationObserver(report).observe(label, { childList: true, characterData: true, subtree: true }); report();
    }, { once: true });
  });
  const threeRoot = path.join(root, 'node_modules', 'three');
  if (fs.existsSync(threeRoot)) {
    // Only the CDN modules enter DevTools interception. Large baked assets
    // stream directly through the normal browser network stack.
    const fetchSession = await page.createCDPSession();
    await fetchSession.send('Fetch.enable', { patterns: [{ urlPattern: 'https://cdn.jsdelivr.net/npm/three@*/*' }] });
    fetchSession.on('Fetch.requestPaused', async ({ requestId, request }) => {
      try {
        const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(request.url);
        const file = m && path.join(threeRoot, m[1].split('?')[0]);
        if (file && fs.existsSync(file)) await fetchSession.send('Fetch.fulfillRequest', { requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/javascript; charset=utf-8' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: fs.readFileSync(file).toString('base64') });
        else await fetchSession.send('Fetch.continueRequest', { requestId });
      } catch (e) { fail('CDN INTERCEPTION ERROR', e.message); }
    });
  }
  const q = new URLSearchParams({ q: args.q || 'medium', stats: '1' });
  if (args.params) for (const [k, v] of new URLSearchParams(args.params)) q.set(k, v);
  const t0 = Date.now();
  console.log(`Loading ${walk ? 'walking' : 'driving'} benchmark: quality=${q.get('q')} params=${q}`);
  const heartbeat = setInterval(() => console.log(`[load ${Math.round((Date.now() - t0) / 1000)}s] ${progress}`), 30000);
  try {
    await Promise.race([(async () => {
      const response = await page.goto(`http://127.0.0.1:${port}/${AREA.page}?${q}`, { waitUntil: 'load', timeout: 120000 });
      if(snapshotReady){const snapshot=await snapshotReady;console.log('Diagnostic heap saved:',snapshot);await browser.close();server.close();process.exit(0);}
      console.log(`Page loaded: HTTP ${response?.status()} after ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      await page.waitForFunction("document.body.classList.contains('loaded')", { timeout: Number(args['load-timeout'] || 280000), polling: 250 });
    })(), failure]);
  } catch (e) {
    console.error(`Load stopped after ${Math.round((Date.now() - t0) / 1000)}s at ${progress}`);
    const diagnostic = await Promise.race([
      page.evaluate(() => ({ label: document.getElementById('loadlabel')?.textContent, loaded: document.body.classList.contains('loaded'),
        timing: window.__stats?.timing, recentModules: Object.entries(window.__stats?.modules || {}).slice(-5),
        moduleErrors: (window.__errors || []).slice(0, 8), heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }))
        .catch(error => ({ unavailable: error.message })),
      sleep(2000).then(() => ({ unavailable: 'Renderer did not answer diagnostics within 2 seconds' })),
    ]);
    console.error('LOAD DIAGNOSTIC:', JSON.stringify(diagnostic));
    throw e;
  } finally { clearInterval(heartbeat); }
  const loadSeconds = (Date.now() - t0) / 1000;
  const moduleErrors = await page.evaluate(() => window.__errors || []);
  if (moduleErrors.length) throw new Error(`Module errors: ${JSON.stringify(moduleErrors)}`);
  console.log(`intro ready after ${loadSeconds.toFixed(1)} s`);
  await page.click('#go'); await sleep(1500);
  // recorder: frame durations from rAF, long tasks, region attaches (wrapping ctx.onRegionAttach), zones.refresh calls
  await page.evaluate(() => {
    const R = window.__rec = { dts: [], calls: [], long: [], attach: [], refreshMs: 0, refreshN: 0, on: false, startedAt: null, endedAt: null };
    const ctx = window.__ctx;
    const oa = ctx.onRegionAttach; ctx.onRegionAttach = (g) => { const a = performance.now(); oa && oa(g); if (R.on) R.attach.push(+(performance.now() - a).toFixed(1)); };
    const zr = ctx.zones.refresh; ctx.zones.refresh = () => { const a = performance.now(); zr(); if (R.on) { R.refreshMs += performance.now() - a; R.refreshN++; } };
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (R.on && e.startTime >= R.startedAt) R.long.push(Math.round(e.duration)); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
    let last = performance.now();
    const tick = (now) => { if (R.on) { R.dts.push(now - last); R.calls.push(window.__stats.calls); } last = now; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    R.start = () => new Promise(resolve => requestAnimationFrame(now => {
      // Seed from the first animation frame after profiler setup, never from
      // the last frame before the profiler's multi-second startup pause.
      last = now; R.startedAt = now; R.on = true; resolve();
    }));
    R.stop = () => { R.on = false; R.endedAt = performance.now(); };
  });
  const start = (args.start || (AREA.id === 'strip' ? 'view:Digit3' : 'view:Digit1'));      // "x,z,yawDeg" or view:<key> (layout.VIEWS of the page's area; default: the Nevsky view, down the avenue; another area: its first view)
  // Island destinations can be kilometers from the spawn. Complete their
  // mandatory region loads before measuring acceleration and frame times.
  await page.evaluate(async ({ s, walk }) => {
    const v = s.startsWith('view:') ? window.__ctx.L.VIEWS.find(q => q.key === s.slice(5)) : null;
    const a = v ? [v.x, v.z, v.yaw] : s.split(',').map(Number);
    if (a.length !== 3 || !a.every(Number.isFinite)) throw new Error(`Invalid ${walk ? 'walk' : 'drive'} start: ${s}`);
    await window.__regions?.ensureAt(a[0], a[1]);
    if (walk) {
      if (window.__drive?.active) throw new Error('Walking benchmark started in the car');
      // A null eye height selects real ground/deck walking, ending flight and
      // using the player's normal eye height, collision and movement model.
      window.__setCam(a[0], null, a[1], a[2], 0);
    } else {
      const d = window.__drive; d.enter(); d.place(...a);
    }
  }, { s: start, walk });
  await sleep(800);
  const st = () => page.evaluate(walk => {
    if (walk) {
      const p = window.__ctx.playerObj;
      return { x: +p.pos.x.toFixed(3), z: +p.pos.z.toFixed(3), y: +p.pos.y.toFixed(3), eyeY: +p.camera.position.y.toFixed(3),
        kmh: +(Math.hypot(p.vel.x, p.vel.z) * 3.6).toFixed(1),
        active: p.enabled && !p.inputLock && !p.fly && !p.ride && !window.__drive?.active,
        grounded: p.onGround, flying: p.fly, inputLock: p.inputLock };
    }
    const c = window.__drive.car; return { x: +c.x.toFixed(0), z: +c.z.toFixed(0), kmh: +c.speed.toFixed(0), active: window.__drive.active };
  }, walk);
  const s0 = await st(); console.log('start:', JSON.stringify(s0));
  const cdp = args.profile ? await page.createCDPSession() : null;      // --profile: CPU profile of the drive -> <out>.cpuprofile (tools/cpuprofile-top.mjs)
  if (cdp) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); }
  await page.evaluate(() => window.__rec.start());
  await page.keyboard.down('KeyW');
  const secs = Number(args.seconds || 20);
  for (let i = 0; i < secs; i++) { await sleep(1000); if (args['mid-shot'] && i === Math.floor(secs / 2)) await page.screenshot({ path: path.resolve(root, `${out}_mid.png`) }); }
  await page.keyboard.up('KeyW');
  // Collecting/writing a CPU profile can stall the browser for seconds. End
  // measurement before that work, camera readback and the final screenshot.
  await page.evaluate(() => { window.__rec.stop(); });
  const s1 = await st();
  const R = await page.evaluate(() => { const r = window.__rec; return { dts: r.dts, calls: r.calls, long: r.long, attach: r.attach, refreshMs: Math.round(r.refreshMs), refreshN: r.refreshN, measuredMs: r.endedAt - r.startedAt, regions: window.__regions ? window.__regions.stats : null, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }; });
  if (cdp) { const { profile } = await cdp.send('Profiler.stop'); fs.writeFileSync(path.resolve(root, out + '.cpuprofile'), JSON.stringify(profile)); }
  await page.screenshot({ path: path.resolve(root, `${out}_end.png`) });
  const d = R.dts.slice().sort((a, b) => a - b), pct = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))];
  const mean = d.reduce((s, v) => s + v, 0) / d.length, callsMean = R.calls.reduce((s, v) => s + v, 0) / R.calls.length;
  const dist = Math.hypot(s1.x - s0.x, s1.z - s0.z);
  const minimumDistance = walk ? Math.min(10, Math.max(1, secs * 1.5)) : 10;
  Object.assign(R, { mode, loadSeconds, start: s0, end: s1, distance: dist, frameMs: { mean, p50: pct(0.5), p95: pct(0.95), max: pct(1) }, callsMean,
    test: { quality: q.get('q'), seconds: secs, params: Object.fromEntries(q), profiled: !!cdp, profilerLifecycleExcluded: true, midShot: !!args['mid-shot'], startupPhases: !!args['startup-phases'], browserHeap: args['browser-heap'] || 'default' } });
  if (walk) R.test.minimumDistance = minimumDistance;
  R.loading = await page.evaluate(() => ({ timing: window.__stats.timing, modules: window.__stats.modules, baked: window.__ctx.services.baked,
    people: window.__ctx.services.people?.crowd?.drawCalls, errors: window.__errors }));
  // Collect diagnostics after the timed interval; traversal and synchronous
  // fixed-camera rendering must never contaminate the driving measurement.
  if (args.diagnostics) R.diagnostics = await page.evaluate(() => {
    const ctx = window.__ctx, counts = { objects: 0, meshes: 0, groups: 0, emptyGroups: 0, visibleObjects: 0 };
    ctx.staticRoot.traverse(o => { counts.objects++; if (o.isMesh) counts.meshes++; if (o.isGroup) { counts.groups++; if (!o.children.length) counts.emptyGroups++; } });
    ctx.staticRoot.traverseVisible(() => counts.visibleObjects++);
    const gl = ctx.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { url: location.href, title: document.title, playing: document.body.classList.contains('playing'), counts,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      batches: window.__stats.batch, split: window.__stats.split, outlines: window.__stats.nd, compactStatic: window.__stats.compactStatic, fixtureCells: window.__stats.fixtureCells, releasedMB: window.__stats.releasedMB(), drawKinds: window.__diag(), fixedRender: window.__bench(30) };
  });
  if (args.diagnostics) {
    const session = await page.createCDPSession();
    R.diagnostics.heap = await session.send('Runtime.getHeapUsage');
    await session.detach();
    R.diagnostics.colour = await page.evaluate(async () => (await import('./tools/perf-scan-page.js')).scan({ top: 12 }));
  }
  console.log(`${walk ? 'walked' : 'drove'} ${dist.toFixed(0)} m in ${secs} s, ${s1.kmh} km/h at the end, at (${s1.x}, ${s1.z}); ${d.length} frames`);
  console.log(`frame ms: mean ${mean.toFixed(1)} · p50 ${pct(0.5).toFixed(1)} · p95 ${pct(0.95).toFixed(1)} · max ${pct(1).toFixed(1)} · ${(1000 / mean).toFixed(0)} fps · frames > 40 ms: ${d.filter((v) => v > 40).length}, > 80 ms: ${d.filter((v) => v > 80).length}`);
  console.log(`draw calls: mean ${callsMean.toFixed(0)} · max ${Math.max(...R.calls)} · long tasks: ${R.long.length} (${R.long.slice(0, 20).join(', ')})`);
  console.log(`region attaches: ${R.attach.length} (${R.attach.slice(0, 20).join(', ')} ms) · zones.refresh ${R.refreshN} x = ${R.refreshMs} ms · regions ${JSON.stringify(R.regions)} · heap ${R.heapMB} MB`);
  if (errs.length || R.loading.errors.length) { console.log('PAGE ERRORS:', errs.concat(R.loading.errors.map(e => e.message)).slice(0, 5).join(' | ')); process.exitCode = 1; }
  if (!s1.active || (walk && !s0.active) || dist < minimumDistance) {
    console.error(walk ? `Walking did not remain active or cover ${minimumDistance} m` : 'Driving did not remain active or cover 10 m'); process.exitCode = 1;
  }
  if (args.json) fs.writeFileSync(path.resolve(root, args.json === '1' ? out + '.json' : args.json), JSON.stringify(R));
  // Optional post-run profiling cannot contaminate the reported timing interval.
  // Keep this separate from --profile, which deliberately profiles the drive.
  if (args['post-profile']) {
    const session = await page.createCDPSession();
    await session.send('Profiler.enable');
    await session.send('Profiler.setSamplingInterval', { interval: 1000 });
    await session.send('Profiler.start');
    await sleep(5000);
    const { profile } = await session.send('Profiler.stop');
    fs.writeFileSync(path.resolve(root, out + '.post.cpuprofile'), JSON.stringify(profile));
    await session.detach();
  }
} finally { await browser.close(); server.close(); }
