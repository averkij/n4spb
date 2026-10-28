// landmarksKirova - the KIROV PALACE OF CULTURE (Дворец культуры им. С. М. Кирова, Bolshoy pr. V.O. 83; N. A. Trotsky, S. N. Kozak, E. A. Ilyin, 1930-37: a 200 m long pink stucco front, two niche pavilions,
// the dark rough-stone portal, the glazed podium, the tower with the glass drum, the 1968 low gallery and white pavilion, the horseshoe cinema and the unfinished west arm behind), SOBCHAK SQUARE (the
// asphalt car park in front of it: left to streets) with the SOBCHAK MONUMENT (I. Korneev, 2006) in the Bolshoy boulevard skver, the VASILEOSTROVETS GARDEN (сад «Василеостровец»: 4.7 ha, iron fence on a
// stucco plinth with round posts, the south gate with two small pavilions, gravel alleys, two lawns with 20 ovoid thuja, the Roerich monument of 2010, benches, lamps, playground, ruin patch) and the ERARTA
// MUSEUM (Эрарта, 29th line 2: a Stalinist neoclassical 90 m front, eight-column Doric portico, the white 2010 portal box, the stair with the forged-steel figures Era and Arta, the red roof letters).
// Dossier docs/research/kirova.md (written and critic-checked), photos refs/kirova.  User rules: no flags / flagpoles, no alarm sounds, summer day, plain wordmarks.
// Files (docs/research/kirova.md section 18): landmarksKirova/frame.js (frames FD / FK / FE, heights, switches LETTERS / ROOF_SIGN) art.js erart.js mats.js (every texture / material key starts with 'lmKir-')
// · PALACE dk.js (volumes) dkfront.js dkwin.js (podium, upper blocks, pavilions, east part, real window reveals) dkparts.js (portal, tower) dkrear.js (cinema, annex, rear) · ERARTA erarta.js (orchestrator) erfront.js erportico.js
// erportal.js (portal, doors, lit foyer, stair) erflank.js (flanks, rear, roofs, service doors) erwin.js erlet.js (window trim, stroke-font letters) erartaart.js erfig2.js (Era and Arta) ermir.js (Mir v kreste) erplaza.js (paving, benches) tiles.js (ONE material kind for every tiled wall painting) eryard.js (larches, bollards)
// · GARDEN garden.js (orchestrator, playground, court, toilet cabin, ruin) fence.js gate.js lawns.js roerich.js furn.js gardentrees.js · sobchak.js · figure.js (Sobchak and Roerich) · groups.js (claims)
// · kit.js geo.js inst.js surfaces.js trees.js treegeo.js leafmat.js util.js facade.js vol.js (copies of landmarksOktyabrsky / Navalcorps).  Tools: tools/landmarksKirova-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js (?kirparts=dk,erarta,garden,sobchak builds only those, KIR_PARTS in node).  Publishes ctx.services.landmarksKirova = { monuments, photoSpots, entrances, crowd,
// fences (with gates), benches, lamps, trees, beds, roofSign, parts, ... } and merges monuments / photo spots / benches into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksKirova.js and landmarksKirova/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksKirova), not when the
// module's own groups.js lists it; (2) world rules (docs/AREAS.md 13, 15.v): the garden fence (fence.js), the clipped hedges (lawns.js), the brick walls of the Erarta passage (eryard.js) and the two open gate leaves (gate.js) are
// breakable bays instead of streets/barriers.js addFenceBoxes plain boxes, the benches, the park lamps, the payment terminal, the bike rack and the six flower bowls are knock records; solid on purpose: the Palace of Culture and Erarta
// (walls), the gate pavilions and columns, the playground equipment, the monuments, the trunks and the thuja.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksKirova/kit.js';
import { makeMats } from './landmarksKirova/mats.js';
import { GROUPS_LIST } from './landmarksKirova/groups.js';
import { plantTrees } from './landmarksKirova/trees.js';

const PARTS = [
  ['dk', 'kirova-dk', () => import('./landmarksKirova/dk.js')],
  ['erarta', 'kirova-erarta', () => import('./landmarksKirova/erarta.js')],
  ['garden', 'kirova-garden', () => import('./landmarksKirova/garden.js')],
  ['sobchak', 'kirova-sobchak', () => import('./landmarksKirova/sobchak.js')],
];

/** debug / A-B switch: ?kirparts=dk,erarta,garden,sobchak (URL) or KIR_PARTS=... (node) builds only these parts */
const ONLY = (() => { try { const s = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('kirparts') : (typeof process !== 'undefined' && process.env && process.env.KIR_PARTS); return s ? s.split(',') : null; } catch (e) { return null; } })();

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx);
  const root = new THREE.Group(); root.name = 'landmarksKirova';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], trees: [], bollards: 0, triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksKirova) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [], allTrees = [], usage = new Map(), realMats = new Set();
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key) || (ONLY && !ONLY.includes(name))) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0, trees: allTrees };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksKirova] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksKirova] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    for (const k of K.P.b.values()) usage.set(k.mat.name || '?', (usage.get(k.mat.name || '?') || 0) + k.idx.length / 3);
    const meshes = K.P.build(root, { name, noCast: M.noCast });
    for (const m of meshes) { realMats.add(m.material); if (M.noOutline.has(m.material)) ctx.noOutline(m); }
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  try { if (allTrees.length) plantTrees({ ctx, root }, allTrees, 'lmKir-trees'); } catch (e) { console.error('[landmarksKirova] trees failed:', e); failed.push('trees: ' + (e && e.stack || e)); }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksKirova = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.KIR_DEBUG) { console.log('[landmarksKirova] parts', JSON.stringify(svc.parts)); console.log('[landmarksKirova] real materials', realMats.size, '(+ the tree materials); handles (colours / tiles)', usage.size, [...usage.entries()].sort((a, b) => b[1] - a[1]).map(([n, t]) => n.replace('lmKir-', '') + ':' + Math.round(t)).join(' ')); }
  if (failed.length) throw new Error('landmarksKirova parts failed:\n' + failed.join('\n'));
  void L;
}
