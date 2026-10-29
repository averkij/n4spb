// COPY of landmarksOktyabrsky/inst.js (modules never import each other); used by landmarksMarineFacade for the instanced fenders, bollards, masts, posts, AC units, boats and lattice crowns.
// landmarksMarineFacade/inst.js - small helpers: partsGeos(fn) -> one BufferGeometry per material; addInstanced(...) -> one InstancedMesh per material (split per 192 m cell and distance-LOD by core/spatial.js unless o.noSplit).
// `addInstanced(...)` places them at a list of matrices (one InstancedMesh per material, not merged by the engine, culled by a computed bounding sphere).
import * as THREE from 'three';
import { Parts } from './kit.js';

export function partsGeos(fn) {
  const P = new Parts(); fn(P);
  const out = [];
  for (const k of P.b.values()) {
    if (!k.n) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
    if (k.col) g.setAttribute('color', new THREE.Float32BufferAttribute(k.col, 3));
    g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
    out.push({ mat: k.mat, geo: g });
  }
  return { list: out, tris: P.tris };
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
/** matrix for an instance at (x, y, z) turned by rotY, scaled s */
export function mat4(x, y, z, rotY = 0, s = 1) { _q.setFromAxisAngle(_up, rotY); return new THREE.Matrix4().compose(_v.set(x, y, z), _q, _s.set(s, s, s)); }

/** list = [{ mat, geo }] from partsGeos, matrices = Matrix4[]; returns the meshes (added to root) and the triangle count */
export function addInstanced(ctx, root, name, parts, matrices, o = {}) {
  const meshes = []; let tris = 0;
  if (!matrices.length) return { meshes, tris };
  for (const { mat, geo } of parts.list) {
    const im = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
    im.castShadow = o.cast !== false; im.receiveShadow = true; im.name = `${name}-${meshes.length}`;
    if (o.noSplit) ctx.noBatch(im);                       // default: core/spatial.js splits the list per 192 m cell and distance-LODs the pieces
    root.add(im); meshes.push(im);
    tris += (geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3) * matrices.length;
  }
  return { meshes, tris };
}

// ---------------------------------------------------------------- n4spb (docs/AREAS.md 13.7, 15.v; docs/gdm-M.md): the knock helpers of this module
import { knockBays as _knockBays } from '../lib/fence-bays.js';
import { knockInstances as _knockInstances } from '../lib/knock-inst.js';
/** knockBays that also adds the triangles of the instances it draws to the module total (K.extraTris) */
export function kBays(K, o) {
  const r = _knockBays(K.ctx, o); let t = 0;
  for (const m of r.meshes || []) t += ((m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3) * m.count;
  K.extraTris = (K.extraTris || 0) + t; return r;
}
/** a unit geometry (lib/fence-bays.js unitBox / unitPanel) for a bay part, in the material of the module: a COLOUR HANDLE (mats.js H()) is the shared vertex-colour material, so the colour goes into a colour attribute of a copy
 *  of the geometry (an instance of a geometry without it would draw black). Returns { geo, mat } (a plain material is passed through). */
export function tint(geo, handle) {
  if (!handle || !handle.isHandle) return { geo, mat: handle };
  const g = geo.clone(), n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = handle.rgb[0]; col[i * 3 + 1] = handle.rgb[1]; col[i * 3 + 2] = handle.rgb[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return { geo: g, mat: handle.base };
}
/** the knockable version of a furniture built with partsGeos(): one record per spot { x, y, z, rotY }, items = the colliders (or null), rec = a record template; glass / cut-out sheets get no outline and no shadow;
 *  returns the triangles (K.extraTris is raised by it) */
export function kFurn(K, name, parts, spots, items, rec, far = 300) {
  if (!spots.length) return 0;
  const M = K.M, noOut = (m) => M.glassy.has(m) || M.cutouts.has(m) || M.decals.has(m);
  _knockInstances(K.ctx, { name, parts: parts.list.map(({ geo, mat }, i) => ({ geo, mat, name: 'p' + i, noOutline: noOut(mat), shadow: !M.glassy.has(mat) })), spots, items: items || null, rec, far });
  let tris = 0; for (const { geo } of parts.list) tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
  tris *= spots.length; K.extraTris = (K.extraTris || 0) + tris; return tris;
}
