const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const G = 9.81;

// Accelerations per unit kart mass. The rear axle carries the engine and
// most of the driver's weight. Braking acts predominantly at the rear.
export function kartTyres(car, longitudinal, step, tuning, handbrake) {
  const wheelbase = tuning.spec.wb;
  const frontShare = .42;
  const rearArm = wheelbase * frontShare;
  const frontArm = wheelbase - rearArm;
  const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw);
  const forward = car.vx * sy + car.vz * cy;
  const lateral = car.vx * cy - car.vz * sy;
  const travel = Math.max(2.2, Math.abs(forward));
  const targetLoad = clamp(frontShare - longitudinal * .26 / (G * wheelbase), .20, .73);
  car.frontLoad += (targetLoad - car.frontLoad) * (1 - Math.exp(-22 * step));

  // Slip angles at the two axles, including the speed from chassis rotation.
  const steer = car.steer * tuning.steerLock;
  const frontSlip = Math.atan2(lateral + car.tyreYaw * frontArm, travel) - steer * Math.sign(forward);
  const rearSlip = Math.atan2(lateral - car.tyreYaw * rearArm, travel);
  const frontLimit = tuning.frontMu * G * car.frontLoad;
  const rearLimit = tuning.rearMu * G * (1 - car.frontLoad);
  const rearDrive = Math.abs(longitudinal) * (longitudinal < 0 ? .80 : 1);
  const rearCornering = Math.sqrt(Math.max(.13, 1 - (rearDrive / rearLimit) ** 2));
  const front = -frontLimit * Math.tanh(frontSlip * 10);
  const rear = -rearLimit * rearCornering * (handbrake ? .5 : 1) * Math.tanh(rearSlip * 10);
  const turn = car.tyreYaw + (front * frontArm - rear * rearArm) / .26 * step;
  car.tyreYaw = clamp(turn, -3.6, 3.6);
  return {
    yawRate: car.tyreYaw,
    lateral: front + rear,
    drag: Math.abs(front * frontSlip + rear * rearSlip) * .13,
    steer,
  };
}
