// landmarksFortress/grounds.js - the ground of Zayachy Island and its banks (dossier docs/research/fortress.md sections 5, 9; aerials refs/fortress 004 005, banks 185 196 198, beach 031 162, alleys 072 092 094):
//  * a sand base over the whole island ring, cobbles inside the main rampart, lawns on the claimed OSM GREEN polygons, ribbons along the claimed OSM ways styled by their `surface`
//    (granite slab tracks in the cobbled alleys, gravel, asphalt, cobbles outside), the cobbled areas;
//  * the BANKS by ring edge (frame.js bankKind): the granite banquette of the Neva front with its vertical face, the sand BEACH whose apron slopes 3.9 m down into the Neva over 18 m (walk ramps: the
//    water line is real water), grass slopes on the strait side;
//  * the colliders of the island outline (no wall on the water: the player stops ankle deep on the beach, at the edge elsewhere), open at the two bridges and at the Commandant pier.
// Layers: sand 0.012, cobbles 0.02, lawns 0.03, areas 0.036, ribbons 0.045 (all with polygonOffset materials).
import { ROADS, GREEN, AREAS } from '../data/city.js';
import { ON_ISLAND } from './osm-data.js';
import { RING, FORT, GATES, bankKind, offsetRing, edgeNormal, inRing, pairs, dseg, byId, axisToRing } from './frame.js';
import { fillPolyFine, ribbon } from './surfaces.js';

export const APRON = { beach: 18, grass: 7, quay: 0, yOut: -3.9 };
/** gaps of the bank collider: the two bridges and the pier (centre, radius) */
const _ng = GATES.find((g) => g.key === 'nevsky'), _nz = axisToRing(_ng);
export const BANK_GAPS = [{ c: [-1621.5, -2181.5], r: 7.2, name: 'ioannovsky' }, { c: [-2327.5, -1915.0], r: 6.4, name: 'kronverksky' }, { c: [_ng.outer[0] - _ng.d[0] * _nz, _ng.outer[1] - _ng.d[1] * _nz], r: 4.2, name: 'pier' }];

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksFortress] grounds/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const inside = FORT.h[0] || [];
  const inYard = (x, z) => inside.length > 2 && inRing(x, z, inside);
  const wallRings = ['r227969', 'r2594679', 'r2594690'].map(byId).filter(Boolean).map((b) => pairs(b.polys[0].o));
  const inWall = (x, z) => (inRing(x, z, FORT.o) && !FORT.h.some((h) => inRing(x, z, h))) || wallRings.slice(1).some((r) => inRing(x, z, r));

  stage('base', () => {
    fillPolyFine(P, M.sand, RING, 0.012, { maxEdge: 26, tile: 3 });
    if (inside.length > 2) fillPolyFine(P, M.cobble, inside, 0.02, { maxEdge: 26, tile: 2 });
    // the west ward between the Vasilievskaya curtain and the Alekseevsky ravelin is a cobbled yard (car park of the Mint), not beach sand: the hull of the ravelin + the curtain corners
    const rav = byId('r2594690');
    if (rav) { const hp = pairs(rav.polys[0].o).concat([FORT.o[81], FORT.o[82], FORT.o[83], FORT.o[84], FORT.o[0]]), hl = hullOf(hp); fillPolyFine(P, M.cobble, hl, 0.018, { maxEdge: 26, tile: 2, keep: (x, z) => inRing(x, z, RING) }); }
  });
  stage('lawns', () => {
    const ids = new Set(ON_ISLAND.greens); let n = 0;
    for (const g of GREEN) {
      if (!ids.has(g.id)) continue;
      const mat = g.kind === 'pitch' ? M.gravel : M.lawn;
      for (const p of g.polys) { const r = pairs(p.o); if (r.length < 3) continue; fillPolyFine(P, mat, r, g.kind === 'pitch' ? 0.034 : 0.03, { maxEdge: 22, tile: 3, holes: p.h.map(pairs), keep: (x, z) => !inWall(x, z) }); n++; }
    }
    svc.lawns = n;
  });
  stage('areas', () => {
    const ids = new Set(ON_ISLAND.areas);
    for (const a of AREAS) if (ids.has(a.id)) for (const p of a.polys) fillPolyFine(P, M.cobble, pairs(p.o), 0.036, { maxEdge: 24, tile: 2, holes: p.h.map(pairs) });
  });
  stage('ways', () => {
    const ids = new Set(ON_ISLAND.roads); let n = 0;
    for (const r of ROADS) {
      if (!ids.has(r.id) || r.bridge || r.hw === 'steps' || r.area) continue;
      const pts = pairs(r.pts); if (pts.length < 2) continue;
      const sf = r.surface || '', mid = pts[pts.length >> 1], yard = inYard(mid[0], mid[1]);
      if (sf === 'wood' || sf === 'grass_paver' || sf === 'grass') continue;                                  // the roof walk of the Neva curtain and grass tracks
      const stone = sf === 'sett' || sf === 'cobblestone' || sf === 'unhewn_cobblestone';
      let mat, w;
      if (stone && (yard || r.tunnel)) { mat = M.slab; w = r.hw === 'service' ? 1.8 : 1.3; }               // the slab track of a cobbled alley
      else if (stone) { mat = M.cobble; w = Math.min(r.w || 3, 7) + 0.6; }
      else if (sf === 'paving_stones') { mat = M.slab; w = r.hw === 'service' ? Math.min(r.w || 4, 5) : 2.6; }
      else if (sf === 'asphalt') { mat = M.asphalt; w = Math.min(r.w || 3, 7); }
      else { mat = M.gravel; w = r.hw === 'service' ? 3.6 : 2.4; }
      n += ribbon(P, mat, pts, w, mat === M.slab ? 0.05 : 0.045, { tile: mat === M.slab || mat === M.cobble ? 2 : 3, seg: 4, keep: (x, z) => r.tunnel || !inWall(x, z) });
    }
    svc.ways = n;
  });

  // ================================================================== banks
  stage('banks', () => {
    const n = RING.length, dOf = (i) => APRON[bankKind(i)];
    const dv = RING.map((_, i) => (dOf((i + n - 1) % n) + dOf(i)) / 2);
    const out1 = offsetRing(RING, 1), dir = RING.map((p, i) => [out1[i][0] - p[0], out1[i][1] - p[1]]);     // mitred outward step per metre of offset
    const O = RING.map((p, i) => [p[0] + dir[i][0] * dv[i], p[1] + dir[i][1] * dv[i]]);
    const gapAt = (x, z) => BANK_GAPS.some((g) => Math.hypot(x - g.c[0], z - g.c[1]) < g.r);
    const collide = (a, b, y0 = -8, y1 = 0.16) => {                       // a thin box along a -> b, split at the gaps
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ns = Math.max(1, Math.ceil(l / 2)); let st = null;
      for (let s = 0; s <= ns; s++) {
        const t = s / ns, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, free = !gapAt(x, z);
        if (free && st === null) st = t;
        if ((!free || s === ns) && st !== null) { const t1 = free ? t : (s - 1) / ns; if (t1 > st) { const p = [a[0] + (b[0] - a[0]) * st, a[1] + (b[1] - a[1]) * st], q = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]; ph.addBox((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, Math.hypot(q[0] - p[0], q[1] - p[1]) + 0.4, 0.6, Math.atan2(-(q[1] - p[1]), q[0] - p[0]), y0, y1); } st = null; }
      }
    };
    let ramps = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = RING[i], b = RING[j], oa = O[i], ob = O[j], kind = bankKind(i), nn = edgeNormal(RING, i), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const mat = kind === 'grass' ? M.lawn : M.sand, yO = APRON.yOut;
      if (dv[i] > 0.3 || dv[j] > 0.3) {
        // the apron: subdivided along the edge so that the slope stays planar enough and the uv world-spaced
        const ns = Math.max(1, Math.ceil(len / 12));
        for (let s = 0; s < ns; s++) {
          const t0 = s / ns, t1 = (s + 1) / ns, L = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
          const p0 = L(a, b, t0), p1 = L(a, b, t1), q0 = L(oa, ob, t0), q1 = L(oa, ob, t1);
          P.quad(mat, [p0[0], 0.012, p0[1]], [p1[0], 0.012, p1[1]], [q1[0], yO, q1[1]], [q0[0], yO, q0[1]], [nn[0] * 0.2, 1, nn[1] * 0.2], [[p0[0] / 3, p0[1] / 3], [p1[0] / 3, p1[1] / 3], [q1[0] / 3, q1[1] / 3], [q0[0] / 3, q0[1] / 3]]);
          if (kind === 'grass') {                                         // a cobble toe at the water line
            const k0 = 0.72, r0 = L(p0, q0, k0), r1 = L(p1, q1, k0), y = 0.012 + (yO - 0.012) * k0 + 0.03;
            P.quad(M.cobble, [r0[0], y, r0[1]], [r1[0], y, r1[1]], [q1[0], yO + 0.03, q1[1]], [q0[0], yO + 0.03, q0[1]], [nn[0] * 0.2, 1, nn[1] * 0.2], [[r0[0] / 2, r0[1] / 2], [r1[0] / 2, r1[1] / 2], [q1[0] / 2, q1[1] / 2], [q0[0] / 2, q0[1] / 2]]);
          }
        }
      }
      if (kind === 'beach') {
        // walkable sand slope: one ramp per edge (+ a wedge ramp at the vertex), the player stops ankle deep (90 % of the apron)
        const d = (dv[i] + dv[j]) / 2, mx = (a[0] + b[0]) / 2 + nn[0] * d / 2, mz = (a[1] + b[1]) / 2 + nn[1] * d / 2;
        {const shore=ph.addWalkRamp(mx, mz, len + 2.5, d, Math.atan2(nn[0], nn[1]), 0, yO, 1.6);shore.boatPass=true;ph.waterShores.push(shore);} ramps++;
        ph.addWalkBox((a[0] + b[0]) / 2 - nn[0] * 0.5, (a[1] + b[1]) / 2 - nn[1] * 0.5, len + 2.5, 1.7, Math.atan2(nn[0], nn[1]), 0, -8);          // the seam on the ring (the water polygon may reach a few cm inside the rounded ring)
        const dl = Math.hypot(dir[i][0], dir[i][1]) || 1, vx = dir[i][0] / dl, vz = dir[i][1] / dl;
        {const shore=ph.addWalkRamp(a[0] + vx * dv[i] / 2, a[1] + vz * dv[i] / 2, 9, dv[i], Math.atan2(vx, vz), 0, yO, 1.6);shore.boatPass=true;ph.waterShores.push(shore);} ramps++;
        const e0 = [a[0] + (oa[0] - a[0]) * 0.9, a[1] + (oa[1] - a[1]) * 0.9], e1 = [b[0] + (ob[0] - b[0]) * 0.9, b[1] + (ob[1] - b[1]) * 0.9];
        // Open beach: the walker and car may continue into the river.
      } else {
        collide(a, b);
        if (bankKind((i + n - 1) % n) === 'beach') collide(a, [a[0] + (oa[0] - a[0]) * 0.9, a[1] + (oa[1] - a[1]) * 0.9]);     // close the end of the beach
        if (bankKind(j) === 'beach') collide(b, [b[0] + (ob[0] - b[0]) * 0.9, b[1] + (ob[1] - b[1]) * 0.9]);
      }
      if (kind === 'quay') {
        // granite banquette: slab paving 11 m inland and the vertical granite face down into the water, a low coping
        const ia = [a[0] - dir[i][0] * 11, a[1] - dir[i][1] * 11], ib = [b[0] - dir[j][0] * 11, b[1] - dir[j][1] * 11];
        P.quad(M.slab, [ia[0], 0.04, ia[1]], [ib[0], 0.04, ib[1]], [b[0], 0.04, b[1]], [a[0], 0.04, a[1]], [0, 1, 0], [[ia[0] / 2, ia[1] / 2], [ib[0] / 2, ib[1] / 2], [b[0] / 2, b[1] / 2], [a[0] / 2, a[1] / 2]]);
        const nb = Math.max(1, Math.round(len / 4.6));
        P.quad(M.granite, [a[0], -4.4, a[1]], [b[0], -4.4, b[1]], [b[0], 0.04, b[1]], [a[0], 0.04, a[1]], [nn[0], 0, nn[1]], [[0, 0.5], [nb, 0.5], [nb, 0.98], [0, 0.98]]);
        const ca = [a[0] + nn[0] * 0.12, a[1] + nn[1] * 0.12], cb = [b[0] + nn[0] * 0.12, b[1] + nn[1] * 0.12], da = [a[0] - nn[0] * 0.5, a[1] - nn[1] * 0.5], db = [b[0] - nn[0] * 0.5, b[1] - nn[1] * 0.5];
        P.quad(M.graniteLit, [ca[0], -0.2, ca[1]], [cb[0], -0.2, cb[1]], [cb[0], 0.16, cb[1]], [ca[0], 0.16, ca[1]], [nn[0], 0, nn[1]]);
        P.quad(M.graniteLit, [ca[0], 0.16, ca[1]], [cb[0], 0.16, cb[1]], [db[0], 0.16, db[1]], [da[0], 0.16, da[1]], [0, 1, 0]);
        P.quad(M.graniteLit, [db[0], 0.04, db[1]], [da[0], 0.04, da[1]], [da[0], 0.16, da[1]], [db[0], 0.16, db[1]], [-nn[0], 0, -nn[1]]);
      }
    }
    svc.beach = { ring: RING.filter((_, i) => bankKind(i) === 'beach' || bankKind((i + n - 1) % n) === 'beach'), ramps, yWater: -3.4 };
    svc.crowd.push({ x: -2040, z: -1740, r: 30, n: 26, kind: 'beach' }, { x: -1960, z: -1752, r: 16, n: 12, kind: 'beach' }, { x: -1602, z: -1990, r: 12, n: 10, kind: 'lawn' });
  });
  void dseg;
  if (errs.length) throw new Error(errs.join('\n'));
}
function hullOf(pts) {                                             // monotone chain convex hull
  const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = []; for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up = []; for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up);
}
