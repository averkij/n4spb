// landmarksLETI/corpus1.js - CORPUS 1, the old building of the Electrotechnical Institute (A. N. Vekshinsky, 1899-1903), drawn from its baked ring r1915364 (39 vertices + the small inner court h0), 140 m long.
//   Photos: 63 (the SW corner with the clock gable and the two round towers, 2009), leti/01 (the west porch block, 2015), leti/02 (the SW corner and the west front with the lantern spire, 2015), leti/05 06 (plaques).
//   Orchestrator: every ring edge is a facade in its own frame (c1walls.js: striped brick wall with arched windows between stucco pylons; tiers A / B / C in c1common.js), the porch block (porch.js), the clock gable and the
//   two round towers of the SW corner (here), the plinth / string-course / cornice bands round the whole ring, the parapet of squat piers, the zinc hip roof, the roof furniture (c1top.js: turrets, gablets, chimneys, the lantern
//   spire behind the porch), the colliders.  Base collector K.P (always drawn), detail collector K.D (pylons, surrounds, sills, downpipes, plaques: hidden beyond DETAIL_FAR).  Heights in frame.js H.
import * as THREE from 'three';
import { ringOf, holesOf, IDS, H, TAU } from './frame.js';
import { ringEdges, polyOf, band as kitBand } from './kit.js';
import { hipRoof } from './roof.js';
import { holedWall, pane } from './facade.js';
import { arch, rect, stage } from './shell.js';
import { tube, lathe } from './geo.js';
import { offsetRing, inwardAt } from './ring.js';
import { addPolyColliders } from '../lib/massing.js';
import { onBoth, TIER, SPECIAL, DOME, layoutEdge, archRing } from './c1common.js';
import { facade } from './c1walls.js';
import { build as buildPorch } from './porch.js';
import { turret, gablet, chimney, lantern } from './c1top.js';

/** the bands round a ring: rock-faced plinth, string courses, frieze, the stepped cornice */
function bands(K, edges) {
  const P = K.P, M = K.M, draw = () => true;
  kitBand(P, edges, 0, H.plinth, 0.14, { front: M.rust, top: M.stucco }, { uvs: 2.4, draw });
  kitBand(P, edges, H.str1, H.str1 + 0.5, 0.2, { front: M.stucco, top: M.stucco, under: M.stucco }, { uvs: 2.4, draw });
  kitBand(P, edges, H.str2 - 0.3, H.str2, 0.12, { front: M.stucco, top: M.stucco }, { uvs: 2.4, draw });
  kitBand(P, edges, H.wall - 0.55, H.wall, 0.1, { front: M.frieze }, { uvs: 2.4, draw });
  kitBand(P, edges, H.wall, H.wall + 0.55, 0.4, { front: M.stucco, under: M.stuccoD }, { uvs: 2.4, draw });
  kitBand(P, edges, H.wall + 0.55, H.corniceTop, 0.75, { front: M.stucco, top: M.stucco, under: M.stuccoD }, { uvs: 2.4, draw });
}

/** the parapet of squat piers (alpha cut-out) on the cornice of every edge */
function parapet(K, edges) {
  const D = K.D, M = K.M;
  for (const e of edges) {
    if (e.len < 2) continue;
    onBoth(K, e, (L) => { D.quad(M.bal, [0.2, H.corniceTop, 0.42], [L - 0.2, H.corniceTop, 0.42], [L - 0.2, H.parapet, 0.42], [0.2, H.parapet, 0.42], [0, 0, 1], [[0, 0], [(L - 0.4) / 2, 0], [(L - 0.4) / 2, 1], [0, 1]]); });
  }
}

/** a round tower at world (cx, cz): striped shaft from the corbel, slit windows, cornice, the maroon onion-pointed dome with its spike */
export function roundTower(K, cx, cz, o = {}) {
  const P = K.P, D = K.D, M = K.M, r = o.r ?? 1.9, y0 = o.y0 ?? H.plinth, yTop = o.yTop ?? 17.9;
  const seg = 22, uRep = TAU * r / 2.4;
  tube(P, M.stripe, cx, cz, y0, yTop, r, r, seg, uRep, (yTop - y0) / 2.4);
  tube(P, M.stucco, cx, cz, 4.7, 5.15, r, r + 0.24, seg, 3, 0.4);                              // the corbel under the round tower
  tube(P, M.stucco, cx, cz, 5.15, 5.65, r + 0.24, r + 0.24, seg, 3, 0.4, { capTop: M.stucco });
  tube(P, M.stucco, cx, cz, yTop - 0.15, yTop + 0.35, r + 0.18, r + 0.18, seg, 3, 0.4);       // frieze
  tube(P, M.stucco, cx, cz, yTop + 0.35, yTop + 0.7, r + 0.18, r + 0.55, seg, 3, 0.4);         // corbels of the cornice
  tube(P, M.stucco, cx, cz, yTop + 0.7, yTop + 1.15, r + 0.55, r + 0.55, seg, 3, 0.5, { capTop: M.stuccoD });
  lathe(P, M.dome, 'leti-dome', DOME, cx, yTop + 1.15, cz, 1.0 * (r + 0.4) / 2.35, 1.0, 22, 14);
  const ytip = yTop + 1.15 + 4.7;
  P.cyl(M.gold, [cx, ytip - 0.1, cz], [cx, ytip + 1.5, cz], 0.07, 0.04, 6, true);
  P.geo(M.gold, new THREE.SphereGeometry(0.22, 8, 6), cx, ytip + 0.35, cz);
  for (const lv of [[6.4, 8.2], [9.6, 11.4], [12.8, 14.6]]) for (let k = 0; k < 4; k++) {            // slit windows: four azimuths, three levels
    const a = k * Math.PI / 2 + (o.az ?? 0), s = Math.sin(a), c = Math.cos(a), rr = r + 0.02, w = 0.22;
    D.quad(M.winS, [cx + s * rr + c * w, lv[0], cz + c * rr - s * w], [cx + s * rr - c * w, lv[0], cz + c * rr + s * w], [cx + s * rr - c * w, lv[1], cz + c * rr + s * w], [cx + s * rr + c * w, lv[1], cz + c * rr - s * w], [s, 0, c], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
}

/** the clock gable wall of the SW corner (edge 21, 14.8 m, between the towers): ground arches, a row of small windows and the great tripartite hall window (photo 63) */
function gableWall(K, e) {
  const M = K.M, P = K.P, D = K.D, L = e.len, cx = L / 2;
  onBoth(K, e, () => {
    const holes = [arch(cx - 2.7, H.winG0, 1.4, 2.9, 'winA'), arch(cx, H.winG0, 1.4, 2.9, 'winA'), arch(cx + 2.7, H.winG0, 1.4, 2.9, 'winA'), arch(cx, 6.1, 5.0, 6.9, 'winC')];
    holedWall(P, M.stripe, 0, L, H.plinth - 0.05, H.wall, holes, { depth: 0.55, uvs: 2.4, noEnds: true, seg: 8 });
    for (const h of holes) pane(P, M[h.mat], h, 0.55);
    for (const h of holes) {
      const big = h.w > 4;
      archRing(D, M.stucco, h.cx, h.y0, h.w, h.h, big ? 0.42 : 0.17, big ? 0.14 : 0.07, big ? 12 : 8);
      D.box(M.stucco, h.cx - h.w / 2 - (big ? 0.5 : 0.2), h.cx + h.w / 2 + (big ? 0.5 : 0.2), h.y0 - 0.13, h.y0 - 0.02, 0, big ? 0.26 : 0.14, 'kb');
    }
  });
}

/** the clock gable above edge 21: the pale gable face, rake cornices, the clock, the attic stack with two windows and a pent roof, small finials */
function gableFront(K, e) {
  const P = K.P, D = K.D, M = K.M, L = e.len;
  onBoth(K, e, () => {
    const cx = L / 2, x0 = 1.5, x1 = L - 1.5, y0 = H.corniceTop, ya = H.gableApex;
    P.fan(M.stucco, [[x0, y0, 0.0], [x1, y0, 0.0], [cx, ya, 0.0]], [0, 0, 1], (p) => [p[0] / 2.4, p[1] / 2.4]);                      // the pale gable face
    P.quad(M.clock, [cx - 0.95, 16.35, 0.05], [cx + 0.95, 16.35, 0.05], [cx + 0.95, 18.25, 0.05], [cx - 0.95, 18.25, 0.05], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // a stripe panel and two pilaster strips on the gable face
    P.quad(M.stripe, [cx - 3.9, y0, 0.03], [cx + 3.9, y0, 0.03], [cx + 3.9, y0 + 1.2, 0.03], [cx - 3.9, y0 + 1.2, 0.03], [0, 0, 1], [[0, 0], [3.25, 0], [3.25, 0.5], [0, 0.5]]);
    for (const s of [-1, 1]) {                                                                                                              // rake cornices
      const ax = s < 0 ? x0 : x1, bx = cx;
      D.quad(M.stucco, [ax, y0 - 0.05, 0.0], [bx, ya - 0.05, 0.0], [bx, ya + 0.45, 0.35], [ax, y0 + 0.45, 0.35], [0, 0.6, 0.8], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    P.box(M.stripe, cx - 1.7, cx + 1.7, ya - 0.6, ya + 2.8, -2.6, -0.4, '', 2.4);                                                          // the attic stack
    for (const s of [-1, 1]) P.quad(M.winR, [cx + s * 0.7 - 0.45, ya + 0.35, -0.38], [cx + s * 0.7 + 0.45, ya + 0.35, -0.38], [cx + s * 0.7 + 0.45, ya + 1.95, -0.38], [cx + s * 0.7 - 0.45, ya + 1.95, -0.38], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const s of [-1, 1]) P.quad(M.zinc, [cx + s * 1.95, ya + 2.7, 0.2], [cx + s * 1.95, ya + 2.7, -2.9], [cx, ya + 3.7, -2.9], [cx, ya + 3.7, 0.2], [s * 0.45, 0.9, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const x of [x0 - 0.3, x1 + 0.3]) { P.box(M.stucco, x - 0.28, x + 0.28, y0, y0 + 0.9, -0.3, 0.3, '', 1); P.cyl(M.dome, [x, y0 + 0.9, 0], [x, y0 + 2.0, 0], 0.26, 0.0, 6, false); }
  });
}

/** point in polygon (ring [[x, z]..]) */
function inside(ring, x, z) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if ((ring[i][1] > z) !== (ring[j][1] > z) && x < (ring[j][0] - ring[i][0]) * (z - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) c = !c;
  return c;
}

export function build(K) {
  const ctx = K.ctx, M = K.M, ring = ringOf(IDS.c1), holes = holesOf(IDS.c1);
  if (!ring) throw new Error('r1915364 missing');
  const edges = ringEdges(polyOf(ring, holes));
  const outer = edges.filter((e) => !e.hole), inner = edges.filter((e) => e.hole);
  const state = { ring, holes, edges, outer, inner, pylons: [], roofH: null };
  K.shared.c1 = state;
  const byI = (i) => outer.find((e) => e.i === i);
  stage(K, 'walls', () => {
    for (const e of outer) {
      const sp = SPECIAL[e.i];
      if (sp === 'porch') { state.porchFrame = buildPorch(K, e); continue; }
      if (sp === 'gable') { gableWall(K, e); continue; }
      facade(K, e, TIER[e.i] || 'A', state);
    }
    for (const e of inner) facade(K, e, 'B', state);
  });
  stage(K, 'bands', () => { bands(K, outer); bands(K, inner); });
  stage(K, 'parapet', () => parapet(K, edges));
  stage(K, 'gable', () => gableFront(K, byI(21)));
  stage(K, 'towers', () => { for (const i of [21, 22]) { const v = ring[i], d = inwardAt(ring, i); roundTower(K, v[0] + d[0] * 0.95, v[1] + d[1] * 0.95, {}); } });
  stage(K, 'roof', () => {
    const off = offsetRing(ring, 0.65), hoff = holes.map((h) => offsetRing(h, -0.65));
    state.roofH = hipRoof(K.P, M.zinc, off, hoff, H.corniceTop - 0.12, { slope: 0.78, R: 7.2, cell: 3.0, uvs: 1.2 });
  });
  stage(K, 'top', () => {
    const rh = state.roofH, P = K.P;
    // turrets on the corner pylons of the fronts (ends of tier-A edges of >= 12 m, and every second interior pylon), not closer than 9 m to each other
    const placed = [];
    for (const p of state.pylons) {
      if (!p.turret) continue;
      if (placed.some((q) => Math.hypot(q[0] - p.wx, q[1] - p.wz) < 9)) continue;
      placed.push([p.wx, p.wz]); turret(P, M, p.wx - p.nx * 0.15, p.wz - p.nz * 0.15, H.corniceTop - 0.05, { r: 0.95, h: 2.5 });
    }
    // timber gablets over the middle of the bay groups of the tier-A fronts
    for (const g of state.gablets || []) { const x = g.wx - g.nx * 1.7, z = g.wz - g.nz * 1.7; gablet(P, M, x, z, rh(x, z) + 0.25, g.nx, g.nz, {}); }
    // chimneys
    for (const [i, f] of [[26, 0.3], [26, 0.75], [30, 0.35], [30, 0.8], [38, 0.3], [38, 0.65], [38, 0.9]]) {
      const e = byI(i); if (!e) continue;
      const x = e.a[0] + (e.b[0] - e.a[0]) * f - e.n[0] * 5.5, z = e.a[1] + (e.b[1] - e.a[1]) * f - e.n[1] * 5.5;
      if (inside(ring, x, z)) chimney(P, M, x, z, rh(x, z), 3.0);
    }
    // the lantern spire behind the porch (11.5 m inside the middle of the porch front)
    const pe = byI(28), pm = [(pe.a[0] + pe.b[0]) / 2 - pe.n[0] * 11.5, (pe.a[1] + pe.b[1]) / 2 - pe.n[1] * 11.5];
    state.lantern = pm;
    lantern(P, M, pm[0], pm[1], rh(pm[0], pm[1]) - 0.3, { a0: Math.atan2(pe.n[0], pe.n[1]) + Math.PI / 8 });
  });
  stage(K, 'colliders', () => { addPolyColliders(ctx, polyOf(ring, holes), 0, 24); });
  stage(K, 'service', () => {
    const c = [-1723, -4369];
    K.svc.monuments.push({ id: 'r1915364', name: 'ЛЭТИ: корпус 1, здание А. Н. Векшинского (1899-1903)', x: c[0], z: c[1], h: 24 });
    const g = byI(21), gm = [(g.a[0] + g.b[0]) / 2 + g.n[0] * 22, (g.a[1] + g.b[1]) / 2 + g.n[1] * 22];
    K.svc.photoSpots.push({ x: gm[0], z: gm[1], yaw: Math.round(Math.atan2(g.n[0], g.n[1]) * 180 / Math.PI), name: 'ЛЭТИ: угол с часами и круглыми башнями (Профессора Попова / Аптекарский)' });
    const s = byI(14), sm = [(s.a[0] + s.b[0]) / 2 + s.n[0] * 18, (s.a[1] + s.b[1]) / 2 + s.n[1] * 18];
    K.svc.photoSpots.push({ x: sm[0], z: sm[1], yaw: Math.round(Math.atan2(s.n[0], s.n[1]) * 180 / Math.PI), name: 'ЛЭТИ: южный фасад по улице Профессора Попова, мемориальные доски' });
  });
  if (K.errs) throw new Error(K.errs.join('\n'));
}
export { layoutEdge, rect };
