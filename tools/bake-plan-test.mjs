// CPU test of the bake PLAN (tools/lib/bake-status.mjs planBake / parseBakeArgs, tools/bake-scene.mjs up to the preflight) and of the crash behaviour of publishArea. No GPU, no browser, no node_modules:
// the command line is run on a fabricated repository (tools/lib/bake-fixture.mjs) and never gets past the preflight. The default is "bake only what is stale"; every exit code is pinned.
//   node tools/bake-plan-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { planBake, parseBakeArgs } from './lib/bake-status.mjs';
import { checkBakes } from './bake-manifest-check.mjs';
import { syncRevisionMap } from './baked-revision-sync.mjs';
import { makeRoot, fakeBake, writeTree, manifestPath, readJSON } from './lib/bake-fixture.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
let n = 0, bad = 0;
const test = (name, fn) => { n++; try { fn(); console.log(`ok   ${name}`); } catch (e) { bad++; console.log(`FAIL ${name}\n     ${String(e.message).split('\n').slice(0, 10).join('\n     ')}`); } };

// ------------------------------------------------------------------------------------------------ planBake / parseBakeArgs (pure)
const S = (id, status, extra = {}) => ({ id, row: { id, parked: !!extra.parked }, status, estMinutes: 5, error: extra.error });
const world = (over = {}) => [S('strip', 'STALE', { parked: true }), S('north', 'FRESH', { parked: true }), S('palace', over.palace || 'FRESH'), S('smolny', over.smolny || 'FRESH'), S('vasilyevsky', over.vasilyevsky || 'FRESH'), S('future', 'PLANNED')]
  .filter((s) => over.showParked || !s.row.parked);
const plan = (statuses, ...argv) => planBake(statuses, parseBakeArgs(argv));
const ids = (p) => p.selected.map((x) => x.id);

test('the default takes the STALE and MISSING live areas only, in registry order', () => {
  assert.deepEqual(ids(plan(world({ vasilyevsky: 'STALE', palace: 'MISSING' }))), ['palace', 'vasilyevsky']);
  assert.deepEqual(ids(plan(world())), [], 'all fresh: nothing');
  assert.deepEqual(ids(plan(world({ smolny: 'STALE' }), '--area', 'stale')), ['smolny']);
  assert.deepEqual(plan(world({ smolny: 'STALE' })).selected, [{ id: 'smolny', reason: 'STALE' }]);
});
test('--area <id>: a stale area is taken, a fresh one is skipped with "use --force"; --force takes it', () => {
  const w = world({ vasilyevsky: 'STALE' });
  assert.deepEqual(ids(plan(w, '--area', 'vasilyevsky')), ['vasilyevsky']);
  const p = plan(w, '--area', 'smolny'); assert.deepEqual(ids(p), []); assert.match(p.skipped[0].why, /fresh, use --force/);
  const f = plan(w, '--area', 'smolny', '--force'); assert.deepEqual(f.selected, [{ id: 'smolny', reason: 'forced' }]);
  assert.deepEqual(ids(plan(w, '--area', 'vasilyevsky,palace')), ['vasilyevsky'], 'a list: the stale ones');
  assert.deepEqual(ids(plan(w, '--area', 'vasilyevsky,palace', '--force')), ['palace', 'vasilyevsky'], 'registry order, not the order given');
  assert.deepEqual(ids(plan(w, '--area', 'palace,palace', '--force')), ['palace'], 'no duplicate');
});
test('--area all: the stale live areas; --area all --force: every live area (the old behaviour); parked and planned never', () => {
  const w = world({ vasilyevsky: 'STALE', smolny: 'MISSING', showParked: true });
  assert.deepEqual(ids(plan(w, '--area', 'all')), ['smolny', 'vasilyevsky']);
  assert.deepEqual(ids(plan(w, '--area', 'all', '--force')), ['palace', 'smolny', 'vasilyevsky']);
  assert.deepEqual(plan(w, '--area', 'all', '--force').errors, []);
});
test('a parked area is taken only when named', () => {
  const w = world({ showParked: true });
  assert.deepEqual(ids(plan(w)), [], 'the stale strip is not taken by the default');
  assert.deepEqual(ids(plan(w, '--area', 'all')), []);
  assert.deepEqual(ids(plan(w, '--area', 'strip')), ['strip']);
  assert.deepEqual(ids(plan(w, '--area', 'north')), [], 'a fresh parked area: skipped'); assert.deepEqual(ids(plan(w, '--area', 'north', '--force')), ['north']);
});
test('an unknown id and a planned area are usage errors (exit 2); --force alone is one too', () => {
  for (const argv of [['--area', 'nope'], ['--area', 'future'], ['--force'], ['--area', 'palace,nope']]) { const p = plan(world(), ...argv); assert(p.usage && p.errors.length, argv.join(' ')); }
  assert.match(plan(world(), '--area', 'nope').errors[0], /unknown area "nope"/);
  assert.match(plan(world(), '--area', 'future').errors[0], /planned/);
  assert.match(plan(world(), '--force').errors[0], /--force needs --area/);
});
test('UNSYNCED is repaired without a GPU (listed in repair), never baked unless forced; ERROR is an error, not a bake', () => {
  const w = world({ smolny: 'UNSYNCED', vasilyevsky: 'STALE' });
  const p = plan(w); assert.deepEqual(p.repair, ['smolny']); assert.deepEqual(ids(p), ['vasilyevsky']);
  assert.deepEqual(ids(plan(w, '--area', 'smolny')), []); assert.deepEqual(plan(w, '--area', 'smolny', '--force').selected, [{ id: 'smolny', reason: 'forced' }]);
  const e = plan(world({ palace: 'ERROR' })); assert.equal(e.errors.length, 1); assert.match(e.errors[0], /palace/); assert(!e.usage);
});
test('the command line parser: flags, values, errors', () => {
  const a = parseBakeArgs(['--plan', '--check', '--area', 'a,b', '--force', '--require-clean', '--root', 'x']);
  assert.deepEqual([a.plan, a.check, a.force, a.requireClean, a.root, a.area, a.errors], [true, true, true, true, 'x', ['a', 'b'], []]);
  assert.equal(parseBakeArgs([]).area, null); assert.equal(parseBakeArgs(['--area', 'all']).area, 'all'); assert.equal(parseBakeArgs(['--area', 'stale']).area, 'stale');
  for (const bad of [['--check'], ['--bogus'], ['--area'], ['--area', '--force'], ['--area', 'a', '--area', 'b'], ['--area', ',']]) assert(parseBakeArgs(bad).errors.length, bad.join(' '));
});

// ------------------------------------------------------------------------------------------------ the command line, up to the preflight (a fabricated repository)
const run = (root, ...a) => spawnSync(process.execPath, [path.join(here, 'bake-scene.mjs'), '--root', root, ...a], { encoding: 'utf8', timeout: 60000 });
const out = (r) => `${r.stdout}\n${r.stderr}`;
const lockPath = (root) => path.join(root, 'assets/baked/.bake.lock');
function world2(body) {
  const t = makeRoot();
  try { fakeBake(t.root, 'alpha'); fakeBake(t.root, 'beta'); body(t); }
  finally { t.remove(); }
}
const stale = (t, rel = 'src/world/m2.js') => fs.appendFileSync(path.join(t.root, rel), '// edit\n');

test('all fresh: the default says so and exits 0 without a lock or a browser; --plan and --plan --check agree', () => world2((t) => {
  let r = run(t.root); assert.equal(r.status, 0, out(r)); assert.match(r.stdout, /all fresh/); assert(!fs.existsSync(lockPath(t.root)));
  r = run(t.root, '--plan'); assert.equal(r.status, 0); assert.match(r.stdout, /PLAN: nothing to bake \(all fresh\)/);
  r = run(t.root, '--plan', '--check'); assert.equal(r.status, 0, out(r));
}));
test('--plan: which areas and why, the changed files, the estimate (observed bakeSeconds), the command; --plan --check exits 1', () => world2((t) => {
  stale(t);
  let r = run(t.root, '--plan'); assert.equal(r.status, 0, out(r));
  assert.match(r.stdout, /\[alpha\] STALE: .*changed since the bake: src\/world\/m2\.js/); assert.match(r.stdout, /\[beta\] FRESH/);
  assert.match(r.stdout, /PLAN: bake alpha \(STALE\); about 6 GPU-minutes; node tools\/bake-scene\.mjs\s*$/m, 'the estimate comes from inputs.json bakeSeconds (321 s -> 6 min); every stale area: the plain command');
  assert.match(run(t.root, '--plan', '--area', 'alpha,gamma').stdout, /PLAN: bake alpha \(STALE\), gamma \(MISSING\); about 11 GPU-minutes; node tools\/bake-scene\.mjs --area alpha,gamma/, 'a named list: --area');
  r = run(t.root, '--plan', '--check'); assert.equal(r.status, 1, out(r));
  stale(t, 'src/world/m1.js');
  r = run(t.root, '--plan'); assert.match(r.stdout, /PLAN: bake alpha \(STALE\), beta \(STALE\); about 12 GPU-minutes; node tools\/bake-scene\.mjs\s*$/m);
}));
test('--plan --area beta --force on a fresh area: it is taken as "forced", the command carries --force', () => world2((t) => {
  const r = run(t.root, '--plan', '--area', 'beta', '--force'); assert.match(r.stdout, /PLAN: bake beta \(forced\); about 6 GPU-minutes; node tools\/bake-scene\.mjs --area beta --force/);
}));
test('--plan --area gamma: the parked area is taken by name (MISSING); the default plan does not show it', () => world2((t) => {
  assert(!run(t.root, '--plan').stdout.includes('gamma'));
  const r = run(t.root, '--plan', '--area', 'gamma'); assert.match(r.stdout, /\[gamma\] MISSING/); assert.match(r.stdout, /PLAN: bake gamma \(MISSING\)/);
}));
test('--area on a fresh area: "fresh, use --force", exit 0, no bake', () => world2((t) => {
  const r = run(t.root, '--area', 'beta'); assert.equal(r.status, 0, out(r)); assert.match(r.stdout, /beta: fresh, use --force/);
}));
test('usage errors exit 2: unknown area, planned area, --force alone, --check without --plan, an unknown flag', () => world2((t) => {
  for (const a of [['--area', 'nope'], ['--area', 'delta'], ['--force'], ['--check'], ['--bogus']]) { const r = run(t.root, ...a); assert.equal(r.status, 2, `${a.join(' ')}\n${out(r)}`); }
}));
test('UNSYNCED (a wrong map entry, an orphan product) is repaired by the bake command itself, without a GPU, exit 0', () => world2((t) => {
  const alphaDir = path.join(t.root, 'assets/baked/alpha'); fs.writeFileSync(path.join(alphaDir, `roof.${'a'.repeat(20)}.bin.gz`), 'old');
  fs.writeFileSync(path.join(t.root, 'src/core/baked-revision.js'), "// Generated by npm run bake.\nexport const BAKED_REVISION = '78fc35d9a53453f9fa9a';\n");
  assert.equal(checkBakes(t.root).ok, false);
  const r = run(t.root); assert.equal(r.status, 0, out(r)); assert.match(r.stdout, /synced alpha, beta without a GPU/);
  const c = checkBakes(t.root); assert(c.ok, c.lines.join('\n')); assert(!fs.existsSync(path.join(alphaDir, `roof.${'a'.repeat(20)}.bin.gz`)));
  assert(!fs.existsSync(lockPath(t.root)), 'the lock is released');
}));
test('preflight: a live bake lock aborts (the lock stays); a lock of a dead process is taken over and released; no node_modules/three aborts; a wrong three version aborts', () => world2((t) => {
  stale(t);
  fs.mkdirSync(path.dirname(lockPath(t.root)), { recursive: true }); fs.writeFileSync(lockPath(t.root), `${process.pid}\n`);
  let r = run(t.root); assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /another bake is running/); assert(fs.existsSync(lockPath(t.root)), 'a lock of a live process is never removed');
  const dead = spawnSync(process.execPath, ['-e', '']).pid; fs.writeFileSync(lockPath(t.root), `${dead}\n`);
  r = run(t.root); assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /node_modules\/three is not installed/); assert(!fs.existsSync(lockPath(t.root)), 'the lock is released on exit');
  writeTree(t.root, { 'node_modules/three/package.json': JSON.stringify({ name: 'three', version: '0.169.0' }) });
  r = run(t.root); assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /node_modules\/three is 0\.169\.0 but package-lock\.json locks 0\.170\.0/);
  fs.writeFileSync(lockPath(t.root), 'garbage'); r = run(t.root); assert.equal(r.status, 1); assert.match(r.stderr, /not a pid/);
}));
test('a closure that cannot be computed stops the plan before any GPU time (exit 1), naming the file', () => world2((t) => {
  fs.appendFileSync(path.join(t.root, 'src/world/m2.js'), "import './not-there.js';\n");
  const r = run(t.root); assert.equal(r.status, 1, out(r)); assert.match(r.stderr, /alpha: the closure cannot be computed: .*not-there\.js/);
  assert(!fs.existsSync(lockPath(t.root)));
}));

// ------------------------------------------------------------------------------------------------ a crash inside publishArea
test('publishArea without a fault: the new bake is FRESH, the old products are gone, the map follows', () => world2((t) => {
  stale(t); const oldProducts = fs.readdirSync(path.join(t.root, 'assets/baked/alpha')).filter((f) => f.endsWith('.bin.gz'));
  const b = fakeBake(t.root, 'alpha');
  const c = checkBakes(t.root); assert(c.ok, c.lines.join('\n'));
  for (const f of oldProducts) assert(!fs.existsSync(path.join(t.root, 'assets/baked/alpha', f)), `${f} purged`);
  assert(b.purged.length >= 8);
}));
test("crash after the inputs: the old manifest stays, the area is STALE (the new products are orphans), the map is untouched", () => world2((t) => {
  stale(t); const before = fs.readFileSync(path.join(t.root, 'src/core/baked-revision.js'), 'utf8');
  assert.throws(() => fakeBake(t.root, 'alpha', { fault: 'after-inputs' }), /after-inputs/);
  const c = checkBakes(t.root); assert(!c.ok); assert.equal(c.statuses.find((s) => s.id === 'alpha').status, 'STALE');
  assert.equal(fs.readFileSync(path.join(t.root, 'src/core/baked-revision.js'), 'utf8'), before);
  assert.equal(c.statuses.find((s) => s.id === 'beta').status, 'FRESH', 'the other area is untouched');
}));
test("crash after the manifest: the area's bake is committed but the map is old -> UNSYNCED, red; the sync tool repairs it; a re-run of the bake command repairs it too", () => world2((t) => {
  stale(t);
  assert.throws(() => fakeBake(t.root, 'alpha', { fault: 'after-manifest' }), /after-manifest/);
  let c = checkBakes(t.root); assert(!c.ok); assert.equal(c.statuses.find((s) => s.id === 'alpha').status, 'UNSYNCED');
  assert(c.lines.join('\n').includes('src/core/baked-revision.js says'), c.lines.join('\n'));
  const newRev = readJSON(manifestPath(t.root, 'alpha')).revision;
  const r = syncRevisionMap(t.root, { check: true }); assert(r.changed, 'sync --check sees it'); assert.equal(r.map.alpha, newRev);
  const run1 = run(t.root); assert.equal(run1.status, 0, out(run1));        // the bake command: UNSYNCED -> sync + purge, nothing to bake
  c = checkBakes(t.root); assert(c.ok, c.lines.join('\n'));
}));
test("crash after the map: the old products remain; the check reports them as orphans (UNSYNCED); sync --purge removes exactly them", () => world2((t) => {
  stale(t);
  assert.throws(() => fakeBake(t.root, 'alpha', { fault: 'after-map' }), /after-map/);
  const c = checkBakes(t.root); assert(!c.ok); assert.equal(c.statuses.find((s) => s.id === 'alpha').status, 'UNSYNCED');
  assert.match(c.lines.join('\n'), /orphan product roof\.[0-9a-f]{20}\.bin\.gz/); assert.deepEqual(c.mapProblems, []);
  const dir = path.join(t.root, 'assets/baked/alpha'), newRev = readJSON(manifestPath(t.root, 'alpha')).revision;
  const r = syncRevisionMap(t.root, { purge: true });
  assert.equal(r.changed, false); assert.equal(r.purged.alpha.length, 10);
  assert(fs.readdirSync(dir).filter((f) => f.endsWith('.bin.gz')).every((f) => f.includes(newRev)));
  assert(checkBakes(t.root).ok);
}));
test('sync --purge never purges an inconsistent manifest (the orphans may be the only good copy)', () => world2((t) => {
  stale(t); const dir = path.join(t.root, 'assets/baked/alpha');
  assert.throws(() => fakeBake(t.root, 'alpha', { fault: 'after-map' }), /after-map/);
  fs.rmSync(path.join(dir, fs.readdirSync(dir).find((f) => f.startsWith('roof.') && f.includes(readJSON(manifestPath(t.root, 'alpha')).revision))));
  const before = fs.readdirSync(dir).length, r = syncRevisionMap(t.root, { purge: true });
  assert.match(r.refused.alpha, /not consistent/); assert.equal(fs.readdirSync(dir).length, before);
}));

if (bad) { console.log(`RESULT: FAIL (${bad} of ${n})`); process.exit(1); }
console.log(`RESULT: OK (${n} checks)`);
