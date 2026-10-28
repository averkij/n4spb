// landmarksModernVO/bay.js - bays, oriels and tower shafts built from a PLAN CHAIN: every planar face of the chain is a windowed wall (wallx.winWall) in its own face frame, the soffit and the top are closed with
// polygon caps, so a bay is one closed solid (docs/research/modernvo.md 14.2: nothing can be looked through from the street or from the roof).
//   bay(P, o)      o: { chain: [[x, z]..] plan points from the left wall point to the right one (z >= 0 = out of the wall, in the CURRENT frame), y0, y1, mat: { mat, tu, tv }, bands (instead of mat: a band list),
//                       wins: (i, len, f) => [windows in face coordinates (x along the face from its start, y absolute)], reveal, glass, depth, soffit: mat, top: mat, closeEnds: bool }
//   arcChain(cx, R, p, n)   a circular segment of radius R projecting p from the wall, centred on u = cx, as n facets with relative angular sizes `parts` (default equal)
//   cantedChain(cx, wc, wo, p)   the three-faced bay: centre face wc wide at projection p, two oblique faces of length wo going back to the wall
//   hipOver(P, mat, ring, y, rise, o)  a pyramid over a plan ring (list of [x, z]);  pyramid / cone / dome helpers use loft() of wallx.js
import { winWall, loft } from './wallx.js';

/** run fn(len) in the frame of the plan segment A -> B (local +x along it, +z the outward normal for a chain that runs left to right in front of the wall) */
export function onSeg(P, A, B, fn) {
  const dx = B[0] - A[0], dz = B[1] - A[1], len = Math.hypot(dx, dz);
  const nx = -dz / len, nz = dx / len, rot = Math.atan2(nx, nz);
  P.push(A[0], 0, A[1], rot);
  try { return fn(len, [nx, nz]); } finally { P.pop(); }
}

export function bay(P, o) {
  const ch = o.chain, y0 = o.y0, y1 = o.y1, bands = o.bands || [{ y0, y1, mat: o.mat.mat, tu: o.mat.tu, tv: o.mat.tv }];
  for (let i = 0; i + 1 < ch.length; i++) {
    onSeg(P, ch[i], ch[i + 1], (len, n) => {
      const wins = o.wins ? o.wins(i, len, n) || [] : [];
      winWall(P, { x0: 0, x1: len, z: 0, bands, wins, reveal: o.reveal, glass: o.glass, depth: o.depth ?? 0.16 });
    });
  }
  if (o.closeEnds) for (const [a, b] of [[ch[0], [ch[0][0], 0]], [[ch[ch.length - 1][0], 0], ch[ch.length - 1]]]) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.02) continue;
    onSeg(P, a, b, (l) => winWall(P, { x0: 0, x1: l, z: 0, bands, wins: [] }));
  }
  const poly = ch.map((p) => [p[0], p[1]]);
  if (o.soffit) P.cap(o.soffit, poly, y0, false, 2);
  if (o.top) P.cap(o.top, poly, y1, true, 2);
}

/** facets of a circular segment: radius R projecting p from the wall (p < R), centred at u = cx; `parts` = relative angular sizes (left to right) */
export function arcChain(cx, R, p, parts = [1, 1, 1, 1]) {
  const cosH = (R - p) / R, half = Math.acos(cosH), zc = -R * cosH, tot = parts.reduce((s, v) => s + v, 0);
  const pts = []; let a = -half;
  pts.push([cx + R * Math.sin(a), zc + R * Math.cos(a)]);
  for (const q of parts) { a += 2 * half * q / tot; pts.push([cx + R * Math.sin(a), zc + R * Math.cos(a)]); }
  pts[0][1] = 0; pts[pts.length - 1][1] = 0;
  return pts;
}
/** three-faced bay: centre face wc wide at projection p, the two oblique faces go back to the wall (their length follows from p and the angle `deg`, default 60) */
export function cantedChain(cx, wc, p, deg = 60) {
  const t = deg * Math.PI / 180, dx = p / Math.tan(t);
  return [[cx - wc / 2 - dx, 0], [cx - wc / 2, p], [cx + wc / 2, p], [cx + wc / 2 + dx, 0]];
}
/** a regular n-gon plan ring around (cx, cz): radius r, first vertex angle a0 (x = sin, z = cos) */
export function polyRing(n, r, cx = 0, cz = 0, a0 = 0) { return Array.from({ length: n }, (_, i) => { const a = a0 + Math.PI * 2 * i / n; return [cx + r * Math.sin(a), cz + r * Math.cos(a)]; }); }

/** a pyramid / hip over a plan ring: base ring at y (overhang `over` m outwards), apex ring scaled by `top` about the centroid at y + rise; closed with a top cap when top > 0 */
export function hipOver(P, mat, ring, y, rise, o = {}) {
  const n = ring.length, cx = ring.reduce((s, p) => s + p[0], 0) / n, cz = ring.reduce((s, p) => s + p[1], 0) / n, over = o.over ?? 0.15, top = o.top ?? 0;
  const out = (k) => ring.map((p) => { const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1; return [cx + dx * k + dx / l * over * (k > 0.5 ? 1 : 0), cz + dz * k + dz / l * over * (k > 0.5 ? 1 : 0)]; });
  const r0 = out(1).map((p) => [p[0], y, p[1]]), r1 = out(top).map((p) => [p[0], y + rise, p[1]]);
  loft(P, mat, [r0, r1], { ax: [cx, cz], capTop: top > 0 ? o.capMat || mat : null, uRep: o.uRep ?? 1, vTile: o.vTile ?? 1 });
  if (o.under) P.fan(o.under, r0.map((p) => p).reverse(), [0, -1, 0]);
}
