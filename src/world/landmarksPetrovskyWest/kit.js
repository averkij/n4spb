// landmarksPetrovskyWest/kit.js - COPY of landmarksPetrovskyYacht/kit.js (modules never import each other; + vpoly): the geometry collector of the module (Parts: one mesh per material and authored LOD range).
//
// One Parts per sight: every (material, LOD range) pair becomes ONE static mesh (the engine then batches / splits them by cell), so a sight costs a handful of draw calls however
// many boxes and beams it holds.  `P.far = n` sets the authored LOD range (m) of everything added afterwards (registerLOD in build(): fine detail 150-250, masses 600-900, Infinity = never hidden).
// Frames: P.push(x, y, z, rotY) / P.pop(); rotY as in three.js (0 faces +z = south, PI north, +PI/2 east, -PI/2 west).
// Helpers: box (x0..x1, y0..y1, z0..z1 with skip letters), tbox (rotated about y, centred), cyl / col, geo (any BufferGeometry), quad / fan / cap, ribbon (a quad strip between two 3D polylines),
// beam (a rectangular section swept along a 3D polyline), prism (a convex n-gon prism with a given circumradius), disc.
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';

export class Parts {
  constructor() { this.b = new Map(); this.m = new THREE.Matrix4(); this.stack = []; this.tris = 0; this.far = 420; }
  push(x = 0, y = 0, z = 0, rotY = 0) {
    this.stack.push(this.m.clone());
    const t = new THREE.Matrix4().makeRotationY(rotY); t.setPosition(x, y, z);
    this.m.multiply(t); return this;
  }
  pop() { this.m = this.stack.pop(); return this; }
  /** run fn with the LOD range `far` and restore the previous one */
  ranged(far, fn) { const f = this.far; this.far = far; try { return fn(); } finally { this.far = f; } }
  /** ATLAS ROWS: a "virtual" material { __atlas: { real, v0, v1, u0, u1, rep } } draws into the bucket of its real material and its uv (0..1 per tile) is remapped to the row (rep: u repeats, not remapped) */
  bucket(mat) {
    if (mat.__atlas) { this._map = mat.__atlas; mat = mat.__atlas.real; } else this._map = null;
    const key = mat.uuid + '|' + this.far;
    let k = this.b.get(key);
    if (!k) { k = { mat, far: this.far, pos: [], nrm: [], uv: [], idx: [], n: 0 }; this.b.set(key, k); }
    return k;
  }
  _vert(k, x, y, z, nx, ny, nz, u, v) {
    const e = this.m.elements, mp = this._map;
    if (mp) { if (!mp.rep) u = mp.u0 + u * (mp.u1 - mp.u0); v = mp.v0 + v * (mp.v1 - mp.v0); }
    k.pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    const tx = e[0] * nx + e[4] * ny + e[8] * nz, ty = e[1] * nx + e[5] * ny + e[9] * nz, tz = e[2] * nx + e[6] * ny + e[10] * nz;
    const l = Math.hypot(tx, ty, tz) || 1; k.nrm.push(tx / l, ty / l, tz / l);
    k.uv.push(u, v); return k.n++;
  }
  /** quad p0 p1 p2 p3; `n` = the wanted normal (the winding is flipped to match it). uv: [[u,v] x 4] */
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
    return this;
  }
  /** convex polygon (array of [x,y,z], coplanar) as a fan with normal n */
  fan(mat, pts, n, uvf) {
    const k = this.bucket(mat), base = k.n, uv = uvf || ((p) => [p[0], p[2]]);
    const a = pts[0], b = pts[1], c = pts[2];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const flip = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0;
    for (const p of pts) { const t = uv(p); this._vert(k, p[0], p[1], p[2], n[0], n[1], n[2], t[0], t[1]); }
    for (let i = 1; i + 1 < pts.length; i++) { if (flip) k.idx.push(base, base + i + 1, base + i); else k.idx.push(base, base + i, base + i + 1); this.tris++; }
    return this;
  }
  /** axis aligned box in the current frame; skip: letters of the faces to omit: f (+z) k (-z) l (-x) r (+x) t (+y) b (-y); uvs = metres per uv unit */
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
  /** a box centred at (x, z) turned about y by rot, from y0 to y1, size w (x) by d (z) */
  tbox(mat, x, z, w, d, y0, y1, rot = 0, skip = '', uvs = 1) {
    this.push(x, 0, z, rot); this.box(mat, -w / 2, w / 2, y0, y1, -d / 2, d / 2, skip, uvs); this.pop(); return this;
  }
  /** cylinder / frustum between two points of the current frame (any axis), radii r0 at a, r1 at b */
  cyl(mat, a, b, r0, r1 = r0, seg = 10, caps = true) {
    const k = this.bucket(mat);
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], len = Math.hypot(ax, ay, az) || 1e-6;
    const dx = ax / len, dy = ay / len, dz = az / len;
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
        for (let i = 0; i < seg; i++) { if (sgn > 0) k.idx.push(ci, first + i, first + i + 1); else k.idx.push(ci, first + i + 1, first + i); this.tris++; }
      }
    }
    return this;
  }
  /** vertical cylinder at (x, z) from y0 to y1 */
  col(mat, x, z, y0, y1, r0, r1 = r0, seg = 12, caps = true) { return this.cyl(mat, [x, y0, z], [x, y1, z], r0, r1, seg, caps); }
  /** any THREE.BufferGeometry placed in the current frame (figures: Figure.place calls this) */
  geo(mat, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    const k = this.bucket(mat);
    const t = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, idx = g.index;
    const base = k.n, n = pa.count;
    const m = this.m.clone().multiply(t), nm = new THREE.Matrix3().getNormalMatrix(m);
    const v = new THREE.Vector3(), nv = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(m); k.pos.push(v.x, v.y, v.z);
      if (na) { nv.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); k.nrm.push(nv.x, nv.y, nv.z); } else k.nrm.push(0, 1, 0);
      k.uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0);
    }
    k.n += n;
    if (idx) for (let i = 0; i < idx.count; i++) k.idx.push(base + idx.getX(i)); else for (let i = 0; i < n; i++) k.idx.push(base + i);
    this.tris += (idx ? idx.count : n) / 3;
    return this;
  }
  /** horizontal polygon cap at height y. pts [[x,z]..], holes [[[x,z]..]]; uv = world metres / uvs */
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
  /** a (possibly non-convex) polygon standing in the plane z = z0 of the current frame: pts [[u, y]..] (outer ring, no holes), outward normal (0, 0, sgn); uv = (u / us, y / vs) shifted by (u0, v0) */
  vpoly(mat, pts, z0, sgn = 1, us = 1, vs = 1, u0 = 0, v0 = 0) {
    const c2 = pts.map((p) => new THREE.Vector2(p[0], p[1])), tris = THREE.ShapeUtils.triangulateShape(c2, []), k = this.bucket(mat), base = k.n;
    for (const p of pts) this._vert(k, p[0], p[1], z0, 0, 0, sgn, (p[0] - u0) / us, (p[1] - v0) / vs);
    for (const [a, b, c] of tris) {
      const A = pts[a], B = pts[b], C = pts[c], cr = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);   // > 0: counter-clockwise seen from +z
      if ((cr > 0) === (sgn > 0)) k.idx.push(base + a, base + b, base + c); else k.idx.push(base + a, base + c, base + b);
      this.tris++;
    }
    return this;
  }
  /** a quad strip between two 3D polylines A and B of equal length (n >= 2); `n` = the wanted normal; uv = (arc length of A / uvs, side 0..1 * width / uvs) */
  ribbon(mat, A, B, n = [0, 1, 0], uvs = 1) {
    let acc = 0;
    for (let i = 0; i + 1 < A.length; i++) {
      const la = Math.hypot(A[i + 1][0] - A[i][0], A[i + 1][2] - A[i][2]) || 0.01;
      const w0 = Math.hypot(B[i][0] - A[i][0], B[i][2] - A[i][2]), w1 = Math.hypot(B[i + 1][0] - A[i + 1][0], B[i + 1][2] - A[i + 1][2]);
      this.quad(mat, A[i], A[i + 1], B[i + 1], B[i], n, [[acc / uvs, 0], [(acc + la) / uvs, 0], [(acc + la) / uvs, w1 / uvs], [acc / uvs, w0 / uvs]]);
      acc += la;
    }
    return this;
  }
  /**
   * a beam of rectangular section swept along the polyline `path` (>= 2 points [x,y,z]): width w along the axis `lat` (a horizontal unit vector, default: perpendicular to the plan
   * direction of the path), thickness h in the other cross direction; sw / sh optionally taper (ratios at the end).  Closed with end caps.  uv: u = length / uvs.
   */
  beam(mat, path, w, h, lat = null, uvs = 1, taper = 1) {
    const n = path.length, T = [];
    for (let i = 0; i < n; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      const t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); T.push(t);
    }
    const rings = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const t = T[i];
      let l = lat ? new THREE.Vector3(lat[0], lat[1], lat[2]) : new THREE.Vector3(-t.z, 0, t.x);
      l.sub(t.clone().multiplyScalar(l.dot(t))); if (l.lengthSq() < 1e-6) l.set(1, 0, 0); l.normalize();
      const u = new THREE.Vector3().crossVectors(l, t).normalize();                    // the thickness direction
      const k = 1 + (taper - 1) * (i / Math.max(1, n - 1));
      const hw = w * k / 2, hh = h * k / 2, p = path[i];
      if (i) acc += Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1], p[2] - path[i - 1][2]);
      const c = (sl, su) => [p[0] + l.x * hw * sl + u.x * hh * su, p[1] + l.y * hw * sl + u.y * hh * su, p[2] + l.z * hw * sl + u.z * hh * su];
      rings.push({ c: [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], l, u, acc, w: hw * 2, h: hh * 2 });
    }
    for (let i = 0; i + 1 < n; i++) {
      const A = rings[i], B = rings[i + 1];
      for (let s = 0; s < 4; s++) {
        const s2 = (s + 1) % 4, side = [A.u.clone().multiplyScalar(-1), A.l.clone(), A.u.clone(), A.l.clone().multiplyScalar(-1)][s];
        const wd = s % 2 ? A.h : A.w;
        this.quad(mat, A.c[s], A.c[s2], B.c[s2], B.c[s], [side.x, side.y, side.z], [[A.acc / uvs, 0], [A.acc / uvs, wd / uvs], [B.acc / uvs, wd / uvs], [B.acc / uvs, 0]]);
      }
    }
    for (const [R, sg] of [[rings[0], -1], [rings[n - 1], 1]]) {
      const tn = T[sg < 0 ? 0 : n - 1]; this.quad(mat, R.c[0], R.c[1], R.c[2], R.c[3], [tn.x * sg, tn.y * sg, tn.z * sg], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    return this;
  }
  /** a convex n-gon prism (circumradius R, rotated by rot0 about y) from y0 to y1 at (x, z); sides = false skips the side faces (caps only) */
  prism(mat, x, z, R, n, y0, y1, rot0 = 0, o = {}) {
    const ring = [];
    for (let i = 0; i < n; i++) { const a = rot0 + i / n * Math.PI * 2; ring.push([x + Math.sin(a) * R, z + Math.cos(a) * R]); }
    if (o.sides !== false) {
      for (let i = 0; i < n; i++) {
        const a = ring[i], b = ring[(i + 1) % n], mx = (a[0] + b[0]) / 2 - x, mz = (a[1] + b[1]) / 2 - z, ml = Math.hypot(mx, mz) || 1;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        this.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [mx / ml, 0, mz / ml], [[0, y0 / (o.uvs || 1)], [len / (o.uvs || 1), y0 / (o.uvs || 1)], [len / (o.uvs || 1), y1 / (o.uvs || 1)], [0, y1 / (o.uvs || 1)]]);
      }
    }
    if (o.top !== false) this.fan(mat, ring.map((p) => [p[0], y1, p[1]]), [0, 1, 0]);
    if (o.bottom) this.fan(mat, ring.map((p) => [p[0], y0, p[1]]), [0, -1, 0]);
    return ring;
  }
  /** one mesh per (material, range) bucket added to `parent`, each registered with its authored LOD range; returns [{ mesh, mat, far }] */
  build(parent, o = {}) {
    const out = [];
    for (const k of this.b.values()) {
      if (!k.n) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
      g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, k.mat);
      m.castShadow = o.cast !== false && !k.mat.transparent; m.receiveShadow = o.receive !== false;
      m.name = (o.name || 'pwest') + '-' + (k.mat.name || 'mat');
      parent.add(m); m.updateMatrixWorld(true);
      registerLOD(m, k.far);
      out.push({ mesh: m, mat: k.mat, far: k.far });
    }
    return out;
  }
}

// ------------------------------------------------------------------------------------------------ small helpers
/** world distance to the nearest of an array of [x, z] points */
export const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** flat [x, z, x, z ...] -> [[x, z] ...] */
export const ringOf = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
/** resample a polyline [[x, z]..] to n points evenly by arc length */
export function resample(pts, n) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out = [], tot = L[L.length - 1];
  for (let k = 0; k < n; k++) {
    const s = tot * k / (n - 1); let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const t = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]);
  }
  return out;
}
/** deterministic hash noise 0..1 */
export const hash = (a, b = 0, c = 0) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
