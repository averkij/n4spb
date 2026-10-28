// landmarksSevkabel/quarter.js - the BRUSNITSYN QUARTER on Kozhevennaya line (frame M; docs/research/sevkabel.md section 5; photos 064-100).
//   * the MANSION (OSM r4743691, Kovsharov 1884-86; derelict, ochre-cream): a "Ш" plan, two storeys (rusticated ground floor 0 .. 4.5 m, piano nobile 4.5 .. 11.2 m, cornice 12.8 m); the west block (8 axes, window
//     surrounds with hoods and garlands, a rectangular oriel on volute corbels), the central wing (1.2 m proud) with a ONE-AXIS avant-corps 5.4 m wide (review 2026-10-09: pilaster strips, a shallow segmental pediment
//     with a plain laurel disc, the central window, a 5.8 m balcony on consoles over the door) between two flanking windows, the east block of bright ochre (a canted oriel with a copper dome, two plain windows) behind a 2.7 m bright yellow wall with brick piers, the copper-roofed winter garden, a low rust-red hip roof with brick chimneys.
//   * the PINK HOUSE 27/1 (r4743693): 126 m street front, three storeys, salmon pink over a rose ground floor, THREE porticoes of two Tuscan columns each, a big semicircular blind arch over the first one; brick yard wings.
//   * the LEATHER FACTORY 28-30 (r8702898, SW side of the street): 204 m of red brick, four storeys + attic, arched windows, corbelled friezes, flat dark roof, a brick tower with a concrete cap.
//   * the SKYWAY (w335462132): a timber-clad box with an arched underside over the street, between the mansion block and the factory.
//   Frame M: local +x = u along the street front (ESE), local +z = towards the street (SSW); the mansion lies at lz < 0, the factory across the street at lz > 15.  All of it is closed: solid, exterior only.
import * as THREE from 'three';
import * as L from '../layout.js';
import { M as MF } from './frame.js';
import { polysOf, polyWalls, roofCap } from './common.js';
import { ringEdges, onEdge, band } from './kit.js';
import { windowWall, bayWall, cornice } from './facade.js';
import { addPolyColliders } from '../lib/massing.js';
import { splitBays, unitBox } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, 15.v): the yard wall is a row of breakable bays (the brick piers every 6 m stay static)
import { kBays } from './inst.js';

/** a footprint {o, h} in world metres from frame-M points [u, lz] */
const polyM = (pts) => ({ o: pts.flatMap(([a, b]) => { const w = MF.W(a, b); return [w.x, w.z]; }), h: [] });

export function build(K) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSevkabel] quarter/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('mansion', () => mansion(K));
  stage('pink', () => pinkHouse(K));
  stage('factory', () => factory(K));
  stage('skyway', () => skyway(K));
  stage('services', () => services(K));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ small helpers
/** a hip roof (frustum) over the rectangle [u0, u1] x [z0, z1] of the current frame: eaves at y0, flat top at y1, inset `ins` */
function hip(P, mat, r, y0, y1, ins, mat2 = mat) {
  const [u0, u1, z0, z1] = r, a = [u0, z0], b = [u1, z0], c = [u1, z1], d = [u0, z1];
  const i = (p, sx, sz) => [p[0] + sx * ins, p[1] + sz * ins];
  const A = i(a, 1, 1), B = i(b, -1, 1), C = i(c, -1, -1), D = i(d, 1, -1);
  const sl = (p, q, pi, qi, n) => P.quad(mat, [p[0], y0, p[1]], [q[0], y0, q[1]], [qi[0], y1, qi[1]], [pi[0], y1, pi[1]], n, [[p[0] / 3, p[1] / 3], [q[0] / 3, q[1] / 3], [qi[0] / 3, y1 / 3], [pi[0] / 3, y1 / 3]]);
  sl(a, b, A, B, [0, 0.5, -1]); sl(b, c, B, C, [1, 0.5, 0]); sl(c, d, C, D, [0, 0.5, 1]); sl(d, a, D, A, [-1, 0.5, 0]);
  P.cap(mat2, [A, B, C, D], y1, true, 3);
}
/** a moulded window surround on a wall of the current frame (front = +z): frame bars, sill, a hood with a keystone and a garland panel above */
function surround(P, M, cx, y0, w, h, z = 0, o = {}) {
  const t = 0.2, d = 0.14, mat = o.mat || M.trimCream;
  P.box(mat, cx - w / 2 - t, cx - w / 2, y0, y0 + h, z, z + d, 'bk', 1); P.box(mat, cx + w / 2, cx + w / 2 + t, y0, y0 + h, z, z + d, 'bk', 1);
  P.box(mat, cx - w / 2 - t * 1.2, cx + w / 2 + t * 1.2, y0 - 0.25, y0, z, z + d + 0.12, 'bk', 1);                // sill
  P.box(mat, cx - w / 2 - t, cx + w / 2 + t, y0 + h, y0 + h + 0.22, z, z + d + 0.1, 'bk', 1);                        // head
  P.box(mat, cx - w / 2 - t * 1.6, cx + w / 2 + t * 1.6, y0 + h + 0.22, y0 + h + 0.5, z, z + d + 0.22, 'bk', 1);     // hood cornice
  if (o.garland) P.quad(M.garland, [cx - w / 2, y0 + h + 0.55, z + 0.02], [cx + w / 2, y0 + h + 0.55, z + 0.02], [cx + w / 2, y0 + h + 1.05, z + 0.02], [cx - w / 2, y0 + h + 1.05, z + 0.02], [0, 0, 1], [[0, 0], [w / 5, 0], [w / 5, 1], [0, 1]]);
  P.box(mat, cx - 0.12, cx + 0.12, y0 + h, y0 + h + 0.55, z, z + d + 0.3, 'bk', 1);                                  // keystone
}

// ------------------------------------------------------------------------------------------------ the mansion
const MH = 12.8;
function mansion(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const full = polysOf('r4743691')[0]; if (!full) throw new Error('r4743691 missing');
  // the tall mass without the winter garden zone (u 69.3 .. 79.3, lz -34.8 .. -23.1)
  const tall = [[0, 0], [0, -18], [45.9, -18.2], [45.9, -53.5], [59.4, -53.4], [59.5, -38.2], [62.2, -38.2], [62.3, -22.8], [69.3, -23.1], [79.3, -23.1], [79.5, 0]];
  const tallPoly = polyM(tall), tedges = ringEdges(tallPoly);
  // shell walls on every edge except the street front (A -> L = the last edge) in plain old plaster; the front is drawn below
  tedges.forEach((e, i) => { if (i === tedges.length - 1) return; const f = e.len; onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: MH, tu: 4, tv: 4, base: M.rock, baseTop: 4.5, wall: M.plasterOld })); void f; });
  P.push(MF.x, 0, MF.z, MF.rot);
  try {
    // ---- west block front (u 0 .. 45.9, plane lz 0): barred ground floor, tall first-floor windows, door
    const ax = Array.from({ length: 8 }, (_, k) => 3.3 + k * 5.6);
    const ops = [];
    ax.forEach((x, k) => {
      if (k === 6) ops.push({ x, w: 1.4, y0: 0, y1: 2.7, glass: M.barred, kind: 'door' });
      else ops.push({ x, w: 1.2, y0: 0.9, y1: 2.6, glass: M.barred });
      ops.push({ x, w: 1.5, y0: 5.1, y1: 8.5, glass: M.curtain });
    });
    windowWall(P, { x0: 0, x1: 45.9, y0: 0, y1: MH, z0: 0, tu: 4, tv: 4, base: M.rock, baseTop: 4.5, wall: M.plasterOld, reveal: M.plasterOld, depth: 0.25, ops });
    ax.forEach((x, k) => { surround(P, M, x, 5.1, 1.5, 3.4, 0, { garland: true }); P.box(M.trimCream, x - 0.75, x + 0.75, 4.55, 5.0, 0.0, 0.1, 'bk', 1); void k; });
    // string course, frieze with garlands, cornice
    P.box(M.trimCream, 0, 45.9, 4.3, 4.7, 0, 0.16, 'bk', 1);
    P.quad(M.garland, [0, 11.15, 0.03], [45.9, 11.15, 0.03], [45.9, 12.2, 0.03], [0, 12.2, 0.03], [0, 0, 1], [[0, 0], [45.9 / 5, 0], [45.9 / 5, 1], [0, 1]]);
    P.box(M.trimCream, -0.2, 46.1, 12.2, 12.55, 0, 0.55, 'bk', 1); P.box(M.trimCream, -0.3, 46.2, 12.55, 12.8, 0, 0.8, 'bk', 1);
    // the rectangular oriel on volute corbels (u 18 .. 24, 1.2 m proud, first floor; the dossier's u 8..14 would sit in the skyway: moved to the next axis)
    P.box(M.plasterOld, 18, 24, 4.2, 8.4, 0, 1.2, 'bk', 4);
    P.box(M.trimCream, 17.85, 24.15, 8.4, 8.7, 0, 1.35, 'bk', 1);
    P.quad(M.curtain, [20.0, 4.9, 1.21], [22.0, 4.9, 1.21], [22.0, 8.0, 1.21], [20.0, 8.0, 1.21], [0, 0, 1]);
    for (const x of [18.4, 23.6]) P.box(M.plasterOld, x - 0.3, x + 0.3, 3.2, 4.2, 0, 0.9, 'bk', 2);
    P.box(M.copperRoof, 17.8, 24.2, 8.7, 8.85, -0.05, 1.45, 'b', 2);
    // ---- the central avant-corps (u 45.9 .. 59.4, 1.2 m proud): rusticated ground floor, three windows, consoled balcony over the door, pilasters, the arched pediment
    P.box(M.rock, 45.9, 59.4, 0, 4.5, 0, 1.2, 'bk', 3.6);
    P.box(M.plasterOld, 45.9, 59.4, 4.5, MH, 0, 1.2, 'bkb', 4);
    const wins = [{ x: 48.9, w: 1.2, y0: 0.9, y1: 2.6, g: M.barred }, { x: 56.4, w: 1.2, y0: 0.9, y1: 2.6, g: M.barred }];
    for (const q of wins) P.quad(q.g, [q.x - q.w / 2, q.y0, 1.21], [q.x + q.w / 2, q.y0, 1.21], [q.x + q.w / 2, q.y1, 1.21], [q.x - q.w / 2, q.y1, 1.21], [0, 0, 1]);
    P.quad(M.barred, [51.95, 0.02, 1.21], [53.35, 0.02, 1.21], [53.35, 2.7, 1.21], [51.95, 2.7, 1.21], [0, 0, 1]);
    // review 2026-10-09 (photos 065 070): the avant-corps proper is ONE axis, 5.4 m wide (the door is 1.4 m = 175 px on photo 065, the pediment 670 px), not the 13.5 m of the whole wing: it stands 0.7 m proud of the
    // wing face (z 1.2 -> 1.9) between two floral pilaster strips at +-1.85 m, carries the central window, the consoled balcony (5.8 m) and a SHALLOW segmental pediment (span 5.4 m, base 11.4 m, crown 13.5 m)
    // that pokes 0.7 m above the cornice; the two flanking windows (3.3 m pitch) belong to the wing face.
    const AC = 52.65, ACW = 5.4;
    for (const x of [AC - 3.9, AC + 3.9]) { P.quad(M.curtain, [x - 0.75, 5.1, 1.21], [x + 0.75, 5.1, 1.21], [x + 0.75, 8.5, 1.21], [x - 0.75, 8.5, 1.21], [0, 0, 1]); surround(P, M, x, 5.1, 1.5, 3.4, 1.2); }
    P.box(M.plasterOld, AC - ACW / 2, AC + ACW / 2, 4.5, 12.2, 1.2, 1.9, 'bk', 4);                                     // the avant-corps block (first floor up to the entablature)
    P.quad(M.curtain, [AC - 0.8, 5.1, 1.91], [AC + 0.8, 5.1, 1.91], [AC + 0.8, 8.5, 1.91], [AC - 0.8, 8.5, 1.91], [0, 0, 1]); surround(P, M, AC, 5.1, 1.6, 3.4, 1.9, { garland: true });
    for (const s of [-1, 1]) P.box(M.trimCream, AC + s * 1.85 - 0.22, AC + s * 1.85 + 0.22, 4.6, 11.0, 1.9, 2.04, 'bk', 1);   // floral pilaster strips
    P.box(M.trimCream, AC - 2.9, AC + 2.9, 4.0, 4.55, 0.2, 3.0, 'b', 1);                                              // the balcony slab (1.3 m beyond the avant-corps face)
    P.quad(M.garland, [AC - 2.5, 4.05, 3.01], [AC + 2.5, 4.05, 3.01], [AC + 2.5, 4.5, 3.01], [AC - 2.5, 4.5, 3.01], [0, 0, 1], [[0, 0], [1.3, 0], [1.3, 1], [0, 1]]);
    for (const s of [-1, 1]) P.box(M.plasterOld, AC + s * 1.85 - 0.3, AC + s * 1.85 + 0.3, 2.8, 4.0, 1.2, 2.2, 'bk', 2);   // consoles
    for (const x of [46.7, 58.6]) P.box(M.trimCream, x - 0.35, x + 0.35, 4.6, 12.2, 1.2, 1.34, 'bk', 1);              // wing pilasters (lozenge-panel piers)
    P.box(M.trimCream, 45.7, 59.6, 12.2, 12.55, 0, 1.75, 'bk', 1); P.box(M.trimCream, 45.6, 59.7, 12.55, 12.8, 0, 2.0, 'bk', 1);
    P.quad(M.garland, [45.9, 11.15, 1.23], [59.4, 11.15, 1.23], [59.4, 12.2, 1.23], [45.9, 12.2, 1.23], [0, 0, 1], [[0, 0], [13.5 / 5, 0], [13.5 / 5, 1], [0, 1]]);
    {   // shallow segmental pediment: span 5.4 m, base 11.4 m, crown 13.5 m, front at z 2.1
      const sh = new THREE.Shape(); sh.moveTo(AC - ACW / 2, 11.4); sh.lineTo(AC + ACW / 2, 11.4); sh.quadraticCurveTo(AC, 15.6, AC - ACW / 2, 11.4);
      P.extrude(M.plasterOld, sh, 0, 2.1, 4, 10);
      const d = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; d.push([AC + Math.cos(a) * 0.6, 12.35 + Math.sin(a) * 0.6, 2.12]); }
      P.fan(M.laurel, d, [0, 0, 1]);
      const d2 = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; d2.push([AC + Math.cos(a) * 0.36, 12.35 + Math.sin(a) * 0.36, 2.13]); }
      P.fan(M.stone, d2, [0, 0, 1]);
    }
    // ---- the east block (u 59.5 .. 79.5): bright ochre, face set back 2.5 m behind the yard wall; canted oriel with a copper dome, two plain windows
    P.box(M.ochre, 59.4, 79.5, 0, MH, -2.5, -2.4, 'bk', 4);
    for (const x of [71.2, 75.3]) { P.quad(M.curtain, [x - 0.75, 5.1, -2.39], [x + 0.75, 5.1, -2.39], [x + 0.75, 8.5, -2.39], [x - 0.75, 8.5, -2.39], [0, 0, 1]); surround(P, M, x, 5.1, 1.5, 3.4, -2.4); }
    {   // the canted oriel (u 62 .. 68): front face and two angled cheeks, copper dome
      const c = [[62.0, -2.4], [63.4, -1.0], [66.6, -1.0], [68.0, -2.4]];
      P.quad(M.ochre, [c[1][0], 4.2, c[1][1]], [c[2][0], 4.2, c[2][1]], [c[2][0], 9.0, c[2][1]], [c[1][0], 9.0, c[1][1]], [0, 0, 1]);
      P.quad(M.ochre, [c[0][0], 4.2, c[0][1]], [c[1][0], 4.2, c[1][1]], [c[1][0], 9.0, c[1][1]], [c[0][0], 9.0, c[0][1]], [-0.7, 0, 0.7]);
      P.quad(M.ochre, [c[2][0], 4.2, c[2][1]], [c[3][0], 4.2, c[3][1]], [c[3][0], 9.0, c[3][1]], [c[2][0], 9.0, c[2][1]], [0.7, 0, 0.7]);
      for (const x of [64.1, 65.9]) P.quad(M.curtain, [x - 0.55, 4.9, -0.99], [x + 0.55, 4.9, -0.99], [x + 0.55, 8.3, -0.99], [x - 0.55, 8.3, -0.99], [0, 0, 1]);
      const g = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(2.5, 1.5, 1.6);
      P.geo(M.copperDome, g, 65.0, 9.0, -1.8); g.dispose();
      P.box(M.trimCream, 61.8, 68.2, 3.9, 4.3, -2.5, -0.8, 'b', 1);
    }
    P.box(M.trimCream, 59.3, 79.6, 12.2, 12.55, -2.5, -1.9, 'bk', 1); P.box(M.trimCream, 59.2, 79.7, 12.55, 12.8, -2.5, -1.7, 'bk', 1);
    // ---- the yard wall (2.7 m, bright yellow, brick piers every 6 m with flat tile caps) from u 46 to 79.5, razor wire left out
    // (the wall itself is a row of breakable bays, below)
    for (let u = 46.3; u < 80; u += 6) { P.box(M.brickRed, u - 0.3, u + 0.3, 0, 2.9, -0.5, 0.1, 'b', 1); P.box(M.rustRoof, u - 0.5, u + 0.5, 2.9, 3.05, -0.7, 0.3, 'b', 1); }
    // ---- the roof: low rust-red hips over the three wings, brick chimneys at the ridge
    hip(P, M.rustRoof, [-0.2, 46.0, -18.3, 0.35], MH + 0.05, 15.4, 4.0);
    hip(P, M.rustRoof, [45.8, 59.6, -53.6, 1.3], MH + 0.05, 15.4, 3.2);
    hip(P, M.rustRoof, [59.5, 79.6, -23.3, 0.1], MH + 0.05, 15.2, 3.0);
    for (const [u, z] of [[30, -9], [75, -12], [52.6, -36]]) P.box(M.brickChimney, u - 0.6, u + 0.6, 14.4, 16.8, z - 0.6, z + 0.6, 'b', 1);
    // ---- the winter garden: a glazed steel lean-to (10 x 11.7 m, eaves 6.5 m) with a copper hip roof
    {
      const u0 = 69.3, u1 = 79.2, z0 = -34.8, z1 = -23.1;
      for (const [a, b, n] of [[[u0, z1], [u0, z0], [-1, 0, 0]], [[u0, z0], [u1, z0], [0, 0, -1]], [[u1, z0], [u1, z1], [1, 0, 0]]]) {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        P.quad(M.darkWin, [a[0], 0.2, a[1]], [b[0], 0.2, b[1]], [b[0], 6.5, b[1]], [a[0], 6.5, a[1]], n, [[0, 0], [len / 1.5, 0], [len / 1.5, 5.9 / 1.2], [0, 5.9 / 1.2]]);
      }
      hip(P, M.copperRoof, [u0 - 0.2, u1 + 0.2, z0 - 0.2, z1], 6.5, 9.2, 2.6);
    }
    // ---- a plain bronze-grey plate for the 1924 flood mark is reserved on the wall (west block, lz 0)
    const labels = ctx.services.labels, w = MF.W(14.6, 0.04);
    if (!labels || labels.reserve('r4743691', w.x, 2.3, w.z, 0.4, 0.3, MF.V[0], MF.V[1], 'plate')) P.quad(M.stone, [14.4, 2.15, 0.05], [14.8, 2.15, 0.05], [14.8, 2.45, 0.05], [14.4, 2.45, 0.05], [0, 0, 1]);
  } finally { P.pop(); }
  addPolyColliders(ctx, full, 0, 16, 0.9);
  // the yard wall as a fence box (pedestrians keep out)
  const a = MF.W(46, -0.2), b = MF.W(79.5, -0.2);
  kBays(K, { name: 'lmsevka-yard-wall', bays: splitBays(a.x, a.z, b.x, b.z, 3.0, { y: 0 }), far: 300,
    parts: [{ geo: unitBox(0, 2.7, -0.2, 0.2, { uLen: 3, uvs: 3 }), mat: M.wallYellow, name: 'wall', stretch: true }],
    collider: { y0: 0, y1: 2.9, thick: 0.6, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 1300, h: 2.7, anchored: 28, hitK: 0.5, metal: false, minDv: 0 }) });
  svc.fences.push({ id: 'brusnitsyn-yard-wall', a, b, h: 2.7 });
  const c = MF.W(40, -9);
  svc.monuments.push({ id: 'r4743691', name: 'Особняк Брусницыных', x: c.x, z: c.z, h: MH });
}

// ------------------------------------------------------------------------------------------------ the pink house 27/1
function pinkHouse(K) {
  const { ctx, P, M } = K;
  const poly = polysOf('r4743693')[0]; if (!poly) throw new Error('r4743693 missing');
  const edges = ringEdges(poly), HC = 14.5;
  const isFront = (e) => { const m = MF.M((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2); return e.len > 100 && Math.abs(m.v) < 3; };
  edges.forEach((e) => {
    if (isFront(e)) {
      const win = (y0) => ({ y0, w: 1.3, h: 2.0, sill: y0 === 0 ? 1.1 : 1.2, glass: M.sashPink });
      bayWall(P, e, { y0: 0, y1: HC, tu: 4, tv: 4, base: M.plasterRose, baseTop: 4.4, wall: M.plasterPink, reveal: M.plasterPink, depth: 0.22, pitch: 3.3, margin: 1.4, floors: [win(0), win(4.4), win(9.0)] });
    } else if (e.len < 3.5) {
      onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: 10.5, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.7, wall: M.brickRed }));
    } else {
      bayWall(P, e, { y0: 0, y1: 10.5, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.7, wall: M.brickRed, pitch: 3.4, margin: 1.4, floors: [{ y0: 0, w: 1.2, h: 2.0, sill: 1.0, glass: M.sashBrick }, { y0: 3.6, w: 1.2, h: 2.0, sill: 1.0, glass: M.sashBrick }, { y0: 7.0, w: 1.2, h: 2.0, sill: 1.0, glass: M.sashBrick }] });
    }
  });
  roofCap(P, M.darkRoof, poly, HC, 4);
  band(P, edges, HC - 0.7, HC, 0.3, { front: M.trimCream, top: M.trimCream, under: M.trimCream });
  P.push(MF.x, 0, MF.z, MF.rot);
  try {
    // three porticoes (two Tuscan columns, an entablature and a triangular pediment) and the big blind arch over the first one
    for (const u of [-50, -36, -22]) {
      for (const dx of [-1.15, 1.15]) P.cyl(M.column, [u + dx, 0.1, 1.4], [u + dx, 3.4, 1.4], 0.36, 0.34, 10, false);
      for (const dx of [-1.15, 1.15]) { P.box(M.column, u + dx - 0.5, u + dx + 0.5, 0.0, 0.14, 1.0, 1.8, 'b', 1); P.box(M.column, u + dx - 0.45, u + dx + 0.45, 3.4, 3.55, 1.0, 1.8, 'b', 1); }
      P.box(M.trimCream, u - 2.0, u + 2.0, 3.55, 4.0, 0.0, 1.9, 'b', 1);
      const sh = new THREE.Shape(); sh.moveTo(u - 2.1, 4.0); sh.lineTo(u + 2.1, 4.0); sh.lineTo(u, 4.9); sh.lineTo(u - 2.1, 4.0);
      P.extrude(M.trimCream, sh, 0.0, 1.9, 2, 4);
      P.quad(M.darkRoof, [u - 0.65, 0.05, 0.03], [u + 0.65, 0.05, 0.03], [u + 0.65, 2.7, 0.03], [u - 0.65, 2.7, 0.03], [0, 0, 1]);
    }
    {   // the blind arch ring (outer r 2.9, inner r 2.6) on the wall above the first portico, with an arched window inside
      const cx = -50, ys = 8.4, sh = new THREE.Shape();
      sh.moveTo(cx - 2.9, 5.4); sh.lineTo(cx - 2.9, ys); sh.absarc(cx, ys, 2.9, Math.PI, 0, true); sh.lineTo(cx + 2.9, 5.4); sh.lineTo(cx + 2.6, 5.4); sh.lineTo(cx + 2.6, ys);
      sh.absarc(cx, ys, 2.6, 0, Math.PI, false); sh.lineTo(cx - 2.6, 5.4); sh.lineTo(cx - 2.9, 5.4);
      P.extrude(M.trimCream, sh, 0.0, 0.14, 2, 12);
      P.quad(M.sashPink, [cx - 1.0, 5.6, 0.12], [cx + 1.0, 5.6, 0.12], [cx + 1.0, 9.0, 0.12], [cx - 1.0, 9.0, 0.12], [0, 0, 1], [[0, 0], [1, 0], [1, 1.2], [0, 1.2]]);
    }
  } finally { P.pop(); }
  addPolyColliders(ctx, poly, 0, HC + 1, 0.9);
  for (const u of [-50, -36, -22]) { const w = MF.W(u, 1.4); for (const dx of [-1.15, 1.15]) { const q = MF.W(u + dx, 1.4); ctx.physics.addCylinder(q.x, q.z, 0.4, 0, 3.6); } void w; }
  const c = MF.W(-60, -7);
  K.svc.monuments.push({ id: 'r4743693', name: 'Дом с колоннами, Кожевенная линия 27/1', x: c.x, z: c.z, h: HC });
}

// ------------------------------------------------------------------------------------------------ the leather factory 28-30
function factory(K) {
  const { ctx, P, M } = K;
  const poly = polysOf('r8702898')[0]; if (!poly) throw new Error('r8702898 missing');
  const edges = ringEdges(poly), HC = 20.5;
  const mats = { front: M.brickDark, top: M.brickCap, under: M.brickDark };
  edges.forEach((e) => {
    if (e.len < 3.5) { onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: HC, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.9, wall: M.brickRed })); return; }
    const m = MF.M((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2), nl = [e.n[0] * MF.U[0] + e.n[1] * MF.U[1], e.n[0] * MF.V[0] + e.n[1] * MF.V[1]];
    const street = nl[1] < -0.7 && m.v < 20;                                             // the 204 m front along the street
    const f = [{ y0: 0, w: 1.2, h: 1.7, sill: 1.1, glass: M.sashBrick }, { y0: 4.6, w: 1.3, h: 2.4, sill: 1.0, glass: M.sashBrick }, { y0: 9.2, w: 1.3, h: 2.4, sill: 1.0, glass: M.sashBrick }, { y0: 13.8, w: 1.3, h: 2.4, sill: 1.0, glass: M.sashBrick }, { y0: 18.4, w: 1.0, h: 1.1, sill: 0.4, glass: M.sashBrick }];
    bayWall(P, e, { y0: 0, y1: HC, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.9, wall: M.brickRed, reveal: street ? M.brickDark : undefined, depth: street ? 0.22 : 0, pitch: 3.3, margin: 1.4, floors: f });
  });
  for (const [a, b, d] of [[4.1, 4.4, 0.1], [8.7, 9.0, 0.1], [13.3, 13.6, 0.1], [17.8, 18.1, 0.12]]) band(P, edges, a, b, d, mats);
  band(P, edges, 19.5, 19.85, 0.18, mats); band(P, edges, 19.85, 20.2, 0.3, mats); band(P, edges, 20.2, 20.5, 0.45, mats);
  roofCap(P, M.darkRoof, poly, HC, 5);
  band(P, edges, HC, HC + 0.45, 0.0, { front: M.darkRoof, top: M.darkRoof, under: M.darkRoof });
  // the red-brick tower with a round concrete cap (6 x 6 m shaft 5 m above the roof) on the west wing
  {
    const t = MF.W(-31, 90), rot = MF.rot;
    P.push(t.x, 0, t.z, rot);
    P.box(M.brickRed, -3, 3, HC, HC + 5.2, -3, 3, 'b', 2);
    for (const [sx, sz, n] of [[0, 3.01, [0, 0, 1]], [3.01, 0, [1, 0, 0]]]) {
      const q = (x0, x1) => (sx ? [[sx, HC + 2.0, x0], [sx, HC + 2.0, x1], [sx, HC + 4.0, x1], [sx, HC + 4.0, x0]] : [[x0, HC + 2.0, sz], [x1, HC + 2.0, sz], [x1, HC + 4.0, sz], [x0, HC + 4.0, sz]]);
      for (const [x0, x1] of [[-1.7, -0.6], [0.6, 1.7]]) { const pts = q(x0, x1); P.quad(M.sashBrick, pts[0], pts[1], pts[2], pts[3], n); }
    }
    P.cyl(M.granite, [0, HC + 5.2, 0], [0, HC + 5.5, 0], 3.6, 3.6, 16, true);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P.cyl(M.ironBlack, [Math.cos(a) * 3.4, HC + 5.5, Math.sin(a) * 3.4], [Math.cos(a) * 3.4, HC + 6.4, Math.sin(a) * 3.4], 0.03, 0.03, 4, false); }
    P.cyl(M.ironBlack, [0, HC + 6.4, 0], [0, HC + 6.45, 0], 3.4, 3.4, 16, false);
    P.pop();
  }
  {   // the round hanging sign «БРУСНИЦЫН» of the arts centre on a bracket at the street wall (frame M u -23, lz 15.1, 3.3 m up); reserved in the label registry first
    const labels = ctx.services.labels, w = MF.W(-23.0, 15.0), uu = -23.0, yc = 3.3, zc = 14.1;
    if (!labels || labels.reserve('r8702898', w.x, yc, w.z, 0.9, 0.9, -MF.V[0], -MF.V[1], 'sign')) {
      P.push(MF.x, 0, MF.z, MF.rot);
      P.cyl(M.ironBlack, [uu, yc + 0.1, 15.05], [uu, yc + 0.1, zc + 0.45], 0.03, 0.03, 5, false);
      for (const [s, n] of [[1, [1, 0, 0]], [-1, [-1, 0, 0]]]) { const pts = []; for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; pts.push([uu + s * 0.03, yc + Math.sin(t) * 0.45, zc + Math.cos(t) * 0.45]); } P.fan(M.signRound, pts, n, (p) => [s > 0 ? (p[2] - zc) / 0.9 + 0.5 : 0.5 - (p[2] - zc) / 0.9, (p[1] - yc) / 0.9 + 0.5]); }
      P.pop();
    }
  }
  addPolyColliders(ctx, poly, 0, HC + 1, 0.9);
  const c = MF.W(20, 60);
  K.svc.monuments.push({ id: 'r8702898', name: 'Кожевенный завод Брусницыных', x: c.x, z: c.z, h: HC });
}

// ------------------------------------------------------------------------------------------------ the skyway over the street
function skyway(K) {
  const { ctx, P, M } = K;
  const u0 = 9.8, u1 = 14.4, z0 = 0.0, z1 = 15.1, Y0 = 5.0, Y1 = 8.8;
  P.push(MF.x, 0, MF.z, MF.rot);
  try {
    // the timber box: boards on the long sides with two small windows, plain ends, an arched (truss) underside, a shallow rust-sheet roof
    for (const [x, n] of [[u0, [-1, 0, 0]], [u1, [1, 0, 0]]]) {
      P.quad(M.boards, [x, Y0 + 0.4, z0], [x, Y0 + 0.4, z1], [x, Y1, z1], [x, Y1, z0], n, [[0, 0], [15.1 / 2, 0], [15.1 / 2, 3.4 / 1], [0, 3.4 / 1]]);
      for (const zc of [5.2, 8.6]) P.quad(M.darkWin, [x + (x > 8 && x === u1 ? 0.02 : -0.02), Y0 + 1.6, zc - 0.3], [x + (x === u1 ? 0.02 : -0.02), Y0 + 1.6, zc + 0.3], [x + (x === u1 ? 0.02 : -0.02), Y0 + 2.3, zc + 0.3], [x + (x === u1 ? 0.02 : -0.02), Y0 + 2.3, zc - 0.3], n, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    for (const z of [z0, z1]) P.quad(M.boards, [u0, Y0 + 0.4, z], [u1, Y0 + 0.4, z], [u1, Y1, z], [u0, Y1, z], [0, 0, z === z1 ? 1 : -1], [[0, 0], [2.3, 0], [2.3, 3.4], [0, 3.4]]);
    // underside: a segmental arch (sagging to Y0 in the middle, 0.4 m higher at the ends) on a dark truss
    const N = 8;
    for (let i = 0; i < N; i++) {
      const t0 = i / N, t1 = (i + 1) / N, y = (t) => Y0 + 0.4 * (1 - Math.sin(Math.PI * t));
      P.quad(M.darkRoof, [u0, y(t0), z0 + (z1 - z0) * t0], [u1, y(t0), z0 + (z1 - z0) * t0], [u1, y(t1), z0 + (z1 - z0) * t1], [u0, y(t1), z0 + (z1 - z0) * t1], [0, -1, 0]);
      if (i % 2 === 0) { const zz = z0 + (z1 - z0) * t0; P.cyl(M.ironBlack, [u0, y(t0), zz], [u1, y(t0) + 0.0, zz], 0.05, 0.05, 4, false); }
    }
    P.box(M.rustRoof, u0 - 0.15, u1 + 0.15, Y1, Y1 + 0.35, z0 - 0.1, z1 + 0.1, 'b', 2);
  } finally { P.pop(); }
  // colliders: the skyway bridges the street (clear 5 m): it touches the mansion block at one end and the factory at the other; no collider on the roadway
  void ctx;
}

// ------------------------------------------------------------------------------------------------ services: photo spots
function services(K) {
  const { svc } = K;
  const spot = (x, z, yaw, pitch, name) => { if (!L.insideBuilding(x, z, 0.6)) svc.photoSpots.push({ x, z, yaw, pitch, name }); };
  spot(-5623, 1106, -68, 14, 'Особняк Брусницыных: аванкорпус с фронтоном');
  spot(-5647, 1096, -14.5, 14, 'Кожевенная линия: переход между домами');
  svc.crowd.push({ id: 'brusnitsyn-lane', kind: 'street', x: MF.W(-30, 8).x, z: MF.W(-30, 8).z, r: 14, n: 4 });
}
