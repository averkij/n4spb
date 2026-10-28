// lib/craft-solids.js - the water craft that float by themselves (the tourist boats of environment/boats.js and landmarksC/boats.js) as KINEMATIC SOLIDS, like the traffic cars
// (docs/water-transport-boat-collisions.md): one oriented hull box per craft in the dynamic mechanism of core/physics.js (addDynamic / refreshDynamic / querySolids), so the player's motor boat
// (drive/collision.js createCarCollisions: the same code as a car) bounces off a hull, gets a 'hit' / 'scrape' event, and never ends up inside; a walker and a car on the water bed meet the same box.
//   * The pose of a craft is a PURE FUNCTION OF THE GAME TIME (ctx.time, set by main.js before the updates run; the same t the meshes are posed with): `pose(t, out)` writes { x, z, rot } (rot = the Y rotation
//     of the craft's frame, three.js convention: local +x -> (cos rot, -sin rot), local +z -> (sin rot, cos rot)).
//   * The hull box carries the source protocol of the traffic cars: vx, vz (the velocity of the centre, from the change of the pose between two times), spin (the yaw rate in the car's convention: the contact point
//     moves with spin * (rz, -rx)), invMassRatio 0 (a scripted tourist boat is heavy and on rails: it neither reacts nor stops, the contact impulse uses the RELATIVE velocity, so the player is thrown back
//     from a hull that comes at him and is carried along by one that sweeps past), inertia 1. No applyCarImpulse / onCarHit: nothing happens to the craft.
//   * Only the craft near the player are boxes (`NEAR` m from ctx.player.position); a moored craft never moves (its box is written once); the boxes are reused objects (`stableBoxes`: physics keeps one OBB per box and rewrites
//     it in place), the poses are computed once per distinct game time, so refreshDynamic (called by the frame, by every car.step) costs nothing extra.
//   * Heights: from `y - DRAFT` (the hull bottom; a tourist boat draws 0.1 m under the waterline) to `y + h` (roof or gunwale), y = the water level (a moored craft: the level of its pier). The player's boat tests
//     its hull (y .. y + hgt) against that, and a walker or a car on the bed (feet far under the water) is stopped by the box too.
//   * FLOATS (addFloatBlock): a pontoon deck / a landing slab is a FLOOR for the walker (walk boxes, environment/quay.js) that a boat rides over (its top is under the boat's step height 0.45), which is why the boat passed
//     through the piers. The float block is a static box of the same footprint from `wl - 0.4` to `wl + FLOAT_TOP`: it is just above the step height of a boat that floats on the water level `wl`, so the boat is stopped,
//     and just under what a walker stands on (a deck at wl + 0.32, a landing at wl + 0.22: feet + 0.45 >= FLOAT_TOP), so the walker's floor is still a floor and nobody is pushed off it.
import { STEP_HEIGHT } from '../../core/physics.js';

/** the hull bottom under the water level */
export const DRAFT = 0.15;
/** a floating block's top over the water: above the boat's step height (so it stops a boat) and below what a walker's feet reach on any deck / landing (0.22 and up) + the step height */
export const FLOAT_TOP = STEP_HEIGHT + 0.1;
export const FLOAT_DRAFT = 0.4;
/** craft farther than this from the player are not boxes (the hull of the Meteor hydrofoil is 35 m long) */
const NEAR = 200;
const TAU = Math.PI * 2;
/** the largest yaw rate a scripted hull really has (a U-turn of a tourist boat: 1.05 rad/s) */
const SPIN_CAP = 1.3;

/** a static box that stops a floating boat but not a walker standing on the deck / landing it covers (see the header). wl = the water level at the spot. */
export function addFloatBlock(physics, cx, cz, w, d, rot, wl) {
  const b = physics.addBox(cx, cz, w, d, rot, wl - FLOAT_DRAFT, wl + FLOAT_TOP);
  b.floatBlock = true;
  return b;
}

/** The registry of the craft of the page (one per ctx: ctx.services.craftSolids). add({ id, kind, key, y, w, d, h, pose, moving, size }) registers a craft:
 *   w, d = the footprint along the local x / z of the craft's frame (metres, the scale included), h = the height over the water (roof or gunwale), y = the water level it floats on,
 *   pose(t, out) writes the world pose { x, z, rot } at game time t; moving = false: the pose is read once; speed = its nominal speed in m/s (a velocity above 1.6 x speed + 0.5 is a snap of the script, not a velocity). A craft that never comes into the play area of the page is dropped (add returns null). */
export function craftSolids(ctx) {
  const S = ctx.services;
  if (S.craftSolids) return S.craftSolids;
  const list = [], out = [];
  let lastT = NaN, lastFx = 1e9, lastFz = 1e9;
  /** a moving craft at game time t: false when it is too far to matter; else its box is rewritten (pose, velocity from the change of pose since the last time, or from a short look back when that is stale) */
  const place = (c, t, f) => {
    const n = c.spare, b = c.box;
    c.pose(t, n);
    const dx = n.x - f.x, dz = n.z - f.z, r = NEAR + c.reach;
    if (dx * dx + dz * dz > r * r) { c.t = NaN; return false; }
    let dt = t - c.t;
    if (!(dt > 0) || dt > 0.25) { c.pose(t - 0.05, c.cur); dt = 0.05; }
    let dr = n.rot - c.cur.rot; dr -= TAU * Math.round(dr / TAU);
    const vx = (n.x - c.cur.x) / dt, vz = (n.z - c.cur.z) / dt, spin = dr / dt;
    if (vx * vx + vz * vz <= c.vcap * c.vcap && Math.abs(spin) <= SPIN_CAP) { b.vx = vx; b.vz = vz; b.spin = spin; }      // (a snap of the script - the scripted paths have a kink or two - is not a velocity: the box jumps, the last real velocity stays)
    b.cx = n.x; b.cz = n.z; b.rotY = n.rot;
    c.spare = c.cur; c.cur = n; c.t = t;
    return true;
  };
  const provider = () => {
    const t = ctx.time || 0, f = ctx.player.position;
    if (t === lastT && Math.abs(f.x - lastFx) < 10 && Math.abs(f.z - lastFz) < 10) return out;
    lastT = t; lastFx = f.x; lastFz = f.z;
    out.length = 0;
    for (let i = 0; i < list.length; i++) {
      const c = list[i], b = c.box;
      if (c.moving) { if (!place(c, t, f)) continue; }
      else { const dx = b.cx - f.x, dz = b.cz - f.z, r = NEAR + c.reach; if (dx * dx + dz * dz > r * r) continue; }
      out.push(b);
    }
    return out;
  };
  provider.stableBoxes = true;
  ctx.physics.addDynamic(provider);
  const api = S.craftSolids = {
    list,
    add(spec) {
      const L = ctx.L, c = { id: spec.id, kind: spec.kind, key: spec.key, moving: !!spec.moving, pose: spec.pose, vcap: 1.6 * (spec.speed || 6) + 0.5, t: NaN, reach: Math.hypot(spec.w, spec.d) / 2, cur: { x: 0, z: 0, rot: 0 }, spare: { x: 0, z: 0, rot: 0 } };
      let inside = false;                    // some pose of its track lies in (or within 40 m of) the play area of this page
      for (let k = 0; k < 16 && !inside; k++) { c.pose(k * 47, c.spare); inside = L.inPlay(c.spare.x, c.spare.z, -40); if (!c.moving) break; }
      if (!inside) return null;
      c.pose(0, c.cur);
      c.box = { cx: c.cur.x, cz: c.cur.z, w: spec.w, d: spec.d, rotY: c.cur.rot, y0: spec.y - DRAFT, y1: spec.y + spec.h, vx: 0, vz: 0, spin: 0, invMassRatio: 0, inertia: 1, craft: c };
      c.t = NaN;
      list.push(c); lastT = NaN;
      return c;
    },
    /** a craft that is gone (a boat that sinks, a test fixture) */
    remove(c) { const i = list.indexOf(c); if (i >= 0) list.splice(i, 1); lastT = NaN; },
    /** the hull boxes of the craft that are boxes right now (tests) */
    boxes: () => provider().slice(),
  };
  return api;
}
