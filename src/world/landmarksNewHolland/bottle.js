// landmarksNewHolland/bottle.js - THE BOTTLE (Бутылка, the naval prison / "арестантская башня", A. E. Staubert 1823-29, restored 2017): a ring-plan three-storey red-brick building on the west tip of the island,
// centre (-3548, 337.5), outer radius 29.4 (48 facets), courtyard radius 17.0 (24 facets) with two half-round bays projecting into the courtyard (N and S), through passages on the E-W axis, the main portal
// (white pilasters, arched upper window group, black canopy) on the east side, brown-red sheet roof (ring ridge at r 23.3) with 24 dormers and brick chimneys, café tables and a round black dais in the
// courtyard.  Dossier docs/research/new-holland.md section 6 (photos 14 19 20 21 22).  Walls follow the circles (the OSM footprint r1404157 is a 24-gon of radius 29.3); colliders per facet with the two
// passages left open.
import { BOTTLE } from './frame.js';
import * as G from './geo.js';

const TAU = Math.PI * 2;
export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics;
  const { x: CX, z: CZ } = BOTTLE, RO = 29.4, RI = 17.0, HC = 12.6;
  const NO = 48, NI = 24;
  const at = (R, th) => [CX + Math.cos(th) * R, CZ + Math.sin(th) * R];
  const frame = (R, th, w) => { const n = [Math.cos(th), Math.sin(th)], xa = [n[1], -n[0]], c = at(R, th); return { x: c[0] - xa[0] * w / 2, z: c[1] - xa[1] * w / 2, rot: Math.atan2(n[0], n[1]), n, c }; };
  const wq = (mat, x0, x1, y0, y1, z, t = 2) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / t, y0 / t], [x1 / t, y0 / t], [x1 / t, y1 / t], [x0 / t, y1 / t]]);
  const window = (xc, y0, w, h) => {
    const zg = 0.03;
    P.quad(M.glass, [xc - w / 2, y0, zg], [xc + w / 2, y0, zg], [xc + w / 2, y0 + h, zg], [xc - w / 2, y0 + h, zg], [0, 0, 1]);
    const f = 0.12, d = 0.09;
    P.box(M.white, xc - w / 2 - f, xc - w / 2, y0 - 0.06, y0 + h + f, 0, d, 'bk', 1); P.box(M.white, xc + w / 2, xc + w / 2 + f, y0 - 0.06, y0 + h + f, 0, d, 'bk', 1);
    P.box(M.white, xc - w / 2 - f, xc + w / 2 + f, y0 + h, y0 + h + f, 0, d, 'bk', 1); P.box(M.white, xc - w / 2 - f * 1.5, xc + w / 2 + f * 1.5, y0 - 0.14, y0 - 0.04, 0, d + 0.08, 'bk', 1);
    P.box(M.white, xc - 0.025, xc + 0.025, y0, y0 + h, zg, zg + 0.04, 'bk', 1); P.box(M.white, xc - w / 2, xc + w / 2, y0 + h * 0.55 - 0.025, y0 + h * 0.55 + 0.025, zg, zg + 0.04, 'bk', 1);
  };
  const rows = [1.25, 5.15, 9.05];
  const GATES = new Set([0, NO / 2]);
  // ---------------------------------------------------------------- outer wall: 48 facets
  const wO = TAU * RO / NO;
  for (let k = 0; k < NO; k++) {
    const th = k * TAU / NO, f = frame(RO * Math.cos(Math.PI / NO), th, wO + 0.01);
    P.push(f.x, 0, f.z, f.rot);
    const xc = wO / 2;
    if (GATES.has(k)) {                                                                                       // facet with an arched gateway (E: the main portal)
      const east = k === 0, gw = east ? 3.2 : 3.0, hS = east ? 3.6 : 3.3, r = gw / 2;
      const s = new K.THREE.Shape();
      s.moveTo(0, 0); s.lineTo(xc - r, 0); s.lineTo(xc - r, hS); s.absarc(xc, hS, r, Math.PI, 0, true); s.lineTo(xc + r, 0); s.lineTo(wO + 0.01, 0); s.lineTo(wO + 0.01, HC); s.lineTo(0, HC); s.lineTo(0, 0);
      P.face(M.brick, s, 0, 2, 12);
      P.box(M.stone, 0, xc - r - 0.0, 0, 1.0, 0, 0.06, 'bk', 2.4); P.box(M.stone, xc + r, wO, 0, 1.0, 0, 0.06, 'bk', 2.4);
      if (east) {                                                                                             // white pilasters, an arched window group over the portal, the black canopy
        for (const sx of [-1, 1]) P.box(M.white, xc + sx * (r + 0.55) - 0.28, xc + sx * (r + 0.55) + 0.28, 0, hS + 1.0, 0, 0.2, 'bk', 1);
        G.frameRing(P, M.white, G.archPts(xc, 0, gw + 1.7, hS + 1.8 + r, 10), G.archPts(xc, 0, gw, hS + r, 10), 0, 0.12, 1);
        G.planeShape(P, M.glass, G.archPts(xc, 5.4, 2.2, 3.4, 10), 0.02); G.frameRing(P, M.white, G.archPts(xc, 5.3, 2.8, 3.7, 10), G.archPts(xc, 5.4, 2.2, 3.4, 10), 0, 0.14, 1);
        P.box(M.white, xc - 0.03, xc + 0.03, 5.4, 8.0, 0.0, 0.1, 'bk', 1);
        P.box(M.iron, xc - 2.3, xc + 2.3, 4.55, 4.7, 0.0, 1.9, 'b', 1); P.box(M.glassLit, xc - 2.2, xc + 2.2, 4.6, 4.68, 0.02, 1.85, '', 1);
        for (const sx of [-1, 1]) P.cyl(M.iron, [xc + sx * 2.1, 0, 1.75], [xc + sx * 2.1, 4.55, 1.75], 0.04, 0.04, 6, false);
      }
      for (const row of rows.slice(east ? 2 : 1)) window(xc, row, 1.1, 1.9);
    } else {
      wq(M.brick, 0, wO, 0, HC, 0, 2);
      P.box(M.stone, 0, wO, 0, 1.0, 0, 0.06, 'bk', 2.4); P.box(M.limestone, -0.01, wO + 0.01, 1.0, 1.1, 0, 0.12, 'bk', 1);
      rows.forEach((y0, i) => window(xc, y0, 1.1, i === 0 ? 1.7 : 2.0));
    }
    P.pop();
    { const xa = [f.n[1], -f.n[0]], gw = k === 0 ? 3.2 : 3.0;
      if (!GATES.has(k)) ph.addBox(f.c[0], f.c[1], wO + 0.2, 0.9, f.rot, 0, HC + 1);
      else for (const sd of [-1, 1]) { const off = gw / 2 + (wO / 2 - gw / 2) / 2; ph.addBox(f.c[0] + xa[0] * sd * off, f.c[1] + xa[1] * sd * off, wO / 2 - gw / 2 + 0.1, 0.9, f.rot, 0, HC + 1); } }
  }
  // ---------------------------------------------------------------- courtyard wall: 24 facets, facing inward (outward normal of the solid points toward the centre)
  const wI = TAU * RI / NI;
  for (let k = 0; k < NI; k++) {
    const th = k * TAU / NI, nIn = th + Math.PI;
    const ang = th;
    // skip the bays at N (th = -90 deg) and S (th = +90): facets whose centre lies within 6 m of the bay axes are covered by the half-round drums
    const bayN = Math.abs(((ang + Math.PI / 2 + Math.PI * 3) % TAU) - Math.PI) < 0.0 ;
    void bayN; void nIn;
    const cr = RI * Math.cos(Math.PI / NI), c = at(cr, th), n = [-Math.cos(th), -Math.sin(th)], xa = [n[1], -n[0]];
    const gate = k === 0 || k === NI / 2;
    const bay = Math.abs(Math.sin(th)) > 0.97;                                                               // facets at +-90 deg are replaced by the half-round bays
    if (bay) continue;
    P.push(c[0] - xa[0] * wI / 2, 0, c[1] - xa[1] * wI / 2, Math.atan2(n[0], n[1]));
    const xc = wI / 2;
    if (gate) {
      const gw = 3.0, hS = 3.3, r = gw / 2, s = new K.THREE.Shape();
      s.moveTo(0, 0); s.lineTo(xc - r, 0); s.lineTo(xc - r, hS); s.absarc(xc, hS, r, Math.PI, 0, true); s.lineTo(xc + r, 0); s.lineTo(wI + 0.01, 0); s.lineTo(wI + 0.01, HC); s.lineTo(0, HC); s.lineTo(0, 0);
      P.face(M.brick, s, 0, 2, 12);
      rows.slice(1).forEach((y0) => window(xc, y0, 1.1, 1.9));
    } else {
      wq(M.brick, 0, wI, 0, HC, 0, 2); P.box(M.stone, 0, wI, 0, 1.0, 0, 0.06, 'bk', 2.4); P.box(M.limestone, -0.01, wI + 0.01, 1.0, 1.1, 0, 0.12, 'bk', 1);
      rows.forEach((y0, i) => { window(xc - 1.15, y0, 1.1, i === 0 ? 1.7 : 2.0); window(xc + 1.15, y0, 1.1, i === 0 ? 1.7 : 2.0); });
    }
    P.pop();
    if (!gate) ph.addBox(c[0], c[1], wI + 0.2, 0.9, Math.atan2(n[0], n[1]), 0, HC + 1);
    else for (const sd of [-1, 1]) { const off = 1.5 + (wI / 2 - 1.5) / 2; ph.addBox(c[0] + xa[0] * sd * off, c[1] + xa[1] * sd * off, wI / 2 - 1.5 + 0.1, 0.9, Math.atan2(n[0], n[1]), 0, HC + 1); }
  }
  // the two half-round bays (drums of radius 5.2 centred 18.9 m from the ring centre on the N / S axis), 14 facets each, only the inner half drawn
  for (const sgn of [-1, 1]) {
    const bx = CX, bz = CZ + sgn * 18.9, R = 5.2, nf = 14;
    for (let k = 0; k < nf; k++) {
      const th = (sgn > 0 ? Math.PI : 0) + Math.PI * (k + 0.5) / nf + 0, th2 = th;      // facing the ring centre: angles of the half facing it
      void th2;
      const a0 = (sgn > 0 ? -Math.PI : 0) + Math.PI * k / nf, a1 = a0 + Math.PI / nf, am = (a0 + a1) / 2;
      // outward normal of the drum facet: (cos am, sin am) rotated so that it points toward the ring centre side: for sgn < 0 (north bay) the inner half is z > bz
      const nx = Math.cos(am), nz = sgn < 0 ? Math.abs(Math.sin(am)) : -Math.abs(Math.sin(am)), len = Math.hypot(nx, nz);
      const n = [nx / len, nz / len], cx = bx + n[0] * R * Math.cos(Math.PI / nf), cz = bz + n[1] * R * Math.cos(Math.PI / nf), w = 2 * R * Math.sin(Math.PI / (2 * nf)) * 1.01, xa = [n[1], -n[0]];
      if (Math.hypot(cx - CX, cz - CZ) > RI + 0.5) continue;
      P.push(cx - xa[0] * w / 2, 0, cz - xa[1] * w / 2, Math.atan2(n[0], n[1]));
      wq(M.brick, 0, w, 0, HC, 0, 2); P.box(M.stone, 0, w, 0, 1.0, 0, 0.06, 'bk', 2.4);
      if (k % 2 === 1) rows.forEach((y0, i) => window(w / 2, y0, 1.0, i === 0 ? 1.6 : 1.9));
      P.pop();
      ph.addBox(cx, cz, w + 0.2, 0.9, Math.atan2(n[0], n[1]), 0, HC + 1);
    }
    // the bay's conical cap with a chimney
    const cap = [];
    for (let k = 0; k <= nf; k++) { const a = (sgn > 0 ? -Math.PI : 0) + Math.PI * k / nf; cap.push([bx + Math.cos(a) * R, bz + (sgn < 0 ? Math.abs(Math.sin(a)) : -Math.abs(Math.sin(a))) * R]); }
    for (let k = 0; k < nf; k++) P.fan(M.roofBottle, [[cap[k][0], HC, cap[k][1]], [cap[k + 1][0], HC, cap[k + 1][1]], [bx, HC + 2.4, bz]], [0, 1, 0]);
    P.box(M.brick, bx - 0.4, bx + 0.4, HC + 2.0, HC + 4.6, bz - 0.4, bz + 0.4, 'b', 1); P.box(M.white, bx - 0.5, bx + 0.5, HC + 4.6, HC + 4.8, bz - 0.5, bz + 0.5, 'b', 1);
    P.cap(M.roofBottle, [[bx - R, bz], [bx + R, bz], [bx + R, bz - sgn * 0.01], [bx - R, bz - sgn * 0.01]], HC - 0.01, true, 4);
  }
  // ---------------------------------------------------------------- cornice rings (corbel + limestone), parapet-less eaves
  const ringBand = (R, y0, y1, d, mat, n) => {
    for (let k = 0; k < n; k++) {
      const a0 = k * TAU / n, a1 = (k + 1) * TAU / n, am = (a0 + a1) / 2, nrm = [Math.cos(am), 0, Math.sin(am)];
      const p0 = at(R, a0), p1 = at(R, a1), q0 = at(R + d, a0), q1 = at(R + d, a1);
      P.quad(mat, [q0[0], y0, q0[1]], [q1[0], y0, q1[1]], [q1[0], y1, q1[1]], [q0[0], y1, q0[1]], nrm, [[0, 0], [1, 0], [1, 0.2], [0, 0.2]]);
      P.quad(mat, [q0[0], y1, q0[1]], [q1[0], y1, q1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(mat, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [q1[0], y0, q1[1]], [q0[0], y0, q0[1]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  };
  ringBand(RO, HC - 1.2, HC - 0.7, 0.1, M.brickDark, NO); ringBand(RO, HC - 0.7, HC - 0.15, 0.36, M.limestone, NO);
  ringBand(RI, HC - 1.2, HC - 0.7, -0.0001, M.brickDark, 0);
  // ---------------------------------------------------------------- the roof ring: outer slope r 29.9 -> 23.3 (ridge, +4.0), inner slope 23.3 -> 18.0, flat strip to the courtyard wall
  const RE = RO + 0.55, RM = 23.3, RRI = 18.0, RISE = 4.0, N = 48;
  const yE = HC - 0.25, yR = HC + RISE, yI = HC - 0.1;
  for (let k = 0; k < N; k++) {
    const a0 = k * TAU / N, a1 = (k + 1) * TAU / N, am = (a0 + a1) / 2;
    const e0 = at(RE, a0), e1 = at(RE, a1), r0 = at(RM, a0), r1 = at(RM, a1), i0 = at(RRI, a0), i1 = at(RRI, a1);
    const sl = RISE / (RE - RM);
    const nO = [Math.cos(am) * sl, 1, Math.sin(am) * sl], nI = [-Math.cos(am) * (RISE / (RM - RRI)), 1, -Math.sin(am) * (RISE / (RM - RRI))];
    P.quad(M.roofBottle, [e0[0], yE, e0[1]], [e1[0], yE, e1[1]], [r1[0], yR, r1[1]], [r0[0], yR, r0[1]], nO, [[a0 * RE / 2.4, 0], [a1 * RE / 2.4, 0], [a1 * RM / 2.4, (RE - RM) / 2.4], [a0 * RM / 2.4, (RE - RM) / 2.4]]);
    P.quad(M.roofBottle, [r0[0], yR, r0[1]], [r1[0], yR, r1[1]], [i1[0], yI, i1[1]], [i0[0], yI, i0[1]], nI, [[a0 * RM / 2.4, 0], [a1 * RM / 2.4, 0], [a1 * RRI / 2.4, (RM - RRI) / 2.4], [a0 * RRI / 2.4, (RM - RRI) / 2.4]]);
  }
  // flat strip between the courtyard wall tops (r 17.0) and the inner eaves circle (r 18.0)
  for (let k = 0; k < NI * 2; k++) {
    const a0 = k * TAU / (NI * 2), a1 = (k + 1) * TAU / (NI * 2);
    const p0 = at(RI - 0.05, a0), p1 = at(RI - 0.05, a1), q0 = at(RRI, a0), q1 = at(RRI, a1);
    P.quad(M.roofBottle, [p0[0], HC - 0.12, p0[1]], [p1[0], HC - 0.12, p1[1]], [q1[0], yI, q1[1]], [q0[0], yI, q0[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // ---------------------------------------------------------------- dormers (24 on the outer slope) and chimneys (12 on the ridge)
  for (let k = 0; k < 24; k++) {
    const th = (k + 0.5) * TAU / 24, R = 26.2, y = yE + (RE - R) * (RISE / (RE - RM)), c = at(R, th), rot = Math.atan2(Math.cos(th), Math.sin(th));
    P.push(c[0], y, c[1], rot);
    P.box(M.white, -0.7, 0.7, -0.4, 1.1, -0.9, 0.5, 'b', 1);
    P.quad(M.glass, [-0.5, 0.1, 0.51], [0.5, 0.1, 0.51], [0.5, 0.95, 0.51], [-0.5, 0.95, 0.51], [0, 0, 1]);
    P.fan(M.roofBottle, [[-0.85, 1.1, 0.6], [0.85, 1.1, 0.6], [0.0, 1.75, -0.2]], [0, 0.5, 0.8]); P.fan(M.roofBottle, [[-0.85, 1.1, -0.95], [0.85, 1.1, -0.95], [0.0, 1.75, -0.2]], [0, 0.5, -0.8]);
    P.fan(M.roofBottle, [[-0.85, 1.1, 0.6], [0.0, 1.75, -0.2], [-0.85, 1.1, -0.95]], [-0.8, 0.4, 0]); P.fan(M.roofBottle, [[0.85, 1.1, 0.6], [0.85, 1.1, -0.95], [0.0, 1.75, -0.2]], [0.8, 0.4, 0]);
    P.pop();
  }
  for (let k = 0; k < 12; k++) { const th = (k + 0.2) * TAU / 12, c = at(RM, th); P.box(M.brick, c[0] - 0.4, c[0] + 0.4, yR - 0.2, yR + 2.4, c[1] - 0.4, c[1] + 0.4, 'b', 1); P.box(M.white, c[0] - 0.5, c[0] + 0.5, yR + 2.4, yR + 2.6, c[1] - 0.5, c[1] + 0.5, 'b', 1); }
  // ---------------------------------------------------------------- the two through passages (E and W): corridor walls, floor, ceiling
  for (const [th, gw, hS] of [[0, 3.2, 3.6], [Math.PI, 3.0, 3.3]]) {
    const dx = Math.cos(th), dz = Math.sin(th), px = -dz, pz = dx;           // along (outward), across
    const a = at(RI, th), b = at(RO, th), hw = gw / 2;
    const ln = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const P3 = (u, v) => [a[0] + dx * u + px * v, a[1] + dz * u + pz * v];
    for (const sd of [-1, 1]) {
      const q0 = P3(0, sd * hw), q1 = P3(ln, sd * hw);
      P.quad(M.brick, [q0[0], 0, q0[1]], [q1[0], 0, q1[1]], [q1[0], hS, q1[1]], [q0[0], hS, q0[1]], [-px * sd, 0, -pz * sd], [[0, 0], [ln / 2, 0], [ln / 2, 1.6], [0, 1.6]]);
      ph.addBox((q0[0] + q1[0]) / 2 + px * sd * 0.45, (q0[1] + q1[1]) / 2 + pz * sd * 0.45, 0.9, ln, Math.atan2(dx, dz), 0, HC + 1);
    }
    const f0 = P3(0, -hw), f1 = P3(ln, -hw), f2 = P3(ln, hw), f3 = P3(0, hw);
    P.quad(M.settWarm, [f0[0], 0.03, f0[1]], [f1[0], 0.03, f1[1]], [f2[0], 0.03, f2[1]], [f3[0], 0.03, f3[1]], [0, 1, 0], [[0, 0], [ln / 2, 0], [ln / 2, 1.5], [0, 1.5]]);
    P.quad(M.stone, [f0[0], hS + 0.2, f0[1]], [f3[0], hS + 0.2, f3[1]], [f2[0], hS + 0.2, f2[1]], [f1[0], hS + 0.2, f1[1]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the roof of the passage rises with the building: nothing to add (the ring body above is hollow, closed by the roof)
    void hS;
  }
  // ---------------------------------------------------------------- courtyard floor, dais, tables
  const floor = []; for (let k = 0; k < 48; k++) floor.push(at(RI - 0.1, k * TAU / 48));
  P.cap(M.settWarm, floor, 0.03, true, 2);
  const dais = []; for (let k = 0; k < 32; k++) dais.push(at(5.8, k * TAU / 32).map((v, i) => v));
  { const cxr = CX, czr = CZ; P.cyl(M.iron, [cxr, 0.03, czr], [cxr, 0.5, czr], 5.9, 5.9, 32, true); void dais; }
  const tables = [[-9.5, -4], [-9.5, 4], [9.5, -4], [9.5, 3.5], [-4.5, -11], [4.5, 11.5], [-12, 0], [12.2, 0], [0, -11.5], [-3, 11.8]];
  for (const [tx, tz] of tables) {
    const x = CX + tx, z = CZ + tz;
    P.cyl(M.table, [x, 0.03, z], [x, 0.74, z], 0.05, 0.05, 6, false); P.cyl(M.table, [x, 0.74, z], [x, 0.78, z], 0.42, 0.42, 12, true);
    for (const a of [0.6, 3.7]) { const cx2 = x + Math.cos(a) * 0.75, cz2 = z + Math.sin(a) * 0.75; P.box(M.table, cx2 - 0.22, cx2 + 0.22, 0.42, 0.46, cz2 - 0.22, cz2 + 0.22, 'b', 1); for (const [ox, oz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) P.box(M.table, cx2 + ox - 0.015, cx2 + ox + 0.015, 0.03, 0.42, cz2 + oz - 0.015, cz2 + oz + 0.015, 'tb', 1); }
    svc.crowd.push({ x, z, r: 2.2, n: 2, kind: 'cafe' });
  }
  // ---------------------------------------------------------------- services
  svc.bottle = { x: CX, z: CZ, R: RO, r: RI, h: HC, gates: [{ x: at(RO + 1, 0)[0], z: at(RO + 1, 0)[1], yaw: -90 }, { x: at(RO + 1, Math.PI)[0], z: at(RO + 1, Math.PI)[1], yaw: 90 }] };
  svc.entrances.push({ id: 'bottle-east', x: at(RO + 0.5, 0)[0], z: at(RO + 0.5, 0)[1], rotY: Math.PI / 2, kind: 'passage' }, { id: 'bottle-west', x: at(RO + 0.5, Math.PI)[0], z: at(RO + 0.5, Math.PI)[1], rotY: -Math.PI / 2, kind: 'passage' });
  svc.monuments.push({ id: 'r1404157', name: 'Бутылка (Новая Голландия)', x: CX, z: CZ, h: HC + RISE });
  svc.photoSpots.push({ x: at(RO + 14, 0.5)[0], z: at(RO + 14, 0.5)[1], yaw: Math.round((Math.atan2(-(CX - at(RO + 14, 0.5)[0]), -(CZ - at(RO + 14, 0.5)[1]))) * 180 / Math.PI), pitch: 8, name: 'Бутылка' });
}
