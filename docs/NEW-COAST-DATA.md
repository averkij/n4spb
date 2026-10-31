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
| Морские ворота | M01–M59 | 15.0464 km² | x −10800…−4560, z 1200…5840 |
| Округ № 65 | O01–O58 | 17.856 km² | x −10160…−4800, z −9200…−4000 |

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

## Final extract counts

| Records | Морские ворота | Округ № 65 |
| --- | ---: | ---: |
| Buildings, including parts | 997 | 2,641 |
| Building outlines | 934 | 1,989 |
| Roads and mapped paths | 1,739 | 8,529 |
| Water polygons | 66 | 58 |
| River/canal/waterway records | 16 | 21 |
| Green areas | 183 | 1,963 |
| Individual mapped trees | 166 | 571 |
| Bridge records | 76 | 137 |
| Barrier lines / nodes | 423 / 252 | 1,206 / 1,182 |
| Piers | 16 | 42 |
| Railway ways | 156 | 12 |
| POIs | 134 | 2,453 |

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

For the operable container ship, a 400 × 62 m hull grid at centre
**−7731.696, 3166.416** (30.213° E, 59.904° N) and axis
`[sin(150°), cos(150°)]` passes **51/51** water-and-territory probes spaced 25 m
along the hull. The suggested earlier point 30.224° E, 59.900° N is dry cargo
quay and was rejected. Motorboat positions −7610, 2980 and −7700, 3110 each pass
9/9 wet/in-play probes over a 4 × 14 m footprint. Runtime collision, bridge
clearance and boarding are separate integration checks.

## Data checks

Both extracts pass the existing facade shape, registry/extent, part formatting,
concatenation, geometry containment, first-rectangle ownership, building-ID and
overlap-reference checks, and `strip-data-clip --check` is a fixpoint. The legacy
`area-data-test` still assumes North-area sights and complete centre transit
routes for unrecognized area IDs; those assumptions do not describe these
new coastal extracts. Area-specific runtime, road, water, bridge and performance
results are recorded by the integration checkpoint.
