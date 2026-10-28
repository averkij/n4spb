// landmarksSeaTerminal/frame.js - the model frames and the fixed dimensions of the module (docs/research/seaterminal.md sections 2, 4, 6, 7; every number below is in one of these frames).
//   T  the SEA TERMINAL (OSM r6702553, outline ring corner (-6542.4, 652.9)): local +x = u along the long faces toward the ESE (bearing 119.16 deg), local +z = v toward the sea (SSW), y up.  The NE (land)
//      face is the plane z = 0 and looks toward local -z; the SW (sea) face of the prism is z = 55.7.  three.js rotation.y = -0.5089 rad.  world(u, v) = O + u * (0.87327, 0.48723) + v * (-0.48723, 0.87327).
//   D  the submarine D-2 (hull tips (-6635.0, -43.8) SW and (-6566.3, -75.7) NE): origin = the hull midpoint, local +z = the BOW (SW, bearing 245.1), local +x = the PORT side (SSE), rotation.y = -1.1361.
//   B  the torpedo-boat monument (OSM w53500959): origin = the boat centre, local +z = the BOW (SSW, raised), local +x = the PORT side (ESE, the plinth lettering side), rotation.y = -0.5236.
// Heights are y above the lot / quay (street y = 0; the Gulf is y -3.4 in the scene).  Decisions of the builder are flagged DECISION (the red stars are optional: STARS).
import * as L from '../layout.js';

const mk = (x, z, rot) => {
  const C = Math.cos(rot), S = Math.sin(rot);
  return {
    x, z, rot,
    /** frame (a, b) -> world { x, z } */
    W: (a, b) => ({ x: x + C * a + S * b, z: z - S * a + C * b }),
    /** world (x, z) -> frame { a, b } */
    M: (wx, wz) => ({ a: C * (wx - x) - S * (wz - z), b: S * (wx - x) + C * (wz - z) }),
    /** world direction of the frame axes */
    A: [C, -S], B: [S, C],
  };
};
export const T = mk(-6542.4, 652.9, -0.5089);
export const D = mk(-6600.65, -59.75, -1.1361);
export const B = mk(-6565.1, 354.5, -0.5236);
export const TU = (u, v) => T.W(u, v);

/** DECISION: the plain red star with a white rim on the D-2 conning tower (naval insignia, no hammer and sickle) and on the bow flank of the torpedo boat */
export const STARS = true;

// ---------------------------------------------------------------------------------------------- the terminal
/** the prism (the seven-storey block): 100.9 x 55.7 m with 2.9 m chamfers (OSM r7706494, baked ring) */
export const PRISM = [[2.9, 0], [98.0, 0], [100.9, 2.9], [100.9, 52.8], [98.0, 55.7], [2.9, 55.7], [0, 52.8], [0, 2.9]];
export const PW = 100.9, PD = 55.7;
/** heights (y above the lot) of the vertical stack, CRITIC-corrected (dossier 4.2: roof parapet 29.0 [?]) */
export const H = {
  slabTop: 6.0, slabBot: 3.5,        // the deck slab (confirmed on photo a23)
  screenTop: 8.4,                     // NE deck screen: 6.0 .. 8.4
  sailTop: 18.0, sailApex: 14.2, claw: 9.6,
  tierBase: 18.0, tierPitch: 3.0, tiers: 3,
  roof: 28.4, parapet: 29.0,
  tower: 39.6,                        // clock tower top
  shaft: 41.0, cupTop: 47.5, needleLo: 34.0, needleTop: 73.5, globeY: 74.7, shipKeel: 76.5, top: 78.0,
  annex: 6.6,
};
/** the facade grid: bay pitch 6.3 m; the spine / pylon zone u 34.4 .. 40.3 is recessed 1.0 m; long-face bay edges (NW part 5 bays, SE part 9 bays); end faces 8 bays of 6.24 m */
export const BAY = 6.3;
export const SPINE = { u0: 34.4, u1: 40.3, rec: 1.0 };
export const LONG_BAYS = [[2.9, 34.4, 5], [40.3, 97.0, 9]];                 // [u0, u1, count]
export const SAILS_LONG = [[2.9, 18.65], [18.65, 34.4], [40.3, 59.2], [59.2, 78.1], [78.1, 97.0]];
export const END_BAYS = { v0: 2.9, v1: 52.8, n: 8 };
export const SAILS_END = [[2.9, 15.4], [15.4, 27.9], [27.9, 40.4], [40.4, 52.9]];
/** the SE annex (low ferry annex): u 100.9 .. 117.6, v 0 .. 55.6, 0 .. 6.6 */
export const ANNEX = { u0: 100.9, u1: 117.6, v0: 0, v1: 55.6 };
/** the deck: NE slab v -17.5 .. 0 (u 3.4 .. 117.5), the SW apron v 55.7 .. 66.9 (u 0 .. 117.6) */
export const DECK = { ne: { u0: 3.4, u1: 117.5, v0: -17.5, v1: 0 }, sw: { u0: 0, u1: 117.6, v0: 55.7, v1: 66.9 } };
/** the mushroom piers stand at the sail junctions (CRITIC no. 7): u of the claw piers */
export const PIER_U = [2.9, 18.65, 34.4, 40.3, 59.2, 78.1, 97.0];
/** the quay: coping at v 79.8 (Esri scan), the scene's water edge at v 82.5 .. 83.5 */
export const QUAY = { coping: 79.8, water: 82.5 };
/** the NE ground under the deck and the lot: the lot polygon (OSM w60989201) ends at v -21.2 */
export const UNDER = { u0: 3.4, u1: 117.5, v0: -21.0, v1: -0.3 };

// ---------------------------------------------------------------------------------------------- the submarine D-2 (frame D)
export const SUB = {
  len: 76.0, half: 38.0, beam: 6.4,
  keel: 2.3, wl: 6.1, deck: 8.2, towerTop: 12.6,
  towerZ: -4.5, towerLen: 8.4, towerW: 3.4,       // CRITIC no. 9
  gunPivot: 2.0, padZ0: -0.3, padZ1: 3.9,
  pav: { x0: -14.2, x1: -6.6, z0: -51.2, z1: 23.8, h: 4.0 },
  cradles: [{ x: -4.1, z: 8.0, w: 5.3, d: 4.7 }, { x: -4.2, z: -14.8, w: 4.9, d: 4.2 }],
  stone: { x: -32.9, z: -4.8 },                   // foundation stone n10033881447 (-6610.1, -91.6)
  entrance: { x: -6.3, z: -45.7 },                // the museum door (-6561.9, -84.7)
};

// ---------------------------------------------------------------------------------------------- the torpedo boat (frame B)
export const BOAT = {
  len: 20.0, beam: 3.5, plinth: { len: 17.0, w: 4.2, h: 2.4 },
  lawn: { hl: 12.0, hw: 4.5 },                    // 24 x 9 m, centred on the boat axis
};

/** the Lenexpo site fence (OSM w133197188, 30 vertices, 866 m) and the gates (dossier 8) */
export const LENEXPO_GATES = [[-6479.2, 47.0, 'main'], [-6485.4, -1.7, 'g'], [-6452.3, 143.5, 'g'], [-6425.1, 319.1, 'g']];

/** the real outline ring of the terminal from the baked record, [[x, z]...] world (fallback: the dossier numbers) */
export function outlineWorld() {
  try {
    const b = L.buildingById('r6702553');
    if (b && b.polys && b.polys[0]) { const o = b.polys[0].o, r = []; for (let i = 0; i < o.length; i += 2) r.push([o[i], o[i + 1]]); if (r.length >= 8) return r; }
  } catch (e) { /* fall through */ }
  const ring = [[0, 0], [117.6, 0], [117.6, 57.5], [112.1, 57.5], [112.1, 62.3], [117.6, 62.2], [117.6, 66.7], [0, 66.9], [0, 62.3], [5.8, 62.4], [5.8, 57.6], [0.1, 57.6]];
  return ring.map(([u, v]) => { const p = T.W(u, v); return [p.x, p.z]; });
}

/** road integrity (docs/AGENT-BRIEF.md): net.cover(x, z) of the streets module (negative = clear of asphalt by that many metres), layout.isOnRoad as the fallback before `streets` exists */
export function coverFn(ctx) {
  const net = ctx.services && ctx.services.streets && ctx.services.streets.net;
  return net && net.cover ? (x, z) => net.cover(x, z, {}) : (x, z) => (L.isOnRoad(x, z, 0) ? 1 : -5);
}
