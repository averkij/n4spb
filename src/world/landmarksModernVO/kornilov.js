// landmarksModernVO/kornilov.js - the KORNILOV HOUSE (Доходный дом М. Д. Корнилова, Средний пр. В.О., 45 / 10-я линия, 27; A. F. Baranovsky 1914-15; OSM w108132180 + part w819603149, baked 23.1 m, real cornice 22.5 m).
// Dossier docs/research/modernvo.md section 7 (photos KO45-01 / KO45-02 re-read), frames NA (Sredny front, u 0 .. 39.2) and NB (10th Line, u 0 .. 17.2).
//   off-white glazed tile (#dcd6ca) on six floors, dark brown-grey cast-cement ornament (cornice, corbel, oval garland medallions, shield cartouches, lion-mask frieze), a green + white meander band between floors 2
//   and 3, an emerald tile band under the cornice, two three-faced oriels on the Sredny front, the five-sided corner bay (the pentagon of the OSM outline: five window rows) with the narrower turret and the
//   ribbed grey crown (tip 29.0), and 12 + 7 wavy-topped dormers.  The Sredny wing is 39.2 m, the 10th Line front 17.2 m; the courtyard wing behind is plain.
import { FR } from './frame.js';
import { House } from './house.js';
import { bay, cantedChain } from './bay.js';
import { cornerBay, dormer, prism, loftRings, scaleRing, decal, roofRail } from './elem.js';
import { beltBox, winWall } from './wallx.js';
import { cornice } from './wall.js';
import { onEdge } from './kit.js';

const H = 22.5;
const SILLS = [6.6, 10.1, 13.6, 17.1, 20.4], WH = [1.9, 1.9, 1.9, 1.9, 1.6];

function mats(M) {
  const A = M.A;
  M.def('nTile', () => M.sheet('n-tile', A.tile('n-white', '#dcd6ca', { vary: 0.06, dark: 0.07, glaze: true, mortar: '#c4bfb3' }), { paint: 0.03 }));
  M.def('nTileG', () => M.sheet('n-tile-g', A.tile('n-ground', '#d3cfc1', { vary: 0.06, dark: 0.07, glaze: true, mortar: '#bdb8ab' }), { paint: 0.03 }));
  M.def('nGreen', () => M.sheet('n-green', A.tile('n-green', '#4a8a62', { vary: 0.16, dark: 0.1, glaze: true, mortar: '#6a9a80', tw: 0.19, th: 0.13, rows: 8 }), { paint: 0.03 }));
  M.def('nMeander', () => M.sheet('n-meander', A.D(256, 64, (g, w, h) => {
    g.fillStyle = '#e1dccf'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4a8a62'; g.lineWidth = 7; g.beginPath();
    const s = h / 2; for (let x = 0; x < w; x += s * 2) { g.moveTo(x, h - 8); g.lineTo(x, 8); g.lineTo(x + s, 8); g.lineTo(x + s, h - 8); g.lineTo(x + s * 2, h - 8); }
    g.stroke();
  }, 'n-meander'), { paint: 0.02 }));
  M.def('nCement', () => M.flat('n-cement', '#70685f', { paint: 0.04 }));
  M.def('nCementL', () => M.flat('n-cement-l', '#8b857b', { paint: 0.04 }));
  M.def('nRev', () => M.flat('n-rev', '#cfcabc', { paint: 0.03 }));
  M.def('nZinc', () => M.flat('n-zinc', '#8d9399', { paint: 0.05 }));
  M.def('nRoofTop', () => M.flat('n-roof', '#7d8388', { paint: 0.05 }));
  M.def('nCrown', () => M.flat('n-crown', '#77746f', { paint: 0.05 }));
  M.def('nEntry', () => M.deco('n-entry', A.D(128, 40, (g, w, h) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2c'; g.font = `700 ${h * 0.7 | 0}px ${A.FONTS.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ВХОД', w / 2, h / 2 + 1); }, 'n-entry'), { alphaTest: 0.1 }));
  const dark = '#5a524a';
  M.def('nMedal', () => M.deco('n-medal', A.D(64, 96, (g, w, h) => {                  // oval garland medallion 0.7 x 1.1 m: wreath ring and a dark shield face
    g.fillStyle = '#6c655c'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.48, h * 0.48, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#827b70'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.34, h * 0.36, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = dark; g.beginPath(); g.moveTo(w * 0.3, h * 0.3); g.lineTo(w * 0.7, h * 0.3); g.lineTo(w * 0.7, h * 0.58); g.lineTo(w * 0.5, h * 0.74); g.lineTo(w * 0.3, h * 0.58); g.closePath(); g.fill();
    g.strokeStyle = '#58514a'; g.lineWidth = 2; for (let a = 0; a < 6.28; a += 0.45) { g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * w * 0.38, h / 2 + Math.sin(a) * h * 0.38); g.lineTo(w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48); g.stroke(); }
  }, 'n-medal'), { alphaTest: 0.3 }));
  M.def('nShield', () => M.deco('n-shield', A.D(64, 90, (g, w, h) => {                 // shield cartouche 0.9 x 1.3 m
    g.fillStyle = '#6c655c'; g.beginPath(); g.moveTo(4, 8); g.quadraticCurveTo(w / 2, -2, w - 4, 8); g.lineTo(w - 4, h * 0.55); g.quadraticCurveTo(w - 8, h * 0.82, w / 2, h - 3); g.quadraticCurveTo(8, h * 0.82, 4, h * 0.55); g.closePath(); g.fill();
    g.fillStyle = '#857e73'; g.beginPath(); g.moveTo(11, 16); g.lineTo(w - 11, 16); g.lineTo(w - 11, h * 0.52); g.quadraticCurveTo(w - 14, h * 0.74, w / 2, h - 14); g.quadraticCurveTo(14, h * 0.74, 11, h * 0.52); g.closePath(); g.fill();
    g.fillStyle = '#6a635a'; g.fillRect(w / 2 - 3, 20, 6, h * 0.5); g.fillRect(16, h * 0.28, w - 32, 5);
  }, 'n-shield'), { alphaTest: 0.3 }));
  M.def('nLion', () => M.deco('n-lion', A.D(512, 48, (g, w, h) => {                    // swags between four lion masks over the three central windows of floor 6 (9 x 0.5 m)
    g.strokeStyle = '#6c655c'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { const x0 = 64 + i * 128, x1 = x0 + 128; g.beginPath(); g.moveTo(x0, 8); g.quadraticCurveTo((x0 + x1) / 2, h + 6, x1, 8); g.stroke(); }
    for (let i = 0; i < 5; i++) { g.fillStyle = '#6c655c'; g.beginPath(); g.arc(64 + i * 128, 18, 14, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4e4842'; g.fillRect(64 + i * 128 - 6, 14, 4, 5); g.fillRect(64 + i * 128 + 2, 14, 4, 5); }
  }, 'n-lion'), { alphaTest: 0.3 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'kornilov', F: FR.NA, ids: ['w108132180'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] kornilov/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const tile = { mat: M.nTile, tu: M.tex['n-tile'].tu, tv: M.tex['n-tile'].tv };
  const tileG = { mat: M.nTileG, tu: M.tex['n-tile-g'].tu, tv: M.tex['n-tile-g'].tv };
  const green = { mat: M.nGreen, tu: M.tex['n-green'].tu, tv: M.tex['n-green'].tv };
  const meander = { mat: M.nMeander, tu: 2, tv: 0.55 };
  const bandsFront = [{ y0: 0, y1: 5.0, ...tileG }, { y0: 5.0, y1: 8.8, ...tile }, { y0: 8.8, y1: 9.4, ...meander }, { y0: 9.4, y1: 20.8, ...tile }, { y0: 20.8, y1: H, ...green }];
  const bandsPlain = [{ y0: 0, y1: 5.0, ...tileG }, { y0: 5.0, y1: H, ...tile }];
  const win = (x, k) => ({ x, y: SILLS[k], w: 1.1, h: WH[k], glass: M.winD, reveal: M.nRev, depth: 0.22 });
  const shop = (x) => ({ x, y: 0.55, w: 2.1, h: 3.3, glass: M.winShop, reveal: M.nCementL, depth: 0.25 });
  const rowWins = (xs, shops) => { const w = []; for (const x of xs) for (let k = 0; k < 5; k++) w.push(win(x, k)); for (const x of shops || []) w.push(shop(x)); return w; };
  const bayEs = new Set();
  h.begin();

  // ---- the corner bay (the five edges of the outline pentagon) with pier, corbel, shaft, turret and crown
  let bayInfo = null;
  stage('bay', () => {
    const es = h.near(-1.25, 0.5, 2.7);
    if (es.length < 4) throw new Error('bay edges not found: ' + es.length);
    es.sort((a, b) => (a.i - b.i)); for (const e of es) bayEs.add(e);
    const rowsB = SILLS.map((y, k) => ({ y, h: k < 4 ? 1.85 : 1.6 }));
    bayInfo = cornerBay(h, {
      edges: es, y0: 5.0, y1: 5.9, top: H, flare: 1.14,
      mats: { pier: tileG, corbel: M.nCement, shaft: tile, cap: M.nZinc, shaftBands: [{ y0: 5.9, y1: 8.8, ...tile }, { y0: 8.8, y1: 9.4, ...meander }, { y0: 9.4, y1: 20.8, ...tile }, { y0: 20.8, y1: H, ...green }] },
      reveal: M.nRev, glass: M.winD,
      wins: (i, len) => (i >= 1 && i <= 3 ? rowsB.map((r) => ({ x: len / 2, y: r.y, w: 0.6, h: r.h, glass: M.winD, reveal: M.nRev, depth: 0.14 })) : []),
      pierWins: (i, len) => (i === 2 ? [{ x: len / 2, y: 0, w: 1.15, h: 2.3, glass: M.doorDark, reveal: M.nCement, depth: 0.2, trim: { mat: M.nCement, t: 0.2, proud: 0.08, top: 0.3, bot: 0 } }] : []),
    });
    const { shaft, c } = bayInfo;
    // medallions on the bay faces (y 8.7 .. 10.0), the meander band round the shaft (y 8.8 .. 9.4), the green band under the cornice, belts
    // the entrance sign over the door (face 2 of the pier): a plate 0.9 x 0.3 at 2.7 m
    const e2 = es[2];
    onEdge(P, e2, (len) => { decal(P, M.nEntry, len / 2, 2.75, 0.9, 0.3, 0.1); });
    // the turret above the roof (five faces, r ~ 0.62 of the bay): two rows of slits, green foot band, then the crown
    const T = scaleRing(shaft, c, 0.9, false);
    P.cap(M.nZinc, T, H + 0.0, true, 2);
    prism(P, T, H, 26.0, { c, bands: [{ y0: H, y1: H + 0.9, ...green }, { y0: H + 0.9, y1: 26.0, ...tile }],
      wins: (i, len) => (i >= 1 && i <= 3 ? [23.3, 24.9].map((y) => ({ x: len / 2, y, w: 0.45, h: 1.3, glass: M.winD, reveal: M.nRev, depth: 0.12 })) : []), reveal: M.nRev, glass: M.winD, cap: M.nCrown });
    loftRings(P, M.nCrown, T, c, 26.0, [[1.02, 0], [1.14, 0.3], [1.08, 0.8], [0.88, 1.4], [0.62, 2.0], [0.36, 2.5], [0.14, 2.85], [0, 3.0]]);
  });

  // ---- the Sredny front: oriel piers (the OSM jogs) and the wall between
  stage('front', () => {
    const jogs = h.sel((e) => Math.min(e.a[1], e.b[1]) > -0.06 && Math.max(e.a[1], e.b[1]) > 0.5 && Math.min(e.a[0], e.b[0]) > 5 && Math.max(e.a[0], e.b[0]) < 36);
    for (const e of jogs) onEdge(P, e, (len) => winWall(P, { x0: 0, x1: len, z: 0, bands: [{ y0: 0, y1: 8.8, ...tileG }], wins: [] }));
    const ps = h.pieces(0, 39.2);
    const xs = [2.1, 4.5, 6.9, 12.9, 15.2, 17.5, 19.8, 22.1, 28.6, 30.9, 33.2, 35.5, 37.8];
    const shops = [3.0, 6.3, 12.9, 16.2, 19.5, 22.8, 29.0, 31.7, 36.7];
    const wins = rowWins(xs, shops);
    wins.push({ x: 34.3, y: 0, w: 1.3, h: 2.6, glass: M.doorDark, reveal: M.nCement, depth: 0.25, hood: { mat: M.nCement, w: 1.9, h: 0.5 }, trim: { mat: M.nCement, t: 0.18, proud: 0.08, top: 0.22, bot: 0 } });
    for (const p of ps) h.span(p, -1, 999, bandsFront, wins, { reveal: M.nRev, glass: M.winD });
    // the two oriels (floors 3-6) over the porch piers
    for (const cx of [9.7, 25.4]) {
      const ch = cantedChain(cx, 1.4, 1.1, 60);
      const rows = SILLS.slice(1).map((y, k) => ({ y, h: WH[k + 1] }));
      bay(P, { chain: ch, y0: 8.8, y1: H, bands: [{ y0: 8.8, y1: 9.4, ...meander }, { y0: 9.4, y1: 20.8, ...tile }, { y0: 20.8, y1: H, ...green }], reveal: M.nRev, glass: M.winD, soffit: M.nCement, top: M.nZinc,
        wins: (i, len) => rows.map((r) => ({ x: len / 2, y: r.y, w: i === 1 ? 0.9 : 0.55, h: r.h, glass: M.winD, reveal: M.nRev, depth: 0.14 })) });
      P.box(M.nCement, cx - 1.6, cx + 1.6, 8.2, 8.8, -0.02, 1.2, 'b', 1);                               // the cement corbel under the oriel
      const by = H + 0.05;                                                                                // the small timber balcony on top: a low balustrade round the three faces
      for (let i = 0; i + 1 < ch.length; i++) { const a = ch[i], b = ch[i + 1]; P.quad(M.railing, [a[0], by, a[1]], [b[0], by, b[1]], [b[0], by + 0.9, b[1]], [a[0], by + 0.9, a[1]], null, [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    }
    // medallions on the Sredny front under the oriels (y 8.7 .. 10.0), shield cartouches (floors 3-4), the lion-mask frieze over floor 6
    for (const u of [9.7, 25.4]) decal(P, M.nMedal, u, 8.75, 0.7, 1.1, 1.2);
    for (const u of [16.35, 18.65, 20.95]) decal(P, M.nShield, u, 15.4, 0.9, 1.3, 0.04);
    decal(P, M.nLion, 17.5, 22.0, 9.0, 0.5, 0.04);
    // belts: the dark cement cornice, a thin sill belt at each floor line of the oriels is skipped
    // dormers (12): pitch 3.1 from u 2.2, on the cornice line
    for (let k = 0; k < 12; k++) {
      const x = 2.2 + 3.1 * k, p = ps.find((q) => x - 0.8 >= q.u0 && x + 0.8 <= q.u1); if (!p) continue;
      dormer(P, { x, y0: H, w: 1.6, h: 2.8, hw: 1.9, z: p.d, wall: tile, edge: M.nCement, lid: M.nCementL, win: { w: 0.9, h: 1.4, y: 0.35, glass: M.winD, reveal: M.nRev } });
    }
    for (const p of ps) {
      P.box(M.nCement, p.u0, p.u1, H - 0.6, H, p.d - 0.05, p.d + 0.5, 'bk', 2);                         // the bold dark cornice
      P.box(M.nCementL, p.u0, p.u1, H - 0.8, H - 0.6, p.d - 0.05, p.d + 0.3, 'bk', 2);
    }
  });
  // ---- the 10th Line front (frame NB): windows by absolute u, the jog wall plain, 7 dormers
  stage('tenth', () => {
    const ps = h.piecesIn(FR.NB, -1, 999, { zTol: 1.7 });
    h.inFrame(FR.NB, () => {
      const xs = [1.6, 3.9, 9.4, 11.8, 14.2, 16.5], shops = [2.7, 12.4];
      const wins = rowWins(xs, []); for (const x of shops) wins.push(shop(x));
      for (const p of ps) {
        winWall(P, { x0: p.u0, x1: p.u1, z: p.d, bands: bandsFront, wins: wins.filter((w) => w.x - w.w / 2 >= p.u0 - 1e-3 && w.x + w.w / 2 <= p.u1 + 1e-3), reveal: M.nRev, glass: M.winD, depth: 0.22 });
        P.box(M.nCement, p.u0, p.u1, H - 0.6, H, p.d - 0.05, p.d + 0.5, 'bk', 2);
      }
      for (let k = 0; k < 7; k++) {
        const x = 1.6 + 2.6 * k, p = ps.find((q) => x - 0.8 >= q.u0 && x + 0.8 <= q.u1); if (!p) continue;
        dormer(P, { x, y0: H, w: 1.5, h: 2.8, hw: 1.9, z: p.d, wall: tile, edge: M.nCement, lid: M.nCementL, win: { w: 0.9, h: 1.4, y: 0.35, glass: M.winD, reveal: M.nRev } });
      }
      decal(P, M.nMedal, 12.0, 8.75, 0.7, 1.1, 0.04);
    });
  });
  // ---- everything else: plain tile walls with window rows; cornice round the outline; roof deck
  h.rest({ bands: bandsPlain, rows: SILLS.map((y, k) => ({ y, w: 1.1, h: WH[k] })), pitch: 2.4, margin: 1.3, reveal: M.nRev, glass: M.winD, depth: 0.2 });
  h.band(H - 0.8, H, 0.4, { front: M.nCement, top: M.nCementL, under: M.nCement }, { skip: (e) => bayEs.has(e) });
  h.roof(H - 0.02, M.nRoofTop); h.chimneys(H, 4);
  roofRail(h, H, { skip: (e) => bayEs.has(e) });
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'w108132180', name: 'Доходный дом М. Д. Корнилова (Средний пр., 45)', x: c.x, z: c.z, h: 29 });
  h.spot(svc, 20, 6.4, 0, -1, 8, 'Дом Корнилова: угловой эркер и мансардный венец');
  svc.parts.kornilov = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
