// landmarksI/hermitage.js - the Hermitage buildings along the Neva and the Winter Canal (docs/research/palace-square-hermitage.md section 8, photos 054 059 060 067 074 081):
//   Small Hermitage r1067948 (pale mint, free Corinthian colonnade on the Neva front, rusticated arched ground floor) - Old (Great) Hermitage r270634 (ochre, plain classical front on the Neva) -
//   New Hermitage r1202918 (Klenze: yellow, red granite plinth, statue niches, the portico of the TEN ATLANTES on Millionnaya ul. in the middle of the front, at the OSM way w579071832) -
//   Hermitage Theatre r1084724 (Quarenghi: pale grey-green, eight white columns on a rusticated base) - the gallery arch over the Winter Canal r8092295 (ivory, six arched windows, green roof) -
//   the little galleries / links r8092328 w549454802 w549454801 w549454806 r8201892 r8092312 w567780996.
// Every wall is drawn edge by edge from the OSM footprint with a shared classical grammar (classic()); the Neva fronts, the portico and the arch are specials.  Colliders: thin wall boxes (lib/massing).
// NOTE (dossier correction): the atlantes portico stands in the MIDDLE of the Millionnaya front (OSM way "Атланты" at u -134.7, v -221), not at the bump near v -179 that the dossier read from the ring.
import * as THREE from 'three';
import { human, cached } from '../lib/figures.js';
import { ringEdges, band, localOnEdge, frameOf, archPath } from './kit.js';
import { toUV, toWorld, edgePoint } from './frame.js';
import { chains } from './palace.js';
import { hipRoof, chimneys } from './hip.js';
import { addPolyColliders } from '../lib/massing.js';
import { MONUMENTS } from '../data/city.js';

const hashv = (a, b, c = 0) => { let h = 2166136261 ^ Math.floor(a * 7 + b * 131 + c * 17); h = Math.imul(h, 16777619); h ^= h >>> 15; return ((h >>> 0) % 1000) / 1000; };
const ring = (o) => { const r = []; for (let i = 0; i < o.length; i += 2) r.push([o[i], o[i + 1]]); return r; };

// ------------------------------------------------------------------------------------------------ the shared classical facade
function classic(K, PM, len, S, extra) {
  const P = K.P;
  K.wallQuad(S.plinthMat, 0, len, 0, S.plinth, 2.4, 0, 1.2);
  if (S.rust) K.wallQuad(S.rustMat, 0, len, S.plinth, S.rust, 2.4, 0, 1.2);
  K.wallQuad(S.wall, 0, len, S.rust || S.plinth, S.top + 0.02, 4);
  if (len < 3.2) return;
  const n = Math.max(1, Math.round(len / S.pitch)), p = len / n;
  for (let i = 0; i < n; i++) {
    const xc = p * (i + 0.5);
    if (extra && extra.skip && extra.skip(xc)) continue;
    const ww = Math.min(S.ww, p - 1.0);
    for (const r of S.rows) {
      const hood = typeof r.hood === 'function' ? r.hood(i) : r.hood;
      K.window({ x: xc, y: r.y, w: Math.min(r.w || 9, ww), h: r.h, head: r.head, sw: r.sw ?? 0.22, d: 0.12, sill: r.head !== 'arch', frame: 'white', surMat: S.trim, hood, hoodH: 0.5, v: Math.floor(hashv(i, r.y, len) * 4) });
    }
  }
}

// ------------------------------------------------------------------------------------------------ a standing figure in a niche and the statues of the Hermitage
function statueFigure(P, m, y, h = 2.7) {
  const k = h / 2.7;
  P.box(m, -0.5 * k, 0.5 * k, y, y + 0.22 * k, -0.4 * k, 0.4 * k, 'b');
  P.cyl(m, [0, y + 0.22 * k, 0], [0, y + 1.3 * k, 0], 0.42 * k, 0.3 * k, 8, false);
  P.cyl(m, [0, y + 1.3 * k, 0], [0, y + 2.0 * k, 0], 0.3 * k, 0.28 * k, 8, false);
  P.cyl(m, [0, y + 2.0 * k, 0], [0, y + 2.5 * k, 0], 0.17 * k, 0.13 * k, 6, true);
  P.cyl(m, [0.28 * k, y + 1.8 * k, 0], [0.4 * k, y + 1.0 * k, 0.05], 0.08 * k, 0.07 * k, 5, false);
}
/** a statue niche on a wall in the current frame: stone frame, dark panel, grey figure on a plinth, acroteria on the cornice */
function niche(K, PM, x, y, w = 1.5, h = 3.5) {
  const P = K.P;
  P.box(PM.stone, x - w / 2 - 0.45, x - w / 2, y, y + h + 0.5, 0, 0.3, 'kb');
  P.box(PM.stone, x + w / 2, x + w / 2 + 0.45, y, y + h + 0.5, 0, 0.3, 'kb');
  P.box(PM.stone, x - w / 2 - 0.6, x + w / 2 + 0.6, y + h, y + h + 0.5, 0, 0.42, 'kb');
  P.box(PM.stone, x - w / 2 - 0.55, x + w / 2 + 0.55, y - 0.5, y - 0.05, 0, 0.3, 'kb');
  K.plane(PM.nichePanel, x - w / 2, x + w / 2, y, y + h, 0.04);
  P.push(x, 0, 0.5, 0); statueFigure(P, PM.marble, y + 0.1, 2.7); P.pop();
}

// ------------------------------------------------------------------------------------------------ the figures of the atlantes portico
// photos 079 080 081: a muscular nude in dark grey-brown granite, both arms raised and bent over the head (hands under the architrave), head bowed, a shaggy loincloth, bare feet on a red granite pedestal.
const _geo = new Map();
const sph = (seg = 8) => { const k = 's' + seg; if (!_geo.has(k)) _geo.set(k, new THREE.SphereGeometry(1, seg, Math.max(4, seg - 2))); return _geo.get(k); };
const frs = (rt, rb, seg = 8) => { const k = 'f' + rt + ',' + rb + ',' + seg; if (!_geo.has(k)) _geo.set(k, new THREE.CylinderGeometry(rt, rb, 1, seg, 1)); return _geo.get(k); };
// the atlas built with the shared figure kit (lib/figures.js): a heroic muscular nude (shoulders 1.3x), both arms raised and bent over the head, the head bowed, a shaggy loincloth, curly beard
const atlasFig = () => cached('lmI-atlas', () => human({
  detail: 0.28, body: { muscle: 1.0, bulk: 1.3, shoulders: 1.3 },
  pose: { head: [0.38, 0.0, 0], spine: [-0.04, 0, 0], legs: { L: { foot: [0.2, 0, 0.0], yaw: 0.2 }, R: { foot: [-0.2, 0, 0.0], yaw: -0.2 } },
    arms: { L: { hand: [0.32, 1.9, -0.02], pole: [1.0, 0.25, -0.1], grip: 'fist', palm: [0, -1, 0] }, R: { hand: [-0.32, 1.9, -0.02], pole: [-1.0, 0.25, -0.1], grip: 'fist', palm: [0, -1, 0] } } },
  outfit: { torso: 'tunic', hem: 0.26, flare: 0.4, folds: 0.07 },
  face: { age: 0.5, hair: 'curly', beard: 'full', brow: 1.0, seed: 3 },
}));
/** one atlas, feet at the origin, facing +z; hands reach 5.05 * s */
function atlas(P, PM, s = 1) {
  atlasFig().place(P, { main: PM.atlas, dark: PM.atlas, accent: PM.atlas }, 0, 0, 0, 0, 2.62 * s);
}

// ------------------------------------------------------------------------------------------------ the building runner
function runBuilding(K, PM, ctx, svc, id, S) {
  const L = K.L, P = K.P;
  const rec = L.buildingById(id); if (!rec) throw new Error(id + ' missing');
  const poly = rec.polys[0];
  const all = ringEdges(poly, 0.3);
  const chs = chains(all);
  const items = all.map((e) => ({ e, f: frameOf(e), q: toUV((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), nu: 0, nv: 0 }));
  for (const it of items) { it.nu = it.e.n[0] * 0.587785 + it.e.n[1] * 0.809017; it.nv = -it.e.n[0] * 0.809017 + it.e.n[1] * 0.587785; }
  for (const it of items) {
    const sp = S.special && S.special(it.e, it.f, it);
    K.onEdgeFn(it.e, (len, f) => { if (sp) sp(len, f); else classic(K, PM, len, S, S.skipFor ? { skip: S.skipFor(it.e) } : null); });
  }
  const whiteM = { front: S.trim, top: S.trim, under: PM.whiteShade };
  for (const ch of chs) {
    if (S.cornice) band(P, ch, S.top - S.cornice, S.top, 0.5, whiteM, {});
    for (const sc of S.strings || []) band(P, ch, sc[0], sc[1], sc[2], whiteM, {});
    band(P, ch, S.plinth, S.plinth + 0.2, 0.12, { front: S.plinthMat, top: PM.graniteTop }, {});
  }
  // roof: a cap over the footprint, pitched strips along the long edges
  const roofH = hipRoof(P, S.roofMat, ring(poly.o), poly.h.map(ring), S.top + 0.3, { slope: 0.34, R: S.roofR ?? 3.0, cell: 3.6 });
  if (S.roofD !== 0) chimneys(P, S.chimney || PM.chimney, PM.white, roofH, all, { gap: 8, inset: 3.5, minLen: 12 });
  if (S.collide !== false) addPolyColliders(ctx, poly, 0, S.top + 1, 0.9);
  return { rec, poly, items, chs };
}

export function buildHermitage(K, PM, ctx, svc) {
  const L = K.L, P = K.P;
  const mk = (hex, o) => K.mat(hex, o);
  PM.stone = mk('#e3d8b0', { name: 'lmI-stone' });
  PM.marble = mk('#b9bcb4', { name: 'lmI-marble' });
  PM.nichePanel = mk('#a49a62', { name: 'lmI-niche' });
  PM.atlas = mk('#7b7370', { name: 'lmI-atlas', paint: 0.02 });
  PM.redGranite = mk('#a65b4a', { name: 'lmI-redgr' });
  PM.redGraniteDark = mk('#8a4a38');
  PM.ironGreen = mk('#3f6b56');
  PM.graniteRed = mk('#a8584a', { map: K.texRust, name: 'lmI-graniteRed' });
  PM.trimCream = mk('#efe6c8', { name: 'lmI-trimC' });
  const wall = (hex) => mk(hex, { name: 'lmI-w' + hex, paint: 0.03 });
  const rust = (hex) => K.rust(hex);
  const done = [];
  const safe = (name, fn) => { try { fn(); done.push(name); } catch (e) { console.error('[landmarksI] hermitage ' + name + ' failed:', e); svc.errors = (svc.errors || []).concat(name + ': ' + (e && e.message)); } };

  // ---------------------------------------------------------------- Small Hermitage
  const SM = { wall: wall('#b7d0bc'), rustMat: rust('#b7d0bc'), plinthMat: PM.graniteFlat, trim: PM.white, plinth: 1.2, rust: 8.3, top: 20.0, cornice: 1.8, strings: [[8.0, 8.5, 0.25]], pitch: 4.0, ww: 1.9, roofMat: PM.roofGreen, roofD: 8,
    rows: [{ y: 2.2, h: 4.4, head: 'arch' }, { y: 9.4, h: 4.8, head: 'arch', sw: 0.25 }, { y: 15.5, h: 1.8, head: 'flat', sw: 0.18 }] };
  SM.special = (e, f, it) => {
    if (it.nu < -0.9 && e.len > 30 && it.q.u < -270) return (len) => smallNeva(K, PM, len, SM);
    return null;
  };
  safe('small', () => runBuilding(K, PM, ctx, svc, 'r1067948', SM));

  // ---------------------------------------------------------------- Old (Great) Hermitage
  const OLD = { wall: wall('#dccd8c'), rustMat: rust('#dccd8c'), plinthMat: PM.graniteFlat, trim: PM.trimCream, plinth: 1.5, rust: 6.5, top: 19.5, cornice: 1.6, strings: [[6.3, 6.8, 0.25]], pitch: 3.7, ww: 1.7, roofMat: PM.roofGreen, roofD: 8,
    rows: [{ y: 2.2, h: 3.6, head: 'arch' }, { y: 8.4, h: 4.4, head: 'flat', hood: (i) => (i % 2 ? 'seg' : 'tri') }, { y: 14.3, h: 2.8, head: 'flat', sw: 0.18 }] };
  safe('old', () => runBuilding(K, PM, ctx, svc, 'r270634', OLD));

  // ---------------------------------------------------------------- New Hermitage
  const nhSkip = nicheSkipMap(K);
  const NH = { skipFor: (e) => { const l = nhSkip.get(e.a[0].toFixed(1) + ',' + e.a[1].toFixed(1)) || []; return (xc) => l.some((u) => Math.abs(u - xc) < 2.7); }, wall: wall('#e2cf7c'), rustMat: rust('#e2cf7c'), plinthMat: PM.graniteRed, trim: PM.trimCream, plinth: 2.2, rust: 6.4, top: 19.5, cornice: 1.5, strings: [[6.4, 6.9, 0.25]], pitch: 4.4, ww: 1.8, roofMat: PM.roofGreen, roofD: 10,
    rows: [{ y: 3.0, h: 2.9, head: 'flat', sw: 0.2 }, { y: 8.6, h: 6.0, head: 'flat', sw: 0.25, hood: (i) => (i % 2 ? 'seg' : 'tri') }] };
  const atl = toWorld(-134.7, -221.1);
  let nhItems = null;
  NH.special = (e, f, it) => {
    if (it.nu > 0.9 && e.len > 50 && it.q.u > -145) { const cx = localOnEdge(e, atl[0], atl[1]).u; return (len, ff) => atlantesFront(K, PM, len, NH, cx); }
    return null;
  };
  safe('new', () => { const r = runBuilding(K, PM, ctx, svc, 'r1202918', NH); nhItems = r.items; });
  safe('niches', () => { if (nhItems) niches(K, PM, nhItems, svc); });

  // ---------------------------------------------------------------- Hermitage Theatre
  const TH = { wall: wall('#d4dcc9'), rustMat: rust('#d4dcc9'), plinthMat: PM.graniteFlat, trim: PM.white, plinth: 1.3, rust: 6.6, top: 18.6, cornice: 1.5, strings: [[6.4, 6.9, 0.25]], pitch: 5.0, ww: 1.8, roofMat: PM.roofGreen, roofD: 12,
    rows: [{ y: 2.4, h: 3.6, head: 'arch' }, { y: 8.2, h: 5.2, head: 'flat', hood: 'tri' }, { y: 14.6, h: 1.5, head: 'flat', sw: 0.14 }] };
  TH.special = (e, f, it) => {
    if (it.nu < -0.9 && e.len > 55 && it.q.u < -268) return (len) => theatreNeva(K, PM, len, TH);
    return null;
  };
  safe('theatre', () => runBuilding(K, PM, ctx, svc, 'r1084724', TH));

  // ---------------------------------------------------------------- galleries / links (elevated boxes over the lanes) and the annex in the east notch
  const LINK = { wall: wall('#b7d0bc'), rustMat: rust('#b7d0bc'), plinthMat: PM.graniteFlat, trim: PM.white, plinth: 0.01, rust: 0, top: 14.0, cornice: 1.0, pitch: 4.0, ww: 1.5, roofMat: PM.roofGreen, collide: false,
    rows: [{ y: 8.4, h: 3.4, head: 'arch', sw: 0.2 }] };
  for (const id of ['r8092328', 'w549454802', 'w549454801']) safe('link ' + id, () => runGallery(K, PM, id, LINK));
  const ANN = { wall: wall('#b7d0bc'), rustMat: rust('#b7d0bc'), plinthMat: PM.graniteFlat, trim: PM.white, plinth: 1.2, rust: 0, top: 13.0, cornice: 1.0, pitch: 4.0, ww: 1.6, roofMat: PM.roofGreen, roofD: 6,
    rows: [{ y: 2.4, h: 3.2, head: 'arch', sw: 0.2 }, { y: 7.4, h: 3.2, head: 'flat', sw: 0.2 }] };
  safe('annex', () => runBuilding(K, PM, ctx, svc, 'w567780996', ANN));
  const SMALLB = { ...OLD, top: 12.0, cornice: 1.0, rust: 0, plinth: 1.2, rows: [{ y: 2.4, h: 3.0, head: 'arch', sw: 0.18 }, { y: 7.0, h: 3.2, head: 'flat', sw: 0.18 }], roofD: 5 };
  for (const id of ['r8201892', 'r8092312', 'w549454806']) safe('block ' + id, () => runBuilding(K, PM, ctx, svc, id, SMALLB));

  // ---------------------------------------------------------------- the little ticket kiosk in the Great Courtyard (OSM w1230807517)
  const KIOSK = { wall: wall('#dcd2b4'), rustMat: rust('#dcd2b4'), plinthMat: PM.graniteFlat, trim: PM.white, plinth: 0.3, rust: 0, top: 3.4, cornice: 0.35, pitch: 3.0, ww: 1.2, roofMat: PM.roofGreen, roofD: 0, rows: [{ y: 0.9, h: 1.9, head: 'flat', sw: 0.1 }] };
  safe('kiosk', () => runBuilding(K, PM, ctx, svc, 'w1230807517', KIOSK));

  // ---------------------------------------------------------------- the arch over the Winter Canal
  safe('arch', () => canalArch(K, PM, ctx, svc));
  svc.hermitage = { built: done };
}

// ------------------------------------------------------------------------------------------------ elevated link galleries (span over a lane)
function runGallery(K, PM, id, S) {
  const rec = K.L.buildingById(id); const poly = rec.polys[0];
  const all = ringEdges(poly, 0.3), P = K.P;
  for (const e of all) K.onEdgeFn(e, (len) => {
    const y0 = 6.8;
    K.wallQuad(S.wall, 0, len, y0, S.top + 0.02, 4);
    if (len > 3.4) { const n = Math.max(1, Math.round(len / 4)); for (let i = 0; i < n; i++) K.window({ x: len * (i + 0.5) / n, y: 8.6, w: 1.5, h: 3.4, head: 'arch', sw: 0.2, d: 0.1, sill: false, frame: 'white', surMat: PM.white, v: i % 4 }); }
  });
  for (const ch of chains(all)) { band(P, ch, 6.2, 6.8, 0.3, { front: PM.white, top: PM.white, under: PM.whiteShade }, {}); band(P, ch, S.top - 1.0, S.top, 0.45, { front: PM.white, top: PM.white, under: PM.whiteShade }, {}); }
  P.cap(PM.roofGreen, ring(poly.o), S.top + 0.3, true, 6, []);
  P.cap(PM.whiteShade, ring(poly.o), 6.2, false, 6, []);
}

// ------------------------------------------------------------------------------------------------ Small Hermitage, Neva front (photo 067): rusticated arched ground floor, free Corinthian colonnade over two floors
function smallNeva(K, PM, len, S) {
  const P = K.P, M = K.mats;
  K.wallQuad(PM.graniteFlat, 0, len, 0, S.plinth, 2.4, 0, 1.2);
  K.wallQuad(S.rustMat, 0, len, S.plinth, S.rust, 2.4, 0, 1.2);
  K.wallQuad(S.wall, 0, len, S.rust, S.top + 0.02, 4);
  const n = 9, p = len / n;
  for (let i = 0; i < n; i++) K.window({ x: p * (i + 0.5), y: 2.2, w: 2.0, h: 4.6, head: 'arch', sw: 0.28, d: 0.12, sill: false, frame: 'white', surMat: PM.white, v: i % 4 });
  // upper floors: wings (plain windows) and the central colonnade
  const c0 = 5.2, c1 = len - 5.2, ni = 7, cp = (c1 - c0) / ni;
  for (const wx of [2.6, len - 2.6]) {
    K.window({ x: wx, y: 9.4, w: 1.7, h: 4.8, head: 'flat', sw: 0.25, d: 0.12, sill: true, frame: 'white', surMat: PM.white, hood: 'tri', hoodH: 0.5, v: 1 });
    K.window({ x: wx, y: 15.6, w: 1.5, h: 1.8, head: 'flat', sw: 0.18, d: 0.1, sill: false, frame: 'white', surMat: PM.white, v: 2 });
  }
  for (let i = 0; i < ni; i++) {
    const xc = c0 + cp * (i + 0.5);
    K.window({ x: xc, y: 9.4, w: 1.8, h: 5.2, head: 'arch', sw: 0.25, d: 0.12, sill: false, frame: 'white', surMat: PM.white, v: i % 4 });
    K.window({ x: xc, y: 15.7, w: 1.6, h: 1.7, head: 'flat', sw: 0.16, d: 0.1, sill: false, frame: 'white', surMat: PM.white, v: (i + 2) % 4 });
  }
  // balcony slab + balustrade at the foot of the order, the six free columns + two end pilasters, the entablature over them
  const zc = 1.35;
  P.box(PM.white, c0 - 0.5, c1 + 0.5, 8.3, 8.6, 0, zc + 0.8, 'k');
  K.balustrade(c0 - 0.3, c1 + 0.3, 8.6, 0.8, zc + 0.7, PM.white);
  for (let i = 0; i <= ni; i++) {
    const x = c0 + cp * i;
    if (i === 0 || i === ni) { P.box(PM.white, x - 0.45, x + 0.45, 8.6, 18.0, 0, 0.35, 'kb'); P.box(PM.gold, x - 0.55, x + 0.55, 17.0, 18.0, 0, 0.45, 'kb'); }
    else { P.cyl(PM.white, [x, 9.1, zc], [x, 17.0, zc], 0.52, 0.46, 10, false); P.cyl(PM.white, [x, 8.6, zc], [x, 9.1, zc], 0.7, 0.6, 10, true); P.cyl(PM.gold, [x, 16.9, zc], [x, 18.0, zc], 0.55, 0.8, 8, false); P.box(PM.gold, x - 0.85, x + 0.85, 18.0, 18.12, zc - 0.85, zc + 0.85, 'b'); }
  }
  P.box(PM.white, c0 - 0.6, c1 + 0.6, 18.12, 19.4, 0, zc + 0.95, 'kb');
  for (const wx of [1.5, len - 1.5]) { P.push(wx, 0, 0.9, 0); statueFigure(P, PM.marble, 8.9, 2.6); P.pop(); }
  // statues in the end bays and the group on the roof
  P.push(len / 2, 0, 0, 0); statueFigure(P, PM.marble, 20.0, 2.0); P.pop();
}

// ------------------------------------------------------------------------------------------------ New Hermitage, Millionnaya front with the portico of the ten atlantes in the middle
function atlantesFront(K, PM, len, S, cx) {
  const P = K.P;
  K.wallQuad(PM.graniteRed, 0, len, 0, S.plinth, 2.4, 0, 1.2);
  K.wallQuad(S.rustMat, 0, len, S.plinth, S.rust, 2.4, 0, 1.2);
  K.wallQuad(S.wall, 0, len, S.rust, S.top + 0.02, 4);
  const hw = 11.6, x0 = cx - hw, x1 = cx + hw;
  const n = Math.max(1, Math.round(len / S.pitch)), p = len / n;
  for (let i = 0; i < n; i++) {
    const xc = p * (i + 0.5); if (xc > x0 - 1.8 && xc < x1 + 1.8) continue;
    for (const r of S.rows) K.window({ x: xc, y: r.y, w: S.ww, h: r.h, head: r.head, sw: r.sw ?? 0.22, d: 0.12, sill: true, frame: 'white', surMat: S.trim, hood: typeof r.hood === 'function' ? r.hood(i) : r.hood, hoodH: 0.5, v: i % 4 });
  }
  // ---- the portico (photos 079-081): deep porch with the entrance recess; ten atlantes: 2 flank the door, 2 pairs on each side, between stone piers; entablature with 14 wreath roundels; balcony with a green iron railing
  const D = 4.6, zf = D - 1.2, PEDH = 1.55, STEP = 0.35, YT = STEP + PEDH, HANDS = 5.05 * 1.06, EB = YT + HANDS + 0.05, ET = EB + 2.3;
  P.box(PM.stone, x0 + 0.3, x1 - 0.3, 0, STEP, 0, D + 0.3, 'b');                                          // step
  P.box(PM.stone, x0, x0 + 1.0, STEP, EB, 0, D, 'kb'); P.box(PM.stone, x1 - 1.0, x1, STEP, EB, 0, D, 'kb');      // end piers
  P.box(PM.stone, x0 + 1.0, x1 - 1.0, STEP, EB, 0, 0.04, 'kb');                                            // back wall
  K.gate(cx, STEP, 3.4, 5.6, { open: false, sw: 0.25, d: 0.2, ringMat: PM.stone, doorMat: PM.ironGreen });
  for (const sx of [-1, 1]) {                                                                                // hanging black lanterns
    P.box(PM.ironLace, cx + sx * 2.5 - 0.1, cx + sx * 2.5 + 0.1, 4.55, 4.7, 0.3, 0.9, 'k');
    P.box(PM.iron, cx + sx * 2.5 - 0.22, cx + sx * 2.5 + 0.22, 3.75, 4.55, 0.7, 1.1, 'kb');
    P.box(PM.stone, cx + sx * 2.5 - 0.16, cx + sx * 2.5 + 0.16, 3.9, 4.4, 0.76, 1.04, 'kb');
  }
  const FIG = [-2.7, 2.7, -5.2, -6.7, 5.2, 6.7, -9.0, -10.3 + 0.0, 9.0, 10.3];
  for (const d of FIG) {
    P.push(cx + d, 0, zf, 0);
    P.box(PM.redGranite, -0.72, 0.72, STEP + 0.14, YT - 0.1, -0.72, 0.72, 'b');
    P.box(PM.redGraniteDark, -0.82, 0.82, YT - 0.12, YT, -0.82, 0.82, 'b');
    P.box(PM.redGraniteDark, -0.8, 0.8, STEP, STEP + 0.14, -0.8, 0.8, 'b');
    P.push(0, YT, 0, 0); atlas(P, PM, 1.06); P.pop();
    P.pop();
  }
  // stone piers between the groups (full height, flush with the figures) with simple capitals
  for (const d of [-3.95, 3.95, -7.75, 7.75]) {
    P.box(PM.stone, cx + d - 0.5, cx + d + 0.5, STEP + 0.3, EB - 0.3, zf - 0.55, zf + 0.55, 'b');
    P.box(PM.stone, cx + d - 0.66, cx + d + 0.66, EB - 0.3, EB, zf - 0.7, zf + 0.7, 'b');
    P.box(PM.stone, cx + d - 0.66, cx + d + 0.66, STEP, STEP + 0.3, zf - 0.7, zf + 0.7, 'b');
  }
  P.box(PM.stone, x0 - 0.3, x1 + 0.3, EB, ET, 0, D + 0.3, 'k');                                              // entablature
  P.box(PM.stone, x0 - 0.5, x1 + 0.5, ET, ET + 0.35, 0, D + 0.55, 'k');
  for (let i = 0; i < 14; i++) { const x = x0 + 1.0 + (x1 - x0 - 2.0) * i / 13, yy = EB + 1.3; P.cyl(PM.whiteShade, [x, yy, D + 0.31], [x, yy, D + 0.37], 0.36, 0.36, 12, true); P.cyl(PM.stone, [x, yy, D + 0.37], [x, yy, D + 0.41], 0.24, 0.24, 12, true); }
  // balcony railing over the portico (green cast iron)
  K.railRun(x0 - 0.3, x1 + 0.3, ET + 0.35, D + 0.45, 1.0, PM.ironGreen);
  K.railRunZ(x0 - 0.3, ET + 0.35, 0.5, D + 0.45, 1.0, PM.ironGreen); K.railRunZ(x1 + 0.3, ET + 0.35, 0.5, D + 0.45, 1.0, PM.ironGreen);
  P.box(PM.graniteFlat, x0 - 0.3, x1 + 0.3, ET + 0.3, ET + 0.38, 0.5, D + 0.5, 'k');
}

// ------------------------------------------------------------------------------------------------ the statue niches of the New Hermitage (OSM artwork nodes)
/** local positions of the statue niches per New Hermitage edge (key = start point), so that the window rhythm can leave them free */
function nicheSkipMap(K0) {
  const out = new Map(); const rec = K0.L.buildingById('r1202918'); if (!rec) return out;
  const edges = ringEdges(rec.polys[0], 0.3);
  for (const m of nicheNodes()) { const hit = bestEdge(edges, m); if (hit) { const k = hit.e.a[0].toFixed(1) + ',' + hit.e.a[1].toFixed(1); if (!out.has(k)) out.set(k, []); out.get(k).push(hit.u); } }
  return out;
}
function nicheNodes() {
  const out = [];
  for (const m of MONUMENTS || []) { if (m.kind !== 'artwork' && m.sub !== 'statue') continue; const q = toUV(m.x, m.z); if (q.u < -258 || q.u > -128 || q.v > -160 || q.v < -280) continue; out.push(m); }
  return out;
}
function bestEdge(edges, m) {
  let best = null, bd = 4;
  for (const e of edges) { if (e.len < 8) continue; const lo = localOnEdge(e, m.x, m.z); if (lo.u < 0.8 || lo.u > e.len - 0.8 || Math.abs(lo.d) > bd) continue; bd = Math.abs(lo.d); best = { e, u: lo.u }; }
  return best;
}
function niches(K, PM, items, svc) {
  const mons = MONUMENTS || [];
  const upper = new Set(['Raphael', 'Leonard de Vinci', 'Correggio', 'Titiano', 'Dioscorides', 'Pheidon', 'Pichler', 'Pyrgoteles', 'Durer', 'Rubens', 'Rembrant']);
  const names = [];
  for (const m of mons) {
    if (m.kind !== 'artwork' && m.sub !== 'statue') continue;
    const q = toUV(m.x, m.z);
    if (q.u < -258 || q.u > -128 || q.v > -160 || q.v < -280) continue;
    let best = null, bd = 4;
    for (const it of items) {
      if (it.e.len < 8) continue;
      const lo = localOnEdge(it.e, m.x, m.z);
      if (lo.u < 0.8 || lo.u > it.e.len - 0.8 || Math.abs(lo.d) > bd) continue;
      bd = Math.abs(lo.d); best = { it, u: lo.u };
    }
    if (!best) continue;
    const y = upper.has(m.name) ? 9.6 : 2.7;
    K.onEdgeFn(best.it.e, () => niche(K, PM, best.u, y));
    names.push(m.name || m.id);
  }
  svc.niches = names.length;
}

// ------------------------------------------------------------------------------------------------ Hermitage Theatre, Neva front (photo 054): eight white columns on a rusticated base
function theatreNeva(K, PM, len, S) {
  const P = K.P;
  K.wallQuad(PM.graniteFlat, 0, len, 0, S.plinth, 2.4, 0, 1.2);
  K.wallQuad(S.rustMat, 0, len, S.plinth, S.rust, 2.4, 0, 1.2);
  K.wallQuad(S.wall, 0, len, S.rust, S.top + 0.02, 4);
  const nb = 13, p = len / nb;
  for (let i = 0; i < nb; i++) {
    const xc = p * (i + 0.5);
    K.window({ x: xc, y: 2.4, w: 1.6, h: 3.4, head: 'flat', sw: 0.16, d: 0.1, sill: false, frame: 'white', surMat: PM.white, v: i % 4 });
    K.window({ x: xc, y: 6.0, w: 1.7, h: 1.6, head: 'arch', sw: 0.2, d: 0.1, sill: false, frame: 'white', surMat: PM.white, v: (i + 1) % 4 });
  }
  // upper floors
  const c0 = len * 0.21, c1 = len * 0.72, ni = 7, cp = (c1 - c0) / ni;
  for (let i = 0; i < ni; i++) {
    const xc = c0 + cp * (i + 0.5);
    K.window({ x: xc, y: 8.4, w: 1.8, h: 5.0, head: 'flat', sw: 0.24, d: 0.12, sill: true, frame: 'white', surMat: PM.white, hood: 'tri', hoodH: 0.55, v: i % 4 });
    K.window({ x: xc, y: 14.5, w: 1.5, h: 1.4, head: 'flat', sw: 0.14, d: 0.1, sill: false, frame: 'white', surMat: PM.white, v: (i + 2) % 4 });
  }
  for (let i = 0; i <= ni; i++) {
    const x = c0 + cp * i;
    P.cyl(PM.white, [x, 6.9, 0.6], [x, 16.0, 0.6], 0.55, 0.5, 10, false); P.cyl(PM.white, [x, 6.9, 0.6], [x, 7.3, 0.6], 0.7, 0.62, 10, true);
    P.cyl(PM.white, [x, 15.9, 0.6], [x, 16.9, 0.6], 0.55, 0.78, 8, false); P.box(PM.white, x - 0.8, x + 0.8, 16.9, 17.05, -0.2, 1.4, 'b');
    P.box(PM.white, x - 0.7, x + 0.7, 7.3, 16.0, 0, 0.12, 'kb');
  }
  P.box(PM.white, c0 - 0.9, c1 + 0.9, 17.05, 18.4, 0, 1.5, 'kb');
  // wings: roundels with busts and statue niches
  for (const wx of [len * 0.08, len * 0.15, len * 0.80, len * 0.88]) {
    P.cyl(PM.stone, [wx, 15.5, 0.05], [wx, 15.5, 0.15], 0.6, 0.6, 12, true);
    niche(K, PM, wx, 8.3, 1.2, 3.2);
  }
}

// ------------------------------------------------------------------------------------------------ the arch (gallery) over the Winter Canal (photos 059 060)
function canalArch(K, PM, ctx, svc) {
  const L = K.L, P = K.P;
  const rec = L.buildingById('r8092295'); const poly = rec.polys[0];
  const all = ringEdges(poly, 0.3);
  const cream = K.mat('#e6d3a0', { name: 'lmI-arch', paint: 0.03 }), shade = K.mat('#cdb97f');
  const cv = toWorld(-257, -286.1);
  for (const e of all) {
    const q = toUV((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), nu = e.n[0] * 0.587785 + e.n[1] * 0.809017;
    if (Math.abs(nu) < 0.9) continue;
    K.onEdgeFn(e, (len) => {
      const cx = localOnEdge(e, cv[0], cv[1]).u, R = 6.0, y0 = -0.6;
      // The water opening is a notch, not a closed Shape hole touching the
      // wall's lower edge. Triangulating that coincident edge produced pale
      // crossbars across the canal at y0, one on each face of the gallery.
      const archPoints = (r, reverse = false) => Array.from({ length: 25 }, (_, i) => {
        const a = Math.PI * (reverse ? i / 24 : 1 - i / 24);
        return [cx + Math.cos(a) * r, y0 + 0.05 + Math.sin(a) * r];
      });
      K.wallQuad(cream, 0, cx - R, y0, 14.3, 4);
      K.wallQuad(cream, cx + R, len, y0, 14.3, 4);
      const crown = new THREE.Shape();
      crown.moveTo(cx - R, y0 + 0.05);
      for (const p of archPoints(R).slice(1)) crown.lineTo(...p);
      crown.lineTo(cx + R, 14.3); crown.lineTo(cx - R, 14.3); crown.closePath();
      const crownGeo = new THREE.ShapeGeometry(crown);
      P.geo(cream, crownGeo, 0, 0, 0); crownGeo.dispose();
      // stepped rusticated ring with radial joints and a keystone
      for (const [sw, d, m] of [[1.1, 0.22, shade], [0.55, 0.36, cream]]) {
        const s = new THREE.Shape(); s.moveTo(cx - R - sw, y0);
        for (const p of archPoints(R + sw)) s.lineTo(...p);
        s.lineTo(cx + R + sw, y0); s.lineTo(cx + R, y0);
        for (const p of archPoints(R, true)) s.lineTo(...p);
        s.lineTo(cx - R, y0); s.closePath();
        P.extrude(m, s, 0, d, 1, 12);
      }
      P.box(shade, cx - 0.6, cx + 0.6, 6.0, 7.6, 0, 0.5, 'kb');
      // string course, gallery windows with iron balconettes, cornice
      P.box(PM.white, 0, len, 6.9, 7.6, 0, 0.35, 'kb');
      const n = 6, p = 3.2, g0 = cx - p * 2.5;
      for (let i = 0; i < n; i++) {
        const x = g0 + p * i;
        K.window({ x, y: 8.8, w: 1.5, h: 3.9, head: 'arch', sw: 0.3, d: 0.14, sill: false, frame: 'white', surMat: PM.white, v: i % 4 });
        K.plane(PM.grille, x - 0.85, x + 0.85, 8.8, 9.9, 0.2);
      }
      P.box(PM.white, 0, len, 13.2, 14.3, 0, 0.55, 'kb');
      // the vault of the arch (inside, along the canal)
      const D = 11.6, hs = 0.05, N = 14;
      for (let i = 0; i < N; i++) {
        const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, am = (a0 + a1) / 2;
        const p0 = [cx + Math.cos(a0) * R, hs + y0 + Math.sin(a0) * R], p1 = [cx + Math.cos(a1) * R, hs + y0 + Math.sin(a1) * R];
        P.quad(PM.interior, [p0[0], p0[1], 0], [p0[0], p0[1], -D], [p1[0], p1[1], -D], [p1[0], p1[1], 0], [-Math.cos(am), -Math.sin(am), 0]);
      }
    });
  }
  // roof: flat green with a hip, rail
  P.cap(PM.roofGreen, poly.o.reduce((r, v, i, a) => (i % 2 ? r : r.concat([[a[i], a[i + 1]]])), []), 14.6, true, 6, []);
}
