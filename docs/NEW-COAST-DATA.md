# New coastal areas: mapped data and provenance

The planning map identifies **Морские ворота** as area **71**, municipal OSM
[relation 1185365](https://www.openstreetmap.org/relation/1185365), and
**Округ № 65** as area **100**,
[relation 1198680](https://www.openstreetmap.org/relation/1198680).
Their implemented territories rasterize `fp` plus `wz` from the committed
`maps/intro-draft.html` using the existing B600 policy: 80 m cells, four of nine
samples, water cells within 600 m of land. Water remains reachable terrain.

| Area | Rectangles | Play area | Local-coordinate bounds |
| --- | ---: | ---: | --- |
| Морские ворота | M01–M56 | 16.0128 km² | x −10800…−4560, z 800…5840 |
| Округ № 65 | O01–O56 | 18.0800 km² | x −10160…−4800, z −9200…−4080 |

`tools/marine-data-territory.mjs` is the shared, deterministic territory source
for the data generator and configuration tool. It canonically unions 80 m cells
before merging rectangles, so overlapping transition bands create no internal
walls. The final marine territory adds three approach bands to connect actual
walking, driving and boat routes to Gavan, Vasilyevsky and Kolomna. Okrug 65
removes an accidental 80 × 160 m water-only overlap with Dekabristov. Registry
gates and the existing seam contracts were checked on these final territories;
the contract limits were retained.

The combined 8.0.0 release includes the three completed Petrograd areas from
`70b1d80`. Okrug 65 overlaps the islands territory by 2.0032 km² and now has a
paired seam with it: 4.8 km of working boundary from islands and 7.24 km from
Okrug, with 2.9% / 1.7% short return distances. All existing Petrograd gates
remain. The planning map shows 15 live areas at stable indices.

Final water connectivity adds two 80 m marine cells, eleven northern Okrug 65
cells along the real Kamenka and ten cells around Krestovsky's western shore.
The latter corridor clears the existing Dekabristov territory. It joins the
small southern Gulf tip to the main bay. Sixteen enclosed raster cells are
filled by an outside flood fill so the new wet corridors cannot leave internal
territory walls on adjoining land. All exterior coastal notches remain.

## Source coverage checked

The correct full-city source is `D:/git2/agi-fun-tests/102_3d_piter`, inspected
at commit `022e72ca8b3a2d0bf716367e7399187cacca019e`. Its facade extent is
x −9920…3220, z −5860…9420. In the proposed play rectangles it contains only
**two building outlines** for Морские ворота and **116 building records (103
outlines)** for Округ № 65. The latter are concentrated along the southern
fringe: the Datsan, Piterland and nearby Primorsky Avenue buildings. The draft
map's source-coverage fields were respectively 0% and 3% (0.39 km²).
Copying those extracts would leave nearly all of both new scenes empty.

Both areas therefore use fresh OpenStreetMap geometry. The main Overpass
responses have database timestamp **2026-10-31T09:14:05Z**: 12,167 mapped elements
for Морские ворота and 31,794 for Округ № 65. The latter also has a supplemental
water-ring response at **2026-10-31T09:15:11Z**. Supplemental marine water-ring
requests failed on three mirrors (HTTP 429, timeout, HTTP 504); the marine bake
uses the complete geometry of the already fetched bay and river relations.
This includes their current coastline beyond the local extent. No older
`vo-sea.js` approximation was substituted.

The final marine transition band reaches north of the initial query. A fresh
146-element supplement at **2026-10-31T09:48:50Z** covers local x
−8200…−6200, z 680…1080, including its 120 m scenery margin. The raw query
sidecars retain the actual fetch bounds rather than relabeling the earlier
snapshot as a larger request.

## Authoring and regeneration

`tools/marine-data.mjs` fetches current tagged nodes, ways and relations from
Overpass, preserving member geometry and mapped building heights/levels,
roof tags, road widths, bridge/tunnel flags, layers, railways, trees, barriers,
street furniture and POIs. Raw responses and intermediate files are stored
under `%TEMP%/n4spb-coastal-osm/<area>/`, outside the repository. Data attribution
is OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

The tool reuses `tools/bake-osm.mjs` in a temporary authoring process with local
data and area extents. It retains the existing 52-export data facade and part
schema, so the scene uses the existing offline bake and worker decode path.
Runtime does not contact OSM. Whole building footprints belong by their original
centroid; line/polygon records are clipped to the scenery extent, water to a
further 600 m ring. Part assignment is deterministic and follows the area's
first extent rectangle. Natural water, bay and coastline records never enter
the landuse/green surface arrays.

The legacy converter could leave a long unnamed river polygon only in `WATER`,
outside the engine's `RIVER` water mask, when its centroid lay more than 25 m
from a named centreline. The new-area pipeline preserves every mapped river or
canal polygon in the actual mask, matching a name by centreline length within
the polygon. This restores the real Ekateringofka, Tarakanovka, Olhovka,
Pryazhka and missing Neva branches. Explicit OSM `water=pond` relations retain
their pond classification and use the existing shallow pond profile (`moat`),
including the enclosed Elagin pond system. Their water remains reachable by
the real walking, car and boat physics.

```powershell
node tools/marine-data.mjs --area morskie-vorota --reuse-mapped-water
node tools/marine-data.mjs --area okrug65
```

Use `--refresh` to request a new snapshot; without it the cached raw responses
are reused. Omit `--reuse-mapped-water` when a supplemental marine water query
can be fetched. Fresh-network regeneration may change geometry because OSM is
editable. Python with Shapely is an offline authoring dependency for bay clipping.

The accurate open-water geometry comes from OSM
[Невская губа r1114253](https://www.openstreetmap.org/relation/1114253),
[Новая Канонерская гавань r7699801](https://www.openstreetmap.org/relation/7699801)
and [Лахтинская гавань r2713652](https://www.openstreetmap.org/relation/2713652).
Their shoreline and island holes are clipped using polygon boolean operations.
Any interior island hole is split through an interior point into hole-free water
pieces because the engine's river bank index consumes outer rings. Shared cuts
are coincident open-water seams. They are emitted into `RIVER` with `key: 'neva'`.
This preserves the actual Kanonersky/port and Primorsky coast instead of drawing
a sea triangle across islands or restricting boat movement to a rectangle.
The same exact subtraction applies to river and lake holes, retaining the
22,600 m² island in Ekateringofka, the southern harbour island and Lakhta islets
as dry terrain. The geography test probes six mapped island points and requires
all emitted river polygons to be hole-free for the real bank index.

## Final extract counts

| Records | Морские ворота | Округ № 65 |
| --- | ---: | ---: |
| Buildings, including parts | 1,009 | 2,641 |
| Building outlines | 940 | 1,989 |
| Roads and mapped paths | 1,745 | 8,528 |
| Water polygons | 66 | 58 |
| River/canal/waterway records | 21 | 27 |
| Green areas | 183 | 1,963 |
| Individual mapped trees | 166 | 571 |
| Bridge records | 77 | 137 |
| Barrier lines / nodes | 427 / 253 | 1,206 / 1,182 |
| Piers | 19 | 42 |
| Railway ways | 157 | 12 |
| POIs | 137 | 2,453 |

Route-network tables are deliberately empty in these new area extracts; mapped
roads, bus stops, rail and tram infrastructure are present. They do not include a
new metro simulation. Missing mapped building heights remain null and use the
scene's existing building-kind estimates. These are OSM coverage limitations,
not measured dimensions invented for the extract.

## Landmark identities and verified water positions

Piterland's full outline is `w55498111`; its four mapped parts are
`w317789257` (large dome, centre −7870.5, −5389.2; mapped height 51 m),
`w317789256` (small dome), `w1041714585` (low front band), and `w1041714586`
(main podium). The Park 300th Anniversary column base is `w163902553`, centre
−8415.3, −5470.7. These full current footprints replace the old source's clipped
Piterland outline.

The Kanonersky floating docks are `w537286433` (Док № 3), `w537286434`
(Док № 4), and `w537286435` (Док № 5). Their projected centres are respectively
−7408.33, 2822.33; −7346.32, 2809.40; and −7058.89, 2420.83. Mapped yard crane
nodes include `n6991139132`, `n6991139133`, and `n6991139134`; portal-crane rail
strips include `w747160227`, `w747160228`, and `w747160229`.

The operable container ship's final centre is **−8100, 3350**, with its entire
400 × 62 m hull wet and in territory and **zero collider contacts**. An earlier
candidate at −7731.696, 3166.416 passed all 51 water-only probes but was rejected
by the real collision check: the hull intersected 55 WHSD colliders. The still
earlier point 30.224° E, 59.900° N is dry cargo quay. Motorboat positions −7610,
2980 and −7700, 3110 each pass 9/9 wet/in-play probes over a 4 × 14 m footprint.
The integration tests also verify boarding, controls, moving-hull clearance and
returning to walking beside the ship.

## Data checks

Both extracts pass the existing facade shape, registry/extent, part formatting,
concatenation, geometry containment, first-rectangle ownership, building-ID and
overlap-reference checks, and `strip-data-clip --check` is a fixpoint. The legacy
`area-data-test` still assumes North-area sights and complete centre transit
routes for unrecognized area IDs; those assumptions do not describe these
new coastal extracts. Area-specific runtime, road, water, bridge and performance
results are recorded by the integration checkpoint.

The final full boat passage audits pass **95 marine checks and 58 Okrug 65
checks**, including all five named boat routes and zero invisible water walls.
The strict transition suite passes **95/95** checks. The two Park 300th
Anniversary shore boardwalk axes are mapped dry land strips (0/106 and 0/42 wet
samples), reported as shore boardwalks rather than imaginary water crossings.

The dense Okrug 65 road surface audit records 140 residual samples out of
520,977 (0.0269%), with no bespoke bridge or landmark surface offenders. Its
explicit `roads.mjs` budget is 140; other areas retain 120. This is below the
surface audit's 0.3% acceptance rule and below the original strip's measured
91/221,118 residue rate (0.0412%). Furniture has zero unallowed carriageway
incursions and the ribbon audit passes. Residue comes from generic service-road
edges, tram bedding and narrow median paving; no geometry/material exemptions
were added for it.

`tools/marine-data-bridges-test.mjs` independently probes every original mapped
bridge centreline at intervals of at most 2 m, including its endpoints, and
checks 69 shared joints across 1,943 densified coastal deck segments. OSM layer changes
do not create elevation steps. Connected road and footbridge approaches retain
continuous grades. The marine WHSD matches the existing Gavan profile through
z 2600, then rises to a lower girder soffit 52 m above the sea, following the
[official Sea Canal clearance](https://www.gov.spb.ru/press/governor/96074/).
Its opposing carriageway is 8 m higher, an authoring estimate. Both Okrug 65
and islands use the same authored Yacht Bridge, with V-shaped piers, asphalt,
coloured cycle track and a 16.4 m deck within the official 16.3–17.1 m range.
Its shared profile was corrected from the source's old photographic estimate:
14.1 m peak deck minus the 1.5 m midspan girder over water at −3.4 m gives
the 16 m navigation clearance stated by
[Mostotrest](https://mostotrest-spb.ru/bridges/yahtennyj-most-416). Real drawn
soffit probes confirm 16.00 m; maximum ramp grade is 7.06%. The two pages'
57-pose driving checks match the same deck within 2 cm, including under WHSD.

The optional `--engine` test builds the real marine modules and real
`createHandling`. At the mapped double-deck crossing it checks the lower deck,
upper deck and seabed separately, including three seconds of idle simulation
on each floor. Piers avoid the footprints of actual ground roads and buildings;
low approach railings leave ground carriageways open. Bridge rails use
individually breakable panels no longer than 6.4 m, with matching visual and
collision dimensions and a finite 260 m dynamic distance.

The benchmark starts follow actual mapped roads. A CPU run of the real car at
full throttle for 20 s travels 788.3 m from each, with zero collisions or falls;
all sampled centre positions remain inside a mapped carriageway. Marine uses
Dvinskaya Street (minimum mapped edge clearance 0.50 m), Okrug 65 uses Savushkina
Street (minimum 3.14 m). Normal rendered benchmarks still run separately on the
final shipping bake:

```powershell
node tools/drive-bench.mjs --area morskie-vorota --q medium --seconds 20 --start "-6037.87275,2589.45754,-91.1664" --json --diagnostics --out shots/perf/marine
node tools/drive-bench.mjs --area okrug65 --q medium --seconds 20 --start "-7538.90,-6068.84,-104.4955" --json --diagnostics --out shots/perf/okrug
```
