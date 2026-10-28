// landmarksModernVO/kollan.js - the KOLLAN HOUSE (Дом Ю. П. Коллана, Большой пр. В.О., 92; F. Lidval 1904-05, "Finnish" Northern Modern; OSM w65710570, baked 13.2 m, real eaves 13.7 m).
// Dossier docs/research/modernvo.md section 10 (photos KL-01 / KL-05 / KL-08, re-read for this build), frame KL (front u 0 .. 36.8, faces NNW).
//   dark mauve roughcast wall (#5f4c4b), a rock-faced granite base 1.9 m high cut by seven low pointed windows, the cream centre oriel (three faces, floors 2-3) on a rusticated granite corbel under a verdigris
//   hood, two cream half-round oriels (floors 3-4, ribbed zinc caps), four cream decor strips (floor-3 window, two ladder cobble panels, a segmental floor-4 window, a stepped "tooth" at the foot), a cream
//   frieze of cobble triangles and sunbursts at the head of floor 4, five faint cobble rings under the eaves, broad brown eaves and a pale zinc hip roof (ridge 15.5).
// Floor-2 window positions are read from the frontal photo KL-08 (the dossier list differs by up to 1.5 m); the pointed windows and the strips are the dossier's.  Nothing is enterable.
import { FR } from './frame.js';
import { House } from './house.js';
import { bay, arcChain, cantedChain, hipOver } from './bay.js';
import { beltBox } from './wallx.js';
import { roofHip, pipe } from './wall.js';

const H = 13.7;                                           // eaves
const STRIPS = [3.3, 10.1, 20.3, 28.4];                  // decor strip centres (1.7 m wide)
const FRIEZE = [[1.5, 5.5], [8.4, 13.2], [17.5, 22.7], [26.0, 32.7]];
const add2 = (arr, a, b, bands) => { if (b > a + 1e-3) arr.push([a, b, bands]); };

function mats(M) {
  const A = M.A;
  M.def('kMauve', () => M.sheet('k-mauve', A.rough('k-mauve', '#6a5250'), { paint: 0.04 }));
  M.def('kCream', () => M.sheet('k-cream', A.plaster('k-cream', '#e6d6bd', { stain: 0.05 }), { paint: 0.03 }));
  M.def('kGranite', () => M.sheet('k-granite', A.granite('k-granite', '#7d7a73'), { paint: 0.04 }));
  M.def('kGraniteSm', () => M.flat('k-granite-sm', '#8d8a84', { paint: 0.03 }));
  M.def('kRevMauve', () => M.flat('k-rev-mauve', '#4d3d3b', { paint: 0.03 }));
  M.def('kRevCream', () => M.flat('k-rev-cream', '#d9c9b0', { paint: 0.03 }));
  M.def('kHood', () => M.flat('k-hood', '#7f9a78', { paint: 0.04 }));
  M.def('kSoffit', () => M.flat('k-soffit', '#6b4a3a', { paint: 0.04 }));
  M.def('kPipe', () => M.flat('k-pipe', '#7a5a52', { paint: 0.02 }));
  M.def('kBrick', () => M.flat('k-brick', '#8e5a45', { paint: 0.04 }));
  M.def('kTooth', () => M.flat('k-tooth', '#d9c8ae', { paint: 0.03 }));
  M.def('kWinPoint', () => M.sheet('k-win-point', A.win('k-d-point', { head: 'point', frame: '#3a3a38', bars: 'cross', glass: 'dark', ratio: 1.15 }), { paint: 0 }));
  M.def('kWinTall', () => M.sheet('k-win-tall', A.win('k-d-door', { frame: '#6b6558', bars: 'cross', ratio: 2.6 }), { paint: 0 }));
  M.def('kWinSeg', () => M.sheet('k-win-seg', A.win('k-d-seg', { head: 'arch', frame: '#3f322c', bars: 'three', ratio: 1.55 }), { paint: 0 }));
  M.def('kRoof', () => M.sheet('k-roof', A.D(128, 128, (g, w, h) => {
    g.fillStyle = '#b9c1c0'; g.fillRect(0, 0, w, h); g.fillStyle = '#9aa3a3'; for (let i = 0; i < 4; i++) g.fillRect(i * w / 4, 0, 3, h);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 0, w, 3); A.speckle(g, w, h, 4411, 80, 0.06);
  }, 'k-roof'), { paint: 0.04 }));
  // cobble ornaments (grey cobbles #6e6f69, dark joints)
  const cobble = (g, x, y, r, a = 1) => { g.fillStyle = `rgba(122,122,114,${a})`; g.beginPath(); g.ellipse(x, y, r, r * 0.85, 0.5, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(70,70,64,0.55)'; g.lineWidth = 1; g.stroke(); };
  M.def('kLadder', () => M.deco('k-ladder', A.D(256, 256, (g) => {                       // two diagonal "ladders" (an inverted V) of 0.55 x 1.4 m each on 1.2 x 1.4 m
    const ladder = (x0, y0, x1, y1) => {
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * 18, ny = dx / l * 18;
      for (const s of [-1, 1]) for (let t = 0; t <= 1.001; t += 0.09) cobble(g, x0 + dx * t + nx * s, y0 + dy * t + ny * s, 8.5);
      for (let k = 0; k < 6; k++) { const t = 0.08 + k * 0.17; for (let q = -0.7; q <= 0.71; q += 0.35) cobble(g, x0 + dx * t + nx * q, y0 + dy * t + ny * q, 7); }
    };
    ladder(150, 20, 70, 205); ladder(106, 20, 186, 205);
    for (const [x, s] of [[56, 1], [200, -1]]) { cobble(g, x, 232, 5); cobble(g, x + 12 * s, 224, 4); cobble(g, x + 24 * s, 216, 4); }
  }, 'k-ladder'), { alphaTest: 0.4 }));
  M.def('kFrieze', () => M.sheet('k-frieze', A.D(512, 112, (g, w, h) => {                  // cream band, triangle - fan - triangle - fan (tile 3.2 x 0.7 m)
    g.fillStyle = '#e4d3b8'; g.fillRect(0, 0, w, h);
    const tri = (x0, x1) => { for (const k of [0, 1, 2]) { const ins = k * 11; const a = [x0 + ins, h - 8 - ins * 0.35], b = [x1 - ins, h - 8 - ins * 0.35], c = [(x0 + x1) / 2, 8 + ins * 0.5]; for (const [p, q] of [[a, c], [c, b]]) for (let t = 0; t <= 1; t += 0.09) cobble(g, p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, 4.2); } };
    const fan = (cx) => { for (let a = Math.PI * 0.08; a < Math.PI * 0.93; a += Math.PI * 0.14) for (let r = 12; r < 66; r += 11) cobble(g, cx + Math.cos(a) * r * 1.25, h - 8 - Math.sin(a) * r * 0.82, 4.2); };
    tri(8, 248); fan(384);
  }, 'k-frieze'), { paint: 0.02 }));
  M.def('kRing', () => M.deco('k-ring', A.D(64, 64, (g) => { for (let a = 0; a < 6.28; a += 0.4) { cobble(g, 32 + Math.cos(a) * 25, 32 + Math.sin(a) * 25, 5, 0.9); if (a < 5.6) cobble(g, 32 + Math.cos(a + 0.2) * 14, 32 + Math.sin(a + 0.2) * 14, 4.5, 0.9); } }, 'k-ring'), { alphaTest: 0.3 }));
}

export function build(K) {
  const { P, M, svc } = K;
  mats(M);
  const h = new House(K, { name: 'kollan', F: FR.KL, ids: ['w65710570'], H });
  h.begin();
  const errs = []; const stage = (name, fn) => { try { fn(); } catch (e) { console.error('[landmarksModernVO] kollan/' + name + ':', e); errs.push(name + ': ' + (e && e.stack || e)); } };
  const cream = { mat: M.kCream, tu: M.tex['k-cream'].tu, tv: M.tex['k-cream'].tv };
  const mauve = { mat: M.kMauve, tu: 2, tv: 2 }, gran = { mat: M.kGranite, tu: M.tex['k-granite'].tu, tv: M.tex['k-granite'].tv };
  const oriel = (x, y, w, hh) => ({ x, y, w, h: hh, glass: M.winW, reveal: M.kRevCream, depth: 0.14, trim: { mat: M.kCream, t: 0.07, proud: 0.03, top: 0.08, bot: 0.1 } });

  // ---- the front wall: the lower part (granite base, floor 2) in one piece, the upper part (floors 3-4) in spans: mauve between the four cream strips (floor 3-4 windows, 6.2 .. eaves)
  const low = [], up = [];
  for (const u of [2.4, 5.9, 9.5, 24.3, 28.7, 33.6]) low.push({ x: u, y: 0.3, w: 1.7, h: 2.0, head: 'point', rise: 0.55, glass: M.kWinPoint, reveal: M.kGraniteSm, depth: 0.3 });
  low.push({ x: 20.7, y: 0.3, w: 1.7, h: 2.0, head: 'point', rise: 0.55, glass: M.darkGlass, reveal: M.kGraniteSm, depth: 0.1 });         // the sealed gate niche
  for (const u of [1.7, 4.0, 6.3, 8.7, 11.0, 19.0, 21.6, 27.2, 30.1, 32.9, 34.3]) low.push({ x: u, y: 3.7, w: 1.2, h: 2.1, glass: M.winD, reveal: M.kRevMauve, depth: 0.28, trim: { mat: M.kRevCream, t: 0.1, proud: 0.03, top: 0.1, bot: 0.14 } });
  low.push({ x: 24.3, y: 3.0, w: 1.1, h: 2.8, glass: M.winD, reveal: M.kRevMauve, depth: 0.28 });                                          // the balcony door over the lost balcony
  low.push({ x: 14.7, y: 0, w: 1.6, h: 2.2, glass: M.doorDark, reveal: M.kGraniteSm, depth: 0.3, trim: { mat: M.kGraniteSm, t: 0.3, proud: 0.12, top: 0.35, bot: 0 } }); // the stair door
  for (const c of STRIPS) {
    up.push({ x: c, y: 7.3, w: 1.3, h: 1.8, glass: M.winD, reveal: M.kRevCream, depth: 0.28 });
    up.push({ x: c, y: 10.5, w: 1.35, h: 2.0, head: 'seg', rise: 0.28, glass: M.winDArch, reveal: M.kRevCream, depth: 0.28 });
  }
  up.push({ x: 13.8, y: 11.4, w: 0.9, h: 1.9, glass: M.winD, reveal: M.kRevCream, depth: 0.25 }, { x: 15.1, y: 11.4, w: 1.6, h: 1.9, glass: M.winD, reveal: M.kRevCream, depth: 0.25 }, { x: 16.4, y: 11.4, w: 0.9, h: 1.9, glass: M.winD, reveal: M.kRevCream, depth: 0.25 });
  stage('front', () => {
    const ps = h.pieces(0, 36.8);
    const lowBands = [{ y0: 0, y1: 1.9, ...gran }, { y0: 1.9, y1: 6.2, ...mauve }];
    const upMauve = [{ y0: 6.2, y1: H, ...mauve }], upStrip = [{ y0: 6.2, y1: H, ...cream }], upPanel = [{ y0: 6.2, y1: 10.0, ...mauve }, { y0: 10.0, y1: H, ...cream }];
    const spans = []; let x = 0;
    const cuts = [];
    for (const c of STRIPS) { add2(cuts, x, c - 0.85, upMauve); add2(cuts, c - 0.85, c + 0.85, upStrip); x = c + 0.85; }
    add2(cuts, x, 36.8, upMauve);
    for (const [a, b, bands] of cuts) {                                                    // the mauve span 10.95 .. 19.45 holds the centre panel 12.95 .. 17.25
      if (bands === upMauve && a < 17.25 && b > 12.95) { add2(spans, a, Math.min(b, 12.95), upMauve); add2(spans, Math.max(a, 12.95), Math.min(b, 17.25), upPanel); add2(spans, Math.max(a, 17.25), b, upMauve); }
      else spans.push([a, b, bands]);
    }
    for (const p of ps) {
      h.span(p, -1, 999, lowBands, low, { reveal: M.kRevMauve, glass: M.winD, depth: 0.25 });
      for (const [a, b, bands] of spans) h.span(p, a, b, bands, up, { reveal: M.kRevCream, glass: M.winD, depth: 0.25 });
    }
  });
  stage('teeth', () => { for (const c of STRIPS) for (const dx of [-0.55, 0, 0.55]) beltBox(P, M.kTooth, c + dx - 0.2, c + dx + 0.2, 5.9, 6.25, 0, 0.14, 1); });
  // ---- the centre oriel (floors 2-3): three faces on a rusticated granite corbel, verdigris hood
  stage('oriel-centre', () => {
    const cx = 15.1, ch = cantedChain(cx, 3.8, 1.2, 59), oy0 = 4.9, oy1 = 10.0;
    const wl = (i, len) => (i === 1 ? [oriel(len / 2, 4.3, 1.2, 1.9), oriel(len / 2, 7.8, 1.2, 1.9)] : [oriel(len / 2, 4.3, 0.7, 1.6), oriel(len / 2, 7.8, 0.7, 1.6)]);
    bay(P, { chain: ch, y0: oy0, y1: oy1, mat: cream, wins: wl, reveal: M.kRevCream, glass: M.winW, soffit: M.kGraniteSm, top: M.kCream });
    for (let k = 0; k < 5; k++) {                                                          // the corbel: five courses of rock-faced blocks, flaring
      const t = k / 4, y0 = 3.0 + k * 0.38, y1 = y0 + 0.38, wdt = 3.0 + 1.0 * t, pr = 0.2 + 0.95 * t;
      P.box(M.kGranite, cx - wdt / 2, cx + wdt / 2, y0, y1, -0.02, pr, 'b', 1.2);
    }
    hipOver(P, M.kHood, ch, oy1 - 0.1, 0.8, { over: 0.25, top: 0.55, capMat: M.kHood });
  });
  // ---- the two half-round oriels (floors 3-4): five facets, 3 windows per floor, ribbed zinc caps; stone brackets of the lost balconies below them
  stage('oriel-sides', () => {
    for (const cx of [6.7, 24.3]) {
      const ch = arcChain(cx, 1.8, 1.2, [0.7, 0.9, 1.3, 0.9, 0.7]), oy0 = 6.4, oy1 = 13.6;
      bay(P, { chain: ch, y0: oy0, y1: oy1, mat: cream, wins: (i, len) => (i >= 1 && i <= 3 ? [7.6, 10.9].map((y) => oriel(len / 2, y, i === 2 ? 0.75 : 0.6, 1.7)) : []), reveal: M.kRevCream, glass: M.winW, soffit: M.kCream, top: M.kCream });
      for (const dx of [-1.15, 1.15]) P.box(M.kGraniteSm, cx + dx - 0.2, cx + dx + 0.2, 2.75, 3.5, -0.02, 0.5, 'b', 1);
      hipOver(P, M.zincLight, ch, oy1, 0.5, { over: 0.15, top: 0.3 });
    }
  });
  // ---- ornaments: ladder panels (two per strip at floor 3, y 8.3 .. 9.6), the frieze stretches (11.6 .. 12.3), the five rings (y 13.0)
  stage('ornament', () => {
    for (const c of STRIPS) P.quad(M.kLadder, [c - 0.62, 8.3, 0.035], [c + 0.62, 8.3, 0.035], [c + 0.62, 9.65, 0.035], [c - 0.62, 9.65, 0.035], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const [a, b] of FRIEZE) for (let u = a; u < b - 1e-3; u += 3.2) { const e = Math.min(b, u + 3.2); P.quad(M.kFrieze, [u, 11.6, 0.03], [e, 11.6, 0.03], [e, 12.3, 0.03], [u, 12.3, 0.03], [0, 0, 1], [[0, 0], [(e - u) / 3.2, 0], [(e - u) / 3.2, 1], [0, 1]]); }
    for (const u of [9.0, 18.8, 21.9, 26.6, 30.3]) P.quad(M.kRing, [u - 0.45, 12.55, 0.03], [u + 0.45, 12.55, 0.03], [u + 0.45, 13.45, 0.03], [u - 0.45, 13.45, 0.03], [0, 0, 1]);
  });
  // ---- eaves, roof, downpipes, chimney
  stage('roof', () => {
    P.cap(M.kSoffit, [[-0.9, 0.6], [37.4, 0.6], [37.4, -16.3], [-0.9, -16.3]], H - 0.02, false, 3);
    roofHip(P, M.kRoof, -0.9, 37.4, -16.3, 0.6, H, 1.85, 0.6);
    P.box(M.kBrick, 34.2, 35.2, H, 17.5, -4.6, -3.6, 'b', 1.5);
    for (const u of [11.8, 17.3, 36.0]) pipe(P, M.kPipe, u, 0, H - 0.2, 0.13, 0.07);
  });
  h.roof(H - 0.05, M.roofGrey);
  h.rest({ bands: [{ y0: 0, y1: H, ...mauve }], rows: [{ y: 1.4, w: 1.1, h: 1.6 }, { y: 3.7, w: 1.1, h: 2.0 }, { y: 7.3, w: 1.1, h: 1.8 }, { y: 10.5, w: 1.1, h: 2.0 }], pitch: 3.4, margin: 2.5, reveal: M.kRevMauve, glass: M.winD, depth: 0.2 });
  h.end();
  h.colliders(H + 1);
  const c = h.centre();
  svc.monuments.push({ id: 'w65710570', name: 'Дом Ю. П. Коллана (Большой пр. В.О., 92)', x: c.x, z: c.z, h: 15.5 });
  h.spot(svc, 18, 3.0, 0, -1, 8, 'Дом Коллана: три эркера и булыжные орнаменты');
  svc.parts.kollan = { tris: P.tris };
  if (errs.length) throw new Error(errs.join('\n'));
}
