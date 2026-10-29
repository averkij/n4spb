// landmarksMenshikov/descent.js - the RUMYANTSEVSKY DESCENT (Румянцевский спуск): a 141 m cobbled apron below the Universitetskaya embankment, 18 m wide, behind a pink granite retaining wall that carries the cast-iron
// ring-and-meander railing on granite pylons; two ramps (west and east) bring the street down to it; two river-tram pontoons float off its river edge.  Dossier docs/research/menshikov.md section 5, photos refs/menshikov 103 109 110
// (103: the wall, its lower 0.4 m painted grey-blue, the railing, the fan-laid setts; 109: the apron, the pontoon with the green roof, the mooring dolphins).  OSM: wall w216655355 (A -> B 141.4 m), river edge c4 -> D 142.9 m,
// pedestrian setts way w125586508 (the spine), steps w942921897 / 98.  The pier relation r15853953 is NOT in the bake: the ring is APRON_RING (groups.js) and is handed to environment as WATER_RINGS (the ring becomes a water
// pit: no ground inside, the old quay line opens round it) - everything inside is drawn here:
//   FLOOR    sett-paved, y -1.2 (the street is 0) from a 10 to a 132, rising on ramps (1 : 11) to the street level at the two ends (a -4 and a 146); strips between the lower chain (C A B E D) and the river chain of the ring
//   WALL     A -> B: pink granite from the floor to the coping (y 0.16), the lower 0.45 m grey-blue, a projecting coping; the railing (two rows of rings, a meander on top) between granite pylons 0.55 m every 5.44 m
//   EDGE     the river chain: a pink skirt from the water (-3.4) to the floor and a granite curb 0.28 m (the walkers' barrier); two gaps for the gangways
//   PONTOONS the east one (a 121, the active tram stop: white float, a roofed cafe with a green roof, steel rails) and the west one (a 66, a float with a green-roofed shelter), gangways 1.6 m; 5 mooring dolphins
// Colliders: floor slices (walk boxes / ramps along a), the wall (solid, y -3.6 .. 1.4), the river curb (solid), pontoon decks and gangways, the cafe.  Frame DF (frame.js): a along the wall, b toward the river.
import * as THREE from 'three';
import * as L from '../layout.js';
import { DF } from './frame.js';
import { APRON_RING } from './groups.js';
import { tbox } from './geo.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { coverFn } from './surfaces.js';
import { knockBays, splitBays, unitPanel, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, docs/vo-m2.md): the railing, the river curb and the pontoon rails are rows of BREAKABLE bays
import { knockFurniture } from '../lib/knock-furniture.js';
import { addFloatBlock } from '../lib/craft-solids.js';      // n4spb: the two pontoons are solid for the motor boat (docs/water-transport-boat-collisions.md)
// n4spb: the retaining wall body (masonry, y -3.6 .. the coping) and the granite pylons stay solid structures; the railing on the coping, the curb along the river edge (it kept walkers off the water), and the rails of the two
// pontoons and their gangways are knock bays (the water is reachable: a car breaks a bay off at the foot, the gap is passable). The cafe on the east pontoon is a closed superstructure (a structure).

export const Y_FLOOR = -1.2, R_W = [-4, 10], R_E = [132, 146], Y_COPE = 0.16;
/** floor height under local a (frame D) */
export const floorY = (a) => (a <= R_W[0] ? 0 : a < R_W[1] ? Y_FLOOR * (a - R_W[0]) / (R_W[1] - R_W[0]) : a <= R_E[0] ? Y_FLOOR : a < R_E[1] ? Y_FLOOR * (R_E[1] - a) / (R_E[1] - R_E[0]) : 0);
const lerpChain = (ch, a) => { for (let i = 0; i + 1 < ch.length; i++) { const p = ch[i], q = ch[i + 1]; if (a >= p[0] - 1e-9 && a <= q[0] + 1e-9) return q[0] === p[0] ? p[1] : p[1] + (q[1] - p[1]) * (a - p[0]) / (q[0] - p[0]); } return a < ch[0][0] ? ch[0][1] : ch[ch.length - 1][1]; };

/** the two chains of the ring in frame D: lower (street side: C A B E D) and upper (river side: C c1 c2 c3 c4 D), both increasing in a */
export function chains() {
  const m = APRON_RING.map(([x, z]) => { const k = DF.M(x, z); return [k.a, k.b]; });
  // APRON_RING order: A B E D c4 c3 c2 c1 C
  const [A, B, E, D, c4, c3, c2, c1, C] = m;
  // the inner edge of the 2.7 .. 3.6 m border of granite flags along the river edge (OSM areas r12712436 sett / r12712437 paving_stones: the border is the second one)
  const inner = [[C[0], C[1]], [-14.9, 4.35], [-11.2, 8.0], [-6.4, 11.1], [-0.5, 13.8], [5.3, 15.2], [E[0], E[1]], [D[0], D[1]]];
  return { lower: [C, A, B, E, D], upper: [C, c1, c2, c3, c4, D], inner, pts: { A, B, E, D, c4, c3, c2, c1, C } };
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMenshikov] descent/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const { P, M, ctx } = K, ph = ctx.physics;
  const CH = chains(), cover = coverFn(ctx), WY = L.WATERWAYS && L.WATERWAYS.neva ? L.WATERWAYS.neva.water : -3.4;
  const S = K.descent = { CH, WY, gaps: [], pontoons: [] };
  const bl = (a) => lerpChain(CH.lower, a), bu = (a) => lerpChain(CH.upper, a);
  P.push(DF.x, 0, DF.z, DF.rot);
  try {
    stage('floor', () => floor(K, S, bl, bu));
    stage('wall', () => wall(K, S, cover));
    stage('edge', () => edge(K, S, bu));
    stage('pontoons', () => pontoons(K, S, bu));
    stage('dolphins', () => dolphins(K, S));
  } finally { P.pop(); }
  stage('physics', () => physics(K, S, bl, bu));
  stage('services', () => services(K, S, bu));
  if (errs.length) throw new Error(errs.join('\n'));
  void ph;
}

// ------------------------------------------------------------------------------------------------ floor
/** the strip breakpoints along a: the ring vertices, the ramp kinks and a regular grid */
function breaks(CH) {
  const set = new Set([R_W[0], R_W[1], R_E[0], R_E[1]]);
  for (const ch of [CH.lower, CH.upper, CH.inner]) for (const p of ch) set.add(+p[0].toFixed(3));
  const lo = CH.pts.C[0], hi = CH.pts.D[0];
  for (let a = Math.ceil(lo / 4) * 4; a < hi; a += 4) set.add(a);
  return [...set].filter((a) => a >= lo - 1e-6 && a <= hi + 1e-6).sort((x, y) => x - y);
}
function floor(K, S, bl, bu) {
  const { P, M } = K, bk = breaks(S.CH), T = 2.8;
  for (let i = 0; i + 1 < bk.length; i++) {
    const a0 = bk[i], a1 = bk[i + 1]; if (a1 - a0 < 0.01) continue;
    const l0 = bl(a0), l1 = bl(a1), u0 = bu(a0), u1 = bu(a1), y0 = floorY(a0), y1 = floorY(a1);
    if (Math.max(u0 - l0, u1 - l1) < 0.02) continue;
    const i0 = Math.max(l0, Math.min(u0, lerpChain(S.CH.inner, a0))), i1 = Math.max(l1, Math.min(u1, lerpChain(S.CH.inner, a1)));
    if (Math.max(i0 - l0, i1 - l1) > 0.02) P.quad(M.setts, [a0, y0, l0], [a0, y0, i0], [a1, y1, i1], [a1, y1, l1], [0, 1, 0], [[a0 / T, l0 / T], [a0 / T, i0 / T], [a1 / T, i1 / T], [a1 / T, l1 / T]]);
    if (Math.max(u0 - i0, u1 - i1) > 0.02) P.quad(M.paving, [a0, y0, i0], [a0, y0, u0], [a1, y1, u1], [a1, y1, i1], [0, 1, 0], [[a0 / 2, i0 / 2], [a0 / 2, u0 / 2], [a1 / 2, u1 / 2], [a1 / 2, i1 / 2]]);
  }
}

// ------------------------------------------------------------------------------------------------ the retaining wall A -> B, the coping, the pylons, the railing
function wall(K, S, cover) {
  const { P, M, ctx } = K, ph = ctx.physics, { A, B, E } = S.CH.pts;
  const aA = A[0], aB = B[0], len = aB - aA;
  // face (b = 0, facing +b): pink granite from the floor up to y 0, the lower 0.45 m painted grey-blue; quads per 4 m so that the sloped bottom follows the ramps
  const steps = Math.ceil(len / 4);
  for (let i = 0; i < steps; i++) {
    const a0 = aA + len * i / steps, a1 = aA + len * (i + 1) / steps, y0 = floorY(a0), y1 = floorY(a1), h0 = -y0, h1 = -y1;
    if (h0 < 0.02 && h1 < 0.02) continue;
    const nb = Math.max(0, Math.min(0.45, Math.min(h0, h1)));
    // painted band (grey-blue) and the granite above it
    P.quad(M.wallPaint, [a0, y0, 0], [a1, y1, 0], [a1, y1 + Math.min(0.45, h1), 0], [a0, y0 + Math.min(0.45, h0), 0], [0, 0, 1], [[a0 / 2.4, y0 / 1.2], [a1 / 2.4, y1 / 1.2], [a1 / 2.4, (y1 + 0.45) / 1.2], [a0 / 2.4, (y0 + 0.45) / 1.2]]);
    if (h0 > 0.46 || h1 > 0.46) P.quad(M.wallPink, [a0, y0 + Math.min(0.45, h0), 0], [a1, y1 + Math.min(0.45, h1), 0], [a1, 0, 0], [a0, 0, 0], [0, 0, 1], [[a0 / 2.4, (y0 + 0.45) / 1.2], [a1 / 2.4, (y1 + 0.45) / 1.2], [a1 / 2.4, 0], [a0 / 2.4, 0]]);
    void nb;
  }
  // the coping: a projecting granite slab 0.7 m wide (b -0.58 .. +0.12), top y 0.16; a lighter pink
  P.box(M.wallPinkTop, aA, aB, 0.0, Y_COPE, -0.6, 0.12, 'b', 2.4);
  // the east diagonal B -> E (the ramp's flank): a low retaining face down to the floor
  {
    const dx = E[0] - B[0], dz = E[1] - B[1], l = Math.hypot(dx, dz), ex = dx / l, ez = dz / l;
    const n = Math.ceil(l / 3);
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, a0 = B[0] + dx * t0, b0 = B[1] + dz * t0, a1 = B[0] + dx * t1, b1 = B[1] + dz * t1, y0 = floorY(a0), y1 = floorY(a1);
      if (-y0 < 0.02 && -y1 < 0.02) continue;
      P.quad(M.wallPink, [a0, y0, b0], [a1, y1, b1], [a1, 0, b1], [a0, 0, b0], [-ez, 0, ex], [[a0 / 2.4, y0 / 1.2], [a1 / 2.4, y1 / 1.2], [a1 / 2.4, 0], [a0 / 2.4, 0]]);
    }
    P.push(B[0], 0, B[1], Math.atan2(-dz, dx)); P.box(M.wallPinkTop, 0, l, 0.0, 0.1, -0.35, 0.1, 'b', 2.4); P.pop();
  }
  // the pylons (every 5.44 m, 0.55 m square, 1.25 m high, a stepped base, a flat chamfered top) and the railing panels between them
  const n = Math.round(len / 5.44), pitch = len / n, pylons = [], bays = [];      // (pitch: the bay length)
  const bad = (a) => { const w = DF.W(a, -0.3); return cover(w.x, w.z) > -0.5; };
  for (let k = 0; k <= n; k++) pylons.push({ a: aA + k * pitch, ok: !bad(aA + k * pitch) });
  for (let k = 0; k < n; k++) { const a0 = pylons[k].a, a1 = pylons[k + 1].a; bays.push({ a0, a1, ok: pylons[k].ok && pylons[k + 1].ok && !bad((a0 + a1) / 2) && !bad(a0 + (a1 - a0) * 0.25) && !bad(a0 + (a1 - a0) * 0.75) }); }
  const geo = partsGeos((Q) => {
    Q.box(M.pylon, -0.36, 0.36, 0, 0.28, -0.36, 0.36, 'b', 1.6);
    Q.box(M.pylon, -0.3, 0.3, 0.28, 0.34, -0.3, 0.3, 'b', 1.6);
    Q.box(M.pylon, -0.275, 0.275, 0.34, 1.12, -0.275, 0.275, 'b', 1.6);
    Q.box(M.pylon, -0.3, 0.3, 1.12, 1.2, -0.3, 0.3, 'b', 1.6);
    Q.quad(M.pylon, [-0.3, 1.2, -0.3], [0.3, 1.2, -0.3], [0.2, 1.27, -0.2], [-0.2, 1.27, -0.2], [0, 0.4, -1]); Q.quad(M.pylon, [0.3, 1.2, 0.3], [-0.3, 1.2, 0.3], [-0.2, 1.27, 0.2], [0.2, 1.27, 0.2], [0, 0.4, 1]);
    Q.quad(M.pylon, [0.3, 1.2, -0.3], [0.3, 1.2, 0.3], [0.2, 1.27, 0.2], [0.2, 1.27, -0.2], [1, 0.4, 0]); Q.quad(M.pylon, [-0.3, 1.2, 0.3], [-0.3, 1.2, -0.3], [-0.2, 1.27, -0.2], [-0.2, 1.27, 0.2], [-1, 0.4, 0]);
    Q.box(M.pylon, -0.2, 0.2, 1.27, 1.29, -0.2, 0.2, 'b', 1.6);
  });
  const rotY = DF.rot;
  // n4spb (the owner's rule: every post at the water breaks): the granite pylons are knock records (bollard-like: the same geometry, one thin box each, removed at the knock); the colliders are made here
  const pySpots = [], pyItems = [];
  for (const p of pylons) if (p.ok) { const w = DF.W(p.a, -0.3); pySpots.push({ x: w.x, y: Y_COPE, z: w.z, rotY }); pyItems.push(ph.addBox(w.x, w.z, 0.6, 0.6, DF.rot, Y_COPE, 1.3)); }
  K.extraTris += knockFurniture(ctx, 'lmmensh-pylons', geo, pySpots, pyItems, { kind: 'bollard', mass: 900, h: 1.27, r: 0.34, anchored: 30, hitK: 0.5 }, 320);
  // railing panels: u over 5.5 m, v over 0.9 m (A.rings), alpha cut-out, double sided; the rail stands 0.12 above the coping
  let kept = 0;
  const rb = [];
  for (const b of bays) {
    const p0 = DF.W(b.a0, -0.3), p1 = DF.W(b.a1, -0.3);
    rb.push({ x0: p0.x, z0: p0.z, x1: p1.x, z1: p1.z, y: Y_COPE, ghost: !b.ok, pitch: b.a1 - b.a0 });
    if (b.ok) kept++;
  }
  S.bays = { n, kept };
  // the panel (the ring-and-meander ironwork: u over 5.5 m, v over 0.9 m, alpha cut-out, double sided) between two pylons, 0.25 m in from each; the rail stands 0.1 above the coping; the bottom bar under it
  knockBays(ctx, { name: 'lmmensh-descent-rail', bays: rb, far: 320,
    parts: [{ geo: unitPanel(0.1, 1.02, { u1: (pitch - 0.5) / 5.5 }), mat: M.rings, name: 'panel', stretch: true, inset: 0.25, shadow: false, receive: false, noOutline: true },
      { geo: unitBox(0.04, 0.12, -0.04, 0.04, { uLen: pitch, uvs: 1 }), mat: M.fenceIron, name: 'bar', stretch: true, inset: 0.25, shadow: false, receive: false }],
    collider: { y0: Y_COPE, y1: 1.4, thick: 0.5, e0: 0, e1: 0 },
    rec: () => ({ kind: 'fence', mass: 900, h: 1.1, anchored: 26, hitK: 0.6, metal: true, minDv: 0 }) });
  K.extraTris += kept * 14;
  // collider: the wall body (masonry, from the bed to the coping; the railing above it is the bays)
  const c = DF.W(aA + len / 2, -0.25); ph.addBox(c.x, c.z, len + 0.2, 0.9, DF.rot, -3.6, Y_COPE);
}

// ------------------------------------------------------------------------------------------------ the river edge: the skirt down to the water, the curb
function edge(K, S, bu) {
  const { P, M, ctx } = K, ph = ctx.physics, up = S.CH.upper, WY = S.WY, cb = [];
  // gaps for the gangways (frame D a): the east pontoon at a 121, the west one at a 66
  S.gaps = [[119.9, 122.1], [64.9, 67.1]];
  const inGap = (a) => S.gaps.some(([g0, g1]) => a > g0 - 1e-6 && a < g1 + 1e-6);
  for (let i = 0; i + 1 < up.length; i++) {
    const p = up[i], q = up[i + 1];
    // split the segment at the gap borders
    const cuts = [0, 1], aset = [R_W[0], R_W[1], R_E[0], R_E[1]];
    for (const [g0, g1] of S.gaps) aset.push(g0, g1);
    for (let a = Math.ceil(Math.min(p[0], q[0])); a < Math.max(p[0], q[0]); a += 1) if ((a > R_W[0] - 1 && a < R_W[1] + 1) || (a > R_E[0] - 1 && a < R_E[1] + 1) ? a % 2 === 0 : a % 15 === 0) aset.push(a);
    for (const g of aset) { const t = (g - p[0]) / (q[0] - p[0]); if (t > 1e-4 && t < 1 - 1e-4) cuts.push(t); }
    cuts.sort((x, y) => x - y);
    for (let j = 0; j + 1 < cuts.length; j++) {
      const t0 = cuts[j], t1 = cuts[j + 1];
      const a0 = p[0] + (q[0] - p[0]) * t0, b0 = p[1] + (q[1] - p[1]) * t0, a1 = p[0] + (q[0] - p[0]) * t1, b1 = p[1] + (q[1] - p[1]) * t1;
      if (Math.hypot(a1 - a0, b1 - b0) < 0.05) continue;
      const am = (a0 + a1) / 2, gap = inGap(am);
      const dx = a1 - a0, dz = b1 - b0, l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l;      // the outward normal (toward the river: +b)
      const ny = nz < 0 ? -1 : 1, nxx = ny * nx, nzz = ny * nz;                                  // make it point to +b
      const y0 = floorY(a0), y1 = floorY(a1);
      // the skirt: from below the water to the floor edge
      P.quad(M.wallPink, [a0, WY - 0.3, b0], [a1, WY - 0.3, b1], [a1, y1, b1], [a0, y0, b0], [nxx, 0, nzz], [[0, 0], [l / 2.4, 0], [l / 2.4, (y1 - WY + 0.3) / 1.2], [0, (y0 - WY + 0.3) / 1.2]]);
      if (gap) continue;
      // the curb on the floor edge: 0.45 wide, 0.28 high (a light granite): a row of bays of about 3 m that follow the slope of the floor (the ramps are shallow, 1:11)
      const nb = Math.max(1, Math.round(l / 3));
      for (let k = 0; k < nb; k++) {
        const u0 = k / nb, u1 = (k + 1) / nb, aa0 = a0 + (a1 - a0) * u0, bb0 = b0 + (b1 - b0) * u0, aa1 = a0 + (a1 - a0) * u1, bb1 = b0 + (b1 - b0) * u1, w0 = DF.W(aa0, bb0), w1 = DF.W(aa1, bb1);
        cb.push({ x0: w0.x, z0: w0.z, x1: w1.x, z1: w1.z, y: floorY(aa0), ye: floorY(aa1) });
      }
    }
  }
  if (cb.length) {
    knockBays(ctx, { name: 'lmmensh-descent-curb', bays: cb, far: 300,
      parts: [{ geo: unitBox(-0.1, 0.28, -0.45, 0.06, { uLen: 3, uvs: 2.2 }), mat: M.graniteLight, name: 'curb', stretch: true }],
      collider: (bay) => ({ y0: Math.min(bay.y, bay.ye) - 0.3, y1: Math.max(bay.y, bay.ye) + 1.4, thick: 0.6, off: -0.2, e0: 0.05, e1: 0.05 }),
      rec: () => ({ kind: 'fence', mass: 1200, h: 0.4, anchored: 28, hitK: 0.6, minDv: 0 }) });
    K.extraTris += cb.length * 10;
  }
}

// ------------------------------------------------------------------------------------------------ pontoons and gangways
/** a row of steel-rail bays (a post at each start and at the end of a run, a top rail at 1.0 m and a mid rail at 0.5 m stretched over the bay): the shared draw of the pontoon rails and the gangway rails */
let _railGeos = null;
function railBays(K, name, bays, collider) {
  if (!bays.length) return;
  if (!_railGeos) {
    const post = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 5, 1, false); post.translate(0, 0.5, 0);
    const rail = (r) => { const g = new THREE.CylinderGeometry(r, r, 1, 4, 1, false); g.rotateZ(Math.PI / 2); g.translate(0.5, 0, 0); return g; };
    _railGeos = { post, top: rail(0.02), mid: rail(0.015) };
  }
  const G = _railGeos, mat = K.M.steelRail;
  knockBays(K.ctx, { name, bays, far: 280,
    parts: [{ geo: G.post, mat, name: 'post', ats: (bay) => (bay.last ? ['start', 'end'] : ['start']), shadow: false, receive: false },
      { geo: G.top, mat, name: 'top', stretch: true, y: 1.0, shadow: false, receive: false }, { geo: G.mid, mat, name: 'mid', stretch: true, y: 0.5, shadow: false, receive: false }],
    collider, rec: () => ({ kind: 'fence', mass: 80, h: 1.0, anchored: 12, hitK: 0.3, metal: true, minDv: 0 }) });
  K.extraTris += bays.length * (10 + 8 + 8) + 10;
}

/** a river-tram pontoon: the float (white, 0.6 m above the water), a plank deck, steel rails, a gangway to the apron; o: { a, bIn (the inner edge), len, dep, cafe, shelter } */
function pontoon(K, S, o) {
  const { P, M, ctx } = K, ph = ctx.physics, WY = S.WY, yD = WY + 0.62, a0 = o.a - o.len / 2, a1 = o.a + o.len / 2, b0 = o.bIn, b1 = o.bIn + o.dep;
  // float: hull sides, the deck
  P.box(M.pontoon, a0, a1, WY - 0.4, yD - 0.06, b0, b1, '', 2.5);
  P.box(M.deck, a0 - 0.05, a1 + 0.05, yD - 0.06, yD, b0 - 0.05, b1 + 0.05, 'b', 2);
  P.box(M.pile, a0 - 0.08, a1 + 0.08, yD - 0.14, yD - 0.06, b0 - 0.08, b1 + 0.08, 'b', 2);                // a fender rail round the deck edge
  // steel rails on the river sides and the ends (1.0 m, posts every 2 m, two rails), open at the gangway
  // n4spb: the rails are rows of breakable bays of about 2 m (a post at each start and at the end of the run, the two steel rails stretched over the bay, one thin collider + one knock record per bay)
  const rb = [], edgeRun = (p0, p1) => { const w0 = DF.W(p0[0], p0[1]), w1 = DF.W(p1[0], p1[1]); rb.push(...splitBays(w0.x, w0.z, w1.x, w1.z, 2, { y: yD })); };
  edgeRun([a0 + 0.1, b1 - 0.1], [a1 - 0.1, b1 - 0.1]);
  edgeRun([a0 + 0.1, b0 + 0.1], [a0 + 0.1, b1 - 0.1]); edgeRun([a1 - 0.1, b0 + 0.1], [a1 - 0.1, b1 - 0.1]);
  edgeRun([a0 + 0.1, b0 + 0.1], [o.a - 1.2, b0 + 0.1]); edgeRun([o.a + 1.2, b0 + 0.1], [a1 - 0.1, b0 + 0.1]);
  railBays(K, 'lmmensh-pontoon-rail-' + o.id, rb, (bay) => ({ y0: bay.y - 0.5, y1: bay.y + 1.2, thick: 0.12, e0: 0, e1: 0 }));
  if (o.cafe) {
    // a closed cafe superstructure 11 x 2.9, 2.5 m high: white walls with a glazing band, the green roof overhanging 0.35
    const ca0 = o.a - 5.6, ca1 = o.a + 5.6, cb0 = b0 + 1.05, cb1 = cb0 + 2.9, wy = yD + 0.05, wh = 2.5;
    P.box(M.pontoon, ca0, ca1, wy, wy + wh, cb0, cb1, 'b', 2.5);
    for (const [z, nz] of [[cb0 - 0.01, -1], [cb1 + 0.01, 1]]) P.quad(M.canopyGlass, [ca0 + 0.5, wy + 0.8, z], [ca1 - 0.5, wy + 0.8, z], [ca1 - 0.5, wy + 2.1, z], [ca0 + 0.5, wy + 2.1, z], [0, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (let i = 0; i <= 10; i++) { const a = ca0 + 0.5 + i * (ca1 - ca0 - 1) / 10; for (const z of [cb0, cb1]) P.box(M.pontoon, a - 0.04, a + 0.04, wy + 0.78, wy + 2.12, z - (z === cb0 ? 0.03 : 0), z + (z === cb1 ? 0.03 : 0), ''); }
    P.box(M.pontoonRoof, ca0 - 0.35, ca1 + 0.35, wy + wh, wy + wh + 0.18, cb0 - 0.35, cb1 + 0.35, '', 2);
    P.box(M.pontoon, ca0 - 0.2, ca1 + 0.2, wy + wh + 0.18, wy + wh + 0.3, cb0 - 0.1, cb1 + 0.1, 'b', 2);
    const c = DF.W(o.a, (cb0 + cb1) / 2); ph.addBox(c.x, c.z, ca1 - ca0 + 0.2, cb1 - cb0 + 0.2, DF.rot, yD - 0.1, yD + 3.2);
  }
  if (o.shelter) {
    // an open shelter 6 x 2.4: four posts and a green roof, a bench along the back
    const sa0 = o.a - 3.2, sa1 = o.a + 3.2, sb0 = b0 + 0.9, sb1 = sb0 + 2.4;
    for (const a of [sa0, sa1]) for (const b of [sb0, sb1]) P.cyl(M.steelRail, [a, yD, b], [a, yD + 2.5, b], 0.05, 0.05, 6, false);
    P.box(M.pontoonRoof, sa0 - 0.3, sa1 + 0.3, yD + 2.5, yD + 2.66, sb0 - 0.3, sb1 + 0.3, '', 2);
    P.box(M.deck, sa0 + 0.3, sa1 - 0.3, yD + 0.42, yD + 0.48, sb1 - 0.5, sb1 - 0.1, '', 1); P.box(M.steelRail, sa0 + 0.3, sa1 - 0.3, yD + 0.48, yD + 1.0, sb1 - 0.12, sb1 - 0.1, 'b', 1);
  }
  // the gangway: from the curb gap (floor edge) down to the deck, 1.6 m wide, planks with two handrails
  const bE = S.upperAt(o.a) - 0.45, yE = floorY(o.a), len = b0 - bE, gw = 1.6;
  P.quad(M.deck, [o.a - gw / 2, yE, bE], [o.a + gw / 2, yE, bE], [o.a + gw / 2, yD, b0], [o.a - gw / 2, yD, b0], [0, 1, 0], [[0, 0], [gw / 2, 0], [gw / 2, len / 2], [0, len / 2]]);
  P.quad(M.deck, [o.a - gw / 2, yE - 0.1, bE], [o.a - gw / 2, yD - 0.1, b0], [o.a + gw / 2, yD - 0.1, b0], [o.a + gw / 2, yE - 0.1, bE], [0, -1, 0]);
  const gb = [];
  for (const s of [-1, 1]) {
    const x = o.a + s * (gw / 2 - 0.05), nb = 4;
    for (let k = 0; k < nb; k++) { const w0 = DF.W(x, bE + len * k / nb), w1 = DF.W(x, bE + len * (k + 1) / nb); gb.push({ x0: w0.x, z0: w0.z, x1: w1.x, z1: w1.z, y: yE + (yD - yE) * k / nb, ye: yE + (yD - yE) * (k + 1) / nb, first: k === 0, last: k === nb - 1 }); }
    P.box(M.steelRail, x - 0.04, x + 0.04, yE, yE + 1.06, bE - 0.04, bE + 0.04, 'b', 1);
  }
  railBays(K, 'lmmensh-gangway-rail-' + o.id, gb, (bay) => ({ y0: Math.min(bay.y, bay.ye) - 0.3, y1: Math.max(bay.y, bay.ye) + 1.1, thick: 0.08, e0: 0.05, e1: 0.05 }));
  // physics: the deck (a walk box), the gangway (a ramp along b), the float edge below the deck is solid water-side
  const c = DF.W(o.a, (b0 + b1) / 2); ph.addWalkBox(c.x, c.z, o.len, o.dep, DF.rot, yD);
  addFloatBlock(ph, c.x, c.z, o.len + 0.04, o.dep + 0.4, DF.rot, WY);      // n4spb (docs/water-transport-boat-collisions.md): the pontoon is solid for the motor boat (a walker's deck is not touched)
  const g = DF.W(o.a, (bE + b0) / 2); ph.addWalkRamp(g.x, g.z, gw, len + 0.2, DF.rot, yE, yD, 0.6);
  // (the gangway rails and the deck-edge rails: the knock bays above; they were thin solid walls)
  const ep = DF.W(o.a, b0 + 0.8); K.svc.entrances.push({ id: o.id, x: ep.x, z: ep.z, rotY: DF.rot, open: true, name: o.name });
  S.pontoons.push({ id: o.id, a: o.a, b0, b1, y: yD });
}

function pontoons(K, S, bu) {
  S.upperAt = bu;
  pontoon(K, S, { id: 'rumyantsev-pontoon-east', name: 'Румянцевский спуск: плавучая пристань речного трамвая', a: 121, bIn: 26.5, len: 20, dep: 5.2, cafe: true });
  pontoon(K, S, { id: 'rumyantsev-pontoon-west', name: 'Румянцевский спуск: западная пристань', a: 66, bIn: 25.5, len: 13, dep: 4.2, shelter: true });
}

// ------------------------------------------------------------------------------------------------ mooring dolphins (timber piles with white and brown bands) off the apron
function dolphins(K, S) {
  const { ctx, M } = K, WY = S.WY, ms = [];
  const geo = partsGeos((Q) => {
    for (const [x, z] of [[0, 0.22], [-0.2, -0.14], [0.2, -0.14]]) {
      Q.cyl(M.pile, [x, WY - 1.2, z], [x, WY + 3.0, z], 0.19, 0.17, 7, true);
      Q.cyl(M.pileBand, [x, WY + 2.35, z], [x, WY + 2.95, z], 0.2, 0.2, 7, false);
      Q.cyl(M.pileBand, [x, WY + 0.6, z], [x, WY + 1.0, z], 0.2, 0.2, 7, false);
    }
    Q.cyl(M.steelRail, [-0.3, WY + 2.1, -0.1], [0.3, WY + 2.1, 0.0], 0.03, 0.03, 4, false);
    Q.cyl(M.steelRail, [-0.2, WY + 2.1, -0.14], [0.0, WY + 2.1, 0.22], 0.03, 0.03, 4, false); Q.cyl(M.steelRail, [0.2, WY + 2.1, -0.14], [0.0, WY + 2.1, 0.22], 0.03, 0.03, 4, false);
  });
  for (const [a, b] of [[28, 38], [48, 40], [93, 35], [141, 36], [160, 33]]) { const w = DF.W(a, b); ms.push(mat4(w.x, 0, w.z, 0)); S.dolphins = (S.dolphins || 0) + 1; }
  K.extraTris += addInstanced(ctx, K.root, 'lmmensh-dolphins', geo, ms).tris;
}

// ------------------------------------------------------------------------------------------------ colliders of the floor
function physics(K, S, bl, bu) {
  const ph = K.ctx.physics, CH = S.CH, lo = CH.pts.C[0], hi = CH.pts.D[0];
  // floor slices along a: a rectangle per slice between the lower chain (0.3 m beyond it: the wall / street side is solid or higher ground) and 0.5 m inside the river chain (the curb stands there);
  // flat slices are walk boxes, the ramp slices (frame a -4 .. 10 and 132 .. 146) are walk ramps; the ends are cut every 2 m, the flat interior every 20 m
  const slice = (a0, a1) => {
    const l = Math.min(bl(a0), bl(a1)) - 0.3, h = Math.min(bu(a0), bu(a1)) - 0.5;
    if (h - l < 0.3) return;
    const c = DF.W((a0 + a1) / 2, (l + h) / 2), y0 = floorY(a0), y1 = floorY(a1);
    if (Math.abs(y1 - y0) < 1e-4) ph.addWalkBox(c.x, c.z, a1 - a0, h - l, DF.rot, y0);
    else ph.addWalkRamp(c.x, c.z, h - l, a1 - a0, DF.rot + Math.PI / 2, y0, y1, 0.6);
    S.slices = (S.slices || 0) + 1;
  };
  const run = (a0, a1, step) => { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) slice(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n); };
  run(lo, R_W[0], 2); run(R_W[0], R_W[1], 2); run(R_W[1], R_E[0], 20); run(R_E[0], R_E[1], 2); run(R_E[1], hi, 1.5);
}

function services(K, S, bu) {
  const w = (a, b) => DF.W(a, b);
  const spot = (a, b, ta, tb, ty, name, pitch = 6) => { const p = w(a, b), t = w(ta, tb); K.svc.photoSpots.push({ x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, t.x, t.z), pitch, name }); };
  spot(112, 12, 40, -22, 0, 'Румянцевский спуск: набережная и дворец Меншикова с причала', 8);
  spot(20, 9, 135, 9, 0, 'Румянцевский спуск: вдоль булыжной площадки', 4);
  const a = w(121, 12), b = w(66, 12), c = w(70, 9);
  K.svc.crowd.push({ id: 'apron-east-pontoon', kind: 'pier', x: a.x, z: a.z, r: 7, n: 5 }, { id: 'apron-west-pontoon', kind: 'pier', x: b.x, z: b.z, r: 5, n: 3 }, { id: 'apron-walk', kind: 'stroll', x: c.x, z: c.z, r: 10, n: 4 });
  const runs = []; const wp = S.CH.pts; const A = w(wp.A[0], -0.3), B = w(wp.B[0], -0.3); runs.push([[A.x, A.z], [B.x, B.z]]);
  K.svc.fences.push({ id: 'w216655355', kind: 'iron', h: 1.45, runs, gates: [], tag: 'apron-railing' });
  K.svc.descent = { ring: APRON_RING, floorY: Y_FLOOR, ramps: { west: R_W, east: R_E }, pontoons: S.pontoons, dolphins: S.dolphins || 0, railingBays: S.bays, slices: S.slices || 0 };
  void bu;
}
