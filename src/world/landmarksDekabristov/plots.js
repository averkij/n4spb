// landmarksDekabristov/plots.js - WHERE the graves of the detailed field stand: plots along the alleys and in the old quarters between them.  Adapted from landmarksSmolensky/place2.js (this repository; the same rows, the same
// fill, the same overlap tests, the same hashes): the zones / densities / clear strips of the Smolensky cemetery (its churches, its Maly fence) became the site's own functions (S.zoneAt, S.densityAt, S.keep), the
// fill reaches farther from an alley where the site has few alleys (S.fillReach, S.farFill: the Lutheran cemetery has 18 mapped footways on 9.5 ha), and a plot never stands in or within S.waterClear m of water (WATER RULE).
// Deterministic (cell hashes, no Math.random).  A plot faces the nearest alley, keeps its foot 0.35 m off the alley edge at least, never on a path, a building, a trunk, a shrub or another plot; the zone (A main alleys,
// B the old chapels, C old overgrown quarters, D newer rows, E periphery; gravearch.js ZW) chooses the archetype mix and the share of fenced plots.
import * as L from '../layout.js';
import { hash2 } from './util.js';
import { pickType, FENCED, plotInfo } from './gravearch.js';
import { PointGrid, inRing } from './plan.js';

/** oriented-rectangle plot overlap (separating axis test, margin m): a plot is hw x hl about its centre, long axis along its facing direction (sin rot, cos rot) */
class PlotGrid {
  constructor(cell = 5) { this.c = cell; this.m = new Map(); }
  add(p) { const k = Math.floor(p.x / this.c) * 8192 + Math.floor(p.z / this.c); let l = this.m.get(k); if (!l) this.m.set(k, (l = [])); l.push(p); }
  hit(p, margin = 0.15) {
    const c = this.c, cx = Math.floor(p.x / c), cz = Math.floor(p.z / c), ax = Math.sin(p.rot), az = Math.cos(p.rot);
    for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) {
      const l = this.m.get(ix * 8192 + iz); if (!l) continue;
      for (const q of l) {
        const dx = q.x - p.x, dz = q.z - p.z; if (dx * dx + dz * dz > 25) continue;
        const bx = Math.sin(q.rot), bz = Math.cos(q.rot);
        const axes = [[ax, az, p.hl, p.hw], [-az, ax, p.hw, p.hl], [bx, bz, q.hl, q.hw], [-bz, bx, q.hw, q.hl]];
        let sep = false;
        for (let i = 0; i < 4 && !sep; i++) {
          const [ux, uz] = axes[i], d = Math.abs(dx * ux + dz * uz);
          const rp = i < 2 ? (i === 0 ? p.hl : p.hw) : p.hl * Math.abs(ux * ax + uz * az) + p.hw * Math.abs(ux * -az + uz * ax);
          const rq = i >= 2 ? (i === 2 ? q.hl : q.hw) : q.hl * Math.abs(ux * bx + uz * bz) + q.hw * Math.abs(ux * -bz + uz * bx);
          if (d > rp + rq + margin) sep = true;
        }
        if (!sep) return true;
      }
    }
    return false;
  }
}

/** nearest alley segment: { gap (distance to the edge), px, pz (foot point) } or null within 30 m */
function nearest(grid, x, z) {
  const c = grid.c, cx = Math.floor(x / c), cz = Math.floor(z / c); let best = null;
  for (let ix = cx - 2; ix <= cx + 2; ix++) for (let iz = cz - 2; iz <= cz + 2; iz++) {
    const l = grid.m.get(ix * 8192 + iz); if (!l) continue;
    for (const i of l) {
      const s = grid.segs[i], a = s[0], b = s[1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz) - s[2];
      if (!best || d < best.gap) best = { gap: d, px: qx, pz: qz };
    }
  }
  return best;
}

/**
 * the plots: [{ x, z, rot, type, zone, v: [h0..h5], fence, fam, hw, hl }]
 * S = { zoneAt(x, z), densityAt(x, z, zone) (plots per hectare), keep: [ring..] (no plots), minEdge (3.5), fillReach (26), farFill (0.1), fillK (0.4), rows: { A: 3, ...}, waterClear (9) }
 */
export function planPlots(ctx, pl, S) {
  const t0 = performance.now(), plots = [], gGrid = new PlotGrid(5), shrubGrid = new PointGrid(4);
  for (const s of pl.shrubs) shrubGrid.add(s.x, s.z, 0.8 * s.s);
  const zoneAt = S.zoneAt, densityAt = S.densityAt, stats = { byZone: {}, byType: {}, fenced: 0, rows: 0, fill: 0, rej: { inside: 0, edge: 0, zone: 0, foot: 0, overlap: 0, dens: 0, water: 0 } }, R = stats.rej;
  const minEdge = S.minEdge ?? 3.5, reach = S.fillReach ?? 26, farFill = S.farFill ?? 0.1, fillK = S.fillK ?? 0.4, wClear = S.waterClear ?? 9;
  const boxes = []; for (const z of pl.zones) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const q of z) { a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); } boxes.push([a - 2, b + 2, c - 2, d + 2]); }
  for (const d of pl.discs) boxes.push([d[0] - d[2] - 2, d[0] + d[2] + 2, d[1] - d[2] - 2, d[1] + d[2] + 2]);
  const keepZ = (S.keep || []);
  for (const z of keepZ) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const q of z) { a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); } boxes.push([a - 2, b + 2, c - 2, d + 2]); }
  const inKeep = (x, z) => keepZ.some((zn) => inRing(zn, x, z));
  const nearZone = (x, z) => { for (const b of boxes) if (x > b[0] && x < b[1] && z > b[2] && z < b[3]) return true; return false; };
  // exact test: a trunk circle (its own radius) against the oriented plot rectangle
  const trunks = new Map(); for (const t of pl.trees) { if (!t.tr) continue; const k = Math.floor(t.x / 6) * 8192 + Math.floor(t.z / 6); let l = trunks.get(k); if (!l) trunks.set(k, (l = [])); l.push(t); }
  const trunkHit = (p) => {
    const ax = Math.sin(p.rot), az = Math.cos(p.rot), cx = Math.floor(p.x / 6), cz = Math.floor(p.z / 6);
    for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) {
      const l = trunks.get(ix * 8192 + iz); if (!l) continue;
      for (const t of l) { const dx = t.x - p.x, dz = t.z - p.z, a = dx * ax + dz * az, b = dx * az - dz * ax; if (Math.abs(a) < p.hl + t.tr + 0.05 && Math.abs(b) < p.hw + t.tr + 0.05) return true; }
    }
    return false;
  };
  /** try to place a plot of zone `zone` at (x, z) facing `rot`; seed ints (a, b) give the hashes; true when placed */
  const tryAdd = (x, z, rot, zone, a, b, kind) => {
    if (!inRing(pl.ring, x, z)) { R.inside++; return false; }
    if (pl.edgeD(x, z) < minEdge) { R.edge++; return false; }
    if (nearZone(x, z) && (pl.inZone(x, z, 1.5) || inKeep(x, z))) { R.zone++; return false; }
    if (L.insideBuilding(x, z, 3.5)) { R.zone++; return false; }
    if (pl.nearWater(x, z, wClear)) { R.water++; return false; }
    const v = [hash2(a, b, 111), hash2(a, b, 112), hash2(a, b, 113), hash2(a, b, 114), hash2(a, b, 115), hash2(a, b, 116)];
    const type = pickType(zone, hash2(a, b, 120)), fence = type !== 'chapel' && type !== 'tomb' && hash2(a, b, 117) < (FENCED[zone] ?? 0.3) ? 1 : 0;
    const fam = fence && zone !== 'D' && hash2(a, b, 118) < 0.2 && type !== 'wood' && type !== 'stele' ? 1 : 0;
    const p = { x, z, rot, type, zone, v, fence, fam };
    const info = plotInfo(p); p.hw = type === 'stele' || type === 'soviet' ? 0.56 : info.hw; p.hl = info.hl;
    if (pl.grid.gap(x, z) < p.hl + 0.4) { R.foot++; return false; }                          // the foot of the plot must clear the alley edge
    if (trunkHit(p)) { R.overlap++; return false; }
    const rr = type === 'chapel' ? 2.1 : fam ? 1.7 : 1.0;
    if (gGrid.hit(p) || pl.tGrid.near(x, z, rr + 0.1) || shrubGrid.near(x, z, rr * 0.5)) { R.overlap++; return false; }
    gGrid.add(p); plots.push(p); stats.byZone[zone] = (stats.byZone[zone] || 0) + 1; stats.byType[type] = (stats.byType[type] || 0) + 1; if (fence) stats.fenced++;
    if (kind === 'row') stats.rows++; else stats.fill++;
    return true;
  };
  // ---- rows along the alley sides
  const ROWS = { A: 3, B: 2, C: 3, D: 3, E: 1, ...(S.rows || {}) }, PITCH = { A: [0.3, 0.9], B: [0.3, 0.9], C: [0.5, 1.6], D: [0.15, 0.3], E: [1.5, 3.0] };
  for (const pth of pl.paths) for (let i = 0; i + 1 < pth.pts.length; i++) {
    const a = pth.pts[i], b = pth.pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 2) continue;
    const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
    for (const sd of [-1, 1]) {
      const seed = ((a[0] * 7 + a[1] * 13 + sd * 17) | 0) + i * 31;
      const rowCount = ROWS[zoneAt(a[0] + tx * len / 2, a[1] + tz * len / 2)] || 2;
      for (let k = 0; k < rowCount; k++) {
        let s = 0.4 + hash2(seed, k, 121) * 1.2;
        while (s < len - 0.4) {
          const px = a[0] + tx * s, pz = a[1] + tz * s, zone = zoneAt(px, pz), dens = densityAt(px, pz, zone);
          const slot = hash2(seed + (s * 10 | 0), k, 122), pw = PITCH[zone] || PITCH.C, hwN = zone === 'D' ? 0.56 : 0.62;
          const keep = Math.min(1, dens / 520) * (k === 0 ? 1.0 : k === 1 ? 0.85 : 0.55);
          const dK = pth.hw + 0.5 + 1.2 + k * (2.4 + 0.25 + hash2(seed, k, 123) * 0.5);                // centre distance: edge + clearance + hl + rows
          if (slot < keep) {
            const x = px - tz * sd * dK, z = pz + tx * sd * dK, rot = Math.atan2(px - x, pz - z) + (hash2(seed + (s * 10 | 0), k, 124) - 0.5) * 0.18;
            if (tryAdd(x, z, rot, zone, (x * 10) | 0, (z * 10) | 0, 'row')) { s += 2 * hwN + pw[0] + pw[1] * hash2(seed + (s * 10 | 0), k, 125); continue; }
          } else R.dens++;
          s += hwN + 0.45;                                                                          // an obstacle or a gap: try again half a plot further
        }
      }
    }
  }
  // ---- tufts of grass / goutweed along the alley edges (cards only: no collider, no overlap test)
  const nEdge0 = plots.length;
  for (const pth of pl.paths) for (let i = 0; i + 1 < pth.pts.length; i++) {
    const a = pth.pts[i], b = pth.pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 2) continue;
    const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
    for (const sd of [-1, 1]) for (let s = hash2((a[0] * 3) | 0, (a[1] * 3) | 0, 131 + sd) * 2; s < len; s += 1.8 + hash2((a[0] * 7 + s * 5) | 0, (a[1] * 7) | 0, 132) * 2.6) {
      const px = a[0] + tx * s, pz = a[1] + tz * s, d = pth.hw + 0.05 + hash2((a[0] * 5 + s * 3) | 0, (a[1] * 5) | 0, 133) * 0.45, x = px - tz * sd * d, z = pz + tx * sd * d;
      if (!inRing(pl.ring, x, z) || (nearZone(x, z) && pl.inZone(x, z, 0.3)) || pl.grid.gap(x, z) < 0.0 || pl.tGrid.near(x, z, 0.5)) continue;
      const k = ((x * 10) | 0), m = ((z * 10) | 0);
      plots.push({ x, z, rot: Math.atan2(px - x, pz - z), type: 'edge', zone: 'C', v: [hash2(k, m, 141), hash2(k, m, 142), hash2(k, m, 143), hash2(k, m, 144), hash2(k, m, 145), hash2(k, m, 146)], fence: 0, fam: 0, hw: 0.5, hl: 0.5 });
    }
  }
  stats.edge = plots.length - nEdge0;
  // ---- the thinner fill between the alleys (up to `reach` m from an alley)
  const Sg = 2.2, xs = pl.ring.map((p) => p[0]), zs = pl.ring.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs) / Sg), x1 = Math.ceil(Math.max(...xs) / Sg), z0 = Math.floor(Math.min(...zs) / Sg), z1 = Math.ceil(Math.max(...zs) / Sg);
  for (let gx = x0; gx < x1; gx++) for (let gz = z0; gz < z1; gz++) {
    const x = (gx + 0.5 + (hash2(gx, gz, 101) - 0.5) * 0.9) * Sg, z = (gz + 0.5 + (hash2(gx, gz, 102) - 0.5) * 0.9) * Sg;
    if (!inRing(pl.ring, x, z)) continue;
    const zone = zoneAt(x, z), p0 = densityAt(x, z, zone) / (10000 / (Sg * Sg)) * fillK;
    if (hash2(gx, gz, 103) > p0) continue;
    const nr = nearest(pl.grid, x, z);
    if (!nr || nr.gap > reach) { if (hash2(gx, gz, 104) > farFill) continue; }
    const rot = nr ? Math.atan2(nr.px - x, nr.pz - z) + (hash2(gx, gz, 119) - 0.5) * 0.5 : hash2(gx, gz, 119) * 6.283;
    tryAdd(x, z, rot, zone, gx, gz, 'fill');
  }
  stats.ms = Math.round(performance.now() - t0); stats.count = plots.length;
  return { plots, stats };
}
