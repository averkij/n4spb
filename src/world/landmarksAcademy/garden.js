// landmarksAcademy/garden.js - the ACADEMIC GARDEN (Академический сад, 1844-47 A. P. Bryullov after K. A. Thon; fence 1890 V. A. Kenel): docs/research/academy.md 5, photos gc_001..014 gc_002 cr_gc012 cr_ag0894 cr_ag1720.
//   LAWN over the claimed park ring (OSM w111640487, 40 vertices) with the gravel ALLEYS of the 14 mapped footways / paths drawn by the module itself (gardenPaths(): streets draws no footway inside a park that a
//   landmark claims; review-academy 2026-10-08), about 105 old trees (instanced: lime / maple / ash / elm / birch / poplar; the 20 OSM trees first), the black cast-iron
//   FENCE (round bars with spear tips, two rails, 1.6 m on a granite footing, posts every 3 m with ball caps) on the OSM lines with the SEVEN gates of the raw layer (the open ones are openings with granite posts,
//   the closed ones a solid double leaf), the clipped hedges outside the east fence;  the COLUMN of the 50th anniversary of the Academy (1847; 17 m: three granite steps, a 3.0 x 3.0 m pedestal, a pink
//   granite shaft, a bronze Composite capital with three winged women and a lyre) at u -1.6, v -122.3;  the statues of P. K. KLODT (2.10 m bronze on 2.00 m of red granite, u 47.6, v -164.3) and K. KHETAGUROV
//   (a 1.7 m figure on a 3.3 m grey granite pedestal with the verse, u -44.9, v -147.1);  the GARDEN PAVILION (A. A. Mikhailov 1819-21: a two-storey yellow range with a hexastyle portico of fluted baseless Doric columns,
//   entablature 2.3 m with relief metopes, pediment apex 12.6 m, and three-storey wings), the MOSAIC workshop (1862-64, ochre, an L ring) and the BATTLE-painting workshop (1897, a glazed one-storey studio); benches.
//   Frame: the academy frame (u, v).  The garden is entered by the two OPEN west gates (n1271391440 at the Academy's NW corner, n7164825502); the four east gates are closed or private.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringEdges, onEdge, band } from './kit.js';
import { texQuad } from './shell.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { ACAD, W, M as toLocal, POLY } from './frame.js';
import { greekDoric, entabl } from './orders.js';
import { lathe } from './prims.js';
import { fillPolyFine, coverFn, ribbon } from './surfaces.js';
import { ROADS } from '../data/city.js';
import { klodtFig, khetagurovFig } from './monuments.js';
import { knockBays, splitBays, unitPanel, unitBox } from '../lib/fence-bays.js';        // n4spb (docs/AREAS.md 13.7, docs/vo-m1.md): the fence, its closed gate leaves and the hedges are breakable bays,
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';              // the benches are knock records
import { partsGeos } from './inst.js';
import { figureMats, tube } from '../lib/figures.js';
import { plantTrees } from './trees.js';

const PARK = [[-70.47, -58.43], [-70.23, -62.4], [-69.6, -182.82], [-34.84, -182.44], [-34.79, -185.35], [-31.75, -185.27], [-29.03, -185.2], [-29.04, -181.86], [-10.75, -181.46], [-10.67, -170.2], [6.57, -170.09], [6.71, -181.41], [24.54, -181.38], [24.47, -184.8], [31.24, -184.96], [31.3, -182.53], [66.11, -182.64], [66.33, -168.72], [66.2, -158.04], [66.25, -155.01], [66.27, -151.75], [49.26, -151.56], [49.49, -133.27], [38.61, -133.16], [38.94, -105.84], [49.57, -105.95], [49.79, -87.52], [67.06, -87.71], [67.1, -85.65], [67.15, -83.36], [67.6, -61.96], [67.71, -58.47], [51.95, -58.45], [51.97, -47.17], [10.07, -47.13], [10.05, -53.33], [-12.61, -53.31], [-12.6, -47.11], [-54.46, -47.07], [-54.49, -58.45]];
const FENCES = [
  { id: 'w111640538', pts: [[-70.47, -58.43], [-70.23, -62.4], [-69.6, -182.82]] },
  { id: 'w111640537', pts: [[66.11, -182.64], [66.33, -168.72], [66.2, -158.04], [66.25, -155.01], [66.27, -151.75]] },
  { id: 'w111640539', pts: [[67.06, -87.71], [67.1, -85.65], [67.15, -83.36], [67.6, -61.96], [67.71, -58.47]] },
  { id: 'w766763999', pts: [[67.15, -83.36], [33.48, -82.94], [33.17, -156.95], [66.2, -158.04]] },
  { id: 'w957243308', pts: [[-69.94, -198.39], [-70.02, -201.22], [-70.14, -204.24]] },
  { id: 'w957243316', pts: [[66, -197.42], [65.95, -200.71], [65.89, -204.31]] },
];
const HEDGES = [[[71.34, -89.08], [71.94, -91.56], [71.9, -117.87]], [[71.67, -66.36], [71.61, -80.23]], [[71.13, -160.41], [71.08, -192.61]], [[70.98, -212.97], [71.11, -231.13]]];
export const GATES = [
  { id: 'n1271391440', u: -70.2, v: -62.4, open: true, name: 'главные западные ворота' }, { id: 'n7164825502', u: -70.0, v: -201.2, open: true, name: 'северо-западные ворота' },
  { id: 'n1271391439', u: 66.3, v: -168.7, open: true, name: 'восточные ворота у памятника Клодту' }, { id: 'n1271391438', u: 67.6, v: -62.0, open: false, name: 'восточные ворота (служебные)' },
  { id: 'n6550670306', u: 65.9, v: -200.7, open: false, name: 'ворота двора (служебные)' }, { id: 'n7161087550', u: 66.2, v: -155.0, open: false, name: 'ворота мозаичной мастерской' },
  { id: 'n7161087553', u: 67.1, v: -85.6, open: false, name: 'ворота мозаичной мастерской (закрыты)' },
];
// the OSM tree nodes (u, v) and the footpaths of the garden (u, v) - the planting keeps 2 m away from them
const OSM_TREES = [[-53, -170], [-56, -176], [-54, -161], [-52, -148], [-47, -128], [-61, -135], [-23, -136], [-9, -148], [-18, -165], [-39, -103], [-61, -108], [-35, -167], [-48, -175], [25, -159], [29, -138], [8, -148], [2, -100], [-9, -103], [22, -102], [31, -113]];
const PATHS = [[[-70, -62], [68, -62]], [[-65, -86], [-32, -88], [-5, -121]], [[-64, -122], [-5, -122]], [[59, -62], [30, -83], [10, -110], [2, -121]], [[30, -62], [30, -157]], [[-32, -88], [30, -83]], [[-3, -126], [-31, -159], [-32, -185]],
  [[2, -124], [33, -160]], [[-64, -149], [33, -168]], [[-63, -86], [-65, -172]]];
const nearLine = (p, u, v, d) => { for (let i = 0; i + 1 < p.length; i++) { const a = p[i], b = p[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dz) / (dx * dx + dz * dz || 1))); if (Math.hypot(u - a[0] - dx * t, v - a[1] - dz * t) < d) return true; } return false; };
const inPark = (u, v) => { let c = false; for (let i = 0, j = PARK.length - 1; i < PARK.length; j = i++) if ((PARK[i][1] > v) !== (PARK[j][1] > v) && u < (PARK[j][0] - PARK[i][0]) * (v - PARK[i][1]) / (PARK[j][1] - PARK[i][1]) + PARK[i][0]) c = !c; return c; };
const distPark = (u, v) => { let best = 1e9; for (let i = 0; i < PARK.length; i++) { const a = PARK[i], b = PARK[(i + 1) % PARK.length], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dz) / (dx * dx + dz * dz))); best = Math.min(best, Math.hypot(u - a[0] - dx * t, v - a[1] - dz * t)); } return best; };
/** the mapped footways / paths of the garden (baked ROADS, surface compacted = pink-brown gravel) in (u, v): `streets` does NOT draw a footway inside a park that a landmark module claims (streets/paths.js
 *  inOwnedPoly), so the module draws its own alleys (review-academy 2026-10-08: the first build had lawn only, the tourist walked on a continuous meadow) */
const REAL_PATHS = (() => {
  try {
    const out = [];
    for (const r of ROADS) {
      if (r.hw !== 'footway' && r.hw !== 'path') continue;
      const pts = []; for (let i = 0; i + 1 < r.pts.length; i += 2) { const q = toLocal(r.pts[i], r.pts[i + 1]); pts.push([q.u, q.v]); }
      if (pts.some((p) => inPark(p[0], p[1]))) out.push({ id: r.id, hw: r.hw, w: r.w ?? (r.hw === 'path' ? 1.8 : 2.4), pts });
    }
    return out;
  } catch (e) { return []; }
})();
const nearPath = (u, v, d) => PATHS.some((p) => nearLine(p, u, v, d)) || REAL_PATHS.some((p) => nearLine(p.pts, u, v, d));
const chaikin = (pts) => { const o = [pts[0]]; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); return o; };

let _ball = null;
const ballGeo = () => _ball || (_ball = new THREE.SphereGeometry(1, 8, 6));

// ------------------------------------------------------------------------------------------------ fence, gates, hedges
function fences(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  const gap = 1.3, run = [], cover = coverFn(ctx);
  const onRoad = (u, v) => { const w = W(u, v); return cover(w.x, w.z) > -0.3; };                                       // road integrity: no footing, post or leaf on real asphalt (a service road runs through the gate n6550670306)
  const post = (u, v, h = 1.75) => { if (onRoad(u, v)) return; P.box(M.graniteGrey, u - 0.2, u + 0.2, 0, 0.45, v - 0.2, v + 0.2, 'b', 1); P.box(M.iron, u - 0.075, u + 0.075, 0.45, h, v - 0.075, v + 0.075, 'b', 1); P.geo(M.iron, ballGeo(), u, h + 0.07, v, 0, 0, 0, 0.11); };
  const fenceBays = [];      // n4spb: the fence is a row of BREAKABLE bays (one per ~3 m section, a thin collider + a knock record + the drawn footing and panel each); the posts stay instanced
  const piece = (a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); if (len < 0.2) return;
    const wa0 = W(a[0], a[1]), wb0 = W(b[0], b[1]);
    // the visual is cut into sections of about 3 m (the post pitch) and ONLY the sections that touch real asphalt are left out (the first build tested the two ends and the middle of the WHOLE
    // piece: the 136 m west fence of the garden ends 1.3 m from the gate on the asphalt of the service stub w766764000 and was dropped completely, review-academy 2026-10-08).  The collider stays (n4spb: a ghost bay).
    const k = Math.max(1, Math.round(len / 3.0)), at = (t) => [a[0] + dx * t, a[1] + dz * t], ok = [];
    for (let i = 0; i < k; i++) { const p = at(i / k), q = at((i + 1) / k), m = at((i + 0.5) / k); ok.push(!(onRoad(p[0], p[1]) || onRoad(m[0], m[1]) || onRoad(q[0], q[1]))); }
    const fc = (K.svc.fence ||= { drawn: 0, dropped: 0 });
    splitBays(wa0.x, wa0.z, wb0.x, wb0.z, 3.0, { y: 0 }).forEach((bay, i) => { bay.ghost = ok[Math.min(i, k - 1)] === false; if (bay.ghost) fc.dropped++; else fc.drawn++; fenceBays.push(bay); });
    for (let i = 0; i <= k; i++) if ((i > 0 && ok[i - 1]) || (i < k && ok[i])) { const p = at(i / k); post(p[0], p[1]); }
  };
  for (const f of FENCES) {
    // gaps at the gates that lie on this polyline
    const segs = []; let s = 0;
    for (let i = 0; i + 1 < f.pts.length; i++) { const a = f.pts[i], b = f.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l, s0: s, s1: s + l }); s += l; }
    const gaps = [];
    for (const g of GATES) for (const sg of segs) {
      const dx = sg.b[0] - sg.a[0], dz = sg.b[1] - sg.a[1], t = Math.max(0, Math.min(1, ((g.u - sg.a[0]) * dx + (g.v - sg.a[1]) * dz) / (sg.l * sg.l)));
      if (Math.hypot(g.u - sg.a[0] - dx * t, g.v - sg.a[1] - dz * t) < 0.9) { gaps.push({ g, c: sg.s0 + t * sg.l, dir: [dx / sg.l, dz / sg.l] }); break; }
    }
    const at = (sv) => { const sg = segs.find((q) => sv <= q.s1 + 1e-6) || segs[segs.length - 1], t = (sv - sg.s0) / sg.l; return [sg.a[0] + (sg.b[0] - sg.a[0]) * t, sg.a[1] + (sg.b[1] - sg.a[1]) * t]; };
    const cuts = gaps.map((q) => [q.c - gap, q.c + gap]).sort((a, b) => a[0] - b[0]);
    let cur = 0; const keep = [];
    for (const c of cuts) { if (c[0] > cur + 0.2) keep.push([cur, c[0]]); cur = Math.max(cur, c[1]); }
    if (s > cur + 0.2) keep.push([cur, s]);
    for (const [s0, s1] of keep) {
      // walk the polyline vertices between s0 and s1
      const pts = [at(s0)]; for (const sg of segs) if (sg.s1 > s0 + 0.05 && sg.s0 < s1 - 0.05) { if (sg.s1 < s1 - 0.05 && sg.s1 > s0 + 0.05) pts.push(sg.b); } pts.push(at(s1));
      for (let i = 0; i + 1 < pts.length; i++) piece(pts[i], pts[i + 1]);
    }
    for (const q of gaps) {
      const g = q.g, d = q.dir, a = [g.u - d[0] * gap, g.v - d[1] * gap], b = [g.u + d[0] * gap, g.v + d[1] * gap];
      post(a[0], a[1], 2.1); post(b[0], b[1], 2.1);
      const w = W(g.u, g.v);
      if (!g.open) {                                                                                  // a closed double leaf with a cross rail and a collider (no visual on a road)
        if (!onRoad(g.u, g.v)) P.box(M.iron, g.u - 0.04, g.u + 0.04, 0.2, 1.9, g.v - 0.04, g.v + 0.04, 'b', 1);
        const wa = W(a[0], a[1]), wb = W(b[0], b[1]);
        fenceBays.push({ x0: wa.x, z0: wa.z, x1: wb.x, z1: wb.z, y: 0, gate: true, ghost: onRoad(g.u, g.v) });      // the leaf (a panel + the cross rail) is a bay of its own: a car breaks the gate
      }
      K.svc.gates.push({ id: g.id, x: w.x, z: w.z, open: g.open, w: gap * 2, name: 'Академический сад: ' + g.name });
    }
    K.svc.fences.push({ id: f.id, pts: f.pts.map((p) => { const w = W(p[0], p[1]); return [w.x, w.z]; }), height: 1.65, gates: gaps.map((q) => q.g.id) });
  }
  // the hedges outside the east fence (clipped, 1.2 m high, 0.8 m wide): the drawn hedge stays, its collider is a row of breakable GHOST bays (n4spb)
  const hedgeBays = [];
  for (const h of HEDGES) for (let i = 0; i + 1 < h.length; i++) {
    const a = h[i], b = h[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), nx = dz / len, nz = -dx / len, t = 0.4;
    const v = (p, s, y) => [p[0] + nx * t * s, y, p[1] + nz * t * s];
    P.quad(M.hedge, v(a, 1, 0), v(b, 1, 0), v(b, 1, 1.15), v(a, 1, 1.15), [nx, 0, nz]); P.quad(M.hedge, v(b, -1, 0), v(a, -1, 0), v(a, -1, 1.15), v(b, -1, 1.15), [-nx, 0, -nz]);
    P.quad(M.hedge, v(a, 1, 1.2), v(b, 1, 1.2), v(b, -1, 1.2), v(a, -1, 1.2), [0, 1, 0]);
    const wa = W(a[0], a[1]), wb = W(b[0], b[1]); hedgeBays.push(...splitBays(wa.x, wa.z, wb.x, wb.z, 3.0, { y: 0, ghost: true }));
  }
  const cut = M.cutouts && M.cutouts.has(M.fence);
  knockBays(ctx, { name: 'lmacade-garden-fence', bays: fenceBays, far: 320,
    parts: [
      { geo: unitBox(0, 0.45, -0.17, 0.17, { uLen: 3.0, uvs: 1.2 }), mat: M.graniteGrey, name: 'footing', stretch: true, when: (bay) => !bay.gate },
      { geo: unitPanel(0.45, 1.65, { u1: 3.0 }), mat: M.fence, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: cut, when: (bay) => !bay.gate },
      { geo: unitPanel(0.2, 1.9, { u1: 2.6 }), mat: M.fence, name: 'gate', stretch: true, shadow: false, receive: false, noOutline: cut, when: (bay) => !!bay.gate },
    ],
    collider: { y0: 0, y1: 2.1, thick: 0.3, e0: 0.05, e1: 0.05 },
    rec: () => ({ kind: 'fence', mass: 220, h: 1.65, anchored: 18, hitK: 0.4, metal: true, minDv: 0 }) });
  knockBays(ctx, { name: 'lmacade-garden-hedge', bays: hedgeBays, parts: [], far: 260, collider: { y0: 0, y1: 1.3, thick: 0.9, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 100, h: 1.2, anchored: 12, hitK: 0.3, metal: false, minDv: 0 }) });
  K.extraTris += fenceBays.filter((bay) => !bay.ghost).length * 12;
  void run;
}

// ------------------------------------------------------------------------------------------------ the column of 1847
function column(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cu = -1.6, cv = -122.3;
  for (let i = 0; i < 3; i++) { const h = 3.5 - i * 0.3; P.box(M.graniteGrey, cu - h, cu + h, i * 0.3, (i + 1) * 0.3, cv - h, cv + h, 'b', 2.4); }                    // the three steps of the stylobate
  P.box(M.graniteGrey, cu - 1.55, cu + 1.55, 0.9, 1.1, cv - 1.55, cv + 1.55, 'b', 2.4); P.box(M.graniteGrey, cu - 1.4, cu + 1.4, 1.1, 3.9, cv - 1.4, cv + 1.4, 'b', 2.4);
  P.box(M.graniteGrey, cu - 1.55, cu + 1.55, 3.9, 4.1, cv - 1.55, cv + 1.55, '', 2.4);
  lathe(P, M.marble, cu, cv, [[1.15, 4.1], [1.15, 4.3], [1.0, 4.4], [0.95, 4.5]], 18);                                                                                          // the marble base
  lathe(P, M.verdi, cu, cv, [[0.98, 4.5], [0.98, 4.62], [0.9, 4.7], [0.9, 4.78], [0.86, 4.86]], 18);                                                                           // the bronze base ring
  lathe(P, M.graniteColumn, cu, cv, [[0.86, 4.86], [0.85, 5.0], [0.78, 9.4], [0.7, 13.6], [0.66, 13.7]], 28);                                                                  // the pink granite shaft
  // the Composite capital (gc_001: 1.46 x the shaft width at the abacus, not 2.06 x as the first build had): neck ring, a bell that swells to a cylinder, a thin abacus with a dished top
  lathe(P, M.verdi, cu, cv, [[0.7, 13.6], [0.745, 13.7], [0.745, 13.82], [0.8, 13.9], [0.9, 14.2], [0.96, 14.7], [1.0, 15.1], [1.02, 15.25], [1.1, 15.3], [1.1, 15.45], [1.14, 15.48], [1.14, 15.58], [1.0, 15.58], [0.7, 15.52], [0.5, 15.54]], 28);
  for (let k = 0; k < 16; k++) {                                                                                                                                                 // acanthus leaves round the bell
    const a2 = k * Math.PI * 2 / 16, r = 0.9 + (k % 2) * 0.05, y = 14.15 + (k % 2) * 0.35;
    P.push(cu + Math.sin(a2) * r, y, cv + Math.cos(a2) * r, a2); P.geo(M.verdi, new THREE.SphereGeometry(1, 7, 5), 0, 0.2, 0, 0, 0, 0, 0.12, 0.4, 0.08); P.pop();
  }
  for (let k = 0; k < 3; k++) {                                                                                                                                                  // three winged women, a plaque under each
    const a = k * Math.PI * 2 / 3 + 0.3, x = cu + Math.sin(a) * 0.98, z = cv + Math.cos(a) * 0.98, mt = [M.colPlateA, M.colPlateB, M.colPlateC][k];
    P.push(x, 14.75, z, a); P.geo(M.verdi, new THREE.SphereGeometry(1, 10, 8), 0, 0.1, 0.0, 0, 0, 0, 0.26, 0.55, 0.22);
    for (const s of [-1, 1]) P.geo(M.verdi, new THREE.SphereGeometry(1, 8, 6), s * 0.4, 0.28, -0.05, 0, 0, s * 0.5, 0.12, 0.5, 0.05);
    P.geo(M.verdi, new THREE.SphereGeometry(1, 8, 6), 0, 0.72, 0.02, 0, 0, 0, 0.12, 0.14, 0.12);
    P.quad(mt, [-0.3, -0.7, 0.3], [0.3, -0.7, 0.3], [0.3, -0.55, 0.3], [-0.3, -0.55, 0.3], [0, 0, 1]);
    P.pop();
  }
  lathe(P, M.verdi, cu, cv, [[0.3, 15.62], [0.3, 15.75], [0.18, 15.9], [0.2, 16.05], [0.12, 16.1]], 12);                                                                      // the ball under the lyre
  // the lyre (gc_001: a Greek lyre, two arms swelling outward and curving back in, a cross-bar, strings): curved tubes instead of the straight trapezoid frame of the first build
  for (const s of [-1, 1]) P.geo(M.verdi, tube([[cu + s * 0.16, 16.02, cv], [cu + s * 0.42, 16.3, cv], [cu + s * 0.5, 16.75, cv], [cu + s * 0.34, 17.08, cv], [cu + s * 0.22, 17.0, cv]], [[0.045, 0.045], [0.05, 0.05], [0.05, 0.05], [0.04, 0.04], [0.032, 0.032]], { seg: 6, per: 4 }));
  P.cyl(M.verdi, [cu - 0.46, 16.86, cv], [cu + 0.46, 16.86, cv], 0.04, 0.04, 6, false);
  for (let i = 0; i < 7; i++) { const x = cu - 0.3 + i * 0.1; P.cyl(M.gold, [x, 16.12, cv], [x, 16.84, cv], 0.008, 0.008, 3, false); }
  const w = W(cu, cv);
  ph.addCylinder(w.x, w.z, 3.6, 0, 1.2); ph.addBox(w.x, w.z, 3.1, 3.1, ACAD.rot, 0, 4.2);
  K.svc.monuments.push({ id: 'academy-column', name: 'Колонна в честь 50-летия Академии художеств', x: w.x, z: w.z, h: 17, r: 3.6 });
  const sp = W(cu - 0.4, cv + 10); K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: L.yawToward(sp.x, sp.z, w.x, w.z), name: 'Колонна в саду Академии' });
  K.svc.crowd.push({ x: w.x, z: w.z + 4, r: 6, n: 4, kind: 'garden', name: 'сад Академии: колонна' });
}

// ------------------------------------------------------------------------------------------------ Klodt, Khetagurov
function statues(K) {
  const { ctx, P, M } = K, ph = ctx.physics, fm = figureMats(ctx);
  // Klodt: 2.10 m bronze on a 1.0 x 1.0 x 2.0 m block of red-pink granite with a narrow stepped cap
  {
    const u = 47.6, v = -164.3, mk = { main: M.bronzeDark, dark: fm.dark, accent: M.bronzeDark };
    P.box(M.graniteRed, u - 0.55, u + 0.55, 0, 0.12, v - 0.55, v + 0.55, 'b', 2); P.box(M.graniteRed, u - 0.5, u + 0.5, 0.12, 1.85, v - 0.5, v + 0.5, 'b', 2); P.box(M.graniteRed, u - 0.6, u + 0.6, 1.85, 2.0, v - 0.6, v + 0.6, '', 2);
    P.quad(M.klodtPed, [u - 0.4, 1.0, v + 0.52], [u + 0.4, 1.0, v + 0.52], [u + 0.4, 1.7, v + 0.52], [u - 0.4, 1.7, v + 0.52], [0, 0, 1]);
    klodtFig().place(P, mk, u, 2.0, v, 0, 1.2);
    const w = W(u, v); ph.addBox(w.x, w.z, 1.5, 1.5, ACAD.rot, 0, 4.2);
    K.svc.monuments.push({ id: 'klodt', name: 'Памятник П. К. Клодту', x: w.x, z: w.z, h: 4.1, r: 1.2 });
  }
  // Khetagurov: 5 m in all: the figure 1.7 m on a grey granite pedestal of 3.3 m with the verse on the front face
  {
    const u = -44.9, v = -147.1, mk = { main: M.bronzeDark, dark: fm.dark, accent: M.bronzeDark };
    P.box(M.graniteGrey, u - 1.1, u + 1.1, 0, 0.35, v - 1.1, v + 1.1, 'b', 2.4); P.box(M.graniteGrey, u - 0.9, u + 0.9, 0.35, 0.7, v - 0.9, v + 0.9, 'b', 2.4);
    P.box(M.graniteGrey, u - 0.65, u + 0.65, 0.7, 3.1, v - 0.65, v + 0.65, 'b', 2.4); P.box(M.graniteGrey, u - 0.8, u + 0.8, 3.1, 3.3, v - 0.8, v + 0.8, '', 2.4);
    P.quad(M.khetPed, [u - 0.55, 1.2, v + 0.66], [u + 0.55, 1.2, v + 0.66], [u + 0.55, 2.6, v + 0.66], [u - 0.55, 2.6, v + 0.66], [0, 0, 1]);
    khetagurovFig().place(P, mk, u, 3.3, v, 0, 0.98);
    const w = W(u, v); ph.addBox(w.x, w.z, 2.5, 2.5, ACAD.rot, 0, 5.2);
    K.svc.monuments.push({ id: 'khetagurov', name: 'Памятник Косте Хетагурову', x: w.x, z: w.z, h: 5.0, r: 1.8 });
    const sp = W(u + 0.5, v + 8); K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: L.yawToward(sp.x, sp.z, w.x, w.z), name: 'Памятник Хетагурову' });
  }
}

// ------------------------------------------------------------------------------------------------ the buildings of the garden
const partRing = (id) => { const b = L.buildingById(id); return b && b.polys && b.polys.length ? { b, poly: b.polys[0], ring: ringFromFlat(b.polys[0].o) } : null; };
const lv = (p) => { const q = toLocal(p[0], p[1]); return [q.u, q.v]; };
function pavilion(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  // ---- the central range (part w957243310): 2 storeys, the portico block in front of it
  const rg = partRing('w957243310');
  if (rg) {
    const edges = ringEdges(rg.poly, 0.3), inBlock = (p) => p[0] > -11.2 && p[0] < 7.2 && p[1] > -182 && p[1] < -169.8;
    for (const e of edges) {
      const a = lv(e.a), b = lv(e.b), blk = inBlock(a) && inBlock(b);
      if (blk && Math.abs(a[1] - b[1]) < 0.6 && Math.max(a[1], b[1]) > -170.6) continue;                          // the open front of the portico (the columns stand there)
      onEdge(P, e, (len) => {
        if (blk) { P.quad(M.pavWall, [0, 0, 0], [len, 0, 0], [len, 10.0, 0], [0, 10.0, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, 10 / 3], [0, 10 / 3]]); }
        else texQuad(P, M.pavRange, 0, len, 0, 8.8, 0, Math.max(1, Math.round(len / 5.6)), 8.8, 0, 0);
      });
    }
    band(P, edges, 8.5, 8.9, 0.25, { front: M.order, top: M.order, under: M.soffit }, { uvs: 3 });
    P.cap(M.flatRoof, rg.ring.map((p) => [p[0], p[1]]), 8.95, true, 4);
    addPolyColliders(ctx, rg.poly, 0, 11);
    // the wall behind the portico (plane v = -174.8, 4.7 m behind the stylobate front), the loggia floor, the stylobate steps
    P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
    try {
      const x0 = -10.7, x1 = 6.6, zw = -174.8, zf = -170.1;
      P.quad(M.pavFront, [x0, 0, zw], [x1, 0, zw], [x1, 9.4, zw], [x0, 9.4, zw], [0, 0, 1]);
      P.cap(M.slabs, [[x0, zw], [x1, zw], [x1, zf], [x0, zf]], 0.5, true, 2.4);
      for (let k = 0; k < 3; k++) P.box(M.graniteGrey, x0 - 0.6 + 0.0 - k * 0.25, x1 + 0.6 + k * 0.25, 0, 0.45 - k * 0.15, zf - 0.0, zf + 0.5 + k * 0.4, 'b', 2.4);
      // the hexastyle portico: six fluted baseless Doric columns, c-c 2.9 m, shaft 7.2 m on the stylobate (0.45)
      const cols = [-9.15, -6.25, -3.35, -0.45, 2.45, 5.35];
      for (const u of cols) greekDoric(P, M, u, zf - 0.9, 0.45, 0.45 + 7.2 + 0.5, 0.62);
      const eTop = entabl(P, M, cols[0] - 0.95, cols[5] + 0.95, 7.65 + 0.5, zw + 0.3, zf - 0.0, { friezeMat: M.doricFrieze, over: 0.5 });
      // the entablature of the range wall at the same level on both sides
      P.box(M.order, x0 - 0.4, x0 + 0.1, 7.65 + 0.5, 8.9, zw, zf, 'b', 3); void eTop;
      // the pediment: apex 12.6 m, a yellow tympanum, raking cornices, the gable roof back to the wall of the block
      const ya = 10.55, yp = 12.6, xa = cols[0] - 1.4, xb = cols[5] + 1.4, xm = (xa + xb) / 2, zc = zf + 0.35, zt = zf + 0.05;
      P.fan(M.pavWall, [[xa + 0.5, ya, zt], [xb - 0.5, ya, zt], [xm, yp - 0.55, zt]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
      for (const s of [1, -1]) {
        const xe = s > 0 ? xb : xa, run = Math.abs(xm - xe), sl = Math.hypot(run, yp - ya), nx = (-s * (yp - ya)) / sl, ny = run / sl;
        P.quad(M.order, [xe, ya, zc], [xm, yp - 0.5, zc], [xm, yp, zc], [xe, ya + 0.5, zc], [0, 0, 1]);
        P.quad(M.orderShade, [xe, ya, zt], [xm, yp - 0.5, zt], [xm, yp - 0.5, zc], [xe, ya, zc], [-nx, -ny, 0]);
        P.quad(M.roof, [xe + (s > 0 ? 0.02 : -0.02), ya + 0.5, zc + 0.03], [xm, yp, zc + 0.03], [xm, yp, zw], [xe, ya + 0.5, zw], [nx, ny, 0], [[0, 0], [sl / 0.6, 0], [sl / 0.6, 12], [0, 12]]);
      }
    } finally { P.pop(); }
    K.svc.monuments.push({ id: 'garden-pavilion', name: 'Садовый корпус Академии художеств', x: rg.b.cx, z: rg.b.cz, h: 12.6, r: 0 });
  }
  // ---- the three-storey wings (parts w957243311 west, w957243322 east) and the low rear annex (w957243321)
  for (const [id, H, mat, tile, plain] of [['w957243311', 11.8, M.pavWing, 3.8, M.pavWall], ['w957243322', 11.8, M.pavWing, 3.8, M.pavWall], ['w957243321', 4.6, M.pavRange, 5.6, M.pavWall]]) {
    const r = partRing(id); if (!r) continue;
    const edges = ringEdges(r.poly, 0.3);
    for (const e of edges) onEdge(P, e, (len) => { if (H > 6) texQuad(P, mat, 0, len, 0, H, 0, Math.max(1, Math.round(len / tile)), H, 0, 0); else P.quad(plain, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, H / 3], [0, H / 3]]); });
    band(P, edges, H - 0.4, H, 0.25, { front: M.order, top: M.order, under: M.soffit }, { uvs: 3 });
    P.cap(M.flatRoof, r.ring.map((p) => [p[0], p[1]]), H + 0.05, true, 4);
    addPolyColliders(ctx, r.poly, 0, H + 2);
  }
  void ph;
}
function workshops(K) {
  const { ctx, P, M } = K;
  const mo = partRing('w82802189');
  if (mo) {
    const edges = ringEdges(mo.poly, 0.3), H = 14.0;
    for (const e of edges) onEdge(P, e, (len) => texQuad(P, M.mosaic, 0, len, 0, H, 0, Math.max(1, Math.round(len / 4.0)), H, 0, 0));
    band(P, edges, H - 0.5, H, 0.3, { front: M.order, top: M.order, under: M.soffit }, { uvs: 3 });
    P.cap(M.mosaicRoof, mo.ring.map((p) => [p[0], p[1]]), H + 0.05, true, 3);
    addPolyColliders(ctx, mo.poly, 0, H + 2);
    K.svc.monuments.push({ id: 'mosaic-workshop', name: 'Мозаичная мастерская Академии художеств', x: mo.b.cx, z: mo.b.cz, h: 14, r: 0 });
  }
  const bt = partRing('w82802132');
  if (bt) {
    const edges = ringEdges(bt.poly, 0.3), H = 5.0;
    for (const e of edges) onEdge(P, e, (len) => texQuad(P, M.workshop, 0, len, 0, H, 0, Math.max(1, Math.round(len / 4.0)), H, 0, 0));
    band(P, edges, H - 0.4, H, 0.25, { front: M.order, top: M.order, under: M.soffit }, { uvs: 3 });
    P.cap(M.glassRoof, bt.ring.map((p) => [p[0], p[1]]), H + 0.1, true, 1.5);
    addPolyColliders(ctx, bt.poly, 0, H + 2);
    K.svc.monuments.push({ id: 'battle-workshop', name: 'Мастерская батальной живописи', x: bt.b.cx, z: bt.b.cz, h: 5.2, r: 0 });
  }
}

// ------------------------------------------------------------------------------------------------ the gravel alleys (in the academy frame)
function gardenPaths(K) {
  const { ctx, P, M } = K, cover = coverFn(ctx);
  const clip = (u, v) => { const w = W(u, v); return cover(w.x, w.z) > -0.1; };                                           // road integrity: no gravel over real asphalt (the service stub of the west gate)
  let quads = 0, idx = 0;
  for (const r of REAL_PATHS) {
    const pts = r.pts.length > 2 ? chaikin(r.pts) : r.pts, w = r.w * 1.25;                                                // the real alleys are 2.3-3 m of sand, wider than the OSM 1.8 / 2.4
    let run = [];
    const flush = () => { if (run.length >= 2) quads += ribbon(P, M.gravel, run, w, 0.024 + 0.0007 * (idx++ % 9), { tile: 3, clip }); run = []; };
    for (const p of pts) { if (inPark(p[0], p[1]) || distPark(p[0], p[1]) < 0.8) run.push(p); else flush(); }
    flush();
  }
  K.svc.gardenPaths = { ways: REAL_PATHS.length, quads };
}

// ------------------------------------------------------------------------------------------------ lawn, trees, benches
function lawnAndTrees(K) {
  const { ctx, P, M } = K, rng = ctx.rng(5501), list = [];
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try { fillPolyFine(P, M.lawn, PARK, 0.012, { maxEdge: 18, tile: 6 }); } finally { P.pop(); }
  // the 20 OSM trees first, then the planting by zones (docs/research/academy.md 5.4): west woodland u -70..-28 (v -185..-90), the open centre lawn, the pavilion forecourt groups, the east edge
  const fams = () => { const r = rng(); return r < 0.45 ? (rng() < 0.5 ? 'limeA' : 'limeB') : r < 0.7 ? 'mapleA' : r < 0.85 ? (rng() < 0.5 ? 'ash' : 'elm') : (rng() < 0.5 ? 'birchA' : 'poplar'); };
  const ok = (u, v) => inPark(u, v) && distPark(u, v) > 2.4 && !nearPath(u, v, 2.3) && Math.hypot(u + 1.6, v + 122.3) > 6 && Math.hypot(u + 44.9, v + 147.1) > 3 && Math.hypot(u - 47.6, v + 164.3) > 3 && !list.some((t) => Math.hypot(t.u - u, t.v - v) < 4.2);
  const add = (u, v, o = {}) => { const w = W(u, v); list.push({ u, v, x: w.x, z: w.z, fam: o.fam || fams(), s: o.s ?? (0.95 + rng() * 0.4), yaw: rng() * 6.28, y: 0.02 }); };
  for (const [u, v] of OSM_TREES) if (inPark(u, v)) add(u, v);
  const zone = (u0, u1, v0, v1, n, tries = 900) => { let c = 0; for (let k = 0; k < tries && c < n; k++) { const u = u0 + rng() * (u1 - u0), v = v0 + rng() * (v1 - v0); if (ok(u, v)) { add(u, v); c++; } } };
  zone(-69, -28, -183, -90, 50); zone(-40, 40, -120, -85, 12); zone(-30, 40, -180, -125, 18); zone(40, 65, -150, -88, 8); zone(-27, 60, -86, -64, 8); zone(40, 65, -182, -160, 4);
  const trees = list.filter((t) => !L.insideBuilding(t.x, t.z, 1.5));
  if (trees.length) { plantTrees(K, trees, 'lmacade-trees'); K.svc.trees.push(...trees.map((t) => ({ x: t.x, z: t.z, r: 3, h: 14 }))); }
  // benches (about 1.8 m): around the column, along the central alley; one at the OSM bench node (44, -158)
  // n4spb (docs/AREAS.md 13.7): the benches are KNOCK records (lib/knock-furniture.js; the collider is the record's item)
  const benchGeo = partsGeos((Q) => { Q.box(M.bench, -0.9, 0.9, 0.42, 0.5, -0.25, 0.25, 'b', 1); Q.box(M.bench, -0.9, 0.9, 0.5, 0.9, -0.27, -0.2, 'b', 1); for (const x of [-0.8, 0.8]) Q.box(M.iron, x - 0.04, x + 0.04, 0, 0.42, -0.2, 0.2, 'b', 1); });
  const bSpots = [], bItems = [];
  for (const [u, v, ang] of [[-1.6 - 6.5, -122.3, 1.57], [-1.6 + 6.5, -122.3, -1.57], [-1.6, -122.3 + 6.0, 0], [-18, -99.0, 0], [14, -99.0, 0], [44, -158, 3.14159], [-18, -86.0, 3.14159], [12, -86.0, 3.14159]]) {
    const w = W(u, v); bSpots.push({ x: w.x, y: 0, z: w.z, rotY: ACAD.rot + ang }); bItems.push(ctx.physics.addBox(w.x, w.z, 1.9, 0.6, ACAD.rot + ang, 0, 0.9)); K.svc.benches.push({ x: w.x, z: w.z, len: 1.8, rotY: ACAD.rot + ang });
  }
  K.extraTris += knockFurniture(ctx, 'lmacade-garden-benches', benchGeo, bSpots, bItems, { ...FURNITURE_REC.bench, w: 1.8 }, 200);
}

export async function build(K) {
  const inFrame = (fn) => (KK) => { KK.P.push(ACAD.x, 0, ACAD.z, ACAD.rot); try { fn(KK); } finally { KK.P.pop(); } };                  // these functions work in the academy frame (u, v)
  for (const [name, fn] of [['fences', inFrame(fences)], ['column', inFrame(column)], ['statues', inFrame(statues)], ['pavilion', pavilion], ['workshops', workshops], ['paths', inFrame(gardenPaths)], ['lawn', lawnAndTrees]]) {
    try { fn(K); } catch (err) { console.error('[landmarksAcademy] garden ' + name + ' failed:', err); (K.svc.failed ||= []).push('garden ' + name + ': ' + (err && err.message || err)); }
  }
  void POLY;
}
