// landmarksFortress/details.js - what fills the fortress (dossier docs/research/fortress.md sections 3, 5, 8, 9):
//  * Shemyakin's seated bronze PETER I (1991; photos refs/fortress 095-097): 1.9 m on a throne chair, grey granite plinth 0.36 m, low iron fence, in front of the Guardhouse facing the main alley;
//  * the HARE on its pile cluster beside the Ioannovsky Bridge (58 cm, silvery; photos 098-100);
//  * the six guns of the Naryshkin yard (two howitzers = the noon guns: silent props), striped sentry boxes, the stone half-spheres of the Cathedral square;
//  * the "Neva panorama": the public timber walk on the roofs from the Flagstaff tower along the Neva curtain to the Gosudarev bastion, with its stairs from the Naryshkin yard (walkable);
//  * trees (main alley rows, the Commandant's garden, lawns, ravelin gardens, the west tip, the beach: after the aerials 004 / 005), the green lamp posts on the OSM lamp nodes, benches,
//    the fences / walls / hedges of the claimed OSM barriers (open at their gate nodes).
import * as THREE from 'three';
import * as L from '../layout.js';
import { GREEN, LAMPS, FURNITURE, BARRIERS, WALLS, BARRIER_NODES, MONUMENTS } from '../data/city.js';
import { ON_ISLAND } from './osm-data.js';
import { RING, FORT, GATES, U, V, inRing, pairs, byId, dseg, offsetRing } from './frame.js';
import { plantTrees } from './trees.js';
import { partsGeos, addInstanced, mat4 } from './inst.js';
import { wall3D } from './surfaces.js';
import { human, cached, figureMats, extend } from '../lib/figures.js';

export const ROOF_WALK = [[-1870.2, -1784], [-1848.1, -1820.4], [-1870.5, -1854.7], [-1763.6, -1947], [-1735.6, -1925.6], [-1682, -1951.3]];
export const WALK_Y = 10.5;
export const STAIR = { a: [-1893.4, -1807.7], b: [-1884.4, -1789.0] };          // foot in the Naryshkin yard -> the roof beside the Flagstaff tower

export function build(K) {
  const { P, M, ctx, svc, root } = K, ph = ctx.physics, rng = ctx.rng(48211);
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksFortress] details/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const wallRings = ['r2594679', 'r2594690'].map(byId).filter(Boolean).map((b) => pairs(b.polys[0].o));
  const inWall = (x, z) => (inRing(x, z, FORT.o) && !FORT.h.some((h) => inRing(x, z, h))) || wallRings.some((r) => inRing(x, z, r));
  const free = (x, z, r = 2.5) => inRing(x, z, RING) && !inWall(x, z) && !L.insideBuilding(x, z, r);

  // ================================================================== Peter I by M. Chemiakin
  stage('peter', () => {
    const m = MONUMENTS.find((q) => q.id === 'n1955770752'), x = m ? m.x : -1869.8, z = m ? m.z : -1974.6, rot = Math.atan2(-V[0], -V[1]), s = 1.46;
    const mk = figureMats(ctx).keys('bronze', 'bronze');
    const fig = cached('lmFort-peter', () => extend(human({
      detail: 0.85, body: { muscle: 0.45, bulk: 1.5, shoulders: 1.34 },
      pose: { pelvis: [0, 0.52, -0.04], pelvisRot: [-0.03, 0, 0], spine: [-0.02, 0, 0], head: [0.02, 0, 0],
        legs: { L: { foot: [0.2, 0, 0.42], yaw: 0.12, pole: [0.12, 0.2, 1] }, R: { foot: [-0.2, 0, 0.42], yaw: -0.12, pole: [-0.12, 0.2, 1] } },
        arms: { L: { hand: [0.44, 0.74, 0.3], pole: [0.8, -0.2, -0.6], grip: 'flat', palm: [0, -1, 0.2] }, R: { hand: [-0.44, 0.74, 0.3], pole: [-0.8, -0.2, -0.6], grip: 'flat', palm: [0, -1, 0.2] } } },
      outfit: { torso: 'coat', hem: 0.44, flare: 0.5, folds: 0.06, sleeves: 'long', trousers: 'breeches', boots: 0.1, collar: 'fall', buttons: true },
      face: { age: 0.6, hair: 'cap', beard: 'none', brow: 0.8, jaw: 1.1, mouth: 'stern', seed: 17 },
    }), (S, info) => {
      // Chemiakin's proportions: a massive body under a small head (the kit figure is bulked with ellipsoids on its own joints: upper arms, wide cuffs, thighs, calves, the barrel of the trunk)
      const j = info.j || {}, A = (v) => (v ? (Array.isArray(v) ? v : [v.x, v.y, v.z]) : null), B = (a, b, ra, rb, k = 1.06) => { a = A(a); b = A(b); if (a && b) S.blobBetween('main', a, b, ra, rb, { k, uv: true }); };
      for (const sd of ['L', 'R']) {
        B(j['shoulder' + sd], j['elbow' + sd], 0.092, 0.09); B(j['elbow' + sd], j['wrist' + sd], 0.078, 0.07, 1.0); B(j['hip' + sd], j['knee' + sd], 0.125, 0.115); B(j['knee' + sd], j['ankle' + sd], 0.078, 0.075, 0.96);
        const w = A(j['wrist' + sd]); if (w) S.blob('main', [w[0], w[1] + 0.01, w[2] - 0.05], [0.09, 0.062, 0.1], { uv: true });
      }
      const pv = A(j.pelvis), ch = A(j.chest);
      if (pv && ch) { S.blobBetween('main', [pv[0], pv[1] - 0.06, pv[2] + 0.03], [ch[0], ch[1] + 0.16, ch[2] + 0.01], 0.27, 0.215, { k: 1.08, uv: true }); S.blob('main', [pv[0], pv[1] + 0.02, pv[2] + 0.2], [0.3, 0.1, 0.2], { uv: true }); }
    }));
    P.push(x, 0, z, rot);
    P.box(M.col('#8f8d88', 'peterPlinth'), -1.25, 1.25, 0, 0.36, -1.05, 1.15, 'b', 1.5);
    // the bronze throne chair: seat, four legs, arm rests on turned posts, a tall straight back
    const bz = M.bronze, y0 = 0.36, ys = y0 + 0.4 * s;
    P.box(bz, -0.58, 0.58, ys - 0.08, ys, -0.5, 0.5, '', 1);
    for (const [cx, cz] of [[-0.52, -0.44], [0.52, -0.44], [-0.52, 0.44], [0.52, 0.44]]) P.col(bz, cx, cz, y0, ys - 0.08, 0.055, 0.045, 6, false);
    for (const sx of [-1, 1]) { P.box(bz, sx * 0.6 - 0.05, sx * 0.6 + 0.05, ys + 0.46, ys + 0.53, -0.46, 0.5, '', 1); P.col(bz, sx * 0.6, 0.44, ys, ys + 0.46, 0.04, 0.04, 6, false); G_ball(P, bz, sx * 0.6, ys + 0.5, 0.52, 0.07); }
    P.box(bz, -0.58, 0.58, ys, y0 + 1.72 * s * 0.8, -0.56, -0.48, '', 1); P.col(bz, 0, -0.52, y0 + 1.72 * s * 0.8, y0 + 1.72 * s * 0.8 + 0.1, 0.6, 0.6, 12, true);
    fig.place(P, mk, 0, y0, 0, 0, s);
    // the low wrought fence round the plinth
    for (const [x0, x1, z0, z1] of [[-1.9, 1.9, 1.75, 1.79], [-1.9, 1.9, -1.69, -1.65], [-1.9, -1.86, -1.69, 1.79], [1.86, 1.9, -1.69, 1.79]]) { P.box(M.iron, x0, x1, 0.82, 0.87, z0, z1, '', 1); P.box(M.iron, x0, x1, 0.12, 0.16, z0, z1, '', 1); }
    for (let i = 0; i <= 12; i++) for (const zz of [1.77, -1.67]) P.box(M.iron, -1.9 + i * 3.8 / 12 - 0.015, -1.9 + i * 3.8 / 12 + 0.015, 0, 0.95, zz - 0.015, zz + 0.015, 'b', 1);
    for (let i = 1; i < 11; i++) for (const xx of [-1.88, 1.88]) P.box(M.iron, xx - 0.015, xx + 0.015, 0, 0.95, -1.67 + i * 3.44 / 11 - 0.015, -1.67 + i * 3.44 / 11 + 0.015, 'b', 1);
    P.pop();
    ph.addBox(x, z, 3.9, 3.6, rot, 0, 1.2);
    svc.monuments.push({ id: 'n1955770752', name: 'Памятник Петру I (М. Шемякин)', x, z, h: 2.3 });
    svc.photoSpots.push({ x: x - V[0] * 6, z: z - V[1] * 6, yaw: L.yawToward(x - V[0] * 6, z - V[1] * 6, x, z), pitch: 2, name: 'Пётр I Шемякина' });
    svc.crowd.push({ x: x - V[0] * 5, z: z - V[1] * 5, r: 4, n: 9, kind: 'photo' });
  });

  // ================================================================== the Hare on its pile cluster
  stage('hare', () => {
    const m = MONUMENTS.find((q) => q.id === 'n1521079740'), x = m ? m.x : -1600, z = m ? m.z : -2218.8, wy = -3.4, top = wy + 1.9;
    for (const [dx, dz, h] of [[0, 0, 0.45], [0.34, 0.05, 0], [-0.3, 0.16, 0], [0.12, 0.34, 0], [-0.14, -0.32, 0], [0.26, -0.26, 0], [-0.34, -0.14, 0]]) P.col(M.timber, x + dx, z + dz, -6, top + h, 0.17, 0.17, 8, true);
    P.col(M.iron, x, z, top - 0.5, top - 0.38, 0.56, 0.56, 10, false);
    const sm = M.col('#c9ccd0', 'hare'), y = top + 0.45, sph = new THREE.SphereGeometry(1, 10, 8), E = (ex, ey, ez, rx, ry, rz, rot = 0) => P.geo(sm, sph, x + ex, y + ey, z + ez, rot, 0, 0, rx, ry, rz);
    E(0, 0.2, 0, 0.11, 0.19, 0.12); E(0, 0.42, 0.04, 0.075, 0.085, 0.09); E(0, 0.4, 0.12, 0.035, 0.035, 0.05);          // body, head, muzzle
    for (const sx of [-1, 1]) { P.geo(sm, sph, x + sx * 0.035, y + 0.56, z - 0.02, -0.15, 0, sx * 0.12, 0.022, 0.1, 0.03); E(sx * 0.07, 0.03, 0.06, 0.04, 0.03, 0.09); E(sx * 0.05, 0.26, 0.11, 0.025, 0.07, 0.025, 0.5); }
    E(0, 0.08, -0.12, 0.04, 0.04, 0.04);
    sph.dispose();
    svc.monuments.push({ id: 'n1521079740', name: 'Зайчик, спасшийся от наводнения', x, z, h: 0.6 });
  });

  // ================================================================== guns of the Naryshkin yard, sentry boxes, half-spheres of the square
  stage('props', () => {
    const og = M.col('#4d5a47', 'gun'), dk = M.col('#2c302c', 'gunDark');
    const gun = (x, z, rot) => {
      P.push(x, 0, z, rot);
      for (const sx of [-1, 1]) { const wg = new THREE.CylinderGeometry(0.52, 0.52, 0.22, 14); P.geo(dk, wg, sx * 0.95, 0.52, 0, 0, 0, Math.PI / 2); wg.dispose(); P.cyl(og, [sx * 0.3, 0.5, -0.2], [sx * 1.25, 0.12, -3.6], 0.09, 0.09, 6, true); }
      P.box(og, -0.75, 0.75, 0.42, 0.72, -0.5, 0.5, '', 1); P.box(og, -1.05, 1.05, 0.7, 1.75, 0.3, 0.36, '', 1);
      P.cyl(og, [0, 1.05, -0.9], [0, 2.25, 3.3], 0.11, 0.085, 10, true); P.cyl(dk, [0, 2.2, 3.15], [0, 2.38, 3.65], 0.15, 0.15, 8, true); P.cyl(og, [0, 0.95, -1.2], [0, 1.3, 0.2], 0.18, 0.16, 8, true);
      P.pop(); ph.addBox(x, z, 2.4, 4.2, rot, 0, 1.6);
    };
    const yard = [-1896, -1812];
    for (const id of ['n10120577108', 'n10120577109', 'n10120577110', 'n10120577111', 'n10120577112', 'n10120577113']) { const m = MONUMENTS.find((q) => q.id === id); if (m) gun(m.x, m.z, Math.atan2(m.x - yard[0], m.z - yard[1])); }
    svc.crowd.push({ x: yard[0], z: yard[1], r: 9, n: 14, kind: 'photo' });
    // striped sentry boxes at the gates and the cathedral (black / white chevrons)
    const stripe = ctx.mat.toon('#ffffff', { map: M.tex(128, 256, 'sentry', (g, w, h) => { g.fillStyle = '#f0efe8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1c1e'; for (let i = -4; i < 10; i++) { g.beginPath(); g.moveTo(0, i * 48); g.lineTo(w / 2, i * 48 + 32); g.lineTo(w, i * 48); g.lineTo(w, i * 48 + 22); g.lineTo(w / 2, i * 48 + 54); g.lineTo(0, i * 48 + 22); g.closePath(); g.fill(); } }), name: 'lmFort-sentry' });
    const box = (x, z, rot) => { P.push(x, 0, z, rot); for (const [a, b, c, d, n] of [[[-0.55, -0.5], [0.55, -0.5], 0, 0, [0, 0, -1]], [[0.55, -0.5], [0.55, 0.5], 0, 0, [1, 0, 0]], [[-0.55, 0.5], [-0.55, -0.5], 0, 0, [-1, 0, 0]]]) { void c; void d; P.quad(stripe, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], 2.3, b[1]], [a[0], 2.3, a[1]], n); } P.fan(M.col('#2c2c2e', 'sentryRoof'), [[-0.7, 2.3, 0.6], [0.7, 2.3, 0.6], [0, 2.75, 0]], [0, 0.5, 0.8]); P.fan(M.col('#2c2c2e', 'sentryRoof'), [[0.7, 2.3, -0.6], [-0.7, 2.3, -0.6], [0, 2.75, 0]], [0, 0.5, -0.8]); P.fan(M.col('#2c2c2e', 'sentryRoof'), [[0.7, 2.3, 0.6], [0.7, 2.3, -0.6], [0, 2.75, 0]], [0.8, 0.5, 0]); P.fan(M.col('#2c2c2e', 'sentryRoof'), [[-0.7, 2.3, -0.6], [-0.7, 2.3, 0.6], [0, 2.75, 0]], [-0.8, 0.5, 0]); P.pop(); ph.addBox(x, z, 1.2, 1.1, rot, 0, 2.6); };
    const gp = GATES.find((g) => g.key === 'petrovsky'), gn = GATES.find((g) => g.key === 'nevsky');
    box(gp.inner[0] + gp.d[0] * 1.6 + gp.t[0] * 4.0, gp.inner[1] + gp.d[1] * 1.6 + gp.t[1] * 4.0, Math.atan2(gp.d[0], gp.d[1]));
    box(gn.inner[0] + gn.d[0] * 1.6 + gn.t[0] * 4.2, gn.inner[1] + gn.d[1] * 1.6 + gn.t[1] * 4.2, Math.atan2(gn.d[0], gn.d[1]));
    box(-1970.6 - U[0] * 16 - V[0] * 13, -1970.0 - U[1] * 16 - V[1] * 13, Math.atan2(-U[0], -U[1]));
    // stone half-spheres along the edge of the Cathedral square in front of the west front
    const hs = new THREE.SphereGeometry(0.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), c0 = [-1970.6 - U[0] * 38, -1970.0 - U[1] * 38];
    for (let i = -9; i <= 9; i++) { const x = c0[0] + V[0] * i * 3.4 - U[0] * Math.abs(i) * 0.5, z = c0[1] + V[1] * i * 3.4 - U[1] * Math.abs(i) * 0.5; if (free(x, z, 1)) { P.geo(M.stoneGrey, hs, x, 0.02, z); ph.addCylinder(x, z, 0.36, 0, 0.4); } }
    hs.dispose();
  });

  // ================================================================== the roof walk ("Neva panorama") and its stairs
  stage('roofwalk', () => {
    const w = 2.4, pts = ROOF_WALK, y = WALK_Y;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx);
      P.push(a[0], 0, a[1], rot);
      P.box(M.plank, -w / 2, l + w / 2, y - 0.12, y, -w / 2, w / 2, '', 2);
      for (let s = 0; s <= l; s += 3) for (const sg of [-1, 1]) { P.box(M.timberDark, s - 0.07, s + 0.07, 9.2, y - 0.12, sg * (w / 2 - 0.15) - 0.07, sg * (w / 2 - 0.15) + 0.07, 'tb', 1); P.box(M.white, s - 0.04, s + 0.04, y, y + 1.1, sg * (w / 2 - 0.05) - 0.04, sg * (w / 2 - 0.05) + 0.04, 'b', 1); }
      for (const sg of [-1, 1]) for (const h of [0.55, 1.1]) P.box(M.white, 0, l, y + h - 0.05, y + h, sg * (w / 2 - 0.05) - 0.03, sg * (w / 2 - 0.05) + 0.03, '', 1);
      P.pop();
      ph.addWalkBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l + w, w, rot, y, 9.0);
      for (const sg of [-1, 1]) ph.addBox((a[0] + b[0]) / 2 - dz / l * sg * (w / 2 + 0.1), (a[1] + b[1]) / 2 + dx / l * sg * (w / 2 + 0.1), l - w, 0.15, rot, y, y + 1.3);
    }
    // the timber stairs from the yard: 40 steps, railings; a landing joins them to the walk at the tower
    const s = STAIR, dx = s.b[0] - s.a[0], dz = s.b[1] - s.a[1], l = Math.hypot(dx, dz), n = 42, rot = Math.atan2(-dz, dx);
    P.push(s.a[0], 0, s.a[1], rot);
    for (let i = 0; i < n; i++) P.box(M.plank, i * l / n, (i + 1) * l / n + 0.04, (i + 1) * y / n - 0.1, (i + 1) * y / n, -1.1, 1.1, '', 2);
    for (const sg of [-1, 1]) { P.quad(M.timberDark, [0, -0.2, sg * 1.1], [l, y - 0.3, sg * 1.1], [l, y, sg * 1.1], [0, 0.25, sg * 1.1], [0, 0, sg]); P.cyl(M.white, [0, 1.1, sg * 1.1], [l, y + 1.1, sg * 1.1], 0.04, 0.04, 5, false); for (let k = 0; k <= 8; k++) P.box(M.white, k * l / 8 - 0.04, k * l / 8 + 0.04, k * y / 8, k * y / 8 + 1.1, sg * 1.1 - 0.04, sg * 1.1 + 0.04, 'b', 1); for (let k = 1; k < 8; k += 2) P.box(M.timberDark, k * l / 8 - 0.08, k * l / 8 + 0.08, 0, k * y / 8 - 0.1, sg * 1.0 - 0.08, sg * 1.0 + 0.08, 'tb', 1); }
    P.pop();
    ph.addStairs((s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2, 2.2, l, Math.atan2(dx, dz), 0, y, n);
    for (const sg of [-1, 1]) ph.addBox((s.a[0] + s.b[0]) / 2 - dz / l * sg * 1.2, (s.a[1] + s.b[1]) / 2 + dx / l * sg * 1.2, l, 0.15, rot, 0, y + 1.3);
    const j = pts[0], jl = Math.hypot(j[0] - s.b[0], j[1] - s.b[1]), jr = Math.atan2(-(j[1] - s.b[1]), j[0] - s.b[0]);
    P.push(s.b[0], 0, s.b[1], jr); P.box(M.plank, -0.05, jl + 1.2, y - 0.12, y, -1.3, 1.3, '', 2); P.pop();
    { const ux = (j[0] - s.b[0]) / jl, uz = (j[1] - s.b[1]) / jl, c = [s.b[0] + ux * (jl + 1.15) / 2, s.b[1] + uz * (jl + 1.15) / 2]; ph.addWalkBox(c[0], c[1], jl + 1.25, 2.8, jr, y, 9.0); }
    svc.roofWalk = { pts, y, stair: s };
    svc.photoSpots.push({ x: -1817, z: -1900.5, yaw: 150, pitch: -4, name: 'Невская панорама: вид на Дворцовую набережную' });
  });

  // ================================================================== trees
  stage('trees', () => {
    const list = [], TAU = Math.PI * 2;
    const add = (x, z, fam, s) => { if (!free(x, z, 3)) return false; for (const t of list) if (Math.hypot(t.x - x, t.z - z) < 4.2) return false; list.push({ x, z, fam, s, yaw: rng() * TAU, y: 0.02 }); return true; };
    // the main alley: two rows of limes from the Petrovsky Gate to the Cathedral square
    const gp = GATES.find((g) => g.key === 'petrovsky'), a = [gp.inner[0] + gp.d[0] * 22, gp.inner[1] + gp.d[1] * 22], b = [-1966, -1962], al = Math.hypot(b[0] - a[0], b[1] - a[1]), ax = (b[0] - a[0]) / al, az = (b[1] - a[1]) / al;
    for (let s = 0; s < al; s += 9.5) for (const sg of [-1, 1]) add(a[0] + ax * s - az * sg * 8.5, a[1] + az * s + ax * sg * 8.5, s % 19 < 9 ? 'limeA' : 'limeB', 0.95 + rng() * 0.25);
    // lawns and gardens: scattered by kind (the Commandant's garden and the ravelins are the densest)
    const ids = new Set(ON_ISLAND.greens);
    const fams = ['limeA', 'limeB', 'mapleA', 'elm', 'ash', 'poplar'];
    for (const g of GREEN) {
      if (!ids.has(g.id)) continue;
      const per = g.kind === 'wood' ? 60 : g.kind === 'scrub' ? 95 : g.kind === 'park' ? 150 : g.kind === 'grass' ? 420 : 0; if (!per) continue;
      for (const p of g.polys) {
        const r = pairs(p.o); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, ar = 0; for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; ar += r[i][0] * q[1] - q[0] * r[i][1]; x0 = Math.min(x0, r[i][0]); x1 = Math.max(x1, r[i][0]); z0 = Math.min(z0, r[i][1]); z1 = Math.max(z1, r[i][1]); }
        const n = Math.min(60, Math.round(Math.abs(ar / 2) / per)), inner = offsetRing(r, -3.5);
        for (let k = 0, tries = 0; k < n && tries < n * 12; tries++) { const x = x0 + rng() * (x1 - x0), z = z0 + rng() * (z1 - z0); if (!inRing(x, z, r) || !inRing(x, z, inner)) continue; if (add(x, z, fams[(rng() * fams.length) | 0], 0.8 + rng() * 0.5)) k++; }
      }
    }
    // the Commandant's garden between the cathedral and the Neva curtain, the beach under the Catherine curtain and the Trubetskoy bastion
    for (let k = 0; k < 46; k++) add(-1960 + rng() * 150 - 20, -1935 + rng() * 60 - 5, fams[(rng() * 5) | 0], 0.9 + rng() * 0.45);
    for (let k = 0; k < 15; k++) add(-2078 + k * 8.6 + rng() * 6, -1783 + rng() * 14 + (k % 2) * 5, k % 3 ? 'poplar' : 'ash', 0.75 + rng() * 0.45);
    for (let k = 0; k < 9; k++) add(-2190 + rng() * 26, -1722 + rng() * 9 - k * 0.3, 'poplar', 0.8 + rng() * 0.3);
    plantTrees(K, list, 'lmFort-trees');
    svc.trees = list.length; K.extraTris += list.length * 60;
  });

  // ================================================================== lamps and benches (instanced)
  stage('furniture', () => {
    const lamp = partsGeos((Q) => {
      Q.col(M.ironGreen, 0, 0, 0, 0.5, 0.16, 0.11, 8, false); Q.col(M.ironGreen, 0, 0, 0.5, 3.5, 0.07, 0.05, 6, false); Q.col(M.ironGreen, 0, 0, 3.5, 3.6, 0.2, 0.2, 6, true);
      Q.col(M.lampGlass, 0, 0, 3.6, 4.15, 0.16, 0.26, 6, false); Q.col(M.ironGreen, 0, 0, 4.15, 4.4, 0.3, 0.05, 6, true); Q.col(M.ironGreen, 0, 0, 4.4, 4.55, 0.03, 0.03, 4, true);
    });
    const lm = []; for (const l of LAMPS) if (inRing(l.x, l.z, RING) && !inWall(l.x, l.z) && !L.insideBuilding(l.x, l.z, 0.4)) { lm.push(mat4(l.x, 0.02, l.z, 0, 1)); svc.lamps.push({ x: l.x, z: l.z, h: 4.5 }); ph.addCylinder(l.x, l.z, 0.2, 0, 4.5); }
    // the main alley gets its lamps even where OSM has none: every 24 m on both sides
    const gp = GATES.find((g) => g.key === 'petrovsky'), a = [gp.inner[0] + gp.d[0] * 14, gp.inner[1] + gp.d[1] * 14], b = [-1966, -1962], al = Math.hypot(b[0] - a[0], b[1] - a[1]), ax = (b[0] - a[0]) / al, az = (b[1] - a[1]) / al;
    for (let s = 6; s < al; s += 24) for (const sg of [-1, 1]) { const x = a[0] + ax * s - az * sg * 5.2, z = a[1] + az * s + ax * sg * 5.2; if (free(x, z, 1) && !svc.lamps.some((q) => Math.hypot(q.x - x, q.z - z) < 8)) { lm.push(mat4(x, 0.02, z, 0, 1)); svc.lamps.push({ x, z, h: 4.5 }); ph.addCylinder(x, z, 0.2, 0, 4.5); } }
    K.extraTris += addInstanced(ctx, root, 'lmFort-lamp', lamp, lm).tris;
    const bench = partsGeos((Q) => {
      for (let i = 0; i < 4; i++) Q.box(M.white, -0.9, 0.9, 0.42, 0.46, -0.22 + i * 0.12, -0.14 + i * 0.12, '', 1);
      for (let i = 0; i < 3; i++) Q.box(M.white, -0.9, 0.9, 0.56 + i * 0.13, 0.66 + i * 0.13, -0.3 - i * 0.03, -0.27 - i * 0.03, '', 1);
      for (const sx of [-0.8, 0.8]) { Q.box(M.iron, sx - 0.03, sx + 0.03, 0, 0.44, -0.24, 0.24, 'b', 1); Q.box(M.iron, sx - 0.03, sx + 0.03, 0.44, 0.95, -0.34, -0.26, '', 1); }
    });
    const bm = [];
    for (const f of FURNITURE) { if (f.kind !== 'bench' || !free(f.x, f.z, 0.8)) continue; const nr = L.nearestRoad ? L.nearestRoad(f.x, f.z, { maxDist: 12 }) : null; let rot = rng() * Math.PI; if (nr && nr.x != null) rot = Math.atan2(nr.x - f.x, nr.z - f.z); bm.push(mat4(f.x, 0.02, f.z, rot, 1)); svc.benches.push({ x: f.x, z: f.z, rotY: rot, len: 1.8 }); ph.addBox(f.x, f.z, 1.9, 0.7, rot, 0, 0.9); }
    K.extraTris += addInstanced(ctx, root, 'lmFort-bench', bench, bm).tris;
  });

  // ================================================================== fences, walls and hedges of the claimed OSM barriers (open at their gate nodes)
  stage('barriers', () => {
    const fence = ctx.mat.toon('#26282c', { map: M.tex(128, 128, 'fence', (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.fillRect(0, 14, w, 6); g.fillRect(0, h - 16, w, 6); for (let i = 0; i < 8; i++) { g.fillRect(i * 16 + 6, 2, 4, h - 2); g.beginPath(); g.moveTo(i * 16 + 2, 12); g.lineTo(i * 16 + 8, 0); g.lineTo(i * 16 + 14, 12); g.fill(); } }), alphaTest: 0.5, side: 'double', name: 'lmFort-fence' });
    M.cutouts.add(fence);
    const gates = BARRIER_NODES.filter((n) => /gate|entrance|sally/.test(n.kind || '') && inRing(n.x, n.z, RING));
    const gapAt = (x, z) => gates.some((g) => Math.hypot(g.x - x, g.z - z) < 2.2) || GATES.some((g) => dseg(x, z, g.outer, g.inner) < 5);
    const runs = (pts) => {                                                  // pieces of a polyline outside the gate gaps, the wall polygons and the houses: [[x, z], ...] per piece
      const out = []; let cur = null, tail = null;
      const close = () => { if (cur && tail) cur.push(tail); cur = null; tail = null; };
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ns = Math.max(1, Math.ceil(l / 1.2));
        for (let k = (i === 0 ? 0 : 1); k <= ns; k++) {
          const t = k / ns, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ok = !gapAt(p[0], p[1]) && !inWall(p[0], p[1]) && !L.insideBuilding(p[0], p[1], 0.2);
          if (!ok) { close(); continue; }
          if (!cur) { cur = [p]; out.push(cur); tail = null; } else if (k === ns) { cur.push(p); tail = null; } else tail = p;
        }
      }
      close();
      return out.filter((r) => r.length >= 2 && Math.hypot(r[r.length - 1][0] - r[0][0], r[r.length - 1][1] - r[0][1]) > 0.8);
    };
    const ids = new Set([...ON_ISLAND.barriers, ...ON_ISLAND.walls]); let n = 0; const seen = new Set();
    for (const w of [...BARRIERS, ...WALLS]) {
      if (!ids.has(w.id) || seen.has(w.id)) continue; seen.add(w.id);
      const kind = w.kind || 'fence', pts = pairs(w.pts); if (w.closed && pts.length > 2) pts.push(pts[0]);
      for (const r of runs(pts)) {
        if (kind === 'wall' || kind === 'retaining_wall') wall3D(P, r, { hw: 0.22, h: 2.3, side: M.col('#e2c488', 'yardWall'), top: M.whiteShade, tile: 3 });
        else if (kind === 'hedge') wall3D(P, r, { hw: 0.45, h: 1.1, side: M.col('#3f7a34', 'hedge'), top: M.col('#4a8a3c', 'hedgeTop'), tile: 2 });
        else for (let i = 0; i + 1 < r.length; i++) { const a = r[i], b = r[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), h = kind === 'guard_rail' ? 0.9 : 1.6; P.quad(fence, [a[0], 0.02, a[1]], [b[0], 0.02, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], null, [[0, 0], [l / 1.4, 0], [l / 1.4, 1], [0, 1]]); P.box(M.iron, a[0] - 0.05, a[0] + 0.05, 0, h + 0.1, a[1] - 0.05, a[1] + 0.05, 'b', 1); }
        for (let i = 0; i + 1 < r.length; i++) { const a = r[i], b = r[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > 0.3) ph.addBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l, 0.3, Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 0, kind === 'hedge' ? 1.1 : 2.2); }
        n++;
      }
    }
    svc.fences.push({ kind: 'osm', runs: n });
  });
  if (errs.length) throw new Error(errs.join('\n'));
}
function G_ball(P, mat, x, y, z, r) { const g = new THREE.SphereGeometry(r, 8, 6); P.geo(mat, g, x, y, z); g.dispose(); }
