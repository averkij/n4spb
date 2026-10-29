// Does a full page navigation free a scene? Loads the REAL baked scene in headless Edge, then hops N times to the same (or another) page with location.replace / assign and records, after
// every load: the post-GC JS heap (CDP HeapProfiler.collectGarbage x2 + Runtime.getHeapUsage), the private bytes of the whole browser process tree (renderers, GPU, network ...; Windows) at rest
// and its PEAK while the next page loads, the ready time and the bfcache verdict. This is the M0 / M2 gate of docs/AREAS.md: the hand-off between areas is a navigation, so the memory of the
// page we leave must be gone (no upward trend over the hops; each arrival within +-15 % of the first).
//   node tools/nav-memory-probe.mjs [--hops 4] [--q medium] [--mode replace|assign] [--page index.html | --pages index.html,north.html] [--params "k=v&k2=v2"] [--throttle 4] [--out shots/areas/nav-memory.json]
//   --params may contain {i}, replaced by the hop number, to give every hop its own URL (a hand-off arrival: "cam=...&ho=...")
// GPU job: run it alone. Exit code 1 when the verdict fails (--verdict-only prints it without failing).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const execFileP = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = {}; for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) { args[a.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : '1'; } }
const HOPS = Number(args.hops || 4), MODE = args.mode || 'replace', TIER = args.q || 'medium', PAGE = args.page || 'index.html', PAGES = args.pages ? String(args.pages).split(',') : [PAGE];      // --pages index.html,north.html: hop between the pages in turn (every arrival is compared with the first one of ITS page)
const out = path.resolve(root, args.out || 'shots/areas/nav-memory.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
const { handleBakedRevision } = await import('./lib/dev-revision.mjs');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  if (handleBakedRevision(req, res, root)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': /\.[a-f0-9]{20}\.bin\.gz$/.test(f) ? 'public, max-age=31536000, immutable' : 'no-store' }); res.end(data); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({
  executablePath: EDGE, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox', '--no-first-run', '--disable-extensions', '--window-size=1280,720'],
  defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 }, protocolTimeout: 300000,
});
const MB = 1048576, sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** private bytes of the browser's whole process tree (Windows), by process type */
async function procTree() {
  if (process.platform !== 'win32') return null;
  const pid = browser.process()?.pid; if (!pid) return null;
  const ps = `$ErrorActionPreference='SilentlyContinue'; $all = Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine; ` +
    `$ids = New-Object System.Collections.Generic.HashSet[int]; [void]$ids.Add(${pid}); $ch=$true; while($ch){ $ch=$false; foreach($p in $all){ if($ids.Contains([int]$p.ParentProcessId) -and -not $ids.Contains([int]$p.ProcessId)){ [void]$ids.Add([int]$p.ProcessId); $ch=$true } } }; ` +
    `foreach($p in $all){ if($ids.Contains([int]$p.ProcessId)){ $t='browser'; if($p.CommandLine -match '--type=([a-z\\-]+)'){ $t=$Matches[1] }; $pr=Get-Process -Id $p.ProcessId; if($pr){ "$($p.ProcessId) $t $($pr.PrivateMemorySize64) $($pr.WorkingSet64)" } } }`;
  try {
    const { stdout } = await execFileP('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', timeout: 30000, maxBuffer: 1 << 20 });
    const rows = stdout.trim().split(/\r?\n/).filter(Boolean).map((l) => { const [id, type, priv, ws] = l.trim().split(/\s+/); return { id: Number(id), type, priv: Number(priv), ws: Number(ws) }; });
    const byType = {}; let priv = 0, ws = 0;
    for (const r of rows) { const b = byType[r.type] || (byType[r.type] = { n: 0, privMB: 0 }); b.n++; b.privMB += r.priv / MB; priv += r.priv; ws += r.ws; }
    for (const b of Object.values(byType)) b.privMB = Math.round(b.privMB);
    return { n: rows.length, privMB: Math.round(priv / MB), wsMB: Math.round(ws / MB), byType };
  } catch (e) { return { error: String(e.message).slice(0, 120) }; }
}

const url = (i) => {
  const q = new URLSearchParams({ q: TIER });
  if (args.params) for (const [k, v] of new URLSearchParams(args.params.replace(/\{i\}/g, String(i)))) q.set(k, v);
  q.set('hop', String(i));       // makes the URL unique; the engine ignores it
  return `${origin}/${PAGES[i % PAGES.length]}?${q}`;
};
const threeRoot = path.join(root, 'node_modules', 'three');
const hops = [];
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());
    if (m) { const f = path.join(threeRoot, m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(req.url())) return req.abort('failed');
    req.continue();
  });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
  const baseline = await procTree();
  console.log(`edge ${await browser.version()}; ${MODE}; ${HOPS} hops; tier ${TIER}; browser tree before: ${JSON.stringify(baseline)}`);

  for (let i = 0; i < HOPS; i++) {
    // ---- the previous page at rest (it is about to be left)
    let before = null;
    if (i > 0) before = { tree: await procTree() };
    const t0 = Date.now();
    // sample the process tree while the next page loads (the peak is what an iPhone jetsam sees)
    let sampling = true, peak = 0, peakTree = null; const samples = [];
    const sampler = (async () => { while (sampling) { const t = await procTree(); if (t && t.privMB) { samples.push([Date.now() - t0, t.privMB]); if (t.privMB > peak) { peak = t.privMB; peakTree = t; } } await sleep(400); } })();
    if (i === 0) await page.goto(url(i), { waitUntil: 'load', timeout: 180000 });
    else {
      const nav = page.waitForNavigation({ waitUntil: 'load', timeout: 180000 });
      await page.evaluate((u, mode) => { if (mode === 'assign') location.assign(u); else location.replace(u); }, url(i), MODE);
      await nav;
    }
    await page.waitForFunction("document.body.classList.contains('loaded') || document.getElementById('fatal') && getComputedStyle(document.getElementById('fatal')).display !== 'none'", { timeout: 300000, polling: 500 });
    const wallMs = Date.now() - t0;
    sampling = false; await sampler;
    const cdp = await page.createCDPSession();
    if (args.throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(args.throttle) });
    await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage');
    const heap = await cdp.send('Runtime.getHeapUsage');
    const info = await page.evaluate(() => ({
      readyMs: window.__stats?.timing?.readyMs ?? null, timing: window.__stats?.timing ?? null, errors: (window.__errors || []).length,
      perfMemMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      calls: window.__stats?.calls ?? null, triangles: window.__stats?.triangles ?? null, historyLength: history.length,
      nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { type: n.type, notRestoredReasons: n.notRestoredReasons ? JSON.stringify(n.notRestoredReasons).slice(0, 300) : null } : null; })(),
      area: window.__ctx?.area?.ID ?? null, regions: window.__regions?.count?.() ?? null,
    }));
    await sleep(2500);       // let the GPU / the previous renderer settle before the 'at rest' measurement
    const tree = await procTree();
    await cdp.detach();
    const row = { hop: i, page: PAGES[i % PAGES.length], wallMs, readyMs: info.readyMs, heapUsedMB: Math.round(heap.usedSize / MB), heapTotalMB: Math.round(heap.totalSize / MB), perfMemMB: info.perfMemMB,
      treePrivMB: tree?.privMB ?? null, treeByType: tree?.byType ?? null, treePeakMB: peak || null, treePeakByType: peakTree?.byType ?? null,
      leftPageTreeMB: before?.tree?.privMB ?? null, errors: info.errors, calls: info.calls, triangles: info.triangles, historyLength: info.historyLength, nav: info.nav, area: info.area };
    hops.push(row);
    console.log(`hop ${i}: ready ${row.readyMs ?? '?'} ms (wall ${wallMs}), heap ${row.heapUsedMB}/${row.heapTotalMB} MB post-GC, tree ${row.treePrivMB} MB (peak ${row.treePeakMB}), errors ${row.errors}, history ${row.historyLength}, calls ${row.calls}`);
  }
  // bfcache verdict: a page left with assign may be kept alive in the back/forward cache
  let back = null;
  if (MODE === 'assign') { try { await page.goBack({ waitUntil: 'load', timeout: 60000 }); back = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { type: n.type, restored: !!window.__ctx } : null; }); } catch (e) { back = { error: String(e.message).slice(0, 100) }; } }

  // ---- verdict (docs/AREAS.md section 10): every arrival within +-15 % of the first, no upward trend
  const first = hops[0], firstOf = (h) => hops.find((x) => x.page === h.page), later = hops.filter((h) => firstOf(h) !== h);
  const within = (a, b) => (a != null && b != null && b > 0 ? Math.abs(a - b) / b <= 0.15 : null);
  const check = {
    heapWithin15: later.map((h) => within(h.heapUsedMB, firstOf(h).heapUsedMB)),
    treeWithin15: later.map((h) => within(h.treePrivMB, firstOf(h).treePrivMB)),
    readyWithin15: later.map((h) => within(h.readyMs, firstOf(h).readyMs)),
  };
  const trend = (key) => { const v = hops.map((h) => h[key]).filter((x) => x != null); if (v.length < 3) return null; const n = v.length, mx = (n - 1) / 2, my = v.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0; v.forEach((y, x) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; }); return Math.round(sxy / sxx * 10) / 10; };
  const verdict = { slopeHeapMBPerHop: trend('heapUsedMB'), slopeTreeMBPerHop: trend('treePrivMB'), ...check, errorsTotal: hops.reduce((a, h) => a + h.errors, 0) };
  verdict.ok = Object.values(check).every((a) => a.every((x) => x !== false)) && verdict.errorsTotal === 0 && !(verdict.slopeTreeMBPerHop > 0.1 * (first.treePrivMB || 1));
  const report = { when: 'see file mtime', mode: MODE, tier: TIER, page: PAGE, pages: PAGES, params: args.params || null, throttle: args.throttle || null, edge: await browser.version(), baselineTree: baseline, hops, back, verdict, pageErrors: errors.slice(0, 10) };
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log('verdict:', JSON.stringify(verdict)); if (back) console.log('goBack after assign:', JSON.stringify(back));
  console.log(`wrote ${path.relative(root, out)}`);
  console.log(verdict.ok ? 'RESULT: OK' : 'RESULT: FAIL (see the file; M0 reports instead of failing: --verdict-only)');
  if (!verdict.ok && !args['verdict-only']) process.exitCode = 1;
} catch (e) { console.log('PROBE FAILED:', e.stack || e.message); process.exitCode = 1; }
finally { await browser.close(); server.close(); }
