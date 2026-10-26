// landmarksNewHolland/warehouses.js - the three red-brick timber warehouse wings of New Holland (Chevakinsky 1765-80 / Vallin de la Mothe 1787-88), on their baked OSM footprints:
//   Dom 12 (litera I, r3164896, along the Kryukov canal), litera N (w97821643, parallel to the Moika, west of the Arch), litera O (w97821653, Moika wing + Kryukov wing, the rounded Pasypkin corner).
// Facade grammar (dossier 5, photos 10, 44, 45, 26, 27): red brick walls, limestone plinth 2 m, the PARK walls carry an arcade of giant round arches (4.2 m wide, crown 6.1 m, pitch ~6.2 m) with
// radial brick voussoirs, chevron-patterned piers, black steel glazing recessed 0.8 m and a half-round lunette above every arch; the OUTER walls (Moika / canal side) are blind brick with tall boarded
// arched windows; limestone cornice at 13.2 m; hipped graphite sheet roofs (ridge 20 m) built on the convex pieces of each footprint (roofs.js); brown downpipes.  The two Arch pylons are drawn by arch.js
// (edges inside the arch block are skipped here).  Wall colliders = lib/massing addPolyColliders.
import * as THREE from 'three';
import { BUILDINGS } from '../data/city.js';
import { addPolyColliders } from '../lib/massing.js';
import { ringEdges, onEdge, band } from './kit.js';
import { RING, inRing, toArch, EAVES, RIDGE } from './frame.js';
import { hipRoof, hull } from './roofs.js';
import * as G from './geo.js';

const byId = (id) => BUILDINGS.find((b) => b.id === id);
const pairs = (f) => { const r = []; for (let i = 0; i < f.length; i += 2) r.push([f[i], f[i + 1]]); return r; };
const ARCH_BLOCK = (x, z) => { const a = toArch(x, z); return Math.abs(a.u) <= 18 && a.v >= -14.5 && a.v <= 7; };

/** roof pieces per building (hulls of vertex subsets, world coordinates) */
const PIECES = {
  r3164896: (v) => [hull(v)],
  w97821643: (v) => [hull([v[2], v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[0], v[1]].filter(Boolean).concat([[-3425, 398.2]])), hull([[-3426.2, 401.2], [-3425, 398.2], v[11], v[12], v[13], v[0], v[1], v[2]])],
  w97821653: (v) => [hull([v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[13], v[14], v[15], v[16], v[17]]), hull([v[6], v[7], v[8], v[9], v[10], v[11], v[12], v[13]])],
};

export function build(K) {
  const { ctx, M, P, svc } = K, ph = ctx.physics;
  const mineRecs = ['r3164896', 'w97821643', 'w97821653'].map(byId).filter(Boolean);
  const bottle = byId('r1404157'), comm = byId('r3164895');
  const others = [bottle, comm].filter(Boolean).map((b) => pairs(b.polys[0].o));
  const inOthers = (x, z) => others.some((r) => inRing(x, z, r));
  const stats = { bays: 0, edges: 0 };
  svc.parkEdges = [];
  for (const rec of mineRecs) {
    const poly = rec.polys[0];
    const ringPts = pairs(poly.o);
    const edges = ringEdges(poly, 0.3);
    const myRings = mineRecs.map((r) => pairs(r.polys[0].o));
    const kinds = edges.map((e) => {
      const mx = (e.a[0] + e.b[0]) / 2, mz = (e.a[1] + e.b[1]) / 2;
      if (ARCH_BLOCK(e.a[0], e.a[1]) && ARCH_BLOCK(e.b[0], e.b[1])) return 'arch';
      const px = mx + e.n[0] * 7, pz = mz + e.n[1] * 7;
      if (!inRing(px, pz)) return e.len < 14 ? 'end' : 'outer';
      if (inOthers(px, pz) || myRings.some((r, i) => mineRecs[i] !== rec && inRing(px, pz, r))) return 'party';
      return e.len < 14 ? 'end' : 'park';
    });
    edges.forEach((e, i) => { e.kind = kinds[i]; });
    // ---- facades
    for (const e of edges) {
      if (e.kind === 'arch' || e.kind === 'party' || e.len < 0.5) continue;
      stats.edges++;
      if (e.kind === 'park') svc.parkEdges.push({ a: e.a, b: e.b, n: e.n, len: e.len });
      onEdge(P, e, (len) => {
        if (e.kind === 'park') stats.bays += arcade(K, len, EAVES);
        else if (rec.id === 'w97821653' && e.len > 7 && e.len < 10.5 && e.a[0] > -3258 && e.b[0] > -3258 && e.a[1] > 465) { wallBlind(K, len, EAVES, false); pasypkin(K, len); }
        else wallBlind(K, len, EAVES, e.kind === 'end' && rec.id === 'r3164896' && e.len > 30);
      });
    }
    // ---- cornice: corbel stripe + limestone cornice slab (both under the roof edge)
    const draw = (e) => e.kind !== 'arch' && e.kind !== 'party' && e.len > 0.5;
    band(P, edges, EAVES - 1.7, EAVES - 0.95, 0.1, { front: M.brickDark, top: M.brickDark, under: M.brickDark }, { draw, uvs: 1 });
    band(P, edges, EAVES - 0.95, EAVES - 0.22, 0.38, { front: M.limestone, top: M.limestone, under: M.stone }, { draw, uvs: 2 });
    // ---- roofs
    const pcs = PIECES[rec.id] ? PIECES[rec.id](ringPts) : [hull(ringPts)];
    for (const pc of pcs) {
      const rf = hipRoof(P, M.roofZinc, pc, EAVES, RIDGE - EAVES, 0.75);
      skylights(K, pc, rf);
    }
    // ---- colliders
    addPolyColliders(ctx, poly, 0, 16, 0.9);
    // ---- downpipes on the park / outer walls
    for (const e of edges) {
      if (!draw(e) || e.len < 8) continue;
      const k = Math.max(1, Math.round(e.len / 12.4));
      for (let j = 0; j <= k; j++) {
        const t = (j + 0.0) / k, x = e.a[0] + (e.b[0] - e.a[0]) * Math.min(0.97, Math.max(0.03, t)), z = e.a[1] + (e.b[1] - e.a[1]) * Math.min(0.97, Math.max(0.03, t));
        P.cyl(M.ironSoft, [x + e.n[0] * 0.2, 0.3, z + e.n[1] * 0.2], [x + e.n[0] * 0.2, EAVES - 0.9, z + e.n[1] * 0.2], 0.07, 0.07, 6, false);
      }
    }
    svc.monuments.push({ id: rec.id, name: rec.name || 'Лесные склады', x: rec.cx, z: rec.cz, h: RIDGE });
  }
  svc.warehouseStats = stats;
}

/** the park-side arcade of one wall (frame: x along the wall, z out): returns the number of bays */
function arcade(K, len, hE) {
  const { M, P } = K;
  const wA = 4.2, r = wA / 2, yS = 4.0, nb = Math.max(1, Math.round((len - 1.0) / 6.3)), p = len / nb;
  const wq = (mat, x0, x1, y0, y1, z, t = 2) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / t, y0 / t], [x1 / t, y0 / t], [x1 / t, y1 / t], [x0 / t, y1 / t]]);
  const pier = (x0, x1) => {
    if (x1 - x0 < 0.05) return;
    wq(M.brickChev, x0, x1, 0, yS, 0, 2);
    wq(M.stone, x0, x1, 0, 2.0, 0.06, 2.4);                                                                  // limestone plinth over the pier
    P.box(M.limestone, x0, x1, 2.0, 2.14, 0, 0.12, 'bk', 1);
  };
  pier(0, p / 2 - r);
  for (let i = 0; i < nb; i++) {
    const xc = (i + 0.5) * p, x0 = i * p, x1 = (i + 1) * p;
    if (i + 1 < nb) pier(xc + r, xc + p - r); else pier(xc + r, len);
    // ---- the wall above the spring line with the arch cut out and the lunette hole
    const s = new THREE.Shape();
    s.moveTo(x0, yS); s.lineTo(xc - r, yS); s.absarc(xc, yS, r, Math.PI, 0, true); s.lineTo(x1, yS); s.lineTo(x1, hE); s.lineTo(x0, hE); s.lineTo(x0, yS);
    const lun = G.archPts(xc, 8.4, 1.9, 1.65, 8);
    s.holes.push(new THREE.Path(lun.map((q) => new THREE.Vector2(q[0], q[1])).reverse()));
    P.face(M.brick, s, 0, 2, 8);
    // ---- voussoir ring (alternating brick) round the arch
    const nv = 14, ro = r + 0.5;
    for (let k = 0; k < nv; k++) {
      const a0 = Math.PI - k * Math.PI / nv, a1 = Math.PI - (k + 1) * Math.PI / nv, m = k % 2 ? M.brickArchLight : M.brickArch;
      const q = (a, rr, z) => [xc + Math.cos(a) * rr, yS + Math.sin(a) * rr, z];
      P.quad(m, q(a0, r, 0.05), q(a1, r, 0.05), q(a1, ro, 0.05), q(a0, ro, 0.05), [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    // ---- reveal (0.8 m): jambs and the barrel soffit
    const z0 = -0.8;
    P.quad(M.brickChev, [xc - r, 0, 0], [xc - r, 0, z0], [xc - r, yS, z0], [xc - r, yS, 0], [1, 0, 0], [[0, 0], [0.4, 0], [0.4, 2], [0, 2]]);
    P.quad(M.brickChev, [xc + r, 0, z0], [xc + r, 0, 0], [xc + r, yS, 0], [xc + r, yS, z0], [-1, 0, 0], [[0, 0], [0.4, 0], [0.4, 2], [0, 2]]);
    const ns = 8;
    for (let k = 0; k < ns; k++) {
      const a0 = Math.PI - k * Math.PI / ns, a1 = Math.PI - (k + 1) * Math.PI / ns, am = (a0 + a1) / 2;
      const q = (a, z) => [xc + Math.cos(a) * r, yS + Math.sin(a) * r, z];
      P.quad(M.brickChev, q(a0, 0), q(a1, 0), q(a1, z0), q(a0, z0), [-Math.cos(am), -Math.sin(am), 0], [[0, 0], [0.4, 0], [0.4, 1], [0, 1]]);
    }
    // ---- glazing: dark glass + black steel (door leaves, transom, fanlight bars)
    const zg = z0 - 0.02;
    P.quad(M.glass, [xc - r, 0.05, zg], [xc + r, 0.05, zg], [xc + r, yS, zg], [xc - r, yS, zg], [0, 0, 1]);
    const fan = [[xc - r, yS, zg]]; for (let k = 1; k < 10; k++) { const a = Math.PI - k * Math.PI / 10; fan.push([xc + Math.cos(a) * r, yS + Math.sin(a) * r, zg]); } fan.push([xc + r, yS, zg]);
    P.fan(M.glass, fan, [0, 0, 1]);
    P.box(M.frame, xc - 0.05, xc + 0.05, 0.05, yS + r, zg, zg + 0.1, 'k', 1);                                // centre mullion / door split
    P.box(M.frame, xc - r, xc + r, 3.85, 4.0, zg, zg + 0.1, 'k', 1);                                           // transom
    P.box(M.frame, xc - r, xc + r, 0.05, 0.3, zg, zg + 0.1, 'k', 1);
    for (let k = 1; k < 4; k++) { const a = Math.PI - k * Math.PI / 4; P.cyl(M.frame, [xc, yS, zg + 0.04], [xc + Math.cos(a) * r, yS + Math.sin(a) * r, zg + 0.04], 0.025, 0.025, 4, false); }
    // ---- the lunette: recessed black frame + glass + a limestone sill
    const zl = -0.3;
    P.quad(M.glass, [xc - 0.95, 8.4, zl], [xc + 0.95, 8.4, zl], [xc + 0.95, 9.05, zl], [xc - 0.95, 9.05, zl], [0, 0, 1]);
    G.planeShape(P, M.glass, G.archPts(xc, 9.05, 1.9, 1.0, 8), zl);
    G.frameRing(P, M.frame, G.archPts(xc, 8.4, 1.9, 1.65, 8), G.archPts(xc, 8.5, 1.74, 1.5, 8), zl - 0.0, 0.1, 1);
    P.box(M.frame, xc - 0.03, xc + 0.03, 8.45, 10.0, zl, zl + 0.1, 'k', 1);
    P.box(M.limestone, xc - 1.25, xc + 1.25, 8.2, 8.4, 0, 0.14, 'bk', 1);
  }
  return nb;
}

/** a blind brick wall (Moika / canal side, gables): limestone plinth, tall boarded arched windows, optional grand portal (Dom 12 north gable) */
function wallBlind(K, len, hE, portal) {
  const { M, P } = K;
  const wq = (mat, x0, x1, y0, y1, z, t = 2) => P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], [[x0 / t, y0 / t], [x1 / t, y0 / t], [x1 / t, y1 / t], [x0 / t, y1 / t]]);
  wq(M.brick, 0, len, 0, hE, 0, 2);
  wq(M.stone, 0, len, 0, 2.0, 0.06, 2.4);
  P.box(M.limestone, 0, len, 2.0, 2.14, 0, 0.12, 'bk', 1);
  const nb = Math.max(1, Math.round((len - 1.0) / 6.3)), p = len / nb;
  for (let i = 0; i < nb; i++) {
    const xc = (i + 0.5) * p;
    if (portal && Math.abs(xc - len / 2) < 4) continue;
    if (i % 2 === 0 || len < 20) {
      G.planeShape(P, M.blank, G.archPts(xc, 6.6, 2.1, 4.6, 8), 0.05);
      G.frameRing(P, M.ring, G.archPts(xc, 6.5, 2.7, 4.85, 8), G.archPts(xc, 6.6, 2.1, 4.6, 8), 0.0, 0.1, 1);
      P.box(M.limestone, xc - 1.4, xc + 1.4, 6.35, 6.5, 0, 0.16, 'bk', 1);
    }
    if (len > 20) { G.planeShape(P, M.glass, G.archPts(xc, 9.8, 1.5, 1.7, 8), 0.04); G.frameRing(P, M.ring, G.archPts(xc, 9.7, 2.0, 1.95, 8), G.archPts(xc, 9.8, 1.5, 1.7, 8), 0.0, 0.08, 1); }
  }
  if (portal) {
    const xc = len / 2;
    G.planeShape(P, M.glass, G.archPts(xc, 1.6, 4.8, 9.0, 12), 0.05);
    G.frameRing(P, M.ring, G.archPts(xc, 1.4, 6.2, 9.8, 12), G.archPts(xc, 1.6, 4.8, 9.0, 12), 0.0, 0.2, 1);
    P.box(M.frame, xc - 0.05, xc + 0.05, 1.6, 7.0, 0.05, 0.12, 'k', 1);
    P.box(M.frame, xc - 2.4, xc + 2.4, 5.0, 5.12, 0.05, 0.12, 'k', 1);
    for (let k = 0; k < 5; k++) P.box(M.limestone, xc - 3.4, xc + 3.4, 0.0, 0.22 * (k + 1), 0.15 + (4 - k) * 0.3, 0.45 + (4 - k) * 0.3, 'bk', 1);
  }
}

/** rows of skylights (steel frame, dark glass top) on both slopes of a hipped roof piece: every 9 m along the longest edge direction, +-0.3 of the inradius from the ridge */
function skylights(K, ring, rf) {
  const { M, P } = K;
  let best = 0, d = [1, 0];
  for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l > best) { best = l; d = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; } }
  const n = [-d[1], d[0]];
  let cx = 0, cz = 0; for (const q of ring) { cx += q[0]; cz += q[1]; } cx /= ring.length; cz /= ring.length;
  let t0 = 1e9, t1 = -1e9; for (const q of ring) { const t = (q[0] - cx) * d[0] + (q[1] - cz) * d[1]; t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
  const rot = Math.atan2(-d[1], d[0]);
  for (let t = t0 + 7; t < t1 - 7; t += 9) for (const off of [-0.32, 0.32]) {
    const x = cx + d[0] * t + n[0] * off * rf.W, z = cz + d[1] * t + n[1] * off * rf.W, h = rf.height(x, z);
    if (h == null || !inRingPoly(ring, x, z)) continue;
    P.push(x, h - 0.35, z, rot);
    P.box(M.ironSoft, -0.7, 0.7, 0, 0.75, -0.95, 0.95, 'b', 1);
    P.box(M.glass, -0.55, 0.55, 0.74, 0.8, -0.8, 0.8, 'b', 1);
    P.pop();
  }
}
const inRingPoly = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };

/** the rounded-corner front of litera O at the Moika / Kryukov confluence (Pasypkin 1847): a tall arched opening framed by two pairs of limestone half columns under an entablature [dossier 5] */
function pasypkin(K, len) {
  const { M, P } = K, xc = len / 2;
  G.planeShape(P, M.glass, G.archPts(xc, 1.2, 3.2, 8.6, 12), 0.08);
  G.frameRing(P, M.limestone, G.archPts(xc, 1.0, 4.2, 9.4, 12), G.archPts(xc, 1.2, 3.2, 8.6, 12), 0.0, 0.2, 1);
  P.box(M.frame, xc - 0.04, xc + 0.04, 1.2, 8.0, 0.08, 0.14, 'k', 1); P.box(M.frame, xc - 1.6, xc + 1.6, 5.0, 5.1, 0.08, 0.14, 'k', 1);
  for (const s of [-1, 1]) for (const o of [2.45, 3.35]) { G.tube(P, M.limestone, xc + s * o * 0.62, 0.45, 1.2, 9.4, 0.28, 0.25, 12, 2, 8); P.box(M.limestone, xc + s * o * 0.62 - 0.35, xc + s * o * 0.62 + 0.35, 9.4, 9.7, 0.1, 0.8, 'b', 1); }
  P.box(M.limestone, xc - 3.6, xc + 3.6, 9.7, 10.6, 0.0, 0.85, 'b', 1);
}
