// landmarksMakarova/facade.js - the wall vocabulary of the module (all pieces are drawn in the CURRENT Parts frame of a wall: local +x runs along the wall to the RIGHT as seen from outside, y up, +z points OUT):
//   wallFrame(P, A, B, n)   push the frame of the wall A -> B (world points) with outward normal n; returns { len, o, xa }
//   wallHoles(P, o)         a wall field x0..x1, y0..y1 at z = 0 facing +z with OPENINGS cut out (a Shape with holes): kinds rect, arch (round head), half (a half disc), goth (an equilateral pointed arch),
//                           round (a circle); real reveals and a glass pane set back
//   cornice(P, ...)         the three-step cornice (architrave band, frieze, corona + modillion row), crown at yb + 1.2
//   pilaster / column       the Corinthian / Doric / Tuscan vocabulary (base, shaft, capital) as small geometry
//   lathe(P, ...)           a surface of revolution (drum, dome, spire) with uv repeated around
//   gable / hipRect         roof pieces
// Every function only pushes geometry through the Parts collector (kit.js); materials come from mats.js.
import * as THREE from 'three';

/** push the frame of a wall from world point A to B whose outward normal is n = [nx, nz]; local +x = (nz, -nx), local +z = n.  The origin is the end with the smaller coordinate along +x. */
export function wallFrame(P, A, B, n) {
  const xa = [n[1], -n[0]], tA = A[0] * xa[0] + A[1] * xa[1], tB = B[0] * xa[0] + B[1] * xa[1];
  const o = tA <= tB ? A : B;
  P.push(o[0], 0, o[1], Math.atan2(n[0], n[1]));
  return { len: Math.abs(tB - tA), o, xa };
}

// ------------------------------------------------------------------------------------------------ openings
const isCurved = (k) => k === 'arch' || k === 'half' || k === 'goth';
/** the y of the spring line of a curved opening */
const springY = (op) => (op.kind === 'half' ? op.y0 : op.y0 + op.h);
/** the top of an opening */
export function opTop(op) {
  const w = op.w;
  return op.kind === 'arch' ? op.y0 + op.h + w / 2 : op.kind === 'half' ? op.y0 + w / 2 : op.kind === 'goth' ? op.y0 + op.h + w * 0.866 : op.kind === 'round' ? op.y0 + w : op.y0 + op.h;
}
/** points of the curved head of an opening, LEFT spring to RIGHT spring: [[x, y], ...] (n + 1 points; goth: 2 x n/2 points through the apex) */
export function headPts(op, n = 10) {
  const r = op.w / 2, yS = springY(op), out = [];
  if (op.kind === 'goth') {                                  // two arcs of radius w, centred on the opposite spring points (equilateral pointed arch), apex at 0.866 w
    const m = Math.max(2, Math.round(n / 2));
    for (let i = 0; i <= m; i++) { const t = Math.PI - (Math.PI / 3) * i / m; out.push([op.x + r + Math.cos(t) * op.w, yS + Math.sin(t) * op.w]); }
    for (let i = 1; i <= m; i++) { const t = (Math.PI / 3) * (1 - i / m); out.push([op.x - r + Math.cos(t) * op.w, yS + Math.sin(t) * op.w]); }
  } else for (let i = 0; i <= n; i++) { const t = Math.PI - Math.PI * i / n; out.push([op.x + Math.cos(t) * r, yS + Math.sin(t) * r]); }
  return out;
}
/** the 2D path of one opening as a HOLE (clockwise) */
function holePath(op, n) {
  const p = new THREE.Path(), x = op.x, y = op.y0, r = op.w / 2;
  if (op.kind === 'round') { p.absarc(x, y + r, r, 0, Math.PI * 2, true); return p; }
  if (isCurved(op.kind)) {
    const pts = headPts(op, n), yS = springY(op);
    p.moveTo(x - r, y); p.lineTo(x - r, yS); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.lineTo(x + r, y); p.lineTo(x - r, y);
  } else { p.moveTo(x - r, y); p.lineTo(x - r, y + op.h); p.lineTo(x + r, y + op.h); p.lineTo(x + r, y); p.lineTo(x - r, y); }
  return p;
}
/** the closed outline of an opening as a Shape (counter clockwise: for the glass pane) */
function holeShape(op, n) {
  const s = new THREE.Shape(), x = op.x, y = op.y0, r = op.w / 2;
  if (op.kind === 'round') { s.absarc(x, y + r, r, 0, Math.PI * 2, false); return s; }
  if (isCurved(op.kind)) {
    const pts = headPts(op, n), yS = springY(op);
    s.moveTo(x - r, y); s.lineTo(x + r, y); s.lineTo(x + r, yS); for (let i = pts.length - 2; i >= 0; i--) s.lineTo(pts[i][0], pts[i][1]); s.lineTo(x - r, y);
  } else { s.moveTo(x - r, y); s.lineTo(x + r, y); s.lineTo(x + r, y + op.h); s.lineTo(x - r, y + op.h); s.lineTo(x - r, y); }
  return s;
}
/** a flat Shape drawn facing +z at depth z, uv = position / uvs (isotropic tile) */
export function shapeFace(P, mat, shape, z, uvs = 4, seg = 10) {
  const g = new THREE.ShapeGeometry(shape, seg), ua = g.attributes.uv, pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i) / uvs, pa.getY(i) / uvs);
  P.geo(mat, g, 0, 0, z); g.dispose();
}
/**
 * wall field with openings.  o: { mat, x0, x1, y0, y1, uvs = 4, ops: [{ x, y0, w, h, kind, glass: material | null, depth?, sill? }], reveal: material, depth = 0.25, segs = 8 }
 * kind: 'rect' (w x h), 'arch' (straight part h, a semicircle w / 2 on top), 'half' (a half disc of radius w / 2 standing on y0), 'goth' (straight part h, an equilateral pointed arch on top: apex 0.866 w), 'round' (a circle of diameter w).
 * The openings must stay inside the field (not touching its boundary) and must not overlap.  The reveals have the `reveal` material (the wall's own when omitted); `glass` is set back by `depth`.
 */
export function wallHoles(P, o) {
  const uvs = o.uvs ?? 4, depth = o.depth ?? 0.25, ops = o.ops || [], rv = o.reveal || o.mat, seg = o.segs ?? 8;
  const s = new THREE.Shape();
  s.moveTo(o.x0, o.y0); s.lineTo(o.x1, o.y0); s.lineTo(o.x1, o.y1); s.lineTo(o.x0, o.y1); s.lineTo(o.x0, o.y0);
  for (const op of ops) s.holes.push(holePath(op, seg));
  shapeFace(P, o.mat, s, 0, uvs, seg);
  for (const op of ops) {
    const xa = op.x - op.w / 2, xb = op.x + op.w / 2, ya = op.y0, zb = -(op.depth ?? depth), kind = op.kind || 'rect';
    if (kind === 'round') {
      const r = op.w / 2, cy = ya + r, n = 16;
      for (let i = 0; i < n; i++) {
        const a0 = Math.PI * 2 * i / n, a1 = Math.PI * 2 * (i + 1) / n, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        P.quad(rv, [op.x + c0 * r, cy + s0 * r, 0], [op.x + c0 * r, cy + s0 * r, zb], [op.x + c1 * r, cy + s1 * r, zb], [op.x + c1 * r, cy + s1 * r, 0], [-(c0 + c1), -(s0 + s1), 0]);
      }
    } else if (isCurved(kind)) {
      const yS = springY(op), pts = headPts(op, seg), cx = op.x;
      if (kind !== 'half') {
        P.quad(rv, [xa, ya, 0], [xa, ya, zb], [xa, yS, zb], [xa, yS, 0], [1, 0, 0]);
        P.quad(rv, [xb, ya, zb], [xb, ya, 0], [xb, yS, 0], [xb, yS, zb], [-1, 0, 0]);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        P.quad(rv, [a[0], a[1], 0], [a[0], a[1], zb], [b[0], b[1], zb], [b[0], b[1], 0], [cx - (a[0] + b[0]) / 2, yS - (a[1] + b[1]) / 2 + 0.01, 0]);
      }
      if (kind === 'half' || op.sill !== false) P.quad(rv, [xa, ya, 0], [xb, ya, 0], [xb, ya, zb], [xa, ya, zb], [0, 1, 0]);
    } else {
      const yb = ya + op.h;
      P.quad(rv, [xa, ya, 0], [xa, ya, zb], [xa, yb, zb], [xa, yb, 0], [1, 0, 0]);
      P.quad(rv, [xb, ya, zb], [xb, ya, 0], [xb, yb, 0], [xb, yb, zb], [-1, 0, 0]);
      P.quad(rv, [xa, yb, zb], [xb, yb, zb], [xb, yb, 0], [xa, yb, 0], [0, -1, 0]);
      if (op.sill !== false) P.quad(rv, [xa, ya, 0], [xb, ya, 0], [xb, ya, zb], [xa, ya, zb], [0, 1, 0]);
    }
    if (op.glass) {
      if (kind === 'rect') P.quad(op.glass, [xa, ya, zb], [xb, ya, zb], [xb, ya + op.h, zb], [xa, ya + op.h, zb], [0, 0, 1], op.uv || [[0, 0], [1, 0], [1, 1], [0, 1]]);
      else {
        const g = new THREE.ShapeGeometry(holeShape(op, seg), seg), ua = g.attributes.uv, pa = g.attributes.position, hh = opTop(op) - ya;
        for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) - xa) / op.w, (pa.getY(i) - ya) / hh);
        P.geo(op.glass, g, 0, 0, zb); g.dispose();
      }
    }
  }
}

/** the three-step cornice of a wall piece x0..x1 at the wall plane z0, base at yb, crown at yb + 1.2 (projecting up to 0.9 m); the modillion row under the corona. `shade` = the frieze material */
export function cornice(P, mat, shade, x0, x1, z0, yb, o = {}) {
  const e0 = o.e0 ?? 0.3, e1 = o.e1 ?? 0.3, pr = o.proj ?? 1, nm = o.modillions ?? true;
  P.box(mat, x0 - e0 / 3, x1 + e1 / 3, yb, yb + 0.4, z0, z0 + 0.45 * pr, 'k', 2);
  P.box(shade, x0 - e0 / 2, x1 + e1 / 2, yb + 0.4, yb + 0.72, z0, z0 + 0.4 * pr, 'bk', 2);
  P.box(mat, x0 - e0, x1 + e1, yb + 0.72, yb + 1.2, z0, z0 + 0.9 * pr, 'k', 2);
  if (nm) { const n = Math.max(1, Math.floor((x1 - x0) / 0.7)); for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * (x1 - x0) / n; P.box(mat, x - 0.11, x + 0.11, yb + 0.5, yb + 0.76, z0 + 0.38 * pr, z0 + 0.66 * pr, 'bk', 1); } }
}

/** a Corinthian-ish column standing at (x, z): base block + torus-like plinth, shaft (seg sides), capital (frustum + abacus).  r = shaft radius, y0..y1 = base .. top of the capital */
export function column(P, mats, x, z, y0, y1, r, o = {}) {
  const seg = o.seg ?? 12, capH = o.capH ?? r * 1.5, baseH = o.baseH ?? r * 0.7, shaft = mats.shaft || mats.wall, cap = mats.cap || shaft;
  P.cyl(shaft, [x, y0, z], [x, y0 + baseH, z], r * 1.25, r * 1.1, seg, true);
  P.cyl(shaft, [x, y0 + baseH, z], [x, y1 - capH, z], r, r * 0.88, seg, false);
  P.cyl(cap, [x, y1 - capH, z], [x, y1 - capH * 0.35, z], r * 0.92, r * 1.18, seg, false);
  P.box(cap, x - r * 1.3, x + r * 1.3, y1 - capH * 0.35, y1, z - r * 1.3, z + r * 1.3, '', 1);
}

/** a pilaster on a wall (frame of the wall: z out): shaft w wide, proj deep from y0 to y1 with a capital block of height capH */
export function pilaster(P, mat, x, w, y0, y1, proj = 0.2, o = {}) {
  const capH = o.capH ?? 1.0, baseH = o.baseH ?? 0.5, z0 = o.z0 ?? 0;
  P.box(mat, x - w / 2, x + w / 2, y0 + baseH, y1 - capH, z0, z0 + proj, 'bk', 1);
  P.box(mat, x - w / 2 - 0.08, x + w / 2 + 0.08, y0, y0 + baseH, z0, z0 + proj + 0.06, 'k', 1);
  P.box(mat, x - w / 2 - 0.06, x + w / 2 + 0.06, y1 - capH, y1 - capH * 0.35, z0, z0 + proj + 0.04, 'k', 1);
  P.box(mat, x - w / 2 - 0.14, x + w / 2 + 0.14, y1 - capH * 0.35, y1, z0, z0 + proj + 0.1, 'k', 1);
}

/** surface of revolution about the vertical axis through (cx, cz): profile [[r, y], ...] bottom to top; seg sides; uv u = angle * uRep, v = (y - vOff) / vTile; flip = inward normals */
export function lathe(P, mat, profile, seg, cx, cz, uRep = 1, vTile = 4, flip = false, vOff = 0) {
  const pts = profile.map((p) => new THREE.Vector2(p[0], p[1]));
  const g = new THREE.LatheGeometry(flip ? pts.slice().reverse() : pts, seg);
  const ua = g.attributes.uv, pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, ua.getX(i) * uRep, (pa.getY(i) - vOff) / vTile);
  P.geo(mat, g, cx, 0, cz); g.dispose();
}

/** a hip roof over the rectangle x0..x1 by z0..z1 (x the longer side): eaves at y with an overhang, the ridge at y + rise inset by the half width; falls back to a pyramid for a square */
export function hipRect(P, mat, x0, x1, z0, z1, y, rise, ov = 0.3) {
  const w = z1 - z0, hw = w / 2, zm = (z0 + z1) / 2, rx = Math.min(hw, (x1 - x0) / 2), ra = x0 + rx, rb = x1 - rx, up = rise / hw, sl = Math.hypot(1, up), dy = up * ov;
  const A = [x0 - ov, y - dy, z0 - ov], B = [x1 + ov, y - dy, z0 - ov], C = [x1 + ov, y - dy, z1 + ov], D = [x0 - ov, y - dy, z1 + ov];
  const uv = (a) => [a[0] / 2.4, a[2] / 2.4];
  P.quad(mat, A, B, [rb, y + rise, zm], [ra, y + rise, zm], [0, 1 / sl, -up / sl], [uv(A), uv(B), [rb / 2.4, zm / 2.4 + rise / 2], [ra / 2.4, zm / 2.4 + rise / 2]]);
  P.quad(mat, C, D, [ra, y + rise, zm], [rb, y + rise, zm], [0, 1 / sl, up / sl], [uv(C), uv(D), [ra / 2.4, zm / 2.4 + rise / 2], [rb / 2.4, zm / 2.4 + rise / 2]]);
  P.fan(mat, [D, A, [ra, y + rise, zm]], [-up / sl, 1 / sl, 0], (p) => [p[2] / 2.4, p[0] / 2.4 + p[1] / 2]);
  P.fan(mat, [B, C, [rb, y + rise, zm]], [up / sl, 1 / sl, 0], (p) => [p[2] / 2.4, p[0] / 2.4 + p[1] / 2]);
}

/** a gable roof over the rectangle x0..x1 (along the ridge) by z0..z1: eaves at y, ridge at y + rise; the ridge runs along x.  Slopes + the two gable triangles (optional) */
export function gable(P, mats, x0, x1, z0, z1, y, rise, o = {}) {
  const zm = (z0 + z1) / 2, ov = o.overhang ?? 0.3, a = o.slope || mats.roof, up = rise / ((z1 - z0) / 2), sl = Math.hypot(1, up);
  const ex0 = x0 - (o.gableEnds ? 0.15 : ov), ex1 = x1 + (o.gableEnds ? 0.15 : ov);
  P.quad(a, [ex0, y - up * ov, z0 - ov], [ex1, y - up * ov, z0 - ov], [ex1, y + rise, zm], [ex0, y + rise, zm], [0, 1 / sl, -up / sl], [[ex0 / 2, 0], [ex1 / 2, 0], [ex1 / 2, (rise + up * ov) / 0.8 * 0.5], [ex0 / 2, (rise + up * ov) / 0.8 * 0.5]]);
  P.quad(a, [ex1, y - up * ov, z1 + ov], [ex0, y - up * ov, z1 + ov], [ex0, y + rise, zm], [ex1, y + rise, zm], [0, 1 / sl, up / sl], [[ex1 / 2, 0], [ex0 / 2, 0], [ex0 / 2, (rise + up * ov) / 0.8 * 0.5], [ex1 / 2, (rise + up * ov) / 0.8 * 0.5]]);
  if (o.wall) {                                                                 // gable triangles in the wall material
    P.fan(o.wall, [[x0, y, z0], [x0, y, z1], [x0, y + rise, zm]], [-1, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
    P.fan(o.wall, [[x1, y, z1], [x1, y, z0], [x1, y + rise, zm]], [1, 0, 0], (p) => [p[2] / 3, p[1] / 3]);
  }
}
