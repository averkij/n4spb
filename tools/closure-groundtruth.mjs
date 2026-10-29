// GROUND TRUTH of the dependency closure: load the page of an area in headless Edge (software GL: SwiftShader, the GPU stays free for a running bake) from a read-only static server, record
// every repository file it asked for and compare with the static closure (tools/lib/closure.mjs). A file fetched but not in the closure is a hole of the scanner (the bake would not go stale
// when that file changes): the exit code is 1. A file in the closure that was not fetched is fine (conditional code: ?people=lineup, groups of landmarksD ...).
//   node tools/closure-groundtruth.mjs <area|all> [--record] [--params baked=force] [--timeout 240]
//   --record  write tools/fixtures/closure-loads/<area>.json (what tools/closure-real-test.mjs checks on the CPU in the CI)
// Local tool: needs node_modules (puppeteer-core), Edge and 1 to 3 minutes per area; it loads ONE browser at a time. Not part of the CI. Re-run it before a release and after any change of the scanner.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/static-readonly.mjs';
import { createRevisionContext, liveAreas } from './baked-revision.mjs';
import { isAllowedServed } from './lib/closure-rules.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)).replace(/[\\/]$/, '');
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes('--' + k) ? argv[argv.indexOf('--' + k) + 1] : d);
const want = argv.find((a) => !a.startsWith('--') && a !== opt('params') && a !== opt('timeout')) || 'all';
const params = opt('params', 'baked=force'), timeoutS = Number(opt('timeout', 240)), record = argv.includes('--record');
const ctx = createRevisionContext(root);
const rows = want === 'all' ? liveAreas(root, ctx) : ctx.rows().filter((r) => r.id === want);
if (!rows.length) { console.error(`closure-groundtruth: unknown area "${want}"`); process.exit(2); }
const require = createRequire(root + '/package.json');
const puppeteer = require('puppeteer-core');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
if (!EDGE) { console.error('closure-groundtruth: Edge not found'); process.exit(2); }

async function load(row) {
  const srv = await startStaticServer(root);
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, protocolTimeout: 300000, defaultViewport: { width: 640, height: 360 },
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--no-first-run', '--disable-extensions', '--window-size=640,360'] });
  const logs = []; let status = 'timeout'; const t0 = Date.now(); let info = {};
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(req.url());       // three.js from node_modules (the import map names the CDN)
      if (m) { const f = path.join(root, 'node_modules', 'three', m[1].split('?')[0]); if (fs.existsSync(f)) return req.respond({ status: 200, contentType: 'text/javascript; charset=utf-8', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) }); }
      if (/^https?:\/\/(?!127\.0\.0\.1)/.test(req.url())) return req.abort();                    // no other network (fonts ...)
      req.continue();
    });
    page.on('console', (m) => { const t = m.type(); if (t === 'error') logs.push(`[console.${t}] ${m.text().slice(0, 300)}`); });
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message.slice(0, 300)}`));
    const q = new URLSearchParams(params); q.set('shot', '1'); q.set('w', '640'); q.set('h', '360'); q.set('q', 'performance'); q.set('t', '0');
    await page.goto(`http://127.0.0.1:${srv.port}/${row.page}?${q}`, { waitUntil: 'load', timeout: 120000 });
    const deadline = Date.now() + timeoutS * 1000;
    while (Date.now() < deadline) {
      const st = await page.evaluate(() => ({ ready: window.__ready === true, fatal: !!document.querySelector('.fatal, #fatal') })).catch(() => null);
      if (st && st.ready) { status = 'ready'; break; }
      if (st && st.fatal) { status = 'fatal'; break; }
      await new Promise((r) => setTimeout(r, 1000));
    }
    info = await page.evaluate(() => ({ area: window.__ctx && window.__ctx.area && window.__ctx.area.ID, modules: window.__stats && window.__stats.modules ? Object.keys(window.__stats.modules).length : -1, errors: (window.__errors || []).map((e) => e.module + ': ' + String(e.message).slice(0, 160)) })).catch(() => ({}));
    const version = await browser.version();
    return { status, elapsedS: Math.round((Date.now() - t0) / 100) / 10, info, logs: logs.slice(0, 20), files: [...srv.served.keys()], missing: [...srv.missing], browser: version };
  } finally { await browser.close(); await srv.close(); }
}

let failed = 0;
for (const row of rows) {
  const closure = ctx.scanner.closureOf(root, row.id, ctx);
  const run = await load(row);
  const files = run.files.filter((f) => !/\.bin\.gz$/.test(f)).sort();
  const outside = files.filter((f) => !closure.seen.has(f) && !isAllowedServed(f)), src = files.filter((f) => f.startsWith('src/'));
  const notFetched = [...closure.seen].filter((f) => f.startsWith('src/') && !run.files.includes(f));
  console.log(`[${row.id}] ${run.status} in ${run.elapsedS}s (${run.browser}): ${files.length} repo files (${src.length} in src/), closure ${closure.seen.size}; fetched but NOT in the closure: ${outside.length}${outside.length ? ' ' + outside.join(' ') : ''}; in the closure, not fetched: ${notFetched.length}`);
  if (run.info && run.info.errors && run.info.errors.length) console.log(`  page errors: ${run.info.errors.join(' | ')}`);
  if (run.status !== 'ready') { console.log(`  FAIL the page did not become ready (${run.status}); log: ${run.logs.join(' | ')}`); failed++; continue; }
  if (run.missing.some((m) => !m.startsWith('__') && !/favicon/.test(m))) console.log(`  note: 404 for ${run.missing.filter((m) => !m.startsWith('__')).join(' ')}`);
  if (outside.length) failed++;
  if (record) {
    const dir = path.join(root, 'tools/fixtures/closure-loads'); fs.mkdirSync(dir, { recursive: true });
    const rec = { format: 1, area: row.id, page: row.page, params, status: run.status, note: 'headless Edge (SwiftShader) page load from tools/lib/static-readonly.mjs: every repository file the page asked for, products (*.bin.gz) left out; tools/closure-real-test.mjs checks files <= closure on the CPU', browser: run.browser, files };
    fs.writeFileSync(path.join(dir, `${row.id}.json`), JSON.stringify(rec, null, 1) + '\n');
    console.log(`  recorded tools/fixtures/closure-loads/${row.id}.json`);
  }
}
if (failed) { console.log(`RESULT: FAIL (${failed})`); process.exit(1); }
console.log('RESULT: OK');
