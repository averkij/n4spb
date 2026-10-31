// landmarksVladimir/quarter.js - the JUDICIAL QUARTER building site on the Malaya Neva (пр. Добролюбова, 14) as a visitor sees it in 2026 (docs/research/vladimir.md section 3; photos
// refs/vladimir jq_mr7_01..04 of 2026-09-07 and jq_font_01..09 of 2026-05-18): the main volumes are finished and clad in cream stone, the housing is still in scaffolding, the future park is
// the builders' yard, tower cranes stand over it and a 6.4 m blue corrugated fence closes the whole site (a timber-roofed footway along pr. Dobrolyubova, grey panels at the bridge end).
// The OSM "buildings" here are construction PLOTS, not footprints; the real volumes are laid out inside them after Gerasimov's zoning plan (jq_font_08_plan) in the frame SITE
// (frame.js: +x = u along the avenue to the ESE, +z = v to the river):
//   Dance Palace (plot w30352230): block 98 x 53 m, 24 m; fly tower 32 m; a glazed bow with eight giant columns and a low dome facing the future park; energy block at the west end;
//   Judicial Department (w1390919082): a bar 130 x 24 m, 26 m;   housing (w1390919083): a comb round three courts, 28.5 m, raw insulation behind scaffolding;
//   Supreme Court (w1513983337): a closed block with two courts, 24 m + attic 27.5 m, dark window strips, a ten-column portico on the river;   yard (w1390919084): gravel, stacks, cabins.
// Everything is closed to the player (the fence is a collider).  ~14 k triangles.
import * as L from '../layout.js';
import * as G from './geo.js';
import { SITE } from './frame.js';
import { ringEdges, onEdge, band, polyOf } from './kit.js';
import { fillPolyFine } from './surfaces.js';
import { doric } from './cathedral.js';
import { addPolyColliders } from '../lib/massing.js';

const TAU = Math.PI * 2;
const R_PALACE = [[14, 7], [112, 7], [112, 60], [14, 60]], R_FLY = [[40, 16], [72, 16], [72, 51], [40, 51]], R_ENERGY = [[0.5, 20], [14.02, 20], [14.02, 60], [0.5, 60]];
const R_DEPT = [[3, 93], [133, 93], [133, 117], [3, 117]];
const R_HOUSE = [[2, 149], [136, 149], [136, 231], [62, 268.5], [24, 277], [2, 277.5]];
const H_HOUSE = [[[17, 164], [45, 164], [45, 258], [17, 260]], [[60, 164], [88, 164], [88, 238.8], [60, 253.2]], [[103, 164], [121, 164], [121, 221.8], [103, 231.1]]];
const R_COURT = [[164, 98], [295, 98], [296, 120], [299, 135], [304.5, 147.5], [171, 213.5], [164, 209.5]];
const H_COURT = [[[185, 116], [222, 116], [222, 172], [185, 190]], [[245, 116], [278, 116], [278, 145], [245, 161]]];
const BOW = { u: 112, v: 33.5, R: 19 };
// the fence ring (u, v), clockwise from the north-west corner: avenue side, bridge end, the river side 5 m inside the quay service road (OSM w114683957: (-11.2, 293.8) (31.6, 289.5)
// (67.2, 279.1) (335, 147.1) in this frame; the road stays free), the west side
const FENCE = [[-4, -1], [352, -1], [352, 133.2], [65, 274.6], [30.6, 284.6], [-4, 288.1]];
const CRANES = [{ u: 70, v: 205, H: 62, az: 0.7, J: 52 }, { u: 150, v: 182, H: 57, az: 3.4, J: 48 }, { u: 146, v: 78, H: 54, az: 1.9, J: 46 }, { u: 204, v: 146, H: 60, az: -1.1, J: 50 }];

const holeEdges = (ring) => ringEdges(polyOf(ring)).map((e) => ({ ...e, n: [-e.n[0], -e.n[1]] }));
/** walls of one ring: an optional base course (tile `baseMat`, height base), the storeys (tile `mat`, bay x floor), a mitred cornice band */
function walls(P, M, edges, o) {
  for (const e of edges) onEdge(P, e, (len) => {
    const nb = Math.max(1, Math.round(len / o.bay)), nf = Math.max(1, Math.round((o.top - o.base) / o.floor));
    if (o.base > 0) { const n0 = Math.max(1, Math.round(len / (o.baseBay || o.bay))); P.quad(o.baseMat, [0, 0, 0], [len, 0, 0], [len, o.base, 0], [0, o.base, 0], [0, 0, 1], [[0, 0], [n0, 0], [n0, 1], [0, 1]]); }
    P.quad(o.mat, [0, o.base, 0], [len, o.base, 0], [len, o.top, 0], [0, o.top, 0], [0, 0, 1], [[0, 0], [nb, 0], [nb, nf], [0, nf]]);
  });
  if (o.cornice !== false) {
    band(P, edges, o.top - 0.75, o.top - 0.35, 0.3, { front: M.stoneShade, under: M.stoneShade });
    band(P, edges, o.top - 0.35, o.top, 0.6, { front: M.stone, top: M.stone, under: M.stoneShade });
    if (o.base > 0) band(P, edges, o.base - 0.12, o.base + 0.18, 0.18, { front: M.stone, top: M.stone, under: M.stoneShade });
  }
}
/** scaffold skin 1.3 m in front of the edges picked by pick(e, i) -> [u0, u1] | true | false; a green net on every third bay */
function scaffold(P, M, edges, top, pick, seed = 0) {
  edges.forEach((e, i) => {
    const r = pick(e, i); if (!r) return;
    onEdge(P, e, (len) => {
      const u0 = r === true ? -1.3 : r[0], u1 = r === true ? len + 1.3 : r[1], w = u1 - u0, nu = Math.max(1, Math.round(w / 3)), nv = Math.max(1, Math.round((top + 1) / 2));
      P.quad(M.scaffold, [u0, 0, 1.3], [u1, 0, 1.3], [u1, top + 1, 1.3], [u0, top + 1, 1.3], [0, 0, 1], [[0, 0], [nu, 0], [nu, nv], [0, nv]]);
      for (let k = 0; k < nu; k++) if ((k + i + seed) % 3 === 0) { const a = u0 + w * k / nu, b = u0 + w * (k + 1) / nu, y0 = 2 + ((k * 7 + i * 3) % 4) * 2, y1 = Math.min(top, y0 + 10 + ((k + seed) % 3) * 4); P.quad(M.net, [a, y0, 1.36], [b, y0, 1.36], [b, y1, 1.36], [a, y1, 1.36], [0, 0, 1], [[0, 0], [1, 0], [1, (y1 - y0) / 2], [0, (y1 - y0) / 2]]); }
    });
  });
}
const cube = (P, mat, u, v, w, d, y0, y1, rot = 0, skip = 'b') => { P.push(u, 0, v, rot); P.box(mat, -w / 2, w / 2, y0, y1, -d / 2, d / 2, skip); P.pop(); };
/** a box whose four sides carry one texture tile each (cabins, pallet stacks) and a plain top */
function crate(P, sideMat, topMat, u, v, w, d, y0, y1, rot = 0, nu = 1) {
  P.push(u, 0, v, rot);
  const q = (a, b, n, len) => P.quad(sideMat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], n, [[0, 0], [Math.max(1, Math.round(len * nu)), 0], [Math.max(1, Math.round(len * nu)), 1], [0, 1]]);
  q([-w / 2, d / 2], [w / 2, d / 2], [0, 0, 1], w / 6); q([w / 2, -d / 2], [-w / 2, -d / 2], [0, 0, -1], w / 6); q([w / 2, d / 2], [w / 2, -d / 2], [1, 0, 0], d / 6); q([-w / 2, -d / 2], [-w / 2, d / 2], [-1, 0, 0], d / 6);
  P.quad(topMat, [-w / 2, y1, d / 2], [w / 2, y1, d / 2], [w / 2, y1, -d / 2], [-w / 2, y1, -d / 2], [0, 1, 0]);
  P.pop();
}

export function build(K) {
  const P = K.P, M = K.M, ctx = K.ctx, ph = ctx.physics, F = SITE;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksVladimir] quarter/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(F.ox, 0, F.oz, F.rot);
  stage('ground', () => fillPolyFine(P, M.gravel, FENCE, 0.045, { tile: 4, maxEdge: 24 }));
  stage('palace', () => palace(P, M));
  stage('department', () => department(P, M));
  stage('housing', () => housing(P, M));
  stage('court', () => court(P, M));
  stage('yard', () => yard(K));
  stage('cranes', () => { for (const c of CRANES) crane(P, M, c); });
  stage('fence', () => fence(K));
  P.pop();
  stage('colliders', () => {
    for (const r of [R_PALACE, R_ENERGY, R_DEPT, R_HOUSE, R_COURT]) addPolyColliders(ctx, F.poly(r), 0, 32, 0.9);
    for (const c of CRANES) F.box(ph, c.u, c.v, 5, 5, 0, 0, 8);
    F.cyl(ph, BOW.u + 2, BOW.v, BOW.R + 0.5, 0, 30);
  });
  K.svc.monuments.push({ id: 'w30352230', name: 'Дворец танца Бориса Эйфмана (строится)', x: F.W(70, 33).x, z: F.W(70, 33).z, h: 32 }, { id: 'w1513983337', name: 'Комплекс зданий Верховного суда (строится)', x: F.W(232, 150).x, z: F.W(232, 150).z, h: 27.5 });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the Dance Palace
function palace(P, M) {
  const top = 24, E = ringEdges(polyOf(R_PALACE));
  walls(P, M, E, { base: 5, baseMat: M.jqRust, top, mat: M.jqStone, bay: 3.6, floor: 4.75 });
  P.cap(M.jqRoof, R_PALACE, top, true, 6);
  // fly tower: plain stone with a blind top band
  const EF = ringEdges(polyOf(R_FLY));
  for (const e of EF) onEdge(P, e, (len) => P.quad(M.stone, [0, top, 0], [len, top, 0], [len, 32, 0], [0, 32, 0], [0, 0, 1], [[0, 0], [len / 4, 0], [len / 4, 2], [0, 2]]));
  band(P, EF, 31.4, 32, 0.35, { front: M.stoneShade, top: M.stone, under: M.stoneShade }); P.cap(M.jqRoof, R_FLY, 32, true, 6);
  // energy block at the west end
  const EE = ringEdges(polyOf(R_ENERGY));
  walls(P, M, EE, { base: 0, top: 13, mat: M.jqStone, bay: 3.4, floor: 4.3 }); P.cap(M.jqRoof, R_ENERGY, 13, true, 6);
  // the bow front: rusticated podium, the glazed drum behind eight giant columns, entablature ring, low dome
  const { u, v, R } = BOW, N = 20, ang = (i) => Math.PI * (i / N - 0.5);                // from -90 deg (north side) to +90 deg, bulging to +u
  const pt = (r, a) => [u + Math.cos(a) * r, v + Math.sin(a) * r];
  for (let i = 0; i < N; i++) {
    const a0 = ang(i), a1 = ang(i + 1), am = (a0 + a1) / 2, n = [Math.cos(am), 0, Math.sin(am)];
    const q = (mat, r, y0, y1, uv) => { const p = pt(r, a0), s = pt(r, a1); P.quad(mat, [p[0], y0, p[1]], [s[0], y0, s[1]], [s[0], y1, s[1]], [p[0], y1, p[1]], n, uv); };
    q(M.jqRust, R + 1.2, 0, 5, [[i, 0], [i + 1, 0], [i + 1, 1], [i, 1]]);
    q(M.yubGlass, R - 2.2, 5, 21, [[i, 0], [i + 1, 0], [i + 1, 1], [i, 1]]);
    q(M.stone, R + 1.0, 21, 23.6, [[i / 2, 0], [(i + 1) / 2, 0], [(i + 1) / 2, 0.6], [i / 2, 0.6]]);
    { const p = pt(R + 1.2, a0), s = pt(R + 1.2, a1); P.fan(M.slab, [[p[0], 5, p[1]], [s[0], 5, s[1]], [u, 5, v]], [0, 1, 0], (w) => [w[0] / 4, w[2] / 4]); }
    { const p = pt(R + 1.0, a0), s = pt(R + 1.0, a1), p2 = pt(R - 1.0, a0), s2 = pt(R - 1.0, a1); P.quad(M.stone, [p[0], 23.6, p[1]], [s[0], 23.6, s[1]], [s2[0], 23.6, s2[1]], [p2[0], 23.6, p2[1]], [0, 1, 0]); P.quad(M.stoneShade, [p[0], 21, p[1]], [s[0], 21, s[1]], [s2[0], 21, s2[1]], [p2[0], 21, p2[1]], [0, -1, 0]); }
  }
  for (let k = 0; k < 8; k++) { const a = Math.PI * ((k + 0.5) / 8 - 0.5), p = pt(R, a); doric(P, M, p[0], p[1], 5, 21, 0.85); }
  // dome: a shallow cap over the bow and the hall behind it (half hidden in the roof of the block)
  const DOME = [[1.0, 0], [0.97, 0.22], [0.86, 0.5], [0.66, 0.76], [0.36, 0.94], [0.08, 1.0]];
  G.lathe(P, M.jqDome, 'jqdome', DOME, u, 25.2, v, R - 1.2, 6.6, 28, 10);
  G.tube(P, M.stoneShade, u, v, 23.6, 25.2, R - 1.0, R - 1.0, 28, 8, 0.4);
}

// ------------------------------------------------------------------------------------------------ the Judicial Department
function department(P, M) {
  const top = 26, E = ringEdges(polyOf(R_DEPT));
  walls(P, M, E, { base: 5, baseMat: M.jqRust, top, mat: M.jqStone, bay: 3.6, floor: 4.2 });
  P.cap(M.jqRoof, R_DEPT, top, true, 6);
  // the west end is still in scaffolding (photo jq_mr7_03)
  scaffold(P, M, E, top, (e, i) => (i === 3 ? true : i === 0 ? [e.len - 34, e.len + 1.3] : i === 2 ? [-1.3, 30] : false), 1);
  for (const [u, w] of [[40, 8], [84, 10], [118, 7]]) cube(P, M.stoneShade, u, 105, w, 6, top, top + 2.2);
}

// ------------------------------------------------------------------------------------------------ the housing comb (all in scaffolding)
function housing(P, M) {
  const top = 28.5, E = ringEdges(polyOf(R_HOUSE)), o = { base: 0, top, mat: M.jqIns, bay: 3.4, floor: 3.1, cornice: false };
  walls(P, M, E, o);
  for (const h of H_HOUSE) walls(P, M, holeEdges(h), o);
  P.cap(M.jqRoof, R_HOUSE, top, true, 6, H_HOUSE);
  band(P, E, top, top + 0.9, 0.0, { front: M.slab });
  scaffold(P, M, E, top, () => true, 0);
  // brick-red vent blocks and lift heads on the roof (photo jq_font_06)
  const r = [[9, 170], [9, 215], [9, 255], [40, 156], [78, 156], [112, 156], [128, 180], [128, 215], [52, 200], [52, 240], [95, 190], [95, 222], [75, 252], [110, 235]];
  r.forEach(([u, v], k) => cube(P, k % 3 ? M.rust : M.slab, u, v, 3 + (k % 2) * 2, 2.5, top, top + 1.6 + (k % 3) * 0.7));
}

// ------------------------------------------------------------------------------------------------ the Supreme Court
function court(P, M) {
  const top = 24, E = ringEdges(polyOf(R_COURT)), o = { base: 3, baseMat: M.stone, top, mat: M.jqStrip, bay: 3.3, floor: 4.2 };
  walls(P, M, E, o);
  for (const h of H_COURT) walls(P, M, holeEdges(h), { ...o, cornice: false });
  P.cap(M.jqRoof, R_COURT, top, true, 6, H_COURT);
  // set-back attic storey round the same two courts, a glazed atrium over the east one
  const cx = 232, cz = 152, A = R_COURT.map(([u, v]) => [cx + (u - cx) * 0.9, cz + (v - cz) * 0.86]), EA = ringEdges(polyOf(A));
  for (const e of EA) onEdge(P, e, (len) => { const nb = Math.max(1, Math.round(len / 3.3)); P.quad(M.jqStrip, [0, top, 0], [len, top, 0], [len, 27.5, 0], [0, 27.5, 0], [0, 0, 1], [[0, 0.15], [nb, 0.15], [nb, 0.98], [0, 0.98]]); });
  band(P, EA, 27.1, 27.5, 0.3, { front: M.stone, top: M.stone, under: M.stoneShade });
  P.cap(M.jqRoof, A, 27.5, true, 6, H_COURT);
  for (const h of H_COURT) for (const e of holeEdges(h)) onEdge(P, e, (len) => P.quad(M.stoneShade, [0, top, 0], [len, top, 0], [len, 27.5, 0], [0, 27.5, 0], [0, 0, 1]));
  P.cap(M.jqDome, H_COURT[1], 27.35, true, 3);
  // the river portico: ten giant columns on a stone podium in the middle of the long diagonal front
  const river = E.reduce((b, e) => (e.len > b.len ? e : b), E[0]);
  onEdge(P, river, (len) => {
    const c = len / 2, hw = 21;
    P.box(M.stone, c - hw - 1, c + hw + 1, 0, 3.4, 0, 3.4, 'bk');
    for (let k = 0; k < 10; k++) doric(P, M, c - hw + 2 + k * (2 * hw - 4) / 9, 2.3, 3.4, 20.6, 0.8);
    P.box(M.stone, c - hw - 0.6, c + hw + 0.6, 20.6, 23.2, 0, 3.2, 'k'); P.box(M.stone, c - hw - 1.1, c + hw + 1.1, 23.2, 24.0, 0, 3.6, 'k');
    P.box(M.stoneShade, c - hw + 2, c + hw - 2, 24.0, 26.0, 0.3, 2.6, 'bk');
  });
  // the north-west corner is still being clad (photo jq_font_06)
  scaffold(P, M, E, top, (e, i) => (i === 0 ? [e.len - 58, e.len + 1.3] : i === E.length - 1 ? true : false), 2);
}

// ------------------------------------------------------------------------------------------------ the builders' yard on the future park
function yard(K) {
  const P = K.P, M = K.M, r = K.ctx.rng(7714);
  // pallets of facing stone in rows
  for (let row = 0; row < 5; row++) for (let k = 0; k < 9; k++) { if (r() < 0.2) continue; const h = 1.2 + (r() < 0.4 ? 1.2 : 0); crate(P, M.pallets, M.silo, 166 + k * 4.4 + r() * 0.6, 9 + row * 5.2 + r() * 0.5, 2.4, 1.3, 0.05, 0.05 + h, r() * 0.08, 6 / 2.4 / 6 * 6); }
  for (let k = 0; k < 14; k++) crate(P, M.pallets, M.silo, 150 + r() * 6, 12 + k * 5 + r(), 2.4, 1.3, 0.05, 1.25 + (r() < 0.3 ? 1.2 : 0), Math.PI / 2 + r() * 0.1, 1);
  // ventilation ducts (galvanised, some red-primed)
  for (let k = 0; k < 46; k++) { const s = 1 + r() * 0.9; cube(P, r() < 0.25 ? M.rust : M.duct, 232 + r() * 44, 22 + r() * 30, s, s * (0.8 + r() * 0.6), 0.05, 0.05 + 0.9 + r() * 0.7, r() * 0.5, 'b'); }
  // steel sections and rebar bundles
  for (let k = 0; k < 9; k++) cube(P, k % 3 ? M.rust : M.steel, 205 + r() * 20, 56 + k * 2.4, 12 + r() * 4, 1.4, 0.05, 0.45 + r() * 0.4, 0.03 * (r() - 0.5), 'b');
  // a low concrete shed with a sheet roof, two mortar silos, cable drums
  cube(P, M.concrete, 268, 72, 22, 8, 0.05, 3.2, 0, 'b'); cube(P, M.cabinRoof, 268, 72, 23, 9, 3.2, 3.45, 0, '');
  for (const [u, v] of [[286, 90], [291.5, 90]]) { for (const [du, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.col(M.steel, u + du, v + dv, 0, 3.2, 0.1, 0.1, 6, false); P.col(M.silo, u, v, 3.2, 4.6, 0.4, 1.5, 14, false); P.col(M.silo, u, v, 4.6, 10.2, 1.5, 1.5, 14, true); }
  for (const [u, v] of [[258, 60], [262, 61], [247, 64]]) { P.cyl(M.timber, [u, 1.0, v - 0.6], [u, 1.0, v + 0.6], 1.0, 1.0, 14, true); }
  // site cabins at the bridge end: two-storey rows, white with a few blue ones
  for (let row = 0; row < 3; row++) for (let k = 0; k < 5; k++) for (let fl = 0; fl < 2; fl++) {
    if (fl === 1 && r() < 0.25) continue;
    const blue = r() < 0.22; crate(P, blue ? M.cabinBlue : M.cabin, M.cabinRoof, 318 + row * 11.5, 10 + k * 6.3, 2.6, 6.0, 0.05 + fl * 2.65, 2.65 + fl * 2.65, 0, 1);
  }
  // a truck crane with a green telescopic boom between the Department and the Court
  cube(P, M.craneGrey, 148, 132, 3, 11, 0.6, 2.0, 0.3, ''); cube(P, M.craneGreen, 148.6, 130, 2.6, 4, 2.0, 3.6, 0.3, 'b');
  for (const dz of [-3.5, 0, 3.5]) for (const dx of [-1.3, 1.3]) { const c = Math.cos(0.3), s = Math.sin(0.3); P.cyl(M.iron, [148 + dx * c + dz * s - 0.2 * Math.sign(dx), 0.6, 132 - dx * s + dz * c], [148 + dx * c + dz * s + 0.2 * Math.sign(dx), 0.6, 132 - dx * s + dz * c], 0.6, 0.6, 10, true); }
  P.cyl(M.craneGreen, [148.5, 3.4, 131], [160, 36, 122], 0.75, 0.42, 8, true); P.cyl(M.iron, [160, 36, 122], [160, 8, 122], 0.05, 0.05, 4, false);
  void L;
}

// ------------------------------------------------------------------------------------------------ a tower crane: lattice mast, cat head, jib with a red tip, counter-jib with ballast
function crane(P, M, c) {
  const { u, v, H, az, J } = c, CJ = 15, w = 1.0;
  P.push(u, 0, v, az);                                                       // local +z = the jib direction
  P.box(M.concrete, -2.6, 2.6, 0, 1.0, -2.6, 2.6, 'b');
  const lat = (mat, a, b, h0, h1, n, nu, nv) => P.quad(mat, [a[0], h0, a[1]], [b[0], h0, b[1]], [b[0], h1, b[1]], [a[0], h1, a[1]], n, [[0, 0], [nu, 0], [nu, nv], [0, nv]]);
  lat(M.lattice, [-w, w], [w, w], 1, H, [0, 0, 1], 1, (H - 1) / 2); lat(M.lattice, [w, -w], [-w, -w], 1, H, [0, 0, -1], 1, (H - 1) / 2);
  lat(M.lattice, [w, w], [w, -w], 1, H, [1, 0, 0], 1, (H - 1) / 2); lat(M.lattice, [-w, -w], [-w, w], 1, H, [-1, 0, 0], 1, (H - 1) / 2);
  // solid chords: the alpha lattice fades out with distance (mip maps), the chords keep the silhouette from the Spit 600 m away
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.box(M.craneWhite, sx * w - 0.11, sx * w + 0.11, 1, H, sz * w - 0.11, sz * w + 0.11, 'tb');
  P.box(M.craneWhite, -1.3, 1.3, H, H + 1.3, -1.3, 1.3, ''); P.box(M.craneWhite, 1.3, 2.9, H + 0.2, H + 2.3, 0.2, 2.2, ''); P.box(M.glassDark, 1.5, 2.95, H + 1.0, H + 2.1, 2.2, 2.26, 'k');
  // cat head
  const yt = H + 9.5;
  for (const [a, b] of [[[-0.9, 0.9], [0.9, 0.9]], [[0.9, -0.9], [-0.9, -0.9]]]) P.quad(M.lattice, [a[0], H + 1.3, a[1]], [b[0], H + 1.3, b[1]], [b[0] * 0.15, yt, b[1] * 0.15], [a[0] * 0.15, yt, a[1] * 0.15], [0, 0.1, a[1] > 0 ? 1 : -1], [[0, 0], [1, 0], [1, 4], [0, 4]]);
  for (const sx of [-1, 1]) P.quad(M.lattice, [sx * 0.9, H + 1.3, 0.9], [sx * 0.9, H + 1.3, -0.9], [sx * 0.14, yt, -0.14], [sx * 0.14, yt, 0.14], [sx, 0.1, 0], [[0, 0], [1, 0], [1, 4], [0, 4]]);
  // jib (triangular section: two inclined lattice faces and the bottom one), the last 8 m red and white
  const yj = H + 1.6, jh = 1.5, jw = 0.75;
  const seg = (mat, z0, z1) => {
    const n = (z1 - z0) / 2;
    P.quad(mat, [jw, yj, z0], [jw, yj, z1], [0, yj + jh, z1], [0, yj + jh, z0], [1, 0.5, 0], [[0, 0], [n, 0], [n, 1], [0, 1]]);
    P.quad(mat, [-jw, yj, z1], [-jw, yj, z0], [0, yj + jh, z0], [0, yj + jh, z1], [-1, 0.5, 0], [[0, 0], [n, 0], [n, 1], [0, 1]]);
    P.quad(mat, [-jw, yj, z0], [jw, yj, z0], [jw, yj, z1], [-jw, yj, z1], [0, -1, 0], [[0, 0], [1, 0], [1, n], [0, n]]);
  };
  seg(M.lattice, 1.3, J - 8); seg(M.latticeRed, J - 8, J);
  for (const [x, y] of [[-jw, yj], [jw, yj], [0, yj + jh]]) { P.box(M.craneWhite, x - 0.09, x + 0.09, y - 0.09, y + 0.09, 1.3, J - 8, ''); P.box(M.craneRed, x - 0.09, x + 0.09, y - 0.09, y + 0.09, J - 8, J, ''); }
  for (const sx of [-1, 1]) P.cyl(M.craneWhite, [sx * 0.9, H + 1.3, 0], [sx * 0.14, yt, 0], 0.1, 0.1, 5, false);
  // counter-jib with ballast blocks
  P.box(M.craneWhite, -0.9, 0.9, yj - 0.1, yj + 0.25, -CJ, -1.3, ''); P.quad(M.lattice, [-0.9, yj + 0.25, -1.3], [-0.9, yj + 0.25, -CJ], [-0.9, yj + 1.35, -CJ], [-0.9, yj + 1.35, -1.3], [-1, 0, 0], [[0, 0], [6, 0], [6, 0.5], [0, 0.5]]);
  P.quad(M.lattice, [0.9, yj + 0.25, -CJ], [0.9, yj + 0.25, -1.3], [0.9, yj + 1.35, -1.3], [0.9, yj + 1.35, -CJ], [1, 0, 0], [[0, 0], [6, 0], [6, 0.5], [0, 0.5]]);
  for (let k = 0; k < 3; k++) P.box(M.concrete, -1.0, 1.0, yj - 2.4, yj - 0.1, -CJ + 0.3 + k * 1.1, -CJ + 1.2 + k * 1.1, '');
  // pendants, trolley, hoist rope and hook block
  for (const [z, y] of [[J * 0.42, yj + jh], [J * 0.82, yj + jh], [-CJ + 1, yj + 1.3]]) P.cyl(M.craneGrey, [0, yt, 0], [0, y, z], 0.05, 0.05, 4, false);
  const zt = J * (0.35 + 0.3 * ((u * 7 + v) % 5) / 5), drop = H * 0.45;
  P.box(M.craneGrey, -0.6, 0.6, yj - 0.5, yj, zt - 0.8, zt + 0.8, ''); P.cyl(M.craneGrey, [0, yj - 0.5, zt], [0, yj - drop, zt], 0.04, 0.04, 4, false); P.box(M.craneRed, -0.35, 0.35, yj - drop - 0.9, yj - drop, zt - 0.3, zt + 0.3, '');
  P.pop();
  void TAU;
}

// ------------------------------------------------------------------------------------------------ the site fence
function fence(K) {
  const P = K.P, M = K.M, ph = K.ctx.physics, F = SITE, n = FENCE.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const a = FENCE[i], b = FENCE[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // a segment is skipped when it would stand in the water or on a carriageway (never the case on today's data: a guard for a re-bake)
    let bad = false; for (let k = 0; k <= 8; k++) { const p = F.W(a[0] + (b[0] - a[0]) * k / 8, a[1] + (b[1] - a[1]) * k / 8); if (L.waterwayAt(p.x, p.z) || L.isOnRoad(p.x, p.z, 0.3)) bad = true; }
    if (bad) { console.warn(`[landmarksVladimir] quarter fence segment ${i} dropped (water / road)`); continue; }
    const grey = i === 1, h = grey ? 3.2 : 6.4, mat = grey ? M.fenceGrey : M.fenceBlue, nu = Math.max(1, Math.round(len / 2)), nv = grey ? 1 : 1;
    P.quad(mat, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], null, [[0, 0], [nu, 0], [nu, nv], [0, nv]]);
    const mid = F.W((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    ph.addBox(mid.x, mid.z, len, 0.3, Math.atan2(-(b[1] - a[1]), b[0] - a[0]) + F.rot, 0, h);
    total += len;
  }
  // steel posts behind the sheet every 6 m on the tall runs (the avenue side)
  for (let u = 0; u <= 350; u += 6) P.box(M.steel, u - 0.08, u + 0.08, 0, 6.4, -0.9, -0.74, 'b');
  // the timber-roofed footway along pr. Dobrolyubova (photo jq_mr7_04): roof boards, posts, a blue skirt to the street
  const v0 = -3.4, v1 = -1.05, u0 = 2, u1 = 346;
  P.box(M.timber, u0, u1, 2.75, 2.87, v0 - 0.2, v1, '');
  for (let u = u0; u <= u1 + 0.1; u += 4) { P.box(M.timber, u - 0.06, u + 0.06, 0, 2.75, v0 - 0.06, v0 + 0.06, 'bt'); P.box(M.timber, u - 0.05, u + 0.05, 2.5, 2.75, v0, v1, 'bt'); }
  P.quad(M.fenceBlue, [u0, 0.12, v0 - 0.07], [u1, 0.12, v0 - 0.07], [u1, 1.15, v0 - 0.07], [u0, 1.15, v0 - 0.07], null, [[0, 0.02], [(u1 - u0) / 2, 0.02], [(u1 - u0) / 2, 0.18], [0, 0.18]]);
  { const m = F.W((u0 + u1) / 2, v0 - 0.07); ph.addBox(m.x, m.z, u1 - u0, 0.2, F.rot, 0, 1.2); }
  K.svc.fences.push({ id: 'judicial-quarter', kind: 'site fence', len: Math.round(total) });
}
