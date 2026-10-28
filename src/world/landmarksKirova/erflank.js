// landmarksKirova/erflank.js - the FLANKS, the REAR and the ROOFS of the Erarta museum (frame FE), from the box partition VOLE (erarta2.js; vol.js finds the exposed wall runs so that no wall is drawn
// twice and the outline of the footprint is closed, docs/rules/FACADE-INTEGRITY.md).  Every exposed run gets: the granite plinth, the yellow rusticated base with window rows (floors 1-2, real reveals),
// the base cornice 9.4 .. 10.1, the beige ashlar upper floors with three window rows and, where the run reaches the top of its volume, the crown cornice with dentils.
// Roofs: the red-orange hipped sheet-steel roofs (satellite: the main block and the north wing), flat roofs with parapets on the pavilions and the stair bump, brick chimneys, roof lights and a few vents;
// downpipes in pale yellow at the pavilion / wing corners (photo er03).  Windows 1.5 m wide in rows at the storey heights of erwin.js (fl1 .. fl5).
import { ER, FE } from './frame.js';
import { exposed } from './vol.js';
import { opOf, fixture, crown, baseCornice } from './erwin.js';
import { windowed } from './erfront.js';
import { windowWall } from './facade.js';

const hash = (x, k = 0) => (Math.abs(Math.round(x * 13) * 31 + k * 17) >>> 0) % 97;
const FRONT_DONE = new Set(['pavS', 'wingS', 'wingN', 'pavN', 'cbBase', 'cb', 'cb2']);
/** frame of a run on side s of volume v: Parts push (origin, rotY) and the map from the run coordinate a to the local x */
function sideFrame(v, s, a0, a1) {
  if (s === 'f') return { x: a0, z: v.z[1], rot: 0, loc: (a) => a - a0 };
  if (s === 'k') return { x: a1, z: v.z[0], rot: Math.PI, loc: (a) => a1 - a };
  if (s === 'l') return { x: v.x[0], z: a0, rot: -Math.PI / 2, loc: (a) => a - a0 };
  return { x: v.x[1], z: a1, rot: Math.PI / 2, loc: (a) => a1 - a };
}

function run(K, v, s, r) {
  const { P, M } = K, f = sideFrame(v, s, r.a0, r.a1), len = r.a1 - r.a0, ya = r.ya, yb = r.yb, top = Math.abs(yb - v.h) < 0.01;
  P.push(f.x, 0, f.z, f.rot);
  const z = 0;
  // granite plinth (flush, with a polished cap)
  if (ya < ER.plinth - 0.01) {
    P.quad(M.eGranite, [0, ya, z], [len, ya, z], [len, Math.min(yb, ER.plinth), z], [0, Math.min(yb, ER.plinth), z], [0, 0, 1], [[0, ya / 1.2], [len / 2.4, ya / 1.2], [len / 2.4, Math.min(yb, ER.plinth) / 1.2], [0, Math.min(yb, ER.plinth) / 1.2]]);
    if (yb > ER.plinth + 0.2) P.box(M.eGraniteDark, 0, len, 1.27, 1.39, z, z + 0.12, 'k', 2);
  }
  // base with windows
  const bya = Math.max(ya, ER.plinth), byb = Math.min(yb, ER.corniceTop), n = Math.max(0, Math.floor((len - 1.2) / 3.7));
  const cs = n ? Array.from({ length: n }, (_, i) => (i + 0.5) * len / n) : [];
  if (byb - bya > 0.2) {
    const ops = [];
    for (const x of cs) for (const k of ['fl1', 'fl2']) { const o = opOf(M, k, x, hash(x + r.a0, k.length), {}); if (o.y0 >= bya + 0.4 && o.y1 <= byb - 0.4) ops.push(o); }
    windowed(K, { x0: 0, x1: len, ya: bya, yb: byb, z, tu: 1.8, tv: 1.0, wall: M.eRust, ops, depth: 0.22 });
    if (ya < 9.4 && yb >= ER.corniceTop - 0.01) baseCornice(P, M, 0, len, z);
  }
  // upper floors
  const uya = Math.max(ya, ER.corniceTop);
  if (yb - uya > 0.3) {
    const ops = [];
    for (const x of cs) for (const k of ['fl3', 'fl4', 'fl5']) { const o = opOf(M, k, x, hash(x + r.a0, 5 + k.length), {}); if (o.y0 >= uya + 0.5 && o.y1 <= yb - 1.5) ops.push(o); }
    windowed(K, { x0: 0, x1: len, ya: uya, yb, z, tu: 2.8, tv: 1.4, wall: M.eAshlar, ops, depth: 0.22 });
    if (top && yb - uya > 2.2 && v.h >= 22) crown(P, M, 0, len, z, yb);
  }
  P.pop();
}

/** the flat roof of a volume (a cap inside a 0.25 m parapet of the wall material) */
function flatRoof(K, v, y, parapet = true) {
  const { P, M } = K, [x0, x1] = v.x, [z0, z1] = v.z;
  P.cap(M.roof, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y, true, 2);
  void parapet;
}

/** a four-sided hip over the rectangle [xa, xb] x [za, zb] (the eaves are on the rectangle: callers include the overhang), base height ye, ridge inset by half of the shorter side, red sheet steel with standing seams */
function hipRoof(K, xa, xb, za, zb, ye, rise) {
  const { P, M } = K, k = Math.min(xb - xa, zb - za) / 2;
  const A = [xa, ye, za], B = [xb, ye, za], C = [xb, ye, zb], D = [xa, ye, zb];
  const rA = [xa + k, ye + rise, za + k], rB = [xb - k, ye + rise, za + k], rC = [xb - k, ye + rise, zb - k], rD = [xa + k, ye + rise, zb - k];
  const sl = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const q = (p0, p1, p2, p3, n) => P.quad(M.eRoofSheet, p0, p1, p2, p3, n, [[0, 0], [sl(p0, p1) / 2, 0], [sl(p3, p2) / 2, sl(p0, p3) / 2], [0, sl(p0, p3) / 2]]);
  q(A, B, rB, rA, [0, 0.6, -1]); q(C, D, rD, rC, [0, 0.6, 1]); q(D, A, rA, rD, [-1, 0.6, 0]); q(B, C, rC, rB, [1, 0.6, 0]);
  if (rB[0] - rA[0] > 0.05 && rD[2] - rA[2] > 0.05) P.quad(M.eRoofSheet, rA, rB, rC, rD, [0, 1, 0]);
}

function chimney(K, x, z, y, h = 3.2) {
  const { P, M } = K;
  P.box(M.eBrick, x - 0.6, x + 0.6, y, y + h, z - 0.6, z + 0.6, 'b', 1.2); P.box(M.eRoofTrim, x - 0.75, x + 0.75, y + h, y + h + 0.18, z - 0.75, z + 0.75, 'b', 2);
}


/** service details on the rear (r' -36.75) and the north end (q' 44.75): steel doors with flat canopies and two steps, condenser boxes under the second-floor windows, a drain pipe, a cable tray */
function serviceDetails(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const door = (frameRot, ox, oz, u, w = 1.5) => {
    P.push(ox, 0, oz, frameRot);
    P.box(M.eDoorFrame, u - w / 2 - 0.08, u + w / 2 + 0.08, 0, 2.3, 0, 0.16, 'b', 1);                         // (the frame stands in front of the 0.12 m granite cap of the plinth)
    P.box(M.eSteelDoor, u - w / 2, u + w / 2, 0.02, 2.2, 0.14, 0.18, 'b', 1);
    P.box(M.eSteelDoor, u + w / 2 - 0.2, u + w / 2 - 0.12, 0.95, 1.2, 0.18, 0.26, '', 1);
    P.box(M.eRoofTrim, u - w / 2 - 0.3, u + w / 2 + 0.3, 2.45, 2.55, 0.0, 0.9, '', 1);                        // the flat canopy
    P.box(M.eStair, u - w / 2 - 0.2, u + w / 2 + 0.2, 0, 0.17, 0.1, 0.55, 'b', 2); P.box(M.eStair, u - w / 2 - 0.2, u + w / 2 + 0.2, 0, 0.34, 0.1, 0.3, 'b', 2);
    P.pop();
  };
  const ac = (frameRot, ox, oz, u, y) => { P.push(ox, 0, oz, frameRot); P.box(M.eRoofTrim, u - 0.45, u + 0.45, y, y + 0.7, 0.0, 0.38, 'k', 1); P.box(M.eLampBlack, u - 0.38, u + 0.38, y + 0.08, y + 0.62, 0.38, 0.4, '', 1); P.pop(); };
  for (const q of [-34.73, -24.54, -9.52, 4.22]) door(Math.PI, q, ER.rear, 0);
  for (const q of [-32.24, -42.2, -21.93, -2.65, 6.51]) ac(Math.PI, q, ER.rear, 0, 5.1);
  for (const q of [-37.22, -16.71]) ac(Math.PI, q, ER.rear, 0, 9.5);
  P.push(-29.75, 0, ER.rear, Math.PI); P.cyl(M.eDrain, [0, 1.4, 0.1], [0, 21.5, 0.1], 0.07, 0.07, 6, false); P.pop();
  P.push(ER.pavN[1], 0, -6, Math.PI / 2); door(0, 0, 0, 0, 1.6); P.pop();                                       // a service door at the north end of the north pavilion (inner frame call keeps the local axes)
  for (const q of [-34.73, -24.54, -9.52, 4.22]) { const p = FE.W(q, ER.rear - 0.6); ph.addBox(p.x, p.z, 2.2, 1.0, FE.rot, 0, 0.5); }
}

export function build(K, VOLE) {
  const { P, M } = K;
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKirova] erflank/${name}:`, e); throw e; } };
  stage('walls', () => { for (const v of VOLE) for (const s of ['f', 'k', 'l', 'r']) { if (s === 'f' && FRONT_DONE.has(v.id)) continue; for (const r of exposed(VOLE, v, s)) run(K, v, s, r); } });
  stage('roofs', () => {
    const V = (id) => VOLE.find((q) => q.id === id);
    // hips on the eave line = the wall line (+0.3 overhang at the free sides); the front strips between the hip and the wing cornice are flat gutters
    hipRoof(K, ER.wingS[0], 9.1, ER.rear - 0.3, -2.7, ER.wingCornice, 3.4);
    hipRoof(K, 9.1, ER.pavN[0], -14.6, -3.0, ER.wingCornice, 2.6);
    for (const [xa, xb, za, zb] of [[ER.wingS[0], ER.wingS[1], -2.7, ER.wingSR], [ER.wingN[0], ER.wingN[1], -3.0, ER.wingNR]]) P.cap(M.roof, [[xa, za], [xb, za], [xb, zb], [xa, zb]], ER.wingCornice, true, 2);
    for (const v of VOLE) if (v.id === 'pavS' || v.id === 'pavN' || v.id === 'bump' || v.id === 'cb2') flatRoof(K, v, v.h);
    chimney(K, -33.0, -24.0, 24.0); chimney(K, -20.0, -31.0, 24.0); chimney(K, 2.0, -30.0, 24.0, 3.6); chimney(K, 34.0, -8.0, 22.0); chimney(K, 25.0, -17.0, 24.0, 2.6);
    for (const [x, z] of [[-38, -10], [-37, -26], [30, -5], [38, -9]]) { P.box(M.eRoofTrim, x - 0.9, x + 0.9, 23.0, 23.5, z - 0.7, z + 0.7, 'b', 1); }          // roof lights / vents on the flat roofs
  });
  stage('railing', () => {
    // the thin safety railing along the front roof edge of the north pavilion (kv374): posts every 2 m, two rails, 1.0 m high, 0.8 m behind the crown cornice
    const x0 = ER.pavN[0] + 0.5, x1 = ER.pavN[1] - 0.5, z = ER.pavNR - 0.8, y = ER.pavCornice, n = Math.max(2, Math.round((x1 - x0) / 2));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; P.box(M.eLetterFrame, x - 0.025, x + 0.025, y, y + 1.0, z - 0.025, z + 0.025, 'b', 1); }
    for (const h of [0.5, 1.0]) P.box(M.eLetterFrame, x0, x1, y + h - 0.02, y + h + 0.02, z - 0.02, z + 0.02, '', 1);
  });
  stage('service', () => serviceDetails(K));
  stage('pipes', () => {
    // pale yellow downpipes at the inner corners of the pavilions (photo er03 shows one on the north wing)
    for (const [x, z, y] of [[ER.pavS[1] - 0.25, ER.wingSR + 0.15, 22.0], [ER.pavN[0] + 0.25, ER.wingNR + 0.15, 22.0], [ER.wingN[1] - 0.25, ER.wingNR + 0.15, 22.0]]) P.cyl(M.eDrain, [x, 1.4, z], [x, y - 0.4, z], 0.065, 0.065, 6, false);
  });
  void fixture; void windowWall;
}
