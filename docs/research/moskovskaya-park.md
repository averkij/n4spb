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

## Verification

Initial isolated real-renderer views of the propylea, pavilion, memory portico
and high park overview were inspected under `shots/moskovskaya-park/geometry_*`.
These intentionally omit terrain and are geometry diagnostics, not integrated
performance evidence. Headless module check after the chapel and western
sculptures and flowerbed/dormer details: **224,751 triangles (260,000 budget),
369 instance buckets, 2,939 instances, 27 used materials, one 1 Mpx atlas,
638 colliders, zero updates, 230 ms build**.
Knock registers 46 benches and 40 lanterns in the isolated build. The same
fixtures share part geometry and bounded cells, without attaching Dynamic
casters to static shadow sectors.

`node tools/areas-test.mjs --area moskovskaya`: **210 passed, 0 failed** after
making the claim tables pure. The lead owns the complete road/marking audits,
integrated walking/driving/boat regressions, normal loading/bake/performance
measurements and final shipping screenshots; local-only FPS is not evidence
for those contracts. Further integrated image/z-fighting review follows below.

The new `tools/moskovskaya-park-test.mjs --integrated`, run through
`tools/area.mjs moskovskaya`, builds the real environment, streets, city,
authored park and coastal bridges. It passes: all eleven original island holes
have dry physics/terrain; real motorboats accelerate through hull-safe courses
in all nine named ponds; water poses remain legal for cars; a real walker
crosses the shallow fountain; the central entrance and pavilion porch remain
open while real columns stay solid; and representative bench/lamp impacts
remove their upright colliders, preserving Dynamic mesh/finite-range contracts.
The negative control `--mutant-fountain` restores the source's filled cylinder
and correctly fails the water-access assertion.

Five context views (`shots/moskovskaya-park/integrated_*`) were inspected with
the real environment, streets, city, park and shared coastal bridges. The aerial
shows the source's true pond/island network and formal avenues. A narrow
inter-pond bank exposed overlapping broad slope aprons; the area foundation
reduced its natural shore run from 4 m to 2 m, preserving the dry walking strip.
Final pavilion-bank, chapel and Memory-portico views
(`shots/moskovskaya-park/final_*`) were inspected again. A small lawn clearing
around the chapel and the central pavilion porch keeps generic random trees
out of the architectural approaches, retaining the surrounding mature forest.

The corresponding integrated depth-precision probes pass with **6 pixels /
0.001%, 1 pixel / 0.000%, and 1 pixel / 0.000%**, with an empty offenders table
(`shots/moskovskaya-park/zfight_*`). These scene geometry diagnostics include
terrain/streets/city/bridges but omit traffic and people; they remain separate
from the lead's final normal-bake performance measurements.

Native fountain water is registered by the park's live builder on every boot.
The generic baked loader hydrates the environment/city products and still calls
the landmark builder normally; the basin's water ring therefore does not depend
on extending a physics serialization format. The final normal-bake browser
check should query `__ctx.physics.waterLevel(-1618.5,7071.9) === 0.29`.
