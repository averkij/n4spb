# Finland Station and Lenin Square reference dossier

The specialist module is `landmarksFinlyandskyStation`. It owns the station
building family, two mapped platform canopy buildings, the mapped platform
surface and Lenin monument. The shared `props/fountains.js` builds the actual
mapped fountain basins and live jets, droplets and impact ripples; there is no
second fountain model laid over it.

## References inspected

1. [Alex Fedorov's frontal photograph, 13 July 2013](https://commons.wikimedia.org/wiki/File:Finlandsky_Rail_Terminal.jpg).
   Downloaded outside the repository and visually inspected at full screen.
   The photograph establishes eighteen recessed glazed facade bays, reliefs
   above each bay, pale stone cladding, the central glass-and-metal tower and
   the relation of the approximately 100 m facade to the very slender spire.
2. [Finban2 aerial photograph](https://commons.wikimedia.org/wiki/File:Finban2.JPG).
   Downloaded and inspected. This distinguishes the rear western wing from
   the main transverse terminal and shows long narrow island canopies and the
   open track fan; a single broad shed would be inaccurate.
3. [Mark Hughes, Lenin at Finland Station](https://www.markgh.co.uk/Russia/SaintPetersburg/Lenin.html)
   and [the large close-up used](https://www.markgh.co.uk/Russia/SaintPetersburg/FinlandStation1.jpg).
   Downloaded and inspected. The monument is a standing overcoated figure
   gesturing with his right arm, above an abstract black granite armoured-car
   prow/turret. It is neither a realistic wheeled car nor a square classical
   plinth. Coat opening, lapels, bald head, goatee and stance inform the figure.
4. [DP, 30 April 2025, clock tower photograph](https://www.dp.ru/a/2025/04/30/nabashne-finljandskogo-vokzala).
   Its [image](https://dpru.obs.ru-moscow-1.hc.sbercloud.ru/images/article/2025/04/30/0f014334-a51e-4a58-9ea3-af5dfadfe199.jpg)
   was downloaded and inspected. The current exterior has silver lettering
   and a dark full-faced clock with white ticks. The older blue lettering
   and transparent numeral ring in the 2013 photograph were not copied.
   Mechanical failure reported in the article is not authored as a permanent
   condition of this summer scene. Corporate logos are omitted under project
   rules; the station's plain bilingual name remains.
5. [Finlyandsky municipal district's illustrated guide, pages 3–4](https://finokrug.spb.ru/files/file/1346668969_Broshura_VMESTE_Veselo_Shagat2012.pdf).
   The primary municipal source describes twenty separate basins: a large
   central basin, two octagonal basins, one rectangular basin and eight small
   basins on either side. Its old transport schedules are not used.
6. [OpenStreetMap station relation](https://www.openstreetmap.org/relation/2123616),
   [mapped Lenin monument](https://www.openstreetmap.org/relation/8850275) and
   [mapped platform relation](https://www.openstreetmap.org/relation/12715182).
   Fresh OSM geometry is supplied by the area's geography generator. These
   surveyed footprints control positioning rather than coordinates estimated
   from photographs. Attribution: OpenStreetMap contributors, ODbL.
7. [Oleg-BY, platform-facing terminal, photographed 28 July 2022](https://railwayz.info/photolines/photo/135420).
   The actual full photograph was downloaded and inspected during the detail
   review. It resolves the seven tall rear glazing bays, narrow upper transoms,
   paired entrance doors, low curved ticket-hall roof, and two roof names:
   «САНКТ-ПЕТЕРБУРГ» and «SAINT PETERSBURG». The first release's featureless
   platform-facing wall was therefore replaced with these architectural parts.
8. [Passenger canopy and city exit, 23 August 2015](https://railwayz.info/photolines/photo/63290).
   Downloaded and inspected. The roof covers a white windowed shelter, with
   broad opaque soffits and transverse ribs, not a line of bare steel poles.
   Its surveyed OSM roof dimensions are used; facade details and height are
   photo-derived estimates. No tunnel or staircase absent from the model is
   implied as a functioning route.
9. [Buildings beside the first platform, 23 August 2015](https://railwayz.info/photolines/photo/63280)
   and [cross-platform forecourt, 9 July 2011](https://railwayz.info/photolines/photo/19261).
   Both full photographs were downloaded and inspected. They establish the
   two-storey rhythm of the older platform wing, pale window surrounds and
   cornices, plus the open track fan. The photographs are architectural references;
   no historical railway logos, advertising or flags are copied.

## Position and measurements

All coordinates are in the existing city's metre frame. The south-facing
station facade is the actual straight footprint edge from `(236,-2584.6)` to
`(333.4,-2557.1)`, 101.2 m long. Its centre is `(284.7,-2570.85)` and the Three.js
Y rotation is `-atan2(27.5,97.4)`. The front normal points southwest. Tower
footprint centre: `(286.9,-2578.1)`, approximately 8 x 8 m. Main station relation
`r2123616`; elevated parts `w158544845`, `w158544862`, `w314291447`, `w820662808`.
The full irregular rear wing is retained from the map and has instanced window
surrounds, glazing and mullions. Its platform-facing central edge runs from
local u −20.1 to +19.9 at v −58.4 m, carrying seven glazed bays and a low barrel
roof. Actual low canopy buildings `w158544503` and `w158544582` control the two
white windowed shelters. In the station facade frame their roof bounds are
u −10.9..−4.3 and +22.6..+30.6, v −199.4..−154.2 m, approximately 45.2 m long.

The model's 15.8 m main facade, roughly 13 m of glass tower above it, 30 m
tapering spire and approximately 2.74 m clock radius are **modelling estimates**
informed by the photographs, with the clock's published 5.5 m diameter as a
scale check. OSM's coarse building `height=10` cannot describe both the
facade and tower. The main spire terminates in a simple needle; the unsupported
five-pointed star of the first release was removed after photographic review.
Shelter lengths/widths are mapped, with roof heights (4.43–4.95 m) and small
window/door dimensions inferred from the platform photographs. The earlier
five invented 192 m canopy rows were removed, preserving the real open track fan.
Reliefs are varied low-poly processions/railway workers rather than exact
reproductions of every historical sculpture.

Lenin monument: `(233.4,-2407.8)`, mapped `r8850275`, about 10.7 m model height
including its stepped support. Figure pose comes from the inspected close-up,
using the shared articulated human sculpture kit. Plinth dimensions and height
are visual estimates. A three-car unbranded suburban electric set stands on
mapped terminal track `w1076914002`; car placement follows its exact tangent.
The railway continues north toward Kushelevka as cheap mapped strips, with
instanced sleepers only within the station throat. Elevated/bridge/tunnel
records are not incorrectly flattened into street-level railway.

## Rendering and verification

All geometry is immutable, `ctx.addStatic`-submitted, with finite LOD ranges:
silhouettes 2600 m, architecture/rails 650 m, reliefs and facade labels 240 m,
sleepers 430 m, commuter windows 500 m. The central clock hands are a static
non-alarm architectural detail. This builder adds **zero frame callbacks**.
Repeated sleepers and commuter glazing use instancing. Existing streets and
props own forecourt paving, trees, breakable lamps/benches and fountains.
There are no flags, flagpoles, sirens or corporate logos.

`node tools/area.mjs finlyandsky tools/check.mjs landmarksFinlyandskyStation`
passes after the detail review with fresh area data: 89,889 triangles including
4,786 instances, 40 pre-batch meshes, 58 architectural/vehicle colliders, zero
update functions. Sign textures are at most 1024×128; repeated side-wing windows
are ordinary static instances marked as attached building facades. The strict
focused claims audit draws all nine claims and finds no intrusion into another
owner or unclaimed building.
Platform paving is clipped with the shared convex subtraction helper against
expanded actual carriageway segments and junction fillets. Railway metal and
sleepers also leave road-clear gaps. The human kit's coat-fold parameter is a
metre amplitude (`.035`), not a fold count; the final statue's body bounds are
about five metres high and 1.9 metres across, without a stretched coat sheet.
Final integrated screenshot/bake evidence belongs to the lead's area report.
