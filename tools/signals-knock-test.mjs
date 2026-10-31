// Headless test of the KNOCKABLE traffic signals, mast arms, speed cameras and sign posts (streets/signals.js, extras.js, countdown.js, furn.js makeKnockPosts). No GPU.  npm run signals-knock
// Builds the real streets module (the real net, signal graph, lens / countdown meshes, atlas) with the real core/knock.js and checks:
//   1 census (840 signal poles, 268 mast arms, 11 speed cameras, ~686 sign posts), every pole owns its collider, no pole left in the merged pt-poles VB
//   2 every lens / digit instance a record carries belongs to ITS pole (all signal poles within 0.5 m, all mast heads under the arm)
//   3 the signal states without any knock: exactly the lit lens of the state is white, the digits show the glyph cell or the blank cell, no instance matrix is ever written
//   4 a knocked pole carries its heads, lenses and digits as one rigid body, and 120 s of signal cycles (setLens, the countdown writer) never move them back, while the colours keep following
//   5 the real car against a mast arm (30 / 60 km/h: holds / breaks), a signal pole (30 km/h breaks) and a sign post (6 km/h holds, 20 km/h breaks)
//   6 without ctx.knock: the old structure (no pt-kp meshes, lens switched by scale, panels in the shared VB)
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
  const meshes = []; ctx.staticRoot.traverse((o) => { if (o.isInstancedMesh) meshes.push(o); }); ctx.scene.traverse((o) => { if (o.isInstancedMesh && !meshes.includes(o)) meshes.push(o); });
  return { ctx, meshes, stats: ctx.services.streetsStats };
}
let T = 0;                                                      // the signal clock of the test
/** run every update of the module (the lens writer, the countdown writer, ctx.knock.update) for `seconds` */
const run = (w, seconds, dt = 0.05) => { for (let s = 0; s < seconds - 1e-9; s += dt) { T += dt; w.ctx.time = T; for (const f of w.ctx._updates) f(dt, T); } };
const posOf = (mesh, i) => new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(mesh.instanceMatrix.array, i * 16));
const scaleOf = (mesh, i) => new THREE.Vector3().setFromMatrixScale(new THREE.Matrix4().fromArray(mesh.instanceMatrix.array, i * 16));
const worldOf = (p) => posOf(p.mesh, p.index);
/** the shared lens / digit instances (frustum culling off, no name) of a record's parts */
const sharedParts = (r) => r.parts.filter((p) => p.mesh && p.mesh.frustumCulled === false);

const t0 = Date.now();
const K = await build(true);
console.log(`built streets with ctx.knock in ${Date.now() - t0} ms`);
const recs = (kind) => K.ctx.knock.list.filter((r) => r.kind === kind);

check('1 census after full-base roadway clearance: 822 signal poles, 264 mast arms, 11 speed cameras; every record owns its collider', () => {
  const by = K.ctx.knock.stats.byKind;
  console.log('     census',JSON.stringify(by));
  assert.equal(by.signal, 822); assert.equal(by.arm, 264); assert.equal(by.camera, 11);
  assert(by.sign >= 744 && by.sign <= 750, `sign posts ${by.sign}`);                 // 686 road signs + the 60 bus-stop poles of package G2
  for (const kind of ['signal', 'arm', 'camera', 'sign']) for (const r of recs(kind)) { assert(r.items.length === 1 && r.items[0].source && r.items[0].source.knock === r, `${kind} at ${r.x.toFixed(1)}, ${r.z.toFixed(1)} owns its collider`); assert(r.anchored > 0 && r.state === 'stand'); }
  const kp = K.stats.knockPosts;
  assert.equal(kp.records, by.signal + by.arm + by.camera + by.sign);
  console.log('     knockPosts', JSON.stringify(kp));
  console.log('     arms: anchored', recs('arm')[0].anchored, 'kg', recs('arm')[0].mass, '| signals anchored', recs('signal')[0].anchored, '| signs anchored', recs('sign')[0].anchored, '| cameras', recs('camera')[0].anchored);
});

check('2 every lens and digit instance of a record sits on ITS pole (index mapping of 1347 heads)', () => {
  let heads = 0;
  for (const r of recs('signal')) {
    const sp = sharedParts(r); assert(sp.length === 5 || sp.length === 4, `a signal record has one head: 3 lenses + 2 digits (veh) or 2 + 2 (ped), got ${sp.length}`);
    for (const p of sp) { assert(hyp(p.off.x, p.off.z) < 0.5, `a lens of the pole at ${r.x.toFixed(1)}, ${r.z.toFixed(1)} is ${hyp(p.off.x, p.off.z).toFixed(2)} m off its pole`); assert(p.off.y > 1.2 && p.off.y < 3.3, `lens height ${p.off.y} above the foot`); }
    heads++;
  }
  for (const r of recs('arm')) {
    const sp = sharedParts(r); assert(sp.length === 10 || sp.length === 5, `an arm carries 1 or 2 vehicle heads (5 instances each), got ${sp.length}`);
    for (const p of sp) { assert(hyp(p.off.x, p.off.z) < 20, `an arm head ${hyp(p.off.x, p.off.z).toFixed(1)} m off its mast`); assert(p.off.y > 4.5 && p.off.y < 6.3, `arm head height ${p.off.y}`); }
    heads += sp.length / 5;
  }
  assert.equal(heads, K.stats.headList.length, 'every head of the module belongs to exactly one record');
  // no instance of the shared lens meshes is registered twice
  const seen = new Set(); for (const r of K.ctx.knock.list) for (const p of sharedParts(r)) { const key = p.mesh.uuid + ':' + p.index; assert(!seen.has(key), 'a lens / digit instance belongs to one record'); seen.add(key); }
});

check('3 no knock: the lenses show the state by colour (one lit lens per head at most), the digits by the glyph cell, and no instance matrix is ever written', () => {
  const one = recs('signal').find((r) => sharedParts(r).length === 5);
  const lens = sharedParts(one).slice(0, 3), dig = sharedParts(one).slice(3);
  const before = [...lens, ...dig].map((p) => Array.from(p.mesh.instanceMatrix.array.slice(p.index * 16, p.index * 16 + 16)));
  const seenLit = new Set(), seenDigit = new Set();
  for (let k = 0; k < 130; k++) {
    run(K, 1);
    const lit = lens.map((p) => (p.mesh.instanceColor.array[p.index * 3] > 0.5 ? 1 : 0));
    assert(lit[0] + lit[1] + lit[2] <= 1, 'at most one lit lens of a vehicle head');
    seenLit.add(lit.join(''));
    for (const p of dig) seenDigit.add(p.mesh.geometry.attributes.uvOff.array[p.index] >= 1 ? 'blank' : 'glyph');
  }
  assert(seenLit.has('100') && seenLit.has('001') && seenLit.has('010'), `red, green and amber all shown in a cycle (seen ${[...seenLit]})`);
  assert(seenDigit.has('glyph') && seenDigit.has('blank'), 'the countdown shows digits and goes blank (amber)');
  [...lens, ...dig].forEach((p, i) => { const now = Array.from(p.mesh.instanceMatrix.array.slice(p.index * 16, p.index * 16 + 16)); assert.deepEqual(now, before[i], 'no matrix write in 130 s of signals'); });
});

check('4 a knocked signal pole: pole, face, head, lenses and digits fall as ONE rigid body; 120 s of signals never move them back; the colours keep following', () => {
  const r = recs('signal').find((q) => sharedParts(q).length === 5 && q.parts.length === 7);        // body + face + 3 lenses + 2 digits
  assert(r, 'a stop-line pole record with 7 parts');
  const all = r.parts.filter((p) => p.mesh);
  const world0 = all.map(worldOf), dist0 = world0.map((v) => v.distanceTo(world0[0]));
  K.ctx.knock.hit(r.x, r.z, 30, 1, 0, 'signal');
  assert.equal(r.state, 'fly'); assert(r.items.length === 0, 'the collider left');
  run(K, 6);
  assert.equal(r.state, 'rest');
  const world1 = all.map(worldOf);
  assert(world1[0].distanceTo(world0[0]) > 0.3 || world1.some((v, i) => v.distanceTo(world0[i]) > 1), 'the pole moved');
  const lens = all.filter((p) => p.mesh.frustumCulled === false);
  assert(lens.some((p) => worldOf(p).y < 1.6), 'the head of the pole lies near the ground');
  all.forEach((p, i) => assert(Math.abs(world1[i].distanceTo(world1[0]) - dist0[i]) < 0.02, `part ${i} keeps its distance to the pole body (rigid): ${world1[i].distanceTo(world1[0]).toFixed(3)} vs ${dist0[i].toFixed(3)}`));
  const snap = (ps) => ps.map((p) => Array.from(p.mesh.instanceMatrix.array.slice(p.index * 16, p.index * 16 + 16)));
  const resting = snap(all);
  const others = recs('signal').filter((q) => q !== r && sharedParts(q).length === 5).slice(0, 40), otherM0 = snap(others.flatMap((q) => sharedParts(q)));
  const seen = new Set();
  for (let k = 0; k < 120; k++) { run(K, 1); seen.add(lens.slice(0, 3).map((p) => (p.mesh.instanceColor.array[p.index * 3] > 0.5 ? 1 : 0)).join('')); }
  assert.deepEqual(snap(all), resting, 'the resting pole, its head, lenses and digits did not move for 120 s of signal changes');
  assert(seen.size >= 3, `the knocked head keeps showing the signal (lit patterns ${[...seen]})`);
  assert.deepEqual(snap(others.flatMap((q) => sharedParts(q))), otherM0, 'the standing heads never get a matrix write either');
  // a knocked pole is a low drivable solid
  assert(r.items.length === 1 && r.items[0].y1 - r.items[0].y0 <= 0.5, 'a low rest collider replaced it');
});

check('5 a hit mast arm: mast, truss, heads, pedestrian sign hanger and the lenses of its heads topple together', () => {
  const r = recs('arm').find((q) => q.parts.length >= 10); assert(r, 'an arm with parts');
  const all = r.parts.filter((p) => p.mesh), w0 = all.map(worldOf), d0 = w0.map((v) => v.distanceTo(w0[0]));
  const ax = -Math.cos(r.rotY), az = Math.sin(r.rotY);                                                    // the worst throw: along the truss (the knock turns the fall across it)
  K.ctx.knock.hit(r.x, r.z, 60, ax, az, 'arm');
  run(K, 8);
  assert.equal(r.state, 'rest');
  const w1 = all.map(worldOf);
  all.forEach((p, i) => assert(Math.abs(w1[i].distanceTo(w1[0]) - d0[i]) < 0.05, `arm part ${i} rigid`));
  assert(w1.every((v) => v.y < 3), 'an 8 m mast lies on the ground: ' + w1.map((v) => v.y.toFixed(2)).join(' ') + ' tilt ' + r.state);
});

check('6 the speed cameras: 11 records, each its own model, pole and box fall together', () => {
  const cams = recs('camera'); assert.equal(cams.length, 11);
  const r = cams[0]; assert.equal(r.parts.length, 1);
  const m0 = Array.from(r.parts[0].mesh.instanceMatrix.array.slice(r.parts[0].index * 16, r.parts[0].index * 16 + 16)); K.ctx.knock.hit(r.x, r.z, 40, -1, 0, 'camera'); run(K, 6);
  assert.equal(r.state, 'rest');
  const m1 = Array.from(r.parts[0].mesh.instanceMatrix.array.slice(r.parts[0].index * 16, r.parts[0].index * 16 + 16));
  assert(m1.some((v, i) => Math.abs(v - m0[i]) > 0.5), 'the camera pole lies down (its matrix turned)');
});

// ---------------------------------------------------------------- the real car against the poles
/** a corridor of `len` m ending at the record, free of buildings and water: { dx, dz } the driving direction or null (no collider is looked at: clearAround() removes them) */
function clearAround(w, r, len) {                                   // the other colliders around the record go (the test world is ours)
  const ph = w.ctx.physics;
  for (const it of ph.items.slice()) { if (it === r.items[0]) continue; const cx = it.cx ?? it.x, cz = it.cz ?? it.z; if (cx === undefined) continue; if (hyp(cx - r.x, cz - r.z) < len + 8) ph.remove(it); }
}
function corridor(w, r, len = 16) {
  for (let a = 0; a < 16; a++) {
    const th = a / 16 * Math.PI * 2, dx = Math.cos(th), dz = Math.sin(th); let ok = true;
    for (let s = 0; s <= len + 1; s += 1) { const x = r.x - dx * s, z = r.z - dz * s; if (L.insideBuilding(x, z, 1.0) || !L.inPlay(x, z) || L.heightAt(x, z) < -0.5) { ok = false; break; } }
    if (ok) return { dx, dz };
  }
  return null;
}
function ram(w, r, kmh, len = 12) {
  const c = corridor(w, r, len + 2); if (!c) return null;
  clearAround(w, r, len + 2);
  const car = createHandling(w.ctx, tuningFor('coupe', { ...SPEC, mass: MASS.coupe }));
  const yaw = Math.atan2(c.dx, c.dz);
  car.reset(r.x - c.dx * len, r.z - c.dz * len, yaw); car.vx = Math.sin(yaw) * kmh / 3.6; car.vz = Math.cos(yaw) * kmh / 3.6;
  w.ctx.drive.active = true; w.ctx.drive.car = car;
  let hit = false, maxSpeed = 0;
  for (let t = 0; t < 12; t += 1 / 60) {
    if ((car.x - r.x) * c.dx + (car.z - r.z) * c.dz < -2.5) { car.vx = Math.sin(yaw) * kmh / 3.6; car.vz = Math.cos(yaw) * kmh / 3.6; }      // a steady approach: the contact speed is the one asked for
    car.step(1 / 60, { thr: 0, brk: 0, steer: 0, hand: false, nitro: false });
    for (const e of car.events) if (e.type === 'hit') hit = true;
    if (r.wobble || r.state !== 'stand') hit = true;                                                       // a bump below the break speed wobbles the post (knock.js onCarHit)
    for (const f of w.ctx._updates) f(1 / 60, T += 1 / 60);
    maxSpeed = Math.max(maxSpeed, hyp(car.vx, car.vz) * 3.6);
  }
  w.ctx.drive.active = false;
  return { hit, car, along: (car.x - r.x) * c.dx + (car.z - r.z) * c.dz, maxSpeed };
}
const free = (w, kind, n = 40) => w.ctx.knock.list.filter((r) => r.kind === kind && r.state === 'stand' && r.items[0] && w.ctx.physics.items.includes(r.items[0])).slice(0, n);      // (a collider that an earlier drill cleared away is not a target)
function drill(kind, kmh) {
  for (const r of free(K, kind, 80)) { if (!corridor(K, r)) continue; const res = ram(K, r, kmh); if (res) return { r, res }; }
  return null;
}
check('7 the real car: a mast arm holds at 30 km/h and breaks at 60 km/h (anchored 40)', () => {
  const hold = drill('arm', 30); assert(hold, 'a mast with a free approach'); const m = hold.r;
  assert.equal(m.state, 'stand', 'the mast arm holds at 30 km/h'); assert(hold.res.hit, 'the car felt the mast');
  assert(hold.res.along < 0.5, `the car stopped before the mast (along ${hold.res.along.toFixed(2)})`);
  const brk = ram(K, m, 60); assert(brk);
  assert(m.state === 'fly' || m.state === 'rest', `the mast arm breaks at 60 km/h (state ${m.state})`);
  console.log(`     mast hold@30: along ${hold.res.along.toFixed(2)} | break@60: along ${brk.along.toFixed(2)}, car left at ${brk.maxSpeed.toFixed(0)} km/h peak`);
});
check('8 the real car: a traffic-signal pole breaks at 30 km/h (anchored 18) but holds a 8 km/h bump', () => {
  const hold = drill('signal', 8); assert(hold, 'a signal pole with a free approach'); assert.equal(hold.r.state, 'stand', 'holds at 8 km/h'); assert(hold.res.along > -2.6, 'the car reached the pole and stopped on it (along ' + hold.res.along.toFixed(2) + ')');
  const brk = ram(K, hold.r, 30); assert(brk); assert(hold.r.state !== 'stand', 'breaks at 30 km/h');
});
check('9 the real car: a sign post holds at 6 km/h and breaks at 20 km/h (anchored 10)', () => {
  const hold = drill('sign', 6); assert(hold, 'a sign post with a free approach'); assert.equal(hold.r.state, 'stand', 'holds at 6 km/h'); assert(hold.res.along > -2.6, 'the car reached the post and stopped on it (along ' + hold.res.along.toFixed(2) + ')');
  const brk = ram(K, hold.r, 20); assert(brk); assert(hold.r.state !== 'stand', 'breaks at 20 km/h ');
});

// ---------------------------------------------------------------- the pre-knock structure (no ctx.knock)
const N = await build(false);
check('10 no ctx.knock: the old structure (no pt-kp meshes, merged poles, lens switched by scale, panels in the shared VB, nothing registered)', () => {
  assert(!N.meshes.some((m) => m.name.startsWith('pt-kp-')), 'no knock post meshes');
  assert.equal(N.stats.knockPosts, undefined);
  assert(N.stats.tris['pt-poles'] > 140000, `the poles stay merged (${N.stats.tris['pt-poles']} tris)`);
  assert(K.stats.tris['pt-poles'] < 30000, `with ctx.knock the knockable poles left the merged VB (${K.stats.tris['pt-poles']} tris)`);
  const lens = N.meshes.filter((m) => m.frustumCulled === false && m.count > 100 && !m.instanceColor);
  assert(lens.length >= 5, 'five lens meshes without an instance colour');
  run(N, 20);
  // 'on' lens scale 1, 'off' lens 0.001 as ever
  let on = 0, off = 0; for (const m of lens.slice(0, 3)) for (let i = 0; i < Math.min(m.count, 200); i++) { const s = scaleOf(m, i).x; if (s > 0.99) on++; else if (s > 0.0009 && s < 0.0011) off++; }
  assert(on > 0 && off > 0, `lenses are switched by scale (on ${on}, off ${off})`);
});

check('11 signal states with ctx.knock (lens colour, digit cell) equal the pre-knock states (lens scale, digit matrix) on all 1347 heads at 40 instants', () => {
  const pick = (w) => {
    const lens = w.meshes.filter((m) => m.frustumCulled === false && m.geometry.type === 'CircleGeometry'), dig = w.meshes.find((m) => m.geometry.attributes.uvOff);
    return { veh: lens.filter((m) => Math.abs(m.geometry.parameters.radius - 0.095) < 1e-6), ped: lens.filter((m) => Math.abs(m.geometry.parameters.radius - 0.085) < 1e-6), dig };
  };
  const k = pick(K), n = pick(N);
  assert(k.veh.length === 3 && k.ped.length === 2 && n.veh.length === 3 && n.ped.length === 2 && k.dig && n.dig, 'the lens and digit meshes of both worlds');
  const nV = n.veh[0].count, nP = n.ped[0].count; assert.equal(k.veh[0].count, nV); assert.equal(k.ped[0].count, nP); assert.equal(k.dig.count, n.dig.count);
  let compared = 0, lit = 0, shown = 0;
  for (let q = 0; q < 40; q++) {
    const t = 2.5 + q * 7.31;
    for (const w of [K, N]) for (const f of w.ctx._updates) f(0.05, t);
    const on = (m, i) => scaleOf(m, i).x > 0.5, litc = (m, i) => m.instanceColor.array[i * 3] > 0.5;
    for (let i = 0; i < nV; i++) for (let j = 0; j < 3; j++) { assert.equal(litc(k.veh[j], i), on(n.veh[j], i), `vehicle head ${i} lens ${j} at t=${t.toFixed(1)}`); compared++; if (litc(k.veh[j], i)) lit++; }
    for (let i = 0; i < nP; i++) for (let j = 0; j < 2; j++) { assert.equal(litc(k.ped[j], i), on(n.ped[j], i), `pedestrian head ${i} lens ${j} at t=${t.toFixed(1)}`); compared++; }
    const ku = k.dig.geometry.attributes.uvOff.array, nu = n.dig.geometry.attributes.uvOff.array;
    for (let i = 0; i < k.dig.count; i++) {
      const showK = ku[i] < 1, showN = on(n.dig, i); assert.equal(showK, showN, `digit ${i} shown at t=${t.toFixed(1)}`); compared++;
      if (showN) { shown++; assert(Math.abs(ku[i] - nu[i]) < 1e-6, 'the same glyph'); for (let c = 0; c < 3; c++) assert(Math.abs(k.dig.instanceColor.array[i * 3 + c] - n.dig.instanceColor.array[i * 3 + c]) < 1e-6, 'the same digit colour'); }
    }
  }
  console.log(`     ${compared} lens / digit states compared, ${lit} lit vehicle lenses, ${shown} visible digits`);
  assert(lit > 1000 && shown > 1000);
});

check('12 the face quads of the instanced sign posts are in the atlas page material (UV inside the page, double sided, night brightened)', () => {
  const faces = K.meshes.filter((m) => m.name.startsWith('pt-kp-') && /-face\d/.test(m.name)); assert(faces.length > 5);
  for (const m of faces) { assert(m.material.map, 'a face mesh has a map'); assert(m.material.side === THREE.DoubleSide); const uv = m.geometry.attributes.uv.array; for (const v of uv) assert(v >= 0 && v <= 1); assert(!m.castShadow); }
});

// the draw cost line for the report
{
  const kpMeshes = K.meshes.filter((m) => m.name.startsWith('pt-kp-'));
  console.log(`census: ${kpMeshes.length} dynamic cell meshes for ${K.stats.knockPosts.records} records (${K.stats.knockPosts.byGroup ? Object.entries(K.stats.knockPosts.byGroup).map(([g, v]) => `${g} ${v.meshes}`).join(', ') : ''}); the old pt-poles VB held ${N.stats.tris['pt-poles']} tris, now ${K.stats.tris['pt-poles']}`);
}
console.log(`RESULT: OK (${checks} checks, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(0);
