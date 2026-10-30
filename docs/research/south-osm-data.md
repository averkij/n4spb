# Southern areas: supplementary OSM data

The source bake from `102_3d_piter` at `022e72ca8b3a2d0bf716367e7399187cacca019e`
does not cover the southern and western edges of the planned Kolomna–Yekateringofsky
and Semyonovsky–Izmaylovsky territories. Their draft cuts can use a **separate**
merged bake: the source raw data plus a map API supplement fetched on 2026-10-30.
Do not use this merged source to regenerate the already reviewed areas.

Run `node tools/prepare-south-osm.mjs D:/git2/n4spb-work/south-data` from this
repository. It copies the source tools and raw layers, appends the four regions
in the script, fetches and merges their data into the scratch copy, and runs
the bake with the original city data as its region lock. The resulting source
for area cuts is `D:/git2/n4spb-work/south-data/out`. The map API tile cache is
resumable. Start with a fresh scratch directory when changing the source snapshot
or the region definitions; the fetch preserves existing raw records.

The 80 m map cells and 120 m scenery margin for both draft footprints were
checked against the old and supplementary extents at 40 m intervals. This is a
coverage check, not a guarantee of complete OSM mapping or playable transitions.
The 38 map tiles succeeded with no refused tiles; 31 additional multipolygon
relations were fetched. The fetch added 3,042 building, 5,787 road, 35 water,
1,075 green, 296 tree, 3,414 street, 1,556 POI, 45 historic, 148 parking,
2,569 barrier, 293 man-made, 1,049 rail, 293 bridge and 255 transit raw elements.
The existing `routes` and `subwayroutes` layers are not extended by the map API
tool. Geographic data © OpenStreetMap contributors, ODbL.

The locked bake succeeded and found 276,215 records from the prior bake. Its
four new parts contain 3,057 buildings and 5,483 roads (SW1: 1,320 / 2,620;
SW2: 553 / 963; SW3: 442 / 531; SW4: 742 / 1,369). Some long records can be
clipped differently when the overall union expands, so the merged output is for
the two southern cuts only. Importing the resulting facade yields 31,466 building,
83,241 road, 202 water and 853 rail records in total.

The scratch cache and merged raw layers are not checked into this repository;
the generated area cuts are the reference snapshot. A later fetch can reflect
changes in OpenStreetMap. A cut from a scratch directory reports its source git
commit as `unknown`: the source revision and fetch date above provide provenance.

The map API's parent relations can have incomplete riverbank geometry. The
inherited fetcher skips river multipolygons, so the preparation script also runs
`tools/south-water-relations.py` to fetch complete relations r142563 (the
Екатерингофка basin) and r11787679 / r3891234 (Волковка) before the bake. The
full relation responses are cached separately and replace only those three
relations in the scratch water layer; the whole-city source is untouched.
