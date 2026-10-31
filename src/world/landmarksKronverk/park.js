// landmarksKronverk/park.js - the sights of ALEXANDER PARK and of the Kronverk bank (dossier docs/research/kronverk.md sections 4-5; photos refs/kronverk 37 41 43 46 49 72 74 84 87 89 94):
//   * the Decembrists obelisk (1975, pink granite, bronze medallion, inscription) on its grass mound;
//   * the East and West Artillery bridges over the mouths of the moat: granite-faced vault under the OSM deck polygon, solid block parapets, cone slopes; the roadway itself is drawn by `streets`
//     (the deck top lies 1.2 cm over the ground, under the asphalt); walk decks + parapet colliders;
//   * the Steregushchy monument (1911): granite terrace with two flights of steps, the rock, the bronze cross with the two sailors at the seacock, two granite lantern pillars, posts, boulders;
//   * the grotto with its round pool, the bronze mini-city on pink granite plinths, the "Architects" (eight bronze figures round a table), the seated apostle Peter;
//   * the Orthopaedic Institute (R. Meltzer 1902-06): pale brick house with the domed tower and the majolica Madonna panel, its brick chimney.
// Benches and lamps of the park are NOT drawn here: `props` draws the OSM benches, `streets` the OSM lamps (no doubles).
import * as THREE from 'three';
import * as L from '../layout.js';
import { BRIDGES, MONUMENTS, WATER } from '../data/city.js';
import { addPolyColliders } from '../lib/massing.js';
import * as G from './geo.js';
import { byId, pairs, dist, centroid, rotOf, rotOut, inRing } from './frame.js';
import { walls, house } from './house.js';
import { human, cached, extend, figureMats } from '../lib/figures.js';

const SIT = (extra = {}) => ({ pelvis: [0, 0.5, -0.06], pelvisRot: [0.05, 0, 0], legs: { L: { foot: [0.12, 0, 0.36], yaw: 0.2, pole: [0, 0.2, 1] }, R: { foot: [-0.13, 0, 0.34], yaw: -0.25, pole: [0, 0.2, 1] } }, ...extra });
const STAND = (extra = {}) => ({ pelvis: [0, 0.95, 0], legs: { L: { foot: [0.12, 0, 0.05], pole: [0, 0, 1] }, R: { foot: [-0.12, 0, -0.04], pole: [0, 0, 1] } }, ...extra });
const COAT = { torso: 'coat', hem: 0.5, flare: 0.2, sleeves: 'long', trousers: 'breeches', boots: 0.4, collar: 'stand', buttons: true };

export function build(K) {
  const errs = [];
  for (const [name, fn] of [['obelisk', obelisk], ['bridges', bridges], ['steregushchy', steregushchy], ['grotto', grotto], ['minicity', miniCity], ['architects', architects], ['peter', apostle], ['institute', institute]]) {
    try { fn(K); } catch (e) { console.error(`[landmarksKronverk] park/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); }
  }
  if (errs.length) throw new Error(errs.join('\n'));
}

// ================================================================== the Decembrists obelisk
function obelisk(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const o = MONUMENTS.find((m) => m.id === 'n1579387418') || { x: -1853.3, z: -2342.9 }, d = [0.05, 0.9987], rot = rotOut(d[0], d[1]), y0 = 1.0;
  P.push(o.x, 0, o.z, rot);
  // the mound
  P.cyl(M.lawnSlope, [0, 0, 0], [0, y0, 0], 7.5, 3.4, 18, false); P.cyl(M.lawnSlope, [0, y0 - 0.01, 0], [0, y0, 0], 3.4, 3.4, 18, true);
  P.box(M.granitePink, -1.5, 1.5, y0, y0 + 0.28, -1.5, 1.5, 'b', 2);
  P.box(M.granitePink, -0.98, 0.98, y0 + 0.28, y0 + 3.1, -0.98, 0.98, 'b', 2);
  P.box(M.granitePinkFlat, -1.04, 1.04, y0 + 3.1, y0 + 3.3, -1.04, 1.04, '', 2);
  G.frustum(P, M.granitePink, 0, 0, y0 + 3.3, y0 + 3.6, 4, 0.98 * Math.SQRT2, 0.74 * Math.SQRT2, Math.PI / 4, 1, 0.15);
  P.box(M.granitePinkFlat, -0.86, 0.86, y0 + 3.6, y0 + 3.78, -0.86, 0.86, '', 2);
  G.frustum(P, M.granitePink, 0, 0, y0 + 3.78, y0 + 8.3, 4, 0.76 * Math.SQRT2, 0.4 * Math.SQRT2, Math.PI / 4, 0.7, 2.2);
  G.frustum(P, M.granitePink, 0, 0, y0 + 8.3, y0 + 8.95, 4, 0.4 * Math.SQRT2, 0, Math.PI / 4, 0.3, 0.3);
  // bronze medallion with the five profiles (a disc with a raised rim and five overlapped ovals) and the cut inscription
  const disc = (mat, r, z, n) => P.fan(mat, Array.from({ length: n }, (_, i) => [Math.sin(i / n * 6.2832) * r, y0 + 2.25 + Math.cos(i / n * 6.2832) * r, z]), [0, 0, 1]);
  P.cyl(M.bronze, [0, y0 + 2.25, 0.975], [0, y0 + 2.25, 1.04], 0.47, 0.47, 18, false); disc(M.bronze, 0.47, 1.04, 18); disc(M.bronzeLit, 0.4, 1.052, 16);
  for (let i = 0; i < 5; i++) { const px = -0.2 + i * 0.1, zf = 1.075 + i * 0.006; P.cyl(M.bronze, [px, y0 + 2.25, 1.045], [px, y0 + 2.25, zf], 0.17, 0.15, 8, false); P.fan(M.bronze, Array.from({ length: 8 }, (_, k) => [px + Math.sin(k / 8 * 6.2832) * 0.15, y0 + 2.25 + Math.cos(k / 8 * 6.2832) * 0.15, zf]), [0, 0, 1]); }
  const ins = M.sign('decembrists', 512, 512, ['НА ЭТОМ МЕСТЕ', '13/25 ИЮЛЯ 1826 ГОДА', 'БЫЛИ КАЗНЕНЫ', 'ДЕКАБРИСТЫ', 'П. ПЕСТЕЛЬ', 'К. РЫЛЕЕВ', 'П. КАХОВСКИЙ', 'С. МУРАВЬЕВ-АПОСТОЛ', 'М. БЕСТУЖЕВ-РЮМИН'], { bg: '#b9a7a0', fg: '#5c4a44', font: M.FONT.sans, weight: 600, pad: 0.4 });
  P.quad(ins, [-0.62, y0 + 0.45, 0.985], [0.62, y0 + 0.45, 0.985], [0.62, y0 + 1.7, 0.985], [-0.62, y0 + 1.7, 0.985], [0, 0, 1]);
  // the granite slab with the forged sword, epaulettes and broken chains before the mound
  P.box(M.granitePolish, -1.0, 1.0, 0, 0.42, 7.6, 8.9, 'b', 2);
  P.box(M.iron, -0.7, 0.75, 0.42, 0.47, 8.2, 8.27, '', 1); P.box(M.iron, -0.5, -0.42, 0.42, 0.5, 8.05, 8.42, '', 1);
  for (const [x, z] of [[0.3, 7.95], [0.55, 8.6]]) P.cyl(M.iron, [x, 0.42, z], [x, 0.5, z], 0.16, 0.14, 8, true);
  for (let i = 0; i < 7; i++) P.cyl(M.iron, [-0.8 + i * 0.13, 0.44, 8.62 + (i % 2) * 0.05], [-0.8 + i * 0.13, 0.5, 8.62 + (i % 2) * 0.05], 0.06, 0.06, 6, true);
  P.pop();
  ph.addCylinder(o.x, o.z, 3.3, 0, 10.5); ph.addBox(o.x + d[0] * 8.25, o.z + d[1] * 8.25, 2.0, 1.3, rot, 0, 0.6);
  svc.monuments.push({ id: 'decembrists', name: 'Обелиск на месте казни декабристов', x: o.x, z: o.z, h: 10 });
  svc.photoSpots.push({ x: o.x + d[0] * 13, z: o.z + d[1] * 13, yaw: L.yawToward(o.x + d[0] * 13, o.z + d[1] * 13, o.x, o.z), name: 'Обелиск декабристам' });
  svc.crowd.push({ x: o.x + d[0] * 11, z: o.z + d[1] * 11, r: 4, n: 3, name: 'у обелиска декабристам' });
}

// ================================================================== the Artillery bridges
function bridges(K) {
  for (const [id, key, name] of [['r3298017', 'east-artillery', 'Восточный Артиллерийский мост'], ['r3298018', 'west-artillery', 'Западный Артиллерийский мост']]) bridge(K, id, key, name);
}
function bridge(K, id, key, name) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const rec = BRIDGES.find((b) => b.id === id); if (!rec) return;
  const ring = pairs(rec.polys[0].o), c = centroid(ring);
  let bl = 0, t = [1, 0]; ring.forEach((a, i) => { const b = ring[(i + 1) % ring.length], l = dist(a, b); if (l > bl) { bl = l; t = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; } });
  const n = [-t[1], t[0]];
  let s0 = 1e9, s1 = -1e9, n0 = 1e9, n1 = -1e9; for (const p of ring) { const s = (p[0] - c[0]) * t[0] + (p[1] - c[1]) * t[1], q = (p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1]; s0 = Math.min(s0, s); s1 = Math.max(s1, s); n0 = Math.min(n0, q); n1 = Math.max(n1, q); }
  const Lb = s1 - s0, W = n1 - n0, C = [c[0] + t[0] * (s0 + s1) / 2 + n[0] * (n0 + n1) / 2, c[1] + t[1] * (s0 + s1) / 2 + n[1] * (n0 + n1) / 2], rot = rotOf(t[0], t[1]);
  // the water under the deck (sampled on three lines along the bridge)
  let a = 1e9, b = -1e9;
  for (let x = -Lb / 2; x <= Lb / 2; x += 0.5) for (const z of [-W * 0.3, 0, W * 0.3]) if (L.waterwayAt(C[0] + t[0] * x + n[0] * z, C[1] + t[1] * x + n[1] * z)) { a = Math.min(a, x); b = Math.max(b, x); }
  if (!(b > a + 4)) { a = -Lb * 0.28; b = Lb * 0.28; }
  a = Math.max(a - 0.4, -Lb / 2 + 2.5); b = Math.min(b + 0.4, Lb / 2 - 2.5);
  const yb = -3.7, spring = -3.3, crown = -0.8, top = 0.012;
  const shape = (x0, x1) => { const sh = new THREE.Shape(); sh.moveTo(x0, yb); sh.lineTo(a, yb); for (let i = 0; i <= 16; i++) { const u = i / 16; sh.lineTo(a + (b - a) * u, spring + (crown - spring) * Math.pow(Math.sin(Math.PI * u), 0.8)); } sh.lineTo(b, yb); sh.lineTo(x1, yb); sh.lineTo(x1, top); sh.lineTo(x0, top); sh.lineTo(x0, yb); return sh; };
  P.push(C[0], 0, C[1], rot);
  // the two faces (0.7 m slabs over the whole length) and the vault between them over the water
  P.extrude(M.granitePink, shape(-Lb / 2, Lb / 2), -W / 2, 0.7, 2, 4); P.extrude(M.granitePink, shape(-Lb / 2, Lb / 2), W / 2 - 0.7, 0.7, 2, 4);
  P.extrude(M.granitePinkD, shape(a - 1.5, b + 1.5), -W / 2 + 0.7, W - 1.4, 2, 4);
  for (const s of [-1, 1]) {
    const z = s * W / 2, zi = s * (W / 2 - 0.62), za = Math.min(z, zi), zb = Math.max(z, zi);
    P.box(M.granitePinkFlat, -Lb / 2, Lb / 2, -0.3, -0.08, s > 0 ? z : z - 0.14, s > 0 ? z + 0.14 : z, '', 2);                                  // cornice
    P.box(M.granitePink, -Lb / 2 - 0.2, Lb / 2 + 0.2, top, 0.86, za + 0.06, zb, 'b', 2); P.box(M.granitePinkFlat, -Lb / 2 - 0.25, Lb / 2 + 0.25, 0.86, 0.98, za, zb + 0.06 * 0, '', 2);
    for (const e of [-1, 1]) P.box(M.granitePink, e * (Lb / 2 + 0.2) - 0.45, e * (Lb / 2 + 0.2) + 0.45, 0, 1.15, za - 0.1, zb + 0.1, 'b', 2);
    // cone slopes at the abutments: quarter cones from the top corner down to the water
    for (const e of [-1, 1]) {
      const ax = e * Lb / 2, R = 6;
      for (let i = 0; i < 5; i++) {
        const q0 = i / 5 * Math.PI / 2, q1 = (i + 1) / 5 * Math.PI / 2, qm = (q0 + q1) / 2;
        P.fan(M.granitePinkD, [[ax, top, z], [ax + e * Math.sin(q0) * R, -3.55, z + s * Math.cos(q0) * R], [ax + e * Math.sin(q1) * R, -3.55, z + s * Math.cos(q1) * R]], [e * Math.sin(qm) * 0.5, 0.7, s * Math.cos(qm) * 0.5]);
      }
    }
  }
  P.pop();
  ph.addWalkBox(C[0], C[1], Lb, W, rot, 0, -1.2);
  for (const s of [-1, 1]) { const q = s * (W / 2 - 0.3); ph.addBox(C[0] + n[0] * q, C[1] + n[1] * q, Lb + 0.8, 0.62, rot, -1, 1.1); }
  svc.bridges.push({ key, name, id, x: C[0], z: C[1], len: Lb, w: W, rotY: rot, span: b - a });
}

// ================================================================== the Steregushchy monument
function steregushchy(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics, fm = figureMats(ctx), mk = fm.keys('bronze', 'bronze');
  const o = MONUMENTS.find((m) => m.id === 'n339816778') || { x: -1704, z: -2568.3 }, d = [0.999, -0.03], rot = rotOut(d[0], d[1]);
  const T1 = 0.64, T2 = 1.28;
  P.push(o.x, 0, o.z, rot);
  // terraces: the upper one round the rock, the lower landing before it, two flights of four granite steps
  P.box(M.granitePink, -5.2, 5.2, 0, T2, -4.2, 3.2, 'b', 2); P.box(M.granitePink, -3.4, 3.4, 0, T1, 3.2, 7.4, 'b', 2);
  for (let i = 0; i < 4; i++) P.box(M.granitePinkFlat, -2.0, 2.0, T1, T2 - i * 0.16, 3.2 + i * 0.36, 3.2 + (i + 1) * 0.36, 'b', 2);
  for (let i = 0; i < 4; i++) P.box(M.granitePinkFlat, -2.0, 2.0, 0, T1 - i * 0.16, 7.4 + i * 0.36, 7.4 + (i + 1) * 0.36, 'b', 2);
  for (const s of [-1, 1]) { P.box(M.granitePink, s * 2.0 - 0.22, s * 2.0 + 0.22, 0, T1 + 0.25, 7.4, 8.9, 'b', 2); P.box(M.granitePink, s * 2.0 - 0.22, s * 2.0 + 0.22, T1, T2 + 0.25, 3.2, 4.7, 'b', 2); }
  // low posts with a bar along the front of the upper terrace, the two lantern pillars ("lighthouses")
  for (const x of [-4.7, -2.9, 2.9, 4.7]) { P.box(M.granitePink, x - 0.3, x + 0.3, T2, T2 + 1.05, 2.5, 3.1, 'b', 2); P.box(M.granitePinkFlat, x - 0.36, x + 0.36, T2 + 1.05, T2 + 1.2, 2.44, 3.16, '', 2); }
  for (const s of [-1, 1]) P.box(M.iron, s * 2.9, s * 4.7, T2 + 0.7, T2 + 0.76, 2.77, 2.83, '', 1);
  for (const s of [-1, 1]) {
    const x = s * 4.4, z = -0.6;
    P.cyl(M.granitePolish, [x, T2, z], [x, T2 + 3.9, z], 0.5, 0.36, 12, false); P.cyl(M.granitePink, [x, T2, z], [x, T2 + 0.5, z], 0.62, 0.55, 12, true); P.cyl(M.granitePinkFlat, [x, T2 + 3.9, z], [x, T2 + 4.1, z], 0.62, 0.62, 12, true);
    P.cyl(M.lanternGlass, [x, T2 + 4.1, z], [x, T2 + 4.85, z], 0.36, 0.36, 8, false); for (let i = 0; i < 8; i++) { const q = i / 8 * 6.283; P.cyl(M.bronze, [x + Math.cos(q) * 0.37, T2 + 4.1, z + Math.sin(q) * 0.37], [x + Math.cos(q) * 0.37, T2 + 4.85, z + Math.sin(q) * 0.37], 0.025, 0.025, 4, false); }
    P.cyl(M.bronze, [x, T2 + 4.85, z], [x, T2 + 5.25, z], 0.46, 0.08, 8, true); P.cyl(M.bronze, [x, T2 + 5.25, z], [x, T2 + 5.5, z], 0.05, 0.02, 5, true);
  }
  // the rock (rough grey-pink granite) and boulders
  G.frustum(P, M.rock, 0, -0.6, T2, T2 + 1.5, 7, 3.0, 2.2, 0.3, 1, 1, { capTop: M.rockD }); G.frustum(P, M.rockD, 0.1, -0.7, T2 + 1.5, T2 + 2.5, 6, 2.2, 1.45, 0.9, 1, 1, { capTop: M.rock });
  for (const [x, z, s, a] of [[-4.2, 5.4, 1.1, 0.4], [-5.0, 4.3, 0.8, 1.2], [4.3, 5.0, 1.0, 2.1], [5.3, 3.9, 0.7, 0.2], [-3.9, 7.0, 0.7, 1.9], [4.1, 6.9, 0.85, 2.8], [-6.0, 1.0, 0.9, 0.7], [6.1, 0.4, 1.0, 1.5], [-5.9, -2.6, 0.8, 2.4], [5.8, -2.9, 0.9, 0.9]]) { P.push(x, 0, z, a); G.frustum(P, M.rock, 0, 0, 0, 0.9 * s, 5, 0.9 * s, 0.55 * s, 0, 1, 1, { capTop: M.rockD }); P.pop(); }
  // the bronze cross: the side of the hull with the porthole; water streaming from the open seacock at its foot
  const yc = T2 + 2.5, br = fm.bronze;
  P.box(br, -1.05, 1.05, yc, yc + 5.0, -0.8, -0.2, 'b', 2); P.box(br, -2.15, 2.15, yc + 2.7, yc + 4.05, -0.77, -0.23, '', 2);
  P.box(M.bronzeLit, -0.82, 0.82, yc + 0.6, yc + 3.7, -0.2, -0.16, 'k', 1); for (const x of [-0.95, 0.95]) for (let i = 0; i < 9; i++) P.cyl(M.bronzeLit, [x, yc + 0.5 + i * 0.5, -0.2], [x, yc + 0.5 + i * 0.5, -0.16], 0.035, 0.035, 5, true);
  P.cyl(br, [0, yc + 3.05, -0.2], [0, yc + 3.05, -0.08], 0.36, 0.36, 14, true); P.cyl(M.lanternGlass, [0, yc + 3.05, -0.08], [0, yc + 3.05, -0.07], 0.25, 0.25, 12, true);
  P.cyl(br, [0.5, yc + 2.9, -0.2], [0.5, yc + 2.9, -0.1], 0.25, 0.25, 10, true);
  G.frustum(P, br, 0, 0.15, yc - 0.9, yc + 0.7, 6, 1.5, 0.75, 0.5, 1, 1, { capTop: br });
  P.quad(M.sign('stereg', 256, 64, ['СТЕРЕГУЩIЙ'], { bg: '#3a4a40', fg: '#9db0a0', pad: 0.3 }), [-1.6, yc + 4.25, -0.195], [1.6, yc + 4.25, -0.195], [1.6, yc + 4.8, -0.195], [-1.6, yc + 4.8, -0.195], [0, 0, 1]);
  P.pop();
  // the two sailors (backs to the viewer, turned to the hull wall)
  const sailor = { torso: 'coat', hem: 0.12, sleeves: 'long', trousers: 'long', collar: 'fall', boots: false };
  const W = (lx, lz) => [o.x + Math.cos(rot) * lx + Math.sin(rot) * lz, o.z - Math.sin(rot) * lx + Math.cos(rot) * lz];
  const s1 = cached('lmKr-sailor1', () => human({ detail: 0.5, body: { muscle: 0.8 }, pose: { pelvis: [0, 0.9, 0], pelvisRot: [0.3, 0.15, 0], spine: [0.15, 0.1, 0], head: [-0.4, 0.2, 0], legs: { L: { foot: [0.2, 0, 0.15], pole: [0, 0, 1] }, R: { foot: [-0.18, 0, -0.35], pole: [0, 0, 1] } }, arms: { L: { hand: [0.28, 1.78, 0.5], pole: [0.7, -0.2, -0.3], grip: 'hold' }, R: { hand: [-0.1, 1.55, 0.55], pole: [-0.7, -0.2, -0.3], grip: 'hold' } } }, outfit: sailor, face: { age: 0.3, hair: 'short', seed: 5 } }));
  const s2 = cached('lmKr-sailor2', () => human({ detail: 0.5, body: { muscle: 0.8 }, pose: { pelvis: [0, 0.52, 0], pelvisRot: [0.2, -0.3, 0], spine: [0.1, -0.2, 0], head: [-0.5, -0.3, 0], legs: { L: { foot: [0.2, 0, 0.3], pole: [0.2, 0, 1] }, R: { foot: [-0.2, 0, -0.35], pole: [0, -1, 0.3], lift: 0 } }, arms: { L: { hand: [0.2, 1.05, 0.45], pole: [0.7, -0.3, -0.2], grip: 'hold' }, R: { hand: [-0.25, 0.75, 0.4], pole: [-0.7, -0.3, -0.2], grip: 'fist' } } }, outfit: sailor, face: { age: 0.3, hair: 'cap', seed: 9 } }));
  { const p = W(-0.15, 0.55); s1.place(P, mk, p[0], yc + 0.7, p[1], rot + Math.PI + 0.1, 1.45); const q = W(0.55, 0.75); s2.place(P, mk, q[0], yc + 0.7, q[1], rot + Math.PI - 0.5, 1.45); }
  // colliders and walk surfaces
  { const c = W(0, -0.5); ph.addWalkBox(c[0], c[1], 10.4, 7.4, rot, T2, 0); const l = W(0, 5.3); ph.addWalkBox(l[0], l[1], 6.8, 4.2, rot, T1, 0);
    const st1 = W(0, 3.92); ph.addStairs(st1[0], st1[1], 4.0, 1.44, rot + Math.PI, T1, T2, 4); const st2 = W(0, 8.12); ph.addStairs(st2[0], st2[1], 4.0, 1.44, rot + Math.PI, 0, T1, 4);
    const r = W(0, -0.6); ph.addCylinder(r[0], r[1], 2.7, 0, 10); for (const s of [-1, 1]) { const q = W(s * 4.4, -0.6); ph.addCylinder(q[0], q[1], 0.6, 0, 7); } }
  svc.monuments.push({ id: 'steregushchy', name: 'Памятник «Стерегущему»', x: o.x, z: o.z, h: yc + 5.0 });
  const ps = W(0, 16); svc.photoSpots.push({ x: ps[0], z: ps[1], yaw: 90, name: 'Памятник «Стерегущему»' }); svc.crowd.push({ x: ps[0], z: ps[1], r: 5, n: 5, name: 'у памятника «Стерегущему»' });
  void extend;
}

// ================================================================== the grotto and its pool
function grotto(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const rec = byId('w189064849'); if (!rec) return;
  const poly = rec.polys[0], ring = pairs(poly.o), c = centroid(ring), Hg = 3.4;
  walls(K, poly, Hg, () => ({ mat: M.rubble, bay: 2, plain: false }), { plain: M.rubble });
  P.cap(M.slab, ring, Hg, true, 2, []);
  // a rubble parapet and the dark arch of the grotto toward the pool
  const pond = WATER.find((w) => w.id === 'w609619503'), pc = pond ? centroid(pairs(pond.polys[0].o)) : [c[0] + 10, c[1] - 6];
  const dl = dist(c, pc), d = [(pc[0] - c[0]) / dl, (pc[1] - c[1]) / dl];
  P.push(c[0] + d[0] * 5.0, 0, c[1] + d[1] * 5.0, rotOut(d[0], d[1]));
  P.box(M.rubble, -2.6, 2.6, 0, 3.0, -1.2, 0.6, 'b', 2);
  const sh = new THREE.Shape(); sh.moveTo(-1.1, 0); sh.lineTo(-1.1, 1.3); sh.absarc(0, 1.3, 1.1, Math.PI, 0, true); sh.lineTo(1.1, 0); sh.lineTo(-1.1, 0); P.face(M.dark, sh, 0.62, 1, 10);
  P.pop();
  addPolyColliders(ctx, poly, 0, Hg + 1.2, 0.6);
  // the round pool: boulder kerb, water
  const R = 2.7;
  for (let i = 0; i < 16; i++) { const q = i / 16 * 6.283, s = 0.85 + (i * 7 % 5) * 0.07; P.push(pc[0] + Math.cos(q) * (R + 0.35), 0, pc[1] + Math.sin(q) * (R + 0.35), q * 1.7); G.frustum(P, i % 2 ? M.rock : M.rockD, 0, 0, 0, 0.42 * s, 5, 0.55 * s, 0.38 * s, 0, 1, 1, { capTop: M.rock }); P.pop(); }
  P.cyl(M.water, [pc[0], 0.11, pc[1]], [pc[0], 0.12, pc[1]], R + 0.1, R + 0.1, 20, true); P.cyl(M.rockD, [pc[0], 0, pc[1]], [pc[0], 0.1, pc[1]], R + 0.15, R + 0.15, 20, true);
  G.frustum(P, M.rock, pc[0], pc[1], 0.1, 0.5, 6, 0.6, 0.3, 0.4, 1, 1, { capTop: M.rockD });
  ph.addCylinder(pc[0], pc[1], R + 0.5, 0, 0.5);
  svc.monuments.push({ id: 'grotto', name: 'Грот в Александровском парке', x: c[0], z: c[1], h: Hg });
}

// ================================================================== the bronze mini-city
function miniCity(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const C0 = [-1946, -2598], u = [0.9, -0.44], v = [0.44, 0.9];
  const MOD = {
    fortress(Q) { Q.box(M.bronzeLit, -1.1, 0.3, 0, 0.75, -0.35, 0.35, 'b', 1); Q.box(M.bronzeLit, 0.3, 0.95, 0, 1.7, -0.32, 0.32, 'b', 1); Q.box(M.bronzeLit, 0.4, 0.85, 1.7, 2.3, -0.22, 0.22, 'b', 1); G.frustum(Q, M.gold, 0.625, 0, 2.3, 4.0, 4, 0.16, 0.012, Math.PI / 4, 1, 1); Q.cyl(M.gold, [-0.75, 0.75, 0], [-0.75, 1.15, 0], 0.16, 0.1, 8, true); },
    isaac(Q) { Q.box(M.bronzeLit, -1.0, 1.0, 0, 0.95, -0.8, 0.8, 'b', 1); for (const [x, z, w, dd] of [[0, 0.9, 0.8, 0.12], [0, -0.9, 0.8, 0.12], [1.1, 0, 0.12, 0.6], [-1.1, 0, 0.12, 0.6]]) Q.box(M.bronze, x - w, x + w, 0, 0.85, z - dd, z + dd, 'b', 1); Q.cyl(M.bronzeLit, [0, 0.95, 0], [0, 1.7, 0], 0.5, 0.5, 14, true); G.lathe(Q, M.gold, 'lmKr-dome', [[0.52, 0], [0.5, 0.2], [0.4, 0.42], [0.22, 0.58], [0.08, 0.64], [0.08, 0.8], [0, 0.9]], 0, 1.7, 0, 1, 1, 14, 8); for (const [x, z] of [[0.75, 0.55], [-0.75, 0.55], [0.75, -0.55], [-0.75, -0.55]]) { Q.cyl(M.bronzeLit, [x, 0.95, z], [x, 1.3, z], 0.14, 0.14, 6, true); Q.cyl(M.gold, [x, 1.3, z], [x, 1.5, z], 0.15, 0.02, 6, false); } },
    kazan(Q) { Q.box(M.bronzeLit, -0.4, 0.4, 0, 0.7, -0.9, 0.5, 'b', 1); Q.cyl(M.bronzeLit, [0, 0.7, 0], [0, 1.25, 0], 0.32, 0.32, 12, true); G.lathe(Q, M.bronze, 'lmKr-dome', [[0.52, 0], [0.5, 0.2], [0.4, 0.42], [0.22, 0.58], [0.08, 0.64], [0.08, 0.8], [0, 0.9]], 0, 1.25, 0, 0.66, 0.66, 12, 8); for (let i = 0; i <= 16; i++) { const q = -0.3 + i / 16 * (Math.PI + 0.6); Q.cyl(M.bronzeLit, [Math.cos(q) * 1.6, 0, 0.55 + Math.sin(q) * 1.0], [Math.cos(q) * 1.6, 0.48, 0.55 + Math.sin(q) * 1.0], 0.04, 0.04, 5, false); } for (let i = 0; i < 16; i++) { const q0 = -0.3 + i / 16 * (Math.PI + 0.6), q1 = -0.3 + (i + 1) / 16 * (Math.PI + 0.6); Q.cyl(M.bronze, [Math.cos(q0) * 1.6, 0.52, 0.55 + Math.sin(q0) * 1.0], [Math.cos(q1) * 1.6, 0.52, 0.55 + Math.sin(q1) * 1.0], 0.06, 0.06, 4, false); } },
    admiralty(Q) { Q.box(M.bronzeLit, -2.2, 2.2, 0, 0.45, -0.25, 0.25, 'b', 1); Q.box(M.bronzeLit, -0.35, 0.35, 0, 0.95, -0.35, 0.35, 'b', 1); Q.box(M.bronzeLit, -0.24, 0.24, 0.95, 1.4, -0.24, 0.24, 'b', 1); Q.cyl(M.gold, [0, 1.4, 0], [0, 1.6, 0], 0.2, 0.1, 8, true); G.frustum(Q, M.gold, 0, 0, 1.6, 2.5, 4, 0.08, 0.008, 0, 1, 1); for (const s of [-1, 1]) Q.box(M.bronzeLit, s * 2.2 - 0.3, s * 2.2 + 0.3, 0, 0.5, -0.3, 1.2, 'b', 1); },
    exchange(Q) { Q.box(M.bronzeLit, -0.75, 0.75, 0, 0.2, -1.1, 1.1, 'b', 1); Q.box(M.bronzeLit, -0.5, 0.5, 0.2, 0.9, -0.85, 0.85, 'b', 1); for (let i = 0; i < 7; i++) for (const s of [-1, 1]) Q.cyl(M.bronze, [s * 0.64, 0.2, -0.95 + i * 0.317], [s * 0.64, 0.8, -0.95 + i * 0.317], 0.045, 0.045, 5, false); Q.box(M.bronze, -0.72, 0.72, 0.8, 0.92, -1.05, 1.05, '', 1); G.frustum(Q, M.bronze, 0, 0, 0.92, 1.2, 4, 0.9, 0.5, Math.PI / 4, 1, 1, { capTop: M.bronze }); for (const s of [-1, 1]) { Q.cyl(M.bronzeLit, [s * 1.6, 0, 1.5], [s * 1.6, 1.0, 1.5], 0.09, 0.07, 8, true); Q.cyl(M.gold, [s * 1.6, 1.0, 1.5], [s * 1.6, 1.08, 1.5], 0.12, 0.12, 6, true); } },
    winter(Q) { Q.box(M.bronzeLit, -2.4, 2.4, 0, 0.7, -0.45, 0.45, 'b', 1); for (const s of [-1, 0, 1]) Q.box(M.bronzeLit, s * 2.0 - 0.45, s * 2.0 + 0.45, 0, 0.78, -0.55, 0.55, 'b', 1); Q.cyl(M.bronzeLit, [0, 0, 1.6], [0, 1.25, 1.6], 0.07, 0.055, 8, true); Q.cyl(M.gold, [0, 1.25, 1.6], [0, 1.45, 1.6], 0.04, 0.04, 5, true); },
    saviour(Q) { Q.box(M.bronzeLit, -0.55, 0.55, 0, 0.9, -0.8, 0.8, 'b', 1); for (const [x, z, h, r] of [[0, 0, 1.5, 0.2], [0.35, 0.35, 1.0, 0.15], [-0.35, 0.35, 1.0, 0.15], [0.35, -0.35, 1.0, 0.15], [-0.35, -0.35, 1.0, 0.15], [0, -0.95, 1.3, 0.16]]) { Q.cyl(M.bronzeLit, [x, 0.9, z], [x, 0.9 + h * 0.6, z], r * 0.8, r * 0.8, 8, false); G.onion(Q, M.gold, x, 0.9 + h * 0.6, z, r, 1, 10, 8); } },
    castle(Q) { Q.box(M.bronzeLit, -0.9, 0.9, 0, 0.75, -0.9, 0.9, 'b', 1); Q.cyl(M.bronze, [0, 0.75, 0], [0, 0.78, 0], 0.5, 0.5, 8, true); Q.cyl(M.bronzeLit, [0.5, 0.75, -0.75], [0.5, 1.1, -0.75], 0.15, 0.15, 8, true); G.frustum(Q, M.gold, 0.5, -0.75, 1.1, 2.0, 6, 0.1, 0.008, 0, 1, 1); },
  };
  const order = ['fortress', 'isaac', 'kazan', 'admiralty', 'exchange', 'winter', 'saviour', 'castle'], placed = [];
  const trees = (ctx.services?.environment?.trees || []).filter((t) => Math.hypot(t.x - C0[0], t.z - C0[1]) < 60);
  order.forEach((k, i) => {
    const col = i % 4, row = (i / 4) | 0, lx0 = (col - 1.5) * 8.5, lz0 = (row - 0.5) * 9.5;
    // a free spot: not in a house, not on a road, no generic tree within 4.6 m (the plinth is 6.2 x 4.8 m); the slot may shift a little
    let x = null, z = null;
    for (const [ox, oz] of [[0, 0], [2.6, 0], [-2.6, 0], [0, 2.8], [0, -2.8], [2.6, 2.8], [-2.6, -2.8], [2.6, -2.8], [-2.6, 2.8]]) {
      const px = C0[0] + u[0] * (lx0 + ox) + v[0] * (lz0 + oz), pz = C0[1] + u[1] * (lx0 + ox) + v[1] * (lz0 + oz);
      if (L.insideBuilding(px, pz, 3) || L.isOnRoad(px, pz, 2.5) || trees.some((t) => Math.hypot(t.x - px, t.z - pz) < 4.6)) continue;
      x = px; z = pz; break;
    }
    if (x === null) return;
    const rot = rotOut(v[0], v[1]) + (i % 2 ? 0.25 : -0.2);
    P.push(x, 0, z, rot);
    P.box(M.slabPink, -3.1, 3.1, 0, 0.03, -2.4, 2.4, 'b', 2); P.box(M.granitePolish, -2.8, 2.8, 0.03, 0.42, -1.9, 1.9, 'b', 2); P.box(M.granitePinkFlat, -2.6, 2.6, 0.42, 0.5, -1.7, 1.7, 'b', 2);
    P.push(0, 0.5, 0, 0); MOD[k](P); P.pop();
    P.pop();
    ph.addBox(x, z, 5.6, 3.8, rot, 0, 1.2); placed.push({ kind: k, x, z });
  });
  svc.miniCity = placed;
  svc.monuments.push({ id: 'mini-city', name: 'Мини-город (бронзовые макеты)', x: C0[0], z: C0[1], h: 4 });
  svc.crowd.push({ x: C0[0], z: C0[1], r: 12, n: 8, name: 'Мини-город' });
}

// ================================================================== "Architects": eight bronze figures round a table (A. Taratynov 2011)
function architects(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics, fm = figureMats(ctx), mk = fm.keys('bronze', 'bronze');
  const o = MONUMENTS.find((m) => m.id === 'n1559808836') || { x: -1925.7, z: -2569.2 }, rot = rotOut(0.44, 0.9);
  const W = (lx, lz) => [o.x + Math.cos(rot) * lx + Math.sin(rot) * lz, o.z - Math.sin(rot) * lx + Math.cos(rot) * lz];
  P.push(o.x, 0, o.z, rot);
  P.fan(M.slabPink, Array.from({ length: 24 }, (_, i) => [Math.sin(i / 24 * 6.2832) * 4.6, 0.04, Math.cos(i / 24 * 6.2832) * 4.6]), [0, 1, 0], (q) => [q[0] / 2, q[2] / 2]);
  // the table: a slab on four turned legs, a hat, an inkstand and rolled plans on it
  P.box(M.bronze, -1.35, 1.35, 0.72, 0.8, -0.7, 0.7, '', 1); P.box(M.bronze, -1.25, 1.25, 0.6, 0.72, -0.6, 0.6, 'tb', 1);
  for (const [x, z] of [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]]) P.cyl(M.bronze, [x, 0.04, z], [x, 0.6, z], 0.05, 0.075, 6, false);
  P.cyl(M.bronze, [0.3, 0.8, 0.1], [0.3, 0.95, 0.1], 0.12, 0.11, 8, true); P.cyl(M.bronze, [0.3, 0.8, 0.1], [0.3, 0.815, 0.1], 0.2, 0.2, 8, true);
  P.cyl(M.bronzeLit, [-0.8, 0.83, -0.2], [0.0, 0.83, -0.35], 0.035, 0.035, 6, true); P.box(M.bronzeLit, -0.6, -0.1, 0.8, 0.812, 0.1, 0.5, 'b', 1);
  // chairs: (lx, lz, rotY in the group frame); the last one is the empty chair
  const chairs = [[-0.75, -1.15, 0], [0.75, -1.15, 0], [-0.75, 1.15, Math.PI], [0.75, 1.15, Math.PI], [1.95, 0, -Math.PI / 2], [-1.95, 0.1, Math.PI / 2]];
  for (const [x, z, a] of chairs) { P.push(x, 0.04, z, a); P.box(M.bronze, -0.23, 0.23, 0.42, 0.47, -0.22, 0.22, '', 1); for (const [cx, cz] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) P.box(M.bronze, cx - 0.02, cx + 0.02, 0, cz < 0 ? 1.0 : 0.42, cz - 0.02, cz + 0.02, 'b', 1); P.box(M.bronze, -0.2, 0.2, 0.62, 0.96, -0.2, -0.17, '', 1); P.pop(); }
  P.pop();
  const seatA = cached('lmKr-arch-sitA', () => human({ detail: 0.4, pose: SIT({ spine: [0.12, 0.1, 0], head: [0.05, 0.25, 0], arms: { L: { hand: [0.24, 0.84, 0.42], pole: [0.6, -0.5, 0], grip: 'flat' }, R: { hand: [-0.2, 0.86, 0.46], pole: [-0.6, -0.5, 0], grip: 'hold' } } }), outfit: { ...COAT, hem: 0.45 }, face: { age: 0.6, hair: 'wig', seed: 21 } }));
  const seatB = cached('lmKr-arch-sitB', () => human({ detail: 0.4, pose: SIT({ spine: [-0.05, -0.15, 0], head: [0, -0.3, 0], arms: { L: { hand: [0.22, 0.62, 0.3], pole: [0.6, -0.5, 0], grip: 'relaxed' }, R: { hand: [-0.3, 0.86, 0.44], pole: [-0.6, -0.3, 0], grip: 'point' } } }), outfit: { ...COAT, collar: 'fall' }, face: { age: 0.5, hair: 'long', seed: 33 } }));
  const stand = cached('lmKr-arch-stand', () => human({ detail: 0.4, pose: STAND({ spine: [0.05, 0.1, 0], head: [0.15, 0.2, 0], arms: { L: { hand: [0.3, 1.0, 0.25], pole: [0.6, -0.4, -0.3], grip: 'hold' }, R: { hand: [-0.28, 0.82, 0.05], pole: [-0.6, -0.4, -0.4], grip: 'relaxed' } } }), outfit: { ...COAT, hem: 0.6, cape: 'back', capeLen: 0.6 }, face: { age: 0.55, hair: 'short', seed: 41 } }));
  const sit = (fig, i) => { const [x, z, a] = chairs[i], p = W(x, z); fig.place(P, mk, p[0], 0.04, p[1], rot + a, 1.18); };
  sit(seatA, 0); sit(seatB, 1); sit(seatB, 2); sit(seatA, 3); sit(seatA, 4);
  for (const [x, z, a] of [[-1.3, -1.9, 0.5], [1.6, 1.7, Math.PI + 0.4], [2.6, -0.9, -1.1]]) { const p = W(x, z); stand.place(P, mk, p[0], 0.04, p[1], rot + a, 1.18); }
  ph.addCylinder(o.x, o.z, 2.6, 0, 2.3);
  svc.monuments.push({ id: 'architects', name: 'Скульптурная группа «Зодчие»', x: o.x, z: o.z, h: 2.2 });
  svc.photoSpots.push({ x: W(0, 7)[0], z: W(0, 7)[1], yaw: L.yawToward(W(0, 7)[0], W(0, 7)[1], o.x, o.z), name: '«Зодчие»' }); svc.crowd.push({ x: W(0, 6)[0], z: W(0, 6)[1], r: 4, n: 4, name: 'у «Зодчих»' });
}

// ================================================================== the seated apostle Peter
function apostle(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics, fm = figureMats(ctx), mk = fm.keys('bronze', 'bronze');
  const o = MONUMENTS.find((m) => m.id === 'n1559808835') || { x: -1933.1, z: -2614 }, rot = rotOut(0.3, -0.95);
  P.push(o.x, 0, o.z, rot); P.box(M.slabPink, -2.2, 2.2, 0, 0.04, -2.2, 2.2, 'b', 2); P.box(M.granitePolish, -1.0, 1.0, 0.04, 0.5, -0.9, 0.9, 'b', 2); P.box(M.bronze, -0.5, 0.5, 0.5, 1.22, -0.6, 0.1, 'b', 1); P.pop();
  cached('lmKr-peter', () => human({ detail: 0.5, body: { bulk: 1.15 }, pose: SIT({ spine: [0.3, 0.05, 0], head: [0.3, 0.1, 0], arms: { L: { hand: [0.2, 0.6, 0.34], pole: [0.6, -0.5, 0], grip: 'relaxed' }, R: { hand: [-0.06, 1.0, 0.3], pole: [-0.7, -0.6, 0], grip: 'fist' } } }), outfit: { torso: 'robe', hem: 0.9, sleeves: 'long', cape: 'mantle', capeLen: 0.9 }, face: { age: 0.85, hair: 'cap', beard: 'full', seed: 77 } })).place(P, mk, o.x, 0.5, o.z, rot, 1.55);
  ph.addBox(o.x, o.z, 2.0, 1.8, rot, 0, 2.6);
  svc.monuments.push({ id: 'apostle-peter', name: 'Памятник апостолу Петру', x: o.x, z: o.z, h: 2.6 });
}

// ================================================================== the Orthopaedic Institute
function institute(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const rec = byId('w30325379'); if (!rec) return;
  const Hh = 13.4;
  const st = { key: 'ortho', H: Hh, bay: 3.5, trim: '#e6e0d0', roof: 'roofGreen', cornice: 0.45, roofD: 4.2, rise: 2.4,
    fac: { wall: '#c9c2b2', brick: true, trim: '#e6e0d0', socle: '#8f8a84', socleH: 1.0, floors: [{ h: 4.2, win: 'arch', ww: 1.4, wh: 2.5, sill: 1.0 }, { h: 4.2, win: 'arch', ww: 1.4, wh: 2.6, sill: 0.8 }, { h: 3.6, win: 'rect', ww: 1.3, wh: 2.0, sill: 0.8 }], cornice: 0.5 } };
  house(K, rec, st);
  // the church tower at the south-east block (the middle of the park-side wall), with the gilded onion and the majolica Madonna (K. Petrov-Vodkin, 1904)
  const A = [-1753.9, -2328.6], B = [-1729.4, -2355.3], l = dist(A, B), t = [(B[0] - A[0]) / l, (B[1] - A[1]) / l], rc = centroid(pairs(rec.polys[0].o));
  let n = [-t[1], t[0]]; const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; if (n[0] * (mid[0] - rc[0]) + n[1] * (mid[1] - rc[1]) < 0) n = [-n[0], -n[1]];
  P.push(mid[0], 0, mid[1], rotOut(n[0], n[1]));
  const tw = 3.4, Ht = 21;
  const tm = M.fac({ key: 'ortho-tower', H: Ht, bay: tw * 2, wall: '#c9c2b2', brick: true, trim: '#e6e0d0', socle: '#8f8a84', socleH: 1.0, floors: [{ h: 4.6, win: 'door', ww: 1.8, wh: 3.0, sill: 0, hood: 'bar' }, { h: 8.4, win: 'none' }, { h: 3.6, win: 'arch', ww: 1.5, wh: 2.6, sill: 0.6 }, { h: 3.4, win: 'arch', ww: 2.2, wh: 2.4, sill: 0.5 }], cornice: 0.5 });
  const side = M.fac({ key: 'ortho-tower-side', H: Ht, bay: tw * 2, wall: '#c9c2b2', brick: true, trim: '#e6e0d0', socle: '#8f8a84', socleH: 1.0, floors: [{ h: 13.0, win: 'none' }, { h: 3.6, win: 'arch', ww: 1.5, wh: 2.6, sill: 0.6 }, { h: 3.4, win: 'arch', ww: 2.2, wh: 2.4, sill: 0.5 }], cornice: 0.5 });
  const q = (mat, a, b, nn) => P.quad(mat, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], Ht, b[1]], [a[0], Ht, a[1]], nn, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  q(tm, [-tw, 1.2], [tw, 1.2], [0, 0, 1]); q(side, [tw, 1.2], [tw, -5.6], [1, 0, 0]); q(side, [-tw, -5.6], [-tw, 1.2], [-1, 0, 0]); q(side, [tw, -5.6], [-tw, -5.6], [0, 0, -1]);
  P.box(M.cream, -tw - 0.3, tw + 0.3, Ht, Ht + 0.3, -5.9, 1.5, '', 2);
  P.cyl(M.cream, [0, Ht + 0.3, -2.2], [0, Ht + 2.6, -2.2], 1.7, 1.6, 12, true); G.onion(P, M.gold, 0, Ht + 2.6, -2.2, 1.75, 1, 16, 12); G.cross(P, M.gold, 0, Ht + 2.6 + 1.75 * 2.3, -2.2, 1.4, 0);
  // the Madonna panel
  const mj = M.tex(256, 384, 'madonna', (g, w, h) => {
    g.fillStyle = '#2f5f8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a23a'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h);
    g.fillStyle = '#d8b24a'; g.beginPath(); g.arc(w * 0.5, h * 0.3, 52, 0, 6.3); g.fill(); g.beginPath(); g.arc(w * 0.62, h * 0.5, 30, 0, 6.3); g.fill();
    g.fillStyle = '#7a2a2a'; g.beginPath(); g.moveTo(w * 0.5, h * 0.2); g.quadraticCurveTo(w * 0.15, h * 0.5, w * 0.2, h * 0.95); g.lineTo(w * 0.8, h * 0.95); g.quadraticCurveTo(w * 0.85, h * 0.5, w * 0.5, h * 0.2); g.fill();
    g.fillStyle = '#e3c3a0'; g.beginPath(); g.ellipse(w * 0.5, h * 0.31, 22, 28, 0, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(w * 0.62, h * 0.5, 14, 16, 0, 0, 6.3); g.fill();
    g.fillStyle = '#f0e6d0'; g.beginPath(); g.ellipse(w * 0.6, h * 0.66, 34, 42, 0.2, 0, 6.3); g.fill();
  });
  const mm = ctx.mat.toon('#ffffff', { map: mj, name: 'lmKr-madonna', paint: 0, polygonOffset: -4 }); M.decals.add(mm);
  const lab = ctx.services?.labels, wx = mid[0] + n[0] * 1.22, wz = mid[1] + n[1] * 1.22;
  if (!lab || lab.reserve('w30325379', wx, 9.2, wz, 1.8, 2.7, n[0], n[1], 'panel')) P.quad(mm, [-0.9, 7.85, 1.225], [0.9, 7.85, 1.225], [0.9, 10.55, 1.225], [-0.9, 10.55, 1.225], [0, 0, 1]);
  P.pop();
  ph.addBox(mid[0] + n[0] * 0.3, mid[1] + n[1] * 0.3, tw * 2, 2.2, rotOut(n[0], n[1]), 0, Ht);
  // the brick chimney of the boiler house
  const ch = { x: -1870.5, z: -2463.6 };
  P.cyl(M.brickT, [ch.x, 0, ch.z], [ch.x, 30, ch.z], 1.5, 0.95, 14, false); P.cyl(M.brickFlat, [ch.x, 29.2, ch.z], [ch.x, 30.2, ch.z], 1.1, 1.15, 14, true); P.cyl(M.dark, [ch.x, 30.2, ch.z], [ch.x, 30.22, ch.z], 0.7, 0.7, 10, true);
  ph.addCylinder(ch.x, ch.z, 1.6, 0, 31);
  svc.monuments.push({ id: 'ortho-madonna', name: 'Ортопедический институт: майолика «Богоматерь с младенцем»', x: wx, z: wz, h: 10.5 });
  void inRing;
}
