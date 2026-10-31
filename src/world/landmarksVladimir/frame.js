// landmarksVladimir/frame.js - local frames of the sights of the module (docs/research/vladimir.md, all measured on the baked OSM data of region P2).
//   makeFrame(ox, oz, zx, zz): a model frame whose origin is (ox, oz) and whose local +z points along the world direction (zx, zz); local +x is to the RIGHT of a viewer who looks at the
//   +z face from outside (three's rotation.y convention: local +x -> world (cos, -sin), local +z -> world (sin, cos)).  F.W(mx, mz) -> world {x, z}; F.M(x, z) -> local {mx, mz}; F.rot.
//   CATH  the cathedral: origin = the central dome (-3113.5, -2145.4); +z = WEST along the nave (to the bell tower and the main door), +x = south.
//   SITE  the judicial quarter: origin = the north-west corner of the Dance Palace plot; +x = u along pr. Dobrolyubova to the ESE, +z = v to the river (SSW).
//   BUYAN Tuchkov Buyan: origin = the middle of the river front; +z = OUT to the river (SW), +x = along the front to the WNW (right of a viewer on the water).
export function makeFrame(ox, oz, zx, zz) {
  const l = Math.hypot(zx, zz) || 1, sx = zx / l, sz = zz / l, rot = Math.atan2(sx, sz), cs = Math.cos(rot), sn = Math.sin(rot);
  const W = (mx, mz) => ({ x: ox + mx * cs + mz * sn, z: oz - mx * sn + mz * cs });
  const M = (x, z) => { const dx = x - ox, dz = z - oz; return { mx: dx * cs - dz * sn, mz: dx * sn + dz * cs }; };
  return {
    ox, oz, rot, W, M,
    /** flat ring [x, z, ...] of the world -> local ring [[mx, mz]..] */
    ring: (flat) => { const r = []; for (let i = 0; i < flat.length; i += 2) { const m = M(flat[i], flat[i + 1]); r.push([m.mx, m.mz]); } return r; },
    /** local ring -> world poly { o, h } */
    poly: (ring, holes = []) => ({ o: ring.flatMap(([a, b]) => { const p = W(a, b); return [p.x, p.z]; }), h: holes.map((h) => h.flatMap(([a, b]) => { const p = W(a, b); return [p.x, p.z]; })) }),
    box: (ph, mx, mz, w, d, r, y0, y1) => { const p = W(mx, mz); return ph.addBox(p.x, p.z, w, d, r + rot, y0, y1); },
    cyl: (ph, mx, mz, rad, y0, y1) => { const p = W(mx, mz); return ph.addCylinder(p.x, p.z, rad, y0, y1); },
    walk: (ph, mx, mz, w, d, r, top, bottom) => { const p = W(mx, mz); return ph.addWalkBox(p.x, p.z, w, d, r + rot, top, bottom); },
    /** rotY of a thing in the model frame that faces the local direction (dx, dz) */
    face: (dx, dz) => Math.atan2(dx, dz) + rot,
  };
}

// the cathedral: nave axis = the long south wall of OSM w109067002, (-3151.2, -2137.1) -> (-3101.7, -2129.4): east = (0.9881, 0.1537); the model looks WEST
export const CATH = makeFrame(-3113.5, -2145.4, -0.9881, -0.1537);
// the judicial quarter: u = (0.8645, 0.5025) (the long edges of the plots), v = (-0.5025, 0.8645); +z = v needs +x = u: zx, zz = v
export const SITE = makeFrame(-3102.8, -1988.0, -0.5025, 0.8645);
// Tuchkov Buyan: front line (-3493.7, -1887.9) -> (-3318.1, -1783.4), middle (-3405.9, -1835.65); outward (river) normal = (-0.5114, 0.8594)
export const BUYAN = makeFrame(-3405.9, -1835.65, -0.5114, 0.8594);
// the chapel of St Alexander Nevsky (OSM w117478061): a 9 m cross whose arms follow the footprint edges (bearing of the first edge (-3379, -2230) -> (-3382.9, -2232.9))
export const CHAPEL = makeFrame(-3377.1, -2234.6, -0.8025, -0.5967);

/** push the frame of a wall from a to b ([x, z] in the CURRENT frame) with the outward side given by a point `inside` ([x, z]): origin at the left end seen from outside, +z out; fn(len) */
export function onWall(P, a, b, inside, fn) {
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1e-6;
  let nx = dz / len, nz = -dx / len;
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  if (nx * (inside[0] - mx) + nz * (inside[1] - mz) > 0) { nx = -nx; nz = -nz; }
  const xa = [nz, -nx], fwd = dx * xa[0] + dz * xa[1] > 0, o = fwd ? a : b;
  P.push(o[0], 0, o[1], Math.atan2(nx, nz));
  try { return fn(len, { o, n: [nx, nz], t: xa }); } finally { P.pop(); }
}
/** every edge of a local ring [[x, z]..] as a wall frame: fn(len, i, info) */
export function onRing(P, ring, fn, inside) {
  const c = inside || ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  for (let i = 0; i < ring.length; i++) onWall(P, ring[i], ring[(i + 1) % ring.length], c, (len, info) => fn(len, i, info));
}
