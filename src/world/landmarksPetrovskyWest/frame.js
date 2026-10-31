// landmarksPetrovskyWest/frame.js - footprints, edge frames and the fixed numbers of the module (dossier docs/research/petrovsky-zhdanovka-2026.md; all positions re-measured in the baked data PE4 on 2026-10-15).
// x east, z SOUTH, y up (metres).  The footprints are read at build time from the baked OSM data (data/city.js BUILDINGS); the FALLBACK rings are the same numbers (used when a record is missing).
//   MALT   w938558332 Ремесленная 7 лит. К, the Bavaria malthouse: a 68.8 x 23.1 m rectangle, long axis bearing 107 deg (x east, z south), the three gables face WEST (outward normal -0.955, -0.297);
//   RUIN   w44425076 (`ruins=yes`, 33 x 20.1 m, axis 17 deg) the roofless brick shell NW of it;
//   HALLV  w44425062 Петровский пр. 20 лит. В (the 1898 production hall, ring of 10 vertices, brick with arched windows);   MANSION w44425059 Петровский пр. 20 корп. 3 (the wooden Gote mansion 1882-83, 20 vertices);
//   TOWER  w861142938 the water tower (building:part of w248349888, 5 x 5 m);   ALMAZ r20673867 Петровский пр. 26 (3 storeys, 12 vertices; the street front is the edge (-5366.8,-3249.1) -> (-5328.7,-3237.1), facing SSW).
// edgeFrame(e): the frame of ring edge e: local +z = the outward normal, local +x runs to the RIGHT as seen by a viewer standing outside, the origin is the LEFT end of the edge;
//   world = S + lx * t + lz * n, rot = atan2(nx, nz) for P.push(S.x, 0, S.z, rot).
import * as CITY from '../data/city.js';

export const DEG = Math.PI / 180;
export const IDS = { malt: 'w938558332', ruin: 'w44425076', hallV: 'w44425062', mansion: 'w44425059', tower: 'w861142938', almaz: 'r20673867' };
const FALLBACK = {
  w938558332: [[-4811, -3183.4], [-4788.9, -3176.6], [-4809.2, -3110.9], [-4831.4, -3117.7]],
  w44425076: [[-4854.2, -3181], [-4822.7, -3171.4], [-4828.6, -3152.2], [-4860.1, -3161.8]],
  w44425062: [[-4868, -2932.9], [-4823.3, -2916.2], [-4827.2, -2905.7], [-4837.8, -2909.6], [-4838.4, -2908], [-4847.5, -2911.4], [-4846.8, -2913.3], [-4866.5, -2920.7], [-4867.6, -2917.7], [-4873, -2919.8]],
  w44425059: [[-4808.2, -3064.9], [-4802.9, -3063.2], [-4803.6, -3061.3], [-4788.5, -3056.4], [-4787.9, -3058.4], [-4782.9, -3056.8], [-4783.3, -3055.6], [-4779.4, -3054.3], [-4781.4, -3048.1], [-4776.9, -3046.7], [-4778.5, -3041.9], [-4782.9, -3043.3], [-4784.9, -3037.1], [-4788.9, -3038.4], [-4789.3, -3037.1], [-4794.2, -3038.6], [-4793.6, -3040.6], [-4808.7, -3045.4], [-4809.3, -3043.5], [-4814.5, -3045.2]],
  w861142938: [[-4928.8, -2944.3], [-4924.2, -2942.6], [-4925.9, -2937.9], [-4930.6, -2939.6]],
  r20673867: [[-5366.8, -3249.1], [-5328.7, -3237.1], [-5333.3, -3222.2], [-5336.2, -3223.1], [-5336.8, -3221.3], [-5342.1, -3222.9], [-5341.5, -3224.8], [-5362.7, -3231.5], [-5363.3, -3229.6], [-5368.4, -3231.2], [-5367.8, -3233], [-5371.5, -3234.2]],
};
let _idx = null;
/** the footprint ring of an OSM building id: [[x, z]..] (open ring) */
export function ringOf(id) {
  if (!_idx) { _idx = new Map(); for (const b of CITY.BUILDINGS) if (b && b.polys && b.polys.length && !_idx.has(b.id)) _idx.set(b.id, b); }
  const b = _idx.get(id);
  if (!b) return FALLBACK[id] ? FALLBACK[id].map((p) => p.slice()) : null;
  const o = b.polys[0].o, ring = [];
  for (let i = 0; i < o.length; i += 2) ring.push([o[i], o[i + 1]]);
  if (ring.length > 3 && Math.hypot(ring[0][0] - ring[ring.length - 1][0], ring[0][1] - ring[ring.length - 1][1]) < 0.01) ring.pop();
  return ring;
}
export const signedArea = (ring) => { let s = 0; for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
/** the edges of a ring with OUTWARD unit normals: [{ i, a, b, len, n:[nx, nz] }] */
export function ringEdges(ring) {
  const sa = signedArea(ring) >= 0 ? 1 : -1, out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1e-6;
    out.push({ i, a, b, len, n: [sa * dz / len, -sa * dx / len] });
  }
  return out;
}
export function edgeFrame(e) {
  const nx = e.n[0], nz = e.n[1], tx = nz, tz = -nx;
  const sa = e.a[0] * tx + e.a[1] * tz, sb = e.b[0] * tx + e.b[1] * tz;
  const S = sa <= sb ? e.a : e.b;
  return { S: { x: S[0], z: S[1] }, t: [tx, tz], n: [nx, nz], len: e.len, rot: Math.atan2(nx, nz), e };
}
export const toWorld = (f, lx, lz) => ({ x: f.S.x + lx * f.t[0] + lz * f.n[0], z: f.S.z + lx * f.t[1] + lz * f.n[1] });
export const toLocal = (f, x, z) => ({ lx: (x - f.S.x) * f.t[0] + (z - f.S.z) * f.t[1], lz: (x - f.S.x) * f.n[0] + (z - f.S.z) * f.n[1] });
/** the longest edge of a ring whose outward normal points toward (dx, dz) best (dot product), among edges longer than minLen */
export function edgeToward(ring, dx, dz, minLen = 5) {
  let best = null, bs = -2; const l = Math.hypot(dx, dz) || 1;
  for (const e of ringEdges(ring)) { if (e.len < minLen) continue; const s = (e.n[0] * dx + e.n[1] * dz) / l; if (s > bs + 1e-6 || (Math.abs(s - bs) < 1e-6 && e.len > best.len)) { bs = s; best = e; } }
  return best;
}
/** the longest edge of a ring */
export const longestEdge = (ring) => ringEdges(ring).reduce((a, e) => (e.len > a.len ? e : a));
/** point-in-polygon (x, z) */
export function inRing(ring, x, z) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
