// tools/north-knock-test.mjs - the KNOCK CENSUS of the North page (M7 knock parity, docs/AREAS.md 8.7 and section 10), the services census of its landmark modules and the Kirochnaya gate-stub
// probe. CPU only, no GPU.  node tools/area.mjs north tools/north-knock-test.mjs [--verbose] [--mutant]
//   1 census: the static modules of the page's MODULES (tools/modules-list.mjs; traffic / people / wildlife / drive are left out) are built in page order with the real core/knock.js; per module the
//     records registered and their kinds are printed; every record owns at least one collider that is on ctx.physics with source.knock = the record, and at least one mesh part (an instance of an
//     InstancedMesh, or an object), except the six explicitly authored ghost bays of the Paradny fountain rims; the knock stats agree with the list
//   2 landmarksNorthFull registers exactly the PIERS bollards and SPANS chains of landmarksNorthFull/fence.js: each pier owns a box collider 2.34 m high, each span a thin `fence` box; a pier hit at
//     40 km/h breaks off and takes the spans next to it (the onKnock of the fence); a span hit by itself topples and leaves a low rest box
//   2b landmarksKirochnaya registers exactly its campus benches (landscape.js BENCHES: 5 placements, 4 drawn - the one at (1258, -1130) lies inside a mapped building and is skipped, as in the source): kind bench, a box collider 2.1 x 0.64 m, 1.1 m high, two mesh parts (iron ends,
//     green slats), none on a carriageway of streets; a bench hit at 25 km/h is knocked and leaves a low rest box
//   3 the strip's furniture modules register in the North too: streets (bollards, chains, lamps, signals ...), props (benches, bins ...), landmarksOktyabrsky (26 records as in the strip: 4 lamps,
//     20 bollards, 2 city lights)
//   4 services census: entrances / monuments / photoSpots per landmark module and in the shared ctx.services.landmarks (the Smolny photo spot is merged there; landmarksNorthFull and
//     landmarksOktyabrsky publish door points; the vestibule's door points and their distance to the G3 door (461.05, -1350.15) are printed; PRUNE_SERVICES of the area is printed)
//   5 the Kirochnaya gate stubs: no vertex of the lmK-asphalt mesh of landmarksKirochnaya lies on a non-campus carriageway of the data (L.roadsNear) nor on the asphalt streets draws (net.cover with
//     the two campus ways nearest to the vertex skipped: the stubs ran to Kirochnaya's centreline before M7); the clearance of the stub ends to the drawn kerb is printed
//   5b BOTH gate stubs (w515895295 west, w515895296 east) by their geometry against the triangles of the streets asphalt (the mesh pt-asphalt): each stub has asphalt (4 m or more long along its axis,
//     a vertex count), no stub vertex lies inside a pt-asphalt triangle, and the nearest stub vertex is 0.05 .. 0.45 m from the drawn asphalt (the stub reaches the kerb line; the margin of M7 was 0.94 / 1.03 m);
//     negative control: the unclipped ends of the two ways (the data points on Kirochnaya's centreline) DO lie inside the road mesh, so the predicate can see a poke
//   6 mutants: the test spawns itself with --mutant (landmarksNorthFull built with a ctx.knock.register that registers nothing) and --mutant-bench (the same for landmarksKirochnaya); each child must be
//     RED in its own check (2 / 2b), so a fence or a bench set that silently stops registering cannot pass. With --mutant only landmarksNorthFull and landmarksKirochnaya are built and only checks 2 and 2b run.
// Exit code 1 when a check fails.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = (p) => pathToFileURL(path.join(root, p)).href;
const verbose = process.argv.includes('--verbose'), MUTANT_FENCE = process.argv.includes('--mutant'), MUTANT_BENCH = process.argv.includes('--mutant-bench'), MUTANT = MUTANT_FENCE || MUTANT_BENCH;
const AREA = process.env.AREA || 'strip';
if (AREA === 'strip') { console.log('north-knock-test: run it as the North: node tools/area.mjs north tools/north-knock-test.mjs'); process.exit(2); }

// ---------------------------------------------------------------- DOM stubs (as tools/check.mjs)
class Ctx2D {
  constructor(c) { this.canvas = c; this.font = '10px sans-serif'; }
  measureText(t) { const m = /(\d+(?:\.\d+)?)px/.exec(this.font); const s = m ? Number(m[1]) : 10; return { width: [...String(t)].length * s * 0.92, actualBoundingBoxAscent: s * 0.8, actualBoundingBoxDescent: s * 0.2 }; }
  createLinearGradient() { return { addColorStop() {} }; } createRadialGradient() { return { addColorStop() {} }; } createConicGradient() { return { addColorStop() {} }; } createPattern() { return {}; }
  getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; } createImageData(w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; }
  putImageData() {} getTransform() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; } isPointInPath() { return false; } getLineDash() { return []; }
}
const ctxProxy = (c) => new Proxy(new Ctx2D(c), { get(t, k) { if (k in t) return t[k]; return () => {}; }, set(t, k, v) { t[k] = v; return true; } });
class FakeCanvas { constructor() { this.width = 300; this.height = 150; this.style = {}; this._ctx = null; } getContext(type) { if (type !== '2d') return null; return this._ctx || (this._ctx = ctxProxy(this)); } toDataURL() { return 'data:,'; } addEventListener() {} removeEventListener() {} }
globalThis.window = globalThis; globalThis.self = globalThis;
globalThis.document = { createElement: (t) => (t === 'canvas' ? new FakeCanvas() : { style: {}, dataset: {}, classList: { add() {}, remove() {} }, addEventListener() {}, appendChild() {}, setAttribute() {} }), createElementNS: (ns, t) => (t === 'canvas' ? new FakeCanvas() : { style: {} }), fonts: { load: async () => [] }, body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {} };
globalThis.Image = class { constructor() { this.width = 1; this.height = 1; } addEventListener() {} };
globalThis.HTMLCanvasElement = FakeCanvas; globalThis.OffscreenCanvas = FakeCanvas;
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 16); globalThis.addEventListener = () => {};
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1; globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });

const THREE = await import('three');
const { createContext } = await import(url('src/core/ctx.js'));
const { createKnock } = await import(url('src/core/knock.js'));
const L = await import(url('src/world/layout.js'));
const { mainModules, DYNAMIC } = await import(url('tools/modules-list.mjs'));
const { PIERS, SPANS } = await import(url('src/world/landmarksNorthFull/fence.js'));
const { CAMPUS_ROADS } = await import(url('src/world/landmarksKirochnaya/groups.js'));
const { BENCHES: BENCH_SPOTS, BENCH_W, BENCH_D, BENCH_H } = await import(url('src/world/landmarksKirochnaya/landscape.js'));
const BENCHES = BENCH_SPOTS.filter(([x, z]) => !L.insideBuilding(x, z, 1.5));           // the placements the module draws: the one at (1258, -1130) lies inside a mapped building and is skipped, as in the source
const { PRUNE_SERVICES } = await import(url('src/world/lib/area-tables.js'));
const { PARADNY_FOUNTAINS, PARADNY_Y } = await import(url('src/world/landmarksTauride/paradny-surface.js'));
// paradny-courts.js draws these rims into its static kit and registers their
// colliders as ghost bays through fence-bays.js. Derive their exact positions
// and lengths from the same mapped rings; other missing visual parts still fail.
const FOUNTAIN_RIMS = PARADNY_FOUNTAINS.flatMap((f) => f.polys.flatMap(({ o }) =>
  Array.from({ length: o.length / 2 }, (_, i) => {
    const j = (i * 2 + 2) % o.length, x = (o[i * 2] + o[j]) / 2, z = (o[i * 2 + 1] + o[j + 1]) / 2;
    return { x, z, w: Math.hypot(o[j] - o[i * 2], o[j + 1] - o[i * 2 + 1]) };
  })));
const isFountainRim = (r) => r.kind === 'fence' && Math.abs(r.y - PARADNY_Y) < 1e-6 && r.anchored === 12 &&
  FOUNTAIN_RIMS.some((b) => Math.hypot(r.x - b.x, r.z - b.z) < 1e-6 && Math.abs(r.w - b.w) < 1e-6);
const missingVisuals = (module, records) => records.filter((r) => !r.parts.some((p) => p.mesh || p.obj) && !(module === 'landmarksTauride' && isFountainRim(r)));

const PAGE = mainModules().filter((m) => !DYNAMIC.includes(m));
const MODULES = MUTANT ? ['landmarksNorthFull', 'landmarksKirochnaya'] : PAGE;
const G3 = [461.05, -1350.15];
let checks = 0, failed = 0;
const check = (name, fn) => { try { fn(); checks++; console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name + ':', e && e.message ? e.message.split('\n')[0] : e); if (verbose && e && e.stack) console.log(e.stack); } };
const hyp = (a, b) => Math.sqrt(a * a + b * b);

// ---------------------------------------------------------------- build
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500); camera.position.set(L.HERO.x, 1.6, L.HERO.z); camera.updateMatrixWorld(true);
const ctx = createContext({ scene, camera, renderer: null, audio: null, quality: { name: 'medium', level: 'medium', pixelRatio: 1, msaa: 4, shadowMap: 2048, shadowSize: 70, petals: 0.6 }, sunDir: new THREE.Vector3(...L.SUN_DIR).normalize() });
ctx.buildList = PAGE.concat(mainModules().filter((m) => DYNAMIC.includes(m)));          // the page's list (the claims of a module count only when it is listed, lib/claims.js)
ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
ctx.drive = { active: false, car: null, fx: { sparks() {} } };
ctx.knock = createKnock(ctx);
const census = {};                                                                      // module -> { n, byKind, noItems, noMesh, records }
const t0 = Date.now();
for (const m of MODULES) {
  const from = ctx.knock.list.length, t1 = Date.now();
  const realRegister = ctx.knock.register;
  if ((MUTANT_FENCE && m === 'landmarksNorthFull') || (MUTANT_BENCH && m === 'landmarksKirochnaya')) ctx.knock.register = () => null;     // the mutants: the fence / the benches register nothing
  try { const mod = await import(url(`src/world/${m}.js`)); await mod.build(ctx); }
  catch (e) { console.log(`module ${m} failed to build: ${e && e.stack}`); process.exit(1); }
  ctx.knock.register = realRegister;
  const mine = ctx.knock.list.slice(from), byKind = {};
  for (const r of mine) byKind[r.kind] = (byKind[r.kind] || 0) + 1;
  census[m] = { n: mine.length, byKind, ms: Date.now() - t1, records: mine, noItems: mine.filter((r) => !r.items.length).length, noMesh: mine.filter((r) => !r.parts.some((p) => p.mesh || p.obj)).length };
  console.log(`${m.padEnd(22)} ${String(mine.length).padStart(5)} records ${JSON.stringify(byKind)} (${Date.now() - t1} ms)`);
}
console.log(`built ${MODULES.length} modules in ${Date.now() - t0} ms; knock stats ${JSON.stringify({ ...ctx.knock.stats, byKind: ctx.knock.stats.byKind })}`);
const idle = (seconds, dt = 1 / 30) => { for (let t = 0; t < seconds - 1e-9; t += dt) ctx.knock.update(dt); };

// ---------------------------------------------------------------- 1 census
if (!MUTANT) check('1 census: every record owns a collider and visual parts or an exact authored fountain ghost bay; the stats agree with the list', () => {
  const owners = new Set(); for (const c of ctx.physics.items) if (c.source && c.source.knock) owners.add(c.source.knock);
  const all = ctx.knock.list;
  assert.equal(ctx.knock.stats.registered, all.length, 'stats.registered = the list');
  const total = Object.values(census).reduce((n, c) => n + c.n, 0); assert.equal(total, all.length, 'the per-module census adds up');
  for (const [m, c] of Object.entries(census)) {
    // streets/barriers.js: a chain span whose thin box a junction fillet shortened away keeps its record without a collider (documented there); nothing else may lack one
    const loose = c.records.filter((r) => !r.items.length && !(m === 'streets' && r.kind === 'chain'));
    assert.equal(loose.length, 0, `${m}: ${loose.length} of ${c.n} records have no collider (${loose.slice(0, 3).map((r) => `${r.kind} at ${r.x.toFixed(1)}, ${r.z.toFixed(1)}`).join('; ')})`);
    if (c.noItems) console.log(`     ${m}: ${c.noItems} chain span(s) without a collider (the fillet rule of streets/barriers.js)`);
    const missing = missingVisuals(m, c.records);
    assert.equal(missing.length, 0, `${m}: ${missing.length} of ${c.n} records have no mesh part (${missing.map((r) => `${r.kind} at ${r.x.toFixed(2)}, ${r.z.toFixed(2)}`).join('; ')})`);
    for (const r of c.records) assert(r.items.every((it) => it.source && it.source.knock === r), `${m}: a ${r.kind} at (${r.x.toFixed(1)}, ${r.z.toFixed(1)}) does not own its collider`);
  }
  assert.equal(owners.size, all.filter((r) => r.items.length).length, 'the records found on ctx.physics.items = the records with colliders');
  const rims = census.landmarksTauride.records.filter(isFountainRim);
  assert.equal(rims.length, FOUNTAIN_RIMS.length, 'all mapped fountain rim ghost bays are registered');
  console.log(`     ${rims.length} exact mapped Paradny fountain rim ghost bays (static visuals in paradny-courts.js)`);
  console.log(`     ${all.length} records on the page: ${JSON.stringify(ctx.knock.stats.byKind)}`);
});

if (!MUTANT) check('1b missing visuals are still rejected for furniture and unrecognised ghost bays', () => {
  const bench = census.landmarksKirochnaya.records[0], rim = census.landmarksTauride.records.find(isFountainRim);
  assert.equal(missingVisuals('landmarksKirochnaya', [{ ...bench, parts: [] }]).length, 1, 'a bench with missing parts is rejected');
  assert.equal(missingVisuals('landmarksTauride', [{ ...rim, parts: [], x: rim.x + 1 }]).length, 1, 'an unrecognised empty bay is rejected');
  assert.equal(missingVisuals('landmarksTauride', [{ ...rim, parts: [], kind: 'bench' }]).length, 1, 'only the authored fence kind is exempt');
  assert.equal(missingVisuals('landmarksKirochnaya', [{ ...rim, parts: [] }]).length, 1, 'only the owning module can use the exception');
});

// ---------------------------------------------------------------- 2 the cannon fence
check(`2 landmarksNorthFull: ${PIERS} knockable piers (bollard, box 2.34 m) + ${SPANS} chain spans (chain, fence box); a hit pier drops its spans, a hit span topples`, () => {
  const c = census.landmarksNorthFull; assert(c, 'landmarksNorthFull was built');
  const piers = c.records.filter((r) => r.kind === 'bollard'), spans = c.records.filter((r) => r.kind === 'chain');
  assert.equal(piers.length, PIERS, `piers ${piers.length}`); assert.equal(spans.length, SPANS, `spans ${spans.length}`); assert.equal(c.n, PIERS + SPANS, `the module registers nothing else (${c.n})`);
  for (const p of piers) { assert.equal(p.items.length, 1); const it = p.items[0]; assert(it.type === 'box' && Math.abs(it.y1 - 2.34) < 1e-6, `pier collider: ${it.type} y1 ${it.y1}`); assert.equal(p.anchored, 30); assert(p.parts.length >= 3, 'granite + bronze + brass parts'); }
  for (const s of spans) { assert.equal(s.items.length, 1); const it = s.items[0]; assert(it.type === 'box' && it.fence === true && Math.abs(it.y1 - 1.8) < 1e-6, `span collider: ${it.type} fence ${it.fence} y1 ${it.y1}`); assert.equal(s.anchored, 0.5); assert.equal(s.parts.length, 1); }
  // the spans hang on the piers: every span centre is 3.55 m (+- the 0.65 m offset) from two piers; every pier but the ends of a side carries one or two spans
  for (const s of spans) { const near = piers.filter((p) => hyp(p.x - s.x, p.z - s.z) < 5.2); assert.equal(near.length, 2, `a span at (${s.x.toFixed(1)}, ${s.z.toFixed(1)}) hangs on ${near.length} piers`); }
  // a pier hit at 40 km/h breaks off and drops its spans
  const pier = piers.find((p) => spans.filter((s) => hyp(p.x - s.x, p.z - s.z) < 5.2).length === 2), mine = spans.filter((s) => hyp(pier.x - s.x, pier.z - s.z) < 5.2);
  const col0 = ctx.physics.items.length;
  ctx.knock.hit(pier.x, pier.z, 40, 1, 0, 'bollard');
  assert.notEqual(pier.state, 'stand', `the pier broke off (${pier.state})`);
  idle(8);
  assert.equal(pier.state, 'rest', `the pier came to rest (${pier.state})`);
  for (const s of mine) assert.notEqual(s.state, 'stand', `the span at (${s.x.toFixed(1)}, ${s.z.toFixed(1)}) fell with its pier (${s.state})`);
  const others = spans.filter((s) => !mine.includes(s)); assert(others.every((s) => s.state === 'stand'), 'the other spans stand');
  assert(pier.items.length === 1 && pier.items[0].y1 - Math.max(0, pier.items[0].y0 + 0.05) <= 0.42 + 1e-6, `a low rest box replaced the pier collider (top ${pier.items[0] && pier.items[0].y1})`);
  // a span hit by itself topples (any moving car), its posts stand
  const span = others[0], posts = piers.filter((p) => hyp(p.x - span.x, p.z - span.z) < 5.2);
  ctx.knock.hit(span.x, span.z, 8, Math.sin(span.rotY), Math.cos(span.rotY), 'chain');
  assert.notEqual(span.state, 'stand', 'the span was knocked');
  idle(6);
  assert.equal(span.state, 'rest', `the span lies (${span.state})`);
  assert(span.items.length === 1 && span.items[0].y1 <= 0.42 + 1e-6, `a low rest box replaced the span collider (top ${span.items[0] && span.items[0].y1})`);
  assert(posts.every((p) => p.state === 'stand'), 'its two piers stand');
  assert.equal(ctx.physics.items.length, col0, 'every knocked collider was replaced by exactly one rest box');
  console.log(`     ${piers.length} piers, ${spans.length} spans; pier (${pier.x.toFixed(1)}, ${pier.z.toFixed(1)}) knocked with ${mine.length} spans; span (${span.x.toFixed(1)}, ${span.z.toFixed(1)}) toppled`);
});

// ---------------------------------------------------------------- 2b the Kirochnaya campus benches
check(`2b landmarksKirochnaya: ${BENCHES.length} knockable campus benches (of ${BENCH_SPOTS.length} placements; bench, box ${BENCH_W} x ${BENCH_D} m, ${BENCH_H} m high), none on a carriageway; a hit bench is knocked and leaves a low rest box`, () => {
  const c = census.landmarksKirochnaya; assert(c, 'landmarksKirochnaya was built');
  const benches = c.records.filter((r) => r.kind === 'bench');
  assert.equal(benches.length, BENCHES.length, `benches ${benches.length}`); assert.equal(c.n, BENCHES.length, `the module registers nothing else (${c.n})`);
  for (const [x, z, rot] of BENCHES) {
    const b = benches.find((r) => hyp(r.x - x, r.z - z) < 0.01); assert(b, `the bench at (${x}, ${z}) is a record`);
    assert(Math.abs(b.rotY - rot) < 1e-6, `bench rotY ${b.rotY} (${rot})`);
    assert.equal(b.items.length, 1); const it = b.items[0];
    assert(it.type === 'box' && Math.abs(it.hw * 2 - BENCH_W) < 1e-6 && Math.abs(it.hd * 2 - BENCH_D) < 1e-6 && Math.abs(it.y1 - BENCH_H) < 1e-6 && it.y0 === 0, `bench collider: ${it.type} ${it.hw * 2} x ${it.hd * 2}, y ${it.y0}..${it.y1}`);
    assert.equal(b.parts.length, 2, 'iron ends + green slats'); assert(b.parts.every((p) => p.mesh && p.mesh.isInstancedMesh), 'instances of the part meshes');
  }
  if (MUTANT) return;
  const net = ctx.services.streets && ctx.services.streets.net; assert(net, 'the streets net');
  for (const b of benches) assert(net.cover(b.x, b.z, {}) < -1, `the bench at (${b.x}, ${b.z}) stands ${(-net.cover(b.x, b.z, {})).toFixed(1)} m off the asphalt`);
  const b = benches.find((q) => hyp(q.x - 1304, q.z + 1136) < 0.01), col0 = ctx.physics.items.length;     // the one with the turned frame (-0.65 rad)
  ctx.knock.hit(b.x, b.z, 25, 1, 0, 'bench');
  assert.notEqual(b.state, 'stand', `the bench was knocked (${b.state})`);
  idle(8);
  assert.equal(b.state, 'rest', `the bench came to rest (${b.state})`);
  assert(b.items.length === 1 && b.items[0].y1 <= 0.5, `a low rest box replaced the bench collider (top ${b.items[0] && b.items[0].y1})`);
  assert(benches.filter((q) => q !== b).every((q) => q.state === 'stand'), 'the other benches stand');
  assert.equal(ctx.physics.items.length, col0, 'the knocked collider was replaced by exactly one rest box');
  console.log(`     ${benches.length} benches ${benches.map((q) => `(${q.x}, ${q.z})`).join(' ')}; the bench (${b.x}, ${b.z}) knocked at 25 km/h`);
});
if (MUTANT) { console.log(failed ? 'MUTANT RED (as it must be)' : 'MUTANT GREEN (the census did not catch the missing registrations)'); process.exit(failed ? 1 : 0); }

// ---------------------------------------------------------------- 2b the Tauride Garden (T6)
check('2b landmarksTauride (T6): the furniture of the garden is knockable like the one of the strip: 132 benches + 167 bins + the lanterns on the lit ways; the fence, its piers and the lanterns on the gate piers are not', () => {
  const c = census.landmarksTauride; assert(c, 'landmarksTauride was built');
  const S = ctx.services.landmarksTauride, plan = S.furniture.plan, lamps = plan.lanterns.length;
  assert.equal(c.byKind.bench, 132, `benches ${c.byKind.bench}`); assert.equal(c.byKind.bin, 167, `bins ${c.byKind.bin}`); assert.equal(c.byKind.lamp, lamps, `lanterns ${c.byKind.lamp} of ${lamps}`);
  const nFence = c.byKind.fence || 0;      // water is reachable (docs/AREAS.md 13.7): the tall fence panels are breakable BAYS (kind 'fence', lib/fence-bays.js)
  assert(nFence > 800, `the tall panels are fence records (${nFence})`);
  assert.equal(c.n, 132 + 167 + lamps + nFence, `the module registers nothing else (${JSON.stringify(c.byKind)})`);
  for (const r of c.records) {
    if (r.kind === 'fence') { assert.equal(r.items.length, 1, 'a fence bay owns one collider'); continue; }
    assert.equal(r.items.length, 1, `a ${r.kind} owns one collider`); const it = r.items[0];
    if (r.kind === 'bench') { assert(it.type === 'box' && Math.abs(it.y1 - r.y - 0.9) < 1e-6, `bench collider ${it.type} y1 ${it.y1} (y ${r.y})`); assert.equal(r.parts.length, 1); }
    if (r.kind === 'bin') { assert(it.type === 'cyl' && Math.abs(it.y1 - r.y - 0.78) < 1e-6, `bin collider ${it.type}`); }
    if (r.kind === 'lamp') { assert(it.type === 'cyl' && Math.abs(it.y1 - r.y - 4.2) < 1e-6, `lantern collider ${it.type}`); assert.equal(r.parts.length, 3, 'body + glow + light pool'); assert.equal(r.anchored, 18); }
    assert(it.y0 <= Math.min(0, r.y) - 0.5 + 1e-6, 'the collider reaches below the ground (a piece on a hill still blocks and is an obstacle of the nav)');
  }
  // the fence: the tall panels are bay records (a car breaks them), the low panels, the piers and the pitch fence stay plain colliders with fence = true on the panels
  assert.equal(S.fence.items.panels.length > 800 && S.fence.items.panels.every((it) => it.fence === true) && (() => { const own = S.fence.items.panels.filter((it) => it.source && it.source.knock).length; return own > 700 && own <= nFence; })(), true, 'the fence panels are wall colliders, the tall ones owned by a bay record (the rest of the fence records: the bridge rails, the monument rim)');
  // a bench hit at 40 km/h is knocked and takes its seats: the record leaves "stand" and its collider goes
  const b = c.records.find((r) => r.kind === 'bench'); ctx.knock.hit(b.x, b.z, 40, 1, 0, 'bench'); idle(1);
  assert.notEqual(b.state, 'stand', `the bench was knocked (${b.state})`);
  console.log(`     ${c.n} records ${JSON.stringify(c.byKind)}; the fence (${S.fence.colliders} colliders, ${S.fence.instances.panels} panels, ${S.fence.instances.piers} piers): ${nFence} tall panels are breakable bays, the piers are not`);
});

// ---------------------------------------------------------------- 3 the strip's furniture in the North
check('3 the strip\'s furniture modules register in the North: streets, props, landmarksOktyabrsky (4 lamps + 2 city lights + the bollards its kerb rule keeps)', () => {
  assert(census.streets && census.streets.n > 1000, `streets ${census.streets && census.streets.n}`);
  for (const k of ['bollard', 'chain', 'lamp', 'signal']) assert(census.streets.byKind[k] > 0, `streets registers ${k}s`);
  assert(census.props && census.props.n > 100 && census.props.byKind.bench > 0, `props ${census.props && JSON.stringify(census.props.byKind)}`);
  // the bollards of the plaza are tested against the asphalt of the page's streets (plaza.js ok()): 20 in the strip, 17 in the North since T1 moved its streets (the M5 figure of docs/AREAS.md 8.7 is older)
  const ok = census.landmarksOktyabrsky.byKind; assert(ok.lamp === 4 && ok.citylight === 2 && ok.bollard >= 15 && ok.bollard <= 20, `landmarksOktyabrsky ${JSON.stringify(ok)}`);
  for (const m of ['landmarksSmolny', 'landmarksSuvorov', 'landmarksD']) if (census[m]) console.log(`     ${m}: ${census[m].n} records ${JSON.stringify(census[m].byKind)}`);
  console.log(`     landmarksKirochnaya: ${census.landmarksKirochnaya.n} records ${JSON.stringify(census.landmarksKirochnaya.byKind)} (the campus benches, check 2b)`);
});

// ---------------------------------------------------------------- 4 the services census
check('4 services: entrances / monuments / photoSpots per landmark module; the Smolny photo spot is in ctx.services.landmarks; landmarksNorthFull and landmarksOktyabrsky publish door points', () => {
  const S = ctx.services, lm = S.landmarks || {};
  const rows = [];
  for (const m of MODULES.filter((k) => k.startsWith('landmarks'))) { const s = S[m] || {}, mo = Array.isArray(s.monuments) ? s.monuments : (s.monuments && s.monuments.list) || [], ph = Array.isArray(s.photoSpots) ? s.photoSpots : (s.monuments && s.monuments.photoSpots) || []; rows.push(`${m}: entrances ${(s.entrances || []).length}, monuments ${mo.length}, photoSpots ${ph.length}`); }
  rows.push(`landmarks (shared): monuments ${(lm.monuments || []).length}, photoSpots ${(lm.photoSpots || []).length}: ${(lm.photoSpots || []).map((p) => p.name).join(' | ')}`);
  rows.push(`city: entrances ${((S.city || {}).entrances || []).length}; PRUNE_SERVICES of the area: ${JSON.stringify(PRUNE_SERVICES)}`);
  for (const r of rows) console.log('     ' + r);
  assert((lm.photoSpots || []).some((p) => p.name === 'Смольный собор' && p.x === 2335 && p.z === -1833), 'the Smolny photo spot is merged into ctx.services.landmarks.photoSpots');
  const nf = S.landmarksNorthFull; assert(nf && nf.entrances.length > 0, 'landmarksNorthFull publishes door points');
  const byB = {}; for (const e of nf.entrances) byB[e.bldg] = (byB[e.bldg] || 0) + 1;
  console.log(`     landmarksNorthFull door points per building: ${JSON.stringify(byB)}`);
  for (const e of nf.entrances) assert(Number.isFinite(e.x) && Number.isFinite(e.z) && Number.isFinite(e.rotY) && e.bldg, 'a door point has x, z, rotY, bldg');
  const claimedNF = new Set(nf.groups.flatMap((k) => L.groupMembers(k).map((b) => b.id)));
  for (const id of claimedNF) assert(byB[id] > 0, `the claimed building ${id} has a door point`);
  const vest = nf.entrances.filter((e) => e.bldg === 'w22999175'); assert(vest.length > 0, 'the vestibule has door points');
  const dG3 = Math.min(...vest.map((e) => hyp(e.x - G3[0], e.z - G3[1])));
  console.log(`     vestibule w22999175: ${vest.length} door point(s) ${vest.map((e) => `(${e.x.toFixed(1)}, ${e.z.toFixed(1)}, ${e.kind})`).join(' ')}; nearest to the G3 door (${G3}) ${dG3.toFixed(1)} m`);
  const ok = S.landmarksOktyabrsky; assert(ok && ok.entrances.length > 0, 'landmarksOktyabrsky publishes door points in the North');
  console.log(`     landmarksOktyabrsky: ${ok.entrances.length} door points of ${[...new Set(ok.entrances.map((e) => e.bldg))].join(', ')}`);
  for (const m of ['landmarksSmolny', 'landmarksSuvorov', 'landmarksKirochnaya']) assert(S[m] && Array.isArray(S[m].photoSpots) && Array.isArray(S[m].monuments), `${m} publishes monuments / photoSpots lists`);
});

// ---------------------------------------------------------------- 5 the Kirochnaya gate stubs
check('5 Kirochnaya: no vertex of the campus asphalt lies on a non-campus carriageway (data) nor on the asphalt of streets (net.cover)', () => {
  const CAMPUS = new Set(CAMPUS_ROADS), ids = new Set(CAMPUS_ROADS.map((r) => r.id)), net = ctx.services.streets && ctx.services.streets.net; assert(net, 'the streets net');
  const wayOf = new Map(); for (const w of net.ways) if (ids.has(w.id)) wayOf.set(w.id, w);
  let verts = 0, onData = 0, onStreets = 0, inFillet = 0, worst = -1e9, worstAt = null; const ends = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || o.material.name !== 'lmK-asphalt') return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i); verts++;
      if (L.roadsNear(x, z, 0, { drivable: true }).some((h) => !CAMPUS.has(h.road))) { onData++; if (verbose) console.log('     on a data carriageway:', x.toFixed(2), z.toFixed(2)); }
      const near = L.roadsNear(x, z, 6, { drivable: true }).filter((h) => ids.has(h.road.id)).map((h) => wayOf.get(h.road.id)).filter(Boolean);
      // the carriageway proper (the lanes of the ways, half width incl. parking pockets); the junction FILLETS of the stub's own mouth into Kirochnaya are reported apart: a driveway meets its mouth there
      const cov = net.cover(x, z, { skip: near[0], skip2: near[1], noFillets: true }), covF = net.cover(x, z, { skip: near[0], skip2: near[1] });
      if (cov > 0) { onStreets++; if (verbose) console.log('     on the streets asphalt:', x.toFixed(2), z.toFixed(2), cov.toFixed(2)); }
      else if (covF > 0) { inFillet++; if (verbose) console.log('     in a junction fillet of the mouth:', x.toFixed(2), z.toFixed(2)); }
      if (z < -1236 && cov > worst) { worst = cov; worstAt = [x, z]; }
      if (z < -1236) ends.push([x, z, cov]);
    }
  });
  assert(verts > 0, 'the campus asphalt mesh exists');
  assert.equal(onData, 0, `${onData} of ${verts} asphalt vertices lie on a non-campus carriageway of the data`);
  assert.equal(onStreets, 0, `${onStreets} of ${verts} asphalt vertices lie on the asphalt streets draws`);
  const stubs = CAMPUS_ROADS.filter((r) => r.pts.some((v, i) => i % 2 && v < -1240)).map((r) => r.id);
  console.log(`     ${verts} vertices, none on a carriageway (${inFillet} inside a junction fillet of a stub's own mouth); the stubs ${stubs.join(', ')}: the vertex nearest to Kirochnaya's asphalt is ${(-worst).toFixed(2)} m off its edge at (${worstAt && worstAt.map((v) => v.toFixed(1)).join(', ')}); ${ends.length} vertices south of z -1236`);
});

// ---------------------------------------------------------------- 5b both gate stubs by their geometry
check('5b Kirochnaya: both gate stubs (w515895295 west, w515895296 east) have asphalt, none of it inside a triangle of the streets asphalt, and end 0.05 .. 0.45 m from it', () => {
  const tris = [], stub = [];
  scene.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  scene.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const nm = o.material.name; if (nm !== 'pt-asphalt' && nm !== 'lmK-asphalt') return;
    const p = o.geometry.attributes.position, idx = o.geometry.index, get = (i) => { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); return [v.x, v.z]; };
    if (nm === 'lmK-asphalt') { for (let i = 0; i < p.count; i++) stub.push(get(i)); return; }
    const n = idx ? idx.count : p.count;
    for (let i = 0; i < n; i += 3) { const t = idx ? [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)] : [i, i + 1, i + 2]; tris.push(t.map(get)); }
  });
  assert(tris.length > 0 && stub.length > 0, `meshes: ${tris.length} pt-asphalt triangles, ${stub.length} stub vertices`);
  const sideOf = (px, pz, a, b) => (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (pz - b[1]);
  const inTri = (px, pz, T) => { const d1 = sideOf(px, pz, T[0], T[1]), d2 = sideOf(px, pz, T[1], T[2]), d3 = sideOf(px, pz, T[2], T[0]); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  const segDist = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
  const near = (px, pz) => tris.filter((T) => T.some((q) => Math.hypot(q[0] - px, q[1] - pz) < 30));
  /** [inside, gap]: 1 when (px, pz) lies strictly inside a triangle (a point on a vertex or an edge is outside), gap = distance to the nearest triangle edge of the triangles it is outside of */
  const probe = (px, pz) => { let inside = 0, gap = 1e9; for (const T of near(px, pz)) { if (inTri(px, pz, T) && !T.some((q) => Math.hypot(q[0] - px, q[1] - pz) < 1e-6)) inside = 1; else for (let k = 0; k < 3; k++) gap = Math.min(gap, segDist(px, pz, T[k], T[(k + 1) % 3])); } return [inside, gap]; };
  const rows = [];
  for (const [id, side] of [['w515895295', 'west'], ['w515895296', 'east']]) {
    const r = CAMPUS_ROADS.find((q) => q.id === id); assert(r, `${id} is a campus way`);
    const gx = r.pts[0], gz = r.pts[1];                                                  // the outer end of the stub: on Kirochnaya's centreline
    const mine = stub.filter(([x, z]) => Math.abs(x - gx) < 3.2 && z < -1236);
    assert(mine.length >= 8, `${side} stub (${id}): ${mine.length} asphalt vertices`);
    const zs = mine.map((q) => q[1]), length = Math.max(...zs) - Math.min(...zs);
    assert(length >= 4, `${side} stub (${id}): asphalt only ${length.toFixed(2)} m long along its axis`);
    let inside = 0, gap = 1e9;
    for (const [x, z] of mine) { const [i, g] = probe(x, z); inside += i; gap = Math.min(gap, g); }
    assert.equal(inside, 0, `${side} stub (${id}): ${inside} of ${mine.length} asphalt vertices lie inside the streets asphalt`);
    assert(gap >= 0.05 && gap <= 0.45, `${side} stub (${id}): the asphalt ends ${gap.toFixed(3)} m from the streets asphalt (0.05 .. 0.45)`);
    // negative control: the unclipped ends (the two corners of the stub at the data point on Kirochnaya's centreline) lie inside the road mesh
    const nx = (r.pts[3] - gz), nz = -(r.pts[2] - gx), nl = Math.hypot(nx, nz), w2 = (r.w || 4) / 2;
    const poked = [-1, 1].filter((s) => probe(gx + nx / nl * s * w2, gz + nz / nl * s * w2)[0] === 1).length;
    assert.equal(poked, 2, `${side} stub (${id}): the predicate sees the unclipped corners inside the road mesh (${poked} of 2)`);
    rows.push(`${side} ${id}: ${mine.length} vertices, ${length.toFixed(2)} m long, nearest ${gap.toFixed(3)} m from the streets asphalt, 0 inside; unclipped corners inside: ${poked}/2`);
  }
  for (const r of rows) console.log('     ' + r);
});

// ---------------------------------------------------------------- 6 the mutants
for (const [flag, label, red] of [['--mutant', 'the fence that registers nothing', /^FAIL 2 /m], ['--mutant-bench', 'the campus benches that register nothing', /^FAIL 2b /m]]) check(`6 mutant: ${label} is caught (the child run with ${flag} exits 1, red in its own check)`, () => {
  const r = spawnSync(process.execPath, [path.join(root, 'tools/area.mjs'), AREA, fileURLToPath(import.meta.url), flag], { encoding: 'utf8', env: { ...process.env }, maxBuffer: 64 << 20 });
  const out = (r.stdout || '') + (r.stderr || '');
  assert.equal(r.status, 1, `the mutant child exited ${r.status}: ${out.split('\n').filter((l) => /FAIL|MUTANT/.test(l)).slice(0, 3).join(' | ')}`);
  assert(/MUTANT RED/.test(out), 'the child reported the red census');
  assert(red.test(out), `the child is red in the expected check ${red}`);
  assert.equal(out.split('\n').filter((l) => /^FAIL/.test(l)).length, 1, 'and in that check only');
  console.log('     ' + out.split('\n').filter((l) => /^FAIL/.test(l)).slice(0, 2).join(' | '));
});

console.log(`\n${checks} checks passed, ${failed} failed`);
console.log(failed ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(failed ? 1 : 0);
