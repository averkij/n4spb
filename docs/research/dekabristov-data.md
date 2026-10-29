# Dekabristov Island: where the data of the area comes from (2026-10-29)

`src/areas/dekabristov/data` is NOT a cut of the source project's baked data (`102_3d_piter`, `src/world/data`, port pin 0568f7af, HEAD 022e72ca) alone. The source never baked the west two thirds of the island:
3.12 km2 of its land (x -9000 .. -5700, z -3520 .. -2240, the land fill and the north shore) lie outside every region of its bake, and its raw OSM layers hold almost nothing there. The data of this area is therefore

    the source bake 0568f7af  +  a scratch bake with five regions DK1 .. DK5 whose OSM data was fetched on 2026-10-29

The header of `data/city.js` therefore says "git commit unknown" (the cut's `--orig` is a scratch directory, not a git checkout), and `tools/area-data-test.mjs` skips its regeneration check for this area. The five live
areas and gavan / morskoy are cut from the untouched source directory, so their data does not move; the merged directory is used ONLY for `dekabristov`.

## Recipe (nothing is written into the source repository; scratch root S = `D:/git2/n4spb-work/gdm/dek-data`)

1. Scratch root with `tools/{bake-osm,osm-lib,late-roads-ids}.mjs`, `tools/fetch-osm-map.py`, `tools/fetch-osm.mjs` copied from the source and a COPY of the source's `data/osm-raw` (14 raw layers; NOT a junction: the fetch merges into those files).
2. `osm-lib.mjs`: five regions appended LAST in `RECTS` (the fetch tool adds no element that lies wholly inside the extent of an earlier region, so new rectangles must come last). Play rectangle (extent = +120 m):
```
  ['DK1', { x0: -9440, x1: -8640, z0: -3520, z1: -2720 }],
  ['DK2', { x0: -8640, x1: -7680, z0: -3600, z1: -2320 }],
  ['DK3', { x0: -7680, x1: -6720, z0: -3760, z1: -2320 }],
  ['DK4', { x0: -6720, x1: -5760, z0: -3200, z1: -2000 }],
  ['DK5', { x0: -5760, x1: -5280, z0: -2880, z1: -2000 }],
```
   Their union covers every land cell of the map (k=51) that no source region covers (482 cells = 3.08 km2); all land of the neighbours k=47 Morskoy and k=49 Gavan is already inside the source regions.
3. `python tools/fetch-osm-map.py DK1 DK2 DK3 DK4 DK5` (the OSM map API, `api.openstreetmap.org`, read-only; Overpass was not needed): 20 tiles, 0 refused, 0 failed, plus 27 multipolygon relations completed through
   `/relation/<id>/full`. Added to the raw layers: buildings +278, roads +1,382, green +234, trees +21, street +591, pois +332, parking +117, barriers +209, manmade +38, bridges +53, transit +22
   (water, historic, rail +0). Not added by the earlier-region guard: 41 buildings, 39 roads, 5 green, 81 street, 40 pois, 20 barriers, 25 manmade, 3 parking. The map API gives no `natural=coastline` (the Gulf is the engine's
   `environment/vo-sea.js` ring) and no tram / bus route relations (`routes`, `subwayroutes` stay the source's).
4. `node --max-old-space-size=12000 tools/bake-osm.mjs --out S/out --lock <source>/src/world/data` (about 1 minute): the region lock keeps every record of the source bake in its old part file. Output `S/out`: 89 files
   (city.js, the 76 old parts, `city-dk1..dk5.js` and the 7 non-OSM files copied unchanged).
   New parts (buildings / roads / pois / trees): DK1 0/0/0/0, DK2 68/243/24/32, DK3 269/1272/89/2, DK4 205/841/114/68, DK5 47/68/19/1.
5. `node tools/area-data-cut.mjs --area dekabristov --orig S/out --out src/areas/dekabristov/data` and
   `node tools/strip-data-known.mjs --src <source>/src/world/city/known-data.js --facade src/areas/dekabristov/data/city.js --out src/areas/dekabristov/known-data.js` (43 of 1244 entries kept: the new houses have no dossiers).

Result of the cut (51 rectangles D01 .. D51, B600 territory): 2,176 buildings, 5.6 MB in 52 files.

## Files in S (kept outside the repository)

`S/fetch.log` (the fetch), `S/bake.log` (the bake), `S/tools/osm-lib.mjs` (the region list above, the only change against the source), `S/OSM-LAND-REPORT.md` (what real OSM there is on the island: ids, positions and sizes of the named
things, thin cells), `S/data/osm-raw` (the merged raw layers + the map-API tile cache, 54 MB). To redo the data from scratch repeat steps 1 .. 5; the fetch is the only step that depends on the live OSM database (a re-fetch
later gives newer data; keep the committed `src/areas/dekabristov/data` as the reference).

## Known thin places

The fill (x -9400 .. -7200, z -3500 .. -2800) has no building at all in OSM (a construction site, `w1053534560` "Новый намыв острова Декабристов", 2553 x 1343 m); the planned `landmarksFill` dressing module is what keeps
that part from reading as wasteland. The 15 old part files of the merged directory differ from the source in long records that the old union boundary had cut (the documented "modified records" effect): harmless for this
area, the reason the live areas are never re-cut from the merged directory.
