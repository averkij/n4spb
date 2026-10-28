// landmarksModernVO/frame.js - the model frames of the module (docs/research/modernvo.md section 14.1; every frame is measured on the baked OSM footprints and lies on the rotated Petrine grid of the island).
// A frame has local +x = u (to the RIGHT as seen from the street), +z = the outward normal (towards the street), y up, the front wall plane at z = 0 and the house at z < 0.
// THREE group: position (ox, 0, oz), rotation.y = rot.  world = O + u * (cos rot, -sin rot) + z * (sin rot, cos rot).
// Helpers per frame: W(u, z) -> world {x, z}, M(x, z) -> {u, z}, yawOf(du, dz) = camera yaw (0 north, 90 west, 180 south, -90 east) of a frame direction, enter(P) / leave(P) = push / pop the Parts transform.
// polysOf(ids) gives the baked polygons of building ids ({ o: flat ring, h: [holes] }, world metres); toLocal(F, poly) converts one into the frame (the rings keep their winding, only the axes turn).
import * as L from '../layout.js';

export const DEG = Math.PI / 180;

export function makeFrame(name, ox, oz, rot, len = 0) {
  const C = Math.cos(rot), S = Math.sin(rot);
  const f = { name, ox, oz, rot, C, S, len, U: [C, -S], N: [S, C] };
  f.W = (u, z = 0) => ({ x: ox + C * u + S * z, z: oz - S * u + C * z });
  f.xz = (u, z = 0) => { const p = f.W(u, z); return [p.x, p.z]; };
  f.M = (x, z) => ({ u: C * (x - ox) - S * (z - oz), z: S * (x - ox) + C * (z - oz) });
  f.yawOf = (du, dz) => { const dx = C * du + S * dz, dw = -S * du + C * dz; return Math.atan2(-dx, -dw) / DEG; };
  f.enter = (P) => P.push(ox, 0, oz, rot);
  f.leave = (P) => P.pop();
  return f;
}

// name -> [ox, oz, rot (rad), front length]   (docs/research/modernvo.md 14.1; re-verified by the critic against the polygons to 0.05 m)
const TABLE = {
  SB: [-4481.6, -966.8, 0.5262, 64.1],      // Smirnov house + replica wing, Sredny pr. (bearing 150)
  SA: [-4509.1, -1014.0, -1.0432, 54.63],   // Smirnov, 12th Line (bearing 240)
  EA: [-5502.8, 254.0, -2.5996, 65.72],     // Eremeev 82, the avenue front (bearing 329), tower at u = 65.7
  EW: [-5559.7, 290.4, -1.0311, 24.7],      // Eremeev 82, the west end wall (bearing 239)
  ER46: [-3977.8, -1343.0, 2.0966, 85.67],  // Eremeeva 46, 5th Line (bearing 60)
  BA: [-4649.9, -219.9, -2.6183, 24.0],     // Borkhov 54, Bolshoy (bearing 330), u = 0 is the tower corner
  BB: [-4619.3, -167.1, 2.0960, 61.03],     // Borkhov 54, 19th Line (bearing 60), the tower corner at u = 61
  BC: [-4670.7, -207.9, -2.6177, 63.17],    // Borkhov 56, Bolshoy (bearing 330)
  KA: [-4584.1, -874.0, -2.6182, 29.2],     // Kornilova, Sredny (bearing 330), the tower corner at u = 29.2
  KB: [-4609.4, -859.4, -1.0400, 21.34],    // Kornilova, 14th Line (bearing 240), the tower corner at u = 0
  NA: [-4340.5, -1049.0, 0.5116, 39.2],     // Kornilov, Sredny (bearing 151)
  NB: [-4350.3, -1064.3, -1.0552, 17.2],    // Kornilov, 10th Line (bearing 240)
  ZA: [-4396.9, -1016.0, 0.5260, 35.5],     // Zavarzin, Sredny (bearing 150)
  ZB: [-4365.6, -1035.7, 2.0985, 42.1],     // Zavarzin, 10-11 Lines street (bearing 60)
  TM: [-4754.4, -1349.9, -2.6369, 118.7],   // Teodoridi, Maly (bearing 331), the rounded corner at u = 118.7
  TB: [-4859.4, -1289.5, -1.0508, 46.1],    // Teodoridi, 14th Line (bearing 240)
  KL: [-5725.6, 383.0, -2.6268, 36.8],      // Kollan, Bolshoy (bearing 331), u = 0 is the east end
  MA: [-4598.6, -841.0, -1.0483, 40.27],    // Karl May school, 14th Line (bearing 240)
  SF: [-4915.6, -1328.0, 2.0930, 28.27],    // Kudryavtsev, 15th Line (bearing 60)
  SG: [-4929.7, -1352.5, -2.6470, 77.9],    // Kudryavtsev, the NNW side (bearing 332)
  DE: [-4563.6, -269.5, -2.6217, 35.03],    // Demidov, Bolshoy (bearing 330)
};
export const FR = {};
for (const [k, v] of Object.entries(TABLE)) FR[k] = makeFrame(k, v[0], v[1], v[2], v[3]);

const toRing = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };
/** the baked polygons ({ o, h }) of the given building ids (world metres); missing ids are reported through `miss` */
export function polysOf(ids, miss) {
  const out = [];
  for (const id of ids) {
    let b = null; try { b = L.buildingById(id); } catch (e) { b = null; }
    if (!b || !b.polys || !b.polys.length) { if (miss) miss.push(id); continue; }
    for (const p of b.polys) out.push({ id, o: p.o.slice(), h: p.h.map((q) => q.slice()) });
  }
  return out;
}
/** a world polygon in the frame F ({ o, h } flat rings of (u, z)) */
export function toLocal(F, poly) {
  const cv = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) { const m = F.M(flat[i], flat[i + 1]); r.push(m.u, m.z); } return r; };
  return { id: poly.id, o: cv(poly.o), h: poly.h.map(cv) };
}
export { toRing };
