// Visitor stairs from the plaza (y 0) up to the 1.15 m outer plinth of the arena (2026-10-13, "finish the stadium area").
// Before this the plinth was a 1.15 m wall all the way round: a tourist could see the glazed colonnade but never reach it.
// 16 flights of 7 granite steps (0.164 m rise, 0.36 m tread, 6 m wide) stand in the gaps between the 80 structural columns
// (the columns are at multiples of 4.5 deg, the flights at 2.25 deg + 22.5 deg * k, so every flight opens onto a 7.6 m wide gap).
// Drawn as instanced boxes of the module kit (granite material, no new material); the physics walk boxes are the same steps (ph.addStairs).
// A flight whose footprint touches asphalt (safeSpot) is skipped: nothing is drawn or collided there.
import { safeSpot } from '../landmarksVictoryPark/kit.js';

export const STAIRS = { count: 16, steps: 7, rise: 1.15 / 7, tread: 0.36, width: 6 };

/** Called inside P.push(bb.cx, 0, bb.cz): lx/lz are metres from the arena centre. Returns the list of flights that were built. */
export function plinthStairs(ctx, P, M, bb, rx, rz) {
  const { count, steps, rise, tread, width } = STAIRS, D = steps * tread, built = [];
  for (let k = 0; k < count; k++) {
    const a = (2.25 + 22.5 * k) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    const ex = .9 * rx * c, ez = .9 * rz * s;                                   // the point of the rendered plinth edge (a lathe scaled to the ellipse)
    let nx = rz * c, nz = rx * s; const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;   // outward normal of the ellipse
    const rot = Math.atan2(nx, nz);                                              // local +z of the flight frame = outward
    // physical footprint reaches 0.15 m under the plinth edge so that the last tread meets the support floor without a seam
    const cx = bb.cx + ex + nx * (D - .15) / 2, cz = bb.cz + ez + nz * (D - .15) / 2;
    if (!safeSpot(ctx, cx, cz, width + .8, D + .5, rot)) continue;
    ctx.physics.addStairs(cx, cz, width, D + .15, rot + Math.PI, 0, 1.15, steps);   // rises toward the arena (local +z = -n)
    P.push(ex, 0, ez, rot);
    for (let i = 0; i < steps; i++) {
      const h = (i + 1) * rise, u = (steps - 1 - i + .5) * tread;                 // step 0 is the lowest and the outermost
      P.box(M.granite, 0, h / 2, u, width, h, tread - .004, 700);
    }
    for (const side of [-1, 1]) {                                                // stepped cheek walls: each block stands 0.32 m above its tread
      for (let i = 0; i < steps; i++) { const h = (i + 1) * rise + .32, u = (steps - 1 - i + .5) * tread; P.box(M.stoneShade, side * (width / 2 + .12), h / 2, u, .24, h, tread - .004, 700); }
      ctx.physics.addBox(cx + nz * side * (width / 2 + .12) + nx * .075, cz - nx * side * (width / 2 + .12) + nz * .075, .24, D + .15 - .15, rot, 0, 1.6);
    }
    P.pop();
    built.push({ x: cx, z: cz, angle: +(a * 180 / Math.PI).toFixed(2) });
  }
  return built;
}
