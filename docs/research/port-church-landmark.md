# Gutuevsky Island: Epiphany Church

Researched and newly authored 2026-10-31 for the Морские ворота area by a
separate sight specialist. This module claims only OSM `w34863504` at
`[-5259.55, 2633.01]`, Dvinskaya Street 2. The present coastal Overpass query
provides the complete building ring; the church is not replaced by a generic
red-brick church from another district. The parish house and other neighbouring
buildings remain under the city module.

## References inspected

- [Official parish history](https://gutui.ru/history/) identifies V. A. Kosyakov
  and B. K. Pravdzik, construction in 1892–1899, and the approximately 45 m
  summit. Its account explicitly describes the church as a port approach
  landmark. Parish publications also give 48 m, while other references use
  42 m; the model uses the history page's approximate 45 m to the main cross.
- [Saint Petersburg heritage committee: restoration report](https://www.gov.spb.ru/gov/otrasl/c_govcontrol/news/302590/)
  identifies the protected building, the architect and dates. The official
  record describes the continuing restoration of its paintings rather than
  an invented modern interior.
- [Diocesan historical account](https://globus.aquaviva.ru/books/pages/tserkov-bogoyavleniya-gospodnya-na-gutuevskom-ostrove)
  documents the red brick and gold-ground mosaic facade decoration, its
  riverbank setting and relationship to the port.
- [East facade, photographed 2025](https://sobory.ru/pic/00700/00706_20251014_2109490.jpg):
  inspected in detail. The large dome has a silver scale-covered upper field
  with a broad, intricately scalloped gilded lower band. It is not an all-gold
  generic onion. The main drum has tall narrow arched windows, thin paired
  brick shafts, repeating small arch bands and a deep cornice. The smaller
  side tents are dark slate with scale courses; eastern chapel has its own
  small gilded onion and carved portal.
- [West facade, photographed 2021](https://sobory.ru/pic/00700/00706_20210109_171249.jpg):
  inspected in detail. A many-layered brick arch frames the twin dark doors;
  gold-ground mosaic panels flank the axis. The western belfry is octagonal
  and open, with a dark tent and a small gilded onion. Low stone steps lead to
  the entrance from the parish forecourt.
- [View across the Ekateringofka, photographed 2021](https://sobory.ru/pic/00700/00706_20210109_171200.jpg):
  inspected in detail. Establishes the relative heights of the dominant drum,
  west belfry and two side tents, as well as the long horizontal brick base
  and attached eastern chapel.
- [OpenStreetMap footprint](https://www.openstreetmap.org/way/34863504),
  © OpenStreetMap contributors, ODbL. The current ring controls the lower
  walls and thin wall colliders. The local architectural frame is centred at
  `[-5257.5, 2633.2]`, rotated `-0.028` radians around Y.

The three downloaded reference photographs are local research files under
`shots/refs-port-church/`, not shipped textures. The brick map and stylised
mosaic atlas are newly drawn. Their icon figures communicate the photographed
gold-ground facade panels; they do not claim to reproduce the conservation
painting or identify individual historical icon subjects.

## Geometry and scene behaviour

The silhouette keeps the central silver/gold dome, the open western belfry,
two side tents and eastern chapel. Dome, shafts and roofs remain in the
distant skyline; brick arches, scale seams, icon panels and window lattices
use authored 300–650 m detail ranges. Two open arched tiers in the belfry are
actual openings through the geometry, so sky and the silent bells remain
visible. The building is an exterior model, with closed entrance doors.

Lower-wall collision follows the exact OSM ring, without blocking the quay,
Dvinskaya carriageway or adjacent water. The entrance steps are registered as
walkable surfaces. No fence, lamp, street sign, vehicle, flag or new sound is
placed by the church module. Existing district furniture keeps its normal
breakability and the river/boat channel stays under the area and bridge owners.

Roof heights, minor ornament dimensions and the mosaic drawings are
photo-derived approximations. The module models the restored exterior seen
in the 2021/2025 references; it does not assert a day-specific arrangement of
restoration scaffolding in late 2026.

## Verification and review

`node tools/check.mjs landmarksPortChurch` passes: 42,644 triangles, 42 source
meshes, 16 materials, two canvas textures totalling 458,752 pixels, 23
colliders including four walkable steps, and no frame callbacks. The build
takes approximately 118 ms on this machine. This is headless geometry/API
evidence, not a city performance benchmark.

The integrated river-side screenshot `shots/coastal-author/harbour_2.png`
was compared with the three facade photographs. It confirmed the relative
positions of the main drum, side tent, open west belfry and eastern chapel.
The close upward view makes the broad gilded dome rim hide much of the silver
cap, as expected from that position. The initially blank octagonal shoulders
were improved after this review with blind arches, paired brick shafts,
maiolica fields and a dentil band at a bounded 650 m range. Final screenshots
follow that correction. The focused `streets,landmarksPortChurch` furniture
audit within 120 m tested 1,190 objects and found no on-road, edge or median
intrusions; it also reported 18 existing street signal-stop extras, outside
the church builder.

The final complete area data exposed a school beside the original northern
photo position, so that exported position was removed. The west portal pose
is verified in play with an 8 m margin, off road, outside nearby buildings,
and with no building 6 m ahead.

The final west-facing scene capture exposed an occluded entrance: its origin
had been estimated at local u = -21.4 m, behind the actual west wall at
-21.72 to -21.81 m. The photographed facade has a deeply layered brick arch,
twin dark doors and two gold-ground mosaics, rather than a blank brick wall.
The complete portal and its four matching walkable steps now follow the live
mapped wall's westernmost local coordinate, with a 0.12 m exterior offset.
The arch orders step forward by 0.04 m and their faces remain separated from
the backing. No wall collider, carriageway, quay or water restriction changed.
The live-area geometry check passes at 42,712 triangles, 42 meshes, 16
materials and 20 colliders; the focused claim audit reports no warning or
cross-owner/unclaimed-building intrusion. A fresh marine bake and west-view
capture follow this correction.

Review poses (x, y, z, yaw, pitch):

- West portal: `-5320, 1.7, 2630, -93, 12`.
- East chapel: `-5204, 1.7, 2614, 68, 15`.
- Overview: `-5340, 48, 2530, -140, -6`.

Serial screenshot/z-fighting review, district road audits and integrated bake
and performance checks are the integration owner's checkpoint work.
