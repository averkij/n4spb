// landmarksSredny/frame.js - the model frames of the module (docs/research/sredny.md section 2; every frame is the rotated Petrine grid of the island, nothing is axis-aligned).
// A frame has local +x = a (ENE along the prospects, world unit (C, -S)), local +z = b (SSE toward the Neva, world unit (S, C)), y up; three.js rotation.y = rot.  world(a, b) = O + a (C, -S) + b (S, C).
//   D  depot (sheds, admin blocks, yard)            origin (-5110, -760)         rot 29.6 deg   sheds' ends face +x / -x, the admin blocks face +z (Sredny pr.)
//   G  Geological Committee (Sredny 74)             origin (-5030.7, -615.3)     rot 29.6 deg   front faces -z (NNW, toward Sredny pr.)
//   E  Dom Evangelia (24th line 3-7)                origin (-4948.0, 135.0)      rot 29.6 deg   street front faces -x (WSW)
//   F  Frank mansion (21st line 8A)                 origin (-4774.6, -18.0)      rot 29.6 deg   main front faces +x (ENE)
//   T  Chernikhov tower + rope shop (25th line 4)   origin (-4918.7, 364.1)      rot 29.25 deg  tower at the SSE end, tank on the +x side (the hall edges lie at 29.25 deg, critic C10)
// The pavilion frames of the Gorny Institut (door frame: local +z = out through the door) are built in gorny.js from the baked footprints.
// Helpers per frame: W(a, b) -> world {x, z}, M(x, z) -> {a, b}, wall / box / cyl / walk colliders, enter(P) / leave(P) = push / pop the Parts transform.
import * as THREE from 'three';
import * as L from '../layout.js';

export const DEG = Math.PI / 180;

export function makeFrame(name, ox, oz, rot) {
  const C = Math.cos(rot), S = Math.sin(rot);
  const f = { name, ox, oz, rot, C, S, dirA: [C, -S], dirB: [S, C] };
  f.W = (a, b) => ({ x: ox + C * a + S * b, z: oz - S * a + C * b });
  f.M = (x, z) => ({ a: C * (x - ox) - S * (z - oz), b: S * (x - ox) + C * (z - oz) });
  f.xz = (a, b) => { const p = f.W(a, b); return [p.x, p.z]; };
  /** world yaw (camera convention: 0 north, 90 west, 180 south, -90 east) of a frame direction (da, db) */
  f.yawOf = (da, db) => { const dx = C * da + S * db, dz = -S * da + C * db; return Math.atan2(-dx, -dz) / DEG; };
  /** rotY of a model whose front (+z) points along the frame direction (da, db) */
  f.rotOf = (da, db) => Math.atan2(C * da + S * db, -S * da + C * db);
  /** thin solid wall between two frame points p, q ([a, b]) from y0 to y1, t thick */
  f.wall = (ph, p, q, y0, y1, t = 0.4) => {
    const A = f.W(p[0], p[1]), B = f.W(q[0], q[1]), len = Math.hypot(B.x - A.x, B.z - A.z);
    if (len < 0.05) return null;
    return ph.addBox((A.x + B.x) / 2, (A.z + B.z) / 2, len, t, Math.atan2(-(B.z - A.z), B.x - A.x), y0, y1);
  };
  /** solid box centred at frame (a, b), size da x db, y range */
  f.box = (ph, a, b, da, db, y0, y1) => { const p = f.W(a, b); return ph.addBox(p.x, p.z, da, db, rot, y0, y1); };
  f.cyl = (ph, a, b, r, y0, y1) => { const p = f.W(a, b); return ph.addCylinder(p.x, p.z, r, y0, y1); };
  /** walk box (floor / step) centred at frame (a, b) */
  f.walk = (ph, a, b, da, db, top, bottom) => { const p = f.W(a, b); return ph.addWalkBox(p.x, p.z, da, db, rot, top, bottom); };
  f.stairs = (ph, a, b, da, db, y0, y1, n, along = 'b') => { const p = f.W(a, b); return ph.addStairs(p.x, p.z, da, db, rot, y0, y1, n); };
  f.enter = (P) => P.push(ox, 0, oz, rot);
  f.leave = (P) => P.pop();
  return f;
}

export const ROT = 29.6 * DEG;
export const FR = {
  D: makeFrame('D', -5110, -760, ROT),
  G: makeFrame('G', -5030.7, -615.3, ROT),
  E: makeFrame('E', -4948.0, 135.0, ROT),
  F: makeFrame('F', -4774.6, -18.0, ROT),
  T: makeFrame('T', -4918.7, 364.1, 29.25 * DEG),
};

/** a frame from a rectangle-ish footprint ring [[x, z]..]: origin = the mean of the corners, rot = rotY of the direction `dir` ([dx, dz] = the way the local +z points) */
export function ringCentre(ring) { let x = 0, z = 0; for (const p of ring) { x += p[0]; z += p[1]; } return [x / ring.length, z / ring.length]; }
export const toRing = (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) r.push([flat[i], flat[i + 1]]); return r; };

/** the baked polygon of a building id as a ring of [x, z] (or null) */
export function ringOf(id) {
  try { const b = L.buildingById(id); return b && b.polys && b.polys[0] ? toRing(b.polys[0].o) : null; } catch (e) { return null; }
}
void THREE;
