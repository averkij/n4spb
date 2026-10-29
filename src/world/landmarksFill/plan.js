// landmarksFill/plan.js - THE PLAN of the district: where the planned streets run and which plots stand where (pure computation over the data and the layout, no three.js, deterministic).
// The land fill "Новый намыв" (OSM landuse=construction w1053534560) has no building and (west of x -7900) no street in OpenStreetMap: the module authors a believable young district under construction on it.
// THE FRAME. The coast of the fill runs from the north-east to the south-west (the Morskaya Embankment of the built east part runs the same way), so the planned grid is laid parallel to it:
//   world = A0 + s * D1 + t * D2,  s along the coast (north-east -> south-west), t inland (towards the south-east); A0 = the coast vertex (-8047, -3507) of the OSM outline.
//   Avenues (a street along s) at t = 120 (the embankment roadbed), 340, 570, 800; cross streets (along t) every 260 m of s from -200. The roads exist as haul-road roadbeds of fine gravel (decals), nothing is drawn
//   where a real road, a building, a green / parking polygon or the water is: a planned street is cut where it meets one (roads: `piece` lists).
//   Plots (sites of ~96 x 140 m, one or two per block) are chosen by their distance to the built corner of the fill (s -100, t 520): the nearest are topped-out frames with their cladding half done, then frames, then
//   foundation fields, container yards, one concrete batching plant, the rest is graded ground. Every position is tested with free(): inside the fill, off real roads / footways / buildings, off the green and
//   parking polygons, off the view poses and the start, and AT LEAST 40 m FROM THE WATER (water is walkable and drivable: nothing of the module stands on or walls off a shore).
import * as L from '../layout.js';
import { LANDUSE, GREEN, PARKING } from '../data/city.js';
import { GARAGE } from '../lib/area-tables.js';

export const A0 = [-8047, -3507];
export const D1 = [-0.8187, 0.5740];
export const D2 = [0.5740, 0.8187];
export const ROT = Math.atan2(-D1[1], D1[0]);                      // three.js rotY that turns a local +x to D1
export const W = (s, t) => [A0[0] + s * D1[0] + t * D2[0], A0[1] + s * D1[1] + t * D2[1]];
export const ST = (x, z) => { const dx = x - A0[0], dz = z - A0[1]; return [dx * D1[0] + dz * D1[1], dx * D2[0] + dz * D2[1]]; };
/** local (lx, lz) of a plot frame (centre cx, cz, yaw rot) -> world */
export const toWorld = (cx, cz, rot, lx, lz) => { const c = Math.cos(rot), s = Math.sin(rot); return [cx + lx * c + lz * s, cz - lx * s + lz * c]; };

export const AVENUES = [{ t: 120, w: 26, name: 'embankment' }, { t: 340, w: 18 }, { t: 570, w: 18 }, { t: 800, w: 16 }];
export const CROSS = [-200, 60, 320, 580, 840, 1100, 1360];
export const CROSS_W = 14;

const FILL_ID = 'w1053534560';
const WATER_MARGIN = 40;
const bboxOf = (o) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < o.length; i += 2) { x0 = Math.min(x0, o[i]); x1 = Math.max(x1, o[i]); z0 = Math.min(z0, o[i + 1]); z1 = Math.max(z1, o[i + 1]); } return [x0, x1, z0, z1]; };
const ringHas = (o, x, z) => { let c = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) c = !c; return c; };

export function makePlan(ctx) {
  const fillRec = LANDUSE.find((u) => u.id === FILL_ID);
  const fill = fillRec ? fillRec.polys[0].o : null;
  const fillBox = fill ? bboxOf(fill) : [0, 0, 0, 0];
  const blocked = [];                                                  // green and parking polygons: [bbox, ring]
  for (const g of GREEN.concat(PARKING)) for (const p of g.polys || []) { const b = bboxOf(p.o); if (b[1] < fillBox[0] - 30 || b[0] > fillBox[1] + 30 || b[3] < fillBox[2] - 30 || b[2] > fillBox[3] + 30) continue; blocked.push([b, p.o]); }
  const keepClear = [];                                                // the start, the view poses, the car
  const addClear = (p, r) => { if (p && Number.isFinite(p.x) && Number.isFinite(p.z)) keepClear.push([p.x, p.z, r]); };
  addClear(L.HERO, 24); for (const v of L.VIEWS || []) addClear(v, 24);
  addClear(GARAGE && GARAGE.spawn, 24);

  const waterNear = (x, z, R) => {
    if (L.waterLevelAt(x, z) != null) return true;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; if (L.waterLevelAt(x + Math.cos(a) * R, z + Math.sin(a) * R) != null || L.waterLevelAt(x + Math.cos(a) * R * 0.5, z + Math.sin(a) * R * 0.5) != null) return true; }
    return false;
  };
  /** is the point (with a margin r) free ground of the fill: o.water = the distance kept from the water (default 40 m), o.clear = skip the view poses */
  function free(x, z, r = 0, o = {}) {
    if (!fill || !ringHas(fill, x, z)) return false;
    if (L.insideBuilding(x, z, r + 1)) return false;
    if (L.isOnRoad(x, z, r + 1, { all: true })) return false;
    if (waterNear(x, z, o.water ?? WATER_MARGIN)) return false;
    if (o.clear !== false) for (const [px, pz, pr] of keepClear) if (Math.hypot(px - x, pz - z) < pr + r) return false;
    for (const [b, ring] of blocked) { if (x < b[0] - r || x > b[1] + r || z < b[2] - r || z > b[3] + r) continue; if (ringHas(ring, x, z)) return false; for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) if (r > 0 && ringHas(ring, x + dx, z + dz)) return false; }
    return true;
  }
  /** a rectangle (centre, half sizes, yaw) is free when a grid of samples is: every 7 m for the roads, buildings and polygons (a 4 m service way cannot slip between the samples), every 14 m for the water margin */
  function rectFree(cx, cz, hw, hd, rot, o = {}) {
    const n = Math.max(2, Math.ceil(hw * 2 / 7)), m = Math.max(2, Math.ceil(hd * 2 / 7));
    for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
      const [x, z] = toWorld(cx, cz, rot, -hw + 2 * hw * i / n, -hd + 2 * hd * j / m), wet = i % 2 === 0 && j % 2 === 0;
      if (!free(x, z, 1.5, { ...o, water: wet ? o.water : 0 })) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- roads: the planned streets, cut where they meet something
  const roads = [];                                                    // { pts: [x, z, ...], w, kind: 'avenue' | 'cross', ref }
  const addRun = (line, w, kind, ref) => {
    // line: [[s0, t0], [s1, t1]] sampled every 6 m; a sample is ok when the strip (centre + both edges) is free of real roads and buildings and 22 m clear of the water
    const [[s0, t0], [s1, t1]] = line, len = Math.hypot(s1 - s0, t1 - t0), n = Math.max(1, Math.round(len / 6));
    const ok = [];
    for (let i = 0; i <= n; i++) {
      const s = s0 + (s1 - s0) * i / n, t = t0 + (t1 - t0) * i / n; const [x, z] = W(s, t);
      let good = free(x, z, 1.5, { water: 22, clear: false });
      if (good) for (const side of [-1, 1]) { const [ex, ez] = W(s + (kind === 'cross' ? side * w / 2 : 0), t + (kind === 'avenue' ? side * w / 2 : 0)); if (!free(ex, ez, 0.5, { water: 14, clear: false })) { good = false; break; } }
      ok.push(good);
    }
    let start = -1;
    for (let i = 0; i <= n + 1; i++) {
      if (i <= n && ok[i]) { if (start < 0) start = i; continue; }
      if (start >= 0) {
        const end = i - 1;
        if ((end - start) * len / n >= 36) { const pts = []; for (let k = start; k <= end; k++) { const [x, z] = W(s0 + (s1 - s0) * k / n, t0 + (t1 - t0) * k / n); pts.push(Math.round(x * 10) / 10, Math.round(z * 10) / 10); } roads.push({ pts, w, kind, ref }); }
        start = -1;
      }
    }
  };
  const sMin = CROSS[0] - 120, sMax = CROSS[CROSS.length - 1] + 60, tMax = AVENUES[AVENUES.length - 1].t;
  for (const a of AVENUES) addRun([[sMin, a.t], [sMax, a.t]], a.w, 'avenue', a.t);
  for (const s of CROSS) addRun([[s, AVENUES[0].t], [s, tMax + 60]], CROSS_W, 'cross', s);

  // ---------------------------------------------------------------- sites
  const rng = ctx.rng('fill-plan-4');
  const SITE_W = 96, SITE_D = 140, BUILT = [-100, 520];
  const cand = [];
  for (let ci = 0; ci + 1 < CROSS.length; ci++) for (let ai = 0; ai + 1 < AVENUES.length; ai++) {
    const s0 = CROSS[ci] + CROSS_W / 2 + 16, s1 = CROSS[ci + 1] - CROSS_W / 2 - 16, t0 = AVENUES[ai].t + AVENUES[ai].w / 2 + 16, t1 = AVENUES[ai + 1].t - AVENUES[ai + 1].w / 2 - 16;
    const cols = Math.max(1, Math.floor((s1 - s0 + 12) / (SITE_W + 12))), rows = Math.max(1, Math.floor((t1 - t0 + 12) / (SITE_D + 12)));
    for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
      const w = Math.min(SITE_W, (s1 - s0 - 12 * (cols - 1)) / cols), d = Math.min(SITE_D, (t1 - t0 - 12 * (rows - 1)) / rows);
      const cs = s0 + w / 2 + a * (w + 12), ct = t0 + d / 2 + b * (d + 12), [cx, cz] = W(cs, ct);
      if (!rectFree(cx, cz, w / 2, d / 2, ROT, { water: 40 })) continue;
      cand.push({ id: `${ci}.${ai}.${a}.${b}`, cs, ct, cx, cz, w, d, dist: Math.hypot(cs - BUILT[0], ct - BUILT[1]) });
    }
  }
  cand.sort((p, q) => p.dist - q.dist);
  const TYPES = ['topped', 'topped', 'topped', 'frame', 'frame', 'frame', 'frame', 'pit', 'pit', 'yard', 'topped', 'frame', 'plant', 'pit', 'yard', 'yard'];
  const sites = cand.map((c, i) => ({ ...c, type: i < TYPES.length ? TYPES[i] : 'graded', rot: ROT, seed: 1000 + i * 37 }));
  // the unbuilt Morskaya Embankment roadbed is `roads` (avenue t = 120): the lamps along it
  return { free, rectFree, roads, sites, frame: { A0, D1, D2, ROT }, stats: { candidates: cand.length, roads: roads.length, roadLen: Math.round(roads.reduce((a, r) => { let l = 0; for (let i = 2; i < r.pts.length; i += 2) l += Math.hypot(r.pts[i] - r.pts[i - 2], r.pts[i + 1] - r.pts[i - 1]); return a + l; }, 0)) }, rng };
}
