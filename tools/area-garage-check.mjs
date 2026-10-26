// tools/area-garage-check.mjs - CPU proof of the GARAGE of an area (GARAGE.poses / GARAGE.spawn of its area module), the headless counterpart of section 1 of tools/drive-garage-test.mjs:
// every module of the area's list (tools/modules-list.mjs) is built headless like tools/views-check.mjs, then for each of the four drivable cars (ctx.drive.fleet) and the spawn pose:
//   the footprint (3 x 3 sample points) is inside the play area and in no building, not on a traffic lane (a driven lane of rank > 0 within 0.3 m: the traffic module would drive through the parked car),
//   it stands on level ground, it is a solid for the walkers, a pavement strip stays free beside it, 14 m ahead of the nose are free of colliders and buildings (the way out), no parked car of the traffic
//   module overlaps it, and the cars keep 0.6 m between their bumpers.
//   node tools/area-garage-check.mjs                        the strip (the same checks pass there: the tool proves itself on the strip's garage)
//   node tools/area.mjs north tools/area-garage-check.mjs   another area (the loader remap of its page)
//   ... --map x0 z0 x1 z1 [step]                            also prints an ASCII map of the window (B building, # collider, T parked car of the traffic module, r roadway, =  roadway cover, 1-4 driven lane rank, . free, ~ river, * a garage car)
// NODE_OPTIONS=--max-old-space-size=14000. RESULT: OK / FAIL (exit 1).
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- DOM stubs (as tools/views-check.mjs)
class Ctx2D {
  constructor(c) { this.canvas = c; this.font = '10px sans-serif'; }
  measureText(t) { const m = /(\d+(?:\.\d+)?)px/.exec(this.font); const s = m ? Number(m[1]) : 10; return { width: [...String(t)].length * s * 0.92, actualBoundingBoxAscent: s * 0.8, actualBoundingBoxDescent: s * 0.2 }; }
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
  createConicGradient() { return { addColorStop() {} }; }
  createPattern() { return {}; }
  getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; }
  createImageData(w, h) { return { data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }; }
  putImageData() {} getTransform() { return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }; }
  isPointInPath() { return false; }
  getLineDash() { return []; }
}
const ctxProxy = (c) => new Proxy(new Ctx2D(c), { get(t, k) { if (k in t) return t[k]; return () => {}; }, set(t, k, v) { t[k] = v; return true; } });
class FakeCanvas {
  constructor() { this.width = 300; this.height = 150; this.style = {}; this._ctx = null; }
  getContext(type) { if (type !== '2d') return null; return this._ctx || (this._ctx = ctxProxy(this)); }
  toDataURL() { return 'data:,'; } addEventListener() {} removeEventListener() {}
}
globalThis.window = globalThis;
globalThis.self = globalThis;
const stubEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, children: [], textContent: '', innerHTML: '', addEventListener() {}, removeEventListener() {}, appendChild() {}, setAttribute() {}, querySelector: () => stubEl(), querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }), setPointerCapture() {}, remove() {}, width: 1, height: 1, getContext: () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } }) });      // generic DOM node (the drive HUD builds a small DOM tree)
globalThis.document = {
  createElement: (t) => (t === 'canvas' ? new FakeCanvas() : stubEl()),
  createElementNS: (ns, t) => (t === 'canvas' ? new FakeCanvas() : { style: {} }),
  fonts: { load: async () => [] }, body: { appendChild() {} }, head: { appendChild() {} }, addEventListener() {},
};
globalThis.Image = class { constructor() { this.width = 1; this.height = 1; } addEventListener() {} };
globalThis.HTMLCanvasElement = FakeCanvas; globalThis.OffscreenCanvas = FakeCanvas;
globalThis.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 16);
globalThis.addEventListener = () => {};
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1;
globalThis.matchMedia = () => ({ matches: false, addEventListener() {} });
globalThis.performance = globalThis.performance || { now: () => Date.now() };

// ---------------------------------------------------------------- build the area
const THREE = await import('three');
const { createContext } = await import(pathToFileURL(path.join(root, 'src/core/ctx.js')).href);
const L = await import(pathToFileURL(path.join(root, 'src/world/layout.js')).href);
const A = await import(pathToFileURL(path.join(root, 'src/world/area.js')).href);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 2500);
const sunDir = new THREE.Vector3(...L.SUN_DIR).normalize();
const quality = { name: 'high', pixelRatio: 1, msaa: 4, shadowMap: 4096, shadowSize: 75, petals: 1 };
const ctx = createContext({ scene, camera, renderer: null, audio: null, quality, sunDir });
ctx.sky = { sun: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight(), uniforms: {} };
const { mainModules } = await import(pathToFileURL(path.join(root, 'tools/modules-list.mjs')).href);
const WANT = ['environment', 'streets', 'city', 'props', 'traffic', 'drive'];      // what stands round a parked car: ground, streets, buildings, furniture, the parked traffic, the garage itself
const list = mainModules().filter((m) => WANT.includes(m) || (A.ID !== 'strip' && m.startsWith('landmarks')));      // another area: its landmark modules too (M5: the North's Chernyshevskaya vestibule stands beside the garage; the strip's list is unchanged)
ctx.buildList = mainModules();
for (const m of list) { const mod = await import(pathToFileURL(path.join(root, 'src/world/' + m + '.js')).href); await mod.build(ctx); }
const st = ctx.services.streets, net = st && st.net, ph = ctx.physics, drive = ctx.drive;
if (!drive || !drive.fleet || !drive.fleet.length) { console.log(`area ${A.ID}: the drive module built no garage (GARAGE.poses is empty?)`); console.log('RESULT: FAIL'); process.exit(1); }

// ---------------------------------------------------------------- geometry helpers
const lanes = (st.lanes || []).filter((l) => l.rank > 0);
function laneGap(x, z) {
  let best = 1e9, rank = -1;
  for (const l of lanes) { const p = l.pts; for (let i = 0; i + 1 < p.length; i++) {
    const ax = p[i][0], az = p[i][1], bx = p[i + 1][0], bz = p[i + 1][1];
    if (x < Math.min(ax, bx) - 12 || x > Math.max(ax, bx) + 12 || z < Math.min(az, bz) - 12 || z > Math.max(az, bz) + 12) continue;
    const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const dd = Math.hypot(x - ax - t * dx, z - az - t * dz) - (l.width || 3) / 2; if (dd < best) { best = dd; rank = l.rank; }
  } }
  return [best, rank];
}
const parkedCars = (ctx.services.traffic && ctx.services.traffic.parked) || [];
const solid = (x, z, y) => ph.columnBlocked(x, z, 0.3, y + 0.3, y + 1.2);

// ---------------------------------------------------------------- the checks
const problems = [];
const fail = (m) => problems.push(m);
const res = [];
const cars = drive.fleet.map((v) => ({ id: v.id, spec: v.spec, p: v.parked, len: v.spec.len }));
const SPAWN = (await import(pathToFileURL(path.join(root, 'src/world/drive.js')).href)).SPAWN;
if (SPAWN) cars.push({ id: 'spawn', spec: drive.fleet[0].spec, p: { x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw, y: ph.groundHeight(SPAWN.x, SPAWN.z, 10, false) || 0 }, len: drive.fleet[0].spec.len });
for (const c of cars) {
  const p = c.p, S = c.spec, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw), lx = cy, lz = -sy, y = p.y || 0;
  const pts = []; for (const a of [S.front - 0.1, (S.front + S.rear) / 2, S.rear + 0.1]) for (const b of [-S.W / 2, 0, S.W / 2]) pts.push([p.x + sy * a + lx * b, p.z + cy * a + lz * b]);
  let building = 0, outside = 0, trafficLane = 0, minGap = 1e9, onRoad = 0, parked = 0, water = 0;
  for (const [x, z] of pts) {
    if (L.insideBuilding(x, z)) building++; if (!L.inPlay(x, z, 3)) outside++; if (L.inRiver(x, z)) water++;
    const [g, rank] = laneGap(x, z); if (rank > 0) { minGap = Math.min(minGap, g); if (g < 0.3) trafficLane++; }
    if (net && net.cover(x, z, {}) > -0.3) onRoad++;
    for (const q of parkedCars) if (Math.abs(q.x - x) < 3.2 && Math.abs(q.z - z) < 3.2) { parked++; break; }
  }
  const gy = ph.groundHeight(p.x, p.z, 10, false);
  const cx = p.x + sy * S.centerZ, cz = p.z + cy * S.centerZ;
  const side = (k) => { let free = 0; for (const f of [-S.len / 2 + 0.5, 0, S.len / 2 - 0.5]) { const x = cx + sy * f + lx * k * (S.W / 2 + 1.0), z = cz + cy * f + lz * k * (S.W / 2 + 1.0); if (!solid(x, z, y) && !L.insideBuilding(x, z)) free++; } return free; };
  let blockedAhead = 0; for (let f = 0.5; f <= 14; f += 0.5) for (const b of [-S.W / 2 - 0.2, 0, S.W / 2 + 0.2]) { const x = p.x + sy * (S.front + f) + lx * b, z = p.z + cy * (S.front + f) + lz * b; if (ph.columnBlocked(x, z, 0.25, y + 0.3, y + 1.2) || L.insideBuilding(x, z)) blockedAhead++; }
  const r = { id: c.id, x: +p.x.toFixed(1), z: +p.z.toFixed(1), yawDeg: +(p.yaw * 180 / Math.PI).toFixed(1), ground: gy === undefined || gy === null ? null : +gy.toFixed(2), building, outside, water, trafficLane, minGapToLane: minGap > 1e8 ? null : +minGap.toFixed(1), onRoadPts: onRoad, parkedNear: parked, freeLeft: side(1), freeRight: side(-1), blockedAhead, solidCentre: c.id === 'spawn' ? null : solid(cx, cz, y) };
  res.push(r);
  if (building || outside) fail(`${c.id}: the footprint touches a building (${building}) or the map edge (${outside})`);      // (water is reachable, CLAUDE.md: a car standing at the water is no failure; `water` stays in the report)
  if (trafficLane) fail(`${c.id}: the footprint is on a traffic lane (${trafficLane} points; gap to the nearest driven lane ${r.minGapToLane} m)`);
  if (!Number.isFinite(gy) || Math.abs(gy) > 0.35) fail(`${c.id}: the ground under the car is ${gy} (street level expected)`);
  if (c.id !== 'spawn' && !r.solidCentre) fail(`${c.id}: the parked car is no solid for the walkers`);
  if (c.id !== 'spawn' && r.freeLeft < 2 && r.freeRight < 2) fail(`${c.id}: no free strip beside the car (left ${r.freeLeft} / right ${r.freeRight})`);
  if (blockedAhead) fail(`${c.id}: the way out 14 m ahead of the nose is blocked (${blockedAhead} samples)`);
  if (parked) fail(`${c.id}: ${parked} footprint points are within 3.2 m of a parked car of the traffic module`);
}
const real = drive.fleet;
/** the clear distance (m) between two parked cars: the largest separation of their oriented footprints (W x len, centred on the body centre) along the four axes of the two rectangles (negative: they overlap) */
function carGap(a, b) {
  const box = (v) => { const p = v.parked, S = v.spec, sy = Math.sin(p.yaw), cy = Math.cos(p.yaw); return { cx: p.x + sy * S.centerZ, cz: p.z + cy * S.centerZ, ax: [[sy, cy, S.len / 2], [cy, -sy, S.W / 2]] }; };
  const A = box(a), B = box(b); let best = -1e9;
  for (const [nx, nz] of [...A.ax, ...B.ax].map((q) => [q[0], q[1]])) {
    const rad = (X) => X.ax.reduce((s, [ux, uz, h]) => s + h * Math.abs(ux * nx + uz * nz), 0);
    best = Math.max(best, Math.abs((B.cx - A.cx) * nx + (B.cz - A.cz) * nz) - rad(A) - rad(B));
  }
  return best;
}
for (let i = 0; i < real.length; i++) for (let j = i + 1; j < real.length; j++) {
  const a = real[i], b = real[j], gap = carGap(a, b);
  if (gap < 0.6) fail(`${a.id}-${b.id}: the cars are ${gap.toFixed(2)} m apart (>= 0.6 expected)`);
}
// docs/AREAS.md 13.4: the four cars stand ONLY at the central station; an area whose territory does not contain the station (no ST rectangle in its registry row) holds ONE car, the purple Zhiguli
{
  const { REGISTRY } = await import(pathToFileURL(path.join(root, 'src/areas/registry.js')).href), row = REGISTRY[process.env.AREA || 'strip'], hasStation = !row || !row.play || row.play.some((r) => r.name === 'ST') || process.env.AREA === 'north';
  const want = hasStation ? 'coupe,truck,lada,roadster' : 'lada';
  if (real.map((v) => v.id).join() !== want) fail(`the garage must hold ${want.replaceAll(',', ', ')} (got ${real.map((v) => v.id)})`);
}
for (const r of res) console.log(JSON.stringify(r));

// ---------------------------------------------------------------- the ASCII map
const mi = process.argv.indexOf('--map');
if (mi > 0) {
  const [x0, z0, x1, z1] = process.argv.slice(mi + 1, mi + 5).map(Number), step = Number(process.argv[mi + 5]) > 0 ? Number(process.argv[mi + 5]) : 2;
  const mark = new Map(); for (const c of cars) { if (c.id === 'spawn') continue; const p = c.p; const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw); for (let a = -2; a <= 2; a += 1) mark.set(`${Math.round((p.x + sy * a) / step)},${Math.round((p.z + cy * a) / step)}`, c.id[0]); }
  console.log(`map x ${x0}..${x1}, z ${z0}..${z1}, ${step} m per character (letters c t l r = the garage cars)`);
  for (let z = z0; z <= z1; z += step) {
    let row = String(z).padStart(6) + ' ';
    for (let x = x0; x <= x1; x += step) {
      const m = mark.get(`${Math.round(x / step)},${Math.round(z / step)}`); let ch = '.';
      if (m) ch = m;
      else if (L.insideBuilding(x, z)) ch = 'B';
      else if (L.inRiver(x, z)) ch = '~';
      else if (parkedCars.some((q) => Math.abs(q.x - x) < step * 0.8 && Math.abs(q.z - z) < step * 0.8)) ch = 'T';
      else { const [g, rank] = laneGap(x, z); if (rank > 0 && g < 0) ch = String(rank); else if (net && net.cover(x, z, {}) > -0.3) ch = '='; else if (ph.columnBlocked(x, z, 0.3, 0.3, 1.2)) ch = '#'; }
      row += ch;
    }
    console.log(row);
  }
}
for (const p of problems) console.log('  -', p);
console.log(problems.length ? 'RESULT: FAIL' : 'RESULT: OK');
process.exit(problems.length ? 1 : 0);
