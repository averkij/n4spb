// landmarksTransfiguration/frame.js - the local frames and every plan number of the module (dossier docs/research/aptekarsky-2026.md 4.4, photos refs/aptekarsky 65 66 and refs/transfiguration 04..16 (bunker)).
//
// makeFrame(ox, oz, zx, zz): a model frame whose origin is (ox, oz) and whose local +z points along the world direction (zx, zz); local +x is to the RIGHT of a viewer who looks at the +z face from
// outside (three's rotation.y convention: local +x -> world (cos, -sin), local +z -> world (sin, cos)).  F.W(mx, mz) -> world { x, z }; F.M(x, z) -> local { mx, mz }; F.rot.
//
// CH  the church of the Transfiguration (OSM w28370423, a 24.6 x 13.9 m rectangle: corners (-1478,-4555.6) (-1457.8,-4569.6) (-1449.9,-4558.3) (-1470,-4544.2)): origin = the middle of the rectangle, +z = the
//     ENTRANCE end (south-west, bearing 235 deg: the OSM steps way w1456389724 climbs along this axis from (-1478.8,-4546.4) to the portal at (-1473.9,-4549.8)), +x = south-east.  The long walls are
//     the SE face (x = +HW, the street side of photo 65) and the NW face; the short walls the SW (entrance) face z = +HL and the NE (altar) face z = -HL.
// BK  the Tributs bunker (OSM w412493366: an L-shaped 2 m trench outline, centre (-1419.5,-4561.1)): the door end S0, the elbow E and the dead end N3 are world points (see BUNKER).
export function makeFrame(ox, oz, zx, zz) {
  const l = Math.hypot(zx, zz) || 1, sx = zx / l, sz = zz / l, rot = Math.atan2(sx, sz), cs = Math.cos(rot), sn = Math.sin(rot);
  const W = (mx, mz) => ({ x: ox + mx * cs + mz * sn, z: oz - mx * sn + mz * cs });
  const M = (x, z) => { const dx = x - ox, dz = z - oz; return { mx: dx * cs - dz * sn, mz: dx * sn + dz * cs }; };
  return {
    ox, oz, rot, W, M,
    box: (ph, mx, mz, w, d, r, y0, y1) => { const p = W(mx, mz); return ph.addBox(p.x, p.z, w, d, r + rot, y0, y1); },
    cyl: (ph, mx, mz, rad, y0, y1) => { const p = W(mx, mz); return ph.addCylinder(p.x, p.z, rad, y0, y1); },
    walk: (ph, mx, mz, w, d, r, top, bottom) => { const p = W(mx, mz); return ph.addWalkBox(p.x, p.z, w, d, r + rot, top, bottom); },
    stairs: (ph, mx, mz, w, d, r, y0, y1, n) => { const p = W(mx, mz); return ph.addStairs(p.x, p.z, w, d, r + rot, y0, y1, n); },
    /** rotY of a thing in the model frame that faces the local direction (dx, dz) */
    face: (dx, dz) => Math.atan2(dx, dz) + rot,
  };
}

// the long axis (A -> B and D -> C averaged) points north-east: (0.8203, -0.5720); the entrance end is the opposite one
export const CH = makeFrame(-1463.925, -4556.925, -0.8203, 0.5720);

export const PL = {
  HW: 6.93, HL: 12.28,                // half width (SW / NE faces) and half length (SE / NW faces) of the ring
  TY: 1.0,                            // the terrace top (the church stands on a 3 m mound in reality; a 1 m rubble-walled terrace in the flat city)
  plinth: 0.5,                        // grey granite plinth
  rusticTop: 3.0, stringTop: 3.25,    // the rusticated ground floor and the string course (column bases)
  capBase: 7.05, capTop: 7.65,        // Corinthian capitals
  entTop: 8.55, corn: 8.2,            // the entablature of the column groups; the cornice of the end bays
  atticTop: 10.0,                     // the white panelled attic
  roofRise: 1.25,                     // the low hip behind the attic
  drumR: 3.15, drumY0: 9.6, drumY1: 13.0, drumCornY: 13.28, drumCapY: 14.3, crossH: 2.1,
  // column groups along a face (u from the left end seen from outside)
  flank: 1.25, pairAt: 6.0, pairGap: 1.1,      // long faces: triple at the corner (corner column + flank), pair at u = 6.0 and Lf - 6.0
  pairShort: 3.55,                               // short faces
};

// the terrace: a rectangle in the frame CH, rubble walls 1 m, hedge on top; the stair on the entrance axis
export const TERRACE = { mx0: -10.0, mx1: 10.0, mz0: -15.0, mz1: 14.2, stairZ1: 16.8, stairW: 2.4, stairN: 7 };

// the bunker trench (world [x, z]): the OSM outline w412493366 runs ALONG the service road w412530071 (2.65 m from its axis: the 4 m road model swallows it), so the drawn trench is the first leg of the outline shifted 2.9 m
// to its left (north-west, away from the road): the door end S0 (closed, red riveted wall + steel door), the open end E (the trench rises out of the ground over the last 2.5 m); 2 m wide, plates 2 m high
export const BUNKER = { S0: [-1428.3, -4556.2], E: [-1417.9, -4563.5], half: 1.0, wallH: 2.0, lean: 0.28, taper: 5.0, bermL: 5.2, bermR: 2.8 };
