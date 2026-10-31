// landmarksFortress/domes.js - the gold-leaf domes of the cathedral and the bell tower: GORE SOLIDS (a surface of revolution cut into gores with a convex belly, sharp seams, so every dome shows its
// ribs like the real ones: docs/research/nikolsky.md 3.3 / 3.4, photo refs/nikolsky 031), octagonal drums with blind windows and pilasters, octagonal lanterns with arched windows and S-curved corners,
// 8-rib onions with ball, spindle and gilded cross.  domeStack() assembles one whole crown from a parameter set.  Frame: the CURRENT Parts frame (y up, base at (x, y0, z)).
import * as THREE from 'three';
import * as G from './geo.js';
import * as S from './stucco.js';

const TAU = Math.PI * 2;
const cache = new Map();

/** gore solid: profile [[r, y]..] (unit sizes, bottom to top), `gores` gores, belly `bulge` (relative radial swell mid-gore), nu columns per gore, uv: u 0..2 per gore, v = arc length / 2 m */
export function goreGeo(key, prof, gores = 8, bulge = 0.03, nu = 5) {
  const k = `${key}|${gores}|${bulge}|${nu}`; let g0 = cache.get(k); if (g0) return g0;
  const nv = prof.length, pos = [], uv = [], idx = [];
  const cum = [0]; for (let i = 1; i < nv; i++) cum.push(cum[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  for (let g = 0; g < gores; g++) {
    const base = pos.length / 3;
    for (let i = 0; i < nv; i++) for (let j = 0; j <= nu; j++) {
      const f = j / nu, th = (g + f) * TAU / gores, sw = 1 + bulge * Math.sin(Math.PI * f), r = prof[i][0] * sw;
      pos.push(Math.sin(th) * r, prof[i][1], Math.cos(th) * r); uv.push(f * 2, cum[i] * 0.5);
    }
    for (let i = 0; i < nv - 1; i++) for (let j = 0; j < nu; j++) {
      const a = base + i * (nu + 1) + j, b = a + 1, c = a + (nu + 1), d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g1.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g1.setIndex(idx);
  // normals per gore (vertices are not shared between gores): computeVertexNormals averages inside a gore only
  g1.computeVertexNormals();
  cache.set(k, g1); return g1;
}
/** ellipsoidal dome profile: radius 1 at the base (a short vertical skirt), top radius `rt` (lantern seat), height 1 */
export function domeProfile(rt = 0.26, n = 9, skirt = 0.06) {
  const p = [[1, 0], [1, skirt]];
  for (let i = 1; i <= n; i++) { const a = (i / n) * Math.PI / 2; p.push([rt + (1 - rt) * Math.cos(a), skirt + (1 - skirt) * Math.sin(a)]); }
  return p;
}
const DOME = domeProfile();
const ONION = [[0.30, 0], [0.55, 0.04], [0.82, 0.16], [1.0, 0.34], [1.06, 0.55], [0.98, 0.76], [0.78, 0.98], [0.5, 1.2], [0.24, 1.42], [0.08, 1.62], [0.0, 1.72]].map(([r, y]) => [r, y]);
const ONION_U = ONION.map(([r, y]) => [r, y / 1.72]);                       // height normalised to 1

/** an octagonal tube (frustum) with `faces` faces at (x, z): circumradius R from y0 to y1, returns nothing; vertical faces */
const oct = (P, mat, x, z, y0, y1, R0, R1 = R0, a0 = Math.PI / 8) => G.frustum(P, mat, x, z, y0, y1, 8, R0, R1, a0, 1, 1);

/** a drum: octagon R, from y0 to y1; blue wall, white corner pilasters (8) with small capitals, one blind arched window per face (dark, white frame) with a triangular pediment; plinth + cornice rings */
export function drum(P, M, x, z, y0, y1, R, o = {}) {
  const a0 = o.a0 ?? Math.PI / 8, win = o.win !== false;
  G.frustum(P, M.blue, x, z, y0, y1, 8, R, R, a0, 4, 2);
  oct(P, M.white, x, z, y0, y0 + 0.5, R * 1.04, R * 1.04, a0);
  P.cap(M.white, G.ngon(8, R * 1.04, a0, x, z), y0 + 0.5, true, 3);
  const apo = R * Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const t = a0 + i * TAU / 8, tm = t + TAU / 16, c = Math.sin(t), s = Math.cos(t);
    // pilaster on the corner
    P.push(x + c * R * 1.0, 0, z + s * R * 1.0, t);
    P.box(M.white, -0.28, 0.28, y0 + 0.5, y1 - 0.2, -0.28, 0.28, 'b');
    P.box(M.whiteShade, -0.38, 0.38, y1 - 0.35, y1 - 0.15, -0.38, 0.38, 'b');
    P.pop();
    if (win) {
      const fx = x + Math.sin(tm) * apo, fz = z + Math.cos(tm) * apo, ww = Math.max(0.8, R * 0.2), hh = Math.max(1.6, (y1 - y0) * 0.5);
      P.push(fx, 0, fz, tm);
      const yb = y0 + (y1 - y0) * 0.22;
      S.archGlass(P, M.dark, 0, yb, ww, hh, 0.04);
      S.archFrame(P, M.white, 0, yb, ww, hh, 0.16, 0, 0.12);
      // triangular pediment over the window
      const yt = yb + hh + 0.3;
      P.fan(M.white, [[-ww * 0.75, yt, 0.06], [ww * 0.75, yt, 0.06], [0, yt + ww * 0.45, 0.06]], [0, 0, 1]);
      P.pop();
    }
  }
  // cornice
  oct(P, M.white, x, z, y1 - 0.0, y1 + 0.28, R * 1.14, R * 1.14, a0);
  oct(P, M.whiteShade, x, z, y1 + 0.28, y1 + 0.5, R * 1.06, R * 1.0, a0);
  P.cap(M.white, G.ngon(8, R * 1.14, a0, x, z), y1 + 0.28, true, 3);
}
/** octagonal lantern: R, y0..y1, white S-curved corner posts, arched dark windows on all 8 faces, small cornice; returns top y */
export function lantern(P, M, x, z, y0, y1, R, a0 = Math.PI / 8) {
  G.frustum(P, M.blue, x, z, y0, y1, 8, R, R, a0, 2, 1);
  const apo = R * Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const t = a0 + i * TAU / 8, tm = t + TAU / 16;
    P.push(x + Math.sin(t) * R, 0, z + Math.cos(t) * R, t);
    P.box(M.white, -0.14 * R, 0.14 * R, y0, y1, -0.14 * R, 0.14 * R, 'b');          // corner post
    P.box(M.white, -0.2 * R, 0.2 * R, y0 + (y1 - y0) * 0.45, y0 + (y1 - y0) * 0.56, -0.18 * R, 0.2 * R, 'b');   // S-curve bulge
    P.pop();
    P.push(x + Math.sin(tm) * apo, 0, z + Math.cos(tm) * apo, tm);
    const ww = R * 0.42, hh = (y1 - y0) * 0.62, yb = y0 + (y1 - y0) * 0.18;
    S.archGlass(P, M.win12, 0, yb, ww, hh, 0.03);
    S.archFrame(P, M.white, 0, yb, ww, hh, 0.07 * R + 0.04, 0, 0.06);
    P.pop();
  }
  oct(P, M.white, x, z, y1, y1 + 0.22, R * 1.22, R * 1.22, a0);
  oct(P, M.whiteShade, x, z, y1 + 0.22, y1 + 0.4, R * 1.12, R * 1.0, a0);
  P.cap(M.white, G.ngon(8, R * 1.22, a0, x, z), y1 + 0.22, true, 3);
  return y1 + 0.4;
}
/** gilded cross of height h with a small star at the crossing, base at (x, y, z); arms perpendicular to local x (rot about y) */
export function crossGold(P, M, x, y, z, h, rot = 0) {
  G.cross(P, M.goldFlat, x, y, z, h, rot);
  P.push(x, y + h * 0.66, z, rot);
  S.sph(P, M.goldFlat, 0, 0, 0, h * 0.045, h * 0.045, h * 0.045, 5);
  P.pop();
}

/**
 * One dome stack on a drum: P.* in the current frame.  S: { y0 (drum bottom), drumH, drumR, domeR, domeH, lanR, lanH, onionR, cross (cross height), pedestal (extra ring) }.
 * Returns { yDome0, yDomeTop, yLan, yOnion, yTop }.
 */
export function domeStack(P, M, x, z, S_) {
  const { y0, drumH, drumR, domeR, domeH, lanR, lanH, onionR, cross } = S_;
  const y1 = y0 + drumH;
  drum(P, M, x, z, y0, y1, drumR, S_);
  const yd = y1 + 0.5;
  P.geo(M.gold, goreGeo('dome', DOME, 8, 0.035, 5), x, yd, z, 0, Math.PI / 8, 0, domeR, domeH, domeR);
  const yl = yd + domeH * 0.97;
  const yLanTop = lantern(P, M, x, z, yl - 0.2, yl + lanH, lanR);
  const oy = yLanTop;
  P.col(M.goldFlat, x, z, oy - 0.05, oy + 0.2, onionR * 0.5, onionR * 0.38, 12, true);
  P.geo(M.gold, goreGeo('onion', ONION_U, 8, 0.06, 4), x, oy + 0.15, z, 0, 0, 0, onionR, onionR * 2.4 * 0.85, onionR);
  const ot = oy + 0.15 + onionR * 2.4 * 0.85;
  S.sph(P, M.goldFlat, x, ot + 0.15, z, onionR * 0.22, onionR * 0.22, onionR * 0.22, 8);
  P.col(M.goldFlat, x, z, ot + 0.3, ot + 0.3 + onionR * 0.7, onionR * 0.07, onionR * 0.045, 6, false);
  crossGold(P, M, x, ot + 0.3 + onionR * 0.7, z, cross, 0);
  return { y1, yDome: yd, yDomeTop: yd + domeH, yLan: yl, yOnion: oy, yOnionTop: ot, yTop: ot + 0.3 + onionR * 0.7 + cross };
}
