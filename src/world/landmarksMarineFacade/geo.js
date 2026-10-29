// landmarksMarineFacade/geo.js - footprint helpers shared by the parts: the baked ring of a building id, its oriented bounding rectangle (min area), prisms with outward normals and the facade-shader uv.
import * as L from '../layout.js';
import { ringEdges, DEG } from './kit.js';
import { ringFromFlat, signedArea } from '../lib/massing.js';

/** the baked outer ring of a building id as [[x, z], ...] (open) or null */
export function ringOf(id) {
  const b = L.buildingById(id);
  if (!b || !b.polys || !b.polys[0]) return null;
  return ringFromFlat(b.polys[0].o);
}
export function polyOfId(id) { const b = L.buildingById(id); return b && b.polys && b.polys[0] ? b.polys[0] : null; }

/** minimum-area oriented rectangle of a ring: { cx, cz, ang (radians, direction of the LONG axis: atan2(dz, dx)), hl, hw, ux, uz (long axis unit), vx, vz (short axis unit) } */
export function obb(ring) {
  let best = null;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
    if (l < 0.3) continue;
    const ux = dx / l, uz = dz / l, vx = -uz, vz = ux;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const p of ring) { const u = p[0] * ux + p[1] * uz, v = p[0] * vx + p[1] * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const area = (u1 - u0) * (v1 - v0);
    if (!best || area < best.area) best = { area, ux, uz, vx, vz, u0, u1, v0, v1 };
  }
  if (!best) return null;
  let { ux, uz, vx, vz, u0, u1, v0, v1 } = best;
  if (u1 - u0 < v1 - v0) { [ux, uz, vx, vz] = [vx, vz, -ux, -uz]; const ou0 = u0, ou1 = u1; u0 = v0; u1 = v1; v0 = -ou1; v1 = -ou0; }       // make the long axis the first
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  return { cx: ux * cu + vx * cv, cz: uz * cu + vz * cv, ang: Math.atan2(uz, ux), hl: (u1 - u0) / 2, hw: (v1 - v0) / 2, ux, uz, vx, vz };
}

/** three.js rotation.y of a frame whose local +x lies along the world direction (dx, dz) */
export const rotYOf = (dx, dz) => Math.atan2(-dz, dx);

/**
 * A prism over a ring (world frame, the Parts matrix is the identity): walls from y0 to y1 with outward normals and a flat cap at y1.  mats = { wall, roof, under? }.
 * o.uv = 'metres' (u metres along the wall, v metres up, divided by o.tile) or 'cells' (u = bay index, v = storey index for the facade shader: o.bay, o.floor).
 * o.skipCap drops the roof.  Returns the number of wall quads.
 */
export function prism(P, ring, y0, y1, mats, o = {}) {
  const poly = { o: ring.flat(), h: [] }, edges = ringEdges(poly);
  const tile = o.tile ?? 4, bay = o.bay ?? 1.74, floor = o.floor ?? 3.0;
  let n = 0;
  for (const e of edges) {
    const len = e.len, nrm = [e.n[0], 0, e.n[1]];
    let uv;
    if (o.uv === 'cells') { const bays = Math.max(1, Math.round(len / bay)); uv = [[0, y0 / floor], [bays, y0 / floor], [bays, y1 / floor], [0, y1 / floor]]; }
    else uv = [[0, y0 / tile], [len / tile, y0 / tile], [len / tile, y1 / tile], [0, y1 / tile]];
    P.quad(mats.wall, [e.a[0], y0, e.a[1]], [e.b[0], y0, e.b[1]], [e.b[0], y1, e.b[1]], [e.a[0], y1, e.a[1]], nrm, uv); n++;
  }
  if (!o.skipCap && mats.roof) P.cap(mats.roof, ring, y1, true, o.capTile ?? 4);
  return n;
}

/** a ring grown (+) or shrunk (-) by d metres (mitre, any winding) */
export function inflate(ring, d) {
  const n = ring.length, s = signedArea(ring) > 0 ? 1 : -1, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i + n - 1) % n], p1 = ring[i], p2 = ring[(i + 1) % n];
    const nm = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [dz / l * s, -dx / l * s]; };
    const n1 = nm(p0, p1), n2 = nm(p1, p2);
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
    const k = Math.min(2.2, 1 / Math.max(0.4, mx * n1[0] + mz * n1[1]));
    out.push([p1[0] + mx * d * k, p1[1] + mz * d * k]);
  }
  return out;
}
export { DEG };
