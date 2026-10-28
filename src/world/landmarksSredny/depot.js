// landmarksSredny/depot.js - the VASILEOSTROVSKY TRAM DEPOT (Sredny pr. 77 / 79; Westinghouse 1906-09, the first electric tram of the city left shed No. 1 on 29 Sept 1907) and its MUSEUM.  Dossier docs/research/sredny.md
// section 3 (critic C3 - C6: the end facade follows the 1906-08 project elevation «Вагонный сарай. Фасадъ», photos 59 61 73 n03 n04 n06 n17 n19 n20), frame D (origin (-5110, -760), rot 29.6 deg, a ENE, b SSE).
//   THE THREE SHEDS (A r1839485 = the museum shed nearest Sredny, B w136518061, V w90798030), each 110 x 40-45 m, bare red brick: the two END facades (gates 1-24, eight per end) are generated from one layout:
//   corner assembly 3.3 m (two stepped pylons 1.4 / 1.0 m + a dark infill, double square heads top 9.2 m, sheet-metal hats, black granite plinth 0.9 m), gates 1-3, a tall pylon (top 12.5 m, caps 13.5 m), gates 4-5 under
//   the arched steel window (7.0 m wide, sill 7.0, crown 10.3, 9 x 5 panes), a tall pylon, gates 6-8, corner assembly; gates 3.35 m wide (crown 5.6, archivolt 6.5) with blue-grey timber leaves (V brace, glazed slits)
//   and white enamel number plates 0.6 x 0.45 m; pale-yellow plaster panels under the sloping coping (8.2 m at the corners rising to 9.6 m at the tall pylons), the central parapet 12.65 m with two pinnacles.
//   Bay 1 of the EAST end of shed A is the museum entrance (a door under a forged canopy, a bench, two plaques, two small windows).  The LONG walls: buttress pilasters every 6.1 m, two rows of two-light steel
//   windows, a cream cornice band at 7.8 m.  The ROOF is the symmetric basilica section (a central nave 11 m wide with clerestories to 12.0 m / ridge 12.4 m, two lean-to naves 8.2 -> 9.6 m).
//   THE ADMIN BLOCKS 79A (r1839483, east, pediment with a lunette over 5 bays, blind west end, marble plaque) and 79B (r1839484, west, rotated 31 deg, full-height oriel at the west end, two canopied entrances,
//   heritage plaque): ochre stucco `#cf9f66`, four storeys, eaves 16.3 m, rusticated ground floor, flat pilasters on floors 2-3, rhombus panels, hipped grey roofs; the pink walled gap with an iron gate between them;
//   THE GATEHOUSE r2149589 (one-storey brick pass office).  Exteriors only: closed territory, solid thin-wall colliders.  Rails, wires and the yard ground belong to `streets`.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FR, ringOf } from './frame.js';
import { ringEdges, onEdge, polyOf, frameOf } from './kit.js';
import { wallFace, rectC, segC, rectOutline, band, cornice, roofHip, roofFrustum, panel, onBack, onFront, onEast, onWest } from './wall.js';
import { frameRing, tbox, shapeOf } from './geo.js';
import { addPolyColliders } from '../lib/massing.js';

const D = FR.D;
export const SHEDS = [
  { id: 'r1839485', key: 'A', east: [1, 2, 3, 4, 5, 6, 7, 8], fb: { a0: -71.9, a1: 39.0, b0: 27.2, b1: 72.2 } },
  { id: 'w136518061', key: 'B', east: [9, 10, 11, 12, 13, 14, 15, 16], fb: { a0: -71.6, a1: 38.7, b0: -18.7, b1: 22.1 } },
  { id: 'w90798030', key: 'V', east: [17, 18, 19, 20, 21, 22, 23, 24], fb: { a0: -71.5, a1: 38.3, b0: -66.6, b1: -26.2 } },
];
/** the rectangle of a shed in frame D, measured from the baked ring (falls back to the dossier numbers) */
export function shedRect(sh) {
  const ring = ringOf(sh.id); if (!ring) return sh.fb;
  let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  for (const p of ring) { const q = D.M(p[0], p[1]); a0 = Math.min(a0, q.a); a1 = Math.max(a1, q.a); b0 = Math.min(b0, q.b); b1 = Math.max(b1, q.b); }
  const f = sh.fb;
  return Math.abs(a1 - a0 - (f.a1 - f.a0)) < 4 && Math.abs(b1 - b0 - (f.b1 - f.b0)) < 4 ? { a0, a1, b0, b1 } : f;
}

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSredny] depot/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  K.S.sheds = SHEDS.map((s) => ({ ...s, r: shedRect(s) }));
  D.enter(P);
  try {
    for (const sh of K.S.sheds) stage('shed ' + sh.key, () => shed(K, sh));
  } finally { D.leave(P); }
  stage('admin79a', () => admin(K, 'r1839483', 'A'));
  stage('admin79b', () => admin(K, 'r1839484', 'B'));
  stage('gatehouse', () => gatehouse(K));
  stage('colliders', () => colliders(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ one shed
function shed(K, sh) {
  const { P, M } = K, r = sh.r, Wd = r.b1 - r.b0, nums = sh.east;
  // east end (outward +a): the left end seen from outside is the south end (b1); gates numbered left to right as in the photos
  onEast(P, r.a1, r.b1, () => shedEnd(K, Wd, { nums, museum: sh.key === 'A' }));
  // west end (outward -a): the left end is b0; numbers run the other way
  onWest(P, r.a0, r.b0, () => shedEnd(K, Wd, { nums: nums.slice().reverse(), museum: false }));
  // long walls: south (+b) faces onBack with the left end at a0; north (-b) faces onFront with the left end at a1
  const len = r.a1 - r.a0;
  onBack(P, r.a0, r.b1, () => sideWall(K, len));
  onFront(P, r.a1, r.b0, () => sideWall(K, len));
  roof(K, r, Wd);
}

// ------------------------------------------------------------------------------------------------ the layout of an end facade (x from the left, as seen from outside)
export function endLayout(Wd) {
  const gw = (Wd - 6.6 - 2.2 - 4.5) / 8, gates = [], pyl = [], tall = [];
  let x = 3.3;
  for (let i = 0; i < 8; i++) {
    gates.push(x + gw / 2); x += gw;
    if (i === 2 || i === 4) { tall.push([x, 1.1]); x += 1.1; } else if (i < 7) { pyl.push([x, 0.9]); x += 0.9; }
  }
  return { gw, gates, pyl, tall, xT1s: tall[0][0], xT2e: tall[1][0] + 1.1 };
}
const cop = (L_, Wd, x) => (x <= L_.xT1s ? 8.2 + 1.4 * Math.max(0, x - 3.3) / (L_.xT1s - 3.3) : x >= L_.xT2e ? 8.2 + 1.4 * Math.max(0, Wd - 3.3 - x) / (Wd - 3.3 - L_.xT2e) : 12.65);

/** a band polygon around a segmental arch: outer width wo / crown yo, inner width wi / crown yi, springing at y0 (legs go down to y0) */
function archBand(cx, y0, wi, yi, ri, wo, yo, ro) {
  const o = segC(cx, y0, wo, yo - y0, ro, 6), i = segC(cx, y0, wi, yi - y0, ri, 6);
  // contour layout: [bl, br, brUp, arc (right -> left)..., blUp]
  const oArc = o.slice(3, o.length - 1), iArc = i.slice(3, i.length - 1);
  const outer = [o[0], o[o.length - 1], ...oArc.slice().reverse(), o[2], o[1]];
  const inner = [i[1], i[2], ...iArc, i[i.length - 1], i[0]];
  return outer.concat(inner);
}

function plateUv(n) { const c = (n - 1) % 6, rw = Math.floor((n - 1) / 6); return [[c / 6, 1 - (rw + 1) / 4], [(c + 1) / 6, 1 - (rw + 1) / 4], [(c + 1) / 6, 1 - rw / 4], [c / 6, 1 - rw / 4]]; }

function shedEnd(K, Wd, o) {
  const { P, M } = K, Ly = endLayout(Wd), gw = Ly.gw, nums = o.nums;
  const outline = [[0, -0.3], [Wd, -0.3], [Wd, 8.2], [Ly.xT2e, 9.6], [Ly.xT2e, 12.65], [Ly.xT1s, 12.65], [Ly.xT1s, 9.6], [3.3, 8.2], [0, 8.2]];
  const holes = [];
  Ly.gates.forEach((cx, i) => {
    if (o.museum && i === 0) {
      const x0 = cx - gw / 2;
      holes.push({ c: rectC(x0 + 1.0, 3.0, 1.2, 1.4), glass: M.sideWin, reveal: M.brickDark, depth: 0.2 }, { c: rectC(x0 + 2.4, 3.0, 1.2, 1.4), glass: M.sideWin, reveal: M.brickDark, depth: 0.2 },
        { c: rectC(x0 + 3.0, 0, 0.9, 2.1), glass: M.gate, reveal: M.brickDark, depth: 0.2 });
    } else holes.push({ c: segC(cx, 0, gw, 5.6, 0.6, 6), glass: M.gate, reveal: M.brickDark, depth: 0.28 });
  });
  const xw = (Ly.xT1s + Ly.xT2e) / 2;
  holes.push({ c: segC(xw, 7.0, 7.0, 3.3, 1.2, 10), glass: M.winBig, reveal: M.steel, depth: 0.3 });
  wallFace(P, M.brick, outline, holes, { tu: 2, tv: 2 });
  // ---- gate archivolts (brick bands 0.9 m deep above the leaf) and the number plates
  Ly.gates.forEach((cx, i) => {
    if (o.museum && i === 0) { P.quad(M.plates, [cx - 0.3, 6.5, 0.04], [cx + 0.3, 6.5, 0.04], [cx + 0.3, 6.95, 0.04], [cx - 0.3, 6.95, 0.04], [0, 0, 1], plateUv(nums[i])); return; }
    frameRing(P, M.brickHead, archBand(cx, 4.9, gw, 5.6, 0.6, gw + 0.9, 6.5, 0.9), null, 0, 0.1);
    P.quad(M.plates, [cx - 0.3, 6.58, 0.12], [cx + 0.3, 6.58, 0.12], [cx + 0.3, 7.03, 0.12], [cx - 0.3, 7.03, 0.12], [0, 0, 1], plateUv(nums[i]));
  });
  // ---- the pale-yellow plaster panels over the gates of the wings (one per gate; the coping slopes above them)
  Ly.gates.forEach((cx, i) => {
    if (i === 3 || i === 4 || (o.museum && i === 0)) return;
    const y1 = Math.min(8.2, cop(Ly, Wd, cx) - 0.28);
    P.quad(M.panel, [cx - 1.5, 7.25, 0.03], [cx + 1.5, 7.25, 0.03], [cx + 1.5, y1, 0.03], [cx - 1.5, y1, 0.03], [0, 0, 1]);
  });
  // ---- inter-gate pylons (0.9 m, darker brick, 0.15 m proud) with two cream string courses
  for (const [x, w] of Ly.pyl) {
    const mid = Math.abs(x + w / 2 - (Ly.xT1s + Ly.xT2e) / 2) < 0.6;                 // the pylon between gates 4 and 5 stops under the sill of the big window (project elevation n04); it used to run through the glass
    const top = mid ? 6.9 : cop(Ly, Wd, x + w / 2) - 0.05;
    tbox(P, M.brickDark, x, x + w, 0, top, 0, 0.15, 2, 2, 'bk');
    if (mid) P.box(M.stone, x - 0.08, x + w + 0.08, 6.9, 7.05, 0, 0.22, 'bk', 1);
    for (const y of [1.4, 3.3]) P.box(M.stone, x - 0.04, x + w + 0.04, y, y + 0.15, 0, 0.2, 'bk', 1);
  }
  // ---- wall lamps: a white globe on a black cast-iron arm 4.5 m up on every second inter-gate pylon (photo 59)
  Ly.pyl.forEach(([x, w], i) => {
    if (i % 2) return;
    const cx = x + w / 2;
    P.cyl(M.iron, [cx, 4.4, 0.15], [cx, 4.55, 0.55], 0.03, 0.03, 5, false); P.cyl(M.iron, [cx, 4.55, 0.55], [cx, 4.62, 0.68], 0.05, 0.05, 6, true);
    const g = new THREE.SphereGeometry(0.17, 8, 6); P.geo(M.white, g, cx, 4.35, 0.7); g.dispose();
    P.cyl(M.iron, [cx, 4.55, 0.68], [cx, 4.62, 0.68], 0.2, 0.05, 8, true);
  });
  // ---- the two tall pylons: 1.1 m wide, top 12.5 m, a stepped cap to 13.5 m, a sheet hat; the parapet pinnacles
  for (const [x, w] of Ly.tall) {
    tbox(P, M.brickDark, x - 0.05, x + w + 0.05, 0, 12.5, 0, 0.38, 2, 2, 'bk');
    P.box(M.stone, x - 0.2, x + w + 0.2, 12.5, 12.8, -0.0, 0.5, 'bk', 1); P.box(M.brickHead, x - 0.1, x + w + 0.1, 12.8, 13.4, 0.05, 0.42, 'bk', 1); P.box(M.roofMetal, x - 0.15, x + w + 0.15, 13.4, 13.52, 0.0, 0.47, 'b', 1);
    for (const y of [1.4, 3.3]) P.box(M.stone, x - 0.1, x + w + 0.1, y, y + 0.15, 0, 0.45, 'bk', 1);
  }
  for (const dx of [-2.6, 2.6]) P.box(M.brickHead, xw + dx - 0.18, xw + dx + 0.18, 12.65, 13.25, 0.0, 0.3, 'b', 1);
  // ---- the two corner assemblies
  for (const left of [true, false]) {
    const m = (x) => (left ? x : Wd - x), seg = (x0, x1) => (left ? [x0, x1] : [Wd - x1, Wd - x0]);
    const [pa0, pa1] = seg(0, 1.4), [pb0, pb1] = seg(2.3, 3.3), [in0, in1] = seg(1.4, 2.3), [pl0, pl1] = seg(0, 3.3);
    tbox(P, M.blackGranite, pl0, pl1, 0, 0.9, 0, 0.55, 2, 2, 'bk');
    tbox(P, M.brick, pa0, pa1, 0.9, 8.2, 0, 0.45, 2, 2, 'bk'); tbox(P, M.brick, pb0, pb1, 0.9, 8.2, 0, 0.45, 2, 2, 'bk');
    tbox(P, M.brickDark, in0, in1, 0.9, 8.0, 0, 0.25, 2, 2, 'bk');
    for (const [x0, x1] of [[pa0, pa1], [pb0, pb1]]) {
      const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2 - 0.12;
      P.box(M.brickHead, cx - hw - 0.1, cx + hw + 0.1, 7.4, 7.8, 0, 0.55, 'bk', 1);
      P.box(M.brickHead, cx - hw, cx + hw, 7.8, 9.2, 0.03, 0.45, 'bk', 1);
      P.box(M.roofMetal, cx - hw - 0.12, cx + hw + 0.12, 9.2, 9.34, -0.02, 0.5, 'b', 1);
      for (const y of [3.3, 5.2]) P.box(M.stone, x0 - 0.04, x1 + 0.04, y, y + 0.12, 0, 0.5, 'bk', 1);
    }
    void m;
  }
  // ---- the museum entrance of shed A (bay 1 of the east end): a forged canopy over the door, a bench, two plaques
  if (o.museum) {
    const x0 = Ly.gates[0] - gw / 2, dx = x0 + 3.0;
    P.box(M.iron, dx - 0.9, dx + 0.9, 2.3, 2.36, 0, 0.85, 'b', 1);                                            // canopy plate
    P.box(M.iron, dx - 0.9, dx - 0.84, 2.0, 2.3, 0, 0.8, 'b', 1); P.box(M.iron, dx + 0.84, dx + 0.9, 2.0, 2.3, 0, 0.8, 'b', 1);
    P.cyl(M.iron, [dx, 2.3, 0.82], [dx, 2.0, 0.82], 0.015, 0.015, 5, false);
    P.box(M.blackGranite, dx - 0.7, dx + 0.7, 0, 0.12, 0, 0.9, 'b', 1);                                       // the granite step
    panel(P, M.tramBlack, x0 + 1.55, 1.7, 0.4, 0.5, 0.04); panel(P, M.heritage, x0 + 2.05, 1.7, 0.35, 0.45, 0.04);
    // bench: red-brown slats, black cast-iron ends
    const bx = x0 + 1.6, bz = 1.5;
    P.box(M.bench, bx - 0.8, bx + 0.8, 0.42, 0.47, bz - 0.22, bz + 0.22, 'b', 1); P.box(M.bench, bx - 0.8, bx + 0.8, 0.62, 0.9, bz - 0.24, bz - 0.2, 'b', 1);
    for (const s of [-0.75, 0.75]) P.box(M.iron, bx + s - 0.03, bx + s + 0.03, 0, 0.9, bz - 0.24, bz + 0.2, 'b', 1);
  }
}

// ------------------------------------------------------------------------------------------------ a long wall: buttresses every 6.1 m, two rows of two-light steel windows, a cream cornice band at 7.8 m
function sideWall(K, len) {
  const { P, M } = K, bays = Math.round(len / 6.1), pitch = len / bays, ops = [];
  for (let i = 0; i < bays; i++) { const cx = (i + 0.5) * pitch; ops.push({ c: rectC(cx, 1.1, 1.2, 1.8), glass: M.sideWin, reveal: M.brickDark, depth: 0.18 }, { c: rectC(cx, 4.4, 1.2, 1.8), glass: M.sideWin, reveal: M.brickDark, depth: 0.18 }); }
  wallFace(P, M.brick, rectOutline(0, len, -0.3, 7.8), ops, { tu: 2, tv: 2 });
  for (let i = 0; i <= bays; i++) {
    const x = i * pitch, x0 = Math.max(0, x - 0.45), x1 = Math.min(len, x + 0.45);
    tbox(P, M.brickDark, x0, x1, 0, 4.4, 0, 0.4, 2, 2, 'bk'); tbox(P, M.brickDark, x0 + 0.1, x1 - 0.1, 4.4, 7.8, 0, 0.25, 2, 2, 'bk');
  }
  P.box(M.stone, -0.1, len + 0.1, 7.5, 8.2, 0, 0.7, 'bk', 2);
}

// ------------------------------------------------------------------------------------------------ the basilica roof of a shed (frame D: a along x, b along z)
function roof(K, r, Wd) {
  const { P, M } = K, Wl = (Wd - 11) / 2, a0 = r.a0, a1 = r.a1, bm = (r.b0 + r.b1) / 2, len = a1 - a0;
  const sl = (b0, ya, b1, yb, normalZ) => P.quad(M.roofMetal, [a0, ya, b0], [a1, ya, b0], [a1, yb, b1], [a0, yb, b1], [0, 1, normalZ], [[0, 0], [len / 2, 0], [len / 2, Math.hypot(b1 - b0, yb - ya) / 2], [0, Math.hypot(b1 - b0, yb - ya) / 2]]);
  sl(r.b0, 8.2, r.b0 + Wl, 9.6, -1); sl(r.b1, 8.2, r.b1 - Wl, 9.6, 1);                      // the two lean-to naves
  sl(r.b0 + Wl, 12.0, bm, 12.4, -1); sl(r.b1 - Wl, 12.0, bm, 12.4, 1);                     // the central roof (shallow gable)
  for (const [b, n] of [[r.b0 + Wl, -1], [r.b1 - Wl, 1]]) P.quad(M.clerestory, [a0, 9.6, b], [a1, 9.6, b], [a1, 12.0, b], [a0, 12.0, b], [0, 0, n]);   // clerestory glazing
  for (const [b, n] of [[r.b0 + Wl, -1], [r.b1 - Wl, 1]]) for (let a = a0; a <= a1 + 0.01; a += 6.1) P.box(M.steel, a - 0.05, a + 0.05, 9.6, 12.0, b - 0.05, b + 0.05, '', 1);
  void bm; void THREE;
}

// ------------------------------------------------------------------------------------------------ the admin blocks 79A (east, 'A') and 79B (west, 'B'): edges of the baked ring, each a wall of the block
function admin(K, id, which) {
  const { P, M } = K, ring = ringOf(id); if (!ring) throw new Error('no ring ' + id);
  const edges = ringEdges(polyOf(ring)), dB = D.dirB, dA = D.dirA;
  let front = null, depth = 14.5;
  for (const e of edges) {
    const side = e.n[0] * dB[0] + e.n[1] * dB[1] > 0.8 ? 'front' : e.n[0] * dB[0] + e.n[1] * dB[1] < -0.8 ? 'back' : e.n[0] * dA[0] + e.n[1] * dA[1] < 0 ? 'west' : 'east';
    if (side === 'front') front = e; else if (side === 'west') depth = e.len;
    onEdge(P, e, (len) => adminWall(K, len, { side, which }));
  }
  // the hipped roof over the block, in the frame of the front wall
  if (front) {
    const f = frameOf(front);
    P.push(f.x, 0, f.z, f.rot);
    try { roofHip(P, M.roofGrey, -0.45, f.len + 0.45, -depth - 0.45, 0.45, 16.3, 3.3, 2); P.box(M.ventBox, f.len * 0.7, f.len * 0.7 + 1.5, 16.3 + 2.4, 16.3 + 3.1, -depth * 0.5 - 0.5, -depth * 0.5 + 0.5, 'b', 1); } finally { P.pop(); }
  }
  // the gap between the two blocks: a pink plaster wall 2.6 m on the street line with an iron gate, built once (with block 'A')
  if (which === 'A') walledGap(K);
}

/** the wall of an admin block (frame: x along the wall to the right, +z out): 4 storeys, eaves 16.3 m */
function adminWall(K, len, o) {
  const { P, M } = K, street = o.side === 'front', bays = Math.max(1, Math.round(len / 3.0)), pitch = len / bays, FL = [5.1, 8.7, 12.3];
  const blind = o.which === 'A' && o.side === 'west';
  const ground = [], upper = [];
  for (let i = 0; i < bays; i++) {
    const cx = (i + 0.5) * pitch;
    if (blind) continue;
    ground.push({ c: rectC(cx, 1.6, 1.3, 2.4), glass: M.win3, reveal: M.ochre, depth: 0.22 });
    for (const y0 of FL) upper.push({ c: rectC(cx, y0 + 0.9, 1.3, 2.1), glass: M.win3, reveal: M.ochre, depth: 0.2 });
  }
  wallFace(P, M.ochreRust, rectOutline(0, len, 0, 5.1), ground, { tu: 2, tv: 2 });
  wallFace(P, M.ochre, rectOutline(0, len, 5.1, 15.9), upper, { tu: 4, tv: 4 });
  if (o.which === 'B') band(P, M.plinthDark, 0, len, 0, 1.2, 0, 0.12);
  band(P, M.cornice, 0, len, 5.0, 5.25, 0, 0.22);
  cornice(P, M.cornice, M.lepnina, 0, len, 0, 15.1, 0.2, 0.2, 1);
  if (!street) return;
  // flat pilaster strips on floors 2-3, rhombus panels under the windows, window heads
  for (let i = 0; i <= bays; i++) { const x = i * pitch; P.box(M.cornice, Math.max(0, x - 0.35), Math.min(len, x + 0.35), 5.25, 12.3, 0, 0.15, 'bk', 1); }
  for (let i = 0; i < bays; i++) {
    const cx = (i + 0.5) * pitch;
    for (const y0 of [5.1, 8.7]) { const y = y0 + 0.9 - 0.7; P.fan(M.lepnina, [[cx, y, 0.04], [cx + 0.25, y + 0.3, 0.04], [cx, y + 0.6, 0.04], [cx - 0.25, y + 0.3, 0.04]], [0, 0, 1]); }
    P.box(M.cornice, cx - 0.55, cx + 0.55, 5.1 + 0.9 + 2.1, 5.1 + 0.9 + 2.35, 0, 0.18, 'bk', 1);
  }
  if (o.which === 'A') {
    // the pediment over 5 bays (12 .. 27 m): the bays are marked by two wide pilasters (the windows stay open: the review found the first version's 0.3 m solid box hid 15 windows), a flat-topped triangle 1.8 m high with a semicircular lunette and two oculi
    const x0 = 12.0, x1 = 27.0;
    P.box(M.cornice, x0 - 0.35, x0 + 0.3, 5.25, 16.3, 0.0, 0.22, 'bk', 1); P.box(M.cornice, x1 - 0.3, x1 + 0.35, 5.25, 16.3, 0.0, 0.22, 'bk', 1);
    P.box(M.cornice, x0 - 0.1, x1 + 0.1, 15.9, 16.4, 0.0, 0.55, 'bk', 1);
    P.fan(M.ochre, [[x0, 16.4, 0.3], [x1, 16.4, 0.3], [x1 - 1.5, 18.2, 0.3], [x0 + 1.5, 18.2, 0.3]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
    P.fan(M.glassDark, Array.from({ length: 9 }, (_, i) => { const a = Math.PI * i / 8; return [(x0 + x1) / 2 + Math.cos(a) * 0.9, 16.7 + Math.sin(a) * 0.9, 0.34]; }), [0, 0, 1]);
    for (const dx of [-2.6, 2.6]) P.fan(M.glassDark, Array.from({ length: 10 }, (_, i) => { const a = Math.PI * 2 * i / 10; return [(x0 + x1) / 2 + dx + Math.cos(a) * 0.3, 17.4 + Math.sin(a) * 0.3, 0.34]; }), [0, 0, 1]);
    // the marble plaque on the flat pilaster at x = 44.3 m, 2.0 m high
    panel(P, M.plaqueA, 44.3, 2.0, 0.55, 0.38, 0.05);
  } else {
    // 79B: a three-sided full-height oriel at the west end (4.5 m wide, 1.2 m proud), two canopied entrances at x = 10 / 35 m, the heritage plaque near the east end
    const x0 = 0.4, x1 = 4.9, pr = 1.2, ang = 0.9;
    for (const [ax, az, bx, bz] of [[x0, 0, x0 + ang, pr], [x0 + ang, pr, x1 - ang, pr], [x1 - ang, pr, x1, 0]]) {
      const s = Math.hypot(bx - ax, bz - az) || 1;
      const n3 = [-(bz - az) / s, 0, (bx - ax) / s];
      P.quad(M.ochre, [ax, 0.9, az], [bx, 0.9, bz], [bx, 16.0, bz], [ax, 16.0, az], n3, [[0, 0], [Math.hypot(bx - ax, bz - az) / 4, 0], [Math.hypot(bx - ax, bz - az) / 4, 3.8], [0, 3.8]]);
      for (const y0 of [5.1, 8.7, 12.3]) {
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, ux = (bx - ax) / (Math.hypot(bx - ax, bz - az) || 1), uz = (bz - az) / (Math.hypot(bx - ax, bz - az) || 1), hw = Math.min(0.55, Math.hypot(bx - ax, bz - az) / 2 - 0.1);
        const o2 = 0.02, wx = n3[0] * o2, wz = n3[2] * o2;
        P.quad(M.win3, [mx - ux * hw + wx, y0 + 0.9, mz - uz * hw + wz], [mx + ux * hw + wx, y0 + 0.9, mz + uz * hw + wz], [mx + ux * hw + wx, y0 + 3.0, mz + uz * hw + wz], [mx - ux * hw + wx, y0 + 3.0, mz - uz * hw + wz], n3);
      }
    }
    roofHip(P, M.roofGrey, x0 - 0.1, x1 + 0.1, -0.1, pr + 0.2, 16.0, 1.4, 2);
    for (const x of [10.0, 35.0]) {
      P.box(M.iron, x - 1.3, x + 1.3, 3.15, 3.22, 0, 1.3, 'b', 1);                                              // the forged canopy
      for (const s of [-1.25, 1.25]) P.cyl(M.iron, [x + s, 3.15, 1.25], [x + s, 0.0, 1.25], 0.025, 0.025, 5, false);
      P.box(M.steel, x - 0.55, x + 0.55, 0, 2.2, -0.02, 0.06, 'b', 1);                                          // the door
    }
    panel(P, M.plaqueB, len - 4.0, 1.8, 0.6, 0.9, 0.05);
  }
}

/** the 16 m gap between 79B and 79A on the street line: a pink plaster wall with ochre panels and an iron gate (a -29.8 .. -13.8 at b = 134) */
function walledGap(K) {
  const { P, M } = K;
  D.enter(P);
  try {
    const a0 = -29.8, a1 = -13.8, b = 134.2;
    onBack(P, a0, b, () => {
      const len = a1 - a0;
      P.box(M.plasterPink, 0, len, 0, 2.6, -0.2, 0.2, 'b', 2);
      for (const [x, w] of [[1.0, 5.0], [len - 6.0, 5.0]]) P.box(M.surround, x, x + w, 0.7, 2.0, 0.2, 0.24, 'bk', 1);
      P.quad(M.fenceBlack, [len / 2 - 1.8, 0, 0.26], [len / 2 + 1.8, 0, 0.26], [len / 2 + 1.8, 2.5, 0.26], [len / 2 - 1.8, 2.5, 0.26], [0, 0, 1], [[0, 0], [0.88, 0], [0.88, 1.25], [0, 1.25]]);
    });
  } finally { D.leave(P); }
  const gc = D.W(-21.8, 134.2); K.ctx.physics.addBox(gc.x, gc.z, 16.0, 0.4, D.rot, 0, 2.6);
}

// ------------------------------------------------------------------------------------------------ the gatehouse r2149589 (one-storey brick pass office, eaves 4.2 m)
function gatehouse(K) {
  const { P, M } = K, ring = ringOf('r2149589'); if (!ring) return;
  const edges = ringEdges(polyOf(ring)); let k = 0;
  let cx = 0, cz = 0; for (const p of ring) { cx += p[0]; cz += p[1]; } cx /= ring.length; cz /= ring.length;
  for (const e of edges) {
    onEdge(P, e, (len) => {
      const ops = []; if (len > 2.2) ops.push(k === 0 ? { c: rectC(len / 2, 0, 0.95, 2.1), glass: M.steel, reveal: M.brickDark, depth: 0.15 } : { c: rectC(len / 2, 1.1, 1.1, 1.2), glass: M.sideWin, reveal: M.brickDark, depth: 0.15 });
      wallFace(P, M.brick, rectOutline(0, len, -0.3, 3.9), ops, { tu: 2, tv: 2 });
      band(P, M.panel, 0, len, 3.9, 4.25, 0, 0.3);
      k++;
    });
  }
  // flat hipped roof over the bounding rectangle of the ring (in the frame of its first edge)
  const f = frameOf(edges[0]);
  P.push(f.x, 0, f.z, f.rot);
  try { roofHip(P, M.roofMetal, -0.3, f.len + 0.3, -7.0, 0.3, 4.25, 0.9, 2); } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ colliders: the sheds and the admin blocks are solid thin-wall shells
function colliders(K) {
  const ph = K.ctx.physics;
  for (const sh of K.S.sheds) {
    const r = sh.r, c = (a, b) => [a, b];
    D.wall(ph, c(r.a0, r.b0), c(r.a1, r.b0), 0, 14, 0.6); D.wall(ph, c(r.a1, r.b0), c(r.a1, r.b1), 0, 14, 0.6);
    D.wall(ph, c(r.a1, r.b1), c(r.a0, r.b1), 0, 14, 0.6); D.wall(ph, c(r.a0, r.b1), c(r.a0, r.b0), 0, 14, 0.6);
  }
  for (const id of ['r1839483', 'r1839484', 'r2149589']) { const b = L.buildingById(id); if (b && b.polys) for (const poly of b.polys) addPolyColliders(K.ctx, poly, 0, 17, 0.6); }
}
