// landmarksYelaginSpits/parts.js - trimmed COPY of landmarksKirova/kit.js `Parts` (modules never import each other): a geometry collector with one flat-shaded buffer per material,
// uv in metres (unless a quad says otherwise), a matrix stack (push / pop) and the primitives this module needs: quad, box, cyl, geo (any BufferGeometry), cap (horizontal polygon), sweep (a profile
// extruded along a polyline: the arc wall, belt, parapet and curbs).  `build(parent)` makes one Mesh per material (16 bit indices below 65k vertices).
import * as THREE from 'three';

export class Parts {
  constructor() { this.b = new Map(); this.m = new THREE.Matrix4(); this.stack = []; this.tris = 0; }
  push(x = 0, y = 0, z = 0, rotY = 0) { this.stack.push(this.m.clone()); const t = new THREE.Matrix4().makeRotationY(rotY); t.setPosition(x, y, z); this.m.multiply(t); return this; }
  pop() { this.m = this.stack.pop(); return this; }
  bucket(mat) { let k = this.b.get(mat); if (!k) { k = { mat, pos: [], nrm: [], uv: [], idx: [], n: 0 }; this.b.set(mat, k); } return k; }
  _vert(k, x, y, z, nx, ny, nz, u, v) {
    const e = this.m.elements;
    k.pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    const tx = e[0] * nx + e[4] * ny + e[8] * nz, ty = e[1] * nx + e[5] * ny + e[9] * nz, tz = e[2] * nx + e[6] * ny + e[10] * nz, l = Math.hypot(tx, ty, tz) || 1;
    k.nrm.push(tx / l, ty / l, tz / l); k.uv.push(u, v); return k.n++;
  }
  /** quad p0 p1 p2 p3 ([x,y,z]); `n` = wanted normal (the winding is flipped to match it). uv: [[u,v] x4] */
  quad(mat, p0, p1, p2, p3, n, uv) {
    const k = this.bucket(mat);
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2], bx = p3[0] - p0[0], by = p3[1] - p0[1], bz = p3[2] - p0[2];
    let cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
    const cl = Math.hypot(cx, cy, cz) || 1; cx /= cl; cy /= cl; cz /= cl;
    const flip = n ? cx * n[0] + cy * n[1] + cz * n[2] < 0 : false;
    const nn = flip ? [-cx, -cy, -cz] : [cx, cy, cz];
    const U = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
    const a = this._vert(k, p0[0], p0[1], p0[2], nn[0], nn[1], nn[2], U[0][0], U[0][1]);
    const b = this._vert(k, p1[0], p1[1], p1[2], nn[0], nn[1], nn[2], U[1][0], U[1][1]);
    const c = this._vert(k, p2[0], p2[1], p2[2], nn[0], nn[1], nn[2], U[2][0], U[2][1]);
    const d = this._vert(k, p3[0], p3[1], p3[2], nn[0], nn[1], nn[2], U[3][0], U[3][1]);
    if (flip) k.idx.push(a, c, b, a, d, c); else k.idx.push(a, b, c, a, c, d);
    this.tris += 2;
  }
  /** axis aligned box. skip: letters of faces to omit: f (+z), k (-z), l (-x), r (+x), t (+y), b (-y). uvs = metres per uv unit */
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
  /** box with a NON-SQUARE texture tile: horizontal uv = coordinate / tu, vertical uv = (y - yv) / tv (the courses of the wall tile line up with y); top / bottom faces use tu both ways */
  boxT(mat, x0, x1, y0, y1, z0, z1, skip = '', tu = 1, tv = 1, yv = 0) {
    const V = (y) => (y - yv) / tv, H = (c) => c / tu;
    if (!skip.includes('f')) this.quad(mat, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [[H(x0), V(y0)], [H(x1), V(y0)], [H(x1), V(y1)], [H(x0), V(y1)]]);
    if (!skip.includes('k')) this.quad(mat, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [[H(x1), V(y0)], [H(x0), V(y0)], [H(x0), V(y1)], [H(x1), V(y1)]]);
    if (!skip.includes('l')) this.quad(mat, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [[H(z0), V(y0)], [H(z1), V(y0)], [H(z1), V(y1)], [H(z0), V(y1)]]);
    if (!skip.includes('r')) this.quad(mat, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [[H(z1), V(y0)], [H(z0), V(y0)], [H(z0), V(y1)], [H(z1), V(y1)]]);
    if (!skip.includes('t')) this.quad(mat, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [[H(x0), H(z1)], [H(x1), H(z1)], [H(x1), H(z0)], [H(x0), H(z0)]]);
    if (!skip.includes('b')) this.quad(mat, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], [[H(x0), H(z0)], [H(x1), H(z0)], [H(x1), H(z1)], [H(x0), H(z1)]]);
    return this;
  }
  /** any THREE.BufferGeometry placed in the current frame (position, normal, uv, index; a vertex colour attribute is ignored) */
  geo(mat, g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    const k = this.bucket(mat);
    const t = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv, idx = g.index;
    const base = k.n, n = pa.count, m = this.m.clone().multiply(t), nm = new THREE.Matrix3().getNormalMatrix(m);
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
  /** horizontal polygon cap at height y. pts [[x,z]..] (any winding), holes [[[x,z]..]] */
  cap(mat, pts, y, up = true, uvs = 4, holes = []) {
    const c2 = pts.map((p) => new THREE.Vector2(p[0], p[1])), h2 = holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    const tris = THREE.ShapeUtils.triangulateShape(c2, h2), all = pts.concat(...holes), k = this.bucket(mat), base = k.n;
    for (const p of all) this._vert(k, p[0], y, p[1], 0, up ? 1 : -1, 0, p[0] / uvs, p[1] / uvs);
    for (const [a, b, c] of tris) {
      const A = all[a], B = all[b], C = all[c], cy = (B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]);
      if ((cy > 0) === up) k.idx.push(base + a, base + b, base + c); else k.idx.push(base + a, base + c, base + b);
      this.tris++;
    }
    return this;
  }
  /**
   * SWEEP: a profile extruded along a polyline in the (x, z) plane.  line = [[x, z], ...]; prof = [[off, y], ...] ordered from the start to the end of the outline, `off` = distance to the LEFT of the
   * walking direction... here: along the 2D normal nrm = (-dz, dx)/len rotated so that +off points to the side given by `side` (+1 = (dz, -dx) i.e. right of the direction, -1 = left).  Mitred at the
   * joints (the normals are averaged).  The faces point to the side the profile winds toward (flip = true reverses).  uv: u = metres along the line / uvs, v = along the profile (metres) / uvs.
   * Used for the arc wall (profile = the vertical courses), the belt, the parapet and the curbs.  Returns the profile vertex rows' count.
   */
  sweep(mat, line, prof, o = {}) {
    const k = this.bucket(mat), uvs = o.uvs || 1, side = o.side ?? 1, cols = prof.length, rows = line.length;
    const nrm = [];                                          // mitred 2D normals of the vertices
    for (let i = 0; i < rows; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(rows - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      nrm.push([side * dz, -side * dx]);
    }
    // cumulative length for u
    const len = [0]; for (let i = 1; i < rows; i++) len.push(len[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
    const pv = [0]; for (let j = 1; j < cols; j++) pv.push(pv[j - 1] + Math.hypot(prof[j][0] - prof[j - 1][0], prof[j][1] - prof[j - 1][1]));
    const base = k.n;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // profile normal in the (off, y) plane: perpendicular to the profile tangent, pointing out of the winding side (to the left of the tangent when flip is false)
        const p0 = prof[Math.max(0, j - 1)], p1 = prof[Math.min(cols - 1, j + 1)];
        let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const sg = o.flip ? -1 : 1, no = sg * ty, ny = -sg * tx;        // (off, y) normal: rotate the tangent by -90 deg
        const x = line[i][0] + nrm[i][0] * prof[j][0], z = line[i][1] + nrm[i][1] * prof[j][0];
        this._vert(k, x, prof[j][1], z, nrm[i][0] * no, ny, nrm[i][1] * no, len[i] / uvs, (o.vOff || 0) + pv[j] / uvs);
      }
    }
    for (let i = 0; i + 1 < rows; i++) for (let j = 0; j + 1 < cols; j++) {
      const a = base + i * cols + j, b = a + 1, c = a + cols + 1, d = a + cols;
      k.idx.push(a, b, c, a, c, d); this.tris += 2;
    }
    return this;
  }
  /** one mesh per bucket added to `parent`; returns the meshes */
  build(parent, o = {}) {
    const meshes = [];
    for (const k of this.b.values()) {
      if (!k.n) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
      g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      const m = new THREE.Mesh(g, k.mat);
      m.castShadow = o.cast !== false; m.receiveShadow = true;
      if (o.name) m.name = o.name + '-' + (k.mat.name || 'mat');
      parent.add(m); meshes.push(m);
    }
    return meshes;
  }
}
