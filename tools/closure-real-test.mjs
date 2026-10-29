// CPU test of the per-area bake revisions on the REAL tree (an in-memory overlay edits one file at a time; nothing is written to disk): which areas does an edit stale?
// The checks are exported (realChecks) so that tools/closure-mutation-test.mjs can run them against broken scanners. Needs no node_modules, no browser, no git.
//   node tools/closure-real-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeScanner } from './lib/closure.mjs';
import { DYNAMIC_IMPORTS, isAllowedServed } from './lib/closure-rules.mjs';
import { createRevisionContext, revisionsOf, liveAreas } from './baked-revision.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const LIVE = ['palace', 'smolny', 'vladimirsky', 'admiralty', 'vasilyevsky', 'gavan', 'morskoy', 'dekabristov'];
/** closure sizes (hashed files) of the design round's scanner at v3.1.0: palace 591, smolny 414, vladimirsky 447, admiralty 614, vasilyevsky 764. The band is wide upwards: the whole-folder rules over-include. */
const SCOUT = { palace: 591, smolny: 414, vladimirsky: 447, admiralty: 614, vasilyevsky: 764,
  // gavan / morskoy / dekabristov (docs/AREAS.md 15.g): no design-round scanner existed for them; these are the hashed-file counts of the finished areas at v4.0.0 (the bake log of the first bake of all eight areas).
  gavan: 589, morskoy: 431, dekabristov: 468 };
const SCOUT_UP = {};
/** areas whose bake does not exist yet, so no headless page load could be recorded (node tools/closure-groundtruth.mjs <id> --record needs a published bake): none since the bake of v4.0.0 (the three fixtures are recorded). */
const NO_FIXTURE_YET = [];
const CHANGE = '\n// edit by closure-real-test\n';

export function realChecks(scannerOpts = {}, { ctx: given = null } = {}) {
  const scanner = makeScanner(scannerOpts);
  const base = given || createRevisionContext(root, { scanner });
  if (given) given.scanner = scanner;
  const check = (name, run) => checks.push({ name, run }), checks = [];
  let baseRevs = null;
  const revs = (ctx) => Object.fromEntries(Object.entries(revisionsOf(root, { ctx, ids: LIVE })).map(([id, v]) => [id, v.revision]));
  const baseline = () => baseRevs || (baseRevs = revs(base));
  /** the live areas whose revision changes when `patch` is applied */
  const moves = (patch) => { const after = revs(base.derive(patch)), before = baseline(); return LIVE.filter((id) => before[id] !== after[id]); };
  const appended = (rel) => ({ [rel]: base.text(rel) + (rel.endsWith('.html') ? '\n<!-- edit by closure-real-test -->\n' : CHANGE) });
  let closures = null;
  const closuresOf = () => closures || (closures = Object.fromEntries(LIVE.map((id) => [id, scanner.closureOf(root, id, base)])));
  const exclusive = (id) => { const cl = closuresOf(); const only = cl[id].hashed.filter((f) => /\.js$/.test(f) && LIVE.every((o) => o === id || !cl[o].seen.has(f))); return only.find((f) => f.startsWith('src/world/') && !f.includes('/data/')) || only[0]; };

  check('the live areas of the registry (five old ones + gavan, morskoy, dekabristov)', () => assert.deepEqual(liveAreas(root, base).map((r) => r.id), LIVE));
  check('all revisions are distinct 20-hex strings', () => {
    const r = baseline(); for (const id of LIVE) assert.match(r[id], /^[0-9a-f]{20}$/, id);
    assert.equal(new Set(Object.values(r)).size, LIVE.length);
  });
  check('an exclusive source file of each area moves only that area', () => {
    for (const id of LIVE) { const f = exclusive(id); assert(f, `${id} has no exclusive file`); assert.deepEqual(moves(appended(f)), [id], `${f} (exclusive to ${id})`); }
  });
  check('a comment appended to a vasilyevsky-only file moves only vasilyevsky', () => {
    const f = exclusive('vasilyevsky'); assert.deepEqual(moves(appended(f)), ['vasilyevsky'], f);
    assert.deepEqual(moves(appended('src/world/landmarksKirova/garden.js')), ['vasilyevsky', 'gavan'], 'the Kirova garden is listed by vasilyevsky and gavan only (docs/AREAS.md 15.g: the Kirov Palace of Culture lies in both territories)');
  });
  check('the data of palace, smolny.html and index.html each move only their own area', () => {
    assert.deepEqual(moves(appended('src/areas/palace/data/city.js')), ['palace']);
    assert.deepEqual(moves(appended('smolny.html')), ['smolny']);
    assert.deepEqual(moves(appended('index.html')), ['palace']);
    for (const [id, page] of [['vladimirsky', 'vladimirsky.html'], ['admiralty', 'admiralty.html'], ['vasilyevsky', 'vasilyevsky.html'], ['gavan', 'gavan.html'], ['morskoy', 'morskoy.html'], ['dekabristov', 'dekabristov.html']]) assert.deepEqual(moves(appended(page)), [id], page);
  });
  check('engine files move every live area: claims.js, baked-world.js, main.js, and the lock entry of three', () => {
    assert.deepEqual(moves(appended('src/world/lib/claims.js')), LIVE);
    assert.deepEqual(moves(appended('src/core/baked-world.js')), LIVE);
    assert.deepEqual(moves(appended('src/main.js')), LIVE);
    const lock = JSON.parse(base.text('package-lock.json')); lock.packages['node_modules/three'].version = '0.999.0';
    assert.deepEqual(moves({ 'package-lock.json': JSON.stringify(lock, null, 2) }), LIVE);
    const other = JSON.parse(base.text('package-lock.json')); other.packages['node_modules/puppeteer-core'] = { ...(other.packages['node_modules/puppeteer-core'] || {}), version: '0.0.1' };
    assert.deepEqual(moves({ 'package-lock.json': JSON.stringify(other, null, 2) }), [], 'an unrelated lock entry moves nothing');
  });
  check('hashed from outside src/: vendor/rapier and the car logo move every live area', () => {
    assert.deepEqual(moves(appended('vendor/rapier/rapier.js')), LIVE);
    assert.deepEqual(moves({ 'assets/bibliotochka.png': Buffer.concat([base.bytes('assets/bibliotochka.png'), Buffer.from([0])]) }), LIVE);
  });
  check('runtime-only, generated and dead files move none: gates, registry, version, handoff, baked-revision, an orphan', () => {
    for (const f of ['src/core/gates.js', 'src/areas/registry.js', 'src/core/version.js', 'src/core/handoff.js', 'src/core/baked-revision.js', 'src/world/landmarksSmolensky/trees.js']) assert.deepEqual(moves(appended(f)), [], f);
  });
  check('a page of a parked area and an html file outside the registry move none', () => {
    assert.deepEqual(moves(appended('strip.html')), []);
    assert.deepEqual(moves(appended('north.html')), []);
  });
  check('closure sizes are within 0.85x .. 1.25x of the design-round scanner; the engine (in every area) has at least 250 files', () => {
    const cl = closuresOf();
    for (const id of LIVE) { const n = cl[id].hashed.length; assert(n >= SCOUT[id] * 0.85 && n <= SCOUT[id] * (SCOUT_UP[id] || 1.25), `${id}: ${n} files (expected about ${SCOUT[id]})`); }
    const engine = cl.palace.hashed.filter((f) => LIVE.every((id) => cl[id].seen.has(f)));
    assert(engine.length >= 250, `engine ${engine.length}`);
  });
  check('the whole-folder rules: every file a computed import() can reach is in the closure of every area that contains the importing file', () => {
    const cl = closuresOf();
    for (const [file, rows] of Object.entries(DYNAMIC_IMPORTS)) for (const [expr, r] of Object.entries(rows)) {
      if (r.rule !== 'dir' && r.rule !== 'glob') continue;
      const d = r.dir.replace(/\/*$/, '/'), want = base.list().filter((p) => p.startsWith(d) && /\.js$/.test(p) && (r.rule === 'dir' ? r.recursive !== false || !p.slice(d.length).includes('/') : !p.slice(d.length).includes('/')));
      assert(want.length > 0, `${file} ${expr}`);
      for (const id of LIVE) if (cl[id].seen.has(file)) for (const w of want) assert(cl[id].seen.has(w), `${id}: ${w} (reachable by import(${expr}) in ${file}) is not in the closure`);
    }
    // and some of those files are reachable by the rule only (an edit of one of them stales the importing areas: the rules are not decoration)
    const rule = new Set(Object.values(cl).flatMap((c) => [...c.edges.values()].flat().filter((e) => e.kind === 'rule' && e.target.includes('/')).map((e) => e.target)));
    const staticReach = new Set(Object.values(cl).flatMap((c) => [...c.edges.values()].flat().filter((e) => e.kind !== 'rule').map((e) => e.target)));
    assert([...rule].some((x) => !staticReach.has(x) && !/area-modules/.test(x)), 'no file is reached by a rule alone');
  });
  check('every file that a recorded headless page load fetched is inside the closure of its area', () => {
    for (const id of LIVE) {
      const f = path.join(root, 'tools/fixtures/closure-loads', `${id}.json`);
      if (NO_FIXTURE_YET.includes(id) && !fs.existsSync(f)) continue;   // pending (see NO_FIXTURE_YET); a fixture that does exist is checked like the others
      assert(fs.existsSync(f), `the recorded load of ${id} is missing (node tools/closure-groundtruth.mjs ${id} --record)`);
      const rec = JSON.parse(fs.readFileSync(f, 'utf8')), seen = closuresOf()[id].seen;
      assert(rec.files.length > 100, `${id}: only ${rec.files.length} recorded files`);
      for (const rel of rec.files) assert(seen.has(rel) || isAllowedServed(rel), `${id}: the page loaded ${rel}, which is in no closure and not in ALLOW_SERVED`);
      assert.equal(rec.area, id);
    }
  });
  return checks;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  let bad = 0; const t0 = Date.now();
  for (const c of realChecks()) {
    try { c.run(); console.log('ok   ' + c.name); } catch (e) { bad++; console.log('FAIL ' + c.name + '\n     ' + String(e.message).split('\n').slice(0, 6).join('\n     ')); }
  }
  const ctx = createRevisionContext(root), r = revisionsOf(root, { ctx });
  for (const row of liveAreas(root, ctx)) console.log(`  ${row.id.padEnd(12)} ${r[row.id].revision}  ${String(r[row.id].files).padStart(4)} files  ${(r[row.id].bytes / 1048576).toFixed(1)} MiB`);
  console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (bad) { console.log(`RESULT: FAIL (${bad})`); process.exit(1); }
  console.log('RESULT: OK');
}
