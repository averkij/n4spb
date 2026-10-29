// COPY of landmarksMenshikov/inst.js (itself a copy of landmarksKarpovka/inst.js: modules never import each other); used by landmarksMining for the geometry lists of the knock furniture (bollards, lamps, benches).
// landmarksMining/inst.js - small helpers for InstancedMeshes made from the Parts collector: `partsGeos(fn)` runs fn(P) on a fresh Parts and returns one BufferGeometry per material (only partsGeos is used here).
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
