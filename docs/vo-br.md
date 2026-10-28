# Vasilyevsky-Okrug 7: cluster BR (bridges and water), branch `vo-br`

Part of the fifth live area (docs/AREAS.md 15.v). This cluster wires the bridges of the island and finishes its water. Source project: `102_3d_piter` commit 0568f7af (read only). The version is not touched here (the lead bumps).

## 1. Bridges

`GROUPS.bridges` of `src/areas/vasilyevsky/area.js` = the Palace Bridge, the Blagoveshchensky Bridge (both already there) + `bridges/groups-vo.js` (`GROUPS_VO`, copied from the source `bridges/groups.js`): Birzhevoy, Tuchkov, Uralsky, Smolensky, Nalichny, Novo-Andreevsky (44 claimed OSM ids, all drawn, `claims-draw-audit` OK). Korablestroiteley, the 1st-4th Smolensky bridges, the WHSD and the Yelagin / Petrovsky / Kamenny bridges lie outside the territory and are not claimed (their data stays in the ported files and is filtered by `BRIDGE_GROUP_KEYS`).

| bridge | builder | notes |
|---|---|---|
| Birzhevoy (239 m, 5 spans, bascule drawn closed) | `bridges/long.js` `buildLong` (spec `BIRZHEVOY`, already in the repo, now wired in `bridges.js`) | deck = chunked walk ramps; piers cut at the water like the Palace Bridge's |
| Tuchkov (220 m, 3 spans, tram tracks + contact wires) | `long.js` `TUCHKOV` | same |
| Uralsky, Smolensky | generic `arch.js` sites `VO_SITES` (`sites-vo.js`, merged into `ALL_SITES` by claims) + `styles4.js` | obelisks with gilded ships / art-cast torcheres on granite blocks |
| Nalichny (70 x 40 m, 6 lanes + 2 tram tracks) | `arch.js` site `VO2_SITES` (`sites-vo2.js`) + `styles5.js` + `sculpt6.js` + `stairs.js` + `pits.js` | four wide corner stairs (below), granite obelisks, hexagon-lattice railing, tram slab + wires, twin lamp poles |
| Novo-Andreevsky (footbridge) | `bridges/foot3.js` (`FOOT` of `sites-vo2.js`) | four torcheres, chain-loop railing |

New files (copied from the source with one provenance line each; the n4spb adaptations are marked `n4spb` in the code): `styles4.js`, `styles5.js`, `sculpt6.js`, `stairs.js`, `pits.js`, `foot3.js`, `sites-vo2.js`, `gaps.js` (hedge gaps on the approaches; only `openHedgeGaps` is used), plus the new `groups-vo.js` and `knock-posts.js`. `arch.js` needed no merge: the repo's version already has the zone kinds `tram`, `barrier`, `verge`, `walk`.

Wiring (`bridges.js`): style lookup `STYLES4` / `STYLES5`, a loop over `LONG` filtered by `BRIDGE_GROUP_KEYS`, `buildFoot3`, `openHedgeGaps` for the Nalichny / Novo-Andreevsky approaches, `extraTris` of the knock posts added to the stats, `services.bridges.pits` published. `BRIDGE_ZONES` of the area got a row per bridge (`own: true`, rows of the source `BRIDGE_SHADES`), `BRIDGE_SHADES` the six deck shades, `river.js SITE_OF` + `uralsky`, `smolensky`, `nalichny`. No floor-only rows are needed: every drawn deck is its own car / walker floor, `water-reachable-test` check 9 (15 named drivable ways) is green; a scan of ALL bridge ways of the territory finds only pedestrian footways / steps (landing stages of piers) that end in the water (a walker wades: water is reachable).

### Knock system (world rules)
Knock records / breakable bays: every railing panel (`rails.add` bays), every granite parapet section (the solid runs of `long.js` are now `rails.parapet` sections, a plain 0.46 m box, instead of merged quads: the coping stone is the parapet stone), the face "colliders" of the arch bridges (ghost bays, `rails.wall`), the wing walls that close the quay beside the decks (`closeBank` with `ctx`: ghost bays of `lib/fence-bays.js`), the Nalichny barrier strips (0.45 m granite parapets between roadway and pavement: ghost bays) and the cheek walls of the corner stairs (ghost bays; the barrier box across the river end of every flight is GONE, a walker steps off the lowest tread into the Neva), the 40 lamp standards (Birzhevoy 16 cross lamps, Tuchkov 16 cobra lamps, Nalichny 4 twin poles, Novo-Andreevsky 4 torcheres): `bridges/knock-posts.js` draws ONE post into a throw-away `Parts`, instances it (`lib/knock-furniture.js`, kind `lamp`) and registers a collider and a record per post.
Structure on purpose (solid): the piers and soffit stone (`bridges/piers.js` `solidPiers`, automatic in `flush`), the granite obelisks (Nalichny 4 blocks of 2.7 m), the pier-head blocks of the slim piers of Birzhevoy, the concrete abutment cheeks of the footbridge, the barrier kerbs between roadway and pavement of the long decks (as at the Palace Bridge; `water-reachable-test` ALLOW row widened from 2.5 to 4.2 m top for the humped decks), the deck ramps / stair floors.
Not changed (shared with the other areas): the lamp cylinders and kerbs of the Palace and Blagoveshchensky bridges stay solid cylinders (a rule gap of the Admiralty port, open item).

### Corner stairs of Nalichny
`bridges/groups-vo.js` hands `pits.js` rings of the four pits over: 4 `WATER.ownerRings` (key smolenka), 4 `KEEP_OUT`, 4 `PAVED_RINGS` (via `src/areas/vasilyevsky/rings.js`, the `bridges` slot). Checked: all four are water for `layout.inRiver`, the ground steps from the street (0.0) down to the landing (-2.33), the lower steps (-2.93) and the bed (-4.4).

## 2. Water

* **Malaya Neva** (new, `WATER.dataRings` `{ id, key, source }`). The data cut holds no polygon for the Malaya Neva (RIVER `malaya-neva` has no polys); the repo's `neva-malaya.js` is the same OSM ring but a scenery piece, which is NOT water for `waterwayAt` / physics: the Tuchkov Bridge crossed dry land. `waterways.js build()` now clips a listed scenery ring to the box of the data region and adds it as a DATA ring (real banks, quay walls, bed, `inRiver`), the scenery source then starts beyond the data region (`inData` false). Inert for every other area (`dataRings` empty).
* **Neva Bay patches** (`dataRings` with an explicit `ring`): the data polygons of the Bolshaya Neva end on the seams z 1370 / 1720 / 1770 of the source bake, but the territory goes on to z 1920 (rectangles VO56 .. VO63): ~300 000 m2 of the play area were flat dry ground. Three rectangles of water (`bay-a/b/c`, down to the data border z 2640) fill them.
* **clipLines**: x -4420 and -4430 (the rims of polygons 2:0 / 2:1 overlap by 10 m: each stood as a quay wall across the bay, 1.4 km), x -5370 and -6070 (unequal edge lengths of neighbours: a wall across the water), the cut lines z 1370 / 1720 / 1770 and x -5000 of the bay patches. `openMouths`: none needed.
* **pierFit** (new `WATER.pierFit`): the pier mole w74745049 is a 256 x 9 m sliver with bumps; its oriented bounding rectangle was 255 x 40 m and made a 10 000 m2 invisible pontoon wall (boat oracle b2). Replaced by the real 256 x 9.6 m rectangle.
* Smolenka rail rule `x < -7490 -> none`: outside the territory (x >= -7120), not needed. Gulf of Finland ring (`VO_SEA`, 879 vertices with a bank mask): NOT ported, it needs `bankMask` support in `waterways.js` and only shows beyond x -7840; the west horizon beyond the data region stays land (open item).
* Boats: the area has no dock (the shared table docks only Anichkov); the water is sailable: `boat-passage-test` crosses 31 bridge rows / decks and 21 pillars, one body of boat-free water of 2.77 km2.

## 3. Shared files edited (all additive, keyed by area tables)
`bridges.js`, `bridges/sites.js` (VO sites merged into `ALL_SITES` only where claimed), `bridges/long.js` (knock adaptations; `buildLong` was not called by any area before), `environment/waterways.js` (`dataRings`), `environment/boats.js` (`pierFit`), `environment/river.js` (`SITE_OF` rows), `lib/area-tables.js` (`WATER.dataRings`, `WATER.pierFit`), `tools/water-reachable-test.mjs` (two ALLOW rows), `tools/check.mjs` (`bridges` budget), `package.json` (`boatpass` + vasilyevsky). Proof that the other areas build as before: the per-module `triangles` of `node tools/area.mjs <area> tools/check.mjs --area-modules` are IDENTICAL before and after for palace, smolny, admiralty and vladimirsky (every module), the two layout goldens are identical (`npm run golden`, `golden:north`).

## 4. Numbers
`check --area-modules` (vasilyevsky): bridges 89,974 triangles (foundation 49,900), environment 1,129,393 (foundation 1,152,944: the far walls of the Malaya Neva inside the extent are replaced by real banks). Knock records (headless build of the six base modules): lamps 2,037 -> 2,077 (+40 bridge standards), fence bays 12,831 -> 12,785 (the bridges add ~1,000 rail panels, parapet sections and ghost bays; the 1.4 km of quay-wall bays along the old seam walls and the far-wall pieces are gone), colliders 33,493 -> 34,279.

HUD: `makeAreas` got a row per new bridge (Birzhevoy, Tuchkov: `_deck` bands; Uralsky, Smolensky, Nalichny, Novo-Andreevsky: discs).

## 5. Oracles (CPU, this branch, all run last on the final tree)
`water-reachable-test` (full, 17 checks) 17 passed; `boat-passage-test` ALL 65 PASSED (was 2 failed: seam walls and the 40 m pontoon); `boat-craft-test` ALL 3 PASSED; `check --area-modules` RESULT OK (no module errors); `landmarks-groups-check`, `layout-test`, `claims-draw-audit` (1 warning: the sphinx steps way, as in Admiralty), `owns-table --check` (36 modules, unchanged), `import-lint`, `runtime-only-lint`: OK. Before: `water-reachable-test --quick` of the foundation failed check 9 (8 undrawn bridge ways).

## 6. Open items
* Gulf of Finland ring (`VO_SEA`) not ported (needs `bankMask`); the horizon west of x -7840 is land.
* Lamp cylinders / kerbs of the Palace and Blagoveshchensky bridges are still solid (shared with the other areas).
* The Birzhevoy / Tuchkov / Blagoveshchensky bascules are drawn closed (no opening); NPC pedestrians do not walk the long decks (`people/nav.js LBAND`).
* `VO_NEVA_BAY` look: the bay patches are plain water to the data border, the real southern shore of the bay (beyond z 1920) is not drawn.
* The look of the ported bridges was not checked on a GPU.
