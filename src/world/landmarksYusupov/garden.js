// landmarksYusupov/garden.js - the Yusupov garden ("сад дворца Юсуповых", OSM park w108952921, a 165 m strip from the courtyard wall to ulitsa Dekabristova; Mikhailov 1830-38), docs/research/yusupov.md
// section 6, photos refs/yusupov 36-41 45 46 69-72: one fine-tessellated lawn sheet over the park polygon, the gravel paths of the claimed OSM footways (2.2 m, clipped at net.cover), a long grassy mound
// (a ridge 60 x 15 m, 2.2 m high with a flat top) inside the path loop with a straight granite staircase on its NE flank (walkable: stairs + a top deck), old limes / maples / oaks (instanced, LOD),
// black cast-iron lamp posts with a single round lantern (4 m), urn bins at the stairs, wooden benches, the plastered wall of the Moika 96 side and a black iron fence (spears) on the service-drive side.
// All gates of the OSM barrier nodes are open.  Nothing stands on a carriageway.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ROADS, GREEN, BARRIER_NODES } from '../data/city.js';
import { ribbon, pairs, fillPolyFine, roadTest, coverFn, inRing, inflate, distToLine } from './surfaces.js';
import { plantTrees } from './trees.js';
import { strip3D, sampleLine, lerp2, dist, frameAngle, lineLen } from './lines.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { spearFence } from './fences.js';

const PATH_IDS = new Set(['w123243372', 'w134519662', 'w123099605', 'w123246597', 'w123099608', 'w123246598', 'w123099604', 'w108952917', 'w108952919']);
const PARK_ID = 'w108952921';
const LOOP = [[-2933, 427], [-2915, 442], [-2911, 447], [-2905, 470], [-2907, 487], [-2913, 493], [-2921, 492], [-2928, 485], [-2939, 447], [-2937, 434]];
const HILL_H = 2.2;

function lampGeos() {
  return partsGeos((P) => {
    const iron = this_M.lamp;
    P.cyl(iron, [0, 0, 0], [0, 0.5, 0], 0.2, 0.14, 8, false); P.cyl(iron, [0, 0.5, 0], [0, 3.5, 0], 0.075, 0.05, 8, false);
    P.cyl(iron, [0, 1.0, 0], [0, 1.15, 0], 0.11, 0.11, 8, false); P.cyl(iron, [0, 3.45, 0], [0, 3.62, 0], 0.11, 0.09, 8, false);
    P.box(iron, -0.17, 0.17, 3.62, 3.68, -0.17, 0.17, 'b');
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.cyl(iron, [sx * 0.15, 3.68, sz * 0.15], [sx * 0.15, 4.12, sz * 0.15], 0.012, 0.012, 3, false);
    P.cyl(this_M.lampGlass, [0, 3.7, 0], [0, 4.1, 0], 0.17, 0.2, 10, false);
    P.cyl(iron, [0, 4.1, 0], [0, 4.3, 0], 0.22, 0.04, 10, false);
  });
}
let this_M = null;

export function build(K) {
  const { ctx, P, M, svc, root } = K, ph = ctx.physics, rng = ctx.rng(20261007);
  this_M = M;
  const clip = (() => { const cov = coverFn(ctx); return (x, z) => cov(x, z) > -0.25; })();
  const park = GREEN.find((g) => g.id === PARK_ID);
  const o = park.polys[0].o, ring = pairs(o);
  // ---- lawn sheet over the park polygon (slightly inflated: it ends under walls and fences)
  fillPolyFine(P, M.lawn, ring, 0.011, { maxEdge: 14, tile: 6 });
  // ---- gravel paths
  const paths = [], pathId = new Map();
  const allFoot = ROADS.filter((r) => ['footway', 'path', 'steps', 'pedestrian'].includes(r.hw) && !r.tunnel && !r.bridge && r.pts.some((v, i) => i % 2 === 0 && v > -3000 && v < -2840 && r.pts[i + 1] > 340 && r.pts[i + 1] < 600)).map((r) => ({ id: r.id, pts: pairs(r.pts) }));
  const nearFoot = (x, z, d = 2.2) => allFoot.some((q) => distToLine(q.pts, x, z) < d);
  for (const r of ROADS) {
    if (!PATH_IDS.has(r.id)) continue;
    const pts = pairs(r.pts); paths.push(pts); pathId.set(pts, r.id);
    ribbon(P, M.gravel, pts, 2.3, 0.02 + (r.id.charCodeAt(r.id.length - 1) % 7) * 0.0006, { clip, tile: 3 });
  }
  // black wire hoop edging along the lawn side of the longer paths (photos 36 / 40 / 46): a low rail 0.24 m on short posts, no collider
  const edging = (pts, side, ownId) => {
    const d = [], S = sampleLine(pts, 2.0, 0.5, 0.5);
    let run = [];
    const flush = () => { if (run.length > 1) { svc.fences.push({ id: 'hoop', low: true, pts: run.slice() }); strip3D(P, run, -0.012, 0.012, 0.2, 0.24, { left: M.hoop, right: M.hoop, top: M.hoop }, 2, { stagger: 0 }); for (const q of run) P.cyl(M.hoop, [q[0], 0, q[1]], [q[0], 0.24, q[1]], 0.012, 0.012, 4, false); } run = []; };
    for (const s of S) {
      const x = s.x + s.tz * side * 1.45, z = s.z - s.tx * side * 1.45;
      // broken wherever another path comes near (junctions, crossings): gap >= path half width 1.15 + 0.85
      if (!inRing(ring, x, z) || clip(x, z) || L.insideBuilding(x, z, 0.3) || allFoot.some((q) => q.id !== ownId && distToLine(q.pts, x, z) < 2.0)) { flush(); continue; }
      run.push([x, z]);
    }
    flush(); void d;
  };
  svc.rails = svc.rails || [];
  for (const p of paths) if (lineLen(p) > 25) { edging(p, 1, pathId.get(p)); edging(p, -1, pathId.get(p)); }
  // the central gate path between the courtyard gate and the garden: a small gravel plaza behind the gate
  fillPolyFine(P, M.gravel, [[-2926, 392], [-2918, 395], [-2916, 383], [-2923, 380]], 0.021, { maxEdge: 8, tile: 3 });
  // ---- the mound: an ellipse inside the loop (axis along the loop), a flat top, smooth flanks
  let hx = 0, hz = 0; for (const p of LOOP) { hx += p[0] / LOOP.length; hz += p[1] / LOOP.length; }
  const ax = [0.29, 0.957], bx = [-0.957, 0.29];                           // long axis / across (world x, z)
  const RA = 27, RB = 6.6, NA = 44, R_FR = [1.0, 0.82, 0.64, 0.5];
  const pt = (k, i) => { const a = i / NA * Math.PI * 2, r = R_FR[k]; return [hx + ax[0] * Math.cos(a) * RA * r + bx[0] * Math.sin(a) * RB * r, hz + ax[1] * Math.cos(a) * RA * r + bx[1] * Math.sin(a) * RB * r]; };
  const hgt = (k) => { const t = Math.max(0, Math.min(1, (1 - R_FR[k]) / (1 - R_FR[R_FR.length - 1]))); return 0.04 + HILL_H * t * t * (3 - 2 * t); };
  for (let k = 0; k + 1 < R_FR.length; k++) for (let i = 0; i < NA; i++) {
    const a = pt(k, i), b = pt(k, i + 1), c = pt(k + 1, i + 1), d = pt(k + 1, i), ya = hgt(k), yb = hgt(k + 1);
    P.quad(M.lawn, [a[0], ya, a[1]], [b[0], ya, b[1]], [c[0], yb, c[1]], [d[0], yb, d[1]], [0, 1, 0], [[a[0] / 6, a[1] / 6], [b[0] / 6, b[1] / 6], [c[0] / 6, c[1] / 6], [d[0] / 6, d[1] / 6]]);
  }
  const top = []; for (let i = 0; i < NA; i++) top.push(pt(R_FR.length - 1, i));
  P.cap(M.lawn, top, hgt(R_FR.length - 1), true, 6);
  // the staircase on the NE flank (facing the NE path): runs across the flank at the middle of the long side
  const sdir = [-bx[0], -bx[1]];                                                         // from the ridge axis towards the NE flank (outwards)
  const base = [hx + sdir[0] * (RB * 1.0), hz + sdir[1] * (RB * 1.0)], topS = [hx + sdir[0] * (RB * 0.45), hz + sdir[1] * (RB * 0.45)];
  const n = 13, run = dist(base, topS), tread = run / n, rise = (HILL_H + 0.0) / n, sw = 3.6;
  // stair frame: local +x across (along the ridge), local +z = uphill (towards the ridge axis)
  const up = [-sdir[0], -sdir[1]], across = [ax[0], ax[1]];
  const rotS = Math.atan2(up[0], up[1]);                                                 // rotY mapping local +z to `up`
  P.push(base[0], 0, base[1], rotS);
  for (let i = 0; i < n; i++) {
    P.box(M.graniteWarm, -sw / 2, sw / 2, 0, rise * (i + 1), i * tread, (i + 1) * tread + 0.02, 'b');
  }
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) P.box(M.graniteWarm, s * (sw / 2 + 0.28) - 0.14, s * (sw / 2 + 0.28) + 0.14, 0, rise * (i + 1) + 0.32, i * tread, (i + 1) * tread + 0.02, 'b');   // stepped cheek walls
  P.pop();
  const cstep = (i) => ({ cx: base[0] + up[0] * (i + 0.5) * tread, cz: base[1] + up[1] * (i + 0.5) * tread });
  void cstep;
  ph.addStairs(base[0] + up[0] * run / 2, base[1] + up[1] * run / 2, sw, run, rotS, 0, HILL_H + 0.04, n);
  // top deck (the flat top of the mound) as a walkable box, blockers around the flanks (an opening at the stairs)
  ph.addWalkBox(hx, hz, RA * 2 * R_FR[R_FR.length - 1] * 0.9, RB * 2 * R_FR[R_FR.length - 1] * 0.9, Math.atan2(ax[0], ax[1]), HILL_H + 0.04, 0);
  const gapC = base, gapHalf = sw / 2 + 0.7;
  for (let i = 0; i < NA; i++) {
    const a = pt(0, i), b = pt(0, i + 1), m = lerp2(a, b, 0.5), l = dist(a, b);
    if (Math.hypot(m[0] - gapC[0], m[1] - gapC[1]) < gapHalf + 1.5) continue;
    ph.addBox(m[0], m[1], l + 0.2, 0.5, frameAngle((b[0] - a[0]) / l, (b[1] - a[1]) / l), 0, HILL_H * 0.8);
  }
  // ---- instanced lamps, bins, benches along the paths
  const lampGeo = lampGeos();
  const lampsAt = [];
  const mainPaths = paths.filter((p) => lineLen(p) > 25);
  for (const p of mainPaths) {
    for (const s of sampleLine(p, 24, 10, 10)) {
      const nx = s.tz, nz = -s.tx, side = (Math.round(s.x * 7 + s.z * 3) & 1) ? 1 : -1;
      const x = s.x + nx * 1.9 * side, z = s.z + nz * 1.9 * side;
      if (!inRing(ring, x, z) || clip(x, z) || L.insideBuilding(x, z, 0.5)) continue;
      if (lampsAt.some((q) => Math.hypot(q.x - x, q.z - z) < 12)) continue;
      lampsAt.push({ x, z });
    }
  }
  const lm = lampsAt.map((q) => mat4(q.x, 0, q.z, 0, 1));
  addInstanced(ctx, root, 'lmY-lamps', lampGeo, lm);
  for (const q of lampsAt) { ph.addCylinder(q.x, q.z, 0.18, 0, 4.4); svc.lamps.push({ x: q.x, z: q.z, h: 4.3 }); }
  // benches (2 at the stairs, 4 along the main path): boards on iron ends, facing the path
  const bench = (x, z, rot) => {
    P.push(x, 0, z, rot);
    for (const sx of [-0.75, 0.75]) { P.box(M.iron, sx - 0.04, sx + 0.04, 0, 0.45, -0.22, 0.22, 'b'); P.box(M.iron, sx - 0.04, sx + 0.04, 0.45, 0.95, 0.18, 0.24, 'b'); }
    P.box(M.bench, -0.85, 0.85, 0.45, 0.5, -0.24, 0.2, 'b'); P.box(M.bench, -0.85, 0.85, 0.62, 0.7, 0.2, 0.24, 'b'); P.box(M.bench, -0.85, 0.85, 0.78, 0.86, 0.2, 0.24, 'b');
    P.pop();
    ph.addBox(x, z, 1.8, 0.6, rot, 0, 0.6); svc.benches.push({ x, z, rotY: rot, len: 1.8 });
  };
  const spots = [];
  for (const p of mainPaths) for (const s of sampleLine(p, 32, 14, 14)) {
    const side = (Math.round(s.x * 3 + s.z * 5) & 1) ? 1 : -1, nx = s.tz * side, nz = -s.tx * side, x = s.x + nx * 1.9, z = s.z + nz * 1.9;
    if (!inRing(ring, x, z) || clip(x, z) || L.insideBuilding(x, z, 0.8)) continue;
    if (spots.some((q) => Math.hypot(q.x - x, q.z - z) < 14) || lampsAt.some((q) => Math.hypot(q.x - x, q.z - z) < 2.6)) continue;
    spots.push({ x, z, rot: Math.atan2(-nx, -nz) });
  }
  for (const s of spots.slice(0, 6)) bench(s.x, s.z, s.rot);
  // urn bins at the stairs
  for (const s of [-1, 1]) { const x = base[0] + across[0] * s * (sw / 2 + 0.9) - up[0] * 0.6, z = base[1] + across[1] * s * (sw / 2 + 0.9) - up[1] * 0.6; P.cyl(M.bin, [x, 0, z], [x, 0.55, z], 0.22, 0.3, 10, true); P.cyl(M.bin, [x, 0.55, z], [x, 0.7, z], 0.32, 0.32, 10, true); ph.addCylinder(x, z, 0.3, 0, 0.7); }
  // ---- trees: scattered inside the park, away from paths, the mound, buildings and each other
  const trees = [], placed = [];
  const okTree = (x, z, r) => {
    if (!inRing(ring, x, z) || L.insideBuilding(x, z, r + 0.5) || L.isOnRoad(x, z, r)) return false;
    for (const p of paths) if (distToLine(p, x, z) < 2.0 + r) return false;
    const du = (x - hx) * ax[0] + (z - hz) * ax[1], dv = (x - hx) * bx[0] + (z - hz) * bx[1];
    if ((du / (RA + 2)) ** 2 + (dv / (RB + 2)) ** 2 < 1) return false;
    for (const q of placed) if (Math.hypot(q.x - x, q.z - z) < 4.5 + r) return false;
    return true;
  };
  const fams = ['limeA', 'limeB', 'mapleA', 'oak', 'ash', 'limeA', 'mapleA'];
  const bb = ring.reduce((a, p) => ({ x0: Math.min(a.x0, p[0]), x1: Math.max(a.x1, p[0]), z0: Math.min(a.z0, p[1]), z1: Math.max(a.z1, p[1]) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
  for (let k = 0; k < 2600 && trees.length < 62; k++) {
    const x = bb.x0 + rng() * (bb.x1 - bb.x0), z = bb.z0 + rng() * (bb.z1 - bb.z0);
    if (!okTree(x, z, 1.2)) continue;
    const big = rng() < 0.5;
    placed.push({ x, z }); trees.push({ x, z, fam: fams[Math.floor(rng() * fams.length)], s: big ? 1.15 + rng() * 0.35 : 0.85 + rng() * 0.3, yaw: rng() * 6.28, y: 0.03 });
  }
  // shrubs (lilac / bird cherry) in small groups at the hill foot and near the courtyard wall
  for (let k = 0; k < 500 && trees.length < 90; k++) {
    const x = bb.x0 + rng() * (bb.x1 - bb.x0), z = bb.z0 + rng() * (bb.z1 - bb.z0);
    if (!okTree(x, z, 0.6)) continue;
    placed.push({ x, z }); trees.push({ x, z, fam: 'shrub', s: 1.5 + rng() * 0.8, yaw: rng() * 6.28, y: 0.03 });
  }
  K.extraTris = (K.extraTris || 0) + 0;
  plantTrees({ ctx, root, P }, trees, 'lmY-garden-trees');
  svc.gardenTrees = trees.length;
  // ---- the boundary: plastered wall (SW side, 2.8 m) where no building closes the garden, black spear fence (NE side, 2.0 m) along the service drive
  const ringPts = ring.slice();
  const edgeCovered = (a, b, side) => {
    // no wall where a building stands within 0.7 m outside the edge
    let hit = 0, tot = 0; const l = dist(a, b);
    for (let s = 0.5; s < l; s += 1.0) { const t = s / l, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, nx = (b[1] - a[1]) / l, nz = -(b[0] - a[0]) / l; tot++; if (L.insideBuilding(x + nx * side * 0.7, z + nz * side * 0.7, 0.05) || L.insideBuilding(x - nx * side * 0.7, z - nz * side * 0.7, 0.05)) hit++; }
    return tot > 0 && hit / tot > 0.6;
  };
  const wallRun = (pts) => {
    svc.fences.push({ id: 'garden-sw', pts: pts.slice() });
    strip3D(P, pts, -0.22, 0.22, 0, 2.7, { left: M.wallY, right: M.wallY }, 3, { caps: M.wallY });
    strip3D(P, pts, -0.32, 0.32, 2.7, 2.85, { left: M.trim, right: M.trim, top: M.trim, under: M.trimShade }, 2);
    for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], l = dist(a, b); if (l > 0.3) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l + 0.3, 0.6, frameAngle((b[0] - a[0]) / l, (b[1] - a[1]) / l), 0, 2.9); }
  };
  const fenceRun = (a, b) => { spearFence(K, a, b, { h: 1.6, plinth: 0.45, gap: 3.0 }); svc.fences.push({ id: 'garden-ne', pts: [a, b] }); };
  const open = new Set(); for (const g of BARRIER_NODES) if (g.kind === 'gate' || g.kind === 'lift_gate') open.add(g.id);
  const gates = BARRIER_NODES.filter((g) => g.kind === 'gate' || g.kind === 'lift_gate');
  const nearGate = (x, z) => gates.some((g) => Math.hypot(g.x - x, g.z - z) < 2.4);
  // SW side: ring vertices 18 .. 20 ((-2918,551) (-2915,550) (-2957,387)): walls by edge pieces without buildings and without gates
  const swPts = [ring[18], ring[19], ring[20]];
  for (let i = 0; i + 1 < swPts.length; i++) {
    const a = swPts[i], b = swPts[i + 1], l = dist(a, b);
    let run = []; const flush = () => { if (run.length > 1) wallRun(run); run = []; };
    for (let s = 0; s <= l; s += 2.0) {
      const t = Math.min(1, s / l), p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], q = [a[0] + (b[0] - a[0]) * Math.min(1, (s + 2) / l), a[1] + (b[1] - a[1]) * Math.min(1, (s + 2) / l)];
      if (edgeCovered(p, q, 1) || nearGate(p[0], p[1]) || nearFoot(p[0], p[1], 2.6)) flush(); else run.push(p);
    }
    flush();
  }
  // NE side: ring vertices 0 .. 8: black spear fence pieces
  for (let i = 0; i < 8; i++) {
    const a = ring[i], b = ring[i + 1], l = dist(a, b);
    for (let s = 0; s < l; s += 3) {
      const t0 = s / l, t1 = Math.min(1, (s + 3) / l), p = lerp2(a, b, t0), q = lerp2(a, b, t1);
      if (edgeCovered(p, q, 1) || nearGate(p[0], p[1]) || nearGate(q[0], q[1]) || nearFoot(p[0], p[1], 2.6) || nearFoot(q[0], q[1], 2.6) || nearFoot((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 2.6)) continue;
      fenceRun(p, q);
    }
  }
  svc.crowd.push({ x: hx - 10, z: hz - 20, r: 7, n: 5, name: 'garden' });
  svc.photoSpots.push({ x: base[0] + up[0] * -6, z: base[1] + up[1] * -6, yaw: Math.round(Math.atan2(-up[0], -up[1]) * 180 / Math.PI), name: 'Сад Юсуповского дворца: холм с лестницей' });
  svc.mound = { x: hx, z: hz, h: HILL_H };
  void open;
}
