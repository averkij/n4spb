// landmarksBotanicalGreenhouses/house.js - the ordinary glass houses of the squares (dossier 4.1a table, 4.1c): `leanTo` = a court-side lean-to (a 6.8 m stucco back wall with two rows of tall windows and
// a white cornice towards the park, a low glass front wall and a glass roof sloping down to the court: aerial F1, photo 36), `gable` = a stock house with a glass gable roof (houses 22-24, the passage,
// the corridors).  Both are built on the oriented rectangle of the OSM ring (geo.rectOf); the walls stand on the real ring in colliders (walk.js), the roof planes and the rafters are exact planes.
// The glass is tiles with uv 0..1 (atlas rule): a 40 m wall = 20 quads.  Detail (rafters, posts, ridge bar) goes to the detail collector D (hidden beyond ~170 m).
import { tileQuad, wallTiles, wallFlat, glassWallTiles, bar, lerp } from './geo.js';

const neg = (v) => [-v[0], -v[1]];

/** o: { back: [x, z] world direction the stucco wall faces, eave = 3.0, hb = 6.8 (back wall top), noPlinth } */
export function leanTo(K, r, o = {}) {
  const { P, D, M } = K;
  const eave = o.eave ?? 3.0, hb = o.hb ?? 6.8, plF = 0.7, plB = 0.8;
  const da = r.ax[0] * o.back[0] + r.ax[1] * o.back[1], db = r.ay[0] * o.back[0] + r.ay[1] * o.back[1];
  let a, b, ha, hl;
  if (Math.abs(da) > Math.abs(db)) { a = da > 0 ? r.ax : neg(r.ax); b = r.ay; ha = r.hx; hl = r.hy; } else { a = db > 0 ? r.ay : neg(r.ay); b = r.ax; ha = r.hy; hl = r.hx; }
  const pt = (s, t) => [r.c[0] + a[0] * s + b[0] * t, r.c[1] + a[1] * s + b[1] * t];
  const na = neg(a), nb = neg(b);
  const th = Math.atan2(a[0], a[1]);
  const back0 = pt(ha, -hl), back1 = pt(ha, hl), fr0 = pt(-ha, -hl), fr1 = pt(-ha, hl);
  // ---- the glass front wall on a stone plinth
  wallFlat(P, M.stone, fr0, fr1, 0, plF, plF, na);
  glassWallTiles(P, M, fr0, fr1, plF, eave, eave, na);
  // ---- the stucco back wall: plinth, two rows of window bays, cornice
  wallFlat(P, M.stone, back0, back1, 0, plB, plB, a);
  const rows = Math.max(1, Math.round((hb - plB) / 3.0));
  wallTiles(P, M.win, back0, back1, plB, hb, hb, 3.0, (hb - plB) / rows, a);
  P.push(r.c[0] + a[0] * ha, 0, r.c[1] + a[1] * ha, th);
  P.box(M.white, -hl - 0.12, hl + 0.12, hb - 0.55, hb + 0.12, -0.08, 0.34);                      // the cornice with its overhang
  P.box(M.stone, -hl - 0.05, hl + 0.05, plB - 0.02, plB + 0.12, -0.03, 0.06);                     // the plinth ledge
  for (let rw = 1; rw < rows; rw++) P.box(M.white2, -hl, hl, plB + (hb - plB) * rw / rows - 0.1, plB + (hb - plB) * rw / rows + 0.1, -0.02, 0.07);   // string course between the window rows
  P.pop();
  P.push(r.c[0] - a[0] * ha, 0, r.c[1] - a[1] * ha, th + Math.PI);
  P.box(M.iron, -hl - 0.05, hl + 0.05, eave - 0.1, eave + 0.14, -0.04, 0.14);                     // the gutter along the front eave
  P.pop();
  // ---- the two end walls: stucco trapezoids (low glass side, tall back side)
  // (a stone plinth, one row of window bays up to the eave line, the stucco gable-shaped top with a cornice line along the slope: no blank wall at eye height)
  for (const [A, B, n_, up] of [[fr1, back1, b, true], [back0, fr0, nb, false]]) {
    wallFlat(P, M.stone, A, B, 0, plF, plF, n_);
    wallTiles(P, M.win, A, B, plF, eave, eave, 3.0, eave - plF, n_);
    if (up) wallFlat(P, M.cream, A, B, eave, eave, hb, n_); else wallFlat(P, M.cream, A, B, eave, hb, eave, n_);
  }
  // ---- the glass roof plane
  const rb = hb - 0.4;
  tileQuad(P, M.glassRoof, [fr0[0], eave, fr0[1]], [fr1[0], eave, fr1[1]], [back1[0], rb, back1[1]], [back0[0], rb, back0[1]], 2.0, 2.4, [0, 1, 0]);
  // ---- detail: rafters every 2 m, posts, a ridge strip under the cornice
  const nR = Math.max(1, Math.round(2 * hl / 2.0));
  for (let k = 0; k <= nR; k++) {
    const t = -hl + 2 * hl * k / nR, p = pt(-ha, t), q = pt(ha, t);
    bar(D, M.iron, [p[0], eave + 0.05, p[1]], [q[0], rb + 0.05, q[1]], 0.05);
    if (k < nR || true) { const f = pt(-ha, t); D.cyl(M.iron, [f[0], plF, f[1]], [f[0], eave, f[1]], 0.06, 0.06, 4, false); }
  }
  D.cyl(M.iron, [pt(-ha, -hl)[0], eave, pt(-ha, -hl)[1]], [pt(-ha, hl)[0], eave, pt(-ha, hl)[1]], 0.05, 0.05, 4, false);
  return { pt, a, b, ha, hl };
}

/** a stock house with a glass gable roof along the long axis: o: { eave = 2.6, ridge = 5.6, wall: 'glass' | 'stucco' } */
export function gable(K, r, o = {}) {
  const { P, D, M } = K;
  const eave = o.eave ?? 2.6, ridge = o.ridge ?? 5.6, pl = 0.55;
  const a = r.ay, b = r.ax, ha = r.hy, hl = r.hx;                                                 // ridge along the long axis (b)
  const pt = (s, t) => [r.c[0] + a[0] * s + b[0] * t, r.c[1] + a[1] * s + b[1] * t];
  const na = neg(a), nb = neg(b);
  const sides = [[pt(-ha, -hl), pt(-ha, hl), na], [pt(ha, hl), pt(ha, -hl), a]];
  for (const [A, B, n] of sides) { wallFlat(P, M.stone, A, B, 0, pl, pl, n); glassWallTiles(P, M, A, B, pl, eave, eave, n); }
  // gable ends: a low glass wall and a glass triangle above it
  for (const [s, n] of [[1, b], [-1, nb]]) {
    const L0 = pt(-ha, s * hl), L1 = pt(ha, s * hl), Mid = pt(0, s * hl);
    wallFlat(P, M.stone, L0, L1, 0, pl, pl, n);
    glassWallTiles(P, M, L0, L1, pl, eave, eave, n);
    tileQuad(P, M.glassWall, [L0[0], eave, L0[1]], [L1[0], eave, L1[1]], [Mid[0], ridge, Mid[1]], [Mid[0], ridge, Mid[1]], 2.0, 2.2, [n[0], 0, n[1]], { uv: [[0, 0], [1, 0], [1, 0.5], [0, 0.5]] });
  }
  // roof planes
  tileQuad(P, M.glassRoof, [pt(-ha, -hl)[0], eave, pt(-ha, -hl)[1]], [pt(-ha, hl)[0], eave, pt(-ha, hl)[1]], [pt(0, hl)[0], ridge, pt(0, hl)[1]], [pt(0, -hl)[0], ridge, pt(0, -hl)[1]], 2.0, 2.4, [0, 1, 0]);
  tileQuad(P, M.glassRoof, [pt(ha, hl)[0], eave, pt(ha, hl)[1]], [pt(ha, -hl)[0], eave, pt(ha, -hl)[1]], [pt(0, -hl)[0], ridge, pt(0, -hl)[1]], [pt(0, hl)[0], ridge, pt(0, hl)[1]], 2.0, 2.4, [0, 1, 0]);
  const nR = Math.max(1, Math.round(2 * hl / 2.5));
  for (let k = 0; k <= nR; k++) {
    const t = -hl + 2 * hl * k / nR;
    for (const s of [-1, 1]) { const p = pt(s * ha, t), q = pt(0, t); bar(D, M.iron, [p[0], eave + 0.05, p[1]], [q[0], ridge + 0.05, q[1]], 0.05); }
    for (const s of [-1, 1]) { const f = pt(s * ha, t); D.cyl(M.iron, [f[0], pl, f[1]], [f[0], eave, f[1]], 0.055, 0.055, 4, false); }
  }
  bar(D, M.iron, [pt(0, -hl)[0], ridge + 0.05, pt(0, -hl)[1]], [pt(0, hl)[0], ridge + 0.05, pt(0, hl)[1]], 0.08);
  return { pt, a, b, ha, hl };
}
