// landmarksYelaginSpits/stairs.js - the two granite flights beside the returns (OSM steps w1217811699 north 5.1 m, w1217811698 south 4.5 m) and the broad low steps from the park lawn up to the terrace.
// FLIGHTS (photos spit 17, 24; dossier: "steep stairs down to the water forming massive pedestals for the lion statues"): from the wing level (y 0) beside the head of the return, along its OUTER face, down
// to a landing 0.2 m above the water (-3.2): 20 treads of 0.16 x 0.255 m (5.1 m), 1.9 m wide, an inner cheek (0.45 m, against the return) and an outer cheek (0.3 m) whose top follows the treads 0.9 m above them
// and ends as a 0.10 m kerb at the rim of the pit.  The flight lies in the corner frame (wall.js CORNERS): x' outward from the return (-x' at the north corner, +x' at the south one), z' from the head (-5.1)
// to the water line (0).
// IT SITS BELOW THE GROUND PLANE of the generic scene: the rings `WATER_RINGS` of groups.js are the pits that the water owner has to open (docs/research/islands2-requests-landmarksYelaginSpits.md); without
// the hand-over the treads are under the ground and only the walk boxes exist.
// TERRACE STEPS (photo spit 25): two granite treads (0.15 and 0.30 m high, 0.4 m deep) along the east edge, 18 m wide.
import { TERRACE, FOOT, TERRACE_E, world, ROT, FLIGHT, cornerPoint, flightRing } from './frame.js';
import { CORNERS } from './wall.js';
import { local } from './frame.js';

/** true when (x, z) lies within 1.5 m of a flight's pit (the hedges keep away) */
export const PIT_CLEAR = (x, z) => { const [a, b] = local(x, z); return CORNERS.some((c) => { const da = a - c.a, db = b - c.b, xp = da * Math.cos(c.psi) - db * Math.sin(c.psi), zp = da * Math.sin(c.psi) + db * Math.cos(c.psi), s = c.sx > 0 ? -1 : 1, w = FLIGHT.inner + FLIGHT.w + FLIGHT.outer; return s * xp > -1.5 && s * xp < w + 1.5 && zp > FLIGHT.head - 1.5 && zp < 2; }); };


export function flights(ctx, P, M, svc) {
  const F = FLIGHT, zs = (k) => F.head + k * F.run, yTop = (k) => F.yHead - (k + 1) * F.rise;
  const hTop = (z) => Math.max(F.kerb, F.yHead + (z - F.head) * (F.landing - F.yHead) / (0 - F.head) + 0.9 - F.rise);       // top of a cheek at z'
  const zK = F.head + (F.yHead + 0.9 - F.rise - F.kerb) / ((F.yHead - F.landing) / (0 - F.head));                              // where the sloped top meets the kerb
  for (const c of CORNERS) {
    const s = c.sx > 0 ? -1 : 1, xi0 = s * F.inner, xi1 = s * (F.inner + F.w), xo1 = s * (F.inner + F.w + F.outer);
    const lo = Math.min(xi0, xi1), hi = Math.max(xi0, xi1);
    P.push(c.a, 0, c.b, c.psi);
    for (let k = 0; k < F.n; k++) P.boxT(M.granite, lo, hi, FOOT, yTop(k), zs(k), zs(k + 1), 'lrkb', 3, 3, 0);      // the treads (the last one is the landing)
    // cheeks: inner (return side, far face hidden in the return) and outer; every piece = stair-side face, far face (outer only), sloped / flat top, head end, water end
    for (const [xa, xb, drawFar] of [[xi0, 0, false], [xi1, xo1, true]]) {
      const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), nS = xa > xb ? [1, 0, 0] : [-1, 0, 0];
      const piece = (zA, zB, yA, yB, head, water) => {
        const q = (x, z, y) => [x, y, z];
        P.quad(M.granite, q(xa, zA, FOOT), q(xa, zB, FOOT), q(xa, zB, yB), q(xa, zA, yA), nS, [[zA / 3, 0], [zB / 3, 0], [zB / 3, (yB - FOOT) / 3], [zA / 3, (yA - FOOT) / 3]]);
        if (drawFar) P.quad(M.granite, q(xb, zA, FOOT), q(xb, zB, FOOT), q(xb, zB, yB), q(xb, zA, yA), [-nS[0], 0, 0], [[zA / 3, 0], [zB / 3, 0], [zB / 3, (yB - FOOT) / 3], [zA / 3, (yA - FOOT) / 3]]);
        P.quad(M.granite, q(x0, zA, yA), q(x1, zA, yA), q(x1, zB, yB), q(x0, zB, yB), [0, 1, 0], [[0, zA / 3], [1, zA / 3], [1, zB / 3], [0, zB / 3]]);
        if (head) P.quad(M.granite, q(x0, zA, FOOT), q(x1, zA, FOOT), q(x1, zA, yA), q(x0, zA, yA), [0, 0, -1], [[0, 0], [0.4, 0], [0.4, 1], [0, 1]]);
        if (water) P.quad(M.granite, q(x0, zB, FOOT), q(x1, zB, FOOT), q(x1, zB, yB), q(x0, zB, yB), [0, 0, 1], [[0, 0], [0.4, 0], [0.4, 1], [0, 1]]);
      };
      piece(F.head, zK, hTop(F.head), F.kerb, true, false);
      piece(zK, 0, F.kerb, F.kerb, false, true);
    }
    // the granite post with a chamfered top at the head of the flight, beside the outer cheek (photos spit 09, 17)
    { const px = s * (F.inner + F.w + F.outer / 2), pz = F.head - 0.55;
      P.boxT(M.granite, px - 0.26, px + 0.26, 0, 0.72, pz - 0.26, pz + 0.26, 'b', 3, 3, 0);
      P.boxT(M.granite, px - 0.2, px + 0.2, 0.72, 0.86, pz - 0.2, pz + 0.2, 'b', 3, 3, 0);
      P.boxT(M.granite, px - 0.1, px + 0.1, 0.86, 0.92, pz - 0.1, pz + 0.1, 'b', 3, 3, 0);
      const [qx, qz] = world(...cornerPoint(c, px, pz)); ctx.physics.addBox(qx, qz, 0.52, 0.52, ROT + c.psi, 0, 0.92); }
    P.pop();
    // ---- physics (world): the treads (rising along local +z = toward the head), the two cheeks, the barrier at the water end
    const rot = ROT + c.psi, len = -F.head;
    const [wx, wz] = world(...cornerPoint(c, (lo + hi) / 2, F.head / 2));
    ctx.physics.addStairs(wx, wz, F.w, len, rot + Math.PI, F.landing - F.rise, F.yHead - F.rise, F.n);
    for (const [xa, xb] of [[xi0, 0], [xi1, xo1]]) {
      const [cx, cz] = world(...cornerPoint(c, (xa + xb) / 2, (F.head + 0.15) / 2));
      ctx.physics.addBox(cx, cz, Math.abs(xb - xa), len + 0.15, rot, FOOT, 1.0);
    }
    const [ex, ez] = world(...cornerPoint(c, xo1 / 2, 0.65));
    ctx.physics.addBox(ex, ez, Math.abs(xo1), 0.6, rot, FOOT, -2.0);                    // the end of the landing: nobody steps into the water
    svc.flights.push({ corner: c.key, x: wx, z: wz, rotY: rot, n: F.n, w: F.w, headY: 0, footY: F.landing, ring: flightRing(c) });
  }
}

/** the broad low steps on the park side of the terrace (two treads) */
export function terraceSteps(ctx, P, M, svc) {
  const W = 18, D = 0.4;
  P.boxT(M.granite, -W / 2, W / 2, 0, 0.15, TERRACE_E - 2 * D, TERRACE_E - D, 'kb', 3, 3, 0);
  P.boxT(M.granite, -W / 2, W / 2, 0, TERRACE, TERRACE_E - D, TERRACE_E, 'kb', 3, 3, 0);
  const [cx, cz] = world(0, TERRACE_E - D);
  ctx.physics.addStairs(cx, cz, W, 2 * D, ROT, 0, TERRACE, 2);                          // rises toward +b (the wall)
  svc.steps = { x: cx, z: cz, w: W, treads: 2 };
}
