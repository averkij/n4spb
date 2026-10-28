// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/bridges/stairs.js) for Vasilyevsky-Okrug 7 (docs/vo-br.md); the lines marked 'n4spb' are the world-rule adaptations (docs/AREAS.md 13.7), the rest is verbatim.
// bridges/stairs.js - the wide granite CORNER STAIRS of Nalichny, Korablestroiteley and the 3rd / 4th Smolensky bridges (third pass, docs/research/vo-bridges-wave3.md; photos refs/bridges2 n01 n02 k01 m01 m08 m09).
// Data: pits.js (STAIR_PITS: one record per flight, the water rings handed to environment/owners.js through groups.js WATER_RINGS); geometry: sculpt6.js stairPit (lower steps, landing, 14 / 17 steps, cheek walls);
// this file picks the pits of one bridge, draws them in the bridge frame and adds the colliders: a sticky walk box per lower step and for the landing, ONE walk ramp over the flight (the treads are 0.17 m
// high: a smooth ramp is the surface the walker follows), solid cheek walls, a barrier at the river end (nobody steps into the water), ctx.services.bridges.pits for people / photo spots.
// MODES: `sunk` = layout.inRiver is true in the middle of the pit (the owner ring is honoured by the ground and the quay); otherwise nothing is drawn (the flat fallback would hide a pit that does not exist).
// NO flags / flagpoles / beacons (user rules).
import { STAIR_PITS, PIT } from './pits.js';
import { stairPit } from './sculpt6.js';

/** draw the pits of the bridge B (site id) in the CURRENT frame of P (x = u, z = v); returns { pits, colliders(ph) } */
export function drawPits(e, B) {
  const { P, M, ctx } = e, L = ctx.L, mine = STAIR_PITS.filter((p) => p.site === B.site.id), drawn = [];
  for (const p of mine) {
    const w = B.world(p.uB + p.s * p.Lr / 2, p.vc);
    if (!(L.inRiver && L.inRiver(w.x, w.z))) continue;                                  // the ring is not water in this build: no pit, nothing to draw
    const mat = M[p.spec.mat], par = M[p.spec.par];
    if (!mat || !par) { console.warn('[bridges] stair pit material missing:', p.spec.mat, p.spec.par); continue; }
    const g = stairPit(P, M, { p, PIT, mat, par, bed: (e.waterY ?? -3.4) - 0.45 });
    drawn.push({ p, g });
  }
  const pits = drawn.map(({ p, g }) => {
    const lw = B.world(p.uB + p.s * (PIT.runLow * p.low + PIT.landing / 2), p.vc);
    return { id: p.id, x: B.world(p.uB + p.s * p.Lr / 2, p.vc).x, z: B.world(p.uB + p.s * p.Lr / 2, p.vc).z, landing: { x: lw.x, z: lw.z, y: p.yLand }, top: { y: PIT.top }, site: p.site };
  });
  const colliders = (ph, e2 = e) => {      // n4spb: e2 = the style's env (its rail batch: the cheek walls are breakable ghost bays)
    let n = 0;
    for (const { p, g } of drawn) {
      const s = p.s, U = (d) => p.uB + s * d, hw = PIT.hw, W = (d, v) => B.world(U(d), v), rot = -B.T;
      const dm = -0.08, dEnd = g.dEnd;
      // the walkable surfaces: lower steps and the landing = sticky walk boxes (slightly wider than the flight: they overlap the cheek boxes), the flight = one ramp
      for (const lv of g.levels) {
        if (lv.kind === 'flight') continue;
        const c = W((lv.d0 + lv.d1) / 2, p.vc), it = ph.addWalkBox(c.x, c.z, lv.d1 - lv.d0 + 0.04, 2 * hw + 0.06, rot, lv.y, -6); if (it) it.sticky = true; n++;
      }
      const f0 = g.levels.find((q) => q.kind === 'flight').d0, cf = W((f0 + dEnd) / 2, p.vc), yTopFlight = p.yLand + p.rise * p.n;
      const rotR = Math.PI / 2 - B.T;                                                  // local z of a ramp = +u of the frame
      const uA = Math.min(U(f0), U(dEnd));                                             // the lower-u end of the ramp: the street end for s = -1, the landing end for s = +1
      void uA;
      if (s < 0) ph.addWalkRamp(cf.x, cf.z, 2 * hw + 0.06, dEnd - f0, rotR, yTopFlight, p.yLand, 3); else ph.addWalkRamp(cf.x, cf.z, 2 * hw + 0.06, dEnd - f0, rotR, p.yLand, yTopFlight, 3);
      n++;
      // the cheek walls (outside the ring): n4spb (docs/AREAS.md 13.7) breakable ghost bays of the fence batch (rails.wall), no longer solid boxes from the bed; the barrier box across the river end ("nobody steps into the
      // water") is GONE: water is reachable, a walker steps off the lowest tread into the river (as at the Academy pier)
      for (const sg of [-1, 1]) {
        const a = W(dm - 0.05, p.vc + sg * (hw + PIT.cheek / 2)), b = W(dEnd + 0.05, p.vc + sg * (hw + PIT.cheek / 2));
        e2.rails.wall({ x0: a.x, z0: a.z, x1: b.x, z1: b.z, th: PIT.cheek + 0.02, y0: p.yLand - 0.2, y1: PIT.top + PIT.hLand + 0.15, y: p.yLand - 0.2 }); n++;
      }
      void rot;
    }
    B.info.colliders += n;
    return n;
  };
  B.pits = pits;
  return { pits, colliders };
}
