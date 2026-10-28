// landmarksModernVO/kudryavtsev.js - the HOUSE WITH SUNFLOWERS (Доходный дом М. М. Кудрявцева, 15-я линия В.О., 70; M. F. Eremeev 1910-11, majolica of the Vaulin workshop; regional monument 2023; OSM r1538751 with two
// courtyard holes, baked ~21 m, real cornice 22.0 m).  Dossier docs/research/modernvo.md section 12 (photo KU-05 re-read), frame SF (the 15th-Line front u 0 .. 28.27 faces ENE; the house is 78 m deep).
//   a grey-brown cobble-granite base (5.6 m) with round-arched grilled windows, the stair door (flat pink-granite portal) and the arched gate (3.3 x 4.2 m); an emerald glazed-brick belt with brown stripes
//   (5.6 .. 7.4); khaki "boar" brick above with five panel columns in the centre (poppy / sunflower majolica under floors 3 and 5, turquoise fields under floor 4, maroon under floor 6); dark-stone window
//   surrounds; the triangular central gable (top 26.4) with the empty oval window and its plaster scar; two three-faced wing oriels (floors 3-6) ending in iron balconies; maroon-purple mosaic tile
//   band on the wings; chimneys.  Nothing is enterable.
import { FR } from './frame.js';
import { House } from './house.js';
import { bay, cantedChain } from './bay.js';
import { decal, roofRail, balcony } from './elem.js';
import { shapeOf } from './geo.js';

const H = 22.0;
const SILL = [6.5, 10.2, 13.8, 17.4, 20.4], WHT = [2.2, 2.0, 2.0, 2.0, 1.4];

function mats(M) {
  const A = M.A;
  M.def('uBrick', () => M.sheet('u-brick', A.tile('u-boar', '#b9a47a', { vary: 0.1, dark: 0.12, glaze: false, mortar: '#9a8a68', tw: 0.2, th: 0.07, rows: 14, accent: [['#a8946a', 0.1], ['#c8b488', 0.08]] }), { paint: 0.03 }));
  M.def('uGranite', () => M.sheet('u-granite', A.granite('u-cobble', '#8a7f76', { cols: 6, rows: 8, tw: 0.35, th: 0.2 }), { paint: 0.04 }));
  M.def('uGreen', () => M.sheet('u-green', A.D(256, 256, (g, w, h) => {                    // 1.6 x 0.6 m: green courses 0.45 m with brown joints rows 0.15 m
    g.fillStyle = '#4a3030'; g.fillRect(0, 0, w, h);
    const r = A.R(9101); for (let j = 0; j < 3; j++) for (let i = -1; i < 8; i++) { const x = i * 32 + (j % 2) * 16, v = 0.9 + r() * 0.2; g.fillStyle = `rgb(${79 * v | 0},${143 * v | 0},${111 * v | 0})`; g.fillRect(x + 1, j * 64 + 1, 30, 62); }
    g.fillStyle = '#4a3030'; g.fillRect(0, 192, w, 64); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#5a3a34' : '#3e2826'; g.fillRect(i * 32 + 1, 194, 30, 60); }
  }, 'u-green'), { paint: 0.03 }));
  M.def('uMosaic', () => M.sheet('u-mosaic', A.tile('u-mosaic', '#6a3a48', { vary: 0.2, dark: 0.1, glaze: true, mortar: '#4a2a30', tw: 0.4, th: 0.4, cols: 4, rows: 4, accent: [['#7a4a3a', 0.25], ['#3f5a46', 0.15], ['#8a5a50', 0.1]] }), { paint: 0.03 }));
  M.def('uTurq', () => M.deco('u-turq', A.D(64, 64, (g, w, h) => { g.fillStyle = '#5aa4a0'; g.fillRect(0, 0, w, h); const r = A.R(9102); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 0.85 + r() * 0.3; g.fillStyle = `rgb(${90 * v | 0},${164 * v | 0},${160 * v | 0})`; g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); } }, 'u-turq'), { alphaTest: 0.1 }));
  M.def('uMaroon', () => M.deco('u-maroon', A.D(64, 64, (g, w, h) => { g.fillStyle = '#4a2a30'; g.fillRect(0, 0, w, h); const r = A.R(9103); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 0.8 + r() * 0.4; g.fillStyle = `rgb(${106 * v | 0},${58 * v | 0},${66 * v | 0})`; g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); } }, 'u-maroon'), { alphaTest: 0.1 }));
  const flower = (key, petal, disc) => M.def(key, () => M.deco(key.replace(/^u/, 'u-'), A.D(96, 144, (g, w, h) => {
    g.fillStyle = '#7a8a58'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4f8f4a'; g.fillRect(w / 2 - 3, h * 0.45, 6, h * 0.5); g.beginPath(); g.ellipse(w * 0.3, h * 0.72, 14, 7, -0.6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(w * 0.7, h * 0.78, 14, 7, 0.6, 0, Math.PI * 2); g.fill();
    for (let a = 0; a < 6.28; a += 0.5) { g.fillStyle = petal; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 24, h * 0.34 + Math.sin(a) * 24, 14, 6, a, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = disc; g.beginPath(); g.arc(w / 2, h * 0.34, 15, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#4a4a38'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
  }, key), { alphaTest: 0.1 }));
  flower('uSun', '#d9a526', '#6a4a24'); flower('uPoppy', '#b8423a', '#2a2020');
  M.def('uRevB', () => M.flat('u-revb', '#8a7a58', { paint: 0.03 }));
  M.def('uStone', () => M.flat('u-stone', '#6e6a64', { paint: 0.04 }));
  M.def('uPink', () => M.flat('u-pink', '#a68878', { paint: 0.04 }));
  M.def('uZinc', () => M.flat('u-zinc', '#8d9399', { paint: 0.05 }));
  M.def('uChim', () => M.flat('u-chim', '#9a8a70', { paint: 0.04 }));
  M.def('uScar', () => M.deco('u-scar', A.D(128, 160, (g, w, h) => { g.fillStyle = '#b8b0a0'; g.beginPath(); g.moveTo(w * 0.2, h * 0.1); g.quadraticCurveTo(w * 0.7, -h * 0.05, w * 0.85, h * 0.3); g.quadraticCurveTo(w * 0.95, h * 0.62, w * 0.7, h * 0.85); g.quadraticCurveTo(w * 0.45, h * 0.98, w * 0.25, h * 0.7); g.quadraticCurveTo(w * 0.05, h * 0.4, w * 0.2, h * 0.1); g.fill(); g.fillStyle = '#2a2826'; g.beginPath(); g.ellipse(w * 0.5, h * 0.42, w * 0.2, h * 0.1, 0, 0, Math.PI * 2); g.fill(); }, 'u-scar'), { alphaTest: 0.3 }));
  M.def('uWin', () => M.sheet('u-win', A.win('u-w', { frame: '#e8e4d8', bars: 'two', ratio: 1.85 }), { paint: 0 }));
  M.def('uWinGrille', () => M.sheet('u-win-grille', A.win('u-grille', { head: 'arch', frame: '#3a3a3a', bars: 'cross', glass: 'dark', ratio: 1.55, f: 5 }), { paint: 0 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'kudryavtsev', F: FR.SF, ids: ['r1538751'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] kudryavtsev/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const brick = { mat: M.uBrick, tu: M.tex['u-brick'].tu, tv: M.tex['u-brick'].tv }, gran = { mat: M.uGranite, tu: M.tex['u-granite'].tu, tv: M.tex['u-granite'].tv };
  const green = { mat: M.uGreen, tu: 1.6, tv: 0.6 }, mosaic = { mat: M.uMosaic, tu: M.tex['u-mosaic'].tu, tv: M.tex['u-mosaic'].tv };
  const bandsC = [{ y0: 0, y1: 5.6, ...gran }, { y0: 5.6, y1: 7.4, ...green }, { y0: 7.4, y1: H, ...brick }];
  const bandsW = [{ y0: 0, y1: 5.6, ...gran }, { y0: 5.6, y1: 7.4, ...green }, { y0: 7.4, y1: 19.5, ...brick }, { y0: 19.5, y1: H, ...mosaic }];
  const trimD = { mat: M.uStone, t: 0.16, proud: 0.06, top: 0.3, bot: 0.2 };
  h.begin();
  stage('front', () => {
    const ps = h.pieces(0, 28.3);
    const wins = [];
    const win = (x, k, w = 1.15, o = {}) => ({ x, y: SILL[k], w, h: WHT[k], glass: M.winW, reveal: M.uRevB, depth: 0.25, ...o });
    for (const x of [9.3, 11.4, 16.9, 18.6]) for (let k = 0; k < 5; k++) wins.push(win(x, k, 1.15, { trim: trimD }));
    for (let k = 0; k < 5; k++) wins.push(win(14.1, k, 1.4, { head: k % 2 ? 'seg' : undefined, rise: 0.3, trim: trimD }));
    for (const x of [0.9, 6.0, 22.4, 27.3]) for (let k = 0; k < 5; k++) wins.push(win(x, k, 1.0));
    for (const x of [1.8, 5.6, 9.6, 11.9, 22.6, 26.2]) wins.push({ x, y: 1.0, w: 1.3, h: 2.2, head: 'arch', glass: M.uWinGrille, reveal: M.uRevB, depth: 0.3, trim: { mat: M.uPink, t: 0.25, proud: 0.05, top: 0.28, bot: 0.1 } });
    wins.push({ x: 14.2, y: 0, w: 1.4, h: 2.5, glass: M.doorDark, reveal: M.uPink, depth: 0.3, trim: { mat: M.uPink, t: 0.3, proud: 0.1, top: 0.45, bot: 0 } });
    wins.push({ x: 18.0, y: 0, w: 3.3, h: 4.2, head: 'arch', glass: M.darkGlass, reveal: M.uStone, depth: 0.5, trim: { mat: M.uStone, t: 0.3, proud: 0.08, top: 0.3, bot: 0 }, n: 12 });
    for (const p of ps) {
      h.span(p, -1, 7.2, bandsW, wins, { reveal: M.uRevB, glass: M.winW });
      h.span(p, 7.2, 21.3, bandsC, wins, { reveal: M.uRevB, glass: M.winW });
      h.span(p, 21.3, 999, bandsW, wins, { reveal: M.uRevB, glass: M.winW });
      P.box(M.uStone, p.u0, p.u1, H - 0.4, H, p.d - 0.02, p.d + 0.35, 'bk', 2); P.box(M.uPink, p.u0, p.u1, 5.5, 5.7, p.d - 0.02, p.d + 0.1, 'bk', 2);
    }
    // the five panel columns of the centre
    const cols = [9.3, 11.4, 14.1, 16.9, 18.6], pan = (m, x, y0, y1) => decal(P, m, x, y0, 0.85, y1 - y0, 0.04, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    cols.forEach((x, i) => {
      pan(i % 2 ? M.uSun : M.uPoppy, x, 16.1, 17.2); pan(i % 2 ? M.uPoppy : M.uSun, x, 8.9, 10.0);
      pan(M.uTurq, x, 12.4, 13.5); pan(M.uMaroon, x, 19.0, 20.1);
    });
    // wing oriels (3-faced, 2.6 m wide at the wall, 0.9 proud, floors 3-6) on stone corbels, ending in iron balconies; one more flower panel on each
    for (const cx of [3.5, 24.8]) {
      bay(P, { chain: cantedChain(cx, 1.5, 0.9, 62), y0: 6.6, y1: 21.8, bands: [{ y0: 6.6, y1: 19.5, ...brick }, { y0: 19.5, y1: 21.8, ...mosaic }], reveal: M.uRevB, glass: M.winW, soffit: M.uStone, top: M.uZinc,
        wins: (i, len) => [10.2, 13.8, 17.4, 20.4].map((y, k) => ({ x: len / 2, y, w: i === 1 ? 1.0 : 0.55, h: [2.0, 2.0, 2.0, 1.4][k], glass: M.winW, reveal: M.uRevB, depth: 0.15 })) });
      P.box(M.uStone, cx - 1.5, cx + 1.5, 5.6, 6.6, -0.02, 1.3, 'b', 1);
      balcony(P, M, { x: cx, y: 21.8, w: 3.0, depth: 1.1 });
      pan(cx < 10 ? M.uSun : M.uPoppy, cx, 16.0, 17.2);
    }
    // the triangular central gable (14 m wide, top 26.4) with the empty oval window and its plaster scar, chimneys
    P.extrude(M.uBrick, shapeOf([[7.2, H - 0.3], [21.3, H - 0.3], [14.25, 26.4]]), -0.4, 0.5, 2, 4);
    decal(P, M.uScar, 14.25, 22.6, 1.8, 2.2, 0.12);
    for (const x of [8.2, 20.4]) P.box(M.uChim, x - 0.35, x + 0.35, H, H + 1.8, -2.0, -1.3, 'b', 1);
    for (const x of [2.0, 26.5]) P.box(M.uChim, x - 0.35, x + 0.35, H, H + 1.4, -2.0, -1.3, 'b', 1);
  });
  h.rest({ bands: [{ y0: 0, y1: 5.6, ...gran }, { y0: 5.6, y1: 7.4, ...green }, { y0: 7.4, y1: H, ...brick }], rows: SILL.map((y, k) => ({ y, w: 1.1, h: WHT[k] })).concat([{ y: 1.0, w: 1.2, h: 2.0, head: 'arch' }]), pitch: 2.3, margin: 1.2, reveal: M.uRevB, glass: M.winW, depth: 0.2 });
  h.band(H - 0.4, H, 0.35, { front: M.uStone, top: M.uStone, under: M.uStone }, { skip: (e) => e.n[1] > 0.9 });
  h.roof(H - 0.02, M.uZinc); h.chimneys(H, 6);
  roofRail(h, H, { skip: (e) => e.n[1] > 0.9 });
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'r1538751', name: 'Дом с подсолнухами (15-я линия В.О., 70)', x: c.x, z: c.z, h: 26.4 });
  h.spot(svc, 14, 3.0, 0, -1, 12, 'Дом с подсолнухами: майолика Ваулина');
  svc.parts.kudryavtsev = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
