// landmarksAcademy/dom.js - the HOUSE OF ACADEMICIANS (Дом академиков, the Volkov house; OSM w79566434 + the wing w975447630; 7-я линия 2/1 and Lt Schmidt emb. 1): docs/research/academy.md 7, photos da_000
// da_003 da_011 da_012 cr_da013 (the critic's re-count: the Neva front has 13 axes = 4 + 5 + 4, not the 15 of the 1757-58 state).
//   The Neva front is split into several footprint edges (a 47 m wall at v 18.1 .. 18.9 with the central three axes 0.9 m proud, u -289.4 .. -279.0): the 13 axes (pitch 3.0 / 3.5 / 3.0) are laid by
//   the global u of the front so that the bays run across the edges.  Rusticated ground floor with a mask keystone over every window, tall first-floor windows (white aedicules in the middle), shorter
//   second-floor windows, a hipped iron roof, cornice 13.8 m; the PORTICO of four fluted Doric columns of weathered stone (rough drums, #bfb4a0, c-c 3.5 m, 2.9 m in front of the projecting wall) under a dark
//   entablature and the first-floor balcony with its balustrade over the three centre axes; the low pediment over the five centre axes (apex +2.7 m above the eaves); the flood-mark plate
//   «ВЫСОТА ВОДЫ 7-го НОЯБРЯ 1824 г.» at the low window near the west corner.  Pale yellow #e8d68e, ground floor #efe3c8, orders #f1ece0.  Closed: exterior only, solid.
import * as THREE from 'three';
import * as L from '../layout.js';
import { ringEdges, onEdge, band } from './kit.js';
import { texQuad, insetRoof } from './shell.js';
import { ringFromFlat, addPolyColliders } from '../lib/massing.js';
import { ACAD, V_DIR, M as toLocal } from './frame.js';
import { baluster } from './orders.js';

const H = 13.8;
const lv = (p) => { const q = toLocal(p[0], p[1]); return [q.u, q.v]; };
const PITCH = [3, 3, 3, 3, 3.5, 3.5, 3.5, 3.5, 3.5, 3, 3, 3, 3];
export async function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, lab = ctx.services?.labels;
  const b = L.buildingById('w79566434');
  if (!b || !b.polys || !b.polys.length) { console.warn('[landmarksAcademy] House of Academicians footprint missing'); return; }
  const poly = b.polys[0], ring = ringFromFlat(poly.o), edges = ringEdges(poly, 0.3);
  const isFront = (e) => { const a = lv(e.a), c = lv(e.b); return (e.n[0] * V_DIR[0] + e.n[1] * V_DIR[1]) > 0.9 && (a[1] + c[1]) / 2 > 17.5; };
  const fronts = edges.filter(isFront);
  let FU0 = 1e9, FU1 = -1e9; for (const e of fronts) for (const p of [e.a, e.b]) { const u = lv(p)[0]; FU0 = Math.min(FU0, u); FU1 = Math.max(FU1, u); }
  const used = PITCH.reduce((s, p) => s + p, 0), m0 = Math.max(0.5, (FU1 - FU0 - used) / 2);
  const bays = []; { let u = FU0 + m0; for (const p of PITCH) { bays.push([u, u + p]); u += p; } }
  const cu = (bays[4][0] + bays[8][1]) / 2, ccu = (bays[5][0] + bays[7][1]) / 2;       // the centre of the five and of the three projecting axes
  for (const e of edges) {
    onEdge(P, e, (len, f) => {
      if (!isFront(e)) { texQuad(P, M.domWall, 0, len, 0, H, 0, Math.max(1, Math.round(len / 3.6)), H, 0, 0); return; }
      const u0 = Math.min(lv(e.a)[0], lv(e.b)[0]);
      let x = 0;
      for (const [s, t] of bays) {
        const c = (s + t) / 2; if (c < u0 || c > u0 + len) continue;
        const xs = Math.max(0, s - u0), xt = Math.min(len, t - u0);
        if (xs > x + 0.02) P.quad(M.domPlain, [x, 0, 0], [xs, 0, 0], [xs, H, 0], [x, H, 0], [0, 0, 1], [[x / 3, 0], [xs / 3, 0], [xs / 3, H / 3], [x / 3, H / 3]]);
        texQuad(P, M.domWall, xs, xt, 0, H, 0, 1, H, 0, 0); x = xt;
      }
      if (x < len - 0.02) P.quad(M.domPlain, [x, 0, 0], [len, 0, 0], [len, H, 0], [x, H, 0], [0, 0, 1], [[x / 3, 0], [len / 3, 0], [len / 3, H / 3], [x / 3, H / 3]]);
      if (x === 0) P.quad(M.domPlain, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 3, 0], [len / 3, H / 3], [0, H / 3]]);
      // the flood-mark plate at the low window of the first axis
      if (u0 <= bays[0][0] + 1 && u0 + len >= bays[0][0] + 1) {
        const px = bays[0][0] + 1.5 - u0, wx = f.x + f.xa[0] * px + e.n[0] * 0.05, wz = f.z + f.xa[1] * px + e.n[1] * 0.05;
        if (!lab || lab.reserve(b.id, wx, 1.2, wz, 0.5, 0.25, e.n[0], e.n[1], 'plate')) P.quad(M.floodPlate, [px - 0.25, 1.08, 0.04], [px + 0.25, 1.08, 0.04], [px + 0.25, 1.33, 0.04], [px - 0.25, 1.33, 0.04], [0, 0, 1]);
      }
    });
  }
  // ---- the portico and the pediment, in the academy frame (u, v)
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try {
    const vw = Math.max(...fronts.map((e) => Math.max(lv(e.a)[1], lv(e.b)[1]))), vc = vw + 2.9;           // the projecting wall at vw; the columns 2.9 m in front of it
    const cs = [ccu - 5.25, ccu - 1.75, ccu + 1.75, ccu + 5.25];
    for (const cx of cs) {
      P.box(M.domStone, cx - 0.75, cx + 0.75, 0, 0.35, vc - 0.75, vc + 0.75, 'b', 3);
      P.cyl(M.domStone, [cx, 0.35, vc], [cx, 5.1, vc], 0.62, 0.52, 20, false); P.cyl(M.domStone, [cx, 5.1, vc], [cx, 5.45, vc], 0.55, 0.7, 14, false); P.box(M.domStone, cx - 0.8, cx + 0.8, 5.45, 5.65, vc - 0.8, vc + 0.8, '', 3);
      const w = { x: ACAD.x + Math.cos(ACAD.rot) * cx + Math.sin(ACAD.rot) * vc, z: ACAD.z - Math.sin(ACAD.rot) * cx + Math.cos(ACAD.rot) * vc }; ph.addCylinder(w.x, w.z, 0.7, 0, 7.5);
    }
    P.box(M.domDark, cs[0] - 1.0, cs[3] + 1.0, 5.65, 6.55, vw - 0.02, vc + 1.0, 'b', 3);                                            // the entablature block over the columns
    P.box(M.domStone, cs[0] - 1.2, cs[3] + 1.2, 6.55, 6.8, vw - 0.02, vc + 1.2, 'b', 3);                                            // the balcony slab
    baluster(P, M, cs[0] - 1.1, cs[3] + 1.1, 6.8, vc + 1.0, { h: 1.0, ped: 0.6, step: 3.5, mat: M.domStone });
    for (let k = 0; k < 3; k++) P.box(M.domStone, ccu - 2.6 - k * 0.3, ccu + 2.6 + k * 0.3, 0, 0.45 - k * 0.15, vc + 0.9, vc + 1.7 + k * 0.4, 'b', 3);                    // the steps
    // the pediment over the five centre axes (apex 2.7 m above the eaves), set back on the roof
    const xa = bays[4][0], xb = bays[8][1], xm = (xa + xb) / 2, zp = vw - 0.25;
    P.fan(M.domPlain, [[xa + 0.4, H + 0.3, zp], [xb - 0.4, H + 0.3, zp], [xm, H + 2.7, zp]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
    for (const s of [1, -1]) {
      const xe = s > 0 ? xb : xa, run = Math.abs(xm - xe), sl = Math.hypot(run, 2.4), nx = -s * 2.4 / sl, ny = run / sl;
      P.quad(M.order, [xe, H + 0.3, zp + 0.35], [xm, H + 2.2, zp + 0.35], [xm, H + 2.7, zp + 0.35], [xe, H + 0.8, zp + 0.35], [0, 0, 1]);
      P.quad(M.roof, [xe, H + 0.8, zp + 0.4], [xm, H + 2.7, zp + 0.4], [xm, H + 2.7, zp - 6], [xe, H + 0.8, zp - 6], [nx, ny, 0], [[0, 0], [sl / 0.6, 0], [sl / 0.6, 12], [0, 12]]);
    }
    void cu;
  } finally { P.pop(); }
  band(P, edges, H - 1.3, H - 0.8, 0.08, { front: M.order, top: M.order }, { uvs: 3 });
  band(P, edges, H - 0.8, H, 0.55, { front: M.order, top: M.order, under: M.soffit }, { uvs: 3 });
  insetRoof(P, ring, H, M.domRoof, { inset: 6.0, rise: 2.8, chimney: M.chimney, cap: M.chimneyCap, chimneyStep: 10, chimneyMin: 12 });
  addPolyColliders(ctx, poly, 0, 17);
  const wing = L.buildingById('w975447630');
  if (wing && wing.polys && wing.polys.length) {
    const wp = wing.polys[0], we = ringEdges(wp, 0.3);
    for (const e of we) onEdge(P, e, (len) => texQuad(P, M.domWall, 0, len, 0, H, 0, Math.max(1, Math.round(len / 3.6)), H, 0, 0));
    band(P, we, H - 0.8, H, 0.5, { front: M.order, top: M.order, under: M.soffit }, { uvs: 3 });
    insetRoof(P, ringFromFlat(wp.o), H, M.domRoof, { inset: 3.0, rise: 1.8 });
    addPolyColliders(ctx, wp, 0, 16);
  }
  K.svc.monuments.push({ id: 'dom-akademikov', name: 'Дом академиков', x: b.cx, z: b.cz, h: 16.5, r: 0 });
  void THREE;
}
