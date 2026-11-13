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

## Position and measurements

All coordinates are in the existing city's metre frame. The south-facing
station facade is the actual straight footprint edge from `(236,-2584.6)` to
`(333.4,-2557.1)`, 101.2 m long. Its centre is `(284.7,-2570.85)` and the Three.js
Y rotation is `-atan2(27.5,97.4)`. The front normal points southwest. Tower
footprint centre: `(286.9,-2578.1)`, approximately 8 x 8 m. Main station relation
`r2123616`; elevated parts `w158544845`, `w158544862`, `w314291447`, `w820662808`.
The full irregular rear wing is retained from the map. Actual low canopy
buildings `w158544503` and `w158544582` are integrated into the longer canopy
rows; the twenty-five slender canopy supports have architectural proportions.

The model's 15.8 m main facade, roughly 13 m of glass tower above it, 30 m
tapering spire and approximately 2.74 m clock radius are **modelling estimates**
informed by the photographs, with the clock's published 5.5 m diameter as a
scale check. OSM's coarse building `height=10` cannot describe both the
facade and tower. Canopy length/height (192 m / 4.88 m), number and proportions
are photo-derived approximations aligned to the actual platform fingers.
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
passes with fresh area data: 78,187 triangles including 4,034 instances,
32 pre-batch meshes, 40 architectural/vehicle colliders, zero update functions.
Platform paving is clipped with the shared convex subtraction helper against
expanded actual carriageway segments and junction fillets. Railway metal and
sleepers also leave road-clear gaps. The human kit's coat-fold parameter is a
metre amplitude (`.035`), not a fold count; the final statue's body bounds are
about five metres high and 1.9 metres across, without a stretched coat sheet.
Final integrated screenshot/bake evidence belongs to the lead's area report.
