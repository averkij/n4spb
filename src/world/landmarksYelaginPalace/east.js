// landmarksYelaginPalace/east.js - the ROTUNDA of the east (garden) front and the dome (dossier 5.1, 5.3; photos pal_04 pal_05 pal_26, pal_01 for the dome seen from the west).  Plan (frame PA): the centre
// C = (u 0, w -24.5) on the east wall plane; six free Corinthian columns stand on a semicircle R 6.0 at the angles +-18, +-54, +-90 deg (they are placed in body.js), behind them the ground floor is a
// polygon of five facets (apothem 4.8) with a glazed door on the axis and two arched windows + two more at the ends, a festoon frieze above the arches and a rectangular window row;
// the curved entablature (architrave, frieze, dentils, corona) at F + 7.9, a balcony with the lattice balustrade on it, the upper tier (five facets, apothem 5.4, tall windows between pilasters), the tier
// cornice with a balustrade ring, the round drum (R 5.5) and the shallow zinc dome (R 5.85, apex F + 19.0 = 21.8 m above the lawn) with a lightning rod.
// Angles: theta = 0 points EAST, positive toward the south; point(R, theta) = world (C.x + R cos, C.z + R sin).
import * as THREE from 'three';
import { W, F, H, P as PL } from './frame.js';
import { holedWall, pane, archSurround, surround } from './facade.js';
import { balustrade } from './orders.js';
import { revolve } from './geo.js';
import { along } from './west.js';

const stage = (K, name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksYelaginPalace] east/${name}:`, e); (K.errs ||= []).push(`${name}: ${e && e.stack || e}`); } };
const DEG = Math.PI / 180;
const C = () => W(0, PL.rotC);
const pt = (R, th) => { const c = C(); return [c.x + R * Math.cos(th), c.z + R * Math.sin(th)]; };

/** ring segments between th0 and th1: outward face at R from y0 to y1, optional annulus top (from R0 to R) / bottom, uv in metres / tile */
function arcBand(K, mat, R, y0, y1, th0, th1, o = {}) {
  const P = K.P, n = o.seg ?? Math.max(2, Math.round(Math.abs(th1 - th0) / (6 * DEG))), tile = o.tile ?? 3, R0 = o.R0 ?? null;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = th0 + (th1 - th0) * i / n, b = th0 + (th1 - th0) * (i + 1) / n, m = (a + b) / 2;
    const A = pt(R, a), B = pt(R, b), len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    if (!o.noFace) P.quad(mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], [Math.cos(m), 0, Math.sin(m)], [[acc / tile, y0 / tile], [(acc + len) / tile, y0 / tile], [(acc + len) / tile, y1 / tile], [acc / tile, y1 / tile]]);
    if (R0 !== null) {
      const A0 = pt(R0, a), B0 = pt(R0, b);
      if (o.top !== false) P.quad(mat, [A[0], y1, A[1]], [B[0], y1, B[1]], [B0[0], y1, B0[1]], [A0[0], y1, A0[1]], [0, 1, 0], [[A[0] / tile, A[1] / tile], [B[0] / tile, B[1] / tile], [B0[0] / tile, B0[1] / tile], [A0[0] / tile, A0[1] / tile]]);
      if (o.bottom) P.quad(mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B0[0], y0, B0[1]], [A0[0], y0, A0[1]], [0, -1, 0], [[A[0] / tile, A[1] / tile], [B[0] / tile, B[1] / tile], [B0[0] / tile, B0[1] / tile], [A0[0] / tile, A0[1] / tile]]);
    }
    acc += len;
  }
}

/** run fn(P) in the frame of the facet of a polygon around C: centre angle th, apothem a (local z out of the facet, x to the viewer's right) */
function facet(K, th, a, fn) {
  const p = pt(a, th), P = K.P;
  P.push(p[0], 0, p[1], Math.atan2(Math.cos(th), Math.sin(th)));
  try { fn(); } finally { P.pop(); }
}

const rect = (cx, y0, w, h, mat = 'winSq') => ({ x0: cx - w / 2, x1: cx + w / 2, y0, y1: y0 + h, mat });
const arch = (cx, y0, w, h, mat = 'winArch') => ({ cx, y0, w, h, arch: true, mat });

function groundFloor(K) {
  const P = K.P, M = K.M, aw = PL.rotRw - 0.2, hw = aw * Math.tan(18 * DEG);
  for (const thd of [-72, -36, 0, 36, 72]) {
    facet(K, thd * DEG, aw, () => {
      const holes = [arch(0, F + 0.06, 2.0, 3.8, thd === 0 ? 'winDoor' : 'winArch'), rect(0, F + H.sill, 1.3, 2.0, 'winSq')];
      holedWall(P, M.wall, -hw, hw, F, F + H.colE, holes, { depth: 0.4, uvs: 3 });
      for (const h of holes) { pane(P, M[h.mat], h, 0.4); if (h.arch) archSurround(P, M.white, h, { sw: 0.26, proud: 0.09 }); else surround(P, M.white, h, { sw: 0.2, proud: 0.07, sill: 0.1 }); }
      // the festoon frieze between the arches and the upper windows
      P.quad(M.festoon, [-hw, F + 4.15, 0.05], [hw, F + 4.15, 0.05], [hw, F + 5.0, 0.05], [-hw, F + 5.0, 0.05], [0, 0, 1], [[0, 0], [hw * 2 / 2.4, 0], [hw * 2 / 2.4, 1], [0, 1]]);
      P.box(M.white, -hw, hw, F + H.sill - 0.35, F + H.sill - 0.1, 0, 0.1, 'k', 3);
      P.box(M.limestone, -hw, hw, F, F + 0.4, 0, 0.1, 'kb', 1.8);
    });
  }
}

/** the curved entablature at y0 = F + 7.9 over the colonnade, from -90 to +90 deg: architrave, frieze, dentils, corona, cymatium */
function entablature(K) {
  const P = K.P, M = K.M, y = F + H.colE, th0 = -90 * DEG, th1 = 90 * DEG, wallR = PL.rotRw - 0.5;
  arcBand(K, M.white, 6.62, y, y + 0.45, th0, th1, { R0: wallR, bottom: true, top: false });
  arcBand(K, M.white, 6.58, y + 0.45, y + 0.95, th0, th1, { R0: wallR, top: false });
  arcBand(K, M.white, 7.0, y + 0.95, y + 1.07, th0, th1, { R0: wallR, top: false });
  arcBand(K, M.dark, 6.9, y + 1.07, y + 1.27, th0, th1, { R0: wallR, top: false });
  for (let i = 0; i < 72; i++) {
    const th = th0 + (i + 0.5) * (th1 - th0) / 72, p = pt(6.82, th);
    P.push(p[0], 0, p[1], Math.atan2(Math.cos(th), Math.sin(th)));
    P.box(M.white, -0.085, 0.085, y + 1.07, y + 1.27, -0.05, 0.2, 'bk', 3);
    P.pop();
  }
  arcBand(K, M.white, 7.62, y + 1.27, y + 1.51, th0, th1, { R0: wallR, bottom: true, top: false });
  arcBand(K, M.white, 7.5, y + 1.51, y + 1.65, th0, th1, { R0: 7.0, top: true });
  // the soffit under the architrave between the wall and the columns
  // the straight returns where the curve meets the plain cornice of the body: end faces
  for (const s of [-1, 1]) {
    const th = s * 90 * DEG, a = pt(wallR, th), b = pt(7.62, th), c = pt(7.62, th);
    P.quad(M.white, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + 1.65, b[1]], [a[0], y + 1.65, a[1]], [0, 0, s], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    void c;
  }
}

/** the balcony balustrade on the cornice and the upper tier (five facets, apothem 5.4) */
function tier(K) {
  const P = K.P, M = K.M, yb = F + H.rotCornice, aw = 5.4, hw = aw * Math.tan(18 * DEG), yt = F + H.tierTop;
  // balustrade: twelve straight runs of 15 deg on R 7.3 from -90 to +90 deg (shared corner posts)
  const nR = 12, Rb = 7.3;
  for (let i = 0; i < nR; i++) {
    const a = pt(Rb, (-90 + i * 15) * DEG), b = pt(Rb, (-90 + (i + 1) * 15) * DEG), len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    along(P, a, b, (L2) => balustrade(P, M, 0, L2, yb, 0, { h: 1.0, step: 1.9, noEnd: i < nR - 1 }));
    void len;
  }
  for (const thd of [-72, -36, 0, 36, 72]) {
    facet(K, thd * DEG, aw, () => {
      const holes = [rect(0, yb + 0.9, 1.3, 2.7, 'winSq')];
      holedWall(P, M.wall, -hw, hw, yb, yt, holes, { depth: 0.4, uvs: 3 });
      for (const h of holes) { pane(P, M[h.mat], h, 0.4); surround(P, M.white, h, { sw: 0.2, proud: 0.07, sill: 0.1 }); }
      for (const s of [-1, 1]) { P.box(M.white, s * (hw - 0.3) - 0.28, s * (hw - 0.3) + 0.28, yb + 0.15, yt - 0.35, 0, 0.16, 'kb', 3); P.box(M.white, s * (hw - 0.3) - 0.34, s * (hw - 0.3) + 0.34, yt - 0.35, yt, 0, 0.22, 'kb', 3); }
    });
  }
  // the tier cornice (curved): architrave + frieze + corona
  arcBand(K, M.white, 5.78, yt, yt + 0.35, -90 * DEG, 90 * DEG, { R0: 5.2, bottom: true, top: false });
  arcBand(K, M.white, 5.74, yt + 0.35, yt + 0.8, -90 * DEG, 90 * DEG, { R0: 5.2, top: false });
  arcBand(K, M.white, 6.5, yt + 0.8, yt + 1.35, -90 * DEG, 90 * DEG, { R0: 5.2, bottom: true, top: true });
}

/** the drum (full circle R 5.5 from the attic roof to the dome), the dome and the lightning rod */
function dome(K) {
  const P = K.P, M = K.M, c = C(), y0 = F + H.atticCornice, y1 = F + H.domeSpring, apex = F + H.domeTop, R = PL.domeR;
  revolve(P, M.white, [[5.5, y0], [5.5, F + 15.45], [5.75, F + 15.45], [5.75, F + 15.65], [5.5, F + 15.65], [5.5, y1]], 40, { cx: c.x, cz: c.z, uRep: 6, vTile: 3 });
  const prof = [[5.65, y1 - 0.02], [R + 0.12, y1 - 0.02], [R + 0.12, y1 + 0.1]];
  for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI / 2; prof.push([R * Math.cos(t), y1 + 0.1 + (apex - y1 - 0.1) * Math.sin(t)]); }
  revolve(P, M.dome, prof, 64, { cx: c.x, cz: c.z, uRep: 1, vTile: 3 });
  P.cyl(M.iron, [c.x, apex - 0.05, c.z], [c.x, apex + 2.0, c.z], 0.05, 0.025, 6, false);
}

export function build(K) {
  stage(K, 'ground', () => groundFloor(K));
  stage(K, 'entablature', () => entablature(K));
  stage(K, 'tier', () => tier(K));
  stage(K, 'dome', () => dome(K));
  if (K.errs) throw new Error(K.errs.join('\n'));
}
