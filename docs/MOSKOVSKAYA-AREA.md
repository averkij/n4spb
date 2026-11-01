# Московская застава

Planning-map area **6**, playable as `moskovskaya.html`. The territory follows
the current embedded outline in `maps/intro-draft.html`, including its overlap
bands, rather than the older municipal core alone. The 80 m raster has 73
rectangles and covers **14.3872 km²**. Two enclosed raster holes are filled so
residential blocks cannot contain invisible territory walls. The complete Boris
Strugatsky house block on Pobedy Street is retained as an explicit overlap.
`src/areas/moskovskaya/territory.json` records the exact rectangles and policy.

The data port uses `D:/git2/agi-fun-tests/102_3d_piter`, commit
`022e72ca8b3a2d0bf716367e7399187cacca019e`. Its southern coverage comprises the
Moskovsky Prospekt corridor and the full Victory Park extract; it does not cover
all of the planned industrial and residential territory to their west and east.
Missing geography comes from the current OpenStreetMap geometry snapshot
`2026-11-01T07:20:51Z`, including minor streets, service roads, courtyards,
footpaths, lawns, crossings, buildings and street furniture. There is no invented
street grid. Existing source records remain authoritative inside its coverage;
crossing features use complete newly mapped geometry. Raw responses and converter
scratch files remain in the system temporary directory, outside the repository.

The 73 regional data parts contain 4,153 building records (3,798 outlines and 355
parts), 11,181 roads and paths, 2,205 green areas, 2,440 mapped trees, 100 tree rows,
3,905 furniture records, 35 water polygons and 24 waterway records. The facade
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
and the water below them. Grass slope run is 2 m so opposing banks cannot overlap
across the narrow paths between ponds.

The area starts at Victory Park's mapped main entrance. It provides one purple
Zhiguli at `-1698,7096`, facing south along the clear frontage, and a motor boat
in Admiralteysky Pond at `-1180,7333`, near the mapped rental location. The
existing water, driving, boat, furniture and collision systems remain active.
The fountain's shallow water comes from the park owner's water-body hook.
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

The surface audit records **180 residual samples out of 504,436 (0.03568%)**.
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
