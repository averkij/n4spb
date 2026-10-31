// landmarksKamennyPalace/walk.js - the colliders and the services of the module.  The garden is CLOSED (dossier 1: visitor accounts, the checkpoint at the SSW end of the river front): the palace, the kitchen
// block, the gardener's house, the yard walls and the whole garden fence are solid; nothing is walkable inside.  Roofs are not colliders (core/roofmap.js captures what is drawn).
import { addPolyColliders } from '../lib/massing.js';
import { W, RING, O, ROT } from './frame.js';
import * as FR from './frame.js';

const flat = (ring) => ring.flatMap((p) => [p[0], p[1]]);

export function build(K) {
  const ctx = K.ctx, ph = ctx.physics;
  if (!ph) return;
  // ---- the palace: the OSM footprint as thin wall boxes (the colonnade terrace and the porch included: they are part of the ring)
  addPolyColliders(ctx, { o: flat(RING.map(([x, z]) => { const p = W(x, z); return [p.x, p.z]; })), h: [] }, 0, 15.5, 1.2);
  for (const ring of [FR.KITCHEN, FR.GARDENER, FR.LITD, FR.GUARD, FR.ORANGERY]) addPolyColliders(ctx, { o: flat(ring), h: [] }, 0, 12, 1.0);
  // the eight river columns are inside the terrace box: no extra colliders (the terrace is 1.5 m high and unreachable)
  for (const fn of K.shared.walkFns || []) fn(ctx, K);
  // ---- services: the palace as a monument, three photo spots on public ground, tourist stay zones
  K.svc.monuments.push({ id: 'w28055973', name: 'Каменноостровский дворец', x: O.x - 12, z: O.z - 10, h: 15.2 });
  const spot = (x, z, yaw, name) => K.svc.photoSpots.push({ x, z, yaw, name });
  spot(-2672, -5226, 62, 'Каменноостровский дворец: вид с набережной Малой Невки');
  spot(-2866, -5342, -62, 'Каменноостровский дворец: парадные ворота на Каменноостровском проспекте');
  (K.svc.crowd ||= []).push({ id: 'kamenny-gate', kind: 'photo', x: -2870, z: -5338, r: 7, n: 4 });
  void FR; void ROT;
}
