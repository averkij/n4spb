// streets/bld.js - building footprint queries for clipping pavements and placing furniture: ray clearance, point-in-footprint,
// distance to the nearest facade. Uses layout.groundFootprints() (ground buildings incl. landmarks), a 16 m edge grid.
import * as L from '../layout.js';
import { RIVER } from '../data/city.js';
import { slopeRings, ownerWater } from '../environment/waterways.js';

const CELL = 16;
let G = null;
function grid() {
  if (G) return G;
  G = new Map();
  const add = (ax, az, bx, bz, riv = 0) => {
    const e = [ax, az, bx, bz, riv];
    const x0 = Math.floor(Math.min(ax, bx) / CELL), x1 = Math.floor(Math.max(ax, bx) / CELL), z0 = Math.floor(Math.min(az, bz) / CELL), z1 = Math.floor(Math.max(az, bz) / CELL);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) { const k = cx * 4096 + cz; let l = G.get(k); if (!l) G.set(k, (l = [])); l.push(e); }
  };
  for (const p of L.groundFootprints()) for (const ring of [p.o, ...p.h]) for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) add(ring[j], ring[j + 1], ring[i], ring[i + 1]);
  // the Fontanka trench: pavements stop 0.45 m before the quay edge (the granite parapet / railing belongs to the embankment), facades hang on buildings only
  for (const r of RIVER || []) for (const p of r.polys || []) for (const ring of [p.o]) for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) add(ring[j], ring[j + 1], ring[i], ring[i + 1], 1);
  // grass slopes of the canals (Swan Canal, Moika at the Mikhailovsky Garden: environment/waterways.js slopeRings, water edge to slope top + 0.3 m): the pavement stops at the slope like at a quay
  for (const ring of slopeRings()) for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) add(ring[j], ring[j + 1], ring[i], ring[i + 1], 1);
  // the stair pits that a landmark module cuts into the quay (WATER.ownerRings of the area, waterways.js ownerWater(): the Academy sphinx pier): the pavement stops at the pit like at a quay; none in the other areas
  for (const w of ownerWater()) for (let i = 0, j = w.o.length - 2; i < w.o.length; j = i, i += 2) add(w.o[j], w.o[j + 1], w.o[i], w.o[i + 1], 1);
  return G;
}

/** distance along the ray (x,z) + t (dx,dz) to the first facade edge, up to maxD (returns maxD when clear). 0 when the start is inside a building. */
export function clearance(x, z, dx, dz, maxD) {
  if (L.insideBuilding(x, z, 0)) return 0;
  const g = grid(), seen = new Set();
  let best = maxD;
  const ex = x + dx * maxD, ez = z + dz * maxD;
  const n = Math.ceil(maxD / (CELL * 0.5));
  for (let k = 0; k <= n; k++) {
    const px = x + (ex - x) * k / n, pz = z + (ez - z) * k / n, c = Math.floor(px / CELL) * 4096 + Math.floor(pz / CELL);
    const l = g.get(c); if (!l) continue;
    for (const e of l) {
      if (seen.has(e)) continue; seen.add(e);
      const sx = e[2] - e[0], sz = e[3] - e[1], den = dx * sz - dz * sx;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((e[0] - x) * sz - (e[1] - z) * sx) / den, u = ((e[0] - x) * dz - (e[1] - z) * dx) / den;
      const tt = e[4] ? t - 0.45 : t;
      if (t >= 0 && tt < best && u >= 0 && u <= 1) best = Math.max(0, tt);
    }
  }
  return best;
}

/** like clearance(), but returns { t, e, x, z, nx, nz } (hit distance, facade edge [ax,az,bx,bz], hit point, wall normal facing the ray origin) or null */
export function clearanceHit(x, z, dx, dz, maxD) {
  const g = grid(), seen = new Set();
  let best = null;
  const ex = x + dx * maxD, ez = z + dz * maxD;
  const n = Math.ceil(maxD / (CELL * 0.5));
  for (let k = 0; k <= n; k++) {
    const px = x + (ex - x) * k / n, pz = z + (ez - z) * k / n, c = Math.floor(px / CELL) * 4096 + Math.floor(pz / CELL);
    const l = g.get(c); if (!l) continue;
    for (const e of l) {
      if (seen.has(e)) continue; seen.add(e);
      const sx = e[2] - e[0], sz = e[3] - e[1], den = dx * sz - dz * sx;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((e[0] - x) * sz - (e[1] - z) * sx) / den, u = ((e[0] - x) * dz - (e[1] - z) * dx) / den;
      if (!e[4] && t >= 0 && t < maxD && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, e, u };
    }
  }
  if (!best) return null;
  const sx = best.e[2] - best.e[0], sz = best.e[3] - best.e[1], l = Math.hypot(sx, sz) || 1;
  let nx = sz / l, nz = -sx / l; if (nx * dx + nz * dz > 0) { nx = -nx; nz = -nz; }
  return { t: best.t, e: best.e, u: best.u, len: l, x: x + dx * best.t, z: z + dz * best.t, nx, nz };
}

/** distance from (x,z) to the nearest facade edge within r (r when none) */
export function facadeDist(x, z, r) {
  const g = grid(), seen = new Set();
  let best = r;
  const c0x = Math.floor((x - r) / CELL), c1x = Math.floor((x + r) / CELL), c0z = Math.floor((z - r) / CELL), c1z = Math.floor((z + r) / CELL);
  for (let cx = c0x; cx <= c1x; cx++) for (let cz = c0z; cz <= c1z; cz++) {
    const l = g.get(cx * 4096 + cz); if (!l) continue;
    for (const e of l) {
      if (seen.has(e) || e[4]) continue; seen.add(e);
      const dx = e[2] - e[0], dz = e[3] - e[1], l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - e[0]) * dx + (z - e[1]) * dz) / l2));
      const d = Math.hypot(x - e[0] - dx * t, z - e[1] - dz * t);
      if (d < best) best = d;
    }
  }
  return best;
}

export const inside = (x, z, r = 0) => L.insideBuilding(x, z, r);
