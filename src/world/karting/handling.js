const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const G = 9.81;
const FRONT_SHARE = .42;

function wheelContacts(car, step, tuning, sy, cy) {
  const at = tuning.kerbAt;
  const roughnessAt = tuning.roughnessAt;
  if (!at && !roughnessAt) return null;
  let front = 0, rear = 0, roughFront = 0, roughRear = 0, kick = 0, lift = 0, roll = 0;
  const { wb, track } = tuning.spec;
  for (const axle of [-1, 1]) {
    for (const side of [-1, 1]) {
      const along = axle * wb / 2, across = side * track / 2;
      const x = car.x + sy * along + cy * across, z = car.z + cy * along - sy * across;
      const vx = car.vx + car.tyreYaw * (cy * along - sy * across);
      const vz = car.vz - car.tyreYaw * (sy * along + cy * across);
      const patch = at?.(x, z) ?? at?.(x + vx * step * .5, z + vz * step * .5);
      if (!patch) {
        const roughness = roughnessAt?.(x, z) ?? 0;
        if (axle > 0) roughFront += roughness;
        else roughRear += roughness;
        continue;
      }
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
  return { front, rear, roughFront, roughRear };
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
  const limitedSteer = steerRange * Math.tanh(steerDemand / steerRange);
  const frontMotion = Math.atan2(lateral + car.tyreYaw * frontArm, travel);
  const rearSlip = Math.atan2(lateral - car.tyreYaw * rearArm, travel);
  // The keyboard comfort limit must not prevent the front wheels pointing
  // into an existing slide. Restore their mechanical range for countersteer;
  // all correction still comes from tyre forces, not an injected yaw impulse.
  const direction = Math.sign(forward);
  const catching = steerDemand * direction * frontMotion > 0 && steerDemand * car.tyreYaw * direction < 0;
  const countersteer = catching ? clamp((Math.abs(rearSlip) - .025) / .10, 0, 1) : 0;
  const steer = limitedSteer + countersteer * (steerDemand - limitedSteer);
  const frontSlip = frontMotion - steer * direction;

  const contacts = wheelContacts(car, step, tuning, sy, cy);
  const frontExtra = .10 * (contacts?.front ?? 0), rearExtra = .10 * (contacts?.rear ?? 0);
  const frontRough = (contacts?.roughFront ?? 0) * .5, rearRough = (contacts?.roughRear ?? 0) * .5;
  const rearLimit = tuning.rearMu * G * (1 - car.frontLoad) * (1 + rearExtra - .25 * rearRough);
  // Aerodynamic drag acts on the chassis. Engine and brake torque both go
  // through the solid rear axle and consume its available cornering force.
  const rearDrive = Math.abs(longitudinal + Math.sign(forward) * tuning.drag * forward ** 2);
  const rearCapacity = Math.sqrt(Math.max(.04 * rearLimit ** 2, rearLimit ** 2 - rearDrive ** 2));
  // At pit/corner-exit speeds use a near-kinematic small-slip response.
  // Load transfer still changes peak grip, but a gas tap must not collapse
  // steering stiffness on a lightly loaded tyre. Blend to the load-sensitive
  // response from 32.4 to 54 km/h.
  const stiffnessScale = Math.min(1, travel / 6);
  const lowSpeed = 1 - clamp((Math.abs(forward) - 9) / 6, 0, 1);
  const rearLowStiffness = tuning.rearMu * G * (1 - FRONT_SHARE) * 36 * stiffnessScale;
  const rearStiffness = rearLimit * 12 + lowSpeed * (rearLowStiffness - rearLimit * 12);
  // Rear unloading and combined brake/cornering demand cause the breakaway.
  // Do not accumulate a separate grip penalty merely for holding the gas.
  const rearPeak = rearCapacity;
  const rear = -rearPeak * (handbrake ? .5 : 1) * Math.tanh(rearSlip * rearStiffness / rearPeak);
  const frontLimit = tuning.frontMu * G * car.frontLoad * (1 + frontExtra - .25 * frontRough);
  const brake = clamp((-longitudinal * Math.sign(forward) - .9) / 1.5, 0, 1);
  // Rear braking may rotate the kart even if turn-in follows straight braking.
  // After release a centred wheel must again be able to settle the tail.
  const frontPeak = Math.min(frontLimit, rearCapacity * rearArm / frontArm * (.92 + .12 * brake));
  const frontLowStiffness = tuning.frontMu * G * FRONT_SHARE * 30 * stiffnessScale;
  const frontStiffness = frontPeak * 10 + lowSpeed * (frontLowStiffness - frontPeak * 10);
  const front = -frontPeak * Math.tanh(frontSlip * frontStiffness / frontPeak);

  const cornering = front + rear;
  const lateralLimit = 1.2 * G * (1 + (frontExtra + rearExtra) / 2);
  const scale = Math.min(1, lateralLimit / Math.max(1, Math.abs(cornering)));
  const turn = car.tyreYaw + scale * (front * frontArm - rear * rearArm) / .26 * step;
  car.tyreYaw = clamp(turn, -3.6, 3.6);
  // Without suspension, repeated tyre impacts on rough ground dissipate
  // more energy as speed rises. Each wheel contributes independently.
  const speed = Math.hypot(forward, lateral);
  const roughDrag = (frontRough + rearRough) * .5 * speed * (.13 + .014 * speed);
  return {
    yawRate: car.tyreYaw,
    lateral: cornering * scale,
    drag: Math.abs(front * frontSlip + rear * rearSlip) * .13 + roughDrag,
    steer,
  };
}
