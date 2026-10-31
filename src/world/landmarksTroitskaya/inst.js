import { knockInstances } from '../lib/knock-inst.js';
import { FURNITURE_REC } from '../lib/knock-furniture.js';
// landmarksTroitskaya/inst.js - small helpers for InstancedMeshes made from the Parts collector: `partsGeos(fn)` runs fn(P) on a fresh Parts and returns one BufferGeometry per material,
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

  const kind=/bench/i.test(name)?'bench':/lamp|lantern/i.test(name)?'lamp':/bin|urn/i.test(name)?'bin':null;
  if(kind&&matrices.length){
    const spots=matrices.map(m=>{const p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();m.decompose(p,q,sc);return {x:p.x,y:p.y,z:p.z,rotY:new THREE.Euler().setFromQuaternion(q).y,s:sc.x};});
    const items=spots.map(p=>ctx.physics.items.find(it=>!it.knock&&Math.hypot(it.cx-p.x,it.cz-p.z)<.35&&(it.type==='cyl'?it.r<.65:it.type==='box'&&Math.max(it.hw,it.hd)<2))||null);
    const h=kind==='lamp'?Math.max(3,...parts.list.map(p=>{p.geo.computeBoundingBox();return p.geo.boundingBox.max.y;})):1;
    const rec=kind==='lamp'?FURNITURE_REC.lamp(h):FURNITURE_REC[kind];
    const out=knockInstances(ctx,{name,parts:parts.list.map(p=>({geo:p.geo,mat:p.mat})),spots,items,rec,far:260});
    return {...out,tris:parts.tris*matrices.length};
  }
  const meshes = []; let tris = 0;
  if (!matrices.length) return { meshes, tris };
  for (const { mat, geo } of parts.list) {
    const im = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
    im.castShadow = o.cast !== false; im.receiveShadow = true; im.name = `${name}-${meshes.length}`;
    root.add(im); meshes.push(im);
    tris += (geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3) * matrices.length;
  }
  return { meshes, tris };
}
