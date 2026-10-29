# Dekabristov Island, cluster D1: the cemeteries, the siege memorial, the garden and the fountain (branch `gdm-d1`)

Part of the area-gdm effort (docs/AREAS.md 15.g, id `dekabristov`, map k=51). Cluster D2 (Primorskaya, the fill) and cluster B (the bridges, the Smolensky cemetery data fix) run in parallel; this file is the only
document of D1. **There is no source-project module for this island** (the source never authored it, docs/research/dekabristov-data.md, scout-dek.md section 0.5): `landmarksDekabristov` is a NEW module, authored
the n4spb way from the data of the area (the real OSM ids of `src/areas/dekabristov/data`), after the pattern of `landmarksSmolensky` (cemetery) and `landmarksAndrew` (fountain, ghost bays). Its helper files that
are copies of `landmarksSmolensky` carry a PROVENANCE line (they are copies of this repository's files, which are copies of the source project at 0568f7af).

## The module

| | |
|---|---|
| Entry | `src/world/landmarksDekabristov.js` (`OWNS_GROUPS = true`, parts built only when the area claims their sub-group; publishes `ctx.services.landmarksDekabristov`, merges monuments / photo spots into `ctx.services.landmarks`) |
| Files | 29 in `src/world/landmarksDekabristov/` + the entry, 3,269 lines: 13 copies (`kit geo util surfaces inst treegeo leafmat forest atlas gravemat gravearch gravefield floor`, 2,111 lines) and 16 new (1,104 lines) plus the 54-line entry (`groups sites site plan plots fence furniture mon mats art data lutheran armenian siege garden volodin`) |
| Triangles (`node tools/area.mjs dekabristov tools/check.mjs --area-modules`) | **86,678** (single-module run 88,458; re-measured after the 16-direction shrub fix of the integration round, the first delivery said 86,706 / 88,486); `BUDGET_AREA.dekabristov.landmarksDekabristov` = 100e3 (measured + 15 %). Parts (static meshes + instances, `svc.parts`): lutheran 13.9 k, armenian 3.9 k, siege 15.7 k, garden 9.2 k, volodin 5.3 k; the rest are the instanced trees (far blobs of the first pack) and grave cells. Cluster budgets of the brief: A (Lutheran + Armenian) <= 90 k, B (siege) <= 45 k, C (garden + Volodin) <= 35 k: all met with a wide margin |
| Colliders | **7,731** in the area build (`check.mjs --area-modules`), 7,827 in a single-module run (the two contexts differ; the first delivery's 7,738 mixed them, and the 16-direction shrub fix of the integration round dropped a few more shrub colliders). The split below is the first measurement (approximate; the groups add up to about 6,680 graves, trunks and bushes, the rest are the fence bays): Lutheran 3,651 graves + 1,872 trunks / bushes, Armenian 309 + 147, siege 159 trunks + 18 memorial boxes, garden 362 trunks, Volodin 165 trunks; plus the bay colliders of the fences (1,117 breakable bays in the single-module run). Graves per part <= 4 k as asked (3,651) |
| Knock records | 1,144 in a single-module run (re-measured): fence / railing / rim bays 1,117, benches 12, bins 9, lanterns 6 |
| Build time | 0.9 s (single module), 1.1 s in the claims audit |

### What is drawn, per part (claim key, OSM ids)

* **`dek-lutheran`** - the Smolensky LUTHERAN cemetery (GREEN `r7738342`, 94,572 m2). `site.js`: a splat floor (leaf litter / goutweed / moss), the 18 footways laid as ribbons (sett paving), the closed fence `w10707043`
  (1,533 m, 1.8 m picket fence, 429 breakable bays) and the gate wall `w605081790`, ~1,040 old trees and 832 bushes (lime / maple / birch / ash / elm / oak / spruce), 5,384 grave plots (3,651 solid graves, 1,733 grass-tuft cards)
  composed on demand by the Smolensky grave field. By name: the four mapped tombs (`n13002399501` Faberge: a dark granite stele in a kerb frame; `n13002359701` Bauermeister: a grey stele; `n13002362201` the Gorvits
  crypt: a gable-roofed chapel-tomb 3.0 x 3.8 m; `n14155179601` de Ribas: a granite sarcophagus), the plaque `n6558720506` (a granite slab with the OSM inscription word for word, beside the gate gap), and the Bekman family tomb
  `w1167374971` (OSM "Могила А. фон Бекмана", the "Беседка Немца" of the film Brat `n9798534217`: the OSM outline is a 4 m2 mapping stub, an open pavilion on four piers 3.2 m is drawn round it, turned to its long axis).
* **`dek-armenian`** - the Smolensky ARMENIAN cemetery (GREEN `r7738341`, 11,235 m2): closed fence `w29044231` (138 bays, 3 gates), 13 walkways, 59 trees, 309 graves. The church `w111944528` is `landmarksVOStatues`
  (`vo-church-armenian`) and is NOT touched (graves keep 15 m clear). The data names no grave here.
* **`dek-siege`** - the memorial cemetery of the siege (GREEN `w23426250`, 48,723 m2, the same way is the fence): mown lawn floor, 5 walkways, a sparse planting, the plain picket railing 1.3 m (365 bays, 2 gates), the
  obelisk `n3188963779` on a three-step plinth in a paved apron (R 11 m), the Shch-323 memorial `n1861951657`, the "ЧАЭС" memorial `n3188961906` and the eight mass graves (`n11510705243..49`, `n3188961950`: kerbed lawn mounds
  with a stele and flowers). No grave carries a name on the stone.
* **`dek-garden`** - the Decembrists' garden (GREEN `w16237335`, 57,137 m2): the lawn, 45 walkways (compacted gravel), 163 trees that keep clear of the 41 mapped trees and of the wood / playground polygons, the picket
  railings `w702732780` / `w702732781` (1.2 m) and the enclosure `w1309425609` of the obelisk `n1846769112` (gate `n12124907315`), the obelisk itself (granite, two-step base, blank bronze plate, flowers), the memorial
  `n5025736127` "Детям блокадного Ленинграда" (a granite wall with the OSM inscription "ДЕТЯМ БЛОКАДЫ"; it stands on the south edge, in the Anfisa garden next door), 9 benches and 9 bins of the data.
* **`dek-volodin`** - the Volodin square (GREEN `r10331754`, 21,763 m2) with the Light-and-Music fountain (`w1396274666`): lawn, 15 walkways, trees, 3 benches, the round basin (see below), the paved plaza (R 8.6 .. 13.6 m), six lanterns.

## Groups claimed (`area.js` `GROUPS`, `TEST.claimed`)

`GROUPS.landmarksDekabristov = G_DEKABRISTOV` (all five sub-groups: `dek-lutheran` ids 1 + osm 27, `dek-armenian` osm 15, `dek-siege` osm 17, `dek-garden` osm 69, `dek-volodin` osm 20). `TEST.claimed` row: `w23426250` /
`dek-siege`. `tools/landmarks-groups-check.mjs`: OK; `claims-draw-audit`: 149 claimed ids of the module, 149 drawn, no warning of ours. Not claimed on purpose (groups.js header): the church, the Komitas monument, the Smolenka
banks and bridges, the private grave `n11554194879` inside the siege cemetery (a person who died in 2024: neither drawn nor claimed), the forest / wood / playground polygons inside the garden, the 41 mapped garden trees,
the factory fences along the cemeteries. The claimed GREEN polygons stop the generic lawn trees; the module plants its own. The claimed benches / baskets of the garden and the square are skipped by `props/osm.js` (it skips claimed ones).

## Slots filled in `src/areas/dekabristov/`

`area.js`: IMPORT (`G_DEKABRISTOV` + the five HUD rings), MODULE (after `landmarksVOStatues`), LABEL, GROUPS, AREAS (nine rows: obelisk, Shch-323, the siege cemetery, the Lutheran and Armenian cemeteries, the Decembrists'
obelisk, the fountain, the Volodin square, the garden; polygons for the areas, circles for the monuments), CLAIMED (one row), ZONES: `PEOPLE_HOT` +3 rows (the Decembrists' obelisk, the fountain, the Faberge grave),
`PIGEON_ZONES` +2 (`volodin` pigeons at the fountain, `garden` sparrows by the obelisk), `CROWDS` +2 (`volodin`, `garden`); my ZONES rows are placed just BEFORE the `// PORT-ZONES` marker lines (D2 appends after them: no merge conflict).
PORT-PRUNE is left alone (the module publishes no `entrances`). `rings.js`: IMPORT + SOURCE (`PAVED_RINGS` only: the fountain plaza, the obelisk apron, the paving of the Decembrists' obelisk; no water ring, no keep-out: nothing here touches a waterway).
`src/areas/dekabristov/cemetery.js` got two exported rings (`GARDEN_RING`, `VOLODIN_RING`, copies of the GREEN records) for the HUD rows; the crowd rule (`inCemetery`) is unchanged. VIEWS: four new keys (free ones) at the sights:
`ShiftDigit5` Bekman pavilion, `ShiftDigit6` the siege obelisk, `ShiftDigit7` the Decembrists' obelisk, `ShiftDigit8` the fountain (also in `TEST.viewKeys`; rename them if they clash with D2's keys). `tools/check.mjs`: the `BUDGET_AREA.dekabristov.landmarksDekabristov` row.
`src/world/lib/owns-table.js`: regenerated (`node tools/owns-table.mjs`, 51 modules; `--check` OK).

## World rules: what became a knock bay / knock record

* **Fences, railings, walls** (`fence.js`, `lib/fence-bays.js knockBays`): every panel between two posts is a row of breakable bays of one texture tile each (`splitBays`: bars 3.6 m, rail 3.0 m, walls 3.0 m), with its own
  collider, instances and ONE anchored knock record (a bump holds, a car at speed breaks the bay off and the gap is passable). Counts: Lutheran 429, Armenian 138, siege 365, garden 169 bays. Gates are open gaps of 2.4 m
  (mapped gate nodes, `access=private/no` stay closed) and a gap wherever an alley ENDS at the fence; the posts are static (0.1 m iron / 0.08 m rail posts: they stand in the fence line, never in a gap).
* **The fountain rim** (`volodin.js`): 16 breakable GHOST bays (the drawn granite rim stays, the collider breaks off).  **Benches, bins, lanterns** (`furniture.js`, `lib/knock-furniture.js knockFurniture`): the 9 + 3
  benches and 9 bins of the data and six lanterns are knock records (colliders removed at the knock).
* **Water**: the fountain basin is physics water (`ctx.physics.addWater`, level 0.30 m over the flat ground: shallow, walkable, drivable), registered BEFORE the planting; no trunk (4.5 m solid) and no bush with a collider is
  planted within 9 m of any water (plan.js `waterTest`: the Lutheran fence runs 70 m from the Smolenka), graves stay 9 m from water (`plots.js`). `water-reachable-test --quick`: 15 of 16 pass; check 6 (every thin tall collider
  within 12 m of water is a knock record) passes after the water was registered first (a first run flagged three bushes next to the basin); the only failure is check 9 (five bridge ways drop a car into the water:
  Betancourt, Serny, Korablestroiteley ...), the bridge wave of cluster B, not this module.

**Solid on purpose (structures, listed for the owner):** the tombs, the crypt and the Bekman pavilion (4 pier colliders + the sarcophagus), the plaque slab, the obelisks and their plinths (siege, Decembrists), the Shch-323 and
ChAES memorials, the memorial wall of the children, the eight mass-grave steles, the 3,651 + 309 graves of the Lutheran and Armenian fields (granite monuments: the Smolensky convention, no wall, none within 9 m of water),
and every tree trunk. The flat parts (kerbs 0.14 m, mounds, floor lights, the plaza, the fountain basin) have no collider.

## Checks (all CPU, `node tools/area.mjs dekabristov ...`)

* `check.mjs landmarksDekabristov`: OK. `check.mjs --area-modules`: RESULT OK, landmarksDekabristov 86,678 triangles, 7,731 colliders (budget 100e3; re-measured in the fix round, the first delivery had 86,706 / 7,738).
* `landmarks-groups-check.mjs`: OK. `claims-draw-audit.mjs`: OK (43 warnings, all the foundation's Smolensky alley ways; none of ours; our module draws 3 floor-decal centroids inside the church footprint w111944528, not graded).
* `water-reachable-test.mjs --quick`: 15 passed, 1 failed (check 9, the bridges of cluster B, as above).
* `knock-stands-test.mjs`: 7 checks passed (the area places no kiosk / cart; the foundation's skips apply). `views-check.mjs --land`: 21 poses, 0 failing (the 17 of the foundation + our 4).
* `area-garage-check.mjs`: OK. `closure-lint`, `import-lint`, `runtime-only-lint`, `owns-table --check`: OK.
* Not run on purpose: GPU, bake, crowd / people / traffic / wildlife tests, boat-passage test.  Nothing of the shared engine was edited, so palace / smolny / vladimirsky / admiralty / vasilyevsky build as before.

## Shared files edited

None of the engine (`environment`, `quay`, `water`, `bridges`, `wildlife`, `river` are untouched). Edited outside the module: `src/areas/dekabristov/area.js` and `rings.js` (my PORT marker lines; the four view rows and
the `viewKeys` line are NOT marker slots: expect a trivial conflict if D2 also adds views), `src/areas/dekabristov/cemetery.js` (two exported rings), `tools/check.mjs` (my budget row), `src/world/lib/owns-table.js` (regenerate at the merge).

## Open items / notes for the lead

* **No GPU look at all.** Things to look at first in the bake round: the floor splat decals (y 0.022 over the ground field: z-fighting with the environment ground), the alley ribbons (0.025 .. 0.033) against the streets'
  kerbs where an alley meets a road (the ribbon is clipped by `net.cover`), the picket-fence cut-out textures, the light discs of the fountain at night, the size of the obelisks.
* Fixed in this round while testing, worth knowing for the next port of the Smolensky grave stack: `ctx.mat.toon` caches by its options, so a SECOND call with the same options returns the SAME material. Two consequences handled
  here: the floor-splat material is created per site (name `lmdek-floorSplat-<site>`; the last mask would have won), and the grave-atlas patch (`gravemat.js patch`) is applied once (a second patch declares `attribute vec4 aCell`
  twice: a GLSL error on the GPU that no CPU check can see).
* Five trees-and-graves systems call `ctx.onUpdate` (one forest repack per site, one grave repack per cemetery): cheap (they work only when the camera moved 2.5 m / 4 m), but the Lutheran forest list (1,872 trunks) is the biggest.
* The Lutheran fence has one mapped gate gap (the south tip at (-5313, -1715), by the Smolenka) because the other mapped gates (n5739868263 ... at the SW yard) are 9 .. 12 m outside the fence line; every alley end that touches a
  fence opens a gap too (none do on the Lutheran cemetery). The fence is breakable everywhere, so the cemetery is never closed.
* The environment still draws the 41 mapped trees of the garden (data layer TREES); the planner keeps 3 m clear of them.
* The Light-and-Music fountain plays no music and no water sound (the real one plays music in the evening; not modelled, no sound is better than a wrong one).
* The `docs/AREAS.md` 15.g paragraph for D1 is the lead's. `TEST.mustHaveAreas` rows for the new HUD rows (e.g. `{ x: -5788.5, z: -1709.5, has: 'героическим' }`) were not added (shared table, merge risk); they pass by hand.

## OWNER hand-check items (what is generic or unverified)

Russian texts that appear in the game and must be TRUE (all taken from OSM names / tags unless noted):
* HUD rows: «Обелиск «Героическим защитникам Ленинграда»» (OSM name of n3188963779), «Памятник экипажу подлодки Щ-323» (OSM: "Экипажу подводной лодки Щ-323"), «Мемориальное кладбище «Остров Декабристов»»,
  «Смоленское лютеранское кладбище», «Смоленское армянское кладбище» (OSM: "армяно-григорианское"; the registry sights already say "армянское"), «Обелиск казнённым декабристам», «Светомузыкальный фонтан», «Сквер Александра Володина», «Сад Декабристов».
* View labels: «Могила А. фон Бекмана · Лютеранское кладбище» (OSM name of w1167374971), «Обелиск «Героическим защитникам Ленинграда»», «Обелиск казнённым декабристам», «Светомузыкальный фонтан».
* Loading words: «Лютеранское и Армянское кладбища, мемориал блокады, Сад Декабристов, светомузыкальный фонтан». Pigeon / sparrow zone names (the HUD location of a bird group): «Голуби у светомузыкального фонтана»,
  «Воробьи в Саду Декабристов». Photo-spot names: «Беседка на Лютеранском кладбище · Pavilion tomb» (descriptive, after the OSM point "Беседка Немца").
* Engraved texts (the only ones): the Essen-Stenbock-Fermor plaque (the OSM `inscription` of n6558720506, wrapped to lines) and «ДЕТЯМ БЛОКАДЫ» (the OSM `inscription` of n5025736127). Nothing else carries text; the names of the graves and
  mass graves are only in the monuments service.

Generic choices (no photo, no source in the data): the HEIGHT of the siege obelisk (drawn ~17.9 m) and of the Decembrists' obelisk (~7.7 m); the shape of the Shch-323 memorial (a granite plinth with a conning-tower fin and a
periscope) and of the ChAES stele; the style of the Bekman pavilion (open, four piers, hipped roof, cross) and of the Gorvits crypt; the type and height of every fence (Lutheran / Armenian 1.8 m picket fence, siege 1.3 m
plain railing, garden 1.2 m railing, obelisk enclosure 1.3 m pickets); the mix of the graves (Smolensky archetypes, zone mixes A / C / D), the tree species and densities; the number of jets, floor lights and the 0.30 m depth of the
fountain; the six lanterns round the plaza. Not drawn at all: a gate leaf anywhere (gates are open gaps), the grave of a private person n11554194879, music.
