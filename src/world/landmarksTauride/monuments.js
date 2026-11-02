// landmarksTauride/monuments.js - THE MONUMENTS, THE FOUNTAIN, THE ORANGERY AND THE PLAY FITTINGS OF THE TAURIDE GARDEN (docs/TAURIDE-REMAKE.md, phase T6):
//   * the Pioneers-heroes memorial (n4186236011, 1962, limestone, 4.8 m) on the plateau M of the relief: a tapering limestone stele with a recessed relief panel, a bronze star and flame, a two-step granite base, a paved
//     apron draped on the plateau, and the limestone CHEEKS of the three memorial descents (w425635247 / w1458068086 / w1458068092: the stair geometry is paths-draped.js, the cheeks stand beside its kerbs);
//   * Chaikovsky (n2974761162, a bust on a granite pedestal) and Yesenin (n4222941889, a bronze figure on a low plinth), both with the shared figure kit (lib/figures.js);
//   * the fountain "Boy with a duck" (n950150577, 1910): a round granite basin, the water, the pedestal with the bronze boy and his duck, a small animated spout, a paved plaza;
//   * the ORANGERY (the palm house, OSM building w23002927, outside the outline in the north-west corner: the module claims the building and draws it as a glasshouse: a brick plinth, an iron frame in 11 bays, glass
//     walls and a glass roof with a raised nave, glazed gables, palms inside);
//   * the pitch (w81524430: the turf with its markings and two goals), the three playgrounds (w188083933, w69029505, w188083935: a rubber / sand surface, a slide, a swing frame, a sandpit, a rocker) and the fitness
//     station (w423708263: a row of pull-up bars).
// planMonuments(o) is PURE and DETERMINISTIC (positions, the apron / cheek / goal / structure specs, the photo spots and the monument records the people read); buildMonuments(ctx, parent, plan) draws it with vertex-coloured
// toon geometry (fence.js GB, streets/vb.js VB) in a handful of meshes (one per site: memorial, statues, fountain, orangery, play) and the figure kit's own materials for the bronzes.
import * as THREE from 'three';
import * as L from '../layout.js';
import { Parts } from '../landmarksD/kit.js';
import { human, bust, cached, figureMats } from '../lib/figures.js';
import { VB } from '../streets/vb.js';
import { GB, mergeGeos } from './fence.js';
import { nearestOn, hashXZ } from './furniture.js';
import { gardenHeight, GARDEN_SHORE } from './height.js';
import { MONUMENTS, FOUNTAINS } from './data/furniture.js';
import { knockBays, unitProfile, faceLeft } from '../lib/fence-bays.js';
import { PATHS } from './data/paths.js';
import { GARDEN_GREEN } from './data/footprints.js';
import { MEMORIAL, CHAIKOVSKY, YESENIN, FOUNTAIN, ORANGERY, PLAY, PITCH_FENCE } from './data/furniture-design.js';
import { liveFountain } from '../lib/live-fountain.js';

const TAU = Math.PI * 2;
const ringHas = (o, x, z) => { let c = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) c = !c; return c; };
const ringDist = (o, x, z) => { let m = Infinity; for (let i = 0; i < o.length; i += 2) { const q = nearestOn([o[i], o[i + 1], o[(i + 2) % o.length], o[(i + 3) % o.length]], x, z); m = Math.min(m, q[2]); } return m; };
const centroid = (o) => { let a = 0, cx = 0, cz = 0; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) { const f = o[j] * o[i + 1] - o[i] * o[j + 1]; a += f; cx += (o[j] + o[i]) * f; cz += (o[j + 1] + o[i + 1]) * f; } a /= 2; return { x: cx / (6 * a), z: cz / (6 * a), area: Math.abs(a) }; };
/** the principal axis angle of a ring (radians, atan2(dz, dx)) from the second moments of its vertices */
const axisOf = (o, c) => { let sxx = 0, szz = 0, sxz = 0; for (let i = 0; i < o.length; i += 2) { const dx = o[i] - c.x, dz = o[i + 1] - c.z; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; } return 0.5 * Math.atan2(2 * sxz, sxx - szz); };

// ---------------------------------------------------------------------------------------------------------------- the plan (pure)
/**
 * o = { gh, shore, GREEN (the facade list), stairs (paths-draped plan.stairs), paths, orangeryRing, D }
 * -> { memorial, chaikovsky, yesenin, fountain, orangery, pitch, playgrounds, fitness, monuments, photoSpots, colliders, stats }
 */
export function planMonuments(o = {}) {
  const gh = o.gh || gardenHeight, shore = o.shore || GARDEN_SHORE, paths = o.paths || PATHS, H = (x, z) => gh(x, z) ?? 0;
  const GREEN = o.GREEN || [], byId = new Map(GREEN.map((g) => [g.id, g]));
  const node = (arr, id) => arr.find((m) => m.id === id);
  const ways = paths.filter((p) => p.cls !== 'bridge' && p.cls !== 'steps').map((p) => p.pts);
  const wayPoint = (x, z, minD, maxD) => {                                                     // the point of a way ribbon at a distance minD .. maxD from (x, z) that is nearest to minD (a standing place for the photographers)
    let best = null;
    for (const pts of ways) for (let i = 0; i + 3 < pts.length; i += 2) {
      const l = Math.hypot(pts[i + 2] - pts[i], pts[i + 3] - pts[i + 1]), n = Math.max(1, Math.ceil(l / 1.0));
      for (let k = 0; k <= n; k++) { const px = pts[i] + (pts[i + 2] - pts[i]) * k / n, pz = pts[i + 1] + (pts[i + 3] - pts[i + 1]) * k / n, d = Math.hypot(px - x, pz - z); if (d >= minD && d <= maxD && (!best || d < best.d - 1e-9)) best = { x: px, z: pz, d }; }
    }
    return best;
  };
  const faceWay = (x, z) => { let best = null; for (const pts of ways) { const q = nearestOn(pts, x, z); if (!best || q[2] < best.d) best = { x: q[0], z: q[1], d: q[2] }; } return best; };
  const stats = { photoSpots: 0 }, colliders = [], monuments = [], photoSpots = [];
  const spot = (id, name, x, z, h, range, pitch = 8) => {
    monuments.push({ id, name, x, z, h });
    const w = wayPoint(x, z, range[0], range[1]) || wayPoint(x, z, 2.5, 25);
    if (w) { photoSpots.push({ x: w.x, z: w.z, yaw: L.yawToward(w.x, w.z, x, z), pitch, name }); stats.photoSpots++; }
    return w;
  };
  // ---- the memorial
  const mn = node(MONUMENTS, MEMORIAL.id), mem = { id: mn.id, x: mn.x, z: mn.z, y: H(mn.x, mn.z), rotY: MEMORIAL.rotY ?? 0.6, name: MEMORIAL.name };
  { const R = MEMORIAL.apronR, rings = MEMORIAL.apronRings, seg = MEMORIAL.apronSeg, at = (r, a) => { const x = mem.x + Math.cos(a) * r, z = mem.z + Math.sin(a) * r; return [x, H(x, z) + MEMORIAL.apronLift, z]; };
    mem.apron = []; for (let k = 0; k < rings; k++) { const r0 = R * k / rings, r1 = R * (k + 1) / rings; for (let i = 0; i < seg; i++) { const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU; mem.apron.push({ p: [at(r0, a0), at(r1, a0), at(r1, a1), at(r0, a1)], alt: (i + k) % 2 }); } }
    mem.kerb = []; for (let i = 0; i < seg; i++) { const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU, A = at(R, a0), B = at(R, a1), A2 = at(R + MEMORIAL.kerb, a0), B2 = at(R + MEMORIAL.kerb, a1); mem.kerb.push({ A, B, A2, B2 }); } }
  // the cheeks of the descents: per tread a block beside the kerb of the stair (paths-draped.js: kerb 0.2 m wide, 0.16 m high)
  mem.cheeks = [];
  for (const id of MEMORIAL.stairs) {
    const s = (o.stairs || []).find((q) => q.id === id); if (!s) continue;
    const ux = (s.to[0] - s.from[0]), uz = (s.to[1] - s.from[1]), len = Math.hypot(ux, uz), tx = ux / len, tz = uz / len, vx = -tz, vz = tx, hw = s.width / 2, d = len / s.n;
    for (let k = 0; k < s.n; k++) for (const side of [-1, 1]) {
      const o0 = side * (hw + 0.2), o1 = side * (hw + 0.2 + MEMORIAL.cheek.w), s0 = k * d, s1 = (k + 1) * d;
      const P = (ss, oo) => [s.from[0] + tx * ss + vx * oo, s.from[1] + tz * ss + vz * oo];
      const c = [P(s0, o0), P(s0, o1), P(s1, o1), P(s1, o0)];
      const bot = Math.min(...c.map((q) => H(q[0], q[1]))) - 0.1, top = s.tops[k] + MEMORIAL.cheek.h;
      mem.cheeks.push({ stair: id, k, side, c, bot, top, lowEnd: k === 0 });
    }
  }
  colliders.push({ x: mem.x, z: mem.z, w: MEMORIAL.base[0].w + 0.2, d: MEMORIAL.base[0].d + 0.2, rotY: mem.rotY, y0: mem.y - 0.5, y1: mem.y + MEMORIAL.h, id: 'memorial' });
  mem.photo = spot(mem.id, MEMORIAL.name, mem.x, mem.z, MEMORIAL.h, MEMORIAL.photoR, 6);
  // ---- Chaikovsky and Yesenin: the pedestal faces the nearest alley
  const mk = (D, id) => {
    const n = node(MONUMENTS, id), w = faceWay(n.x, n.z), rotY = w ? Math.atan2(w.x - n.x, w.z - n.z) : 0;
    const m = { id, x: n.x, z: n.z, y: H(n.x, n.z), rotY, name: D.name, face: w ? { x: w.x, z: w.z } : null };      // T8a: `face` = the point of the alley the pedestal looks at (local +z)
    colliders.push({ x: n.x, z: n.z, w: (D.pedestal.base || D.pedestal.w) + 0.1, d: (D.pedestal.base || D.pedestal.d) + 0.1, rotY, y0: m.y - 0.5, y1: m.y + D.h, id });
    m.photo = spot(id, D.name, n.x, n.z, D.h, D.photoR, 8);
    return m;
  };
  const chai = mk(CHAIKOVSKY, CHAIKOVSKY.id), yes = mk(YESENIN, YESENIN.id);
  // T8a: the inscription plate on the front face of Yesenin's pedestal (the face toward the alley; the same local frame as pedestalGeometry: +z is the front)
  yes.plate = plateSpec(yes, YESENIN);
  // ---- the fountain
  const fn = node(FOUNTAINS, FOUNTAIN.id), fountain = { id: fn.id, x: fn.x, z: fn.z, y: H(fn.x, fn.z), name: FOUNTAIN.name };
  // WATER IS REACHABLE (docs/AREAS.md 13.7): the basin is no solid disc any more (a walker steps over the rim, or through a broken one, and wades in the 0.38 m of water); the collider is the PEDESTAL, the rim is 20 breakable bays (buildFountain)
  colliders.push({ cyl: true, x: fn.x, z: fn.z, r: FOUNTAIN.pedestal.r * 1.2 + 0.3, y0: fountain.y - 0.5, y1: fountain.y + FOUNTAIN.pedestal.h + 0.9, id: 'fountain' });
  fountain.photo = spot(fn.id, FOUNTAIN.name, fn.x, fn.z, 2.4, FOUNTAIN.photoR, 6);
  // ---- the orangery (the mapped footprint of the building)
  const orangery = o.orangeryRing ? planOrangery(o.orangeryRing, H) : null;
  if (orangery) {
    for (const w of orangery.walls) colliders.push({ x: w.x, z: w.z, w: 0.5, d: w.len, rotY: w.yaw, y0: orangery.y - 0.5, y1: orangery.y + ORANGERY.wallH, id: 'orangery' });
    const gate = L.yawToward(orangery.entry.x, orangery.entry.z, orangery.cx, orangery.cz);
    const w = wayPoint(orangery.entry.x, orangery.entry.z, 1.5, 30);
    monuments.push({ id: ORANGERY.id, name: 'Оранжерея Таврического сада', x: orangery.cx, z: orangery.cz, h: ORANGERY.ridgeH });
    if (w) { photoSpots.push({ x: w.x, z: w.z, yaw: L.yawToward(w.x, w.z, orangery.cx, orangery.cz), pitch: 6, name: 'Оранжерея Таврического сада' }); stats.photoSpots++; }
    void gate;
  }
  // ---- the pitch: the turf, the markings, two goals
  const pr = byId.get(PITCH_FENCE.id), pitch = pr ? planPitch(pr.polys[0].o, H) : null;
  // ---- the playgrounds and the fitness station
  const playgrounds = [], fitness = [];
  for (const g of GARDEN_GREEN.others) {
    const rec = byId.get(g.id); if (!rec) continue;
    const ring = rec.polys[0].o, c = centroid(ring), r = Math.sqrt(c.area / Math.PI), y = H(c.x, c.z), a = axisOf(ring, c);
    if (g.kind === 'playground') {
      const items = [];
      for (const [kind, fr, deg] of PLAY.sets[g.id] || []) {
        const x = c.x + Math.cos(deg * Math.PI / 180) * fr * r, z = c.z + Math.sin(deg * Math.PI / 180) * fr * r;
        if (!ringHas(ring, x, z) || ringDist(ring, x, z) < PLAY.inset) continue;
        items.push({ kind, x, z, y: H(x, z), yaw: hashXZ(x, z, 3) * TAU });
      }
      playgrounds.push({ id: g.id, ring, c, r, y, items, color: PLAY.surface[g.id] });
    } else if (g.kind === 'fitness_station') {
      const n = PLAY.bars.n, pts = []; for (let i = 0; i < n; i++) { const t = (i - (n - 1) / 2) * PLAY.bars.pitch, x = c.x + Math.cos(a) * t, z = c.z + Math.sin(a) * t; if (ringHas(ring, x, z)) pts.push({ x, z, y: H(x, z), yaw: -a + Math.PI / 2 }); }
      fitness.push({ id: g.id, ring, c, y, bars: pts, color: PLAY.surface[g.id] });
    }
  }
  stats.playgrounds = playgrounds.length; stats.structures = playgrounds.reduce((s, p) => s + p.items.length, 0); stats.fitnessBars = fitness.reduce((s, f) => s + f.bars.length, 0);
  return { memorial: mem, chaikovsky: chai, yesenin: yes, fountain, orangery, pitch, playgrounds, fitness, monuments, photoSpots, colliders, stats };
}

/** the orangery footprint ring (4 vertices) -> the local frame: the long axis `u`, the cross axis `v`, the length, the width, the walls (centre, length, yaw) and the bays */
function planOrangery(ring, H) {
  const n = ring.length / 2; let cx = 0, cz = 0; for (let i = 0; i < ring.length; i += 2) { cx += ring[i]; cz += ring[i + 1]; } cx /= n; cz /= n;
  // the long axis: the longest edge
  let bi = 0, bl = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n, l = Math.hypot(ring[j * 2] - ring[i * 2], ring[j * 2 + 1] - ring[i * 2 + 1]); if (l > bl) { bl = l; bi = i; } }
  const j = (bi + 1) % n, ux0 = ring[j * 2] - ring[bi * 2], uz0 = ring[j * 2 + 1] - ring[bi * 2 + 1], ul = Math.hypot(ux0, uz0), ux = ux0 / ul, uz = uz0 / ul, vx = -uz, vz = ux;
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (let i = 0; i < n; i++) { const dx = ring[i * 2] - cx, dz = ring[i * 2 + 1] - cz, u = dx * ux + dz * uz, v = dx * vx + dz * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const length = u1 - u0, width = v1 - v0, mu = (u0 + u1) / 2, mv = (v0 + v1) / 2, ox = cx + ux * mu + vx * mv, oz = cz + uz * mu + vz * mv, yaw = Math.atan2(ux, uz);
  const P = (u, v) => [ox + ux * u + vx * v, oz + uz * u + vz * v];
  const hl = length / 2, hw = width / 2;
  const walls = [{ x: P(0, hw)[0], z: P(0, hw)[1], len: length, yaw }, { x: P(0, -hw)[0], z: P(0, -hw)[1], len: length, yaw }, { x: P(hl, 0)[0], z: P(hl, 0)[1], len: width, yaw: yaw + Math.PI / 2 }, { x: P(-hl, 0)[0], z: P(-hl, 0)[1], len: width, yaw: yaw + Math.PI / 2 }];
  // the entry: the middle of the end that faces the garden (the south end, larger z)
  const e1 = P(hl, 0), e2 = P(-hl, 0), entry = e1[1] > e2[1] ? { x: e1[0], z: e1[1], end: 1 } : { x: e2[0], z: e2[1], end: -1 };
  return { cx: ox, cz: oz, y: H(ox, oz), ux, uz, vx, vz, yaw, length, width, hl, hw, walls, entry, bays: ORANGERY.bays, P };
}

/** the pitch ring (a rectangle of 4 vertices) -> the turf, the marking lines and two goals at the short ends */
function planPitch(ring, H) {
  const c = centroid(ring), a = axisOf(ring, c), ux = Math.cos(a), uz = Math.sin(a), vx = -uz, vz = ux;
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (let i = 0; i < ring.length; i += 2) { const dx = ring[i] - c.x, dz = ring[i + 1] - c.z, u = dx * ux + dz * uz, v = dx * vx + dz * vz; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const PS = PLAY, S = { ...(PS.pitchSurface || {}) }, ins = S.inset ?? 2, P = (u, v) => [c.x + ux * u + vx * v, c.z + uz * u + vz * v];
  const y = H(c.x, c.z), L1 = (u1 - ins), L0 = (u0 + ins), W1 = (v1 - ins), W0 = (v0 + ins), lines = [];
  const seg = (p, q) => lines.push([P(...p), P(...q)]);
  seg([L0, W0], [L1, W0]); seg([L0, W1], [L1, W1]); seg([L0, W0], [L0, W1]); seg([L1, W0], [L1, W1]); seg([(L0 + L1) / 2, W0], [(L0 + L1) / 2, W1]);
  const mu = (L0 + L1) / 2, mv = (W0 + W1) / 2, cr = 5; for (let i = 0; i < 24; i++) { const t0 = i / 24 * TAU, t1 = (i + 1) / 24 * TAU; seg([mu + Math.cos(t0) * cr, mv + Math.sin(t0) * cr], [mu + Math.cos(t1) * cr, mv + Math.sin(t1) * cr]); }
  for (const e of [L0, L1]) { const s = e === L0 ? 1 : -1, pa = 11, pw = (W1 - W0) * 0.28; seg([e, mv - pw], [e + s * pa, mv - pw]); seg([e + s * pa, mv - pw], [e + s * pa, mv + pw]); seg([e + s * pa, mv + pw], [e, mv + pw]); }
  const goals = [L0, L1].map((e, i) => ({ x: P(e, mv)[0], z: P(e, mv)[1], y: H(P(e, mv)[0], P(e, mv)[1]), yaw: Math.atan2(ux * (i ? -1 : 1), uz * (i ? -1 : 1)) }));
  return { ring, c, y, ux, uz, vx, vz, lines, goals, L0, L1, W0, W1, u0, u1, v0, v1 };
}

// ---------------------------------------------------------------------------------------------------------------- geometry
const limestoneCap = (g, ring, y, col) => {
  const pts = []; for (let i = 0; i < ring.length; i += 2) pts.push(new THREE.Vector2(ring[i], ring[i + 1]));
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(pts, [])) {
    const A = [pts[a].x, y, pts[a].y], B = [pts[b].x, y, pts[b].y], C = [pts[c].x, y, pts[c].y];
    const cr = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
    if (cr > 0) g.tri(A, B, C, col); else g.tri(A, C, B, col);
  }
};
const lineQuad = (g, p, q, w, y, col) => {
  const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2;
  hq(g, [p[0] - nx, y, p[1] - nz], [q[0] - nx, y, q[1] - nz], [q[0] + nx, y, q[1] + nz], [p[0] + nx, y, p[1] + nz], col);
};
/** a rectangular tapered block (centre cx, cz; base w0 x d0 at y0, top w1 x d1 at y1) rotated by yaw */
const taper = (g, cx, cz, yaw, y0, y1, w0, d0, w1, d1, col, top = true) => {
  g.at(cx, 0, cz, yaw);
  const a = [[-w0 / 2, y0, d0 / 2], [w0 / 2, y0, d0 / 2], [w0 / 2, y0, -d0 / 2], [-w0 / 2, y0, -d0 / 2]], b = [[-w1 / 2, y1, d1 / 2], [w1 / 2, y1, d1 / 2], [w1 / 2, y1, -d1 / 2], [-w1 / 2, y1, -d1 / 2]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; g.quad(a[i], a[j], b[j], b[i], col); }
  if (top) g.quad(b[0], b[1], b[2], b[3], col);
  g.at();
};

/** a horizontal quad facing UP whatever the order of its corners ([x, y, z] each) */
const hq = (g, a, b, c, d, col) => {
  const ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]);
  if (ny >= 0) g.quad(a, b, c, d, col); else g.quad(a, d, c, b, col);
};
/** a vertical wall between the bottom points A and B ([x, y, z]) of height h facing away from `centre` ([x, z]) */
const vwall = (g, A, B, h, centre, col) => {
  const nx = -(B[2] - A[2]), nz = B[0] - A[0], mx = (A[0] + B[0]) / 2 - centre[0], mz = (A[2] + B[2]) / 2 - centre[1];
  const T = (p) => [p[0], p[1] + h, p[2]];
  if (mx * nx + mz * nz >= 0) g.quad(A, B, T(B), T(A), col); else g.quad(B, A, T(A), T(B), col);
};

/** the memorial: stepped granite base, the tapering limestone stele with its relief panel, the bronze star and flame, the apron, the kerb, the cheeks of the stairs */
export function memorialGeometry(m) {
  const g = new GB(), M = MEMORIAL;
  for (const q of m.apron) hq(g, q.p[0], q.p[1], q.p[2], q.p[3], q.alt ? M.paving : M.pavingD);
  for (const k of m.kerb) { const up = (p) => [p[0], p[1] + 0.12, p[2]]; hq(g, up(k.A), up(k.B), up(k.B2), up(k.A2), M.kerbColor); vwall(g, k.A2, k.B2, 0.12, [m.x, m.z], M.kerbColor); }
  let y = m.y;
  for (const s of M.base) { g.at(m.x, y, m.z, m.rotY); g.box(-s.w / 2, s.w / 2, 0, s.h, -s.d / 2, s.d / 2, M.graniteBase, 'b'); g.at(); y += s.h; }
  const st = M.stele, h = M.h - (y - m.y);
  taper(g, m.x, m.z, m.rotY, y, y + h, st.w0, st.d0, st.w1, st.d1, M.limestone);
  // the sloped cap and the relief panel (recessed look: a darker plate 1.5 x 2.4 m on the front) with the bronze star and flame
  g.at(m.x, y, m.z, m.rotY);
  const fz = st.d0 / 2 + 0.02 - (st.d0 - st.d1) / 2 * 0.15, py0 = h * 0.28, py1 = h * 0.86, pw = 1.45;
  g.quad([-pw / 2, py0, fz + 0.01], [pw / 2, py0, fz + 0.01], [pw / 2, py1, fz - 0.03], [-pw / 2, py1, fz - 0.03], M.limestoneD);
  g.box(-pw / 2 - 0.05, -pw / 2, py0, py1, fz - 0.02, fz + 0.03, M.limestoneL, 'b'); g.box(pw / 2, pw / 2 + 0.05, py0, py1, fz - 0.02, fz + 0.03, M.limestoneL, 'b');
  // the bronze star (five points, a fan) and a flame (a pyramid) above the base of the panel
  { const cx = 0, cy = py0 + (py1 - py0) * 0.62, R = 0.42, r2 = 0.17, zf = (fz + 0.01) + ((fz - 0.03) - (fz + 0.01)) * 0.62 + 0.025; const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r2 : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, zf]); }
    for (let i = 0; i < 10; i++) g.tri([cx, cy, zf], pts[i], pts[(i + 1) % 10], M.bronze);
    const fy = py0 + (py1 - py0) * 0.12, zb = (fz + 0.01) + ((fz - 0.03) - (fz + 0.01)) * 0.12; g.pyramid(-0.16, 0.16, zb, zb + 0.1, fy, fy + 0.5, M.bronze, 0, zb + 0.03); }
  g.at();
  for (const c of m.cheeks) {
    const top = c.top, bot = c.bot, cc = [(c.c[0][0] + c.c[2][0]) / 2, (c.c[0][1] + c.c[2][1]) / 2];
    hq(g, [c.c[0][0], top, c.c[0][1]], [c.c[1][0], top, c.c[1][1]], [c.c[2][0], top, c.c[2][1]], [c.c[3][0], top, c.c[3][1]], M.limestoneL);
    for (let i = 0; i < 4; i++) { const p = c.c[i], q = c.c[(i + 1) % 4]; vwall(g, [p[0], bot, p[1]], [q[0], bot, q[1]], top - bot, cc, M.limestone); }
  }
  return g.build();
}

/** T8a: the inscription plate of a pedestal (D.plate, data/furniture-design.js): the text, the size, the local frame (the shaft's front face at local z = zFace, the plate `proud` m in front of it, centred on the shaft) and
 *  the world normal (sin rotY, 0, cos rotY): the face the pedestal looks at, the alley. */
export function plateSpec(m, D) {
  const P = D.pedestal, pl = D.plate; if (!pl) return null;
  const bh = P.baseH ?? 0.2, zFace = P.d / 2, y0 = bh + (P.h - pl.h) / 2;
  return { text: pl.text, w: pl.w, h: pl.h, proud: pl.proud, zFace, y0, y1: y0 + pl.h, x: m.x, z: m.z, y: m.y, rotY: m.rotY, normal: [Math.sin(m.rotY), 0, Math.cos(m.rotY)] };
}
/** the plate's geometry: the painted front quad (uv 0..1 over the whole canvas) and the four edges of the raised plate (uv on the rim pixel of the canvas); returns the number of triangles */
export function plateGeometry(g, pl) {
  const hw = pl.w / 2, zf = pl.zFace, z1 = zf + pl.proud, y0 = pl.y0, y1 = pl.y1, W = [1, 1, 1], RIM = [0.004, 0.5], n0 = g.tris;
  g.at(pl.x, pl.y, pl.z, pl.rotY);
  g.quad([-hw, y0, z1], [hw, y0, z1], [hw, y1, z1], [-hw, y1, z1], W, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  g.quad([-hw, y1, z1], [hw, y1, z1], [hw, y1, zf], [-hw, y1, zf], W, RIM);
  g.quad([-hw, y0, zf], [hw, y0, zf], [hw, y0, z1], [-hw, y0, z1], W, RIM);
  g.quad([hw, y0, z1], [hw, y0, zf], [hw, y1, zf], [hw, y1, z1], W, RIM);
  g.quad([-hw, y0, zf], [-hw, y0, z1], [-hw, y1, z1], [-hw, y1, zf], W, RIM);
  g.at();
  return g.tris - n0;
}
/** paints the plate on a w x h canvas: a dark bronze field with a rim and a thin inner line, the text in gold with a dark shadow (engraved / raised) and a light edge; the text is fitted to 86 % of the width.
 *  Pure of the engine (g is a 2d context): the test hands in a recording context and reads the strings drawn. */
export function paintPlate(g, w, h, pl) {
  g.fillStyle = pl.rim; g.fillRect(0, 0, w, h);
  g.fillStyle = pl.bg; g.fillRect(6, 6, w - 12, h - 12);
  g.strokeStyle = pl.rim; g.lineWidth = 2; g.strokeRect(15, 15, w - 30, h - 30);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const font = '"Noto Serif", "Times New Roman", serif';
  let s = Math.floor(h * 0.5); g.font = `700 ${s}px ${font}`;
  const w0 = g.measureText(pl.text).width; if (w0 > w * 0.86) { s = Math.max(8, Math.floor(s * w * 0.86 / w0)); g.font = `700 ${s}px ${font}`; }
  const cx = w / 2, cy = h / 2 + 2;
  g.fillStyle = pl.shade; g.fillText(pl.text, cx + 2, cy + 3);
  g.fillStyle = pl.hi; g.fillText(pl.text, cx - 1, cy - 1);
  g.fillStyle = pl.fg; g.fillText(pl.text, cx, cy);
}

/** a granite pedestal for a bust / figure: a base slab, the shaft with a cornice and a capstone; returns the top y */
export function pedestalGeometry(g, x, z, y, yaw, D, col, colL) {
  const P = D.pedestal, b = P.base || P.w + 0.5, bh = P.baseH ?? 0.2, w = P.w / 2;
  g.at(x, y, z, yaw);
  g.box(-b / 2, b / 2, 0, bh, -b / 2, b / 2, col, 'b');
  g.box(-w, w, bh, bh + P.h, -w * (P.d / P.w), w * (P.d / P.w), col, 'b');
  const cw = w + 0.1; g.box(-cw, cw, bh + P.h, bh + P.h + 0.14, -cw * (P.d / P.w), cw * (P.d / P.w), colL, 'b');
  g.at();
  return y + bh + P.h + 0.14;
}

export function buildMonuments(ctx, parent, plan, opts = {}) {
  const T = ctx.mat.toon, ph = ctx.physics, fm = figureMats(ctx), mVC = T('#ffffff', { vertexColors: true, paint: 0.03, name: 'tauride-monuments' });
  const out = { meshes: [], triangles: 0, draws: 0, colliders: 0, items: [], figures: {}, parts: {} };
  const add = (geo, name, o = {}) => {
    if (!geo) return null;
    const m = new THREE.Mesh(geo, o.mat || mVC); m.name = name; m.castShadow = o.shadow !== false; m.receiveShadow = true;
    if (o.noOutline) ctx.noOutline(m);
    ctx.noBatch(m); parent.add(m); out.meshes.push(m); out.draws++; out.triangles += (geo.index ? geo.index.count : geo.attributes.position.count) / 3; out.parts[name] = (geo.index.count / 3);
    return m;
  };
  // ---- the memorial
  add(memorialGeometry(plan.memorial), 'tauride-memorial');
  // ---- Chaikovsky and Yesenin: pedestals + the bronzes (lib/figures.js)
  { const g = new GB(), c = plan.chaikovsky, y = plan.yesenin;
    const topC = pedestalGeometry(g, c.x, c.z, c.y, c.rotY, CHAIKOVSKY, CHAIKOVSKY.granite, CHAIKOVSKY.graniteL), topY = pedestalGeometry(g, y.x, y.z, y.y, y.rotY, YESENIN, YESENIN.granite, YESENIN.graniteL);
    add(g.build(), 'tauride-statues-base');
    // T8a: the inscription plate of Yesenin's pedestal: one small canvas texture (painted at load, nothing baked), one draw, 8 mm proud of the shaft
    if (y.plate) {
      const D = YESENIN.plate, pg = new GB(); plateGeometry(pg, y.plate);
      const tex = ctx.tex.draw(D.tw, D.th, (c2, w, h) => paintPlate(c2, w, h, D), { key: D.tex, anisotropy: 8 });
      const pm = add(pg.build(), 'tauride-yesenin-plate', { mat: T('#ffffff', { map: tex, vertexColors: true, paint: 0, name: 'tauride-plate' }), shadow: false, noOutline: true });
      if (pm) { pm.userData.plate = { text: y.plate.text, normal: y.plate.normal }; out.plate = pm; }
    }
    const P = new Parts(), mk = { main: fm.bronze, dark: fm.dark, accent: fm.bronzeDark };
    const b = cached('tauride-chaikovsky', () => bust({ detail: 0.6, style: CHAIKOVSKY.bust.style, turn: 0.12, face: { hair: 'short', beard: 'full', age: 0.7, seed: 7 } }));
    b.place(P, mk, c.x, topC, c.z, c.rotY, CHAIKOVSKY.bust.scale);
    const f = cached('tauride-yesenin', () => human({
      detail: 0.55, body: { muscle: 0.25, bulk: 0.92, shoulders: 1.0 },
      pose: { pelvisRot: [0, 0.1, 0.03], spine: [0, -0.06, 0], head: [0.05, -0.18, 0.02], legs: { L: { foot: [0.1, 0, 0.02], yaw: 0.12 }, R: { foot: [-0.12, 0, -0.08], yaw: -0.15 } }, arms: { L: { hand: [0.2, 0.86, 0.1], pole: [0.8, -0.2, -0.5], grip: 'relaxed' }, R: { hand: [-0.2, 0.9, 0.06], pole: [-0.8, -0.2, -0.5], grip: 'relaxed' } } },
      outfit: { torso: 'coat', hem: 0.5, flare: 0.04, folds: 0.02, open: 0.5, sleeves: 'long', trousers: 'long', boots: 0.07, collar: 'fall', buttons: true, hat: 'none' },
      face: { age: 0.2, hair: 'curly', mouth: 'closed', seed: 41 } }));
    f.place(P, mk, y.x, topY, y.z, y.rotY, YESENIN.figure.scale);
    for (const mesh of P.build(parent, { name: 'tauride-bronzes' })) { ctx.noBatch(mesh); out.meshes.push(mesh); out.draws++; out.triangles += mesh.geometry.index.count / 3; }
    out.figures = { bustTris: b.tris, figureTris: f.tris }; }
  // ---- the fountain
  buildFountain(ctx, parent, plan.fountain, out, add);
  // ---- the orangery
  if (plan.orangery) buildOrangery(ctx, parent, plan.orangery, out, add);
  // ---- the pitch, the playgrounds, the fitness station
  { const g = new GB(), pl = plan;
    if (pl.pitch) pitchGeometry(g, pl.pitch);
    for (const p of pl.playgrounds) playgroundGeometry(g, p);
    for (const f of pl.fitness) fitnessGeometry(g, f);
    if (g.tris) add(g.build(), 'tauride-play'); }
  // ---- colliders
  for (const c of plan.colliders) { const it = c.cyl ? ph.addCylinder(c.x, c.z, c.r, c.y0, c.y1) : ph.addBox(c.x, c.z, c.w, c.d, c.rotY, c.y0, c.y1); out.items.push(it); }
  if (plan.pitch) for (const gl of plan.pitch.goals) { out.items.push(ph.addBox(gl.x, gl.z, PLAY.goal.d, PLAY.goal.w, gl.yaw, gl.y - 0.5, gl.y + 0.3)); }
  for (const p of plan.playgrounds) for (const it of p.items) { const r = it.kind === 'sandpit' ? 0 : it.kind === 'slide' ? 1.0 : it.kind === 'swing' ? 0.0 : 0.5; if (r) { const c = ph.addCylinder(it.x, it.z, r, it.y - 0.5, it.y + 1.6); out.items.push(c); } }
  out.colliders = out.items.length;
  return out;
}

// ---------------------------------------------------------------------------------------------------------------- the fountain
function buildFountain(ctx, parent, f, out, add) {
  const D = FOUNTAIN, g = new GB(), v = new VB(), seg = 20, R = D.R, W = D.rimW, y = f.y;
  // the plaza: a paved disc draped on the (flat) ground, a granite kerb ring
  const at = (r, a) => [f.x + Math.cos(a) * r, y + D.plazaLift, f.z + Math.sin(a) * r];
  for (let k = 0; k < 3; k++) { const r0 = D.plazaR * k / 3 + (k ? 0 : R + W), r1 = D.plazaR * (k + 1) / 3 + (k ? 0 : 0); for (let i = 0; i < D.plazaSeg; i++) { const a0 = i / D.plazaSeg * TAU, a1 = (i + 1) / D.plazaSeg * TAU; if (r1 - r0 < 0.05) continue; hq(g, at(r0, a0), at(r1, a0), at(r1, a1), at(r0, a1), (i + k) % 2 ? D.paving : D.pavingD); } }
  for (let i = 0; i < D.plazaSeg; i++) { const a0 = i / D.plazaSeg * TAU, a1 = (i + 1) / D.plazaSeg * TAU, A = at(D.plazaR, a0), B = at(D.plazaR, a1), A2 = at(D.plazaR + 0.25, a0), B2 = at(D.plazaR + 0.25, a1), up = (p, h) => [p[0], p[1] + h, p[2]]; hq(g, up(A, D.plazaKerb), up(B, D.plazaKerb), up(B2, D.plazaKerb), up(A2, D.plazaKerb), D.graniteL); vwall(g, A2, B2, D.plazaKerb, [f.x, f.z], D.granite); }
  // the basin: an outer wall, the rim, the inner wall down to the water
  const ro = R + W, rt = D.rimH, rimBays = [];
  for (let i = 0; i < seg; i++) {                                                                                                   // the rim: 20 BREAKABLE bays (an outer wall, the rim, the inner wall above the water; lib/fence-bays.js, a car at 12 km/h breaks one off)
    const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU, am = (a0 + a1) / 2, p0 = [f.x + Math.cos(a0) * ro, f.z + Math.sin(a0) * ro], p1 = [f.x + Math.cos(a1) * ro, f.z + Math.sin(a1) * ro];
    rimBays.push(faceLeft(p0[0], p0[1], p1[0], p1[1], -Math.cos(am), -Math.sin(am), { y }));      // (local +z = toward the middle of the basin)
  }
  {
    const wallG = unitProfile([[0, 0], [0, rt]], { caps: false }), topG = unitProfile([[0, rt], [W, rt]], { caps: false }), inG = unitProfile([[W, rt], [W, rt - D.waterDrop]], { caps: false });
    const mg = ctx.mat.toon(D.granite, { paint: 0.04, name: 'tauride-fountain-rim' }), ml = ctx.mat.toon(D.graniteL, { paint: 0.04, name: 'tauride-fountain-rim-top' });
    const r = knockBays(ctx, { name: 'tauride-fountain-rim', bays: rimBays, far: 250,
      parts: [{ geo: wallG, mat: mg, name: 'wall', far: 250, stretch: true }, { geo: topG, mat: ml, name: 'top', far: 250, stretch: true }, { geo: inG, mat: mg, name: 'inner', far: 250, stretch: true }],
      collider: () => ({ y0: y - 0.5, y1: y + rt + 0.2, thick: W + 0.1, off: W / 2, e0: 0.05, e1: 0.05 }),
      rec: () => ({ kind: 'fence', mass: 350, h: rt, r: 0.17, anchored: 12, hitK: 0.3, metal: false, minDv: 0 }) });
    for (const it of r.items) if (it) out.items.push(it);      // (the census: out.colliders = out.items.length below)
    out.triangles += seg * 3 * 2;
    if (ctx.physics.addWater) ctx.physics.addWater({ ring: Array.from({ length: 24 }, (_, i) => [f.x + Math.cos(i / 24 * TAU) * R, f.z + Math.sin(i / 24 * TAU) * R]).flat(), level: y + rt - D.waterDrop });      // (the basin is shallow water to wade in)
  }
  // the pedestal in the middle: a lathe of three rings; on it the bronze boy with the duck (VB spheres and rods)
  const pr = D.pedestal.r, ph0 = y + 0.05;
  g.cyl(f.x, f.z, y + 0.05, y + D.pedestal.h * 0.4, pr * 1.2, pr * 0.8, 8, D.granite);
  g.cyl(f.x, f.z, y + D.pedestal.h * 0.4, y + D.pedestal.h, pr * 0.8, pr * 1.05, 8, D.graniteL, true);
  void ph0;
  const top = y + D.pedestal.h, bz = D.bronze;
  // the boy (0.62 m): torso, head, legs astride, arms hugging a duck; the duck (0.3 m) with its neck and beak
  const bx = f.x, bzc = f.z;
  v.sph(0.13, bz, [bx, top + 0.34, bzc], 8, [0.9, 1.35, 0.8]);                                                  // torso
  v.sph(0.095, bz, [bx, top + 0.62, bzc + 0.01], 8);                                                            // head
  v.rod([bx - 0.05, top + 0.2, bzc], [bx - 0.12, top + 0.02, bzc + 0.1], 0.04, bz, 5);                          // legs
  v.rod([bx + 0.05, top + 0.2, bzc], [bx + 0.12, top + 0.02, bzc + 0.05], 0.04, bz, 5);
  v.rod([bx - 0.12, top + 0.46, bzc], [bx - 0.1, top + 0.36, bzc + 0.2], 0.03, bz, 5);                          // arms to the duck
  v.rod([bx + 0.12, top + 0.46, bzc], [bx + 0.1, top + 0.36, bzc + 0.2], 0.03, bz, 5);
  v.sph(0.1, bz, [bx, top + 0.36, bzc + 0.24], 8, [0.9, 0.8, 1.35]);                                            // the duck's body
  v.rod([bx, top + 0.42, bzc + 0.3], [bx, top + 0.56, bzc + 0.36], 0.025, bz, 5);                               // neck
  v.sph(0.04, bz, [bx, top + 0.59, bzc + 0.38], 6);                                                             // head
  v.rod([bx, top + 0.59, bzc + 0.4], [bx, top + 0.575, bzc + 0.47], 0.015, '#8a7a3a', 4);                      // beak
  const bronze = v.build(), BK = D.boyScale ?? 1;
  if (BK !== 1) { bronze.translate(-bx, -top, -bzc); bronze.scale(BK, BK, BK); bronze.translate(bx, top, bzc); }          // T7: the boy and his duck larger (the whole group about its foot on the pedestal)
  add(mergeGeos([g.build(), withUv(bronze)]), 'tauride-fountain');
  // the water: a disc just under the rim; the spout: an animated thin cone and a few droplets
  const wg = new THREE.CircleGeometry(R, 24); wg.rotateX(-Math.PI / 2);
  const wm = new THREE.Mesh(wg, ctx.mat.toon(D.water, { paint: 0.06, name: 'tauride-fountain-water' })); wm.position.set(f.x, y + rt - D.waterDrop, f.z); wm.name = 'tauride-fountain-water'; wm.receiveShadow = true; ctx.noOutline(wm); ctx.noBatch(wm); parent.add(wm); out.meshes.push(wm); out.draws++; out.triangles += 24;
  const spray = ctx.mat.toon(D.spray, { paint: 0.08, name: 'tauride-fountain-spray', emissive: '#6bcbd5', emissiveIntensity: .08 }), jet = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 1, 6, 1), spray);
  const drops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), spray, 8);
  jet.name = 'tauride-fountain-jet'; drops.name = 'tauride-fountain-drops'; ctx.noOutline(jet); ctx.noOutline(drops);
  const beakY = top + 0.575 * BK, bzz = bzc + 0.46 * BK, M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
  const waterY = y + rt - D.waterDrop;
  liveFountain(ctx,{id:f.id,x:f.x,z:f.z,y:waterY,r:R,drawStreams:false,far:280,nozzles:[
    {x:bx-f.x,y:beakY-waterY,z:bzz-f.z,height:D.jetH,width:.024,target:[bx-f.x+.3,0,bzz-f.z+.65]},
  ]});
  const update = (t) => {
    const n = ctx.shared.uNight?.value || 0, sunY = ctx.shared.uSunDir?.value?.y ?? 1;
    spray.emissiveIntensity = .08 + 1.3 * Math.max(0, Math.min(1, Math.max((.22-sunY)/.22*.55,(n-.03)/.55)));
    const h = D.jetH * (0.92 + 0.08 * Math.sin(t * 2.1));
    jet.position.set(bx, beakY + h / 2, bzz); jet.scale.set(1, h, 1);
    for (let k = 0; k < 8; k++) { const ph = ((t * 0.7 + k / 8) % 1), yy = beakY + 4 * ph * (1 - ph) * h * 0.55, r = 0.03; V3.set(bx + Math.sin(k * 2.3) * ph * 0.5, yy, bzz + Math.cos(k * 2.3) * ph * 0.5); S3.set(r, r * 1.5, r); M4.compose(V3, Q, S3); drops.setMatrixAt(k, M4); }
    drops.instanceMatrix.needsUpdate = true;
  };
  update(0); drops.frustumCulled = false; jet.frustumCulled = false; ctx.add(jet); ctx.add(drops); ctx.onUpdate((dt, t) => update(t));
  out.fountain = { jet, drops }; out.triangles += 12 + 8 * 20;
}
/** a VB geometry with the uv attribute present (the merge needs the same attributes as GB) */
const withUv = (geo) => { if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2)); return geo; };

// ---------------------------------------------------------------------------------------------------------------- the orangery
function buildOrangery(ctx, parent, o, out, add) {
  const D = ORANGERY, g = new GB(), gl = new GB(), y = o.y, hl = o.hl, hw = o.hw;
  g.at(o.cx, y, o.cz, o.yaw);                                                              // local frame: z along the long axis (u), x across (v)
  const bayLen = o.length / o.bays, t = 0.42, w = D.wallH, ph = D.plinth, rh = D.ridgeH - D.wallH;
  // the brick plinth round the building (with the door gap in the middle of the entry end), 0.4 m thick
  // T7: the plinth is no flat brick slab any more: a darker course at a third of its height, a stone coping on top (the glass wall stands behind it)
  const brick = (x0, x1, z0, z1) => { g.box(x0, x1, 0, ph, z0, z1, D.brick, 'b'); g.box(x0 - 0.03, x1 + 0.03, ph * 0.3, ph * 0.38, z0 - 0.03, z1 + 0.03, D.brickD, 'b'); g.box(x0 - 0.05, x1 + 0.05, ph, ph + 0.08, z0 - 0.05, z1 + 0.05, D.coping, 'b'); };
  brick(-hw, -hw + t, -hl + t, hl - t); brick(hw - t, hw, -hl + t, hl - t);
  const gap = D.door / 2, entryZ = o.entry.end > 0 ? 1 : -1;
  if (entryZ > 0) { brick(-hw, -gap, hl - t, hl); brick(gap, hw, hl - t, hl); } else { brick(-hw, -gap, -hl, -hl + t); brick(gap, hw, -hl, -hl + t); }
  if (entryZ > 0) brick(-hw, hw, -hl, -hl + t); else brick(-hw, hw, hl - t, hl);               // the far end is closed
  // the iron frame: posts at every bay on both long sides, a rail at the eave, rafters over the gable, the ridge beam
  const post = 0.12;
  for (let i = 0; i <= o.bays; i++) {
    const z = -hl + i * bayLen;
    for (const s of [-1, 1]) g.box(s * hw - post / 2, s * hw + post / 2, ph, w, z - post / 2, z + post / 2, D.frame, 'b');
    // rafters: two sloping bars from the eave to the ridge (as thin boxes along the slope)
    for (const s of [-1, 1]) { const x0 = s * hw, x1 = 0, y0 = w, y1 = w + rh; g.quad([x0, y0, z - 0.05], [x0, y0 + 0.1, z - 0.05], [x1, y1 + 0.1, z - 0.05], [x1, y1, z - 0.05], D.frame); g.quad([x1, y1, z + 0.05], [x1, y1 + 0.1, z + 0.05], [x0, y0 + 0.1, z + 0.05], [x0, y0, z + 0.05], D.frame); }
  }
  g.box(-0.08, 0.08, w + rh, w + rh + 0.14, -hl, hl, D.frameD, 'b');                       // the ridge beam
  for (const s of [-1, 1]) g.box(s * hw - 0.08, s * hw + 0.08, w - 0.1, w + 0.06, -hl, hl, D.frameD, 'b');   // the eave rails
  // palms inside: trunks and fans (a dozen)
  for (let i = 0; i < 10; i++) {
    const u = -hl + (i + 0.5) * o.length / 10, v = (i % 2 ? 1 : -1) * hw * 0.35 * (0.5 + hashXZ(i, 1, 9)), h = 3.2 + hashXZ(i, 2, 9) * 2.6;
    g.cyl(v, u, ph, ph + h, 0.16, 0.11, 6, '#6b4f36');
    // T7: nine drooping fronds, each a leaf of two segments (a stalk widening to 0.32 m at the bend, a tip), both sides (the T6 fronds were single bars: a skeleton)
    for (let k = 0; k < 9; k++) {
      const a = (k + 0.37 * (i % 3)) / 9 * TAU, dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx, top = ph + h, cg = k % 2 ? '#3e7a3a' : '#4a8a42', cg2 = k % 2 ? '#356b34' : '#3d7838';
      const A0 = [v - px * 0.07, top, u - pz * 0.07], A1 = [v + px * 0.07, top, u + pz * 0.07], M0 = [v + dx * 0.95 - px * 0.34, top + 0.28, u + dz * 0.95 - pz * 0.34], M1 = [v + dx * 0.95 + px * 0.34, top + 0.28, u + dz * 0.95 + pz * 0.34], T = [v + dx * 2.0, top - 0.7, u + dz * 2.0];
      g.quad(A0, M0, M1, A1, cg); g.quad(A1, M1, M0, A0, cg2); g.tri(M0, T, M1, cg); g.tri(M1, T, M0, cg2);
    }
  }
  g.at();
  // the glass: the long walls above the plinth, the roof halves, the gable ends (transparent quads, one material)
  gl.at(o.cx, y, o.cz, o.yaw);
  const gc = D.glass;
  for (const s of [-1, 1]) {
    gl.quad([s * hw, ph, s > 0 ? -hl : hl], [s * hw, ph, s > 0 ? hl : -hl], [s * hw, w, s > 0 ? hl : -hl], [s * hw, w, s > 0 ? -hl : hl], gc);
    gl.quad([s * hw, w, s > 0 ? -hl : hl], [s * hw, w, s > 0 ? hl : -hl], [0, w + rh, s > 0 ? hl : -hl], [0, w + rh, s > 0 ? -hl : hl], gc);
  }
  for (const e of [-1, 1]) { gl.tri([-hw, ph, e * hl], [hw, ph, e * hl], [hw, w, e * hl], gc); gl.tri([-hw, ph, e * hl], [hw, w, e * hl], [-hw, w, e * hl], gc); gl.tri([-hw, w, e * hl], [hw, w, e * hl], [0, w + rh, e * hl], gc); }
  gl.at();
  add(g.build(), 'tauride-orangery');
  const mg = ctx.mat.toon('#ffffff', { vertexColors: true, transparent: true, opacity: D.glassOpacity, depthWrite: false, side: 'double', paint: 0.01, name: 'tauride-orangery-glass' });
  add(gl.build(), 'tauride-orangery-glass', { mat: mg, noOutline: true, shadow: false });
}

// ---------------------------------------------------------------------------------------------------------------- the pitch, the playgrounds, the fitness station
function pitchGeometry(g, p) {
  const S = PLAY.pitchSurface, y = p.y + S.lift, Pt = (u, v) => [p.c.x + p.ux * u + p.vx * v, y, p.c.z + p.uz * u + p.vz * v];
  // the turf in 12 mown bands across the long axis (two greens); the ring is a rectangle in the (u, v) frame of the pitch
  const nb = 12; for (let i = 0; i < nb; i++) { const ua = p.u0 + (p.u1 - p.u0) * i / nb, ub = p.u0 + (p.u1 - p.u0) * (i + 1) / nb; hq(g, Pt(ua, p.v0), Pt(ub, p.v0), Pt(ub, p.v1), Pt(ua, p.v1), i % 2 ? S.turf : S.turfD); }
  for (const [a, b] of p.lines) lineQuad(g, a, b, S.lineW, y + 0.012, S.line);
  const G = PLAY.goal;
  for (const gl of p.goals) {
    g.at(gl.x, gl.y, gl.z, gl.yaw);                                              // local: x across the goal mouth, z into the pitch (the back frame is at -z)
    const hw = G.w / 2, pw = G.post / 2;
    g.box(-hw - pw, -hw + pw, 0, G.h, -pw, pw, G.color, 'b'); g.box(hw - pw, hw + pw, 0, G.h, -pw, pw, G.color, 'b'); g.box(-hw - pw, hw + pw, G.h - pw * 2, G.h, -pw, pw, G.color, 'b');
    for (const s of [-1, 1]) { g.box(s * hw - pw, s * hw + pw, 0, pw * 2, -G.d, 0, G.color, 'b'); g.box(s * hw - pw / 2, s * hw + pw / 2, G.h - pw * 2, G.h, -G.d, 0, G.color, 'b'); g.box(s * hw - pw / 2, s * hw + pw / 2, 0.02, G.h - pw * 2, -G.d - pw / 2, -G.d + pw / 2, G.color, 'b'); }
    g.box(-hw, hw, G.h - pw * 2, G.h, -G.d - pw / 2, -G.d + pw / 2, G.color, 'b');                         // the back crossbar
    g.at();
  }
}
function playgroundGeometry(g, p) {
  const y = p.y + PLAY.lift;
  limestoneCap(g, p.ring, y, p.color);
  const S = PLAY.slide, W = PLAY.swing, SP = PLAY.sandpit, RK = PLAY.rocker;
  for (const it of p.items) {
    g.at(it.x, it.y, it.z, it.yaw);
    if (it.kind === 'slide') {
      const t = S.tower / 2;
      for (const [x, z] of [[-t, -t], [t, -t], [t, t], [-t, t]]) g.box(x - 0.04, x + 0.04, 0, S.h, z - 0.04, z + 0.04, S.post, 'b');
      g.box(-t, t, S.h - 0.06, S.h, -t, t, S.color, 'b'); g.pyramid(-t - 0.1, t + 0.1, -t - 0.1, t + 0.1, S.h + 0.02, S.h + 0.6, S.color);
      const ex = t + S.len; g.quad([t, S.h - 0.05, 0.22], [ex, 0.15, 0.22], [ex, 0.15, -0.22], [t, S.h - 0.05, -0.22], S.slideColor);      // T7: the chute bed faces UP (it was wound downwards: only the two red rails showed); a second quad under it faces down, so it reads from below too
      g.quad([t, S.h - 0.06, -0.22], [ex, 0.14, -0.22], [ex, 0.14, 0.22], [t, S.h - 0.06, 0.22], S.color);
      g.box(t, ex, 0.15, 0.3, -0.26, -0.22, S.color, 'b'); g.box(t, ex, 0.15, 0.3, 0.22, 0.26, S.color, 'b');
    } else if (it.kind === 'swing') {
      const hw = W.w / 2;
      for (const s of [-1, 1]) { g.box(s * hw - 0.05, s * hw + 0.05, 0, W.h, -0.5, -0.4, W.post, 'b'); g.box(s * hw - 0.05, s * hw + 0.05, 0, W.h, 0.4, 0.5, W.post, 'b'); }
      g.box(-hw, hw, W.h - 0.06, W.h + 0.04, -0.05, 0.05, W.post, 'b');
      for (const x of [-0.7, 0.7]) { g.box(x - 0.01, x - 0.0, 0.5, W.h - 0.06, -0.02, 0.02, W.chain, 'b'); g.box(x + 0.0, x + 0.01, 0.5, W.h - 0.06, -0.02, 0.02, W.chain, 'b'); g.box(x - 0.2, x + 0.2, 0.45, 0.5, -0.1, 0.1, W.seat, 'b'); }
    } else if (it.kind === 'sandpit') {
      const n = 12; for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), r = SP.r; g.quad([c0 * r, 0, s0 * r], [c1 * r, 0, s1 * r], [c1 * r, SP.kerbH, s1 * r], [c0 * r, SP.kerbH, s0 * r], SP.kerb); g.tri([0, 0.05, 0], [c1 * r, 0.05, s1 * r], [c0 * r, 0.05, s0 * r], SP.sand); g.quad([c0 * r, SP.kerbH, s0 * r], [c1 * r, SP.kerbH, s1 * r], [c1 * (r - 0.12), SP.kerbH, s1 * (r - 0.12)], [c0 * (r - 0.12), SP.kerbH, s0 * (r - 0.12)], SP.kerb); }
    } else if (it.kind === 'rocker') {
      g.cyl(0, 0, 0, 0.35, 0.08, 0.05, 6, RK.spring); g.box(-0.5, 0.5, 0.35, 0.55, -0.16, 0.16, RK.color, 'b'); g.box(0.35, 0.5, 0.55, 0.8, -0.16, 0.16, RK.color, 'b');
    }
    g.at();
  }
}
function fitnessGeometry(g, f) {
  const B = PLAY.bars, y = f.y + PLAY.lift;
  limestoneCap(g, f.ring, y, f.color);
  for (const b of f.bars) {
    g.at(b.x, b.y, b.z, b.yaw);
    for (const s of [-1, 1]) g.box(s * B.w / 2 - 0.05, s * B.w / 2 + 0.05, 0, B.h, -0.05, 0.05, B.color, 'b');
    g.box(-B.w / 2, B.w / 2, B.h - 0.05, B.h + 0.03, -0.03, 0.03, B.color, 'b'); g.box(-B.w / 2, B.w / 2, 1.2, 1.26, -0.03, 0.03, B.color, 'b');
    g.at();
  }
}
