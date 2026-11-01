# Quay junction lower face

Reported pose: `-605.7,1.5,-858.6,426.2,0` in Palace. The two empty
1280×720 screenshot rays were pixels `(420,480)` and `(410,520)`.

The Fontanka water ring has a short edge from
`[-623.40516265,-858.49765334]` to `[-625.26546490,-861.32296015]`
beside the higher moat basin. The normal quay face is replaced there by a
reentrant moat shore. Its lower edge stops at −1.32m, while the Fontanka toe
is −3.32m. The missing exposed face lay across the original ring edge below
the higher datum. Extending the reentrant shore downward did not cover the
hole: the original rays still missed both front-sided and double-sided faces.

`waterLevelSeams` classifies opposing shared edges of already split water
rings at unequal levels. The renderer adds a vertical, front-sided masonry
quad between their water datums minus the existing 0.12m footing offset.
It faces the lower water. Equal-level joins, overlapping interiors, unrelated
islands and landmark-owned water receive no new face. These small lower
faces are excluded from outlines. The change adds no collider, water polygon,
datum or navigation restriction.

The official [Mostotrest history of the Second Engineer Bridge](https://mostotrest-spb.krti.gov.spb.ru/jubilees/2-j-inzhenernyj-most-142?year=2026)
explains that the canal was filled in 1879–1882. The 2003 restoration did not
reopen the section beneath this bridge, which remains above filled land.
Consequently the repair closes a grade face; it does not invent a boat portal
through the filled section. Source consulted 2026-11-01.

## CPU regression

Run `node tools/area.mjs palace tools/quay-junction-foundation-test.mjs`.
The focused test checks seven classification/immutability cases, all actual
repair triangle normals and winding, and the six reported rays at three eye
heights. Palace emits ten quads (twenty triangles) in four material buckets.
At the original eye height the two formerly empty rays now hit the Fontanka
foundation at −1.99446m and −3.08373m. Neighboring rays still hit the original
Fontanka wall. All water polygons and datums remain identical after building.

The `--mutant-no-foundation` option removes only these repair meshes. It fails
on the original missing-face ray, as intended. Logs are kept under
`shots/quay-junction-foundation/`. GPU review is serialized by the parent task.

The `--geometry-only` option audits the actual environment meshes in other
areas without applying Palace camera coordinates. All sixteen live registry
areas pass: 75 quads / 150 triangles in total. Smolny, Morskoy, Dekabristov,
Moskovskaya and Islands legitimately have zero unequal-level seams. Each
area checks actual mesh presence, one quad per classified seam, face winding,
vertical normals, front-sided material, outline exclusion and unchanged water
polygons/datums. Equal-level synthetic joins generate no geometry. Per-area
logs and the aggregate result are `*-geometry.log` and
`registry-geometry-summary.json` in the same log directory.
