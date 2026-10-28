// landmarksMenshikov/corps.js - the FIRST CADET CORPS (Здание Первого кадетского корпуса, Kadetskaya line 1-3; OSM w28691170, 56 vertices, 15 753 m2, outline 428 x 197 m).
// Dossier docs/research/menshikov.md section 3 (critic-corrected 2026-10-07), photos refs/menshikov 47 48 49 50 51 54 55 56 57 64 65 66.  Frames KF (a along the line, b depth, the facade at b 0) and PF.
//   FRONT    R1, the 340 m two-storey range: rusticated base 2.5 m, first storey of round-headed windows (1.3 x 2.4) in 1.8 m salmon panels between white flat pilasters (0.9 m: bay pitch 2.7 m, ~126 bays),
//            a white frieze band, second-storey rectangular windows under keystones, a white dentil cornice at 10.4 m; salmon from the south portico to a -195, cream-yellow to a -312, peach-ochre end block.
//   R2       the south block (a 9.4 .. 86.1): peach-sand plaster, cream pilasters, heavier cornice at 11.2 m; its SE end wall faces the embankment.
//   PORTICOES  the 1938 south portico of FOUR PAIRS of Ionic columns on pedestals (a -4.9 / -0.9 / 3.1 / 7.1, three doors between the pairs); the historic four-PAIR portico at a -266.7 (pitch 7 m); the
//            four-SINGLE-column portico with an iron canopy at a -203.4 (pitch 2.6 m); entablatures break forward over every pair.
//   GALLERIES  the two 2-storey galleries beside the palace (eave 8.8 m, a row of round oculi); everything else (courtyard sides) plain red-orange walls with simple windows.
//   ROOFS    low-pitched ranges (R1: rust-brown street slope, zinc rear slope, eave 10.4, ridge 12.4; irregular red-brick chimneys), a deck under everything.  Closed building: thin colliders round the outline.
// Claim: groups.js key 'first-cadet-corps' (w28691170; the clinic w28691194 and the shed w28691177 stay generic).
import * as THREE from 'three';
import * as L from '../layout.js';
import { KF, PF, HC, HP, CORPS_ID } from './frame.js';
import { ringEdges, onEdge, frameOf } from './kit.js';
import { holedWall, pane, surround, archSurround, band, cornice } from './facade.js';
import { tbox, planeShape, frameRing, archPts } from './geo.js';
import { makeRanges, rangeAt, inGallery } from './ranges.js';
import { addPolyColliders } from '../lib/massing.js';
import { coverFn } from './surfaces.js';

const TAU = Math.PI * 2;
export const CORPS = {
  pitch: 2.7,
  // portico axes (frame KF a): the 1938 south portico (pairs), the historic central four-pair portico, the four-single portico with the iron canopy
  south: { c: 1.1, pitch: 4.0, spacing: 1.2, n: 4 },
  central: { c: -266.7, pitch: 7.0, spacing: 1.2, n: 4 },
  single: { c: -203.4, pitch: 2.6, n: 4 },
};
const SECT = (a) => (a < -312 ? 'ochre' : a < -195 ? 'cream' : 'salmon');
/** KF a of every free column of the two porticoes in front of the plain R1 wall (the south portico has its own wall behind it): a window whose axis is nearer than COL_CLEAR to a column is left out (review fix: the columns hid half a window) */
const COL_CLEAR = 1.25;
const COLS_A = [
  ...Array.from({ length: CORPS.central.n }, (_, i) => CORPS.central.c + (i - (CORPS.central.n - 1) / 2) * CORPS.central.pitch).flatMap((c) => [c - CORPS.central.spacing / 2, c + CORPS.central.spacing / 2]),
  ...Array.from({ length: CORPS.single.n }, (_, i) => CORPS.single.c + (i - (CORPS.single.n - 1) / 2) * CORPS.single.pitch),
];
const behindColumn = (a) => COLS_A.some((c) => Math.abs(a - c) < COL_CLEAR);

export function corpsPoly() {
  const b = L.buildingById(CORPS_ID);
  if (!b || !b.polys || !b.polys[0]) throw new Error('baked footprint w28691170 missing');
  return b.polys[0];
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { const t0 = K.P.tris; try { fn(); } catch (e) { console.error(`[landmarksMenshikov] corps/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } if (typeof process !== 'undefined' && process.env && process.env.MEN_DEBUG) console.log('[corps]', name, K.P.tris - t0); };
  const poly = corpsPoly();
  const ranges = makeRanges(poly.o);
  const C = K.corps = { poly, ranges, edges: ringEdges(poly, 0.3) };
  stage('walls', () => walls(K, C));
  stage('roofs', () => roofs(K, C));
  stage('porticoes', () => porticoes(K));
  stage('colliders', () => addPolyColliders(K.ctx, poly, 0, HC.eave, 0.9));
  const c = KF.W(-170, -9);
  K.svc.monuments.push({ id: CORPS_ID, name: 'Здание Первого кадетского корпуса', x: c.x, z: c.z, h: HC.ridge });
  // photo spots on the far-side pavement of the Kadetskaya line (K b +25.5; tested against the real asphalt: net.cover), looking at the south portico, along the front and at the historic portico
  { const cover = coverFn(K.ctx), spot = (a, b, ta, tb, name, pitch) => { const q = KF.W(a, b), t = KF.W(ta, tb); if (cover(q.x, q.z) < -0.6) K.svc.photoSpots.push({ x: q.x, z: q.z, yaw: L.yawToward(q.x, q.z, t.x, t.z), pitch, name }); };
    spot(0, 25.5, 0, 0, 'Первый кадетский корпус: южный портик (1938)', 12);
    spot(60, 25.5, -120, 0, 'Первый кадетский корпус: Кадетская линия вдоль фасада', 6);
    spot(-266.7, 25.5, -266.7, 0, 'Первый кадетский корпус: портик из четырёх пар колонн', 12); }
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ walls
// review fix (photos 50 54 65, scaled on the 10.4 m eave): the R1 wall has a LOW base (1.4 m: a thin salmon / cream band under the pilasters), the round-headed windows stand 2.7 .. 4.8 m, the upper windows 6.8 .. 8.7 m;
// only the 1938 south portico has the tall 2.5 m rusticated block (photo 65: the block stands proud of the low wall base).  The old values (base 2.5, arches 3.35 .. 5.75) set everything 0.7 m too high.
const R1H = { base: 1.4, impost: 1.7, arch0: 2.7, archH: 2.1, band0: 5.9, band1: 6.4, up0: 6.8, upH: 1.9, cornice0: 9.7, eave: HC.eave };
const R2H = { base: 1.2, impost: 1.5, arch0: 2.3, archH: 2.7, band0: 5.7, band1: 6.2, up0: 6.9, upH: 2.0, cornice0: 9.9, eave: HC.r2 };

function eaveOf(C, e) {
  const px = (e.a[0] + e.b[0]) / 2 - e.n[0] * 0.6, pz = (e.a[1] + e.b[1]) / 2 - e.n[1] * 0.6, k = KF.M(px, pz), r = rangeAt(C.ranges, k.a, k.b);
  return r ? r.eave : 9.2;
}

function walls(K, C) {
  const P = K.P;
  for (const e of C.edges) {
    const km = KF.M((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), nA = e.n[0] * KF.ax[0] + e.n[1] * KF.ax[1], nB = e.n[0] * KF.bz[0] + e.n[1] * KF.bz[1];
    e.ka = km.a; e.kb = km.b; e.nA = nA; e.nB = nB;
    const front = nB > 0.9 && Math.abs(km.b) < 2.5;
    if (front && km.a > 9 && e.len > 20) { e.kind = 'r2front'; frontBays(K, e, { h: R2H, r2: true }); }
    else if (front && km.a < 0 && e.len > 20) { e.kind = 'r1front'; frontBays(K, e, { h: R1H, cutEnd: e.len > 100 ? 8.2 : 0 }); }
    else if (nA > 0.9 && km.a > 80 && km.b > -26 && e.len > 15) { e.kind = 'r2end'; frontBays(K, e, { h: R2H, r2: true }); }
    else if (nA < -0.9 && km.a < -330 && e.len > 10) { e.kind = 'northEnd'; frontBays(K, e, { h: R1H, fixed: 'ochre' }); }
    else if (e.len < 12 && km.a > -1 && km.a < 10.5 && km.b > -0.5 && km.b < 2.6) { e.kind = 'bump'; }  // the three faces of the 1.7 m bump = the base of the south portico (drawn by the portico block, below; the side faces would poke through the portico as red strips)
    else if (inGallery((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2) && e.len > 6) { e.kind = 'gallery'; galleryWall(K, e); }
    else { e.kind = 'plain'; plainWall(K, e, eaveOf(C, e)); }
    if (typeof process !== 'undefined' && process.env && process.env.MEN_DEBUG) { (C.dbg ||= {})[e.kind] = ((C.dbg[e.kind] || 0) + (P.tris - (C.last || 0))); C.last = P.tris; }
  }
  if (C.dbg) console.log('[corps] by kind', JSON.stringify(C.dbg));
}

/** the street facade of a range along one edge: bays between pilasters (x from 0 to len - cutEnd), colour sections by a (R1) or one colour (R2, the north end) */
function frontBays(K, e, o) {
  const { P, M } = K, H = o.h, f = frameOf(e);
  const sgn = Math.sign(f.xa[0] * KF.ax[0] + f.xa[1] * KF.ax[1]) || 1, aL = KF.M(f.x, f.z).a;
  const along = Math.abs(f.xa[0] * KF.ax[0] + f.xa[1] * KF.ax[1]) > 0.7;                              // false for an end wall (parallel to b)
  const bAt = KF.M(f.x, f.z).b;
  onEdge(P, e, (len) => {
    const x0 = 0, x1 = len - (o.cutEnd || 0), n = Math.max(1, Math.round((x1 - x0) / CORPS.pitch)), p = (x1 - x0) / n;
    const sect = (x) => (o.r2 ? 'r2' : o.fixed || SECT(aL + sgn * x));
    const MW = { salmon: M.salmon, cream: M.cream2, ochre: M.ochre, r2: M.peach }, MB = { salmon: M.rustSalmon, cream: M.rustCream, ochre: M.rustOchre, r2: M.rustPeach };
    const TR = o.r2 ? M.cream : M.whiteP;
    // runs of equal colour, at most 8 bays each
    const runs = []; let cur = null;
    for (let k = 0; k < n; k++) { const s = sect(x0 + (k + 0.5) * p); if (!cur || cur.s !== s || cur.n >= 8) { cur = { s, k0: k, n: 0 }; runs.push(cur); } cur.n++; }
    for (const r of runs) {
      const xa = x0 + r.k0 * p, xb = xa + r.n * p;
      // rusticated base (slightly proud), the plaster panel with the openings above it
      tbox(P, MB[r.s], xa, xb, 0, H.base, -0.4, 0.07, 2.64, 2.64, 'bk');
      const holes = [];
      for (let k = r.k0; k < r.k0 + r.n; k++) {
        const cx = x0 + (k + 0.5) * p;
        if (!o.r2 && !o.fixed && behindColumn(aL + sgn * cx)) continue;                                // a portico column stands in front of this axis: plain wall
        holes.push({ cx, y0: H.arch0, w: 1.15, h: H.archH, arch: true, win: 'arch' }, { x0: cx - 0.52, x1: cx + 0.52, y0: H.up0, y1: H.up0 + H.upH, win: 'rect' });
      }
      holedWall(P, MW[r.s], xa, xb, H.impost, H.cornice0, holes, { depth: 0.3, uvs: 3 });
      for (const h of holes) {
        if (h.win === 'arch') { pane(P, M.winArch, h); archSurround(P, M.whiteFlat, h, { sw: 0.11, proud: 0.07, impost: true }); }
        else { pane(P, M.winCorps, h); surround(P, M.whiteFlat, h, { sw: 0.1, proud: 0.06, key: true, sill: 0.08 }); }
      }
      // flat pilasters between the bays (0.9 m wide, 0.07 proud) with a base block and a capital block
      for (let k = r.k0; k <= r.k0 + r.n; k++) {
        const x = x0 + k * p, w = (k === 0 || k === n) ? 0.5 : (o.r2 ? 0.8 : 0.9);
        const xc = k === 0 ? x + w / 2 : k === n ? x - w / 2 : x;
        if (!o.r2 && k % 9 === 4) { P.cyl(M.whiteFlat, [xc, 0.25, 0.14], [xc, H.eave - 0.2, 0.14], 0.06, 0.06, 6, false); for (const yy of [1.6, 5.0, 8.4]) P.box(M.whiteFlat, xc - 0.09, xc + 0.09, yy, yy + 0.08, 0.07, 0.17, ''); }   // a downpipe on every 9th pilaster (~24 m)
        P.box(TR, xc - w / 2, xc + w / 2, H.impost, H.cornice0, 0, 0.07, 'k');
        P.box(TR, xc - w / 2 - 0.05, xc + w / 2 + 0.05, H.impost, H.impost + 0.3, 0, 0.1, 'k');
        P.box(TR, xc - w / 2 - 0.05, xc + w / 2 + 0.05, H.cornice0 - 0.32, H.cornice0, 0, 0.1, 'k');
      }
    }
    band(P, TR, x0, x1, H.impost - 0.3, H.impost, 0.14);                                               // impost band over the base
    band(P, TR, x0, x1, H.band0, H.band1, 0.1);                                                        // the white frieze between the storeys
    cornice(P, TR, x0, x1, H.cornice0, H.eave, o.r2 ? { p1: 0.22, p2: 0.42, p3: 0.62 } : { p1: 0.14, p2: 0.28, p3: 0.42 });
    void bAt; void along;
  });
}

/** plain courtyard / back wall: a coloured panel with windows in two rows, flat pilaster strips and a cornice band */
function plainWall(K, e, eave) {
  const { P, M } = K;
  onEdge(P, e, (len) => {
    const matW = eave > 10 ? M.courtRed : M.courtRed, n = len < 3.0 ? 0 : Math.max(1, Math.round((len - 0.8) / 3.4)), m = 0.4, pitch = n ? (len - 2 * m) / n : len;
    const holes = [];
    const yU = Math.max(4.6, eave - 4.4);
    for (let k = 0; k < n; k++) { const cx = m + pitch * (k + 0.5); holes.push({ x0: cx - 0.6, x1: cx + 0.6, y0: 1.5, y1: 3.6 }, { x0: cx - 0.6, x1: cx + 0.6, y0: yU, y1: yU + 2.0 }); }
    P.box(M.plinth, 0, len, 0, 0.7, -0.3, 0.06, '');
    holedWall(P, matW, 0, len, 0.7, eave - 0.6, holes, { depth: 0.25, uvs: 3 });
    for (const h of holes) { pane(P, M.winCorps, h, 0.25); P.box(M.whiteFlat, h.x0 - 0.08, h.x1 + 0.08, h.y0 - 0.12, h.y0, 0, 0.1, 'k'); }
    for (let k = 0; k <= n; k++) { const x = n ? m + pitch * k : (k ? len - 0.3 : 0.3); const xx = Math.min(len - 0.25, Math.max(0.25, x)); P.box(M.whiteFlat, xx - 0.25, xx + 0.25, 0.7, eave - 0.6, 0, 0.05, 'k'); }
    band(P, M.whiteFlat, 0, len, eave - 0.6, eave, 0.25);
  });
}

/** the two 2-storey galleries beside the palace: palace-yellow plaster, a plinth, windows below and a row of round oculi above, flat pilasters with capitals, cornice at 8.8 m */
function galleryWall(K, e) {
  const { P, M } = K, eave = HP.gallery;
  onEdge(P, e, (len) => {
    const n = Math.max(1, Math.round((len - 1) / 3.0)), m = 0.5, pitch = (len - 2 * m) / n, holes = [];
    for (let k = 0; k < n; k++) { const cx = m + pitch * (k + 0.5); holes.push({ x0: cx - 0.5, x1: cx + 0.5, y0: 1.5, y1: 3.5, row: 0 }, { circle: true, cx, cy: 5.9, r: 0.45, row: 1 }); }
    P.box(M.plinth, 0, len, 0, 0.8, -0.3, 0.1, '');
    holedWall(P, M.galleryY, 0, len, 0.8, eave - 0.9, holes, { depth: 0.3, uvs: 3 });
    for (const h of holes) {
      if (h.circle) { pane(P, M.winOculus, h); frameRing(P, M.cream, Array.from({ length: 10 }, (_, i) => [h.cx + Math.cos(i * TAU / 10) * (h.r + 0.14), h.cy + Math.sin(i * TAU / 10) * (h.r + 0.14)]), Array.from({ length: 10 }, (_, i) => [h.cx + Math.cos(i * TAU / 10) * h.r, h.cy + Math.sin(i * TAU / 10) * h.r]), 0, 0.06, 1); }
      else { pane(P, M.winTall, h); surround(P, M.cream, h, { sw: 0.16, proud: 0.06, sill: 0.08 }); }
    }
    for (let k = 0; k <= n; k++) { const xx = Math.min(len - 0.3, Math.max(0.3, m + pitch * k)); P.box(M.cream, xx - 0.25, xx + 0.25, 0.8, eave - 0.9, 0, 0.1, 'k'); P.box(M.cream, xx - 0.33, xx + 0.33, eave - 1.3, eave - 0.9, 0, 0.16, 'k'); }
    band(P, M.cream, 0, len, 4.35, 4.65, 0.1);
    cornice(P, M.cream, 0, len, eave - 0.9, eave, { p1: 0.14, p2: 0.3, p3: 0.46 });
  });
}

// ------------------------------------------------------------------------------------------------ roofs (frame KF: x = a, z = b)
/** a roof over a range rectangle: ridge along the long axis, hips at the ends flagged in r.hips, gable closures elsewhere; kinds pick the sheet */
function roofRange(P, M, r) {
  const ov = 0.45, E = r.eave + 0.02, R = E + r.rise, longX = (r.a1 - r.a0) >= (r.b1 - r.b0);
  const u0 = longX ? r.a0 : r.b0, u1 = longX ? r.a1 : r.b1, v0 = longX ? r.b0 : r.a0, v1 = longX ? r.b1 : r.a1;
  const [h0, h1] = r.hips, hw = (v1 - v0) / 2 + ov, vm = (v0 + v1) / 2;
  const ua = u0 - (h0 ? ov : 0), ub = u1 + (h1 ? ov : 0);
  let ur0 = ua + (h0 ? hw : 0), ur1 = ub - (h1 ? hw : 0); if (ur0 > ur1) { ur0 = ur1 = (ur0 + ur1) / 2; }
  const front = r.kind === 'r1' ? M.roofRust : r.kind === 'r2' || r.kind === 'port' ? M.roofGreyFlat : M.roofZinc, back = r.kind === 'r1' ? M.roofZinc : front;
  // map (u, y, v) -> world-frame (x, y, z) of the KF frame; the longX flag swaps the roles
  const mp = (u, y, v) => (longX ? [u, y, v] : [v, y, u]), nm = (nu, ny, nv) => (longX ? [nu, ny, nv] : [nv, ny, nu]);
  const Q = (mat, pts, n, uv) => P.quad(mat, mp(...pts[0]), mp(...pts[1]), mp(...pts[2]), mp(...pts[3]), nm(...n), uv);
  const rise = r.rise, lu = (ub - ua) / 0.6, lr = (ur1 - ur0) / 0.6, sl = Math.hypot(hw, rise) / 0.6;
  Q(front, [[ua, E, v1 + ov], [ub, E, v1 + ov], [ur1, R, vm], [ur0, R, vm]], [0, hw, rise], [[0, 0], [lu, 0], [lr, sl], [0, sl]]);
  Q(back, [[ub, E, v0 - ov], [ua, E, v0 - ov], [ur0, R, vm], [ur1, R, vm]], [0, hw, -rise], [[0, 0], [lu, 0], [lr, sl], [0, sl]]);
  const tri = (mat, p0, p1, p2, n) => P.fan(mat, [mp(...p0), mp(...p1), mp(...p2)], nm(...n), (p) => [p[0] / 0.6, p[1] / 0.6]);
  if (h0) tri(M.roofZinc, [ua, E, v0 - ov], [ua, E, v1 + ov], [ur0, R, vm], [-rise, hw, 0]); else tri(M.roofGreyFlat, [ua, E, v0 - ov], [ua, E, v1 + ov], [ua, R, vm], [-1, 0, 0]);
  if (h1) tri(M.roofZinc, [ub, E, v1 + ov], [ub, E, v0 - ov], [ur1, R, vm], [rise, hw, 0]); else tri(M.roofGreyFlat, [ub, E, v1 + ov], [ub, E, v0 - ov], [ub, R, vm], [1, 0, 0]);
  return { longX, ur0, ur1, vm, E, R, ov };
}
/** a red-brick chimney 0.9 x 1.6 m, 2.4 m above the ridge, base band and white cap (frame KF) */
function chimney(P, M, a, b, y0, h = 2.4) {
  P.box(M.chimney, a - 0.45, a + 0.45, y0, y0 + h, b - 0.8, b + 0.8, 'b');
  P.box(M.chimneyCap, a - 0.52, a + 0.52, y0 + h, y0 + h + 0.12, b - 0.88, b + 0.88, '');
  P.box(M.chimneyCap, a - 0.5, a + 0.5, y0, y0 + 0.22, b - 0.86, b + 0.86, 'b');
}
function roofs(K, C) {
  const P = K.P, M = K.M, rng = K.ctx.rng(7301);
  // a flat deck under all the roofs (no see-through where ranges meet)
  const ring = []; for (let i = 0; i < C.poly.o.length; i += 2) ring.push([C.poly.o[i], C.poly.o[i + 1]]);
  P.cap(M.roofGreyFlat, ring, 8.55, true, 4);
  P.push(KF.x, 0, KF.z, KF.rot);
  try {
    for (const r of C.ranges) {
      const g = roofRange(P, M, r);
      if (r.kind === 'r1') {
        // irregular chimneys on the ridge (pitch 5.4 .. 11.5 m, dossier 3.3)
        let a = r.a1 - 5 - rng() * 6;
        while (a > r.a0 + 6) { chimney(P, M, a, g.vm + 0.2, g.R - 0.5); a -= 5.4 + rng() * 6.1; }
      } else if (r.kind === 'r2' || r.kind === 'port') {
        const a = (r.a0 + r.a1) / 2, b = (r.b0 + r.b1) / 2; chimney(P, M, g.longX ? a : g.vm, g.longX ? g.vm : b, g.R - 0.5, 2.0);
      }
    }
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ porticoes (frame KF: x = a, z = b, the facade at b 0)
/** an Ionic column: base rings, a slightly tapering shaft, echinus, a cushion with two volutes on the front and back faces, abacus.  R = shaft radius, y0 = shaft base, y1 = capital base */
function ionic(P, M, x, z, y0, y1, R) {
  P.cyl(M.whiteP, [x, y0, z], [x, y0 + 0.16, z], R * 1.2, R * 1.2, 14, true);
  P.cyl(M.whiteP, [x, y0 + 0.16, z], [x, y0 + 0.3, z], R * 1.1, R * 1.05, 14, false);
  P.cyl(M.whiteP, [x, y0 + 0.3, z], [x, y1, z], R * 1.0, R * 0.88, 14, false);
  P.cyl(M.whiteP, [x, y1, z], [x, y1 + 0.2, z], R * 0.95, R * 1.12, 14, true);
  P.box(M.whiteP, x - R * 1.28, x + R * 1.28, y1 + 0.2, y1 + 0.52, z - R * 0.6, z + R * 0.6, 'b');
  for (const s of [-1, 1]) for (const t of [-1, 1]) P.cyl(M.whiteP, [x + s * R * 0.95, y1 + 0.36, z + t * R * 0.56], [x + s * R * 0.95, y1 + 0.36, z + t * R * 0.72], R * 0.3, R * 0.3, 8, true);
  P.box(M.whiteP, x - R * 1.35, x + R * 1.35, y1 + 0.52, y1 + 0.68, z - R * 1.35, z + R * 1.35, '');
}
/** a pedestal 1.0 high with a base and a cornice, size w */
function pedestal(P, M, x, z, y0, y1, w) {
  P.box(M.whiteP, x - w / 2 - 0.08, x + w / 2 + 0.08, y0, y0 + 0.18, z - w / 2 - 0.08, z + w / 2 + 0.08, 'b');
  P.box(M.whiteP, x - w / 2, x + w / 2, y0 + 0.18, y1 - 0.14, z - w / 2, z + w / 2, 'b');
  P.box(M.whiteP, x - w / 2 - 0.08, x + w / 2 + 0.08, y1 - 0.14, y1, z - w / 2 - 0.08, z + w / 2 + 0.08, 'b');
}
/** the entablature block over a group of columns: architrave, frieze, cornice, standing out from the wall to zf */
function entablature(P, M, xa, xb, yA, zf) {
  P.box(M.whiteP, xa, xb, yA, yA + 0.5, -0.2, zf, '');
  P.box(M.whiteP, xa + 0.04, xb - 0.04, yA + 0.5, yA + 0.85, -0.2, zf - 0.04, 't');
  P.box(M.whiteP, xa - 0.1, xb + 0.1, yA + 0.85, yA + 1.2, -0.2, zf + 0.25, '');
}
function doorAt(P, M, a, z0 = 0.0, hw = 0.7) {
  // review fix: a flat near-black slab read as a hole in the wall (photo 47: a brown double door of two leaves with raised panels): the leaf is the warm brown door material, each leaf carries four darker raised panels
  P.box(M.door, a - hw, a + hw, 0.2, 2.4, z0 + 0.0, z0 + 0.1, 'b');
  for (const s of [-1, 1]) for (const [y0, y1] of [[0.4, 1.2], [1.3, 1.95], [2.02, 2.32]]) P.box(M.darkDoor, a + s * (hw * 0.5) - hw * 0.38, a + s * (hw * 0.5) + hw * 0.38, y0, y1, z0 + 0.1, z0 + 0.13, 'bk');
  P.box(M.whiteFlat, a - 0.025, a + 0.025, 0.2, 2.4, z0 + 0.1, z0 + 0.14, 'b');
  P.box(M.whiteFlat, a - hw - 0.12, a + hw + 0.12, 0.0, 0.2, z0 + 0.0, z0 + 0.7, '');
  P.box(M.whiteFlat, a - hw - 0.12, a - hw, 0.2, 2.5, z0 - 0.02, z0 + 0.12, 'b'); P.box(M.whiteFlat, a + hw, a + hw + 0.12, 0.2, 2.5, z0 - 0.02, z0 + 0.12, 'b'); P.box(M.whiteFlat, a - hw - 0.12, a + hw + 0.12, 2.4, 2.55, z0 - 0.02, z0 + 0.12, '');
}
function porticoes(K) {
  const { P, M, ctx } = K, ph = ctx.physics;
  const stages = [];
  P.push(KF.x, 0, KF.z, KF.rot);
  try {
    // ---------------------------------------------------------- the 1938 south portico (four pairs) and the wall behind it, a -8.2 .. 9.4
    {
      const S = CORPS.south, zc = 1.0, yB = 2.5, yP = 3.5, y1 = 9.55, R = 0.5, a0 = -8.2, a1 = 9.4, E = 11.0;
      const centres = Array.from({ length: S.n }, (_, i) => S.c + (i - (S.n - 1) / 2) * S.pitch);
      // the wall behind: rustication, impost band, plaster with three arched windows above the three doors, cornice
      tbox(P, M.rustSalmon, a0, a1, 0, yB, -0.4, 0.07, 2.64, 2.64, 'bk');
      const holes = [-1, 0, 1].map((k) => ({ cx: S.c + k * S.pitch, y0: 3.95, w: 1.0, h: 2.2, arch: true }));
      holedWall(P, M.salmon, a0, a1, yB, 10.0, holes, { depth: 0.3, uvs: 3 });
      for (const h of holes) { pane(P, M.winArch, h); archSurround(P, M.whiteFlat, h, { sw: 0.16, proud: 0.07 }); P.box(M.whiteFlat, h.cx - 0.7, h.cx + 0.7, 7.0, 7.4, 0, 0.06, 'k'); }
      for (const k of [-1, 0, 1]) doorAt(P, M, S.c + k * S.pitch, 0.0, 0.5);
      band(P, M.whiteP, a0, a1, yB - 0.3, yB, 0.14);
      cornice(P, M.whiteP, a0, a1, 10.0, E, { p1: 0.14, p2: 0.28, p3: 0.42 });
      // the base of the portico: one rusticated pier 1.7 m deep under each PAIR of pedestals (the three doors stand in the 1.3 m niches between the piers, photo 47: the door is recessed behind the pier faces),
      // a flat rusticated lintel over every niche (y 2.2 .. 2.5), a white stylobate strip on top.  (Review fix: the old solid block buried the three doors.)
      const hw = S.spacing / 2 + 0.73;
      for (const c of centres) tbox(P, M.rustSalmon, c - hw, c + hw, 0, yB, 0.0, 1.7, 2.64, 2.64, 'b');
      for (let i = 0; i + 1 < centres.length; i++) tbox(P, M.rustSalmon, centres[i] + hw, centres[i + 1] - hw, 2.2, yB, 0.0, 1.7, 2.64, 2.64, '');
      P.box(M.whiteP, centres[0] - hw - 0.08, centres[centres.length - 1] + hw + 0.08, yB, yB + 0.14, -0.05, 1.78, 'b');
      for (const c of centres) for (const s of [-1, 1]) {
        const x = c + s * S.spacing / 2; pedestal(P, M, x, zc, yB + 0.14, yP, 1.3); ionic(P, M, x, zc, yP, y1, R);
        ph.addBox(KF.W(x, zc).x, KF.W(x, zc).z, 1.5, 1.5, KF.rot, 0, yP + 6);
      }
      for (const c of centres) entablature(P, M, c - S.spacing / 2 - 0.85, c + S.spacing / 2 + 0.85, 10.2, 1.75);
      K.svc.entrances.push(...[-1, 0, 1].map((k) => { const p = KF.W(S.c + k * S.pitch, 0.6); return { id: 'corps-portico-' + (k + 2), x: p.x, z: p.z, rotY: KF.rot, open: false }; }));
      stages.push('south');
    }
    // ---------------------------------------------------------- the historic central portico: four pairs, pitch 7 m, in front of the salmon / cream wall at a -266.7
    {
      const S = CORPS.central, zc = 1.0, yB = 1.5, yP = 2.3, y1 = 9.55, R = 0.5;
      const centres = Array.from({ length: S.n }, (_, i) => S.c + (i - (S.n - 1) / 2) * S.pitch);
      const xa = centres[0] - 1.9, xb = centres[S.n - 1] + 1.9;
      tbox(P, M.rustCream, xa, xb, 0, yB, 0.0, 1.7, 2.64, 2.64, 'bk');
      P.box(M.whiteP, xa, xb, yB, yB + 0.14, -0.05, 1.78, 'b');
      for (const c of centres) for (const s of [-1, 1]) { const x = c + s * S.spacing / 2; pedestal(P, M, x, zc, yB + 0.14, yP, 1.3); ionic(P, M, x, zc, yP, y1, R); ph.addBox(KF.W(x, zc).x, KF.W(x, zc).z, 1.5, 1.5, KF.rot, 0, yP + 6); }
      for (const c of centres) entablature(P, M, c - S.spacing / 2 - 0.85, c + S.spacing / 2 + 0.85, 10.2, 1.75);
      band(P, M.whiteP, xa, xb, 10.0, 10.2, 0.4);
      stages.push('central');
    }
    // ---------------------------------------------------------- the four-single-column portico with the iron canopy at a -203.4 (columns -207.3 .. -199.5, pitch 2.6)
    {
      const S = CORPS.single, zc = 1.0, yB = 1.5, yP = 2.3, y1 = 9.55, R = 0.47;
      const xs = Array.from({ length: S.n }, (_, i) => S.c + (i - (S.n - 1) / 2) * S.pitch);
      const xa = xs[0] - 1.4, xb = xs[S.n - 1] + 1.4;
      tbox(P, M.rustCream, xa, xb, 0, yB, 0.0, 1.7, 2.64, 2.64, 'bk');
      P.box(M.whiteP, xa, xb, yB, yB + 0.14, -0.05, 1.78, 'b');
      for (const x of xs) { pedestal(P, M, x, zc, yB + 0.14, yP, 1.2); ionic(P, M, x, zc, yP, y1, R); ph.addBox(KF.W(x, zc).x, KF.W(x, zc).z, 1.4, 1.4, KF.rot, 0, yP + 6); }
      entablature(P, M, xs[0] - 0.8, xs[S.n - 1] + 0.8, 10.2, 1.75);
      // the iron-and-glass canopy at its SE side (a -197.5 .. -194.5, y 3.4, 1.6 m deep) over a dark door
      const ca = -196.0;
      // the OSM front line leans from b 0.0 (a 0) to b 0.3 (a -290): the rusticated base is proud by 0.07 of THAT wall, so the door (review fix: it was buried in the base) goes in front of it
      const wb = 0.3 * Math.min(1, Math.max(0, -ca / 289.7));
      doorAt(P, M, ca, wb + 0.07);
      P.quad(M.canopyGlass, [ca - 1.6, 3.55, 0.0], [ca + 1.6, 3.55, 0.0], [ca + 1.6, 3.2, 1.7], [ca - 1.6, 3.2, 1.7], [0, 0.6, 0.8]);
      P.quad(M.canopyUnder, [ca - 1.6, 3.53, 0.0], [ca + 1.6, 3.53, 0.0], [ca + 1.6, 3.18, 1.7], [ca - 1.6, 3.18, 1.7], [0, -0.6, -0.8]);
      for (const s of [-1, 1]) { P.cyl(M.canopyIron, [ca + s * 1.55, 3.55, 0.02], [ca + s * 1.55, 3.2, 1.65], 0.03, 0.03, 4, false); P.cyl(M.canopyIron, [ca + s * 1.55, 2.3, 0.02], [ca + s * 1.55, 3.4, 1.0], 0.025, 0.025, 4, false); }
      P.box(M.canopyIron, ca - 1.6, ca + 1.6, 3.18, 3.24, 1.62, 1.72, '');
      K.svc.entrances.push({ id: 'corps-canopy-door', x: KF.W(ca, 0.6).x, z: KF.W(ca, 0.6).z, rotY: KF.rot, open: false });
      stages.push('single');
    }
  } finally { P.pop(); }
  K.svc.porticoes = stages;
}
