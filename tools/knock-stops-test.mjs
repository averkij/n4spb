// Headless test of KNOCKABLE bus shelters and bus-stop poles. No GPU. node tools/knock-stops-test.mjs
// Builds the real streets module with the real core/knock.js (and once without) and checks:
//   1 census: every shelter has three colliders, body, wood, glass and a name band; every stop has a pole with its collider, shaft and face
//   2 no ghost: the merged pt-poles VB and the merged sign panels hold no bus pole, no shelter name band, the merged shelter meshes are gone; the build without ctx.knock still has them
//   3 a knocked shelter takes its glass and its name band (one rigid body with the body and wood) and loses its 3 colliders; a knocked pole takes its sign face
//   4 the real car: a bus-stop pole holds 6 km/h and breaks at 20 km/h; a shelter holds 18 km/h and breaks at 45 km/h
//   5 the name bands brighten at night like the merged sign panels; the no-knock build registers nothing and keeps the old collider count of the stops
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = (p) => pathToFileURL(path.join(root, p)).href;

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
const streets = await import(url('src/world/streets.js'));
const { WALK_Y } = await import(url('src/world/streets/surface.js'));

let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log('PASS', name); };
const hyp = (a, b) => Math.sqrt(a * a + b * b);

/** a fresh context with the real streets module built into it; knock = false builds the pre-knock structure */
async function build(knock) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
  const ctx = createContext({ scene, camera, renderer: null, audio: null, quality: { name: 'medium', pixelRatio: 1, msaa: 4, shadowMap: 2048, shadowSize: 70, petals: 0.6 }, sunDir: new THREE.Vector3(...L.SUN_DIR).normalize() });
  ctx.buildList = ['streets'];
  ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
  ctx.drive = { active: false, car: null, fx: { sparks() {} } };
  if (knock) ctx.knock = createKnock(ctx);
  await streets.build(ctx);
  const meshes = []; ctx.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
  return { ctx, meshes, stats: ctx.services.streetsStats, stops: ctx.services.streets.busStops };
}
let T = 0;
const run = (w, seconds, dt = 0.05) => { for (let s = 0; s < seconds - 1e-9; s += dt) { T += dt; w.ctx.time = T; for (const f of w.ctx._updates) f(dt, T); } };
const worldOf = (p) => (p.obj ? new THREE.Vector3().setFromMatrixPosition(p.obj.matrix) : new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(p.mesh.instanceMatrix.array, p.index * 16)));
const keyOf = (p) => (p.obj ? Array.from(p.obj.matrix.elements) : Array.from(p.mesh.instanceMatrix.array.slice(p.index * 16, p.index * 16 + 16)));
/** the count of world-space vertices of the merged (non-instanced) meshes named nameRe that lie within r m (horizontally) of (x, z) between y0 and y1 */
function vertsNear(w, nameRe, x, z, r, y0, y1) {
  let n = 0;
  for (const m of w.meshes) {
    if (m.isInstancedMesh || !nameRe.test(m.name) || !m.geometry.attributes.position) continue;
    const a = m.geometry.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - x) < r && Math.abs(a[i + 2] - z) < r && a[i + 1] >= y0 && a[i + 1] <= y1) n++;
  }
  return n;
}

const t0 = Date.now();
const K = await build(true);
console.log(`built streets with ctx.knock in ${Date.now() - t0} ms`);
const colliders0 = K.ctx.physics.count;                                  // before any test mutates the world
const stopColliders = (w) => w.ctx.physics.items.filter((it) => { const x = it.cx ?? it.x, z = it.cz ?? it.z; return x !== undefined && K.stops.some((s) => hyp(x - s.x, z - s.z) < 4); }).length;     // local count: other packages add colliders elsewhere (chain spans ...)
const stopColliders0 = stopColliders(K);
const recs = (kind) => K.ctx.knock.list.filter((r) => r.kind === kind);
const shelterStops = K.stops.filter((s) => s.shelter);
const shelterAt = (s) => recs('shelter').find((q) => hyp(q.x - s.x, q.z - s.z) < 0.01);
const poleAt = (s) => recs('sign').find((r) => r.h === 3 && hyp(r.x - s.pole.x, r.z - s.pole.z) < 0.01);
const bandOf = (r) => r.parts.find((p) => p.obj);
const quatOf = (p) => { const m = p.obj ? p.obj.matrix : new THREE.Matrix4().fromArray(p.mesh.instanceMatrix.array, p.index * 16), q = new THREE.Quaternion(); m.decompose(new THREE.Vector3(), q, new THREE.Vector3()); return q; };

check('1 census: each shelter and pole has its own knock record and colliders', () => {
  assert(K.stops.length > 0 && shelterStops.length > 3 && shelterStops.length < K.stops.length, 'exercise sheltered and unsheltered stops');
  assert.equal(K.stats.furniture.stops, K.stops.length); assert.equal(K.stats.furniture.shelters, shelterStops.length);
  const sh = recs('shelter'); assert.equal(sh.length, shelterStops.length); assert.equal(K.ctx.knock.stats.byKind.shelter, shelterStops.length);
  for (const s of shelterStops) {
    const r = shelterAt(s); assert(r, `a shelter record at ${s.name}`);
    assert.equal(r.items.length, 3, 'back + two sides'); for (const it of r.items) assert(it.source && it.source.knock === r, 'the collider belongs to the record');
    assert.equal(r.parts.filter((p) => p.mesh).length, 3, 'body + wood + glass'); assert.equal(r.parts.filter((p) => p.obj).length, 1, 'the name band');
    assert.equal(r.anchored, 28); assert.equal(r.mass, 350);
    assert.equal(new Set(r.parts.filter((p) => p.mesh).map((p) => p.index)).size, 1, 'one index in the three meshes');
    assert(r.parts.every((p) => hyp(p.off.x, p.off.z) < 2.2), 'every part sits on its shelter');
  }
  assert.equal(recs('sign').filter((r) => r.h === 3).length, K.stops.length, 'sign records of height 3 m = the bus poles');
  for (const s of K.stops) {
    const r = poleAt(s); assert(r, `a pole record at ${s.name}`);
    assert.equal(r.items.length, 1); assert(r.items[0].source && r.items[0].source.knock === r, 'the pole owns its collider');
    assert.equal(r.parts.length, 2, 'shaft + face'); assert.equal(r.anchored, 10); assert.equal(r.mass, 30);
  }
  assert.equal(K.stats.furniture.stops, K.stats.knockPosts.byKind.sign - recs('sign').filter((r) => r.h !== 3).length, 'the bus poles are among the sign records');
  console.log('     shelter meshes', K.meshes.filter((m) => m.isInstancedMesh && m.name.startsWith('pt-shelter')).map((m) => m.name.replace('pt-shelter-', '') + ':' + m.count).join(' '));
});

const N = await build(false);
check('2 no ghost: the merged pt-poles / sign panels hold no bus pole, no name band, no shelter; the no-knock build still has all of them', () => {
  for (const s of K.stops) {
    const nk = vertsNear(K, /^pt-poles/, s.pole.x, s.pole.z, 0.2, WALK_Y + 0.3, WALK_Y + 3), nn = vertsNear(N, /^pt-poles/, s.pole.x, s.pole.z, 0.2, WALK_Y + 0.3, WALK_Y + 3);
    assert.equal(nk, 0, `a ghost pole at ${s.name} in pt-poles (${nk} vertices)`); assert(nn >= 12, `the no-knock build has the pole at ${s.name} (${nn})`);
    const fk = vertsNear(K, /^pt-signpanel/, s.pole.x, s.pole.z, 0.5, WALK_Y + 2.0, WALK_Y + 3.1), fn = vertsNear(N, /^pt-signpanel/, s.pole.x, s.pole.z, 0.5, WALK_Y + 2.0, WALK_Y + 3.1);
    assert.equal(fk, 0, `a ghost sign face at ${s.name} (${fk})`); assert(fn >= 4, `the no-knock build has the face at ${s.name} (${fn})`);
  }
  for (const s of shelterStops) {
    const r = shelterAt(s), bx = r.x + Math.sin(r.rotY) * 0.94, bz = r.z + Math.cos(r.rotY) * 0.94;
    assert.equal(vertsNear(K, /^pt-signpanel/, bx, bz, 1.8, WALK_Y + 2.1, WALK_Y + 2.7), 0, `a ghost name band at ${s.name}`);
    assert(vertsNear(N, /^pt-signpanel/, bx, bz, 1.8, WALK_Y + 2.1, WALK_Y + 2.7) >= 4, `the no-knock build has the band at ${s.name}`);
    assert.equal(vertsNear(K, /^pt-shelter/, s.x, s.z, 1.6, WALK_Y, WALK_Y + 3), 0, `a merged shelter left at ${s.name}`);
  }
  for (const nm of ['pt-shelters', 'pt-shelter-wood', 'pt-shelter-glass']) { assert(!K.meshes.some((m) => m.name === nm), `${nm} gone with ctx.knock`); assert(N.meshes.some((m) => m.name === nm), `${nm} present without`); }
  assert(!N.meshes.some((m) => /^pt-shelter-(body|wood|glass)\||^pt-stop-band/.test(m.name)), 'no knock meshes without ctx.knock'); assert.equal(N.ctx.knock, undefined);
  assert(K.meshes.filter((m) => m.isInstancedMesh && /^pt-shelter-(body|wood|glass)\|/.test(m.name)).length >= 6, 'cell meshes per part');
  assert.equal(K.meshes.filter((m) => m.name === 'pt-stop-band').length, shelterStops.length, 'one detached name band per shelter');
  console.log(`     pt-poles tris: knock ${K.stats.tris['pt-poles']}, no knock ${N.stats.tris['pt-poles']} | colliders: knock ${colliders0}, no knock ${N.ctx.physics.count}`);
});

check('3 a knocked shelter carries its glass and name band (one rigid body) and drops its 3 colliders; a knocked pole carries its face', () => {
  const r = recs('shelter')[3], all = r.parts, w0 = all.map(worldOf), d0 = w0.map((v) => v.distanceTo(w0[0])), m0 = all.map(keyOf);
  const rel0 = quatOf(bandOf(r)).clone().premultiply(quatOf(all[0]).clone().invert());                 // the band's turn relative to the body
  assert.equal(K.ctx.knock.hit(r.x, r.z, 45, 1, 0.3, 'shelter'), r);
  assert.equal(r.state, 'fly'); assert.equal(r.items.length, 0, 'the 3 colliders left');
  run(K, 8);
  assert.equal(r.state, 'rest');
  const w1 = all.map(worldOf);
  assert(w1.some((v, i) => v.distanceTo(w0[i]) > 0.5), 'the shelter moved');
  all.forEach((p, i) => assert(keyOf(p).some((v, j) => Math.abs(v - m0[i][j]) > 1e-3), `part ${i} (${p.obj ? 'band' : p.mesh.name}) moved`));
  all.forEach((p, i) => assert(Math.abs(w1[i].distanceTo(w1[0]) - d0[i]) < 0.05, `part ${i} keeps its distance to the body (${w1[i].distanceTo(w1[0]).toFixed(3)} vs ${d0[i].toFixed(3)})`));
  assert(bandOf(r).obj.matrix.elements.every(Number.isFinite), 'finite band matrix');
  const rel1 = quatOf(bandOf(r)).clone().premultiply(quatOf(all[0]).clone().invert());
  assert(rel0.angleTo(rel1) < 1e-3, 'the band keeps its orientation on the body (' + rel0.angleTo(rel1).toFixed(5) + ' rad)');
  assert(quatOf(all[0]).angleTo(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.rotY)) > 0.5, 'the shelter really turned over');
  assert(r.items.length === 1 && r.items[0].y1 - r.items[0].y0 <= 0.5, 'a low rest collider replaced the walls');
  assert.equal(recs('shelter')[4].state, 'stand', 'the next shelter stands');
  const s = K.stops[7], pr = poleAt(s), pw0 = pr.parts.map(worldOf), pm0 = pr.parts.map(keyOf);
  assert.equal(K.ctx.knock.hit(pr.x, pr.z, 25, 0, 1, 'sign'), pr); run(K, 6);
  assert.equal(pr.state, 'rest'); const pw1 = pr.parts.map(worldOf);
  pr.parts.forEach((p, i) => assert(keyOf(p).some((v, j) => Math.abs(v - pm0[i][j]) > 1e-3), `pole part ${i} moved`));
  assert(Math.abs(pw1[1].distanceTo(pw1[0]) - pw0[1].distanceTo(pw0[0])) < 0.05, 'the face keeps its place on the pole');
  assert(pw1[1].y < 1.6, 'the lying pole carries its face to the ground (y ' + pw1[1].y.toFixed(2) + ')');
});

// ---------------------------------------------------------------- the real car
function clearAround(w, r, len) {                                   // the other colliders around the record go (the test world is ours)
  const ph = w.ctx.physics;
  for (const it of ph.items.slice()) { if (r.items.includes(it)) continue; const cx = it.cx ?? it.x, cz = it.cz ?? it.z; if (cx === undefined) continue; if (hyp(cx - r.x, cz - r.z) < len + 8) ph.remove(it); }
}
function clearLine(r, dx, dz, len) {
  for (let s = 0; s <= len + 1; s += 1) { const x = r.x - dx * s, z = r.z - dz * s; if (L.insideBuilding(x, z, 1.0) || !L.inPlay(x, z) || L.heightAt(x, z) < -0.5) return false; }
  return true;
}
/** a driving direction (dx, dz) that ends at the record; `want` pins it (a shelter is rammed through its open front into the back panel) */
function corridor(r, len, want) {
  if (want) return clearLine(r, want[0], want[1], len) ? { dx: want[0], dz: want[1] } : null;
  for (let a = 0; a < 16; a++) { const th = a / 16 * Math.PI * 2, dx = Math.cos(th), dz = Math.sin(th); if (clearLine(r, dx, dz, len)) return { dx, dz }; }
  return null;
}
function ram(w, r, kmh, len = 12, want = null) {
  const c = corridor(r, len + 2, want); if (!c) return null;
  clearAround(w, r, len + 2);
  const car = createHandling(w.ctx, tuningFor('coupe', { ...SPEC, mass: MASS.coupe }));
  const yaw = Math.atan2(c.dx, c.dz);
  car.reset(r.x - c.dx * len, r.z - c.dz * len, yaw); car.vx = Math.sin(yaw) * kmh / 3.6; car.vz = Math.cos(yaw) * kmh / 3.6;
  w.ctx.drive.active = true; w.ctx.drive.car = car;
  let hit = false;
  for (let t = 0; t < 12; t += 1 / 60) {
    if ((car.x - r.x) * c.dx + (car.z - r.z) * c.dz < -2.5) { car.vx = Math.sin(yaw) * kmh / 3.6; car.vz = Math.cos(yaw) * kmh / 3.6; }      // a steady approach: the contact speed is the one asked for
    car.step(1 / 60, { thr: 0, brk: 0, steer: 0, hand: false, nitro: false });
    for (const e of car.events) if (e.type === 'hit') hit = true;
    if (r.wobble || r.state !== 'stand') hit = true;
    for (const f of w.ctx._updates) f(1 / 60, T += 1 / 60);
  }
  w.ctx.drive.active = false;
  return { hit, along: (car.x - r.x) * c.dx + (car.z - r.z) * c.dz };
}
const standing = (kind, pred = () => true) => K.ctx.knock.list.filter((r) => r.kind === kind && r.state === 'stand' && pred(r) && r.items.every((it) => K.ctx.physics.items.includes(it)));
function drill(list, kmh, want) { for (const r of list) { const res = ram(K, r, kmh, 12, want ? want(r) : null); if (res) return { r, res }; } return null; }

check('4 the real car: a bus-stop pole holds 6 km/h and breaks at 20 km/h (anchored 10)', () => {
  const hold = drill(standing('sign', (r) => r.h === 3), 6); assert(hold, 'a bus pole with a free approach'); assert.equal(hold.r.state, 'stand', 'holds at 6 km/h'); assert(hold.res.hit, 'the car felt the pole');
  assert(hold.res.along > -2.6 && hold.res.along < 0.5, `the car stopped at the pole (along ${hold.res.along.toFixed(2)})`);
  const brk = ram(K, hold.r, 20); assert(brk); assert(hold.r.state !== 'stand', 'breaks at 20 km/h');
});
check('5 the real car: a shelter holds 18 km/h and breaks at 45 km/h (anchored 28)', () => {
  const front = (r) => [-Math.sin(r.rotY), -Math.cos(r.rotY)];
  const hold = drill(standing('shelter'), 18, front); assert(hold, 'a shelter with a free approach through its front'); assert.equal(hold.r.state, 'stand', 'holds at 18 km/h'); assert(hold.res.hit, 'the car felt the shelter');
  assert(hold.res.along < 0.9, `the car stopped before the back panel (along ${hold.res.along.toFixed(2)})`);
  const brk = ram(K, hold.r, 45, 12, front(hold.r)); assert(brk); assert(hold.r.state !== 'stand', 'breaks at 45 km/h (state ' + hold.r.state + ')');
  assert(hold.r.items.length === 0 || hold.r.state === 'rest', 'its walls are gone');
});

check('6 the name bands brighten at night like the merged sign panels; the dynamic root holds them', () => {
  const bands = K.meshes.filter((m) => m.name === 'pt-stop-band'); assert.equal(bands.length, shelterStops.length);
  assert(bands.every((m) => m.userData.dynamic && m.material.map && m.material.side === THREE.DoubleSide), 'dynamic, textured, double sided');
  const un = K.ctx.shared.uNight; assert(un, 'uNight'); const was = un.value;
  un.value = 0; run(K, 0.1); const day = bands[0].material.color.r; un.value = 1; run(K, 0.1); const night = bands[0].material.color.r; un.value = was;
  assert(Math.abs(day - 0.86) < 1e-6 && Math.abs(night - 1.36) < 1e-6, `day ${day} night ${night}`);
  assert.equal(new Set(bands.map((m) => m.geometry)).size, 1, 'one shared plane geometry'); assert(bands.every((m) => m.userData.lodFar === 330), 'a finite LOD range, as the shelter meshes');
});

check('7 without ctx.knock: nothing registered, the stop colliders are the old ones (3 per shelter + 1 per pole, no bench / bin colliders)', () => {
  assert.equal(N.ctx.knock, undefined);
  assert.equal(N.stats.furniture.stops, K.stops.length); assert.equal(N.stats.furniture.shelters, shelterStops.length);
  const diff = stopColliders0 - stopColliders(N);
  assert.equal(diff, K.stops.length, `ctx.knock adds one bench or bin collider at every stop (+${diff})`);
});

console.log(`RESULT: OK (${checks} checks)`);
process.exit(0);
