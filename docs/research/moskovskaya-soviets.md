# Дом Советов и Московская площадь

Authoring research checked 7 November 2026. This dossier concerns the separately
authored building, Lenin monument and formal plaza paving. The eleven mapped
fountains, trees and street fixtures retain their existing generic area owners.

## Reference evidence

- [Saint Petersburg tourism bureau: Московская площадь](https://visit-petersburg.ru/en/leisure/places/tp-197928-moskovskaya-ploshchad/): House of Soviets built in 1936–1941; Lenin by M. K. Anikushin and V. A. Kamensky installed in April 1970; eleven fountains added in 2006.
- [Saint Petersburg culture portal: aerial photograph and local library excursion](https://spbcult.ru/events/ekskursii/poznavatelnaya-progulka-vokrug-doma-sovetov-legendy-i-byli/).
  [Direct frontal aerial photograph](https://spbcult.ru/upload/iblock/474/rpgr66tuvq3gcah0qaqpw3ut5b7edjc2.jpg)
  was downloaded to the temporary directory and visually inspected: fourteen
  very tall round columns, seven each side of the broad rusticated central
  entrance; shallow stone figure frieze above; wheat-wreath roof emblem;
  lower wings with closely spaced pilasters and four-column end porticoes.
  The monument has a narrow granite monolith, low stepped base, extended right
  arm, forward stride and windblown coat. The original rooftop pole is omitted
  under the owner's scene-wide rule.
- [Wikimedia Commons frontal fountain photograph](https://commons.wikimedia.org/wiki/File:House_of_Soviets_SPB.jpg),
  additional visual reference found by image search. Download was rate-limited;
  the culture portal aerial was the inspected authoring reference.
- [OpenStreetMap surveyed outline r5933725](https://www.openstreetmap.org/relation/5933725)
  and [Lenin monument w189982684](https://www.openstreetmap.org/way/189982684).
  Footprints were read from the whole-city source at
  `D:/git2/agi-fun-tests/102_3d_piter/src/world/data/city.js`; they remain data,
  rather than being approximated with a rectangular building.

## Geometry and ownership

The parent outline is centred at `(-1393.1, 8936.6)` in scene metres. Claiming
`r5933725` claims the four part records through parent inheritance:

| Record | Role | Authored cornice height |
| --- | --- | --- |
| r1145686 | Five-storey wings, rear assembly hall and court returns | 20.5 m |
| r5933731 | Central frontage, measured approximately 102.1 m long | 33.8 m |
| r5933729 | South central risalit | 34.1 m |
| r5933730 | North central risalit | 34.1 m |

Heights are authoring estimates following the existing source model and the
photograph's storey ratios; they are not represented as surveyed elevations.
Every part uses its real footprint, roof cap and perimeter wall colliders.
The parent outline is skipped when its parts are available so its three court
holes remain open to the sky. The central portico follows the longest west-facing
edge of the central part, including the actual slight rotation. Fourteen shafts
are physically separate with passable gaps; the overhead frieze has 48 varied
shallow relief figures. Stone bases and capitals stay with the distant silhouette,
while windows, relief figures and fine emblem details use the common 380 m range.
The fourteen shafts are architectural supports, not knockable street furniture.
No new per-frame callback or material family is added.

Lenin is placed at the mapped `(-1577.8, 8941.8)`. His approximately 16 m overall
height includes a 7.5 m granite plinth. Both the monument and portico supports
check the real asphalt cover before placement. Separate formal paving uses exact
lawn/pool subtraction and real asphalt checks. No new railing, lamp, bench,
fountain basin or static jet duplicates the generic square's objects.
Generic fountains continue to use the shared live fountain water, keeping
reachable basin water and existing nearby-only animation.

The source maps five large fountain nozzles as points inside four separate
`water=pond` polygon families. Their real basin identities are `r7369984`
(two disconnected north/south rectangles), `w74201757`, `w74201759` and
`w91838567`. These are fountain pools in the inspected aerial, not garden ponds.
`tools/moskovskaya-square-fountains.mjs` corrects their kind, removes them from
the river/pond mask and makes the exact mapped polygons available to the
existing generic live fountain builder. The five point records remain
containment aliases; the six western small square pools retain their way IDs.
This yields eleven physical operating basins without adding duplicate jets or
inventing OSM IDs. The correction is idempotent and preserves each basin ring.
The importer adapter is `correctMoskovskayaSquareParts(parts)`; the local
application command is `node tools/moskovskaya-square-fountains.mjs --apply`.

## Integration and checks

Merge `soviets-groups.js` `GROUPS_LIST` into the Moskovskaya area groups. Import
`soviets, lenin` into `landmarksMoskovskaya.js`. In the building loop, call
`soviets(K, L.groupMembers('mz-soviets'))` between `K.begin()` and
`K.flush('soviets')`. Separately call `lenin(K, mappedMonument)` and flush as
`moskovskaya-lenin`; obtain that monument from the area's `MONUMENTS` export by
id `w189982684`. Do not claim the fountain IDs.

Focused CPU audit: `node tools/area.mjs moskovskaya tools/moskovskaya-soviets-test.mjs`.
The test probes actual front-facing meshes and real physics for column/gap
agreement, the three open courts, facade footprint coverage, bounded geometry,
and the monument. It also checks that the builder introduces no frame callbacks.
Use integrated streets/city, road and marking audits, normal bake review and
serial GPU screenshots for final integration validation. Suggested cameras:
front overview `-1735,45,8940,-90,-8`, standing frontal
`-1620,1.7,8940,-90,8`, portico `-1455,1.7,8920,-90,15`.

The complementary `tools/moskovskaya-expansion-test.mjs` compares the expanded
data against a git baseline (`--baseline HEAD` during authoring), probes former
road geometry and playable cells, preserves prior building families and mapped
trees, and samples real Victory Park pond water and dry islands. Optional
`--source D:/git2/agi-fun-tests/102_3d_piter/src/world/data/city.js` audits source
ways with multiple clipped records sharing one OSM ID. A source family must
retain every geographically relevant piece, even when the old local baseline
had already lost one of them. Use an explicit pre-expansion git revision for
later historical comparisons after committing this expansion.

## Formal square surface

The first integrated aerial (`shots/areas-nov7/south-normal_1.png`) exposed
generic yard-style grass/asphalt patchwork over much of the public square.
The inspected culture-portal aerial instead shows one coherent light granite
field, distinct mown lawn islands, pool aprons and a double rectangular border
around the Lenin court. `soviets-square.js` authors that surface separately.

Its approximately 32,378 m² field follows actual pedestrian-way vertices:
`w91840938` at the north, `w1019539996` at the east,
`w1019540001` at the south, and `w1019539998`, `w155148764`,
`w91840936` at the west. It ends west of Demonstration Drive and east of
Moskovsky Prospekt. Every mapped grass, wood and scrub polygon intersecting
this field is retained. Overlapping green records are unioned into one lawn
surface; all eleven exact fountain polygons are holes in both paving and lawn.
The areas reconcile to 20,616 m² paving, 7,346 m² lawn and 4,416 m² pools,
without gaps or overlapping surface layers.

The light granite uses one small shared slab atlas with restrained colour
variation. Darker granite bands reproduce the double monument-court frame and
follow the five large pool perimeters; these divide the surface material,
rather than introducing raised geometry. The inlay layout is a photo-derived
authoring estimate aligned with the slightly rotated measured facade.

The final paving and lawn triangles check the real `net.cover` throughout
their interiors on a grid of at most 1 m. Any contested piece is subdivided
and clipped down to 25 cm before omission, so neither service roads nor their
junction envelopes receive a stone overlay. Pavement remains visual at
`y=.145`, lawn at `.15`; no new collision surface or update callback is added.
The isolated area-data build adds 1,010 static triangles and three materials.

Area integration uses `MOSCOW_SQUARE_PAVED_RINGS` from
`soviets-square-plan.js`, which contains the 147 exact paved pieces after
green and pool subtraction. Claiming the enclosing field instead would
incorrectly remove trees from the lawn islands. Ground holes are unnecessary:
the generic floor remains physical support below the visual paving.

Context review: both `square-paved-preview_0.png` (aerial) and `_1.png`
(pool edge) in `shots/areas-nov7` were inspected. The formal field replaces
the patchwork, preserves the lawn islands and leaves every basin open.
The older `w715035938` pedestrian-area skin was still visible over the north
quarter in that preview; the square group's ownership now claims that exact
surveyed area so the generic streets builder skips its competing surface.
The reviewed shots were procedural context checks, not final baked-loading
or performance evidence. Their logs contained no page/module error; the
previously observed ground shader warnings remained.

Independent CPU rays checked 4,471 paved points, 1,579 lawn points and 952
open-water points against the drawn faces, with zero new colliders/callbacks.
The full focused road audit (`--near -1578,8942,250`, 6,584 samples) found no
surface offender belonging to this square or the Soviets building. Its overall
exit remained a failure because of 35 separate Moskovsky Prospekt median
samples outside the authored square (bare generic ground / other street
pavers); those are not waived or reported as passing here.
