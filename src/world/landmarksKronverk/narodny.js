// landmarksKronverk/narodny.js - the NARODNY DOM ROW on the north-west of Alexander Park (dossier docs/research/kronverk.md section 6; photos refs/kronverk 59 60 62 64 66 78 79 80 81 83).
// The fronts face NNW to Kronverksky pr. (row axis U = (0.897, -0.441), front normal N = (-0.441, -0.897)); the stage boxes lie on the SSE side.
//   * Baltic House (r3555514; Miturich / Makashov 1933-39): grey Stalinist block, the portico of ten Composite columns with the attic, the blind arch and «БАЛТИЙСКИЙ ДОМ», steps, the stage box;
//   * Planetarium = the Iron Hall wing (r3555516; Lutsedarsky 1898-1900): yellow two-storey front, the entrance pavilion with the columned porch and the silver observatory dome;
//   * Music Hall = the Opera hall (r3555515: body r18097683, link r3555521, porch r18097684, stage block = the rest of the outline): ochre front with three great arches between two pedimented corner
//     pavilions, the low grey dome with its lattice lantern, the plain yellow stage box, the «МЮЗИК-ХОЛЛ» colonnade of the link;
//   * the service wing r3555518 and the Velikan Park cinema block (w203600211, 2010: glass and grey panels).
// Walls are painted bays (mats.js M.fac / M.bay) on the baked footprints; porticoes, domes, pediments and steps are geometry.  All houses are closed (solid); the doors are published as entrances.
import * as THREE from 'three';
import { onEdge } from './kit.js';
import * as G from './geo.js';
import { byId, pairs, dist, centroid, rotOut } from './frame.js';
import { house, hipRoof } from './house.js';
import { C } from './mats.js';

const U = [0.897, -0.441], N = [-0.441, -0.897];
const near = (e, ax, az, bx, bz, tol = 1.2) => (Math.hypot(e.a[0] - ax, e.a[1] - az) < tol && Math.hypot(e.b[0] - bx, e.b[1] - bz) < tol) || (Math.hypot(e.a[0] - bx, e.a[1] - bz) < tol && Math.hypot(e.b[0] - ax, e.b[1] - az) < tol);

export function build(K) {
  const errs = [];
  for (const [name, fn] of [['baltic', balticHouse], ['planetarium', planetarium], ['musichall', musicHall], ['velikan', velikan]]) {
    try { fn(K); } catch (e) { console.error(`[landmarksKronverk] narodny/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); }
  }
  if (errs.length) throw new Error(errs.join('\n'));
}
const label = (K, id, x, y, z, w, h, n, kind = 'shop') => { const l = K.ctx.services?.labels; return !l || l.reserve(id, x, y, z, w, h, n[0], n[1], kind); };

// ================================================================== Baltic House
function balticHouse(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const rec = byId('r3555514'); if (!rec) return;
  const Hh = 17.5;
  const st = { key: 'baltic', H: Hh, bay: 4.3, trim: C.balticL, roof: 'roofRed', flat: true, parapet: 0.9, cornice: 0.55,
    fac: { wall: C.baltic, trim: C.balticL, socle: C.balticD, socleH: 1.3, glass: '#2c3640', frame: '#6a6a66', floors: [{ h: 5.2, win: 'rect', ww: 1.9, wh: 3.0, sill: 1.5, nh: 2 }, { h: 6.0, win: 'rect', ww: 1.9, wh: 4.0, sill: 0.9, nh: 3, pil: 0.9 }, { h: 5.0, win: 'rect', ww: 1.9, wh: 2.4, sill: 0.9, nh: 2, pil: 0.9 }], cornice: 1.0 } };
  house(K, rec, st);
  // the stage box over the rear of the house
  const cb = centroid(pairs(rec.polys[0].o)), sc = [cb[0] - N[0] * 7 + U[0] * 2, cb[1] - N[1] * 7 + U[1] * 2];
  P.push(sc[0], 0, sc[1], rotOut(N[0], N[1])); P.box(M.baltic, -15, 15, Hh - 1, 27, -11, 11, 'b', 3); P.box(M.balticL, -15.4, 15.4, 27, 27.5, -11.4, 11.4, '', 3); P.box(M.balticD, -9, 9, 27.5, 30, -6, 6, 'b', 3); P.pop();
  // ---- the portico on the NNW front (centre of the 64 m face)
  const pc = [(-2171 - 2114.2) / 2, (-2603.5 - 2632.8) / 2], rot = rotOut(N[0], N[1]);
  const W = (lx, lz) => [pc[0] + Math.cos(rot) * lx + Math.sin(rot) * lz, pc[1] - Math.sin(rot) * lx + Math.cos(rot) * lz];
  const PW = 17.6, PD = 5.2, PY = 1.5, CH = 11.0, NS = 9, run = 0.34;
  P.push(pc[0], 0, pc[1], rot);
  P.box(M.graniteGrey, -PW - 1, PW + 1, 0, PY, 0, PD + 0.6, 'b', 2);
  for (let i = 0; i < NS; i++) P.box(M.graniteGreyFlat, -PW - 1, PW + 1, 0, PY - (i + 1) * PY / (NS + 1), PD + 0.6 + i * run, PD + 0.6 + (i + 1) * run, 'b', 2);
  const colX = [-16.2, -14.2, -10.3, -8.3, -3.5, 3.5, 8.3, 10.3, 14.2, 16.2];
  for (const x of colX) {
    P.box(M.balticD, x - 0.85, x + 0.85, PY, PY + 0.5, 3.35, 5.05, 'b', 2);
    P.col(M.balticL, x, 4.2, PY + 0.5, PY + CH - 0.9, 0.66, 0.56, 14, false);
    P.col(M.balticL, x, 4.2, PY + CH - 0.9, PY + CH - 0.2, 0.6, 0.86, 10, false); P.box(M.balticL, x - 0.9, x + 0.9, PY + CH - 0.2, PY + CH, 3.3, 5.1, '', 2);
  }
  // entablature, cornice, the attic with the blind arch
  const Y1 = PY + CH;
  P.box(M.baltic, -PW - 0.2, PW + 0.2, Y1, Y1 + 1.9, -0.3, PD + 0.1, '', 3); P.box(M.balticL, -PW - 0.6, PW + 0.6, Y1 + 1.9, Y1 + 2.4, -0.3, PD + 0.6, '', 3);
  P.box(M.underside, -PW, PW, Y1 - 0.02, Y1, 0, PD, 'tlrfk', 1);
  const YA = Y1 + 2.4, AT = YA + 8.6;
  P.box(M.baltic, -PW, PW, YA, AT, -6, 3.4, 'b', 3); P.box(M.balticL, -PW - 0.3, PW + 0.3, AT, AT + 0.45, -6.3, 3.7, '', 3); P.box(M.balticD, -11, 11, AT + 0.45, AT + 1.4, -5, 2.6, 'b', 3);
  { const sh = new THREE.Shape(); sh.moveTo(-9.6, YA + 0.4); sh.absarc(0, YA + 0.4, 9.6, Math.PI, 0, true); sh.lineTo(-9.6, YA + 0.4); const g = new THREE.ShapeGeometry(sh, 20); P.geo(M.balticD, g, 0, 0, 3.43); g.dispose();
    const rg = new THREE.Shape(); rg.moveTo(-10.4, YA + 0.4); rg.absarc(0, YA + 0.4, 10.4, Math.PI, 0, true); rg.lineTo(9.6, YA + 0.4); rg.absarc(0, YA + 0.4, 9.6, 0, Math.PI, false); rg.lineTo(-10.4, YA + 0.4); P.extrude(M.balticL, rg, 3.4, 0.16, 3, 20); }
  const wp = W(0, 3.62);
  if (label(K, 'r3555514', wp[0], YA + 1.3, wp[1], 8.4, 1.7, N)) {
    const sg = M.sign('baltdom', 1024, 208, ['БАЛТИЙСКИЙ', 'Д   О   М'], { bg: '#e9e6dc', fg: '#c9981e', font: M.FONT.sans, pad: 0.35 });
    P.box(M.white, -4.3, 4.3, YA + 0.4, YA + 2.2, 3.43, 3.58, '', 2); P.quad(sg, [-4.2, YA + 0.45, 3.6], [4.2, YA + 0.45, 3.6], [4.2, YA + 2.15, 3.6], [-4.2, YA + 2.15, 3.6], [0, 0, 1]);
  }
  // the wall behind the columns: three tall glazed doorways and windows between the columns
  for (const x of [-6.9, 0, 6.9]) { P.quad(M.glass, [x - 1.6, PY, 0.04], [x + 1.6, PY, 0.04], [x + 1.6, PY + 7.6, 0.04], [x - 1.6, PY + 7.6, 0.04], [0, 0, 1]); P.quad(M.col('#5a2a26'), [x - 1.4, PY, 0.06], [x + 1.4, PY, 0.06], [x + 1.4, PY + 2.7, 0.06], [x - 1.4, PY + 2.7, 0.06], [0, 0, 1]); }
  P.pop();
  { const c = W(0, (PD + 0.6) / 2); ph.addWalkBox(c[0], c[1], 2 * PW + 2, PD + 0.6, rot, PY, 0); const s = W(0, PD + 0.6 + NS * run / 2); ph.addStairs(s[0], s[1], 2 * PW + 2, NS * run, rot + Math.PI, 0, PY, NS);
    for (const x of colX) { const q = W(x, 4.2); ph.addCylinder(q[0], q[1], 0.75, 0, PY + CH); } }
  const d = W(0, 0.5); svc.entrances.push({ x: d[0], z: d[1], rotY: rot, name: 'Театр-фестиваль «Балтийский дом»', bldg: 'r3555514', closed: true });
  const ps = W(4, 40); svc.photoSpots.push({ x: ps[0], z: ps[1], yaw: 180 - 26, name: 'Балтийский дом' }); svc.crowd.push({ x: W(0, 14)[0], z: W(0, 14)[1], r: 9, n: 8, name: 'у «Балтийского дома»' });
}

// ================================================================== Planetarium (the Iron Hall wing) and the service wing
function planetarium(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const yel = { key: 'narodny-yellow', H: 11.6, bay: 4.2, trim: C.cream, roof: 'roofZinc', cornice: 0.5, roofD: 5.5, rise: 2.2,
    fac: { wall: C.yellow, trim: C.cream, socle: '#9a948a', socleH: 0.9, floors: [{ h: 5.3, win: 'arch', ww: 1.9, wh: 3.2, sill: 1.1, rust: true, rustCol: '#dcbc60' }, { h: 5.5, win: 'rect', ww: 2.5, wh: 3.0, sill: 1.0, nv: 2, pil: 0.7 }], cornice: 0.8 } };
  for (const id of ['r3555516', 'r3555518']) { const r = byId(id); if (r) house(K, r, yel); }
  // the entrance pavilion at the west end of the front
  const A = [-2241.1, -2562.5], B = [-2229.2, -2568.4], c = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], hw = dist(A, B) / 2 + 0.07,   /* 7 cm proud of the end wall of the wing: no coplanar walls */ rot = rotOut(N[0], N[1]);
  const W = (lx, lz) => [c[0] + Math.cos(rot) * lx + Math.sin(rot) * lz, c[1] - Math.sin(rot) * lx + Math.cos(rot) * lz];
  const HT = 16.4;
  const tf = M.fac({ key: 'planet-tower', H: HT, bay: hw * 2, wall: '#ecdcae', trim: C.cream, socle: '#9a948a', socleH: 0.9, floors: [{ h: 5.6, win: 'door', ww: 2.6, wh: 3.4, sill: 0 }, { h: 5.6, win: 'rect', ww: 3.2, wh: 3.6, sill: 0.9, nv: 2, nh: 2, pil: 1.0 }, { h: 4.3, win: 'arch', ww: 3.0, wh: 2.0, sill: 1.0, pil: 1.0 }], cornice: 0.8 });
  const ts = M.fac({ key: 'planet-tower-side', H: HT, bay: 7.4, wall: '#ecdcae', trim: C.cream, socle: '#9a948a', socleH: 0.9, floors: [{ h: 11.2, win: 'none' }, { h: 4.3, win: 'rect', ww: 1.4, wh: 1.6, sill: 1.2 }], cornice: 0.8 });
  P.push(c[0], 0, c[1], rot);
  const q = (mat, a, b, nn) => P.quad(mat, [a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], HT, b[1]], [a[0], HT, a[1]], nn, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  q(tf, [-hw, 0.9], [hw, 0.9], [0, 0, 1]); q(ts, [hw, 0.9], [hw, -6.5], [1, 0, 0]); q(ts, [-hw, -6.5], [-hw, 0.9], [-1, 0, 0]); q(ts, [hw, -6.5], [-hw, -6.5], [0, 0, -1]);
  P.box(M.cream, -hw - 0.35, hw + 0.35, HT, HT + 0.4, -6.85, 1.25, '', 2);
  // porch: four columns carrying a balcony, steps
  P.box(M.graniteGrey, -hw - 0.6, hw + 0.6, 0, 0.75, 0.9, 4.4, 'b', 2); for (let i = 0; i < 4; i++) P.box(M.graniteGreyFlat, -hw - 0.6, hw + 0.6, 0, 0.75 - (i + 1) * 0.15, 4.4 + i * 0.34, 4.74 + i * 0.34, 'b', 2);
  for (const x of [-5.2, -2.3, 2.3, 5.2]) { P.box(M.cream, x - 0.45, x + 0.45, 0.75, 1.6, 3.0, 3.9, 'b', 2); P.col(M.cream, x, 3.45, 1.6, 5.3, 0.34, 0.3, 10, false); P.box(M.cream, x - 0.45, x + 0.45, 5.3, 5.6, 3.0, 3.9, '', 2); }
  P.box(M.cream, -hw - 0.2, hw + 0.2, 5.6, 6.1, 0.9, 4.1, '', 2); for (const x of [-6.0, -3.0, 0, 3.0, 6.0]) P.box(M.cream, x - 0.14, x + 0.14, 6.1, 7.0, 3.85, 4.1, 'b', 2); P.box(M.cream, -hw - 0.2, hw + 0.2, 7.0, 7.14, 3.8, 4.15, '', 2);
  // the observatory: a drum and the silver dome
  P.cyl(M.cream, [0, HT + 0.4, -2.6], [0, HT + 3.0, -2.6], 3.0, 3.0, 16, true); P.cyl(M.cream, [0, HT + 3.0, -2.6], [0, HT + 3.25, -2.6], 3.2, 3.2, 16, true);
  G.lathe(P, M.silver, 'lmKr-obs', [[2.75, 0], [2.7, 0.6], [2.4, 1.5], [1.8, 2.2], [1.0, 2.65], [0, 2.8]], 0, HT + 3.25, -2.6, 1, 1, 18, 9);
  P.box(M.silverD, -0.35, 0.35, HT + 3.25, HT + 5.9, -2.75 + 2.3, -2.6 + 2.72, 'b', 1);
  const wp = W(0, 0.97);
  if (label(K, 'r3555516', wp[0], 6.6, wp[1], 6.0, 0.8, N)) P.quad(M.sign('planetarium', 512, 72, ['ПЛАНЕТАРИЙ'], { bg: '#24427e', fg: '#f2f2ee', font: M.FONT.sans, pad: 0.3 }), [-3.0, 6.25, 0.94], [3.0, 6.25, 0.94], [3.0, 7.0, 0.94], [-3.0, 7.0, 0.94], [0, 0, 1]);
  P.pop();
  { const b = W(0, -2.8); ph.addBox(b[0], b[1], hw * 2, 7.4, rot, 0, HT); const p = W(0, 2.65); ph.addWalkBox(p[0], p[1], hw * 2 + 1.2, 3.5, rot, 0.75, 0); const s = W(0, 5.08); ph.addStairs(s[0], s[1], hw * 2 + 1.2, 1.36, rot + Math.PI, 0, 0.75, 4);
    for (const x of [-5.2, -2.3, 2.3, 5.2]) { const cq = W(x, 3.45); ph.addCylinder(cq[0], cq[1], 0.45, 0, 5.6); } }
  const d = W(0, 1.4); svc.entrances.push({ x: d[0], z: d[1], rotY: rot, name: 'Санкт-Петербургский планетарий', bldg: 'r3555516', closed: true });
  svc.photoSpots.push({ x: W(-3, 28)[0], z: W(-3, 28)[1], yaw: 180 - 26, name: 'Планетарий' });
}

// ================================================================== Music Hall
function musicHall(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  const body = byId('r18097683'); if (!body) return;
  const Hh = 21;
  const archBay = M.bay('mh-arch', 8.13, Hh, (D) => {
    const w = D.wM, cx = w / 2;
    D.rect(0, 0, w, D.hM, C.ochre); D.speck(500, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.05)']); D.rect(0, 0, w, 1.0, '#9a948a');
    for (const x of [0, w - 0.75]) { D.rect(x, 1.0, x + 0.75, 13.2, C.ochreD); for (let y = 1.6; y < 13; y += 0.7) D.rect(x, y, x + 0.75, y + 0.05, 'rgba(0,0,0,0.2)'); }
    D.fillArch(cx, 1.0, 6.5, 11.4, '#f0e2b4'); D.fillArch(cx, 1.0, 5.7, 10.9, '#3a3026');
    D.rect(cx - 2.85, 4.5, cx + 2.85, 7.2, '#2c3a44'); for (const k of [-1.9, 0, 1.9]) { D.rect(cx + k - 0.75, 1.0, cx + k + 0.75, 4.3, '#6a2a22'); D.rect(cx + k - 0.03, 1.0, cx + k + 0.03, 4.3, '#3a1512'); }
    for (const s of [-1, 1]) D.rect(cx + s * 0.95 - 0.2, 1.0, cx + s * 0.95 + 0.2, 7.3, '#ead9a2');
    D.rect(cx - 2.85, 7.2, cx + 2.85, 7.5, '#ead9a2'); for (let x = -2.7; x < 2.75; x += 0.3) D.rect(cx + x, 7.5, cx + x + 0.12, 8.3, '#ead9a2'); D.rect(cx - 2.85, 8.3, cx + 2.85, 8.45, '#f0e2b4');
    D.g.fillStyle = '#e6d6a0'; D.g.beginPath(); D.g.arc(D.X(cx), D.Y(10.0), D.X(0.85), 0, 6.3); D.g.fill();
    D.band(13.2, 13.5, '#f0e2b4'); D.rect(0, 13.5, w, 14.4, '#7d909c'); D.band(14.4, 14.9, '#f0e2b4');
    D.window(cx, 15.9, 2.2, 2.2, { rise: 0.01, surround: 0.25, ring: '#f0e2b4', nx: 2, ny: 2, sillCol: '#f0e2b4' });
    D.band(19.4, D.hM, '#ecdca8'); D.rect(0, D.hM - 0.2, w, D.hM, '#f4e8c0');
  }, [512, 1024]);
  const fac = { wall: C.ochre, trim: '#f0e2b4', socle: '#9a948a', socleH: 1.0, floors: [{ h: 7.0, win: 'rect', ww: 2.0, wh: 3.4, sill: 1.6, rust: true, rustCol: C.ochreD, nh: 2 }, { h: 6.5, win: 'rect', ww: 2.0, wh: 3.4, sill: 1.2, hood: 'bar', pil: 0.8, nh: 2 }, { h: 7.5, win: 'arch', ww: 2.3, wh: 3.2, sill: 1.6, pil: 0.8 }], cornice: 1.1 };
  const st = { key: 'mh-body', H: Hh, bay: 4.7, trim: C.cream, roof: 'roofZinc', flat: true, parapet: 0.8, cornice: 0.6, fac };
  const pavFac = (w) => M.fac({ key: 'mh-pav-' + Math.round(w * 10), H: Hh, bay: w, ...fac, floors: [{ h: 7.0, win: 'rect', ww: 2.4, wh: 3.4, sill: 1.6, rust: true, rustCol: C.ochreD, nh: 2 }, { h: 6.5, win: 'rect', ww: 2.4, wh: 3.6, sill: 1.2, hood: 'ped', pil: 1.4, nh: 2 }, { h: 7.5, win: 'arch', ww: 2.8, wh: 3.6, sill: 1.6, pil: 1.4 }] });
  const PAVS = [[[-2316.5, -2546.4], [-2307.2, -2550.9]], [[-2285.4, -2562], [-2275.9, -2566.6]]];
  house(K, body, st, { matOf: (e) => {
    if (near(e, -2306.5, -2549.5, -2284.5, -2560.1)) return { mat: archBay, bay: 8.13 };
    for (const [a, b] of PAVS) if (near(e, a[0], a[1], b[0], b[1])) return { mat: pavFac(e.len), bay: e.len };
    return null;
  } });
  // pediments and mansard caps of the two corner pavilions
  for (const [a, b] of PAVS) {
    const l = dist(a, b), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    P.push(m[0], 0, m[1], rotOut(N[0], N[1]));
    const sh = new THREE.Shape(); sh.moveTo(-l / 2 - 0.4, Hh + 0.1); sh.lineTo(l / 2 + 0.4, Hh + 0.1); sh.lineTo(0, Hh + 2.6); sh.lineTo(-l / 2 - 0.4, Hh + 0.1); P.extrude(M.cream, sh, -0.5, 0.9, 3, 2);
    G.frustum(P, M.roofZinc, 0, -4.6, Hh + 0.1, Hh + 3.9, 4, (l / 2) * Math.SQRT2 * 0.98, (l / 2) * Math.SQRT2 * 0.5, Math.PI / 4, 3, 1, { capTop: M.zinc });
    P.pop();
  }
  // the dome over the auditorium with its lattice lantern
  const dc = [-2287, -2536];
  P.cyl(M.ochre, [dc[0], Hh - 0.8, dc[1]], [dc[0], Hh + 4.2, dc[1]], 15.6, 15.6, 32, false); P.cyl(M.cream, [dc[0], Hh + 4.2, dc[1]], [dc[0], Hh + 4.6, dc[1]], 16.0, 16.0, 32, true);
  G.lathe(P, M.roofZinc, 'lmKr-mhdome', [[15.9, 0], [15.3, 1.3], [12.6, 3.7], [8.2, 5.5], [3.9, 6.3], [3.5, 6.35]], dc[0], Hh + 4.6, dc[1], 1, 1, 32, 10);
  for (let i = 0; i < 12; i++) { const q = i / 12 * 6.2832; P.cyl(M.capMetal, [dc[0] + Math.sin(q) * 3.5, Hh + 10.9, dc[1] + Math.cos(q) * 3.5], [dc[0] + Math.sin(q) * 3.5, Hh + 13.0, dc[1] + Math.cos(q) * 3.5], 0.07, 0.07, 4, false); }
  for (const y of [Hh + 10.95, Hh + 12.0, Hh + 13.0]) G.tube(P, M.capMetal, dc[0], dc[1], y, y + 0.1, 3.55, 3.55, 16, 1, 1);
  G.tube(P, M.roofZinc, dc[0], dc[1], Hh + 13.0, Hh + 15.6, 3.7, 0.05, 16, 4, 1);
  // the stage block (the rest of the outline r3555515): plain yellow, seven rows of small windows
  const stage = { polys: [{ o: [-2255, -2523.5, -2251.3, -2516, -2249.9, -2516.7, -2244.2, -2505, -2286.7, -2484.4, -2289.2, -2489.5, -2288.1, -2490, -2292.8, -2499.6, -2294.5, -2498.8, -2295.7, -2501.3, -2294, -2502.1, -2294.9, -2504, -2297.5, -2509.1, -2257.6, -2528.7], h: [] }] };
  house(K, stage, { key: 'mh-stage', H: 29, bay: 4.4, trim: C.cream, roof: 'roofZinc', flat: true, parapet: 0.7, cornice: 0.4, fac: { wall: '#e8c860', trim: '#f2e4b0', socle: '#9a948a', socleH: 1.0, floors: Array.from({ length: 7 }, () => ({ h: 4.0, win: 'rect', ww: 1.1, wh: 1.7, sill: 1.2, band: false })), cornice: 0.7 } });
  // the link wing with the «МЮЗИК-ХОЛЛ» colonnade, the side porch
  const yel = { key: 'narodny-yellow', H: 11.6, bay: 4.2, trim: C.cream, roof: 'roofZinc', cornice: 0.5, roofD: 5.5, rise: 2.2, fac: { wall: C.yellow, trim: C.cream, socle: '#9a948a', socleH: 0.9, floors: [{ h: 5.3, win: 'arch', ww: 1.9, wh: 3.2, sill: 1.1, rust: true, rustCol: '#dcbc60' }, { h: 5.5, win: 'rect', ww: 2.5, wh: 3.0, sill: 1.0, nv: 2, pil: 0.7 }], cornice: 0.8 } };
  const link = byId('r3555521'); if (link) house(K, link, yel);
  const porch = byId('r18097684'); if (porch) house(K, porch, { ...st, key: 'mh-porch', H: 8.5, fac: { ...fac, floors: [{ h: 7.5, win: 'arch', ww: 2.2, wh: 4.2, sill: 1.6 }] }, flat: true });
  { const A = [-2258.8, -2545], B = [-2237.5, -2555.3], c = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], hw = dist(A, B) / 2 - 1.5, rot = rotOut(N[0], N[1]);
    const W = (lx, lz) => [c[0] + Math.cos(rot) * lx + Math.sin(rot) * lz, c[1] - Math.sin(rot) * lx + Math.cos(rot) * lz];
    P.push(c[0], 0, c[1], rot);
    P.box(M.graniteGrey, -hw, hw, 0, 0.6, 0, 3.4, 'b', 2); for (let i = 0; i < 3; i++) P.box(M.graniteGreyFlat, -hw, hw, 0, 0.6 - (i + 1) * 0.15, 3.4 + i * 0.34, 3.74 + i * 0.34, 'b', 2);
    const n = 6; for (let i = 0; i < n; i++) { const x = -hw + 0.8 + i * (2 * hw - 1.6) / (n - 1); P.box(M.cream, x - 0.42, x + 0.42, 0.6, 1.5, 2.3, 3.1, 'b', 2); P.col(M.cream, x, 2.7, 1.5, 6.0, 0.36, 0.32, 10, false); P.box(M.cream, x - 0.42, x + 0.42, 6.0, 6.35, 2.3, 3.1, '', 2); }
    P.box(M.cream, -hw - 0.2, hw + 0.2, 6.35, 7.6, 0, 3.3, '', 2); P.box(M.cream, -hw - 0.45, hw + 0.45, 7.6, 7.95, -0.1, 3.6, '', 2);
    const wp = W(0, 0.12);
    if (label(K, 'r3555521', wp[0], 5.0, wp[1], 4.4, 1.4, N)) P.quad(M.sign('musichall', 512, 160, ['Мюзик-Холл'], { bg: '#a8322a', fg: '#f3ead6', font: M.FONT.serif, weight: 'italic bold', pad: 0.3, border: '#e6d9b0', bw: 5 }), [-2.2, 4.3, 0.09], [2.2, 4.3, 0.09], [2.2, 5.7, 0.09], [-2.2, 5.7, 0.09], [0, 0, 1]);
    P.pop();
    const p = W(0, 1.7); ph.addWalkBox(p[0], p[1], 2 * hw, 3.4, rot, 0.6, 0); const s = W(0, 3.91); ph.addStairs(s[0], s[1], 2 * hw, 1.02, rot + Math.PI, 0, 0.6, 3);
    for (let i = 0; i < n; i++) { const x = -hw + 0.8 + i * (2 * hw - 1.6) / (n - 1), q = W(x, 2.7); ph.addCylinder(q[0], q[1], 0.42, 0, 6.3); }
    svc.entrances.push({ x: W(0, 0.8)[0], z: W(0, 0.8)[1], rotY: rot, name: 'Театр «Мюзик-Холл»', bldg: 'r3555515', closed: true }); }
  const fc = [-2292, -2557.5]; svc.photoSpots.push({ x: fc[0] + N[0] * 38, z: fc[1] + N[1] * 38, yaw: 180 - 26, name: 'Мюзик-холл (Оперный зал Народного дома)' });
  svc.monuments.push({ id: 'music-hall', name: 'Мюзик-холл', x: dc[0], z: dc[1], h: Hh + 15.6 });
  void onEdge; void hipRoof;
}

// ================================================================== Velikan Park
function velikan(K) {
  const { P, M, ctx, svc } = K;
  const rec = byId('w203600211'); if (!rec) return;
  const Hh = 13.2;
  const st = { key: 'velikan', H: Hh, bay: 4.2, trim: '#d9dcdf', roof: 'roofZinc', flat: true, parapet: 0.7, cornice: 0.2,
    fac: { wall: '#b4b9bd', trim: '#d9dcdf', socle: '#6f7377', socleH: 0.5, glass: '#3d5c78', frame: '#8a9096', floors: [{ h: 4.8, win: 'rect', ww: 3.7, wh: 3.7, sill: 0.3, nv: 2, band: false }, { h: 4.2, win: 'rect', ww: 3.7, wh: 3.0, sill: 0.6, nv: 2, band: false }, { h: 4.2, win: 'rect', ww: 3.7, wh: 3.0, sill: 0.6, nv: 2, band: false }], cornice: 0.4 } };
  house(K, rec, st);
  const A = [-2068.8, -2654.3], B = [-2050.5, -2657.6], c = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], l = dist(A, B), t = [(B[0] - A[0]) / l, (B[1] - A[1]) / l];
  let n = [t[1], -t[0]]; const rc = centroid(pairs(rec.polys[0].o)); if (n[0] * (c[0] - rc[0]) + n[1] * (c[1] - rc[1]) < 0) n = [-n[0], -n[1]];
  if (label(K, 'w203600211', c[0] + n[0] * 0.12, 10.6, c[1] + n[1] * 0.12, 9.2, 1.4, n)) { P.push(c[0], 0, c[1], rotOut(n[0], n[1])); P.quad(M.sign('velikan', 1024, 160, ['ВЕЛИКАН ПАРК'], { bg: '#2a2f38', fg: '#f2c230', font: M.FONT.sans, pad: 0.3 }), [-4.6, 9.9, 0.1], [4.6, 9.9, 0.1], [4.6, 11.3, 0.1], [-4.6, 11.3, 0.1], [0, 0, 1]); P.pop(); }
  svc.entrances.push({ x: c[0] + n[0] * 0.8, z: c[1] + n[1] * 0.8, rotY: rotOut(n[0], n[1]), name: 'Кинотеатр «Великан Парк»', bldg: 'w203600211', closed: true });
}
