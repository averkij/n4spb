// landmarksGavan/fire.js - the GAVAN FIRE RESERVE (Гаванская пожарная часть, now "Пожарная часть № 18"; 1906-07, F. A. Korzukhin; Maly pr. 76 / Ostoumova 21; OSM w32861970 + the rear block w32861971; frame F: u east, v south,
// the garage front = the WEST face) (docs/research/gavan.md section 9; photos refs/gavan 93-98 + the citywalls 1905 plans).  Silent: no beacons, no raised ladders, no vehicles with lights.
//   WALLS    the baked 39-vertex ring extruded to the crenellated cornice (10.4 m): the garage front is 5 bays of 7.4 m (a red round-arched door 5.0 x 4.6 m in a cream arcade band, salmon-terracotta brick above with two
//            windows, a Lombard corbel frieze), the tower block carries the big arch; courtyard and side walls use a plain tile; the south end is a STEPPED CREAM GABLE (apex 15.0 m) with an arched window and a ceramic rosette.
//   ROOFS    grey-blue zinc: a low pitched roof over the Maly pr. corner block (ridge 12 m) with a tall pointed gable on its north face, the small square TOWER (3.3 m) with its pyramid roof (apex 16.5 m) and four conical
//            corner turrets; the cornice has merlons and four small conical turrets over the garage piers.
//   REAR     the plain 2-storey brick block w32861971 (brown hipped roof).  The red-painted drill tower behind is not drawn (position unknown [?]).  The yard in front is open asphalt; the boom gate is skipped.
import * as L from '../layout.js';
import { FF } from './frame.js';
import { ringEdges, onEdge } from './kit.js';
import { gableRoof, hipRoof, pyramid } from './prims.js';
import { addPolyColliders } from '../lib/massing.js';
import { flushWalls } from './fence.js';

const PAR = 10.4;

export function build(Q) {
  const errs = [];
  const stage = (name, fn) => { try { fn(); } catch (e) { console.error(`[landmarksGavan] fire/${name}:`, e); errs.push(`${name}: ${e && e.stack || e}`); } };
  const P = Q.P, M = Q.M;
  const b = L.buildingById('w32861970');
  if (!b || !b.polys || !b.polys[0]) throw new Error('missing footprint w32861970');
  const poly = b.polys[0], edges = ringEdges(poly);
  stage('walls', () => { for (const e of edges) if (e.len > 0.5) wall(Q, e); });
  stage('roofs', () => roofs(Q, poly));
  stage('rear', () => rear(Q));
  const c = FF.W(12, 36);
  Q.svc.monuments.push({ id: 'w32861970', name: 'Гаванская пожарная часть', x: c.x, z: c.z, h: 16.5 });
  Q.svc.photoSpots.push({ x: -6190, z: -590, yaw: -90, pitch: 4, name: 'Гаванская пожарная часть: гаражные арки' });
  if (errs.length) throw new Error(errs.join('\n'));
}

function wall(Q, e) {
  const P = Q.P, M = Q.M, len = e.len;
  const nu = e.n[0] * FF.U[0] + e.n[1] * FF.U[1], nv = e.n[0] * FF.V[0] + e.n[1] * FF.V[1], q = FF.M(e.a[0], e.a[1]);
  const garage = nu < -0.7 && len > 12 && q.u > 8 && q.u < 12, tower = nu < -0.7 && len > 4 && len < 6 && q.v > 14 && q.v < 22, south = nv > 0.7 && len > 12 && q.v > 55;
  onEdge(Q.P, e, () => {
    if (len < 1.6) { P.quad(M.fireBrick, [0, 0, 0], [len, 0, 0], [len, PAR, 0], [0, PAR, 0], [0, 0, 1], [[0, 0], [len / 2.4, 0], [len / 2.4, PAR / 2.4], [0, PAR / 2.4]]); return; }
    if (garage) {
      const n = Math.max(1, Math.round(len / 7.4));
      P.quad(M.fireBay, [0, 0, 0], [len, 0, 0], [len, PAR + 0.1, 0], [0, PAR + 0.1, 0], [0, 0, 1], [[0, 0], [n, 0], [n, 1], [0, 1]]);
    } else if (tower) {
      P.quad(M.fireWall, [0, 0, 0], [len, 0, 0], [len, PAR, 0], [0, PAR, 0], [0, 0, 1], [[0, 0], [1.3, 0], [1.3, 1], [0, 1]]);
      P.quad(M.fireTowerArch, [len / 2 - 2.2, 0.0, 0.05], [len / 2 + 2.2, 0.0, 0.05], [len / 2 + 2.2, 5.5, 0.05], [len / 2 - 2.2, 5.5, 0.05], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    } else {
      const n = Math.max(1, Math.round(len / 3.5));
      P.quad(M.fireWall, [0, 0, 0], [len, 0, 0], [len, PAR + 0.1, 0], [0, PAR + 0.1, 0], [0, 0, 1], [[0, 0], [n, 0], [n, 1], [0, 1]]);
    }
    // the crenellated cornice: a band, merlons every 1.2 m, small grey conical turrets over the garage piers
    P.box(M.fireCream, -0.04, len + 0.04, PAR - 0.15, PAR + 0.3, 0, 0.22, 'b', 2);
    for (let x = 0.4; x < len - 0.3; x += 1.2) P.box(M.fireCream, x, x + 0.6, PAR + 0.3, PAR + 0.85, 0.02, 0.26, 'b', 1);
    if (garage) { const n = Math.max(1, Math.round(len / 7.4)); for (let i = 0; i <= n; i++) { const x = i * len / n; if (x > 0.3 && x < len - 0.3) P.cyl(M.zincBlue, [x, PAR + 0.3, 0.12], [x, PAR + 1.6, 0.12], 0.34, 0.01, 6, true); } }
    if (south) {                                                                                       // the stepped cream gable, apex 15.0, with the arched window and the rosette
      const c = len / 2;
      for (const [hw, y0, y1] of [[6.6, PAR, 12.0], [4.7, 12.0, 13.6], [2.8, 13.6, 15.0]]) P.box(M.fireCream, c - hw, c + hw, y0, y1, 0, 0.35, 'b', 2);
      P.quad(M.fireWin, [c - 0.75, 10.9, 0.38], [c + 0.75, 10.9, 0.38], [c + 0.75, 13.4, 0.38], [c - 0.75, 13.4, 0.38], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(M.fireRose, [c - 1.0, 13.7, 0.38], [c + 1.0, 13.7, 0.38], [c + 1.0, 14.8, 0.38], [c - 1.0, 14.8, 0.38], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
    if (nv < -0.7 && len > 12) {                                                                       // the Maly pr. face: a tall pointed corner gable over a paired-arch arcade (NW end = the right end seen from the street)
      const c = len - 4.0, hw = 3.4, yr = 14.0;
      P.fan(M.fireCream, [[c - hw, PAR, 0.28], [c + hw, PAR, 0.28], [c, yr, 0.28]], [0, 0, 1], (p) => [p[0] / 3, p[1] / 3]);
      P.quad(M.fireWin, [c - 1.7, 10.7, 0.31], [c - 0.3, 10.7, 0.31], [c - 0.3, 13.0, 0.31], [c - 1.7, 13.0, 0.31], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      P.quad(M.fireWin, [c + 0.3, 10.7, 0.31], [c + 1.7, 10.7, 0.31], [c + 1.7, 13.0, 0.31], [c + 0.3, 13.0, 0.31], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      for (const sx of [-1, 1]) P.cyl(M.zincBlue, [c + sx * (hw + 0.1), PAR, 0.32], [c, yr + 0.08, 0.32], 0.07, 0.07, 4, false);                       // the zinc-clad rake of the gable
    }
  });
}

function roofs(Q, poly) {
  const P = Q.P, M = Q.M;
  const ring = []; for (let i = 0; i < poly.o.length; i += 2) ring.push([poly.o[i], poly.o[i + 1]]);
  P.cap(M.zincBlue, ring, PAR + 0.02, true, 3);                                                         // the flat roof behind the parapet
  FF.on(P, () => {
    gableRoof(P, M.zincBlue, 0.0, 16.0, 0.3, 14.6, PAR, 1.7, true, { oe: 0.15, og: 0.1, gable: M.fireCream, uvs: 2.4 });                 // the corner block, ridge 12.1 m
    // the small tower: 3.3 m square shaft over the parapet, pyramid roof apex 16.5, four conical corner turrets
    const tx = 7.9, tz = 15.1;
    P.box(M.fireBrick, tx, tx + 3.3, PAR, 13.6, tz, tz + 3.3, 'tb', 2.4);
    P.box(M.fireCream, tx - 0.15, tx + 3.45, 13.45, 13.75, tz - 0.15, tz + 3.45, 'b', 2);
    pyramid(P, M.zincPyr, [[tx - 0.2, tz - 0.2], [tx + 3.5, tz - 0.2], [tx + 3.5, tz + 3.5], [tx - 0.2, tz + 3.5]], 13.75, 2.75, { oe: 0.1 });
    for (const [dx, dz] of [[-0.1, -0.1], [3.4, -0.1], [3.4, 3.4], [-0.1, 3.4]]) P.cyl(M.zincPyr, [tx + dx, 13.75, tz + dz], [tx + dx, 14.95, tz + dz], 0.3, 0.01, 6, true);
    P.push(tx + 1.65, 0, tz, -Math.PI / 2); P.quad(M.fireRose, [-0.5, 11.8, 1.67], [0.5, 11.8, 1.67], [0.5, 12.8, 1.67], [-0.5, 12.8, 1.67], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]); P.pop();     // the round window with its green tile ring (west face)
  });
}

function rear(Q) {
  const P = Q.P, M = Q.M, b = L.buildingById('w32861971');
  if (!b || !b.polys || !b.polys[0]) return;
  const poly = b.polys[0], edges = ringEdges(poly), H = 8.0;
  for (const e of edges) { if (e.len < 0.5) continue; onEdge(P, e, (len) => { P.quad(M.rearBrick, [0, 0, 0], [len, 0, 0], [len, H, 0], [0, H, 0], [0, 0, 1], [[0, 0], [len / 2.4, 0], [len / 2.4, H / 2.4], [0, H / 2.4]]); P.box(M.fireCream, -0.03, len + 0.03, H - 0.3, H, 0, 0.12, 'b', 2); }); }
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (let i = 0; i < poly.o.length; i += 2) { const q = FF.M(poly.o[i], poly.o[i + 1]); u0 = Math.min(u0, q.u); u1 = Math.max(u1, q.u); v0 = Math.min(v0, q.v); v1 = Math.max(v1, q.v); }
  FF.on(P, () => hipRoof(P, M.rearRoof, u0, u1, v0, v1, H, 2.4, { oe: 0.3 }));
  addPolyColliders(Q.ctx, poly, -0.3, 11, 0.9);
  flushWalls(Q, L.buildingById('w32861970').polys[0], -0.3, 12, 0.3);                  // flush: the outer face is the wall line (the north wall is 0.9 m from the Maly pr. asphalt)
  FF.box(Q.ctx.physics, 7.6, 15.9, 3.3, 3.3, -0.3, 17);
}
