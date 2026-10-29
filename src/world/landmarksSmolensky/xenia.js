// landmarksSmolensky/xenia.js - the CHAPEL OF ST XENIA OF PETERSBURG (Часовня блаженной Ксении Петербургской, Kamskaya 24 litB; A. A. Vseslavin 1901-02; OSM w101398309, 13.7 x 9.8 m).
// Dossier docs/research/smolensky.md section 5 (+ critic log 14b no. 10), photos refs/smolensky 26 28 19 20 25 c10 c12 c13 c15 156 157: pebble-dash pale-green walls on a dark-green socle and a light-grey granite plinth,
// a white stepped cornice, three white-framed lancet windows with amber icon glass and white colonettes on every face (two white relief crosses beside the group, three small tile panels under it), semicircular
// kokoshnik gables with gold-ground mosaic icons on the two ends, a low dark hip with 8 ring dormers, an upper cube with round windows and framed panels, a dark octagonal tent of diamond scale shingles
// with kokoshnik dormers, a dark drum and the gilded onion with its cross (total 17.0 m: the bracket of the photos is 15.7-18.6 m).  A low annex (the vestibule) with its own small tent at the WSW end, the pointed
// door hood on the NNW face next to the junction.  Frame XE: +X ENE, +Z SSE (frame.js): hall X 3.9..13.7 x Z 0..9.8, annex X 0..3.9.  Closed solid building (the pilgrims queue along the NNW wall).
// Plaza: the paved ring (OSM w101415904) is laid with herringbone pavers (a hole where the chapel stands); lamps / benches / flowers are in furniture.js.
import * as L from '../layout.js';
import { XE } from './frame.js';
import { fillPolyFine as _fpf } from './surfaces.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { fillPolyFine } from './surfaces.js';
import { roadPts, ringOf } from './data.js';
import { addPolyColliders } from '../lib/massing.js';

const HX0 = 3.9, HX1 = 13.7, HZ0 = 0, HZ1 = 9.8, CX = 8.8, CZ = 4.9, WD = HX1 - HX0;     // hall rectangle and its centre
const Y = { plinth: 0.5, socle: 2.6, cornice0: 5.95, eave: 7.4, cube0: 8.0, cube1: 9.8, tent1: 13.3, drum1: 14.0, onion1: 16.1 };

/** pointed (lancet) outline: bottom y0, total height h, width w, centre cx (two arcs of radius w meeting at the apex) */
function lancet(cx, y0, w, h, n = 6) {
  const hs = Math.max(0.05, h - 0.866 * w), pts = [[cx - w / 2, y0], [cx + w / 2, y0], [cx + w / 2, y0 + hs]];
  for (let i = 1; i < n; i++) { const t = Math.PI / 3 * i / n; pts.push([cx - w / 2 + w * Math.cos(t), y0 + hs + w * Math.sin(t)]); }
  pts.push([cx, y0 + h]);
  for (let i = n - 1; i >= 1; i--) { const t = Math.PI / 3 * i / n; pts.push([cx + w / 2 - w * Math.cos(t), y0 + hs + w * Math.sin(t)]); }
  pts.push([cx - w / 2, y0 + hs]);
  return pts;
}
const circlePts = (cx, cy, r, n = 16) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i * Math.PI * 2 / n) * r, cy + Math.sin(i * Math.PI * 2 / n) * r]);

/** the window group of a face (frame: x right, z out, wall at z = 0): three lancets with colonettes, sill, two relief crosses, three small tile panels */
function windowGroup(P, M, cx) {
  for (const [x, w, h] of [[cx, 1.0, 2.8], [cx - 1.0, 0.7, 2.4], [cx + 1.0, 0.7, 2.4]]) {
    G.planeShape(P, M.amber, lancet(x, 3.2, w, h), 0.03);
    G.frameRing(P, M.xWhite, lancet(x, 3.1, w + 0.26, h + 0.2), lancet(x, 3.2, w, h), 0, 0.09, 1);
  }
  for (const s of [-1, 1]) P.col(M.xWhite, cx + s * 0.5, 0.1, 3.2, 5.7, 0.1, 0.09, 8, false);          // round colonettes between the lancets
  P.box(M.xWhite, cx - 1.75, cx + 1.75, 3.0, 3.16, 0, 0.17, '');                                     // sill band
  for (const s of [-1, 1]) {                                                                          // two white relief crosses (0.8 x 1.4 m) beside the group
    const x = cx + s * 2.65;
    P.box(M.xWhite, x - 0.07, x + 0.07, 3.7, 5.1, 0, 0.07, ''); P.box(M.xWhite, x - 0.3, x + 0.3, 4.55, 4.69, 0, 0.07, '');
  }
  G.pane(P, M.medallion, cx - 0.2, cx + 0.2, 2.9, 3.14, 0.03);                                       // the cross medallion in the middle, brown lattice vents on the sides
  for (const s of [-1, 1]) P.box(M.xBrown, cx + s * 1.0 - 0.3, cx + s * 1.0 + 0.3, 2.95, 3.12, 0, 0.04, 'b');
}
/** the four faces of the hall: fn runs in the facade frame (x right, z out) of the face (frame XE coordinates) */
const faceNNW = (P, fn) => G.onFace(P, HX1, HZ0, 0, -1, fn);
const faceSSE = (P, fn) => G.onFace(P, HX0, HZ1, 0, 1, fn);
const faceENE = (P, fn) => G.onFace(P, HX1, HZ1, 1, 0, fn);
const faceWSW = (P, fn) => G.onFace(P, HX0, HZ0, -1, 0, fn);

/** a low hip roof: outer rectangle (x0..x1, z0..z1) at y0 up to the inner rectangle (ix0..ix1, iz0..iz1) at y1 */
function hip(P, mat, x0, x1, z0, z1, ix0, ix1, iz0, iz1, y0, y1) {
  const q = (a, b, c, d, n) => P.quad(mat, a, b, c, d, n, [a, b, c, d].map((p) => [p[0], p[2]]));
  q([x0, y0, z1], [x1, y0, z1], [ix1, y1, iz1], [ix0, y1, iz1], [0, 0.55, 0.83]);
  q([x1, y0, z0], [x0, y0, z0], [ix0, y1, iz0], [ix1, y1, iz0], [0, 0.55, -0.83]);
  q([x1, y0, z1], [x1, y0, z0], [ix1, y1, iz0], [ix1, y1, iz1], [0.83, 0.55, 0]);
  q([x0, y0, z0], [x0, y0, z1], [ix0, y1, iz1], [ix0, y1, iz0], [-0.83, 0.55, 0]);
  q([ix0, y1, iz1], [ix1, y1, iz1], [ix1, y1, iz0], [ix0, y1, iz0], [0, 1, 0]);
  q([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0]);
}

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  P.push(XE.x, 0, XE.z, XE.rot);
  // ---- plinth, socle, walls, belts (hall)
  P.box(M.xPlinth, HX0 - 0.06, HX1 + 0.06, 0, Y.plinth, HZ0 - 0.06, HZ1 + 0.06, 'b');
  P.box(M.xGreenDark, HX0, HX1, Y.plinth, Y.socle, HZ0, HZ1, 'b');
  P.box(M.xGreen, HX0, HX1, Y.socle, Y.cornice0, HZ0, HZ1, '');
  P.box(M.xWhite, HX0 - 0.05, HX1 + 0.05, Y.socle - 0.05, Y.socle + 0.12, HZ0 - 0.05, HZ1 + 0.05, '');              // white belt on the socle
  P.box(M.xWhite, HX0 - 0.1, HX1 + 0.1, Y.cornice0, Y.cornice0 + 0.18, HZ0 - 0.1, HZ1 + 0.1, 'b');                // the broad white frieze band (stepped), pale-green sunk panels and vent slots on it
  P.box(M.xWhite, HX0 - 0.16, HX1 + 0.16, Y.cornice0 + 0.18, Y.eave - 0.16, HZ0 - 0.16, HZ1 + 0.16, '');
  P.box(M.xBrown, HX0 - 0.42, HX1 + 0.42, Y.eave - 0.16, Y.eave, HZ0 - 0.42, HZ1 + 0.42, '');                       // the dark brown eave moulding
  for (const f of [faceNNW, faceSSE, faceENE, faceWSW]) f(P, () => {
    for (const x of [0.9, WD - 0.9]) P.box(M.xGreen, x - 0.38, x + 0.38, Y.cornice0 + 0.34, Y.eave - 0.3, 0.16, 0.19, '');
    for (const x of [2.6, 3.9, 5.2, 6.5, 7.8]) P.box(M.xGreen, x - 0.32, x + 0.32, Y.cornice0 + 0.6, Y.cornice0 + 0.82, 0.16, 0.19, '');
  });
  // ---- low dark hip over the hall (rises from the cornice to the upper cube) with 8 ring dormers
  hip(P, M.roofDark, HX0 - 0.4, HX1 + 0.4, HZ0 - 0.4, HZ1 + 0.4, CX - 2.9, CX + 2.9, CZ - 2.9, CZ + 2.9, Y.eave, Y.cube0);
  const dorm = (x, z, rot) => { P.push(x, Y.eave + 0.2, z, rot); P.box(M.xBrown, -0.42, 0.42, 0, 0.62, -0.3, 0.3, 'b'); P.box(M.dark, -0.2, 0.2, 0.05, 0.5, 0.29, 0.31, ''); P.pop(); };
  for (const s of [-1, 1]) {
    dorm(CX + s * 1.6, CZ - 3.45, Math.PI); dorm(CX + s * 1.6, CZ + 3.45, 0); dorm(CX - 3.45, CZ + s * 1.6, -Math.PI / 2); dorm(CX + 3.45, CZ + s * 1.6, Math.PI / 2);
  }
  // ---- upper cube 5.4 m: two round windows and a framed panel per face, dark brown cornice
  P.box(M.xGreen, CX - 2.7, CX + 2.7, Y.cube0, Y.cube1 - 0.3, CZ - 2.7, CZ + 2.7, 'b');
  P.box(M.xBrown, CX - 2.9, CX + 2.9, Y.cube1 - 0.3, Y.cube1, CZ - 2.9, CZ + 2.9, '');
  const cubeFace = (rot, fx, fz) => {
    P.push(fx, 0, fz, rot);
    for (const s of [-1, 1]) { P.push(s * 1.5, 0, 0, 0); S.roundWin(P, M, M.dark, 0, Y.cube0 + 0.8, 0.4, { rimMat: M.xWhite }); P.pop(); }
    P.box(M.xWhite, -0.5, 0.5, Y.cube0 + 0.2, Y.cube1 - 0.45, 0, 0.07, '');
    P.box(M.xGreen, -0.38, 0.38, Y.cube0 + 0.32, Y.cube1 - 0.57, 0.07, 0.09, '');
    P.pop();
  };
  cubeFace(0, CX, CZ + 2.7); cubeFace(Math.PI, CX, CZ - 2.7); cubeFace(Math.PI / 2, CX + 2.7, CZ); cubeFace(-Math.PI / 2, CX - 2.7, CZ);
  P.box(M.xGreen, CX + 1.4, CX + 2.35, Y.cube1, Y.cube1 + 0.55, CZ + 0.8, CZ + 1.7, 'b');                          // the vent box on the cube roof (black hood)
  P.box(M.xBrown, CX + 1.35, CX + 2.4, Y.cube1 + 0.55, Y.cube1 + 0.72, CZ + 0.75, CZ + 1.75, 'b');
  // ---- tent, dormers, drum, onion, cross
  G.frustum(P, M.xTent, CX, CZ, Y.cube1, Y.tent1, 8, 3.03, 0.81, -Math.PI / 8, 3, 4, {});
  for (let k = 0; k < 4; k++) {                                                                                  // kokoshnik dormers on the four cardinal faces of the tent
    P.push(CX, 0, CZ, k * Math.PI / 2); P.push(0, 10.7, 2.2, 0);
    S.kokoshnik(P, M, M.xGreen, 0, 0, 0.9, 1.0, { bw: 0.14, trim: M.xWhite });
    P.pop(); P.pop();
  }
  G.tube(P, M.xBrown, CX, CZ, Y.tent1 - 0.05, Y.tent1 + 0.08, 0.98, 0.98, 8, 1, 1, { capTop: M.xBrown });
  G.frustum(P, M.xDrum, CX, CZ, Y.tent1 + 0.08, Y.drum1, 8, 0.95, 0.85, -Math.PI / 8, 1, 1, { capTop: M.xDrum });
  G.tube(P, M.xBrown, CX, CZ, Y.drum1 - 0.12, Y.drum1, 1.05, 1.05, 8, 1, 1, { capTop: M.xBrown });
  G.onion(P, M.xGold, CX, Y.drum1, CZ, 0.943, 0.99, 20, 14);
  S.crossOn(P, M.xGold, CX, Y.onion1 - 0.1, CZ, 1.6);
  // ---- faces: window groups on all four, the kokoshnik gables above the cornice on the two ends
  for (const f of [faceNNW, faceSSE, faceWSW]) f(P, () => windowGroup(P, M, WD / 2));          // (the ENE end wall carries the burial plaque instead: catalogue 3.1, photos sd372 sd373 sd380)
  const kok = (f) => f(P, () => {                                                                               // Christ on the ENE end, Xenia on the WSW end above the annex roof ([?] critic log: reverse of the first draft)
    P.push(0, Y.eave - 0.02, 0, 0);
    S.kokoshnik(P, M, M.xGreen, WD / 2, 0, 5.2, 2.6, { bw: 0.3, trim: M.xWhite });
    P.push(WD / 2, 1.3, 0.03, 0); G.planeShape(P, M.kokoshnik, circlePts(0, 0, 0.5), 0); P.pop();
    P.pop();
  });
  kok(faceENE); kok(faceWSW);
  // ---- door hood on the NNW face next to the junction (hall X 5.0), brown door 1.0 x 2.2, white hours plate beside it
  faceNNW(P, () => {
    const x = HX1 - 5.0;
    P.box(M.xDoor, x - 0.5, x + 0.5, 0.5, 2.7, 0.0, 0.04, '');
    P.push(x, 0.45, 0, 0); G.solid(P, M.xBrown, S.bandPts(S.hoodPath(2.6, 3.1), S.hoodPath(2.2, 2.8)), 0, 0.95, 1); P.pop();
    P.push(HX1 - 6.9, 0, 0, 0); P.quad(M.xHours, [-0.25, 1.3, 0.03], [0.25, 1.3, 0.03], [0.25, 1.65, 0.03], [-0.25, 1.65, 0.03], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.pop();
  });
  faceENE(P, () => {                                                                                             // the burial plaque 0.5 x 1.24 m at 1.75 .. 3.0 m in a stepped arched niche (1.25 .. 3.4 m) on the end wall; white belt at 2.6 m runs behind it
    const x0 = 4.9;
    G.frameRing(P, M.xWhite, G.archPts(x0, 1.25, 1.04, 2.15, 8), G.archPts(x0, 1.37, 0.8, 1.95, 8), 0, 0.09, 1);
    G.planeShape(P, M.xBurial, G.archPts(x0, 1.75, 0.5, 1.24, 8), 0.05);
    P.box(M.xWhite, x0 - 0.9, x0 + 0.9, 1.15, 1.25, 0, 0.14, '');
  });
  // ---- annex (vestibule, X 0 .. 3.9): socle + pale walls, dark hip, small cube, small tent, own plain door on the NNW wall
  P.box(M.xPlinth, -0.06, HX0, 0, Y.plinth, HZ0 - 0.06, HZ1 + 0.06, 'br');
  P.box(M.xGreenDark, 0, HX0, Y.plinth, Y.socle, HZ0, HZ1, 'br');
  P.box(M.xGreen, 0, HX0, Y.socle, 4.7, HZ0, HZ1, 'r');
  P.box(M.xWhite, -0.05, HX0, Y.socle - 0.05, Y.socle + 0.12, HZ0 - 0.05, HZ1 + 0.05, 'r');
  P.box(M.xWhite, -0.2, HX0 + 0.05, 4.7, 5.0, HZ0 - 0.2, HZ1 + 0.2, '');
  hip(P, M.roofDark, -0.25, HX0 + 0.05, HZ0 - 0.25, HZ1 + 0.25, 0.9, 3.0, CZ - 1.1, CZ + 1.1, 5.0, 5.9);
  P.box(M.xGreen, 0.95, 2.95, 5.9, 6.6, CZ - 1.0, CZ + 1.0, 'b'); P.box(M.xBrown, 0.85, 3.05, 6.6, 6.78, CZ - 1.1, CZ + 1.1, '');
  G.frustum(P, M.xTent, 1.95, CZ, 6.78, 8.6, 8, 1.28, 0.3, -Math.PI / 8, 2, 3, {});
  G.onion(P, M.xGold, 1.95, 8.45, CZ, 0.2, 0.9, 12, 8);
  S.crossOn(P, M.xGold, 1.95, 8.9, CZ, 1.0);
  P.push(1.6, 0, HZ0 - 0.02, Math.PI); P.box(M.xDoor, -0.5, 0.5, 0.5, 2.6, 0, 0.05, ''); P.pop();
  P.pop();
  // ---- collider: the footprint rectangle (closed building)
  const b = L.buildingById('w101398309');
  if (b && b.polys[0]) addPolyColliders(ctx, b.polys[0], 0, 20, 0.6); else XE.box(ph, 6.85, 4.9, 13.7, 9.8, 0, 20);
  pilgrimProps(K);
  // ---- services
  const door = XE.W(2.0, -0.3), ctr = XE.W(CX, CZ);
  K.svc.entrances.push({ id: 'n4499302854', x: door.x, z: door.z, rotY: XE.rot + Math.PI, name: 'Часовня блаженной Ксении' });
  const D = (u, v, r, n) => { const p = XE.W(u, v); K.svc.crowd.push({ id: `xenia-${K.svc.crowd.length}`, x: p.x, z: p.z, r, n, kind: 'pilgrims' }); };
  D(15.2, 4.9, 2.4, 15); D(8.8, -3.8, 3, 8); D(5.0, -2.2, 1.8, 5); D(18.0, 10.5, 3.5, 6);          // plaque end (15 people shoulder to shoulder), the walking column, the door, the forecourt
  K.svc.birds = (K.svc.birds || []).concat([{ id: 'xenia-pigeons', kind: 'pigeon', x: XE.W(19.0, 3.0).x, z: XE.W(19.0, 3.0).z, r: 5, n: 45 }]);       // [request to the wildlife owner] 40-60 pigeons on the sand-clay forecourt (sd122)
  const sp = XE.W(10, -9);
  K.svc.photoSpots.push({ x: sp.x, z: sp.z, yaw: L.yawToward(sp.x, sp.z, ctr.x, ctr.z), name: 'Часовня блаженной Ксении Петербургской' });
  K.svc.monuments.push({ id: 'w101398309', name: 'Часовня блаженной Ксении Петербургской', x: ctr.x, z: ctr.z, h: 17 });
  plaza(K);
}

/** the plaza paving: the mapped ring path w101415904 (a closed ring of 7 vertices) paved with herringbone pavers, a hole round the chapel footprint */
function plaza(K) {
  const ring = ringOf(roadPts('w101415904'));
  if (!ring || ring.length < 3) return;
  const hole = [[-0.9, -0.9], [14.6, -0.9], [14.6, 10.7], [-0.9, 10.7]].map(([u, v]) => { const p = XE.W(u, v); return [p.x, p.z]; });
  fillPolyFine(K.P, K.M.pavers, ring, 0.06, { maxEdge: 4, tile: 2, holes: [hole] });
}

/** the pilgrim details at the chapel (catalogue 3.1, photos sd373 sd147 sd001 sd380): the iron candle box and the note box ДЛЯ ЗАПИСОК in a lyre-scroll frame under the plaque, two white pails and a red grave lamp,
 *  the bronze hooded statue of the saint on setts with a heap of cut flowers, the salvia bed of the Iossa grave with its white cross.  No rails, ropes or stanchions (none in 15 photos). */
function pilgrimProps(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  const mat = (key, w, h, fn, o = {}) => { const m = ctx.mat.toon('#ffffff', { map: ctx.tex.draw(w, h, fn, { key, repeat: [1, 1] }), name: key + 'M', paint: 0, polygonOffset: -3, ...o }); M.decals.add(m); return m; };
  const note = mat('lmsmol-noteBox', 128, 160, (g, w, h) => { g.fillStyle = '#1c1b1c'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f0e8'; g.textAlign = 'center'; g.textBaseline = 'middle'; ctx.tex.fitText(g, 'ДЛЯ', w / 2, h * 0.36, w - 16, 34, ctx.tex.FONTS.sans, 700); ctx.tex.fitText(g, 'ЗАПИСОК', w / 2, h * 0.64, w - 10, 30, ctx.tex.FONTS.sans, 700); });
  const iossa = mat('lmsmol-iossaDie', 128, 160, (g, w, h) => { g.fillStyle = '#c9c4b4'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4f2ea'; g.textAlign = 'center'; g.textBaseline = 'middle'; ctx.tex.fitText(g, 'Архитекторъ', w / 2, h * 0.2, w - 12, 20, ctx.tex.FONTS.serif, 700); ctx.tex.fitText(g, 'Андрей Николаевичъ', w / 2, h * 0.42, w - 8, 16, ctx.tex.FONTS.serif, 700); ctx.tex.fitText(g, 'IОССА', w / 2, h * 0.68, w - 20, 34, ctx.tex.FONTS.serif, 700); });
  // ---- the candle box and the note box at the foot of the plaque (ENE end wall: frame XE, wall plane X = 13.7, out = +X)
  const q = XE.W(14.1, 4.9);
  P.push(q.x, 0, q.z, XE.rot + Math.PI / 2);                                                 // local +z = out of the ENE wall (XE +X)
  P.box(M.barBlack, -0.5, 0.5, 0.0, 0.55, -0.2, 0.2, 'b');                                  // the iron stand / frame (lyre scrolls drawn by the plate below)
  P.box(M.barBlack, -0.45, 0.45, 0.55, 0.95, -0.25, 0.25, 'b'); P.box(M.barBlack, -0.45, 0.45, 0.95, 1.03, -0.22, 0.22, 'b');   // the barrel-vaulted candle chest 0.9 x 0.5 x 0.6
  P.box(M.dark, -0.4, 0.4, 0.6, 0.9, 0.245, 0.26, '');                                      // its hinged front, open on the candle trays
  P.quad(note, [-0.18, 0.62, 0.3], [0.18, 0.62, 0.3], [0.18, 1.3, 0.3], [-0.18, 1.3, 0.3], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);   // the drop-box ДЛЯ ЗАПИСОК (0.4 x 0.3 x 0.7, behind)
  P.box(M.barBlack, -0.2, 0.2, 0.6, 1.3, 0.2, 0.3, 'f');
  for (const [dx, c] of [[-0.62, M.plate], [0.64, M.plate]]) { P.col(c, dx, 0.1, 0.0, 0.3, 0.14, 0.15, 8, true); }                    // two white plastic pails for the wax stubs
  P.col(M.flowerRed, 0.8, 0.45, 0.0, 0.14, 0.04, 0.05, 6, true);                              // a red grave lamp
  P.pop();
  { const w = XE.W(14.1, 4.9); ph.addBox(w.x, w.z, 0.6, 1.2, XE.rot + Math.PI / 2, 0, 1.1); }
  // ---- the bronze statue of the saint (a hooded figure about 1.7 m, no face) on granite setts with a heap of cut flowers
  const s = XE.W(14.6, 1.7);
  P.push(s.x, 0, s.z, XE.rot + Math.PI / 2);
  P.box(M.granite, -0.55, 0.55, 0, 0.12, -0.55, 0.55, 'b');
  // review 2026-10-09: the first version was a tall brown cone with two black eye slits and a staff, which read as a hooded ghost; the saint (sd147) is a gentle bronze woman in a shawl and kerchief, her arms full of flowers
  G.frustum(P, M.bronze, 0, 0, 0.12, 1.22, 10, 0.37, 0.27, 0, 1, 2, {}); S.sph(P, M.bronzeShawl, 0, 1.27, 0.0, 0.31, 0.17, 0.25, 8);
  S.sph(P, M.bronzeShawl, 0, 1.5, -0.02, 0.2, 0.23, 0.21, 8); S.sph(P, M.bronzeFace, 0, 1.47, 0.12, 0.105, 0.135, 0.075, 8);       // the kerchief and a smooth pale-bronze oval of the face (no features: no eyes, no mouth)
  P.box(M.bronze, -0.3, -0.19, 0.86, 1.14, 0.12, 0.3, ''); P.box(M.bronze, 0.19, 0.3, 0.86, 1.14, 0.12, 0.3, '');       // forearms folded in front, under the bouquets
  { const BQ = [M.flowerWhite, M.flowerPink, M.flowerRed, M.flower, M.flowerWhite, M.flowerPink];             // bouquets held against the chest (sd147: the figure is almost buried in cut flowers)
    for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = 0.07 + (i % 5) * 0.05; S.sph(P, BQ[i % 6], Math.cos(a) * rr * 1.5, 0.84 + (i % 7) * 0.065, 0.36 + Math.sin(a) * rr * 0.5, 0.09, 0.075, 0.09, 5); }
    for (let i = 0; i < 6; i++) S.sph(P, M.leafGreen, (i - 2.5) * 0.12, 0.8 + (i % 3) * 0.1, 0.32 + (i % 2) * 0.05, 0.08, 0.1, 0.05, 5); }
  const FL = [M.flowerRed, M.flowerPink, M.flowerWhite, M.flower];
  for (let i = 0; i < 30; i++) { const a = i * 2.4, rr = 0.15 + (i % 7) * 0.07; S.sph(P, FL[i % 4], Math.cos(a) * rr + 0.05, 0.16 + (i % 5) * 0.04, 0.45 + Math.sin(a) * rr * 0.6, 0.1, 0.07, 0.1, 5); }   // roses, chrysanthemums, lilies laid at the feet
  P.pop();
  ph.addCylinder(s.x, s.z, 0.45, 0, 1.8);
  // ---- the Iossa grave: a granite kerb frame 2.2 x 1.7 m, a scarlet salvia bed, a white stone cross on a three-tier pedestal with the architect's name on the die (sd001)
  const g = XE.W(6.6, 12.2);
  P.push(g.x, 0, g.z, XE.rot);
  for (const [x0, x1, z0, z1] of [[-1.1, 1.1, -0.85, -0.7], [-1.1, 1.1, 0.7, 0.85], [-1.1, -0.95, -0.7, 0.7], [0.95, 1.1, -0.7, 0.7]]) P.box(M.kerb, x0, x1, 0, 0.2, z0, z1, 'b');
  P.quad(M.soil, [-0.95, 0.12, 0.7], [0.95, 0.12, 0.7], [0.95, 0.12, -0.7], [-0.95, 0.12, -0.7], [0, 1, 0]);
  for (let i = 0; i < 70; i++) { const a = i * 2.39, rr = Math.sqrt(i / 70) * 0.85; S.sph(P, M.flowerRed, Math.cos(a) * rr * 1.05, 0.2 + (i % 4) * 0.02, Math.sin(a) * rr * 0.78, 0.07, 0.06, 0.07, 5); }
  P.box(M.stonePale, -0.5, 0.5, 0, 0.18, -0.35, 0.35, 'b'); P.box(M.stonePale, -0.4, 0.4, 0.18, 0.36, -0.28, 0.28, 'b'); P.box(M.stonePale, -0.32, 0.32, 0.36, 1.1, -0.22, 0.22, 'b');
  P.quad(iossa, [-0.26, 0.45, 0.225], [0.26, 0.45, 0.225], [0.26, 1.0, 0.225], [-0.26, 1.0, 0.225], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.box(M.stonePale, -0.07, 0.07, 1.1, 2.3, -0.07, 0.07, 'b'); P.box(M.stonePale, -0.4, 0.4, 1.7, 1.84, -0.06, 0.06, ''); P.box(M.stonePale, -0.24, 0.24, 2.0, 2.1, -0.05, 0.05, '');
  P.pop();
  ph.addBox(g.x, g.z, 2.3, 1.8, XE.rot, 0, 1.2);
  K.svc.monuments.push({ id: 'xenia-saint', name: 'Статуя блаженной Ксении у часовни', x: s.x, z: s.z, h: 1.7 });
}
