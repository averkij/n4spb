// landmarksAcademy/front.js - the FRONT CENTRE of the Academy (river side): docs/research/academy.md 3.2.  All in the academy frame (u along the front, v toward the Neva, y up; facing +z).
//   podium 12.1 m wide (u -7.0..5.1, v 59.6..65.6) with two quarter-round shoulders, rusticated 0..7.0, the main door at u -1.2 (dark oak double door 2.1 x 3.8 m, glazed transom, the gilt tablet
//   «СВОБОДНЫМЪ ХУДОЖЕСТВАМЪ / ЛѢТА 1765 ГОДА» above, two stone panels with dark plaques beside it), the balcony slab at y 7.0 with its balustrade (3 sections between the column pedestals + the returns),
//   the pavilion wall above (one 22.6 x 10.8 m tile: the two flank windows, the central arched window over the balcony and the framed window above it, trophy panels),
//   FOUR smooth Roman-Doric columns (c-c 2.7 / 5.1 / 2.7 m, y 7.0..17.8), the entablature that breaks forward over them, the low pediment (base 15.4 m, apex 23.3 m) with a strip of nine small
//   relief figures, Hercules and Flora (copies of the Farnese statues) on the slab in the outer bays, and the ATTIC (y 20.2..24.0) under the bell skirt of the dome (dome.js).
import * as THREE from 'three';
import * as L from '../layout.js';
import { band } from './kit.js';
import { ACAD, H, OUT } from './frame.js';
import { romanDoric, entabl, baluster, engaged } from './orders.js';
import { texQuad } from './shell.js';

let _sph = null;
const sphereGeo = () => _sph || (_sph = new THREE.SphereGeometry(1, 8, 6));
export const CU = -1.2;                                                    // the axis of the front centre and of the dome
const ZW = 59.62;                                                          // the wall plane of the pavilion block

/** an open polyline of the podium ring as band() edges (outward normals) */
function pathEdges(pts, cx, cz) {
  const es = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
    if (len < 0.02) continue;
    let nx = dz / len, nz = -dx / len;
    if (nx * ((a[0] + b[0]) / 2 - cx) + nz * ((a[1] + b[1]) / 2 - cz) < 0) { nx = -nx; nz = -nz; }
    es.push({ a, b, len, n: [nx, nz] });
  }
  return es;
}
const nearest = (ring, u, v) => { let bi = 0, bd = 1e9; ring.forEach((p, i) => { const d = Math.hypot(p[0] - u, p[1] - v); if (d < bd) { bd = d; bi = i; } }); return bi; };

export async function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics;
  // ------------------------------------------------------------------------------------------ the podium ring (from the baked outline: the shoulders + the front face)
  const i0 = nearest(OUT, 8.4, 59.6), i1 = nearest(OUT, -10.3, 59.7);
  const path = []; for (let i = i0; ; i = (i + 1) % OUT.length) { path.push(OUT[i]); if (i === i1) break; if (path.length > 40) break; }
  P.push(ACAD.x, 0, ACAD.z, ACAD.rot);
  try {
    const pe = pathEdges(path, CU, 60.0);
    band(P, pe, 0.9, H.podium - 0.15, 0, { front: M.rust }, { uvs: 3 });
    band(P, pe, 0, 0.9, 0.08, { front: M.granitePlinth, top: M.granitePlinth }, { uvs: 2.4 });
    band(P, pe, H.podium - 0.15, H.podium, 0.2, { front: M.order, top: M.order, under: M.soffit });
    // the slab on top of the podium (balcony floor) over the polygon path + the wall plane
    const slab = path.concat([[path[path.length - 1][0], ZW], [path[0][0], ZW]]);
    P.cap(M.slabs, slab, H.podium + 0.003, true, 2.4);
    // the wall of the pavilion block above the podium: one tile u -12.3..10.3, y 7.0 .. 17.8
    texQuad(P, M.cpFront, -12.3, 10.3, H.podium, TOP, 0, 1, TOP - H.podium, ZW, H.podium);
    // the entablature along the flat wall between the stubs (the same profile as the ring bands) and the projecting block over the columns
    const flat = [{ a: [-10.3, ZW], b: [8.4, ZW], len: 18.7, n: [0, 1] }];
    band(P, flat, H.top + 0.1, 18.45, 0.08, { front: M.order, top: M.order });
    band(P, flat, 18.45, 19.4, 0.0, { front: M.frieze }, { uvs: 1.25, vBase: 18.45 });
    band(P, flat, 19.4, 19.65, 0.42, { front: M.orderShade, top: M.order, under: M.soffit });
    band(P, flat, 19.65, H.eave, 0.9, { front: M.order, top: M.order, under: M.soffit });
    entabl(P, M, -7.6, 5.2, H.top + 0.1, ZW, 65.25);
    // ---- the engaged half-columns at the two ends of the pavilion wall (beside the podium shoulders), as in the river photographs
    for (const u of [CU - 9.45, CU + 9.45]) engaged(P, M, u, ZW + 0.12, H.podium, H.top + 0.1, 0.7, { z0: ZW });
    // ---- the four columns
    const colU = [CU - 5.25, CU - 2.55, CU + 2.55, CU + 5.25];
    for (const u of colU) romanDoric(P, M, u, 64.3, H.podium, H.top + 0.1, 0.725);
    // the ceiling of the portico between the wall and the entablature is the underside of the block (entabl draws no soffit under the architrave): a dark soffit plate at y 17.9
    P.quad(M.soffit, [-7.5, H.top + 0.09, 65.2], [5.1, H.top + 0.09, 65.2], [5.1, H.top + 0.09, ZW], [-7.5, H.top + 0.09, ZW], [0, -1, 0]);
    // ---- the door, its tablet, the two panels
    const zf = 65.6 + 0.03;
    P.quad(M.door, [CU - 1.15, 0.15, zf], [CU + 1.15, 0.15, zf], [CU + 1.15, 4.75, zf], [CU - 1.15, 4.75, zf], [0, 0, 1]);
    P.box(M.granitePlinth, CU - 1.5, CU + 1.5, 0, 0.16, 65.6, 66.25, 'b', 2.4);                      // the threshold step
    const lab = ctx.services?.labels;
    if (!lab || lab.reserve('r165182', ...worldPoint(CU, 5.27, 65.66, 3.4, 0.64), 'tablet')) P.quad(M.tablet, [CU - 1.7, 4.95, zf + 0.01], [CU + 1.7, 4.95, zf + 0.01], [CU + 1.7, 5.59, zf + 0.01], [CU - 1.7, 5.59, zf + 0.01], [0, 0, 1]);
    for (const s of [-1, 1]) {
      const cx = CU + s * 2.55;
      P.box(M.order, cx - 0.55, cx + 0.55, 1.3, 4.3, 65.6, 65.66, 'bk', 3); P.box(M.rust, cx - 0.42, cx + 0.42, 1.43, 4.17, 65.66, 65.69, 'bk', 3);
      P.quad(M.plaqueDark, [cx - 0.4, 2.3, 65.7], [cx + 0.4, 2.3, 65.7], [cx + 0.4, 2.8, 65.7], [cx - 0.4, 2.8, 65.7], [0, 0, 1]);
    }
    // ---- the balustrade of the balcony: 3 sections between the column pedestals + the returns along the shoulders
    const zb = 65.38;
    baluster(P, M, colU[1] + 0.95, colU[2] - 0.95, H.podium, zb); baluster(P, M, colU[0] + 0.95, colU[1] - 0.95, H.podium, zb); baluster(P, M, colU[2] + 0.95, colU[3] - 0.95, H.podium, zb);
    P.push(-6.85, 0, 62.4, -Math.PI / 2); baluster(P, M, 0, 2.95, H.podium, 0.0); P.pop();
    P.push(4.95, 0, 65.3, Math.PI / 2); baluster(P, M, 0, 2.9, H.podium, 0.0); P.pop();
    // ---- the pediment: raking cornices (strips), the recessed tympanum, nine small relief figures, the roof planes back to the attic wall
    const xa = CU - 7.7, xb = CU + 7.7, ya = H.eave, yp = H.pedApex, zc = 66.0, zt = 65.72, zA = 58.4;
    P.fan(M.field, [[xa + 0.55, ya, zt], [xb - 0.55, ya, zt], [CU, yp - 0.62, zt]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
    for (const s of [1, -1]) {
      const xe = s > 0 ? xb : xa, run = Math.abs(CU - xe), sl = Math.hypot(run, yp - ya), nx = (-s * (yp - ya)) / sl, ny = run / sl;
      P.quad(M.order, [xe, ya, zc], [CU, yp - 0.55, zc], [CU, yp, zc], [xe, ya + 0.55, zc], [0, 0, 1]);                            // the raking cornice (front)
      P.quad(M.orderShade, [xe, ya, zt], [CU, yp - 0.55, zt], [CU, yp - 0.55, zc], [xe, ya, zc], [-nx, -ny, 0]);                    // its soffit
      P.quad(M.roof, [xe + (s > 0 ? 0.02 : -0.02), ya + 0.55, zc + 0.04], [CU, yp, zc + 0.04], [CU, yp, zA], [xe, ya + 0.55, zA], [nx, ny, 0], [[0, 0], [sl / 0.6, 0], [sl / 0.6, 12], [0, 12]]);   // the roof plane
    }
    // the relief group of about nine figures along the base of the tympanum (an allegory of the arts, ac_098): small ellipsoid bodies with round heads and raised arms (review-academy 2026-10-08:
    // nine bare boxes before), the two end figures reclining
    for (let i = 0; i < 9; i++) {
      const x = CU - 4.4 + i * 1.1, hh = 0.5 + 0.22 * Math.sin(i * 1.7), reclined = i === 0 || i === 8, s = i === 0 ? -1 : 1, y0 = ya + 0.14;
      if (reclined) { P.geo(M.marble, sphereGeo(), x + s * 0.25, y0 + 0.14, zt + 0.04, 0, 0, 0.0, 0.52, 0.14, 0.07); P.geo(M.marble, sphereGeo(), x - s * 0.22, y0 + 0.3, zt + 0.05, 0, 0, 0, 0.1, 0.1, 0.07); }
      else {
        P.geo(M.marble, sphereGeo(), x, y0 + hh * 0.5, zt + 0.04, 0, 0, 0, 0.17, hh * 0.5, 0.07);                 // the body
        P.geo(M.marble, sphereGeo(), x, y0 + hh + 0.07, zt + 0.05, 0, 0, 0, 0.09, 0.1, 0.07);                       // the head
        P.geo(M.marble, sphereGeo(), x + (i % 2 ? 0.17 : -0.17), y0 + hh * 0.8, zt + 0.05, 0, 0, i % 2 ? -0.6 : 0.6, 0.05, 0.2, 0.05);   // a raised arm
      }
    }
    // ---- the attic: y 20.2..24.0, u -11.2..8.8, v 40..58.4 (only the front and the sides are seen), a cornice at the top
    const au0 = CU - 10, au1 = CU + 10, av0 = 40.0, av1 = 58.4;
    P.quad(M.field, [au0, ya, av1], [au1, ya, av1], [au1, H.attic - 0.7, av1], [au0, H.attic - 0.7, av1], [0, 0, 1], [[au0 / 3, ya / 3], [au1 / 3, ya / 3], [au1 / 3, (H.attic - 0.7) / 3], [au0 / 3, (H.attic - 0.7) / 3]]);
    for (const [x, nxv] of [[au0, -1], [au1, 1]]) P.quad(M.field, [x, ya, nxv > 0 ? av1 : av0], [x, ya, nxv > 0 ? av0 : av1], [x, H.attic - 0.7, nxv > 0 ? av0 : av1], [x, H.attic - 0.7, nxv > 0 ? av1 : av0], [nxv, 0, 0], [[0, ya / 3], [(av1 - av0) / 3, ya / 3], [(av1 - av0) / 3, (H.attic - 0.7) / 3], [0, (H.attic - 0.7) / 3]]);
    for (const u of [au0 + 0.5, au1 - 0.5, CU - 3.6, CU + 3.6, CU]) P.box(M.order, u - 0.55, u + 0.55, ya, H.attic - 0.7, av1, av1 + 0.1, 'kb', 3);               // flat pilaster strips between panels
    for (const [a, b] of [[CU - 8.7, CU - 4.6], [CU - 2.6, CU + 2.6], [CU + 4.6, CU + 8.7]]) { P.box(M.orderShade, a, b, ya + 0.9, H.attic - 1.5, av1, av1 + 0.04, 'kb', 3); P.box(M.field, a + 0.12, b - 0.12, ya + 1.0, H.attic - 1.6, av1 + 0.04, av1 + 0.06, 'kb', 3); }   // three recessed panels
    const ar = [{ a: [au0, av1], b: [au1, av1], len: au1 - au0, n: [0, 1] }, { a: [au1, av1], b: [au1, av0], len: av1 - av0, n: [1, 0] }, { a: [au0, av0], b: [au0, av1], len: av1 - av0, n: [-1, 0] }];
    band(P, [ar[2], ar[0], ar[1]], H.attic - 0.7, H.attic - 0.35, 0.12, { front: M.order, top: M.order, under: M.soffit });
    band(P, [ar[2], ar[0], ar[1]], H.attic - 0.35, H.attic, 0.55, { front: M.order, top: M.order, under: M.soffit });
    // ---- Hercules and Flora (Farnese copies, marble) on the slab in the outer bays, and the Minerva group (dome.js) come from sculpt.js
    try { const s = await import('./sculpt.js'); if (s.frontStatues) s.frontStatues(K, { CU, colU }); } catch (err) { console.warn('[landmarksAcademy] front statues', err.message); }
  } finally { P.pop(); }
  // monuments / services
  const c = worldAt(CU, 62);
  K.svc.entrances.push({ x: worldAt(CU, 66.4).x, z: worldAt(CU, 66.4).z, rotY: ACAD.rot, name: 'Академия художеств, главный вход', closed: true });
  K.svc.monuments.push({ id: 'academy-of-arts', name: 'Императорская Академия художеств', x: c.x, z: c.z, h: H.minerva, r: 0 });
  K.svc.photoSpots.push({ x: worldAt(CU, 76).x, z: worldAt(CU, 76).z, yaw: L.yawToward(worldAt(CU, 76).x, worldAt(CU, 76).z, worldAt(CU, 50).x, worldAt(CU, 50).z), name: 'Академия художеств с набережной' });
  void ph;
}
const TOP = 17.8;
function worldAt(u, v) { const C = Math.cos(ACAD.rot), S = Math.sin(ACAD.rot); return { x: ACAD.x + C * u + S * v, z: ACAD.z - S * u + C * v }; }
/** (x, y, z, w, h, nx, nz) of a flat label centred at academy (u, v) facing +v, for labels.reserve (after the building id) */
function worldPoint(u, y, v, w, h) { const p = worldAt(u, v), C = Math.cos(ACAD.rot), S = Math.sin(ACAD.rot); return [p.x, y, p.z, w, h, S, C]; }
