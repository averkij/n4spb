// landmarksSevkabel/yard.js - the inner yard of Sevkabel Port (docs/research/sevkabel.md sections 4.2-4.7; photos 002 005 018 019 021 025 027 036 039 042 044 045 048 049 050).
//   * 40D (OSM r8702907): the 19th-century red-brick plant: the management building (WEST block: 3 storeys, cornice 12.5 m, segmental-arched windows on a 3 m pitch, corbelled friezes) and the boiler / engine shop
//     (EAST block: one tall storey, eaves 8.5 m, a glazed lantern along the ridge with the dates band «1879 1942 1949 1979», a stepped corbel gable and a 5 x 5 m portal framed in Corten plate at the end facing the inner square).
//     The baked outline is split at the party wall X (frame H (-57.3, -48.1) .. P1); the party wall is not drawn.
//   * the 42 m round brick CHIMNEY of the boiler house (w559797551): hoops every 3 m, a corbelled crown, taper 3.8 -> 2.0 m.
//   * 40E (r8702906): 4 storeys of red brick, cornice 16.5 m, 21 bays of tall steel windows (dark green frames), restaurant glazing on the ground floor, a 21 m stair tower and stepped end gables.
//   * 40A (r8702909): the 1970s block: a 2-storey podium (limestone piers + big glazing, white band) with a 7-floor prism of precast panels (rib at every bay edge poking above the parapet) and a glass pyramid skylight.
//   * the "Tesla coil" (the 1949 cascade generator: four copper cylinders with grey-green rings under one rounded cap, silent, static), the gate of FOUR rotating Corten pylons on Kozhevennaya line, eight timber spool towers,
//     the upturned larch boat «Лодка».
//   Every wall closes on the OSM outline; colliders: thin walls on every outline, the chimney, the generator, the plates, the spool towers, the boat.
import * as THREE from 'three';
import * as L from '../layout.js';
import { H, BOILER_CHIMNEY } from './frame.js';
import { polysOf, ringFromFlat, roofCap } from './common.js';
import { addPolyColliders } from '../lib/massing.js';
import { ringEdges, onEdge, band } from './kit.js';
import { windowWall, bayWall } from './facade.js';
import { SPOOL_TOWERS, diningOpenings, diningSkips } from './public-life-plan.js';

/** a footprint {o, h} in world metres from frame-H points [lx, lz] */
const polyH = (pts) => ({ o: pts.flatMap(([a, b]) => { const w = H.W(a, b); return [w.x, w.z]; }), h: [] });
const edgeLen = (e) => e.len;

export function build(K) {
  const { ctx, P, M, svc } = K;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSevkabel] yard/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('40D', () => block40D(K));
  stage('chimney', () => chimney42(K));
  stage('40E', () => block40E(K));
  stage('40A', () => block40A(K));
  stage('tesla', () => tesla(K));
  stage('gate', () => gate(K));
  stage('props', () => props(K));
  stage('colliders', () => colliders(K));
  void ctx; void P; void M; void svc; void L; void THREE;
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ 40D
/** baked outline vertices of r8702907 in frame H (checked against the data): P0..P13 */
const D40 = [[-56.9, -93.1], [-57.8, -86.9], [-23.7, -79.5], [-30.8, -44.9], [-39.8, -47.0], [-40.5, -44.4], [-64.6, -49.7], [-65.1, -47.5], [-83.4, -51.6], [-82.2, -57.1], [-106.4, -62.9], [-96.7, -96.4], [-75.5, -91.2], [-74.2, -96.8]];
const XPW = [-57.3, -48.1];        // the party wall between the two blocks meets the south face here
function block40D(K) {
  const { P, M } = K;
  const E = [D40[1], D40[2], D40[3], D40[4], D40[5], XPW];
  const W = [XPW, D40[6], D40[7], D40[8], D40[9], D40[10], D40[11], D40[12], D40[13], D40[0], D40[1]];
  // ---- west block: the management building (3 storeys, cornice 12.5 m)
  {
    const poly = polyH(W), edges = ringEdges(poly), skip = edges.length - 1;      // the last edge (P1 -> X) is the party wall
    const tops = [12.5];
    edges.forEach((e) => {
      if (e.i === skip) return;
      if (e.len < 3.5) { onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: 12.5, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.7, wall: M.brickRed })); return; }
      const ops = diningOpenings('r8702907', e, M);
      const fl = (y0) => ({ y0, w: 1.2, h: 2.0, sill: y0 === 0 ? 1.0 : 1.1, glass: M.sashBrick, skip: y0 === 0 ? diningSkips(ops, e.len, 3, 1.5, 1.2) : undefined });
      bayWall(P, e, { y0: 0, y1: 12.5, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.7, wall: M.brickRed, reveal: M.brickDark, pitch: 3.0, margin: 1.5, floors: [fl(0), fl(4.2), fl(8.3)], extra: ops });
    });
    const draw = (e) => e.i !== skip;
    const mats = { front: M.brickDark, top: M.brickCap, under: M.brickDark };
    // friezes under the upper window rows, a corbelled cornice at 12.5 m
    band(P, edges, 3.5, 3.85, 0.1, mats, { draw });
    band(P, edges, 7.65, 8.0, 0.1, mats, { draw });
    band(P, edges, 11.5, 11.8, 0.18, mats, { draw }); band(P, edges, 11.8, 12.1, 0.3, mats, { draw }); band(P, edges, 12.1, 12.5, 0.45, mats, { draw });
    roofCap(P, M.zinc, poly, 12.5, 4);
    band(P, edges, 12.5, 12.95, 0.0, { front: M.zinc, top: M.zinc, under: M.zinc }, { draw });
    void tops;
  }
  // ---- east block: the boiler / engine shop (eaves 8.5 m, lantern to 12.5 m, gable + portal on the SW end)
  {
    const poly = polyH(E), edges = ringEdges(poly), skip = edges.length - 1;
    edges.forEach((e) => {
      if (e.i === skip) return;
      if (e.len < 3.5) { onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: 8.5, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.7, wall: M.brickRed })); return; }
      const fl = { y0: 0, w: 1.6, h: 4.0, sill: 1.3, glass: M.sashBrick };
      bayWall(P, e, { y0: 0, y1: 8.5, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 0.7, wall: M.brickRed, reveal: M.brickDark, pitch: 4.0, margin: 1.8, floors: [fl], extra: e.i === 2 ? [] : [] });
    });
    const draw = (e) => e.i !== skip;
    const mats = { front: M.brickDark, top: M.brickCap, under: M.brickDark };
    band(P, edges, 7.6, 7.9, 0.15, mats, { draw }); band(P, edges, 7.9, 8.2, 0.28, mats, { draw }); band(P, edges, 8.2, 8.5, 0.4, mats, { draw });
    roofCap(P, M.zinc, poly, 8.5, 4);
    band(P, edges, 8.5, 8.9, 0.0, { front: M.zinc, top: M.zinc, under: M.zinc }, { draw });
    // the lantern along the ridge: centre of the block, axis = the east face (P2 -> P3)
    const ring = ringFromFlat(poly.o); let cx = 0, cz = 0; for (const p of ring) { cx += p[0]; cz += p[1]; } cx /= ring.length; cz /= ring.length;
    const ax = D40[3][0] - D40[2][0], az = D40[3][1] - D40[2][1], al = Math.hypot(ax, az);
    const wc = { x: cx, z: cz }, rot = Math.atan2(-az * 1.0, ax * 1.0);          // cx, cz are already world metres (polyH)
    // frame H is rotated: the lantern is drawn in the H frame (the Parts stack is empty here), so push it with the world rotation
    P.push(wc.x, 0, wc.z, H.rot + rot);
    const len = 24, wid = 3.2;
    P.box(M.brickDark, -len / 2, len / 2, 8.5, 9.0, -wid / 2 - 0.3, wid / 2 + 0.3, 'b', 2);
    P.box(M.darkWin, -len / 2, len / 2, 9.0, 12.2, -wid / 2, wid / 2, 'bt', 2);
    P.quad(M.dates, [-len / 2 + 8, 10.5, wid / 2 + 0.01], [len / 2 - 8, 10.5, wid / 2 + 0.01], [len / 2 - 8, 11.5, wid / 2 + 0.01], [-len / 2 + 8, 11.5, wid / 2 + 0.01], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.quad(M.dates, [len / 2 - 8, 10.5, -wid / 2 - 0.01], [-len / 2 + 8, 10.5, -wid / 2 - 0.01], [-len / 2 + 8, 11.5, -wid / 2 - 0.01], [len / 2 - 8, 11.5, -wid / 2 - 0.01], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    P.box(M.zinc, -len / 2 - 0.2, len / 2 + 0.2, 12.2, 12.5, -wid / 2 - 0.3, wid / 2 + 0.3, 'b', 2);
    P.pop();
    void al;
    // the long EAST face (P2 -> P3, towards the gate lane): a crow-stepped corbel gable of five steps (8.5 -> 12.5 m) with brick pinnacles (photo 048)
    const ee = edges.find((q) => q.i === 1);
    if (ee) onEdge(P, ee, (len) => {
      const cxm = len / 2, st = [[len - 0.6, 8.5, 9.3], [len - 6.5, 9.3, 10.1], [len - 13, 10.1, 10.9], [len - 19.5, 10.9, 11.7], [len - 26, 11.7, 12.5]];
      for (const [w, y0, y1] of st) if (w > 1) P.box(M.brickRed, cxm - w / 2, cxm + w / 2, y0, y1, -0.5, 0.06, 'b', 2);
      for (const [x, y] of [[0.4, 8.5], [len - 0.4, 8.5], [cxm - 6.5, 9.3], [cxm + 6.5, 9.3]]) P.box(M.brickDark, x - 0.25, x + 0.25, y, y + 1.3, -0.5, 0.06, 'b', 1);
    });
    // the SW end (P3 -> P4): stepped corbel gable and the Corten portal
    const eg = edges.find((q) => q.i === 2);
    if (eg) onEdge(P, eg, (len) => {
      const cxm = len / 2, steps = [[len, 8.5, 9.5], [len - 1.8, 9.5, 10.5], [len - 3.6, 10.5, 11.5], [len - 5.4, 11.5, 12.5]];
      for (const [w, y0, y1] of steps) P.box(M.brickRed, cxm - w / 2, cxm + w / 2, y0, y1, -0.5, 0.06, 'b', 2);
      for (const dx of [-1, 1]) P.box(M.brickDark, cxm + dx * (len / 2) - 0.25, cxm + dx * (len / 2) + 0.25, 8.5, 9.7, -0.5, 0.06, 'b', 1);
      // the portal: a dark opening 5 x 5 m framed in Corten plate, three rows of round lamps inside (the window bays of this edge stay beside it)
      const px0 = cxm - 2.5, px1 = cxm + 2.5, pz = 0.12;
      P.box(M.cortenEdge, px0 - 0.6, px0, 0, 5.4, 0.0, pz + 0.1, 'b', 1); P.box(M.cortenEdge, px1, px1 + 0.6, 0, 5.4, 0.0, pz + 0.1, 'b', 1); P.box(M.cortenEdge, px0 - 0.6, px1 + 0.6, 5.0, 5.7, 0.0, pz + 0.1, 'b', 1);
      P.quad(M.portalDark, [px0, 0, pz], [px1, 0, pz], [px1, 5.0, pz], [px0, 5.0, pz], [0, 0, 1]);
      for (const y of [3.3, 4.0, 4.7]) for (let i = 0; i < 5; i++) P.cyl(M.lampDisc, [px0 + 0.5 + i * 1.0, y, pz + 0.02], [px0 + 0.5 + i * 1.0, y, pz + 0.06], 0.14, 0.14, 8, true);
    });
  }
}

// ------------------------------------------------------------------------------------------------ the 42 m brick chimney
function chimney42(K) {
  const { P, M, ctx } = K, c = BOILER_CHIMNEY, h = 42, r0 = 1.9, r1 = 1.0;
  const ra = (y) => r0 + (r1 - r0) * y / h;
  P.cyl(M.brickChim, [c.x, 0, c.z], [c.x, h - 2, c.z], r0 + 0.35, ra(0.8) + 0.2, 16, false);
  P.cyl(M.brickChim, [c.x, 0.8, c.z], [c.x, h - 2, c.z], ra(0.8), ra(h - 2), 16, false);
  for (let y = 3; y < h - 2; y += 3) P.cyl(M.hoop, [c.x, y, c.z], [c.x, y + 0.14, c.z], ra(y) + 0.06, ra(y) + 0.06, 16, false);
  // corbelled crown 2 m tall + a darker cap
  P.cyl(M.brickChim, [c.x, h - 2, c.z], [c.x, h - 1.4, c.z], ra(h - 2) + 0.08, ra(h - 2) + 0.35, 16, false);
  P.cyl(M.brickCap, [c.x, h - 1.4, c.z], [c.x, h - 0.5, c.z], ra(h - 2) + 0.35, ra(h - 2) + 0.35, 16, false);
  P.cyl(M.brickCap, [c.x, h - 0.5, c.z], [c.x, h, c.z], ra(h - 2) + 0.35, ra(h) + 0.1, 16, true);
  ctx.physics.addCylinder(c.x, c.z, 2.4, 0, h);
}

// ------------------------------------------------------------------------------------------------ 40E
function block40E(K) {
  const { P, M, ctx } = K;
  const poly = polysOf('r8702906')[0]; if (!poly) return;
  const edges = ringEdges(poly), Hc = 16.5;
  edges.forEach((e) => {
    if (e.len < 18) {                                    // the two short ends: plain brick with two tall windows
      onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: Hc, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 1.0, wall: M.brickRed, reveal: M.brickDark, depth: 0.2,
        ops: [0, 1, 2].flatMap((k) => [len * 0.3, len * 0.7].map((x) => ({ x, w: 1.4, y0: 4.65 + k * 4.1, y1: 7.75 + k * 4.1, glass: M.sashTallGreen }))) }));
      return;
    }
    const ops = diningOpenings('r8702906', e, M);
    const gl = { y0: 0, w: 2.4, h: 3.2, sill: 0.45, glass: M.darkWin, glassUv: [[0, 0], [1.5, 0], [1.5, 2.9], [0, 2.9]], skip: diningSkips(ops, e.len, 3.1, 1.2, 2.4) };
    const up = (y0) => ({ y0, w: 1.4, h: 3.1, sill: 0.45, glass: M.sashTallGreen });
    bayWall(P, e, { y0: 0, y1: Hc, tu: 2, tv: 2, base: M.plinthGrey, baseTop: 1.0, wall: M.brickRed, reveal: M.brickDark, pitch: 3.1, margin: 1.2, floors: [gl, up(4.2), up(8.3), up(12.4)], extra: ops });
  });
  const mats = { front: M.brickDark, top: M.brickCap, under: M.brickDark };
  band(P, edges, 4.05, 4.3, 0.12, mats); band(P, edges, 8.15, 8.4, 0.1, mats); band(P, edges, 12.25, 12.5, 0.1, mats);
  band(P, edges, 15.5, 15.85, 0.18, mats); band(P, edges, 15.85, 16.2, 0.3, mats); band(P, edges, 16.2, 16.5, 0.45, mats);
  roofCap(P, M.zinc, poly, Hc, 4);
  band(P, edges, Hc, Hc + 0.4, 0.0, { front: M.zinc, top: M.zinc, under: M.zinc });
  // the stair tower (4 x 4 m, 21 m, stepped crown) at the SW end beside the SE corner, and stepped parapets on the two ends
  const o = poly.o, A0 = [o[0], o[1]], A1 = [o[2], o[3]], A3 = [o[6], o[7]];
  const ex = [(A1[0] - A0[0]) / Math.hypot(A1[0] - A0[0], A1[1] - A0[1]), (A1[1] - A0[1]) / Math.hypot(A1[0] - A0[0], A1[1] - A0[1])];
  const ey = [(A3[0] - A0[0]) / Math.hypot(A3[0] - A0[0], A3[1] - A0[1]), (A3[1] - A0[1]) / Math.hypot(A3[0] - A0[0], A3[1] - A0[1])];
  const wp = (a, b) => [A0[0] + ex[0] * a + ey[0] * b, A0[1] + ex[1] * a + ey[1] * b];
  const rotE = Math.atan2(-ex[1], ex[0]);
  const tc = wp(-0.4, 13.8);
  P.push(tc[0], 0, tc[1], rotE);
  P.box(M.brickRed, -2.0, 2.0, 0, 21.0, -2.0, 2.0, 'b', 2);
  P.box(M.brickDark, -2.25, 2.25, 21.0, 21.35, -2.25, 2.25, 'b', 2);
  P.box(M.brickRed, -1.4, 1.4, 21.35, 22.2, -1.4, 1.4, 'b', 2);
  P.box(M.zinc, -1.55, 1.55, 22.2, 22.4, -1.55, 1.55, 'b', 2);
  P.pop();
  ctx.physics.addBox(tc[0], tc[1], 4, 4, rotE, 0, 22.4);
  // stepped parapets on both short ends
  for (const [e0, e1] of [[A0, A3], [[o[4], o[5]], [o[2], o[3]]]]) {
    const dx = e1[0] - e0[0], dz = e1[1] - e0[1], len = Math.hypot(dx, dz), rot = Math.atan2(-dz, dx), nx = dz / len, nz = -dx / len;
    // outward = away from the building centre
    const mx = (e0[0] + e1[0]) / 2, mz = (e0[1] + e1[1]) / 2, cc = wp(32, 8), s = ((mx - cc[0]) * nx + (mz - cc[1]) * nz) > 0 ? 1 : -1;
    void s;
    P.push(e0[0], 0, e0[1], rot);
    const cxm = len / 2;
    for (const [w, y0, y1] of [[len - 1.0, Hc, Hc + 0.9], [len - 3.4, Hc + 0.9, Hc + 1.8], [len - 6.4, Hc + 1.8, Hc + 2.6]]) P.box(M.brickRed, cxm - w / 2, cxm + w / 2, y0, y1, -0.3, 0.3, 'b', 2);
    P.pop();
  }
}

// ------------------------------------------------------------------------------------------------ 40A
function block40A(K) {
  const { P, M, ctx } = K;
  const poly = polysOf('r8702909')[0]; if (!poly) return;
  const edges = ringEdges(poly), YP = 8.5;
  // podium: limestone piers + big dark glazing on the ground floor (4.5 m), a white band with ribbon windows above (4.0 m)
  edges.forEach((e) => {
    const gl = { y0: 0, w: 2.2, h: 3.5, sill: 0.35, glass: M.darkWin, glassUv: [[0, 0], [1.4, 0], [1.4, 3.2], [0, 3.2]] };
    const rb = { y0: 4.5, w: 2.6, h: 1.6, sill: 1.1, glass: M.darkWin, glassUv: [[0, 0], [1.7, 0], [1.7, 1.45], [0, 1.45]] };
    bayWall(P, e, { y0: 0, y1: YP, tu: 3, tv: 3, wall: M.limestone, reveal: M.limestone, pitch: 3.2, margin: 1.2, floors: [gl, rb] });
  });
  // the white band overlay between the storeys
  band(P, edges, 4.2, 4.5, 0.08, { front: M.plaster, top: M.plaster, under: M.plaster });
  band(P, edges, YP - 0.35, YP, 0.25, { front: M.plaster, top: M.plaster, under: M.plaster });
  // the podium roof: everything except the prism footprint is flat roof membrane (the prism stands on it)
  const prismH = [[-4.8, -50.6], [38, -50.6], [38, -73.2], [-4.8, -73.2]];
  const pPoly = polyH(prismH), pEdges = ringEdges(pPoly), YT = YP + 22.4;
  roofCap(P, M.roofMem, poly, YP, 3);
  // the prism: 7 floors of precast panels on a 3.2 m bay, white-framed windows 1.4 x 1.5 m, vertical ribs at every bay edge poking 0.8 m above the parapet
  pEdges.forEach((e) => {
    const fl = (k) => ({ y0: YP + k * 3.2, w: 1.4, h: 1.5, sill: 0.8, glass: M.sashWhitePrism });
    bayWall(P, e, { y0: YP, y1: YT, tu: 3, tv: 3, wall: M.prismPanel, reveal: M.prismPanel, pitch: 3.2, margin: 1.6, floors: [0, 1, 2, 3, 4, 5, 6].map(fl) });
    onEdge(P, e, (len) => {
      const n = Math.max(1, Math.round((len - 3.2) / 3.2)), step = (len - 3.2) / n;
      for (let i = 0; i <= n; i++) { const x = 1.6 + i * step; P.box(M.prismPanel, x - 0.15, x + 0.15, YP, YT + 0.8, 0.0, 0.28, 'bk', 2); }
    });
  });
  roofCap(P, M.roofMem, pPoly, YT, 3);
  // the glass pyramid skylight on the podium (12 x 12 m, 3 m tall, steel ribs) at H (52, -61.9)
  {
    const c = [52, -61.9], s = 6, h = 3, y = YP;
    P.push(H.x, 0, H.z, H.rot);
    const A = [c[0] - s, y, c[1] - s], B = [c[0] + s, y, c[1] - s], C = [c[0] + s, y, c[1] + s], D = [c[0] - s, y, c[1] + s], T = [c[0], y + h, c[1]];
    for (const [a, b] of [[A, B], [B, C], [C, D], [D, A]]) {
      const mx = (a[0] + b[0]) / 2 - c[0], mz = (a[2] + b[2]) / 2 - c[1], l = Math.hypot(mx, mz);
      P.fan(M.pyramidGlass, [a, b, T], [mx / l * h / 6.7, 6 / 6.7, mz / l * h / 6.7]);
      P.cyl(M.steelFrame, a, T, 0.08, 0.08, 4, false);
    }
    P.box(M.steelFrame, c[0] - s - 0.2, c[0] + s + 0.2, y, y + 0.35, c[1] - s - 0.2, c[1] + s + 0.2, 'b', 2);
    P.pop();
  }
}

// ------------------------------------------------------------------------------------------------ the generator ("Tesla coil")
function tesla(K) {
  const { P, M, svc } = K;
  const c = [-93.0, -27.1];       // the dossier puts it at H (-89.7, -26.3) = 1.8 m from the OSM service way w559486264 (asphalt in the data): moved 3.4 m to the NW so that its feet clear the lane (road integrity)
  P.push(H.x, 0, H.z, H.rot);
  // four flanged concrete feet, four copper cylinders (d 1.6 m, 7 m tall, 3 m apart), 11 grey-green rings on each, diagonal insulator rods, one rounded cap on top
  for (const sx of [-1.5, 1.5]) for (const sz of [-1.5, 1.5]) {
    const x = c[0] + sx, z = c[1] + sz;
    P.box(M.conc, x - 1.0, x + 1.0, 0, 0.5, z - 1.0, z + 1.0, 'b', 2);
    P.cyl(M.copper, [x, 0.5, z], [x, 8.8, z], 0.8, 0.8, 12, false);
    for (let k = 0; k < 11; k++) { const y = 1.2 + k * 0.62; P.cyl(M.toroid, [x, y, z], [x, y + 0.32, z], 1.2, 1.2, 12, false); }
  }
  for (const [a, b] of [[[-1.5, -1.5], [1.5, 1.5]], [[1.5, -1.5], [-1.5, 1.5]]]) { P.cyl(M.insulator, [c[0] + a[0], 3.5, c[1] + a[1]], [c[0] + b[0], 7.5, c[1] + b[1]], 0.1, 0.1, 4, false); }
  // the common cap: a pill 6.4 x 3.6 x 1.0 m at 9.2 .. 10.2 m
  P.box(M.teslaCap, c[0] - 1.4, c[0] + 1.4, 9.2, 10.2, c[1] - 1.8, c[1] + 1.8, 'b', 2);
  for (const sx of [-1, 1]) P.cyl(M.teslaCap, [c[0] + sx * 1.4, 9.2, c[1]], [c[0] + sx * 1.4, 10.2, c[1]], 1.8, 1.8, 12, true);
  P.pop();
  const w = H.W(c[0], c[1]);
  K.ctx.physics.addBox(w.x, w.z, 6, 6, H.rot, 0, 10.3);
  svc.monuments.push({ id: 'sevkabel-generator', name: 'Каскадный генератор 1949 г. («катушка Теслы»)', x: w.x, z: w.z, h: 10.2 });
}

// ------------------------------------------------------------------------------------------------ the Corten gate
function gate(K) {
  const { P, M, ctx, svc } = K;
  const g0 = [-14.2, -75.7], d = [0.958, 0.285], n = [-0.285, 0.958];            // the gate line (40D corner -> 40A corner) and the yard side normal in frame H
  // review 2026-10-09: the yard lane w559480717 ends in this gate (net.cover keeps a 2 m half-width corridor along n through g0, although streets draws no asphalt there once the lane is claimed in groups.js):
  // the strict furniture audit flagged the collider of plate 1 (centre 1.2 m from the lane axis).  The second pylon therefore pivots 3.6 m (not 2.3 m) from the axis: every plate collider centre is >= 2.4 m from it.
  const q0 = g0;
  P.push(H.x, 0, H.z, H.rot);
  const ang = [25, 75, 55, 90];                                                  // opening angles of the four pylons: the two beside the passage turn far enough that no plate enters the 2 m lane corridor
  [-7, -3.6, 2.3, 7].forEach((t, i) => {
    const a = ang[i] * Math.PI / 180, px = q0[0] + d[0] * t, pz = q0[1] + d[1] * t;
    const vx = Math.cos(a) * d[0] + Math.sin(a) * n[0], vz = Math.cos(a) * d[1] + Math.sin(a) * n[1];
    const rot = Math.atan2(-vz, vx);
    P.push(px, 0, pz, rot);
    P.box(M.corten, 0, 3.3, 0, 4.6, -0.06, 0.06, i === 2 ? 'bkf' : 'b', 3.3);
    if (i === 2) {                                                              // the third plate carries a blue-grey textured panel on one face
      P.quad(M.cortenBlue, [0, 0, 0.061], [3.3, 0, 0.061], [3.3, 4.6, 0.061], [0, 4.6, 0.061], [0, 0, 1]);
      P.quad(M.corten, [3.3, 0, -0.061], [0, 0, -0.061], [0, 4.6, -0.061], [3.3, 4.6, -0.061], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    P.cyl(M.steel, [0.0, 0, 0.0], [0.0, 4.75, 0.0], 0.07, 0.07, 6, false);          // the pivot post
    P.pop();
    const cx = px + vx * 1.65, cz = pz + vz * 1.65, w = H.W(cx, cz);
    ctx.physics.addBox(w.x, w.z, 3.3, 0.25, H.rot + rot, 0, 4.7);
    const a0 = H.W(px, pz), a1 = H.W(px + vx * 3.3, pz + vz * 3.3);
    svc.fences.push({ id: 'corten-plate-' + i, a: a0, b: a1, h: 4.6, solid: true });
  });
  P.pop();
  const gp = H.W(g0[0], g0[1]);
  svc.entrances.push({ id: 'n5987479287', name: 'Главные ворота Севкабель Порт', x: gp.x, z: gp.z, rotY: H.rot + Math.PI, open: true });
}

// ------------------------------------------------------------------------------------------------ props: spool towers, the boat
function spool(P, M, x, z) {
  P.cyl(M.steelGrey, [x, 0.08, z], [x, 0.38, z], 1.0, 1.0, 10, true);
  for (const [dx, dz] of [[-0.75, -0.75], [0.75, -0.75], [0.75, 0.75], [-0.75, 0.75]]) P.box(M.black, x + dx - 0.07, x + dx + 0.07, 0, 0.1, z + dz - 0.07, z + dz + 0.07, 'b', 1);
  for (let t = 0; t < 5; t++) {
    const y0 = 0.38 + t * 0.84;
    P.cyl(M.larch, [x, y0, z], [x, y0 + 0.14, z], 0.75, 0.75, 10, true);
    P.cyl(M.larchDark, [x, y0 + 0.14, z], [x, y0 + 0.7, z], 0.3, 0.3, 8, false);
    P.cyl(M.larch, [x, y0 + 0.7, z], [x, y0 + 0.84, z], 0.75, 0.75, 10, true);
    if (t < 2) P.cyl(M.larchDark, [x, y0 + 0.4, z], [x, y0 + 0.46, z], 0.95, 0.95, 10, true);        // disc seats on the lower two drums
  }
  P.cyl(M.steelGrey, [x, 4.5, z], [x, 4.9, z], 0.03, 0.03, 5, false);
  P.cyl(M.lampWarm, [x, 4.6, z], [x, 4.7, z], 0.2, 0.2, 8, true);
}
function props(K) {
  const { P, M, ctx, svc } = K, ph = ctx.physics;
  P.push(H.x, 0, H.z, H.rot);
  const towers = SPOOL_TOWERS; // the relocated second tower leaves the two new serving hatches clear
  for (const [lx, lz] of towers) spool(P, M, lx, lz);
  // the upturned boat «Лодка» (an amphitheatre): a larch hull 9 x 3.2 x 1.6 m with a leaning mast
  {
    const g = new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(4.5, 1.6, 1.6);
    P.geo(M.slats, g, -46, 0, -27); g.dispose();
    P.cyl(M.larchDark, [-46, 1.5, -27], [-45.1, 4.0, -26.6], 0.07, 0.05, 6, false);
    P.box(M.larchDark, -49.5, -42.5, 1.5, 1.6, -27.07, -26.93, 'b', 1);
  }
  P.pop();
  for (const [lx, lz] of towers) { const w = H.W(lx, lz); ph.addCylinder(w.x, w.z, 0.95, 0, 4.9); svc.lamps.push({ x: w.x, z: w.z, h: 4.9 }); }
  { const w = H.W(-46, -27); ph.addBox(w.x, w.z, 9, 3.2, H.rot, 0, 1.6); svc.monuments.push({ id: 'sevkabel-boat', name: 'Инсталляция «Лодка»', x: w.x, z: w.z, h: 4.0 }); }
}

// ------------------------------------------------------------------------------------------------ colliders
function colliders(K) {
  const ctx = K.ctx;
  for (const id of ['r8702907', 'r8702906', 'r8702909']) for (const poly of polysOf(id)) { const ph = ctx.physics; void ph; solidWalls(ctx, poly, id === 'r8702909' ? 31.3 : id === 'r8702906' ? 22.5 : 12.6); }
}
function solidWalls(ctx, poly, h) { addPolyColliders(ctx, poly, 0, h, 0.9); }
