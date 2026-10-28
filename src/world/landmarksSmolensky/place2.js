// landmarksSmolensky/place2.js - WHERE the graves of the detailed field stand (docs/research/smolensky-detail.md section 2): plots along the alleys and in the old quarters between them.
// Deterministic (cell hashes, no Math.random), data driven from the plan of place.js (alleys, trunks, shrubs, clear zones, buildings, the polygon).  Rules:
//  * density by zone (plots per hectare): the old east third round the church 560, the middle 330, the west 90-160, patches of newer rows (zone D: polished black stelae shoulder to shoulder, 2.3x more) ;
//    no plot within 12 m of the Maly / Beringa fence (the cleared strip, photo sd045), none within 9 m of the river edge, none in a clear zone (apron, plaza, gate yard, the lot of the Resurrection church)
//  * a plot faces the nearest alley (the monument looks at the path), keeps its foot 0.35 m off the alley edge at least, never on a path, a building, a trunk, a shrub or another plot
//  * the zone (A main alleys by the Smolensk church, B the Xenia chapel, C old overgrown quarters, D newer rows, E periphery) chooses the archetype mix (gravearch.js ZW) and the share of fenced plots
import * as L from '../layout.js';
import { hash2 } from './util.js';
import { pickType, FENCED, plotInfo } from './gravearch.js';
import { PointGrid, inRing } from './place.js';
import { CH, RE } from './frame.js';

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
        // axes: a (long of p), a-perp, b (long of q), b-perp; extents (half sizes along long / across) of both
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

const CHURCH = [-5612, -1500], XENIA = [-5586, -1325], CORE = [-5560, -1470];
const vnoise = (x, z, s, seed) => { const gx = Math.floor(x / s), gz = Math.floor(z / s), fx = x / s - gx, fz = z / s - gz, u = fx * fx * (3 - 2 * fx), w = fz * fz * (3 - 2 * fz); const h = (a, b) => hash2(gx + a, gz + b, seed); return (h(0, 0) * (1 - u) + h(1, 0) * u) * (1 - w) + (h(0, 1) * (1 - u) + h(1, 1) * u) * w; };

export function zoneAt(x, z) {
  const dc = Math.hypot(x - CHURCH[0], z - CHURCH[1]), dx = Math.hypot(x - XENIA[0], z - XENIA[1]);
  if (dx < 48) return 'B';
  if (dc < 95) return 'A';
  const dcore = Math.hypot(x - CORE[0], z - CORE[1]);
  if (dcore > 170 && vnoise(x, z, 70, 7) > (x < -5950 ? 0.64 : 0.76)) return 'D';
  return 'C';
}
export function densityAt(x, z, zone) {
  const dcore = Math.hypot(x - CORE[0], z - CORE[1]);
  let d = dcore < 150 ? 720 : dcore < 260 ? 720 - (dcore - 150) * 3.2 : dcore < 450 ? 370 - (dcore - 260) * 1.0 : 140 - Math.min(60, (dcore - 450) * 0.1);
  d *= 0.6 + 0.8 * vnoise(x, z, 45, 3);
  if (zone === 'D') d = Math.max(d, 240) * 1.5;
  return d;
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

/** the plots: [{ x, z, rot, type, zone, v: [h0..h5], fence, fam, hw, hl }]
 *  Rows along every alley side (the first two or three rows are shoulder to shoulder, the photos sd099 / sd204 / sd302 / sd083), then a thinner fill between the alleys. */
export function planPlots(ctx, pl) {
  const t0 = performance.now(), plots = [], gGrid = new PlotGrid(5), shrubGrid = new PointGrid(4);
  for (const s of pl.shrubs) shrubGrid.add(s.x, s.z, 0.8 * s.s);
  const stats = { byZone: {}, byType: {}, fenced: 0, rows: 0, fill: 0, rej: { inside: 0, edge: 0, zone: 0, foot: 0, overlap: 0, dens: 0 } }, R = stats.rej;
  // bounding boxes of the clear zones and discs (+ 2 m): the exact test only inside one
  const boxes = []; for (const z of pl.zones) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const q of z) { a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); } boxes.push([a - 2, b + 2, c - 2, d + 2]); }
  for (const d of pl.discs) boxes.push([d[0] - d[2] - 2, d[0] + d[2] + 2, d[1] - d[2] - 2, d[1] + d[2] + 2]);
  // the walk round the Smolensk church (apse, north side) and the Resurrection church stays free of plots
  const ringW = (f, pts) => pts.map(([u, v]) => { const q = f.W(u, v); return [q.x, q.z]; });
  const keep = [ringW(CH, [[-8, -3], [52, -3], [52, 33], [-8, 33]]), ringW(RE, [[-8, -6], [42, -6], [42, 52], [-8, 52]])];
  for (const z of keep) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const q of z) { a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); } boxes.push([a - 2, b + 2, c - 2, d + 2]); }
  const inKeep = (x, z, m) => keep.some((zn) => inRing(zn, x, z));
  const nearZone = (x, z) => { for (const b of boxes) if (x > b[0] && x < b[1] && z > b[2] && z < b[3]) return true; return false; };
  // review 2026-10-09: the planning grid kept every trunk 0.5 m + the plot radius away, but the real collision radius of a big lime / spruce is up to 1.0 m: 109 of 13 237 plots reached into a trunk.
  // Exact test: a trunk circle (its own radius) against the oriented plot rectangle.
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
    const ei = pl.edgeInfo(x, z);
    if (ei.river ? ei.d < 9 : ei.maly ? ei.d < 12 : ei.d < 3.5) { R.edge++; return false; }
    if (nearZone(x, z) && (pl.inZone(x, z, 1.5) || inKeep(x, z))) { R.zone++; return false; }
    if (L.insideBuilding(x, z, 3.5)) { R.zone++; return false; }
    const v = [hash2(a, b, 111), hash2(a, b, 112), hash2(a, b, 113), hash2(a, b, 114), hash2(a, b, 115), hash2(a, b, 116)];
    // review 2026-10-09: the type used to be picked from v[0], the SAME number that gravearch.js uses as the sub-variant key inside a type (aedicule / canopy / gazebo / white chapel, sarcophagus, column and urn,
    // Soviet stele with a pebble face, gabled wooden cross, stone tint ...): a type owns a narrow band of v[0], so only ONE variant of each ever appeared (every chapel-tomb was the red-granite pavilion, no black or
    // grey stelae in the old zones, no aedicule).  The type now comes from its own hash (120), v[0] stays free.
    const type = pickType(zone, hash2(a, b, 120)), fence =type !== 'chapel' && type !== 'tomb' && hash2(a, b, 117) < (FENCED[zone] ?? 0.3) ? 1 : 0;
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
  const ROWS = { A: 3, B: 2, C: 3, D: 3, E: 1 }, PITCH = { A: [0.3, 0.9], B: [0.3, 0.9], C: [0.5, 1.6], D: [0.15, 0.3], E: [1.5, 3.0] };
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
  // ---- the thinner fill between the alleys (up to 26 m from an alley)
  const S = 2.2, xs = pl.ring.map((p) => p[0]), zs = pl.ring.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs) / S), x1 = Math.ceil(Math.max(...xs) / S), z0 = Math.floor(Math.min(...zs) / S), z1 = Math.ceil(Math.max(...zs) / S);
  for (let gx = x0; gx < x1; gx++) for (let gz = z0; gz < z1; gz++) {
    const x = (gx + 0.5 + (hash2(gx, gz, 101) - 0.5) * 0.9) * S, z = (gz + 0.5 + (hash2(gx, gz, 102) - 0.5) * 0.9) * S;
    const zone = zoneAt(x, z), p0 = densityAt(x, z, zone) / (10000 / (S * S)) * 0.4;
    if (hash2(gx, gz, 103) > p0) continue;
    const nr = nearest(pl.grid, x, z);
    if (!nr || nr.gap > 26) { if (hash2(gx, gz, 104) > 0.1) continue; }
    const rot = nr ? Math.atan2(nr.px - x, nr.pz - z) + (hash2(gx, gz, 119) - 0.5) * 0.5 : hash2(gx, gz, 119) * 6.283;
    tryAdd(x, z, rot, zone, gx, gz, 'fill');
  }
  stats.ms = Math.round(performance.now() - t0); stats.count = plots.length;
  return { plots, stats };
}
