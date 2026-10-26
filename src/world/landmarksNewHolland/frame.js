// landmarksNewHolland/frame.js - constants and frames of New Holland island (docs/research/new-holland.md sections 2-4).
//   RING = the island relation r1576204 (osm-data.js).  ARCH frame: origin = the middle of the Moika-side front face of the Arch (-3390.75, 456.35), model +z = outward (SSW, normal (-0.308, 0.955)),
//   model +x = to the right seen from outside ((0.955, 0.308)), +y up (street level 0); the passage runs along -z (6.7 m deep) to the Kovsh side.  rotY = atan2(nx, nz) = -0.3126.
//   BOTTLE: ring centre (-3548, 337.5), outer radius 29.5, courtyard radius 17.  Water levels: the Moika at the island is -3.0; the Kovsh and the two inner canals -2.8 (quay 2.8 m high).
import { ISLAND_RING } from './osm-data.js';

export const RING = ISLAND_RING;
export const inRing = (x, z, ring = RING) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) if ((ring[i][1] > z) !== (ring[j][1] > z) && x < (ring[j][0] - ring[i][0]) * (z - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) c = !c;
  return c;
};
/** rotY of a model whose +x points along the world direction (dx, dz) (three's Ry: +x -> (cos, -sin), +z -> (sin, cos)) */
export const rotOf = (dx, dz) => Math.atan2(-dz, dx);

const A0 = [-3397.1, 454.3], B0 = [-3384.4, 458.4];
const _dl = Math.hypot(B0[0] - A0[0], B0[1] - A0[1]);
export const ARCH = (() => {
  const d = [(B0[0] - A0[0]) / _dl, (B0[1] - A0[1]) / _dl], n = [-d[1], d[0]];
  const x = (A0[0] + B0[0]) / 2, z = (A0[1] + B0[1]) / 2;
  return { x, z, d, n, rot: Math.atan2(n[0], n[1]), depth: 6.7, span: 8.2, pylon: 11.8 };
})();
/** arch-frame (u right, v out) -> world */
export const archW = (u, v) => ({ x: ARCH.x + ARCH.d[0] * u + ARCH.n[0] * v, z: ARCH.z + ARCH.d[1] * u + ARCH.n[1] * v });
export const toArch = (x, z) => ({ u: (x - ARCH.x) * ARCH.d[0] + (z - ARCH.z) * ARCH.d[1], v: (x - ARCH.x) * ARCH.n[0] + (z - ARCH.z) * ARCH.n[1] });

export const BOTTLE = { x: -3548, z: 337.5, R: 29.5, r: 17 };
export const WATER_DEEP = -2.8;                      // Kovsh / inner canals when the ground has a hole under them
export const QUAY_H = 2.8;
export const EAVES = 13.2, RIDGE = 20;               // warehouse eaves / ridge heights above the street

/** nearest point on a polyline [[x,z]..] (open) */
export function nearestOnLine(pts, x, z) {
  let best = 1e9, bx = 0, bz = 0, bt = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < best) { best = d; bx = px; bz = pz; bt = i + t; }
  }
  return { d: best, x: bx, z: bz, t: bt };
}
export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
