// landmarksKamennyTheatre/relief.js - the white relief of the front pediment (photos T03 T14 X10): a lyre with griffin-headed arms, a scrolled yoke on an urn and a crown of flames; two thyrsi with pine-cone heads and
// hanging garlands; two bearded theatre masks with open mouths; a tambourine, a horn, a flute, pan-pipes and a set square, all lying on a thin ledge in the middle of the tympanum.  Drawn in the near collector N, in the
// pediment frame (x across, y up, z out), 6.2 m wide, 3.0 m high.  ~2.5 k triangles.
import * as THREE from 'three';
import { ball } from './geo.js';

export function relief(K, cx, y0, z0) {
  const { M, N } = K, W = M.white, D = M.dark;
  N.push(cx, y0, z0, 0);
  const cyl = (a, b, r0, r1 = r0, seg = 8, mat = W) => N.cyl(mat, [a[0], a[1], a[2] ?? 0.1], [b[0], b[1], b[2] ?? 0.1], r0, r1, seg, true);
  const ell = (x, y, z, sx, sy, sz, mat = W, ws = 12, hs = 9) => { const g = new THREE.SphereGeometry(1, ws, hs); N.geo(mat, g, x, y, z, 0, 0, 0, sx, sy, sz); g.dispose(); };
  const tor = (x, y, z, R, r, rx = 0, ry = 0, mat = W) => { const g = new THREE.TorusGeometry(R, r, 6, 16); N.geo(mat, g, x, y, z, rx, ry, 0); g.dispose(); };
  N.box(W, -3.15, 3.15, 0, 0.06, 0, 0.14, 'b', 1);                                              // the ledge
  // ---- the lyre
  for (const s of [-1, 1]) {
    cyl([s * 0.46, 0.5], [s * 0.5, 2.0], 0.17, 0.12, 12);                                       // the arm
    for (const y of [0.98, 1.25]) tor(s * 0.43, y, 0.1, 0.19, 0.045, Math.PI / 2, 0);           // collars
    cyl([s * 0.4, 1.05], [s * 0.4, 1.2], 0.25, 0.22, 10);
    for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.5; cyl([s * 0.4, 1.2], [s * (0.4 + Math.sin(a) * 0.32), 1.2 + Math.cos(a) * 0.3], 0.05, 0.0, 5); }   // leaf crown on the arm
    ell(s * 0.5, 2.13, 0.1, 0.17, 0.2, 0.17, W, 10, 8);                                         // griffin head
    cyl([s * 0.55, 2.12], [s * 0.82, 2.2], 0.1, 0.0, 6);                                        // beak
    ell(s * 0.28, 2.1, 0.1, 0.07, 0.07, 0.07, W, 6, 5);                                         // pine cone
    ell(s * 0.55, 2.2, 0.17, 0.035, 0.035, 0.03, D, 5, 4);                                      // eye
    ell(s * 0.2, 0.3, 0.1, 0.2, 0.2, 0.1, W, 10, 6);                                            // the scroll volutes of the yoke
    tor(s * 0.34, 0.34, 0.12, 0.17, 0.035, 0, 0);
  }
  cyl([-0.5, 0.52], [0.5, 0.52], 0.15, 0.15, 12);
  cyl([0, 0.52], [0, 0.14], 0.42, 0.22, 14);                                                    // the urn under the yoke
  cyl([0, 0.14], [0, 0.0], 0.3, 0.3, 14);
  for (let i = -2; i <= 2; i++) ell(i * 0.12, 0.34, 0.13, 0.05, 0.1, 0.03, W, 5, 4);            // palmette
  for (let i = 0; i < 7; i++) N.box(W, -0.3 + i * 0.1 - 0.014, -0.3 + i * 0.1 + 0.014, 0.72, 1.95, 0.08, 0.12, '', 1);   // strings
  N.box(W, -0.4, 0.4, 1.93, 2.05, 0.07, 0.15, '', 1);
  N.box(W, -0.22, 0.22, 0.6, 0.72, 0.07, 0.15, '', 1);
  for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.26; cyl([0, 2.05], [Math.sin(a) * 0.55, 2.05 + Math.cos(a) * 0.72], 0.065, 0.0, 5); }   // crown of flames
  // ---- thyrsi with pine-cone heads and garlands
  for (const s of [-1, 1]) {
    cyl([s * 0.55, 1.05], [s * 2.85, 1.65], 0.055, 0.055, 6);
    for (const t of [0.12, 0.5, 0.88]) { const x = s * (0.55 + 2.3 * t), y = 1.05 + 0.6 * t; tor(x, y, 0.1, 0.075, 0.025, 0, 0.0); }   // bindings
    ell(s * 3.0, 1.69, 0.1, 0.22, 0.14, 0.14, W, 8, 6);                                         // the pine cone
    cyl([s * 3.1, 1.71], [s * 3.28, 1.76], 0.05, 0.0, 5);
    for (const [gx, gy, gr] of [[1.45, 1.05, 0.23], [2.25, 1.2, 0.2]]) tor(s * gx, gy - 0.16, 0.1, gr, 0.035, 0, 0);
    for (let i = 0; i < 6; i++) ell(s * (0.9 + i * 0.32), 1.28 + i * 0.07 - ((i % 2) ? 0.12 : 0), 0.12, 0.05, 0.08, 0.03, W, 5, 4);   // hanging leaves
  }
  // ---- masks
  for (const s of [-1, 1]) {
    const x = s * 1.0;
    ell(x, 0.64, 0.1, 0.36, 0.5, 0.2, W, 14, 10);                                               // the face
    ell(x, 0.99, 0.13, 0.4, 0.17, 0.2, W, 12, 6);                                               // the headdress / hair
    for (const sx of [-1, 1]) { ell(x + sx * 0.16, 0.74, 0.28, 0.1, 0.055, 0.04, D, 6, 5); ell(x + sx * 0.16, 0.81, 0.29, 0.13, 0.03, 0.04, W, 6, 4); }   // eye sockets with brows
    cyl([x, 0.72, 0.27], [x, 0.5, 0.33], 0.05, 0.03, 5);                                        // the nose
    ell(x, 0.36, 0.29, 0.13, 0.085, 0.05, D, 8, 5);                                             // the open mouth
    cyl([x, 0.46, 0.2], [x, -0.06, 0.2], 0.28, 0.1, 10);                                        // the beard
    for (let i = -2; i <= 2; i++) cyl([x + i * 0.1, 0.3, 0.3], [x + i * 0.12, -0.02, 0.3], 0.03, 0.0, 4);
    cyl([x + s * 0.34, 0.95, 0.12], [x + s * 0.66, 0.1, 0.12], 0.1, 0.16, 8);                   // the veil falling beside the cheek
    for (let i = 0; i < 4; i++) cyl([x + s * (0.36 + i * 0.08), 0.85 - i * 0.05, 0.2], [x + s * (0.5 + i * 0.1), 0.15, 0.2], 0.02, 0.02, 4);
  }
  // ---- tambourine, horn, flute, pan-pipes, set square
  cyl([-2.0, 0.64, 0.02], [-2.0, 0.64, 0.14], 0.5, 0.5, 20); cyl([-2.0, 0.64, 0.14], [-2.0, 0.64, 0.17], 0.4, 0.4, 20, D);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ell(-2.0 + Math.cos(a) * 0.5, 0.64 + Math.sin(a) * 0.5, 0.14, 0.05, 0.05, 0.03, W, 5, 4); }
  cyl([-2.95, 0.98], [-2.45, 0.42], 0.28, 0.06, 10); tor(-2.9, 0.93, 0.1, 0.27, 0.03, 0.6, 0.4);
  cyl([-2.6, 0.2], [-1.45, 0.32], 0.07, 0.07, 6);
  for (let i = 0; i < 8; i++) cyl([1.45 + i * 0.15, 0.2, 0.05], [1.45 + i * 0.15, 0.2 + 0.95 - i * 0.07, 0.05], 0.07, 0.07, 7);
  N.box(W, 1.4, 2.65, 0.55, 0.62, 0.04, 0.12, '', 1);
  cyl([2.7, 1.45], [3.45, 0.2], 0.035, 0.035, 5); N.box(W, 2.7, 3.45, 0.18, 0.24, 0.08, 0.12, '', 1); N.box(W, 2.67, 2.73, 0.2, 1.45, 0.08, 0.12, '', 1);
  ball(N, W, 2.7, 1.47, 0.1, 0.05, 5);
  N.pop();
}
