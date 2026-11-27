// Blender landmark exports store Y-up coordinates in millimetres.
import * as THREE from 'three';

const cache = new WeakMap();
export function sculptureGeometry(packed) {
  if (!cache.has(packed)) {
    const [positions, indices] = packed;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.scale(.001, .001, .001);
    geo.setIndex(indices);
    geo.computeVertexNormals();
    cache.set(packed, geo);
  }
  return cache.get(packed);
}
