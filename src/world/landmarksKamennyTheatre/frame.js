// landmarksKamennyTheatre/frame.js - the local frames and the plan numbers of the two sights (dossier docs/research/kamenny-2026.md 5.3, BUILD LOG of landmarksKamennyTheatre; photos T01..T13, K01..K10).
//
// makeFrame(ox, oz, zx, zz): a model frame whose origin is (ox, oz) and whose local +z points along the world direction (zx, zz); local +x is to the RIGHT of a viewer who looks at the +z face from
// outside (three's rotation.y convention: local +x -> world (cos, -sin), local +z -> world (sin, cos)).  F.W(mx, mz) -> world { x, z }; F.M(x, z) -> local { mx, mz }; F.rot.
//
// T  the Kamennoostrovsky Theatre (OSM w39358614): origin = the OSM centroid, +z = the WNW (bearing 292 deg): the 8-column portico faces +z and the Starogo Teatra square; the stage-house gable with the
//    half-round fanlight is at mz = ZE (ESE).  The OSM ring in this frame: ends at mz +27.65 (front of the portico steps) and -24.98, walls at mx = +-10.7; the two 3.4 m x 23.8 m "lateral projections" of the ring
//    (mx +-14.2, mz -12.3 .. +11.5) are the two low ANNEXES of the photos (T01 T04 T05 T07 T12): the OSM ring is RIGHT, the annexes stand mid-wall (T07 shows 3 ground windows of plain wall between the rear corner and the annex).
// K  the Kleinmichel dacha (OSM w60703051, Дом приёмов): origin = the OSM centroid, +z = NNE (toward the theatre square, the street front), local +x to the right seen from the street.  The ring in this frame:
//    mx -21.5 .. +26.9, mz -15.4 .. +15.7 (its walls are parallel to the theatre's: 22.5 deg).
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

export const T = makeFrame(-4238.1, -4931.2, -0.924, -0.383);
export const K = makeFrame(-4285.3, -4885.6, 0.383, -0.924);

// ---- theatre plan numbers (metres, local frame T) ------------------------------------------------------------------------------------------------------------------------------------------------------
export const TP = {
  HW: 10.7,                       // half width of the body (OSM 21.4 m)
  ZE: -24.98,                     // the ESE (stage-house) end wall
  ZF: 17.8,                       // the front wall behind the portico
  ZP: 25.4,                       // front of the portico entablature / tympanum (the cornice corona)
  colAxis: 23.3,                  // the axis of the column row (5.5 m in front of the wall)
  platEdge: 25.0,                 // the front edge of the stylobate platform (top 1.2 m)
  ZS: 27.65,                      // the foot of the steps (the OSM end of the ring)
  platH: 1.2,                     // stylobate platform height (six 0.2 m risers)
  bays: 14,                       // long walls: 14 bays of 3.056 m (the same pitch as the 7 bays of the gable ends: 3.057 m)
  plinth: 1.1,
  // heights, ground = 0 (the platform top is 1.2).  Re-measured on T12 / T07 / T11: the column is 9.7 m from the platform
  sill1: 1.55, win1H: 1.9,
  sill2: 4.1, win2H: 2.9, fanY: 7.5, sill3: 9.0, win3H: 1.2,
  entab: 10.9, cornTop: 12.37, ridge: 17.0, colH: 9.7,
  annexOff: 4, annexBays: 8, annexD: 3.4, annexTop: 3.6, annexWall: 3.25, balH: 1.0,
};
TP.pitch = (TP.ZF - TP.ZE) / TP.bays;
TP.annexL = TP.annexBays * TP.pitch;
TP.annexZ0 = TP.ZE + TP.annexOff * TP.pitch;        // the annexes stand MID-WALL: 4 plain bays from the rear corner, 8 bays of annex, 2 plain bays to the portico (OSM ring + photo T07)
export const COLS = { n: 8, axis: 10.05, step: 2.874 };

// ---- Kleinmichel plan numbers (frame K) ------------------------------------------------------------------------------------------------------------------------------------------------------
export const KP = {
  ring: [[26.88, 11.05], [11.86, 11.64], [12.02, 15.15], [-2.28, 15.67], [-2.33, 12.66], [-20.67, 13.33], [-21.51, -14.03], [16.78, -15.40], [17.36, 2.44], [26.53, 2.10]],
  tower: { cx: 0.2, cz: 13.2, hw: 2.5 },                  // the timber tower: 5 m square at the west end of the street bay
  hall: { x0: -16.5, x1: -6.5, z0: -11.0, z1: 13.3 },     // the timber hall (glazed semicircular bay under a fretwork gable) west of the tower
};
