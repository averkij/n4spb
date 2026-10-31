// Only the three explicitly requested Park 300 waterfront flag landmarks
// override the scene's general no-flags rule. No flags are generated elsewhere.
// Dimensions/references: docs/research/three-flagpoles.md.
import * as THREE from 'three';
import { knockInstances } from './lib/knock-inst.js';
import { mastGeometry, collarGeometry, flagGeometry } from './landmarksThreeFlags/geometry.js';
import { SITES, MAST_HEIGHT, FLAG_WIDTH, FLAG_HEIGHT } from './landmarksThreeFlags/sites.js';
export { GROUPS_LIST } from './landmarksThreeFlags/sites.js';
export const OWNS_GROUPS = true;

const WIND_ROTATION = 0.32;

function mastFootBounds(geometry) {
  // A fallen 175 m mast rotates about its foot. Tight standing spheres have
  // centres high above ground and cannot contain the horizontal mast/cloth.
  // Keep the actual standing box, but bound every possible rotation by the
  // farthest vertex from the foot, including the flag's full 60 m free edge.
  // knockInstances adds the shared 30 m throw margin to each placed mesh.
  const a = geometry.attributes.position;
  let r2 = 0;
  for (let i = 0; i < a.count; i++) r2 = Math.max(r2, a.getX(i) ** 2 + a.getY(i) ** 2 + a.getZ(i) ** 2);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.sqrt(r2));
  return geometry;
}

export function build(ctx) {
  const steel = ctx.mat.toon('#ccd0cf', { paint: 0.012 });
  const collars = ctx.mat.toon('#aab4b7', { paint: 0.015 });
  const cloth = ctx.mat.toon('#ffffff', { vertexColors: true, side: 'double', paint: 0.015 });
  const shaft = mastFootBounds(mastGeometry()), details = mastFootBounds(collarGeometry());
  const service = { monuments: [], masts: [], photoSpots: [], triangles: 0, callbacks: 0 };
  const declared = ctx.L?.GROUPS?.landmarksThreeFlags;
  if (declared && !declared.some(g => g.key === 'okrug65-three-flags')) return;
  for (let i = 0; i < SITES.length; i++) {
    const s = SITES[i], flag = flagGeometry(s.key, i * 0.33);
    const flagTurn = new THREE.Matrix4().makeRotationY(WIND_ROTATION);
    flag.applyMatrix4(flagTurn); flag.computeBoundingBox(); mastFootBounds(flag);
    // Keep complete real shaft contact at every height, while the cloth is
    // non-solid. The radius follows the taper with short conservative bands.
    const items = [ctx.physics.addCylinder(s.x, s.z, 1.95, s.y, s.y + 90)];
    for (let j = 0; j < 5; j++) items.push(ctx.physics.addCylinder(s.x, s.z, 1.95 - j * 1.05 / 5, s.y + 90 + j * 10, s.y + 100 + j * 10));
    items.push(ctx.physics.addCylinder(s.x, s.z, 0.9, s.y + 140, s.y + 173.35));
    items.push(ctx.physics.addCylinder(s.x, s.z, 2.275, s.y + 173.35, s.y + MAST_HEIGHT));
    const built = knockInstances(ctx, {
      name: 'three-flags-' + s.key,
      parts: [
        { geo: shaft, mat: steel, name: 'mast', far: 5500 },
        { geo: details, mat: collars, name: 'collars', far: 1400 },
        { geo: flag, mat: cloth, name: 'cloth', far: 5500, noOutline: true },
      ],
      spots: [{ x: s.x, y: s.y, z: s.z }], items: [items], far: 5500,
      // A substantial anchored structure; it can still break through the same
      // collision system as the scene's other monuments. Every flange, collar,
      // textile and shaft shares one record, with all collider handles attached.
      rec: { kind: 'monument', mass: 65000, h: MAST_HEIGHT, r: 1.95, anchored: 58, hitK: 0.12, metal: true, minDv: 0 },
    });
    // The finite authored range and conservative per-mast bounds apply also
    // to the no-knock headless representation (normal engine does this later).
    for (const mesh of built.meshes) mesh.userData.skyline = true;
    const triangles = [shaft, details, flag].reduce((n, g) => n + g.index.count / 3, 0);
    service.triangles += triangles;
    service.masts.push({ ...s, h: MAST_HEIGHT, heightAboveWater: 179.5, cloth: [FLAG_WIDTH, FLAG_HEIGHT], record: built.records[0], colliderCount: items.length, triangles });
    service.monuments.push({ id: s.id, name: s.name, x: s.x, z: s.z, h: MAST_HEIGHT });
  }
  service.photoSpots.push({ name: 'Три флагштока со стороны пляжа', x: -8860, z: -5580, yaw: -118, pitch: 16 });
  ctx.services.landmarksThreeFlags = service;
  const landmarks = (ctx.services.landmarks ||= {});
  landmarks.monuments = (landmarks.monuments || []).concat(service.monuments);
  landmarks.photoSpots = (landmarks.photoSpots || []).concat(service.photoSpots);
}
