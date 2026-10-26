// landmarksE - the Ostrovsky ensemble south of Nevsky Prospekt between the Anichkov Bridge and the City Duma: Gostiny Dvor (the two-storey arcade round a whole block, portico, four round corner
// pavilions, green roofs), the Catherine Garden with the Catherine II monument, the Alexandrinsky Theatre (Rossi, 6 Corinthian columns, the Apollo quadriga), the Russian National Library corner
// (Sokolov) + Rossi wing, the Anichkov Palace garden front, the Cabinet building, the two Rossi pavilions with the fence and gate,
// and the houses of Ostrovsky Square.  Dossier docs/research/gostiny-dvor-ostrovsky.md (sections 3-8, 11, CRITIC LOG), photos refs/ostrovsky 002 005 009 018 004 065 077 085 109 118 126 149 153 170.
//   Files: landmarksE/frame.js ((u, v) frame of the ensemble) · mats.js · kit.js / common.js / reliefs.js / house.js / parts.js / sculpt.js (stucco vocabulary, copied from landmarksG) ·
//   gd.js (Gostiny Dvor) · garden.js (Catherine Garden, monument, fence, lamps, benches) · theatre.js · library.js · anichkov.js (palace, cabinet, pavilions, fence, gate) ·
//   houses.js (the other houses of the square) · groups.js (the claims).
//   OWNS_GROUPS lists the sub-groups really drawn.  Publishes ctx.services.landmarksE = { gd, theatre, garden, monuments, benches, spots, triangles } and merges monuments / photoSpots / benches into
//   ctx.services.landmarks.   NO flags / flagpoles, no alarm sounds (user rules).
export const OWNS_GROUPS = true;
if (typeof process !== 'undefined' && process.env && process.env.LM_DEBUG) globalThis.__lmDebug = true;

import * as THREE from 'three';
import { makeKit } from './landmarksE/common.js';
import { makeG } from './landmarksE/mats.js';
import { makeTrees } from './landmarksE/trees.js';

// [part, the sub-group of layout.GROUPS.landmarksE it draws, loader]. A part is built only when the area claims its sub-group (n4spb, Vladimirsky-Ligovka: the Alexandrinsky Theatre, the Anichkov Palace and the Ostrovsky houses lie in
// its territory, the Gostiny Dvor, the Catherine Garden and the National Library 100 m to 1 km west of it, in Palace-Liteyny, which claims all six: its output is what it was).
const PARTS = [
  ['gd', 'gostiny-dvor', () => import('./landmarksE/gd.js')],
  ['promenade', 'gostiny-dvor', () => import('./landmarksE/promenade.js')],
  ['garden', 'catherine-garden', () => import('./landmarksE/garden.js')],
  ['theatre', 'alexandrinsky-theatre', () => import('./landmarksE/theatre.js')],
  ['library', 'national-library', () => import('./landmarksE/library.js')],
  ['anichkov', 'anichkov', () => import('./landmarksE/anichkov.js')],
  ['houses', 'ostrovsky-houses', () => import('./landmarksE/houses.js')],
];

export async function build(ctx) {
  const K = makeKit(ctx);
  K.svc = { houses: [], entrances: [], monuments: [], photoSpots: [], spots: {}, benches: [], lamps: [] };
  K.G = makeG(K);
  K.trees = makeTrees(K);
  const root = new THREE.Group(); root.name = 'landmarksE'; K.root = root;
  const failed = [], t0 = Date.now(), times = {}, tris = {};
  const claimed = new Set((K.L.GROUPS.landmarksE || []).map((g) => g.key));      // the sub-groups of THIS area
  for (const [name, group, load] of PARTS) {
    if (!claimed.has(group)) continue;
    const t = Date.now(), n0 = K.tris;
    try {
      const m = await load();
      K.begin();
      await m.build(K, ctx);
      K.flush(root, name);
    } catch (e) { console.error(`[landmarksE] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); K.begin(); }
    times[name] = Date.now() - t; tris[name] = K.tris - n0;
  }
  try { K.trees.build(root); } catch (e) { console.error('[landmarksE] trees failed:', e); failed.push('trees: ' + (e && e.stack || e)); }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(K.svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(K.svc.photoSpots);
  S.benches = (S.benches || []).concat(K.svc.benches);
  ctx.services.landmarksE = { houses: K.svc.houses, entrances: K.svc.entrances, spots: K.svc.spots, benches: K.svc.benches, lamps: K.svc.lamps, monuments: K.svc.monuments, triangles: K.tris, ms: Date.now() - t0, times, tris };
  if (typeof process !== 'undefined' && process.env && process.env.LM_DEBUG) console.log('[landmarksE] tris', JSON.stringify(tris), 'ms', JSON.stringify(times), 'trees', K.trees.count, 'entr', JSON.stringify(K.svc.entrances.map((e) => e.id)));
  if (failed.length) throw new Error('landmarksE parts failed:\n' + failed.join('\n'));
}
