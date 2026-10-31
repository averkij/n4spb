// landmarksYelaginSpits/wall.js - the terrace wall (w1217811692), its two returns (w1217811694 / w1217811695) and the two corner plinths.
// Photos spit 01, 09-12, 17-18, 22-24, 28; dossier 5.1 + 13.  Local frame of frame.js (x along the wall, z toward the water, y up, street level 0).
//   WALL FACE   an arc of 14 flat segments from corner A to corner B, five courses from the foot (-3.55) to the terrace (+0.30): the two lowest ones stand 5 cm proud (the set-back of the dossier),
//               texture 'wall' (one tile = five courses), a belt of flat stones (0.14 m, 3 cm proud), the blind PARAPET (0.76 m + a slab cap of 0.10 m: 1.0 m above the terrace, 0.55 m thick)
//   RETURNS     straight runs from each corner 6.2 m landward with the same belt / parapet profile (the backs of the benches); their lower body goes down to the foot because the stair flight runs beside it
//   PLINTHS     a square granite cube per corner (1.9 m, 1.55 m above the terrace) with a red-brown cap course (0.2 m) and the white limestone slab (2.08 m, 0.15 m) under the lion; they sit in the
//               corner frame whose x axis is the tangent of the arc at the corner (the returns are perpendicular to it: measured 13.5 deg off the chord normal, the arc tangent is 14.6 deg)
// Returns { corners } the corner frames (frame.js CORNERS) for the other files.
import { HL, FOOT, TERRACE, BELT, PARAPET_H, PARAPET_T, PLINTH, PROUD, faceB, COURSE, CORNERS, PHI } from './frame.js';
export { CORNERS, PHI };

const TU = 6.0, TV = 3.85;          // wall tile: 6 m long, five courses high
export const RET_LEN = 6.2;
const Y_BELT = TERRACE + BELT, Y_PAR = TERRACE + PARAPET_H - 0.10, Y_TOP = TERRACE + PARAPET_H;       // belt top, parapet body top, cap top

/** the face line between a0 and a1 in n segments [[a, b], ...] */
export function arc(a0, a1, n) { const r = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; r.push([a, faceB(a)]); } return r; }
/** the offset point of vertex i of a polyline at offset off: the MITRED normal (the average of the two segment normals, scaled so that both segments keep the distance off), so that the strips of two
 *  neighbouring segments share their end points exactly (offsetting every segment along its own normal leaves a hairline crack at each joint that shows as a dashed line) */
const mit = (line, i, off) => {
  const sg = (k) => { const [a0, b0] = line[k], [a1, b1] = line[k + 1], l = Math.hypot(a1 - a0, b1 - b0) || 1; return [-(b1 - b0) / l, (a1 - a0) / l]; };
  const n0 = sg(Math.max(0, i - 1)), n1 = sg(Math.min(line.length - 2, i)); let mx = n0[0] + n1[0], mz = n0[1] + n1[1]; const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
  const k = 1 / Math.max(0.5, mx * n1[0] + mz * n1[1]);
  return [line[i][0] + mx * off * k, line[i][1] + mz * off * k];
};
const seg = (line, i) => { const [a0, b0] = line[i], [a1, b1] = line[i + 1], l = Math.hypot(a1 - a0, b1 - b0); return { a0, b0, a1, b1, l, nx: -(b1 - b0) / l, nz: (a1 - a0) / l }; };

/** a vertical strip along the polyline at offset `off` (+ out of the wall), bottom y0, top y1; uv: u = running metres / tu, v = (y - yv) / tv */
export function strip(P, mat, line, off, y0, y1, tu, tv, yv, u0 = 0) {
  let run = u0;
  for (let i = 0; i + 1 < line.length; i++) {
    const s = seg(line, i), [x0, z0] = mit(line, i, off), [x1, z1] = mit(line, i + 1, off);
    P.quad(mat, [x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [s.nx, 0, s.nz], [[run / tu, (y0 - yv) / tv], [(run + s.l) / tu, (y0 - yv) / tv], [(run + s.l) / tu, (y1 - yv) / tv], [run / tu, (y1 - yv) / tv]]);
    run += s.l;
  }
}
/** a horizontal strip between two offsets (o0 > o1 = outer to inner), facing up (up = true) or down */
export function flat(P, mat, line, o0, o1, y, up, tu, u0 = 0) {
  let run = u0;
  for (let i = 0; i + 1 < line.length; i++) {
    const s = seg(line, i), q = (o) => { const [xa, za] = mit(line, i, o), [xb, zb] = mit(line, i + 1, o); return [[xa, y, za], [xb, y, zb]]; };
    const [p0, p1] = q(o0), [p3, p2] = q(o1);
    P.quad(mat, p0, p1, p2, p3, [0, up ? 1 : -1, 0], [[run / tu, o0 / tu], [(run + s.l) / tu, o0 / tu], [(run + s.l) / tu, o1 / tu], [run / tu, o1 / tu]]);
    run += s.l;
  }
}

/** the inner (terrace side) face of a run: the same strip on the reversed line looks the other way */
const stripIn = (P, mat, line, off, y0, y1, tu, tv, yv) => strip(P, mat, line.slice().reverse(), off, y0, y1, tu, tv, yv);

export function wall(P, M, T = PARAPET_T) {
  const PR = PROUD;
  // ---- the wall body: five courses, the lowest two proud by 5 cm
  const face = arc(-HL, HL, 14), yC2 = FOOT + 2 * COURSE;
  strip(P, M.wall, face, PR + 0.05, FOOT, yC2, TU, TV, FOOT);
  flat(P, M.wall, face, PR + 0.05, PR, yC2, true, TU);                                          // the 5 cm ledge of the set-back
  strip(P, M.wall, face, PR, yC2, TERRACE, TU, TV, FOOT);
  // ---- the belt of flat stones, the parapet and its cap run between the plinths (|a| < 13.6: the ends are hidden inside the plinth cubes)
  const run = arc(-13.6, 13.6, 12);
  strip(P, M.granite, run, PR + 0.03, TERRACE, Y_BELT, 3, 3, 0);
  flat(P, M.granite, run, PR + 0.03, PR, Y_BELT, true, 3);                                      // the 3 cm ledge on the belt
  stripIn(P, M.granite, run, T - PR + 0.03, TERRACE, Y_BELT, 3, 3, 0);                          // belt, terrace side
  flat(P, M.granite, run, PR, PR - T, Y_BELT, true, 3);                                         // belt top (between parapet and the ledge)
  strip(P, M.granite, run, PR, Y_BELT, Y_PAR, 3, 3, 0.3);                                       // parapet outer face
  stripIn(P, M.granite, run, T - PR, Y_BELT, Y_PAR, 3, 3, 0.3);                                 // parapet terrace face
  strip(P, M.granite, run, PR + 0.05, Y_PAR, Y_TOP, 3, 3, 0.9);                                 // the slab cap overhangs 5 cm on both sides
  stripIn(P, M.granite, run, T - PR + 0.05, Y_PAR, Y_TOP, 3, 3, 0.9);
  flat(P, M.granite, run, PR + 0.05, PR - T - 0.05, Y_TOP, true, 3);
  flat(P, M.granite, run, PR + 0.05, PR - T - 0.05, Y_PAR, false, 3);

  // ---- the corners: plinth cube + return, in the corner frame (x' = tangent of the arc at the corner, pointing along +a for A and -a for B so that the plinth always lies on the terrace side)
  for (const c of CORNERS) {
    P.push(c.a, 0, c.b, c.psi);
    const xa = c.sx > 0 ? 0 : -PLINTH.w, xb = c.sx > 0 ? PLINTH.w : 0, outer = c.sx > 0 ? 'l' : 'r', inner = c.sx > 0 ? 'r' : 'l';
    const t0 = c.sx > 0 ? 0 : -PARAPET_T, t1 = c.sx > 0 ? PARAPET_T : 0;                 // the return's thickness range
    const zr = -RET_LEN, zf = PR, zp = -PLINTH.w;
    // lower mass of the corner and the lower body of the return (down to the foot: the flight runs along it)
    P.boxT(M.wall, xa, xb, FOOT, yC2, zp, zf + 0.05, 'k' + inner + 'tb', TU, TV, FOOT);
    P.boxT(M.wall, xa, xb, yC2, TERRACE, zp, zf, 'k' + inner + 'tb', TU, TV, FOOT);
    P.boxT(M.wall, t0, t1, FOOT, TERRACE, zr, zp, inner + 'tbf', TU, TV, FOOT);
    // the plinth cube, cap course and the white slab
    const h0 = TERRACE, h1 = TERRACE + PLINTH.h - PLINTH.capH;
    P.boxT(M.granite, xa, xb, h0, h1, zp, zf, 'b', 3, 3, 0);
    P.box(M.cap, xa - 0.04, xb + 0.04, h1, h1 + PLINTH.capH, zp - 0.04, zf + 0.04, '', 2);
    const sw = PLINTH.slabW, xc = (xa + xb) / 2, zc = (zp + zf) / 2;
    P.box(M.lime, xc - sw / 2, xc + sw / 2, h1 + PLINTH.capH, h1 + PLINTH.capH + PLINTH.slabH, zc - sw / 2, zc + sw / 2, '', 2);
    // the return: belt, parapet and cap (inner and outer faces, the end face and the top)
    P.boxT(M.granite, t0 - 0.03, t1 + 0.03, TERRACE, Y_BELT, zr, zp, 'b', 3, 3, 0);
    P.boxT(M.granite, t0, t1, Y_BELT, Y_PAR, zr, zp, 'b', 3, 3, 0.3);
    P.boxT(M.granite, t0 - 0.05, t1 + 0.05, Y_PAR, Y_TOP, zr - 0.05, zp, 'b', 3, 3, 0.9);
    P.pop();
  }
}
