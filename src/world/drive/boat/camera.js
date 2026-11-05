// Predict low overhead clearance before the chase camera reaches a bridge.
// Keep the lowered view across narrow gaps between deck collider pieces.
export function boatCameraLow(state, dt, x, y, z, yaw, vx, vz, distance, height, blocked) {
  const speed = Math.hypot(vx, vz), fx = speed > .5 ? vx / speed : Math.sin(yaw), fz = speed > .5 ? vz / speed : Math.cos(yaw);
  state.roofTimer = (state.roofTimer || 0) - dt;
  state.roofHold = Math.max(0, (state.roofHold || 0) - dt);
  if (state.snap || state.roofTimer <= 0) {
    state.roofTimer = .08;
    const ahead = Math.min(40, 8 + speed * 1.8), back = distance + 2;
    for (let s = -back; s <= ahead; s += 1.5) {
      if (blocked(x + fx * s, z + fz * s, .35, y + 1.55, y + height + .6)) {
        state.roofHold = .75;
        break;
      }
    }
  }
  return state.roofHold > 0;
}

// Continuous obstruction distance instead of jumps between ten ray samples.
export function boatCameraFraction(x, y, z, dx, dy, dz, blocked) {
  // Cargo ships can have a 430 m boom. Bound their frame work while retaining
  // fine samples for small boats and much finer checks than the old ten steps.
  const n = Math.max(1, Math.min(128, Math.ceil(Math.hypot(dx, dy, dz) / .35)));
  let clear = 0;
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    if (blocked(x + dx * f, z + dz * f, .24, y + dy * f - .24, y + dy * f + .24)) {
      let lo = clear, hi = f;
      for (let k = 0; k < 6; k++) {
        const m = (lo + hi) / 2;
        if (blocked(x + dx * m, z + dz * m, .24, y + dy * m - .24, y + dy * m + .24)) hi = m;
        else lo = m;
      }
      return lo;
    }
    clear = f;
  }
  return 1;
}
