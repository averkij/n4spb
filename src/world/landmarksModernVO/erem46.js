// landmarksModernVO/erem46.js - the EREMEEVA HOUSE "WITH THE SPIRES" (Доходный дом А. А. Еремеевой, «дом со шпицами», 5-я линия В.О., 46; M. F. Eremeev 1903-05; OSM w108091608 baked in the OLD region file city-v2.js,
// baked 19.8 m, real cornice 23.0 m).  Dossier docs/research/modernvo.md section 3 (critic C7 / C14; photos ER46-01 / 09 / 11 / 12), frame ER46 (front u 0 .. 85.67 faces ENE, depth 17.0, a clean rectangle).
//   an 85.7 m red-brick wall (#a4563e): a dark-brick plinth storey 4.0 m (shops, arched doors, the yard gate at u 59.6), four window rows (floors 2-5, segmental brick heads, stone sills) and a low attic row, stepped
//   pilasters every 4 axes, corbelled zigzag belts at the floor lines and a 5-step corbel table at 23.0; the SILHOUETTE: four steep truncated-pyramid roofs (6.4 x 6.4 m at the foot, 7.5 m high, rose-brown 2026
//   repaint) each behind a pointed brick gable (ridge 26.4, lancet with star muntins) flanked by two stepped small gables and four silver needles; 30 + 8 pinnacles (instanced) along the roof edge; two small
//   iron balconies.  The roof groups are at u 15 / 26 / 56 / 76 (+-10 m, dossier [?]).  The yard behind is closed and solid.
import { FR } from './frame.js';
import { House } from './house.js';
import { loftRings, decal, roofRail, balcony, pinnacles } from './elem.js';
import { polyRing } from './bay.js';
import { winWall } from './wallx.js';
import { shapeOf } from './geo.js';

const H = 23.0;
const SILL = [5.2, 9.1, 13.0, 16.9], ATT = 20.7;

function mats(M) {
  const A = M.A;
  M.def('fBrick', () => M.sheet('f-brick', A.tile('f-brick', '#a4563e', { vary: 0.14, dark: 0.1, mortar: '#c3a58e', cols: 6, tw: 0.25, th: 0.065, rows: 16, accent: [['#8c4a36', 0.1], ['#b5603f', 0.1]] }), { paint: 0.03 }));
  M.def('fPlinth', () => M.sheet('f-plinth', A.tile('f-plinth', '#5f3a30', { vary: 0.14, dark: 0.12, mortar: '#7a5a4a', cols: 6, tw: 0.25, th: 0.065, rows: 16 }), { paint: 0.03 }));
  M.def('fBelt', () => M.flat('f-belt', '#92472f', { paint: 0.03 }));
  M.def('fSill', () => M.flat('f-sill', '#dcd2c0', { paint: 0.02 }));
  M.def('fRev', () => M.flat('f-rev', '#7a4636', { paint: 0.03 }));
  M.def('fRoof', () => M.sheet('f-roof', A.D(128, 128, (g, w, h) => { g.fillStyle = '#8c5a52'; g.fillRect(0, 0, w, h); g.fillStyle = '#6e4a44'; for (let i = 0; i < 6; i++) g.fillRect(i * w / 6, 0, 3, h); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, 0, w, 3); A.speckle(g, w, h, 6611, 90, 0.06); }, 'f-roof'), { paint: 0.05 }));
  M.def('fNeedle', () => M.flat('f-needle', '#c3cdd2', { paint: 0.04 }));
  M.def('fCap', () => M.flat('f-cap', '#c3cdd2', { paint: 0.04 }));
  M.def('fRail', () => M.flat('f-rail', '#2a2a2d', { paint: 0.01 }));
  M.def('fZinc', () => M.flat('f-zinc', '#8d9399', { paint: 0.05 }));
  M.def('fGateDark', () => M.flat('f-gate', '#2e2c2e', { paint: 0.01 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'erem46', F: FR.ER46, ids: ['w108091608'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] erem46/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const brick = { mat: M.fBrick, tu: M.tex['f-brick'].tu, tv: M.tex['f-brick'].tv }, plinth = { mat: M.fPlinth, tu: M.tex['f-plinth'].tu, tv: M.tex['f-plinth'].tv };
  const bands = [{ y0: 0, y1: 1.0, ...plinth }, { y0: 1.0, y1: 4.0, ...brick }, { y0: 4.0, y1: H, ...brick }];
  const sill = { mat: M.fSill, ext: 0.1, h: 0.1, d: 0.15 };
  const win = (x, k) => ({ x, y: SILL[k], w: 1.15, h: 1.85, head: 'seg', rise: 0.16, glass: M.winW, reveal: M.fRev, depth: 0.24, sill });
  const GROUPS = [15, 26, 52, 76];
  const pin = [];
  h.begin();
  stage('front', () => {
    const ps = h.pieces(0, 85.7);
    const wins = [];
    for (let k = 0; k < 40; k++) {
      const x = 1.07 + 2.14 * k;
      for (let j = 0; j < 4; j++) { if ((Math.abs(x - 52.0) < 1.1 && j === 1) || (Math.abs(x - 75.0) < 1.1 && j === 2)) continue; wins.push(win(x, j)); }
      wins.push({ x, y: ATT, w: 1.15, h: 1.4, glass: M.winW, reveal: M.fRev, depth: 0.22 });
    }
    for (let k = 0; k < 20; k++) { const x = 2.5 + 4.28 * k; if (Math.abs(x - 59.6) < 2.6 || Math.abs(x - 30) < 1.9 || Math.abs(x - 78) < 1.9 || Math.abs(x - 12) < 1.9 || x > 85) continue; wins.push({ x, y: 0.7, w: 1.5, h: 2.2, glass: M.winShop, reveal: M.fRev, depth: 0.28 }); }
    for (const x of [30, 78, 12]) wins.push({ x, y: 0, w: 1.2, h: 2.4, head: 'arch', glass: M.doorDark, reveal: M.fRev, depth: 0.28, trim: { mat: M.fBelt, t: 0.18, proud: 0.05, top: 0.2, bot: 0 } });
    wins.push({ x: 59.6, y: 0, w: 3.0, h: 3.4, head: 'arch', glass: M.fGateDark, reveal: M.fRev, depth: 0.4 });
    for (const p of ps) {
      h.span(p, -1, 999, bands, wins, { reveal: M.fRev, glass: M.winW });
      for (const y of [4.7, 8.6, 12.5, 16.4, 20.2]) P.box(M.fBelt, p.u0, p.u1, y, y + 0.25, p.d - 0.02, p.d + 0.2, 'bk', 1);
      P.box(M.fBelt, p.u0, p.u1, H - 0.7, H - 0.35, p.d - 0.02, p.d + 0.2, 'bk', 1); P.box(M.fBelt, p.u0, p.u1, H - 0.35, H, p.d - 0.02, p.d + 0.38, 'bk', 1);
      P.box(M.fPlinth, p.u0, p.u1, 3.9, 4.15, p.d - 0.02, p.d + 0.15, 'bk', 1);
    }
    for (let k = 0; k <= 10; k++) { const u = 0.0 + 8.56 * k; P.box(M.fBelt, u - 0.3, u + 0.3, 4.15, H - 0.35, -0.02, 0.15, 'bk', 1); }          // stepped pilasters every 4 axes
    balcony(P, M, { x: 52.0, y: 9.1, w: 1.9, depth: 0.8 }); balcony(P, M, { x: 75.0, y: 13.0, w: 1.9, depth: 0.8 });
    // the four roof groups: pointed gable (3.2 m wide, ridge 26.4) with a lancet, two stepped small gables, four needles, the steep roof behind
    for (const u of GROUPS) {
      P.extrude(M.fBrick, shapeOf([[u - 1.6, H - 0.4], [u + 1.6, H - 0.4], [u, 26.4]]), -0.45, 0.55, 2, 4);
      P.quad(M.winWPoint, [u - 0.4, 24.2, 0.12], [u + 0.4, 24.2, 0.12], [u + 0.4, 25.7, 0.12], [u - 0.4, 25.7, 0.12], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const s of [-1, 1]) P.extrude(M.fBrick, shapeOf([[u + s * 1.6, H - 0.4], [u + s * 3.2, H - 0.4], [u + s * 2.4, 25.0]]), -0.45, 0.55, 2, 4);
      const c = [u, -3.7], R = polyRing(4, 6.4 / Math.SQRT2, c[0], c[1], Math.PI / 4);
      loftRings(P, M.fRoof, R, c, H, [[1, 0], [0.453, 7.5]]);
      const top = R.map((q) => [c[0] + (q[0] - c[0]) * 0.453, c[1] + (q[1] - c[1]) * 0.453]);
      P.cap(M.fBelt, top, H + 7.5, true, 2); P.box(M.fBelt, u - 1.6, u + 1.6, H + 7.5, H + 7.9, c[1] - 1.6, c[1] + 1.6, 'b', 1);
      P.box(M.fRail, u - 1.1, u + 1.1, H + 7.9, H + 8.9, c[1] - 1.1, c[1] - 1.05, 'b', 1);
      for (const s of [-1, 1]) {
        P.cyl(M.fNeedle, [u + s * 3.4, H - 0.2 + 2.8, 0.1], [u + s * 3.4, H + 5.8, 0.1], 0.45, 0.0, 6, true);                    // outer needle: cone on the pinnacle shaft top
        P.cyl(M.fNeedle, [u + s * 1.9, H + 0.9, -0.6], [u + s * 1.9, H + 5.3, -0.6], 0.4, 0.0, 6, true);                         // inner needle on the gable flank
        pin.push({ u: u + s * 3.4, z: 0.1, y: H - 0.2, kind: 0, s: 2 });
      }
    }
    // the pinnacles of the roof edge (shaft 1.4 + cap 0.9, silver caps) every 2.65 m
    for (let k = 0; k < 32; k++) { const u = 1.3 + 2.65 * k; if (GROUPS.some((g) => Math.abs(u - g) < 4.0) || (u > 57.4 && u < 61.8)) continue; pin.push({ u, z: 0.1, y: H - 0.1, kind: 0 }); }
  });
  h.rest({ bands, rows: SILL.map((y) => ({ y, w: 1.15, h: 1.85 })).concat([{ y: ATT, w: 1.15, h: 1.4 }, { y: 0.8, w: 1.2, h: 2.0 }]), pitch: 2.14, margin: 1.0, reveal: M.fRev, glass: M.winW, depth: 0.2 });
  h.band(H - 0.35, H, 0.38, { front: M.fBelt, top: M.fBelt, under: M.fBelt }, { skip: (e) => e.n[1] > 0.9 || e.len < 3 });
  h.roof(H - 0.02, M.fZinc); h.chimneys(H, 5);
  roofRail(h, H, { mat: M.railing });
  try { pinnacles(K, FR.ER46, pin, { w: 0.55, shaftH: 1.4, capH: 0.9, shaft: M.fBrick, capA: M.fCap, capB: M.fCap, name: 'lmmvo-erem46-pin' }); } catch (e) { errs.push('pinnacles: ' + (e && e.stack || e)); }
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'w108091608', name: 'Дом Еремеевой со шпицами (5-я линия В.О., 46)', x: c.x, z: c.z, h: 30.5 });
  h.spot(svc, 43, 3.0, 0, -1, 10, 'Дом со шпицами: красная стена и четыре острые кровли');
  svc.parts.erem46 = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
