// landmarksPetrovskyStadium/field.js - the arena floor and the paved apron of the Petrovsky stadium.
//   track   the red running track fills the whole ring inside the barrier wall (the inner ring of the stations), y 0.10; the infield (a 400 m track kerb: 84.4 m straights, radius 36.5 m) is mown turf,
//           y 0.13; eight lanes of 1.22 m are marked by nine concentric white lines (y 0.15); the football pitch r4588176 (104.9 x 68 m, the real OSM rectangle) with its markings lies on top, y 0.16
//   apron   the concrete plateau of the island tip between the colonnade and the bank (the cut of relation r1576109 in frame.js TIP, pulled 0.7 m off the water line) with the gallery floor, y 0.07
//           (the generic ground stays below it; one cap, subdivided to <= 24 m so that the depth interpolation stays exact near the camera).
import * as THREE from 'three';
import { bowl, pitchFrame, TIP, GAL, Y, offsetRing, ringOf } from './frame.js';
import * as L from '../layout.js';

/** a horizontal polygon (ring, holes) at height y with world uv, split until no edge is longer than maxEdge.  Road clipping (road integrity rules: nothing is paved over a carriageway):
 *  o.skip(x, z) = on asphalt, o.near(x, z, r) = a drivable road within r m.  Triangles near a road shrink to 3 m, the ones that straddle the asphalt edge (their 7 sample points disagree) shrink to `fine` (0.5 m);
 *  a triangle with every sample on asphalt (or, at the finest size, a centre on asphalt) is dropped. */
export function fillFine(P, mat, ring, y, o = {}) {
  const maxEdge = o.maxEdge ?? 24, tile = o.tile ?? 8, holes = o.holes || [], fine = o.fine ?? 0.5;
  const c2 = ring.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
  const all = ring.concat(...holes), tris = THREE.ShapeUtils.triangulateShape(c2, h2);
  const samples = (A, B, C) => [A, B, C, [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3], [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2], [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2]];
  const emit = (A, B, C, depth) => {
    const lab = Math.hypot(B[0] - A[0], B[1] - A[1]), lbc = Math.hypot(C[0] - B[0], C[1] - B[1]), lca = Math.hypot(A[0] - C[0], A[1] - C[1]), mx = Math.max(lab, lbc, lca);
    let n = 0;
    if (o.skip && mx < 40) { const sm = samples(A, B, C); for (const p of sm) if (o.skip(p[0], p[1])) n++; if (n === sm.length) return; }                  // all on asphalt: dropped
    const mixed = o.skip && n > 0, split = mx > maxEdge || (o.near && mx > 3 && o.near((A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, 1.2 + mx * 0.5)) || (mixed && mx > fine);
    if (depth < 14 && split) {
      if (lab >= lbc && lab >= lca) { const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; emit(A, m, C, depth + 1); emit(m, B, C, depth + 1); }
      else if (lbc >= lca) { const m = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]; emit(A, B, m, depth + 1); emit(A, m, C, depth + 1); }
      else { const m = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2]; emit(A, B, m, depth + 1); emit(m, B, C, depth + 1); }
      return;
    }
    if (mixed && o.skip((A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3)) return;                                                          // the finest straddling triangles: by their centre
    const cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]), t = cy > 0 ? [A, B, C] : [A, C, B], k = P.bucket(mat), base = k.n;
    for (const p of t) P._vert(k, p[0], y, p[1], 0, 1, 0, p[0] / tile, p[1] / tile);
    k.idx.push(base, base + 1, base + 2); P.tris++;
  };
  for (const [a, b, c] of tris) emit(all[a], all[b], all[c], 0);
}

/** distance from a point to the closed ring */
export function distRing(r, x, z) { let d = 1e9; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length], dx = q[0] - p[0], dz = q[1] - p[1], t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / (dx * dx + dz * dz || 1))); d = Math.min(d, Math.hypot(x - p[0] - dx * t, z - p[1] - dz * t)); } return d; }
/** point in ring */
export function inRing(r, x, z) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; }

/** the frame of an athletics track inside `ring` ([[x, z]..], the outer edge of the track): axes along / across the pitch, centre = the middle of the ring's extent, half lengths */
export function ovalFrame(ring, pc, ux, uz) {
  const vx = -uz, vz = ux; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (const q of ring) { const du = (q[0] - pc[0]) * ux + (q[1] - pc[1]) * uz, dv = (q[0] - pc[0]) * vx + (q[1] - pc[1]) * vz; u0 = Math.min(u0, du); u1 = Math.max(u1, du); v0 = Math.min(v0, dv); v1 = Math.max(v1, dv); }
  let cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  // the width / length are taken ON the middle lines (the OSM rings have small notches and bumps at their extremes)
  const cross = (axis, c) => { const out = []; for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length], f = (w) => (axis === 0 ? (w[0] - pc[0]) * ux + (w[1] - pc[1]) * uz : (w[0] - pc[0]) * vx + (w[1] - pc[1]) * vz), g = (w) => (axis === 0 ? (w[0] - pc[0]) * vx + (w[1] - pc[1]) * vz : (w[0] - pc[0]) * ux + (w[1] - pc[1]) * uz); if ((f(p) - c) * (f(q) - c) <= 0 && f(p) !== f(q)) out.push(g(p) + (g(q) - g(p)) * (c - f(p)) / (f(q) - f(p))); } return out; };
  const vs = cross(0, cu), us = cross(1, cv);
  if (vs.length >= 2) { const lo = Math.min(...vs), hi = Math.max(...vs); cv = (lo + hi) / 2; v0 = lo; v1 = hi; }
  if (us.length >= 2) { const lo = Math.min(...us), hi = Math.max(...us); cu = (lo + hi) / 2; u0 = lo; u1 = hi; }
  const half = (u1 - u0) / 2, halfV = (v1 - v0) / 2, R = halfV - 8 * 1.22 - 2.3;                                               // eight lanes of 1.22 m outside the inner kerb of radius R (the football pitch, 68 m wide, fits inside)
  return { cx: pc[0] + ux * cu + vx * cv, cz: pc[1] + uz * cu + vz * cv, ux, uz, vx, vz, half, halfV, R, A: Math.max(10, half - R - 8 * 1.22 - 0.5), ring };
}
/** the main stadium's track frame */
export function trackFrame() {
  const B = bowl(), pf = pitchFrame(); if (!B || !pf) return null;
  const inner = []; for (let k = 0; k < B.N; k++) { const q = B.at(k, B.st[k].D, 0); inner.push([q[0], q[2]]); }
  return { ...ovalFrame(inner, pf.c, pf.ux, pf.uz), pf };
}
/** a "stadium" curve (two straights of half length a and two semicircles of radius r) as points, in a track frame */
export function stadiumRing(F, a, r, n = 40) {
  const pts = [], at = (x, v) => [F.cx + F.ux * x + F.vx * v, F.cz + F.uz * x + F.vz * v];
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + Math.PI * i / n; pts.push(at(a + Math.cos(t) * r, Math.sin(t) * r)); }
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + Math.PI * i / n; pts.push(at(-a + Math.cos(t) * r, Math.sin(t) * r)); }
  return pts;
}
/** the infield turf and the nine lane lines of a track frame at the heights of Y */
export function lanes(P, M, F) {
  fillFine(P, M.turf, stadiumRing(F, F.A, F.R, 30), Y.infield, { tile: 8, maxEdge: 20 });
  for (let i = 0; i <= 8; i++) {
    const r0 = F.R + 1.22 * i - 0.035, r1 = F.R + 1.22 * i + 0.035, a = stadiumRing(F, F.A, r0, 40), b = stadiumRing(F, F.A, r1, 40), n = a.length;
    for (let j = 0; j < n; j++) { const k = (j + 1) % n; if (F.ring && (!inRing(F.ring, a[j][0], a[j][1]) || distRing(F.ring, a[j][0], a[j][1]) < 0.25 || !inRing(F.ring, b[j][0], b[j][1]) || distRing(F.ring, b[j][0], b[j][1]) < 0.25)) continue; P.quad(M.lane, [a[j][0], Y.infield + 0.02, a[j][1]], [b[j][0], Y.infield + 0.02, b[j][1]], [b[k][0], Y.infield + 0.02, b[k][1]], [a[k][0], Y.infield + 0.02, a[k][1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
  }
}

export function field(P, M) {
  const B = bowl(), F = trackFrame(); if (!B || !F) return;
  const inner = []; for (let k = 0; k < B.N; k++) { const q = B.at(k, B.st[k].D, 0); inner.push([q[0], q[2]]); }
  fillFine(P, M.track, inner, Y.track, { tile: 8, maxEdge: 20 });
  lanes(P, M, F);
  // the football pitch with its markings (the OSM rectangle r4588176)
  const pf = F.pf, hl = pf.len / 2, hw = pf.wid / 2, c = (u, v) => [pf.c[0] + pf.ux * u + pf.vx * v, Y.pitch, pf.c[1] + pf.uz * u + pf.vz * v];
  P.quad(M.pitch, c(-hl, -hw), c(hl, -hw), c(hl, hw), c(-hl, hw), [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

/** the road tests of the paving: on(x, z) = on real asphalt (streets' net.cover, road integrity rules of docs/AGENT-BRIEF.md), near(x, z, r) = a drivable road within r m of its edge */
export function roadClip(ctx) {
  const net = ctx && ctx.services && ctx.services.streets && ctx.services.streets.net;
  return { on: net && net.cover ? (x, z) => net.cover(x, z, {}) > -0.2 : (x, z) => L.isOnRoad(x, z, 0.2), near: (x, z, r) => L.isOnRoad(x, z, r) };
}
/** the paved apron + gallery floor. holes: extra rings (building footprints) left out. Returns { ring, hole } */
export function apron(P, M, extraHoles = [], clip = null) {
  const B = bowl(); if (!B) return null;
  const ring = offsetRing(TIP, -0.7), hole = []; for (let k = 0; k < B.N; k++) { const q = B.at(k, GAL, 0); hole.push([q[0], q[2]]); }
  const holes = [hole, ...extraHoles.filter((h) => h.every((p) => inRing(ring, p[0], p[1])))];
  fillFine(P, M.apron, ring, Y.floor, { holes, tile: 8, maxEdge: 24, near: clip && clip.near, skip: clip && clip.on });
  return { ring, hole };
}
/** the parking bays at the south-west end of the apron (s01: three groups of angled white bays beside the quay): 7 lines + a base line either side of a 6 m aisle */
export function parking(P, M, clip = null) {
  const A = TIP[11], Bq = TIP[10], dx = Bq[0] - A[0], dz = Bq[1] - A[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l, B = bowl();
  let nx = -uz, nz = ux; if (nx * (B.c[0] - A[0]) + nz * (B.c[1] - A[1]) < 0) { nx = -nx; nz = -nz; }
  const W = (u, v) => [A[0] + ux * u + nx * v, A[1] + uz * u + nz * v], y = Y.floor + 0.012, line = (a, b, w = 0.12) => { if (clip && (clip.on(a[0], a[1]) || clip.on(b[0], b[1]) || clip.on((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))) return; const px = -(b[1] - a[1]), pz = b[0] - a[0], pl = Math.hypot(px, pz) || 1, ox = px / pl * w / 2, oz = pz / pl * w / 2; P.quad(M.lane, [a[0] + ox, y, a[1] + oz], [b[0] + ox, y, b[1] + oz], [b[0] - ox, y, b[1] - oz], [a[0] - ox, y, a[1] - oz], [0, 1, 0]); };
  for (let i = 0; i <= 7; i++) { const u = 12 + i * 2.6; line(W(u, 2.2), W(u + 1.8, 7.2)); line(W(u, 13.2), W(u + 1.8, 8.2)); }       // angled bays 5 m deep on both sides of the aisle
  line(W(12, 2.2), W(12 + 7 * 2.6 + 0, 2.2)); line(W(12, 13.2), W(12 + 7 * 2.6, 13.2));
}
export { ringOf };
