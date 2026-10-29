// landmarksDekabristov/data.js - readers of the baked OSM records the module needs (data/city.js of the area: ROADS, BARRIERS, BARRIER_NODES, MONUMENTS, FURNITURE, GREEN, FOUNTAINS, TREES, BUILDINGS), by id or by box.
// Pure functions, cached.  Written for this module after landmarksSmolensky/data.js (the same reader shapes): a way is returned as [[x, z]..], a closed way has its first point repeated by OSM, ringOf() drops the repeat.
import { ROADS, BARRIERS, BARRIER_NODES, MONUMENTS, FURNITURE, GREEN, FOUNTAINS, TREES, BUILDINGS } from '../data/city.js';

export const pairs = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
const memo = (fn) => { let v; return () => v || (v = fn()); };
const roadMap = memo(() => new Map(ROADS.map((r) => [r.id, r])));
const barrierMap = memo(() => new Map(BARRIERS.map((r) => [r.id, r])));
const greenMap = memo(() => new Map(GREEN.map((r) => [r.id, r])));

export const roadById = (id) => roadMap().get(id) || null;
export const roadPts = (id) => { const r = roadMap().get(id); return r && r.pts ? pairs(r.pts) : null; };
export const barrierById = (id) => barrierMap().get(id) || null;
export const barrierPts = (id) => { const b = barrierMap().get(id); if (!b || !b.pts) return null; const p = pairs(b.pts); if (b.closed) p.push(p[0]); return p; };
/** the outer ring of a GREEN record as [[x, z]..] (first polygon, no repeated point), null when the record is missing */
export const greenRing = (id) => { const g = greenMap().get(id); return g && g.polys && g.polys[0] ? ringOf(pairs(g.polys[0].o)) : null; };
export const greenById = (id) => greenMap().get(id) || null;
/** a closed way as a ring without the repeated first point */
export function ringOf(pts) { if (!pts) return null; const r = pts.slice(); if (r.length > 2 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 0.05) r.pop(); return r; }
export const gateNodes = () => BARRIER_NODES.filter((n) => n.kind === 'gate' || n.kind === 'wicket_gate' || n.kind === 'lift_gate');
export const monumentById = (id) => MONUMENTS.find((m) => m.id === id) || null;
export const fountainById = (id) => FOUNTAINS.find((m) => m.id === id) || null;
export const buildingById = (id) => BUILDINGS.find((b) => b.id === id) || null;
export const furnitureById = (id) => FURNITURE.find((f) => f.id === id) || null;
/** ways of ROADS with a vertex inside the box [x0, x1, z0, z1] */
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
export const monumentsInBox = (x0, x1, z0, z1) => MONUMENTS.filter((f) => f.x > x0 && f.x < x1 && f.z > z0 && f.z < z1);
export const gatesInBox = (x0, x1, z0, z1) => gateNodes().filter((f) => f.x > x0 && f.x < x1 && f.z > z0 && f.z < z1);
export const treesInBox = (x0, x1, z0, z1) => { const out = []; for (let i = 0; i + 1 < TREES.length; i += 2) { const x = TREES[i], z = TREES[i + 1]; if (x > x0 && x < x1 && z > z0 && z < z1) out.push([x, z]); } return out; };
