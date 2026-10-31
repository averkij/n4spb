// landmarksYelaginPalace/top.js - everything above the main cornice (F + 9.05): the two pedimented pavilions on both fronts with their gable roofs, the flat zinc roof of the body, the ATTIC BLOCK
// (u +-12.2, w -8 .. -24.5: seven windows and six small columns 1 + 2 + 2 + 1 on the west face, windows and pilaster pairs on the east face, a dentil cornice and the lattice balustrade of the roof
// terrace), the chimneys.  Dossier 5.1, 5.2, 5.4; photos pal_01 pal_04 pal_05.
import * as THREE from 'three';
import { PA, W, F, H, P as PL } from './frame.js';
import { holedWall, pane, surround } from './facade.js';
import { entablature, pediment, balustrade } from './orders.js';
import { columnSets } from './body.js';
import { put } from './objs.js';

const L = PL.halfLen, Y0 = F + H.ent + 1.65;                      // top of the main cornice
const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginPalace] top/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };

function frame(K, u, w, rot, fn) { const p = W(u, w); K.P.push(p.x, 0, p.z, rot); try { fn(); } finally { K.P.pop(); } }
const rect = (cx, y0, w, h, mat = 'winSq') => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, mat });

/** a flat zinc roof deck over (u0..u1) x (w0..w1) at height y (uv: metres / 1.2) */
function deck(K, u0, u1, w0, w1, y, mat) {
  const P = K.P, M = K.M, m = mat || M.zinc;
  const a = W(u0, w0), b = W(u1, w0), c = W(u1, w1), d = W(u0, w1);
  P.quad(m, [a.x, y, a.z], [b.x, y, b.z], [c.x, y, c.z], [d.x, y, d.z], [0, 1, 0], [[a.x / 1.2, a.z / 1.2], [b.x / 1.2, b.z / 1.2], [c.x / 1.2, c.z / 1.2], [d.x / 1.2, d.z / 1.2]]);
}

function pavilions(K) {
  const P = K.P, M = K.M, rise = 2.0, zf = PL.colW + 0.62 + 0.62;
  for (const which of ['W', 'E']) {
    const o = which === 'W' ? [0, 0, PA.rot] : [0, PL.wallE, Math.PI / 2], p = W(o[0], o[1]);
    P.push(p.x, 0, p.z, o[2]);
    for (const [a, b] of [[PL.pavU, L + 1.24], [-L - 1.24, -PL.pavU]]) pediment(P, M, a, b, Y0, rise, zf, zf - 0.6);
    P.pop();
  }
  // the gable roofs of the pavilions: ridge along w from the west pediment plane to the east one, eaves at the cornice top; zinc
  for (const s of [-1, 1]) {
    const a = s * PL.pavU, b = s * (L + 1.24), mid = (a + b) / 2, wA = zf - 0.35, wB = PL.wallE - (zf - 0.35), yR = Y0 + rise;
    const pt = (u, w, y) => { const q = W(u, w); return [q.x, y, q.z]; };
    const uv = (p) => [p[0] / 1.2, p[2] / 1.2];
    for (const [e, sg] of [[a, 1], [b, -1]]) {
      const A = pt(e, wA, Y0), B = pt(e, wB, Y0), C = pt(mid, wB, yR), D = pt(mid, wA, yR);
      P.quad(M.zinc, A, B, C, D, [0, 1, e < mid ? -0.4 : 0.4], [uv(A), uv(B), uv(C), uv(D)]);
    }
  }
}

function roofs(K) {
  // the body roof between the pavilions and around the attic block; the pavilion roofs above are the gables
  deck(K, -PL.pavU, PL.pavU, 0.3, PL.wallE - 0.3, Y0 - 0.02);
}

function attic(K) {
  const P = K.P, M = K.M, S = columnSets(K), y0 = Y0, yw = F + H.atticCornice - 1.65;
  const hw = PL.atticU, wW = PL.atticW0, wE = PL.atticW1;
  // west face (w = -8): seven windows, six small columns 1 + 2 + 2 + 1
  const holesW = [-9.9, -6.5, -3.25, 0, 3.25, 6.5, 9.9].map((u) => rect(u, F + 10.8, 1.3, 1.8, 'winAttic'));
  frame(K, 0, wW, PA.rot, () => {
    holedWall(P, M.wall, -hw, hw, y0, yw, holesW, { depth: 0.4, uvs: 3 });
    for (const h of holesW) { pane(P, M[h.mat], h, 0.4); surround(P, M.white, h, { sw: 0.16, proud: 0.06, sill: 0.1 }); }
    entablature(P, M, -hw - 0.6, hw + 0.6, yw, 0.0, 0, { closed: true });
    P.box(M.white, -hw, hw, y0, y0 + 0.3, 0, 0.1, 'kb', 3);
  });
  // the small columns stand 0.55 m in front of the face
  let tris = 0;
  for (const u of [-4.95, -2.35, -0.95, 0.95, 2.35, 4.95]) { const p = W(u, wW + 0.55); tris += put(K.root, S.c31, p.x, y0 + 0.1, p.z, 0, 1, 'yel-col-attic'); }
  K.extraTris += tris;
  // east face (w = -24.5): windows outside the rotunda, pilaster strips, cornice
  const holesE = [-10.4, -7.8, 7.8, 10.4].map((u) => rect(u, F + 10.8, 1.3, 1.8, 'winAttic'));
  frame(K, 0, wE, Math.PI / 2, () => {
    holedWall(P, M.wall, -hw, hw, y0, yw, holesE, { depth: 0.4, uvs: 3 });
    for (const h of holesE) { pane(P, M[h.mat], h, 0.4); surround(P, M.white, h, { sw: 0.16, proud: 0.06, sill: 0.1 }); }
    entablature(P, M, -hw - 0.6, hw + 0.6, yw, 0.0, 0, { closed: true });
    for (const u of [-11.9, -9.1, 9.1, 11.9]) P.box(M.white, u - 0.3, u + 0.3, y0 + 0.3, yw, 0, 0.14, 'kb', 3);
  });
  // north / south faces (u = +-12.2): two windows each
  for (const [u, rot, sg] of [[-hw, Math.PI, 1], [hw, 0, -1]]) {
    const holes = [-12.2, -19.6].map((w) => rect(sg * w, F + 10.8, 1.3, 1.8, 'winAttic'));
    frame(K, u, 0, rot, () => {
      const x0 = sg > 0 ? wE : 0, x1 = sg > 0 ? 0 : -wE;
      holedWall(P, M.wall, sg > 0 ? wE : -(wW), sg > 0 ? wW : -wE, y0, yw, holes, { depth: 0.4, uvs: 3 });
      for (const h of holes) { pane(P, M[h.mat], h, 0.4); surround(P, M.white, h, { sw: 0.16, proud: 0.06, sill: 0.1 }); }
      entablature(P, M, sg > 0 ? wE : -wW, sg > 0 ? wW : -wE, yw, 0.0, 0, { closed: true });
      void x0; void x1;
    });
  }
  // roof deck of the attic block and its balustrade
  deck(K, -hw, hw, wW - 0.2, wE + 0.2, F + H.atticCornice - 0.02);
  const top = F + H.atticCornice;
  frame(K, 0, 0, PA.rot, () => balustrade(P, M, -hw + 0.55, hw - 0.55, top, wW - 0.6 + 0.0, { h: 1.0, step: 1.9 }));
  frame(K, hw - 0.55, 0, 0, () => balustrade(P, M, -(wW - 0.6), -(wE + 0.6), top, 0, { h: 1.0, step: 1.9 }));
  frame(K, -hw + 0.55, 0, Math.PI, () => balustrade(P, M, wE + 0.6, wW - 0.6, top, 0, { h: 1.0, step: 1.9 }));
}

function chimneys(K) {
  const P = K.P, M = K.M;
  const box = (u, w, hw, hd, y1, y0) => { const a = W(u - hw, w + hd), b = W(u + hw, w - hd); P.box(M.white, Math.min(a.x, b.x), Math.max(a.x, b.x), y0, y1, Math.min(a.z, b.z), Math.max(a.z, b.z), 'b', 2); P.box(M.roofEdge, Math.min(a.x, b.x) - 0.1, Math.max(a.x, b.x) + 0.1, y1, y1 + 0.14, Math.min(a.z, b.z) - 0.1, Math.max(a.z, b.z) + 0.1, 'b', 2); };
  for (const s of [-1, 1]) {
    box(s * 5.3, -15.0, 0.8, 0.6, F + H.atticCornice + 3.0, F + H.atticCornice);                    // the two white boxes beside the dome
    box(s * 15.2, -10.5, 0.5, 0.45, F + 11.8, Y0);                         // the small ones where the pavilion roofs meet the body roof
    box(s * 20.0, -20.0, 0.5, 0.45, F + 12.2, Y0 + 0.5);
  }
}

export function build(K) {
  stage(K, 'pavilions', () => pavilions(K));
  stage(K, 'roofs', () => roofs(K));
  stage(K, 'attic', () => attic(K));
  stage(K, 'chimneys', () => chimneys(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
