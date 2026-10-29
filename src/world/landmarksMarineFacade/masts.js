// landmarksMarineFacade/masts.js - the 18 floodlight masts of the port (OSM `man_made=mast tower:type=lighting` in the layer MANMADE; nobody else draws them: dossier 4.6 + CRITIC).
// Built into the part mesh (18 of them, not instanced: the long poles keep the mesh in the never-hidden size class of core/spatial.js: the masts are skyline objects).
// A galvanised octagonal pole 25 m (foot d 0.5 m tapering to 0.28 m) on a concrete foot with a yellow-black hazard collar 1.0 m tall, a cross-arm head carrying 4 large square floodlights (0.6 x 0.45 m) tilted down
// ~25 deg (photos alen_08 V 12 V 16).  Every mast is tested at its FINAL position against the carriageway (net.cover) and buildings; one that fails is left out (and counted).  Solid thin collider.
// n4spb (docs/AREAS.md 13.7, 15.v; docs/gdm-M.md): each mast is a KNOCK RECORD (anchored: a bump holds it, a hard hit breaks it off at the foot and topples it, the collider is replaced by a rest box); the pole is built once at the
// origin and instanced per mast (the source built 18 copies into the part mesh), the collider stays where it was.
import * as THREE from 'three';
import * as L from '../layout.js';
import { MANMADE } from '../data/city.js';
import { coverFn } from './surfaces.js';
import { partsGeos, kFurn } from './inst.js';


export function build(K) {
  const { ctx, P, M, svc } = K, ph = ctx.physics, cover = coverFn(ctx);
  const masts = MANMADE.filter((m) => m.kind === 'mast' && m.x > -9800 && m.x < -8500 && m.z > -2400 && m.z < -1100);
  const box = new THREE.BoxGeometry(0.6, 0.45, 0.3);
  const mastParts = (Q) => {                                                                                       // (built once, at the origin)
    Q.col(M.black, 0, 0, 0, 0.5, 0.78, 0.78, 10, true); Q.col(M.yellow, 0, 0, 0.5, 1.0, 0.78, 0.78, 10, true);    // concrete foot with the hazard collar (black / yellow bands)
    Q.col(M.mast, 0, 0, 1.0, 25.0, 0.25, 0.14, 8, false);                                                          // the pole
    Q.box(M.mastHead, -1.3, 1.3, 24.9, 25.1, -0.1, 0.1, '', 1);                                                    // the cross arm
    for (const x of [-1.05, -0.35, 0.35, 1.05]) Q.geo(M.lamp, box, x, 24.65, 0.28, 0.44, 0, 0);                    // four floodlights, tilted down 25 deg, facing +z (rotated per mast)
    for (const x of [-1.05, -0.35, 0.35, 1.05]) Q.geo(M.lamp, box, x, 24.65, -0.28, -0.44, 0, 0);                  // and the same back to back (-z)
  };
  let skipped = 0, n = 0;
  const spots = [], items = [];
  for (const m of masts) {
    if (cover(m.x, m.z) > -0.7 || L.insideBuilding(m.x, m.z, 0.5)) { skipped++; continue; }
    // the head turns toward the nearest part of the basin (a deterministic pseudo-angle: along the berth wall)
    const rot = Math.atan2(-0.2885, -0.9575) + (((m.x * 7 + m.z * 3) | 0) % 2 ? 0 : Math.PI / 2);
    spots.push({ x: m.x, y: 0, z: m.z, rotY: rot }); items.push(ph.addCylinder(m.x, m.z, 0.5, 0, 25)); n++;
    svc.lamps.push({ x: m.x, z: m.z, h: 25, kind: 'mast' });
  }
  // the poles are skyline objects: far 1500 (the source's part mesh was in the never-hidden size class)
  kFurn(K, 'lmmarin-mast', partsGeos(mastParts), spots, items, { kind: 'mast', mass: 1200, h: 25, r: 0.5, anchored: 26, hitK: 0.5, metal: true }, 1500);
  svc.counts.masts = n; svc.counts.mastsSkipped = skipped;
}
