// landmarksYelaginPark/plants.js - the small bedding plants of the park sights, built from a few shared low-poly geometries (one draw call per material, instanced by merging).
//   hosta   a clump of 7-9 broad pointed leaves in two greens (the border round the Kirov stele [b123 18, 19]).
//   salvia  an oval bed of red Salvia splendens: a soil dome, a green leaf skirt and red flower spikes (the Kirov bed [b123 19]); summer annuals, NO tulips.
import * as THREE from 'three';
import { hash } from './kit.js';

let _leaf = null, _spike = null, _dome = null;
/** one hosta leaf: a pointed oval 1 long, 0.55 wide, lying slightly cupped; both faces (it is drawn with a double sided material) */
function leafGeo() {
  if (_leaf) return _leaf;
  const P = [[0, 0.05, 0], [-0.26, 0.12, 0.3], [0.26, 0.12, 0.3], [-0.2, 0.1, 0.68], [0.2, 0.1, 0.68], [0, 0.04, 1]];
  const pos = [], nrm = [], uv = [];
  const tri = [[0, 1, 2], [1, 3, 2], [2, 3, 4], [3, 5, 4]];
  for (const t of tri) for (const i of t) { pos.push(...P[i]); nrm.push(0, 1, 0); uv.push(P[i][0], P[i][2]); }
  _leaf = new THREE.BufferGeometry();
  _leaf.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); _leaf.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); _leaf.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  _leaf.computeBoundingSphere();
  return _leaf;
}
const spikeGeo = () => _spike || (_spike = new THREE.ConeGeometry(0.03, 0.1, 3, 1, false).translate(0, 0.05, 0));
const domeGeo = () => _dome || (_dome = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2));

/** a hosta clump centred on (x, z): n leaves of length 0.5 * scale radiating at random angles, tilted up 14-32 degrees */
export function hosta(P, M, x, z, scale = 1, seed = 1, n = 8, mats = null) {
  const A = mats?.a || M.hostaA, B = mats?.b || M.hostaB;
  for (let i = 0; i < n; i++) {
    const a = (i / n + (hash(seed, i, 1) - 0.5) * 0.18) * Math.PI * 2, len = (0.27 + hash(seed, i, 2) * 0.14) * scale, tilt = 0.25 + hash(seed, i, 3) * 0.3;
    const mat = hash(seed, i, 4) < 0.55 ? A : B;
    P.push(x, 0.03 + hash(seed, i, 5) * 0.06, z, a);
    P.geo(mat, leafGeo(), 0, 0, 0.04, -tilt, 0, 0, len * 0.95, len, len);                 // (the leaf points +z, tilted up about x)
    P.pop();
  }
}
/** an oval bed of red salvia: centre (cx, cz), half axes rx (along the turned x) and rz, turned by rot about y, height 0.3 m */
export function salviaBed(P, M, cx, cz, rx, rz, rot = 0, seed = 5) {
  P.push(cx, 0, cz, rot);
  P.geo(M.soil, domeGeo(), 0, -0.06, 0, 0, 0, 0, rx + 0.05, 0.2, rz + 0.05);              // a thin soil lip round the bed
  P.geo(M.salviaDark, domeGeo(), 0, 0.0, 0, 0, 0, 0, rx, 0.22, rz);
  const count = Math.round(Math.PI * rx * rz * 9);
  for (let i = 0; i < count; i++) {
    const a = hash(seed, i, 1) * Math.PI * 2, r = Math.sqrt(hash(seed, i, 2)) * 0.96, px = Math.cos(a) * r * rx, pz = Math.sin(a) * r * rz;
    const h = 0.22 * Math.sqrt(Math.max(0, 1 - r * r)) + 0.0, k = 0.8 + hash(seed, i, 3) * 0.5;
    P.geo(M.salvia, spikeGeo(), px, h - 0.04, pz, (hash(seed, i, 4) - 0.5) * 0.4, 0, (hash(seed, i, 5) - 0.5) * 0.4, k, k * 1.1, k);
  }
  P.pop();
  return count;
}
