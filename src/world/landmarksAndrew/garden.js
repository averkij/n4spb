// landmarksAndrew/garden.js - the ANNUNCIATION COMPOUND round the church (docs/research/andrew.md sections 8.5, 8.6; photos refs/andrew 131 132 142 143 144 145 146 147 150 151 152 153 154 156):
//   * the FORECOURT (the 8th-line gate N(-99.1, 1.1) to the belfry portal, 70 m): granite setts, clipped at the real asphalt (the mapped service lane stays asphalt: road integrity);
//   * the BLAGOVESHCHENSKY GARDEN (r1443040, 134 x 75 m): lawn, the E-W and N-S axes, the rhombus, the central circle and the five bay paths (gravel / paving stones, 2.4 m, the OSM footways it replaces),
//     about 80 limes and birches (instanced), lantern lamps, the children's playground (yellow / red equipment) in front of the south face of the church;
//   * the FENCES: ochre stuccoed piers (0.8 m, 2.4 m, spacing 3.6 m) with black panels (Greek-key frieze, diamond lattice, spear tips; photos 143 145 147) on the OSM ways round the compound, gates open;
//     the four principal gates carry pairs of pedimented peach-pink GATE PAVILIONS (3.4 x 2.8 m, apex 4.4 m);
//   * the CHAPEL OF 1899 (r1443035, M. Eremeev): a corner enclosure with a 3.5 m ochre wall (white pilasters, blind arches), the octagonal drum with three arched openings, the grey tent roof (diamond scales)
//     to 11.0 m, a small onion and a gilt cross (11.5 m) and the white three-arched porch toward Maly pr.
// Frame N (frame.js).  Everything standing is solid (colliders); lawn is walkable, the fences and the chapel are not.
import * as THREE from 'three';
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { FN } from './frame.js';
import * as G from './geo.js';
import * as D from './domes.js';
import * as LO from './loft.js';
import * as O from './orders.js';
import { ribbon, fillPolyClipped, fillPolyFine, coverFn, inRing } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';
import { plantTrees } from './trees.js';
import { fenceRuns } from './fence.js';
import { footprintIn, wallBoxes } from './ringkit.js';

const w = (a, b) => { const p = FN.W(a, b); return [p.x, p.z]; };
const wp = (pts) => pts.map(([a, b]) => w(a, b));
const GARDEN = [[-84.1, -97.1], [-14, -96.5], [-14.2, -91.4], [-10.7, -91.3], [-8.5, -88.6], [-7.2, -88.6], [-6.6, -68.8], [1.8, -69.2], [35.2, -72.5], [35.1, -27.1], [21.3, -27.1], [21.3, -25.6], [13.9, -25.7], [13.9, -21.7], [-64.7, -22], [-65.3, -36.7], [-72.9, -49.2], [-99.1, -49.8], [-98.9, -82.1], [-81.4, -82], [-81.4, -87.3], [-83.4, -87.3]];
const FORECOURT = [[-99, -22], [-29, -22], [-29, 18.2], [-55.8, 18.4], [-55.7, 5.3], [-99, 4.9]];
const PLAYGROUND = [[28.5, -47.4], [28, -29.5], [-3, -30.4], [-2.5, -48.2]];
const CHAPEL_FALL = { outer: [[-98.4, -82.1], [-98.5, -95.6], [-96.6, -97.3], [-94.6, -97.1], [-84.1, -97.1], [-83.4, -87.3], [-81.4, -87.3], [-81.4, -82]], holes: [] };
// footways of the garden (OSM, frame N) that the module draws itself (the claimed polygon removes the generic ribbons): [points, surface]
const PATHS = [
  [[[-98.8, -60.9], [-70.7, -59.9], [-42.5, -58.8]], 'p'], [[[-32.9, -58.7], [22.2, -57.7], [35.1, -56.3]], 'p'], [[[-37.7, -63.6], [-38.4, -84.7], [-38, -96.9]], 'g'], [[[-37.8, -54], [-37.1, -28.5]], 'g'],
  [[[-70.7, -59.9], [-59.3, -69.8], [-38.4, -84.7], [-25.8, -76.2], [-2.2, -58.4]], 'g'], [[[-2.2, -58.4], [-14.9, -46.1], [-37.1, -28.5], [-58.8, -47.4], [-70.7, -59.9]], 'g'],
  [[[4.6, -58.2], [4.5, -48.1]], 'p'], [[[22.2, -57.7], [22.3, -47.5]], 'p'],
  [[[-37.8, -54], [-39.6, -54.4], [-41.2, -55.5], [-42.1, -57], [-42.5, -58.8], [-42.1, -60.7], [-41.1, -62.3], [-39.5, -63.2], [-37.7, -63.6]], 'p'],
  [[[-37.7, -63.6], [-35.8, -63.2], [-34.3, -62.2], [-33.3, -60.6], [-32.9, -58.7], [-33.3, -57], [-34.4, -55.4], [-35.9, -54.4], [-37.8, -54]], 'p'],
  [[[-49.4, -39.2], [-51.1, -37.8], [-53.5, -37.2], [-55.9, -37.5], [-58, -38.7], [-59.5, -40.6], [-60.2, -42.9], [-59.9, -45.3], [-58.8, -47.4]], 'p'], [[[7.7, -58.1], [8.2, -61], [9.6, -63], [11.7, -64.3], [14, -64.7], [16.4, -64.1], [18.4, -62.6], [19.6, -60.6], [20, -57.7]], 'p'],
  [[[-14.9, -46.1], [-14.1, -44.5], [-13.9, -42.1], [-14.5, -39.8], [-16.1, -37.9], [-18.2, -36.7], [-20.6, -36.5], [-22.9, -37.1], [-24.7, -38.5]], 'p'], [[[-59.3, -69.8], [-60.2, -71.6], [-60.4, -74], [-59.6, -76.3], [-58.1, -78.2], [-55.9, -79.2], [-53.4, -79.5], [-51.2, -78.7], [-49.4, -77.1]], 'p'],
  [[[-25.8, -76.2], [-24.3, -77.7], [-22, -78.5], [-19.5, -78.4], [-17.4, -77.3], [-15.7, -75.6], [-15, -73.3], [-15, -70.9], [-16, -68.6]], 'p'],
];
// fence runs (OSM ways, frame N) with their gates: [points, gates [a, b, kind]]; kind 'p' = flanked by gate pavilions
const FENCES = [
  [[[-84.1, -97.1], [-38, -96.9], [-14, -96.5], [6.5, -96.4], [9, -96.3]], [[-38, -96.9, 'p'], [6.5, -96.4, 'p']]],
  [[[-99.1, -49.8], [-98.8, -60.9], [-98.9, -82.1]], [[-98.8, -60.9, 'p']]],
  [[[1.8, -69.2], [35.2, -72.5], [35.1, -27.1], [35.4, -20.9], [35.1, 16.9], [35.4, 25.9]], [[35.1, -56.3, 'p'], [35.4, -20.9], [35.1, 16.9], [35.2, 22.5]]],
  [[[35.4, 25.9], [-23.1, 22.9]], []],
  [[[-29.2, 22.8], [-29.1, 18.2], [-55.8, 18.4], [-55.7, 5.3], [-99, 4.9]], []],
  [[[-55.8, 24.2], [-55.8, 18.4]], []],
  [[[13.9, -21.7], [-64.7, -22.0]], []],
  [[[-81.5, -22.3], [-77.7, -22.2], [-73.5, -22]], [[-77.7, -22.2]]],
  [[[-73.6, 5.2], [-73.5, 1.3], [-73.5, -22]], [[-73.5, 1.3]]],
  [[[-64.6, -28.1], [-65.3, -36.7], [-72.9, -49.2], [-81.5, -49.7]], []],
  [[[-99.1, -22.4], [-99.1, 1.1], [-99, 4.9]], [[-99.1, 1.1]]],
];

/** ochre stuccoed pier 0.8 m, 2.4 m: granite foot, ochre shaft with a white stepped cornice and a rounded grey zinc cap (photos 144 145) */
function pierAnn(Q, M, A) {
  Q.box(A.granite, -0.42, 0.42, 0, 0.45, -0.42, 0.42, 'b', 1);
  Q.box(A.ochre, -0.4, 0.4, 0.45, 2.0, -0.4, 0.4, 'b', 1);
  Q.box(M.white, -0.46, 0.46, 2.0, 2.1, -0.46, 0.46, 'b', 1); Q.box(M.white, -0.5, 0.5, 2.1, 2.22, -0.5, 0.5, 'b', 1);
  Q.cyl(M.zinc, [0, 2.22, 0], [0, 2.42, 0], 0.42, 0.3, 8, true);
}

function mats(K) {
  const { ctx, M } = K; if (M.gar) return M.gar;
  const T = ctx.mat.toon, tex = ctx.tex, W = '#ffffff';
  const scalesTex = tex.draw(128, 128, (g, wd, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, wd, h); g.strokeStyle = 'rgba(40,44,48,0.55)'; g.lineWidth = 2; for (let i = -4; i < 9; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + 128, h); g.stroke(); g.beginPath(); g.moveTo(i * 32 + 128, 0); g.lineTo(i * 32, h); g.stroke(); } }, { key: 'lmAnd-annScales2', repeat: [1, 1] });
  const m = {
    ochre: T('#e8c46a', { name: 'lmAnd-gatOchre', paint: 0.05 }), granite: T('#8a8480', { map: M.A.graniteGrain, name: 'lmAnd-gatGranite', paint: 0.04 }), peach: T('#f0cfb8', { name: 'lmAnd-gatPeach', paint: 0.05 }),
    wallOchre: T('#e9c76a', { name: 'lmAnd-chapWall', paint: 0.05 }), chapel: T('#f0c27a', { name: 'lmAnd-chapel', paint: 0.05 }), tent: T('#8c9296', { map: scalesTex, name: 'lmAnd-tent', paint: 0.04, side: 'double' }),
    infill: T('#e8a850', { name: 'lmAnd-infill', paint: 0.04 }), sand: T('#c8b290', { map: M.A.gravel, name: 'lmAnd-playSand', paint: 0.05, polygonOffset: -2 }),
    yel: T('#f2c230', { name: 'lmAnd-playYel', paint: 0.04 }), red: T('#d9423a', { name: 'lmAnd-playRed', paint: 0.04 }), steel: T('#c9ccd0', { name: 'lmAnd-playSteel', paint: 0.02 }),
    pave: T('#a8a39b', { map: M.A.slabGrey, name: 'lmAnd-gardenPave', paint: 0.03, polygonOffset: -3 }), grit: T('#b8a07e', { map: M.A.gravel, name: 'lmAnd-gardenGrit', paint: 0.05, polygonOffset: -3 }),
  };
  M.gar = m; return m;
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx), mk = mats(K), rng = ctx.rng(6619);
  const clip = (x, z) => cover(x, z);
  // ---------------------------------------------------------------------------- forecourt paving (granite setts) in frame N
  P.push(FN.ox, 0, FN.oz, FN.rot);
  try {
    K.svc.forecourtTris = fillPolyClipped(P, M.sett, FORECOURT, 0.045, clip, { margin: 0.25, maxEdge: 3, tile: 2 });
    // the garden: lawn (the paths and the playground lie above it)
    fillPolyFine(P, M.lawn, GARDEN, 0.03, { maxEdge: 12, tile: 6 });
    for (const [pts, kind] of PATHS) ribbon(P, kind === 'p' ? mk.pave : mk.grit, pts, kind === 'p' ? 2.4 : 2.6, 0.05, { tile: kind === 'p' ? 3.6 : 3, seg: 1.5, clip: (x, z) => { const p = FN.W(x, z); return cover(p.x, p.z) > -0.3; } });
    fillPolyFine(P, mk.sand, PLAYGROUND, 0.055, { maxEdge: 8, tile: 3 });
  } finally { P.pop(); }
  // ---------------------------------------------------------------------------- playground equipment (colourful, 2-3 m)
  P.push(FN.ox, 0, FN.oz, FN.rot);
  try {
    const towers = [[2, -42, mk.yel, 2.6], [10, -38, mk.red, 2.2], [18, -43, mk.yel, 2.8], [24, -35, mk.red, 2.0], [-0.5, -34, mk.yel, 2.2]];
    for (const [a, b, mat, h] of towers) {
      P.box(mk.steel, a - 0.65, a + 0.65, 0.05, h * 0.5, b - 0.65, b + 0.65, 'b', 1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.col(mk.steel, a + sx * 0.6, b + sz * 0.6, 0.05, h, 0.04, 0.04, 5, true);
      P.box(mat, a - 0.62, a + 0.62, h * 0.55, h * 0.58, b - 0.62, b + 0.62, '', 1);
      P.box(mat, a - 0.75, a + 0.75, h, h + 0.16, b - 0.75, b + 0.75, 'b', 1);
      LO.pyramid(P, mat, a, b, 0.85, 0.85, h + 0.16, h + 0.75, 0);
    }
    P.quad(mk.red, [6, 0.15, -44.7], [8.4, 0.15, -44.7], [8.4, 1.5, -46.2], [6, 1.5, -46.2], [0, 1, 0.5]);
  } finally { P.pop(); }
  for (const [a, b] of [[2, -42], [10, -38], [18, -43], [24, -35], [-0.5, -34]]) { const p = FN.W(a, b); ph.addBox(p.x, p.z, 1.4, 1.4, FN.rot, 0, 2.8); }
  // ---------------------------------------------------------------------------- trees: limes (outer ring + both axes + bays) and birch groups (instanced)
  const trees = [], gw = wp(GARDEN), inGarden = (x, z) => inRing(gw, x, z);
  const nearPath = (x, z) => PATHS.some(([pts]) => { for (let i = 0; i + 1 < pts.length; i++) { const A = w(...pts[i]), B = w(...pts[i + 1]), dx = B[0] - A[0], dz = B[1] - A[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - A[0]) * dx + (z - A[1]) * dz) / l2)); if (Math.hypot(x - A[0] - dx * t, z - A[1] - dz * t) < 1.9) return true; } return false; });
  const addTree = (a, b, fam, s0 = 0.95) => { const p = FN.W(a, b); if (!inGarden(p.x, p.z) || nearPath(p.x, p.z) || L.insideBuilding(p.x, p.z, 0.6) || cover(p.x, p.z) > -0.8) return; trees.push({ x: p.x, z: p.z, fam, s: s0 + rng() * 0.3, yaw: rng() * 6.28, y: 0.05 }); };
  for (let a = -90; a < 33; a += 8) { addTree(a, -94.0, 'limeA'); addTree(a, -26.0, 'limeB'); }
  for (let b = -92; b < -26; b += 8) { addTree(33.0, b, 'limeA'); }
  for (let a = -92; a < 30; a += 7.2) { addTree(a, -62.6, 'limeA', 1.0); addTree(a + 3.5, -54.6, 'limeB', 1.0); }
  for (let b = -94; b < -30; b += 7.2) { addTree(-41.6, b, 'limeA', 1.0); addTree(-34.4, b + 3.5, 'limeB', 1.0); }
  for (const [a, b] of [[-54.8, -74], [-20.4, -73], [-19.8, -42], [-54.2, -43], [13.8, -61]]) for (let k = 0; k < 3; k++) addTree(a + (k - 1) * 4.0 + (rng() - 0.5) * 2, b + (rng() - 0.5) * 4, k === 1 ? 'birchA' : 'birchB', 0.9);
  try { plantTrees(K, trees, 'lmAnd-garden-trees'); K.svc.trees.push(...trees.map((t) => ({ x: t.x, z: t.z, fam: t.fam }))); } catch (e) { console.warn('[landmarksAndrew] garden trees:', e && e.message); }
  // ---------------------------------------------------------------------------- lamps: black lantern lamps (3.6 m) at the bays and round the central circle
  const lampG = partsGeos((Q) => O.lanternLamp(Q, M, 3.6)), lm = [], lmIt = [];
  for (const [a, b] of [[-33.0, -54.1], [-42.4, -54.1], [-33.0, -63.5], [-42.4, -63.5], [-54.8, -80.9], [-20.4, -79.8], [-19.8, -35.0], [-54.2, -35.4], [14.0, -66.2], [-35.3, -90], [-35.0, -31], [8, -54.6], [-66, -57.2], [26, -55]]) {
    const p = FN.W(a, b); if (!inGarden(p.x, p.z) || cover(p.x, p.z) > -1.0 || nearPath(p.x, p.z)) continue;
    lm.push({ x: p.x, y: 0.05, z: p.z, rotY: 0 }); lmIt.push(ph.addCylinder(p.x, p.z, 0.2, 0, 3.7)); K.svc.lamps.push({ x: p.x, z: p.z, h: 3.6 });
  }
  K.extraTris += knockFurniture(ctx, 'lmAnd-garden-lamps', lampG, lm, lmIt, FURNITURE_REC.lamp(3.6), 300);      // knock records (docs/AREAS.md 13.7)
  // ---------------------------------------------------------------------------- fences with gates (open), gate pavilions at the principal gates
  const A = mk, runs = [], pavGates = [];
  for (const [pts, gates] of FENCES) runs.push({ pts: wp(pts), gates: gates.map(([a, b, kind]) => { const p = w(a, b); if (kind === 'p') pavGates.push({ x: p[0], z: p[1], pts: wp(pts) }); return { x: p[0], z: p[1], half: 2.1 }; }) });
  fenceRuns(K, runs, { name: 'annunciation', pitch: 3.6, gateHalf: 2.1, pier: (Q, MM) => pierAnn(Q, MM, A), gatePier: (Q, MM) => pierAnn(Q, MM, A), panelMat: M.fenceAnn, plinthMat: mk.granite, plinthH: 0.42, plinthT: 0.4, panelY0: 0.5, panelY1: 2.0, panelTile: 3.6, pierW: 0.8, colH: 2.0 });
  for (const g of pavGates) { try { gatePavilions(K, mk, g); } catch (e) { console.error('[landmarksAndrew] gate pavilions:', e); } }
  // ---------------------------------------------------------------------------- the chapel of 1899 in its corner enclosure
  try { chapel(K, mk); } catch (e) { console.error('[landmarksAndrew] chapel:', e); }
  // ---------------------------------------------------------------------------- services
  const fc = FN.W(-45, 1), gc = FN.W(-37.7, -58.8);
  K.svc.crowd.push({ id: 'ann-forecourt', kind: 'photo', x: fc.x, z: fc.z, r: 10, n: 7 }, { id: 'ann-garden-circle', kind: 'rest', x: gc.x, z: gc.z, r: 8, n: 8 });
  for (const [a, b, yaw, name, pitch] of [[-69, 1.1, -60, 'Благовещенская церковь: колокольня от ворот двора', 12], [-3, -50, -101, 'Благовещенский сад: южный фасад и пять глав', 10]]) { const p = FN.W(a, b); if (!L.insideBuilding(p.x, p.z, 0.5) && cover(p.x, p.z) < -0.6) K.svc.photoSpots.push({ x: p.x, z: p.z, yaw, pitch, name }); }
  void THREE; void D; void G; void wallBoxes; void footprintIn; void L;
}

/** a pair of pedimented gate pavilions (3.4 x 2.8 m, apex 4.4 m) either side of a gate node, standing in the fence line (local x along the fence, z across) */
function gatePavilions(K, mk, g) {
  const { P, M, ctx } = K, ph = ctx.physics;
  // tangent of the nearest fence segment
  let best = null;
  for (let i = 0; i + 1 < g.pts.length; i++) { const a = g.pts[i], b = g.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((g.x - a[0]) * dx + (g.z - a[1]) * dz) / l2)), d = Math.hypot(g.x - a[0] - dx * t, g.z - a[1] - dz * t); if (!best || d < best.d) best = { d, dx, dz }; }
  const rot = Math.atan2(-best.dz, best.dx);
  P.push(g.x, 0, g.z, rot);
  for (const s of [-1, 1]) {
    P.push(s * (2.5 + 1.7), 0, 0, 0);                                                                                           // the front of each pavilion faces +z
    P.box(mk.granite, -1.7, 1.7, 0, 0.5, -1.4, 1.4, 'b', 1);
    P.box(mk.peach, -1.55, 1.55, 0.5, 3.0, -1.25, 1.25, 'b', 2);
    for (const x of [-1.55, 1.55]) P.box(M.white, x - 0.2, x + 0.2, 0.5, 3.0, 1.25, 1.34, 'bk', 1);
    P.box(M.white, -1.8, 1.8, 3.0, 3.3, -1.5, 1.5, 'b', 1);
    P.quad(M.underside, [-1.8, 3.0, -1.5], [1.8, 3.0, -1.5], [1.8, 3.0, 1.5], [-1.8, 3.0, 1.5], [0, -1, 0]);
    P.push(0, 0, 1.5, 0); LO.gable(P, M, 1.75, 3.3, 1.1, { depth: 0.3, tympMat: mk.peach }); P.pop();
    P.push(0, 0, -1.5, Math.PI); LO.gable(P, M, 1.75, 3.3, 1.1, { depth: 0.3, tympMat: mk.peach }); P.pop();
    P.box(M.sheet, -1.7, 1.7, 3.3, 3.45, -1.0, 1.0, 'b', 2);
    G.planeShape(P, M.niche, G.archPts(0, 0.9, 1.0, 2.0, 8), 1.26);
    P.pop();
    const c = [Math.cos(rot), -Math.sin(rot)], wx = g.x + c[0] * s * 4.2, wz = g.z + c[1] * s * 4.2;
    ph.addBox(wx, wz, 3.4, 2.8, rot, 0, 4.4);
  }
  P.pop();
}

/** the chapel of 1899 and its corner enclosure (OSM r1443035): the 3.5 m ochre street walls with white pilasters and blind arches, the octagonal chapel with a tent roof, the white three-arched porch */
function chapel(K, mk) {
  const { ctx, P, M } = K, ph = ctx.physics, fp = footprintIn('r1443035', FN, CHAPEL_FALL), ring = fp.outer;
  P.push(FN.ox, 0, FN.oz, FN.rot);
  // the enclosure: walls round the ring (extruded boxes along the edges, 0.5 m thick, 3.5 m high) + white pilasters every 4 m + a cornice cap
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.4) continue;
    P.push(a[0], 0, a[1], Math.atan2(-dz, dx));                                  // local x along the edge
    P.box(mk.wallOchre, 0, len, 0, 3.5, -0.25, 0.25, 'b', 3);
    P.box(M.white, -0.05, len + 0.05, 3.5, 3.75, -0.34, 0.34, 'b', 1);
    for (let u = 0.3; u < len; u += 4.0) for (const sz of [-1, 1]) P.box(M.white, u - 0.25, u + 0.25, 0.0, 3.5, sz > 0 ? 0.25 : -0.32, sz > 0 ? 0.32 : -0.25, sz > 0 ? 'bk' : 'bf', 1);          // pilasters on both faces (the face against the wall is not drawn)
    P.pop();
  }
  const c = ring.reduce((t, p) => [t[0] + p[0] / ring.length, t[1] + p[1] / ring.length], [0, 0]), cx = c[0] + 0.5, cz = c[1] + 0.5;
  P.cap(M.sett, ring, 0.05, true, 2);
  // the octagonal chapel: drum 6.2 m across flats on a plinth, three arched openings with orange infill, a diamond-scale tent roof, a small onion and a gilt cross (11.5 m)
  G.frustum(P, M.plinth, cx, cz, 0, 0.5, 8, 3.7, 3.7, Math.PI / 8, 2, 0.5, { capTop: M.plinth });
  const top = D.octStage(P, M, cx, cz, 0.5, 5.5, 6.2, { mat: mk.chapel, winW: 1.8, winH: 3.2, winY: 0.15, face: (i) => (i === 0 || i === 2 || i === 6 ? 'arch' : 'niche'), cornice: 0.5, proj: 1.08 });
  const rings = [LO.polyRing(cx, cz, top, 3.45, 8), LO.polyRing(cx, cz, top + 2.2, 2.0, 8), LO.polyRing(cx, cz, top + 3.5, 0.5, 8)];
  LO.loft(P, mk.tent, rings, { uTile: 2.2 });
  const o = D.onion(P, M.silver, cx, top + 3.4, cz, 0.42, 1.0);
  D.crown(P, M, cx, o - 0.05, cz, 0.15, 11.5 - (o - 0.05) - 0.3, 0);
  // the porch of three round arches on columns on the Maly pr. side (north, toward -b)
  P.push(cx, 0, cz - 3.2, Math.PI);
  P.box(M.white, -2.4, 2.4, 0, 0.3, 0, 1.6, 'b', 1);
  for (const x of [-2.2, -0.75, 0.75, 2.2]) O.column(P, M, x, 1.3, 0.3, 3.0, 0.16);
  for (const x of [-1.5, 0, 1.5]) { G.planeShape(P, M.dark, G.archPts(x, 0.3, 1.2, 2.6, 8), 0.02); }
  P.box(M.white, -2.5, 2.5, 3.0, 3.35, 0, 1.7, 'b', 1);
  P.pop();
  P.pop();
  try { const rec = L.buildingById('r1443035'); if (rec) for (const pl of rec.polys) addPolyColliders(ctx, pl, 0, 4, 0.9); } catch (e) { console.warn('[landmarksAndrew] chapel colliders:', e && e.message); }
  const wc = FN.W(cx, cz); ph.addCylinder(wc.x, wc.z, 3.3, 0, 12);
  K.svc.monuments.push({ id: 'r1443035', name: 'Часовня Благовещенской церкви (1899)', x: wc.x, z: wc.z, h: 11.5, r: 4 });
}
