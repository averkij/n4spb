// landmarksNewHolland/inst.js - small helpers for InstancedMeshes made from the Parts collector: `partsGeos(fn)` runs fn(P) on a fresh Parts and returns one BufferGeometry per material,
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
    ctx.noBatch(im); root.add(im); meshes.push(im);
    tris += (geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3) * matrices.length;
  }
  return { meshes, tris };
}
