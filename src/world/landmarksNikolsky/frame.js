// landmarksNikolsky/frame.js - the cathedral frame (docs/research/nikolsky.md section 2.1, measured on OSM relation r3290873 and its five dome parts).
//   Origin C0 = the central dome (-2861.6, 1104.6).  The plan is a Greek cross whose axes are rotated 66.4 deg: u points ENE (bearing 66.4), v points SSE.
//   MODEL FRAME: local +x = v, local +z = -u, so the MAIN facade (the west arm with the door, looking at the bell tower) looks along local +z; the ring of Parts is pushed with rot ROT.
//   world = C0 + Ry(ROT) * (x, z)  with three's rotation.y (local +x -> world (cos, -sin), local +z -> world (sin, cos)).
//   The bell tower stands exactly on the axis: local (0, +105.4), its portal faces the cathedral (local -z).
export const C0 = { x: -2861.6, z: 1104.6 };
const UX = 0.9164, UZ = -0.4004;                                   // unit vector of u in world (x, z)
export const ROT = Math.atan2(-UX, -UZ);                           // local +z = -u = (-UX, -UZ) = (sin ROT, cos ROT)
const cs = Math.cos(ROT), sn = Math.sin(ROT);
/** local (x, z) -> world { x, z } */
export const W = (mx, mz) => ({ x: C0.x + mx * cs + mz * sn, z: C0.z - mx * sn + mz * cs });
/** world -> local { mx, mz } */
export const M = (x, z) => { const dx = x - C0.x, dz = z - C0.z; return { mx: dx * cs - dz * sn, mz: dx * sn + dz * cs }; };
/** (u, v) of the dossier -> world */
export const UV = (u, v) => W(v, -u);
export const toUV = (x, z) => { const m = M(x, z); return { u: -m.mz, v: m.mx }; };
/** distance from the cathedral centre */
export const dC = (x, z) => Math.hypot(x - C0.x, z - C0.z);
export const TOWER = { mx: 0, mz: 105.4 };                          // bell tower centre in the model frame
export const TOWER_W = W(TOWER.mx, TOWER.mz);
export const FACADE_Z = 25.0;                                       // arm end planes at |x| or |z| = 25
export const box = (ph, mx, mz, w, d, r, y0, y1) => { const p = W(mx, mz); return ph.addBox(p.x, p.z, w, d, r + ROT, y0, y1); };
export const cyl = (ph, mx, mz, rad, y0, y1) => { const p = W(mx, mz); return ph.addCylinder(p.x, p.z, rad, y0, y1); };
/** rotY of a thing in the model frame that faces local direction (dx, dz) */
export const faceRot = (dx, dz) => Math.atan2(dx, dz) + ROT;
