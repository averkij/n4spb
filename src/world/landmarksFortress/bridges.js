// landmarksFortress/bridges.js - the two timber bridges of Zayachy Island (dossier docs/research/fortress.md sections 2, 3, 6):
//  * IOANNOVSKY BRIDGE (deck r5555259; photos refs/fortress 102-113 121): from the Ioannovsky Gate 150 m to the Kronverkskaya embankment: a causeway over the island lawn, a stone arcade at each bank,
//    seven timber-pile spans over the strait (74.66 m), plank deck with a slight hump, green cast-iron lattice railing with fasces posts, twelve green obelisk lamp standards with a hanging lantern;
//  * KRONVERKSKY BRIDGE (deck r5555211; photos 114 115 119): the humped nine-span timber bridge of 1938 (57.5 x 8.8 m): pile trestles with diagonal braces, plank deck, plain timber railing.
//    The temporary bypass bridge of 2025-26 (w1360562178) is claimed and not drawn.
// Both decks are walkable (walk ramps span by span, railing colliders).  Bridge frame: origin = the island end of the axis, local +x along the bridge, +z to the right.
import * as THREE from 'three';
import * as G from './geo.js';
import { RING, dseg, inRing } from './frame.js';

export const IOANN = { a: [-1642.25, -2117.2], b: [-1596.45, -2260.65], w: 9.8, bank0: 68, bank1: 143, hump: 0.9 };
export const KRON = { a: [-2326.35, -1912.25], b: [-2374.8, -1942.2], w: 8.8, hump: 1.6 };

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksFortress] bridges/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const lattice = ctx.mat.toon(M.C.ironGreen, { map: M.tex(256, 128, 'lattice', (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineWidth = 7; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 10, w, 10); g.fillRect(0, 26, w, 5); g.fillRect(0, h - 26, w, 5);
    g.lineWidth = 5; for (let i = -1; i < 5; i++) { g.beginPath(); g.moveTo(i * 64, 28); g.lineTo(i * 64 + 64, h - 24); g.moveTo(i * 64 + 64, 28); g.lineTo(i * 64, h - 24); g.stroke(); g.beginPath(); g.arc(i * 64 + 32, h / 2, 9, 0, 6.3); g.fill(); }
  }), alphaTest: 0.5, side: 'double', name: 'lmFort-lattice' });
  M.cutouts.add(lattice);
  const frame = (B) => { const dx = B.b[0] - B.a[0], dz = B.b[1] - B.a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L; return { L, ux, uz, rot: Math.atan2(-uz, ux), W: (s, t) => [B.a[0] + ux * s - uz * t, B.a[1] + uz * s + ux * t] }; };
  /** timber pile bent across the bridge at station s: piles from yB up to the underside yT, cap beam, diagonal braces */
  const bent = (s, hw, yT, yB = -5.2, mat = M.timberDark) => {
    for (const z of [-hw + 0.5, -hw * 0.4, hw * 0.4, hw - 0.5]) for (const dx of [-0.45, 0.45]) P.col(mat, s + dx, z, yB, yT - 0.3, 0.17, 0.17, 6, false);
    P.box(mat, s - 0.7, s + 0.7, yT - 0.55, yT - 0.25, -hw - 0.2, hw + 0.2, '', 1);
    for (const sg of [-1, 1]) { P.cyl(mat, [s, -3.2, sg * (hw - 0.5)], [s, yT - 0.6, sg * hw * 0.4 * -1 + sg * 0.0], 0.1, 0.1, 5, false); P.cyl(mat, [s - 0.45, -3.3, sg * (hw + 1.6)], [s - 0.45, yT - 0.9, sg * (hw - 0.5)], 0.14, 0.14, 5, false); }
    P.box(mat, s - 0.12, s + 0.12, -2.4, -2.15, -hw - 0.1, hw + 0.1, '', 1);
  };

  // ================================================================== IOANNOVSKY BRIDGE
  stage('ioannovsky', () => {
    const B = IOANN, F = frame(B), hw = B.w / 2, L = F.L, s0 = B.bank0, s1 = B.bank1;
    const yAt = (s) => (s <= s0 || s >= s1 ? 0.06 : 0.06 + B.hump * Math.sin(Math.PI * (s - s0) / (s1 - s0)));
    P.push(B.a[0], 0, B.a[1], F.rot);
    // causeway over the island (a low granite-kerbed sett road), then the deck over the water
    P.quad(M.cobble, [2, 0.055, -hw], [2, 0.055, hw], [s0 - 12, 0.055, hw], [s0 - 12, 0.055, -hw], [0, 1, 0], [[0, 0], [0, hw], [(s0 - 14) / 2, hw], [(s0 - 14) / 2, 0]]);
    const stA = s0 - 12, stB = s1 + 6, ns = Math.ceil((stB - stA) / 3.6);
    for (let i = 0; i < ns; i++) {
      const a = stA + (stB - stA) * i / ns, b = stA + (stB - stA) * (i + 1) / ns, ya = yAt(a), yb = yAt(b);
      P.quad(M.plank, [a, ya, -hw], [a, ya, hw], [b, yb, hw], [b, yb, -hw], [0, 1, 0], [[0, -hw / 2], [0, hw / 2], [1, hw / 2], [1, -hw / 2]].map((q) => [q[1], q[0] * 1.8 + i * 1.8]));
      for (const sg of [-1, 1]) {                                          // raised plank footways and the steel edge girder
        P.quad(M.plank, [a, ya + 0.14, sg * (hw - 1.7)], [a, ya + 0.14, sg * hw], [b, yb + 0.14, sg * hw], [b, yb + 0.14, sg * (hw - 1.7)], [0, 1, 0], [[0, i * 1.8], [0.85, i * 1.8], [0.85, i * 1.8 + 1.8], [0, i * 1.8 + 1.8]]);
        P.quad(M.timberDark, [a, ya, sg * (hw - 1.7)], [b, yb, sg * (hw - 1.7)], [b, yb + 0.14, sg * (hw - 1.7)], [a, ya + 0.14, sg * (hw - 1.7)], [0, 0, -sg]);
        P.quad(M.ironGreen, [a, ya - 0.75, sg * (hw + 0.12)], [b, yb - 0.75, sg * (hw + 0.12)], [b, yb + 0.16, sg * (hw + 0.12)], [a, ya + 0.16, sg * (hw + 0.12)], [0, 0, sg]);
      }
      P.quad(M.timberDark, [a, ya - 0.5, -hw], [b, yb - 0.5, -hw], [b, yb - 0.5, hw], [a, ya - 0.5, hw], [0, -1, 0]);
    }
    P.quad(M.plank, [stB, 0.06, -hw], [stB, 0.06, hw], [L, 0.06, hw], [L, 0.06, -hw], [0, 1, 0], [[0, 0], [hw, 0], [hw, 2], [0, 2]]);
    // railing: lattice panels + fasces posts every 2.4 m, along the whole deck
    for (const sg of [-1, 1]) {
      const np = Math.round((L - 4) / 2.4);
      for (let i = 0; i < np; i++) {
        const a = 3 + (L - 4) * i / np, b = 3 + (L - 4) * (i + 1) / np, ya = Math.max(0.06, yAt(a)) + (a > stA ? 0.14 : 0), yb = Math.max(0.06, yAt(b)) + (b > stA ? 0.14 : 0), z = sg * (hw - 0.08);
        P.quad(lattice, [a, ya, z], [b, yb, z], [b, yb + 1.05, z], [a, ya + 1.05, z], [0, 0, sg], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        P.box(M.ironGreen, a - 0.08, a + 0.08, ya, ya + 1.25, z - 0.08, z + 0.08, 'b', 1); P.box(M.ironGreen, a - 0.03, a + 0.03, ya + 1.25, ya + 1.5, z - 0.16, z + 0.16, '', 1);
      }
    }
    // twelve lamp standards (six a side): pedestal, tapered obelisk, bracket with a hanging lantern, a small eagle
    for (let k = 0; k < 6; k++) for (const sg of [-1, 1]) {
      const s = 10 + k * (L - 20) / 5, y = Math.max(0.06, yAt(s)) + (s > stA ? 0.14 : 0), z = sg * (hw - 0.45);
      P.box(M.ironGreen, s - 0.34, s + 0.34, y, y + 1.1, z - 0.34, z + 0.34, 'b', 1); P.box(M.ironGreen, s - 0.4, s + 0.4, y + 1.1, y + 1.22, z - 0.4, z + 0.4, '', 1);
      G.frustum(P, M.ironGreen, s, z, y + 1.22, y + 5.3, 4, 0.36, 0.14, Math.PI / 4, 1, 1);
      P.box(M.ironGreen, s - 0.03, s + 0.03, y + 4.5, y + 4.56, z - sg * 1.0, z, '', 1); P.cyl(M.ironGreen, [s, y + 3.9, z - sg * 0.3], [s, y + 4.5, z - sg * 0.95], 0.02, 0.02, 4, false);
      P.box(M.lampGlass, s - 0.16, s + 0.16, y + 3.85, y + 4.3, z - sg * 0.95 - 0.16, z - sg * 0.95 + 0.16, '', 1); P.box(M.ironGreen, s - 0.2, s + 0.2, y + 4.3, y + 4.4, z - sg * 0.95 - 0.2, z - sg * 0.95 + 0.2, '', 1);
      G.ball(P, M.ironGreen, s, y + 5.42, z, 0.13, 6); for (const w of [-1, 1]) P.geo(M.ironGreen, new THREE.SphereGeometry(1, 6, 4), s + w * 0.2, y + 5.5, z, 0, 0, w * 0.5, 0.24, 0.05, 0.1);
      const p = F.W(s, z); svc.lamps.push({ x: p[0], z: p[1], h: 5.4 }); ph.addCylinder(p[0], p[1], 0.4, 0, 5.5);
    }
    // stone arcades at both banks (two arches each) and the seven timber spans between them
    const arcade = (sa, sb) => {
      for (const sg of [-1, 1]) {
        const side = [[sa, -4.6], [sb, -4.6], [sb, -0.45], [sa, -0.45]], holes = [], n = 2, w = (sb - sa) / n;
        for (let k = 0; k < n; k++) { const c = sa + (k + 0.5) * w, hp = [[c - w * 0.36, -4.5]]; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; hp.push([c - Math.cos(a) * w * 0.36, -2.9 + Math.sin(a) * 1.9]); } hp.push([c + w * 0.36, -4.5]); holes.push(hp); }
        P.push(0, 0, sg * (hw + 0.1), sg > 0 ? 0 : Math.PI);
        P.face(M.stoneGrey, G.shapeOf(side.map((q) => [sg > 0 ? q[0] : -q[0], q[1]]), holes.map((h) => h.map((q) => [sg > 0 ? q[0] : -q[0], q[1]]))), 0, 2, 8);
        P.pop();
      }
      for (let k = 0; k <= 2; k++) { const c = sa + k * (sb - sa) / 2; P.box(M.stoneGrey, c - 0.9, c + 0.9, -4.6, -0.45, -hw - 0.1, hw + 0.1, 'tb', 2); }
      P.box(M.stoneGreyShade, sa, sb, -0.75, -0.45, -hw - 0.25, hw + 0.25, '', 2);
    };
    arcade(s0 - 2, s0 + 11); arcade(s1 - 11, s1 + 2);
    const t0 = s0 + 11, t1 = s1 - 11;
    for (let k = 1; k < 7; k++) { const s = t0 + (t1 - t0) * k / 7; bent(s, hw, yAt(s) - 0.2); }
    for (const [s, z] of [[t0 + (t1 - t0) * 3 / 7, -hw - 6], [t0 + (t1 - t0) * 4 / 7, -hw - 6], [t0 + (t1 - t0) * 3 / 7, hw + 6], [t0 + (t1 - t0) * 4 / 7, hw + 6]]) for (const [dx, dz] of [[0, 0], [0.5, 0.15], [0.2, 0.5]]) P.col(M.timberDark, s + dx, z + dz, -5.2, -1.6, 0.2, 0.2, 6, true);
    P.pop();
    // physics: ramps along the deck over the water (the causeway part lies on the island ground), railing colliders
    for (let i = 0; i < ns; i++) { const a = stA + (stB - stA) * i / ns, b = stA + (stB - stA) * (i + 1) / ns, c = F.W((a + b) / 2, 0); ph.addWalkRamp(c[0], c[1], B.w - 0.3, b - a + 0.05, Math.atan2(F.ux, F.uz), yAt(a), yAt(b), 1.2); }
    { const c = F.W((stB + L) / 2, 0); ph.addWalkBox(c[0], c[1], B.w - 0.3, L - stB + 0.6, Math.atan2(F.ux, F.uz), 0.06, -8); }
    for (const sg of [-1, 1]) { const c = F.W(L / 2 + 1, sg * hw); ph.addBox(c[0], c[1], L - 2, 0.35, F.rot, -1, 3.2); }
    svc.bridges.push({ key: 'ioannovsky', name: 'Иоанновский мост', a: B.a, b: B.b, w: B.w, len: L, kind: 'timber' });
    svc.photoSpots.push({ x: F.W(L - 20, 0)[0], z: F.W(L - 20, 0)[1], yaw: ctx.L.yawToward(F.W(L - 20, 0)[0], F.W(L - 20, 0)[1], B.a[0], B.a[1]), pitch: 4, name: 'Иоанновский мост и ворота' });
  });

  // ================================================================== KRONVERKSKY BRIDGE
  stage('kronverksky', () => {
    const B = KRON, F = frame(B), hw = B.w / 2 + 0.6, L = F.L, n = 9, tm = M.timberGreen;
    const yAt = (s) => 0.06 + B.hump * Math.sin(Math.PI * Math.max(0, Math.min(1, s / L)));
    P.push(B.a[0], 0, B.a[1], F.rot);
    const ns = 18;
    for (let i = 0; i < ns; i++) {
      const a = L * i / ns, b = L * (i + 1) / ns, ya = yAt(a), yb = yAt(b);
      P.quad(M.plank, [a, ya, -hw], [a, ya, hw], [b, yb, hw], [b, yb, -hw], [0, 1, 0], [[-hw / 2, i * 1.6], [hw / 2, i * 1.6], [hw / 2, i * 1.6 + 1.6], [-hw / 2, i * 1.6 + 1.6]]);
      P.quad(M.timberDark, [a, ya - 0.45, -hw], [b, yb - 0.45, -hw], [b, yb - 0.45, hw], [a, ya - 0.45, hw], [0, -1, 0]);
      for (const sg of [-1, 1]) {
        P.quad(tm, [a, ya - 0.6, sg * (hw + 0.08)], [b, yb - 0.6, sg * (hw + 0.08)], [b, yb + 0.1, sg * (hw + 0.08)], [a, ya + 0.1, sg * (hw + 0.08)], [0, 0, sg]);
        for (const [h0, h1, t] of [[1.02, 1.14, 0.09], [0.52, 0.6, 0.05]]) { const z = sg * (hw - 0.1); P.quad(tm, [a, ya + h0, z - sg * t], [b, yb + h0, z - sg * t], [b, yb + h1, z - sg * t], [a, ya + h1, z - sg * t], [0, 0, -sg]); P.quad(tm, [a, ya + h0, z + sg * t], [b, yb + h0, z + sg * t], [b, yb + h1, z + sg * t], [a, ya + h1, z + sg * t], [0, 0, sg]); P.quad(tm, [a, ya + h1, z - t], [b, yb + h1, z - t], [b, yb + h1, z + t], [a, ya + h1, z + t], [0, 1, 0]); }
        P.box(tm, a - 0.08, a + 0.08, ya, ya + 1.2, sg * (hw - 0.1) - 0.08, sg * (hw - 0.1) + 0.08, 'b', 1);
      }
    }
    for (let k = 1; k < n; k++) { const s = L * k / n; bent(s, hw - 0.4, yAt(s) - 0.15); }
    for (const s of [0, L]) P.box(M.stoneGrey, s - 1.2, s + 1.2, -4.6, 0.02, -hw - 0.6, hw + 0.6, 'tb', 2);           // abutments
    P.pop();
    for (let i = 0; i < ns; i++) { const a = L * i / ns, b = L * (i + 1) / ns, c = F.W((a + b) / 2, 0); ph.addWalkRamp(c[0], c[1], 2 * hw - 0.3, b - a + 0.05, Math.atan2(F.ux, F.uz), yAt(a), yAt(b), 1.2); }
    for (const sg of [-1, 1]) { const c = F.W(L / 2, sg * hw); ph.addBox(c[0], c[1], L + 1, 0.35, F.rot, -1, 4.2); }
    svc.bridges.push({ key: 'kronverksky', name: 'Кронверкский мост', a: B.a, b: B.b, w: B.w, len: L, kind: 'timber' });
  });
  void RING; void dseg; void inRing;
  if (errs.length) throw new Error(errs.join('\n'));
}
