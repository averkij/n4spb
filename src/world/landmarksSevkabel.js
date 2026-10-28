// landmarksSevkabel - SEVKABEL PORT, the BRUSNITSYN quarter and the industrial skyline of the Kozhevennaya line (south-west shore of Vasilievsky Island, rects V6 / V7 / V8).
//   sevkabel-hall      the 157 x 50 m board-marked concrete hall 40B with the comb of 11 stepped ribs on the river face, the gable ends, the gantry gallery with the yellow stair tower, the alley bridge, the timber deck,
//                      the lawn with the four leaning boards, the slab path, the larch quay rail, the pier plaza (gravel, bollards, the ticket container).
//   sevkabel-yard      the red-brick Siemens & Halske blocks around the inner square (40D with the 42 m brick chimney, 40E), the 1970s block 40A with its prism and glass pyramid, the silent "Tesla coil", the gate of four
//                      rotating Corten pylons, spool towers, the upturned boat, pavers.
//   chp7               the three red-and-white 120 m chimneys of CHP-7 and the sheet-clad plant block (closed site, exterior only).
//   baltic-cranes      14 lattice portal cranes of the Baltic Shipyard on their five runways (instanced, silhouette).
//   sevkabel-istkabel  Istkabel, the white former printed-cotton factory (17 parts: the river wing, the north wing, the courtyard blocks).
//   brusnitsyn         the mansion (1884-86), the pink house 27/1 with three porticoes, the leather factory 28-30, the skyway over the lane; almshouse: the Suzor almshouse (1895-96) with its fence and anchors.
//   skobsky            the 165 m long six-storey "Skobsky Palace".
// Dossier docs/research/sevkabel.md (read it for every number: frames, heights, colours, photo table), photos refs/sevkabel.  User rules: no flags / flagpoles (the five sea-square flagpoles and the shipyard masts are not drawn),
// no alarm / siren / horn sounds (the Tesla generator is a silent static prop), no corporate logos, summer day.
// Files: landmarksSevkabel/frame.js (frames H hall / M mansion / K Skobsky / A almshouse, runways, chimneys) art.js mats.js (every texture / material key starts with 'lmsevka-') · hall.js promenade.js yard.js chp.js cranes.js quarter.js
// istkabel.js skobsky.js almshouse.js common.js facade.js · groups.js (claims, PAVED_RINGS, KEEP_OUT) · kit.js inst.js util.js surfaces.js (copies of landmarksOktyabrsky).  Tools: tools/landmarksSevkabel-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js (flip a claim on together with its part).  Publishes ctx.services.landmarksSevkabel = { monuments, photoSpots, entrances, crowd, fences, benches, lamps, parts, ... }
// and merges monuments / photo spots into ctx.services.landmarks.
// 2026-10-11 cultural detail pass: fair.js opens the main hall for a summer
// market; culture.js adds dining terraces, food trailers, stage/art and festoons.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksSevkabel.js and landmarksSevkabel/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksSevkabel), not when the
// module's own groups.js lists it; (2) world rules (docs/AREAS.md 13, 15.v): the almshouse fence and the Brusnitsyn yard wall are breakable bays, the food trailers, the fair stalls, the partitions, the workshop counter, the sofas, the
// café / picnic / hall tables, the planters, the print stands, the coffee counter and the programme boards are knock records (culture-kit.js knockCaptured: the same drawing, captured into the record); solid on purpose: the hall, the
// yard and the quarter buildings (walls), the steel columns of the fair, the chimneys, the Corten gate plates, the spool towers, the boat and the cable-ring installations, the stage, the crane legs.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import * as L from './layout.js';
import { Parts } from './landmarksSevkabel/kit.js';
import { makeMats } from './landmarksSevkabel/mats.js';
import { makeCulture } from './landmarksSevkabel/culture-kit.js';
import { GROUPS_LIST } from './landmarksSevkabel/groups.js';

const PARTS = [
  ['hall', 'sevkabel-hall', () => import('./landmarksSevkabel/hall.js')],
  ['promenade', 'sevkabel-hall', () => import('./landmarksSevkabel/promenade.js')],
  ['yard', 'sevkabel-yard', () => import('./landmarksSevkabel/yard.js')],
  ['fair', 'sevkabel-hall', () => import('./landmarksSevkabel/fair.js')],
  ['culture', 'sevkabel-yard', () => import('./landmarksSevkabel/culture.js')],
  ['chp', 'chp7', () => import('./landmarksSevkabel/chp.js')],
  ['cranes', 'baltic-cranes', () => import('./landmarksSevkabel/cranes.js')],
  ['quarter', 'brusnitsyn', () => import('./landmarksSevkabel/quarter.js')],
  ['istkabel', 'sevkabel-istkabel', () => import('./landmarksSevkabel/istkabel.js')],
  ['almshouse', 'almshouse', () => import('./landmarksSevkabel/almshouse.js')],
  ['skobsky', 'skobsky', () => import('./landmarksSevkabel/skobsky.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeCulture(ctx, makeMats(ctx));
  const root = new THREE.Group(); root.name = 'landmarksSevkabel';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksSevkabel) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksSevkabel] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksSevkabel] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    if (typeof process !== 'undefined' && process.env && process.env.SEV_DEBUG) {        // debug: a vertex outside the module's area (a wrong frame)
      for (const k of K.P.b.values()) for (let i = 0; i < k.pos.length; i += 3) if (k.pos[i] < -6400 || k.pos[i] > -4400 || k.pos[i + 2] < 600 || k.pos[i + 2] > 1700) { console.warn(`[landmarksSevkabel] ${name}: far vertex ${k.pos[i].toFixed(1)}, ${k.pos[i + 1].toFixed(1)}, ${k.pos[i + 2].toFixed(1)} in ${k.mat.name}`); break; }
    }
    const tris = K.P.tris + K.extraTris;
    const meshes = K.P.build(root, { name });
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1), meshes: meshes.length };
  }
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksSevkabel = { ...svc, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.SEV_DEBUG) {
    console.log('[landmarksSevkabel] parts', JSON.stringify(svc.parts));
    const used = new Map(); root.traverse((o) => { if (o.isMesh) used.set(o.material, (used.get(o.material) || 0) + 1); });
    console.log('[landmarksSevkabel] materials used', used.size, 'meshes', [...used.values()].reduce((a, b) => a + b, 0), [...used.entries()].map(([m, n]) => `${m.name || m.type}:${n}`).join(' '));
  }
  if (failed.length) throw new Error('landmarksSevkabel parts failed:\n' + failed.join('\n'));
  void L;
}
