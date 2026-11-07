# Narvsky: initial live district, 2026-11-07

Planning-map area 73 is the authority for territory: `fp` land plus `wz`
water, B600 water reach, 80m cells. Enclosed finite raster holes are filled
so that residential blocks do not contain invisible territory walls. The
preparation tool records the exact output in `src/areas/narvsky/territory.json`.
The integrated territory is15.1488km² in83 rectangles. Local240m-overlap
corridors at the harbour railway frontier and the Moskovskaya rail strip
correct the raster's narrow handoff overlaps. Gate geometry audits give
working boundary lengths4580–8520m, worst dead strip240m, bounce risk≤3.4%.

The correct whole-city source is `D:/git2/agi-fun-tests/102_3d_piter`.
Its southern-western street coverage ends around z3170; only six source
buildings lie in x -6500..-2500,z3200..6000. A source-only cut would produce
an empty Narvsky. `tools/prepare-narvsky-area.mjs` therefore queries actual
OpenStreetMap geometry, uses the existing reviewed converter, preserves full
source records where covered and supplements its edges. Raw responses and
fetch metadata remain in the OS temporary directory. Reproduction:

```
node tools/prepare-narvsky-area.mjs
node tools/configure-narvsky-area.mjs
node tools/connect-narvsky-areas.mjs
node tools/owns-table.mjs
node tools/gen-area-html.mjs --area narvsky
```

## Gate references and authored detail

- State Museum of Urban Sculpture, owner inventory and history:
  https://gmgs.ru/post/17574 and https://gmgs.ru/narva_gate
- Saint Petersburg Encyclopedia dimensional inventory:
  https://www.encspb.ru/object/2805471522?dv=2853952566&lc=ru
- Contemporary frontal photograph inspected during authoring:
  https://www.facade-project.ru/spravochniki/razdel_statej/fasadnyj_dekor_v_stilyah_arhitektury/russkij_ampir_v_arhitekture/2-5-arch-ampir1/
- Additional photographed reference by Alex 'Florstein' Fedorov, 2025:
  https://commons.wikimedia.org/wiki/File:Narva_Triumphal_Gate_(img1).jpg

The main frame follows the longest edge of mapped way w73174258, rather
than a guessed north-south axis. Body width22m/depth7m, total height about31m,
clear opening8.4m crowned at15m; twelve fluted columns, Corinthian leaf
capitals, four helmeted warriors with shields/spears, gold plaques and
wreaths, flying winged reliefs, eight attic genii, soffit coffers and the
six-horse Victory group with its wheeled chariot.
Details use short-range static material collectors; horses and upper mass
retain a distant silhouette. No flags or flagpoles are introduced.

The whole building footprint is elevated in data; the landmark supplies only
actual pier/column colliders. Walking and driving through the arch remain open.
Mapped water uses the shared connected datum; garden ponds remain explicitly
isolated and reachable. The area has one purple Lada, per the station-less rule.

This dossier records authoring sources, not a final performance or visual pass.
The lead performs integrated screenshot, water/road/transition checks and bake
after all specialists finish.

CPU checkpoint:4099 buildings,8347 road pieces. `narvsky-area-test` passes
the physical arch/car passage, actual pier/overhead solids, three Gorky foyer
doors, southern map coverage and boat datum. `layout-test`, `views-check`
(six start/landmark poses), purple-Lada garage check and water-level test
(3817 rendered cuts,1463 physics samples) pass. Static clip check is a fixpoint.
The water-reachable integration test passes17 checks: walkers and cars enter
water, quay bays break, bridge/landing floors remain solid and all78 mapped
drivable bridge ways have physical road surfaces over water. The focused
350m gate/club road-furniture audit passes strict criteria with0 on-road,
median or street-parking offenders. These CPU checks do not establish FPS.

## Integrated keyboard playtest

`node tools/narvsky-playtest.mjs` loads the normal medium-quality baked page,
walks through the open Narva arch using W, enters and drives the purple Lada,
boards and steers the harbour boat, brakes/exits both vehicles and verifies R.
It crosses the real Narvsky→Kolomna seam and its reverse with the ordinary
gate machine, page navigation and bake hydration. Position/preload hooks place
the walker at each approach; movement, boarding, exit and travel are not
simulated. Geometry preselection uses the actual registry gate priority.
Street/arch/vehicle/skyline/seam screenshots and a staged JSON report go into
`shots/narvsky-playtest/`. Run serially with GPU jobs after final bakes.
`--plan` inspects reciprocal seam candidates without launching a browser;
`--skip-hops` is explicitly a shorter vehicle/landmark-only diagnostic.

Bridge-fence count diagnosis:8,829 records come from the mapped bridges,
not generic imported inland barriers. There are128 bridge-way pieces over
24.179km and1,255 deck segments. Subdividing both edges into≤6.4m bays gives
8,831 potential panels;2 are skipped. Motorways contribute4,474 bays over
12.46km; motorway links639; primary roads/links2,250; footways904. The
largest individual source way is WHSD w183912266,2.018km with734 bays.
The remainder follows minor crossings. Per-segment rounding adds some bays;
there is no measured proof that removing any mapped rail is appropriate.

## Garage exit correction evidence

The first integrated playtest exposed a bad orientation at the garage:
(-4363,3547),yaw0 faces a facade corner after19m. The previous14m garage
check could not detect it. The proposed heading25° (0.4363323129985824rad)
keeps the same position and nearly follows the neighbouring Stachek road's
30° tangent. A full-world CPU probe measured at least65m of clear swept
width,12.71m to the nearest driven lane and free boarding strips on both sides.
Actual Lada handling runs2s full throttle to30.86m/101.81km/h,then4sSpace
to a stop at total77.07m,with0 impacts. This is correctness evidence, not FPS.

The regression in `narvsky-area-test.mjs` now sweeps the car's complete body
35m ahead. It rejects the old pose at advance18.5m. `--garage-world` includes
generic city, streets, fixture and parked-car solids and exercises the same
2s acceleration/4sSpace sequence with actual handling. Reproduce candidate
checks without editing runtime data:

```
node tools/area.mjs narvsky tools/narvsky-garage-probe.mjs --pose -4363,3547,25
node tools/area.mjs narvsky tools/narvsky-area-test.mjs --garage-world
```

The initial boat pose(-5596,3470),yaw0 also passed a point-water check but
hit the preserved moored tourist boat after5.19m. A full actual handling
probe reproduces its0.011km/h stop and-.427rad collision deflection exactly.
Its replacement pose(-5596,3476),yaw-π/2 leaves west into open water and
keeps a real pontoon boarding floor at(-5592.323,3479.677),y-3.08,within
the5.6m E prompt's3D reach (camera distance5.303m). At game time0,30,60,
the full world including wildlife and both spatially active nearby craft
passes the same4.5sW +1.1sW/A +4sSpace course:34.50m launch at44.29km/h,
0.356rad steering change,60.53m total travel to rest,0 hull contacts and0
dry-hull samples. The neighbouring13×3.2m and12×3.4m tourist boats remain
unchanged. The normal playtest now boards from that actual pontoon floor and
requires a30m launch; the CPU regression tests35m of complete hull clearance
and all three timed handling courses, with player focus/time set as in-game.


The release overlap audit also exposed two height problems in supplemental OSM
records. [Warehouse w49629469](https://www.openstreetmap.org/way/49629469)
at30.2545801,59.8887853 has no mapped height or storey count. The generic
21m rental-house mass intersected the WHSD above its western/southern roof edge.
[Esri World Imagery aerial](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=30.2515,59.8870,30.2574,59.8905&bboxSR=4326&imageSR=3857&size=1200,1000&format=jpg&f=image),
inspected2026-11-07, shows a large low industrial hall with repeated sawtooth/shed
roof strips. The real footprint overlap is retained. Its9.9m height is an explicit
visual estimate, not a surveyed OSM value; `heightSource` records that distinction
while `hSrc:'height'` selects the existing exact-height path. Local `kind:'shed'`
and flat-roof attributes prevent a randomly selected residential mansard: the
central city grammar does not consume flat-roof tags by themselves.

The actual built factory roof/cornice and wall-collider tops are10.9m. Over the
warehouse footprint, actual coastalBridges vertex and triangle-centroid minimum
is19.3999996185m (Float32 representation of19.4), maximum22.055m. The visible
girder is8.5m above the roof; the bridge collider soffit is19.425m. A bounded
audit height threshold19.35m allows5cm for this measured underside difference;
it does not excuse geometry outside the real bridge envelope.

[Roof w685882720](https://www.openstreetmap.org/way/685882720) above
[covered ramp w685882716](https://www.openstreetmap.org/way/685882716) had lost the
evolved Moskovskaya canopy datum. Its restored lower face is11.025m,5m over the
6.025m ramp. Narvsky preserves the existing Moskovskaya canopy in an area-local
owner using only Narvsky bridge-site data: the .32m slab tops at11.345m, with
rim, underside spine and four real supporting columns spanning6.025..11.025m.
The columns clear the actual street carriageway; no wall crosses the lanes.
The former generic floating city slab is claimed and replaced. This owner uses
four material collectors, static batching and finite2600m LOD with no textures
or per-frame work. The actual physics column from6.1 to10.9m remains clear.

`node tools/area.mjs narvsky tools/narvsky-height-test.mjs` builds the actual
streets/city/landmarksNarvsky/coastalBridges modules on these two source records and verifies drawn
buffers, wall colliders, the clear covered-ramp column, and the measured bridge
envelope. It is a focused CPU geometry test, not a loading/FPS benchmark.
