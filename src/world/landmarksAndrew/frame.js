// landmarksAndrew/frame.js - the model frames of the module (docs/research/andrew.md section 2; every number re-measured on the baked OSM footprints by the critic pass).
// All building frames share the SAME axes of the rotated Petrine grid: local +x = a (unit (0.8660, -0.5000), bearing 60, toward the Spit / ENE), local +z = b (unit (0.5000, 0.8660), bearing 150, SSE),
// y up; world = origin + a * ax + b * bz; three.js group.rotation.y = +30 deg (local (1,0,0) -> world (0.866, 0, -0.5), local (0,0,1) -> (0.5, 0, 0.866)).
//   C  cathedral frame (origin the OSM centroid of w84046074): cathedral, chapel, obelisk, bust, fences, forecourt;     T  Three Hierarchs church (w84046107)
//   M  market (r1198837): a across (59.5 m), b along (150.8 m);   V  Vasileostrovskaya pavilion (w183122885);   P  Pel house + the Griffins Tower (r1193123);   N  Annunciation church + forecourt + garden
//   B  the boulevard frame (s along the street SSE, q across toward ENE; rotation 30.21 deg), origin = the Sredny pr. kerb at the pavilion square
// W(a, b) -> world { x, z };  M(x, z) -> local { a, b };  Parts: P.push(F.ox, 0, F.oz, F.rot) puts the collector into the frame.
export const R30 = Math.PI / 6;

function frame(ox, oz, rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return {
    ox, oz, rot, c, s,
    /** local (a, b) -> world { x, z } */
    W: (a, b) => ({ x: ox + c * a + s * b, z: oz - s * a + c * b }),
    /** world (x, z) -> local { a, b } */
    M: (x, z) => ({ a: c * (x - ox) - s * (z - oz), b: s * (x - ox) + c * (z - oz) }),
    /** rotY (three.js) of a thing whose +z faces the local direction (da, db) */
    face: (da, db) => Math.atan2(da * c + db * s, -da * s + db * c),
    /** world direction of local axes */
    A: [c, -s], B: [s, c],
  };
}
export const FC = frame(-3802.7, -820.6, R30);
export const FT = frame(-3829.1, -848.1, R30);
export const FM = frame(-3713.3, -679.3, R30);
export const FV = frame(-4084.3, -1132.1, R30);
export const FP = frame(-3789.7, -631.1, R30);
export const FN = frame(-4299.0, -1496.7, R30);
/** boulevard: s along (SSE, from the Sredny pr. kerb toward Bolshoy pr.), q across (ENE); x = -4065 + 0.5031 s + 0.8642 q, z = -1179 + 0.8642 s - 0.5031 q */
export const FB = frame(-4065, -1179, 0.5273);
/** the boulevard frame has (q, s) as (x, z): B.W(q, s) */
export const BW = (s, q) => FB.W(q, s);
export const BM = (x, z) => { const m = FB.M(x, z); return { s: m.b, q: m.a }; };

/** convenience: the generic geometry helpers in world metres */
export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const yawOf = (x, z, tx, tz) => Math.atan2(-(tx - x), -(tz - z)) * 180 / Math.PI;   // camera yaw (degrees, 0 north, 90 west) of the line of sight from (x, z) to (tx, tz)

/** boulevard cross-section (docs/research/andrew.md 5.2 / 5.3, critic-corrected): q across, s along */
export const BLV = {
  qW: -5.5, qE: 22.3,           // facade lines (28 m between facades)
  lawn0: 3.1, lawn1: 14.2,      // the lawn strip between the two promenades (11.1 m)
  s0: 72.2, s1: 425.5,          // lawn strip ends along s
  len: 479,                     // street length (Sredny kerb -> Bolshoy kerb)
  alley0: 6.2, alley1: 10.7,    // the central alley (4.5 m)
};
