// landmarksAndrew/orders.js - facade vocabulary shared by the church parts (Three Hierarchs, Annunciation, chapel): rectangular / arched windows with white surrounds, pilasters, coupled columns, door recesses,
// lamps.  All helpers draw in the CURRENT Parts frame, which must be a facade frame (x right, y up, z out of the wall at z = 0) unless stated.  Materials come from M (mats.js).
import * as THREE from 'three';
import * as G from './geo.js';

const TAU = Math.PI * 2;
const boxG = new THREE.BoxGeometry(1, 1, 1);

/** a rectangular window: glass decal (mat) in a white frame (border b, depth dp), a sill, an optional lintel: 'flat' (a plain head with a projecting cap) | 'pedi' (a small triangular pediment) | 'hood' (a green / grey hood) */
export function rectWin(P, M, cx, y0, w, h, o = {}) {
  const b = o.b ?? 0.14, dp = o.depth ?? 0.1, mat = o.mat || M.win23, x0 = cx - w / 2, x1 = cx + w / 2;
  P.quad(mat, [x0, y0, 0.04], [x1, y0, 0.04], [x1, y0 + h, 0.04], [x0, y0 + h, 0.04], [0, 0, 1]);
  P.box(M.white, x0 - b, x0, y0 - b, y0 + h + b, 0, dp, 'bk', 1); P.box(M.white, x1, x1 + b, y0 - b, y0 + h + b, 0, dp, 'bk', 1);
  P.box(M.white, x0, x1, y0 + h, y0 + h + b, 0, dp, 'bk', 1); P.box(M.white, x0 - b * 1.5, x1 + b * 1.5, y0 - b * 1.7, y0 - b * 0.2, 0, dp * 2.2, 'bk', 1);
  if (o.lintel === 'pedi') P.fan(M.white, [[x0 - b * 1.4, y0 + h + b, 0.05], [x1 + b * 1.4, y0 + h + b, 0.05], [cx, y0 + h + b + (w + b * 2.8) * 0.28, 0.05]], [0, 0, 1]);
  else if (o.lintel === 'flat') P.box(M.white, x0 - b * 1.4, x1 + b * 1.4, y0 + h + b, y0 + h + b * 1.9, 0, dp * 2.4, 'bk', 1);
  else if (o.lintel === 'hood') P.box(o.hoodMat || M.copper, x0 - b * 1.6, x1 + b * 1.6, y0 + h + b, y0 + h + b * 1.9, 0, dp * 4, 'b', 1);
}
/** a pilaster: shaft w wide, proud pr, from y0 to y1, with a base block and a capital band */
export function pilaster(P, M, u, y0, y1, w = 0.5, pr = 0.12) {
  P.box(M.white, u - w / 2, u + w / 2, y0, y1, 0, pr, 'bk', 1);
  P.box(M.whiteShade, u - w * 0.62, u + w * 0.62, y1 - 0.5, y1, 0, pr + 0.06, 'bk', 1);
  P.box(M.whiteShade, u - w * 0.6, u + w * 0.6, y0, y0 + 0.28, 0, pr + 0.05, 'bk', 1);
}
/** a full round column (shaft taper, base, capital) standing at (x, z) in the current frame from y0 to y1, radius r */
export function column(P, M, x, z, y0, y1, r) {
  P.box(M.whiteShade, x - r * 1.35, x + r * 1.35, y0, y0 + r * 0.55, z - r * 1.35, z + r * 1.35, 'b', 1);
  P.col(M.white, x, z, y0 + r * 0.55, y1 - r * 1.1, r * 1.0, r * 0.88, 16, false);
  P.col(M.whiteShade, x, z, y1 - r * 1.1, y1 - r * 0.45, r * 0.95, r * 1.3, 16, false);
  P.box(M.whiteShade, x - r * 1.55, x + r * 1.55, y1 - r * 0.45, y1, z - r * 1.55, z + r * 1.55, 'b', 1);
}
/** an arched door recess: a rose / wall-coloured panel, the door decal (mat) in an arch, a white archivolt, three steps in front */
export function doorArch(P, M, cx, y0, w, h, o = {}) {
  const wall = o.wall || M.rose, mat = o.mat || M.doorBrown, fw = o.frame ?? 0.4;
  P.quad(wall, [cx - w / 2 - fw, y0, 0.02], [cx + w / 2 + fw, y0, 0.02], [cx + w / 2 + fw, y0 + h + w / 2 + fw, 0.02], [cx - w / 2 - fw, y0 + h + w / 2 + fw, 0.02], [0, 0, 1]);
  G.planeShape(P, mat, G.archPts(cx, y0, w, h, 10), 0.05);
  G.frameRing(P, M.white, G.archPts(cx, y0 - 0.05, w + fw * 2, h + fw * 1.2, 10), G.archPts(cx, y0, w, h, 10), 0, o.depth ?? 0.18, 1);
}
/** a black cast-iron lantern lamp (3.3 m): fluted post, square glass lantern with a cap and a ball finial; frame: base at the origin */
export function lanternLamp(Q, M, h = 3.3) {
  Q.box(M.lampBlack, -0.16, 0.16, 0, 0.45, -0.16, 0.16, 'b', 1);
  Q.cyl(M.lampBlack, [0, 0.45, 0], [0, h - 0.8, 0], 0.075, 0.05, 8, false);
  Q.cyl(M.lampBlack, [0, 0.45, 0], [0, 0.75, 0], 0.13, 0.075, 8, false);
  Q.box(M.lampBlack, -0.15, 0.15, h - 0.82, h - 0.72, -0.15, 0.15, '', 1);
  Q.box(M.globe, -0.13, 0.13, h - 0.72, h - 0.2, -0.13, 0.13, 'bt', 1);
  for (const [x, z] of [[-0.13, -0.13], [0.13, -0.13], [0.13, 0.13], [-0.13, 0.13]]) Q.box(M.lampBlack, x - 0.015, x + 0.015, h - 0.72, h - 0.2, z - 0.015, z + 0.015, '', 1);
  Q.cyl(M.lampBlack, [0, h - 0.2, 0], [0, h - 0.02, 0], 0.22, 0.02, 4, true);
  Q.geo(M.lampBlack, new THREE.SphereGeometry(0.04, 6, 4), 0, h + 0.02, 0);
}
export { boxG, TAU };
