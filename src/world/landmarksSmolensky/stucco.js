// landmarksSmolensky/stucco.js - the small vocabulary of the churches, built from the Parts collector (kit.js): Tuscan columns, arched glass panes with white frames and fan archivolts, round windows, pediments,
// balustrades, dentil / modillion runs, gilded crosses with a ball, kokoshnik gables, ogee arches.  Adapted from landmarksNikolsky/stucco.js (own copy: modules never import each other).
// All coordinates are in the CURRENT Parts frame; a facade frame has x to the right, y up, z OUT of the wall (kit.js onEdge / geo.js onFace).
import * as THREE from 'three';
import * as G from './geo.js';

export const TAU = Math.PI * 2;
const cache = new Map();
const geoOf = (key, mk) => { let g = cache.get(key); if (!g) { g = mk(); cache.set(key, g); } return g; };
const sphereG = (seg = 8) => geoOf('sph' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(4, seg >> 1)));
const boxG = () => geoOf('box', () => new THREE.BoxGeometry(1, 1, 1));
export const sph = (P, mat, x, y, z, rx, ry = rx, rz = rx, seg = 8) => P.geo(mat, sphereG(seg), x, y, z, 0, 0, 0, rx, ry, rz);
/** oriented thin box (centre x,y,z; sizes w,h,d; rotation about z) */
export const slat = (P, mat, x, y, z, w, h, d, rz = 0) => P.geo(mat, boxG(), x, y, z, 0, 0, rz, w, h, d);

/** a Tuscan column of radius R: moulded base, tapered shaft, echinus + abacus; returns the top y */
export function column(P, M, x, z, y0, y1, R, o = {}) {
  const mat = o.mat || M.white, seg = o.seg || 12, capH = R * 0.85, baseH = R * 0.55;
  P.box(mat, x - R * 1.3, x + R * 1.3, y0, y0 + baseH * 0.5, z - R * 1.3, z + R * 1.3, 'b');
  P.col(mat, x, z, y0 + baseH * 0.5, y0 + baseH, R * 1.2, R * 1.04, seg, false);
  P.col(mat, x, z, y0 + baseH, y1 - capH, R * 1.0, R * 0.9, seg, false);
  P.col(mat, x, z, y1 - capH, y1 - capH * 0.45, R * 0.95, R * 1.25, seg, false);        // echinus
  P.box(mat, x - R * 1.38, x + R * 1.38, y1 - capH * 0.45, y1, z - R * 1.38, z + R * 1.38, 'b');
  return y1;
}
/** glass of an arched opening, uv spans the opening, at depth z */
export const archPane = (P, mat, cx, y0, w, h, z) => G.planeShape(P, mat, G.archPts(cx, y0, w, h, 10), z);
/** white surround of an arched opening: a ring of border b from z0 forward by `depth` */
export function archRing(P, mat, cx, y0, w, h, b, z0, depth) {
  const inner = G.archPts(cx, y0, w, h, 10), outer = G.archPts(cx, y0 - b * 0.0, w + 2 * b, h + b, 10);
  G.frameRing(P, mat, outer, inner, z0, depth, 1);
}
/**
 * the fan archivolt of the Smolensk church: a white ring of radius b round the arched head with radiating voussoir blocks on it (outer edge studded), n blocks over the semicircle.
 * cx, y0 = centre x / bottom of the glass, w, h = glass size; r0 = head radius = w / 2 + b0
 */
export function fanHood(P, M, cx, y0, w, h, o = {}) {
  const b = o.b ?? 0.16, n = o.n ?? 9, depth = o.depth ?? 0.16, r = w / 2, yc = y0 + h - r;
  archRing(P, M.white, cx, y0, w, h, b, 0, depth);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + 0.5) / n, rr = r + b + 0.1;
    slat(P, M.white, cx + Math.cos(a) * rr, yc + Math.sin(a) * rr, depth * 0.6, 0.2, 0.36, depth * 1.2, a - Math.PI / 2);
  }
}
/** a plain rectangular opening with a white frame: glass (mat) at z = 0.05, frame ring border b */
export function rectWin(P, M, mat, x0, x1, y0, y1, b = 0.14, depth = 0.14) {
  G.pane(P, mat, x0, x1, y0, y1, 0.05);
  P.box(M.white, x0 - b, x1 + b, y1, y1 + b, 0, depth, 'b'); P.box(M.white, x0 - b, x1 + b, y0 - b, y0, 0, depth + 0.05, 'b');
  P.box(M.white, x0 - b, x0, y0, y1, 0, depth, ''); P.box(M.white, x1, x1 + b, y0, y1, 0, depth, '');
}
/** round window (oculus) of radius r with a white rim and cross muntins, at depth z */
export function roundWin(P, M, mat, cx, cy, r, o = {}) {
  const rim = o.rim ?? 0.12, s = new THREE.Shape(); s.absarc(cx, cy, r + rim, 0, TAU, false); const h = new THREE.Path(); h.absarc(cx, cy, r, 0, TAU, true); s.holes.push(h);
  P.extrude(o.rimMat || M.white, s, 0, 0.12, 1, 14);
  const pg = new THREE.Shape(); pg.absarc(cx, cy, r, 0, TAU, false); const g = new THREE.ShapeGeometry(pg, 14), ua = g.attributes.uv, pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) - cx + r) / (2 * r), (pa.getY(i) - cy + r) / (2 * r));
  P.geo(mat, g, 0, 0, 0.04); g.dispose();
  P.box(o.rimMat || M.white, cx - r, cx + r, cy - 0.02, cy + 0.02, 0, 0.07, ''); P.box(o.rimMat || M.white, cx - 0.02, cx + 0.02, cy - r, cy + r, 0, 0.07, '');
}
/** a triangular pediment on a front (frame: x right, z out): base from x0 to x1 at y, apex rise, depth d (the prism behind the front plane is closed by a back face only when `back`) ; tympanum material wall, raking cornice trim */
export function pediment(P, wall, trim, x0, x1, y, rise, depth, o = {}) {
  const cx = (x0 + x1) / 2, half = (x1 - x0) / 2, th = o.th ?? 0.32, z1 = depth;
  // tympanum: a flat triangle (front) + the two raking cornice slopes (boxes tilted)
  P.fan(wall, [[x0, y, z1], [x1, y, z1], [cx, y + rise, z1]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
  const ang = Math.atan2(rise, half), len = Math.hypot(half, rise);
  for (const s of [-1, 1]) slat(P, trim, cx + s * half / 2, y + rise / 2 + th * 0.5, z1 + 0.03, len + 0.2, th, 0.3, -s * ang);
  return ang;
}
/** modillion blocks along a cornice: from x0 to x1 every `pitch`, at height y, projecting `proj`, block size w x h x d */
export function modillions(P, mat, x0, x1, y, z, pitch = 0.8, w = 0.22, h = 0.26, d = 0.28) {
  const n = Math.max(1, Math.round((x1 - x0) / pitch));
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; P.box(mat, x - w / 2, x + w / 2, y - h, y, z, z + d, 'bt'); }
}
/** dentils: small blocks on a front run (like modillions, lower) */
export const dentils = (P, mat, x0, x1, y, z, pitch = 0.7, w = 0.3, h = 0.22, d = 0.14) => modillions(P, mat, x0, x1, y, z, pitch, w, h, d);
/** a balustrade of squat balusters between two rails along x at depth z: n balusters, height h */
export function balustrade(P, mat, x0, x1, y, z, h = 1.0, pitch = 0.42) {
  const n = Math.max(1, Math.round((x1 - x0) / pitch));
  P.box(mat, x0, x1, y, y + 0.16, z - 0.17, z + 0.17, 'b'); P.box(mat, x0, x1, y + h - 0.14, y + h, z - 0.2, z + 0.2, 'b');
  for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; P.col(mat, x, z, y + 0.16, y + h - 0.14, 0.1, 0.1, 6, false); }
}
/** a gilded cross with a ball at its foot: total height h above y */
export function crossOn(P, mat, x, y, z, h, rot = 0) {
  sph(P, mat, x, y + h * 0.1, z, h * 0.095, h * 0.095, h * 0.095, 8);
  G.cross(P, mat, x, y + h * 0.1, z, h * 0.9, rot);
}
/** ogee (keel-pointed) gable outline points (w wide, h tall) for the Trinity arches and the Xenia kokoshniks */
export const ogee = (w, h) => G.ogeePts(w, h, 8);
/** semicircular kokoshnik outline: base from (-w/2, 0) to (w/2, 0), arc of radius w / 2 scaled to rise h */
export function kokoshnikPts(w, h, n = 12) {
  const pts = [[-w / 2, 0], [w / 2, 0]];
  for (let i = 1; i < n; i++) { const a = Math.PI * i / n; pts.push([Math.cos(a) * w / 2, Math.sin(a) * h]); }
  return pts;
}
/** the gable plate of a kokoshnik (a flat shape in the facade plane at depth z facing +z) with a raised white border */
export function kokoshnik(P, M, wall, cx, y, w, h, o = {}) {
  const pts = kokoshnikPts(w, h).map(([x, yy]) => [x + cx, yy + y]);
  G.planeShape(P, wall, pts, 0.0);
  const bw = o.bw ?? 0.22, n = 12, band = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; band.push([cx + Math.cos(a) * (w / 2 + bw), y + Math.sin(a) * (h + bw)]); }
  for (let i = n; i >= 0; i--) { const a = Math.PI * i / n; band.push([cx + Math.cos(a) * w / 2, y + Math.sin(a) * h]); }
  G.solid(P, o.trim || M.xWhite, band, 0, 0.1, 1);
}

/** a band between two open paths (outer from the left foot over the top to the right foot, inner likewise): a flat C-shaped polygon for G.solid; both paths are lists of [x, y] */
export function bandPts(outer, inner) { return outer.concat(inner.slice().reverse()); }
/** the open path of a hoodPts outline (without its base line), left foot first: A, D, the arc from the left shoulder over the apex to the right shoulder, C, B */
export function hoodPath(w, h) { const p = G.hoodPts(w, h, 8); return [p[0], p[p.length - 1], ...p.slice(3, p.length - 1).reverse(), p[2], p[1]]; }
