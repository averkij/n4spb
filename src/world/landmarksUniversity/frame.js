// landmarksUniversity/frame.js - the frames of the buildings of Universitetskaya embankment (docs/research/university-embankment.md section 2, measured on the OSM footprints).
//   A frame is { O: [x, z], ax: unit vector of local +x in the world (x, z) }; local +z = the facade normal pointing OUT (to the street / the river) = ax turned clockwise seen from above
//   in the (x east, z south) plane, i.e. (-ax.z, ax.x) ... chosen so that a viewer in front of the facade sees local +x to his RIGHT.  rotY is three's rotation.y of that frame:
//   local +x -> world (cos, -sin), local +z -> world (sin, cos).
const mk = (ox, oz, ax, az) => {
  const l = Math.hypot(ax, az) || 1, cx = ax / l, sz = az / l;                 // local +x in the world
  const rot = Math.atan2(-sz, cx), cs = Math.cos(rot), sn = Math.sin(rot);
  return {
    O: [ox, oz], rot, ax: [cx, sz], n: [sn, cs],
    /** local (x, z) -> world [x, z] */
    W: (x, z) => [ox + x * cs + z * sn, oz - x * sn + z * cs],
    /** world (x, z) -> local [x, z] */
    M: (x, z) => { const dx = x - ox, dz = z - oz; return [dx * cs - dz * sn, dx * sn + dz * cs]; },
    box: (ph, x, z, w, d, r, y0, y1) => { const p = [ox + x * cs + z * sn, oz - x * sn + z * cs]; return ph.addBox(p[0], p[1], w, d, r + rot, y0, y1); },
    cyl: (ph, x, z, rad, y0, y1) => { const p = [ox + x * cs + z * sn, oz - x * sn + z * cs]; return ph.addCylinder(p[0], p[1], rad, y0, y1); },
    walk: (ph, x, z, w, d, r, top, bottom) => { const p = [ox + x * cs + z * sn, oz - x * sn + z * cs]; return ph.addWalkBox(p[0], p[1], w, d, r + rot, top, bottom); },
  };
};
export { mk };

// Kunstkamera: origin = the WEST corner of the river front, +x along the front to the NE (bearing 41), +z out to the Neva.  Wings x 0..39.6 and 54.8..95.66, centre between.
export const KK = mk(-2640.4, -973.7, 0.6523, -0.7579);
export const KK_LEN = 95.66, KK_W0 = 39.6, KK_W1 = 54.8, KK_DEPTH = 15.0;
export const KK_TOWER = [47.4, -5.0];                                           // tower axis in the KK frame

// Academy of Sciences: origin = the WEST corner of the river front (-2741.8,-904.6), +x along the front to the NE (bearing 56), +z out to the Neva.
export const AC = mk(-2741.8, -904.6, 0.8253, -0.5647);
export const AC_LEN = 101.1, AC_DEPTH = 18.9, AC_P0 = 32.0, AC_P1 = 66.9, AC_PD = 3.4;   // portico podium x range and projection

// Twelve Collegia: origin = the SE corner (-2802.1,-862.3), +x along the EAST front to the NNW (bearing 331), +z out to Mendeleevskaya line (ENE).  The west (gallery) side is z = -18 .. -23.4.
export const TC = mk(-2802.1, -862.3, -0.4923, -0.8704);
export const TC_LEN = 396.5, TC_DEPTH = 18.0, TC_GAL = 5.4;

// Lomonosov monument (OSM node) and its facing: toward the Neva, parallel to the Academy's front normal
export const LOMO = { x: -2777.2, z: -905.9 };
export const SAKHAROV = { x: -3016.8, z: -1225.3 };
export const GENIUS = { x: -2877.0, z: -1033.1 };
export const DEG = Math.PI / 180;
