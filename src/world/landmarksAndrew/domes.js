// landmarksAndrew/domes.js - the crowns of the two churches: GORE SOLIDS (a surface of revolution cut into 8 ribbed gores with a slightly convex belly, so every dome and onion shows its seams like the real
// sheet-iron / copper ones: photos refs/andrew 04 26 30 131 148), octagonal drums with corner pilasters, arched windows or niches, octagonal lanterns with a balcony, concave needle spires, gilded balls and crosses.
// goreGeo / domeProfile are copies of landmarksNikolsky/domes.js (modules never import each other).  Frame: the CURRENT Parts frame (y up, base at (x, y0, z)); octagons have their FLAT faces on the frame axes
// (first vertex at a0 = pi / 8; face i looks along (sin(i pi/4), cos(i pi/4)): i = 0 -> +z).
import * as THREE from 'three';
import * as G from './geo.js';

const TAU = Math.PI * 2;
const cache = new Map();

/** gore solid: profile [[r, y]..] (unit sizes, bottom to top), `gores` gores, belly `bulge`, nu columns per gore, uv: u 0..2 per gore, v = arc length / 2 m */
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
    for (let i = 0; i < nv - 1; i++) for (let j = 0; j < nu; j++) { const a = base + i * (nu + 1) + j, b = a + 1, c = a + (nu + 1), d = c + 1; idx.push(a, b, c, b, d, c); }
  }
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g1.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g1.setIndex(idx);
  g1.computeVertexNormals(); cache.set(k, g1); return g1;
}
/** ellipsoidal dome profile: radius 1 at the base (a short vertical skirt), top radius rt (lantern seat), height 1 */
export function domeProfile(rt = 0.26, n = 9, skirt = 0.06) {
  const p = [[1, 0], [1, skirt]];
  for (let i = 1; i <= n; i++) { const a = (i / n) * Math.PI / 2; p.push([rt + (1 - rt) * Math.cos(a), skirt + (1 - skirt) * Math.sin(a)]); }
  return p;
}
const DOME = domeProfile(0.2, 9, 0.05);
const ONION = [[0.30, 0], [0.55, 0.04], [0.82, 0.16], [1.0, 0.34], [1.06, 0.55], [0.98, 0.76], [0.78, 0.98], [0.5, 1.2], [0.24, 1.42], [0.08, 1.62], [0.0, 1.72]].map(([r, y]) => [r, y / 1.72]);
/** a low saucer dome of base radius r and height h (silver sheet iron or green copper): 8 ribs */
export function dome(P, mat, x, y, z, r, h, a0 = Math.PI / 8) { P.geo(mat, goreGeo('dome', DOME, 8, 0.03, 4), x, y, z, 0, a0, 0, r, h, r); }
/** a Russian onion of belly radius r (profile height 2.4 r * k) on a base at y: 8 ribs; returns its top y */
export function onion(P, mat, x, y, z, r, k = 1) { const h = r * 2.4 * k; P.geo(mat, goreGeo('onion', ONION, 8, 0.05, 3), x, y, z, 0, 0, 0, r, h, r); return y + h; }
/** a gilded ball + cross; base of the ball at y, ball radius rb, cross total height h above the ball top; returns the tip y */
export function crown(P, M, x, y, z, rb, h, rot = 0) {
  G.ball(P, M.goldFlat, x, y + rb, z, rb, 8);
  const t0 = y + rb * 2 - 0.02;
  P.col(M.goldFlat, x, z, t0, t0 + h * 0.12, rb * 0.22, rb * 0.16, 5, false);
  G.cross(P, M.goldFlat, x, t0 + h * 0.1, z, h * 0.9, rot);
  return t0 + h;
}
/** an arched window sheet in the CURRENT frame (+z out): glass at z0 + 0.04, a white surround ring of border b and depth dp */
export function archWin(P, M, cx, y0, w, h, o = {}) {
  const b = o.b ?? Math.max(0.12, w * 0.12), dp = o.depth ?? 0.1;
  G.planeShape(P, o.mat || M.win24, G.archPts(cx, y0, w, h, 8), 0.04);
  G.frameRing(P, M.white, G.archPts(cx, y0 - b * 0.6, w + 2 * b, h + b * 1.6, 8), G.archPts(cx, y0, w, h, 8), 0, dp, 1);
  if (o.sill) P.box(M.white, cx - w / 2 - b * 1.3, cx + w / 2 + b * 1.3, y0 - b * 1.2, y0 - b * 0.4, 0, dp * 3, 'b');
}
/** an octagonal stage (frustum with flat faces on the axes): flats = across flats, y0..y1; wall material o.mat; corner pilasters; per face `face(i)` -> 'arch' | 'niche' | 'blank'; entablature cornice on top.
 *  o: { mat, pil, face, winW, winH, winY (fraction of the height), cornice (height of the cornice block, default 0.6), proj, taper (R1 / R0) } returns y1 + cornice */
export function octStage(P, M, cx, cz, y0, y1, flats, o = {}) {
  const R = flats / 2 / Math.cos(Math.PI / 8), R1 = R * (o.taper ?? 1), a0 = Math.PI / 8, mat = o.mat || M.peach, apo = flats / 2;
  G.frustum(P, mat, cx, cz, y0, y1, 8, R, R1, a0, 1, 1);
  const ph = Math.max(0.14, flats * 0.045);
  if (o.pil !== false) for (let i = 0; i < 8; i++) {
    const t = a0 + i * TAU / 8, rr = R * 0.5 + R1 * 0.5; P.push(cx + Math.sin(t) * rr, 0, cz + Math.cos(t) * rr, t);
    P.box(M.white, -ph, ph, y0 + 0.3, y1 - 0.05, -ph, ph, 'b'); P.box(M.whiteShade, -ph * 1.45, ph * 1.45, y1 - 0.45, y1 - 0.2, -ph * 1.45, ph * 1.45, 'b'); P.box(M.whiteShade, -ph * 1.4, ph * 1.4, y0, y0 + 0.3, -ph * 1.4, ph * 1.4, 'b');
    P.pop();
  }
  const face = o.face || ((i) => (i % 2 === 0 ? 'arch' : 'niche'));
  const wW = o.winW ?? Math.min(1.6, flats * 0.2), wH = o.winH ?? Math.min(3.4, (y1 - y0) * 0.5), wY = y0 + (y1 - y0) * (o.winY ?? 0.22);
  for (let i = 0; i < 8; i++) {
    const kind = face(i); if (kind === 'blank') continue;
    const tm = i * TAU / 8, ap = (apo + (R1 - R) * 0.0);
    P.push(cx + Math.sin(tm) * ap, 0, cz + Math.cos(tm) * ap, tm);
    if (kind === 'arch') archWin(P, M, 0, wY, wW, wH, { mat: o.winMat || M.win24, b: wW * 0.13 });
    else { G.planeShape(P, M.niche, G.archPts(0, wY, wW * 0.9, wH * 0.95, 8), 0.03); G.frameRing(P, M.white, G.archPts(0, wY - 0.05, wW * 0.9 + 0.3, wH * 0.95 + 0.4, 8), G.archPts(0, wY, wW * 0.9, wH * 0.95, 8), 0, 0.06, 1); }
    P.pop();
  }
  const ch = o.cornice ?? 0.6, pr = o.proj ?? 1.14, Rc = R1 * pr;
  if (ch > 0) {
    G.frustum(P, M.white, cx, cz, y1, y1 + ch, 8, Rc, Rc, a0, 1, 1);
    P.cap(M.white, G.ngon(8, Rc, a0, cx, cz), y1 + ch, true, 3); P.cap(M.underside, G.ngon(8, Rc, a0, cx, cz), y1, false, 3);
  }
  return y1 + ch;
}
/** octagonal lantern with a balcony: flats F, y0..y1, arched dark windows on the 4 axis faces, niches on the others, white corner posts; balcony ring at y0 .. y0 + 0.3 with a balustrade; cap cone and returns the top y */
export function lantern(P, M, cx, cz, y0, y1, flats, o = {}) {
  const R = flats / 2 / Math.cos(Math.PI / 8), a0 = Math.PI / 8;
  if (o.balcony) {
    const Rb = R * 1.62;
    G.frustum(P, M.white, cx, cz, y0 - 0.3, y0, 8, Rb, Rb, a0, 1, 1); P.cap(M.white, G.ngon(8, Rb, a0, cx, cz), y0, true, 3); P.cap(M.underside, G.ngon(8, Rb, a0, cx, cz), y0 - 0.3, false, 3);
    for (let i = 0; i < 8; i++) {                                                                   // balustrade: a white railing panel on each face (alpha balusters)
      const t0 = a0 + i * TAU / 8, t1 = t0 + TAU / 8, Rr = Rb * 0.96, p0 = [cx + Math.sin(t0) * Rr, cz + Math.cos(t0) * Rr], p1 = [cx + Math.sin(t1) * Rr, cz + Math.cos(t1) * Rr], l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), tm = (t0 + t1) / 2;
      P.quad(M.balus, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y0 + 0.95, p1[1]], [p0[0], y0 + 0.95, p0[1]], [Math.sin(tm), 0, Math.cos(tm)], [[0, 0], [l / 0.7, 0], [l / 0.7, 1], [0, 1]]);
      P.push(cx + Math.sin(t0) * Rr, 0, cz + Math.cos(t0) * Rr, t0); P.box(M.white, -0.09, 0.09, y0, y0 + 1.02, -0.09, 0.09, 'b'); P.pop();
    }
  }
  G.frustum(P, o.mat || M.peach, cx, cz, y0, y1, 8, R, R, a0, 1, 1);
  for (let i = 0; i < 8; i++) {
    const t = a0 + i * TAU / 8, tm = i * TAU / 8, ap = flats / 2;
    P.push(cx + Math.sin(t) * R, 0, cz + Math.cos(t) * R, t); P.box(M.white, -0.13, 0.13, y0, y1, -0.13, 0.13, 'b'); P.pop();
    P.push(cx + Math.sin(tm) * ap, 0, cz + Math.cos(tm) * ap, tm);
    const ww = flats * 0.3, hh = (y1 - y0) * 0.6, yb = y0 + (y1 - y0) * 0.2;
    if (i % 2 === 0) archWin(P, M, 0, yb, ww, hh, { mat: M.win12, b: 0.09 }); else { G.planeShape(P, M.niche, G.archPts(0, yb, ww, hh, 8), 0.03); }
    P.pop();
  }
  const Rc = R * 1.2;
  G.frustum(P, M.white, cx, cz, y1, y1 + 0.35, 8, Rc, Rc, a0, 1, 1); P.cap(M.white, G.ngon(8, Rc, a0, cx, cz), y1 + 0.35, true, 3); P.cap(M.underside, G.ngon(8, Rc, a0, cx, cz), y1, false, 3);
  return y1 + 0.35;
}
