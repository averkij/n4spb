# Gavan, cluster G: landmarksGavan, the `gavan` waterway, the Sea Terminal claim (branch `gdm-g`)

Part of the sixth live area (docs/AREAS.md 15.g, id `gavan`, map k=49, letter G). Ported verbatim from the source project 102_3d_piter at commit 0568f7af (`git diff 0568f7af HEAD` of the source is empty for the project, so the pin is still the truth), adapted as the
Vasilyevsky wave did (docs/AREAS.md 15.2 "World rules in the ported modules", docs/vo-m1..m4.md, docs/vo-br.md). Scout: `D:/git2/n4spb-work/gdm/scout-gavan.md` (sections 3.1, 3.3, 4). The lead merges this branch with the others; this file is the only document of the cluster.
Two commits: G-1 (the engine round: rows only, nothing else) and G-2 (the module port and the area slots). No version bump (the lead bumps once), nothing pushed.

## Modules

| Module | Files | Triangles (`node tools/area.mjs gavan tools/check.mjs --area-modules`) | Colliders | BUDGET_AREA.gavan |
|---|---|---|---|---|
| `landmarksGavan` | 27 + 1 (the main file; 2,950 source lines) | 60,323 (62,233 in the first standalone run `check.mjs landmarksGavan` without `streets`: the road-cover test cuts less) | 875 (779 before the 96 float blocks of the yacht club were added) | 70e3 (measured + 15 %) |
| `landmarksSeaTerminal` (now 4 groups in gavan) | unchanged files, `groups.js` + `sub.js` edited | 63,258 (29,383 in vasilyevsky: the terminal alone) | 815 (292) | 73e3 (was an estimate of 65e3) |

Per part of landmarksGavan (probe, with streets built): kron 3,468 / stair 78 / canal 17,157 / bridge 2,858 / harbour 2,094 / tower 384 / guard 1,143 / club 4,210 / town 15,747 / fire 1,984 / church 11,200 triangles.
The module carries one provenance paragraph above `OWNS_GROUPS` (as the other ports do) and publishes `ctx.services.landmarksGavan = { monuments, photoSpots, entrances, crowd, fences, benches, lamps, plaques, bridge: { deckY, ... }, stair, parts }`
(and merges monuments / photo spots into `services.landmarks`); `claimed` reads `ctx.L.GROUPS.landmarksGavan` with the `GROUPS_LIST` fallback. `landmarksGavan` is in `PRUNE_SERVICES` (no entrance is published today: the list stays empty), `util.js` is an orphan of the
source (nothing imports it; listed in `tools/lib/closure-orphans.txt`, as the other ports' `util.js`).

## Groups claimed (`area.js`)

* `landmarksGavan`: all 7 (`gavan-kronshpits`, `gavan-bridge`, `gavan-canal`, `gavan-harbour`, `gavan-workers-town`, `gavan-fire-reserve`, `gavan-church`), 100 % in the territory and the 120 m margin; `TEST.claimed` row `w17564513` / `gavan-workers-town`.
* `landmarksSeaTerminal`: all 4 (`sea-terminal`, `d2-narodovolets`, `torpedo-boat`, `lenexpo-site`) through `GROUPS_ALL` of `landmarksSeaTerminal/groups.js`; `tools/landmarks-groups-check.mjs` passes for all four in gavan (the torpedo boat that failed in Vasilyevsky lies inside the Gavan rectangles).
  **The claim is per area:** `groups.js` keeps `ON = ['sea-terminal']` and the exports `GROUPS_LIST`, `PAVED_RINGS`, `KEEP_OUT` (Vasilyevsky reads exactly those, unchanged) and adds `GROUPS_ALL`, `pavedRingsFor(keys)`, `keepOutFor(keys)`; gavan's `area.js` takes `GROUPS_ALL`, gavan's `rings.js` builds the Sea Terminal rings with all four keys
  (the D-2 plaza ring, the `d2-bow` keep-out, the torpedo-boat lawn join the terminal's). The module's own gating (`ctx.L.GROUPS.landmarksSeaTerminal`) was already per area.

## Engine rows (commit G-1; shared files, ADDITIVE and KEYED)

| file | row |
|---|---|
| `environment/waterways.js` | `WATERWAYS.gavan` { water -3.4, bed -4.5, wall 'gavan', rail [], post twostep, postW 0.45, postH 1.0, bay 2.7, width 40, shadeH 3.0 } (the source's row) |
| `environment/quay.js` | wall tones row `gavan` (cream blocks, `big: 1`), `POST.gavan = 'twostep'`, the canvas-skip rule of the Smolenka (`face[k].empty && faceDeck[k].empty`) extended to `gavan` (the other areas allocate no extra wall canvas) |
| `environment/water.js` | look row `gavan` |
| `bridges/sites.js` | `WATER_Y.gavan = -3.4` |
| `wildlife/world.js` | `POST_Y.gavan = 1.24` |
| `bridges.js` | the EXT block of the source (`extY`, `EXT` row `shkipersky`, `pub.push` of the entry): filtered by the area's claim (`ctx.L.GROUPS.landmarksGavan` non-empty), so an area that does not claim the module gets no row, no list entry, no deck query (`deckY` returns `null` exactly as before). B owns the WHSD glue of this file: the block sits between `const deckY` and the `masts` line, two small hunks |
| `src/areas/gavan/area.js` | `WATER.dataWater` rows `w10890576` + `r1648985` -> `gavan`, `BRIDGE_ZONES` row `shkipersky-deck` (own: true) + `BRIDGE_SHADES` row |
| `tools/golden/layout-strip.json`, `layout-north.json` | regenerated with `node tools/layout-golden.mjs --out ...` / `node tools/area.mjs north tools/layout-golden.mjs --out ...`: the ONLY difference is the new leaf `layout.consts.WATERWAYS.gavan` (14 added lines each) |

NOT ported (look only, scout 4.2): `environment/vo-banks.js` / `revet.js` (grass banks of Galerny Harbour, the rubble revetment of the Gulf, the limestone mole style of the canal mouth): the harbour and the mole ends get the generic granite wall (`wall: 'gavan'`) and an open edge; the quay edge is open to the water.

**Proof that the other areas are unchanged** (`node tools/area.mjs <area> tools/check.mjs --area-modules` before, in a clean worktree of `area-gdm`, and after; module lines tri / mesh / inst / colliders and the knock-record counts per kind): palace, smolny and vasilyevsky IDENTICAL on the G-1 state plus the area edits (32 / 25 / 28 result lines each), and palace and vasilyevsky IDENTICAL again on the final tree of this branch (Sea Terminal `groups.js` / `sub.js`, the `claimsOf` gate of the EXT block, the new `landmarksGavan` files): the sums of
`triangles / meshes / instances / colliders` of every module and the knock registration by kind are the same (the logs: palace 22,724 and vasilyevsky 23,952 knock records, as before). `layout-golden --diff` of the strip and the north: identical to the regenerated goldens.

## World rules: what became a knock bay / knock record

Method: `lib/fence-bays.js` `knockBays` (+ `splitBays`, `unitPanel`, `unitBox`), `lib/knock-furniture.js` `knockFurniture`, `lib/craft-solids.js` `addFloatBlock`; `landmarksGavan/inst.js` got `kBays(K, o)` (as the other ports; the triangles of the instances join `Q.extraTris`).

* **`fence.js`** is the one fence builder (`fenceRun`, `postInstances`, `solidRuns`, `flushWalls`). `fenceRun` no longer draws the panels into the static Parts and `solidRuns` no longer exists: `fenceRun` collects one bay per panel (`res.bays`, fan panels flagged) and `fenceBays(Q, name, bays, opts)` registers them (collider 0.3 m x `solidH` as the
  source's `addFenceBoxes`, a panel part per bay, one knock record, `kind: 'fence'`); the posts stay static instances (as in Kirova). `wallBays` is the same for solid walls (body + cap + extra parts). `flushWalls` (the building's own wall colliders of the fire reserve) is a structure and stays.
  Gates and road gaps stay open (no bay there: the cover test of `fenceRun` is unchanged).
* **`canal.js`**: the promenade fence 348 bays (338 bar panels, 10 sunburst fans; 440 m + the cross fence at the MChS corner), the closed-gate branch (switch `PROMENADE_OPEN` off; dead today) is one bay; the Priboy works wall on the west coping 98 bays of 4 m (the source: segments of 8 m + `addFenceBoxes`);
  the twin-globe standards (4 + low ball lamps 22 = 26 with streets built, 32 standalone) are `knockFurniture` records (`lamp`, the low ones lighter: mass 40, r 0.12). The five boulders (r <= 0.85, 0.7 m high) stay solid: stones, not walls.
* **`harbour.js`**: the 1.2 m white crane fence (9 bays); `townAnnex.js`: the passage fence (2 bays); **`church.js`**: the 83 m grey hoarding (24 bays of 3.4 m, the two passport sheets hang on their bays).
* **`stair.js`** (the 13-step flight into the canal at the east mole): the invisible guard `FK.box(U0 - 0.25, ..., -6 .. WATER + 0.9)` ("nobody steps off the bottom tread") is GONE (probe: no collider across the foot of the flight, a walker on the bed and a wader pass); the two cheek walls (0.3 m thick, bed to 0.3 m over the lawn) are two breakable GHOST bays
  (their drawing stays in the static mesh, as the Makarova lions). `groups.js` hands `WATER_RINGS` (`east-mole-stair`, key `gavan`), 4 `KEEP_OUT` (kronshpits-mouth, nevsky-yc-west / -east, canal-berm) and 6 `PAVED_RINGS` to `rings.js` (`GAVAN` source line); the probe confirms `sunk: true` (the ring is honoured: `inRiver` at the stair).
* **`bridge.js`** (the Shkipersky Bridge, 1997 Mabey truss): (1) the walk box `FB.walk(ph, 0, 0, 2 * HWALK, 8.9, DECK, -8)` was a solid slab down to -8 m under the whole bridge: its bottom is now `DECK - 1.0` = the soffit (girders hang to -0.80, 2.6 m over the water): a boat passes; (2) the W-beam + posts (north), the low outer rail
  (kerb strip, posts, two rails; south) and the divider rail become 17 + 17 + 16 bays with their drawing (the static drawing is removed, the colliders DECK-1 .. DECK+1.1 / DECK .. DECK+1.15 as the source); (3) the two wing-wall blocks (u +-(16.5 .. 18.6), v -6.0 .. -4.3, bed to 1.3 m) are breakable ghost bays;
  (4) the two bearing BENTS (four steel tubes with X bracing at u +-11.25) are one solid box each (u +-0.35, v +-3.6, -4.6 .. DECK - 0.88): the boat test's plane scan wants the bracing between the tubes covered, and a pile is structure; the canal is 22 m clear between the two bents.
* **`club.js`** (the yacht-club pontoons of Galerny Harbour, exterior only): the source had NO colliders; every pontoon segment, finger pier and moored boat is now an `addFloatBlock` (solid for the player's motor boat, a walker's floor is not touched: like the Rumyantsev pontoons; the rng sequence of the boats is unchanged).
* **Sea Terminal in gavan** (`sub.js`, the D-2): the 100 m conifer hedge (one drawn box + one `fence` box) is 36 bays of 3.1 m; the six path lamps are `knockFurniture` records (`lamp`); the yard fence (66 bays), the Lenexpo hoarding (360 bays) and the torpedo-boat chain (22 links) and plaque stand were already bays / records.

Solid on purpose (structures): the walls of every building (the two kronshpits and the MChS house, the guardhouse, the water tower, the works house, the workers' town blocks and annexes, the fire reserve incl. `flushWalls`, the church and its wall), the steam crane post and the rotunda, the stair treads (walk boxes), the boulders, the two through
trusses of the bridge (24.4 m x 0.55 m x 2.7 m; **decision for the owner**, below), the two bearing bents, the D-2 hull / tower / pavilion / cradles / stone / exhibits, tree trunks.

## Checks (CPU only, `node tools/area.mjs gavan ...`)

* `check.mjs --area-modules`: RESULT OK, 16 modules; budget rows measured + 15 %.
* `landmarks-groups-check.mjs`: OK for gavan (8 kept modules: Gavan 7 groups, Kirova, Sevkabel, Sea Terminal 4 groups, ModernVO, Sredny, VOStatues, bridges) and for vasilyevsky (the Sea Terminal claim there is still the terminal alone).
* `claims-draw-audit.mjs` (gavan): OK, 0 warnings, 2 notes (the Kirova street lamps and the Sevkabel spool towers: the same waivers as vasilyevsky); `landmarksGavan` owns 35 claimed ids, 35 drawn, nothing inside a claimed footprint of others or inside an unclaimed building.
* `water-reachable-test.mjs --quick`: 16 of 16 (the first run failed check 6 on the two trusses; an ALLOW row with the reason was added, see below). Check 3 (a knocked bay opens the way), 4 (the car through a quay fence), 9 (the three drivable bridges keep a surface) included.
* `boat-passage-test.mjs`: ALL 22 PASSED, among them the Shkipersky Bridge (the boat sails under it, 54 m, 0 hits), the deck over the canal mouth at (-6940, 392), the bent pillars (rammed: a hit), the plane scan over the bridge (61 points, all covered), the water bodies, and a NEW named route
  `gavan` (the Gulf off the Kronshpits mouth -> the canal -> Galerny Harbour under the bridge, 649 m, 0 scrapes, 0 hits). A first run failed the plane scan (the X bracing between the tubes): fixed by the bent boxes.
* `views-check.mjs --land`: 21 poses, 0 failing (the water tower pose and the Shkipersky photo spot are the skeleton's moved ones; the Nakhimov-street pose is Pribaltiyskaya's); `area-garage-check.mjs`: OK; `knock-stands-test.mjs`: PASS; `layout-test.mjs`: OK (owns-table OK, 51 modules).
* `closure-lint`, `import-lint`, `runtime-only-lint`: OK; `owns-table.mjs` regenerated; `layout-golden --diff` (strip and north): identical to the regenerated goldens.
* Not run on purpose: GPU, bake, crowd / people / traffic / wildlife / flow / handoff tests.

Test files edited: `tools/water-reachable-test.mjs` (one `ALLOW` row for the Shkipersky trusses, `modOf` = landmarksGavan, 24.4 m x <= 0.6 m x >= 2.5 m high), `tools/boat-passage-test.mjs` (the `gavan` named route), `tools/check.mjs` (the two budget rows), `tools/lib/closure-orphans.txt` (`landmarksGavan/util.js`).

## Area slots filled (`src/areas/gavan/area.js`, `rings.js`)

`PORT-IMPORT / MODULE / LABEL / GROUPS / CLAIMED / PRUNE / AREAS` and `PORT-WATER` of `landmarksGavan` (the marker lines are replaced, the `// ---` / `//` separators stay), `PORT-IMPORT` / `PORT-SOURCE` of `rings.js`, `PORT-BUDGET` of `tools/check.mjs`. `landmarksGavan` stands before `bridges` in `MODULES`. The Pribaltiyskaya slots are untouched.
HUD rows added (first match wins, small circles first): Shkipersky Bridge c(-7010, -31) r35, Kronshpitsy c(-6958, 402) r62 (the source r55: the photo pose of Digit1 stands 58 m from the centre), the canal promenade c(-6965, 150) r40, the fire station c(-6155, -600) r45, the steam crane c(-7060, -101) r28, the water tower c(-7149, -251) r30,
the church c(-5937, 540) r70, the Gavan Quarter c(-6289, -667) r110, the D-2 c(-6598, -66) r55, the torpedo boat c(-6565, 355) r30, and the water row "Galerny Harbour" (box x -7300 .. -6700, z -330 .. 450 AND `inRiver`: the source tests the island outline, a helper that n4spb lacks).
`TEST.mustHaveAreas`: Shkipersky Bridge, Kronshpitsy, the Gavan Quarter, the church, the D-2.

## For the owner: Russian texts and decisions to check by hand

* HUD names that are NOT in the source's `layout.js` (written from the module's own labels): "Набережная Шкиперского протока", "Паровой кран Галерной гавани", "Водонапорная башня Галерной гавани", "Торпедный катер «Комсомолец»" (and the English halves); the others are the source's rows (church, Kronshpitsy, bridge, Gavan Quarter, D-2).
  The label of the loading screen `landmarksGavan: 'Гавань: Кроншпицы, Шкиперский проток и мост, Гаванский городок, церковь «Милующая»'`, and the fire station's English half "Gavan fire station".
* **The trusses of the Shkipersky Bridge stay solid** (the Mabey through trusses are the bridge; scout decision 9.3). The rails beside them are bays, the ends of the deck (u 12.2 .. 16.6) are open through breakable rails and wing walls, but a car on the deck cannot leave the bridge sideways through the 24 m of the truss without
  breaking the bays (the trusses themselves do not break). If the owner wants the trusses to break: make each 3.05 m panel a bay (one knock record each).
* The pontoons and the moored yachts of the yacht club (Galerny Harbour) are float blocks: the motor boat bounces off them (they were pass-through before).
* Hand-check list in the game: the stair at the east mole (walk down the 13 steps into the canal, no wall at the foot), the Shkipersky Bridge (drive the red car over it, sail the boat under it, break the W-beam), the canal fence (break a bay, look at the fans), the church hoarding (posters), the D-2 hedge, the canal lamps.

## Open items

* The bake of gavan (the lead's single bake at the end); the budget rows of the other modules stay the foundation's estimates.
* Look-only gaps: Galerny Harbour grass banks, the Gulf rubble revetment, the limestone mole ends (`vo-banks.js` needs a rewrite without the region names V3..V12).
* The people / traffic modules do not know the new bays (no routes were re-baked); `ZONES.peopleHot` rows of the Gavan sights were already in the skeleton.
* `fence` posts stay in place when their bay is knocked (as in Kirova / Sea Terminal).
* WHSD (cluster B) and Pribaltiyskaya (cluster P) are not part of this branch.
* Merge notes: the conflict-prone spots are `src/world/lib/owns-table.js` (regenerate), `tools/golden/layout-*.json` (regenerate), `src/world/bridges.js` (two small hunks next to B's), `tools/check.mjs` and the marker lines of `area.js` / `rings.js` (each replaced in place).
