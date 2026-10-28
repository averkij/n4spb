// landmarksAndrew/shrines.js - the small monuments round the cathedral (docs/research/andrew.md 3.7; photos refs/andrew 71 26 34 224):
//   * the CHAPEL OF ST VLADIMIR (2001; OSM w84045806, C(-21.1, 36.2)): a round rose drum 4.4 m across with a two-column portico and a small pediment toward the Bolshoy end, an arched glazed door, a grey-green copper dome
//     with a gilt ball and cross (8.2 m);
//   * the OBELISK OF THE 300 YEARS OF THE ORDER OF ST ANDREW (OSM n968499248, C(-37.1, 38.7)): grey-red granite shaft with a rhombus relief, 11 m with the bronze double-headed eagle, two octagonal steps, a pedestal with two
//     bronze plaques (no invented texts), a circular granite-sett apron and chain bollards on the Bolshoy side;
//   * the BUST OF COUNT F. A. GOLOVIN (OSM n968189055, C(8.1, 23.8)): verdigris bronze bust (the figure kit) in a Petrine wig and breastplate on a red-brown granite pedestal with the cartouche plaque (text read from photo 224).
import * as THREE from 'three';
import { FC } from './frame.js';
import * as G from './geo.js';
import * as D from './domes.js';
import * as S from './stucco.js';
import * as O from './orders.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture } from '../lib/knock-furniture.js';
import { fillPolyClipped, coverFn } from './surfaces.js';
import { bust, extend, cached, figureMats } from '../lib/figures.js';

const TAU = Math.PI * 2;
export const CHAPEL = { a: -21.1, b: 36.2 }, OBELISK = { a: -37.1, b: 38.7 }, GOLOVIN = { a: 8.1, b: 23.8 };

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  P.push(FC.ox, 0, FC.oz, FC.rot);
  try {
    chapel(K);
    obelisk(K);
    golovin(K);
  } finally { P.pop(); }
  // colliders (world): chapel, obelisk plinth, bust pedestal
  const c = FC.W(CHAPEL.a, CHAPEL.b), o = FC.W(OBELISK.a, OBELISK.b), g = FC.W(GOLOVIN.a, GOLOVIN.b);
  ph.addCylinder(c.x, c.z, 2.5, 0, 6); ph.addBox(o.x, o.z, 2.6, 2.6, FC.rot, 0, 9); ph.addBox(g.x, g.z, 1.2, 1.2, FC.rot, 0, 2.4);
  K.svc.monuments.push({ id: 'w84045806', name: 'Часовня св. князя Владимира', x: c.x, z: c.z, h: 8.2 }, { id: 'n968499248', name: 'Обелиск в память 300-летия ордена Св. Андрея Первозванного', x: o.x, z: o.z, h: 11.0 },
    { id: 'n968189055', name: 'Бюст Ф. А. Головина', x: g.x, z: g.z, h: 2.4 });
  // the apron (granite setts, R 4.2) round the obelisk and the chain bollards toward Bolshoy pr.
  const ring = []; for (let i = 0; i < 32; i++) { const t = i * TAU / 32; ring.push([o.x + Math.cos(t) * 4.2, o.z + Math.sin(t) * 4.2]); }
  fillPolyClipped(P, M.sett, ring, 0.055, cover, { margin: 0.2, maxEdge: 3, tile: 2 });
  const bg = partsGeos((Q) => bollard(Q, M)), bm = [], bp = [], bIt = [];
  for (let k = -3; k <= 3; k++) {                                                    // an arc on the Bolshoy side (+b of frame C), R 4.9 m
    const t = k * 0.42, a = OBELISK.a + Math.sin(t) * 4.9, b = OBELISK.b + Math.cos(t) * 4.9, p = FC.W(a, b);
    if (cover(p.x, p.z) > -0.8) continue; bm.push({ x: p.x, y: 0, z: p.z, rotY: FC.rot }); bp.push(p); bIt.push(ph.addCylinder(p.x, p.z, 0.25, 0, 0.9));
  }
  K.extraTris += knockFurniture(ctx, 'lmAnd-bollards', bg, bm, bIt, { kind: 'bollard', mass: 250, h: 0.8, r: 0.26, anchored: 30, hitK: 0.5 }, 240);      // knock records (docs/AREAS.md 13.7); the sagging chains between them stay drawn
  for (let i = 0; i + 1 < bp.length; i++) {                                           // chains with a 0.25 m sag
    const a = bp[i], b = bp[i + 1]; let prev = null;
    for (let s = 0; s <= 5; s++) { const t = s / 5, y = 0.62 - 0.22 * 4 * t * (1 - t), q = [a.x + (b.x - a.x) * t, y, a.z + (b.z - a.z) * t]; if (prev) P.cyl(M.iron, prev, q, 0.014, 0.014, 4, false); prev = q; }
  }
  K.svc.bollards = bp.length;
}

/** a granite stump bollard 0.45 x 0.45 x 0.8 m with a rounded cap (instanced) */
function bollard(Q, M) {
  Q.box(M.bollardGranite, -0.22, 0.22, 0, 0.62, -0.22, 0.22, 'b', 1); Q.box(M.bollardGranite, -0.18, 0.18, 0.62, 0.74, -0.18, 0.18, 'b', 1); Q.box(M.bollardGranite, -0.11, 0.11, 0.74, 0.8, -0.11, 0.11, '', 1);
  Q.cyl(M.iron, [0, 0.55, 0.2], [0, 0.55, 0.26], 0.03, 0.03, 6, true);
}

// ------------------------------------------------------------------------------------------------ the chapel of St Vladimir
function chapel(K) {
  const { P, M } = K, c = CHAPEL;
  P.push(c.a, 0, c.b, 0);
  const R = 2.2, seg = 16;
  G.tube(P, M.plinth, 0, 0, 0, 0.4, 2.55, 2.5, seg, 4, 1, { capTop: M.plinth });
  G.tube(P, M.chapelRose, 0, 0, 0.4, 4.4, R, R, seg, 6, 2);
  for (let i = 0; i < 8; i++) { const t = i * TAU / 8 + 0.2; P.push(Math.sin(t) * R, 0, Math.cos(t) * R, t); P.box(M.white, -0.18, 0.18, 0.4, 4.3, -0.06, 0.1, 'bk', 1); P.pop(); }
  G.tube(P, M.white, 0, 0, 4.4, 4.75, 2.52, 2.52, seg, 6, 1, { capTop: M.white }); G.tube(P, M.white, 0, 0, 4.2, 4.4, 2.35, 2.35, seg, 6, 1);
  // portico toward the Bolshoy end (+b): two columns, an entablature, a small pediment, the arched glazed door
  P.push(0, 0, R, 0);
  O.doorArch(P, M, 0, 0.45, 1.3, 2.6, { wall: M.chapelRose, mat: M.doorGlassAl, frame: 0.3, depth: 0.12 });
  for (const s of [-1, 1]) O.column(P, M, s * 1.05, 0.75, 0.4, 3.7, 0.22);
  P.box(M.white, -1.5, 1.5, 3.7, 4.15, -0.05, 0.95, 'b', 1);
  P.pop();
  // pediment over the portico (facade frame at the drum face, +z out)
  P.push(0, 0, R + 0.05, 0);
  const tri = [[-1.6, 4.15], [1.6, 4.15], [0, 4.95]]; P.fan(M.white, [[tri[0][0], tri[0][1], 0.9], [tri[1][0], tri[1][1], 0.9], [tri[2][0], tri[2][1], 0.9]], [0, 0, 1]);
  P.fan(M.chapelRose, [[-1.2, 4.2, 0.92], [1.2, 4.2, 0.92], [0, 4.7, 0.92]], [0, 0, 1]);
  P.pop();
  // the copper dome (r 2.6, 4.75 -> 6.75), a gilt ball and a small cross (tip 8.2)
  D.dome(P, M.chapelDome, 0, 4.75, 0, 2.55, 2.0, 0);
  D.crown(P, M, 0, 6.65, 0, 0.26, 8.2 - 6.65 - 0.52, 0);
  P.pop();
}

// ------------------------------------------------------------------------------------------------ the order obelisk
function obelisk(K) {
  const { P, M } = K, o = OBELISK;
  P.push(o.a, 0, o.b, 0);
  G.frustum(P, M.plinth, 0, 0, 0, 0.2, 8, 2.4, 2.4, Math.PI / 8, 3, 1, { capTop: M.plinth });
  G.frustum(P, M.plinth, 0, 0, 0.2, 0.4, 8, 1.9, 1.9, Math.PI / 8, 3, 1, { capTop: M.plinth });
  P.box(M.bollardGranite, -1.2, 1.2, 0.4, 1.5, -1.2, 1.2, 'b', 1.2);
  P.box(M.plinth, -1.3, 1.3, 1.5, 1.7, -1.3, 1.3, 'b', 1.3);
  for (const [fx, fz] of [[1, 1], [-1, -1]]) { const n = Math.hypot(fx, fz); P.push(fx / n * 1.21, 0, fz / n * 1.21, Math.atan2(fx, fz)); P.box(M.bronzePlate, -0.28, 0.28, 0.65, 1.5, 0, 0.04, 'bk', 1); P.pop(); }
  G.frustum(P, M.obeliskShaft, 0, 0, 1.7, 9.5, 8, 0.68, 0.3, Math.PI / 8, 1, 9.5);          // review: one rhombus per face width (was half: the relief read as a zig-zag; photos 71 34: a fine diamond lattice)
  P.box(M.bollardGranite, -0.36, 0.36, 9.5, 9.62, -0.36, 0.36, 'b', 1);
  G.ball(P, M.bronze, 0, 9.85, 0, 0.25, 8);
  eagle(P, M, 0, 10.05, 0);
  P.pop();
}
/** a bronze double-headed eagle with spread wings, ~0.95 m (base at y) */
function eagle(P, M, x, y, z) {
  P.push(x, y, z, 0);
  S.sph(P, M.bronze, 0, 0.32, 0, 0.12, 0.26, 0.09, 6);
  for (const s of [-1, 1]) {
    S.sph(P, M.bronze, s * 0.11, 0.7, 0.01, 0.05, 0.06, 0.05, 6); P.geo(M.bronze, new THREE.ConeGeometry(0.025, 0.1, 4), s * 0.17, 0.7, 0.02, 0, 0, s * -Math.PI / 2, 1, 1, 1);
    S.sph(P, M.bronze, s * 0.06, 0.55, 0, 0.04, 0.09, 0.04, 5);
    const wing = [[0.05, 0.28], [0.3, 0.4], [0.58, 0.7], [0.64, 0.95], [0.5, 0.82], [0.46, 0.62], [0.34, 0.5], [0.3, 0.36], [0.05, 0.1]];
    G.solid(P, M.bronze, wing.map(([px, py]) => [px * s, py]), -0.02, 0.04, 1);
  }
  const tail = [[-0.1, 0.12], [0.1, 0.12], [0.16, -0.12], [0, -0.2], [-0.16, -0.12]]; G.solid(P, M.bronze, tail, -0.02, 0.04, 1);
  P.box(M.goldFlat, -0.1, 0.1, 0.84, 0.9, -0.02, 0.02, '', 1);                       // the crown
  P.pop();
}

// ------------------------------------------------------------------------------------------------ the Golovin bust
function golovin(K) {
  const { ctx, P, M } = K, g = GOLOVIN, fm = figureMats(ctx), mk = fm.keys('bronze', 'gold');
  P.push(g.a, 0, g.b, 0);
  // the pedestal of photo 224: a wide base flaring out of a tapering red-brown granite shaft under a moulded cap, the cartouche plaque on the slanted front face (review: it was a straight box)
  const half = (y) => 0.54 - (y - 0.18) / 0.97 * 0.17;                                                  // half side of the shaft at height y (0.54 at 0.18, 0.37 at 1.15)
  P.box(M.graniteRed, -0.6, 0.6, 0, 0.18, -0.6, 0.6, 'b', 1);
  G.frustum(P, M.graniteRed, 0, 0, 0.18, 1.15, 4, 0.54 / Math.cos(Math.PI / 4), 0.37 / Math.cos(Math.PI / 4), Math.PI / 4, 1, 1);
  P.box(M.graniteRed, -0.5, 0.5, 1.15, 1.3, -0.5, 0.5, 'b', 1); P.box(M.graniteRed, -0.44, 0.44, 1.3, 1.38, -0.44, 0.44, 'b', 1);
  P.quad(M.golovinPlate, [-0.24, 0.42, half(0.42) + 0.012], [0.24, 0.42, half(0.42) + 0.012], [0.24, 1.02, half(1.02) + 0.012], [-0.24, 1.02, half(1.02) + 0.012], [0, 0.17, 1]);
  // the bust: a baroque wig with ringlets over the shoulders, the star of the order on the chest, a sash, a round waisted socle (built from the kit bust + Sculpt additions)
  const fig = cached('lmAnd-golovin2', () => extend(bust({ style: 'civil', face: { hair: 'wig', age: 0.55, mouth: 'stern', brow: 0.9, jaw: 1.0, seed: 33 }, detail: 0.9, turn: 0.1 }), (S, info) => {
    const HC = info.head.c; let sd = 7; const rnd = () => { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; };
    S.blob('main', [HC[0], HC[1] + 0.03, HC[2] - 0.1], [0.165, 0.165, 0.15], { w: 14, h: 10 });                       // the mass of the wig behind and over the head (its front stays inside the face)
    S.blob('main', [HC[0], HC[1] + 0.165, HC[2] + 0.02], [0.095, 0.05, 0.07], { w: 10, h: 7 });                       // the peaked front roll
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {                                                                                      // the ringlets falling to the shoulders
        const y = HC[1] - i * 0.062, x = s * (0.135 + 0.01 * Math.sin(i * 0.9) + i * 0.006), z = HC[2] - 0.06 - 0.004 * i;
        S.blob('main', [x, y, z], [0.058, 0.05, 0.062], { w: 10, h: 7 });
        for (let k = 0; k < 3; k++) S.blob('main', [x + s * 0.025 + (rnd() - 0.5) * 0.04, y + (rnd() - 0.5) * 0.04, z + 0.03 + rnd() * 0.03], [0.03, 0.03, 0.03], { w: 7, h: 5 });
      }
      for (let k = 0; k < 3; k++) S.blob('main', [s * (0.1 + k * 0.006), HC[1] + 0.11 - k * 0.06, HC[2] + 0.04], [0.036, 0.036, 0.036], { w: 7, h: 5 });   // curls framing the face
    }
    S.blob('accent', [0.105, 0.17, 0.118], [0.045, 0.045, 0.008], { w: 12, h: 4 });                                      // the star of the order (the figure's left = +x)
    for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; S.blob('accent', [0.105 + Math.cos(t) * 0.052, 0.17 + Math.sin(t) * 0.052, 0.114], [0.011, 0.011, 0.007], { w: 5, h: 4 }); }
    S.tube('main', [[-0.15, 0.3, 0.1], [-0.04, 0.2, 0.135], [0.08, 0.08, 0.14], [0.17, 0.0, 0.12]], [[0.028, 0.012], [0.03, 0.012], [0.03, 0.012], [0.03, 0.012]], { seg: 8, per: 3 });   // the sash
    S.tube('main', [[0, -0.12, 0], [0, -0.06, 0], [0, 0.0, 0]], [[0.15, 0.15], [0.115, 0.115], [0.2, 0.2]], { seg: 20, per: 3 });                                           // the round waisted socle
  }));
  fig.place(P, mk, 0, 1.38 + 0.144, 0, 0, 1.2);
  P.pop();
}
