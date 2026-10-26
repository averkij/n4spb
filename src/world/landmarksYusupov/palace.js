// landmarksYusupov/palace.js - the Yusupov Palace (Vallin de la Mothe 1770s, A. Mikhailov 2nd 1830-38; OSM w123243367, levels missing: real cornice 18.5 m, docs/research/yusupov.md section 3).
// The footprint is the OSM ring (the door node that sticks 0.8 m out of the Moika front is projected back onto the line).  Moika front (89.8 m, frame x from the NE end): ochre stucco, a granite plinth 1 m,
// ground floor + piano nobile + attic floor (windows read from photo 30 at 19.7 px / m: ground 1.5..4.6, piano nobile 6.5..9.8, attic 15.0..16.7), a string course at 5 m, an entablature at 10.7..13.8 with the
// frieze of white ring roundels, the main cornice at 18.5; the NE wing (22.2 m) with a rusticated ground floor, seven round-arched windows over little balustrades, an arched door and a palmette band;
// the SIX-column smooth Roman-Doric portico (10 m, columns on 1 m granite pedestals 2.7 m in front of the wall) with a balustrade over it, the carved wooden portal with the copper canopy, lions of the arms and
// the brass plate "ЮСУПОВСКИЙ ДВОРЕЦ"; the attic block with the stucco coat of arms (two lions and a shield), the two-stage belvedere with a red-brown roof, chimneys, roof railing.
// Courtyard faces / wings: plain stucco walls with the same storeys (arched windows on the east wing).  Photos refs/yusupov 13 14 15 16 30 43 44 54 59 60 64 65 66 74.
import * as THREE from 'three';
import { BUILDINGS } from '../data/city.js';
import { buildHouse } from './house.js';
import { archPath } from './kit.js';
import { fromUD, toUD, FF, FRONT_LEN, O, D_DIR, U_DIR } from './frame.js';
import { lathe } from './geo.js';

export const HC = 18.5, UP = 0.45, TOP = HC + UP;
export const PALACE_ID = 'w123243367';
const WING = 22.2, X0 = 54.5, ZC = 2.7;                       // NE wing width, portico axis (local x), column axis distance from the wall
const COLS = [-9.4, -6.0, -2.6, 2.6, 6.0, 9.4].map((d) => X0 + d);

const flatOf = (pts) => pts.flat();
const bracketSill = (K, mat, x, y, w, d = 0.26) => {
  const P = K.P;
  P.box(mat, x - w / 2 - 0.12, x + w / 2 + 0.12, y - 0.14, y, 0, d, 'k');
  for (const s of [-1, 1]) P.box(mat, x + s * (w / 2 - 0.12) - 0.07, x + s * (w / 2 - 0.12) + 0.07, y - 0.55, y - 0.14, 0, d * 0.7, 'kb');
};

/** the palace ring: the OSM footprint with the Moika front straightened (the door vertex at (u 33.1, d -0.8) dropped) */
export function palaceRing() {
  const rec = BUILDINGS.find((b) => b.id === PALACE_ID);
  const o = rec.polys[0].o, ring = [];
  for (let i = 0; i < o.length; i += 2) {
    const x = o[i], z = o[i + 1];
    const { u, d } = toUD(x, z);
    if (Math.abs(u - 33.1) < 0.6 && Math.abs(d + 0.8) < 0.6) continue;               // the door node 0.8 m out of the front line: dropped (the front is one straight edge)
    ring.push([x, z]);
  }
  return { rec, poly: { o: flatOf(ring), h: [] }, ring };
}

// ================================================================================================ the Moika front
function column(K, M, x, zc) {
  const P = K.P, g = M.granite;
  P.box(M.graniteWarm, x - 0.95, x + 0.95, 0, 1.0, zc - 0.95, zc + 0.95, 'b');                        // the granite pedestal
  P.cyl(M.trim, [x, 1.0, zc], [x, 1.22, zc], 0.84, 0.82, 16, false);                                 // base: two tori
  P.cyl(M.trim, [x, 1.22, zc], [x, 1.48, zc], 0.76, 0.72, 16, false);
  P.cyl(M.trim, [x, 1.48, zc], [x, 9.55, zc], 0.675, 0.575, 18, false);                              // the smooth shaft (diminishing)
  P.cyl(M.trim, [x, 9.55, zc], [x, 9.75, zc], 0.62, 0.64, 16, false);                                // necking
  P.cyl(M.trim, [x, 9.75, zc], [x, 10.2, zc], 0.64, 0.92, 16, false);                                // echinus
  P.box(M.trim, x - 0.98, x + 0.98, 10.2, 10.7, zc - 0.98, zc + 0.98, 'b');                          // abacus
  void g;
}

function portico(K, M, ctx, svc) {
  const P = K.P, zf = ZC + 1.0;
  const xa = COLS[0] - 1.1, xb = COLS[5] + 1.1;
  for (const x of COLS) { column(K, M, x, ZC); }
  // platform in front of the columns (granite slabs), two steps at the door
  P.box(M.graniteWarm, xa + 0.3, xb - 0.3, 0, 0.14, 0.0, zf + 0.9, 'b');
  // entablature: architrave 10.7..11.5, frieze 11.5..12.9 (recessed), cornice 12.9..13.9 with dentils
  P.box(M.trim, xa, xb, 10.7, 11.5, 0, zf, 'k');
  P.box(M.trimWarm, xa + 0.05, xb - 0.05, 11.5, 12.9, 0, zf - 0.1, 'kb');
  K.strip(M.frieze, xa + 0.45, xb - 0.45, 11.55, 12.85, zf - 0.07, 2.2);
  P.box(K.mats.dentil, xa - 0.2, xb + 0.2, 12.9, 13.25, 0, zf + 0.2, 'kb', 0.6);
  P.box(M.trim, xa - 0.2, xb + 0.2, 13.25, 13.9, 0, zf + 0.5, 'kb');
  // balustrade over the portico (white, 6 panels between pedestals)
  const bz = zf - 0.1;
  P.box(M.trim, xa, xb, 13.9, 14.1, bz - 0.5, bz + 0.45, 'b');
  K.balustrade(xa + 0.5, xb - 0.5, 14.1, 0.95, 0.3, M.trim);
  for (const x of [xa + 0.3, xb - 0.3, X0 - 3.8, X0 + 3.8, X0]) if (x === X0) continue; else P.box(M.trim, x - 0.3, x + 0.3, 14.1, 15.15, bz - 0.45, bz - 0.0, 'b');
}

function portal(K, M, ctx, e) {
  const P = K.P, W = 1.65;
  // carved wooden door-case (photo 14: 3.3 m wide, 4.9 m to the canopy, canopy peak 6.0 m)
  P.box(M.wood, X0 - W, X0 - W + 0.34, 0.06, 4.9, 0, 0.6, 'kb');
  P.box(M.wood, X0 + W - 0.34, X0 + W, 0.06, 4.9, 0, 0.6, 'kb');
  P.box(M.wood, X0 - W, X0 + W, 4.1, 4.9, 0, 0.66, 'kb');
  // door leaves + glazing (dark glass in wooden mullions)
  P.box(M.woodDark, X0 - W + 0.34, X0 + W - 0.34, 0.06, 4.1, 0.1, 0.2, 'kb');
  for (const [a, b, y0, y1] of [[-1.1, -0.38, 1.6, 3.95], [-0.3, 0.3, 1.6, 3.95], [0.38, 1.1, 1.6, 3.95]]) P.quad(M.glassDark, [X0 + a, y0, 0.215], [X0 + b, y0, 0.215], [X0 + b, y1, 0.215], [X0 + a, y1, 0.215], [0, 0, 1]);
  for (const x of [-1.14, -0.34, 0.34, 1.14]) P.box(M.wood, X0 + x - 0.05, X0 + x + 0.05, 1.5, 4.05, 0.2, 0.26, 'kb');
  P.box(M.wood, X0 - 1.2, X0 + 1.2, 1.45, 1.6, 0.2, 0.28, 'kb'); P.box(M.wood, X0 - 1.2, X0 + 1.2, 3.95, 4.1, 0.2, 0.28, 'kb');
  for (const s of [-1, 1]) P.box(M.wood, X0 + s * 0.62 - 0.45, X0 + s * 0.62 + 0.45, 0.1, 1.4, 0.2, 0.27, 'kb');           // lower panels
  // relief of the arms in the pediment of the door-case, brass lanterns on the jambs, granite steps
  K.plane(M.arms, X0 - 1.15, X0 + 1.15, 4.12, 4.88, 0.68);
  for (const s of [-1, 1]) { P.box(M.brass, X0 + s * (W - 0.17) - 0.15, X0 + s * (W - 0.17) + 0.15, 3.1, 3.75, 0.6, 0.9, 'b'); P.box(M.dark, X0 + s * (W - 0.17) - 0.1, X0 + s * (W - 0.17) + 0.1, 3.15, 3.7, 0.62, 0.88, 'b'); }
  P.box(M.graniteWarm, X0 - 1.9, X0 + 1.9, 0, 0.17, 0.0, 1.05, 'b'); P.box(M.granite, X0 - 2.1, X0 + 2.1, 0, 0.08, 0.0, 1.3, 'b');
  // two terracotta pots with white flowers beside the steps (photo 14)
  for (const s of [-1, 1]) { const px = X0 + s * 2.05; P.cyl(M.pot, [px, 0, 1.25], [px, 0.34, 1.25], 0.2, 0.31, 10, true); P.cyl(M.pot, [px, 0.34, 1.25], [px, 0.42, 1.25], 0.33, 0.33, 10, true); P.geo(M.leafy, new THREE.SphereGeometry(0.3, 8, 5), px, 0.62, 1.25); P.geo(M.flower, new THREE.SphereGeometry(0.25, 7, 4), px, 0.78, 1.25); }
  // the curved copper canopy: a side profile (z out, y up) extruded along the door width
  const sh = new THREE.Shape();
  sh.moveTo(0, 4.9); sh.bezierCurveTo(0.2, 5.7, 0.6, 6.05, 1.0, 5.8); sh.bezierCurveTo(1.25, 5.65, 1.4, 5.4, 1.6, 5.2);
  sh.lineTo(1.55, 5.1); sh.bezierCurveTo(1.2, 5.35, 0.6, 5.2, 0, 5.0); sh.lineTo(0, 4.9);
  P.push(X0 - 1.9, 0, 0, Math.PI / 2);                          // local +x -> -z (out is -z of this frame), local +z -> +x
  const flipped = new THREE.Shape(sh.getPoints(12).map((p) => new THREE.Vector2(-p.x, p.y)));
  P.extrude(M.copper, flipped, 0, 3.8, 1, 8);
  P.pop();
  // the brass plate on the wall beside the left jamb (reserved in the facade label registry)
  const lab = ctx.services && ctx.services.labels;
  const f = e && e.frame;
  if (f) {
    const px = X0 - 2.05, py = 1.78, pw = 0.3, ph = 0.55;
    const wx = f.x + px * f.xa[0] + 0.05 * e.n[0], wz = f.z + px * f.xa[1] + 0.05 * e.n[1];
    if (!lab || lab.reserve(PALACE_ID, wx, py, wz, pw, ph, e.n[0], e.n[1], 'plate')) K.plane(M.plate, px - pw / 2, px + pw / 2, py - ph / 2, py + ph / 2, 0.045);
  }
}

function attic(K, M) {
  const P = K.P, z = -1.3, x0 = 48.6, x1 = 60.1;
  // raised central attic block behind the cornice with the coat of arms, a cornice and a low parapet
  K.wallQuad(M.wall, x0, x1, TOP, 22.0, 3, z);
  P.fan(M.wall, [[x0, TOP, z], [x0, 22.0, z], [x0, 22.0, z - 6], [x0, TOP, z - 6]], [-1, 0, 0]);
  P.fan(M.wall, [[x1, TOP, z - 6], [x1, 22.0, z - 6], [x1, 22.0, z], [x1, TOP, z]], [1, 0, 0]);
  P.box(M.trim, x0 - 0.35, x1 + 0.35, 21.65, 22.1, z - 6, z + 0.5, 'b');
  P.box(M.trim, x0, x1, TOP, TOP + 0.3, z, z + 0.1, 'kb');
  P.quad(M.trim, [x0 - 0.35, 22.1, z + 0.5], [x1 + 0.35, 22.1, z + 0.5], [x1 + 0.35, 22.1, z - 6], [x0 - 0.35, 22.1, z - 6], [0, 1, 0]);
  K.plane(M.arms, 51.9, 57.1, 19.3, 21.5, z + 0.05);
}

function tower(K, M) {
  const P = K.P, x = 44.0, z = -5.8, a = 1.65;
  P.box(M.wall, x - a, x + a, TOP, 21.5, z - a, z + a, 'b');
  P.box(M.trim, x - a - 0.15, x + a + 0.15, 21.2, 21.55, z - a - 0.15, z + a + 0.15, 'b');
  P.box(M.trimWarm, x - 0.7, x + 0.7, 19.6, 21.0, z + a, z + a + 0.04, 'kb');          // blind arched panel on the front
  // open lantern: four corner pillars, dark interior, balustrade, red-brown pyramid roof
  const pil = 0.3;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.box(M.wall, x + sx * (a - 0.3) - pil / 2, x + sx * (a - 0.3) + pil / 2, 21.55, 23.1, z + sz * (a - 0.3) - pil / 2, z + sz * (a - 0.3) + pil / 2, 'b');
  P.box(M.dark, x - a + 0.4, x + a - 0.4, 21.6, 23.0, z - a + 0.4, z + a - 0.4, 'b');
  P.box(M.trim, x - a - 0.3, x + a + 0.3, 23.1, 23.4, z - a - 0.3, z + a + 0.3, 'b');
  const R = a + 0.45, y0 = 23.4, y1 = 25.1;
  const A = [x - R, y0, z - R], B = [x + R, y0, z - R], Cc = [x + R, y0, z + R], D = [x - R, y0, z + R], T = [x, y1, z];
  P.fan(M.roof, [A, B, T], [0, 0.6, -1]); P.fan(M.roof, [B, Cc, T], [1, 0.6, 0]); P.fan(M.roof, [Cc, D, T], [0, 0.6, 1]); P.fan(M.roof, [D, A, T], [-1, 0.6, 0]);
  P.cyl(M.iron, [x, y1, z], [x, y1 + 1.5, z], 0.03, 0.01, 4, false);
}

function chimneys(K, M) {
  const P = K.P;
  for (const [x, z] of [[4.5, -9], [7.0, -9], [10.0, -9], [33, -12], [70, -12], [78, -12], [61.5, -14]]) {
    P.box(M.chimney, x - 0.45, x + 0.45, TOP, TOP + 2.2, z - 0.45, z + 0.45, 'b');
    P.box(M.chimneyCap, x - 0.55, x + 0.55, TOP + 2.2, TOP + 2.4, z - 0.55, z + 0.55, 'b');
  }
}

function moikaFront(K, M, ctx, e, c) {
  const P = K.P, len = c.len;
  e.frame = c.f;
  const rust = K.rust(M.C.rustic);
  // ---- walls
  K.wallQuad(rust, 0, WING, 0, 5.0, 2.4, 0, 1.2);
  K.wallQuad(M.wall, 0, WING, 5.0, TOP, 3);
  K.wallQuad(M.wall, WING, len, 0, TOP, 3);
  // string course, architraves, frieze, mid cornice
  P.box(M.trim, 0, len, 5.0, 5.3, 0, 0.1, 'kb');
  P.box(M.trim, 0, len, 10.7, 11.2, 0, 0.12, 'kb');
  K.strip(M.palm, 0.6, WING - 0.6, 11.25, 12.25, 0.05, 2.0);
  K.strip(M.frieze, WING + 0.3, COLS[0] - 1.3, 11.25, 12.65, 0.05, 2.2);
  K.strip(M.frieze, COLS[5] + 1.3, len - 0.4, 11.25, 12.65, 0.05, 2.2);
  P.box(K.mats.dentil, 0, len, 12.7, 13.05, 0, 0.3, 'kb', 0.6);
  P.box(M.trim, 0, len, 13.05, 13.6, 0, 0.55, 'kb');
  P.box(M.trim, 0, len, 13.6, 13.85, 0, 0.62, 'b');
  // ---- NE wing: rusticated ground floor, arched piano nobile with balustrade aprons, arched door, attic windows
  const wx = [3.0, 6.05, 9.1, 12.1, 15.15, 18.2, 21.2];
  for (const x of wx) {
    if (x !== 12.1) K.window({ x, y: 1.75, w: 1.2, h: 2.4, sw: 0.18, d: 0.08, surMat: M.trim, sill: true, frame: 'brown' });
    K.window({ x, y: 6.3, w: 1.35, h: 3.6, head: 'arch', sw: 0.2, d: 0.1, surMat: M.trim, sill: false, frame: 'brown' });
    K.balustrade(x - 0.66, x + 0.66, 5.35, 0.85, 0.2, M.trim);
  }
  K.gate(12.1, 0.0, 2.4, 4.3, { sw: 0.25, d: 0.12, ringMat: M.trim, doorMat: M.wood });
  P.box(M.granite, 12.1 - 1.6, 12.1 + 1.6, 0, 0.15, 0, 0.85, 'b'); P.box(M.granite, 12.1 - 1.8, 12.1 + 1.8, 0, 0.07, 0, 1.1, 'b');
  for (const x of [5.7, 17.9]) K.window({ x, y: 13.3, w: 1.0, h: 1.5, sw: 0.1, d: 0.05, surMat: M.trim, sill: true, frame: 'brown' });
  for (const x of [8.5, 12.1, 15.2]) K.plaque(M.trimWarm, x, 13.4, 1.1, 1.4, 0.03);                // blind panels of the attic floor
  // ---- main block: ground / piano nobile / attic windows
  const left = Array.from({ length: 7 }, (_, i) => 23.8 + 3.3 * i);
  const right = Array.from({ length: 7 }, (_, i) => 65.4 + 3.38 * i);
  const porch = [COLS[0] + 1.7, COLS[1] + 1.7, X0, COLS[3] + 1.7, COLS[4] + 1.7];
  const axes = [...left, ...porch, ...right];
  for (const x of axes) {
    if (Math.abs(x - X0) > 0.2) K.window({ x, y: 1.5, w: 1.25, h: 3.0, sw: 0.2, d: 0.08, surMat: M.trim, sill: true, frame: 'brown' });
    K.window({ x, y: 6.5, w: 1.3, h: 3.3, sw: 0.22, d: 0.1, surMat: M.trim, sill: false, frame: 'brown' });
    bracketSill(K, M.trim, x, 6.5, 1.3);
    if (x > 28) K.window({ x, y: 15.0, w: 0.95, h: 1.7, sw: 0.09, d: 0.05, surMat: M.trim, sill: true, frame: 'brown' });
    else K.plaque(M.trimWarm, x, 15.0, 0.95, 1.7, 0.03);
  }
  // ---- portico, portal, attic, tower, chimneys
  portico(K, M, ctx, K.svc);
  portal(K, M, ctx, e);
  attic(K, M); tower(K, M); chimneys(K, M);
  // yellow downpipes at the pilaster lines
  for (const x of [1.2, 22.6, 66.5, 88.6]) K.downpipe(x, 0.1, 18.3, M.wall);
  return true;
}

// ================================================================================================ the other walls (courtyard faces, wings, ends): stucco with the same storeys
function sideWall(K, M, e, c) {
  const P = K.P, len = c.len, mid = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2], { u, d } = toUD(mid[0], mid[1]);
  K.wallQuad(M.wall, 0, len, 0, TOP, 3);
  if (len < 3.2) return true;
  P.box(M.trim, 0, len, 5.0, 5.3, 0, 0.08, 'kb');
  const wing = u > 45 && d > 20, xs = K.bays(1.2, len - 1.2, 3.4);
  // the pedimented door-case of the east wing (courtyard face, photos 44 / 67): the inner faces of the wing 12..17 m long
  const inner = wing && (e.n[0] * U_DIR[0] + e.n[1] * U_DIR[1]) < -0.5 && len > 12 && len < 17;
  if (inner) { const x = len / 2; xs.splice(0, xs.length, ...xs.filter((q) => Math.abs(q - x) > 1.8)); doorCase(K, M, x); }
  for (const x of xs) {
    K.window({ x, y: 1.5, w: 1.2, h: 2.9, sw: 0.18, d: 0.07, surMat: M.trim, sill: true, frame: 'brown' });
    if (wing) K.window({ x, y: 6.4, w: 1.45, h: 3.6, head: 'arch', sw: 0.2, d: 0.1, surMat: M.trim, sill: false, frame: 'brown' });
    else K.window({ x, y: 6.5, w: 1.3, h: 3.3, sw: 0.2, d: 0.08, surMat: M.trim, sill: false, frame: 'brown' });
    if (len > 8) K.window({ x, y: 15.0, w: 0.95, h: 1.6, sw: 0.08, d: 0.05, surMat: M.trim, sill: true, frame: 'brown' });
  }
  return true;
}

function doorCase(K, M, x) {
  const P = K.P, w = 1.3;
  P.box(M.trim, x - w - 0.28, x - w, 0, 4.2, 0, 0.3, 'kb'); P.box(M.trim, x + w, x + w + 0.28, 0, 4.2, 0, 0.3, 'kb');
  P.box(M.trim, x - w - 0.3, x + w + 0.3, 4.2, 4.6, 0, 0.4, 'kb');
  const sh = new THREE.Shape(); sh.moveTo(x - w - 0.4, 4.6); sh.lineTo(x + w + 0.4, 4.6); sh.lineTo(x, 5.5); sh.lineTo(x - w - 0.4, 4.6); P.extrude(M.trim, sh, 0, 0.4, 1, 2);
  P.quad(M.woodDark, [x - w, 0.1, 0.06], [x + w, 0.1, 0.06], [x + w, 4.2, 0.06], [x - w, 4.2, 0.06], [0, 0, 1]);
  P.box(M.trimWarm, x - w, x + w, 3.1, 4.15, 0.07, 0.09, 'kb');
  P.box(M.granite, x - w - 0.4, x + w + 0.4, 0, 0.16, 0, 0.9, 'b');
}

export function build(K, ctx) {
  const { rec, poly, ring } = palaceRing();
  const M = K.M;
  K.svc.palaceRing = ring;
  const isFront = (e) => !e.hole && e.len > 80;
  buildHouse(K, {
    name: 'palace', recs: [rec], polysOf: () => [poly], hc: HC, wall: M.C.wall, court: M.C.wall, plinth: 1.0, plinthMat: M.granite, floors: [5, 5.5, 4.8, 3.2],
    corniceMat: M.trim, corniceScale: 0.78, roofMat: M.roof, railing: true, collideH: 24,
    front: (e, o) => (isFront(e) ? moikaFront(K, M, ctx, e, o) : sideWall(K, M, e, o)),
  });
  // services: entrances (door nodes), crowd / photo spots on the quay side, colliders for the columns
  const door = fromUD(35.25, 0);
  const nrm = [-D_DIR[0], -D_DIR[1]], rot = Math.atan2(nrm[0], nrm[1]);
  K.svc.entrances.push({ x: door.x + nrm[0] * 0.6, z: door.z + nrm[1] * 0.6, rotY: rot, bldg: PALACE_ID, name: 'Юсуповский дворец: главный вход' });
  K.svc.entrances.push({ x: fromUD(77.7, 0).x + nrm[0] * 0.6, z: fromUD(77.7, 0).z + nrm[1] * 0.6, rotY: rot, bldg: PALACE_ID, name: 'Юсуповский дворец: арочная дверь' });
  const ph = ctx.physics;
  // columns: local x = X0 + dx runs to the SW, i.e. u = FRONT_LEN - x
  for (const x of COLS) { const w = fromUD(FRONT_LEN - x, -ZC); ph.addCylinder(w.x, w.z, 0.78, 0, 11); }
  K.svc.crowd.push({ x: door.x + nrm[0] * 6, z: door.z + nrm[1] * 6, r: 6, n: 7, name: 'portico' });
  K.svc.monuments.push({ id: PALACE_ID, name: 'Юсуповский дворец', x: fromUD(45, 30).x, z: fromUD(45, 30).z, h: 22 });
  K.svc.photoSpots.push({ x: door.x + nrm[0] * 13, z: door.z + nrm[1] * 13, yaw: Math.round(Math.atan2(-D_DIR[0], -D_DIR[1]) * 180 / Math.PI), name: 'Юсуповский дворец: фасад на Мойке' });
  void O; void archPath; void lathe;
}
