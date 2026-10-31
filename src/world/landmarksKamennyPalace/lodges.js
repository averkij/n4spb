// landmarksKamennyPalace/lodges.js - the two buildings of the palace complex that stand on the avenue at the Kamennoostrovsky Bridge approach (dossier docs/research/kamenny-2026.md 5.1 [C], 5.2 table):
//   the GUARDHOUSE (Гауптвахта Каменноостровского дворца, Kamennoostrovsky pr. 77, L. Charlemagne; OSM w28055975 + the tourist node n8072558417; photo X01 / P21): salmon-pink plaster (#e8bfac), a ground floor of
//   squat fluted white pilasters on granite blocks with small windows between and a white dentil entablature, a plain upper floor with small windows, gable ends with a big arched window in a white archivolt,
//   a dark gabled roof with a white-capped chimney.  The long faces carry eight pilasters, the gable ends four (a door in the middle bay).
//   the ORANGERY (Большие каменные оранжереи, Rusca 1809-11; OSM w60962405, 23 x 16 m, one level, gabled): NO photograph exists in the dossier or on Commons [?]: a plain yellow hall with tall arched windows on the
//   long faces, small windows in the ends, a white cornice and a green gabled roof.
import { ringEdges, onEdge, band, polyOf } from './kit.js';
import { holedWall, pane, surround } from './facade.js';
import { GUARD, ORANGERY } from './frame.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKamennyPalace] lodges/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };
const rect = (cx, y0, w, h) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h });
const bays = (len, margin, pitch) => { const n = Math.max(0, Math.round((len - 2 * margin) / pitch)); return Array.from({ length: n }, (_, i) => margin + (i + 0.5) * (len - 2 * margin) / n); };

/** a gable roof over x0..x1, z0..z1 of the current frame: ridge along x, eaves at ye (overhang 0.45 along z, 0.3 at the gables), ridge height yr; the gable triangles use gableMat */
function gable(P, roofMat, gableMat, x0, x1, z0, z1, ye, yr, soffit) {
  const zm = (z0 + z1) / 2, ov = 0.45, gx = 0.3, sl = (yr - ye) / ((z1 - z0) / 2), nl = Math.hypot(1, sl), yo = ye - sl * ov;
  const A = [x0 - gx, yo, z0 - ov], B = [x1 + gx, yo, z0 - ov], C = [x1 + gx, yr, zm], D = [x0 - gx, yr, zm];
  P.quad(roofMat, A, B, C, D, [0, 1 / nl, -sl / nl], [[A[0] / 1.24, 0], [B[0] / 1.24, 0], [B[0] / 1.24, 4], [A[0] / 1.24, 4]]);
  const E = [x0 - gx, yo, z1 + ov], F = [x1 + gx, yo, z1 + ov];
  P.quad(roofMat, F, E, D, C, [0, 1 / nl, sl / nl], [[F[0] / 1.24, 0], [E[0] / 1.24, 0], [E[0] / 1.24, 4], [F[0] / 1.24, 4]]);
  if (soffit) {                                                                                       // the eave soffits (seen from the street under the overhang): horizontal cream strips 5 cm under the eave line
    const y = yo - 0.04;
    P.quad(soffit, [x0 - gx, y, z0 - ov], [x1 + gx, y, z0 - ov], [x1 + gx, y, z0], [x0 - gx, y, z0], [0, -1, 0]);
    P.quad(soffit, [x0 - gx, y, z1], [x1 + gx, y, z1], [x1 + gx, y, z1 + ov], [x0 - gx, y, z1 + ov], [0, -1, 0]);
  }
  for (const [x, nx] of [[x0, -1], [x1, 1]]) P.fan(gableMat, [[x, ye, z0], [x, ye, z1], [x, yr - 0.1, zm]], [nx, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
}

function guard(K) {
  const P = K.P, M = K.M, ring = GUARD, edges = ringEdges(polyOf(ring)), N = edges.length;
  const conv = edges.map((e, i) => { const nx = edges[(i + 1) % N]; const d = [nx.b[0] - nx.a[0], nx.b[1] - nx.a[1]], l = Math.hypot(...d); return (d[0] * e.n[0] + d[1] * e.n[1]) / l < -0.5; });
  const Yp = 0.75, Ye = 3.75, Yu = 4.25, Yc = 7.2;
  edges.forEach((e, i) => {
    const longSide = e.len > 16.5;
    onEdge(P, e, (len) => {
      const holes = [], np = longSide ? 8 : 4, pu = Array.from({ length: np }, (_, k) => 0.75 + k * (len - 1.5) / (np - 1));
      for (let k = 0; k + 1 < np; k++) {
        const c = (pu[k] + pu[k + 1]) / 2;
        if (!longSide && k === 1) holes.push({ x0: c - 0.8, x1: c + 0.8, y0: Yp, y1: 3.2, door: true }); else holes.push(rect(c, 1.3, 0.85, 1.55));
        if (longSide) holes.push(rect(c, 5.2, 0.9, 1.35));
      }
      if (!longSide) holes.push({ cx: len / 2, y0: 4.7, w: 2.5, h: 2.4, arch: true });
      P.box(M.plinth, -0.05, len + 0.05, 0, Yp, -0.02, 0.1, 'b', 1.8);
      holedWall(P, M.pink, 0, len, Yp, Yc, holes, { depth: 0.3, uvs: 3 });
      for (const h of holes) {
        if (h.door) { pane(P, M.door, h, 0.3); surround(P, M.white, h, { sw: 0.14, proud: 0.05, sill: 0 }); continue; }
        if (h.arch) {
          pane(P, M.winU, h, 0.3); const sw = 0.25, st = h.h - h.w / 2;
          P.box(M.white, h.cx - h.w / 2 - sw, h.cx - h.w / 2, h.y0, h.y0 + st, 0, 0.08, 'k', 3); P.box(M.white, h.cx + h.w / 2, h.cx + h.w / 2 + sw, h.y0, h.y0 + st, 0, 0.08, 'k', 3);
          P.box(M.white, h.cx - h.w / 2 - sw, h.cx + h.w / 2 + sw, h.y0 + h.h, h.y0 + h.h + sw, 0, 0.08, 'k', 3); continue;
        }
        pane(P, M.winK, h, 0.3); surround(P, M.white, h, { sw: 0.1, proud: 0.05, sill: 0.08 });
      }
      // the squat fluted pilasters on granite blocks (four grooves each), a capital block under the dentil entablature
      for (const u of pu) {
        P.box(M.plinth, u - 0.45, u + 0.45, 0, Yp, 0, 0.3, 'b', 1.8);
        P.box(M.white, u - 0.33, u + 0.33, Yp, Ye - 0.35, 0, 0.24, 'kb', 3);
        for (const g of [-0.2, -0.07, 0.07, 0.2]) P.box(M.shade, u + g - 0.012, u + g + 0.012, Yp + 0.05, Ye - 0.4, 0.24, 0.245, 'kb', 3);
        P.box(M.white, u - 0.45, u + 0.45, Ye - 0.35, Ye, 0, 0.3, 'k', 3);
      }
      if (conv[i]) P.box(M.white, len - 0.2, len + 0.1, Yu, Yc, 0, 0.08, 'k', 3);
      if (conv[(i + N - 1) % N]) P.box(M.white, -0.1, 0.2, Yu, Yc, 0, 0.08, 'k', 3);
      if (longSide) P.col(M.shade, pu[np - 2], 0.31, 0.2, Yc - 0.1, 0.06, 0.06, 6, false);               // the drain pipe of P21: hugs the front of a pilaster (it used to float 0.5 m off the wall)
    });
  });
  band(P, edges, Ye, Ye + 0.18, 0.2, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  band(P, edges, Ye + 0.18, Ye + 0.4, 0.28, { front: M.dentil, top: M.white, under: M.shade }, { uvs: 1.02 });
  band(P, edges, Ye + 0.4, Yu, 0.12, { front: M.white, top: M.white, under: null }, { uvs: 3 });
  band(P, edges, Yc, Yc + 0.22, 0.3, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  band(P, edges, Yc + 0.22, Yc + 0.45, 0.42, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  // the gable roof in the frame of the ring: origin = vertex 1, local +x along edge 0 reversed (v1 -> v0), the building lies at z < 0
  const a = ring[1], b = ring[0], th = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), wd = Math.hypot(b[0] - a[0], b[1] - a[1]), dp = Math.hypot(ring[2][0] - a[0], ring[2][1] - a[1]);
  P.push(a[0], 0, a[1], th);
  gable(P, M.iron, M.pink, 0.0, wd, -dp, 0.0, Yc + 0.45, Yc + 0.45 + 2.75, M.shade);
  const x = wd * 0.3; P.box(M.pink, x - 0.4, x + 0.4, Yc + 1.0, Yc + 3.6, -dp / 2 - 0.4, -dp / 2 + 0.4, 'b', 3); P.box(M.white, x - 0.5, x + 0.5, Yc + 3.6, Yc + 3.78, -dp / 2 - 0.5, -dp / 2 + 0.5, 'b', 3);
  P.pop();
}

function orangery(K) {
  const P = K.P, M = K.M, ring = ORANGERY, edges = ringEdges(polyOf(ring));
  const Yp = 0.6, Yc = 4.6;
  edges.forEach((e) => {
    const longSide = e.len > 20;
    onEdge(P, e, (len) => {
      const cs = bays(len, 2.0, longSide ? 3.4 : 4.0), holes = cs.map((u) => (longSide ? { cx: u, y0: 1.0, w: 1.9, h: 3.1, arch: true } : rect(u, 1.6, 1.2, 1.6)));
      P.box(M.plinth, -0.05, len + 0.05, 0, Yp, -0.02, 0.1, 'b', 1.8);
      holedWall(P, M.wall, 0, len, Yp, Yc, holes, { depth: 0.3, uvs: 3 });
      for (const h of holes) {
        if (h.arch) {
          pane(P, M.winG, h, 0.3); const sw = 0.2, st = h.h - h.w / 2;
          P.box(M.white, h.cx - h.w / 2 - sw, h.cx - h.w / 2, h.y0, h.y0 + st, 0, 0.07, 'k', 3); P.box(M.white, h.cx + h.w / 2, h.cx + h.w / 2 + sw, h.y0, h.y0 + st, 0, 0.07, 'k', 3);
          P.box(M.white, h.cx - h.w / 2 - sw, h.cx + h.w / 2 + sw, h.y0 + h.h, h.y0 + h.h + sw, 0, 0.07, 'k', 3);
        } else { pane(P, M.winK, h, 0.3); surround(P, M.white, h, { sw: 0.1, proud: 0.05, sill: 0.08 }); }
      }
    });
  });
  band(P, edges, Yc, Yc + 0.25, 0.3, { front: M.white, top: M.white, under: M.shade }, { uvs: 3 });
  const a = ring[1], b = ring[0], th = Math.atan2(-(b[1] - a[1]), b[0] - a[0]), wd = Math.hypot(b[0] - a[0], b[1] - a[1]), dp = Math.hypot(ring[2][0] - a[0], ring[2][1] - a[1]);
  P.push(a[0], 0, a[1], th);
  gable(P, M.copper, M.wall, 0.0, wd, -dp, 0.0, Yc + 0.25, Yc + 0.25 + 2.3, M.shade);
  P.pop();
}

export function build(K) {
  stage(K, 'guard', () => guard(K));
  stage(K, 'orangery', () => orangery(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
