// landmarksKamennyChurch/frame.js - the local frames and the plan numbers of the two sights (dossier docs/research/kamenny-2026.md section 5.2, photos refs/kamenny-2026 C01..C15, H01..H03).
//
// makeFrame(ox, oz, zx, zz): a model frame whose origin is (ox, oz) and whose local +z points along the world direction (zx, zz); local +x is to the RIGHT of a viewer who looks at the +z face from
// outside (three's rotation.y convention: local +x -> world (cos, -sin), local +z -> world (sin, cos)).  F.W(mx, mz) -> world { x, z }; F.M(x, z) -> local { mx, mz }; F.rot.
//
// CH  the church of the Nativity of John the Baptist (OSM r10254216 / w28055978, Felten 1776-78): origin = the middle of the nave at the OSM centroid (axis shifted 0.5 m so that the mapped
//     cross arms (v -9.1 / +9.4) and the nave (-4.9 / +4.0) sit symmetric), +z = the WEST / WNW (bearing 295 deg): the belfry and the main door face the Kamennoostrovsky prospect; the altar wall is at
//     mz = -7.95; local +x = SOUTH-west (the south arm).  The OSM ring in this frame (axis 25.2 deg): east wall mz -7.95 (9.5 m wide), cross arms mx +-9.3 over mz -5.1 .. +1.9 (7 m wide),
//     the west face of the tower mz +10.9 (the OSM entrance node n12230197908 lies at (-1.4, 10.9)).
// CP  the chapel of the Vsetsaritsa icon (OSM r10254215 / w553610963, a 20-gon of 8.1 m diameter at (-2832.3, -5459.5)): origin = its centre, +z = the DOOR side (toward the footway w142041418,
//     west-south-west; estimate [E] from photos H01 / H02 / C11).
export function makeFrame(ox, oz, zx, zz) {
  const l = Math.hypot(zx, zz) || 1, sx = zx / l, sz = zz / l, rot = Math.atan2(sx, sz), cs = Math.cos(rot), sn = Math.sin(rot);
  const W = (mx, mz) => ({ x: ox + mx * cs + mz * sn, z: oz - mx * sn + mz * cs });
  const M = (x, z) => { const dx = x - ox, dz = z - oz; return { mx: dx * cs - dz * sn, mz: dx * sn + dz * cs }; };
  return {
    ox, oz, rot, W, M,
    ring: (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) { const m = M(flat[i], flat[i + 1]); r.push([m.mx, m.mz]); } return r; },
    box: (ph, mx, mz, w, d, r, y0, y1) => { const p = W(mx, mz); return ph.addBox(p.x, p.z, w, d, r + rot, y0, y1); },
    cyl: (ph, mx, mz, rad, y0, y1) => { const p = W(mx, mz); return ph.addCylinder(p.x, p.z, rad, y0, y1); },
    walk: (ph, mx, mz, w, d, r, top, bottom) => { const p = W(mx, mz); return ph.addWalkBox(p.x, p.z, w, d, r + rot, top, bottom); },
    stairs: (ph, mx, mz, w, d, r, y0, y1, n) => { const p = W(mx, mz); return ph.addStairs(p.x, p.z, w, d, r + rot, y0, y1, n); },
    /** rotY of a thing in the model frame that faces the local direction (dx, dz) */
    face: (dx, dz) => Math.atan2(dx, dz) + rot,
  };
}

export const CH = makeFrame(-2840.33, -5401.66, -0.906, -0.426);
// chapel: the door looks toward (-8.7, +1.5) from the centre = west, a little south
export const CP = makeFrame(-2832.3, -5459.5, -0.985, 0.17);

// ---- church plan numbers (metres, local frame CH) ------------------------------------------------------------------------------------------------------------------------------------------------
export const PL = {
  naveHW: 4.75,                       // half width of the nave (OSM: 9.5 m east wall)
  armHW: 9.3,                         // half width over both cross arms (OSM v -9.1 / +9.4)
  armE: -5.1, armW: 1.9,              // the arms span mz -5.1 .. +1.9 (7 m)
  eastZ: -7.95, westZ: 8.0,           // altar wall / west wall of the nave
  towerHW: 2.3, towerFront: 10.9,     // the belfry tower: 4.6 m wide, its front face at mz 10.9 (OSM entrance node)
  bayR: 1.3, bayX: 3.4,               // the two round bays between tower and nave corners
  drumZ: -1.6,                        // centre of the crossing (the drum)
  plinthH: 1.2, wallTop: 5.6, cornTop: 6.5,
  pier: 0.55, pierOut: 0.22,          // corner piers: 0.55 m along each wall, 0.22 m proud
};
// the chapel
export const CPL = { R: 4.05, floor: 1.05, steps: 7, rise: 0.15, tread: 0.3 };
