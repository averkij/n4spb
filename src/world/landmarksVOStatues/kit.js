// landmarksVOStatues/kit.js - COPY of landmarksYelaginKitchen/kit.js 'Parts' (the geometry collector; modules never import each other), trimmed to the collector: one buffer per material, flat or smooth uv in metres, a matrix stack.
// quad / fan / box / cyl / col / geo / face / extrude / cap and build(parent).  The cylinder cap winding is the fixed one (commit 9a00d7b2).
import * as THREE from 'three';

export const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------------ geometry collector
export class Parts {
  constructor() { this.b = new Map(); this.m = new THREE.Matrix4(); this.stack = []; this.tris = 0; this.rgb = [1, 1, 1]; }
  /** current vertex colour (hex or css string) for materials built with vertexColors: true (stone, steel, paint ... share ONE material) */
  tint(hex) { const c = new THREE.Color(hex); this.rgb = [c.r, c.g, c.b]; return this; }
  /** push a local transform (x, y, z, rotY) on top of the current one */
  push(x = 0, y = 0, z = 0, rotY = 0) {
    this.stack.push(this.m.clone());
    const t = new THREE.Matrix4().makeRotationY(rotY); t.setPosition(x, y, z);
    this.m.multiply(t); return this;
  }
  pop() { this.m = this.stack.pop(); return this; }
  bucket(mat) {
    let k = this.b.get(mat);
    if (!k) { k = { mat, pos: [], nrm: [], uv: [], idx: [], col: [], n: 0 }; this.b.set(mat, k); }
    return k;
  }
  _vert(k, x, y, z, nx, ny, nz, u, v) {
    const e = this.m.elements;
    k.pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    const tx = e[0] * nx + e[4] * ny + e[8] * nz, ty = e[1] * nx + e[5] * ny + e[9] * nz, tz = e[2] * nx + e[6] * ny + e[10] * nz;
    const l = Math.hypot(tx, ty, tz) || 1; k.nrm.push(tx / l, ty / l, tz / l);
    k.uv.push(u, v); if (k.mat.vertexColors) k.col.push(this.rgb[0], this.rgb[1], this.rgb[2]);
    return k.n++;
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
        for (let i = 0; i < seg; i++) { /* review 2026-10-10: the cap winding was inverted (the basis u x v = d is right handed, so a rising angle runs counter-clockwise seen from +d): the front face must point outward */ if (sgn > 0) k.idx.push(ci, first + i, first + i + 1); else k.idx.push(ci, first + i + 1, first + i); this.tris++; }
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
    const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, idx = g.index;
    const base = k.n, n = pa.count;
    const m = this.m.clone().multiply(t), nm = new THREE.Matrix3().getNormalMatrix(m);
    const v = new THREE.Vector3(), nv = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(m); k.pos.push(v.x, v.y, v.z);
      if (na) { nv.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); k.nrm.push(nv.x, nv.y, nv.z); } else k.nrm.push(0, 1, 0);
      k.uv.push(ua ? ua.getX(i) : 0, ua ? ua.getY(i) : 0);
      if (k.mat.vertexColors) k.col.push(this.rgb[0], this.rgb[1], this.rgb[2]);
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
    { const keep = []; for (let i = 0; i < pa.count; i += 3) { if (na.getZ(i) < -0.9 && na.getZ(i + 1) < -0.9 && na.getZ(i + 2) < -0.9) continue; keep.push(i, i + 1, i + 2); } g.setIndex(keep); }   // landmarksMenshikov: the hidden back cap of an extrusion is dropped
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
  /** one mesh per bucket (16 bit indices below 65k vertices) added to `parent`; returns the meshes */
  build(parent, o = {}) {
    const meshes = [];
    for (const k of this.b.values()) {
      if (!k.n) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
      if (k.mat.vertexColors) g.setAttribute('color', new THREE.Float32BufferAttribute(k.col, 3));
      g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, k.mat);
      m.castShadow = o.cast !== false && !k.mat.transparent; m.receiveShadow = o.receive !== false;
      if (o.name) m.name = o.name;
      parent.add(m); meshes.push(m);
    }
    return meshes;
  }
}
