// landmarksModernVO/kornilova.js - the KORNILOVA HOUSE (Доходный дом А. П. Корниловой, Средний пр. В.О., 56 / 14-я линия, 41; A. F. Baranovsky 1909-10; Petrov-Vodkin lived here 1911-13; OSM w96579812, baked 23.1 m).
// Dossier docs/research/modernvo.md section 6 (photos KA56-02 / KA56-06 / KA56-07 re-read), frames KA (Sredny front u 0 .. 29.2, the tower corner at u = 29.2) and KB (14th Line, u 0 .. 21.3).
//   a rough granite storey (5.3 m, shops + door), khaki glazed tile (#c0b88a) with vertical maroon and pierced ornamental panel strips between the window columns, blue-teal tile in the top two floors,
//   the pink-cream ROUND TOWER (r 2.4, five window rows, flared stone bowl at 5.3 .. 6.4, tile strips) with the cantilevered balcony and its scrolled rail, the octagonal glazed lantern, the ribbed zinc dome, the
//   belvedere and the spike (tip 28.4); a 3-faced oriel at u ~ 9.5; the wavy blue gable at the east end (top 27.0); a zinc mansard with box dormers behind an iron roof rail.
import { FR } from './frame.js';
import { House } from './house.js';
import { bay, cantedChain } from './bay.js';
import { polyRing } from './bay.js';
import { faceFrame, prism, loftRings, decal, mansard, miniDormer, roofRail } from './elem.js';
import { winWall, loft } from './wallx.js';
import { shapeOf } from './geo.js';

const H = 22.8;
const SILLS = [6.4, 9.9, 13.4, 16.9, 20.4], WH = [2.0, 2.0, 2.0, 2.0, 1.6];

function mats(M) {
  const A = M.A;
  M.def('kaTile', () => M.sheet('ka-tile', A.tile('ka-khaki', '#c0b88a', { vary: 0.09, dark: 0.1, glaze: true, mortar: '#a89f78', accent: [['#a89868', 0.06], ['#d4cc9c', 0.05]], tw: 0.2 }), { paint: 0.03 }));
  M.def('kaGranite', () => M.sheet('ka-granite', A.granite('ka-granite', '#5d625d', { cols: 4, rows: 4, tw: 0.5, th: 0.3 }), { paint: 0.04 }));
  M.def('kaTeal', () => M.sheet('ka-teal', A.tile('ka-teal', '#5f8196', { vary: 0.14, dark: 0.1, glaze: true, mortar: '#6c8a9a', accent: [['#8fb0b8', 0.08], ['#456578', 0.1]], tw: 0.2 }), { paint: 0.03 }));
  M.def('kaBrickRed', () => M.sheet('ka-brick-red', A.tile('ka-red', '#a8503c', { vary: 0.12, dark: 0.1, glaze: true, mortar: '#8a4a3a', tw: 0.2 }), { paint: 0.03 }));
  M.def('kaStucco', () => M.sheet('ka-stucco', A.plaster('ka-stucco', '#dcc5b5', { stain: 0.03 }), { paint: 0.03 }));
  M.def('kaStuccoL', () => M.flat('ka-stucco-l', '#e2d0c0', { paint: 0.03 }));
  M.def('kaRev', () => M.flat('ka-rev', '#cdb8a6', { paint: 0.03 }));
  M.def('kaRevG', () => M.flat('ka-revg', '#4a4e4a', { paint: 0.03 }));
  M.def('kaZinc', () => M.flat('ka-zinc', '#7f878c', { paint: 0.05 }));
  M.def('kaDome', () => M.flat('ka-dome', '#8a7a68', { paint: 0.06 }));
  M.def('kaLantern', () => M.flat('ka-lantern', '#b8c6cc', { paint: 0.02 }));
  M.def('kaBlack', () => M.flat('ka-black', '#262628', { paint: 0.01 }));
  M.def('kaMaroon', () => M.deco('ka-maroon', A.D(64, 128, (g, w, h) => { g.fillStyle = '#522a28'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, w, 1.5); } A.speckle(g, w, h, 7781, 90, 0.1, 2); }, 'ka-maroon'), { alphaTest: 0.1 }));
  M.def('kaPierced', () => M.deco('ka-pierced', A.D(64, 128, (g, w, h) => { g.fillStyle = '#7a4a38'; g.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { g.fillStyle = '#c9a56a'; g.fillRect(i * 16 + 3, j * 16 + 3, 10, 10); g.fillStyle = '#4a2a20'; g.fillRect(i * 16 + 6, j * 16 + 6, 4, 4); } }, 'ka-pierced'), { alphaTest: 0.1 }));
  M.def('kaWinTop', () => M.sheet('ka-win-top', A.win('ka-arch', { head: 'arch', frame: '#d8c8b8', bars: 'cross', ratio: 2.4, f: 6 }), { paint: 0 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'kornilova', F: FR.KA, ids: ['w96579812'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] kornilova/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const tile = { mat: M.kaTile, tu: M.tex['ka-tile'].tu, tv: M.tex['ka-tile'].tv }, gran = { mat: M.kaGranite, tu: M.tex['ka-granite'].tu, tv: M.tex['ka-granite'].tv }, teal = { mat: M.kaTeal, tu: M.tex['ka-teal'].tu, tv: M.tex['ka-teal'].tv };
  const red = { mat: M.kaBrickRed, tu: M.tex['ka-brick-red'].tu, tv: M.tex['ka-brick-red'].tv }, stucco = { mat: M.kaStucco, tu: 3, tv: 3 };
  const bandsFront = [{ y0: 0, y1: 5.3, ...gran }, { y0: 5.3, y1: 19.8, ...tile }, { y0: 19.8, y1: H, ...teal }];
  const trimW = { mat: M.whiteTrim, t: 0.12, proud: 0.04, top: 0.14, bot: 0.16 };
  const win = (x, k) => ({ x, y: SILLS[k], w: 1.05, h: WH[k], glass: M.winW, reveal: M.kaRev, depth: 0.22, trim: trimW });
  const shop = (x) => ({ x, y: 0.45, w: 1.7, h: 3.0, glass: M.winShop, reveal: M.kaRevG, depth: 0.28, trim: { mat: M.kaGranite, t: 0.22, proud: 0.05, top: 0.25, bot: 0 } });
  const cx = 28.56, cz = -0.64, TC = [cx, cz];
  const R16 = polyRing(16, 2.4, cx, cz, -Math.PI / 16);
  h.begin();
  stage('tower', () => {
    // flared stone bowl 5.3 .. 6.4, shaft 6.4 .. 22.8 (five window rows on the three street faces, panel strips on the faces between), cantilever balcony, lantern, dome, belvedere, spike
    loftRings(P, M.kaStuccoL, R16, TC, 5.3, [[0.72, 0], [0.92, 0.5], [1.04, 1.1]]);
    P.cap(M.kaStuccoL, R16.map((p) => [TC[0] + (p[0] - TC[0]) * 0.72, TC[1] + (p[1] - TC[1]) * 0.72]), 5.3, false, 2);
    const rows = [6.9, 10.4, 13.9, 17.4, 20.5], hs = [1.55, 1.55, 1.55, 1.55, 1.4];
    prism(P, R16, 6.4, H, { c: TC, bands: [{ y0: 6.4, y1: 20.4, ...stucco }, { y0: 20.4, y1: H, ...teal }], reveal: M.kaRev, glass: M.winD,
      wins: (i) => (i % 2 === 0 && i <= 4 ? rows.map((y, k) => ({ x: 0.47, y, w: 0.58, h: hs[k], glass: M.winD, reveal: M.kaRev, depth: 0.16, trim: { mat: M.whiteTrim, t: 0.07, proud: 0.03, top: 0.09, bot: 0.1 } })) : []) });
    for (let i = 1; i <= 3; i += 2) faceFrame(P, R16[i], R16[i + 1], TC, (len) => {
      [[6.9, 13.2, i === 1 ? M.kaMaroon : M.kaPierced], [13.9, 20.1, i === 1 ? M.kaPierced : M.kaMaroon]].forEach(([y0, y1, m]) => decal(P, m, len / 2, y0, 0.5, y1 - y0, 0.03, [[0, 0], [1, 0], [1, (y1 - y0) / 1], [0, (y1 - y0) / 1]]));
    });
    P.cap(M.kaZinc, R16, H, true, 2);
    // balcony slab r 3.1 (0.5 thick) with the scrolled iron rail
    loftRings(P, M.kaStuccoL, R16, TC, H - 0.1, [[1.29, 0], [1.29, 0.5]]);
    const slab = R16.map((p) => [TC[0] + (p[0] - TC[0]) * 1.29, TC[1] + (p[1] - TC[1]) * 1.29]);
    P.cap(M.kaZinc, slab, H + 0.4, true, 2); P.cap(M.kaStuccoL, slab, H - 0.1, false, 2);
    for (let i = 0; i < 16; i++) { const a = slab[i], b = slab[(i + 1) % 16], s = 0.97; const ax = TC[0] + (a[0] - TC[0]) * s, az = TC[1] + (a[1] - TC[1]) * s, bx = TC[0] + (b[0] - TC[0]) * s, bz = TC[1] + (b[1] - TC[1]) * s; P.quad(M.railing, [ax, H + 0.4, az], [bx, H + 0.4, bz], [bx, H + 1.45, bz], [ax, H + 1.45, az], null, [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    // octagonal lantern 23.3 .. 25.0 (pale glass walls, three tall windows on the street faces), black eaves ring, zinc dome, belvedere, spike
    const O8 = polyRing(8, 1.5, cx, cz, -Math.PI / 8), y0 = H + 0.5;
    prism(P, O8, y0, 25.0, { c: TC, mat: { mat: M.kaLantern, tu: 3, tv: 3 }, reveal: M.kaBlack, glass: M.winD, wins: (i) => (i <= 2 ? [{ x: 0.5, y: y0 + 0.2, w: 0.8, h: 1.3, glass: M.winD, reveal: M.kaBlack, depth: 0.1 }] : []) });
    loftRings(P, M.kaBlack, O8, TC, 25.0, [[1.2, -0.1], [1.28, 0.05], [1.2, 0.2]]);
    loftRings(P, M.kaDome, O8, TC, 25.2, [[1.12, 0], [1.08, 0.35], [0.86, 0.9], [0.55, 1.3], [0.34, 1.4]]);
    const B8 = polyRing(8, 0.5, cx, cz, -Math.PI / 8);
    prism(P, B8, 26.6, 27.4, { c: TC, mat: { mat: M.kaZinc, tu: 2, tv: 2 }, wins: (i) => (i <= 2 ? [{ x: 0.19, y: 26.75, w: 0.3, h: 0.5, glass: M.kaBlack, depth: 0.08 }] : []), cap: M.kaDome });
    loftRings(P, M.kaDome, B8, TC, 27.4, [[1.1, 0], [0.8, 0.4], [0.4, 0.8], [0.12, 1.0]]);
    P.cyl(M.kaZinc, [cx, 28.4, cz], [cx, 29.0, cz], 0.04, 0.01, 4, false);
  });
  stage('sredny', () => {
    const ps = h.pieces(0, 29.2);
    const xs = [1.9, 4.3, 6.7, 12.4, 14.6, 16.8, 19.0, 21.2, 23.4];
    const wins = []; for (const x of xs) for (let k = 0; k < 5; k++) wins.push(win(x, k));
    for (const x of [14.0, 17.4, 20.8, 24.2]) wins.push(shop(x));
    wins.push({ x: 2.6, y: 0.45, w: 1.7, h: 3.0, glass: M.winShop, reveal: M.kaRevG, depth: 0.28 });
    wins.push({ x: 11.0, y: 0, w: 1.2, h: 2.6, head: 'arch', glass: M.doorDark, reveal: M.kaStucco, depth: 0.25, trim: { mat: M.kaStuccoL, t: 0.35, proud: 0.08, top: 0.4, bot: 0 }, n: 10 });
    wins.push({ x: 27.4, y: 0, w: 1.1, h: 2.4, glass: M.doorDark, reveal: M.kaRevG, depth: 0.22, trim: { mat: M.kaGranite, t: 0.22, proud: 0.06, top: 0.28, bot: 0 } });
    for (const p of ps) h.span(p, -1, 999, bandsFront, wins, { reveal: M.kaRev, glass: M.winW });
    for (const p of ps) { P.box(M.kaStuccoL, p.u0, p.u1, H - 0.5, H, p.d - 0.02, p.d + 0.45, 'bk', 2); P.box(M.kaStuccoL, p.u0, p.u1, 5.3, 5.5, p.d - 0.02, p.d + 0.1, 'bk', 2); }
    P.box(M.kaBlack, 25.6, 28.6, 3.0, 3.12, 0, 1.0, 'b', 1);                                    // the flat iron-and-glass canopy at the corner door
    // vertical strips between the columns: maroon and pierced panels, alternating, two floors each
    [13.5, 15.7, 17.9, 20.1, 22.3].forEach((u, i) => [[6.7, 13.2], [13.9, 20.1]].forEach(([y0, y1], k) => decal(P, (i + k) % 2 ? M.kaPierced : M.kaMaroon, u, y0, 0.78, y1 - y0, 0.03, [[0, 0], [1, 0], [1, (y1 - y0) / 1], [0, (y1 - y0) / 1]])));
    [3.1, 5.5].forEach((u, i) => [[6.7, 13.2], [13.9, 20.1]].forEach(([y0, y1], k) => decal(P, (i + k) % 2 ? M.kaPierced : M.kaMaroon, u, y0, 0.7, y1 - y0, 0.03, [[0, 0], [1, 0], [1, (y1 - y0) / 1], [0, (y1 - y0) / 1]])));
    // the 3-faced oriel at u ~ 9.5 (floors 3-6): pink stucco below, brick-red tile above, on a stone corbel
    const ch = cantedChain(9.5, 1.2, 0.9, 60);
    bay(P, { chain: ch, y0: 8.9, y1: H, bands: [{ y0: 8.9, y1: 14.0, ...stucco }, { y0: 14.0, y1: 19.8, ...red }, { y0: 19.8, y1: H, ...teal }], reveal: M.kaRev, glass: M.winW, soffit: M.kaStuccoL, top: M.kaZinc,
      wins: (i, len) => [9.9, 13.4, 16.9, 20.4].map((y, k) => ({ x: len / 2, y, w: i === 1 ? 0.9 : 0.55, h: [2.0, 2.0, 2.0, 1.6][k], glass: M.winW, reveal: M.kaRev, depth: 0.14 })) });
    P.box(M.kaStuccoL, 7.9, 11.1, 8.3, 8.9, -0.02, 1.2, 'b', 1);
    // miniature dormers of the mansard (every 4.4 m)
    for (const x of [12.4, 16.8, 21.2]) miniDormer(P, { x, y0: H + 0.7, w: 1.2, h: 1.4, z: 0.05, wall: M.kaZinc, roof: M.kaZinc, glass: M.winD });
    // the wavy blue gable at the east end (u 0 .. 11, top 27.0): a solid extruded outline in teal tile, two arched openings (one with a pink ring)
    const crest = [[0, 23.0], [1.0, 24.6], [2.5, 26.4], [4.0, 27.0], [5.5, 25.6], [7.0, 26.8], [8.5, 26.6], [10.0, 25.0], [11.0, 22.8]];
    const pts = [[0, H - 0.6], [11.0, H - 0.6]];
    for (let k = crest.length - 1; k > 0; k--) { const a = crest[k], b = crest[k - 1]; for (let s = 0; s < 4; s++) { const t = s / 4; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * (0.5 - 0.5 * Math.cos(Math.PI * t))]); } }
    pts.push(crest[0]);
    P.extrude(M.kaTeal, shapeOf(pts), -0.4, 0.5, 2, 4);
    for (const u of [3.2, 7.6]) P.quad(M.winWArch, [u - 0.5, 23.8, 0.13], [u + 0.5, 23.8, 0.13], [u + 0.5, 26.2, 0.13], [u - 0.5, 26.2, 0.13], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.kaStuccoL, [2.4, 23.6, 0.1], [4.0, 23.6, 0.1], [4.0, 24.0, 0.1], [2.4, 24.0, 0.1], [0, 0, 1]);
  });
  stage('fourteenth', () => {
    const ps = h.piecesIn(FR.KB, -1, 999, { zTol: 1.7 });
    h.inFrame(FR.KB, () => {
      const xs = []; for (let k = 0; k < 8; k++) xs.push(3.5 + 2.35 * k);
      const wins = []; for (const x of xs) for (let k = 0; k < 5; k++) wins.push(win(x, k));
      for (const x of [4.0, 8.6, 13.2]) wins.push(shop(x));
      wins.push({ x: 1.6, y: 0, w: 1.1, h: 2.4, glass: M.doorDark, reveal: M.kaRevG, depth: 0.22, trim: { mat: M.kaGranite, t: 0.22, proud: 0.06, top: 0.28, bot: 0 } });
      wins.push({ x: 17.0, y: 0, w: 1.2, h: 2.4, glass: M.doorDark, reveal: M.kaRevG, depth: 0.22, trim: { mat: M.kaGranite, t: 0.22, proud: 0.06, top: 0.28, bot: 0 } });
      for (const p of ps) {
        winWall(P, { x0: p.u0, x1: p.u1, z: p.d, bands: bandsFront, wins: wins.filter((w) => w.x - w.w / 2 >= p.u0 - 1e-3 && w.x + w.w / 2 <= p.u1 + 1e-3), reveal: M.kaRev, glass: M.winW, depth: 0.22 });
        P.box(M.kaStuccoL, p.u0, p.u1, H - 0.5, H, p.d - 0.02, p.d + 0.45, 'bk', 2); P.box(M.kaStuccoL, p.u0, p.u1, 5.3, 5.5, p.d - 0.02, p.d + 0.1, 'bk', 2);
      }
      P.box(M.kaBlack, 0.4, 3.4, 3.0, 3.12, 0, 1.0, 'b', 1);
      [4.675, 7.025, 9.375, 11.725, 14.075, 16.425, 18.775].forEach((u, i) => [[6.7, 13.2], [13.9, 20.1]].forEach(([y0, y1], k) => decal(P, (i + k) % 2 ? M.kaPierced : M.kaMaroon, u, y0, 0.75, y1 - y0, 0.03, [[0, 0], [1, 0], [1, (y1 - y0) / 1], [0, (y1 - y0) / 1]])));
      for (const x of [4.0, 8.7, 13.4, 18.1]) miniDormer(P, { x, y0: H + 0.7, w: 1.2, h: 1.4, z: 0.05, wall: M.kaZinc, roof: M.kaZinc, glass: M.winD });
    });
  });
  h.rest({ bands: [{ y0: 0, y1: 5.3, ...gran }, { y0: 5.3, y1: H, mat: M.yardPlaster, tu: 3, tv: 3 }], rows: SILLS.map((y, k) => ({ y, w: 1.05, h: WH[k] })), pitch: 2.4, margin: 1.2, reveal: M.kaRev, glass: M.winW, depth: 0.2 });
  mansard(h, H, H + 3.0, 1.0, M.kaZinc, M.roofSeam); h.chimneys(H + 3.0, 3);
  h.band(H - 0.5, H, 0.45, { front: M.kaStuccoL, top: M.kaStuccoL, under: M.kaStuccoL }, { skip: (e) => e.n[1] > 0.9 || e.n[0] > 0.9 });
  roofRail(h, H + 3.0, { inset: 1.2 });
  h.end();
  h.colliders(H + 4);
  const c = h.centre();
  svc.monuments.push({ id: 'w96579812', name: 'Доходный дом А. П. Корниловой (Средний пр., 56)', x: c.x, z: c.z, h: 28.4 });
  h.spot(svc, 26, 2.0, 0, -1, 10, 'Дом Корниловой: круглая башня с фонарём');
  svc.parts.kornilova = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
