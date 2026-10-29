// landmarksKirova/furn.js - BENCHES and PARK LAMPS of the Vasileostrovets garden (docs/research/kirova.md 10.2, photos gd09 gd13 gd14).
//   benches  the 16 OSM bench nodes (FURNITURE: n5125119623 ... n5153880623, frame K r 176 .. 206, q -220 .. 34): wooden slat benches 1.8 m with granite-block ends (0.4 x 0.4 x 0.45 `#8d8d8a`), slats `#7a5a3c`,
//            black iron backrest brackets; each is turned to face the nearest footway.  Published as svc.benches (merged into ctx.services.landmarks.benches, so props does not draw them twice).
//   lamps    black cast-iron park lamps 3.8 m (a slim fluted base ring at 0.9 m, a round opal lantern D 0.45 under a conical black hood), every ~24 m along the two main alleys (w64545157 / w64545144), 2.8 m
//            off the alley axis, outside the lawns and the plaza; none on a carriageway (net.cover < -0.5).  Published as svc.lamps.
// Everything is merged geometry (Parts): ~140 triangles a bench, ~110 a lamp.
import * as THREE from 'three';
import * as L from '../layout.js';
import { FK } from './frame.js';
import { FURNITURE, ROADS } from '../data/city.js';
import { coverFn } from './surfaces.js';
import { partsGeos } from './inst.js';
import { knockFurniture, FURNITURE_REC } from '../lib/knock-furniture.js';      // n4spb (docs/AREAS.md 13, 15.v): the benches and the park lamps are knock records

const BENCH_IDS = ['n5125119623', 'n5125119722', 'n5153843730', 'n5153843731', 'n5153843732', 'n5153843733', 'n5153843734', 'n5153843735', 'n5153843736', 'n5153843737', 'n5153880224', 'n5153880328', 'n5153880427', 'n5153880522', 'n5153880622', 'n5153880623'];
const ALLEYS = ['w64545157', 'w64545144'];
const LAWNS = [{ r: [181.5, 199.5], q: [-225, -91] }];

function bench(P, M, x, z, rot) {
  P.push(x, 0, z, rot);
  for (const sx of [-0.78, 0.78]) { P.box(M.benchStone, sx - 0.2, sx + 0.2, 0, 0.45, -0.22, 0.22, 'b', 0.5); P.box(M.lampBlack, sx - 0.02, sx + 0.02, 0.45, 0.95, -0.2, -0.17, '', 1); }          // granite ends + iron brackets
  for (let i = 0; i < 4; i++) P.box(M.benchWood, -0.92, 0.92, 0.45, 0.5, -0.22 + i * 0.145, -0.22 + i * 0.145 + 0.12, 'b', 0.5);                                                           // seat slats
  for (let i = 0; i < 3; i++) P.box(M.benchWood, -0.92, 0.92, 0.62 + i * 0.12, 0.62 + i * 0.12 + 0.09, -0.2, -0.17, 'b', 0.5);                                                               // back slats
  P.pop();
}

function lamp(P, M, x, z) {
  P.col(M.lampBlack, x, z, 0, 0.12, 0.17, 0.15, 8, true); P.col(M.lampBlack, x, z, 0.12, 0.9, 0.09, 0.06, 8, false); P.col(M.lampBlack, x, z, 0.9, 1.0, 0.12, 0.12, 8, true);       // base with the fluted ring
  P.col(M.lampBlack, x, z, 1.0, 3.55, 0.05, 0.04, 8, false);
  const g = new THREE.SphereGeometry(0.225, 9, 7); P.geo(M.lampOpal, g, x, 3.72, z); g.dispose();
  P.cyl(M.lampBlack, [x, 3.9, z], [x, 4.12, z], 0.36, 0.05, 10, true);                                                                                                                     // the conical hood
  P.col(M.lampBlack, x, z, 3.5, 3.56, 0.1, 0.06, 8, true);
}

export function build(K) {
  const { ctx, P, M } = K, ph = ctx.physics, cover = coverFn(ctx);
  // footway polylines of the alleys (world), for the orientation of the benches and the lamp line
  const ways = {}; for (const r of ROADS) if (r.pts && (ALLEYS.includes(r.id) || r.hw === 'footway')) ways[r.id] = r.pts;
  const nearest = (x, z) => { let best = null; for (const [id, p] of Object.entries(ways)) for (let i = 0; i + 3 < p.length; i += 2) { const ax = p[i], az = p[i + 1], bx = p[i + 2], bz = p[i + 3], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), qx = ax + dx * t, qz = az + dz * t, d = Math.hypot(x - qx, z - qz); if (!best || d < best.d) best = { d, qx, qz, dx, dz, id }; } return best; };
  let nb = 0;
  const benchSpots = [], benchItems = [], lampSpots = [], lampItems = [];
  for (const id of BENCH_IDS) {
    const f = FURNITURE.find((q) => q.id === id); if (!f) continue;
    const n = nearest(f.x, f.z); let rot = FK.rot;
    if (n && n.d < 8) { const tx = n.dx, tz = n.dz, l = Math.hypot(tx, tz) || 1; let fx = n.qx - f.x, fz = n.qz - f.z; if (Math.hypot(fx, fz) < 0.05) { fx = -tz; fz = tx; } rot = Math.atan2(fx, fz); void l; }          // local +z = the front of the bench: the seat faces the path
    benchSpots.push({ x: f.x, y: 0, z: f.z, rotY: rot }); benchItems.push(ph.addBox(f.x, f.z, 1.9, 0.55, rot, 0, 0.9));
    K.svc.benches.push({ x: f.x, z: f.z, rotY: rot }); nb++;
  }
  // lamps: every ~24 m along both alleys, 2.8 m to the side, alternating
  let nl = 0;
  for (const id of ALLEYS) {
    const p = ways[id]; if (!p) continue; let next = 12, side = 1;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const ax = p[i], az = p[i + 1], bx = p[i + 2], bz = p[i + 3], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1, ux = dx / len, uz = dz / len;
      let t = next;
      for (; t < len; t += 24) {
        const x = ax + ux * t - uz * 2.8 * side, z = az + uz * t + ux * 2.8 * side, k = FK.M(x, z); side = -side;
        if (cover(x, z) > -0.6 || L.insideBuilding(x, z, 1.0)) continue;
        if (k.a > 181.5 && k.a < 199.5 && k.b > -225 && k.b < -91) continue;                                         // not on the two lawns
        if (k.a > 174 && k.a < 210 && k.b > -92 && k.b < -50) continue;                                               // nor on the Roerich plaza
        if (k.a > 183 && k.a < 200 && k.b < -222) continue;                                                          // nor on the apron of the south gate
        lampSpots.push({ x, y: 0, z, rotY: 0 }); lampItems.push(ph.addCylinder(x, z, 0.18, 0, 4)); K.svc.lamps.push({ x, z, h: 4.1 }); nl++;
      }
      next = t - len;
    }
  }
  K.extraTris += knockFurniture(ctx, 'lmKir-benches', partsGeos((Q) => bench(Q, M, 0, 0, 0)), benchSpots, benchItems, { ...FURNITURE_REC.bench, w: 1.8 }, 200);
  K.extraTris += knockFurniture(ctx, 'lmKir-lamps', partsGeos((Q) => lamp(Q, M, 0, 0)), lampSpots, lampItems, FURNITURE_REC.lamp(4.1), 300);
  const S = (ctx.services.landmarks ||= {});
  S.benches = (S.benches || []).concat(K.svc.benches);
  K.svc.stats = { ...(K.svc.stats || {}), benches: nb, lamps: nl };
  void LAWNS;
}
