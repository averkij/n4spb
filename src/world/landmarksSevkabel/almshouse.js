// landmarksSevkabel/almshouse.js - the BRUSNITSYN ALMSHOUSE (Дом призрения Брусницыных; P. Suzor 1895-96, today the Makarov maritime university; Kosaya line 15A; OSM w61411170; docs/research/sevkabel.md section 5.4; photos 101 102 103 137-142).
// A U-shaped red-brick house (frame A: +x NNE along Kosaya line, +z ESE = the front): the main block 3 storeys (eaves 16 m), the two side wings 4 storeys (19 m), windows with white archivolts, white string courses, steep light-grey
// zinc roofs; the central entrance projection (lx 30.5 .. 44, 5.5 m proud) with a crow-stepped gable with pinnacles to 24 m and the porch (lx 34.3 .. 39.7, 10.6 m proud) with a steep tent roof, two arched wooden doors and an arched
// window; two black ship anchors on granite plinths beside the entrance (OSM historic=anchor nodes); a black cast-iron lattice FENCE with granite piers and globe lamps along the front and the two returns; the front garden.
// Closed university territory: exterior only and solid.  The wing w136790139 stays generic.
import * as L from '../layout.js';
import { A as AF } from './frame.js';
import { polysOf, roofCap } from './common.js';
import { ringEdges, onEdge, band } from './kit.js';
import { windowWall, bayWall, cornice } from './facade.js';
import { addPolyColliders } from '../lib/massing.js';
import { inflate, pairs } from './surfaces.js';
import { splitBays, unitPanel } from '../lib/fence-bays.js';      // n4spb (docs/AREAS.md 13.7, 15.v): the lattice fence is a row of breakable bays (the granite piers stay static)
import { kBays } from './inst.js';

const HM = 16, HW = 19;

export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics;
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksSevkabel] almshouse/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const poly = polysOf('w61411170')[0]; if (!poly) throw new Error('w61411170 missing');
  const edges = ringEdges(poly);
  const white = { front: M.whiteStone, top: M.whiteStone, under: M.whiteStone };
  const wingEdge = (e) => { const m = AF.M((e.a[0] + e.b[0]) / 2, (e.a[1] + e.b[1]) / 2); return m.u < 5.3 || m.u > 71.2; };
  stage('walls', () => {
    edges.forEach((e) => {
      const wing = wingEdge(e), H = wing ? HW : HM;
      if (e.len < 3.5) { onEdge(P, e, (len) => windowWall(P, { x0: 0, x1: len, y0: 0, y1: H, tu: 2, tv: 2, base: M.granite, baseTop: 1.0, wall: M.brickRed })); return; }
      const f = wing ? [0, 4.75, 9.5, 14.25].map((y0) => ({ y0, w: 1.2, h: 2.3, sill: 1.1, glass: M.sashAlms })) : [0, 5.3, 10.6].map((y0) => ({ y0, w: 1.3, h: 2.6, sill: 1.2, glass: M.sashAlms }));
      bayWall(P, e, { y0: 0, y1: H, tu: 2, tv: 2, base: M.granite, baseTop: 1.0, wall: M.brickRed, reveal: M.whiteStone, depth: 0.22, pitch: 3.4, margin: 1.5, floors: f });
    });
    // white string courses (between the storeys) and the corbelled cornice
    band(P, edges, 4.5, 4.75, 0.08, white, { draw: (e) => wingEdge(e) }); band(P, edges, 9.3, 9.55, 0.08, white, { draw: (e) => wingEdge(e) });
    band(P, edges, 5.0, 5.25, 0.08, white, { draw: (e) => !wingEdge(e) }); band(P, edges, 10.3, 10.55, 0.08, white, { draw: (e) => !wingEdge(e) });
    const cr = { front: M.brickDark, top: M.zincGrey, under: M.brickDark };
    band(P, edges, 15.1, 15.4, 0.15, cr, { draw: (e) => !wingEdge(e) }); band(P, edges, 15.4, 15.7, 0.28, cr, { draw: (e) => !wingEdge(e) }); band(P, edges, 15.7, 16.0, 0.4, cr, { draw: (e) => !wingEdge(e) });
    band(P, edges, 18.1, 18.4, 0.15, cr, { draw: (e) => wingEdge(e) }); band(P, edges, 18.4, 18.7, 0.28, cr, { draw: (e) => wingEdge(e) }); band(P, edges, 18.7, 19.0, 0.4, cr, { draw: (e) => wingEdge(e) });
  });
  stage('roofs', () => {
    roofCap(P, M.zincGrey, poly, HM, 4);                       // world metres: before the frame is pushed
    P.push(AF.x, 0, AF.z, AF.rot);
    try {
      const steep = (r, y0, y1, ins) => {
        const [u0, u1, z0, z1] = r, a = [u0, z0], b = [u1, z0], c = [u1, z1], d = [u0, z1];
        const i = (p, sx, sz) => [p[0] + sx * ins, p[1] + sz * ins], A = i(a, 1, 1), B = i(b, -1, 1), C = i(c, -1, -1), D = i(d, 1, -1);
        const sl = (p, q, pi, qi, n) => P.quad(M.zincGrey, [p[0], y0, p[1]], [q[0], y0, q[1]], [qi[0], y1, qi[1]], [pi[0], y1, pi[1]], n, [[p[0] / 3, p[1] / 3], [q[0] / 3, q[1] / 3], [qi[0] / 3, y1 / 3], [pi[0] / 3, y1 / 3]]);
        sl(a, b, A, B, [0, 0.8, -1]); sl(b, c, B, C, [1, 0.8, 0]); sl(c, d, C, D, [0, 0.8, 1]); sl(d, a, D, A, [-1, 0.8, 0]);
        P.cap(M.zincGrey, [A, B, C, D], y1, true, 3);
      };
      steep([5.0, 76.0, -24.9, 0.9], HM + 0.1, HM + 4.6, 7.0);       // the main block
      steep([-12.8, 5.2, -46.8, -13.0], HW + 0.1, HW + 4.5, 3.8);    // the west wing
      steep([71.3, 88.8, -46.8, -12.3], HW + 0.1, HW + 4.5, 3.8);    // the east wing
      // the crow-stepped gable of the central projection (to 24 m), pinnacles, and the tent roof of the porch
      const steps = [[13.5, 16.0, 17.6], [11.0, 17.6, 19.2], [8.5, 19.2, 20.8], [6.0, 20.8, 22.4], [3.5, 22.4, 24.0]];
      for (const [w, y0, y1] of steps) P.box(M.brickRed, 37.25 - w / 2, 37.25 + w / 2, y0, y1, 4.3, 5.5, 'b', 2);
      for (const x of [30.5, 44.0]) P.box(M.whiteStone, x - 0.3, x + 0.3, 16.0, 18.4, 4.3, 5.7, 'b', 1);
      P.box(M.whiteStone, 37.25 - 0.3, 37.25 + 0.3, 24.0, 25.0, 4.5, 5.3, 'b', 1);
      // the porch: tent roof over 5.4 x 5.4 m, two arched wooden doors and an arched window above
      const pw = [34.3, 39.7], zf = 10.62;
      // a plain pyramid on the porch: four triangles to an apex at 11.2 m
      for (const [p, q] of [[[34.2, 5.4], [39.8, 5.4]], [[39.8, 5.4], [39.8, 10.7]], [[39.8, 10.7], [34.2, 10.7]], [[34.2, 10.7], [34.2, 5.4]]]) {
        const mx = (p[0] + q[0]) / 2 - 37.0, mz = (p[1] + q[1]) / 2 - 8.05, l = Math.hypot(mx, mz);
        P.fan(M.zincGrey, [[p[0], 7.0, p[1]], [q[0], 7.0, q[1]], [37.0, 11.2, 8.05]], [mx / l * 0.7, 0.7, mz / l * 0.7]);
      }
      P.box(M.brickRed, 34.3, 39.7, 0, 7.0, 5.5, 10.6, 'b', 2);
      for (const x of [35.6, 38.4]) P.quad(M.sashAlms, [x - 0.65, 0.05, zf], [x + 0.65, 0.05, zf], [x + 0.65, 3.4, zf], [x - 0.65, 3.4, zf], [0, 0, 1]);
      P.quad(M.sashAlms, [36.2, 4.4, zf], [37.8, 4.4, zf], [37.8, 6.6, zf], [36.2, 6.6, zf], [0, 0, 1]);
      P.box(M.whiteStone, 34.3, 39.7, 3.5, 3.8, 5.5, 10.9, 'b', 1);
      // two black ship anchors on granite plinths beside the entrance (the OSM historic=anchor nodes at frame A (30.2, 7.8) and (43.6, 8.3))
      for (const [ax, az] of [[30.2, 7.8], [43.6, 8.3]]) {
        P.box(M.granite, ax - 0.55, ax + 0.55, 0, 0.55, az - 0.55, az + 0.55, 'b', 1);
        P.cyl(M.ironBlack, [ax, 0.55, az], [ax, 2.4, az], 0.07, 0.06, 6, false);                         // the shank
        P.cyl(M.ironBlack, [ax - 0.6, 2.2, az], [ax + 0.6, 2.2, az], 0.05, 0.05, 6, false);               // the stock
        P.cyl(M.ironBlack, [ax, 2.4, az], [ax, 2.7, az], 0.12, 0.12, 8, true);                            // the ring boss
        P.cyl(M.ironBlack, [ax, 0.75, az], [ax - 0.65, 1.25, az], 0.06, 0.05, 6, false); P.cyl(M.ironBlack, [ax, 0.75, az], [ax + 0.65, 1.25, az], 0.06, 0.05, 6, false);   // the arms
        P.box(M.ironBlack, ax - 0.8, ax - 0.5, 1.2, 1.4, az - 0.12, az + 0.12, 'b', 1); P.box(M.ironBlack, ax + 0.5, ax + 0.8, 1.2, 1.4, az - 0.12, az + 0.12, 'b', 1);        // the flukes
      }
      // the lattice fence along the front (z = 15) and two returns (x = -14.5), granite piers every 6 m, six globe lamps
      const run = (a, b) => {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 3)), dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
        P.push(a[0], 0, a[1], Math.atan2(-dz, dx));
        void n;      // (the lattice panels are the breakable bays of the colliders stage below)
        for (let x = 0; x <= len + 0.1; x += 6) { P.box(M.granite, x - 0.25, x + 0.25, 0, 2.2, -0.25, 0.25, 'b', 1); P.box(M.granite, x - 0.33, x + 0.33, 2.2, 2.35, -0.33, 0.33, 'b', 1); }
        P.pop();
      };
      run([-14.5, -13.0], [-14.5, 15.0]); run([-14.5, 15.0], [90.0, 15.0]);
      for (const x of [-14.5, 12, 30.5, 44, 62, 90]) { const z = x === -14.5 ? 15 : 15; P.cyl(M.ironBlack, [x, 2.35, z], [x, 4.4, z], 0.07, 0.07, 6, false); P.cyl(M.globe, [x, 4.4, z], [x, 4.95, z], 0.28, 0.28, 8, true); svc.lamps.push({ x: AF.W(x, z).x, z: AF.W(x, z).z, h: 5.0 }); }
    } finally { P.pop(); }
  });
  stage('colliders', () => {
    addPolyColliders(ctx, poly, 0, HW + 1, 0.9);
    const fenceBays = [];
    const fence = (a, b) => { const A = AF.W(a[0], a[1]), B = AF.W(b[0], b[1]); fenceBays.push(...splitBays(A.x, A.z, B.x, B.z, 3, { y: 0 })); svc.fences.push({ id: 'almshouse-fence', a: A, b: B, h: 1.8 }); };
    fence([-14.5, -13.0], [-14.5, 15.0]); fence([-14.5, 15.0], [90.0, 15.0]);
    kBays(K, { name: 'lmsevka-almshouse-fence', bays: fenceBays, far: 300,
      parts: [{ geo: unitPanel(0.1, 1.9, { u1: 1 }), mat: M.fence, name: 'panel', stretch: true, shadow: false, receive: false, noOutline: true }],
      collider: { y0: 0, y1: 2.0, thick: 0.3, e0: 0, e1: 0 }, rec: () => ({ kind: 'fence', mass: 400, h: 2.0, anchored: 22, hitK: 0.5, metal: true, minDv: 0 }) });
    for (const [ax, az] of [[30.2, 7.8], [43.6, 8.3]]) { const w = AF.W(ax, az); ph.addCylinder(w.x, w.z, 0.6, 0, 2.7); }
    const c = AF.W(38, -12);
    svc.monuments.push({ id: 'w61411170', name: 'Дом призрения Брусницыных (Морская академия)', x: c.x, z: c.z, h: 24 });
    { const p = AF.W(37.0, 16.7), t = AF.W(37.0, 4); if (!L.insideBuilding(p.x, p.z, 0.6)) svc.photoSpots.push({ x: p.x, z: p.z, yaw: L.yawToward(p.x, p.z, t.x, t.z), pitch: 10, name: 'Дом призрения Брусницыных: вход с якорями' }); }
  });
  void inflate; void pairs; void cornice;
  if (errs.length) throw new Error(errs.join('\n'));
}
