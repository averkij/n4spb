// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/gaps.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/gaps.js - runtime collider surgery that keeps the approaches of the second-pass bridges of Vasilievsky Island open (docs/research/vo-bridges-wave2.md section 7).
//   openHedgeGaps   the environment lays long clipped hedges along lawn edges (environment/lawns.js: a thin collision box, y 0 .. 1.1, 0.7 m thick, up to 180 m long).  A run may cross the foot path that leads onto a
//                   bridge (the Novo-Andreevsky footbridge: a 183 m hedge stands across its north entrance; the park island's hedges cross the approaches of the 2nd / 4th Smolensky bridges): the walker stops
//                   in front of it.  Every such box that crosses an approach corridor is cut into two pieces that leave a gap; the hedge MESH stays (the water owner is asked to cut it as well:
//                   docs/research/vo-requests-environment.md) - a hedge of 1.1 m that can be walked through is the lesser fault than a bridge that cannot be entered.
//   openWhsdLamps   streets places its 9 m cobra lamps (family M, a 0.16 m collider 3 m high) along the kerbs of the four motorway ways of the viaduct although the bridges module owns the deck: ten of them
//                   stand inside the deck footprint of the WHSD at z -300 .. 180 (one in the middle of the west carriageway: the red car hit it at 20 m/s).  Their colliders are removed (the meshes are the streets
//                   owner's: request in vo-requests-streets.md).
// Both only touch ctx.physics items (colliders), never meshes, and are idempotent.
import { frameOf } from './sites.js';
import { whsdDeckY } from './sites-vo2.js';

const isHedge = (it) => it.type === 'box' && it.y0 === 0 && Math.abs(it.y1 - 1.1) < 0.01 && Math.abs(it.hd - 0.35) < 0.011 && it.hw > 0.5;

/**
 * corridors: [{ cx, cz, b, u0, u1, v0, v1 }] in the frame of a bridge (origin cx, cz, bearing b like sites.js: +u along the road, +v across); every hedge box whose centre line crosses a corridor is replaced by the
 * pieces outside it (a margin of `pad` m each side of the gap; a piece shorter than 0.6 m is dropped).  Returns { cut, added }.
 */
export function openHedgeGaps(ctx, corridors, pad = 0.35) {
  const ph = ctx.physics, out = { cut: 0, added: 0 };
  if (!ph || !corridors.length) return out;
  const frames = corridors.map((c) => ({ ...c, f: frameOf(c) }));
  for (const it of ph.items.slice()) {
    if (!isHedge(it)) continue;
    const ax = it.c, az = -it.s;                                           // the box's long axis in the world (physics _obb: local x -> (cos, -sin))
    let hit = null;
    for (const c of frames) {
      const f = c.f;
      // the hedge centre line in the corridor frame: P(t) = A + t D, t in [-hw, hw]
      const dx0 = it.cx - c.cx, dz0 = it.cz - c.cz;
      const A = [dx0 * f.c + dz0 * f.s, -dx0 * f.s + dz0 * f.c], D = [ax * f.c + az * f.s, -ax * f.s + az * f.c];
      let t0 = -it.hw, t1 = it.hw;
      for (const [k, lo, hi] of [[0, c.u0, c.u1], [1, c.v0, c.v1]]) {          // slab clip of the segment against the rectangle
        if (Math.abs(D[k]) < 1e-9) { if (A[k] < lo || A[k] > hi) { t0 = 1; t1 = 0; } continue; }
        let ta = (lo - A[k]) / D[k], tb = (hi - A[k]) / D[k]; if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      }
      if (t0 <= t1) { hit = hit ? { t0: Math.min(hit.t0, t0), t1: Math.max(hit.t1, t1) } : { t0, t1 }; }
    }
    if (!hit) continue;
    ph.remove(it); out.cut++;
    for (const [a, b] of [[-it.hw, hit.t0 - pad], [hit.t1 + pad, it.hw]]) {
      if (b - a < 0.6) continue;
      const m = (a + b) / 2;
      ph.addBox(it.cx + ax * m, it.cz + az * m, b - a, it.hd * 2, it.rotY, it.y0, it.y1); out.added++;
    }
  }
  return out;
}

/** remove the colliders of the street lamps that stand inside the WHSD deck footprint; returns the number removed */
export function openWhsdLamps(ctx) {
  const ph = ctx.physics; let n = 0;
  if (!ph) return 0;
  for (const it of ph.items.slice()) {
    if (it.type !== 'cyl' || it.r > 0.2 || it.y0 > 0.01 || it.y1 > 3.1 || it.y1 < 2.4) continue;          // the 'M' lamp collider: r 0.16, y 0 .. 3
    if (it.cx < -7960 || it.cx > -7760 || it.cz < -320 || it.cz > 2610) continue;
    if (whsdDeckY(it.cx, it.cz) === null) continue;
    ph.remove(it); n++;
  }
  return n;
}
