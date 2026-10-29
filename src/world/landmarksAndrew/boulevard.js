// landmarksAndrew/boulevard.js - the ANDREEVSKY BOULEVARD (Андреевский бульвар: the pedestrian stretch of the 6th-7th lines between Sredny and Bolshoy prospects, 479 m long, 28 m between the facades since 2002).
// Dossier docs/research/andrew.md section 5 (critic-corrected cross-section), photos refs/andrew 71 72 77 78 79 80 82 83.  Frame B (frame.js): s along the street from the Sredny pr. kerb toward Bolshoy pr. (SSE),
// q across toward the ENE; the facades stand at q -5.5 / +22.3.  Drawn here:
//   * the granite-slab PROMENADES (west q -5.5 .. 3.1, east q 14.2 .. 22.3, the entrance zone s < 72 and the Bolshoy end), clipped at the real asphalt (road integrity) and at the cathedral court;
//   * the LAWN STRIP (q 3.1 .. 14.2, s 72 .. 425.5): eleven lawn pieces between nine cross paths and two fountain plazas, granite kerbs, the red-brown block-paved central ALLEY (4.5 m), low black rails along the
//     outer kerb lines (the lawns are open toward the alley), two rows of LARCHES (q 4.6 / 12.7, every 7 m, 12-14 m tall, instanced) and twin-rowed cast-iron LAMPS with a crook arm and an opal globe every 14 m;
//   * the two octagonal granite FOUNTAINS (basin 5.6 m across flats, two-bowl stem, 3.0 m) in brick plazas (R 6.5) with granite bench blocks.
// Benches / bins of the boulevard are the OSM nodes drawn by props (they stay as they are).  The paving of the pavilion square is pavilion.js, the Korchmin pocket and the konka plaza are korchmin.js.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FB, FC } from './frame.js';
import { fillPolyClipped, coverFn, inRing } from './surfaces.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { plantTrees } from './trees.js';
import * as G from './geo.js';
import { courtWorld } from './precinct.js';
import { wallBoxes } from './ringkit.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';
import { knockBays, splitBays, unitPanel } from '../lib/fence-bays.js';

export const STRIP = { w0: -5.5, w1: 3.1, e0: 14.2, e1: 22.3, a0: 6.2, a1: 10.7, lawn0: 72.2, lawn1: 425.5, end: 475.5, len: 479 };
export const CROSS = [108, 136, 209, 236, 260, 287, 350, 378];
export const FOUNTAINS = [[176.2, 8.8], [328.6, 9.0]];
const PR = 6.5, KERB = 0.18, Y = { slab: 0.04, alley: 0.065, plaza: 0.08, lawn: 0.10 };

/** lawn pieces along s (between the cross paths and the plazas) */
export function lawnPieces() {
  const cuts = [...CROSS.map((c) => [c - 1.2, c + 1.2]), ...FOUNTAINS.map(([s]) => [s - PR, s + PR])].sort((a, b) => a[0] - b[0]);
  const out = []; let s = STRIP.lawn0;
  for (const [a, b] of cuts) { if (a > s + 1) out.push([s, a]); s = Math.max(s, b); }
  if (STRIP.lawn1 > s + 1) out.push([s, STRIP.lawn1]);
  return out;
}

/** cast-iron lamp, 5.6 m: footing, fluted post, a crook arm along local +x ending in an opal globe under a cap (photos 77 79 82) */
function lampCrook(Q, M) {
  Q.cyl(M.lampGreen, [0, 0, 0], [0, 0.3, 0], 0.27, 0.22, 8, true);
  Q.cyl(M.lampGreen, [0, 0.3, 0], [0, 0.95, 0], 0.2, 0.12, 10, false);
  Q.cyl(M.lampGreen, [0, 0.95, 0], [0, 1.08, 0], 0.17, 0.17, 10, true);
  Q.cyl(M.lampGreen, [0, 1.08, 0], [0, 4.7, 0], 0.115, 0.07, 10, false);
  const pts = [[0, 4.7], [0, 5.05], [0.08, 5.38], [0.32, 5.58], [0.66, 5.64], [0.98, 5.5], [1.12, 5.28]];
  for (let i = 0; i + 1 < pts.length; i++) Q.cyl(M.lampGreen, [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.055 - i * 0.004, 0.05 - i * 0.004, 6, false);
  Q.cyl(M.lampGreen, [1.12, 5.28, 0], [1.12, 5.12, 0], 0.07, 0.16, 8, true);
  const g = new THREE.SphereGeometry(0.23, 10, 8); Q.geo(M.globe, g, 1.12, 4.88, 0, 0, 0, 0, 1, 1.1, 1); g.dispose();
  Q.cyl(M.lampGreen, [1.12, 4.62, 0], [1.12, 4.55, 0], 0.07, 0.04, 6, true);
}
/** low black rail post 0.85 m with a ball top (instanced) */
function railPost(Q, M) { Q.cyl(M.lampBlack, [0, 0, 0], [0, 0.8, 0], 0.045, 0.04, 6, true); Q.geo(M.lampBlack, new THREE.SphereGeometry(0.065, 6, 4), 0, 0.86, 0); }

/** an octagonal granite fountain in local (q, s): stepped basin 5.6 m across flats, two-bowl stem to 3.0 m, water */
function fountain(P, M, cx, cz) {
  const a0 = Math.PI / 8, ro = (ap) => ap / Math.cos(a0);
  G.frustum(P, M.graniteBasin, cx, cz, 0, 0.2, 8, ro(3.25), ro(3.25), a0, 6, 0.2, { capTop: M.graniteBasin });
  G.frustum(P, M.graniteBasin, cx, cz, 0.2, 0.42, 8, ro(3.0), ro(3.0), a0, 6, 0.2, { capTop: M.graniteBasin });
  G.frustum(P, M.graniteBasin, cx, cz, 0.42, 0.65, 8, ro(2.8), ro(2.8), a0, 6, 0.2);
  const outer = G.ngon(8, ro(2.8), a0, cx, cz), inner = G.ngon(8, ro(2.35), a0, cx, cz), t = (p) => [p[0], p[1]];
  P.cap(M.graniteBasin, outer.map(t), 0.65, true, 2, [inner.map(t)]);
  for (let i = 0; i < 8; i++) {                                                                       // inner wall of the basin (faces the water)
    const t0 = a0 + i * Math.PI / 4, t1 = t0 + Math.PI / 4, tm = (t0 + t1) / 2, R = ro(2.35);
    P.quad(M.graniteBasin, [cx + Math.sin(t1) * R, 0.3, cz + Math.cos(t1) * R], [cx + Math.sin(t0) * R, 0.3, cz + Math.cos(t0) * R], [cx + Math.sin(t0) * R, 0.65, cz + Math.cos(t0) * R], [cx + Math.sin(t1) * R, 0.65, cz + Math.cos(t1) * R], [-Math.sin(tm), 0, -Math.cos(tm)], [[0, 0], [1, 0], [1, 0.3], [0, 0.3]]);
  }
  P.fan(M.graniteBasin, inner.map((p) => [p[0], 0.3, p[1]]), [0, 1, 0]);
  P.fan(M.water, inner.map((p) => [cx + (p[0] - cx) * 0.97, 0.55, cz + (p[1] - cz) * 0.97]), [0, 1, 0], (p) => [p[0] / 3, p[2] / 3]);
  const prof = [[0.62, 0.3], [0.62, 0.55], [0.48, 0.72], [0.36, 0.98], [0.3, 1.22], [0.34, 1.34], [0.6, 1.42], [0.95, 1.55], [1.02, 1.68], [0.96, 1.73], [0.9, 1.68], [0.5, 1.58], [0.26, 1.62],
    [0.2, 1.82], [0.22, 2.05], [0.3, 2.25], [0.36, 2.38], [0.55, 2.45], [0.58, 2.56], [0.54, 2.6], [0.5, 2.56], [0.3, 2.5], [0.16, 2.54], [0.12, 2.76], [0.07, 2.92], [0, 3.0]];
  G.revolve(P, M.graniteBasin, prof, 14, { cx, cz, uRep: 2, vTile: 1.5, crease: 50 });
  for (const [r, y] of [[0.88, 1.66], [0.5, 2.54]]) P.fan(M.water, Array.from({ length: 12 }, (_, i) => [cx + Math.cos(i * Math.PI / 6) * r, y, cz + Math.sin(i * Math.PI / 6) * r]), [0, 1, 0]);
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx), rng = ctx.rng(5417);
  void courtWorld; void inRing; void FC; void L;
  const excl = () => false, bad = (x, z) => cover(x, z) > -0.25 || excl(x, z);
  const clipNum = (x, z) => (excl(x, z) ? 1 : cover(x, z));                                       // numeric clearance for fillPolyClipped: > -margin drops the triangle
  const bw = (s, q) => FB.W(q, s);
  const fill = (mat, q0, q1, s0, s1, y, tile = 3.6, maxEdge = 3) => fillPolyClipped(P, mat, [[q0, s0], [q1, s0], [q1, s1], [q0, s1]], y, clipNum, { margin: 0.25, maxEdge, tile });
  const pieces = lawnPieces();
  let pave = 0;
  P.push(FB.ox, 0, FB.oz, FB.rot);                                                    // local x = q, local z = s
  try {
    // ---------------------------------------------------------------------- promenades and zones (granite slabs)
    pave += fill(M.slabGrey, STRIP.w0, STRIP.e1, 0, STRIP.lawn0, Y.slab, 3.6, 1.6);                       // the entrance zone (the pavilion square side)
    pave += fill(M.slabGrey, STRIP.w0, STRIP.w1, STRIP.lawn0, STRIP.lawn1, Y.slab, 3.6, 1.6);
    pave += fill(M.slabGrey, STRIP.e0, STRIP.e1, STRIP.lawn0, STRIP.lawn1, Y.slab, 3.6, 1.6);
    pave += fill(M.slabGrey, STRIP.w0, STRIP.a0, STRIP.lawn1, STRIP.end, Y.slab, 3.6, 1.6);                  // the Bolshoy end
    pave += fill(M.slabGrey, STRIP.a1, STRIP.e1, STRIP.lawn1, STRIP.end, Y.slab, 3.6, 1.6);
    for (const c of CROSS) { pave += fill(M.slabGrey, STRIP.w1, STRIP.a0, c - 1.2, c + 1.2, Y.slab, 3.6, 1.6); pave += fill(M.slabGrey, STRIP.a1, STRIP.e0, c - 1.2, c + 1.2, Y.slab, 3.6, 1.6); }
    for (const [s] of FOUNTAINS) pave += fill(M.slabGrey, STRIP.w1, STRIP.e0, s - PR, s + PR, Y.slab, 3.6, 1.6);
    // the central alley (red-brown block paving, 4.5 m) and the brick plazas round the fountains
    pave += fill(M.alley, STRIP.a0, STRIP.a1, STRIP.lawn0 - 5, STRIP.end, Y.alley, 3, 3);
    for (const [s, q] of FOUNTAINS) { const ring = Array.from({ length: 28 }, (_, i) => [q + Math.cos(i * Math.PI / 14) * PR, s + Math.sin(i * Math.PI / 14) * PR]); pave += fillPolyClipped(P, M.herring, ring, Y.plaza, clipNum, { margin: 0.25, maxEdge: 3, tile: 2 }); }
    // ---------------------------------------------------------------------- lawn pieces with granite kerbs
    for (const [s0, s1] of pieces) for (const west of [true, false]) {
      const qa = west ? STRIP.w1 : STRIP.a1, qb = west ? STRIP.a0 : STRIP.e0, lq0 = west ? qa + KERB : qa, lq1 = west ? qb : qb - KERB, ls0 = s0 + KERB, ls1 = s1 - KERB;
      P.quad(M.lawn, [lq0, Y.lawn, ls0], [lq1, Y.lawn, ls0], [lq1, Y.lawn, ls1], [lq0, Y.lawn, ls1], [0, 1, 0], [[lq0 / 6, ls0 / 6], [lq1 / 6, ls0 / 6], [lq1 / 6, ls1 / 6], [lq0 / 6, ls1 / 6]]);
      if (west) P.box(M.kerb, qa, qa + KERB, 0, 0.15, s0, s1, 'b', 2); else P.box(M.kerb, qb - KERB, qb, 0, 0.15, s0, s1, 'b', 2);          // the outer long kerb
      P.box(M.kerb, lq0, lq1, 0, 0.15, s0, ls0, 'b', 2); P.box(M.kerb, lq0, lq1, 0, 0.15, ls1, s1, 'b', 2);                                // the two end kerbs
      if (west) P.box(M.kerbLight, STRIP.a0, STRIP.a0 + 0.1, 0, 0.11, ls0, ls1, 'b', 2); else P.box(M.kerbLight, STRIP.a1 - 0.1, STRIP.a1, 0, 0.11, ls0, ls1, 'b', 2);   // a narrow granite edge along the alley
    }
    for (const [s0, s1] of pieces) {
      P.quad(M.drain, [2.55, 0.056, s0 + 0.25], [2.85, 0.056, s0 + 0.25], [2.85, 0.056, s1 - 0.25], [2.55, 0.056, s1 - 0.25], [0, 1, 0], [[0, 0], [1, 0], [1, (s1 - s0 - 0.5) / 1.2], [0, (s1 - s0 - 0.5) / 1.2]]);
      P.box(M.kerb, 2.48, 2.55, 0.0, 0.05, s0 + 0.2, s1 - 0.2, 'b', 1); P.box(M.kerb, 2.85, 2.92, 0.0, 0.05, s0 + 0.2, s1 - 0.2, 'b', 1);
    }
    // ---------------------------------------------------------------------- fountains, bench blocks, colliders
    for (const [s, q] of FOUNTAINS) {
      fountain(P, M, q, s);
    }
  } finally { P.pop(); }
  // n4spb (docs/AREAS.md 13.7, docs/vo-m3.md): a fountain basin is water to wade in, not a solid 3.1 m disc.  The granite rim (octagon, apothem 2.35 .. 2.8, 0.65 m) is a row of 8 breakable GHOST bays (the rim stays drawn, as the wing
  // walls of the Blagoveshchensky Bridge do), the basin is physics water (0.55 m, floor 0.3), the two-bowl stem in the middle (r up to 1.02 m, 3.0 m) is a solid monument; the two granite bench blocks are knock records.
  const blockSp = [], blockIt = [], rimBays = [], a0 = Math.PI / 8, ro = (ap) => ap / Math.cos(a0);
  for (const [s, q] of FOUNTAINS) {
    const c = bw(s, q); ph.addCylinder(c.x, c.z, 1.05, 0, 3.0);
    const rimR = ro(2.575), vs = Array.from({ length: 8 }, (_, i) => { const t = a0 + i * Math.PI / 4; return bw(s + Math.cos(t) * rimR, q + Math.sin(t) * rimR); });
    for (let i = 0; i < 8; i++) { const A = vs[i], B = vs[(i + 1) % 8]; rimBays.push({ x0: A.x, z0: A.z, x1: B.x, z1: B.z, y: 0, ghost: true }); }
    const inner = Array.from({ length: 8 }, (_, i) => { const t = a0 + i * Math.PI / 4, R = ro(2.35) * 0.97, p = bw(s + Math.cos(t) * R, q + Math.sin(t) * R); return [p.x, p.z]; });
    if (ph.addWater) ph.addWater({ ring: inner.flat(), level: 0.55 });
    for (const [dq, ds, rot] of [[4.4, -3.6, 0.5], [-4.2, 3.9, -2.6]]) { const b = bw(s + ds, q + dq); blockSp.push({ x: b.x, y: 0, z: b.z, rotY: FB.rot + rot }); blockIt.push(ph.addBox(b.x, b.z, 2.0, 0.56, FB.rot + rot, 0, 0.5)); }
  }
  knockBays(ctx, { name: 'lmAnd-fountain-rim', bays: rimBays, parts: [], collider: { y0: 0, y1: 0.65, thick: 0.55, e0: 0.1, e1: 0.1 }, far: 300,
    rec: () => ({ kind: 'fence', mass: 900, h: 0.65, r: 0.3, anchored: 14, hitK: 0.3, metal: false, minDv: 0 }) });
  K.extraTris += knockFurniture(ctx, 'lmAnd-fountain-blocks', partsGeos((Q) => Q.box(M.bollardGranite, -1.0, 1.0, 0, 0.45, -0.28, 0.28, 'b', 1)), blockSp, blockIt, { kind: 'stone', mass: 1200, h: 0.45, w: 2.0, d: 0.56, anchored: 30, hitK: 0.3 }, 200);
  K.svc.pavingTris = pave;

  // -------------------------------------------------------------------------- larches: two rows, q 4.6 and 12.7, every 7 m (staggered), clear of the cross paths and the plazas
  const trees = [], clearS = (s) => !CROSS.some((c) => Math.abs(s - c) < 2.2) && !FOUNTAINS.some(([f]) => Math.abs(s - f) < PR + 1.4);
  for (const [q, s00] of [[4.6, 79.0], [12.7, 82.5]]) for (let s = s00; s < STRIP.lawn1 - 3; s += 7) {
    if (!clearS(s)) continue;
    const p = bw(s + (rng() - 0.5) * 0.8, q + (rng() - 0.5) * 0.5);
    if (bad(p.x, p.z)) continue;
    trees.push({ x: p.x, z: p.z, fam: 'larch', s: 0.9 + rng() * 0.3, yaw: rng() * 6.28, y: 0.1 });
  }
  try { plantTrees(K, trees, 'lmAnd-larches'); K.svc.trees.push(...trees.map((t) => ({ x: t.x, z: t.z, fam: t.fam }))); } catch (e) { console.warn('[landmarksAndrew] larches:', e && e.message); }
  K.svc.larches = trees.length;

  // -------------------------------------------------------------------------- lamps (every 14 m on both lawn edges) and the rails along the outer kerb lines
  const lampG = partsGeos((Q) => lampCrook(Q, M)), lm = [], lmIt = [];
  for (const [q, s00, dir] of [[3.75, 76.0, Math.PI], [13.55, 83.0, 0]]) for (let s = s00; s < STRIP.lawn1 - 2; s += 14) {
    if (!clearS(s) || CROSS.some((c) => Math.abs(s - c) < 2.6) || FOUNTAINS.some(([f]) => Math.abs(s - f) < PR + 1.0)) continue;
    const p = bw(s, q); if (cover(p.x, p.z) > -1.0) continue;
    lm.push({ x: p.x, y: 0.1, z: p.z, rotY: FB.rot + dir }); lmIt.push(ph.addCylinder(p.x, p.z, 0.2, 0, 5.7)); K.svc.lamps.push({ x: p.x, z: p.z, h: 5.6 });
  }
  K.extraTris += knockFurniture(ctx, 'lmAnd-blv-lamps', lampG, lm, lmIt, FURNITURE_REC.lamp(5.6), 300);      // knock records (docs/AREAS.md 13.7)
  // the low black rails along the outer kerb lines: breakable bays of one 2.4 m texture tile with their round posts (docs/AREAS.md 13.7; the posts stay drawn after a bay broke)
  const postG = partsGeos((Q) => railPost(Q, M)), railBays = [];
  const railRun = (q, s0, s1) => {
    const a = bw(s0, q), b = bw(s1, q);
    railBays.push(...splitBays(a.x, a.z, b.x, b.z, 2.4, { y: 0.1 }));
    K.svc.fences.push({ pts: [[a.x, a.z], [b.x, b.z]], h: 0.85, kind: 'rail' });
  };
  for (const [s0, s1] of pieces) { railRun(STRIP.w1 + KERB + 0.1, s0 + 0.15, s1 - 0.15); railRun(STRIP.e0 - KERB - 0.1, s0 + 0.15, s1 - 0.15); }
  knockBays(ctx, { name: 'lmAnd-blv-rail', bays: railBays, far: 260,
    parts: [{ geo: unitPanel(0.06, 0.76, { u1: 1 }), mat: M.railBlv, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true },
      ...postG.list.map((q, k) => ({ geo: q.geo, mat: q.mat, name: 'post' + k, ats: (bay) => (bay.last ? ['start', 'end'] : ['start']) }))],
    collider: { y0: 0, y1: 0.85, thick: 0.12, e0: 0.05, e1: 0.05 },
    rec: () => ({ kind: 'fence', mass: 110, h: 0.85, anchored: 12, hitK: 0.2, metal: true, minDv: 0 }) });
  K.extraTris += postG.tris * (railBays.length + railBays.filter((b) => b.last).length) + railBays.length * 2;

  // -------------------------------------------------------------------------- people: photo spots and the places where tourists gather
  const spot = (x, z, yaw, name, pitch = 4) => { if (cover(x, z) < -0.6) K.svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-3817, -777, 30, 'Андреевский бульвар: вид от Большого проспекта вдоль оси', 6);
  { const q = FC.W(10, 38); spot(q.x, q.z, 3, 'Андреевский собор: южный фасад и пять глав', 24); }
  spot(-3844, -802, -73, 'Колокольня Андреевского собора с бульвара', 10);
  for (const [id, s, q, r] of [['blv-bolshoy', 450, 12, 14], ['blv-fountain-1', 176, 9, 8], ['blv-fountain-2', 329, 9, 8]]) { const p = bw(s, q); K.svc.crowd.push({ id, kind: 'photo', x: p.x, z: p.z, r, n: 8 }); }
  K.svc.stripAxis = { s0: STRIP.lawn0, s1: STRIP.lawn1, q: 8.45 };
}
