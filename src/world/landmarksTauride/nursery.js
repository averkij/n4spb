// landmarksTauride/nursery.js - THE GARDEN NURSERY (docs/TAURIDE-REMAKE.md, phase T8b, a user fix): the lot north-west of the garden (data/nursery.js LOT_RING) made to look like the user's air photo of the old nursery:
//   * the FLOOR: brown earth and sandy gravel with a gravel track network, the dark soil under the glasshouses, a lighter gravel yard at the west end, patches of dry grass; one flat mesh over the lot ring (the generic yard ground of the
//     environment is cut out under it, HOOKS.groundHoles, hooks/ground.js), painted by its own toon material from a 1 m mask (planNurseryMask: R track, G house soil, B yard, A dry grass) and the garden's noise tile.
//   * NINE GLASSHOUSES (seven long ones along x in two groups of three with one wide house between them, two across the east end on each side of a concrete box): a low concrete plinth, a steel-rib frame (flat strips for the posts,
//     rafters and glazing bars, boxes for the plinth, the eave rails and the ridge), a shallow gable, ~900 panes each of which exists or not by a deterministic hash (about a quarter exist: the photo shows a grey-blue lattice
//     of ribs with the dark ground showing through); ONE box collider per house (not enterable).
//   * the three buildings of the lot that the generic city drew as 4-storey yellow blocks (OSM gives no height): two concrete boxes and the long annex along the north edge, CLAIMED (groups.js `tauride-nursery`) and drawn here low
//     and plain, each with its collider; big leafless trees between the houses, inside them and round the lot (<= 260 instances, ONE instanced mesh), the classical buildings of the yard (the real rings, hipped blue-green roofs), two piles of earth and two stacks of crates.
// planNursery(opts) is PURE and DETERMINISTIC (no three.js object, no Math.random); buildNursery(ctx, parent, plan, noise) draws it in 5 draws (floor, frames, glass, trees, buildings + details).
import * as THREE from 'three';
import { registerLOD } from '../../core/spatial.js';
import { FAR_FOG } from '../environment/farconf.js';
import { GB } from './fence.js';
import * as ND from './data/nursery.js';
import { LEAF } from './data/vegetation.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
/** a deterministic hash of three integers -> [0, 1) */
export function h3(a, b, c) { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296; }

export const NURSERY = Object.freeze({ res: 1, pad: 3, far: 650, soilFeather: 0.7, yardFeather: 1.5, trackSoft: 1.0, dryFeather: 1.6, noiseSize: 128 });

// ---------------------------------------------------------------------------------------------------------------- the plan (pure)
/** the oriented box of a polygon: the direction of its longest edge, the extents of the vertices on it -> { cx, cz, len, dep, theta (atan2(dz, dx) of the long axis, in (-pi/2, pi/2]) } */
export function obbOf(o) {
  let best = 0, bx = 1, bz = 0;
  for (let i = 0; i < o.length; i += 2) { const j = (i + 2) % o.length, dx = o[j] - o[i], dz = o[j + 1] - o[i + 1], l = Math.hypot(dx, dz); if (l > best) { best = l; bx = dx / l; bz = dz / l; } }
  if (bx < 0 || (Math.abs(bx) < 1e-9 && bz < 0)) { bx = -bx; bz = -bz; }
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (let i = 0; i < o.length; i += 2) { const u = o[i] * bx + o[i + 1] * bz, v = -o[i] * bz + o[i + 1] * bx; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
  return { cx: um * bx - vm * bz, cz: um * bz + vm * bx, len: u1 - u0, dep: v1 - v0, theta: Math.atan2(bz, bx) };
}

/** one glasshouse: the rectangle, the bays and the panes. Local frame of the house: x across (v), z along (u), y up; the pane quads are in it. `exists` is the deterministic hash decision. */
export function planHouse(h, H = ND.HOUSE) {
  const L = h.len, W = h.wid, hw = W / 2, nc = Math.max(2, Math.round(L / H.pane)), pu = L / nc, bays = Math.round(L / H.bay);
  const ncv = Math.max(2, 2 * Math.round(W / H.pane / 2)), pv = W / ncv;
  const axis = h.axis, yaw = axis === 'x' ? Math.PI / 2 : 0;
  const rect = axis === 'x' ? { x0: h.c[0] - L / 2, x1: h.c[0] + L / 2, z0: h.c[1] - hw, z1: h.c[1] + hw } : { x0: h.c[0] - hw, x1: h.c[0] + hw, z0: h.c[1] - L / 2, z1: h.c[1] + L / 2 };
  const panes = [];
  const slopeY = (t) => H.eave + (H.ridge - H.eave) * t;
  /** the share of existing panes: the base of the house modulated by a coarse patch noise (mean 1) so that the intact panes come in groups */
  const exists = (kind, side, row, col) => {
    const patch = h3(Math.floor(col / 6), Math.floor(row / 3) + 7 * kind, side * 101 + h.seed);
    const p = clamp(h.pIntact * (0.2 + 1.6 * patch), 0, 1);
    return h3(col, row + 11 * kind, side * 131 + h.seed * 7) < p;
  };
  const wallY = (k) => H.plinth + (H.eave - H.plinth) * k / H.rowsWall;
  for (const s of [-1, 1]) {
    for (let r = 0; r < H.rowsWall; r++) for (let c = 0; c < nc; c++) {
      const ua = -L / 2 + c * pu, ub = ua + pu, ya = wallY(r), yb = wallY(r + 1);
      panes.push({ kind: 0, side: s, row: r, col: c, ex: exists(0, s, r, c), q: [[s * hw, ya, ua], [s * hw, ya, ub], [s * hw, yb, ub], [s * hw, yb, ua]], out: [s, 0, 0] });
    }
    for (let r = 0; r < H.rowsRoof; r++) for (let c = 0; c < nc; c++) {
      const ua = -L / 2 + c * pu, ub = ua + pu, t0 = r / H.rowsRoof, t1 = (r + 1) / H.rowsRoof;
      const P0 = (t, u) => [s * hw * (1 - t), slopeY(t), u];
      panes.push({ kind: 1, side: s, row: r, col: c, ex: exists(1, s, r, c), q: [P0(t0, ua), P0(t0, ub), P0(t1, ub), P0(t1, ua)], out: [s * (H.ridge - H.eave), hw, 0] });
    }
  }
  for (const e of [-1, 1]) {
    const side = e * 2;                                                                                                // the end walls have their own sides (+-2)
    for (let r = 0; r < H.rowsWall; r++) for (let c = 0; c < ncv; c++) {
      const va = -hw + c * pv, vb = va + pv, ya = wallY(r), yb = wallY(r + 1);
      panes.push({ kind: 2, side, row: r, col: c, ex: exists(2, side, r, c), q: [[va, ya, e * L / 2], [vb, ya, e * L / 2], [vb, yb, e * L / 2], [va, yb, e * L / 2]], out: [0, 0, e] });
    }
    for (let c = 0; c < ncv; c++) {                                                                                    // the gable triangle in columns: trapezoids under the roof line
      const va = -hw + c * pv, vb = va + pv, top = (v) => slopeY(1 - Math.abs(v) / hw);
      panes.push({ kind: 3, side, row: 0, col: c, ex: exists(3, side, 0, c), q: [[va, H.eave, e * L / 2], [vb, H.eave, e * L / 2], [vb, top(vb), e * L / 2], [va, top(va), e * L / 2]], out: [0, 0, e] });
    }
  }
  let intact = 0; for (const p of panes) if (p.ex) intact++;
  return { id: h.id, cx: h.c[0], cz: h.c[1], len: L, wid: W, axis, yaw, rect, bays, nc, pu, ncv, pv, pIntact: h.pIntact, seed: h.seed, panes, paneCount: panes.length, intact };
}

/** the whole plan of the lot (pure, deterministic): the ring, the houses with their panes, the sheds and the annex (boxes), the tracks, the trees, the piles and the crates, the colliders, the numbers */
export function planNursery(o = {}) {
  const D = o.D || ND;
  const houses = D.HOUSES.map((h) => planHouse(h, D.HOUSE));
  const buildings = D.SHEDS.map((s) => ({ ...s, ...obbOf(s.o) }));
  const colliders = [];
  for (const h of houses) colliders.push({ id: h.id, x: h.cx, z: h.cz, w: h.axis === 'x' ? h.len : h.wid, d: h.axis === 'x' ? h.wid : h.len, rotY: 0, y0: D.HOUSE.collider.y0, y1: D.HOUSE.collider.y1 });
  for (const b of buildings) colliders.push({ id: b.id, x: b.cx, z: b.cz, w: b.len, d: b.dep, rotY: -b.theta, y0: -0.5, y1: b.h + (b.ridge || 0) });
  // the classical buildings of the yard: the real ring for the walls, one collider box per wing (the courtyard stays open)
  const yardHouses = (D.YARD_HOUSES || []).map((y) => ({ ...y, rise: y.wings.map((w, i) => Math.min(w[1] - w[0], w[3] - w[2]) / 2 * ((y.slopes && y.slopes[i]) ?? y.slope)) }));
  for (const y of yardHouses) y.wings.forEach((w, i) => colliders.push({ id: y.id + '#' + i, x: (w[0] + w[1]) / 2, z: (w[2] + w[3]) / 2, w: w[1] - w[0], d: w[3] - w[2], rotY: 0, y0: -0.5, y1: y.h + y.rise[i] }));
  // ---- the trees: rows, jittered by the hash, kept off the houses, the buildings, the tracks, the piles and the crates
  const near = (rects, x, z, m) => rects.some((r) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m);
  const hrOf = (skipId) => houses.filter((h) => h.id !== skipId).map((h) => h.rect);
  const inObb = (b, x, z, m) => { const c = Math.cos(b.theta), sn = Math.sin(b.theta), dx = x - b.cx, dz = z - b.cz, u = dx * c + dz * sn, v = -dx * sn + dz * c; return Math.abs(u) < b.len / 2 + m && Math.abs(v) < b.dep / 2 + m; };
  const segD = (x, z, p) => { let m = Infinity; for (let i = 0; i + 3 < p.length; i += 2) { const dx = p[i + 2] - p[i], dz = p[i + 3] - p[i + 1], l2 = dx * dx + dz * dz, t = l2 ? clamp(((x - p[i]) * dx + (z - p[i + 1]) * dz) / l2, 0, 1) : 0; m = Math.min(m, Math.hypot(x - p[i] - t * dx, z - p[i + 1] - t * dz)); } return m; };
  const trees = [], T = D.TREE; let ti = 0;
  const free = (row, x, z) => {                                                                                                // a place is free when it is in the lot and clear of the houses (but the row's own), the buildings, the yard, the tracks, the piles and the crates
    if (!D.inNursery(x, z)) return false;
    if (near(hrOf(row.inside), x, z, 1.4 + T.crown * 0.5) || buildings.some((b) => inObb(b, x, z, 2)) || yardHouses.some((y) => y.wings.some((w) => x > w[0] - 3 && x < w[1] + 3 && z > w[2] - 3 && z < w[3] + 3))) return false;
    if (row.inside) { const r = houses.find((q) => q.id === row.inside).rect; if (!(x > r.x0 + T.crown && x < r.x1 - T.crown && z > r.z0 + T.crown * 0.6 && z < r.z1 - T.crown * 0.6)) return false; }          // an inside tree keeps its crown within the walls
    if (D.TRACKS.some((t) => segD(x, z, t.pts) < t.w / 2 + 0.7)) return false;
    if (D.PILES.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + 1.5) || D.CRATES.some((c) => Math.hypot(x - c.x, z - c.z) < 2.5)) return false;
    return true;
  };
  const plant = (row, x, z) => {
    ti++;
    const hr0 = row.h ? row.h[0] : T.h0, hr1 = row.h ? row.h[1] : T.h1, hgt = hr0 + (hr1 - hr0) * h3(ti, 3, 41), wd = T.wide[0] + (T.wide[1] - T.wide[0]) * h3(ti, 9, 53);
    trees.push({ x: +x.toFixed(3), z: +z.toFixed(3), h: +hgt.toFixed(3), w: +wd.toFixed(3), rot: +(h3(ti, 5, 43) * Math.PI * 2).toFixed(3), tint: +(0.86 + 0.26 * h3(ti, 7, 47)).toFixed(3), warm: +(h3(ti, 11, 59) - 0.5).toFixed(3), row: row.id });
  };
  for (const row of D.TREE_ROWS) {
    const dx = row.to[0] - row.from[0], dz = row.to[1] - row.from[1], len = Math.hypot(dx, dz), n = Math.floor(len / row.step) + 1, ux = dx / len, uz = dz / len;
    for (let i = 0; i < n; i++) {
      const j = (h3(i, ti, 31) - 0.5) * T.jitter, jp = (h3(i, ti, 37) - 0.5) * T.jitter, a = i * row.step + j;
      const x = row.from[0] + ux * a - uz * jp, z = row.from[1] + uz * a + ux * jp;
      ti++;
      if (h3(i, ti, 83) < (T.skip || 0)) continue;                                                                             // an empty place of the row
      if (!free(row, x, z)) continue;
      plant(row, x, z);
      if ((T.pair || 0) > 0 && h3(i, ti, 89) < T.pair) {                                                                        // a clump: a second tree close by
        const ang = h3(i, ti, 97) * Math.PI * 2, d = T.pairMin + (T.pairMax - T.pairMin) * h3(i, ti, 101), x2 = x + Math.cos(ang) * d, z2 = z + Math.sin(ang) * d;
        if (free(row, x2, z2)) plant(row, x2, z2);
      }
    }
  }
  if (trees.length > T.max) trees.length = T.max;
  const stats = { houses: houses.length, panes: houses.reduce((s, h) => s + h.paneCount, 0), intact: houses.reduce((s, h) => s + h.intact, 0), trees: trees.length, colliders: colliders.length, buildings: buildings.length, yardHouses: yardHouses.length, tracks: D.TRACKS.length };
  stats.intactShare = stats.intact / stats.panes;
  return { ring: D.LOT_RING.slice(), yard: D.YARD_RING.slice(), houses, buildings, tracks: D.TRACKS, trees, piles: D.PILES, crates: D.CRATES, yardHouses, colliders, stats, design: D.HOUSE, lift: D.FLOOR_LIFT };
}

// ---------------------------------------------------------------------------------------------------------------- the mask (pure)
/** The 1 m mask of the lot: R the gravel tracks (1 on the track, soft edge), G the soil under the houses, B the fenced yard, A the dry grass lanes. { box, data: Uint8Array(W * H * 4), stats } */
export function planNurseryMask(plan, T = NURSERY) {
  const res = T.res, B = ND.LOT_BOX, x0 = Math.floor(B[0]) - T.pad, z0 = Math.floor(B[2]) - T.pad, x1 = Math.ceil(B[1]) + T.pad, z1 = Math.ceil(B[3]) + T.pad;
  const W = Math.ceil((x1 - x0) / res), H = Math.ceil((z1 - z0) / res), N = W * H, data = new Uint8Array(N * 4);
  const box = { x0, z0, x1: x0 + W * res, z1: z0 + H * res, W, H, res };
  const inRing = (o, x, z) => { let c = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) c = !c; return c; };
  const ringD = (o, x, z) => { let m = Infinity; for (let i = 0; i < o.length; i += 2) { const ax = o[i], az = o[i + 1], bx = o[(i + 2) % o.length], bz = o[(i + 3) % o.length], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1) : 0; m = Math.min(m, Math.hypot(x - ax - t * dx, z - az - t * dz)); } return m; };
  const set = (k, c, v) => { const b = Math.round(clamp(v, 0, 1) * 255), o = k * 4 + c; if (b > data[o]) data[o] = b; };
  const cell = (i, j) => [x0 + (i + 0.5) * res, z0 + (j + 0.5) * res];
  // R: tracks (distance to the polyline; 1 inside the half width, 0 at half width + trackSoft)
  let trackCells = 0;
  for (const t of plan.tracks) {
    const p = t.pts, hw = t.w / 2;
    for (let s = 0; s + 3 < p.length; s += 2) {
      const ax = p[s], az = p[s + 1], bx = p[s + 2], bz = p[s + 3], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, m = hw + T.trackSoft;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - m - x0) / res)), i1 = Math.min(W - 1, Math.ceil((Math.max(ax, bx) + m - x0) / res)), j0 = Math.max(0, Math.floor((Math.min(az, bz) - m - z0) / res)), j1 = Math.min(H - 1, Math.ceil((Math.max(az, bz) + m - z0) / res));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const [px, pz] = cell(i, j), tt = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0, d = Math.hypot(px - ax - tt * dx, pz - az - tt * dz);
        if (d < m) set(j * W + i, 0, clamp((hw + T.trackSoft - d) / T.trackSoft, 0, 1));
      }
    }
  }
  // G: the soil under the houses (the rectangle, feathered outwards)
  for (const h of plan.houses) {
    const r = h.rect, f = T.soilFeather;
    const i0 = Math.max(0, Math.floor((r.x0 - f - x0) / res)), i1 = Math.min(W - 1, Math.ceil((r.x1 + f - x0) / res)), j0 = Math.max(0, Math.floor((r.z0 - f - z0) / res)), j1 = Math.min(H - 1, Math.ceil((r.z1 + f - z0) / res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const [px, pz] = cell(i, j), d = Math.max(r.x0 - px, px - r.x1, r.z0 - pz, pz - r.z1);          // > 0 outside
      set(j * W + i, 1, clamp(0.5 - d / f * 0.5 + (d <= 0 ? 0.5 : 0), 0, 1));
    }
  }
  // B: the yard (the fenced compound), soft inside the ring's edge
  { const o = plan.yard, f = T.yardFeather; let a = Infinity, b = -Infinity, c = Infinity, e = -Infinity; for (let i = 0; i < o.length; i += 2) { a = Math.min(a, o[i]); b = Math.max(b, o[i]); c = Math.min(c, o[i + 1]); e = Math.max(e, o[i + 1]); }
    const i0 = Math.max(0, Math.floor((a - f - x0) / res)), i1 = Math.min(W - 1, Math.ceil((b + f - x0) / res)), j0 = Math.max(0, Math.floor((c - f - z0) / res)), j1 = Math.min(H - 1, Math.ceil((e + f - z0) / res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const [px, pz] = cell(i, j), d = ringD(o, px, pz), ins = inRing(o, px, pz); const sd = ins ? d : -d; set(j * W + i, 2, clamp(0.5 + sd / f, 0, 1)); } }
  // A: the dry-grass lanes: the 8 m lanes between the houses of a group, the strip north of the last house, the compound of the orangery
  const lanes = [];
  const byZ = plan.houses.filter((h) => h.axis === 'x').sort((p, q) => p.cz - q.cz);
  for (let i = 0; i + 1 < byZ.length; i++) { const a = byZ[i], b = byZ[i + 1], gap = b.rect.z0 - a.rect.z1; if (gap > 0 && gap < 10) lanes.push({ x0: Math.min(a.rect.x0, b.rect.x0) - 0.5, x1: Math.max(a.rect.x1, b.rect.x1) + 0.5, z0: a.rect.z1, z1: b.rect.z0, k: 0.75 }); }
  lanes.push({ x0: 1013, x1: 1100, z0: -1773, z1: -1755, k: 0.65 }, { x0: 940, x1: 1000, z0: -1822, z1: -1755, k: 0.55 });
  for (const l of lanes) {
    const f = T.dryFeather, i0 = Math.max(0, Math.floor((l.x0 - f - x0) / res)), i1 = Math.min(W - 1, Math.ceil((l.x1 + f - x0) / res)), j0 = Math.max(0, Math.floor((l.z0 - f - z0) / res)), j1 = Math.min(H - 1, Math.ceil((l.z1 + f - z0) / res));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const [px, pz] = cell(i, j), d = Math.max(l.x0 - px, px - l.x1, l.z0 - pz, pz - l.z1); set(j * W + i, 3, l.k * clamp(1 - d / f, 0, 1)); }
  }
  let tr = 0, so = 0, yd = 0, dr = 0;
  for (let k = 0; k < N; k++) { const [px, pz] = cell(k % W, Math.floor(k / W)); if (!(ND.inNursery(px, pz))) continue; if (data[k * 4] >= 128) tr++; if (data[k * 4 + 1] >= 128) so++; if (data[k * 4 + 2] >= 128) yd++; if (data[k * 4 + 3] >= 128) dr++; }
  return { box, data, stats: { W, H, bytes: data.length, trackCells: tr, soilCells: so, yardCells: yd, dryCells: dr } };
}

// ---------------------------------------------------------------------------------------------------------------- the floor material (the garden's toon pattern: one category per pixel from noise fields)
const PRE = /* glsl */`
uniform sampler2D uMask; uniform sampler2D uNoise; uniform vec4 uMB; uniform vec2 uFogK;
uniform vec3 uE1; uniform vec3 uE2; uniform vec3 uE3; uniform vec3 uSand; uniform vec3 uPeb; uniform vec3 uTrackA; uniform vec3 uTrackB; uniform vec3 uYardA; uniform vec3 uYardB;
uniform vec3 uDry; uniform vec3 uDryB; uniform vec3 uSoilA; uniform vec3 uSoilB; uniform vec3 uWeed; uniform vec3 uMean;
vec4 gz(vec2 p, float s) { return texture2D(uNoise, p * s); }
`;
const BODY = /* glsl */`
{
  vec2 P = vPWorld.xz;
  float mpp = max(length(dFdx(P)), length(dFdy(P)));
  float patF = 1.0 - smoothstep(0.012, 0.085, mpp);                         // fine detail fades out with distance (no shimmer)
  vec4 M = texture2D(uMask, (P - uMB.xy) * uMB.zw);                          // R track, G soil under the houses, B yard, A dry grass
  vec2 Pw = P + (gz(P + vec2(17.0, 43.0), 0.019).rg - 0.5) * 5.0;           // the clump fields are read in a warped domain (the tile repeats every 2.7 m at 0.37 per metre)
  vec4 n2 = gz(Pw, 0.083);
  vec4 n3 = gz(vec2(Pw.x * 0.857 - Pw.y * 0.515, Pw.x * 0.515 + Pw.y * 0.857), 0.37);
  vec4 n4 = gz(P, 0.17);
  vec4 n5 = gz(P + (n4.rg - 0.5) * 0.8, 1.9);
  vec4 n6 = gz(vec2(P.x * 0.8746 + P.y * 0.4848, P.y * 0.8746 - P.x * 0.4848) + vec2(37.0, 11.0), 1.43);
  float nf = 0.5 * (n5.r + n6.r);
  // ---- summer lawn (the garden's greens): darker and lighter blotches, clover patches, light flecks
  vec3 col = mix(uE1, uE2, smoothstep(0.42, 0.66, n2.g));
  col = mix(col, uE3, smoothstep(0.64, 0.80, n3.r) * 0.55);
  col = mix(col, uSand, smoothstep(0.62, 0.76, n2.r) * 0.55 * (0.6 + 0.4 * n3.g));
  float peb = smoothstep(0.58, 0.72, n5.g) * smoothstep(0.46, 0.64, n6.b) * patF;
  col = mix(col, uSand * 1.1, peb * 0.35);
  col *= 0.93 + 0.14 * nf;
  // ---- the lush herb lanes
  float dk = M.a + (n2.g - 0.5) * 0.55 + (n3.b - 0.5) * 0.3;
  col = mix(col, mix(uDry, uDryB, smoothstep(0.35, 0.65, n3.g)) * (0.95 + 0.10 * nf), smoothstep(0.46, 0.62, dk) * 0.72);
  // ---- the yard: pale gravel
  float yk = smoothstep(0.45, 0.58, M.b + (n2.r - 0.5) * 0.35 + (n4.g - 0.5) * 0.15);
  col = mix(col, mix(uYardA, uYardB, smoothstep(0.35, 0.65, n3.r)) * (0.94 + 0.12 * nf), yk * 0.92);
  // ---- the gravel tracks
  float tk = smoothstep(0.42, 0.58, M.r + (n3.r - 0.5) * 0.35 + (n4.g - 0.5) * 0.14);
  vec3 tc = mix(uTrackA, uTrackB, smoothstep(0.38, 0.62, n3.g)) * (0.95 + 0.10 * nf);
  tc = mix(tc, uPeb * 1.05, peb * 0.4);
  col = mix(col, tc, tk * 0.96);
  // ---- the green crop beds under the glass, with taller herbs
  float sk = smoothstep(0.42, 0.58, M.g + (n4.g - 0.5) * 0.2 + (n5.r - 0.5) * 0.1);
  vec3 sc = mix(uSoilA, uSoilB, smoothstep(0.35, 0.65, n3.g)) * (0.88 + 0.24 * nf);
  float weed = smoothstep(0.62, 0.80, n5.g) * smoothstep(0.50, 0.70, n6.b) * patF;
  sc = mix(sc, uWeed, weed * 0.55);
  col = mix(col, sc, sk);
  // ---- far away the patchwork melts into its mean colour
  float dist = length(vViewPosition);
  col = mix(col, uMean, max(smoothstep(160.0, 1100.0, dist) * 0.8, smoothstep(120.0, 520.0, dist) * 0.35));
  diffuseColor.rgb = col;
}
`;
const FOG = /* glsl */`
#ifdef USE_FOG
  float efd = min(vFogDepth, uFogK.x) + uFogK.y * max(vFogDepth - uFogK.x, 0.0);
  float fogFactor = 1.0 - exp(-fogDensity * fogDensity * efd * efd);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
#endif
`;

/** the mask as a texture (RGBA8, bilinear + mipmaps, clamped) */
export function nurseryMaskTexture(mask) {
  const tex = new THREE.DataTexture(mask.data, mask.box.W, mask.box.H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.flipY = false; tex.needsUpdate = true;
  return tex;
}

/** the lot's floor material: a toon material (polygonOffset +2 like the environment ground and the garden floor) with its own onBeforeCompile */
export function nurseryFloorMaterial(ctx, mask, noise) {
  const maskTexture = nurseryMaskTexture(mask), b = mask.box;
  const mat = ctx.mat.toon('#ffffff', { paint: 0, polygonOffset: 2, name: 'tauride-nursery-floor' });
  const prev = mat.onBeforeCompile;
  const U = { uMask: { value: maskTexture }, uNoise: { value: noise }, uMB: { value: new THREE.Vector4(b.x0, b.z0, 1 / (b.W * b.res), 1 / (b.H * b.res)) }, uFogK: { value: new THREE.Vector2(FAR_FOG.D0, FAR_FOG.K) } };
  for (const [k, hex] of Object.entries(ND.FLOOR_COLORS)) U[k] = { value: new THREE.Color(hex) };
  mat.onBeforeCompile = (shader, renderer) => {
    if (prev) prev.call(mat, shader, renderer);
    Object.assign(shader.uniforms, U);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + PRE).replace('#include <map_fragment>', '#include <map_fragment>\n' + BODY).replace('#include <fog_fragment>', FOG);
  };
  mat.customProgramCacheKey = () => 'paint|tauride-nursery-floor-t8c-summer';
  mat.userData.tauride = 'nursery-floor';
  return { mat, uniforms: U, maskTexture };
}

// ---------------------------------------------------------------------------------------------------------------- the geometry (pure of the scene: GB builders)
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** a quad facing `out` (the winding is flipped when it faces away) */
function oq(g, a, b, c, d, out, col) { const n = cross(sub(b, a), sub(d, a)); if (dot(n, out) >= 0) g.quad(a, b, c, d, col); else g.quad(a, d, c, b, col); return g; }
/** a flat strip from A to B of width w lying in the plane with the normal `nrm` (a double-sided material shows both faces) */
function strip(g, A, B, w, nrm, col, off = 0) {
  const d = norm(sub(B, A)), s = mul(norm(cross(nrm, d)), w / 2), o = mul(norm(nrm), off);
  A = add3(A, o); B = add3(B, o);
  g.quad(sub(A, s), sub(B, s), add3(B, s), add3(A, s), col); return g;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return [c.r, c.g, c.b]; };

/** the frame and the plinth of ONE house into g (the placement is set by the caller), the existing panes into gl */
export function houseGeometry(g, gl, h, D = ND.HOUSE) {
  const L = h.len, W = h.wid, hw = W / 2, ph = D.plinth, e = D.eave, r = D.ridge, nc = h.nc, pu = h.pu, ncv = h.ncv, pv = h.pv;
  const k = 0.94 + 0.12 * h3(h.seed, 3, 5), cF = shade(D.frame, k), cD = shade(D.frameD, k), cB = shade(D.frame, k * 1.12);
  const slope = (s) => norm([s * (r - e), hw, 0]);
  // the plinth: the long sides and the ends, a darker lip on top
  const t = D.plinthT;
  g.box(-hw, -hw + t, 0, ph, -L / 2, L / 2, D.plinthC, 'b'); g.box(hw - t, hw, 0, ph, -L / 2, L / 2, D.plinthC, 'b');
  g.box(-hw + t, hw - t, 0, ph, -L / 2, -L / 2 + t, D.plinthC, 'blrb'); g.box(-hw + t, hw - t, 0, ph, L / 2 - t, L / 2, D.plinthC, 'blrb');         // the faces that touch the long sides are left out (no hidden coplanar pair)
  // the eave rails and the ridge beam
  for (const s of [-1, 1]) g.box(s * hw - 0.07, s * hw + 0.07, e - 0.07, e + 0.07, -L / 2, L / 2, cD, 'b');
  g.box(-0.08, 0.08, r - 0.04, r + 0.1, -L / 2, L / 2, cD, 'b');
  // the bars: the bay bars (every 2 m: the posts and the rafters) are wide, the glazing bars between them narrow
  // the strips that cross each other lie in the SAME plane: each kind stands on its own layer (0, 1.8, 3.6 cm out along the face normal) so that no two opaque surfaces are within 1 cm of each other (nursery-test: the coplanar-overlap scan)
  const lay = D.layer;
  for (let j = 0; j <= nc; j++) {
    const u = -L / 2 + j * pu, bay = j % Math.round(D.bay / pu) === 0, w = bay ? D.rafter * 1.5 : D.bar, col = bay ? cB : cF, off = bay ? lay[2] : lay[1];
    for (const s of [-1, 1]) {
      strip(g, [s * hw, e, u], [0, r, u], w, slope(s), col, off);                                  // the rafter / roof bar
      strip(g, [s * hw, ph, u], [s * hw, e, u], bay ? D.post * 1.3 : D.bar, [s, 0, 0], col, off);   // the post / wall bar
    }
  }
  for (let q = 1; q < D.rowsRoof; q++) for (const s of [-1, 1]) { const tt = q / D.rowsRoof; strip(g, [s * hw * (1 - tt), e + (r - e) * tt, -L / 2], [s * hw * (1 - tt), e + (r - e) * tt, L / 2], D.bar, slope(s), cF, lay[0]); }
  for (let q = 1; q < D.rowsWall; q++) for (const s of [-1, 1]) { const y = ph + (e - ph) * q / D.rowsWall; strip(g, [s * hw, y, -L / 2], [s * hw, y, L / 2], D.bar, [s, 0, 0], cF, lay[0]); }
  // the gable ends: the vertical bars up to the roof line and the cross bars
  const gb = 0.025;                                                                           // the gable bars stand 2.5 cm out of the end plane: the end faces of the eave rails and the ridge beam lie IN it
  for (const en of [-1, 1]) {
    const z = en * L / 2;
    for (let c = 0; c <= ncv; c++) { const v = -hw + c * pv, top = e + (r - e) * (1 - Math.abs(v) / hw); strip(g, [v, ph, z], [v, top, z], c % 2 === 0 ? D.post * 1.3 : D.bar, [0, 0, en], c % 2 === 0 ? cB : cF, gb + (c % 2 === 0 ? lay[2] : lay[1])); }
    for (let q = 1; q <= D.rowsWall; q++) { const y = ph + (e - ph) * q / D.rowsWall; strip(g, [-hw, y, z], [hw, y, z], D.bar, [0, 0, en], cF, gb + lay[0]); }
  }
  // the panes that exist (a hash decided: h.panes[i].ex), inset from the bars
  const ins = D.pane_inset, gc = D.glass;
  let n = 0;
  for (const p of h.panes) {
    if (!p.ex) continue;
    const c = p.q, e1 = norm(sub(c[1], c[0])), e2 = norm(sub(c[3], c[0]));
    const mv = (v, a, b) => add3(add3(v, mul(e1, a * ins)), mul(e2, b * ins));              // an inset of `ins` along both edge directions (a pane is a rectangle or a trapezoid of the gable)
    oq(gl, mv(c[0], 1, 1), mv(c[1], -1, 1), mv(c[2], -1, -1), mv(c[3], 1, -1), p.out, gc[(n++ + h.seed) % gc.length]);
  }
  return { panes: n };
}

/** a plain low building (the sheds and the annex) into g in its own frame (x along the long axis, z across): walls, a flat roof with a parapet or a low gable roof, a window band, a door */
export function plainBuildingGeometry(g, b) {
  const L = b.len, Dp = b.dep, hh = b.h, c = b.wall;
  g.at(b.cx, 0, b.cz, -b.theta);
  g.box(-L / 2, L / 2, 0, hh, -Dp / 2, Dp / 2, c, 'bt');
  const wc = shade(b.band || '#4b4f55', 1);
  const win = (x, y0, y1, w, face) => { const z = face * (Dp / 2 + 0.02), a = [x - w / 2, y0, z], b = [x + w / 2, y0, z], c2 = [x + w / 2, y1, z], d = [x - w / 2, y1, z]; if (face > 0) g.quad(a, b, c2, d, wc); else g.quad(b, a, d, c2, wc); };
  if (b.kind === 'long') {
    const rh = b.ridge, ov = 0.4;
    g.quad([-L / 2 - ov, hh, Dp / 2 + ov], [L / 2 + ov, hh, Dp / 2 + ov], [L / 2 + ov, hh + rh, 0], [-L / 2 - ov, hh + rh, 0], b.roof);
    g.quad([L / 2 + ov, hh, -Dp / 2 - ov], [-L / 2 - ov, hh, -Dp / 2 - ov], [-L / 2 - ov, hh + rh, 0], [L / 2 + ov, hh + rh, 0], b.roofD);
    g.tri([-L / 2, hh, Dp / 2], [-L / 2, hh + rh, 0], [-L / 2, hh, -Dp / 2], c); g.tri([L / 2, hh, -Dp / 2], [L / 2, hh + rh, 0], [L / 2, hh, Dp / 2], c);
    g.box(-L / 2 - 0.05, L / 2 + 0.05, 0, 0.5, -Dp / 2 - 0.05, Dp / 2 + 0.05, '#8d887c', 'b');                                    // the plinth
    if (!b.noWin) for (let x = -L / 2 + 3; x < L / 2 - 2; x += 3.6) for (const f of [-1, 1]) win(x, 1.9, 3.3, 2.0, f);
    for (const f of [-1, 1]) for (const x of [-L / 2 + 14, 0, L / 2 - 14]) { const z = f * (Dp / 2 + 0.07); if (f > 0) g.quad([x - 0.9, 0, z], [x + 0.9, 0, z], [x + 0.9, 2.3, z], [x - 0.9, 2.3, z], '#5a4a3a'); else g.quad([x + 0.9, 0, z], [x - 0.9, 0, z], [x - 0.9, 2.3, z], [x + 0.9, 2.3, z], '#5a4a3a'); }
  } else {
    // a flat roof with a parapet, a dark patch of roofing, a stub (a lift shaft / a vent), a row of small windows
    g.quad([-L / 2, hh, Dp / 2], [L / 2, hh, Dp / 2], [L / 2, hh, -Dp / 2], [-L / 2, hh, -Dp / 2], b.roof);
    const p = 0.28;
    g.box(-L / 2, L / 2, hh, hh + p, -Dp / 2, -Dp / 2 + 0.25, c, 'b'); g.box(-L / 2, L / 2, hh, hh + p, Dp / 2 - 0.25, Dp / 2, c, 'b');
    g.box(-L / 2, -L / 2 + 0.25, hh, hh + p, -Dp / 2 + 0.25, Dp / 2 - 0.25, c, 'bfk'); g.box(L / 2 - 0.25, L / 2, hh, hh + p, -Dp / 2 + 0.25, Dp / 2 - 0.25, c, 'bfk');
    g.quad([-L * 0.28, hh + 0.02, Dp * 0.3], [L * 0.1, hh + 0.02, Dp * 0.3], [L * 0.1, hh + 0.02, -Dp * 0.18], [-L * 0.28, hh + 0.02, -Dp * 0.18], b.roofD);
    g.box(L * 0.18, L * 0.18 + 2.0, hh, hh + 1.5, -Dp * 0.1, -Dp * 0.1 + 2.0, '#7a766d', 'b');
    if (!b.noWin) for (const f of [-1, 1]) for (let i = 0; i < 4; i++) win(-L * 0.36 + i * L * 0.24, 1.5, 2.6, 1.3, f);
    g.quad([-0.6, 0, Dp / 2 + 0.03], [0.6, 0, Dp / 2 + 0.03], [0.6, 2.1, Dp / 2 + 0.03], [-0.6, 2.1, Dp / 2 + 0.03], '#4a4038');
  }
  g.at();
}

/** the piles of earth (a cone with a flat top) and the stacks of crates into g */
export function detailGeometry(g, plan) {
  const mound = (x, z, h, r0, r1, seg, col, rot) => { g.cyl(x, z, 0, h, r0, r1, seg, col, false, rot); for (let i = 0; i < seg; i++) { const a0 = rot + i / seg * Math.PI * 2, a1 = rot + (i + 1) / seg * Math.PI * 2; g.tri([x, h, z], [x + Math.sin(a0) * r1, h, z + Math.cos(a0) * r1], [x + Math.sin(a1) * r1, h, z + Math.cos(a1) * r1], col, true); } };      // no bottom cap: it would lie 5 mm under the floor
  for (const p of plan.piles) { mound(p.x, p.z, p.h, p.r, p.r * 0.28, 9, p.col, 0.3); mound(p.x + p.r * 0.55, p.z - p.r * 0.2, p.h * 0.55, p.r * 0.5, p.r * 0.12, 7, p.col, 0.9); }
  for (const c of plan.crates) {
    g.at(c.x, 0, c.z, c.rot);
    const s = 0.55, cols = ['#a78a5a', '#9a7d50', '#b59966'];
    let n = 0;
    for (let row = 0; n < c.n; row++) for (let i = 0; i < 3 - row && n < c.n; i++, n++) g.box(-0.85 + row * 0.28 + i * (s + 0.04), -0.85 + row * 0.28 + i * (s + 0.04) + s, row * (s + 0.01), row * (s + 0.01) + s, -s / 2, s / 2, cols[n % 3], 'b');
    g.at();
  }
}

/** the crown palette of the nursery trees: the garden's lime / maple / ash / birch leaf hexes (data/vegetation.js LEAF; SUMMER fix, the first crowns were autumn grey-brown) */
const CROWN = [...LEAF.lime, ...LEAF.maple, ...LEAF.ash, ...LEAF.birch];
const shadeHex = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
/** the tree template (FIX ROUND 2): a big old leafless tree whose crown starts LOW (the trunk is ~2.2 m of 8) and is full: a tapering trunk, six forked boughs and fourteen small irregular grey-brown twig masses (an octahedron with every
 *  vertex pushed by the hash and turned at random: no two share a plane) spread over an egg-shaped crown ~4.4 m across (wide low, narrower at the top, lighter towards the sky); ONE mass carries a muted spring tint. 8 m tall at scale 1 */
export function treeGeometry(winter = false) {
  const g = new GB(), trunk = '#5a4c3e', br = '#4a3f35';
  g.cyl(0, 0, 0, 3.4, 0.17, 0.08, 6, trunk);
  const stick = (a, b, w, col, full) => {
    const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, px = -dz / l * w, pz = dx / l * w;
    g.tri([a[0] - px, a[1], a[2] - pz], [a[0] + px, a[1], a[2] + pz], b, col);
    if (full) g.tri([a[0], a[1] - w, a[2]], [a[0], a[1] + w, a[2]], b, col);
  };
  for (let k = 0; k < 6; k++) {                                                                                                  // boughs from the top of the trunk into the crown
    const ang = 0.4 + k * 2.399963, y = 2.4 + k * 0.28, len = 1.6 + 0.3 * ((k * 5) % 4), dx = Math.cos(ang), dz = Math.sin(ang);
    const a = [dx * 0.05, y, dz * 0.05], e = [dx * len * 0.8, y + len * (1.1 + 0.12 * (k % 3)), dz * len * 0.8];
    stick(a, e, 0.05, br, true);
    const mid = [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2, (a[2] + e[2]) / 2], ang2 = ang + (k % 2 ? 0.7 : -0.7);
    stick(mid, [mid[0] + Math.cos(ang2) * 0.9, mid[1] + 0.9, mid[2] + Math.sin(ang2) * 0.9], 0.035, br, false);
  }
  if (winter) return g.build();
  const mass = (x, y, z, r, col, seed) => {
    const J = (i) => 0.76 + 0.46 * h3(seed, i, 61), ya = h3(seed, 7, 71) * Math.PI * 2, xt = (h3(seed, 8, 73) - 0.5) * 1.3, cy = Math.cos(ya), sy = Math.sin(ya), cx = Math.cos(xt), sx = Math.sin(xt);
    const rot = (v) => { const y1 = v[1] * cx - v[2] * sx, z1 = v[1] * sx + v[2] * cx; return [x + v[0] * cy + z1 * sy, y + y1, z + z1 * cy - v[0] * sy]; };
    const P = [[r * J(0), 0, 0], [-r * J(1), 0, 0], [0, r * 0.9 * J(2), 0], [0, -r * 0.8 * J(3), 0], [0, 0, r * J(4)], [0, 0, -r * J(5)]].map(rot);
    const F = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]];
    for (const f of F) g.tri(P[f[0]], P[f[1]], P[f[2]], col);
  };
  const lerpC = (a, b, t) => { const A = new THREE.Color(a), B = new THREE.Color(b); return '#' + A.lerp(B, t).getHexString(); };
  const NM = 14, y0 = 2.5, y1 = 7.2;
  for (let i = 0; i < NM; i++) {
    const f = (i + 0.5) / NM, fy = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, f * 1.15)), ang = i * 2.399963 + 0.7, R = (0.35 + 0.9 * Math.sin(Math.PI * (0.12 + 0.82 * fy))) * (1.15 + 0.9 * (1 - fy)) * (0.75 + 0.5 * h3(i, 1, 79));   // egg: wide low, narrow at the top
    const y = y0 + (y1 - y0) * fy + 0.35 * (h3(i, 2, 79) - 0.5), r = 1.18 * (1.25 - 0.3 * fy) * (0.82 + 0.34 * h3(i, 3, 79));
    const col = i === 6 ? LEAF.larch[1] : lerpC(shadeHex(CROWN[(i * 3 + 1) % CROWN.length], 0.8), CROWN[(i * 5 + 2) % CROWN.length], fy);       // summer greens of the garden's own trees: darker below, the lit green above
    mass(Math.cos(ang) * R, y, Math.sin(ang) * R, r, col, i + 1);
  }
  mass(0.05, 7.35, 0.0, 1.15, LEAF.birch[0], 30);                                                                                    // the top
  return g.build();
}

/** the classical buildings of the yard into g: the walls on the real ring (outward quads, a darker foot, two rows of windows, a door on the longest edge), the hipped roofs of the wings. World coordinates (the caller does not place them). */
export function yardHouseGeometry(g, y) {
  const o = y.ring, n = o.length / 2;
  const inside = (px, pz) => { let r = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > pz) !== (o[j + 1] > pz) && px < (o[j] - o[i]) * (pz - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) r = !r; return r; };
  const h = y.h, wc = y.wall, win = shade(y.win, 1);
  let longest = 0, doorEdge = 0;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, l = Math.hypot(o[2 * j] - o[2 * i], o[2 * j + 1] - o[2 * i + 1]); if (l > longest) { longest = l; doorEdge = i; } }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, ax = o[2 * i], az = o[2 * i + 1], bx = o[2 * j], bz = o[2 * j + 1], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz);
    if (l < 0.2) continue;
    let nx = dz / l, nz = -dx / l; if (inside((ax + bx) / 2 + nx * 0.4, (az + bz) / 2 + nz * 0.4)) { nx = -nx; nz = -nz; }          // the outward normal
    const out = [nx, 0, nz], ux = dx / l, uz = dz / l;
    const P = (t, yy, off = 0) => [ax + ux * t + nx * off, yy, az + uz * t + nz * off];
    oq(g, P(0, 0), P(l, 0), P(l, h), P(0, h), out, wc);
    oq(g, P(0.2, 0, 0.03), P(l - 0.2, 0, 0.03), P(l - 0.2, 0.9, 0.03), P(0.2, 0.9, 0.03), out, y.wallD);
    if (l < 3.2) continue;
    const nw = Math.max(1, Math.floor((l - 1.6) / 3.1)), pitch = (l - 1.6) / nw;
    for (let k = 0; k < nw; k++) {
      const t0 = 0.8 + k * pitch + pitch / 2 - 0.6;
      for (const [y0, y1] of [[1.3, 3.2], [4.4, 6.3]]) if (y1 < h - 0.2) oq(g, P(t0, y0, 0.03), P(t0 + 1.2, y0, 0.03), P(t0 + 1.2, y1, 0.03), P(t0, y1, 0.03), out, win);
    }
    if (i === doorEdge) oq(g, P(l / 2 - 0.9, 0, 0.05), P(l / 2 + 0.9, 0, 0.05), P(l / 2 + 0.9, 2.5, 0.05), P(l / 2 - 0.9, 2.5, 0.05), out, '#5a4a3a');
  }
  // the hipped roofs (the overhang is 0.35 m; every wing is a rectangle, the ridge runs along its long side)
  const ov = 0.35;
  y.wings.forEach((w, k) => {
    const sl = (y.slopes && y.slopes[k]) ?? y.slope, x0 = w[0] - ov, x1 = w[1] + ov, z0 = w[2] - ov, z1 = w[3] + ov, W = x1 - x0, D = z1 - z0, rise = Math.min(W, D) / 2 * sl, yb = h - ov * sl, yt = yb + rise + ov * sl;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, half = Math.abs(W - D) / 2;
    const A = [x0, yb, z0], B = [x1, yb, z0], C = [x1, yb, z1], Dd = [x0, yb, z1];
    const r0 = W >= D ? [cx - half, yt, cz] : [cx, yt, cz - half], r1 = W >= D ? [cx + half, yt, cz] : [cx, yt, cz + half];
    const up = (a, b, c2) => norm(cross(sub(b, a), sub(c2, a)))[1] >= 0;
    const tri = (a, b, c2, col) => { if (up(a, b, c2)) g.tri(a, b, c2, col); else g.tri(a, c2, b, col); };
    const qd = (a, b, c2, d, col) => { if (up(a, b, c2)) g.quad(a, b, c2, d, col); else g.quad(a, d, c2, b, col); };
    if (W >= D) { qd(A, B, r1, r0, y.roof); qd(Dd, C, r1, r0, y.roofD); tri(A, Dd, r0, y.roofD); tri(B, C, r1, y.roof); }          // ridge along x: slopes north and south, hips at the x ends
    else { qd(A, Dd, r1, r0, y.roof); qd(B, C, r1, r0, y.roofD); tri(A, B, r0, y.roof); tri(Dd, C, r1, y.roofD); }                    // ridge along z: slopes west and east, hips at the z ends
  });
}

// ---------------------------------------------------------------------------------------------------------------- the build
function floorGeometry(ring, lift) {
  const pts = []; for (let i = 0; i < ring.length; i += 2) pts.push(new THREE.Vector2(ring[i], ring[i + 1]));
  const tri = THREE.ShapeUtils.triangulateShape(pts, []);
  const pos = new Float32Array(pts.length * 3), nor = new Float32Array(pts.length * 3);
  pts.forEach((p, i) => { pos[i * 3] = p.x; pos[i * 3 + 1] = lift; pos[i * 3 + 2] = p.y; nor[i * 3 + 1] = 1; });
  const idx = []; for (const t of tri) { const a = pts[t[0]], b = pts[t[1]], c = pts[t[2]], cr = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); if (cr < 0) idx.push(t[0], t[1], t[2]); else idx.push(t[0], t[2], t[1]); }   // the normal must be +y: (b - a) x (c - a) in (x, z) with y up needs a negative cross
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx); g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

/** draws the plan: { meshes, triangles, draws, colliders, items, ... } */
export function buildNursery(ctx, parent, plan, noise, opts = {}) {
  const T = ctx.mat.toon, ph = ctx.physics, far = opts.far ?? NURSERY.far;
  const out = { meshes: {}, triangles: 0, draws: 0, colliders: 0, items: [], parts: {} };
  const reg = (m, name, o = {}) => { m.name = name; m.castShadow = !!o.shadow; m.receiveShadow = true; if (o.noOutline) ctx.noOutline(m); ctx.noBatch(m); parent.add(m); if (o.lod !== false) registerLOD(m, far); out.meshes[name.replace('tauride-nursery-', '')] = m; out.draws++; const cnt = m.isInstancedMesh ? m.count * m.geometry.index.count / 3 : (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; out.parts[name] = cnt; out.triangles += cnt; return m; };
  // ---- 1. the floor
  const mask = planNurseryMask(plan), floor = nurseryFloorMaterial(ctx, mask, noise);
  reg(new THREE.Mesh(floorGeometry(plan.ring, plan.lift), floor.mat), 'tauride-nursery-floor', { lod: false });
  out.mask = mask; out.floorMaterial = floor.mat; out.uniforms = floor.uniforms;
  // ---- 2. the glasshouses: the frames (opaque, double-sided, no outline: hundreds of thin bars would turn into black lines) and the glass (one transparent material)
  const fg = new GB(), gl = new GB();
  for (const h of plan.houses) { fg.at(h.cx, 0, h.cz, h.yaw); gl.at(h.cx, 0, h.cz, h.yaw); houseGeometry(fg, gl, h, plan.design); }
  fg.at(); gl.at();
  const matF = T('#ffffff', { vertexColors: true, side: 'double', paint: 0.02, name: 'tauride-nursery-frames' });
  reg(new THREE.Mesh(fg.build(), matF), 'tauride-nursery-frames', { noOutline: true });
  const matG = T('#ffffff', { vertexColors: true, transparent: true, opacity: plan.design.glassOpacity, depthWrite: false, side: 'double', paint: 0.01, name: 'tauride-nursery-glass' });
  if (gl.tris) reg(new THREE.Mesh(gl.build(), matG), 'tauride-nursery-glass', { noOutline: true });
  // ---- 3. the bare young trees (one instanced mesh)
  if (plan.trees.length) {
    const tg = treeGeometry(ctx.season === 'winter'), matT = T('#ffffff', { vertexColors: true, side: 'double', paint: 0.03, name: 'tauride-nursery-trees' });
    const im = new THREE.InstancedMesh(tg, matT, plan.trees.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color();
    plan.trees.forEach((t, i) => { const s = t.h / 8, sw = s * (t.w || 1); E.set(0, t.rot, 0); Q.setFromEuler(E); M.compose(V.set(t.x, 0, t.z), Q, S.set(sw, s, sw)); im.setMatrixAt(i, M); C.setRGB(t.tint * (1 + 0.07 * (t.warm || 0)), t.tint, t.tint * (1 - 0.07 * (t.warm || 0))); im.setColorAt(i, C); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = true;
    reg(im, 'tauride-nursery-trees', { noOutline: true });
  }
  // ---- 4. the buildings of the lot (two concrete boxes, the long annex) and the details (piles, crates): one mesh on the outline layer
  const bg = new GB();
  for (const b of plan.buildings) plainBuildingGeometry(bg, b);
  for (const y of plan.yardHouses) yardHouseGeometry(bg, y);
  detailGeometry(bg, plan);
  reg(new THREE.Mesh(bg.build(), T('#ffffff', { vertexColors: true, paint: 0.04, name: 'tauride-nursery-buildings' })), 'tauride-nursery-buildings', { shadow: true });
  // ---- colliders: one box per house (not enterable), one per replaced building
  for (const c of plan.colliders) out.items.push(ph.addBox(c.x, c.z, c.w, c.d, c.rotY, c.y0, c.y1));
  out.colliders = out.items.length;
  return out;
}
