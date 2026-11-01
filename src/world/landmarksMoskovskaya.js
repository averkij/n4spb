// The southern Moskovsky ensemble, preserving its measured OSM footprints.
// Chesme Church/Palace are adapted from 102_3d_piter; the library, tower and
// district council are newly authored against the photographs in the dossier.
// No frame callbacks: static material/range buckets, knockable garden furniture.
import * as THREE from 'three';
import * as L from './layout.js';
import { makeKit } from './landmarksMoskovskaya/common.js';
import { church, palace } from './landmarksMoskovskaya/chesme.js';
import { spire, library, council } from './landmarksMoskovskaya/buildings.js';
import { square } from './landmarksMoskovskaya/square.js';
import { tollCanopy } from './landmarksMoskovskaya/bridge-details.js';
import { removeBridgeFallbacks } from '../areas/moskovskaya/bridge-fallbacks.js';
export const OWNS_GROUPS = true;

export function build(ctx) {
  removeBridgeFallbacks(ctx);
  const root = new THREE.Group(); root.name = 'landmarksMoskovskaya';
  const svc = { houses: [], monuments: [], photoSpots: [], entrances: [], parts: {}, triangles: 0 };
  const K = makeKit(ctx, root, svc);
  for (const [key, fn] of [
    ['chesme-church', church], ['chesme-palace', palace], ['spire', spire],
    ['library', library], ['council', council], ['toll-canopy', tollCanopy],
  ]) {
    const records = L.groupMembers('mz-' + key);
    if (!records.length) continue;
    K.begin(); fn(K, records); K.flush(key === 'toll-canopy' ? 'toll-roof' : key);
  }
  K.begin(); square(K); K.flush('strugatsky');
  ctx.addStatic(root);
  const all = ctx.services.landmarks ||= {};
  for (const k of ['monuments', 'photoSpots']) (all[k] ||= []).push(...svc[k]);
  ctx.services.landmarksMoskovskaya = svc;
}
