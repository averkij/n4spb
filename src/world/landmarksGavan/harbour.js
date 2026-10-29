// landmarksGavan/harbour.js - the south end of GALERNY HARBOUR (docs/research/gavan.md 7.3, 7.4, 7.7; photos refs/gavan 31 33 34 149 25): the white STEAM CRANE of 1854 on its stone stump (frame R), the pedimented yellow WORKS HOUSE
// w141136973 behind it, and the ROTUNDA of the yacht-club fence at the head of the canal (frame Rt, restored 2021: fresh plaster, verdigris dome, no scaffold).
//   CRANE   stump 6.5 x 6.6 m, top +0.3, rough grey limestone; fence of thin bars on the three land sides; turntable, post, open iron frame with two spoked gear wheels (dia 1.6 / 1.2) and a winch drum, a small dark
//           steam box, a SOLID tapered box-girder jib (6.1 m at 61 deg over the water, ENE), two stay rods, a chain with a hook block.  Whitewashed (#d9dcde).
//   WORKS   45.9 x 15.8 m, one tall storey on a 0.5 m plinth, eaves 6.2 m, ridge 8.2 m, grey-green zinc roof; the long front toward the harbour (east): pilaster bays of 4.6 m with round-headed windows, a central
//           pediment 12 m wide with a semicircular tympanum window.
//   ROTUNDA base wall 8.5 x 4.0 x 2.3 m, a 3.4 m plinth with four round tapering columns, entablature and cornice, a shallow dome (8.8 m in all).
import * as THREE from 'three';
import * as L from '../layout.js';
import { FR, FRT, rectOf, rectFacing } from './frame.js';
import { fenceRun, postInstances, fenceBays } from './fence.js';
import { shapeOf, revolve } from './geo.js';
import { gableRoof, bar } from './prims.js';
import { addPolyColliders } from '../lib/massing.js';

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksGavan] harbour/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  stage('crane', () => crane(Q));
  stage('works', () => works(Q));
  stage('rotunda', () => rotunda(Q));
  if (errs.length) throw new Error(errs.join('\n'));
}

// ------------------------------------------------------------------------------------------------ the steam crane (frame R: local +x toward the water = bearing 70 = the jib azimuth)
function crane(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics, Y0 = 0.3;
  FR.on(P, () => {
    P.box(M.stoneRough, -3.25, 3.25, 0, Y0 - 0.1, -3.3, 3.3, 'tb', 2);                                 // (the cap slab below is the only surface at the top level)
    P.box(M.granite, -3.35, 3.35, Y0 - 0.1, Y0, -3.4, 3.4, 'b', 2);
    P.col(M.craneDark, 0.3, 0.4, Y0 + 0.01, Y0 + 0.2, 1.2, 1.2, 14, false); P.fan(M.craneDark, Array.from({ length: 14 }, (_, i) => [0.3 + Math.sin(i / 14 * Math.PI * 2) * 1.2, Y0 + 0.2, 0.4 + Math.cos(i / 14 * Math.PI * 2) * 1.2]), [0, 1, 0]);   // turntable (top cap only)
    P.col(M.craneWhite, 0.3, 0.4, Y0 + 0.2, 2.3, 0.2, 0.17, 8, false);                                 // post
    for (const [x, z] of [[-0.55, -0.75], [-0.55, 0.95], [1.15, -0.75], [1.15, 0.95]]) P.col(M.craneWhite, x, z, Y0 + 0.21, 2.3, 0.07, 0.07, 6, false);   // the open iron frame
    for (const y of [Y0 + 0.9, 2.3]) for (const z of [-0.75, 0.95]) P.cyl(M.craneWhite, [-0.55, y, z], [1.15, y, z], 0.05, 0.05, 5, false);
    for (const x of [-0.55, 1.15]) for (const y of [Y0 + 0.9, 2.3]) P.cyl(M.craneWhite, [x, y, -0.75], [x, y, 0.95], 0.05, 0.05, 5, false);
    // two spoked gear wheels: rims (torus) and six spokes each, dark hubs
    for (const [r, z, cy] of [[0.8, 1.0, 1.55], [0.6, -0.8, 1.75]]) {
      const tor = new THREE.TorusGeometry(r, 0.06, 5, 20); P.geo(M.gearRim, tor, 0.3, cy, z, 0, 0, 0, 1, 1, 1); tor.dispose();
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; P.cyl(M.gearRim, [0.3, cy, z], [0.3 + Math.cos(a) * r, cy + Math.sin(a) * r, z], 0.03, 0.03, 4, false); }
      P.cyl(M.craneDark, [0.3, cy, z - 0.1], [0.3, cy, z + 0.1], 0.12, 0.12, 8, true);
    }
    P.cyl(M.craneWhite, [0.9, Y0 + 1.0, -0.6], [0.9, Y0 + 1.0, 0.6], 0.3, 0.3, 8, true);              // winch drum
    P.box(M.craneDark, -1.5, -0.4, Y0, Y0 + 1.1, -0.5, 0.5, 'b', 1);                                    // the small steam box
    // the jib: a solid tapered box girder, 6.1 m at 61 deg, foot (0.6, 0.9) -> head
    const ca = Math.cos(61 * Math.PI / 180), sa = Math.sin(61 * Math.PI / 180), foot = [0.6, Y0 + 0.85, 0], head = [0.6 + 6.1 * ca, Y0 + 0.85 + 6.1 * sa, 0];
    P.cyl(M.craneWhite, foot, head, 0.3, 0.16, 4, true);
    P.cyl(M.craneDark, [head[0], head[1] - 0.05, -0.2], [head[0], head[1] - 0.05, 0.2], 0.22, 0.22, 8, true);      // the head sheave
    for (const z of [-0.18, 0.18]) bar(P, M.craneDark, [head[0] - 0.05, head[1] - 0.1, z], [-0.5, 2.3, z * 3.5], 0.025, 4);                       // stay rods
    for (const z of [-0.06, 0.06]) P.cyl(M.craneDark, [head[0] + 0.02, head[1] - 0.2, z], [head[0] + 0.02, head[1] - 3.2, z], 0.018, 0.018, 4, false);  // the chain (two strands)
    P.box(M.craneDark, head[0] - 0.15, head[0] + 0.19, head[1] - 3.55, head[1] - 3.2, -0.12, 0.12, '', 1);
  });
  // the fence on the three land sides (thin bars 1.2 m), open to the water on the +x side (world coordinates: outside the frame push)
  const pts = [[3.2, -3.5], [-3.5, -3.5], [-3.5, 3.5], [3.2, 3.5]].map(([u, v]) => { const p = FR.W(u, v); return [p.x, p.z]; });
  const fr = fenceRun(Q, pts, { h: 1.2, y0: Y0, bars: M.fenceWhite, panel: 2.0, margin: -9 });
  postInstances(Q, 'lmgavan-cranefence', fr.posts, { h: 1.3, y: Y0, mat: M.craneWhite });
  fenceBays(Q, 'lmgavan-cranefence', fr.bays, { h: 1.2, y0: Y0, bars: M.fenceWhite, solidH: 1.5, mass: 120, anchored: 12 });      // n4spb: the panels are breakable bays (the source: solid boxes)
  FR.cyl(ph, 0.4, 0.4, 1.4, 0, 3.2);
  const c = FR.W(0, 0);
  Q.svc.monuments.push({ id: 'w746428306', name: 'Паровой кран 1854 года', x: c.x, z: c.z, h: 7 });
  Q.svc.photoSpots.push({ x: -7064.5, z: -91.2, yaw: -25, pitch: 3, name: 'Паровой кран и Шкиперский проток' });
  Q.svc.crowd.push({ id: 'crane-lawn', kind: 'photo', x: -7064.5, z: -91.2, r: 6, n: 3 });
}

// ------------------------------------------------------------------------------------------------ the pedimented works house
function works(Q) {
  const P = Q.P, M = Q.M, b = L.buildingById('w141136973');
  if (!b || !b.polys || !b.polys[0]) return;
  const poly = b.polys[0], rc = rectFacing(rectOf(poly.o), 1, -0.2), hl = rc.len / 2, hw = rc.wid / 2, E = 6.2;
  P.push(rc.cx, 0, rc.cz, rc.rotY);
  const n = Math.round(rc.len / 4.6), pitch = rc.len / n;
  P.quad(M.worksFacade, [-hl, 0, hw], [hl, 0, hw], [hl, 6.7, hw], [-hl, 6.7, hw], [0, 0, 1], [[0, 0], [n, 0], [n, 1], [0, 1]]);                          // the front
  P.quad(M.worksEnd, [hl, 0, -hw], [-hl, 0, -hw], [-hl, E, -hw], [hl, E, -hw], [0, 0, -1], [[0, 0], [rc.len / 3, 0], [rc.len / 3, 1.5], [0, 1.5]]);        // the rear
  for (const s of [-1, 1]) P.quad(M.worksEnd, [s * hl, 0, s * hw], [s * hl, 0, -s * hw], [s * hl, E, -s * hw], [s * hl, E, s * hw], [s, 0, 0], [[0, 0], [rc.wid / 3, 0], [rc.wid / 3, 1.5], [0, 1.5]]);
  P.box(M.trimCream, -hl - 0.3, hl + 0.3, E - 0.1, E + 0.4, -hw - 0.3, hw + 0.45, 'b', 2);                                                              // the cornice band
  // the central pediment: 12 m wide, 1.8 m high, 0.35 m proud of the front, with its semicircular window
  P.push(0, 0, hw + 0.02, 0); P.extrude(M.trimCream, shapeOf([[-6, E + 0.3], [6, E + 0.3], [0, E + 2.1]]), 0, 0.4, 1, 4);
  P.quad(M.pedWindow, [-0.9, E + 0.55, 0.43], [0.9, E + 0.55, 0.43], [0.9, E + 1.4, 0.43], [-0.9, E + 1.4, 0.43], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  P.pop();
  gableRoof(P, M.zincGrey, -hl, hl, -hw, hw, E + 0.4, 1.8, true, { oe: 0.3, og: 0.2, gable: M.worksEnd, under: M.zincGrey });
  P.pop(); void pitch;
  addPolyColliders(Q.ctx, poly, -0.3, 9, 0.9);
}

// ------------------------------------------------------------------------------------------------ the rotunda of the yacht-club fence (restored 2021)
function rotunda(Q) {
  const P = Q.P, M = Q.M, ph = Q.ctx.physics;
  FRT.on(P, () => {
    P.box(M.rotStucco, -4.25, 4.25, 0, 2.3, -2.0, 2.0, 'b', 3);                                         // the base wall
    P.box(M.coping, -4.35, 4.35, 2.3, 2.45, -2.1, 2.1, 'b', 2);
    P.box(M.rotStucco, -1.8, 1.8, 2.45, 2.75, -1.8, 1.8, 'b', 2);                                       // the plinth 3.4 m
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.col(M.rotStucco, sx * 1.15, sz * 1.15, 2.75, 6.0, 0.45, 0.37, 12, true);       // four round tapering columns
    P.box(M.rotStucco, -1.85, 1.85, 6.0, 6.8, -1.85, 1.85, 'b', 2);                                     // entablature
    P.box(M.trimCream, -2.1, 2.1, 6.8, 7.4, -2.1, 2.1, '', 2);                                          // cornice
    P.col(M.rotStucco, 0, 0, 7.4, 7.7, 1.55, 1.55, 14, true);
    const g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); P.geo(M.rotDome, g, 0, 7.7, 0, 0, 0, 0, 1.7, 1.15, 1.7); g.dispose();
    revolve(P, M.rotStucco, [[0.0, 8.8], [0.12, 8.8], [0.1, 9.0]], 6, {});
  });
  FRT.box(ph, 0, 0, 8.6, 4.2, -0.3, 8.8);
  const c = FRT.W(0, 0);
  Q.svc.monuments.push({ id: 'w1385391721', name: 'Ротонда у Шкиперского моста', x: c.x, z: c.z, h: 9 });
}
