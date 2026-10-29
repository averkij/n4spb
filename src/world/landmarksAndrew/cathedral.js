// landmarksAndrew/cathedral.js - ST ANDREW'S CATHEDRAL (Собор св. апостола Андрея Первозванного, 6-я линия 11а, w84046074; A. F. Vist 1764-80, belfry 1784-86): a rose-pink Petrine / rococo triconch with a white order.
// Dossier docs/research/andrew.md section 3 (critic-corrected: the crossing is 11.9 m square, drum 9.0 m across flats, saucer dome r 4.8, turrets on a 11.9 m square), photos refs/andrew 04 26 30 25 71 08.
//   * the 38-vertex baked outline is drawn edge by edge: granite plinth, rose stucco walls with pilasters and grilled arched windows, a two-tier entablature, flat grey conch roofs (9.15 m), a low grey hipped nave roof (ridge 14.5);
//   * the south / north / west portals (pediment, doors, medallion, canopy, steps), the gilded order medallion with two angels over the west door;
//   * the crossing block (11.9 m square, to 16.0 m), the octagonal drum (to 24.8), its second tier, the silver saucer dome, the balcony lantern, the onion, ball and cross (cross tip 49.0 m);
//   * four corner turrets (two octagonal stages, silver cap, small onion, cross tip 37.2 m) and the belfry (stage 1 with arched openings and balustrades, the concave bell roof, stage 2, the needle spire, cross tip 43.5 m).
// Frame C (frame.js).  Colliders: the baked outline as wall boxes (the cathedral is solid), the portal steps are not walk boxes (3 low steps: free passage).
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { ringEdges, band, onEdge, polyOf } from './kit.js';
import * as G from './geo.js';
import * as D from './domes.js';
import * as LO from './loft.js';
import { FC } from './frame.js';

const TAU = Math.PI * 2;
export const CROSSING = { a0: 3.5, a1: 15.3, b0: -5.4, b1: 6.4, ca: 9.4, cb: 0.5 };
export const BELFRY = { ca: -19.55, cb: 0.55 };
const HT = { plinth: 0.7, bell: 10.4, nave: 11.0, conch: 9.0, roofC: 9.15, cross: 16.0, drum: 24.8 };
// the baked outline in frame C (the dossier's vertex list = the fallback)
const FALL = [[-16.3, 3.6], [-17.5, 3.7], [-18.4, 4.5], [-19.1, 3.7], [-22.0, 3.8], [-22.7, 4.6], [-24.4, 3.1], [-23.6, 2.3], [-23.7, -1.0], [-24.4, -1.7], [-22.6, -3.5], [-21.8, -2.7], [-19.1, -2.8], [-18.3, -3.7], [-17.4, -2.9], [-16.4, -2.9],
  [-16.5, -12.6], [3.8, -13.0], [6.7, -10.8], [7.1, -14.4], [10.8, -14.2], [10.7, -11.3], [14.7, -9.1], [16.1, -12.1], [21.6, -12.2], [21.4, -5.4], [19.4, -3.4], [21.0, -2.1], [21.2, 1.3], [20.4, 4.4], [17.8, 6.6], [15.0, 8.3], [14.1, 10.4], [11.9, 12.4], [8.8, 13.3], [4.9, 11.5], [2.5, 14.1], [-15.9, 14.1]];
export function outlineC() {
  try {
    const rec = L.buildingById('w84046074');
    if (rec && rec.polys && rec.polys[0]) { const r = ringFromFlat(rec.polys[0].o).map((p) => { const m = FC.M(p[0], p[1]); return [Math.round(m.a * 100) / 100, Math.round(m.b * 100) / 100]; }); if (r.length >= 30) return r; }
  } catch (e) { /* fall back */ }
  return FALL;
}
const zoneOf = (a) => (a < -16.6 ? 'bell' : a < 3.4 ? 'nave' : 'conch');

/** three granite steps in front of a portal (facade frame, +z out): width w, first step proud d */
export function steps(P, M, w, n = 3, d = 0.32, rise = 0.15, x0 = 0) {
  for (let i = 0; i < n; i++) P.box(M.plinth, x0 - w / 2 - (n - 1 - i) * 0.05, x0 + w / 2 + (n - 1 - i) * 0.05, 0, rise * (n - i), 0, 0.12 + d * (n - i), 'b', 1);
}

export function build(K) {
  const { ctx, P, M } = K;
  const ring = outlineC(), poly = polyOf(ring), edges = ringEdges(poly);
  P.push(FC.ox, 0, FC.oz, FC.rot);
  try {
    walls(K, ring, edges);
    roofs(K, ring);
    portals(K);
    crossing(K);
    turrets(K);
    belfry(K);
  } finally { P.pop(); }
  // colliders: the whole outline is solid (also the belfry block), 1 m thick wall boxes
  try {
    const rec = L.buildingById('w84046074');
    if (rec) for (const pl of rec.polys) addPolyColliders(ctx, pl, 0, 20, 1.0);
  } catch (e) { console.warn('[landmarksAndrew] cathedral colliders:', e && e.message); }
  for (const [id, a, b, rotY, name] of [['cathedral-west', -24.4, 0.65, -Math.PI / 2, 'Андреевский собор: западный портал под колокольней'], ['cathedral-south', -6, 14.1, 0, 'Андреевский собор: южный портал'], ['cathedral-north', 8.95, -14.4, Math.PI, 'Андреевский собор: северный портал']]) { const p = FC.W(a, b); K.svc.entrances.push({ id, x: p.x, z: p.z, rotY: FC.rot + rotY, name }); }
  K.svc.monuments.push({ id: 'w84046074', name: 'Андреевский собор', x: FC.W(CROSSING.ca, CROSSING.cb).x, z: FC.W(CROSSING.ca, CROSSING.cb).z, h: 49 });
  K.svc.monuments.push({ id: 'w84046074-belfry', name: 'Колокольня Андреевского собора', x: FC.W(BELFRY.ca, BELFRY.cb).x, z: FC.W(BELFRY.ca, BELFRY.cb).z, h: 43.5 });
}

// ------------------------------------------------------------------------------------------------ walls
function walls(K, ring, edges) {
  const { P, M } = K;
  const topOf = (e) => HT[zoneOf((e.a[0] + e.b[0]) / 2)];
  const cut = (a, b) => (a > -10.5 && a < -1.5 && b > 13 ? 1 : 0);             // the S portal bay (no window there)
  for (const e of edges) {
    const mid = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2], z = zoneOf(mid[0]), top = topOf(e);
    onEdge(P, e, (len, f) => {
      P.quad(M.rose, [0, HT.plinth, 0], [len, HT.plinth, 0], [len, top - 1.2, 0], [0, top - 1.2, 0], [0, 0, 1]);
      if (len < 3.0 || z === 'bell') return;
      const n = Math.max(1, Math.round((len - 0.8) / 5.4)), pitch = len / n, nb = e.n;
      const pt = (u) => [f.x + f.xa[0] * u, f.z + f.xa[1] * u];
      for (let i = 0; i <= n; i++) {                                                // pilasters at the bay boundaries (corners inset)
        const u = Math.min(len - 0.3, Math.max(0.3, i * pitch)), w = 0.55;
        P.box(M.white, u - w / 2, u + w / 2, HT.plinth, top - 1.2, 0, 0.12, 'bk', 1);
        P.box(M.whiteShade, u - w * 0.65, u + w * 0.65, top - 1.9, top - 1.2, 0, 0.17, 'bk', 1);
        P.box(M.whiteShade, u - w * 0.62, u + w * 0.62, HT.plinth, HT.plinth + 0.3, 0, 0.16, 'bk', 1);
      }
      if (len < 4.5) return;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) * pitch, q = pt(u); if (cut(q[0], q[1]) && Math.abs(nb[1] - 1) < 0.2) continue;
        D.archWin(P, M, u, 2.3, 1.9, 4.2, { mat: M.winGrille, b: 0.26, depth: 0.14, sill: true });
        P.box(M.whiteShade, u - 0.2, u + 0.2, 2.3 + 4.2 + 0.95, 2.3 + 4.2 + 1.35, 0.0, 0.08, 'bk', 1);            // keystone
      }
    });
  }
  // the plinth ring (granite, 0.7 m) and the two-tier entablature: architrave + frieze band, then the cornice with its dark underside
  band(P, edges, 0, HT.plinth, 0.12, { front: M.plinth, top: M.plinth }, { uvs: 2 });
  band(P, edges, (e) => topOf(e) - 1.2, (e) => topOf(e) - 0.5, 0.12, { front: M.white, top: M.white }, { uvs: 4 });
  band(P, edges, (e) => topOf(e) - 0.5, (e) => topOf(e), 0.6, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
}

// ------------------------------------------------------------------------------------------------ roofs
function roofs(K, ring) {
  const { P, M } = K;
  // conch roofs: a flat sheet-iron cap over the whole outline (the nave hip and the belfry cap stand above it)
  P.cap(M.sheet, ring, HT.roofC, true, 2.2);
  // belfry vestibule cap
  P.cap(M.sheet, [[-22.7, -3.7], [-16.4, -3.7], [-16.4, 4.6], [-22.7, 4.6]], HT.bell + 0.04, true, 2.2);
  // the nave: a low hip (ridge 14.5) over a8 -16.4 .. 3.5, b -12.8 .. 14.1, open at the east end where the crossing block stands
  const x0 = -17.0, x1 = CROSSING.a0, z0 = -13.4, z1 = 14.7, y0 = HT.nave + 0.02, y1 = 14.5, zc = (z0 + z1) / 2, hw = (z1 - z0) / 2, xr = x0 + hw;
  LO.hipRoof(P, M.sheet, x0, x1, z0, z1, y0, y1, { hipE: false });
  P.cap(M.underside, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y0 - 0.01, false, 4);
  // east end walls of the nave roof above the conch roofs (rose), left and right of the crossing block
  const roofY = (z) => y0 + (y1 - y0) * (1 - Math.abs(z - zc) / hw);
  for (const [zA, zB] of [[z0, CROSSING.b0], [CROSSING.b1, z1]]) {
    P.quad(M.rose, [x1, HT.roofC, zA], [x1, HT.roofC, zB], [x1, roofY(zB), zB], [x1, roofY(zA), zA], [1, 0, 0]);
  }
  void xr; void THREE;
}

// ------------------------------------------------------------------------------------------------ portals
function portal(K, o) {
  const { P, M } = K, hw = o.hw ?? 4.1;
  // portal bay: coupled pilasters, a projecting entablature block, the triangular pediment, the door in a recess, the arched canopy
  for (const s of [-1, 1]) {
    for (const k of [0, 1]) { const x = s * (hw - 0.3 - k * 0.8); P.box(M.white, x - 0.28, x + 0.28, HT.plinth, o.top - 1.2, 0, 0.5 - k * 0.12, 'bk', 1); P.box(M.whiteShade, x - 0.4, x + 0.4, o.top - 1.9, o.top - 1.2, 0, 0.58 - k * 0.12, 'bk', 1); P.box(M.whiteShade, x - 0.4, x + 0.4, HT.plinth, HT.plinth + 0.35, 0, 0.58 - k * 0.12, 'bk', 1); }
  }
  P.box(M.white, -hw - 0.2, hw + 0.2, o.top - 1.2, o.top - 0.5, 0, 0.62, 'b', 1);
  P.box(M.white, -hw - 0.35, hw + 0.35, o.top - 0.5, o.top, 0, 0.95, 'b', 1);
  P.quad(M.underside, [-hw - 0.35, o.top - 0.5, 0], [hw + 0.35, o.top - 0.5, 0], [hw + 0.35, o.top - 0.5, 0.95], [-hw - 0.35, o.top - 0.5, 0.95], [0, -1, 0]);
  LO.gable(P, M, hw + 0.45, o.top, o.rise ?? 3.2, { depth: 0.5 });
  // the door in a round-arched recess with a white archivolt
  const dw = o.dw ?? 2.1, dh = o.dh ?? 3.6, dy = HT.plinth + 0.05;
  P.quad(M.rose, [-dw / 2 - 0.5, dy, 0.02], [dw / 2 + 0.5, dy, 0.02], [dw / 2 + 0.5, dy + dh + 0.9, 0.02], [-dw / 2 - 0.5, dy + dh + 0.9, 0.02], [0, 0, 1]);
  G.planeShape(P, M.doorBrown, G.archPts(0, dy, dw, dh + 0.5, 10), 0.05);
  G.frameRing(P, M.white, G.archPts(0, dy - 0.1, dw + 0.9, dh + 1.6, 10), G.archPts(0, dy, dw, dh + 0.5, 10), 0, 0.22, 1);
  // lead-grey arched canopy over the door (a lean-to of two quads + the iron brackets)
  P.quad(M.sheet, [-1.6, dy + dh + 0.55, 0.02], [1.6, dy + dh + 0.55, 0.02], [1.6, dy + dh - 0.2, 1.3], [-1.6, dy + dh - 0.2, 1.3], [0, 1, 0.7], [[0, 0], [1.4, 0], [1.4, 1.4], [0, 1.4]]);
  P.quad(M.underside, [-1.6, dy + dh - 0.22, 1.3], [1.6, dy + dh - 0.22, 1.3], [1.6, dy + dh + 0.53, 0.02], [-1.6, dy + dh + 0.53, 0.02], [0, -1, -0.7]);
  for (const s of [-1, 1]) P.box(M.iron, s * 1.58 - 0.03, s * 1.58 + 0.03, dy + dh - 0.25, dy + dh + 0.5, 0.02, 1.28, '', 1);
  steps(P, M, dw + 2.4, 3, 0.32);
}
function portals(K) {
  const { P, M } = K;
  // SOUTH portal of the nave at C(-6, 14.1), looking at Bolshoy pr. and the Golovin garden (z out = +b)
  P.push(-6, 0, 14.1, 0);
  portal(K, { top: HT.nave, hw: 4.1, rise: 3.2 });
  // the cross medallion on the wall left of the portal (photo 30): a white ring with an equal-armed cross
  P.push(-5.5, 0, 0, 0); medallion(P, M, 8.2, 0.55); P.pop();
  P.pop();
  // NORTH portal in the north porch bump (C(8.9, -14.4), z out = -b)
  P.push(8.95, 0, -14.4, Math.PI);
  { const hw = 1.9, dw = 1.5, dh = 2.8, dy = HT.plinth + 0.05;
    for (const s of [-1, 1]) { P.box(M.white, s * (hw - 0.3) - 0.25, s * (hw - 0.3) + 0.25, HT.plinth, 7.6, 0, 0.35, 'bk', 1); }
    P.box(M.white, -hw - 0.1, hw + 0.1, 7.6, 8.4, 0, 0.55, 'b', 1);
    LO.gable(P, M, hw + 0.3, 8.4, 1.6, { depth: 0.4 });
    P.quad(M.rose, [-dw / 2 - 0.4, dy, 0.02], [dw / 2 + 0.4, dy, 0.02], [dw / 2 + 0.4, dy + dh + 0.8, 0.02], [-dw / 2 - 0.4, dy + dh + 0.8, 0.02], [0, 0, 1]);
    G.planeShape(P, M.doorBrown, G.archPts(0, dy, dw, dh, 10), 0.05);
    G.frameRing(P, M.white, G.archPts(0, dy - 0.1, dw + 0.7, dh + 1.1, 10), G.archPts(0, dy, dw, dh, 10), 0, 0.2, 1);
    steps(P, M, dw + 1.6, 3, 0.3); }
  P.pop();
  // WEST portal under the belfry C(-23.65, 0.65) (z out = -a)
  P.push(-23.65, 0, 0.65, -Math.PI / 2);
  { const dw = 2.4, dh = 3.7, dy = HT.plinth + 0.05;
    // (the baked west edge leans 0.1 m over the door width: the door group stands 0.12 m proud so that none of it is buried in the wall)
    P.quad(M.rose, [-1.6, dy, 0.1], [1.6, dy, 0.1], [1.6, dy + dh + 1.5, 0.1], [-1.6, dy + dh + 1.5, 0.1], [0, 0, 1]);
    G.planeShape(P, M.doorBrown, G.archPts(0, dy, dw, dh + 0.5, 10), 0.14);
    G.frameRing(P, M.white, G.archPts(0, dy - 0.1, dw + 0.8, dh + 1.5, 10), G.archPts(0, dy, dw, dh + 0.5, 10), 0.06, 0.22, 1);
    for (const s of [-1, 1]) { P.box(M.white, s * 1.9 - 0.28, s * 1.9 + 0.28, HT.plinth, 8.6, -0.1, 0.35, 'bk', 1); P.box(M.whiteShade, s * 1.9 - 0.4, s * 1.9 + 0.4, 8.0, 8.6, -0.1, 0.45, 'bk', 1); }
    // the segmental pediment (8.8 .. 10.4) and the gilded order of St Andrew held by two angels (photo 18: a ring with a blue field and a star, two flying angels)
    const seg = [[-2.6, 8.6]]; for (let i = 0; i <= 12; i++) { const t = i / 12; seg.push([-2.6 + 5.2 * t, 8.6 + 1.0 + 0.75 * Math.sin(Math.PI * t)]); } seg.push([2.6, 8.6]);
    G.solid(P, M.white, seg, 0, 0.45, 1);
    order(P, M, 7.4);
    steps(P, M, 4.4, 3, 0.35); }
  P.pop();
}
/** a round wall medallion of radius r with an equal-armed cross in relief, centre height y (facade frame, +z out) */
function medallion(P, M, y, r) {
  const ring = []; for (let i = 0; i < 20; i++) ring.push([Math.cos(i * TAU / 20) * (r + 0.12), y + Math.sin(i * TAU / 20) * (r + 0.12)]);
  const hole = []; for (let i = 0; i < 20; i++) hole.push([Math.cos(i * TAU / 20) * r, y + Math.sin(i * TAU / 20) * r]);
  G.frameRing(P, M.white, ring, hole, 0, 0.1, 1);
  P.box(M.white, -0.07, 0.07, y - r * 0.7, y + r * 0.7, 0, 0.08, 'bk', 1); P.box(M.white, -r * 0.7, r * 0.7, y - 0.07, y + 0.07, 0, 0.08, 'bk', 1);
}
/** the order of St Andrew over the west door: a gilt ring (blue field, star, X cross) held by two gilt flying angels */
function order(P, M, y) {
  const r = 0.5, ring = [], hole = [];
  for (let i = 0; i < 24; i++) { ring.push([Math.cos(i * TAU / 24) * r, y + Math.sin(i * TAU / 24) * r]); hole.push([Math.cos(i * TAU / 24) * (r - 0.1), y + Math.sin(i * TAU / 24) * (r - 0.1)]); }
  G.frameRing(P, M.goldFlat, ring, hole, 0.02, 0.1, 1);
  G.planeShape(P, M.blueField, ring.map((q) => [q[0] * 0.8, y + (q[1] - y) * 0.8]), 0.06);
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8; P.geo(M.goldFlat, new THREE.BoxGeometry(1, 1, 1), Math.cos(a) * 0.2, y + Math.sin(a) * 0.2, 0.1, 0, 0, a, 0.34, 0.05, 0.03); }
  for (const s of [-1, 1]) {                                                                      // a gilt cross X
    P.geo(M.goldFlat, new THREE.BoxGeometry(1, 1, 1), 0, y, 0.12, 0, 0, s * Math.PI / 4, 0.62, 0.07, 0.035);
  }
  for (const s of [-1, 1]) {                                                                      // flying angels (gilt, 1.3 m, one hand on the ring, a big wing behind, drapery trailing down and away)
    P.push(s * 1.0, y - 0.65, 0.03, 0);
    G.solid(P, M.goldFlat, [[-0.17, 0.0], [0.17, 0.0], [0.2, 0.2], [0.14, 0.62], [0.06, 0.95], [-0.06, 0.95], [-0.14, 0.62], [-0.2, 0.2]], 0, 0.1, 1);              // the robed body
    G.ball(P, M.goldFlat, 0, 1.08, 0.05, 0.11, 8);                                                                                                                         // the head
    G.solid(P, M.goldFlat, [[s * 0.08, 0.55], [s * 0.5, 1.15], [s * 0.98, 1.3], [s * 1.0, 0.95], [s * 0.82, 0.62], [s * 0.5, 0.42]], -0.03, 0.06, 1);                 // the wing, outward
    G.solid(P, M.goldFlat, [[-0.2, 0.05], [0.2, 0.05], [s * 0.45, -0.38], [s * 0.2, -0.32], [-s * 0.05, -0.1]], 0, 0.07, 1);                                           // the drapery trailing away
    P.cyl(M.goldFlat, [-s * 0.05, 0.7, 0.07], [-s * 0.42, 0.9, 0.07], 0.045, 0.04, 5, true);                                                                              // the arm to the ring
    P.pop();
  }
}

// ------------------------------------------------------------------------------------------------ the crossing, the drum, the dome
function crossing(K) {
  const { P, M } = K, C = CROSSING, cx = C.ca, cz = C.cb;
  const rect = [[C.a0, C.b0], [C.a1, C.b0], [C.a1, C.b1], [C.a0, C.b1]], ed = ringEdges(polyOf(rect));
  for (const e of ed) onEdge(P, e, (len) => {
    P.quad(M.peach, [0, HT.roofC, 0], [len, HT.roofC, 0], [len, HT.cross - 1.0, 0], [0, HT.cross - 1.0, 0], [0, 0, 1]);
    for (const u of [0.35, len - 0.35]) P.box(M.white, u - 0.3, u + 0.3, HT.roofC, HT.cross - 1.0, 0, 0.12, 'bk', 1);
    for (const u of [len * 0.3, len * 0.7]) { D.archWin(P, M, u, 10.9, 1.5, 4.0, { mat: M.winGrille, b: 0.2, depth: 0.12, sill: true }); }
  });
  band(P, ed, HT.cross - 1.0, HT.cross - 0.4, 0.14, { front: M.white, top: M.white }, { uvs: 4 });
  band(P, ed, HT.cross - 0.4, HT.cross, 0.6, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
  P.cap(M.peach, rect, HT.cross + 0.01, true, 4);
  // the octagonal drum (9.0 m across flats, to 24.8), its second tier, the saucer dome, the balcony lantern, the onion, the ball and the cross
  const dTop = D.octStage(P, M, cx, cz, HT.cross, HT.drum, 9.0, { mat: M.peach, winW: 1.5, winH: 3.2, winY: 0.3, face: (i) => (i % 2 === 0 ? 'arch' : 'niche'), cornice: 0.8, proj: 1.12 });
  const y2 = dTop + 0.0, t2 = D.octStage(P, M, cx, cz, y2, y2 + 2.0, 8.2, { mat: M.peach, winW: 1.0, winH: 1.3, winY: 0.2, face: (i) => (i % 2 === 0 ? 'niche' : 'blank'), cornice: 0.4, proj: 1.1 });
  D.dome(P, M.silver, cx, t2, cz, 4.35, 32.7 - t2);
  const lanY = 32.7;
  const lTop = D.lantern(P, M, cx, cz, lanY + 0.3, 37.5, 3.7, { balcony: true });
  // cap cone and onion
  LO.loft(P, M.silver, [LO.polyRing(cx, cz, lTop, 2.35, 8), LO.polyRing(cx, cz, lTop + 0.8, 1.4, 8), LO.polyRing(cx, cz, 40.1, 0.55, 8)], { uTile: 2 });
  const oTop = D.onion(P, M.silver, cx, 40.1, cz, 1.35, 1.5);
  D.crown(P, M, cx, oTop - 0.05, cz, 0.45, 49.0 - (oTop - 0.05) - 0.9, 0);
}

// ------------------------------------------------------------------------------------------------ the four turrets
function turrets(K) {
  const { P, M } = K, C = CROSSING;
  for (const [a, b] of [[C.a0, C.b0], [C.a1, C.b0], [C.a0, C.b1], [C.a1, C.b1]]) {
    const t1 = D.octStage(P, M, a, b, 11.0, 20.7, 3.6, { mat: M.peach, winW: 0.8, winH: 2.4, winY: 0.28, face: () => 'niche', cornice: 0.6, proj: 1.2 });
    const t2 = D.octStage(P, M, a, b, t1, 27.3, 2.6, { mat: M.peach, winW: 0.7, winH: 2.2, winY: 0.2, face: () => 'niche', cornice: 0.4, proj: 1.16 });
    // grey bell cap, a short neck, the small silver onion, ball and cross (tip 37.2)
    LO.loft(P, M.silver, [LO.polyRing(a, b, t2, 1.55, 8), LO.polyRing(a, b, t2 + 0.55, 1.2, 8), LO.polyRing(a, b, t2 + 1.4, 0.55, 8), LO.polyRing(a, b, t2 + 1.9, 0.38, 8)], { uTile: 2 });
    P.col(M.peach, a, b, t2 + 1.8, t2 + 3.1, 0.36, 0.3, 8, false);
    const oTop = D.onion(P, M.silver, a, t2 + 3.0, b, 0.95, 0.9);
    D.crown(P, M, a, oTop - 0.1, b, 0.3, 37.2 - (oTop - 0.1) - 0.6, 0);
  }
}

// ------------------------------------------------------------------------------------------------ the belfry (the skyline needle)
function belfry(K) {
  const { P, M } = K, cx = BELFRY.ca, cz = BELFRY.cb, wa = 6.4, wb = 8.2, y0 = HT.bell + 0.04, y1 = 19.0;
  const rect = [[cx - wa / 2, cz - wb / 2], [cx + wa / 2, cz - wb / 2], [cx + wa / 2, cz + wb / 2], [cx - wa / 2, cz + wb / 2]], ed = ringEdges(polyOf(rect));
  for (const e of ed) onEdge(P, e, (len) => {
    P.quad(M.rose, [0, y0, 0], [len, y0, 0], [len, y1, 0], [0, y1, 0], [0, 0, 1]);
    for (const cxp of [0.0, len]) for (const s of [0, 1]) { const u = cxp === 0 ? 0.28 + s * 0.62 : len - 0.28 - s * 0.62; P.box(M.white, u - 0.26, u + 0.26, y0, y1, 0, 0.14, 'bk', 1); P.box(M.whiteShade, u - 0.34, u + 0.34, y1 - 0.5, y1, 0, 0.18, 'bk', 1); }
    // the big round-arched belfry opening 2.6 x 4.0 (sill 13.7) over a white balustrade
    const u = len / 2;
    P.quad(M.roseShade, [u - 1.6, 13.0, 0.01], [u + 1.6, 13.0, 0.01], [u + 1.6, 18.4, 0.01], [u - 1.6, 18.4, 0.01], [0, 0, 1]);
    G.planeShape(P, M.dark, G.archPts(u, 13.7, 2.6, 4.0, 10), 0.03);
    G.frameRing(P, M.white, G.archPts(u, 13.6, 3.2, 4.8, 10), G.archPts(u, 13.7, 2.6, 4.0, 10), 0, 0.18, 1);
    P.quad(M.balus, [u - 1.5, 12.8, 0.2], [u + 1.5, 12.8, 0.2], [u + 1.5, 13.75, 0.2], [u - 1.5, 13.75, 0.2], [0, 0, 1], [[0, 0], [3 / 0.7, 0], [3 / 0.7, 1], [0, 1]]);
    P.box(M.white, u - 1.6, u + 1.6, 12.7, 12.85, 0, 0.3, 'b', 1); P.box(M.white, u - 1.6, u + 1.6, 13.75, 13.9, 0, 0.3, 'b', 1);
    if (len > 7) { for (const dx of [-2.45, 2.45]) { G.planeShape(P, M.niche, G.archPts(u + dx, 12.0, 0.9, 3.2, 8), 0.03); } }
  });
  band(P, ed, y1, y1 + 0.35, 0.22, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
  band(P, ed, y1 + 0.35, y1 + 0.6, 0.5, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
  // the concave bell roof (19.6 -> 24.7), eight sides: a rectangle blending into the neck of stage 2
  const rings = [], N = 16, m = 8;
  for (let i = 0; i <= m; i++) {
    const t = i / m, s = LO.sstep(t), ha = 3.65 + (2.2 - 3.65) * s, hb = 4.45 + (2.2 - 4.45) * s, w = Math.min(1, 0.15 + 0.85 * s * 0.7);
    rings.push(LO.ringAt(cx, cz, y1 + 0.6 + (24.7 - y1 - 0.6) * t, ha, hb, (ha + hb) / 2 * 0.98, w * 0.6, N));
  }
  LO.loft(P, M.spire, rings, { uTile: 2.2, capTop: M.spire });
  // stage 2: a small peach-rose square (4.2 m) with an arched niche on every face, cornice 29.3 .. 30.3
  const s2 = [[cx - 2.1, cz - 2.1], [cx + 2.1, cz - 2.1], [cx + 2.1, cz + 2.1], [cx - 2.1, cz + 2.1]], e2 = ringEdges(polyOf(s2));
  for (const e of e2) onEdge(P, e, (len) => {
    P.quad(M.rose, [0, 24.6, 0], [len, 24.6, 0], [len, 29.3, 0], [0, 29.3, 0], [0, 0, 1]);
    for (const u of [0.22, len - 0.22]) P.box(M.white, u - 0.2, u + 0.2, 24.7, 29.3, 0, 0.1, 'bk', 1);
    G.planeShape(P, M.niche, G.archPts(len / 2, 25.6, 1.5, 3.0, 10), 0.03); G.frameRing(P, M.white, G.archPts(len / 2, 25.55, 1.9, 3.5, 10), G.archPts(len / 2, 25.6, 1.5, 3.0, 10), 0, 0.12, 1);
  });
  band(P, e2, 29.3, 29.8, 0.4, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
  band(P, e2, 29.8, 30.3, 0.25, { front: M.white, top: M.white, under: M.underside }, { uvs: 4 });
  // the needle spire (30.3 -> 41.0), concave profile, a small swelling under the ball (39.0 .. 40.3)
  const sp = []; for (let i = 0; i <= 10; i++) { const t = i / 10; sp.push(LO.polyRing(cx, cz, 30.3 + 8.8 * t, 1.75 * Math.pow(1 - t, 1.7) + 0.2, 8)); }
  LO.loft(P, M.spire, sp, { uTile: 2 });
  D.onion(P, M.spire, cx, 38.6, cz, 0.42, 0.9);
  D.crown(P, M, cx, 40.55, cz, 0.35, 43.5 - 40.55 - 0.7, 0);
}
