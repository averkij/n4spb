// Driving-only rigid footprint contacts. The walking solver stays unchanged.
// Broad phase uses the shared spatial grid; narrow phase is OBB/OBB SAT or
// OBB/cylinder. Impulses include contact leverage, relative velocity and friction.
import { STEP_HEIGHT } from '../../core/physics.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** How much of a bridge deck a FLOATING hull treats as solid below the deck surface (m). The decks of the bridges module are walk ramps registered with thick 2.5 (a car or a walker below must not be caught
 *  by the deck of a road above it): for a boat that would put the underside 2.5 m under the street, 0.5 m over the water of the Moika and under its hull, so every canal bridge was a wall. The slab of a stone bridge
 *  is 0.5 m at the springing: a hull passes under a deck whose surface is at least this much plus its own height over the water (docs/water-transport-bridges.md). */
export const HULL_DECK_SLAB = 0.5;

export function carContact(car, spec, b, out = {}) {
  const s = Math.sin(car.yaw), c = Math.cos(car.yaw);
  const cx = car.x + s * spec.centerZ, cz = car.z + c * spec.centerZ;
  const hw = spec.W / 2 + 0.06, hd = spec.len / 2 + 0.06;
  if (b.type === 'hole') return null;
  if (b.boatPass && car.floats) return null;      // a walker's floor over the water (the steppable quay stair, its landings and the pontoon deck, environment/quay.js): a floating boat is not stopped by it
  let top = b.y1;
  if (b.type === 'walk') top = b.top;
  if (b.type === 'ramp') {
    const z = clamp((cx - b.cx) * b.s + (cz - b.cz) * b.c, -b.hd, b.hd);
    top = b.yA + (b.yB - b.yA) * (z / (2 * b.hd) + 0.5);
    if (top - (car.floats ? Math.min(b.thick, HULL_DECK_SLAB) : b.thick) >= car.y + spec.hgt) return null;
  }
  if (top <= car.y + STEP_HEIGHT || b.y0 >= car.y + spec.hgt) return null;
  const dx = cx - b.cx, dz = cz - b.cz;
  let nx, nz, depth, px, pz;
  if (b.type === 'cyl') {
    const x = -dx * c + dz * s, z = -dx * s - dz * c;
    let qx = clamp(x, -hw, hw), qz = clamp(z, -hd, hd);
    let ax = qx - x, az = qz - z, d = Math.hypot(ax, az);
    if (d >= b.r) return null;
    if (d > 1e-8) { ax /= d; az /= d; depth = b.r - d; }
    else if (hw - Math.abs(x) < hd - Math.abs(z)) {
      ax = -(Math.sign(x) || 1); az = 0; depth = hw - Math.abs(x) + b.r; qx = -ax * hw;
    } else { ax = 0; az = -(Math.sign(z) || 1); depth = hd - Math.abs(z) + b.r; qz = -az * hd; }
    nx = ax * c + az * s; nz = -ax * s + az * c;
    px = cx + qx * c + qz * s; pz = cz - qx * s + qz * c;
  } else {
    depth = Infinity;
    // Four separating axes, evaluated without per-contact arrays.
    for (let i = 0; i < 4; i++) {
      const ax = i === 0 ? c : i === 1 ? s : i === 2 ? b.c : b.s;
      const az = i === 0 ? -s : i === 1 ? c : i === 2 ? -b.s : b.c;
      const ra = hw * Math.abs(ax * c - az * s) + hd * Math.abs(ax * s + az * c);
      const rb = b.hw * Math.abs(ax * b.c - az * b.s) + b.hd * Math.abs(ax * b.s + az * b.c);
      const distance = dx * ax + dz * az, pen = ra + rb - Math.abs(distance);
      if (pen <= 0) return null;
      if (pen < depth) { depth = pen; const sign = Math.sign(distance) || 1; nx = ax * sign; nz = az * sign; }
    }
    // Support point on the car; a flat face uses the obstacle's projected centre
    // clamped to the face so centred bumper hits do not invent a spin.
    const ln = nx * c - nz * s, fn = nx * s + nz * c;
    const qx = Math.abs(ln) < 1e-6 ? clamp(-dx * c + dz * s, -hw, hw) : -Math.sign(ln) * hw;
    const qz = Math.abs(fn) < 1e-6 ? clamp(-dx * s - dz * c, -hd, hd) : -Math.sign(fn) * hd;
    px = cx + qx * c + qz * s; pz = cz - qx * s + qz * c;
  }
  Object.assign(out, { nx, nz, depth, x: px, z: pz });
  return out;
}

export function createCarCollisions(physics, spec) {
  const contact = {}, inertia = (spec.W ** 2 + spec.len ** 2) / 12, mass = spec.mass || 1350, massK = mass / 1350;     // the coupe's 1350 kg is the unit of source.invMassRatio (traffic/impact.js)
  const radius = Math.hypot(spec.W, spec.len) / 2 + Math.abs(spec.centerZ) + 0.4;
  return (car) => {
    // One spatial query per substep, reused through position/velocity iterations.
    const nearby = physics.querySolids(car.x, car.z, radius);
    for (let iteration = 0; iteration < 5; iteration++) {
      let touched = false;
      for (const b of nearby) {
        if (b.source?.record?.wreckBody && b.source !== b.source.record.wreckSource) continue;
        const q = carContact(car, car.collisionSpec || spec, b, contact); if (!q) continue;
        touched = true;
        const { nx, nz, x, z } = q, rx = x - car.x, rz = z - car.z;
        car.x += nx * (q.depth + 0.0001); car.z += nz * (q.depth + 0.0001);
        const source = b.source;
        const trx = x - (source?.cx ?? b.cx), trz = z - (source?.cz ?? b.cz);
        const invMass = (source?.invMassRatio || 0) * massK, targetInertia = source?.inertia || 1;
        const ovx = (source?.vx || 0) + (source?.spin || 0) * trz, ovz = (source?.vz || 0) - (source?.spin || 0) * trx;
        let vx = car.vx + car.impactSpin * rz - ovx;
        let vz = car.vz - car.impactSpin * rx - ovz;
        const vn = vx * nx + vz * nz;
        if (vn >= 0) continue;
        const lever = rz * nx - rx * nz;
        const targetLever = trz * nx - trx * nz;
        const impulse = -(1 + (-vn > 2 ? 0.12 : 0)) * vn / (1 + lever * lever / inertia + invMass * (1 + targetLever ** 2 / targetInertia));
        car.vx += impulse * nx; car.vz += impulse * nz;
        car.impactSpin += lever * impulse / inertia;
        const tx = -nz, tz = nx, tangentLever = rz * tx - rx * tz;
        vx = car.vx + car.impactSpin * rz - ovx; vz = car.vz - car.impactSpin * rx - ovz;
        const targetTangent = trz * tx - trx * tz;
        const friction = clamp(-(vx * tx + vz * tz) / (1 + tangentLever ** 2 / inertia + invMass * (1 + targetTangent ** 2 / targetInertia)), -impulse * 0.25, impulse * 0.25);
        car.vx += friction * tx; car.vz += friction * tz;
        car.impactSpin += tangentLever * friction / inertia;
        source?.applyCarImpulse?.(-mass * (impulse * nx + friction * tx), -mass * (impulse * nz + friction * tz), x, z);
        if (-vn > 0.4) {
          const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
          const ev = { type: -vn > 2.2 ? 'hit' : 'scrape', v: -vn, x, z, nx, nz,
            localX: rx * cy - rz * sy, localZ: rx * sy + rz * cy,
            localNX: nx * cy - nz * sy, localNZ: nx * sy + nz * cy };
          // At most one event per obstacle per frame, keeping the hardest contact.
          const previous = car.events.find(e => e.obstacle === b);
          if (!previous) {
            car.events.push({ ...ev, obstacle: b });
            source?.onCarHit?.(-vn, { x, z, nx, nz });
          }
          else if (ev.v > previous.v) Object.assign(previous, ev);
        }
      }
      if (!touched) break;
    }
  };
}
