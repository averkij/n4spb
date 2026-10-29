// landmarksPribaltiyskaya/frame.js - the model frames and the fixed dimensions of the module (docs/research/pribaltiyskaya.md sections 2, 4, 6, 8, 9; [C#] = the critic's corrections of 2026-10-09).
//   HF  the PRIBALTIYSKAYA HOTEL: origin = OSM node n5182103813 (the Creators group), rotation.y = +1.9966 rad: local +z = bearing 65.6 deg (ENE, OUT of the main facade, toward Peter I and Nakhimova street),
//       local +x = bearing 335.6 deg (NNW, the viewer's RIGHT when he stands on the plaza and looks at the hotel), y up.  world(a, b) = O + a * (C, -S) + b * (S, C) with C = cos rot, S = sin rot.
//   KF  the KIROV memorial: origin = OSM node n1352795088 (the centre of the wreath disc), rotation.y = +2.0017 rad: local +z = bearing 65.3 deg (toward the college wing), local +x = NNW.
//   NK  the Nakhimov statue node n3617365016 (the pose is a builder decision, the statue faces the park entrance).
// Heights are y above the plaza / street (street y = 0); the hotel terrace stands +3.2 m above the plaza.
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
export const HF = mk(-7573.07, -746.9, 1.9966);
export const KF = mk(-7987.21, -1067.85, 2.0017);
export const NK = { x: -7308.8, z: -804.0 };

// ---------------------------------------------------------------------------------------------- the hotel (frame HF, (x, z) metres)
/** the vertical stack (dossier 4.1 / 4.2, [C2] [C3]) */
export const Y = {
  terr: 3.2,                           // the terrace / plinth top above the plaza
  lobbyTop: 10.2,                      // glass lobby 3.2 .. 10.2, then the blind dark-bronze band to gridBase
  gridBase: 15.5,                      // the first window sill (+0.35 m of reveal in the texture)
  row: 2.93, rows: 10,                 // 10 window rows of 2.93 m: grid 15.5 .. 44.8
  gridTop: 44.8, panelTop: 46.0,       // arms: light panels to 46.0, then the dark brown attic 2.2 m to armTop
  armTop: 48.2,
  beam0: 45.4, beam1: 47.4,            // the dark beam of the central block
  finTop: 53.1,                        // fins band 47.4 .. 53.1 (5.7 m)
  crownTop: 57.8,                      // crown 53.1 .. 57.8
  letterTop: 60.2,                     // roof letters 57.8 .. 60.2
  earOuter: 60.2, earInner: 63.3,      // the ear roofs slope DOWN outward
  mast: 70.0,
  dome0: 7.0, dome1: 11.0, domeTop: 14.5, pavTop: 7.0,
};
export const BAY = 3.86;               // [C1] one bay / module of the facades
/** the 24-vertex ring of the arms + central block (OSM w533042822 in frame HF), P0 .. P23 */
export const RING = [[60.2, -142.3], [45.6, -68.2], [55.7, -23.3], [37.7, -23.3], [30.0, -57.8], [26.4, -57.8], [26.4, -54.2], [-27.7, -54.2], [-27.7, -57.8], [-31.2, -57.8], [-39.0, -23.2], [-57.0, -23.2],
  [-46.8, -68.2], [-61.3, -142.2], [-43.3, -142.2], [-39.8, -124.1], [-30.7, -77.7], [-27.2, -77.7], [-27.2, -81.5], [26.0, -81.5], [26.0, -77.8], [29.5, -77.8], [38.7, -124.1], [42.3, -142.3]];
/** kind of the ring edge i (P_i -> P_i+1): arm = window grid + attic; tower = blind end face (+ chamfer window column + groove); cfront / crear = the central block fronts (grid + beam + fins); reveal = a short step / return */
export const EDGE_KIND = ['arm', 'arm', 'tower', 'arm', 'reveal', 'reveal', 'cfront', 'reveal', 'reveal', 'arm', 'tower', 'arm', 'arm', 'tower', 'arm', 'arm', 'reveal', 'reveal', 'crear', 'reveal', 'reveal', 'arm', 'arm', 'tower'];
/** the central block above the arm roofs: footprint x -27.7 .. 26.4, z -81.5 .. -54.2 */
export const CB = { x0: -27.7, x1: 26.4, z0: -81.5, z1: -54.2 };
/** the crown (53.1 .. 57.8): x -27.5 .. 26.4, z -76.7 .. -59.8 [C3] */
export const CROWN = { x0: -27.2, x1: 26.0, z0: -76.7, z1: -59.8 };
/** the ears, two prisms per ear (inner half over the crown end, outer half over the arm), mirrored for the south ear: [x0, x1] and the polygon of each half */
export const EAR_IN = [[26.0, -76.6], [22.6, -76.6], [18.2, -72.9], [18.3, -63.5], [22.6, -59.8], [26.0, -59.9]];
export const EAR_OUT = [[29.4, -74.9], [32.1, -74.9], [36.6, -72.7], [36.6, -63.8], [32.1, -61.6], [29.4, -61.6]];
/** the base outline w17559880 (the plinth footprint) in frame HF; the platform top polygon is OUTER minus RING */
export const OUTER = [[-13.9, 1.0], [18.4, 1.0], [18.4, 7.4], [49.3, 10.2], [75.9, 17.5], [76.5, -16.5], [61.4, -16.0], [49.7, -68.3], [65.1, -146.3], [-66.2, -146.3], [-50.9, -68.2], [-62.5, -16.7], [-76.2, -16.5],
  [-70.0, 17.1], [-41.5, 9.9], [-13.9, 7.4]];
/** the stair: x -13.9 .. 18.4 (32.3 m), bottom z 12.0 (plaza) -> top z 1.0, 20 risers of 0.16 m */
export const STAIR = { x0: -13.9, x1: 18.4, zTop: 1.0, zBot: 12.0, n: 20 };
/** the retaining walls (3.2 m): north (18.4, 7.4) -> (49.3, 10.2) -> (75.9, 17.5); south mirror (-13.9, 7.4) -> (-41.5, 9.9) -> (-70.0, 17.1) */
export const WALL_N = [[18.4, 7.4], [49.3, 10.2], [75.9, 17.5]];
export const WALL_S = [[-13.9, 7.4], [-41.5, 9.9], [-70.0, 17.1]];
/** the rear restaurant pavilion (the rear V filled up to 7.0 m) and the dome centre */
export const PAV = [[-27.2, -81.5], [26.0, -81.5], [26.0, -77.8], [29.5, -77.8], [38.7, -124.1], [42.3, -142.3], [42.3, -146.0], [-43.3, -146.0], [-43.3, -142.2], [-39.8, -124.1], [-30.7, -77.7], [-27.2, -77.7]];
export const DOME = { x: 0.1, z: -115.8, r: 16.5 };
/** Waterville w17559985 in frame HF [C12] */
export const WATERVILLE = [[-55.3, -226], [-32.7, -232], [-8.2, -235.2], [15, -235.4], [37.8, -230.4], [54, -224.8], [53.4, -213.6], [59.9, -209.6], [52.9, -195.6], [52.8, -170.6], [34.7, -170.7], [35, -164],
  [-36.8, -163.3], [-36.7, -170.5], [-54.2, -170.5], [-54.3, -195.1], [-62.7, -209.3], [-52.5, -212.7]];
export const WV_H = 13.8;
/** the Creators group stands at the frame origin, Peter I at (x -0.2, z 106.6) facing +z */
export const PETER = { x: -0.2, z: 106.6 };
export const CREATORS = { x: 0, z: 0 };
/** the entrance canopy (dark brown flat box over the drive in front of the lobby glass, dossier 4.3 [C8]) */
export const CANOPY = { x0: -12.0, x1: 12.0, z0: -54.2, z1: -43.5, y0: 7.7, y1: 9.0 };

// ---------------------------------------------------------------------------------------------- the Kirov memorial (frame KF)
export const KY = { plat: 0.55, wall: 1.3, turretH: 4.9 };
export const TURRETS = [{ x: 0.0, z: 27.1, pitch: 35 * Math.PI / 180 }, { x: 0.1, z: 42.0, pitch: 30 * Math.PI / 180 }];
export const WALL_ARC = { cx: 0.5, cz: 11.5, r: 24.5 };
export const COLLEGE = { x0: -34.2, x1: 37.9, z0: 72.1, z1: 87.5, h: 20.0 };

/** the real ring of a baked building record as [[x, z], ...] world (fallback: the given ring) */
export function ringOf(id, fallback) {
  try {
    const b = L.buildingById(id);
    if (b && b.polys && b.polys[0]) { const o = b.polys[0].o, r = []; for (let i = 0; i < o.length; i += 2) r.push([o[i], o[i + 1]]); if (r.length >= 3) return r; }
  } catch (e) { /* fall through */ }
  return fallback || null;
}

/** road integrity (docs/AGENT-BRIEF.md): net.cover(x, z) of the streets module (negative = clear of asphalt by that many metres), layout.isOnRoad as the fallback before `streets` exists */
export function coverFn(ctx) {
  const net = ctx.services && ctx.services.streets && ctx.services.streets.net;
  return net && net.cover ? (x, z) => net.cover(x, z, {}) : (x, z) => (L.isOnRoad(x, z, 0) ? 1 : -5);
}
