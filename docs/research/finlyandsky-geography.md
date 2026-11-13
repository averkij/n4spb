# Финляндский: geography and data provenance

Planning-map district **64** is the Финляндский municipal district. The playable
territory follows the map's already planned land outline and shared water zones,
including the shared border streets and blocks. The 80 m raster uses the existing
B600 policy; no water cell is treated as impassable. The initial cut contains
**58 rectangles, 15.9424 km²**, spanning x −720..4400 and z −6480..−1920 in the
project's street frame. The finite-hole flood fill found no enclosed gaps.
The integrated cut replaces its final three narrow southern runs with one
shared block x −400..1280, z −2160..−1680. This keeps the southern embankment
and working handoffs to Palace and Smolny: the original raster had 440–520 m
dead transition strips. The final territory has **56 rectangles, 16.4736 km²**
and reaches z −1680. The registry and planning map show this deliberate overlap.

The source inspected before authoring was
`D:/git2/agi-fun-tests/102_3d_piter`, commit
`83fcd6e832282dcf45f212499fcd96c178d03583`. Its northern/eastern extract ends
inside this area. Only **151** source building records have their centroid in
the planned playable territory; **295** lie in the territory with its 120 m
scenery margin. Copying this source alone would leave most of the district empty.

`tools/prepare-finlyandsky-area.mjs` therefore obtains the district's complete
mapped streets, buildings, railway, green spaces and waterfront from
[OpenStreetMap](https://www.openstreetmap.org/relation/1181903), through the
[Overpass API](https://overpass-api.de/), or the official
[OSM map API](https://wiki.openstreetmap.org/wiki/API_v0.6).
For this checkpoint Overpass was at capacity. Sixteen bounded 1700 m map
tiles and 100 complete relation responses from the official API supplied the
snapshot. The actual API query covered x −1440..5120, z −7200..−1200;
complete relation geometry also retains mapped river reaches crossing it.
The source's matching architectural
dossiers remain in `known-data.js`. Raw OSM responses and query metadata are
cached under the operating-system temporary folder `n4spb-finlyandsky-osm`;
`src/areas/finlyandsky/source-info.json` records the actual snapshot dates,
query bounds and inspected source revision. OSM data is under the
[ODbL](https://www.openstreetmap.org/copyright).

The generator reuses the current repository's reviewed Sampson OSM converter
and its water repair logic through a configuration-only temporary wrapper.
Sampson's three deliberately removed boundary slivers do not apply here and
are omitted. Geometry is never imported across repositories at runtime. The
data facade retains the standard schema, 120 m scenery margin, 600 m water
ring, whole building outlines by centroid and union-clipped streets and water.

Connected Neva water keeps the shared `neva` renderer key and common navigable
water datum. Closed ponds remain explicitly separate. Mapped water polygons
missing from the converter's centreline match are restored to the river mask;
any real islands keep dry interiors. No invented foundation face should close
a water join. Final boats, bridge openings and transitions are checked in the
integrated area by the lead.

Useful existing source references include the bread museum `w24882049` at
(497.5, −2359), Arsenal's industrial frontage around (1315.9, −2743.2),
Bezborodko's dacha `r7357195` at (2776.9, −2908.6), and its mapped landing grotto
`r7357196` at (2713.4, −2887.4). Landmark specialists use current mapped
footprints and multiple visual references to author the distinctive buildings.
The full current relation moves Bezborodko's centroid to (2740.2, −2949.2),
whereas the old extract had clipped it. The full Finland Station outline is
`r2123616`, centroid (289.4, −2630), with four mapped building parts.

The final facade has **4194 buildings, 10377 roads, 305 railway ways, 31
fountains, 402 surveyed tree points and six river records**, plus the normal
surface, crossing, transit, prop and land-use arrays. Twenty-one matching
whole-city architectural dossiers are retained. Union-clip verification is a
fixpoint: `node tools/strip-data-clip.mjs --in src/areas/finlyandsky/data --check`
exits successfully without changing any data.

Regenerate with `node tools/prepare-finlyandsky-area.mjs`; use `--refresh` to
obtain a new Overpass snapshot, `--api-map --refresh` for the official tiled
API fallback, and `--shape-only` for a territory-only check. The
actual snapshot and final data counts are recorded in the committed source
metadata, rather than inferred from the date of this document.

The dedicated `node tools/finlyandsky-area-test.mjs` geography regression passes
nine checks: playable footprint consistency, real northern and eastern streets
beyond the former extract edge, complete Finland Station and Kresty building
families, the surveyed Visitation church, wet Neva points through the riverfront,
source provenance with retained architectural dossiers, and visible stacked
Europolis storeys. The all-area water
level run passes all 23 registered areas; Finlyandsky samples 502 rendered
water cuts, 502 physics points and 95 water-mouth points without a datum seam.
The integrated headless water-reachability run passes 17 checks, including
walking into the Neva, breaking quay fencing, driving into water, landing,
and standing on the mapped bridge decks.
The boat-passage quick run passes all 26 checks: Liteyny is sailed for 80 m
without a scrape or hit, all 11 drawn open-water pillars have colliders, and
all 818 sampled hull-height bridge-surface points are solid. The Neva's
1.3058 km² wet body stays connected for boats, without isolated transport-water
pockets. Logs are in `shots/finlyandsky/` (local ignored evidence).

The older generic `area-data-test.mjs --area finlyandsky` still assumes a North
source cut, Tauride landmarks and North transit routes; those checks do not
describe this live-map area. It also flags two Neva scenery-ring vertices at
(2640, −1440) beyond the stepped 600 m ring. That water is outside the playable
territory; the clipping tool is already a fixpoint and actual reachable Neva
points and integrated water traversal pass. This is retained as a limitation
of the generic dataset audit, rather than removing real scenic river water.

The authoring converter now requires comparable finite top and bottom heights,
with positive vertical overlap, before it marks an overlapping footprint as a
duplicate. Europolis' separate mapped 0–6.6, 6.6–9.9 and 9.9–13.2 m storeys
therefore remain visible. Regeneration removes six incorrect `dupOf` flags and
changes no building geometry or snapshot dates; two valid duplicate tags remain.
The city wall audit passes with no unexplained gaps, roof/floor/winding issues
or city output inside landmark claims.
