// landmarksTVTower/shaft.js - the concrete core of the tower: the stone pedestal at the foot (slim octagon 7 m across the flats, 12.5 m, door and slit windows), the brick-red foot of the shaft and the shaft itself
// (a round 4.8 m concrete column, white with red bands whose lengths shrink upwards: 18 m at the bottom, 6 m below the lantern; the bands were measured on the photo B3), and the round
// portholes (r 0.24) every 6.5 m [V B3 68].  The shaft runs up to the lantern floor (187 m); the lantern module closes it.
import { SHAFT_R, SHAFT_Y0, SHAFT_RED, TRUNK_TOP } from './frame.js';

export function shaft(P, M, svc) {
  // ---- pedestal: a slim octagonal stone tower, 7 m across the flats and 12.5 m high [V B3 base crop: the cream block is ~6.5-7 m wide, the shaft above it 4.5 m]; the door faces south (towards the road),
  // one tall slit per face, a plinth and a cornice
  const R = 3.8, Rn = 22.5 * Math.PI / 180, H = 12.5;
  P.prism(M.ped, R, 0, H - 0.5, { n: 8, phase: Rn });
  P.prism(M.conc, R + 0.25, 0, 0.7, { n: 8, phase: Rn });                  // plinth
  P.prism(M.conc, R + 0.25, H - 0.6, H, { n: 8, phase: Rn });              // cornice
  const fd = R * Math.cos(Rn);                                             // distance of the face planes from the axis
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, nx = Math.sin(a), nz = -Math.cos(a), tx = Math.cos(a), tz = Math.sin(a);
    const at = (u, y) => [(nx * (fd + 0.04) + tx * u), y, (nz * (fd + 0.04) + tz * u)];
    if (i === 4) {
      P.quad(M.port, at(-0.8, 0.7), at(0.8, 0.7), at(0.8, 3.0), at(-0.8, 3.0), [nx, 0, nz]);
      P.quad(M.frame, at(-1.0, 0.7), at(-0.8, 0.7), at(-0.8, 3.25), at(-1.0, 3.25), [nx, 0, nz]);
      P.quad(M.frame, at(0.8, 0.7), at(1.0, 0.7), at(1.0, 3.25), at(0.8, 3.25), [nx, 0, nz]);
      P.quad(M.frame, at(-1.0, 3.0), at(1.0, 3.0), at(1.0, 3.25), at(-1.0, 3.25), [nx, 0, nz]);
    }
    for (const y0 of i === 4 ? [6.0, 9.0] : [4.2, 7.4]) P.quad(M.port, at(-0.3, y0), at(0.3, y0), at(0.3, y0 + 1.7), at(-0.3, y0 + 1.7), [nx, 0, nz]);
  }
  P.cap(M.conc, Array.from({ length: 8 }, (_, i) => { const a = Rn + i * Math.PI / 4, r = R + 0.25; return [r * Math.sin(a), -r * Math.cos(a)]; }), H, true);

  // ---- the shaft: bands from SHAFT_Y0 to the lantern, red ones from SHAFT_RED, white between
  const bands = []; let y = SHAFT_Y0;
  for (const [a, b] of SHAFT_RED) { if (a > y + 0.01) bands.push([y, a, false]); bands.push([a, Math.min(b, TRUNK_TOP), true]); y = b; }
  if (y < TRUNK_TOP - 0.01) bands.push([y, TRUNK_TOP, false]);
  bands.forEach(([a, b, red], i) => {
    const foot = i === 0;
    P.cyl(foot ? M.pedRed : red ? M.shaftRed : M.shaft, 0, 0, a, b, SHAFT_R + (foot ? 0.12 : 0), SHAFT_R + (foot ? 0.12 : 0), 20, i === bands.length - 1);
  });

  // ---- portholes: three per level, the pattern turns by 41 deg from level to level
  let n = 0;
  for (let yy = 21; yy < 183; yy += 6.5, n++) {
    for (let j = 0; j < 3; j++) {
      const a = (n * 41 + j * 120) * Math.PI / 180, nx = Math.sin(a), nz = -Math.cos(a), r = SHAFT_R + 0.03;
      P.disc(M.port, [nx * r, yy, nz * r], [nx, 0, nz], 0.24, 8);
    }
  }
  svc.pedestal = { r: R + 0.4, h: H };
}
