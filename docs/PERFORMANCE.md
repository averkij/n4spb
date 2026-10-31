# Performance — what costs what, what was done, how to measure

> **Full-city numbers.** Every figure, timing, triangle count, region count and bake size in this file was measured on the whole 102_3d_piter city (up to 82 km2 of play area, 53-57 regions, a 450 MiB bake) before it was cut down to the Nevsky strip (4.9 km2, see [STRIP.md](STRIP.md)). Sections about islands, Krestovsky, Vasilievsky, Petrograd, the Moskovsky corridor and their tools (`islands-*`, `coverage-check`, `south-extension-check`, ...) describe code and docs that are no longer in this repository: the links to `ISLANDS-2026.md`, `SOUTH-EXTENSION.md`, `SEVKABEL-CULTURE.md` and `coverage.html` below are dead and kept only as history. The method (what costs what, how to measure) still applies; re-measure on the strip before quoting a number.

> **Bake revisions.** Every "source hash", "static revision" and "bake revision" below is the ONE global revision of the time (a hash of all of `src/`). Since 2026-10-29 each live area has its own revision, the hash of its dependency closure (docs/AREAS.md section 4, docs/BAKE-REVISIONS.md); the measurements and the `/__baked_revision` 404 notes stay as they were. `tools/bake-manifest-check.mjs` now checks every area against its own closure.


## 2026-10-15/16: walking and driving rounds 2 and 3 (far field, outline proxies, people scheduling, instanced ranges)

Goal (user): comfortable walking and driving in the old centre, ≥ 30 FPS at medium quality on the
RTX 3090 Ti / Edge / D3D11 machine, and a shorter load. Round 2 (`75218db9`) implemented the measured plan
[PERFORMANCE-PLAN-2026-10-15.md](PERFORMANCE-PLAN-2026-10-15.md): far-field range audit and 1.3 km
super-cells, lazy outline proxies, allocation-free tree / lawn repacks, people far-agent scheduling, metro
atlas waste. Round 3 (this section) diagnosed why the centre drive had not improved and removed the
remaining far-field draws.

### What the frame is bound by (round 3 diagnosis)

* **Headless frames are vsync-quantised** to multiples of 16.7 ms (the p50 of every run is exactly 33.3 or
  50.0 ms). A frame whose work exceeds 33 ms lands at 50 ms, so the 30 FPS target needs < ~30 ms of work.
  The frame probe's callback time (`frameCb`) is the number to judge, not the interval.
* **The frame is CPU draw-submission bound, not GPU bound.** Half or quarter resolution changes nothing,
  and the GPU timer (`EXT_disjoint_timer_query_webgl2`) merely tracks the CPU submission time at every
  pose and every toggle (a run of 30 toggles at four poses: `shots/perf/round2-gpu`, local). A colour
  draw costs about **13 µs** on ANGLE / D3D11 whatever its size.
* At street level **over half of the ~1 900 colour calls were beyond 1.5 km**: unnamed facade pieces whose
  atlas, basic or no-outline materials could never join a far proxy (172 pieces beyond 3 km), bridge rail
  cells with an infinite range (~80), landmark boats (133 calls at 0.8–3 km, the piers under the dynamic
  root), and about **560 instanced draws per frame**, most of them a landmark's `noBatch` instanced details
  (piers, pylons, posts, gate piers, lamps, balusters) 2–6 km away, never registered for LOD at all.
* The people loop costs more while driving (10 ms against 5.6 walking) because the fixed-step sim runs
  more micro steps per longer frame and GC pauses land inside its callback; routes are not the cause
  (a headless drive along Nevsky at 42 m/s: ≤ 2 ms of routing per frame, `shots/perf/plan/people-drive-cost.mjs`).

### What changed (round 3, all behind URL switches)

* `core/batch2.js`: far proxies now also replace atlas-page pieces (the page is sampled per vertex from a
  128 px downsample, `pageSampler`), basic pieces (lit by the proxy material) and pieces on the no-outline
  colour layer; a tall alpha-tested / transparent piece ends at `FAR_L_LOW` instead of drawing city-wide.
  `?farall=0` restores the old rule. These pieces now join the far super-cells too.
* `core/spatial.js` `instancedAuthoredFar`: an instanced mesh with an infinite (or no) LOD range gets a
  range from the size of ONE instance (radius × 700, clamped 300–2 500 m before the quality scale); a mesh
  whose instances reach the skyline keeps infinity. `splitInstanced` applies it to authored infinite ranges
  and registers the unregistered `noBatch` instanced details loose (they keep their parent); the region
  streamer uses it for instanced region meshes. `?instrange=0` = old.
* `bridges/rails.js`: rail cells end at `RAIL_FAR` = 1 500 m. `landmarksC/boats.js`: boats hide beyond
  900 m of the camera; the landing stages moved to the static root (batched, far proxies).
* `world/people.js`: a live frame runs at most 4 micro steps (`?pcap=`); after a long frame the sim catches
  up one step per frame instead of replaying every missed step in the next frame. Screenshots and the
  headless tests are unaffected (`ctx.frameStep`).

### Measured (forced bake, diagnostic, same machine; `shots/perf/round2-*`, `round3-*`, local)

| Fixed camera (`__bench`, CPU ms / colour calls) | Round 2 | Round 3 |
|---|---:|---:|
| Drive endpoint, in the car (146, 13) | 26.8 / 1 951 | **18.0 / 1 381** |
| Drive start, Vosstaniya (504, 137) | 27.1 / 2 240 | **19.4 / 1 650** |
| Hero view | 13.4 / 1 317 | 12.3 / 1 294 |
| Nevsky long view (`v3`) | 26.9 / 2 193 | **16.3 / 1 619** |

| Instrumented probe (`plan-bench`, mean ms) | Round 2 drive | Round 3 drive | Round 2 walk | Round 3 walk |
|---|---:|---:|---:|---:|
| Frame interval (p50) | 62.1 (50) | **50.6 (50)** | 47.0 (50) | **40.1 (33)** |
| Frame callback | 56.3 | **44.6** | 44.2 | **37.4** |
| — render (colour calls) | 28.8 (1 676) | 20.7 (1 167) | 28.3 (1 998) | 21.3 (1 443) |
| — module updates | 22.3 | 19.0 | 11.6 | 11.7 |
| —— people | 10.1 | 7.5 | 5.6 | 4.8 |
| — LOD.update | 2.8 | 2.8 | 3.0 | 2.9 |

Pixel diffs of the four fixed poses against round 2 show only pedestrians and vehicles; the static scene is
unchanged at street level. Instanced draws at the drive start: 581 → 396.

### Shipping result (bake `70654a3472b099231e9f`, normal loading, `drive-bench` section 4 commands, `shots/perf/round3-final/`)

| Route, medium, 20 s | Load s | Mean ms | p50 | p95 | Max | > 80 ms | Calls | FPS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Centre drive, metro-round baseline (`01db8635`) | 202.8 | 46.1 | 35.3 | 69.8 | 791 | 12 | 2 091 | 22 |
| Centre drive, after the metro round (`cd511f09`) | 279.1 | 228.4 | 70.3 | 864.7 | 947 | — | 2 802 | — |
| **Centre drive, rounds 2 + 3** | 232.4 | **39.9** | **33.3** | **50.1** | 450 | 11 | **1 309** | **25** |
| Centre walk, Oct 15 final | 201.6 | 45.4 | 35.6 | 53.7 | 444 | — | 2 787 | — |
| **Centre walk, rounds 2 + 3** | 225.7 | **30.7** | **33.3** | **33.6** | 533 | 4 | **1 335** | **33** |
| Vasilievsky drive, Oct 11 (before the islands round 2 and the metro round) | 192.3 | 34.1 | 33.3 | 50.0 | 483 | 4 | 1 388 | — |
| **Vasilievsky drive, rounds 2 + 3** | 221.1 | 43.2 | 33.3 | 83.3 | 650 | 24 | 1 020 | 23 |

The walk meets the 30 FPS target at the median and p95; the centre drive sits at the vsync step above it
(p50 33.3, mean 39.9 because of the 300–450 ms GC frames and the 50 ms frames). The Vasilievsky drive is
GC-dominated (long tasks of 200–600 ms). Load went from 279 s (metro round) to 221–232 s; it is GC-bound
(below). Region attaches stay ≤ 10 ms. `tools/metro-test.mjs`: 479 checks (two expectations updated: Sennaya
and Sadovaya are reached through real tunnels since the interchange round).

### What remains (measured, not done)

* The centre drive callback is still ~45 ms: render 21 (1 170 colour calls at 13 µs: the next lever is
  fewer near-static materials, plan item 7, and the ~150 dynamic draws of birds, cars and boats), module
  updates 19 (people 7.5, traffic 2.6, wildlife 1.7, drive 1.6, wrecks 1.6).
* **Major GC pauses of 300–560 ms, about ten per 20 s of driving**, on a 2.4 GB JavaScript heap. They land
  in whatever runs (the people loop, the render). The heap must shrink (canvas release, plan item 10; the
  lazy outline sources that keep their CPU arrays) or the allocation rate must fall; `gc-neighbours`
  names landmarksTauride paradny-courts `update`, the Smolensky forest `assign`, people `rebuildHash`, birds.
* **The load is bound by garbage collection, not by the batching code.** A profiled normal load
  (`tools/load-test.mjs --profile`, forced bake, 239 s to intro) spends **118 s in the garbage collector**,
  23 s in three.js, 10.6 s in `batch2.js` (4.1 s `buildFarProxies`, 3.1 s `mergeFarGeometries`), 8 s in
  `streets/net.js`. The JavaScript heap reads 5.4 GB at the start of batching and 6.1 GB at its end
  (`drive-bench --startup-phases`, `performance.memory`) against a 4.4 GB limit, so V8 runs near-limit
  mark-compacts throughout; static batching (92 → 196 s) is slow because it allocates into that heap. The
  metro canvases are not the cause: atlas and grouping take < 28 s together. Before batching the live heap is
  2.3 GB (`drive-bench --heap-sampling`, `shots/perf/plan/heap-sampling-top.mjs`): streets `net.js` 278 MB
  (kerb runs, grid, ways), the baked-region decoder 218 MB, `lanegraph.js` 205 MB (77 MB of bezier samples),
  people `nav.js` 124 MB, three.js objects 130 MB, physics 99 MB. The next load lever is memory: typed
  arrays for the street network and lane graph, dropping decoded region products after hydration, and
  releasing batch sources per group instead of at the upload frame.



The October 14 landmarks pushed the integrated city back into severe GC stalls.
This round starts from source `0dab60eb` and the complete, matching island bake
checkpoint `7854cc2e` / `91210ac362504b1acd73` (538 files, 448.6 MiB gzip).
The baseline is frozen with its own source and assets for the comparisons below.

The development workflow now has `npm run dev:area -- <module>`: one local server,
the production renderer, selected builders on a reference grid, automatic camera
framing, save-triggered reload with camera preservation, and a full-city link.
`tools/area-dev-test.mjs` checks initial boot, manual/save reload, retained camera,
desktop/mobile rendering and the integration link. Oldenburg dacha preview loads
in 2–4 seconds in these checks. This is an authoring measurement, not city FPS.
See [AREA-DEVELOPMENT.md](AREA-DEVELOPMENT.md); the root and project instructions
now require the scoped edit loop followed by integrated checkpoint validation.
The workflow checkpoints are `2e3f41cc` and `7e26fe76`. The latter ignores
Windows file-access notifications unless size/mtime changed, preventing a
preview from reloading itself simply because the server read a source file.

Runtime changes:

* Static batching preserves existing authored LOD anchors, radii, near/far
  switches and shadow policies. Short detail and replacement outline proxies
  keep the matching switch, preventing outlines of hidden geometry. Authored
  shells keep their range instead of being reclassified by aggregate size.
  This activates the detail budgets already authored in the new areas; it does
  not introduce an automatic mesh simplifier or shorten the skyline range.
* Batching removes completed source groups incrementally, without modifying
  shared source geometry or dynamic model templates. Finished bridge collectors
  release their JavaScript scratch arrays before their service closures persist.
* Immutable lane cross-sections with exactly equal widths share their records
  within each road. Pedestrian obstacle buckets keep ordered Uint32 IDs in one
  packed array, with O(1) cell lookup and allocation-free queries. Placement,
  collision arithmetic, route order, traffic and population are unchanged.
* Private static batch normals and bounded colours use normalized 16-bit
  attributes. Positions, UVs, indices and shared source geometry stay exact;
  HDR/custom or dynamic attributes keep floats. Deferred CPU release is retained.
  This saves 299,432,766 bytes (285.6 MiB) of colour-pass attribute buffers in the
  integrated scene. `compactstatic=0` is a diagnostic opt-out.

The first lifetime/LOD candidate loaded in 305.7 s versus the baseline 421.0 s,
but still averaged 368.6 ms per driving frame. Attribute packing alone also
failed to fix those stalls (286.2 s load, 288.5 ms mean). The later road, bridge
and obstacle-storage changes brought the diagnostic candidate to 203.4 s load
and 54.7 ms mean. These used a known-compatible old bake with `baked=force` and
are **diagnostic selection evidence only**. The final results below use the
matching shipping bake and normal loading.

The pre-batch allocation sample identified retained road/lane records, obstacle
cell arrays and bridge builder scratch buffers. The sampled initial drive also
spent 3.85 s of an 11 s post-run profile in GC. Post-drive CDP JavaScript usage
fell from about 2.77 GB in the first candidate to 2.45 GB after storage fixes;
this excludes roughly 3 GB of backing storage. `performance.memory` combines
different memory categories, so its displayed multi-GB value is not a precise
retained-object measurement. Route endpoints and streamed working sets differ.

The final bake is `e7ba7d9e6d638b1e4323`, 538 products / 448.6 MiB gzip.
`bake-manifest-check.mjs` confirms source compatibility and completeness.
`bake-product-compare.mjs` confirms 536 products are byte-for-byte identical to
the frozen baseline; decoded `city-base` and `roof` differ only in explicitly
listed build-time measurements. World geometry, field, textures, kerbs and all
three navigation tiers are unchanged. The download payload has not shrunk.

Final benchmark method: Edge / RTX 3090 Ti / D3D11, 1280×720, medium quality,
default browser heap, ordinary loading, traffic/crowds/shadows enabled, one fresh
browser per 20-second W-input run. No forced bake, preview mode, profiler or
screenshot capture during the timed interval. Diagnostics and the separate
stationary CPU profile run afterward. GPU work is serial. Assets are served
locally, so these are construction/startup measurements, not internet download
times. Each route has one before/after sample, not a statistical confidence bound.
Severe stalls change simulation progress and traffic encounters: the centre car
covered 179 m before and 480 m after (ending wrecked beside the road). These are
integrated play measurements, not identical-camera render comparisons.

| Route | Load before → after, s | Mean frame before → after, ms | P95 before → after, ms |
|---|---:|---:|---:|
| Centre drive | 421.0 → 203.7 | 261.9 → 57.1 | 917.0 → 70.9 |
| Centre walk | 356.7 → 201.6 | 179.7 → 45.4 | 866.9 → 53.7 |
| Krestovsky drive | 413.7* → 205.0 | 274.2 → 47.4 | 983.5 → 53.8 |
| Kamenny / new dachas walk | 351.2 → 202.9 | 150.0 → 30.9 | 833.5 → 36.0 |

*The baseline Krestovsky startup overlapped a small CPU test/file preparation;
do not treat its load time as a clean startup comparison. Its timed drive was
quiet. The other baseline loads and final measurements ran without CPU audits.

FPS derived from mean frame time changes from 3.8 → 17.5 (centre drive),
5.6 → 22.0 (centre walk), 3.6 → 21.1 (Krestovsky drive) and 6.7 → 32.4
(Kamenny walk). Individual maximum frames still reach 0.44–0.82 seconds;
this fixes the frequent stall regression, not every hitch. The four final runs
have no module, asset or region failures. Walkers remain grounded and unlocked.
An additional final-only Kamenny drive covers 375 m at 37.7 ms mean (26.5 FPS),
53.1 ms P95 and 664.5 ms maximum, with 1,557 mean draw calls and no failures.
Its load takes 203.1 s. There is no before-drive sample for that route; the
paired new-district comparison is the walk above.

The final centre drive's separate 10.27-second profile records 4.50 s inside the
frame callback, including 3.02 s rendering and 1.09 s module updates. Its
post-run fixed-camera render costs 25.04 ms, 2,709 calls and 15.52 M triangles.
This endpoint differs from the baseline, so use it to locate remaining work,
not to claim a fixed-camera speedup. Rendering/traversal is now the main measured
frame cost. Real geometric LOD for distant batch proxies is a next candidate;
the current proxies reduce materials/draw calls but still retain substantial
triangle detail. Preserve skyline silhouettes and validate colour, outline and
shadow passes together. Global scene construction/outline preparation also
remains expensive: the final centre run spends 77.7 s in modules, 26.3 s batching
and 75.7 s finalizing. A steady 30 FPS and fast deployed startup are **not yet
achieved** by this round.

Correctness checks completed for this round:

* `authored-lod-test`: merged/split geometry, transformed parents, short detail,
  distant replacement, large authored shells and 270 visibility switches.
* `compact-static-test`, `static-batch-upload-test`, `static-merge-test` and
  `ndproxy-lifetime-test`: private ownership, deferred release, quantization
  bounds and the unchanged ordinary-outline golden digest.
* `lane-bounds-storage-test`: 69,072 exact cross-section/interpolation checks;
  `packed-cell-index-test`: 16,958 cells / 100,005 ordered entries;
  `packed-graph-test`: the real 710,921-node / 1,215,232-edge graph and 360 routes;
  `physics-surface-test`: 5,004 exact queries.
* LOD range, shadow-sector, renderer-pass, fixture-cell, region-streamer,
  baked-codec, baked-loader and baked-mesh focused regressions pass.
* `npm run roads` passes, including furniture/ribbon checks and 997 residual
  road-surface samples against the existing limit of 2,170. `npm run markings`
  passes with the two existing residual samples (median-double and pocket).
* The normal-loader `drive-test --nofuzz` passes first-press entry, acceleration,
  nitro, camera changes, braking, unlocked exit and the Anichkov Bridge crossing.
  Prompt, cockpit and post-exit screenshots were inspected. This run omits the
  optional random driving fuzz; exact road/nav/physics tests above cover the
  changed storage paths.
* `islands-check --new-areas` passes using the normal final bake: 251 bridge
  support samples, six pond-bed checks, 32 stadium-plinth samples, destination
  preloads, island car acceleration/braking/exit and the presence of the new
  landmark services. All 23 captured views were inspected, including Erarta,
  the centre/Spit, both Krestovsky camera directions, the stadium roof, Oldenburg
  dacha and river turn, Yelagin service buildings, LETI and the TV tower.
  No module or asset failures. Texture-key and ANGLE shader compiler warnings
  appear in the screenshot tool's console log.

Reproduce from the project directory (run GPU commands serially):

```powershell
npm run dev:area -- landmarksKamennyDachasEast
node tools/area-dev-test.mjs
node tools/bake-manifest-check.mjs
node tools/bake-product-compare.mjs "C:/path/to/frozen-baseline/assets/baked"
node tools/drive-bench.mjs --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --load-timeout 900000 --protocol-timeout 900000 --out shots/perf-oct15/after-centre
node tools/drive-test.mjs --q medium --nofuzz --load-timeout 900000 --protocol-timeout 900000 --out shots/perf-oct15/final-controls
node tools/islands-check.mjs --new-areas --out shots/perf-oct15/final-islands
```

For centre walking add `--walk` and use a distinct output prefix. Krestovsky's
drive start is `-5546.025565,-4007.441464,-81.436784`; Kamenny's walk/drive start is
`-2920,-5201.34,107.988676` on 1-я Берёзовая аллея alongside the new dacha district.
Keep all other options identical. The baseline was run from a frozen copy of
its own source/assets, not by forcing that bake into the new runtime. Raw JSON,
post-run profiles, audit logs and screenshots are local ignored artifacts under
`shots/perf-oct15/`; the table above is the committed comparison.


## 2026-10-13 physical wrecks and breakaway panels (scoped yard)

The collision yard now uses the production Rapier wreck/debris bridge. Healthy
traffic stays on the instanced lane path. Limits are 24 active car bodies,
48 debris bodies (18-second lifetime), 512 nearby scenery proxies and the existing
24-entry damaged-mesh cache. Car response is planar translation/yaw with terrain
height; debris uses full 3D gravity and angular motion. Rapier 0.21.0 is pinned and
vendored as its 4.34 MB ESM/embedded-WASM bundle for static deployment.

`node tools/wreck-physics-test.mjs` verifies impulse/mass response, yaw torque,
moving collision proxies, thin-wall CCD, chain collisions, lane-AI handoff,
retired-vehicle cleanup, debris landing/expiry/caps and reset. Its CPU-only
24-car settling yard measured 0.226 ms mean / 0.452 ms p95 over 240 60 Hz steps
(scenery proxies reach zero after bodies settle). This is not a worst-case active
pileup or an integrated city FPS measurement. Concurrent work remains a timing
limitation. GPU yard tests additionally verify visible missing panels, physical
displacement/spin, airborne debris, exact repair and desktop/mobile input/HUD.

Full `npm run roads` passes its existing tolerances (992 residual surface samples,
6 ribbon wall segments, 848 ribbon surface triangles). The main bootstrap smoke
test produced damage 0.926 and 7 debris bodies, repaired successfully and reported
no module errors. The checkpoint also passes without concurrent cockpit edits.

Main driving and traffic modules use the same bridge. Final combined-source bake
and normal-loading city performance remain the concurrent-region shipping handoff.

## 2026-10-13 driving collision and damage feature (scoped validation)

At the user's request, collision/damage work was tested in a small yard while
another agent extended regions. No full-city FPS claim or new shipping bake is
made by this checkpoint. See [DRIVING-COLLISIONS.md](DRIVING-COLLISIONS.md) for
controls, reproducible tests, integration scope and the final bake handoff.

The rigid footprint solver performs one spatial query per substep instead of
querying/resolving seven circles repeatedly. A CPU-only synthetic comparison
(`node tools/drive-collision-bench.mjs --baseline-ref d7227f45^`) uses 50,421
static colliders, including 50,000 distant objects, and 7,200 measured handling
frames with repeated 48 m/s wall impacts. Mean handling cost was 0.0357 ms before
and 0.0141 ms after; maximum batch means were 0.0407 and 0.0170 ms. This excludes
rendering, real city terrain queries, traffic updates and damage mesh uploads;
it is not integrated driving FPS. Concurrent region tasks also preclude treating
these single-run timings as a controlled machine-wide performance comparison.

Damage changes private dynamic geometry only on impact/repair. The revised player
shell has 5,886 body triangles (including closed inner wells) without adding mesh
draw calls; smoke reuses the existing capped particle pool. Struck fleet cars now
use a bounded 24-entry private geometry cache: a normal sedan adds three mesh
layers; liveried vehicles also clone their applicable livery layers. The yard's
two struck sedans use six layers total. Healthy fleet instances remain shared;
cache tests verify unchanged originals, disposal and damage-preserving recreation.
This is a draw/geometry budget, not a full-city FPS measurement.
CPU regressions and desktop/mobile GPU yard tests pass. The actual main bootstrap
also passes entry, collision, damage and repair with only `drive` loaded. Final
normal-loading city/region performance and the source-matching shipping bake must
be verified after the region work settles.

## 2026-10-13 compact navigation, builder lifetime and fixture cells

This pass keeps the complete island-expanded scene from `fe971ec0`. It targets
allocation/GC during startup and unnecessary per-frame submission work. The
baseline has 648,508 navigation nodes and 1,106,890 edges at medium quality.
A separate startup CPU profile attributed 162.5 s to garbage collection;
this instrumented diagnostic is not a loading-time benchmark.

* Navigation retains numeric edge columns and ordered CSR adjacency instead of
  creating an object per edge and a small array per node. A* reads the packed
  columns directly and reuses its heap arrays. Appended access/station edges
  preserve order and copy baked columns before growth. The decoded navigation
  cache is released after hydration.
* Ground geometry scratch arrays now live outside the persistent shader
  closure, and railway builders release their flushed scratch buffers.
* LOD diagnostic counts are computed on demand. Hidden outline-sector parents
  reject their proxies without visiting each one; range, zone and shadow
  decisions remain equivalent to the previous registry.
* A conservative post-split pass combines small immutable fixture pieces in
  matching 192 m cells, materials, zones and exact authored distance ranges.
  It preserves world triangles, normals, colours, UVs and conservative bounds.
  Dynamic, reflected, transparent and custom-shader objects retain their path.
  The chosen pass expands 508,614 vertices (20.1 MiB) and combines 3,386 source
  draws into 1,253 meshes city-wide. This is not the number of draws saved in
  any particular camera view. `?fixturecells=0` disables it for diagnostics.

A broader experiment expanded 4.38 M vertices / 174.1 MiB and combined 9,540
sources into 2,324 meshes. It added loading/memory cost without a useful
centre-driving improvement, so it was rejected. Compatible-old-bake candidate
runs were used only to choose the implementation; final evidence below uses
normal loading with the completed shipping bake.

Final shipping bake **84852ddeb471ec850927** includes all three quality tiers:
514 products, 430.0 MiB gzip. Source, generated revision and manifest agree.
Against the baseline, 512 compressed products are byte-identical; `city-base`
differs only in seven build timing fields and `roof` only in `ms`. Navigation,
geometry, textures and field data are preserved.

The following single samples use serial Edge / RTX 3090 Ti / D3D11, medium
1280 x 720, 20 seconds of W input, the complete scene and default browser heap.
Both builds use normal matching-bake loading, traffic, crowds and shadows.
No profiler, startup instrumentation or mid-run screenshot runs during timing.
Before is frozen `fe971ec0` / bake `ac5d0c4c385cc03c3e34` (October 12);
after is the final shipping build (October 13).

| Route / build | Load s | Mean / p50 / p95 / max ms | Frames >80 ms | Calls | Distance m | Heap MiB |
|---|---:|---|---:|---:|---:|---:|
| Centre drive before | 290.6 | 67.4 / 66.6 / 83.4 / 966.8 | 23 | 2697 | 489.1 | 5583 |
| Centre drive after | 193.4 | 55.1 / 50.0 / 66.8 / 866.7 | 13 | 2675 | 339.3 | 5358 |
| Centre walk before | 302.0 | 57.4 / 50.0 / 66.8 / 583.4 | 14 | 2740 | 62.2 | 5574 |
| Centre walk after | 190.3 | 47.2 / 50.0 / 66.6 / 850.1 | 3 | 2718 | 68.3 | 5307 |
| Vasilievsky drive before | 284.9 | 72.0 / 50.0 / 116.8 / 1016.9 | 23 | 1397 | 210.6 | 5682 |
| Vasilievsky drive after | 192.3 | 34.1 / 33.3 / 50.0 / 483.4 | 4 | 1388 | 210.6 | 5421 |
| Krestovsky drive before | 308.8* | 52.2 / 50.0 / 83.2 / 999.9 | 22 | 2146 | 275.1 | 5544 |
| Krestovsky drive after | 191.9 | 41.1 / 33.4 / 50.1 / 83.3 | 2 | 2152 | 228.7 | 5286 |
| Krestovsky park walk before | 296.7 | 23.2 / 16.7 / 33.4 / 483.3 | 6 | 778 | 66.9 | 5560 |
| Krestovsky park walk after | 193.0 | 21.4 / 16.7 / 33.4 / 566.7 | 3 | 787 | 69.7 | 5315 |

Traffic changes trajectories: the centre baseline deviates onto the pavement,
whereas the final run stops in traffic at (169,52). Krestovsky ends at different
distances/speeds (before 10 km/h, after 45 km/h). Vasilievsky reaches the same
endpoint and distance in both samples. Walking distance also depends on frame
advancement. These are route observations, not exact percentage FPS claims.
*The first ~90 seconds of the Krestovsky baseline startup overlapped a CPU
test; its timed drive was quiet. Exclude that load figure from startup claims.
Centre baseline fonts used browser transport; later samples use a Node cache
of the same requested Google font bytes (centre fonts 1.305 s before, 0.013 s
after). Local scene assets still use the normal browser loader. An initial
after-centre sample overlapped `git diff` during startup and was excluded as
`diagnostic-centre-overlap.*`; the table uses its quiet repeat.

Centre loading fell from about 291 to 193 seconds, with observed heaps lower
by 225-267 MiB across routes. **The city-wide 30 FPS target is not met:** final
centre driving/walking average 18.1/21.2 FPS, Vasilievsky driving 29.4 FPS,
Krestovsky driving 24.3 FPS and park walking 46.8 FPS. Hitches are fewer, but
long pauses remain; both walking routes have worse single maximum pauses.

The clean centre startup reports modules 77.85 s, batch 43.70 s, finalize
51.65 s, compile 1.64 s, simulation 8.51 s, first frame 4.78 s and upload
2.93 s. Baseline batch/finalize were 88.86/93.64 s. Fixture conversion takes
242 ms. The post-drive fixed-render diagnostic is 27.59 ms, 2,695 calls and
15.09 M triangles. A separate stationary CPU profile, started only after the
timed drive and JSON output (`after-centre-drive.post.cpuprofile`), samples
10.144 s: frame-inclusive 4.605 s, renderer 3.244 s, updates 0.960 s, LOD
0.236 s and GC 0.040 s. Renderer traversal/submission is roughly 70% of
sampled active frame work and remains the next major target; static batching
and outline construction still dominate startup. This profile does not
establish the cause of the earlier 867 ms driving pause.

Final normal-loading car checks pass entry, acceleration, nitro, camera
switching, braking input, bridge height and exit back to walking. Island
integration passes five destination preloads, 251 bridge-floor samples, six
pond samples, 32 stadium-plinth samples, 94 m of acceleration, braking to
1 km/h and exit. All final routes/integration report zero page, module,
asset or region failures. The full 17-view sweep plus destination checks
loads 165/499 regions (22 initially); bounded streaming regressions pass.
Screenshot inspection covers all five new destinations, elevated stadium,
reverse park view, bridge, Erarta facade, Moscow Station, old Spit skyline,
timed route endpoints and car prompt/cockpit/exit. No missing landmark or
material was observed. ANGLE's existing `f_clsFiltered` / `f_distFiltered` /
`f_distTexel` shader warnings also occur in the previous island review logs.

Validation includes exact full-graph adjacency and 360 route comparisons,
generator growth/tied alternatives/no-cross routing, fixture world geometry
and bounds, randomized LOD equivalence, shadows, renderer passes, the original
outline geometry golden, static fixtures, baked codec/loader/mesh hydration,
region streaming and crosswalk queries. Roads pass with zero strict furniture,
median, lot or tram violations, the same four legacy allowances and 992
surface residuals (limit 2,170). Markings pass at 172,685/172,687 solid samples;
the two residuals match the baseline.

Reproduce the five timed routes serially, substituting the start below and
adding `--walk` for walking:

```sh
node tools/drive-bench.mjs --q medium --seconds 20 --load-timeout 900000 --protocol-timeout 900000 --json --diagnostics --start "x,z,yaw" --out shots/perf-next/repeat-NAME
```

| Route | Start x,z,yaw |
|---|---|
| Centre drive / walk | 498.2286,135.1625,76.0322 |
| Vasilievsky drive | -3985.131825,-1247.700307,120.170520 |
| Krestovsky drive | -5546.025565,-4007.441464,-81.436784 |
| Krestovsky park walk | -6441.8,-4456.8,85 |

`tools/drive-test.mjs --q medium --nofuzz --load-timeout 900000` exercises car
input; `tools/islands-check.mjs --out shots/perf-next/repeat-islands` repeats
normal-loading destination, skyline, physical and car checks.
`tools/bake-manifest-check.mjs` checks source/manifest/product agreement.
Artifacts from this pass are `shots/perf-next/before-{centre-drive,centre-walk,
vo-drive,krest-drive,krest-walk}.*`, corresponding `after-*` files,
`final-controls*`, `final-islands*`, `bake-final.log` and focused check logs.
Older files with other prefixes in that directory are not this comparison.


## 2026-10-12 island completion and Krestovsky start

Vasilievsky's verified remaining Erarta/Kirov Palace details and three
Petrogradsky sights are authored; Krestovsky now has its complete mapped
island frame, stadium, eastern metro exterior and park entry details.
See [ISLANDS-2026.md](ISLANDS-2026.md) and the
[island coverage map](../coverage.html#islands). The map draws exact complete
coastlines separately from coverage rectangles and authored sight markers.
There are 57 regions, 81.6360 km² playable union (+8.1445), 27,659 building/part
records (+701) and 75,361 road/path pieces (+2,750). All established IDs and
road pieces remain; 33 formerly clipped edge buildings gain complete geometry.

Final shipping bake **ac5d0c4c385cc03c3e34**, all three quality tiers:
514 files, 430.0 MiB gzip. Source hash, generated revision, manifest and file
sizes agree. New Petrogradsky/Krestovsky sights add no frame callbacks and
retain engine static batching, bounded 192 m instance cells, region loading
and conservative skyline/tree bounds. Their module budgets are respectively
97,582 triangles/17 materials and 44,720 triangles/14 materials. Singleton
stadium geometry uses static meshes; repeated fixtures retain instancing.

Final normal-loading review inspected 17 integrated views: all five new
destinations, stadium roof and park context, reverse turns, two bridges,
Erarta, three car-eye roads, Moscow Station and the old Spit skyline. Review
corrected the pavilion glass/frieze intersection, Sytny's recessed upper
arch closure, Erarta's disc/pedestal gap and the stadium's walking floor.
The plinth has 192 bounded immutable supports inside its actual polygon and
outside the glass; 1,920 diagnostic floor probes match the rendered 1.15 m
top. They add no geometry, material or frame work.

Final full-scene physical integration passes five destination preloads,
251 bridge-floor samples, six mapped park pond samples, 32 stadium-plinth
samples and Vasilievsky car acceleration (94 m), braking to 1 km/h and exit
with walking restored. It reports zero module/asset/region failures and
114 loaded regions out of 499 after the teleports (19 initially).
Geographic tests sample 3,050 coast positions and 2,987 dry interiors, and
verify all six park ponds, building claims and eastern-island HUD naming.
Loader/codec, streamed hydration, field storage, dynamic/tree bounds, LOD,
shadows, quay fallback, driving input and future horizon safety fixtures pass.
Roads pass with zero strict furniture/median/lot/tram violations and four
documented legacy allowances; 992 surface residuals remain below 2,170.
Markings pass at 172,685/172,687 solid samples (100.0% rounded).
The regenerated map passes offline desktop/mobile, keyboard and layer checks.

Controlled timings below use serial Edge/RTX 3090 Ti/D3D11, medium 1280×720,
20 seconds W input, the full scene with traffic, crowds and shadows, default
browser heap and normal loading. Before uses immutable `99c3f2c2` with bake
`c6e1162de1c2d850ebb4`; after uses the final matching bake. No profiling,
startup instrumentation, reduced modules, forced stale bake or mid-run shots.
These are single samples with a deliberate data expansion, not an exact
percentage performance claim. Earlier source-only attempts and preliminary
baseline samples are diagnostics and excluded from the table.

Hitch counts are frames above 80 ms; mean/p50/p95/max are frame milliseconds.
Both centre drives stop at the same traffic junction; the VO endpoints and
distance are identical. Walking covers different distances because movement
advances with rendered frames. Krestovsky driving ends on its road in traffic;
its initial 450 m lane footprint was checked on asphalt (minimum 0.85 m edge
clearance). All timed runs report zero module/asset/region errors.

| Run | Load s | Mean / p50 / p95 / max ms | >80 ms | Calls | Distance m | Heap MiB |
|---|---:|---|---:|---:|---:|---:|
| Before centre drive | 201.0 | 65.1 / 66.6 / 83.6 / 500.1 | 46 | 2620 | 340.04 | 5364 |
| After centre drive | 298.5 | 70.3 / 66.6 / 83.5 / 1000.0 | 32 | 2700 | 339.34 | 5595 |
| Before centre walk | 235.0 | 76.0 / 66.7 / 100.0 / 566.5 | 79 | 2658 | 47.83 | 5302 |
| After centre walk | 298.5 | 60.9 / 50.0 / 83.3 / 550.0 | 17 | 2741 | 59.64 | 5563 |
| Before Vasilievsky drive | 205.8 | 36.6 / 33.3 / 50.0 / 666.7 | 3 | 1408 | 210.62 | 5460 |
| After Vasilievsky drive | 304.7 | 68.0 / 33.4 / 266.6 / 1033.4 | 17 | 1415 | 210.62 | 5686 |
| Krestovsky drive | 294.6 | 52.3 / 50.0 / 66.7 / 1033.4 | 11 | 2150 | 275.22 | 5533 |
| Krestovsky park walk | 300.0 | 24.5 / 16.7 / 33.4 / 600.1 | 5 | 793 | 66.18 | 5566 |

**The city-wide 30 FPS target remains unmet.** Final centre driving averages
14.2 FPS, centre walking 16.4, VO driving 14.7 and Krestovsky driving 19.1.
The park walk averages 40.9 FPS, but hitches remain there too. VO has a
substantial hitch regression in this sample despite nearly unchanged draw
calls; its 33.4 ms median does not make the 68.0 ms mean acceptable. Do not
interpret the noisier baseline walk's apparent improvement as a speedup.
These contemporary baseline samples are slower than the previous pass's
samples, so comparisons to that older table are not controlled evidence.

Startup also regresses: in the matched centre-drive sample, batch work rises
from 48.8 to 94.3 s and finalization from 55.9 to 97.0 s. The measured final
fixed render consumes 30.45 ms with 2,738 calls and 15.09 M triangles, versus
29.96 ms, 2,648 calls and 12.85 M before. Future performance work should target
static processing during startup and renderer/LOD submission, and separately
profile the VO hitch regression. The cause of those VO hitches is not proven
by this unprofiled run. No scene detail or simulation was removed to improve
these results.

Three additional final normal-loading views verify the clear Erarta side
facade, an elevated reverse turn over the park toward the old city and the
pavilion arcade/glass/steps. Pavilion lettering remains visually subtle and
would benefit from a future atlas/proportion refinement. A separate six-view
depth audit of the new/changed sights passes: 0.000–0.003% noisy pixels, zero
identical-frame differences and no listed offenders, below the 0.02% target.
That reduced-module audit is geometry QA, not integrated FPS evidence.

Artifacts are in `shots/islands-2026/`: `before-clean-*.json`, `after-*.json`,
`final-views_0..16.png`, `final-extra_0..2.png`, `final-checks-integration.json`,
`zfight.log`, road/marking logs,
`bake-shipping.log` and desktop/mobile coverage screenshots. Repeat the
controlled runs with `node tools/islands-bench.mjs` (`--baseline` uses the
immutable baseline worktree; override its location with `--baseline-root`).
`node tools/islands-check.mjs` repeats the final full-scene visual and physical
checks; `--checks-only` omits the 17-view sweep. `node tools/islands-data-test.mjs`,
`node tools/coverage-check.mjs` and `node tools/bake-manifest-check.mjs` repeat
geography, offline atlas and matching shipping-product checks.

## 2026-10-11/12 southern extension and horizon-wall fix

The city now covers the missing centre through Obvodny and the Moskovsky corridor
through Moskovskaya, including Victory Park: 53 regions, 73.4915 km² playable
union (+21.4569), and 26,958 building/part records (+8,463). Three specialists
authored the central, Moskovsky and park landmarks. See [SOUTH-EXTENSION.md](SOUTH-EXTENSION.md)
and the offline [coverage map](../coverage.html).

Final shipping bake **c6e1162de1c2d850ebb4**: all three quality tiers, 463 files,
414.3 MiB gzip. Source hash, generated revision, manifest and file sizes match.
This includes the independent Palace-approach fix from checkpoint `41dcdabf`.

Quiet, serial Edge/RTX 3090 Ti/D3D11, 1280×720, medium, 20 seconds W input,
full scene with traffic/crowds/shadows. Both baselines use normal old bake
`9abc1cd62311e43e55bb`; after runs use normal final bake, default browser heap,
no profiling, startup instrumentation, forced bake or mid-run screenshots.
The data expansion is deliberate; these are single samples, not an exact FPS
percentage claim. Centre starts are identical. Traffic stops the final drive
at the same junction. Hitch counts are
frames above 80 ms; mean/p50/p95/max are frame milliseconds.

| Run | Load s | Mean / p50 / p95 / max ms | >80 ms | Calls | Distance m | Heap MiB |
|---|---:|---|---:|---:|---:|---:|
| Before centre drive | 71.9 | 39.4 / 33.4 / 50.1 / 66.8 | 0 | 2332 | 339.34 | 5022 |
| After centre drive | 186.0 | 49.4 / 50.0 / 66.7 / 583.3 | 5 | 2620 | 339.31 | 5366 |
| Before centre walk | 72.3 | 36.7 / 33.4 / 50.0 / 66.7 | 0 | 2373 | 72.42 | 4977 |
| After centre walk | 185.2 | 43.7 / 49.9 / 50.1 / 433.4 | 4 | 2649 | 69.18 | 5333 |
| Moskovsky drive | 178.7 | 29.9 / 33.3 / 33.4 / 50.1 | 0 | 1466 | 205.09 | 5404 |
| Victory Park walk | 187.2 | 22.2 / 16.7 / 33.4 / 349.9 | 3 | 1069 | 70.09 | 5392 |

**The city-wide 30 FPS target is not reached:** centre averages 20.3 FPS driving
and 22.9 FPS walking. The verified Moskovsky run averages 33.5 FPS; park walking averages
45.0 FPS. Startup remains long, and occasional hitches remain. The next measured
cost is rendering/submission and static LOD traversal: the final centre fixed
render takes 23.9 ms versus 20.5 ms before, with 2654 versus 2366 calls and
12.99 versus 12.16 M triangles. A labelled compatible-data CPU diagnostic also
identified renderer submission and LOD traversal as major costs; it is not
final FPS evidence. Future work should reduce these costs while keeping the
full skyline, crowds, shadows and authored detail. The first Moskovsky sample
deflected onto grass and is excluded (`off-route-moskovsky-drive.*`). The final
start's complete 500 m SPEC footprint was verified on asphalt (minimum 3.75 m
edge clearance), and its actual endpoint remains on the road, moving in traffic.

The enlarged raw terrain previously exceeded Chromium's single-buffer limit
and generated severe GC pauses. Six separately loaded planes, a bounded city
collector and streamed one-clone static merging preserve exact geometry and
raw bake compatibility. Lossless 1 m class palette storage saves 525 MiB CPU
and GPU; private uniform/mixed masks save 556 MiB CPU; the shared ground/water
distance atlas saves 394 MiB CPU and GPU. One immutable neighbour-edge cache
replaces ten copies (577 MiB measured saving). Outline bins and replaced LOD
references release promptly. Private static batch output now releases after
GPU upload, preserving shared sources, dynamic templates, bounds and counts;
the final runs report 939–1045 MiB total released buffers including proxies.
Full-byte, query, exact geometry, upload lifetime, codec/worker and culling
fixtures pass. No detail, physics, traffic or shadows were disabled to obtain
the final measurements.

The green wall at `-1783.8,22.3,4324,377.8,-25.4` was the 4.7 km far-scenery
curtain, whose protection considered only P/V regions. Coverage-based placement
and a geometry-derived search limit move it 3,179 m from that pose; all emitted
chords after jitter stay at least 2,007 m outside the complete extents. The
regression includes a future distant district and checks enclosure, chords,
corners and wraparound. Final normal-bake screenshots in both directions and
at street level confirm removal. Institute ownership/viewpoint and the park's
two mapped roof relations were corrected during integrated visual review.

Normal integration passes 23 rendered views, 985 southern bridge floor samples,
16 valid pond-interior samples, eight destination preloads, and a 261 m Obvodny
car crossing followed by braking/exit/input restoration. It reports 718 culled
ground chunks, 28 park monuments, eight Moskovskaya surface entrances and zero
module/asset/region failures. All 56 saved viewpoints pass physical and streaming
checks. Car controls pass first-E entry, acceleration, nitro, camera changes,
braking, exit and Anichkov support (random fuzz skipped); all nine control frames
were inspected. Source and final-bake screenshots were inspected,
including old centre/VO, distant turns, bridges, park context and arena.
Full roads and markings pass: zero strict furniture/median/tram failures,
four documented legacy allowances, 981 surface residuals under 2170, and
160,086/160,088 marking samples (100.0% rounded) covered.

Final `node tools/baked-check.mjs medium` passes exact source/baked comparison
for 629,222 navigation nodes, 1,100,357 edges, 20 routes and 1,000 whole-box
terrain samples; all 448 regions hydrate with zero failures. This explicit QA
uses a 12 GiB heap and extended timeout because it constructs additional source
graphs/rasters. It is separate from the unchanged default-heap timed runs above.
The regenerated coverage HTML passes offline desktop/mobile interactions.

Artifacts: `shots/south-extension/{before-clean-centre-*,after-*,integration.json,
final-views_0..22.png,final-contact-*.jpg,roads-final-shipping3.log,
markings-final-shipping3.log,bake-final3.log}`. Earlier forced/profiled/source-only
runs in that directory are explicitly diagnostics and are excluded above.

Reproduce the four timed runs with `node tools/drive-bench.mjs --q medium
--seconds 20 --json --diagnostics --out <path>` and these starts:
centre `498.2286,135.1625,76.0322` (drive and `--walk`),
Moskovsky `-1671.2309,8400,1.595`, park
`-1600,7071.654359673,-88.322197369 --walk` (pass the three coordinates as the
`--start` value). `node tools/south-extension-check.mjs` repeats normal visual
and physical integration; `node tools/far-coverage-test.mjs` repeats wall safety.

## 2026-10-11 fix: invisible bridge fallback barriers

The supplied pose `-2252.1,2.4,-762.9,385.7,0` is on Palace Passage.
A legacy Palace Bridge fallback added a 261 m invisible parapet along its approach,
although the detailed bridge already registered its own floor and railings. The
quay generator previously skipped only the Trinity Bridge's owned fallback.
It now honours `zone.own` for every crossing when the bridges module is built.
Unowned/environment-only crossings retain their fallback floor and barriers.
There are no new meshes, materials, frame callbacks, LOD or streaming changes.

`node tools/quay-fallback-test.mjs` checks all 53 owned crossings with explicit
and default module lists, the reported driving approach, the real Palace deck's
raised support and solid railing, and safety barriers without a built bridge owner.
The deterministic 2.8 s approach improves from 6.33 m/one hit to **51.68 m/zero hits**.
The 62 physics checks, bridge module check, codec, worker loader, baked-mesh and
region-streamer regressions pass. Roads and markings pass; the road audit retains
11 allowed furniture rows and 844 residual surface samples under the existing
2,170 threshold. The isolated checkout repeats all three road gates successfully.

Integrated full-city Edge/D3D11 checks at 1280 x 720, medium quality, with traffic,
crowds and shadows retained: the normal pre-change six-second drive stops after
**6.71 m**, while the same source-fixed approach covers
**94.37 m** and ends at 71 km/h. The latter is a
controlled collision diagnostic using `baked=force` with the compatible prior
`9abc1cd62311e43e55bb` geometry/navigation; the new runtime quay colliders are built
from source. It is not final shipping-bake or clean performance evidence.

Recorded workload details (mean/p50/p95 are frame times):

* Normal centre baseline, 20 s: 78.66 s intro; 40.00 / 33.4 / 50.1 ms mean/p50/p95; 66.9 ms max; 0 frames >80 ms; 2319 calls; 339.60 m displacement; 5306 MiB heap.
* Normal reported baseline, 6 s: 88.06 s intro; 29.15 / 33.3 / 50.0 ms mean/p50/p95; 116.7 ms max; 2 frames >80 ms; 1289 calls; 6.71 m displacement; 5003 MiB heap.
* Source-fixed reported diagnostic, 6 s: 88.10 s intro; 42.65 / 33.4 / 66.8 ms mean/p50/p95; 133.4 ms max; 6 frames >80 ms; 1283 calls; 94.37 m displacement; 4991 MiB heap.

The last diagnostic overlaps CPU audits and has a different moving route from the
previously stuck car, so its frame times do not establish a performance change.
The centre baseline still averages 25.0 FPS, below the 30 FPS target.
The control harness passes first-E entry, acceleration, nitro, camera changes,
braking, exit/input release and the physical Anichkov crossing (random fuzz skipped).
A real six-second walk through the former obstruction covers 18.50 m,
grounded at 0 m; chase eyes are 2.38 m above the flat road and 3.88 m over Anichkov's
1.53 m deck. All 13 control/road screenshots were inspected; no module errors,
baked failures or failed regions were reported. City geometry and road furniture remain visible.

The user explicitly deferred the final bake to the concurrent city-editing session.
Our bake attempts were stopped, unpublished products removed, and the previous
complete manifest/revision retained. That session must bake the combined source
before final normal-loading/performance validation. No generated assets are part
of this source-fix checkpoint.

Reproduction: `node tools/drive-bench.mjs --q medium --seconds 6 --start "-2252.1,-762.9,385.7" --params "baked=force" --json --out shots/invisible-road/after-reported-compatible-data`.
Artifacts: `shots/invisible-road/{before-centre,before-reported,after-reported-compatible-data,controls}.json`,
`contact-controls.jpg`, `contact-road.jpg`, `roads.log` and `markings.log`.

## 2026-10-11 follow-up: supported cables and marked dining locations

This refines checkpoint `b885ea8e` / bake `600b5ba52e3b6ec9ad80`. The five
user-supplied before views are recorded in `shots/sevkabel-refinement/before_0..4`.
The preceding final integrated measurements below are the before baseline: same
complete city, Edge/RTX 3090 Ti/D3D11, 1280 × 720, medium, 20 s W input and the same
centre/Kozhevennaya/alley start coordinates. They are single samples, with their
documented traffic and heap limits; no precise FPS percentage is implied.

The floating cable endpoint is replaced by a shared actual-edge attachment plan,
inset from corners, with wall brackets and eyelets. A relocated spool tower and
its cables use the same placement list. Two added trailers show trdelnik roasting
spits and a coffee/churros counter. Four new dining fronts share their window
cutouts and terrace frames with the building generator. Their enclosed alcoves
use inward-facing backs/ceilings, with bars, lamps, shelves and artwork; covered
terraces have twelve tables, seated guests, planters, menus and open aisles.

New content stays immutable and statically batched. Total venue content is about
193k triangles, 102 materials, unchanged 4.57 M canvas pixels, **zero venue update
callbacks**, five trailers, seven dining fronts and 331 bounded/culled bulb
instances. Only one shared glass material is added; new signs reuse unused atlas
slots, preserving the fair's artwork. Spatial cells, authored detail ranges,
streaming and skyline policy are unchanged.

The full-environment walking/raycast audit passes underlying façade support under
all six cable anchors (excluding the brackets from the rays), inward-visible
enclosing backs behind four dining windows, all four terrace aisles at 0.14 m,
and the existing doors/alley/quay/landmark paths. Source module checks pass with
city, retaining the old city budget warning. Four source depth probes total
**eight noisy pixels**, each rounding to 0.000%, with no listed offenders. Actual
screenshots were inspected and the initial outward-facing alcove walls were
corrected before shipping. Roads, markings, codec, loader, baked-mesh and
region-streamer regressions pass with the existing diagnostics/allowances.

Shipping bake **`9abc1cd62311e43e55bb`** completed high/medium/low and atomically
published **329 products / 294.994 MiB gzip**. Source hash, static revision,
manifest and every recorded gzip file size match. Source was frozen for the final
runs. Same complete scene/browser/GPU/viewport/medium quality, 20 s W, serial runs,
no profiler, mid-run screenshot, forced bake or disabled crowds/traffic/shadows:

| follow-up route | intro | mean / p50 / p95 | max | >80 ms | calls | displacement | heap |
|---|---:|---:|---:|---:|---:|---:|---:|
| centre drive | 83.10 s | 46.73 / 50.0 / 66.7 ms | 116.6 ms | 5 | 2,326 | 339.60 m | 5,017 MiB |
| Kozhevennaya drive | 83.53 s | 39.25 / 33.4 / 50.1 ms | 100.0 ms | 1 | 1,901 | 124.45 m | 4,974 MiB |
| centre walk | 83.41 s | 43.20 / 49.9 / 50.1 ms | 100.1 ms | 1 | 2,346 | 71.83 m | 4,985 MiB |
| existing alley walk | 83.76 s | 28.84 / 33.3 / 33.4 ms | 66.6 ms | 0 | 1,367 | 72.41 m | 4,963 MiB |
| new trailers/cafés frontage walk | 83.25 s | 28.90 / 33.3 / 33.4 ms | 83.4 ms | 1 | 1,425 | 72.41 m | 4,963 MiB |

All five runs have zero baked failures, failed regions and module/page errors;
walking is grounded, active and without flight/input lock. The extra frontage
route starts at `-6205.8353,849.3225,-127.0016144` with `--walk`, traversing the
western alley past the newly added trailers and brick cafés. It has no same-route
before sample and is not used to claim a speedup. The existing alley route begins
farther east, so both views are measured.

Centre driving/walking means remain comparable to the preceding checkpoint's
53.57/46.59 ms. There is no established performance improvement: centre traffic,
pedestrian encounters, startup scheduling and heap snapshots vary. Kozhevennaya
now stops against the roadside building after 124.45 m rather than travelling
700.65 m, so those drive FPS/heap snapshots are not a clean A/B. Both walks at
Sevkabel average about **34.6–34.7 FPS**. Centre driving/walking and Kozhevennaya
driving still miss 30 FPS (about 21.4 / 23.1 / 25.5 respectively). The existing
distant-geometry and city-wide pedestrian simulation bottlenecks remain; this is
a content/fix checkpoint, not completion of the comfortable-driving target.

Artifacts: `shots/sevkabel-refinement/{centre-drive,sevkabel-drive,centre-walk,
sevkabel-walk,frontage-walk}.json` and corresponding `_end.png` files. Inspected
end views preserve city façades, roads, signage, traffic, shadows, trees and
nearby landmark context. Normal-bake visual/control checks are recorded below.

The extended `sevkabel-culture-test` passes in the normal full page: all three
hall entrances, 136.5 m of main aisle, E/programme/Escape input restoration,
indoor/outdoor lighting transitions and entry through every terrace's open centre
aisle. The two large terraces have four tables each, and the brick cafés two each;
all settle at **0.14 m, grounded**. It confirms both requested dessert trailers,
five trailers overall, seven dining fronts, 331 bulbs and zero failed regions.
`drive-test --q medium --nofuzz` passes entry, acceleration/nitro, camera/drift,
braking, exit with input lock zero and the physical Anichkov deck crossing. Random
fuzz is excluded.

Inspected normal-bake `final-views_0..6` from the five supplied cameras and wider
trailer/restaurant views: the former floating endpoint is visibly wall-mounted,
both new trailers/roasting equipment are present, glazing shows enclosed café
alcoves, terraces have roofs/seating/planters and the original industrial context
remains. Final full-scene baked depth probes assert `ctx.baked` and pass all four
views: **10 noisy pixels total**, each rounding to 0.000%, zero identical-frame
difference and no listed offenders. The depth harness's expected missing
`/__baked_revision` endpoint logs a 404; it uses the matching static revision.
Normal-loading/control harnesses provide that endpoint and have no relevant
asset/module/page errors. Existing texture-key/Canvas2D notices remain.

## 2026-10-11 pass: Sevkabel cultural detail and enterable fair

Scope and reproducible routes: [SEVKABEL-CULTURE.md](SEVKABEL-CULTURE.md). The
main hall now contains a 24-stall ground-floor fair with three real doors,
industrial structure, a workshop/gallery and indoor lighting. The yard adds three
food trailers, five dining fronts, terraces, public art, stage equipment and 300
festoon bulbs. The unchanged city, skyline, traffic, crowds, shadows and quality
settings remain in the integrated runs.

The additions use shared textures/materials, immutable static batching and bulbs
instanced in 48 m cells with aggregate bounds, frustum culling and a 200 m authored
detail range. There are **zero new venue update callbacks**; posed vendors/visitors
are static scenery. One indoor zone uses the engine's existing lookup and lighting
transition. No global crowd scheduling, loader, cache or streaming policy changed.

### Same-machine baseline

Normal shipping bake `e576756c56bd7d355bbd`, headless Edge, RTX 3090 Ti / D3D11,
1280 × 720, medium quality, 20 s W input. Runs were serial with no profiler,
mid-drive screenshot, forced bake, roof override or disabled world modules.

| before route | intro | mean / p50 / p95 | max | >80 ms | calls | displacement | heap |
|---|---:|---:|---:|---:|---:|---:|---:|
| centre drive | 86.80 s | 58.05 / 50.1 / 66.9 ms | 133.3 ms | 17 | 2,335 | 339.31 m | 5,042 MiB |
| Sevkabel / Kozhevennaya drive | 87.68 s | 46.76 / 50.0 / 66.7 ms | 83.4 ms | 5 | 1,887 | 124.45 m | 4,944 MiB |
| centre walk | 88.05 s | 45.39 / 50.0 / 50.2 ms | 100.0 ms | 5 | 2,392 | 71.52 m | 4,977 MiB |
| Sevkabel inner-alley walk | 81.82 s | 29.41 / 33.3 / 33.4 ms | 400.0 ms | 2 | 1,380 | 70.25 m | 4,933 MiB |

All four baseline runs have zero failed regions/module errors. The centre drive
ends in traffic. The Kozhevennaya straight-input drive reaches a roadside building
and stops; this is an integrated driving workload, not a completed guided tour.
Compare its final route/traffic outcome as well as frame time. These are single
samples and do not establish a precise FPS percentage. Artifacts are the
`before-*.json` and `_end.png` files in `shots/sevkabel-culture/`.

### Focused checks before the shipping bake

Full environment walking/raycast audit passes all three entrances, both main
aisles, closed walls/counters, quay barriers and photo spots. Module checks pass
with streets/city: about 170k Sevkabel triangles, 101 materials, 4.57 M canvas pixels,
zero update callbacks. The whole-map historical streets/city budget warnings are
retained. The 62 physics checks and static-fixture bounds/range regression pass.
Markings pass, retaining their existing diagnostics. Four source depth probes
report **0.002%, 0.000%, 0.001%, 0.001%** noisy pixels (40 pixels total, no listed
offenders); inspected source day/night views preserve roof/rib silhouettes,
entrances, food trailers, fixtures, stage, artwork, seating and industrial context.

### Final shipping bake and integrated measurements

Bake **`600b5ba52e3b6ec9ad80`** completed high/medium/low before atomic publication:
**329 products / 294.997 MiB gzip**, with matching source hash, static revision,
manifest and every recorded gzip file size. Source remained frozen during final
tests. Codec, worker loader, baked-mesh and region-streamer regressions pass.
All three whole-map road audits pass, retaining the documented allowances and
844 residual surface samples within the existing 2,170 threshold.

Same browser/GPU/viewport/quality and 20 s W input as above, full scene, normal
loading, serial runs, no profiler or mid-run capture:

| after route | intro | mean / p50 / p95 | max | >80 ms | calls | displacement | heap |
|---|---:|---:|---:|---:|---:|---:|---:|
| centre drive | 89.41 s | 53.57 / 52.6 / 70.6 ms | 123.3 ms | 7 | 2,339 | 339.31 m | 5,028 MiB |
| Sevkabel / Kozhevennaya drive | 92.93 s | 45.73 / 52.0 / 54.0 ms | 91.7 ms | 4 | 1,819 | 700.65 m | 5,211 MiB |
| centre walk | 93.10 s | 46.59 / 52.2 / 53.7 ms | 139.8 ms | 4 | 2,340 | 68.84 m | 5,245 MiB |
| Sevkabel inner-alley walk | 90.54 s | 31.47 / 34.9 / 36.1 ms | 68.3 ms | 0 | 1,390 | 72.52 m | 5,197 MiB |
| fair interior walk | 90.56 s | 17.99 / 17.5 / 18.2 ms | 64.5 ms | 0 | 422 | 72.55 m | 4,966 MiB |

All five final runs have zero failed regions, baked failures or module/page errors.
Walking remains grounded and active, with no flight or input lock; fair feet are
at 0.08 m. The new interior route starts at
`-6224.9088,881.2787,-127.0016144` with `--walk`. Its indoor lighting disables sun
shadows and uses a 320 m far plane through the established engine zone API; this is
the shipped indoor behaviour, not an outdoor benchmark with shadows disabled.

The centre drive reaches the identical endpoint and displacement as before. Its
mean changes 58.05 → 53.57 ms and draws 2,335 → 2,339; centre walking changes
45.39 → 46.59 ms. These single samples show no large added centre cost, and do not
establish an optimization speedup. The local alley's added detail costs about
2.06 ms in these samples (29.41 → 31.47 ms, draws 1,380 → 1,390), with no >80 ms
hitches in the final run. The Kozhevennaya drive now travels 700.65 m at 156 km/h
instead of stopping after 124.45 m; its traffic/collision route differs, so its FPS
and heap cannot be used as a precise before/after comparison. Walking endpoints
and visible crowds also vary slightly. Heap values are post-route snapshots,
including uncollected/streamed buffers; they do not isolate venue allocation cost.

Mean FPS is **18.7 centre drive, 21.9 Kozhevennaya drive, 21.5 centre walk,
31.8 Sevkabel alley walk and 55.6 fair walk**. The old centre and exterior driving
still miss 30 FPS; the preceding pass's distant geometry and pedestrian simulation
bottlenecks remain. Startup still takes roughly 90 seconds. This checkpoint adds
cultural content and a playable interior; it does not complete the city's overall
comfortable-driving performance goal.

Artifacts: `after-*.json` / `_end.png` under `shots/sevkabel-culture/`.

`sevkabel-culture-test` passes in the normal-bake full page: actual player movement
through NW/SE/alley doors (feet 0.08 m, grounded), 136.5 m along the central aisle,
programme prompt → E → visible panel → Escape → input lock zero, and indoor zone
entry/exit. It confirms 24 stalls / 3 trailers / 5 dining fronts / 300 bulbs and
zero failed regions. Inspected `final-play_0..2` show the marked entrance, stocked
industrial market and trailer serving window. Remaining console warnings are the
existing `st_floor` / environment bark texture-key notices and Canvas2D readback
advice; there are no relevant module, page or baked-asset failures.

`drive-test --q medium --nofuzz` passes E-key entry, acceleration (109 km/h),
nitro (195 km/h), drift/camera controls, braking and exit with input lock zero.
Its Anichkov deck crossing climbs from 0.03 m to 1.50 m and returns to the road.
Random fuzz is not included. These checks use the normal final bake.

The final normal-bake depth probe asserts `ctx.baked` and passes the hall, sea
square/stage and promenade views: **0.002%, 0.001%, 0.002%**, 51 noisy pixels total,
zero identical-frame difference and no listed offenders. These images were
inspected, including the quay, ribs, gantry, roofs and distant industrial setting.
The depth harness has no `/__baked_revision` endpoint and logs that expected 404;
it uses the matching static baked revision. The normal-loading benchmarks and
control harness provide the endpoint and report zero baked-asset failures.

## 2026-10-11 pass: integrated city and Vasilievsky Island

This pass addresses work that grew with the enlarged city: uncullable landmark instances, tree repacking, scene traversal, ground queries, an overfull minimap prefetch
cache and baked decoding. Geometry, placements, colliders and quality tiers are retained. See the final measurements below for the remaining gap to comfortable driving.

### Baseline and comparison limits

The pre-change high-quality runs used the complete integrated scene, including Vasilievsky Island, with 20 seconds of W input, headless Edge at 1280 x 720,
no CPU profiler and no mid-drive screenshots. The centre start was `498.2286,135.1625,76.0322`; the island start was near `-4405,-998`.
The baseline used **private high-quality products from an incomplete bake** (`3e46c3a173458b5c44ff`) and **`noroof=1`**. It is a labelled driving diagnostic,
not a normal shipping-load baseline. Its intro times (98.05 / 89.80 s) must not be used to claim an ordinary-load speedup against the final complete bake.

| baseline route, high | mean frame | p50 | p95 | max / hitch | mean calls | displacement | final heap |
|---|---:|---:|---:|---:|---:|---:|---:|
| centre / Nevsky | 105.05 ms | 100.10 ms | 133.40 ms | 216.80 ms | 2,614 | 699.84 m | 5,170 MiB |
| Vasilievsky Island | 55.59 ms | 50.00 ms | 66.70 ms | 466.70 ms | 1,676 | 279.08 m | 5,225 MiB |

The routes ended at 141 and 46 km/h respectively, with zero failed regions. These are different gameplay workloads; compare each route with its own later run.
Baseline artifacts are `shots/perf-oct11/before-{centre,island}.json` and the corresponding `_end.png` files.
The older measurements below describe their original, smaller scene revisions.

### Implemented changes

* **Minimap cache** (`core/minimap.js`): the warm square now fits the 40-tile cache. The former radius-three square requested 49 tiles and repeatedly evicted/rasterized
  tiles even while stopped. Radius two warms 25 tiles and leaves room for recently visible tiles during motion; visible map coverage is retained.
* **Shared landmark tree bounds** (`world/lib/tree-bounds.js` and landmark generators): every crown/trunk LOD receives a bound covering its complete immutable placement
  set, scale and rotation, plus a 2 m wind margin. Repacking changes active counts and empty-bucket visibility without shrinking the bound. Repacked trees are explicitly
  dynamic with `DynamicDrawUsage`, so static splitting and outline proxies cannot freeze the initially populated far bucket. `?treecull=0` is a diagnostic toggle.
* **Fixture and bridge culling** (`environment/quay.js`, `bridges/rails.js`, `landmarksC`, `landmarksF`): immutable fixtures get aggregate bounds; city-wide bridge rails
  split into spatial cells. Dynamic quay buckets retain full-placement bounds and hide when empty. Compact Anichkov railings, cathedral balusters and authored tree
  silhouettes retain their existing distance ranges, avoiding furniture-sized LOD distances derived from unit geometry.
* **Shadow sector rejection** (`core/renderer.js`): cached conservative caster bounds skip static sector subtrees outside the directional/spot-light shadow volumes.
  Colour visibility is restored in `finally`; dynamic meshes, custom `onBeforeShadow` callbacks and uncullable meshes opt out. Unfrozen scenes, cube shadows and VSM retain the original path. This adds no
  proxy geometry and does not reduce the shadow map or its range. `?shadowsectors=0` retains the original traversal for controlled comparison.
* **Compact baked object schemas** (`core/baked-codec.js`): repeated property-name lists are stored once. Object aliases, Maps, Sets, cycles, special numbers, property
  order and shared typed-array storage retain their previous semantics. The decoder accepts existing pair-list object records as well as new schema records.
* **Worker loading and bounded decompression** (`core/baked-worker.js`, `baked-world.js`): fetch, gzip expansion and decoding run in a module worker; its backing buffer
  transfers with the decoded views. Known raw sizes fill one final allocation instead of retaining chunks plus a second complete buffer. Blocked/crashed workers and
  message failures retry through the main-thread path; `?bakedworker=0` selects it explicitly. Older manifests without raw sizes still load.
* **Cheaper region hydration** (`core/baked-meshes.js`, `region-streamer.js`): new bakes carry geometry/instance bounds, avoiding runtime vertex/instance scans.
  Instance attributes adopt decoded arrays directly. Completed regions release cached packed metadata; hydrated geometry keeps the arrays it owns. Legacy bounds
  are still recomputed when absent, and nearby streaming/destination preloading retain their existing limits.
* **Bake peak memory** (`main.js`, `core/roofmap.js`, `tools/bake-scene.mjs`): roof depth capture uses original static geometry before runtime colour batching, with
  zone visibility applied. It temporarily disables and then restores shadow rendering. Navigation stages receive the completed field/kerb raw sizes for preallocation.
  Publication still waits for all required products and a matching source revision; the interrupted attempt did not publish a partial shipping manifest.
* **Persistent opaque tree buckets** (`environment/tree-instances.js`, `trees.js`, `landmarksSmolensky/forest.js`): unchanged LOD membership keeps its existing instance
  slot. Membership changes swap-remove and append only the affected trees. Immutable near/far/stem transforms and colours are cached; coalesced dirty ranges survive
  hidden frames. Pruning, camera cones, hysteresis and the complete placement set are unchanged. Transparent blob ordering is retained. The forest caches and ownership
  arrays add about 2.9 MB for 10,520 trees/shrubs, avoiding repeated reconstruction and uploads.
* **Detail range groups** (`core/lod.js`, `renderer.js`): compatible attached static details share a conservative distance bound below their sector. Whole groups can
  leave the traversal; boundary groups retain exact per-object tests. Zone ownership, shadow eligibility, streamed-region parents and skyline/outline proxy roots are
  preserved. Nested membership changes invalidate cached shadow bounds. `?lodgroups=0` retains per-object checks for comparison.
* **Surface-only physics candidates** (`core/physics.js`): each existing spatial cell keeps its walk/ramp/hole references in original insertion order. Ground and hole
  queries skip unrelated building/prop colliders; collision queries retain their full candidates. Removal, grid clearing, equal-height ties and ramp semantics remain
  unchanged. The usual single-cell query returns its existing array without allocating a temporary Set.

### Completed verification

`baked-codec-test`, `baked-loader-test`, `baked-meshes-test` and `region-streamer-test` pass: old/new schemas, aliases/cycles, real transferable-worker round trips,
worker/asset failures and shutdown, exact arrays, cached/legacy bounds, transforms, destination changes, request deduplication and packed-region release.
The existing `street-kerbs-test` also passes: 31,114 runs, 551,860 exact points, 18 malformed cases, generator fallback and staged bake loading.

The real shipping `city-base` payload round-trips byte-identically through the legacy encoder after either decode path. Schema interning changes its raw size
**201,733,808 → 152,404,464 bytes (-24.5%)**, gzip **43,494,249 → 40,702,461 (-6.4%)**, and isolated CPU decode **6.02 → 2.59 s**.
These are subsystem results on that payload, not a measured full-city load or FPS improvement.

`minimap-cache-test`, `landmark-tree-bounds-test`, `static-fixture-test`, `shadow-sector-test`, `renderer-pass-test` and `lod-test` pass. They cover stationary/moving/
teleported cache settling, complete placement/wind bounds across LOD repacks, transformed fixture containment, spatial splits and range preservation, identical shadow
draw lists, dynamic opt-outs, moving/multiple lights, zone visibility and exception restoration. `roof-capture-test` passes in real WebGL: **2,736 cells compared,
714 occupied, zero differences** before/after batching, including transformed roofs, instances, courtyard holes and elevated decks; failure restores renderer state.
`tree-bucket-test` compares **2,762,766 active transforms/colours** against checkpoint `c8215009`, using the real Smolensky plan, walking/driving paths, turns,
thresholds, pruning and deferred uploads. On the final parent rerun, 540 callback updates cost **389.21 → 253.45 ms** for environment trees and **336.57 → 282.68 ms**
for Smolensky; simulated upload volume falls **98%**. These are subsystem measurements, not whole-frame gains. The existing `tree-instance-test` also passes.

`lod-range-test` passes with **22,546 registrations**, randomized camera/scale/zone changes, exact thresholds, removals and identical effective colour/shadow draws.
It reduces the synthetic renderer walk from **9,233 to 4,294 objects**. Same-page fixed-camera A/B rendering measured **24.30 / 22.62 / 26.22 / 23.30 ms** with range
groups disabled/enabled/disabled/enabled and identical **2,335 calls / 12,780,658 triangles**. This supports keeping the change but is not driving FPS.

`physics-surface-test` passes **5,004** synthetic surface/hole cases and **30,000** queries against the actual **370,876-collider** city dump. The latter retain exact
results while median time for the complete 30,000-query batch falls **73.5 → 46.0 ms**. All 62 existing physics checks pass. The additional per-cell arrays contain 416,458 references across 26,793
cells, using the existing cell keys; they do not duplicate collider objects.

Both `npm run roads` and `npm run markings` pass, retaining their documented existing diagnostics. The final repeat and integrated visual/control checks are recorded below.

### Checkpoints and rejected experiment

`12b5e11b` adds destination-aware integrated benchmarking; `c86b882e` adds the mandatory new-area contract; `c8215009` contains the first source/bake checkpoint
(`c3c94131f7a5457a80a1`, 329 products, 295.008 MiB gzip). With normal loading that checkpoint measured **61.6 ms / 16.2 FPS** in the centre and **36.6 ms / 27.3 FPS**
on the island at high quality, with intro times **84.8 / 84.1 s** and no failed regions. Those are intermediate results; the final build is reported below.

A private far-proxy `BatchedMesh` experiment reduced 2,335 calls to 2,079 but copied **287,260,488 bytes (274 MiB)** of geometry. Repeated fixed-camera rendering
changed only **25.14 → 23.85 ms** and **24.01 → 23.80 ms**. That inconsistent gain did not justify the memory cost, so the experiment was rejected. Its code is not shipped.
Diagnostic data: `shots/perf-oct11/range-far-experiments.json`; do not present its fixed-camera numbers as driving performance.

A read-only follow-up also checked the 25 copied landmark `inst.js` helpers: they already compute aggregate spheres and retain frustum culling. Their `noBatch`
flags do not disable the engine's spatial outline proxies. The centre draw audit contains only 176 non-tree landmark-instance entries with `noBatch`, including
custom instances outside these helpers. Blanket splitting is not established as a useful call-count reduction and must preserve authored ranges if investigated.

### Why the island feels faster; next measured bottlenecks

The island uses the same renderer and city-wide simulation. The high-quality route renders about **1,174 calls per frame**, versus about **2,410** in the first final
centre run. Post-route fixed rendering costs **17.08 ms / 4.60 million triangles** on the island and **32.00 ms / 12.28 million triangles** in the centre. These are
different views, not an isolated A/B of district code, but they demonstrate substantially less visible rendering work on the island.

Direction matters even at the same location: the final Smolensky views at `-5561,-1502.3` measure **925 calls / 4.07 million triangles** facing west and
**2,474 / 11.57 million** after turning 180 degrees toward the main city. Do not infer that an island-local optimization alone accounts for its higher FPS.

The centre colour-draw audit (`shots/perf-oct11/checkpoint-audit.json`, captured before the second checkpoint) attributes **5,175,011 triangles in 258 draws** to
distant merged proxies. `core/batch2.js` currently merges their detailed geometry and simplifies materials; it does not reduce vertex counts. The main rendering
candidate is therefore actual distant geometry LOD, preserving roof profiles, spires and landmark silhouettes. Reusing the island's recent material-atlas patterns
in older landmarks is another candidate, but its benefit has not been isolated. Measure both vertex work and draw calls; merely combining the same triangles into
larger buffers was not sufficient in the rejected experiment above. Validate dense skyline views as well as local streets before shipping either change.

The centre CPU profile (`shots/perf-oct11/profile-centre.cpuprofile`) was captured before the second checkpoint's tree/ground-query changes. It contains 20.825 s of
samples around a 15.308 s driving interval, including profiler lifecycle overhead; it is diagnostic evidence, not an FPS run. The people callback accounts for 2,204 ms
inclusive, with **1,851 ms in simulation versus 107 ms in rendering**. Movement accounts for 570 ms, full neighbour-hash rebuilding for 154 ms and A* routing for
143 ms; these inclusive figures overlap. Refresh the profile before choosing the next implementation.

The next simulation candidate is persistent phase lists followed by a spatially bounded scheduler for whole leader/follower groups (`world/people.js`,
`world/people/sim.js`). The current loop scans every agent and rebuilds the neighbour grid each 1/60 s slice; the far-agent slowdown exempts leaders/followers.
First preserve agent order, RNG sequence and exact seeded replay while avoiding phase-selection scans. Any later change to distant scheduling must preserve group
cohesion, active crossings, signals, density, door/night/script deadlines, teleports and the pre-slice neighbour snapshot. Validate with people/fence/cover/crosswalk
regressions and integrated centre/island walking and driving. No speedup is established for this proposal.

### Final shipping build and integrated measurements

Bake **`e576756c56bd7d355bbd`** contains **329 products / 295.008 MiB gzip**, with matching source hash, static revision and manifest. All manifest file sizes match.
High, medium and low products completed before atomic publication. The source was then frozen for validation.

These are serial, normal-bake runs in headless Edge, **NVIDIA RTX 3090 Ti / D3D11, 1280 x 720**, holding W for 20 seconds, with no CPU profiler, mid-run screenshots,
forced bake or `noroof` override. FPS is 1,000 divided by mean frame time. Intro time includes full city initialization before destination preloading; it is not
island-specific loading or a network-bandwidth estimate. Three.js was served locally through the test harness.

| route / quality | intro | mean frame | p50 | p95 | mean FPS | mean calls |
|---|---:|---:|---:|---:|---:|---:|
| centre drive / high | 84.47 s | 57.01 ms | 50.0 ms | 66.8 ms | 17.5 | 2,419 |
| island drive / high | 89.93 s | 37.74 ms | 33.4 ms | 50.1 ms | 26.5 | 1,174 |
| centre drive / medium | 87.96 s | 56.87 ms | 50.0 ms | 66.9 ms | 17.6 | 2,328 |
| island drive / medium | 89.31 s | 34.91 ms | 33.3 ms | 50.0 ms | 28.6 | 1,108 |
| centre drive / low | 88.71 s | 41.01 ms | 33.4 ms | 66.7 ms | 24.4 | 2,198 |
| centre walk / medium | 89.50 s | 52.51 ms | 50.0 ms | 66.7 ms | 19.0 | 2,378 |
| island walk / medium | 89.06 s | 29.95 ms | 33.3 ms | 33.4 ms | 33.4 | 1,146 |

| same route / quality | max frame | frames >80 ms | displacement | final heap | loaded regions / 320 | end state |
|---|---:|---:|---:|---:|---:|---|
| centre drive / high | 166.7 ms | 14 | 782.67 m | 5,067 MiB | 52 | 2 km/h |
| island drive / high | 83.4 ms | 1 | 224.38 m | 5,109 MiB | 75 | 2 km/h |
| centre drive / medium | 816.7 ms | 17 | 339.31 m | 5,007 MiB | 50 | stopped in traffic |
| island drive / medium | 83.3 ms | 2 | 318.03 m | 5,099 MiB | 74 | 75 km/h |
| centre drive / low | 633.3 ms | 15 | 339.55 m | 4,988 MiB | 50 | stopped in traffic |
| centre walk / medium | 466.6 ms | 8 | 67.13 m | 4,942 MiB | 44 | grounded, active, no input lock |
| island walk / medium | 100.0 ms | 1 | 72.24 m | 5,085 MiB | 75 | grounded, active, no input lock |

All runs have **zero failed regions, baked failures or module/page errors**. Walking is grounded at normal eye height, not free flight. Drive starts are
`498.2286,135.1625,76.0322` (centre) and `-4405,-998,120.2969445` (island); unobstructed walking starts are `501.2759,160.9113,76.0322` and
`-4409.3359,-1004.7074,120.2969445`. Actual traffic encounters and final positions differ, so these samples do not establish a precise FPS percentage gain for
the second checkpoint. The high-quality diagnostic baseline was slower, but it also used different bake/roof settings. No ordinary-load before/after percentage
is available. Loading still takes roughly a minute and a half, and **the old centre still misses 30 FPS even at low quality**. Island walking reaches that mean;
island driving is closer but does not consistently meet it. This is an optimization checkpoint, not completion of the comfortable-driving target.

Artifacts under `shots/perf-oct11/`: `final-centre-high-rerun`, `final-island-high`, `final-centre-medium`, `final-island-medium-rerun`,
`final-centre-low-rerun`, `final-walk-centre-clear` and `final-walk-island` (`.json`, `.log`, `_end.png`). The original `final-island-medium` and
`final-centre-low` runs overlapped unrelated CPU parsing and were discarded, then repeated. The first `final-centre-high` startup overlapped a streaming regression;
the table uses its entirely quiet rerun. The original `final-walk-centre` route hit an obstruction after 3 m and correctly failed; its timing is excluded.

`drive-test --q medium --nofuzz` passes real E-key entry, acceleration (110 km/h), nitro (195 km/h), drift/camera modes, braking and exit with the input lock cleared.
It also crosses Anichkov's physical deck, climbing from about 0.03 m to 1.50 m and back. Random driving fuzz was not run in this check. Inspected control images are
`final-controls_0_prompt.png`, `_6_cockpit.png` and `_8_out.png`. `views-streaming-check` passes all **48 island views**, ensuring complete 700 m destination coverage
with zero failures; the marine-facade liner view explicitly accounts for its authored shoreline/port foreground instead of assuming a generic building within 160 m.

Inspected `final-views_0` through `_5`: Isaac, Spit toward the fortress, both Smolensky directions, the cruise liner and a return to Nevsky. Roofs, spires, trees,
shadows, street surfaces, signage and nearby people remain present. The first Isaac capture included the intro fade; `shot --play` now waits for it to disappear,
and `final-isaac_0.png` replaces that capture. Destination screenshots await actual streamed content before changing the camera.
The only console warnings in this visual pass were existing duplicate texture keys and a Canvas2D readback advisory.

Final `npm run roads` and `npm run markings` both exit 0 (`final-roads.log`, `final-markings.log`). The road checks retain 11 documented allowed furniture overlaps,
844 residual surface samples (limit 2,170), 4 ribbon wall segments (limit 10), and 570 overlapping triangles (limit 1,000); there are no new strict failures.
Markings retain their existing two missed plan points. No source changed after this bake.

Use `node tools/drive-bench.mjs --q high --seconds 20 --start "x,z,yawDeg" --json --out shots/perf-oct11/route` against the final normal bake.
Add `--walk` for real walking through the same integrated scene: it preloads the destination, sets a grounded pose with normal eye height, holds W and records mode,
walker state and displacement. Choose an unobstructed pavement route; avoid `--profile`, `--mid-shot`, `noroof` and forced/stale bakes in final timing runs.
Future-area guidance is in [PERFORMANCE-CONTRACT.md](PERFORMANCE-CONTRACT.md), linked from the project brief and root agent instructions.

## 2026-10-08 pass: loading, streaming and driving

This pass reduces repeated work and transient memory while preserving the city's geometry and simulation. Driving is substantially faster, but the measured frame times
still fall short of comfortable driving at 30 FPS. Historical measurements refer to their respective builds.

### Final driving measurements

Bake **`b5913aa790e76bcd17d6`** contains **333 files / 288.0 MiB**, with matching source, static revision and manifest. These runs used normal baked loading, headless Edge at
1280 x 720, and 20 seconds of driving from the road lane at **`498.2286,135.1625,76.0322`** (`x,z,yawDeg`). Neither CPU profiling nor mid-drive screenshots were enabled.

| quality | intro ready | mean frame | p50 | p95 | mean draw calls | mean FPS |
|---|---:|---:|---:|---:|---:|---:|
| high | 80.4 s | 86.2 ms | 83.3 ms | 100.1 ms | 2,477 | 11.6 |
| medium | 79.8 s | 70.8 ms | 66.7 ms | 99.9 ms | 2,399 | 14.1 |
| low | 78.7 s | 68.4 ms | 66.7 ms | 83.4 ms | 2,309 | 14.6 |

High covered **765 m** and ended at **155 km/h**. Medium and low covered about **340 m**, ending stopped behind traffic. Maximum frames were **816.8 / 900.1 / 783.5 ms**
on high / medium / low: long hitches remain, as does the gap to **30 FPS / 33.3 ms**. All three runs loaded `street-kerbs`, with no baked failures, script errors or failed
regions. Artifacts: `shots/perf-next/final3-road-high.json`, `final2-road-medium.json`, `final2-road-low.json` and their final screenshots. The high run was repeated after
comparison-harness source preparation had finished; the earlier `final2-road-high` timing is not used here.

An unprofiled comparison used the original source at **`18de521`** with fresh geometry/navigation products and the byte-equivalent field in its original payload schema
(`?baked=force` bypasses the deliberate source/manifest mismatch in that comparison only). At medium, the same start and 20-second throttle input loaded in **90.0 s**
and measured **97.6 ms mean / 100.0 ms p50 / 116.7 ms p95**, about **10 FPS**, with **2,745 mean draw calls**. It drove **589 m**. Against that recorded baseline, the final
medium run loaded about **11% faster**, reduced mean frame time **27%**, and increased throughput **38%**. Cars cover different distances, and host timing varied during
this session, so these are gameplay workload measurements rather than identical-camera or precisely isolated speedups. Artifact: `shots/perf-next/before-matched-medium.json`.
The original normal-loading attempt with the stale shipping manifest exceeded **280 seconds**; that failure is not used as the timing baseline.

### Checkpoint comparison and timing variation

Earlier checkpoint **`bcd588c`**, with bake `254dc1a65a053512c8d6`, measured **69.9 s loading / 58.8 ms mean frame** at medium, or **17 FPS**. High and low measured
**66.8 / 56.2 ms** respectively. Those earlier runs were faster than the final runs above, including in unchanged modules, static batching and region attachment.
To check for a regression in the final changes, an adjacent run served the checkpoint source with the current baked assets (no field substitution, `?baked=force`). It
measured **81.6 s loading / 74.0 ms mean / 66.7 ms p50 / 100.0 ms p95**, with **2,394 calls** and **339 m** travelled. The final medium run therefore loaded about **2% faster**
and reduced mean frame time about **4%** against that adjacent checkpoint run. This supports retaining the final kerb, signal and road-query changes; the earlier 17 FPS
result should not be presented as the final build's measured FPS. Artifacts: `shots/perf-next/checkpoint-current-assets-medium.log` and `final-road-{high,medium,low}.json`.

### Loading and bake reliability

* **Compact field payload** (`world/environment/field.js`): building, road, water and paving masks now read the identical channels already stored in `dtex`. The bake no longer
  serializes four duplicate byte planes: **334,730,400 bytes (319 MiB)** removed from the decoded field for the current 13,220 x 6,330 raster. Mutable masks remain separate.
  Old payloads still hydrate. `tools/field-bake-equiv.mjs` verifies every duplicated byte, full texture hashes, 20,000 deterministic field queries and `addBlock` mutations
  against a reference captured before the change; the compact payload gives the same results.
* **Compile each module's new objects** (`main.js`): early shader compilation traverses only the roots added by that module, using the scene's lights, instead of repeatedly
  compiling the growing city after every landmark. The final complete scene compile remains.
* **Compact kerb cache** (`world/streets/net.js`, `streets.js`): `street-kerbs` stores five integers for each surviving contiguous sample run, rather than the full street
  graph or hundreds of thousands of point objects. Its **133.9 KiB gzip** payload reconstructs **31,114 runs / 551,862 points** exactly from the current ways and fillets.
  An isolated CPU test reduced complete network construction **4.18 to 2.64 s**; reconstruction itself took **284 ms cold / 271 ms warm**. Missing, older or invalid
  caches fall back to the generator, and invalid data cannot replace part of the live kerb list. Navigation bake stages reuse the completed high-stage cache.
* **Publish a completed bake** (`core/baked-world.js`, `tools/bake-scene.mjs`): the shipping manifest and source revision are replaced only after all required products finish
  and a final check confirms the source has not changed. Generation failures leave the previous published manifest/revision intact. Uploads are awaited after each module; gzip
  compression streams from disk instead of allocating another complete raw field buffer. Navigation stages reuse the current run's completed field through a private
  endpoint, without publishing a partial manifest or enabling region streaming. Bake pages skip shader warmup and runtime render proxies; the static stage retains the
  batching and zone visibility needed for roof capture. Fatal browser/module errors stop the bake, with a loading-stage heartbeat every 30 seconds.

### Work during a frame

* **Bound background streaming** (`core/region-streamer.js`): after an idle yield, load the nearest queued region within 1,400 m of the current player position. Recheck the
  destination after yielding, retain the two-request limit, and resume as the player moves. Distant regions stay queued; explicit destination loads and `ensureAll` remain
  available. This avoids decoding the entire city in the background during a drive.
* **Correct LOD ownership** (`core/lod.js`, `core/spatial.js`): adding the same object twice is idempotent. Splitting an already registered instanced mesh preserves its authored
  distance and shadow eligibility and removes the replaced source from the registry. Streamed objects retain their region parent, so an offscreen sector now hides these
  loose objects individually, including after a zone visibility update. Static colour and normal/depth proxies have separate sector trees; each render pass skips the
  irrelevant tree in one visibility check (`core/renderer.js`).
* **One outline render** (`core/renderer.js`): static normal/depth proxies and dynamic objects now render together with their existing per-object material variants. This
  removes one scene traversal, light collection and sort per frame. `__pipeline.combineND = false` retains the former two-pass route for same-page comparisons.
* **Larger static batches** (`main.js`): the default near/far cells are now **192/640 m**, with `?bcell=` and `?bfar=` overrides retained. Geometry and quality tiers are
  unchanged; fewer pieces reduce CPU draw overhead while somewhat more offscreen triangles pass through coarse culling.
* **Tree updates** (`world/environment/tree-instances.js`, `trees.js`): cache immutable transforms and colours, remember which tree owns each LOD slot, and upload only changed
  ranges. An unchanged slot needs no matrix rewrite or upload. Pending ranges survive frames in which a bucket is hidden.
* **Vehicle uploads** (`world/traffic/fleet.js`): near paint, glass and lamp meshes share one transform buffer. Upload active prefixes of matrix, colour, plate and lamp data,
  retaining any pending ranges until rendered, instead of repeatedly uploading full capacity buffers.
* **Pedestrian lookup and accessories** (`world/people/crosswalks.js`, `nav.js`, `batches.js`, `chars.js`): a 32 m grid narrows zebra-corridor queries while preserving crossing
  order and exact boundary tests. On devices with `WEBGL_multi_draw`, compatible accessory variants share three material batches, reducing crowd meshes from **78 to 49**;
  articulated body parts remain instanced with their original body/head shaders. `?pbat=0` restores the accessory InstancedMeshes. The toon and normal/depth shaders support
  the batch transform, with separate program variants for the batch state.
* **Reuse road coefficients** (`world/people/nav.js`): carriageway checks use the segment coefficients already stored in the final street grid instead of repeatedly reading
  endpoints and recomputing lengths. There is no additional cache or build step. The real-city regression checks **818,892 exact queries** and **225,967 segment records**;
  100,000 representative queries measured **382.9 ms before / 172.0 ms after** in the isolated CPU test.
* **Update signal displays when they can change** (`world/streets/display-clock.js`, `signals.js`, `countdown.js`): integer-offset plans check lenses at half-second boundaries
  and countdowns at second boundaries. Traffic logic keeps its original timing. Fractional offsets disable caching; jumps across display intervals and floating-point
  boundary cases query the original time;
  `?signalcache=0` restores the former per-frame scan. **18,552 full-buffer comparisons** passed. A 3,600-frame CPU test reduced countdown work **166.0 to 9.4 ms** and
  lens work **254.4 to 18.5 ms**; these are subsystem timings, not a claimed whole-frame speedup.
* **Reliable first entry into the car** (`world/drive.js`): the exit listener respects an already consumed E key event, so slow first-time HUD/audio setup cannot turn the
  same key press into an immediate exit.

Focused regressions: `tools/lod-test.mjs`, `renderer-pass-test.mjs`, `region-streamer-test.mjs`, `tree-instance-test.mjs`, `fleet-upload-test.mjs`, `people-crosswalk-test.mjs`, and
`people-render-test.mjs` cover visibility/zone transitions, render masks and material restoration, destination changes, deferred GPU uploads, and exact geometry, transforms,
palettes and lookup results. `tools/signal-display-test.mjs` and `people-cover-test.mjs` verify the additional discrete display and road-query paths.
`tools/street-kerbs-test.mjs` checks all reconstructed points, topology aliases, 20,000 road queries, 18 malformed payload cases, procedural fallback and staged bake loading.

### Experiments and measurement

Full-city medium-quality fixed-camera checks with 192/640 m cells drew **1,544 calls / 4,777,446 triangles** at hero and **2,324 / 12,093,461** down Nevsky. Earlier 96/320 m
checks drew **1,557 / 4,608,705** and **2,629 / 11,466,735** respectively: triangles increased 3.7% and 5.5%. Frame times moved from **24.88 / 35.75 ms** to about **20 / 28 ms**,
but the latter also include the separate sector trees and combined outline pass, so the timing gain cannot be attributed to cell size alone. In alternating same-page
40-frame samples, separate/combined outlines measured **21.56/21.18 then 21.02/19.52 ms** at hero and **28.77/29.03 then 28.60/28.34 ms** on Nevsky. Both paired screenshots
were pixel-identical; the street geometry and signage were also visually reviewed. These are frozen-camera render measurements using the prior bake, not final driving FPS.
Artifacts: `shots/perf2/nd_ab_640.json` and its paired screenshots; comparison scan: `shots/perf2/lod_scan.json`.

Two additional geometry-copy experiments were removed after same-page A/B measurements failed to improve frame time. Shadow proxies used about 175 MiB: hero
**10.57 ms enabled / 8.12 ms disabled**, Nevsky **26.27 / 24.30 ms**. Native static city batches used 127.8 MiB and removed 479 draw calls, but measured
**34.27 ms enabled / 33.66 ms disabled**. Lower draw counts alone were insufficient on this renderer. Batching the entire crowd was also discarded because ANGLE expanded
the multi-draw work internally; the retained crowd change batches accessories only.

Two later GPU-visibility experiments also stayed out. A single far-proxy draw saved about **1.7 ms** on Nevsky with identical pixels, but required **274.6 MiB** of extra
geometry and drew about **1.47 million** additional offscreen triangles. A **127.9 MiB** set of opaque material merges saved only about **0.8 ms**, with three pixels differing
by at most 6/255 in the paired image. The small timing gains did not justify retaining the extra memory. Artifacts: `shots/perf-next/far-visible*.json` and
`shots/perf-next/opaque-visible-128*.json`.

A compacted silhouette index buffer also stayed out: it removed **86 draws** with identical paired images, but warmed Nevsky rendering measured **33.86 ms original /
33.83 ms merged** and hero was slightly slower. It allocated about **30 MiB** of merged buffers and submitted roughly **100,000** extra triangles on Nevsky.
Artifacts: `shots/perf-next/silhouette.json` and paired screenshots. This confirmed that fewer reported draws alone are not a sufficient acceptance criterion.

A diagnostic drive separated the remaining render cost: about **26.3 ms colour**, **8.5 ms shadows**, **6.7 ms outlines**, and **0.2 ms post-processing**. Instrumentation
adds overhead, so these identify priorities rather than replace the uninstrumented FPS results. Streamed city details contributed only 73-196 colour draws in its two
captures; authored static meshes, far proxies, trees and other instances make up most of the remaining draw work. Lower resolution alone does not remove this CPU cost.

`tools/drive-bench.mjs` starts recording on a fresh animation frame after profiler setup, then stops immediately after releasing the accelerator, before collecting/writing
the profile or taking the final screenshot. Both sides of the profiler lifecycle are excluded from frame, long-task, region and zone measurements. In
`shots/perf-next/road-1280.json`, the artificial **4,238.2 ms** maximum is at **frame index 4**, demonstrating that profiler startup had been included; its first frame was
also **842 ms**. Those maxima are unsuitable for judging driving hitches. JSON records `profiled`, `profilerLifecycleExcluded` and the actual measured duration.
Mid-drive screenshots are disabled unless `--mid-shot` is requested. Use an unprofiled run without `--mid-shot` for final frame-time distributions. Loading reports its
stage every 30 seconds and fails promptly on module, script, page or renderer errors; only the Three.js CDN requests are intercepted. Expected `ERR_ABORTED` request
notices use stdout; genuine request failures remain errors.

### Verification

`npm run roads` passed all three configured audit gates; `npm run markings` passed its strict geometry checks. Logs: `shots/perf-next/final-roads.log` and
`final-markings.log`. The physics suite passed all **62 checks**. The browser control regression (`tools/drive-test.mjs --q medium --nofuzz`) verified first-press entry,
acceleration, nitro, drifting, camera changes, braking, exit/input release, audio and bridge-deck height; it ended **drive test OK**. Its optional random fuzz run was
explicitly skipped. Artifacts: `shots/perf-next/final-controls.log` and screenshots. The final field matches the pre-change full texture hashes and 20,000 query samples.
All three final navigation products exactly match the prior checkpoint, as does the roof data (excluding its elapsed-time metadata). The completed bake passed its
source-revision gate, and every manifest entry was checked against its file size. Final revision: **`b5913aa790e76bcd17d6`**.

## 2026-10-07 pass: the whole city (after the Petrograd side extension)

Starting point (medium, RTX 3090 Ti, headless Edge 1280 x 720, baked revision d40bd2ff): intro ready after 77 s, 18 fps and **20.3 M triangles** at the start pose, 26-33 M
in the four reference poses below, JS heap ~4.7 GB after the load. Every pose drew the whole city: the merged static batches ('L' groups of core/batch2.js), the ND proxies (one
13 M-triangle mesh with a 10 km radius) and the city-wide instanced lamps / benches had bounding spheres of 5-10 km, so neither the frustum, nor the 70-90 m sun shadow box,
nor a distance LOD could ever drop them. The frame is CPU / driver bound on this machine (jsMs == ms in `__bench`, no change with the resolution): ~20 us per draw call with
the toon materials under ANGLE / D3D11, plus three.js walking every object of the scene in each of its passes.

### Result (medium, clean before / after runs on a quiet machine, `node tools/shot.mjs --bench 20`; "before" = commit 848b0cc in a worktree)

| pose | before: ms / calls / triangles | after: ms / calls / triangles |
|---|---|---|
| start (Vosstaniya Square) | 39.4 / 1648 / 26.0 M | **34.0 / 1659 / 4.3 M** |
| Nevsky eye level, the long view (view 3) | 61.2 / 4740 / 32.6 M | **52.6 / 3227 / 11.3 M** |
| Anichkov Bridge pavement `-430,3.4,-70,-100,-8` | 43.7 / 2372 / 28.2 M | 42.6 / 2333 / 6.2 M |
| aerial 60 m over the Moika `-1200,60,-200,-140,-20` | 42.7 / 2165 / 28.2 M | 41.9 / 2012 / 6.4 M |

Screenshots are pixel-identical at the start pose and down Nevsky (`node tools/png-diff.mjs`: 1-2 pixels of 921 600 differ, traffic). The GPU work fell 4-6x (this is what a
laptop / integrated GPU feels: 26 M triangles with 4x MSAA HDR is far beyond it, 4-6 M is not); the CPU side barely moved because the draw-call count is the same (the pieces
per material per cell replace the big merges one to one) and a draw call costs what it costs. **Load**: 77 s -> 68 s on the OLD bake (`?baked=force`), module work 66 -> 44 s;
the re-baked nav (`FINAL` path) takes people from 5.5 s to ~3 s; the JS heap after the load is ~0.8 GB smaller once the proxies are uploaded.

### What changed (engine, `src/core`)

1. **`spatial.js`** (new): `splitGeometryByCell` cuts a (merged) geometry into cells by triangle centroid, all attributes kept, vertices shared inside a cell; `splitInstanced`
   turns every static InstancedMesh (StaticDrawUsage, frustum culled, full count, no shared instance buffer: the lamps, the props kit; NOT the cone-culled trees or the
   signal lamps) into one InstancedMesh per 192 m cell with a LOD distance from its geometry radius (a lamp ~450 m, a bench 260 m); **size classes** S / M / L of a source
   object (largest extent < 5 / < 16 m, or long but thin / narrow: a kerb, a railing, a low wall; a mesh wider than 300 m is a bake merge and is classed by its mean triangle
   edge) with LOD distances 350 / 900 m (x `quality.lod`); `releaseOnUpload` drops the CPU copy of a proxy attribute once three.js uploaded it.
2. **`lod.js`** (new, replaces the city's LOD object; `world/city/instances.js` re-exports it): the visibility registry. Objects live in **320 m sectors**; engine-made objects
   (batch pieces, instanced pieces, proxies: world-space matrices) are re-parented into one Group per sector (`attach`), so an out-of-view sector costs the renderer ONE
   visibility test instead of a walk over its ~20-40 meshes; streamed region meshes stay where they are and are hidden one by one. Per frame (`main.js`): a sector is in view
   when its circle meets the camera frustum, kept when it is within the sun shadow box (`shadowSize * 1.6`: casters behind the camera), and its ND proxies draw only within
   `pipeline.ndFar`. Inside a visible sector: distance LOD per item (`far`), `near` for the far proxies, sector-centred for the proxy / detail switch (no overlap, no
   z-fight). Objects hidden by the zone system (`userData._zh`) are left alone. `LOD.of(obj)` (WeakMap: never put object references into `userData`, three.js clones it
   through JSON.stringify).
3. **`batch2.js`**: the size class is part of the group key; a merged mesh wider than 1.5 cells is cut into 320 m pieces (the former 'L' groups: long kerbs, quays, the
   ground, water, lamp sets); a big object that keeps its own material (ground, water, the sign sheet) is cut in place; **far proxies**: beyond `FAR_SWITCH` (1000 m x
   `quality.lod`) a sector draws ONE vertex-coloured mesh of its large opaque toon pieces (textures replaced by their mean colour, paint dropped) and the detail pieces hide
   (Nevsky long view: 8 200 -> 3 300 calls); the **paint amount is a vertex attribute** (`aPaint`, normalized Uint8, `materials.js VPAINT_SCALE`), so toon materials that
   differed only by paint share one material (742 -> 656 shared materials; the remaining ones differ by texture, side or blending); NaN-vertex triangles of a few metro parts
   are dropped before merging (`dropNaNTriangles`).
4. **`ndproxy.js`**: proxies binned per TRIANGLE (big meshes) and per INSTANCE (instanced meshes) into 128 m cells; the proxies carry the nd material themselves.
5. **`renderer.js`**: three.js re-evaluates a material's program (`getProgram`, ~0.1 ms) whenever consecutive draws with the same material alternate between instanced and
   plain objects, or between instanced objects with and without instance colours. The shadow pass drew everything with ONE depth material (19 ms a frame): instanced
   casters get `customDepthMaterial`s of their own (`assignShadowMaterials`, with / without colour); the outline pass draws the proxies with their own material and the
   un-proxied layer-0 objects with per-state variants of `ndMat` swapped in for the pass (`pipeline.ndRoots`, `refreshND`) instead of `scene.overrideMaterial`.
6. **`main.js`**: `LOD.init / update`, `splitInstanced`, an **upload frame** after the warm-up (every proxy drawn once with culling off, so their CPU copies are released at
   once: `stats.releasedMB`, ~0.8 GB), `__bench` reports `jsMs`. Switches: `?split=0`, `?lodscale=`, `?keepcpu=1`, `?baked=force` (use a stale bake while working on engine
   code that does not change the bake), `?nd=0`, `?batch=1` (the old batcher).

### What changed (loaders, identical output: signatures / hashes / regressions in the commit messages)

people nav: the bake is recorded after the height loop and the bridge chains (`FINAL` path; `tools/nav-bake-equiv.mjs` is its regression test); bridges: cached site frames
and a deck AABB before `deckAt` (4.5 s of `deckY` -> ~0); streets: grids and one `coverLocal` per probe in `furn.js`, `net.js`, `signals.js`, `lamps.js`, `barriers.js`,
`plates.js`, `wires.js`, `stops.js`, `decks.js`, cached lens / countdown matrices (also per frame); environment: bounding boxes before polygon work (`trees.js avoidOk`,
`waterways.js`, `quay.js`), `layout.roadsNear` and `paradnyDeckY` early-outs; traffic: grids in `parking.js`, early-exit distance in `sim.js`; claims: `src/world/lib/owns-table.js`
(generated by `tools/owns-table.mjs`, checked by `layout-test`) so the environment no longer waits for the import of all 40 landmark modules (44 MB of code and data).

### How to measure now

* `node tools/shot.mjs --q medium --cams "hero;v3" --bench 20 [--params baked=force]`: ms / jsMs / calls / triangles per pose. `--frameprofile 40` writes `<out>.frame.cpuprofile`
  (summarise with `node tools/cpuprofile-top.mjs <file> --n 30`), `--init "<js>"` runs code before the page (patch `window.THREE` through a setter to trace three.js internals).
* `node tools/shot.mjs ... --eval "(async()=>{const m=await import('/tools/perf-scan-page.js');return m.scan({})})()"`: what the colour pass draws at the pose: triangles per distance
  band, per name family, the biggest meshes (`mask`, `far` for the ND pass). `window.__stats.batch` (classes, pieces, far proxies), `__stats.split`, `__stats.nd`, `__stats.lod`.
* `node tools/load-test.mjs --q medium --params "baked=force" --profile`: phases, heap, `releasedMB`. `node tools/png-diff.mjs a.png b.png --out diff.png`: pixel comparison.
* Do not read fps while other agents run browsers: compare `jsMs` and call counts, or run one job at a time.

### Driving (same day, later)

`node tools/drive-bench.mjs --seconds 20 [--params baked=force] [--profile 1]` drives the car down Nevsky in the real page (regions streaming) and prints the frame-time
distribution, draw calls, long tasks and region attaches. Before: mean 86 ms (12 fps), after: **58 ms (p50 50 ms, ~17-20 fps)** at the same ~2 300 calls. What changed:
the proxies-only outline render did not collect the lights, so three.js bumped its lights-state version every frame and re-evaluated the program of EVERY material (309
`getProgram` calls a frame: the lights now carry LAYER_ND, 26 left); instanced meshes sharing a material all get an instance colour (`renderer.js unifyInstanceColor`);
a streamed region registers its tagged nodes incrementally (`zones.attach`, `pipeline.addND`) instead of walking the whole scene; agents beyond the people render
radius step on every 6th turn (`sim.slowFar`, `?pslow=0`); the dynamic outline render hides the sector root (its pieces are proxied anyway); **drive mode**: above 40 km/h
the LOD scale eases to 0.7 (`?drivelod=1` off). The rest of a driving frame is the draw count (render ~30 ms), the scene walk (~8 ms), people / traffic / birds / car (~10 ms).

### Remaining hot spots

* **Draw calls** are the frame on a fast GPU: ~1 700 at the start pose (dynamic ~430: 70 people part meshes x 3 passes, vehicles, trains; static pieces ~900 in the colour pass,
  ~380 shadow casters). Next: a `BatchedMesh` per material for the people parts, texture arrays for the repeat-textured street materials (asphalt / cobble / kerb / slab: one
  material per texture today), `FAR_SWITCH` 600-700 m at medium, S-class pieces without shadows.
* **Load** (68 s): 40 landmark modules ~15 s (build them lazily per region after "Start"), streets 7.5 s (`textures+net+graph` 3.7 s, signals 1.7 s), environment 6.6 s (3.1 s
  of it is the wait for the 61 MB field bake to decode), batch + proxies 9 s (the splitting is single-threaded JS), the 10 s start simulation 3.6 s, shader compile 4 s.
* **Memory**: the JS heap is ~4 GB after a load (the nav graph, the baked field, every module's geometry kept by its builders); the bake products are 230 MB on disk.
* `landmarksC` boats: `batchGroup` models must never be registered in the sector registry (they move).

---

Measured on the lead's machine (RTX 3090 Ti, headless Edge, 1280 x 720, quality high). **The frame is CPU bound**: it does not change with the resolution (640 x 360 and 2560 x 1440
cost the same), it follows the number of draw calls (~5.5 us each in the browser + ANGLE; "(program)" = native GL is ~55 % of the JS time in a profile). The scene is drawn three
times per frame (normal / depth pre-pass for the outlines, colour pass, sun shadow pass inside the colour call) plus 8 post-processing quads, so every mesh counts 2-3 times.
Triangles are cheap by comparison (the GPU is idle for half of the frame).

## Result (street cameras, quality high, people / traffic on; `__bench(30)` = ms per frame, calls and triangles summed over the passes)

| camera | before | after |
|---|---|---|
| Anichkov Bridge pavement `-430,3.4,-70,-100,-8` (worst) | 14-21 ms, 2550 calls, 7.1 M tris | **6.9-10 ms, 1280 calls**, 7.1 M tris |
| hero (Vosstaniya Sq.) | 10-16 ms, 1503 calls, 6.2 M | **8.3 ms, 1073 calls**, 6.9 M |
| Nevsky eye level (view 3) | 16.5 ms, 2222 calls, 6.4 M | **8.7 ms, 1040 calls**, 6.6 M |
| Anichkov view 5 | 12-13.5 ms, 1248 calls, 5.6 M | **6.9 ms, 884 calls**, 6.0 M |
| station platforms / hall / metro platform | 15 / 15 / 7 ms (people off) | 4.1-4.8 / 2.3 ms |

(The numbers of one machine move by +-30 % while other agents use the GPU; compare runs made one after the other. `node tools/smoke.mjs`: 60 fps (vsync cap), 983 calls.)
Load ("intro ready", `tools/smoke.mjs`): **38-41 s -> 22-24 s** (high; medium 35 -> 19 s). Pixel check against the old build (people / traffic off, 7 cameras, day and night):
0.001-0.19 % of the pixels differ by more than 24/255 and what differs is cars / far window dots (traffic and people are not deterministic between runs); the metro platform 0.001 %.
Z-fighting probe (`node tools/zfight.mjs`, 6 frames): identical to the old build (5 frames < 0.02 %; the platforms view v4 had 0.8 % noisy pixels BEFORE this work, unchanged: a rail / platform bug).

## Where the frame went (worst camera, per pass, before -> after)

| pass | before | after |
|---|---|---|
| normal / depth (outlines) | 1039 calls, 2.6 M tris, 5 ms | **171 calls**, 2.7 M tris (proxies + 200 m range) |
| colour | 1238 calls, 3.1 M tris, 8.6 ms | 838 calls, 3.2 M tris |
| sun shadow (inside the colour call) | 264 calls, 1.4 M tris, 1.4 ms | 225 calls, 1.2 M tris |
| post (bloom chain + composite) | 8 calls, 1.4 ms | same |

## What was changed (all pixel-identical unless noted)

1. **`core/ndproxy.js` (new)**: after the batching, every static layer-0 mesh (merged cells, city, instanced lamps / benches / rails) is merged again into position + 8 bit normal geometry per
   128 m cell (tags / deep cells like `batch2`), ~200 meshes instead of ~1000 calls. The proxies live on `LAYER_ND` (drawn only by the normal / depth pass), the originals move to
   `LAYER_COLOR` (colour pass + shadow casting). `core/renderer.js` sets the camera layer mask per pass (`MASK_ND`, `MASK_COLOR`). Cost: 0.5 s at load, ~110 MB of typed arrays.
   Opt out per mesh: `userData.noND = true`; static InstancedMeshes with `DynamicDrawUsage` (signal lamps) and meshes with material arrays / morphs stay as they are. `?nd=0` turns it off.
   Do not use layers 2-4 in modules.
2. **Outline pass range** (`pipeline.ndFar`, 200 m): the composite fades the outline out between 35 and 190 m, so nothing beyond 200 m is drawn into the normal / depth target (`?ndfar=` for A/B).
3. **Matrix work**: the static root is frozen after the build (`matrixAutoUpdate = false`, `pipeline.frozenRoot`: `scene.updateMatrixWorld` no longer walks ~2 700 objects twice per frame);
   `core/zones.js` stops composing the matrices of hidden `undergroundOnly` subtrees (the metro platforms and trains, ~1 300 objects) while the camera is on the street (`zones.config.freezeKinds`;
   never freeze the "other units": the sun's light target is one of them). Debug: `?nofreeze=1|static|zones`.
4. **Fewer, bigger draw calls**: city streams per 320 m cell instead of 160 (`city/meshes.js CELL`, `?ccell=`), city instance cells 192 m (`?icell=`), batch cells 96 m near / 320 m far
   (`?bcell`, `?bfar`); the ~90 road-sign textures are packed into atlas pages and one mesh (`streets/furn.js`); the boats are merged per material kind (`batch2.batchGroup`, 199 -> ~105 meshes);
   empty instanced meshes (people part variants nobody wears here) are hidden (`pipeline.emptyCull`, `?noempty=1` to compare); the trains have a fixed bounding sphere and frustum culling (`rail/trains.js`).
   The coarser cells draw ~8 % more triangles (the city LOD distances measure from the cell sphere, so a few fine details show from farther: no visible difference in the A/B images).
5. **Load time** (38-41 -> 22-24 s): all module files are imported in parallel with the first builds (`main.js`); shader programs are compiled right after each module (driver-parallel) and
   against the **colour render target** (compiling against the canvas built every program twice: 10 s in the first frame); a warm-up frame behind the loading bar (uploads, depth / shadow
   programs); the start state is simulated in 0.1 s steps (3 s -> 1.7 s); hot loops: `layout.insideBuilding / buildingAt` (64 m grid; 3 s), `streets/net.js cover` (no allocations, no `Math.hypot`,
   fillet grid; 2.2 s), `environment/trees.prune` (grid; 1 s), `people/zones.dNev` (grid; 1.2 s), `textures.fitText` (one proportional jump; 0.4 s). `stats.timing` (`window.__stats.timing`) lists the phases.
6. **Quality tiers** (`main.js QUALITY`): `ndFar` 200 / 150 / 110 m, `lod` (city detail LOD distances) 1 / 0.8 / 0.6, `cull` (vehicle render radius) 1 / 0.75 / 0.55 on top of the existing
   pixel ratio, MSAA, shadow map + box, tree / people / bird counts and people render radius.

## How to measure

* `node tools/smoke.mjs` (intro time, fps, calls) - `window.__bench(n)` = ms / calls / triangles of n back-to-back frames; `window.__diag()` = meshes by root and material kind;
  `window.__stats.timing` = load phases; `window.__stats.nd` = the proxies; `renderer.info` after `?stats=1`.
* One camera in a fresh page (people sit around the start camera): `node tools/shot.mjs --cams "-430,3.4,-70,-100,-8" --eval "JSON.stringify(window.__bench(30))"`.
  A/B against a clean checkout: `git worktree add ../base HEAD~n`, junction its `node_modules`, run the same command in both trees; use `--params "people=off&tr=nomove&wl=nobirds"` for pixel diffs.
* CPU profile of a frame: puppeteer `Profiler.start` around `__bench` (native GL "(program)" ~55 %, `projectObject`, `getParameters`, `updateMatrixWorld` ~3 % each).
* Load profile: `Profiler` around the page load (`onFirstUse` = shader link wait, `cover` / `insideBuilding` were the algorithmic hot spots).

## Module build times (ms, quality high, whole scene)

| module | before | after |
|---|---|---|
| environment | 1300 | 1260 |
| streets | 6500-7000 | 3100-3500 |
| city | 1200-1400 | 1190 |
| rail | 300 | 250-300 |
| landmarksA / B / C / D | 1100 / 450 / 270 / 500 | 630 / 510-650 / 260 / 540 |
| metro | 370 | 350-370 |
| props | 3100-3200 | 1700-1800 |
| traffic | 2100-2700 | 1500-1600 |
| people | 2800-3000 | 1700 |
| wildlife | 270 | 70 |
| after the modules: batch + proxies / compile / warm-up frame / roof map / start sim | 0.9 / 0.4 + first frame 10 s / - / 0.7 / 3.2 s | 1.3 / 0.2 / 2.0 / 0.5 / 2.0 s |

## Remaining hot spots (ideas, not done)

* **Colour pass 840 calls**: ~230 batched cell meshes (127 materials: paint / grime / side variants could become vertex data), 170 city stream meshes (walls / core / roofs / signs per cell),
  47 `galereya` sign meshes (night-animated materials, `noBatch`), 71 people part meshes + 41 vehicle meshes + 51 train meshes. The sun shadow pass repeats the casters (225 calls): a shadow
  proxy needs a shadow update of its own (three.js tests the main camera's layers inside the shadow pass); people / vehicles / trains are the bulk.
* People: 70 instanced part meshes are drawn three times; a `BatchedMesh` per material would make it ~6.
* Triangles: streets 912 k (budget 700 k: roads / pavements ~570 k, lamps ~190 k at 250-420 tris each, chain / rail posts ~130 k), city 596 k; metro 995 k (hidden from the street).
* Static InstancedMeshes (lamps, benches, rails; 600 k tris) are drawn city-wide in the colour pass: baking them into the batch cells (convertible toon materials only) would cull them by cell.
* `ndMat` flips between its instanced / plain program ~100 times per frame (`getParameters`, ~0.5 ms): sort the proxies first (`renderOrder`) or use two override passes.
* `streets` module: `net.js` ways x segments queries (`cover`, `segInfo`) still ~0.5 s; `people/nav` + `traffic/sim` start-up ~1 s each.


## 2026-10-17: two quality tiers (medium, performance); the strip's bake runs two stages

Adopted from `102_3d_piter` (its commits "Performance quality tier" and "two quality tiers"), so that development, the tests and the shipping bake cover two tiers and the bake is faster and smaller.

* The quality menu (`index.html`, `?q=`) offers **medium** (the default on desktop; touch devices start on performance since the mobile controls work, docs/MOBILE.md, with the shadow map 1024 / MSAA 2 / pixel ratio 1 overrides on touch) and **performance** (`?q=performance`). `high` and `low` are retired: their `QUALITY` entries stay in `src/main.js` as comments, and `?q=high` / `?q=low` or a remembered `piter.q` of an old session fall back to medium.
* **performance** is the frame-rate tier: `quality.far` 1 800 m (the camera far plane; 7 000 m at medium; `?far=` overrides it on any tier), `quality.fogScale` 2.5 (`core/timeofday.js` multiplies every preset's fog density so that the cut is hidden; `?fogx=` overrides), and `quality.level` 'low': the population, trees, lawn tufts, far trees, birds, ducks, cloud steps and the nav product follow the old Low tier (the modules read `ctx.quality.level || ctx.quality.name`), as do the LOD scale 0.6, the traffic / crowd cull 0.55 and the outline range 110 m. The pixel ratio stays 1 and MSAA 4 (the frame is CPU draw-submission bound, not GPU bound).
* **The bake** (`tools/bake-scene.mjs`) has two stages: `medium` = the base products (field, roof, street textures / kerbs / surfaces, city-base) + `nav-medium`; `performance` = `nav-low` (the performance tier's level). The `nav-high` product is gone from the manifest (`tools/bake-manifest-check.mjs` checks `nav-medium` and `nav-low`). The products are quality independent except the nav lattices; `node tools/baked-check.mjs medium|performance` compares source and bake.
* Tool defaults moved to medium (`tools/shot.mjs`, `tools/check.mjs`, `tools/baked-check.mjs`). The headless harnesses that build a fake context with `name: 'high'` (full density) and the browser tools that pass `q=low` are unchanged: a harness context does not go through the menu, and `q=low` now means medium.
* Not adopted from 102: the static-scene stage and the decoder-worker buffer split (n4spb has no baked static scene).

**Default tier (2026-10-17, later the same day):** `performance` is now the default on every device (it was medium on desktop and performance on phones); `?q=medium` or a remembered `piter.q` still wins, the quality menu lists Performance first. Phones keep the touch GPU overrides (shadow map 1024, MSAA 2).


## 2026-10-30: southern districts, normal baked loading

On the same RTX 3090 Ti / Edge (D3D11), 1280 x 720, medium quality, 20 s of
fixed throttle, no profiler or mid-run screenshots, the baseline checkout
`b2680c0` and final southern-port products gave the following. Times are milliseconds;
heap and backing are CDP `usedSize` and `backingStorageSize` in MiB.

| Area / run | Load s | Mean / p50 / p95 ms | Frames >40 / >80 ms | Mean draws | Distance m | Heap / backing MiB |
|---|---:|---|---|---:|---:|---|
| Palace baseline | 28.95 | 27.9 / 33.3 / 33.4 | 20 / 4 | 1359 | 380 | 409 / 729 |
| Palace final | 28.35 | 26.2 / 33.2 / 33.4 | 11 / 3 | 1261 | 355 | 412 / 721 |
| Kolomna final | 22.41 | 17.5 / 16.7 / 16.8 | 6 / 2 | 902 | 161 | 414 / 644 |
| Semyonovsky final (5.0.1) | 22.44 | 20.7 / 16.7 / 33.4 | 7 / 3 | 890 | 167 | 459 / 692 |

These are samples, not a precise performance comparison: traffic and final
positions differ. Both southern cars were wrecked in traffic during the
fixed-throttle runs, so neither is evidence of a continuous clear 20-second
drive. Headless car-physics routes without moving NPC traffic covered 849 m in
each area. All runs reported zero failed regions; visual screenshots loaded
the real scenes. The default strip car test passed entry, acceleration, nitro,
drift, braking and exit. The Semyonovsky road-surface audit remains over its
budget; see `docs/SOUTH-AREA-PORT.md`.

Reproduce with `node tools/drive-bench.mjs --area <area> --q medium --seconds
20 --start "x,z,yaw" --json --diagnostics --load-timeout 900000
--protocol-timeout 900000 --out <prefix>`: Palace start
`498.2286,135.1625,76.0322`, Kolomna `-3100,2058,93.71`, Semyonovsky
`-1849,2750,-178.32`. The matching baseline is a clean `b2680c0` checkout
with its own baked products. GPU captures under `shots/south-final/` and
benchmark JSON under `shots/south-perf/` are local diagnostic artifacts.

## 2026-10-31: Sea Gates and Okrug 65 (7.0.0)

RTX 3090 Ti / Edge 156 / D3D11, 1280 × 720, medium quality, normal shipping
bakes and 20 seconds of real W input. CPU audits, profiling and mid-run
screenshots were kept out of the measurement intervals. Baseline is the clean
`f55930c` tree with its matching committed bakes. Heap/backing are CDP MiB,
sampled after the drive; garbage collection was not forced.

| Area / busy-road attempt | Load s | Mean / p50 / p95 ms | Frames >40 / >80 ms | Mean draws | Distance m | Heap / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Palace baseline | 26.41 | 23.8 / 16.7 / 33.4 | 15 / 3 | 1177 | 352 | 417 / 715 |
| Palace final | 26.47 | 27.8 / 22.6 / 48.1 | 59 / 3 | 1384 | 379 | 547 / 1337 |
| Sea Gates final | 11.66 | 18.9 / 17.6 / 28.5 | 17 / 2 | 722 | 273 | 246 / 441 |
| Okrug 65 final | 16.12 | 19.1 / 17.6 / 31.4 | 16 / 2 | 728 | 281 | 449 / 519 |

Every attempt had zero failed regions. All four cars collided and ended
stationary, so these are streaming/frame-cost samples, not continuous clear
20-second drives. NPC collisions also changed the Palace endpoint and visible
work: final mean draws rose 17.6%, alongside a 16.8% mean-frame increase. The
final Palace loaded 39 regions versus 36 in the baseline; the raw memory
samples do not establish retained-memory growth.

A separate matched Palace camera at `498.2286,2,135.1625,76.0322,0`, frozen at
t=20, drew exactly **1,531 calls / 4,651,262 triangles** in both trees. Ninety
back-to-back renders measured **15.46 → 15.87 ms** (2.7% sample difference);
the two images are visually indistinguishable. All 84 Palace bake products
also have identical SHA-256 values before and after. This fixed-view diagnostic
does not replace the normal driving attempts above.

Reproduce the attempts with `node tools/drive-bench.mjs --area <id> --q medium
--seconds 20 --start "x,z,yaw" --json --diagnostics --out <prefix>`. Starts:
Palace `498.2286,135.1625,76.0322`, Sea Gates
`-6037.87275,2589.45754,-91.1664`, Okrug 65
`-7538.90,-6068.84,-104.4955`. Fixed-view diagnostic:
`node tools/shot.mjs --area palace --q medium --t 20 --cams
"498.2286,2,135.1625,76.0322,0" --eval "JSON.stringify(window.__bench(90))"`.
Local JSON/images are under `shots/coastal-perf/`.

Two additional normal-bake runs follow uninterrupted WHSD deck corridors, with
normal traffic and parked cars still enabled. Motorway decks are outside the
NPC lane graph, so both cars completed the full 20-second drive at 170 km/h,
with 100% body condition. End screenshots show each car on its mapped deck.

| Area / clear WHSD run | Load s | Mean / p50 / p95 ms | Frames >40 / >80 ms | Mean draws | Distance m | Heap / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Sea Gates | 13.84 | 18.2 / 17.6 / 18.6 | 8 / 0 | 552 | 856 | 229 / 431 |
| Okrug 65 | 16.25 | 18.9 / 17.6 / 31.9 | 10 / 0 | 687 | 857 | 440 / 540 |

These runs had no long tasks, no failed regions and no frames above 80 ms;
47/83 marine and 67/117 Okrug regions were resident at the end. Use the same
benchmark command with Sea Gates start `-7731.233,3210.042,-125.796095` or
Okrug 65 start `-6683.636,-7225.692,-5.965367`. Their local artifacts are
`shots/coastal-perf/clear-marine*` and `clear-okrug*`. Independent normal-Lada
physics runs on the same routes covered 848.69 m without collision, falling,
airborne frames or broken objects. The browser runs advance by real frame
time, accounting for their slightly longer distances.

The final normal-bake browser test (`tools/coastal-playtest.mjs`) passes 41
checks: visible E prompts, ship thrust/steering/braking, both chase views and
the forward helm, safe exit/respawn, both ordinary boats, the purple Zhiguli
and walking through the fountain. The existing car input/Anichkov deck test
passes; its saved damaged-car sequence contains one camera-occluded stopped
frame, documented in [COASTAL-AREAS.md](COASTAL-AREAS.md).

Four integrated depth probes at the new viewpoints measure 0–0.004% noisy
pixels, below 0.02%; both area images and the ship views were inspected. Both
full boat-passage suites pass (95 marine / 58 Okrug), including five sailed
routes, with zero invisible hull-height collision surfaces. The unchanged
Palace passage regression passes 108 checks. Geography, dry islands, bridge
floors, garage/view poses, claims and water access pass. New landmarks add no
frame callbacks; the ship uses bounded moving LODs.

Both road wrappers pass. Okrug retains **140 / 520,977 procedural surface
samples (0.0269%)**, locked as its explicit baseline; all other areas retain
the 120-sample cap. No material/geometry exemption was added. Bespoke bridge
and landmark surface intrusions are cleared. The historical strip residual
rate is 91 / 221,118 (0.0412%). Marine retains 28 samples within its 120 cap.
