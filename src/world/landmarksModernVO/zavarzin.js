// landmarksModernVO/zavarzin.js - the ZAVARZIN HOUSE (Доходный дом А. А. и А. С. Заварзиных, Средний пр. В.О., 47 / 11-я линия, 34; A. F. Baranovsky with the owner, 1910-11; OSM r1537672, a hidden outline with 7 parts
// that the city drew; baked 19.8 m, real cornice 22.5 m).  Dossier docs/research/modernvo.md section 8 (photo ZA47-04 re-read), frames ZA (Sredny front u 0 .. 35.5) and ZB (the 10-11 Lines street, u 0 .. 42.1).
//   rusticated grey granite ground floor (4.8 m), warm grey-cream glazed tile above (#bbb2a2) with paired windows in smooth dark-grey cement frames and cast roundels, polychrome tile panels, the turquoise
//   glazed frieze (20.4 .. 22.5) with round-headed top-floor windows, the cream-grey cornice, an iron roof rail, the five-sided corner bay on a granite corbel (4.2 .. 4.9, five window rows) with the squared
//   turret (scalloped crown, oval window) and the oxidised onion cap (tip 27.3).  The block is 37 x 43 m with an off-centre courtyard (walls with window rows, closed).
import { FR } from './frame.js';
import { House } from './house.js';
import { cornerBay, dormer, prism, loftRings, decal, roofRail } from './elem.js';
import { polyRing } from './bay.js';
import { winWall } from './wallx.js';
import { onEdge } from './kit.js';

const H = 22.5;
const SILLS = [5.6, 9.1, 12.6, 16.0], HS = [2.3, 2.3, 2.3, 2.2], TOPY = 20.5;

function mats(M) {
  const A = M.A;
  M.def('zTile', () => M.sheet('z-tile', A.tile('z-tile', '#bbb2a2', { vary: 0.07, dark: 0.08, glaze: true, mortar: '#a79f90' }), { paint: 0.03 }));
  M.def('zGranite', () => M.sheet('z-granite', A.granite('z-granite', '#77736e', { cols: 3, rows: 4, tw: 0.7, th: 0.35 }), { paint: 0.04 }));
  M.def('zTurq', () => M.sheet('z-turq', A.tile('z-turq', '#4a9a98', { vary: 0.2, dark: 0.18, accent: [['#2f6f8a', 0.14], ['#86bdb4', 0.1]], glaze: true, mortar: '#5a8a86', tw: 0.19, th: 0.13, rows: 8 }), { paint: 0.03 }));
  M.def('zCement', () => M.flat('z-cement', '#626362', { paint: 0.04 }));
  M.def('zCornice', () => M.flat('z-cornice', '#a9a49c', { paint: 0.04 }));
  M.def('zRev', () => M.flat('z-rev', '#a39b8d', { paint: 0.03 }));
  M.def('zRevG', () => M.flat('z-rev-g', '#4f4c49', { paint: 0.03 }));
  M.def('zStucco', () => M.flat('z-stucco', '#a89c92', { paint: 0.04 }));
  M.def('zOnion', () => M.flat('z-onion', '#7a6a62', { paint: 0.05 }));
  M.def('zFlat', () => M.flat('z-flat', '#7d7f80', { paint: 0.05 }));
  M.def('zPanel', () => M.deco('z-panel', A.D(128, 64, (g, w, h) => {                  // polychrome tile panel 0.9 x 0.5: blue / ochre / pink
    g.fillStyle = '#6f93b0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a56a'; g.fillRect(0, 0, w * 0.34, h); g.fillStyle = '#c98f8a'; g.fillRect(w * 0.66, 0, w * 0.34, h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 4); g.strokeStyle = '#4f4c49'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
    A.speckle(g, w, h, 5521, 60, 0.12, 2);
  }, 'z-panel'), { alphaTest: 0.1 }));
  M.def('zRound', () => M.deco('z-round', A.D(64, 64, (g) => {                          // cast roundel with a lyre / paired loop
    g.fillStyle = '#626362'; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#8f8d88'; g.lineWidth = 4;
    g.beginPath(); g.arc(24, 30, 12, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(40, 30, 12, 0, Math.PI * 2); g.stroke();
  }, 'z-round'), { alphaTest: 0.3 }));
  M.def('zOval', () => M.flat('z-oval', '#2a2c2e', { paint: 0.01 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'zavarzin', F: FR.ZA, ids: ['r1537672'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] zavarzin/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const tile = { mat: M.zTile, tu: M.tex['z-tile'].tu, tv: M.tex['z-tile'].tv }, gran = { mat: M.zGranite, tu: M.tex['z-granite'].tu, tv: M.tex['z-granite'].tv }, turq = { mat: M.zTurq, tu: M.tex['z-turq'].tu, tv: M.tex['z-turq'].tv };
  const bandsFront = [{ y0: 0, y1: 4.8, ...gran }, { y0: 4.8, y1: TOPY, ...tile }, { y0: TOPY, y1: H, ...turq }];
  const bandsPlain = [{ y0: 0, y1: 4.8, ...gran }, { y0: 4.8, y1: H, ...tile }];
  const trimC = { mat: M.zCement, t: 0.15, proud: 0.05, top: 0.2, bot: 0.22 };
  const w1 = (x, k) => ({ x, y: SILLS[k], w: 1.05, h: HS[k], glass: M.winD, reveal: M.zRev, depth: 0.22, trim: trimC });
  const top = (x) => ({ x, y: TOPY + 0.05, w: 1.0, h: 1.5, head: 'arch', glass: M.winDArch, reveal: M.zRevG, depth: 0.2 });
  const shop = (x) => ({ x, y: 0.55, w: 2.0, h: 3.2, glass: M.winShop, reveal: M.zRevG, depth: 0.28, trim: { mat: M.zGranite, t: 0.25, proud: 0.05, top: 0.3, bot: 0 } });
  const pairsOf = (cs, singles) => {
    const w = [];
    for (const c of cs) for (let k = 0; k < 4; k++) { w.push(w1(c - 0.78, k), w1(c + 0.78, k)); }
    for (const c of cs) { w.push(top(c - 0.78), top(c + 0.78)); }
    for (const x of singles) { for (let k = 0; k < 4; k++) w.push(w1(x, k)); w.push(top(x)); }
    return w;
  };
  const bayEs = new Set();
  h.begin();
  stage('bay', () => {
    const es = h.near(36.65, -0.1, 1.9);
    if (es.length < 4) throw new Error('bay edges not found: ' + es.length);
    es.sort((a, b) => a.i - b.i); for (const e of es) bayEs.add(e);
    const sills = [5.8, 9.2, 12.7, 16.1, 19.6], hs = [2.3, 2.3, 2.3, 2.3, 2.0];
    const info = cornerBay(h, {
      edges: es, y0: 4.2, y1: 4.9, top: H, flare: 1.2,
      mats: { pier: gran, corbel: M.zGranite, shaft: tile, cap: M.zFlat, shaftBands: [{ y0: 4.9, y1: TOPY, ...tile }, { y0: TOPY, y1: H, ...turq }] },
      reveal: M.zRev, glass: M.winD,
      wins: (i, len) => (i >= 1 && i <= 3 ? sills.map((y, k) => ({ x: len / 2, y, w: 0.6, h: hs[k], glass: M.winD, reveal: M.zRev, depth: 0.14 })) : []),
      pierWins: (i, len) => (i === 2 ? [{ x: len / 2, y: 0, w: 1.1, h: 2.4, glass: M.doorDark, reveal: M.zRevG, depth: 0.22, trim: { mat: M.zGranite, t: 0.28, proud: 0.1, top: 0.35, bot: 0 } }] : []),
    });
    const c = info.c;
    // polychrome panels / cement bands on the bay at the heads of floors 2 and 3
    // turret: chamfered square 3.2 m over the bay, two dark slots per face, scalloped crown, oval window, onion cap, finial
    const T = polyRing(8, 1.75, c[0], c[1], Math.PI / 8);
    prism(P, T, H, 24.5, { c, mat: { mat: M.zStucco, tu: 3, tv: 3 }, wins: (i, len) => (i % 2 === 0 ? [{ x: len / 2, y: 0.55, w: 0.3, h: 1.3, glass: M.zOval, depth: 0.1 }] : []), cap: M.zOnion });
    P.cap(M.zFlat, info.shaft, H, true, 2);
    // the scalloped skirt: four small gablets (pyramids) on the cardinal faces of the turret top
    for (let i = 0; i < 8; i += 2) { const a0 = T[i], a1 = T[(i + 1) % 8], m = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2]; const ax = [m[0] - c[0], m[1] - c[1]], l = Math.hypot(ax[0], ax[1]) || 1; P.fan(M.zCornice, [[a0[0], 24.5, a0[1]], [a1[0], 24.5, a1[1]], [m[0] + ax[0] / l * 0.1, 25.3, m[1] + ax[1] / l * 0.1]], [ax[0], 0.3, ax[1]]); }
    loftRings(P, M.zCornice, T, c, 24.5, [[1.0, 0], [0.93, 0.35], [0.66, 0.6]]);
    loftRings(P, M.zOnion, T, c, 25.1, [[0.66, 0], [0.74, 0.35], [0.7, 0.8], [0.5, 1.25], [0.26, 1.7], [0.1, 2.0], [0, 2.1]]);
    P.cyl(M.zOnion, [c[0], 27.1, c[1]], [c[0], 27.35, c[1]], 0.07, 0.01, 5, false);
  });
  stage('sredny', () => {
    const ps = h.pieces(0, 35.5);
    const pairs = [6.5, 11.5, 23.0, 28.0], singles = [2.5, 14.5, 20.5, 32.0];
    const wins = pairsOf(pairs, singles);
    for (let x = 4.0; x < 35; x += 4.2) if (x < 15 || x > 19) wins.push(shop(x));
    wins.push({ x: 17.45, y: 0, w: 1.1, h: 2.6, glass: M.doorDark, reveal: M.zRevG, depth: 0.22, trim: { mat: M.zGranite, t: 0.25, proud: 0.08, top: 0.3, bot: 0 } });
    for (const p of ps) h.span(p, -1, 999, bandsFront, wins, { reveal: M.zRev, glass: M.winD });
    for (const c of pairs) { decal(P, M.zPanel, c, 4.95, 0.9, 0.5, 0.04); for (const y of [11.95, 15.4]) decal(P, M.zRound, c, y, 0.5, 0.5, 0.05); P.box(M.zCement, c - 0.16, c + 0.16, SILLS[0], SILLS[3] + HS[3], -0.02, 0.06, 'bk', 1); }
    for (const p of ps) { P.box(M.zCornice, p.u0, p.u1, H - 0.7, H, p.d - 0.05, p.d + 0.65, 'bk', 2); P.box(M.zCement, p.u0, p.u1, 4.8, 5.0, p.d - 0.05, p.d + 0.08, 'bk', 2); }
    dormer(P, { x: 2.6, y0: H, w: 4.4, h: 2.5, hw: 1.5, z: 0, wall: tile, edge: M.zCement, lid: M.zCornice, win: { w: 1.0, h: 1.2, y: 0.2, glass: M.winDArch, reveal: M.zRev } });
  });
  stage('street11', () => {
    const ps = h.piecesIn(FR.ZB, -1, 999, { zTol: 1.7 });
    h.inFrame(FR.ZB, () => {
      const pairs = [5.0, 10.0, 15.0, 25.5, 35.0], singles = [1.9, 30.0, 39.6];
      const wins = pairsOf(pairs, singles.filter((x) => x !== 30.0));
      for (const x of [3.6, 7.8, 12.0, 16.2]) wins.push(shop(x));
      for (const x of [26.5, 34.0, 38.0]) wins.push(shop(x));
      wins.push({ x: 20.8, y: 0, w: 3.2, h: 3.6, head: 'arch', glass: M.doorDark, reveal: M.zRevG, depth: 0.3 });                  // the yard gate (closed leaves)
      wins.push({ x: 30.0, y: 0, w: 1.3, h: 2.6, glass: M.doorDark, reveal: M.zRevG, depth: 0.22, trim: { mat: M.zGranite, t: 0.25, proud: 0.08, top: 0.3, bot: 0 } });
      for (const x of [30.0]) { for (let k = 0; k < 4; k++) wins.push(w1(x, k)); wins.push(top(x)); }
      for (const p of ps) {
        winWall(P, { x0: p.u0, x1: p.u1, z: p.d, bands: bandsFront, wins: wins.filter((w) => w.x - w.w / 2 >= p.u0 - 1e-3 && w.x + w.w / 2 <= p.u1 + 1e-3), reveal: M.zRev, glass: M.winD, depth: 0.22 });
        P.box(M.zCornice, p.u0, p.u1, H - 0.7, H, p.d - 0.05, p.d + 0.65, 'bk', 2);
        P.box(M.zCement, p.u0, p.u1, 4.8, 5.0, p.d - 0.05, p.d + 0.08, 'bk', 2);
      }
      for (const c of pairs) { decal(P, M.zPanel, c, 4.95, 0.9, 0.5, 0.04); for (const y of [11.95, 15.4]) decal(P, M.zRound, c, y, 0.5, 0.5, 0.05); P.box(M.zCement, c - 0.16, c + 0.16, SILLS[0], SILLS[3] + HS[3], -0.02, 0.06, 'bk', 1); }
      dormer(P, { x: 39.5, y0: H, w: 4.4, h: 2.5, hw: 1.5, z: 0, wall: tile, edge: M.zCement, lid: M.zCornice, win: { w: 1.0, h: 1.2, y: 0.2, glass: M.winDArch, reveal: M.zRev } });
    });
  });
  h.rest({ bands: bandsPlain, rows: SILLS.map((y, k) => ({ y, w: 1.05, h: HS[k] })).concat([{ y: TOPY + 0.05, w: 1.0, h: 1.5 }]), pitch: 2.5, margin: 1.2, reveal: M.zRev, glass: M.winD, depth: 0.2 });
  h.band(H - 0.7, H, 0.6, { front: M.zCornice, top: M.zCement, under: M.zCornice }, { skip: (e) => bayEs.has(e) });
  h.roof(H - 0.02, M.zFlat); h.chimneys(H, 4);
  roofRail(h, H, { skip: (e) => bayEs.has(e) });
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'r1537672', name: 'Доходный дом А. А. и А. С. Заварзиных (Средний пр., 47)', x: c.x, z: c.z, h: 27.3 });
  h.spot(svc, 18, 6.0, 0, -1, 8, 'Дом Заварзиных: бирюзовый фриз и угловой эркер');
  svc.parts.zavarzin = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
