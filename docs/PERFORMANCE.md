# Performance — what costs what, what was done, how to measure

## 2026-11-03: wreck overlay and castle road furniture (9.4.2)

The wreck overlay remains visible with the HUD hidden; screenshot mode still
hides it. Castle bank fence bays now leave a clearance at drawable service
roads. The three custom castle bridge decks retain their breakable railings;
the furniture audit recognises those deck-edge rails as bridge-owned instead
of treating the adjoining service ways as if they covered the whole deck.

The strip strict furniture audit changes from 74 on-road / 150 edge / 41 median
records to 0 / 29 / 41. The 29 edge records have positive road clearance; the
41 median records are on medians at least 7.5 m wide. These are reported as
observations, not strict failures. The separate informational signal stop-point
check still reports 259 points within a foreign carriageway; this change did
not address traffic stop placement. The live Palace area's broader furniture
audit still fails on 15 records: 11 cathedral cannon-fence records, two Liteyny
bridge rail bays and two Mars-field palace fence bays. One additional quay
stone is allowed by the audit. These findings are outside the old strip's 74
records and have not been resolved by this change.
The Palace water-reachability suite passed 22 checks, including water entry
and the castle moat, but its fence-collider inventory found one unrelated
streets guard-rail record without a box at (645.1, -128.7); the suite remains red.

## 2026-11-03: Liteyny markings, vehicle lenses and lane joins (9.4.1)

Liteyny and Bolsheokhtinsky now use the shared road-marking plan on their
raised slabs and approach ramps. Paint follows the slab tessellation instead
of adding a second, generic five-stripe layout. Two-arm way seams reserve
longitudinal blending room and use curves with lane-aligned end tangents;
the former 1–2 m sideways connectors caused the conspicuous left/right NPC
heading swings. The fleet's existing shared lamp material now retains a pale
reflector and fluted lens when its per-instance lamp power is zero. No vehicle
geometry, instance layout, extra material or frame callback was added.

Troitsky's northbound crossing prefers Kronverk inside a registry approach
corridor. The normal edge eligibility and heading checks still apply. The
gate and registry edits are runtime-only; the road edits require all sixteen
live area bakes.

Focused CPU verification: raised marking geometry on both Neva bridges,
two real embankment seam regressions, 2,966 unchanged stationary NPC poses
and 58,273 moving poses, three-minute regional traffic runs at Liteyny and
Vosstaniya, two-minute runs at Bolsheokhtinsky and Moskovsky Prospect,
23-kind fleet upload goldens, fleet damage isolation, lane storage, roof/
divider/flower-panel regressions, 95 gate checks, 572 area checks, closure
lint and runtime-only classification. Traffic runs stay within the existing
overlap tolerance and report zero red-light, off-lane, teleport or NaN failures.
Troitsky route checks cover walking, driving and flying, both lanes/pavements,
and 18/30/60 m/s vehicle approaches.

Audit limits are compared with HEAD through a scratch Node loader, without
changing the working source. `npm run markings` passes. Palace and Smolny's
full strict marking audits each retain the same one signalised approach
without a stop bar; solid coverage stays 95.6% / 95.5%. The 400 m Liteyny
window retains the same 82.3% coverage failure, zero longitudinal line points
inside junction boxes and 100% solid-plan geometry coverage. The strip road
furniture audit retains 74 on-road, 150 edge and 41 median records, with the
same causes as HEAD; surface and ribbon checks pass. These older audit
failures are not counted as repaired by this round.

Normal-loading drive comparisons use Edge / ANGLE D3D11 / RTX 3090 Ti,
1280 × 720, medium, full traffic/population/shadows, twelve seconds of W,
no profile or mid-drive screenshot, with CPU audits and other GPU jobs stopped.
The baseline is 6ea8107 with its matching bakes. Evidence and reproducible
commands are in `shots/liteyny-lines/`; CDP heap and backing storage are
reported separately after each run.

| Run | Ready (s) | Travel (m) | Mean / p50 / p95 / max frame (ms) | Frames >40 / >80 ms | Mean draws | CDP used / backing (MiB) |
| --- | ---: | ---: | --- | --- | ---: | --- |
| Liteyny before, 12 s | 31.57 | 148 | 23.62 / 16.7 / 33.4 / 616.8 | 11 / 6 | 865 | 538 / 1398 |
| Liteyny final, 12 s | 32.65 | 140 | 25.62 / 16.7 / 50.0 / 550.2 | 41 / 6 | 767 | 536 / 1374 |
| Vosstaniya before, 12 s | 30.85 | 371 | 32.44 / 33.3 / 50.1 / 400.0 | 48 / 6 | 1302 | 514 / 1408 |
| Vosstaniya final, 12 s | 30.51 | 351 | 37.72 / 33.3 / 66.6 / 583.4 | 88 / 8 | 1265 | 495 / 1205 |
| Vosstaniya before, 8 s | 32.95 | 267 | 31.96 / 33.3 / 50.1 / 66.8 | 45 / 0 | 1292 | 483 / 1249 |
| Vosstaniya final, 8 s | 28.00 | 266 | 22.82 / 16.7 / 33.4 / 33.5 | 0 / 0 | 1303 | 481 / 1099 |

The twelve-second pairs stop at different traffic/collision positions: Liteyny
(-127,-2017) / (-121,-2009); Vosstaniya (146,19) still moving / (159,44)
stopped. The shorter old-centre pair was added to check the apparent slowdown
before those divergent endpoints: both end at roughly (240,71), at 156 km/h,
with nearly identical draw counts. It shows no repeatable structural slowdown;
the results do not establish an FPS improvement percentage. The longer routes
retain substantial hitches and do not establish comfortable 30 FPS throughout
the city. Streaming/GC and dense integrated-scene work remain the next
performance investigation, separate from this visual/traffic correction.

Reproduce with `node tools/drive-bench.mjs --area palace --q medium --seconds
12 --start "-127.8,-1869,357.1" --json --diagnostics --out shots/liteyny-lines/local`
and the same command with `--start "498.2286,135.1625,76.0322"`. For the matched
short segment use `--seconds 8`. The before runs use the same commands in an
untouched 6ea8107 worktree with its own matching source and bake. All six runs
report zero module and region-loading failures.

Final normal-loading review inspected the supplied Liteyny eye-height view,
the raised approach from above and in reverse, Kutuzov Embankment,
Shpalernaya and Nevsky, plus close daylight/night fleet lenses. The red-car
entry, acceleration/nitro, collision response, camera/cockpit, braking and exit
script passes with `--params "gates=0" --nofuzz`: its first unscoped run left
the page at nitro speed and lost the old document's test hooks. Area switching
was checked separately with real walking input and normal baked loading:
Troitsky (roughly -1412,-2039) → `kronverk.html`, arriving near (-1418,-2052)
on foot, automatically playing after the veil clears, with no page/module
errors. Existing duplicate-texture and D3D shader warnings remain.
All sixteen final manifests are fresh: 1,869 complete products, 756.2 MiB gzip.

## 2026-10-31: coastal districts integrated with Petrograd, 8.0.0

The final scene has 15 live pages. Морские ворота and Округ №65 use normal
local region loading; their landmarks, fixtures and ship are not constructed
in the old centre. All 1,464 bake products pass revision, size and SHA checks
(676.5 MiB gzip). The final four northern revisions include the shared Yacht
Bridge's 468 collidable, breakable concrete divider panels: six dynamic cell
meshes, 260 m detail range, no new frame callback. Kronverk's 120 and
Aptekarsky's 81 products remain byte-identical through that bridge-only change.

These final-bake runs use Edge 156 / ANGLE D3D11 / RTX 3090 Ti, 1280 × 720,
medium, full traffic/population/shadows. GPU jobs ran serially; all CPU audits
and software-rendering jobs had stopped before timing. Each run holds W for
20 seconds, with no profile or intermediate screenshot. The before checkout
is clean `70b1d80` (completed Petrograd 6.0.0) with its own matching bakes.
Logs, JSON and inspected final screenshots are in `shots/coastal8-perf/`.

| Run | Intro ready (s) | Travel (m) | Frame mean / p50 / p95 (ms) | Max (ms) | Frames >40 / >80 ms | Mean draws | CDP used / backing storage (MiB) |
| --- | ---: | ---: | --- | ---: | --- | ---: | --- |
| Vosstaniya before | 26.05 | 352 | 23.35 / 17.8 / 35.8 | 299.8 | 17 / 3 | 1231 | 575 / 1336 |
| Vosstaniya final | 26.32 | 379 | 24.48 / 17.9 / 36.0 | 287.6 | 19 / 2 | 1359 | 417 / 729 |
| Admiralty before | 27.59 | 116 | 23.35 / 17.8 / 35.7 | 234.4 | 13 / 3 | 1156 | 488 / 1144 |
| Admiralty final | 27.45 | 117 | 27.11 / 18.6 / 36.7 | 266.7 | 26 / 4 | 1420 | 488 / 1206 |
| Морские ворота final | 11.44 | 855 | 18.80 / 17.5 / 30.2 | 62.4 | 14 / 0 | 562 | 249 / 427 |
| Округ №65 final | 14.22 | 763 | 19.77 / 17.6 / 32.7 | 396.7 | 17 / 2 | 720 | 436 / 564 |

The old-centre pairs use identical starts and input, but traffic collisions
produce different stopped positions/camera directions; all four end damaged
at zero speed. Thus the observed +1.13 ms/frame at Vosstaniya and +3.76 ms at
Admiralty are not isolated same-view coastal overhead measurements. Their
retained memory, visible draws and post-drive render diagnostics also describe
different final views and GC states. The Palace and Admiralty bake products
are byte-identical to `70b1d80` (84 and 89 files respectively).

The marine drive finishes at 170 km/h with an intact car. Okrug's straight-W
probe ends wrecked near the road curve at Bogatyrsky Prospekt; its 763 m and
two long hitches must not be presented as uninterrupted driving at speed.
Both new routes average above 50 FPS, but **comfortable 30 FPS is still not
consistently reached throughout the old centre**: paired p95 values exceed
33.3 ms, and each has multiple frames above 80 ms. The next investigation
remains a separate CPU profile of draw submission and region/GC hitches;
these unprofiled runs do not establish which long task caused each stall.
All six runs have zero page/module errors, no failed bake products and no
failed regions. CDP heap and backing storage are sampled after driving and
reported separately; the console's instantaneous aggregate heap is not used.

The final normal-bake ship/boat/water browser test passes 41 checks. Its
separate short ship sample (three seconds W, then three seconds W+A, no
screenshots during measurement) records 306 frames: mean/p50/p95
19.61 / 17.6 / 32.7 ms, max 57.4 ms, 8 frames above 40 ms and none above 80 ms,
421 mean draws, 13 km/h at the end and no failed regions. This is a six-second
control sample, not a 20-second car benchmark. Inspected screenshots show
boarding, the complete loaded ship, helm view and walking in fountain water.
The Okrug–Islands walking crossing passes in both directions with no splash,
missing veil or backwards progress frame. Final bridge views show the shared
profile and both concrete divider runs. The relocated printworks lamp and
restored stadium seating are also verified in normal baked views.
The final Palace car-control test passes entry, acceleration, nitro, drift,
braking and exit (`--nofuzz`); its logs and views are in `shots/coastal8-car*`.

Reproduce (run the first two commands in the before checkout as well):

```powershell
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/coastal8-perf/palace-after
node tools/drive-bench.mjs --area admiralty --q medium --seconds 20 --start "-2493.919,-687.663,-52.605" --json --diagnostics --out shots/coastal8-perf/admiralty-after
node tools/drive-bench.mjs --area morskie-vorota --q medium --seconds 20 --start "-7731.233,3210.042,-125.796095" --json --diagnostics --out shots/coastal8-perf/marine-after
node tools/drive-bench.mjs --area okrug65 --q medium --seconds 20 --start "-6683.636,-7225.692,-5.965367" --json --diagnostics --out shots/coastal8-perf/okrug65-after
node tools/coastal-playtest.mjs --ship-perf --out shots/coastal8-final
node tools/drive-test.mjs --area palace --q medium --nofuzz --out shots/coastal8-car
node tools/edge-smoke.mjs --from okrug65 --to islands --ret --mode walk --out shots/coastal8-edge
```

## 2026-10-31: Petrograd and northern islands, 6.0.0

The three planning-map territories now ship as `kronverk`, `aptekarsky` and
`islands`; provenance, coverage and the water/knock adaptations are in
[PETRO-AREAS.md](PETRO-AREAS.md). Source landmarks and fixtures are scoped to
their page. They are not constructed or simulated in the old centre.

Measurements below use Edge / ANGLE D3D11 / RTX 3090 Ti, 1280 × 720, medium,
full scenery/population/shadows, ordinary fresh baked loading. GPU jobs ran
serially without CPU audits during the timed intervals. Each drive holds W for
10 seconds; JSON, diagnostics and screenshots are retained locally under
`shots/perf/petro-*`. Baseline is detached `f55930c` (the old 5.0.1 game plus
unintegrated area data), with its matching original bakes. The final revision
is 6.0.0, with all 13 live-area bakes fresh.

| Run | Intro ready (s) | Travel (m) | Frame mean / p50 / p95 (ms) | Max (ms) | Frames >40 / >80 ms | Mean draws | CDP used / backing storage (MiB) |
| --- | ---: | ---: | --- | ---: | --- | ---: | --- |
| Vosstaniya baseline, paired | 31.6 | 345 | 29.4 / 34.6 / 44.4 | 315 | 24 / 3 | 1291 | 477 / 1347 |
| Vosstaniya final, paired | 28.7 | 345 | 34.5 / 35.0 / 54.1 | 336 | 51 / 4 | 1270 | 497 / 1327 |
| Admiralty baseline | 33.1 | 95 | 36.0 / 35.0 / 53.5 | 257 | 42 / 5 | 1122 | 444 / 1134 |
| Admiralty final | 36.2 | 122 | 42.2 / 35.4 / 69.6 | 300 | 85 / 5 | 1313 | 461 / 1214 |
| Kronverk final | 29.6 | 92 | 23.8 / 17.8 / 35.9 | 176 | 11 / 3 | 981 | 646 / 777 |
| Aptekarsky final | 19.7 | 47 | 21.3 / 17.7 / 35.2 | 265 | 16 / 3 | 1085 | 383 / 616 |
| Islands final | 27.3 | 380 | 20.6 / 17.6 / 35.3 | 81 | 3 / 1 | 874 | 299 / 386 |

The paired Vosstaniya runs cover the same route and end at approximately
`(164,50)`. Their observed change is **+5.1 ms/frame**, +20 MiB retained JS and
−20 MiB backing storage, with similar draw counts. An earlier final run was
44.7 ms versus the original morning baseline's 32.1 ms; the paired rerun reduces
that timing uncertainty but does not establish a performance improvement.
Admiralty's traffic/obstacle encounters differ (95 versus 122 m, both stopped
at the end), so its frame/draw increase is not a same-view overhead estimate.
Kronverk and Aptekarsky also stop before the interval ends; their numbers must
be read with their short travel distances. Islands covers 380 m and finishes
at 169 km/h. These are driving probes, not a guarantee of sustained road speed.

**Comfortable 30 FPS is not consistently reached in the old centre.** The final
paired centre render diagnostic still takes 18.1 ms of JS submission for 1145
draws (baseline 14.0 ms / 1197); timed centre runs also have 4–5 frames above
80 ms while regions attach. The next performance investigation is separate CPU
sampling of draw submission and those streaming/GC hitches, including the live
tuft-road rejection query; fewer draws alone have not solved frame timing.
The new districts themselves average approximately 42, 47 and 49 FPS on these
routes. No timed run has a page/module error or failed region.

Reproduce the final drives (use the baseline checkout for the before runs):

```powershell
node tools/drive-bench.mjs --area palace --q medium --seconds 10 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/perf/petro-after-paired
node tools/drive-bench.mjs --area admiralty --q medium --seconds 10 --start "-2493.919,-687.663,-52.605" --json --diagnostics --out shots/perf/petro-admiralty-after
node tools/drive-bench.mjs --area kronverk --q medium --seconds 10 --start "-2268.888,-2758.424,-153.99" --json --diagnostics --out shots/perf/petro-kronverk
node tools/drive-bench.mjs --area aptekarsky --q medium --seconds 10 --start "-1942.856,-3160.215,25.586" --json --diagnostics --out shots/perf/petro-aptekarsky
node tools/drive-bench.mjs --area islands --q medium --seconds 10 --start "-5163.95,-4261.441,4.894" --json --diagnostics --out shots/perf/petro-islands
node tools/drive-test.mjs --area palace --q medium --nofuzz --out shots/perf/petro-controls
```

The car control test passes entry, acceleration, nitro, drift, braking and exit.
Aurora's nested distant mass retains the real hull/waterline, three funnels,
deck houses and tall masts with **3014 triangles / four post-batch meshes**,
shared untextured factory materials and an authored 1400 m range. The detailed
model remains local. It uses no new textures, update callbacks or shadow draws;
near and opposite-bank views were checked on the final bake. Northern final
logs use `petro-kronverk-shipping`, `petro-islands-shipping` and
`petro-aptekarsky-mass-shipping`.
Normal-loading views cover the fortress and timber bridge, botanical garden,
TV tower, Aurora, Yelagin Palace and park canals, including camera turns and
teleports. Palace–Kronverk and Kronverk–Aptekarsky browser crossings pass in both
directions, including destination loading and the transition veil. The smoke
harness now selects an approach with the full registry machine: its former
coarse selector could aim for a third district in a multiple-area overlap.
The complete bake has 1236 products / 613.6 MiB gzip. New pages contribute
58.1 MiB (Kronverk), 31.8 MiB (Aptekarsky) and 24.5 MiB (Islands); separate
pages retain local region loading rather than loading all districts together.
The closure lint, revision sync, generated HTML and version checks pass.
The final imported-source whitespace cleanup changed only revision names:
all 81 Aptekarsky and 98 Islands products are byte-identical to the tested
snapshot (`bake-product-compare.mjs`, no ignored timing differences).

Focused verification: topology/arrivals **490/0**, gate machine **95/0**;
water access **18/0, 18/0, 17/0** and real boat-passage **88, 46, 140** passes
for Kronverk, Aptekarsky and Islands respectively. All three garages and their
boat hull/boarding/exit checks pass. Car handoffs retain the car in all sampled
arrivals (256, 276 and 236). Layout/claims cover all 15 registry rows. The knock,
signals, ported solids, fixture cells, shadow sectors and authored LOD focused
regressions pass. All 18 landmark tree generators pass 8784 frustum queries.

Known audit limits remain explicit: Kronverk's surface audit has **127 residual
samples / 33 clusters against the 120-sample budget** (paving/median/end seams).
Aptekarsky (108 residual samples) and Islands (45) surface/ribbon audits and all three strict furniture
audits pass. New-area marking audits pass. Castle railing intrusion on the old
strip, marking failures in Palace/Smolny/Vladimirsky/Dekabristov, and the old
Ostrovsky static tree splitter's Infinity-to-2500 range assertion all reproduce
on the untouched baseline. Those full suites are not reported as passing.

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

## 8.1.0: Lakhta, three flagpoles, waterfront and quay boarding

The comparison uses the shipping 8.0.0 snapshot at `7d86b8d` and the final
8.1.0 source with matching bakes. All runs use Edge 156.0.4314.50, ANGLE
D3D11 on the RTX 3090 Ti, 1280 × 720, medium quality, normal baked loading,
normal traffic/crowds/shadows and 20 seconds of real driving input. GPU jobs
were serial; build and CPU audit jobs finished before the timed intervals.
No profiling, mid-run screenshot, reduced scene or forced stale bake was used.
The 8.0.0 runs were recorded earlier the same day on this machine; these are
single samples, not a controlled claim that this release improves FPS.

| Area / release | Load s | Mean / p50 / p95 / max ms | Frames >40 / >80 ms | Mean draws | Distance m | Heap / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Palace 8.0 | 26.32 | 24.5 / 17.9 / 36.0 / 287.6 | 19 / 2 | 1359 | 379 | 417 / 729 |
| Palace 8.1 | 26.09 | 24.1 / 16.7 / 33.4 / 266.6 | 9 / 4 | 1243 | 354 | 539 / 1327 |
| Admiralty 8.0 | 27.45 | 27.1 / 18.6 / 36.7 / 266.7 | 26 / 4 | 1420 | 117 | 488 / 1206 |
| Admiralty 8.1 | 27.74 | 23.4 / 16.7 / 33.4 / 233.2 | 11 / 3 | 1136 | 111 | 481 / 1261 |
| Sea Gates 8.0 | 11.44 | 18.8 / 17.5 / 30.2 / 62.4 | 14 / 0 | 562 | 855 | 249 / 427 |
| Sea Gates 8.1 | 13.30 | 16.7 / 16.7 / 16.8 / 66.7 | 1 / 0 | 559 | 856 | 258 / 432 |
| Okrug 65 8.0 | 14.22 | 19.8 / 17.6 / 32.7 / 396.7 | 17 / 2 | 720 | 763 | 436 / 564 |
| Okrug 65 8.1 | 15.40 | 16.7 / 16.7 / 16.8 / 16.9 | 0 / 0 | 695 | 857 | 441 / 587 |

All four final runs have zero failed regions. Both coastal cars finish on
their WHSD decks at 170 km/h and 100% body condition; their end screenshots
were inspected. The Okrug baseline stopped near the road curve, so its shorter
distance and hitch count are not directly comparable to the completed run.
Both centre attempts end wrecked after collisions, with different endpoints,
visible work and resident regions: Palace 39 → 37, Admiralty 38 → 40. Their
lower draw/frame samples do not establish a performance improvement.
Comfortable driving at a consistent 30 FPS is still not achieved in the busy
old centre: the final p95 is 33.4 ms and several frames exceed 80 ms.

Every one of the **84 Palace and 89 Admiralty** bake products has identical
SHA-256 content before and after this change. Ordinary rectangular collision
paths retain their existing arithmetic; 5,004 exact physics comparisons pass.
The heap columns are CDP `Runtime.getHeapUsage` samples after timing, with
`usedSize` and `backingStorageSize` reported separately. They are not retained
heap measurements. A separate matched-working-set GC diagnostic resolves the
larger Palace backing sample: at the same walking pose after 20 s settling,
baseline/current both retain 28 regions, 7,112 scene objects, 3,932 geometries,
the same loaded products and 393.94 MiB of scene-referenced buffers. Explicit
GC changes baseline heap/backing **510.00/1302.54 → 369.49/693.65 MiB** and
current **504.92/1276.48 → 369.85/693.64 MiB**. The retained delta is +0.36 MiB
JS and −0.009 MiB backing; the large removed allocations are collectible while
scene counts stay unchanged. This controlled sample finds no meaningful
retained growth and does not revise the timed FPS figures. Evidence:
`shots/lakhta-palace-memory-pair.json`, its log and baseline/current screenshots.

Reproduce with `node tools/drive-bench.mjs --area <id> --q medium --seconds 20
--start "x,z,yaw" --json --diagnostics --out <prefix>`. Starts:
Palace `498.2286,135.1625,76.0322`, Admiralty
`-2493.919,-687.663,-52.605`, Sea Gates
`-7731.233,3210.042,-125.796095`, Okrug 65
`-6683.636,-7225.692,-5.965367`. Raw before/after artifacts are under
`shots/coastal8-perf/` and `shots/lakhta-perf/`.

The normal-bake browser playtest passes **42 checks**, including visible stern
E boarding from dry quay pavement, a 45-second departure into open water,
steering, both chase cameras and the bridge helm, braking, exit/respawn, both
ordinary boats, the purple car and walking in the fountain. Its separate
48-second ship sample measures mean/p50/p95 **16.68 / 16.7 / 16.8 ms**, max
33.4 ms, 380 mean draws, zero frames above 40 ms and zero failed regions.
The berth and route changed, so this is not an FPS comparison with the old
offshore sample. Okrug 65 ↔ Islands normal walking hand-offs pass both ways,
including the loading veil and monotone progress checks.

Final normal-bake views cover the whole Lakhta complex, all three masts,
the reported waterfront camera and the reported WHSD joint. The tower has
61,981 triangles and no frame callbacks; the three masts have 12,238 triangles,
nine bounded dynamic meshes and no new callbacks or textures. A real knock
test checks 2.86 million transformed vertices through all three mast falls;
the foot-centred spheres stay finite at 205–211 m and contain every part.
The waterfront regression tests 28,409 surface triangles against actual road
coverage, 128 rendered-slope raycasts, 23 shore walks and six actual boat
courses beneath the island bridges. The coastal bridge proof covers 38,199
full-width corner poses and 16,312 face poses, plus real walking/car crossings
and the two physical Sea Canal decks. Railings remain independently knockable.

All 17 final ownership audits pass. Marine/Okrug water checks pass 17/17 each,
boat passage passes 105/105 and 54/54, both road wrappers pass with the unchanged
Okrug **140 / 520,977** residual baseline, and strict marking coverage is 100%.
Both legacy layout goldens are identical. Recorded normal page loads fetch
no dependencies outside their closures; all nine broken-scanner mutants are
still detected. Final manifests verify **1,463 complete products / 676.5 MiB
gzip** across all 15 live areas. The additional legacy Palace boat-craft pinch
test still reports the same 2.86 m float-block displacement at `-2114,-1038`
on both clean 8.0.0 and 8.1.0; the normal Palace boat/profile suite passes 28/28.

## 8.2.0 — slow waterfront flags (2026-10-31)

Only the three Park 300 textiles change. Two travelling waves have approximately
14 s and 9.7 s periods; their fixed hoists, sewn colour boundaries and historical
emblem use the same local surface. Analytic normals and matching sun/point shadow
materials read the existing shared clock. There are no additional CPU update
callbacks, per-frame geometry uploads, triangles, draws or textures. The new
vertex coordinates total 100,272 bytes. Steel, colliders and knock records are
unchanged. Full-phase bounds stay finite even after the complete mast falls.

All GPU work ran serially in Edge 156 / RTX 3090 Ti, medium quality. The normal
shipping bake is used throughout. Baseline is clean 8.1.0 (`ce7879c`); current is
8.2.0. Twenty-second, full-throttle driving samples, with no profiling or mid-run
screenshots, give:

| Route | Load s before → after | Frame ms mean / p50 / p95 before → after | Max ms | Frames >40 / >80 ms | Mean draws | Distance m |
| --- | --- | --- | --- | --- | --- | --- |
| Okrug WHSD | 16.89 → 15.97 | 16.93 / 16.7 / 16.8 → 17.16 / 16.7 / 16.8 | 33.5 → 250.1 | 0 / 0 → 2 / 2 | 688 → 698 | 857 → 840 |
| Palace / Nevsky | 27.65 → 27.88 | 24.83 / 16.8 / 33.4 → 26.12 / 33.2 / 33.4 | 266.8 → 300.0 | 14 / 3 → 13 / 4 | 1178 → 1361 | 352 → 380 |

Traffic outcomes differ: Okrug ends at 170 → 142 km/h and loads 66 → 67 regions;
both centre runs wreck the car at different positions and load 36 → 39 regions.
Every run has zero module, asset or region failures. End-of-run CDP JS heap /
backing storage is **464 / 584 → 438 / 588 MiB** for Okrug and
**560 / 1330 → 473 / 740 MiB** for Palace. These are point-in-time samples with
different region and GC states, not retained-memory measurements. The unchanged
Palace source closure and bake contain no flag-animation code. Existing centre
hitches remain unresolved; sustained comfortable driving is still unfinished.

A separate 60-frame stationary rendering diagnostic faces the nearby USSR flag
at `-8840,145,-5550,168,0`, 1400 × 900, t = 0. It measures **4.38 → 5.18 ms**,
with identical **296 calls, 2,965,465 triangles, 375 geometries and 34 textures**.
Programs increase 86 → 88 for the animated colour/shadow paths. This is a local
render-cost sample, not driving FPS. Normal scene screenshots at t = 0, 4 and 8
show slow fold/silhouette changes and the attached emblem. Browser assertions
confirm all three flags, moving shadow materials, unchanged CPU position buffers
and zero scene errors. Nearby, distant and beach views were inspected.

The focused regression passes **1,585,551** full-cycle wave samples, **20,493**
fixed-hoist checks and **5,140,590** transformed vertex checks through all three
real 75 km/h knockdowns and 181 settling frames. Maximum quarter-second free-edge
movement is 0.517 m; cloth draw spheres remain 210.99 m. Analytic normals agree
with independent finite differences. The material patch preserves shared toon
paint, stays local to these flags and is safe when a builder reuses its cache.

Only Okrug needs a new revision (`6404d328ebb4fb1a884c`); all **130** world
products are byte-identical to the baseline. All 15 manifests remain fresh.
Recorded page-load closure coverage, closure tests, the existing 140-sample road
baseline and 100% strict marking coverage pass. Reproduce with the driving
commands and starts in the previous section; artifacts are in
`shots/flags-wave-perf/` and `shots/flags-wave/` (baseline artifacts in the frozen
`n4spb-coastal` worktree). Run `node tools/area.mjs okrug65
tools/three-flagpoles-test.mjs` for the focused CPU proof.

## 9.0.0 — Moskovskaya Zastava (2026-11-01)

The new separately streamed area covers 14.39 km² of the planning footprint,
including boundary overlaps. It adds the researched Victory Park, its nine
surveyed ponds and islands, Strugatsky Square, the National Library, House with
Spire, Chesme ensemble, district council and SKA Arena. Static landmark content
uses the existing batching, atlas and spatial registration paths; the park adds
no frame callbacks. Area-local ownership tables and inland bridge adapters keep
the other area closures unchanged. The Moscow Gate fix is also baked into
Semyonovsky: the actual columns remain solid and the openings admit a car under
the elevated entablature.

All timed GPU work ran serially in Edge 156 / RTX 3090 Ti, medium quality,
1280 × 720, with normal shipping bakes and the full scene enabled. CPU audits
and diagnostics ran outside the twenty-second full-throttle intervals. Baseline
is clean 8.2.0; final source/bake is 9.0.0.

| Route | Load s | Frame ms mean / p50 / p95 | Max ms | Frames >40 / >80 ms | Mean draws | Distance m |
| --- | ---: | --- | ---: | --- | ---: | ---: |
| Admiralty, before | 30.21 | 31.21 / 33.3 / 50.0 | 183.5 | 71 / 6 | 1956 | 133 |
| Admiralty, after | 24.22 | 22.00 / 16.7 / 33.4 | 133.4 | 15 / 4 | 1057 | 98 |
| Station / Nevsky, after | 24.20 | 20.70 / 16.7 / 33.4 | 183.4 | 5 / 3 | 1241 | 354 |
| Moskovsky Prospekt, new area | 14.34 | 17.24 / 16.7 / 16.8 | 133.4 | 5 / 3 | 1057 | 190 |

These correspond to approximately 32 → 45 FPS at Admiralty, 48 FPS at the
station and 58 FPS in the new district, using the reciprocal mean frame time.
Traffic and crash positions differ: every sample ends with a wrecked car, and
the new-area car is deflected toward the park. These are collision-truncated
drives, not uninterrupted straight-road cruises. The identical Palace closure
and bake (`989178ba0ec91ea7e4b5`) contain none of the new district content, so
the before/after differences are not evidence of a performance improvement.
Existing centre hitches remain; sustained comfortable driving is still unfinished.
Next measured bottlenecks remain old-centre draw volume and streaming/GC hitches.

End-of-run CDP JS heap / backing storage, recorded separately, is **550 / 1315 →
427 / 696 MiB** at Admiralty, **590 / 1337 MiB** at the station and **411 / 582
MiB** in Moskovskaya. Loaded regions are 50 → 51, 37 and 53 respectively.
These are point-in-time values with different region, traffic and GC states,
not retained-memory comparisons. Every run has zero browser/module errors and
zero failed regions. An initial new-area diagnostic at `-1707,7050,180` travelled
only 25 m before collision and is not the main new-district sample.

Reproduce with `node tools/drive-bench.mjs --area <id> --q medium --seconds 20
--start "x,z,yaw" --json --diagnostics --out <prefix>`. Use area `palace`,
start `-2493.919,-687.663,-52.605` for Admiralty; area `palace`, start
`498.2286,135.1625,76.0322` for the station; and area `moskovskaya`, start
`-1712,7050,1.62` for the surveyed northbound Moskovsky lane. Raw samples and
end screenshots are in `shots/moskovskaya-perf/`.

Normal-bake browser playtesting passes **22 checks**: walking, the single purple
Lada, real E boarding, acceleration, camera input, braking, exit and respawn;
boat boarding, a 60 m departure, steering, braking and exit; destination preloads;
and actual walking transitions to/from Semyonovsky in both directions. The
normal page loads in 14.78 s. The five final landmark/park screenshots were
inspected. Normal-bake pixel probes cover the park, square, library, spire and
church; worst frame is **0.003%**, with no repeat-frame movement or reported
offender. Evidence: `shots/moskovskaya-playtest/` and the area z-fight artifacts.

CPU verification includes all **572** area checks, the new area's 210 checks,
both transition-car grids (40 new-area and 272 Semyonovsky arrivals, none lost),
223,255 finite landmark vertices, the square's mapped lawns/seats/plaque, all
11 dry island probes and nine real park boat accelerations. Water reachability
passes **15/15**, boat passage **14/14**, and the strict furniture/marking checks
pass. Ownership reports 164 claimed IDs with no problems or warnings; 51,397
facade items have no collisions or floating signs. Both legacy layout goldens
are identical. Moscow Gate passes six car crossings in both directions, solid
column/overhead/roof assertions and the regression mutant.

The new-area road surface audit retains **180 / 504,436 (0.03568%)** shared
generator edge samples, below the existing contract; detailed causes and the
measured per-area budget are in [MOSKOVSKAYA-AREA.md](MOSKOVSKAYA-AREA.md).
The additional wall audit is **not fully clean**: one unexplained low sample on
`w72573681` reproduces with the pre-area generator over the new data. Roofs,
floors, winding and ownership are clean; no facade exemption was introduced.
Its exact location and reproduction commands are recorded in the area guide.

Closure/import/runtime lints, scoped ownership generation and recorded normal
page-load coverage pass, with zero dependencies outside the closure. All nine
closure-scanner mutants are detected. All **16** live-area manifests are fresh:
**1,612 complete products / 730.8 MiB gzip**. Moskovskaya contributes **149
products / 54.4 MiB gzip**, revision `643d01461ae3592d437f`; the Moscow Gate fix
uses Semyonovsky revision `d5b9b2d1d9c8c5361ad4`.

## 9.0.1 — solid park banks and supported fixtures (2026-11-01)

The reported Victory Park defects came from shared generators: quay decals
were placed at bridge gaps without a supporting wall, bridge rails had free
bar ends, hedges lacked end faces, and shoreline filtering erased real island
edges. Natural banks were rendered above a separate flat-ground/water-bed
height query, allowing the player to fall through the visible border.
Rendering and walking now use the same bank triangles, including a submerged
return to the bed. Width fitting prevents neighbouring banks from overlapping;
short corners and closed seams retain complete faces. Exact water-boundary
splits preserve open joins without discarding surveyed island shores.

All **16** live-area fixture audits pass, and **282** water-reachability checks
pass. Final source-frozen Palace, Kolomna and Moskovskaya fixture/water/boat
reruns pass all nine suites: boat counts are 108, 99 and 14 respectively.
The hedge audit checks 6,309 real runs across all 16 areas, individual closed
topology and 140,206 front-side rays; the Academy's five bespoke hedges are
also closed. Missing-face, reversed-cap, unsupported-fixture and missing-post
mutants fail. The generic knock suite passes all 16 cases.

The actual player completes 44 two-way Moskovskaya bank routes across all
nine named park ponds and 11 water records, with 793 rendered-surface rays;
Palace adds two routes and Kolomna 27. A retained Kolomna overlap regression
adds four walking directions, 4,010 height/physics probes and 390 mesh rays.
An independent strict park audit checks 125,146 rendered-grass samples,
35,789 dry-shore probes and 2,554 final convex ground cuts with no missing
faces, inverted triangles, phantom banks or physics mismatch. These checks
exercise the complete production module set, including the park bridges.
The Moskovskaya environment remains within its existing geometry contract:
**893,242 / 980,000 triangles**, 37 materials, 850 meshes, 84 instance types
and seven existing update callbacks. Width-detection samples are removed from
broad unchanged straight banks before drawing; no budget was raised.

The wider audit is **not wholly green**. Smolny has two boat-pillar checks
failing, and Kronverk has one dynamic ram check failing; each reproduces at
the unchanged `522d0bb` baseline. Palace's existing furniture violations and
one missing stop bar also reproduce there, with identical counts; its road
surface and ribbon checks pass. Moskovskaya's road and strict marking checks
pass with the documented pre-existing surface-edge residue. No exemptions
were added. Exact locations and repro commands are in
[MOSKOVSKAYA-AREA.md](MOSKOVSKAYA-AREA.md).

Source verification passes all 572 area checks, both layout goldens, generated
page and ownership checks, syntax checks, closure/import/runtime lints and all
nine closure-scanner mutants. The strip golden's single shore-distance hash
change is the restored 1.7 cm source bend, documented in the park research;
the northern golden is unchanged.

All 16 areas were rebuilt after freezing the source. Manifest revision, size,
SHA and generated-map checks pass for **1,612 complete products / 730.8 MiB
gzip**. Moskovskaya retains 149 products / 54.4 MiB gzip, revision
`2f13c5b7fe33dbb728ee`; Palace is `d96f760228ad90a28e98` and Kolomna is
`2959091cedbab8d81449`. No forced stale bake is used for final validation.

The final normal-bake browser regression passes all six checks. Real keyboard
W input takes the player from `(-1407.9,7248.1)` out of the pond, back into it
and out again, remaining grounded with no fall rescue. The submerged starting
floor is -1.7213 m and both exits reach ordinary y = 0 ground. All five
reported camera views were opened and inspected after this run: supported rail
ends, no floating wall sprites, a closed hedge and a complete island bank.
There are no browser/module errors or failed regions. Evidence is in
`shots/park-repair/shipping/` and `shipping-final.txt`.

All five final normal-bake depth probes pass: 6, 17, 10, 4 and 79 noisy pixels
(worst **0.009%**), identical-frame difference zero and no listed offenders.
Their inspected images show only sparse water-highlight noise, not an open
hedge or bank. The probe server now uses the shared revision endpoint; its
earlier diagnostic 404 is eliminated. The final red-car control test passes
entry, acceleration, nitro, drift, braking and exit (`--nofuzz`).

The following full-scene drives use Edge 156 / ANGLE D3D11 / RTX 3090 Ti,
1280 × 720, medium, normal matching bakes and twenty seconds of W input.
GPU jobs ran serially; CPU audits, profiling and intermediate screenshots were
excluded from the timed intervals. The before samples are the matching 9.0.0
checkpoint recorded earlier in this session, using identical starts and input.
Final artifacts and inspected end views are in `shots/park-repair/perf/`;
before artifacts remain in `shots/moskovskaya-perf/`.

| Route / version | Load s | Frame ms mean / p50 / p95 | Max ms | Frames >40 / >80 ms | Mean draws | Travel m | CDP used / backing MiB |
| --- | ---: | --- | ---: | --- | ---: | ---: | --- |
| Station / Nevsky, 9.0.0 | 24.20 | 20.70 / 16.7 / 33.4 | 183.4 | 5 / 3 | 1241 | 354 | 590 / 1337 |
| Station / Nevsky, 9.0.1 | 23.26 | 18.76 / 16.7 / 33.3 | 250.0 | 4 / 2 | 1163 | 352 | 586 / 1350 |
| Admiralty, 9.0.0 | 24.22 | 22.00 / 16.7 / 33.4 | 133.4 | 15 / 4 | 1057 | 98 | 427 / 696 |
| Admiralty, 9.0.1 | 23.81 | 26.51 / 33.3 / 33.4 | 150.0 | 24 / 3 | 1447 | 47 | 580 / 1316 |
| Moskovsky Prospekt, 9.0.0 | 14.34 | 17.24 / 16.7 / 16.8 | 133.4 | 5 / 3 | 1057 | 190 | 411 / 582 |
| Moskovsky Prospekt, 9.0.1 | 15.65 | 17.36 / 16.7 / 16.8 | 116.7 | 8 / 3 | 1045 | 195 | 450 / 601 |

Final reciprocal-mean rates are approximately **53 / 38 / 58 FPS**. All drives
finish stopped after collisions; the station views end within 3 m of each
other, but Admiralty stops 50 m earlier and Moskovsky is deflected differently.
The +4.51 ms/frame and larger memory sample at Admiralty therefore describe
a different traffic/view/region state, not isolated shared-helper overhead.
The new district's observed load increases about 1.3 s and its mean frame time
0.12 ms. These samples do not establish a performance gain. CDP JS used and
backing storage are separate end-of-run samples, not retained-memory results;
final loaded regions are 36, 50 and 54, with zero failed regions and no
browser/module errors. Comfortable 30 FPS remains inconsistent in the old
centre: its p95 remains around the threshold and hitches reach 250 ms.
The next measured bottlenecks remain draw submission and region/GC hitches;
the performance goal is not finished by this geometry repair.

Reproduce with the starts in the 9.0.0 section, or:

```powershell
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/park-repair/perf/station
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "-2493.919,-687.663,-52.605" --json --diagnostics --out shots/park-repair/perf/centre
node tools/drive-bench.mjs --area moskovskaya --q medium --seconds 20 --start "-1712,7050,1.62" --json --diagnostics --out shots/park-repair/perf/moskovsky
node tools/park-shore-playtest.mjs
node tools/drive-test.mjs --area palace --q medium --nofuzz --out shots/park-repair/controls
```

## 2026-11-01 — National Library and bridge closures (9.1.0)

The National Library now has a raised entrance, a walkable open colonnade,
recessed arched glazing and the current fountain forecourt. Two incorrectly tall
generic blocks become mapped low underpass pavilions with six working stair
approaches. Shared repairs close exposed skew-bridge/unequal-water-level faces
and remove generic ground paving and wire supports from beneath raised long
bridges. Raised wire hardware remains breakable, and a signal stop bar follows
the actual humped Birzhevoy deck. Reference and implementation details are in
[MOSKOVSKAYA-AREA.md](MOSKOVSKAYA-AREA.md) and its linked research notes.

The library building uses 27,965 static triangles, ten material/range meshes and
zero frame callbacks. The forecourt uses 13,016 triangles; the complete authored
district stays within its existing budget at 209,839 / 210,000 triangles. Its
paving uses one world-anchored material, and 144 jet curves use uncapped low-sided
tubes. Neither lights nor frame callbacks were added. Underground visibility
reveals only the crossing from its approaches, preserving unrelated underground
culling. The source-mode screenshot set was opened and reviewed from the supplied
poses, under the colonnade, over the square and inside both pavilions/corridor.

Focused source checks pass actual geometry and physical support, not only plan
coordinates: 2,397 forecourt floor probes, 144 independent tapered-pedestal rays
and lateral collision probes, 88 facade-letter attachment probes, 646 open-roof
rays, sixteen underpass walking routes and four red-car crossings. Hidden-stair,
solid-deck, absent bridge-cap, skew-overhang and wet-junction
dam mutations fail. The actual Birzhevoy underside audit passes 96 rays, 42
raised mast mesh/collider checks, 598 elevated contact points and eighteen
paint/asphalt ray pairs; normal height is 3cm above the real bridge asphalt.

All sixteen unequal-datum seam mesh audits pass (75 quads / 150 triangles), with
unchanged water rings/datums. The corrected full water matrix passes all 282
checks: its first run found two fountain stems classified as posts; replacing
approximate cylinders with exact tapered physical faces resolved the mismatch
without an audit exemption. The Palace boat suite passes 108 checks and bridge
jumping passes 136. All 572 area-registry checks, both existing layout goldens,
generated pages, source ownership and closure/import/runtime/syntax checks pass.

Moskovskaya roads and strict markings pass, with the documented 180 residual
surface samples. Vasilyevsky strict markings pass after the raised stop-bar
correction; road surfaces pass with the existing 120-sample budget and ribbons
pass. Its furniture audit retains exactly the baseline 53 objects on roads,
37 edge intrusions and 29 median intrusions, including identical printed
locations/amounts. Palace's older furniture/stop-bar audit failures described
above are unchanged; these are not counted as passing road wrappers.

The final fresh boat matrix runs every live area serially: **1,177 passed /
3 failed out of 1,180 checks**. Four additional passing checks were exercised
compared with the older mixed historical logs. Only the documented Smolny
pillar pair and Kronverk fortress-ram check fail, at the same coordinates and
with the same hit/inside outcomes as their pre-change baseline. No new boat
failure appears. All ten tracked transport/test dependency hashes remain
identical before and after every run and still match the final source.
Per-area full logs and hashes are under `shots/library/boat-matrix/`.

Driving samples use Edge 156 / ANGLE D3D11 / RTX 3090 Ti, 1280×720,
medium, the full scene with normal matching bakes, twenty seconds of W input and
CDP diagnostics. GPU jobs are serial; no other audit, profiling or mid-run
screenshot overlaps the measured intervals. The initial old-centre samples
were repeated because frame/load times varied strongly; both are reported.

| Route | Version / sample | Load s | Frame ms mean / p50 / p95 | Max ms | Frames >40 / >80 ms | Mean draws | Travel m | CDP used / backing MiB |
| --- | --- | ---: | --- | ---: | --- | ---: | ---: | --- |
| Station / Nevsky | 9.0.1 | 23.26 | 18.76 / 16.7 / 33.3 | 250.0 | 4 / 2 | 1163 | 352 | 586 / 1350 |
| Station / Nevsky | 9.1.0 initial | 30.10 | 26.04 / 33.2 / 33.4 | 333.3 | 16 / 3 | 1169 | 352 | 562 / 1327 |
| Station / Nevsky | 9.1.0 repeat | 26.83 | 18.95 / 16.7 / 33.3 | 283.3 | 8 / 4 | 1167 | 352 | 461 / 715 |
| Admiralty | 9.0.1 | 23.81 | 26.51 / 33.3 / 33.4 | 150.0 | 24 / 3 | 1447 | 47 | 580 / 1316 |
| Admiralty | 9.1.0 initial | 29.83 | 34.67 / 33.3 / 50.1 | 166.7 | 82 / 4 | 1765 | 131 | 535 / 1317 |
| Admiralty | 9.1.0 repeat | 25.25 | 30.06 / 33.3 / 50.0 | 150.1 | 47 / 3 | 1347 | 114 | 567 / 1314 |
| Moskovsky Prospekt | 9.0.1 | 15.65 | 17.36 / 16.7 / 16.8 | 116.7 | 8 / 3 | 1045 | 195 | 450 / 601 |
| Moskovsky Prospekt | 9.1.0 initial | 17.73 | 20.28 / 16.7 / 33.4 | 166.6 | 7 / 3 | 1019 | 184 | 424 / 581 |
| Library approach | 9.0.1 | 19.81 | 22.30 / 16.7 / 33.4 | 200.1 | 11 / 4 | 1002 | 51 | 519 / 629 |
| Library approach | 9.1.0 initial | 17.82 | 21.68 / 16.7 / 33.4 | 199.9 | 10 / 4 | 1173 | 167 | 416 / 570 |

The station reaches exactly the same stopped pose/distance in all three runs.
Its repeat is 18.95ms versus 18.76ms before, while the initial final-source run
was 26.04ms with nearly unchanged draws. This variation does not establish a
source-caused gain or regression; loading also varies broadly across unchanged
modules. Admiralty travels 131m / 114m after versus 47m before, so its larger
frame times and different draw counts describe different traffic/view/region
states. Moskovsky and library drives also end at different stopped poses after
collisions (184m versus 195m; 167m versus 51m). None of these samples proves a
performance improvement. The library sample averages about 46 FPS, but the older
centre remains inconsistent with comfortable 30 FPS: Admiralty p95 is 50 ms and
hitches reach 333 ms. Draw submission and region/GC hitches remain the next
measured investigation; this content revision does not finish that goal.

CDP used heap and backing storage are distinct end-of-run samples, not retained
memory measurements. Final loaded regions are 36 / 51 / 50 / 48 for the initial
four routes and 36 / 50 for the repeats, all with zero failed regions. All eight
normal-load reports have zero module/browser/asset failures. Artifacts and
inspected end views are in `shots/library/perf/`.

```powershell
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/library/perf/after-station
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "-2493.919,-687.663,-52.605" --json --diagnostics --out shots/library/perf/after-centre
node tools/drive-bench.mjs --area moskovskaya --q medium --seconds 20 --start "-1712,7050,1.62" --json --diagnostics --out shots/library/perf/after-moskovsky
node tools/drive-bench.mjs --area moskovskaya --q medium --seconds 20 --start "-1700,7540,1.62" --json --diagnostics --out shots/library/perf/after-library
node tools/moskovskaya-playtest.mjs
```

The last close review replaced a narrow placeholder strip behind each side
portal with recessed three-storey glazing and matching solid backing. This adds
36 triangles (included in the final 27,965 / 209,839 counts above), verified by
eighteen independent front-sided pane/backing probes. Only Moskovskaya was
rebaked and its two routes measured again. The earlier Moskovskaya samples
remain in the table as initial samples, rather than being silently replaced.

| Final route | Load s | Frame ms mean / p50 / p95 | Max ms | Frames >40 / >80 ms | Mean draws | Travel m | CDP used / backing MiB |
| --- | ---: | --- | ---: | --- | ---: | ---: | --- |
| Moskovsky Prospekt | 17.86 | 19.56 / 16.7 / 33.4 | 250.1 | 7 / 2 | 1056 | 141 | 422 / 606 |
| Library approach | 17.48 | 18.86 / 16.7 / 33.3 | 166.7 | 11 / 4 | 1040 | 185 | 429 / 590 |

These final local samples average approximately 51 / 53 FPS. Their distances are
141 m / 185 m, again ending after collisions rather than following the earlier
traffic outcomes, so they also do not establish a speedup. Both end with 48
loaded regions, zero failed regions and no browser/module/asset errors. Used
heap and backing storage remain separate end samples.

All sixteen shipping manifests match the final source and generated revision
map: **1,612 complete products / 730.8 MiB gzip**, with no unreferenced binary
products in any live bake directory. Moskovskaya retains 149 products and revision
`e69659259cc8faa76812`; Palace is `a365a0fc19ff0ad0fbef`, and Vasilyevsky is
`fd1c9baec9d20f7de239`. No forced stale bake is used in final browser tests.

The final normal-page regression passes all **31 checks** after the last
Moskovskaya bake: water hydration, car and boat controls, the raised library
entrance, the complete west-to-east underpass walk and destination streaming.
There are no browser/module errors or failed regions. The real walker reaches
library floor 1.44 m, tunnel floor −3.8 m and street height again without flying.
The separate unchanged-shore regression passes all six checks, including two
pond exits and a return entry with no fall rescue. Library/monument/underpass
views and the three reported bridge/quay views were opened and inspected under
normal loading. Artifacts are `shots/library/shipping-final_*`,
`shipping-playtest-final.txt`, `shots/bridge-seams/shipping_*` and
`shots/bridge-underdeck/shipping_*`.

## 9.2.0 — Landmark facade and fountain pass (2026-11-02)

Singer House remains static and batched with shared materials. Its revised
corner glazing, dormers, bronze ornament, lantern and globe add approximately
59k triangles to landmarksF (328,853 total). Moskovskaya's complete landmark
module measures 275,087 triangles, below the revised 300k contract: it now owns
Basseynaya 53 as well as the library and its animated water. The library itself
is 41,081 static triangles (45k focused limit). Windows use flat frame/pane
geometry, keeping the extra light-well return skins inexpensive.

The fountain uses four bounded dynamic instance meshes: 1,152 jet segments,
864 droplets on medium/high (432 on low), 144 impact rings and 12 submerged
light patches. They cast no shadows and skip the outline pass. A single
allocation-free callback skips buffer uploads beyond 390m; authored render
range is 350m. Fixed conservative bounds cover every pulse and ripple. No
engine, transport, other-area update loop or world-wide light was added.

The focused geometry/player tests pass: four bidirectional Basseynaya passages,
solid columns/cores, a walkable roof, deterministic fountain time, evening/night
lighting, distant update suppression, library return glazing, eight open
entrance bays, ten sky-open courts, the raised stair walk and basin entry/exit.
The underpass regression also passes all 16 walking routes and four car
crossings. Source module/city checks, layout, closure/import/runtime lints pass.
Depth probes at the supplied viewpoints: Singer 3/2 noisy pixels; library and
pilotis zero. The library/fountain overview exposed coplanar stair trim; inset
tread nosings reduce it from 891 pixels (0.097%) to 13 (0.001%).

Moskovskaya roads and strict markings pass. Palace's road wrapper still fails
with the documented furniture violations (90 on-road, 131 edge, 175 median);
surface/ribbon checks pass. Its marking audit still lacks the existing
Kuznechny Lane stop bar, approach 2 at n1562060894. These older failures remain
visible; no audit exemption was introduced. Evidence: `shots/landmark-refresh/`.

Normal matching-bake drives use Edge / ANGLE D3D11 / RTX 3090 Ti, 1280×720,
medium, 20 seconds of W input, no profiling/mid-shot, and CDP diagnostics
collected after timing. GPU jobs run serially; no audits overlap timed drives.

| Route | Version | Load s | Frame ms mean / p50 / p95 | Max ms | Frames >40 / >80 ms | Mean draws | Travel m | CDP used / backing MiB |
| --- | --- | ---: | --- | ---: | --- | ---: | ---: | --- |
| Station / Nevsky | 9.1.0 | 28.39 | 26.09 / 33.2 / 33.4 | 200.1 | 10 / 4 | 1283 | 355 | 552 / 1329 |
| Station / Nevsky | 9.2.0 | 27.98 | 22.97 / 16.7 / 33.4 | 283.5 | 8 / 3 | 1161 | 352 | 561 / 1335 |
| Library approach | 9.1.0 | 17.52 | 19.45 / 16.7 / 33.4 | 150.1 | 8 / 3 | 1234 | 77 | 537 / 634 |
| Library approach | 9.2.0 | 17.32 | 19.24 / 16.7 / 33.4 | 150.0 | 8 / 3 | 1129 | 118 | 439 / 595 |
| Admiralty (final only) | 9.2.0 | 27.36 | 36.87 / 33.4 / 50.1 | 166.7 | 112 / 5 | 1819 | 101 | 445 / 701 |

Station and library averages are approximately 44 and 52 FPS. Traffic/collision
outcomes differ: the station car stops at a different angle and loads 36 versus
37 regions; the library drive travels 118m instead of 77m and loads 49 versus
48 regions. These are observations, not evidence of a speedup. Admiralty has no
paired baseline in this round and averages only 27 FPS: comfortable 30 FPS
throughout the old centre remains unfinished. Submission cost, dense traffic
and region/GC hitches remain the next measured investigation. CDP used heap
and backing storage are distinct end samples, not retained-memory estimates.
All five drives have zero module errors and zero failed regions.

Reproduce the final samples:

```powershell
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/landmark-refresh/after-station
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "-2493.919,-687.663,-52.605" --json --diagnostics --out shots/landmark-refresh/after-admiralty
node tools/drive-bench.mjs --area moskovskaya --q medium --seconds 20 --start "-1700,7540,1.62" --json --diagnostics --out shots/landmark-refresh/after-library
node tools/moskovskaya-playtest.mjs
```

Only Palace, Admiralty and Moskovskaya are rebaked. All sixteen live manifests
pass `bake-manifest-check.mjs`: 1,612 complete products / 730.7 MiB gzip.

The first normal-page pilotis walk caught generated lot cars across the new
opening. A Moskovskaya-only parking hook now removes the overlapping central
slots and paint, without forbidding the driven car. A mapped-lot regression
guards both passage lanes. Moskovskaya was rebaked again (revision
`8d6bb7bbab3f7e427dc8`); local strict furniture/surface audits and the full
Moskovskaya marking audit pass after this last correction.

The final normal-page playtest passes **35/35 checks**, including actual
bidirectional pilotis walking, moving fountain droplets, car and boat
boarding/acceleration/steering/braking/exit, raised library entry, the complete
underpass walk and destination streaming. No module/browser errors or failed
regions occur. The final matching-bake views were opened and inspected.
Integrated depth probes: library return 0 noisy pixels, pilotis 8 (0.001%),
fountain overview 17 (0.002%) and Singer reference view 31 (0.003%), all below
0.02%. Artifacts: `shipping-final_*`, `shipping-night_*`, `z-shipping_*`,
`z-singer-shipping_*` and `shipping-playtest-final.txt` in
`shots/landmark-refresh/`; playtest images/report are in
`shots/moskovskaya-playtest/`.

The library drive was repeated after the final parking correction, with the
same command and `--out shots/landmark-refresh/after-library-final`: load 17.35s,
frame mean/p50/p95 **19.62 / 16.7 / 33.4ms**, max 150.1ms, 10 frames >40ms / 3
>80ms, mean 1,117 draws, 81m travelled, CDP used/backing **423 / 595 MiB**.
It ends with 48 loaded regions and no failed regions/module errors, averaging
about 51 FPS. The earlier 118m sample above is the initial 9.2.0 sample; this
81m run is the final source+bake snapshot. Its traffic stop/heading still
differs from the 77m baseline, so the 0.17ms mean difference is not attributed
to the fountain. Final source, bake and generated revision map agree.

## 2026-11-02 — Live fountain coverage and library hall (9.3.0)

All sixteen live pages now resolve every mapped fountain to either an authored
effect or the shared fallback: **131 unique in-play IDs**, 141 fallback and 33
specialist page-local records. The unique sets overlap in four IDs because
adjacent pages load different specialist modules. No mapped in-play site is
excluded or unresolved, and generic effects are not duplicated. Twenty-five
formerly static authored sites now have live jets; four already-live sites
retain their original streams and gain shared droplets/ripples. The library's
successful existing water effect is unchanged.

The new shared controller uses 256m spatial buckets and one callback/context,
three shared materials/geometries and finite-range dynamic instances without
shadows or outlines. Distant fountains do not upload buffers. Supplemental
effects suppress their duplicate stream mesh entirely (two active draws).
The performance tier uses three droplets/nozzle and medium six. The bounded
geometry regression exercises 185 fountains / 42,336 transformed vertices,
deterministic replay, departure/arrival, evening/night and unchanged physics.

The fallback's new static geometry ranges from zero to 5,930 triangles/page;
Moskovskaya adds 2,564. Exact basin holes remain dry. Native water is reused;
road-touching fountains add spray and shallow native water without new stone,
floor, water-surface meshes or blocking colliders across asphalt. Seven old
full-basin cylinders are replaced with reachable water and breakable perimeter
bays, and both Paradny basins now register native water.
The final authored audit also adds the Voronikhin 1809 spout and Steregushchy
seacock. The trough's old blanket body collider is tightened to its rear stone
and replaced over the water by a shallow floor and low walkable platform;
an actual Player enters it from the front in the regression. Voronikhin's
mapped ID is explicitly specialist-owned, preventing a second generic bowl.
The final coverage audit records 806 water/mesh probes and zero exclusions,
unresolved sites or duplicate generic effects. Raw results and per-page counts:
`shots/fountain-refresh/final-coverage.txt` and `final-coverage-summary.json`.

The library is **47,894 static triangles / 12 material-range meshes / zero
callbacks**. The real-player CPU regression takes 4,290 steps through its new
foyer, broad stair, gallery and lower passage; ten source courts remain open.
The complete Moskovskaya landmark module is 281,900 triangles under its 300k
budget. Singer's new crown uses static collectors and 280m carving detail.
Source depth probes: Singer close-up 2 noisy pixels, library outside 10,
stair view 6 and gallery view 2 (each at most 0.001%). The gallery initially
exposed coplanar rear jambs; moving their rear face 4cm into the room removed
the 2,057-pixel overlap. Every reviewed image was inspected.

CPU integration: all **282 water-reachability checks / 16 areas pass**;
library architecture, forecourt, underpass and Basseynaya regressions pass;
closure/import/runtime-only lints pass. Strict furniture checks pass for the
whole Moskovskaya page and Singer/Kazan vicinity. Raw zero-budget local surface
checks retain two existing samples in each area (shared road-end/fillet and
unchanged Kazan paving), within the documented area budgets. Moskovskaya's
marking audit passes; Palace retains its already documented missing signal
stop bar. The broader Vasilyevsky road audit retains furniture failures;
its surface and ribbon audits pass. No exemptions were added. Audit artifacts:
`shots/fountain-integration-audit/`, authored site poses:
`shots/fountain-refresh/sites.json`.

Before-source normal matching-bake Palace drives at medium, 1280×720, 20s:

| Route | Load s | Mean / p50 / p95 / max ms | Mean draws | Distance m | CDP used / backing MiB |
| --- | ---: | --- | ---: | ---: | ---: |
| Station, 9.2.0 | 30.325 | 28.46 / 33.3 / 33.5 / 316.7 | 1,269 | 355 | 512 / 750 |
| Admiralty gate, 9.2.0 | 30.388 | 40.27 / 33.4 / 50.1 / 199.9 | 1,826 | 80 | 529 / 1,324 |

These baselines ran serially without other GPU work. Their raw diagnostics
and end frames are `shots/crown-refinement/before-{station,admiralty}.*`.

Normal shipping-page functional verification at the performance tier passes
81/81 checks across Palace, Moskovskaya, Vasilyevsky and Admiralty: fresh bakes,
real moving jet/drop/ripple buffers, three shared materials, evening/night
highlights, remote upload suppression and restored animation on return.
Original library and Alexander Garden effects remain active. There are no
module/browser errors or failed regions. Artifacts:
`shots/fountain-playtest-performance/`. Its short static render samples are
functional diagnostics, not substitutes for timed driving measurements.

The normal medium Moskovskaya walking/transport test passes 61/61 checks,
including both directions through the new hall and physical stairs, the lower
passage, the pilotis and the existing underpass; car/boat controls and destination
streaming also pass. Matching-bake views from the owner's library camera and
inside both levels are `shots/fountain-refresh/library-shipping_*`.

Rendered fountain review exposed a procedural birch inside the Vasilyevsky
basin and a flower carpet above the Hermitage fountain. The latter now has a
generator-persistent 1.7m planting opening, checked against actual flower
triangles in Palace and Admiralty. An environment-only audit of all sixteen
pages found 38 trunk/site/area overlaps in eleven areas (35 centres in water,
three at its boundary). It preserves full page claims but omits later street
pruning, so this is an upper bound on visible intrusions. The eleven areas now
compose basin masks with existing tree/tuft hooks. Focused tests compare 296
exact source records, retain dry polygon holes and reject all 38 measured stem
positions. Planting masks have a regeneration/check tool and add no frame work.
The repeated actual environment audit now finds **zero centre or trunk-edge
overlaps across all sixteen areas**, down from 38. After-results are in
`shots/fountain-refresh/tree-interiors-after/`; the original audit remains intact.
Baseline evidence: `shots/fountain-refresh/tree-interiors/`; regressions:
`fountain-planting-test.mjs`, `vasilyevsky-fountain-trees-test.mjs` and
`hermitage-fountain-bed-test.mjs` under `tools/`.

All sixteen areas were rebaked for the shared fountain controller, then the
eleven affected areas were rebaked after the final planting corrections.
`bake-manifest-check.mjs` and `bake-scene.mjs --plan --check` both pass:
**all sixteen fresh / 1,612 complete products / 730.7 MiB gzip**. Final logs:
`shots/fountain-refresh/{bake-planting-final,manifests-final,plan-final}.txt`.

The final normal performance-tier rerun of Vasilyevsky and Admiralty passes
36/36 checks, with zero errors or failed regions. All seven PNGs were inspected:
the Vasilyevsky basin is free of the birch, the Hermitage basin is visible through
its planting opening, and original/supplemental water and night accents remain
correct. Evidence: `shots/fountain-playtest-final/` and
`shots/fountain-refresh/fountain-playtest-final.txt`.

Final matching-bake medium drives use the same 1280×720, 20s commands as their
baselines. They run serially, after CPU audits stop, with no profiling or mid-run
screenshots; CDP diagnostics are collected after timing. The library comparison
is the final 9.2.0 run documented above (81m / 19.62ms), rather than a second
before-source capture in this round.

| Route | Load s | Mean / p50 / p95 / max ms | >40 / >80ms frames | Mean draws | Distance m | CDP used / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Station, 9.3.0 | 28.082 | 24.16 / 16.7 / 33.4 / 300.0 | 13 / 3 | 1,171 | 352 | 393 / 719 |
| Admiralty gate, 9.3.0 | 27.669 | 26.45 / 16.8 / 49.9 / 166.8 | 47 / 4 | 1,289 | 66 | 615 / 1,334 |
| Library approach, 9.3.0 | 14.486 | 17.34 / 16.7 / 16.8 / 116.7 | 5 / 3 | 1,123 | 88 | 437 / 613 |

These averages are approximately 41, 38 and 58 FPS. All three drives have zero
module errors and failed regions. Traffic/collision outcomes differ: station
loads 36 regions versus 37 before, Admiralty travels 66m versus 80m, and library
88m versus 81m. Draw/mean differences therefore are not attributed to the water
or planting changes. Admiralty still has a roughly 50ms p95, and region/GC
hitches remain visible; smooth 30 FPS throughout the old centre remains
unfinished. Heap used and backing storage are distinct end samples, not a
retained-memory estimate. End frames were opened and inspected.

```powershell
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/fountain-refresh/after-station
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "-2493.919,-687.663,-52.605" --json --diagnostics --out shots/fountain-refresh/after-admiralty
node tools/drive-bench.mjs --area moskovskaya --q medium --seconds 20 --start "-1700,7540,1.62" --json --diagnostics --out shots/fountain-refresh/after-library
node tools/fountain-playtest.mjs --areas vasilyevsky,admiralty --q performance --out shots/fountain-playtest-final
```

## 2026-11-02: waterfront views and rendering corrections, 9.4.0

The river panorama now includes bounded surveyed waterfront strips and the
existing Fortress, Strelka, University, Hermitage and Admiralty architectural
models. Window rows retain analytic pixel coverage at cross-river distances.
The additional architecture has finite feature ranges and no population,
physical registration or frame callbacks. Supplemental city records use the
normal baked region loader. See `WATERFRONT-VIEWS.md` for selection and ownership.

Other corrections close the half-metre gap between simple courtyard cornices
and roof decks, put reserved tram rails above raised paving, remove degenerate
crossbars from the Winter Canal gallery arch, and base shared road dividers on
carriageway widths before junction flares. Both carriageways' continuations
remain clear of their shared paint. Station flower fences now have individual
breakable panels; their iron, pickets and flower box move together, removing
only the struck panel's collider. Near road regions can use the second decoding
slot while a speculative city request is stalled, rather than waiting behind it.

Controlled procedural screenshots are evidence of geometry and appearance,
not driving FPS. In the isolated river sample at medium, 1600x700, the initial
267 calls / 425,485 triangles become approximately 500 calls / 512,695 triangles
with the waterfront architecture and filtered windows. The analytic windows
add no meshes, textures or materials. Exact Palace CPU comparisons retain all
31,464 existing city colliders and 24,940 navigation doors; the separate panorama
adds no colliders or update callbacks.

The following baseline uses normal baked loading, Edge/D3D11 on the RTX 3090 Ti,
medium quality, 1280x720, 20 seconds of W input, no profiling or mid-run capture.
Used heap and backing storage are separate CDP end samples in MiB.

| Route / snapshot | Load s | Mean / p50 / p95 / max ms | >40 / >80ms | Mean draws | Distance m | Used / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Station, Vladimirsky 9.3.0 | 22.953 | 23.95 / 16.7 / 33.4 / 366.6 | 15 / 2 | 1,227 | 92 | 583 / 911 |
| Moskovsky, 9.3.0 | 16.538 | 19.65 / 16.7 / 33.4 / 300.1 | 4 / 3 | 1,027 | 455 | 436 / 612 |

Focused checks pass for shell closure, median widths/split endpoints, raised
tram heads, a thrown flower panel and its untouched neighbour, the unobstructed
canal opening and the retained vault. The delayed-city streaming regression
proves that an approaching road loads without idle time, within the two-request
budget. The default markings and wall audits, all Moskovskaya road/marking
audits, and the station's focused furniture audit pass.

Existing audit limitations remain explicit: the parked strip's furniture
audit reports 74 Mikhailovsky Castle fence objects on narrow service roads;
Palace's full markings audit reports one missing Kuznechny stop bar, also
present before this round; Moskovskaya's wall audit reports one short low-wall
sliver at (-754.4,5294.3). Nevsky's focused east, centre and west road-marking
checks pass. The original transient grey-road report was not reproduced at a
stationary camera; the demonstrated loading blockage is fixed and covered by
the stalled-request test.

Final matching-bake drives use the same settings and commands as the baseline,
with no CPU audits running concurrently. All three have zero module errors
and failed regions. Their end frames were opened and inspected.

| Route / snapshot | Load s | Mean / p50 / p95 / max ms | >40 / >80ms | Mean draws | Distance m | Used / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Station, Vladimirsky 9.4.0 | 21.666 | 21.14 / 16.7 / 33.4 / 283.4 | 9 / 2 | 1,164 | 149 | 571 / 899 |
| Moskovsky, 9.4.0 | 16.165 | 17.96 / 16.7 / 33.2 / 316.7 | 4 / 3 | 1,054 | 455 | 438 / 597 |
| Admiralty gate, Palace 9.4.0 | 27.706 | 29.31 / 33.3 / 50.0 / 183.3 | 48 / 7 | 1,620 | 147 | 563 / 1,213 |

These average approximately 47, 56 and 34 FPS. Station traffic/collision
outcomes differ (149m versus 92m), so its mean/draw difference is not attributed
to these changes. The Moskovsky routes cover the same distance. Admiralty is
an additional stress sample, without a fresh controlled before run in this
round; its 50ms p95 and transient hitches remain outside smooth 30 FPS.
CDP samples describe used heap and backing storage separately, not retained
memory. The grey-road priority correction has a controlled stalled-request
regression; these drives alone do not prove reproduction of the original
transient loading symptom.

The normal baked Palace and Kronverk river views retain the facade window
rhythm and actual landmark shells from both shores. The other final camera
checks show the closed Moskovsky roof, rails reaching the camera, straight
Nevsky double lines, an unobstructed Winter Canal opening with its bridge and
vault intact, and one thrown flower-fence panel with standing neighbours.
All seven scene PNGs and nine driving-control PNGs were opened and inspected.
The real-page driving control test passes (entry, acceleration, nitro, cameras,
braking, exit and bridge traversal); its optional broad fuzz is disabled.
The quick boat suite passes all 28 checks. Existing shader compiler warnings
and the duplicate `st_floor` texture-painter warning remain; final captures
report no module or page errors.

All sixteen areas were rebaked after the final source correction. The manifest
check reports **16 fresh areas / 1,869 complete products / 756.2 MiB gzip**.
Evidence and JSON diagnostics are under `shots/fixes-1102/`, including
`bake-final.txt`, `bakecheck.txt`, `final-{palace,mosk,reverse}*`,
`final-controls*`, `boat.txt` and the before/after drive files.

```powershell
node tools/drive-bench.mjs --area vladimirsky --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/fixes-1102/after-centre
node tools/drive-bench.mjs --area moskovskaya --q medium --seconds 20 --start "-1736,7325,0" --json --diagnostics --out shots/fixes-1102/after-mosk-drive
node tools/drive-bench.mjs --area palace --q medium --seconds 20 --start "-2493.919,-687.663,-52.605" --json --diagnostics --out shots/fixes-1102/after-admiralty
node tools/drive-test.mjs --area palace --q medium --nofuzz --out shots/fixes-1102/final-controls
node tools/area.mjs palace tools/boat-test.mjs --quick
node tools/bake-manifest-check.mjs
```

## 2026-11-03 — Yelagin natural shores and deployment repair (9.5.0)

Yelagin's outer shore now has grass and a low stone waterline. Pond channels
and small islands meet the water with green banks. Union-boundary extraction
removes duplicate water seams, and a bounded 2 m height field avoids folded
offset strips at narrow corners. Rendering and walking use the same Float32
triangles. Trees follow the new terrain, including their shadows and colliders.

The shoreline test passes 5,780 boundary probes and 308,744 terrain-edge checks.
The real-mesh bank test passes 5,334 raycasts and 24 two-way walking routes;
Moskovskaya's unchanged profiles pass 44 routes. Islands passes all 17 water
access checks, 138 quick boat-passage checks, the complete road audit, and
20,004/20,004 painted-line geometry probes. Layout and landmark-group checks
pass in all 18 areas. The full geometry ownership audit also passes all 18.

The preceding remote deployment failed its panorama claim checks. The extent
audit now validates the exact registered source claim for distant architecture.
The geometry audit distinguishes shared arches, signs and decorations from
main walls/decks; missing-shell and duplicate-shell mutants still fail.
A real render defect was also corrected: generated supports now inherit their
source's panorama owner, so generic top faces are discarded with the generic
building. A Palace city+panorama comparison preserves all 34,221 collision
records and 27,776 entrance records exactly (SHA-256 equality).

The final manifest check reports **16 fresh areas / 1,869 complete products /
756.2 MiB gzip**. The final normal-loading Islands browser test matches revision
`ac2c71e8344ea2b1068e`, exits a pond with actual keyboard movement and returns
to it without a rescue or unsupported floor. No module errors or failed regions
were reported. Evidence is under `shots/yelagin/`, including `bake-final.txt`,
`bakecheck-final.txt`, `natural-final.txt`, `boat-final.txt`, `claims-geometry-final.txt`,
`panorama-guard.txt`, `physics-{before,after}.json` and `shipping-final/`.

Matching-bake driving comparisons use detached `6f5b745` as the baseline,
Edge/D3D11 on RTX 3090 Ti, 1280×720, medium quality, and 20 seconds of real W
input. GPU jobs run serially after CPU audits finish; there is no profiling or
mid-drive capture. CDP diagnostics are collected after timing.

| Route / snapshot | Load s | Mean / p50 / p95 / max ms | >40 / >80ms | Mean draws | Distance m | Used / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Station, 9.4.2 | 26.020 | 23.12 / 16.7 / 33.4 / 200.0 | 15 / 3 | 1,105 | 344 | 571 / 1,132 |
| Station, 9.5.0 | 21.957 | 19.41 / 17.6 / 34.9 / 229.9 | 3 / 2 | 1,098 | 244 | 573 / 815 |
| Ryukhina, 9.4.2 | 22.732 | 19.74 / 16.7 / 33.4 / 233.4 | 7 / 4 | 958 | 291 | 341 / 377 |
| Ryukhina, 9.5.0 | 21.041 | 18.08 / 17.5 / 18.3 / 229.6 | 4 / 3 | 939 | 291 | 465 / 601 |

Final averages are approximately 52 FPS in the centre and 55 FPS on Ryukhina.
Traffic/collision outcomes differ on the centre run, so its mean change is not
attributed to this work. Islands travels the same distance, while loaded regions
vary from 52 to 55. Its end sample uses 123.5 MiB more JS heap and 223.7 MiB more
backing storage; the new terrain/query data also has a bounded CPU footprint.
These are end samples, not retained-memory measurements. Centre p95 is still
34.9 ms and transient hitches remain around 230 ms: smooth 30 FPS throughout
the city remains unfinished. Region attachment and long tasks remain profiling
targets. Existing shader and duplicate texture-painter warnings remain.

All five final shoreline views and both drive end frames were opened and
reviewed. The real-page car test passes entry, acceleration, nitro, cameras,
braking, exit and Anichkov traversal. Its bounded rerun uses `gates=0` to keep
the harness in one page; the unrestricted first run crossed an area boundary
during nitro and invalidated the harness's page-local references. Fuzz is off.
The nine final control screenshots were opened and reviewed.

```powershell
node tools/area.mjs islands tools/yelagin-shore-test.mjs
node tools/area.mjs islands tools/natural-bank-test.mjs --json shots/yelagin/walk-routes.json
node tools/panorama-claims-test.mjs
node tools/drive-bench.mjs --area vladimirsky --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/yelagin/after-centre
node tools/drive-bench.mjs --area islands --q medium --seconds 20 --start "-5161.6,-4248.2,4.9" --json --diagnostics --out shots/yelagin/after-islands
```

## 2026-11-03 — Elagin pond crossings and grounded paths (9.5.2)

Legacy quay faces no longer stand beside pond bridges over continuous grass
banks. All fifteen crossings have clear entrances and supported approaches to
the lowered bank. Sluice winches and entrance bollards are removed. Footways
and west-spit gravel follow the exact terrain triangles and stop at water;
bridge footprints reserve their own paving. The west-spit hedges keep their
closed foliage geometry, grounded roots and breakable bays.

The new crossing test checks 1,330,126 drawn-paving samples, seventy-six sluice
passage probes and thirty real Player traversals across all fifteen crossings.
It also checks 384 root vertices on thirty-two hedges and releases their
colliders after a knock. No legacy quay sheets remain. The largest visible
paving-lift deviation is 0.02809 m at four coping transitions; fifty-six
samples are underneath the real stone lip. The shoreline tests still pass
5,334 drawn-surface probes and twenty-four two-way bank routes in Islands,
plus forty-four unchanged Moskovskaya routes. Islands passes seventeen water
access checks, 138 quick boat-passage checks, boat boarding/reboarding and
the Yacht Bridge clearance and breakable-divider tests. Its road audit and
20,004/20,004 painted-line geometry probes pass. The road-surface audit retains
forty-five residual samples within its existing 120-sample allowance. Layout
and geometry claim checks pass in all eighteen areas. The latter still reports
ungraded non-building claims, including 123 point/line/polygon warnings in
Islands, mostly bridge claims outside the module's drawn cut; these are not
reported as repaired or as an empty audit.

Evidence is under `shots/yelagin-bridges/`. Timed comparisons use the normal
shipping bakes before this round (9.5.1, commit `e16b81d`) and the final 9.5.2
bakes, Edge/D3D11 on RTX 3090 Ti, 1280×720, medium quality and twenty seconds of
real W input. `gates=0` keeps each measurement in one area. CPU audits and
other GPU jobs are excluded from the timed runs. These measurements are
separate from the faster 9.5.0 session above; timings across those sessions
are not treated as a change caused by this patch.

| Route / snapshot | Load s | Mean / p50 / p95 / max ms | >40 / >80 ms | Mean draws | Distance m | Used / backing MiB |
| --- | ---: | --- | --- | ---: | ---: | --- |
| Ryukhina, 9.5.1 | 32.473 | 31.16 / 33.3 / 49.9 / 333.3 | 37 / 3 | 914 | 290 | 389 / 563 |
| Ryukhina, 9.5.2 | 31.172 | 29.64 / 33.3 / 50.0 / 300.0 | 85 / 5 | 913 | 289 | 447 / 628 |
| Station, 9.5.1 | 31.442 | 30.25 / 33.3 / 50.0 / 216.7 | 39 / 3 | 1,180 | 367 | 543 / 908 |
| Station, 9.5.2 | 32.162 | 27.72 / 33.3 / 49.9 / 200.0 | 42 / 3 | 1,169 | 366 | 561 / 1,070 |

Both routes end in the same traffic/obstacle situations, within about one metre
of the preceding endpoints. Loaded-region counts are identical (Islands 51/101,
Station 39/99); neither run loses a region. Average rates remain above 30 FPS,
but p95 stays near 50 ms and Islands has more >40 ms frames and long tasks
(6 before, 29 after). The slightly lower mean is not evidence that hitching
improved. CDP end samples also grow: Islands uses about 57 MiB more JS heap and
65 MiB more backing storage; Station uses 19 MiB and 162 MiB more respectively.
These are uncollected end snapshots, not retained-memory or allocation profiles.
The added paving contributes 3.0 MiB gzip to the site. Region work and GC remain
profiling targets; consistently smooth 30 FPS remains unfinished.

The final manifest check passes **16 fresh areas / 1,869 complete products /
759.2 MiB gzip**. One Smolny product changed by one byte after its original
checksum was recorded; the manifest guard caught it. A complete Smolny rebuild
restored the original expected checksum and a valid gzip stream. No checksum
was relabelled. The complete Pages whitelist measures **980,041,692 bytes**,
within the 1,000,000,000-byte guard.

Normal-loading Islands matches revision `c2df71b21dc4bb9c697c`, with no failed
regions, local assets or module/browser errors. Actual keyboard input traverses
the three reported crossings in both directions, on their decks and full
approaches, without rescues. All six reported views, two wider pond views and
the earlier outer-shore view were opened and reviewed, as were both driving
end frames and all nine car-control frames.

The normal-page red-car test passes entry, acceleration, nitro, camera changes
and exit. Its drift sequence hits an obstacle, and its separate Anichkov leg
remains stationary; neither is counted as a successful traversal. A focused
normal-page physics check on the verified Nevsky lane accelerates the red car
to 64.2 km/h and brakes it to zero without damage. It releases the brake when
stopped: holding the same control continues into reverse. Existing duplicate
texture-painter and D3D shader warnings remain.

```powershell
node tools/area.mjs islands tools/yelagin-crossings-test.mjs
node tools/area.mjs islands tools/boat-passage-test.mjs --quick
node tools/area.mjs islands tools/water-reachable-test.mjs
node tools/drive-bench.mjs --area islands --q medium --seconds 20 --start "-5161.6,-4248.2,4.9" --params "gates=0" --json --diagnostics --out shots/yelagin-bridges/after-road-islands
node tools/drive-bench.mjs --area vladimirsky --q medium --seconds 20 --start "498.2286,135.1625,76.0322" --params "gates=0" --json --diagnostics --out shots/yelagin-bridges/after-road-centre
```

## 2026-11-04 — Hosted iPhone loading investigation (9.5.2, no runtime change)

Tested https://averkij.github.io/n4spb/ directly, Palace-Liteyny bake
`d907bcaa0ac385d6e309`, with Edge 156.0.4314.58 and the Performance tier.
The deployed version and generated revision agree with the deployed manifest.
The new `tools/hosted-load-probe.mjs` uses real CDN/fonts/HTTPS assets in a
fresh browser profile and records CDP network, phase and memory evidence.
GPU jobs were serial; no offline CDN replacements, shot mode, forced bake or
whole-city loading. These are diagnostic samples, not before/after optimization
results or FPS measurements.

| Run | Ready | Sample | JS used heap MiB | Backing storage MiB |
| --- | ---: | --- | ---: | ---: |
| Touch emulation, 956 x 440 CSS px, DPR 3 | 64.3 s | 17%, streets | 371 | 328 |
| Same run | | 20%, city | 442 | 339 |
| Same run | | Ready; largest sampled heap + backing sum | 406 | 981 |
| Desktop, 1280 x 720, DPR 1 | 43.4 s | 97%; largest sampled heap + backing sum | 447 | 1279 |

These values are not retained-memory measurements or process RSS. They exclude
GPU/native allocations and other processes/workers; sampling can miss peaks.
Do not add `performance.memory.usedJSHeapSize` again: use the separate CDP
fields. The cold-profile runs differ in viewport, touch GPU settings, network
timing and GC, so their times do not establish mobile-vs-desktop speed.

The touch run recorded 736 request events (679 Script events), about 44.6 MiB
of encoded network bytes including early post-ready streaming. Its largest
recorded main-thread tasks were 4.37 s, 4.10 s and 3.13 s. There were no module,
baked asset or worker failures in either normal run. The expected optional
`__baked_revision` 404, duplicate `st_floor` texture-painter warning and
ground-shader compiler warnings remain. Start-button interactions entered
`playing` in both runs and screenshots were opened and reviewed.

Fault injection established two distinct 0% failures: aborting the optional
revision request causes a fatal `Failed to fetch`, while blocking jsDelivr
prevents main-module execution and eventually shows the 45-second watchdog.
Both probes exited 1 as expected. A normal revision 404 is handled successfully.

The real iPhone 16 Pro Max remains failing on Safari/Chrome and both Wi-Fi and
cellular. Owner A/B evidence: disabling early compile still freezes at 3%;
also disabling the baked worker reaches 100%, restarts from 0%, reaches 100%
again and crashes. This implicates worker/scheduling/peak-memory behavior,
but does not prove a worker implementation defect. The 100% label precedes
first render and proxy GPU uploads. Browser/OS termination under memory
pressure is a leading hypothesis, requiring matching device logs.

Reproduce with `node tools/hosted-load-probe.mjs --mobile` and the fault
commands in [MOBILE.md](MOBILE.md#10-hosted-loading-investigation-2026-11-04-952).
Full evidence for this session is in the OS temp directories
`n4spb-hosted-mobile`, `n4spb-hosted-desktop`,
`n4spb-hosted-revision-failure`, and `n4spb-hosted-cdn-failure`.
Next work: bounded worker/fetch diagnostics, required-product failure handling,
field hydration and concurrent prefetch memory, then first-frame GPU upload
peaks. Real-device loading, smooth FPS and mobile stability are not solved.

## 2026-11-05 — Obvodny divider and railway clearance (9.20.1)

The road-marking owner now handles a fork without painting an extra divider
for each same-direction branch. The Tsarskoselsky railway uses the two mapped
deck footprints (`r11704745`), a 6.4 m scene deck datum, 0.8 m slabs, and 180 m
rail approaches. The datum provides road clearance; it is not a surveyed bridge
elevation. Sleepers, switch equipment and overhead wires follow the same
profile. `electrified=no` no longer creates catenary. Static geometry remains
spatially bucketed; there is no new per-frame scene scan.

Visual evidence: `shots/obvodny/integrated_{0,1,2}.png` covers the reported
road pose, aerial crossing pose and road beneath the deck. The integrated
aerial diagnostic changed from 696 calls / 1,061,138 triangles to 705 calls /
1,095,762 triangles on the same RTX 3090 Ti / Edge D3D11, medium, 1280×720.
This is a rendering diagnostic, not a driving-performance comparison.

Focused checks pass: `obvodny-crossing-test.mjs` under Vladimirsky (single
divider, continuous rail height, correct electrification, walkable deck and
under-slab clearance), `physics-triangle-test.mjs`, `street-rendering-test.mjs`,
the rail module check, closure lint, and the strip road/marking audits.
All 16 live-area marking audits were run; Palace, Smolny and Dekabristov each
retain one missing signalised stop bar, reproduced in an unmodified HEAD
archive. The Vladimirsky road audit also matches HEAD exactly: 100 furniture
findings and 228 residual surface samples in 70 clusters against a budget of
120; the ribbon audit passes. These unrelated failures were not waived.
The Vladimirsky quick water-access regression passes 16 checks, including
walking/driving into water and connected water bodies, and retains one fence
record without a collider; the unmodified HEAD archive reproduces that result.

Driving comparison commands (normal baked loading, no forced bake, 8 s,
medium, 1280×720, RTX 3090 Ti / Edge D3D11, separate serial GPU runs):

```powershell
node tools/drive-bench.mjs --area vladimirsky --seconds 8 --start "-878.8,1993.4,128.6" --json --diagnostics --out shots/obvodny/drive-after
node tools/drive-bench.mjs --area palace --seconds 8 --start "498.2286,135.1625,76.0322" --json --diagnostics --out shots/obvodny/centre-after
```

| Route / build | Load s | Mean / p50 / p95 ms | >40 / >80 ms frames | Mean draws | Distance m | CDP heap / backing MiB |
|---|---:|---|---|---:|---:|---|
| Obvodny before | 34.9 | 33.1 / 33.3 / 50.0 | 15 / 2 | 702 | 147.6 | 485.3 / 1034.8 |
| Obvodny final bake | 35.6 | 32.3 / 33.3 / 50.0 | 16 / 1 | 700 | 149.8 | 489.1 / 1057.1 |
| Nevsky before | 44.9 | 50.6 / 50.0 / 66.8 | 133 / 4 | 1286 | 269.0 | 460.4 / 1247.5 |
| Nevsky final bake | 44.1 | 50.5 / 50.0 / 66.7 | 137 / 2 | 1286 | 269.0 | 454.0 / 1203.9 |

The Obvodny runs both encounter traffic, explaining the small distance/damage
variation; they pass beneath the repaired crossing. Frame times are essentially
unchanged. A roughly 350 ms streaming hitch remains there, and the centre is
still around 20 FPS, below the 30 FPS goal. This change does not claim to solve
citywide performance. The larger centre draw workload remains the measured
next performance target.

Final normal-loading screenshots are `shots/obvodny/final_{0,1,2}.png`;
`drive-test.mjs --area vladimirsky --nofuzz --out shots/obvodny/controls`
passes its entry, acceleration, camera, braking and exit checks. No page/module
errors were reported; existing shader/texture warnings remain. Manifest check
passes all 16 live areas: 1,869 complete products, 759.2 MiB gzip. All source and
bakes are included in the same version checkpoint.

## 2026-11-05 — Canal seams and boat camera (9.21.1)

Connected navigable water now shares the -3.4 m datum in rendering, layout,
physics and bridge waterlines. Beds retain their previous depth below water.
CI subsequently caught isolated ponds that reused the moat style; their
restoration and expanded coverage are recorded below for 9.21.2. Canal-mouth arches follow
the skewed banks, and natural-bank end caps no longer rise from the submerged
shelf into open water. These are static changes using the existing batches.

Small-boat chase views probe nearby overhead clearance every 0.08 s, lower
and retract before a low span, hold across deck-piece gaps, then ease back.
The continuous obstruction query is bounded at 128 samples even for the
cargo ship's long camera boom. The real camera/collider regression covers both
chase views at 12 m/s: maximum movement relative to the hull is 0.076 / 0.202 m
per frame at 60 Hz, with no bridge intersections and return to open-water view.
This is a motion/clearance test, not an FPS measurement.

Checks: water-level consistency in all 18 implemented areas; real boat passage
in Palace (108 checks) and Admiralty (169); 18 Palace bridge envelopes; natural
banks in Palace, Moskovskaya, Kolomna and Islands; quay fixtures in Palace,
Moskovskaya and Islands; water joins, audio, gates,
layout goldens, dependency closures and the CPU deployment oracles. The new
water-level and boat-camera checks run in CI. Normal-loading screenshots in
`shots/bridge-fix/final-palace_*`, `final-admiralty_*`, and `final-camera_*`
cover the reported defects, nearby Upper Swan/Prachechny bridges and a boat
passing beneath Panteleymonovsky Bridge. The real gate notice is visible in
`final-warning_0.png`, 25 m before the loading trigger, with travel still idle.

The same two 8 s driving routes and settings as the 9.20.1 comparison above
were run serially after normal baked loading, with no CPU checks or bake running:

| Route | Load s | Mean / p50 / p95 ms | >40 / >80 ms frames | Mean draws | Distance m | CDP heap / backing MiB |
|---|---:|---|---|---:|---:|---|
| Obvodny 9.21.1 | 35.6 | 32.1 / 33.3 / 50.0 | 19 / 2 | 703 | 147.6 | 463.7 / 778.1 |
| Nevsky 9.21.1 | 44.5 | 52.9 / 50.0 / 66.8 | 134 / 7 | 1296 | 269.0 | 433.0 / 739.2 |

Evidence: `shots/bridge-fix/bench-{obvodny,centre}.json` and their end screenshots.
Obvodny remains about 31 FPS with a 333 ms streaming hitch. The centre's mean
is 2.4 ms slower than the earlier short sample, with similar p50/p95 and about
10 more draw calls; it remains around 19 FPS, below the 30 FPS goal. These short
runs do not establish a citywide performance improvement. No module/page errors
were reported in the loaded-scene checks; existing shader warnings remain.
All 16 live-area manifests match the source: 1,869 complete products, 759.2 MiB
gzip. The deployment asset audit and generated diagnostic-page check pass.

## 2026-11-05 — Explicit isolated pond datums (9.21.2)

The integrated Victory Park test caught a regression missed by the initial
water-level test: isolated ponds reused the connected castle-moat style and
were lowered with it. Explicit area water/bed datums restore Moskovskaya and
Kolomna ponds to -1.2 / -2.4 m. Okrug65's Lower Buffer Pond keeps those levels;
the six shared Yelagin ponds instead use the Islands mapping at -3.4 m in both
areas. Their two mapped bridge openings use the same resolved pond key.
Connected canal mouths retain the common -3.4 m datum.

The expanded 18-area regression samples rendered pond cuts, physics and bridge
waterlines, checks shared Yelagin coordinates in both areas and rejects an
intentional isolated-level mutation. Victory Park's integrated check passes
all 11 dry islands and nine real boat courses. Kolomna's retained pond/canal
walking routes and render/terrain overlap regression also pass. The datum
settings add no per-frame work; this correction does not change the measured
Palace/Obvodny routes above.

All 16 shipping scenes were rebuilt: 1,869 manifest-verified products, 759.2 MiB
gzip. Pages asset and generated diagnostic-page checks pass. The synthetic
topology fixture was updated for the added area-table defaults; the Windows
bake-plan test had one transient temporary-directory cleanup error and passed
all 21 checks on retry.

Normal baked loading was checked visually in Victory Park, Yekateringof Park
and the two Yelagin pond crossings (`shots/bridge-fix/pond-moskovskaya_*`,
`pond-kolomna-close_*`, `pond-okrug65_0.png`). Shallow pond surfaces meet their
banks and islands; the shared Yelagin water remains continuous beneath both
crossings. No module/page errors were reported; existing shader warnings remain.
