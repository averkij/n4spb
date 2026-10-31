// drive/handling.js - arcade car physics ("Need for Speed, but simpler"): a point mass with a heading, a bicycle-model yaw rate that is limited by tyre grip (understeer at
// speed), a lateral-velocity grip that the handbrake releases (drifts), nitro (more acceleration + a higher top speed, a tank that refills slowly and faster while drifting),
// six gears for the tacho / engine note, two gas HOPS (tuning.hop: the Roadster's down-jets throw the car up; absent = no vertical dynamics at all, car.y is the road; hop v3: two keys, both launch on the very frame of the key DOWN:
// X = the simple hop, 1.86 m / 1.0 s; C = the barrel hop, 3.72 m / 1.4 s with a cosmetic 360 degree roll, see hopStep) and
// an optional thrust surge (tuning.nitroRamp), and collisions against the same solids that stop the pedestrian (core/physics.js: walls, trees, lamp posts, parked cars, the moving
// traffic) through an oriented rigid footprint with friction and angular impulses; the car also refuses terrain holes (escalator shafts), building footprints and the edge of the map.
// WATER IS REACHABLE (docs/AREAS.md 13.7): a river, canal or pond is terrain, not a wall. A car that leaves the road where nothing stands (a quay edge without a fence, a broken railing) FALLS (gravity, the touchdown
// costs damage by the fall speed through the usual 'hit' event), drives on the bed with a heavy water drag, and cannot climb out over a wall of more than RISE_MAX (a trench wall is a wall; the respawn key R is the way back).
// STUNTS (docs/AREAS.md 13.11): a car that leaves the surface (the tip of a raised bascule leaf, a ramp edge, a kerb drop) keeps its FULL VELOCITY VECTOR (the horizontal speed untouched, the vertical speed from the slope it left and
// from the surface's own motion) and flies on a gravity arc (FALL_G); the body attitude follows a small rigid-body model (the nose dips with the velocity direction, a roll from the steering at take-off); the touchdown
// resolves against whatever is under it at that instant (a static deck, a MOVING leaf through its deckY, the ground, the bed of the water) and costs damage from the speed INTO the surface and the pitch error. On the ground a slope
// steeper than 7 degrees pulls the car back along it (g sin cos), so a ramp needs speed or power: a leaf is a ramp up to 45 degrees (lib/bascule.js CAR_SLIP_DEG).
// Frame: yaw = rotY (0 faces +Z, positive turns toward +X); forward = (sin yaw, cos yaw), left = (cos yaw, -sin yaw). steer > 0 = left. Units: m, s.
import { SPEC as COUPE_SPEC } from './model.js';
import { createCarCollisions } from './collision.js';
import { HOOKS } from '../lib/area-tables.js';

const ACC = 15.5, BRAKE = 30, REV_ACC = 9, VMAX = 48, VREV = 9, NITRO_VMAX = 1.38, NITRO_ACC = 1.9;
const GEAR_TOP = [13, 22, 31, 40, 49, 62];            // m/s at the redline of gears 1..6
/** the red coupe's constants, in one table: createHandling(ctx, tuning) overrides any of them per car (drive/cars/tuning.js); no tuning = exactly these values */
export const COUPE_TUNING = { acc: ACC, brake: BRAKE, revAcc: REV_ACC, vmax: VMAX, vrev: VREV, nitroVmax: NITRO_VMAX, nitroAcc: NITRO_ACC, gearTop: GEAR_TOP, maxGear: 6,
  steerIn: 6.5, steerOut: 11, maxLat: 24, maxLatHand: 8, yawGrip: 24 * 1.05, steerLock: 0.55, handYaw: 0.55, handYawMax: 2.3, grip: 9, gripHand: 1.3, scrub: 0.10, handDecel: 6,
  drag: 0.0011, engBrake: 1.7, nitroDrain: 0.22, nitroRefill: 0.045, nitroDriftRefill: 0.10, pitchK: 0.0040, pitchMax: 0.05, rollK: 0.0030, rollMax: 0.06, bodyResp: 9,
  impactDecay: 4.5, hf: 2.1, hr: 2.1, hw: 0.95, smokeZ: 1.2, smokeY: 0.82, spec: null };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;
const FALL_G = 12;          // m/s2 of a car that has left the ground (the same gravity as the walker and the knock bodies)
const DROP_MAX = 0.45;      // m: a step down up to this (a kerb, a slab) is not a fall: the wheels follow the ground at once
const RISE_MAX = 0.55;      // m: ground that is higher than the car by more than this is a wall for a car on the ground (the wall of a trench seen from its bed)
const WATER_K = 2.1;        // 1/s: the velocity decay in deep water (full at WATER_DEEP m over the wheels); the 15.5 m/s2 engine then tops out around 28 km/h
const WATER_DEEP = 1.5;     // m
// the stunt physics (docs/AREAS.md 13.11); every number is in the exported STUNT table so that tools/bridge-jump-test.mjs and the docs read the same values
const SLOPE_ON = 0.12, SLOPE_FULL = 0.19;     // rad: gravity along the road acts from 7 degrees (full from 11): the humped decks (<= 5 degrees) drive as before, a raised leaf is a ramp
const HOLD_SLOPE = 25 * Math.PI / 180, HOLD_HAND = 45 * Math.PI / 180;      // a car AT REST holds up to 25 degrees (the handbrake up to 45: tan 1.0 = the tyre friction); steeper it rolls back
const CATCH = 0.85;           // m: a flying car is caught by a deck only when its wheels come within 0.35 m (the ground rule is 1.2 m: this lowers it to 0.35); lower it meets the face of the deck (the ramp item's girder, collision.js)
const AIR_KP = 2.4, AIR_KD = 1.7;             // 1/s2, 1/s: the nose follows the velocity direction (an aerodynamic weather vane + damper): natural 1.5 rad/s, damping ratio 0.55
const ROLL_KP = 6, ROLL_KD = 2.6, ROLL0 = 0.35;      // the roll spring / damper, and the roll rate (rad/s) a full steer gives at take-off at 20 m/s
const LIFT_ALPHA = 3.9;       // rad/s2: the nose-down angular acceleration while the rear axle is still on the edge: g cos(slope) a / (k^2 + a^2), a = half the wheelbase, k = 1.25 m
const PITCH_LIM = 1.3, LAND_PITCH_TOL = 0.15, LAND_PITCH_K = 10;      // rad; the landing pitch error (rad, beyond the tolerance) is worth LAND_PITCH_K m/s of impact speed
const G_EARTH = 9.81;
export const STUNT = { g: FALL_G, slopeOn: SLOPE_ON, slopeFull: SLOPE_FULL, holdDeg: 25, holdHandDeg: 45, catchTol: 1.2 - CATCH, airKp: AIR_KP, airKd: AIR_KD, rollKp: ROLL_KP, rollKd: ROLL_KD, roll0: ROLL0, liftAlpha: LIFT_ALPHA, landPitchTol: LAND_PITCH_TOL, landPitchK: LAND_PITCH_K, dropMax: DROP_MAX };
/**
 * The input of a car that is HELD while a panel or the area prompt is open (drive.js): nothing is steered, boosted or hopped, and the speed is taken away without ever reversing the car.
 * brk > 0 at a standstill (or below 0.8 m/s) accelerates BACKWARDS in step() and a throttle brakes a car that rolls backwards, so the hold follows the sign of the longitudinal speed vF:
 * rolling forward = full brake, rolling backwards = throttle, at rest = handbrake. Writes into `inp` and returns it.
 */
export function holdInput(inp, vF) {
  inp.thr = 0; inp.brk = 0; inp.steer = 0; inp.nitro = false; inp.hand = false; inp.jump = false; inp.flip = false;
  if (vF > 0.8) inp.brk = 1; else if (vF < -0.3) inp.thr = 1; else inp.hand = true;
  return inp;
}
/** the take-off speed and the tank cost of the simple hop (X) and of the barrel hop (C), tuning.hop: the APEX is v0^2 / 2g, 7.6 m/s = 1.86 m and 10.74 m/s = 3.72 m (twice) */
export const hopV0 = (H, flip) => (flip ? H.v0flip ?? H.v0 : H.v0);
export const hopCost = (H, flip) => (flip ? H.costFlip ?? H.cost : H.cost);
const _s = { y: -Infinity, kind: null, item: null };

export function createHandling(ctx, tuning = null) {
  const L = ctx.L, ph = ctx.physics;
  const T = tuning ? { ...COUPE_TUNING, ...tuning } : COUPE_TUNING, SPEC = T.spec || COUPE_SPEC, GEAR = T.gearTop;
  const collide = createCarCollisions(ph, SPEC);
  const KEEP_OUT = HOOKS.carKeepOut;      // the area's own closed ground (the Tauride Garden, T2): a plain (x, z) => boolean, absent for the strip
  const DS = HOOKS.deckServices || [];      // the area's own deck services (a podium, stairs): their deckY comes before the bridge decks (docs/AREAS.md section 9)
  const oldDeckY = (x, z, ref) => ctx.services.landmarksC?.bridge?.deckY?.(x, z, ref) ?? ctx.services.bridges?.deckY(x, z, ref) ?? null;
  const deckY = () => (DS.length ? (x, z, ref) => {
    for (let i = 0; i < DS.length; i++) { const d = ctx.services[DS[i]]?.deckY?.(x, z, ref); if (Number.isFinite(d)) return d; }
    return oldDeckY(x, z, ref);
  } : oldDeckY);
  const deck = deckY();
  /** the vertical speed of the deck surface under (x, z) (a moving bascule leaf: lib/bascule.js deckVy), 0 for a static deck / the ground */
  const deckVy = (x, z) => { for (let i = 0; i < DS.length; i++) { const sv = ctx.services[DS[i]]; if (sv && sv.deckVy && Number.isFinite(sv.deckY(x, z))) return sv.deckVy(x, z) || 0; } return 0; };

  /** the height a deck service gives a car at height ref at (x, z): d + 0.03 when a deck is there AND the car is on or above it (under a bridge the car is on the bed), else null */
  function deckAt(x, z, ref) {
    const d = deck ? deck(x, z, ref) : null;
    return d !== null && ref > d - 1.2 ? d + 0.03 : null;
  }
  /** road surface height at (x, z) for a car at height ref (default: its own): the humped Anichkov deck / the Troitsky leaf (for a car that is on or above it: under a bridge the car is on the bed; deckRef = the height the deck
   *  rule is asked with, a PLACEMENT passes the sky because a point of the plan is placed on the deck above it, whatever the height the car had before), a low (<= 0.3 m) pavement / kerb slab, a walkable floor over the
   *  bed of a trench (a pier deck, the lower landing of a quay descent: the floor the walker stands on, reached from above, never from the bed below it), the bed of a trench or a pond (the terrain below -0.2 m: water is
   *  terrain), else the asphalt (0.03) */
  function groundAt(x, z, ref = car.y, deckRef = ref) {
    const dk = deckAt(x, z, deckRef); if (dk !== null) return dk;
    const S = ph.surfaceAt(x, z, Math.min(ref, 0.5), false, _s), th = L.heightAt(x, z);
    if (S.kind === 'walk' && S.item && !S.item.sticky && S.y <= 0.3) {
      if (S.y > 0.03) return S.y;                                          // a kerb / pavement slab
      if (th < -0.2 && S.y > th + 0.05) return S.y + 0.03;                 // a floor over the trench: a pier deck, a landing
    }
    return th < -0.2 ? th + 0.03 : 0.03;
  }
  /** the surface y of the water at (x, z) (a waterway, a pond, a basin) or null */
  const waterY = (x, z) => { const w = ph.waterLevel ? ph.waterLevel(x, z) : null; return w !== null && w !== undefined ? w : (L.waterLevelAt ? L.waterLevelAt(x, z) : null); };
  /** terrain the car may not enter: an escalator shaft, a building footprint, the area's closed ground. NOT water, never a river (the world rule) */
  function solidBlocked(x, z) {
    if (KEEP_OUT && KEEP_OUT(x, z)) return true;
    if (ph.inHole(x, z, 0.2)) return true;
    return L.insideBuilding(x, z);
  }
  /** the terrain at (x, z) is a CLIFF for a car on the ground: more than RISE_MAX above its wheels (the wall of a trench seen from the bed); a deck is a floor, not a cliff */
  const cliff = (x, z) => !car.air && L.heightAt(x, z) - car.y > RISE_MAX && !(deck && deck(x, z) !== null);
  /** the car may not be here: outside the map (the play area is a union of rectangles, layout.js inPlay: the empty notches are outside the map too) or on forbidden terrain */
  function blocked(x, z) { return !L.inPlay(x, z) || solidBlocked(x, z); }
  // The map edge is a SOFT wall for the car (edgePush): the car's origin stays at least EDGE_M inside the play area, EDGE_M being the radius of its footprint, so no corner can ever
  // cross the edge whatever the heading. A hard footprint test froze the car as soon as steering turned a corner over the edge (a pose that is itself blocked refuses every move,
  // and a standing car cannot turn): it stuck at the edge all the time. Without L.clampToPlay (the unit-test stubs) the edge stays a hard test.
  const softEdge = typeof L.clampToPlay === 'function';
  const EDGE_M = Math.hypot(Math.max(T.hf, T.hr), T.hw) + 0.15;
  const footBlocked = softEdge ? solidBlocked : blocked;
  const FOOT = [[T.hf, T.hw], [T.hf, -T.hw], [-T.hr, T.hw], [-T.hr, -T.hw], [0, T.hw], [0, -T.hw], [T.hf, 0], [-T.hr, 0]];
  const carBlocked = (x, z, sy, cy) => {
    if (blocked(x, z) || cliff(x, z)) return true;
    for (const [a, b] of FOOT) { const px = x + sy * a + cy * b, pz = z + cy * a - sy * b; if (footBlocked(px, pz) || cliff(px, pz)) return true; }
    return false;
  };
  /** how many of the nine footprint points (centre + eight) are blocked: a car that is embedded (steered into a wall, nudged into a footprint) may move as long as that number does not grow */
  const blockedPoints = (x, z, sy, cy) => {
    let n = blocked(x, z) || cliff(x, z) ? 1 : 0;
    for (const [a, b] of FOOT) { const px = x + sy * a + cy * b, pz = z + cy * a - sy * b; if (footBlocked(px, pz) || cliff(px, pz)) n++; }
    return n;
  };
  /** how many of the nine footprint points are inside the area's keep-out (always 0 for the strip: no hook). The keep-out is a CLOSED ground, so unlike the other obstacles it has no embedded-escape rule: the
   *  count may never grow, whatever pushes the car (a solid's contact push in collide() carried a car over the outline, and once all nine points were inside the "not worse" rule let it roam: T2 fix round 2) */
  const keepPoints = (x, z, sy, cy) => {
    if (!KEEP_OUT) return 0;
    let n = KEEP_OUT(x, z) ? 1 : 0;
    for (const [a, b] of FOOT) if (KEEP_OUT(x + sy * a + cy * b, z + cy * a - sy * b)) n++;
    return n;
  };
  /** keep the origin EDGE_M inside the play area: the position slides to the nearest allowed point, the velocity loses its outward part (a 10 % bounce), the tangential part is kept (the car slides along
   *  the edge) and a nose that points into the edge is swung along it (a yaw torque, like the contact torque of a real hit; the grip model would otherwise scrub the whole sideways slide away) */
  function edgePush(h) {
    if (!softEdge) return;
    const p = L.clampToPlay(car.x, car.z, EDGE_M);
    if (p[0] === car.x && p[1] === car.z) return;
    let wx = car.x - p[0], wz = car.z - p[1]; const wl = Math.hypot(wx, wz);
    car.x = p[0]; car.z = p[1];
    if (!(wl > 1e-6)) return;
    wx /= wl; wz /= wl;
    const vn = car.vx * wx + car.vz * wz;
    if (vn > 0) { car.vx -= wx * vn * 1.1; car.vz -= wz * vn * 1.1; if (vn > 4) car.events.push({ type: 'hit', v: vn * 0.45 }); }
    const tx = car.vx - wx * (car.vx * wx + car.vz * wz), tz = car.vz - wz * (car.vx * wx + car.vz * wz), tl = Math.hypot(tx, tz);
    if (tl < 1.5 || !(h > 0)) return;                                   // (nearly) head-on or standing: the car just stops, the player reverses out
    const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
    if (fx * wx + fz * wz < 0.02 && vn <= 0) return;                    // the nose already points along or away from the edge
    const sg = fx * tx + fz * tz >= 0 ? 1 : -1, ux = sg * tx / tl, uz = sg * tz / tl;      // the way along the edge the car travels (nose or tail first)
    const d = Math.atan2(-(fx * uz - fz * ux), fx * ux + fz * uz);     // the yaw change that points the nose (or the tail) along it
    car.impactSpin += (clamp(3 * d, -2.2, 2.2) - car.impactSpin) * Math.min(1, 12 * h);
  }

  const car = {
    x: 0, z: 0, y: 0.03, yaw: 0, vx: 0, vz: 0, steer: 0, pitch: 0, roll: 0, spin: 0, wheelSpin: 0,
    speed: 0, vF: 0, vL: 0, gear: 1, rpm: 0.15, boost: 1, boosting: false, drifting: false, braking: false, aLong: 0, aLat: 0, odo: 0, steerAngle: 0, throttle: 0,
    impactSpin: 0,
    slope: 0, slopeOn: 0, pitchV: 0, rollV: 0, airT: 0,      // the road slope under the axles (rad, + = nose up) and the last slope with both axles on a surface; the pitch / roll rates of a flight; the flight time
    flight: { n: 0, x0: 0, z0: 0, y0: 0, vh0: 0, vy0: 0, t: 0, landV: 0, landErr: 0, landSlope: 0 },      // the last take-off and touchdown (tools read it)
    fall: false, vyF: 0, depth: 0,      // a fall off an edge (not the hop): falling, its speed, the metres of water over the wheels (0 on dry ground)
    h: 0, vy: 0, air: false, jet: 0, surge: 0,       // the gas hop (tuning.hop only): height above the road, climb speed, airborne, the down-jets 0..1; the thrust surge 0..1 (tuning.nitroRamp only)
    hopCd: 0, jetT: 0, jumpHeld: false, flipHeld: false, cushion: false, jetK: 1,   // hop v3: the cooldown, the down-jets' burn time, the X / C keys were down at the last step (an edge starts a hop), the landing cushion, the size of the down-jets (1 = simple, 1 + jetBig = barrel)
    flipOn: false, flip: 0, flipT: 0, flipDur: 1, flipDir: 1, flipDone: false, barrel: false, pulse0: 0, pulse1: 0,   // the barrel hop's roll (COSMETIC: the physics car stays upright): angle (rad, + = to the right), time, side-jet pulses 0..1 (left, right)
    pending: [],                      // events that a module hands in between two steps (they are moved to `events` at the start of the next step)
    events: [],                       // { type: 'hit', v } since the last step(); a hop adds { type: 'hop', flip }, { type: 'dry', flip } (a press the tank cannot pay), { type: 'cushion' } and { type: 'land', v, big } (drive.js takes them out before applyImpacts)
    carCenter: { x: 0, z: 0 },
    spec: SPEC, tuning: T, mass: SPEC.mass || 1350, smokeZ: T.smokeZ, smokeY: T.smokeY,
  };
  car.nitroLock = false;
  car.reset = (x, z, yaw) => {
    car.nitroLock = false; car.impactSpin = 0; car.events.length = 0;
    car.h = car.vy = car.jet = car.surge = car.hopCd = car.jetT = 0; car.air = car.jumpHeld = car.flipHeld = car.cushion = false;
    car.fall = false; car.vyF = car.depth = 0; car.y = 0.03; car.slope = car.slopeOn = car.pitchV = car.rollV = car.airT = 0;
    car.flipOn = car.flipDone = car.barrel = false; car.flip = car.flipT = car.pulse0 = car.pulse1 = 0; car.jetK = 1;
    car.x = x; car.z = z; car.yaw = yaw; car.vx = car.vz = 0; car.steer = 0; car.pitch = car.roll = 0; car.y = groundAt(x, z, 0.03, 1e9);      // (asked from the neutral height and the sky: a car that stood on a bed must not read a bridge deck as a ceiling, and a deck of any height is the floor of a point placed on it)
    car.speed = car.vF = car.vL = car.aLong = car.aLat = 0; car.gear = 1; car.rpm = 0.15; car.boosting = car.drifting = car.braking = false;
  };

  /** the car leaves the ground (the surface is lower than the wheels by more than a kerb: a quay edge, a ramp tip, a broken railing): the BALLISTIC phase begins with the velocity vector the car has: the horizontal speed is
   *  kept as it is, the vertical speed is the climb of the slope it left (forward speed x tan of the last slope under both axles) plus the motion of the surface itself (a rising leaf adds its lift: a real moving ramp), the
   *  body attitude starts at that slope and the nose goes down at the rate the rear axle's last contact gives (the lift-off torque: LIFT_ALPHA over the time the rear axle needs to pass the edge), with a roll from the steering */
  function launch(h) {
    const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw), vf = car.vx * sy + car.vz * cy, vh = Math.hypot(car.vx, car.vz), F = car.flight;
    const vy = clamp(vf * Math.tan(car.slopeOn) + deckVy(car.x, car.z), -40, 40);
    car.fall = true; car.vyF = vy; car.airT = 0;
    car.pitch = car.slopeOn; car.pitchV = -Math.min(0.9, LIFT_ALPHA * (SPEC.wb / 2) / Math.max(vh, 3)); car.rollV = -car.steer * ROLL0 * Math.min(1, vh / 20);
    F.n++; F.x0 = car.x - car.vx * h; F.z0 = car.z - car.vz * h; F.y0 = car.y; F.vh0 = vh; F.vy0 = vy; F.t = 0;      // (x0, z0: the position before the horizontal move of this very substep: t = 0 of the arc)
  }
  /** the attitude of a flying body for h seconds: the nose follows the direction of the velocity (a second order spring toward atan2(vy, vh)), the roll relaxes to level */
  function flightAttitude(h) {
    const vh = Math.hypot(car.vx, car.vz), tgt = Math.atan2(car.vyF, Math.max(vh, 2));
    car.pitchV += (AIR_KP * (tgt - car.pitch) - AIR_KD * car.pitchV) * h; car.pitch = clamp(car.pitch + car.pitchV * h, -PITCH_LIM, PITCH_LIM);
    car.rollV += (-ROLL_KP * car.roll - ROLL_KD * car.rollV) * h; car.roll = clamp(car.roll + car.rollV * h, -0.6, 0.6);
  }
  /** the touchdown on the surface g: the slope of the surface under the axles, the speed INTO it (relative to a moving deck), the tangential speed that stays (the car keeps rolling along the surface: no bounce), the damage
   *  from the impact speed plus the pitch error (a nose-first or tail-first landing hurts more than a flat one) through the usual 'hit' event */
  function land(g) {
    const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw), w = SPEC.wb / 2, F = car.flight;
    let yF = groundAt(car.x + sy * w, car.z + cy * w, g, g + 0.2), yR = groundAt(car.x - sy * w, car.z - cy * w, g, g + 0.2);
    const dm = deckAt(car.x, car.z, g + 0.2) !== null;      // (landing ON a deck: an axle that is on the deck too gives its slope, a raised leaf steps 0.6 m over the wheelbase at 25 degrees)
    if (Math.abs(yF - g) > DROP_MAX && !(dm && deckAt(car.x + sy * w, car.z + cy * w, g + 0.2) !== null)) yF = g;
    if (Math.abs(yR - g) > DROP_MAX && !(dm && deckAt(car.x - sy * w, car.z - cy * w, g + 0.2) !== null)) yR = g;
    const sg = clamp(Math.atan2(yF - yR, SPEC.wb), -1, 1), cs = Math.cos(sg), ss = Math.sin(sg), vf = car.vx * sy + car.vz * cy, vyRel = car.vyF - deckVy(car.x, car.z);
    const vn = Math.max(0, ss * vf - cs * vyRel), vT = cs * vf + ss * vyRel, nvf = vT * cs;
    car.vx += (nvf - vf) * sy; car.vz += (nvf - vf) * cy;
    const e = car.pitch - sg, err = Math.max(0, Math.abs(e) - LAND_PITCH_TOL), vh = Math.hypot(car.vx, car.vz), vEff = vn + LAND_PITCH_K * err * Math.min(1, vh / 12);
    F.t = car.airT; F.landV = vn; F.landErr = e; F.landSlope = sg;
    car.fall = false; car.vyF = 0; car.y = g; car.pitchV = car.rollV = 0;
    if (vn > 2.5) car.events.push({ type: 'land', v: vn, big: false });
    if (vEff > 5) {
      const rear = e > LAND_PITCH_TOL;
      car.events.push({ type: 'hit', v: (vEff - 4.2) * 1.6, x: car.x, z: car.z, nx: rear ? sy : -sy, nz: rear ? cy : -cy, localX: 0, localZ: rear ? SPEC.rear : SPEC.front, localNX: 0, localNZ: rear ? 1 : -1 });
    }
    car.pitch -= Math.min(0.2, 0.02 * vn);
  }
  /** the car on the ground, or FLYING (see launch). Gravity FALL_G, the attitude, then the touchdown (land). A flying car is caught by a deck only within 0.35 m under its surface (CATCH): lower, the car meets the face
   *  of the deck and the solids (collision.js) decide. Returns car.y. */
  function settle(h) {
    const g = car.fall ? groundAt(car.x, car.z, car.y, car.y - CATCH) : groundAt(car.x, car.z);
    if (!car.fall) {
      if (car.y - g <= DROP_MAX) return g;
      launch(h);
    }
    car.vyF -= FALL_G * h; car.y += car.vyF * h; car.airT += h; flightAttitude(h);
    if (car.y > g) return car.y;
    land(g);
    return g;
  }
  /** the airborne part of a substep: gravity, the landing cushion (the down-jets fire again just above the road), the touchdown; returns car.y (an absolute height: a kerb or a deck under the car can catch it) */
  function fly(h) {
    const H = T.hop, g = groundAt(car.x, car.z);
    car.vy -= H.g * h;
    // the landing cushion fires the jets earlier for a faster sink (they brake 40 m/s2 down to 1.8 m/s, net 24.5 against gravity; the trigger height is the stopping distance + 0.2 m: 0.6 m for a small drop, 1.3 m after the simple hop, 2.5 m after the barrel hop)
    if (!car.cushion && car.y - g < Math.max(0.6, (car.vy * car.vy - 3.2) / 48 + 0.2) && car.vy < -3 && car.boost > 0.05) { car.cushion = true; car.events.push({ type: 'cushion' }); }
    if (car.cushion && car.vy < -1.8 && car.boost > 0.01) {
      const v = Math.min(-1.8, car.vy + 40 * h); car.boost = Math.max(0, car.boost - 0.004 * (v - car.vy)); car.vy = v; car.jetT = Math.max(car.jetT, 0.25);
    }
    car.y += car.vy * h;
    if (car.vy < 0 && car.y <= g) {
      const v = -car.vy;
      car.y = g; car.h = 0; car.vy = 0; car.air = false; car.cushion = false; car.hopCd = H.cooldown;
      car.pitch -= Math.min(0.045, 0.006 * v);                                   // the nose dips on touchdown and the body springs back (step() eases the pitch)
      car.events.push({ type: 'land', v, big: car.barrel });
      car.flipOn = car.barrel = false; car.flip = 0; car.pulse0 = car.pulse1 = 0; car.jetK = 1;      // an early landing ends the roll at once: exactly level
    } else car.h = car.y - g;
    return car.y;
  }
  /** once per step: the two hop keys (hop v3). X (inp.jump) = the simple hop, C (inp.flip) = the barrel hop. Each is an EDGE (a key that is down already does nothing, so auto-repeat and a held key never retrigger; drive.js latches a press shorter than
   *  one frame) and the hop launches on the very step of the key DOWN: no charge, no buffer. The car must be on the road (!air) with the cooldown over; X needs the tank at minTank and pays cost, C needs minTankFlip and pays costFlip (a short
   *  tank = no hop at all, never a half hop: a 'dry' event for the HUD). Both keys in one step: the barrel hop wins when the tank can pay it. */
  function hopStep(dt, inp) {
    const H = T.hop, jump = !!inp.jump, flip = !!inp.flip, dnX = jump && !car.jumpHeld, dnC = flip && !car.flipHeld;
    car.jumpHeld = jump; car.flipHeld = flip;
    car.hopCd = Math.max(0, car.hopCd - dt); car.jetT = Math.max(0, car.jetT - dt);
    if ((dnX || dnC) && !car.air && car.hopCd <= 0) {
      if (dnC && car.boost >= (H.minTankFlip ?? H.minTank)) hopLaunch(true, inp.steer || 0);
      else if (dnX && car.boost >= H.minTank) hopLaunch(false, inp.steer || 0);
      else car.events.push({ type: 'dry', flip: dnC });
    }
    if (car.flipOn) {                                                                                             // the barrel roll of the barrel hop: a smoothstep 0 -> 360 degrees, finished at flip.frac of the expected airtime
      car.flipT += dt; const u = Math.min(1, car.flipT / car.flipDur), P = H.flip.pulseT ?? 0.36;
      car.flip = car.flipDir * TAU * u * u * (3 - 2 * u);
      const w = clamp(car.flipT / 0.08, 0, 1) * clamp((car.flipDur - car.flipT) / 0.12, 0, 1), s = Math.sin(Math.PI * car.flipT / P);   // the side jets alternate: left / right pulses of period P that sum to 1, faded in and out
      car.pulse0 = w * s * s; car.pulse1 = w * (1 - s * s);
      if (u >= 1 && !car.flipDone) { car.flipDone = true; car.jetT = Math.max(car.jetT, 0.3); }                   // the down-jets fire again before the touchdown
    }
    car.jet = Math.min(1, car.jetT / 0.25);
  }
  /** launch the simple hop (flip = false) or the barrel hop (flip = true): the climb speed, the tank cost, the down-jets, the nose flick toward the steering and, for the barrel hop, the cosmetic roll */
  function hopLaunch(flip, steerIn) {
    const H = T.hop, v0 = hopV0(H, flip);
    car.air = true; car.vy = v0; car.h = 0; car.cushion = false; car.boost = Math.max(0, car.boost - hopCost(H, flip)); car.jetT = flip ? 0.8 : 0.55; car.jetK = flip ? 1 + (H.jetBig ?? 0) : 1;
    car.barrel = flip && !!H.flip;
    car.flipOn = car.barrel; car.flipDone = false; car.flipT = 0; car.flip = 0; car.pulse0 = car.pulse1 = 0;
    if (car.barrel) { car.flipDir = steerIn > 0.3 ? -1 : 1; car.flipDur = (H.flip.frac ?? 0.85) * 2 * v0 / H.g; }   // the held steering picks the side (left = to the left), else to the right
    car.events.push({ type: 'hop', flip: car.barrel });
    if (Math.abs(car.steer) > 0.3) car.impactSpin += (H.flick ?? 2.4) * car.steer / (1 + Math.hypot(car.vx, car.vz) / 20);    // the front lateral jets flick the nose toward the steering (about 30 degrees standing, less at speed: the car keeps its line)
  }

  function sub(h, inp) {
    let sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
    let vF = car.vx * sy + car.vz * cy;
    const vF0 = vF, sp = Math.abs(vF), aloft = car.air || car.fall;      // aloft: no drive, no brakes, no grip, little steering (the gas hop, a launch from a ramp, a fall)
    // ---- steering input (a little slower to turn in than to return)
    const tgt = clamp(inp.steer, -1, 1) * (vF > -0.3 ? 1 : vF < -1.2 ? -1 : 1 - 2 * (-0.3 - vF) / 0.9);       // in reverse the left / right keys are swapped (A swings the nose left when backing up, the way the player expects)
    car.steer += (tgt - car.steer) * Math.min(1, (Math.abs(tgt) > Math.abs(car.steer) ? T.steerIn : T.steerOut) * h);
    // ---- longitudinal
    const thr = clamp(inp.thr, 0, 1), brk = clamp(inp.brk, 0, 1);
    // an empty tank locks the nitro until the key is released: otherwise the refill switched it on and off every frame while Shift stayed down (the flames blinked)
    if (car.boost <= 0.005) car.nitroLock = true; else if (!inp.nitro) car.nitroLock = false;
    const boosting = !!inp.nitro && !car.nitroLock && thr > 0.05 && vF > -1 && !aloft;
    // the thrust builds over nitroRamp seconds (the valve lag of the cold-gas nozzles) instead of switching on; no nitroRamp = the full push at once
    if (T.nitroRamp) car.surge = boosting ? car.surge + (1 - car.surge) * Math.min(1, h / T.nitroRamp) : 0;
    const vmax = T.vmax * (boosting ? T.nitroVmax : 1);
    let a = 0;
    if (thr > 0 && vF > -0.3) { a = T.acc * thr * Math.max(0, 1 - Math.pow(Math.max(vF, 0) / vmax, 1.7)) * (boosting ? (T.nitroRamp ? 1 + (T.nitroAcc - 1) * car.surge : T.nitroAcc) : 1); if (vF > vmax) a = -8; }
    else if (thr > 0) a = T.brake * 0.8 * thr;                                  // throttle while rolling backwards: brake first
    if (brk > 0) { if (vF > 0.8) a -= T.brake * brk; else a -= T.revAcc * brk * clamp(1 + vF / T.vrev, 0, 1); }
    if (!thr && !brk) a -= Math.sign(vF) * (T.engBrake + T.drag * vF * vF);   // engine braking + air drag
    else a -= Math.sign(vF) * T.drag * vF * vF;
    if (inp.hand) a -= Math.sign(vF) * T.handDecel;
    if (aloft) a = car.fall && !car.air ? 0 : -Math.sign(vF) * T.drag * vF * vF;                             // airborne: no drive, no brakes, no handbrake, only the air drag
    else {
      // gravity along a steep road (a raised bascule leaf, docs/AREAS.md 13.11): the car loses g sin(slope) cos(slope) of horizontal speed climbing it and gains it going down; a car at rest holds (the handbrake holds more)
      const as = Math.abs(car.slope);
      if (as > SLOPE_ON && !(sp < 0.6 && !thr && !brk && as < (inp.hand ? HOLD_HAND : HOLD_SLOPE))) a -= G_EARTH * Math.sin(car.slope) * Math.cos(car.slope) * Math.min(1, (as - SLOPE_ON) / (SLOPE_FULL - SLOPE_ON));
    }
    let nvF = vF + a * h;
    if (!thr && !brk && !inp.hand && vF * nvF < 0) nvF = 0;
    if (inp.hand && vF * nvF < 0 && !brk && !thr) nvF = 0;
    // ---- yaw rate: the bicycle model at low speed, limited by the tyre grip at high speed; the handbrake lets the tail come round
    const sgn = vF >= 0 ? 1 : -1, sa = Math.max(sp, 0.001);
    const maxLat = inp.hand ? T.maxLatHand : T.maxLat;
    let om;
    if (inp.hand && sp > 6) om = car.steer * Math.min(sp * T.handYaw, T.handYawMax) * sgn;
    else { const low = sa * Math.tan(T.steerLock * car.steer) / SPEC.wb, grip = car.steer * T.yawGrip / Math.max(sa, 4) * sgn; om = Math.abs(low) < Math.abs(grip) ? low : grip; }
    if (aloft) om *= car.air ? T.hop.airSteer : 0.15;                                           // the tyres do not bite: the jets only nudge the nose
    car.steerAngle = 0.5 * car.steer * clamp(1 - sp / 70, 0.25, 1);
    car.impactSpin *= Math.exp(-(inp.hand ? 1.8 : T.impactDecay) * h);
    const yaw0 = car.yaw, sy0 = sy, cy0 = cy;
    car.yaw += (om + car.impactSpin) * h; sy = Math.sin(car.yaw); cy = Math.cos(car.yaw);
    // a rotation may not swing a corner of the footprint into a wall, a building or the river (the car turns about its middle: steering at an obstacle used to put the body in it, and a car
    // standing in a blocked pose refuses every move): the turn is refused like a contact, the spin dies. A car that is blocked already may turn freely (it needs to get out).
    if (carBlocked(car.x, car.z, sy, cy) && !carBlocked(car.x, car.z, sy0, cy0)) { car.yaw = yaw0; sy = sy0; cy = cy0; car.impactSpin *= 0.3; }
    // ---- grip: the velocity follows the heading; what the tyres cannot hold slides (drift)
    let vf = car.vx * sy + car.vz * cy, vl = car.vx * cy - car.vz * sy;
    vf += nvF - vF;                                                              // the longitudinal change of this step
    const gr = aloft ? 0 : inp.hand ? T.gripHand : T.grip, cap = maxLat * h;      // airborne: no grip, the sideways speed is kept and nothing scrubs
    const dv = clamp(-vl * (1 - Math.exp(-gr * h)), -cap, cap);
    vl += dv;
    vf -= Math.sign(vf) * Math.abs(dv) * T.scrub;                                  // sliding scrubs speed
    // water over the wheels (the car stands on the bed of a trench or a pond): a heavy drag, deeper = more
    car.depth = 0;
    if (!car.air && !car.fall) { const w = waterY(car.x, car.z); if (w !== null) { const dp = w - car.y; if (dp > 0.2) { car.depth = dp; const k = Math.exp(-WATER_K * Math.min(1, dp / WATER_DEEP) * h); vf *= k; vl *= k; } } }
    car.vx = sy * vf + cy * vl; car.vz = cy * vf - sy * vl;
    car.vF = vf; car.vL = vl; car.aLong = (nvF - vF0) / h * 0.5 + car.aLong * 0.5; car.aLat = om * vf;
    car.braking = !aloft && ((brk > 0.1 && vF0 > 0.8) || !!inp.hand && sp > 3);
    car.boosting = boosting;
    car.throttle = thr;
    // ---- tank
    if (boosting) car.boost = Math.max(0, car.boost - T.nitroDrain * h);
    else car.boost = Math.min(1, car.boost + (T.nitroRefill + (Math.abs(vl) > 2.2 && sp > 9 && !car.air ? T.nitroDriftRefill : 0)) * h);
    // ---- move: terrain refusals first (axis by axis, so the car slides along the river wall), then the solids
    let nx = car.x + car.vx * h, nz = car.z + car.vz * h;
    if (carBlocked(nx, nz, sy, cy)) {
      // a pose that is blocked already (the steering swung a corner into a wall, the river, a footprint) must be able to get out: any move that does not make it worse is allowed
      const here = blockedPoints(car.x, car.z, sy, cy), keepHere = keepPoints(car.x, car.z, sy, cy);
      const ok = (x, z) => (here > 0 ? blockedPoints(x, z, sy, cy) <= here : !carBlocked(x, z, sy, cy)) && (!KEEP_OUT || keepPoints(x, z, sy, cy) <= keepHere);
      if (ok(nx, nz)) { /* the move is allowed: it frees the car or keeps it where it was */ }
      else if (ok(nx, car.z)) { nz = car.z; car.vz *= 0.5; }
      else if (ok(car.x, nz)) { nx = car.x; car.vx *= 0.5; }
      else { nx = car.x; nz = car.z; const v = Math.hypot(car.vx, car.vz); if (v > 3) car.events.push({ type: 'hit', v: v * 0.6 }); car.vx *= -0.2; car.vz *= -0.2; }
    }
    car.x = nx; car.z = nz;
    edgePush(h);
    car.y = car.air ? fly(h) : settle(h);
    const kx = car.x, kz = car.z;
    if (car.air && T.hop.clearMax !== undefined && car.h > T.hop.clearMax) { const yAir = car.y; car.y = yAir - car.h + T.hop.clearMax; collide(car); car.y = yAir; }     // the solids see the car no higher than clearMax over the road: a barrel hop clears the low furniture, never a bus shelter or a kiosk
    else collide(car);
    // a contact push may not carry the car (a bus shelter between the lane and the fence pushed it sideways) over the line of a closed ground: the push is undone, the impulse stays
    if (KEEP_OUT && (car.x !== kx || car.z !== kz) && keepPoints(car.x, car.z, sy, cy) > keepPoints(kx, kz, sy, cy)) { car.x = kx; car.z = kz; }
    edgePush(h);
    car.odo += Math.hypot(car.vx, car.vz) * h;
    car.spin += (car.vx * sy + car.vz * cy) * h / SPEC.R;
  }

  /** advance dt seconds with inp = { thr, brk, steer, hand, nitro } (0..1, -1..1, booleans) */
  car.step = (dt, inp) => {
    car.events.length = 0; car.spin = 0;
    if (car.pending.length) { for (let i = 0; i < car.pending.length; i++) car.events.push(car.pending[i]); car.pending.length = 0; }      // (the blows that a module dealt between two steps, e.g. a car that ran into the foot of a leaf too steep to climb: lib/bascule.js stepCar)
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    // Traffic updates before drive; refresh its current nearby boxes instead of
    // using the previous rendered frame's collider poses.
    ph.refreshDynamic();
    dt = Math.min(dt, 0.1);
    const v = Math.hypot(car.vx, car.vz), n = clamp(Math.max(Math.ceil(dt * 120), Math.ceil((v + Math.abs(car.impactSpin) * 2.4) * dt / 0.18)), 1, 80), h = dt / n;
    if (T.hop) hopStep(dt, inp);
    for (let i = 0; i < n; i++) sub(h, inp);
    // ---- ride height + attitude: the axles follow the road (humped deck), body pitch / roll from the accelerations
    const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw), w = SPEC.wb / 2;
    const g0 = groundAt(car.x, car.z);
    const dRef = car.y + 1.4;      // (the axle probes see a deck up to 2.6 m above the wheels: a leaf raised by 45 degrees rises 1.8 m over a wheelbase, docs/AREAS.md 13.11)
    let yF = groundAt(car.x + sy * w, car.z + cy * w, car.y, dRef), yR = groundAt(car.x - sy * w, car.z - cy * w, car.y, dRef);
    // an axle over an edge (a quay, a trench wall) does not tilt the car: it holds on its middle until it falls; a DECK under both the axle and the middle is no edge (a leaf raised by 25 degrees steps 0.6 m over the wheelbase)
    const onDeck = (x, z) => deckAt(x, z, dRef) !== null, dm = deckAt(car.x, car.z, car.y) !== null;
    let edge = false;
    if (Math.abs(yF - g0) > DROP_MAX && !(dm && onDeck(car.x + sy * w, car.z + cy * w))) { yF = g0; edge = true; }
    if (Math.abs(yR - g0) > DROP_MAX && !(dm && onDeck(car.x - sy * w, car.z - cy * w))) { yR = g0; edge = true; }
    const yT = (yF + yR) / 2, slope = Math.atan2(yF - yR, SPEC.wb);
    if (!car.air && !car.fall) { car.slope = slope; if (!edge) car.slopeOn = slope; }      // (slopeOn = the last slope with both axles on a surface: what a take-off from the tip of a ramp takes along)
    const k = Math.min(1, 16 * dt);
    if (!car.air && !car.fall) {                                                               // (airborne, car.y is the flight itself: only the road part of the height is eased)
      car.y += (yT - car.y) * k;
      if (Math.abs(car.y - yT) > 0.6) car.y = yT;
    }
    const pt = slope + clamp(car.aLong * T.pitchK, -T.pitchMax, T.pitchMax), rt = clamp(car.aLat * T.rollK, -T.rollMax, T.rollMax);
    if (!car.fall) { car.pitch += (pt - car.pitch) * Math.min(1, T.bodyResp * dt); car.roll += (rt - car.roll) * Math.min(1, T.bodyResp * dt); }      // (a flight integrates its own attitude: flightAttitude)
    // ---- derived: speed, gear, rpm
    const vf = car.vx * sy + car.vz * cy; car.vL = car.vx * cy - car.vz * sy; car.vF = vf; car.speed = Math.abs(vf) * 3.6;
    const sp = Math.abs(vf);
    let g = car.gear;
    if (vf < -0.5) g = 0;                                                         // 0 = reverse
    else {
      if (g === 0) g = 1;
      while (g < T.maxGear && sp > GEAR[g - 1] * 0.94) g++;
      while (g > 1 && sp < GEAR[g - 2] * 0.58) g--;
    }
    car.gear = g;
    const top = g === 0 ? 9 : GEAR[g - 1], lo = g <= 1 ? 0 : GEAR[g - 2] * 0.55;
    const rt2 = clamp(0.2 + 0.8 * (sp - lo) / Math.max(1, top - lo), 0.14, 1.02) + 0.08 * car.throttle;
    car.rpm += (clamp(rt2, 0.12, 1.05) - car.rpm) * Math.min(1, 12 * dt);
    car.drifting = Math.abs(car.vL) > 2.4 && sp > 8;
    car.carCenter.x = car.x + sy * SPEC.centerZ; car.carCenter.z = car.z + cy * SPEC.centerZ;
  };
  car.groundAt = groundAt; car.blocked = blocked;
  return car;
}
