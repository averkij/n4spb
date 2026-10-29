// CPU test of the WHOLE bake command (tools/bake-scene.mjs) with a FAKE puppeteer (tools/lib/fake-puppeteer: plain HTTP against the real bake server, no browser, no GPU) on a fabricated repository:
// plan -> preflight -> lock -> server -> two quality stages -> served-file audit -> re-digest -> per-area publish -> status table -> exit code. This is the only CPU test of the code between the browser and the publish;
// the real browser part is exercised by a real bake (CP10).
//   node tools/bake-flow-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRevisionContext } from './baked-revision.mjs';
import { checkBakes } from './bake-manifest-check.mjs';
import { KEYS, makeRoot, writeTree, readJSON, manifestPath } from './lib/bake-fixture.mjs';

const here = fileURLToPath(new URL('.', import.meta.url)), REGISTER = pathToFileURL(path.join(here, 'lib/fake-puppeteer/register.mjs')).href;
let n = 0, bad = 0;
const test = (name, fn) => { n++; try { fn(); console.log(`ok   ${name}`); } catch (e) { bad++; console.log(`FAIL ${name}\n     ${String(e.message).split('\n').slice(0, 12).join('\n     ')}`); } };

function fixture(body) {
  const t = makeRoot(); writeTree(t.root, { 'node_modules/three/package.json': '{"version":"0.170.0"}', 'src/world/orphan.js': 'export const o = 1;\n' });
  try { body(t); } finally { t.remove(); }
}
/** the files each page loads: its closure on the current tree */
function loads(root) { const ctx = createRevisionContext(root), o = {}; for (const id of ['alpha', 'beta', 'gamma']) { const row = ctx.row(id); o[row.page] = [...ctx.scanner.closureOf(root, id, ctx).seen]; } return o; }
function bake(t, args = [], env = {}) {
  return spawnSync(process.execPath, ['--import', REGISTER, path.join(here, 'bake-scene.mjs'), '--root', t.root, ...args], {
    encoding: 'utf8', timeout: 120000,
    env: { ...process.env, FAKE_BAKE_ROOT: t.root, FAKE_BAKE_KEYS: JSON.stringify(KEYS), FAKE_BAKE_LOADS: JSON.stringify(loads(t.root)), ...Object.fromEntries(Object.entries(env).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])) },
  });
}
const out = (r) => `${r.stdout}\n${r.stderr}`;
const statusOf = (t, id) => checkBakes(t.root, { ids: [id] }).statuses[0].status;
const lock = (t) => path.join(t.root, 'assets/baked/.bake.lock');
const bytes = (t, rel) => fs.readFileSync(path.join(t.root, rel));

test('a first bake: the default takes both MISSING areas, publishes each, the check is green, the lock is released, exit 0', () => fixture((t) => {
  const r = bake(t); assert.equal(r.status, 0, out(r));
  assert.match(r.stdout, /=== area alpha: index\.html -> assets\/baked\/alpha\//); assert.match(r.stdout, /BAKE OK \[alpha\]/); assert.match(r.stdout, /BAKE OK \[beta\]/); assert.match(r.stdout, /Published: alpha, beta/);
  const c = checkBakes(t.root); assert(c.ok, c.lines.join('\n')); assert(!fs.existsSync(lock(t)));
  for (const id of ['alpha', 'beta']) { const m = readJSON(manifestPath(t.root, id)); assert.equal(m.scheme, 2); assert.equal(Object.keys(m.files).length, KEYS.length); assert(readJSON(path.join(t.root, `assets/baked/${id}/inputs.json`)).bakeSeconds >= 0); }
  const again = bake(t); assert.equal(again.status, 0); assert.match(again.stdout, /all fresh/, 'nothing left to do');
}));
test('a one-area edit: the default bakes ONLY the stale area; the other area\'s manifest and products are not touched', () => fixture((t) => {
  assert.equal(bake(t).status, 0);
  const beta = ['manifest.json', 'inputs.json'].map((f) => bytes(t, `assets/baked/beta/${f}`)), betaFiles = fs.readdirSync(path.join(t.root, 'assets/baked/beta')).sort().join();
  fs.appendFileSync(path.join(t.root, 'src/world/alpha-only.js'), '// alpha only\n');
  const plan = bake(t, ['--plan']); assert.match(plan.stdout, /PLAN: bake alpha \(STALE\)/);
  const r = bake(t); assert.equal(r.status, 0, out(r)); assert.match(r.stdout, /=== area alpha/); assert(!r.stdout.includes('=== area beta'), r.stdout); assert.match(r.stdout, /Published: alpha\n/);
  assert.deepEqual(['manifest.json', 'inputs.json'].map((f) => bytes(t, `assets/baked/beta/${f}`)), beta); assert.equal(fs.readdirSync(path.join(t.root, 'assets/baked/beta')).sort().join(), betaFiles);
  const c = checkBakes(t.root); assert(c.ok, c.lines.join('\n'));
  const old = fs.readdirSync(path.join(t.root, 'assets/baked/alpha')).filter((f) => f.endsWith('.bin.gz'));
  assert.equal(old.length, KEYS.length, 'the old products were purged');
}));
test('--area alpha while beta is also stale: alpha is published, exit 3 and the command for the rest', () => fixture((t) => {
  const r = bake(t, ['--area', 'alpha']); assert.equal(r.status, 3, out(r)); assert.match(r.stdout, /Published: alpha/); assert.match(r.stdout, /1 live area is still stale: node tools\/bake-scene\.mjs/);
  assert.equal(statusOf(t, 'alpha'), 'FRESH'); assert.equal(statusOf(t, 'beta'), 'MISSING');
}));
test('--area alpha --force on a fresh area rebakes it (same revision, new manifest); a fresh area without --force is skipped', () => fixture((t) => {
  assert.equal(bake(t).status, 0); const before = readJSON(manifestPath(t.root, 'alpha'));
  const skip = bake(t, ['--area', 'alpha']); assert.equal(skip.status, 0); assert.match(skip.stdout, /fresh, use --force/);
  const r = bake(t, ['--area', 'alpha', '--force']); assert.equal(r.status, 0, out(r)); assert.match(r.stdout, /BAKE OK \[alpha\]/); assert(!r.stdout.includes('=== area beta'));
  assert.equal(readJSON(manifestPath(t.root, 'alpha')).revision, before.revision); assert(checkBakes(t.root).ok);
}));
test('the parked area is baked when named; the default never takes it', () => fixture((t) => {
  assert.equal(bake(t).status, 0); assert(!fs.existsSync(manifestPath(t.root, 'gamma')));
  const r = bake(t, ['--area', 'gamma']); assert.equal(r.status, 0, out(r)); assert.match(r.stdout, /BAKE OK \[gamma\]/);
  const m = readJSON(manifestPath(t.root, 'gamma')); assert.equal(m.area, 'gamma');
  assert(!fs.readFileSync(path.join(t.root, 'src/core/baked-revision.js'), 'utf8').includes('gamma'), 'a parked area gets no entry in the map');
  assert(checkBakes(t.root).ok);
}));
test('SERVED-FILE AUDIT: a file the page loads that is not in the closure aborts that area (named, with the rule to add) and publishes nothing; the lock is released; exit 1', () => fixture((t) => {
  const r = bake(t, [], { FAKE_BAKE_EXTRA: { 'index.html': ['src/world/orphan.js'] } });
  assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /NOT published: served-file audit of alpha failed/); assert.match(r.stderr, /src\/world\/orphan\.js was served to the page of alpha/); assert.match(r.stderr, /DYNAMIC_IMPORTS/);
  assert.equal(statusOf(t, 'alpha'), 'MISSING'); assert(!fs.existsSync(path.join(t.root, 'assets/baked/alpha/inputs.json'))); assert(!fs.existsSync(lock(t)));
  assert(!r.stdout.includes('=== area beta'), 'fail fast: the next area is not started');
}));
test('the audit of a LATER area: the earlier area stays published and valid', () => fixture((t) => {
  const r = bake(t, [], { FAKE_BAKE_EXTRA: { 'beta.html': ['src/world/orphan.js'] } });
  assert.equal(r.status, 1, out(r)); assert.match(r.stdout, /Published: alpha/); assert.equal(statusOf(t, 'alpha'), 'FRESH'); assert.equal(statusOf(t, 'beta'), 'MISSING');
  const c = checkBakes(t.root, { ids: ['alpha'] }); assert(c.ok, c.lines.join('\n'));
}));
test('the source changes during the bake: refused, the file is named, nothing published', () => fixture((t) => {
  const r = bake(t, [], { FAKE_BAKE_EDIT: { 'index.html': ['src/world/m2.js', '// edit during the bake\n'] } });
  assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /the source changed during the bake of alpha/); assert.match(r.stderr, /src\/world\/m2\.js/); assert.equal(statusOf(t, 'alpha'), 'MISSING');
}));
test('a page error in a quality stage fails the area (exit 1); the lock is released; no manifest is written', () => fixture((t) => {
  const r = bake(t, [], { FAKE_BAKE_FAIL: 'index.html:medium' }); assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /fake page error/); assert.equal(statusOf(t, 'alpha'), 'MISSING'); assert(!fs.existsSync(lock(t)));
}));
test('the unfinished chunks of a crashed bake are removed at the start of the area', () => fixture((t) => {
  const dir = path.join(t.root, 'assets/baked/alpha'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `field.${'a'.repeat(20)}.part`), 'half'); fs.writeFileSync(path.join(dir, 'manifest.json.tmp'), '{');
  assert.equal(bake(t).status, 0); assert(checkBakes(t.root).ok);
}));
test('uncommitted changes in the closure: a warning naming the files; --require-clean refuses (needs git)', () => fixture((t) => {
  const git = (...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: t.root, encoding: 'utf8' });
  if (git('init', '-q').status !== 0) { console.log('     (git is not available: skipped)'); return; }
  fs.writeFileSync(path.join(t.root, '.gitignore'), 'node_modules/\nassets/baked/\n'); git('add', '-A'); git('commit', '-q', '-m', 'fixture');
  let r = bake(t, ['--area', 'alpha']); assert.equal(r.status, 3, out(r)); assert(!r.stderr.includes('uncommitted'), r.stderr);
  fs.appendFileSync(path.join(t.root, 'src/world/m2.js'), '// uncommitted\n');
  r = bake(t, ['--area', 'alpha', '--force']); assert.match(r.stderr, /WARNING bake-scene: alpha: 1 file of its closure has uncommitted changes \(src\/world\/m2\.js\)/);
  r = bake(t, ['--area', 'alpha', '--force', '--require-clean']); assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /uncommitted changes/); assert(!r.stdout.includes('=== area'), 'refused before the browser');
}));
test('preflight in the real command: a wrong three.js version stops before any browser; a bake lock stops it too', () => fixture((t) => {
  writeTree(t.root, { 'node_modules/three/package.json': '{"version":"0.1.0"}' });
  let r = bake(t); assert.equal(r.status, 1); assert.match(r.stderr, /preflight: node_modules\/three is 0\.1\.0/); assert(!r.stdout.includes('=== area'));
  writeTree(t.root, { 'node_modules/three/package.json': '{"version":"0.170.0"}' }); fs.mkdirSync(path.dirname(lock(t)), { recursive: true }); fs.writeFileSync(lock(t), `${process.pid}\n`);
  r = bake(t); assert.equal(r.status, 1); assert.match(r.stderr, /another bake is running/);
}));

if (bad) { console.log(`RESULT: FAIL (${bad} of ${n})`); process.exit(1); }
console.log(`RESULT: OK (${n} checks)`);
