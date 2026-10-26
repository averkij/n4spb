// landmarksAcademy/rear.js - the REAR CENTRE of the Academy (garden side): docs/research/academy.md 3.3 (critic-corrected numbers).
//   pavilion u -12.6..10.1 (22.7 m) x v -53.3..-47.1; base wall 0..7.0 with two big arched openings (blue-grey iron grilles) and a central double door with a few granite steps, a balcony slab at
//   y 7.0 (depth 2.3 m), the upper wall set back 2.3 m, FOUR columns at c-c 4.8 / 6.4 / 4.8 m (= 16.0 m), one arched window per bay, an entablature across the whole front and a low pediment
//   (base 21.5 m, apex 24.3 m, a plain tympanum with a dark half-round lunette).  The octagonal rear dome stands behind it (dome.js).
// Frame: the academy frame turned by 180 deg at (u -1.25, v -53.3): local +x runs toward -u, local +z points OUT (toward -v, the garden), the building lies at negative z.
import { ACAD, H } from './frame.js';
import { romanDoric, entabl, baluster } from './orders.js';

export const RC = { u: -1.25, v: -53.3 };

export async function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot); P.push(RC.u, 0, RC.v, Math.PI);
  try {
    const hw = 11.35, zU = -2.3;
    // base wall, balcony slab, upper wall
    P.quad(M.rearBase, [-hw, 0, 0], [hw, 0, 0], [hw, 7.0, 0], [-hw, 7.0, 0], [0, 0, 1]);
    P.cap(M.slabs, [[-hw, zU], [hw, zU], [hw, 0], [-hw, 0]], H.podium + 0.003, true, 2.4);
    P.quad(M.rearUpper, [-hw, H.podium, zU], [hw, H.podium, zU], [hw, 17.8, zU], [-hw, 17.8, zU], [0, 0, 1]);
    P.box(M.order, -hw, hw, 6.8, 7.0, -0.01, 0.2, 'kb', 3);                                                                // the string course along the slab edge
    // the columns (c-c 4.8 / 6.4 / 4.8) and the entablature
    const xs = [-8.0, -3.2, 3.2, 8.0];
    for (const x of xs) romanDoric(P, M, x, -1.1, H.podium, H.top + 0.1, 0.72);
    entabl(P, M, -hw, hw, H.top + 0.1, zU, -0.1);
    P.quad(M.soffit, [-hw + 0.2, H.top + 0.09, -0.12], [hw - 0.2, H.top + 0.09, -0.12], [hw - 0.2, H.top + 0.09, zU], [-hw + 0.2, H.top + 0.09, zU], [0, -1, 0]);
    // balustrade between the pedestals
    baluster(P, M, xs[1] + 0.95, xs[2] - 0.95, H.podium, -0.25); baluster(P, M, xs[0] + 0.95, xs[1] - 0.95, H.podium, -0.25); baluster(P, M, xs[2] + 0.95, xs[3] - 0.95, H.podium, -0.25);
    // granite steps at the central door
    for (let k = 0; k < 3; k++) P.box(M.granitePlinth, -2.4 - k * 0.3, 2.4 + k * 0.3, 0, 0.15 * (3 - k), 0, 0.45 * (k + 1), 'b', 2.4);
    // pediment: apex 24.3, base 21.5 m, a plain tympanum with a dark half-round lunette, roof planes back to the attic wall of the rear dome
    const xa = -10.75, xb = 10.75, ya = H.eave, yp = H.rearApex, zc = 0.5, zt = 0.18, zA = -2.2;
    P.fan(M.rearField, [[xa + 0.55, ya, zt], [xb - 0.55, ya, zt], [0, yp - 0.62, zt]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
    P.cyl(M.glass, [0, ya + 0.9, zt + 0.02], [0, ya + 0.9, zt + 0.03], 1.5, 1.5, 16, false);
    for (const s of [1, -1]) {
      const xe = s > 0 ? xb : xa, run = Math.abs(xe), sl = Math.hypot(run, yp - ya), nx = (-s * (yp - ya)) / sl, ny = run / sl;
      P.quad(M.order, [xe, ya, zc], [0, yp - 0.55, zc], [0, yp, zc], [xe, ya + 0.55, zc], [0, 0, 1]);
      P.quad(M.orderShade, [xe, ya, zt], [0, yp - 0.55, zt], [0, yp - 0.55, zc], [xe, ya, zc], [-nx, -ny, 0]);
      P.quad(M.roof, [xe + (s > 0 ? 0.02 : -0.02), ya + 0.55, zc + 0.04], [0, yp, zc + 0.04], [0, yp, zA], [xe, ya + 0.55, zA], [nx, ny, 0], [[0, 0], [sl / 0.6, 0], [sl / 0.6, 12], [0, 12]]);
    }
  } finally { P.pop(); P.pop(); }
  void ph;
}
