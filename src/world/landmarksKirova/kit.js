// COPY of landmarksKarpovka/kit.js (modules never import each other); used by landmarksKirova for the Parts geometry collector of every part (hall, plaza, october, monument).
// landmarksKirova/kit.js - geometry collector, facade frames, mitred bands and the stucco-facade vocabulary of the Nevsky landmark houses.
//
// FACADE FRAME.  A wall (one edge of a footprint) is drawn in its own frame: x (u) runs along the wall to the RIGHT as seen from the street, y is up, z points OUT of the
// facade (things that stand in front of the wall have z > 0).  `onEdge(P, edge, fn)` pushes that frame (origin at the left end of the edge on the ground) and pops it.
// Footprint edges come from `ringEdges(poly)`: outward normals are right for outer rings and courtyard holes.
//
// Parts: a tiny geometry collector (one buffer per material, flat shaded, uv in metres unless a quad says otherwise): the whole module is a few hundred meshes.
// Bands: `band(P, edges, ...)` extrudes a MITRED ring around a footprint (plinth, string courses, cornice tiers): consecutive edges share their mitre line, so no two faces overlap.
import * as THREE from 'three';
import { ringFromFlat, signedArea } from '../lib/massing.js';

export const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------------ geometry collector
export class Parts {
  constructor() { this.b = new Map(); this.m = new THREE.Matrix4(); this.stack = []; this.tris = 0; }
  /** push a local transform (x, y, z, rotY) on top of the current one */
  push(x = 0, y = 0, z = 0, rotY = 0) {
    this.stack.push(this.m.clone());
    const t = new THREE.Matrix4().makeRotationY(rotY); t.setPosition(x, y, z);
    this.m.multiply(t); return this;
  }
  pop() { this.m = this.stack.pop(); return this; }
  bucket(mat) {
    let k = this.b.get(mat);
    if (!k) { k = { mat, pos: [], nrm: [], uv: [], idx: [], n: 0, col: mat.tileCol ? [] : null }; this.b.set(mat, k); }      // a TILE HANDLE (tiles.js) writes its tile colour into every vertex
    return k;
  }
  _vert(k, x, y, z, nx, ny, nz, u, v) {
    if (k.col) k.col.push(k.mat.tileCol[0], k.mat.tileCol[1], k.mat.tileCol[2]);
    const e = this.m.elements;
    k.pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    const tx = e[0] * nx + e[4] * ny + e[8] * nz, ty = e[1] * nx + e[5] * ny + e[9] * nz, tz = e[2] * nx + e[6] * ny + e[10] * nz;
    const l = Math.hypot(tx, ty, tz) || 1; k.nrm.push(tx / l, ty / l, tz / l);
    k.uv.push(u, v); return k.n++;
  }
  /** quad p0 p1 p2 p3 ([x,y,z]); `n` = wanted normal (the winding is flipped to match it). uv: [[u,v] x4] */
  quad(mat, p0, p1, p2, p3, n, uv) {
    const k = this.bucket(mat);
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2], bx = p3[0] - p0[0], by = p3[1] - p0[1], bz = p3[2] - p0[2];
    let cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
    const cl = Math.hypot(cx, cy, cz) || 1; cx /= cl; cy /= cl; cz /= cl;
    let flip = false;
    if (n) flip = cx * n[0] + cy * n[1] + cz * n[2] < 0;
    const nn = flip ? [-cx, -cy, -cz] : [cx, cy, cz];
    const U = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
    const a = this._vert(k, p0[0], p0[1], p0[2], nn[0], nn[1], nn[2], U[0][0], U[0][1]);
    const b = this._vert(k, p1[0], p1[1], p1[2], nn[0], nn[1], nn[2], U[1][0], U[1][1]);
    const c = this._vert(k, p2[0], p2[1], p2[2], nn[0], nn[1], nn[2], U[2][0], U[2][1]);
    const d = this._vert(k, p3[0], p3[1], p3[2], nn[0], nn[1], nn[2], U[3][0], U[3][1]);
    if (flip) k.idx.push(a, c, b, a, d, c); else k.idx.push(a, b, c, a, c, d);
    this.tris += 2;
  }
  /** convex / star polygon (array of [x,y,z], all coplanar) filled as a fan from its first vertex, with normal n */
  fan(mat, pts, n, uvf) {
    const k = this.bucket(mat), base = k.n;
    const uv = uvf || ((p) => [p[0], p[1]]);
    // winding: compare the first triangle's normal with n
    const a = pts[0], b = pts[1], c = pts[2];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const flip = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0;
    for (const p of pts) { const t = uv(p); this._vert(k, p[0], p[1], p[2], n[0], n[1], n[2], t[0], t[1]); }
    for (let i = 1; i + 1 < pts.length; i++) { if (flip) k.idx.push(base, base + i + 1, base + i); else k.idx.push(base, base + i, base + i + 1); this.tris++; }
    return this;
  }
  /** axis aligned box in the current frame. skip: letters of the faces to omit: f (+z, the OUTWARD face of a facade), k (-z), l (-x), r (+x), t (+y), b (-y). uvs = metres per uv unit */
  box(mat, x0, x1, y0, y1, z0, z1, skip = '', uvs = 1) {
    const s = uvs;
    if (!skip.includes('f')) this.quad(mat, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [[x0 / s, y0 / s], [x1 / s, y0 / s], [x1 / s, y1 / s], [x0 / s, y1 / s]]);
    if (!skip.includes('k')) this.quad(mat, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [[x1 / s, y0 / s], [x0 / s, y0 / s], [x0 / s, y1 / s], [x1 / s, y1 / s]]);
    if (!skip.includes('l')) this.quad(mat, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [[z0 / s, y0 / s], [z1 / s, y0 / s], [z1 / s, y1 / s], [z0 / s, y1 / s]]);
    if (!skip.includes('r')) this.quad(mat, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [[z1 / s, y0 / s], [z0 / s, y0 / s], [z0 / s, y1 / s], [z1 / s, y1 / s]]);
    if (!skip.includes('t')) this.quad(mat, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [[x0 / s, z1 / s], [x1 / s, z1 / s], [x1 / s, z0 / s], [x0 / s, z0 / s]]);
    if (!skip.includes('b')) this.quad(mat, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [[x0 / s, z0 / s], [x1 / s, z0 / s], [x1 / s, z1 / s], [x0 / s, z1 / s]]);
    return this;
  }
  /** cylinder / frustum between two points of the current frame (any axis), radii r0 at a, r1 at b */
  cyl(mat, a, b, r0, r1 = r0, seg = 10, caps = true) {
    const k = this.bucket(mat);
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], len = Math.hypot(ax, ay, az) || 1e-6;
    const dx = ax / len, dy = ay / len, dz = az / len;
    // basis perpendicular to the axis
    let px = 0, py = 1, pz = 0; if (Math.abs(dy) > 0.9) { px = 1; py = 0; }
    let ux = dy * pz - dz * py, uy = dz * px - dx * pz, uz = dx * py - dy * px; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
    const slope = (r0 - r1) / len, nl = Math.hypot(1, slope);
    const base = k.n;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      const rx = ux * c + vx * s, ry = uy * c + vy * s, rz = uz * c + vz * s;
      const nx = (rx + dx * slope) / nl, ny = (ry + dy * slope) / nl, nz = (rz + dz * slope) / nl;
      this._vert(k, a[0] + rx * r0, a[1] + ry * r0, a[2] + rz * r0, nx, ny, nz, i / seg * 2, 0);
      this._vert(k, b[0] + rx * r1, b[1] + ry * r1, b[2] + rz * r1, nx, ny, nz, i / seg * 2, 1);
    }
    for (let i = 0; i < seg; i++) { const q = base + i * 2; k.idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); this.tris += 2; }
    if (caps) {
      for (const [c0, r, sgn] of [[a, r0, -1], [b, r1, 1]]) {
        if (r < 0.002) continue;
        const ci = this._vert(k, c0[0], c0[1], c0[2], dx * sgn, dy * sgn, dz * sgn, 0, 0), first = k.n;
        for (let i = 0; i <= seg; i++) { const t = i / seg * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); this._vert(k, c0[0] + (ux * c + vx * s) * r, c0[1] + (uy * c + vy * s) * r, c0[2] + (uz * c + vz * s) * r, dx * sgn, dy * sgn, dz * sgn, 0, 0); }
        // review 2026-10-09: the cap winding was inverted (the top cap faced down, the bottom cap up: the basis u x v = d is right handed, so a rising angle runs counter-clockwise seen from +d):
        // lamp hoods were open from below (only their outline showed), every top cap of a pole / light / post was invisible from above.  Now the front face points outward.
        for (let i = 0; i < seg; i++) { if (sgn > 0) k.idx.push(ci, first + i, first + i + 1); else k.idx.push(ci, first + i + 1, first + i); this.tris++; }
      }
    }
    return this;
  }
  /** vertical cylinder at (x, z) from y0 to y1 */
  col(mat, x, z, y0, y1, r0, r1 = r0, seg = 12, caps = true) { return this.cyl(mat, [x, y0, z], [x, y1, z], r0, r1, seg, caps); }
  /** any THREE.BufferGeometry placed in the current frame */
  geo(mat, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    const k = this.bucket(mat);
    const t = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, ca = g.attributes.color, idx = g.index;
    const base = k.n, n = pa.count;
    const m = this.m.clone().multiply(t), nm = new THREE.Matrix3().getNormalMatrix(m);
    const v = new THREE.Vector3(), nv = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      if (k.col) { const c0 = k.mat.tileCol; if (ca) k.col.push(ca.getX(i) * c0[0], ca.getY(i) * c0[1], ca.getZ(i) * c0[2]); else k.col.push(c0[0], c0[1], c0[2]); }          // a geometry with a colour attribute is multiplied by the (white) handle
      v.fromBufferAttribute(pa, i).applyMatrix4(m); k.pos.push(v.x, v.y, v.z);
      if (na) { nv.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); k.nrm.push(nv.x, nv.y, nv.z); } else k.nrm.push(0, 1, 0);
      k.uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0);
    }
    k.n += n;
    if (idx) for (let i = 0; i < idx.count; i++) k.idx.push(base + idx.getX(i)); else for (let i = 0; i < n; i++) k.idx.push(base + i);
    this.tris += (idx ? idx.count : n) / 3;
    return this;
  }
  /** a flat THREE.Shape (with holes) in the facade plane (x, y) at depth z, facing +z; uv in metres / uvs */
  face(mat, shape, z = 0, uvs = 1, seg = 10) {
    const g = new THREE.ShapeGeometry(shape, seg);
    const ua = g.attributes.uv, pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) ua.setXY(i, pa.getX(i) / uvs, pa.getY(i) / uvs);
    this.geo(mat, g, 0, 0, z); g.dispose(); return this;
  }
  /** extrude a THREE.Shape (x, y in the facade plane) from z0 toward +z by `depth` */
  extrude(mat, shape, z0, depth, uvs = 1, seg = 10) {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: seg });
    const pa = g.attributes.position, ua = g.attributes.uv, na = g.attributes.normal;
    for (let i = 0; i < pa.count; i++) { if (Math.abs(na.getZ(i)) > 0.5) ua.setXY(i, pa.getX(i) / uvs, pa.getY(i) / uvs); else ua.setXY(i, pa.getZ(i) / uvs, pa.getY(i) / uvs); }
    this.geo(mat, g, 0, 0, z0); g.dispose(); return this;
  }
  /** horizontal polygon cap at height y (world frame of the current transform). pts [[x,z]..], holes [[[x,z]..]] */
  cap(mat, pts, y, up = true, uvs = 4, holes = []) {
    const c2 = pts.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    const tris = THREE.ShapeUtils.triangulateShape(c2, h2), all = pts.concat(...holes), k = this.bucket(mat), base = k.n;
    for (const p of all) this._vert(k, p[0], y, p[1], 0, up ? 1 : -1, 0, p[0] / uvs, p[1] / uvs);
    for (const [a, b, c] of tris) {
      const A = all[a], B = all[b], C = all[c];
      const cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
      if ((cy > 0) === up) k.idx.push(base + a, base + b, base + c); else k.idx.push(base + a, base + c, base + b);
      this.tris++;
    }
    return this;
  }
  /** the buckets as they become meshes: buckets of HANDLES (tiles.js: a tile or a plain colour of a base material, `tileBase` / `tileCol`) that share a base material are concatenated into ONE bucket of the base
   *  (vertex colour = the colour of the handle), all other buckets stay as they are */
  merged() {
    const list = [], bases = new Map();
    for (const k of this.b.values()) {
      if (!k.n) continue;
      const base = k.mat.tileBase || null;
      if (!base) { list.push(k); continue; }
      let c = bases.get(base);
      if (!c) { c = { mat: base, pos: [], nrm: [], uv: [], idx: [], n: 0, col: [] }; bases.set(base, c); list.push(c); }
      const o = c.n; for (const v of k.pos) c.pos.push(v); for (const v of k.nrm) c.nrm.push(v); for (const v of k.uv) c.uv.push(v); for (const v of k.col) c.col.push(v); for (const i of k.idx) c.idx.push(i + o); c.n += k.n;
    }
    return list;
  }
  /** one mesh per (merged) bucket (16 bit indices below 65k vertices) added to `parent`; returns the meshes */
  build(parent, o = {}) {
    const meshes = [];
    for (const k of this.merged()) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
      if (k.col) g.setAttribute('color', new THREE.Float32BufferAttribute(k.col, 3));
      g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, k.mat);
      m.castShadow = o.cast !== false && !k.mat.transparent && !(o.noCast && o.noCast.has(k.mat)); m.receiveShadow = o.receive !== false;
      if (o.name) m.name = o.name;
      parent.add(m); meshes.push(m);
    }
    return meshes;
  }
}

// ------------------------------------------------------------------------------------------------ 2D shapes in the facade plane
/** rectangle x0..x1, y0..y1 as a Shape path (counter clockwise), `rev` = clockwise (a hole) */
export function rectPath(p, x0, y0, x1, y1, rev = false) {
  if (!rev) { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0); }
  else { p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0); }
  return p;
}
/** round-arched opening: centre x, bottom y, width w, straight part h (crown at y + h + w/2) */
export function archPath(p, cx, y, w, h, rev = false) {
  const r = w / 2;
  if (!rev) { p.moveTo(cx - r, y); p.lineTo(cx + r, y); p.lineTo(cx + r, y + h); p.absarc(cx, y + h, r, 0, Math.PI, false); p.lineTo(cx - r, y); }
  else { p.moveTo(cx - r, y); p.lineTo(cx - r, y + h); p.absarc(cx, y + h, r, Math.PI, 0, true); p.lineTo(cx + r, y); p.lineTo(cx - r, y); }
  return p;
}

// ------------------------------------------------------------------------------------------------ footprint edges and frames
/** edges of a footprint { o, h } with outward normals: [{ ring, i, hole, a:[x,z], b:[x,z], len, n:[nx,nz] }] (edges shorter than minLen are dropped) */
export function ringEdges(poly, minLen = 0.05) {
  const out = [];
  const rings = [{ r: ringFromFlat(poly.o), hole: false }, ...poly.h.map((h) => ({ r: ringFromFlat(h), hole: true }))];
  for (const { r, hole } of rings) {
    if (r.length < 3) continue;
    const A = signedArea(r);
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
      if (len < minLen) continue;
      let nx = dz / len, nz = -dx / len;
      if ((A > 0) !== !hole) { nx = -nx; nz = -nz; }
      out.push({ i, hole, a, b, len, n: [nx, nz] });
    }
  }
  return out;
}
/** frame of an edge: origin (left end seen from the street), rotY of the model frame (+z = out), length */
export function frameOf(e) {
  const rot = Math.atan2(e.n[0], e.n[1]);
  const xa = [e.n[1], -e.n[0]];                                           // local +x in the world (x, z)
  const fwd = (e.b[0] - e.a[0]) * xa[0] + (e.b[1] - e.a[1]) * xa[1] > 0;
  const o = fwd ? e.a : e.b;
  return { x: o[0], z: o[1], rot, len: e.len, xa };
}
/** run fn(len) in the frame of the edge (push / pop around it) */
export function onEdge(P, e, fn) {
  const f = frameOf(e);
  P.push(f.x, 0, f.z, f.rot);
  try { return fn(f.len, f); } finally { P.pop(); }
}
/** world (x,z) -> facade-local u (metres from the left end) of edge e, and the distance to the wall line (positive = outside) */
export function localOnEdge(e, x, z) {
  const f = frameOf(e);
  return { u: (x - f.x) * f.xa[0] + (z - f.z) * f.xa[1], d: (x - f.x) * e.n[0] + (z - f.z) * e.n[1] };
}
/** edge of `edges` whose end points are both within tol of (ax,az) and (bx,bz) (either order) */
export function findEdge(edges, ax, az, bx, bz, tol = 0.35) {
  const d = (p, x, z) => Math.hypot(p[0] - x, p[1] - z);
  return edges.find((e) => (d(e.a, ax, az) < tol && d(e.b, bx, bz) < tol) || (d(e.a, bx, bz) < tol && d(e.b, ax, az) < tol)) || null;
}

// ------------------------------------------------------------------------------------------------ mitred bands
/** mitre of the offset lines of consecutive edges: point at the START of edge e (its `a`), pushed `d` outwards (d per edge, previous edge pe) */
function mitre(pe, e, dp, dn) {
  const a = e.a;
  if (!pe || (dp === 0 && dn === 0)) return [a[0] + e.n[0] * dn, a[1] + e.n[1] * dn];
  // intersection of line (a + pe.n*dp, dir pe) and (a + e.n*dn, dir e), via the bisector formula
  const dot = pe.n[0] * e.n[0] + pe.n[1] * e.n[1];
  if (dot > 0.9995) return [a[0] + e.n[0] * dn, a[1] + e.n[1] * dn];
  // offset point p satisfies p.n_pe = a.n_pe + dp and p.n_e = a.n_e + dn : solve 2x2
  const det = 1 - dot * dot;
  const c1 = dp, c2 = dn;                                                  // (p - a).pe.n = c1 ; (p - a).e.n = c2
  const s = (c1 - c2 * dot) / det, t = (c2 - c1 * dot) / det;
  const q = [pe.n[0] * s + e.n[0] * t, pe.n[1] * s + e.n[1] * t];
  const lim = 3 * Math.max(Math.abs(dp), Math.abs(dn)) + 0.01;
  const l = Math.hypot(q[0], q[1]);
  if (l > lim) { const k = lim / l; return [a[0] + q[0] * k, a[1] + q[1] * k]; }
  return [a[0] + q[0], a[1] + q[1]];
}
/**
 * A mitred ring band around a footprint. For every edge of `edges` (one ring, in order) with draw(e) !== false: a front face at offset d from y0 to y1, a top face (from d to
 * dTop, default 0 = the wall) at y1 and an under face at y0 (from d to dBot, default 0). Faces of `mats` = { front, top, under } (materials).
 * `d` may be a number or fn(e) -> number (0 for party walls: pass draw()=false there). Corners: mitre when both neighbours are drawn, a square end otherwise.
 */
export function band(P, edges, Y0, Y1, d, mats, o = {}) {
  const n = edges.length, dOf = typeof d === 'function' ? d : () => d;
  const draw = o.draw || (() => true);
  const uvs = o.uvs ?? 1;
  const ok = edges.map((e) => draw(e) !== false);
  const linked = (i, j) => ok[i] && ok[j] && Math.hypot(edges[i].b[0] - edges[j].a[0], edges[i].b[1] - edges[j].a[1]) < 0.05;
  const start = edges.map((e, i) => {
    const pi = (i + n - 1) % n;
    return linked(pi, i) ? mitre(edges[pi], e, dOf(edges[pi]), dOf(e)) : [e.a[0] + e.n[0] * dOf(e), e.a[1] + e.n[1] * dOf(e)];
  });
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const e = edges[i]; if (!ok[i]) continue;
    const y0 = typeof Y0 === 'function' ? Y0(e) : Y0, y1 = typeof Y1 === 'function' ? Y1(e) : Y1;
    const j = (i + 1) % n, dn = dOf(e);
    const A = start[i], B = linked(i, j) ? start[j] : [e.b[0] + e.n[0] * dn, e.b[1] + e.n[1] * dn];
    const nrm = [e.n[0], 0, e.n[1]], len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    if (mats.front && y1 > y0) P.quad(mats.front, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], nrm, [[acc / uvs, y0 / uvs], [(acc + len) / uvs, y0 / uvs], [(acc + len) / uvs, y1 / uvs], [acc / uvs, y1 / uvs]]);
    if (dn > 0.001) {
      const IA = e.a, IB = e.b, uvq = [[A[0] / 2, A[1] / 2], [B[0] / 2, B[1] / 2], [IB[0] / 2, IB[1] / 2], [IA[0] / 2, IA[1] / 2]];
      if (mats.top) P.quad(mats.top, [A[0], y1, A[1]], [B[0], y1, B[1]], [IB[0], y1, IB[1]], [IA[0], y1, IA[1]], [0, 1, 0], uvq);
      if (mats.under) P.quad(mats.under, [A[0], y0, A[1]], [B[0], y0, B[1]], [IB[0], y0, IB[1]], [IA[0], y0, IA[1]], [0, -1, 0], uvq);
    }
    acc += len;
  }
}

// ------------------------------------------------------------------------------------------------ rounding a corner of a ring
/** replace the vertex k of ring (array [x,z]) by a circular-ish arc of radius r (n points); returns a new ring */
export function roundCorner(ring, k, r, n = 5) {
  const N = ring.length, p = ring[k], a = ring[(k + N - 1) % N], b = ring[(k + 1) % N];
  const ua = [a[0] - p[0], a[1] - p[1]], ub = [b[0] - p[0], b[1] - p[1]];
  const la = Math.hypot(...ua), lb = Math.hypot(...ub); ua[0] /= la; ua[1] /= la; ub[0] /= lb; ub[1] /= lb;
  const ang = Math.acos(Math.max(-1, Math.min(1, ua[0] * ub[0] + ua[1] * ub[1])));
  const t = r / Math.tan(ang / 2);                                          // distance from the corner to the tangent points
  const p0 = [p[0] + ua[0] * t, p[1] + ua[1] * t], p1 = [p[0] + ub[0] * t, p[1] + ub[1] * t];
  const bis = [ua[0] + ub[0], ua[1] + ub[1]], bl = Math.hypot(...bis); bis[0] /= bl; bis[1] /= bl;
  const c = [p[0] + bis[0] * r / Math.sin(ang / 2), p[1] + bis[1] * r / Math.sin(ang / 2)];
  const a0 = Math.atan2(p0[1] - c[1], p0[0] - c[0]);
  let a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]); let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const arc = [];
  for (let i = 0; i <= n; i++) { const q = a0 + da * i / n; arc.push([c[0] + Math.cos(q) * r, c[1] + Math.sin(q) * r]); }
  const out = ring.slice(0, k).concat(arc, ring.slice(k + 1));
  return out;
}
/** ring [[x,z]..] -> poly object { o: flat, h: [] } */
export const polyOf = (ring, holes = []) => ({ o: ring.flat(), h: holes.map((h) => h.flat()) });
