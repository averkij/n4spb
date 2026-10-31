// drive/boat/handling.js - the arcade physics of the MOTOR BOAT (docs/AREAS.md "The motor boat"): the first water transport. It has the interface of drive/handling.js (the same state fields and the same
// car.step(dt, input), reset, groundAt, blocked, events, carCenter, collisionSpec) so that drive.js, the HUD, the camera, the sound and the hand-off treat it like a car; what differs is the model of motion:
//   * it FLOATS: the height is the water surface (core/physics.js waterLevel(x, z), THE hook of docs/AREAS.md 13.7) and the boat may only be where the water is: a cell without water (waterLevel null) is the shore.
//     The shore is a SOFT stop (the move is refused axis by axis, the boat slides along the bank and loses its speed; no teleport, no damage); a boat that is embedded in the shore already may move out.
//   * thrust from an outboard motor (needs speed or throttle to turn: the rudder bites on the flow), strong inertia, a weak keel: the sideways speed dies in about half a second, so the boat slides in a turn;
//     the hull drag is linear (it coasts a long way), S brakes hard and then reverses slowly, Space is the emergency stop.
//   * it collides like a car through drive/collision.js (the same solids, the knock system included): the quay walls, the piers, the abutments, a fallen bench. The collision height `hgt` is only the hull
//     (0.7 m over the water: the gunwale is 0.55-0.62 m amidships): a bridge whose deck is 0.7 m + 0.5 m of slab over the water (docs/water-transport-bridges.md) passes over it. Hits make a thump and a scrape, never damage.
// Frame: the same as the car: yaw = rotY (0 faces +Z, positive turns toward +X = the boat's LEFT), forward = (sin yaw, cos yaw), left = (cos yaw, -sin yaw). Units m, s. steer > 0 = left.
import { createCarCollisions } from '../collision.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** the boat's footprint and weight: W beam, len length, front / rear the bow tip and the transom from the origin (the middle of the hull), hgt the collision height over the water, eye = the helmsman's eye (the cockpit view) */
export const SPEC_BOAT = {
  name: 'motorboat', W: 1.9, len: 5.6, front: 3.0, rear: -2.6, centerZ: 0.2, hgt: 0.7, wb: 3.4, R: 0.3,
  mass: 850, durability: 4, eye: { x: 0.32, y: 1.16, z: -0.2 }, fovRest: 74, exhaust: [],
};

/** the boat's constants in one table (every number the feel depends on); tools/boat-test.mjs reads the same values */
export const BOAT_TUNING = {
  acc: 6.2, vmax: 17.5, brake: 7.5, revAcc: 2.8, vrev: 4.5,       // m/s2 of the motor at rest, the speed it pulls toward (at full throttle drag settles it near 46 km/h), the water brake, the reverse push and its top speed
  dragLin: 0.20, handDecel: 5.5,                                   // 1/s of the linear hull drag (coasting: speed e-folds in 5 s), the extra deceleration of the emergency stop
  steerIn: 3.4, steerOut: 5.5, yawRate: 1.05, yawMin: 0.55, yawInertia: 2.3, yawSpeedLoss: 0.40,   // the wheel (1/s), the yaw rate at full lock (rad/s), the flow the rudder needs, the inertia of the turn, the loss of turning rate at top speed
  shoal: 0.35, shoalDrag: 1.6, shoreMargin: 0.4,                   // the shallows: look-ahead (m per m/s) along the line of travel and the extra drag (1/s) when dry land lies there; the boat stops this far from the bank
  grip: 1.7, gripHand: 0.7, scrub: 0.04,                          // the keel: 1/s the sideways speed decays (slides in a turn), the handbrake lets go, the speed lost per metre slid
  pitchK: 0.0060, pitchMax: 0.10, rollK: 0.0090, rollMax: 0.16, trim: 0.045, bodyResp: 4.5, impactDecay: 3.5,
  hf: 3.0, hr: 2.55, hw: 0.95,                                      // the footprint probes: bow, transom, half beam (water must lie under all of them)
  smokeZ: 0, smokeY: 0, spec: SPEC_BOAT, hop: null,
};

export function createBoatHandling(ctx, tuning = null) {
  const L = ctx.L, ph = ctx.physics;
  const T = tuning ? { ...BOAT_TUNING, ...tuning } : BOAT_TUNING, SPEC = T.spec || SPEC_BOAT;
  const collide = createCarCollisions(ph, SPEC);
  /** the surface y of the water at (x, z) (a waterway, a pond, a basin) or null: the one hook (core/physics.js waterLevel) */
  const waterY = (x, z) => ph.waterLevel ? ph.waterLevel(x,z) : (L.waterLevelAt ? L.waterLevelAt(x,z) : null);
  /** terrain a boat cannot be on although there is water: a building footprint (a vault over a canal), a hole */
  const solidBlocked = (x, z) => ph.inHole(x, z, 0.2) || L.insideBuilding(x, z);
  /** the shore: no water under the point (or a solid footprint) */
  const dry = (x, z) => waterY(x, z) === null || solidBlocked(x, z);
  const blocked = (x, z) => !L.inPlay(x, z) || dry(x, z);
  /** the pose of a walker beside the boat may be on the water bed or on a bank, so for him only buildings, holes and the map edge count */
  const walkerBlocked = (x, z) => !L.inPlay(x, z) || solidBlocked(x, z);
  const softEdge = typeof L.clampToPlay === 'function';
  const EDGE_M = Math.hypot(Math.max(T.hf, T.hr), T.hw) + 0.15;
  // the probes of the hull: bow, shoulders, sides amidships, quarters and transom (the bow is pointed, the stern square), each SHORE_M outside the hull: the boat stops that far from the bank, so the quay
  // railings and parapets (which stand a hand's breadth beyond the water edge) are never touched by a boat that merely runs aground
  const SHORE_M = T.shoreMargin ?? 0.4, hf = T.hf + SHORE_M, hr = T.hr + SHORE_M, hw = T.hw + SHORE_M;
  const FOOT = [[hf, 0], [hf * 0.7, hw * 0.45], [hf * 0.7, -hw * 0.45], [hf * 0.2, hw], [hf * 0.2, -hw], [-hr * 0.5, hw], [-hr * 0.5, -hw], [-hr, hw * 0.9], [-hr, -hw * 0.9], [-hr, 0]];
  const shoreHit = (x, z, sy, cy) => {
    if (dry(x, z)) return true;
    for (const [a, b] of FOOT) { const px = x + sy * a + cy * b, pz = z + cy * a - sy * b; if (softEdge ? dry(px, pz) : blocked(px, pz)) return true; }
    return false;
  };
  const shoreCount = (x, z, sy, cy) => {
    let n = dry(x, z) ? 1 : 0;
    for (const [a, b] of FOOT) { const px = x + sy * a + cy * b, pz = z + cy * a - sy * b; if (softEdge ? dry(px, pz) : blocked(px, pz)) n++; }
    return n;
  };
  /** keep the origin EDGE_M inside the play area: a slide along the edge, the outward part of the speed is lost (the same soft wall as the car) */
  function edgePush() {
    if (!softEdge) return;
    const p = L.clampToPlay(car.x, car.z, EDGE_M);
    if (p[0] === car.x && p[1] === car.z) return;
    let wx = car.x - p[0], wz = car.z - p[1]; const wl = Math.hypot(wx, wz);
    car.x = p[0]; car.z = p[1];
    if (!(wl > 1e-6)) return;
    wx /= wl; wz /= wl;
    const vn = car.vx * wx + car.vz * wz;
    if (vn > 0) { car.vx -= wx * vn * 1.1; car.vz -= wz * vn * 1.1; if (vn > 3) car.events.push({ type: 'scrape', v: vn * 0.5 }); }
  }

  const car = {
    kind: 'boat', floats: true,
    x: 0, z: 0, y: 0, yaw: 0, vx: 0, vz: 0, steer: 0, pitch: 0, roll: 0, spin: 0, omega: 0,
    speed: 0, vF: 0, vL: 0, gear: 1, rpm: 0.15, boost: 1, boosting: false, drifting: false, braking: false, aLong: 0, aLat: 0, odo: 0, steerAngle: 0, throttle: 0, thrS: 0,
    impactSpin: 0, slope: 0, depth: 0, fall: false, vyF: 0,
    h: 0, vy: 0, air: false, jet: 0, surge: 0, jumpHeld: false, flipHeld: false, flip: 0, jetK: 1, pulse0: 0, pulse1: 0,       // (the fields of the car that the shared code reads: a boat never leaves the water)
    pending: [], events: [], carCenter: { x: 0, z: 0 },
    damage: 0, damageStage: 0, damageSmoke: 0, collisionSpec: null,
    spec: SPEC, tuning: T, mass: SPEC.mass || 850, smokeZ: 0, smokeY: 0,
    wl: null,       // the water level under the boat now (null = none)
  };
  car.reset = (x, z, yaw) => {
    car.impactSpin = 0; car.omega = 0; car.events.length = 0; car.pending.length = 0;
    car.x = x; car.z = z; car.yaw = yaw; car.vx = car.vz = 0; car.steer = 0; car.pitch = car.roll = 0; car.thrS = 0;
    const w = waterY(x, z); car.wl = w; car.y = w !== null ? w : 0;
    car.speed = car.vF = car.vL = car.aLong = car.aLat = 0; car.gear = 1; car.rpm = 0.15; car.boosting = car.drifting = car.braking = false; car.throttle = 0;
    car.carCenter.x = x + Math.sin(yaw) * SPEC.centerZ; car.carCenter.z = z + Math.cos(yaw) * SPEC.centerZ;
  };

  function sub(h, inp) {
    let sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
    const vF = car.vx * sy + car.vz * cy, sp = Math.abs(vF);
    // ---- the wheel (slower to turn in than to return); backing up swaps the keys like the car
    const tgt = clamp(inp.steer, -1, 1) * (vF > -0.3 ? 1 : vF < -1.2 ? -1 : 1 - 2 * (-0.3 - vF) / 0.9);
    car.steer += (tgt - car.steer) * Math.min(1, (Math.abs(tgt) > Math.abs(car.steer) ? T.steerIn : T.steerOut) * h);
    // ---- the motor: a thrust that fades toward vmax, the brake of the water, a slow reverse; the hull drag
    const thr = clamp(inp.thr, 0, 1), brk = clamp(inp.brk, 0, 1);
    car.thrS += (thr - car.thrS) * Math.min(1, 3 * h);      // the motor spools up
    let a = 0;
    if (thr > 0 && vF > -0.3) a = T.acc * car.thrS * Math.max(0, 1 - Math.pow(Math.max(vF, 0) / T.vmax, 2));
    else if (thr > 0) a = T.brake * 0.8 * thr;
    if (brk > 0) { if (vF > 0.8) a -= T.brake * brk; else a -= T.revAcc * brk * clamp(1 + vF / T.vrev, 0, 1); }
    a -= vF * T.dragLin;
    if (inp.hand) a -= Math.sign(vF) * T.handDecel;
    let nvF = vF + a * h;
    if (!thr && !brk && vF * nvF < 0) nvF = 0;
    if (inp.hand && vF * nvF < 0 && !brk && !thr) nvF = 0;
    // ---- the turn: the rudder needs flow (speed) or thrust; the rate fades a little at top speed; it has inertia
    const flow = Math.max(Math.min(1, sp / 4.5), thr * T.yawMin), sgn = vF >= 0 ? 1 : -1;
    const want = car.steer * T.yawRate * flow * (1 - T.yawSpeedLoss * Math.min(1, sp / T.vmax)) * sgn;
    car.omega += (want - car.omega) * Math.min(1, T.yawInertia * h);
    car.steerAngle = 0.5 * car.steer;
    car.impactSpin *= Math.exp(-(inp.hand ? 1.2 : T.impactDecay) * h);
    const yaw0 = car.yaw, sy0 = sy, cy0 = cy;
    car.yaw += (car.omega + car.impactSpin) * h; sy = Math.sin(car.yaw); cy = Math.cos(car.yaw);
    // a turn may not swing the hull onto the shore (it is refused like a contact); a boat that is aground already may turn freely (it needs to get out)
    if (shoreHit(car.x, car.z, sy, cy) && !shoreHit(car.x, car.z, sy0, cy0)) { car.yaw = yaw0; sy = sy0; cy = cy0; car.omega *= 0.4; car.impactSpin *= 0.3; }
    // ---- the keel: the velocity follows the heading, the sideways part dies out (a slide in a turn)
    let vf = car.vx * sy + car.vz * cy, vl = car.vx * cy - car.vz * sy;
    vf += nvF - vF;
    const gr = inp.hand ? T.gripHand : T.grip, dv = -vl * (1 - Math.exp(-gr * h));
    vl += dv;
    vf -= Math.sign(vf) * Math.abs(dv) * T.scrub;
    car.vx = sy * vf + cy * vl; car.vz = cy * vf - sy * vl;
    // the shallows: dry land lies in the line of travel within a few metres (more at speed): the bottom comes up and the water drags the boat down before the bank itself stops it
    const hs = Math.hypot(car.vx, car.vz);
    if (hs > 2.5 && dry(car.x + car.vx / hs * (hf + 1.5 + T.shoal * hs), car.z + car.vz / hs * (hf + 1.5 + T.shoal * hs))) { const k = Math.exp(-T.shoalDrag * h); car.vx *= k; car.vz *= k; }
    car.aLong = (nvF - vF) / h * 0.5 + car.aLong * 0.5; car.aLat = car.omega * vf;
    car.braking = (brk > 0.1 && vF > 0.8) || (!!inp.hand && sp > 3);
    car.throttle = thr;
    // ---- move: the shore refuses the move axis by axis (the boat slides along the bank), then the solids
    let nx = car.x + car.vx * h, nz = car.z + car.vz * h;
    if (shoreHit(nx, nz, sy, cy)) {
      const here = shoreCount(car.x, car.z, sy, cy);
      const ok = (x, z) => (here > 0 ? shoreCount(x, z, sy, cy) <= here : !shoreHit(x, z, sy, cy));
      if (ok(nx, nz)) { /* aground already and the move does not make it worse */ }
      else if (ok(nx, car.z)) { nz = car.z; car.vz *= 0.5; }
      else if (ok(car.x, nz)) { nx = car.x; car.vx *= 0.5; }
      else { nx = car.x; nz = car.z; const v = Math.hypot(car.vx, car.vz); if (v > 2) car.events.push({ type: 'scrape', v: v * 0.5 }); car.vx *= -0.1; car.vz *= -0.1; }
      // the bank scrapes the speed off: a boat that is pushed against it loses what it has
      car.vx *= Math.exp(-2.5 * h); car.vz *= Math.exp(-2.5 * h);
    }
    car.x = nx; car.z = nz;
    edgePush();
    const kx = car.x, kz = car.z;
    collide(car);
    // a contact push may not carry the hull onto the shore (a pier between the boat and the bank pushes it sideways): the push is undone, the impulse stays
    if ((car.x !== kx || car.z !== kz) && shoreCount(car.x, car.z, sy, cy) > shoreCount(kx, kz, sy, cy)) { car.x = kx; car.z = kz; }
    edgePush();
    car.odo += Math.hypot(car.vx, car.vz) * h;
  }

  /** advance dt seconds with inp = { thr, brk, steer, hand } */
  car.step = (dt, inp) => {
    car.events.length = 0; car.spin = 0;
    if (car.pending.length) { for (let i = 0; i < car.pending.length; i++) car.events.push(car.pending[i]); car.pending.length = 0; }
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    ph.refreshDynamic();
    dt = Math.min(dt, 0.1);
    const v = Math.hypot(car.vx, car.vz), n = clamp(Math.max(Math.ceil(dt * 120), Math.ceil((v + Math.abs(car.impactSpin) * 2.4) * dt / 0.18)), 1, 80), h = dt / n;
    for (let i = 0; i < n; i++) sub(h, inp);
    // ---- on the water: the height is the surface (eased over a change of level where two waterways meet), the body trims and heels
    const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
    const w = waterY(car.x, car.z); car.wl = w;
    if (w !== null) { if (Math.abs(w - car.y) > 1.5) car.y = w; else car.y += (w - car.y) * Math.min(1, 10 * dt); }
    car.depth = w !== null ? Math.max(0, w - L.heightAt(car.x, car.z)) : 0;
    const vf = car.vx * sy + car.vz * cy; car.vL = car.vx * cy - car.vz * sy; car.vF = vf; car.speed = Math.abs(vf) * 3.6;
    const sp = Math.abs(vf);
    // the bow lifts under power (the planing trim, most at a quarter of the top speed), squats at the start and dips when the motor is cut
    const planing = T.trim * Math.min(1, sp / (T.vmax * 0.35)) * (vf > 0 ? 1 : 0.3);
    const pt = planing + clamp(car.aLong * T.pitchK, -T.pitchMax, T.pitchMax), rt = -clamp(car.aLat * T.rollK, -T.rollMax, T.rollMax);       // (a boat heels INTO the turn)
    car.pitch += (pt - car.pitch) * Math.min(1, T.bodyResp * dt); car.roll += (rt - car.roll) * Math.min(1, T.bodyResp * dt);
    car.gear = vf < -0.5 ? 0 : 1;
    const rt2 = 0.18 + 0.50 * car.thrS + 0.32 * Math.min(1, sp / T.vmax);
    car.rpm += (clamp(rt2, 0.12, 1.02) - car.rpm) * Math.min(1, 10 * dt);
    car.drifting = false; car.boosting = false;
    car.carCenter.x = car.x + sy * SPEC.centerZ; car.carCenter.z = car.z + cy * SPEC.centerZ;
  };
  car.groundAt = (x, z) => { const w = waterY(x, z); return w !== null ? w : L.heightAt(x, z); };
  car.blocked = blocked;
  car.walkerBlocked = walkerBlocked;
  car.waterY = waterY;
  return car;
}
