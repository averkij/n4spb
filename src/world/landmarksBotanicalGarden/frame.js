// landmarksBotanicalGarden/frame.js - the fixed numbers and the helpers of the module (dossier docs/research/aptekarsky-2026.md sections 4.1, 4.1b, 4.1d, 7, 10, 12).
//   Local frame of every building: `Frame(cx, cz, rot)`: local +x runs along the front to the RIGHT as seen from outside, +z points OUT of the front, y is up (the island is flat: ground y = 0);
//   world = c + R(rot) (x, z) with x' = x cos + z sin, z' = -x sin + z cos; the matching Parts frame is P.push(cx, 0, cz, rot).
//   IB  Botanical Institute (litA): centre (-1746.4, -4050.6), the 85.1 x 27.1 m min-area box of r14150140, +z = the WEST front (the porch side), rot = atan2(-0.9367, 0.3502).
// Measured on the baked rings (tools/landmarksBotanicalGarden-houses.mjs prints them): wall plane z = 8.3 (west) / -9.3 (east), porch bump to z 13.5 between x -9.3 .. 7.4 (OSM), body x -36.4 .. 36.1,
// one-storey annexes r14150138 (north) / r14150139 (south) 6 m deep at both ends.
import * as L from '../layout.js';

export const TAU = Math.PI * 2, DEG = Math.PI / 180;

export const IDS = {
  institute: 'r14150140', instituteMain: 'w617020776', annexN: 'r14150138', annexS: 'r14150139',
  director: 'w501013186', staffB: 'r2123950', staffBwing: 'r6189481', litV: 'r13561492', ticket: 'w141816493', gazebo: 'w141260379',
};

export const ringOf = (id, k = 0) => {
  const b = L.buildingById(id); if (!b) return null;
  const o = b.polys[k].o, r = []; for (let i = 0; i < o.length; i += 2) r.push([o[i], o[i + 1]]);
  return r;
};
export const holesOf = (id, k = 0) => { const b = L.buildingById(id); return b ? (b.polys[k].h || []).map((h) => { const r = []; for (let i = 0; i < h.length; i += 2) r.push([h[i], h[i + 1]]); return r; }) : []; };
export const bld = (id) => L.buildingById(id);

/** a local frame (x right along the front, z out) at world (cx, cz) turned by rot (the Parts.push rotation) */
export class Frame {
  constructor(cx, cz, rot) { this.cx = cx; this.cz = cz; this.rot = rot; this.c = Math.cos(rot); this.s = Math.sin(rot); }
  /** local (x, z) -> world [x, z] */
  w(x, z) { return [this.cx + x * this.c + z * this.s, this.cz - x * this.s + z * this.c]; }
  /** world (x, z) -> local [x, z] */
  l(x, z) { const dx = x - this.cx, dz = z - this.cz; return [dx * this.c - dz * this.s, dx * this.s + dz * this.c]; }
  /** the yaw (rotation about y) of an object that should face local direction (dx, dz) */
  yaw(dx, dz) { const wx = dx * this.c + dz * this.s, wz = -dx * this.s + dz * this.c; return Math.atan2(wx, wz); }
  /** run fn in the Parts frame */
  on(P, fn) { P.push(this.cx, 0, this.cz, this.rot); try { return fn(); } finally { P.pop(); } }
}

/** minimum-area oriented box of a ring: { cx, cz, ux, uz (the long axis), len, wid, ang } */
export function obbOf(ring) {
  let best = null;
  for (let a = 0; a < 180; a += 0.25) {
    const c = Math.cos(a * DEG), s = Math.sin(a * DEG);
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of ring) { const u = p[0] * c + p[1] * s, v = -p[0] * s + p[1] * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const A = (u1 - u0) * (v1 - v0);
    if (!best || A < best.A) best = { A, a, u0, u1, v0, v1, c, s };
  }
  const cu = (best.u0 + best.u1) / 2, cv = (best.v0 + best.v1) / 2, lu = best.u1 - best.u0, lv = best.v1 - best.v0;
  const o = { cx: cu * best.c - cv * best.s, cz: cu * best.s + cv * best.c };
  if (lu >= lv) return { ...o, ux: best.c, uz: best.s, len: lu, wid: lv, ang: best.a };
  return { ...o, ux: -best.s, uz: best.c, len: lv, wid: lu, ang: best.a + 90 };
}

/** the ring in a frame (local pairs) */
export const ringIn = (fr, ring) => ring.map((p) => fr.l(p[0], p[1]));

/** is the world point on an asphalt carriageway? (road integrity: nothing stands on it; falls back to the plain layout test before streets exists) */
export function onRoad(ctx, x, z, margin = 0.3) {
  const net = ctx.services.streets && ctx.services.streets.net;
  if (net && net.cover) return net.cover(x, z, {}) > -margin;
  return !!(L.isOnRoad && L.isOnRoad(x, z, -0.1));
}

// ---- the Botanical Institute frame (see the header)
export const IB = new Frame(-1746.4, -4050.6, Math.atan2(-0.9367, 0.3502));
export const INST = {
  zW: 8.3, zE: -9.3,                          // west / east wall planes
  x0: -36.4, x1: 36.1,                        // the 4-storey body (the annexes continue to -42.5 / 42.4)
  porchX: -0.9, porchR: 4.6,                  // porch centre (x) and radius (semicircle round the wall)
  mid: -0.9,                                  // the axis of the front
};
