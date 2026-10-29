// landmarksSredny/tower.js - the CHERNIKHOV WATER TOWER and the ROPE SHOP of the Red Nailer plant (25th line 4 / 6 k1; Ya. G. Chernikhov, constructivism 1930-31, restored 2021-25, now a building of the Higher School of
// Economics); OSM w117952619 (skip: its four parts w868131738 shaft, w868131739 tank, w868131740 body, w868131741 strip follow through the parent id).  Dossier docs/research/sredny.md section 7 (critic C10), photos refs/sredny
// 111-118 (restored), 120-125 (old state), n14 n16, frame T (origin (-4918.7, 364.1), rot 29.25 deg, X ENE 0 .. 41.2, Z SSE 0 .. 130.3).
//   THE HALL: the OSM ring of the body (two storeys, eaves 10.5 m: steel-framed window groups 1.6 x 3.6 m in bays of 3.5 m, a first-floor band, a dark plinth 0.9 m, warm cream-ochre plaster `#dcc59a`), the rounded SSE corner
//   (r 3.5) round the tank base, the central three-storey STRIP X 12.5 .. 30.7 (eaves 14.5 m, ridge 16.5 m, glazed lanterns 11.4 m wide in two runs with a solid cross band, gabled end walls), roofs light / dark grey.
//   THE TOWER: a reinforced-concrete shaft 5.9 x 4.3 m (X 31.3 .. 37.2, Z 124.3 .. 128.7) rising to 28.3 m (railing to 29.4 m, two ladders): on the face toward the Maslyany canal street a solid block with six small windows
//   (0.9 x 1.1 m, pitch 3.7 m) and an open recess with the tall slits (0.5 .. 6.1 m and 8.3 .. 18.8 m) between two pilasters; the TANK: a cylinder d 7.0 m (centre T (38.45, 126.5)) from 20.5 to 26.0 m over a slab 0.8 m
//   with a 1.0 m glazing ribbon at 23.6 .. 24.6 m round the canal-street and east sides, a roof slab and a tubular railing 1.1 m; it rests on the shaft and TWO round columns d 1.2 m (X 38.45 / 40.85) with a rib grid under it.
//   Nothing is enterable: thin-wall colliders on the ring, a solid shaft, solid columns.  No lettering (none is documented on the facade), no flags.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FR } from './frame.js';
import { ringEdges, onEdge, polyOf } from './kit.js';
import { wallFace, rectC, rectOutline, band, cornice, onBack, onFront, onEast, onWest } from './wall.js';
import { coverFn } from './surfaces.js';

const T = FR.T;
export const RING_T = [[40.6, 0], [40.6, 123.7], [41.3, 124.4], [41.9, 126.1], [41.7, 127.9], [41.3, 128.7], [40.6, 129.3], [39.8, 129.7], [38.9, 130], [38, 130], [37.2, 129.7], [35.7, 128.6], [0.8, 128.6], [0.7, -0.1]];
const SH = { x0: 31.3, x1: 37.2, z0: 124.3, z1: 128.95, top: 28.3 };      // z1 0.25 m beyond the OSM 128.7: the hall wall (Z 128.6) behind the shaft face must not fight with it
const TANK = { cx: 38.45, cz: 126.5, r: 3.5, y0: 20.5, y1: 26.0 };
const EAVES = 10.5;

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSredny] tower/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = K.P;
  T.enter(P);
  try {
    stage('hall', () => hall(K));
    stage('strip', () => strip(K));
    stage('shaft', () => shaft(K));
    stage('tank', () => tank(K));
  } finally { T.leave(P); }
  stage('colliders', () => colliders(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the body of the rope shop
function hallWall(K, len, o = {}) {
  const { P, M } = K, bays = Math.max(1, Math.round(len / 3.5)), pitch = len / bays, ops = [];
  if (!o.plain) for (let i = 0; i < bays; i++) { const cx = (i + 0.5) * pitch; if (cx - 0.8 > 0.3 && cx + 0.8 < len - 0.3) ops.push({ c: rectC(cx, 0.95, 1.6, 3.6), glass: M.hallWin, reveal: M.towerPlaster, depth: 0.22 }, { c: rectC(cx, 6.1, 1.6, 3.6), glass: M.hallWin, reveal: M.towerPlaster, depth: 0.22 }); }
  wallFace(P, M.towerPlaster, rectOutline(0, len, -0.3, EAVES), ops, { tu: 4, tv: 4 });
  band(P, M.plinthGrey, 0, len, 0, 0.9, 0, 0.1, 2);
  band(P, M.graphite, 0, len, 5.15, 5.5, 0, 0.12, 1);
  band(P, M.towerPlaster, -0.1, len + 0.1, EAVES - 0.4, EAVES + 0.3, 0, 0.35, 2);
}
function hall(K) {
  const { P, M } = K;
  for (const e of ringEdges(polyOf(RING_T))) {
    const short = e.len < 3.0;
    onEdge(P, e, (len) => hallWall(K, len, { plain: short }));
  }
  // roofs of the body: light grey metal on the west half, dark grey on the east half (the strip stands between)
  const flat = (mat, x0, x1, z0, z1, y) => P.quad(mat, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], [[x0 / 3, z0 / 3], [x1 / 3, z0 / 3], [x1 / 3, z1 / 3], [x0 / 3, z1 / 3]]);
  flat(M.roofLight, 0.8, 12.5, 0.0, 128.6, EAVES); flat(M.roofDark, 30.7, 40.6, 0.0, 123.7, EAVES);
  P.cap(M.roofDark, [[30.7, 123.7], [40.6, 123.7], [41.3, 124.4], [41.9, 126.1], [41.7, 127.9], [41.3, 128.7], [40.6, 129.3], [39.8, 129.7], [38.9, 130], [38, 130], [37.2, 129.7], [35.7, 128.6], [30.7, 128.6]], EAVES, true, 3);
  flat(M.roofLight, 12.5, 30.7, 128.3, 128.6, EAVES);
}

// ------------------------------------------------------------------------------------------------ the strip: three storeys, gabled, with the glazed lanterns
function strip(K) {
  const { P, M } = K, X0 = 12.5, X1 = 30.7, Z0 = 0.3, Z1 = 128.6, XC = (X0 + X1) / 2;
  // side walls from the body eaves to 14.5 m with a ribbon of small windows
  for (const [x, west] of [[X0, true], [X1, false]]) {
    const len = Z1 - Z0, bays = Math.round(len / 3.5), pitch = len / bays, ops = [];
    for (let i = 0; i < bays; i++) { const cx = (i + 0.5) * pitch; ops.push({ c: rectC(cx, 11.2, 1.6, 2.2), glass: M.hallWin, reveal: M.towerPlaster, depth: 0.2 }); }
    (west ? onWest : onEast)(P, x, west ? Z0 : Z1, () => { wallFace(P, M.towerPlaster, rectOutline(0, len, EAVES - 0.4, 14.5), ops, { tu: 4, tv: 4 }); band(P, M.towerPlaster, -0.1, len + 0.1, 14.0, 14.8, 0, 0.3, 2); });
  }
  // gabled end walls (north Z = 0.3 facing -Z, south Z = 128.6 facing +Z): the double-pitch outline with a tall window
  const outline = [[X0, EAVES - 0.4], [X1, EAVES - 0.4], [X1, 14.5], [XC, 16.5], [X0, 14.5]];
  onFront(P, X1, Z0, () => {
    const xl = (X) => X1 - X;
    wallFace(P, M.towerPlaster, outline.map(([x, y]) => [xl(x), y]).reverse(), [{ c: rectC(xl(XC), 11.2, 5.0, 3.0), glass: M.hallWin, reveal: M.towerPlaster, depth: 0.25 }], { tu: 4, tv: 4 });
  });
  onBack(P, X0, Z1, () => { wallFace(P, M.towerPlaster, outline.map(([x, y]) => [x - X0, y]), [{ c: rectC(XC - X0, 11.2, 5.0, 3.0), glass: M.hallWin, reveal: M.towerPlaster, depth: 0.25 }], { tu: 4, tv: 4 }); });
  // the gable roof (eaves 14.5, ridge 16.5) and two glazed lanterns 11.4 m wide (Z 8 .. 63.5 and 68 .. 121.6) with a solid cross band between
  const hw = (X1 - X0) / 2;
  for (const s of [-1, 1]) P.quad(M.roofLight, [s < 0 ? X0 : XC, s < 0 ? 14.5 : 16.5, Z0], [s < 0 ? XC : X1, s < 0 ? 16.5 : 14.5, Z0], [s < 0 ? XC : X1, s < 0 ? 16.5 : 14.5, Z1], [s < 0 ? X0 : XC, s < 0 ? 14.5 : 16.5, Z1], [s, 1, 0]);
  for (const [za, zb] of [[8, 63.5], [68, 121.6]]) {
    for (const s of [-1, 1]) P.quad(M.lantern, [s < 0 ? XC - 5.7 : XC, s < 0 ? 15.35 : 17.1, za], [s < 0 ? XC : XC + 5.7, s < 0 ? 17.1 : 15.35, za], [s < 0 ? XC : XC + 5.7, s < 0 ? 17.1 : 15.35, zb], [s < 0 ? XC - 5.7 : XC, s < 0 ? 15.35 : 17.1, zb], [s, 1, 0], [[0, 0], [1, 0], [1, (zb - za) / 1.5], [0, (zb - za) / 1.5]]);
    for (let z = za; z <= zb + 0.01; z += 1.5) P.box(M.graphite, XC - 5.75, XC + 5.75, 17.05 - 0, 17.1, z - 0.04, z + 0.04, 'b', 1);
  }
  void hw;
}

// ------------------------------------------------------------------------------------------------ the shaft
function shaft(K) {
  const { P, M } = K, w = SH.x1 - SH.x0, d = SH.z1 - SH.z0, H = SH.top;
  // south face (toward the Maslyany canal street): the solid block with six small windows, the recess with the tall slits between two pilasters
  onBack(P, SH.x0, SH.z1, () => {
    const ops = [];
    for (let k = 0; k < 6; k++) ops.push({ c: rectC(1.85, 1.8 + k * 3.7, 0.9, 1.1), glass: M.slit, reveal: M.towerPlaster, depth: 0.2 });
    ops.push({ c: rectC(4.8, 0.5, 0.9, 5.6), glass: M.slit, reveal: M.graphite, depth: 0.3 }, { c: rectC(4.8, 8.3, 0.9, 10.5), glass: M.slit, reveal: M.graphite, depth: 0.3 });
    wallFace(P, M.towerPlaster, rectOutline(0, w, -0.2, H), ops, { tu: 4, tv: 4 });
    for (const x of [3.9, 5.7]) P.box(M.towerPlaster, x - 0.15, x + 0.15, 0.5, 20.5, 0, 0.4, 'bk', 2);
    P.box(M.towerPlaster, 3.7, w, 6.1, 8.3, 0, 0.25, 'bk', 2);                                       // the beam band between the two slits
  });
  // west face: plain with six small windows; east and north faces: plain
  onWest(P, SH.x0, SH.z0, () => { const ops = []; for (let k = 0; k < 6; k++) ops.push({ c: rectC(d / 2, 1.8 + k * 3.7, 0.9, 1.1), glass: M.slit, reveal: M.towerPlaster, depth: 0.2 }); wallFace(P, M.towerPlaster, rectOutline(0, d, -0.2, H), ops, { tu: 4, tv: 4 }); });
  onEast(P, SH.x1, SH.z1, () => wallFace(P, M.towerPlaster, rectOutline(0, d, -0.2, H), [], { tu: 4, tv: 4 }));
  onFront(P, SH.x1, SH.z0, () => wallFace(P, M.towerPlaster, rectOutline(0, w, EAVES - 0.5, H), [], { tu: 4, tv: 4 }));
  // roof slab, a railing 1.1 m round it, two steel ladders, a small door to the tank terrace at 26.0 m
  P.quad(M.concrete, [SH.x0, H, SH.z0], [SH.x1, H, SH.z0], [SH.x1, H, SH.z1], [SH.x0, H, SH.z1], [0, 1, 0]);
  P.box(M.towerPlaster, SH.x0 - 0.12, SH.x1 + 0.12, H - 0.25, H, SH.z0 - 0.12, SH.z1 + 0.12, 'b', 2);
  const rail = (x0, z0, x1, z1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.0)); for (let i = 0; i <= n; i++) P.cyl(M.railing, [x0 + (x1 - x0) * i / n, H, z0 + (z1 - z0) * i / n], [x0 + (x1 - x0) * i / n, H + 1.1, z0 + (z1 - z0) * i / n], 0.02, 0.02, 4, false); for (const y of [H + 0.55, H + 1.1]) P.cyl(M.railing, [x0, y, z0], [x1, y, z1], 0.02, 0.02, 4, false); };
  rail(SH.x0, SH.z0, SH.x1, SH.z0); rail(SH.x1, SH.z0, SH.x1, SH.z1); rail(SH.x1, SH.z1, SH.x0, SH.z1); rail(SH.x0, SH.z1, SH.x0, SH.z0);
  for (const x of [SH.x0 + 1.0, SH.x0 + 1.7]) { P.box(M.graphite, x - 0.02, x + 0.02, H - 2.4, H + 1.0, SH.z1 - 0.02, SH.z1 + 0.14, '', 1); }
  P.box(M.graphite, SH.x0 + 1.0, SH.x0 + 1.7, 24.0, 24.04, SH.z1 + 0.02, SH.z1 + 0.14, '', 1);
}

// ------------------------------------------------------------------------------------------------ the tank on the shaft and two round columns
function tank(K) {
  const { P, M } = K, { cx, cz, r, y0, y1 } = TANK, N = 36;
  const p = (a, rr, y) => [cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr];
  const inRibbon = (a) => { let d = ((a - Math.PI / 4) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; return Math.abs(d) < 1.9; };   // the ribbon runs round the canal-street (+Z) and east (+X) sides
  for (let i = 0; i < N; i++) {
    const a0 = i / N * 2 * Math.PI, a1 = (i + 1) / N * 2 * Math.PI, am = (a0 + a1) / 2, nrm = [Math.cos(am), 0, Math.sin(am)];
    const seg = (mat, ya, yb, uv) => P.quad(mat, p(a1, r, ya), p(a0, r, ya), p(a0, r, yb), p(a1, r, yb), nrm, uv);
    if (inRibbon(am)) {
      seg(M.towerPlaster, y0, 23.6, [[0, 0], [1, 0], [1, 1], [0, 1]]); seg(M.ribbon, 23.6, 24.6, [[1, 0], [0, 0], [0, 1], [1, 1]]); seg(M.towerPlaster, 24.6, y1, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    } else seg(M.towerPlaster, y0, y1, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // roof slab (disc) with a rim, the underside slab 0.8 m with four short brackets, the terrace railing
  P.fan(M.concrete, Array.from({ length: N }, (_, i) => p(i / N * 2 * Math.PI, r + 0.05, y1)), [0, 1, 0]);
  P.fan(M.graphite, Array.from({ length: N }, (_, i) => p(-i / N * 2 * Math.PI, r + 0.1, y0 - 0.8)), [0, -1, 0]);
  for (let i = 0; i < N; i++) { const a0 = i / N * 2 * Math.PI, a1 = (i + 1) / N * 2 * Math.PI, am = (a0 + a1) / 2; P.quad(M.towerPlaster, p(a1, r + 0.1, y0 - 0.8), p(a0, r + 0.1, y0 - 0.8), p(a0, r + 0.1, y0), p(a1, r + 0.1, y0), [Math.cos(am), 0, Math.sin(am)]); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * 2 * Math.PI; P.cyl(M.railing, p(a, r - 0.1, y1), p(a, r - 0.1, y1 + 1.1), 0.02, 0.02, 4, false); const b = (i + 1) / 24 * 2 * Math.PI; for (const y of [y1 + 0.55, y1 + 1.1]) P.cyl(M.railing, p(a, r - 0.1, y), p(b, r - 0.1, y), 0.02, 0.02, 4, false); }
  // two round columns d 1.2 m from the hall roof to the underside of the tank, and the X-shaped rib grid under the slab
  for (const x of [38.45, 40.85]) P.col(M.towerPlaster, x, cz, EAVES - 0.5, y0 - 0.8, 0.62, 0.56, 18, false);
  for (const a of [0.0, Math.PI / 2]) { P.push(cx, 0, cz, a); P.box(M.concrete, -r, r, y0 - 1.5, y0 - 0.8, -0.2, 0.2, 'b', 2); P.pop(); }
}

// ------------------------------------------------------------------------------------------------ colliders and services
function colliders(K) {
  const ph = K.ctx.physics;
  for (const e of ringEdges(polyOf(RING_T))) T.wall(ph, e.a, e.b, 0, 18, 0.6);
  T.box(ph, (SH.x0 + SH.x1) / 2, (SH.z0 + SH.z1) / 2, SH.x1 - SH.x0, SH.z1 - SH.z0, 0, 30);
  for (const x of [38.45, 40.85]) T.cyl(ph, x, TANK.cz, 0.65, 0, 24);
  void L;
}
function services(K) {
  const svc = K.svc, c = T.W(38.45, 126.5), cover = coverFn(K.ctx);
  svc.monuments.push({ id: 'w117952619', name: 'Водонапорная башня Чернихова (канатный цех «Красного гвоздильщика»)', x: c.x, z: c.z, h: 29.9 });
  if (cover(-4803.3, 443.7) < -0.5 && !L.insideBuilding(-4803.3, 443.7, 0.5)) svc.photoSpots.push({ x: -4803.3, z: 443.7, yaw: 121, pitch: 18, name: 'Башня Чернихова: от 25-й линии' });
}
