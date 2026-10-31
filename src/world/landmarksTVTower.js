import { adaptPortedSolids } from './lib/adapt-ported-solids.js';
// landmarksTVTower - the Leningrad (St Petersburg) TV tower, Аптекарский остров, ul. Akademika Pavlova 3: 326 m (316 m at the opening in 1962, 326 m since the antenna of 2011), V. S. Vasilkovsky.
// The most visible vertical of the Petrograd side: a six-leg steel lattice trunk in three tapering pyramids (hexagon of 49.4 m across the flats at the ground, OSM w49489011) with five walkway rings,
// the red-white concrete shaft inside it (4.8 m, portholes, bands re-measured on photo B3), the hexagonal three-level lantern at 185-201 m (grey-green slabs widening upwards, leaning dark glass, lambda struts), the square lattice antenna mast
// (10 -> 8.6 m wide box in white / red bands, present 126 m antenna) to 310 m and the 16 m spire; fenced territory, the slim stone pedestal with the door at the foot.  ~25.6 k triangles, ONE merged mesh, ~180 ms build.  Dossier docs/research/aptekarsky-2026.md 4.2 + 12 (CRITIC LOG), photos refs/aptekarsky B3 67 68 69 70 71 (see BUILD LOG there).
// Files (landmarksTVTower/): frame.js (all dimensions) parts.js (collector) mats.js trunk.js shaft.js lantern.js mast.js fence.js groups.js (claim w49489011 + its 3 parts).
// Publishes ctx.services.landmarksTVTower = { monuments, photoSpots, feet, fence, lantern, mast, pedestal, triangles, buildMs } and merges monuments / photoSpots into ctx.services.landmarks.
// Statics only, no frame callbacks, ONE vertex-coloured material after batching: every piece is a skyline object (326 m tall, class L, kept in the far proxy of its sector beyond 1 km), so the tower
// shows from the whole city; environment/far.js stops its own square mast once layout.GROUPS.landmarksTVTower is non-empty.  No lights (no aviation beacons, no flag-coloured night lighting).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksTVTower/parts.js';
import { makeMats } from './landmarksTVTower/mats.js';
import { O, ROT, world, corner, R_FOOT, TOTAL } from './landmarksTVTower/frame.js';
import { trunk } from './landmarksTVTower/trunk.js';
import { shaft } from './landmarksTVTower/shaft.js';
import { lantern } from './landmarksTVTower/lantern.js';
import { mast } from './landmarksTVTower/mast.js';
import { fence } from './landmarksTVTower/fence.js';

/** solid parts on the ground: the fence (six sides), the pedestal and the six feet (cylinders) */
function colliders(ctx, svc) {
  const ph = ctx.physics;
  for (const { a, b } of svc.fence.sides) {
    const [x0, z0] = world(a[0], a[1]), [x1, z1] = world(b[0], b[1]), l = Math.hypot(x1 - x0, z1 - z0);
    ph.addBox((x0 + x1) / 2, (z0 + z1) / 2, l + 0.3, 0.4, Math.atan2(-(z1 - z0), x1 - x0), 0, 2.6);
  }
  const [px, pz] = world(0, 0);
  ph.addCylinder(px, pz, svc.pedestal.r, 0, svc.pedestal.h + 0.5);
  for (const f of svc.feet) { const [x, z] = world(f[0], f[1]); ph.addCylinder(x, z, 1.9, 0, 30); }
}

/** a few free spots 70-130 m round the tower where a tourist stands (not on a road, not inside a building), looking at it */
function photoSpots(svc) {
  const spots = [], names = ['Телебашня с востока', 'Телебашня с юга', 'Телебашня с запада', 'Телебашня с севера'];
  const bearings = [[90, 0], [180, 1], [270, 2], [0, 3]];
  for (const [bd, ni] of bearings) {
    let best = null;
    for (let r = 70; r <= 140 && !best; r += 6) for (const da of [0, 12, -12, 24, -24, 36, -36]) {
      const a = (bd + da) * Math.PI / 180, x = O.x + r * Math.sin(a), z = O.z - r * Math.cos(a);
      if (L.inPlay && !L.inPlay(x, z)) continue;
      if (L.insideBuilding(x, z, 3) || L.isOnRoad(x, z, 2.5)) continue;
      best = { x, z, yaw: L.yawToward(x, z, O.x, O.z), name: names[ni] };
      break;
    }
    if (best) spots.push(best);
  }
  svc.photoSpots.push(...spots);
}

async function buildSource(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx), root = new THREE.Group(); root.name = 'landmarksTVTower';
  root.position.set(O.x, 0, O.z); root.rotation.y = ROT;
  const svc = { monuments: [], photoSpots: [], entrances: [] };
  const P = new Parts(), D = new Parts();                        // P = the silhouette (legs, rings, shaft, lantern, mast), D = the fine detail (lacing, railings, brackets, spokes)
  const stageTris = {};
  const stage = (name, fn) => { const t1 = P.tris + D.tris; try { fn(); } catch (e) { console.error(`[landmarksTVTower] ${name} failed:`, e); (svc.failed ||= []).push(name + ': ' + (e && e.stack || e)); } stageTris[name] = P.tris + D.tris - t1; };
  stage('trunk', () => trunk(P, D, M, svc));
  stage('shaft', () => shaft(P, M, svc));
  stage('lantern', () => lantern(P, M, svc));
  stage('mast', () => mast(P, M, svc));
  stage('fence', () => fence(P, M, svc));
  const meshes = P.build(root, { name: 'tvt', cast: true }).concat(D.build(root, { name: 'tvt-d', cast: true }));
  for (const m of meshes) m.userData.skyline = true;               // tall thin: size class L at every distance (core/spatial.js sizeClass)
  root.updateMatrixWorld(true);
  ctx.addStatic(root);
  stage('colliders', () => colliders(ctx, svc));
  stage('photoSpots', () => photoSpots(svc));
  svc.monuments.push({ id: 'w49489011', name: 'Ленинградская телебашня', x: O.x, z: O.z, h: TOTAL });
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksTVTower = { ...svc, triangles: Math.round(P.tris + D.tris), baseTriangles: Math.round(P.tris), stageTris, meshes: meshes.length, buildMs: Math.round(performance.now() - t0) };
  void corner; void R_FOOT;
}

export async function build(ctx) {
  const before=new Set(ctx.physics.items), roots=new Set(ctx.staticRoot.children);
  await buildSource(ctx);
  adaptPortedSolids(ctx,ctx.staticRoot.children.filter(r=>!roots.has(r)),ctx.physics.items.filter(it=>!before.has(it)),"landmarksTVTower");
}
