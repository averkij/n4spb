// landmarksSevkabel/hall.js - the Sevkabel main hall 40B (Kozhevennaya line 40 lit. B; OSM r8702908; docs/research/sevkabel.md section 4.1; photos 003 016 017 026 027 028 034 035) and what hangs on it.
//   Frame H (frame.js): lx along the hall (SE), lz towards the river (SW), 157.2 x 50 m, parapet 20.5 / 21.3 m, the ribs poke to 22.1 m.
//   * THE RIVER FACE: 11 stepped buttress ribs (pitch 12.05 m, 2.4 m wide at the foot, 1.6 m deep) with ten bays of 9.65 m: a rust-framed steel window wall (1.0 .. 8.8 m, 6 x 7 panes of 1.6 x 1.1 m), a painted spandrel
//     (8.8 .. 10.8), a segmental-arched upper window (10.8 .. 16.8; milky glass in the two bays at each end), plain concrete above; two plain end bays; a larch bench in every one of the 12 bays.
//   * THE GABLES: NW (sea square): teal mural wall | a 27 m concrete frame (three piers, two bays: glazed ground floor, milky arched windows) | peach mural wall; SE (pier plaza): pink mural | a 24 m frame with a glazed
//     ground floor and two milky arched windows | yellow mural.
//   * THE ALLEY FACE (NE): a precast panel wall with six ribbon-window rows over a brick plinth, a silicate-brick stair tower.
//   * The GANTRY GALLERY (a concrete box at 10.5 .. 16.5 m, 4.7 m cantilever over the quay with a wood-clad cabin with a round porthole and a corrugated cabin), its slim piers, the yellow open stair tower and the X-braced mast;
//     the ALLEY BRIDGE (white box on slim piers between the hall and 40A).
//   * Three public fair doors cut both the visible facade and its collider (access.js).
//     Other walls, ribs, gallery piers, stair tower, mast and bridge piers stay solid.
import * as THREE from 'three';
import * as L from '../layout.js';
import { H, HALL, quayLz } from './frame.js';
import { HALL_DOORS } from './access.js';

const HP = HALL.parapet, HR = HALL.roof, LX0 = HALL.lx0, LX1 = HALL.lx1;
const RIBS = Array.from({ length: HALL.ribN }, (_, j) => HALL.ribX0 + HALL.pitch * j);
const RIB_W = 2.4, BAY_W = HALL.pitch - RIB_W;        // 9.65 m

/** the four faces of the hall: u runs left -> right as seen from OUTSIDE; pt(u, depth) = local [lx, lz] (depth along the outward normal) */
export const FACE = {
  R: { len: 157.2, n: [0, 1], pt: (u, d = 0) => [LX0 + u, 25 + d] },
  A: { len: 157.2, n: [0, -1], pt: (u, d = 0) => [LX1 - u, -25 - d] },
  NW: { len: 50, n: [-1, 0], pt: (u, d = 0) => [LX0 - d, -25 + u] },
  SE: { len: 50, n: [1, 0], pt: (u, d = 0) => [LX1 + d, 25 - u] },
};
/** u of a local lx on the river face / alley face */
const uR = (lx) => lx - LX0;

/** segmental arch points from (ua, ySpring) to (ub, ySpring) with the given rise */
function archPts(ua, ub, ySpring, rise, n) {
  const c = ub - ua, R = (c * c / 4 + rise * rise) / (2 * rise), cx = (ua + ub) / 2, cy = ySpring + rise - R, pts = [];
  for (let i = 0; i <= n; i++) { const x = ua + c * i / n; pts.push([x, cy + Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)))]); }
  return { pts, R, cx, cy };
}

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSevkabel] hall/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  P.push(H.x, 0, H.z, H.rot);
  try {
    stage('river', () => riverFace(K));
    stage('alley', () => alleyFace(K));
    stage('gables', () => gables(K));
    stage('roof', () => roofTop(K));
    stage('gallery', () => gallery(K));
    stage('bridge', () => alleyBridge(K));
  } finally { P.pop(); }
  stage('colliders', () => colliders(K));
  const c = H.W(0, 0);
  svc.monuments.push({ id: 'r8702908', name: 'Севкабель Порт: главный корпус', x: c.x, z: c.z, h: HP });
  void L; void ph; void THREE; void M;
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ face helpers (local frame H is pushed)
/** a vertical quad on a face between u0..u1 and y0..y1 at depth d; uv from the callers (tu, tv in metres per uv unit; v0 = the y that has v = 0; uOff metres added to u) */
function fq(P, face, mat, u0, u1, y0, y1, d, tu, tv, v0 = 0, uOff = 0) {
  if (u1 - u0 < 1e-3 || y1 - y0 < 1e-3) return;
  const a = face.pt(u0, d), b = face.pt(u1, d), n = [face.n[0], 0, face.n[1]];
  P.quad(mat, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], n,
    [[(u0 + uOff) / tu, (y0 - v0) / tv], [(u1 + uOff) / tu, (y0 - v0) / tv], [(u1 + uOff) / tu, (y1 - v0) / tv], [(u0 + uOff) / tu, (y1 - v0) / tv]]);
}
/** a quad in a plane perpendicular to the face (a reveal): from (u0, y0, d0) to (u1, y1, d1) with the wanted normal in (u, y, depth) components */
function rq(P, face, mat, A, B, C, D, nuv) {
  const w = (p) => { const q = face.pt(p[0], p[2]); return [q[0], p[1], q[1]]; };
  const tang = [face.pt(1, 0)[0] - face.pt(0, 0)[0], 0, face.pt(1, 0)[1] - face.pt(0, 0)[1]];
  const n = [tang[0] * nuv[0] + face.n[0] * nuv[2], nuv[1], tang[2] * nuv[0] + face.n[1] * nuv[2]];
  P.quad(mat, w(A), w(B), w(C), w(D), n, [[0, 0], [1, 0], [1, 1], [0, 1]]);
}

/**
 * an arched window opening in a face: glass recessed by `rec`, reveals (jambs, sill, arc) and the wall panel ABOVE the arch up to yTop.
 * ua..ub, glass from yb to the springing line, arc of `rise` above it; wall material `wall` (tile 3.6), glass material `glass` with pane cell cw x ch.
 */
function archWindow(P, face, o) {
  const { ua, ub, yb, ys, rise, yTop, rec, glass, wall, cw, ch } = o, N = o.n || 12;
  const { pts, R, cx, cy } = archPts(ua, ub, ys, rise, N);
  const g = (x, y) => { const q = face.pt(x, -rec); return [q[0], y, q[1]]; };
  const nn = [face.n[0], 0, face.n[1]];
  // glass: rectangle + circular segment (a fan from the springing corner)
  P.quad(glass, g(ua, yb), g(ub, yb), g(ub, ys), g(ua, ys), nn, [[0, 0], [(ub - ua) / cw, 0], [(ub - ua) / cw, (ys - yb) / ch], [0, (ys - yb) / ch]]);
  for (let i = 0; i + 1 < pts.length; i++) {
    const A = pts[i], B = pts[i + 1];
    P.quad(glass, g(A[0], ys), g(B[0], ys), g(B[0], B[1]), g(A[0], A[1]), nn, [[(A[0] - ua) / cw, 0], [(B[0] - ua) / cw, 0], [(B[0] - ua) / cw, (B[1] - ys) / ch], [(A[0] - ua) / cw, (A[1] - ys) / ch]]);
  }
  // reveals: jambs, sill, arch
  rq(P, face, wall, [ua, yb, 0], [ua, yb, -rec], [ua, ys, -rec], [ua, ys, 0], [1, 0, 0]);
  rq(P, face, wall, [ub, yb, -rec], [ub, yb, 0], [ub, ys, 0], [ub, ys, -rec], [-1, 0, 0]);
  rq(P, face, wall, [ua, yb, 0], [ub, yb, 0], [ub, yb, -rec], [ua, yb, -rec], [0, 1, 0]);
  for (let i = 0; i + 1 < pts.length; i++) {
    const A = pts[i], B = pts[i + 1], ma = [(A[0] + B[0]) / 2 - cx, (A[1] + B[1]) / 2 - cy];
    const l = Math.hypot(ma[0], ma[1]) || 1;
    rq(P, face, wall, [A[0], A[1], 0], [A[0], A[1], -rec], [B[0], B[1], -rec], [B[0], B[1], 0], [-ma[0] / l, -ma[1] / l, 0]);
  }
  // the wall above the arch (strips between the arc and yTop)
  for (let i = 0; i + 1 < pts.length; i++) {
    const A = pts[i], B = pts[i + 1], a = face.pt(A[0], 0), b = face.pt(B[0], 0);
    P.quad(wall, [a[0], A[1], a[1]], [b[0], B[1], b[1]], [b[0], yTop, b[1]], [a[0], yTop, a[1]], nn, [[(A[0] + (o.uOff || 0)) / 3.6, A[1] / 3.6], [(B[0] + (o.uOff || 0)) / 3.6, B[1] / 3.6], [(B[0] + (o.uOff || 0)) / 3.6, yTop / 3.6], [(A[0] + (o.uOff || 0)) / 3.6, yTop / 3.6]]);
  }
}
/** a rectangular window opening: glass recessed by rec + the four reveals */
function rectWindow(P, face, o) {
  const { ua, ub, y0, y1, rec, glass, wall, cw, ch } = o;
  const g = (x, y) => { const q = face.pt(x, -rec); return [q[0], y, q[1]]; };
  const nn = [face.n[0], 0, face.n[1]];
  const pane = (a, b, lo, hi) => P.quad(glass, g(a, lo), g(b, lo), g(b, hi), g(a, hi), nn,
    [[(a - ua) / cw, (lo - y0) / ch], [(b - ua) / cw, (lo - y0) / ch], [(b - ua) / cw, (hi - y0) / ch], [(a - ua) / cw, (hi - y0) / ch]]);
  const door = o.door;
  if (door) {
    pane(ua, door.u0, y0, door.h); pane(door.u1, ub, y0, door.h); pane(ua, ub, door.h, y1);
    for (const u of [door.u0, door.u1]) rq(P, face, wall, [u, 0, .06], [u, 0, -.5], [u, door.h, -.5], [u, door.h, .06], [u === door.u0 ? 1 : -1, 0, 0]);
    rq(P, face, wall, [door.u0, door.h, -.5], [door.u1, door.h, -.5], [door.u1, door.h, .06], [door.u0, door.h, .06], [0, -1, 0]);
  } else pane(ua, ub, y0, y1);
  rq(P, face, wall, [ua, y0, 0], [ua, y0, -rec], [ua, y1, -rec], [ua, y1, 0], [1, 0, 0]);
  rq(P, face, wall, [ub, y0, -rec], [ub, y0, 0], [ub, y1, 0], [ub, y1, -rec], [-1, 0, 0]);
  rq(P, face, wall, [ua, y1, -rec], [ub, y1, -rec], [ub, y1, 0], [ua, y1, 0], [0, -1, 0]);
  if (y0 > 0.2) rq(P, face, wall, [ua, y0, 0], [ub, y0, 0], [ub, y0, -rec], [ua, y0, -rec], [0, 1, 0]);
}
/** a box in local frame H with the concrete texture on every face (uv in metres / tile) */
function cbox(P, mat, x0, x1, y0, y1, z0, z1, skip = '', tile = 3.6) { P.box(mat, x0, x1, y0, y1, z0, z1, skip, tile); }

// ------------------------------------------------------------------------------------------------ the river face
function riverFace(K) {
  const { P, M } = K, F = FACE.R;
  const plain = (u0, u1) => {
    fq(P, F, M.concDark, u0, u1, 0, 1.0, 0, 3.6, 3.6);
    fq(P, F, M.conc, u0, u1, 1.0, HR, 0, 3.6, 3.6);
    fq(P, F, M.concPaint, u0, u1, HR, HP, 0, 3.6, 3.6);
  };
  // end bays: NW from the corner to the first rib, SE from the last rib to the corner (the gallery stands on the SE one)
  const first = RIBS[0] - RIB_W / 2, last = RIBS[RIBS.length - 1] + RIB_W / 2;
  plain(0, uR(first)); plain(uR(last), F.len);
  // the ten glazed bays
  for (let j = 0; j + 1 < RIBS.length; j++) {
    const ua = uR(RIBS[j] + RIB_W / 2), ub = uR(RIBS[j + 1] - RIB_W / 2);
    fq(P, F, M.concDark, ua, ub, 0, 1.0, 0, 3.6, 3.6);
    rectWindow(P, F, { ua, ub, y0: 1.0, y1: 8.8, rec: 0.4, glass: M.rustWin, wall: M.concDark, cw: BAY_W / 6, ch: 7.8 / 7 });
    fq(P, F, M.concPaint, ua, ub, 8.8, 10.8, 0, 3.6, 3.6);
    const milky = j < 2 || j > 7;
    archWindow(P, F, { ua, ub, yb: 10.8, ys: 15.6, rise: 1.2, yTop: HP, rec: 0.35, glass: milky ? M.milkyWin : M.rustWin, wall: M.conc, cw: BAY_W / 6, ch: 4.8 / 4, n: 10 });
  }
  // the ribs: a wide stepped foot (2.4 m x 0.8 m, to the parapet) and a narrower front (1.4 m x 0.8 m) that rises to the 22.1 m finger with a sloping top
  for (const lx of RIBS) {
    cbox(P, M.conc, lx - 1.2, lx + 1.2, 0, 21.0, 25.0, 25.8, 'bk');
    // the front core (1.4 m wide, 0.8 m deeper) with the finger: sloping crown from 21.6 m at the front edge to 22.1 m at the wall
    const w = 0.7;
    P.quad(M.conc, [lx - w, 0, 26.6], [lx + w, 0, 26.6], [lx + w, 21.6, 26.6], [lx - w, 21.6, 26.6], [0, 0, 1], [[0, 0], [1.4 / 3.6, 0], [1.4 / 3.6, 21.6 / 3.6], [0, 21.6 / 3.6]]);
    P.quad(M.conc, [lx - w, 0, 25.8], [lx - w, 0, 26.6], [lx - w, 21.6, 26.6], [lx - w, 22.1, 25.8], [-1, 0, 0], [[0, 0], [0.8 / 3.6, 0], [0.8 / 3.6, 21.6 / 3.6], [0, 22.1 / 3.6]]);
    P.quad(M.conc, [lx + w, 0, 26.6], [lx + w, 0, 25.8], [lx + w, 22.1, 25.8], [lx + w, 21.6, 26.6], [1, 0, 0], [[0, 0], [0.8 / 3.6, 0], [0.8 / 3.6, 22.1 / 3.6], [0, 21.6 / 3.6]]);
    P.quad(M.conc, [lx - w, 21.6, 26.6], [lx + w, 21.6, 26.6], [lx + w, 22.1, 25.8], [lx - w, 22.1, 25.8], [0, 1, 0.6], [[0, 0], [0.4, 0], [0.4, 0.2], [0, 0.2]]);
    // the finger above the parapet: a narrow block against the wall carrying the top
    cbox(P, M.conc, lx - 0.9, lx + 0.9, HP, 22.1, 25.0, 25.8, 'bk');
  }
  // twelve larch benches, one in every bay (9 m long, 0.45 m high, 0.5 m deep with a sloping back)
  const bayC = [(LX0 + RIBS[0] - RIB_W / 2) / 2];
  for (let j = 0; j + 1 < RIBS.length; j++) bayC.push((RIBS[j] + RIBS[j + 1]) / 2);
  bayC.push((RIBS[RIBS.length - 1] + RIB_W / 2 + LX1) / 2);
  for (const c of bayC) {
    const half = Math.min(4.5, 6.6), x0 = c - half, x1 = c + half;
    P.box(M.slats, x0, x1, 0.15, 0.45, 25.05, 25.6, 'b', 1);
    P.quad(M.slats, [x0, 0.45, 25.05], [x1, 0.45, 25.05], [x1, 1.05, 25.0], [x0, 1.05, 25.0], [0, 0.5, 1], [[0, 0], [9, 0], [9, 0.6], [0, 0.6]]);
  }
  K.svc.benchesHall = bayC.length;
  for (const c of bayC) K.svc.benches.push({ x: H.W(c, 25.4).x, z: H.W(c, 25.4).z, rotY: H.rot + Math.PI, len: 9 });
}

// ------------------------------------------------------------------------------------------------ the alley face (NE)
function alleyFace(K) {
  const { P, M } = K, F = FACE.A;
  const d = HALL_DOORS.find(d => d.face === 'A');
  for (const [a, b] of [[0, d.u0], [d.u1, F.len]]) {
    fq(P, F, M.brickPlinth, a, b, 0, 3.0, 0, 2.0, 2.0);
    fq(P, F, M.ribbon, a, b, 3.0, d.h, 0, 3.0, 3.1, 3.0);
  }
  fq(P, F, M.ribbon, 0, F.len, d.h, HR, 0, 3.0, 3.1, 3.0);
  fq(P, F, M.concPaint, 0, F.len, HR, HP, 0, 3.6, 3.6);
  // the silicate-brick stair tower (3.2 x 3.2 m, 3 m taller than the hall) at lx -30
  cbox(P, M.silicate, -31.6, -28.4, 0, 23.6, -28.2, -25.0, 'bft', 2.0);
  P.quad(M.roofMem, [-31.6, 23.6, -25], [-28.4, 23.6, -25], [-28.4, 23.6, -28.2], [-31.6, 23.6, -28.2], [0, 1, 0]);
}

// ------------------------------------------------------------------------------------------------ the gables
function gableFrame(K, F, o) {
  const { P, M } = K;
  // piers (projecting 0.6 m, to the 22.1 m finger), bays: glazed ground floor, spandrel, milky arched window, concrete above
  const piers = o.piers;   // [[u0, u1]..]
  for (const [a, b] of piers) {
    fq(P, F, M.conc, a, b, 0, HP, 0.6, 3.6, 3.6);
    const pa = F.pt(a, 0), pb = F.pt(b, 0);
    // the pier sides and top
    const tx = F.pt(1, 0)[0] - F.pt(0, 0)[0], tz = F.pt(1, 0)[1] - F.pt(0, 0)[1];
    P.quad(M.conc, [pa[0], 0, pa[1]], [F.pt(a, 0.6)[0], 0, F.pt(a, 0.6)[1]], [F.pt(a, 0.6)[0], HP, F.pt(a, 0.6)[1]], [pa[0], HP, pa[1]], [-tx, 0, -tz], [[0, 0], [0.6 / 3.6, 0], [0.6 / 3.6, HP / 3.6], [0, HP / 3.6]]);
    P.quad(M.conc, [F.pt(b, 0.6)[0], 0, F.pt(b, 0.6)[1]], [pb[0], 0, pb[1]], [pb[0], HP, pb[1]], [F.pt(b, 0.6)[0], HP, F.pt(b, 0.6)[1]], [tx, 0, tz], [[0, 0], [0.6 / 3.6, 0], [0.6 / 3.6, HP / 3.6], [0, HP / 3.6]]);
    P.quad(M.conc, [F.pt(a, 0.6)[0], HP, F.pt(a, 0.6)[1]], [F.pt(b, 0.6)[0], HP, F.pt(b, 0.6)[1]], [pb[0], HP, pb[1]], [pa[0], HP, pa[1]], [0, 1, 0]);
    // the finger above the parapet (1.6 m narrower than the pier)
    const qa = F.pt(a + 0.3, 0.6), qb = F.pt(b - 0.3, 0.6);
    P.quad(M.conc, [qa[0], HP, qa[1]], [qb[0], HP, qb[1]], [qb[0], 22.1, qb[1]], [qa[0], 22.1, qa[1]], [F.n[0], 0, F.n[1]], [[0, 0], [0.4, 0], [0.4, 0.2], [0, 0.2]]);
    P.quad(M.conc, [qa[0], 22.1, qa[1]], [qb[0], 22.1, qb[1]], [F.pt(b - 0.3, 0)[0], 22.1, F.pt(b - 0.3, 0)[1]], [F.pt(a + 0.3, 0)[0], 22.1, F.pt(a + 0.3, 0)[1]], [0, 1, 0]);
  }
  for (let i = 0; i + 1 < piers.length; i++) {
    const ua = piers[i][1], ub = piers[i + 1][0];
    const door = HALL_DOORS.find(d => FACE[d.face] === F && d.u0 >= ua && d.u1 <= ub);
    rectWindow(P, F, { ua, ub, y0: 0.0, y1: 8.8, rec: 0.35, glass: M.darkWin, wall: M.concDark, cw: (ub - ua) / 6, ch: 1.1, door });
    fq(P, F, M.concPaint, ua, ub, 8.8, 9.4, 0, 3.6, 3.6);
    archWindow(P, F, { ua, ub, yb: 9.4, ys: 14.3, rise: 1.4, yTop: HP, rec: 0.3, glass: M.milkyWin, wall: M.conc, cw: (ub - ua) / 6, ch: 4.9 / 4, n: 12 });
  }
}
function gables(K) {
  const { P, M } = K, NW = FACE.NW, SE = FACE.SE;
  // ---- NW gable: teal 0..8 | frame 8..35 | peach 35..49.5 | concrete 49.5..50
  fq(P, NW, M.muralTeal, 0, 8, 0, HP, 0, 8, HP);
  gableFrame(K, NW, { piers: [[8, 10.4], [20.3, 22.7], [32.6, 35.0]] });
  fq(P, NW, M.muralPeach, 35, 49.5, 0, HP, 0, 14.5, HP, 0, -35);
  fq(P, NW, M.conc, 49.5, 50, 0, HP, 0, 3.6, 3.6);
  // ---- SE gable: pink 0..17 | frame 17..41 | yellow 41..50
  fq(P, SE, M.muralPink, 0, 17, 0, HP, 0, 17, HP);
  gableFrame(K, SE, { piers: [[17, 18.6], [28.2, 29.8], [39.4, 41.0]] });
  fq(P, SE, M.muralYellow, 41, 50, 0, HP, 0, 9, HP, 0, -41);
}

// ------------------------------------------------------------------------------------------------ the roof
function roofTop(K) {
  const { P, M } = K;
  P.cap(M.roofMem, [[LX0, -25], [LX1, -25], [LX1, 25], [LX0, 25]], HR, true, 3);
  // parapet 0.35 m thick: inner faces, top
  const t = 0.35;
  const ring = [[LX0, -25], [LX1, -25], [LX1, 25], [LX0, 25]];
  for (let i = 0; i < 4; i++) {
    const a = ring[i], b = ring[(i + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l;   // outward normal (ring is clockwise in x/z)
    const ia = [a[0] - nx * t, a[1] - nz * t], ib = [b[0] - nx * t, b[1] - nz * t];
    P.quad(M.concPaint, [ia[0], HR, ia[1]], [ib[0], HR, ib[1]], [ib[0], HP, ib[1]], [ia[0], HP, ia[1]], [-nx, 0, -nz]);
    P.quad(M.concPaint, [a[0], HP, a[1]], [b[0], HP, b[1]], [ib[0], HP, ib[1]], [ia[0], HP, ia[1]], [0, 1, 0]);
  }
  // roof plant: hatches, air-handling boxes, vents (about 25 small objects, photo 034 / satellite)
  const r = K.ctx.rng(8301);
  for (let i = 0; i < 24; i++) {
    const x = LX0 + 6 + r() * (LX1 - LX0 - 12), z = -19 + r() * 38, w = 1.2 + r() * 2.2, d = 1.2 + r() * 1.8, h = 0.7 + r() * 1.3;
    P.box(M.steelGrey, x - w / 2, x + w / 2, HR, HR + h, z - d / 2, z + d / 2, 'b', 1);
  }
}

// ------------------------------------------------------------------------------------------------ the gantry gallery with the yellow stair tower
function gallery(K) {
  const { P, M } = K;
  const X0 = 67.9, X1 = 73.9, Z0 = 25.0, Z1 = 55.7, Y0 = 10.5, Y1 = 16.5;
  // the concrete box deck
  cbox(P, M.concDark, X0, X1, Y0, Y1, Z0, Z1, 'k', 3.6);
  // the cabins at the cantilever tip: wood-clad (porthole d 1.1 on the end face) and corrugated steel
  const cz0 = Z1 - 4.4, cy0 = Y1, cy1 = Y1 + 3.2;
  P.box(M.woodCabin, X0 + 0.2, X0 + 3.2, cy0, cy1, cz0, Z1 - 0.2, 'b', 2);
  P.box(M.corrugated, X0 + 3.2, X1 - 0.2, cy0, cy1, cz0, Z1 - 0.2, 'b', 2);
  P.box(M.roofMem, X0 + 0.1, X1 - 0.1, cy1, cy1 + 0.12, cz0 - 0.1, Z1 - 0.1, 'b', 2);
  {
    const cx = X0 + 1.7, cy = cy0 + 1.7, zf = Z1 - 0.2 + 0.02, rr = 0.55;
    const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, zf]); }
    P.fan(M.portHole, pts, [0, 0, 1]);
    const pts2 = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pts2.push([cx + Math.cos(a) * (rr + 0.1), cy + Math.sin(a) * (rr + 0.1), zf - 0.01]); }
    P.fan(M.steelGrey, pts2, [0, 0, 1]);
  }
  // steel handrail round the deck top (posts every 3 m, a top rail and a mid rail)
  const rail = (a, b) => { for (const y of [Y1 + 0.55, Y1 + 1.1]) P.cyl(M.steelGrey, [a[0], y, a[1]], [b[0], y, b[1]], 0.03, 0.03, 4, false); };
  const post = (x, z) => P.cyl(M.steelGrey, [x, Y1, z], [x, Y1 + 1.1, z], 0.035, 0.035, 4, false);
  for (let z = Z0 + 1.5; z < cz0 - 0.5; z += 3) { post(X0 + 0.15, z); post(X1 - 0.15, z); }
  rail([X0 + 0.15, Z0 + 1.5], [X0 + 0.15, cz0]); rail([X1 - 0.15, Z0 + 1.5], [X1 - 0.15, cz0]);
  // four slim piers (0.8 x 2.0 m) in two pairs and the stair tower between the pairs
  for (const z of [34.0, 50.2]) for (const x of [X0 + 0.5, X1 - 0.5]) cbox(P, M.conc, x - 0.4, x + 0.4, 0, Y0, z - 1.0, z + 1.0, 'b', 3.6);
  // the yellow open stair tower (OSM w1089553936: lx 68.1..73.8, lz 43.0..47.6): 4 posts, 7 flights zig-zagging up to 10.5 m, rails
  {
    const sx0 = 68.5, sx1 = 73.4, sz0 = 43.2, sz1 = 47.4, ys = Y0 + 0.4, zc = (sz0 + sz1) / 2;
    for (const x of [sx0, sx1]) for (const z of [sz0, sz1]) P.col(M.yellowSteel, x, z, 0, ys, 0.12, 0.12, 6, false);
    const n = 7, rise = ys / n, sw = 1.3, run = sx1 - sx0 - 1.2;
    for (let k = 0; k < n; k++) {
      const y0 = k * rise, y1 = (k + 1) * rise, east = k % 2 === 0;
      const xa = east ? sx0 + 0.6 : sx1 - 0.6, xb = east ? sx1 - 0.6 : sx0 + 0.6;
      // two stringers, eight open treads, a landing at the head, a handrail on each side
      for (const dz of [-sw / 2, sw / 2]) { P.cyl(M.yellowSteel, [xa, y0, zc + dz], [xb, y1, zc + dz], 0.07, 0.07, 4, false); P.cyl(M.yellowSteel, [xa, y0 + 0.95, zc + dz], [xb, y1 + 0.95, zc + dz], 0.025, 0.025, 4, false); }
      for (let i = 0; i < 8; i++) { const t = (i + 0.5) / 8, x = xa + (xb - xa) * t, y = y0 + (y1 - y0) * t; P.box(M.yellowSteel, x - 0.14, x + 0.14, y - 0.04, y, zc - sw / 2, zc + sw / 2, 'b', 1); }
      P.box(M.yellowSteel, east ? xb : sx0, east ? sx1 : xb, y1 - 0.06, y1, sz0, sz1, 'b', 1);
      void run;
    }
    P.col(M.yellowSteel, (sx0 + sx1) / 2, zc, 0, ys, 0.08, 0.08, 6, false);
  }
  // the X-braced steel mast under the gallery root (photo 017)
  {
    const mx0 = 75.0, mx1 = 77.0, mz = 27.4;
    for (const x of [mx0, mx1]) P.cyl(M.steelGrey, [x, 0, mz], [x, Y0 + 0.2, mz], 0.14, 0.14, 6, false);
    for (let k = 0; k < 5; k++) { const y0 = k * 2.1, y1 = (k + 1) * 2.1; strut(P, M.steelGrey, [mx0, y0, mz], [mx1, y1, mz]); strut(P, M.steelGrey, [mx1, y0, mz], [mx0, y1, mz]); P.cyl(M.steelGrey, [mx0, y1, mz], [mx1, y1, mz], 0.06, 0.06, 4, false); }
    P.box(M.steelGrey, mx0 - 0.3, mx1 + 0.3, Y0 + 0.2, Y0 + 0.5, mz - 0.3, mz + 0.3, 'b', 1);
  }
}
const strut = (P, mat, a, b) => P.cyl(mat, a, b, 0.05, 0.05, 4, false);

// ------------------------------------------------------------------------------------------------ the alley bridge (OSM w1239372698: a trapezoid in frame H)
function alleyBridge(K) {
  const { P, M } = K;
  const ring = [[62.4, -49.6], [59.2, -25.0], [54.3, -24.9], [56.9, -49.6]];   // lx, lz (measured from the baked polygon)
  const Y0 = 6.5, Y1 = 11.0;
  for (let i = 0; i < 4; i++) {
    const a = ring[i], b = ring[(i + 1) % 4], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l;
    const sgn = ((a[0] + b[0]) / 2 - 58.4) * nx + ((a[1] + b[1]) / 2 + 37) * nz > 0 ? 1 : -1;
    const n = [nx * sgn, 0, nz * sgn];
    const long = l > 10;
    P.quad(long ? M.ribbon : M.whiteBox, [a[0], Y0, a[1]], [b[0], Y0, b[1]], [b[0], Y1, b[1]], [a[0], Y1, a[1]], n, long ? [[0, 0], [l / 3.0, 0], [l / 3.0, 4.5 / 3.1], [0, 4.5 / 3.1]] : [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  P.cap(M.roofMem, ring, Y1, true, 3);
  P.cap(M.whiteBox, ring, Y0, false, 3);
  for (const [x, z] of [[55.4, -27.5], [58.2, -27.5], [57.8, -46.5], [61.2, -46.5]]) P.box(M.whiteBox, x - 0.3, x + 0.3, 0, Y0, z - 0.3, z + 0.3, 'b', 1);
  K.bridgeRing = ring;
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders(K) {
  const ph = K.ctx.physics;
  for (const [name, face] of Object.entries(FACE)) {
    const d = HALL_DOORS.find(d => d.face === name);
    for (const [a, b] of d ? [[0, d.u0], [d.u1, face.len]] : [[0, face.len]]) H.wall(ph, face.pt(a), face.pt(b), 0, 22.5, .8);
    if (d) H.wall(ph, face.pt(d.u0), face.pt(d.u1), d.h, 22.5, .8);
  }
  for (const lx of RIBS) H.box(ph, lx, 25.8, 2.4, 1.6, 0, 22.1);                                                    // the ribs
  for (const z of [34.0, 50.2]) for (const x of [68.4, 73.4]) H.box(ph, x, z, 0.8, 2.0, 0, 10.5);                    // the gallery piers
  H.box(ph, 70.95, 45.3, 5.6, 4.6, 0, 11.5);                                                                          // the stair tower
  H.box(ph, 76.0, 27.4, 2.6, 0.5, 0, 10.7);                                                                           // the mast
  for (const [x, z] of [[55.4, -27.5], [58.2, -27.5], [57.8, -46.5], [61.2, -46.5]]) H.box(ph, x, z, 0.7, 0.7, 0, 6.5);   // the bridge piers
  H.box(ph, -30, -26.6, 3.2, 3.2, 0, 23.6);                                                                           // the stair tower on the alley face
  void quayLz;
}
