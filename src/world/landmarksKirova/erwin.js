// landmarksKirova/erwin.js - the building vocabulary of the Erarta facade, all in the CURRENT Parts frame of a wall (local +x along the wall to the right seen from outside, y up, +z out of the wall):
//   fixture(P, M, op, z0, depth)   the trim of one window opening that windowWall (facade.js) has cut: dark timber frame with muntins at the back of the reveal, white surround 0.15 m, white sill,
//                                   optional hood (the white lintel board with two consoles over the third-floor windows of the portico)
//   glassOf(M, i)                   one of the four glass paintings (sky over a dark room / lit room / curtains / basement grating) by index
//   crown(P, M, x0, x1, z, yb, top) the crown cornice of a wing / pavilion: architrave, frieze, a row of dentils, corona (1.05 m, projecting 0.8 m)
//   baseCornice(P, M, x0, x1, z)    the white base cornice 9.4 .. 10.1 with dentils (projecting 0.5 m)
//   balustrade(P, M, x0, x1, z, blocks, y0, y1)   0.9 m terrace balustrade: white balusters in panels between yellow pedestals that carry a black floodlight
import * as THREE from 'three';
// Photos: er04 er05 er06 (windows 2 x 3 / 2 x 2 panes in dark brown frames, thin white surrounds, deep reveals; dentils every 0.6 m; baluster panels 2.1 m between 1.5 m pedestals under the columns).

/** window kinds: size of the opening and the pane division (columns x horizontal bars at fractions of the height) */
export const WK = {
  f1: { w: 1.5, y0: 1.65, y1: 5.05, nx: 2, bars: [0.34, 0.72] },
  f2: { w: 1.4, y0: 6.75, y1: 9.15, nx: 2, bars: [0.5] },
  u3: { w: 1.5, y0: 10.5, y1: 12.75, nx: 2, bars: [0.28, 0.6], hood: true },
  u4: { w: 1.5, y0: 13.9, y1: 16.3, nx: 2, bars: [0.4, 0.75] },
  u5: { w: 1.5, y0: 17.7, y1: 19.7, nx: 2, bars: [0.5] },
  fl1: { w: 1.5, y0: 1.9, y1: 4.8, nx: 2, bars: [0.34, 0.72] },
  fl2: { w: 1.5, y0: 7.0, y1: 8.9, nx: 2, bars: [0.5] },
  fl3: { w: 1.5, y0: 11.0, y1: 13.0, nx: 2, bars: [0.5] },
  fl4: { w: 1.5, y0: 14.4, y1: 16.7, nx: 2, bars: [0.4, 0.75] },
  fl5: { w: 1.5, y0: 18.0, y1: 20.0, nx: 2, bars: [0.5] },
  bs: { w: 1.1, y0: 0.38, y1: 1.12, nx: 2, bars: [], basement: true },
};

/** an op for windowWall (the opening and its glass) from a kind at wall position x; `hash` picks the glass painting */
export function opOf(M, kind, x, hash = 0, over = {}) {
  const k = { ...WK[kind], ...over };
  const gi = k.basement ? 3 : ((hash * 7 + (kind === 'f1' ? 1 : 0)) % 7 < 2 ? 1 : (hash * 5) % 7 < 2 ? 2 : 0);
  return { x, w: k.w, y0: k.y0, y1: k.y1, glass: glassOf(M, gi), nx: k.nx, bars: k.bars, hood: !!k.hood, kind: 'win', basement: !!k.basement };
}
export const glassOf = (M, i) => [M.eGlA, M.eGlB, M.eGlC, M.eGlD][i];

/** frame, muntins, surround, sill, hood of one window (the opening itself is cut by windowWall at wall plane z0, reveal depth `depth`) */
export function fixture(P, M, op, z0, depth = 0.24) {
  const xa = op.x - op.w / 2, xb = op.x + op.w / 2, y0 = op.y0, y1 = op.y1, zb = z0 - depth, fr = 0.065, mu = 0.042, zf = zb + 0.1;
  // frame ring (the front of the frame is 4 cm behind the reveal edge: z = zb .. zf)
  P.box(M.eFrame, xa, xa + fr, y0, y1, zb, zf, 'ktb', 1); P.box(M.eFrame, xb - fr, xb, y0, y1, zb, zf, 'ktb', 1);
  P.box(M.eFrame, xa + fr, xb - fr, y1 - fr, y1, zb, zf, 'kbt', 1); P.box(M.eFrame, xa + fr, xb - fr, y0, y0 + fr, zb, zf, 'ktb', 1);
  const h = y1 - y0 - 2 * fr, w = xb - xa - 2 * fr;
  for (let i = 1; i < (op.nx || 2); i++) { const x = xa + fr + w * i / op.nx; P.box(M.eFrame, x - mu / 2, x + mu / 2, y0 + fr, y1 - fr, zb + 0.02, zf - 0.02, 'k', 1); }
  for (const f of op.bars || []) { const y = y0 + fr + h * f; P.box(M.eFrame, xa + fr, xb - fr, y - mu / 2, y + mu / 2, zb + 0.02, zf - 0.02, 'k', 1); }
  if (op.basement) { for (let x = xa + 0.1; x < xb - 0.05; x += 0.14) P.box(M.eFrame, x, x + 0.025, y0, y1, zb + 0.1, zb + 0.13, 'k', 1); return; }
  // white surround (0.15 m, 4 cm proud), lintel and sill
  const sw = 0.15, sp = 0.045;
  P.box(M.eWhite, xa - sw, xa, y0, y1 + sw, z0, z0 + sp, 'bk', 2); P.box(M.eWhite, xb, xb + sw, y0, y1 + sw, z0, z0 + sp, 'bk', 2);
  P.box(M.eWhite, xa - sw, xb + sw, y1, y1 + sw, z0, z0 + sp, 'bk', 2);
  P.box(M.eWhite, xa - sw - 0.05, xb + sw + 0.05, y0 - 0.1, y0, z0, z0 + 0.14, 'k', 2);
  if (op.hood) {                                                                                   // the white hood over a third-floor window: a flat board on two consoles
    const hy = y1 + sw + 0.02;
    P.box(M.eWhite, xa - 0.32, xb + 0.32, hy + 0.34, hy + 0.5, z0, z0 + 0.24, 'k', 2);
    P.box(M.eWhite, xa - 0.2, xb + 0.2, hy, hy + 0.34, z0, z0 + 0.1, 'k', 2);
    P.box(M.eWhite, xa - 0.16, xa + 0.06, hy, hy + 0.34, z0, z0 + 0.2, 'k', 2); P.box(M.eWhite, xb - 0.06, xb + 0.16, hy, hy + 0.34, z0, z0 + 0.2, 'k', 2);
  }
}

/** a row of dentils: blocks 0.32 wide every 0.6 m between x0 and x1, y0..y1, from z to z + d (faces toward the viewer only) */
export function dentils(P, mat, x0, x1, y0, y1, z, d, pitch = 0.6, w = 0.32) {
  const n = Math.max(1, Math.floor((x1 - x0) / pitch)), p = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const x = x0 + (i + 0.5) * p; P.box(mat, x - w / 2, x + w / 2, y0, y1, z, z + d, 'kb', 1); }
}

/** the crown cornice below `top` (1.05 m): architrave, frieze, dentils, corona; wall plane z, x0..x1 */
export function crown(P, M, x0, x1, z, top) {
  const yb = top - 1.05;
  P.box(M.eWhite, x0 - 0.1, x1 + 0.1, yb, yb + 0.35, z, z + 0.12, 'kb', 2);
  P.box(M.eFrieze, x0 - 0.12, x1 + 0.12, yb + 0.35, yb + 0.6, z, z + 0.14, 'kb', 2);
  dentils(P, M.eWhite, x0 - 0.1, x1 + 0.1, yb + 0.5, yb + 0.85, z + 0.12, 0.2, 0.85, 0.3);                  // square blocks 0.3 x 0.35 at a pitch of 0.85 m (kv374)
  P.box(M.eWhite, x0 - 0.3, x1 + 0.3, yb + 0.85, top - 0.08, z, z + 0.8, 'k', 2);
  P.box(M.eWhite, x0 - 0.34, x1 + 0.34, top - 0.08, top, z, z + 0.84, 'kb', 2);
}

/** the base cornice 9.4 .. 10.1 (white), projecting 0.5, with a dentil row under the corona */
export function baseCornice(P, M, x0, x1, z) {
  P.box(M.eWhite, x0 - 0.05, x1 + 0.05, 9.4, 9.62, z, z + 0.22, 'kb', 2);
  dentils(P, M.eWhite, x0, x1, 9.62, 9.82, z + 0.22, 0.12, 0.5, 0.26);
  P.box(M.eWhite, x0 - 0.1, x1 + 0.1, 9.82, 10.1, z, z + 0.5, 'k', 2);
}

/** one globe + flood fixture on a pedestal top (photos a07 .. a13, 2025: a white globe lamp Ø 0.46 beside a grey Philips-type flood housing 0.3 x 0.4 with a round tilted lens, conduit) */
let _globe = null;
function fixtures(P, M, cx, y, z, side = 1) {
  if (!_globe) _globe = new THREE.SphereGeometry(0.23, 10, 8);
  P.geo(M.eLampWhite, _globe, cx - 0.42 * side, y + 0.235, z - 0.02);                                                    // the globe lamp (lit, white)
  P.box(M.eLampBlack, cx - 0.42 * side - 0.08, cx - 0.42 * side + 0.08, y, y + 0.05, z - 0.08, z + 0.04, 'b', 1);          // its foot
  const hx = cx + 0.36 * side;
  P.box(M.col('#4c4f53'), hx - 0.15, hx + 0.15, y, y + 0.4, z - 0.14, z + 0.11, 'b', 1);                                    // the flood housing
  P.cyl(M.eLampWhite, [hx, y + 0.28, z + 0.11], [hx, y + 0.33, z + 0.2], 0.12, 0.12, 10, true);                              // the round lens, tilted up and out
  P.box(M.col('#6a6d70'), hx + 0.1, hx + 0.13, y, y + 0.3, z - 0.2, z - 0.14, '', 1);                                        // the grey conduit on its back
}

/** balustrade of the terrace: y0..y1 at wall-plane z (front face z + 0.0); `blocks` = centres of the cream PEDESTALS (bw wide x ph high x pd deep: 1.65 x 0.95 x 0.6 under the columns, erarta-detail 1.4);
 *  panels of 6 - 7 balusters (pitch ~0.28) between them; every pedestal wider than 1.2 m carries a globe lamp and a flood housing */
export function balustrade(P, M, x0, x1, z, blocks, y0 = 10.1, y1 = 11.0, o = {}) {
  const bw = o.bw ?? 1.65, ph = o.ph ?? 0.95, pd = o.pd ?? 0.6, cuts = [...blocks].sort((a, b) => a - b);
  const stops = [x0, ...cuts.flatMap((c) => [Math.max(x0, c - bw / 2), Math.min(x1, c + bw / 2)]), x1];
  for (let i = 0; i + 1 < stops.length; i += 2) {                                                 // panels between pedestals
    const a = stops[i], b = stops[i + 1]; if (b - a < 0.3) continue;
    P.box(M.eWhite, a, b, y0, y0 + 0.14, z - 0.12, z + 0.12, 'b', 2);                              // bottom rail
    P.box(M.eWhite, a, b, y1 - 0.1, y1, z - 0.13, z + 0.13, 'b', 2);                               // handrail
    const n = Math.max(2, Math.round((b - a) / 0.28)), p = (b - a) / n;
    for (let j = 0; j < n; j++) {
      const x = a + (j + 0.5) * p;
      P.box(M.eWhite, x - 0.04, x + 0.04, y0 + 0.14, y1 - 0.1, z - 0.04, z + 0.04, 'bt', 1);        // the shaft
      P.box(M.eWhite, x - 0.065, x + 0.065, y0 + 0.28, y0 + 0.5, z - 0.065, z + 0.065, 'bt', 1);    // the swell of the vase
    }
  }
  for (const c of cuts) {                                                                          // pedestals with a globe and a flood
    const a = Math.max(x0, c - bw / 2), b = Math.min(x1, c + bw / 2); if (b - a < 0.3) continue;
    P.box(M.eYellow, a, b, y0, y0 + ph, z - pd / 2, z + pd / 2, 'b', 2); P.box(M.eWhite, a - 0.04, b + 0.04, y0 + ph, y0 + ph + 0.06, z - pd / 2 - 0.04, z + pd / 2 + 0.04, 'b', 2);
    if (!o.noLamps && b - a > 1.1) fixtures(P, M, (a + b) / 2, y0 + ph + 0.06, z, ((Math.round(c * 7) % 2) ? 1 : -1));
  }
}
