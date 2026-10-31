// landmarksKamennyDachasEast/pier.js - the SPHINX PIER of the Oldenburg dacha (OSM r10254206 "Пристань со сфинксами", a 10.7 x 9.4 m ring at the bank of the Malaya Nevka below the Kamennoostrovsky Bridge; photos S01 S02 S03 S04):
// a wide granite stair running from the embankment lawn (y 0) down to a landing just above the water (y -3.1; the water of the scene lies at -3.4, the trench is deeper than the 12 real steps), 15 risers of 0.207 m,
// low granite cheek walls on both sides that run down to the two granite pedestals at the water end, and a bronze-green sphinx lying on each pedestal and looking out over the river.  The stair is public and walkable.
// Frame PR (frame.js): +z = into the river, local +x = ENE along the bank.  The bank slope of the environment is cut by the solid blocks (water owner request: trim the grass slope inside the ring, see the requests file).
import { PR, PP } from './frame.js';
import { sphinxFig } from './sphinx.js';

const { hw, pedOut, stairHW, cheekW, pedL, pedH, pedZ, nSteps } = PP;
const RISE = -PP.low / nSteps, TREAD = 0.58, RUN = 14 * TREAD, BOT = -3.5;
export const stepTop = (k) => -k * RISE;                                      // top of tread k (1 .. 15)
export const cheekTop = (z) => 0.55 + (-1.95 - 0.55) * z / (pedZ - pedL / 2);   // the cheek top line: 0.55 at the lawn, flush with the pedestal tops at the pedestals

export async function build(K) {
  const { M, P } = K;
  P.push(PR.ox, 0, PR.oz, PR.rot);
  try {
    const G = 1.8;
    // ---- the flight: 14 treads of 0.58 m and the landing (1.28 m deep)
    for (let k = 1; k <= 14; k++) P.box(M.granite, -stairHW, stairHW, BOT, stepTop(k), (k - 1) * TREAD, k * TREAD, 'kblr', G);
    P.box(M.granite, -stairHW, stairHW, BOT, PP.low, RUN, PP.run, 'kblrf', G);
    P.box(M.granite, -hw, hw, BOT, PP.low, RUN, PP.run, 'kbt', G);                                       // the landing strip: sides + front over the full width
    // ---- the cheek walls (a sloping wall 0.7 m thick whose top runs down to the pedestal) and the pedestals at the water end
    const z0 = 0, z1 = pedZ - pedL / 2, y0 = cheekTop(z0), y1 = cheekTop(z1);
    for (const s of [-1, 1]) {
      const xi = s * stairHW, xo = s * (stairHW + cheekW), side = (x, n) => P.quad(M.granite, [x, BOT, z0], [x, BOT, z1], [x, y1, z1], [x, y0, z0], [n, 0, 0], [[0, 0], [z1 / G, 0], [z1 / G, (y1 + 3.5) / G], [0, (y0 + 3.5) / G]]);
      side(xi, -s); side(xo, s);
      P.quad(M.granite, [xi, y0, z0], [xi, y1, z1], [xo, y1, z1], [xo, y0, z0], [0, 1, 0.2], [[0, 0], [z1 / G, 0], [z1 / G, 0.4], [0, 0.4]]);
      P.quad(M.granite, [xi, BOT, z0], [xo, BOT, z0], [xo, y0, z0], [xi, y0, z0], [0, 0, -1], [[0, 0], [0.4, 0], [0.4, 1], [0, 1]]);
      // the pedestal: a base course, the shaft and a cap slab (a little proud), 1.85 x 2.7 m, 1.15 m above the landing
      const px0 = s < 0 ? -pedOut : stairHW, px1 = s < 0 ? -stairHW : pedOut, bx0 = s < 0 ? -hw : stairHW, bx1 = s < 0 ? -stairHW : hw, pz0 = pedZ - pedL / 2, pz1 = pedZ + pedL / 2, yb = PP.low, yt = yb + pedH;
      P.box(M.granite, bx0, bx1, BOT, yb + 0.22, pz0, RUN, 'bf', G);                                   // the base course, wider than the shaft: it runs out to the bank on both sides
      P.box(M.granite, bx0, bx1, yb, yb + 0.22, RUN, PP.run, 'bk', G);
      P.box(M.granite, s < 0 ? -hw : pedOut, s < 0 ? -pedOut : hw, BOT, 0.04, pz0, PP.run, 'bl' + (s < 0 ? 'k' : 'k') + (s < 0 ? 'r' : ''), G);   // the return wall of the pit edge: closes the 0.5 m margin where the bank is open (it ends flush with the lawn)
      P.box(M.granite, px0, px1, yb + 0.22, yt - 0.18, pz0 + 0.08, pz1 - 0.08, 'b', G);
      P.box(M.granite, px0, px1, yt - 0.18, yt, pz0, pz1, 'b', G);
    }
    P.box(M.granite, -(stairHW + cheekW), stairHW + cheekW, BOT, 0.03, -0.5, 0.02, 'kb', G);                  // the head of the flight: a 0.5 m coping slab over the margin of the pit
    // the front edge of the pier (the quay face above the water)
    P.quad(M.granite, [-hw, BOT, PP.run], [hw, BOT, PP.run], [hw, PP.low, PP.run], [-hw, PP.low, PP.run], [0, 0, 1], [[0, 0], [hw * 2 / G, 0], [hw * 2 / G, 0.4 / G], [0, 0.4 / G]]);
    // ---- the sphinxes
    const mk = { main: M.sphinx, dark: M.sphinxDark, accent: M.crown };
    const sp = sphinxFig(0.6), yS = PP.low + pedH;
    for (const s of [-1, 1]) sp.place(P, mk, s * (stairHW + (pedOut - stairHW) / 2), yS, pedZ - 0.1, 0, 0.4);
  } finally { P.pop(); }
}
