# Gavan / Morskoy / Dekabristov round, cluster P: landmarksPribaltiyskaya (branch `gdm-p`)

Part of the Gavan / Morskoy / Dekabristov round (docs/AREAS.md 15.g; areas `gavan` k=49 and `morskoy` k=47). One module is ported once and claimed by both areas: `landmarksPribaltiyskaya` (the Pribaltiyskaya hotel, Tsereteli's Peter I,
the Agayan group "Creators of the Fleet of Russia", the cruiser Kirov memorial with the college wing, the Nakhimov statue, the former Waterville aquapark). Copied from the source project 102_3d_piter, commit 0568f7af, and adapted to the owner
rules as the Vasilyevsky wave did (docs/vo-m4.md, docs/AREAS.md 15.2 "World rules in the ported modules"). No version bump (the lead bumps once), no bake, nothing pushed.

## Module

| Module | Files | Lines | Triangles (`check.mjs landmarksPribaltiyskaya`) | Colliders | Knock records | Budget (`tools/check.mjs`) |
|---|---|---|---|---|---|---|
| `landmarksPribaltiyskaya` | 23 + 1 | 2,728 (+ about 70 changed) | 105,378 alone; 104,868 inside gavan and inside morskoy (`--area-modules`) | 305 (same count as the source: 30 wall boxes became 30 bays) | 75 | `BUDGET_AREA.gavan` and `.morskoy`: 122e3 (measured + 15 %, the scouts guessed 115 k) |

The unchanged source builds to 104,962 triangles and 305 colliders in the same harness (the scouts quoted the dossier's 98 - 99.5 k); the adaptation adds 416 triangles (the Kirov wall as bays).
Build 0.34 - 0.77 s. Provenance paragraph above `OWNS_GROUPS` in `src/world/landmarksPribaltiyskaya.js`. `claimed` reads `ctx.L.GROUPS.landmarksPribaltiyskaya` with the fallback `GROUPS_LIST`; the module publishes
`ctx.services.landmarksPribaltiyskaya` (monuments, photoSpots, entrances (empty: the hotel is closed), crowd, fences, benches, lamps, parts) and merges monuments / photo spots into `ctx.services.landmarks`.

## Groups claimed

* gavan: all six (`pribaltiyskaya-hotel`, `peter-tsereteli`, `creators-fleet`, `nakhimov-statue`, `pribaltiyskaya-waterville`, `kirov-memorial`). The scout's open question (decision for `kirov-memorial`): CLAIMED. Its `at` (-7970, -1075) is 35 m beyond the
  gavan rectangles, 3 % of its vertices lie inside them and 100 % inside the 120 m data margin, exactly the `kirova-erarta` case of Vasilyevsky; `landmarks-groups-check` passes ("verts in play 0 %, extent 100 %"). The memorial is
  seen and reached from the territory edge; the source `Place.kirov-monument` pose lies outside the rectangles and is not added to gavan (HUD row only).
* morskoy: all six (100 % inside).
* `TEST.claimed` row `w17559880` / `pribaltiyskaya-hotel` in both areas.

`groups.js` got an `ON` list (the `landmarksSeaTerminal/groups.js` pattern): `GROUPS_LIST` and `PAVED_RINGS` follow it. `ON` holds all six keys because both areas claim all six, so no area-side filtering was needed; an area that claims fewer
passes its own `GROUPS.landmarksPribaltiyskaya` list and drops the rings of the groups it leaves out in its `rings.js`.

## Rings (`src/areas/{gavan,morskoy}/rings.js`)

`{ module: 'landmarksPribaltiyskaya', ns }`: `PAVED_RINGS` 5 (the hotel platform at +3.2 m, the plaza slab, the two grove squares / lawn bed rings, the Kirov platform at +0.55 m), `WATER_RINGS` none, `KEEP_OUT` none. The module is inland:
no water touches it (Neva Bay / the Gulf coast are more than 1 km away from the module's rings; `water-reachable-test` check 1 / 6 pass in both areas with the module built).

## Area slots filled

`PORT-IMPORT / MODULE / LABEL / GROUPS / AREAS / CLAIMED` in both `area.js`; morskoy also `PORT-HAVE` (four `mustHaveAreas` rows); gavan has no `PORT-HAVE` slot, so one row of three sights was added before the existing comment
(with `// ---` separators, the merge spot is the end of `TEST.mustHaveAreas`). `PORT-PRUNE`: not needed, the module publishes no `entrances` (the hotel doors are shut); the morskoy marker became a one-line comment saying so, and gavan has no
Pribaltiyskaya prune slot. HUD rows (copied from the source `layout.js` 596 - 599): Памятник Петру I c(-7477, -791) r40, Гостиница «Прибалтийская» c(-7600, -735) r175, Памятник крейсеру «Киров» c(-7970, -1075) r65, Сквер Малые Гаванцы
(the OSM park r19581548: its 44-vertex outline is written into the row as literal numbers, because `makeAreas` has no access to the GREEN data; margin 4 m). LABELS: «Прибалтийская, памятник Петру I, крейсер «Киров»».
Build order: gavan after `city` and before `landmarksKirova` (the slot order), morskoy after `city` (the port module has not landed in this branch; the slot order keeps it first).
Views were not touched: both areas already carried the hotel / Peter I / Nakhimov / Kirov poses from the foundation and `views-check --land` passes for all of them.

## World rules: what became a knock bay / knock record

`lib/fence-bays.js knockBays` through `inst.js kBays(K, o)` (adds the instance triangles to `K.extraTris`, as in the Vasilyevsky modules) and `lib/knock-furniture.js knockFurniture`. Geometry and colliders stay where the source put them; every placement is
drawn as its own geometry at the origin of a spot (rotY = the frame's rotation) and the source's collider handle goes to the record.

* `hotelfront.js` (the forecourt), 45 records:
  * 9 granite plaza benches (5.5 x 1.8 x 0.9 m, rows at z 34 / 54 / 74): kind bench, mass 700 (a granite block shoves a car), `w 5.5, d 1.8`.
  * 4 terrace park benches (1.8 x 0.5 m, foot level +3.2): kind bench (the standard template).
  * 2 round granite planters (d 3.2, collider r 1.6 x 0.7): kind planter, mass 1800, anchored 28 km/h.
  * 8 perforated column lamps (4 at the stair foot, 4 beside the terrace benches at +3.2; collider r 0.2, 4.6 m): kind lamp (template 4.7 m).
  * 22 ball-lamp posts along the stair top (collider r 0.1, 3.4 m, foot +3.2): kind lamp, r 0.12, mass 80. The scouts wrote that these (and the benches) carry no collider; in the source they do (`addCylinder` at line 151, `boxF` at 171 / 175), so they are records now.
* `kirov.js`: the semicircular granite wall (r 24.5, 0.5 m thick, 1.3 m high on the platform, 30 sections) is 30 breakable bays (`knockBays`: collider 0.7 m thick from the ground to platform + 2.3 m as in the source, the drawn section with its cap
  strip, texture tile 2.4 m x 1.3 m as in the source uv, 0.04 m overlap at the mitres), kind fence, mass 1500, anchored 30 km/h.
* Unchanged on purpose, see below: everything else.

### Solid on purpose (structures, listed for the owner)

* Building walls: the hotel hull ring and the central block, the two zigzag stair blocks of the front towers (`hotel.js`), the rear pavilion (`rear.js`), the Waterville ring (`waterville.js`), the college wing, tower and front (`college.js`); `ringBoxes` thin
  rings are the walls of buildings.
* The hotel podium: the platform walk boxes with a solid column from the ground and the 3.2 m retaining / plinth wall strips (`walkF`, `walkStrip`; granite structure, not a fence), the 20-step stair (`addStairs`) and its two cheek walls (0.6 x 4.6 x 2.2 m,
  part of the stair structure), the four canopy piers (0.6 x 0.6 m), the three lawn-bed kerbs (8.7 x 8.7 x 0.45 m: a step the player takes, terrain-like; a kerb is not a wall).
* Monuments: the Peter I base and shaft (8.3 x 8.3 x 14 m box; its eight stump bollards and the chain stand ON the lowest slab inside that box and have no collider of their own, so there is nothing to break), the Creators of the Fleet pedestal
  (5.6 x 3.4 x 9 m), the Nakhimov pedestal (3.0 x 2.6 x 8 m), the two Kirov turrets (r 3.95), the wreath (r 1.75), the two propeller plinths (3.3 x 2.5 x 3.6 m), the two anchors, and the two shell niches at the ends of the wall (jambs, lintel and cap slab
  2.5 x 1.9 x 2.1 m, with six shells each; they could become heavy records later, they are granite blocks of the memorial, not a railing).
* The spruce trunks of `trees.js` (cylinders 4.5 m: vegetation stays solid everywhere).
* Not touched, no collider: the white hemispherical bollards along the drive (instanced, 0.55 m, the source gave them no collider; they stand on the +3.2 platform next to the drive), lawns, the hedge-free beds, the masks, the canopy plate.
* The source's Peter I `S.fences` entry `peter-chain` (kind chain) and the Kirov `kirov-wall` entry are service rows for the people module (crowd avoidance), unchanged.

## Shared files edited

None of the engine. Edited (all additive): `src/areas/gavan/{area,rings}.js` and `src/areas/morskoy/{area,rings}.js` (only the PORT-* marker lines of this module; in gavan additionally one `mustHaveAreas` row of three sights inside `// ---` lines),
`tools/check.mjs` (the two `PORT-BUDGET: landmarksPribaltiyskaya` lines), `src/world/lib/owns-table.js` (regenerated by `node tools/owns-table.mjs`, 51 modules; it conflicts with the other branches, the integrator regenerates again).
Proof that palace and vasilyevsky are unaffected: `node tools/area.mjs <area> tools/check.mjs --area-modules` before / after my `owns-table.js` (the only shared file I touched): the module, triangle, mesh, instance, collider and knock-record lines are
identical for `vasilyevsky` (126 lines compared) and `palace` (141 lines).

## Checks (all CPU, `node tools/area.mjs <area> tools/...`)

* `check.mjs landmarksPribaltiyskaya`: RESULT OK, 105,378 triangles, 305 colliders, knock 75 {bench 13, planter 2, lamp 30, fence 30}.
* `check.mjs --area-modules`: gavan OK (module 104,868 triangles, budget 122,000), morskoy OK (same numbers); vasilyevsky and palace OK and identical to before.
* `landmarks-groups-check.mjs`: gavan OK (kirov-memorial: 0 % of the vertices in the play rectangles, 100 % in the data extent), morskoy OK.
* `claims-draw-audit.mjs`: gavan RESULT OK, 0 warnings, 2 notes (the foundation's Kirov-DK street-lamp waiver and the Electra spool towers, not this cluster); morskoy OK, 0 warnings, 0 notes. The module owns 39 claimed ids, all drawn, none inside a
  claimed footprint of another module, none deep inside an unclaimed building: no `OWNER_SKIPS` / waiver row was needed.
* `water-reachable-test.mjs --quick`: gavan 16 of 16; morskoy 15 of 16, the failing check 9 is the two undrawn Shipbuilders' bridge ways (w374757408, w374757414), the bridge cluster's, not this one. Checks 0 (every fence record owns its box), 1, 3, 4, 6 pass with the module built.
* `knock-stands-test.mjs`: 7 of 7 in both areas (check 5 / 6 skip where the area places no kiosk / second A-frame, as the foundation set up).
* `views-check.mjs --land`: gavan 21 poses, 0 failing; morskoy 20 poses, 0 failing (HERO / Digit1 hotel, Digit2 Peter I, Digit3 Kirov memorial, Digit0 Nakhimov, ShiftDigit7 Waterville of morskoy; Digit9 / Digit0 / Place.nakhimov of gavan: no pose had to move).
* `area-garage-check.mjs`: gavan OK (lada (-6012, 506)), morskoy OK (lada and spawn (-7467, -764), `solidCentre` true, nothing blocked ahead, 3 m free on both sides: the hotel plaza module does not touch it).
* `layout-test.mjs`: OK for both (TEST.claimed, mustHaveAreas). `owns-table.mjs --check`, `closure-lint`, `import-lint`: OK (the module is reached through literal `import()` of its parts, no closure row needed).
* Not run on purpose: GPU, bake, crowd / people / traffic / flow / handoff tests, boat passage (the module is inland).

## Open items / notes for the lead

* The five-slot merge spots: `PORT-*` lines of `area.js` / `rings.js` / `check.mjs` were replaced in place, the `// ---` separators are untouched; `owns-table.js` needs `node tools/owns-table.mjs` at the merge.
* morskoy places `landmarksPribaltiyskaya` first among the landmark modules because `landmarksMarineFacade` is not in this branch; the lead keeps the slot order (the port first) at the merge. The hotel plaza and the port do not share any ring.
* The two shell niches and the Peter I bollards (see above) are the only places where an owner could ask for more breakable detail; both were left as structure on purpose.
* An unchecked item for the visual round: the new Kirov wall bays are drawn as straight chords with a 0.04 m overlap, as the source drew chords; if a seam shows from the memorial centre, raise the `inset` in `kirov.js wallArc`.

## For the owner's hand check (Russian texts and facts)

All Russian strings below come from the source project (dossier `docs/research/pribaltiyskaya.md` of 102_3d_piter) or from the foundation scouts; none was invented here, but a person has to confirm them:

* HUD names and circles: «Памятник Петру I», «Гостиница «Прибалтийская»» (r 175 around (-7600, -735)), «Памятник крейсеру «Киров»» (r 65), «Сквер Малые Гаванцы» (the OSM name of r19581548).
* Loading label «Прибалтийская, памятник Петру I, крейсер «Киров»» (new wording of this round, from the scout's proposal).
* Names of the groups and monuments inside the module: «Гостиница «Прибалтийская»», «Памятник Петру I работы З. К. Церетели», «Создатели флота России (Е. М. Агаян)», «Памятник крейсеру «Киров»», «Башня главного калибра крейсера «Киров»»,
  «Гребной винт крейсера «Киров»», «Колледж судостроения и прикладных технологий (фриз памятника крейсеру «Киров»)», «Памятник адмиралу Нахимову и круглое здание сквера», «Бывший аквапарк «Вотервиль»», the photo-spot names.
* Texts painted on textures (`art.js`): the roof word ПРИБАЛТИЙСКАЯ and the bilingual canopy plate, the Kirov plaques («ПОДВИГУ МОРЯКОВ КРАСНОЗНАМЁННОГО БАЛТИЙСКОГО ФЛОТА …», «ГЕРОИЧЕСКОМУ ЭКИПАЖУ КРЕЙСЕРА „КИРОВ“», the turret plaque «КРЕЙСЕР „КИРОВ“ НАХОДИЛСЯ В СТРОЮ С 1938 ПО 1974 ГОД …»),
  the Peter I scroll with the founding text («ОТ ВОПЛОЩЕНИЯ ИИСУСА ХРИСТА 1703 ГОДА, МАЯ 16. ОСНОВАН ЦАРСТВУЮЩИЙ ГРАД САНКТ-ПЕТЕРБУРГ …»), the Nakhimov inscription «АДМИРАЛ НАХИМОВ.».
* Page-text facts that the page.json authors will want (from the scouts, not written here): hotel 1979 (Evdokimov, Baranov with Skanska), Tsereteli's Peter I 2006, the Kirov memorial 1990.
