// landmarksUniversity/shell.js - the edge-based building shell (after landmarksStrelka/facade.js): every edge of an OSM footprint gets a flat wall made of RUNS (a run = a quad with a bay
// texture: one bay per tile, u = bay index, v = height / texture height; or a plain quad), mitred cornice bands, and a roof: `insetRoof` (a low hip over any ring: the footprint inset by
// `inset` at eave + rise) or `hipRect` (a true hip / gable roof over a rectangle of a local frame).  World frame for the footprint functions; kit.js onEdge gives the facade frames
// (x along the wall to the right seen from outside, y up, z out).
import * as THREE from 'three';
import { ringEdges, onEdge, band } from './kit.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { inflate, inRing, distToLine } from './surfaces.js';

/** one textured wall quad x0..x1 (facade frame), y0..y1, u from u0 to u1, v = (y - yBase) / texH; split so that no quad spans more than 4 tiles */
export function texQuad(P, mat, x0, x1, y0, y1, u0, u1, texH, z = 0, yBase = 0) {
  const k = Math.max(1, Math.ceil(Math.abs(u1 - u0) / 4)), v0 = (y0 - yBase) / texH, v1 = (y1 - yBase) / texH;
  for (let i = 0; i < k; i++) { const a = x0 + (x1 - x0) * i / k, b = x0 + (x1 - x0) * (i + 1) / k, ua = u0 + (u1 - u0) * i / k, ub = u0 + (u1 - u0) * (i + 1) / k; P.quad(mat, [a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z], [0, 0, 1], [[ua, v0], [ub, v0], [ub, v1], [ua, v1]]); }
}
/** plain wall quad (uv in metres / 3) */
export function plainQuad(P, mat, x0, x1, y0, y1, z = 0) {
  if (x1 - x0 < 0.01 || y1 - y0 < 0.01) return;
  const k = Math.max(1, Math.ceil((x1 - x0) / 16));
  for (let i = 0; i < k; i++) { const a = x0 + (x1 - x0) * i / k, b = x0 + (x1 - x0) * (i + 1) / k; P.quad(mat, [a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z], [0, 0, 1], [[a / 3, y0 / 3], [b / 3, y0 / 3], [b / 3, y1 / 3], [a / 3, y1 / 3]]); }
}
/**
 * A wall of length len in the current facade frame as n bays of st.mat between two plain margins.  st: { mat, bayW (nominal), texH, plain, margin (plain strip at both ends, default 0),
 * n (fixed bay count), minBay, y0 (default 0), eave, mats: fn(i, n) -> material of bay i (overrides mat), yBase }.  Returns { n, x0, pitch }.
 */
export function bayWall(P, len, st) {
  const y0 = st.y0 ?? 0, y1 = st.eave, m = Math.min(st.margin ?? 0, len / 2 - 0.05), span = len - 2 * m;
  if (!st.mat || len < (st.minBay ?? 2.6) || span < (st.minBay ?? 2.6) * 0.8) { plainQuad(P, st.plain, 0, len, y0, y1); return { n: 0, x0: 0, pitch: len }; }
  const n = st.n ?? Math.max(1, Math.round(span / st.bayW)), pitch = span / n;
  if (m > 0.01) { plainQuad(P, st.plain, 0, m, y0, y1); plainQuad(P, st.plain, len - m, len, y0, y1); }
  if (st.mats) { for (let i = 0; i < n; i++) texQuad(P, st.mats(i, n) || st.mat, m + i * pitch, m + (i + 1) * pitch, y0, y1, 0, 1, st.texH, 0, st.yBase ?? 0); }
  else texQuad(P, st.mat, m, len - m, y0, y1, 0, n, st.texH, 0, st.yBase ?? 0);
  return { n, x0: m, pitch };
}
/**
 * walls of a footprint.  style(e) -> a bayWall style | 'skip' | null (= o.def).  Every edge gets e.st (its style), e.lay ({ n, x0, pitch }) for the callers that add relief.
 * Returns the edges (outer ring first).
 */
export function shellWalls(P, poly, o) {
  const edges = ringEdges(poly, o.minEdge ?? 0.3);
  for (const e of edges) {
    const st = (o.style && o.style(e)) || o.def;
    if (st === 'skip') { e.skipped = true; continue; }
    e.st = st;
    onEdge(P, e, (len) => { e.lay = bayWall(P, len, st); });
  }
  return edges;
}
/** mitred cornice ring(s) at the eave of every ring of the footprint: a corona (d, h) over a bed moulding; draw(e) === false leaves an edge out */
export function shellCornice(P, poly, eave, M, o = {}) {
  const d = o.d ?? 0.45, h = o.h ?? 0.5, mat = o.mat || M.white, rings = [poly.o, ...(o.holes === false ? [] : poly.h)];
  const E = typeof eave === 'function' ? eave : () => eave;
  for (const r of rings) {
    const es = ringEdges({ o: r, h: [] }, 0.3);
    band(P, es, (e) => E(e) - h, (e) => E(e), d, { front: mat, top: mat, under: M.soffit }, { draw: o.draw });
    band(P, es, (e) => E(e) - h - 0.32, (e) => E(e) - h, d * 0.42, { front: mat, under: M.soffit }, { draw: o.draw });
  }
}
/** plinth band round the footprint */
export function shellPlinth(P, poly, h, mat, d = 0.1, o = {}) {
  for (const r of [poly.o, ...poly.h]) { const es = ringEdges({ o: r, h: [] }, 0.3); band(P, es, 0, h, d, { front: mat, top: mat }, { draw: o.draw, uvs: o.uvs ?? 1 }); }
}
/** low hipped roof over a ring ([[x, z]..]): slopes from the eave ring to the ring inset by `inset` at eave + rise, a flat top, chimneys on the long edges of the top */
export function insetRoof(P, ring, eave, mat, o = {}) {
  const inset = o.inset ?? 3.4, rise = o.rise ?? 2.2;
  let a = 0; for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p[0] * q[1] - q[0] * p[1]; }
  const out = inflate(ring, o.over ?? 0.42), inn = inflate(ring, -inset).map((p, i) => {
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
  const c2 = inn.map((q) => new THREE.Vector2(q.p[0], q.p[1])), tris = THREE.ShapeUtils.triangulateShape(c2, []), k = P.bucket(mat), base = k.n;
  for (const q of inn) P._vert(k, q.p[0], ye + rise * q.k + 0.002, q.p[1], 0, 1, 0, q.p[0] / 0.6, q.p[1] / 0.6);
  for (const [i0, i1, i2] of tris) { const A = inn[i0].p, B = inn[i1].p, C = inn[i2].p, cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]); if (cy > 0) k.idx.push(base + i0, base + i1, base + i2); else k.idx.push(base + i0, base + i2, base + i1); P.tris++; }
  if (o.chimney) for (let i = 0; i < n; i++) {
    const A = inn[i], B = inn[(i + 1) % n]; if (A.k < 1 || B.k < 1) continue;
    const l = Math.hypot(B.p[0] - A.p[0], B.p[1] - A.p[1]); if (l < (o.chimneyMin ?? 14)) continue;
    const m = Math.floor(l / (o.chimneyStep ?? 13));
    for (let q = 0; q < m; q++) { const t = (q + 0.5) / m, x = A.p[0] + (B.p[0] - A.p[0]) * t, z = A.p[1] + (B.p[1] - A.p[1]) * t, r = Math.atan2(B.p[0] - A.p[0], B.p[1] - A.p[1]); P.push(x, 0, z, r); P.box(o.chimney, -0.45, 0.45, ye + rise - 0.3, ye + rise + 1.5, -0.7, 0.7, 'b'); P.box(o.cap || o.chimney, -0.52, 0.52, ye + rise + 1.5, ye + rise + 1.62, -0.78, 0.78, ''); P.pop(); }
  }
}
/**
 * Roof of a block with courtyards: slopes rise from the outer eave ring to the ring inset by `inset`, and from every courtyard ring to the ring grown by `inset` into the block, at
 * eave + rise; a flat top (with the grown courtyards cut out) joins them.  outer / holes = [[x, z]..].
 */
export function ringRoof(P, outer, holes, eave, mat, o = {}) {
  const inset = o.inset ?? 3.2, rise = o.rise ?? 1.8, ye = eave + 0.02, yt = ye + rise;
  const slope = (ring, d0, d1) => {
    const lo = inflate(ring, d0), hi = inflate(ring, d1), n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, A = lo[i], B = lo[j], C = hi[j], D = hi[i], l = Math.hypot(B[0] - A[0], B[1] - A[1]); if (l < 0.05) continue;
      const mx = (C[0] + D[0] - A[0] - B[0]) / 2, mz = (C[1] + D[1] - A[1] - B[1]) / 2, ml = Math.hypot(mx, mz) || 1;
      P.quad(mat, [A[0], ye, A[1]], [B[0], ye, B[1]], [C[0], yt, C[1]], [D[0], yt, D[1]], [(-mx / ml) * rise, ml, (-mz / ml) * rise], [[0, 0], [l / 0.6, 0], [l / 0.6, 6], [0, 6]]);
    }
    return hi;
  };
  const top = slope(outer, o.over ?? 0.35, -inset), cuts = holes.map((h) => slope(h, -(o.over ?? 0.35), inset));
  P.cap(mat, top, yt, true, 0.6, cuts);
}
/**
 * Hip / gable roof over the rectangle x0..x1, z0..z1 of the CURRENT frame: eaves at y, ridge along x at y + rise.  hip0 / hip1 = run of the hip at the x0 / x1 end (0 = a gable end,
 * drawn with `gable` material when given; default hip run = half the depth).  over = eaves overhang.
 */
export function hipRect(P, mat, x0, x1, z0, z1, y, rise, o = {}) {
  const ov = o.over ?? 0.35, zm = (z0 + z1) / 2, hd = (z1 - z0) / 2, h0 = o.hip0 ?? hd, h1 = o.hip1 ?? hd, a = x0 - (h0 > 0 ? ov : 0), b = x1 + (h1 > 0 ? ov : 0), c = z0 - ov, d = z1 + ov, yr = y + rise;
  const ra = x0 + h0, rb = x1 - h1, sl = Math.hypot(hd + ov, rise), seg = Math.max(1, Math.ceil((b - a) / 16));
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg, t1 = (i + 1) / seg, ea = a + (b - a) * t0, eb = a + (b - a) * t1, qa = ra + (rb - ra) * t0, qb = ra + (rb - ra) * t1;
    P.quad(mat, [ea, y, d], [eb, y, d], [qb, yr, zm], [qa, yr, zm], [0, hd, rise], [[ea / 0.6, 0], [eb / 0.6, 0], [qb / 0.6, sl / 0.6], [qa / 0.6, sl / 0.6]]);
    P.quad(mat, [eb, y, c], [ea, y, c], [qa, yr, zm], [qb, yr, zm], [0, hd, -rise], [[eb / 0.6, 0], [ea / 0.6, 0], [qa / 0.6, sl / 0.6], [qb / 0.6, sl / 0.6]]);
  }
  for (const [xe, xr, hh, s] of [[a, ra, h0, -1], [b, rb, h1, 1]]) {
    if (hh > 0) P.fan(mat, [[xe, y, s > 0 ? d : c], [xe, y, s > 0 ? c : d], [xr, yr, zm]], [s * rise, hh, 0], (p) => [p[2] / 0.6, (p[1] - y) / 0.6 * 1.4]);
    else if (o.gable) P.fan(o.gable, [[xe, y, c + ov], [xe, y, d - ov], [xe, yr - 0.05, zm]], [s, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
  }
}
/** box chimney with a cap in the current frame */
export function chimney(P, mat, cap, x, z, y0, y1, w = 0.8, d = 1.2) { P.box(mat, x - w / 2, x + w / 2, y0, y1, z - d / 2, z + d / 2, 'b'); P.box(cap, x - w / 2 - 0.08, x + w / 2 + 0.08, y1, y1 + 0.14, z - d / 2 - 0.08, z + d / 2 + 0.08, ''); }
export function shellColliders(ctx, poly, y1) { return addPolyColliders(ctx, poly, 0, y1); }
/** thin wall colliders for a list of edges (skip(e) === true leaves an edge open; y1 may be fn(e)) */
export function edgeColliders(ctx, edges, y1, skip, thick = 0.9) {
  for (const e of edges) {
    if (e.len < 0.3 || (skip && skip(e))) continue;
    const dx = e.b[0] - e.a[0], dz = e.b[1] - e.a[1];
    ctx.physics.addBox((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2, e.len + thick * 0.5, thick, Math.atan2(-dz, dx), 0, typeof y1 === 'function' ? y1(e) : y1);
  }
}
/** the edge of `edges` nearest to the segment (ax,az)-(bx,bz) (both ends within tol) */
export function edgeNear(edges, ax, az, bx, bz, tol = 1.5) {
  const d = (p, x, z) => Math.hypot(p[0] - x, p[1] - z);
  return edges.find((e) => (d(e.a, ax, az) < tol && d(e.b, bx, bz) < tol) || (d(e.a, bx, bz) < tol && d(e.b, ax, az) < tol)) || null;
}
/**
 * A balustrade run in the current facade frame from x0 to x1 at depth z, base y: plinth, cut-out balusters (M.balus), rail, pedestals at both ends and every `step`;
 * panel = material of a solid panel in the middle third (the Kunstkamera attic), or null.
 */
export function balustrade(P, M, x0, x1, y, z, o = {}) {
  const h = o.h ?? 1.3, t = o.t ?? 0.34, ped = o.ped ?? 0.7, mat = o.mat || M.white, len = x1 - x0;
  P.box(mat, x0, x1, y, y + 0.22, z - t / 2, z + t / 2, 'b'); P.box(mat, x0, x1, y + h - 0.18, y + h, z - t / 2 - 0.03, z + t / 2 + 0.03, '');
  const n = Math.max(1, Math.round(len / (o.step ?? 5.2))), xs = []; for (let i = 0; i <= n; i++) xs.push(x0 + (len * i) / n);
  for (const x of xs) { const a = Math.max(x0, x - ped / 2), b = Math.min(x1, x + ped / 2); P.box(mat, a, b, y + 0.22, y + h - 0.18, z - t / 2 - 0.02, z + t / 2 + 0.02, 'tb'); }
  for (let i = 0; i < n; i++) {
    let a = xs[i] + ped / 2, b = xs[i + 1] - ped / 2; if (b - a < 0.3) continue;
    if (o.panel && n >= 3 && i === Math.floor(n / 2)) { P.box(o.panel, a, b, y + 0.22, y + h - 0.18, z - t / 2 + 0.04, z + t / 2 - 0.04, 'tb'); continue; }
    const k = Math.max(1, Math.round((b - a) / 0.36));
    P.quad(M.balus, [a, y + 0.22, z], [b, y + 0.22, z], [b, y + h - 0.18, z], [a, y + h - 0.18, z], [0, 0, 1], [[0, 0], [k, 0], [k, 1], [0, 1]]);
  }
}
/** a body of revolution with n flat facets (an octagonal tier / dome): profile [[r, y]..] where r = the APOTHEM (across flats / 2); rot0 turns the first corner; flat shaded */
export function prism(P, mat, cx, cz, profile, n = 8, rot0 = Math.PI / 8, uvf) {
  const k = 1 / Math.cos(Math.PI / n);
  for (let s = 0; s < n; s++) {
    const a0 = rot0 + (s * 2 * Math.PI) / n, a1 = rot0 + ((s + 1) * 2 * Math.PI) / n, am = (a0 + a1) / 2;
    for (let i = 0; i + 1 < profile.length; i++) {
      const [r0, y0] = profile[i], [r1, y1] = profile[i + 1]; if (Math.abs(y1 - y0) < 1e-4 && Math.abs(r1 - r0) < 1e-4) continue;
      const p = (r, y, a) => [cx + Math.sin(a) * r * k, y, cz + Math.cos(a) * r * k], sl = Math.hypot(r1 - r0, y1 - y0) || 1, ny = (r0 - r1) / sl, nh = (y1 - y0) / sl;
      const uv = uvf ? uvf(s, i, y0, y1) : [[0, y0 / 3], [1, y0 / 3], [1, y1 / 3], [0, y1 / 3]];
      // viewed from outside the facet runs from a0 (left) to a1 (right): angles grow from +z toward +x
      P.quad(mat, p(r0, y0, a0), p(r0, y0, a1), p(r1, y1, a1), p(r1, y1, a0), [Math.sin(am) * nh, ny, Math.cos(am) * nh], uv);
    }
  }
}
export { ringFromFlat };
