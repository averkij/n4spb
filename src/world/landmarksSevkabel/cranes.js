// landmarksSevkabel/cranes.js - the portal cranes of the Baltic Shipyard (closed territory: silhouette only; docs/research/sevkabel.md section 8, photos 113 114 115 122 124 127; OSM crane ways w747160236..240 = the runways).
//   T1  slipway crane, 64 m: lattice portal on two rails (gauge 10.5 m), lattice slewing tower 4 -> 3 m, platform with a cream cab and a rust counterweight, a gantry with pendants, a hinged lattice jib 40 m (two jib angles).
//   T2  harbour portal crane, 42 m: lattice portal, round column (white-grey or BLUE), cream cab, yellow A-frame boom, rust counterweight.
//   14 cranes = 5 on slipway A (2 runways) + 6 on slipway B + 3 on the outfitting quay [W bz.ru] = 7 T1 + 7 T2.  Each type / variant is ONE InstancedMesh with vertex colours (one material), so the whole shipyard costs 4 draw calls.
//   Crane local frame: x along the runway, z across it (the jib side, +z), y up; the runways come from frame.js (centre lines of the OSM polygons).
import * as THREE from 'three';
import { RUNWAYS } from './frame.js';
import { partsGeoVC, strut } from './common.js';
import { mat4 } from './inst.js';

const COL = { cream: '#cfc8ad', steel: '#7e8a96', rust: '#8a4a30', cab: '#3a3d40', yellow: '#e6d77a', hook: '#e0b030', white: '#c3c8cc', blue: '#2c63c7', dark: '#4a4f55' };

/** a lattice leg / post made of two chords (offset along dx) and `n` rungs */
function leg(P, key, a, b, w, n = 5, r = 0.18) {
  const A1 = [a[0] - w / 2, a[1], a[2]], A2 = [a[0] + w / 2, a[1], a[2]], B1 = [b[0] - w / 2, b[1], b[2]], B2 = [b[0] + w / 2, b[1], b[2]];
  strut(P, key, A1, B1, r); strut(P, key, A2, B2, r);
  for (let i = 0; i <= n; i++) { const t = i / n, p1 = [A1[0] + (B1[0] - A1[0]) * t, A1[1] + (B1[1] - A1[1]) * t, A1[2] + (B1[2] - A1[2]) * t], p2 = [A2[0] + (B2[0] - A2[0]) * t, A2[1] + (B2[1] - A2[1]) * t, A2[2] + (B2[2] - A2[2]) * t]; strut(P, key, p1, p2, r * 0.7); }
}
const box = (P, key, x0, x1, y0, y1, z0, z1) => P.box(key, x0, x1, y0, y1, z0, z1, 'b', 2);

/** the lattice portal common to both types: two A-frames at x = +-3.2 (legs from the rails z = +-G up to z = +-top), beams along x at the top and a cross beam at half height */
function portal(P, G, top, h, key = 'steel') {
  for (const sx of [-3.2, 3.2]) for (const sz of [-1, 1]) {
    leg(P, key, [sx, 0.4, sz * G], [sx, h, sz * top], 1.1, 6, 0.2);
    box(P, 'dark', sx - 0.7, sx + 0.7, 0, 0.5, sz * G - 0.5, sz * G + 0.5);                                              // bogie
  }
  for (const sx of [-3.2, 3.2]) {
    strut(P, key, [sx, h * 0.46, -G * 0.62], [sx, h * 0.46, G * 0.62], 0.25);
    strut(P, key, [sx, h * 0.46, -G * 0.62], [sx, h, G * 0.12 * 0], 0.16); strut(P, key, [sx, h * 0.46, G * 0.62], [sx, h, 0], 0.16);
  }
  for (const sz of [-1, 1]) strut(P, key, [-3.2, h, sz * top], [3.2, h, sz * top], 0.3);
  strut(P, key, [-3.2, h, -top], [3.2, h, top], 0.14); strut(P, key, [-3.2, h, top], [3.2, h, -top], 0.14);
  box(P, 'dark', -4.2, 4.2, h, h + 1.0, -top - 0.4, top + 0.4);
}

/** T1 slipway crane (jib angle jibDeg) */
function craneT1(P, jibDeg) {
  const G = 5.25, hp = 14;
  portal(P, G, 2.1, hp);
  // slewing tower 4 -> 3 m, y 14 .. 36, seven panels
  const Y0 = hp + 0.5, Y1 = 36, N = 7, aAt = (y) => 2.0 - 0.5 * (y - Y0) / (Y1 - Y0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) strut(P, 'cream', [sx * aAt(Y0), Y0, sz * aAt(Y0)], [sx * aAt(Y1), Y1, sz * aAt(Y1)], 0.24);
  for (let i = 0; i <= N; i++) {
    const y = Y0 + (Y1 - Y0) * i / N, a = aAt(y), q = [[-a, -a], [a, -a], [a, a], [-a, a]];
    for (let k = 0; k < 4; k++) strut(P, 'cream', [q[k][0], y, q[k][1]], [q[(k + 1) % 4][0], y, q[(k + 1) % 4][1]], 0.1);
    if (i < N) { const y2 = Y0 + (Y1 - Y0) * (i + 1) / N, a2 = aAt(y2), q2 = [[-a2, -a2], [a2, -a2], [a2, a2], [-a2, a2]]; for (let k = 0; k < 4; k++) strut(P, 'cream', [q[k][0], y, q[k][1]], [q2[(k + 1) % 4][0], y2, q2[(k + 1) % 4][1]], 0.08); }
  }
  // platform, cab (jib side), machinery, counterweight (rear)
  box(P, 'dark', -4.2, 4.2, 36, 37.2, -4.5, 4.5);
  box(P, 'cab', -2.0, 2.0, 37.2, 41.2, 2.0, 6.0);
  box(P, 'cream', -2.5, 2.5, 37.2, 40.2, -1.2, 2.0);
  box(P, 'rust', -3.0, 3.0, 37.2, 41.2, -6.6, -1.6);
  // gantry with pendants to the jib tip
  const hinge = [0, 37.6, 3.6], al = jibDeg * Math.PI / 180, L = 40, ca = Math.cos(al), sa = Math.sin(al), tip = [0, hinge[1] + L * sa, hinge[2] + L * ca];
  const apex = [0, 49, -0.5];
  for (const sx of [-2.2, 2.2]) strut(P, 'dark', [sx, 41.2, -0.5], apex, 0.2);
  strut(P, 'dark', apex, [0, tip[1], tip[2]], 0.07);
  strut(P, 'dark', apex, [0, 41.2, -6.0], 0.08);
  // the lattice jib: two side trusses (top and bottom chords) with diagonals every 4 m and rungs
  const M = 10, w = (s) => 1.5 - 1.0 * s, d = (s) => 1.7 - 1.1 * s;
  const at = (s, side, top) => { const c = [0, hinge[1] + L * s * sa, hinge[2] + L * s * ca]; const v = [0, ca, -sa]; return [c[0] + side * w(s), c[1] + v[1] * d(s) * (top ? 0.5 : -0.5), c[2] + v[2] * d(s) * (top ? 0.5 : -0.5)]; };
  for (const side of [-1, 1]) for (const top of [true, false]) strut(P, 'cream', at(0, side, top), at(1, side, top), 0.15);
  for (let i = 0; i <= M; i++) {
    const s = i / M;
    strut(P, 'cream', at(s, -1, true), at(s, 1, true), 0.09);
    strut(P, 'cream', at(s, -1, true), at(s, -1, false), 0.09); strut(P, 'cream', at(s, 1, true), at(s, 1, false), 0.09);
    if (i < M) { const s2 = (i + 1) / M; for (const side of [-1, 1]) strut(P, 'cream', at(s, side, i % 2 ? true : false), at(s2, side, i % 2 ? false : true), 0.08); }
  }
  // the hoist rope and the yellow hook block
  const hy = 41;
  strut(P, 'dark', [0, tip[1], tip[2]], [0, hy + 1.6, tip[2] + 0.2], 0.05);
  box(P, 'hook', -0.5, 0.5, hy, hy + 1.6, tip[2] - 0.3, tip[2] + 0.7);
}

/** T2 harbour portal crane: column colour 'white' | 'blue' */
function craneT2(P, colKey) {
  const G = 5.25, hp = 9;
  portal(P, G, 2.0, hp);
  P.cyl(colKey, [0, hp + 0.8, 0], [0, 22, 0], 1.9, 1.5, 10, true);                                                  // the column
  box(P, 'dark', -2.6, 2.6, 22, 22.8, -2.6, 2.6);
  box(P, 'white', -1.6, 1.6, 22.8, 25.6, -0.4, 3.4);                                                             // cab
  box(P, 'rust', -2.2, 2.2, 22.8, 26.0, -5.4, -1.2);                                                             // counterweight
  const hinge = [0, 25.2, 2.4], al = 35 * Math.PI / 180, L = 28, tip = [0, hinge[1] + L * Math.sin(al), hinge[2] + L * Math.cos(al)];
  for (const sx of [-0.9, 0.9]) {                                                                                  // the yellow A-frame boom
    strut(P, 'yellow', [sx, hinge[1], hinge[2]], [sx * 0.35, tip[1], tip[2]], 0.28);
    strut(P, 'yellow', [sx, 26.0, -1.2], [sx * 0.35, hinge[1] + L * 0.7 * Math.sin(al), hinge[2] + L * 0.7 * Math.cos(al)], 0.2);
  }
  strut(P, 'yellow', [-0.9, hinge[1], hinge[2]], [0.9, hinge[1], hinge[2]], 0.2);
  for (let i = 1; i < 5; i++) { const s = i / 5, y = hinge[1] + L * s * Math.sin(al), z = hinge[2] + L * s * Math.cos(al), x = 0.9 - 0.55 * s; strut(P, 'yellow', [-x, y, z], [x, y, z], 0.1); }
  strut(P, 'yellow', [-0.9, 26, -1.2], [0.9, 26, -1.2], 0.14);
  strut(P, 'dark', [0, tip[1], tip[2]], [0, 14, tip[2] + 0.3], 0.05);
  box(P, 'hook', -0.4, 0.4, 12.5, 14, tip[2] - 0.2, tip[2] + 0.6);
}

/** point and runway bearing at parameter t (0..1) along a polyline of [x, z] */
function along(line, t) {
  const seg = []; let tot = 0;
  for (let i = 0; i + 1 < line.length; i++) { const l = Math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1]); seg.push(l); tot += l; }
  let s = t * tot;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i] || i === seg.length - 1) { const u = Math.min(1, s / seg[i]), a = line[i], b = line[i + 1]; return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, dx: (b[0] - a[0]) / seg[i], dz: (b[1] - a[1]) / seg[i] }; }
    s -= seg[i];
  }
  return null;
}

export function build(K) {
  const { ctx, root, M, svc } = K;
  // the placement table of docs/research/sevkabel.md 8.2: [runway, type, t, side (+1 = jib to the +z / right-hand side of the runway direction, -1 = the other way)]
  const east = (side) => side;                                                                                      // slipway runways: the west runway swings its jib over the berth (east), the east one over the berth (west)
  const SPEC = [
    ['A_W', 'T1b', 0.15, east(1)], ['A_W', 'T1a', 0.55, east(1)], ['A_W', 'T1a', 0.85, east(1)],
    ['A_E', 'T1a', 0.30, east(-1)], ['A_E', 'T1b', 0.72, east(-1)],
    ['B_W', 'T2w', 0.10, east(-1)], ['B_W', 'T2b', 0.50, east(-1)], ['B_W', 'T1a', 0.85, east(-1)],
    ['B_E', 'T2w', 0.20, east(1)], ['B_E', 'T1b', 0.55, east(1)], ['B_E', 'T2b', 0.90, east(1)],
    ['QUAY', 'T2w', 0.20, 1], ['QUAY', 'T2b', 0.50, 1], ['QUAY', 'T2w', 0.80, 1],
  ];
  const kinds = { T1a: (P) => craneT1(P, 38), T1b: (P) => craneT1(P, 62), T2w: (P) => craneT2(P, 'white'), T2b: (P) => craneT2(P, 'blue') };
  const mats = { T1a: [], T1b: [], T2w: [], T2b: [] };
  for (const [run, kind, t, side] of SPEC) {
    const p = along(RUNWAYS[run], t); if (!p) continue;
    // local +x along the runway; the rotation that maps local +x to (dx, dz) is atan2(-dz, dx); the jib side local +z maps to (sin, cos) of that angle
    let rot = Math.atan2(-p.dz, p.dx);
    if (side < 0) rot += Math.PI;
    mats[kind].push(mat4(p.x, 0, p.z, rot, 1));
    // review 2026-10-09: the shipyard ground is open in the data, so the four bogies / legs of every portal block the player (1.6 x 1.0 m at the rails, up to the portal beam)
    const cr = Math.cos(rot), sr = Math.sin(rot), hp = kind.startsWith('T1') ? 14 : 9;
    for (const lx of [-3.2, 3.2]) for (const lz of [-5.25, 5.25]) ctx.physics.addBox(p.x + cr * lx + sr * lz, p.z - sr * lx + cr * lz, 1.6, 1.0, rot, 0, hp);
  }
  let tris = 0, n = 0;
  for (const [kind, list] of Object.entries(mats)) {
    if (!list.length) continue;
    const { geo, tris: gt } = partsGeoVC(kinds[kind], COL);
    const im = new THREE.InstancedMesh(geo, M.vcol, list.length);
    list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
    im.castShadow = true; im.receiveShadow = true; im.name = 'lmsevka-crane-' + kind; ctx.noBatch(im); root.add(im);
    tris += gt * list.length; n += list.length;
  }
  K.extraTris += tris;
  svc.cranes = n;
}
