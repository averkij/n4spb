# Strugatsky Square and Boris Strugatsky's home

Reference review: 2026-11-01. `landmarksMoskovskaya/square.js` owns small garden
detail and the memorial. Streets, city and environment retain mapped roads,
surrounding houses and paths. The square module restores lawns and tree groups
suppressed by the source's broad square-paving polygon.

## Sources inspected

- [District administration, naming](https://www.gov.spb.ru/gov/terr/reg_moscow/news/52160/): Moskovsky, Frunze and Pobedy junction; Boris's home at Pobedy 4.
- [Toponymic Commission](https://toponimika.spb.ru/cat/pl-bratev-strugatskikh.html): named 12 August 2014; Boris lived nearby in 1964–2012.
- [District administration, memorial opening](https://www.gov.spb.ru/gov/terr/reg_moscow/news/255781/): 2 March 2023; stainless steel; architect Tatyana Karakozova and Soyuz 55. Search excerpt accessible; full page timed out during this pass.
- [Elena Skorodumova's original photographs, MR7](https://mr-7.ru/articles/2023/03/02/ia-ne-znaiu-chto-takoe-slava-news): visually inspected close-up of steel book, page edges, rivets, circular profile and inscription, plus ceremony photograph of flowers against the brick facade.
- [Dmitry Ratnikov's square photograph, Kanoner](https://kanoner.com/2014/08/15/140166/): visually inspected granite lawn edges, clipped low hedges, taller shrubs, broad paved routes and surrounding apartment blocks.
- [Yandex Maps memorial and user photographs](https://yandex.com/maps/org/boris_natanovich_strugatskiy/5813530948/): visually inspected projecting steel spine and white-painted brick wall; location note identifies the corner face on the Pobedy side. Corroborative photographic/map evidence, not an architectural survey.
- Current OpenStreetMap extract in `moskovskaya/data/city.js`, © OpenStreetMap contributors, ODbL. Its real rings and centrelines determine the details, rather than an invented symmetric plan.

Reference photos remain in the session temp directory; none is shipped as a texture.

## Geometry and ownership

| Feature | Mapped records | Treatment |
| --- | --- | --- |
| Northwest / southwest gardens | w29171389 / w29171421 | Retain unequal outlines, curved northern perimeter and irregular southwestern edge. |
| Northeast / southeast gardens | w29382034 / w31264819 | Retain diagonal Pobedy approach and outer service streets. |
| Circular seating pads | w134206932 / w134206925 | Existing paving and radial path entries stay open. |
| Ten benches | n7400068258–n7400068262 and n4439466244–n4439466248 | Exact nodes facing their circular pad; slatted timber and dark supports, registered with knock. Shared bench service suppresses generic duplicates. |
| Boris's home | w44499732, улица Победы, 4 | Generic seven-storey apartment block retained; memorial normal derived from southern corner face. |

The four gardens remain separated by real asphalt and the avenue median. No
single broad plaza surface or path replacement is added. The source has no
individual tree nodes in these gardens; the generic square mask suppressed its
procedural trees and lawns. Local lawn cells exclude all mapped path strips and
the circular seating pads. Modest photo-derived lime/maple groups restore the
gardens' identity; their exact trunk locations and species are estimates.
The area treeReject hook excludes these four rings from generic generation,
and local placement also skips nearby environment trees. Trees use immutable,
bounded instances from the maintained environment geometry with finite LOD
ranges; no per-frame repacking or updates are introduced.
Shrubs fit inside mapped lawns, avoid trees and benches, and keep footways and
seating pads clear. Granite edge pieces sit on the lawn side, stop at crossings,
and never cover asphalt. They have no collision walls. Hedge height, seasonal
flower choice and density are restrained photographic estimates, not a surveyed
current planting inventory.

The memorial's estimated 1.06 × 1.56 m size and 2.65 m centre height are derived
from photographs. The projecting closed-book cover, dark profile medallion,
wire spectacles and short readable inscription carry its identity. The relief
is stylized geometry. The whole rectangle is reserved with the label service;
an occupied mounting rectangle is skipped. Position along the surveyed corner
face is an estimate; building and facade orientation are verified. No fictional
literary statue or invented official sign is added. A small 2.4 m painted-brick
corner bay replaces the generic builder's placeholder windows at the mounting
point, matching the blank white-brick support visible in the photographs.

## Verification checkpoint

- `node tools/area.mjs moskovskaya tools/strugatsky-square-test.mjs`: passes four gardens, ten exact mapped benches, knock/collider removal, shared duplicate suppression, asphalt clearance, 48 local trees, visible lawns and the correct memorial home.
- `node tools/area.mjs moskovskaya tools/check.mjs landmarksMoskovskaya`: full district landmark module 178,757 triangles, 60 meshes (12 instanced), 26 materials, zero update callbacks, 815 ms CPU build in this pass; below its 180,000-triangle budget.
- Local strict road-furniture audit around `-1700,7880,150`: zero on-road or edge objects; passes. Road-surface audit in the same circle: 4,742 samples; passes with only existing wide-median exceptions, no square-module offenders.
- Inspected `shots/strugatsky/final_0.png` (overhead), `final_1.png` (seating) and `final_2.png` (memorial). The final brick texture repetition is verified in `zfight_1.png`.
- Real-renderer z-fight checks with environment, streets, city and district landmarks: seating 13 pixels / 0.001%; memorial 7 pixels / 0.001%; zero identical-frame differences and no listed offenders. Renderer: RTX 3090 Ti via D3D11, medium quality, procedural `baked=0` context. These authoring views are not integrated FPS/loading benchmark evidence.

Only the memorial corner bay is specifically modeled on Boris's home; its
remaining shell retains generic city architecture. Exact plant species, tree
positions and memorial relief are documented visual estimates.
