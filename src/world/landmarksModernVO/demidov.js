// landmarksModernVO/demidov.js - the DEMIDOV HOUSE (Доходный дом Н. П. Демидова, Большой пр. В.О., 50; the brothers Kosyakov 1910-11, ceramics of the Vaulin workshop; OSM w32273617; tier B of the dossier).
// Dossier docs/research/modernvo.md section 13 (photos DE50-03 / DE50-10), frame DE (front u 0 .. 35.03, depth 16.3).
//   cream stucco ground storey (4.9 m, shops), pale grey-white glazed tile on floors 2-4 (#c8c6bc), a cream stucco band with a cartouche (16.1 .. 18.0), wine-red mixed glazed brick on floors 5-6 (#8a3040),
//   a cream attic band and cornice (to 26.4), the canted bay left of centre (u 9.2 .. 14.6, floors 3-6, French windows with flush iron rails) running into the flat tile parapet block A (to 29.1) with a lattice
//   vent, the lower block B, the relief window at u ~ 17 (two standing women, cornucopias, a portrait medallion).  Nothing is enterable.
import { FR } from './frame.js';
import { House } from './house.js';
import { bay } from './bay.js';
import { decal, roofRail } from './elem.js';

const H = 26.4;
const SILL = [5.6, 9.7, 13.9, 18.6, 22.4], WHT = [1.9, 1.9, 1.9, 1.8, 2.0];

function mats(M) {
  const A = M.A;
  M.def('dTile', () => M.sheet('d-tile', A.tile('d-grey', '#c8c6bc', { vary: 0.07, dark: 0.08, glaze: true, mortar: '#b5b2a8', accent: [['#d6d4cb', 0.1], ['#b8b6ac', 0.1]] }), { paint: 0.03 }));
  M.def('dWine', () => M.sheet('d-wine', A.tile('d-wine', '#8a3040', { vary: 0.14, dark: 0.1, glaze: true, mortar: '#6e2432', accent: [['#5a2038', 0.22], ['#a8424c', 0.15]] }), { paint: 0.03 }));
  M.def('dStucco', () => M.sheet('d-stucco', A.plaster('d-stucco', '#e9d6b0', { stain: 0.03 }), { paint: 0.03 }));
  M.def('dRev', () => M.flat('d-rev', '#cbc8be', { paint: 0.03 }));
  M.def('dRevW', () => M.flat('d-revw', '#7a2a38', { paint: 0.03 }));
  M.def('dRevS', () => M.flat('d-revs', '#d9c5a0', { paint: 0.03 }));
  M.def('dPlinth', () => M.flat('d-plinth', '#7c7a74', { paint: 0.04 }));
  M.def('dRoof', () => M.flat('d-roof', '#5a4a42', { paint: 0.05 }));
  M.def('dVent', () => M.sheet('d-vent', A.D(128, 48, (g, w, h) => { g.fillStyle = '#ece8de'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3a3c'; for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) g.fillRect(6 + i * 13, 5 + j * 13, 9, 9); }, 'd-vent'), { paint: 0.02 }));
  M.def('dWin', () => M.sheet('d-win', A.win('d-brown', { frame: '#4a3226', bars: 'two', ratio: 1.65 }), { paint: 0 }));
  M.def('dWinDoor', () => M.sheet('d-win-door', A.win('d-door6', { frame: '#e6e2d6', bars: 'three', ratio: 2.1 }), { paint: 0 }));
  M.def('dRelief', () => M.deco('d-relief', A.D(256, 192, (g, w, h) => {                    // the relief group: cartouche between two cornucopias, festoons; two standing figures at the jambs; the panel with the medallion
    g.fillStyle = '#e2c79c'; g.strokeStyle = '#a88a60'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(w * 0.42, 6); g.lineTo(w * 0.58, 6); g.lineTo(w * 0.58, 44); g.quadraticCurveTo(w * 0.5, 62, w * 0.42, 44); g.closePath(); g.fill(); g.stroke();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2 + s * 14, 30); g.quadraticCurveTo(w / 2 + s * 70, 8, w / 2 + s * 118, 40); g.quadraticCurveTo(w / 2 + s * 70, 36, w / 2 + s * 18, 52); g.fill(); g.stroke(); }
    for (const x of [0.07, 0.93]) { g.beginPath(); g.ellipse(w * x, 110, 12, 14, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillRect(w * x - 8, 124, 16, 60); g.strokeRect(w * x - 8, 124, 16, 60); }
    g.fillRect(w * 0.18, h - 40, w * 0.64, 34); g.strokeRect(w * 0.18, h - 40, w * 0.64, 34); g.beginPath(); g.ellipse(w / 2, h - 23, 15, 13, 0, 0, Math.PI * 2); g.fillStyle = '#c9ad82'; g.fill(); g.stroke();
  }, 'd-relief'), { alphaTest: 0.1 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'demidov', F: FR.DE, ids: ['w32273617'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] demidov/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const tile = { mat: M.dTile, tu: M.tex['d-tile'].tu, tv: M.tex['d-tile'].tv }, wine = { mat: M.dWine, tu: M.tex['d-wine'].tu, tv: M.tex['d-wine'].tv }, stucco = { mat: M.dStucco, tu: 3, tv: 3 };
  const bands = [{ y0: 0, y1: 0.6, mat: M.dPlinth, tu: 2, tv: 1 }, { y0: 0.6, y1: 4.9, ...stucco }, { y0: 4.9, y1: 16.1, ...tile }, { y0: 16.1, y1: 18.0, ...stucco }, { y0: 18.0, y1: 24.6, ...wine }, { y0: 24.6, y1: H, ...stucco }];
  h.begin();
  stage('front', () => {
    const ps = h.pieces(0, 35.03);
    const wins = [];
    const frame = (k) => (k >= 3 ? { mat: M.dStucco, t: 0.12, proud: 0.04, top: 0.14, bot: 0.16 } : null);
    for (const x of [4.5, 7.3, 15.0, 18.0, 22.8, 25.8, 29.0, 31.8, 34.0]) { if (x > 33.9 && x < 34.2) continue; for (let k = 0; k < 5; k++) wins.push({ x, y: SILL[k], w: 1.15, h: WHT[k], glass: M.winD, reveal: k >= 3 ? M.dRevW : M.dRev, depth: 0.25, trim: frame(k) || undefined }); }
    for (const x of [2.6, 15.4, 22.0, 24.0, 30.0]) wins.push({ x, y: 0.5, w: 1.9, h: 2.5, glass: M.winShop, reveal: M.dRevS, depth: 0.28 });
    wins.push({ x: 18.5, y: 0, w: 1.3, h: 2.3, glass: M.doorDark, reveal: M.dRevS, depth: 0.25, trim: { mat: M.dStucco, t: 0.2, proud: 0.06, top: 0.25, bot: 0 } });
    for (const x of [5.7, 26.8]) wins.push({ x, y: 0, w: 1.0, h: 2.2, glass: M.doorDark, reveal: M.dRevS, depth: 0.22 });
    for (const p of ps) h.span(p, -1, 999, bands, wins, { reveal: M.dRev, glass: M.winD });
    for (const p of ps) { P.box(M.dStucco, p.u0, p.u1, H - 0.6, H, p.d - 0.02, p.d + 0.35, 'bk', 2); P.box(M.dStucco, p.u0, p.u1, 24.45, 24.65, p.d - 0.02, p.d + 0.1, 'bk', 2); }
    // the bay (u 9.2 .. 14.6 at the wall, 1.4 proud, from the stucco corbel at 5.7 to the roofline)
    bay(P, { chain: [[9.2, 0], [10.55, 1.4], [13.25, 1.4], [14.6, 0]], y0: 5.7, y1: 26.4, bands: [{ y0: 5.7, y1: 16.1, ...tile }, { y0: 16.1, y1: 18.0, ...stucco }, { y0: 18.0, y1: 24.6, ...wine }, { y0: 24.6, y1: 26.4, ...stucco }], reveal: M.dRev, glass: M.winD, soffit: M.dStucco,
      wins: (i, len) => (i === 1 ? [9.7, 13.9, 18.6, 22.4].map((y, k) => ({ x: len / 2, y: y - 0.0, w: 1.9, h: [2.2, 2.2, 2.0, 2.2][k], glass: M.winW, reveal: M.dRev, depth: 0.15 })) : [9.7, 13.9, 18.6, 22.4].map((y) => ({ x: len / 2, y: y + 0.4, w: 0.3, h: 1.0, glass: M.darkGlass, reveal: M.dRev, depth: 0.1 }))) });
    P.box(M.dStucco, 8.9, 14.9, 5.0, 5.7, -0.02, 1.5, 'b', 1);
    // flush iron rails of the French windows: the cut-out railing sheet (review 2026-10-09: the solid black slab 0.9 x 2.7 m read as a black block from the street, the real rails are open lattice)
    for (const y of [9.7, 13.9, 18.6, 22.4]) P.quad(M.railing, [10.55, y, 1.51], [13.25, y, 1.51], [13.25, y + 0.9, 1.51], [10.55, y + 0.9, 1.51], null, [[0, 0], [1.7, 0], [1.7, 1], [0, 1]]);
    // parapet blocks: A (u 7.0 .. 16.4, to 29.1) with the lattice vent; B (u 24.3 .. 30.4, to 28.6)
    P.box(M.dTile, 7.0, 16.4, H, 29.1, -1.2, 0.12, 'b', 1.5); P.box(M.dStucco, 6.9, 16.5, 29.0, 29.2, -1.3, 0.25, 'b', 1.5);
    P.quad(M.dVent, [7.0 + 3.25, 28.0, 0.13], [7.0 + 6.15, 28.0, 0.13], [7.0 + 6.15, 28.9, 0.13], [7.0 + 3.25, 28.9, 0.13], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.dTile, 24.3, 30.4, H, 28.6, -1.2, 0.12, 'b', 1.5); P.box(M.dStucco, 24.2, 30.5, 28.5, 28.7, -1.3, 0.25, 'b', 1.5);
    P.quad(M.dVent, [25.9, 27.2, 0.13], [28.7, 27.2, 0.13], [28.7, 28.1, 0.13], [25.9, 28.1, 0.13], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the relief window at u ~ 17 (floor 4): the group of stucco figures, cartouche and medallion panel (3.4 x 2.6 m)
    decal(P, M.dRelief, 17.0, 13.0, 3.6, 2.9, 0.07);
  });
  h.rest({ bands: [{ y0: 0, y1: H, mat: M.yardPlaster, tu: 3, tv: 3 }], rows: SILL.map((y, k) => ({ y, w: 1.15, h: WHT[k] })), pitch: 3.0, margin: 1.5, reveal: M.dRev, glass: M.winD, depth: 0.2 });
  h.band(H - 0.6, H, 0.35, { front: M.dStucco, top: M.dStucco, under: M.dStucco }, { skip: (e) => e.n[1] > 0.9 });
  h.roof(H - 0.02, M.dRoof); h.chimneys(H, 3);
  roofRail(h, H, { skip: (e) => false });
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'w32273617', name: 'Доходный дом Н. П. Демидова (Большой пр., 50)', x: c.x, z: c.z, h: 29.1 });
  h.spot(svc, 17, 3.0, 0, -1, 12, 'Дом Демидова: серая плитка и винно-красные этажи');
  svc.parts.demidov = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
