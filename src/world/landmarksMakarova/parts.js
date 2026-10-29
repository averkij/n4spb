// landmarksMakarova/parts.js - the geometry collector of the module = kit.js Parts + MATERIAL HANDLES (draw-call account, 2026-10-10; the same idea as landmarksKirova/kit.js, written as a subclass so that kit.js stays
// a plain copy).  A handle is the `material` that the code of the module passes to Parts.quad / box / cap / tube / geo: a plain object { tileBase, tileCol } (mats.js: flat colours, tiles.js: wall paintings) whose bucket
// writes `tileCol` into the vertex colours of every vertex.  merged() concatenates the buckets of all handles of one base material into ONE bucket of the base, so a part builds a handful of meshes (one per base)
// instead of one per colour / painting.  A real THREE material (glass, emissive bits, decals) is a bucket of its own, exactly as before.
import * as THREE from 'three';
import { Parts as KitParts } from './kit.js';

export class Parts extends KitParts {
  bucket(mat) {
    let k = this.b.get(mat);
    if (!k) { k = { mat, pos: [], nrm: [], uv: [], idx: [], n: 0, col: mat.tileCol ? [] : null }; this.b.set(mat, k); }
    return k;
  }
  _vert(k, x, y, z, nx, ny, nz, u, v) {
    if (k.col) k.col.push(k.mat.tileCol[0], k.mat.tileCol[1], k.mat.tileCol[2]);
    return super._vert(k, x, y, z, nx, ny, nz, u, v);
  }
  /** any THREE.BufferGeometry placed in the current frame (a geometry with a colour attribute is multiplied by the colour of the handle) */
  geo(mat, g, ...rest) {
    const k = this.bucket(mat), n0 = k.n;
    super.geo(mat, g, ...rest);
    if (k.col) {
      const ca = g.attributes.color, c0 = mat.tileCol;
      for (let i = 0; i < k.n - n0; i++) { if (ca) k.col.push(ca.getX(i) * c0[0], ca.getY(i) * c0[1], ca.getZ(i) * c0[2]); else k.col.push(c0[0], c0[1], c0[2]); }
    }
    return this;
  }
  /** the buckets as they become meshes: buckets of handles that share a base material are concatenated into one bucket of the base */
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
  /** one mesh per (merged) bucket added to `parent` (o.name, o.cast, o.receive, o.noCast = Set of materials that cast no shadow); returns the meshes */
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
