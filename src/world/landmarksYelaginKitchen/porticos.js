// landmarksYelaginKitchen/porticos.js - the two Doric porticos of the Kitchen block (dossier 6.1, CRITIC re-measurement; photos kit_01 kit_02 kit_05 kit_06 kit_09 kit_11 kit_13 kit_14):
//   SOUTH (faces the Oil Meadow and the palace): six smooth Doric columns 6.2 m (axes u -8.2 -5.2 -2.2 2.2 5.2 8.2: bays 3.0 m, the middle bay 4.4 m) on a stylobate 0.5 m above the lawn with three low steps, the entablature
//   with a frieze of 16 rosettes (paterae), mutules and a pediment (apex 11.7 m), the round-headed recess with the double wooden door 2.5 x 3.7 m, and FOUR statue niches in the back wall (2 + 2 beside the door).
//   NORTH (faces the Orangery): the same order on a stylobate 1.0 m above the ground with five steps, the garland frieze on the back wall and FIVE arched niches with a vase on a pedestal each.
//   Back wall ends are antae; the sides are open.  The interior is closed (the door is painted shut).  All in frame K, built in a facade frame (x along the front, z out of the back wall).
import * as THREE from 'three';
import { C, TH, D, PS, PN, POR, W } from './frame.js';
import { rectPath, archPath } from './kit.js';
import { doric, rosette, mutules, pediment } from './orders.js';
import { archNiche } from './body.js';
import { geosOf, put } from './objs.js';
import { revolve } from './geo.js';

const Z_COL = 2.0, Z_A = 2.55, Z_F = 2.98;

/** a rectangular niche (recess) in the plane z = 0 of the current frame; the wall around it is a Shape with a hole */
function rectNiche(P, M, cx, y0, y1, w, dep) {
  const l = cx - w / 2, r = cx + w / 2, zb = -dep;
  P.quad(M.wall, [l, y0, zb], [r, y0, zb], [r, y1, zb], [l, y1, zb], [0, 0, 1], [[0, 0], [w / 3, 0], [w / 3, (y1 - y0) / 3], [0, (y1 - y0) / 3]]);
  P.quad(M.shade, [l, y0, 0], [l, y0, zb], [l, y1, zb], [l, y1, 0], [1, 0, 0]);
  P.quad(M.wall, [r, y0, zb], [r, y0, 0], [r, y1, 0], [r, y1, zb], [-1, 0, 0]);
  P.quad(M.whiteFlat, [l, y0, 0], [r, y0, 0], [r, y0, zb], [l, y0, zb], [0, 1, 0]);
  P.quad(M.whiteFlat, [l, y1, zb], [r, y1, zb], [r, y1, 0], [l, y1, 0], [0, -1, 0]);
}

function entablatureOn(P, M, yc, zb = 0) {
  const hw = POR.halfW, xa = hw - 0.4;                                                    // beam side faces at u = +-8.75
  // architrave (0.45): front beam over the column row + two side beams back to the wall, joined at the corners
  P.box(M.white, -xa, xa, yc, yc + 0.45, Z_COL - 0.5, Z_A, '', 3);
  for (const s of [-1, 1]) P.box(M.white, s > 0 ? xa - 0.5 : -xa, s > 0 ? xa : -xa + 0.5, yc, yc + 0.45, zb, Z_COL - 0.5, 'k', 3);
  P.quad(M.shade, [-xa + 0.5, yc, zb], [xa - 0.5, yc, zb], [xa - 0.5, yc, Z_COL - 0.5], [-xa + 0.5, yc, Z_COL - 0.5], [0, -1, 0]);               // ceiling of the portico (plain, between the beams)
  P.box(M.white, -xa - 0.01, xa + 0.01, yc + 0.28, yc + 0.31, Z_A, Z_A + 0.03, 'bk', 3);                                                                  // the fascia line
  // frieze (0.65): flat face 3 cm behind the architrave, rosettes in the fields between narrow strips
  const yf = yc + 0.45, xf = xa - 0.03, zf = Z_A - 0.03;
  P.box(M.white, -xf, xf, yf, yf + 0.65, Z_COL - 0.5, zf, 'b', 3);
  for (const s of [-1, 1]) P.box(M.white, s > 0 ? xf - 0.5 : -xf, s > 0 ? xf : -xf + 0.5, yf, yf + 0.65, zb, Z_COL - 0.5, 'bk', 3);
  const nF = 16, pitch = 2 * xf / nF;
  for (let i = 0; i < nF; i++) {
    const x = -xf + pitch * (i + 0.5);
    rosette(P, M, x, yf + 0.325, zf, 0.25, 1);
    if (i > 0) P.box(M.whiteFlat, -xf + pitch * i - 0.1, -xf + pitch * i + 0.1, yf + 0.04, yf + 0.61, zf, zf + 0.04, 'bk', 3);
  }
  for (const s of [-1, 1]) {                                                                                                                                // side returns: two rosettes each
    P.push(s * xf, 0, 0, s * Math.PI / 2);
    for (const z of [0.5 + (Z_COL - 0.5) * 0.25, 0.5 + (Z_COL - 0.5) * 0.75 + 0.2]) rosette(P, M, s > 0 ? -z : z, yf + 0.325, 0.0, 0.25, 1);
    P.pop();
  }
  // cornice: dark core + mutule blocks (0.25), corona (0.2), cymatium (0.1)
  const yb = yf + 0.65;
  P.box(M.shade, -hw + 0.3, hw - 0.3, yb, yb + 0.25, Z_COL - 0.5, Z_F - 0.35, 'b', 3);
  mutules(P, M, -hw + 0.45, hw - 0.45, yb, Z_COL - 0.5, Z_F - 0.32, 0.6);
  for (const s of [-1, 1]) { P.box(M.shade, s > 0 ? hw - 0.7 : -hw + 0.3, s > 0 ? hw - 0.3 : -hw + 0.7, yb, yb + 0.25, zb, Z_COL - 0.5, 'bk', 3); }
  P.box(M.white, -hw, hw, yb + 0.25, yb + 0.45, Z_COL - 0.5 + 0.1, Z_F, '', 3);                                                                            // corona, front run (soffit visible)
  for (const s of [-1, 1]) P.box(M.white, s > 0 ? hw - 0.6 : -hw, s > 0 ? hw : -hw + 0.6, yb + 0.25, yb + 0.45, zb, Z_COL - 0.4, 'k', 3);
  P.box(M.white, -hw + 0.1, hw - 0.1, yb + 0.45, yb + 0.55, Z_COL - 0.5, Z_F - 0.08, 'b', 3);                                                              // cymatium
  for (const s of [-1, 1]) P.box(M.white, s > 0 ? hw - 0.6 : -hw + 0.1, s > 0 ? hw - 0.1 : -hw + 0.7, yb + 0.45, yb + 0.55, zb, Z_COL - 0.5, 'bk', 3);
  return yb + 0.55;                                                                                                                                        // top of the entablature
}

function roofOn(P, M, yT, yA, zb) {
  const hw = POR.halfW, yBack = yT + 0.2;
  for (const s of [-1, 1]) {
    const e = [s * hw, yT, Z_F], e2 = [s * hw, yT, zb], ap = [0, yA, Z_F], ap2 = [0, yBack, zb];
    const nrm = [s * 0.35, 0.9, 0.2];
    P.fan(M.zinc, [e, ap, e2], nrm, (p) => [p[0] / 1.2, p[2] / 1.2]);
    P.fan(M.zinc, [ap, ap2, e2], nrm, (p) => [p[0] / 1.2, p[2] / 1.2]);
  }
  P.quad(M.wall, [hw, D.top + 0.03, zb], [-hw, D.top + 0.03, zb], [-hw, yT, zb], [hw, yT, zb], [0, 0, -1]);                                                    // back skirt of the roof against the drum
  P.fan(M.wall, [[-hw, yT, zb], [hw, yT, zb], [0, yBack, zb]], [0, 0, -1]);
}

/** one portico in its facade frame.  spec = { floor, H, steps, tread, kind: 'S' | 'N' } */
function portico(K, spec) {
  const { M, P } = K;
  const hw = POR.halfW, fl = spec.floor, yc = fl + spec.H;
  // stylobate and steps (tan limestone)
  P.box(M.plinth, -hw - 0.25, hw + 0.25, 0, fl, -0.05, 3.1, 'b', 1.1);
  const rise = fl / spec.steps;
  for (let i = 1; i < spec.steps; i++) P.box(M.plinth, -hw - 0.25, hw + 0.25, 0, fl - i * rise, 3.1 + (i - 1) * spec.tread, 3.1 + i * spec.tread, 'bk', 1.1);
  // back wall: Shape with holes (niches / door), its niche recesses and the band of the dado
  const yw1 = yc + 0.01;
  const sh = new THREE.Shape(); rectPath(sh, -hw, fl, hw, yw1, false);
  const holes = [];
  if (spec.kind === 'S') {
    for (const u of [-6.7, -3.7, 3.7, 6.7]) { const h = new THREE.Path(); rectPath(h, u - D.nicheW / 2, fl + 0.9, u + D.nicheW / 2, fl + 0.9 + D.nicheH, true); sh.holes.push(h); holes.push(u); }
    const dh = new THREE.Path(); archPath(dh, 0, fl, POR.door.w, POR.door.h, true); sh.holes.push(dh);
  } else {
    for (const u of [-6.7, -3.7, 0, 3.7, 6.7]) { const h = new THREE.Path(); archPath(h, u, fl + 0.55, D.archW, D.archSpring - D.plinth + 0.55 - 0.55 + 0.0, true); sh.holes.push(h); holes.push(u); }
  }
  P.face(M.wall, sh, 0, 3);
  if (spec.kind === 'S') {
    for (const u of holes) rectNiche(P, M, u, fl + 0.9, fl + 0.9 + D.nicheH, D.nicheW, 0.5);
    // the door: a recessed panel, reveals and the plastered lunette above; archivolt with a keystone
    const dw = POR.door.w, dh = POR.door.h, r = dw / 2, zb = -0.22;
    P.quad(M.door, [-r, fl, zb], [r, fl, zb], [r, fl + dh, zb], [-r, fl + dh, zb], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const back = new THREE.Shape(); archPath(back, 0, fl + dh, dw, 0.001, false);
    P.face(M.wall, back, zb, 3);
    P.quad(M.shade, [-r, fl, 0], [-r, fl, zb], [-r, fl + dh, zb], [-r, fl + dh, 0], [1, 0, 0]);
    P.quad(M.wall, [r, fl, zb], [r, fl, 0], [r, fl + dh, 0], [r, fl + dh, zb], [-1, 0, 0]);
    for (let i = 0; i < 12; i++) {
      const a0 = Math.PI * i / 12, a1 = Math.PI * (i + 1) / 12, am = (a0 + a1) / 2;
      const p0 = [r * Math.cos(a0), fl + dh + r * Math.sin(a0)], p1 = [r * Math.cos(a1), fl + dh + r * Math.sin(a1)];
      P.quad(M.shade, [p0[0], p0[1], 0], [p0[0], p0[1], zb], [p1[0], p1[1], zb], [p1[0], p1[1], 0], [-Math.cos(am), -Math.sin(am), 0]);
    }
    const outer = new THREE.Shape(); archPath(outer, 0, fl, dw + 0.7, dh, false);
    const hole = new THREE.Path(); archPath(hole, 0, fl, dw, dh, true); outer.holes.push(hole);
    P.extrude(M.whiteFlat, outer, -0.02, 0.16, 3, 14);
    P.box(M.whiteFlat, -0.22, 0.22, fl + dh + r + 0.06, fl + dh + r + 0.55, 0.0, 0.2, 'b', 3);                      // keystone
    P.box(M.plinth, -r - 0.35, r + 0.35, fl - 0.0, fl + 0.04, 0.0, 0.5, 'b', 1.1);                                       // threshold
  } else {
    for (const u of holes) archNiche(P, M, u, { y0: fl + 0.55, ySpring: fl + 0.55 + (D.archSpring - D.plinth), depth: 0.5 });
    // the garland frieze under the ceiling, between pilaster strips (photo kit_14)
    const yf0 = yc - 1.05, yf1 = yc - 0.4;
    P.quad(M.festoon, [-hw + 0.45, yf0, 0.04], [hw - 0.45, yf0, 0.04], [hw - 0.45, yf1, 0.04], [-hw + 0.45, yf1, 0.04], [0, 0, 1], [[0, 0], [(2 * hw - 0.9) / 3.6, 0], [(2 * hw - 0.9) / 3.6, 1], [0, 1]]);
    P.box(M.white, -hw + 0.45, hw - 0.45, yf1, yf1 + 0.08, 0, 0.12, 'bk', 3); P.box(M.white, -hw + 0.45, hw - 0.45, yf0 - 0.08, yf0, 0, 0.12, 'bk', 3);
  }
  // dado: a grooved band 0.55 m under the niches, antae (flat piers) at both ends
  P.quad(M.bands, [-hw, fl, 0.02], [hw, fl, 0.02], [hw, fl + 0.55, 0.02], [-hw, fl + 0.55, 0.02], [0, 0, 1], [[-hw / 0.55, 0], [hw / 0.55, 0], [hw / 0.55, 1], [-hw / 0.55, 1]]);
  for (const s of [-1, 1]) {
    P.box(M.white, s > 0 ? hw - 0.75 : -hw, s > 0 ? hw : -hw + 0.75, fl, yc, 0, 0.5, 'bk', 3);
    P.box(M.whiteFlat, s > 0 ? hw - 0.85 : -hw - 0.1, s > 0 ? hw + 0.1 : -hw + 0.85, yc - 0.3, yc, 0, 0.6, 'b', 3);
    P.box(M.grey, s > 0 ? hw - 0.8 : -hw - 0.05, s > 0 ? hw + 0.05 : -hw + 0.8, fl, fl + 0.3, 0, 0.58, 'b', 3);
  }
  // entablature, pediment, roof
  const yT = entablatureOn(P, M, yc);
  pediment(P, M, -hw, hw, yT, POR.pedRise, Z_F, Z_F - 0.55);
  roofOn(P, M, yT, yT + POR.pedRise + 0.18, 0);
  return { yc, yT };
}

// ------------------------------------------------------------------------------------------------ vases (the north niches)
function vasePedestal(M) {
  return geosOf((P) => {
    P.box(M.whiteFlat, -0.46, 0.46, 0, 0.14, -0.46, 0.46, 'b', 1.8); P.box(M.white, -0.38, 0.38, 0.14, 0.82, -0.38, 0.38, 'b', 1.8); P.box(M.whiteFlat, -0.44, 0.44, 0.82, 0.92, -0.44, 0.44, 'b', 1.8);
    P.box(M.whiteFlat, -0.32, 0.32, 0.92, 1.0, -0.32, 0.32, 'b', 1.8);
    for (const [nx, nz, rot] of [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]]) {
      P.push(nx * 0.385, 0.48, nz * 0.385, rot);                                                         // the wreath roundel on each face
      const t = new THREE.TorusGeometry(0.15, 0.03, 3, 10); P.geo(M.whiteFlat, t, 0, 0, 0.0); t.dispose(); P.pop();
    }
    // the vase: a Medici krater on a stem (profile after kit_14): foot, stem, fluted belly, flaring rim, two handles
    const prof = [[0, 1.0], [0.2, 1.0], [0.2, 1.06], [0.12, 1.12], [0.09, 1.22], [0.12, 1.3], [0.24, 1.4], [0.33, 1.52], [0.37, 1.66], [0.36, 1.76], [0.4, 1.84], [0.44, 1.9], [0.42, 1.93], [0.36, 1.93], [0.3, 1.88], [0, 1.88]];
    revolve(P, M.whiteFlat, prof, 20, { crease: 55 });
    for (const s of [-1, 1]) {
      const pts = [[s * 0.37, 1.7], [s * 0.5, 1.8], [s * 0.53, 1.66], [s * 0.44, 1.56]];
      for (let i = 0; i + 1 < pts.length; i++) P.cyl(M.whiteFlat, [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0], 0.035, 0.035, 5, false);
    }
  });
}

export function build(K) {
  const { M, P, root } = K;
  const stepsRise = 0;
  void stepsRise;
  // ---- south portico: facade frame at the back wall plane, local +z = south
  P.push(C.x, 0, C.z, TH);
  P.push(0, 0, PS.back, 0);
  const s = portico(K, { floor: PS.floor, H: POR.H, steps: PS.steps, tread: 0.42, kind: 'S' });
  P.pop();
  P.push(0, 0, PN.back, Math.PI);
  const n = portico(K, { floor: PN.floor, H: POR.H - 0.5, steps: PN.steps, tread: 0.38, kind: 'N' });
  P.pop();
  K.shared.porticoTop = { s, n };
  // ---- columns: ONE geometry each for the south (6.2 m) and the north (5.7 m) porticos, placed as separate small meshes (the engine classes them by size)
  const colS = geosOf((Q) => doric(Q, M, POR.H)), colN = geosOf((Q) => doric(Q, M, POR.H - 0.5));
  let tris = 0;
  for (const u of POR.cols) {
    let p = W(u, PS.back + Z_COL); tris += put(root, colS, p.x, PS.floor, p.z, TH, 1, 'yek-col');
    p = W(-u, PN.back - Z_COL); tris += put(root, colN, p.x, PN.floor, p.z, TH + Math.PI, 1, 'yek-col');
  }
  // ---- vases in the five north niches and the six niches along the north wall
  const ped = vasePedestal(M);
  const spots = [];
  for (const u of [-6.7, -3.7, 0, 3.7, 6.7]) spots.push({ u, w: PN.back - 0.5 + 0.3, y: PN.floor + 0.55 });
  for (const c of [12.5, 18.5, 24.5]) for (const sg of [-1, 1]) spots.push({ u: sg * c, w: D.wN - 0.6 + 0.3, y: D.plinth });
  for (const sp of spots) { const p = W(sp.u, sp.w); tris += put(root, ped, p.x, sp.y, p.z, TH + Math.PI, 0.82, 'yek-vase'); }
  K.shared.vaseSpots = spots;
  K.extraTris += tris;
}
