// Offline shipping bake using real browser canvas textures and global claims. PER-AREA revisions (docs/AREAS.md section 4): every live area has its own bake revision, the hash of its dependency
// closure (tools/baked-revision.mjs), so a change stales exactly the areas whose closure contains it, and a bake takes only the areas that are stale.
//   node tools/bake-scene.mjs                    bake the STALE or MISSING live areas (nothing to do: "all fresh", exit 0)
//   node tools/bake-scene.mjs --plan             CPU only: per area the status, the closure size, the files that changed since its bake, the estimated GPU minutes and the command
//   node tools/bake-scene.mjs --plan --check     the same, exit 1 when any area is not FRESH
//   node tools/bake-scene.mjs --area a[,b]       those areas when they are stale ("fresh, use --force" otherwise); a parked area (strip, north) only by name
//   node tools/bake-scene.mjs --area all         the stale live areas             --area all --force   every live area (a toolchain or GPU change: also bump BAKE_SCHEME)
//   --force   bake the selected areas even when fresh (needs --area)    --require-clean   refuse a bake when a file of the closure has uncommitted changes    --root <dir>  another tree (tests)
// Each area is baked from ITS page (registry: index.html, smolny.html ...) into its own directory (registry `bake`: assets/baked/<id>/) and PUBLISHED AS SOON AS IT SUCCEEDS (tools/lib/bake-publish.mjs):
// inputs.json, then manifest.json (format 1, scheme 2: the commit point of the area), then src/core/baked-revision.js (the map area -> revision, regenerated from ALL manifests), then the purge of its old products.
// Before the publish: the SERVED-FILE AUDIT (every repository file the page loaded must be in the closure of the area or on ALLOW_SERVED, tools/lib/closure-rules.mjs: an independent check on the scanner),
// a re-digest of the closure (the source must not have changed during the bake) and the sha256 of the products. Preflight before any GPU time: the closures compute, node_modules/three is the locked version,
// and assets/baked/.bake.lock is taken (one bake at a time). Exit codes: 0 done / nothing to do, 1 a failure, 2 usage, 3 the bake ran but a live area is still stale.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRevisionContext } from './baked-revision.mjs';
import { parseBakeArgs, statusesOf, planBake, describeStatus, bakeCommand } from './lib/bake-status.mjs';
import { acquireLock, releaseLock, checkThree, dirtyInClosure } from './lib/bake-guard.mjs';
import { beginArea, finishArea } from './lib/bake-publish.mjs';
import { createBakeServer } from './lib/bake-server.mjs';
import { syncRevisionMap } from './baked-revision-sync.mjs';

const args = parseBakeArgs(process.argv.slice(2));
const root = args.root ? path.resolve(args.root) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = (code, ...lines) => { for (const l of lines) console.error(l); process.exit(code); };
if (args.errors.length) fail(2, `bake-scene: ${args.errors.join('; ')}`, 'usage: node tools/bake-scene.mjs [--plan [--check]] [--area stale|all|<id>[,<id>]] [--force] [--require-clean]');

// ---- plan (CPU only: no puppeteer, no GPU)
const ctx = createRevisionContext(root), rows = ctx.rows();
const named = Array.isArray(args.area) ? args.area : [];
const statuses = statusesOf(root, { ctx, parked: named });
const plan = planBake(statuses, args);
const shown = statuses.filter((s) => s.status !== 'PLANNED');
const minutes = plan.selected.reduce((n, x) => n + (statuses.find((s) => s.id === x.id).estMinutes || 5), 0);
if (plan.errors.length) fail(plan.usage ? 2 : 1, ...plan.errors.map((e) => `bake-scene: ${e}`));
if (args.plan) {
  for (const s of shown) console.log(describeStatus(s));
  const allStale = !named.length && plan.selected.length === statuses.filter((x) => !x.row.parked && x.status !== 'PLANNED').filter((x) => x.status !== 'FRESH' && x.status !== 'UNSYNCED').length;
  const command = plan.selected.length ? `${allStale ? 'node tools/bake-scene.mjs' : bakeCommand(plan.selected.map((x) => x.id))}${plan.selected.some((x) => x.reason === 'forced') ? ' --force' : ''}` : '';
  console.log(plan.selected.length ? `PLAN: bake ${plan.selected.map((x) => `${x.id} (${x.reason})`).join(', ')}; about ${minutes} GPU-minutes; ${command}` : 'PLAN: nothing to bake (all fresh)');
  for (const x of plan.skipped) console.log(`  skipped ${x.id}: ${x.why}`);
  if (plan.repair.length) console.log(`  to sync without a GPU: ${plan.repair.join(', ')} (the bake does it at the start, or node tools/baked-revision-sync.mjs --purge)`);
  try { const t = checkThree(root, ctx); console.log(`  preflight: node_modules/three ${t.version} matches package-lock.json`); } catch (e) { console.log(`  preflight: ${e.message}`); }
  process.exit(args.check && !shown.every((s) => s.status === 'FRESH') ? 1 : 0);
}

// ---- preflight, before any GPU time
if (!plan.selected.length && !plan.repair.length) {
  console.log(`bake-scene: all fresh${named.length ? '' : ' (every live area has the bake of its current closure)'}.`);
  for (const x of plan.skipped) console.log(`  ${x.id}: ${x.why}`);
  process.exit(0);
}
try { acquireLock(root); } catch (e) { fail(1, `bake-scene: ${e.message}`); }
process.on('exit', releaseLock); process.on('SIGINT', () => { releaseLock(); process.exit(130); });
if (plan.repair.length) {
  const r = syncRevisionMap(root, { purge: true });
  console.log(`bake-scene: synced ${plan.repair.join(', ')} without a GPU${r.written ? ' (wrote the revision map)' : ''}${Object.keys(r.purged).length ? `; purged ${Object.values(r.purged).reduce((n, a) => n + a.length, 0)} old files` : ''}`);
}
if (!plan.selected.length) { console.log('bake-scene: nothing to bake.'); for (const x of plan.skipped) console.log(`  ${x.id}: ${x.why}`); process.exit(0); }
try { checkThree(root, ctx); } catch (e) { fail(1, `bake-scene: preflight: ${e.message}`); }
const selectedRows = plan.selected.map((x) => rows.find((r) => r.id === x.id));
for (const a of selectedRows) if (!fs.existsSync(path.join(root, a.page))) fail(1, `bake-scene: the page of area "${a.id}" (${a.page}) does not exist (node tools/gen-area-html.mjs)`);
for (const s of plan.selected.map((x) => statuses.find((y) => y.id === x.id))) {
  const dirty = dirtyInClosure(root, s.hashed);
  if (dirty && dirty.length) {
    const msg = `bake-scene: ${s.id}: ${dirty.length} file${dirty.length > 1 ? 's' : ''} of its closure ${dirty.length > 1 ? 'have' : 'has'} uncommitted changes (${dirty.slice(0, 4).join(', ')}${dirty.length > 4 ? ', ...' : ''}): commit the bake together with them`;
    if (args.requireClean) fail(1, msg); else console.warn(`WARNING ${msg}`);
  }
}
console.log(`Baking ${selectedRows.map((a) => `${a.id} (${a.page} -> assets/${a.bake})`).join(', ')}; about ${minutes} GPU-minutes`);

// ---- the bake
const puppeteer = (await import('puppeteer-core')).default;
let current = null;                // the state of the area that is being baked (the server writes its products into its directory)
const server = createBakeServer({ root, current: () => current });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const browser = await puppeteer.launch({ executablePath, headless: true, protocolTimeout: 3600000,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-sandbox', `--js-flags=--max-old-space-size=${process.env.BAKE_HEAP || 8192}`], defaultViewport: { width: 1280, height: 720 } });
const published = [];
try {
  // Stages (two tiers since 2026-10-17): medium = the geometry / texture / field / roof / street products + nav-medium; performance = its nav product (nav-low, the performance tier's level).
  // The products are quality independent except the nav lattices. The retired high / low tiers are not baked.
  for (const row of selectedRows) {
    // a fresh read of the tree at the start of THIS area: its revision names the products, its digests are re-checked before the publish
    current = beginArea({ root, row });
    const { info, output } = current;
    const { files, sizes } = current, AT = Date.now();
    console.log(`=== area ${row.id}: ${row.page} -> ${path.relative(root, output).replaceAll('\\', '/')}/ ; revision ${info.revision} (${info.files} files in the closure)`);
    for (const quality of ['medium', 'performance']) {
      const page = await browser.newPage();
      await (await import('./font-transport.mjs')).installFontTransport(page);
      // Intercept only CDN scripts: intercepting large binary POST uploads would
      // copy their bodies through the DevTools protocol and exhaust memory.
      const cdp = await page.createCDPSession();
      await cdp.send('Fetch.enable', { patterns: [{ urlPattern: 'https://cdn.jsdelivr.net/npm/three@*/*' }] });
      cdp.on('Fetch.requestPaused', async ({ requestId, request }) => {
        const m = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.+)$/.exec(request.url);
        const body = fs.readFileSync(path.join(root, 'node_modules/three', m[1])).toString('base64');
        await cdp.send('Fetch.fulfillRequest', { requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body });
      });
      let rejectFailure;
      const failure = new Promise((_, reject) => { rejectFailure = reject; });
      failure.catch(() => {}); // errors may arrive before the readiness wait starts
      page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); rejectFailure(new Error(`${quality} bake script failed: ${e.message}`)); });
      page.on('error', e => { console.error('RENDERER ERROR:', e.message); rejectFailure(new Error(`${quality} bake renderer failed: ${e.message}`)); });
      const T0 = Date.now();
      let progress = 'loading page';
      page.on('console', m => {
        if (m.text().startsWith('[bake-progress] ')) progress = m.text().slice(16);
        else if (m.type() === 'error') console.error(m.text(), ...m.args().map(a=>a.remoteObject().description||''));
        else if (process.env.BAKE_VERBOSE) console.log(`[${Math.round((Date.now() - T0) / 1000)}s] ${m.text().slice(0, 300)}`);
      });
      await page.evaluateOnNewDocument(() => {
        addEventListener('DOMContentLoaded', () => {
          const label = document.getElementById('loadlabel'), percent = document.getElementById('loadpct');
          if (!label) return;
          const report = () => console.log(`[bake-progress] ${percent?.textContent || ''} ${label.textContent || 'finalizing'}`);
          new MutationObserver(report).observe(label, { childList: true, characterData: true, subtree: true }); report();
        }, { once: true });
      });
      console.log(`Baking ${quality} (${quality === 'medium' ? 'static geometry, textures, field, roof, navigation' : 'navigation'})…`);
      page.on('requestfailed', r => console.error('REQUEST FAILED:', r.url().slice(0, 160), r.failure() && r.failure().errorText));
      page.on('response', r => { if (r.status() >= 400) console.error('HTTP', r.status(), r.url().slice(0, 160)); });
      const heartbeat = setInterval(() => console.log(`[${quality} ${Math.round((Date.now() - T0) / 1000)}s] ${progress}; ${Object.keys(files).length} products complete`), 30000);
      try {
        const resp = await page.goto(`http://127.0.0.1:${server.address().port}/${row.page}?shot=1&bake=${quality === 'medium' ? '1' : 'nav'}&q=${quality}&t=0`, { waitUntil: 'load', timeout: 180000 });
        console.log(`page loaded: HTTP ${resp && resp.status()} ${page.url().slice(0, 80)} "${await page.title()}"`);
        await Promise.race([
          page.waitForFunction('window.__bakeReady === true', { timeout: 3600000, polling: 1000 }),
          failure,
        ]);   // a crashed renderer or uncaught script error must not consume the one-hour build timeout
        const errors = await page.evaluate(() => __errors); if (errors.length) throw new Error(JSON.stringify(errors));
        console.log(`Finished ${quality}. ${Object.keys(files).length} products.`);
      } catch (e) {
        console.error(`Bake stopped in ${quality} after ${Math.round((Date.now() - T0) / 1000)}s: ${progress}; ${Object.keys(files).length} completed products`);
        throw e;
      } finally { clearInterval(heartbeat); await page.close().catch(() => {}); }
    }
    console.log(`Area ${row.id} complete: ${Object.keys(files).length} products.`);
    // ---- publish THIS area (audit, re-digest, sha256, inputs.json, manifest.json, the revision map, the purge): every published area is valid by itself
    try {
      finishArea({ root, current, bakeSeconds: Math.round((Date.now() - AT) / 1000), rows });
    } catch (e) { console.error(`bake-scene: NOT published: ${e.message}`); console.error(`  (the areas published before it stay valid; re-run node tools/bake-scene.mjs for the rest)`); process.exitCode = 1; break; }
    published.push(row.id);
    console.log(`BAKE OK [${row.id}]: ${Object.keys(files).length} files, ${(Object.values(sizes).reduce((n, a) => n + a.gzip, 0) / 1048576).toFixed(1)} MiB compressed. Revision ${current.revision}; ${Math.round((Date.now() - AT) / 1000)} s`);
  }
} catch (e) { console.error(`bake-scene: FAILED: ${e && e.stack || e}`); process.exitCode = 1; }
finally { await browser.close().catch(() => {}); server.close(); }

// ---- the table
const after = statusesOf(root, { parked: named });
console.log(`\nPublished: ${published.join(', ') || 'none'}`);
for (const s of after.filter((x) => x.status !== 'PLANNED')) console.log(describeStatus(s));
const left = after.filter((s) => !s.row.parked && (s.status === 'STALE' || s.status === 'MISSING' || s.status === 'ERROR'));
if (!process.exitCode && left.length) { console.log(`\n${left.length} live area${left.length > 1 ? 's are' : ' is'} still stale: node tools/bake-scene.mjs`); process.exitCode = 3; }
