// COPY of landmarksYelaginPalace/objs.js (modules never import each other); used by landmarksYelaginServices.
// landmarksYelaginPalace/objs.js - small reusable objects as separate meshes (columns, vases, lions, lamps, spheres): `geosOf(fn)` builds the geometry of an object once through a Parts collector (one
// BufferGeometry per material), `put(root, set, x, y, z, rotY, scale)` places one copy as its own Mesh.  The engine (core/batch2.js) merges the copies by material per cell AFTER classing every mesh by its
// size (S < 5 m hides beyond 350 m, M < 16 m beyond 900 m): so the capitals, vases and lions of the palace cost no draw calls and vanish with distance, as the performance contract wants.
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
    g.setIndex(k.n > 65535 ? new THREE.Uint32BufferAttribute(k.idx, 1) : new THREE.Uint16BufferAttribute(k.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    list.push({ mat: k.mat, geo: g });
  }
  return { list, tris: P.tris };
}

/** place one copy of a geosOf() set: returns the triangle count.  Rotation about y only; scale uniform (positive: a mirrored copy is built with mirrorSet) */
export function put(root, set, x, y, z, rotY = 0, s = 1, name = 'obj') {
  for (const { mat, geo } of set.list) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.y = rotY; if (s !== 1) m.scale.setScalar(s);
    m.castShadow = true; m.receiveShadow = true; m.name = name; m.updateMatrix(); m.updateMatrixWorld(true);
    root.add(m);
  }
  return set.tris;
}

/** a mirrored copy of a set (x -> -x, winding flipped) */
export function mirrorSet(set) {
  const list = set.list.map(({ mat, geo }) => {
    const g = geo.clone();
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { p.setX(i, -p.getX(i)); if (n) n.setX(i, -n.getX(i)); }
    const ix = g.index; for (let i = 0; i < ix.count; i += 3) { const b = ix.getX(i + 1), c = ix.getX(i + 2); ix.setX(i + 1, c); ix.setX(i + 2, b); }
    p.needsUpdate = true; if (n) n.needsUpdate = true; ix.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
    return { mat, geo: g };
  });
  return { list, tris: set.tris };
}
