// landmarksSmolensky/trinity.js - the TRINITY MEMORIAL CHAPEL (Троицкая часовня на месте Троицкой церкви; S. V. Samusenko 2001; OSM w1180085908 is only a 1.4 x 1.4 m mapping stub: the chapel is drawn round that point).
// Dossier docs/research/smolensky.md section 6 (+ critic log 14b no. 11), photos refs/smolensky 37 38 39 40 c18 c19: a WHITE plastered open pavilion (not brick) 2.6 x 2.6 m on a grey granite plinth with three
// steps on the west side, ONE pointed (ogee-headed) arch on each of the four faces: the EAST face is walled (the dark granite plaque outside, the mosaic of Rublev's Trinity with the Trisagion band and a round
// tile medallion inside), N / S / W arches are open with black wrought-iron grilles standing open against the piers; hip roof of dark-grey lead sheet, dark-brown lead collar, a white drum with two belts, a squat
// dark lead-grey onion with a gilded ball and a white (silver) cross: 7.4 m in all.  Frame TR (frame.js): origin at the pavilion centre, +x east, +z south.  Closed solid pavilion (the interior is 1.7 m).
import * as L from '../layout.js';
import { TR } from './frame.js';
import * as G from './geo.js';
import * as S from './stucco.js';

const BASE = 0.45, HW = 1.3;
/** outline of a face plate: sides vertical to the springing (2.35 above the base), then the ogee to the apex 4.45 above the base */
function plate() {
  const bez = (p0, p1, p2, p3, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; });
  const r = bez([HW, 2.35], [HW, 3.35], [0.32, 3.45], [0, 4.45]), l = bez([0, 4.45], [-0.32, 3.45], [-HW, 3.35], [-HW, 2.35]);
  return [[-HW, 0], [HW, 0], ...r, ...l.slice(1)].map(([x, y]) => [x, y + BASE]);
}

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  P.push(TR.x, 0, TR.z, TR.rot);
  // plinth and the three steps on the west side
  P.box(M.tGranite, -1.5, 1.5, 0, BASE, -1.5, 1.5, 'b', 2);
  for (let i = 0; i < 3; i++) P.box(M.tGranite, -1.5 - 0.5 * (i + 1), -1.5, 0, BASE - 0.15 * (i + 1), -1.3, 1.3, 'b', 2);
  // the four face plates: each plate is extruded from z = -0.5 to 0 of its face frame (extrude(mat, shape, z0, depth)), so its OUTER face lies on the 2.6 x 2.6 m square (HW = 1.3) and the wall is 0.5 m thick:
  // three with the arch opening 1.6 m wide (the first version had 1.7: the N / S plates then cut 5 cm into the W / E openings), the east one closed.  The N / S plates sit 1 cm inside the W / E ones, so no two
  // white faces are coplanar at the corners.
  const outline = plate(), hole = G.archPts(0, BASE, 1.6, 3.2, 10);
  const faces = [[-HW, 0, -Math.PI / 2, true], [0, -(HW - 0.01), Math.PI, true], [0, HW - 0.01, 0, true], [HW, 0, Math.PI / 2, false]];       // W, N, S, E (x, z, rotY, open)
  for (const [x, z, rot, open] of faces) {
    P.push(x, 0, z, rot);
    P.extrude(M.tWhite, G.shapeOf(outline, open ? [hole] : []), -0.5, 0.5, 1, 6);
    if (open) for (const s of [-1, 1]) {                                                                                      // the open grille leaves: hinged at the outer edge of the opening and swung INWARD against the reveals, slightly angled (photos 37 / 38: they stand inside the arch; the first version swung them 0.85 m OUTWARD, so they stuck out of the pavilion like scaffolding)
      const hx = s * 0.78, hz = -0.02, fx = s * 0.64, fz = -0.7;                                                            // hinge and free edge (frame of the face: x right, z out of the wall)
      P.quad(M.grille, [hx, BASE, hz], [fx, BASE, fz], [fx, BASE + 2.3, fz], [hx, BASE + 2.3, hz], null, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (let k = 0; k < 5; k++) S.sph(P, M.goldFlat, fx, BASE + 0.35 + k * 0.42, fz + 0.02, 0.04, 0.04, 0.04, 5);
    }
    P.pop();
  }
  // the interior: floor, ceiling, the mosaic (0.8 x 1.0 m with the Trisagion band), the tile medallion
  P.quad(M.tGranite, [-0.8, BASE + 0.02, -0.8], [0.8, BASE + 0.02, -0.8], [0.8, BASE + 0.02, 0.8], [-0.8, BASE + 0.02, 0.8], [0, 1, 0]);
  P.quad(M.tWhite, [-0.8, 3.7, -0.8], [-0.8, 3.7, 0.8], [0.8, 3.7, 0.8], [0.8, 3.7, -0.8], [0, -1, 0]);
  P.quad(M.trMosaic, [0.76, 1.1, -0.4], [0.76, 1.1, 0.4], [0.76, 2.1, 0.4], [0.76, 2.1, -0.4], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(M.medallion, [0.76, 0.6, -0.22], [0.76, 0.6, 0.22], [0.76, 1.04, 0.22], [0.76, 1.04, -0.22], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.quad(M.trPlaque, [HW + 0.03, 1.0, 0.27], [HW + 0.03, 1.0, -0.27], [HW + 0.03, 1.38, -0.27], [HW + 0.03, 1.38, 0.27], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);   // the dark plaque outside the east wall
  // hip roof between the four gables, collar, drum with two belts, squat lead onion, gilded ball, white cross
  G.frustum(P, M.tRoof, 0, 0, 2.8, 4.95, 4, HW * Math.SQRT2, 0.5 * Math.SQRT2, Math.PI / 4, 2, 2, {});
  G.tube(P, M.tCollar, 0, 0, 4.9, 5.28, 0.68, 0.6, 16, 1, 1, { capTop: M.tCollar });
  G.tube(P, M.tWhite, 0, 0, 5.28, 6.05, 0.47, 0.47, 16, 1, 1, { capTop: M.tWhite });
  G.tube(P, M.tWhite, 0, 0, 5.5, 5.6, 0.53, 0.53, 16, 1, 1, { capTop: M.tWhite }); G.tube(P, M.tWhite, 0, 0, 5.86, 5.98, 0.53, 0.53, 16, 1, 1, { capTop: M.tWhite });
  G.onion(P, M.tLead, 0, 6.05, 0, 0.47, 0.46, 20, 12);
  S.sph(P, M.xGold, 0, 6.64, 0, 0.15, 0.15, 0.15, 8);
  G.cross(P, M.tWhite, 0, 6.72, 0, 0.9, 0);
  P.pop();
  // colliders: a solid pavilion + the three west steps
  TR.box(ph, 0, 0, 2.8, 2.8, 0, 8);
  { const c = TR.W(-2.25, 0); ph.addStairs(c.x, c.z, 2.6, 1.5, TR.rot + Math.PI / 2, 0, BASE - 0.0, 3); }
  const c = TR.W(0, 0);
  K.svc.crowd.push({ id: 'trinity', x: TR.W(-4, 0).x, z: TR.W(-4, 0).z, r: 3, n: 3, kind: 'visitors' });
  K.svc.monuments.push({ id: 'w1180085908', name: 'Троицкая часовня на месте Троицкой церкви', x: c.x, z: c.z, h: 7.4 });
  K.svc.photoSpots.push({ x: TR.W(-6, 0).x, z: TR.W(-6, 0).z, yaw: L.yawToward(TR.W(-6, 0).x, TR.W(-6, 0).z, c.x, c.z), name: 'Троицкая часовня' });
}
