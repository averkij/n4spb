// landmarksGavan/kron.js - the two KRONSHPITSES (Кроншпицы Галерной гавани: guard pavilions of 1754, M. A. Bashmakov) at the heads of the moles of the Shkipersky canal, the lawns / aprons / anchor / urn of the east mole and the two
// MChS buildings beside the east pavilion (dossier docs/research/gavan.md section 4; photos refs/gavan 02 03 05 10 12 16 n15).  Frame K (u east, v toward the sea).
//   PAVILION  7.8 x 7.8 m: ashlar plinth 0.6 m, plaster walls to 5.4 m, alternating long / short quoin blocks (0.95 / 0.60 m, nine courses) on the corners, three eared window surrounds per face (the north face of the
//             east pavilion: window / door / window; its west face 2 blind + 1 glazed), a two-step cornice, a four-sided BELL ROOF (square 8.6 m -> octagon, concave-convex profile) with an oval dormer on each slope,
//             an octagonal lantern with eight arched windows, a concave cap, and on the EAST one the white bulb and the bare 22 m needle with its bead; the WEST one has a verdigris roof, a red-brown lantern, no needle, 11.5 m.
//   MOLE      lawn, a granite-sett apron north of the pavilion, six boulders, the black anchor (K 30.5, -6) and the urn on its plinth (K 21.0, -20.0).  The canal wall itself belongs to environment.
//   MChS      w133197170 (white ground floor, graphite upper floor, hipped roof with a glass pyramid) and the hangar r2615813 (pale walls, dark gable roof): boxes on the baked footprints.
// No flags, no flagpoles (the three masts west of the east pavilion are left out).
import * as THREE from 'three';
import * as L from '../layout.js';
import { FK, rectOf, rotOfAng, pairsOf } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { frustum, onion, ball, revolve } from './geo.js';
import { squareToOct, loft, gableRoof, hipRoof, blob } from './prims.js';
import { coverFn, fillPolyClipped } from './surfaces.js';
import { addPolyColliders } from '../lib/massing.js';

export const PAV = { east: { u: 27.0, v: -14.4 }, west: { u: -30.1, v: -13.4 } };
const H = 3.9;                                                          // half the plan
const TAU = Math.PI * 2;
const SIDE = [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]];   // face normals (x, z) and the rotY that turns local +z onto them

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksGavan] kron/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = Q.P, M = Q.M, ph = Q.ctx.physics;
  stage('east', () => FK.on(P, () => { P.push(PAV.east.u, 0, PAV.east.v, 0); pavilion(Q, true); P.pop(); }));
  stage('west', () => FK.on(P, () => { P.push(PAV.west.u, 0, PAV.west.v, 0); pavilion(Q, false); P.pop(); }));
  stage('mole', () => mole(Q));
  stage('mchs', () => mchs(Q));
  stage('colliders', () => {
    FK.box(ph, PAV.east.u, PAV.east.v, 8.0, 8.0, -0.3, 24);
    FK.box(ph, PAV.west.u, PAV.west.v, 8.0, 8.0, -0.3, 13);
  });
  const e = FK.W(PAV.east.u, PAV.east.v), w = FK.W(PAV.west.u, PAV.west.v);
  Q.svc.monuments.push({ id: 'w133197182', name: 'Восточный кроншпиц', x: e.x, z: e.z, h: 22 }, { id: 'w133197155', name: 'Западный кроншпиц', x: w.x, z: w.z, h: 11.5 });
  void M;
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ one pavilion (the Parts frame is at its centre on the ground, axes as K)
function pavilion(Q, east) {
  const P = Q.P, M = Q.M;
  const wall = east ? M.peachE : M.peachW, win = east ? M.winEast : M.winWest, lant = east ? M.lantEast : M.lantWest, oval = east ? M.ovalEast : M.ovalWest;
  const roofM = east ? M.roofWhite : M.verdi, lantWall = east ? M.roofWhite : M.lantRed, rise = east ? 3.0 : 2.3, oct = east ? 2.05 : 1.8;
  // plinth and walls
  P.box(M.plinth, -H - 0.1, H + 0.1, 0, 0.6, -H - 0.1, H + 0.1, 'b', 2);
  P.box(wall, -H, H, 0.6, 5.4, -H, H, 'tb', 4);
  // stringcourse under the frieze, cornice and its crown
  P.box(M.white, -H - 0.04, H + 0.04, 4.55, 4.68, -H - 0.04, H + 0.04, 'tb', 2);
  P.box(M.white, -H - 0.28, H + 0.28, 5.4, 5.64, -H - 0.28, H + 0.28, 'b', 2);
  P.box(M.white, -H - 0.4, H + 0.4, 5.64, 5.9, -H - 0.4, H + 0.4, '', 2);
  // alternating long / short quoin blocks, nine courses on each corner, and the capital band under the cornice
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    for (let i = 0; i < 9; i++) {
      const y0 = 0.6 + i * 0.47 + 0.02, y1 = y0 + 0.43, long = i % 2 === 0, wx = long ? 0.95 : 0.6, wz = long ? 0.6 : 0.95;
      const xa = sx * (H + 0.07), xb = sx * (H - wx), za = sz * (H + 0.07), zb = sz * (H - wz);
      P.box(M.white, Math.min(xa, xb), Math.max(xa, xb), y0, y1, Math.min(za, zb), Math.max(za, zb), 'tb', 1);
    }
    const xa = sx * (H + 0.13), xb = sx * (H - 1.0), za = sz * (H + 0.13), zb = sz * (H - 1.0);
    P.box(M.white, Math.min(xa, xb), Math.max(xa, xb), 4.88, 5.4, Math.min(za, zb), Math.max(za, zb), 'tb', 1);
  }
  // windows (and the door of the east pavilion): panels 3 cm in front of the wall, per face from the left (seen from outside)
  const plan = east
    ? { 0: ['g', 'g', 'g'], 1: ['g', 'b', 'g'], 2: ['g', 'd', 'g'], 3: ['b', 'b', 'g'] }          // +z south: three glazed (n15); +x east [E]; -z north: window / door / window (02); -x west: 2 blind + 1 glazed (03, 05)
    : { 0: ['g', 'g', 'g'], 1: ['g', 'g', 'g'], 2: ['g', 'g', 'g'], 3: ['g', 'g', 'g'] };
  SIDE.forEach(([nx, nz, rot], s) => {
    P.push(0, 0, 0, rot);
    // seen from outside the left-to-right order runs with local +x
    plan[s].forEach((k, i) => {
      const x = (i - 1) * 2.05;
      if (k === 'd') { P.quad(M.doorEast, [x - 0.9, 0.62, H + 0.03], [x + 0.9, 0.62, H + 0.03], [x + 0.9, 4.22, H + 0.03], [x - 0.9, 4.22, H + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); return; }
      const m = k === 'b' ? M.winEastBlind : win;
      P.quad(m, [x - 0.925, 1.1, H + 0.03], [x + 0.925, 1.1, H + 0.03], [x + 0.925, 4.4, H + 0.03], [x - 0.925, 4.4, H + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    });
    P.pop(); void nx; void nz;
  });
  if (!east) {                                                         // the bronze plaque between the first and the second window of the east face (photo 12)
    P.push(0, 0, 0, Math.PI / 2); P.quad(M.plaqueKron, [-1.35, 2.0, H + 0.08], [-0.85, 2.0, H + 0.08], [-0.85, 3.4, H + 0.08], [-1.35, 3.4, H + 0.08], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.pop();
  }
  // the bell roof: nine rings from the square 8.6 m (half 4.3) to the octagon, concave-convex
  const rings = [], N = 9, wOf = (t) => 0.8 * (1 - Math.pow(1 - t, 2.2)) + 0.2 * t;
  for (let i = 0; i <= N; i++) { const t = i / N; rings.push(squareToOct(4.3, oct, wOf(t), 5.9 + rise * t)); }
  loft(P, roofM, rings, { uvs: 3, up: 0.7 });
  // oval dormers: a cartouche panel on each slope at 30 % of the rise
  { const t = 0.3, ra = squareToOct(4.3, oct, wOf(t - 0.04), 5.9 + rise * (t - 0.04)), rb = squareToOct(4.3, oct, wOf(t + 0.04), 5.9 + rise * (t + 0.04)), rc = squareToOct(4.3, oct, wOf(t), 5.9 + rise * t);
    for (let s = 0; s < 4; s++) {
      const [nx, nz, rot] = SIDE[s];
      const out = (r) => (r[2 * s][0] * nx + r[2 * s][2] * nz + r[2 * s + 1][0] * nx + r[2 * s + 1][2] * nz) / 2;
      const dr = out(ra) - out(rb), dy = rise * 0.08, nn = Math.hypot(dr, dy), upY = dy / nn, upZ = -dr / nn, cy = rc[2 * s][1], oz = out(rc);
      P.push(0, 0, 0, rot);
      const q = (x, k) => [x, cy + k * upY + 0.05 * (dr / nn), oz + k * upZ + 0.05 * (dy / nn)];
      P.quad(oval, q(-0.65, -0.5), q(0.65, -0.5), q(0.65, 0.5), q(-0.65, 0.5), [0, dr / nn, dy / nn], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.pop();
    }
  }
  // lantern: foot cornice, octagonal body with eight arched windows, top cornice, concave cap
  const yL0 = 5.9 + rise, yL1 = yL0 + (east ? 2.9 : 1.9), Rc = (f) => f / Math.cos(Math.PI / 8), a0 = Math.PI / 8;
  frustum(P, M.white, 0, 0, yL0, yL0 + 0.25, 8, Rc(oct + 0.12), Rc(oct + 0.1), a0, 3, 1);
  frustum(P, lantWall, 0, 0, yL0 + 0.25, yL1, 8, Rc(oct), Rc(oct), a0, 3, 3, { capTop: east ? M.roofWhite : M.lantRed });
  frustum(P, M.white, 0, 0, yL1, yL1 + 0.28, 8, Rc(oct + 0.16), Rc(oct + 0.14), a0, 3, 1);
  for (let k = 0; k < 8; k++) {
    P.push(0, 0, 0, k * Math.PI / 4);
    const yb = yL0 + (east ? 0.45 : 0.3), yt = yL1 - 0.2;
    P.quad(lant, [-0.475, yb, oct + 0.03], [0.475, yb, oct + 0.03], [0.475, yt, oct + 0.03], [-0.475, yt, oct + 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.pop();
  }
  const cap = east ? [[2.35, 0], [2.1, 0.4], [1.6, 1.0], [1.0, 1.5], [0.55, 1.8]] : [[1.95, 0], [1.75, 0.3], [1.25, 0.8], [0.6, 1.1]];
  for (let i = 0; i + 1 < cap.length; i++) frustum(P, roofM, 0, 0, yL1 + 0.28 + cap[i][1], yL1 + 0.28 + cap[i + 1][1], 8, Rc(cap[i][0]) * 0.97, Rc(cap[i + 1][0]) * 0.97, a0, 3, 1);
  const yTop = yL1 + 0.28 + cap[cap.length - 1][1];
  if (east) {
    onion(P, M.roofWhite, 0, yTop - 0.1, 0, 0.47, 1.26, 14, 12);                         // the white bulb
    P.cyl(M.roofWhite, [0, yTop + 1.3, 0], [0, 21.9, 0], 0.065, 0.014, 6, true);          // the bare needle
    ball(P, M.roofWhite, 0, 20.0, 0, 0.1, 8);                                              // the bead at three quarters
  } else ball(P, M.verdi, 0, yTop + 0.1, 0, 0.2, 8);
}

// ------------------------------------------------------------------------------------------------ the east mole: lawn, setts, boulders, anchor, urn
function mole(Q) {
  const P = Q.P, M = Q.M, cover = coverFn(Q.ctx);
  const wRing = (pts) => pts.map(([u, v]) => { const p = FK.W(u, v); return [p.x, p.z]; });
  const dry = (x, z) => { try { return !!L.waterwayAt(x, z); } catch (e) { return false; } };
  const clip = (x, z) => cover(x, z) > -0.15 || dry(x, z);
  // east mole lawn: from the canal coping (u 15.7) to the sea shore, north to the MChS yard
  const lawn = [[16.5, -27], [16.5, -21.95], [19.95, -21.95], [19.95, -19.65], [16.5, -19.65], [16.5, -0.2], [17.2, 1.8], [18.8, 2.5], [26.2, 3.6], [29.6, 2.2], [30.8, 1.2], [31.5, -1.7], [32.4, -9.8], [33.0, -12.2], [36.5, -14.8], [36.5, -27]];
  fillPolyClipped(P, M.lawn, wRing(lawn), 0.05, (x, z) => (clip(x, z) ? 1 : -5), { tile: 6, maxEdge: 5 });
  // the apron of granite setts north of the pavilion, 4 m wide
  fillPolyClipped(P, M.setts, wRing([[16.5, -23.2], [36.5, -23.2], [36.5, -18.7], [16.5, -18.7], [16.5, -19.65], [19.95, -19.65], [19.95, -21.95], [16.5, -21.95]]), 0.07, (x, z) => (clip(x, z) ? 1 : -5), { tile: 2, maxEdge: 5 });
  // the west headland: a wild grass floor round the west pavilion, 30 m wide
  fillPolyClipped(P, M.lawnDry, wRing([[-14.6, -30], [-14.6, 0.6], [-17.2, 0.4], [-26, 5.4], [-44, 7.2], [-44, -30]]), 0.05, (x, z) => (clip(x, z) ? 1 : -5), { tile: 6, maxEdge: 5 });
  // six boulders along the west edge of the east mole
  const g = new THREE.IcosahedronGeometry(1, 1);
  [[17.6, -6.5, 0.5], [17.9, -9.2, 0.7], [17.5, -12.4, 0.55], [17.8, -15.8, 0.8], [18.0, -17.4, 0.45], [17.5, -2.8, 0.6]].forEach(([u, v, r], i) => { const p = FK.W(u, v); P.geo(M.boulder, g, p.x, r * 0.45, p.z, 0, i * 1.7, 0, r, r * 0.65, r * 0.85); });
  g.dispose();
  // the urn on its plinth at the north-west corner of the pavilion, beside the stair head
  const urn = FK.W(21.0, -20.0);
  P.box(M.plinth, urn.x - 0.3, urn.x + 0.3, 0.05, 0.5, urn.z - 0.3, urn.z + 0.3, 'b', 1);
  revolve(P, M.coping, [[0.12, 0.5], [0.22, 0.58], [0.2, 0.7], [0.3, 0.95], [0.28, 1.2], [0.18, 1.3], [0.12, 1.4], [0.2, 1.46]], 14, { cx: urn.x, cz: urn.z, uRep: 2, vTile: 1 });
  // the black cast anchor south of the pavilion near the coping: shank, stock, ring, two curved arms
  const an = FK.W(30.5, -6);
  P.push(an.x, 0, an.z, FK.rot + 0.4);
  P.cyl(M.iron, [0, 0.35, 0], [0, 2.1, 0], 0.07, 0.06, 6, true); P.cyl(M.iron, [-0.9, 1.85, 0], [0.9, 1.85, 0], 0.05, 0.05, 5, true);
  const tor = new THREE.TorusGeometry(0.17, 0.03, 5, 10); P.geo(M.iron, tor, 0, 2.22, 0, 0, 0, 0, 1, 1, 1); tor.dispose();
  // review fix: the two arms were 0.7 m stubs that read as a cross (an ankh) at 1-3 m; now each arm is a swept arc (R 0.8 m, about 85 deg) rising from the crown to a fluke plate, arm span 1.6 m under a 1.8 m stock
  for (const sg of [-1, 1]) {
    const R = 0.8; let prev = [0, 0.38];
    for (let k = 1; k <= 5; k++) { const a = k * 17 * Math.PI / 180, cur = [sg * R * Math.sin(a), 0.38 + R * (1 - Math.cos(a))]; P.cyl(M.iron, [prev[0], prev[1], 0], [cur[0], cur[1], 0], 0.085 - 0.007 * k, 0.085 - 0.007 * (k + 1), 6, k === 5); prev = cur; }
    P.push(prev[0], prev[1], 0, 0);
    P.box(M.iron, -0.17, 0.17, -0.02, 0.4, -0.05, 0.05, '', 1);                                                       // the fluke plate at the arm end
    P.pop();
  }
  P.pop();
  // the steel ladder at the west headland tip (OSM w1385391719, a 0.8 m "steps" way): two handrail loops standing over the edge
  { const lx = -7000.8, lz = 428.0, rot = FK.rot;
    for (const s of [-1, 1]) { const px = lx + Math.cos(rot) * 0.25 * s, pz = lz - Math.sin(rot) * 0.25 * s; P.cyl(M.steel, [px, 0.0, pz], [px, 0.62, pz], 0.025, 0.025, 5, false); P.cyl(M.steel, [px, 0.62, pz], [px + Math.sin(rot) * 0.2, 0.5, pz + Math.cos(rot) * 0.2], 0.025, 0.025, 5, false); }
    P.cyl(M.steel, [lx - Math.cos(rot) * 0.25, 0.55, lz + Math.sin(rot) * 0.25], [lx + Math.cos(rot) * 0.25, 0.55, lz - Math.sin(rot) * 0.25], 0.02, 0.02, 4, false); }
  void blob;
}

// ------------------------------------------------------------------------------------------------ the MChS house and the hangar on the east mole
function mchs(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics;
  const house = L.buildingById('w133197170'), hangar = L.buildingById('r2615813');
  if (house && house.polys && house.polys[0]) {
    const poly = house.polys[0], edges = ringEdges(poly), r = rectOf(poly.o);
    for (const e of edges) onEdge(P, e, (len) => {
      P.quad(M.mchsWhite, [0, 0, 0], [len, 0, 0], [len, 3.7, 0], [0, 3.7, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 1], [0, 1]]);
      P.quad(M.mchsGraphite, [0, 3.7, 0], [len, 3.7, 0], [len, 7.5, 0], [0, 7.5, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 1], [0, 1]]);
      P.box(M.white, 0, len, 3.62, 3.78, 0, 0.1, 'bk', 2);                                           // the string course between the two tones
      P.quad(M.glassDark, [0.8, 4.6, 0.04], [len - 0.8, 4.6, 0.04], [len - 0.8, 6.3, 0.04], [0.8, 6.3, 0.04], [0, 0, 1]);        // ribbon windows of the upper floor
      if (len > 6) P.quad(M.glassDark, [len / 2 - 1.3, 0.05, 0.04], [len / 2 + 1.3, 0.05, 0.04], [len / 2 + 1.3, 3.0, 0.04], [len / 2 - 1.3, 3.0, 0.04], [0, 0, 1]);       // glazed entrance
    });
    P.push(r.cx, 0, r.cz, rotOfAng(r.ang)); hipRoof(P, M.mchsGraphite, -r.len / 2, r.len / 2, -r.wid / 2, r.wid / 2, 7.5, 1.6, { oe: 0.3, ridgeLen: Math.max(0.5, r.len - r.wid - 2) });
    P.box(M.mchsGlass, -1.2, 1.2, 8.7, 9.3, -1.2, 1.2, 'b', 1); P.pop();                         // the glass pyramid skylight
    addPolyColliders(Q.ctx, poly, -0.3, 9.4, 0.9);
  }
  if (hangar && hangar.polys && hangar.polys[0]) {
    const poly = hangar.polys[0], r = rectOf(poly.o);
    P.push(r.cx, 0, r.cz, rotOfAng(r.ang));
    P.box(M.hangarWall, -r.len / 2, r.len / 2, 0, 6.5, -r.wid / 2, r.wid / 2, 't', 4);
    gableRoof(P, M.hangarRoof, -r.len / 2, r.len / 2, -r.wid / 2, r.wid / 2, 6.5, 2.0, true, { oe: 0.35, og: 0.2, gable: M.hangarWall, under: M.hangarRoof });
    P.pop();
    addPolyColliders(Q.ctx, poly, -0.3, 8.6, 0.9);
  }
  void ph; void pairsOf;
}
void TAU;
