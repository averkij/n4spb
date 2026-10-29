// COPY of landmarksOktyabrsky/util.js (modules never import each other); used by landmarksMarineFacade for polygon / hash helpers.
// landmarksMarineFacade/util.js - small geometry / noise helpers (no scene objects here): polygon helpers on flat [x,z,...] rings, a deterministic cell hash, and Acc (a vertex accumulator).
//   lonLatToXZ uses the Saint Petersburg origin (59.932421 N, 30.351279 E).
//   polygon helpers on flat [x,z,x,z,...] rings, a deterministic cell hash, and `Acc` (a vertex accumulator with vertex colours
//   used for the procedural tree / bush / reed / far-block geometry).
import * as THREE from 'three';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** integer cell hash -> [0,1) (deterministic, no Math.random) */
export function hash2(ix, iz, seed = 0) {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iz | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x85ebca6b);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- polygons (flat rings, open)
export function pointInRing(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], zi = ring[i + 1], xj = ring[j], zj = ring[j + 1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
export function pointInPoly(x, z, poly) {
  if (!pointInRing(x, z, poly.o)) return false;
  for (const h of poly.h) if (pointInRing(x, z, h)) return false;
  return true;
}
export function polyBox(poly) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < poly.o.length; i += 2) { x0 = Math.min(x0, poly.o[i]); x1 = Math.max(x1, poly.o[i]); z0 = Math.min(z0, poly.o[i + 1]); z1 = Math.max(z1, poly.o[i + 1]); }
  return { x0, x1, z0, z1 };
}
export function ringArea(flat) { let a = 0; for (let i = 0; i < flat.length; i += 2) { const j = (i + 2) % flat.length; a += flat[i] * flat[j + 1] - flat[j] * flat[i + 1]; } return a / 2; }
export const polyArea = (poly) => Math.abs(ringArea(poly.o)) - poly.h.reduce((s, h) => s + Math.abs(ringArea(h)), 0);
export function ringCentroid(flat) { let x = 0, z = 0; const n = flat.length / 2; for (let i = 0; i < flat.length; i += 2) { x += flat[i]; z += flat[i + 1]; } return [x / n, z / n]; }
/** distance from a point to the boundary of a flat ring */
export function distToRing(x, z, ring) {
  let best = 1e9;
  for (let i = 0; i < ring.length; i += 2) {
    const j = (i + 2) % ring.length, ax = ring[i], az = ring[i + 1], bx = ring[j], bz = ring[j + 1];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1e-6;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1);
    best = Math.min(best, Math.hypot(ax + t * dx - x, az + t * dz - z));
  }
  return best;
}
/** orientation (radians, atan2(dz, dx)) of the longest edge of a ring + its length */
export function longestEdge(flat) {
  let best = 0, ang = 0;
  for (let i = 0; i < flat.length; i += 2) {
    const j = (i + 2) % flat.length, dx = flat[j] - flat[i], dz = flat[j + 1] - flat[i + 1], l = Math.hypot(dx, dz);
    if (l > best) { best = l; ang = Math.atan2(dz, dx); }
  }
  return { len: best, ang };
}

// ---------------------------------------------------------------- vertex accumulator (positions, normals, vertex colours, uv)
export class Acc {
  constructor(color = true) { this.p = []; this.n = []; this.c = color ? [] : null; this.uv = []; this.i = []; }
  get count() { return this.p.length / 3; }
  vert(x, y, z, nx, ny, nz, r = 1, g = 1, b = 1, u = 0, v = 0) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); if (this.c) this.c.push(r, g, b); this.uv.push(u, v); return this.p.length / 3 - 1;
  }
  /** triangle, wound so that the geometric normal agrees with the vertex normals */
  tri(a, b, c) {
    const P = this.p, N = this.n;
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
    const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
    const d = gx * (N[a * 3] + N[b * 3] + N[c * 3]) + gy * (N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1]) + gz * (N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2]);
    if (d >= 0) this.i.push(a, b, c); else this.i.push(a, c, b);
  }
  /** triangle with the given winding (no normal test: for double-sided blades) */
  raw(a, b, c) { this.i.push(a, b, c); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    if (this.c) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

/** east / south metres per degree at the data origin (same formulas as tools/osm-lib.mjs) -> world x,z of a lon / lat */
const LAT0 = 59.932421 * Math.PI / 180;
const KY = 111132.954 - 559.822 * Math.cos(2 * LAT0) + 1.175 * Math.cos(4 * LAT0);
const KX = 111412.84 * Math.cos(LAT0) - 93.5 * Math.cos(3 * LAT0) + 0.118 * Math.cos(5 * LAT0);
export const lonLatToXZ = (lon, lat) => [(lon - 30.351279) * KX, -(lat - 59.932421) * KY];
