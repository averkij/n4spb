import { createKart } from './karts.js';

/** Only the venue owns parking positions and the twenty-kart fleet. */
export function loadKarts(ctx, course) {
  return ['rental', 'club'].flatMap((fleet, side) => Array.from({ length: 10 }, (_, index) => {
    const num = index + 1, stagger = num % 2 ? 0 : .18;
    const parked = {
      x: -4674.9 + index * .64 + side * 3.55 + stagger,
      z: 3559.5 + index * 1.62 - side * 1.28,
      yaw: .362 + (side ? Math.PI / 2 : -Math.PI / 2),
    };
    return createKart(ctx, `narvskaya-${fleet}-${num}`, parked, course);
  }));
}
