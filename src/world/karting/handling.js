const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const G = 9.81;
const FRONT_SHARE = .42;

function kerbContacts(car, step, tuning, sy, cy) {
  const at = tuning.kerbAt;
  if (!at) return null;
  let front = 0, rear = 0, kick = 0, lift = 0, roll = 0;
  const { wb, track } = tuning.spec;
  for (const axle of [-1, 1]) {
    for (const side of [-1, 1]) {
      const along = axle * wb / 2, across = side * track / 2;
      const x = car.x + sy * along + cy * across, z = car.z + cy * along - sy * across;
      const vx = car.vx + car.tyreYaw * (cy * along - sy * across);
      const vz = car.vz - car.tyreYaw * (sy * along + cy * across);
      const patch = at(x, z) ?? at(x + vx * step * .5, z + vz * step * .5);
      if (!patch) continue;
      if (axle > 0) front++;
      else rear++;
      const climb = patch.gx * vx + patch.gz * vz;
      if (climb <= 0) continue;
      // A leading wheel climbing the kerb is pushed away from the rise.
      // The resulting yaw depends on which axle takes the hit first.
      const acrossSlope = patch.gx * cy - patch.gz * sy;
      kick -= acrossSlope * clamp(climb, 0, 5) * along * 7;
      if (climb > 2.1) {
        const launch = clamp((climb - 2.1) * .52, 0, 2.25);
        if (launch > lift) { lift = launch; roll = side * launch; }
      }
    }
  }
  if (kick) car.impactSpin += clamp(kick * step, -.25, .25);
  if (lift > .40) {
    car.fall = true;
    car.vyF = lift;
    car.y += .025;
    car.airT = 0;
    car.pitchV = 0;
    car.flight.n++;
    car.flight.x0 = car.x;
    car.flight.z0 = car.z;
    car.flight.y0 = car.y;
    car.flight.vh0 = Math.hypot(car.vx, car.vz);
    car.flight.vy0 = lift;
    car.flight.t = 0;
    car.rollV = roll;
  }
  return front || rear ? { front, rear } : null;
}

export function kartTyres(car, longitudinal, step, tuning, handbrake) {
  const wheelbase = tuning.spec.wb;
  const rearArm = wheelbase * FRONT_SHARE;
  const frontArm = wheelbase - rearArm;
  const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
  const forward = car.vx * sy + car.vz * cy;
  const lateral = car.vx * cy - car.vz * sy;
  const travel = Math.max(2.2, Math.abs(forward));
  const targetLoad = clamp(FRONT_SHARE - longitudinal * .26 / (G * wheelbase), .20, .73);
  const loadRate = targetLoad > car.frontLoad ? 22 : 17;
  car.frontLoad += (targetLoad - car.frontLoad) * (1 - Math.exp(-loadRate * step));

  const steerDemand = car.steer * tuning.steerLock;
  const steerRange = .11 + 12 / (12 + forward * forward);
  const steer = steerRange * Math.tanh(steerDemand / steerRange);
  const frontSlip = Math.atan2(lateral + car.tyreYaw * frontArm, travel) - steer * Math.sign(forward);
  const rearSlip = Math.atan2(lateral - car.tyreYaw * rearArm, travel);

  const contacts = kerbContacts(car, step, tuning, sy, cy);
  const frontExtra = .10 * (contacts?.front ?? 0), rearExtra = .10 * (contacts?.rear ?? 0);
  const rearLimit = tuning.rearMu * G * (1 - car.frontLoad) * (1 + rearExtra);
  // Aerodynamic drag acts on the chassis. Engine and brake torque both go
  // through the solid rear axle and consume its available cornering force.
  const rearDrive = Math.abs(longitudinal + Math.sign(forward) * tuning.drag * forward ** 2);
  const rearPeak = Math.sqrt(Math.max(.04 * rearLimit ** 2, rearLimit ** 2 - rearDrive ** 2));
  const rear = -rearPeak * (handbrake ? .5 : 1) * Math.tanh(rearSlip * 12 * rearLimit / rearPeak);
  const frontLimit = tuning.frontMu * G * car.frontLoad * (1 + frontExtra);
  const onBrake = clamp((car.frontLoad - FRONT_SHARE) * 10, 0, 1);
  const balancedFront = Math.min(frontLimit, rearPeak * rearArm / frontArm * .92);
  const frontPeak = frontLimit + onBrake * (balancedFront - frontLimit);
  const front = -frontPeak * Math.tanh(frontSlip * 10);

  const cornering = front + rear;
  const lateralLimit = 1.2 * G * (1 + (frontExtra + rearExtra) / 2);
  const scale = Math.min(1, lateralLimit / Math.max(1, Math.abs(cornering)));
  const turn = car.tyreYaw + scale * (front * frontArm - rear * rearArm) / .26 * step;
  car.tyreYaw = clamp(turn, -3.6, 3.6);
  return {
    yawRate: car.tyreYaw,
    lateral: cornering * scale,
    drag: Math.abs(front * frontSlip + rear * rearSlip) * .13,
    steer,
  };
}
