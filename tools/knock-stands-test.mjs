// Headless test of the KNOCKABLE stands (props/stands.js + props/west.js, package D of the knock plan): press kiosks, excursion kiosks, ice / souvenir / boat cabins, ticket booths, hot-dog and
// souvenir carts and the chalk A-frames of the verandas. No GPU.  npm run knock-stands
// Builds the real chain environment ... props twice (with the real core/knock.js and without ctx.knock) and checks:
//   1 census: kiosk 17-18, booth 4, cart 16-17 (10 curated west carts, 7 of them with a fascia, + 5-7 ice carts of the shared random stream of props/stands.js: 7 until b5ebcc1 re-dealt the stream, 6 since; M7 polish, docs/AREAS.md 11.3), aframe 34-35 (the plan said kiosk 18 / aframe 35: the count follows the placement); no loose instance; every record owns its collider and carries its fascia / poster / chalk board as standalone {obj} parts
//   2 no ghost fascia: the merged world-space panels of the build WITHOUT knock = the merged panels WITH knock + the quads that became standalone objects (a thrown stand leaves nothing in the air)
//   3 without ctx.knock the module builds what it always built: the same service lists (props-probe svc counts), no knock mesh, no standalone panel, the same colliders
//   4 the attached panels sit on their stand (within 3.5 m, in front of the facade) and keep their pose relative to it through a knock (rigid): kiosk, booth, hot-dog cart, A-frame
//   5 the real coupe at 30 km/h against a real press kiosk: it slides (a free, heavy body), the car keeps rolling, the fascia travels with it, the rest box is low
//   6 an A-frame (6 kg) flies on a nudge, its chalk board with it; the rest collider is a drive-over box
// usage: node tools/knock-stands-test.mjs [--verbose];  another area: node tools/area.mjs north tools/knock-stands-test.mjs (the modules of ITS page up to props, M7: the structural checks run, the strip's counts are printed, not asserted)
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = (p) => pathToFileURL(path.join(root, p)).href;
const verbose = process.argv.includes('--verbose');

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
const { createHandling } = await import(url('src/world/drive/handling.js'));
const { SPEC } = await import(url('src/world/drive/model.js'));
const { MASS, tuningFor } = await import(url('src/world/drive/cars/tuning.js'));
const L = await import(url('src/world/layout.js'));

// the module order of main.js up to props (the placement of the stands depends on what the earlier modules reserved); another area (node tools/area.mjs north tools/knock-stands-test.mjs, M7):
// the modules of ITS page up to props (tools/modules-list.mjs), so the North's landmark modules (landmarksNorthFull, Smolny, Suvorov, Kirochnaya, Tauride) are built and claim their buildings;
// the strip-only counts of check 1 (booths of the west, 17 carts ...) are asserted in the strip only
const STRIP = (process.env.AREA || 'strip') === 'strip';
const PAGE = STRIP ? null : (await import('./modules-list.mjs')).mainModules();
const MODULES = STRIP ? ['environment', 'landmarksNorth', 'streets', 'city', 'rail', 'landmarksA', 'landmarksB', 'landmarksC', 'landmarksD', 'landmarksE', 'landmarksF', 'landmarksG', 'landmarksH', 'landmarksI', 'landmarksJ',
  'landmarksBelinsky', 'landmarksK', 'landmarksCastle', 'landmarksOktyabrsky', 'bridges', 'metro', 'props']
  : PAGE.slice(0, PAGE.indexOf('props') + 1);
const hyp = (a, b) => Math.sqrt(a * a + b * b);
let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('PASS', name); };

/** a fresh context with the chain up to props built into it; knock = false builds without ctx.knock */
async function build(knock) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500); camera.position.set(L.HERO.x, 1.6, L.HERO.z); camera.updateMatrixWorld(true);
  const ctx = createContext({ scene, camera, renderer: null, audio: null, quality: { name: 'medium', level: 'medium', pixelRatio: 1, msaa: 4, shadowMap: 2048, shadowSize: 70, petals: 0.6 }, sunDir: new THREE.Vector3(...L.SUN_DIR).normalize() });
  ctx.buildList = MODULES.slice();
  ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
  ctx.drive = { active: false, car: null, fx: { sparks() {} } };
  if (knock) ctx.knock = createKnock(ctx);
  for (const m of MODULES) {
    const mod = await import(url(`src/world/${m}.js`));
    if (m === 'props') { ctx.__from = ctx.knock ? ctx.knock.list.length : 0; ctx.__col0 = ctx.physics.items.length; }                  // the records of the props module only (landmarksK's Saviour stalls are other packages)
    try { await mod.build(ctx); } catch (e) { console.log(`module ${m} failed to build: ${e && e.stack}`); process.exit(1); }
  }
  ctx.__cols = ctx.physics.items.length - ctx.__col0;
  if (ctx.knock) ctx.__mine = ctx.knock.list.slice(ctx.__from);
  return ctx;
}
/** the vertices of every merged panel mesh ('pr-panels') of a build */
const panelVerts = (ctx) => { let n = 0; ctx.scene.traverse((o) => { if (o.isMesh && o.name === 'pr-panels') n += o.geometry.attributes.position.count; }); return n; };
const objsOf = (r) => r.parts.filter((p) => p.obj);
const matOf = (p) => new THREE.Vector3().setFromMatrixPosition(p.obj.matrix);
const posOf = (p) => { const m = new THREE.Matrix4(); p.mesh.getMatrixAt(p.index, m); return new THREE.Vector3().setFromMatrixPosition(m); };
/** run the knock update (and the car) for `seconds` */
const idle = (ctx, seconds, dt = 1 / 30) => { for (let t = 0; t < seconds - 1e-9; t += dt) ctx.knock.update(dt); };

const t0 = Date.now();
const K = await build(true);
console.log(`built the chain with ctx.knock in ${Date.now() - t0} ms`);
const recs = (kind) => K.__mine.filter((r) => r.kind === kind);
const kiosks = recs('kiosk'), booths = recs('booth'), aframes = recs('aframe'), carts = recs('cart');
const cartsFascia = carts.filter((r) => objsOf(r).length), kiosksOf = (n) => kiosks.filter((r) => objsOf(r).length === n);
if (verbose) console.log('by kind', JSON.stringify(K.knock.stats.byKind), 'objs per kiosk', kiosks.map((r) => objsOf(r).length).join(','), 'stands', JSON.stringify(K.services.props.stats.stands), 'west', JSON.stringify(K.services.props.stats.west));

check('1 census: kiosk 17-18, booth 4, cart 16-17 (10 curated + 5-7 ice carts; 7 with a fascia), aframe 34-35 = every stand the placement made; each owns its collider and its fascia / poster / chalk board as standalone parts', () => {
  // every placed stand is a record (no instance without a collider within 1 m), the counts follow the placement of the earlier modules (kiosk 17 or 18 and aframe 34 or 35 with the main.js order)
  const svc = K.services.props, st = svc.stats, KIOSK = /^(press|excKiosk|cabin)/, CART = /^(cart|iceCart)/;
  const placed = (re) => svc.kiosks.filter((q) => re.test(q.kind)).length;
  assert.equal(kiosks.length, placed(KIOSK), `kiosks ${kiosks.length} = placed ${placed(KIOSK)}`); if (STRIP) assert(kiosks.length >= 17 && kiosks.length <= 18, `kiosks ${kiosks.length}`);
  assert.equal(booths.length, st.west.booths, `booths ${booths.length}`); if (STRIP) assert.equal(booths.length, 4);
  assert.equal(carts.length, placed(CART), `carts ${carts.length} = placed ${placed(CART)}`); if (STRIP) {
    // the curated carts of props/west.js SITES (cartRed x 2 of 3: the third site is missed since before the placement was re-dealt, cartHot x 3, cartSouv x 4, iceCartHood x 1) are fixed: 10, 7 of them with a fascia (hot-dog + souvenir).
    // The ice carts (iceCart0 / 1 / 2) are placed by props/stands.js out of the SHARED prop random stream R(): `want` 3 + 2 + 2 = 7, and the count follows what that stream deals (17 carts in all until the strip data grew by the
    // SG band in b5ebcc1 and re-dealt the stream: 6 ice carts, 16 carts since; docs/AREAS.md 11.3). The old exact `carts === 17` was a snapshot of that stream, red on every tree since b5ebcc1, not a missing cart.
    const ice = svc.kiosks.filter((q) => /^iceCart[012]$/.test(q.kind)).length;
    assert.equal(placed(CART) - ice, 10, `curated carts ${placed(CART) - ice}`); assert(ice >= 5 && ice <= 7, `ice carts ${ice} (want 7, the stream deals 5-7)`); assert(carts.length >= 16 && carts.length <= 17, `carts ${carts.length}`);
    assert.equal(cartsFascia.length, 7, `carts with a fascia ${cartsFascia.length}`);
  }
  assert.equal(aframes.length, st.stands.aframes, `aframes ${aframes.length}`); if (STRIP) assert(aframes.length >= 34 && aframes.length <= 35);
  if (!STRIP) console.log(`     ${process.env.AREA}: kiosks ${kiosks.length}, booths ${booths.length}, carts ${carts.length} (${cartsFascia.length} with a fascia), aframes ${aframes.length} (the strip's counts are not expected here)`);
  for (const k of ['pressKiosk', 'pressKiosk2', 'excKiosk', 'cabinIce', 'cabinSouv', 'cabinBoats', 'ticketBooth', 'cartHot0', 'cartHot1', 'cartSouv', 'aFrameR', 'aFrameK']) assert(!(st.knockLoose || {})[k], `no loose ${k} (an instance whose collider was not found)`);
  for (const r of [...kiosks, ...booths, ...carts, ...aframes]) {
    assert(r.state === 'stand' && r.items.length === 1 && r.items[0].source && r.items[0].source.knock === r, `${r.kind} at ${r.x.toFixed(1)}, ${r.z.toFixed(1)} owns its collider`);
    assert.equal(r.anchored, 0, 'a stand is free (heavy, but not bolted down)');
  }
  for (const r of [...kiosks, ...booths, ...cartsFascia, ...aframes]) assert(objsOf(r).length >= 1, `${r.kind} at ${r.x.toFixed(1)}, ${r.z.toFixed(1)} carries a panel`);
  for (const r of aframes) assert.equal(objsOf(r).length, 1, 'an A-frame carries its chalk board');
  for (const r of booths) assert.equal(objsOf(r).length, 1, 'a booth carries its sign');
  // press kiosks and excursion kiosks: fascia + poster (2); cabins: one fascia (1)
  if (STRIP) assert(kiosksOf(2).length >= 12 && kiosksOf(1).length >= 1, `kiosks with 2 panels ${kiosksOf(2).length}, with 1 ${kiosksOf(1).length}`);
  assert.equal(kiosksOf(2).length + kiosksOf(1).length, kiosks.length, 'every kiosk carries 1 or 2 panels');
  const masses = new Set(kiosks.map((r) => r.mass)); assert([...masses].every((m) => m >= 500 && m <= 700), `kiosk masses ${[...masses]}`);
});

check('2 no ghost fascia: merged panels without knock = merged panels with knock + the quads that became standalone objects', () => {
  const mine = [...kiosks, ...booths, ...carts, ...aframes].reduce((n, r) => n + objsOf(r).length, 0);
  let all = 0; K.scene.traverse((o) => { if (o.name === 'pr-panel-obj') all++; });          // (the city-light posters of ads.js are standalone panels too)
  K.__objs = all; K.__mineObjs = mine;
  assert(mine >= (STRIP ? 40 : 1) && all >= mine, `${mine} standalone panels on the stands, ${all} in all`);
  K.__verts = panelVerts(K);
});

const N = await build(false);

check('2b ... (the build without knock keeps every quad merged)', () => {
  const with_ = K.__verts, without = panelVerts(N);
  assert.equal(without, with_ + 4 * K.__objs, `merged vertices without knock ${without} = with knock ${with_} + 4 x ${K.__objs}`);
  console.log(`     merged panel vertices: ${without} without knock, ${with_} with, ${K.__mineObjs} standalone panels on the stands (${K.__objs} in all)`);
});

check('3 without ctx.knock: same service lists and colliders, no knock mesh, no standalone panel in the dynamic root', () => {
  const a = K.services.props, b = N.services.props;
  for (const k of ['benches', 'bins', 'kiosks', 'terraces', 'racks', 'pillars', 'boxes', 'planters', 'urns', 'clocks', 'stalls']) assert.equal(a[k].length, b[k].length, `svc.${k} ${a[k].length} vs ${b[k].length}`);
  assert.deepEqual(a.kiosks.map((q) => [q.kind, Math.round(q.x * 10), Math.round(q.z * 10)]), b.kiosks.map((q) => [q.kind, Math.round(q.x * 10), Math.round(q.z * 10)]), 'the same kiosks at the same places');
  assert.equal(K.__cols, N.__cols, `the props module adds the same number of colliders (${K.__cols} vs ${N.__cols})`);
  let objs = 0, knockMeshes = 0; N.scene.traverse((o) => { if (o.name === 'pr-panel-obj') objs++; if (o.userData && o.userData.knock) knockMeshes++; });
  assert.equal(objs, 0); assert.equal(knockMeshes, 0); assert.equal(N.knock, undefined);
});

check('4 the attached panels sit on their stand and keep their pose through a knock (rigid): kiosk with 2 panels, booth, hot-dog cart, A-frame', () => {
  const pick = [kiosksOf(2)[0], booths[0], cartsFascia[0], aframes[0]].filter(Boolean);          // (another area may have no booth / cart with a fascia)
  assert(pick.length >= (STRIP ? 4 : 1), `${pick.length} kinds to knock`);
  for (const r of pick) {
    const ps = objsOf(r), body = r.parts.find((p) => p.mesh);
    const before = ps.map((p) => matOf(p)), base0 = posOf(body);
    for (const q of before) assert(hyp(q.x - r.x, q.z - r.z) < 1.6 && q.y - r.y > 0.2 && q.y - r.y < 3.3, `${r.kind}: the panel is at the stand (${q.x.toFixed(1)}, ${q.y.toFixed(1)}, ${q.z.toFixed(1)} vs ${r.x.toFixed(1)}, ${r.z.toFixed(1)})`);
    const d0 = ps.map((p, i) => matOf(p).distanceTo(base0.clone().add(new THREE.Vector3(0, 0, 0)))), orient0 = ps.map((p) => p.obj.matrix.clone());
    K.knock.hit(r.x, r.z, 25, 0.8, 0.6, r.kind);
    assert.equal(r.state, 'fly', `${r.kind} knocked`); assert(r.items.length === 0, 'the collider left');
    idle(K, 8);
    assert.equal(r.state, 'rest', `${r.kind} at rest`);
    const base1 = posOf(body);
    assert(base1.distanceTo(base0) > 0.2, `${r.kind}: the stand moved ${base1.distanceTo(base0).toFixed(2)} m`);
    ps.forEach((p, i) => {
      const q = matOf(p); assert(!p.obj.matrix.equals(orient0[i]), `${r.kind}: panel ${i} moved`);
      // rigid: the distance between the panel and the stand's body origin is the one it had at rest (the body origin is the foot, the pivot rotation keeps lengths)
      const dist1 = q.distanceTo(base1);
      assert(Math.abs(dist1 - d0[i]) < 0.35, `${r.kind}: panel ${i} keeps its distance to the stand (${dist1.toFixed(2)} vs ${d0[i].toFixed(2)})`);
      assert(hyp(q.x - base1.x, q.z - base1.z) < 3.3 && q.y < 3.5, `${r.kind}: the panel is still at the stand`);
    });
    assert(r.items.length === 1 && r.items[0].y1 - Math.max(0, r.items[0].y0 + 0.05) <= 0.42 + 1e-6, `${r.kind}: a low rest box replaced the collider (top ${r.items[0].y1})`);
  }
});

check('5 the real coupe at 30 km/h against a real press kiosk: the kiosk slides (free, heavy), the car keeps rolling, the fascia travels with it', () => {
  // (an area whose props place no press kiosk - Vasilyevsky-Okrug 7 - uses its heaviest standing stand that carries a fascia: a hot-dog / souvenir cart; the contact physics under test is the same)
  const r = kiosks.filter((q) => q.state === 'stand').sort((a, b) => b.mass - a.mass).find((q) => objsOf(q).length === 2) || (kiosks.length ? null : carts.filter((q) => q.state === 'stand' && objsOf(q).length >= 1).sort((a, b) => b.mass - a.mass)[0]);
  // (an area whose props place neither a press kiosk nor a cart with a fascia - Gavan, Morskoy, Dekabristov Island place A-frames only - has nothing heavy to drive into: the contact check is skipped there, with a note; the strip and Vasilyevsky keep it)
  if (!r && !STRIP && !kiosks.length && !carts.length) { console.log(`     check 5 skipped: ${process.env.AREA} places no kiosk and no cart (A-frames only)`); return; }
  assert(r, 'a standing press kiosk');
  // approach along the kiosk's facing: the kiosk front looks away from the stand origin along (sin rot, cos rot)
  const front = [Math.sin(r.rotY), Math.cos(r.rotY)];
  const ctx = K, car = createHandling(ctx, tuningFor('coupe', { ...SPEC, mass: MASS.coupe }));
  const start = (d) => [r.x + front[0] * d, r.z + front[1] * d];
  const [sx, sz] = start(7), heading = Math.atan2(-front[0], -front[1]);
  car.reset(sx, sz, heading);
  ctx.drive = { active: true, car, fx: { sparks() {} } };
  const body = r.parts.find((p) => p.mesh), p0 = posOf(body), fa = objsOf(r)[0], f0 = matOf(fa);
  const v = 30 / 3.6; car.vx = -front[0] * v; car.vz = -front[1] * v;
  const input = { thr: 0, brk: 0, steer: 0, hand: false, nitro: false };
  let hits = 0, vAfter = 0;
  for (let t = 0; t < 1.5; t += 1 / 60) { car.step(1 / 60, input); hits += car.events.filter((e) => e.type === 'hit' || e.v > 0).length; ctx.knock.update(1 / 60); if (r.state !== 'stand' && !vAfter) vAfter = hyp(car.vx, car.vz) * 3.6; }
  assert.notEqual(r.state, 'stand', `the kiosk (${r.mass} kg) is knocked by the car at 30 km/h (car ${hyp(car.vx, car.vz) * 3.6 | 0} km/h)`);
  assert(vAfter > 8, `the car keeps rolling after the contact (${vAfter.toFixed(1)} km/h)`);
  idle(ctx, 8);
  assert.equal(r.state, 'rest');
  assert(posOf(body).distanceTo(p0) > 0.3, `the kiosk slid ${posOf(body).distanceTo(p0).toFixed(2)} m`);
  assert(matOf(fa).distanceTo(f0) > 0.3, 'its fascia went with it');
  ctx.drive = { active: false, car: null, fx: { sparks() {} } };
});

check('6 an A-frame (6 kg) flies on a nudge, its chalk board with it; the rest collider is a drive-over box', () => {
  // (an area with a single A-frame - Morskoy, Dekabristov Island - has none left standing after check 4 knocked it: the check is skipped there, with a note)
  const r = aframes.find((q) => q.state === 'stand');
  if (!r) { console.log(`     check 6 skipped: no A-frame left standing in ${process.env.AREA || 'strip'} (check 4 knocked the only one)`); return; }
  const body = r.parts.find((p) => p.mesh), ch = objsOf(r)[0];
  const p0 = posOf(body), c0 = matOf(ch);
  K.knock.hit(r.x, r.z, 8, -0.5, 0.8, 'aframe');
  assert.equal(r.state, 'fly'); idle(K, 6);
  assert.equal(r.state, 'rest');
  assert(posOf(body).distanceTo(p0) > 0.5, `thrown ${posOf(body).distanceTo(p0).toFixed(2)} m`); assert(matOf(ch).distanceTo(c0) > 0.5, 'the chalk board followed');
  assert(r.items.length === 1 && r.items[0].y1 <= 0.42 + 0.2, 'a low rest box');
  assert(recs('aframe').length === aframes.length && recs('kiosk').length === kiosks.length && recs('booth').length === booths.length, 'the census is stable after knocks');
});

console.log(`\n${checks} checks passed`);
process.exit(0);
