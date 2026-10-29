// landmarksSredny/wall.js - wall-with-openings generator and the small trim pieces shared by every building of the module (the technique of landmarksNavalCorps/facade.js, extended with arched openings).
// Everything is drawn in the CURRENT Parts frame of a wall: local +x runs along the wall to the right as seen from outside, y is up, +z points OUT of the wall.
//   wallFace(P, mat, outline, ops, o)  a wall polygon (any outline, e.g. a stepped gable) with OPENINGS cut out as real holes: every op = { c: contour [[x, y]..] (rectC / archC / segC), glass: material,
//                                       reveal: material, depth: reveal depth, sill: material }.  The reveals are quads between the wall plane z and z - depth, the glass is a fan set back by `depth`.
//   rectC / archC / segC               opening contours (rectangle, round arch, segmental arch); the glass texture is mapped over the bounding box of the contour.
//   roofFrustum / roofGable            roofs of a rectangle: a frustum with a rectangular top (hip roof), a gable (ridge along x or z).
//   fencePanels / fenceLine            iron fences: alpha-cut panels along a polyline between real posts (colliders marked fence = true).
import * as THREE from 'three';
import { shapeOf } from './geo.js';
import { knockBays, unitPanel } from '../lib/fence-bays.js';

// ------------------------------------------------------------------------------------------------ opening contours (counter clockwise, x right, y up)
export const rectC = (cx, y0, w, h) => [[cx - w / 2, y0], [cx + w / 2, y0], [cx + w / 2, y0 + h], [cx - w / 2, y0 + h]];
/** round-headed opening: total height h (crown at y0 + h), straight part h - w / 2 */
export function archC(cx, y0, w, h, n = 8) {
  const r = w / 2, ys = y0 + Math.max(0.01, h - r), pts = [[cx - r, y0], [cx + r, y0], [cx + r, ys]];
  for (let i = 1; i < n; i++) { const a = Math.PI * i / n; pts.push([cx + Math.cos(a) * r, ys + Math.sin(a) * r]); }
  pts.push([cx - r, ys]); return pts;
}
/** segmental-headed opening: total height h, the arc rises `rise` above the springing */
export function segC(cx, y0, w, h, rise, n = 8) {
  const ys = y0 + h - rise, R = (w * w / 4 + rise * rise) / (2 * rise), cy = y0 + h - R, a0 = Math.asin(Math.min(1, (w / 2) / R));
  const pts = [[cx - w / 2, y0], [cx + w / 2, y0], [cx + w / 2, ys]];
  for (let i = 1; i < n; i++) { const a = a0 - 2 * a0 * i / n; pts.push([cx + Math.sin(a) * R, cy + Math.cos(a) * R]); }
  pts.push([cx - w / 2, ys]); return pts;
}
export const bbox = (c) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of c) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 }; };

// ------------------------------------------------------------------------------------------------ a wall polygon with holes
/** a flat shape (with holes) in the facade plane at depth z facing +z; uv in metres / (tu, tv) */
export function faceXY(P, mat, shape, z, tu, tv = tu) {
  const g = new THREE.ShapeGeometry(shape, 4), ua = g.attributes.uv, pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i) / tu, pa.getY(i) / tv);
  P.geo(mat, g, 0, 0, z); g.dispose();
}
/** o: { z = 0, tu = 4, tv = tu, depth = 0.25 (reveal depth), reveal: material, glass: material, sillMat: material (a stone sill ledge under ops with `sill`) } -> triangles added */
export function wallFace(P, mat, outline, ops, o = {}) {
  const t0 = P.tris, z0 = o.z || 0, depth = o.depth ?? 0.25;
  if (typeof process !== 'undefined' && process.env && process.env.SREDNY_DEBUG) {          // review tool: a hole that leaves the outline breaks the triangulation (the wall then covers the opening)
    const ob = bbox(outline), e = 1e-6;
    for (const op of ops) { const b = bbox(op.c); if (b.x0 < ob.x0 - e || b.x1 > ob.x1 + e || b.y0 < ob.y0 - e || b.y1 > ob.y1 + e) console.warn(`[landmarksSredny] wallFace ${mat.name}: an opening (${b.x0.toFixed(2)}..${b.x1.toFixed(2)}, ${b.y0.toFixed(2)}..${b.y1.toFixed(2)}) leaves its outline (${ob.x0.toFixed(2)}..${ob.x1.toFixed(2)}, ${ob.y0.toFixed(2)}..${ob.y1.toFixed(2)})`); }
  }
  faceXY(P, mat, shapeOf(outline, ops.map((op) => op.c)), z0, o.tu || 4, o.tv || o.tu || 4);
  for (const op of ops) opening(P, op, z0, depth, o);
  return P.tris - t0;
}
export const rectOutline = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

function opening(P, op, z0, depth, o) {
  const c = op.c, n = c.length; let cx = 0, cy = 0; for (const p of c) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  const d = op.depth ?? depth, zb = z0 - d, rv = op.reveal || o.reveal, B = bbox(c);
  if (rv && d > 0.001) for (let i = 0; i < n; i++) {
    const a = c[i], b = c[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; if (nx * (cx - mx) + ny * (cy - my) < 0) { nx = -nx; ny = -ny; }
    const l = Math.hypot(nx, ny) || 1;
    P.quad(rv, [a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], zb], [a[0], a[1], zb], [nx / l, ny / l, 0]);
  }
  const gl = op.glass === undefined ? o.glass : op.glass;
  if (gl) P.fan(gl, c.map((p) => [p[0], p[1], zb]), [0, 0, 1], (p) => [(p[0] - B.x0) / B.w, (p[1] - B.y0) / B.h]);
  const sl = op.sillMat || o.sillMat;
  if (op.withSill && sl) P.box(sl, B.x0 - 0.1, B.x1 + 0.1, B.y0 - 0.1, B.y0 + 0.02, z0 - 0.03, z0 + 0.14, 'bk', 1);
}

/** a row of rectangular / arched windows described by { x, y0, w, h, kind: 'rect' | 'arch' | 'seg', rise } */
export function opsOf(list, glass, reveal, extra = {}) {
  return list.map((q) => ({ c: q.kind === 'arch' ? archC(q.x, q.y0, q.w, q.h, q.n || 8) : q.kind === 'seg' ? segC(q.x, q.y0, q.w, q.h, q.rise, q.n || 8) : rectC(q.x, q.y0, q.w, q.h), glass: q.glass || glass, reveal, depth: q.depth, withSill: q.sill, sillMat: q.sillMat, ...extra }));
}

// ------------------------------------------------------------------------------------------------ roofs
/** a frustum with a rectangular top: base [bx0..bx1] x [bz0..bz1] at y0, top [tx0..tx1] x [tz0..tz1] at y1 (a hip roof; a zero-width top gives a gable); planar uv (x, z) / tile */
export function roofFrustum(P, mat, bx0, bx1, bz0, bz1, y0, tx0, tx1, tz0, tz1, y1, tile = 2, skip = '') {
  const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2;
  const face = (p0, p1, p2, p3) => {
    const mx = (p0[0] + p1[0]) / 2 - cx, mz = (p0[2] + p1[2]) / 2 - cz;
    // uv: u along the base edge p0 -> p1, v up the slope p0 -> p3 (metres / tile)
    const e = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], el = Math.hypot(e[0], e[1], e[2]) || 1;
    const proj = (p) => ((p[0] - p0[0]) * e[0] + (p[1] - p0[1]) * e[1] + (p[2] - p0[2]) * e[2]) / el;
    const sl = Math.hypot(p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]);
    P.quad(mat, p0, p1, p2, p3, [mx, 0.4, mz], [[0, 0], [el / tile, 0], [proj(p2) / tile, sl / tile], [proj(p3) / tile, sl / tile]]);
  };
  if (!skip.includes('f')) face([bx0, y0, bz1], [bx1, y0, bz1], [tx1, y1, tz1], [tx0, y1, tz1]);           // +z side
  if (!skip.includes('k')) face([bx1, y0, bz0], [bx0, y0, bz0], [tx0, y1, tz0], [tx1, y1, tz0]);           // -z side
  if (!skip.includes('l')) face([bx0, y0, bz0], [bx0, y0, bz1], [tx0, y1, tz1], [tx0, y1, tz0]);           // -x side
  if (!skip.includes('r')) face([bx1, y0, bz1], [bx1, y0, bz0], [tx1, y1, tz0], [tx1, y1, tz1]);           // +x side
}
/** a hip roof of a rectangle with the given rise; the ridge runs along the long side (`ridge` fraction of the free ridge length is kept) */
export function roofHip(P, mat, x0, x1, z0, z1, y0, rise, tile = 2) {
  const w = x1 - x0, d = z1 - z0, h = Math.min(w, d) / 2;
  if (w >= d) roofFrustum(P, mat, x0, x1, z0, z1, y0, x0 + h, x1 - h, (z0 + z1) / 2, (z0 + z1) / 2, y0 + rise, tile);
  else roofFrustum(P, mat, x0, x1, z0, z1, y0, (x0 + x1) / 2, (x0 + x1) / 2, z0 + h, z1 - h, y0 + rise, tile);
}
/** a gable roof with the ridge along x (alongX) or along z; the two gable ends are filled with `endMat` (triangles) */
export function roofGable(P, mat, endMat, x0, x1, z0, z1, y0, rise, alongX = true, tile = 2) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (alongX) {
    roofFrustum(P, mat, x0, x1, z0, z1, y0, x0, x1, cz, cz, y0 + rise, tile, 'lr');
    if (endMat) { P.fan(endMat, [[x0, y0, z0], [x0, y0, z1], [x0, y0 + rise, cz]], [-1, 0, 0], (p) => [p[2] / 3, p[1] / 3]); P.fan(endMat, [[x1, y0, z1], [x1, y0, z0], [x1, y0 + rise, cz]], [1, 0, 0], (p) => [p[2] / 3, p[1] / 3]); }
  } else {
    roofFrustum(P, mat, x0, x1, z0, z1, y0, cx, cx, z0, z1, y0 + rise, tile, 'fk');
    if (endMat) { P.fan(endMat, [[x0, y0, z0], [x1, y0, z0], [cx, y0 + rise, z0]], [0, 0, -1], (p) => [p[0] / 3, p[1] / 3]); P.fan(endMat, [[x1, y0, z1], [x0, y0, z1], [cx, y0 + rise, z1]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]); }
  }
}

// ------------------------------------------------------------------------------------------------ small trims
/** a box between two x positions at the wall (+z out): y0..y1, projecting `proud` from the wall plane z0 (the back and the front-bottom face are skipped) */
export function band(P, mat, x0, x1, y0, y1, z0, proud, uvs = 2, skip = 'bk') { P.box(mat, x0, x1, y0, y1, z0, z0 + proud, skip, uvs); }
/** a three-step cornice: architrave band, frieze and the corona (crown at yb + 1.2, projecting 0.9 m) */
export function cornice(P, mat, shade, x0, x1, z0, yb, e0 = 0.3, e1 = 0.3, scale = 1) {
  const s = scale;
  P.box(mat, x0 - e0 / 3, x1 + e1 / 3, yb, yb + 0.4 * s, z0, z0 + 0.45 * s, 'bk', 2);
  P.box(shade, x0 - e0 / 2, x1 + e1 / 2, yb + 0.4 * s, yb + 0.72 * s, z0, z0 + 0.4 * s, 'bk', 2);
  P.box(mat, x0 - e0, x1 + e1, yb + 0.72 * s, yb + 1.2 * s, z0, z0 + 0.9 * s, 'bk', 2);
}
/** a panel (plaque, sign) on a wall at (x, yc), w x h, lifted `z` m; faces +z; uv 0..1 */
export function panel(P, mat, x, yc, w, h, z = 0.02) { P.quad(mat, [x - w / 2, yc - h / 2, z], [x + w / 2, yc - h / 2, z], [x + w / 2, yc + h / 2, z], [x - w / 2, yc + h / 2, z], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
/** a downpipe from y1 down to y0 at x standing off the wall */
export function pipe(P, mat, x, y0, y1, z = 0.08, r = 0.06) { P.cyl(mat, [x, y1, z], [x, y0, z], r, r, 6, false); P.cyl(mat, [x, y0 + 0.3, z], [x, y0, z + 0.12], r, r, 6, false); }

// ------------------------------------------------------------------------------------------------ iron fences (alpha-cut panels between real posts)
/**
 * Panels of an iron fence along the polyline `pts` ([[x, z]..], world metres): the cut-out texture `mat` (tile `pw` m wide x `ph` m high, one panel per tile) between square posts every `pw` m
 * (post size `ps`, a pyramid or ball top), colliders `fence = true` along the line; `gaps` = [[s0, s1]..] distances along the polyline where there is no fence (gates / stair openings), `y0` = the base height.
 * Returns { posts: [[x, z, rotY]..], length }.  The caller supplies the post material / geometry through `postFn(P, x, z, rotY)`.
 */
export function fenceLine(P, ph, mat, pts, o = {}) {
  const pw = o.pw || 3.4, h = o.h || 2.0, y0 = o.y0 || 0, gaps = o.gaps || [], posts = [];
  let s = 0; const total = pts.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const inGap = (a, b) => gaps.some(([g0, g1]) => (a + b) / 2 > g0 && (a + b) / 2 < g1);
  for (let i = 0; i + 1 < pts.length; i++) {
    const A = pts[i], B = pts[i + 1], len = Math.hypot(B[0] - A[0], B[1] - A[1]); if (len < 0.05) continue;
    const dx = (B[0] - A[0]) / len, dz = (B[1] - A[1]) / len, n = Math.max(1, Math.round(len / pw)), step = len / n, rotY = Math.atan2(dz, -dx) + Math.PI / 2;
    for (let k = 0; k < n; k++) {
      const a = s + k * step, b = a + step;
      if (!inGap(a, b)) {
        const x0 = A[0] + dx * k * step, z0 = A[1] + dz * k * step, x1 = x0 + dx * step, z1 = z0 + dz * step;
        if (o.bays) { o.bays.push({ x0, z0, x1, z1, y: y0 }); }      // n4spb: the panel and its collider are a breakable bay (lib/fence-bays.js knockBays, panelBays() below); the posts stay drawn
        else {
          P.quad(mat, [x0, y0, z0], [x1, y0, z1], [x1, y0 + h, z1], [x0, y0 + h, z0], [dz, 0, -dx], [[0, 0], [1, 0], [1, 1], [0, 1]]);
          if (ph) ph.addBox((x0 + x1) / 2, (z0 + z1) / 2, step, 0.15, Math.atan2(-(z1 - z0), x1 - x0), y0, y0 + h).fence = true;
        }
      }
      if (!inGap(a - 0.01, a + 0.01) || !inGap(a + step - 0.01, a + step + 0.01)) posts.push([A[0] + dx * k * step, A[1] + dz * k * step, rotY]);
    }
    if (!inGap(s + len - 0.02, s + len + 0.02) || i === pts.length - 2) posts.push([B[0], B[1], rotY]);
    s += len;
  }
  return { posts, length: total };
}

/**
 * n4spb (docs/AREAS.md 13.7, docs/vo-m3.md): the breakable version of an iron fence: the bays that fenceLine(.., { bays }) collected become `knockBays` (a thin collider flagged `fence`, the alpha panel as an instance
 * of the dynamic per-cell meshes, ONE anchored knock record per bay: a car breaks a bay off at the foot, the gap is passable).  The posts stay drawn (merged into the module's static mesh) like the posts of the other ports.
 * o = { h, y0, thick, mass, anchored }
 */
export function panelBays(ctx, name, bays, mat, o = {}) {
  if (!bays.length) return null;
  const h = o.h || 2.0, y0 = o.y0 || 0;
  return knockBays(ctx, { name, bays, far: 300,
    parts: [{ geo: unitPanel(0, h, { u1: 1 }), mat, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
    collider: { y0, y1: y0 + h, thick: o.thick || 0.15, e0: 0.05, e1: 0.05 },
    rec: () => ({ kind: 'fence', mass: o.mass || 450, h, anchored: o.anchored || 22, hitK: 0.5, metal: true, minDv: 0 }) });
}

// ------------------------------------------------------------------------------------------------ wall frames of axis-aligned walls (in the current frame; x, z = the plan coordinates)
/** wall facing -Z: the left end seen from outside is at X = xl (the larger X), local x runs toward -X */
export const onFront = (P, xl, z, fn) => { P.push(xl, 0, z, Math.PI); try { return fn(); } finally { P.pop(); } };
/** wall facing +Z: the left end is at X = xl (the smaller X), local x runs toward +X */
export const onBack = (P, xl, z, fn) => { P.push(xl, 0, z, 0); try { return fn(); } finally { P.pop(); } };
/** wall facing +X: the left end is at Z = zl (the larger Z), local x runs toward -Z */
export const onEast = (P, x, zl, fn) => { P.push(x, 0, zl, Math.PI / 2); try { return fn(); } finally { P.pop(); } };
/** wall facing -X: the left end is at Z = zl (the smaller Z), local x runs toward +Z */
export const onWest = (P, x, zl, fn) => { P.push(x, 0, zl, -Math.PI / 2); try { return fn(); } finally { P.pop(); } };

/** the polygon of a band between two arched contours (outer o, inner i, both from archC / segC: [bl, br, brUp, arc right -> left..., blUp]); both legs end at the bottom edge, no hole is needed */
export function bandPoly(o, i) {
  const oArc = o.slice(3, o.length - 1), iArc = i.slice(3, i.length - 1);
  return [o[0], o[o.length - 1], ...oArc.slice().reverse(), o[2], o[1], i[1], i[2], ...iArc, i[i.length - 1], i[0]];
}
