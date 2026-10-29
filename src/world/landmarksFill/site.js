// landmarksFill/site.js - the STATIC parts of the building sites: reinforced-concrete frames at three stages (topped out and half clad / bare frame / foundation field), tower cranes, the concrete batching plant, the graded
// pads. Everything is built in the LOCAL frame of the site (x along the coast, z inland, origin at the plot centre) into one Parts collector per site; the colliders are added in world metres by K.box (the structures are
// solid on purpose: columns, cores, walls, crane masts, silos: docs/gdm-D2.md). No flags, no flagpoles, no aircraft lights (user rules).
import { toWorld } from './plan.js';

const FLOOR = 3.2, SLAB = 0.3;

/** one solid box in the site frame -> world (a structure) */
export function solid(K, S, lx, lz, w, d, y0, y1) {
  const [x, z] = toWorld(S.cx, S.cz, S.rot, lx, lz);
  const h = K.ctx.physics.addBox(x, z, w, d, S.rot, y0, y1); K.svc.colliders++; return h;
}
const solidCyl = (K, S, lx, lz, r, y0, y1) => { const [x, z] = toWorld(S.cx, S.cz, S.rot, lx, lz); K.svc.colliders++; return K.ctx.physics.addCylinder(x, z, r, y0, y1); };

const FACADES = ['#cdc6b4', '#b8bfc6', '#c78f70', '#d4c9a6'];

/** a frame: a box-shaped building under construction. o = { x, z (centre), w, d, floors, clad (floors with cladding), seed } */
export function frame(K, S, o, rng) {
  const P = K.P, M = K.M, PAL = M.PAL, H = o.floors * FLOOR, hw = o.w / 2, hd = o.d / 2, fac = FACADES[Math.floor(rng() * FACADES.length)];
  P.push(o.x, 0, o.z, 0);
  // the ground slab / strip footings, the columns on a 6 m grid, the slabs, the core
  P.tint(PAL.concreteDark).box(M.vc, -hw - 0.6, hw + 0.6, 0, 0.35, -hd - 0.6, hd + 0.6, 'b', 2);
  const nx = Math.max(1, Math.ceil(o.w / 6.4)), nz = Math.max(1, Math.ceil(o.d / 6.4)), cols = [];
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) cols.push([-hw + o.w * i / nx, -hd + o.d * j / nz]);
  P.tint(PAL.concrete);
  for (const [x, z] of cols) P.box(M.vc, x - 0.28, x + 0.28, 0.35, H + 0.9, z - 0.28, z + 0.28, 'b', 2);
  P.tint(PAL.slab);
  for (let f = 1; f <= o.floors; f++) { const y = f * FLOOR; P.box(M.vc, -hw - 0.25, hw + 0.25, y - SLAB, y, -hd - 0.25, hd + 0.25, '', 2); }
  // the core (stairs and lifts): 6 x 7 m, one floor and a half above the top slab (the climbing formwork)
  const cx = hw - 4.2, cz = 0;
  P.tint(PAL.concreteDark).box(M.vc, cx - 3, cx + 3, 0.35, H + 4.6, cz - 3.5, cz + 3.5, 'b', 2);
  // cladding of the lower floors: a wall panel and a dark window band per floor and side (the facade of the finished storeys)
  for (let f = 0; f < o.clad; f++) {
    const y0 = f * FLOOR + (f ? 0 : 0.35), y1 = (f + 1) * FLOOR - SLAB;
    P.tint(fac);
    P.box(M.vc, -hw - 0.1, hw + 0.1, y0, y1, hd - 0.18, hd + 0.02, 'tb', 2); P.box(M.vc, -hw - 0.1, hw + 0.1, y0, y1, -hd - 0.02, -hd + 0.18, 'tb', 2);
    P.box(M.vc, -hw - 0.02, -hw + 0.18, y0, y1, -hd, hd, 'tb', 2); P.box(M.vc, hw - 0.18, hw + 0.02, y0, y1, -hd, hd, 'tb', 2);
    const g = f ? 0.9 : 1.1, g1 = y1 - 0.45;
    P.tint(PAL.glass);
    P.quad(M.vc, [-hw + 1, y0 + g, hd + 0.04], [hw - 1, y0 + g, hd + 0.04], [hw - 1, g1, hd + 0.04], [-hw + 1, g1, hd + 0.04], [0, 0, 1]);
    P.quad(M.vc, [hw - 1, y0 + g, -hd - 0.04], [-hw + 1, y0 + g, -hd - 0.04], [-hw + 1, g1, -hd - 0.04], [hw - 1, g1, -hd - 0.04], [0, 0, -1]);
    P.quad(M.vc, [hw + 0.04, y0 + g, hd - 1], [hw + 0.04, y0 + g, -hd + 1], [hw + 0.04, g1, -hd + 1], [hw + 0.04, g1, hd - 1], [1, 0, 0]);
    P.quad(M.vc, [-hw - 0.04, y0 + g, -hd + 1], [-hw - 0.04, y0 + g, hd - 1], [-hw - 0.04, g1, hd - 1], [-hw - 0.04, g1, -hd + 1], [-1, 0, 0]);
  }
  // the top: a safety net round the top two slabs (a green double-sided strip), the edge formwork, a stack of formwork tables
  if (o.floors >= 3) {
    P.tint(PAL.green);
    for (const f of [o.floors - 1, o.floors]) {
      const y = f * FLOOR;
      P.quad(M.vc2, [-hw - 0.3, y, hd + 0.3], [hw + 0.3, y, hd + 0.3], [hw + 0.3, y + 1.2, hd + 0.3], [-hw - 0.3, y + 1.2, hd + 0.3], [0, 0, 1]);
      P.quad(M.vc2, [hw + 0.3, y, -hd - 0.3], [-hw - 0.3, y, -hd - 0.3], [-hw - 0.3, y + 1.2, -hd - 0.3], [hw + 0.3, y + 1.2, -hd - 0.3], [0, 0, -1]);
      P.quad(M.vc2, [hw + 0.3, y, hd + 0.3], [hw + 0.3, y, -hd - 0.3], [hw + 0.3, y + 1.2, -hd - 0.3], [hw + 0.3, y + 1.2, hd + 0.3], [1, 0, 0]);
      P.quad(M.vc2, [-hw - 0.3, y, -hd - 0.3], [-hw - 0.3, y, hd + 0.3], [-hw - 0.3, y + 1.2, hd + 0.3], [-hw - 0.3, y + 1.2, -hd - 0.3], [-1, 0, 0]);
    }
    P.tint('#8a6b43');
    for (let k = 0; k < 4; k++) { const x = -hw + 3 + rng() * (o.w - 9), z = -hd + 3 + rng() * (o.d - 9); P.box(M.vc, x, x + 4.8, H, H + 0.55, z, z + 2.4, 'b', 1); }
    // the construction hoist: a lattice mast on the long facade with its landing gate
    const hx = -hw + 8 + rng() * (o.w - 18);
    P.quad(M.lattice, [hx - 0.6, 0.4, hd + 1.2], [hx + 0.6, 0.4, hd + 1.2], [hx + 0.6, H + 3, hd + 1.2], [hx - 0.6, H + 3, hd + 1.2], [0, 0, 1], [[0, 0], [1, 0], [1, (H + 2.6) / 1.2], [0, (H + 2.6) / 1.2]]);
    P.quad(M.lattice, [hx + 0.6, 0.4, hd + 2.2], [hx - 0.6, 0.4, hd + 2.2], [hx - 0.6, H + 3, hd + 2.2], [hx + 0.6, H + 3, hd + 2.2], [0, 0, -1], [[0, 0], [1, 0], [1, (H + 2.6) / 1.2], [0, (H + 2.6) / 1.2]]);
    P.tint(PAL.orange).box(M.vc, hx - 0.75, hx + 0.75, 0.4, 3.2, hd + 1.15, hd + 2.25, '', 2);
  }
  P.pop();
  // colliders: columns (thin), the core, and the first-floor walls of a clad building (a 4 m doorway in the middle of the long south side stays open)
  for (const [x, z] of cols) solid(K, S, o.x + x, o.z + z, 0.56, 0.56, 0, H + 0.9);
  solid(K, S, o.x + cx, o.z + cz, 6, 7, 0, H + 4.6);
  if (o.clad > 0) {
    solid(K, S, o.x, o.z - hd, o.w, 0.4, 0, FLOOR); solid(K, S, o.x - hw, o.z, 0.4, o.d, 0, FLOOR); solid(K, S, o.x + hw, o.z, 0.4, o.d, 0, FLOOR);
    const gx = 4, w1 = (o.w - gx) / 2; solid(K, S, o.x - hw + w1 / 2, o.z + hd, w1, 0.4, 0, FLOOR); solid(K, S, o.x + hw - w1 / 2, o.z + hd, w1, 0.4, 0, FLOOR);
  }
  return { x: o.x, z: o.z, w: o.w, d: o.d, H };
}

/** a foundation field: pile heads on a grid, strip footings poured over a part of it, the starter bars of the first columns */
export function foundation(K, S, o, rng) {
  const P = K.P, M = K.M, PAL = M.PAL, hw = o.w / 2, hd = o.d / 2;
  P.push(o.x, 0, o.z, 0);
  const nx = Math.floor(o.w / 4.6), nz = Math.floor(o.d / 4.6), poured = 0.35 + rng() * 0.3;
  P.tint(PAL.concreteDark);
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
    const x = -hw + o.w * i / nx, z = -hd + o.d * j / nz;
    if (i / nx < poured) P.box(M.vc, x - 0.22, x + 0.22, 0, 0.12 + rng() * 0.05, z - 0.22, z + 0.22, 'b', 2); else P.box(M.vc, x - 0.17, x + 0.17, 0, 0.32 + rng() * 0.2, z - 0.17, z + 0.17, 'b', 2);
  }
  P.tint(PAL.slab).box(M.vc, -hw - 0.5, -hw + o.w * poured, 0, 0.5, -hd - 0.5, hd + 0.5, 'b', 2);
  P.tint(PAL.steelDark);
  for (let i = 0; i < 14; i++) { const x = -hw + 1 + rng() * (o.w * poured - 2), z = -hd + 1 + rng() * (o.d - 2); P.box(M.vc, x - 0.02, x + 0.02, 0.5, 1.7, z - 0.02, z + 0.02, 'b', 1); }
  P.pop();
  // no collider: the footings and the pile heads are ankle high and flat (0.5 m at most), like a kerb
}

/** a tower crane in the local frame at (x, z), mast height H, jib length Lj, yaw a (radians about the vertical) */
export function crane(K, S, o, rng) {
  const P = K.P, M = K.M, PAL = M.PAL, H = o.H, Lj = o.L, col = o.white ? '#d9dad4' : PAL.yellow, hi = H + 1.5;
  P.push(o.x, 0, o.z, 0);
  P.tint(PAL.concrete).box(M.vc, -2.6, 2.6, 0, 1.2, -2.6, 2.6, 'b', 2);
  // the mast: four chord posts and four lattice faces
  P.tint(col);
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) P.box(M.vc, x - 0.08, x + 0.08, 1.2, H, z - 0.08, z + 0.08, 'b', 1);
  const nT = (H - 1.2) / 1.6;
  const face = (a, b, n) => P.quad(M.lattice, [a[0], 1.2, a[1]], [b[0], 1.2, b[1]], [b[0], H, b[1]], [a[0], H, a[1]], n, [[0, 0], [1, 0], [1, nT], [0, nT]]);
  face([-0.8, 0.8], [0.8, 0.8], [0, 0, 1]); face([0.8, -0.8], [-0.8, -0.8], [0, 0, -1]); face([0.8, 0.8], [0.8, -0.8], [1, 0, 0]); face([-0.8, -0.8], [-0.8, 0.8], [-1, 0, 0]);
  // the slewing unit, the cab, the cathead, the jib and the counter-jib (rotated by a)
  P.push(0, 0, 0, o.a);
  P.tint(PAL.steelDark).box(M.vc, -1.3, 1.3, H, H + 0.9, -1.3, 1.3, 'b', 1);
  P.tint(col).box(M.vc, 1.0, 2.6, H + 0.9, H + 2.7, -1.9, -0.3, '', 1); P.tint(PAL.glass).quad(M.vc, [2.62, H + 1.3, -1.8], [2.62, H + 1.3, -0.4], [2.62, H + 2.4, -0.4], [2.62, H + 2.4, -1.8], [1, 0, 0]);
  P.tint(col).cyl(M.vc, [0, H + 0.9, 0], [0, H + 7.5, 0], 0.7, 0.12, 4, false);
  const yj = H + 1.5;
  P.tint(col);
  P.box(M.vc, -0.2, Lj, yj, yj + 0.1, -0.85, -0.65, '', 1); P.box(M.vc, -0.2, Lj, yj, yj + 0.1, 0.65, 0.85, '', 1); P.box(M.vc, -0.2, Lj, yj + 1.9, yj + 2.0, -0.06, 0.06, '', 1);
  const nj = Lj / 1.9;
  P.quad(M.lattice, [-0.2, yj, 0.75], [Lj, yj, 0.75], [Lj, yj + 1.95, 0.0], [-0.2, yj + 1.95, 0.0], [0, 0, 1], [[0, 0], [nj, 0], [nj, 1], [0, 1]]);
  P.quad(M.lattice, [Lj, yj, -0.75], [-0.2, yj, -0.75], [-0.2, yj + 1.95, 0.0], [Lj, yj + 1.95, 0.0], [0, 0, -1], [[0, 0], [nj, 0], [nj, 1], [0, 1]]);
  P.quad(M.lattice, [-0.2, yj, -0.75], [Lj, yj, -0.75], [Lj, yj, 0.75], [-0.2, yj, 0.75], [0, 1, 0], [[0, 0], [nj, 0], [nj, 1], [0, 1]]);
  // counter-jib: 13 m behind, with the ballast blocks
  P.box(M.vc, -13, 0.2, yj, yj + 0.1, -0.7, -0.5, '', 1); P.box(M.vc, -13, 0.2, yj, yj + 0.1, 0.5, 0.7, '', 1);
  P.quad(M.lattice, [-13, yj, 0.6], [0.2, yj, 0.6], [0.2, yj + 1.2, 0], [-13, yj + 1.2, 0], [0, 0, 1], [[0, 0], [7, 0], [7, 1], [0, 1]]);
  P.quad(M.lattice, [0.2, yj, -0.6], [-13, yj, -0.6], [-13, yj + 1.2, 0], [0.2, yj + 1.2, 0], [0, 0, -1], [[0, 0], [7, 0], [7, 1], [0, 1]]);
  P.tint(PAL.concreteDark); for (let k = 0; k < 4; k++) P.box(M.vc, -12.6 + k * 1.9, -11.0 + k * 1.9, yj - 1.5, yj, -0.8, 0.8, 'b', 1);
  // the pendants (tie bars) from the cathead to the jib and the counter-jib, the trolley, the hoist rope and the hook block
  P.tint(PAL.steelDark);
  P.cyl(M.vc, [0, H + 7.5, 0], [Lj * 0.55, yj + 0.1, 0], 0.035, 0.035, 4, false); P.cyl(M.vc, [0, H + 7.5, 0], [Lj * 0.95, yj + 0.1, 0], 0.035, 0.035, 4, false); P.cyl(M.vc, [0, H + 7.5, 0], [-11, yj + 0.1, 0], 0.035, 0.035, 4, false);
  const tx = Lj * (0.35 + rng() * 0.4), drop = Math.min(H * 0.55, 6 + rng() * 22);
  P.box(M.vc, tx - 0.7, tx + 0.7, yj - 0.45, yj + 0.1, -0.5, 0.5, '', 1);
  P.cyl(M.vc, [tx, yj - 0.45, 0], [tx, yj - drop, 0], 0.03, 0.03, 4, false); P.tint(col).box(M.vc, tx - 0.35, tx + 0.35, yj - drop - 1.1, yj - drop, -0.25, 0.25, '', 1);
  P.pop();
  P.pop();
  solid(K, S, o.x, o.z, 5.2, 5.2, 0, 1.2); solid(K, S, o.x, o.z, 1.8, 1.8, 0, H + 0.9);
}

/** the concrete batching plant: four silos on legs, a mixer tower, a charging ramp, three aggregate bunkers */
export function plant(K, S, o, rng) {
  const P = K.P, M = K.M, PAL = M.PAL;
  P.push(o.x, 0, o.z, 0);
  // silos
  for (let i = 0; i < 4; i++) {
    const x = -18 + i * 5.4, z = -12;
    P.tint('#d7d6d0').cyl(M.vc, [x, 5.2, z], [x, 15.5, z], 1.9, 1.9, 10, true);
    P.cyl(M.vc, [x, 3.4, z], [x, 5.2, z], 0.5, 1.9, 10, false);
    P.tint(PAL.steel); for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) P.box(M.vc, x + dx - 0.12, x + dx + 0.12, 0, 5.2, z + dz - 0.12, z + dz + 0.12, 'b', 1);
    solidCyl(K, S, o.x + x, o.z + z, 2.0, 0, 15.5);
  }
  P.tint(PAL.blue).box(M.vc, -8, 3.5, 3.4, 10.5, -8, -2.5, '', 2);                                     // the mixer house
  P.tint(PAL.steelDark).box(M.vc, -8.4, 3.9, 10.5, 10.9, -8.4, -2.1, 'b', 2);
  solid(K, S, o.x - 2.25, o.z - 5.25, 11.5, 5.5, 0, 10.9);
  P.tint(PAL.steel).cyl(M.vc, [-4, 0.6, 6], [-4, 9.8, -2.5], 0.55, 0.55, 4, false);                          // the charging belt
  for (let k = 0; k < 3; k++) {
    const x = -16 + k * 11;
    P.tint('#8d8a82').box(M.vc, x, x + 9, 0, 2.6, 6, 6.35, '', 1); P.box(M.vc, x, x + 9, 0, 2.6, 14.65, 15, '', 1); P.box(M.vc, x, x + 0.35, 0, 2.6, 6, 15, '', 1); P.box(M.vc, x + 8.65, x + 9, 0, 2.6, 6, 15, '', 1);
    P.tint(k === 0 ? PAL.sand : k === 1 ? PAL.gravel : '#a39d8e').cyl(M.vc, [x + 4.5, 0, 10.3], [x + 4.5, 2.1, 10.3], 4.2, 0.8, 10, false);
    solid(K, S, o.x + x + 4.5, o.z + 6.2, 9, 0.35, 0, 2.6); solid(K, S, o.x + x + 4.5, o.z + 14.8, 9, 0.35, 0, 2.6); solid(K, S, o.x + x + 0.2, o.z + 10.4, 0.35, 8.7, 0, 2.6); solid(K, S, o.x + x + 8.8, o.z + 10.4, 0.35, 8.7, 0, 2.6);
  }
  P.pop();
}

/** a graded pad: a darker, rolled rectangle (road material, a decal) with a lighter apron */
export function pad(K, S, o) {
  const P = K.P, M = K.M, y = 0.03;
  P.tint(o.color || '#7d796f');
  const hw = o.w / 2, hd = o.d / 2, q = (x0, x1, z0, z1) => P.quad(M.road, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0]);
  q(o.x - hw, o.x + hw, o.z - hd, o.z + hd);
}
