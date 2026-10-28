// landmarksMakarova/catherine.js - the CHURCH OF ST CATHERINE AT THE TUCHKOV BRIDGE (Kadetskaya liniya 27A; A. Mikhailov 1811-23, bell tower and refectory 1861-63; OSM w74284443 + six parts; docs/research/makarova.md section 5;
// photos c01 c06 c08 c11 c13 c17 crit_n13).  Frame C (frame.js): origin = the centre of the dome circle, u along the long axis (WSW -> ENE), v NNW -> SSE; the tower stands at u -31.7 and the west front faces the street.
// A cross-shaped plan 58.4 x 31.2 m: the central block (25.7 x 20.5, flat roof at 22 m) with two PEDIMENTED ARMS to the north and south (8 giant Corinthian pilasters, two rows of windows, entablature 15.5, apex 20.0), the
// gabled REFECTORY (west, eaves 17.5, ridge 22) and the gabled apse block (east, with the big semicircular window); on the central block a stylobate, a COLONNADED DRUM (24 free Corinthian columns 0.9 m thick, 12 round-headed
// windows in every second bay, a dentil entablature, a smooth attic) and the RIBBED DOME (24 ribs, rise 11.2 m to 44.8) with the gilded ball, the angel and the cross (~51 m); the white BELL TOWER (10.2 m square, four tiers:
// paired pilasters on a red granite plinth with the arched portal and the 9-step stair, the recessed block, belfry I with corner column pairs and arched bell openings, belfry II, the cupola with the gold ball; cross to 57.6 m).
// The YARD: the pedimented transformer chapel (w107454291) and the gatehouse (w107454308) at the fence line, the bell frame (w216655313), the iron fence on white piers with the two gates that flank the tower.
// Everything is drawn in ONE pushed frame with local rings (kit.js ringEdges / onEdge).  Colliders: the building rings (thin walls), the chapel, the gatehouse, the fence with its gates, the 9 tower steps (physics.addStairs).
import * as THREE from 'three';
import * as L from '../layout.js';
import { FC, FALL, ringIn, polyIn, colliders } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { wallHoles, cornice, column, pilaster, lathe, gable, hipRect } from './facade.js';
import { addPolyColliders } from '../lib/massing.js';
import { angelFig } from './figs.js';

const Y_EAVE = 17.5, Y_RIDGE = 22.0, Y_CUBE = 22.0, Y_ARM = 15.5, Y_APEX = 20.0;
const CUBE = { u0: -12.6, u1: 13.1, v0: -10.6, v1: 9.9 };
const TOWER = { cx: -31.7, cz: -0.2, S: 10.2, ySt: 1.8 };
const FENCE = [{ a: [-38.4, -15.1], b: [-37.0, -5.4], gate: 0.70 }, { a: [-37.0, 5.0], b: [-38.4, 15.2], gate: 0.28 }];
const STAIR = { u0: -39.7, u1: -36.8, v0: -3.2, v1: 2.8, n: 9, top: 1.6 };

export function build(K) {
  const { P } = K, errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksMakarova] catherine/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const ring = ringIn(FC, 'w74284443', FALL.church), chapel = ringIn(FC, 'w107454291', FALL.chapel), gate = ringIn(FC, 'w107454308', FALL.gatehouse);
  P.push(FC.x, 0, FC.z, FC.rot);
  try {
    stage('walls', () => walls(K, ring));
    stage('roofs', () => roofs(K));
    stage('drum', () => drum(K));
    stage('tower', () => tower(K));
    stage('stair', () => stair(K));
    stage('chapel', () => chapelBuilding(K, chapel));
    stage('gatehouse', () => gatehouse(K, gate));
    stage('belframe', () => bellFrame(K));
    stage('fence', () => fence(K));
  } finally { P.pop(); }
  stage('colliders', () => colliders_(K, ring, chapel, gate));
  // ---- services
  const c = FC.W(0, 0), t = FC.W(TOWER.cx, TOWER.cz);
  K.svc.monuments.push({ id: 'w74284443', name: 'Церковь Св. Екатерины у Тучкова моста', x: c.x, z: c.z, h: 57.6 });
  K.svc.monuments.push({ id: 'catherine-angel', name: 'Ангел на куполе церкви Св. Екатерины', x: c.x, z: c.z, h: 51.3 });
  K.svc.crowd.push({ x: -3682, z: -1540, r: 2.5, n: 3, kind: 'steps', name: 'Церковь Св. Екатерины' });
  K.svc.photoSpots.push({ x: -3701, z: -1548, yaw: L.yawToward ? L.yawToward(-3701, -1548, t.x, t.z) : -80, name: 'Церковь Св. Екатерины' });
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the walls of the outline (every edge has a wall) + the pedimented arm fronts
function edgeRole(e) {
  const mu = (e.a[0] + e.b[0]) / 2, mv = (e.a[1] + e.b[1]) / 2, n = e.n;
  if (mu < -29) return 'tower';
  if (n[0] < -0.7) return mu < -20 ? 'refWest' : 'armSide';
  if (n[0] > 0.7) return mu > 20 ? 'apseEast' : 'armSide';
  if (Math.abs(mv) > 13) return 'armFront';
  return mu < 0 ? 'refGable' : 'apseGable';
}
const archWin = (x, y0, w = 1.4, h = 2.6) => ({ x, y0, w, h, kind: 'arch' });
const rectWin = (x, y0, w = 1.3, h = 2.6) => ({ x, y0, w, h, kind: 'rect' });

function walls(K, ring) {
  const { P, M } = K, glass = M.glassDark;
  const edges = ringEdges({ o: ring.flat(), h: [] }, 0.3);
  for (const e of edges) {
    const role = edgeRole(e);
    if (role === 'tower') continue;
    onEdge(P, e, (len) => {
      const arm = role === 'armSide' || role === 'armFront', yTop = arm ? Y_ARM : Y_EAVE, ySt = role === 'armFront' ? 1.8 : 1.0;
      const ops = [];
      if (role === 'refWest') ops.push({ ...archWin(len / 2, 5.0, 1.5, 4.6), glass });
      else if (role === 'refGable') for (const k of [0.25, 0.5, 0.75]) ops.push({ ...archWin(len * k, 3.2, 1.4, 3.8), glass }, { ...archWin(len * k, 9.6, 1.3, 2.4), glass });
      else if (role === 'apseGable') for (const k of [0.3, 0.7]) ops.push({ ...archWin(len * k, 3.2, 1.4, 3.8), glass }, { ...archWin(len * k, 9.6, 1.3, 2.4), glass });
      else if (role === 'apseEast') ops.push({ x: len / 2, y0: 4.2, w: 4.0, h: 3.6, kind: 'arch', glass }, { ...rectWin(len * 0.18, 3.0, 1.1, 2.2), glass }, { ...rectWin(len * 0.82, 3.0, 1.1, 2.2), glass });
      else if (role === 'armSide') ops.push({ ...rectWin(len / 2, 3.0, 1.3, 2.4), glass }, { ...archWin(len / 2, 7.4, 1.3, 2.8), glass });
      else if (role === 'armFront') {
        const x0 = (len - 7 * 3.2) / 2 + 3.2 / 2;                                      // seven bays between eight pilasters (pitch 3.2 m)
        for (let k = 0; k < 7; k++) { const x = x0 + 3.2 * k; ops.push({ ...rectWin(x, 3.2, 1.3, 2.6), glass }, { ...archWin(x, 8.2, 1.4, 2.7), glass }); }
      }
      wallHoles(P, { mat: M.stuccoG, x0: 0, x1: len, y0: ySt, y1: yTop, uvs: 4, ops, reveal: M.stuccoG, depth: 0.3 });
      P.box(M.stone, -0.1, len + 0.1, 0, ySt, 0, 0.12, 'bk', 1.6);                      // plinth course
      if (role === 'armFront') armFront(K, len);
      else if (role === 'refGable' || role === 'apseGable') {
        P.fan(M.stuccoG, [[0, Y_EAVE, 0], [len, Y_EAVE, 0], [len / 2, Y_RIDGE, 0]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
        cornice(P, M.whiteS, M.stuccoG, 0, len, 0, Y_EAVE - 1.2, { e0: 0.05, e1: 0.05, proj: 0.8 });
      } else if (role === 'refWest' || role === 'apseEast') cornice(P, M.whiteS, M.stuccoG, 0, len, 0, Y_EAVE - 1.2, { e0: 0.05, e1: 0.05, proj: 0.8 });
      else if (role === 'armSide') cornice(P, M.whiteS, M.stuccoG, 0, len, 0, Y_ARM - 1.2, { e0: 0.05, e1: 0.05, proj: 0.9 });
    });
  }
  // the central block above the lower roofs (west / east above the eaves 17.5, north / south above the arm roofs 15.5)
  const cb = CUBE, cc = [[cb.u0, cb.v0], [cb.u1, cb.v0], [cb.u1, cb.v1], [cb.u0, cb.v1]];
  for (const e of ringEdges({ o: cc.flat(), h: [] }, 0.3)) {
    const north = Math.abs(e.n[1]) > 0.7, y0 = north ? Y_ARM : Y_EAVE;
    onEdge(P, e, (len) => {
      const ops = north ? [] : [{ ...archWin(len * 0.3, 18.4, 1.2, 1.6), glass }, { ...archWin(len * 0.7, 18.4, 1.2, 1.6), glass }];
      wallHoles(P, { mat: M.stuccoG, x0: 0, x1: len, y0, y1: Y_CUBE, uvs: 4, ops, reveal: M.stuccoG, depth: 0.3 });
      cornice(P, M.whiteS, M.stuccoG, 0, len, 0, Y_CUBE - 1.2, { e0: 0.05, e1: 0.05, proj: 0.85 });
    });
  }
}

/** the pedimented front of an arm in its wall frame: eight giant Corinthian pilasters, the entablature, the tympanum and the raking cornices */
function armFront(K, w) {
  const { P, M } = K, x0 = (w - 7 * 3.2) / 2;
  for (let k = 0; k < 8; k++) pilaster(P, M.whiteS, x0 + 3.2 * k, 1.0, 1.8, 14.3, 0.28, { capH: 1.2, baseH: 0.6 });
  cornice(P, M.whiteS, M.stuccoG, -0.3, w + 0.3, 0, 14.3, { e0: 0.1, e1: 0.1, proj: 1.0 });
  P.fan(M.stuccoG, [[-0.3, Y_ARM, 0], [w + 0.3, Y_ARM, 0], [w / 2, Y_APEX, 0]], [0, 0, 1], (p) => [p[0] / 4, p[1] / 4]);
  // raking cornices: a band 0.45 m thick along each slope, projecting 0.35 m (mirrored about the axis of the front)
  for (const m of [1, -1]) {
    const X = (x) => (m > 0 ? x : w - x), xa = -0.3, xb = w / 2, dx = xb - xa, dy = Y_APEX - Y_ARM, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, t = 0.45;
    const sx = (x) => X(x), nxm = m > 0 ? nx : -nx;
    const A = [sx(xa), Y_ARM], B = [sx(xb), Y_APEX], A2 = [sx(xa + nx * t), Y_ARM + ny * t], B2 = [sx(xb + nx * t), Y_APEX + ny * t];
    P.quad(M.whiteS, [A[0], A[1], 0.35], [B[0], B[1], 0.35], [B2[0], B2[1], 0.35], [A2[0], A2[1], 0.35], [0, 0, 1], [[0, 0], [1, 0], [1, 0.2], [0, 0.2]]);
    P.quad(M.whiteS, [A[0], A[1], 0], [B[0], B[1], 0], [B[0], B[1], 0.35], [A[0], A[1], 0.35], [-nxm, -ny, 0]);
    P.quad(M.whiteS, [A2[0], A2[1], 0.35], [B2[0], B2[1], 0.35], [B2[0], B2[1], 0], [A2[0], A2[1], 0], [nxm, ny, 0]);
  }
}

// ------------------------------------------------------------------------------------------------ roofs: arms, refectory and apse block (ridge along v), the flat cube roof, the stylobate
function roofs(K) {
  const { P, M } = K, mats = { roof: M.roofG };
  const ridgeAlongV = (uc, v0, v1, span, yEave, rise) => { P.push(uc, 0, (v0 + v1) / 2, Math.PI / 2); try { gable(P, mats, -(v1 - v0) / 2, (v1 - v0) / 2, -span / 2, span / 2, yEave, rise, { overhang: 0.3, gableEnds: true }); } finally { P.pop(); } };
  ridgeAlongV(-19.65, -10.6, 9.9, 14.1, Y_EAVE, Y_RIDGE - Y_EAVE);                       // refectory
  ridgeAlongV(17.35, -10.7, 9.7, 8.5, Y_EAVE, Y_RIDGE - Y_EAVE);                         // apse block
  ridgeAlongV(0.25, -15.98, -10.6, 25.7, Y_ARM, Y_APEX - Y_ARM);                         // north arm
  ridgeAlongV(0.25, 9.9, 15.19, 25.7, Y_ARM, Y_APEX - Y_ARM);                            // south arm
  P.cap(M.roofG, [[CUBE.u0, CUBE.v0], [CUBE.u1, CUBE.v0], [CUBE.u1, CUBE.v1], [CUBE.u0, CUBE.v1]], Y_CUBE, true, 2.4);
  // the stepped attic ring and the plinth ring that carry the colonnade
  const stepped = (r0, y0, r1, y1, mat) => { lathe(P, mat, [[r0, y0], [r0, y1]], 48, 0, 0, 12, 4); lathe(P, mat, [[r0, y1], [r1, y1]], 48, 0, 0, 8, 4); };
  stepped(10.4, Y_CUBE, 10.0, Y_CUBE + 0.45, M.whiteS);
  stepped(10.0, Y_CUBE + 0.45, 9.6, Y_CUBE + 0.95, M.whiteS);
}

// ------------------------------------------------------------------------------------------------ the colonnaded drum, the entablature, the attic, the ribbed dome, the ball, the angel and the cross
function drum(K) {
  const { P, M } = K, yF = Y_CUBE + 0.95, yE = 29.4, N = 24, rC = 8.85, rW = 8.0;
  lathe(P, M.drumWall, [[rW, yF], [rW, yE]], 48, 0, 0, 12, 6.9, false, yF);               // the drum wall with the painted windows (12: every second bay)
  const mats = { shaft: M.whiteS, cap: M.whiteS };
  for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2; column(P, mats, Math.sin(a) * rC, Math.cos(a) * rC, yF, yE, 0.45, { seg: 12, capH: 0.8, baseH: 0.3 }); }
  const band = (r, y0, y1, mat, uRep = 12) => lathe(P, mat, [[r, y0], [r, y1]], 48, 0, 0, uRep, 4);
  const top = (r0, r1, y, mat) => lathe(P, mat, [[r0, y], [r1, y]], 48, 0, 0, 8, 4);
  band(9.45, yE, yE + 0.5, M.whiteS); top(9.45, 9.55, yE + 0.5, M.whiteS);               // architrave
  band(9.55, yE + 0.5, yE + 0.85, M.stuccoG); top(9.55, 9.9, yE + 0.85, M.whiteS);       // frieze
  band(9.9, yE + 0.85, yE + 1.2, M.whiteS, 48); top(9.9, 9.2, yE + 1.2, M.whiteS);       // the dentil cornice
  band(9.2, yE + 1.2, 33.6, M.stuccoG, 12);                                               // the smooth attic
  const prof = []; for (let i = 0; i <= 16; i++) { const t = i / 16 * Math.PI / 2; prof.push([Math.max(0.001, 9.2 * Math.cos(t)), 33.6 + 11.2 * Math.sin(t)]); }
  lathe(P, M.domeRib, prof, 48, 0, 0, 24, 8, false, 33.6);                                // the dome: 24 ribs
  lathe(P, M.whiteS, [[9.3, 33.6], [9.3, 33.9]], 48, 0, 0, 12, 4); lathe(P, M.whiteS, [[9.3, 33.9], [9.0, 33.9]], 48, 0, 0, 12, 4);
  // gilded ball, the angel (a robed column with edge-on wings and the cross in its hand) and the cross
  const g = new THREE.SphereGeometry(0.8, 14, 10); P.geo(M.gold, g, 0, 45.6, 0); g.dispose();
  try {                                                                                      // the angel of I. P. Prokofiev (a 2017 copy): 3.5 m on the ball, facing the street (west), the cross in its left hand (tip ~51.3 m)
    angelFig().place(P, { main: M.whiteS, dark: M.whiteS, accent: M.gold }, 0, 46.4, 0, -Math.PI / 2, 2.0);
  } catch (e) { console.warn('[landmarksMakarova] angel failed:', e && e.message); P.box(M.gold, -0.04, 0.04, 46.4, 51.3, -0.04, 0.04, '', 1); }
}

// ------------------------------------------------------------------------------------------------ the bell tower
function tower(K) {
  const { P, M } = K, T = TOWER, h = T.S / 2, faces = [0, Math.PI / 2, Math.PI, -Math.PI / 2];     // south, east, north, west: the face frame's +z points out
  P.push(T.cx, 0, T.cz, 0);
  try {
    P.box(M.plinthRed, -h - 0.12, h + 0.12, 0, T.ySt, -h - 0.12, h + 0.12, 'b', 1.6);
    P.box(M.stone, -h - 0.2, h + 0.2, T.ySt, T.ySt + 0.1, -h - 0.2, h + 0.2, 'b', 1.6);
    for (const [i, ph] of faces.entries()) {
      P.push(0, 0, 0, ph);
      try { tier0(K, h, i === 3, i); tier1(K); belfry1(K, i); belfry2(K, i); cupolaFace(K); } finally { P.pop(); }
    }
    // a roof deck on the ground tier, the dome cupola, lantern, ball, cross
    P.cap(M.towerOrder, [[-h - 0.5, -h - 0.5], [h + 0.5, -h - 0.5], [h + 0.5, h + 0.5], [-h - 0.5, h + 0.5]], 20.03, true, 2);
    P.cap(M.towerOrder, [[-4.9, -4.9], [4.9, -4.9], [4.9, 4.9], [-4.9, 4.9]], 38.22, true, 2);
    P.cap(M.towerOrder, [[-4.1, -4.1], [4.1, -4.1], [4.1, 4.1], [-4.1, 4.1]], 47.83, true, 2);
    const dp = []; for (let i = 0; i <= 8; i++) { const t = i / 8 * Math.PI / 2; dp.push([Math.max(0.001, 2.9 * Math.cos(t)), 49.5 + 3.4 * Math.sin(t)]); }
    lathe(P, M.towerOrder, [[3.0, 47.8], [3.0, 49.5]], 16, 0, 0, 4, 4); lathe(P, M.towerOrder, dp, 16, 0, 0, 4, 4, false, 49.5);
    lathe(P, M.towerOrder, [[0.65, 52.9], [0.65, 54.2]], 12, 0, 0, 2, 2); lathe(P, M.towerOrder, [[0.65, 54.2], [0.3, 54.5]], 12, 0, 0, 2, 2);
    const g = new THREE.SphereGeometry(0.48, 10, 8); P.geo(M.gold, g, 0, 55.0, 0); g.dispose();
    P.box(M.gold, -0.06, 0.06, 55.4, 57.6, -0.06, 0.06, '', 1); P.box(M.gold, -0.5, 0.5, 56.55, 56.67, -0.06, 0.06, '', 1); P.box(M.gold, -0.04, 0.04, 56.4, 56.5, -0.4, 0.4, '', 1);
  } finally { P.pop(); }
}

/** ground tier face (z = h out): the wall to 18.8 with two round-headed recesses, pilaster pairs at the corners, the main cornice to 20; on the west face the portal with the door and the visor */
function tier0(K, h, west, fi) {
  const { P, M } = K;
  P.push(0, 0, h, 0);
  try {
    const ops = west
      ? [{ x: -2.5, y0: 1.95, w: 2.2, h: 3.0, kind: 'arch', glass: M.wood, sill: false }, { x: 1.5, y0: 3.4, w: 2.2, h: 5.2, kind: 'arch', glass: M.glassDark }]
      : [{ x: -2.3, y0: 3.4, w: 2.2, h: 5.2, kind: 'arch', glass: M.glassDark }, { x: 1.7, y0: 3.4, w: 2.2, h: 5.2, kind: 'arch', glass: M.glassDark }];
    wallHoles(P, { mat: M.towerWall, x0: -h, x1: h, y0: 1.8, y1: 18.8, uvs: 4, ops, reveal: M.towerWall, depth: 0.35 });
    for (const sx of [-1, 1]) for (const o of [0.45, 1.55]) pilaster(P, M.towerOrder, sx * (h - o), 0.8, 1.8, 18.6, 0.3, { capH: 1.0, baseH: 0.5 });
    cornice(P, M.towerOrder, M.towerWall, -h, h, 0, 18.8 + fi * 0.004, { e0: 0.72, e1: 0.72, proj: 0.8 });
    for (const op of ops) { const r = op.w / 2 + 0.3, yc = op.y0 + op.h; for (let i = 0; i < 9; i++) { const a0 = Math.PI * i / 9, a1 = Math.PI * (i + 1) / 9; P.quad(M.towerOrder, [op.x + Math.cos(a0) * (r - 0.3), yc + Math.sin(a0) * (r - 0.3), 0.02], [op.x + Math.cos(a0) * r, yc + Math.sin(a0) * r, 0.02], [op.x + Math.cos(a1) * r, yc + Math.sin(a1) * r, 0.02], [op.x + Math.cos(a1) * (r - 0.3), yc + Math.sin(a1) * (r - 0.3), 0.02], [0, 0, 1]); } }
    if (west) {                                                                         // the brown metal visor on brackets over the door
      P.quad(M.visor, [-3.8, 3.7, 0.05], [-1.2, 3.7, 0.05], [-1.2, 3.25, 1.1], [-3.8, 3.25, 1.1], [0, 1, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(M.visor, [-3.8, 3.25, 1.1], [-1.2, 3.25, 1.1], [-1.2, 3.17, 1.1], [-3.8, 3.17, 1.1], [0, 0, 1]);
      P.quad(M.visor, [-3.8, 3.7, 0.05], [-1.2, 3.7, 0.05], [-1.2, 3.25, 1.1], [-3.8, 3.25, 1.1], [0, -1, -0.5]);
      for (const x of [-3.7, -1.3]) { P.box(M.iron, x - 0.015, x + 0.015, 3.2, 3.7, 0.06, 0.1, 'b', 1); P.box(M.iron, x - 0.015, x + 0.015, 3.2, 3.24, 0.1, 1.05, 'b', 1); }
    }
  } finally { P.pop(); }
}
/** the recessed block 20 .. 24.4 (8.4 m square): one rectangular window per face */
function tier1(K) {
  const { P, M } = K, h = 4.2;
  P.push(0, 0, h, 0);
  try {
    wallHoles(P, { mat: M.towerWall, x0: -h, x1: h, y0: 20.0, y1: 24.4, uvs: 4, ops: [{ x: 0, y0: 21.3, w: 1.0, h: 1.3, kind: 'rect', glass: M.glassDark }], reveal: M.towerWall, depth: 0.25 });
    P.box(M.towerOrder, -h - 0.35, h + 0.35, 24.0, 24.4, 0, 0.35, 'bk', 2);
  } finally { P.pop(); }
}
/** belfry I 24.4 .. 38.2 (8.6 m square): corner column pairs, a round-arched bell opening 2.3 x 5.0 on every face with a black railing, the cornice at 38.2 */
function belfry1(K, fi) {
  const { P, M } = K, h = 4.3, mats = { shaft: M.towerOrder, cap: M.towerOrder };
  P.push(0, 0, h, 0);
  try {
    wallHoles(P, { mat: M.towerWall, x0: -h, x1: h, y0: 24.4, y1: 37.0, uvs: 4, ops: [{ x: 0, y0: 27.0, w: 2.3, h: 3.85, kind: 'arch', glass: M.belfryDark }], reveal: M.towerWall, depth: 0.7 });
    P.quad(M.balcony, [-1.0, 27.0, 0.12], [1.0, 27.0, 0.12], [1.0, 28.1, 0.12], [-1.0, 28.1, 0.12], [0, 0, 1], [[0, 0], [1.2, 0], [1.2, 0.7], [0, 0.7]]);
    for (const sx of [-1, 1]) column(P, mats, sx * (h - 0.4), 0.45, 24.9, 37.0, 0.3, { seg: 10, capH: 0.7, baseH: 0.3 });
    for (const sx of [-1, 1]) column(P, mats, sx * (h - 1.2), 0.45, 24.9, 37.0, 0.3, { seg: 10, capH: 0.7, baseH: 0.3 });
    cornice(P, M.towerOrder, M.towerWall, -h, h, 0, 37.0 + fi * 0.004, { e0: 0.9, e1: 0.9, proj: 1.0, modillions: false });
    P.box(M.towerOrder, -h - 0.3, h + 0.3, 24.4, 25.0, 0, 0.35, 'bk', 2);
  } finally { P.pop(); }
}
/** belfry II 38.2 .. 47.8 (7.4 m square): paired columns, an arched louvred opening on every face, the cornice at 47.8 */
function belfry2(K, fi) {
  const { P, M } = K, h = 3.7, mats = { shaft: M.towerOrder, cap: M.towerOrder };
  P.push(0, 0, h, 0);
  try {
    wallHoles(P, { mat: M.towerWall, x0: -h, x1: h, y0: 38.2, y1: 46.6, uvs: 4, ops: [{ x: 0, y0: 40.4, w: 1.9, h: 3.0, kind: 'arch', glass: M.louver }], reveal: M.towerWall, depth: 0.5 });
    for (const sx of [-1, 1]) column(P, mats, sx * (h - 0.4), 0.4, 38.7, 46.6, 0.26, { seg: 10, capH: 0.6, baseH: 0.25 });
    for (const sx of [-1, 1]) column(P, mats, sx * (h - 1.05), 0.4, 38.7, 46.6, 0.26, { seg: 10, capH: 0.6, baseH: 0.25 });
    cornice(P, M.towerOrder, M.towerWall, -h, h, 0, 46.6 + fi * 0.004, { e0: 0.81, e1: 0.81, proj: 0.9, modillions: false });
  } finally { P.pop(); }
}
/** a pediment segment on each face over belfry II, below the cupola */
function cupolaFace(K) {
  const { P, M } = K, h = 3.7;
  P.push(0, 0, h + 0.8, 0);
  try { P.fan(M.towerOrder, [[-2.7, 47.8, 0], [2.7, 47.8, 0], [0, 49.2, 0]], [0, 0, 1], (p) => [p[0] / 2, p[1] / 2]); } finally { P.pop(); }
}

// ------------------------------------------------------------------------------------------------ the 9-step granite stair in front of the tower door (outside the fence)
function stair(K) {
  const { P, M } = K, S = STAIR, run = (S.u1 - S.u0) / S.n;
  for (let k = 1; k <= S.n; k++) {
    const ua = S.u0 + (k - 1) * run, ub = ua + run, y = S.top * k / S.n;
    P.box(M.stone, ua, ub, 0, y, S.v0, S.v1, 'rb', 1.6);
  }
  for (const v of [S.v0 - 0.02, S.v1 + 0.02]) P.box(M.iron, S.u0, S.u1 + 0.1, 0.0, 0.05, v - 0.02, v + 0.02, '', 1);          // a rail foot (the handrails are thin: drawn as a low bar)
}

// ------------------------------------------------------------------------------------------------ the pedimented chapel, the gatehouse, the bell frame
function plainWalls(K, ring, yEave, mat, o = {}) {
  const { P, M } = K;
  for (const e of ringEdges({ o: ring.flat(), h: [] }, 0.3)) {
    onEdge(P, e, (len) => {
      const n = Math.max(0, Math.floor((len - 1.0) / (o.pitch ?? 3.0))), ops = [];
      for (let k = 0; k < n; k++) ops.push({ x: (len - (n - 1) * (o.pitch ?? 3.0)) / 2 + k * (o.pitch ?? 3.0), y0: o.sill ?? 1.0, w: 1.0, h: o.wh ?? 1.6, kind: 'rect', glass: M.glassDark });
      if (!o.front || e !== o.front) wallHoles(P, { mat, x0: 0, x1: len, y0: o.ySt ?? 0.0, y1: yEave, uvs: 4, ops: o.noWin ? [] : ops, reveal: mat, depth: 0.2 });
      cornice(P, M.whiteS, mat, 0, len, 0, yEave - 0.9, { e0: 0.05, e1: 0.05, proj: 0.6, modillions: false });
    });
  }
}
function chapelBuilding(K, ring) {
  const { P, M } = K;
  // ring: rectangle u -38.5 .. -29.8, v 15.2 .. 20.8; the front is the short west side facing the street
  const u0 = -38.5, u1 = -29.8, v0 = 15.18, v1 = 20.82, wF = v1 - v0, yE = 4.7;
  const es = ringEdges({ o: ring.flat(), h: [] }, 0.3);
  for (const e of es) {
    const west = e.n[0] < -0.7;
    onEdge(P, e, (len) => {
      P.box(M.plinthRed, -0.1, len + 0.1, 0, 0.9, 0, 0.1, 'bk', 1.6);
      if (west) {
        // the front: rusticated corner piers, an arched niche closed by an iron grille
        wallHoles(P, { mat: M.towerWall, x0: 0, x1: len, y0: 0.9, y1: yE, uvs: 4, ops: [{ x: len / 2, y0: 1.0, w: 2.3, h: 1.9, kind: 'arch', glass: M.glassDark, sill: false }], reveal: M.towerWall, depth: 0.3 });
        P.quad(M.bars, [len / 2 - 1.1, 0.95, -0.05], [len / 2 + 1.1, 0.95, -0.05], [len / 2 + 1.1, 3.1, -0.05], [len / 2 - 1.1, 3.1, -0.05], [0, 0, 1], [[0, 0], [2, 0], [2, 2], [0, 2]]);
        for (const x of [0, len - 0.6]) P.box(M.whiteS, x, x + 0.6, 0.9, yE, 0, 0.12, 'k', 1);
        cornice(P, M.whiteS, M.towerWall, -0.1, len + 0.1, 0, yE - 0.9, { e0: 0.1, e1: 0.1, proj: 0.7, modillions: false });
        for (const m of [1, -1]) { const xa = m > 0 ? -0.2 : len + 0.2, xb = len / 2; P.quad(M.whiteS, [xa, yE, 0.25], [xb, 6.45, 0.25], [xb, 6.0, 0.25], [xa, yE - 0.3, 0.25], [0, 0, 1]); }
      } else {
        wallHoles(P, { mat: M.towerWall, x0: 0, x1: len, y0: 0.9, y1: yE, uvs: 4, ops: [], reveal: M.towerWall });
        cornice(P, M.whiteS, M.towerWall, 0, len, 0, yE - 0.9, { e0: 0.05, e1: 0.05, proj: 0.6, modillions: false });
      }
    });
  }
  // gable roof (ridge along u: the pediment faces west); the back gable triangle
  P.push((u0 + u1) / 2, 0, (v0 + v1) / 2, 0);
  try { gable(P, { roof: M.roofG }, -(u1 - u0) / 2, (u1 - u0) / 2, -wF / 2, wF / 2, yE, 6.4 - yE, { overhang: 0.25, gableEnds: true, wall: M.towerWall }); } finally { P.pop(); }
}
function gatehouse(K, ring) {
  const { P, M } = K, yE = 3.6;
  plainWalls(K, ring, yE, M.creamS, { ySt: 0.0, sill: 1.0, wh: 1.6, pitch: 3.2 });
  P.push(0, 0, 0, 0);
  try { hipRect(P, M.roofG, -38.7, -28.1, -20.5, -15.1, yE, 1.9, 0.3); P.cap(M.roofG, [[-32.8, -20.5], [-28.2, -20.5], [-28.2, -23.2], [-32.8, -23.2]], yE, true, 2.4); } finally { P.pop(); }
}
function bellFrame(K) {
  const { P, M } = K;
  for (const v of [-25.9, -22.7]) for (const u of [-1.2, 2.5, 6.2, 9.5]) P.box(M.steelDark, u - 0.06, u + 0.06, 0, 2.6, v - 0.06, v + 0.06, 'b', 1);
  for (const v of [-25.9, -22.7]) P.box(M.steelDark, -1.3, 9.6, 2.5, 2.62, v - 0.05, v + 0.05, 'b', 1);
  for (const u of [-1.2, 9.5]) P.box(M.steelDark, u - 0.05, u + 0.05, 2.5, 2.62, -25.9, -22.7, 'b', 1);
}

// ------------------------------------------------------------------------------------------------ the iron fence with piers and the two gates that flank the tower
function fence(K) {
  const { P, M } = K;
  for (const s of FENCE) {
    const du = s.b[0] - s.a[0], dv = s.b[1] - s.a[1], len = Math.hypot(du, dv), t = Math.atan2(-dv, du), gx = len * s.gate, gw = 3.2;
    // pier positions along the segment: both ends, the gate piers, and intermediate piers about every 4.5 m
    const xs = [0, gx - gw / 2, gx + gw / 2, len].sort((a, b) => a - b);
    const piers = [];
    for (let i = 0; i < xs.length - 1; i++) {
      piers.push(xs[i]);
      if (Math.abs(xs[i] - (gx - gw / 2)) < 1e-6 && Math.abs(xs[i + 1] - (gx + gw / 2)) < 1e-6) continue;           // the gate span: no intermediate pier
      const n = Math.max(1, Math.round((xs[i + 1] - xs[i]) / 4.5)); for (let k = 1; k < n; k++) piers.push(xs[i] + (xs[i + 1] - xs[i]) * k / n);
    }
    piers.push(len);
    P.push(s.a[0], 0, s.a[1], t);
    try {
      const sorted = [...new Set(piers.map((x) => Math.round(x * 1000) / 1000))].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        const xa = sorted[i] + 0.28, xb = sorted[i + 1] - 0.28, gate = Math.abs(sorted[i] - (gx - gw / 2)) < 1e-3 && Math.abs(sorted[i + 1] - (gx + gw / 2)) < 1e-3;
        if (xb - xa < 0.2) continue;
        if (!gate) P.box(M.stone, xa, xb, 0, 0.5, -0.15, 0.15, 'b', 1.6);
        const y0 = gate ? 0.12 : 0.5, y1 = gate ? 2.5 : 2.3;
        P.quad(M.bars, [xa, y0, 0], [xb, y0, 0], [xb, y1, 0], [xa, y1, 0], [0, 0, 1], [[0, 0], [(xb - xa) / 1.2, 0], [(xb - xa) / 1.2, (y1 - y0) / 1.0], [0, (y1 - y0) / 1.0]]);
      }
      for (const x of sorted) {
        const gp = Math.abs(x - (gx - gw / 2)) < 1e-3 || Math.abs(x - (gx + gw / 2)) < 1e-3, hgt = gp ? 3.0 : 2.7;
        P.box(M.pierW, x - 0.28, x + 0.28, 0, hgt - 0.35, -0.28, 0.28, 'b', 1);
        P.cyl(M.pierW, [x, hgt - 0.35, 0], [x, hgt, 0], 0.4, 0.06, 4, true);
      }
    } finally { P.pop(); }
    const w0 = FC.W(s.a[0], s.a[1]), w1 = FC.W(s.b[0], s.b[1]);
    K.svc.fences.push({ kind: 'iron', a: [w0.x, w0.z], b: [w1.x, w1.z], gate: s.gate });
  }
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders_(K, ring, chapel, gate) {
  const { ctx } = K, ph = ctx.physics, CL = colliders(FC, ph);
  addPolyColliders(ctx, polyIn(FC, ring), 0, 24, 0.3);                                   // thin walls: the 9 tower steps end 0.2 m in front of the door wall
  addPolyColliders(ctx, polyIn(FC, chapel), 0, 6.4, 0.4);
  addPolyColliders(ctx, polyIn(FC, gate), 0, 4, 0.4);
  for (const s of FENCE) { const it = CL.wall(s.a, s.b, 0, 2.6, 0.4); if (it) it.fence = true; }     // the iron fence and its closed gates: a wall for the pedestrians' routes (people/nav.js)
  const S = STAIR, c = FC.W((S.u0 + S.u1) / 2, (S.v0 + S.v1) / 2);
  ph.addStairs(c.x, c.z, S.v1 - S.v0 - 0.1, S.u1 - S.u0, FC.rot + Math.PI / 2, 0, S.top, S.n);
  for (const v of [-25.9, -22.7]) for (const u of [-1.2, 9.5]) CL.cyl(u, v, 0.2, 0, 2.6);
}
