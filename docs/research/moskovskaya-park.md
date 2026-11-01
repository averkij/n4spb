# Московский парк Победы — references and implementation

Updated 2026-11-01 for the new Московская застава area. The owner supplied a
summer bank-level photograph and an oblique aerial view. These establish the
important impression: substantial mature green crowns, open grass right down
to the water, irregular shores, low islands, and long views between the ponds.
The park must read as a landscape with a formal memorial axis, rather than a
collection of monuments on an empty green rectangle.

## Evidence inspected

The [park operator's map](https://gupmpp.ru/images/MPP_Katok.png) was inspected
alongside the supplied aerial. Its north-up geometry distinguishes the two
western Очки basins, Fountain Pond and its islands, the long Корабельный pond,
the southern Адмиралтейский pond, eastern ponds, and the northern landscape
ponds. It also locates the main east-west avenue and amusement corner. The
operator's [sport and boat-station page](https://gupmpp.ru/sport.html) confirms
summer rental of rowing boats and pedal boats; boat access is part of the park,
not an invented use. The map is schematic and predates changes outside the
historic park; OSM geometry supplies metric shore/building locations.

The city's official [park walking route](https://visit-petersburg.ru/route/tp-119-park-pobedy/)
describes the regular/landscape composition, lime-lined Heroes' Alley, original
six busts and later additions. Its [fountain entry](https://visit-petersburg.ru/leisure/places/tp-199593-fontan-venok-slavy/)
provides the 25 m basin diameter and 12 m principal jet. The inherited model
approximates the many overlapping jets with fixed slender curved geometry;
the exact nozzle count is not represented as a hydraulic simulation.

The National Library's [park ensemble exhibition](https://expositions.nlr.ru/ve/RA3671/parkovyi-ansambl)
and [planning history](https://expositions.nlr.ru/ve/RA3658/proektirovanie)
identify the 1952 chess/checkers pavilion, its later cinema use, classical
propylea and memorial ensemble. The modern summer
[pond-side pavilion photograph](https://wgt-prod-storage.s3.amazonaws.com/media/products/imagefile/None/snapedit1712342203956.jpeg)
was inspected for the pale yellow walls, white columns, arched tall glazing,
deep open porch and shallow grey metal roof. This photograph also shows the
low grassy shoreline and actual pedal boating in front of the building.

The operator's [memorial-zone account](https://gupmpp.ru/memorial.html), its
[photograph of the Memory pavilion](https://gupmpp.ru/images/photo4.jpg), and
its [80th anniversary page](https://gupmpp.ru/80year.html) establish an important
distinction: the structure called Ротонда is a square classical portico with a
triangular pediment and a central porphyry urn, not a circular domed gazebo.
Its bronze date inscription, pale stone and red-granite base are represented.
The source previously included the trolley memorial but omitted this portico.

The [Saint Petersburg diocese chapel entry](https://globus.aquaviva.ru/khram-vsekh-svyatykh-v-zemle-rossiyskoy-prosiyavshikh-v-moskovskom-parke-pobedy)
and its [exterior photograph](https://globus.aquaviva.ru/upload/iblock/e6e/khram_vsekh_svyatykh_v_zemle_rossiyskoy_prosiyavshikh_v_moskovskom_parke_pobedy_08_09_2012.JPG)
were inspected. The All Saints memorial chapel has ivory walls, short projecting
arms with pediments, arched windows, a dark faceted roof with circular dormers,
a small dark cupola and a gold Orthodox cross. It is a restrained small chapel,
not a large golden cathedral.

The [Vietnamese newspaper's Raymonde Dien feature](https://special.nhandan.vn/raymonde_dien02/index.html)
includes the [inspected monument photograph](https://special.nhandan.vn/raymonde_dien02/assets/G11yeRMFWA/a5-1966x1474.jpeg).
The bronze figure is seated/kneeling on rails with a raised arm, on a broad
granite plinth beside the landscape pond. The model keeps that pose; the small
cloth visible in the photograph is omitted under the owner's flag rule.
The National Library ensemble page also identifies the two-figure Brotherhood
sculpture, now represented at its mapped north-western node.

References are held under the session temporary directory
`%TEMP%/moskovskaya-park-refs`; photographs are not game textures or repository
assets. The scene uses only authored geometry and a shared text atlas.

## Source inspection and responsibility

Inspected `D:/git2/agi-fun-tests/102_3d_piter/src/world/landmarksVictoryPark/`
before porting. Its source `sites`, `ensemble`, `sculptures`, `arena`, `mats` and
`kit` are adapted into `src/world/landmarksMoskovskayaPark/`. The current project
had only the old generic `landmarksVictoryPark/kit.js`, with no live park module.
The new area retains source WATER/GREEN/footways and pond holes; the foundation
agent handles terrain, water masks, natural shore slopes and bridge integration.

The nine named pond outlines are not approximated with ellipses. Important IDs:

| Mapped water | OSM relation | Island holes in the source |
| --- | --- | --- |
| Адмиралтейский | r77680 | 1 |
| Очки | r109994 | 2 |
| Фонтанный | r11008649 | 2 |
| Корабельный | r11010469 | 0 |
| Пейзажный | r147758 | 3 |
| Фигурный | r1380826 | 3 |
| Капитанский | r11010790 | 0 |
| Матросский | r11014824 | 0 |
| Детский | r11016386 | 0 |

The six mapped footbridges stay with the area's shared bridge builder:
`w40350150`, `w66996808`, `w66996833`, `w70483744`, `w70483724`, `w66996885`.
They are not duplicated by this landmark module. Bridge railings use the
current breakable-bay implementation and preserve the navigable opening below.

## Authored scale and fidelity

| Object | Position/extent | Geometry and evidence |
| --- | --- | --- |
| Paired propylea | r15756570 / r15756569; centres −1683.48,7060.59 and −1682.60,7086.75 | Exact roof frames; approximately 12.0 × 7.9 / 12.1 × 7.2 m, height 9.7 m; four ochre columns, six figure reliefs, laurel cornices |
| Венок славы | w32073130; −1625.5,7071.9 | 25 m basin, 12 m plume, central bronze wreath and low ring jets |
| Heroes' busts | 22 exact source nodes | Red-granite 3.2 m bases, bronze 1.2 m busts, coat/medal/civilian variants and individual name plaques; stylized sculpture, not portrait scans |
| Main pavilion | w30899425; −1466.3,7302.4 | Exact 28.7 × 15.2 m mapped envelope; estimated 6.9 m cornice / 8.9 m roof ridge, eight porch columns and seven arched window bays |
| Memory portico | w621507834 / n1520977370; −1289.5,7452.6 | Approximately 4.9 m square platform, 8.2 m pediment, open column bays and central urn; height/stone details estimated from photographs |
| Ochki lions | n4484392661 / n4484392662 | Exact nodes; approximately 2.2 m with plinth, seated pale stone lions facing the channel |
| All Saints chapel | r11008642; −1419,7397 | Exact irregular mapped wall footprint, estimated 6.6 m wall height / 15.9 m cross tip, dark faceted roof and small cupola; exterior only |
| Raymonde Dien | n4485866600; −1615.7,6956.8 | Raised-arm seated/kneeling bronze silhouette and short rails; approximately 4.6 m with the broad plinth |
| Brotherhood | n4369354189; −1597.7,6906.7 | Two standing bronze figures meeting above a red-granite pedestal; approximately 4.2 m total |
| SKA Arena | w1024552165 | Source mapped oval envelope, shallow silver roof, inclined support fans and dark inner glazing; approximately 41.5 m roof; no interior |

The park's source extract contains zero explicit TREE_ROWS or individual TREES
nodes. Generic OSM GREEN polygons still generate the main forest. `plan.js`
adds a restrained, aligned double lime avenue derived from the real Heroes'
Alley; the area hook keeps generic trees clear of those particular planting
positions. At pond shores, sparse multi-stem willows and birches/limes follow
the actual outer and island shore rings. Each candidate tests the dry side,
building/road/path clearance and nearby existing trees. No new trees stand
inside water or replace the pond islands. Willows use shared immutable lobe
geometry; there is no separate tree animation callback.

White slatted garden seats and dark small park lanterns supplement mapped
paths, leaving the final carriageway footprint and walking approaches clear.
The six stone seats under the entrance porticoes are separate knockable
fixtures as well. The mapped memorial flowerbed receives low coloured blooms.

## Integration and world rules

`groups.js` contains pure claim/mask data, safe to import when a verifier has no
page import map. Three groups own the memorial ensemble, arena, and additional
pond pavilions/sculptures. Generic building walls are suppressed only for the
claimed records actually drawn. PAVED_RINGS excludes generic vegetation within
the small architectural footprints and fountain basin; it does not claim or
pave the entire park.

The inherited fountain had a cylinder collider across the whole basin. That
blocking volume is removed. Its shallow floor remains walkable, with individual
visible bronze supports; the water is reachable by walking/driving. The basin
registers a native physics water polygon as well as the area's explicit water
mask. Pond shores are natural open slopes,
without an enclosing parapet/fence. Boat rental is mapped at `w1087536997`,
approximately −1155.8,7317.8; the foundation supplies usable boat spawns nearby.
The owner's general no-flag/no-alarm rules apply throughout this park.

Immutable objects use shared materials/shape geometries and `ctx.addStatic`,
bounded 192 m static instance cells and authored finite detail ranges. The
arena roof retains its skyline range. Repeated movable seats/lanterns use
`knockInstances`, Dynamic matrices, 384 m cells and finite ranges, registered
during build. No `noBatch`, unbounded dynamic attachment or city-wide update
is added. Only the known arena silhouette uses infinite structural range.

Services: `ctx.services.landmarksMoskovskayaPark` publishes `monuments`,
`photoSpots`, `entrances`, `benches`, `lamps`, `trees`, `triangles`, `buildMs`,
`updates`; monuments/photo spots merge into `ctx.services.landmarks`.

## Verification and budgets

The park landmark module's isolated geometry checkpoint measured **224,751
triangles against its 260,000 budget**, 369 instance buckets, 2,939 instances,
27 materials, one 1 Mpx text atlas, 638 colliders and no update callbacks.
It registered 46 benches and 40 lanterns. These are historical isolated-module
measurements, not whole-area loading or FPS results. The final shared
environment measures **893,242 triangles against its 980,000 budget**, with
37 materials, 850 meshes, 84 instance types, 37,493 instances, 19,895 colliders
and seven existing update callbacks. Width fitting adds no per-frame callback.
Shipping bake, loading and performance evidence belongs in
[PERFORMANCE.md](../PERFORMANCE.md).

The integrated park regression builds real environment, streets, city, park
and bridges. It checks boat acceleration in all nine named ponds, dry island
interiors, legal wet car poses, an actual walk through the shallow fountain,
open propylea/pavilion bays with solid columns, and representative bench/lamp
impacts removing their upright colliders. Its fountain-cylinder mutation
detects the former blocked basin. These checks complement the full area's
**15 water-reachability checks and 14 boat-passage checks**, repeated after
the final bank changes.

The production-world natural-bank test uses the real Player and Physics
services. Final Moskovskaya results are **44 two-way walking routes through
11 basins, including all nine named ponds; 22,986 walk triangles; 793 actual
front-sided mesh rays; maximum render/terrain error 0.000274 m; and 11,240
walking updates**. One obstructed candidate is excluded because a real
structure occupies it. Thirty runs include sixteen closed runs. Its
flat-floor mutation detects the former invisible terrain mismatch.

Native fountain water is registered by the live park builder on each boot;
the baked loader hydrates environment/city products and still calls landmark
builders. The normal page therefore retains the native water ring without
a physics-codec extension. The focused runtime query is
`__ctx.physics.waterLevel(-1618.5,7071.9) === 0.29`.

The original isolated geometry views, integrated pavilion/chapel/portico
images and depth-precision checks are retained in
`shots/moskovskaya-park/`. Their worst depth probe was 0.001% with no reported
offender. They establish architectural context and depth stability, not
proof of shoreline support. The final normal-page regression
`tools/park-shore-playtest.mjs` separately reproduces the reported low camera
views and walks out of, into and out of the bank near `(-1407.9,7248.1)`.

## Final shared shoreline implementation

The original Fountain Pond island defect combined an erased source edge
with inconsistent closed-bank mitres. Its surveyed hole
(`r11008649`, polygon 0, hole 0) lost a real nearly vertical shore near
`(-1400.3,7160.6)` because it lay within the old tolerance of an unrelated
extent's x = -1400 clip line. Nearby triangulation diagonals also fooled the
old distance-only join rule. The final shared extraction:

- Splits edges at crossings and collinear endpoints of other water boundaries
  through a temporary 64 m index before testing each uniform piece.
- Checks hydraulic continuation on both sides, preserving real shores even
  when they lie exactly on a clipping line.
- Requires opposing water interiors for seam-gap repair and prevents repaired
  gaps from overlapping authoritative source island/pier holes.
- Excludes doubled zero-width connectors over dry land.

This is general water topology, without island coordinates or per-area
exceptions. Splitting is necessary for the long Neva regional edge at
x = -430: its short shore portion must not retain a 580.9 m wall across the
rest of the open join. The full Palace regression now passes **108 checks**
and retains a 1,774,776 m² main boat-free component.

Drawing and `layout.heightAt` consume the same immutable natural-bank
surface triangles, including a submerged return to the bed. Closed runs
wrap identical mitres and omit end caps; true open ends use complete profile
strips. Each walk triangle faces upward independently, including warped
quads. Concave offset footprints are triangulated before convex subtraction.

Available dry width is measured at construction time with at most 2 m spacing.
Positive bank offsets reserve at most 49% of an intervening dry strip for
each shore, constrain backtracking on short corner edges, and blend widths
by at most 0.5 m per metre. Inserted collinear samples are removed only where
all adjacent widths remain unadjusted; source bends and fitted transitions
remain. Render profiles, terrain queries, ground cuts, clearing rings and rail
tops share those fitted widths. Submerged returns and water membership remain
unchanged. This prevents adjacent pond/canal aprons at different levels from
ending in a ledge, as exposed by the Kolomna regression.

## Independent audit and its limits

Run the final dense audit with the complete production module list:

```text
node tools/area.mjs moskovskaya tools/park-shore-topology-audit.mjs --geometry --strict --json shots/moskovskaya-park/shore-audit-after.json
```

The frozen-source result (`7f79bc1d0c42b188`, quay/waterways digest) checks
**8,457 generated-bank samples, 125,146 actual Float32 grass samples,
35,789 dry-shore samples, 84,080 terrain/bridge triangles and 2,554 final
convex cuts**, with no missing/back-facing shore, render/physics mismatch,
erased source edge, phantom internal bank, closed-join seam or module error.
Fourteen raw offset footprints are concave; every final subtraction cut is
independently verified convex.

`tools/water-bank-topology-test.mjs` independently checks all **11 original
islands, 30,106 dry interior probes and 8,425 source shoreline probes**.
Its pre-fix checkpoint comparison failed on an erased shore of `r147758`
near `(-1551.05,6962.6625)`; the normal regression is independent of Git.
`tools/water-join-topology-test.mjs` supplies a separate synthetic mixed
shore/open join and a genuine island edge exactly on the same clip line:
only the internal join disappears, while all 100 island probes stay dry.

The earlier island-centre and interior-boat checks missed shoreline defects:
neither traversed every waterline. Comparing a queried floor with the same
query as the expected answer also accepted phantom terrain. Distant pictures
and depth probes did not close those gaps. The dense audit instead compares
original WATER rings, generated banks, actual transformed Float32 triangles,
Physics support and final cuts. It probes triangle interiors and points near
edges/vertices, plus eight offsets across each source shore.

The full module list matters: `landmarksMoskovskaya` invokes the district's
scoped removal of obsolete fallback bridge walk rectangles. Omitting it
created forty discrepancies in a partial test world that do not occur on
the production page. Agreement between mesh and physics alone still cannot
detect a ledge shared by both; actual walking and continuity regressions
supply that evidence. Finite 2 m fitting samples do not establish a
mathematical guarantee for a narrower unsampled neck. Wet car poses also
do not prove every possible driven-car ascent route.

Legacy shore-distance probes inside water return zero, so they did not detect
the temporary Neva wall; full boat connectivity did. The exact checkpoint
comparison preserves all North and Palace probes. Strip's one corrected
distance changes by 1.70085 cm at `(-2545.625,471.111111)`, preserving the
surveyed `r3298111` bend
`(-2670,586.5) → (-2668.9,586.7) → (-2559.2,615.3)` present in both WATER
and RIVER. Its reviewed golden hash is `b930d98e9bd9ca6b`.
The final extraction also changes one Admiralty probe by 1.77625 cm at
`(-3431,-597)` and one Vladimirsky probe by 7.35345 m at
`(2791.666667,-440)`, removing an artificial x = 2770 regional edge.
Their exact artifacts remain under `shots/moskovskaya-park/`; those two
goldens were not refreshed. Existing unrelated Smolny and Kronverk bridge
ram defects and the new area's shared road/facade residuals are explicitly
reported in [MOSKOVSKAYA-AREA.md](../MOSKOVSKAYA-AREA.md).
