# Russian National Library: circular entrance and fountain forecourt

Updated 2026-11-01. The seven owner-supplied photographs are modelling
references, not textures. The first three establish the open circular
colonnade, roof oculus, square slender columns, curved inscription, recessed
arched glazing and broad granite approach. Photograph 4 establishes the
grey paving with offset dark blocks, clipped planting and paired black
lamps. Photographs 1 and 5 establish the modern six-bowl fountain; photograph
6 shows the full-length Speransky statue and polished black plinth. Photograph
7 establishes the low glazed underpass pavilion, authored separately.

The source project was inspected before authoring. The current district
builder had a coarse circular building but no detailed fountain square. The
maintained area data supplies the building/grass/path footprints, fountain
envelope and monument nodes. Building/stair geometry belongs to
`library.js` / `library-plan.js`; forecourt geometry belongs to
`library-forecourt.js`, with import-free area masks in
`library-forecourt-plan.js`. The shared stair toe is x = -1798.1 over the
central 34 m approach; the new pool starts another 19 m east of it.

## Evidence and map reconciliation

The city's broadcaster records the actual
[Vodokanal explanation of the reconstruction](https://tvspb.ru/programs/stories/3153140):
the earlier two basins and intervening walking space were replaced by one
basin containing bowls at two levels. Its
[2024 operating-season report](https://tvspb.ru/news/2024/04/28/u-zdaniya-rossijskij-naczionalnoj-biblioteki-zarabotal-fontan-chasha-znanij)
confirms the public name **Чаша знаний**. These primary operator statements
and the supplied current photographs take precedence over stale interior
geometry in the OSM extract.

OSM WATER `w31523998` and `w134429977` still contain the two earlier lobed
basins. Their outer lobes span x = -1778.8 .. -1749.3,
z = 7427.5 .. 7479.4. The authored current pool retains that approximately
29.5 × 51.9 m surveyed outer envelope and joins the obsolete central gap.
The plan is not replaced with a generic circle. Two large central bowls lie
on the main axis near z = 7453.5, with four smaller bowls at the outer lobes.
Their diameters, heights, jets and plumbing are estimates from photographs;
there is no claim to survey the exact nozzle installation or hydraulics.

The [library's Speransky opening announcement](https://nlr.ru/nlr_visit/RA9862/TSeremoniya-otkrytiya-pamyatnika-Speranskomu)
and the [commissioner's monument record](https://rvio.ru/activities/monumens/sozdanie-pamyatnogo-mesta-posvyashennogo-m-m-speranskomu)
establish the May 2025 monument at the new library. The latter identifies the
historical portrait references used by its sculptors. The model represents
the photographed long coat, bent arm and dark plinth with an inscription;
it is a stylized figure, not a portrait scan.

| Mapped record | Position | Treatment |
| --- | --- | --- |
| `n14090538301`, М. М. Сперанский | -1807.9, 7491.6 | Exact current node; photographed standing figure and black plinth |
| `n14090538201`, А. Ф. Кони | -1810, 7411 | Exact current counterpart node; standing bronze figure and named plinth |
| `n12014514686`, older Кони node | -1748.9, 7407.3 | Claimed as stale duplicate; no second invented Koni figure |

Surrounding lawns retain the mapped GREEN rings and diagonal OSM approaches.
The grey square/block pattern is an authored repeating texture; it does not
copy photographs. Paving subtracts the exact triangulated lawn/pool rings,
and lawns clip back to the forecourt boundary. Both have matching physical
floor triangles; there are no sampled tile-edge gaps where generic ground
is removed. One world-anchored material supplies the paving pattern.
Small seasonal red beds and four white-flower urns are
photo-derived approximations. Furniture positions are estimated around the
mapped approach rather than asserted to be surveyed OSM nodes.

## Scene behaviour and rendering

The main basin has its real shallow floor at y = 0.16, native water at
y = 0.24, and a low steppable coping. Its interior has no blocking cylinder.
All six upper bowls also register shallow native water and physical floors;
their real pedestal and thin upper rim remain structural geometry. Each
tapered pedestal has 12 physical top triangles and 24 physical side triangles
matching the drawn frustum, rather than an approximate solid post cylinder.
Upper
water registers before the underlying pool because the shared registry
returns the first matching surface. The live landmark builder registers
these rings on every boot, including when environment/city load from bake.
The area water mask uses the unified pool, while ownership identifies both
stale fountain records.

Seats, paired lamps, bins and memorial flower urns use `knockInstances` with
shared geometry/material parts, finite ranges and the maintained 384 m
Dynamic cells. Their upright colliders are removed by impacts. Immutable
architecture, water, paving and plants use the district's bounded material
buckets; jets are static geometry. No per-frame callback or extra light is
introduced. Native basin water supplements the existing walking, driving
and boating rules; no transport restriction is added around the square.

## Verification

`node tools/area.mjs moskovskaya tools/library-forecourt-test.mjs --integrated`
builds real environment, streets, city and the full district without a GPU.
It passes native
water and drawn-floor checks for the main pool and all six upper bowls,
actual Player entry/exit across the main coping in both directions, ascent
and descent of both large drum basins on their four broad treads, exact
monument presence, and representative knock removal for every furniture
class. Another **2,397 probes** verify both physical support and actual
front-sided authored mesh coverage below the water surface across the owned
footprint, including exact lawn/paving joins after generic ground removal.
All predecessor fountain and monument IDs have landmark ownership; footprint
probes for every bench, lamp, bin and urn stay off actual carriageways.
Another **144 independent mesh rays** compare physical pedestal heights with
their drawn faces. Low-body probes block inside every tapered support, remain
free outside it, and resolve lateral penetration at basin level. The full
Moskovskaya water suite passes **15/15**, including its near-water collision
audit, without an exemption for these fountain supports.
Photo 1 distinguishes the two stepped cylindrical principal drums from the
four flared corner cups. The large drums have thin physical course rings
and hollow interiors; four low treads on their opposite approaches keep
the upper shallow water reachable on foot without obstructing the gap.
The final forecourt measures **13,016 static triangles**,
six bowls, two statues, eight benches, six paired lamps, four bins and four
flower urns. This is module evidence, not integrated frame-rate evidence.
The full district checker measures **209,839 triangles against its 210,000
budget**, with zero update callbacks. The forecourt retains 144 jet curves,
using uncapped thin triangular tubes instead of capped cylinders at every
internal joint. Upper coping already drawn by the bowl lathes is not drawn
again as duplicate boxes. Paving subtraction rejects disjoint cut bounds
before clipping, preserving exactly the same footprint without unnecessary
fragmentation. These changes retain all furniture, bowls and mapped lawns.

The parent agent reviewed nine integrated library views, including the final
stepped drum silhouettes, clear title and corrected western stairs. It owns
normal-page checks, final budgets, baking and release. A native water
pose proves a basin has water; it does not by itself prove every possible
vehicle approach to every elevated ornamental bowl.
