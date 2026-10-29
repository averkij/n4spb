// CPU test of tools/baked-revision.mjs on small FIXTURE trees (an in-memory overlay: no tree copy, no disk): the per-area revision is a pure function of the dependency closure.
// The checks are exported (fixtureChecks) so that tools/closure-mutation-test.mjs can run them against broken scanners: each check must FAIL on at least one mutant, otherwise it proves nothing.
//   node tools/baked-revision-test.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { makeScanner } from './lib/closure.mjs';
import { createRevisionContext, revisionOf, revisionsOf, areaRevision, liveAreas, BAKE_SCHEME } from './baked-revision.mjs';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x0d, 0x0a]);       // contains \r\n bytes: must NOT be normalised
const ROWS = [{ id: 'alpha', page: 'index.html' }, { id: 'beta', page: 'beta.html' }, { id: 'gamma', page: 'gamma.html', parked: true }];
const RULES = {
  DYNAMIC_IMPORTS: {
    'src/main.js': { '`./world/${n}.js`': { rule: 'area-modules' } },
    'src/world/m1.js': { '`./parts/${p}.js`': { rule: 'glob', dir: 'src/world/parts', pattern: '*.js' } },
  },
  RUNTIME_ASSETS: { 'src/core/engine.js': { './assets/logo.png': { path: 'assets/logo.png', hash: true } } },
};
const page = (id, extra = '') => `<!doctype html>\n<html lang="en" data-area="${id}">\n<head>\n<script type="importmap">\n{ "imports": { "./src/world/area.js": "./src/areas/${id}/area.js", "three": "https://cdn.example/three.js", "three/addons/": "https://cdn.example/jsm/" } }\n</script>\n</head>\n<body>\n<script type="module" src="./src/main.js"></script>${extra}\n</body>\n</html>\n`;
const lock = (version = '0.170.0', integrity = 'sha512-AAAA', extra = {}) => JSON.stringify({ packages: { '': {}, 'node_modules/three': { version, integrity }, ...extra } });
/** the base fixture tree: two live areas (alpha, beta) and one parked (gamma) sharing an engine; m1 is shared, m2 is alpha's */
export function baseTree() {
  return {
    'package-lock.json': lock(),
    'index.html': page('alpha'), 'beta.html': page('beta'), 'gamma.html': page('gamma'), 'other.html': '<html lang="en"><body>not an area</body></html>',
    'src/main.js': "import * as THREE from 'three';\nimport { AREA, MODULES } from './world/area.js';\nimport './core/engine.js';\nimport './core/gates.js';\nconst imports = new Map(MODULES.map((n) => { const p = import(`./world/${n}.js`); return [n, p]; }));\n",
    'src/world/area.js': "export const AREA = 'default';\nexport const MODULES = [\n  'zz',\n];\n",
    'src/areas/alpha/area.js': "export const AREA = 'alpha';\nexport const MODULES = [\n  'm1',\n  'm2',\n];\n",
    'src/areas/beta/area.js': "export const AREA = 'beta';\nexport const MODULES = [\n  'm1',\n];\n",
    'src/areas/gamma/area.js': "export const AREA = 'gamma';\nexport const MODULES = [\n  'm1',\n];\n",
    'src/core/engine.js': "import { BAKED_REVISION } from './baked-revision.js';\nimport './helper.js';\nexport const logo = './assets/logo.png';\n",
    'src/core/helper.js': 'export const h = 1;\n',
    'src/core/baked-revision.js': "export const BAKED_REVISION = 'x';\n",
    'src/core/gates.js': "import './gate-helper.js';\nexport const G = 1;\n",
    'src/core/gate-helper.js': 'export const GH = 1;\n',
    'src/areas/registry.js': 'export const REGISTRY = {};\n',
    'src/core/version.js': "export const VERSION = '1.0.0';\n",
    'src/core/handoff.js': 'export const HO = 1;\n',
    'src/world/m1.js': "import './landmarksNorth.js';\nimport './landmarksNorth/x.js';\nimport './landmarksNorthFull.js';\nexport { z } from './reexp.js';\nexport const build = async (p) => (await import(`./parts/${p}.js`)).build();\nconst only = './parts/a.js';\n",
    'src/world/m2.js': "import './alpha-only.js';\nexport const build = () => {};\n",
    'src/world/alpha-only.js': 'export const A = 1;\n',
    'src/world/reexp.js': 'export const z = 1;\n',
    'src/world/landmarksNorth.js': 'export const n = 1;\n', 'src/world/landmarksNorth/x.js': 'export const x = 1;\n', 'src/world/landmarksNorthFull.js': 'export const f = 1;\n',
    'src/world/parts/a.js': 'export const build = () => 1;\n', 'src/world/parts/b.js': 'export const build = () => 2;\n',
    'src/world/orphan.js': 'export const o = 1;\n',
    'assets/logo.png': PNG,
  };
}
export const patched = (patch, base = baseTree()) => { const t = { ...base }; for (const [k, v] of Object.entries(patch)) { if (v === null) delete t[k]; else t[k] = v; } return t; };
const GOLDEN = { alpha: 'eeb3d3adbe6750305986', beta: 'c0900c9ca08fc3673a8d' };

/** the checks: [{ name, run() }], run against a scanner with the given mutant flags */
export function fixtureChecks(scannerOpts = {}) {
  const scanner = makeScanner(scannerOpts);
  const ctxOf = (tree, o = {}) => createRevisionContext('/virtual', { virtual: true, overlay: tree, areas: ROWS, rules: RULES, scanner, ...o });
  const rev = (tree, id = 'alpha', o) => revisionOf('/virtual', id, ctxOf(tree, o));
  const all = (tree) => Object.fromEntries(['alpha', 'beta'].map((id) => [id, rev(tree, id)]));
  const moves = (patch) => { const a = all(baseTree()), b = all(patched(patch)); return Object.keys(a).filter((id) => a[id] !== b[id]); };
  const checks = [];
  const check = (name, run) => checks.push({ name, run });

  check('1 order: insertion order is irrelevant, the order is the POSIX string order', () => {
    const t = baseTree(), shuffled = Object.fromEntries(Object.entries(t).reverse());
    assert.equal(rev(t), rev(shuffled));
    const hashed = areaRevision('/virtual', 'alpha', ctxOf(t)).hashed, i = (p) => hashed.indexOf(p);
    assert(i('src/world/landmarksNorth.js') >= 0 && i('src/world/landmarksNorth.js') < i('src/world/landmarksNorth/x.js') && i('src/world/landmarksNorth/x.js') < i('src/world/landmarksNorthFull.js'), hashed.join(' '));
    assert.deepEqual(hashed, [...hashed].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
  });
  check('2 CRLF equals LF for text files; binary files are raw', () => {
    const base = rev(baseTree());
    assert.equal(rev(patched({ 'src/world/m1.js': baseTree()['src/world/m1.js'].replaceAll('\n', '\r\n'), 'index.html': baseTree()['index.html'].replaceAll('\n', '\r\n') })), base, 'CRLF == LF');
    assert.notEqual(rev(patched({ 'assets/logo.png': Buffer.from(PNG.toString('latin1').replaceAll('\r\n', '\n'), 'latin1') })), base, 'a PNG is not normalised');
  });
  check('3 delimiters: path/content boundaries cannot collide', () => {
    const mk = (p, c) => patched({ 'assets/p.png': null, [p]: c }, baseTree());
    const rules = (p) => ({ ...RULES, RUNTIME_ASSETS: { 'src/core/engine.js': { './assets/logo.png': { path: p, hash: true } } } });
    const a = rev(mk('assets/p.png', 'bc'), 'alpha', { rules: rules('assets/p.png') }), b = rev(mk('assets/p.pngb', 'c'), 'alpha', { rules: rules('assets/p.pngb') });
    assert.notEqual(a, b);
  });
  check('4 excluded: baked-revision.js and runtime-only files move nothing; a helper imported only by gates.js is hashed', () => {
    assert.deepEqual(moves({ 'src/core/baked-revision.js': "export const BAKED_REVISION = 'other';\n" }), []);
    for (const f of ['src/core/gates.js', 'src/core/version.js', 'src/core/handoff.js', 'src/areas/registry.js']) assert.deepEqual(moves({ [f]: (baseTree()[f] || '') + '// edit\n' }), [], f);
    assert.deepEqual(moves({ 'src/core/gate-helper.js': 'export const GH = 2;\n' }), ['alpha', 'beta'], 'gate-helper.js is hashed');
  });
  check('5 isolation: an exclusive file moves only its area, a shared file both; export-from and an unreferenced file', () => {
    assert.deepEqual(moves({ 'src/world/alpha-only.js': 'export const A = 2;\n' }), ['alpha']);
    assert.deepEqual(moves({ 'src/world/m2.js': baseTree()['src/world/m2.js'] + '// edit\n' }), ['alpha']);
    assert.deepEqual(moves({ 'src/core/helper.js': 'export const h = 2;\n' }), ['alpha', 'beta']);
    assert.deepEqual(moves({ 'src/world/reexp.js': 'export const z = 2;\n' }), ['alpha', 'beta'], 'export ... from is an edge');
    assert.deepEqual(moves({ 'src/world/orphan.js': 'export const o = 2;\n' }), [], 'a dead file moves nothing');
    assert.deepEqual(moves({ 'src/areas/gamma/area.js': baseTree()['src/areas/gamma/area.js'] + '// edit\n' }), [], 'the parked area is not part of the live ones');
  });
  check('6 remap: the target of the import map is in the importing area\'s closure and the original is not', () => {
    const c = scanner.closureOf('/virtual', 'alpha', ctxOf(baseTree()));
    assert(c.seen.has('src/areas/alpha/area.js') && !c.seen.has('src/world/area.js') && !c.seen.has('src/areas/beta/area.js'));
    assert.deepEqual(moves({ 'src/areas/alpha/area.js': baseTree()['src/areas/alpha/area.js'] + '// edit\n' }), ['alpha']);
    assert.deepEqual(moves({ 'src/world/area.js': baseTree()['src/world/area.js'] + '// edit\n' }), [], 'the original of a remapped file is dead');
  });
  check('7 dynamic rules: a template import includes the folder; an unlisted computed import() throws; a stale row throws', () => {
    assert.deepEqual(moves({ 'src/world/parts/b.js': 'export const build = () => 3;\n' }), ['alpha', 'beta'], 'b.js is never named by a literal but the glob takes the folder');
    assert.throws(() => rev(patched({ 'src/world/m2.js': baseTree()['src/world/m2.js'] + 'const q = async (x) => import(x);\n' })), /Unclassified.*import\(x\).*src\/world\/m2\.js/);
    assert.throws(() => rev(patched({ 'src/world/m1.js': baseTree()['src/world/m1.js'].replace('`./parts/${p}.js`', '`./parts/${p}.mjs`') })), /Unclassified/);
    assert.throws(() => rev(baseTree(), 'alpha', { rules: { ...RULES, DYNAMIC_IMPORTS: { ...RULES.DYNAMIC_IMPORTS, 'src/world/m2.js': { 'gone(x)': { rule: 'dir', dir: 'src/world' } } } } }), /StaleRule.*gone\(x\)/);
    assert.throws(() => rev(baseTree(), 'alpha', { rules: { ...RULES, RUNTIME_ASSETS: { ...RULES.RUNTIME_ASSETS, 'src/core/helper.js': { './assets/gone.png': { path: null, hash: false } } } } }), /StaleRule/);
  });
  check('8 ./x.js?v=1 resolves to x.js', () => {
    const t = patched({ 'src/core/helper.js': "import './q.js?v=1';\nexport const h = 1;\n", 'src/core/q.js': 'export const q = 1;\n' });
    assert(areaRevision('/virtual', 'alpha', ctxOf(t)).hashed.includes('src/core/q.js'));
    const u = patched({ 'src/core/helper.js': "import './q.js#frag';\nexport const h = 1;\n", 'src/core/q.js': 'export const q = 1;\n' });
    assert(areaRevision('/virtual', 'alpha', ctxOf(u)).hashed.includes('src/core/q.js'));
  });
  check('9 a missing import target throws and names the importer', () => {
    assert.throws(() => rev(patched({ 'src/world/alpha-only.js': null })), /Missing.*src\/world\/alpha-only\.js.*src\/world\/m2\.js/);
    assert.throws(() => rev(patched({ 'src/world/landmarksnorth.js': 'x', 'src/world/landmarksNorth.js': null })), /Missing.*case sensitive/);
  });
  check('10 a page edit moves only its own area; a page without a module script throws; an html file outside the registry is ignored', () => {
    assert.deepEqual(moves({ 'index.html': page('alpha', '<!-- edit -->\n<div>edit</div>') }), ['alpha']);
    assert.deepEqual(moves({ 'beta.html': page('beta', '<div>edit</div>') }), ['beta']);
    assert.deepEqual(moves({ 'other.html': '<html lang="en"><body>edited</body></html>' }), []);
    assert.deepEqual(moves({ 'gamma.html': page('gamma', '<div>edit</div>') }), [], 'parked');
    assert.throws(() => rev(patched({ 'index.html': page('alpha').replace('<script type="module" src="./src/main.js"></script>', '<!-- <script type="module" src="./src/main.js"></script> -->') })), /NoModuleScript/);
    assert.throws(() => rev(patched({ 'index.html': null })), /Missing|does not exist/);
  });
  check('11 the lock entry of three moves every area; an unrelated entry moves none', () => {
    assert.deepEqual(moves({ 'package-lock.json': lock('0.171.0') }), ['alpha', 'beta']);
    assert.deepEqual(moves({ 'package-lock.json': lock('0.170.0', 'sha512-BBBB') }), ['alpha', 'beta']);
    assert.deepEqual(moves({ 'package-lock.json': lock('0.170.0', 'sha512-AAAA', { 'node_modules/other': { version: '9.9.9' } }) }), []);
    assert.throws(() => rev(patched({ 'package-lock.json': JSON.stringify({ packages: {} }) })), /Lock/);
  });
  check('12 BAKE_SCHEME and the area id are in the preimage', () => {
    assert.equal(BAKE_SCHEME, 2);
    // two areas with identical closures (the same page, the same module list): the revisions still differ
    const twin = [{ id: 'a1', page: 'index.html' }, { id: 'a2', page: 'index.html' }];
    const t = patched({ 'index.html': page('a1'), 'src/areas/a1/area.js': baseTree()['src/areas/alpha/area.js'], 'src/areas/a2/area.js': baseTree()['src/areas/alpha/area.js'] });
    const ctx = ctxOf(t, { areas: twin });
    const r1 = revisionOf('/virtual', 'a1', ctx), r2 = revisionOf('/virtual', 'a2', ctx);
    assert.deepEqual([...scanner.closureOf('/virtual', 'a1', ctx).hashed], [...scanner.closureOf('/virtual', 'a2', ctx).hashed], 'identical closures');
    assert.notEqual(r1, r2);
    assert.match(r1, /^[0-9a-f]{20}$/);
  });
  check('13 golden: the algorithm is pinned (a deliberate change must update the literal)', () => {
    assert.deepEqual(all(baseTree()), GOLDEN);
    // and the documented preimage, spelled out independently of areaRevision(): "n4spb-bake-rev/<scheme>\narea\0<id>\n", per file "path\0length\0" + bytes + "\0", then "three\0<version> <integrity>"
    const tree = baseTree(), ctx = ctxOf(tree), h = createHash('sha256');
    h.update('n4spb-bake-rev/2\narea\0alpha\n');
    for (const rel of scanner.closureOf('/virtual', 'alpha', ctx).hashed) {
      const raw = Buffer.from(tree[rel]), b = /\.(js|mjs|html|json|css)$/.test(rel) ? Buffer.from(raw.toString('utf8').replaceAll('\r\n', '\n')) : raw;
      h.update(rel + '\0' + b.length + '\0'); h.update(b); h.update('\0');
    }
    h.update('three\0' + '0.170.0 sha512-AAAA');
    assert.equal(h.digest('hex').slice(0, 20), GOLDEN.alpha);
  });
  check('14 a large file is scanned as well as a small one', () => {
    const big = `${'// padding of a big module\n'.repeat(4000)}import './deep.js';\nexport const b = 1;\n`;
    const t = patched({ 'src/world/big.js': big, 'src/world/deep.js': 'export const d = 1;\n', 'src/world/m2.js': baseTree()['src/world/m2.js'] + "import './big.js';\n" });
    assert(big.length > 100000);
    assert(areaRevision('/virtual', 'alpha', ctxOf(t)).hashed.includes('src/world/deep.js'));
  });
  check('15 the read hook replaces file content; revisionsOf shares one walk; liveAreas skips parked rows', () => {
    const t = baseTree(); const hooked = (rel) => (rel === 'src/world/alpha-only.js' ? 'export const A = 3;\n' : undefined);
    const hooked1 = rev(t, 'alpha', { read: hooked }), plain = rev(t, 'alpha');
    assert.notEqual(hooked1, plain);
    assert.equal(hooked1, rev(patched({ 'src/world/alpha-only.js': 'export const A = 3;\n' })));
    const ctx = ctxOf(t), all3 = revisionsOf('/virtual', { ctx });
    assert.deepEqual(Object.keys(all3), ['alpha', 'beta', 'gamma']);
    assert.equal(all3.alpha.revision, plain);
    assert(all3.alpha.files > 10 && all3.alpha.bytes > 100 && Array.isArray(all3.alpha.hashed));
    assert.deepEqual(liveAreas('/virtual', ctx).map((r) => r.id), ['alpha', 'beta']);
    assert.equal(Object.keys(revisionsOf('/virtual', { ctx, ids: ['beta'] })).join(), 'beta');
  });
  return checks;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  let bad = 0;
  for (const c of fixtureChecks()) {
    try { c.run(); console.log('ok   ' + c.name); } catch (e) { bad++; console.log('FAIL ' + c.name + '\n     ' + String(e.message).split('\n').slice(0, 6).join('\n     ')); }
  }
  if (bad) { console.log(`RESULT: FAIL (${bad})`); process.exit(1); }
  console.log('RESULT: OK');
}
