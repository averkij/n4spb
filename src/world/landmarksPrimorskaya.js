// landmarksPrimorskaya - PRIMORSKAYA: the surface vestibule of the metro station (a glazed hall with three entrances and the two-storey block beside it), the square before it (the claimed benches and bins of the OSM data, the М totem,
// lamps, planters), the signboard of the Museum of the Petersburg Metro, and two flights of granite stairs down the north bank of the Smolenka. AUTHORED for n4spb (docs/gdm-D2.md): the source project never drew the island
// (docs/research/gaps-vo-2026.md G05 / G07: "Primorskaya vestibule + Smolenka bank stairs"; its metro had a dead tunnel stub). NO METRO NETWORK and no hall under the ground exist in this build: the doors stay shut, the three
// entrances are door points (ctx.services.landmarksPrimorskaya.entrances, cleared of trees by PRUNE_SERVICES) and nothing is interactive.
// WHERE: the vestibule stands at (-6520, -1800), on the mapped buildings w149345779 (hall) and w149345769 (block); the station NODE n249307184 and the underground platform lie 190 m east under the apartment blocks (groups.js).
// Files: landmarksPrimorskaya/groups.js (claims, the stair rings: WATER_RINGS / KEEP_OUT / PAVED_RINGS) mats.js (materials, lit signs) vestibule.js (hall, block, doors, porches, door points, wall colliders) square.js (knock furniture, the
// totem, the museum sign) stairs.js (the pits, steps, colliders, breakable parapets) kit.js inst.js (copies of landmarksVOStatues / landmarksSeaTerminal helpers).
// WORLD RULES (docs/AREAS.md 13): the stairs end in the water (no guard box); the parapet beside them, every bench, bin, planter, lamp, the totem and the museum sign are knock bays / records; solid on purpose: the walls of the hall and
// of the block (addPolyColliders), the slim porch posts. No flags, no flagpoles. Publishes ctx.services.landmarksPrimorskaya = { triangles, entrances, pits, furniture, colliders, knock, walls }.
// Provenance: new module (no source file); kit.js / inst.js are copies, see their headers; the stair recipe follows bridges/pits.js and sculpt6.js (commit 0568f7af of the source project, ported with the bridges).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksPrimorskaya/kit.js';
import { makeMats } from './landmarksPrimorskaya/mats.js';
import { GROUPS_LIST } from './landmarksPrimorskaya/groups.js';
import { vestibule } from './landmarksPrimorskaya/vestibule.js';
import { square } from './landmarksPrimorskaya/square.js';
import { stairs } from './landmarksPrimorskaya/stairs.js';

export function build(ctx) {
  const t0 = performance.now();
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksPrimorskaya) || GROUPS_LIST).map((g) => g.key));
  const root = new THREE.Group(); root.name = 'landmarksPrimorskaya';
  const M = makeMats(ctx);
  const svc = { triangles: 0, entrances: [], porchPosts: [], pits: [], stairsSkipped: [], furniture: {}, colliders: 0, knock: 0, walls: 0, extraTris: 0 };
  const K = { ctx, M, THREE, root, svc, P: new Parts(), extraTris: 0 };
  if (claimed.has('primorskaya-vestibule')) vestibule(K);
  if (claimed.has('primorskaya-square')) stairs(K);
  let tris = 0;
  const meshes = K.P.build(root, { name: 'lmprim' });
  for (const m of meshes) { if (m.material === M.road) { m.castShadow = false; ctx.noOutline(m); } else if (m.material === M.vc2 || m.material === M.signName || m.material === M.signM) ctx.noOutline(m); }
  tris += K.P.tris;
  if (claimed.has('primorskaya-square') || claimed.has('metro-museum')) tris += square(K);
  ctx.addStatic(root);
  delete svc.porchPosts;
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []); S.photoSpots = (S.photoSpots || []);
  svc.triangles = tris + K.extraTris;
  svc.buildMs = Math.round(performance.now() - t0);
  ctx.services.landmarksPrimorskaya = svc;
  if (typeof process !== 'undefined' && process.env && process.env.PRIM_DEBUG) console.log('[landmarksPrimorskaya]', JSON.stringify({ ...svc, entrances: svc.entrances.length }));
}
