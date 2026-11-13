# Finlyandsky waterfront detail review

## Follow-up: upper promenade support and paving

The reported car drop at `(176.3, -2314)` had a different cause from a missing
walking floor. The polygonal upper apron used exact `addWalkTriangle` colliders,
which Physics represents as sticky ramps. The car's generic low-floor branch
accepts ordinary walk boxes, so it ignored those triangles and used the Neva
bed beneath the upper platform. The waterfront now publishes a bounded deck
service over its actual floor handles, and the area lists that service beside
the Neva bridges. The service uses the same physical slabs/treads as walkers;
it does not invent a flat collision plane across the stair holes.

The thin blue kerb slit was caused by the hydraulic/ground cut ending exactly
at the upper granite edge. Generic street paving correctly keeps 0.45 m clear
of such an edge, exposing water beside the slab. Only the cut's landward edge
now ends 0.75 m inside the solid upper apron. The visible granite/road boundary
and its asphalt clearance stay exact, while the street and apron overlap on
dry ground. The same dry overlap is applied at the grotto's upper approach.

The second reported location, above the generic Kresty descent near
`(1000.58, -2325.73)`, exposed the default ground mix between the mapped quay
and street paving. A continuous granite approach follows the surveyed bank
from x = 857.7 to x = 1162.6, including the small mapped landing notches. Its width
is 6.5–8 m, constrained by the road, with a top at 0.14 m: two centimetres above
the old pavement so that old path ribbons cannot show through it. Exact dry
ground cuts and the matching terrain-height triangles retain every stair and
water opening. It reuses the Lenin descent's material and textures, has a
finite render range and adds no callbacks or fixed above-ground barriers.

The expanded focused regression passes ten checks. It adds 1,568 samples
at no more than 0.35 m intervals along the curved street/slab join, checking
actual rendered coverage, physical support and absence of a wet slit. Two
four-second real car runs cover 35.4 m and 22.6 m across the upper platform,
at wheel heights 0.03–0.13 m with zero falling frames. Another 118 probes prove
the Kresty upper approach agrees with drawn triangles, terrain, Physics and
dry water classification. The earlier lower-walk continuity, boarding and
breakable-parapet tests continue to pass.

Research and implementation: 13 November 2026. Scope: the right Neva bank at
Lenin Square and the Bezborodko grotto landing. The regular Pirogovskaya,
Arsenalnaya and Sverdlovskaya bank remains owned by the environment and the
area's continuous promenade profile. These two sites replace that generic
profile only inside their explicit survey rings.

## References actually consulted

1. [Mostotrest: Arsenalnaya embankment](https://mostotrest-spb.ru/embankments/arsenalnaya-naberezhnaya)
   is the operator's primary description. It explicitly gives **136 metres**
   for the monumental Lenin Square descent, credits architect A. V. Vasilyev
   and engineer L. N. Sobolev, and describes the two-level banks near Liteyny
   and east of the ceremonial landing. The current government mirror has the
   same text: [Mostotrest government site](https://mostotrest-spb.krti.gov.spb.ru/embankments/arsenalnaya-naberezhnaya).
2. [Mostotrest: Sverdlovskaya embankment](https://mostotrest-spb.krti.gov.spb.ru/embankments/sverdlovskaya-naberezhnaya)
   describes the two-level section between Arsenalnaya and Piskarevsky, upper
   and lower sidewalks and the green slope toward Vatutin. This is why a
   uniformly tall sheer wall is insufficient for the new area's whole coast.
3. [Saint Petersburg Encyclopedia: Lenin Square](https://www.encspb.ru/object/2804018855?dv=2853950737&lc=ru)
   dates the monumental descent to 1970. Its architectural relationship is
   the axis of the square and station, with terraces at the sides.
4. [Municipal history of the Bezborodko estate](https://xn----8sbahoqodlumpk.xn--p1ai/info/istoricheskaya-spravka/vokrug-da-okolo-zagorodnoy-dachi-grafa-grigoriya-aleksandrovicha-kusheleva-bezborodko/)
   describes the grotto, broad multistep descent, granite vases and stone-faced
   embankment slope. The estate's separate lion fence across the road is not
   confused with the four sphinxes of the river landing.
5. [Bezborodko photo gallery](https://spb.guide/dacha-bezborodko-foto.htm).
   The [wide winter photograph](https://spb.guide/img/505/dacha-bezborodko-prichal-1118.webp)
   and [close sphinx photograph](https://spb.guide/img/505/dacha-bezborodko-sfinks-na-pristani--1134.webp)
   were downloaded and visually inspected. They establish the grey rough
   granite, broad dressed coping, arched barred grotto, flanking flights,
   stone pedestals, human-headed reclining lions and the absence of the tall
   Egyptian crowns seen at the Academy's entirely different sphinx pier.
6. [T—J photograph and article](https://t-j.ru/short/egipetskaya-sila/).
   The [large front view](https://opis-cdn.tinkoffjournal.ru/mercury/06-egipetskaya-sila.jpg)
   was downloaded and visually inspected. It clearly shows the paired sphinxes
   facing inward toward each other, radiating granite arch blocks, a carved
   lion-head keystone, fine vertical iron bars and scroll bands above/below
   those bars. These details corrected the first construction pass.
7. [Commons: Arsenalnaya embankment and Lenin Square](https://commons.wikimedia.org/wiki/File:%D0%90%D1%80%D1%81%D0%B5%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F_%D0%BD%D0%B0%D0%B1%D0%B5%D1%80%D0%B5%D0%B6%D0%BD%D0%B0%D1%8F_%D0%B8_%D0%BF%D0%BB%D0%BE%D1%89%D0%B0%D0%B4%D1%8C_%D0%9B%D0%B5%D0%BD%D0%B8%D0%BD%D0%B0.jpg)
   was downloaded and inspected for the granite bank courses, pale pink-grey
   stone, low seaward wall and relationship to the square. The distant view
   alone is insufficient to infer exact individual tread dimensions.
8. [ASN, 9 June 2026: Arsenalnaya descent restoration](https://asninfo.ru/news/124109-obnovleniye-u-nevy-kak-menyayetsya-spusk-na-arsenalnoy-naberezhnoy-v-peterburge)
   republishes the official Mosty Peterburga report: granite slab and stair
   restoration and extensive joint repairs. It corroborates dressed granite
   and visible joints; temporary construction equipment is not introduced
   into the game's summer scene.

The supplied area's OSM extract was inspected alongside these references.
Coordinates below are in the project's existing metre calibration, with +z
south. No remote photographic bitmap is shipped as a game texture.

## Survey and authored geometry

`src/world/finlyandskyWaterfront/sites.js` is a pure data module imported by the
area and owner module. It supplies claims, Neva ground-cut rings, generic-bank
suppression rings and generic-descent/furniture keep-outs. This prevents the
new geometry from sitting on top of a second generic wall or stair.

### Lenin Square

The frame centre is `(203.1, -2291.05)`, tangent approximately `(0.980, 0.200)`.
The official frontage is 136 m. The three mapped transverse stair centre lines
are `w1151087787`, `w1192940644` and `w1192940647`. The longitudinal side
flights are `w1151087788` and `w1151087791`. Their lower promenade is
`w1151087789`. Curved end platforms follow `w1151087790` and `w1151087792`;
they are polygonal stone curves, not rectangular wings pushed into the river.

The lower promenade connects the five actual flights. Dressed tread nosings,
slab courses, curved parapet returns and retaining faces are authored at the
surveyed positions. The left street kerb turns toward the river. `LENIN_BACK`
follows that kerb; the earlier rectangular rear plate was removed after a road
coverage probe found it intruded onto the asphalt. The same boundary trims
the Neva owner ring, so no terrain cut enters that carriageway.

### Bezborodko

The front grotto face is centred at `(2711.95, -2883.85)`, tangent approximately
`(0.925, 0.381)`. Building `r7357196` is the mapped underground grotto, about
70 m². Its surveyed front endpoints are `(2707.7, -2885.6)` and
`(2716.2, -2882.1)`; the rear is around z=-2891. The roof is a real walkable slab
over a chamber with an arched hole, side/rear retaining walls and a dark
interior. The iron arch gate is a separate knockable object.

The two flanking mapped stair lines are:

| OSM ID | Street end | Lower end |
| --- | --- | --- |
| w174641823 | 2710.0, -2896.4 | 2705.1, -2883.6 |
| w174641825 | 2723.0, -2890.9 | 2717.4, -2878.6 |

Four distinct mapped sphinx positions are retained (`n1219705794`,
`n1219706742`, `n3634704063`, `n3634704064`) and six vase positions
(`n2088817312`, `n2088817321`, `n2088817442`, `n2088817470`, `n3634704065`,
`n3634704066`). They use shared instanced sculptural geometry. Each sphinx has
a lion's low body, folded hindquarters, extended front paws, human face and
simple headcloth. Paired statues face inward along the quay as in the front
photograph. Fixed pedestals belong to the monument's architecture. Its iron
railing has repeated scroll bands and vertical bars. All railing panels and
lower granite parapet bays use the project's knock system.

## Vertical datum and limits of precision

The continuous bank profile uses a 58-point slice of the mapped Neva right
bank, resampled at at most 6 m. The lower walk is 3.6 m wide; the upper edge
is constrained by surveyed road widths and a road-clearance margin. Its
retaining tier changes to a grass slope east of Vatutin. Seven mapped access
flights meet this walk. The Piskarevsky maintenance driveway `w700719390`
and diagonal path `w701717146` are draped over the actual terrain; the driveway
retains a clear opening in the shoreline parapet. The source extractor is
`tools/prepare-finlyandsky-banks.mjs`, the pure profile is
`src/areas/finlyandsky/bank-profile.js`, and the builder is
`src/world/finlyandskyBanks.js`.

This profile cuts the flat environment ground and old walking ribbons using
the existing area hook/ground-hole contracts. It does not add the dry grass
or pavement to the water mask. Its height patch uses the exact drawn triangles,
and all retaining/shore surfaces below the footway share the Neva datum.
Low parapet bays are independently knockable with finite render ranges; the
module has no update callbacks. Generic trees and loose props are rejected
inside the replacement terrain rather than left floating above the slope.

All connected water uses `NAVIGABLE_WATER_Y = -3.4 m`. Both lower promenades are
at `Neva + 1.4 m = -2.0 m`, matching the area-wide lower promenade; the upper paving
is at 0.10 m. These street-relative heights, individual tread counts, slab
thicknesses and sculpture dimensions are reconstruction estimates rather
than a published elevation survey. Mapped plan positions and official 136 m
frontage are stronger constraints than those estimates. Side flight widths
are fitted to the surveyed statue/vase piers and photographs.

Only the seven mapped flights are constructed. No extra front-facing stairs
are invented at either landing. Low boarding gaps and breakable shoreline
parapets preserve foot and car access to water. Retaining wall solids stop
at the pavement they support. There is no fixed collider across a railing,
parapet or grotto gate that remains after its knock record breaks.

Materials use two repeating procedural stone textures per site: slab joints,
rough mineral grain and staggered ashlar courses. Sculpture and dressed
coping use shared toon materials. Thin dark staining is confined to the
actual waterline, rather than a dark stripe across dry promenade walls.

## Verification

`node tools/area.mjs finlyandsky tools/check.mjs finlyandskyWaterfront` passes.
Latest measured cost: approximately 77k triangles, 37 authored meshes including
20 instanced meshes, 17 materials, 1,048,576 canvas pixels, 314 colliders and no
frame callbacks. Bays of the same type are consolidated before registration;
142 knockable bays own every fence collider. Finite authored LOD is 1450 m for
stone masses, 450 m for masonry detail, 620 m for granite parapets, 320 m for iron
panels/vases and 360 m for sphinxes.

A CPU probe of the real area layout and physics sampled all seven stair
centre lines at 847 positions. Every flight descends continuously from upper
to lower level, with maximum adjacent height change below 0.17 m. It caught and
fixed a rotated tread/landing numerical seam and a narrow upper-platform
sliver at a side-flight exit. A real street-net coverage probe found no upper
stone face centroid on asphalt (closest margin approximately 0.54 m clear).
All 142 fence boxes were verified against the knock registry.

The integration regression
`node tools/area.mjs finlyandsky tools/finlyandsky-waterfront-test.mjs`
now passes ten checks against the real built scene, Physics, Player and knock
registry. In addition to the upper-promenade checks described above, its
185 lower-walk and 101 green-slope probes compare visible
triangles with terrain/physics, and reject old flat environment ground or
street ribbons over the depression. Another 4,243 probes at ≤0.5 m spacing
check continuous support through the whole lower walk and both end ramps.
All 205 actual walk boxes match drawn floors and have valid vertical volumes;
all 1,077 shoreline bays are independently breakable. A real walker reaches
the Neva bed through both boarding gaps (2.60 m depth). On the green bank the
same walk is blocked by a standing parapet, then enters the water after that
one bay is knocked down. Logs are in `shots/finlyandsky-review/`.

The final integration run also passes water-level checks in all 23 areas
(Finlyandsky: 536 rendered cuts, 536 physics and 95 mouth samples), the full
roads audit (zero failing furniture intrusions, 108 residual surface samples
within the existing 120 allowance, ribbon check OK), and strict geometric
marking checks (46,287/46,287 solid plan points covered). The open-edge scan
in the shared water-reachable regression now follows actual ground height
when selecting a walk; previously it tested a flat street-level capsule and
mistook the lower promenade's parapet for an open edge. The existing Palace
open-quay entry and bed-running checks still pass with that correction.
On the frozen final source,
`node tools/area.mjs finlyandsky tools/water-reachable-test.mjs --quick`
passes all 17 checks, including car water access and lower landing support;
`node tools/area.mjs finlyandsky tools/boat-passage-test.mjs --quick`
passes all 24 checks, including connected boat-free water and bridge passage.

The claims audit now handles underground owner geometry generically. The
grotto record has `layer=-1` and no mapped height: its chamber is below the
street and its roof is at 0.10 m. Negative-layer / underground records use
below-grade structural geometry, with supplied negative `minH` and height
bounds respected. Missing dimensions never become invented depths, and the
top centimetre below grade is excluded so a surface ground plane cannot
substitute for the chamber. The grotto has 28 qualifying owner centroids;
normal building and unclaimed-intrusion thresholds remain unchanged.

For claimed ways whose narrow ribbons contain no triangle centroid, the
audit tests exact owner triangles at 20%, 50%, and 80% of the surveyed
centreline. Every sample must hit an upward non-foliage surface within any
mapped vertical bounds. This proves the three short Lenin footways are on
the lower landing at -2.000 m and two bank ways are supported at 0.000 m
and on the ramp (-1.534..-0.282 m). This fallback never satisfies building
claims, and neither fix adds an area or object exception.

`node tools/area.mjs finlyandsky tools/claims-draw-audit.mjs --modules finlyandskyWaterfront,finlyandskyBanks --strict`
passes all 64 owned IDs with zero warnings and five surface-coverage notes
(`shots/finlyandsky-review/waterfront-claims-strict.log`). Removing the
grotto's owner geometry with `--mutant undraw:r7357196` correctly fails with
one building problem and zero warnings (`waterfront-claims-undraw.log`).
Removing a short way with `--mutant undraw:w1192940642` also correctly fails
strict mode with one warning: the exact-surface fallback cannot recover
omitted owner geometry (`waterfront-claims-line-undraw.log`).

Integration review cameras: Lenin from river `(203,-2241)`, yaw 0°, pitch 9°;
grotto from river `(2698,-2822)`, yaw -12.7°, pitch 7°. The parent integration
pass owns GPU screenshots, integrated water/boat checks, source version and
bake revision updates.
