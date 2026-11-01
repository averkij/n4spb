# Park Pobedy pedestrian underpass beside the library

Reviewed 2026-11-01 against the owner's pavilion photograph (Photo 7), the
Moskovskaya OSM extract and the whole-city `102_3d_piter` source.

The two reported tall buildings are not absent from the map: they are the long,
low entrance shelters. Their missing height tags caused the generic building
generator to give them an inappropriate mass. The source records are retained
and claimed by `mz-library-underpass`; the new builder supplies the real open
stairs, central shops and low glass/metal skylight canopies.

| Record | Mapped role | Scene treatment |
| --- | --- | --- |
| [w134205326](https://www.openstreetmap.org/way/134205326) | Western retail/shelter footprint, about 5m by 30m | Low glazed shelter with open north/south stair mouths and a central generic cafe bay. |
| [w134205325](https://www.openstreetmap.org/way/134205325) | Eastern retail/florist footprint, about 6.8m by 30m | Corresponding low shelter and two stair mouths. No real shop brand is invented. |
| [w32967047](https://www.openstreetmap.org/way/32967047) | Pedestrian tunnel at layer -1 | Crossing from (-1736.8,7382.9) to (-1691.2,7381.8). |
| w40349748 / w1361718093 | Western south/north stair flights | Actual mapped surface endpoints retained. |
| w40349795 / w1361718094 | Eastern south/north stair flights | Actual mapped surface endpoints retained. |
| w142389769 / w142389773 | Western median entrance | Open stair flight to the crossing. |
| w142389771 / w142389770 | Eastern median entrance | Open stair flight, shifted 0.9m west to fit the modeled median. |

The same pavilion footprints and four outer stair/tunnel records exist in the
whole-city source. No separately authored source underpass module was found.
The live OSM website was inaccessible through the research browser; the exact
records above were inspected directly in both local OSM facades. Their mapped
centre lines and the owner's photograph are the geometry evidence.

The photo shows a long low glazed/metal structure with a shallow skylight roof,
dark low retaining walls, a slightly taller central shop and open stair ends.
This vocabulary is modeled directly. Interior finishes and lighting are modest
estimates, not a measured reconstruction. The -3.8m floor derives from the
mapped 23-step outer flights using approximately 16.5cm risers. Stair width and
headroom are authored within the mapped shelters; the tunnel's source 2.4m
width is a default highway inference, so the usable crossing is modeled 4m wide.

The eastern carriageway has an inferred 14m width. At the mapped eastern median
stair centre it leaves only 0.409m to its asphalt edge. Shifting that stair 0.9m
west accommodates the entire pit, thin retaining cheeks and railing posts.
Outer shelter footprints and tunnel endpoints stay in their mapped positions;
the road width and asphalt are retained.

`library-underpass-plan.js` is the shared pure source for the six ground cuts,
stair routes and shelter footprints. Both the environment ground and street
walking ribbons consume these `kind:'stairs'` holes; carriageways remain whole.
The two footprint IDs are explicitly excluded from the generic solid ground
mask while remaining in the source building records. Actual shop and retaining
wall colliders provide their physical solids.

All tread, landing, tunnel-floor and road slabs have finite thickness. The
overhead slab ends at -0.72m, leaving headroom above the -3.8m floor. No floor
uses a default deep solid column. Rail sections use the shared knock-instance
helper with visible moving parts and removable physical colliders. Underground
geometry has its own visibility tag and bounded ranges; there are no builder
frame callbacks.

Focused verification is `node tools/area.mjs moskovskaya
tools/library-underpass-test.mjs --integrated`. It checks all six holes against
actual ground/paving rays, every tread's drawn/support height, sixteen real
walking routes, four actual red-car road crossings and a rail impact. The
`--mutant-solid-deck` option deliberately restores an infinitely deep road slab
and must fail the underground clearance assertion.

The integrated CPU run passed 132 opaque-surface opening rays over all six
stair pits, 174 tread rays, sixteen walking routes (8,434 player updates), four
red-car crossings and an actual rail knock. Transparent lamp-pool decals were
excluded from physical-floor ray checks. A broad tram-bed cobble ribbon was
found over the edge of the eastern median pit; the parent fixed the shared
street builder to clip that infill with the same holes. Carriageway asphalt
and rail steel remain continuous. The finite-deck mutation failed as intended.
Logs: `shots/library-underpass/integrated.log` and
`shots/library-underpass/mutant-solid-deck.log`. Rendered visual review remains
the parent task's serialized GPU step.

The first procedural visual review exposed a west-mouth visibility defect:
the reported street camera was 0.5m outside the stair end while its indoor zone
extended only 0.3m. The underground-only stair group was therefore hidden,
leaving sky through an otherwise correct cut. A scoped `zones.reveal` approach
region now reveals only this crossing from the street; the actual zone manager
is exercised in the focused test. A no-reveal mutation fails at the exact west
camera. Glazed surface entrances keep the outdoor sky and shadows; only the
enclosed underground corridor uses the indoor background.
