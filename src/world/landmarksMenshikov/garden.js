// landmarksMenshikov/garden.js - the RUMYANTSEV GARDEN (Румянцевский сад / Соловьёвский сад, 1865-66 N. N. Kovrigin, re-planned 1927; OSM park r3277181, fence w11399921, 29 footways, 20 benches; 134.5 x 101.7 m, frame GF).
// Dossier docs/research/menshikov.md section 4, photos refs/menshikov 69 72 73 74 75 77 78 79 84-88 94 95 101 127-129 N07 N09 N10.
//   LAWN     mown grass over the whole park polygon (y 0.02); GRAVEL pink-beige alleys (y 0.035): the N-S alley 8.6 m wide widening to the 13.7 x 13.2 m platform of the obelisk, the E-W alley, the diagonals
//            (3.5 m), the perimeter loop (3 m), gravel discs of 7.4 m round the two fountains; the OSM footway polylines are the truth (29 ways).
//   FENCE    cast-iron openwork panels on a 0.55 m pink-grey granite plinth, barley-twist posts with urns every 2.6 m, six open gates (S on the axis, E, W, two N gates beside the pavilion, a small NW-corner gate).
//   FURNITURE  guard hoops (0.45 m stakes with a sagging chain) along the alleys, 20 white slatted benches with granite-block ends facing the paths, 14 green-black lamps (opal globes on curved necks), the obelisk flower bed.
//   TREES    about 130 instanced limes (two rows each side of the N-S alley, one along the E-W alley), oaks, ashes, maples and elms in the lawn bays, honeysuckle along the fence; no tree on the platform.
// The obelisk, fountains, busts and the music pavilion are drawn by monuments.js.  Claim: groups.js key 'rumyantsev-garden'.
import * as THREE from 'three';
import * as L from '../layout.js';
import { GREEN, ROADS, BARRIERS, FURNITURE } from '../data/city.js';
import { GF } from './frame.js';
import { ironFence } from './fence.js';
import { fillPolyFine, ribbon, pairs, distToLine, inRing, coverFn } from './surfaces.js';
import { partsGeos, addInstanced } from './inst.js';
import { plantTrees } from './trees.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13.7): the benches and lamps are knock records

const TAU = Math.PI * 2;
const gw = (a, b) => { const p = GF.W(a, b); return [p.x, p.z]; };
export const FOOTWAYS = 'w216655266 w216655269 w216655275 w216655282 w216655274 w216655254 w216655273 w216655286 w220268867 w216655243 w216655271 w216655279 w216655287 w767624696 w216655178 w216655187 w216655211 w216655217 w216655278 w216655290 w220268858 w220268860 w220268866 w216655258 w220268868 w220268869 w216655248'.split(' ');
export const BENCHES = 'n2260468792 n2260468817 n2260468835 n2260468857 n2260468778 n2260468779 n5852346773 n2260468803 n2293979401 n2293979404 n2293979406 n2260468833 n2260468851 n2260468888 n2293979411 n2293979419 n2260468796 n2260468840 n2293979414 n2293979417'.split(' ');
/** path widths (m) by OSM way: the alley boundaries are drawn as one wide alley, the cross alley 5 m, the diagonals 3.5 m, the perimeter 3 m */
const WIDTH = { w216655243: 3.0, w216655217: 5.0, w216655211: 5.0, w767624696: 5.0, w216655248: 5.0, w216655266: 3.5, w216655269: 3.0, w216655282: 3.0, w216655274: 3.5, w216655254: 3.5, w216655258: 3.5, w216655279: 3.5, w216655287: 3.5, w220268867: 3.5, w220268869: 3.5, w220268858: 3.0, w220268860: 3.0 };
export const GATES = [
  { id: 'n2260468782', a: 0.1, b: 51.0, w: 3.6, name: 'Румянцевский сад: южные ворота (на оси)' }, { id: 'n2260468868', a: 67.1, b: -0.9, w: 3.0, name: 'Румянцевский сад: восточные ворота' },
  { id: 'n2260468789', a: -66.7, b: 0.4, w: 3.0, name: 'Румянцевский сад: западные ворота' }, { id: 'n2293979413', a: -32.5, b: -49.8, w: 3.6, name: 'Румянцевский сад: северо-западные ворота (у ул. Репина)' },
  { id: 'n2293979421', a: 31.7, b: -50.5, w: 3.6, name: 'Румянцевский сад: северо-восточные ворота (у ул. Репина)' }, { id: 'n12920781189', a: -65.3, b: -47.5, w: 2.0, name: 'Румянцевский сад: калитка в северо-западном углу' },
];
export const FOUNT = [{ id: 'w84045811', a: 30.9, b: -0.6 }, { id: 'w84045881', a: -29.8, b: -0.2 }];

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { const t0 = K.P.tris; try { fn(); } catch (e) { console.error(`[landmarksMenshikov] garden/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } if (typeof process !== 'undefined' && process.env && process.env.MEN_DEBUG) console.log('[garden]', name, K.P.tris - t0); };
  const S = K.shared.garden = { paths: [], poly: null, benches: [], lamps: [], keep: [] };
  stage('ground', () => ground(K, S));
  stage('fence', () => fence(K, S));
  stage('hoops', () => hoops(K, S));
  stage('benches', () => benches(K, S));
  stage('lamps', () => lamps(K, S));
  stage('trees', () => trees(K, S));
  stage('services', () => services(K, S));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ lawn, gravel
function ground(K, S) {
  const { P, M } = K;
  const park = GREEN.find((g) => g.id === 'r3277181'); if (!park) throw new Error('park r3277181 missing');
  const ring = pairs(park.polys[0].o); S.poly = ring;
  fillPolyFine(P, M.lawnG, ring, 0.02, { maxEdge: 12, tile: 6 });
  // the paths: OSM polylines (world) with their widths
  for (const r of ROADS) if (FOOTWAYS.includes(r.id)) S.paths.push({ id: r.id, pts: pairs(r.pts), w: WIDTH[r.id] ?? 3.0 });
  const skip = new Set(['w216655271', 'w216655275', 'w216655178', 'w216655187', 'w216655273', 'w216655286', 'w216655278', 'w216655290']);     // the alley boundaries and the fountain rings: drawn as the alley and the gravel discs
  for (const pa of S.paths) if (!skip.has(pa.id)) ribbon(P, M.gravel, pa.pts, pa.w, 0.035, { tile: 3, seg: 3 });
  // the N-S alley 8.6 m, the platform of the obelisk 13.7 x 13.2 m
  ribbon(P, M.gravel, [gw(0, -42), gw(0, -8), gw(0, 8), gw(0, 47)], 8.6, 0.035, { tile: 3, seg: 4 });
  const plat = [[-6.85, -7.0], [6.85, -7.0], [6.85, 6.2], [-6.85, 6.2]].map(([a, b]) => gw(a, b));
  fillPolyFine(P, M.gravel, plat, 0.035, { maxEdge: 4, tile: 3 });
  // gravel discs round the fountains (the basin stands in the middle)
  for (const f of FOUNT) {
    const c = gw(f.a, f.b), n = 28, ringp = Array.from({ length: n }, (_, i) => [c[0] + Math.cos(i * TAU / n) * 7.7, c[1] + Math.sin(i * TAU / n) * 7.7]);
    fillPolyFine(P, M.gravel, ringp, 0.035, { maxEdge: 4, tile: 3 });
  }
  // the flower bed in front of the plaque face (south of the obelisk, G b +6.2 .. +11.7): a rounded triangle of red salvia in a silvery border on a lawn island, granite kerb
  const bed = [[0, 12.2], [3.9, 7.8], [4.3, 6.8], [-4.3, 6.8], [-3.9, 7.8]];
  bedIsland(K, bed.map(([a, b]) => gw(a, b)));
  // keep-out discs for the planting (platform, fountains, bed, pavilion)
  S.keep.push({ c: gw(0, 0), r: 10.5 }, { c: gw(0, 9.5), r: 5 }, { c: gw(FOUNT[0].a, FOUNT[0].b), r: 8.6 }, { c: gw(FOUNT[1].a, FOUNT[1].b), r: 8.6 }, { c: gw(0, -46), r: 9 });
}
function bedIsland(K, ring) {
  const { P, M, ctx } = K;
  fillPolyFine(P, M.lawnG, ring, 0.04, { maxEdge: 4, tile: 3 });
  // salvia core: the ring shrunk toward the centroid
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const shr = (k) => ring.map((p) => [cx + (p[0] - cx) * k, cz + (p[1] - cz) * k]);
  fillPolyFine(P, M.bedEdge, shr(0.8), 0.06, { maxEdge: 3, tile: 1 });
  fillPolyFine(P, M.bed, shr(0.58), 0.08, { maxEdge: 3, tile: 1 });
  // granite kerb round the island
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    P.push(a[0], 0, a[1], Math.atan2(-dz, dx)); P.box(M.granite, -0.1, len + 0.1, 0, 0.16, -0.12, 0.12, 'b', 1); P.pop();
  }
  void ctx;
}

// ------------------------------------------------------------------------------------------------ fence
function fence(K, S) {
  const { M } = K;
  const f = BARRIERS.find((b) => b.id === 'w11399921'); if (!f) throw new Error('fence w11399921 missing');
  const pts = pairs(f.pts);
  const res = ironFence(K, {
    id: 'garden', pts, panel: M.fenceGarden, tile: 2.6, top: 1.7, base: { mat: M.granite, h: HG_PLINTH, w: 0.46, tu: 2.2, tv: 2.2 }, posts: 'urn', every: 2.6, gatePost: 'urn', colH: 2.2,
    gates: GATES.map((g) => { const p = gw(g.a, g.b); return { id: g.id, x: p[0], z: p[1], w: g.w, open: true, name: g.name }; }),
  });
  K.svc.fences.push({ id: 'w11399921', kind: 'iron', h: 2.25, runs: res.runs, gates: res.gates.map((g) => g.id) });
  (K.svc.gates ||= []).push(...res.gates);
  S.fenceGates = res.gates;
}
const HG_PLINTH = 0.55;

// ------------------------------------------------------------------------------------------------ guard hoops
function hoops(K, S) {
  const { P, M, ctx } = K, stakes = [];
  const line = (pts) => {
    let prev = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 1.2));
      for (let k = (i === 0 ? 0 : 1); k <= n; k++) {
        const q = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n];
        stakes.push(q);
        if (prev) { for (let s = 0; s < 3; s++) { const t0 = s / 3, t1 = (s + 1) / 3, y0 = 0.4 - 0.12 * 4 * t0 * (1 - t0), y1 = 0.4 - 0.12 * 4 * t1 * (1 - t1); P.cyl(M.guard, [prev[0] + (q[0] - prev[0]) * t0, y0, prev[1] + (q[1] - prev[1]) * t0], [prev[0] + (q[0] - prev[0]) * t1, y1, prev[1] + (q[1] - prev[1]) * t1], 0.008, 0.008, 3, false); } }
        prev = q;
      }
    }
  };
  for (const s of [-1, 1]) {
    line([gw(s * 4.9, -38), gw(s * 4.9, -8.0)]);
    line([gw(s * 7.5, -8.0), gw(s * 7.5, 7.2)]);
    line([gw(s * 4.9, 7.2), gw(s * 4.9, 40)]);
  }
  line([gw(-7.5, -8.0), gw(-4.9, -8.0)]); line([gw(7.5, -8.0), gw(4.9, -8.0)]); line([gw(-7.5, 7.2), gw(-4.9, 7.2)]); line([gw(7.5, 7.2), gw(4.9, 7.2)]);
  // round the flower bed
  const bed = [[0, 12.9], [4.6, 8.2], [4.9, 7.2], [-4.9, 7.2], [-4.6, 8.2], [0, 12.9]].map(([a, b]) => gw(a, b)); line(bed);
  const g = partsGeos((Q) => { Q.box(M.guard, -0.012, 0.012, 0, 0.45, -0.012, 0.012, 'b', 1); Q.geo(M.guard, new THREE.SphereGeometry(0.03, 5, 4), 0, 0.47, 0); });
  const ms = stakes.map(([x, z]) => new THREE.Matrix4().makeTranslation(x, 0, z));
  K.extraTris += addInstanced(ctx, K.root, 'lmmensh-hoops', g, ms).tris;
}

// ------------------------------------------------------------------------------------------------ benches
function benchParts(Q, M) {
  // front = +z; 2.0 m long: three seat slats, three back slats, two granite block ends, a metal frame
  for (let i = 0; i < 4; i++) Q.box(M.benchWood, -0.95, 0.95, 0.43, 0.46, -0.24 + i * 0.12, -0.15 + i * 0.12, '', 1);
  for (let i = 0; i < 3; i++) Q.box(M.benchWood, -0.95, 0.95, 0.62 + i * 0.12, 0.7 + i * 0.12, -0.31 - i * 0.02, -0.28 - i * 0.02, '', 1);
  for (const s of [-1, 1]) { Q.box(M.benchEnd, s * 0.96 - 0.1, s * 0.96 + 0.1, 0, 0.43, -0.28, 0.26, 'b', 1); Q.box(M.castIron, s * 0.86 - 0.02, s * 0.86 + 0.02, 0.43, 0.98, -0.34, -0.3, '', 1); }
}
function benches(K, S) {
  const { ctx, M } = K, ph = ctx.physics;
  const geo = partsGeos((Q) => benchParts(Q, M)), spots = [], items = [];
  const all = FURNITURE.filter((b) => BENCHES.includes(b.id));
  for (const b of all) {
    // face the nearest path (the front +z of the model points to the path): find the nearest point of any path
    let best = null;
    for (const pa of S.paths) for (let i = 0; i + 1 < pa.pts.length; i++) {
      const p = pa.pts[i], q = pa.pts[i + 1], dx = q[0] - p[0], dz = q[1] - p[1], t = Math.max(0, Math.min(1, ((b.x - p[0]) * dx + (b.z - p[1]) * dz) / (dx * dx + dz * dz || 1))), px = p[0] + dx * t, pz = p[1] + dz * t, d = Math.hypot(px - b.x, pz - b.z);
      if (!best || d < best.d) best = { d, x: px, z: pz };
    }
    const rot = best ? Math.atan2(best.x - b.x, best.z - b.z) : 0;
    spots.push({ x: b.x, y: 0, z: b.z, rotY: rot });
    items.push(ph.addBox(b.x, b.z, 2.1, 0.6, rot, 0, 0.9));
    S.benches.push({ id: b.id, x: b.x, z: b.z, rotY: rot, len: 2.0 });
    K.svc.benches.push({ x: b.x, z: b.z, rotY: rot, len: 2.0, id: b.id });
  }
  K.extraTris += knockFurniture(ctx, 'lmmensh-benches', geo, spots, items, FURNITURE_REC.bench, 260);
}

// ------------------------------------------------------------------------------------------------ lamps
function lampParts(Q, M, twin) {
  Q.cyl(M.lampPole, [0, 0, 0], [0, 0.5, 0], 0.17, 0.11, 8, true); Q.cyl(M.lampPole, [0, 0.5, 0], [0, 0.62, 0], 0.14, 0.14, 8, true);
  Q.cyl(M.lampPole, [0, 0.62, 0], [0, 4.5, 0], 0.075, 0.05, 8, false);
  for (const s of (twin ? [-1, 1] : [1])) {
    const pts = [[0, 4.5], [0.12 * s, 4.7], [0.38 * s, 4.86], [0.62 * s, 4.78], [0.74 * s, 4.62]];
    for (let i = 0; i + 1 < pts.length; i++) Q.cyl(M.lampPole, [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.035, 0.03, 5, false);
    Q.geo(M.globe, new THREE.SphereGeometry(0.23, 9, 7), 0.74 * s, 4.38, 0);
    Q.cyl(M.lampPole, [0.74 * s, 4.58, 0], [0.74 * s, 4.66, 0], 0.07, 0.07, 6, true);
  }
}
function lamps(K, S) {
  const { ctx, M } = K, ph = ctx.physics, gs = [partsGeos((Q) => lampParts(Q, M, false)), partsGeos((Q) => lampParts(Q, M, true))], sp = [[], []], it = [[], []];
  const put = (a, b, twin, rot = 0) => { const p = gw(a, b); sp[twin ? 1 : 0].push({ x: p[0], y: 0, z: p[1], rotY: GF.rot + rot }); it[twin ? 1 : 0].push(ph.addCylinder(p[0], p[1], 0.22, 0, 5)); S.lamps.push({ x: p[0], z: p[1], h: 4.9 }); K.svc.lamps.push({ x: p[0], z: p[1], h: 4.9 }); };
  // along the N-S alley (pitch ~20 m, alternating sides) and one at each fountain
  for (const [a, b, rot] of [[-5.3, -36, Math.PI], [5.3, -28, 0], [-5.3, -19, Math.PI], [5.3, -12, 0], [-5.3, 14, Math.PI], [5.3, 20, 0], [-5.3, 29, Math.PI], [5.3, 37, 0]]) put(a, b, false, rot);
  put(FOUNT[0].a + 5.6, FOUNT[0].b - 5.6, true, 0.6); put(FOUNT[1].a - 5.6, FOUNT[1].b - 5.6, true, 0.6); put(FOUNT[0].a + 5.6, FOUNT[0].b + 5.6, false, 2.4); put(FOUNT[1].a - 5.6, FOUNT[1].b + 5.6, false, 3.9);
  put(-40, 3.2, false, 0); put(40, -3.2, false, Math.PI);
  K.extraTris += knockFurniture(ctx, 'lmmensh-lamps', gs[0], sp[0], it[0], FURNITURE_REC.lamp(4.9), 260) + knockFurniture(ctx, 'lmmensh-lamps2', gs[1], sp[1], it[1], FURNITURE_REC.lamp(4.9), 260);
}

// ------------------------------------------------------------------------------------------------ trees
function trees(K, S) {
  const rng = K.ctx.rng(6161), list = [], ring = S.poly;
  const place = (a, b, fam, s) => list.push({ x: gw(a, b)[0], z: gw(a, b)[1], fam, s, yaw: rng() * TAU, a, b });
  const clear = (a, b, r = 0) => {
    const p = gw(a, b);
    if (!inRing(ring, p[0], p[1])) return false;
    if (distToLine(ring, p[0], p[1], true) < 2.2 + r) return false;                                       // not on the fence
    for (const k of S.keep) if (Math.hypot(p[0] - k.c[0], p[1] - k.c[1]) < k.r + r) return false;
    for (const pa of S.paths) if (!['w216655243'].includes(pa.id) && distToLine(pa.pts, p[0], p[1]) < pa.w / 2 + 0.9 + r) return false;
    if (distToLine(S.paths.find((q) => q.id === 'w216655243').pts, p[0], p[1]) < 2.2 + r) return false;
    if (Math.abs(a) < 6.2 && Math.abs(b) < 42) return false;                                                // the alley
    for (const bn of S.benches) if (Math.hypot(p[0] - bn.x, p[1] - bn.z) < 1.8) return false;
    for (const l of S.lamps) if (Math.hypot(p[0] - l.x, p[1] - l.z) < 1.2) return false;
    for (const t of list) if (Math.hypot(t.a - a, t.b - b) < 5.2 + r) return false;
    return true;
  };
  // rows of limes: two rows each side of the N-S alley (a +- 6.9 and +- 13), one row each side of the E-W alley (b +- 5.6)
  const lime = () => (rng() < 0.5 ? 'limeA' : 'limeB');
  for (const sa of [-1, 1]) {
    for (let k = 0; k < 6; k++) for (const sb of [-1, 1]) {
      const b = sb * (12 + k * 6.4 + rng() * 0.8), a1 = sa * (6.9 + rng() * 0.4), a2 = sa * (13 + rng() * 0.6), b2 = b + 3;
      if (clear(a1, b)) place(a1, b, lime(), 1.35 + rng() * 0.3);
      if (clear(a2, b2)) place(a2, b2, lime(), 1.35 + rng() * 0.3);
    }
  }
  for (const sb of [-1, 1]) for (const sa of [-1, 1]) for (let k = 0; k < 5; k++) { const a = sa * (14.5 + k * 6.6 + rng()), b = sb * (5.6 + rng() * 0.4); if (clear(a, b) && Math.abs(Math.abs(a) - 30) > 9) place(a, b, 'limeA', 1.3 + rng() * 0.3); }
  // the lawn bays: oaks, ashes, elms, maples (Poisson-ish, seeded)
  for (let n = 0; n < 900 && list.length < 135; n++) {
    const a = (rng() - 0.5) * 128, b = (rng() - 0.5) * 98;
    const fam = rng() < 0.3 ? 'oak' : rng() < 0.5 ? 'ash' : rng() < 0.7 ? 'elm' : rng() < 0.85 ? 'limeB' : 'mapleA';
    const s = fam === 'oak' ? 1.2 + rng() * 0.3 : fam === 'mapleA' ? 1.5 + rng() * 0.3 : fam === 'ash' ? 1.4 + rng() * 0.2 : fam === 'elm' ? 1.15 + rng() * 0.15 : 1.35 + rng() * 0.3;
    if (clear(a, b, 1.0)) place(a, b, fam, s);
  }
  // honeysuckle along the fence, inside (1.5 m shrubs)
  const shrubs = [];
  for (let n = 0; n < 400 && shrubs.length < 40; n++) {
    const a = (rng() - 0.5) * 132, b = (rng() - 0.5) * 102, p = gw(a, b);
    if (!inRing(ring, p[0], p[1])) continue;
    const d = distToLine(ring, p[0], p[1], true); if (d < 1.2 || d > 2.6) continue;
    if (GATES.some((g) => Math.hypot(a - g.a, b - g.b) < 4)) continue;
    if (shrubs.some((q) => Math.hypot(q.x - p[0], q.z - p[1]) < 5)) continue;
    if (Math.abs(b + 46) < 12 && Math.abs(a) < 12) continue;
    if (S.paths.some((pa) => distToLine(pa.pts, p[0], p[1]) < pa.w / 2 + 0.6)) continue;
    shrubs.push({ x: p[0], z: p[1], fam: 'shrub', s: 0.9 + rng() * 0.3, yaw: rng() * TAU });
  }
  K.svc.trees.push(...list.map((t) => ({ x: t.x, z: t.z, r: 3, h: 20 })));
  S.treeCount = list.length;
  plantTrees(K, list.concat(shrubs), 'lmmensh-garden-trees');
}

function services(K, S) {
  const cover = coverFn(K.ctx);
  const spot = (a, b, ta, tb, name, pitch = 4) => { const p = gw(a, b), t = gw(ta, tb); K.svc.photoSpots.push({ x: p[0], z: p[1], yaw: L.yawToward(p[0], p[1], t[0], t[1]), pitch, name }); };
  spot(0, 47, 0, 0, 'Румянцевский сад: обелиск «Румянцова победам» от южных ворот', 12);
  spot(0, -34, 0, 0, 'Румянцевский сад: обелиск от павильона', 12);
  spot(FOUNT[0].a - 7.5, FOUNT[0].b + 6, FOUNT[0].a, FOUNT[0].b, 'Румянцевский сад: фонтан', 12);
  for (const [id, a, b, r, n] of [['garden-obelisk', 0, 12, 7, 6], ['garden-fountain-e', FOUNT[0].a, FOUNT[0].b + 9, 5, 4], ['garden-fountain-w', FOUNT[1].a, FOUNT[1].b + 9, 5, 4], ['garden-pavilion', 0, -36, 6, 4]]) { const p = gw(a, b); K.svc.crowd.push({ id, kind: 'garden', x: p[0], z: p[1], r, n }); }
  void cover;
}
