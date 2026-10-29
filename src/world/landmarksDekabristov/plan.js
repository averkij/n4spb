// landmarksDekabristov/plan.js - WHERE things stand in a cemetery / park of the island: the walkable alleys (mapped ways inside the polygon), the planted trees, the shrubs along the alleys, the clear zones.
// Pure planning on the baked data (deterministic: cell hashes, no Math.random), shared by the parts (lutheran, armenian, siege, garden).  Written for this module after landmarksSmolensky/place.js (the same rules, the same
// grid classes, no Smolensky frames): the site is a record { id, ring, ... } (sites.js), not a hard-wired polygon.  Rules:
//  * trunks keep 1.4 m clear of every alley edge (crowns may overhang), 4 m from every building, 2.6 m from the fence line (the ring), none in a clear zone (a plaza, a monument disc, a gate passage), none in an unclaimed wood /
//    forest / playground / flowerbed polygon (the generic modules plant those), and none within 9 m of water (WATER RULE, docs/AREAS.md 13.7: a trunk is a 4.5 m solid collider; a bush near water has no collider, forest.js)
//  * shrubs (hazel, elder, snowberry) stand at the alley edges and in the thickets between the trunks
import * as L from '../layout.js';
import { hash2 } from './util.js';
import { roadsInBox, pairs, treesInBox } from './data.js';
import { GREEN } from '../data/city.js';

export const inRing = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
export const segDist = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
const WALK = new Set(['footway', 'path', 'pedestrian', 'track', 'service', 'cycleway']);

/** a grid of segments for fast distance queries: cell 10 m */
export class SegGrid {
  constructor(cell = 10) { this.c = cell; this.m = new Map(); this.segs = []; }
  add(a, b, hw, tag) {
    const i = this.segs.length; this.segs.push([a, b, hw, tag]);
    const c = this.c, x0 = Math.floor((Math.min(a[0], b[0]) - 6) / c), x1 = Math.floor((Math.max(a[0], b[0]) + 6) / c), z0 = Math.floor((Math.min(a[1], b[1]) - 6) / c), z1 = Math.floor((Math.max(a[1], b[1]) + 6) / c);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = x * 8192 + z; let l = this.m.get(k); if (!l) this.m.set(k, (l = [])); l.push(i); }
  }
  /** smallest (distance - halfwidth) to any segment within the 3x3 cells of (x, z) */
  gap(x, z) {
    const c = this.c, cx = Math.floor(x / c), cz = Math.floor(z / c); let best = 1e9;
    for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) { const l = this.m.get(ix * 8192 + iz); if (!l) continue; for (const i of l) { const s = this.segs[i]; const g = segDist(x, z, s[0], s[1]) - s[2]; if (g < best) best = g; } }
    return best;
  }
}
export class PointGrid {
  constructor(cell = 6) { this.c = cell; this.m = new Map(); }
  add(x, z, r) { const k = Math.floor(x / this.c) * 8192 + Math.floor(z / this.c); let l = this.m.get(k); if (!l) this.m.set(k, (l = [])); l.push([x, z, r]); }
  /** true when a point within dist + its own radius of (x, z) exists */
  near(x, z, dist) { const c = this.c, cx = Math.floor(x / c), cz = Math.floor(z / c); for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) { const l = this.m.get(ix * 8192 + iz); if (!l) continue; for (const p of l) if (Math.hypot(p[0] - x, p[1] - z) < dist + p[2]) return true; } return false; }
}

/** true when (x, z) is in or within `d` m of water (the physics water of the area; none in a single-module check: false) */
export function waterTest(ctx) {
  const ph = ctx.physics;
  if (!ph || !ph.waterLevel) return () => false;
  return (x, z, d = 9) => {
    if (ph.waterLevel(x, z) !== null) return true;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; for (let r = d / 3; r <= d + 0.01; r += d / 3) if (ph.waterLevel(x + Math.cos(a) * r, z + Math.sin(a) * r) !== null) return true; }
    return false;
  };
}

/**
 * The plan of a site.  S = {
 *   id, ring [[x, z]..], box? [x0, x1, z0, z1],
 *   ways: (road) => bool        which ROADS ways are alleys of the site (default: a walkway with >= 60 % of its vertices inside the ring)
 *   zones: [ring..]             clear polygons (plazas, a church lot), discs: [[x, z, r]..] round the monuments and the gates
 *   treeSP (8), treeKeep (1), treeFam(h, edgeD, x, z) -> family, treeS: [min, spread], edgeClear (2.6)
 *   shrubKeep (0.34), noTrees: (x, z) => bool }
 * returns { ring, paths, grid, trees, shrubs, inside, inZone, tGrid, edgeD, zones, discs, nearWater, others }
 */
export function planSite(ctx, S) {
  const ring = S.ring, n = ring.length, nearWater = waterTest(ctx);
  let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
  for (const p of ring) { bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); bz0 = Math.min(bz0, p[1]); bz1 = Math.max(bz1, p[1]); }
  const box = { x0: bx0, x1: bx1, z0: bz0, z1: bz1 };
  const edges = ring.map((p, i) => [p, ring[(i + 1) % n]]);
  const edgeD = (x, z) => { let best = 1e9; for (const e of edges) { const d = segDist(x, z, e[0], e[1]); if (d < best) best = d; } return best; };
  // ---- alleys
  const paths = [], grid = new SegGrid(10);
  for (const r of roadsInBox(bx0 - 12, bx1 + 12, bz0 - 12, bz1 + 12, (q) => (S.ways ? S.ways(q) : WALK.has(q.hw) && q.pts.length >= 4))) {
    const pts = pairs(r.pts); let inside = 0;
    for (const p of pts) if (inRing(ring, p[0], p[1])) inside++;
    if (!S.ways && inside < pts.length * 0.6) continue;
    if (r.sub === 'sidewalk' || r.hw === 'steps') continue;
    const asphalt = r.surface === 'asphalt' || r.hw === 'service', hw = Math.max(asphalt ? 1.75 : S.minHw ?? 1.2, (r.w || 0) / 2);
    paths.push({ id: r.id, name: r.name || '', pts, w: hw * 2, surface: r.surface || (r.hw === 'service' ? 'asphalt' : ''), hw, hwClass: r.hw });
    for (let i = 0; i + 1 < pts.length; i++) grid.add(pts[i], pts[i + 1], hw, r.id);
  }
  // ---- the other green polygons that the generic modules plant themselves (wood, forest, playgrounds, flowerbeds) inside the box: no trunks of ours there
  const others = [];
  for (const g of GREEN) {
    if (g.id === S.id || !(g.kind === 'wood' || g.kind === 'forest' || g.kind === 'playground' || g.kind === 'flowerbed' || g.kind === 'garden' || g.kind === 'pitch')) continue;
    for (const p of g.polys) {
      const o = p.o; let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (let i = 0; i < o.length; i += 2) { a = Math.min(a, o[i]); b = Math.max(b, o[i]); c = Math.min(c, o[i + 1]); d = Math.max(d, o[i + 1]); }
      if (b < bx0 || a > bx1 || d < bz0 || c > bz1) continue;
      others.push({ ring: pairs(o), x0: a, x1: b, z0: c, z1: d });
    }
  }
  const inOther = (x, z) => { for (const o of others) if (x > o.x0 && x < o.x1 && z > o.z0 && z < o.z1 && inRing(o.ring, x, z)) return true; return false; };
  // ---- clear zones
  const zones = (S.zones || []).filter((z) => z.length), discs = (S.discs || []).slice();
  const inZone = (x, z, m = 0) => { for (const zn of zones) if (inRing(zn, x, z)) return true; for (const d of discs) if (Math.hypot(x - d[0], z - d[1]) < d[2] + m) return true; return false; };
  const inside = (x, z, m) => inRing(ring, x, z) && edgeD(x, z) >= m;
  // ---- the mapped trees of the data (environment draws them whatever the claims say): our trunks keep 3 m clear of them
  const dGrid = new PointGrid(6); for (const t of treesInBox(bx0 - 4, bx1 + 4, bz0 - 4, bz1 + 4)) dGrid.add(t[0], t[1], 0);
  // ---- trees: jittered grid
  const SP = S.treeSP || 8, keep = S.treeKeep ?? 1, trees = [], tGrid = new PointGrid(6), eClear = S.edgeClear ?? 2.6;
  const treeFam = S.treeFam || (() => 'limeA'), sMin = (S.treeS || [1.05, 0.7])[0], sSp = (S.treeS || [1.05, 0.7])[1];
  const g0x = Math.floor(bx0 / SP), g1x = Math.ceil(bx1 / SP), g0z = Math.floor(bz0 / SP), g1z = Math.ceil(bz1 / SP);
  const H = (gx, gz, k) => hash2(gx, gz, k + (S.seed || 0));
  for (let gx = g0x; gx <= g1x; gx++) for (let gz = g0z; gz <= g1z; gz++) {
    if (keep < 1 && H(gx, gz, 14) > keep) continue;
    const x = (gx + 0.5 + (H(gx, gz, 11) - 0.5) * 0.92) * SP, z = (gz + 0.5 + (H(gx, gz, 12) - 0.5) * 0.92) * SP;
    if (!inRing(ring, x, z)) continue;
    const ed = edgeD(x, z);
    if (ed < eClear || inZone(x, z, 1) || inOther(x, z) || L.insideBuilding(x, z, 4) || grid.gap(x, z) < 1.4 || dGrid.near(x, z, 3) || nearWater(x, z, 9)) continue;
    if (S.noTrees && S.noTrees(x, z)) continue;
    if (H(gx, gz, 14) < 0.06) continue;                                                                  // a few open spots
    const f = treeFam(H(gx, gz, 15), ed, x, z), s = sMin + H(gx, gz, 17) * sSp, rgbJ = 0.9 + H(gx, gz, 18) * 0.2;
    if (!f) continue;
    trees.push({ x, z, fam: f, s, sy: s * (0.95 + H(gx, gz, 19) * 0.2), yaw: H(gx, gz, 20) * 6.283, br: rgbJ, tr: 0 });
    tGrid.add(x, z, 0.5);
  }
  // ---- shrubs: thickets between the trunks and hedges at the alley edges
  const shrubs = [];
  const shrubKeep = S.shrubKeep ?? 0.34;
  for (let gx = g0x; gx <= g1x; gx++) for (let gz = g0z; gz <= g1z; gz++) {
    if (H(gx, gz, 51) > shrubKeep) continue;
    const x = (gx + H(gx, gz, 52)) * SP, z = (gz + H(gx, gz, 53)) * SP;
    if (!inRing(ring, x, z)) continue;
    if (edgeD(x, z) < 2.4 || inZone(x, z, 0.5) || inOther(x, z) || L.insideBuilding(x, z, 2.5) || grid.gap(x, z) < 0.9 || tGrid.near(x, z, 1.2)) continue;
    if (S.noTrees && S.noTrees(x, z)) continue;
    shrubs.push({ x, z, fam: 'shrub', s: 0.8 + H(gx, gz, 54) * 0.9, sy: 0.8 + H(gx, gz, 55) * 0.7, yaw: H(gx, gz, 56) * 6.283, br: 0.88 + H(gx, gz, 57) * 0.22, tr: 0 });
  }
  if (S.alleyShrubs !== false) for (const pth of paths) for (let i = 0; i + 1 < pth.pts.length; i++) {
    const a = pth.pts[i], b = pth.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1) continue;
    const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
    for (let s = hash2(i, l | 0, 31) * 6; s < l; s += 6 + hash2(i, s | 0, 32) * 6) for (const side of [-1, 1]) {
      if (hash2((a[0] * 3) | 0, (s * 7 + side * 91) | 0, 33) > (S.alleyShrubKeep ?? 0.7)) continue;
      const d = pth.hw + 0.45 + hash2((a[1] * 3) | 0, (s * 5) | 0, 34) * 0.7, x = a[0] + tx * s - tz * side * d, z = a[1] + tz * s + tx * side * d;
      if (!inside(x, z, 3) || inZone(x, z, 0) || inOther(x, z) || L.insideBuilding(x, z, 2.5) || grid.gap(x, z) < 0.2) continue;
      shrubs.push({ x, z, fam: 'shrub', s: 0.85 + hash2((x * 9) | 0, (z * 9) | 0, 35) * 0.7, sy: 0.85 + hash2((x * 7) | 0, (z * 7) | 0, 36) * 0.6, yaw: hash2((x * 5) | 0, (z * 5) | 0, 37) * 6.283, br: 0.9 + hash2((x * 3) | 0, (z * 3) | 0, 38) * 0.2, tr: 0 });
    }
  }
  return { ring, box, paths, grid, trees, shrubs, inside, inZone, tGrid, edgeD, zones, discs, nearWater, others, inOther };
}
