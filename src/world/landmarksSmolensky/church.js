// landmarksSmolensky/church.js - the CHURCH OF THE SMOLENSK ICON OF THE MOTHER OF GOD (Смоленская церковь, Kamskaya 24; A. A. Ivanov 1786-90, early Russian classicism; OSM w30351796 + the church shop w312980917).
// Dossier docs/research/smolensky.md section 4 (corrected by the critic: facade scale 52 px/m), photos refs/smolensky 99 (frontal, summer: the base of every number), 108 106 107 c06 08.
// Frame CH (frame.js): X runs WSW along the 45.1 m long body (apse at X 0 in the east, bell tower at X 45.1), Z towards the cemetery (NNW); the south face looks to -Z.  Built here: the plinth, the sky-blue volumes
// (refectory X 22.4..40.6, south arm X 4.1..22.4, north arm, central cube X 7.2..22.4 x Z 6.2..21.0, apse, north chapel, narthex wings), the cornices, the zinc roofs, the SIX-column portico (axes X 7.78 / 9.33 / 12.95 /
// 16.55 / 20.17 / 21.72, d 1.2, capital top 6.0, entablature 6.0..7.5, pediment 16.3 m wide with the apex at 10.4, rosette frieze, modillions, radiant-cross tympanum), the chestnut door under the front-gabled canopy with
// its five granite steps, the fan-archivolt windows (5 on the refectory at pitch 3.7, the arm windows, the north side repeats the south), the 14-bay drum (7 glazed windows alternating with 7 blind niches), the
// ribbed silver dome (rise 3.5), the 8-window lantern, the ribbed onion and the gilded cross (cross top 27.7 m).  The bell tower is tower.js.  Plaques: visitor hours, protected monument (art.js).
// Everything on the walls is a thin decal / ring proud of the wall plane by 3-17 cm (no coplanar faces); volumes share no coplanar overlapping faces.
import * as L from '../layout.js';
import { CH, CH_OUT, ringIn } from './frame.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { ringEdges, band, polyOf } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';

const B = 0.8, WALL = 7.4, CORN = 8.0, SW = 1.2, RIDGE_REF = 11.0, DX = 14.75, DZ = 13.6;
const ring2flat = (r) => r.flat();

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  P.push(CH.x, 0, CH.z, CH.rot);
  plinth(P, M);
  volumes(P, M);
  roofs(P, M);
  southFront(K);
  sides(P, M);
  dome(P, M);
  P.pop();
  // ---- colliders: the footprint without the portico step (the portico is walkable) + columns + the stair
  const out = ringIn(CH, 'w30351796') || CH_OUT;
  const wall = [[1.8, 17.7], [0.5, 13.2], [1.7, 8.3], [4.1, 6.0], [4.1, 1.3], [22.4, 1.2], [40.6, 1.1], [40.6, 5.1], [45.1, 5.1], [45.1, 20.6], [40.7, 20.6], [40.7, 24.6], [22.4, 24.6], [22.4, 27.0], [7.2, 27.1], [7.2, 24.7], [0, 24.7], [0, 17.7]];
  void out;
  const flat = []; for (const [u, v] of wall) { const q = CH.W(u, v); flat.push(q.x, q.z); }
  addPolyColliders(ctx, { o: flat, h: [] }, 0, 20, 0.5);
  for (const X of [7.78, 9.33, 12.95, 16.55, 20.17, 21.72]) CH.cyl(ph, X, 0.7, 0.5, 0, 7.6);
  // the portico floor (+1.0) and the five granite steps (4.6 m wide) between the cheek blocks
  CH.walk(ph, 14.75, 0.45, 15.0, 1.2, 1.0, 0);
  { const c = CH.W(14.75, -1.2); ph.addStairs(c.x, c.z, 4.6, 2.4, CH.rot, 0, 1.0, 5); }
  CH.box(ph, 12.45, -1.2, 0.6, 2.4, 0, 1.1); CH.box(ph, 17.05, -1.2, 0.6, 2.4, 0, 1.1);
  // ---- services
  const door = CH.W(DX, -2.4), tw = CH.W(42.0, 12.9), ctr = CH.W(DX, DZ);
  K.svc.entrances.push({ id: 'church-door', x: door.x, z: door.z, rotY: CH.rot + Math.PI, name: 'Смоленская церковь' });
  K.svc.crowd.push({ id: 'church-portico', x: CH.W(DX, -5).x, z: CH.W(DX, -5).z, r: 4, n: 6, kind: 'visitors' });
  const sp = CH.W(DX, -17);
  K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: L.yawToward(sp.x, sp.z, ctr.x, ctr.z), name: 'Смоленская церковь' });
  K.svc.monuments.push({ id: 'w30351796', name: 'Церковь Смоленской иконы Божией Матери', x: ctr.x, z: ctr.z, h: 27.7 });
  K.svc.monuments.push({ id: 'church-bell-tower', name: 'Колокольня Смоленской церкви', x: tw.x, z: tw.z, h: 35.5 });
  void ring2flat;
}

// ------------------------------------------------------------------------------------------------ plinth
function plinth(P, M) {
  const ring = CH_OUT.map((p) => p.slice());
  band(P, ringEdges(polyOf(ring)), 0, B, 0.08, { front: M.plinth, top: M.plinth }, { uvs: 2 });
  P.box(M.stepGranite, 7.1, 22.4, 0, 1.0, 0.0, 1.2, 'b');                              // the portico podium (the OSM step: X 7.1..22.4, Z 0..1.25), top at +1.0
}

// ------------------------------------------------------------------------------------------------ volumes (blue walls, white belts and cornices)
function volumes(P, M) {
  const wall = (x0, x1, z0, z1, top, skip = 'b') => P.box(M.blue, x0, x1, B, top, z0, z1, skip, 2);
  wall(22.4, 40.6, SW, 24.6, WALL, 'bt');                                              // refectory
  wall(4.1, 22.4, SW, 6.2, WALL, 'bt');                                                // south arm (+ the south-east chapel X 4.1..7.2)
  wall(7.2, 22.4, 6.2, 21.0, 12.3, 'b');                                               // central cube
  wall(7.2, 22.4, 21.0, 27.1, WALL, 'bt');                                             // north arm
  wall(0.0, 7.2, 17.7, 24.7, 6.6, 'bt');                                               // north chapel
  apse(P, M);
  wall(38.9, 45.1, 9.8, 16.0, 7.8, 'b');                                               // bell tower base 6.2 m (tower.js draws everything above 7.8)
  wall(40.6, 45.1, 5.1, 9.1, 5.5, 'bt'); wall(40.6, 45.1, 16.7, 20.6, 5.5, 'bt');     // narthex wings
  // white cornices: the double band on the arms and the refectory, the ring on the cube
  const cornice = (x0, x1, z0, z1, y0 = WALL, y1 = CORN, o = 0.42) => {
    P.box(M.white, x0 - o, x1 + o, y0, y1, z0 - o, z1 + o, 'b');
    P.box(M.white, x0 - 0.14, x1 + 0.14, 6.45, 6.62, z0 - 0.14, z1 + 0.14, 'bt');   // the thinner belt about 0.9 m lower
  };
  cornice(22.4, 40.6, SW, 24.6); cornice(4.1, 22.4, SW, 6.2, WALL, 7.9, 0.35); cornice(7.2, 22.4, 21.0, 27.1, WALL, 7.9, 0.35);
  P.box(M.white, 7.2 - 0.35, 22.4 + 0.35, 11.7, 12.3, 6.2 - 0.35, 21.0 + 0.35, 'b');   // cube ring cornice
  P.box(M.white, 0.0 - 0.3, 7.2, 6.6, 7.0, 17.7 - 0.3, 24.7 + 0.3, 'br');
  // tower base cornice
  // chimney / vent stack at the east end of the south arm roof
  P.box(M.blue, 4.7, 5.6, 7.9, 10.0, 3.0, 4.2, 'b'); P.box(M.white, 4.6, 5.7, 10.0, 10.2, 2.9, 4.3, 'b');
}
function apse(P, M) {
  const ring = [[7.2, 6.2], [4.1, 6.0], [1.7, 8.3], [0.5, 13.2], [1.8, 17.7], [7.2, 17.7]];
  // walls: quads per edge.  The ring runs from the south arm round the east end to the north chapel, so the OUTWARD normal of an edge a -> b is (-dz, dx) / l (the review of 2026-10-08 found the first
  // version with (dz, -dx): the walls faced inwards, were culled from outside and the east end showed the nave wall with a floating cornice).  Edge 4 is the junction with the north chapel: not drawn.
  const n = ring.length, out = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); return [-dz / l, dx / l, l]; };
  for (let i = 1; i <= 3; i++) {                                                       // the three faces of the apse (edge 0 and 4 meet the nave / the north chapel)
    const a = ring[i], b = ring[i + 1], [ox, oz, l] = out(a, b);
    P.quad(M.blue, [a[0], B, a[1]], [b[0], B, b[1]], [b[0], 7.0, b[1]], [a[0], 7.0, a[1]], [ox, 0, oz], [[0, 0], [l / 2, 0], [l / 2, 3], [0, 3]]);
  }
  // half-cone roof (grey) and a white cornice ring
  for (let i = 1; i < n - 1; i++) { const a = ring[i], b = ring[i + 1]; P.fan(M.zinc, [[a[0], 7.0, a[1]], [b[0], 7.0, b[1]], [3.0, 9.0, 12.0]], [0, 0.8, 0.2], (p) => [p[0], p[2]]); }
  P.fan(M.zinc, [[7.2, 7.0, 6.2], [4.1, 7.0, 6.0], [3.0, 9.0, 12.0], [7.2, 9.0, 12.0]], [0, 1, 0], (p) => [p[0], p[2]]);
  for (let i = 1; i <= 3; i++) { const a = ring[i], b = ring[i + 1], [nx, nz] = out(a, b);
    P.quad(M.white, [a[0] + nx * 0.3, 6.6, a[1] + nz * 0.3], [b[0] + nx * 0.3, 6.6, b[1] + nz * 0.3], [b[0] + nx * 0.3, 7.0, b[1] + nz * 0.3], [a[0] + nx * 0.3, 7.0, a[1] + nz * 0.3], [nx, 0, nz]); }
  // three small arched lattice windows, one on each face of the apse (dossier default [?])
  for (let i = 1; i <= 3; i++) {
    const a = ring[i], b = ring[i + 1], [nx, nz] = out(a, b), mx = (a[0] + b[0]) / 2 + nx * 0.04, mz = (a[1] + b[1]) / 2 + nz * 0.04;
    P.push(mx, 0, mz, Math.atan2(nx, nz));
    if (i === 2) { G.planeShape(P, M.blueDark, G.archPts(0, 1.7, 1.2, 3.1, 8), 0.04); S.archRing(P, M.white, 0, 1.7, 1.2, 3.1, 0.16, 0, 0.12); }                   // the blind niche between two windows
    else { G.planeShape(P, M.latt, G.archPts(0, 1.7, 1.2, 3.1, 8), 0.04); S.fanHood(P, M, 0, 1.7, 1.2, 3.1, { b: 0.15, n: 9 }); }
    P.box(M.iron, -0.3, 0.3, 0.9, 1.25, 0, 0.08, ''); P.box(M.white, -0.8, 0.8, 1.45, 1.7, 0, 0.18, '');
    P.pop();
    
  }
}

// ------------------------------------------------------------------------------------------------ roofs
function roofs(P, M) {
  const gable = (alongX, a0, a1, c, eaveY, ridgeY, half, over = 0.45) => {
    // ridge along X (alongX) from a0 to a1 at coordinate c of the other axis; slopes fall to c +- half at eaveY; overhang `over` at the eaves (slope continued)
    const k = (ridgeY - eaveY) / half, ye = eaveY - k * over, hh = half + over;
    const v = (t, y, s) => (alongX ? [t, y, c + s * hh] : [c + s * hh, y, t]);
    const r = (t) => (alongX ? [t, ridgeY, c] : [c, ridgeY, t]);
    const up = (s) => (alongX ? [0, 1, s * k] : [s * k, 1, 0]);
    const nrm = (s) => { const q = up(s), l = Math.hypot(...q); return q.map((x) => x / l); };
    const uvf = (p) => [p[0] / 1.0, p[2] / 1.0];
    for (const s of [-1, 1]) P.quad(M.zinc, v(a0, ye, s), v(a1, ye, s), r(a1), r(a0), nrm(s), [v(a0, ye, s), v(a1, ye, s), r(a1), r(a0)].map(uvf));
  };
  gable(true, 22.4, 40.6, 12.9, 7.95, RIDGE_REF, 11.7);                                // refectory (ridge along X at Z 12.9)
  // gable-end triangles of the refectory at X = 40.6 (hidden behind the tower in the middle)
  P.fan(M.blue, [[40.6, 7.4, 1.2], [40.6, 7.4, 24.6], [40.6, RIDGE_REF, 12.9]], [1, 0, 0], (p) => [p[2], p[1]]);
  // arms: ridge along Z at X = 14.75 (south arm from the pediment base to the cube, north arm from the cube to its end)
  gable(false, 6.2, 0.2, DX, 7.55, 10.4, 7.9, 0.0);
  gable(false, 21.0, 27.5, DX, 7.55, 10.4, 7.9, 0.0);
  // gable end of the north arm (blue triangle)
  P.fan(M.blue, [[6.8, 7.4, 27.1], [22.7, 7.4, 27.1], [DX, 10.4, 27.1]], [0, 0, 1], (p) => [p[0], p[1]]);
  // south-east chapel (X 4.1..7.2): a small hip, ridge 7.2
  roofHip(P, M.zinc, 3.8, 7.5, 0.9, 6.5, 6.4, 7.6);
  // north chapel (X 0..7.2, Z 17.7..24.7): hip, ridge 8.4
  roofHip(P, M.zinc, -0.3, 7.5, 17.4, 25.0, 6.9, 8.6);
  // narthex wings: shed roofs rising to the tower base
  roofHip(P, M.zinc, 40.3, 45.4, 4.8, 9.1, 5.5, 6.6); roofHip(P, M.zinc, 40.3, 45.4, 16.7, 20.9, 5.5, 6.6);
  // cube top (flat ring round the drum)
  P.quad(M.zinc, [7.2, 12.3, 21.0], [22.4, 12.3, 21.0], [22.4, 12.3, 6.2], [7.2, 12.3, 6.2], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}
/** a simple hip over a rectangle: eave at y0 on (x0..x1, z0..z1), ridge line at y1 along the long axis */
function roofHip(P, mat, x0, x1, z0, z1, y0, y1) {
  const alongX = (x1 - x0) >= (z1 - z0), w = alongX ? z1 - z0 : x1 - x0, ins = w / 2;
  const cx0 = alongX ? x0 + ins : (x0 + x1) / 2, cx1 = alongX ? x1 - ins : (x0 + x1) / 2, cz0 = alongX ? (z0 + z1) / 2 : z0 + ins, cz1 = alongX ? (z0 + z1) / 2 : z1 - ins;
  const q = (a, b, c, d, n) => P.quad(mat, a, b, c, d, n, [a, b, c, d].map((p) => [p[0], p[2]]));
  const k = (y1 - y0) / ins, nl = Math.hypot(1, k);
  q([x0, y0, z1], [x1, y0, z1], [cx1, y1, cz1], [cx0, y1, cz1], [0, 1 / nl, k / nl]);
  q([x1, y0, z0], [x0, y0, z0], [cx0, y1, cz0], [cx1, y1, cz0], [0, 1 / nl, -k / nl]);
  q([x1, y0, z1], [x1, y0, z0], [cx1, y1, cz0], [cx1, y1, cz1], [k / nl, 1 / nl, 0]);
  q([x0, y0, z0], [x0, y0, z1], [cx0, y1, cz1], [cx0, y1, cz0], [-k / nl, 1 / nl, 0]);
}

// ------------------------------------------------------------------------------------------------ the south front
const onSouth = (P, fn) => G.onFace(P, 45.1, SW, 0, -1, fn);                           // x' = 45.1 - X, z' = out (towards -Z)
function southFront(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const xs = (X) => 45.1 - X;
  // ---- portico (z' measured from the wall plane Z = 1.2; the columns stand at Z 0.7, i.e. z' = 0.5)
  onSouth(P, () => {
    const COLS = [7.78, 9.33, 12.95, 16.55, 20.17, 21.72].map(xs), zc = 0.5, y0 = 1.0;
    for (const x of COLS) S.column(P, M, x, zc, y0, 6.0, 0.475, { mat: M.white, seg: 14 });          // shaft 0.95 m at the foot, 0.80 m under the capital (sd289 / nw09; the dossier's 1.2 m is refuted)
    // entablature 6.0 .. 7.5 : architrave 0.45, frieze 0.75, cornice 0.3; spans the 16.3 m pediment base X 6.6 .. 22.9
    const x0 = xs(22.9), x1 = xs(6.6);
    P.box(M.white, x0 + 0.5, x1 - 0.5, 6.0, 6.45, 0.0, 1.05, 'b');                    // architrave
    P.box(M.blue, x0 + 0.5, x1 - 0.5, 6.45, 7.2, 0.0, 0.95, '');                      // frieze (blue ground)
    P.box(M.white, x0, x1, 7.2, 7.5, 0.0, 1.35, 'b');                                 // cornice
    S.modillions(P, M.white, x0 + 0.3, x1 - 0.3, 7.2, 0.0, 0.8, 0.22, 0.26, 1.33);
    for (let i = 0; i < 12; i++) { const x = x0 + 1.2 + (x1 - x0 - 2.4) * (i + 0.5) / 12; P.quad(M.rosette, [x - 0.3, 6.55, 0.97], [x + 0.3, 6.55, 0.97], [x + 0.3, 7.1, 0.97], [x - 0.3, 7.1, 0.97], [0, 0, 1]); }
    // pediment: base 7.5, rise 2.9, apex 10.4; tympanum blue with the radiant cross and the clouds
    S.pediment(P, M.blue, M.white, x0, x1, 7.5, 2.9, 0.6, { th: 0.3 });
    P.quad(M.glory, [(x0 + x1) / 2 - 2.3, 7.8, 0.64], [(x0 + x1) / 2 + 2.3, 7.8, 0.64], [(x0 + x1) / 2 + 2.3, 9.0, 0.64], [(x0 + x1) / 2 - 2.3, 9.0, 0.64], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // a small gilded cross over the entrance axis on the entablature
    S.crossOn(P, M.goldFlat, xs(14.75), 7.5, 0.5, 0.7);
    // ---- the entrance: door 2.6 x 3.2 chestnut in a 0.3 m recess flanked by lanterns, front-gabled zinc canopy 7.0 m wide (eave 5.3, ridge 5.9, projecting 2.3 m), posts 4.5 m apart
    const dx = xs(14.75);
    P.box(M.chestnut, dx - 1.4, dx + 1.4, 1.0, 4.4, -0.05, 0.04, '');                // the door reveal
    P.quad(M.door, [dx - 1.3, 1.0, 0.07], [dx + 1.3, 1.0, 0.07], [dx + 1.3, 4.2, 0.07], [dx - 1.3, 4.2, 0.07], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const s of [-1, 1]) { P.box(M.iron, dx + s * 1.5 - 0.07, dx + s * 1.5 + 0.07, 3.0, 3.4, 0.07, 0.25, ''); }
    canopy(P, M, dx);
  });
  // ---- refectory south wall: 5 windows at X 23.4 .. 38.2 (pitch 3.7), arm windows at X 6.0, 11.1, 18.4 (fan archivolts), plaques
  onSouth(P, () => {
    const wins = [6.0, 11.1, 18.4, 23.4, 27.1, 30.8, 34.5, 38.2];
    for (const X of wins) {
      const x = xs(X), z = (X > 22.4 || X < 7.2) ? 0 : 0;
      S.archPane(P, M.latt, x, 1.6 + B - 0.8, 1.35, 3.3, z + 0.04);
      S.fanHood(P, M, x, 1.6, 1.35, 3.3, { b: 0.17, n: 9 });
      P.box(M.white, x - 0.95, x + 0.95, 1.42, 1.6, 0, 0.22, '');
    }
    // plaques on the refectory wall (about X 33.0 and X 31.8, 2.0 .. 2.8 m above the ground)
    P.quad(M.churchHours, [xs(33.0) - 0.2, 2.0, 0.03], [xs(33.0) + 0.2, 2.0, 0.03], [xs(33.0) + 0.2, 2.75, 0.03], [xs(33.0) - 0.2, 2.75, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.churchPlate, [xs(31.7) - 0.25, 1.9, 0.03], [xs(31.7) + 0.25, 1.9, 0.03], [xs(31.7) + 0.25, 2.55, 0.03], [xs(31.7) - 0.25, 2.55, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // two drain pipes
    for (const X of [21.0, 39.8]) P.col(M.pipe, xs(X), 0.08, 1.0, 7.4, 0.07, 0.07, 6, false);
  });
  void ctx;
}
/** the front-gabled grey zinc canopy: ridge pointing out of the wall, two thin black posts, wood-lined underside (frame: x right, z out of the wall) */
function canopy(P, M, dx) {
  const w = 3.5, zOut = 2.3, eave = 5.3, ridge = 5.9, y0 = 1.0;
  const v = (s, z, y) => [dx + s * w, y, z];
  for (const s of [-1, 1]) {
    P.quad(M.canopy, v(s, 0.05, eave), v(s, zOut, eave), [dx, ridge, zOut], [dx, ridge, 0.05], [0, 1, -s * 0.0 + 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  P.fan(M.canopy, [v(-1, zOut, eave), v(1, zOut, eave), [dx, ridge, zOut]], [0, 0, 1], (p) => [p[0], p[1]]);              // front gable (thin plate)
  P.quad(M.woodLine, v(-1, 0.05, eave - 0.04), v(1, 0.05, eave - 0.04), v(1, zOut, eave - 0.04), v(-1, zOut, eave - 0.04), [0, -1, 0]);   // wood-lined underside
  for (const s of [-1, 1]) P.col(M.iron, dx + s * 2.25, zOut - 0.15, y0, eave - 0.05, 0.05, 0.05, 6, false);
  // the granite steps: 5 risers from the plaza (0) to the landing (+1.0), 4.6 m wide, between 0.6 m cheek blocks
  for (let i = 0; i < 5; i++) { const zf = zOut + 0.0 - (i + 1) * 0.46 + 0.46; P.box(M.stepGranite, dx - 2.3, dx + 2.3, 0, 0.2 * (5 - i), zOut - 0.05 - (i + 1) * 0.46 + 0.0, zOut - 0.05 - i * 0.46, 'b'); void zf; }
  for (const s of [-1, 1]) P.box(M.stepGranite, dx + s * 2.6 - 0.3, dx + s * 2.6 + 0.3, 0, 1.1, 0.0, zOut + 0.2, 'b');
}

// ------------------------------------------------------------------------------------------------ north / east / west sides
function sides(P, M) {
  const wins = (fn, xs, y0 = 1.6) => fn((frameUnused) => { void frameUnused; });
  void wins;
  // north wall of the refectory: the south pattern repeated (5 windows X 23.4 .. 38.2); the facade frame: x' = X - 22.4, out towards +Z
  G.onFace(P, 22.4, 24.6, 0, 1, () => {
    for (const X of [23.4, 27.1, 30.8, 34.5, 38.2]) { const x = X - 22.4; S.archPane(P, M.latt, x, 1.6, 1.35, 3.3, 0.04); S.fanHood(P, M, x, 1.6, 1.35, 3.3, { b: 0.17, n: 9 }); P.box(M.white, x - 0.95, x + 0.95, 1.42, 1.6, 0, 0.22, ''); }
  });
  // north arm wall (Z = 27.1): three windows
  G.onFace(P, 7.2, 27.1, 0, 1, () => {
    for (const X of [11.1, 14.75, 18.4]) { const x = X - 7.2; S.archPane(P, M.latt, x, 1.6, 1.35, 3.3, 0.04); S.fanHood(P, M, x, 1.6, 1.35, 3.3, { b: 0.17, n: 9 }); P.box(M.white, x - 0.95, x + 0.95, 1.42, 1.6, 0, 0.22, ''); }
  });
  // west wall of the narthex (X = 45.1, the main west door): arched door 2.2 x 3.0 with steps, x' = 20.6 - Z
  G.onFace(P, 45.1, 20.6, 1, 0, () => {
    const x = 20.6 - 12.9;
    P.box(M.white, x - 1.5, x + 1.5, 0.0, 0.0, 0, 0, '');
    G.planeShape(P, M.doorWest, G.archPts(x, 0.8, 2.0, 3.1, 8), 0.05);
    S.archRing(P, M.white, x, 0.8, 2.0, 3.1, 0.2, 0, 0.2);
  });
  // blind niches on the east wall of the south arm (X 4.1 face): two arched niches facing east, plus one window on the east face of the north chapel
  G.onFace(P, 4.1, 6.0, -1, 0, () => { S.archPane(P, M.white, 1.9, 1.6, 1.35, 3.3, 0.04); S.fanHood(P, M, 1.9, 1.6, 1.35, 3.3, { b: 0.17, n: 9 }); });
}

// ------------------------------------------------------------------------------------------------ drum, dome, lantern
function dome(P, M) {
  const seg = 14, rD = 7.3, rf = rD * Math.cos(Math.PI / seg), y0 = 12.3, y1 = 16.1, a0 = Math.PI - Math.PI * 2 / (2 * seg);
  G.tube(P, M.blue, DX, DZ, y0, y1, rD, rD, seg, 1, 1, { a0, capBot: null });
  // the 14 bays: even = glazed fan-light window, odd = blind white niche (face centres at angle PI + i * 2 PI / 14, facing south at i = 0)
  for (let i = 0; i < seg; i++) {
    const t = Math.PI + i * Math.PI * 2 / seg, fx = DX + Math.sin(t) * (rf + 0.0), fz = DZ + Math.cos(t) * (rf + 0.0);
    P.push(fx, 0, fz, t);
    if (i % 2 === 0) { S.archPane(P, M.paneDrum, 0, 12.95, 1.5, 3.0, 0.05); S.archRing(P, M.white, 0, 12.95, 1.5, 3.0, 0.2, 0, 0.18); }
    else { G.planeShape(P, M.white, G.archPts(0, 12.95, 1.5, 3.0, 8), 0.03); S.archRing(P, M.white, 0, 12.95, 1.5, 3.0, 0.2, 0, 0.12); }
    P.pop();
    // narrow piers between the bays: a light-blue drain pipe
    const t2 = t + Math.PI / seg, px = DX + Math.sin(t2) * (rD + 0.06), pz = DZ + Math.cos(t2) * (rD + 0.06);
    P.col(M.pipe, px, pz, 12.5, 15.9, 0.05, 0.05, 5, false);
  }
  G.tube(P, M.white, DX, DZ, 15.85, 16.35, 7.55, 7.55, seg, 1, 1, { a0, capTop: M.white });          // cornice ring of the drum
  // the dome: silver ribbed sheet, base r 7.2, rise 3.5
  const Rs = (7.2 * 7.2 + 3.5 * 3.5) / (2 * 3.5), tMax = Math.asin(7.2 / Rs), prof = [];
  for (let i = 0; i <= 16; i++) { const t = tMax * (1 - i / 16); prof.push([Rs * Math.sin(t) / 7.2, (Rs * Math.cos(t) - Rs * Math.cos(tMax)) / 3.5]); }
  G.lathe(P, M.sheet, 'smol-dome', prof, DX, 16.35, DZ, 7.2, 3.5, 28, 18);
  // lantern: 8-sided blue drum d 3.4 with 8 windows, grey ring cornice and grey skirt
  const yl0 = 16.35 + 3.5 - 0.05, yl1 = yl0 + 2.5;
  G.tube(P, M.sheet, DX, DZ, yl0 - 0.1, yl0 + 0.35, 2.05, 1.85, 16, 1, 1, { capTop: null });
  G.tube(P, M.blue, DX, DZ, yl0 + 0.35, yl1 - 0.3, 1.7, 1.7, 8, 1, 1, { a0: -Math.PI / 8 });
  for (let i = 0; i < 8; i++) {
    const t = i * Math.PI / 4, r = 1.7 * Math.cos(Math.PI / 8);
    P.push(DX + Math.sin(t) * r, 0, DZ + Math.cos(t) * r, t); S.archPane(P, M.paneLantern, 0, yl0 + 0.7, 0.7, 1.5, 0.04); S.archRing(P, M.white, 0, yl0 + 0.7, 0.7, 1.5, 0.1, 0, 0.1); P.pop();
  }
  G.tube(P, M.sheet, DX, DZ, yl1 - 0.3, yl1 + 0.05, 2.0, 2.0, 16, 1, 1, { capTop: M.sheet });
  G.onion(P, M.sheet, DX, yl1 + 0.05, DZ, 1.04, 1.0, 20, 14);
  S.crossOn(P, M.goldFlat, DX, yl1 + 2.45, DZ, 2.9);
}
