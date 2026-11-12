# Автово mapped data

This area follows planning-map district 70 (OpenStreetMap relation
[`1184646`](https://www.openstreetmap.org/relation/1184646)). The 93-rectangle
play territory is generated from the map's 80 m B600 raster by
`tools/marine-data-territory.mjs`; `tools/register-avtovo-area.mjs` copies it
into `territory.json` and the area registry. Its current area is 23.2000 km².
The western T01 raster cell is omitted because it isolated 2,832 m² of
Ekateringofka water from the playable river. The remaining land corridor
stays connected to the rest of Avtovo.

The whole-city source at `D:/git2/agi-fun-tests/102_3d_piter` has no
coverage inside this territory. `tools/marine-data.mjs --area avtovo` uses the
current OpenStreetMap geometry for roads, buildings, entrances, water,
railway, landcover, trees and bridge ways. The Overpass snapshot is
**2026-11-12T16:50:23Z** from `https://overpass-api.de/api/interpreter`:

| Query | Scene bounds (x east, z south) | Elements |
| --- | --- | ---: |
| Mapped geometry | x -11320..-2520, z 3880..9480 | 56,551 |
| Supplemental water ring | x -11920..-1920, z 3280..10080 | 495 |

Raw responses and query metadata stay in the OS temp directory
`n4spb-coastal-osm/avtovo` and are not deployed. The committed
`data/city-t*.js` facade is clipped to the 120 m scenery margin, with water
extended another 600 m for continuous shores. Run the generator again to
refresh the OSM snapshot. The output is not a survey: much building height,
roof material and facade detail is inferred by the project's ordinary city
grammar when OSM gives no such tags.

The relation `r1530921` [Дудергофский канал](https://www.openstreetmap.org/relation/1530921)
is mapped as `natural=water` without a `water=*` subtype. The source
converter's default pond classification is corrected to `canal` before
promoting its complete mapped polygon into `RIVER`. The isolated long basin
[`w173060664`](https://www.openstreetmap.org/way/173060664) is explicitly
tagged `water=pond`, so it remains an independent pond with its own water
level and short open slopes at narrow sections. No invented canal links or
boxed water exclusions are used.

The area boat is placed in the mapped Bolshaya Turukhtannaya Harbour
(`r14997949`) at (-6772, 7492), beside a playable shore. The full hull and
boarding pass the headless boat test. Krasnenkaya is a real narrow channel:
the boat-passage audit uses its existing 0.35 m narrow-canal clearance mode
and still drives actual handling through every mapped water crossing.

Area-local authoring claims exactly four mapped building footprints:
Avtovo metro `r6440025`, Kirovsky Zavod metro `w47636754`, Kirov Factory
gate `w128500581`, and DOT No. 930 `w119225860`. The same modules add
OSM-anchored memorial objects. Sources for their appearance and placement
are documented in `docs/research/avtovo-metro.md` and
`docs/research/avtovo-sites.md`.
