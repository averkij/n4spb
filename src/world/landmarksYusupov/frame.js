// landmarksYusupov/frame.js - the frame of the Yusupov Palace complex (docs/research/yusupov.md section 2.1).
//   Palace frame P: origin O = (-2974.9, 351.0) = the SW corner of the Moika front; model +x = u runs along the front to the NE (world (0.7171, -0.6970), bearing 45.8 deg),
//   model +z = d runs into the complex to the SE (world (0.6970, 0.7171)); the river / facade normal is -d.  World = O + Ry(ROT) * (x, z) with three's rotation.y (ROT = atan2(0.6970, 0.7171)).
//   `fromUD(u, d)` -> world { x, z }; `toUD(x, z)` -> { u, d }.  FF.box / cyl / walk place physics objects given model coordinates.
export const O = { x: -2974.9, z: 351.0 };
export const ROT = Math.atan2(0.6970, 0.7171);
export const U_DIR = [Math.cos(ROT), -Math.sin(ROT)], D_DIR = [Math.sin(ROT), Math.cos(ROT)];
const mk = (O0, rot) => {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  return {
    O: O0, rot,
    /** model (x, z) -> world { x, z } */
    W: (mx, mz) => ({ x: O0.x + mx * cs + mz * sn, z: O0.z - mx * sn + mz * cs }),
    /** world (x, z) -> model { mx, mz } */
    M: (x, z) => { const dx = x - O0.x, dz = z - O0.z; return { mx: dx * cs - dz * sn, mz: dx * sn + dz * cs }; },
    box: (ph, mx, mz, w, d, r, y0, y1) => { const p = { x: O0.x + mx * cs + mz * sn, z: O0.z - mx * sn + mz * cs }; return ph.addBox(p.x, p.z, w, d, r + rot, y0, y1); },
    cyl: (ph, mx, mz, rad, y0, y1) => { const p = { x: O0.x + mx * cs + mz * sn, z: O0.z - mx * sn + mz * cs }; return ph.addCylinder(p.x, p.z, rad, y0, y1); },
    walk: (ph, mx, mz, w, d, r, top, bottom) => { const p = { x: O0.x + mx * cs + mz * sn, z: O0.z - mx * sn + mz * cs }; return ph.addWalkBox(p.x, p.z, w, d, r + rot, top, bottom); },
  };
};
export const FF = mk(O, ROT);
export const fromUD = (u, d) => FF.W(u, d);
export const toUD = (x, z) => { const m = FF.M(x, z); return { u: m.mx, d: m.mz }; };
export { mk };
export const FRONT_LEN = 89.8;
/** local x of the Moika-front facade frame (0 at the NE end, runs to the SW) <-> u */
export const xOfU = (u) => FRONT_LEN - u;
