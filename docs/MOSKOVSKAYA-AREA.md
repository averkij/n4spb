# Московская застава

The current expansion is **10.0.0**. Older checkpoint measurements below remain
historical; final shipping and driving evidence is in [PERFORMANCE.md](PERFORMANCE.md).

Planning-map area **6**, playable as `moskovskaya.html`. The territory follows
the current embedded outline in `maps/intro-draft.html`, including its overlap
bands, rather than the older municipal core alone. The expanded 80 m raster has 69
rectangles and covers **22.0096 km²**. It reaches Ленинский проспект and улица
Типанова, including transferred northern blocks of neighbouring districts.
Existing live cells are retained. Enclosed raster holes are filled so
residential blocks cannot contain invisible territory walls. The complete Boris
Strugatsky house block on Pobedy Street is retained as an explicit overlap.
`src/areas/moskovskaya/territory.json` records the exact rectangles and policy.

The data port uses `D:/git2/agi-fun-tests/102_3d_piter`, commit
`47a475d108a959f17e2460ceb59ed37bf9f9d4db`. Its southern coverage comprises the
Moskovsky Prospekt corridor and the full Victory Park extract; it does not cover
all of the planned industrial and residential territory to their west and east.
Missing geography comes from the current OpenStreetMap geometry snapshot
`2026-11-01T07:20:51Z`, supplemented on 2026-11-07 in the new eastern/southern
strips and expanded water ring, including minor streets, service roads, courtyards,
footpaths, lawns, crossings, buildings and street furniture. There is no invented
street grid. Evolved live records remain authoritative inside their coverage;
crossing features use complete newly mapped geometry. Raw responses and converter
scratch files remain in the system temporary directory, outside the repository.

The 69 regional data parts contain 5,580 building records (5,054 outlines and 526
parts), 18,561 roads and paths, 3,421 green areas, 3,970 mapped trees, 172 tree rows,
5,800 furniture records, 44 water records and 27 waterway records. The facade
retains the standard area data exports and source route metadata. These are data
record counts, not rendered object counts; generic generators apply their normal
placement, claims, batching and distance rules.

All nine named Victory Park ponds preserve their surveyed outlines and islands:
Admiralteysky, Fontanny, Ochki, Figur­ny, Peyzazhny, Korabelny, Kapitansky,
Matrossky and Detsky. OSM sometimes classifies the larger park ponds as rivers;
the port corrects their renderer datum to the shallow `moat` profile. Waterway
polygons with island holes are decomposed into adjacent polygons with no holes,
because the shared bank index consumes outer rings. Their union subtracts the
islands exactly, preserving dry ground and vegetation on them. The common edges
are open water seams. Natural grass shore slopes replace canal embankments in
the park, with no railings. Mapped footbridges and road overpasses use the shared
`coastalBridges` builder, physical decks and knockable rail segments. Its site
planner is remapped to the area's `bridge-sites.js`, an inland adaptation of the
maintained shared planner: a southern coordinate alone must not select the Sea
Canal's harbour elevation or distant Korabelny Bridge pylons. The area's narrow
`bridge-fallbacks.js` adapter removes only exact obsolete rectangular quay-floor
signatures at those owned crossings, preserving the real curved planar decks
and the water below them. Park slopes use a nominal 2 m run, fitted to the
available dry strip. The shared fitter reserves at most 49% of a narrow strip
for each bank, limits corner backtracking and blends fitted widths. Rendered
profiles, physical terrain, ground cuts and rail tops use the same widths.

The area starts at Victory Park's mapped main entrance. It provides one purple
Zhiguli at `-1698,7096`, facing south along the clear frontage, and a motor boat
in Admiralteysky Pond at `-1180,7333`, near the mapped rental location. The
existing water, driving, boat, furniture and collision systems remain active.
The park builder registers the fountain's native shallow physics water on every
boot; the area's water-body hook supplies its surface/vegetation mask.
Footpaths and drivable roads retain the shared street rules and asphalt checks.

Landmark ownership is divided between `landmarksMoskovsky` (Moscow Gate),
`landmarksMoskovskaya` (district architecture and Strugatsky Square), and
`landmarksMoskovskayaPark` (park entrance, memorials, pavilions and arena).
Fountain/pavilion paving and the formal lime rows use area hooks so procedural
vegetation cannot grow through them. Buildings retain their real footprints;
Moscow Gate's overhead entablature and the National Library's open front portico
have elevated base datums, with their actual walls and columns supplied by their
landmark owners, allowing vehicles through the drawn openings. The mapped WHSD
toll canopy is separately owned and drawn above its elevated ramp, with 5 m
headroom, its exact roof footprint and supports outside carriageways.

Regenerate geographic data with:

```powershell
node tools/prepare-moskovskaya-area.mjs
```

The tool caches raw OSM responses in `%TEMP%/n4spb-moskovskaya-osm/moskovskaya`.
`--refresh` requests a new snapshot; `--fetch-only` downloads without conversion;
`--shape-only` regenerates only `territory.json`. Regeneration uses the existing
reviewed OSM converter in an isolated temporary module, then merges and clips the
source port. It never writes to the source project. Geographic changes require
review and a new bake of this area.

CPU verification of the data/area checkpoint: territory topology has no holes or
disconnected pieces; `strip-data-clip --check` is byte-stable; `layout-test` and
`landmarks-groups-check` pass; all 12 HERO/view poses pass `views-check`; garage
verification passes with no blocked samples over the 14 m exit corridor. Both
Semyonovsky transition arrival grids pass without a HERO fallback. All 11
surveyed island-hole probe points remain dry, and all nine tested boat-hull
samples lie on water. `areas-test --area moskovskaya` passes 210 checks. The lead's
integrated rendering, roads/markings audits, navigation/boat checks, shipping bake
and performance results complete release validation.

The final full water-reachability run passes **15 checks**, and the full boat
passage run passes **all 14 checks**. The boats sail the available mapped pond
crossings without hits or scrapes, and each connected basin retains one free
water body. Half-metre park footbridge slabs match the visible fascia and the
shared floating-hull collision rule; no additional water blockers are used.

The original 14.39 km² checkpoint's surface audit recorded
**180 residual samples out of 504,436 (0.03568%)**.
These are existing shared-generator edge cases in this larger dense network,
below both the 0.3% contract and the strip's documented 0.0412% baseline:

| Samples | Kind | Observed cause |
|---:|---|---|
| 161 | Narrow median | Short triangular taper slivers at the transition from a wide reservation to a junction merge; vertex width interpolation and corner pavement clipping |
| 15 | Carriageway | Tiny smoothed endpoint/cap slivers over the ground surface |
| 4 | Junction fillet | Three kerb samples and one adjoining pavement sample |

The largest cluster has 20 samples at the curved WHSD/Cuban Street ramp
`w972792569`. There are no landmark paving overlays among these residuals and no
new material or geometry exemptions. `roads.mjs` uses the measured 180-sample
area budget, following the existing per-area residue policy. The full individual
sample report is reproducible with `roads-surface-audit.mjs --json <file>` under
the `moskovskaya` loader. Changing surveyed road tags or moving their axes would
hide the shared-generator issue rather than correct its cause.

The additional facade audit samples 5,067,954 wall positions. Roof, floor,
winding and ownership checks are clean. Six embedded-corner samples are allowed;
one unexplained low sample remains on `w72573681`, edge 4, at
`-754.4,0.4,5294.3` (`analyse-hid-no-inner-cover`). The focused audit reproduces
the same gap with the pre-area city generator at `d613560` over the new data.
This is a shared occlusion-generator residual, not a passing facade audit; no
building-specific exemption or relaxed audit threshold was added. Reproduce:

```powershell
node tools/area.mjs moskovskaya tools/city-wall-audit.mjs --near "-754.4,5294.3,15"
node tools/area.mjs moskovskaya tools/city-wall-audit.mjs --near "-754.4,5294.3,15" --ref d613560
```

The pond-bridge fixture correction applies to the shared quay builder. Every
mooring ring, anchor plate and culvert sprite must fit wholly against a real
vertical wall face, including the wall's height-dependent batter and mitred
corners. Bridge-zone ends on natural grass banks no longer create floating
anchor plates or unsupported black culvert arches. Coastal railing panels now
terminate into attached end posts; their horizontal bars and terminal caps remain
closed even where a road opening or a broken panel ends a run. This retains the
same material, cell meshes, collision widths and independently breakable panels.

`tools/quay-fixture-audit.mjs` verifies the actual built meshes without a GPU:
nine world-space backing probes per wall sprite, post intersections at both
rail ends, every post foot supported by a physical deck triangle, closed
triangle topology and mutations for unsupported mounts,
missing posts and missing faces. Run under any area loader, or through
`tools/each-area.mjs` for the complete registry.

Natural pond banks share one immutable surface plan between drawing and
`layout.heightAt`, including a submerged return from the bed. Closed banks use
the same join on both sides of their closing vertex; open ends have complete
profile caps. Each walk triangle faces upward even where a quad is warped.
Concave ground-cut footprints are triangulated before convex subtraction.
Width fitting samples long source edges at most 2 m apart, retains all fitted
transitions and source bends, and removes unadjusted inserted collinear points
to contain geometry cost. Mixed shore/open regional edges are split at water
boundary crossings before bank classification. Real shores exactly on clipping
lines survive; repaired seam gaps cannot flood authoritative source islands.
The slope-clearing predicate governs vegetation/surface placement. Player and
vehicle movement remain open, and boats retain the original water polygons.

The reported routes/views are reproduced by `tools/park-shore-playtest.mjs` on
the normal full page, after baking. It walks the real player out, in and out
again at `-1407.9,7248.1`, checks support/rescues and saves all five reported
camera views. `tools/natural-bank-test.mjs` checks actual front-sided bank
meshes against terrain and performs **44 two-way routes through eleven park
basins**, including all nine named ponds. Final checks cover 22,986 walk
triangles and 793 actual front-sided rays, with a maximum render/terrain error
of 0.000274 m. Its flat-floor mutant reproduces the old physical mismatch.
The independent strict Float32 audit passes 125,146 rendered-grass probes,
35,789 dry-shore probes and 2,554 final convex cuts. A separate source-topology
regression checks all eleven islands with 30,106 dry interior probes and 8,425
surveyed shoreline probes. The [park research dossier](research/moskovskaya-park.md)
records reference evidence, final counts, reproduction commands and remaining
finite-sampling limits. Final shared environment geometry is **893,242 triangles
against its 980,000 budget**; shipping bake/performance evidence is recorded
separately in [PERFORMANCE.md](PERFORMANCE.md).

The shared-change boat regression also reproduces an older Smolny defect at
the `north-bridges` pillar near `(2635, -1137)`: three drawn-footing samples lack
floating-hull collision coverage, and the corresponding ram check fails. The
read-only engine baseline at `522d0bb` has the same two failures out of 48
checks. This is an existing pillar-coverage defect, not a passing boat audit;
the fixture repair does not change that bridge's collision geometry.

Kronverk also reproduces its older fortress-bridge ram defect at `522d0bb`:
boats end inside the drawn footings near `(-2340, -1920)` and `(-1600, -2249)`.
The static pillar-coverage check passes, but the dynamic ram check fails in
both the current scene and the read-only baseline. These two measured older
bridge defects remain explicitly reported rather than waived by the audit.

Registry-wide verification passes all sixteen actual-mesh quay-fixture audits
and all **282 water-reachability checks**. The three areas affected by the final
shore-profile adjustment were rerun against matching recorded source digests:
Palace, Kolomna and Moskovskaya pass all nine fixture/water/boat audits. Their
water suites pass **23 / 17 / 15 checks**, and their boat suites pass
**108 / 99 / 14 checks**, respectively. The full boat matrix retains Smolny's
two older pillar checks and Kronverk's one older fortress-ram check described
above; neither defect is counted as a pass. Evidence includes
`shots/fit-three-area-status.txt` and the per-area final audit logs.

Palace's road wrapper still fails its strict furniture audit, while its
96-sample surface residue remains within the 120-sample budget and its ribbon
checks pass. Its marking suite also retains one missing stop bar at
`n1562060894`, approach 2, Kuznechny Lane near `(154.9,597.3)`. Both failures
reproduce unchanged at `522d0bb`, as recorded in
`shots/park-repair/roads-palace[-head].txt` and
`shots/park-repair/markings-palace[-head].txt`. Moskovskaya's road and marking
wrappers pass with the documented 180-sample surface budget. These older
Palace wrapper failures are recorded separately from the passing new-area
surface and transport checks.

## National Library and crossing revision (9.1.0)

The new building at Moskovsky Prospekt now follows the owner-supplied entrance
photographs: a raised granite podium with ten broad steps, nine rectangular
piers, a recessed three-level glazed facade with arched upper windows, ceiling
coffers, an open circular court and a curved facade inscription. The mapped
building envelope and ten existing roof courts remain. The entrance can be
walked through the colonnade and back to the square.

The forecourt now has one connected scalloped shallow basin with two stepped
principal drums and four flared corner bowls, patterned grey paving, mapped
lawns, flowers, paired lamps, benches and the current Speransky and Koni
monuments. Stale two-pool geometry and a duplicate Koni node are claimed by the
landmark. Six obsolete approach ribbons/steps are also claimed so they cannot
bleed through the authored paving and entrance. See the
[reference dossier](research/russian-national-library.md) for the photographic
estimates and map reconciliation.

The two incorrectly tall generic blocks at `w134205326` and `w134205325` have
been replaced by low glazed pedestrian-underpass pavilions on their actual
mapped footprints. Six real stair approaches lead to a 45.6 m crossing beneath
Moskovsky Prospekt. Ground and walking surfaces open at the stair mouths;
carriageways and tram rails retain their support above the tunnel. The approach
aprons reveal this underground crossing before its steps enter view. Read the
[crossing dossier](research/library-underpass.md) for surveyed records and the
estimated vertical dimensions.

Focused regressions exercise actual front-sided floor/roof/lettering geometry,
physical steps, native fountain water, player entry/exit and breakable furniture.
The authored district is 209,839 static triangles against its 210,000 budget,
with no per-frame callback. Final shipping-bake screenshots, full transport
checks and driving measurements are recorded in [PERFORMANCE.md](PERFORMANCE.md).

The same revision repairs finite generic bridge closures at skewed abutments
while preserving joined waterway fairways; adds only the exposed lower masonry
between unequal water levels at quay junctions; and reserves raised long-bridge
decks against generic paving and below-deck trolley hardware. The
[quay junction note](research/quay-junctions.md) records the exact reported
Fontanka rays and why an ordinary downward bank extension was insufficient.

## 10.0.0 — Southern and eastern expansion

The planned Leninsky/Tipanova extension is now actual scene territory, including
the eastern Gagarina/Vitebsky streets and Moscow Square. Regeneration fetches
the uncovered strips of the cached OSM window instead of silently accepting
an older, smaller download. The water ring has its own bounds-keyed cache.
All prior live cells remain in the new union. Repeated records with one OSM ID
are retained as families, and disjoint source way pieces are recovered without
overwriting maintained local geometry.

`moskovskaya-expansion-test.mjs --baseline 1ca86f6f --source
D:/git2/agi-fun-tests/102_3d_piter/src/world/data/city.js` independently checks
all 4,153 prior buildings, 2,440 earlier mapped trees, 85,862 earlier road
samples, 352 split-source samples, 881 wet pond probes, 50 dry island probes
and 2,248 previous playable cells. Library portico/hall/underpass and Basseynaya
pilotis protections remain intact. Current geometry has no missing prior family.

The separately authored House of Soviets keeps all four building parts and
three open courtyards. Fourteen physical columns, end porticoes, relief figures,
the roof emblem and Lenin's granite plinth follow the inspected reference.
The square's 32,377.705 m² surveyed field is partitioned into granite paving,
mapped lawn islands and eleven real basin openings. The competing generic
`w715035938` paving yields to this owner. Paving adds 1,010 static triangles,
three materials, no colliders and no frame callbacks; 7,178 independent rays
protect the water openings, lawns and slab surfaces.

Four OSM pool records had been tagged as ponds while their operating nozzles
were separate fountain nodes. The preparation correction marks the true basin
polygons as fountains, removes their false river cuts and retains the five
nozzle nodes as aliases. The generic shared live-fountain owner animates all
eleven physical basins, including the relation containing two main pools.
Fountain planting masks preserve their water openings and the existing trees
on actual lawn islands. Water remains reachable on foot and by car.

Final strict road furniture checks have zero failing obstacles, narrow-median
fixtures or parking overlaps. The full surface audit retains 311 shared
generator residual samples out of 799,234 (0.03891%), with no authored building
or square overlay; the documented tripwire is 360. Road markings and ribbon
audits pass. The formal square's focused audit is not independently all-green:
it includes 35 of those external median samples beyond its surveyed boundary.
The fountain/architecture and square-paving regressions run in CI.
