// lib/craft-solids.js - the water craft that float by themselves (the tourist boats of environment/boats.js and landmarksC/boats.js) as KINEMATIC SOLIDS, like the traffic cars
// (docs/water-transport-boat-collisions.md): one oriented hull box per craft in the dynamic mechanism of core/physics.js (addDynamic / refreshDynamic / querySolids), so the player's motor boat
// (drive/collision.js createCarCollisions: the same code as a car) bounces off a hull, gets a 'hit' / 'scrape' event, and never ends up inside; a walker and a car on the water bed meet the same box.
//   * The pose of a craft is a PURE FUNCTION OF THE GAME TIME (ctx.time, set by main.js before the updates run; the same t the meshes are posed with): `pose(t, out)` writes { x, z, rot } (rot = the Y rotation
//     of the craft's frame, three.js convention: local +x -> (cos rot, -sin rot), local +z -> (sin rot, cos rot)).
//   * The hull box carries the source protocol of the traffic cars: vx, vz (the velocity of the centre, from the change of the box between two times), spin (the yaw rate in the car's convention: the contact point
//     moves with spin * (rz, -rx)), invMassRatio 0 (a scripted tourist boat is heavy and on rails: it neither reacts nor stops, the contact impulse uses the RELATIVE velocity, so the player is thrown back
//     from a hull that comes at him and is carried along by one that sweeps past), inertia 1. No applyCarImpulse / onCarHit: nothing happens to the craft.
//   * Only the craft near the player are boxes (`NEAR` m from ctx.player.position); a moored craft never moves (its box is written once); the boxes are reused objects (`stableBoxes`: physics keeps one OBB per box and rewrites
//     it in place), the poses are computed once per distinct game time, so refreshDynamic (called by the frame, by every car.step) costs nothing extra.
//   * Heights: from `y - DRAFT` (the hull bottom; a tourist boat draws 0.1 m under the waterline) to `y + h` (roof or gunwale), y = the water level (a moored craft: the level of its pier). The player's boat tests
//     its hull (y .. y + hgt) against that, and a walker or a car on the bed (feet far under the water) is stopped by the box too.
//   * THE GUARD (a pinch is never a squeeze). A scripted hull that comes CLOSER to a static float block or a resting craft than PINCH metres is NOT a solid while it does (or touches it): the player's boat (5.6 m
//     long, 5.9 m across its diagonal) caught between the two faces is crushed, and the SAT push-out of drive/collision.js then throws it out across the block (1 .. 10 m in one frame). A hull that keeps its
//     distance (glides along a pier) stays solid: a boat in that gap is wedged, nothing more. A ghost hull never turns solid on top of the player: it stays a ghost until he is HOLD metres clear of its box. The tracks of the scripted craft are kept clear of the obstacles (tools/boat-craft-test.mjs 5, the sweep over a whole run of the clock, every
//     area), so in the game the guard is the net under a failure of a track, not a feature of it.
//   * A script that SNAPS (the Fontanka loop jumps 1.2 m / 4 deg once per lap) moves the BOX gradually: the jump is carried as an offset that eases out over EASE seconds, the velocity is the change of the box, so a snap is
//     never a phantom velocity (it was 26 m/s) and never a jump of a hull into a boat that lay beside it.
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
/** a scripted hull closer than this (m) to a static float block / a resting craft AND coming closer is a ghost: the player's boat is 5.6 m long (5.9 m across its diagonal, 0.06 m skin per side), no gap
 *  wider than that can crush it. A hull that keeps its distance (a tourist boat that glides along a pier at a steady 2 m) is a plain solid: nothing is squeezed, a boat in the gap is only wedged. */
export const PINCH = 6.2;
/** the hull is "coming closer" when the gap closes faster than this (m/s) */
export const CLOSE = 0.3;
/** a hull this close (m) to a static one is a ghost whatever it does (the tracks keep clear of the obstacles: that is the sweep) */
export const TOUCH = 0.3;
/** the player is within this many metres of a ghost hull's box: the hull stays a ghost (a boat is 3 m from its centre to its corner) */
export const HOLD = 3.6;
/** a snap of the script is carried by the box as an offset that eases out over this many seconds */
export const EASE = 1.5;
const wrap = (a) => a - TAU * Math.round(a / TAU);

/** a static box that stops a floating boat but not a walker standing on the deck / landing it covers (see the header). wl = the water level at the spot. */
export function addFloatBlock(physics, cx, cz, w, d, rot, wl) {
  const b = physics.addBox(cx, cz, w, d, rot, wl - FLOAT_DRAFT, wl + FLOAT_TOP);
  b.floatBlock = true;
  b.craftR = Math.hypot(w, d) / 2;
  (physics.floatBlocks || (physics.floatBlocks = [])).push(b);                 // (the guard of the scripted hulls reads this list)
  return b;
}

/** a lower bound (m) of the distance between two oriented footprints { cx, cz, hw, hd, c, s } (physics convention: local x -> (c, -s), local z -> (s, c)); negative when they overlap */
export function obbGap(a, b) {
  const dx = b.cx - a.cx, dz = b.cz - a.cz; let g = -Infinity;
  for (let i = 0; i < 4; i++) {
    const ax = i === 0 ? a.c : i === 1 ? a.s : i === 2 ? b.c : b.s, az = i === 0 ? -a.s : i === 1 ? a.c : i === 2 ? -b.s : b.c;
    const ra = a.hw * Math.abs(ax * a.c - az * a.s) + a.hd * Math.abs(ax * a.s + az * a.c), rb = b.hw * Math.abs(ax * b.c - az * b.s) + b.hd * Math.abs(ax * b.s + az * b.c);
    const sep = Math.abs(dx * ax + dz * az) - ra - rb; if (sep > g) g = sep;
  }
  return g;
}

/** The registry of the craft of the page (one per ctx: ctx.services.craftSolids). add({ id, kind, key, y, w, d, h, pose, moving, speed }) registers a craft:
 *   w, d = the footprint along the local x / z of the craft's frame (metres, the scale included), h = the height over the water (roof or gunwale), y = the water level it floats on,
 *   pose(t, out) writes the world pose { x, z, rot } at game time t; moving = false: the pose is read once; speed = its nominal speed in m/s (a velocity above 1.6 x speed + 0.5 is a snap of the script, not a velocity).
 *   A craft that never comes into the play area of the page is dropped (add returns null). c.ghost = the hull is a ghost right now (see the guard in the header). */
export function craftSolids(ctx) {
  const S = ctx.services;
  if (S.craftSolids) return S.craftSolids;
  const list = [], out = [];
  let lastT = NaN, lastFx = 1e9, lastFz = 1e9;
  /** the guard: is the moving craft c (its box b already placed at game time t) a ghost now? f = the player's position */
  const ghosted = (c, b, f, t) => {
    const o = c.obb; o.cx = b.cx; o.cz = b.cz; o.c = Math.cos(b.rotY); o.s = Math.sin(b.rotY);
    const R = c.reach + PINCH; let gap = Infinity;
    const fl = ctx.physics.floatBlocks;
    if (fl) for (let i = 0; i < fl.length; i++) {
      const s = fl[i], dx = s.cx - o.cx, dz = s.cz - o.cz, r = R + s.craftR;
      if (dx * dx + dz * dz <= r * r) gap = Math.min(gap, obbGap(o, s));
    }
    for (let i = 0; i < list.length; i++) {
      const s = list[i]; if (s.moving) continue;
      const dx = s.sobb.cx - o.cx, dz = s.sobb.cz - o.cz, r = R + s.reach;
      if (dx * dx + dz * dz <= r * r) gap = Math.min(gap, obbGap(o, s.sobb));
    }
    if (t !== c.gapT) {                                        // (once per game time: the closing speed of the gap; a clock that jumps back or a long pause starts afresh)
      c.closeV = t > c.gapT && t - c.gapT <= 0.25 && c.gap < Infinity && gap < Infinity ? (c.gap - gap) / (t - c.gapT) : 0;
      c.gap = gap; c.gapT = t;
    }
    let g = gap < TOUCH || (gap < PINCH && c.closeV > CLOSE);
    if (!g && c.ghost) {                                      // it never turns solid on top of the player
      const dx = f.x - o.cx, dz = f.z - o.cz, lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
      if (Math.hypot(Math.max(Math.abs(lx) - o.hw, 0), Math.max(Math.abs(lz) - o.hd, 0)) < HOLD) g = true;
    }
    c.ghost = g; return g;
  };
  /** a moving craft at game time t: false when it is too far to matter; else its box is rewritten: the pose of the script plus the eased offset of its last snap, the velocity from the change of the box */
  const place = (c, t, f) => {
    const n = c.spare, b = c.box, r = NEAR + c.reach;
    if (t === c.t) { const ex = b.cx - f.x, ez = b.cz - f.z; if (ex * ex + ez * ez > r * r) { c.t = NaN; c.ghost = false; c.gapT = -1; return false; } return true; }      // (placed at this very time)
    c.pose(t, n);
    const dx = n.x - f.x, dz = n.z - f.z;
    if (dx * dx + dz * dz > r * r) { c.t = NaN; c.ghost = false; c.gapT = -1; return false; }
    let dt = t - c.t, px, pz, pr;                             // px, pz, pr = the box as it was
    if (!(dt > 0) || dt > 0.25) { c.pose(t - 0.05, c.cur); dt = 0.05; c.ox = c.oz = c.or = 0; px = c.cur.x; pz = c.cur.z; pr = c.cur.rot; }
    else { px = b.cx; pz = b.cz; pr = b.rotY; }
    const sx = n.x - c.cur.x, sz = n.z - c.cur.z, sr = wrap(n.rot - c.cur.rot), vc = c.vcap * dt;
    const snap = sx * sx + sz * sz > vc * vc || Math.abs(sr) > SPIN_CAP * dt;      // the script jumped (a velocity no craft has): the box stays where it was, the jump becomes an offset that eases out
    const k = Math.max(0, 1 - dt / EASE);
    if (snap) { c.ox = px - n.x; c.oz = pz - n.z; c.or = wrap(pr - n.rot); } else { c.ox *= k; c.oz *= k; c.or *= k; }
    const bx = n.x + c.ox, bz = n.z + c.oz, br = n.rot + c.or;
    if (!snap) {
      const vx = (bx - px) / dt, vz = (bz - pz) / dt, spin = wrap(br - pr) / dt;
      if (vx * vx + vz * vz <= (c.vcap + 1) * (c.vcap + 1) && Math.abs(spin) <= SPIN_CAP + 0.5) { b.vx = vx; b.vz = vz; b.spin = spin; }      // (a velocity no craft has is never believed: the last real one stays)
    }
    b.cx = bx; b.cz = bz; b.rotY = br;
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
      if (c.moving) { if (!place(c, t, f) || ghosted(c, b, f, t)) continue; }
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
      const L = ctx.L, c = { id: spec.id, kind: spec.kind, key: spec.key, moving: !!spec.moving, pose: spec.pose, vcap: 1.6 * (spec.speed || 6) + 0.5, t: NaN, reach: Math.hypot(spec.w, spec.d) / 2, cur: { x: 0, z: 0, rot: 0 }, spare: { x: 0, z: 0, rot: 0 }, ox: 0, oz: 0, or: 0, ghost: false, gap: Infinity, gapT: -1, closeV: 0 };
      let inside = false;                    // some pose of its track lies in (or within 40 m of) the play area of this page
      for (let k = 0; k < 16 && !inside; k++) { c.pose(k * 47, c.spare); inside = L.inPlay(c.spare.x, c.spare.z, -40); if (!c.moving) break; }
      if (!inside) return null;
      c.pose(0, c.cur);
      c.box = { cx: c.cur.x, cz: c.cur.z, w: spec.w, d: spec.d, rotY: c.cur.rot, y0: spec.y - DRAFT, y1: spec.y + spec.h, vx: 0, vz: 0, spin: 0, invMassRatio: 0, inertia: 1, craft: c };
      c.obb = { cx: 0, cz: 0, hw: spec.w / 2, hd: spec.d / 2, c: 1, s: 0 };
      if (!c.moving) c.sobb = { cx: c.cur.x, cz: c.cur.z, hw: spec.w / 2, hd: spec.d / 2, c: Math.cos(c.cur.rot), s: Math.sin(c.cur.rot) };
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
