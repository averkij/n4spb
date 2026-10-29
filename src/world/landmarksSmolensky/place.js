// landmarksSmolensky/place.js - WHERE things stand in the cemetery: the walkable alleys (mapped ways inside the polygon), the planted forest, the shrubs, the graves along the alleys and the chapel-tombs.
// Pure planning on the baked data (deterministic: cell hashes, no Math.random), shared by grounds.js (forest, graves) and furniture.js.  Rules (docs/research/smolensky.md 3.4-3.7):
//  * trees keep 1.3 m clear of every alley edge (trunks only, crowns may overhang), 4 m from every building, none on the plazas / the church apron / the lots, 7.5 m back from the river polygon edge
//    (the water owner's natural slope is about 6 m wide), 2.5 m from the fence; behind the Maly / Beringa fence a cleared strip of 9 m keeps only a quarter of the trees (photo 81)
//  * graves: place2.js (rows along the alley sides, a thinner fill between the alleys; zones, densities, archetype mix)
//  * ~7 000 trees at one per ~64 m2 (the dossier's 1 per 40-45 m2 is dropped: the crowns are scaled up to 1.0 .. 1.75 so the canopy still closes; the budget of docs/VO-BRIEF.md is 400 k triangles)
import * as L from '../layout.js';
import { CH, GA, RE, XE, TR, cemeteryRing } from './frame.js';
import { roadsInBox, barrierPts, nodes as barrierNodes } from './data.js';
import { hash2 } from './util.js';

const BOX = { x0: -6320, x1: -5300, z0: -1710, z1: -730 };
const WALK = new Set(['footway', 'path', 'pedestrian', 'track', 'service', 'cycleway']);
const inRing = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
const segDist = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };

/** a grid of segments for fast distance queries: cell 10 m */
class SegGrid {
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
class PointGrid {
  constructor(cell = 6) { this.c = cell; this.m = new Map(); }
  add(x, z, r) { const k = Math.floor(x / this.c) * 8192 + Math.floor(z / this.c); let l = this.m.get(k); if (!l) this.m.set(k, (l = [])); l.push([x, z, r]); }
  /** true when a point within dist + its own radius of (x, z) exists */
  near(x, z, dist) { const c = this.c, cx = Math.floor(x / c), cz = Math.floor(z / c); for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) { const l = this.m.get(ix * 8192 + iz); if (!l) continue; for (const p of l) if (Math.hypot(p[0] - x, p[1] - z) < dist + p[2]) return true; } return false; }
}

let _plan = null;
/** the plan is computed once (grounds.js and furniture.js share it) */
export function plan(ctx) { return _plan || (_plan = planOnce(ctx)); }
async function planOnce(ctx) {
  const ring = await cemeteryRing();
  if (!ring) return null;
  const n = ring.length;
  // ---- polygon edges: river edges 13 .. 27, fence / wall edges elsewhere (the Maly / Beringa fence: edges 0 .. 12)
  const edges = ring.map((p, i) => ({ a: p, b: ring[(i + 1) % n], river: i >= 13 && i <= 27, maly: i <= 12 }));
  const edgeInfo = (x, z) => { let best = 1e9, e = null; for (const E of edges) { const d = segDist(x, z, E.a, E.b); if (d < best) { best = d; e = E; } } return { d: best, river: e.river, maly: e.maly }; };
  // ---- alleys: mapped walkways whose vertices lie (mostly) inside the polygon
  const paths = [], grid = new SegGrid(10);
  const ways = roadsInBox(BOX.x0, BOX.x1, BOX.z0, BOX.z1, (r) => WALK.has(r.hw) && r.pts.length >= 4);
  for (const r of ways) {
    const pts = []; let inside = 0;
    for (let i = 0; i < r.pts.length; i += 2) { pts.push([r.pts[i], r.pts[i + 1]]); if (inRing(ring, r.pts[i], r.pts[i + 1])) inside++; }
    if (inside < pts.length * 0.6 || r.sub === 'sidewalk' || r.hw === 'steps') continue;
    const asphalt = r.surface === 'asphalt', hw = Math.max(asphalt ? 1.75 : 1.25, (r.w || 0) / 2);
    paths.push({ id: r.id, name: r.name || '', pts, w: hw * 2, surface: r.surface || '', hw, hwClass: r.hw });
    for (let i = 0; i + 1 < pts.length; i++) grid.add(pts[i], pts[i + 1], hw, r.id);
  }
  // ---- clear zones: the church apron, the Xenia plaza, the gate yard, the Resurrection lot, discs round the small sights
  const polyW = (f, pts) => pts.map(([u, v]) => { const q = f.W(u, v); return [q.x, q.z]; });
  const zones = [
    polyW(CH, [[-2, -27], [48, -27], [48, 0], [-2, 0]]),                                                 // the asphalt apron in front of the Smolensk church (between the alley and the portico)
    polyW(XE, [[-3, -3], [16.7, -3], [16.7, 12.8], [-3, 12.8]]),                                         // the chapel and its immediate surroundings
    polyW(GA, [[-34, -26], [-0.5, -26], [-0.5, 32], [-34, 32]]),                                         // the gate yard on Kamskaya st.
    polyW(RE, [[-4, -3], [40, -3], [40, 50], [-4, 50]]),                                                 // the Resurrection church and its lot (the lot is a lawn with a path)
  ].filter((z) => z.length);
  const plaza = (await import('./data.js')).roadPts('w101415904');
  if (plaza) zones.push(plaza.map((p) => p.slice()));
  const discs = [[TR.x, TR.z, 6.5], [-5651.6, -1174.2, 6], [-5612.1, -1470.1, 4], [-5618.2, -1486.8, 3]];       // the Trinity chapel, the Finland Regiment memorial, the church shop, the Shevchenko boulder
  for (const n of barrierNodes()) if ((n.kind === 'gate' || n.kind === 'lift_gate') && n.x > BOX.x0 && n.x < BOX.x1 && n.z > BOX.z0 && n.z < BOX.z1) discs.push([n.x, n.z, 3.4]);      // keep every gate passage clear
  const inZone = (x, z, m = 0) => { for (const zn of zones) if (inRing(zn, x, z)) return true; for (const d of discs) if (Math.hypot(x - d[0], z - d[1]) < d[2] + m) return true; return false; };
  const inside = (x, z, m) => inRing(ring, x, z) && edgeInfo(x, z).d >= m;
  // ---- trees: jittered grid of 8 m
  const SP = 8.0, trees = [], tGrid = new PointGrid(6);
  const bx0 = Math.floor(BOX.x0 / SP) * SP, bz0 = Math.floor(BOX.z0 / SP) * SP;
  const fam = (h, nearRiver, h2) => {
    if (nearRiver) return h < 0.4 ? 'elm' : h < 0.7 ? 'ash' : h < 0.9 ? 'mapleA' : 'birchA';
    if (h < 0.3) return 'limeA'; if (h < 0.55) return 'mapleA'; if (h < 0.72) return 'birchA';
    if (h < 0.8) return 'ash'; if (h < 0.88) return 'elm'; if (h < 0.93) return 'oak'; return 'spruceA';
  };
  for (let ix = 0; ix * SP < BOX.x1 - BOX.x0 + SP; ix++) for (let iz = 0; iz * SP < BOX.z1 - BOX.z0 + SP; iz++) {
    const gx = Math.floor(bx0 / SP) + ix, gz = Math.floor(bz0 / SP) + iz;
    const x = (gx + 0.5 + (hash2(gx, gz, 11) - 0.5) * 0.92) * SP, z = (gz + 0.5 + (hash2(gx, gz, 12) - 0.5) * 0.92) * SP;
    if (!inRing(ring, x, z)) continue;
    const ei = edgeInfo(x, z);
    if (ei.d < (ei.river ? 7.5 : 2.6)) continue;
    if (ei.maly && ei.d < 9 && hash2(gx, gz, 13) > 0.25) continue;
    if (inZone(x, z, 1) || L.insideBuilding(x, z, 4)) continue;
    if (grid.gap(x, z) < 1.4) continue;
    if (hash2(gx, gz, 14) < 0.06) continue;                                                              // a few open spots (plots without trees)
    const f = fam(hash2(gx, gz, 15), ei.river && ei.d < 20, hash2(gx, gz, 16)), F = f;
    const s = 1.05 + hash2(gx, gz, 17) * 0.7, rgbJ = 0.9 + hash2(gx, gz, 18) * 0.2;
    trees.push({ x, z, fam: F, s, sy: s * (0.95 + hash2(gx, gz, 19) * 0.2), yaw: hash2(gx, gz, 20) * 6.283, br: rgbJ, tr: 0 });
    tGrid.add(x, z, 0.5);
  }
  const forestShrubs = [];
  for (let ix = 0; ix * SP < BOX.x1 - BOX.x0 + SP; ix++) for (let iz = 0; iz * SP < BOX.z1 - BOX.z0 + SP; iz++) {
    const gx = Math.floor(bx0 / SP) + ix, gz = Math.floor(bz0 / SP) + iz;
    if (hash2(gx, gz, 51) > 0.34) continue;
    const x = (gx + hash2(gx, gz, 52)) * SP, z = (gz + hash2(gx, gz, 53)) * SP;
    if (!inRing(ring, x, z)) continue;
    const ei = edgeInfo(x, z);
    if (ei.d < (ei.river ? 7 : 2.4) || inZone(x, z, 0.5) || L.insideBuilding(x, z, 2.5) || grid.gap(x, z) < 0.9 || tGrid.near(x, z, 1.2)) continue;
    forestShrubs.push({ x, z, fam: 'shrub', s: 0.8 + hash2(gx, gz, 54) * 0.9, sy: 0.8 + hash2(gx, gz, 55) * 0.7, yaw: hash2(gx, gz, 56) * 6.283, br: 0.88 + hash2(gx, gz, 57) * 0.22, tr: 0 });
  }
  // ---- shrubs (hazel, elder, snowberry 1.5 m) at the alley edges
  const shrubs = [];
  for (const pth of paths) for (let i = 0; i + 1 < pth.pts.length; i++) {
    const a = pth.pts[i], b = pth.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1) continue;
    const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
    for (let s = hash2(i, l | 0, 31) * 6; s < l; s += 6 + hash2(i, s | 0, 32) * 6) for (const side of [-1, 1]) {
      const h = hash2((a[0] * 3) | 0, (s * 7 + side * 91) | 0, 33); if (h > 0.7) continue;
      const d = pth.hw + 0.45 + hash2((a[1] * 3) | 0, (s * 5) | 0, 34) * 0.7, x = a[0] + tx * s - tz * side * d, z = a[1] + tz * s + tx * side * d;
      if (!inside(x, z, 3) || inZone(x, z, 0) || L.insideBuilding(x, z, 2.5) || grid.gap(x, z) < pth.hw * 0 + 0.2) continue;
      shrubs.push({ x, z, fam: 'shrub', s: 0.85 + hash2((x * 9) | 0, (z * 9) | 0, 35) * 0.7, sy: 0.85 + hash2((x * 7) | 0, (z * 7) | 0, 36) * 0.6, yaw: hash2((x * 5) | 0, (z * 5) | 0, 37) * 6.283, br: 0.9 + hash2((x * 3) | 0, (z * 3) | 0, 38) * 0.2, tr: 0 });
    }
  }
  // ---- graves: planned by place2.js (rows along the alleys + a thinner fill; the detailed field of gravefield.js); the old generic list is gone
  const graves = [];
  shrubs.push(...forestShrubs);
  return { ring, paths, grid, trees, shrubs, graves, edgeInfo, inside, inZone, tGrid, zones, discs };
}
export { SegGrid, PointGrid, inRing, segDist };
void barrierPts;
