# Cross-river architectural coverage

The playable area boundary is not a useful boundary for a river panorama.
`tools/waterfront-data.mjs` generates a separate visual strip for the Neva,
Bolshaya Neva, Malaya Neva and the northern branches. Ordinary houses retain
their surveyed footprints, storeys and researched facade specifications. The
first block reaches 180m behind the bank, within 1500m of the receiving area.
A district with no bank within 120m of its territory gets no strip. Complete
building families and selected landmark ensembles keep their roofs together.

The source is the owner's full-city scene at
`D:/git2/agi-fun-tests/102_3d_piter`, supplemented by newer current live area
records and the northern areas' current water context. That source is never
imported by a runtime page. Generated files retain its revision and OSM credit.
There is no runtime OSM request. Regenerate with:

```powershell
node tools/waterfront-data.mjs
node tools/waterfront-data.mjs --area palace
node tools/owns-table.mjs
```

Each area's `data/waterfront.js` is statically imported by its data facade.
Existing buildings win by ID; the supplement adds missing buildings and the
overlaps between included records. The known-data facade attaches only the
researched specifications for those extra records. Live area re-cutting with
`area-data-cut.mjs` regenerates an existing supplement automatically. When
regenerating a known-data facade separately, rerun the waterfront generator
afterwards. The process is deterministic and keeps PLAY, EXTENT, registry
territories, planning-map territories and area gates unchanged.

`landmarksRiverfront` reuses the existing Fortress, Strelka, University,
Winter Palace/Hermitage and Admiralty/Senate architectural builders. It omits
gardens, population, bridge operation and navigation services. Only the
ensembles absent from that receiving area's specialist module list are
included. Their complete claims suppress generic rendering and the old simple
far silhouettes. The visual adapter discards physical registration and frame
callbacks; its only public service contains triangle and part counts.

Existing local building preparation, adjacency, wall colliders, carriage gates
and navigation doors remain independent of scenic records. Local and scenic
records have separate preparation and edge graphs. The original local wall
pipeline remains active even when a real panorama model replaces its rendering.
Supplemental records cannot introduce passages or physical walls. Their city
output uses the existing facade/cornice/roof streams and baked region loader;
it creates no nearby shop clutter or navigation doors. The ordinary horizon
grid has an immutable spatial exclusion index for actual waterfront buildings.

Normal facade detail used to disappear entirely above 0.8m per pixel. The
SCENIC wall flag retains analytically filtered rectangular window apertures on
visual-margin facades. Actual bay widths and storey heights stay visible after
mullions, tiny trim and grime fade; subpixel apertures converge to their area
coverage. This adds no geometry, materials, textures or frame update work.
Landmark ornament uses feature-based 350/900m ranges; large surfaces reach
1800m and tall skyline masses 2500m. Authored ranges survive normal batching.

Focused verification:

```powershell
node tools/waterfront-test.mjs
node tools/area.mjs palace tools/waterfront-test.mjs --geometry
node tools/area.mjs kronverk tools/check.mjs landmarksRiverfront
node tools/closure-lint.mjs
```

The first test checks all sixteen unchanged territories, unique IDs, complete
landmark references, bounded selection and absence of duplicate specialist
owners. Palace's geometry test compares the existing collider and navigation
door arrays exactly with and without the supplement, then verifies that the
visual adapter creates no colliders or update callbacks. Both shores have
procedural-render evidence under `shots/waterfront/`; final matching-bake
integration and performance results belong in `PERFORMANCE.md`.
