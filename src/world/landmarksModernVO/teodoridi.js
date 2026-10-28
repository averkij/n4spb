// landmarksModernVO/teodoridi.js - the TEODORIDI HOUSE (Дом меблированных комнат Ф. Ф. Теодориди, Малый пр. В.О., 38-40 / 14-я линия, 73; I. P. Volodikhin 1903-05; today Mining University dormitory no. 1; OSM r1541864 with a
// courtyard hole, baked 19.8 m, real cornice 22.4 m).  Dossier docs/research/modernvo.md section 9 (critic C8; photos TE-01 / TE-04 / TE-07 / TE-09 re-read), frames TM (Maly front u 0 .. 118.7, the rounded corner
// at u = 118.7) and TB (14th Line u 0 .. 46.1).
//   the biggest Art Nouveau front of the island: relief brick (#c9bb8e) with cream cast-cement trim over a cast-stone base on a pink granite plinth; five window rows, belts at floors 3 and 5, fluted pilasters,
//   leaf cartouches under the sills; the ROUNDED CORNER (R 3.0) with three curved ribbon bows (floors 3-5); the attic neck with the round clock-like window; the bullet-shaped slotted zinc LANTERN (10 tall slots,
//   a band of slits, a ribbed ogive top at 30.8); the central gable on Maly at u ~ 68 (lunette window, the monogram «ФТ» in a laurel wreath, three stacked iron balconies with tulip rails, a wavy crown with
//   three flowers); the yard gate on the 14th Line (u ~ 22).  Nothing is enterable (a dormitory).
import { FR } from './frame.js';
import { House } from './house.js';
import { prism, loftRings, decal, roofRail, balcony, faceFrame } from './elem.js';
import { polyRing } from './bay.js';
import { winWall, loft } from './wallx.js';
import { shapeOf } from './geo.js';

const H = 22.4;
const SILL = [5.9, 9.4, 12.9, 16.4, 19.9], WH = [2.0, 2.0, 2.0, 2.0, 1.6];
const CC = [118.1, -3.0], RC = 3.03;

function mats(M) {
  const A = M.A;
  M.def('tBrick', () => M.sheet('t-brick', A.tile('t-relief', '#c9bb8e', { vary: 0.09, dark: 0.08, glaze: false, mortar: '#b5a87c', tw: 0.2, th: 0.07, rows: 14, accent: [['#d6c9a0', 0.1], ['#b8aa7c', 0.1]] }), { paint: 0.03 }));
  M.def('tStone', () => M.sheet('t-stone', A.plaster('t-stone', '#c6b996', { stain: 0.03 }), { paint: 0.03 }));
  M.def('tPlinth', () => M.flat('t-plinth', '#9b7a70', { paint: 0.04 }));
  M.def('tCream', () => M.flat('t-cream', '#e6dcb4', { paint: 0.03 }));
  M.def('tCreamTex', () => M.sheet('t-cream-tex', A.plaster('t-cream', '#e4d9b2', { stain: 0.025 }), { paint: 0.03 }));
  M.def('tRev', () => M.flat('t-rev', '#b4a77c', { paint: 0.03 }));
  M.def('tZinc', () => M.flat('t-zinc', '#7a869a', { paint: 0.05 }));
  M.def('tZincD', () => M.flat('t-zinc-d', '#32353c', { paint: 0.01 }));
  M.def('tRoof', () => M.flat('t-roof', '#8f979c', { paint: 0.05 }));
  M.def('tGate', () => M.flat('t-gate', '#2a2a2d', { paint: 0.01 }));
  M.def('tBow', () => M.sheet('t-bow', A.win('t-bow', { frame: '#4a3a31', bars: 'cross', ratio: 0.8, f: 5 }), { paint: 0 }));
  M.def('tCart', () => M.deco('t-cart', A.D(64, 64, (g) => { g.fillStyle = '#e6dcb4'; g.strokeStyle = '#a89c70'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 40); g.quadraticCurveTo(10, 14, 32, 10); g.quadraticCurveTo(54, 14, 56, 40); g.quadraticCurveTo(32, 54, 8, 40); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(32, 30, 8, 0, Math.PI * 2); g.stroke(); }, 't-cart'), { alphaTest: 0.2 }));
  M.def('tMono', () => M.deco('t-mono', A.D(96, 96, (g, w, h) => {
    g.strokeStyle = '#a89c70'; g.fillStyle = '#e6dcb4'; g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, h / 2, 40, 36, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = '#7a8a50'; g.lineWidth = 5; g.beginPath(); g.arc(w / 2, h / 2, 33, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
    g.fillStyle = '#6a6250'; g.font = `700 40px ${A.FONTS.serif}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ФТ', w / 2, h / 2 + 2);
  }, 't-mono'), { alphaTest: 0.2 }));
  M.def('tFlower', () => M.deco('t-flower', A.D(48, 48, (g) => { g.fillStyle = '#e6dcb4'; g.strokeStyle = '#a89c70'; g.lineWidth = 2; for (let a = 0; a < 6.28; a += 1.05) { g.beginPath(); g.ellipse(24 + Math.cos(a) * 11, 22 + Math.sin(a) * 11, 8, 5, a, 0, Math.PI * 2); g.fill(); g.stroke(); } g.beginPath(); g.arc(24, 22, 6, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillRect(22, 30, 4, 16); }, 't-flower'), { alphaTest: 0.2 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'teodoridi', F: FR.TM, ids: ['r1541864'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] teodoridi/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const brick = { mat: M.tBrick, tu: M.tex['t-brick'].tu, tv: M.tex['t-brick'].tv }, stone = { mat: M.tStone, tu: 3, tv: 3 };
  const bands = [{ y0: 0, y1: 0.8, mat: M.tPlinth, tu: 2, tv: 1 }, { y0: 0.8, y1: 4.6, ...stone }, { y0: 4.6, y1: H, ...brick }];
  const trim = { mat: M.tCream, t: 0.12, proud: 0.04, top: 0.16, bot: 0.18 };
  const win = (x, k, head) => ({ x, y: SILL[k], w: 1.1, h: WH[k], head, glass: head === 'arch' ? M.winDArch : M.winD, reveal: M.tRev, depth: 0.24, trim });
  const shop = (x) => ({ x, y: 0.8, w: 2.0, h: 2.8, glass: M.winShop, reveal: M.tRev, depth: 0.3, trim: { mat: M.tStone, t: 0.2, proud: 0.05, top: 0.25, bot: 0 } });
  const frontExtras = (p, cornice = true) => {
    for (const y of [8.9, 15.9]) P.box(M.tCream, p.u0, p.u1, y, y + 0.4, p.d - 0.02, p.d + 0.2, 'bk', 2);                    // belts at floors 3 and 5
    if (cornice) P.box(M.tCream, p.u0, p.u1, H - 0.6, H, p.d - 0.02, p.d + 0.6, 'bk', 2);
    P.box(M.tCream, p.u0, p.u1, 4.5, 4.8, p.d - 0.02, p.d + 0.15, 'bk', 2); P.box(M.tCream, p.u0, p.u1, 0.8, 1.0, p.d - 0.02, p.d + 0.1, 'bk', 2);
  };
  h.begin();
  stage('corner', () => {
    h.near(119.9, -1.0, 2.2);                                                  // the 3.2 m chamfer of the outline is replaced by the round corner below (marked used: no wall)
    const arc = []; for (let i = 0; i <= 4; i++) { const th = i * Math.PI / 8; arc.push([CC[0] + RC * Math.sin(th), CC[1] + RC * Math.cos(th)]); }
    prism(P, arc, 0, H, { c: CC, closed: false, bands, reveal: M.tRev, glass: M.winD,
      wins: (i, len) => [5.9, 19.9].map((y, k) => ({ x: len / 2, y, w: 0.75, h: k ? 1.6 : 2.0, glass: M.winD, reveal: M.tRev, depth: 0.16, trim: { mat: M.tCream, t: 0.07, proud: 0.03, top: 0.1, bot: 0.12 } })).concat(i === 2 ? [{ x: len / 2, y: 0, w: 1.4, h: 2.6, glass: M.doorDark, reveal: M.tStone, depth: 0.22, trim: { mat: M.tStone, t: 0.2, proud: 0.06, top: 0.25, bot: 0 } }] : []) });
    P.cap(M.tRoof, [...arc, CC], H, true, 3);
    // the three ribbon bows (floors 3-5): glass ribbons 0.55 proud on cream belts
    const bow = (y0, y1) => {
      const gl = arc.map((q) => [CC[0] + (q[0] - CC[0]) * 1.165, y0, CC[1] + (q[1] - CC[1]) * 1.165]), gu = gl.map((q) => [q[0], y1, q[2]]);
      loft(P, M.tBow, [gl, gu], { ax: CC, open: true, uRep: 5 });
      const be = arc.map((q) => [CC[0] + (q[0] - CC[0]) * 1.19, 0, CC[1] + (q[1] - CC[1]) * 1.19]);
      loft(P, M.tCream, [be.map((q) => [q[0], y0 - 0.32, q[2]]), be.map((q) => [q[0], y0, q[2]])], { ax: CC, open: true });
      loft(P, M.tCream, [be.map((q) => [q[0], y1, q[2]]), be.map((q) => [q[0], y1 + 0.28, q[2]])], { ax: CC, open: true });
      const ring2 = [...be.map((q) => [q[0], q[2]]), CC];
      P.cap(M.tCream, ring2, y0 - 0.32, false, 2); P.cap(M.tCream, ring2, y0, true, 2); P.cap(M.tCream, ring2, y1, false, 2); P.cap(M.tCream, ring2, y1 + 0.28, true, 2);
    };
    bow(9.4, 11.4); bow(12.9, 14.9); bow(16.4, 18.4);
    // the attic neck 22.4 .. 25.4 with the round clock-like window, the bullet lantern
    const cx = 119.0, cz = -1.9, N = polyRing(4, 2.5, cx, cz, 0);
    prism(P, N, H, 25.4, { c: [cx, cz], mat: { mat: M.tBrick, tu: brick.tu, tv: brick.tv }, cap: M.tCreamTex, reveal: M.tRev, glass: M.winRound, wins: (i, len) => (i === 0 ? [{ x: len / 2, y: 23.2, w: 1.0, h: 1.0, head: 'round', glass: M.winRound, reveal: M.tRev, depth: 0.15, trim: { mat: M.tCream, t: 0.12, proud: 0.04 } }] : []) });
    const cg = [cx, cz], L10 = polyRing(10, 1.7, cx, cz, 0);
    P.cap(M.tZinc, N.map((q) => [cg[0] + (q[0] - cg[0]) * 0.6, cg[1] + (q[1] - cg[1]) * 0.6]), 25.4, false, 2);
    // review 2026-10-09: the real top is a pointed ogive (photos TE-01 / TE-04: a bullet); the first build ended in a blunt dome, so the slots are shortened and the ogive lengthened (tip stays 30.8, dossier C 8)
    prism(P, L10, 25.4, 27.4, { c: cg, mat: { mat: M.tZinc, tu: 3, tv: 3 }, reveal: M.tZincD, glass: M.tZincD, wins: (i, len) => [{ x: len / 2, y: 25.6, w: 0.3, h: 1.6, glass: M.tZincD, reveal: M.tZincD, depth: 0.12 }] });
    prism(P, L10, 27.4, 28.4, { c: cg, mat: { mat: M.tZinc, tu: 3, tv: 3 }, reveal: M.tZincD, glass: M.tZincD, wins: (i, len) => (i < 9 ? [{ x: len / 2, y: 27.55, w: 0.3, h: 0.7, head: 'arch', glass: M.tZincD, reveal: M.tZincD, depth: 0.1 }] : []) });
    loftRings(P, M.tZinc, L10, cg, 28.4, [[1.0, 0], [0.95, 0.5], [0.82, 1.0], [0.62, 1.5], [0.4, 1.95], [0.18, 2.25], [0, 2.4]]);
  });
  stage('maly', () => {
    const ps = h.pieces(0, 118.7, { slope: 0.8, zTol: 1.8 });
    const wins = [];
    for (let k = 0; k < 49; k++) {
      const x = 1.2 + 2.4 * k; if (x > 118.2) break;
      if (x > 62.6 && x < 73.4) continue;
      for (let j = 0; j < 5; j++) wins.push(win(x, j, j === 3 && x > 99 ? 'arch' : undefined));
      if (x < 118 && (k % 2 === 0)) for (const y of [8.35, 11.85]) decal(P, M.tCart, x + 1.2, y - 0.1, 0.55, 0.55, 0.06);
    }
    for (let x = 3.0; x < 118; x += 4.8) { if ((x > 62.6 && x < 73.4) || Math.abs(x - 105) < 2.4 || Math.abs(x - 62) < 2.4) continue; wins.push(shop(x)); }
    for (const x of [105, 62]) wins.push({ x, y: 0, w: 1.3, h: 2.6, head: 'arch', glass: M.doorDark, reveal: M.tStone, depth: 0.25, trim: { mat: M.tStone, t: 0.25, proud: 0.08, top: 0.3, bot: 0 }, n: 10 });
    // the central gable axis (u 63 .. 73): the floor-2 arched window, three French windows with balconies, the lunette
    wins.push({ x: 68, y: 5.4, w: 3.0, h: 2.6, head: 'seg', rise: 0.55, glass: M.winD, reveal: M.tRev, depth: 0.26, trim });
    for (const [k, w] of [[1, 3.2], [2, 2.2], [3, 2.2]]) wins.push({ x: 68, y: SILL[k] - 0.2, w, h: 2.6, head: 'arch', glass: M.winDArch, reveal: M.tRev, depth: 0.26, trim });
    wins.push({ x: 68, y: 19.9, w: 4.4, h: 3.0, head: 'arch', glass: M.winDArch, reveal: M.tRev, depth: 0.3, trim: { mat: M.tCream, t: 0.25, proud: 0.06, top: 0.25, bot: 0.2 }, n: 14 });
    for (const x of [64.2, 71.8]) for (const k of [1, 2, 3, 4]) wins.push({ x, y: SILL[k], w: 1.1, h: WH[k], glass: M.winD, reveal: M.tRev, depth: 0.24, trim });
    for (const p of ps) { h.span(p, -1, 999, bands, wins, { reveal: M.tRev, glass: M.winD }); frontExtras(p, true); }
    balcony(P, M, { x: 68, y: 9.2, w: 4.4, depth: 1.0 }); balcony(P, M, { x: 68, y: 12.7, w: 2.6, depth: 0.9 }); balcony(P, M, { x: 68, y: 16.2, w: 2.6, depth: 0.9 });
    for (const x of [65.6, 70.4]) P.box(M.tCream, x - 0.28, x + 0.28, 9.0, 19.8, -0.02, 0.2, 'bk', 1);                                  // fluted pilasters of the axis
    decal(P, M.tMono, 68, 17.9, 1.3, 1.2, 0.08);
    // the wavy crown (u 62.8 .. 73.2, apex 27.3) with three flowers, and the two side wings with curved parapets
    const hump = (u0, u1, y0, y1, n = 16) => { const pts = [[u0, y0], [u1, y0]]; for (let k = n; k >= 0; k--) { const t = k / n, u = u0 + (u1 - u0) * t; pts.push([u, y0 + (y1 - y0) * Math.pow(Math.sin(Math.PI * t), 0.7)]); } P.extrude(M.tBrick, shapeOf(pts), -0.4, 0.5, 2, 4); };
    hump(62.8, 73.2, H - 0.4, 27.3); hump(59.5, 62.8, H - 0.4, 24.6); hump(73.2, 76.5, H - 0.4, 24.6);
    for (const x of [66.2, 68, 69.8]) decal(P, M.tFlower, x, 24.6, 0.9, 0.9, 0.12);
  });
  stage('fourteenth', () => {
    const ps = h.piecesIn(FR.TB, -1, 999, { zTol: 1.8, slope: 1.0 });
    h.inFrame(FR.TB, () => {
      const wins = [];
      for (let k = 0; k < 19; k++) { const x = 3.4 + 2.4 * k; if (x > 45) break; if (Math.abs(x - 22) < 2.4) continue; for (let j = 0; j < 5; j++) wins.push(win(x, j)); }
      for (let x = 3.2; x < 45; x += 4.4) { if (Math.abs(x - 22) < 3) continue; wins.push(shop(x)); }
      wins.push({ x: 22, y: 0, w: 4.2, h: 4.0, head: 'arch', glass: M.tGate, reveal: M.tStone, depth: 0.4, trim: { mat: M.tStone, t: 0.3, proud: 0.08, top: 0.3, bot: 0 }, n: 12 });
      for (let j = 0; j < 5; j++) wins.push(win(22, j));
      for (const p of ps) { h.span(p, -1, 999, bands, wins, { reveal: M.tRev, glass: M.winD }); frontExtras(p, false); }
    });
  });
  h.rest({ bands, rows: SILL.map((y, k) => ({ y, w: 1.1, h: WH[k] })), pitch: 2.4, margin: 1.2, reveal: M.tRev, glass: M.winD, depth: 0.2 });
  h.band(H - 0.6, H, 0.6, { front: M.tCream, top: M.tCream, under: M.tCream }, { skip: (e) => e.n[1] > 0.9 });
  h.roof(H - 0.02, M.tRoof); h.chimneys(H, 9);
  roofRail(h, H, { skip: (e) => e.n[1] > 0.9 });
  h.end();
  h.colliders(H + 1);
  for (let i = 0; i < 4; i++) { const a0 = i * Math.PI / 8, a1 = (i + 1) * Math.PI / 8; h.wallBetween(CC[0] + RC * Math.sin(a0), CC[1] + RC * Math.cos(a0), CC[0] + RC * Math.sin(a1), CC[1] + RC * Math.cos(a1), H + 1, 0.5); }   // the round corner (R 3.0) is bigger than the OSM chamfer
  const c = h.centre();
  svc.monuments.push({ id: 'r1541864', name: 'Дом меблированных комнат Ф. Ф. Теодориди (Малый пр., 38-40)', x: c.x, z: c.z, h: 30.8 });
  h.spot(svc, 70, 4.0, 0, -1, 10, 'Дом Теодориди: центральный фронтон с балконами');
  h.spot(svc, 112, 4.0, 0.4, -1, 8, 'Дом Теодориди: закруглённый угол и фонарь');
  svc.parts.teodoridi = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
