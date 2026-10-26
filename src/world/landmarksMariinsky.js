// landmarksMariinsky - the Mariinsky Theatre (A. Cavos 1860: mint green and white, five-bay Corinthian portico with two avant-corps, glass canopy, auditorium drum with lantern, gabled stage house) with the
// Kryukov-canal wing, the St Petersburg Conservatory (V. Nicolas 1896, cream, Ionic portico), the Teatralnaya Square gardens (gravel paths, lawns, hedges, beds, fences, lamps, benches, trees) with the
// bronze Glinka (1906) and Rimsky-Korsakov (1952) monuments, the covered skybridge over the canal and the 2013 Mariinsky-II (beige stone, glass foyer, glazed roof canopy).
// Dossier docs/research/mariinsky.md (OSM measured, photos refs/mariinsky); houses of the square: docs/research/mariinsky-houses.json.  User rules: no flags / flagpoles, no alarm sounds.
// Files: landmarksMariinsky/frame.js (frames T / S) mats.js geo.js theatre.js (walls, bands, bays, side entrance) portico.js (the portico block) roof.js (roofs, drum, stage house) conservatory.js square.js
// monuments.js mariinsky2.js canalside.js groups.js (claims); kit.js common.js parts.js reliefs.js util.js treegeo.js leafmat.js trees.js (the facade vocabulary / tree kit, copied from landmarksCastle).
// Publishes ctx.services.landmarksMariinsky = { entrances, benches, crowd, photoSpots, monuments, lamps, ... } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied verbatim from 102_3d_piter commit 0568f7af (src/world/landmarksMariinsky.js and landmarksMariinsky/*); this line is the only change.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { makeKit } from './landmarksMariinsky/common.js';
import { makeMats } from './landmarksMariinsky/mats.js';
import { TW } from './landmarksMariinsky/frame.js';
import { theatreData, buildWalls, buildSide } from './landmarksMariinsky/theatre.js';
import { buildPortico } from './landmarksMariinsky/portico.js';
import { buildRoofs } from './landmarksMariinsky/roof.js';

const PARTS = [
  ['theatre', (K, M, D, svc) => { buildWalls(K, M, D.theatre); buildSide(K, M, svc); }],
  ['portico', (K, M, D, svc) => buildPortico(K, M, svc)],
  ['roofs', (K, M, D, svc) => buildRoofs(K, M, D.theatre)],
  ['conservatory', () => import('./landmarksMariinsky/conservatory.js').then((m) => (K, M, D, svc) => m.build(K, M, D, svc))],
  ['square', () => import('./landmarksMariinsky/square.js').then((m) => (K, M, D, svc) => m.build(K, M, D, svc))],
  ['monuments', () => import('./landmarksMariinsky/monuments.js').then((m) => (K, M, D, svc) => m.build(K, M, D, svc))],
  ['mariinsky2', () => import('./landmarksMariinsky/mariinsky2.js').then((m) => (K, M, D, svc) => m.build(K, M, D, svc))],
  ['canalside', () => import('./landmarksMariinsky/canalside.js').then((m) => (K, M, D, svc) => m.build(K, M, D, svc))],
];

export async function build(ctx) {
  const t0 = performance.now();
  const root = new THREE.Group(); root.name = 'landmarksMariinsky';
  const K = makeKit(ctx); K.root = root; K.TW = TW;
  const M = makeMats(ctx, K);
  const D = { theatre: theatreData() };
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], benches: [], lamps: [], parts: {}, triangles: 0 };
  K.svc = svc;
  const failed = [];
  for (const [name, load] of PARTS) {
    const t1 = performance.now();
    K.begin();
    try {
      let fn = load;
      if (load.length === 0) { try { fn = await load(); } catch (e) { if (/Failed to fetch|Cannot find|ENOENT|not found/i.test(String(e && e.message))) { svc.parts[name] = { skipped: true }; continue; } throw e; } }
      await fn(K, M, D, svc);
    } catch (e) { console.error(`[landmarksMariinsky] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    const before = K.tris;
    K.flush(root, name);
    svc.parts[name] = { tris: K.tris - before, ms: Math.round(performance.now() - t1) };
  }
  svc.triangles = K.tris;
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksMariinsky = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.M_DEBUG) console.log('[landmarksMariinsky] parts', JSON.stringify(svc.parts), 'bays', K.bayCount);
  if (failed.length) throw new Error('landmarksMariinsky parts failed:\n' + failed.join('\n'));
}
