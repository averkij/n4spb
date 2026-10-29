// CPU test of tools/bake-manifest-check.mjs on FABRICATED repositories (tools/lib/bake-fixture.mjs: a tiny tree on disk with fake bakes published by the real publishArea). One case per failure the check
// must name; the check must report ALL failures together, name the files that changed since the bake (inputs.json) and exit 1.
//   node tools/bake-manifest-check-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkBakes } from './bake-manifest-check.mjs';
import { makeRoot, fakeBake, mutateJSON, manifestPath, writeTree } from './lib/bake-fixture.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const MAP = (root) => path.join(root, 'src/core/baked-revision.js');
let n = 0, bad = 0;
/** a fresh fixture with both live areas baked; body(t) may break it and return the check result to assert on */
function scenario(name, body) {
  n++; const t = makeRoot();
  try { fakeBake(t.root, 'alpha'); fakeBake(t.root, 'beta'); body(t); console.log(`ok   ${name}`); }
  catch (e) { bad++; console.log(`FAIL ${name}\n     ${String(e.message).split('\n').slice(0, 8).join('\n     ')}`); }
  finally { t.remove(); }
}
const text = (r) => r.lines.join('\n');
const alphaDir = (t) => path.join(t.root, 'assets/baked/alpha');
const has = (r, ...bits) => { for (const b of bits) assert(text(r).includes(b), `missing "${b}" in:\n${text(r)}`); };
const status = (r, id) => r.statuses.find((s) => s.id === id).status;

scenario('a fresh tree passes; the parked area is not checked unless named', (t) => {
  const r = checkBakes(t.root);
  assert(r.ok, text(r)); assert.deepEqual(r.fresh, ['alpha', 'beta']); assert.equal(r.statuses.length, 2);
  has(r, 'RESULT: OK (fresh: alpha, beta;');
  const g = checkBakes(t.root, { ids: ['gamma'] });
  assert(!g.ok); assert.equal(status(g, 'gamma'), 'MISSING'); has(g, '[gamma] MISSING', 'RESULT: FAIL: missing: gamma');
});
scenario('stale revision: the changed files are named, the other area stays fresh, the map is still consistent', (t) => {
  fs.appendFileSync(path.join(t.root, 'src/world/m2.js'), '// edit\n');
  const r = checkBakes(t.root);
  assert(!r.ok); assert.equal(status(r, 'alpha'), 'STALE'); assert.equal(status(r, 'beta'), 'FRESH');
  has(r, '[alpha] STALE: manifest ', 'but closure (8 files) hashes to ', 'changed since the bake: src/world/m2.js', 'Re-bake: node tools/bake-scene.mjs --area alpha', 'RESULT: FAIL: stale: alpha; fresh: beta');
  assert.deepEqual(r.mapProblems, []);
});
scenario('a page edit is named; a file added to the closure is named as new; a lock change is named', (t) => {
  fs.appendFileSync(path.join(t.root, 'index.html'), '\n<!-- x -->\n');
  writeTree(t.root, { 'src/world/m1.js': "import './fresh.js';\nexport const m1 = 1;\n", 'src/world/fresh.js': 'export const f = 1;\n' });
  const lock = JSON.parse(fs.readFileSync(path.join(t.root, 'package-lock.json'), 'utf8')); lock.packages['node_modules/three'].version = '0.171.0';
  fs.writeFileSync(path.join(t.root, 'package-lock.json'), JSON.stringify(lock));
  const r = checkBakes(t.root);
  has(r, 'index.html', 'src/world/fresh.js (new)', 'src/world/m1.js', 'package-lock.json (three)');
  assert.equal(status(r, 'beta'), 'STALE');
});
scenario('without inputs.json the stale message says the changed files are unknown (a warning, not a failure of its own)', (t) => {
  fs.appendFileSync(path.join(t.root, 'src/world/m2.js'), '// edit\n'); fs.rmSync(path.join(alphaDir(t), 'inputs.json'));
  const r = checkBakes(t.root);
  has(r, 'changed files unknown (no inputs.json)'); assert(!text(r).includes('changed since the bake: src'));
});
scenario('no manifest: MISSING with the command', (t) => {
  fs.rmSync(manifestPath(t.root, 'alpha'));
  const r = checkBakes(t.root); assert.equal(status(r, 'alpha'), 'MISSING'); has(r, '[alpha] MISSING', 'node tools/bake-scene.mjs --area alpha');
});
scenario('wrong area in the manifest', (t) => {
  mutateJSON(manifestPath(t.root, 'alpha'), (m) => { m.area = 'beta'; });
  const r = checkBakes(t.root); assert.equal(status(r, 'alpha'), 'STALE'); has(r, 'the manifest says area "beta" but it lives in the directory of alpha');
});
scenario('wrong scheme (also a manifest without one)', (t) => {
  mutateJSON(manifestPath(t.root, 'alpha'), (m) => { m.scheme = 1; });
  has(checkBakes(t.root), 'manifest scheme 1 but the tools are at BAKE_SCHEME 2');
  mutateJSON(manifestPath(t.root, 'alpha'), (m) => { delete m.scheme; });
  has(checkBakes(t.root), 'manifest scheme none (a bake of the global-revision era)');
});
scenario('wrong format', (t) => { mutateJSON(manifestPath(t.root, 'alpha'), (m) => { m.format = 2; }); has(checkBakes(t.root), 'manifest format 2 (expected 1)'); });
scenario('a missing product file and a missing required key', (t) => {
  fs.rmSync(path.join(alphaDir(t), fs.readdirSync(alphaDir(t)).find((f) => f.startsWith('roof.'))));
  let r = checkBakes(t.root); assert.equal(status(r, 'alpha'), 'STALE'); has(r, 'product file roof.', 'does not exist');
  mutateJSON(manifestPath(t.root, 'beta'), (m) => { delete m.files['nav-low']; });
  r = checkBakes(t.root); has(r, '[beta] STALE', 'missing required product nav-low');
});
scenario('a mis-named product (another revision in the name)', (t) => {
  const m = JSON.parse(fs.readFileSync(manifestPath(t.root, 'alpha'), 'utf8')), old = m.files.field, wrong = old.replace(m.revision, '0'.repeat(20));
  fs.renameSync(path.join(alphaDir(t), old), path.join(alphaDir(t), wrong));
  mutateJSON(manifestPath(t.root, 'alpha'), (x) => { x.files.field = wrong; });
  const r = checkBakes(t.root); has(r, `product field is named "${wrong}", expected field.${m.revision}.bin.gz`);
});
scenario('a wrong size', (t) => {
  mutateJSON(manifestPath(t.root, 'alpha'), (m) => { m.sizes.field.gzip += 1; });
  has(checkBakes(t.root), 'is ', 'bytes, the manifest says ');
});
scenario('a wrong sha256 (a damaged product of the right size), and a missing sha256 key; --no-sha skips the hash', (t) => {
  const f = path.join(alphaDir(t), fs.readdirSync(alphaDir(t)).find((x) => x.startsWith('nav-low.')));
  const b = fs.readFileSync(f); b[0] ^= 0xff; fs.writeFileSync(f, b);
  let r = checkBakes(t.root); assert.equal(status(r, 'alpha'), 'STALE'); has(r, 'does not match its sha256');
  assert.equal(status(checkBakes(t.root, { sha256: false }), 'alpha'), 'FRESH', 'the sizes are right: only the hash sees the damage');
  mutateJSON(manifestPath(t.root, 'beta'), (m) => { delete m.sha256.roof; });
  r = checkBakes(t.root); has(r, 'sha256.roof is missing');
});
scenario('a manifest without a sha256 section is a warning, not a failure', (t) => {
  mutateJSON(manifestPath(t.root, 'alpha'), (m) => { delete m.sha256; });
  const r = checkBakes(t.root); assert(r.ok, text(r)); has(r, '[alpha] warning: the manifest has no sha256 section');
});
scenario('a leftover .part / .tmp file: UNSYNCED, the check is red', (t) => {
  fs.writeFileSync(path.join(alphaDir(t), `field.${'a'.repeat(20)}.part`), 'x'); fs.writeFileSync(path.join(alphaDir(t), 'manifest.json.tmp'), '{}');
  const r = checkBakes(t.root); assert(!r.ok); assert.equal(status(r, 'alpha'), 'UNSYNCED'); has(r, 'unfinished file field.', 'unfinished file manifest.json.tmp', 'RESULT: FAIL: unsynced: alpha; fresh: beta');
});
scenario('an orphan product of another revision: UNSYNCED, named', (t) => {
  fs.writeFileSync(path.join(alphaDir(t), `field.${'b'.repeat(20)}.bin.gz`), 'old');
  const r = checkBakes(t.root); assert.equal(status(r, 'alpha'), 'UNSYNCED'); has(r, `orphan product field.${'b'.repeat(20)}.bin.gz`);
});
scenario('a wrong map entry', (t) => {
  fs.writeFileSync(MAP(t.root), fs.readFileSync(MAP(t.root), 'utf8').replace(/alpha: '[0-9a-f]{20}'/, `alpha: '${'c'.repeat(20)}'`));
  const r = checkBakes(t.root); assert(!r.ok); has(r, '[map] src/core/baked-revision.js: alpha is cccccccccccccccccccc but its manifest says '); assert.equal(status(r, 'alpha'), 'UNSYNCED');
});
scenario('an extra key in the map (a parked or unknown area) and a missing entry', (t) => {
  fs.writeFileSync(MAP(t.root), fs.readFileSync(MAP(t.root), 'utf8').replace("  beta:", `  gamma: '${'d'.repeat(20)}',\n  beta:`));
  has(checkBakes(t.root), 'has an entry for gamma, which is not a live area (extra key)');
  fs.writeFileSync(MAP(t.root), fs.readFileSync(MAP(t.root), 'utf8').replace(/  beta: '[0-9a-f]{20}',\n/, '').replace(/  gamma: '[^']*',\n/, ''));
  has(checkBakes(t.root), 'beta is missing but its manifest says ');
});
scenario('a hand-edited baked-revision.js (right map, wrong text) and a legacy single-constant file', (t) => {
  fs.appendFileSync(MAP(t.root), '// hand edit\n');
  let r = checkBakes(t.root); assert(!r.ok); has(r, 'is not exactly what the generator writes');
  fs.writeFileSync(MAP(t.root), "// Generated by npm run bake.\nexport const BAKED_REVISION = '78fc35d9a53453f9fa9a';\n");
  r = checkBakes(t.root); has(r, 'is not the generated per-area map');
});
scenario('ALL failures are reported together: stale + missing product + wrong map + unfinished file', (t) => {
  fs.appendFileSync(path.join(t.root, 'src/world/m2.js'), '// edit\n');
  fs.rmSync(path.join(alphaDir(t), fs.readdirSync(alphaDir(t)).find((f) => f.startsWith('roof.'))));
  fs.writeFileSync(path.join(t.root, 'assets/baked/beta', `x.${'e'.repeat(20)}.part`), 'x');
  fs.writeFileSync(MAP(t.root), fs.readFileSync(MAP(t.root), 'utf8').replace(/beta: '[0-9a-f]{20}'/, `beta: '${'f'.repeat(20)}'`));
  const r = checkBakes(t.root); assert(!r.ok);
  has(r, '[alpha] STALE', 'changed since the bake: src/world/m2.js', 'product file roof.', '[beta] UNSYNCED', 'unfinished file', '[map]', 'RESULT: FAIL: stale: alpha; unsynced: beta; map: 1 problem');
});
scenario('usage: an unknown and a planned area', (t) => {
  assert.match(checkBakes(t.root, { ids: ['nope'] }).usage, /unknown area "nope"/);
  assert.match(checkBakes(t.root, { ids: ['delta'] }).usage, /planned/);
});
scenario('the command line: exit 0 on a fresh tree, exit 1 on a stale one, exit 2 on a bad argument', (t) => {
  const run = (...a) => spawnSync(process.execPath, [path.join(here, 'bake-manifest-check.mjs'), '--root', t.root, ...a], { encoding: 'utf8' });
  assert.equal(run().status, 0, run().stdout);
  assert.equal(run('--area', 'zzz').status, 2); assert.equal(run('--bogus').status, 2);
  fs.appendFileSync(path.join(t.root, 'src/world/m2.js'), '// edit\n');
  const r = run(); assert.equal(r.status, 1); assert(r.stdout.includes('RESULT: FAIL: stale: alpha; fresh: beta'), r.stdout);
});

if (bad) { console.log(`RESULT: FAIL (${bad} of ${n})`); process.exit(1); }
console.log(`RESULT: OK (${n} scenarios)`);
