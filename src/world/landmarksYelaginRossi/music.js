// landmarksYelaginRossi/music.js - the MUSIC PAVILION of Yelagin Island (Музыкальный павильон, K. I. Rossi, 1824-25; OSM w194544053; federal heritage).
// Two cubic wings joined by a deep loggia of six grey Siberian marble columns (Tuscan, plinth + torus base, echinus capital), a pair of darker marble columns on each wing under a small pediment, a half
// rotunda behind with five arches (three open to the park, two blind), tragic-mask reliefs, a grey rusticated stylobate with five granite steps and pink granite cheek blocks, a flat roof behind an attic.
// Photos refs/yelagin-park-2026/rossi 01-06; the plan from the OSM ring (frame.js).  LOCAL FRAME: u along the front, v out of the front (toward the Srednyaya Nevka), y up, origin = middle of the front edge.
// Numbers (photo scale from the wing width): floor +0.85 on a rusticated plinth, columns 3.45 m (D 0.54), entablature 1.17 m, attic 1.0 m + cap; total 6.65 m.  The player walks the loggia and the rotunda.
import * as THREE from 'three';
import { tuscan, sweep, arcPts, alongPath } from './orders.js';
import { MUSIC, toWorld } from './frame.js';
import { stairs } from './phys.js';

export const F = 0.95, HC = 3.45, YC = F + HC, YA = YC + 0.70, YD = YA + 0.22, YK = YD + 0.25, YT = YK + 1.0;
export const W = 11.1, WI = 5.05, VW = -0.80, VB = -7.6, VC = -0.55, VF = -0.15;
export const RC = -6.63, RI = 5.05, RO = 5.80;
const ARCH_DEG = [18, 54, 90, 126, 162], ARCH_OPEN = [false, true, true, true, false];
const HW = 0.95, SPR = 2.05;                                                   // arch half width and spring height above the floor
const rad = (d) => d * Math.PI / 180;
const pol = (R, th, y) => [R * Math.cos(th), y, RC - R * Math.sin(th)];        // point of the rotunda at radius R, angle th (0 = +u side, PI/2 = the back apex)

/** an arch outline in a plane (s across, y up): jamb up, round head, jamb down; n segments in the head */
const archOutline = (hw, hs, n = 8) => { const o = [[-hw, 0], [-hw, hs]]; for (let i = 1; i < n; i++) { const a = Math.PI - Math.PI * i / n; o.push([Math.cos(a) * hw, hs + Math.sin(a) * hw]); } o.push([hw, hs], [hw, 0]); return o; };

export function music(ctx, P, M, svc) {
  P.push(MUSIC.x, 0, MUSIC.z, MUSIC.rotY);
  P.far = 800;
  const colsLoggia = [-4.5, -2.7, -0.9, 0.9, 2.7, 4.5], colsWing = [-9.55, -7.25, 7.25, 9.55];

  // ---------------------------------------------------------------- stylobate, steps, floor
  P.box(M.ashlar, -11.4, -WI, 0, F, -7.9, 0, 'b', 1);
  P.box(M.ashlar, WI, 11.4, 0, F, -7.9, 0, 'b', 1);
  P.box(M.ashlar, -WI, WI, 0, F, RC, 0, 'bt', 1);                                                        // under the loggia (the floor tiles are its top)
  { const pts = arcPts(0, RC, 6.1, -6.1, 0, Math.PI, 24); sweep(P, M.ashlar, pts, [[0, 0], [0, F]], { side: 1, uvs: 1 }); sweep(P, M.granite, pts.map((p) => [p[0] * 0.95, RC + (p[1] - RC) * 0.95]), [[0.0, F]], {}); }
  { const outer = arcPts(0, RC, 6.1, -6.1, 0, Math.PI, 24), inner = arcPts(0, RC, RO, -RO, 0, Math.PI, 24); P.ribbon(M.granite, outer.map((p) => [p[0], F, p[1]]), inner.map((p) => [p[0], F, p[1]]), [0, 1, 0], 1); }
  // floor of the loggia and the rotunda (cream / grey diamond tiles)
  { const pts = [[-WI, 0], [WI, 0], [WI, RC]].concat(arcPts(0, RC, RI, -RI, 0, Math.PI, 20).slice(1, -1)).concat([[-WI, RC]]); P.cap(M.floorTile, pts, F + 0.002, true, 2); }
  // five steps on the axis (6 m wide) between pink granite cheek blocks
  for (let k = 1; k <= 5; k++) P.box(M.granite, -3.05, 3.05, 0, F - 0.142 * k, 0, 0.33 * k, 'bk', 1);
  for (const sg of [-1, 1]) {
    const x0 = sg > 0 ? 3.05 : -3.85, x1 = sg > 0 ? 3.85 : -3.05;
    P.box(M.graniteRed, x0, x1, 0, F, 0, 0.8, 'bk', 1); P.box(M.graniteRed, sg > 0 ? 3.05 : -3.75, sg > 0 ? 3.75 : -3.05, 0, 0.45, 0.8, 1.45, 'bk', 1);
  }
  // the three doors of the rotunda: a granite threshold and three low steps outside each
  ARCH_DEG.forEach((d, i) => {
    if (!ARCH_OPEN[i]) return;
    const th = rad(d), c = pol(RO + 0.0, th, 0); const rot = Math.atan2(Math.cos(th), -Math.sin(th));
    P.push(c[0], 0, c[2], rot);
    P.box(M.granite, -1.1, 1.1, F - 0.0, F + 0.0005, -0.9, 0.02, 'bk', 1);
    for (let k = 1; k <= 3; k++) P.box(M.granite, -1.1, 1.1, 0, F - 0.21 * k, 0, 0.30 * k + 0.0, 'bk', 1);
    P.pop();
  });

  // ---------------------------------------------------------------- wings (the two cubic rooms)
  for (const sg of [-1, 1]) {
    const x0 = sg > 0 ? WI : -W, x1 = sg > 0 ? W : -WI;
    P.box(M.stuccoCream, x0, x1, F, YK, VB, VW, 't', 4);
    // the wing porch: soffit under the entablature
    P.quad(M.white, [x0, YC, VW], [x1, YC, VW], [x1, YC, VF], [x0, YC, VF], [0, -1, 0]);
  }
  // the wall over the loggia opening (the beam of the entablature): its back face is seen from inside
  P.box(M.stuccoCream, -WI, WI, YC, YK, -1.0, VF - 0.2, 'tbf', 4);
  // loggia ceiling
  { const pts = [[-WI, VF], [WI, VF], [WI, RC]].concat(arcPts(0, RC, RI, -RI, 0, Math.PI, 20).slice(1, -1)).concat([[-WI, RC]]); P.cap(M.white, pts, YC, false, 4); }

  // ---------------------------------------------------------------- the rotunda wall with five arches
  rotundaWall(P, M);

  // ---------------------------------------------------------------- columns
  for (const x of colsLoggia) tuscan(P, M.marbleLight, x, VC, F, HC, 0.27, M.white);
  for (const x of colsWing) tuscan(P, M.marbleDark, x, VC, F, HC, 0.27, M.white);

  // ---------------------------------------------------------------- entablature: architrave, dentils, corona around the block and the rotunda; roof, attic
  const prof = [[0, YC], [0, YA], [0.07, YA], [0.07, YA + 0.07], [0.02, YA + 0.07], [0.02, YD], [0.42, YD], [0.42, YD + 0.2], [0.37, YK], [0.0, YK]];
  const ring = [[-5.8, VB - 0.06], [-W - 0.06, VB - 0.06], [-W - 0.06, VF], [W + 0.06, VF], [W + 0.06, VB - 0.06], [5.8, VB - 0.06]];
  sweep(P, M.stuccoCream, ring, prof, { side: 1, uvs: 4 });
  const th0 = Math.asin((-VB + RC + 0.06 * 0) / RO) * 0 + rad(9.6);
  const arcO = arcPts(0, RC, RO + 0.06, -(RO + 0.06), th0, Math.PI - th0, 22);
  sweep(P, M.stuccoCream, arcO, prof, { side: 1, uvs: 4 });
  // roof deck and the attic parapet
  { const pts = [[-W, VF - 0.05], [W, VF - 0.05], [W, VB], [5.72, VB]].concat(arcPts(0, RC, RO, -RO, th0, Math.PI - th0, 22)).concat([[-5.72, VB], [-W, VB]]); P.cap(M.roofMetal, pts, YK + 0.004, true, 2); }
  const attic = [[-W + 0.12, -0.52], [W - 0.12, -0.52], [W - 0.12, VB + 0.3], [5.4, VB + 0.3]].concat(arcPts(0, RC, RO - 0.45, -(RO - 0.45), rad(20), Math.PI - rad(20), 18)).concat([[-5.4, VB + 0.3], [-W + 0.12, VB + 0.3]]);
  sweep(P, M.stuccoCream, attic, [[0, YK], [0, YT], [0.05, YT], [0.05, YT + 0.16], [-0.42, YT + 0.16], [-0.42, YK]], { side: 1, closed: true, uvs: 4 });
  // chimneys on the roof
  for (const x of [-8.6, 8.6]) { P.box(M.stuccoCream, x - 0.4, x + 0.4, YK, YK + 1.55, -4.6, -3.8, 'b', 4); P.box(M.white, x - 0.5, x + 0.5, YK + 1.55, YK + 1.7, -4.7, -3.7, 'b', 4); }
  // pediments over the wing porches
  for (const sg of [-1, 1]) pediment(P, M, sg * 8.4, 2.25, YK, 0.82, 0.12);
  // dentils (near only) on the three runs
  P.ranged(200, () => {
    const tooth = () => alongPath(P, M.white, [[-W - 0.06, VF], [W + 0.06, VF]], 1, 0.30, { s0: 0.1, d0: 0.0, fn: (PP) => PP.box(M.white, -0.075, 0.075, YA + 0.075, YD - 0.01, 0.0, 0.075, 'bk', 1) });
    tooth();
    alongPath(P, M.white, [[-W - 0.06, VF], [-W - 0.06, VB - 0.06]], 1, 0.30, { s0: 0.4, fn: (PP) => PP.box(M.white, -0.075, 0.075, YA + 0.075, YD - 0.01, 0.0, 0.075, 'bk', 1) });
    alongPath(P, M.white, [[W + 0.06, VB - 0.06], [W + 0.06, VF]], 1, 0.30, { s0: 0.4, fn: (PP) => PP.box(M.white, -0.075, 0.075, YA + 0.075, YD - 0.01, 0.0, 0.075, 'bk', 1) });
    alongPath(P, M.white, [[-W - 0.06, VB - 0.06], [-5.8, VB - 0.06]], 1, 0.30, { s0: 0.3, fn: (PP) => PP.box(M.white, -0.075, 0.075, YA + 0.075, YD - 0.01, 0.0, 0.075, 'bk', 1) });
    alongPath(P, M.white, [[5.8, VB - 0.06], [W + 0.06, VB - 0.06]], 1, 0.30, { s0: 0.3, fn: (PP) => PP.box(M.white, -0.075, 0.075, YA + 0.075, YD - 0.01, 0.0, 0.075, 'bk', 1) });
    alongPath(P, M.white, arcO, 1, 0.30, { s0: 0.3, fn: (PP) => PP.box(M.white, -0.075, 0.075, YA + 0.075, YD - 0.01, 0.0, 0.075, 'bk', 1) });
  });

  // ---------------------------------------------------------------- reliefs, pipes, niches, plaque
  P.ranged(260, () => {
    for (const sg of [-1, 1]) P.quad(M.relief, [sg * 8.4 - 0.8, YC - 1.05, VW + 0.025], [sg * 8.4 + 0.8, YC - 1.05, VW + 0.025], [sg * 8.4 + 0.8, YC - 0.25, VW + 0.025], [sg * 8.4 - 0.8, YC - 0.25, VW + 0.025], [0, 0, 1], M.reliefUV);
    // masks between the arches on the inner face of the rotunda
    for (const d of [36, 72, 108, 144]) { const th = rad(d), a = pol(RI - 0.03, th, F + 3.0), tdx = Math.sin(th) * 0.45, tdz = Math.cos(th) * 0.45; P.quad(M.relief, [a[0] - tdx, F + 2.6, a[2] - tdz], [a[0] + tdx, F + 2.6, a[2] + tdz], [a[0] + tdx, F + 3.35, a[2] + tdz], [a[0] - tdx, F + 3.35, a[2] - tdz], [-Math.cos(th), 0, Math.sin(th)], M.reliefUV); }
    for (const x of [-10.95, -5.2, 5.2, 10.95]) P.cyl(M.iron, [x, F + 0.15, VW + 0.06], [x, YC - 0.12, VW + 0.06], 0.045, 0.045, 6, false);        // drain pipes
    P.quad(M.dark, [10.2, F + 1.75, VW + 0.02], [10.65, F + 1.75, VW + 0.02], [10.65, F + 2.3, VW + 0.02], [10.2, F + 2.3, VW + 0.02], [0, 0, 1]);        // the small plaque on the right wing
    for (const sg of [-1, 1]) niche(P, M, sg);
  });
  P.pop();

  // ---------------------------------------------------------------- physics, services
  const ph = ctx.physics;
  if (ph) {
    const rot = MUSIC.rotY, at = (u, v) => toWorld(MUSIC, u, v);
    for (const sg of [-1, 1]) { const [x, z] = at(sg * (WI + W + 0.3) / 2, -3.95); ph.addBox(x, z, W + 0.3 - WI, 7.9, rot, 0, YK + 1); }
    for (const u of colsLoggia.concat(colsWing)) { const [x, z] = at(u, VC); ph.addCylinder(x, z, 0.31, F - 0.1, YC); }
    { const [x, z] = at(0, -0.5); ph.addWalkBox(x, z, 2 * WI - 0.2, 1.0, rot, F, 0); }               // loggia floor strips
    { const [x, z] = at(0, (-0.9 + RC) / 2); ph.addWalkBox(x, z, 2 * WI, RC + 0.9 > 0 ? 0.1 : -(RC + 0.9), rot, F, 0); }
    for (let u = -4.5; u <= 4.5; u += 1.0) { const ue = Math.max(0, Math.abs(u) - 0.5), d = Math.sqrt(RI * RI - ue * ue) + 0.05, [x, z] = at(u, RC - d / 2 + 0.05); ph.addWalkBox(x, z, 1.0 + 0.02, d, rot, F, 0); }
    { const [x, z] = at(0, 0.825); stairs(ph, x, z, 6.1, 1.65, rot + Math.PI, 0, F, 6); }
    for (const sg of [-1, 1]) { const [x, z] = at(sg * 3.45, 0.4); ph.addBox(x, z, 0.8, 0.8, rot, 0, F); const [x2, z2] = at(sg * 3.4, 1.12); ph.addBox(x2, z2, 0.7, 0.66, rot, 0, 0.45); }
    // the rotunda wall: solid pieces between the openings (chords of 5 degrees), steps out of the three doors
    const half = HW / ((RI + RO) / 2);
    for (let d = 0; d < 180; d += 4) {
      const th = rad(d + 2); let inOpening = false;
      ARCH_DEG.forEach((a, i) => { if (ARCH_OPEN[i] && Math.abs(th - rad(a)) < half - 0.005) inOpening = true; });
      if (inOpening) continue;
      const R = (RI + RO) / 2, p = pol(R, th, 0), [x, z] = at(p[0], p[2]);
      ph.addBox(x, z, R * rad(4) + 0.16, RO - RI + 0.05, rot + Math.atan2(-Math.sin(th), -Math.cos(th)) * 0 + (Math.atan2(Math.cos(th), -Math.sin(th))), 0, YK + 0.5);
    }
    ARCH_DEG.forEach((a, i) => {
      if (!ARCH_OPEN[i]) return;
      const th = rad(a), c = pol(RO + 0.45, th, 0), [x, z] = at(c[0], c[2]);
      stairs(ph, x, z, 2.2, 0.9, rot + Math.atan2(-Math.cos(th), Math.sin(th)), 0, F, 3);
      const t = pol((RI + RO) / 2, th, 0), [tx, tz] = at(t[0], t[2]); ph.addWalkBox(tx, tz, 2.0, RO - RI + 0.06, rot + Math.atan2(Math.cos(th), -Math.sin(th)), F, 0);          // the threshold of the door
    });
  }
  const [mx, mz] = toWorld(MUSIC, 0, 4);
  svc.monuments.push({ id: MUSIC.id, name: 'Музыкальный павильон (К. И. Росси, 1824-25)', x: mx, z: mz, h: 6.7 });
  const [px, pz] = toWorld(MUSIC, 0, 13), [tx, tz] = toWorld(MUSIC, 0, -3);
  svc.photoSpots.push({ x: px, z: pz, yaw: yawToward(px, pz, tx, tz), name: 'Музыкальный павильон со стороны Средней Невки' });
}

const yawToward = (x0, z0, x1, z1) => { const b = Math.atan2(x1 - x0, -(z1 - z0)) * 180 / Math.PI; return ((-b + 540) % 360) - 180; };

/** the half rotunda: an annulus wall (RI .. RO) from the floor to the architrave with five arches (3 open, 2 blind), archivolts and the soffits of the doors */
function rotundaWall(P, M) {
  const Rm = (RI + RO) / 2, half = HW / Rm, yTop = YA;
  const keys = new Set([0, Math.PI]);
  ARCH_DEG.forEach((d) => { keys.add(rad(d) - half); keys.add(rad(d) + half); });
  const ks = [...keys].sort((a, b) => a - b), angs = [];
  const openAt = (th) => { for (let i = 0; i < ARCH_DEG.length; i++) if (ARCH_OPEN[i] && Math.abs(th - rad(ARCH_DEG[i])) < half + 1e-6) return i; return -1; };
  for (let i = 0; i + 1 < ks.length; i++) {
    const a = ks[i], b = ks[i + 1], mid = (a + b) / 2, n = openAt(mid) >= 0 ? 8 : Math.max(1, Math.ceil((b - a) / rad(5)));
    for (let k = 0; k < n; k++) angs.push(a + (b - a) * k / n);
  }
  angs.push(Math.PI);
  const yLow = (th) => { const i = openAt(th); if (i < 0) return F; const s = (th - rad(ARCH_DEG[i])) * Rm; return F + SPR + Math.sqrt(Math.max(0, HW * HW - s * s)) * (Math.abs(s) >= HW - 1e-6 ? 0 : 1) * 1; };
  const yLowEdge = (th, mid) => { const i = openAt(mid); if (i < 0) return F; const s = (th - rad(ARCH_DEG[i])) * Rm; return F + SPR + Math.sqrt(Math.max(0, HW * HW - Math.min(HW * HW, s * s))); };
  void yLow;
  for (let k = 0; k + 1 < angs.length; k++) {
    const a = angs[k], b = angs[k + 1], mid = (a + b) / 2, open = openAt(mid) >= 0;
    const ya = open ? yLowEdge(a, mid) : F, yb = open ? yLowEdge(b, mid) : F;
    for (const [R, sg] of [[RO, 1], [RI, -1]]) {
      const pa = pol(R, a, 0), pb = pol(R, b, 0), nrm = [Math.cos(mid) * sg, 0, -Math.sin(mid) * sg];
      P.quad(M.stuccoCream, [pa[0], ya, pa[2]], [pb[0], yb, pb[2]], [pb[0], yTop, pb[2]], [pa[0], yTop, pa[2]], nrm, [[a * R / 4, ya / 4], [b * R / 4, yb / 4], [b * R / 4, yTop / 4], [a * R / 4, yTop / 4]]);
    }
    if (open) { const i0 = pol(RI, a, 0), o0 = pol(RO, a, 0), i1 = pol(RI, b, 0), o1 = pol(RO, b, 0); P.quad(M.stuccoCream, [i0[0], ya, i0[2]], [o0[0], ya, o0[2]], [o1[0], yb, o1[2]], [i1[0], yb, i1[2]], [0, -1, 0]); }
  }
  // the jambs of the three doors
  ARCH_DEG.forEach((d, i) => {
    if (!ARCH_OPEN[i]) return;
    for (const [sgn, th] of [[1, rad(d) - half], [-1, rad(d) + half]]) {
      const pi = pol(RI, th, 0), po = pol(RO, th, 0), tn = [-Math.sin(th) * sgn, 0, -Math.cos(th) * sgn];
      P.quad(M.stuccoCream, [pi[0], F, pi[2]], [po[0], F, po[2]], [po[0], F + SPR, po[2]], [pi[0], F + SPR, pi[2]], tn, [[0, F / 4], [0.75 / 4, F / 4], [0.75 / 4, (F + SPR) / 4], [0, (F + SPR) / 4]]);
    }
    // the threshold
    const p0i = pol(RI, rad(d) - half, 0), p1i = pol(RI, rad(d) + half, 0), p0o = pol(RO, rad(d) - half, 0), p1o = pol(RO, rad(d) + half, 0);
    P.quad(M.granite, [p0i[0], F + 0.004, p0i[2]], [p1i[0], F + 0.004, p1i[2]], [p1o[0], F + 0.004, p1o[2]], [p0o[0], F + 0.004, p0o[2]], [0, 1, 0]);
  });
  // archivolts (a moulded band 0.17 m wide round every arch, inside and out); blind arches get a slightly recessed field
  P.ranged(400, () => {
    ARCH_DEG.forEach((d) => {
      const th = rad(d), out = archOutline(HW, SPR, 8);
      for (const [R, sg, dR] of [[RO, 1, 0.03], [RI, -1, -0.03]]) {
        const ptsIn = [], ptsOut = [];
        out.forEach(([s, y], idx) => {
          const t0 = idx === 0 || idx === out.length - 1, grow = 0.17;
          const nx = idx < 2 ? -1 : idx >= out.length - 2 ? 1 : 0;               // jamb points widen sideways, the head points widen radially
          let s2 = s, y2 = y;
          if (idx <= 1) s2 = s - grow; else if (idx >= out.length - 2) s2 = s + grow; else { const ang = Math.atan2(y - SPR, s); s2 = s + Math.cos(ang) * grow; y2 = y + Math.sin(ang) * grow; }
          void t0; void nx;
          ptsIn.push([s, y]); ptsOut.push([s2, y2]);
        });
        const at = (s, y) => pol(R + dR * sg, th + s / R, F + y);
        for (let i = 0; i + 1 < out.length; i++) {
          const a0 = at(...ptsIn[i]), a1 = at(...ptsIn[i + 1]), b1 = at(...ptsOut[i + 1]), b0 = at(...ptsOut[i]);
          P.quad(M.white, a0, a1, b1, b0, [Math.cos(th) * sg, 0, -Math.sin(th) * sg]);
        }
      }
    });
  });
}

/** a small pediment of the wing porch: the tympanum, the raking cornice, a metal-clad top */
function pediment(P, M, uc, hw, y0, rise, zf) {
  const apex = y0 + rise, zt = zf - 0.12;
  P.fan(M.stuccoCream, [[uc - hw + 0.18, y0, zt], [uc + hw - 0.18, y0, zt], [uc, apex - 0.12, zt]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
  for (const sg of [-1, 1]) {
    const base = [uc + sg * hw, y0 + 0.02, zf + 0.04], top = [uc, apex + 0.04, zf + 0.04];
    P.beam(M.white, [base, top], 0.62, 0.17, [0, 0, 1], 1);
    // the sheet-metal roof of the pediment: two slopes from the raking cornice back to the attic
    P.quad(M.roofMetal, [uc + sg * (hw + 0.05), y0 + 0.14, zf + 0.18], [uc, apex + 0.18, zf + 0.18], [uc, apex + 0.34, zf - 0.72], [uc + sg * (hw + 0.05), y0 + 0.30, zf - 0.72], [sg * 0.2, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // the corona under the raking cornice
  P.box(M.white, uc - hw - 0.1, uc + hw + 0.1, y0, y0 + 0.08, zf - 0.55, zf + 0.20, 'b', 1);
}

/** an arched niche with a balustrade in the outer end wall of a wing (photo rossi 01): a recessed pale panel in a moulded frame */
function niche(P, M, sg) {
  const x = sg * (W + 0.002), rot = sg > 0 ? Math.PI / 2 : -Math.PI / 2;
  P.push(x, 0, -4.0, rot);                                                 // local +z = outward of the end wall
  const out = archOutline(0.78, 1.85, 8);
  const poly = out.map(([s, y]) => [s, F + 0.75 + y, 0.012]);
  P.fan(M.stuccoGrey, poly, [0, 0, 1], (p) => [p[0], p[1]]);
  for (let i = 0; i + 1 < out.length; i++) {
    const ang0 = i <= 0 || i >= out.length - 2 ? 0 : 0;
    const a = out[i], b = out[i + 1];
    const wa = i === 0 ? [-1, 0] : (i === out.length - 2 ? [1, 0] : [a[0] - 0, a[1] - 1.85]), wb = [b[0], b[1] - 1.85];
    const grow = (p, isHead) => { if (!isHead) return [p[0] + (p[0] < 0 ? -0.14 : 0.14), p[1]]; const l = Math.hypot(p[0], p[1] - 1.85) || 1; return [p[0] + p[0] / l * 0.14, p[1] + (p[1] - 1.85) / l * 0.14]; };
    const headA = i > 0 && i < out.length - 2, headB = i + 1 > 0 && i + 1 < out.length - 1 && i + 1 > 1;
    void ang0; void wa; void wb;
    const A = out[i], B = out[i + 1], A2 = grow(A, headA || i === 1), B2 = grow(B, headB || i + 1 === out.length - 2);
    P.quad(M.white, [A[0], F + 0.75 + A[1], 0.03], [B[0], F + 0.75 + B[1], 0.03], [B2[0], F + 0.75 + B2[1], 0.03], [A2[0], F + 0.75 + A2[1], 0.03], [0, 0, 1]);
  }
  // the balustrade: rails and eight small balusters in front of the lower part of the niche
  P.box(M.white, -0.9, 0.9, F + 0.0, F + 0.08, 0.0, 0.24, 'b', 1); P.box(M.white, -0.9, 0.9, F + 0.68, F + 0.78, 0.0, 0.26, 'b', 1);
  for (let k = 0; k < 7; k++) P.col(M.white, -0.72 + k * 0.24, 0.12, F + 0.08, F + 0.68, 0.05, 0.05, 6, false);
  P.pop();
}
