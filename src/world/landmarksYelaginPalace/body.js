// landmarksYelaginPalace/body.js - the body of the palace: four plaster walls with real window openings (extruded Shapes with holes, panes at the back of the reveal, casings), the Corinthian
// colonnades of the west front (14 columns) and of the two east pavilions (8), the entablatures with dentils, the two pedimented pavilions, the roofs and the attic block with its six small columns.
// Frame PA (frame.js): u south, w west, y above the lawn; F = 2.8 = the floor level.  Dossier 5.1 - 5.4; photos pal_01 pal_04 pal_05 pal_06 lion_05 pal_07.
import * as THREE from 'three';
import { PA, W, F, H, P as PL } from './frame.js';
import { holedWall, pane, surround, archSurround, pilaster } from './facade.js';
import { corinthian, entablature, pediment, cornice, balustrade } from './orders.js';
import { geosOf, put } from './objs.js';

const L = PL.halfLen;                       // 23.65
const WD = 0.4;                             // wall thickness
const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginPalace] body/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

/** the column sets (made once): west / pavilion columns 7.4 m, rotunda 8.3 m, attic columns */
export function columnSets(K) {
  if (K.shared.cols) return K.shared.cols;
  const M = K.M;
  K.shared.cols = {
    c74: geosOf((P) => corinthian(P, M.whiteFlat, H.col, { bellMat: M.shade })),
    c83: geosOf((P) => corinthian(P, M.whiteFlat, H.colE, { bellMat: M.shade })),
    c31: geosOf((P) => corinthian(P, M.whiteFlat, 3.1, { s: 0.5, seg: 14, bellMat: M.shade })),
  };
  return K.shared.cols;
}

/** run fn(P) in the frame whose origin is the palace point (u, w) turned so that local +z points out of a face: 'W' west (out = +w), 'E' east, 'N', 'S' */
function face(K, which, fn) {
  const P = K.P;
  const o = { W: [0, 0, PA.rot], E: [0, PL.wallE, Math.PI / 2], N: [-L, 0, Math.PI], S: [L, 0, 0] }[which];
  const p = W(o[0], o[1]);
  P.push(p.x, 0, p.z, o[2]);
  try { fn(); } finally { P.pop(); }
}

/** openings of a wall: [{ x0, x1, y0, y1 } | { cx, y0, w, h, arch: true }] + the glazing / casing */
function windows(K, holes, o = {}) {
  const P = K.P, M = K.M;
  for (const h of holes) {
    pane(P, M[h.mat || 'winSq'], h, WD);
    if (h.arch) archSurround(P, M.white, h, { sw: 0.26, proud: 0.09 });
    else {
      surround(P, M.white, h, { sw: 0.2, proud: 0.07, sill: h.sill ?? 0.12 });
      if ((h.sill ?? 0) >= 0.14) { P.box(M.white, h.x0 - 0.32, h.x1 + 0.32, h.y1 + 0.2, h.y1 + 0.3, 0, 0.2, 'k', 3); P.box(M.white, h.x0 - 0.26, h.x1 + 0.26, h.y1 + 0.3, h.y1 + 0.42, 0, 0.14, 'k', 3); }       // the small cornice over the ground-floor windows
    }
  }
  void o;
}

const rect = (cx, y0, w, h, mat = 'winSq', sill) => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, mat, sill });
const arch = (cx, y0, w, h, mat = 'winArch') => ({ cx, y0, w, h, arch: true, mat });

function westWall(K) {
  const P = K.P, M = K.M, holes = [];
  for (const u of PL.arch) holes.push(arch(u, F + 0.06, 2.0, 3.8, u === 0 ? 'winDoor' : 'winArch'));
  for (const s of [-1, 1]) {
    for (const u of [10.2, 13.6]) holes.push(rect(s * u, F + 0.6, 1.3, 2.5, 'winSq', 0.14));
    holes.push(rect(s * 18.9, F + 0.5, 1.4, 2.6, 'winSq', 0.14));
  }
  for (const u of [0, 3.4, 6.8, 10.2, 13.6, 18.9]) for (const s of u ? [-1, 1] : [1]) holes.push(rect(s * u, F + H.sill, 1.3, 2.0, 'winSq', 0.1));
  face(K, 'W', () => {
    holedWall(P, M.wall, -L, L, F, F + H.ent, holes, { depth: WD, uvs: 3 });
    windows(K, holes);
    // skirting + the string course under the upper windows, pilaster strips behind the columns
    P.box(M.limestone, -L - 0.05, L + 0.05, F, F + 0.4, 0, 0.1, 'kb', 1.8);
    P.box(M.white, -L, L, F + H.sill - 0.35, F + H.sill - 0.1, 0, 0.1, 'k', 3);
    for (const u of [...PL.singles, ...PL.pairs]) pilaster(P, M.white, u, F + 0.4, F + H.ent - 0.2, { w: 0.9, proud: 0.1, capH: 0.25, base: 0.1 });
    for (const u of [-12.3, 12.3]) { P.cyl(M.dark, [u, F + 0.3, 0.17], [u, F + H.ent, 0.17], 0.045, 0.045, 6, false); for (let y = 1.2; y < H.ent; y += 1.9) P.box(M.dark, u - 0.07, u + 0.07, F + y, F + y + 0.07, 0.05, 0.2, 'k', 1); }     // the grey downpipes
    // blind half-moons (stucco lunettes with a palmette fan) over the lower windows of the pavilions
    for (const s of [-1, 1]) P.quad(M.lunette, [s * 18.9 - 1.1, F + 3.5, 0.04], [s * 18.9 + 1.1, F + 3.5, 0.04], [s * 18.9 + 1.1, F + 4.65, 0.04], [s * 18.9 - 1.1, F + 4.65, 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // the entablature over the colonnade + the soffit of the portico
    entablature(P, M, -L - 1.24, L + 1.24, F + H.ent, PL.colW, 0);
    P.quad(M.soffit, [-L - 1.24, F + H.ent, 0], [L + 1.24, F + H.ent, 0], [L + 1.24, F + H.ent, PL.colW + 0.62], [-L - 1.24, F + H.ent, PL.colW + 0.62], [0, -1, 0]);
  });
}

function eastWall(K) {
  const P = K.P, M = K.M, holes = [];
  // the middle (|u| < 5.6) is hidden by the rotunda: no holes there; windows between the rotunda and the pavilions, and in the pavilions
  for (const u of [9.5, 12.5]) for (const s of [-1, 1]) holes.push(rect(s * u, F + 0.6, 1.3, 2.5, 'winSq', 0.14));
  for (const s of [-1, 1]) holes.push(rect(s * 18.5, F + 0.5, 1.4, 2.6, 'winSq', 0.14));
  for (const u of [8.2, 10.7, 13.2, 18.5]) for (const s of [-1, 1]) holes.push(rect(s * u, F + H.sill, 1.3, 2.0, 'winSq', 0.1));
  face(K, 'E', () => {
    holedWall(P, M.wall, -L, L, F, F + H.ent, holes, { depth: WD, uvs: 3 });
    windows(K, holes);
    P.box(M.limestone, -L - 0.05, L + 0.05, F, F + 0.4, 0, 0.1, 'kb', 1.8);
    P.box(M.white, -L, L, F + H.sill - 0.35, F + H.sill - 0.1, 0, 0.1, 'k', 3);
    for (const u of PL.pairs) pilaster(P, M.white, u, F + 0.4, F + H.ent - 0.2, { w: 0.9, proud: 0.1, capH: 0.25, base: 0.1 });
    for (const s of [-1, 1]) P.quad(M.lunette, [s * 18.5 - 1.1, F + 3.5, 0.04], [s * 18.5 + 1.1, F + 3.5, 0.04], [s * 18.5 + 1.1, F + 4.65, 0.04], [s * 18.5 - 1.1, F + 4.65, 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // pavilion colonnades (u beyond |14|): entablature on the column plane w = -26.5 (2.0 out of this wall), the plain cornice between
    for (const s of [-1, 1]) {
      const a = s < 0 ? -L - 1.24 : PL.pavU - 0.6, b = s < 0 ? -(PL.pavU - 0.6) : L + 1.24;
      entablature(P, M, a, b, F + H.ent, 2.0, 0);
      P.quad(M.soffit, [a, F + H.ent, 0], [b, F + H.ent, 0], [b, F + H.ent, 2.62], [a, F + H.ent, 2.62], [0, -1, 0]);
    }
    // the middle: a plain entablature (zc = 0.4) between the pavilions, interrupted by the rotunda
    const mid = (a, b) => entablature(P, M, a, b, F + H.ent, 0.0, 0, { closed: true });
    mid(-(PL.pavU - 0.6), -PL.rotRs + 0.0); mid(PL.rotRs - 0.0, PL.pavU - 0.6);
  });
}

function sideWalls(K) {
  const P = K.P, M = K.M, xs = [-3.4, -6.8, -10.2, -13.6, -17.0, -20.4];
  for (const which of ['N', 'S']) {
    const sg = which === 'N' ? 1 : -1, holes = [];
    // N frame: local x = w (west positive): the wall spans x -24.5 .. 0; S frame: local x = -w: spans 0 .. 24.5
    const X = (w) => sg * w;
    for (const w of xs) { holes.push(rect(X(w), F + 0.6, 1.3, 2.5, 'winSq', 0.14)); holes.push(rect(X(w), F + H.sill, 1.3, 2.0, 'winSq', 0.1)); }
    const x0 = which === 'N' ? PL.wallE : 0, x1 = which === 'N' ? 0 : -PL.wallE;
    face(K, which, () => {
      holedWall(P, M.wall, x0, x1, F, F + H.ent, holes, { depth: WD, uvs: 3 });
      windows(K, holes);
      P.box(M.limestone, x0, x1, F, F + 0.4, 0, 0.1, 'kb', 1.8);
      P.box(M.white, x0, x1, F + H.sill - 0.35, F + H.sill - 0.1, 0, 0.1, 'k', 3);
      entablature(P, M, x0, x1, F + H.ent, 0, 0, { closed: true });
    });
  }
}

/** columns of the west front, the east pavilions and the rotunda (separate meshes), cylinders for the physics are added in walk.js */
function columns(K) {
  const S = columnSets(K), ctx = K.ctx, root = K.root;
  let tris = 0;
  for (const u of [...PL.singles, ...PL.pairs]) { const p = W(u, PL.colW); tris += put(root, S.c74, p.x, F, p.z, 0, 1, 'yel-col'); }
  for (const u of PL.pairs) { const p = W(u, PL.colE); tris += put(root, S.c74, p.x, F, p.z, 0, 1, 'yel-col'); }
  for (let i = 0; i < 6; i++) {
    const th = (-90 + 36 * i + 0) * Math.PI / 180 + 0;      // -90 .. +90 deg in 36 deg steps would be six columns at -90, -54, -18, 18, 54, 90
    const p = W(PL.rotRc * Math.sin(th), PL.rotC - PL.rotRc * Math.cos(th));
    const dx = p.x - W(0, PL.rotC).x, dz = p.z - W(0, PL.rotC).z;
    tris += put(root, S.c83, p.x, F, p.z, Math.atan2(dx, dz), 1, 'yel-col-rot');
  }
  K.extraTris += tris; void ctx;
}

export function build(K) {
  stage(K, 'west', () => westWall(K));
  stage(K, 'east', () => eastWall(K));
  stage(K, 'sides', () => sideWalls(K));
  stage(K, 'columns', () => columns(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
