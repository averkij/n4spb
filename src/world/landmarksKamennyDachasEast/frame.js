// landmarksKamennyDachasEast/frame.js - the local frames and the plan numbers of the three sights (dossier docs/research/kamenny-2026.md 5.4 and the BUILD LOG at its end; photos O01..O12, S01..S04).
//
// makeFrame(ox, oz, zx, zz): a model frame whose origin is (ox, oz) and whose local +z points along the world direction (zx, zz); local +x is to the RIGHT of a viewer who looks at the +z face from
// outside (three's rotation.y convention: local +x -> world (cos, -sin), local +z -> world (sin, cos)).  F.W(mx, mz) -> world { x, z }; F.M(x, z) -> local { mx, mz }; F.rot.
//
// D   the Oldenburg dacha (OSM w31065816, Shustov 1831-33): origin = the middle of the square core (the rotunda axis), +z = SE (bearing 144.5 deg) = toward the Malaya Nevka and the sphinx pier: the
//     six-column portico faces +z; the two other six-column porticoes are on the local +x (ENE) and -x (WSW) sides, the entrance vestibule on -z (NNW).  The OSM ring (22 vertices) in this frame:
//     core mx -13.2..+13.2, mz -13.0..+12.9; south portico mx -6.8..+6.7 to mz +17.4; west / east porticoes mz -6.7..+6.2 / -6.6..+7.3 to mx -16.3 / +17.0; north vestibule mx -6.9..+6.5 to mz -15.7.
//     (The axes of the ring were fitted from 22 edges: 35.5 deg; the OSM centroid (-2991.1, -5072.5) is 1.4 m NNW of the rotunda axis because the south portico is the deepest.)
// WG  the wing (OSM w31065814, "Флигель дачи принца П. Г. Ольденбургского"): origin = the ring centroid, +z = SSE (bearing 140 deg, the long axis of the 14.1 x 23.1 m ring), local +x = ENE.
// PR  the sphinx pier (OSM r10254206): origin = the middle of the bank-top edge (the embankment way, the edge A-D of the 10.7 x 9.4 m ring), +z = into the river (perpendicular to the bank, bearing 153.4 deg):
//     the stair runs from mz 0 (y 0.0, street level) to mz 9.4 (the water polygon begins at mz 9.5); local +x = ENE (along the bank).
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

export const D = makeFrame(-2991.9, -5073.6, 0.5807, 0.8141);
export const WG = makeFrame(-3041.45, -5105.45, 0.646, 0.763);
export const PR = makeFrame(-2962.2, -5033.85, 0.447, 0.894);

// ---- the dacha (metres, local frame D) ----------------------------------------------------------------------------------------------------------------------------------------------------------------
export const DP = {
  HW: 13.2, HD: 13.0,                       // half width (mx) / half depth (mz) of the square core
  portS: { hw: 6.8, d: 17.4 },              // south portico: half width, outer edge mz
  portW: { hw: 6.5, d: 16.3 },              // west portico (outer edge at mx -16.3), half width along mz
  portE: { hw: 6.5, d: 16.9 },              // east portico (outer edge at mx +16.9)
  vest: { hw: 6.7, d: 15.7 },               // north vestibule, outer edge mz -15.7
  PL: 0.8,                                  // top of the stone plinth = the porch floor
  E1: 5.6,                                  // top of the ground floor = the entablature of the porticoes = the balcony deck
  WT: 8.4,                                  // top of the upper wall (the cornice starts)
  CT: 9.3,                                  // top of the cornice = the roof
  DR: 12.8, DC: 13.4,                       // top of the drum wall, top of the drum cornice
  DOME: 3.0,                                // rise of the dome (R 6.9)
  drumR: 6.6, domeR: 7.0,
  colH: 3.9, colR0: 0.37, colR1: 0.31,      // the Doric columns: height, foot radius, neck radius
};
// ---- the wing (local frame WG) ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const WP = { hw: 7.05, hl: 11.55, PL: 0.5, E1: 3.9, WT: 7.0, CT: 7.8, roofRise: 2.6 };
// ---- the sphinx pier (local frame PR) -------------------------------------------------------------------------------------------------------------------------------------------------------------
export const PP = {
  hw: 6.4, pedOut: 5.5,                      // half width of the landing and the pedestal base course / of the pedestal shafts (the OSM ring is 10.7 m, the pit opens 0.5 m round it: the blocks run past it to close the seam to the bank)
  stairHW: 3.5,                              // half width of the flight between the cheeks
  run: 9.6, top: 0.0, low: -3.1,             // the flight from y 0 to y -3.1 (water at -3.4), the lowest tread is a landing 1.0 m deep
  nSteps: 15, landing: 1.0,
  cheekW: 1.2, pedW: 1.55, pedL: 2.7, pedH: 1.15, pedZ: 7.5, // pedestals at the water end: centre mz 7.5 (7.5 +- 1.35 = 6.15 .. 8.85)
};
