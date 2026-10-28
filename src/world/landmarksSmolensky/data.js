// landmarksSmolensky/data.js - readers of the baked OSM records the module needs (data/city.js: ROADS, BARRIERS, BARRIER_NODES, MONUMENTS, FURNITURE, POIS), by id or by box.  Pure functions, cached.
// A way is returned as [[x, z]..] (a closed ring has its first point repeated by OSM: ringOf() drops the repeat).
import { ROADS, BARRIERS, BARRIER_NODES, MONUMENTS, FURNITURE, POIS, TREES } from '../data/city.js';

const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
let _roads = null, _barriers = null;
const roadMap = () => _roads || (_roads = new Map(ROADS.map((r) => [r.id, r])));
const barrierMap = () => _barriers || (_barriers = new Map(BARRIERS.map((r) => [r.id, r])));

export const roadById = (id) => roadMap().get(id) || null;
export const roadPts = (id) => { const r = roadMap().get(id); return r && r.pts ? pairs(r.pts) : null; };
export const barrierById = (id) => barrierMap().get(id) || null;
export const barrierPts = (id) => { const b = barrierMap().get(id); if (!b || !b.pts) return null; const p = pairs(b.pts); if (b.closed) p.push(p[0]); return p; };
/** a closed way as a ring without the repeated first point */
export function ringOf(pts) { if (!pts) return null; const r = pts.slice(); if (r.length > 2 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.05) r.pop(); return r; }
export const nodes = () => BARRIER_NODES;
export const monumentById = (id) => MONUMENTS.find((m) => m.id === id) || null;
/** ways of ROADS that touch the box [x0, x1, z0, z1] (any vertex inside) */
export function roadsInBox(x0, x1, z0, z1, filter) {
  const out = [];
  for (const r of ROADS) {
    if (!r.pts) continue;
    let hit = false;
    for (let i = 0; i < r.pts.length; i += 2) { const x = r.pts[i], z = r.pts[i + 1]; if (x > x0 && x < x1 && z > z0 && z < z1) { hit = true; break; } }
    if (hit && (!filter || filter(r))) out.push(r);
  }
  return out;
}
export const furnitureInBox = (x0, x1, z0, z1) => FURNITURE.filter((f) => f.x > x0 && f.x < x1 && f.z > z0 && f.z < z1);
export const poisInBox = (x0, x1, z0, z1) => POIS.filter((f) => f.x > x0 && f.x < x1 && f.z > z0 && f.z < z1);
export const treesInBox = (x0, x1, z0, z1) => { const out = []; for (let i = 0; i + 1 < TREES.length; i += 2) { const x = TREES[i], z = TREES[i + 1]; if (x > x0 && x < x1 && z > z0 && z < z1) out.push([x, z]); } return out; };
export { pairs };
