# Vasilyevsky-Okrug 7, cluster M3 (the island interior): landmarksAndrew, landmarksSredny, landmarksModernVO, landmarksVOStatues

Branch `vo-m3` (off `area-vasilyevsky` c812a65). Notes of the port; `docs/AREAS.md` is not edited here (the lead merges 15.v). Version, `CHANGELOG.md`: not touched (the lead bumps).

## What was ported

Copied verbatim from the source project 102_3d_piter, commit 0568f7af (`git show 0568f7af:src/world/<module>.js` and the folder), one provenance line each in the top-level module file, `OWNS_GROUPS = true`:

| Module | Files | Triangles (measured, `check --area-modules`) | BUDGET_AREA.vasilyevsky | Groups claimed |
|---|---|---|---|---|
| `landmarksAndrew` | 32 | 212,917 | 245e3 | andrew-cathedral, andrew-market, andrew-boulevard, andrew-pavilion, andrew-pel, andrew-annunciation (6 of 6) |
| `landmarksSredny` | 25 | 82,349 | 95e3 | tram-depot, gorny-pavilions, geolkom, dom-evangelia, chernikhov-tower, frank-mansion (6 of 6) |
| `landmarksModernVO` | 28 | 153,951 | 177e3 | the 12 hero houses (smirnov, teodoridi, erem46, erem82, demidov, kudryavtsev, borkhov, kornilova, karlmay, zavarzin, kornilov, kollan) |
| `landmarksVOStatues` | 22 | 153,116 | 176e3 | 19 of 20 (open-book, lenin-55a, lenin-pokrovskaya, fire-memorial, spasovich, polar, zmei, pavlov, komitas, karpinsky, peter-fountain, 4 gardens y1 / y2 / gs / mb, 4 churches). `vo-musa-jalil` (-6258, 50) is 270 m outside the territory: not claimed |

All other placements were checked against the 63 play rectangles: every claimed node and building lies inside (script in the session, not committed).

Adaptation, exactly as the Admiralty ports (docs/AREAS.md 15.2, 15.z):
* **Claim gating, one line each**: the module builds the parts whose sub-group THE AREA claims (`ctx.L.GROUPS.<module>`, fallback `GROUPS_LIST`, as `landmarksAcademy.js`); `landmarksVOStatues` builds its `claims` Map from `ctx.L.GROUPS.landmarksVOStatues`.
* `area.js` (`PORT-*` slots of the four modules), `rings.js` (Andrew and Sredny `PAVED_RINGS`: 6 + 1 rings; the four modules have no water rings and no keep-outs), `tools/check.mjs` (4 BUDGET rows, measured + 15 %), `src/world/lib/owns-table.js` regenerated (`node tools/owns-table.mjs`: +4 entries; it WILL conflict between the parallel branches, the integrator regenerates).
* `GROUPS.landmarksVOStatues` is the list filtered without `vo-musa-jalil`; `PRUNE_SERVICES` has Andrew and Sredny (they publish `entrances`).
* `svc.metro` of Andrew (`{ podium, ceil, signs }`, a contract with the source's `metro/st-vo.js`) is harmless here: nothing reads `services.landmarksAndrew.metro` (environment.js reads `services.metro`, which this area does not have).
* Dependencies: `lib/figures.js`, `lib/massing.js`, `lib/tree-bounds.js` resolve and behave (identical). `landmarksModernVO` imports `core/spatial.js` / `core/batch2.js` only in its debug probe (`probe.js`, behind `MVO_KINDS`), both export what it asks (`uvInUnit`, `atlasableTex`, `sizeClass`); `import-lint` is OK. No shared engine file was edited. `landmarksModernVO/wall.js` carries the source's `fenceLine` (plain `fence = true` boxes) but nothing calls it (no fence in that module): left verbatim.

## World rules (knock system), what changed in the modules

Knock records (`lib/knock-furniture.js` / `lib/fence-bays.js`):
* **Lamps** (record `lamp`): Andrew boulevard 39 (cast-iron crook lamps), cathedral precinct 4, Annunciation garden 4; Sredny tram-depot park 4. **Bollards** (kind `bollard`): the 4 granite stumps round the order obelisk (the chains between them stay drawn). **Stone** blocks (kind `stone`, 1.2 t, anchored 30 km/h): the 4 granite bench blocks at the two boulevard fountains. **Benches** (record `bench`): the 2 park benches of the Brush plot (they had no collider before). **Mast** (kind `mast`): the Sredny clock mast (9 m lattice).
* **Fences, railings, low rails** (`knockBays`, one thin collider flagged `fence` + one anchored record per bay, passable after a knock): Andrew cathedral precinct fence and Annunciation fence (`fence.js fenceRuns`: granite plinth + iron panel as ONE bay, 203 bays; the 226 stuccoed piers stay drawn, their colliders are gone and the bay collider reaches 0.4 m over them), the boulevard's low rails along the outer kerb lines (254 bays of 2.4 m with their round posts as bay parts), the Korchmin horse-tram platform railing (16 bays); Sredny iron fences (`wall.js fenceLine({ bays })` + `panelBays()`: Dom Evangelia, Geological Committee, Brush plot street fence and the two return fences: 91 bays); the two fountain rims.
* **Fountain basins are water** (CLAUDE.md "water is reachable"): the two Andreevsky boulevard fountains lost the solid r 3.1 disc: the granite rim (octagon, apothem 2.35 to 2.8, 0.65 m) is 8 breakable GHOST bays each (the drawn rim stays), the basin is `physics.addWater` (level 0.55, floor 0.3), the two-bowl stem (r 1.05, 3.0 m) stays a solid monument. The Peter I fountain (VOStatues `fountain.js`): its six solid basin blocks are gone, the shallow basin (annulus sector, level 0.22) is `physics.addWater` registered in `build()` with the piece's world pose; the deck and the wedge stay solid.

Solid on purpose (STRUCTURES, none near water except where noted; no `ALLOW` row was needed):
* walls of buildings (every `addPolyColliders`, `D.wall`, `F.wall`, `h.colliders` shell: cathedral, Three Hierarchs, market ring and its three passage walls, metro pavilion, Pel house, Annunciation church, chapel, the three depot sheds and admin blocks, Geological Committee, Dom Evangelia, Frank mansion, Chernikhov tower, the Gorny Institut pavilions, all twelve ModernVO houses with their tower piers, the four churches of VOStatues), the 8 gate pavilions of the Annunciation fence;
* masonry walls away from water: the brown stucco wall of the Three Hierarchs yard (2.5 m, 43 m), the plaster plot / yard walls of the tram depot (`wallRun`, 6 runs), the walled gap with the iron gate between 79A and 79B;
* columns of the Geological Committee portico, the metro pavilion stair slabs (walk boxes);
* monuments, busts, pedestals, sculptures and their plinths: the chapel of St Vladimir, the order obelisk, the Golovin bust, the Korchmin monument (and the horse-tram car, horses, coachman), the Brush monument car and the five museum cars on the apron, the Leonov bust, the memorial boulder, all 63 solids (48 boxes, 15 cylinders) of the VOStatues pieces except the removed basin blocks;
* the 5 playground towers of the Blagoveshchensky garden (play equipment 1.4 x 1.4, 2.8 m: not converted, drawn in the static mesh);
* tree trunks of the module's own trees (146 cylinders of the larches and limes: vegetation, as everywhere).

Not converted, no collider (nothing to break): the poster boards and urns of the Brush plot, the bench of the museum entrance (depot.js), the lamp standards of the Geological Committee stair, the wall lamps of the depot (all drawn in the static mesh and not registered with physics).

## Water

No water ring was added (none of the four groups has `WATER_RINGS` / `KEEP_OUT`). The island interior is not on a river; the only water objects are the three fountain basins above (physics water, reachable). `tools/water-reachable-test.mjs --quick` check 6 (every thin tall collider within 12 m of water is a knock record) passes without an ALLOW row.

## Verification (CPU, only the requested set)

* `node tools/area.mjs vasilyevsky tools/check.mjs --area-modules`: OK, no module errors (all 15 modules).
* `landmarks-groups-check`: OK (every claimed id is in the data, 100 % of the vertices in the play rectangles; nodes have no polygon to grade).
* `claims-draw-audit`: OK, 4 warnings: the Academy sphinx-pier steps way (the foundation's, as in Admiralty) and three footways of `andrew-boulevard` (w481467807, w1318348711, w481467853: owned, drawn nothing inside; Andrew has no such waiver in the source either). No waiver was added.
* `layout-test`: OK. `owns-table --check`: OK. `runtime-only-lint`, `import-lint`: OK.
* `water-reachable-test --quick`: 16 of 17; the one failure is check 9 (undrawn drivable bridges Uralsky, Nalichny, Smolensky, ...), the foundation's known open item (the bridge wave), not these modules.
* A scratch audit (not committed) wrapped `Physics.addBox / addCylinder / addWalkBox` and grouped every collider of the four modules by call site: after the port the only non-knock thin ones are the 6 plaster depot walls (structure). Knock counts: fence +580 records (203 + 254 + 16 + 16 + 91), lamp +51, stone +4, bollard +4, bench +2, mast +1.
