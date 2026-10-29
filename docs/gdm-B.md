# Gavan / Morskoy / Dekabristov Island, cluster B: the bridges and the Smolenka mouth (branch `gdm-b`)

Part of the area-gdm effort (docs/AREAS.md 15.g; areas `gavan` k=49, `morskoy` k=47, `dekabristov` k=51; territories policy B600). Source project: `102_3d_piter` commit 0568f7af (read only), method as the Vasilyevsky bridge cluster
(docs/vo-br.md, docs/AREAS.md 13.7 / 15.2 "World rules in the ported modules"). The version is not touched here (the lead bumps 3.1.1 -> 4.0.0 once). Nothing is baked: every file below is in the closure of all areas that import it.

## 1. What was done

| # | Task | Result |
|---|---|---|
| 1 | The WHSD / ZSD highway (`bridges/whsd.js`, `whsd-ground.js`, `cutting.js` + the glue of `bridges.js`) | ported, built per area from the SAME stations of the whole line (section 3); the at-grade stretch, its open cutting, the twin viaduct, the portals of the Smolenka mouth tunnel, the Korabelny pylon |
| 2 | Claim and build Korablestroiteley, the 1st .. 4th Smolensky mouth bridges, `river.js` `SITE_OF` +5, zone / shade rows, `groups-mo.js`, `rings.js` | done in Morskoy (all five) and Dekabristov (all five); Gavan holds none of them |
| 3 | Betancourt (-4600, -3040) and Serny (-4930, -2551) | the source HAS builders: `bridges/petrovsky/*.js` ported (Betancourt complete, Serny, and the WHSD fairway bridge pylons that also stand in Dekabristov); water-reachable check 9 green |
| 4 | `quay.js` Smolenka mouth arms for x < -7490 | ported, keyed (section 5) |
| 5 | The Dekabristov data defect (Smolensky cemetery in 7 slabs) | fixed in the cut: `KEEP_WHOLE_IDS` (section 6) |
| 6 | `water-reachable-test`, `boat-passage-test` for morskoy and dekabristov | all green (section 8); the smol2 deck over the mouth is no longer shut |

## 2. Modules, files, triangles

No new module: everything is in the existing module `bridges` (`src/world/bridges.js`). `check --area-modules` (CPU), `bridges`:

| area | triangles | colliders | knock records of the corridor (fence / lamp) | per bridge (triangles) |
|---|---|---|---|---|
| morskoy | 79,384 (BUDGET_AREA 92e3) | 2,791 | at grade 576 / 80, viaduct 299 / 51 | Nalichny 5,440; Korablestroiteley 5,256; smol1 1,198; smol2 1,146; smol3 1,938; smol4 1,938; Novo-Andreevsky 3,488; **WHSD 30,382**; Palace Bridge 14,540 |
| gavan | 71,830 (83e3) | 2,203 | at grade 410 / 60, viaduct 633 / 80 | Nalichny 5,440; Novo-Andreevsky 3,488; **WHSD 36,688** (to the Korabelny pylon at z 1275); Palace Bridge 14,540 |
| dekabristov | 88,356 (102e3) | 3,648 | at grade 238 / 31 | Uralsky 2,908, Smolensky 3,996, Nalichny 5,440, Novo-Andreevsky 3,488 (the four shared with Vasilyevsky); Korablestroiteley 5,256; smol1 .. smol4 1,094 / 1,094 / 1,938 / 1,938; **WHSD 8,286** (portals + the first 640 m at grade); **Betancourt 18,306**; Serny 572; WHSD fairway bridge 5,066; Palace Bridge 14,540 |

(The 14,540 triangles of the Palace Bridge are built in EVERY area, old and new: `bridges.js` builds `buildPalace` unconditionally, pre-existing, not touched. It is a waste of 14.5 k triangles in each of the three new areas: open item.)
`environment` in morskoy / dekabristov changes by the mouth arms (762,352 / 1,043,966 triangles: the wall of the arms is one mesh, the generic railing of 'bars' is gone there).
`landmarksSmolensky` in dekabristov: 275,783 triangles (was 100,033; vasilyevsky 282,433, the same cemetery inside a smaller extent).

Files (1,103 new lines, each ported file with a provenance line at the top; the n4spb adaptations are marked `n4spb` in the code):
`bridges/whsd.js` (241), `whsd-ground.js` (136), `cutting.js` (78, verbatim), `bridges/petrovsky.js` (17), `petrovsky/{route.js (47, verbatim), deck.js (133), betancourt.js (143), serny.js (79), stair.js (113), whsd.js (77)}`,
`bridges/groups-mo.js` (39, NEW, imported only by the three new areas).

## 3. The WHSD in three areas

The corridor is 2.4 km long and lies in three territories (play rectangles): Dekabristov holds the tunnel portals (-8158, -1981) / (-8136, -1973) / (-8073, -2259) and the first 60 m, Morskoy the whole at-grade stretch to z -300 and the viaduct to z 164,
Gavan the stretch from z -956 and the viaduct to z 1042. `buildWhsd` therefore builds only the stations that lie in the data extent of the area (`EXTENT_RECTS` of `data/city.js`) grown by `WHSD_MARGIN` = 300 m: a viaduct that ends 120 m behind
the edge of the walkable area is a stump in the sky, and with 300 m more the Korabelny pylon (-7850, 1275), 35 m outside the Gavan extent, stands with the deck its stays hang from.
The stations, the columns (every 55 m), the lamps (every 40 m) and the barrier chunks (12 m) come from the SAME indexes of the whole line in every area, so the parts of two areas that overlap are identical triangles and the seams are continuous
(checked: the same stations; a cap across the girder closes every cut end). Pylons and portals are built where their centre lies in that range; the second pylon (-7883, 1594) lies in no area (open item). `B.deckAt` answers only on the built part
(`services.bridges.deckY` for the car), `B.bounds` and the traffic anchors come from the built stations.
`whsd` is a group key of the area (`groups-mo.js`, claimed ids as the source: the four viaduct ways; Dekabristov claims the two tunnel ways and the first at-grade ways it holds, Gavan the viaduct ways); `whsd-crossings` (the Mikhmanskaya overpass
and the park footbridges: the decks only, the crossing is at street level) in Morskoy (all four ids) and Gavan (the two footbridge decks). The grass embankments of the cutting (`cutting.js bank()`) are PAVED_RINGS of the three areas (no trunks, hedges,
beds, tufts on them); the at-grade carriageways hold no tree or hedge collider (checked), the street lamps of the data do not stand on the decks (checked), so `openWhsdLamps` of `gaps.js` is not needed and not called.

## 4. Owner rules in the ported code

Method: `bridges/rails.js` (`rails.parapet` bays: the drawn concrete section + a thin collider + one knock record each, `rails.wall` = ghost bays, `rails.add` = railing bays) and `bridges/knock-posts.js` (`postBatch`: lamp posts), both used as
the Vasilyevsky bridge cluster used them.

* **WHSD**: the two barriers of every viaduct deck (0.45 x 0.95 m concrete, 12 m bays, sloped with the deck: `y` / `ye`), the median barrier of the at-grade carriageways (6 m bays) = `rails.parapet` bays (record kind `fence`, mass 700, anchored 18 km/h);
  the quads of the source (top and faces) are gone, the bay draws them. The 9 m cobra lamps (viaduct and at grade) = knock posts (kind lamp; the source had no collider for them; the pole stands on the barrier, its collider reaches down to the road).
  The caps of the median barrier at the crossings stay as drawn quads (a 0.45 m end face).
* **Betancourt** (`petrovsky/deck.js`): the median barrier and both outer barriers = parapet bays of 8 m (instead of the solid boxes `addBox`); the railing boxes of the source are gone (the tube railing is `rails.add` = knock bays already, the openings
  of the two pylon stairs stay open); the cobra lamps = knock posts; the handrail boxes of the stairs (`stair.js`) and the landing enclosure = ghost bays (`rails.wall`, the drawn tube handrails stay as decor).
* **Serny**: lamps = knock posts, the two 0.28 m railing boxes gone (railing bays), the granite wings beside the abutments = ghost bays through `closeBank` with `ctx`; the environment's quay boxes that poke into the pavement are removed only where they
  are no knock record.
* **WHSD fairway bridge** (`petrovsky/whsd.js`, skyline scenery in the source: no colliders at all): no walk floor (`noWalk`, as the source), but its barriers and lamps are the same breakable bays / posts.
* **Smolenka mouth** (`quay.js`): the arms have no railing (the bare cornice of the source), so the bank is an OPEN edge: nothing to break, the water is reachable. `closeBank` (`long.js`): the ghost collider that ran on beyond the drawn wing along the
  open bank (up to 14 m, looking for the quay collider that is no longer there) stops at the drawn wing for x < -7490 (it was an invisible wall in the water for the boat oracle).

Solid on purpose (structures): the viaduct columns on land (24 cylinders) and over water (pillars through `bridges/piers.js`, a pile cap per pair), the soffit box where the girder hangs lower than 1.8 m (z -300 .. about 20), the portal headwalls, the
grass embankments of the cutting where higher than 0.6 m (terrain, solid as in the source), the Betancourt tulip piers with their collars, the pylon legs and plinths, the slim columns under the stairs, the pile caps of the fairway bridge, the abutment
faces of Serny, the walk ramps (the floors of the decks). Not ported on purpose: `petrovsky/shore.js` (a granite wall with a 9 m tall solid box along the bank under the Betancourt viaduct: a wall of colliders at the water, the generic quay with its
breakable bays stands there instead).

## 5. quay.js, Smolenka mouth arms (keyed)

Ported from the source `quay.js` 94, 300 .. 308, 566, 612, 904 .. 921, 1314 .. 1315: a PALE GREY wall (`WALLS.mouth`, own texture) and a paved lower berm 0.6 m over the water at its foot (`bermTexture`, 2.2 m wide, no berm at a bridge gap, a descent, a gate) for the
Smolenka bank pieces with x < -7490 **inside the data extent** (`segMouth`: the Vasilyevsky data holds Smolenka banks up to x -7840 as scenery 600 m beyond its extent, they stay as they were); the mesh and the textures are made only where such a piece exists
(`!face.mouth.empty`), so no canvas and no mesh in the other areas. Proof: `check --area-modules` of palace and vasilyevsky: module triangles, meshes, instances, colliders, wires and the knock census are IDENTICAL before and after (before: mesh +2, triangles +76
in vasilyevsky until the `inExtent` guard was added); `layout-golden --diff` of the strip and the north: identical.

## 6. The Dekabristov data defect

`strip-data-clip` cuts a polygon to the union of the extent rectangles and gets one polygon per SLAB of the union: the Smolensky Orthodox Cemetery (GREEN r2736670) was 7 pieces in `src/areas/dekabristov/data`, and `landmarksSmolensky/frame.js`
`cemeteryRing()` takes `polys[0]` (14 % of the ring) and `place.js` / `fence.js` classify the ring edges BY INDEX (13 .. 27 = the river, 0 .. 12 = the Maly / Beringa fence): a merge of the pieces in `frame.js` would have given a ring with other indexes, so the
cemetery would look different from the Vasilyevsky one. Chosen: a **keep-whole exemption in the tools** (`KEEP_WHOLE_IDS = { GREEN: ['r2736670'] }` in `tools/strip-data-clip.mjs`; a record that touches the union stays as it is; `tools/area-data-test.mjs` accepts
its vertices outside the union but demands that it touches it) and a re-cut of ONLY dekabristov: `node tools/area-data-cut.mjs --area dekabristov --orig D:/git2/n4spb-work/gdm/dek-data/out --out src/areas/dekabristov/data` (first proven reproducible: before the
change the cut equals the committed files except the header line of `city.js`; after it ONLY `city-d41.js` changes). `strip-data-clip --in src/areas/dekabristov/data --check`: nothing to change (a fixed point). Old areas: the record lies inside the union in
vasilyevsky (never touched), no other area has it; no engine file changed for this. Result: `landmarksSmolensky` 100,033 -> 275,783 triangles in dekabristov. The 15 % of the ring beyond the Dekabristov extent is built too (scenery nobody reaches).
Side effect: the Xenia chapel view pose of Dekabristov (Shift + 3) had a grave on it with the whole cemetery built: moved 0.3 m to (-5587, -1359.7).

## 7. Shared files edited (all additive and keyed)

`src/world/bridges.js` (the WHSD glue, the Petrovsky list: two gated blocks; the EXT block of cluster G is elsewhere), `bridges/groups-vo.js` (a `pitsOf(prefixes)` helper, the old exports are `pitsOf(['nalichny-'])`: identical), `bridges/long.js` (one line in
`closeBank`: x < -7490), `environment/river.js` (`SITE_OF` +5 ids), `environment/quay.js` (section 5), `tools/check.mjs` (three `bridges` budget values), `tools/strip-data-clip.mjs`, `tools/area-data-test.mjs`, `tools/water-reachable-test.mjs` (one line, section 8). The three area modules only in my markers / rows
(`bridgesMo` slots of Morskoy; Gavan and Dekabristov: new rows after the existing bridge rows, the claims, zones, shades, HUD rows, TEST rows). Proof that the old areas build as before: `node tools/area.mjs palace|vasilyevsky tools/check.mjs --area-modules`
-- every module's triangles, meshes, instances, colliders, wires and the knock census line IDENTICAL before / after (the bridges module of vasilyevsky: 88,160 triangles, 2,194 colliders, both times).

## 8. Checks run (CPU, final tree)

* `check.mjs --area-modules` morskoy / gavan / dekabristov: RESULT OK (morskoy `city` 366,532 > its budget 350,000: not this cluster).
* `water-reachable-test` (--quick and the full run are the same 16 checks) morskoy 16 / 16, gavan 16 / 16, dekabristov 16 / 16 (before: dekabristov check 9 failed for Betancourt 202 + 202 cells and Serny 7 cells). One test line was changed: `pickFence` of check 3 skips a ONE-POST bay (w ~ 0: the lone post at the gate of a quay descent of the Smolenka mouth, whose steps run down 8 m and more, so the walker of the test is still on the steps after its 4.5 m): the pick is a pseudo-random walk over the fence records and moved onto such a post when this cluster changed the number of records. With the change all EIGHT live areas pass `--quick` (palace 22, vasilyevsky 17, smolny 18, admiralty 17, vladimirsky 16 checks).
* `boat-passage-test` morskoy ALL 20 PASSED (7 bridge rows, the smol2 deck included), dekabristov ALL 32 PASSED (14 bridges, Betancourt, Serny, the fairway bridge, 21 pillars rammed), gavan ALL 18 PASSED (the WHSD viaduct over the Gulf, 24 pillars).
  Two oracle findings were fixed in the ported code: the twin columns of a viaduct pier in the water were one pillar of the oracle with a 2.3 m slot (a boat passed through it): a pile cap block joins the pair; the 18 x 18 m pile caps of the fairway bridge
  were a wall of water wider than 12 m: two 7 x 7 m caps.
* `landmarks-groups-check` OK in the three areas (the ids that a territory does not hold are left out of the claimed rows through `mo(keys, { key: { osm, at } })`); `claims-draw-audit` OK: warnings by design: Korablestroiteley `w1102801992` / `w1161949783`
  (the OSM steps lie 8 .. 12 m from the flights of `pits.js`: source geometry), `whsd-crossings` decks (no builder on purpose), the Dekabristov at-grade ways `w1257246773` / `72` not claimed any more.
* `knock-stands-test` 7 passed, `area-garage-check` OK, `views-check --land` OK (morskoy 20 poses, gavan 21, dekabristov 17 after the pose move).
* `import-lint`, `closure-lint`, `runtime-only-lint`, `owns-table --check` (50 modules, unchanged) OK; `layout-golden --diff` strip and north identical.
* `area-data-test --area dekabristov`: the new checks pass; the 5 failing checks are the strip-specific ones of the foundation (Tauride sights, TRAM_ROUTES, RIVER fontanka, header commit) and two LANDUSE vertices 0 .. 1 m outside the union (`w704134882`, `w108430616`), all unchanged by this cluster.
* Not run on purpose: bake, GPU, puppeteer, crowd / people / traffic / flow / handoff tests.

## 9. Open items

* Not looked at on a GPU: the pale grey mouth wall and berm, the WHSD look (barriers as bays), the Betancourt (pylon platforms, stairs, shoreline under the viaduct), the cap blocks. The bake is the lead's.
* The Palace Bridge is built in every area (14,540 triangles each, pre-existing); the second Korabelny pylon (-7883, 1594) and the 1.4 km of viaduct beyond z 1540 are in no territory (the deck ends with a cap 300 m behind the Gavan extent).
* The WHSD at-grade stretch is not in `streets` (motorway is no drivable class): no lanes, no traffic; the car drives on it like on any ground (asphalt top 0.025 over 0.0).
* Betancourt: no water-shade row (`BRIDGE_SHADES`), no quay opening row (a viaduct 10 .. 18 m high: the generic quay stands under it); Serny has a zone row.
* The Mikhmanskaya overpass and the park footbridge decks of `whsd-crossings` have no builder (as in the source: the streets are flat, the crossing is at street level): three audit warnings.
* Bolshoy Petrovsky (-5392, -3625) lies outside every new territory: not ported.
* `whsd-petrovsky` is a group without a claim of its own in the source; here it claims its three ways (they are motorway bridge ways, not drawn by `streets`).

## 10. For the owner to check (Russian texts and facts)

HUD rows and view labels (the numbering of the bridges is the source's, taken from the OSM deck polygons, NOT from Wikipedia: please check that the 1st .. 4th Smolensky bridges are the right ones at the right places):
'Мост Кораблестроителей', '1-й / 2-й / 3-й / 4-й Смоленский мост' (-8059.5, -2005.4), (-8008.7, -2182.8), (-7955.6, -1975.4), (-7903.2, -2151), 'Мост Бетанкура', 'Серный мост', 'Мост через Петровский фарватер (ЗСД)', 'ЗСД' (Gavan HUD row).
The group names of `groups-mo.js` are the source's texts, copied. The numbers of the BRIDGE_ZONES / BRIDGE_SHADES rows are the source's (`environment/waterways.js` 259 .. 263), Serny's from its builder frame.
