// landmarksModernVO/smirnov.js - the SMIRNOV / BENNIGSEN HOUSE, "the house with the atlantes" (Доходный дом А. А. Смирнова, Средний пр. В.О., 53 / 12-я линия, 29; I. A. Pretro 1911, facades redrawn in the neo-baroque in 1912
// by S. S. Serafimov; OSM w108204300 + the early-1950s replica wing w108204307 (Sredny 51 лит. В); baked 19.8 m, real cornice 23.5 m).  Dossier docs/research/modernvo.md section 1 (critic C1 / C12; photos SM-01 / SM-03 re-read),
// frames SB (Sredny front, house u 0 .. 30.07 + the replica wing to 64.1) and SA (12th Line, u 0 .. 54.63, the street corner at u = 54.63).
//   peach plaster (#e8b891) over a horizontally rusticated ground floor AND floor 2 (to the belt at 9.0), white rocaille frames and cartouches on every window, the CENTRAL RISALIT of each front (12 m, five window axes
//   between four free-standing white columns d 1.1 on a balustraded ledge at 8.2 .. 9.4, composite capitals, a belt at 20.1 .. 21.0, FOUR HERM-TYPE ATLANTES on the sixth floor (12 in all: Sredny, 12th Line, the
//   replica's copy), the segmental pediment with the oval monogram cartouche, apex 26.0), the cornice at 23.5 and the white balustrade (24.6), the ROUND CORNER BAY (r 2.3) on a balcony slab at 9.0 with a black
//   wrought-iron rail, the carriage gate (u 26.0) and the drive-in passage (3.5 m) at the replica junction.  The replica is lighter and whiter (#eccbb7).  Nothing is enterable; the gates are closed leaves.
import { FR } from './frame.js';
import { House } from './house.js';
import { prism, loftRings, decal, balcony, roofRail } from './elem.js';
import { polyRing } from './bay.js';
import { winWall, loft } from './wallx.js';
import { shapeOf } from './geo.js';
import { human, cached } from '../lib/figures.js';

const H = 23.5;
const SILL = [5.5, 9.4, 13.3, 17.2, 20.9], WH = [2.0, 2.2, 2.2, 1.9, 1.8], HEAD = [undefined, 'arch', undefined, 'arch', undefined];

function mats(M) {
  const A = M.A;
  M.def('smWall', () => M.sheet('sm-wall', A.plaster('sm-wall', '#e8b891', { stain: 0.025 }), { paint: 0.03 }));
  M.def('smWallR', () => M.sheet('sm-wall-r', A.plaster('sm-wall-r', '#eccbb7', { stain: 0.02 }), { paint: 0.03 }));
  M.def('smRust', () => M.sheet('sm-rust', A.rustic('sm-rust', '#d9a98a', { joint: '#efdcc6' }), { paint: 0.03 }));
  M.def('smRustR', () => M.sheet('sm-rust-r', A.rustic('sm-rust-r', '#e4bfae', { joint: '#f2e4d6' }), { paint: 0.03 }));
  M.def('smWhite', () => M.flat('sm-white', '#f3e6d2', { paint: 0.02 }));
  M.def('smWhiteR', () => M.flat('sm-white-r', '#f6eee2', { paint: 0.02 }));
  M.def('smTerra', () => M.flat('sm-terra', '#cf9a7c', { paint: 0.04 }));
  M.def('smStat', () => M.flat('sm-stat', '#e8dccb', { paint: 0.04 }));
  M.def('smCol', () => M.flat('sm-col', '#efe3cf', { paint: 0.02 }));
  M.def('smRev', () => M.flat('sm-rev', '#d8b090', { paint: 0.03 }));
  M.def('smRevD', () => M.flat('sm-revd', '#6a4a3a', { paint: 0.03 }));
  M.def('smZinc', () => M.flat('sm-zinc', '#8c9195', { paint: 0.05 }));
  M.def('smDoor', () => M.flat('sm-door', '#5c4033', { paint: 0.02 }));
  M.def('smBalus', () => M.cut('sm-balus', A.D(128, 64, (g, w, h) => {                    // 2.2 m of white balustrade: piers at both ends, 5 balusters, a rail
    g.clearRect(0, 0, w, h); g.fillStyle = '#f3e6d2'; g.fillRect(0, h * 0.04, w, h * 0.1); g.fillRect(0, h * 0.86, w, h * 0.14); g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h);
    for (let i = 0; i < 5; i++) { const x = 18 + i * 21; g.beginPath(); g.ellipse(x, h * 0.5, 6.5, h * 0.4, 0, 0, Math.PI * 2); g.fill(); g.fillRect(x - 2.5, h * 0.1, 5, h * 0.8); }
  }, 'sm-balus')));
  M.def('smCart', () => M.deco('sm-cart', A.D(64, 48, (g) => { g.fillStyle = '#f3e6d2'; g.strokeStyle = '#d4b898'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 38); g.quadraticCurveTo(4, 12, 32, 8); g.quadraticCurveTo(60, 12, 56, 38); g.quadraticCurveTo(32, 30, 8, 38); g.closePath(); g.fill(); g.stroke(); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(32, 36); g.lineTo(32 + i * 11, 14 + Math.abs(i) * 3); g.stroke(); } }, 'sm-cart'), { alphaTest: 0.2 }));
  M.def('smApron', () => M.deco('sm-apron', A.D(64, 32, (g) => { g.fillStyle = '#f3e6d2'; g.strokeStyle = '#d4b898'; g.lineWidth = 2; g.beginPath(); g.moveTo(4, 6); g.quadraticCurveTo(32, 26, 60, 6); g.lineTo(60, 14); g.quadraticCurveTo(32, 34, 4, 14); g.closePath(); g.fill(); g.stroke(); }, 'sm-apron'), { alphaTest: 0.2 }));
  M.def('smCipher', () => M.deco('sm-cipher', A.D(128, 160, (g, w, h) => {                  // the oval medallion with the interlaced cipher and the rocaille scrolls (5.5 m wide pediment ornament: here the central cartouche 1.3 x 1.7 m)
    g.fillStyle = '#cf9570'; g.strokeStyle = '#a8704e'; g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.46, h * 0.46, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#eccbb0'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.33, h * 0.34, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = '#8a5a3e'; g.lineWidth = 5; g.beginPath(); g.arc(w * 0.42, h * 0.5, 18, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(w * 0.58, h * 0.5, 18, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(w * 0.35, h * 0.4); g.lineTo(w * 0.65, h * 0.6); g.stroke();
  }, 'sm-cipher'), { alphaTest: 0.2 }));
  M.def('smScroll', () => M.deco('sm-scroll', A.D(256, 64, (g, w, h) => { g.strokeStyle = '#cf9570'; g.lineWidth = 9; g.lineCap = 'round'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 24, h * 0.5); g.bezierCurveTo(w / 2 + s * 60, h * 0.05, w / 2 + s * 100, h * 0.95, w / 2 + s * 124, h * 0.45); g.stroke(); g.beginPath(); g.arc(w / 2 + s * 112, h * 0.5, 9, 0, Math.PI * 2); g.stroke(); } }, 'sm-scroll'), { alphaTest: 0.2 }));
  M.def('smWin', () => M.sheet('sm-win', A.win('sm-w', { frame: '#f1ebe0', bars: 'two', ratio: 1.9 }), { paint: 0 }));
  M.def('smWinA', () => M.sheet('sm-win-a', A.win('sm-wa', { head: 'arch', frame: '#f1ebe0', bars: 'cross', ratio: 1.9 }), { paint: 0 }));
  M.def('smShop', () => M.sheet('sm-shop', A.win('sm-shop', { head: 'arch', frame: '#4a3a31', bars: 'none', glass: 'dark', ratio: 1.0, f: 5 }), { paint: 0 }));
}

/** a herm-type atlas: console, tapering drapery shaft, bearded torso with both arms raised under the entablature block (feet / base at (x, y, z), facing the frame +z, 2.2 m) */
function atlas(P, M, x, y, z) {
  const fig = cached('lmmvo-herm', () => human({
    detail: 0.26, body: { muscle: 1.0, bulk: 1.15, shoulders: 1.25 },
    pose: { pelvis: [0, 0.95, 0], head: [0.2, 0, 0], spine: [-0.02, 0, 0],
      arms: { L: { hand: [0.3, 1.82, 0.0], pole: [0.9, 0.3, -0.1], grip: 'fist', palm: [0, -1, 0] }, R: { hand: [-0.3, 1.82, 0.0], pole: [-0.9, 0.3, -0.1], grip: 'fist', palm: [0, -1, 0] } } },
    outfit: { torso: 'nude' }, face: { age: 0.5, hair: 'curly', beard: 'full', brow: 1.0, seed: 5 },
  }));
  // review 2026-10-09: the statues of the house are painted pale cream-white (photos SM-01 / SM-05: light figures against the peach wall), not terracotta (they read as urns from the street)
  const m = { main: M.smStat, dark: M.smStat, accent: M.smStat };
  const s = 1.12;
  P.box(M.smStat, x - 0.34, x + 0.34, y, y + 0.34, z - 0.1, z + 0.4, 'b', 1);                         // the scalloped console
  P.cyl(M.smStat, [x, y + 0.34, z + 0.15], [x, y + 1.18, z + 0.15], 0.17, 0.4, 8, false);               // the tapering drapery shaft (wide at the hips)
  P.box(M.smStat, x - 0.4, x + 0.4, y + 1.18, y + 1.26, z - 0.1, z + 0.4, 'b', 1);
  fig.place(P, m, x, y + 1.18 - 0.95 * s, z + 0.15, 0, s);
  P.box(M.smStat, x - 0.5, x + 0.5, y + 2.2, y + 2.55, z - 0.1, z + 0.5, 'b', 1);                       // the block of the entablature above the head
  P.box(M.smWhite, x - 0.5, x + 0.5, y - 0.02, y + 2.2, z - 0.2, z - 0.1, 'b', 1);                       // the flat pilaster-shaped back plate
}
const column = (P, M, x, z, y0, y1) => {
  P.col(M.smCol, x, z, y0, y1, 0.55, 0.52, 14, false);
  P.box(M.smCol, x - 0.7, x + 0.7, y0 - 0.3, y0, z - 0.7, z + 0.7, 'b', 1);                              // base
  P.cyl(M.smCol, [x, y1, z], [x, y1 + 0.6, z], 0.52, 0.72, 12, false);                                    // capital: the acanthus bell
  P.box(M.smCol, x - 0.78, x + 0.78, y1 + 0.6, y1 + 0.95, z - 0.78, z + 0.78, 'b', 1);                    // abacus
  for (const [dx, dz] of [[-0.72, -0.72], [0.72, -0.72], [-0.72, 0.72], [0.72, 0.72]]) P.cyl(M.smCol, [x + dx * 0.5, y1 + 0.5, z + dz * 0.5], [x + dx, y1 + 0.95, z + dz], 0.12, 0.15, 6, false);   // volutes
};

/** one front of the house or the replica (in the CURRENT frame): the walls with windows, belts, risalits, cornice, balustrade.  o: { rep, risalit: [centres], axes: [u..], shops: [u..], doors, gates, uMax } */
function front(K, h, ps, o) {
  const { P, M } = K;
  const W = o.rep ? M.smWallR : M.smWall, R = o.rep ? M.smRustR : M.smRust, WH2 = o.rep ? M.smWhiteR : M.smWhite;
  const tw = { mat: W, tu: 3, tv: 3 }, tr = { mat: R, tu: M.tex[o.rep ? 'sm-rust-r' : 'sm-rust'].tu, tv: M.tex[o.rep ? 'sm-rust-r' : 'sm-rust'].tv };
  const bands = [{ y0: 0, y1: 9.0, ...tr }, { y0: 9.0, y1: H, ...tw }];
  const trim = { mat: WH2, t: 0.2, proud: 0.05, top: 0.28, bot: 0.3 };
  const wins = [];
  for (const x of o.axes) for (let k = 0; k < 5; k++) wins.push({ x, y: SILL[k], w: 1.23, h: WH[k], head: HEAD[k], glass: HEAD[k] ? M.winWArch : M.winW, reveal: M.smRev, depth: 0.25, trim });
  for (const c of o.risalit) for (const d of [-5.1, -2.55, 0, 2.55, 5.1]) for (let k = 0; k < 5; k++) wins.push({ x: c + d, y: SILL[k], w: 1.23, h: WH[k], head: HEAD[k], glass: HEAD[k] ? M.winWArch : M.winW, reveal: M.smRev, depth: 0.25, trim });
  for (const x of o.shops) wins.push({ x, y: 0.5, w: 3.0, h: 3.1 + 1.5, head: 'arch', glass: M.smShop, reveal: M.smRevD, depth: 0.3, trim: { mat: WH2, t: 0.3, proud: 0.05, top: 0.3, bot: 0 }, n: 10 });
  for (const g of o.gates || []) wins.push({ x: g, y: 0, w: 3.1, h: 3.6 + 1.0, head: 'arch', glass: M.smDoor, reveal: M.smRevD, depth: 0.45, trim: { mat: WH2, t: 0.3, proud: 0.06, top: 0.3, bot: 0 }, n: 10 });
  for (const d of o.doors || []) wins.push({ x: d, y: 0, w: 1.0, h: 2.6, glass: M.smDoor, reveal: M.smRevD, depth: 0.25, trim: { mat: WH2, t: 0.2, proud: 0.05, top: 0.3, bot: 0 } });
  for (const p of ps) {
    h.span(p, -1, 999, bands, wins, { reveal: M.smRev, glass: M.winW });
    P.box(WH2, p.u0, p.u1, 8.9, 9.25, p.d - 0.02, p.d + 0.2, 'bk', 2);                                    // the belt over the rusticated storeys
    P.box(WH2, p.u0, p.u1, 20.1, 21.0, p.d - 0.02, p.d + 0.12, 'bk', 2);                                  // the belt cornice across the front
    P.box(WH2, p.u0, p.u1, H - 0.55, H, p.d - 0.02, p.d + 0.55, 'bk', 2); P.box(WH2, p.u0, p.u1, H - 0.9, H - 0.55, p.d - 0.02, p.d + 0.3, 'bk', 2);   // the console cornice
    // balustrade: a cut-out strip along the roof edge
    for (let u = p.u0; u < p.u1 - 0.05; u += 2.2) { const e = Math.min(p.u1, u + 2.2); P.quad(M.smBalus, [u, H, p.d + 0.2], [e, H, p.d + 0.2], [e, H + 1.1, p.d + 0.2], [u, H + 1.1, p.d + 0.2], null, [[0, 0], [(e - u) / 2.2, 0], [(e - u) / 2.2, 1], [u * 0 + 0, 1]]); }
  }
  // cartouches over the heads (floors 3-6) and aprons under the sills (floors 2-5)
  const axes = [...o.axes]; for (const c of o.risalit) for (const d of [-5.1, -2.55, 0, 2.55, 5.1]) axes.push(c + d);
  for (const x of axes) for (let k = 1; k < 5; k++) { if (ps.some((p) => x > p.u0 + 0.9 && x < p.u1 - 0.9)) { decal(P, M.smCart, x, SILL[k] + WH[k] + 0.3, 0.6, 0.42, 0.14); } }
  for (const x of axes) for (let k = 0; k < 4; k++) { if (ps.some((p) => x > p.u0 + 0.9 && x < p.u1 - 0.9)) decal(P, M.smApron, x, SILL[k] - 0.55, 0.7, 0.28, 0.08); }
  // the risalits: four free columns on the balustraded ledge, atlantes, pediment
  for (const c of o.risalit) {
    const z0 = 0.9;
    for (const d of [-3.825, -1.275, 1.275, 3.825]) column(P, M, c + d, z0, 10.0, 18.2);
    P.box(WH2, c - 6.0, c + 6.0, 8.95, 9.4, -0.05, 1.7, 'b', 2);                                            // the ledge (slab) with corbels
    // review 2026-10-09: the console brackets under the ledge are stepped (three tiers, narrowing and shortening downwards) instead of one white block that read as a floating cube from below
    for (let u = c - 5.4; u <= c + 5.45; u += 2.7) { P.box(WH2, u - 0.25, u + 0.25, 8.65, 8.95, -0.02, 1.35, 'b', 1); P.box(WH2, u - 0.2, u + 0.2, 8.4, 8.65, -0.02, 1.0, 'b', 1); P.box(WH2, u - 0.15, u + 0.15, 8.2, 8.4, -0.02, 0.6, 'b', 1); }
    for (let u = c - 5.8; u < c + 5.8 - 0.05; u += 2.2) { const e = Math.min(c + 5.8, u + 2.2); P.quad(M.smBalus, [u, 9.4, 1.6], [e, 9.4, 1.6], [e, 10.4, 1.6], [u, 10.4, 1.6], null, [[0, 0], [(e - u) / 2.2, 0], [(e - u) / 2.2, 1], [0, 1]]); }
    P.box(WH2, c - 5.4, c + 5.4, 18.2 + 0.95, 19.4, 0.0, 1.3, 'b', 1);                                    // entablature over the capitals
    for (const d of [-3.825, -1.275, 1.275, 3.825]) atlas(P, M, c + d, 21.0, 0.15);
    // the segmental pediment (chord 8.9, rise 2.1, springs at 23.5): a solid with the cartouche and scrolls
    const pts = [[c - 4.45, H - 0.4], [c + 4.45, H - 0.4]];
    for (let k = 20; k >= 0; k--) { const t = k / 20, u = c - 4.45 + 8.9 * t; pts.push([u, H + 2.5 * (1 - Math.pow((u - c) / 4.45, 2))]); }
    P.extrude(WH2, shapeOf(pts), -0.4, 0.9, 2, 4);
    decal(P, M.smCipher, c, H + 0.05, 1.3, 1.7, 0.52); decal(P, M.smScroll, c, H + 0.9, 5.5, 1.4, 0.52);
  }
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] smirnov/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const h = new House(K, { name: 'smirnov', F: FR.SB, ids: ['w108204300'], H });
  const hr = new House(K, { name: 'smirnov-replica', F: FR.SB, ids: ['w108204307'], H });
  h.begin();
  stage('sredny', () => {
    const ps = h.pieces(0, 30.2);
    front(K, h, ps, { risalit: [17.8], axes: [5.4, 7.6, 9.8, 25.4, 27.6, 29.2], shops: [4.4, 8.8, 13.2, 22.4, 26.8], doors: [17.8], uMax: 30.1 });
  });
  stage('corner', () => {
    const cx = 0.42, cz = -0.42, R = polyRing(16, 2.3, cx, cz, -Math.PI / 16), C = [cx, cz];
    loftRings(P, M.smWhite, R, C, 8.7, [[1.28, 0], [1.28, 0.42]]);                                           // the cantilevered balcony slab (r ~ 3.0)
    const slab = R.map((q) => [cx + (q[0] - cx) * 1.28, cz + (q[1] - cz) * 1.28]);
    P.cap(M.smWhite, slab, 9.12, true, 2); P.cap(M.smWhite, slab, 8.7, false, 2);
    for (let i = 0; i < 16; i++) { const a = slab[i], b = slab[(i + 1) % 16], s = 0.97; const ax = cx + (a[0] - cx) * s, az = cz + (a[1] - cz) * s, bx = cx + (b[0] - cx) * s, bz = cz + (b[1] - cz) * s; if (i >= 11 && i <= 15) P.quad(M.railing, [ax, 9.12, az], [bx, 9.12, bz], [bx, 10.12, bz], [ax, 10.12, az], null, [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    const sills = SILL.slice(1), hs = WH.slice(1);
    prism(P, R, 9.12, 24.6, { c: C, bands: [{ y0: 9.12, y1: 24.6, mat: M.smWall, tu: 3, tv: 3 }], reveal: M.smRev, glass: M.winW,
      wins: (i, len) => ((i >= 13 && i <= 15) ? sills.map((y, k) => ({ x: len / 2, y, w: 0.55, h: hs[k], head: [undefined, undefined, undefined, undefined][k], glass: M.winW, reveal: M.smRev, depth: 0.16, trim: { mat: M.smWhite, t: 0.16, proud: 0.04, top: 0.24, bot: 0.26 } })) : []) });
    loftRings(P, M.smWhite, R, C, 23.4, [[1.12, 0], [1.1, 0.5], [1.06, 0.62]]);                              // cornice ring and the ogee-curved parapet cap
    loftRings(P, M.smWall, R, C, 24.0, [[1.0, 0], [1.02, 0.5], [0.92, 1.0], [0.75, 1.4]]);
    P.cap(M.smZinc, R.map((q) => [cx + (q[0] - cx) * 0.75, cz + (q[1] - cz) * 0.75]), 25.4, true, 2);
    // the white pilaster strips edging the corner on floors 3-6 and the rustication of the corner bay's pier (the corner itself is the building corner)
  });
  stage('sa', () => {
    const ps = h.piecesIn(FR.SA, -1, 999, { zTol: 1.7 });
    h.inFrame(FR.SA, () => {
      front(K, h, ps, { risalit: [40.2], axes: [2.2, 4.4, 6.6, 8.8, 11.0, 13.2, 15.4, 17.6, 19.4, 23.6, 28.4, 30.6, 32.8, 47.9, 50.2], shops: [31.7, 36.3, 44.0, 48.9], gates: [26.0], doors: [21.6, 52.8] });
    });
  });
  h.rest({ bands: [{ y0: 0, y1: 9.0, mat: M.smRust, tu: 1.4, tv: 1.1 }, { y0: 9.0, y1: H, mat: M.smWall, tu: 3, tv: 3 }], rows: SILL.map((y, k) => ({ y, w: 1.23, h: WH[k] })), pitch: 2.4, margin: 1.2, reveal: M.smRev, glass: M.winW, depth: 0.2 });
  h.band(H - 0.55, H, 0.55, { front: M.smWhite, top: M.smWhite, under: M.smWhite }, { skip: (e) => (e.n[1] > 0.9) || (e.n[0] < -0.9 && e.len > 30) });
  h.roof(H - 0.02, M.smZinc); h.chimneys(H, 5);
  h.end();
  h.colliders(H + 1);
  hr.begin();
  stage('replica', () => {
    const ps = hr.pieces(30.0, 64.5, { slope: 0.3 });
    front(K, hr, ps, { rep: true, risalit: [59.0], axes: [37.0, 39.3, 41.6, 43.9, 46.2, 48.5, 50.8], shops: [36.6, 40.4, 44.2, 48.0, 51.8, 62.4], gates: [32.2], doors: [] });
    // the flat white pilaster strip between the risalits (u ~ 40 .. 48)
    for (let k = 0; k < 4; k++) P.box(M.smWhiteR, 40.2 + k * 2.4, 40.9 + k * 2.4, 9.25, H - 0.9, -0.02, 0.1, 'bk', 1);
  });
  hr.rest({ bands: [{ y0: 0, y1: 9.0, mat: M.smRustR, tu: 1.4, tv: 1.1 }, { y0: 9.0, y1: H, mat: M.smWallR, tu: 3, tv: 3 }], rows: SILL.map((y, k) => ({ y, w: 1.23, h: WH[k] })), pitch: 2.4, margin: 1.2, reveal: M.smRev, glass: M.winW, depth: 0.2 });
  hr.band(H - 0.55, H, 0.55, { front: M.smWhiteR, top: M.smWhiteR, under: M.smWhiteR }, { skip: (e) => e.n[1] > 0.9 });
  hr.roof(H - 0.02, M.smZinc); hr.chimneys(H, 3);
  hr.end();
  hr.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'w108204300', name: 'Доходный дом А. А. Смирнова — дом с атлантами (Средний пр., 53 / 12-я линия, 29)', x: c.x, z: c.z, h: 26.0 });
  h.spot(svc, 17.8, 6.0, 0, -1, 14, 'Дом с атлантами: колонны и четыре статуи');
  h.spot(svc, 6.0, 5.0, -0.4, -1, 10, 'Дом с атлантами: угловой эркер');
  svc.parts.smirnov = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
