// landmarksNewHolland/park.js - the PARK of New Holland: the lawn over the whole island ring (holes: the Kovsh and the two canals), granite-sett paths with pale kerb strips (OSM footways / service lanes inside
// the island, widened to their real 3-4 m), the sett street along the warehouse arcades, the apron of the Bottle, the Kovsh promenade, gravel paths and the curving herb-garden beds, picket and panel fences,
// instanced benches / litter bins / black cast-iron lamps (OSM nodes + lamps along the alleys), bicycle racks, lime / oak / maple trees (the OSM nodes and tree rows; trunks of the environment's own trees are
// respected), the gates.  Dossier docs/research/new-holland.md section 8 (photos 32 33 36 58 53 41 55 59).
import * as L from '../layout.js';
import { slopeAt } from '../environment/waterways.js';
import { ROADS, GREEN, BARRIERS } from '../data/city.js';
import { RING, inRing, BOTTLE, pairs, nearestOnLine } from './frame.js';
import { GROUPS_LIST } from './groups.js';
import { TREES, TREE_ROWS, LAMPS, BENCHES, BINS, RACKS } from './osm-data.js';
import { ribbon, fillPolyFine, coverFn } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { plantTrees } from './trees.js';
import { STAIRS } from './water.js';
import * as G from './geo.js';

const CLAIM = new Set(GROUPS_LIST.find((g) => g.key === 'nh-park').osm);
const pointIn = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };

export function build(K) {
  const { ctx, M, P, svc, root } = K, ph = ctx.physics, T = ctx.mat.toon, rng = ctx.rng(4242);
  const cover = coverFn(ctx);
  const W = svc.water || {};
  const waterRings = [W.kovsh, W.east, W.south].filter(Boolean);
  const inWater = (x, z, m = 0) => slopeAt(x, z, m > 0 ? 0.3 : 0) || waterRings.some((r) => pointIn(r, x, z)) || (m > 0 && waterRings.some((r) => r.some((p, i) => segD(x, z, p, r[(i + 1) % r.length]) < m)));
  const segD = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
  const free = (x, z, r = 0.6) => inRing(x, z) && !inWater(x, z, 1.0) && !L.insideBuilding(x, z, r) && cover(x, z) < -0.5;
  const pickets = ctx.tex.draw(128, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { g.fillRect(i * 16 + 4, 10, 8, h - 10); g.beginPath(); g.moveTo(i * 16 + 4, 10); g.lineTo(i * 16 + 8, 0); g.lineTo(i * 16 + 12, 10); g.fill(); } g.fillRect(0, 18, w, 5); g.fillRect(0, h - 14, w, 5); }, { key: 'lmNH-pickets', repeat: [1, 1] });
  const bars = ctx.tex.draw(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 16; i++) g.fillRect(i * 8 + 2, 6, 4, h - 6); g.fillRect(0, 2, w, 6); g.fillRect(0, h * 0.5, w, 4); g.fillRect(0, h - 10, w, 6); }, { key: 'lmNH-bars', repeat: [1, 1] });
  const picketMat = T('#26262a', { map: pickets, alphaTest: 0.5, side: 'double', name: 'lmNH-picket' });
  const panelMat = T('#2c2f2c', { map: bars, alphaTest: 0.5, side: 'double', name: 'lmNH-panel' });
  M.cutouts.add(picketMat); M.cutouts.add(panelMat);

  // ---------------------------------------------------------------- the lawn over the island ring (holes: the water), and the planting beds
  const holes = waterRings;
  fillPolyFine(P, M.lawn, RING, 0.02, { maxEdge: 5, tile: 12, holes, keep: (x, z) => !slopeAt(x, z, 0.2) });   // the Admiralty bank is a grass slope drawn by the environment
  const bedIds = new Set(['w514285149', 'w839897519']);
  for (const g of GREEN) {
    if (!bedIds.has(g.id)) continue;
    for (const p of g.polys) { try { P.cap(M.bed, pairs(p.o), 0.04, true, 2.5, p.h.map(pairs)); } catch (e) { /* degenerate */ } }
  }
  // ---------------------------------------------------------------- paths: sett with kerb strips, gravel, concrete plates
  const clip = (x, z) => cover(x, z) > -0.3;
  const keep = (x, z) => inRing(x, z) && !inWater(x, z, 0.1);
  const pathList = [];
  for (const r of ROADS) {
    if (!CLAIM.has(r.id) || !r.pts || r.pts.length < 4) continue;
    if (r.tunnel || r.bridge || (r.layer || 0) > 0) continue;
    if (r.hw !== 'footway' && r.hw !== 'path' && r.hw !== 'service' && r.hw !== 'pedestrian') continue;
    const pts = pairs(r.pts), sett = r.surface === 'sett' || r.surface === 'paving_stones', plates = r.surface === 'concrete:plates', service = r.hw === 'service';
    const w = service ? 4.0 : sett ? 3.4 : plates ? 2.6 : 2.2;
    pathList.push({ id: r.id, pts, w, sett: sett || service, plates, service, surf: r.surface });
  }
  let pathQuads = 0;
  for (const p of pathList) {
    const mat = p.plates ? M.plates : p.sett ? (p.service ? M.settWarm : M.sett) : M.gravel;
    pathQuads += ribbon(P, mat, p.pts, p.w, p.sett ? 0.06 : 0.05, { tile: 2, seg: 3, clip, keep });
    if (p.sett && !p.service) for (const s of [-1, 1]) ribbon(P, M.kerb, p.pts, 0.28, 0.066, { tile: 1, seg: 3, side: s * (p.w / 2 - 0.14), clip, keep });
  }
  // ---------------------------------------------------------------- sett streets along the warehouse arcades (park edges exported by warehouses.js), the Bottle apron, the quay promenades, the Kuznya terrace
  const strip = (a, b, n, wd, mat, y) => {
    const q = (u, v) => [a[0] + (b[0] - a[0]) * u + n[0] * v, a[1] + (b[1] - a[1]) * u + n[1] * v];
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
    for (let i = 0; i < steps; i++) {
      const c0 = q(i / steps, 0.0), c1 = q((i + 1) / steps, 0.0), c2 = q((i + 1) / steps, wd), c3 = q(i / steps, wd), m = [(c0[0] + c1[0] + c2[0] + c3[0]) / 4, (c0[1] + c1[1] + c2[1] + c3[1]) / 4];
      if (![c0, c1, c2, c3, m].every((c) => keep(c[0], c[1]) && !L.insideBuilding(c[0], c[1], 0.2) && cover(c[0], c[1]) < -0.3)) continue;
      P.quad(mat, [c0[0], y, c0[1]], [c3[0], y, c3[1]], [c2[0], y, c2[1]], [c1[0], y, c1[1]], [0, 1, 0], [[c0[0] / 2, c0[1] / 2], [c3[0] / 2, c3[1] / 2], [c2[0] / 2, c2[1] / 2], [c1[0] / 2, c1[1] / 2]]);
    }
  };
  for (const e of svc.parkEdges || []) strip(e.a, e.b, e.n, 8.5, M.sett, 0.05);
  {
    const ring = (R, n) => Array.from({ length: n }, (_, i) => [BOTTLE.x + Math.cos(i / n * Math.PI * 2) * R, BOTTLE.z + Math.sin(i / n * Math.PI * 2) * R]);
    P.cap(M.sett, ring(BOTTLE.R + 6.5, 48), 0.05, true, 2, [ring(BOTTLE.R - 0.1, 48)]);
  }
  for (const bk of W.banks || []) strip(bk.a, bk.b, bk.n, 3.0, M.sett, 0.05);
  P.cap(M.settWarm, [[-3482, 306], [-3466, 306], [-3466, 352], [-3482, 352]], 0.05, true, 2);

  // ---------------------------------------------------------------- fences (baked BARRIERS inside the island): black pickets 0.8 m, tall black panel fence 1.9 m on the east service strip
  const crossPaths = ROADS.filter((r) => CLAIM.has(r.id) && r.pts && r.pts.length >= 4 && !r.tunnel && (r.hw === 'footway' || r.hw === 'path' || r.hw === 'steps' || r.hw === 'service')).map((r) => ({ pts: pairs(r.pts), w: r.hw === 'service' ? 4 : r.hw === 'steps' ? 2.4 : 2.6 }));
  const TALL = new Set(['w688189750', 'w1165063516']);
  for (const b of BARRIERS) {
    if (!CLAIM.has(b.id) || !b.pts) continue;
    const pts = pairs(b.pts), tall = TALL.has(b.id), h = tall ? 1.9 : 0.8, mat = tall ? panelMat : picketMat, n = pts.length, m = b.closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const a0 = pts[i], c0 = pts[(i + 1) % n], L0 = Math.hypot(c0[0] - a0[0], c0[1] - a0[1]); if (L0 < 0.3) continue;
      // cut the fence where a stair flight (or a path) meets it: pieces of at least 0.7 m outside the gaps
      // crossings of a mapped footway / steps way with this fence piece: a gap of path width + 0.8 m (the tall perimeter fences keep their locked gate)
      const gaps = [];
      if (!tall) for (const q of crossPaths) for (let j = 0; j + 1 < q.pts.length; j++) {
        const p0 = q.pts[j], p1 = q.pts[j + 1], d1 = [c0[0] - a0[0], c0[1] - a0[1]], d2 = [p1[0] - p0[0], p1[1] - p0[1]], den = d1[0] * d2[1] - d1[1] * d2[0];
        if (Math.abs(den) < 1e-6) continue;
        const t = ((p0[0] - a0[0]) * d2[1] - (p0[1] - a0[1]) * d2[0]) / den, u = ((p0[0] - a0[0]) * d1[1] - (p0[1] - a0[1]) * d1[0]) / den;
        if (t > -0.02 && t < 1.02 && u > -0.02 && u < 1.02) gaps.push([t * L0 - q.w / 2 - 0.5, t * L0 + q.w / 2 + 0.5]);
      }
      const blockedPt = (x, z) => { const s0 = Math.hypot(x - a0[0], z - a0[1]); return STAIRS.some((q) => segD(x, z, q.a, q.b) < 2.4) || gaps.some((g) => s0 > g[0] && s0 < g[1]); };
      const ns = Math.max(1, Math.ceil(L0 / 0.5)), keepPc = []; let st = null;
      const at = (t) => [a0[0] + (c0[0] - a0[0]) * t, a0[1] + (c0[1] - a0[1]) * t];
      for (let k = 0; k <= ns; k++) { const t = k / ns, q = at(t), bl = blockedPt(q[0], q[1]); if (!bl && st === null) st = t; if ((bl || k === ns) && st !== null) { const t1 = bl ? (k - 1) / ns : t; if ((t1 - st) * L0 > 0.6) keepPc.push([at(st), at(t1)]); st = null; } }
      for (const [a, c] of keepPc) {
        const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz);
        if (!inRing((a[0] + c[0]) / 2, (a[1] + c[1]) / 2) || inWater((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, 0.2)) continue;
        P.quad(mat, [a[0], 0.04, a[1]], [c[0], 0.04, c[1]], [c[0], h, c[1]], [a[0], h, a[1]], [-dz / l, 0, dx / l], [[0, 0], [l / (tall ? 2 : 1.6), 0], [l / (tall ? 2 : 1.6), 1], [0, 1]]);
        ph.addBox((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, l, 0.15, Math.atan2(-dz, dx), 0, h + 0.2);
        svc.fences.push({ id: b.id, pts: [a, c], h });
      }
    }
    for (const p of pts) P.box(M.iron, p[0] - 0.05, p[0] + 0.05, 0, h + 0.05, p[1] - 0.05, p[1] + 0.05, 'b', 1);
  }
  // ---------------------------------------------------------------- furniture: instanced benches, litter bins, lamps (+ extra lamps along the sett alleys), bicycle racks
  const allPaths = pathList.filter((p) => p.sett && !p.service);
  const toPath = (x, z) => { let best = null; for (const p of allPaths) { const n = nearestOnLine(p.pts, x, z); if (!best || n.d < best.d) best = n; } return best; };
  const benchGeo = partsGeos((Pp) => {
    for (let i = 0; i < 4; i++) Pp.box(M.benchWood, -0.9, 0.9, 0.44 + i * 0.0, 0.48, -0.26 + i * 0.17, -0.12 + i * 0.17, '', 1);        // seat slats
    for (let i = 0; i < 3; i++) Pp.box(M.benchWood, -0.9, 0.9, 0.62 + i * 0.12, 0.7 + i * 0.12, -0.3, -0.26, '', 1);                       // back slats
    for (const x of [-0.8, 0.8]) { Pp.box(M.iron, x - 0.03, x + 0.03, 0, 0.45, -0.28, 0.3, '', 1); Pp.box(M.iron, x - 0.03, x + 0.03, 0.45, 0.95, -0.34, -0.28, '', 1); }
  });
  const binGeo = partsGeos((Pp) => { Pp.col(M.iron, 0, 0, 0.0, 0.85, 0.27, 0.25, 10, true); Pp.col(M.ironSoft, 0, 0, 0.85, 0.9, 0.3, 0.3, 10, true); });
  const lampGeo = partsGeos((Pp) => {
    Pp.col(M.iron, 0, 0, 0, 0.9, 0.2, 0.15, 8, true); Pp.col(M.iron, 0, 0, 0.9, 4.1, 0.065, 0.055, 8, false); Pp.col(M.iron, 0, 0, 0.9, 1.1, 0.14, 0.14, 8, true);
    Pp.col(M.iron, 0, 0, 4.1, 4.2, 0.2, 0.2, 8, true); Pp.col(M.lampGlass, 0, 0, 4.2, 4.65, 0.2, 0.17, 8, true); Pp.col(M.iron, 0, 0, 4.65, 4.85, 0.24, 0.02, 8, true);
  });
  const benches = [], bins = [], lamps = [];
  for (const [x, z] of BENCHES) { const n = toPath(x, z), rot = n ? Math.atan2(n.x - x, n.z - z) : 0; if (free(x, z, 0.8)) benches.push({ x, z, rot }); }
  for (const [x, z] of BINS) if (free(x, z, 0.5)) bins.push({ x, z });
  for (const [x, z] of LAMPS) if (free(x, z, 0.5)) lamps.push({ x, z });
  // lamps along the sett alleys: every 24 m, 2.2 m beside the axis, alternating sides
  let side = 1;
  for (const p of allPaths) {
    let acc = 12;
    for (let i = 0; i + 1 < p.pts.length; i++) {
      const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 0.5) continue;
      for (let t = acc; t < l; t += 24) { side = -side; const x = a[0] + dx / l * t - dz / l * (p.w / 2 + 0.7) * side, z = a[1] + dz / l * t + dx / l * (p.w / 2 + 0.7) * side; if (free(x, z, 0.5) && !lamps.some((q) => Math.hypot(q.x - x, q.z - z) < 12)) lamps.push({ x, z }); acc = t + 24 - l; }
      acc = Math.max(0, acc);
    }
  }
  // extra benches along the alleys and the Kovsh promenade where the OSM has few
  for (const bk of W.banks || []) {
    const l = Math.hypot(bk.b[0] - bk.a[0], bk.b[1] - bk.a[1]); if (l < 25 || bk.name !== 'kovsh') continue;
    const t = 0.5, x = bk.a[0] + (bk.b[0] - bk.a[0]) * t + bk.n[0] * 3.6, z = bk.a[1] + (bk.b[1] - bk.a[1]) * t + bk.n[1] * 3.6;
    if (free(x, z, 0.8)) benches.push({ x, z, rot: Math.atan2(-bk.n[0], -bk.n[1]) });
  }
  let it = 0;
  it += addInstanced(ctx, root, 'lmNH-benches', benchGeo, benches.map((b) => mat4(b.x, 0.05, b.z, b.rot))).tris;
  it += addInstanced(ctx, root, 'lmNH-bins', binGeo, bins.map((b) => mat4(b.x, 0.05, b.z, 0))).tris;
  it += addInstanced(ctx, root, 'lmNH-lamps', lampGeo, lamps.map((b) => mat4(b.x, 0.05, b.z, 0))).tris;
  K.extraTris += it;
  for (const b of benches) { svc.benches.push({ x: b.x, z: b.z, rotY: b.rot, len: 1.8 }); }
  for (const b of lamps) ph.addCylinder(b.x, b.z, 0.2, 0, 4.8);
  svc.lamps = lamps.map((l) => ({ x: l.x, z: l.z, h: 4.85 })); svc.bins = bins; svc.litter = bins.length;
  // bicycle racks: rows of U-hoops
  for (const [x, z, cap] of RACKS) {
    const n = Math.round(cap / 2), rot = 0.5;
    P.push(x, 0.05, z, rot);
    for (let i = 0; i < n; i++) { const xx = (i - n / 2) * 0.55; P.box(M.iron, xx - 0.02, xx + 0.02, 0, 0.8, -0.02, 0.02, 'b', 1); P.box(M.iron, xx - 0.02, xx + 0.02, 0.76, 0.8, -0.02, 0.5, 'b', 1); P.box(M.iron, xx - 0.02, xx + 0.02, 0, 0.8, 0.46, 0.5, 'b', 1); }
    P.pop(); svc.crowd.push({ x, z, r: 3, n: 3, kind: 'bikes' });
  }
  // ---------------------------------------------------------------- trees
  const envTrees = (ctx.services.environment && ctx.services.environment.trees) || [];
  const fams = { lime: ['limeA', 'limeB'], oak: ['oak'], maple: ['mapleA'], spruce: ['spruceA'], tree: ['limeA', 'limeB'] };
  const trees = [];
  const okTree = (x, z) => inRing(x, z) && !inWater(x, z, 1.8) && !L.insideBuilding(x, z, 1.5) && cover(x, z) < -0.8 && !pathList.some((p) => p.sett && nearestOnLine(p.pts, x, z).d < p.w / 2 + 0.3) && !envTrees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.4) && !trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.8);
  for (const [x, z, f] of TREES) {
    if (!okTree(x, z)) continue;
    const fm = fams[f] || fams.tree, fam = fm[(rng() * fm.length) | 0], old = x < -3585 || f === 'oak';
    trees.push({ x, z, fam, s: (f === 'spruce' ? 1.0 : old ? 1.5 : 1.0) + rng() * 0.2, yaw: rng() * 6.28, y: 0.02 });
  }
  for (const row of TREE_ROWS) for (let i = 0; i + 1 < row.length; i++) {
    const a = row[i], b = row[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), n = Math.max(1, Math.round(l / 6.5));
    for (let k = 0; k <= n; k++) { const x = a[0] + dx * k / n, z = a[1] + dz * k / n; if (okTree(x, z)) trees.push({ x, z, fam: rng() < 0.6 ? 'limeA' : 'limeB', s: 0.9 + rng() * 0.15, yaw: rng() * 6.28, y: 0.02 }); }
  }
  if (trees.length) plantTrees(K, trees, 'lmNH-trees');
  svc.trees = { mine: trees.length, osm: TREES.length, env: envTrees.length, envOnIsland: envTrees.filter((t) => inRing(t.x, t.z)).length };
  svc.park = { paths: pathList.length, pathQuads, benches: benches.length, bins: bins.length, lamps: lamps.length };

  // ---------------------------------------------------------------- the gates (walk-in, no barriers) and crowd spots
  svc.entrances.push(
    { id: 'north-krustein', x: -3393, z: 171, rotY: Math.PI * 0.84, kind: 'gate', open: true },
    { id: 'west-krustein', x: -3619, z: 316, rotY: Math.PI * 0.2, kind: 'gate', open: true },
    { id: 'east-bridge', x: -3331, z: 314, rotY: -Math.PI / 2, kind: 'gate', open: true },
    { id: 'south-steps', x: -3540, z: 397, rotY: Math.PI, kind: 'steps', open: true });
  svc.crowd.push({ x: -3440, z: 275, r: 22, n: 26, kind: 'lawn' }, { x: -3395, z: 340, r: 10, n: 8, kind: 'quay' }, { x: -3505, z: 262, r: 12, n: 8, kind: 'alley' }, { x: -3392, z: 180, r: 8, n: 6, kind: 'gate' });
  svc.photoSpots.push({ x: -3392, z: 200, yaw: 8, pitch: 6, name: 'Новая Голландия: главный вход' }, { x: -3365, z: 392, yaw: 160, pitch: 8, name: 'Ковш и Арка' });
  // the north gate: two black steel posts, a cross-beam and the lettering НОВАЯ ГОЛЛАНДИЯ (plain steel letters, no logo) over the end of the 1st Krustein bridge [photo 52]
  {
    const d = [0.535, 0.845], p = [0.845, -0.535], gx = -3389.4, gz = 175.1, rot = Math.atan2(-d[0], -d[1]);
    const F = (ctx.tex.FONTS && ctx.tex.FONTS.sans) || 'sans-serif';
    const letters = ctx.tex.draw(1024, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = `bold 92px ${F}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('НОВАЯ ГОЛЛАНДИЯ', w / 2, h / 2 + 4); }, { key: 'lmNH-gate-letters', repeat: [1, 1] });
    const letterMat = T('#e6e3dc', { map: letters, alphaTest: 0.5, side: 'double', name: 'lmNH-gateLetters', emissive: '#403c34', emissiveIntensity: 0.25 });
    M.cutouts.add(letterMat);
    P.push(gx, 0, gz, rot);
    for (const sx of [-1, 1]) { P.box(M.iron, sx * 4.4 - 0.12, sx * 4.4 + 0.12, 0, 6.2, -0.12, 0.12, 'b', 1); P.box(M.iron, sx * 4.4 - 0.2, sx * 4.4 + 0.2, 0, 0.5, -0.2, 0.2, 'b', 1); }
    P.box(M.iron, -4.5, 4.5, 5.7, 5.85, -0.06, 0.06, 'b', 1); P.box(M.iron, -4.5, 4.5, 4.15, 4.3, -0.06, 0.06, 'b', 1);
    P.quad(letterMat, [-4.1, 4.3, 0.03], [4.1, 4.3, 0.03], [4.1, 5.7, 0.03], [-4.1, 5.7, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.pop();
    for (const sx of [-1, 1]) ph.addBox(gx + p[0] * sx * 4.4, gz + p[1] * sx * 4.4, 0.5, 0.5, rot, 0, 6);
  }
  void G;
}
