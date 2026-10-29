# Gavan / Morskoy / Dekabristov wave, cluster M: landmarksMarineFacade (branch `gdm-m`)

Part of the Morskoy area (docs/AREAS.md 15.g, id `morskoy`, map k=47). Ported from the source project 102_3d_piter at commit 0568f7af (read-only), adapted as the Vasilyevsky wave did (docs/AREAS.md 15.v and 15.2 "World rules in the ported
modules", docs/vo-m4.md) and as the scout asked (D:/git2/n4spb-work/gdm/scout-morskoy.md, "Owner-rule work"). The lead merges this branch with the others; this file is the only document of the cluster. No version bump, no bake, nothing pushed.

## Module

| Module | Files | Lines | Triangles (`check.mjs`) | Colliders | Knock records | BUDGET_AREA.morskoy |
|---|---|---|---|---|---|---|
| `landmarksMarineFacade` | 19 + 1 | about 2,010 | 89,945 alone / 89,587 in the area build (source: 89,591) | 2,225 (source: 810) | 2,010 (1,989 fence bays, 3 kiosks, 18 masts) | 104e3 (measured + 15 %) |

Triangles by part (alone): terminals 6,435, galleries 8,592, quay 10,078, masts 3,672, fences 39,352, ships 6,640, Golden City 11,441, misc 2,323, shore 1,412, spots 0. The knock adaptation does not change the drawing: the same geometry stands where it stood (the collider
count rises from 810 to 2,225 because a fence is now one box per piece, not one box per up to 14 m). Build 0.4 s. Provenance: one paragraph above `OWNS_GROUPS` in `landmarksMarineFacade.js` ("copied verbatim from the source project 102_3d_piter, commit 0568f7af").
The module publishes `ctx.services.landmarksMarineFacade` (terminals, monuments, photoSpots, entrances [empty], fences, lamps [the masts], ships, parts); it publishes no `entrances`, so it is NOT in `PRUNE_SERVICES` (the `PORT-PRUNE: landmarksMarineFacade` marker stays).

Files: `src/world/landmarksMarineFacade.js` + `src/world/landmarksMarineFacade/{art, fences, frame, galleries, geo, goldencity, groups, inst, kit, masts, mats, misc, quay, ships, shore, spots, surfaces, terminals, util}.js`.
Verbatim (byte-identical to the source): art, frame, geo, goldencity, groups, kit, mats, misc, ships, shore, spots, surfaces, terminals, util. Changed: the main file (provenance, claim read), `inst.js` (three helpers added at the end), `fences.js`, `galleries.js`, `masts.js`, `quay.js` (world rules).

## What the map sights are built by (the question of the brief)

* Golden City, quarter 6 with the spire: built here, `landmarksMarineFacade/goldencity.js`, group `golden-city-spire` (`r7378335` and its four parts r10034568..71 with the real heights 19.2 / 19.2 / 43.2 / 52.2 m, the 52 m gold lattice spire on r10034571, the box crown on r10034570,
  and the lattice crowns on the parts r12001859 / r12001860 of the neighbouring block, which stay generic buildings: see "Open items"). 11.4 k triangles.
* "Бывший аквапарк Вотервиль" (`w17559985`) and "Памятник крейсеру Киров": NOT in this module. Source: `landmarksPribaltiyskaya/waterville.js` and `kirov.js` (cluster P). In the data the aquapark is `kind: yes`, not `building=ruins`.
* "Морской вокзал: КПП и залы досмотра" = group `mf-checkpoints`, "ангар на мысе" = `mf-tip` of this module (NOT the Sea Terminal of Gavan, which is `landmarksSeaTerminal`).
* No missing sight, nothing authored new. Authoring candidates are listed under "Open items".

## Groups claimed (`area.js` `GROUPS.landmarksMarineFacade`, `TEST.claimed`)

All 8 sub-groups, none filtered: `mf-terminals` (4 wedge terminals + the control centre), `mf-galleries` (7 quay galleries + the elevated ferry gallery), `mf-furniture` (26 fence / wall ways, 18 floodlight masts, 15 gate nodes: 59 OSM ids), `mf-checkpoints` (11), `mf-sheds` (26),
`mf-tip` (3), `mf-shore` (marina piers + the two Mayak objects), `golden-city-spire`. `tools/landmarks-groups-check.mjs`: every building group 100 % inside the play rectangles. `TEST.claimed` row `w41575292` / `mf-terminals`. `TEST.mustHaveAreas`: (-8699, -1800) "морской фасад" and
(-8700, -900) "golden". Slots filled in `src/areas/morskoy/area.js`: PORT-IMPORT / MODULE (after `city`, before the Pribaltiyskaya slot, as in the source `main.js`) / LABEL / GROUPS / AREAS (HUD rows: the Marine Facade by building names with a 450 m fallback disc, the Marine Facade land box, the two Mayak
objects, Golden City twice) / HAVE / CLAIMED; in `rings.js`: PORT-IMPORT and PORT-SOURCE (`BERTH_RINGS` + 6 more `PAVED_RINGS`, `KEEP_OUT` liner-a / liner-b; the module has no `WATER_RINGS`).

## Owner rules: what became a knock bay / knock record

Method: `lib/fence-bays.js` `knockBays`, `lib/knock-inst.js` through the helpers `kBays` / `kFurn` / `tint` added to `landmarksMarineFacade/inst.js` (a colour handle of the module's shared vertex-colour material `M.flat` needs a colour attribute on the unit geometry: `tint`).

* **Port fences, `fences.js`.** The 1,805 live pieces are 1,805 bays, one collider (flagged `fence`: the people nav still reads them as walls) + one drawing + ONE knock record each, exactly where the source's piece stood: 4,076 m of welded-mesh fence (mesh panel y 0.25 .. 1.95, collider 2.0 m
  x 0.12, record mass 220, anchored 14 km/h), the 331 m guard rail (113 pieces slid off the carriageway keep their slide; 1.1 m x 0.12, mass 160, anchored 12), the 1,655 m of precast wall (6 m pieces, 2.4 m x 0.3, mass 900, anchored 16, cap line as a second part). The 3,052 posts stay static instanced
  (a knocked bay leaves its posts standing, as in the Sea Terminal). The source merged live pieces into boxes of at most 14 m; a gap left by a knocked bay is one piece wide and passable. The 63 pieces that the source left out on carriageways (open vehicle gates) and 1 at a gate are unchanged.
* **Gallery glass, `galleries.js`.** The thin quay-side wall of each of the 7 galleries (0.3 x 3.4 m, 100 .. 190 m long, 13 .. 30 m behind the berth edge) was one box and one 2 hl m glass quad: now 184 bays of one post spacing (6 m): collider 0.3 x 3.4, glass pane 0.9 .. 3.4 m, knock kind `fence` (mass 380, anchored 14).
* **Masts, `masts.js`.** The 18 floodlight masts (25 m) are 18 knock records, kind `mast` (mass 1200, anchored 26 km/h, r 0.5, far 1500 m: skyline objects), one instanced geometry at the origin per mast head turn; the cylinder collider stays at its place and is removed at the knock, a rest box (<= 0.42 m) replaces it.
* **Kiosks, `quay.js`.** The 3 pilot kiosks (1.2 x 1.2 x 2.4 m) are `booth` records (mass 450, free: slides, minDv 0.5).
* **Lift-gate booths, `fences.js`.** The booth of a lift gate (2.2 x 2.2 x 2.6 m) is a `booth` record (mass 700, anchored 14); NOTE that the source's placement test (a booth only where five probe points are off the asphalt) rejects all 7 lift gates, so no booth is built in this area, exactly as in the source
  (`svc.counts.gateBooths` 0). The code path is adapted and inert; the gate posts of the 8 plain gates and the red housing / raised boom of the lift gates have no collider (as in the source).

Solid on purpose (structures, listed for the owner): the walls of every building (the four terminals and the control centre: one box each, the 36 small buildings / booths / halls / hangar / the Golden City U-block and its four parts: `addPolyColliders`), the 12 canopy pylons of the vehicle checkpoints (0.6 x 0.6 x 5.2 m),
the 3 x 14 x 9 m end block (lift towers) of the elevated ferry gallery, the hangar's lower wing, the 3 granite boulders of the roundabout island, the two liner hulls (a box from the bed to the lifeboat deck, 293 x 32 m and 252 x 32 m: a ship, like the Krasin hull), the two Mayak columns (monuments, r 0.7 m, 6.2 m).
Without any collider by source design: the marina (the timber pier, its fingers and ~24 yachts float at WATER_Y + 0.35 and are decor), the berth apron, the hazard strip, the fenders, the elevated gallery's own columns (33, 0.3 m), the tenders and ropes of the liners.

## Water

Nothing in the module walls off water: the port stands on the land fill, the quay wall is the environment's (the module only measures its edge with `L.inRiver` probes: `frame.js quayEdge`). There was no invisible guard box at the water in the source and none was added; the module has no stair, descent or pier that
needs a `WATER.ownerRings` row (`WATER_RINGS` is absent from its `groups.js`). `KEEP_OUT` liner-a / liner-b (oriented boxes) and `BERTH_RINGS` are handed over through `rings.js`. The liner hull boxes lie on water (WL - 3 .. WL + 14.6): `water-reachable-test` check 1 (no wall cuts a body of water) passes
with them (the body of the Gulf keeps 100 % of its free cells in one connected part); a swimmer goes round them. Every gallery wall and fence beside the berths breaks (check 3 / 4 of the water test pass with this module built).

## Shared files edited

None of the engine (no file of `src/world/lib`, `core`, `environment`, `bridges`, `drive`). Edited outside my own module: `src/areas/morskoy/area.js` and `rings.js` (only my own PORT lines, the `// ---` separators untouched), `tools/check.mjs` (my one `PORT-BUDGET` line),
`tools/claims-draw-audit.mjs` (one separate statement `KNOWN_UNCLAIMED.morskoy`, placed just before the "engine" section), `src/world/lib/owns-table.js` (regenerated by `node tools/owns-table.mjs`, 51 modules: it WILL conflict with the other branches, the integrator regenerates).
Proof that the old areas are untouched: `node tools/area.mjs palace|vasilyevsky tools/check.mjs --area-modules` before (main checkout, `area-gdm` clean) and after: the `module / triangles / meshes / colliders` lines and the `knock:` line are IDENTICAL (114 and 102 lines).

## Checks (all CPU, `node tools/area.mjs morskoy ...`, no bake / GPU / crowd / traffic / flow / handoff test)

* `check.mjs landmarksMarineFacade`: ok, 89,945 triangles, 2,225 colliders, knock `{fence 1989, booth 3, mast 18}`.
* `check.mjs --area-modules` (once): RESULT OK, 11 modules, no module error. Measured: environment 807,898, streets 488,836, city 353,798, landmarksMarineFacade 89,587, landmarksVOStatues 9,746, bridges 24,832, props 81,690, wildlife 47,152, drive 15,260.
  ONE warning that is not mine: `city: 353,798 triangles exceeds budget 350000` (the foundation's estimate row; the city module will draw less once the Pribaltiyskaya cluster claims its buildings; the lead re-measures the `city` row at the integration).
* `landmarks-groups-check.mjs`: OK (all 8 groups 100 % in play).
* `claims-draw-audit.mjs`: OK, 13 warnings, 1 note. The warnings are the 13 claimed street-furniture NODES of `mf-furniture` (n3283815681, n5235032091 ... n11865406106: not in the `MANMADE` layer, claimed in the source to keep the generic props away from the closed port, nobody draws a replacement: verbatim source behaviour).
  The note (`KNOWN_UNCLAIMED.morskoy` r7378336): the gold lattice crowns of Golden City stand on the parts r12001859 / r12001860 of the generic block Chelyuskina 4 s1 (788 triangles above 1.5 m inside its outline), the source's documented overlay.
* `water-reachable-test.mjs --quick`: 15 checks pass, 1 fails: check 9 (two ways of the Korablestroiteley bridge drop a car into the water): the bridge cluster B, not this module. Checks 0 (every fence record owns its box), 1, 2, 3 (a knocked bay opens the way), 4, 6 (every thin tall collider within 12 m of water is a knock record: no ALLOW row added), 8 pass.
* `knock-stands-test.mjs`: 7 checks pass (check 5 / 6 skipped for Morskoy: no kiosk or cart is placed there; the foundation's own change).
* `views-check.mjs --land`: 20 poses, 0 failing. `area-garage-check.mjs`: OK (the one purple Zhiguli). `layout-test.mjs`: OK (after the fix of my own `mustHaveAreas` row: the original point (-9040, -1750) lies in the basin water, where the HUD says Gulf of Finland, so the row uses the land point (-8699, -1800)).
* `owns-table.mjs --check`, `closure-lint.mjs`, `import-lint.mjs`, `runtime-only-lint.mjs`: OK. (The module's ten parts are literal `import()`s in `PARTS`: no closure-rules row needed.)

## Open items / notes for the lead

* The `water-reachable-test` check 9 failure (Korablestroiteley) belongs to cluster B (`bridgesMo`).
* Budget row `city` of morskoy: see above (353,798 against the 350e3 of the foundation). The other rows of the base modules are the foundation's.
* Golden City: the gold crowns of the four further blocks of the row (r10998487 17 storeys at (-8990, -1035), r12042605 20 storeys at (-9157, -1081), w1131312075 / w1131312076) are NOT built in the source or here (irregular U-blocks); they are the one authoring candidate of this cluster (a lattice crown costs about 1 .. 2 k triangles
  each: crown() in `goldencity.js` takes any ring and a height). Not started: the brief said "only if clearly missing", and the quarter-6 spire the map names is built. The crowns of r12001859 / r12001860 (view Shift+6, "ряд золотых шпилей") are built.
* The marina has no floor and no collider (source design: "nobody can reach them"): a walker or a swimmer passes through the pier and the yachts. Authoring option: walk floors for the 595 m pier.
* The 7 lift gates have no booth (see above) and no collider on housing or boom; the "booth" knock path is inert here.
* The Mayak objects are the source's tier-3 placeholder column (the dossier calls the design undocumented).
* The `landmarksMarineFacade/tools` walk probe of the source (`tools/landmarksMarineFacade-walk.mjs`) was not ported (a source-project tool).
* Port style of the berth edge is the generic granite `neva` wall of the environment (no PORT wall class, no mushroom bollards, no natural Gulf slope): the scout's decision D4, unchanged.
* Merge notes: the conflict-prone files are `src/world/lib/owns-table.js` (regenerate), `tools/claims-draw-audit.mjs` (one inserted statement before the "engine" section), and the marker lines of `area.js` / `rings.js` / `check.mjs` (each replaced in place; the separators untouched).

## Texts that need the owner's check (Russian, true facts)

* HUD / label rows added: "Морской фасад · Marine Facade", "Golden City · квартал 6 со шпилем" (the residential complex Golden City, quarter 6, with the gold spire: from the source dossier), "Маяк · арт-объект · Mayak art object" (two art objects named «Маяк»; the source marks their design as undocumented),
  the loading label "Морской фасад, Golden City".
* Source texts carried verbatim: the group names / notes in `groups.js` ("Морской вокзал: четыре терминала и ЦУП", "Морской вокзал: КПП и залы досмотра", "Морской вокзал: ангар на мысе", "Яхтенная марина порта и арт-объекты «Маяк»", "ЖК Golden City, квартал 6 со шпилем"): these use the name
  "Морской вокзал" for the passenger port "Морской фасад", which is also the name of the separate Sea Terminal at Gavan: the owner should decide which wording the map shows. The plates "МОРСКОЙ ВОКЗАЛ 1..4 TERMINAL" on the terminals (`terminals.js`, through `ctx.services.labels`) and the nine photo-spot names (`spots.js`) are the source's.
* `src/areas/morskoy/page.json` facts about the Marine Facade (opened 2008, on the land fill, cruise liners and ferries) and Golden City (golden spires) are the foundation's, not changed here.
