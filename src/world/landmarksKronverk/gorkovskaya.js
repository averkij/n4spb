// landmarksKronverk/gorkovskaya.js - the surface pavilion of the GORKOVSKAYA metro station (2009, "the flying saucer"; OSM w85416499: a circle of radius 23.3 m round (-1818.0, -2643.1)).
// Dossier docs/research/kronverk.md section 5; photos refs/kronverk 53 54.  A brown granite stylobate 1.4 m high with two flights of steps (entrance: north, exit: east, at the OSM nodes), a recessed glazed
// drum, blue V struts, the bronze-brown lens-shaped disc with a flat top and eight pairs of dark windows in its upper slope, steel rails, the plain blue "M" pylon.
// The vestibule INSIDE the drum belongs to the metro module (metro/st-gork.js): with `metro` in the build the two door bays are open (4.4 m), the stylobate top is a ring and the walkable top an annulus
// R 13.3 .. 22.5; without it the pavilion is closed (door glass, solid drum).  ctx.services.landmarksKronverk.metro publishes the centre, the levels, both doors, their normals and `closed`.
import * as THREE from 'three';
import { ENTRANCES } from '../data/city.js';
import * as G from './geo.js';
import { byId, pairs, centroid, rotOut } from './frame.js';

export function build(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const rec = byId('w85416499'); if (!rec) throw new Error('gorkovskaya: w85416499 missing');
  const ring = pairs(rec.polys[0].o), c = centroid(ring), cx = c[0], cz = c[1];
  const RS = 22.6, YS = 1.4, RD = 13.4, YD = 5.3, RR = 21.2;
  const ent = ENTRANCES.find((e) => e.id === 'n990212227') || { x: -1820.6, z: -2666.4 }, exi = ENTRANCES.find((e) => e.id === 'n946973293') || { x: -1795.7, z: -2649.9 };
  const dirTo = (p) => { const dx = p.x - cx, dz = p.z - cz, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  const dE = dirTo(ent), dX = dirTo(exi);
  // ---------------------------------------------------------------- stylobate
  G.tube(P, M.graniteBrown, cx, cz, 0, YS, RS, RS, 48, 36, 0.7);
  // the top is a RING from the drum to the edge: the vestibule floor inside the drum (y 1.45) and the mouth of the incline belong to the metro module
  for (let i = 0; i < 48; i++) { const t0 = i / 48 * 6.2832, t1 = (i + 1) / 48 * 6.2832, p = (t, r) => [cx + Math.sin(t) * r, YS, cz + Math.cos(t) * r], a = p(t0, RD - 0.05), b = p(t1, RD - 0.05), c2 = p(t1, RS), d2 = p(t0, RS); P.quad(M.slab, a, b, c2, d2, [0, 1, 0], [[a[0] / 2, a[2] / 2], [b[0] / 2, b[2] / 2], [c2[0] / 2, c2[2] / 2], [d2[0] / 2, d2[2] / 2]]); }
  G.tube(P, M.graniteGreyFlat, cx, cz, YS - 0.12, YS + 0.02, RS + 0.12, RS + 0.12, 48, 1, 1);
  // steps at the entrance and at the exit: 8 treads 0.35 m, 10 m wide, cut into nothing: they stand before the stylobate
  const NS = 8, run = 0.36, SW = 10;
  const stairs = (d, key) => {
    const rot = rotOut(d[0], d[1]), r0 = RS;
    P.push(cx + d[0] * r0, 0, cz + d[1] * r0, rot);
    for (let i = 0; i < NS; i++) P.box(M.graniteBrown, -SW / 2, SW / 2, 0, YS - i * YS / NS, i === 0 ? -0.9 : i * run, (i + 1) * run, 'b', 2);
    for (const s of [-1, 1]) { P.box(M.graniteBrown, s * SW / 2 - 0.25, s * SW / 2 + 0.25, 0, YS + 0.15, -0.4, NS * run + 0.3, 'b', 2); P.cyl(M.steel, [s * (SW / 2), YS + 1.0, 0], [s * (SW / 2), 0.95, NS * run + 0.2], 0.03, 0.03, 5, false); for (const z of [0, NS * run + 0.2]) P.cyl(M.steel, [s * SW / 2, z ? 0.1 : YS + 0.15, z], [s * SW / 2, z ? 0.95 : YS + 1.0, z], 0.03, 0.03, 5, false); }
    P.cyl(M.steel, [0, YS + 0.9, 0], [0, 0.85, NS * run + 0.2], 0.03, 0.03, 5, false);
    P.pop();
    const mid = r0 + NS * run / 2;
    ph.addStairs(cx + d[0] * mid, cz + d[1] * mid, SW, NS * run, rot + Math.PI, 0, YS, NS); ph.addWalkBox(cx + d[0] * (RS - 1.4), cz + d[1] * (RS - 1.4), SW, 3.0, rot, YS, 0);
    return { key, x: cx + d[0] * (RD + 0.3), z: cz + d[1] * (RD + 0.3), nx: d[0], nz: d[1], rotY: rot, w: 6.5, y: YS, foot: [cx + d[0] * (r0 + NS * run + 1.5), cz + d[1] * (r0 + NS * run + 1.5)] };
  };
  const doorE = stairs(dE, 'entrance'), doorX = stairs(dX, 'exit');
  // ---------------------------------------------------------------- the glazed drum with door bays toward the entrance and the exit
  // The metro module builds its vestibule INSIDE the drum (docs/research/petro-requests-metro.md): when it is in the build the two door bays (4.4 m, centred on the door directions) are open
  // below the lintel (y 3.9) and the drum collider is a ring of wall pieces; without the metro module the pavilion stays closed (door glass drawn, one solid cylinder).
  const open = !ctx.buildList || ctx.buildList.includes('metro');
  const SEG = 36, TWO = Math.PI * 2, half = Math.asin(2.2 / RD), YL = YS + 2.5;
  const doorsA = [dE, dX].map((d) => ((Math.atan2(d[0], d[1]) % TWO) + TWO) % TWO).sort((a, b) => a - b), segs = [];
  for (let k = 0; k < doorsA.length; k++) {
    const a = doorsA[k], b = doorsA[(k + 1) % doorsA.length] + (k + 1 === doorsA.length ? TWO : 0);
    segs.push({ t0: a - half, t1: a + half, door: true });
    const w0 = a + half, w1 = b - half, n = Math.max(1, Math.ceil((w1 - w0) / (TWO / SEG)));
    for (let i = 0; i < n; i++) segs.push({ t0: w0 + (w1 - w0) * i / n, t1: w0 + (w1 - w0) * (i + 1) / n, door: false, i });
  }
  const pd = (t, r, y) => [cx + Math.sin(t) * r, y, cz + Math.cos(t) * r];
  for (const s of segs) {
    const tm = (s.t0 + s.t1) / 2, n = [Math.sin(tm), Math.cos(tm)];
    if (s.door) {
      const m = 5;                                                              // the bay follows the drum: five facets
      for (let j = 0; j < m; j++) { const a = s.t0 + (s.t1 - s.t0) * j / m, b = s.t0 + (s.t1 - s.t0) * (j + 1) / m, nn = [Math.sin((a + b) / 2), 0, Math.cos((a + b) / 2)];
        if (!open) P.quad(M.glass, pd(a, RD, YS), pd(b, RD, YS), pd(b, RD, YL), pd(a, RD, YL), nn);
        P.quad(M.glassBlue, pd(a, RD, YL + 0.15), pd(b, RD, YL + 0.15), pd(b, RD, YD), pd(a, RD, YD), nn); P.quad(M.steel, pd(a, RD + 0.02, YL), pd(b, RD + 0.02, YL), pd(b, RD + 0.02, YL + 0.15), pd(a, RD + 0.02, YL + 0.15), nn); }
      for (const t of [s.t0, s.t1]) P.cyl(M.steel, pd(t, RD + 0.03, YS), pd(t, RD + 0.03, YD), 0.07, 0.07, 4, false);
      continue;
    }
    P.quad(s.i % 6 === 2 ? M.saucerD : M.glassBlue, pd(s.t0, RD, YS), pd(s.t1, RD, YS), pd(s.t1, RD, YD), pd(s.t0, RD, YD), [n[0], 0, n[1]]);
    P.cyl(M.steel, pd(s.t0, RD + 0.03, YS), pd(s.t0, RD + 0.03, YD), 0.05, 0.05, 4, false);
    if (open) { const a = pd(s.t0, RD, 0), b = pd(s.t1, RD, 0); ph.addBox((a[0] + b[0]) / 2, (a[2] + b[2]) / 2, Math.hypot(b[0] - a[0], b[2] - a[2]) + 0.06, 0.3, Math.atan2(-(b[2] - a[2]), b[0] - a[0]), 0, YD + 4); }
  }
  // the plinth band of the drum, left out at the open doors
  for (const s of segs) { if (s.door && open) continue; const m = s.door ? 5 : 1; for (let j = 0; j < m; j++) { const a = s.t0 + (s.t1 - s.t0) * j / m, b = s.t0 + (s.t1 - s.t0) * (j + 1) / m; P.quad(M.saucerD, pd(a, RD + 0.06, YS), pd(b, RD + 0.06, YS), pd(b, RD + 0.06, YS + 0.35), pd(a, RD + 0.06, YS + 0.35), [Math.sin((a + b) / 2), 0, Math.cos((a + b) / 2)]); } }
  // ---------------------------------------------------------------- the disc: soffit, rim, upper slope with the window pairs, flat top
  G.tube(P, M.saucerD, cx, cz, YD - 0.3, YD + 0.9, RD - 0.6, RR, 48, 1, 1);
  G.tube(P, M.saucer, cx, cz, YD + 0.9, YD + 1.3, RR, RR + 0.15, 48, 1, 1);
  G.tube(P, M.saucer, cx, cz, YD + 1.3, YD + 3.5, RR + 0.15, 10.5, 48, 1, 1);
  G.tube(P, M.saucer, cx, cz, YD + 3.5, YD + 3.95, 10.5, 0.05, 48, 1, 1);
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8 * 6.2832;
    for (const s of [-1, 1]) {
      const a0 = t + s * 0.012, a1 = t + s * 0.21, ra = 18.2, rb = 15.2, ya = YD + 1.3 + (RR + 0.15 - ra) / (RR + 0.15 - 10.5) * 2.2 + 0.035, yb = YD + 1.3 + (RR + 0.15 - rb) / (RR + 0.15 - 10.5) * 2.2 + 0.035;
      const p = (q, r, y) => [cx + Math.sin(q) * r, y, cz + Math.cos(q) * r];
      P.quad(M.dark, p(a0, ra, ya), p(a1, ra, ya), p(a1, rb, yb), p(a0, rb, yb), [Math.sin(t) * 0.2, 0.97, Math.cos(t) * 0.2]);
    }
  }
  // blue V struts from the stylobate to the soffit
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12 * 6.2832; if ([dE, dX].some((d) => Math.sin(t) * d[0] + Math.cos(t) * d[1] > 0.93)) continue;
    const foot = [cx + Math.sin(t) * 16.2, YS, cz + Math.cos(t) * 16.2];
    for (const s of [-1, 1]) { const q = t + s * 0.11; P.cyl(M.blue, foot, [cx + Math.sin(q) * 18.6, YD + 0.5, cz + Math.cos(q) * 18.6], 0.13, 0.1, 6, false); }
  }
  // steel rail round the stylobate (open at the two flights)
  for (let i = 0; i < 60; i++) {
    const t0 = i / 60 * 6.2832, t1 = (i + 1) / 60 * 6.2832, tm = (t0 + t1) / 2, n = [Math.sin(tm), Math.cos(tm)];
    if ([dE, dX].some((d) => n[0] * d[0] + n[1] * d[1] > Math.cos((SW / 2 + 0.6) / RS))) continue;
    const p = (t, y) => [cx + Math.sin(t) * (RS - 0.25), y, cz + Math.cos(t) * (RS - 0.25)];
    P.cyl(M.steel, p(t0, YS), p(t0, YS + 1.0), 0.03, 0.03, 4, false); P.cyl(M.steel, p(t0, YS + 1.0), p(t1, YS + 1.0), 0.03, 0.03, 4, false); P.cyl(M.steel, p(t0, YS + 0.55), p(t1, YS + 0.55), 0.02, 0.02, 4, false);
  }
  // station name over both doors, the blue "M" pylon beside the entrance flight
  const labels = ctx.services?.labels;
  const name = M.sign('gorkovskaya', 512, 80, ['ГОРЬКОВСКАЯ'], { bg: '#6f5344', fg: '#f0e8d8', font: M.FONT.sans, pad: 0.3 });
  for (const d of [dE, dX]) {
    const rot = rotOut(d[0], d[1]), wx = cx + d[0] * (RD + 0.12), wz = cz + d[1] * (RD + 0.12);
    if (labels && !labels.reserve('w85416499', wx, YS + 3.3, wz, 5.2, 0.8, d[0], d[1], 'shop')) continue;
    P.push(cx + d[0] * (RD - 0.05), 0, cz + d[1] * (RD - 0.05), rot); P.box(M.saucerD, -2.7, 2.7, YS + 2.85, YS + 3.75, 0, 0.14, '', 1); P.quad(name, [-2.6, YS + 2.9, 0.15], [2.6, YS + 2.9, 0.15], [2.6, YS + 3.7, 0.15], [-2.6, YS + 3.7, 0.15], [0, 0, 1]); P.pop();
  }
  { const side = [-dE[1], dE[0]], px = doorE.foot[0] + side[0] * 7.5, pz = doorE.foot[1] + side[1] * 7.5, rot = rotOut(dE[0], dE[1]);
    const mm = M.sign('metroM', 128, 128, ['М'], { bg: '#f3f3f0', fg: '#1795d4', font: M.FONT.sans, pad: 0.1, scale: 0.95 });
    if (!L_onRoad(ctx, px, pz)) { P.push(px, 0, pz, rot); P.box(M.steel, -0.09, 0.09, 0, 4.2, -0.09, 0.09, 'b', 1); P.box(M.white, -0.6, 0.6, 4.2, 5.4, -0.1, 0.1, '', 1); P.quad(mm, [-0.55, 4.25, 0.105], [0.55, 4.25, 0.105], [0.55, 5.35, 0.105], [-0.55, 5.35, 0.105], [0, 0, 1]); P.quad(mm, [0.55, 4.25, -0.105], [-0.55, 4.25, -0.105], [-0.55, 5.35, -0.105], [0.55, 5.35, -0.105], [0, 0, -1]); P.pop(); ph.addCylinder(px, pz, 0.15, 0, 5.4); } }
  // ---------------------------------------------------------------- colliders and services
  for (let k = 0; k < 24; k++) { const t = (k + 0.5) / 24 * 6.2832, rm = (13.3 + RS - 0.1) / 2; ph.addWalkBox(cx + Math.sin(t) * rm, cz + Math.cos(t) * rm, 2 * (RS - 0.1) * Math.tan(Math.PI / 24) + 0.05, RS - 0.1 - 13.3, t, YS, 0); }
  if (!open) ph.addCylinder(cx, cz, RD + 0.1, 0, YD + 4);
  svc.metro = { station: 'Горьковская', line: 2, id: 'w85416499', x: cx, z: cz, rStylobate: RS, yStylobate: YS, rDrum: RD, entrance: doorE, exit: doorX, doorW: 4.4, lintelY: YL, closed: !open };
  svc.entrances.push({ x: doorE.x, z: doorE.z, rotY: doorE.rotY, name: 'Метро «Горьковская» (вход)', bldg: 'w85416499', closed: !open }, { x: doorX.x, z: doorX.z, rotY: doorX.rotY, name: 'Метро «Горьковская» (выход)', bldg: 'w85416499', closed: !open });
  svc.photoSpots.push({ x: doorE.foot[0] + dE[0] * 16, z: doorE.foot[1] + dE[1] * 16, yaw: 180, name: 'Метро «Горьковская»' });
  svc.crowd.push({ x: doorE.foot[0] + dE[0] * 3, z: doorE.foot[1] + dE[1] * 3, r: 7, n: 10, name: 'у метро «Горьковская»' }, { x: doorX.foot[0] + dX[0] * 3, z: doorX.foot[1] + dX[1] * 3, r: 6, n: 6, name: 'выход метро «Горьковская»' });
  void THREE;
}
function L_onRoad(ctx, x, z) { const net = ctx.services?.streets?.net; return net && net.cover ? net.cover(x, z, {}) > -0.6 : ctx.L.isOnRoad(x, z, 0.6); }
