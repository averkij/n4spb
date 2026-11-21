// landmarksF/portico.js - the three pedimented porticos of Kazan Cathedral (north = the great portico towards Nevsky, 6 columns across; west = the main entrance, 6 x 2 columns with end piers; south,
// 6 x 2) on stepped granite platforms (8 / 9 / 8 steps of 0.15 m), with entablature, pediment (gilded sunburst in the tympanum) and the doors in the wall behind.  All built in a frame with the wall
// line at z = 0 and +z pointing out of the church (kit frame): north = P.push(0, 0, 41.3, PI), west = P.push(-41.5, 0, 72.9, -PI/2), south = P.push(0, 0, 98, 0) of the model frame.
import * as THREE from 'three';
import { column, texBox, figure } from './prims.js';
import { boxAt, walkAt, cylAt, W, ROT } from './frame.js';

const GROUND = 0;

/** generic portico in the frame (+z out, wall at z = 0).  o: { half (half width of the entablature), xs: column centres, rows: [z of each column row (front first)], yFloor, nSteps, platform (depth of the flat part), colH, rise (pediment), piers: half-width of solid end piers or 0 } */
export function portico(K, o, frameAt) {
  const P = K.P, M = K.M;
  const { half, xs, rows, yFloor, nSteps, platform, colH = 14.0, rise } = o;
  const run = 0.45, rs = yFloor / nSteps, zf = platform + nSteps * run;
  const yc = yFloor + colH, yA = yc + 1.15, yF = yA + 1.2, yD = yF + 0.4, yT = yD + 1.0;       // architrave / frieze / dentils / corona tops
  const zfront = rows[0] + 1.55;                                                              // front of the entablature
  // ---- platform + steps (treads and risers only, one cheek wall per side)
  P.box(M.step, -half - 0.8, half + 0.8, GROUND, yFloor, 0, platform, 'kft');                 // the flat platform (its top is drawn as a floor below)
  P.quad(M.floor, [-half - 0.8, yFloor, 0], [half + 0.8, yFloor, 0], [half + 0.8, yFloor, platform], [-half - 0.8, yFloor, platform], [0, 1, 0], [[0, 0], [(2 * half + 1.6) / 3, 0], [(2 * half + 1.6) / 3, platform / 3], [0, platform / 3]]);
  for (let k = 1; k <= nSteps; k++) {
    const zk = zf - run * (k - 1), y0 = rs * (k - 1), y1 = rs * k, x0 = -half - 0.8, x1 = half + 0.8;
    P.quad(M.step, [x0, y0, zk], [x1, y0, zk], [x1, y1, zk], [x0, y1, zk], [0, 0, 1], [[0, y0], [(x1 - x0) / 3, y0], [(x1 - x0) / 3, y1], [0, y1]]);                         // riser
    P.quad(M.floor, [x0, y1, zk - run], [x1, y1, zk - run], [x1, y1, zk], [x0, y1, zk], [0, 1, 0], [[0, 0], [(x1 - x0) / 3, 0], [(x1 - x0) / 3, run / 3], [0, run / 3]]);        // tread (the top one is 0.45 m deep in front of the platform edge)
    for (const [xx, nn] of [[x0, -1], [x1, 1]]) P.quad(M.step, [xx, 0, zk - run], [xx, 0, zk], [xx, y1, zk], [xx, y1, zk - run], [nn, 0, 0]);
  }
  // ---- columns
  for (const z of rows) for (const x of xs) { column(P, M, x, yFloor, z, colH); K.cols.push([x, z, 'p']); }
  // ---- entablature (one box per level, full width, projecting to the front)
  const x0 = -half, x1 = half;
  P.box(M.stoneWarm, x0, x1, yc, yA, 0, zfront - 0.1, 'k');
  P.box(M.stoneShade, x0 - 0.1, x1 + 0.1, yA, yF, 0, zfront - 0.05, 'k');
  texBox(P, M.dentil, x0 - 0.3, x1 + 0.3, yF, yD, 0, zfront + 0.3, 0.9, 0.4, yF, 'k');
  P.box(M.stoneWarm, x0 - 0.6, x1 + 0.6, yD, yT, 0, zfront + 0.7, 'k');
  // medallions (three rings) on the frieze: the same tile as the colonnade, one per bay
  P.quad(M.rings, [x0 + 0.2, yA + 0.1, zfront - 0.01], [x1 - 0.2, yA + 0.1, zfront - 0.01], [x1 - 0.2, yF - 0.1, zfront - 0.01], [x0 + 0.2, yF - 0.1, zfront - 0.01], [0, 0, 1], [[0, 0.04], [(x1 - x0) / 4.9, 0.04], [(x1 - x0) / 4.9, 0.96], [0, 0.96]]);
  // ---- pediment: solid prism, recessed tympanum with the sunburst, raking cornice frame
  const hw = half + 0.6, apex = yT + rise;
  const tri = new THREE.Shape(); tri.moveTo(-hw, yT); tri.lineTo(hw, yT); tri.lineTo(0, apex); tri.lineTo(-hw, yT);
  P.extrude(M.stoneWarm, tri, 0, zfront + 0.7 - 0.55, 1, 4);
  const ib = yT + 0.34, ia = apex - 0.36;
  // Leave stone all around the opening, including at its two acute corners.
  const iw = hw * (ia - ib) / rise;
  const inner = new THREE.Shape(); inner.moveTo(-iw, ib); inner.lineTo(iw, ib); inner.lineTo(0, ia); inner.lineTo(-iw, ib);
  const g = new THREE.ShapeGeometry(inner, 1), pa = g.attributes.position, ua = g.attributes.uv;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) + iw) / (2 * iw), (pa.getY(i) - ib) / (ia - ib));
  P.geo(M.sun, g, 0, 0, zfront + 0.7 - 0.5); g.dispose();                                      // tympanum face 5 cm in front of the prism cap
  const outer = new THREE.Shape(); outer.moveTo(-hw - 0.15, yT); outer.lineTo(hw + 0.15, yT); outer.lineTo(0, apex + 0.45); outer.lineTo(-hw - 0.15, yT);
  const hole = new THREE.Path(); hole.moveTo(-iw, ib); hole.lineTo(0, ia); hole.lineTo(iw, ib); hole.lineTo(-iw, ib); outer.holes.push(hole);
  P.extrude(M.stoneWarm, outer, zfront + 0.7 - 0.62, 0.62 + 0.12, 1, 4);
  if (o.gildedRays) {
    // Gilded fan on the Nevsky front. Clip each ray to the sloping stone cornice.
    const cy = ib + 0.23, depth = zfront + 0.87, slope = (ia - ib) / iw;
    for (let ray = 0; ray <= 32; ray++) {
      const theta = (ray + 0.6) * Math.PI / 33.2;
      const dx = Math.cos(theta), dy = Math.sin(theta);
      const length = (ia - cy - 0.08) / (dy + slope * Math.abs(dx)) * (ray % 2 ? 0.83 : 1);
      const point = (r, w, z) => [r * dx - w * dy, cy + r * dy + w * dx, z];
      P.fan(M.gold, [point(0.32, -0.04, depth), point(length * 0.62, -0.135, depth),
        point(length, 0, depth + 0.06), point(length * 0.62, 0.135, depth),
        point(0.32, 0.04, depth)], [0, 0, 1]);
    }
  }
  // ---- solid end piers (west portico)
  if (o.piers) for (const sg of [-1, 1]) P.box(M.stone, sg > 0 ? o.piers : -half, sg > 0 ? half : -o.piers, yFloor, yc, 0, zfront - 0.5, 'kb');
  return { yT, apex, zf, zfront, yc, rs };
}

/** colliders of a portico in the frame of `at` = model {mx, mz, rot}: step walk boxes, column cylinders are added by the caller from K.cols */
export function porticoColliders(K, o, at) {
  const ph = K.ctx.physics, run = 0.45, rs = o.yFloor / o.nSteps, c = Math.cos(at.rot), s = Math.sin(at.rot), half = o.half + 0.8, zf = o.platform + o.nSteps * run;
  const loc = (x, z) => [at.mx + x * c + z * s, at.mz - x * s + z * c];
  for (let k = 1; k <= o.nSteps; k++) {
    const zc = zf - run * (k - 1) - run / 2, [mx, mz] = loc(0, zc);
    walkAt(ph, mx, mz, 2 * half, run, at.rot, rs * k, -1);
  }
  const [mx, mz] = loc(0, o.platform / 2);
  walkAt(ph, mx, mz, 2 * half, o.platform, at.rot, o.yFloor, -1);
}

export function porticos(K) {
  const P = K.P, M = K.M;
  const defs = {
    north: { gildedRays: true, half: 14.6, xs: [-12.25, -7.35, -2.45, 2.45, 7.35, 12.25], rows: [4.4, 0.95], yFloor: 1.2, nSteps: 8, platform: 5.5, rise: 4.5, at: { mx: 0, mz: 41.3, rot: Math.PI } },
    west: { half: 15.5, xs: [-11.5, -6.9, -2.3, 2.3, 6.9, 11.5], rows: [6.6, 2.4], yFloor: 1.35, nSteps: 9, platform: 7.75, rise: 5.0, piers: 13.2, at: { mx: -41.5, mz: 72.9, rot: -Math.PI / 2 } },
    south: { half: 12.3, xs: [-10.2, -6.12, -2.04, 2.04, 6.12, 10.2], rows: [4.9, 1.2], yFloor: 1.2, nSteps: 8, platform: 6.1, rise: 4.0, at: { mx: 0, mz: 98.0, rot: 0 } },
  };
  K.porticos = {};
  for (const [name, o] of Object.entries(defs)) {
    const beforeCols = K.cols.length;
    P.push(o.at.mx, 0, o.at.mz, o.at.rot);
    const r = portico(K, o);
    if (name === 'north') northWall(K, o, r);
    if (name === 'west') westWall(K, o, r);
    if (name === 'south') southWall(K, o, r);
    P.pop();
    // columns were pushed in the portico frame: convert them to model coordinates for the colliders
    const c = Math.cos(o.at.rot), s = Math.sin(o.at.rot);
    for (let i = beforeCols; i < K.cols.length; i++) { const [x, z] = K.cols[i]; K.cols[i] = [o.at.mx + x * c + z * s, o.at.mz - x * s + z * c, 'p']; }
    porticoColliders(K, o, o.at);
    K.porticos[name] = { ...o, ...r };
  }
}

// ------------------------------------------------------------------------------------------------ doors and wall decoration behind the porticos (frame: wall at z = 0, +z out)
const doorLeaf = (P, mat, x, y0, w, h, z = 0.1) => P.box(mat, x - w / 2, x + w / 2, y0, y0 + h, z - 0.1, z, 'kb');
function northWall(K, o, r) {
  const P = K.P, M = K.M, yF = o.yFloor;
  // the Florentine gate: 2 x 5 bronze panels in a stone door-case, black panel above, two kneeling angels
  const dw = 3.6, dh = 7.2, y0 = yF;
  P.box(M.stoneWarm, -dw / 2 - 0.55, dw / 2 + 0.55, y0, y0 + dh + 0.8, 0, 0.22, 'kb');
  P.box(M.bronze, -dw / 2, dw / 2, y0, y0 + dh, 0.2, 0.3, 'kb');
  for (let c = 0; c < 2; c++) for (let rw = 0; rw < 5; rw++) P.box(M.patina, -dw / 2 + 0.2 + c * (dw / 2 - 0.1), -dw / 2 + 0.2 + c * (dw / 2 - 0.1) + dw / 2 - 0.5, y0 + 0.25 + rw * 1.4, y0 + 1.25 + rw * 1.4, 0.3, 0.34, 'kb');
  P.box(M.bronze, -dw / 2 + 0.15, dw / 2 - 0.15, y0 + dh + 0.1, y0 + dh + 0.7, 0.22, 0.28, 'kb');
  P.box(M.black, -4.2, 4.2, y0 + dh + 1.2, y0 + dh + 3.3, 0, 0.12, 'kb');                      // black rectangular panel over the door
  for (const sg of [-1, 1]) { P.box(M.bronzeStatue, sg * 1.2 - 0.3, sg * 1.2 + 0.3, y0 + dh + 0.8, y0 + dh + 1.7, 0.2, 0.7, 'b'); }
  // side wooden doors and black panels
  for (const sg of [-1, 1]) {
    const x = sg * 9.6;
    P.box(M.stoneWarm, x - 1.35, x + 1.35, y0, y0 + 4.6, 0, 0.18, 'kb'); doorLeaf(P, M.door, x, y0, 2.0, 4.0, 0.3);
    P.box(M.black, x - 1.9, x + 1.9, y0 + 7.0, y0 + 10.4, 0, 0.1, 'kb');
  }
  // niches with the four bronze statues (two beside the great door, two further out): half-domed recesses
  for (const x of [-6.2, 6.2]) {
    P.box(M.stoneShade, x - 1.15, x + 1.15, y0 + 1.4, y0 + 6.2, 0, 0.1, 'kb');
    P.box(M.black, x - 0.95, x + 0.95, y0 + 1.5, y0 + 5.6, 0.1, 0.14, 'kb');
    figure(P, M.bronzeStatue, x, y0 + 1.5, 0.45, 0, 3.2, 'saint');
  }
  // relief panels between the doors and niches
  for (const x of [-3.4, 3.4]) P.quad(M.relief, [x - 0.9, y0 + 7.8, 0.06], [x + 0.9, y0 + 7.8, 0.06], [x + 0.9, y0 + 10.5, 0.06], [x - 0.9, y0 + 10.5, 0.06], [0, 0, 1], [[0, 0], [0.5, 0], [0.5, 1], [0, 1]]);
  void r;
}
function westWall(K, o, r) {
  const P = K.P, M = K.M, y0 = o.yFloor;
  // main entrance: a big doorway (3.4 x 6.4) with brown leaves in a stone case; two side doors (2 x 4); relief panels on the end piers
  if (K.interior) { for (const sg of [-1, 1]) P.box(M.stoneWarm, sg > 0 ? 1.8 : -2.35, sg > 0 ? 2.35 : -1.8, y0, y0 + 7.7, 0, 0.2, 'kb'); P.box(M.stoneWarm, -2.35, 2.35, y0 + 7.0, y0 + 7.7, 0, 0.2, 'kb'); }
  else P.box(M.stoneWarm, -2.3, 2.3, y0, y0 + 7.4, 0, 0.2, 'kb');
  for (const x of [-7.2, 7.2]) { P.box(M.stoneWarm, x - 1.4, x + 1.4, y0, y0 + 4.9, 0, 0.18, 'kb'); doorLeaf(P, M.door, x, y0, 2.0, 4.2, 0.3); }
  for (const x of [-3.8, 3.8]) P.box(M.black, x - 1.1, x + 1.1, y0 + 5.2, y0 + 9.2, 0, 0.1, 'kb');
  for (const sg of [-1, 1]) {
    const x = sg * o.piers - sg * 0.04;                                                    // relief panel on the inner face of each end pier
    P.quad(M.relief, [x, y0 + 4.6, 1.3], [x, y0 + 4.6, 6.3], [x, y0 + 9.2, 6.3], [x, y0 + 9.2, 1.3], [-sg, 0, 0], [[0, 0], [1.3, 0], [1.3, 1], [0, 1]]);
  }
  void r;
}
function southWall(K, o, r) {
  const P = K.P, M = K.M, y0 = o.yFloor;
  P.box(M.stoneWarm, -2.0, 2.0, y0, y0 + 6.4, 0, 0.18, 'kb'); doorLeaf(P, M.door, 0, y0, 2.8, 5.6, 0.3);
  for (const x of [-6.5, 6.5]) P.box(M.black, x - 1.5, x + 1.5, y0 + 5.2, y0 + 9.0, 0, 0.1, 'kb');
  void r;
}
void W; void ROT; void boxAt; void cylAt;
