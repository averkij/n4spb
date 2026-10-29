// landmarksPrimorskaya/stairs.js - the two flights of granite STAIRS down the north bank of the Smolenka (an authored detail, not mapped in OSM: docs/gdm-D2.md). The recipe is that of the corner stairs of the Nalichny Bridge
// (bridges/pits.js + stairs.js + sculpt6.js stairPit): each flight stands in a PIT that groups.js hands to the engine as a water ring (WATER_RINGS: the ring counts as Smolenka water, a hole in the ground; the generic quay opens at
// it): the module draws the three lower steps, the landing, the 16-step flight (blocks from the bed up to each tread), the retaining faces of the pit, and adds the colliders: a sticky walk box per lower step and for the landing, ONE
// walk ramp over the flight (the treads are 0.17 m high: a smooth ramp is the surface the walker follows). WATER IS REACHABLE: nothing closes the river end (no barrier box, no guard box): a walker steps off the lowest tread into
// the river, and the parapet that flanks the flight above the street (0.75 - 1.05 m, 0.5 m thick) is made of three knock BAYS per side (lib/fence-bays.js: the collider is removed at the knock, a car breaks through). The retaining faces
// below the street level carry no collider (the terrain beside the pit is the wall, as for every pit of the engine).
// Frame of a flight (groups.js): local +z = N (landward, north-north-east), local +x = -T (T along the bank); a point (d, v) of groups.js is local (x = -v, z = d).
import { STAIR_PITS, PIT } from './groups.js';
import { unitBox } from '../lib/fence-bays.js';
import { kBays } from './inst.js';

export function stairs(K) {
  const { ctx, M, P } = K, L = ctx.L, ph = ctx.physics, PAL = M.PAL, S = K.svc, hw = PIT.hw, rise = (PIT.top - PIT.yLand) / PIT.n;
  for (const p of STAIR_PITS) {
    if (!(L.inRiver && L.inRiver(p.c[0], p.c[1]))) { S.stairsSkipped.push(p.id); continue; }       // the ring is not water in this build (no area table): nothing to draw, a flat strip would hide it
    const bed = (L.waterLevelAt(p.c[0], p.c[1]) ?? -3.4) - 0.45, rot = Math.atan2(p.N[0], p.N[1]);
    const W = (d, v) => [p.x + p.N[0] * d + p.T[0] * v, p.z + p.N[1] * d + p.T[1] * v];
    // the levels from the water landward: lower steps, the landing, the flight
    const lev = []; let d = -0.08;
    for (let k = 1; k <= PIT.low; k++) { lev.push({ d0: d, d1: k * PIT.run, y: PIT.yLand - PIT.riseLow * (PIT.low - k + 1), kind: 'low' }); d = k * PIT.run; }
    lev.push({ d0: d, d1: d + PIT.landing, y: PIT.yLand, kind: 'landing' }); d += PIT.landing;
    for (let j = 1; j <= PIT.n; j++) { lev.push({ d0: d, d1: d + PIT.run, y: PIT.yLand + rise * j, kind: 'flight' }); d += PIT.run; }
    const dEnd = lev[lev.length - 1].d1;
    P.push(p.x, 0, p.z, rot);
    // blocks from the bed to each tread; the sides (x = +-hw) are the retaining faces below
    for (const lv of lev) {
      P.tint(PAL.granite).box(M.vc, -hw, hw, bed, lv.y, lv.d0, lv.d1, 'bf', 2);
      P.tint(PAL.granitePale).quad(M.vc, [-hw, lv.y + 0.004, lv.d0], [hw, lv.y + 0.004, lv.d0], [hw, lv.y + 0.004, lv.d1], [-hw, lv.y + 0.004, lv.d1], [0, 1, 0]);
    }
    // the threshold: a granite lip over the seam between the last tread and the street beyond the ring
    P.tint(PAL.granitePale).box(M.vc, -hw - PIT.cheek, hw + PIT.cheek, PIT.top - 0.02, PIT.top + 0.012, dEnd - 0.02, dEnd + 0.45, 'b', 2);
    // the retaining faces of the pit beside the flight, from the bed to the street level (inner faces, no collider: the terrain is the wall)
    P.tint(PAL.graniteDark);
    for (const sg of [-1, 1]) P.quad(M.vc, [sg * (hw + 0.012), bed, -0.08], [sg * (hw + 0.012), bed, dEnd], [sg * (hw + 0.012), PIT.top, dEnd], [sg * (hw + 0.012), PIT.top, -0.08], [-sg, 0, 0]);
    P.pop();
    // colliders: the lower steps and the landing = sticky walk boxes (a hair wider than the flight), the flight = one ramp (no guard box at the river end)
    let n = 0;
    for (const lv of lev) {
      if (lv.kind === 'flight') continue;
      const [cx, cz] = W((lv.d0 + lv.d1) / 2, 0), it = ph.addWalkBox(cx, cz, 2 * hw + 0.06, lv.d1 - lv.d0 + 0.04, rot, lv.y, -6); if (it) it.sticky = true; n++;
    }
    const f0 = lev.find((q) => q.kind === 'flight').d0, [fx, fz] = W((f0 + dEnd) / 2, 0);
    ph.addWalkRamp(fx, fz, 2 * hw + 0.06, dEnd - f0, rot, PIT.yLand, PIT.top, 3); n++;
    // the parapet beside the flight above the street: three knock bays per side (1.05 / 0.9 / 0.75 m high, 0.5 m thick), the breakable wall of the world rule
    const bays = [], seg = (dEnd + 0.08) / 3, hs = [1.05, 0.9, 0.75];
    for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) {
      const [x0, z0] = W(-0.08 + seg * k, sg * (hw + PIT.cheek / 2 + 0.012)), [x1, z1] = W(-0.08 + seg * (k + 1), sg * (hw + PIT.cheek / 2 + 0.012));
      bays.push({ x0, z0, x1, z1, y: PIT.top, h: hs[k] });
    }
    kBays(K, { name: 'lmprim-stair-parapet-' + p.id, bays, far: 260,
      parts: [{ geo: unitBox(0, 1, -PIT.cheek / 2, PIT.cheek / 2, { uLen: 2.5, uvs: 2 }), mat: M.granite, name: 'parapet', stretch: true, sy: (b) => b.h }],
      collider: (b) => ({ y0: PIT.top - 0.3, y1: PIT.top + b.h, thick: PIT.cheek, e0: 0.02, e1: 0.02 }),
      rec: (b) => ({ kind: 'fence', mass: 600, h: b.h, anchored: 14, hitK: 0.4, metal: false, minDv: 0 }) });
    n += bays.length; S.colliders += n;
    S.pits.push({ id: p.id, x: p.c[0], z: p.c[1], landing: { x: W(PIT.low * PIT.run + PIT.landing / 2, 0)[0], z: W(PIT.low * PIT.run + PIT.landing / 2, 0)[1], y: PIT.yLand }, top: { y: PIT.top } });
  }
}
