# Area data: how the data facade of an area is cut

Part of the areas system ([AREAS.md](AREAS.md)). The strip's data (`src/world/data/city.js` + 9 part files) was cut from the full city (`102_3d_piter`) by hand ([STRIP.md](STRIP.md) section 3,
`tools/strip-data-extend.mjs` for the Summer Garden, section 10). Every other area is cut in one go, from the rectangles of its registry row, by `tools/area-data-cut.mjs`. The first one is the **North**
(`src/areas/north/data/`, the page `north.html` remaps `./src/world/data/city.js` to it, see AREAS.md section 2).

## 1. Files

```
src/areas/<id>/data/city.js        the facade: the same 52 exports as src/world/data/city.js
src/areas/<id>/data/city-<rect>.js one part file per play rectangle (north: city-na.js, city-nb.js, city-nc.js), the format of the strip's part files
src/areas/<id>/known-data.js       the research dossiers of the houses of the facade (section 6)
tools/area-data-cut.mjs            the cut (selection + clip + facade)
tools/strip-data-clip.mjs          the clip (also a library: clipParts / facadeTextOf); --check = idempotence
tools/strip-data-known.mjs         known-data.js cut to the buildings of a facade
tools/area-data-test.mjs           CPU test of a generated facade (section 5)
```

Part file: line 1 is a comment, then one `export const NAME = JSON.parse("<escaped json>");` per array, the arrays of the strip's part files in the same order, `TREES` flat (`x,z,x,z,...`).
The first part also holds the five arrays the source does not split (`SUBWAY_ROUTES, TROLLEY, TRAM_ROUTES, BUS_ROUTES, RIVER`; the facade re-exports them with `export { ... } from './city-na.js'`).
Facade exports (52): `ORIGIN, PLAY, EXTENT, PLAY_RECTS, EXTENT_RECTS, RECT_NAMES, REGIONS` + the five unsplit arrays + 40 concatenated arrays (`P0.X.concat(P1.X, P2.X)`, in `RECT_NAMES` order).

## 2. Regenerate

```
node tools/area-data-cut.mjs --area north --orig D:/git2/agi-fun-tests/102_3d_piter/src/world/data --out src/areas/north/data [--dry] [--water-ring 600] [--margin 120]
node tools/strip-data-clip.mjs --in src/areas/north/data --check        # idempotence (exit 1 = a file would change); also run by the test
node tools/strip-data-known.mjs --src D:/git2/agi-fun-tests/102_3d_piter/src/world/city/known-data.js --facade src/areas/north/data/city.js --out src/areas/north/known-data.js [--check]
node tools/area-data-test.mjs [--area north]
```

* `--area` is a key of `REGISTRY` (`src/areas/registry.js`); the rectangles are `REGISTRY[area].play` (names and numbers), nothing else is typed. The extent rectangles are the play rectangles
  grown by `--margin` (120 m). The tool is area-agnostic: another area is one registry row away.
* `--dry` writes **nothing**: the whole cut runs in memory (the clip is a library, not a second process writing a scratch folder) and prints the counts.
* The cut needs the full-city data on disk (`--orig`, the `src/world/data` of 102_3d_piter, ~1 s to load). The commit of that repository (`git -C <orig> rev-parse HEAD`, with a note when the data
  directory has uncommitted changes) and the command line are written into line 2 of the facade header. `area-data-test` regenerates the facade in memory and compares it byte for byte with the
  files on disk (it is skipped, with a message, when the source repository is not on disk or has moved on to another commit).
* Output is deterministic (source order, 0.1 m rounding of clip points): the same source commit gives the same bytes.

## 3. The selection rule

A record belongs to the **first extent rectangle, in `RECT_NAMES` order, that contains its representative point** (the rule documented at the top of the strip's `city.js` and used by
`tools/bake-osm.mjs regionIdx`): buildings the centroid `cx, cz`, point records `x, z`, lines / polygons / tree rows the first vertex (the first vertex of `pts`, else of `polys[0].o`),
`TREES` pair by pair. The part file of the record is the part of that rectangle; the order inside a part is the source order.

* **BUILDINGS are never cut.** A building is taken when its centroid lies in the union of the extent rectangles; the `OVERLAPS` between two taken buildings come with them (in the part of
  building `a`). Consequence: building families can be split at the edge (an outline whose centroid is outside, a part that is inside): 4 parts have no parent outline and 4 outlines declare more
  parts than the facade holds (the strip has 3 and 7 for the same reason at its edge).
* **Lines and polygons are cut to the union of the extent rectangles** (`osm-lib.mjs` `clipLineUnion` / `clipRingUnion`, 0.1 m rounding) by `strip-data-clip.mjs`: a line becomes one record per
  piece (same id), a polygon keeps its fields and gets clipped rings, a record with nothing left is dropped, a record entirely inside stays byte-identical.
* **Records that start outside every extent rectangle but cross one are kept** (what `strip-data-clip --recover` did for the strip): the source stores a way in the region of its first vertex, so
  a road that begins 3 km away and runs through the North is in the source arrays but would not pass a first-vertex test. Such a record belongs to the first rectangle its bounding box touches.
  The cut prints how many there are per array (ROADS 139, WATER 20, LANDUSE 16, GREEN 13, BARRIERS 12, SUBWAY 7, BRIDGES 5, STREAMS 5, ...).
* **RIVER and WATER** are selected and clipped against the extent union grown by `--water-ring` (600 m): the far Neva / canal scenery is drawn beyond the extent. Fountains are `WATER` records, so
  they follow the same ring (a fountain at z +384..+393 is in the data).
* `RIVER, SUBWAY_ROUTES, TROLLEY, TRAM_ROUTES, BUS_ROUTES` are taken whole from the source facade into the first part and then clipped: `TROLLEY` / `TRAM_ROUTES` lines are cut and their stops kept inside
  the extent, routes with nothing left are dropped, `SUBWAY_ROUTES` (10) and `BUS_ROUTES` (45) have no geometry and stay whole. `RIVER` keeps the source order.
* `TREE_ROWS` rows that touch the extent stay whole (`trees.js` rejects candidates outside the extent itself).
* **No dedupe against the strip.** The North holds the strip's own 200 m band (z -405 .. -205) again, with the same ids, and the strip's 120 m scenery margin west of x = -420: they are different
  pages, each page needs its records. The band is **identical** in both facades (section 5).
* `PLAY` / `EXTENT` are the bounding boxes of the unions (north: PLAY x -420..2650, z -2060..-205; EXTENT x -540..2770, z -2180..-85). They drive the 1 m field raster, the tree grid and the player
  bounds, so a rectangle outside the box would break silently; the generator writes them from the rectangles and never patches them.

## 4. What the North holds

Source: 102_3d_piter commit `0568f7af8c7d10f74f3c2c1864d090892d79d110`. Rectangles NA x -420..835 z -2000..-205 (2.253 km2, incl. the strip band), NB x 835..1550 z -2000..-800 (0.858), NC x 1550..2650
z -2060..-1300 (0.836); play 3.947 km2, extent rectangles 5.76 km2 (sum).

| | North | Strip (for scale) |
|---|---|---|
| buildings with the centroid in the play rectangles | **1600** (1500 outlines) | 2318 (1770 outlines) |
| buildings in the extent | **2016** (1867 outlines, 149 parts, 39 hidden outlines) | 3041 (2401 outlines) |
| roads / km of road | 6880 / 296 km | 9292 / 379 km |
| data on disk | 5.55 MB raw, **0.80 MB gzip** (city-na 4.02 MB, city-nb 0.80, city-nc 0.72, city 12 kB, known-data 18 kB) | 8.80 MB |
| `import()` of the facade in Node | ~100 ms, ~30 MB heap | |

Records per part (after the clip; source = whole city):

| array | source | NA | NB | NC | total |
|---|---:|---:|---:|---:|---:|
| BUILDINGS | 28409 | 1490 | 320 | 206 | 2016 |
| OVERLAPS | 8461 | 3 | 5 | 1 | 9 |
| ROADS | 77775 | 4783 | 1059 | 1038 | 6880 |
| POIS | 27794 | 2535 | 199 | 212 | 2946 |
| DOORS | 30453 | 2762 | 347 | 247 | 3356 |
| FURNITURE | 25096 | 1687 | 498 | 273 | 2458 |
| BARRIER_NODES / BARRIERS | 15125 / 13939 | 1183 / 626 | 220 / 158 | 184 / 166 | 1587 / 950 |
| GREEN / LANDUSE / PITCHES / PARKING | 13118 / 2043 / 1947 / 2680 | 508 / 112 / 57 / 79 | 132 / 21 / 14 / 22 | 193 / 16 / 17 / 41 | 833 / 149 / 88 / 142 |
| CROSSINGS / CROSSING_NODES / STEPS | 4064 / 5364 / 2343 | 307 / 402 / 73 | 34 / 32 / 49 | 73 / 100 / 35 | 414 / 534 / 157 |
| WALLS / EMBANKMENTS | 1719 / 1720 | 87 / 87 | 56 / 56 | 30 / 30 | 173 / 173 |
| SIGNALS / BUS_STOPS / LAMPS / CALMING | 1545 / 2252 / 3539 / 1475 | 105 / 116 / 108 / 48 | 12 / 22 / 0 / 9 | 25 / 25 / 24 / 5 | 142 / 163 / 132 / 62 |
| MANMADE / MONUMENTS | 4912 / 1817 | 109 / 124 | 22 / 20 | 15 / 20 | 146 / 164 |
| TREES (points) / TREE_ROWS | 12402 / 355 | 228 / 19 | 8 / 4 | 91 / 15 | 327 / 38 |
| WATER / STREAMS / FOUNTAINS / PIERS / PIPES | 188 / 163 / 142 / 309 / 58 | 27 / 4 / 11 / 4 / 1 | 4 / 4 / 3 / 0 / 4 | 4 / 0 / 4 / 0 / 0 | 35 / 8 / 18 / 4 / 5 |
| AREAS / BRIDGES / TUNNELS | 1118 / 1127 / 617 | 20 / 23 / 15 | 10 / 8 / 0 | 28 / 0 / 0 | 58 / 31 / 15 |
| RAIL_NODES / PLATFORMS / STATIONS / ENTRANCES / SUBWAY / TRAMWAYS | 1686 / 238 / 246 / 98 / 66 / 524 | 67 / 7 / 10 / 2 / 3 / 18 | 0 | 0 | 67 / 7 / 10 / 2 / 3 / 18 |
| RAILS | 506 | 0 | 0 | 0 | 0 (no railway in the North) |
| RIVER (7: Fontanka, Neva, Moika, Swan Canal, Voskresensky Canal, Bolshaya Nevka, Okhta) / SUBWAY_ROUTES / TROLLEY / TRAM_ROUTES / BUS_ROUTES | 43 / 10 / 28 / 9 / 45 | 7 / 10 / 22 / 1 / 45 | | | same |

`node tools/area-data-cut.mjs --area north ... --dry` prints the same numbers, with the number of records per array that were kept only because their geometry crosses in.

## 5. Checks

`node tools/area-data-test.mjs` (CPU, ~3 s, 18 checks today):

1. the facade has exactly the 52 exports of the strip facade; every array has the strip's element kind; `ORIGIN` equals the strip's;
2. `PLAY_RECTS` / `RECT_NAMES` equal the registry row, `EXTENT_RECTS` are the rectangles grown by 120 m, `PLAY` / `EXTENT` are the bounding boxes, `REGIONS` and the part files agree;
3. part files: line 1 a comment, `export const` lines only, the right set of exports (first part: 45, the others 40), the facade arrays are the concatenation of the parts;
4. every vertex of every line / polygon / point lies in the extent union (RIVER / WATER in the union grown by 600 m; buildings by centroid); building / point / tree records are in the part of the
   first rectangle that contains them, overlaps in the part of building `a`; no building id twice; every overlap names two buildings of the facade;
5. `strip-data-clip.mjs --in <dir> --check` finds nothing to change; regenerating from the source gives byte-identical files;
6. **band parity**: the part of the strip's own territory that the area contains (the strip's OLD rectangle inside NA: x -420..835, z -405..-205) is compared, record by record, between the
   North facade and the strip facade, both clipped to the band: buildings (every field and every polygon), roads, water, green and every other array. Result today: **identical in all 34
   arrays that have records in the band** (102 buildings, 460 roads, 230 POIs, 214 pieces of furniture, 93 doors, 57 green, 2 water, ...; 0 only-north, 0 only-strip, 0 differences in fields or
   geometry within 0.3 m / 0.5 m2). `BAND_BUDGET` in the test is empty: a boundary artefact would have to be listed there, with its reason;
7. sights: > 20 buildings in the Tauride Garden bbox (35), Chernyshevskaya vestibule `w22999175`, Transfiguration `r5802451`, Muruzi `r946930` exist, the Fontanka and the Neva are in `RIVER`;
8. the landmark claims of the source modules (info): `landmarksNorth, Smolny, Tauride, Suvorov, Kirochnaya, Oktyabrsky` `GROUPS_LIST` = 14 groups (`tauride-garden-bridges` and `kapodistrias` claim no ids), 64 ids, **63 present**; the one absent id is
   `w60354394` (Mayakovskogo 4, x 142, z -54, in the `north-corridor-houses` group): it lies in the strip, 31 m south of the extent edge, so `landmarksNorthFull` must tolerate it (the strip keeps
   building it);
9. `known-data.js` (section 6).

Not affected: the strip. `layout-golden --diff`, `areas-test`, `layout-test`, `owns-table --check`, the streets / city signature diffs and `npm run check` are identical to the baseline.

## 6. Known data (`src/areas/north/known-data.js`)

`city/known.js` looks a house up by `b._fillOf || b.id`, then by `b.parent`, in `KNOWN_DATA` (the generated dossiers) merged under `KNOWN_EXTRA` (hand corrections). The source table holds 1241 houses of the whole
city. `strip-data-known.mjs` cuts it to the ids that are `BUILDINGS` of a facade (or the parent outline of one): **107 rows** for the North, written with the structure of the source (the west
table line and the `Object.assign` blocks `MARS`, `SW`, `VO`... with their counts updated, empty blocks removed). By the source region that stores the building: 65 rows N2, 22 OLD, 11 N1, 9 W1
(the last three are the strip band and the houses of the 120 m margin west of x = -420: 64 of the 107 rows are houses west of that edge). 42 rows are also rows of the strip's own table, 46 are
houses the strip also has. The "111 N2/N3 rows" of the planning research are the dossiers of the buildings stored in the source's region `N2` (x -800..1100; `N3` has none): 65 of them are in
the North facade, the other 46 lie west of x = -540 (strip territory). `KNOWN_EXTRA` has no entry for a North building (its 33 corrections are strip houses).

Merging: `known.js` imports `./known-data.js`, which is a URL-like key of the import map, so the **North page needs no code change**: its remap has one more key (since M3),
`'src/world/city/known-data.js': 'src/areas/north/known-data.js'` (the file exports `KNOWN_DATA` with the same shape). The North's table replaces the strip's on that page (the strip rows for strip
houses would never be looked up there; the 46 shared rows are in both). `KNOWN_EXTRA` stays shared (corrections of band houses apply on both pages). The Node loader hooks (`tools/lib/area-hooks.mjs`)
read the same registry remap, so the headless tools see the same table.

## 7. Known seams

* **The Fontanka, west edge x = -420 (NA).** The play edge follows the east side of the river without being its bank: the Fontanka water spans x -446..-391 at z -205, -434..-379 at z -405 (the river
  crosses the edge in the strip band), -486..-429 at z -650 (west of the edge), then runs further west (-585..-521 at z -800, -717..-651 at z -1000, -844..-804 at z -1700). The data holds the river
  (`RIVER[0]` = Fontanka, `WATER r1201709`, x -1011..-366, z -1731..515) and its quays up to the 600 m water ring, so the water is continuous across the edge; the Belinsky Bridge
  (deck `r5589456`, x -480..-423, z -643..-614; the strip owns it, N1) ends 3 m west of the edge and appears in the North data as scenery. Houses west of the edge (x -540..-420) are the 120 m scenery
  margin, not walkable; 64 known-data rows belong to them. The Anichkov Bridge (z -120..-85) is in the margin south of the band.
* **The Neva, north edge z = -2000 (NA, NB) and z = -2060 (NC).** The Neva's south bank in the data is at z -1904 (x -300), -1986 (x 0), -1958 (x 400), -1978 (x 835), -2029 (x 1000), -2347 (x 1550),
  -2672 (x 2000), -2488 (x 2400): the play edge is inside the water for x -420..835 (by 14 m at x 0, 42 m at x 400, up to 96 m at x -300) and 29 m short of the quay at x 1000; the water is
  the natural limit. `RIVER neva` / `WATER r2599821` reach z -2780 and x 3092 (the water ring), the Okhta and the Bolshaya Nevka are in `RIVER`. The Liteyny Bridge deck (x -142..-87) is cut
  at z -2120 (NA extent edge) in the middle of the river; 17 roads cross z = -2000. The facade holds no land record north of z -2120 (NA, NB) / -2180 (NC); only `RIVER` / `WATER` go on to the ring.
* **The Neva east leg, east edge x = 2650 (NC).** The river's west bank is at x 2620 (z -1000), 2642 (z -1300), 2675 (z -1500), 2742 (z -1800), 2735 (z -2000): NC's east edge is 8 m inside the water
  at z -1300 and on land (25 .. 90 m from the bank) further north; the extent (x 2770) cuts the river polygon (its data reaches x 3092 through the water ring); the Bolsheokhtinsky Bridge
  (x 2622..2961, z about -1150) is not in the facade.
* **South edge z = -205 (the strip band).** NA's south play edge is inside the strip's territory: the data below it (z -205 .. -85, the 120 m margin) is the strip's own data again, identical; 48 roads
  cross z = -205. Streets crossing the band and the strip: Liteyny, Zhukovskogo, Chekhova, Mayakovskogo, Vosstaniya, Radishcheva, Ligovsky.
* **Building families** cut by the centroid rule (4 + 4, section 3), and `TREES` are sparse (327 OSM tree nodes; the parks are drawn from `GREEN` polygons and `TREE_ROWS`).
* **No railway:** `RAILS` is empty; `STATIONS` holds 10 stations (Chernyshevskaya among them), `SUBWAY` 3 ways, `SUBWAY_ROUTES` is whole (10 routes, stops also outside the extent).

## 8. For another area

Add a registry row (`play` rectangles with names), run the cut with `--area <id> --out src/areas/<id>/data`, `node tools/area-data-test.mjs --area <id>`; the band-parity check compares the first
rectangle with the strip's OLD rectangle, so it only applies to an area that overlaps the strip (otherwise the band is empty and the check is vacuous). Keep the commit of the source in the header: the
copies of the source's landmark modules (`landmarksNorthFull`, ...) are pinned to the same commit.

## 9. Dekabristov Island: data from a merged source (the one exception)

`src/areas/dekabristov/data` is cut from a MERGED directory: the source bake 0568f7af plus a scratch bake with five regions DK1 .. DK5 fetched from OpenStreetMap on 2026-10-29 (the source never baked the island's west two thirds). The
header of `city.js` says "git commit unknown" and `area-data-test` skips the regeneration check for this area. Recipe, region list and fetch log: [research/dekabristov-data.md](research/dekabristov-data.md). Never re-cut the other areas
from the merged directory (15 of its old part files differ from the source).
