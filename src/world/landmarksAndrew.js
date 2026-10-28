// landmarksAndrew - ST ANDREW'S CATHEDRAL (Андреевский собор, 1764-86: rose-pink Petrine triconch, silver domes, the needle belfry) with the Church of the Three Hierarchs, the Chapel of St Vladimir, the order obelisk and
// the Golovin bust; the ANDREEVSKY MARKET (Андреевский рынок, 1789-90: a butter-yellow arcaded ring under a red hipped roof with dormers); the ANDREEVSKY BOULEVARD (the 6th-7th lines, 28 m facade to facade: granite
// promenades, the lawn strip with two rows of larches, two granite fountains, the Korchmin monument, the horse-tram monument); the VASILEOSTROVSKAYA METRO PAVILION (1967, on 11 granite steps); the PEL HOUSE with
// the Griffins Tower; the ANNUNCIATION CHURCH (Благовещенская церковь, 1750-62: yellow, five green domes, the four-tier belfry) with its forecourt, gate pavilions, the chapel of 1899 and the Blagoveshchensky garden.
// Dossier docs/research/andrew.md (+ andrew-houses.json), brief docs/VO-BRIEF.md, photos refs/andrew.  User rules: no flags / flagpoles, no alarm sounds, no corporate logos (plain wordmarks).
// Files (every texture / material key starts with 'lmAnd-'): frame.js (frames C T M V P N B) · art.js art2.js mats.js mats2.js (canvas paintings, materials; the parts add their own) · domes.js loft.js orders.js
// (crowns / spires / roofs / facade vocabulary) · cathedral.js (the cathedral: walls, portals, crossing, turrets, belfry) · hierarchs.js (Three Hierarchs) · shrines.js (chapel of St Vladimir, order obelisk, Golovin bust) ·
// precinct.js + fence.js (cathedral fence, court paving, lamps) · market.js (arcade ring, roof, dormers, the south passage into the courtyard) · boulevard.js (promenades, lawn strip, larches, lamps, rails, drain, fountains)
// · korchmin.js (Korchmin monument, horse tram) · pavilion.js (metro pavilion + its square) · pel.js (Pel house, Griffins Tower) · annunciation.js (church, belfry, domes) · garden.js (forecourt, garden, fences with gate
// pavilions, chapel of 1899, playground) · ringkit.js (ring / offset helpers) · groups.js (claims, PAVED_RINGS) · kit.js geo.js inst.js surfaces.js stucco.js trees.js treegeo.js leafmat.js util.js (copies of the
// Oktyabrsky / Karpovka kits; treegeo.js has the added 'larch').  Tools: tools/landmarksAndrew-walk.mjs (walk probe: 42 tests).
// A part is built only when its claim key is in groups.js (flip a claim on together with its part).  Publishes ctx.services.landmarksAndrew = { monuments, photoSpots, entrances, crowd, fences, benches (none: the OSM
// benches / bins stay with props), lamps, trees, metro: { podium, ceil, signs }, parts } and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksAndrew.js and landmarksAndrew/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksAndrew), not when the module's own groups.js lists it; (2) benches / bins / lamps are knock records (lib/knock-furniture.js), fences, rails and low walls are knock bays (lib/fence-bays.js), docs/vo-m3.md; (3) the water / paved rings are handed over through groups.js (src/areas/vasilyevsky/rings.js).
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksAndrew/kit.js';
import { makeMats } from './landmarksAndrew/mats.js';
import { GROUPS_LIST } from './landmarksAndrew/groups.js';

const PARTS = [
  ['cathedral', 'andrew-cathedral', () => import('./landmarksAndrew/cathedral.js')],
  ['hierarchs', 'andrew-cathedral', () => import('./landmarksAndrew/hierarchs.js')],
  ['shrines', 'andrew-cathedral', () => import('./landmarksAndrew/shrines.js')],
  ['precinct', 'andrew-cathedral', () => import('./landmarksAndrew/precinct.js')],
  ['market', 'andrew-market', () => import('./landmarksAndrew/market.js')],
  ['boulevard', 'andrew-boulevard', () => import('./landmarksAndrew/boulevard.js')],
  ['korchmin', 'andrew-boulevard', () => import('./landmarksAndrew/korchmin.js')],
  ['pavilion', 'andrew-pavilion', () => import('./landmarksAndrew/pavilion.js')],
  ['pel', 'andrew-pel', () => import('./landmarksAndrew/pel.js')],
  ['annunciation', 'andrew-annunciation', () => import('./landmarksAndrew/annunciation.js')],
  ['garden', 'andrew-annunciation', () => import('./landmarksAndrew/garden.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksAndrew';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], trees: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksAndrew) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  // contract with metro/st-vo.js (built after every landmark module): the pavilion stands on the 1.65 m podium (11 steps outside the doors), the metro ceiling is 4.6 m over its floor, the module draws the blue M
  if (claimed.has('andrew-pavilion')) svc.metro = { podium: true, ceil: 4.6, signs: true };
  ctx.services.landmarksAndrew = svc;                                   // visible to the parts while they build
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                     // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksAndrew] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksAndrew] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  svc.buildMs = Math.round(performance.now() - t0);
  if (typeof process !== 'undefined' && process.env && process.env.AND_DEBUG) console.log('[landmarksAndrew] parts', JSON.stringify(svc.parts));
  if (failed.length) throw new Error('landmarksAndrew parts failed:\n' + failed.join('\n'));
  void L;
}
