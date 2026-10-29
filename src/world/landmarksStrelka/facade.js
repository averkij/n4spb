// landmarksStrelka/facade.js - the edge-based building shell of the warehouses and the Customs house: every edge of an OSM footprint gets a flat wall with a BAY texture (mats.js: one bay per
// tile, u = bay index, v = height / texture height), a mitred white cornice and a low hipped sheet-iron roof (the footprint inset by `inset` at eave + rise, a flat ridge band, chimneys).
// World frame (footprints come from data/city.js); kit.js ringEdges / onEdge / band give the facade frames (x along the wall, z out of it).
import * as THREE from 'three';
import { ringEdges, onEdge, band } from './kit.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { inflate, inRing, distToLine } from './surfaces.js';

/**
 * walls of a footprint.  o: { mat, bayW (m per bay), texH (m of the bay texture), eave, plain (material for short edges), skip: fn(edge) -> true omits the wall, minBay (default 3.2),
 *   y0 (default 0), vOf: fn(y) custom v }.  Returns the edges (outer ring first).
 */
export function shellWalls(P, poly, o) {
  const edges = ringEdges(poly, 0.3);
  for (const e of edges) {
    if (o.skip && o.skip(e)) continue;
    onEdge(P, e, (len) => {
      const y0 = o.y0 ?? 0, v0 = y0 / o.texH, v1 = o.eave / o.texH;
      if (len < (o.minBay ?? 3.2)) { P.quad(o.plain, [0, y0, 0], [len, y0, 0], [len, o.eave, 0], [0, o.eave, 0], [0, 0, 1]); return; }
      const n = Math.max(1, Math.round(len / o.bayW));
      // long walls are split so that no quad is longer than ~4 bays (precision and the batcher's bounds)
      for (let i = 0; i < n; i += 4) { const j = Math.min(n, i + 4), x0 = len * i / n, x1 = len * j / n; P.quad(o.mat, [x0, y0, 0], [x1, y0, 0], [x1, o.eave, 0], [x0, o.eave, 0], [0, 0, 1], [[i, v0], [j, v0], [j, v1], [i, v1]]); }
    });
  }
  return edges;
}
/** mitred cornice ring(s) at the eave of every ring of the footprint */
export function shellCornice(P, poly, eave, M, d = 0.45, h = 0.55) {
  const rings = [poly.o, ...poly.h];
  for (const r of rings) { const es = ringEdges({ o: r, h: [] }, 0.3); band(P, es, eave - h, eave, d, { front: M.white, top: M.white, under: M.soffit }); band(P, es, eave - h - 0.35, eave - h, d * 0.45, { front: M.white, under: M.soffit }); }
}
/** low hipped roof: slopes from the eave ring to the ring inset by `inset` at eave + rise, a flat top, chimneys on the flat band.  Works on the outer ring (courtyard holes are roofed over at the eave). */
export function shellRoof(P, poly, eave, mat, o = {}) {
  const ring = ringFromFlat(poly.o), inset = o.inset ?? 3.4, rise = o.rise ?? 2.2;
  let a = 0; for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p[0] * q[1] - q[0] * p[1]; }
  const out = inflate(ring, 0.42), inn = inflate(ring, -inset).map((p, i) => {
    // an inset vertex must stay inside the footprint and away from its boundary: otherwise fall back toward the wall vertex (thin projections get a lean-to instead of a hip)
    for (const k of [1, 0.6, 0.3, 0.08]) { const q = [ring[i][0] + (p[0] - ring[i][0]) * k, ring[i][1] + (p[1] - ring[i][1]) * k]; if (inRing(ring, q[0], q[1]) && distToLine(ring, q[0], q[1], true) > inset * k * 0.55) return { p: q, k }; }
    return { p: ring[i].slice(), k: 0 };
  });
  const n = ring.length, ye = eave + 0.02;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, A = out[i], B = out[j], C = inn[j], D = inn[i], yc = ye + rise * C.k, yd = ye + rise * D.k;
    const dx = B[0] - A[0], dz = B[1] - A[1], l = Math.hypot(dx, dz) || 1, nx = (a > 0 ? dz : -dz) / l, nz = (a > 0 ? -dx : dx) / l;
    if (l < 0.05) continue;
    P.quad(mat, [A[0], ye, A[1]], [B[0], ye, B[1]], [C.p[0], yc, C.p[1]], [D.p[0], yd, D.p[1]], [nx * 0.5, 1, nz * 0.5], [[0, 0], [l / 0.6, 0], [l / 0.6, 6], [0, 6]]);
  }
  // the top: triangulated inset ring, every vertex at its own height (flat where all are at eave + rise)
  const c2 = inn.map((q) => new THREE.Vector2(q.p[0], q.p[1])), tris = THREE.ShapeUtils.triangulateShape(c2, []), k = P.bucket(mat), base = k.n;
  for (const q of inn) P._vert(k, q.p[0], ye + rise * q.k + 0.002, q.p[1], 0, 1, 0, q.p[0] / 0.6, q.p[1] / 0.6);
  for (const [i0, i1, i2] of tris) { const A = inn[i0].p, B = inn[i1].p, C = inn[i2].p, cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]); if (cy > 0) k.idx.push(base + i0, base + i1, base + i2); else k.idx.push(base + i0, base + i2, base + i1); P.tris++; }
  // chimneys: along the long edges of the inset ring
  if (o.chimney) for (let i = 0; i < n; i++) {
    const A = inn[i], B = inn[(i + 1) % n]; if (A.k < 1 || B.k < 1) continue;
    const l = Math.hypot(B.p[0] - A.p[0], B.p[1] - A.p[1]); if (l < 14) continue;
    const m = Math.floor(l / 13);
    for (let q = 0; q < m; q++) { const t = (q + 0.5) / m, x = A.p[0] + (B.p[0] - A.p[0]) * t, z = A.p[1] + (B.p[1] - A.p[1]) * t, r = Math.atan2(B.p[0] - A.p[0], B.p[1] - A.p[1]); P.push(x, 0, z, r); P.box(o.chimney, -0.45, 0.45, ye + rise - 0.3, ye + rise + 1.5, -0.7, 0.7, 'b'); P.box(o.cap || o.chimney, -0.52, 0.52, ye + rise + 1.5, ye + rise + 1.62, -0.78, 0.78, ''); P.pop(); }
  }
}
export function shellColliders(ctx, poly, y1) { return addPolyColliders(ctx, poly, 0, y1); }
/** the edge of `edges` nearest to the segment (ax,az)-(bx,bz) (both ends within tol) */
export function edgeNear(edges, ax, az, bx, bz, tol = 1.5) {
  const d = (p, x, z) => Math.hypot(p[0] - x, p[1] - z);
  return edges.find((e) => (d(e.a, ax, az) < tol && d(e.b, bx, bz) < tol) || (d(e.a, bx, bz) < tol && d(e.b, ax, az) < tol)) || null;
}
