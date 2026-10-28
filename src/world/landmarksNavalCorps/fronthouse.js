// landmarksNavalCorps/fronthouse.js - the FRONT HOUSE of the Optina compound (OSM r4164973, Lt Schmidt emb. 27, 1894-95: the abbot's flat and the metropolitan's rooms), its GATE PORTAL, the iron fence along the
// church plinth and the stucco fence of 1900 beside the apses (docs/research/navalcorps.md 6.4 / 6.5, photos refs/navalcorps c21 c08 c31 c24 c17 c13).  Frame C.
//   HOUSE   three floors, cornice 13.4 m, a parapet with ogee crowns over every pair of windows (to 15.0), yellow-ochre brick with cream belts and terracotta bands; pairs of tall windows (1.1 x 2.3 ground,
//           1.1 x 2.6 first, 1.0 x 1.8 top, pairs 3.4 m apart); an iron balcony on the first floor near the NW-most pair (the metropolitan's, 3.4 m wide); the baked ring is used, the fronts are the three
//           edges on the embankment (v 34.5 / 31.6 / 30.0), the other faces carry a plain brick texture.
//   PORTAL  the carriage gate at the porch block (u -4 .. 0): a deep arched doorway 3.2 m wide, a round mosaic medallion in the gable, a gilded onion on a grey octagonal stalk (to 16 m).
//   FENCES  the low black iron railing along the church plinth (SE face and the apse facets), 0.9 m high on 2.4 m bays; the ochre stucco fence of 1900 at u 34.2 (2.4 m, white panel frames, piers every 3.5 m,
//           an iron grille 0.8 m above, a closed wicket and gate): the compound is closed.
import * as THREE from 'three';
import * as L from '../layout.js';
import { C, CH_PLAN } from './frame.js';
import { ringEdges, onEdge, localOnEdge } from './kit.js';
import { windowWall } from './facade.js';
import { ogeePts, shapeOf, archPts, planeShape, frameRing } from './geo.js';
import { revolve } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';

const H = 13.4;
export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksNavalCorps] fronthouse/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('house', () => house(Q));
  stage('fences', () => fences(Q));
  if (errs.length) throw new Error(errs.join('\n'));
}

function house(Q) {
  const P = Q.P, M = Q.M, b = L.buildingById('r4164973');
  let poly = b && b.polys && b.polys[0];
  if (!poly) {
    const ring = [[0, 23.9], [0, 30.0], [-4.0, 30.0], [-4.0, 31.6], [-14.5, 31.6], [-14.5, 34.5], [-35.0, 34.5], [-35.1, 14.5], [-15.5, 14.5], [-15.5, 6.4], [0, 6.4]];
    poly = { o: ring.flatMap(([u, v]) => { const p = C.W(u, v); return [p.x, p.z]; }), h: [] };
  }
  const edges = ringEdges(poly);
  for (const e of edges) {
    const A = C.M(e.a[0], e.a[1]), B = C.M(e.b[0], e.b[1]), nv = e.n[0] * C.V[0] + e.n[1] * C.V[1];
    const vm = (A.v + B.v) / 2, front = nv > 0.9 && Math.abs(A.v - B.v) < 0.3 && vm > 29;
    onEdge(P, e, (len) => {
      if (front && len > 3) {
        // windowed front: pairs of windows 3.4 m apart
        const xs = []; const np = Math.max(1, Math.floor((len - 1.0) / 3.4)); for (let k = 0; k < np; k++) { const c = (len - (np - 1) * 3.4) / 2 + k * 3.4; xs.push(c - 0.62, c + 0.62); }
        const ops = [];
        for (const x of xs) { ops.push({ x, w: 1.1, y0: 1.0, y1: 3.3, glass: M.houseWin }, { x, w: 1.1, y0: 5.0, y1: 7.6, glass: M.houseWin }, { x, w: 1.0, y0: 9.6, y1: 11.4, glass: M.houseWin }); }
        windowWall(P, { x0: 0, x1: len, y1: H, z0: 0, tu: 3, tv: 3, base: M.facadeHouse, baseTop: 0.0, wall: M.facadeHouse, reveal: M.houseCream, ops, depth: 0.3 });
        P.box(M.plinth, 0, len, 0, 0.6, 0, 0.1, 'b', 2);
        P.box(M.houseCream, 0, len, 4.0, 4.25, 0, 0.1, 'bk', 2); P.box(M.houseTerra, 0, len, 4.25, 4.45, 0, 0.1, 'bk', 2);
        P.box(M.houseCream, 0, len, 8.9, 9.15, 0, 0.1, 'bk', 2); P.box(M.houseTerra, 0, len, 9.15, 9.35, 0, 0.1, 'bk', 2);
        for (let k = 0; k < xs.length; k += 2) {
          const c = (xs[k] + xs[k + 1]) / 2;
          for (const [yh, ww] of [[3.4, 2.7], [7.7, 2.7], [11.5, 2.5]]) { const o = ogeePts(ww, 0.75, 6); P.push(c, yh, 0, 0); P.extrude(M.houseCream, shapeOf(o), 0, 0.1, 1, 4); P.pop(); }
          for (const x of [xs[k], xs[k + 1]]) P.box(M.houseCream, x - 0.62, x + 0.62, 1.0 - 0.1, 1.0, 0, 0.12, 'bk', 1);
        }
        for (let k = 1; k < xs.length - 1; k += 2) { const x = (xs[k] + xs[k + 1]) / 2; P.box(M.houseCream, x - 0.18, x + 0.18, 0.6, H, 0, 0.1, 'bk', 1); }       // pilasters between the pairs
        // cornice and the parapet with the ogee crowns
        P.box(M.houseCream, -0.2, len + 0.2, 12.4, 13.4, 0, 0.55, 'bk', 2);
        P.box(M.facadeHouse, -0.2, len + 0.2, 13.4, 14.4, 0.0, 0.4, 'bk', 3);
        for (let k = 0; k < xs.length; k += 2) { const c = (xs[k] + xs[k + 1]) / 2, o = ogeePts(2.9, 0.9, 6); P.push(c, 14.4, 0, 0); P.extrude(M.houseCream, shapeOf(o), 0.0, 0.4, 1, 4); P.pop(); }
        // the metropolitan's balcony on the first floor at the NW-most window pair
        if (A.v > 33 && Math.abs(len - 20.5) < 1.5 && xs.length >= 4) balcony(P, M, (xs[2] + xs[3]) / 2, 4.45, 3.4);
      } else {
        P.quad(M.facadeHouse, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, H / 3], [0, H / 3]]);
        P.box(M.houseCream, -0.2, len + 0.2, 12.4, 13.4, 0, 0.5, 'bk', 2);
      }
      void localOnEdge;
    });
  }
  P.cap(M.zinc, pairsOf(poly.o), H, true, 2.4);
  addPolyColliders(Q.ctx, poly, -0.3, 16, 0.9);
  // the gate portal at the porch block: the face at v 30.0 between u -4 and 0
  portal(Q);
  Q.svc.monuments.push({ id: 'r4164973', name: 'Дом подворья', x: C.W(-20, 25).x, z: C.W(-20, 25).z, h: 15 });
}
const pairsOf = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };

function balcony(P, M, xc, y, w) {
  P.box(M.ironRail, xc - w / 2, xc + w / 2, y, y + 0.1, 0, 0.9, 'k', 1);
  for (let i = 0; i <= 12; i++) { const x = xc - w / 2 + 0.05 + i * (w - 0.1) / 12; P.box(M.ironRail, x - 0.015, x + 0.015, y + 0.1, y + 1.0, 0.86, 0.9, 'bk', 1); }
  P.box(M.ironRail, xc - w / 2, xc + w / 2, y + 1.0, y + 1.05, 0.84, 0.9, 'b', 1);
  for (const s of [-1, 1]) { P.box(M.ironRail, xc + s * w / 2 - 0.02, xc + s * w / 2 + 0.02, y + 0.1, y + 1.05, 0, 0.9, 'b', 1); }
}

/** the carriage-gate portal: world frame C coordinates (u -4 .. 0 at v 30.0, facing +v) */
function portal(Q) {
  const P = Q.P, M = Q.M;
  P.push(C.x, 0, C.z, C.rot);
  try {
    const x0 = -4.0, x1 = 0.0, xc = -2.0, z = 30.0, S = 0.35;
    // the face of the porch block above the cornice zone is the house wall; here: stepped archivolt (a deep arched doorway 3.2 m wide) and the gable above
    P.push(0, 0, z, 0);
    // frame in a local frame whose +x is u and +z = v: shift so that the portal centre sits at xc
    const arch = (w, hh, d, mat, z0) => frameRing(P, mat, archPts(xc, 0.0, w, hh, 8), archPts(xc, 0.0, w - 0.45, hh - 0.25, 8), z0, d, 1);
    arch(3.6, 4.4, 0.2, M.houseCream, 0.0); arch(3.2, 4.0, 0.2, M.houseTerra, 0.2);
    planeShape(P, M.glassDark, archPts(xc, 0.0, 2.8, 3.6, 8), 0.05);
    // the gable with a round mosaic medallion of the Saviour (generic gold disc) and the gilded onion on a grey octagonal stalk
    P.box(M.houseCream, x0 - 0.1, x1 + 0.1, 11.6, 12.4, 0, 0.5, 'bk', 2);
    const g = new THREE.CircleGeometry(0.75, 16); P.geo(M.mosaic, g, xc, 8.6, 0.12, 0, 0, 0, 1, 1, 1); g.dispose();
    P.box(M.houseCream, xc - 0.9, xc + 0.9, 7.55, 7.7, 0.0, 0.2, 'bk', 1);
    revolve(P, M.stalk, [[0.62, 13.4], [0.6, 14.2], [0.45, 14.3], [0.4, 15.0]], 8, { cx: xc, cz: 1.5, uRep: 2, vTile: 1 });
    revolve(P, M.gild, [[0.45, 15.0], [0.8, 15.3], [0.85, 15.7], [0.6, 16.1], [0.25, 16.5], [0.05, 16.9]], 16, { cx: xc, cz: 1.5, uRep: 4, vTile: 1 });
    P.pop();
    void S; void CH_PLAN;
  } finally { P.pop(); }
}

function fences(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics;
  P.push(C.x, 0, C.z, C.rot);
  try {
    // the low black iron railing along the church plinth: SE face (u 0 .. 27.2 at v 24.7), the SE side-apse facet and the apse facets round to the NE corner, posts every 2.4 m
    const pts = [[-0.2, 24.75], [27.4, 24.75], [30.9, 22.9], [31.0, 19.6], [32.4, 16.5], [32.6, 9.0], [31.0, 6.0]];
    for (let i = 0; i + 1 < pts.length; i++) rail(Q, pts[i], pts[i + 1]);
    // the fence of 1900 on the 15th-line side of the apses at u 34.2, v -3 .. 27
    const u = 34.2, v0 = -3, v1 = 27, len = v1 - v0;
    P.box(M.ochreWall, u - 0.2, u + 0.2, 0, 2.4, v0, v1, 'b', 3);
    for (let v = v0; v <= v1 + 0.01; v += 3.5) P.box(M.ochreWall, u - 0.3, u + 0.3, 0, 2.7, v - 0.3, v + 0.3, 'b', 1);
    P.box(M.houseCream, u - 0.25, u + 0.25, 2.4, 2.45, v0, v1, 'b', 3);
    for (let v = v0 + 0.3; v < v1; v += 0.18) P.box(M.ironRail, u - 0.02, u + 0.02, 2.45, 3.25, v, v + 0.03, 'b', 1);
    P.box(M.ironRail, u - 0.03, u + 0.03, 3.2, 3.27, v0, v1, 'b', 1);
    { const a = C.W(u, v0), b = C.W(u, v1); void a; void b; }
    C.wall(ph, [u, v0], [u, v1], -0.2, 3.3, 0.5);
    { const a = C.W(u, v0), b = C.W(u, v1); Q.svc.fences.push({ id: 'compound-fence-1900', pts: [[a.x, a.z], [b.x, b.z]], h: 3.3, kind: 'stucco', gates: [] }); }
    void len;
  } finally { P.pop(); }
}

/** a black railing between two plan points (frame C): posts every 2.4 m, two rails; a thin collider */
function rail(Q, a, b) {
  const P = Q.P, M = Q.M, len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 2.4)), dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
  // local +x along the run (dx, dz): rotY = atan2(-dz, dx)
  P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
  P.box(M.ironRail, 0, len, 0.82, 0.88, -0.02, 0.02, 'b', 1); P.box(M.ironRail, 0, len, 0.25, 0.3, -0.02, 0.02, 'b', 1);
  for (let i = 0; i <= n; i++) { const x = i * len / n; P.box(M.ironRail, x - 0.04, x + 0.04, 0, 0.95, -0.04, 0.04, 'b', 1); }
  for (let x = 0.3; x < len; x += 0.28) P.box(M.ironRail, x - 0.01, x + 0.01, 0.3, 0.82, -0.01, 0.01, 'b', 1);
  P.pop();
  C.wall(Q.ctx.physics, a, b, -0.2, 1.0, 0.25);
  { const A = C.W(a[0], a[1]), B = C.W(b[0], b[1]); Q.svc.fences.push({ id: 'church-railing', pts: [[A.x, A.z], [B.x, B.z]], h: 0.95, kind: 'iron' }); }
}
