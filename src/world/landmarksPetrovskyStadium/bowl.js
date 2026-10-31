// landmarksPetrovskyStadium/bowl.js - the colonnaded bowl of the Petrovsky stadium, built bay by bay from the stations of frame.js (docs/research/petrovsky-zhdanovka-2026.md section 10, photos s01 s02 s12):
//   outside in: ONE storey of slender cream columns (instanced, columns.js) -> the cream entablature (architrave, cornice) over a MAROON soffit -> the gallery floor (the apron paving) -> the yellow back
//   wall with windows, ticket hatches and red-doored entrances -> the flat gallery roof and the cream rim wall (y 10.5) -> the two-tone blue stands (lower tier, gangway, upper tier, vomitory mouths)
//   -> the barrier wall at the red track.  The stands are closed: a solid collider on the column line, the gallery is not walkable (the roof map treats the footprint as a building).
import { bowl, GAL, Y, COL_S } from './frame.js';

/** the quads of one bay k (stations k and k + 1) */
export function bowlShell(P, M) {
  const B = bowl(), N = B.N, at = B.at;
  const out = (k) => { const a = B.st[k % N], b = B.st[(k + 1) % N]; let x = -(a.nx + b.nx), z = -(a.nz + b.nz); const l = Math.hypot(x, z) || 1; return [x / l, 0, z / l]; };     // outward normal of the bay
  for (let k = 0; k < N; k++) {
    const j = (k + 1) % N, no = out(k), ni = [-no[0], 0, -no[2]], q = (m, a, b, c, d, n, uv) => P.quad(m, a, b, c, d, n, uv);
    const A = (s, y) => at(k, s, y), Bp = (s, y) => at(j, s, y);
    // ---- entablature: architrave (y 8.0 .. 8.6, s -0.35), cornice (8.6 .. 9.2, s -0.55) with its soffit, the cream underside up to s 0.9, then the MAROON soffit to the back wall
    q(M.cream, A(-0.35, Y.cap), Bp(-0.35, Y.cap), Bp(-0.35, 8.6), A(-0.35, 8.6), no);
    q(M.creamShade, A(-0.55, 8.6), Bp(-0.55, 8.6), Bp(-0.35, 8.6), A(-0.35, 8.6), [0, -1, 0]);
    q(M.cream, A(-0.55, 8.6), Bp(-0.55, 8.6), Bp(-0.55, Y.corn), A(-0.55, Y.corn), no);
    q(M.creamShade, A(-0.35, Y.cap), Bp(-0.35, Y.cap), Bp(0.9, Y.cap), A(0.9, Y.cap), [0, -1, 0]);
    q(M.soffit, A(0.9, Y.cap), Bp(0.9, Y.cap), Bp(GAL, Y.cap), A(GAL, Y.cap), [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // ---- the flat gallery roof, the rim wall above it (outer face, top, inner face)
    q(M.roof, A(-0.55, Y.corn), Bp(-0.55, Y.corn), Bp(GAL, Y.corn), A(GAL, Y.corn), [0, 1, 0], [[A(0, 0)[0] / 4, A(0, 0)[2] / 4], [Bp(0, 0)[0] / 4, Bp(0, 0)[2] / 4], [Bp(GAL, 0)[0] / 4, Bp(GAL, 0)[2] / 4], [A(GAL, 0)[0] / 4, A(GAL, 0)[2] / 4]]);
    q(M.cream, A(GAL, Y.corn), Bp(GAL, Y.corn), Bp(GAL, Y.rim), A(GAL, Y.rim), no);
    q(M.creamShade, A(GAL, Y.rim), Bp(GAL, Y.rim), Bp(GAL + 0.5, Y.rim), A(GAL + 0.5, Y.rim), [0, 1, 0]);
    q(M.cream, A(GAL + 0.5, Y.seatTop), Bp(GAL + 0.5, Y.seatTop), Bp(GAL + 0.5, Y.rim), A(GAL + 0.5, Y.rim), ni);
    // ---- the back wall of the gallery: one tile of the atlas per bay (every 8th bay an entrance, a ticket-hatch bay before it)
    const tile = k % 8 === 3 ? 2 : k % 8 === 2 ? 1 : k % 4 === 0 ? 3 : 0, ua = tile / 4 + 0.001, ub2 = (tile + 1) / 4 - 0.001, u0 = B.dirSign > 0 ? ua : ub2, u1 = B.dirSign > 0 ? ub2 : ua;
    q(M.wall, A(GAL, Y.floor), Bp(GAL, Y.floor), Bp(GAL, Y.cap), A(GAL, Y.cap), no, [[u0, Y.floor / Y.cap], [u1, Y.floor / Y.cap], [u1, 1], [u0, 1]]);
    if (tile === 2) {                                                                                                                         // the entrance: a flat concrete canopy over the door board, cantilevered from the wall (dark underside, 2 cm drip edge)
      const m = [(A(GAL, 0)[0] + Bp(GAL, 0)[0]) / 2, (A(GAL, 0)[2] + Bp(GAL, 0)[2]) / 2];
      P.push(m[0], 0, m[1], Math.atan2(no[0], no[2]));
      P.box(M.concrete, -2.5, 2.5, 5.15, 5.4, 0, 1.5, '');
      P.pop();
    }
    // ---- the stands
    const a = B.st[k], b = B.st[j], tier = (st) => {
      const D = st.D, lip = D - 0.4, rn = lip - (GAL + 0.5), sg1 = lip - 0.46 * rn, sg2 = sg1 - 2.0; return { D, lip, sg1, sg2 };
    };
    const ta = tier(a), tb = tier(b);
    q(M.concrete, A(ta.D, Y.track), Bp(tb.D, Y.track), Bp(tb.D, Y.barrier), A(ta.D, Y.barrier), ni);                                         // the barrier wall at the track
    q(M.concrete, A(ta.D, Y.barrier), Bp(tb.D, Y.barrier), Bp(tb.lip, Y.barrier), A(ta.lip, Y.barrier), [0, 1, 0]);
    const sector = Math.floor(k / 6), dl = sector % 2 === 0 ? 0 : 0.5, du = sector % 2 === 0 ? 0.5 : 0;                                        // lower tier / upper tier take opposite tones
    const slope = (s0a, s0b, y0, s1a, s1b, y1, ub) => {
      const len = Math.hypot((s0a + s0b) / 2 - (s1a + s1b) / 2, y1 - y0), v = len / 3.2;
      q(M.seats, A(s0a, y0), Bp(s0b, y0), Bp(s1b, y1), A(s1a, y1), [-no[0] * 0.5, 1, -no[2] * 0.5], [[ub, 0], [ub + 0.498, 0], [ub + 0.498, v], [ub, v]]);
    };
    slope(ta.lip, tb.lip, Y.barrier, ta.sg1, tb.sg1, Y.gang, dl);                                                                              // lower tier
    q(M.concrete, A(ta.sg1, Y.gang), Bp(tb.sg1, Y.gang), Bp(tb.sg2, Y.gang), A(ta.sg2, Y.gang), [0, 1, 0]);                                    // the gangway
    q(M.concrete, A(ta.sg2, Y.gang), Bp(tb.sg2, Y.gang), Bp(tb.sg2, Y.riser), A(ta.sg2, Y.riser), ni);
    slope(ta.sg2, tb.sg2, Y.riser, GAL + 0.5, GAL + 0.5, Y.seatTop, du);                                                                       // upper tier
    if (k % 7 === 2) {                                                                                                                        // a vomitory: the dark mouth of a stair tunnel in the upper tier (s01)
      const U = (w, t) => { const sa = ta.sg2 + (GAL + 0.5 - ta.sg2) * t, sb = tb.sg2 + (GAL + 0.5 - tb.sg2) * t, y = Y.riser + (Y.seatTop - Y.riser) * t, p = A(sa, y), r = Bp(sb, y); return [p[0] + (r[0] - p[0]) * w, y + 0.03, p[2] + (r[2] - p[2]) * w]; };
      q(M.dark, U(0.3, 0.3), U(0.7, 0.3), U(0.7, 0.6), U(0.3, 0.6), [0, 1, 0.3]);
    }
  }
}

/** instanced column: base plinth, 8-sided shaft, necking, echinus, Ionic abacus with two volutes; local +z = outward, origin on the axis at y 0 */
export function columnParts(P, M) {
  const m = M.cream;
  P.box(m, -0.5, 0.5, 0, Y.colBase, -0.5, 0.5, 'b');
  P.cyl(m, [0, Y.colBase, 0], [0, 7.3, 0], 0.31, 0.27, 12, false);
  P.cyl(m, [0, 7.3, 0], [0, 7.42, 0], 0.33, 0.33, 12, false);
  P.cyl(m, [0, 7.42, 0], [0, 7.74, 0], 0.30, 0.50, 12, true);
  P.box(m, -0.62, 0.62, 7.74, Y.cap, -0.55, 0.55, 'b');
  for (const sx of [-1, 1]) P.cyl(m, [sx * 0.50, 7.62, -0.56], [sx * 0.50, 7.62, 0.56], 0.16, 0.16, 8, true);
}

/** the columns' matrices: [x, y, z, rotY] per station */
export function columnSpots() {
  const B = bowl(), out = [];
  for (let k = 0; k < B.N; k++) { const p = B.at(k, COL_S, 0), q = B.st[k]; out.push([p[0], 0, p[2], Math.atan2(-q.nx, -q.nz)]); }
  return out;
}

/** solid collider along the column line (the stadium is closed; the gallery is not walkable) */
export function bowlColliders(ph) {
  const B = bowl(), N = B.N;
  for (let k = 0; k < N; k++) {
    const a = B.at(k, 0.3, 0), b = B.at(k + 1, 0.3, 0), len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    ph.addBox((a[0] + b[0]) / 2, (a[2] + b[2]) / 2, len + 0.5, 1.4, Math.atan2(-(b[2] - a[2]), b[0] - a[0]), 0, 14);
  }
}
