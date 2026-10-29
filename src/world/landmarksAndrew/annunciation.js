// landmarksAndrew/annunciation.js - the ANNUNCIATION CHURCH (Благовещенская церковь, 8-я линия 67, w108116443; 1750-62, belfry 1780s): a yellow Elizabethan-baroque church with a heavy white order, FIVE green
// onion domes (a central one on a drum + four corner towers), a round apse, a refectory and a four-tier BELFRY (cross tip 42 m) over a vestibule with a four-column portico and a pediment toward the 70 m forecourt.
// Dossier docs/research/andrew.md section 8 (critic-corrected: tiers 8.4 / 8.2 / 7.8 m, H 42 m, door 2.3 x 2.3 m), photos refs/andrew 131 132 142 148 151 157 158.  Frame N (frame.js): a ENE (the axis of the church,
// the portico at a -27.7, the apse tip at +27.8), b SSE.  The walls are drawn edge by edge on the baked 37-vertex outline; the two portico bumps of the outline are replaced by real columns.  The fence, gates,
// forecourt, garden and the chapel of 1899 are garden.js.  Colliders: the footprint wall boxes (solid church), the columns are inside the bump boxes.
import * as THREE from 'three';
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { ringEdges, band, onEdge, polyOf } from './kit.js';
import * as G from './geo.js';
import * as D from './domes.js';
import * as LO from './loft.js';
import * as O from './orders.js';
import { FN } from './frame.js';
import { footprintIn } from './ringkit.js';

const FALL = { outer: [[18.9, 8.3], [18.6, 12.0], [-2.9, 12.3], [-3.1, 9.6], [-12.5, 9.9], [-12.5, 12.0], [-15.9, 12.1], [-15.9, 10.2], [-25.7, 10.5], [-25.9, 5.5], [-27.2, 5.4], [-27.4, 2.5], [-26.0, 2.7], [-26.1, -1.3], [-27.7, -1.3], [-27.7, -4.1], [-25.9, -4.1], [-26.0, -9.4], [-16.5, -9.5], [-16.5, -11.5], [-12.8, -11.4], [-12.9, -9.2], [-3.5, -9.4], [-3.5, -12.1], [18.5, -12.5], [18.3, -9.3], [20.8, -9.1], [23.2, -8.2], [24.8, -7.1], [26.3, -5.2], [27.3, -3.2], [27.8, -1.1], [27.6, 1.3], [26.8, 3.4], [25.6, 5.2], [23.6, 6.9], [21.2, 7.9]], holes: [] };
export const HT = { plinth: 0.8, vest: 7.6, ref: 10.2, nave: 13.0, apse: 11.0 };
export const AX = { cb: 0.65, belfry: [-22.0, 0.65], central: [7.5, 0.3], corners: [[0.5, -8.0], [14.5, -8.0], [0.5, 8.5], [14.5, 8.5]], H: 42.0 };
const zoneOf = (a) => (a < -16.0 ? 'vest' : a < -3.4 ? 'ref' : a < 18.7 ? 'nave' : 'apse');

function mats(K) {
  const { ctx, M } = K; if (M.ann) return M.ann;
  const T = ctx.mat.toon;
  const m = { wall: T('#ecc978', { name: 'lmAnd-annWall', paint: 0.05 }), shade: T('#d2a85a', { name: 'lmAnd-annWallShade', paint: 0.05 }), roof: T('#7a9a8a', { map: M.A.seams, name: 'lmAnd-annRoof', paint: 0.04, side: 'double' }),
    granite: T('#b9b6ae', { map: M.A.graniteGrain, name: 'lmAnd-annGranite', paint: 0.04 }), hood: T('#5f9a84', { name: 'lmAnd-annHood', paint: 0.04 }) };
  M.winGreen = T('#ffffff', { map: M.A.winGreen, name: 'lmAnd-winGreen', paint: 0, polygonOffset: -1 }); M.decals.add(M.winGreen);
  M.ann = m; return m;
}

export function build(K) {
  const { ctx, P, M } = K, mk = mats(K);
  const fp = footprintIn('w108116443', FN, FALL), ring = fp.outer, edges = ringEdges(polyOf(ring));
  P.push(FN.ox, 0, FN.oz, FN.rot);
  try {
    for (const part of [walls, portico, roofs, domes, belfry]) { try { part(K, ring, edges, mk); } catch (e) { console.error('[landmarksAndrew] annunciation ' + part.name + ':', e); } }
  } finally { P.pop(); }
  try { const rec = L.buildingById('w108116443'); if (rec) for (const pl of rec.polys) addPolyColliders(ctx, pl, 0, 14, 1.0); } catch (e) { console.warn('[landmarksAndrew] annunciation colliders:', e && e.message); }
  const bf = FN.W(AX.belfry[0], AX.belfry[1]), ce = FN.W(AX.central[0], AX.central[1]);
  K.svc.monuments.push({ id: 'w108116443', name: 'Благовещенская церковь', x: ce.x, z: ce.z, h: 37.5, r: 12 }, { id: 'w108116443-belfry', name: 'Колокольня Благовещенской церкви', x: bf.x, z: bf.z, h: AX.H, r: 5 });
  const door = FN.W(-27.7 - 3, AX.cb); K.svc.entrances.push({ id: 'annunciation-portico', x: door.x, z: door.z, rotY: FN.rot - Math.PI / 2, name: 'Благовещенская церковь: вход' });
  void M; void THREE;
}

// ------------------------------------------------------------------------------------------------ walls
function walls(K, ring, edges, mk) {
  const { P, M } = K;
  const bump = (e) => Math.min(e.a[0], e.b[0]) < -27.0 && e.a[1] > -4.3 && e.a[1] < 5.7 && e.b[1] > -4.3 && e.b[1] < 5.7;      // the faces of the two column bumps: drawn as columns instead
  const topOf = (e) => HT[zoneOf((e.a[0] + e.b[0]) / 2)];
  for (const e of edges) {
    if (bump(e)) continue;
    const z = zoneOf((e.a[0] + e.b[0]) / 2), top = topOf(e), west = e.n[0] < -0.9 && Math.min(e.a[1], e.b[1]) < AX.cb && Math.max(e.a[1], e.b[1]) > AX.cb;
    onEdge(P, e, (len) => {
      P.quad(mk.wall, [0, HT.plinth, 0], [len, HT.plinth, 0], [len, top - 1.0, 0], [0, top - 1.0, 0], [0, 0, 1], [[0, HT.plinth / 3], [len / 3, HT.plinth / 3], [len / 3, (top - 1.0) / 3], [0, (top - 1.0) / 3]]);
      if (len < 2.2) return;
      const n = Math.max(1, Math.round((len - 0.6) / 4.9)), pitch = len / n;
      for (let i = 0; i <= n; i++) { const u = Math.min(len - 0.25, Math.max(0.25, i * pitch)); O.pilaster(P, M, u, HT.plinth, top - 1.0, 0.5, 0.1); }
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) * pitch;
        if (west) continue;
        if (z === 'vest') { O.rectWin(P, M, u, 4.3, 1.2, 2.0, { mat: M.winGreen, b: 0.14, lintel: 'hood', hoodMat: mk.hood }); O.rectWin(P, M, u, 1.7, 1.1, 1.3, { mat: M.winGrille, b: 0.12, lintel: 'flat' }); }
        else if (z === 'ref') { O.rectWin(P, M, u, 5.3, 1.3, 2.3, { mat: M.winGreen, b: 0.15, lintel: 'flat' }); O.rectWin(P, M, u, 1.7, 1.0, 1.3, { mat: M.winGrille, b: 0.12, lintel: 'flat' }); }
        else if (z === 'nave') { O.rectWin(P, M, u, 7.3, 1.5, 2.6, { mat: M.winGreen, b: 0.17, lintel: 'pedi' }); O.rectWin(P, M, u, 1.7, 1.3, 2.2, { mat: M.winGrille, b: 0.15, lintel: 'flat' }); }
        else if (len > 3) O.rectWin(P, M, u, 5.0, 1.3, 2.3, { mat: M.winGreen, b: 0.15, lintel: 'flat' });
      }
    });
  }
  band(P, edges, 0, HT.plinth, 0.12, { front: mk.granite, top: mk.granite }, { uvs: 2, draw: (e) => !bump(e) });
  band(P, edges, (e) => topOf(e) - 1.0, (e) => topOf(e) - 0.45, 0.12, { front: M.white, top: M.white }, { uvs: 4, draw: (e) => !bump(e) });
  band(P, edges, (e) => topOf(e) - 0.45, topOf, 0.5, { front: M.white, top: M.white, under: M.underside }, { uvs: 4, draw: (e) => !bump(e) });
  // the wall behind the two column bumps at the plane a = -26.0
  for (const [b0, b1] of [[-4.1, -1.3], [2.5, 5.4]]) P.quad(mk.wall, [-26.0, HT.plinth, b0], [-26.0, HT.plinth, b1], [-26.0, HT.vest, b1], [-26.0, HT.vest, b0], [-1, 0, 0]);
}

// ------------------------------------------------------------------------------------------------ the portico (two coupled column pairs, entablature, pediment, door in a round recess, steps)
function portico(K, ring, edges, mk) {
  const { P, M } = K, cb = AX.cb, cols = [[-2.75, -0.8], [-2.75, 0.8], [4.05, -0.8], [4.05, 0.8]];
  for (const [bc, db] of cols) O.column(P, M, -27.2, bc + db, HT.plinth, 6.8, 0.47);
  P.box(M.white, -27.9, -25.9, 6.8, 7.1, -4.45, 5.85, 'b', 1);                                     // architrave + frieze (the date 1762 would sit here)
  P.box(M.white, -28.2, -25.9, 7.1, 7.6, -4.7, 6.1, 'b', 1);                                       // cornice
  P.quad(M.underside, [-28.2, 7.1, -4.7], [-28.2, 7.1, 6.1], [-25.9, 7.1, 6.1], [-25.9, 7.1, -4.7], [0, -1, 0]);
  for (let i = 0; i < 3; i++) P.box(mk.granite, -27.9 - (i + 1) * 0.3, -25.9, 0, 0.15 * (3 - i), -4.5, 5.9, 'b', 1);          // three low steps
  P.push(-26.0, 0, cb, -Math.PI / 2);                                                                // facade frame: +z points out of the west wall
  LO.gable(P, M, 5.6, 7.6, 2.7, { depth: 0.55, tympMat: mk.wall });
  // the baked west edge leans 0.1 m over the door width (a -26.1 at b -1.3 .. -26.0 at b 2.7): the door group stands 0.12 m proud of the plane so that no part of it is buried in the wall (review fix: half of the door was hidden)
  G.frameRing(P, M.white, G.archPts(0, 0.8, 3.5, 4.5, 14), G.archPts(0, 0.85, 3.1, 4.4, 14), 0.06, 0.14, 1);
  P.quad(M.doorVarnish, [-1.15, 0.85, 0.16], [1.15, 0.85, 0.16], [1.15, 3.15, 0.16], [-1.15, 3.15, 0.16], [0, 0, 1]);
  G.planeShape(P, M.win24, G.archPts(0, 3.3, 1.8, 0.9, 8), 0.17);
  P.pop();
}

// ------------------------------------------------------------------------------------------------ roofs
function roofs(K, ring, edges, mk) {
  const { P, M } = K;
  // vestibule hip (ridge 9.8), refectory hip, the main hip (ridge 15.8), the apse half-cone
  LO.pyramid(P, mk.roof, -21.3, 0.65, 5.0, 10.3, HT.vest + 0.02, 9.8, 10.6);
  LO.pyramid(P, mk.roof, -9.8, 0.25, 6.6, 10.05, HT.ref + 0.02, 12.2, 6.9);
  LO.pyramid(P, mk.roof, 7.5, 0.0, 11.3, 12.9, HT.nave + 0.02, 15.8, 2.4);
  const apseRing = ring.filter((p) => p[0] > 18.0 && Math.abs(p[1]) < 9).sort((p, q) => Math.atan2(p[1], p[0] - 18.7) - Math.atan2(q[1], q[0] - 18.7));
  const apex = [21.0, 14.2, 0];
  for (let i = 0; i + 1 < apseRing.length; i++) { const a = apseRing[i], b = apseRing[i + 1]; P.fan(mk.roof, [[a[0], HT.apse + 0.02, a[1]], [b[0], HT.apse + 0.02, b[1]], apex], [(a[0] + b[0]) / 2 - 21, 0.6, (a[1] + b[1]) / 2], (q) => [q[0] / 2, q[2] / 2]); }
  // the big pediments on the south and north faces of the nave
  for (const s of [1, -1]) { P.push(7.5, 0, s * 12.4, s > 0 ? 0 : Math.PI); LO.gable(P, M, 4.4, HT.nave, 1.9, { depth: 0.5, tympMat: mk.wall }); P.pop(); }
}

// ------------------------------------------------------------------------------------------------ the five domes
function domes(K, ring, edges, mk) {
  const { P, M } = K;
  const [cx, cz] = AX.central, t0 = D.octStage(P, M, cx, cz, HT.nave, 19.5, 8.4, { mat: mk.wall, winW: 1.2, winH: 2.4, winY: 0.3, face: (i) => (i % 2 === 0 ? 'arch' : 'niche'), cornice: 0.6, proj: 1.1, winMat: M.winGreen });
  const t1 = D.octStage(P, M, cx, cz, t0, 24.0, 6.2, { mat: mk.wall, winW: 1.3, winH: 2.6, winY: 0.2, face: () => 'arch', cornice: 0.5, proj: 1.12, winMat: M.winGreen });
  LO.loft(P, M.copper, [LO.polyRing(cx, cz, t1, 3.3, 8), LO.polyRing(cx, cz, t1 + 0.35, 2.6, 8)], { uTile: 2 });
  const o1 = D.onion(P, M.copper, cx, t1 + 0.3, cz, 2.3, 1.5);
  D.crown(P, M, cx, o1 - 0.05, cz, 0.35, 37.5 - (o1 - 0.05) - 0.7, 0);
  for (const [a, b] of AX.corners) {
    P.box(mk.wall, a - 2.3, a + 2.3, HT.nave, 18.6, b - 2.3, b + 2.3, 'b', 3);                                                      // square tower stage with paired corner pilasters and blind arched niches
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.box(M.white, a + sx * 2.3 - 0.3 + (sx > 0 ? 0 : 0), a + sx * 2.3 + 0.3, HT.nave, 18.6, b + sz * 2.3 - 0.3, b + sz * 2.3 + 0.3, 'b', 1);
    for (const [dx, dz, rot] of [[0, 2.3, 0], [0, -2.3, Math.PI], [2.3, 0, Math.PI / 2], [-2.3, 0, -Math.PI / 2]]) { P.push(a + dx, 0, b + dz, rot); G.planeShape(P, M.niche, G.archPts(0, 14.4, 1.2, 3.2, 8), 0.04); G.frameRing(P, M.white, G.archPts(0, 14.3, 1.5, 3.6, 8), G.archPts(0, 14.4, 1.2, 3.2, 8), 0, 0.1, 1); P.pop(); }
    P.box(M.white, a - 2.6, a + 2.6, 18.6, 19.1, b - 2.6, b + 2.6, 'b', 1);
    const s1 = D.octStage(P, M, a, b, 19.1, 21.5, 3.4, { mat: mk.wall, winW: 0.8, winH: 1.5, winY: 0.2, face: (i) => (i % 2 === 0 ? 'arch' : 'niche'), cornice: 0.4, proj: 1.15, winMat: M.winGreen });
    const o = D.onion(P, M.copper, a, s1 + 0.05, b, 1.6, 1.7);
    D.crown(P, M, a, o - 0.05, b, 0.25, 32.5 - (o - 0.05) - 0.5, 0);
  }
}

// ------------------------------------------------------------------------------------------------ the belfry: four tiers 8.4 / 8.2 / 7.8 m, the green dome, the lantern, the onion (cross tip 42.0)
function belfry(K, ring, edges, mk) {
  const { P, M } = K, [cx, cz] = AX.belfry, y0 = 7.6;
  const tier = (w, ya, yb, o) => {
    const h = w / 2, rect = [[cx - h, cz - h], [cx + h, cz - h], [cx + h, cz + h], [cx - h, cz + h]], ed = ringEdges(polyOf(rect));
    for (const e of ed) onEdge(P, e, (len) => {
      P.quad(mk.wall, [0, ya, 0], [len, ya, 0], [len, yb, 0], [0, yb, 0], [0, 0, 1], [[0, ya / 3], [len / 3, ya / 3], [len / 3, yb / 3], [0, yb / 3]]);
      for (const u of [0.35, 1.0, len - 1.0, len - 0.35]) O.pilaster(P, M, u, ya, yb - 0.05, 0.5, 0.26);                                                          // paired corner pilasters (coupled shafts)
      const u = len / 2;
      if (o.open) {                                                                                                    // a big arched bell opening over a white balustrade
        P.quad(M.dark, [u - 1.0, o.sill, 0.01], [u + 1.0, o.sill, 0.01], [u + 1.0, o.sill + o.hh, 0.01], [u - 1.0, o.sill + o.hh, 0.01], [0, 0, 1]);
        G.planeShape(P, M.dark, G.archPts(u, o.sill, 1.9, o.hh, 10), 0.03); G.frameRing(P, M.white, G.archPts(u, o.sill - 0.1, 2.5, o.hh + 0.9, 10), G.archPts(u, o.sill, 1.9, o.hh, 10), 0, 0.16, 1);
        P.quad(M.balus, [u - 0.95, o.sill - 0.9, 0.18], [u + 0.95, o.sill - 0.9, 0.18], [u + 0.95, o.sill + 0.05, 0.18], [u - 0.95, o.sill + 0.05, 0.18], [0, 0, 1], [[0, 0], [1.9 / 0.7, 0], [1.9 / 0.7, 1], [0, 1]]);
        P.box(M.white, u - 1.0, u + 1.0, o.sill - 0.95, o.sill - 0.85, 0, 0.26, 'b', 1);
      } else { G.planeShape(P, M.niche, G.archPts(u, o.sill, 1.0, o.hh, 8), 0.03); G.frameRing(P, M.white, G.archPts(u, o.sill - 0.08, 1.4, o.hh + 0.5, 8), G.archPts(u, o.sill, 1.0, o.hh, 8), 0, 0.12, 1); }
    });
    band(P, ed, yb, yb + 0.35, 0.3, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
    band(P, ed, yb + 0.35, yb + 0.6, 0.55, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
  };
  tier(8.4, y0, 16.0, { open: false, sill: 11.0, hh: 2.4 });
  tier(8.2, 16.0 + 0.6, 24.5, { open: true, sill: 19.4, hh: 3.2 });
  tier(7.8, 24.5 + 0.6, 32.8, { open: true, sill: 27.4, hh: 3.0 });
  // the green dome over the square (a rectangle blending into a circle), two oculi, the octagonal lantern, the small onion
  const rings = [], m = 6;
  for (let i = 0; i <= m; i++) { const t = i / m, s = LO.sstep(t); rings.push(LO.ringAt(cx, cz, 33.4 + 2.2 * t, 3.9 + (2.8 - 3.9) * s, 3.9 + (2.8 - 3.9) * s, 2.8, Math.min(1, 0.1 + s), 16)); }
  LO.loft(P, M.copper, rings, { uTile: 2.2, capTop: M.copper });
  for (const a of [Math.PI / 2, -Math.PI / 2, 0, Math.PI]) { P.push(cx + Math.sin(a) * 3.0, 34.0, cz + Math.cos(a) * 3.0, a); G.planeShape(P, M.niche, [[-0.5, 0], [0.5, 0], [0.5, 0.7], [-0.5, 0.7]], 0.1); P.pop(); }
  const l1 = D.octStage(P, M, cx, cz, 35.6, 37.4, 2.9, { mat: mk.wall, winW: 0.5, winH: 1.0, winY: 0.25, face: (i) => (i % 2 === 0 ? 'arch' : 'niche'), cornice: 0.35, proj: 1.14, winMat: M.winGreen });
  const o = D.onion(P, M.copper, cx, l1, cz, 0.85, 0.9);
  D.crown(P, M, cx, o - 0.05, cz, 0.2, AX.H - (o - 0.05) - 0.4, 0);
}
