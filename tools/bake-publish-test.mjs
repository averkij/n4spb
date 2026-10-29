// CPU test of what the bake does around the GPU work (tools/lib/bake-server.mjs, bake-guard.mjs, bake-publish.mjs finishArea, tools/baked-revision-sync.mjs): a FAKE BROWSER (plain HTTP requests) loads a fabricated
// repository from the real bake server and uploads fake products exactly as the page does; finishArea then audits, re-digests and publishes. No GPU, no puppeteer, no node_modules.
//   node tools/bake-publish-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createBakeServer } from './lib/bake-server.mjs';
import { beginArea, finishArea, purgeProducts } from './lib/bake-publish.mjs';
import { auditServed, acquireLock, releaseLock, checkThree, lockFile } from './lib/bake-guard.mjs';
import { createRevisionContext } from './baked-revision.mjs';
import { checkBakes } from './bake-manifest-check.mjs';
import { KEYS, makeRoot, writeTree, readJSON, manifestPath } from './lib/bake-fixture.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
let n = 0, bad = 0;
const test = async (name, fn) => { n++; try { await fn(); console.log(`ok   ${name}`); } catch (e) { bad++; console.log(`FAIL ${name}\n     ${String(e.message).split('\n').slice(0, 10).join('\n     ')}`); } };

/** a bake session on a fresh fixture: the real server, a state from beginArea, and a fake browser */
async function session(body, { id = 'alpha' } = {}) {
  const t = makeRoot(), ctx = createRevisionContext(t.root);
  const row = ctx.row(id); let current = beginArea({ root: t.root, row });
  const server = createBakeServer({ root: t.root, current: () => current, log: () => {} });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = {
    get: (p, init) => fetch(base + p, init),
    /** load the page and every file of its closure, like the page does */
    async loadPage() { for (const rel of [...current.closure.seen]) { const r = await fetch(`${base}/${rel}${rel.endsWith('.html') ? '?shot=1&bake=1&q=medium&t=0' : ''}`); await r.arrayBuffer(); if (rel.endsWith('.js') || rel.endsWith('.html')) assert.equal(r.status, 200, rel); } },
    /** upload a product in two chunks (offset 0, then the rest), the way baked-world.js does */
    async upload(name, buf) {
      const cut = Math.floor(buf.length / 2);
      for (const [off, end] of [[0, cut], [cut, buf.length]]) {
        const r = await fetch(`${base}/__bake/${name}`, { method: 'POST', body: buf.subarray(off, end), headers: { 'X-Bake-Offset': String(off), 'X-Bake-Final': end === buf.length ? '1' : '0' } });
        assert.equal(r.status, 200, `${name}: ${await r.text()}`);
      }
    },
  };
  try { return await body({ t, ctx, row, server, browser, get current() { return current; }, restart() { current = beginArea({ root: t.root, row }); return current; } }); }
  finally { await new Promise((r) => server.close(r)); t.remove(); }
}
const raw = (k) => crypto.createHash('sha256').update(k).digest().subarray(0, 24 + (k.length % 9));
async function uploadAll(s, keys = KEYS) { for (const k of keys) await s.browser.upload(k, Buffer.concat([raw(k), raw(k + '2')])); }

await test('the fake browser: revision endpoint, inputs endpoint (409 until the field and kerbs are in), uploads become <key>.<revision>.bin.gz with the raw size', () => session(async (s) => {
  const rev = (await (await s.browser.get('/__baked_revision')).json()).revision; assert.equal(rev, s.current.revision);
  assert.equal((await s.browser.get('/__bake_inputs')).status, 409);
  await s.browser.upload('field', Buffer.from('field-bytes-'.repeat(50))); await s.browser.upload('street-kerbs', Buffer.from('kerbs'.repeat(40))); await s.browser.upload('field-qP', Buffer.from('qp'.repeat(40)));
  const inputs = await (await s.browser.get('/__bake_inputs')).json();
  assert.equal(inputs.revision, rev); assert.equal(inputs.files.field, `field.${rev}.bin.gz`); assert.deepEqual(Object.keys(inputs.files).sort(), ['field', 'field-qP', 'street-kerbs']);
  const f = path.join(s.t.root, 'assets/baked/alpha', `field.${rev}.bin.gz`);
  assert.equal(zlib.gunzipSync(fs.readFileSync(f)).toString(), 'field-bytes-'.repeat(50)); assert.equal(s.current.sizes.field.raw, 'field-bytes-'.repeat(50).length);
  assert(!fs.readdirSync(path.join(s.t.root, 'assets/baked/alpha')).some((x) => x.endsWith('.part') || x.endsWith('.tmp')));
}));

await test('the happy path: the page loads its closure, 10 products upload, finishArea audits + re-digests + hashes + publishes: the area is FRESH and the map follows', () => session(async (s) => {
  await s.browser.loadPage(); await uploadAll(s);
  assert.equal(await (await s.browser.get('/favicon.ico')).status, 404, 'a 404 is not a served file');
  const res = finishArea({ root: s.t.root, current: s.current, bakeSeconds: 77, rows: s.ctx.rows() });
  const c = checkBakes(s.t.root, { ids: ['alpha'] }); assert(c.ok, c.lines.join('\n'));
  const m = readJSON(manifestPath(s.t.root, 'alpha'));
  assert.equal(m.scheme, 2); assert.equal(m.format, 1); assert.equal(m.area, 'alpha'); assert.equal(m.revision, s.current.revision); assert.equal(m.closure.files, s.current.info.files);
  assert.deepEqual(Object.keys(m.sha256).sort(), [...KEYS].sort());
  assert.equal(m.sha256.field, crypto.createHash('sha256').update(fs.readFileSync(path.join(s.t.root, 'assets/baked/alpha', m.files.field))).digest('hex'));
  const inputs = readJSON(path.join(s.t.root, 'assets/baked/alpha/inputs.json'));
  assert.equal(inputs.bakeSeconds, 77); assert.equal(inputs.revision, m.revision); assert.deepEqual(inputs.files, s.current.digests); assert.equal(inputs.three, '0.170.0 sha512-AAAA');
  assert.deepEqual(res.map, { alpha: m.revision });
  assert(fs.readFileSync(path.join(s.t.root, 'src/core/baked-revision.js'), 'utf8').includes(`alpha: '${m.revision}'`));
  assert.equal(c.statuses.length, 1, 'only the named area was checked');
}));

await test('the served-file audit: a file outside the closure that the page loaded (src, vendor, root) aborts the publish and is named; nothing is written', () => session(async (s) => {
  writeTree(s.t.root, { 'src/world/not-imported.js': 'export const y = 2;\n', 'vendor/lib/extra.js': 'export const x = 1;\n', 'notes.txt': 'n' });      // nothing imports them: not in the closure
  await s.browser.loadPage(); await uploadAll(s);
  for (const p of ['/src/world/not-imported.js', '/vendor/lib/extra.js', '/notes.txt']) await (await s.browser.get(p)).arrayBuffer();
  const before = fs.readdirSync(path.join(s.t.root, 'assets/baked/alpha')).sort().join();
  assert.throws(() => finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() }), (e) => /served-file audit of alpha failed/.test(e.message) && e.message.includes('src/world/not-imported.js') && e.message.includes('vendor/lib/extra.js') && e.message.includes('notes.txt') && e.message.includes('DYNAMIC_IMPORTS') && e.message.includes('ALLOW_SERVED'));
  assert(!fs.existsSync(manifestPath(s.t.root, 'alpha')), 'no manifest'); assert(!fs.existsSync(path.join(s.t.root, 'assets/baked/alpha/inputs.json')));
  assert.notEqual(before, '', 'the uploaded products are there (an aborted area leaves them for a re-run)');
  assert.equal(fs.readFileSync(path.join(s.t.root, 'src/core/baked-revision.js'), 'utf8'), "export const BAKED_REVISION = 'x';\n", 'the map is untouched');
}));

await test('auditServed: the allowlist (baked-revision.js, baked products, icons, splash, the webmanifest, favicon, /__ endpoints) passes; anything else outside the closure is a violation', () => {
  const seen = new Set(['index.html', 'src/main.js', 'assets/bibliotochka.png']);
  const ok = ['index.html', 'src/main.js', 'assets/bibliotochka.png', 'src/core/baked-revision.js', 'assets/baked/alpha/manifest.json', 'assets/icons/a.png', 'assets/splash/s.png', 'manifest.webmanifest', 'favicon.ico', '__baked_revision', 'node_modules/three/build/three.module.js'];
  assert.deepEqual(auditServed({ served: new Set(ok), seen, area: 'alpha' }), []);
  const bad = ['src/other.js', 'vendor/rapier/x.js', 'assets/audio/a.ogg', 'package.json', 'beta.html', 'src/core/Baked-Revision.js'];
  const v = auditServed({ served: new Set(bad), seen, area: 'alpha' }); assert.equal(v.length, bad.length, v.join('\n'));
  for (const b of bad) assert(v.some((x) => x.startsWith(b)), b);
});

await test('the source changed during the bake (a file of the closure edited after the start): refused, the changed file is named', () => session(async (s) => {
  await s.browser.loadPage(); await uploadAll(s);
  fs.appendFileSync(path.join(s.t.root, 'src/world/m2.js'), '// edit during the bake\n');
  assert.throws(() => finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() }), (e) => /the source changed during the bake of alpha/.test(e.message) && e.message.includes('src/world/m2.js'));
  assert(!fs.existsSync(manifestPath(s.t.root, 'alpha')));
}));
await test('an edit of a file OUTSIDE the closure during the bake does not matter (beta.html is not alpha)', () => session(async (s) => {
  await s.browser.loadPage(); await uploadAll(s);
  fs.appendFileSync(path.join(s.t.root, 'beta.html'), '\n<!-- edit -->\n');
  finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() }); assert(checkBakes(s.t.root, { ids: ['alpha'] }).ok);
}));
await test('a missing product, a product of the wrong size and a damaged product directory are refused', () => session(async (s) => {
  await s.browser.loadPage(); await uploadAll(s, KEYS.filter((k) => k !== 'nav-low'));
  assert.throws(() => finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() }), /missing product nav-low of area alpha/);
  await s.browser.upload('nav-low', Buffer.from('nl'.repeat(30)));
  fs.appendFileSync(path.join(s.t.root, 'assets/baked/alpha', s.current.files.roof), 'junk');
  assert.throws(() => finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() }), /product roof\.[0-9a-f]{20}\.bin\.gz is \d+ bytes, the bake recorded \d+/);
  fs.rmSync(path.join(s.t.root, 'assets/baked/alpha', s.current.files.roof));
  assert.throws(() => finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() }), /does not exist/);
  assert(!fs.existsSync(manifestPath(s.t.root, 'alpha')));
}));

await test('two areas, one after the other: each publishes as soon as it succeeds; the first stays valid; the map has both', () => session(async (s) => {
  await s.browser.loadPage(); await uploadAll(s);
  finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() });
  let c = checkBakes(s.t.root); assert.deepEqual(c.statuses.map((x) => `${x.id}:${x.status}`), ['alpha:FRESH', 'beta:MISSING']);
  const beta = beginArea({ root: s.t.root, row: s.ctx.row('beta') });
  assert.notEqual(beta.revision, s.current.revision);
  // (the fake browser of the first area is bound to alpha's state; publish beta through its own server session)
  const sv = createBakeServer({ root: s.t.root, current: () => beta, log: () => {} }); await new Promise((r) => sv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${sv.address().port}`;
  try {
    for (const rel of beta.closure.seen) await (await fetch(`${base}/${rel}`)).arrayBuffer();
    for (const k of KEYS) { const r = await fetch(`${base}/__bake/${k}`, { method: 'POST', body: raw(k), headers: { 'X-Bake-Offset': '0', 'X-Bake-Final': '1' } }); assert.equal(r.status, 200); }
  } finally { await new Promise((r) => sv.close(r)); }
  finishArea({ root: s.t.root, current: beta, rows: s.ctx.rows() });
  c = checkBakes(s.t.root); assert(c.ok, c.lines.join('\n')); assert.match(c.lines.at(-1), /fresh: alpha, beta/);
}));

await test('a re-bake purges the old products of the area and leaves the other area alone', () => session(async (s) => {
  await s.browser.loadPage(); await uploadAll(s); finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() });
  const dir = path.join(s.t.root, 'assets/baked/alpha'), old = fs.readdirSync(dir).filter((f) => f.endsWith('.bin.gz'));
  fs.appendFileSync(path.join(s.t.root, 'src/world/alpha-only.js'), '// edit\n');
  const s2 = s.restart(); await s.browser.loadPage(); await uploadAll(s);
  assert.notEqual(s2.revision, readJSON(manifestPath(s.t.root, 'alpha')).revision);
  assert.deepEqual(checkBakes(s.t.root, { ids: ['alpha'] }).statuses[0].status, 'STALE');
  finishArea({ root: s.t.root, current: s2, rows: s.ctx.rows() });
  for (const f of old) assert(!fs.existsSync(path.join(dir, f)), `${f} purged`);
  const c = checkBakes(s.t.root, { ids: ['alpha'] }); assert(c.ok, c.lines.join('\n'));
}));

await test('purgeProducts: files only, never a subdirectory (the directory of the strip holds the other areas), keeps the manifest, the inputs and the listed products', () => {
  const t = makeRoot();
  try {
    const d = path.join(t.root, 'assets/baked'), h = (c) => c.repeat(20); fs.mkdirSync(path.join(d, 'north'), { recursive: true }); fs.mkdirSync(path.join(d, 'field.' + h('c') + '.bin.gz'));
    const old = 'field.' + h('a') + '.bin.gz', keep = 'field.' + h('b') + '.bin.gz', nested = path.join(d, 'north', old), part = 'x.' + h('d') + '.part';
    for (const f of [old, keep, part, 'manifest.json', 'inputs.json', 'notes.txt']) fs.writeFileSync(path.join(d, f), 'x'); fs.writeFileSync(nested, 'x');
    assert.deepEqual(purgeProducts(d, new Set([keep])).sort(), [old, part].sort());
    for (const p of [keep, 'manifest.json', 'inputs.json', 'notes.txt', 'north/' + old, 'field.' + h('c') + '.bin.gz']) assert(fs.existsSync(path.join(d, p)), p);
  } finally { t.remove(); }
});
await test('the bake lock: O_EXCL with the pid; a second bake is refused, a dead pid is taken over, release removes only our own lock', () => {
  const t = makeRoot();
  try {
    const f = acquireLock(t.root); assert.equal(f, lockFile(t.root)); assert.equal(parseInt(fs.readFileSync(f, 'utf8'), 10), process.pid);
    assert.throws(() => acquireLock(t.root), /another bake is running/);
    releaseLock(); assert(!fs.existsSync(f));
    fs.writeFileSync(f, `${spawnSync(process.execPath, ['-e', '']).pid}\n`); acquireLock(t.root); assert.equal(parseInt(fs.readFileSync(f, 'utf8'), 10), process.pid);
    fs.writeFileSync(f, '999999999\n'); releaseLock(); assert(fs.existsSync(f), 'a lock that is not ours stays'); fs.rmSync(f);
  } finally { releaseLock(); t.remove(); }
});
await test('checkThree: the installed three.js must be the locked one', () => {
  const t = makeRoot();
  try {
    const ctx = createRevisionContext(t.root);
    assert.throws(() => checkThree(t.root, ctx), /not installed/);
    writeTree(t.root, { 'node_modules/three/package.json': '{"version":"0.169.0"}' }); assert.throws(() => checkThree(t.root, ctx), /0\.169\.0 but package-lock\.json locks 0\.170\.0/);
    writeTree(t.root, { 'node_modules/three/package.json': '{"version":"0.170.0"}' }); assert.equal(checkThree(t.root, ctx).version, '0.170.0');
  } finally { t.remove(); }
});
await test('baked-revision-sync as a command: --check exits 1 on a stale map and 0 on a synced one; the default writes; --purge removes orphans', () => session(async (s) => {
  await s.browser.loadPage(); await uploadAll(s); finishArea({ root: s.t.root, current: s.current, rows: s.ctx.rows() });
  const sync = (...a) => spawnSync(process.execPath, [path.join(here, 'baked-revision-sync.mjs'), '--root', s.t.root, ...a], { encoding: 'utf8' });
  assert.equal(sync('--check').status, 0, sync('--check').stdout);
  fs.writeFileSync(path.join(s.t.root, 'src/core/baked-revision.js'), "export const BAKED_REVISION = 'old';\n");
  assert.equal(sync('--check').status, 1); assert.equal(sync().status, 0); assert.equal(sync('--check').status, 0);
  fs.writeFileSync(path.join(s.t.root, 'assets/baked/alpha', `roof.${'a'.repeat(20)}.bin.gz`), 'x');
  assert.equal(sync('--check', '--purge').status, 1); assert.equal(sync().status, 0); assert(fs.existsSync(path.join(s.t.root, 'assets/baked/alpha', `roof.${'a'.repeat(20)}.bin.gz`)), 'no --purge: not purged');
  assert.equal(sync('--purge').status, 0); assert(!fs.existsSync(path.join(s.t.root, 'assets/baked/alpha', `roof.${'a'.repeat(20)}.bin.gz`)));
  assert.equal(sync('--bogus').status, 2);
}));

if (bad) { console.log(`RESULT: FAIL (${bad} of ${n})`); process.exit(1); }
console.log(`RESULT: OK (${n} checks)`);
