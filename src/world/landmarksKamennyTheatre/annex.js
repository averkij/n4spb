// landmarksKamennyTheatre/annex.js - the two low ANNEXES of the theatre (photos T04 T06 T07 T09 T12): on both long walls MID-WALL (4 plain bays from the rear corner, 8 bays = 24.4 m of annex, 2 plain bays to the portico), 3.4 m deep:
// one storey of tall three-sash windows between white pilasters, a white entablature, a flat terrace roof with a white turned-baluster balustrade on three sides, a granite plinth.  The OSM ring marks them as the 3.4 x 23.8 m "lateral projections" of the footprint, which is correct (an earlier reading of the photos put them at the ESE end).  Frame T.
import { T, TP } from './frame.js';
import { holedWall, pilaster, surround } from './facade.js';
import { balustrade } from './orders.js';
import { pane } from './util.js';

export async function build(K) {
  const { M, P, N } = K;
  const { HW, ZE, pitch, annexL, annexD: D, annexWall: WH, annexTop: TOP, balH } = TP;
  const z0 = TP.annexZ0, z1 = z0 + annexL;
  P.push(T.ox, 0, T.oz, T.rot); N.push(T.ox, 0, T.oz, T.rot);
  const both = (x, y, z, r, fn) => { P.push(x, y, z, r); N.push(x, y, z, r); try { fn(); } finally { P.pop(); N.pop(); } };
  for (const s of [-1, 1]) {
    // the terrace deck (dark tar) over the annex, with a thin white fascia round it
    P.box(M.grey, s * HW - (s < 0 ? D + 0.28 : 0), s * HW + (s > 0 ? D + 0.28 : 0), TOP - 0.22, TOP, z0, z1, 'b', 3);
    // ---- the long outer face
    both(s * (HW + D), 0, s > 0 ? z1 : z0, s > 0 ? Math.PI / 2 : -Math.PI / 2, () => {
      const holes = [];
      for (let k = 0; k < TP.annexBays; k++) { const cx = (k + 0.5) * pitch, h = { x0: cx - 0.85, x1: cx + 0.85, y0: 0.85, y1: 3.0, kind: 'annex' }; holes.push(h); }
      holedWall(P, M.annex, 0, annexL, 0, WH, holes, { depth: 0.22, uvs: 3 });
      for (const h of holes) { pane(P, M, h); surround(N, M.white, h, { sw: 0.1, proud: 0.05, sill: 0.1 }); }
      for (let j = 0; j <= TP.annexBays; j++) pilaster(P, M.white, j * pitch, 0.6, WH, { w: 0.46, proud: 0.12, capH: 0.3, base: 0.0, capW: 0.62 });
      P.box(M.granite, 0, annexL, 0, 0.6, 0, 0.1, 'bk', 1.8);
      P.box(M.white, 0, annexL, WH, TOP - 0.22, 0, 0.28, 'bk', 2);                            // the entablature of the annex
      P.box(M.white, -0.02, annexL + 0.02, TOP - 0.22, TOP, 0, 0.34, 'b', 2);                 // the cornice slab
      balustrade(N, M, 0.1, annexL - 0.1, TOP, 0.1, { h: balH, step: pitch, noStart: false, noEnd: false });
    });
    // ---- the ESE end face (toward the rear wall of the body): one window between the corner pilasters
    both(s > 0 ? HW + D : -HW, 0, z0, Math.PI, () => {
      const cx = D / 2, h = { x0: cx - 0.75, x1: cx + 0.75, y0: 0.85, y1: 3.0, kind: 'annex' };
      holedWall(P, M.annex, 0, D, 0, WH, [h], { depth: 0.22, uvs: 3 });
      pane(P, M, h); surround(N, M.white, h, { sw: 0.1, proud: 0.05, sill: 0.1 });
      P.box(M.granite, 0, D, 0, 0.6, 0, 0.1, 'bk', 1.8);
      P.box(M.white, 0, D, WH, TOP - 0.22, 0, 0.28, 'bk', 2);
      P.box(M.white, -0.02, D + 0.02, TOP - 0.22, TOP, 0, 0.34, 'b', 2);
      balustrade(N, M, 0.1, D - 0.1, TOP, 0.1, { h: balH, step: D });
    });
    // ---- the inner end face (toward the portico): a plain wall
    both(s > 0 ? HW : -(HW + D), 0, z1, 0, () => {
      holedWall(P, M.annex, 0, D, 0, WH, [], { depth: 0.22, uvs: 3 });
      P.box(M.granite, 0, D, 0, 0.6, 0, 0.1, 'bk', 1.8);
      P.box(M.white, 0, D, WH, TOP - 0.22, 0, 0.28, 'bk', 2);
      P.box(M.white, -0.02, D + 0.02, TOP - 0.22, TOP, 0, 0.34, 'b', 2);
      balustrade(N, M, 0.1, D - 0.1, TOP, 0.1, { h: balH, step: D });
    });
  }
  P.pop(); N.pop();
}
