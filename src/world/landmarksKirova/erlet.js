// landmarksKirova/erlet.js - letters as real geometry: the red ROOF SIGN "ERARTA" (13 x 2.5 m on a steel lattice standing on the attic) built from the stroke font of erart.js (GLYPHS shared with the
// canvas painting of the portal sign), plus the slab primitive (a bar between two points of the facade plane with a depth).  Plain wordmark, no logo beyond the name (AGENT-BRIEF user rules).
// Frame: the current Parts frame, letters stand in the plane z = z with their face toward +z, baseline y0, height h.
import { GLYPHS, wordLayout } from './erart.js';

/** a bar from p0 to p1 ([x, y]) of half width t in the xy plane, from z0 to z1 (front face z1), ends extended by t: 6 faces */
export function slab(P, mat, p0, p1, t, z0, z1) {
  let dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  const nx = -dy * t, ny = dx * t, ex = dx * t, ey = dy * t;
  const a = [p0[0] - ex + nx, p0[1] - ey + ny], b = [p0[0] - ex - nx, p0[1] - ey - ny], c = [p1[0] + ex - nx, p1[1] + ey - ny], d = [p1[0] + ex + nx, p1[1] + ey + ny];
  const V = (p, z) => [p[0], p[1], z];
  P.quad(mat, V(a, z1), V(b, z1), V(c, z1), V(d, z1), [0, 0, 1]);
  P.quad(mat, V(a, z0), V(b, z0), V(c, z0), V(d, z0), [0, 0, -1]);
  const side = (p, q) => { const sx = q[0] - p[0], sy = q[1] - p[1]; P.quad(mat, V(p, z0), V(q, z0), V(q, z1), V(p, z1), [sy, -sx, 0]); };
  side(a, b); side(b, c); side(c, d); side(d, a);
}

/** the word ERARTA centred on cx, baseline y0, letter height h, stroke half width t, depth z0..z1; returns the total width */
export function wordSlabs(P, mat, cx, y0, h, t, z0, z1) {
  const lay = wordLayout(), W = lay.width * h, xs = cx - W / 2;
  for (const { ch, x0 } of lay.items) for (const pl of GLYPHS[ch].p) for (let i = 0; i + 1 < pl.length; i++) {
    const A = [xs + (x0 + pl[i][0]) * h, y0 + pl[i][1] * h], B = [xs + (x0 + pl[i + 1][0]) * h, y0 + pl[i + 1][1] * h];
    if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 1e-4) continue;
    slab(P, mat, A, B, t, z0, z1);
  }
  return W;
}

/** the red roof sign with its steel frame: letters 2.5 m high, lattice of posts and diagonals 0.4 m behind them */
export function roofSign(P, M, cx, y0, z, o = {}) {
  const h = o.h ?? 2.4, t = o.t ?? 0.1, W = wordSlabs(P, M.eLetters, cx, y0 + 0.25, h, t, z - 0.1, z + 0.1);      // the letters stand 0.25 m above the base rail so that the foot bar of the E is not lost against it; 13.3 x 2.4 m
  const x0 = cx - W / 2 - 0.4, x1 = cx + W / 2 + 0.4, yb = y0, yt = y0 + h + 0.5, zf = z - 0.45;                  // the lattice is as tall as the letters (2.6 m of grid + the legs)
  // base rail, top rail, vertical posts every ~1.6 m, diagonal braces
  slab(P, M.eLetterFrame, [x0, yb + 0.12], [x1, yb + 0.12], 0.06, zf - 0.05, zf + 0.05);
  slab(P, M.eLetterFrame, [x0, yt], [x1, yt], 0.045, zf - 0.04, zf + 0.04);
  const n = Math.max(4, Math.round((x1 - x0) / 1.6));
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    slab(P, M.eLetterFrame, [x, yb], [x, yt], 0.04, zf - 0.04, zf + 0.04);
    // (no diagonal braces: they ran behind the letters and made the word read as FRARTA from the street, review 2026-10-10; a02 shows only the rails and thin posts)
  }
  // struts back to the roof deck: the letters stand on legs
  for (const x of [x0 + 0.3, cx, x1 - 0.3]) P.box(M.eLetterFrame, x - 0.05, x + 0.05, yb - 0.5, yb + 0.2, zf - 0.6, zf + 0.05, '', 1);
  return { w: W, top: yt };
}
