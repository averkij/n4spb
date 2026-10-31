// landmarksTransfiguration/bunker.js - the TRIBUTS BUNKER («Бункер Трибуца», the flagship command post of the Baltic Fleet 1942-43, built in besieged Leningrad of ship armour; OSM w412493366, `abandoned`):
// a 2 m wide access trench between two walls of slanted dark riveted armour plates (2 m, leaning 8 deg outwards) carried by green steel posts, closed at the far end by a wall of red riveted plates with the grey
// double steel door under a dark steel canopy, the whole thing buried in a mound of earth and leaf litter (photos refs/transfiguration 10 11 12 13 14: the posts, the red plate frame, the grey door).
// The painted ensign and star of the door in the photos are NOT drawn (user rule: no flags).  The red information board «ПАМЯТНИК ИСТОРИИ 1942-1945 / «БУНКЕР ТРИБУЦА»» (text of photo 10, no telephones) stands beside
// the open end.  The trench is walkable up to the shut door; the mound is solid.  Placement: the OSM outline lies along the service road w412530071, so the first leg is shifted 2.9 m to its left (frame.js BUNKER).
// Collectors: K.P = the shell (plates, mound, door wall; LOD 1100 m), K.N = the detail (posts, door, canopy, board; LOD 350 m).
import { makeFrame, BUNKER as B } from './frame.js';
import { ATLAS } from './art.js';
import * as THREE from 'three';
import * as L from '../layout.js';

const POST = new THREE.BoxGeometry(0.2, 2.35, 0.1);

export function build(K) {
  const { ctx, M, P, N, svc } = K, ph = ctx.physics;
  const dx0 = B.E[0] - B.S0[0], dz0 = B.E[1] - B.S0[1], len = Math.hypot(dx0, dz0);
  const F = makeFrame(B.S0[0], B.S0[1], dx0, dz0);                          // local +z along the trench towards the open end, +x = the left (north-west) side
  for (const C of [P, N]) C.push(F.ox, 0, F.oz, F.rot);
  const H = B.wallH, d0 = B.half, d1 = d0 + B.lean, tapEnd = len + B.taper;

  // ---------------------------------------------------------------- the two walls and the mound: a ribbon along z with a profile (offset d, height y); over the last 2.5 m everything sinks into the ground
  const prof = (side) => [[d0, 0, M.armour], [d1, H, M.armour], [d1 + 0.22, H, M.iron], [side > 0 ? 2.3 : 1.9, H + 0.15, M.soil], [side > 0 ? B.bermL : B.bermR, 0, M.soil]];
  const plateSts = [[0, 1, 1], [len, 1, 1]];                                // [z, scale, crest jitter]
  const bodySts = [[0, 1, 1], [len * 0.3, 1, 1.12], [len * 0.62, 1, 0.9], [len, 1, 1]];   // the crest of the mound is lumpy along the trench
  const at = (side, k, st) => { const [d, y] = prof(side)[k]; const j = k >= 3 ? st[2] : 1; return [side * (d0 + (d - d0) * (k === 4 ? j : 1)), y * (k === 3 ? j : 1), st[0]]; };
  const uvOf = (mat, p) => (mat === M.soil ? [p[2] / 3, Math.abs(p[0]) / 3] : [p[2] / 2.4, p[1] / 2.4]);
  for (const side of [1, -1]) {
    const pr = prof(side);
    for (let k = 0; k + 1 < pr.length; k++) {
      const mat = pr[k][2], dd = pr[k + 1][0] - pr[k][0], dy = pr[k + 1][1] - pr[k][1], n = [side * -dy, dd, 0];     // the same formula is "toward the trench" for the leaning plate and "up" for the mound
      const sts = mat === M.soil || k === 2 ? bodySts : plateSts;                   // the plates end square at the open end
      for (let i = 0; i + 1 < sts.length; i++) {
        const a = at(side, k, sts[i]), b = at(side, k + 1, sts[i]), c = at(side, k + 1, sts[i + 1]), d = at(side, k, sts[i + 1]);
        P.quad(mat, a, b, c, d, n, [uvOf(mat, a), uvOf(mat, b), uvOf(mat, c), uvOf(mat, d)]);
      }
    }
    // beyond the open end the earth bank slopes down to the ground over B.taper m (the cut face of the trench: the whole profile sinks, its plan width stays)
    const wedge = [[len, 1], [len + B.taper * 0.35, 0.62], [len + B.taper * 0.7, 0.27], [tapEnd, 0]];
    const wp = (k, w) => [side * pr[k][0], pr[k][1] * w[1], w[0]];
    for (let k = 0; k < 4; k++) for (let i = 0; i + 1 < wedge.length; i++) {
      const a = wp(k, wedge[i]), b = wp(k + 1, wedge[i]), c = wp(k + 1, wedge[i + 1]), d = wp(k, wedge[i + 1]);
      P.quad(M.soil, a, b, c, d, k === 0 ? [-side, 0.4, 0] : [0, 1, 0], [uvOf(M.soil, a), uvOf(M.soil, b), uvOf(M.soil, c), uvOf(M.soil, d)]);
    }
  }

  P.quad(M.soil, [-d0, 0.04, 0], [d0, 0.04, 0], [d0, 0.04, len + 1.5], [-d0, 0.04, len + 1.5], [0, 1, 0], [[-d0 / 3, 0], [d0 / 3, 0], [d0 / 3, (len + 1.5) / 3], [-d0 / 3, (len + 1.5) / 3]]);   // the trodden earth floor of the trench

  // ---------------------------------------------------------------- the closed end: the red riveted wall, the mound behind it, the steel door under the canopy
  P.quad(M.armourRed, [-d0, 0, 0], [d0, 0, 0], [d1, H, 0], [-d1, H, 0], [0, 0, 1], [[0, 0], [2 * d0 / 1.2, 0], [2 * d1 / 1.2, H / 1.2], [0, H / 1.2]]);
  const ring = [[B.bermL, 0, 0], [2.3, H + 0.15, 0], [d1 + 0.22, H, 0], [-(d1 + 0.22), H, 0], [-1.9, H + 0.15, 0], [-B.bermR, 0, 0]], apex = [0, 0.4, -3.6];
  for (let i = 0; i + 1 < ring.length; i++) P.fan(M.soil, [apex, ring[i], ring[i + 1]], [0, 0.7, -0.5], (p) => [p[0] / 3, p[2] / 3]);
  P.fan(M.soil, [apex, ring[ring.length - 1], ring[0]], [0, -1, 0], (p) => [p[0] / 3, p[2] / 3]);              // the underside is never seen: keeps the mound closed
  N.box(M.door, -0.75, -0.01, 0.0, 1.95, 0, 0.07, 'k');                                                       // the two grey leaves
  N.box(M.door, 0.01, 0.75, 0.0, 1.95, 0, 0.07, 'k');
  N.box(M.iron, -0.01, 0.01, 0.0, 1.95, 0, 0.075, 'k');                                                       // the seam
  N.box(M.iron, -0.12, -0.06, 0.95, 1.02, 0.07, 0.12, ''); N.box(M.iron, 0.06, 0.12, 0.95, 1.02, 0.07, 0.12, '');   // handles
  N.box(M.iron, -d1 - 0.1, d1 + 0.1, H - 0.1, H + 0.04, 0, 0.6, 'k');                                         // the dark steel canopy over the door
  for (const s of [-1, 1]) N.box(M.iron, s * 0.78 - 0.04, s * 0.78 + 0.04, 0, 1.98, 0, 0.09, 'k');            // the door frame posts

  // ---------------------------------------------------------------- the green steel posts leaning with the plates (every 1.6 m, in front of the plates)
  const lean = Math.atan2(B.lean, H);
  for (const side of [1, -1]) for (let z = 1.0; z < len - 0.5; z += 1.6) N.geo(M.post, POST, side * (d0 + B.lean * 1.12 / H - 0.07), 1.12, z, 0, 0, -side * lean);

  // ---------------------------------------------------------------- the red board «Бункер Трибуца» on two posts beside the mound, facing the left (north-west: the park path from the information stands)
  const tryB = [[6.6, 7], [6.6, 3.5], [7.2, 10], [6.6, 0]];
  for (const [mx, mz] of tryB) {
    const w = F.W(mx, mz);
    if (L.isOnRoad(w.x, w.z, 0.8) || L.insideBuilding(w.x, w.z, 1.0)) continue;
    const [u0, v0, u1, v1] = ATLAS.board;
    N.push(mx, 0, mz, Math.PI / 2);                                                                          // the board looks along the local +x of the trench frame
    N.box(M.armourRed, -0.5, -0.42, 0, 2.3, -0.1, 0.0, '');                                                 // two posts behind the board
    N.box(M.armourRed, 0.42, 0.5, 0, 2.3, -0.1, 0.0, '');
    N.box(M.armourRed, -0.52, 0.52, 1.0, 2.3, 0, 0.05, '');                                                 // the board (back and edges)
    N.quad(M.win, [-0.52, 1.0, 0.056], [0.52, 1.0, 0.056], [0.52, 2.3, 0.056], [-0.52, 2.3, 0.056], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    N.pop();
    svc.board = { x: w.x, z: w.z };
    ph.addBox(w.x, w.z, 1.1, 0.4, F.rot + Math.PI / 2, 0, 2.4);
    break;
  }
  for (const C of [P, N]) C.pop();

  // ---------------------------------------------------------------- colliders: the two walls with their mounds (solid), the mound over the door end; the trench between stays open up to the door
  F.box(ph, (d0 + B.bermL) / 2 + 0.05, len / 2 - 0.1, B.bermL - d0 + 0.1, len + 0.2, 0, 0, H + 0.3);
  F.box(ph, -(d0 + B.bermR) / 2 - 0.05, len / 2 - 0.1, B.bermR - d0 + 0.1, len + 0.2, 0, 0, H + 0.3);
  F.box(ph, (B.bermL - B.bermR) / 2, -1.7, B.bermL + B.bermR, 3.4, 0, 0, H + 0.3);
  F.box(ph, (d0 + B.bermL) / 2, len + 1.1, B.bermL - d0, 2.2, 0, 0, H);                         // the first part of the sinking mound beyond the trench end
  F.box(ph, -(d0 + B.bermR) / 2, len + 1.1, B.bermR - d0, 2.2, 0, 0, H);
  F.box(ph, 0, 0.12, 2 * d0, 0.3, 0, 0, H + 0.3);                                                              // the door itself
  svc.bunker = { x: F.W(0, 6).x, z: F.W(0, 6).z, door: F.W(0, 0.6), open: F.W(0, len) };
}
