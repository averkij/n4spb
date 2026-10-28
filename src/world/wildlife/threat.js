// wildlife/threat.js - what the WATER birds run from: the vehicle the player drives (the motor boat of drive/boat/, or a car), read from ctx.drive every frame.
// The walker is the other source and stays in birds.js (W.player = ctx.player.position, which FOLLOWS the car while driving, so a car already scares the pigeons / crows / gulls through
// the smoothed player speed there; that path is untouched). A vehicle needs more than a radius: a boat doing 17 m/s covers 50 m in three seconds, so a bird must go before the hull is
// near, and only when the hull is coming at it:
//   * the NEAR ring:   d < near + hull + 0.35 v      (a drifting boat 8 m away; a fast one 14 m away, whichever way it points)
//   * the HEADING cone: the bird lies ahead of the hull, along < hull + near + look v (look = 3 s for a boat, 1.5 s for a car, at most 70 m) and its distance from the line of travel
//     is < wide + 0.2 along (a boat passing 30 m off at 3 m/s never meets either test; a fast one aimed at the bird does from 60 m).
// Everything is read off one shared object per frame (update), the tests allocate nothing.
const LOOK_MAX = 70;

/** @returns {{ active, kind, x, y, z, vx, vz, speed, hull, update(), scares(x, z, y, near) }} */
export function makeThreat(ctx) {
  const T = { active: false, kind: '', x: 0, y: 0, z: 0, vx: 0, vz: 0, speed: 0, hull: 2.5, look: 3, wide: 6 };
  /** read the active vehicle (call once a frame, before the birds update) */
  T.update = () => {
    const d = ctx.drive, c = d && d.active ? d.car : null;
    if (!c || !Number.isFinite(c.x + c.z)) { T.active = false; T.speed = 0; return; }
    const v = d.vehicle, sp = v && v.spec;
    T.active = true; T.kind = (v && v.kind === 'boat') || c.floats ? 'boat' : 'car';
    T.x = c.x; T.y = c.y || 0; T.z = c.z; T.vx = c.vx || 0; T.vz = c.vz || 0; T.speed = Math.hypot(T.vx, T.vz);
    T.hull = sp && sp.front ? sp.front : 2.5;
    T.look = T.kind === 'boat' ? 3 : 1.5; T.wide = T.kind === 'boat' ? 6 : 3;
  };
  /** would a bird at (x, z) at height y be flushed by the vehicle; `near` = the bird's own shyness in metres (ducks 7, gulls 4) */
  T.scares = (x, z, y, near) => {
    if (!T.active || Math.abs(T.y - y) > 6) return false;
    const dx = x - T.x, dz = z - T.z, s = T.speed, rn = near + T.hull + 0.35 * s;
    if (dx * dx + dz * dz < rn * rn) return true;
    if (s < 1.5) return false;
    const along = (dx * T.vx + dz * T.vz) / s;
    if (along <= 0 || along > Math.min(LOOK_MAX, T.hull + near + T.look * s)) return false;
    const lat = Math.abs(dx * T.vz - dz * T.vx) / s;
    return lat < T.wide + 0.2 * along;
  };
  return T;
}

/** a threat that is never there (callers that build the birds without the wildlife.js wiring: the old harnesses) */
export const NO_THREAT = { active: false, speed: 0, update() {}, scares: () => false };
