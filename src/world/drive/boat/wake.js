// drive/boat/wake.js - the foam trail of the motor boat: two soft-particle systems of drive/fx.js (one draw each): FLAT white foam quads that lie on the water and spread behind the stern (a V of foam from the
// two quarters and a churn at the motor), and a few BILLBOARD droplets of spray at the bow when it is fast. Pure particles, no geometry of its own, no outline pass. update() runs every frame (the foam of a boat that
// was left keeps fading); emit(car) only while the boat is driven. Everything is a function of the speed: a boat at rest leaves a faint ring of ripples at the motor.
import { system } from '../fx.js';

export function createWake(ctx) {
  const foam = system(ctx, 280, false, 'boat-foam', true), spray = system(ctx, 40, false, 'boat-spray');
  let acc = 0, sprayAcc = 0, ripple = 0;
  const rnd = (a) => (Math.random() * 2 - 1) * a;
  return {
    foam, spray,
    /** per frame: emit from the boat state (handling.js: x, z, y, yaw, vx, vz, vF, speed, thrS) when `driven`; advance and fade every particle */
    update(dt, car, driven) {
      if (driven && dt > 0) {
        const sy = Math.sin(car.yaw), cy = Math.cos(car.yaw), lx = cy, lz = -sy, v = Math.abs(car.vF), k = Math.min(1, v / 14), y = car.y + 0.05;
        acc += dt * (4 + 70 * k * k + 10 * (car.thrS || 0));
        while (acc >= 1) {
          acc -= 1;
          const side = Math.random() < 0.5 ? 1 : -1, back = -2.45 - Math.random() * 0.4, half = 0.75 + 0.4 * Math.random();
          const px = car.x + sy * back + lx * side * half, pz = car.z + cy * back + lz * side * half;
          const out = (0.3 + 1.3 * k) * side * (0.6 + 0.8 * Math.random());       // the V opens outward as the wash rolls off the quarters
          foam.emit({ x: px + rnd(0.2), y, z: pz + rnd(0.2), vx: lx * out + car.vx * 0.12 + rnd(0.2), vz: lz * out + car.vz * 0.12 + rnd(0.2), vy: 0, life: 1.8 + 1.6 * k, s0: 0.45 + 0.3 * k, s1: 1.5 + 2.0 * k, a: 0.38 * (0.35 + 0.65 * k), r: 0.96, g: 0.99, b: 1.0, drag: 0.8 });
        }
        // a churn right behind the transom, strongest on the throttle
        if ((car.thrS || 0) > 0.05 || k > 0.1) {
          ripple += dt * (10 + 30 * (car.thrS || 0));
          while (ripple >= 1) {
            ripple -= 1;
            foam.emit({ x: car.x + sy * -2.9 + rnd(0.2), y, z: car.z + cy * -2.9 + rnd(0.2), vx: -sy * (0.8 + 2 * k) + rnd(0.2), vz: -cy * (0.8 + 2 * k) + rnd(0.2), vy: 0, life: 1.1 + 0.9 * k, s0: 0.35, s1: 1.2 + 1.4 * k, a: 0.55, r: 0.98, g: 1, b: 1, drag: 1.4 });
          }
        }
        // bow spray: droplets thrown sideways and up from the stem when the boat is fast
        if (k > 0.45) {
          sprayAcc += dt * 30 * (k - 0.35);
          while (sprayAcc >= 1) {
            sprayAcc -= 1;
            const side = Math.random() < 0.5 ? 1 : -1;
            spray.emit({ x: car.x + sy * 2.3 + lx * side * 0.35, y: y + 0.1, z: car.z + cy * 2.3 + lz * side * 0.35, vx: lx * side * (1.4 + k * 1.4) + car.vx * 0.5, vz: lz * side * (1.4 + k * 1.4) + car.vz * 0.5, vy: 1.8 + 1.6 * k, grav: -9, life: 0.55 + 0.25 * Math.random(), s0: 0.10, s1: 0.28, a: 0.5, r: 1, g: 1, b: 1, drag: 0.6 });
          }
        }
      }
      foam.update(dt); spray.update(dt);
    },
    clear() { foam.clear(); spray.clear(); acc = sprayAcc = ripple = 0; },
  };
}
