// landmarksModernVO/erem82.js - the EREMEEVA HOUSE WITH THE SPIRE (Доходный дом А. А. Еремеевой, «дом со шпилем», Большой пр. В.О., 82; M. F. Eremeev 1902-05, red brick neo-Gothic, regional monument; OSM r15473499, baked 19.8 m,
// real cornice 24.0 m).  Dossier docs/research/modernvo.md section 2 (critic C6 / C13; photos ER-01 / ER-02 re-read), frames EA (the avenue front u 0 .. 65.7, tower at the right end) and EW (the west end wall, 24.7 m).
//   unplastered brick (#a85438) on a dark-brick plinth storey (3.3 m) and five window rows (rectangular on floor 1, a row of narrow pointed lancets on floor 2, flat brick arches above); stepped brick belts,
//   a dentil table under the eaves (24.0); 35 pinnacles with pyramid caps (rust / pale zinc, instanced); two three-storey rectangular bays with a lancet and a floor-5 balcony; a pointed gable beside the tower,
//   a stepped pinnacled gable cluster at the east end and a stepped gable with a round window on the end wall; blind pointed arches with rosettes; the TOWER on the corner chamfer: a three-faced three-tier oriel
//   (paired lancets in the two lower tiers, one round-headed window in the third) on a stepped corbel, a dentil table, the round turret (19.8 .. 24.0) and the slim tent spire (apex 31.0).
//   The yard gateway at u ~ 30 and the passage on the end wall are closed dark leaves; the Lenin plaque of the dossier is not drawn (political, lead's decision).
import { FR } from './frame.js';
import { House } from './house.js';
import { bay } from './bay.js';
import { polyRing } from './bay.js';
import { prism, loftRings, decal, roofRail, balcony, pinnacles } from './elem.js';
import { winWall } from './wallx.js';
import { shapeOf } from './geo.js';

const H = 24.0;
const SILL = [3.7, 7.6, 11.7, 15.8, 19.6], WH = [1.75, 2.2, 2.0, 2.0, 2.0];

function mats(M) {
  const A = M.A;
  M.def('eBrick', () => M.sheet('e-brick', A.tile('e-brick', '#a85438', { vary: 0.13, dark: 0.1, glaze: false, mortar: '#c9a98c', cols: 6, tw: 0.25, th: 0.065, rows: 16, accent: [['#8f4630', 0.1], ['#b9633f', 0.1]] }), { paint: 0.03 }));
  M.def('ePlinth', () => M.sheet('e-plinth', A.tile('e-plinth', '#5f3a30', { vary: 0.14, dark: 0.12, mortar: '#7a5a4a', cols: 6, tw: 0.25, th: 0.065, rows: 16 }), { paint: 0.03 }));
  M.def('eBelt', () => M.flat('e-belt', '#8e4430', { paint: 0.03 }));
  M.def('eSill', () => M.flat('e-sill', '#e6dfd0', { paint: 0.02 }));
  M.def('eRev', () => M.flat('e-rev', '#7a4636', { paint: 0.03 }));
  M.def('eSpire', () => M.flat('e-spire', '#6e7176', { paint: 0.05 }));
  M.def('eCapA', () => M.flat('e-capa', '#7c5848', { paint: 0.05 }));
  M.def('eCapB', () => M.flat('e-capb', '#b9b4aa', { paint: 0.05 }));
  M.def('eZinc', () => M.flat('e-zinc', '#8d9399', { paint: 0.05 }));
  M.def('eNiche', () => M.deco('e-niche', A.D(128, 256, (g, w, h) => {                       // a blind pointed arch 2.2 x 5.5 m with a rosette in its head: recessed darker brick
    g.fillStyle = '#7a4030'; g.beginPath(); g.moveTo(4, h); g.lineTo(4, h * 0.32); g.quadraticCurveTo(6, h * 0.1, w / 2, 2); g.quadraticCurveTo(w - 6, h * 0.1, w - 4, h * 0.32); g.lineTo(w - 4, h); g.closePath(); g.fill();
    g.strokeStyle = '#c89478'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#c89478'; g.beginPath(); g.arc(w / 2, h * 0.27, 17, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4a2a20'; g.beginPath(); g.arc(w / 2, h * 0.27, 9, 0, Math.PI * 2); g.fill();
  }, 'e-niche'), { alphaTest: 0.2 }));
  M.def('eGateDark', () => M.flat('e-gate', '#2a2a2d', { paint: 0.01 }));
}

const stepped = (u0, u1, y0, y1, n) => {                                                         // a stepped gable outline (symmetric), base y0, ridge y1
  const w = (u1 - u0) / 2, dh = (y1 - y0) / n, pts = [[u0, y0]];
  for (let k = 0; k < n; k++) { const x = u0 + w * (k + 1) / n * 0.9; pts.push([u0 + w * k / n * 0.9, y0 + dh * (k + 1)]); pts.push([x, y0 + dh * (k + 1)]); }
  pts.push([(u0 + u1) / 2, y1]);
  const out = pts.slice(); for (let i = pts.length - 2; i >= 0; i--) out.push([u1 - (pts[i][0] - u0), pts[i][1]]);
  return out;
};

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'erem82', F: FR.EA, ids: ['r15473499'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] erem82/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const brick = { mat: M.eBrick, tu: M.tex['e-brick'].tu, tv: M.tex['e-brick'].tv }, plinth = { mat: M.ePlinth, tu: M.tex['e-plinth'].tu, tv: M.tex['e-plinth'].tv };
  const bands = [{ y0: 0, y1: 3.3, ...plinth }, { y0: 3.3, y1: H, ...brick }];
  const sill = { mat: M.eSill, ext: 0.1, h: 0.1, d: 0.16 };
  const win = (x, k) => (k === 1
    ? { x, y: SILL[k], w: 0.8, h: WH[k], head: 'point', rise: 0.75, glass: M.winWPoint, reveal: M.eRev, depth: 0.25, sill }
    : { x, y: SILL[k], w: 1.05, h: WH[k], glass: M.winW, reveal: M.eRev, depth: 0.24, sill });
  const pin = []; let towerC = [66.9, -0.4];
  h.begin();
  stage('tower', () => {
    const ch = [[65.5, 0], [66.78, 0.62], [68.12, -0.72], [67.5, -1.5]];
    towerC = [(ch[1][0] + ch[2][0]) / 2 - 0.45, (ch[1][1] + ch[2][1]) / 2 - 0.45];
    bay(P, { chain: ch, y0: 7.4, y1: 19.4, bands: [{ y0: 7.4, y1: 19.4, ...brick }], reveal: M.eRev, glass: M.winWPoint, top: M.eBelt,
      wins: (i, len) => {
        const w = [];
        for (const [y, hh] of [[8.0, 1.8], [12.0, 1.9]]) { if (i === 1) w.push({ x: len * 0.3, y, w: 0.5, h: hh, head: 'point', rise: 0.45, glass: M.winWPoint, reveal: M.eRev, depth: 0.16 }, { x: len * 0.7, y, w: 0.5, h: hh, head: 'point', rise: 0.45, glass: M.winWPoint, reveal: M.eRev, depth: 0.16 }); else w.push({ x: len / 2, y, w: 0.42, h: hh * 0.8, glass: M.winD, reveal: M.eRev, depth: 0.12 }); }
        if (i === 1) w.push({ x: len / 2, y: 16.0, w: 0.9, h: 2.2, head: 'arch', glass: M.winWArch, reveal: M.eRev, depth: 0.16 }); else w.push({ x: len / 2, y: 16.2, w: 0.4, h: 1.5, glass: M.winD, reveal: M.eRev, depth: 0.12 });
        return w;
      } });
    for (const y of [5.0, 5.5, 6.0, 6.5]) { const k = (y - 4.8) * 0.25; loftRings(P, M.eBrick, ch, towerC, y, [[1.0 + k * 0.03, 0], [1.0 + k * 0.03, 0.5]]); }
    loftRings(P, M.eSill, ch, towerC, 11.3, [[1.03, 0], [1.03, 0.15]]); loftRings(P, M.eSill, ch, towerC, 15.3, [[1.03, 0], [1.03, 0.15]]);
    loftRings(P, M.eBelt, ch, towerC, 19.0, [[1.06, 0], [1.06, 0.8]]);                       // the dentil corbel table
    const T = polyRing(12, 1.8, towerC[0], towerC[1], 0);
    P.cap(M.eBelt, T, 19.8, false, 2);
    prism(P, T, 19.8, 24.0, { c: towerC, mat: brick, reveal: M.eRev, glass: M.winWArch,
      wins: (i, len) => (i === 1 ? [{ x: len / 2, y: 20.6, w: 0.7, h: 1.5, head: 'arch', glass: M.winWArch, reveal: M.eRev, depth: 0.14 }] : i === 3 ? [{ x: len / 2, y: 20.8, w: 0.45, h: 1.3, glass: M.winD, reveal: M.eRev, depth: 0.12 }] : []) });
    loftRings(P, M.eBelt, T, towerC, 23.6, [[1.06, 0], [1.1, 0.4]]);
    loftRings(P, M.eSpire, polyRing(8, 2.0, towerC[0], towerC[1], Math.PI / 8), towerC, 24.0, [[0.9, 0], [0.74, 1.5], [0.55, 3.2], [0.36, 4.8], [0.16, 6.1], [0, 7.0]]);
  });
  stage('avenue', () => {
    const ps = h.pieces(0, 65.7);
    const wins = [], bayU = [14.0, 39.0];
    for (let k = 0; k < 30; k++) { const x = 1.0 + 2.05 * k; if (x > 62) break; if (bayU.some((b) => Math.abs(x - b) < 1.7)) continue; for (let j = 0; j < 5; j++) { if (Math.abs(x - 60.6) < 1.0 && j === 4) continue; wins.push(win(x, j)); } }
    for (let k = 0; k < 15; k++) { const x = 1.6 + 4.1 * k; if (Math.abs(x - 30) < 2.4 || Math.abs(x - 55) < 1.8 || Math.abs(x - 8) < 1.8 || x > 62) continue; wins.push({ x, y: 1.4, w: 1.0, h: 0.8, glass: M.winD, reveal: M.eRev, depth: 0.25 }); }
    wins.push({ x: 30.0, y: 0, w: 3.2, h: 3.4, head: 'point', rise: 1.4, glass: M.eGateDark, reveal: M.eRev, depth: 0.4 });
    wins.push({ x: 55.0, y: 0, w: 1.2, h: 2.4, head: 'point', rise: 0.7, glass: M.doorDark, reveal: M.eRev, depth: 0.3 }, { x: 8.0, y: 0, w: 1.2, h: 2.4, glass: M.doorDark, reveal: M.eRev, depth: 0.25 });
    for (const p of ps) {
      h.span(p, -1, 999, bands, wins, { reveal: M.eRev, glass: M.winW });
      for (const y of [6.9, 11.0, 15.1, 19.0]) P.box(M.eBelt, p.u0, p.u1, y, y + 0.28, p.d - 0.02, p.d + 0.22, 'bk', 1);
      P.box(M.eBelt, p.u0, p.u1, 3.2, 3.5, p.d - 0.02, p.d + 0.15, 'bk', 1);
      P.box(M.eBelt, p.u0, p.u1, H - 0.9, H - 0.55, p.d - 0.02, p.d + 0.2, 'bk', 1); P.box(M.eBelt, p.u0, p.u1, H - 0.55, H, p.d - 0.02, p.d + 0.38, 'bk', 1);
    }
    // the two three-storey bays (3.0 x 0.9, floors 2-4) with a lancet and the floor-5 balcony
    for (const b of bayU) {
      bay(P, { chain: [[b - 1.5, 0], [b - 1.5, 0.9], [b + 1.5, 0.9], [b + 1.5, 0]], y0: 6.9, y1: 19.0, mat: brick, reveal: M.eRev, glass: M.winWPoint, top: M.eBelt, soffit: M.eBelt,
        wins: (i, len) => (i === 1 ? [8.0, 12.0, 15.9].map((y) => ({ x: len / 2, y, w: 0.8, h: 2.1, head: 'point', rise: 0.75, glass: M.winWPoint, reveal: M.eRev, depth: 0.16 })) : []) });
      for (const y of [6.5, 6.2]) P.box(M.eBelt, b - 1.3, b + 1.3, y, y + 0.3, -0.02, 0.3 + (6.5 - y) * 0.3, 'b', 1);
      balcony(P, M, { x: b, y: 19.0, w: 3.0, depth: 1.2, slab: M.eBelt });
      decal(P, M.eNiche, b, 7.0, 2.2, 5.5, 0.9 + 0.02);
    }
    // gables: the stepped pinnacled cluster at the east end (u 0 .. 9, ridge 27.5) and the pointed gable beside the tower (u 59 .. 62.5, ridge 28.0)
    P.extrude(M.eBrick, shapeOf(stepped(0, 9, H - 0.4, 27.5, 3)), -0.4, 0.5, 2, 4);
    P.extrude(M.eBrick, shapeOf([[59.0, H - 0.4], [62.5, H - 0.4], [60.75, 28.0]]), -0.4, 0.5, 2, 4);
    P.quad(M.winW, [60.35, 24.6, 0.12], [61.15, 24.6, 0.12], [61.15, 26.1, 0.12], [60.35, 26.1, 0.12], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // pinnacles every 5.1 m on the eaves (13), a few on the gable clusters
    for (let k = 0; k < 13; k++) { const u = 2.5 + 5.1 * k; if (u > 63) break; pin.push({ u, z: 0.1, y: H - 0.1, kind: k % 3 === 1 ? 1 : 0 }); }
    for (const u of [0.4, 4.5, 8.6]) pin.push({ u, z: 0.1, y: H - 0.1 + (u > 1 && u < 8 ? 2.0 : 0.9), kind: 1 });
    for (const u of [58.6, 63.2]) pin.push({ u, z: 0.1, y: H - 0.1, kind: 0 });
  });
  stage('endwall', () => {
    const ps = h.piecesIn(FR.EW, -1, 999, { zTol: 2.4 });
    h.inFrame(FR.EW, () => {
      const wins = [];
      for (const x of [3.9, 9.9, 12.0, 14.1, 16.2, 18.2, 20.3, 22.4]) for (let j = 0; j < 5; j++) wins.push(win(x, j));
      for (const x of [2.5, 6.5, 10.5, 14.5, 18.5, 22.5]) wins.push({ x, y: 1.4, w: 1.0, h: 0.8, glass: M.winD, reveal: M.eRev, depth: 0.25 });
      wins.push({ x: 1.9, y: 7.6, w: 0.5, h: 2.2, head: 'point', rise: 0.45, glass: M.winWPoint, reveal: M.eRev, depth: 0.2 });
      for (const p of ps) {
        winWall(P, { x0: p.u0, x1: p.u1, z: p.d, bands, wins: wins.filter((w) => w.x - w.w / 2 >= p.u0 - 1e-3 && w.x + w.w / 2 <= p.u1 + 1e-3), reveal: M.eRev, glass: M.winW, depth: 0.24 });
        for (const y of [6.9, 11.0, 15.1, 19.0]) P.box(M.eBelt, p.u0, p.u1, y, y + 0.28, p.d - 0.02, p.d + 0.22, 'bk', 1);
        P.box(M.eBelt, p.u0, p.u1, H - 0.55, H, p.d - 0.02, p.d + 0.38, 'bk', 1);
      }
      decal(P, M.eNiche, 7.35, 7.4, 2.7, 6.2, 0.12);
      P.extrude(M.eBrick, shapeOf(stepped(11, 16, H - 0.4, 28.0, 3)), -0.4, 0.5, 2, 4);
      P.quad(M.winRound, [13.1, 25.0, 0.12], [13.9, 25.0, 0.12], [13.9, 25.8, 0.12], [13.1, 25.8, 0.12], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    });
  });
  h.rest({ bands, rows: SILL.map((y, k) => ({ y, w: 1.05, h: WH[k] })), pitch: 2.05, margin: 1.0, reveal: M.eRev, glass: M.winW, depth: 0.2 });
  h.band(H - 0.55, H, 0.38, { front: M.eBelt, top: M.eBelt, under: M.eBelt }, { skip: (e) => e.n[1] > 0.9 || e.n[0] > 0.9 || e.len < 3 });
  h.roof(H - 0.02, M.eZinc); h.chimneys(H, 4);
  roofRail(h, H, { skip: (e) => false });
  try {
    pinnacles(K, FR.EA, pin, { shaft: M.eBrick, capA: M.eCapA, capB: M.eCapB, name: 'lmmvo-erem82-pin' });
  } catch (e) { errs.push('pinnacles: ' + (e && e.stack || e)); }
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'r15473499', name: 'Дом Еремеевой со шпилем (Большой пр., 82)', x: c.x, z: c.z, h: 31 });
  h.spot(svc, 33, 3.0, 0, -1, 10, 'Дом со шпилем: красный кирпич, башня и пинакли');
  svc.parts.erem82 = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
