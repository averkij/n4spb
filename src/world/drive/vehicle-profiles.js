// Gameplay profiles for the traffic fleet. These are deliberately per archetype,
// not claims about a particular manufacturer's trim or a fitted real vehicle.
// The same mass/strength feeds AI collisions, struck-car bodies and player control.
const car = (mass, acc, vmax, brake, grip, durability = 1, steerLock = .53) =>
  ({ mass, acc, vmax, brake, grip, durability, steerLock, rollBrake: 4.1, lateralGrip: 8.6, spinBrake: 3.5 });
export const TRAFFIC_PHYSICS = {
  sedan: car(1400, 10.2, 42, 25, 8.8),
  lada: car(1220, 9.0, 38, 22, 7.4, .90, .57),
  ladasw: car(1350, 8.4, 37, 22, 7.6, .94, .55),
  cross_c: car(1620, 10.0, 42, 25, 8.2, 1.04),
  cross_s: car(1480, 9.3, 40, 24, 8.0, 1.02),
  cross_m: car(1750, 10.4, 43, 25, 8.3, 1.10, .51),
  suv: car(2250, 9.4, 42, 24, 7.8, 1.24, .49),
  liftback: car(1570, 11.2, 45, 27, 9.1, 1.04),
  prem: car(1820, 13.0, 48, 29, 9.5, 1.14, .51),
  hatch: car(1180, 10.6, 39, 25, 9.0, .92, .60),
  mpv: car(2160, 8.5, 39, 23, 7.8, 1.16, .48),
  van: car(2850, 7.0, 34, 20, 7.0, 1.20, .47),
  truck: car(4850, 5.5, 30, 17, 6.4, 1.38, .43),
  minibus: car(3900, 6.3, 32, 18, 6.8, 1.24, .45),
  bus: car(11500, 4.2, 25, 15, 6.0, 1.65, .43),
  midi: car(8200, 4.8, 27, 16, 6.3, 1.50, .46),
  artic: car(18000, 3.5, 23, 14, 5.8, 1.80, .40),
  artic_f: car(10500, 3.5, 23, 14, 5.8, 1.80, .40),
  artic_r: car(7500, 3.5, 23, 14, 5.8, 1.80, .40),
  trolley: car(12400, 4.5, 25, 16, 6.0, 1.65, .43),
  trolley2: car(12000, 4.6, 25, 16, 6.1, 1.62, .43),
  dd: car(14200, 3.7, 24, 15, 5.7, 1.75, .42),
  coach: car(13400, 4.8, 31, 17, 6.5, 1.70, .42),
  tram: car(30000, 3.0, 24, 12, 6.0, 2.0, 0),
};

export function trafficPhysics(kind, spec = {}) {
  const base = TRAFFIC_PHYSICS[kind || spec.kind] || TRAFFIC_PHYSICS[spec.bus ? 'bus' : spec.len > 5.3 ? 'van' : 'sedan'];
  return { ...base, mass: spec.mass || base.mass, durability: spec.durability || base.durability,
    rollBrake: spec.rollBrake ?? base.rollBrake, lateralGrip: spec.lateralGrip ?? base.lateralGrip, spinBrake: spec.spinBrake ?? base.spinBrake };
}

/** Normalized geometry + physical properties for both the impact and drive APIs. */
export function trafficSpec(kind, geometry) {
  const profile = trafficPhysics(kind, geometry), W = geometry.W ?? geometry.wid;
  return { ...geometry, ...profile, kind, W, wid: W, centerZ: (geometry.front + geometry.rear) / 2,
    R: geometry.R || (geometry.bus ? .48 : geometry.hgt > 2.1 ? .40 : geometry.hgt > 1.6 ? .34 : .31) };
}

/** createHandling(ctx, trafficTuning(kind, archetype)); returned spec is complete. */
export function trafficTuning(kind, geometry) {
  const spec = trafficSpec(kind, geometry), p = trafficPhysics(kind, spec), heavy = p.mass > 3000;
  return { spec, acc: p.acc, vmax: p.vmax, brake: p.brake, grip: p.grip, revAcc: heavy ? 4 : 6, vrev: heavy ? 6 : 8,
    steerLock: p.steerLock, steerIn: heavy ? 4.0 : 6.5, steerOut: heavy ? 7 : 10,
    maxLat: heavy ? 14 : 20, yawGrip: heavy ? 16 : 22, gripHand: heavy ? 1.8 : 1.2,
    handYaw: heavy ? .36 : .52, handYawMax: heavy ? 1.4 : 2.1,
    engBrake: heavy ? 2.2 : 1.9, scrub: .16, impactDecay: heavy ? 6 : 5,
    rollK: heavy ? .005 : .0035, rollMax: heavy ? .08 : .065,
    hf: spec.front - .02, hr: -spec.rear + .08, hw: spec.W / 2 + .04,
    smokeZ: spec.front - .9, smokeY: spec.hgt * .63,
    gearTop: [p.vmax * .25, p.vmax * .43, p.vmax * .61, p.vmax * .81, p.vmax * 1.1, p.vmax * 1.25], maxGear: 5,
    nitroVmax: 1.15, nitroAcc: 1.3 };
}

const reduce = (v, amount) => Math.sign(v) * Math.max(0, Math.abs(v) - amount);
/** Explicit tyre traction for planar struck-car bodies. A Y-locked chassis has
 * no normal load at its road proxy, so Rapier contact friction alone cannot stop
 * its sideways motion. No snap of position or momentum at the instant of impact. */
export function wreckTraction(vx, vz, spin, yaw, dt, profile, depth = 0) {
  const s = Math.sin(yaw), c = Math.cos(yaw), wet = Math.min(1, Math.max(0, depth) / 1.5);
  const grip = 1 - wet * .55;
  let forward = reduce(vx * s + vz * c, profile.rollBrake * grip * dt);
  let lateral = reduce(vx * c - vz * s, profile.lateralGrip * grip * dt);
  const drag = Math.exp(-(wet * 2.1 + .08) * dt); forward *= drag; lateral *= drag;
  spin = reduce(spin * Math.exp(-profile.spinBrake * dt), .12 * dt);
  return { vx: forward * s + lateral * c, vz: forward * c - lateral * s, spin };
}
