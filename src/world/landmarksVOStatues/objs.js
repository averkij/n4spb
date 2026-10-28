// landmarksVOStatues/objs.js - small objects as separate meshes (adapted from landmarksYelaginKitchen/objs.js; modules never import each other).
// `geosOf(fn)` builds the geometry of ONE monument through a Parts collector (one BufferGeometry per material), `put(root, set, x, y, z, rotY, scale)` places a copy as its own Mesh per material.
// The engine (core/batch2.js) merges the copies by material per cell AFTER classing every mesh by size (S < 5 m hides beyond ~350 m, M < 16 m beyond ~900 m): a monument costs no draw calls of its own
// and vanishes with distance.  A monument placed twice (Lenin) is built once and put twice.
import * as THREE from 'three';
import { Parts } from './kit.js';

export function geosOf(fn) {
  const P = new Parts(); fn(P);
  const list = [];
  for (const k of P.b.values()) {
    if (!k.n) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(k.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(k.nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(k.uv, 2));
    if (k.mat.vertexColors) g.setAttribute('color', new THREE.Float32BufferAttribute(k.col, 3));
    g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    list.push({ mat: k.mat, geo: g });
  }
  return { list, tris: Math.round(P.tris) };
}

/** place one copy of a geosOf() set; returns the triangle count.  Rotation about y only; uniform scale */
export function put(root, set, x, y, z, rotY = 0, s = 1, name = 'obj') {
  for (const { mat, geo } of set.list) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.y = rotY; if (s !== 1) m.scale.setScalar(s);
    m.castShadow = !mat.transparent; m.receiveShadow = true; m.name = name; m.updateMatrix(); m.updateMatrixWorld(true);
    root.add(m);
  }
  return set.tris;
}
