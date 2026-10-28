// landmarksSeaTerminal/top.js - everything that stands ON the roof of the Sea Terminal (dossier 4.7-4.9; photos a01 a04 a07 a10 a16 a17 a18 a23): the CLOCK TOWER block (u 34.4 .. 40.3, v 1.0 .. 15.5, to 39.6) with its black
// ironwork emblem (a black dial 3.8 m across with gold marks, the 6.0 x 1.5 m bar, the shaft, the hanging anchor), its arched screen wing and canopy; the ROOF LETTERING «МОРСКОЙ ВОКЗАЛ» (blue, 23.6 m, on stanchions); the
// PYLON (concrete shaft to y 41 on the SEA face, recessed 1.0 m) with the steel TULIP CUP (41 .. 47.5), the RHOMBIC titanium NEEDLE (34 .. 73.5, its last 3 m split into two plates with a hanging star), the gilded
// ARMILLARY GLOBE (D 2.1 m, three flat bands) and the little three-masted CARAVEL (pennants omitted: no flags); the two ATRIUM LANTERNS (glass, white lattices), the stair heads, vents and masts of the roof, «РЕСТОРАН» on the hall glazing.
// Frame T (u, v, y).  The needle is the skyline (78 m): keep it right from 3 km.
import * as THREE from 'three';
import { T, H, SPINE } from './frame.js';
import { extrudeShape, polyShape } from './geo.js';

const UC = (SPINE.u0 + SPINE.u1) / 2;                        // 37.35: the axis of the spine, the tower and the pylon
const PV = 51.0;                                             // the needle axis (pylon centre v)

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSeaTerminal] top/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  P.push(T.x, 0, T.z, T.rot);
  try {
    stage('tower', () => tower(K));
    stage('emblem', () => emblem(K));
    stage('lettering', () => lettering(K));
    stage('pylon', () => pylon(K));
    stage('cup', () => cup(K));
    stage('needle', () => needle(K));
    stage('globe', () => globe(K));
    stage('caravel', () => caravel(K));
    stage('lanterns', () => lanterns(K));
    stage('roofClutter', () => roofClutter(K));
    stage('skyline', () => skylineKeep(K, [K.M.needleLit, K.M.needleShade, K.M.gold, K.M.goldSide, K.M.cup]));
  } finally { P.pop(); }
  K.svc.needle = { x: T.W(UC, PV).x, z: T.W(UC, PV).z, top: H.top };
  if (errs.length) throw new Error(errs.join('\n'));
}

/** SKYLINE KEEP (review 2026-10-09): core/spatial.js classes a static mesh by its world box; a thin or small one ('M': under 16 m or narrower than 2.5 m; 'S': under 5 m) is hidden beyond ~900 m / ~350 m (x the quality
 *  scale), while a large one ('L') is carried by its sector's far proxy at any distance.  The needle (1.5 x 40 m), the cup and the gilded tip are THE skyline of the Gavan shore (photos a21 a24: seen from the Bay at 2-4 km),
 *  and without this they vanished beyond 900 m (the pylon stump stood alone at 1.9 km).  A zero-area triangle across the building (three collinear points) keeps their material buckets in class L; it draws nothing. */
function skylineKeep(K, mats) {
  const P = K.P;
  for (const mat of new Set(mats)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 100, 29, 55, 50, 14.5, 27.5], 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 2));
    g.setIndex([0, 1, 2]);
    P.geo(mat, g); g.dispose();
  }
}

/** a vertical box on the roof (u0..u1, v0..v1, y0..y1) with concrete walls and a roof cap */
function block(P, M, u0, u1, v0, v1, y0, y1, wallMat, capMat) {
  const w = u1 - u0, d = v1 - v0, hh = y1 - y0;
  const uvw = (a, b) => [[0, y0 / 4], [a / 2, y0 / 4], [a / 2, y1 / 4], [0, y1 / 4]];
  P.quad(wallMat, [u0, y0, v0], [u1, y0, v0], [u1, y1, v0], [u0, y1, v0], [0, 0, -1], uvw(w));                           // NE side (facing -v)
  P.quad(wallMat, [u1, y0, v1], [u0, y0, v1], [u0, y1, v1], [u1, y1, v1], [0, 0, 1], uvw(w));                            // SW side
  P.quad(wallMat, [u0, y0, v1], [u0, y0, v0], [u0, y1, v0], [u0, y1, v1], [-1, 0, 0], uvw(d));                           // NW side
  P.quad(wallMat, [u1, y0, v0], [u1, y0, v1], [u1, y1, v1], [u1, y1, v0], [1, 0, 0], uvw(d));                            // SE side
  if (capMat) P.quad(capMat, [u0, y1, v1], [u1, y1, v1], [u1, y1, v0], [u0, y1, v0], [0, 1, 0], [[u0 / 2, v1 / 2], [u1 / 2, v1 / 2], [u1 / 2, v0 / 2], [u0 / 2, v0 / 2]]);
  void hh;
}

// ------------------------------------------------------------------------------------------------ the clock tower
function tower(K) {
  const P = K.P, M = K.M, y0 = H.roof, y1 = H.tower;
  block(P, M, SPINE.u0, SPINE.u1, 1.0, 15.5, y0, y1, M.concrete, M.roofGrey);
  // a parapet lip on the top (0.3 m) and the stair head / antenna base
  P.box(M.concreteLight, SPINE.u0 - 0.1, SPINE.u1 + 0.1, y1, y1 + 0.25, 0.9, 15.6, 'b', 2);
  // the WING on the SE side (CRITIC [?]): a thin screen wall in the NE plane, 2.7 m wide and 6.5 m tall, with an arched opening 2.0 m wide, and an open canopy slab along the SE flank
  const wu0 = SPINE.u1, wu1 = SPINE.u1 + 2.7;
  const arch = Array.from({ length: 8 }, (_, i) => { const a = Math.PI - i / 7 * Math.PI; return [1.35 + Math.cos(a) * 1.0, 3.6 + Math.sin(a) * 1.0]; });
  const shape = polyShape([[0, 0], [0.35, 0], [0.35, 3.6]].concat(arch.slice(1, 7)).concat([[2.35, 3.6], [2.35, 0], [2.7, 0], [2.7, 5.6], [0, 6.5]]));
  const g = extrudeShape(shape, 0.4, 2, 6);
  // the shape lives in (x = along +u, y up), extruded along +z = +v: stand it at v 1.0 .. 1.4, reading from the NE
  P.push(wu0, y0, 1.0, 0); P.geo(M.concrete, g, 0, 0, 0); P.pop(); g.dispose();
  P.box(M.concrete, wu0, wu1, y0 + 5.8, y0 + 6.3, 1.0, 11.0, 'b', 2);                                  // the canopy slab (top at ~34.7)
  P.box(M.concrete, wu1 - 0.45, wu1 - 0.05, y0, y0 + 5.8, 10.4, 10.8, 'b', 2);                         // its thin leg
}

// ------------------------------------------------------------------------------------------------ the emblem on the NE face of the tower: dial, bar, shaft, anchor on two chains (black iron)
function emblem(K) {
  const P = K.P, M = K.M, cy = H.roof + 6.4;                    // dial centre y 34.8 (5.8 m above the parapet 29.0)
  P.push(UC, 0, 1.0, Math.PI);                                  // x to the right as seen from the NE, y up, z OUT of the face (toward -v)
  try {
    const R = 1.9;
    // the bar behind the dial (6.0 x 1.5 m, 0.3 m thick), the dial rim and its face, the shaft below it
    P.box(M.iron, -3.0, 3.0, cy - 0.75, cy + 0.75, 0.04, 0.34, 'k', 1);
    P.cyl(M.iron, [0, cy, 0.04], [0, cy, 0.4], R + 0.12, R + 0.12, 28, false);
    const pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; pts.push([Math.cos(a) * R, cy + Math.sin(a) * R, 0.405]); }
    P.fan(M.dial, pts, [0, 0, 1], (p) => [(p[0] / (2 * R)) + 0.5, ((p[1] - cy) / (2 * R)) + 0.5]);
    P.box(M.iron, -0.4, 0.4, 29.0, cy - R + 0.05, 0.04, 0.34, 'k', 1);
    // the anchor: shackle ring at 29.0, shank to 25.2, stock at 28.1, two arms curving up to the flukes (tips y 26.6, x +-1.7), bottom at y 24.6 (1 m below the roof edge)
    const aZ0 = 0.06, aZ1 = 0.4;
    P.box(M.iron, -0.17, 0.17, 25.0, 28.8, aZ0, aZ1, 'k', 1);
    P.box(M.iron, -1.3, 1.3, 27.9, 28.25, aZ0 + 0.04, aZ1 - 0.04, 'k', 1);
    for (const s of [-1, 1]) {
      const g = polyShape([[s * 0.1, 24.6], [s * 1.0, 24.9], [s * 1.7, 26.4], [s * 1.95, 26.55], [s * 1.55, 25.6], [s * 1.7, 26.9], [s * 1.2, 26.1], [s * 0.45, 25.2]].map((p) => p));
      const ge = extrudeShape(g, aZ1 - aZ0, 1, 4); P.geo(M.iron, ge, 0, 0, aZ0); ge.dispose();
    }
    P.cyl(M.iron, [0, 28.8, aZ0 + 0.17], [0, 29.5, aZ0 + 0.17], 0.2, 0.2, 10, false);
    // the two chains from the lower corners of the bar to the stock (thin tubes)
    for (const s of [-1, 1]) P.cyl(M.iron, [s * 2.9, cy - 0.6, 0.2], [s * 1.25, 28.2, 0.2], 0.05, 0.05, 4, false);
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ roof lettering on the NE parapet, reading from the NE: u 94.0 .. 70.4, baseline y 29.5 (CRITIC); РЕСТОРАН on the hall glazing
function lettering(K) {
  const P = K.P, M = K.M, ctx = K.ctx;
  const sA = 98.0 - 94.0, sB = 98.0 - 70.4, y0 = H.parapet + 0.5 - 0.28, y1 = y0 + 2.77;
  P.push(98.0, 0, 0, Math.PI);                                   // the NE face frame (x right as seen from the lot, z out)
  try {
    const z = 0.3;
    P.quad(M.letters, [sA, y0, z], [sB, y0, z], [sB, y1, z], [sA, y1, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the back: the same plate reading correctly from the roof / the sea side (a stage-set shortcut: no mirrored text)
    P.quad(M.letters, [sB, y0, z - 0.04], [sA, y0, z - 0.04], [sA, y1, z - 0.04], [sB, y1, z - 0.04], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // stanchions: steel posts 0.5 m every 3.9 m
    for (let s = sA + 0.6; s < sB; s += 3.9) P.box(M.steel, s - 0.05, s + 0.05, H.parapet, H.parapet + 0.55, z - 0.06, z + 0.02, 'b', 1);
    // РЕСТОРАН: u 24 .. 32, y 10 .. 12.5 on the hall glazing (the plane d = -1.0), a decal 4 cm in front of it; reserved through the label registry (world centre, outward normal = -v)
    const lab = ctx.services && ctx.services.labels, wc = T.W(28, 0.96);
    if (!lab || lab.reserve('r6702553', wc.x, 11.25, wc.z, 8.0, 2.5, -T.B[0], -T.B[1], 'sign')) {
      P.quad(M.restoran, [98 - 24, 10, -0.96], [98 - 32, 10, -0.96], [98 - 32, 12.5, -0.96], [98 - 24, 12.5, -0.96], [0, 0, 1], [[1, 0], [0, 0], [0, 1], [1, 1]]);
    }
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ pylon, cup, needle, globe, caravel
function pylon(K) {
  const P = K.P, M = K.M;
  // the shaft above the roof: u 34.4 .. 40.3, v 47.3 .. 54.7 (its SW face continues the recessed spine face v = 54.7), y 28.4 .. 41; a flat cap with the needle rising out of it
  block(P, M, SPINE.u0, SPINE.u1, 47.3, 54.7, H.roof, H.shaft, M.concrete, M.concrete);
  // the narrow glazed slit (0.8 m) on the SW face and the lit arched slot at the foot (decals, 3 cm in front of the face)
  const vf = 54.7 + 0.03;
  P.quad(M.glassDark, [UC - 0.4, 12, vf], [UC + 0.4, 12, vf], [UC + 0.4, 36, vf], [UC - 0.4, 36, vf], [0, 0, 1]);
  P.quad(M.glassDark, [UC - 1.0, 6.0, vf], [UC + 1.0, 6.0, vf], [UC + 1.0, 11, vf], [UC - 1.0, 11, vf], [0, 0, 1]);
}

function cup(K) {
  const P = K.P, M = K.M, y0 = H.shaft, y1 = H.cupTop;
  // the two horn plates on the u ends (0.35 m thick, leaning outward by 0.8 m at the top), the back plate on the NE side, the front U (two strips + a bar)
  for (const s of [-1, 1]) {
    const uIn = s < 0 ? SPINE.u0 : SPINE.u1, ub = uIn - s * 0.0, uo = ub + s * 0.35, lean = s * 0.8;
    // inner / outer faces and edges (a parallelogram prism): bottom at y0 spans u ub..uo, top is shifted by `lean` outward
    const va = 47.3, vb = 54.7;
    P.quad(M.cup, [ub, y0, va], [ub, y0, vb], [ub + lean, y1, vb], [ub + lean, y1, va], [-s, 0, 0]);
    P.quad(M.cup, [uo, y0, vb], [uo, y0, va], [uo + lean, y1, va], [uo + lean, y1, vb], [s, 0, 0]);
    P.quad(M.cup, [ub, y0, va], [ub + lean, y1, va], [uo + lean, y1, va], [uo, y0, va], [0, 0, -1]);
    P.quad(M.cup, [uo, y0, vb], [uo + lean, y1, vb], [ub + lean, y1, vb], [ub, y0, vb], [0, 0, 1]);
    P.quad(M.cup, [ub + lean, y1, va], [ub + lean, y1, vb], [uo + lean, y1, vb], [uo + lean, y1, va], [0, 1, 0]);
  }
  P.box(M.cup, SPINE.u0, SPINE.u1, y0, y1, 47.3, 47.65, 'b', 2);                                // the back plate
  P.box(M.cup, SPINE.u0, SPINE.u0 + 0.8, y0, y1, 54.35, 54.7, 'b', 2); P.box(M.cup, SPINE.u1 - 0.8, SPINE.u1, y0, y1, 54.35, 54.7, 'b', 2);
  P.box(M.cup, SPINE.u0, SPINE.u1, y0, y0 + 1.4, 54.35, 54.7, 'b', 2);                          // the U of the front plate
  // the dark recess behind the horns (the cup's floor, seen from the side through the bullet-shaped opening)
  P.quad(M.glassDark, [SPINE.u0 + 0.4, y0 + 0.02, 47.7], [SPINE.u1 - 0.4, y0 + 0.02, 47.7], [SPINE.u1 - 0.4, y0 + 0.02, 54.3], [SPINE.u0 + 0.4, y0 + 0.02, 54.3], [0, 1, 0]);
}

/** a rhombic (diamond-section) frustum along y: long diagonal along u (half a), short along v (half b) at the bottom, scaled to the top; faces in two shades */
function rhomb(P, matA, matB, yb, yt, a0, a1, k, c) {
  const b0 = a0 * k, b1 = a1 * k, [cu, cv] = c;
  const B = [[cu + a0, cv], [cu, cv - b0], [cu - a0, cv], [cu, cv + b0]], Tp = [[cu + a1, cv], [cu, cv - b1], [cu - a1, cv], [cu, cv + b1]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4, mx = (B[i][0] + B[j][0]) / 2 - cu, mz = (B[i][1] + B[j][1]) / 2 - cv;
    P.quad(i < 2 ? matA : matB, [B[i][0], yb, B[i][1]], [B[j][0], yb, B[j][1]], [Tp[j][0], yt, Tp[j][1]], [Tp[i][0], yt, Tp[i][1]], [mx, 0.05, mz]);
  }
}

function needle(K) {
  const P = K.P, M = K.M, y0 = H.shaft, y1 = 70.5, yFoot = H.needleLo, yTop = H.needleTop;
  // diagonal 1.5 m at y 34 narrowing to 0.3 m at 73.5 (linear): half diagonal along u at height y
  const half = (y) => 0.75 + (0.15 - 0.75) * (y - yFoot) / (yTop - yFoot);
  rhomb(P, M.needleLit, M.needleShade, y0, y1, half(y0), half(y1), 0.55, [UC, PV]);
  // a flat cap on the shaft (the needle rises through the cup; the cup floor is drawn in cup.js)
  // the last 3 m: two flat plates (0.32 m wide, 0.5 m apart), a grey riveted one and a gilded one (photo a10), joined at their foot by a small block
  P.box(M.needleShade, UC - 0.17, UC + 0.17, y1 - 0.1, y1 + 0.35, PV - 0.3, PV + 0.3, 'b', 1);
  P.box(M.needleShade, UC - 0.16, UC + 0.16, y1 + 0.3, yTop + 0.6, PV - 0.31, PV - 0.25, 'b', 1);
  P.box(M.gold, UC - 0.16, UC + 0.16, y1 + 0.3, yTop + 0.6, PV + 0.25, PV + 0.31, 'b', 1);
  // the gilded star hanging between the plates (0.9 m), a flat extrusion
  const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.18 : 0.45; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const sg = extrudeShape(polyShape(pts), 0.05, 1, 2);
  P.push(UC, 71.2, PV - 0.025, 0); P.geo(M.gold, sg); P.pop(); sg.dispose();
}

function globe(K) {
  const P = K.P, M = K.M, cy = H.globeY;
  const sph = new THREE.SphereGeometry(1.05, 20, 14);
  P.geo(M.gold, sph, UC, cy, PV); sph.dispose();
  // three flat hammered bands: D 3.4 horizontal-ish (tilt 15 deg), D 3.0 (tilt 60 deg) and D 2.7 (85 deg)
  for (const [R, rx, rz, ry] of [[1.7, 0.26, 0, 0], [1.5, 0, 1.05, 0.3], [1.35, 1.48, 0, 1.2]]) {
    const g = new THREE.CylinderGeometry(R, R, 0.25, 28, 1, true);
    P.geo(M.goldSide, g, UC, cy, PV, rx, ry, rz); g.dispose();
  }
}

function caravel(K) {
  const P = K.P, M = K.M, y0 = H.shipKeel, cx = UC, cz = PV;
  // the post, the hull (a profile shape 1.6 x 0.5 m extruded 0.5 m), a dark/gold checker band is a darker strip, three masts with square sails (flat, 0.5 x 0.55 m)
  P.cyl(M.gold, [cx, H.globeY + 1.2, cz], [cx, y0 + 0.05, cz], 0.05, 0.05, 6, false);
  const hull = polyShape([[-0.8, 0.3], [-0.55, 0.0], [0.55, 0.0], [0.82, 0.32], [0.55, 0.42], [-0.7, 0.42]]);
  const gh = extrudeShape(hull, 0.5, 1, 2);
  P.push(cx, y0, cz - 0.25, 0); P.geo(M.gold, gh); P.pop(); gh.dispose();
  P.box(M.iron, cx - 0.62, cx + 0.62, y0 + 0.2, y0 + 0.3, cz - 0.255, cz + 0.255, 'b', 1);
  for (const [dx, h, sw] of [[-0.45, 0.95, 0.45], [0.05, 1.2, 0.55], [0.5, 0.9, 0.4]]) {
    P.cyl(M.gold, [cx + dx, y0 + 0.4, cz], [cx + dx, y0 + 0.4 + h, cz], 0.02, 0.02, 4, false);
    P.quad(M.goldSide, [cx + dx - sw / 2, y0 + 0.5, cz - 0.04], [cx + dx + sw / 2, y0 + 0.5, cz - 0.04], [cx + dx + sw / 2, y0 + 0.4 + h - 0.1, cz - 0.04], [cx + dx - sw / 2, y0 + 0.4 + h - 0.1, cz - 0.04], [0, 0, -1]);
  }
}

// ------------------------------------------------------------------------------------------------ atrium lanterns: glass pitched roofs on a 0.4 m kerb with white lattices
function lanterns(K) {
  const P = K.P, M = K.M, Y = H.roof;
  const gable = (u0, u1, v0, v1, alongU, ridgeH) => {
    // a gable lantern: eaves at Y + 0.4, ridge at Y + ridgeH; ridge along u (alongU) or along v
    const ye = Y + 0.4, yr = Y + ridgeH;
    P.box(M.concreteLight, u0 - 0.2, u1 + 0.2, Y, ye, v0 - 0.2, v0, 'b', 2); P.box(M.concreteLight, u0 - 0.2, u1 + 0.2, Y, ye, v1, v1 + 0.2, 'b', 2);
    P.box(M.concreteLight, u0 - 0.2, u0, Y, ye, v0, v1, 'b', 2); P.box(M.concreteLight, u1, u1 + 0.2, Y, ye, v0, v1, 'b', 2);
    const vm = (v0 + v1) / 2, um = (u0 + u1) / 2, bar = (a, b, r = 0.07) => P.cyl(M.lanternFrame, a, b, r, r, 4, false);
    if (alongU) {
      P.quad(M.lantern, [u0, ye, v0], [u1, ye, v0], [u1, yr, vm], [u0, yr, vm], [0, 1, -1]); P.quad(M.lantern, [u1, ye, v1], [u0, ye, v1], [u0, yr, vm], [u1, yr, vm], [0, 1, 1]);
      P.fan(M.lantern, [[u0, ye, v0], [u0, ye, v1], [u0, yr, vm]], [-1, 0, 0]); P.fan(M.lantern, [[u1, ye, v1], [u1, ye, v0], [u1, yr, vm]], [1, 0, 0]);
      bar([u0, yr, vm], [u1, yr, vm], 0.1); bar([u0, ye, v0], [u1, ye, v0]); bar([u0, ye, v1], [u1, ye, v1]);
      for (let u = u0; u <= u1 + 0.01; u += (u1 - u0) / 9) { bar([u, ye, v0], [u, yr, vm]); bar([u, ye, v1], [u, yr, vm]); }
    } else {
      P.quad(M.lantern, [u0, ye, v0], [um, yr, v0], [um, yr, v1], [u0, ye, v1], [-1, 1, 0]); P.quad(M.lantern, [u1, ye, v1], [um, yr, v1], [um, yr, v0], [u1, ye, v0], [1, 1, 0]);
      P.fan(M.lantern, [[u0, ye, v0], [um, yr, v0], [u1, ye, v0]], [0, 0, -1]); P.fan(M.lantern, [[u1, ye, v1], [um, yr, v1], [u0, ye, v1]], [0, 0, 1]);
      bar([um, yr, v0], [um, yr, v1], 0.1); bar([u0, ye, v0], [u0, ye, v1]); bar([u1, ye, v0], [u1, ye, v1]);
      for (let v = v0; v <= v1 + 0.01; v += (v1 - v0) / 4) { bar([u0, ye, v], [um, yr, v]); bar([u1, ye, v], [um, yr, v]); }
    }
  };
  gable(12.6, 34.5, 17.8, 40.3, true, 2.2);                                                    // W atrium (22 x 22.5 m)
  for (let k = 0; k < 8; k++) { const w = 33.0 / 8; gable(49.5 + k * w, 49.5 + (k + 1) * w, 17.9, 40.2, false, 1.5); }   // E atrium: eight pitched strips
}

// ------------------------------------------------------------------------------------------------ roof clutter: stair heads, vent boxes, masts, the handrail near the pylon
function roofClutter(K) {
  const P = K.P, M = K.M, Y = H.roof;
  for (const u of [12, 88]) block(P, M, u - 1.5, u + 1.5, 2.8, 5.3, Y, Y + 2.4, M.concreteLight, M.roofGrey);
  for (const u of [24, 50, 64, 76, 92]) block(P, M, u - 0.75, u + 0.75, 5.5, 7.0, Y, Y + 1.2, M.steel, M.roofGrey);
  for (const [u, v] of [[26, 46], [62, 46], [86, 46], [20, 10]]) block(P, M, u - 0.75, u + 0.75, v - 0.75, v + 0.75, Y, Y + 1.1, M.steel, M.roofGrey);
  // the thin handrail along the SW roof edge near the pylon (photo a01): 1.1 m high, from u 4 to 33, v 54.2
  const rl = (u0, u1, v) => { P.cyl(M.steel, [u0, Y + 1.1, v], [u1, Y + 1.1, v], 0.03, 0.03, 4, false); for (let u = u0; u <= u1 + 0.01; u += 3) P.cyl(M.steel, [u, Y, v], [u, Y + 1.1, v], 0.025, 0.025, 4, false); };
  rl(4, 33, 53.9); rl(42, 60, 53.9);
  // antenna whips on the clock tower (two 4 m) and a lattice mast on the NW part of the roof
  for (const [u, v, h] of [[35.4, 14.4, 4.0], [39.3, 14.2, 3.5], [20, 8, 5.5]]) P.cyl(M.steel, [u, u === 20 ? Y : H.tower, v], [u, (u === 20 ? Y : H.tower) + h, v], 0.03, 0.02, 4, false);
}
