// landmarksPetrovskyStadium/masts.js - the four TWIN-LEG lattice floodlight towers of the Petrovsky stadium (OSM n7617998960..63, tower:type=lighting; photos s02 s04 s12 s01) and the three poles of the
// small arena.  Each tower: two parallel square lattice legs 11.4 m apart (the line of the legs follows the island edge, perpendicular to the direction of the pitch), leaning 8.5 m toward the pitch over
// 55 m, tied by three X-braced portal frames, a 15.4 x 11 m lamp bank of twelve louvred shelves hung over the heads of both legs, a smaller bank of six shelves low between the legs, concrete pedestals,
// lightning rods.  Lattice sections are 4-sided beams (8 triangles): ~3.3 k triangles per tower.  Bare steel, no flags (user rule).  The legs are solid at the foot (collider boxes).
import { MAST_H } from './frame.js';

const SEC = 3.0, W0 = 1.5, W1 = 0.8, LEG = 5.7, LEAN = 8.5;

/** one lattice leg of a tower in the local frame (x: along the pair, z: toward the pitch), centred on x = xc */
function leg(P, M, xc, H = MAST_H) {
  const n = Math.floor((H - 0.9) / SEC), at = (y) => { const t = (y - 0.9) / (H - 0.9); return { w: W0 + (W1 - W0) * t, z: LEAN * t }; };
  const corner = (y, sx, sz) => { const p = at(y); return [xc + sx * p.w, y, p.z + sz * p.w]; };
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of C) P.beam(M.steel, corner(0.9, sx, sz), corner(H, sx, sz), 0.1);                                  // the four chords
  for (let i = 0; i <= n; i++) {
    const y = 0.9 + i * SEC, y1 = Math.min(H, y + SEC);
    for (let c = 0; c < 4; c++) { const a = C[c], b = C[(c + 1) % 4]; P.beam(M.steel, corner(y, a[0], a[1]), corner(y, b[0], b[1]), 0.05); }          // horizontal ties
    if (i < n) for (let c = 0; c < 4; c++) { const a = C[c], b = C[(c + 1) % 4], flip = (i + c) % 2; P.beam(M.steel, flip ? corner(y, a[0], a[1]) : corner(y, b[0], b[1]), flip ? corner(y1, b[0], b[1]) : corner(y1, a[0], a[1]), 0.045); }
  }
  const top = corner(H, 0, 0); P.col(M.steelGrey, top[0], top[2], H, H + 4.5, 0.05, 0.03, 4, false);                  // lightning rod
}

/** a bank of `rows` louvred shelves, width w, bottom y0, back plane z (local), shelf pitch dy: a dark back plate, per shelf a body with the lamp-texture face and a white hood, a dark gap between the shelves (s04) */
function bank(P, M, xc, w, y0, zBack, rows, dy) {
  const x0 = xc - w / 2, x1 = xc + w / 2, h = dy * 0.62;
  P.box(M.dark, x0, x1, y0 - 0.2, y0 + rows * dy + 0.3, zBack - 0.1, zBack + 0.1, 'fk');                                  // the back plate
  for (let i = 0; i < rows; i++) {
    const y = y0 + i * dy, z = zBack + 0.1 + i * 0.12;
    P.box(M.steelGrey, x0, x1, y, y + h, zBack + 0.1, z + 1.0, 'f');                                                      // the shelf body
    P.quad(M.lamps, [x0, y, z + 1.01], [x1, y, z + 1.01], [x1, y + h, z + 1.01], [x0, y + h, z + 1.01], [0, 0, 1], [[0, 0], [w / 15, 0], [w / 15, 1], [0, 1]]);
    P.box(M.steel, x0 - 0.1, x1 + 0.1, y + h, y + h + 0.1, zBack + 0.1, z + 1.7, '');                                       // the hood, projecting over the lamps
  }
  for (const x of [x0 + 0.06, x1 - 0.06, xc]) P.box(M.steel, x - 0.07, x + 0.07, y0 - 0.2, y0 + rows * dy + 0.3, zBack, zBack + 1.5, '');   // the verticals
}

/** a twin-leg tower with its foot at world (x, z); the pair of legs is perpendicular to the direction (dx, dz) (unit, toward the pitch) */
export function tower(P, M, x, z, dx, dz) {
  const rot = Math.atan2(dx, dz), H = MAST_H;
  P.push(x, 0, z, rot);
  for (const s of [-1, 1]) { P.box(M.concrete, s * LEG - 1.9, s * LEG + 1.9, 0, 0.9, -1.9, 1.9, 'b'); P.box(M.creamShade, s * LEG - 1.6, s * LEG + 1.6, 0.9, 1.1, -1.6, 1.6, 'b'); leg(P, M, s * LEG, H); }
  // three portal frames between the legs: two horizontal struts (front / back faces) and X diagonals to the next frame
  const ys = [12, 24, 36, 47], P3 = (y, s, sz) => { const t = (y - 0.9) / (H - 0.9), w = W0 + (W1 - W0) * t, z0 = LEAN * t; return [s * LEG - s * w, y, z0 + sz * w]; };
  for (let i = 0; i < ys.length; i++) {
    for (const sz of [-1, 1]) P.beam(M.steel, P3(ys[i], -1, sz), P3(ys[i], 1, sz), 0.07);
    if (i + 1 < ys.length) for (const sz of [-1, 1]) { P.beam(M.steel, P3(ys[i], -1, sz), P3(ys[i + 1], 1, sz), 0.05); P.beam(M.steel, P3(ys[i], 1, sz), P3(ys[i + 1], -1, sz), 0.05); }
  }
  // the lamp banks: the main one over the heads of both legs (hung on the pitch side), the small one low between the legs
  bank(P, M, 0, 2 * LEG + 4.0, H - 12.2, LEAN + W1 + 0.9, 12, 0.95);
  bank(P, M, 0, 6.2, 11.5, LEAN * 0.2 + 1.7, 6, 0.9);
  P.pop();
  return rot;
}

/** the 15 m poles of the small arena: a steel pole with a two-column lamp panel leaning toward the pitch */
export function pole(P, M, x, z, dx, dz) {
  P.push(x, 0, z, Math.atan2(dx, dz));
  P.box(M.concrete, -0.5, 0.5, 0, 0.5, -0.5, 0.5, 'b');
  P.col(M.steelGrey, 0, 0, 0.5, 15.2, 0.2, 0.13, 8, true);
  P.box(M.steelGrey, -1.4, 1.4, 14.4, 17.7, 0.25, 0.45, 'f');
  P.quad(M.lamps, [-1.35, 14.45, 0.46], [1.35, 14.45, 0.46], [1.35, 17.65, 0.46], [-1.35, 17.65, 0.46], [0, 0, 1], [[0, 0], [0.18, 0], [0.18, 3.2 / 1.1], [0, 3.2 / 1.1]]);
  P.pop();
}

/** colliders of a tower: a box under each leg */
export function towerColliders(ph, x, z, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  for (const sg of [-1, 1]) ph.addBox(x + sg * LEG * c, z - sg * LEG * s, 3.6, 3.6, rot, 0, 14);
}
