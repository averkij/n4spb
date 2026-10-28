// landmarksKirova/erportal.js - the ENTRANCE of the Erarta museum, frame FE (local x = q' to the right seen from the street, z = r' outward, y up), second version (erarta-detail round 2026-10-10):
//   portal      the white 2010 box, 14 m wide, 2.2 m deep, 6.4 m above the landing: four panelled piers, a 1.9 m beam with the sign band (ERARTA in thin wine-red capitals over the museum line, cut-out painting),
//               three tunnels 2.9 m wide with white soffits, light bars and a sloping pale glass canopy under the beam; the wall inside the tunnels is the yellow rusticated base with a dark granite dado; two small
//               white dome cameras on the piers [erarta-detail 1.4: beam top 6.3 above the landing, canopy underside 4.4]
//   doors       three black door groups (centres q' -4.3 / 0 / 4.3, 2.0 x 4.0 m with an arched transom): the SIDE groups are glass with the big Art Nouveau ring (cut-out painting); the CENTRE group is mostly
//               black: two leaves with three small panes each (sky / the red LED sign of the lobby / a poster) and an arched transom light [erarta-detail 1.4, a04 crop]
//   lobby       the LIT FOYER behind the doors (a warm room 16 x 13 m, floor 1 of the plan: two rows of white square pillars (7 + 8), the long reception counter with the red LED sign, a glazed partition and
//               a white stair at the north side, a painted far wall), seen through the glass
//   stair       granite stair 11 m wide: landing under the portal at +1.35, ELEVEN risers of 0.123 m with treads of 0.40 m (run 4.4 m), the joint of every tread staggered, paler nosings, walk boxes; the
//               cheek walls (flat sawn granite) with a dark plaque 0.5 x 0.25 m, step lights on the inner faces 0.3 m above the treads, a white LED bar along the front edge of each cap
// Dossier 11.3 / 11.4 + erarta-detail 1.4 / 1.5, photos er01 (head-on), er04 (portal front), er06 (wide angle), a04 crops, c01 (stair).
import * as THREE from 'three';
import { ER, FE } from './frame.js';

const PX = { out: [-7.0, 7.0], piers: [[-7.0, -5.75], [-2.85, -1.45], [1.45, 2.85], [5.75, 7.0]], opens: [[-5.75, -2.85, -4.3], [-1.45, 1.45, 0], [2.85, 5.75, 4.3]] };
const Y0 = ER.plinth, YB = Y0 + 4.5, YT = Y0 + ER.portal.h;           // landing, beam bottom (5.85), beam top (7.75)
export const DOOR_TOP = Y0 + 4.0;                                      // door + transom top (above the pavement)

function portalBox(K) {
  const { P, M } = K, z0 = ER.centreR, z1 = z0 + ER.portal.r;
  // piers: front, two reveals, panelled (one tile = one panel: 1.4 m rows)
  for (const [a, b] of PX.piers) {
    P.quad(M.ePanel, [a, Y0, z1], [b, Y0, z1], [b, YB, z1], [a, YB, z1], [0, 0, 1], [[0, 0], [1, 0], [1, 4.5 / 1.5], [0, 4.5 / 1.5]]);
    P.quad(M.ePanel, [a, Y0, z0], [a, Y0, z1], [a, YB, z1], [a, YB, z0], [-1, 0, 0], [[0, 0], [2.2 / 1.2, 0], [2.2 / 1.2, 4.5 / 1.5], [0, 4.5 / 1.5]]);
    P.quad(M.ePanel, [b, Y0, z1], [b, Y0, z0], [b, YB, z0], [b, YB, z1], [1, 0, 0], [[0, 0], [2.2 / 1.2, 0], [2.2 / 1.2, 4.5 / 1.5], [0, 4.5 / 1.5]]);
  }
  // the beam: front, ends, top, soffits of the three tunnels
  P.quad(M.ePanel, [-7, YB, z1], [7, YB, z1], [7, YT, z1], [-7, YT, z1], [0, 0, 1], [[0, 0], [14 / 3.5, 0], [14 / 3.5, (YT - YB) / 1.25], [0, (YT - YB) / 1.25]]);
  P.quad(M.ePanel, [-7, YB, z0], [-7, YB, z1], [-7, YT, z1], [-7, YT, z0], [-1, 0, 0]); P.quad(M.ePanel, [7, YB, z1], [7, YB, z0], [7, YT, z0], [7, YT, z1], [1, 0, 0]);
  P.quad(M.ePanel, [-7, YT, z1], [7, YT, z1], [7, YT, z0], [-7, YT, z0], [0, 1, 0]);
  const glass = M.col('#c3d5da');
  for (const [a, b] of PX.opens) {
    P.quad(M.eSoffit, [a, YB, z1], [b, YB, z1], [b, YB, z0], [a, YB, z0], [0, -1, 0]);
    for (const x of [a + 0.2, b - 0.2]) P.box(M.eLightBar, x - 0.04, x + 0.04, YB - 0.04, YB, z0 + 0.3, z1 - 0.3, 't', 1);       // light bars in the soffit
    // the sloping glass canopy under the beam: pale blue-white glass in a thin white frame, high at the wall, low at the front
    const yl = YB - 0.5, yh = YB - 0.08, zf = z1 - 0.03, zb = z0 + 0.3;
    P.quad(glass, [a + 0.04, yl, zf], [b - 0.04, yl, zf], [b - 0.04, yh, zb], [a + 0.04, yh, zb], [0, 0.45, 1]);
    P.box(M.eWhite, a + 0.04, b - 0.04, yl - 0.03, yl + 0.03, zf - 0.03, zf + 0.03, '', 1);
    for (const x of [a + 0.04, b - 0.07]) P.box(M.eWhite, x, x + 0.03, yl - 0.02, yh + 0.02, zb, zf + 0.02, '', 1);
  }
  // Sign band reserved by erarta.js before geometry; keep it 3 cm off the beam.
  if (K.erartaLabels?.portal !== false) P.quad(M.eSign, [-7.3, YT - 1.87, z1 + 0.03], [7.3, YT - 1.87, z1 + 0.03], [7.3, YT - 0.04, z1 + 0.03], [-7.3, YT - 0.04, z1 + 0.03], [0, 0, 1]);
  // uplights at the foot of the piers: short white cylinders in the landing; two small white dome cameras on the piers
  for (const [a, b] of PX.piers) for (const x of [a + 0.15, b - 0.15]) P.cyl(M.eLampWhite, [x, Y0, z1 + 0.14], [x, Y0 + 0.16, z1 + 0.14], 0.07, 0.07, 8, true);
  for (const x of [-2.15, 6.4]) P.cyl(M.eWhite, [x, YB - 0.42, z1 + 0.01], [x, YB - 0.42, z1 + 0.14], 0.06, 0.06, 8, true);
}

/** a small window quad of the centre door: a pane of a leaf at x0..x1, y0..y1 on the black slab */
function pane(P, M, mat, x0, x1, y0, y1, z) { P.quad(mat, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1]); }

/** the wall inside the tunnels: granite dado, door groups, the lit lobby behind */
function doors(K) {
  const { P, M } = K, zw = ER.centreR;                                    // wall plane z = 0.1 (the openings are cut by erfront.js centreBase)
  for (const [a, b, c] of PX.opens) {
    // dado of dark granite beside the door
    P.box(M.eGranite, a, c - 1.0, Y0, Y0 + 0.82, zw, zw + 0.06, 'k', 2.4); P.box(M.eGranite, c + 1.0, b, Y0, Y0 + 0.82, zw, zw + 0.06, 'k', 2.4);
    P.box(M.eGraniteDark, a, c - 1.0, Y0 + 0.82, Y0 + 0.9, zw, zw + 0.09, 'k', 2); P.box(M.eGraniteDark, c + 1.0, b, Y0 + 0.82, Y0 + 0.9, zw, zw + 0.09, 'k', 2);
    // the door group stands 0.3 m back in the opening: frame, mullion, transom bar, kick plates, handles, glass, ornament
    const zf = zw - 0.3, y1 = DOOR_TOP, yT = Y0 + 3.3, zg = zf - 0.02;
    P.box(M.eDoorFrame, c - 1.0, c - 0.92, Y0, y1, zf - 0.04, zf + 0.12, 'k', 1); P.box(M.eDoorFrame, c + 0.92, c + 1.0, Y0, y1, zf - 0.04, zf + 0.12, 'k', 1);
    P.box(M.eDoorFrame, c - 1.0, c + 1.0, y1 - 0.1, y1, zf - 0.04, zf + 0.12, 'kb', 1);
    P.box(M.eDoorFrame, c - 0.92, c + 0.92, yT, yT + 0.1, zf - 0.03, zf + 0.1, 'k', 1);                  // the transom bar over the leaves
    P.box(M.eDoorFrame, c - 0.04, c + 0.04, Y0, yT, zf - 0.03, zf + 0.1, 'k', 1);                         // the meeting stile
    P.box(M.eDoorFrame, c - 0.92, c - 0.04, Y0, Y0 + 0.28, zf - 0.03, zf + 0.1, 'k', 1); P.box(M.eDoorFrame, c + 0.04, c + 0.92, Y0, Y0 + 0.28, zf - 0.03, zf + 0.1, 'k', 1);
    for (const hx of [c - 0.2, c + 0.2]) P.box(M.eSteelDoor, hx - 0.018, hx + 0.018, Y0 + 1.0, Y0 + 1.9, zf + 0.13, zf + 0.17, '', 1);          // vertical pull handles
    P.quad(M.eDoorGlass, [c - 0.92, Y0 + 0.28, zg], [c + 0.92, Y0 + 0.28, zg], [c + 0.92, y1 - 0.1, zg], [c - 0.92, y1 - 0.1, zg], [0, 0, 1]);
    if (c === 0) {
      // the centre group is MOSTLY BLACK: a slab on each leaf with three small panes: sky reflection (top), the red LED sign of the lobby (middle), an ERARTA poster (bottom)
      for (const sgn of [-1, 1]) {
        const xa = c + sgn * 0.045, xb = c + sgn * 0.915, x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), zs = zf + 0.1;
        P.box(M.eDoorFrame, x0, x1, Y0 + 0.28, yT, zf + 0.0, zs, '', 1);
        const px0 = x0 + 0.13, px1 = x1 - 0.13, zp = zs + 0.004;
        pane(P, M, M.eGlA, px0, px1, Y0 + 2.45, Y0 + 2.95, zp);                                                                        // top pane: sky and the lamp of the tunnel
        pane(P, M, M.eGlD, px0, px1, Y0 + 1.7, Y0 + 2.2, zp);
        P.quad(M.eLobbyRed, [px0 + 0.07, Y0 + 1.87, zp + 0.003], [px1 - 0.07, Y0 + 1.87, zp + 0.003], [px1 - 0.07, Y0 + 2.03, zp + 0.003], [px0 + 0.07, Y0 + 2.03, zp + 0.003], [0, 0, 1]);      // red LED letters, cut by the stile
        pane(P, M, M.col('#2a3038'), px0, px1, Y0 + 0.95, Y0 + 1.45, zp);                                                              // the poster: dark ground with a white wordmark
        P.quad(M.eLobbyDesk, [px0 + 0.1, Y0 + 1.15, zp + 0.003], [px1 - 0.1, Y0 + 1.15, zp + 0.003], [px1 - 0.1, Y0 + 1.22, zp + 0.003], [px0 + 0.1, Y0 + 1.22, zp + 0.003], [0, 0, 1]);
      }
      // the arched transom light: a lens-shaped pane 1.4 x 0.35 in a black plate
      P.box(M.eDoorFrame, c - 0.92, c + 0.92, yT + 0.1, y1 - 0.1, zf + 0.0, zf + 0.1, '', 1);
      const lens = []; for (let i = 0; i <= 14; i++) { const t = i / 14, x = c - 0.7 + 1.4 * t; lens.push([x, yT + 0.18 + 0.36 * Math.sin(Math.PI * t) * 0.9, zf + 0.104]); }
      for (let i = 0; i + 1 < lens.length; i++) P.quad(M.eGlA, [lens[i][0], yT + 0.16, lens[i][2]], [lens[i + 1][0], yT + 0.16, lens[i][2]], [lens[i + 1][0], lens[i + 1][1], lens[i][2]], [lens[i][0], lens[i][1], lens[i][2]], [0, 0, 1]);
    } else {
      P.quad(M.eDoorOrn, [c - 0.95, Y0 + 0.2, zf + 0.125], [c + 0.95, Y0 + 0.2, zf + 0.125], [c + 0.95, Y0 + 3.9, zf + 0.125], [c - 0.95, Y0 + 3.9, zf + 0.125], [0, 0, 1]);
    }
    P.box(M.eDoorFrame, c - 1.0, c + 1.0, Y0 - 0.02, Y0 + 0.02, zf - 0.3, zf + 0.3, 'b', 1);                     // threshold
  }
}

/** the lit foyer: floor, ceiling, walls, pillars, counter, partition, stair, pendants (all behind the glass: never entered) */
function lobby(K) {
  const { P, M } = K, x0 = -8.0, x1 = 8.0, zf = ER.centreR - 0.05, zb = -13.0, yf = Y0, yc = Y0 + 5.9;
  P.quad(M.eLobbyFloor, [x0, yf, zf], [x1, yf, zf], [x1, yf, zb], [x0, yf, zb], [0, 1, 0], [[x0 / 2, zf / 2], [x1 / 2, zf / 2], [x1 / 2, zb / 2], [x0 / 2, zb / 2]]);
  P.quad(M.eLobbyCeil, [x0, yc, zb], [x1, yc, zb], [x1, yc, zf], [x0, yc, zf], [0, -1, 0]);
  P.quad(M.eLobbyWall, [x0, yf, zb], [x0, yf, zf], [x0, yc, zf], [x0, yc, zb], [1, 0, 0]);
  P.quad(M.eLobbyWall, [x1, yf, zf], [x1, yf, zb], [x1, yc, zb], [x1, yc, zf], [-1, 0, 0]);
  P.quad(M.eLobbyWall, [x1, yf, zb], [x0, yf, zb], [x0, yc, zb], [x1, yc, zb], [0, 0, 1]);
  // the far wall carries a wall painting (the interiors have an author's wall art): a few big coloured fields
  const art = [['#e8b04a', -6.2, -3.4], ['#5d7fa8', -3.0, -0.4], ['#c8553d', 0.2, 2.6], ['#7aa06a', 3.0, 5.6], ['#d9d2c0', 5.9, 7.2]];
  for (const [col, xa, xb] of art) P.quad(M.litCol(col, 0.85), [xa, yf + 0.9, zb + 0.02], [xb, yf + 0.9, zb + 0.02], [xb, yf + 4.6, zb + 0.02], [xa, yf + 4.6, zb + 0.02], [0, 0, 1]);
  // the reception counter (about 12 x 1 m) with a red-outlined top and the red LED sign over it; the information desk at the south side
  P.box(M.eLobbyDesk, -6.0, 6.0, yf, yf + 1.05, -6.6, -5.6, '', 2); P.box(M.eLobbyRed, -6.0, 6.0, yf + 1.05, yf + 1.09, -6.6, -5.6, 'b', 1);
  P.box(M.eLobbyDesk, -7.4, -5.4, yf, yf + 1.0, -3.4, -2.6, '', 2);
  P.quad(M.eLobbyRed, [-1.0, yf + 2.0, -6.05], [1.0, yf + 2.0, -6.05], [1.0, yf + 2.45, -6.05], [-1.0, yf + 2.45, -6.05], [0, 0, 1]);
  // two rows of white square pillars: 7 in the front row, 8 behind the counter (plate 4 of the museum plan: about 7 + 8)
  for (let i = 0; i < 7; i++) P.box(M.eLobbyDesk, -6.6 + i * 2.2 - 0.22, -6.6 + i * 2.2 + 0.22, yf, yc, -4.0 - 0.22, -4.0 + 0.22, 'b', 2);
  for (let i = 0; i < 8; i++) P.box(M.eLobbyDesk, -7.7 + i * 2.2 - 0.22, -7.7 + i * 2.2 + 0.22, yf, yc, -9.0 - 0.22, -9.0 + 0.22, 'b', 2);
  // the glazed partition and the white stair at the north side of the hall (the yellow big hall behind it)
  P.quad(M.litCol('#cfe6f0', 0.9), [3.6, yf, -10.8], [3.6, yf, -12.8], [3.6, yf + 4.2, -12.8], [3.6, yf + 4.2, -10.8], [-1, 0, 0]);
  for (let i = 0; i < 9; i++) P.box(M.eLobbyDesk, 4.4, 7.8, yf, yf + 0.2 * (i + 1), -12.9 + 0.32 * i, -12.9 + 0.32 * (i + 1), '', 2);
  // pendant lamps
  for (const x of [-5.5, -1.8, 1.8, 5.5]) for (const z of [-2.2, -7.5]) P.cyl(M.eLobbyGlow, [x, yc - 0.7, z], [x, yc - 0.3, z], 0.32, 0.32, 8, true);
}

function stair(K) {
  const { P, M, ctx } = K, ph = ctx.physics, S = ER.stair, z0 = ER.centreR + ER.portal.r, w = S.w, xh = w / 2;
  // landing under and in front of the portal: the floor of the tunnels (top 1.35)
  P.box(M.eStair, -xh, xh, 0, Y0, ER.centreR, z0, 'b', 2.4);
  { const p = FE.W(0, (ER.centreR + z0) / 2); ph.addWalkBox(p.x, p.z, w, z0 - ER.centreR, FE.rot, Y0); }
  const joint = M.col('#6b4d46');
  let zEnd = z0;
  for (let j = 1; j <= S.n; j++) {
    const za = z0 + S.tread * (j - 1), zb = z0 + S.tread * j, top = Y0 - S.riser * j; zEnd = zb;
    P.box(M.eStair, -xh, xh, 0, top, za, zb, 'b', 2.4); P.box(M.eNosing, -xh, xh, top - 0.03, top, zb - 0.035, zb + 0.04, 'b', 2);
    // every tread is two blocks with ONE vertical joint; the joint moves from tread to tread (1/3, 2/3, 1/3 ... of the width, c01 crops)
    const xj = -xh + w * ((j % 3) === 0 ? 0.5 : (j % 2) ? 0.34 : 0.66);
    P.box(joint, xj - 0.006, xj + 0.006, top, top + 0.004, za, zb - 0.01, 'b', 1);
    const p = FE.W(0, (za + zb) / 2); ph.addWalkBox(p.x, p.z, w, S.tread, FE.rot, top);
  }
  // cheek walls q' +-5.5 .. +-8.2 along the whole stair: flat sawn granite, a smooth cap, a dark plaque 0.5 x 0.25 m on the front face, a white LED bar along the front edge of the cap and recessed step lights
  // (0.25 x 0.12 m, 0.3 m above the treads) on the inner faces
  for (const sgn of [-1, 1]) {
    const a = sgn < 0 ? -8.2 : xh, b = sgn < 0 ? -xh : 8.2, zf = zEnd + 0.05, qm = (a + b) / 2;
    P.box(M.eGranite, a, b, 0, Y0, ER.centreR, zf, 'b', 2.4);
    P.box(M.eGraniteDark, a - 0.05, b + 0.05, Y0, Y0 + 0.08, ER.centreR, zf + 0.06, 'b', 2);
    P.box(M.eGraniteDark, qm - 0.25, qm + 0.25, 0.62, 0.87, zf, zf + 0.015, 'k', 1);                                // the plaque (dark, flush, no legible text)
    P.box(M.eLightBar, qm - 0.9, qm + 0.9, Y0 - 0.1, Y0 - 0.04, zf, zf + 0.07, 'k', 1);                                // white light bar along the front edge
    for (const jt of [2.2, 6.1, 9.8]) {                                                                                   // step lights on the inner face
      const zl = z0 + S.tread * jt, yl = Y0 - S.riser * jt + 0.3, xi = sgn * xh;
      P.box(M.eLampBlack, Math.min(xi, xi - sgn * 0.035), Math.max(xi, xi - sgn * 0.035), yl - 0.08, yl + 0.08, zl - 0.15, zl + 0.15, '', 1);
      P.box(M.eLightBar, Math.min(xi - sgn * 0.034, xi - sgn * 0.04), Math.max(xi - sgn * 0.034, xi - sgn * 0.04), yl - 0.06, yl + 0.06, zl - 0.125, zl + 0.125, '', 1);
    }
    const p = FE.W(qm, (ER.centreR + zf) / 2); ph.addBox(p.x, p.z, b - a, zf - ER.centreR, FE.rot, 0, Y0 + 0.6);
  }
  // portal piers and the closed door wall are solid
  for (const [a, b] of PX.piers) { const p = FE.W((a + b) / 2, ER.centreR + ER.portal.r / 2); ph.addBox(p.x, p.z, b - a, ER.portal.r, FE.rot, Y0, Y0 + 8); }
  { const p = FE.W(0, ER.centreR + 0.5); ph.addBox(p.x, p.z, 14, 1.0, FE.rot, Y0, Y0 + 8); }
  { const p = FE.W(0, ER.centreR + ER.portal.r / 2); ph.addBox(p.x, p.z, 14, ER.portal.r, FE.rot, YB, YT + 1); }
}

export function build(K) {
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksKirova] erportal/${name}:`, e); throw e; } };
  stage('portal', () => portalBox(K)); stage('doors', () => doors(K)); stage('lobby', () => lobby(K)); stage('stair', () => stair(K));
  void THREE;
}
