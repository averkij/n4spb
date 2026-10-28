// landmarksModernVO/borkhov.js - the two BORKHOV HOUSES on Bolshoy pr. (Доходные дома Х. Г. Борхова, A. F. Baranovsky 1911-12): no. 54 with the corner tower (OSM w160229193, 19th Line 14) and the twin no. 56
// (OSM r2144616 with its courtyard hole); baked 19.8 m, real cornices 22.4 / 23.4 m.  Dossier docs/research/modernvo.md sections 4 and 5 (photos BO54-01 / 02 / 04, BO56-02), frames BA (Bolshoy, u 0 = the tower
// corner .. 24), BB (19th Line, u 0 .. 61.03, the tower corner at u = 61), BC (no. 56, u 0 .. 63.2).
//   no. 54: dark violet-grey rock-faced granite base (5.8 m, shop windows, a heavy round pylon under the tower), taupe glazed tile with maroon accent panels, a sea-green frieze under the cornice, the
//           canted three-faced tower (floors 3-6, belts, cream pilaster strips) on a stone belly with the octagonal slitted drum and the grey zinc dome (tip 28.2), the segmental green-field gable on Bolshoy, two
//           stacks of black iron balconies and a pale canted bay on the 19th Line, a saw of plastered parapet pieces on the roof line.
//   no. 56: cream plaster upper floors (2014 restoration) over a maroon roughcast two-storey base with a granite plinth, two canted bays with zinc hoods, a segmental gable with three oculi, small iron balconies.
import { FR } from './frame.js';
import { House } from './house.js';
import { bay } from './bay.js';
import { prism, loftRings, scaleRing, decal, roofRail, balcony } from './elem.js';
import { polyRing } from './bay.js';
import { winWall } from './wallx.js';
import { shapeOf } from './geo.js';
import { cornice } from './wall.js';

const H54 = 22.4, H56 = 23.4;
const S54 = [7.3, 11.3, 15.3, 19.3], H54W = [2.0, 2.0, 2.0, 1.8];

function mats(M) {
  const A = M.A;
  M.def('bTile', () => M.sheet('b-tile', A.tile('b-taupe', '#8c8176', { vary: 0.1, dark: 0.1, glaze: true, mortar: '#b0a68e', accent: [['#9a8a76', 0.1], ['#7a6e64', 0.08]] }), { paint: 0.03 }));
  M.def('bGranite', () => M.sheet('b-granite', A.granite('b-granite', '#5c5c60', { cols: 4, rows: 4, tw: 0.5, th: 0.3 }), { paint: 0.04 }));
  M.def('bGreen', () => M.sheet('b-green', A.tile('b-green', '#6fa890', { vary: 0.12, dark: 0.06, glaze: true, mortar: '#8fbba7', tw: 0.19, th: 0.13, rows: 8 }), { paint: 0.03 }));
  M.def('bMaroon', () => M.deco('b-maroon', A.D(64, 128, (g, w, h) => { g.fillStyle = '#5a3a36'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, y, w, 1.5); } A.speckle(g, w, h, 8101, 80, 0.1, 2); }, 'b-maroon'), { alphaTest: 0.1 }));
  M.def('bCream', () => M.flat('b-cream', '#e6dcc6', { paint: 0.03 }));
  M.def('bCreamTex', () => M.sheet('b-cream-tex', A.plaster('b-cream', '#e6dcc6', { stain: 0.03 }), { paint: 0.03 }));
  M.def('bRev', () => M.flat('b-rev', '#8f857a', { paint: 0.03 }));
  M.def('bRevC', () => M.flat('b-revc', '#d4c9b2', { paint: 0.03 }));
  M.def('bDome', () => M.flat('b-dome', '#a3aaaf', { paint: 0.05 }));
  M.def('bParapet', () => M.flat('b-parapet', '#a89d8a', { paint: 0.05 }));
  M.def('bPlaster56', () => M.sheet('b-p56', A.plaster('b-p56', '#e8dcc0', { stain: 0.03 }), { paint: 0.03 }));
  M.def('bBase56', () => M.sheet('b-base56', A.rough('b-base56', '#7a4a45'), { paint: 0.04 }));
  M.def('bPlinth56', () => M.flat('b-plinth56', '#5a5752', { paint: 0.04 }));
  M.def('bRev56', () => M.flat('b-rev56', '#d6cab0', { paint: 0.03 }));
  M.def('bRevM56', () => M.flat('b-revm56', '#5e3733', { paint: 0.03 }));
  M.def('bYard', () => M.sheet('b-yard', A.plaster('b-yard', '#c9a450', { stain: 0.04 }), { paint: 0.04 }));
  M.def('bPlaque', () => M.deco('b-plaque', A.D(96, 64, (g, w, h) => { g.fillStyle = '#6a6862'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8a49a'; g.lineWidth = 2; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#d8d4c6'; g.font = `700 11px ${A.FONTS.sans}`; g.textAlign = 'center'; g.fillText('Ю. А. БИЛИБИН', w / 2, 28); g.font = `700 10px ${A.FONTS.sans}`; g.fillText('1925 — 1949', w / 2, 46); }, 'b-plaque'), { alphaTest: 0.1 }));
  M.def('bHood', () => M.flat('b-hood', '#aeb6bc', { paint: 0.05 }));
  M.def('bOculus', () => M.flat('b-oculus', '#2b3338', { paint: 0 }));
  M.def('bWinGrille', () => M.sheet('b-win-grille', A.win('b-grille', { frame: '#3c3a38', bars: 'cross', glass: 'dark', ratio: 1.7, f: 5 }), { paint: 0 }));
  M.def('bWinW', () => M.sheet('b-win-w', A.win('b-w', { frame: '#e6e0d2', bars: 'two', ratio: 1.9 }), { paint: 0 }));
}

/** the three-faced corner bay (floors 3-6) in the diagonal frame of the corner (cu, cz) with outward diagonal d: chain [A, B, C, D] in frame coordinates */
function cornerChain(cu, cz, d, p = 1.3, w = 2.6, back = 0.2, wide = 1.9) {
  const e = [d[1], -d[0]], pt = (x, y) => [cu + e[0] * x + d[0] * y, cz + e[1] * x + d[1] * y];
  return [pt(-wide, -back), pt(-w / 2, p), pt(w / 2, p), pt(wide, -back)];
}

function build54(K, M, svc, errs) {
  const { P } = K;
  const H = H54;
  const h = new House(K, { name: 'borkhov54', F: FR.BA, ids: ['w160229193'], H });
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] borkhov54/' + name + ':', e); errs.push('54/' + name + ': ' + (e && e.stack || e)); } };
  const tile = { mat: M.bTile, tu: M.tex['b-tile'].tu, tv: M.tex['b-tile'].tv }, gran = { mat: M.bGranite, tu: M.tex['b-granite'].tu, tv: M.tex['b-granite'].tv }, green = { mat: M.bGreen, tu: M.tex['b-green'].tu, tv: M.tex['b-green'].tv };
  const bands = [{ y0: 0, y1: 5.8, ...gran }, { y0: 5.8, y1: 21.2, ...tile }, { y0: 21.2, y1: H, ...green }];
  const trim = { mat: M.bCream, t: 0.13, proud: 0.04, top: 0.15, bot: 0.17 };
  const win = (x, k, w = 1.1) => ({ x, y: S54[k], w, h: H54W[k], glass: M.winD, reveal: M.bRev, depth: 0.22, trim });
  const shopW = (x) => ({ x, y: 0.5, w: 1.5, h: 2.6, glass: M.winShop, reveal: M.bRev, depth: 0.3 });
  const mezz = (x) => ({ x, y: 3.7, w: 1.0, h: 0.9, glass: M.winD, reveal: M.bRev, depth: 0.3 });
  h.begin();
  const c0 = [0, 0], dg = [-Math.SQRT1_2, Math.SQRT1_2];
  let towerC = [0, 0];
  stage('tower', () => {
    const ch = cornerChain(c0[0], c0[1], dg, 1.3, 2.6, 0.2, 1.9);
    towerC = [(ch[1][0] + ch[2][0]) / 2 * 0.5 + ch[0][0] * 0.25 + ch[3][0] * 0.25, (ch[1][1] + ch[2][1]) / 2 * 0.5 + ch[0][1] * 0.25 + ch[3][1] * 0.25];
    // the granite pylon (r 1.55) from the pavement to the belly
    const pyl = polyRing(14, 1.55, c0[0] + dg[0] * 0.35, c0[1] + dg[1] * 0.35, 0);
    loftRings(P, M.bGranite, pyl, [c0[0] + dg[0] * 0.35, c0[1] + dg[1] * 0.35], 0, [[1, 0], [1, 5.8]], { uRep: 5, vTile: 1.2 });
    P.cap(M.bGranite, pyl, 5.8, true, 2);
    P.cap(M.bGranite, ch, 5.8, false, 2);
    bay(P, { chain: ch, y0: 5.8, y1: 22.4, bands: [{ y0: 5.8, y1: 6.6, mat: M.bGranite, tu: gran.tu, tv: gran.tv }, { y0: 6.6, y1: 21.2, ...tile }, { y0: 21.2, y1: 22.4, ...green }], reveal: M.bRev, glass: M.winD, top: M.bDome,
      wins: (i, len) => S54.map((y, k) => ({ x: len / 2, y, w: i === 1 ? 0.85 : 0.85, h: H54W[k], glass: M.winD, reveal: M.bRev, depth: 0.16, trim: { mat: M.bCream, t: 0.08, proud: 0.03, top: 0.1, bot: 0.12 } })) });
    // belly (stone corbel) under the bay and the belts at the floor lines
    loftRings(P, M.bGranite, ch, towerC, 5.4, [[0.8, 0], [1.02, 0.4]]);
    for (const y of [11.0, 15.0, 19.0]) loftRings(P, M.bCream, ch, towerC, y, [[1.025, 0], [1.025, 0.22]]);
    // the neck, the drum with eight arched slits, the squashed dome with its finial
    const dr = polyRing(8, 1.4, towerC[0], towerC[1], Math.PI / 8);
    const nk = polyRing(8, 1.2, towerC[0], towerC[1], Math.PI / 8);
    prism(P, nk, 22.4, 24.0, { c: towerC, mat: { mat: M.bCreamTex, tu: 3, tv: 3 } });
    prism(P, dr, 24.0, 25.4, { c: towerC, mat: { mat: M.bDome, tu: 3, tv: 3 }, wins: (i, len) => [{ x: len / 2, y: 24.4, w: 0.35, h: 0.55, head: 'arch', glass: M.bOculus, depth: 0.1 }] });
    loftRings(P, M.bDome, dr, towerC, 25.4, [[1.04, 0], [1.1, 0.35], [0.95, 0.9], [0.62, 1.4], [0.24, 1.75], [0.1, 1.8]]);
    P.cyl(M.bDome, [towerC[0], 27.1, towerC[1]], [towerC[0], 28.2, towerC[1]], 0.07, 0.015, 5, false);
    P.cyl(M.bDome, [towerC[0], 27.5, towerC[1]], [towerC[0], 27.75, towerC[1]], 0.14, 0.14, 6, true);
  });
  stage('bolshoy', () => {
    const ps = h.pieces(0, 24);
    const wins = [];
    for (const x of [5.4, 7.7, 10.4, 12.5, 14.7, 18.6, 20.9, 23.0]) for (let k = 0; k < 4; k++) wins.push(win(x, k, x === 12.5 ? 1.2 : 1.1));
    wins.push({ x: 12.5, y: 21.8, w: 3.0, h: 1.6, glass: M.winD, reveal: M.bRev, depth: 0.2 });
    for (const x of [5.2, 9.0, 13.6, 19.0, 22.4]) wins.push(shopW(x), mezz(x));
    for (const p of ps) h.span(p, -1, 999, bands, wins, { reveal: M.bRev, glass: M.winD });
    for (const p of ps) { P.box(M.bCream, p.u0, p.u1, H - 0.6, H, p.d - 0.02, p.d + 0.4, 'bk', 2); P.box(M.bGranite, p.u0, p.u1, 5.6, 5.8, p.d - 0.02, p.d + 0.2, 'bk', 2); }
    balcony(P, M, { x: 12.5, y: 18.4, w: 2.2, depth: 1.0 });
    for (const x of [7.7, 10.4, 14.7, 18.6, 20.9]) for (const y of [8.8, 12.8]) decal(P, M.bMaroon, x + 1.1, y, 0.5, 1.7, 0.03, [[0, 0], [1, 0], [1, 1.5], [0, 1.5]]);
    // the big segmental gable (u 4 .. 17): a sea-green tile field with three small windows
    const pts = [[4, H - 0.2], [17, H - 0.2]];
    for (let k = 12; k >= 0; k--) { const u = 4 + 13 * k / 12; pts.push([u, H + 3.4 * (1 - Math.pow((u - 10.5) / 6.5, 2))]); }
    P.extrude(M.bTile, shapeOf(pts), -0.4, 0.5, 2, 4);
    for (let k = 0; k < 12; k++) { const u0 = 5.0 + 11 * k / 12, u1 = 5.0 + 11 * (k + 1) / 12; const f = (u) => H + 0.2 + 2.7 * (1 - Math.pow((u - 10.5) / 5.8, 2)) - 0.35; P.quad(M.bGreen, [u0, H + 0.15, 0.14], [u1, H + 0.15, 0.14], [u1, f(u1), 0.14], [u0, f(u0), 0.14], [0, 0, 1], [[u0 / 1, 0], [u1 / 1, 0], [u1 / 1, 1], [u0 / 1, 1]]); }
    for (const x of [9.0, 10.5, 12.0]) P.quad(M.bOculus, [x - 0.45, H + 0.9, 0.16], [x + 0.45, H + 0.9, 0.16], [x + 0.45, H + 1.8, 0.16], [x - 0.45, H + 1.8, 0.16], [0, 0, 1]);
  });
  stage('nineteenth', () => {
    const ps = h.piecesIn(FR.BB, -1, 999, { zTol: 1.7 });
    h.inFrame(FR.BB, () => {
      const stackU = [16, 34];
      const wins = [];
      for (let k = 0; k < 24; k++) { const x = 2.0 + 2.35 * k; if (x > 59.5) break; if (stackU.some((s) => Math.abs(x - s) < 1.3) || Math.abs(x - 48) < 1.6) continue; for (let j = 0; j < 4; j++) wins.push(win(x, j)); }
      for (const s of stackU) for (let j = 0; j < 4; j++) wins.push({ x: s, y: S54[j], w: 1.0, h: 2.3, glass: M.winD, reveal: M.bRev, depth: 0.22, trim });
      for (let x = 2.5; x < 59; x += 4.7) if (Math.abs(x - 28) > 3) wins.push(shopW(x), mezz(x + 1.6));
      wins.push({ x: 28.0, y: 0, w: 1.3, h: 2.5, glass: M.doorDark, reveal: M.bRev, depth: 0.25, trim: { mat: M.bGranite, t: 0.25, proud: 0.08, top: 0.3, bot: 0 } }, { x: 52.0, y: 0, w: 1.3, h: 2.5, glass: M.doorDark, reveal: M.bRev, depth: 0.25, trim: { mat: M.bGranite, t: 0.25, proud: 0.08, top: 0.3, bot: 0 } });
      for (const p of ps) {
        winWall(P, { x0: p.u0, x1: p.u1, z: p.d, bands, wins: wins.filter((w) => w.x - w.w / 2 >= p.u0 - 1e-3 && w.x + w.w / 2 <= p.u1 + 1e-3), reveal: M.bRev, glass: M.winD, depth: 0.22 });
        P.box(M.bCream, p.u0, p.u1, H - 0.6, H, p.d - 0.02, p.d + 0.4, 'bk', 2); P.box(M.bGranite, p.u0, p.u1, 5.6, 5.8, p.d - 0.02, p.d + 0.2, 'bk', 2);
      }
      for (const s of stackU) for (let j = 0; j < 4; j++) balcony(P, M, { x: s, y: S54[j] + 0.0, w: 1.6, depth: 0.8 });
      // the pale canted bay at u 48 (floors 3-6): 2.4 m wide, 0.6 proud, ending in a small balcony
      bay(P, { chain: [[46.8, 0], [47.1, 0.6], [48.9, 0.6], [49.2, 0]], y0: 6.6, y1: 22.0, mat: { mat: M.bCreamTex, tu: 3, tv: 3 }, reveal: M.bRevC, glass: M.winD, top: M.bHood, soffit: M.bCream,
        wins: (i, len) => (i === 1 ? S54.map((y, k) => ({ x: len / 2, y, w: 1.0, h: H54W[k], glass: M.winD, reveal: M.bRevC, depth: 0.14 })) : []) });
      // the saw of low plastered parapet pieces on the roof line (3.0 x 2.0 with one dark opening) every ~12 m
      for (const u of [8, 20, 31, 43, 54]) { P.box(M.bParapet, u - 1.5, u + 1.5, H, H + 1.6, -1.0, 0.1, 'b', 2); P.quad(M.bOculus, [u - 0.45, H + 0.4, 0.11], [u + 0.45, H + 0.4, 0.11], [u + 0.45, H + 1.2, 0.11], [u - 0.45, H + 1.2, 0.11], [0, 0, 1]); }
    });
  });
  h.rest({ bands: [{ y0: 0, y1: 5.8, ...gran }, { y0: 5.8, y1: H, mat: M.yardPlaster, tu: 3, tv: 3 }], rows: S54.map((y, k) => ({ y, w: 1.1, h: H54W[k] })), pitch: 2.4, margin: 1.2, reveal: M.bRev, glass: M.winD, depth: 0.2 });
  h.band(H - 0.6, H, 0.4, { front: M.bCream, top: M.bCream, under: M.bCream }, { skip: (e) => e.n[1] > 0.9 || (e.n[0] < -0.9 && e.len > 20) });
  h.roof(H - 0.02, M.zincDark); h.chimneys(H, 4);
  roofRail(h, H, {});
  h.end();
  h.colliders(H + 1);
  h.cylinder(c0[0] + dg[0] * 0.35, c0[1] + dg[1] * 0.35, 1.5, 6);                                      // the granite pylon under the tower
  const c = h.centre();
  svc.monuments.push({ id: 'w160229193', name: 'Доходный дом Х. Г. Борхова (Большой пр., 54)', x: c.x, z: c.z, h: 28.2 });
  h.spot(svc, 18, 3.5, 0, -1, 10, 'Дом Борхова с угловой башней (Большой пр., 54)');
}

function build56(K, M, svc, errs) {
  const { P } = K;
  const H = H56;
  const h = new House(K, { name: 'borkhov56', F: FR.BC, ids: ['r2144616'], H });
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] borkhov56/' + name + ':', e); errs.push('56/' + name + ': ' + (e && e.stack || e)); } };
  const up = { mat: M.bPlaster56, tu: M.tex['b-p56'].tu, tv: M.tex['b-p56'].tv }, base = { mat: M.bBase56, tu: 2, tv: 2 };
  const bands = [{ y0: 0, y1: 0.9, mat: M.bPlinth56, tu: 2, tv: 1 }, { y0: 0.9, y1: 6.0, ...base }, { y0: 6.0, y1: H, ...up }];
  const S = [7.4, 11.25, 15.1, 18.95];
  const trim = { mat: M.bRev56, t: 0.1, proud: 0.03, top: 0.12, bot: 0.14 };
  h.begin();
  stage('front', () => {
    const ps = h.pieces(0, 63.2);
    const wins = [], bayU = [7.2, 43.3];
    for (let k = 0; k < 29; k++) { const x = 1.1 + 2.15 * k; if (bayU.some((b) => Math.abs(x - b) < 1.9)) continue; for (const y of S) wins.push({ x, y, w: 1.1, h: 1.9, glass: M.winW, reveal: M.bRev56, depth: 0.2, trim }); }
    for (let k = 0; k < 29; k++) { const x = 1.1 + 2.15 * k; if (Math.abs(x - 19) < 2.4 || Math.abs(x - 5) < 1.2 || Math.abs(x - 12) < 1.2) continue; wins.push({ x, y: 1.4, w: 1.1, h: 1.7, glass: M.winD, reveal: M.bRevM56, depth: 0.25 }); }
    wins.push({ x: 19, y: 0, w: 3.0, h: 3.2, glass: M.darkGlass, reveal: M.bRevM56, depth: 0.4 });
    for (const x of [5.0, 12.0]) wins.push({ x, y: 0, w: 1.2, h: 2.4, glass: M.doorDark, reveal: M.bRevM56, depth: 0.25 });
    for (const p of ps) h.span(p, -1, 999, bands, wins, { reveal: M.bRev56, glass: M.winD });
    for (const p of ps) { P.box(M.bRev56, p.u0, p.u1, H - 0.5, H, p.d - 0.02, p.d + 0.45, 'bk', 2); P.box(M.bPlinth56, p.u0, p.u1, 5.9, 6.1, p.d - 0.02, p.d + 0.15, 'bk', 2); }
    for (const b of bayU) {
      bay(P, { chain: [[b - 1.2 - 0.46, 0], [b - 1.2, 0.8], [b + 1.2, 0.8], [b + 1.2 + 0.46, 0]], y0: 6.3, y1: 22.6, mat: up, reveal: M.bRev56, glass: M.winW, soffit: M.bBase56, top: M.bHood,
        wins: (i, len) => (i === 1 ? S.map((y) => ({ x: len / 2, y, w: 1.1, h: 1.9, glass: M.winW, reveal: M.bRev56, depth: 0.15 })) : []) });
      P.box(M.bBase56, b - 1.9, b + 1.9, 5.7, 6.3, -0.02, 0.9, 'b', 1);
      P.fan(M.bHood, [[b - 1.4, 22.6, 0.0], [b + 1.4, 22.6, 0.0], [b + 1.1, 23.1, 0.7], [b - 1.1, 23.1, 0.7]], [0, 1, 0.2]);
    }
    for (const x of [25.0, 49.6]) balcony(P, M, { x, y: 15.0, w: 1.6, depth: 0.9 });
    // the big segmental gable (u 18.7 .. 33.3, apex 27.0, three oval oculi) and the small gable over bay 2 (u 40 .. 46, apex 25.4)
    const gab = (u0, u1, apex) => { const pts = [[u0, H - 0.3], [u1, H - 0.3]]; const m = (u0 + u1) / 2, hw = (u1 - u0) / 2; for (let k = 16; k >= 0; k--) { const u = u0 + (u1 - u0) * k / 16; pts.push([u, H + (apex - H) * (1 - Math.pow((u - m) / hw, 2))]); } P.extrude(M.bPlaster56, shapeOf(pts), -0.4, 0.5, 3, 4); };
    gab(18.7, 33.3, 27.0); gab(40.0, 46.0, 25.4);
    for (const x of [23.6, 25.5, 27.5]) P.quad(M.bOculus, [x - 0.45, H + 1.4, 0.12], [x + 0.45, H + 1.4, 0.12], [x + 0.45, H + 2.0, 0.12], [x - 0.45, H + 2.0, 0.12], [0, 0, 1]);
    for (const x of [15, 35, 53]) P.cyl(M.pipeCream, [x, H - 0.5, 0.12], [x, 0, 0.12], 0.07, 0.07, 6, false);
  });
  stage('plaque', () => {                                                                          // the Bilibin memorial plaque of the 1984 (name line and the years, plain text), floor 3 in a pier between windows
    if (h.reserve('r2144616', 10.8, 8.4, 0.6, 0.4)) decal(P, M.bPlaque, 10.8, 8.2, 0.6, 0.4, 0.05);
  });
  h.rest({ bands: [{ y0: 0, y1: H, mat: M.bYard, tu: 3, tv: 3 }], rows: S.map((y) => ({ y, w: 1.1, h: 1.9 })).concat([{ y: 1.4, w: 1.1, h: 1.7 }]), pitch: 2.4, margin: 1.2, reveal: M.bRev56, glass: M.winD, depth: 0.2 });
  h.band(H - 0.5, H, 0.45, { front: M.bRev56, top: M.bRev56, under: M.bRev56 }, { skip: (e) => e.n[1] > 0.9 });
  h.roof(H - 0.02, M.zincLight); h.chimneys(H, 6);
  roofRail(h, H, { skip: (e) => false });
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'r2144616', name: 'Доходный дом Х. Г. Борхова (Большой пр., 56)', x: c.x, z: c.z, h: 27 });
  h.spot(svc, 38, 2.0, 0, -1, 10, 'Борховы дома: ряд Большого проспекта');
}

export function build(K) {
  const { M, svc } = K;
  mats(M);
  const errs = [];
  try { build54(K, M, svc, errs); } catch (e) { errs.push('54: ' + (e && e.stack || e)); }
  try { build56(K, M, svc, errs); } catch (e) { errs.push('56: ' + (e && e.stack || e)); }
  svc.parts.borkhov = { tris: K.P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
