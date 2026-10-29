// landmarksSmolensky/resurrection.js - the CHURCH OF THE RESURRECTION OF CHRIST at the cemetery entrance (Воскресенская церковь, Kamskaya 11; V. A. Demyanovsky 1901-04, Naryshkin baroque; OSM w101396308, baked h null).
// Dossier docs/research/smolensky.md section 8 (+ critic log 14b no. 9), photos refs/smolensky 57 45 48 c06-c09: unplastered red brick with WHITE belts (0.45 red / 0.25 white), white stucco ornament, a granite plinth
// 1.1 m, light-blue-lavender sheet roofs, gilded domes.  Frame RE (frame.js): X ENE (the three apses at X 29..34.7), Z SSE towards Kamskaya street (the south face with the gallery door at X 14.2, Z 25.4).
// Mass model (RE frame): the GALLERY (X 2.2..19.6, Z 2.0..25.4, roof terrace at 8.0 with a white parapet and flame finials, 4 round-headed windows with stepped archivolts, the royal-blue door with the shell cartouche
// and five granite steps), the vestibule X 0..2.2 (west door, white panel), the CENTRAL BLOCK X 9.4..19.4 x Z 7.5..17.5 up to the heavy cornice at 18.0 (three oval windows in a white cartouche on the south face),
// the three naves of the ship plan (X 19.6..32.3, cornice 11.0..12.2, light-blue roofs), three apses, the TOWER (octagon 18.8..30.2 with 8 windows, white double pilasters, balcony, an open pillared lantern, the
// gilded crown, a gilded cross: cross top 45 m, bracket 41.5-47) and the two small gilded domes on white pillared drums (cross tops 29 / 25 m).  Closed solid building; the gallery door is visible.
import * as THREE from 'three';
import * as L from '../layout.js';
import { RE, RE_OUT, ringIn } from './frame.js';
import * as G from './geo.js';
import * as S from './stucco.js';
import { ringEdges, band, polyOf } from './kit.js';
import { addPolyColliders } from '../lib/massing.js';

const PL = 1.1, GT = 7.0, NV = 11.0;
const BR = 0.9, BRS = 1.3;                                        // metres per tile of the dense / sparse banded brick textures (catalogue 4.1)
const CC = 13.2;                                                  // the heavy cornice of the central block (11.7-14.4 m on the photos: 13.2 m)

export function build(K) {
  const ctx = K.ctx, P = K.P, M = K.M, ph = ctx.physics;
  P.push(RE.x, 0, RE.z, RE.rot);
  const brick = (x0, x1, y0, y1, z0, z1, skip = 'b') => P.box(M.brick, x0, x1, y0, y1, z0, z1, skip, BR);
  // ---- plinth round the whole outline (pink-grey granite 1.1 m)
  const out = RE_OUT.map((p) => p.slice());
  band(P, ringEdges(polyOf(out)), 0, PL, 0.1, { front: M.rPlinth, top: M.rPlinth }, { uvs: 2 });
  // ---- volumes
  brick(2.2, 19.6, PL, GT, 2.0, 25.4);                                   // gallery
  brick(10.0, 16.2, PL, GT, 0.0, 2.0, 'bk');                             // the north bump of the gallery
  brick(0.0, 2.2, PL, 9.5, 9.0, 18.1);                                   // vestibule (west door)
  P.box(M.brickSparse, 9.4, 19.6, GT, CC, 7.5, 17.5, 'b', BRS);          // central block (the sparse rhythm: one white belt per 1.3 m)
  brick(19.6, 32.3, PL, NV, 8.9, 18.3, 'bt');                            // middle nave
  brick(19.6, 29.0, PL, NV, 0.1, 8.9, 'bt');                             // north nave
  brick(19.6, 29.4, PL, NV, 18.3, 26.7, 'bt');                           // south nave
  brick(32.3, 34.7, PL, 10.0, 8.85, 14.9, 'bt');                         // middle apse (shallow)
  ringWalls(P, M.brick, [[29.0, 1.1], [32.2, 1.1], [33.7, 2.6], [34.3, 4.6], [33.8, 6.8], [32.3, 8.0], [29.0, 8.0]], PL, NV);
  ringWalls(P, M.brick, [[29.4, 25.3], [32.4, 25.1], [33.8, 23.6], [34.3, 21.3], [33.7, 19.4], [32.4, 18.3], [29.4, 18.3]], PL, NV);
  // ---- terrace of the gallery (a cap with a hole for the central block), parapet with cornice ledge, flame finials; cornices of the naves and apses with the comb above
  const gal = [[2.2, 2.0], [10.0, 2.0], [10.0, 0.0], [16.2, 0.0], [16.2, 2.0], [19.6, 2.0], [19.6, 25.4], [2.2, 25.4]];
  P.cap(M.rShade, gal, GT + 0.02, true, 2, [[[9.4, 7.5], [19.6, 7.5], [19.6, 17.5], [9.4, 17.5]]]);
  const RIM = [[2.2, 25.4, 19.6, 25.4, 0, 1], [2.2, 2.0, 2.2, 25.4, -1, 0], [2.2, 2.0, 10.0, 2.0, 0, -1], [10.0, 2.0, 10.0, 0.0, -1, 0], [10.0, 0.0, 16.2, 0.0, 0, -1], [16.2, 0.0, 16.2, 2.0, 1, 0], [16.2, 2.0, 19.6, 2.0, 0, -1]];
  for (const sg of RIM) {
    if (sg[1] === 25.4 && sg[3] === 25.4) { S.balustrade(P, M.rWhite, 2.4, 19.4, GT, 25.25, 1.2, 0.45); rimSeg(P, M.rWhite, sg, 0, 0.3, GT - 0.4, GT); continue; }      // the south edge: a real balustrade of squat balusters (seen from Kamskaya st.)
    rimSeg(P, M.rWhite, sg, -0.05, 0.2, GT, GT + 1.25); rimSeg(P, M.rWhite, sg, 0, 0.3, GT - 0.4, GT);
  }
  for (const [x, z] of [[2.2, 2.0], [2.2, 25.4], [10.0, 0.0], [16.2, 0.0], [19.6, 25.4], [19.6, 2.0]]) flame(P, M, x, GT + 1.25, z);
  for (const sg of [[19.6, 0.1, 29.0, 0.1, 0, -1], [19.6, 26.7, 29.7, 26.7, 0, 1], [19.6, 0.1, 19.6, 8.9, -1, 0], [19.6, 18.3, 19.6, 26.7, -1, 0]]) { rimSeg(P, M.rWhite, sg, 0, 0.32, NV, NV + 1.2); comb(P, M, [[sg[0] + sg[4] * 0.1, sg[1] + sg[5] * 0.1], [sg[2] + sg[4] * 0.1, sg[3] + sg[5] * 0.1]], NV + 1.2); }
  const apN = [[29.0, 1.1], [32.2, 1.1], [33.7, 2.6], [34.3, 4.6], [33.8, 6.8], [32.3, 8.0], [29.0, 8.0]], apS = [[29.4, 25.3], [32.4, 25.1], [33.8, 23.6], [34.3, 21.3], [33.7, 19.4], [32.4, 18.3], [29.4, 18.3]];
  for (const r of [apN, apS]) { ringBand(P, M.rWhite, r, NV, NV + 1.2, 0.32); comb(P, M, r.map((p, i) => p), NV + 1.2); }
  // roofs of the naves: low light-blue hips; the half-domes of the apses
  roofHip(P, M.rBlue, 19.3, 32.6, 8.6, 18.6, NV + 1.2, NV + 2.6); roofHip(P, M.rBlue, 19.3, 29.3, -0.2, 9.2, NV + 1.2, NV + 2.6); roofHip(P, M.rBlue, 19.3, 29.7, 18.0, 27.0, NV + 1.2, NV + 2.6);
  apseCap(P, M.rBlue, apN, NV + 1.2, [30.2, 4.6, NV + 3.4]); apseCap(P, M.rBlue, apS, NV + 1.2, [30.4, 21.7, NV + 3.4]);
  P.box(M.rBlue, 32.2, 34.8, 10.0, 10.2, 8.8, 15.0, 'b');
  // heavy cornice of the central block (stepped white, 18.0 .. 18.8) and the octagon seat
  P.box(M.rWhite, 9.4 - 0.7, 19.6 + 0.7, CC, CC + 0.8, 7.5 - 0.7, 17.5 + 0.7, 'b'); P.box(M.rWhite, 9.4 - 0.25, 19.6 + 0.25, CC - 0.5, CC, 7.5 - 0.25, 17.5 + 0.25, 'b');
  // ---- the south face of the gallery: windows, the door, the oval-window panel of the central block
  G.onFace(P, 2.2, 25.4, 0, 1, () => southFace(P, M));
  // west vestibule: the arched door (2.2 x 3.4) with a voussoir arch and the blank white panel above (x' = 18.1 - Z)
  G.onFace(P, 0.0, 9.0, -1, 0, () => {
    const x = 13.55 - 9.0;
    G.planeShape(P, M.doorWest, G.archPts(x, PL + 0.0, 2.2, 3.4, 10), 0.05); S.archRing(P, M.rWhite, x, PL, 2.2, 3.4, 0.3, 0, 0.18); voussoirs(P, M, x, PL + 3.4 - 1.1, 1.1, 0.5);
    P.box(M.rWhite, x - 1.85, x + 1.85, 5.3, 8.9, 0, 0.12, '');
    P.box(M.rWhite, -0.2, 9.5, 9.5, 10.2, 0, 0.5, 'b');
  });
  // the oval windows also on the north face of the central block
  G.onFace(P, 19.6, 7.5, 0, -1, () => ovalPanel(P, M, 19.6 - 14.9));
  // ---- tower and the small domes
  tower(P, M);
  smallDome(P, M, 22.7, 17.0, 17.6); smallDome(P, M, 25.0, 8.0, 16.2);
  ornament(P, M);
  P.pop();
  // ---- colliders (the footprint polygon from the baked record) + the door steps
  const rec = L.buildingById('w101396308');
  if (rec && rec.polys[0]) addPolyColliders(ctx, rec.polys[0], 0, 20, 0.5);
  { const c = RE.W(14.2, 27.65); ph.addStairs(c.x, c.z, 2.6, 1.5, RE.rot + Math.PI, 0, PL, 5); RE.walk(ph, 14.2, 26.2, 2.6, 1.6, PL, 0); }
  // ---- services
  const d = RE.W(14.2, 27.4), ctr = RE.W(14.4, 12.5);
  K.svc.entrances.push({ id: 'n10797765945', x: d.x, z: d.z, rotY: RE.rot, name: 'Воскресенская церковь' });
  K.svc.crowd.push({ id: 'resurrection', x: -5484, z: -1556, r: 6, n: 8, kind: 'visitors' });
  K.svc.photoSpots.push({ x: -5476.1, z: -1520.7, yaw: L.yawToward(-5476.1, -1520.7, ctr.x, ctr.z), name: 'Воскресенская церковь' });
  K.svc.monuments.push({ id: 'w101396308', name: 'Церковь Воскресения Христова (В. А. Демьяновский)', x: ctr.x, z: ctr.z, h: 42 });
}

/** a box along an axis-aligned wall segment [x0, z0, x1, z1, nx, nz] occupying offsets off0 .. off1 along the outward normal (positive = outside), 0.2 m longer at both ends */
function rimSeg(P, mat, sg, off0, off1, y0, y1) {
  const [x0, z0, x1, z1, nx, nz] = sg, e = 0.2;
  if (nz !== 0) { const zz0 = z0 + nz * off0, zz1 = z0 + nz * off1; P.box(mat, Math.min(x0, x1) - e, Math.max(x0, x1) + e, y0, y1, Math.min(zz0, zz1), Math.max(zz0, zz1), 'b'); }
  else { const xx0 = x0 + nx * off0, xx1 = x0 + nx * off1; P.box(mat, Math.min(xx0, xx1), Math.max(xx0, xx1), y0, y1, Math.min(z0, z1) - e, Math.max(z0, z1) + e, 'b'); }
}
/** a mitred band round an open convex polyline (outward = away from the centroid): front quads at offset d from y0 to y1, top and under strips back to the wall line */
function ringBand(P, mat, ring, y0, y1, d) {
  let cx = 0, cz = 0; for (const p of ring) { cx += p[0] / ring.length; cz += p[1] / ring.length; }
  const n = ring.length, nrm = [];
  for (let i = 0; i + 1 < n; i++) { const a = ring[i], b = ring[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; let nx = dz / l, nz = -dx / l; if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz; } nrm.push([nx, nz]); }
  const off = ring.map((p, i) => { const n0 = nrm[Math.max(0, i - 1)], n1 = nrm[Math.min(nrm.length - 1, i)]; let bx = n0[0] + n1[0], bz = n0[1] + n1[1]; const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl; const k = 1 / Math.max(0.5, bx * n1[0] + bz * n1[1]); return [p[0] + bx * d * k, p[1] + bz * d * k]; });
  for (let i = 0; i + 1 < n; i++) {
    const A = off[i], B = off[i + 1], a = ring[i], b = ring[i + 1], nn = nrm[i];
    P.quad(mat, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], [nn[0], 0, nn[1]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(mat, [A[0], y1, A[1]], [B[0], y1, B[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [B[0], y0, B[1]], [A[0], y0, A[1]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
}
/** walls of a convex ring (outward normals away from the centroid), uv in metres / BR */
function ringWalls(P, mat, ring, y0, y1) {
  let cx = 0, cz = 0; for (const p of ring) { cx += p[0] / ring.length; cz += p[1] / ring.length; }
  for (let i = 0; i + 1 < ring.length; i++) {
    const a = ring[i], b = ring[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    let nx = dz / l, nz = -dx / l; if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz; }
    P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], [nx, 0, nz], [[a[0] / BR, y0 / BR], [b[0] / BR, y0 / BR], [b[0] / BR, y1 / BR], [a[0] / BR, y1 / BR]]);
  }
}
/** low half-dome over an apse ring: a fan of triangles to the apex (ax, az, ay) */
function apseCap(P, mat, ring, y, apex) {
  for (let i = 0; i + 1 < ring.length; i++) { const a = ring[i], b = ring[i + 1]; P.fan(mat, [[a[0], y, a[1]], [b[0], y, b[1]], [apex[0], apex[2], apex[1]]], [0, 1, 0], (p) => [p[0], p[2]]); }
}
function roofHip(P, mat, x0, x1, z0, z1, y0, y1) {
  const alongX = (x1 - x0) >= (z1 - z0), w = alongX ? z1 - z0 : x1 - x0, ins = w / 2;
  const cx0 = alongX ? x0 + ins : (x0 + x1) / 2, cx1 = alongX ? x1 - ins : (x0 + x1) / 2, cz0 = alongX ? (z0 + z1) / 2 : z0 + ins, cz1 = alongX ? (z0 + z1) / 2 : z1 - ins;
  const q = (a, b, c, d, n) => P.quad(mat, a, b, c, d, n, [a, b, c, d].map((p) => [p[0], p[2]]));
  const k = (y1 - y0) / ins, nl = Math.hypot(1, k);
  q([x0, y0, z1], [x1, y0, z1], [cx1, y1, cz1], [cx0, y1, cz1], [0, 1 / nl, k / nl]);
  q([x1, y0, z0], [x0, y0, z0], [cx0, y1, cz0], [cx1, y1, cz0], [0, 1 / nl, -k / nl]);
  q([x1, y0, z1], [x1, y0, z0], [cx1, y1, cz0], [cx1, y1, cz1], [k / nl, 1 / nl, 0]);
  q([x0, y0, z0], [x0, y0, z1], [cx0, y1, cz1], [cx0, y1, cz0], [-k / nl, 1 / nl, 0]);
}
/** the scalloped "comb" parapet: small white blocks every 0.6 m along the polyline (closed when the points form a ring) */
function comb(P, M, pts, y) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l > 14 || l < 0.5) continue;                                                              // skip the jumps between separate runs
    const n = Math.max(1, Math.round(l / 0.6));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; P.box(M.rWhite, a[0] + (b[0] - a[0]) * t - 0.17, a[0] + (b[0] - a[0]) * t + 0.17, y, y + 0.34, a[1] + (b[1] - a[1]) * t - 0.17, a[1] + (b[1] - a[1]) * t + 0.17, 'b'); }
  }
}
/** a white flame finial on the parapet corners */
function flame(P, M, x, y, z) { P.box(M.rWhite, x - 0.22, x + 0.22, y, y + 0.3, z - 0.22, z + 0.22, 'b'); G.frustum(P, M.rWhite, x, z, y + 0.3, y + 1.2, 6, 0.2, 0.0, 0, 1, 1, {}); }
/** brick-and-white voussoir blocks round an arch of centre cx, springing at y (the straight part ends), radius r = w / 2 */
function voussoirs(P, M, cx, ySpring, w, depth) {
  const r = w / 2 * (1 + 0.0), n = 9;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + 0.5) / n, rr = r + 0.55;
    S.slat(P, i % 2 ? M.rWhite : M.rBrickDark, cx + Math.cos(a) * rr, ySpring + Math.sin(a) * rr, 0.1, 0.38, 0.5, 0.2, a - Math.PI / 2);
  }
  void depth;
}

/** the south face of the gallery (frame: x' = X - 2.2 to the right, z out): 4 arched windows at X 4.0 / 7.4 / 10.8 / 17.7, the door at X 14.2, the cartouche, the ovals of the central block above */
function southFace(P, M) {
  const wins = [4.0, 7.4, 10.8, 17.7];
  for (const X of wins) {
    const x = X - 2.2;
    S.archPane(P, M.lattRe, x, 2.0, 1.7, 4.2, 0.05); S.archRing(P, M.rWhite, x, 2.0, 1.7, 4.2, 0.28, 0, 0.16); voussoirs(P, M, x, 2.0 + 4.2 - 0.85, 1.7, 0.5);
    P.box(M.rWhite, x - 1.15, x + 1.15, 1.8, 2.0, 0, 0.3, '');
  }
  // the door: royal blue, arched 1.6 x 3.0, white archivolt + voussoirs, the shell-and-scroll cartouche above
  const dx = 14.2 - 2.2;
  S.archPane(P, M.doorRe, dx, PL, 1.6, 3.0, 0.06); S.archRing(P, M.rWhite, dx, PL, 1.6, 3.0, 0.3, 0, 0.18); voussoirs(P, M, dx, PL + 3.0 - 0.8, 1.6, 0.5);
  P.box(M.rWhite, dx - 0.8, dx + 0.8, 4.7, 5.9, 0, 0.2, ''); S.sph(P, M.rWhite, dx, 5.3, 0.2, 0.55, 0.45, 0.14, 8);
  for (const s of [-1, 1]) { S.sph(P, M.rWhite, dx + s * 0.8, 5.0, 0.18, 0.2, 0.36, 0.12, 6); S.sph(P, M.rWhite, dx + s * 0.55, 5.75, 0.18, 0.16, 0.2, 0.1, 5); }
  // the stylobate of the door steps is drawn by the plinth band; five granite steps in front (x 2.6 m wide)
  P.box(M.rPlinth, dx - 1.3, dx + 1.3, 0, PL, 0.05, 1.5, 'b');
  for (let i = 0; i < 5; i++) P.box(M.rPlinth, dx - 1.3, dx + 1.3, 0, PL * (4 - i) / 5, 1.5, 1.5 + 0.3 * (i + 1), 'b');
  // the oval panel of the central block (rises behind the terrace, 7.9 m behind the gallery front: frame offset z = -7.9)
  P.push(0, 0, -(25.4 - 17.5), 0); ovalPanel(P, M, 14.9 - 2.2); P.pop();
}
/** three oval windows in one white scrolled frame about 6.5 m wide, y 8.6 .. 12.5 (nw07 / nw01: BELOW the heavy cornice, centred on the tower axis), with the console row of the cornice and S-scroll cartouches at the shoulders */
function ovalPanel(P, M, cx) {
  P.box(M.rWhite, cx - 3.25, cx + 3.25, 8.6, 12.5, 0, 0.16, '');
  P.box(M.rWhite, cx - 3.6, cx + 3.6, 12.5, 12.8, 0, 0.3, '');
  for (const s of [-1, 0, 1]) {
    const x = cx + s * 1.9, sh = new THREE.Shape(); sh.absellipse(x, 10.55, 0.55, 0.9, 0, Math.PI * 2, false, 0);
    const g = new THREE.ShapeGeometry(sh, 12), ua = g.attributes.uv, pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) ua.setXY(i, (pa.getX(i) - x + 0.55) / 1.1, (pa.getY(i) - 10.55 + 0.9) / 1.8);
    P.geo(M.lattRe, g, 0, 0, 0.2); g.dispose();
    const o = new THREE.Shape(); o.absellipse(x, 10.55, 0.74, 1.09, 0, Math.PI * 2, false, 0); const hh = new THREE.Path(); hh.absellipse(x, 10.55, 0.55, 0.9, 0, Math.PI * 2, true, 0); o.holes.push(hh);
    P.extrude(M.rShade, o, 0.16, 0.1, 1, 12);
    S.sph(P, M.rWhite, x, 11.75, 0.2, 0.2, 0.16, 0.1, 6);
  }
  for (const s of [-1, 1]) { S.sph(P, M.rWhite, cx + s * 3.45, 12.0, 0.18, 0.28, 0.5, 0.14, 6); S.sph(P, M.rWhite, cx + s * 3.0, 13.2, 0.18, 0.22, 0.3, 0.12, 6); }
  for (let i = 0; i < 9; i++) { const x = cx - 3.2 + i * 0.8; P.box(M.rWhite, x - 0.16, x + 0.16, 12.2, 12.5, 0.16, 0.5, 'b'); S.sph(P, M.rWhite, x, 12.15, 0.4, 0.17, 0.22, 0.16, 6); }
}

// ------------------------------------------------------------------------------------------------ the tower and the domes
const TC = [14.4, 12.5];
const Y0 = 14.0, Y1 = 22.2;                                      // the octagon (columns 17.0 .. 22.2 on the photo, its base bags from 15.5): nw07 / sd261, cross top 42 m
function tower(P, M) {
  const [cx, cz] = TC, a0 = -Math.PI / 8, Rb = 5.41, Rt = 4.49, y0 = Y0, y1 = Y1;
  G.frustum(P, M.brick, cx, cz, y0, y1, 8, Rb, Rt, a0, 5, 9, {});
  const ap = (y) => (Rb - (Rb - Rt) * (y - y0) / (y1 - y0)) * Math.cos(Math.PI / 8) - Rb * Math.cos(Math.PI / 8);
  for (let i = 0; i < 8; i++) {
    const t = a0 + i * Math.PI / 4, tm = t + Math.PI / 8, rb = Rb * Math.cos(Math.PI / 8);
    for (const s of [-1, 1]) { const tp = t + s * 0.1, rr = (Rb + Rt) / 2; P.push(cx + Math.sin(tp) * rr, y0 + 0.6, cz + Math.cos(tp) * rr, t); P.box(M.rWhite, -0.17, 0.17, 0, y1 - y0 - 1.2, -0.17, 0.3, 'b'); P.pop(); }
    P.push(cx + Math.sin(tm) * rb, 0, cz + Math.cos(tm) * rb, tm);
    P.push(0, 0, ap(17.2) + 0.04, 0); S.archPane(P, M.lattRe, 0, 16.4, 1.6, 3.0, 0.0); S.archRing(P, M.rWhite, 0, 16.4, 1.6, 3.0, 0.22, -0.02, 0.14); voussoirs(P, M, 0, 16.4 + 3.0 - 0.8, 1.6, 0.5); P.pop();
    P.push(0, 0, ap(20.4) + 0.04, 0); P.box(M.rWhite, -1.0, 1.0, 19.9, 21.1, 0, 0.18, ''); S.sph(P, M.rWhite, 0, 21.4, 0.1, 0.4, 0.3, 0.12, 6); for (const s of [-1, 1]) P.box(M.rWhite, s * 0.9 - 0.12, s * 0.9 + 0.12, 19.0, 19.9, 0, 0.16, ''); P.pop();
    P.pop();
    P.push(cx + Math.sin(t) * (Rb + 0.25), 0, cz + Math.cos(t) * (Rb + 0.25), t + Math.PI / 8);
    P.box(M.rWhite, -0.5, 0.5, y0 - 0.1, y0 + 2.6, -0.3, 0.4, 'b'); S.sph(P, M.rWhite, 0, y0 + 2.9, 0.2, 0.45, 0.4, 0.3, 6); P.pop();
  }
  G.frustum(P, M.rWhite, cx, cz, y1 - 0.2, y1 + 0.45, 8, Rt + 0.55, Rt + 0.35, a0, 1, 1, { capTop: M.rWhite });
  G.frustum(P, M.rWhite, cx, cz, y1 + 0.45, y1 + 1.0, 8, 4.25, 4.25, a0, 6, 1, {});
  const yr0 = y1 + 1.0, yr1 = 26.3;
  G.frustum(P, M.rWhite, cx, cz, yr0, yr1, 8, 3.95, 3.7, a0, 1, 1, {});
  for (let i = 0; i < 8; i++) {
    const tm = a0 + i * Math.PI / 4 + Math.PI / 8, rr = 3.7 * Math.cos(Math.PI / 8);
    P.push(cx + Math.sin(tm) * rr, 0, cz + Math.cos(tm) * rr, tm); P.push(0, 24.7, 0.05, 0);
    S.roundWin(P, M, M.louvre, 0, 0, 0.5, { rimMat: M.rWhite }); for (const s of [-1, 1]) { S.sph(P, M.rWhite, s * 1.15, 0.2, 0.1, 0.32, 0.55, 0.12, 6); S.sph(P, M.rWhite, s * 1.55, -0.55, 0.1, 0.26, 0.34, 0.1, 6); }
    P.pop(); P.pop();
  }
  G.frustum(P, M.rBlue, cx, cz, yr1, yr1 + 1.0, 8, 3.7, 2.6, a0, 3, 1, { capTop: M.rBlue });
  const yl0 = yr1 + 1.0, yl1 = 31.5;
  G.frustum(P, M.louvre, cx, cz, yl0, yl1, 8, 2.1, 2.1, a0, 1, 1, {});
  for (let i = 0; i < 8; i++) { const t = a0 + i * Math.PI / 4; P.col(M.rWhite, cx + Math.sin(t) * 2.15, cz + Math.cos(t) * 2.15, yl0, yl1, 0.2, 0.2, 8, true); }
  G.frustum(P, M.rWhite, cx, cz, yl1, yl1 + 0.45, 8, 2.6, 2.4, a0, 2, 1, { capTop: M.rWhite });
  for (let i = 0; i < 8; i++) { const t = a0 + i * Math.PI / 4; P.col(M.rWhite, cx + Math.sin(t) * 2.4, cz + Math.cos(t) * 2.4, yl1 + 0.4, yl1 + 0.9, 0.16, 0.1, 6, true); }
  const yc = yl1 + 0.45;
  G.lathe(P, M.rGold, 'smol-crown', [[0.5, 0], [0.78, 0.07], [0.97, 0.22], [1.0, 0.45], [0.9, 0.7], [0.62, 0.88], [0.3, 0.97], [0.1, 1.0]], cx, yc, cz, 2.62, 3.4, 24, 14);
  G.tube(P, M.rGoldFlat, cx, cz, yc + 3.35, yc + 4.3, 0.32, 0.22, 10, 1, 1, { capTop: M.rGoldFlat });
  S.crossOn(P, M.rGoldFlat, cx, 36.5, cz, 5.5);
}
/** a small gilded dome on a white pillared drum: drum from the nave roof (12.2) to yTop, 8 columns, dark louvres, a ribbed onion d 2.4 and a cross */
function smallDome(P, M, x, z, yTop) {
  const a0 = -Math.PI / 8, y0 = NV + 1.0;
  G.frustum(P, M.rWhite, x, z, y0, y0 + 0.6, 8, 2.6, 2.4, a0, 1, 1, { capTop: M.rWhite });
  G.frustum(P, M.louvre, x, z, y0 + 0.6, yTop, 8, 1.75, 1.75, a0, 1, 1, {});
  for (let i = 0; i < 8; i++) { const t = a0 + i * Math.PI / 4; P.col(M.rWhite, x + Math.sin(t) * 1.8, z + Math.cos(t) * 1.8, y0 + 0.6, yTop, 0.14, 0.14, 6, true); }
  G.frustum(P, M.rWhite, x, z, yTop, yTop + 0.35, 8, 2.1, 1.9, a0, 1, 1, { capTop: M.rWhite });
  G.lathe(P, M.rGold, 'smol-onion-small', [[0, 0], [0.55, 0], [0.62, 0.1], [0.86, 0.3], [1.02, 0.52], [1.06, 0.75], [0.98, 1.05], [0.8, 1.38], [0.55, 1.72], [0.28, 2.02], [0.1, 2.25], [0, 2.36]], x, yTop + 0.35, z, 1.15, 1.2, 20, 14);
  S.crossOn(P, M.rGoldFlat, x, yTop + 0.35 + 2.6, z, 3.0);
}

// ------------------------------------------------------------------------------------------------ ornament on the other elevations (detail pass 2026-10-09; catalogue 4.2-4.4, photos nw07 sd296 sd264 sd305)
/** an arched lattice window with the stepped white archivolt and the red / white voussoir ring: sill y0, w x h (frame: x right, z out) */
function arcWin(P, M, x, y0, w, h) {
  S.archPane(P, M.lattRe, x, y0, w, h, 0.05); S.archRing(P, M.rWhite, x, y0, w, h, 0.28, 0, 0.16); voussoirs(P, M, x, y0 + h - w / 2, w, 0.5);
  P.box(M.rWhite, x - w / 2 - 0.45, x + w / 2 + 0.45, y0 - 0.2, y0, 0, 0.3, '');
  for (const s of [-1, 1]) { P.box(M.rWhite, x + s * (w / 2 + 0.55) - 0.1, x + s * (w / 2 + 0.55) + 0.1, y0 - 0.2, y0 + 0.9, 0, 0.18, ''); S.sph(P, M.rWhite, x + s * (w / 2 + 0.55), y0 + 1.05, 0.1, 0.16, 0.22, 0.12, 6); }       // white vase brackets in the piers
}
/** the nave window group: two lancet lights in a deep white aedicule with a shell-topped broken-scroll pediment and a pair of vase brackets under the sill */
function naveWin(P, M, x) {
  for (const s of [-0.55, 0.55]) { S.archPane(P, M.lattRe, x + s, 3.2, 0.7, 2.4, 0.05); S.archRing(P, M.rWhite, x + s, 3.2, 0.7, 2.4, 0.12, 0, 0.12); }
  P.box(M.rWhite, x - 1.35, x - 1.05, 3.0, 6.1, 0, 0.3, ''); P.box(M.rWhite, x + 1.05, x + 1.35, 3.0, 6.1, 0, 0.3, '');
  P.box(M.rWhite, x - 1.5, x + 1.5, 6.1, 6.45, 0, 0.4, ''); S.sph(P, M.rWhite, x, 6.85, 0.2, 0.6, 0.45, 0.2, 8); for (const s of [-1, 1]) S.sph(P, M.rWhite, x + s * 0.95, 6.6, 0.2, 0.3, 0.3, 0.16, 6);
  P.box(M.rWhite, x - 1.45, x + 1.45, 2.8, 3.0, 0, 0.35, ''); for (const s of [-1, 1]) P.col(M.rWhite, x + s * 0.8, 0.2, 2.2, 2.8, 0.12, 0.08, 6, false);
}
function ornament(P, M) {
  // north face of the gallery wings and the bump: three arched lattice windows mirrored from the south face
  G.onFace(P, 19.6, 2.0, 0, -1, () => { for (const X of [17.9]) arcWin(P, M, 19.6 - X, 2.0, 1.7, 4.2); for (const X of [4.0, 7.4]) arcWin(P, M, 19.6 - X, 2.0, 1.7, 4.2); });
  G.onFace(P, 16.2, 0.0, 0, -1, () => arcWin(P, M, 16.2 - 13.1, 2.0, 1.7, 4.2));
  // west faces of the two wings (X = 2.2): one arched window each (frame x' = Z - 2.0)
  G.onFace(P, 2.2, 2.0, -1, 0, () => { arcWin(P, M, 5.4 - 2.0, 2.0, 1.7, 4.2); arcWin(P, M, 21.7 - 2.0, 2.0, 1.7, 4.2); });
  // the nave windows (north nave Z = 0.1, south nave Z = 26.7)
  G.onFace(P, 29.0, 0.1, 0, -1, () => { naveWin(P, M, 29.0 - 24.3); });
  G.onFace(P, 19.6, 26.7, 0, 1, () => { naveWin(P, M, 24.5 - 19.6); });
  // the apses: three narrow round-headed windows each with a white surround, a mask cartouche over it and an acanthus bracket under the sill
  const ap = [[[29.0, 1.1], [32.2, 1.1], [33.7, 2.6], [34.3, 4.6], [33.8, 6.8], [32.3, 8.0]], [[29.4, 25.3], [32.4, 25.1], [33.8, 23.6], [34.3, 21.3], [33.7, 19.4], [32.4, 18.3]]];
  for (const r of ap) {
    let cx = 0, cz = 0; for (const q of r) { cx += q[0] / r.length; cz += q[1] / r.length; }
    for (let i = 0; i + 1 < r.length; i++) {
      const a = r[i], b = r[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 1.5) continue;
      let nx = dz / l, nz = -dx / l; if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz; }
      P.push((a[0] + b[0]) / 2 + nx * 0.02, 0, (a[1] + b[1]) / 2 + nz * 0.02, Math.atan2(nx, nz));
      S.archPane(P, M.lattRe, 0, 3.0, 0.5, 1.6, 0.05); S.archRing(P, M.rWhite, 0, 3.0, 0.5, 1.6, 0.16, 0, 0.12); S.sph(P, M.rWhite, 0, 5.0, 0.1, 0.28, 0.3, 0.14, 6); P.box(M.rWhite, -0.35, 0.35, 2.7, 3.0, 0, 0.22, '');
      P.pop();
    }
  }
}
