// landmarksMarineFacade/frame.js - the model frames and the fixed numbers of the module (docs/research/marinefacade.md sections 2, 4.2, 17).
//   F  frame of the passenger port: origin (-9002, -1247) = the re-entrant corner of the berth walls; local +x = u along the SOUTH wall to the WNW (unit (-0.9575, -0.2885)), local +z = v along the EAST
//      wall to the NNE (unit (0.2885, -0.9575)); three.js rotation.y = +2.8489.  The water of the basin is u > 0, v > 0: the south arm is v < 0, the east arm u < 0 (the real east wall lies ~6 m
//      west of u = 0: use quayEdge()), the north arm v > 845.  world(u, v) = F + C u + S v.
//   G  frame of the Golden City spire tower (OSM r10034571, quarter 6 building 2): origin (-8715.7, -967.0), local +x along the long axis toward the SSW, local +z across (WSW); rotation.y = -1.7785.
//   TERMS  the four terminals: measured ROOF rectangles in F (the OSM polygons are only the glazed volume), the high end and the strut side of the wedge (dossier 17.2).
import * as L from '../layout.js';

export const F = { x: -9002, z: -1247, rot: 2.8489 };
const C = Math.cos(F.rot), S = Math.sin(F.rot);
/** port (u, v) -> world { x, z } */
export const FW = (u, v) => ({ x: F.x + C * u + S * v, z: F.z - S * u + C * v });
/** world (x, z) -> port { u, v } */
export const FM = (x, z) => ({ u: C * (x - F.x) - S * (z - F.z), v: S * (x - F.x) + C * (z - F.z) });
/** world unit vectors of u and v */
export const U_DIR = [C, -S], V_DIR = [S, C];
/** rotation.y of an object whose local +x runs along the port direction angle `a` (radians in the u-v plane, 0 = +u, PI/2 = +v) */
export const rotOf = (a) => F.rot - a;

export const G = { x: -8715.7, z: -967.0, rot: -1.7785 };
const GC = Math.cos(G.rot), GS = Math.sin(G.rot);
export const GW = (a, b) => ({ x: G.x + GC * a + GS * b, z: G.z - GS * a + GC * b });
export const GM = (x, z) => ({ a: GC * (x - G.x) - GS * (z - G.z), b: GS * (x - G.x) + GC * (z - G.z) });

export const WATER_Y = -3.4;                                     // WATERWAYS.neva.water (vo-banks: every water of the island)

/** the four terminals.  roof = measured roof rectangle in F (u0, u1, v0, v1); high = which end of the roof rectangle is the HIGH (3-storey, glazed, leaning front) end; strut = the long side that carries the
 *  inclined struts and the cantilever (the road side); poly = the OSM polygon rectangle (the glazed volume); n = the number on the name plate. */
export const TERMS = [
  { id: 'w41575292', key: 't1', n: 1, roof: { u0: 260.3, u1: 378.5, v0: -81.6, v1: -21.3 }, poly: { u0: 269.2, u1: 378.4, v0: -77.7, v1: -17.8 }, high: 'u0', strut: 'v0', plant: 35, plate: 'berth' },
  { id: 'w95606143', key: 't2', n: 2, roof: { u0: -99.2, u1: -29.8, v0: 189.7, v1: 281.8 }, poly: { u0: -83.0, u1: -29.2, v0: 191.1, v1: 275.6 }, high: 'v1', strut: 'u0', plant: 8 },
  { id: 'w95606141', key: 't3', n: 3, roof: { u0: -126.5, u1: -30.0, v0: 611.3, v1: 684.2 }, poly: { u0: -116.0, u1: -31.6, v0: 611.0, v1: 679.7 }, high: 'u0', strut: 'v1', plant: 10 },
  { id: 'w157323819', key: 't4', n: 4, roof: { u0: 320, u1: 426, v0: 876, v1: 940 }, poly: { u0: 322.5, u1: 426.7, v0: 875.0, v1: 935.6 }, high: 'u0', strut: 'v1', plant: 12 },
];

/** the control centre w95606142 (frame F rectangle) */
export const CUP = { id: 'w95606142', u0: -60.6, u1: -37.3, v0: 413.8, v1: 433.8 };

/** height of the gallery eave / crown etc. */
export const HT = { gallery: 5.4 };

/** world height-fn helpers: true when (x, z) is water (the basin, the Gulf) */
export const inWater = (x, z) => L.inRiver(x, z);

/** The real quay edge (the first water sample) along a wall, measured with layout.inRiver (the raster of the water module): side 'south' (param u, search v -10 .. 10), 'east' (param v, search u -14 .. 8),
 *  'north' (param u, search v 830 .. 856 coming from the water).  Returns the coordinate of the edge (v for south / north, u for east) or null. */
export function quayEdge(side, s) {
  const probe = (a, b) => { const p = FW(a, b); return L.inRiver(p.x, p.z); };
  if (side === 'south') { for (let v = -10; v <= 10; v += 0.25) if (probe(s, v)) return v - 0.125; return null; }
  if (side === 'east') { for (let u = -14; u <= 8; u += 0.25) if (probe(u, s)) return u - 0.125; return null; }
  if (side === 'north') { for (let v = 830; v <= 858; v += 0.25) if (!probe(s, v)) return v - 0.125; return null; }
  return null;
}
