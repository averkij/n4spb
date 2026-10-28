// landmarksStrelka/frame.js - the frame of the Spit ensemble (docs/research/strelka.md section 2.1, measured on the OSM 3D model of the Exchange).
//   Origin O = the centre of the Exchange (-2609.80, -1232.72).  Model +z = the long axis of the Exchange toward the tip of the Spit (world (0.85916, -0.51171), bearing 59.2 deg: the east front,
//   the columns' midpoint, the semicircle centre and the tip all lie on it); model +x = toward the Malaya Neva / the north Rostral column (world (-0.51171, -0.85916)).
//   rotation.y = ROT = 2.1080 rad: world = O + Ry(ROT) * (x, z) in three's convention (model +x -> (cos, -sin), model +z -> (sin, cos)).
//   The dossier's (u, v) are (model z, -model x): u along the axis, v toward the Palace Bridge.
//   Key points in the model frame: columns at (+-101.3, 88.5) (north +x, south -x), semicircle centre SC = (0, 105.5), terrace wall R 72, outer edge of the descent R 82.
export const O = { x: -2609.80, z: -1232.72 };
export const AX = [0.859156, -0.511714];
export const ROT = Math.atan2(AX[0], AX[1]);
const cs = Math.cos(ROT), sn = Math.sin(ROT);
/** model (x, z) -> world { x, z } */
export const W = (mx, mz) => ({ x: O.x + mx * cs + mz * sn, z: O.z - mx * sn + mz * cs });
export const Wa = (mx, mz) => [O.x + mx * cs + mz * sn, O.z - mx * sn + mz * cs];
/** world (x, z) -> model [mx, mz] */
export const M = (x, z) => { const dx = x - O.x, dz = z - O.z; return [dx * cs - dz * sn, dx * sn + dz * cs]; };
/** physics helpers in the model frame (r = extra rotation about y in the model frame) */
export const boxAt = (ph, mx, mz, w, d, r = 0, y0, y1) => { const p = W(mx, mz); return ph.addBox(p.x, p.z, w, d, r + ROT, y0, y1); };
export const cylAt = (ph, mx, mz, rad, y0, y1) => { const p = W(mx, mz); return ph.addCylinder(p.x, p.z, rad, y0, y1); };
export const walkAt = (ph, mx, mz, w, d, r, top, bottom) => { const p = W(mx, mz); return ph.addWalkBox(p.x, p.z, w, d, r + ROT, top, bottom); };
/** walk ramp: local z of the ramp runs from -d/2 (height yA) to +d/2 (yB); r turns the ramp's local +z away from model +z */
export const rampAt = (ph, mx, mz, w, d, r, yA, yB, thick) => { const p = W(mx, mz); return ph.addWalkRamp(p.x, p.z, w, d, r + ROT, yA, yB, thick); };

// ---- measured positions (model frame)
export const COL_N = [100.4, 88.5], COL_S = [-102.3, 88.5];                 // Rostral columns (north: Malaya Neva side, south: Palace Bridge side)
export const SC = [0, 105.5];                                               // centre of the semicircle of the Spit
export const R_WALL = 72, R_OUT = 82;                                       // upper terrace wall / outer edge of the descent ring
export const DEG = Math.PI / 180;
