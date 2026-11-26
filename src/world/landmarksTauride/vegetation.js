// landmarksTauride/vegetation.js - THE TREES OF THE TAURIDE GARDEN (docs/TAURIDE-REMAKE.md, phase T5; plan C4): the border belt of old trees, the lime avenues, the groves on the OSM woods, a few solitary oaks on the open
// meadows, the shore planting on the crest of the banks and the 7 mapped OSM trees, planted by the garden itself (the park and the woods are claimed, so the environment plants nothing inside the fence; HOOKS.treeReject
// answers 'garden' for the mapped trees), drawn with the ENGINE's tree geometry, materials and conventions (environment/treegeo.js, leafmat.js, tree-instances.js: one InstancedMesh per family and level of detail, the sway
// of the shared uniforms, trunk colliders), so that a garden tree looks like a city tree and costs the same per instance. The larch is a garden-local species row (data/vegetation.js SPECIES_EXTRA).
//   planVegetation(o)               PURE and DETERMINISTIC (a keyed hash per zone, no Math.random, no ctx): { trees: [{ zone, species, fam, sp, x, z, y, s, sy, yaw, r, h, tr, hex, bright, shrub, old, node }], canopy: [{ x, z, r }], stats }
//                                   node = { x, z, d, why } when the tree was nudged off its authored position (the mapped OSM trees: the nearest clear spot within ZONES.osm.nudge m of a node that a keep-out refuses), else null
//                                   o = { data (data/vegetation.js), gh (gardenHeight), shore (GARDEN_SHORE), garden (the outline ring), paths (data/paths.js), woods / play ([{ o, h }] of the facade), footprints ([ring]), gates, openings, monuments, fountains,
//                                         osmTrees, lane (SERVICE_LANE), memorial (the relief feature M), bridgeKeepOut (bridges.js plan.keepOut), bridgeHeads ([[x, z]]), reeds ([{ x, z }]), level ('high' | 'medium' | 'low'), species (the engine table) }
//   buildVegetation(ctx, parent, plan, o)   the meshes (per family: 4 canopy LODs + 2 trunk LODs, instanced; the contact-shadow blobs on flat ground), the trunk colliders on the terrain, the LOD assignment on the camera (hysteresis as
//                                   the environment's), the service numbers.
// EVERY TREE STANDS ON THE TERRAIN: y = gardenHeight(x, z) (the pond banks and the hills) through the instance writer's shapeOf; the trunk collider is a cylinder from the street level (or lower, on a bank) to y + 4.5 m, so the
// pedestrians' nav (people/nav.js: cylinders with y0 < 1.7) sees it as the environment's trunks.
// KEEP-OUTS (data/vegetation.js KEEP_OUT; tools/tauride/vegetation-test.mjs asserts each with a mutant): the building footprints, every way ribbon (trunk) and no crown lower than the walker's head over a ribbon, the water and the bank
// slope, the bridge decks, heads and the dam, the stairs, the reed clumps, the camera clearings (disc + look corridor), the pitch / playgrounds / fitness station, the fountain, the monuments, the memorial plateau, the gates and
// the fence openings, the service lane, the outline, the steep flanks, the crown packing.
import * as THREE from 'three';
import { createTreeInstanceWriter } from '../environment/tree-instances.js';
import { SPECIES, canopyGeometry, trunkGeometry, winterTreeGeometry } from '../environment/treegeo.js';
import { canopyMaterial, coniferMaterial, trunkMaterial } from '../environment/leafmat.js';
import * as DV from './data/vegetation.js';
import { PATHS } from './data/paths.js';
import { GARDEN, GARDEN_GREEN, FOOTPRINTS } from './data/footprints.js';
import { GATES, FENCE_OPENINGS, MONUMENTS, FOUNTAINS, OSM_TREES, SERVICE_LANE } from './data/furniture.js';
import { FEATURES } from './data/relief.js';
import { PATHS_DRAPED } from './paths-draped.js';
import { shoreRings } from './reeds.js';
import { gardenHeight, GARDEN_SHORE, PONDS } from './height.js';

/** the nudge search of plant() (fix round 2): rings every NUDGE_STEP m out to opts.nudge, NUDGE_DIRS candidates per ring (15 deg apart); the first clear candidate is the nearest ring's */
const NUDGE_STEP = 0.25, NUDGE_DIRS = 24;

// ---------------------------------------------------------------- deterministic streams (the engine's mulberry32, seeded by a string: the plan is the same bits in node, in the browser and in the tests)
function rngOf(seed) {
  let a = ([...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)) >>> 0;
  const r = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  return r;
}
const hashXZ = (x, z, salt = 0) => { let h = (Math.imul(Math.round(x * 8) | 0, 374761393) + Math.imul(Math.round(z * 8) | 0, 668265263) + Math.imul(salt | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
/** smooth value noise in [0, 1] of a 2-D lattice (two octaves) */
function noise2(x, z, seed) {
  const v = (xx, zz, f) => { const i = Math.floor(xx * f), j = Math.floor(zz * f), fx = xx * f - i, fz = zz * f - j, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz), h = (a, b) => hashXZ(a, b, seed + f); return (h(i, j) * (1 - sx) + h(i + 1, j) * sx) * (1 - sz) + (h(i, j + 1) * (1 - sx) + h(i + 1, j + 1) * sx) * sz; };
  return (v(x, z, 1) * 0.7 + v(x, z, 2.1) * 0.3);
}
const segDist = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0; return Math.hypot(x - ax - t * dx, z - az - t * dz); };
const polyDist = (x, z, pts) => { let m = Infinity; for (let i = 0; i + 3 < pts.length; i += 2) m = Math.min(m, segDist(x, z, pts[i], pts[i + 1], pts[i + 2], pts[i + 3])); return m; };
const ringDist = (x, z, r) => { let m = Infinity; for (let i = 0; i < r.length; i += 2) m = Math.min(m, segDist(x, z, r[i], r[i + 1], r[(i + 2) % r.length], r[(i + 3) % r.length])); return m; };
const ringHas = (o, x, z) => { let c = false; for (let i = 0, j = o.length - 2; i < o.length; j = i, i += 2) if ((o[i + 1] > z) !== (o[j + 1] > z) && x < (o[j] - o[i]) * (z - o[i + 1]) / (o[j + 1] - o[i + 1]) + o[i]) c = !c; return c; };
const polyHas = (x, z, p) => ringHas(p.o, x, z) && !(p.h || []).some((h) => ringHas(h, x, z));
const bboxOf = (r) => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]); } return [x0, x1, z0, z1]; };
/** a species of the mix, drawn with the weights tilted towards the species that lag behind their share among the trees PLACED so far in the zone (`counts`): the keep-outs refuse a wide old oak more often than a lime, and the
 *  authored shares would drift without this; the draw stays random (R) and deterministic */
function pick(R, table, counts = null) {
  let tot = 0; for (const k in table) tot += table[k];
  let n = 0; if (counts) for (const k in table) n += counts[k] || 0;
  const w = {}; let wt = 0;
  for (const k in table) { const share = table[k] / tot, want = share * (n + 1); w[k] = counts ? Math.max(0.05 * share, want - (counts[k] || 0) + share) : share; wt += w[k]; }
  let x = R() * wt; for (const k in table) { x -= w[k]; if (x <= 0) return k; }
  return Object.keys(table)[0];
}

/** the garden species table joined with the engine's rows: { key: { ...GARDEN_SPECIES row, F: the engine row } } */
export function speciesTable(data = DV, engine = SPECIES) {
  const rows = { ...engine, ...data.SPECIES_EXTRA }, out = {};
  for (const [k, g] of Object.entries(data.GARDEN_SPECIES)) { const F = rows[g.fam]; if (!F) throw new Error('vegetation: no engine family ' + g.fam + ' for the species ' + k); out[k] = { ...g, key: k, F }; }
  return out;
}

/** walk a closed ring ([x, z, ...]) by arc length: fn(x, z, tx, tz, nx, nz, s) at every station, `spacing` [lo, hi] jittered by R, the normal towards the side where `inside(x, z)` is true; starts at a jittered offset */
function walkRing(ring, R, spacing, inside, fn) {
  const n = ring.length / 2, pts = []; for (let i = 0; i < n; i++) pts.push([ring[2 * i], ring[2 * i + 1]]);
  let carry = R.range(spacing[0], spacing[1]) * 0.5, s = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 1e-6) continue;
    const tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l; let nx = -tz, nz = tx;
    if (!inside(a[0] + tx * l * 0.5 + nx * 0.5, a[1] + tz * l * 0.5 + nz * 0.5)) { nx = -nx; nz = -nz; }
    let u = carry;
    while (u < l) { fn(a[0] + tx * u, a[1] + tz * u, tx, tz, nx, nz, s + u); u += R.range(spacing[0], spacing[1]); }
    carry = u - l; s += l;
  }
}
/** walk an open polyline ([x, z, ...]) by arc length from `from` to length - `from`: fn(x, z, tx, tz, nx, nz, s) */
function walkLine(pts, R, spacing, from, fn) {
  const n = pts.length / 2, cum = [0]; for (let i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]));
  const L = cum[n - 1]; let s = from + R.range(0, spacing[0] * 0.5);
  while (s < L - from) {
    let i = 1; while (i < n - 1 && cum[i] < s) i++;
    const ax = pts[2 * i - 2], az = pts[2 * i - 1], bx = pts[2 * i], bz = pts[2 * i + 1], seg = cum[i] - cum[i - 1] || 1, t = (s - cum[i - 1]) / seg, tx = (bx - ax) / seg, tz = (bz - az) / seg;
    fn(ax + (bx - ax) * t, az + (bz - az) * t, tx, tz, -tz, tx, s);
    s += R.range(spacing[0], spacing[1]);
  }
}

/** the inputs of planVegetation from the data modules, the facade GREEN list (the wood and play polygons) and the plans of the bridges and the reeds: { woods, play, footprints, gates, openings, monuments, fountains, osmTrees, lane, memorial, bridgeKeepOut, bridgeHeads, reeds } */
export function collectVegetationInputs(GREEN, bplan = null, rplan = null, data = { GARDEN, GARDEN_GREEN, FOOTPRINTS, GATES, FENCE_OPENINGS, MONUMENTS, FOUNTAINS, OSM_TREES, SERVICE_LANE, FEATURES }) {
  const byId = new Map(); for (const g of GREEN || []) byId.set(g.id, g);
  const polys = (ids) => { const out = []; for (const id of ids) { const g = byId.get(id); if (g) for (const p of g.polys) out.push({ o: p.o, h: p.h || [] }); } return out; };
  const DG = data.GARDEN_GREEN || null;
  return {
    garden: data.GARDEN.o,
    woods: DG ? polys(DG.woods.map((w) => w.id)) : [], play: DG ? polys(DG.others.filter((g) => g.kind !== 'wetland').map((g) => g.id)) : [],
    footprints: data.FOOTPRINTS.flatMap((f) => f.polys.map((p) => p.o)),
    gates: data.GATES.map((g) => ({ x: g.x, z: g.z })), openings: data.FENCE_OPENINGS.map((o) => ({ x: (o.x + o.x2) / 2, z: (o.z + o.z2) / 2 })),
    monuments: data.MONUMENTS.map((m) => ({ x: m.x, z: m.z })), fountains: data.FOUNTAINS.map((f) => ({ x: f.x, z: f.z })), osmTrees: data.OSM_TREES.map((t) => ({ x: t.x, z: t.z })),
    lane: data.SERVICE_LANE, memorial: data.FEATURES.find((f) => f.key === 'M') || null,
    bridgeKeepOut: bplan ? bplan.keepOut : [], bridgeHeads: bplan ? bplan.sites.flatMap((s) => [s.axis[0], s.axis[s.axis.length - 1]]) : [], reeds: rplan ? rplan.instances : [],
  };
}

/**
 * The plan (pure). Zones in the order osm, meadow, belt, avenue, shore, grove (the packing test couples a tree to the ones placed before it: the old trees of the belt take their places first, the avenue limes of the perimeter alley fill in between them); then the tier thinning (BUDGET).
 */
export function planVegetation(o = {}) {
  const t0 = Date.now();
  const D = o.data || DV, K = { ...D.KEEP_OUT, ...(o.keepOut || {}) }, Z = o.zones || D.ZONES, SPT = speciesTable(D, o.species || SPECIES), level = o.level || 'medium';
  const gh = o.gh || gardenHeight, shore = o.shore || GARDEN_SHORE, garden = o.garden || GARDEN.o, paths = o.paths || PATHS, P = o.ponds || PONDS;
  const woods = o.woods || [], play = o.play || [], footprints = o.footprints || [], gates = [...(o.gates || []), ...(o.openings || [])], monuments = o.monuments || [], fountains = o.fountains || [], furniture = o.furniture || [];
  const osmTrees = o.osmTrees || [], lane = o.lane || null, memorial = o.memorial || null, decks = o.bridgeKeepOut || [], heads = o.bridgeHeads || [], reeds = o.reeds || [], clearings = o.clearings || D.CLEARINGS, orangery = o.orangery || D.ORANGERY;
  const H = (x, z) => gh(x, z) ?? 0;
  const slopeAt = (x, z) => Math.hypot(H(x + 0.5, z) - H(x - 0.5, z), H(x, z + 0.5) - H(x, z - 0.5));
  // the crest of the bank profile (data/ponds.js): the quadratic ease runs RUN x s metres inland from the waterline (the slope varies along the shore), then the crest falls over CREST_FALL m
  const prof = (gh.profile && gh.profile.slopeAt) ? gh.profile : null, RUN = 2 * (P.BANK_TOP - P.WATER_Y);
  const crestAt = o.crestAt || ((x, z) => RUN * (prof ? prof.slopeAt(x, z) : P.SLOPE_MAX));
  const ways = paths.filter((p) => p.cls !== 'bridge' && p.cls !== 'steps').map((p) => ({ pts: p.pts, hw: p.w / 2 + PATHS_DRAPED.pad, box: bboxOf(p.pts) })), stairs = paths.filter((p) => p.cls === 'steps').map((p) => p.pts);
  const deckList = decks.map((k) => ({ pts: k.axis.flat(), r: k.hw + (k.type === 'weir' ? K.dam : K.deck) }));
  const laneWays = lane ? lane.ways.map((w) => ({ pts: w.pts, hw: (w.w || lane.w || 4) / 2 })) : [];
  const clearList = clearings.map((c) => { const a = c.yaw * Math.PI / 180; return { x: c.x, z: c.z, dx: -Math.sin(a), dz: -Math.cos(a), len: c.len || 0, hw: c.hw || 0 }; });
  const woodsBox = woods.map((p) => ({ p, b: bboxOf(p.o) })), playBox = play.map((p) => ({ p, b: bboxOf(p.o) })), fpBox = footprints.map((r) => ({ r, b: bboxOf(r) }));
  // the reeds on an 8 m grid
  const RG = new Map(), rk = (i, j) => i * 100003 + j;
  for (const q of reeds) { const k = rk(Math.floor(q.x / 8), Math.floor(q.z / 8)); let l = RG.get(k); if (!l) RG.set(k, (l = [])); l.push(q); }
  const reedNear = (x, z, m) => { const ci = Math.floor(x / 8), cj = Math.floor(z / 8); for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const l = RG.get(rk(i, j)); if (l) for (const q of l) if (Math.hypot(q.x - x, q.z - z) < m) return true; } return false; };
  // the placed trees on an 8 m grid (the packing test)
  const list = [], solitaries = [], grid = new Map(), gk = (i, j) => i * 100003 + j, cellOf = (v) => Math.floor(v / 8);
  const near = (x, z) => { const out = []; const ci = cellOf(x), cj = cellOf(z); for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const a = grid.get(gk(i, j)); if (a) out.push(...a); } return out; };
  const stats = { zones: {}, rejected: {}, nudged: {}, ms: 0 };
  let furnActive = false; const furnBox = furniture;
  const zs = (zone) => stats.zones[zone] || (stats.zones[zone] = { candidates: 0, placed: 0, species: {} });

  /** why (x, z) may not hold a tree of species `sp` at scale s (the trunk radius tr, the crown radius r, the crown base cb); null = it may. Every zone answers every rule (fix round 2: the mapped OSM trees are no longer forced through). */
  function reject(x, z, sp, s, sy, zone) {
    const F = sp.F, tr = F.trunk * Math.min(1.1, 0.7 + 0.35 * s), r = F.R * s, cb = sp.base * sy, shrub = !!F.shrub;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return 'nan';
    const d = shore.dist(x, z);
    if (d <= K.water) return 'water';
    if (!shore.inGarden(x, z) || ringDist(x, z, garden) < K.outline) return 'outline';
    const crest = crestAt(x, z);
    if (zone === 'shore') { if (d < crest + Z.shore.d[0] - 0.05 || d > crest + Z.shore.d[1] + 0.3) return 'bank'; }
    else if (d < crest + K.bankMargin) return 'bank';
    const sl = slopeAt(x, z); if (sl > K.slope || (sp.old && sl > K.slopeOld)) return 'slope';
    for (const f of fpBox) if (x > f.b[0] - K.footprint - tr && x < f.b[1] + K.footprint + tr && z > f.b[2] - K.footprint - tr && z < f.b[3] + K.footprint + tr && (ringHas(f.r, x, z) || ringDist(x, z, f.r) < K.footprint + tr)) return 'footprint';
    for (const w of ways) {
      const m = w.hw + (cb < K.headClear ? Math.max(r, K.way + tr) : K.way + tr);
      if (x < w.box[0] - m || x > w.box[1] + m || z < w.box[2] - m || z > w.box[3] + m) continue;
      const pd = polyDist(x, z, w.pts); if (pd < w.hw + K.way + tr) return 'way'; if (cb < K.headClear && pd < w.hw + r) return 'way-crown';
    }
    for (const st of stairs) if (polyDist(x, z, st) < K.stair) return 'stair';
    for (const l of laneWays) if (polyDist(x, z, l.pts) < l.hw + K.lane + tr) return 'lane';
    for (const dk of deckList) if (polyDist(x, z, dk.pts) < dk.r) return 'deck';
    for (const h of heads) if (Math.hypot(h[0] - x, h[1] - z) < K.head) return 'head';
    if (reedNear(x, z, K.reed + tr)) return 'reed';
    for (const c of clearList) { const px = x - c.x, pz = z - c.z; if (px * px + pz * pz < (K.pose + r * 0.5) * (K.pose + r * 0.5)) return 'pose'; const t = px * c.dx + pz * c.dz; if (c.len && t > 0 && t < c.len && Math.abs(px * c.dz - pz * c.dx) < c.hw * (1 - 0.5 * t / c.len) + r * 0.5) return 'pose'; }
    for (const p of playBox) if (x > p.b[0] - K.play && x < p.b[1] + K.play && z > p.b[2] - K.play && z < p.b[3] + K.play && (polyHas(x, z, p.p) || ringDist(x, z, p.p.o) < K.play)) return 'play';
    for (const f of fountains) if (Math.hypot(f.x - x, f.z - z) < K.fountain) return 'fountain';
    for (const m of monuments) if (Math.hypot(m.x - x, m.z - z) < K.monument) return 'monument';
    if (memorial) { const a = (memorial.rot || 0) * Math.PI / 180, c = Math.cos(a), si = Math.sin(a), dx = x - memorial.x, dz = z - memorial.z, u = (dx * c + dz * si) / (memorial.rx + K.memorial), v = (-dx * si + dz * c) / (memorial.rz + K.memorial); if (u * u + v * v < 1) return 'memorial'; }
    for (const g of gates) if (Math.hypot(g.x - x, g.z - z) < K.gate) return 'gate';
    if (furnActive) for (const f of furnBox) if (Math.abs(f.x - x) < f.r + tr + K.furniture && Math.abs(f.z - z) < f.r + tr + K.furniture && Math.hypot(f.x - x, f.z - z) < f.r + tr + K.furniture) return 'furniture';      // T6: the post pass below
    if (orangery && Math.hypot(orangery.x - x, orangery.z - z) < orangery.r) return 'orangery';
    if (zone !== 'meadow') for (const m of solitaries) if (Math.hypot(m.x - x, m.z - z) < (Z.meadow.clear || 0)) return 'solitary';      // the clearing round a solitary oak of the meadows
    const pack = shrub ? Math.min(K.pack, 0.42) : K.pack;
    for (const nb of near(x, z)) if (Math.hypot(nb.x - x, nb.z - z) < (nb.r + r) * (nb.shrub || shrub ? Math.min(pack, 0.42) : pack)) return 'pack';
    return null;
  }
  function plant(zone, key, x, z, R, opts = {}) {
    const sp = SPT[key]; if (!sp) throw new Error('vegetation: unknown species ' + key);
    const F = sp.F, s = opts.s ?? R.range(sp.scale[0], sp.scale[1]), sy = s * R.range(0.95, 1.1), zst = zs(zone); zst.candidates++;
    let why = reject(x, z, sp, s, sy, zone), node = null;
    // the nudge (fix round 2; the mapped OSM trees): a position that a rule refuses (not the water) moves to the NEAREST clear spot within opts.nudge m: rings of NUDGE_STEP m, NUDGE_DIRS directions each, the first clear
    // candidate wins (deterministic: the ring order is the distance, the direction order is fixed); none within the radius = refused with the reason of the node itself
    if (why && why !== 'water' && why !== 'nan' && opts.nudge > 0) {
      search: for (let d = NUDGE_STEP; d <= opts.nudge + 1e-9; d += NUDGE_STEP) for (let i = 0; i < NUDGE_DIRS; i++) {
        const a = i * 2 * Math.PI / NUDGE_DIRS, cx = x + d * Math.cos(a), cz = z + d * Math.sin(a);
        if (!reject(cx, cz, sp, s, sy, zone)) { node = { x, z, d, why }; x = cx; z = cz; why = null; break search; }
      }
    }
    if (why) { const k = zone + ':' + why; stats.rejected[k] = (stats.rejected[k] || 0) + 1; return false; }
    const pal = D.LEAF[sp.leaf] || D.LEAF.lime, hex = pal[Math.floor(R() * pal.length)];
    const t = { zone, species: key, fam: sp.fam, sp: F.sp, x, z, y: H(x, z), s, sy, yaw: R() * 6.283, r: F.R * s, h: F.H * s, tr: F.trunk * Math.min(1.1, 0.7 + 0.35 * s), hex, bright: R.range(0.93, 1.07), shrub: !!F.shrub, old: !!sp.old, node, keep: hashXZ(x, z, 77) };
    if (node) { zst.nudged = (zst.nudged || 0) + 1; (stats.nudged[zone] || (stats.nudged[zone] = [])).push({ from: [node.x, node.z], to: [x, z], d: node.d, why: node.why }); }
    list.push(t); zst.placed++; zst.species[key] = (zst.species[key] || 0) + 1; if (zone === 'meadow') solitaries.push(t);
    const k = gk(cellOf(x), cellOf(z)); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(t);
    return true;
  }
  const inside = (x, z) => shore.inGarden(x, z);

  // ---- 1. the 7 OSM trees: old oaks at their mapped positions, every keep-out applied; a node that a rule refuses (the perimeter alley w425201986 runs over three of them: a mapped node sits within the mapping error) is
  //         nudged to the nearest clear spot within Z.osm.nudge m (fix round 2: the first version forced them through every rule but the water, and one oak stood on the asphalt)
  { const R = rngOf('tauride-veg:osm'); for (const q of osmTrees) plant('osm', Z.osm.species, q.x, q.z, R, { nudge: Z.osm.nudge || 0 }); }
  // ---- 2. the solitary oaks of the meadows
  { const R = rngOf('tauride-veg:meadow'); for (const q of Z.meadow.solitary) plant('meadow', 'oldOak', q.x, q.z, R); }
  // ---- 3. the border belt: a jittered lattice over the band inside the fence (inner .. width m from the outline), thinning towards its inner edge
  { const R = rngOf('tauride-veg:belt'), B = Z.belt, gb = bboxOf(garden), st = B.step, j = B.jitter;
    for (let z = Math.floor(gb[2] / st) * st; z < gb[3]; z += st) for (let x = Math.floor(gb[0] / st) * st; x < gb[1]; x += st) {
      const px = x + st / 2 + R.range(-j, j), pz = z + st / 2 + R.range(-j, j), key = pick(R, B.mix, zs('belt').species), u = R();
      if (!inside(px, pz)) continue;
      const d = ringDist(px, pz, garden); if (d < B.inner || d > B.width) continue;
      if (d > B.fadeFrom && u > 1 - (d - B.fadeFrom) / (B.width - B.fadeFrom) * 0.75) continue;
      plant('belt', key, px, pz, R);
    }
  }
  // ---- 4. the avenues: limes on both sides of the main alleys
  for (const p of paths) {
    if (!Z.avenue.classes.includes(p.cls) || p.lenM < Z.avenue.minLen) continue;
    const R = rngOf('tauride-veg:avenue:' + p.id), off = p.w / 2 + PATHS_DRAPED.pad + Z.avenue.offset;
    walkLine(p.pts, R, Z.avenue.spacing, Z.avenue.endClear, (x, z, tx, tz, nx, nz) => { for (const side of [-1, 1]) { const along = R.range(-0.8, 0.8); plant('avenue', pick(R, Z.avenue.mix, zs('avenue').species), x + nx * side * off + tx * along, z + nz * side * off + tz * along, R); } });
  }
  // ---- 5. the shore: on the crest band of the banks, walked along the shore rings (the land normal of reeds.js shoreRings)
  { const rings = shoreRings(o.union || undefined);
    rings.forEach((ring, ri) => {
      const R = rngOf('tauride-veg:shore:' + ri), v = ring.v, m = v.length, flat = []; for (const q of v) flat.push(q[0], q[1]);
      walkRing(flat, R, Z.shore.spacing, (x, z) => shore.dist(x, z) > 0, (x, z, tx, tz, nx, nz) => {
        const crest = crestAt(x, z), d = crest + R.range(Z.shore.d[0], Z.shore.d[1]);
        plant('shore', pick(R, Z.shore.mix, zs('shore').species), x + nx * d, z + nz * d, R);
      });
      void m;
    });
  }
  // ---- 6. the groves on the wood polygons: a jittered lattice thinned by a slow noise (clearings and dense knots, not a plantation)
  woodsBox.forEach((w, wi) => {
    const R = rngOf('tauride-veg:grove:' + wi), b = w.b, G = Z.grove, st = G.step, j = G.jitter, C = G.clump;
    // T7 (the T5 GPU QA: 'the groves show a near-regular trunk lattice'): each wood's lattice is TURNED by its own angle (G.turn) about the box centre and its points are carried by a slow warp (G.warp m), so no two woods
    // share a row direction and the rows bend; the cells are the same size, the clump noise and the jitter are as they were
    const wc = [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2], hd = Math.hypot(b[1] - b[0], b[3] - b[2]) / 2 + st, th = G.turn ? R.range(0, G.turn) * Math.PI / 180 : 0, ct = Math.cos(th), sn = Math.sin(th), WP = G.warp || 0;
    for (let v0 = -Math.floor(hd / st) * st; v0 < hd; v0 += st) for (let u0 = -Math.floor(hd / st) * st; u0 < hd; u0 += st) {
      const lu = u0 + st / 2 + R.range(-j, j), lv = v0 + st / 2 + R.range(-j, j);
      let px = wc[0] + lu * ct - lv * sn, pz = wc[1] + lu * sn + lv * ct;
      if (WP) { const wx = noise2(px / 37, pz / 37, 53) - 0.5, wz = noise2(px / 37 + 11, pz / 37 - 7, 59) - 0.5; px += wx * 2 * WP; pz += wz * 2 * WP; }
      const shrub = R() < G.shrub, key = shrub ? 'shrub' : pick(R, G.mix, zs('grove').species), u = R();
      if (!polyHas(px, pz, w.p)) continue;
      if (C) { const n = noise2(px / C.period, pz / C.period, 31), keep = C.keep[0] + (C.keep[1] - C.keep[0]) * n; if (u > keep) continue; }
      plant('grove', key, px, pz, R);
    }
  });
  // ---- 7. the furniture (T6): no trunk may stand on a bench, a bin, a lantern or a pier. A POST PASS, so that the planting stays what it was everywhere else (the packing and the random stream of the zones are not touched): a tree
  //         whose trunk surface is nearer than KEEP_OUT.furniture to a piece (its footprint radius r) moves to the nearest clear spot within KEEP_OUT.furnitureNudge m (rings of NUDGE_STEP, NUDGE_DIRS directions: the
  //         rule of the OSM trees) or goes
  stats.furniture = { pieces: furniture.length, hit: 0, moved: 0, dropped: 0, byZone: {} };
  if (furniture.length) {
    furnActive = true;
    const hits = list.filter((t) => furniture.some((f) => Math.hypot(f.x - t.x, f.z - t.z) < f.r + t.tr + K.furniture));
    for (const t of hits) {
      stats.furniture.hit++;
      const g0 = grid.get(gk(cellOf(t.x), cellOf(t.z))); if (g0) g0.splice(g0.indexOf(t), 1);
      const sp = SPT[t.species], zst = zs(t.zone); let moved = null;
      search: for (let d = NUDGE_STEP; d <= (K.furnitureNudge || 0) + 1e-9; d += NUDGE_STEP) for (let i = 0; i < NUDGE_DIRS; i++) {
        const a = i * 2 * Math.PI / NUDGE_DIRS, cx = t.x + d * Math.cos(a), cz = t.z + d * Math.sin(a);
        if (!reject(cx, cz, sp, t.s, t.sy, t.zone)) { moved = { x: cx, z: cz, d }; break search; }
      }
      if (moved) {
        t.fnode = { x: t.x, z: t.z, d: moved.d }; t.x = moved.x; t.z = moved.z; t.y = H(t.x, t.z); t.keep = hashXZ(t.x, t.z, 77);
        const k = gk(cellOf(t.x), cellOf(t.z)); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(t);
        stats.furniture.moved++;
      } else {
        list.splice(list.indexOf(t), 1); zst.placed--; zst.species[t.species]--; stats.furniture.dropped++;
        const ti = solitaries.indexOf(t); if (ti >= 0) solitaries.splice(ti, 1);
      }
      stats.furniture.byZone[t.zone] = (stats.furniture.byZone[t.zone] || 0) + 1;
    }
    furnActive = false;
  }
  // ---- the tier: a budget per level and a share of the plan (each tree keeps or goes by its own hash: the low tier is a subset of the medium one); the OSM trees and the solitary oaks always stay
  const B = D.BUDGET, cap = B.instances[level] ?? B.instances.medium, share = B.tierFactor[level] ?? 1;
  const fixed = list.filter((t) => t.zone === 'osm' || t.zone === 'meadow'), free = list.filter((t) => !(t.zone === 'osm' || t.zone === 'meadow')).sort((a, b) => a.keep - b.keep || a.x - b.x || a.z - b.z);
  const nKeep = Math.min(free.length, Math.max(0, cap - fixed.length), Math.round(free.length * share));
  const kept = new Set(free.slice(0, nKeep));
  const trees = list.filter((t) => t.zone === 'osm' || t.zone === 'meadow' || kept.has(t));
  trees.forEach((t, i) => { t.id = i; });
  const canopy = trees.filter((t) => !t.shrub).map((t) => ({ x: t.x, z: t.z, r: t.r }));
  const perZone = {}; for (const t of trees) perZone[t.zone] = (perZone[t.zone] || 0) + 1;
  const perSpecies = {}; for (const t of trees) perSpecies[t.species] = (perSpecies[t.species] || 0) + 1;
  stats.level = level; stats.planned = list.length; stats.instances = trees.length; stats.kept = perZone; stats.species = perSpecies; stats.shrubs = trees.filter((t) => t.shrub).length; stats.ms = Date.now() - t0;
  return { trees, canopy, stats, level };
}

// ---------------------------------------------------------------- bark textures (the painter of environment/trees.js barkTexture, character for character: the same cache keys give the environment's textures when it built first)
function barkTexture(ctx, kind) {
  return ctx.tex.draw(128, 256, (g, w, h) => {
    const r = ctx.rng('bark-pb-' + kind);
    const furrows = (base, dark, n, wmin) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < n; i++) { const x = r() * w; g.strokeStyle = dark.replace('A', (0.35 + r() * 0.35).toFixed(2)); g.lineWidth = wmin + r() * 4; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.07 + i) * 5 + (r() - 0.5) * 4, y); g.stroke(); }
    };
    if (kind === 'birch') {
      g.fillStyle = '#ece8dc'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(150,145,135,${0.06 + r() * 0.1})`; g.fillRect(r() * w, 0, 2 + r() * 8, h); }
      for (let i = 0; i < 52; i++) {
        const x = r() * w, y = r() * h, ww = 8 + r() * 26, hh = 2 + r() * 5;
        g.fillStyle = `rgba(34,31,29,${0.75 + r() * 0.2})`; g.beginPath(); g.ellipse(x, y, ww / 2, hh / 2, (r() - 0.5) * 0.25, 0, 6.3); g.fill();
        if (x + ww / 2 > w) { g.beginPath(); g.ellipse(x - w, y, ww / 2, hh / 2, 0, 0, 6.3); g.fill(); }
      }
    } else if (kind === 'pale') {                                                    // poplar: pale grey, furrowed
      g.fillStyle = '#948c7c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h; g.fillStyle = `rgba(60,54,48,${0.25 + r() * 0.3})`; g.fillRect(x, y, 2 + r() * 3, 8 + r() * 26); }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(200,192,176,${0.12 + r() * 0.15})`; g.fillRect(r() * w, r() * h, 3 + r() * 6, 12 + r() * 30); }
    } else if (kind === 'lime') furrows('#5e5044', 'rgba(32,26,20,A)', 38, 2);    // dark furrowed lime / elm
    else if (kind === 'oak') furrows('#6c5e4e', 'rgba(34,28,22,A)', 30, 3);
    else if (kind === 'ash') furrows('#8a857c', 'rgba(52,48,42,A)', 34, 2);
    else if (kind === 'maple') furrows('#7a6e62', 'rgba(46,40,34,A)', 30, 2);
    else furrows('#6f645a', 'rgba(46,40,36,A)', 34, 2);
  }, { key: 'env-bark-pb-' + kind, repeat: [1, 1], anisotropy: 4 });
}
function blobTexture(ctx) {
  return ctx.tex.draw(128, 128, (g, w, h) => {
    const c = w / 2, grd = g.createRadialGradient(c, c, 0, c, c, c);
    grd.addColorStop(0, 'rgba(255,255,255,0.34)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.16)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.clearRect(0, 0, w, h); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, { key: 'env-treeblob-pb', anisotropy: 2 });
}
const triCount = (g) => (g ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0);

/**
 * The meshes and colliders of a plan. o = { at: [x, z] (the first LOD assignment: the page's HERO, as the environment does), species (the engine table), gh (the slope test of the blobs), inPlay(x, z, m) (the collider gate; default: every tree) }.
 * Returns { group, meshes, instances, colliders, triangles() (at the current assignment), trianglesWorst (every tree at LOD0), draws() (buckets with instances), assign(x, z), readBack(), treeList, families }.
 */
export function buildVegetation(ctx, parent, plan, o = {}) {
  const T = THREE, rows = { ...(o.species || SPECIES), ...(plan.speciesExtra || DV.SPECIES_EXTRA) }, list = plan.trees, LOD_D = DV.LOD_D, gh = o.gh || gardenHeight;
  const col = new T.Color();
  const winter = ctx.season === 'winter';
  for (const t of list) {
    const tint = rows[t.fam].sp === 'spruce' ? '#86a59e' : '#74665c';
    col.set(winter ? tint : t.hex).multiplyScalar(t.bright); t.rgb = [col.r, col.g, col.b];
  }
  const fams = [...new Set(list.map((t) => t.fam))].sort(), byFam = {}; for (const f of fams) byFam[f] = [];
  for (const t of list) byFam[t.fam].push(t);
  const matLobe = canopyMaterial(ctx), matTier = coniferMaterial(ctx), barkMat = {};
  const group = new T.Group(); group.name = 'tauride-trees'; parent.add(group);
  const M = {}, TR = {}, meshes = [];
  for (const fam of fams) {
    const n = byFam[fam].length, F = rows[fam]; M[fam] = []; TR[fam] = [];
    if (!barkMat[F.bark]) barkMat[F.bark] = trunkMaterial(ctx, barkTexture(ctx, F.bark), 'env-bark-pb-' + F.bark);
    for (let l = 0; l < 4; l++) {
      const bare = winter && F.sp !== 'spruce';
      const geometry = bare ? winterTreeGeometry(fam, l, F) : canopyGeometry(F.geo || fam, l, F);
      const material = bare ? ctx.mat.toon('#ffffff', { name: 'dormant-branches' }) : F.kind === 'tiers' ? matTier : matLobe;
      const im = new T.InstancedMesh(geometry, material, n);
      im.instanceMatrix.setUsage(T.DynamicDrawUsage); im.setColorAt(0, col.setRGB(1, 1, 1)); im.instanceColor.setUsage(T.DynamicDrawUsage);
      im.count = 0; im.frustumCulled = false; im.castShadow = l <= 1; im.receiveShadow = l <= 1; im.name = `tauride-tree-${fam}-${l}`; im.visible = false;
      group.add(im); M[fam].push(im); meshes.push(im);
      if (l <= 1) {
        const tg = trunkGeometry(F.geo || fam, l, F);
        if (tg) { const tm = new T.InstancedMesh(tg, barkMat[F.bark], n); tm.instanceMatrix = im.instanceMatrix; tm.count = 0; tm.frustumCulled = false; tm.castShadow = true; tm.receiveShadow = true; tm.name = `tauride-trunk-${fam}-${l}`; tm.visible = false; group.add(tm); TR[fam].push(tm); meshes.push(tm); }
        else TR[fam].push(null);
      }
    }
  }
  // the soft contact shadow under every crown that stands on flat ground (a flat disc on a bank or a hill flank would cut into the slope or float: those trees have none; the shadow map reaches ~90 m)
  let blobMesh = null, blobs = 0;
  { const flat = list.filter((t) => { const h = gh(t.x, t.z); if (h === null || h === undefined) return true; return Math.hypot((gh(t.x + 0.5, t.z) ?? 0) - (gh(t.x - 0.5, t.z) ?? 0), (gh(t.x, t.z + 0.5) ?? 0) - (gh(t.x, t.z - 0.5) ?? 0)) < 0.02; });
    const blob = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), ctx.mat.decal('#ffffff', { map: blobTexture(ctx), transparent: true, polygonOffset: -3, paint: 0.0, name: 'env-treeblob-pb' }), Math.max(1, flat.length));
    const m4 = new T.Matrix4(), qt = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(), cc = new T.Color(), up = new T.Vector3(0, 1, 0);
    flat.forEach((t, i) => { const d = t.r * (t.shrub ? 1.9 : t.sp === 'larch' ? 2.0 : 2.2); qt.setFromAxisAngle(up, t.yaw); m4.compose(v.set(t.x, t.y + 0.035, t.z), qt, sc.set(d, 1, d)); blob.setMatrixAt(i, m4); blob.setColorAt(i, cc.set(t.sp === 'larch' ? '#18241a' : '#1e2a14')); });
    blob.count = flat.length; blob.instanceMatrix.needsUpdate = true; if (blob.instanceColor) blob.instanceColor.needsUpdate = true; blob.receiveShadow = false; blob.frustumCulled = false; blob.name = 'tauride-treeblob';
    ctx.noOutline(blob); ctx.noBatch(blob); group.add(blob); blobMesh = blob; blobs = flat.length;
  }
  // the trunk colliders: a cylinder from the street level (lower on a bank) to the crown base over the terrain (people/nav.js takes a cylinder with y0 < 1.7 as an obstacle; the player is blocked at every height of the hill)
  const inPlay = o.inPlay || (() => true); let colliders = 0;
  for (const t of list) if (inPlay(t.x, t.z, -5)) { t.col = ctx.physics.addCylinder(t.x, t.z, t.tr, Math.min(0, t.y) - 0.5, t.y + (t.shrub ? 1.3 : 4.5)); colliders++; }
  // the LOD assignment (the environment's rule without the view cone: the garden is small): re-packed when the camera moves
  const state = new Int8Array(list.length).fill(-1);
  const lodSink = { list: null };
  const writer = createTreeInstanceWriter(list, (t) => ({ y: t.y, sx: t.s, sy: t.sy, sz: t.s, rgb: t.rgb }));
  const buckets = {}; for (const f in M) buckets[f] = M[f].map((m) => writer.bucket(m));
  function assign(cx, cz) {
    for (let i = 0; i < list.length; i++) {
      const t = list[i], d = Math.hypot(t.x - cx, t.z - cz);
      let l = d < LOD_D[0] ? 0 : d < LOD_D[1] ? 1 : d < LOD_D[2] ? 2 : 3;
      const pv = state[i];
      if (pv >= 0 && pv !== l) { const lo = pv === 0 ? 0 : LOD_D[pv - 1] * 0.9, hi = pv === 3 ? 1e9 : LOD_D[pv] * 1.1; if (d >= lo && d < hi) l = pv; }
      state[i] = l; if (lodSink.list) lodSink.list[i].lod = l;
      if (pv !== l) writer.assign(buckets[t.fam][l], i);
    }
    writer.finish();
    for (const f in M) for (let l = 0; l < 4; l++) { const c = M[f][l].count; if (l <= 1 && TR[f][l]) { TR[f][l].count = c; TR[f][l].visible = c > 0; } }
  }
  const at = o.at || [list.length ? list[0].x : 0, list.length ? list[0].z : 0];
  assign(at[0], at[1]);
  let lx = at[0], lz = at[1], lt = -10;
  ctx.onUpdate((dt, tm) => { const p = ctx.camera && ctx.camera.position; if (!p) return; const moved = Math.hypot(p.x - lx, p.z - lz); if (moved > 2.5 || (Math.abs(tm - lt) > 1.5 && moved > 0.5)) { assign(p.x, p.z); lx = p.x; lz = p.z; lt = tm; } });
  const tris = (m) => triCount(m.geometry);
  const triangles = () => meshes.reduce((s, m) => s + m.count * tris(m), 0);
  let worst = 0; for (const fam of fams) { const n = byFam[fam].length; worst += n * (tris(M[fam][0]) + (TR[fam][0] ? tris(TR[fam][0]) : 0)); }
  const draws = () => meshes.filter((m) => m.count > 0).length + (blobs ? 1 : 0);
  /** every instance of every bucket as { fam, lod, x, y, z, sx, sy } (the matrices as uploaded) */
  const readBack = () => { const out = []; for (const fam of fams) M[fam].forEach((m, l) => { const a = m.instanceMatrix.array; for (let i = 0; i < m.count; i++) { const q = i * 16; out.push({ fam, lod: l, x: a[q + 12], y: a[q + 13], z: a[q + 14], sx: Math.hypot(a[q], a[q + 2]), sy: a[q + 5] }); } }); return out; };
  // T7 fix round 1 (QA: the crows on the crowns sat 2 m inside them): a perch for a bird is the DRAWN crown, not t.h (the nominal height of the family x s; the instance is stretched by sy, the lobes of LOD0 stand 1 .. 3 m lower than those
  // of LOD1 / 2). crown = [top above the terrain under the trunk at LOD0, 1, 2, 3] = the highest of five rays dropped on the family's REAL canopy geometry within 0.3 m of the trunk axis, x sy; `lod` = the level the tree is drawn at now
  // (assign() keeps it), so wildlife/world.js can seat a crow on the crown that is on the screen
  const famTop = {}, rcast = new T.Raycaster(), rdir = new T.Vector3(0, -1, 0), rorg = new T.Vector3();
  const topOf = (fam, l) => { const k = fam + l; if (k in famTop) return famTop[k]; const m = new T.Mesh(M[fam][l].geometry, new T.MeshBasicMaterial({ side: T.DoubleSide })); m.updateMatrixWorld(); let best = NaN;
    for (const [dx, dz] of [[0, 0], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) { rcast.set(rorg.set(dx, 200, dz), rdir); const h = rcast.intersectObject(m)[0]; if (h && !(h.point.y <= best)) best = h.point.y; }
    m.material.dispose(); return (famTop[k] = best); };
  const treeList = list.map((t, i) => {
    const row = { x: t.x, z: t.z, y: t.y, r: t.r, h: t.h, tr: t.tr, sp: t.sp, lod: Math.max(0, state[i]) };
    if (t.shrub) row.shrub = true;
    else row.crown = [0, 1, 2, 3].map((l) => { const v = topOf(t.fam, l); return Number.isFinite(v) ? v * t.sy : t.h * 0.8; });
    return row;
  });
  lodSink.list = treeList;
  return { group, meshes, instances: list.length, colliders, blobs, triangles, trianglesWorst: worst, draws, assign, readBack, treeList, families: fams, materials: [matLobe, matTier, ...Object.values(barkMat)] };
}
