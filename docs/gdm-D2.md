# Dekabristov Island, cluster D2: Primorskaya and the land fill (branch `gdm-d2`)

Part of the area-gdm effort (docs/AREAS.md 15.g, area `dekabristov`, map k=51). Two NEW modules, authored for n4spb (the source project never drew this island: docs/VO-BRIEF.md "generic", docs/research/gaps-vo-2026.md G05 / G07 / G08 / G23), in the way of the
Vasilyevsky wave (docs/vo-m4.md): a `groups.js` of claims (pure data), the module file with `OWNS_GROUPS`, the Parts collector (copies of `landmarksVOStatues/kit.js` and `landmarksSeaTerminal/inst.js`: modules never import each other),
knock bays / records for everything that can be moved or broken. Cluster D1 (cemeteries, the Decembrists' garden) works in parallel in its own slots.

## Modules

| Module | Files | Lines | Triangles (check --area-modules) | Colliders | Knock records | BUDGET_AREA.dekabristov |
|---|---|---|---|---|---|---|
| `landmarksPrimorskaya` | 6 + 2 copies | 563 | 2,898 | 54 | 28 (12 of them parapet bays) | 3.4e3 |
| `landmarksFill` | 7 + 2 copies | 826 | 40,932 | 1,400 | 962 (473 hoarding bays) | 47.1e3 |

Budget rows are measured + 15 % (the two `PORT-BUDGET` lines of `tools/check.mjs`); the cap of the brief was 40 k (Primorskaya) and 50 k (Fill). Build time in the page: about 0.03 s and 0.4 s.

## IMPORTANT correction to the brief: where Primorskaya stands

The brief (and the scout report, and the first HERO of the skeleton) put the pavilion at (-6349, -1823). That point is the centre of the UNDERGROUND platform polygon w394449823 (107 x 73 m, layer -4) and the station node n249307184
(-6337, -1818, depth 70): both lie under the apartment blocks (w16095983 and neighbours); there is no building of the station there. The mapped SURFACE VESTIBULE is 190 m to the west, at **(-6520, -1800)**:
the hall w149345779 (building=train_station, 1 storey, 3.3 m, 25 x 13 m) carries the three mapped entrances n3870045073 / n3870045075 (west end) and n3870045077 (exit, north-west corner); the two-storey block w149345769
(building=transportation, 6.6 m, 10 x 10 m) adjoins its north side; the underground passages w394449823 / w108191369 (highway=steps, tunnel) run east from the hall to the platform. The source project's own note says
"Primorskaya (-6515, -1810)". The module is built on the real buildings. The platform polygon is kept as it was in the HUD row of the skeleton (the station is under that spot).
The hall stands UNDER the raised parts of the office complex w85426975 (parts w533259377 5 .. 11 m, w533259380 11 .. 45 m, w533259379 45 .. 49 m: the Metro Museum POI n1938706048 lies in that complex): the hall roof is at 3.3 m, the parts start at 5 m.

## `landmarksPrimorskaya`

* `vestibule.js` (1,268 triangles): the hall as a glazed pavilion (curtain wall with a granite plinth on the south long side, the west end and the north-west corner; solid plaster elsewhere; a thin roof beam that overhangs the glazed fronts; the fascia
  ПРИМОРСКАЯ on the west end and on the north-west corner with the green stripe of the line (the OSM colour of the entrances is `green`); a blue М over the west end, kept below the 5 m soffit of the raised part); the block w149345769 as a
  plastered mass with two ribbons of windows (they glow at night: `glassLit`, `ctx.shared.uNight`). Each entrance: a pair of glass doors, a granite step, a small porch on two slim posts. **No metro network and no hall under the ground exist
  in this build: the doors stay SHUT**, the walls are solid colliders (`lib/massing.js addPolyColliders`), nothing is interactive (no `ctx.interact` item: there is nowhere to go). The three entrances are published as door points
  (`ctx.services.landmarksPrimorskaya.entrances`: `{ x, z, rotY, bldg, kind: 'subway' | 'exit', clearance }`, 0.6 m outside the wall, rotY facing out, the convention of `lib/door-points.js`); `PRUNE_SERVICES` clears the trees from them.
  `HOOKS.doorServices` (the pedestrian door list of people/nav.js) is a hook of `src/areas/north/hooks.js` and names only the North's services: not edited (shared file), see Open items.
* `square.js` (the furniture, knock records): the two benches n8048805552 / n10795206854 and the two litter bins n12736971860 / n12736971861 of the OSM data are CLAIMED (props/osm.js skips a claimed bench / bin) and drawn at their OSM
  positions, the benches turned to the hall; a blue М totem (5.6 m, the М on both faces), four lamp posts (6.3 m), six granite planters, the signboard of the Museum of the Petersburg Metro (2 m board on two posts, 4 m south of the POI,
  facing the footway). The positions of the extra pieces are ring-searched on free ground (off buildings, roads, footways, 12 m off the water).
* `stairs.js` (two flights of granite stairs down the north bank of the Smolenka, 100 triangles each): **not mapped in OSM, authored** (the lead's brief and the source's gap list G05 name "the Smolenka bank stairs"). The recipe is that of the
  Nalichny Bridge corner stairs (`bridges/pits.js`, `stairs.js`, `sculpt6.js stairPit`): each flight stands in a PIT handed over as a water ring (`WATER_RINGS` -> `WATER.ownerRings`, key `smolenka`, via `rings.js`), plus `KEEP_OUT` (r 7 m) and
  `PAVED_RINGS` (no trunks / tufts on the pavement). The flights: bank points (-6540, -1696.3) and (-6470, -1676.5) (the first water cell going south at that x: the bank is a straight line of bearing 15.8 deg here, the embankment footway
  runs 8 - 10 m inland), 4.4 m wide, 3 lower steps + a 1 m landing + 16 steps of 0.30 x 0.166 m, 6.7 m from the bank line to the street end (the footway edge); the landing is 0.8 m over the water. Colliders: a sticky walk box per lower step
  and for the landing, ONE walk ramp over the flight; **no guard box at the river end** (a walker steps off the lowest tread into the river, as at the Academy pier).
* `groups.js`: `primorskaya-vestibule` (ids w149345779, w149345769; osm the three entrance nodes), `primorskaya-square` (osm: the 4 furniture nodes; the stair rings belong to it), `metro-museum` (osm n1938706048, the POI node; the office complex
  stays the generic city's). `rings.js` imports the module: `WATER_RINGS` 2 (`smolenka-stairs-1`, `-2`), `KEEP_OUT` 2, `PAVED_RINGS` 2.
* Slots filled in `src/areas/dekabristov/area.js`: IMPORT, MODULE, LABEL, GROUPS, AREAS (vestibule r 30, museum r 24, two stair rows r 7), CLAIMED (`w149345779`), PRUNE; ZONES: a people hot spot (-6540, -1805), a pigeon zone `primorskaya-sq`
  (-6540, -1806) and its CROWDS entry, inserted ABOVE the shared `// PORT-ZONES` markers (so that D1's rows below them merge without a conflict). HERO and view Digit4 look west at the vestibule now (yaw toward (-6528, -1800), pitch 6).

## `landmarksFill`

The fill "Новый намыв острова Декабристов" is OSM `landuse=construction natural=sand` w1053534560 (1.49 km2 in the cut). Its west part (x < -7900) has no building and no street in OpenStreetMap except the ZSD ways and one private service way
(docs/research/dekabristov-data.md, OSM-LAND-REPORT.md section 2). The module invents nothing that claims to be real: it draws the generic fabric of any new district under construction, on the `construction` ground class that the engine
already applies to the polygon (gravel / dirt; the claim of the polygon changes nothing there: no consumer of a claimed landuse).

* `plan.js` (pure computation, deterministic): a grid parallel to the coast (frame A0 = (-8047, -3507), D1 = (-0.8187, 0.5740) along the coast, D2 = (0.5740, 0.8187) inland): four avenues (t 120 = the embankment roadbed 26 m, 340, 570, 800) and
  cross streets every 260 m from s -200 (14 m), cut wherever they meet a real road or footway, a building, a green / parking polygon, a view pose / the start / the car, or within 22 m of the water (13 pieces, 7.9 km). 21 plots of 96 x 140 m
  (a rectangle is tested on a 7 m grid, at least 40 m from the water): by distance to the built corner (s -100, t 520): 4 topped-out frames with half the cladding on, 5 bare frames, 3 foundation fields, 3 container yards, 1 concrete
  batching plant, 5 graded pads.
* `roads.js`: the roadbeds as decals (hardcore with two lighter shoulders, 6 triangles per 30 m, no collider). `site.js`: frames (columns on a 6.4 m grid, slabs, a core, cladding with window bands, a safety net on the top two floors,
  formwork tables, a construction hoist), foundation fields (pile heads, strip footings), tower cranes (lattice masts and jibs as alpha-tested lattice planes, ballast blocks, cab, trolley, hook: no flags, no aircraft lights), the batching plant
  (4 silos, mixer house, charging belt, 3 aggregate bunkers), pads. `stuff.js`: hoarding bays (12 m, the corrugated sheet texture), containers (189), site cabins (45), pallets (108), big-bags (48), pipe piles (21), excavators (6), dump trucks (8),
  floodlight masts (64: three per fenced plot and one every 100 m on the embankment roadbed; their heads glow at night).
* Triangles: static 14,224 (roads 1.6 k, topped 5.1 k, frames 4.1 k, pits 2.8 k, plant 0.6 k), knock instances 21,978 (containers 7.2 k, cabins 1.8 k, pallets 3.2 k, bags 1.0 k, pipes 3.0 k, masts 3.2 k, machines 2.6 k), hoarding 4,730.
* `groups.js`: one group `fill-construction` (osm `w1053534560`, at (-8400, -3000)), `ZONE_RING` (the outline of the polygon without its built east tail: the HUD name "Новый намыв · New land fill"). No water ring, no keep-out, no paved ring.
* Slots filled: IMPORT, MODULE, LABEL, GROUPS, AREAS, CLAIMED (`w1053534560`). PRUNE: not needed (the module publishes no entrances); ZONES: no rows (no people / wildlife on a building site).

## World rules: what is breakable, what stays solid

* **Water is reachable.** Every plot is at least 40 m and every roadbed at least 22 m from the water (verified: the lowest distance of any of the 1,400 colliders of the Fill to a water cell is 31 m); nothing is built along the shore (no fence,
  no wall, no barrier along the Gulf coast of the fill); no collider, ring or keep-out of the Fill touches water. The Primorskaya stairs end in the river without a guard; their pits are `WATER.ownerRings`.
* **Knock BAYS** (`lib/fence-bays.js knockBays`, one collider + one record per bay): the Fill hoardings (473 bays, kind `fence`, 500 kg, anchored 16 km/h; the gates of 10 m are gaps); the six parapet bays of the Smolenka stairs (kind `fence`).
* **Knock RECORDS** (`lib/knock-inst.js knockInstances`, the collider is removed at the knock, a rest box <= 0.42 m): containers (kind `booth`, 2.2 t, anchored 26, instance colours), site cabins (`booth`, 0.9 t), pallets and big-bags (`crate`),
  pipe piles (`crate`, 2.6 t), excavators and dump trucks (`booth`, 7 t / 5.5 t, anchored 38 / 34), floodlight masts (`lamp`, anchored 22); Primorskaya: benches, bins, planters (`planter`, a record of the module), lamps, the totem (anchored pole),
  the museum sign (`sign`, anchored 14).
* **Solid on purpose (structures):** the walls of the vestibule hall and block (`addPolyColliders`), the slim porch posts (r 0.1); in the Fill the columns, cores and first-floor walls of the frames, the crane masts and ballast bases, the
  silos, the mixer house and the aggregate bunker walls. **No colliders at all:** the roadbeds and pads (decals), the foundation fields (ankle high: footings and pile heads of at most 0.5 m, flat like a kerb) and the retaining faces of the
  stair pits below the street (the terrain beside a pit is the wall, as for every pit of the engine).
* Objects stay movable: nothing of the two modules is a static prop that a car cannot move except the structures above. The one purple Zhiguli stays at (-6420, -1793); nothing is placed within 24 m of the start, the car or any view pose.
* No flags, no flagpoles (user rules; the cranes carry none, the vestibule has none).

## Shared files edited

None of the engine (`src/world/*` outside the two new modules and their folders, `src/core`). Edited: `src/areas/dekabristov/area.js` (my marker lines, the HERO / Digit4 yaw, the three ZONES rows above their markers), `src/areas/dekabristov/rings.js`
(the Primorskaya import and source lines), `tools/check.mjs` (my two `PORT-BUDGET` rows), `tools/claims-draw-audit.mjs` (one separate statement `KNOWN_UNCLAIMED.dekabristov`, inserted before the Gavan block), `src/world/lib/owns-table.js`
(regenerated by `node tools/owns-table.mjs`: 52 modules: it WILL conflict with the other branches, the integrator regenerates again). `src/world/lib/owns-table.js` is the only shared file of the list: with the previous table the module lines
(triangles / meshes / colliders of every module) and the `knock:` census of `check.mjs --area-modules` of **palace** (28 modules) and **vasilyevsky** (25 modules) are identical before and after (the two keys are never read by an area that does not list the modules).
`tools/claims-draw-audit.mjs`: `KNOWN_UNCLAIMED.dekabristov` = `w85426975` and `w533259377`, the office complex whose raised parts start 5 m above the hall (106 triangles of the hall walls between 1.5 and 3.3 m lie inside their footprints).

## Checks (all CPU, `node tools/area.mjs dekabristov ...`)

* `check.mjs landmarksPrimorskaya` / `landmarksFill`: RESULT OK; `check.mjs --area-modules`: RESULT OK, 13 modules, no module error.
* `landmarks-groups-check.mjs`: OK (all groups of the two modules: ids found, extents inside).
* `claims-draw-audit.mjs`: RESULT OK, 44 warnings (the foundation's Smolensky points), 2 notes (the waiver above). The Fill owns 1 claimed id (drawn) and stands inside no building; Primorskaya owns 10 claimed ids, 9 drawn, the POI node of the museum is a warning (a sign stands near it, nothing "inside" a point).
* `water-reachable-test.mjs --quick`: 15 of 16 pass; the failing check 9 is the drop of a car through five bridge decks (Betancourt, Serny, Korablestroiteley ...): the bridge wave, not this cluster. Checks 0, 1, 2, 3, 4, 6 (every thin tall collider within 12 m of water is a knock record: the stair parapets pass without an ALLOW row), 8 pass with the two modules built.
* `knock-stands-test.mjs`: 7 of 7 (checks 5 / 6 skip: this area places no kiosk, cart or spare A-frame).
* `views-check.mjs --land`: 17 poses, 0 failing (with both modules built); `area-garage-check.mjs`: OK (the lada and the spawn at (-6420, -1793)).
* Also run: `import-lint`, `closure-lint` (432 files in the dekabristov closure, nothing unknown: every import of the two modules is a literal), `runtime-only-lint`, `owns-table.mjs --check`: OK.
* A private audit of every collider of the Fill (1,400): none on a road or footway, none inside a building, none within 31 m of the water. A private check of the vestibule triangles: every glass quad faces outward.
* Not run on purpose: GPU, bake, crowd / people / traffic / wildlife / flow / handoff tests. **No visual check was possible (no GPU): colours, proportions and the look of the cranes and frames are unseen.**

## Open items

* **Bake.** The area's bake stales (the modules and the rings change the closure and the owner water): the lead rebakes `dekabristov` once, with the other clusters. The two water rings change the ground field of the bake (a hole at each pit).
* **People / traffic do not know the Fill objects** (hoardings are `fence` boxes that `people/nav.js` reads as walls; no route was re-baked): the Sevkabel precedent. The door points are not in `HOOKS.doorServices` (a hook of `src/areas/north/hooks.js`, a shared file: add `'landmarksPrimorskaya'` to its DOOR_SERVICES gated by the module list if pedestrians should enter and leave the vestibule).
* `TEST.mustHaveAreas` (shared table) has no row for the new HUD names; suggested rows: `{ x: -6522, z: -1802, has: 'вестибюль' }`, `{ x: -8400, z: -3000, has: 'намыв' }`.
* The Metro Museum is only a signboard: the office complex w85426975 is a skip parent with raised parts and no ground footprint in the data (the generic city draws the parts); a door / entrance of the museum is not mapped.
* Sites whose rectangle would touch the water, a road or the green polygons are skipped, so the number of plots follows the data: 21 now. Raise `TYPES` in `plan.js` / the budget if the lead wants more cranes.
* The fill roadbeds stop 3 - 10 m short of a real road (no junction geometry); the ZSD ramps and the `highway=proposed` extensions of Kruzenshtern / Morskaya (not in the bake) are not drawn.

## For the owner: hand-check items (texts and facts)

TRUE (from OSM tags, checked against the data): the name of the polygon "Новый намыв острова Декабристов"; the station name "Приморская" and its green line colour; the museum name "Музей Петербургского метрополитена" (n1938706048); the three entrances and the exit;
the building heights (3.3 m and 6.6 m: `building:levels` 1 / 2). Russian texts of the modules for the owner to read:

* the fascia **ПРИМОРСКАЯ** (west end, north-west corner), the blue **М**; the museum sign **МУЗЕЙ ПЕТЕРБУРГСКОГО МЕТРОПОЛИТЕНА** (no opening hours: the OSM hours may be stale);
* HUD rows: «Вестибюль станции «Приморская» · Primorskaya metro vestibule», «Музей Петербургского метрополитена · Museum of the Petersburg Metro», «Спуск к Смоленке · Stairs to the Smolenka», «Новый намыв · New land fill»;
* loading words: «станция «Приморская», площадь, спуски к Смоленке», «Новый намыв: стройплощадки, краны, контейнеры»; the pigeon zone name «Голуби на площади у станции «Приморская» · Pigeons on the Primorskaya square».

NOT mapped (authored, to confirm or drop): the two **Smolenka bank stairs** (a real flight may not exist there), the glazed look of the hall (OSM gives the footprint and 3.3 m only), the **whole dressing of the fill** (plots, cranes, containers, the planned grid: a plausible
young district, not a map of anything), the totem, lamps and planters. Whether the Primorskaya vestibule really stands under the raised arcade of the office complex follows the OSM parts (5 m minimum height) and is unverified on site.
