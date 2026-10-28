// landmarksSeaTerminal - the SEA TERMINAL (Морской вокзал, V. A. Sokhin, L. V. Kalyagin et al., 1982: a 100.9 x 55.7 x 29 m grey prism of three tiers of arched hotel hoods over ONE band of fluted aluminium "sails" with
// down-curved claws, a two-tier concrete forecourt on mushroom piers, the roof lettering МОРСКОЙ ВОКЗАЛ, the black clock-tower emblem and the 78 m titanium needle with a gilded globe and caravel on the SEA face),
// MARINE GLORY SQUARE (no monument: the vista only; the module adds the lot barriers and fences), the museum submarine D-2 «Народоволец» with its pavilion and exhibits, the TORPEDO-BOAT monument «Комсомолец» on its granite
// plinth, and the fenced LENEXPO building site (hoarding + closed gates; no sight).  Gavan sea front of Vasilievsky Island (rect V8, x -6700 .. -6250).
// Dossier docs/research/seaterminal.md (+ seaterminal-houses.json), brief docs/VO-BRIEF.md, photos refs/seaterminal, requests to the other owners docs/research/vo-requests-landmarksSeaTerminal.md.
// User rules: no flags / flagpoles (the seven poles of the deck, the four behind the D-2 stone, the Lenexpo gate poles and the pennants of the caravel are left out), no alarm sounds (the D-2 and torpedo-boat guns are silent
// static props), summer day, no corporate logos (plain wordmarks only).
// Files: landmarksSeaTerminal/frame.js (frames T = terminal, D = submarine, B = torpedo boat; heights) art.js mats.js (every texture / material key starts with 'lmseate-') geo.js (grids, arch frames) fence.js (fence runs) ·
// terminal.js (prism skin, hood frames, sails, glazing, roof, colliders) deck.js (deck slabs, screens, piers, ramp, stair, asphalt) top.js (clock tower, emblem, lettering, pylon, cup, needle, globe, caravel, lanterns) quay.js (port fence,
// lift gate, quay closure, bollards, gangway, Jersey barriers) · sub.js (D-2, pavilion with the museum door, yard, exhibits, stone, path lamps) · boat.js (torpedo boat, plinth, lawn, chain, plaque) · site.js (Lenexpo hoarding) · shed.js (the blue-roofed port shed w128448740 NW of the deck) · fence.js (open fences leave gaps on asphalt, closed runs do not) · groups.js (claims, KEEP_OUT, PAVED_RINGS) ·
// kit.js inst.js util.js (copies of landmarksOktyabrsky).  Tools: tools/landmarksSeaTerminal-walk.mjs (walk probe).
// A part is built only when its claim key is in groups.js.  Publishes ctx.services.landmarksSeaTerminal = { terminal, monuments, photoSpots, entrances, crowd, fences, benches, lamps, parts }
// and merges monuments / photo spots into ctx.services.landmarks.
// Provenance: copied from 102_3d_piter commit 0568f7af (src/world/landmarksSeaTerminal.js and landmarksSeaTerminal/*); changes for n4spb: (1) a part is built when THE AREA claims its sub-group (layout.GROUPS.landmarksSeaTerminal; this
// area claims only 'sea-terminal': groups.js ON), not when the module's own groups.js lists it; (2) world rules (docs/AREAS.md 13, 15.v): the port mesh fence and the quay closure (fence.js), the torpedo-boat chain (boat.js) are
// breakable bays, the Jersey barriers and the boat's plaque stand are knock records, the thin box of the closed ramp gate (inside the ramp embankment box) is gone; solid on purpose: the terminal walls, the deck piers, the stair block,
// the ramp embankment and its walls, the shed, the plinth and the boat.
export const OWNS_GROUPS = true;

import * as THREE from 'three';
import { Parts } from './landmarksSeaTerminal/kit.js';
import { makeMats } from './landmarksSeaTerminal/mats.js';
import { GROUPS_LIST } from './landmarksSeaTerminal/groups.js';
import { makeTileKit } from './landmarksSeaTerminal/tiles.js';

const PARTS = [
  ['terminal', 'sea-terminal', () => import('./landmarksSeaTerminal/terminal.js')],
  ['deck', 'sea-terminal', () => import('./landmarksSeaTerminal/deck.js')],
  ['top', 'sea-terminal', () => import('./landmarksSeaTerminal/top.js')],
  ['quay', 'sea-terminal', () => import('./landmarksSeaTerminal/quay.js')],
  ['shed', 'sea-terminal', () => import('./landmarksSeaTerminal/shed.js')],
  ['sub', 'd2-narodovolets', () => import('./landmarksSeaTerminal/sub.js')],
  ['boat', 'torpedo-boat', () => import('./landmarksSeaTerminal/boat.js')],
  ['site', 'lenexpo-site', () => import('./landmarksSeaTerminal/site.js')],
];

export async function build(ctx) {
  const t0 = performance.now();
  const M = makeMats(ctx), TK = makeTileKit(ctx, 'lmseate');
  const root = new THREE.Group(); root.name = 'landmarksSeaTerminal';
  const svc = { monuments: [], photoSpots: [], entrances: [], crowd: [], fences: [], benches: [], lamps: [], triangles: 0, parts: {} };
  const claimed = new Set(((ctx.L && ctx.L.GROUPS && ctx.L.GROUPS.landmarksSeaTerminal) || GROUPS_LIST).map((g) => g.key));      // the sub-groups of THIS area (n4spb)
  const failed = [];
  for (const [name, key, load] of PARTS) {
    if (!claimed.has(key)) continue;                                   // a part is built only when its claim is on (groups.js): no double drawing with the generic city
    const t1 = performance.now();
    const K = { ctx, M, THREE, P: new Parts(), svc, root, extraTris: 0 };
    try {
      const m = await load();
      await m.build(K);
    } catch (e) { console.error(`[landmarksSeaTerminal] ${name} failed:`, e); failed.push(`${name}: ${e && e.stack || e}`); }
    for (const k of K.P.b.values()) { const bad = k.pos.findIndex((v) => !Number.isFinite(v)); if (bad >= 0) console.warn(`[landmarksSeaTerminal] ${name}: NaN vertex in ${k.mat.name} at ${bad / 3 | 0}`); }
    const tris = K.P.tris + K.extraTris;
    const meshes = TK.build(K.P, root, { name: 'lmseate-' + name, noOutline: (m) => M.cutouts.has(m) || M.decals.has(m) || M.glassy.has(m), noCast: (m) => M.decals.has(m) });      // tiles.js: tiled paintings -> one atlas kind, plain colours -> vertex colours
    for (const m of meshes) if (M.cutouts.has(m.material) || M.decals.has(m.material) || M.glassy.has(m.material)) ctx.noOutline(m);
    svc.triangles += tris; svc.parts[name] = { tris, ms: Math.round(performance.now() - t1) };
  }
  if (typeof process !== 'undefined' && process.env && process.env.SEATERM_KINDS) (await import('./landmarksSeaTerminal/probe.js')).probe(root, 'landmarksSeaTerminal');
  TK.finalize();
  ctx.addStatic(root);
  const S = (ctx.services.landmarks ||= {});
  S.monuments = (S.monuments || []).concat(svc.monuments);
  S.photoSpots = (S.photoSpots || []).concat(svc.photoSpots);
  ctx.services.landmarksSeaTerminal = { ...svc, tiles: TK.stats, buildMs: Math.round(performance.now() - t0) };
  if (typeof process !== 'undefined' && process.env && process.env.SEATERM_DEBUG) console.log('[landmarksSeaTerminal] parts', JSON.stringify(svc.parts), 'fence pieces left out on carriageways', svc.fenceRoadGaps || 0);
  if (failed.length) throw new Error('landmarksSeaTerminal parts failed:\n' + failed.join('\n'));
}
