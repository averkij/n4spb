// landmarksModernVO/karlmay.js - the KARL MAY SCHOOL (Здание гимназии и реального училища К. И. Мая, 14-я линия В.О., 39; G. D. Grimm 1909-10, Art Nouveau; today SPIIRAS; OSM w96579819, baked ~21 m, real cornice 18.4 m).
// Dossier docs/research/modernvo.md section 11 (photos KM-08 / KM-01 / KM-06 / KM-09 re-read), frame MA (the 14th-Line front u 0 .. 40.27, one flat plane; the OSM plan is a U: wing A 28.9 m deep, the middle block 19 m, the SSE wing 67 m).
//   peach-cream stucco (#ecd2ac) with grey-beige roughcast fields (#9b8e80), a roughcast ground storey with five arched windows, the big semicircular portal (span 6.2) with the may-bug stone, two floors of
//   rectangular / arched windows, a top floor of huge half-round windows (wing A span 7.0, three of 4.6 in the middle block, one of 3.4 in the SSE wing), the S-curved cream crest and the raised-letter
//   inscription «ГИМНАЗIЯ И РЕАЛЬНОЕ УЧИЛИЩЕ К. МАЯ» (old letter І) with meander squares and rosettes, the carriage gate with plank leaves, bosses and brass panels (u 31.0 .. 34.7).  Nothing is enterable.
import { FR } from './frame.js';
import { House } from './house.js';
import { winWall, quadFace } from './wallx.js';
import { shapeOf } from './geo.js';
import { decal, roofRail } from './elem.js';

const H = 18.4;
const CREST = [[0, 18.9], [1.2, 19.8], [3.0, 20.8], [4.6, 21.0], [6.5, 20.6], [8.3, 19.6], [9.6, 18.9], [10.4, 19.0], [11.4, 19.6], [13.5, 20.4], [16, 21.4], [20.2, 22.3], [24, 21.6], [27, 20.8], [28.8, 19.9], [30.0, 19.2], [30.8, 19.2], [32.5, 19.8], [34.5, 20.0], [36.7, 20.1], [38.5, 19.6], [40.3, 18.9]];
const crestY = (u) => { let i = 0; while (i + 2 < CREST.length && CREST[i + 1][0] < u) i++; const a = CREST[i], b = CREST[i + 1], t = Math.max(0, Math.min(1, (u - a[0]) / (b[0] - a[0]))); return a[1] + (b[1] - a[1]) * (0.5 - 0.5 * Math.cos(Math.PI * t)); };

function mats(M) {
  const A = M.A;
  M.def('mCream', () => M.sheet('m-cream', A.plaster('m-cream', '#ecd2ac', { stain: 0.035 }), { paint: 0.03 }));
  M.def('mRough', () => M.sheet('m-rough', A.rough('m-rough', '#9b8e80'), { paint: 0.04 }));
  M.def('mPlinth', () => M.flat('m-plinth', '#8c7a74', { paint: 0.04 }));
  M.def('mRev', () => M.flat('m-rev', '#d9bf99', { paint: 0.03 }));
  M.def('mRevD', () => M.flat('m-revd', '#6f6559', { paint: 0.03 }));
  M.def('mZinc', () => M.flat('m-zinc', '#8d9399', { paint: 0.05 }));
  M.def('mWin', () => M.sheet('m-win', A.win('m-d', { frame: '#3c2f2a', bars: 'two', ratio: 2.0, f: 5 }), { paint: 0 }));
  M.def('mWinArch', () => M.sheet('m-win-arch', A.win('m-arch', { head: 'arch', frame: '#3c2f2a', bars: 'v3', ratio: 0.9, f: 6 }), { paint: 0 }));
  M.def('mWinArch4', () => M.sheet('m-win-arch4', A.win('m-arch4', { head: 'arch', frame: '#3c2f2a', bars: 'v4', ratio: 0.75, f: 6 }), { paint: 0 }));
  M.def('mWinSmall', () => M.sheet('m-win-small', A.win('m-small', { head: 'arch', frame: '#3c2f2a', bars: 'cross', ratio: 1.6, f: 5 }), { paint: 0 }));
  M.def('mDoor', () => M.sheet('m-door', A.D(128, 160, (g, w, h) => { g.fillStyle = '#4a352c'; g.fillRect(0, 0, w, h); g.fillStyle = '#34261f'; for (let i = 1; i < 4; i++) g.fillRect(i * w / 4 - 2, 0, 4, h); g.fillStyle = '#7a8a96'; g.fillRect(8, 10, w - 16, h * 0.3); g.fillStyle = '#34261f'; g.fillRect(w / 2 - 2, 10, 4, h * 0.3); }, 'm-door'), { paint: 0.02 }));
  M.def('mGate', () => M.sheet('m-gate', A.D(256, 270, (g, w, h) => {                  // 3.7 x 3.9 m: plank leaves, bosses 5 x 3 per leaf, brass panels
    g.fillStyle = '#8a5a48'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(40,20,10,0.25)'; g.fillRect(i * w / 18, 0, 1.5, h); }
    g.fillStyle = '#34201a'; g.fillRect(w / 2 - 2, 0, 4, h);
    g.fillStyle = '#a89a50'; g.fillRect(8, 6, w - 16, 28); g.fillRect(w * 0.1, h - 50, w * 0.8, 40);
    for (const x0 of [0.1, 0.62]) { g.fillStyle = '#a89a50'; g.beginPath(); g.moveTo(w * x0, h * 0.62); g.lineTo(w * (x0 + 0.28), h * 0.62); g.lineTo(w * (x0 + 0.28), h * 0.4); g.lineTo(w * (x0 + 0.14), h * 0.3); g.lineTo(w * x0, h * 0.4); g.closePath(); g.fill(); }
    g.fillStyle = '#5a3a2e'; for (const lx of [0.2, 0.5, 0.78]) for (let r = 0; r < 5; r++) for (const s of [0, 0.5]) { g.beginPath(); g.arc(w * (lx * 0.5 + s), 50 + r * 28, 4.5, 0, Math.PI * 2); g.fill(); }
  }, 'm-gate'), { paint: 0.02 }));
  // raised letters on the cream band (cream on cream: a faint shadow edge) and the rosettes / meander squares
  M.def('mLetters', () => M.deco('m-letters', A.D(1024, 64, (g, w, h) => {
    g.fillStyle = '#f3dfba'; g.strokeStyle = 'rgba(120,90,50,0.55)'; g.lineWidth = 2; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `700 ${h * 0.82 | 0}px ${A.FONTS.sans}`;
    const t1 = 'ГИМНАЗIЯ И РЕАЛЬНОЕ', t2 = 'УЧИЛИЩЕ К. МАЯ';
    const fit = (txt, x0, wd) => { let sz = h * 0.82; g.font = `700 ${sz | 0}px ${A.FONTS.sans}`; while (g.measureText(txt).width > wd && sz > 8) { sz -= 1; g.font = `700 ${sz | 0}px ${A.FONTS.sans}`; } g.strokeText(txt, x0, h / 2); g.fillText(txt, x0, h / 2); };
    fit(t1, 4, 480); fit(t2, 540, 410);
  }, 'm-letters'), { alphaTest: 0.2 }));
  M.def('mRosette', () => M.deco('m-rosette', A.D(64, 64, (g) => { g.fillStyle = '#f3dfba'; g.strokeStyle = 'rgba(120,90,50,0.6)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.save(); g.translate(32, 32); g.rotate(k * Math.PI / 2); g.beginPath(); g.ellipse(0, -14, 9, 15, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore(); } g.beginPath(); g.arc(32, 32, 7, 0, Math.PI * 2); g.fill(); g.stroke(); }, 'm-rosette'), { alphaTest: 0.3 }));
  M.def('mMeander', () => M.deco('m-meander', A.D(96, 80, (g, w, h) => { g.strokeStyle = '#c9a874'; g.lineWidth = 7; g.beginPath(); for (let i = 0; i < 3; i++) { const o = i * 9; g.rect(8 + o, 8 + o, w - 16 - 2 * o, h - 16 - 2 * o); } g.stroke(); g.fillStyle = '#f3dfba'; g.fillRect(34, 28, 28, 24); }, 'm-meander'), { alphaTest: 0.3 }));
  M.def('mBug', () => M.deco('m-bug', A.D(64, 64, (g) => { g.fillStyle = '#d6bd96'; g.beginPath(); g.moveTo(8, 8); g.lineTo(56, 8); g.lineTo(46, 56); g.lineTo(18, 56); g.closePath(); g.fill(); g.fillStyle = '#6a5a42'; g.beginPath(); g.ellipse(32, 34, 9, 14, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(32, 18, 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#6a5a42'; g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(32 + s * 8, 30); g.lineTo(32 + s * 20, 22); g.stroke(); g.beginPath(); g.moveTo(32 + s * 8, 38); g.lineTo(32 + s * 21, 44); g.stroke(); } }, 'm-bug'), { alphaTest: 0.2 }));
  M.def('mPlaque', () => M.deco('m-plaque', A.D(64, 90, (g, w, h) => { g.fillStyle = '#6a6762'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9c4b8'; g.font = `700 8px ${A.FONTS.sans}`; g.textAlign = 'center'; g.fillText('6-я СПЕЦ.', w / 2, 22); g.fillText('АРТИЛЛЕР.', w / 2, 36); g.fillText('ШКОЛА', w / 2, 50); g.fillRect(14, 62, 36, 3); }, 'm-plaque'), { alphaTest: 0.1 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'karlmay', F: FR.MA, ids: ['w96579819'], H });
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] karlmay/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const cream = { mat: M.mCream, tu: 3, tv: 3 }, rough = { mat: M.mRough, tu: 2, tv: 2 };
  const bands = [{ y0: 0, y1: 0.7, mat: M.mPlinth, tu: 2, tv: 1 }, { y0: 0.7, y1: 4.6, ...rough }, { y0: 4.6, y1: H, ...cream }];
  const trimR = (t = 0.2) => ({ mat: M.mRev, t, proud: 0.05, top: t * 1.2, bot: t * 1.4 });
  const wins = [];
  // ground storey
  wins.push({ x: 0.9, y: 0.9, w: 0.8, h: 2.6, head: 'arch', glass: M.winDArch, reveal: M.mRevD, depth: 0.25, trim: trimR(0.18) });
  wins.push({ x: 9.7, y: 0.9, w: 0.8, h: 2.6, head: 'arch', glass: M.winDArch, reveal: M.mRevD, depth: 0.25, trim: trimR(0.18) });
  for (const u of [12.5, 16.0, 19.6, 23.2, 26.8]) wins.push({ x: u, y: 1.2, w: 1.4, h: 2.0, head: 'arch', glass: M.winDArch, reveal: M.mRevD, depth: 0.28, trim: { mat: M.mRev, t: 0.3, proud: 0.06, top: 0.3, bot: 0.1 } });
  wins.push({ x: 5.4, y: 0, w: 6.2, h: 5.7, head: 'arch', glass: M.mDoor, reveal: M.mRevD, depth: 0.7, trim: { mat: M.mRev, t: 0.62, proud: 0.1, top: 0.62, bot: 0 }, n: 14 });
  wins.push({ x: 32.85, y: 0, w: 3.7, h: 3.9, head: 'arch', glass: M.mGate, reveal: M.mRevD, depth: 0.3, trim: { mat: M.mRev, t: 0.55, proud: 0.06, top: 0.55, bot: 0 }, n: 12 });
  wins.push({ x: 36.0, y: 1.3, w: 0.9, h: 1.7, head: 'arch', glass: M.winDArch, reveal: M.mRevD, depth: 0.22 }, { x: 38.6, y: 1.3, w: 0.9, h: 1.7, head: 'arch', glass: M.winDArch, reveal: M.mRevD, depth: 0.22 });
  // floors 2 and 3
  const tr = trimR(0.2);
  for (const [u, w, hh, head] of [[1.5, 0.9, 2.1], [5.0, 1.7, 2.4, 'seg'], [8.3, 0.9, 2.1]]) { wins.push({ x: u, y: u >= 5.0 ? 6.3 : 5.2, w, h: hh, head, rise: 0.4, glass: M.winD, reveal: M.mRevD, depth: 0.25, trim: tr }); wins.push({ x: u, y: 9.3, w, h: hh, head, rise: 0.4, glass: M.winD, reveal: M.mRevD, depth: 0.25, trim: tr }); }
  for (const u of [11.5, 14.7, 17.9, 21.1, 24.3, 27.5]) { wins.push({ x: u, y: 5.2, w: 1.05, h: 2.1, head: 'seg', rise: 0.25, glass: M.winD, reveal: M.mRevD, depth: 0.25, trim: tr }); wins.push({ x: u, y: 9.3, w: 1.05, h: 2.3, head: 'arch', glass: M.winDArch, reveal: M.mRevD, depth: 0.25, trim: tr }); }
  for (const u of [34, 38]) { wins.push({ x: u, y: 5.2, w: 1.5, h: 2.1, glass: M.winD, reveal: M.mRevD, depth: 0.25, trim: tr }); wins.push({ x: u, y: 9.3, w: 1.5, h: 2.1, glass: M.winD, reveal: M.mRevD, depth: 0.25, trim: tr }); }
  // floor 4: the huge half-round windows
  wins.push({ x: 4.6, y: 13.6, w: 7.0, h: 4.4, head: 'seg', rise: 3.0, glass: M.mWinArch4, reveal: M.mRevD, depth: 0.35, trim: { mat: M.mRev, t: 0.4, proud: 0.08, top: 0.4, bot: 0.2 }, n: 14 });
  for (const u of [13.5, 20.2, 26.7]) wins.push({ x: u, y: 14.6, w: 4.6, h: 3.6, head: 'arch', glass: M.mWinArch, reveal: M.mRevD, depth: 0.32, trim: { mat: M.mRev, t: 0.35, proud: 0.08, top: 0.35, bot: 0.2 }, n: 12 });
  wins.push({ x: 36.7, y: 15.0, w: 3.4, h: 3.0, head: 'arch', glass: M.mWinArch, reveal: M.mRevD, depth: 0.3, trim: { mat: M.mRev, t: 0.3, proud: 0.08, top: 0.3, bot: 0.2 }, n: 10 });
  h.begin();
  let ps = [];
  stage('front', () => {
    ps = h.pieces(0, 40.3);
    for (const p of ps) h.span(p, -1, 999, bands, wins, { reveal: M.mRevD, glass: M.winD });
    for (const p of ps) { P.box(M.mRev, p.u0, p.u1, 4.5, 4.75, p.d - 0.02, p.d + 0.12, 'bk', 2); P.box(M.mRev, p.u0, p.u1, H - 0.4, H, p.d - 0.02, p.d + 0.35, 'bk', 2); P.box(M.mRev, p.u0, p.u1, 8.7, 8.9, p.d - 0.02, p.d + 0.1, 'bk', 2); P.box(M.mRev, p.u0, p.u1, 13.0, 13.2, p.d - 0.02, p.d + 0.1, 'bk', 2); }
  });
  stage('fields', () => {                                                                // grey roughcast fields: between the floor-2/3 axes of the middle block, flanks of wing A, apron panels
    const rg = (u0, u1, y0, y1) => P.quad(M.mRough, [u0, y0, 0.025], [u1, y0, 0.025], [u1, y1, 0.025], [u0, y1, 0.025], [0, 0, 1], [[u0 / 2, y0 / 2], [u1 / 2, y0 / 2], [u1 / 2, y1 / 2], [u0 / 2, y1 / 2]]);
    for (const u of [13.1, 16.3, 19.5, 22.7, 25.9]) rg(u - 0.25, u + 0.25, 4.9, 13.0);
    rg(0.3, 1.0, 4.9, 12.8); rg(2.2, 8.2, 11.9, 12.9); rg(9.5, 10.3, 4.9, 12.8); rg(29.6, 30.2, 4.9, 12.8); rg(32.4, 33.4, 5.0, 12.8);
    for (const u of [5.0, 14.7, 21.1, 27.5]) rg(u - 0.8, u + 0.8, 7.7, 8.5);
  });
  stage('crest', () => {                                                                 // the S-curved crest: a solid extruded outline (front and back, 0.35 m)
    const pts = [[0, H - 0.4], [40.3, H - 0.4]];
    for (let u = 40.3; u >= 0; u -= 0.4) pts.push([u, crestY(u)]);
    pts.push([0, crestY(0)]);
    P.extrude(M.mCream, shapeOf(pts), -0.35, 0.35 + 0.12, 3, 4);
    // a thin darker moulding along the curve
    for (let u = 0; u < 40.3 - 0.4; u += 0.4) { const a = crestY(u), b = crestY(u + 0.4); P.quad(M.mRev, [u, a - 0.28, 0.135], [u + 0.4, b - 0.28, 0.135], [u + 0.4, b - 0.1, 0.135], [u, a - 0.1, 0.135], [0, 0, 1]); }
    // the lettering (two pieces on the band: u 12.0 .. 19.0 and 21.5 .. 28.5, following the raking line) and the ornaments
    const y1 = (u) => crestY(u) - 1.55;
    P.quad(M.mLetters, [12.0, y1(12.0) - 0.0, 0.15], [28.5, y1(28.5) + 0.0, 0.15], [28.5, y1(28.5) + 0.8, 0.15], [12.0, y1(12.0) + 0.8, 0.15], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    decal(P, M.mMeander, 20.2, y1(20.2) - 0.1, 1.2, 1.0, 0.14); decal(P, M.mRosette, 20.2, y1(20.2) + 1.0, 0.5, 0.5, 0.14);
    for (const u of [11.4, 29.4]) decal(P, M.mRosette, u, crestY(u) - 0.9, 0.5, 0.5, 0.14);
  });
  stage('details', () => {
    decal(P, M.mBug, 5.4, 5.35, 0.6, 0.55, 0.14);                                         // the may-bug stone in the keystone zone of the portal arch
    if (h.reserve('w96579819', 9.7, 2.25, 0.5, 0.7)) decal(P, M.mPlaque, 9.7, 1.9, 0.5, 0.7, 0.04);
    if (h.reserve('w96579819', 1.5, 3.35, 0.4, 0.5)) decal(P, M.mPlaque, 1.5, 3.1, 0.4, 0.5, 0.04);
  });
  h.rest({ bands: [{ y0: 0, y1: 4.6, ...rough }, { y0: 4.6, y1: H, ...cream }], rows: [{ y: 1.2, w: 1.2, h: 2.0 }, { y: 5.2, w: 1.2, h: 2.2 }, { y: 9.3, w: 1.2, h: 2.2 }, { y: 14.0, w: 1.4, h: 3.0 }], pitch: 3.2, margin: 1.6, reveal: M.mRevD, glass: M.winD, depth: 0.22 });
  h.band(H - 0.5, H, 0.35, { front: M.mRev, top: M.mZinc, under: M.mRev }, { skip: (e) => e.n[1] > 0.9 });
  h.roof(H - 0.02, M.mZinc); h.chimneys(H, 4);
  roofRail(h, H, { skip: (e) => e.n[1] > 0.9 });
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'w96579819', name: 'Гимназия и реальное училище К. И. Мая (14-я линия В.О., 39)', x: c.x, z: c.z, h: 22.3 });
  h.spot(svc, 20, 6.0, 0, -1, 10, 'Школа Карла Мая: арки, волнистый аттик, надпись');
  svc.parts.karlmay = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
