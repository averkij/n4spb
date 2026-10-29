// landmarksKirova/frame.js - the model frames and the fixed numbers of the module (docs/research/kirova.md sections 2, 4, 5, 10, 11; measured again on the baked footprints, see the plan audit
// tools/landmarksKirova-plan.mjs).
//   FD   frame of the KIROV PALACE OF CULTURE (OSM w45966107 + cinema w65623799 + annex w65623790): origin (-5449, -145), rotation.y = 30.57 deg (the dominant bearing of the baked ring is 59.43 deg:
//        in this frame every long wall of the ring is straight to +-0.4 m; the dossier's frame K has 30.0 deg and drifts up to 1.9 m).  Plan coordinates (r, q): r runs ENE along the prospects (the front,
//        left to right as seen from the square), q runs NNW into the building (q < 0 = in front of the rear line of the strip, the square lies at q < -32).  Local three.js axes of a group pushed with
//        P.push(FD.x, 0, FD.z, FD.rot): x = r, z = -q, so the FRONT of the palace faces local +z and a kit.box(.., -q1, -q0) is a box with q0 on the front side.
//        world(r, q): x = -5449 + c r + s (-q), z = -145 - s r + c (-q) with c = cos(rot), s = sin(rot).
//   FK   frame K of the dossier (garden, Roerich plaza, Sobchak skver, fence): same origin, rotation.y = 30.00 deg (garden ring 60.16, roads 59.1 .. 60.5).
//   FE   frame of the ERARTA museum (OSM w45966528): origin = the middle of the east front wall (-5582.8, 23.7), rotation.y = 119.67 deg (ring bearing 60.33: every edge axis-aligned to 0.15 m).
//        Local x = q' (NNW, along the front, left-to-right seen from the street is -q'... see EW below), local z = r' (ENE, outward: the front faces local +z).
// Helpers: frame objects with W(a, b) (frame -> world), M(x, z) (world -> frame), pushOn(P) / popOn, yaw of the frame.
import * as L from '../layout.js';

const DEG = Math.PI / 180;
function makeFrame(x, z, rotDeg, flipZ) {
  const rot = rotDeg * DEG, c = Math.cos(rot), s = Math.sin(rot), f = flipZ ? -1 : 1;
  return {
    x, z, rot, c, s,
    /** frame (a, b) -> world { x, z }: a = local x, b = plan coordinate (local z = f * b) */
    W: (a, b) => ({ x: x + c * a + s * f * b, z: z - s * a + c * f * b }),
    /** world -> frame { a, b } */
    M: (wx, wz) => { const dx = wx - x, dz = wz - z; return { a: c * dx - s * dz, b: f * (s * dx + c * dz) }; },
    /** world position as an array [x, z] of the frame point */
    P: (a, b) => [x + c * a + s * f * b, z - s * a + c * f * b],
    /** rotation.y of a thing whose local +z points toward the frame direction (da, db): turn = atan2 in world */
    rotToward(da, db) { const wx = c * da + s * f * db, wz = -s * da + c * f * db; return Math.atan2(wx, wz); },
    /** push the frame on a Parts collector: local x = a, local z = f * b */
    push(P) { P.push(x, 0, z, rot); return P; },
  };
}
/** DK plan frame (r, q), local z = -q */
export const FD = makeFrame(-5449, -145, 30.57, true);
/** garden / dossier frame K (r, q), local z = -q */
export const FK = makeFrame(-5449, -145, 30.0, true);
/** Erarta frame: a = q' (local x), b = r' (local z, outward) */
export const FE = makeFrame(-5582.8, 23.7, 119.67, false);

/** world (x, z) -> plan coordinates of the dossier frame K as [r, q] (for comparing with the dossier numbers) */
export const toK = (x, z) => { const m = FK.M(x, z); return [m.a, m.b]; };

// ------------------------------------------------------------------------------------------------ switches (docs/research/kirova.md 5.9, 11.4)
/** the roof words ДВОРЕЦ / ИМЕНИ С.М. КИРОВА / КУЛЬТУРЫ stood on the DK until 2019 and are gone on the photo of 14 June 2026: not drawn */
export const LETTERS = false;
/** the red roof sign ERARTA: every photo of it is of 2009-2010, the 2025 photos do not show the roof: kept (a plain wordmark, AGENT-BRIEF) */
export const ROOF_SIGN = true;

// ------------------------------------------------------------------------------------------------ DK heights and the plan numbers (frame FD)
export const DKH = {
  plinth: 0.45, gf: 3.9, spandrel: 5.9, ribbon: 8.2, podium: 9.2,          // podium of two public floors (4.9 + 4.3)
  wing: 22.2, pavilion: 25.5, v1: 14.4, portal: 7.1, strip: 17.5, gallery: 9.2, white: 5.6, eastWing: 20.4, arm: 10.0, cinema: 9.5, annex: 8.0, tower: 36.0, drum: 39.8, box: 38.0,
  setback: 2.5,                                                                 // the upper blocks stand 2.5 m behind the podium line
  upper0: 9.2, ent0: 19.1, ent1: 20.2,                                          // entablature (three mouldings 19.1 .. 20.2), attic 20.2 .. 22.2
};
/** front line q of the palace per r range (ring numbers in FD, front = smaller q) and the elements of the front, west to east */
export const FRONT = {
  west: -71.2, east: 129.0,
  line: -32.4,                                    // the common front of V1, W1, pavilion L and the centre block (ring -32.6 .. -32.2)
  lineE: -32.1,                                   // pavilion R and wing E (ring -32.1)
  portalQ: -35.5, portal: [-6.95, 10.3],          // the portal bump (ring -35.5, r -6.95 .. 10.3)
  gallery: [56.4, 103.5], galleryQ: -35.5,
  white: [103.6, 121.8], whiteQ: -40.0,
  endBlock: [121.8, 129.0], endQ: -35.6,
  rear: -8.0,                                     // the rear line of the front strip (courtyard side)
  v1: [-71.2, -53.0], w1: [-53.0, -25.7], pl: [-25.7, -10.2], cb: [-10.2, 13.2], pr: [13.2, 30.2], we: [30.2, 56.4],
};
/** door centres of the portal (photographed pitch 5.25 m round the portal centre; dossier 5.5) */
export const PORTAL_C = (FRONT.portal[0] + FRONT.portal[1]) / 2;
export const DOORS_R = [PORTAL_C - 5.25, PORTAL_C, PORTAL_C + 5.25];

// ------------------------------------------------------------------------------------------------ Erarta numbers (frame FE: a = q', b = r')
export const ER = {
  q0: -44.7, q1: 44.75, rear: -36.75,
  centre: [-14.1, 12.5], centreR: 0.1,
  wingS: [-29.75, -14.1], wingSR: -1.7, wingN: [12.5, 27.8], wingNR: -2.25,
  pavS: [-44.7, -29.75], pavSR: 2.4, pavN: [27.8, 44.75], pavNR: 3.15,
  northWing: { q: [8.8, 44.75], rear: -14.4 }, bump: { q: [21.2, 30.35], r: [-19.5, -14.4] },
  plinth: 1.35, baseTop: 9.4, corniceTop: 10.1, parapet: 11.0, colTop: 20.8, entTop: 22.9, atticTop: 24.5, roofLetters: 27.0,
  wingCornice: 22.0, pavCornice: 23.0, wall: -2.0, colAxisR: -1.8,
  cols: Array.from({ length: 8 }, (_, k) => -0.9 + 3.6 * (k - 3.5)),
  portal: { q: [-7.0, 7.0], r: 2.2, h: 6.4 },                 // [erarta-detail 1.4] beam top 6.3 - 6.4 above the landing (it was 7.1)
  stair: { w: 11, n: 11, riser: 0.1227, tread: 0.40 },        // [erarta-detail 1.5] 11 risers (1.35 m), treads 0.40 m: run 4.4 m
};

// ------------------------------------------------------------------------------------------------ garden numbers (frame FK: a = r, b = q) (dossier section 10)
export const GD = {
  gateAxis: [191.3, -242.2], gateNodes: [186.1, 196.5],
  plaza: { c: [191, -71], platform: [186, -62] },
  roerichNode: [191.4, -68.3],
  sobchak: [26.4, -258.7],
};

/** the ring of a baked building as a flat array of [x, z] (world) or null */
export function ringOf(id) { const b = L.buildingById(id); return b && b.polys && b.polys[0] ? b.polys[0].o : null; }
