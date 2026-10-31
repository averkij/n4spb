// landmarksTVTower/parts.js - geometry collector of the tower (one flat-coloured buffer per material, no textures): quad, box, bar (square-section member between two points: the lattice),
// tube (n-gon frustum between two points with smooth normals: legs, shaft bands), disc, cap (horizontal polygon), prism (hexagonal slab).  Trimmed relatives of landmarksYelaginSpits/parts.js
// (modules never import each other).  Every member is a closed 4-sided prism without end caps unless asked: 8 triangles.  `build(parent)` makes one Mesh per material (the engine merges them).
import * as THREE from 'three';

const V = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

export class Parts {
  constructor() { this.b = new Map(); this.tris = 0; }
  bucket(mat) { let k = this.b.get(mat); if (!k) { k = { mat, pos: [], nrm: [], idx: [], n: 0 }; this.b.set(mat, k); } return k; }
  _v(k, p, n) { k.pos.push(p[0], p[1], p[2]); k.nrm.push(n[0], n[1], n[2]); return k.n++; }
  /** quad p0 p1 p2 p3 (counter-clockwise seen from the front); `n` = wanted normal (the winding is flipped to match it) */
  quad(mat, p0, p1, p2, p3, n) {
    const k = this.bucket(mat);
    const a = V.sub(p1, p0), b = V.sub(p3, p0);
    let c = V.norm(V.cross(a, b));
    const flip = n ? c[0] * n[0] + c[1] * n[1] + c[2] * n[2] < 0 : false;
    if (flip) c = [-c[0], -c[1], -c[2]];
    const i0 = this._v(k, p0, c), i1 = this._v(k, p1, c), i2 = this._v(k, p2, c), i3 = this._v(k, p3, c);
    if (flip) k.idx.push(i0, i2, i1, i0, i3, i2); else k.idx.push(i0, i1, i2, i0, i2, i3);
    this.tris += 2;
  }
  /** triangle with an outward normal hint */
  tri(mat, p0, p1, p2, n) {
    const k = this.bucket(mat);
    let c = V.norm(V.cross(V.sub(p1, p0), V.sub(p2, p0)));
    const flip = n ? c[0] * n[0] + c[1] * n[1] + c[2] * n[2] < 0 : false;
    if (flip) c = [-c[0], -c[1], -c[2]];
    const i0 = this._v(k, p0, c), i1 = this._v(k, p1, c), i2 = this._v(k, p2, c);
    if (flip) k.idx.push(i0, i2, i1); else k.idx.push(i0, i1, i2);
    this.tris += 1;
  }
  /** axis aligned box; skip = letters of faces to omit: f (+z) k (-z) l (-x) r (+x) t (+y) b (-y) */
  box(mat, x0, x1, y0, y1, z0, z1, skip = '') {
    if (!skip.includes('f')) this.quad(mat, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    if (!skip.includes('k')) this.quad(mat, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
    if (!skip.includes('l')) this.quad(mat, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    if (!skip.includes('r')) this.quad(mat, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
    if (!skip.includes('t')) this.quad(mat, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
    if (!skip.includes('b')) this.quad(mat, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    return this;
  }
  /** square-section member from a to b, side t (t1 at the end b for a taper); caps: closes both ends */
  bar(mat, a, b, t, t1 = t, caps = false) {
    const d = V.norm(V.sub(b, a));
    let u = V.cross(d, Math.abs(d[1]) > 0.94 ? [1, 0, 0] : [0, 1, 0]); u = V.norm(u);
    const v = V.norm(V.cross(d, u)), h0 = t / 2, h1 = t1 / 2;
    const c = (p, h, su, sv) => [p[0] + (u[0] * su + v[0] * sv) * h, p[1] + (u[1] * su + v[1] * sv) * h, p[2] + (u[2] * su + v[2] * sv) * h];
    const S = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i < 4; i++) {
      const s0 = S[i], s1 = S[(i + 1) % 4];
      const n = V.norm([u[0] * (s0[0] + s1[0]) + v[0] * (s0[1] + s1[1]), u[1] * (s0[0] + s1[0]) + v[1] * (s0[1] + s1[1]), u[2] * (s0[0] + s1[0]) + v[2] * (s0[1] + s1[1])]);
      this.quad(mat, c(a, h0, s0[0], s0[1]), c(a, h0, s1[0], s1[1]), c(b, h1, s1[0], s1[1]), c(b, h1, s0[0], s0[1]), n);
    }
    if (caps) {
      this.quad(mat, c(a, h0, -1, -1), c(a, h0, -1, 1), c(a, h0, 1, 1), c(a, h0, 1, -1), [-d[0], -d[1], -d[2]]);
      this.quad(mat, c(b, h1, -1, -1), c(b, h1, 1, -1), c(b, h1, 1, 1), c(b, h1, -1, 1), d);
    }
    return this;
  }
  /** thin triangular-section member from a to b (side t): 6 triangles, for lacing, rail posts and brackets that are only seen as thin lines */
  bar3(mat, a, b, t) {
    const d = V.norm(V.sub(b, a));
    let u = V.cross(d, Math.abs(d[1]) > 0.94 ? [1, 0, 0] : [0, 1, 0]); u = V.norm(u);
    const v = V.norm(V.cross(d, u)), r = t * 0.577;
    const c = (p, k) => { const an = Math.PI / 2 + k * Math.PI * 2 / 3, cu = Math.cos(an) * r, sv = Math.sin(an) * r; return [p[0] + u[0] * cu + v[0] * sv, p[1] + u[1] * cu + v[1] * sv, p[2] + u[2] * cu + v[2] * sv]; };
    for (let k = 0; k < 3; k++) {
      const k1 = (k + 1) % 3, am = Math.PI / 2 + (k + 0.5) * Math.PI * 2 / 3, cu = Math.cos(am), sv = Math.sin(am);
      this.quad(mat, c(a, k), c(a, k1), c(b, k1), c(b, k), [u[0] * cu + v[0] * sv, u[1] * cu + v[1] * sv, u[2] * cu + v[2] * sv]);
    }
    return this;
  }
  /** n-gon tube a -> b with radii r0 / r1 and smooth normals (a round shaft band, a leg chord); caps close the ends */
  tube(mat, a, b, r0, r1 = r0, seg = 6, caps = false, phase = 0) {
    const k = this.bucket(mat), d = V.norm(V.sub(b, a));
    let u = V.cross(d, Math.abs(d[1]) > 0.94 ? [1, 0, 0] : [0, 1, 0]); u = V.norm(u);
    const v = V.norm(V.cross(d, u));
    const slope = (r0 - r1) / (V.len(V.sub(b, a)) || 1);
    const ring = (p, r, j) => { const t = phase + j / seg * Math.PI * 2, cu = Math.cos(t), sv = Math.sin(t); return [p[0] + (u[0] * cu + v[0] * sv) * r, p[1] + (u[1] * cu + v[1] * sv) * r, p[2] + (u[2] * cu + v[2] * sv) * r]; };
    const nrm = (j) => { const t = phase + j / seg * Math.PI * 2, cu = Math.cos(t), sv = Math.sin(t); return V.norm([u[0] * cu + v[0] * sv + d[0] * slope, u[1] * cu + v[1] * sv + d[1] * slope, u[2] * cu + v[2] * sv + d[2] * slope]); };
    const base = k.n;
    for (let j = 0; j <= seg; j++) { const jj = j % seg, n = nrm(jj); this._v(k, ring(a, r0, jj), n); this._v(k, ring(b, r1, jj), n); }
    for (let j = 0; j < seg; j++) { const i0 = base + j * 2, i1 = i0 + 1, i2 = i0 + 3, i3 = i0 + 2; k.idx.push(i0, i3, i2, i0, i2, i1); this.tris += 2; }
    if (caps) {
      for (const [p, r, sg] of [[a, r0, -1], [b, r1, 1]]) {
        const c = this._v(k, p, [d[0] * sg, d[1] * sg, d[2] * sg]), first = k.n;
        for (let j = 0; j < seg; j++) this._v(k, ring(p, r, j), [d[0] * sg, d[1] * sg, d[2] * sg]);
        for (let j = 0; j < seg; j++) { const p0 = first + j, p1 = first + (j + 1) % seg; if (sg > 0) k.idx.push(c, p0, p1); else k.idx.push(c, p1, p0); this.tris++; }
      }
    }
    return this;
  }
  /** vertical n-gon frustum (a lathe band): centre (x, z), y0..y1, radii r0 (bottom) r1 (top) */
  cyl(mat, x, z, y0, y1, r0, r1 = r0, seg = 16, caps = false, phase = 0) { return this.tube(mat, [x, y0, z], [x, y1, z], r0, r1, seg, caps, phase); }
  /** flat disc facing `n` at p (radius r, seg corners): portholes, dishes */
  disc(mat, p, n, r, seg = 8) {
    const k = this.bucket(mat), d = V.norm(n);
    let u = V.cross(d, Math.abs(d[1]) > 0.94 ? [1, 0, 0] : [0, 1, 0]); u = V.norm(u);
    const v = V.norm(V.cross(d, u)), c = this._v(k, p, d), first = k.n;
    for (let j = 0; j < seg; j++) { const t = j / seg * Math.PI * 2, cu = Math.cos(t) * r, sv = Math.sin(t) * r; this._v(k, [p[0] + u[0] * cu + v[0] * sv, p[1] + u[1] * cu + v[1] * sv, p[2] + u[2] * cu + v[2] * sv], d); }
    for (let j = 0; j < seg; j++) { k.idx.push(c, first + j, first + (j + 1) % seg); this.tris++; }
    return this;
  }
  /** horizontal polygon cap at height y; pts [[x, z], ...] (any winding) */
  cap(mat, pts, y, up = true, holes = []) {
    const c2 = pts.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    const tris = THREE.ShapeUtils.triangulateShape(c2, h2), all = pts.concat(...holes), k = this.bucket(mat), base = k.n;
    for (const p of all) this._v(k, [p[0], y, p[1]], [0, up ? 1 : -1, 0]);
    for (const [a, b, c] of tris) {
      const A = all[a], B = all[b], C = all[c], cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
      if ((cy > 0) === up) k.idx.push(base + a, base + b, base + c); else k.idx.push(base + a, base + c, base + b);
      this.tris++;
    }
    return this;
  }
  /** hexagonal (or any n-gon) slab: ring of circumradius r, y0..y1, corner 0 pointing north, rotated by `phase`; top and bottom caps, outward side faces.  Returns the rim corners */
  prism(mat, r, y0, y1, o = {}) {
    const n = o.n || 6, ph = o.phase || 0, cx = o.cx || 0, cz = o.cz || 0, pts = [];
    for (let i = 0; i < n; i++) { const a = ph + i * Math.PI * 2 / n; pts.push([cx + r * Math.sin(a), cz - r * Math.cos(a)]); }
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], nx = (p[0] + q[0]) / 2 - cx, nz = (p[1] + q[1]) / 2 - cz;
      this.quad(mat, [p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]], [nx, 0, nz]);
    }
    if (o.top !== false) this.cap(mat, pts, y1, true);
    if (o.bottom !== false) this.cap(mat, pts, y0, false);
    return pts;
  }
  /** one mesh per bucket added to `parent` */
  build(parent, o = {}) {
    const meshes = [];
    for (const k of this.b.values()) {
      if (!k.n) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(k.n * 2), 2));
      g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, k.mat);
      m.castShadow = !!o.cast; m.receiveShadow = !!o.receive;
      if (o.name) m.name = o.name + '-' + (k.mat.name || 'mat');
      parent.add(m); meshes.push(m);
    }
    return meshes;
  }
}
