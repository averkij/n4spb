// landmarksSredny/gorny.js - the three surface pavilions of the metro station GORNY INSTITUT on Bolshoy pr. 66 (opened 27 Dec 2024; dossier docs/research/sredny.md section 8, photos refs/sredny 128 129 130 135 136):
//   * the ENTRANCE pavilion (OSM w1305590665, 15.6 x 7.3 m, long axis along the Line bearing 150, door at the NNW short end) and the EXIT pavilion (w1305590664, 15.4 x 8.1 m, long axis along the prospect,
//     door at the WSW short end): a MONO-PITCH copper roof (high edge 7.0 m at the door end, low edge 4.2 m at the back, 1.8 m overhang over the doors, fascia 0.45 m, copper soffit, a sky-blue glass panel in
//     the top), a banded light-granite plinth 1.0 m, dark glass long walls with stainless zigzag braces (struts 0.26 m, orange node discs d 0.5 m, V width about 5 m), mirror-steel end bays, and the door end:
//     a central four-leaf glazed door group 4.4 m wide with yellow safety bands, the grey sign plate «Горный институт / Gorny Institut», a copper louvre panel with the plain blue M and a dark glass band
//     carrying ГОРНЫЙ ИНСТИТУТ in orange letters;
//   * the LIFT pavilion No. 3 (w1346671783, 11.0 x 5.6 m): black louvres over a light granite lower half, mono-pitch copper roof 5.3 / 3.8 m, a glazed door group in each narrow end, the grey oval «Лифт № 3»,
//     one V brace with orange nodes on the NNW long face.  Closed: exterior solid.
// Frames: a door frame per pavilion (origin = the centre of the footprint, local +z = out through the door, local +x across), built from the baked ring and the metro's DOORWAYS row (door anchor, rotY).
// The metro owner draws everything INSIDE the footprint (floor y 0.05, ceiling 3.1 m above it, the well with its stair and escalator): this shell draws walls and roof only; the roof underside is above y 3.2.
// Colliders: thin walls on the baked ring, split at the 4.4 m door opening (addPolyColliders knows DOORWAYS); publishes ctx.services.landmarksSredny.metro = { signs: true } (the metro skips its totems).
import * as THREE from 'three';
import * as L from '../layout.js';
import { addPolyColliders } from '../lib/massing.js';
import { ringOf } from './frame.js';
import { fillPolyClipped, coverFn } from './surfaces.js';

/** a door frame from the baked ring of building `id` and the DOORWAYS row `doorId`: { cx, cz, rot, L, W, doorX } (origin = centre of the bounding rectangle in the door frame) */
function doorFrame(id, doorId, rotOverride, fallback) {
  const ring = ringOf(id), door = (L.DOORWAYS || []).find((d) => d.id === doorId);
  if (!ring) return fallback;
  const rot = rotOverride ?? (door ? door.rotY : fallback.rot), dn = [Math.sin(rot), Math.cos(rot)], px = [Math.cos(rot), -Math.sin(rot)];
  let c0x = 0, c0z = 0; for (const p of ring) { c0x += p[0]; c0z += p[1]; } c0x /= ring.length; c0z /= ring.length;
  let z0 = 1e9, z1 = -1e9, x0 = 1e9, x1 = -1e9;
  for (const p of ring) { const z = (p[0] - c0x) * dn[0] + (p[1] - c0z) * dn[1], x = (p[0] - c0x) * px[0] + (p[1] - c0z) * px[1]; z0 = Math.min(z0, z); z1 = Math.max(z1, z); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const mz = (z0 + z1) / 2, mx = (x0 + x1) / 2, cx = c0x + dn[0] * mz + px[0] * mx, cz = c0z + dn[1] * mz + px[1] * mx;
  const doorX = door ? (door.x - cx) * px[0] + (door.z - cz) * px[1] : 0;
  return { cx, cz, rot, L: z1 - z0, W: x1 - x0, doorX, doorRow: door || null };
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSredny] gorny/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const Fin = doorFrame('w1305590665', 'gorny-in', null, { cx: -5053.9, cz: 18.9, rot: -2.6224, L: 15.6, W: 7.3, doorX: 0 });
  const Fout = doorFrame('w1305590664', 'gorny-out', null, { cx: -5018.0, cz: -29.4, rot: -1.0347, L: 15.4, W: 8.1, doorX: 0 });
  const Flift = doorFrame('w1346671783', null, -1.0572, { cx: -5044.3, cz: -13.8, rot: -1.0572, L: 11.0, W: 5.6, doorX: 0 });
  stage('entrance', () => pavilion(K, Fin, 'entrance'));
  stage('exit', () => pavilion(K, Fout, 'exit'));
  stage('lift', () => lift(K, Flift));
  stage('colliders', () => colliders(K));
  stage('aprons', () => aprons(K, [Fin, Fout]));
  stage('service', () => service(K, Fin, Fout, Flift));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ geometry helpers (door frame: local +z = out through the door, x across, y up)
/** a quad between z0..z1 on the plane x = xs whose y runs ya(z) .. yb(z); n = outward normal sign (+1 faces +x) */
function sideQuad(P, mat, xs, z0, z1, ya, yb, n, uvs = [1.5, 2.6]) {
  P.quad(mat, [xs, ya(z0), z0], [xs, ya(z1), z1], [xs, yb(z1), z1], [xs, yb(z0), z0], [n, 0, 0], [[z0 / uvs[0], ya(z0) / uvs[1]], [z1 / uvs[0], ya(z1) / uvs[1]], [z1 / uvs[0], yb(z1) / uvs[1]], [z0 / uvs[0], yb(z0) / uvs[1]]]);
}
/** a horizontal-ish slab face over x0..x1, z0..z1 with y = yf(z) + dy; up = true faces +y */
function slabQuad(P, mat, x0, x1, z0, z1, yf, dy, up, tile = 2) {
  P.quad(mat, [x0, yf(z0) + dy, z0], [x1, yf(z0) + dy, z0], [x1, yf(z1) + dy, z1], [x0, yf(z1) + dy, z1], [0, up ? 1 : -1, 0], [[x0 / tile, z0 / tile], [x1 / tile, z0 / tile], [x1 / tile, z1 / tile], [x0 / tile, z1 / tile]]);
}
/** a flat strut (0.12 deep x 0.26 wide) between two points of a plane x = xs (y, z pairs), as a rotated box */
function strut(P, mat, xs, a, b, w = 0.26, d = 0.12) {
  const dy = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dy, dz), th = Math.atan2(dz, dy);
  const g = new THREE.BoxGeometry(d, len, w);
  P.geo(mat, g, xs, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, th, 0, 0); g.dispose();
}
const disc = (P, mat, xs, y, z, r = 0.25, t = 0.2) => P.cyl(mat, [xs - t / 2, y, z], [xs + t / 2, y, z], r, r, 14, true);

function pavilion(K, F, kind) {
  const { P, M, ctx } = K, hl = F.L / 2, hw = F.W / 2, X = F.doorX;
  const yTop = (z) => 4.2 + 2.8 * (z + hl) / F.L, T = 0.45, yUn = (z) => yTop(z) - T;
  const zFront = hl + 1.8, zBack = -hl - 0.5, xo = hw + 0.9;
  const PL = 1.0, gx = hw - 0.4;
  P.push(F.cx, 0, F.cz, F.rot);
  try {
    // ---- the mono-pitch roof slab: top (copper rim round the sky-blue glass panel), soffit, four fascia faces
    const topq = (mat, x0, x1, z0, z1) => slabQuad(P, mat, x0, x1, z0, z1, yTop, 0, true, 2);
    topq(M.skyGlass, -hw, hw, -hl, hl);
    topq(M.copperTop, -xo, -hw, zBack, zFront); topq(M.copperTop, hw, xo, zBack, zFront);
    topq(M.copperTop, -hw, hw, zBack, -hl); topq(M.copperTop, -hw, hw, hl, zFront);
    slabQuad(P, M.copper, -xo, xo, zBack, zFront, yTop, -T, false, 2);
    P.quad(M.copper, [-xo, yUn(zFront), zFront], [xo, yUn(zFront), zFront], [xo, yTop(zFront), zFront], [-xo, yTop(zFront), zFront], [0, 0, 1]);
    P.quad(M.copperShade, [xo, yUn(zBack), zBack], [-xo, yUn(zBack), zBack], [-xo, yTop(zBack), zBack], [xo, yTop(zBack), zBack], [0, 0, -1]);
    for (const s of [-1, 1]) P.quad(M.copper, [s * xo, yUn(zBack), zBack], [s * xo, yUn(zFront), zFront], [s * xo, yTop(zFront), zFront], [s * xo, yTop(zBack), zBack], [s, 0, 0]);
    // recessed downlights in the soffit over the doors (a row of 5 small discs)
    for (let i = -2; i <= 2; i++) P.cyl(M.white, [X + i * 0.9, yUn(hl + 0.9) - 0.01, hl + 0.9], [X + i * 0.9, yUn(hl + 0.9) - 0.03, hl + 0.9], 0.07, 0.07, 8, true);

    // ---- long walls: dark glass above the banded plinth, mirror steel in the end bay at the door end, mullions every 1.5 m, braces
    const mirrorLen = 3.5;
    for (const s of [-1, 1]) {
      const xs = s * gx;
      sideQuad(P, M.glassPav, xs, -hl, hl - mirrorLen, () => PL, yUn, s);
      sideQuad(P, M.mirror, s * (gx + 0.06), hl - mirrorLen, hl, () => PL, yUn, s, [3.5, 6]);
      // plinth: banded granite slabs 1.0 m high, 0.4 m deep (two long sides)
      P.box(M.granBand, s > 0 ? gx : -hw, s > 0 ? hw : -gx, 0, PL, -hl, hl, 'b', 2.4);
      // mullions
      const nm = Math.round((F.L - mirrorLen) / 1.5);
      for (let i = 0; i <= nm; i++) { const z = -hl + i * (F.L - mirrorLen) / nm; P.box(M.dark, xs + s * 0.01 - 0.04, xs + s * 0.01 + 0.04, PL, yUn(z), z - 0.04, z + 0.04, 'b', 1); }
      // lamp strip effect is in the glass texture; the zigzag brace plane stands 0.25 m off the plinth
      const xb = s * (hw + 0.25), nn = 6, z0 = -hl + 0.4, dz = (F.L - 0.8) / nn;
      const node = (i) => ({ z: z0 + i * dz, y: i % 2 === 0 ? 0.45 : yUn(z0 + i * dz) - 0.28 });
      for (let i = 0; i < nn; i++) { const a = node(i), b = node(i + 1); strut(P, M.stainless, xb, [a.y, a.z], [b.y, b.z]); }
      for (let i = 0; i <= nn; i++) { const a = node(i); disc(P, M.orange, xb + s * 0.1, a.y, a.z, 0.27, 0.26); P.cyl(M.copperShade, [xb + s * 0.1 + s * 0.12, a.y, a.z], [xb + s * 0.1 + s * 0.16, a.y, a.z], 0.13, 0.13, 10, true); }
      // short brackets from the top nodes to the wall (the nodes hang on the eave)
      for (let i = 1; i <= nn; i += 2) { const a = node(i); P.box(M.dark, Math.min(xb, xs) - 0.03, Math.max(xb, xs) + 0.03, a.y - 0.04, a.y + 0.04, a.z - 0.04, a.z + 0.04, '', 1); }
    }
    // ---- rear end: banded plinth + dark glazing above, a closed face
    P.box(M.granBand, -hw, hw, 0, PL, -hl, -hl + 0.4, 'b', 2.4);
    P.quad(M.glassPav, [hw - 0.4, PL, -hl + 0.4], [-hw + 0.4, PL, -hl + 0.4], [-hw + 0.4, yUn(-hl), -hl + 0.4], [hw - 0.4, yUn(-hl), -hl + 0.4], [0, 0, -1], [[0, 0], [F.W / 1.5, 0], [F.W / 1.5, 1.3], [0, 1.3]]);
    // ---- the door end (z = hl): door group 4.4 m, steel strips, sign plate on a canopy bar, copper louvre panel with the blue M, dark glass band with the name
    const zf = hl, dw = 4.4, dTop = 3.0;
    // mirror-steel flanks of the front, from the plinth to the soffit line
    for (const s of [-1, 1]) {
      const xa = X + s * (dw / 2 + 0.5), xb2 = s * hw, xs = X + s * dw / 2;
      P.quad(M.mirror, [xa, 0, zf + 0.04], [xb2, 0, zf + 0.04], [xb2, yUn(hl), zf + 0.04], [xa, yUn(hl), zf + 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.box(M.stainless, Math.min(xs, xa), Math.max(xs, xa), 0, dTop + 0.3, zf - 0.02, zf + 0.12, 'b', 1);                    // the narrow steel strip beside the door group
    }
    // door group: dark frame, four glass leaves, yellow safety bands at 1.0 m and 1.5 m, a transom bar
    P.box(M.dark, X - dw / 2, X + dw / 2, dTop, dTop + 0.08, zf - 0.04, zf + 0.1, 'b', 1);
    P.box(M.dark, X - dw / 2 - 0.05, X - dw / 2 + 0.05, 0.05, dTop + 0.08, zf - 0.04, zf + 0.1, 'b', 1);
    P.box(M.dark, X + dw / 2 - 0.05, X + dw / 2 + 0.05, 0.05, dTop + 0.08, zf - 0.04, zf + 0.1, 'b', 1);
    for (let i = 0; i < 4; i++) {
      const xa = X - dw / 2 + i * dw / 4, xb2 = xa + dw / 4;
      P.quad(M.doorGlass, [xa + 0.04, 0.06, zf + 0.02], [xb2 - 0.04, 0.06, zf + 0.02], [xb2 - 0.04, dTop, zf + 0.02], [xa + 0.04, dTop, zf + 0.02], [0, 0, 1]);
      for (const y of [1.0, 1.5]) P.quad(M.yellow, [xa + 0.04, y, zf + 0.04], [xb2 - 0.04, y, zf + 0.04], [xb2 - 0.04, y + 0.12, zf + 0.04], [xa + 0.04, y + 0.12, zf + 0.04], [0, 0, 1]);
      P.box(M.dark, xa - 0.025, xa + 0.025, 0.05, dTop, zf - 0.02, zf + 0.06, 'b', 1);
    }
    // canopy bar + sign plate
    P.box(M.stainless, X - 1.7, X + 1.7, dTop + 0.1, dTop + 0.3, zf, zf + 0.42, 'b', 1);
    P.quad(M.signPlate, [X - 1.5, dTop + 0.13, zf + 0.43], [X + 1.5, dTop + 0.13, zf + 0.43], [X + 1.5, dTop + 0.27, zf + 0.43], [X - 1.5, dTop + 0.27, zf + 0.43], [0, 0, 1], [[0, 0.1], [1, 0.1], [1, 0.9], [0, 0.9]]);
    // copper louvre panel (6.2 x 1.9 m) and the blue M ring; dark glass band with the name
    const lw = Math.min(6.2, F.W - 0.5), yl0 = dTop + 0.4, yl1 = yl0 + 1.85, yb1 = yUn(hl) - 0.02;
    P.quad(M.louvre, [X - lw / 2, yl0, zf + 0.01], [X + lw / 2, yl0, zf + 0.01], [X + lw / 2, yl1, zf + 0.01], [X - lw / 2, yl1, zf + 0.01], [0, 0, 1], [[0, 0], [lw, 0], [lw, 1.85 / 0.96], [0, 1.85 / 0.96]]);
    P.quad(M.blueM, [X - 0.45, yl0 + 0.5, zf + 0.04], [X + 0.45, yl0 + 0.5, zf + 0.04], [X + 0.45, yl0 + 1.4, zf + 0.04], [X - 0.45, yl0 + 1.4, zf + 0.04], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.nameBand, [X - lw / 2, yl1, zf + 0.01], [X + lw / 2, yl1, zf + 0.01], [X + lw / 2, yb1, zf + 0.01], [X - lw / 2, yb1, zf + 0.01], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // louvre frame strips
    P.box(M.stainless, X - lw / 2, X + lw / 2, yl0 - 0.06, yl0, zf - 0.0, zf + 0.06, 'b', 1);
    // a CCTV dome on each mirror flank (tiny)
    for (const s of [-1, 1]) { const g = new THREE.SphereGeometry(0.1, 8, 5); P.geo(M.dark, g, s * (hw - 0.15), 3.6, zf + 0.12); g.dispose(); }
    // granite apron step in front of the door group
    P.box(M.granBand, X - dw / 2 - 0.3, X + dw / 2 + 0.3, 0, 0.05, zf, zf + 1.2, 'b', 2.4);
  } finally { P.pop(); }
  K.svc.pavilions = K.svc.pavilions || {}; K.svc.pavilions[kind] = { x: F.cx, z: F.cz, rot: F.rot, L: F.L, W: F.W };
  void ctx;
}

// ------------------------------------------------------------------------------------------------ the lift pavilion No. 3 (11.0 x 5.6 m; local +z = the WSW end with the photographed door and the sign)
function lift(K, F) {
  const { P, M } = K, hl = F.L / 2, hw = F.W / 2;
  const yTop = (z) => 3.8 + 1.5 * (z + hl) / F.L, T = 0.35, yUn = (z) => yTop(z) - T;
  const xo = hw + 0.5, zFront = hl + 0.9, zBack = -hl - 0.4;
  P.push(F.cx, 0, F.cz, F.rot);
  try {
    // roof: copper-orange top (solid, no glass panel), copper fascia 0.35 m, black soffit
    slabQuad(P, M.copperTop, -xo, xo, zBack, zFront, yTop, 0, true, 2);
    slabQuad(P, M.dark, -xo, xo, zBack, zFront, yTop, -T, false, 2);
    P.quad(M.copper, [-xo, yUn(zFront), zFront], [xo, yUn(zFront), zFront], [xo, yTop(zFront), zFront], [-xo, yTop(zFront), zFront], [0, 0, 1]);
    P.quad(M.copperShade, [xo, yUn(zBack), zBack], [-xo, yUn(zBack), zBack], [-xo, yTop(zBack), zBack], [xo, yTop(zBack), zBack], [0, 0, -1]);
    for (const s of [-1, 1]) P.quad(M.copper, [s * xo, yUn(zBack), zBack], [s * xo, yUn(zFront), zFront], [s * xo, yTop(zFront), zFront], [s * xo, yTop(zBack), zBack], [s, 0, 0]);
    // the walls: light granite 1.85 m, black louvres above up to the soffit
    const GH = 1.85;
    for (const s of [-1, 1]) {
      const xs = s * hw;
      P.quad(M.graniteLift, [xs, 0, s > 0 ? -hl : hl], [xs, 0, s > 0 ? hl : -hl], [xs, GH, s > 0 ? hl : -hl], [xs, GH, s > 0 ? -hl : hl], [s, 0, 0], [[0, 0], [F.L / 1.2, 0], [F.L / 1.2, GH / 0.6], [0, GH / 0.6]]);
      sideQuad(P, M.louvreBlack, xs, -hl, hl, () => GH, yUn, s, [1, 0.96]);
    }
    for (const [zs, nz] of [[-hl, -1], [hl, 1]]) {
      // end walls: granite below, louvres above, a glazed door group (door + side light) in the middle
      const xa = nz > 0 ? -hw : hw, xb2 = nz > 0 ? hw : -hw;
      P.quad(M.graniteLift, [xa, 0, zs], [xb2, 0, zs], [xb2, GH, zs], [xa, GH, zs], [0, 0, nz], [[0, 0], [F.W / 1.2, 0], [F.W / 1.2, GH / 0.6], [0, GH / 0.6]]);
      P.quad(M.louvreBlack, [xa, GH, zs], [xb2, GH, zs], [xb2, yUn(zs), zs], [xa, yUn(zs), zs], [0, 0, nz], [[0, GH / 0.96], [F.W, GH / 0.96], [F.W, yUn(zs) / 0.96], [0, yUn(zs) / 0.96]]);
      const dx = -0.2, dz = zs + nz * 0.04;
      P.box(M.dark, dx - 1.0, dx + 1.0, 0.05, 2.3, zs - (nz > 0 ? 0.02 : 0.08), zs + (nz > 0 ? 0.08 : 0.02), 'b', 1);
      P.quad(M.doorGlass, [dx - 0.9, 0.1, dz], [dx + 0.9, 0.1, dz], [dx + 0.9, 2.2, dz], [dx - 0.9, 2.2, dz], [0, 0, nz]);
      P.box(M.dark, dx - 0.03, dx + 0.03, 0.1, 2.2, zs + nz * 0.02, zs + nz * 0.07, '', 1);
      if (nz > 0) P.quad(M.liftPlate, [dx - 0.65, 2.45, zs + 0.05], [dx + 0.65, 2.45, zs + 0.05], [dx + 0.65, 2.8, zs + 0.05], [dx - 0.65, 2.8, zs + 0.05], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      // a granite step / ramp
      P.box(M.graniteLift, dx - 1.3, dx + 1.3, 0, 0.06, zs + (nz > 0 ? 0 : -0.8), zs + (nz > 0 ? 0.8 : 0), 'b', 1.2);
    }
    // one V brace of two stainless tubes with orange discs on the NNW long face (local +x side faces NNW)
    const xb = hw + 0.18, zc = 0;
    strut(P, M.stainless, xb, [0.45, zc - 2.6], [yUn(zc) - 0.3, zc], 0.2, 0.1); strut(P, M.stainless, xb, [yUn(zc) - 0.3, zc], [0.45, zc + 2.6], 0.2, 0.1);
    for (const [y, z] of [[0.45, zc - 2.6], [yUn(zc) - 0.3, zc], [0.45, zc + 2.6]]) disc(P, M.orange, xb, y, z, 0.22, 0.18);
  } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ colliders: thin walls on the baked rings, split at the metro doors
function colliders(K) {
  const ctx = K.ctx;
  for (const [id, h] of [['w1305590665', 7.4], ['w1305590664', 7.4], ['w1346671783', 5.6]]) {
    const b = L.buildingById(id); if (!b || !b.polys) continue;
    for (const poly of b.polys) addPolyColliders(ctx, poly, 0, h, 0.5);
  }
}

// ------------------------------------------------------------------------------------------------ granite aprons in front of the two doors (clipped at the asphalt)
function aprons(K, frames) {
  const { P, M, ctx } = K, cover = coverFn(ctx);
  for (const F of frames) {
    const dn = [Math.sin(F.rot), Math.cos(F.rot)], px = [Math.cos(F.rot), -Math.sin(F.rot)], z0 = F.L / 2 + 0.05, z1 = z0 + 4.2, hwid = 4.2;
    const at = (x, z) => [F.cx + dn[0] * z + px[0] * x, F.cz + dn[1] * z + px[1] * x];
    const ring = [at(-hwid + F.doorX, z0), at(hwid + F.doorX, z0), at(hwid + F.doorX, z1), at(-hwid + F.doorX, z1)];
    fillPolyClipped(P, M.plaza, ring, 0.065, (x, z) => (L.insideBuilding(x, z, 0.3) ? 1 : cover(x, z)), { margin: 0.3, maxEdge: 2.5, tile: 2.4 });
  }
}

// ------------------------------------------------------------------------------------------------ services: the metro signs, entrances, crowd, photo spots
function service(K, Fin, Fout, Flift) {
  const svc = K.svc;
  svc.metro = { signs: true };
  for (const [F, id, name] of [[Fin, 'gorny-in', 'Горный институт: вход'], [Fout, 'gorny-out', 'Горный институт: выход']]) {
    const d = F.doorRow;
    if (d) svc.entrances.push({ id, x: d.x, z: d.z, rotY: d.rotY, w: d.w, kind: 'metro', name });
  }
  svc.crowd.push({ id: 'gorny-plaza', kind: 'plaza', x: -5036, z: -5, r: 12, n: 6 });
  const cover = coverFn(K.ctx), spot = (x, z, yaw, pitch, name) => { if (cover(x, z) < -0.5 && !L.insideBuilding(x, z, 0.5)) svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-5030, 2, 124, 6, 'Горный институт: павильоны метро на площади');
  spot(-5040, 30, 150, 6, 'Горный институт: вход со стороны Большого проспекта');
  void Flift;
}
