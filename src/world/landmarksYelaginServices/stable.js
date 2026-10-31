// landmarksYelaginServices/stable.js - the STABLE BLOCK (Конюшенный корпус, 4 литД, Rossi 1818-22): the two pedimented pavilions with the grey rusticated ground floors, pilaster pairs, Greek-key frieze and half-round
// attic windows; the DORIC COLONNADE GATE between them (20 fluted columns with plain lower thirds, coffered soffit, spear-topped iron fence panels, two open gate leaves on the axis, granite ledge and cobbled floor);
// the two wings with their long walls (pilaster strips, blind recesses, half-moon windows); the front court faces; the cross wall with the vaulted arch passage; the one-storey apse ring round the ROUND COURT
// (tall white windows, plinth course); roofs and chimneys; the cobbled courts.  The colonnade faces SOUTH to the Oil Meadow, the apse is at the NORTH end (dossier KNOWN ERRORS 11, CRITIC).
// Frame ST (frame.js): x east-ish, z south-ish, y up; everything is drawn inside Parts.push(ST).  Photos stb_01 stb_03 stb_05 stb_06 stb_07 stb_08 stb_09 stb_11 stb_12 stb_14 stb_15.
import * as THREE from 'three';
import { ST, STB as S, toWorld, toLocal } from './frame.js';
import { stage, WD, onSide, rect, arch, openings, panel, keyBand, gable, chimney, slabRoof } from './wall.js';
import { pilaster, cornice as stepCornice } from './facade.js';
import { doric, entablatureD, pediment, cornice as dentilCornice } from './orders.js';
import { ringEdges, onEdge } from './kit.js';
import { geosOf, put } from './objs.js';
import * as L from '../layout.js';
import { holedWall } from './facade.js';

const mirrorRect = (r) => ({ x0: -r.x1, x1: -r.x0, z0: r.z0, z1: r.z1 });
const GROUND = 4.45;                                       // top of the ground floor of the pavilions / wings (string course)

// ------------------------------------------------------------------------------------------------ pavilions
function pavilionFront(K, r) {
  const P = K.P, M = K.M, h2 = (r.x1 - r.x0) / 2;
  onSide(K, r, 'F', () => {
    const low = [-3.5, 0, 3.5].map((x) => ({ ...rect(x, 0.9, 1.3, 2.5, 'winWhite', 0.14), cornice: true }));
    const up = [rect(-3.5, 5.4, 1.2, 1.9, 'winWhite', 0.1), rect(3.5, 5.4, 1.2, 1.9, 'winWhite', 0.1), { ...arch(0, 5.35, 2.5, 1.25, 'fan'), sw: 0.3 }];
    panel(K, M.rust, -h2, h2, 0, GROUND, low);
    panel(K, M.white, -h2, h2, GROUND, S.hCornice - 0.5, up);
    for (const x of [-5.3, -1.77, 1.77, 5.3]) pilaster(P, M.white, x, 0, GROUND, { w: 0.8, proud: 0.12, capH: 0.38, base: 0.0 });
    P.box(M.white, -h2 - 0.1, h2 + 0.1, GROUND, GROUND + 0.16, 0, 0.16, 'k', 3);                 // the string course
    keyBand(P, M, -h2 + 0.0, h2 - 0.0, GROUND + 0.16, GROUND + 0.66, 0.05);                      // the Greek key frieze
    stepCornice(P, M.white, -h2 - 0.58, h2 + 0.58, S.hCornice - 0.5, S.hCornice, { p1: 0.2, p2: 0.38, p3: 0.58 });
    pediment(P, M, -h2 - 0.3, h2 + 0.3, S.hCornice, S.hApex - S.hCornice, 0.62, -0.02);
    // a downpipe at each corner
    for (const x of [-h2 + 0.25, h2 - 0.25]) P.cyl(M.shade, [x, 0.1, 0.16], [x, S.hCornice - 0.5, 0.16], 0.055, 0.055, 6, false);
  });
}
function pavilionSide(K, r, name) {          // the outer long side (R for the east pavilion, L for the west one)
  const P = K.P, M = K.M;
  onSide(K, r, name, (len) => {
    const a = -len / 2 + WD, b = len / 2 - WD * 0, xs = [-2.8, 2.6];
    // the far end (south) meets the front panel: trimmed; the north end meets the wing / the strip: untrimmed
    const sgn = name === 'R' ? 1 : 1;
    const low = xs.map((x) => ({ ...rect(x * sgn, 0.9, 1.3, 2.5, 'winWhite', 0.14), cornice: true }));
    const up = xs.map((x) => rect(x * sgn, 5.4, 1.2, 1.9, 'winWhite', 0.1));
    panel(K, M.rust, a, b, 0, GROUND, low);
    panel(K, M.white, a, b, GROUND, S.hCornice - 0.5, up);
    P.box(M.white, a, b, GROUND, GROUND + 0.16, 0, 0.16, 'k', 3);
    keyBand(P, M, a, b, GROUND + 0.16, GROUND + 0.66, 0.05);
    stepCornice(P, M.white, a, b, S.hCornice - 0.5, S.hCornice, { p1: 0.2, p2: 0.38, p3: 0.58 });
    for (const x of [-len / 2 + 0.6, len / 2 - 0.6]) pilaster(P, M.white, x, 0, GROUND, { w: 0.7, proud: 0.12, capH: 0.38, base: 0.0 });
  });
}
function strip(K, r, name, a, b, mat2 = true) {   // a plain two-storey strip of a face (a..b in face coords), no openings
  const M = K.M;
  onSide(K, r, name, () => {
    panel(K, M.rust, a, b, 0, GROUND, []); panel(K, M.white, a, b, GROUND, S.hCornice - 0.5, []);
    K.P.box(M.white, a, b, GROUND, GROUND + 0.16, 0, 0.16, 'k', 3); K.P.box(M.white, a, b, S.hCornice - 0.5, S.hCornice, 0, 0.58, 'k', 3);
  });
  void mat2;
}
function pavilion(K, s) {
  const r = s > 0 ? { ...S.pav } : mirrorRect(S.pav), P = K.P, M = K.M;
  pavilionFront(K, r);
  pavilionSide(K, r, s > 0 ? 'R' : 'L');
  // the inner face (towards the colonnade and the court): a plain panel
  onSide(K, r, s > 0 ? 'L' : 'R', (len) => {
    panel(K, M.rust, -len / 2 + WD, len / 2, 0, GROUND, []); panel(K, M.white, -len / 2 + WD, len / 2, GROUND, S.hCornice - 0.5, []);
    P.box(M.white, -len / 2 + WD, len / 2, GROUND, GROUND + 0.16, 0, 0.16, 'k', 3);
  });
  // the north strip (x between the wing's outer face and the pavilion's outer face)
  const wx = s > 0 ? S.wing.x1 : -S.wing.x1, ox = s > 0 ? r.x1 : r.x0, xc = (r.x0 + r.x1) / 2;
  const a = -(ox - xc) * 1, b = -(wx - xc) * 1;           // B-face local x = -(x - xc)
  strip(K, r, 'B', Math.min(a, b), Math.max(a, b));
  // roof: gable ridge along z over the pavilion; the front gable end is the pediment
  gable(P, M, r.x0, r.x1, S.hCornice, S.hApex - S.hCornice, r.z0, r.z1 - 0.12, { end1: false, ov: 0.3 });
  chimney(P, M, xc, 2.4, S.hApex - 0.6, S.hApex + 1.5); chimney(P, M, xc, 5.6, S.hApex - 1.0, S.hApex + 1.2);
}

// ------------------------------------------------------------------------------------------------ colonnade
const COLX = [-9.5, -7.6, -5.7, -3.8, -1.9, 1.9, 3.8, 5.7, 7.6, 9.5];
const ZF = 7.3, ZB = 0.9, ZM = 4.1, FLOORY = 0.45;
const LEDGES = [[0.2, 1.8], [6.4, 8.0]];                       // the granite ledges under the back and the front row of columns (z, ST frame)
export const COLONNADE = { xs: COLX, zf: ZF, zb: ZB, zm: ZM, floorY: FLOORY, ledges: LEDGES };

function colonnade(K) {
  const P = K.P, M = K.M, root = K.root, c = S.colo;
  const col = geosOf((Q) => doric(Q, M.white, S.colH));
  let tris = 0;
  const cols = [];
  for (const x of COLX) { cols.push([x, ZF], [x, ZB]); }
  for (const [x, z] of cols) { const w = toWorld(ST, x, z); tris += put(root, col, w.x, 0, w.z, ST.rot, 1, 'yes-col'); }
  K.extraTris += tris; K.shared.cols = cols;
  // two raised ledges (granite, 0.45 m) under the two rows of columns (stb_01 / stb_02: the cobbled aisle between the rows runs along the colonnade to the doors in the pavilions' inner faces)
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 1.9 + 0.46 : -c.x1, x1 = s > 0 ? c.x1 : -(1.9 + 0.46);
    for (const [z0, z1] of LEDGES) {
      P.box(M.ashlar, x0, x1, 0, FLOORY, z0, z1, 'b', 1.8);
      P.cap(M.setts, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], FLOORY + 0.01, true, 1.5);
    }
  }
  // the cobbled floor of the aisle (between the ledges) and of the central passage
  P.cap(M.setts, [[-c.x1, LEDGES[0][1]], [c.x1, LEDGES[0][1]], [c.x1, LEDGES[1][0]], [-c.x1, LEDGES[1][0]]], 0.06, true, 1.5);
  P.cap(M.setts, [[-1.9 - 0.46, 0], [1.9 + 0.46, 0], [1.9 + 0.46, 8.2], [-1.9 - 0.46, 8.2]], 0.06, true, 1.5);
  // the wooden doors at both ends of the aisle (the inner faces of the pavilions), a stone hood, two black wall lanterns and three granite steps
  for (const s of [-1, 1]) {
    const xw = s * c.x1, xo = xw - s * 0.05;
    P.quad(M.door, [xo, FLOORY, ZM + 0.85], [xo, FLOORY, ZM - 0.85], [xo, FLOORY + 2.75, ZM - 0.85], [xo, FLOORY + 2.75, ZM + 0.85], [-s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    for (const z of [ZM - 1.0, ZM + 0.92]) P.box(M.white, xo - s * 0.1, xo + s * 0.02, FLOORY, FLOORY + 2.95, z, z + 0.08, 'k', 3);
    P.box(M.white, xo - s * 0.12, xo + s * 0.02, FLOORY + 2.85, FLOORY + 3.0, ZM - 1.1, ZM + 1.1, 'k', 3);
    P.box(M.white, xo - s * 0.34, xo - s * 0.02, FLOORY + 3.0, FLOORY + 3.2, ZM - 1.25, ZM + 1.25, 'k', 3);
    for (const z of [ZM - 1.55, ZM + 1.55]) { P.box(M.dark, xo - s * 0.28, xo - s * 0.02, 2.15, 2.6, z - 0.1, z + 0.1, '', 1); K.svc.lamps.push({ ...toWorld(ST, xw - s * 0.2, z), h: 2.4, wall: true }); }
    for (let i = 0; i < 3; i++) {                                                        // steps: 0.06 -> 0.45 in three treads
      const w0 = xw - s * (0.4 * i + 0.8), y1 = 0.06 + 0.13 * (3 - i);
      P.box(M.ashlar, Math.min(w0, xw), Math.max(w0, xw), 0.06, y1, ZM - 1.35, ZM + 1.35, 'b', 1.8);
    }
  }
  // entablatures: front run (south) and back run (north), plus the two side runs along the passage columns
  P.push(0, 0, ZF, 0);
  entablatureD(P, M, c.x0, c.x1, S.colH, 0, -0.9, { closed: false });
  P.pop();
  P.push(0, 0, ZB, Math.PI);
  entablatureD(P, M, -c.x1, -c.x0, S.colH, 0, -0.9, { closed: false });
  P.pop();
  // the flat roof deck + the coffered soffit (beams over every column pair, plain ceiling between)
  const yS = S.colH + 0.5;
  P.quad(M.shade, [c.x0, yS, ZB - 0.3], [c.x1, yS, ZB - 0.3], [c.x1, yS, ZF + 0.3], [c.x0, yS, ZF + 0.3], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (const x of COLX) P.box(M.white, x - 0.25, x + 0.25, S.colH, yS, ZB, ZF, 't', 1);
  P.quad(M.zinc, [c.x0 - 0.1, S.hColo, ZB - 0.9], [c.x1 + 0.1, S.hColo, ZB - 0.9], [c.x1 + 0.1, S.hColo, ZF + 0.62 + 0.5], [c.x0 - 0.1, S.hColo, ZF + 0.62 + 0.5], [0, 1, 0], [[0, 0], [10, 0], [10, 5], [0, 5]]);
  // the closed side walls of the colonnade block are the pavilions' inner faces.  fence panels between the front columns, gate leaves on the axis
  const fenceGeo = (w) => geosOf((Q) => { Q.quad(M.iron, [-w / 2, 0.12, 0], [w / 2, 0.12, 0], [w / 2, 2.35, 0], [-w / 2, 2.35, 0], [0, 0, 1], [[0, 0], [w / 2, 0], [w / 2, 1], [0, 1]]); });
  const fence = fenceGeo(0.98), fenceEnd = fenceGeo(0.64), leaf = fenceGeo(1.4);
  let t2 = 0;
  for (let i = 0; i + 1 < COLX.length; i++) {
    if (COLX[i] < 0 && COLX[i + 1] > 0) continue;                           // the central opening
    const w = toWorld(ST, (COLX[i] + COLX[i + 1]) / 2, ZF);
    t2 += put(root, fence, w.x, FLOORY, w.z, ST.rot, 1, 'yes-fence');
  }
  for (const s of [-1, 1]) {
    const we = toWorld(ST, s * (9.5 + 10.6) / 2, ZF); t2 += put(root, fenceEnd, we.x, FLOORY, we.z, ST.rot, 1, 'yes-fence');
    const wl = toWorld(ST, s * 1.3, ZF - 0.75); t2 += put(root, leaf, wl.x, 0.06, wl.z, ST.rot + Math.PI / 2, 1, 'yes-gate');           // the gate leaf swung open along the passage
  }
  K.extraTris += t2;
}

// ------------------------------------------------------------------------------------------------ wings
function wingOuter(K, s) {
  const P = K.P, M = K.M, r = s > 0 ? { ...S.wing } : mirrorRect(S.wing), name = s > 0 ? 'R' : 'L';
  onSide(K, r, name, (len) => {
    // face x runs from the south end (-len/2: z = -0.1) to the north end (+len/2 for R); L runs the other way: bays are symmetric so no matter
    const a = -len / 2, b = len / 2, n = 5, pitch = len / n, cs = Array.from({ length: n }, (_, i) => a + pitch * (i + 0.5));
    const low = cs.map((x) => ({ x0: x - 1.0, x1: x + 1.0, y0: 0.85, y1: 3.65, mat: 'shade', cas: false, depth: 0.14 }));
    const up = cs.map((x) => ({ ...arch(x, 5.15, 2.3, 1.15, 'fan'), sw: 0.26 }));
    panel(K, M.white, a, b, 0, GROUND, low);
    panel(K, M.white, a, b, GROUND, S.hWing - 0.5, up);
    P.box(M.white, a, b, GROUND, GROUND + 0.2, 0, 0.26, 'k', 3);                                   // the entablature of the ground floor
    P.box(M.white, a, b, GROUND + 0.2, GROUND + 0.34, 0, 0.18, 'k', 3);
    for (let i = 0; i <= n; i++) pilaster(P, M.white, a + pitch * i, 0, GROUND, { w: 0.66, proud: 0.14, capH: 0.42, base: 0.0, capW: 0.86 });
    // frames round the recesses
    for (const x of cs) { P.box(M.white, x - 1.1, x + 1.1, 0.78, 0.88, 0, 0.1, 'k', 3); P.box(M.white, x - 1.1, x + 1.1, 3.65, 3.75, 0, 0.1, 'k', 3); }
    // plinth course (granite) 0.6 m
    P.box(M.ashlar, a, b, 0, 0.55, 0, 0.1, 'kb', 1.8);
    stepCornice(P, M.white, a, b, S.hWing - 0.5, S.hWing, { p1: 0.2, p2: 0.38, p3: 0.56 });
    for (const x of [a + 0.3, b - 0.3]) P.cyl(M.shade, [x, 0.55, 0.16], [x, S.hWing - 0.5, 0.16], 0.055, 0.055, 6, false);
  });
}
/** bay centres of a face from a to b with pitch pt; with archAt the middle bay sits exactly on archAt and the others run outwards from it */
function bayCenters(a, b, pt, archAt) {
  if (archAt == null) { const n = Math.max(1, Math.round((b - a) / pt)), p = (b - a) / n; return { cs: Array.from({ length: n }, (_, i) => a + p * (i + 0.5)), pil: Array.from({ length: n + 1 }, (_, i) => a + p * i) }; }
  // the arch (3.4 m + casing) is wider than its bay (pt): the two pilasters at archAt +- pt / 2 would stand INSIDE the opening (thin white slivers across the passage): the casing replaces them
  const cs = [archAt], pil = [];
  for (let k = 1; archAt - k * pt > a + pt * 0.45; k++) { cs.unshift(archAt - k * pt); pil.unshift(archAt - (k + 0.5) * pt); }
  for (let k = 1; archAt + k * pt < b - pt * 0.45; k++) { cs.push(archAt + k * pt); pil.push(archAt + (k + 0.5) * pt); }
  return { cs, pil: [a, ...pil.filter((x) => x > a + 0.3 && x < b - 0.3), b] };
}
/** a court face (stb_08): ground tall wood windows between pilaster strips (apron under each sill), small windows above, string course, dentil cornice; `archAt` = the centre of the arch passage in the face */
function courtFace(K, r, name, a, b, o = {}) {
  const P = K.P, M = K.M, hC = o.hC ?? S.hWing, pitch = o.pitch ?? 3.0;
  const { cs, pil } = bayCenters(a, b, pitch, o.archAt);
  onSide(K, r, name, () => {
    const low = [], up = [];
    for (const x of cs) {
      if (o.archAt != null && Math.abs(x - o.archAt) < 0.01) low.push({ ...arch(x, 0, S.archW, S.archH, 'shade'), nopane: true, sw: 0.3 });
      else low.push(rect(x, 0.95, 1.3, 2.55, 'winBrown', 0.12));
      up.push(rect(x, 5.35, 1.0, 1.45, 'winWhite', 0.1));
    }
    panel(K, M.white, a, b, 0, GROUND, low); panel(K, M.white, a, b, GROUND, hC - 0.5, up);
    for (const x of pil) pilaster(P, M.white, x, 0, GROUND, { w: 0.56, proud: 0.13, capH: 0.36, base: 0.0, capW: 0.76 });
    for (const x of cs) { if (o.archAt != null && Math.abs(x - o.archAt) < 0.01) continue; P.box(M.white, x - 0.66, x + 0.66, 0.02, 0.9, 0.0, 0.1, 'kb', 1); }
    P.box(M.white, a, b, GROUND, GROUND + 0.18, 0, 0.18, 'k', 3);
    stepCornice(P, M.white, a, b, hC - 0.5, hC, { p1: 0.2, p2: 0.38, p3: 0.56 });
  });
}

// ------------------------------------------------------------------------------------------------ cross wall and the arch passage
function crossWall(K) {
  const P = K.P, M = K.M, c = S.cross, hC = S.hCross, ax = 0.3;
  // the court face (south): x -10.6 .. 10.6
  courtFace(K, c, 'F', -10.6 - 0.0, 10.6, { hC, archAt: ax - 0.0 });
  // the round-court face (north): the visible chord x -10.8 .. 12.0
  courtFace(K, c, 'B', -12.0, 10.8, { hC, archAt: -ax });
  // the exposed corner strips of the south face (x 20.7 .. 22.4) and the east / west faces (x = +-22.4)
  for (const s of [-1, 1]) {
    onSide(K, c, 'F', () => {
      const a = s > 0 ? 20.7 : -22.4, b = s > 0 ? 22.4 : -20.7;
      panel(K, M.white, a, b, 0, hC - 0.5, []); P.box(M.white, a, b, hC - 0.5, hC, 0, 0.58, 'k', 3);
    });
    onSide(K, c, s > 0 ? 'R' : 'L', (len) => {
      const cs = [-3.0, 3.0];
      panel(K, M.white, -len / 2 + WD, len / 2 - WD, 0, hC - 0.5, cs.map((x) => rect(x, 1.2, 1.3, 2.4, 'winWhite', 0.12)));
      P.box(M.white, -len / 2 + WD, len / 2 - WD, hC - 0.5, hC, 0, 0.58, 'k', 3);
    });
  }
  // the vaulted passage: two side walls, a barrel vault, cobbles; z from -20.7 to -30.8
  const z0 = c.z0, z1 = c.z1, hw = S.archW / 2, ys = S.archH - hw;
  for (const sg of [-1, 1]) P.quad(M.white, [ax + sg * hw, 0, z1], [ax + sg * hw, 0, z0], [ax + sg * hw, ys, z0], [ax + sg * hw, ys, z1], [-sg, 0, 0], [[0, 0], [10, 0], [10, ys / 3], [0, ys / 3]]);
  const N = 10;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * i / N, a1 = Math.PI * (i + 1) / N, p = (a, z) => [ax + Math.cos(a) * hw, ys + Math.sin(a) * hw, z];
    P.quad(M.white, p(a0, z1), p(a0, z0), p(a1, z0), p(a1, z1), [-Math.cos((a0 + a1) / 2), -Math.sin((a0 + a1) / 2), 0], [[0, 0], [4, 0], [4, 0.5], [0, 0.5]]);
  }
  P.cap(M.setts, [[ax - hw, z0], [ax + hw, z0], [ax + hw, z1], [ax - hw, z1]], 0.06, true, 1.5);
  // roof: gable ridge along x
  gable(P, M, z0, z1, hC, 2.1, -c.x1, c.x1, { alongZ: false, ov: 0.3, ends: true });
  for (const x of [-12, 12]) chimney(P, M, x, -25.75, hC + 1.2, hC + 3.0);
}

// ------------------------------------------------------------------------------------------------ wings: roof, inner faces
function wings(K) {
  const P = K.P, M = K.M;
  for (const s of [-1, 1]) {
    const r = s > 0 ? { ...S.wing } : mirrorRect(S.wing);
    wingOuter(K, s);
    // inner (court) face: L for the east wing, R for the west wing: z -20.7 .. -0.1, trimmed at the south end by the pavilion panel (no overlap needed: the pavilion inner panel starts at z -0.1)
    courtFace(K, r, s > 0 ? 'L' : 'R', -(S.wing.z1 - S.wing.z0) / 2, (S.wing.z1 - S.wing.z0) / 2, { hC: S.hWing });
    gable(P, M, r.x0, r.x1, S.hWing, 1.9, r.z0 - 5.3, r.z1, { alongZ: true, ov: 0.3, ends: true, end0: false });
    for (const z of [-4.5, -10.5, -16.5]) chimney(P, M, (r.x0 + r.x1) / 2, z, S.hWing + 0.9, S.hWing + 2.7);
  }
}

// ------------------------------------------------------------------------------------------------ the apse ring round the round court
let _ringCache = null;
export function apseRing(K) {
  if (_ringCache) return _ringCache;
  const b = L.buildingById('w736544126');
  const o = b.polys[0].o, ring = [];
  for (let i = 0; i < o.length; i += 2) { const q = toLocal(ST, o[i], o[i + 1]); ring.push([q.x, q.z]); }
  return (_ringCache = ring);
}
function apse(K) {
  const P = K.P, M = K.M, ring = apseRing(K), n = ring.length, C = S.round;
  const edges = ringEdges({ o: ring.flat(), h: [] }, 0.3);
  let nWin = 0;
  for (const e of edges) {
    const mid = [(e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2];
    if (Math.abs(e.a[1] - C.zCut) < 0.5 && Math.abs(e.b[1] - C.zCut) < 0.5) continue;                 // the edges on the cross wall face
    const inner = Math.hypot(mid[0] - C.cx, mid[1] - C.cz) < C.R + 0.8 && e.len < 5.5;
    onEdge(P, e, (len) => {
      const holes = [];
      if (inner) {
        if (nWin % 2 === 0 && len > 2.4) holes.push(rect(len / 2, 0.95, 1.3, 2.5, 'winWhite', 0.12));
        else if (nWin === 7) holes.push({ x0: len / 2 - 0.95, x1: len / 2 + 0.95, y0: 0, y1: 2.5, mat: 'door' });
        nWin++;
      } else if (len > 6) { const k = Math.floor(len / 4.5); for (let i = 0; i < k; i++) holes.push(rect((i + 0.5) * len / k, 1.0, 1.3, 2.3, 'winWhite', 0.12)); }
      panel(K, M.white, 0, len, 0, S.hApse - 0.5, holes);
      P.box(M.ashlar, 0, len, 0, 0.7, 0, 0.1, 'kb', 1.8);
      stepCornice(P, M.white, 0, len, S.hApse - 0.5, S.hApse, { p1: 0.16, p2: 0.3, p3: 0.44, dentil: len > 2 });
      if (inner) P.cyl(M.shade, [0.3, 0.7, 0.16], [0.3, S.hApse - 0.5, 0.16], 0.05, 0.05, 6, false);
    });
  }
  // the roof: a hipped slab over the whole ring: the sloping border 2.4 m wide, a flat cap above
  slabRoof(P, M, ring, S.hApse, 2.3, 1.5);
  for (const [x, z] of [[-4, -58], [6, -58], [-9, -52], [12, -56]]) chimney(P, M, x, z, S.hApse + 1.0, S.hApse + 3.0);
}

// ------------------------------------------------------------------------------------------------ courts: cobbles
function courts(K) {
  const P = K.P, M = K.M, C = S.round;
  P.cap(M.setts, [[-10.6, -20.7], [10.6, -20.7], [10.6, 0], [-10.6, 0]], 0.06, true, 1.5);             // the front court
  const disc = []; const zc = C.zCut;
  for (let i = 0; i < 40; i++) { const a = i * Math.PI * 2 / 40, x = C.cx + Math.cos(a) * C.R * 0.995, z = C.cz + Math.sin(a) * C.R * 0.995; disc.push([x, Math.min(z, zc)]); }
  P.cap(M.setts, disc, 0.06, true, 1.5);                                                                 // the round court (clipped at the cross wall)
}

export function build(K) {
  const P = K.P;
  P.push(ST.x, 0, ST.z, ST.rot);
  try {
    stage(K, 'stable/pavilions', () => { pavilion(K, 1); pavilion(K, -1); });
    stage(K, 'stable/colonnade', () => colonnade(K));
    stage(K, 'stable/wings', () => wings(K));
    stage(K, 'stable/cross', () => crossWall(K));
    stage(K, 'stable/apse', () => apse(K));
    stage(K, 'stable/courts', () => courts(K));
  } finally { P.pop(); }
  void THREE; void holedWall; void dentilCornice;
}
